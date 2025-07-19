import { InterviewMate } from "@prisma/client"; // Import InterviewMate model
import Image from "next/image";
import Link from "next/link";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { MessagesSquare } from "lucide-react";

interface InterviewMateListProps {
  interviewMates: (InterviewMate & { // Now uses InterviewMate type
    _count?: {
      messages: number;
    };
  })[];
}

const InterviewMateList = ({ interviewMates }: InterviewMateListProps) => {
  if (interviewMates.length === 0) {
    return (
      <div className="pt-10 flex flex-col items-center justify-center space-y-3">
        <p className="text-muted-foreground text-sm">No Interview Mates found.</p>
        <p className="text-muted-foreground text-sm">Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 pb-10">
      {interviewMates.map((interviewMate) => (
        <Card
          key={interviewMate.id}
          className="bg-primary/10 rounded-xl cursor-pointer hover:opacity-75 transition border-0"
        >
          <Link href={`/chat/${interviewMate.id}`}>
            <CardHeader className="flex items-center justify-center text-center text-muted-foreground">
              <div className="relative w-32 h-32">
                <Image
                  src={interviewMate.src}
                  fill
                  className="rounded-xl object-cover"
                  alt="InterviewMate"
                />
              </div>
              <p className="font-bold">{interviewMate.name}</p>
              <p className="text-xs">{interviewMate.description}</p>
            </CardHeader>
            <CardFooter className="flex items-center justify-between text-xs text-muted-foreground">
              <p className="lowercase">@{interviewMate.userName}</p>
              <div className="flex items-center">
                <MessagesSquare className="w-4 h-4 mr-1" />
                {interviewMate._count?.messages || 0}
              </div>
            </CardFooter>
          </Link>
        </Card>
      ))}
    </div>
  );
};

export default InterviewMateList;