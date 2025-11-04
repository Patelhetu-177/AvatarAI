import { Button } from "@/components/ui/button";
import { getQuizById } from "@/lib/actions/quiz.actions";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prismadb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

type SubmissionResult = {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  options: Record<string, string>;
};

type SubmissionWithResults = {
  id: string;
  userId: string;
  quizId: string;
  answers: Record<string, string>;
  results: SubmissionResult[];
  score: number;
  quiz: {
    id: string;
    subject: string;
    grade: number;
    questions: Array<{
      id: string;
      text: string;
      options: Record<string, string>;
      correctAnswer: string;
    }>;
  };
};

export default async function QuizResultsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const quiz = await getQuizById(id);
  if (!quiz) redirect("/quiz");

  const submission = await prisma.submission.findFirst({
    where: {
      quizId: id,
      userId: user.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      quiz: {
        include: {
          questions: true,
        },
      },
    },
  }) as SubmissionWithResults | null;

  if (!submission) {
    redirect(`/quiz/${id}`);
  }

  const results = Array.isArray(submission.results) ? submission.results : [];
  const correctAnswersCount = results.filter(r => r && r.isCorrect).length;
  const totalQuestions = submission.quiz.questions.length;
  const score = submission.score || Math.round((correctAnswersCount / totalQuestions) * 100);
  
  console.log('Results:', results);
  console.log('Correct count:', correctAnswersCount);
  console.log('Score from DB:', submission.score);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Quiz Results</h1>
          <p className="text-xl text-muted-foreground">
            {quiz.subject} - {quiz.grade === 0 ? 'Higher Education' : `Grade ${quiz.grade}`}
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-5xl font-bold text-primary">
              {score}%
            </CardTitle>
            <CardDescription className="text-xl">
              {score >= 70 ? '🎉 Great Job!' : '💪 Keep Practicing!'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {correctAnswersCount}
                </div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {totalQuestions - correctAnswersCount}
                </div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalQuestions}
                </div>
                <div className="text-sm text-muted-foreground">Total Questions</div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Your Score</span>
                <span className="font-medium">{score}%</span>
              </div>
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-1000"
                  style={{
                    width: `${score}%`,
                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 mt-8">
          <h2 className="text-2xl font-bold">Detailed Results</h2>
          
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index} className={result.isCorrect ? 'border-green-200 dark:border-green-900' : 'border-red-200 dark:border-red-900'}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Question {index + 1}
                      </CardTitle>
                      {result.isCorrect ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 font-medium">{result.questionText}</p>
                    
                    <div className="space-y-2">
                      {result.options && Object.entries(result.options).map(([key, value]) => {
                        const isCorrect = key === result.correctAnswer;
                        const isSelected = key === result.userAnswer;
                        
                        let className = 'p-3 rounded border';
                        if (isCorrect) {
                          className += ' bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
                        } else if (isSelected) {
                          className += ' bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
                        } else {
                          className += ' bg-muted/50';
                        }
                        
                        return (
                          <div key={key} className={className}>
                            <div className="flex items-center">
                              <span className="font-medium mr-2">{key.toUpperCase()})</span>
                              <span>{String(value)}</span>
                              {isCorrect && (
                                <CheckCircle2 className="ml-auto h-4 w-4 text-green-500" />
                              )}
                              {isSelected && !isCorrect && (
                                <XCircle className="ml-auto h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {!result.isCorrect && (
                      <div className="mt-3 text-sm text-green-600 dark:text-green-400">
                        <span className="font-medium">Correct answer:</span> {result.correctAnswer}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No detailed results available for this quiz.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/quiz" className="w-full">
              Back to Quizzes
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href={`/quiz/${id}`} className="w-full">
              Retake Quiz
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}