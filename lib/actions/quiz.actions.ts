import prisma from '../prismadb';

export async function getQuizById(quizId: string) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
      },
    });

    return quiz;
  } catch (error) {
    console.error('Error getting quiz by ID:', error);
    return null;
  }
}

export async function getQuizSubmissions(quizId: string, userId: string) {
  try {
    const submissions = await prisma.submission.findMany({
      where: {
        quizId,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return submissions;
  } catch (error) {
    console.error('Error getting quiz submissions:', error);
    return [];
  }
}
