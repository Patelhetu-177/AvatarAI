// app/skillwise/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import InterviewCard from "@/components/InterviewCard";

import {
  getInterviewsByUserId,
  getLatestInterviews,
} from "@/lib/actions/general.action";

async function SkillWise() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const [userInterviews, allInterview] = await Promise.all([
    getInterviewsByUserId(userId),
    getLatestInterviews({ userId }),
  ]);

  const hasPastInterviews = (userInterviews ?? []).length > 0;
  const hasUpcomingInterviews = (allInterview ?? []).length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 px-4 md:px-16 py-8">
      {/* Hero Section */}
      <section className="flex flex-row bg-gray-100 dark:bg-gradient-to-r dark:from-neutral-900 dark:to-neutral-950 h-full py-8 px-8 md:px-16 rounded-3xl items-center justify-between max-sm:flex-col">
        <div className="flex flex-col gap-6 max-w-lg text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-white">
            Get Interview-Ready with AI-Powered Practice & Feedback
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Practice real interview questions & get instant feedback
          </p>

          <Button
            asChild
            className="w-fit !bg-primary-200 !text-dark-100 hover:!bg-primary-200/80 !rounded-full !font-bold px-5 cursor-pointer min-h-10 max-sm:w-full"
          >
            <Link href="/skillwise/interview">Start an Interview</Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>

      {/* Past Interviews */}
      <section className="flex flex-col gap-6 mt-12">
        <h2 className="text-xl md:text-2xl font-semibold text-black dark:text-white">
          Your Interviews
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {hasPastInterviews ? (
            userInterviews?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={userId}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p className="text-gray-700 dark:text-gray-400">
              You haven&apos;t taken any interviews yet
            </p>
          )}
        </div>
      </section>

      {/* Upcoming Interviews */}
      <section className="flex flex-col gap-6 mt-12">
        <h2 className="text-xl md:text-2xl font-semibold text-black dark:text-white">
          Take Interviews
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {hasUpcomingInterviews ? (
            allInterview?.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={userId}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p className="text-gray-700 dark:text-gray-400">
              There are no interviews available
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export default SkillWise;
