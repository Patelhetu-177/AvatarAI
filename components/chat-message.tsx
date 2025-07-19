"use client";

import { useTheme } from "next-themes";
import { BeatLoader } from "react-spinners";
import {
  Copy,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Trash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BotAvatar } from "@/components/bot-avatar";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useEffect, useState, useRef } from "react";

export interface ChatMessageProps {
  id?: string;
  role: "system" | "user";
  content?: string;
  isLoading?: boolean;
  src?: string;
  isError?: boolean;
  onDelete?: (messageId: string) => void;
}

export const ChatMessage = ({
  id,
  role,
  content,
  isLoading,
  src,
  isError,
  onDelete,
}: ChatMessageProps) => {
  const { toast } = useToast();
  const { theme } = useTheme();

  const [isSpeaking, setIsSpeaking] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (utteranceRef.current && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    };
  }, [content, isLoading, role]);

  const onCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
      toast({
        description: "Message copied to clipboard",
        duration: 3000,
      });
    }
  };

  const onListen = () => {
    if (content && typeof window !== "undefined") {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        toast({
          description: "Speaking stopped.",
          duration: 3000,
        });
      } else {
        const utterance = new SpeechSynthesisUtterance(content);
        utteranceRef.current = utterance;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
        toast({
          description: "Speaking message...",
          duration: 3000,
        });
      }
    }
  };

  const onThumbsUp = () => {
    toast({
      description: "Thanks for the feedback!",
      duration: 3000,
    });
  };

  const onThumbsDown = () => {
    toast({
      description: "Sorry to hear that. We'll try to improve!",
      duration: 3000,
    });
  };

  const handleDelete = () => {
    if (id && onDelete) {
      onDelete(id);
    }
  };

  const showButtons = !isLoading && content;
  const showBeatLoader = isLoading && role === "system" && !content;

  return (
    <div
      className={cn(
        "group flex items-start gap-x-3 py-4 w-full",
        role === "user" && "justify-end"
      )}
    >
      {role === "system" && src && !isLoading && <BotAvatar src={src} />}

      {(role === "user" || !isLoading || (isLoading && content)) && (
        <div
          className={cn(
            "rounded-md px-4 py-2 text-sm shadow-md flex flex-col",
            role === "user"
              ? "bg-primary/10"
              : "bg-neutral-200 dark:bg-neutral-700",
            isError &&
              "bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100",
            "prose dark:prose-invert max-w-sm"
          )}
        >
          {showBeatLoader ? (
            <BeatLoader
              size={5}
              color={theme === "light" ? "black" : "white"}
            />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre: ({ children }) => (
                  <pre className="overflow-x-auto my-2 bg-gray-800 text-white p-2 rounded-md">
                    {children}
                  </pre>
                ),
                code: ({ children, className }) => (
                  <code
                    className={cn(
                      "font-mono text-sm px-1 py-0.5 rounded",
                      className
                        ? "bg-gray-700 text-white"
                        : "bg-gray-200 dark:bg-gray-700"
                    )}
                  >
                    {children}
                  </code>
                ),
                p: ({ children }) => (
                  <p className="mb-1 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-1 last:mb-0">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-1 last:mb-0">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li className="mb-0.5">{children}</li>,
                a: ({ children, href }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold">{children}</strong>
                ),
                em: ({ children }) => <em className="italic">{children}</em>,
              }}
            >
              {content || ""}
            </ReactMarkdown>
          )}

          {showButtons && (
            <div className="flex justify-end gap-x-2 mt-2 pt-2 border-t border-neutral-300 dark:border-neutral-600">
              <Button
                onClick={onCopy}
                size="icon"
                variant="ghost"
                className="h-6 w-6"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                onClick={onListen}
                size="icon"
                variant="ghost"
                className="h-6 w-6"
              >
                {isSpeaking ? (
                  <VolumeX className="h-3 w-3" />
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
              </Button>

              {role === "system" && (
                <>
                  <Button
                    onClick={onThumbsUp}
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                  <Button
                    onClick={onThumbsDown}
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </>
              )}

              {id && onDelete && (
                <Button
                  onClick={handleDelete}
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 text-red-500 hover:text-red-600"
                >
                  <Trash className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      {role === "user" && <UserAvatar />}
    </div>
  );
};
