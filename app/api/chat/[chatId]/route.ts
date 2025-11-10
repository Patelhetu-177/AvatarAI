export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { MemoryManager } from "@/lib/memory";
import { Prisma, Role } from "@prisma/client";
import { BaseMessage, AIMessage, HumanMessage } from "@langchain/core/messages";
import prismadb from "@/lib/prismadb";
import { rateLimit } from "@/lib/rate-limit";
import { ChatService } from "@/lib/services/chat.service";
import languages from "@/app/common/languages";

const chatService = ChatService.getInstance();

export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  const startTime = Date.now();

  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const memoryManager = await MemoryManager.getInstance();
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) return new NextResponse("Missing API Key", { status: 500 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body.prompt !== "string" || body.prompt.trim() === "") {
      return new NextResponse("Invalid prompt", { status: 400 });
    }

    const prompt = body.prompt.trim();
    const selectedLanguageCode = (body.lang as string) || "en";
    const identifier = `${request.url.split("?")[0]}-${userId}`;
    
    const { success } = await rateLimit(identifier);
    if (!success) return new NextResponse("Rate limit exceeded", { status: 429 });

    let aiEntity;
    let aiEntityType: "companion" | "interviewMate" | null = null;

    const interviewMate = await prismadb.interviewMate.findUnique({ 
      where: { id: params.chatId } 
    });
    
    if (interviewMate) {
      aiEntity = interviewMate;
      aiEntityType = "interviewMate";
    } else {
      const companion = await prismadb.companion.findUnique({ 
        where: { id: params.chatId } 
      });
      if (companion) {
        aiEntity = companion;
        aiEntityType = "companion";
      }
    }

    if (!aiEntity || !aiEntityType) {
      return new NextResponse("AI entity not found", { status: 404 });
    }

    const { name, instruction, seed } = aiEntity;
    const companionKey = {
      companionName: aiEntity.id,
      userId,
      modelName: "gemini-1.5-flash-latest",
    };

    const records = await memoryManager.readLatestHistory(companionKey);
    if (records.length === 0) {
      await memoryManager.seedChatHistory(seed, "\n\n", companionKey);
    }

    const userMessageData: Prisma.MessageUncheckedCreateInput = {
      content: prompt,
      role: "user",
      userId,
      companionId: aiEntityType === "companion" ? aiEntity.id : null,
      interviewMateId: aiEntityType === "interviewMate" ? aiEntity.id : null,
    };

    await Promise.all([
      prismadb.message.create({ data: userMessageData }),
      memoryManager.writeToHistory(`User: ${prompt}\n`, companionKey)
    ]);

    const recentChatHistory = await memoryManager.readLatestHistory(companionKey);
    const chatMessages: BaseMessage[] = recentChatHistory
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        if (line.startsWith("User: ")) {
          return new HumanMessage(line.replace("User: ", "").trim());
        }
        if (line.startsWith("AI: ")) {
          return new AIMessage(line.replace("AI: ", "").trim());
        }
        return null;
      })
      .filter(Boolean) as BaseMessage[];

    const messages = chatMessages.length > 0 ? [...chatMessages] : [];
    messages.push(new HumanMessage(prompt));

    const similarDocs = await memoryManager.vectorSearch(
      recentChatHistory, 
      `${aiEntity.id}.txt`
    );

    const relevantHistory = similarDocs
      ?.map(([doc]) => (typeof doc.pageContent === "string" ? doc.pageContent : ""))
      .join("\n") || "";

    const currentLanguageLabel = languages[selectedLanguageCode]?.label || "English";
    const systemPrompt = `You are ${name}.
${instruction}

Your persona and conversational style are critical. Maintain a consistent tone as described in your instructions.

IMPORTANT: You MUST respond in ${currentLanguageLabel} (${selectedLanguageCode}) at all times, regardless of the user's language. 
- If the user writes in a different language, still respond in ${currentLanguageLabel}.
- If you don't know a word in ${currentLanguageLabel}, use the closest equivalent.
- Never switch languages unless explicitly asked to do so.

Here is relevant context from past conversations or knowledge base:
${relevantHistory || "No additional context available."}`;

    const chatServiceMessages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      ...messages.map(msg => ({
        role: (msg._getType() === 'human' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: msg.content as string
      }))
    ];

    const recentChatHistoryText = chatServiceMessages
      .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
      .join('\n');

    const relevantContext = await memoryManager.vectorSearch(
      recentChatHistoryText,
      companionKey.companionName
    );

    const enhancedMessages = [...chatServiceMessages];
    if (relevantContext) {
      enhancedMessages.unshift({
        role: 'user',
        content: `Context from previous conversations: ${relevantContext}`
      });
    }

    const response = await chatService.generateResponse(enhancedMessages);
    const finalAIResponseContent = response.trim();

    await Promise.all([
      memoryManager.writeToHistory(
        `User: ${prompt}\nAI: ${finalAIResponseContent}`,
        companionKey
      ),
      memoryManager.limitHistory(companionKey, 10)
    ]);

    const aiResponse = {
      content: finalAIResponseContent,
      timestamp: new Date().toISOString(),
      metadata: {
        model: "gemini-pro",
        tokens: Math.ceil(finalAIResponseContent.length / 4),
        isAI: true,
        responseTime: `${Date.now() - startTime}ms`
      }
    };

    await prismadb.message.create({
      data: {
        content: JSON.stringify(aiResponse),
        role: Role.system,
        userId,
        companionId: aiEntityType === 'companion' ? aiEntity.id : null,
        interviewMateId: aiEntityType === 'interviewMate' ? aiEntity.id : null,
      }
    });

    return NextResponse.json({
      success: true,
      data: aiResponse,
      meta: {
        timestamp: new Date().toISOString(),
        model: "gemini-pro"
      }
    });

  } catch (error: unknown) {
    console.error("[CHAT_POST_ERROR]", error);
    const errorMessage = error instanceof Error 
      ? error.message 
      : "An unexpected error occurred. Please try again later.";
    
    return new NextResponse(
      JSON.stringify({ error: errorMessage }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
