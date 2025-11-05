import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import * as JSZip from 'jszip';

function extractTextFromSlide(xmlContent: string): string {
  const textMatches = xmlContent.match(/<a:t(?:\s+[^>]*)?>([^<]*)<\/a:t>/g) || [];
  const texts = textMatches.map(match => {
    const textMatch = match.match(/<a:t(?:\s+[^>]*)?>([^<]*)<\/a:t>/);
    return textMatch ? textMatch[1] : '';
  }).filter(Boolean);
  return texts.join(' ').replace(/\s+/g, ' ').trim();
}

interface DocumentMetadata {
  source: string;
  type?: string;
  size: number;
  loc?: { pageNumber: number };
  contentLength?: number;
  processingTime?: string;
  pageNumber?: number;
  processedAt?: string;
  [key: string]: string | number | boolean | { pageNumber: number } | undefined;
}

export async function loadDocument(file: File): Promise<{ pageContent: string; metadata: DocumentMetadata }[]> {
  const fileType = file.name.split('.').pop()?.toLowerCase();
  const fileName = file.name;
  const fileSize = file.size;

  console.log(`Processing file: ${fileName}, Type: ${fileType}, Size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);

  try {
    let content = '';
    const metadata = {
      source: fileName,
      type: fileType,
      size: fileSize,
      processedAt: new Date().toISOString()
    };

    const startTime = Date.now();
    
    if (fileType === 'pdf') {
      console.log('Loading PDF document...');
      const loader = new PDFLoader(file);
      const docs = await loader.load();
      console.log(`Loaded ${docs.length} pages from PDF in ${Date.now() - startTime}ms`);
      return docs.map(doc => ({
        pageContent: doc.pageContent,
        metadata: { 
          ...doc.metadata, 
          ...metadata,
          pageNumber: doc.metadata.loc?.pageNumber || 1
        }
      }));
    } 
    else if (['doc', 'docx'].includes(fileType || '')) {
      console.log('Processing Word document...');
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      content = result.value;
      console.log(`Extracted ${content.length} characters from Word document in ${Date.now() - startTime}ms`);
    } 
    else if (['xls', 'xlsx'].includes(fileType || '')) {
      console.log('Processing Excel document...');
      const arrayBuffer = await file.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      
      content = workbook.SheetNames.map(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        return `Sheet: ${sheetName}\n${XLSX.utils.sheet_to_csv(worksheet)}`;
      }).join('\n\n');
      
      console.log(`Processed Excel workbook with ${workbook.SheetNames.length} sheets in ${Date.now() - startTime}ms`);
    } 
    else if (['ppt', 'pptx'].includes(fileType || '')) {
      console.log('Processing PowerPoint document...');
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      try {
        const zip = await JSZip.loadAsync(buffer);
        const slidePromises: Promise<string>[] = [];
        let slideIndex = 1;
        
        while (zip.file(`ppt/slides/slide${slideIndex}.xml`)) {
          const slidePath = `ppt/slides/slide${slideIndex}.xml`;
          const slideContent = await zip.file(slidePath)?.async('text') || '';
          const slideText = extractTextFromSlide(slideContent);
          if (slideText) {
            slidePromises.push(Promise.resolve(`Slide ${slideIndex}:\n${slideText}\n`));
          }
          slideIndex++;
        }
        
        const notesPromises: Promise<string>[] = [];
        let noteIndex = 1;
        
        while (zip.file(`ppt/notesSlides/notesSlide${noteIndex}.xml`)) {
          const notePath = `ppt/notesSlides/notesSlide${noteIndex}.xml`;
          const noteContent = await zip.file(notePath)?.async('text') || '';
          const noteText = extractTextFromSlide(noteContent);
          if (noteText) {
            notesPromises.push(Promise.resolve(`Notes ${noteIndex}:\n${noteText}\n`));
          }
          noteIndex++;
        }
        
        const [slideTexts, noteTexts] = await Promise.all([
          Promise.all(slidePromises),
          Promise.all(notesPromises)
        ]);
        
        content = [
          ...slideTexts,
          ...noteTexts
        ].join('\n\n').trim();
        
        if (!content) {
          throw new Error('No extractable text found in PowerPoint file');
        }
        
        console.log(`Extracted ${content.length} characters from PowerPoint in ${Date.now() - startTime}ms`);
      } catch (error) {
        console.error('Error processing PowerPoint file:', error);
        throw new Error('Failed to process PowerPoint file. For best results, please convert to PDF before uploading.');
      }
    }
    else if (fileType === 'txt') {
      console.log('Loading text document...');
      content = await file.text();
      console.log(`Loaded ${content.length} characters from text file in ${Date.now() - startTime}ms`);
    } 
    else {
      const errorMsg = `Unsupported file type: ${fileType}. Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (content) {
      console.log(`Extracted content length: ${content.length} characters`);
      return [{
        pageContent: content,
        metadata: {
          ...metadata,
          contentLength: content.length,
          processingTime: `${Date.now() - startTime}ms`
        }
      }];
    }

    throw new Error('No content could be extracted from the document');
  } catch (error) {
    const errorMsg = `Error processing document ${fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.error(errorMsg, error);
    throw new Error(`Failed to process document: ${errorMsg}`);
  }
}