import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';

export async function GET() {
  try {
    const submissions = await prisma.submission.findMany({
      take: 10, 
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        quiz: {
          select: {
            id: true,
            subject: true,
            grade: true,
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
        }
      }
    });

    const quizzes = submissions.map(sub => ({
      id: sub.quiz.id,
      subject: sub.quiz.subject,
      grade: sub.quiz.grade,
      questions: sub.quiz.questions,
      submissions: sub.quiz.submissions,
      createdAt: sub.createdAt
    }));

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Error fetching quiz history:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
