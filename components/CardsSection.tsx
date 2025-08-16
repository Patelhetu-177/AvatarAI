"use client";

import Image from "next/image";
import React from "react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3D-card";
import Link from "next/link";

const slides = [
  {
    title: "Chat With Your Idol",
    button: "Start Chatting",
    src: "/celebrity.png",
    route: "/companion",
    content:
      "Engage in dynamic, personalized conversations with your favorite celebrities, historical figures, or fictional characters.",
  },
  {
    title: "Ace Your Interview",
    button: "Start Learning",
    src: "/interview.png",
    route: "/interviewz",
    content:
      "Practice with an AI that provides real-time feedback on your answers and helps you prepare for any interview scenario.",
  },
  {
    title: "Learn a New Skill",
    button: "Practice Now",
    src: "/learning.png",
    route: "/skillwise",
    content:
      "Access interactive tutorials and expert guidance to master new skills at your own pace, from coding to creative writing.",
  },
];

export function CardsSection() {
  return (
    <div className="min-h-screen bg-white dark:bg-black py-12 pt-36">
      <h1 className="text-lg md:text-7xl text-center font-sans font-bold mb-8 text-black dark:text-white">
        Features  ({slides.length})
      </h1>
      <div className="flex flex-wrap justify-center">
        {slides.map((slide, index) => (
          <CardContainer key={index} className="inter-var m-4">
            <CardBody className="bg-white dark:bg-black relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1] border border-black/[0.1] dark:border-white/[0.2] w-auto sm:w-[30rem] h-auto rounded-xl p-6">
              
              <CardItem
                translateZ="50"
                className="text-xl font-bold text-black dark:text-white"
              >
                {slide.title}
              </CardItem>
              <CardItem
                as="p"
                translateZ="60"
                className="text-gray-600 dark:text-gray-300 text-sm max-w-sm mt-2"
              >
                {slide.content}
              </CardItem>
              <CardItem
                translateZ="100"
                rotateX={20}
                rotateZ={-10}
                className="w-full mt-4"
              >
                <Image
                  src={slide.src}
                  height="1000"
                  width="1000"
                  className="h-60 w-full object-cover rounded-xl group-hover/card:shadow-xl"
                  alt={slide.title}
                />
              </CardItem>
              <div className="flex justify-between items-center mt-20">
                <CardItem
                  translateZ={20}
                  translateX={-40}
                  as="button"
                  className="px-4 py-2 rounded-xl text-xs font-normal text-black dark:text-white"
                >
                  <Link href={slide.route}>{slide.button} →</Link>
                </CardItem>
              </div>
            </CardBody>
          </CardContainer>
        ))}
      </div>
    </div>
  );
}
