import { NextResponse } from 'next/server';
import prisma from '@/lib/prismadb';
import { auth } from '@clerk/nextjs/server';

type SubmissionResult = {
    questionId: string;
    questionText: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    options: Record<string, string>;
};

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { answers } = await request.json();

        const quiz = await prisma.quiz.findUnique({
            where: { id: params.id },
            include: { questions: true }
        });

        if (!quiz) {
            return new NextResponse('Quiz not found', { status: 404 });
        }

        const results = quiz.questions.map((question, index) => {
            const userAnswer = String(answers[index] || '').trim();
            const correctAnswer = String(question.correctAnswer).trim();

            const extractLetter = (ans: string) => {
                const match = ans.match(/^([A-D])[\)\.]?\s*/i);
                return match ? match[1].toUpperCase() : ans;
            };

            const userChoice = extractLetter(userAnswer);
            const correctChoice = extractLetter(correctAnswer);

            const isCorrect = userChoice === correctChoice;

            return {
                questionId: question.id,
                questionText: question.text,
                userAnswer: userAnswer,
                correctAnswer: correctAnswer,
                isCorrect,
                options: question.options as Record<string, string>
            };
        });

        const correctCount = results.filter(r => r.isCorrect).length;
        const wrongCount = results.length - correctCount;
        const score = Math.round((correctCount / results.length) * 100);

        const { userId } = await auth();

        const submissionData = {
            userId: userId || 'guest-user',
            quizId: quiz.id,
            answers: answers,
            score: score,
            suggestions: {},
            results: JSON.parse(JSON.stringify(results))
        };

        console.log('Saving submission data:', JSON.stringify(submissionData, null, 2));

        const submission = await prisma.submission.create({
            data: submissionData
        });

        console.log('Submission saved successfully:', submission.id);
        
        interface SubmissionWithResults extends Omit<typeof submission, 'results'> {
            results: SubmissionResult[] | null;
        }
        const submissionWithResults = submission as SubmissionWithResults;
        const parsedResults = submissionWithResults.results ? 
            (Array.isArray(submissionWithResults.results) ? 
                submissionWithResults.results : 
                JSON.parse(JSON.stringify(submissionWithResults.results))) : [];
        console.log('Results saved:', parsedResults);


        return NextResponse.json({
submissionId: submission.id,
            correct: correctCount,
            wrong: wrongCount,
            total: results.length,
            score: score,
            results: results
        });

    } catch (error) {
        console.error('Error submitting quiz:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
