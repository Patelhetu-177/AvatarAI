import { Pinecone, PineconeRecord, ScoredPineconeRecord, RecordMetadata } from '@pinecone-database/pinecone';

let pineconeClient: Pinecone | null = null;
import { Index } from '@pinecone-database/pinecone';

let pineconeIndex: Index | null = null;

interface QuestionMetadata {
  questionId: string;
  quizId: string;
  subject: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  text: string;
  timestamp?: string;
  [key: string]: string | number | boolean | undefined;
}

const EMBEDDING_DIMENSION = 768;

export async function initPinecone() {
  try {
    console.log('Initializing Pinecone...');
    
    if (!process.env.PINECONE_API_KEY) {
      console.error('PINECONE_API_KEY is not set');
      return false;
    }
    
    if (!process.env.PINECONE_INDEX) {
      console.error('PINECONE_INDEX is not set');
      return false;
    }

    console.log('Creating Pinecone client...');
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });

    console.log('Getting Pinecone index...');
    pineconeIndex = pineconeClient.Index(process.env.PINECONE_INDEX);

    await pineconeIndex.describeIndexStats();
    console.log('Pinecone initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Pinecone:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      envVars: {
        PINECONE_API_KEY: process.env.PINECONE_API_KEY ? '***' : 'not set',
        PINECONE_INDEX: process.env.PINECONE_INDEX || 'not set',
      }
    });
    pineconeClient = null;
    pineconeIndex = null;
    return false;
  }
}

function validateAndPrepareEmbedding(embedding: unknown): number[] {
  if (!Array.isArray(embedding)) {
    throw new Error('Embedding must be an array');
  }

  const validEmbedding = embedding.map((item): number => {
    const num = Number(item);
    if (isNaN(num)) {
      throw new Error(`Invalid embedding value: ${item}`);
    }
    return num;
  });
  
  if (validEmbedding.length !== EMBEDDING_DIMENSION) {
    console.warn(`Embedding dimension (${validEmbedding.length}) does not match expected (${EMBEDDING_DIMENSION}). Adjusting...`);
    
    const adjustedEmbedding = new Array(EMBEDDING_DIMENSION).fill(0);
    const length = Math.min(validEmbedding.length, EMBEDDING_DIMENSION);
    
    for (let i = 0; i < length; i++) {
      adjustedEmbedding[i] = validEmbedding[i] || 0;
    }
    
    return adjustedEmbedding;
  }
  
  return validEmbedding;
}

type EmbeddingInput = 
  | number[] 
  | string 
  | { values: number[] } 
  | { values: string } 
  | string[];

export async function storeQuestionEmbedding(
  questionId: string, 
  embedding: EmbeddingInput, 
  metadata: Omit<QuestionMetadata, 'questionId' | 'timestamp'>
): Promise<boolean> {
  if (!pineconeIndex) {
    console.error('Pinecone not initialized - cannot store embedding');
    return false;
  }

  try {
    let embeddingArray: number[] = [];
    
    if (Array.isArray(embedding)) {
      if (embedding.length > 0 && typeof embedding[0] === 'number') {
        embeddingArray = embedding as number[];
      } 
      else if (embedding.length > 0 && typeof embedding[0] === 'string') {
        embeddingArray = (embedding as string[]).map(Number).filter(n => !isNaN(n));
      }
    } else if (typeof embedding === 'string') {
      try {
        const parsed = JSON.parse(embedding);
        if (Array.isArray(parsed)) {
          embeddingArray = parsed;
        } else if (parsed && Array.isArray(parsed.values)) {
          embeddingArray = parsed.values;
        }
      } catch (e) {
        console.error('Failed to parse embedding string:', e);
      }
    } else if (embedding && typeof embedding === 'object' && 'values' in embedding) {
      const values = embedding.values;
      if (Array.isArray(values)) {
        embeddingArray = values;
      } else if (typeof values === 'string') {
        try {
          const parsed = JSON.parse(values);
          if (Array.isArray(parsed)) {
            embeddingArray = parsed;
          }
        } catch (e) {
          console.error('Failed to parse embedding.values string:', e);
        }
      }
    }

    if (!Array.isArray(embeddingArray) || embeddingArray.length === 0) {
      console.error('Invalid embedding format:', {
        questionId,
        embeddingType: typeof embedding,
        embeddingSample: embedding
      });
      return false;
    }

    const preparedEmbedding = validateAndPrepareEmbedding(embeddingArray);
    
    const vector: PineconeRecord<RecordMetadata> = {
      id: questionId,
      values: preparedEmbedding,
      metadata: {
        ...metadata,
        questionId,
        timestamp: new Date().toISOString()
      } as unknown as RecordMetadata
    };

    console.log(`Upserting vector for question ${questionId} with dimension ${preparedEmbedding.length}`);
    await pineconeIndex.upsert([vector]);
    
    console.log(`Successfully stored embedding for question ${questionId}`);
    return true;
  } catch (error) {
    console.error('Error in storeQuestionEmbedding:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      questionId,
      embeddingLength: Array.isArray(embedding) ? embedding.length : 'invalid',
      embeddingType: typeof embedding,
      embeddingSample: Array.isArray(embedding) ? embedding.slice(0, 3) : embedding
    });
    return false;
  }
}

type PineconeFilter = Record<string, string | number | boolean>;

export async function findSimilarQuestions(
  embedding: number[], 
  topK: number = 5, 
  filter: PineconeFilter | undefined = undefined
) {
  if (!pineconeIndex) {
    console.error('Pinecone not initialized - cannot find similar questions');
    return [];
  }

  try {
    const queryVector = validateAndPrepareEmbedding(embedding);
    
    const queryRequest: {
      vector: number[];
      topK: number;
      includeMetadata: true;
      includeValues: boolean;
      filter?: Record<string, string | number | boolean>;
    } = {
      vector: queryVector,
      topK,
      includeMetadata: true,
      includeValues: false
    };

    if (filter && Object.keys(filter).length > 0) {
      const cleanFilter: PineconeFilter = {};
      for (const [key, value] of Object.entries(filter)) {
        if (value !== undefined) {
          cleanFilter[key] = value;
        }
      }
      if (Object.keys(cleanFilter).length > 0) {
        queryRequest.filter = cleanFilter;
      }
    }

    console.log('Querying Pinecone with:', {
      vectorLength: queryVector.length,
      topK,
      filter: filter ? Object.keys(filter) : 'none'
    });

    const response = await pineconeIndex.query(queryRequest);
    const matches = response?.matches || [];

    const records = matches.map((match: ScoredPineconeRecord<RecordMetadata>) => ({
      id: match.id,
      score: match.score || 0,
      ...(match.metadata as QuestionMetadata),
      embedding: undefined, 
    }));

    return records;
  } catch (error) {
    console.error('Error in findSimilarQuestions:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return [];
  }
}

export function getPineconeClient(): Pinecone | null {
  return pineconeClient;
}

export function getPineconeIndex(): Index | null {
  return pineconeIndex;
}
