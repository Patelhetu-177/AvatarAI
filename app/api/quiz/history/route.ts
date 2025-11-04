import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const userSubmissions = await prisma.submission.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        quiz: {
          include: {
            questions: { select: { id: true } },
            submissions: {
              where: { userId },
              select: { score: true, createdAt: true },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      },
      take: 10
    });

    const userQuizzes = userSubmissions.map(sub => ({
      ...sub.quiz,
      submissions: sub.quiz.submissions,
      createdAt: sub.createdAt
    }));

    if (userQuizzes.length === 0) {
      return NextResponse.json([]);
    }

    const uniqueQuizzes = Array.from(new Map(
      userQuizzes.map(quiz => [quiz.id, quiz])
    ).values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ).slice(0, 10); 

    return NextResponse.json(uniqueQuizzes);
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
