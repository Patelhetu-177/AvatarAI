import Image from "next/image";
import { redirect } from "next/navigation";

import Agent from "@/components/Agent";
import { getRandomInterviewCover } from "@/lib/utils";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { getCurrentUser } from "@/lib/actions/auth.action";
import DisplayTechIcons from "@/components/DisplayTechIcons";

const InterviewDetails = async ({ params }: { params: { id: string } }) => {
  const { id } = params;

  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const interview = await getInterviewById(id);
  if (!interview) redirect("/skillwise");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user.id,
  });

  return (
    <>
      <div className="flex flex-row gap-4 justify-between m-5">
        <div className="flex flex-row gap-4 items-center max-sm:flex-col">
          <div className="flex flex-row gap-4 items-center ">
            <Image
              src={getRandomInterviewCover()}
              alt="cover-image"
              width={40}
              height={40}
              className="rounded-full object-cover size-[40px]"
            />
            <h3 className="capitalize text-black dark:text-white ">
              {interview.role} Interview
            </h3>
          </div>

          <DisplayTechIcons techStack={interview.techstack} />
        </div>

        <p className="px-4 py-2 rounded-lg h-fit bg-gray-200 text-black dark:bg-gray-700 dark:text-gray-100">
          {interview.type}
        </p>
      </div>

      <Agent
        userName={user.name ?? "Guest"}
        userId={user.id}
        interviewId={id}
        type="interview"
        questions={interview.questions}
        feedbackId={feedback?.id}
      />
    </>
  );
};

export default InterviewDetails;
