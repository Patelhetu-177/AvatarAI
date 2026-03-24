"use client";

import { Poppins } from "next/font/google";
import { Sparkles } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { SignInButton, UserButton, Show, SignUpButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { MobileSidebar } from "./mobile-sidebar";
import { ModeToggle } from "./mode-toggle";

const font = Poppins({
  weight: "600",
  subsets: ["latin"],
});

export const Navbar = () => {
  return (
    <div className="fixed w-full z-50 flex justify-between items-center py-2 px-4 border-b border-primary/10 bg-secondary h-16">
      <div className="flex items-center">
        <MobileSidebar />
        <Link href="/">
          <h1
            className={cn(
              "hidden md:block text-xl md:text-3xl font-bold text-primary",
              font.className,
            )}
          >
            Avatar<span className="text-green-600">AI</span>
          </h1>
        </Link>
      </div>

      <div className="flex items-center gap-x-3">
        <Link href="/pricing">
          <Button size="sm" variant="premium">
            UpGrade
            <Sparkles className="h-4 w-4 fill-white text-white ml-2" />
          </Button>
        </Link>
        <ModeToggle />
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton>
            <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
              Sign Up
            </button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </div>
  );
};
