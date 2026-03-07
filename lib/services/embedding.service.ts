const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const cleanedText = text.replace(/\n/g, " ").trim();
    if (!cleanedText || !GOOGLE_API_KEY) {
      console.warn("Empty text or missing API key, returning zero vector");
      return new Array(768).fill(0);
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "models/gemini-embedding-001",
          content: { parts: [{ text: cleanedText }] },
          outputDimensionality: 768,
        }),
      },
    );

    if (!res.ok) {
      const errorBody = await res.text();
      throw new Error(`Embedding API error [${res.status}]: ${errorBody}`);
    }

    const data = await res.json();
    const values = data?.embedding?.values;

    if (!values || !Array.isArray(values) || values.length === 0) {
      throw new Error("Embedding API returned empty result");
    }

    return values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return new Array(768).fill(0);
  }
}