import { NextResponse } from 'next/server';
import { generateQuiz } from '@/lib/services/quiz.service';
import prisma from '@/lib/prismadb';
import { initPinecone, storeQuestionEmbedding } from '@/lib/services/pinecone.service';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty?: string;
  embedding?: number[];
}

export async function POST(req: Request) {
  try {
    const { grade, subject, numQuestions, topics } = await req.json();

    if (!grade || !subject) {
      return new NextResponse('Missing required fields', { status: 400 });
    }
    const validEducationLevels = ['associate', 'bachelors', 'masters', 'phd', 'postdoc', 'other'];
    const isNumericGrade = !isNaN(Number(grade));
    const isEducationLevel = validEducationLevels.includes(grade);
    
    console.log('Received grade:', grade);
    console.log('isNumericGrade:', isNumericGrade);
    console.log('isEducationLevel:', isEducationLevel);
    
    if (!isNumericGrade && !isEducationLevel) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Invalid education level',
          details: `Received: ${grade}`,
          validLevels: validEducationLevels
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const gradeNum = isNumericGrade ? Number(grade) : 0; 
    const numQuestionsNum = Number(numQuestions) || 5; 
    
    if (isNumericGrade && (gradeNum < 1 || gradeNum > 12)) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Invalid grade level',
          message: 'Grade must be between 1 and 12',
          received: gradeNum
        }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (isNaN(numQuestionsNum) || numQuestionsNum < 1 || numQuestionsNum > 20) {
      return new NextResponse('Invalid number of questions', { status: 400 });
    }

    const topicList = Array.isArray(topics) 
      ? topics 
      : typeof topics === 'string' 
        ? topics.split(',').map(t => t.trim()).filter(Boolean)
        : [];

    const quizData = await generateQuiz(gradeNum, subject, numQuestionsNum, topicList);

    const pineconeInitialized = await initPinecone();
    const quiz = await prisma.quiz.create({
      data: {
        userId: 'guest-user',
        userName: 'Guest',
        subject,
        grade: gradeNum,
        questions: {
          create: quizData.questions.map((q: Question) => ({
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            difficulty: q.difficulty,
            embedding: q.embedding ? JSON.stringify(q.embedding) : null
          }))
        }
      },
      include: {
        questions: true
      }
    });

    if (pineconeInitialized) {
      try {
        if (quiz.questions.length > 0 && quiz.questions[0].embedding) {
          console.log('Sample question embedding:', {
            id: quiz.questions[0].id,
            embeddingType: typeof quiz.questions[0].embedding,
            embeddingSample: typeof quiz.questions[0].embedding === 'string' 
              ? quiz.questions[0].embedding.substring(0, 100) + '...' 
              : quiz.questions[0].embedding
          });
        }

        const storagePromises = quiz.questions.map(async (question) => {
          try {
            let embedding = question.embedding;
            
            if (typeof embedding === 'string') {
              try {
                const parsed = JSON.parse(embedding);
                embedding = parsed;
              } catch (e) {
                console.error('Failed to parse embedding string:', e);
                return null;
              }
            }

            if (embedding) {
              const result = await storeQuestionEmbedding(
                question.id,
                embedding,
                {
                  quizId: quiz.id,
                  subject,
                  difficulty: question.difficulty || 'MEDIUM',
                  text: question.text
                }
              );
              
              if (!result) {
                console.error(`Failed to store embedding for question ${question.id}`);
              }
              
              return result;
            }
            return false;
          } catch (error) {
            console.error(`Error processing question ${question.id}:`, error);
            return false;
          }
        });

        const results = await Promise.all(storagePromises);
        const successCount = results.filter((result): result is boolean => result !== null).length;
        console.log(`Successfully stored ${successCount} out of ${quiz.questions.length} embeddings in Pinecone`);
        
      } catch (error) {
        console.error('Error in parallel embedding storage:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
      }
    }

    return NextResponse.json(quiz);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Error generating quiz:', error);
    if (errorMessage.includes('Google AI API key is not configured')) {
      return new NextResponse(
        'Quiz generation is currently unavailable. Please try again later or contact support.',
        { status: 503 }
      );
    }
    return new NextResponse('Failed to generate quiz. Please try again.', { status: 500 });
  }
}
