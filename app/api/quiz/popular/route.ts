import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';

export async function GET() {
  try {
    const popularQuizzes = await prisma.quiz.findMany({
      take: 6, 
      orderBy: {
        submissions: {
          _count: 'desc'
        }
      },
      include: {
        _count: {
          select: { submissions: true }
        },
        questions: {
          select: { id: true }
        },
        submissions: {
          select: {
            score: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    // Transform the data to match the expected format
    const quizzes = popularQuizzes.map(quiz => ({
      id: quiz.id,
      subject: quiz.subject,
      grade: quiz.grade,
      questions: quiz.questions,
      submissions: quiz.submissions,
      _count: quiz._count,
      createdAt: quiz.createdAt
    }));

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Error fetching popular quizzes:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
