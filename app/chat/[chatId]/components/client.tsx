"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatHeader } from "@/components/chat-header";
import { Companion, Message, InterviewMate } from "@prisma/client";
import { ChatForm } from "@/components/chat-form";
import { ChatMessages } from "@/components/chat-messages";
import { ChatMessageProps } from "@/components/chat-message";
import LanguageDropdown from "./LanguageDropdown";
import { useUser, useAuth } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";

type AiEntity = (Companion | InterviewMate) & {
  messages: Message[];
  _count: { messages: number };
};

interface ChatClientProps {
  initialData: AiEntity;
  aiType: "companion" | "interviewMate";
}

export const ChatClient = ({ initialData, aiType }: ChatClientProps) => {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isClient, setIsClient] = useState(false);
  
  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    const storedLang = localStorage.getItem('I18N_LANGUAGE') || 'en';
    setCurrentLanguage(storedLang);
  }, []);
  
  const [messages, setMessages] = useState<ChatMessageProps[]>(
    initialData.messages.map((msg) => ({
      id: msg.id,
      role: msg.role === "user" ? "user" : "system",
      content: msg.content,
      metadata: { language: currentLanguage }
    }))
  );
  
  // Update messages when language changes
  useEffect(() => {
    if (isClient) {
      setMessages(prev => prev.map(msg => ({
        ...msg,
        metadata: { ...msg.metadata, language: currentLanguage }
      })));
    }
  }, [currentLanguage, isClient]);
  
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [input, setInput] = useState("");

  const handleLanguageChange = useCallback((newLanguage: string) => {
    if (isClient) {
      setCurrentLanguage(newLanguage);
      localStorage.setItem('I18N_LANGUAGE', newLanguage);
    }
  }, [isClient]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      toast({
        variant: "destructive",
        description: "You must be logged in to chat.",
        duration: 3000,
      });
      return;
    }

    const userMessage: ChatMessageProps = {
      role: "user",
      content: input,
      metadata: { language: currentLanguage }
    };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsLoadingResponse(true);

    try {
      const authToken = await getToken();
      if (!authToken) throw new Error("Authentication token not available.");

      const response = await fetch(`/api/chat/${initialData.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": currentLanguage,
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          prompt: input,
          lang: currentLanguage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Could not get reader for response body.");

      let accumulatedResponse = "";
      let messageIndexToUpdate = messages.length;

      setMessages((current) => {
        const newMessages = [...current, { 
          role: "system" as const, 
          content: "", 
          metadata: { language: currentLanguage } 
        }];
        messageIndexToUpdate = newMessages.length - 1;
        return newMessages;
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        accumulatedResponse += chunk;

        setMessages((current) => {
          if (messageIndexToUpdate !== -1 && current[messageIndexToUpdate]) {
            const updatedMessages = [...current];
            updatedMessages[messageIndexToUpdate] = {
              ...updatedMessages[messageIndexToUpdate],
              content: accumulatedResponse,
              metadata: { language: currentLanguage }
            };
            return updatedMessages;
          }
          return current;
        });
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      
      toast({
        variant: "destructive",
        description: `Failed to get response: ${errorMessage}`,
        duration: 5000,
      });

      setMessages((current) => {
        const newMessages = [...current];
        const errorMessageIndex = newMessages.findIndex(
          (msg) => msg.role === "system" && !msg.content
        );
        
        if (errorMessageIndex !== -1) {
          newMessages[errorMessageIndex] = {
            ...newMessages[errorMessageIndex],
            content: `Error: ${errorMessage}`,
            isError: true,
          };
        } else {
          newMessages.push({
            role: "system",
            content: `Error: ${errorMessage}`,
            isError: true,
          });
        }
        return newMessages;
      });
    } finally {
      setIsLoadingResponse(false);
      router.refresh();
    }
  };

  const onDeleteMessage = async (messageId: string) => {
    if (!user?.id) {
      toast({
        variant: "destructive",
        description: "You must be logged in to delete messages.",
        duration: 3000,
      });
      return;
    }

    try {
      const authToken = await getToken();
      if (!authToken) {
        throw new Error("Authentication token not available.");
      }
      const response = await fetch(`/api/chat/message/${messageId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to delete message: ${response.statusText}` 
        );
      }

      toast({
        description: "Message deleted successfully.",
        duration: 3000,
      });

      setMessages((current) => current.filter((msg) => msg.id !== messageId));
      router.refresh();
    } catch (error) {
      console.error("Error deleting message:", error);
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      toast({
        variant: "destructive",
        description: `Failed to delete message: ${errorMessage}`,
        duration: 5000,
      });
    }
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-2">
      <div className="flex justify-between items-center">
        <ChatHeader companion={initialData} aiType={aiType} />
        <LanguageDropdown 
          initialLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <ChatMessages
          companion={initialData}
          isLoading={isLoadingResponse}
          messages={messages}
          onDelete={onDeleteMessage}
        />
        
      </div>
      <ChatForm
        isLoading={isLoadingResponse}
        input={input}
        handleInputChange={handleInputChange}
        onSubmit={onSubmit}
      />
    </div>
  );
};