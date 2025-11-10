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

  private async generateHash(input: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  public async vectorSearch(recentChatHistory: string, companionFileName: string) {
    if (!recentChatHistory || typeof recentChatHistory !== 'string') {
      console.warn('Invalid recentChatHistory in vectorSearch:', recentChatHistory);
      return [];
    }

    if (!companionFileName || typeof companionFileName !== 'string') {
      console.warn('Invalid companionFileName in vectorSearch:', companionFileName);
      return [];
    }

    try {
      if (!this.vectorDBClient) await this.init();
      if (!this.vectorDBClient) {
        throw new Error('Failed to initialize Pinecone client');
      }

      const pineconeIndex = this.vectorDBClient.Index(process.env.PINECONE_INDEX!);
      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY!,
        modelName: "text-embedding-004",
      });

      const inputHash = await this.generateHash(`${companionFileName}:${recentChatHistory}`);
      const embeddingKey = `embed:${inputHash}`;
      let embedding: number[];

      try {
        const cached = await this.history.get<string>(embeddingKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (!Array.isArray(parsed) || !parsed.every(n => typeof n === 'number')) {
              throw new Error('Invalid cached embedding format');
            }
            embedding = parsed;
          } catch (parseError) {
            console.error('Failed to parse cached embedding:', parseError);
            await this.history.del(embeddingKey);
            throw new Error('Invalid cache format');
          }
        } else {
          const vector = await embeddings.embedQuery(recentChatHistory);
          embedding = vector;
          try {
            await this.history.set(embeddingKey, JSON.stringify(vector), { ex: 3600 });
          } catch (cacheError) {
            console.error('Failed to cache embedding:', cacheError);
          }
        }
      } catch (embeddingError) {
        console.error('Error in embedding process:', embeddingError);
        try {
          const vector = await embeddings.embedQuery(recentChatHistory);
          embedding = vector;
        } catch (embedError) {
          console.error('Failed to generate embedding:', embedError);
          return [];
        }
      }

      const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex,
      });

      try {
        const filter = {
          fileName: { $eq: companionFileName }
        };
        
        const similarDocs = await vectorStore.similaritySearchVectorWithScore(
          embedding,
          3,
          { filter }
        );
        
        if (!Array.isArray(similarDocs)) {
          console.warn('Unexpected response format from similarity search');
          return [];
        }
        
        return similarDocs;
      } catch (filteredSearchError) {
        console.warn("Filtered vector search failed, trying without filter:", 
          filteredSearchError instanceof Error ? filteredSearchError.message : 'Unknown error');
        
        try {
          const similarDocs = await vectorStore.similaritySearchVectorWithScore(
            embedding,
            3
          );
          
          if (!Array.isArray(similarDocs)) {
            console.warn('Unexpected response format from fallback similarity search');
            return [];
          }
          
          return similarDocs;
        } catch (unfilteredSearchError) {
          console.error("Unfiltered vector search failed:", 
            unfilteredSearchError instanceof Error ? unfilteredSearchError.message : 'Unknown error');
          return [];
        }
      }
    } catch (error) {
      console.error("Vector search encountered an error:", 
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error.stack : ''
      );
      return [];
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

  public async limitHistory(companionKey: CompanionKey, maxItems: number) {
    const key = this.generateRedisCompanionKey(companionKey);
    // Remove all items except the last maxItems
    await this.history.zremrangebyrank(key, 0, -maxItems - 1);
  }
}
