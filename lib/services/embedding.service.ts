import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.log('Google AI API not configured - returning mock embedding');
      return new Array(768).fill(0).map(() => Math.random() - 0.5);
    }

    const result = await model.embedContent(text);
    const embedding = result.embedding;
    return embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Return a properly sized zero vector matching the expected dimension
    return new Array(768).fill(0);
  }
}
