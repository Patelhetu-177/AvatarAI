import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';

export async function GET() {
  try {
    const recentSubmissions = await prisma.submission.findMany({
      take: 5, 
      orderBy: { createdAt: 'desc' },
      include: {
        quiz: {
          include: {
            questions: { select: { id: true } },
            submissions: {
              select: { score: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    const recentQuizzes = await prisma.quiz.findMany({
      take: 10, 
      orderBy: { createdAt: 'desc' },
      include: {
        questions: { select: { id: true } },
        submissions: {
          select: { score: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    const allQuizzes = [
      ...recentSubmissions.map(sub => ({
        ...sub.quiz,
        createdAt: sub.createdAt
      })),
      ...recentQuizzes
    ];
    
    const uniqueQuizzesMap = new Map();
    allQuizzes.forEach(quiz => {
      if (!uniqueQuizzesMap.has(quiz.id)) {
        uniqueQuizzesMap.set(quiz.id, quiz);
      }
    });

    const uniqueQuizzes = Array.from(uniqueQuizzesMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10); 

    return NextResponse.json(uniqueQuizzes);
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
