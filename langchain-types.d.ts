declare module '@langchain/community/document_loaders/fs/pdf' {
  interface PDFLoaderOptions {
    splitPages?: boolean;
    // Add other options as needed
  }

  export class PDFLoader {
    constructor(filePath: string, options?: PDFLoaderOptions);
    load(): Promise<Array<{
      pageContent: string;
      metadata: Record<string, any> & { loc?: { pageNumber: number } };
    }>>;
  }
}

declare module '@langchain/community/document_loaders/fs/text_splitter' {
  export interface TextSplitterParams {
    chunkSize?: number;
    chunkOverlap?: number;
  }

  export class RecursiveCharacterTextSplitter {
    constructor(params?: TextSplitterParams);
    splitText(text: string): Promise<string[]>;
    splitDocuments(documents: Array<{ pageContent: string; metadata?: Record<string, any> }>): Promise<Array<{
      pageContent: string;
      metadata: Record<string, any>;
    }>>;
  }
}

declare module '@langchain/community/document_loaders/fs/*' {
  export * from '@langchain/community/document_loaders/fs/pdf';
  export * from '@langchain/community/document_loaders/fs/text_splitter';
}
