'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { PlusCircle } from 'lucide-react';

interface Quiz {
  id: string;
  subject: string;
  grade: number;
  createdAt: string;
  questions: { id: string }[];
  submissions?: {
    score: number;
    createdAt: string;
  }[];
}

export default function QuizHome() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [popularQuizzes, setPopularQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const [quizzesRes, popularRes] = await Promise.all([
          fetch('/api/quiz/history'),
          fetch('/api/quiz/popular')
        ]);

        if (!quizzesRes.ok || !popularRes.ok) {
          throw new Error('Failed to fetch quizzes');
        }

        const [quizData, popularData] = await Promise.all([
          quizzesRes.json(),
          popularRes.json()
        ]);

        setQuizzes(quizData);
        setPopularQuizzes(popularData);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load quizzes. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizzes();
  }, [toast]);

  const [isNavigating, setIsNavigating] = useState<string | null>(null);

  const handleQuizAction = (quizId: string, action: 'view' | 'start') => {
    setIsNavigating(quizId);
    if (action === 'start') {
      router.push(`/quiz/${quizId}`);
    } else {
      router.push(`/quiz/${quizId}/results`);
    }
  };

  const handleCreateNewQuiz = () => {
    setIsNavigating('new');
    router.push('/quiz/new');
  };

  const QuizCard = ({ quiz, isPopular = false }: { quiz: Quiz, isPopular?: boolean }) => {
    const isActive = isNavigating === quiz.id;
    const hasSubmissions = quiz.submissions && quiz.submissions.length > 0;
    const buttonText = isPopular ? 'Start Quiz' : (hasSubmissions ? 'View Results' : 'Start Quiz');
    const buttonVariant = isPopular ? 'default' : (hasSubmissions ? 'outline' : 'default');
    const actionType = isPopular || !hasSubmissions ? 'start' : 'view';
    
    const questionCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;

    return (
      <Card 
        className={`w-full hover:shadow-md transition-shadow ${isActive ? 'ring-2 ring-primary' : ''}`}
        onClick={(e) => {
          if (!(e.target instanceof HTMLButtonElement)) {
            handleQuizAction(quiz.id, actionType);
          }
        }}
      >
        <CardHeader>
          <CardTitle className="text-lg">{quiz.subject || 'Untitled Quiz'}</CardTitle>
          <CardDescription>
            {quiz.grade ? `Grade ${quiz.grade} • ` : ''}
            {questionCount} Question{questionCount !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPopular ? (
            <p className="text-sm text-muted-foreground">
              {quiz.submissions?.length || 0} attempt{quiz.submissions?.length !== 1 ? 's' : ''}
            </p>
          ) : hasSubmissions && quiz.submissions?.[0] ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Score:</span>
                <span className="font-medium">{quiz.submissions[0].score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${quiz.submissions[0].score}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Taken on {new Date(quiz.submissions[0].createdAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Not yet attempted
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gray-300 h-2 rounded-full w-full" />
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            variant={buttonVariant}
            className="w-full relative overflow-hidden"
            onClick={(e) => {
              e.stopPropagation();
              handleQuizAction(quiz.id, actionType);
            }}
            disabled={isActive}
          >
            {isActive ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {actionType === 'start' ? 'Starting...' : 'Loading...'}
              </>
            ) : (
              <span>{buttonText}</span>
            )}
          </Button>
        </CardFooter>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="grid gap-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-10 w-64 mt-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-6">Quiz Dashboard</h1>
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Your Quiz History</h2>
            <Button 
              onClick={handleCreateNewQuiz}
              disabled={isNavigating === 'new'}
              className="min-w-[150px] bg-teal-500 text-white"
            >
                <PlusCircle className="w-4 h-4 mr-2" />
              {isNavigating === 'new' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                
                'Create New Quiz'
              )}
            </Button>
          </div>
          
          {quizzes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <QuizCard key={quiz.id} quiz={quiz} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">No quiz history yet</p>
              <Button 
                onClick={handleCreateNewQuiz}
                disabled={isNavigating === 'new'}
              >
                {isNavigating === 'new' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Take Your First Quiz'
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Popular Quizzes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularQuizzes.map((quiz) => (
              <QuizCard key={quiz.id} quiz={quiz} isPopular />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
