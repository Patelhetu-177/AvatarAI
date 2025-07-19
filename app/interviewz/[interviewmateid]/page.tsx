// app/interviewz/[interviewmateid]/page.tsx
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { InterviewMateForm } from "./components/interview-mate-form";
import { InterviewMate } from "@prisma/client"; 

export const dynamic = "force-dynamic";

interface InterviewMateIdPageProps {
  params: {
    interviewmateid?: string;
  };
}

const InterviewMatePage = async ({ params }: InterviewMateIdPageProps) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  let interviewMate: InterviewMate | null = null;

  const idFromParams = params.interviewmateid;

  if (idFromParams && idFromParams !== "new") {
    interviewMate = await prismadb.interviewMate.findUnique({
      where: {
        id: idFromParams,
        userId,
      },
    });
  }

  return (
    <InterviewMateForm
      initialData={interviewMate ?? undefined}
    />
  );
};

export default InterviewMatePage;