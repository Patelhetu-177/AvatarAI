"use client";

import React from "react";
import { BackgroundLines } from "@/components/ui/background-lines";

export function HeroSection() {
  return (
    <BackgroundLines className="-top-40 left-0 md:left-60 md:-top-20">
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-black dark:text-white text-4xl md:text-6xl font-bold">
          Create an Avatar, <br /> Master Your Interview.
        </h1>
        <p className="mt-4 text-gray-700 dark:text-gray-400 text-lg md:text-xl max-w-lg mx-auto">
          Experience next-level conversations with AvatarAI — your gateway to
          lifelike chats with AI-powered versions of celebrities, industry
          experts. Whether you’re preparing for an interview, learning a new
          skill, or just having fun, our AI voices make every interaction feel
          real.
        </p>
      </div>
    </BackgroundLines>
  );
}
