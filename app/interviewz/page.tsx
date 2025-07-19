// app/interviewz/page.tsx
export const dynamic = "force-dynamic";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prismadb from "@/lib/prismadb";
import { InterviewMate} from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import InterviewMateList from "./components/interview-mate-list";
import { SearchInput } from "@/components/search-input";

interface InterviewzPageProps {
  searchParams: {
    name?: string;
    categoryId?: string;
  };
}

const InterviewzPage = async ({ searchParams }: InterviewzPageProps) => {
  const { userId } = auth();

  if (!userId) {
    return redirect("/sign-in");
  }

  const interviewMates: (InterviewMate & {
    _count: { messages: number };
  })[] = await prismadb.interviewMate.findMany({
    where: {
      name: searchParams.name
        ? { contains: searchParams.name, mode: "insensitive" }
        : undefined,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  return (
    <div className="h-full p-4 space-y-2">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Interview Preparation Mates</h2>
        <Link href="/interviewz/new">
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create InterviewMate
          </Button>
        </Link>
      </div>

      <SearchInput />

      <InterviewMateList interviewMates={interviewMates} />
    </div>
  );
};

export default InterviewzPage;
