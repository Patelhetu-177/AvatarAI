import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = 'gemini-2.5-flash';

type Message = {
  role: 'user' | 'model' | 'system';
  parts: { text: string }[];
};

export class ChatService {
  private static instance: ChatService;
  private genAI: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  private constructor() {
    try {
      this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
      this.model = this.genAI.getGenerativeModel({
        model: MODEL_NAME,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      safetySettings: [],
      });
      console.log(`Initialized Google Generative AI with model: ${MODEL_NAME}`);
    } catch (error) {
      console.error('Error initializing Google Generative AI:', error);
      throw new Error(`Failed to initialize AI model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  public async generateResponse(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>): Promise<string> {
    try {
      const chatHistory: Message[] = [];
      
      for (const msg of messages) {
        if (msg.role === 'system') {
          chatHistory.push({
            role: 'user',
            parts: [{ text: msg.content }],
          });
          chatHistory.push({
            role: 'model',
            parts: [{ text: 'I understand.' }],
          });
        } else if (msg.role === 'user' || msg.role === 'assistant') {
          chatHistory.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          });
        }
      }

      console.log('Starting chat with history:', JSON.stringify(chatHistory, null, 2));

      const chat = this.model.startChat({
        history: chatHistory.slice(0, -1),
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      const lastMessage = chatHistory[chatHistory.length - 1];
      console.log('Sending message:', lastMessage.parts[0].text);
      
      const result = await chat.sendMessage(lastMessage.parts[0].text);
      const response = await result.response;
      const text = response.text();

      console.log('Received response:', text);
      return text;
    } catch (error) {
      console.error('Error in ChatService.generateResponse:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorDetails = error instanceof Error ? error.stack : String(error);
      console.error('Error details:', errorDetails);
      
      if (error && typeof error === 'object' && 'message' in error) {
        if (error && typeof error === 'object' && 'response' in error) {
          const errorWithResponse = error as { response?: unknown };
          console.error('Error response:', errorWithResponse.response);
        }
        if (error && typeof error === 'object' && 'status' in error) {
          const errorWithStatus = error as { status?: unknown };
          console.error('Error status:', errorWithStatus.status);
        }
      }
      
      throw new Error(`Failed to generate response: ${errorMessage}`);
    }
  }
}
