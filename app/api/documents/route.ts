import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getEmbedding } from "@/lib/services/embedding.service";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PineconeStore } from "@langchain/pinecone";
import prismadb from "@/lib/prismadb";
import { getPineconeIndex, initPinecone } from "@/lib/services/pinecone.service";
import { loadDocument } from "@/lib/document-loader";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    const document = await prismadb.document.create({
      data: {
        userId,
        title: title || file.name.replace(/\.[^/.]+$/, ''), // Remove file extension from title
        description,
        fileName: file.name,
        fileUrl: `temp/${Date.now()}-${file.name}`,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
      },
    });

    // Use our document loader to handle different file types
    const docs = await loadDocument(file);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const splitDocs = await textSplitter.splitDocuments(docs);

    if (!getPineconeIndex()) {
      await initPinecone();
    }
    
    const pineconeIndex = getPineconeIndex();
    if (!pineconeIndex) {
      throw new Error('Failed to initialize Pinecone index');
    }
    
    await PineconeStore.fromDocuments(splitDocs, {
      async embedDocuments(texts: string[]) {
        return Promise.all(texts.map(text => getEmbedding(text)));
      },
      async embedQuery(text: string) {
        return getEmbedding(text);
      },
    }, {
      pineconeIndex,
      namespace: document.id,
      textKey: 'text',
    });

    const chunks = await Promise.all(
      splitDocs.map(async (doc, i) => {
        const embedding = await getEmbedding(doc.pageContent);
        return {
          documentId: document.id,
          content: doc.pageContent,
          pageNumber: doc.metadata.loc?.pageNumber || i + 1,
          embedding,
          metadata: {
            ...doc.metadata,
            // Ensure we don't store the embedding in the metadata
            // as it's stored separately in the database
            embedding: undefined
          },
        };
      })
    );

    await prismadb.documentChunk.createMany({
      data: chunks,
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("[DOCUMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const documents = await prismadb.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("[DOCUMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
