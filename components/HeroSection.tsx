"use client";

import React from "react";
import { motion } from "framer-motion";
import { BackgroundLines } from "@/components/ui/background-lines";

export function HeroSection() {
  return (
    <BackgroundLines className="-top-40 left-0 md:left-60 md:-top-20">
      <div className="flex flex-col items-center justify-center h-full text-center px-4 py-16 sm:px-6 sm:py-20">
        {/* Animated Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 
                     text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight drop-shadow-lg leading-tight"
        >
          Introducing AvatarAI
        </motion.h1>

        {/* Sub-heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-black dark:text-white text-2xl sm:text-3xl md:text-5xl font-bold mt-6 leading-snug"
        >
          Create an Avatar, <br /> Master Your Interview.
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="mt-6 text-gray-700 dark:text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed px-2"
        >
          Experience next-level conversations with AvatarAI — your gateway to
          lifelike chats with AI-powered versions of celebrities and experts.
          Whether you’re preparing for an interview, learning new skills, or
          just having fun, every interaction feels real.
        </motion.p>
      </div>
    </BackgroundLines>
  );
}
