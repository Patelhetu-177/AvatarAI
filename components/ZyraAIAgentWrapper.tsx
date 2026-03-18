"use client";

import { useAuth } from "@clerk/nextjs";
import { ZyraAIAgent } from "./ZyraAIAgent";

export function ZyraAIAgentWrapper() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) return null;

  return <ZyraAIAgent />;
}