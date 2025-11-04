'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_GRADE = '5';
const DEFAULT_NUM_QUESTIONS = '5';

export default function NewQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    subject: searchParams.get('subject') || '',
    grade: searchParams.get('grade') || DEFAULT_GRADE,
    numQuestions: DEFAULT_NUM_QUESTIONS,
    topics: searchParams.get('topics') || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a subject for your quiz',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          grade: isNaN(Number(formData.grade)) ? formData.grade : parseInt(formData.grade),
          numQuestions: parseInt(formData.numQuestions),
          topics: formData.topics.split(',').map(t => t.trim()).filter(Boolean)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || 'Failed to generate quiz';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      router.push(`/quiz/${data.id}`);
    } catch (error) {
      console.error('Error generating quiz:', error);
      let errorMessage = 'Failed to generate quiz. Please try again.';
      
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <h1 className="text-3xl font-bold mb-8">Create New Quiz</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="e.g., Mathematics, History, Science"
            required
            disabled={isGenerating}
          />
          <p className="text-sm text-muted-foreground">
            Don&apos;t see your subject? Try being more specific or check back soon as we&apos;re adding new subjects regularly.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="grade">Grade Level</Label>
            <Select
              value={formData.grade}
              onValueChange={(value) => handleSelectChange('grade', value)}
              disabled={isGenerating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">School</div>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                  <SelectItem key={`grade-${grade}`} value={grade.toString()}>
                    Grade {grade}
                  </SelectItem>
                ))}
                
                <div className="h-px bg-border my-1" />
                
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Higher Education</div>
                <SelectItem value="associate">Associate&apos;s Degree</SelectItem>
                <SelectItem value="bachelors">Bachelor&apos;s Degree</SelectItem>
                <SelectItem value="masters">Master&apos;s Degree</SelectItem>
                <SelectItem value="phd">PhD/Doctorate</SelectItem>
                <SelectItem value="postdoc">Postdoctoral</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Don&apos;t see your grade? Try selecting a different level or contact us for assistance.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numQuestions">Number of Questions</Label>
            <Select
              value={formData.numQuestions}
              onValueChange={(value) => handleSelectChange('numQuestions', value)}
              disabled={isGenerating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select number of questions" />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15, 20].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} Questions
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topics">Topics (comma-separated, optional)</Label>
          <Input
            id="topics"
            name="topics"
            value={formData.topics}
            onChange={handleChange}
            placeholder="e.g., Algebra, Geometry, Calculus"
            disabled={isGenerating}
          />
          <p className="text-sm text-muted-foreground">
            Don&apos;t see your topic? Try being more specific or check back soon as we&apos;re adding new topics regularly.
          </p>
        </div>

        <div className="flex justify-between pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isGenerating}
            className="min-w-[150px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Quiz'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
