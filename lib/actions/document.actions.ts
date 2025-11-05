import prismadb from '../prismadb';
import { DocumentCacheService } from '../services/document-cache.service';

export async function getDocument(documentId: string, userId: string) {
  
  const cachedDoc = await DocumentCacheService.getCachedDocument(documentId);
  if (cachedDoc) {
    if (cachedDoc.userId !== userId) {
      throw new Error('Unauthorized to access this document');
    }
    return cachedDoc;
  }

  const document = await prismadb.document.findUnique({
    where: { id: documentId }
  });

  if (!document) {
    throw new Error('Document not found');
  }

  await DocumentCacheService.cacheDocument(document);
  return document;
}

export async function updateDocument(
  documentId: string, 
  userId: string, 
  data: { title?: string; description?: string }
) {
  try {
    const document = await prismadb.document.findUnique({
      where: { id: documentId },
      select: { id: true, userId: true }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.userId !== userId) {
      throw new Error('Unauthorized to update this document');
    }

    const updatedDocument = await prismadb.document.update({
      where: { id: documentId },
      data: {
        title: data.title,
        description: data.description,
      },
      select: {
        id: true,
        title: true,
        description: true,
        fileUrl: true,
        userId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    await DocumentCacheService.cacheDocument(updatedDocument);
    return updatedDocument;
  } catch (error) {
    console.error('Error updating document:', error);
    await DocumentCacheService.invalidateDocument(documentId);
    throw new Error(`Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function deleteDocument(documentId: string, userId: string) {
  try {
    const document = await prismadb.document.findUnique({
      where: { id: documentId },
      select: { userId: true }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.userId !== userId) {
      throw new Error('Unauthorized to delete this document');
    }

    await prismadb.document.delete({
      where: { id: documentId }
    });

    await DocumentCacheService.invalidateDocument(documentId);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting document:', error);
    await DocumentCacheService.invalidateDocument(documentId);
    throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
