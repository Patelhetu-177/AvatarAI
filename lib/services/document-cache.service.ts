import RedisService from './redis.service';

export interface Document {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  userId: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

const DOCUMENT_CACHE_PREFIX = 'doc:';
const DOCUMENT_LIST_KEY = 'documents:list';
const CACHE_TTL = 60 * 60 * 24;

export class DocumentCacheService {
  private static getDocumentKey(documentId: string): string {
    return `${DOCUMENT_CACHE_PREFIX}${documentId}`;
  }

  public static async cacheDocument(document: Document): Promise<void> {
    if (!document?.id) return;
    
    const key = this.getDocumentKey(document.id);
    await RedisService.set(key, document, CACHE_TTL);
    
    const documents = await this.getCachedDocumentIds();
    if (!documents.includes(document.id)) {
      documents.push(document.id);
      await RedisService.set(DOCUMENT_LIST_KEY, documents);
    }
  }

  public static async getCachedDocument(documentId: string): Promise<Document | null> {
    const key = this.getDocumentKey(documentId);
    return RedisService.get(key);
  }

  public static async getCachedDocumentIds(): Promise<string[]> {
    return (await RedisService.get<string[]>(DOCUMENT_LIST_KEY)) || [];
  }

  public static async invalidateDocument(documentId: string): Promise<void> {
    const key = this.getDocumentKey(documentId);
    await RedisService.delete(key);
    
    const documents = await this.getCachedDocumentIds();
    const updatedDocuments = documents.filter(id => id !== documentId);
    await RedisService.set(DOCUMENT_LIST_KEY, updatedDocuments);
  }

  public static async invalidateAllDocuments(): Promise<number> {
    const documents = await this.getCachedDocumentIds();
    
    const keys = documents.map(id => this.getDocumentKey(id));
    if (keys.length > 0) {
      await Promise.all(keys.map(key => RedisService.delete(key)));
    }
    
    await RedisService.delete(DOCUMENT_LIST_KEY);
    
    return documents.length;
  }

  public static async getCachedDocuments(): Promise<Document[]> {
    const documentIds = await this.getCachedDocumentIds();
    const documents = await Promise.all(
      documentIds.map(id => this.getCachedDocument(id))
    );
    return documents.filter((doc): doc is Document => doc !== null);
  }

  public static async cacheDocuments(documents: Document[]): Promise<void> {
    await Promise.all(documents.map(doc => this.cacheDocument(doc)));
  }
}
