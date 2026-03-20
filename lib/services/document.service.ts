import { Pinecone, Index } from "@pinecone-database/pinecone";
import { Document } from "@langchain/core/documents";
import { getEmbedding } from "./embedding.service";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { formatDocumentContent } from "../utils/documentFormatter";
import RedisService from "./redis.service";
import { PineconeStore } from "@langchain/pinecone";
import JSZip from "jszip";
import { DOMParser } from "xmldom";

interface DocumentMetadata {
  source: string;
  type?: string;
  size: number;
  pageNumber?: number;
  contentLength?: number;
  processedAt?: string;
  [key: string]: unknown;
}

class CustomGoogleEmbeddings {
  private embedFn: (text: string) => Promise<number[]>;

  constructor(embedFn: (text: string) => Promise<number[]>) {
    this.embedFn = embedFn;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const embedding = await this.embedFn(text);
      results.push(embedding);
    }
    return results;
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.embedFn(text);
  }
}

export class DocumentService {
  private pineconeIndex: Index | null = null;
  private getEmbedding: (text: string) => Promise<number[]>;
  private textSplitter: RecursiveCharacterTextSplitter;
  private redis: typeof RedisService;

  constructor() {
    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX) {
      throw new Error("Pinecone environment variables are not set");
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("Google Generative AI API key is not set");
    }

    this.getEmbedding = getEmbedding;

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    this.redis = RedisService;
  }

  private async getPineconeIndex(): Promise<Index> {
    if (!this.pineconeIndex) {
      const pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY!,
      });
      this.pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);
    }
    return this.pineconeIndex;
  }

  private getCacheKey(source: string, pageNumber?: number): string {
    return `doc:${source}${pageNumber ? `:${pageNumber}` : ""}`;
  }

  private extractTextFromSlide(xmlContent: string): string {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      const textNodes = xmlDoc.getElementsByTagName("a:t");
      let text = "";
      for (let i = 0; i < textNodes.length; i++) {
        text += textNodes[i].textContent + " ";
      }
      return text.trim().replace(/\s+/g, " ");
    } catch (error) {
      console.error("Error extracting text from slide:", error);
      return "";
    }
  }

  public async processDocument(
    file: File,
  ): Promise<Document<DocumentMetadata>[]> {
    const fileType = file.name.split(".").pop()?.toLowerCase() || "";
    const cacheKey = this.getCacheKey(file.name);

    try {
      const cached =
        await this.redis.get<Document<DocumentMetadata>[]>(cacheKey);
      if (cached) {
        console.log(`Cache hit for document: ${file.name}`);
        return Array.isArray(cached) ? cached : [];
      }
    } catch (cacheError) {
      console.warn(
        `Cache lookup failed for ${file.name}, proceeding without cache:`,
        cacheError,
      );
    }

    const metadata: DocumentMetadata = {
      source: file.name,
      type: fileType,
      size: file.size,
      processedAt: new Date().toISOString(),
    };

    let content = "";

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (fileType === "pdf") {
        const { default: pdf } = await import("pdf-parse");
        const data = await pdf(buffer);
        content = data.text;
      } else if (["doc", "docx"].includes(fileType)) {
        const { extractRawText } = await import("mammoth");
        const result = await extractRawText({ buffer });
        content = result.value;
      } else if (["xls", "xlsx"].includes(fileType)) {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        content = workbook.SheetNames.map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          return `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(worksheet)}`;
        }).join("\n\n");
      } else if (["ppt", "pptx"].includes(fileType)) {
        try {
          const zip = await JSZip.loadAsync(buffer);
          const slideTexts: string[] = [];
          let slideIndex = 1;

          while (zip.file(`ppt/slides/slide${slideIndex}.xml`)) {
            const slidePath = `ppt/slides/slide${slideIndex}.xml`;
            const slideContent =
              (await zip.file(slidePath)?.async("text")) || "";
            const slideText = this.extractTextFromSlide(slideContent);
            if (slideText) {
              slideTexts.push(`Slide ${slideIndex}:\n${slideText}\n`);
            }
            slideIndex++;
          }

          const noteTexts: string[] = [];
          let noteIndex = 1;

          while (zip.file(`ppt/notesSlides/notesSlide${noteIndex}.xml`)) {
            const notePath = `ppt/notesSlides/notesSlide${noteIndex}.xml`;
            const noteContent = (await zip.file(notePath)?.async("text")) || "";
            const noteText = this.extractTextFromSlide(noteContent);
            if (noteText) {
              noteTexts.push(`Notes ${noteIndex}:\n${noteText}\n`);
            }
            noteIndex++;
          }

          content = [...slideTexts, ...noteTexts].join("\n\n").trim();

          if (!content) {
            throw new Error("No extractable text found in PowerPoint file");
          }
        } catch (error) {
          console.error("Error processing PowerPoint file:", error);
          throw new Error(
            "Failed to process PowerPoint file. For best results, please convert to PDF before uploading.",
          );
        }
      } else if (fileType === "txt") {
        content = buffer.toString("utf-8");
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }

      if (!content || content.trim().length === 0) {
        throw new Error(`No text content could be extracted from ${file.name}`);
      }

      const formattedDoc = formatDocumentContent(
        new Document({
          pageContent: content,
          metadata: {
            ...metadata,
            source: file.name,
            type: fileType,
            size: file.size,
          },
        }),
        content,
      );

      const docText = formattedDoc.sections
        .map((section) => {
          const title = section.title ? `## ${section.title}\n\n` : "";
          const sectionContent = Array.isArray(section.content)
            ? section.content.map((item) => `- ${item}`).join("\n")
            : section.content;
          return `${title}${sectionContent}`;
        })
        .join("\n\n");

      const splitDocs = (await this.textSplitter.createDocuments(
        [docText],
        [
          {
            ...metadata,
            documentId: formattedDoc.id,
            documentTitle: formattedDoc.title,
          },
        ],
        {
          chunkHeader: `DOCUMENT: ${formattedDoc.title || file.name}\n\n`,
          appendChunkOverlapHeader: true,
        },
      )) as unknown as Document<DocumentMetadata>[];
      // Cache — store as JSON string
      try {
        await this.redis.set(
          `doc:${formattedDoc.id}`,
          JSON.stringify(formattedDoc),
        );
        await this.redis.set(cacheKey, JSON.stringify(splitDocs), 3600);
      } catch (cacheError) {
        console.warn(
          `Failed to cache document ${file.name}, continuing without cache:`,
          cacheError,
        );
      }

      return splitDocs;
    } catch (error) {
      console.error(`Error processing document ${file.name}:`, error);
      throw new Error(
        `Error processing document ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  public async storeDocumentVectors(
    documents: Document<DocumentMetadata>[],
  ): Promise<void> {
    try {
      const index = await this.getPineconeIndex();

      if (!documents || documents.length === 0) {
        throw new Error("No documents provided for vector storage");
      }
      const embeddings = new CustomGoogleEmbeddings(this.getEmbedding);

      const testEmbedding = await embeddings.embedQuery(
        documents[0].pageContent.substring(0, 500),
      );
      if (!testEmbedding || testEmbedding.length === 0) {
        throw new Error(
          "Embedding model returned empty vector. Check GOOGLE_GENERATIVE_AI_API_KEY.",
        );
      }

      const batchSize = 10;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(documents.length / batchSize);
        console.log(`Processing batch ${batchNum}/${totalBatches}`);

        await PineconeStore.fromDocuments(batch, embeddings, {
          pineconeIndex: index,
          namespace: "documents",
          textKey: "text",
        });
      }

      console.log("Successfully stored all document vectors");
    } catch (error) {
      console.error("Error storing document vectors:", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        documentCount: documents?.length || 0,
        sampleDocument:
          documents?.[0]?.pageContent?.substring(0, 100) || "No content",
      });
      throw new Error(
        `Failed to store document vectors: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  public async searchSimilarDocuments(
    query: string,
    k: number = 5,
  ): Promise<Document<DocumentMetadata>[]> {
    try {
      const index = await this.getPineconeIndex();

      const embeddings = new CustomGoogleEmbeddings(this.getEmbedding);

      const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex: index,
        namespace: "documents",
      });

      const results = await vectorStore.similaritySearch(query, k);
      return results as Document<DocumentMetadata>[];
    } catch (error) {
      console.error("Error searching similar documents:", error);
      throw new Error("Failed to search similar documents");
    }
  }
}

export const documentService = new DocumentService();
