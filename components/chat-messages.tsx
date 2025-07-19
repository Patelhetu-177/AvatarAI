"use client";

import { Companion, Message, InterviewMate } from "@prisma/client"; // Import InterviewMate
import { ChatMessage, ChatMessageProps } from "./chat-message";
import { ElementRef, useEffect, useRef } from "react";

// Define the same AiEntity type as in ChatClient
type AiEntity = (
  (Companion & {
    messages: Message[];
    _count: { messages: number };
  }) |
  (InterviewMate & {
    messages: Message[];
    _count: { messages: number };
  })
);


interface ChatMessagesProps {
  messages: ChatMessageProps[];
  isLoading: boolean;
  companion: AiEntity; // Changed from Companion to AiEntity
  onDelete?: (messageId: string) => void;
}

export const ChatMessages = ({
  messages = [],
  isLoading,
  companion, // This `companion` is now of type `AiEntity`
  onDelete,
}: ChatMessagesProps) => {
  const scrollRef = useRef<ElementRef<"div">>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-auto pr-4">
      <ChatMessage
        src={companion.src}
        role="system"
        // Ensure companion.name and companion.description are always strings, which they are
        // userName can be null, but not used here, so it's fine.
        content={`Hello, I am ${companion.name}, ${companion.description}`}
      />

      {messages.map((message, index) => (
        <ChatMessage
          key={message.id || `${message.role}-${index}`}
          id={message.id}
          content={message.content}
          role={message.role}
          src={companion.src} // `src` is always string on both
          isError={message.isError}
          onDelete={onDelete}
        />
      ))}

      {isLoading && <ChatMessage role="system" src={companion.src} isLoading />}

      <div ref={scrollRef} />
    </div>
  );
};