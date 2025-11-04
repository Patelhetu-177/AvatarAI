import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: true
      }
    });

    if (!quiz) {
      return new NextResponse('Quiz not found', { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
