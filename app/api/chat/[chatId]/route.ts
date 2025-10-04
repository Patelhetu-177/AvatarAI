export const dynamic = "force-dynamic";

import { LangChainStream } from "ai";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { MemoryManager } from "@/lib/memory";
import { rateLimit } from "@/lib/rate-limit";
import prismadb from "@/lib/prismadb";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { CallbackManager } from "@langchain/core/callbacks/manager";
import languages from "@/app/common/languages";
import { Prisma } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) return new NextResponse("Missing API Key", { status: 500 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body.prompt !== "string" || body.prompt.trim() === "")
      return new NextResponse("Invalid prompt", { status: 400 });

    const prompt = body.prompt.trim();
    const selectedLanguageCode = (body.lang as string) || "en";

    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const identifier = `${request.url.split("?")[0]}-${userId}`;
    const { success } = await rateLimit(identifier);
    if (!success) return new NextResponse("Rate limit exceeded", { status: 429 });

    let aiEntity;
    let aiEntityType: "companion" | "interviewMate" | null = null;

    const interviewMate = await prismadb.interviewMate.findUnique({ where: { id: params.chatId } });
    if (interviewMate) {
      aiEntity = interviewMate;
      aiEntityType = "interviewMate";
    } else {
      const companion = await prismadb.companion.findUnique({ where: { id: params.chatId } });
      if (companion) {
        aiEntity = companion;
        aiEntityType = "companion";
      }
    }

    if (!aiEntity || !aiEntityType) return new NextResponse("AI entity not found", { status: 404 });

    const { name, instruction, seed } = aiEntity;
    const companionKey = {
      companionName: aiEntity.id,
      userId,
      modelName: "gemini-1.5-flash-latest",
    };

    const memoryManager = await MemoryManager.getInstance();
    const records = await memoryManager.readLatestHistory(companionKey);
    if (records.length === 0) await memoryManager.seedChatHistory(seed, "\n\n", companionKey);

    let userMessageData: Prisma.MessageUncheckedCreateInput;
    if (aiEntityType === "companion") {
      userMessageData = {
        content: prompt,
        role: "user",
        userId,
        companionId: aiEntity.id,
        interviewMateId: null,
      };
    } else {
      userMessageData = {
        content: prompt,
        role: "user",
        userId,
        companionId: null,
        interviewMateId: aiEntity.id,
      };
    }

    await prismadb.message.create({ data: userMessageData });
    await memoryManager.writeToHistory(`User: ${prompt}\n`, companionKey);

    const recentChatHistory = await memoryManager.readLatestHistory(companionKey);
    const chatMessages: BaseMessage[] = recentChatHistory
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => {
        if (line.startsWith("User: ")) return new HumanMessage(line.replace("User: ", "").trim());
        if (line.startsWith("AI: ")) return new AIMessage(line.replace("AI: ", "").trim());
        return null;
      })
      .filter(Boolean) as BaseMessage[];

    chatMessages.push(new HumanMessage(prompt));

    const similarDocs = await memoryManager.vectorSearch(recentChatHistory, `${aiEntity.id}.txt`);

    const relevantHistory = similarDocs
      ?.map(([doc]) => (typeof doc.pageContent === "string" ? doc.pageContent : ""))
      .join("\n") || "";

    const { stream, writer } = LangChainStream();

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash-preview-09-2025",
      apiKey: GEMINI_API_KEY,
      maxOutputTokens: 2048,
      temperature: 0.7,
      streaming: true,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      callbacks: CallbackManager.fromHandlers({
        handleLLMNewToken: (token) => writer.write(token),
        handleLLMEnd: () => writer.close(),
        handleLLMError: (e: Error) => { console.error("LLM Error:", e); writer.close(); },
      }),
    });

    const currentLanguageLabel = languages[selectedLanguageCode]?.label || "English";

    const systemInstruction = `
You are ${name}.
${instruction}

Your persona and conversational style are critical. Maintain a consistent tone as described in your instructions.
Always respond in ${currentLanguageLabel}.

Here is relevant context from past conversations or knowledge base:
${relevantHistory || "No additional context available."}

Remember to keep responses natural, engaging, and aligned with your persona.
`;

    const result = await model.invoke([new HumanMessage(systemInstruction), ...chatMessages]);

    const finalAIResponseContent =
      typeof result.content === "string" ? result.content.trim() : JSON.stringify(result.content);

    await memoryManager.writeToHistory(`AI: ${finalAIResponseContent}\n`, companionKey);

    let aiMessageData: Prisma.MessageUncheckedCreateInput;
    if (aiEntityType === "companion") {
      aiMessageData = {
        content: finalAIResponseContent,
        role: "system",
        userId,
        companionId: aiEntity.id,
        interviewMateId: null,
      };
    } else {
      aiMessageData = {
        content: finalAIResponseContent,
        role: "system",
        userId,
        companionId: null,
        interviewMateId: aiEntity.id,
      };
    }

    await prismadb.message.create({ data: aiMessageData });

    return new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (error: unknown) {
    console.error("[CHAT_POST ERROR]", error);

    let errorMessage = "An unexpected error occurred. Please try again later.";
    const statusCode = 500;

    if (error instanceof Error) errorMessage = error.message;

    return new NextResponse(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }
}
