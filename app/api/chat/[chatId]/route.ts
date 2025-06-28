export const dynamic = "force-dynamic";


import { LangChainStream } from "ai";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { MemoryManager } from "@/lib/memory";
import { rateLimit } from "@/lib/rate-limit";
import prismadb from "@/lib/prismadb";

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { CallbackManager } from "@langchain/core/callbacks/manager";

export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is undefined.");
    return new NextResponse("Server misconfiguration: GEMINI API key missing", {
      status: 500,
    });
  }

  try {
    const { prompt } = await request.json();
    console.log("Prompt received:", prompt);

    const user = await currentUser();
    if (!user || !user.firstName || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const identifier = request.url + "-" + user.id;
    const { success } = await rateLimit(identifier);
    if (!success) {
      return new NextResponse("Rate limit exceeded", { status: 429 });
    }

    if (typeof prompt !== "string" || prompt.trim() === "") {
      return new NextResponse("Invalid prompt", { status: 400 });
    }

    const companion = await prismadb.companion.update({
      where: { id: params.chatId },
      data: {
        messages: {
          create: {
            content: prompt,
            role: "user",
            userId: user.id,
          },
        },
      },
    });

    if (!companion) {
      return new NextResponse("Companion not found", { status: 404 });
    }

    const companionKey = {
      companionName: companion.id,
      userId: user.id,
      modelName: "gemini-1.5-flash",
    };

    const memoryManager = await MemoryManager.getInstance();
    const records = await memoryManager.readLatestHistory(companionKey);
    if (records.length === 0) {
      await memoryManager.seedChatHistory(companion.seed, "\n\n", companionKey);
    }

    await memoryManager.writeToHistory(`User: ${prompt}\n`, companionKey);
    const recentChatHistory = await memoryManager.readLatestHistory(companionKey);

    const similarDocs = await memoryManager.vectorSearch(
      recentChatHistory,
      companion.id + ".txt"
    );

    let relevantHistory = "";
    if (similarDocs?.length) {
      relevantHistory = similarDocs.map((doc) => doc.pageContent).join("\n");
    }

    const chatMessages = recentChatHistory
      .split("\n")
      .map((line) => {
        if (line.startsWith("User: ")) {
          return new HumanMessage(line.replace("User: ", ""));
        } else if (line.startsWith("AI: ")) {
          return new AIMessage(line.replace("AI: ", ""));
        }
        return null;
      })
      .filter(Boolean) as (HumanMessage | AIMessage)[];

    chatMessages.push(new HumanMessage(prompt));

    const { stream, writer } = LangChainStream();

    const model = new ChatGoogleGenerativeAI({
      model: "models/gemini-1.5-flash",
      apiKey: GEMINI_API_KEY, 
      maxOutputTokens: 2048,
      temperature: 0.7,
      streaming: true,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
      callbacks: CallbackManager.fromHandlers({
        handleLLMNewToken: (token) => writer.write(token),
        handleLLMEnd: () => writer.close(),
        handleLLMError: (e) => {
          console.error("LLM Error:", e);
          writer.close();
        },
      }),
    });

    const systemInstruction = `
You are ${companion.name}.
${companion.instruction}

Below are relevant details about the context of this conversation:
${relevantHistory}
    `;

    const messagesToSend = [
      new HumanMessage(systemInstruction),
      ...chatMessages,
    ];
const result = await model.invoke(messagesToSend);

const rawContent =
  typeof result.content === "string"
    ? result.content
    : JSON.stringify(result.content); // fallback if it's complex content

const response = rawContent.trim();
const cleanedResponse = response.replaceAll(",", "");
const finalText = cleanedResponse.split("\n")[0];


    await memoryManager.writeToHistory(`AI: ${finalText}\n`, companionKey);

    await prismadb.companion.update({
      where: { id: params.chatId },
      data: {
        messages: {
          create: {
            content: finalText,
            role: "system",
            userId: user.id,
          },
        },
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[CHAT_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
