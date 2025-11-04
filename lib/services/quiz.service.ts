import { GoogleGenerativeAI } from '@google/generative-ai';
import { getEmbedding } from './embedding.service';
import { getCachedQuiz, cacheQuiz } from '@/lib/redis';

interface QuizQuestion {
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty?: string;
  embedding?: number[];
}

interface QuizData {
  questions: QuizQuestion[];
}

const DEFAULT_QUIZ = {
  questions: [
    {
      text: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: "C",
      difficulty: "EASY"
    }
  ]
};

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

export async function generateQuiz(grade: number, subject: string, numQuestions: number, topics: string[] = []) {
  try {
    const cacheKey = `quiz:${grade}:${subject}:${numQuestions}:${topics.sort().join(',')}`;

    const cachedQuiz = await getCachedQuiz(cacheKey);
    if (cachedQuiz) {
      return cachedQuiz;
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error('Google AI API key is not configured');
      return DEFAULT_QUIZ;
    }
  
    const prompt = `
      Generate a ${grade}th grade ${subject} quiz with ${numQuestions} questions.
      ${topics.length > 0 ? `Focus on these topics: ${topics.join(', ')}.` : ''}
      
      For each question, provide:
      1. The question text
      2. 4 multiple choice options (A, B, C, D)
      3. The correct answer (A, B, C, or D)
      4. A difficulty level (easy, medium, hard)
      
      Format the response as a JSON array of objects with these fields:
      {
        "questions": [
          {
            "text": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "A",
            "difficulty": "EASY"
          }
        ]
      }
      
      IMPORTANT: The difficulty field MUST be one of: EASY, MEDIUM, or HARD (uppercase)
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let jsonString = text;
    const jsonMatch = text.match(/```(?:json\n)?([\s\S]*?)\n```/);
    if (jsonMatch) {
      jsonString = jsonMatch[1];
    }
    const quizData: QuizData = JSON.parse(jsonString);

    const questionsWithEmbeddings = await Promise.all(
      quizData.questions.map(async (question: QuizQuestion) => {
        const embedding = await getEmbedding(question.text);
        
        const normalizedDifficulty = (() => {
          const upper = String(question.difficulty || 'MEDIUM').toUpperCase();
          if (['EASY', 'MEDIUM', 'HARD'].includes(upper)) {
            return upper;
          }
          console.warn(`Invalid difficulty '${question.difficulty}' found, defaulting to 'MEDIUM'`);
          return 'MEDIUM';
        })();

        return {
          ...question,
          difficulty: normalizedDifficulty,
          embedding: JSON.stringify(embedding)
        };
      })
    );

    const resultData = {
      questions: questionsWithEmbeddings
    };

    await cacheQuiz(cacheKey, resultData);

    return resultData;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating quiz:', errorMessage);
    if (error instanceof Error) {
      console.error(error.stack);
    }
    return DEFAULT_QUIZ;
  }
}


export async function evaluateAnswers(questions: QuizQuestion[], userAnswers: Record<string, string>) {
  try {
    const evaluationData = questions.map((q, index) => {
      const userAnswer = userAnswers[(index + 1).toString()];
      const isCorrect = userAnswer === q.correctAnswer;

      return {
        question: q.text,
        correctAnswer: q.correctAnswer,
        userAnswer: userAnswer || 'No answer',
        isCorrect,
        difficulty: q.difficulty,
        options: q.options
      };
    });

    const correctAnswers = evaluationData.filter((item) => item.isCorrect).length;
    const score = Math.round((correctAnswers / questions.length) * 100);

    let suggestions = [
      'Review the questions you got wrong',
      'Practice more with similar questions',
      'Ask for help on difficult topics'
    ];

    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try {
        const prompt = `
          A student has completed a quiz with the following results:
          - Total questions: ${questions.length}
          - Correct answers: ${correctAnswers}
          - Score: ${score}%
          
          Generate 2-3 personalized suggestions for the student to improve their performance.
          Focus on their weak areas and provide specific study tips.
          
          Format the response as a JSON array of strings:
          ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[\s*"[\s\S]*?"\s*\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.warn('AI suggestion generation failed, using default suggestions:', error instanceof Error ? error.message : String(error));
      }
    }

    return {
      score,
      correctAnswers,
      totalQuestions: questions.length,
      evaluationData,
      suggestions: suggestions.slice(0, 3)
    };
  } catch (error) {
    console.error('Error evaluating answers:', error);
    throw new Error('Failed to evaluate answers');
  }
}

interface QuestionForHint {
  text: string;
  options: string[];
  [key: string]: unknown; // Allow additional properties
}

export async function generateHint(question: QuestionForHint): Promise<string> {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return 'Think about the key concepts related to this question.';
    }

    const prompt = `
      Generate a helpful hint for the following ${question.difficulty} difficulty question:
      "${question.text}"
      
      Options:
      ${question.options.map((opt: string, i: number) => `${String.fromCharCode(65 + i)}. ${opt}`).join('\n')}
      
      The correct answer is ${question.correct_answer}.
      
      Provide a hint that guides the student toward the correct answer without giving it away directly.
      Make it concise and helpful.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text || 'No hint available.';
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating hint:', errorMessage);
    return 'Unable to generate a hint at this time.';
  }
}
