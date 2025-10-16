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

      // result may be a string or an object containing text/output
      if (typeof result === "string") {
        questionsText = result;
      } else if (result && typeof result === "object") {
        const asRecord = result as unknown as Record<string, unknown>;
        if (typeof asRecord.text === "string") {
          questionsText = asRecord.text;
        } else if (typeof asRecord.output === "string") {
          questionsText = asRecord.output;
        } else {
          questionsText = String(result);
        }
      } else {
        questionsText = String(result || "");
      }
    } catch (sdkError: unknown) {
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

      const message = ((): string => {
        if (typeof serialized === "string") return serialized;
        if (typeof serialized === "object" && serialized !== null && "message" in serialized) {
          try {
            return String((serialized as Record<string, unknown>).message);
          } catch {
            return JSON.stringify(serialized);
          }
        }
        try {
          return JSON.stringify(serialized);
        } catch {
          return "An unknown SDK error occurred.";
        }
      })();

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
  } catch (errorUnknown: unknown) {
    console.error("generate interview error:", errorUnknown);

    const getErrorMessage = (err: unknown): string => {
      if (err instanceof Error) return err.message;
      if (typeof err === "object" && err !== null && "message" in err) {
        try {
          const maybe = (err as Record<string, unknown>).message;
          if (typeof maybe === "string") return maybe;
          return String(maybe);
        } catch {
          return "An unknown error occurred.";
        }
      }
      try {
        return String(err);
      } catch {
        return "An unknown error occurred.";
      }
    };

    const errorMessage = getErrorMessage(errorUnknown);

    console.error("Error details:", errorUnknown);

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500 }
    );
  }
}
