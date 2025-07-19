// app/chat/[chatId]/page.tsx
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ChatClient } from "./components/client";
import { Companion, InterviewMate, Message, Prisma } from "@prisma/client";

interface ChatIdPageProps {
  params: {
    chatId: string;
  };
}

type AiEntityWithRelations = (
  (Companion & {
    messages: Message[];
    _count: { messages: number };
  }) |
  (InterviewMate & {
    messages: Message[];
    _count: { messages: number };
  })
);

const ChatIdPage = async ({ params }: ChatIdPageProps) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  let aiEntity: AiEntityWithRelations | null = null;
  let aiEntityType: "companion" | "interviewMate" | null = null;

  const includeOptions = {
    messages: {
      orderBy: {
        createdAt: Prisma.SortOrder.asc,
      },
      where: {
        userId,
      },
    },
    _count: {
      select: {
        messages: true,
      },
    },
  };

  const fetchedInterviewMate = await prismadb.interviewMate.findUnique({
    where: {
      id: params.chatId,
    },
    include: includeOptions,
  });

  if (fetchedInterviewMate) {
    // Explicitly assert the type here
    aiEntity = fetchedInterviewMate as AiEntityWithRelations;
    aiEntityType = "interviewMate";
  } else {
    const fetchedCompanion = await prismadb.companion.findUnique({
      where: {
        id: params.chatId,
      },
      include: includeOptions,
    });

    if (fetchedCompanion) {
      // Explicitly assert the type here
      aiEntity = fetchedCompanion as AiEntityWithRelations;
      aiEntityType = "companion";
    }
  }

  if (!aiEntity || !aiEntityType) {
    return redirect("/");
  }

  return <ChatClient initialData={aiEntity} aiType={aiEntityType} />;
};

export default ChatIdPage;