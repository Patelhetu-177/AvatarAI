import { GoogleGenerativeAI } from "@google/generative-ai";
import { FormattedDocument } from "./documentFormatter";

const genAI = new GoogleGenerativeAI(
  process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateGeminiResumeReview(
  doc: FormattedDocument,
): Promise<string> {
  const prompt = `You are a highly experienced resume reviewer, ATS analyzer, and technical recruiter.

Analyze the resume deeply and generate a structured, detailed, and highly actionable review.


RESUME ANALYSIS: ${doc.title || "Candidate Resume"}

Summary:
- Provide a concise 2-3 line evaluation of the resume quality, strengths, and major gaps.

Executive Summary:
- Highlight 3-5 key strengths of the resume
- Highlight 3-5 key weaknesses or missing elements
- Give an overall recruiter impression of this candidate

Overall Resume Score:
- ATS Compatibility: ⭐⭐⭐⭐⭐ (give rating out of 5 and short reason)
- Content Quality: ⭐⭐⭐⭐⭐ (give rating and reason)
- Structure & Formatting: ⭐⭐⭐⭐⭐ (give rating and reason)
- Impact & Achievements: ⭐⭐⭐⭐⭐ (give rating and reason)
- Keyword Optimization: ⭐⭐⭐⭐⭐ (give rating and reason)
- Tip: A score above 4 in all categories significantly increases interview chances

Contact Information:
- Check if contact section is clearly present or missing
- Check for email, phone, LinkedIn, GitHub or portfolio
- Clearly mention missing elements
Suggestions:
- Provide 3-4 specific improvements for professionalism and completeness

Professional Summary:
- Check if summary/objective is present or missing
- Evaluate clarity, impact, and relevance
Suggestions:
- Provide 3-4 specific improvements with examples

Work Experience:
- Check if experience section is present or missing
- Evaluate:
  - Use of action verbs
  - Quantification of impact
  - Clarity of responsibilities
  - Relevance to target roles
Suggestions:
- Provide 4-6 improvements with examples using metrics and STAR method

Skills Analysis:
- Check if skills section is present or missing
- Evaluate relevance and organization
Suggestions:
- Recommend proper categorization (Languages, Frameworks, Tools)
- Suggest missing high-value skills if applicable
- Ensure alignment with industry expectations

Projects / Practical Work:
- Evaluate quality and relevance of projects
- Check for:
  - Problem statement clarity
  - Tech stack usage
  - Measurable outcomes
Suggestions:
- Provide 3-5 strong improvements to make projects impactful

Education:
- Check if education section is present or missing
- Evaluate completeness (degree, institute, CGPA)
Suggestions:
- Provide improvements and additional elements to include

ATS Optimization:
Key Checks:
- Use of standard section headings
- Presence of relevant keywords
- ATS-friendly formatting
- Avoidance of complex layouts
Suggestions:
- Suggest specific keyword improvements based on resume content
- Suggest formatting fixes for ATS parsing

Formatting & Design:
- Evaluate readability, spacing, alignment, and structure
Suggestions:
- Provide 3-4 improvements for better visual hierarchy and clarity

Common Mistakes Detected:
- Identify real issues in the resume (avoid generic points)
- Do not repeat points already mentioned above

Final Recommendations:
- Provide 5-7 high-impact improvements that will significantly increase shortlist chances

General Tips:
- Provide 5 concise best practices for resume improvement

RULES:
- Use only plain text
- Do not use markdown or bold formatting
- Use "-" for bullet points only
- Do not repeat the same suggestion
- Be specific, not generic
- Do not give all high scores; be realistic and critical
- Ensure the output is detailed and at least one full page

Resume Content:
${doc.summary}
${doc.sections.map((s) => (s.title ? s.title + ":\n" : "") + (typeof s.content === "string" ? s.content : Array.isArray(s.content) ? s.content.join("\n") : JSON.stringify(s.content))).join("\n\n")}

Review:`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}
