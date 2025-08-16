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

Return ONLY a JSON array of strings like:
["Question 1", "Question 2", ...]
Do not add any other commentary or markdown formatting. The output should be a plain JSON array.`;

    const { text: questionsText } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt,
    });

    let questions: string[] = [];
    let cleanedText = questionsText.trim();

    cleanedText = cleanedText
      .replace(/^```json/, "")
      .replace(/```$/, "")
      .replace(/^\[/, "")
      .replace(/\]$/, "")
      .trim();

    try {
      questions = JSON.parse(`[${cleanedText}]`);
      if (!Array.isArray(questions)) throw new Error("Not a valid array");
    } catch (parseError) {
      console.error("JSON parsing failed, falling back to regex parsing:", parseError);

      const questionMatches = cleanedText.match(/"([^"]*)"/g);
      
      if (questionMatches) {
        questions = questionMatches.map((s: string) => s.replace(/"/g, ""));
      } else {
        questions = cleanedText
          .split(/\n|,/g)
          .map((s: string) => s.replace(/^\d+\.?\s*[\-"']*/, "").trim())
          .filter((s: string) => s.length > 0);
      }
    }

    const cleanedTechstack = (techstack || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    const interview = {
      role,
      type,
      level,
      techstack: cleanedTechstack,
      questions,
      userId,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection("interviews").add(interview);

    return new Response(JSON.stringify({ success: true, id: ref.id }), { status: 200 });
  } catch (error) {
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
