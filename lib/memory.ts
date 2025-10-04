import { Redis } from "@upstash/redis";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";

export type CompanionKey = {
  companionName: string;
  modelName: string;
  userId: string;
};

export class MemoryManager {
  private static instance: MemoryManager;
  private history: Redis;
  private vectorDBClient?: Pinecone;

  private constructor() {
    this.history = Redis.fromEnv();
  }

  private async init() {
    if (this.vectorDBClient) return;
    if (!process.env.PINECONE_API_KEY) throw new Error("PINECONE_API_KEY is not set");
    if (!process.env.PINECONE_INDEX) throw new Error("PINECONE_INDEX is not set");

    this.vectorDBClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }

  public static async getInstance(): Promise<MemoryManager> {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
      await MemoryManager.instance.init();
    }
    return MemoryManager.instance;
  }

  private generateRedisCompanionKey(companionKey: CompanionKey): string {
    return `${companionKey.companionName}-${companionKey.modelName}-${companionKey.userId}`;
  }

  public async vectorSearch(recentChatHistory: string, companionFileName: string) {
    if (!this.vectorDBClient) await this.init();
    const pineconeIndex = this.vectorDBClient!.Index(process.env.PINECONE_INDEX!);

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY!,
      modelName: "gemini-embedding-001",
    });

    const embeddingKey = `embedding:${companionFileName}:${recentChatHistory}`;
    let embedding: number[];

    const cached = await this.history.get<string>(embeddingKey);
    if (cached) {
      embedding = JSON.parse(cached) as number[];
    } else {
      const vector = await embeddings.embedQuery(recentChatHistory);
      embedding = vector;
      await this.history.set(embeddingKey, JSON.stringify(vector), { ex: 3600 });
    }

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
    });

    try {
      const similarDocs = await vectorStore.similaritySearchVectorWithScore(
        embedding,
        3,
        { filter: { fileName: companionFileName } }
      );
      return similarDocs;
    } catch (err: unknown) {
      console.error("Vector search failed:", err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }

  public async writeToHistory(text: string, companionKey: CompanionKey) {
    if (!companionKey?.userId) return "";
    const key = this.generateRedisCompanionKey(companionKey);
    await this.history.zadd(key, { score: Date.now(), member: text });
    return true;
  }

  public async readLatestHistory(companionKey: CompanionKey): Promise<string> {
    if (!companionKey?.userId) return "";
    const key = this.generateRedisCompanionKey(companionKey);
    const total = await this.history.zcard(key);
    const start = total > 30 ? total - 30 : 0;
    const result = await this.history.zrange(key, start, -1);
    return result.join("\n");
  }

  public async seedChatHistory(
    seedContent: string,
    delimiter: string = "\n",
    companionKey: CompanionKey
  ) {
    const key = this.generateRedisCompanionKey(companionKey);
    if (await this.history.exists(key)) return;
    const content = seedContent.split(delimiter);
    let counter = 0;
    for (const line of content) {
      await this.history.zadd(key, { score: counter++, member: line });
    }
  }
}
