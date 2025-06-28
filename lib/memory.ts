import { Redis } from "@upstash/redis";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"; // Changed import
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
  private vectorDBClient: Pinecone;

  public constructor() {
    this.history = Redis.fromEnv();
    this.vectorDBClient = new Pinecone();
  }

  public async init() {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY is not set");
    }
    // if (!process.env.PINECONE_ENVIRONMENT) { // Pinecone often needs an environment variable
    //   throw new Error("PINECONE_ENVIRONMENT is not set");
    // }
    if (!process.env.PINECONE_INDEX) {
        throw new Error("PINECONE_INDEX is not set");
    }

    this.vectorDBClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
      // environment: process.env.PINECONE_ENVIRONMENT, // Add environment if needed by your Pinecone setup
    });
  }

  public async vectorSearch(
    recentChatHistory: string,
    companionFileName: string
  ) {
    const pineconeClient = this.vectorDBClient; // Type assertion not strictly necessary if `this.vectorDBClient` is already `Pinecone`

    const pineconeIndex = pineconeClient.Index(
      process.env.PINECONE_INDEX!
    );

    // IMPORTANT: Use GoogleGenerativeAIEmbeddings here
    const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GEMINI_API_KEY, // Ensure GEMINI_API_KEY is set in your .env
        modelName: "embedding-001", // This is the recommended Gemini embedding model
    });

    const vectorStore = await PineconeStore.fromExistingIndex(
      embeddings, // Pass the Gemini embeddings
      { pineconeIndex }
    );

    const similarDocs = await vectorStore
      .similaritySearch(recentChatHistory, 3, { fileName: companionFileName })
      .catch((err: Error) => {
        if (err.message.includes("429")) {
          console.log(
            "WARNING: API quota exceeded. Please check your Gemini/Google AI plan and usage limits."
          );
        } else {
          console.log("WARNING: failed to get vector search results.", err);
        }
        return null; // Ensure the error doesn't propagate further
      });
    return similarDocs;
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

  public async writeToHistory(text: string, companionKey: CompanionKey) {
    if (!companionKey || typeof companionKey.userId == "undefined") {
      console.log("Companion key set incorrectly");
      return "";
    }

    const key = this.generateRedisCompanionKey(companionKey);
    const result = await this.history.zadd(key, {
      score: Date.now(),
      member: text,
    });

    return result;
  }

  public async readLatestHistory(companionKey: CompanionKey): Promise<string> {
    if (!companionKey || typeof companionKey.userId == "undefined") {
      console.log("Companion key set incorrectly");
      return "";
    }

    const key = this.generateRedisCompanionKey(companionKey);
    let result = await this.history.zrange(key, 0, Date.now(), {
      byScore: true,
    });

    result = result.slice(-30).reverse(); // Keep only the last 30 messages
    const recentChats = result.reverse().join("\n");
    return recentChats;
  }

  public async seedChatHistory(
    seedContent: string,
    delimiter: string = "\n",
    companionKey: CompanionKey
  ) {
    const key = this.generateRedisCompanionKey(companionKey);
    if (await this.history.exists(key)) {
      console.log("User already has chat history");
      return;
    }

    const content = seedContent.split(delimiter);
    let counter = 0;
    for (const line of content) {
      await this.history.zadd(key, { score: counter, member: line });
      counter += 1;
    }
  }
}