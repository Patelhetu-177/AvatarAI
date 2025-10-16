import "@/lib/ai-compat";
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


    let questionsText = "";
    try {
      const result = await generateText({
        model: google("gemini-2.5-flash-native-audio-preview-09-2025"),
        prompt,
      });

      questionsText = (result && (result as any).text) || (result as any).output || String(result || "");
    } catch (sdkError: any) {
      const serializeError = (err: unknown) => {
        if (err instanceof Error) return { message: err.message, stack: err.stack };
        try {
          return JSON.parse(JSON.stringify(err));
        } catch {
          return { message: String(err) };
        }
      };

      const serialized = serializeError(sdkError);
      console.error("generateText SDK error (serialized):", serialized);

      const message =
        (serialized && typeof serialized === "object" && "message" in serialized && (serialized as any).message) ||
        JSON.stringify(serialized) ||
        "An unknown SDK error occurred.";

      return new Response(JSON.stringify({ success: false, error: message }), { status: 500 });
    }

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
      console.error(
        "JSON parsing failed, falling back to regex parsing:",
        parseError
      );

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

    return new Response(JSON.stringify({ success: true, id: ref.id }), {
      status: 200,
    });
  } catch (error: any) {
    console.error("generate interview error:", error);

    let errorMessage = "An unknown error occurred.";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "message" in error
    ) {
      errorMessage = String((error as { message: any }).message);
    } else {
      errorMessage = String(error);
    }

    console.error("Error details:", error);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500 }
    );
  }
}
