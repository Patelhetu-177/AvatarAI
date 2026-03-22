
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { loadDocument } from "@/lib/document-loader";
import { formatDocumentContent } from "@/lib/utils/documentFormatter";
import { generateGeminiResumeReview } from "@/lib/utils/geminiResumeReview";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    if (![
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword"
    ].includes(file.type)) {
      return new NextResponse("Unsupported file type", { status: 400 });
    }

    const docs = await loadDocument(file);
    const docContent = docs.map(d => d.pageContent).join("\n\n");
    const formatted = formatDocumentContent({
      pageContent: docContent,
      metadata: docs[0]?.metadata || {},
    }, docContent);
    const result = await generateGeminiResumeReview(formatted);
    return NextResponse.json({ result });
  } catch (error) {
    console.error("[RESUME_ANALYZER_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
