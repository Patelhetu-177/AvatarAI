import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PineconeStore } from "@langchain/pinecone";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prismadb from "@/lib/prismadb";
import { getPineconeIndex, initPinecone } from "@/lib/services/pinecone.service";
import { getEmbedding } from "@/lib/services/embedding.service";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash'});

const llm = {
  async invoke(input: { context: string; question: string }) {
    try {
      const prompt = `You are an AI assistant that answers questions based on the provided context.

Context:
${input.context}

Question: ${input.question}

Answer the question based on the context above. If the context doesn't contain relevant information, say "I don't have enough information to answer that question."`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating response:', error);
      return "I'm sorry, I encountered an error while generating a response.";
    }
  }
};

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { question, documentId } = await req.json();

    if (!question) {
      return new NextResponse("Question is required", { status: 400 });
    }

    const document = await prismadb.document.findUnique({
      where: { id: documentId, userId },
    });

    if (!document) {
      return new NextResponse("Document not found", { status: 404 });
    }

    if (!getPineconeIndex()) {
      await initPinecone();
    }
    
    const pineconeIndex = getPineconeIndex();
    if (!pineconeIndex) {
      throw new Error('Failed to initialize Pinecone index');
    }

    const vectorStore = await PineconeStore.fromExistingIndex({
      async embedDocuments(texts: string[]) {
        return Promise.all(texts.map(text => getEmbedding(text)));
      },
      async embedQuery(text: string) {
        return getEmbedding(text);
      },
    }, {
      pineconeIndex,
      namespace: documentId,
      textKey: 'text',
    });

    const results = await vectorStore.similaritySearch(question, 5);

    if (results.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find any relevant information in the document to answer your question.",
        sources: [],
      });
    }

    const context = results
      .map((doc, i) => `[${i + 1}] ${doc.pageContent}`)
      .join("\n\n");

    const answer = await llm.invoke({
      context,
      question,
    });

    const sources = results.map((doc) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
    }));

    return NextResponse.json({
      answer,
      sources,
    });
  } catch (error) {
    console.error("[DOCUMENTS_QUERY]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
