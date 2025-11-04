'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty: string;
}

interface Quiz {
  id: string;
  subject: string;
  grade: number;
  questions: Question[];
}

interface QuizResults {
  score: number;
  correct: number[];
  wrong: number[];
  totalQuestions: number;
  correctAnswers: number;
  suggestions?: string[];
}

export default function QuizPage({ params }: { params: { id: string } }) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  
  const currentQ = quiz?.questions?.[currentQuestion];

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`/api/quiz/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            toast({
              title: 'Quiz Not Found',
              description: 'The requested quiz could not be found.',
              variant: 'destructive',
            });
            router.push('/quiz');
            return;
          }
          throw new Error('Failed to fetch quiz');
        }
        const data = await response.json() as Quiz;
        setQuiz(data);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast({
          title: 'Error',
          description: 'Failed to load quiz. Please try again.',
          variant: 'destructive',
        });
        router.push('/quiz');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [params.id, router, toast]);

  const handleNext = () => {
    if (quiz && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;
    
    setIsSubmitting(true);

    try {
      if (Object.keys(answers).length !== quiz.questions.length) {
        throw new Error('Please answer all questions before submitting');
      }

      const response = await fetch(`/api/quiz/${params.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          quizId: params.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to submit quiz');
      }

      const responseData = await response.json();
      
      const resultsData: QuizResults = {
        score: responseData.score || 0,
        correct: Array.isArray(responseData.correct) ? responseData.correct : [],
        wrong: Array.isArray(responseData.wrong) ? responseData.wrong : [],
        totalQuestions: quiz.questions.length,
        correctAnswers: responseData.correctAnswers || 0,
        suggestions: Array.isArray(responseData.suggestions) ? responseData.suggestions : []
      };
      
      setResults(resultsData);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit quiz. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!quiz || !currentQ) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
        <p>The requested quiz could not be found or is invalid.</p>
        <Button className="mt-4" onClick={() => router.push('/quiz')}>
          Back to Quiz Home
        </Button>
      </div>
    );
  }

  if (results) {
    return (
      <div className="container mx-auto p-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Quiz Results</CardTitle>
            <CardDescription>
              {quiz.subject} - Grade {quiz.grade}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="text-2xl font-bold">
                  Quiz Complete!
                </div>
                <div className="text-lg">
                  Your score: {results.score}%
                </div>
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${results.score}%` }}
                    ></div>
                  </div>
                </div>
                {results.suggestions && results.suggestions.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Suggestions for improvement:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {results.suggestions.map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={() => router.push('/quiz')}>
              Back to Quiz Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{quiz.subject}</CardTitle>
              <CardDescription>Grade {quiz.grade}</CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="text-lg font-medium">{currentQ.text}</div>
            <RadioGroup 
              value={answers[currentQuestion] || ''}
              onValueChange={(value: string) => {
                setAnswers(prev => ({
                  ...prev,
                  [currentQuestion]: value
                }));
              }}
              className="space-y-2"
            >
              {currentQ.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          {currentQuestion < quiz.questions.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!answers[currentQuestion]}
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={!answers[currentQuestion] || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Quiz'
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
