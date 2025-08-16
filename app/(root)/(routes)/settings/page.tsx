"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackgroundBeams } from "@/components/ui/background-beams";

function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 py-12 pt-36 relative">
      <BackgroundBeams className="absolute top-0 left-0 w-full h-full z-0" />
      <div className="max-w-2xl mx-auto p-4 relative z-10">
        <h1 className="text-lg md:text-7xl text-center font-sans font-bold mb-8 text-black dark:text-white">
          <Button onClick={() => router.back()} size="icon" variant="ghost">
            <ChevronLeft className="h-12 w-12" />
          </Button>
          Settings
        </h1>
        <p className="text-gray-700 dark:text-neutral-400 max-w-lg mx-auto my-2 text-sm text-center">
          This Settings page is currently under construction.
          <br />
          I&apos;m working hard to bring you customization options soon!
        </p>

        <div className="mt-8 text-center">
          <p className="text-black dark:text-white text-lg font-semibold">
            🚧 Features Coming Soon:
          </p>
          <ul className="text-gray-700 dark:text-neutral-400 mt-2 list-disc list-inside text-sm">
            <li>Manage notification preferences</li>
            <li>Theme &amp; accessibility settings</li>
            <li>Account deletion</li>
            <li>Stripe Integration</li>
          </ul>
        </div>

        <div className="mt-10 text-center">
          <Button
            onClick={() => router.push("/")}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            Go Back Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
