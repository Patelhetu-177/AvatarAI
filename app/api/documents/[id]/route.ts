import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { deleteDocument, updateDocument } from '@/lib/actions/document.actions';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = params;
    
    if (!id) {
      return new NextResponse('Document ID is required', { status: 400 });
    }

    const body = await request.json();
    const { title, description } = body;

    if (!title && !description) {
      return new NextResponse('Title or description is required', { status: 400 });
    }

    const updatedDocument = await updateDocument(id, userId, { title, description });
    
    return NextResponse.json(updatedDocument);
  } catch (error) {
    console.error('Error updating document:', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = params;
    
    if (!id) {
      return new NextResponse('Document ID is required', { status: 400 });
    }

    await deleteDocument(id, userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return new NextResponse(
      error instanceof Error ? error.message : 'Internal server error',
      { status: 500 }
    );
  }
}
