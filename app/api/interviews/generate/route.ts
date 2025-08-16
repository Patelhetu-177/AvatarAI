import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, role, level, techstack, amount, userId } = body;

    const prompt = `Prepare ${amount} interview questions for the job role "${role}".
- Experience level: ${level}
- Tech stack: ${techstack}
- Focus: ${type}

Return only a JSON array of strings like:
["Question 1", "Question 2", ...]
Do not add any other commentary. Use plain text JSON.`;

    const { text: questionsText } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt,
    });

    let questions: string[] = [];
    try {
      questions = JSON.parse(questionsText);
      if (!Array.isArray(questions)) throw new Error("Not an array");
    } catch {
      questions = questionsText
        .split("\n")
        .map((s: string) => s.replace(/^\d+\.?\s*/, "").trim())
        .filter((s: string) => s.length > 0);
    }

    const interview = {
      role,
      type,
      level,
      techstack: (techstack || "").split(",").map((s: string) => s.trim()),
      questions,
      userId,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection("interviews").add(interview);

    return new Response(JSON.stringify({ success: true, id: ref.id }), { status: 200 });
  } catch (error: unknown) {
    console.error("generate interview error:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
    }
    return new Response(JSON.stringify({ success: false, error: errorMessage }), { status: 500 });
  }
}
