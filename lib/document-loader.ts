import { Document } from '@langchain/core/documents';
import { documentService } from './services/document.service';

export interface DocumentMetadata {
  source: string;
  type?: string;
  size: number;
  loc?: { pageNumber: number };
  contentLength?: number;
  processingTime?: string;
  pageNumber?: number;
  processedAt?: string;
  [key: string]: unknown;
}

export async function loadDocument(file: File): Promise<{ pageContent: string; metadata: DocumentMetadata }[]> {
  try {
    console.log(`Processing file: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    
    const documents = await documentService.processDocument(file);
    
    await documentService.storeDocumentVectors(documents);
    
    return documents.map(doc => ({
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        contentLength: doc.pageContent.length,
        processingTime: doc.metadata.processingTime ? String(doc.metadata.processingTime) : '0ms'
      }
    }));
  } catch (error) {
    const errorMsg = `Error processing document ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMsg, error);
    throw new Error(`Failed to process document: ${errorMsg}`);
  }
}

export async function searchSimilarDocuments(query: string, k: number = 5): Promise<{ pageContent: string; metadata: DocumentMetadata }[]> {
  try {
    const results = await documentService.searchSimilarDocuments(query, k);
    return results.map(doc => ({
      pageContent: doc.pageContent,
      metadata: doc.metadata as DocumentMetadata
    }));
  } catch (error) {
    console.error('Error searching similar documents:', error);
    throw new Error('Failed to search similar documents');
  }
}

export type { Document };