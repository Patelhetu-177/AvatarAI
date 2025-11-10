"use client";

import { motion } from "framer-motion";
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

interface AIMessageMetadata {
  model?: string;
  tokens?: number;
  isAI?: boolean;
  responseTime?: string;
  [key: string]: unknown;
}

export interface AIMessageContent {
  content: string;
  metadata?: AIMessageMetadata;
}

export interface ChatMessageProps {
  id?: string;
  role: "system" | "user";
  content?: string | AIMessageContent;
  isLoading?: boolean;
  src?: string;
  isError?: boolean;
  onDelete?: (messageId: string) => void;
  metadata?: {
    language?: string;
    [key: string]: unknown;
  };
  language?: string;
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (utteranceRef.current && window.speechSynthesis?.speaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    };
  }, [content, isLoading, role]);

  const getContentAsString = (
    content: string | AIMessageContent | undefined
  ): string => {
    if (!content) return "";
    if (typeof content === "string") return content;
    if (typeof content === "object" && "content" in content) {
      return content.content;
    }
    return "";
  };

  const onCopy = () => {
    const textToCopy = getContentAsString(content);
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      toast({
        description: "Message copied to clipboard",
        duration: 3000,
      });
    }
  };

  const onListen = () => {
    const textToSpeak = getContentAsString(content);
    if (textToSpeak && typeof window !== "undefined") {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        toast({
          description: "Speaking stopped.",
          duration: 3000,
        });
      } else {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
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
      description: "We'll try to improve!",
      duration: 3000,
    });
  };

  const handleDelete = () => {
    if (id && onDelete) {
      onDelete(id);
    }
  };

  const showButtons = !isLoading && content;

  const typingContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const typingDot = {
    hidden: { opacity: 0.5, y: 0 },
    show: (i: number) => ({
      opacity: 1,
      y: -5,
      transition: {
        y: {
          duration: 0.6,
          repeat: Infinity,
          repeatType: "reverse" as const,
          ease: "easeInOut",
          delay: i * 0.2,
        },
        opacity: {
          duration: 0.3,
        },
      },
    }),
  };


  return (
    <div
      className={cn(
        "group flex items-start gap-x-3 py-4 w-full",
        role === "user" ? "justify-end" : "justify-start"
      )}
    >
      {role === "system" && src && (
        <div className="relative">
          <BotAvatar src={src} />
         
        </div>
      )}

      <div className="flex flex-col max-w-[80%]">
        <div
          className={cn(
            "rounded-md px-4 py-2 text-sm shadow-md inline-flex flex-col",
            role === "user"
              ? "bg-primary/10"
              : "bg-neutral-200 dark:bg-neutral-700",
            isError &&
              "bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100",
            "prose dark:prose-invert"
          )}
        >
          {isLoading && role === "system" ? (
            <div className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-neutral-800 rounded-lg shadow-md">
              <motion.div
                variants={typingContainer}
                initial="hidden"
                animate="show"
                className="flex items-center space-x-1.5"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    custom={i}
                    variants={typingDot}
                    className="w-2.5 h-2.5 bg-blue-500 dark:bg-blue-400 rounded-full"
                  />
                ))}
              </motion.div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                AI is typing...
              </span>
            </div>
          ) : isError ? (
            <div className="text-red-500">
              {getContentAsString(content) || "An error occurred"}
            </div>
          ) : (
            <div className="w-full">
              <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:mb-4 prose-headings:mt-6 prose-headings:mb-3 prose-ul:my-4 prose-ol:my-4 prose-li:my-1">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    pre: ({
                      children,
                    }: React.HTMLAttributes<HTMLElement>) => {
                      const getCodeContent = (
                        children: React.ReactNode
                      ): string => {
                        if (!children) return "";
                        if (typeof children === "string") return children;
                        if (Array.isArray(children)) {
                          return children
                            .map((child) => getCodeContent(child))
                            .join("");
                        }
                        if (
                          children &&
                          typeof children === "object" &&
                          "props" in children
                        ) {
                          return getCodeContent(children.props.children);
                        }
                        return "";
                      };

                      const handleCopy = () => {
                        const code = getCodeContent(children);
                        navigator.clipboard.writeText(code);
                        toast({
                          description: "Code copied to clipboard",
                          duration: 2000,
                        });
                      };

                      return (
                        <div className="relative my-4">
                          <pre className="overflow-x-auto p-4 bg-gray-800 text-gray-100 text-sm rounded-lg border border-gray-700">
                            {children}
                          </pre>
                          <button
                            onClick={handleCopy}
                            className="absolute top-2 right-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
                            title="Copy code"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    },
                    code: ({
                      className = "",
                      children,
                      ...props
                    }: React.HTMLAttributes<HTMLElement> & {
                      className?: string;
                      inline?: boolean;
                    }) => {
                      const match = /language-(\w+)/.exec(className || "");
                      const nodeClass = (props as { className?: string | string[] }).className || "";
                      const isInline =
                        typeof nodeClass === "string"
                          ? nodeClass.includes("inline")
                          : Array.isArray(nodeClass)
                          ? nodeClass.some(
                              (c) =>
                                typeof c === "string" && c.includes("inline")
                            )
                          : false;
                      return !isInline && match ? (
                        <code
                          className={cn("font-mono text-sm", className)}
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <code
                          className={cn(
                            "font-mono text-sm px-1.5 py-0.5 rounded",
                            "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
                            className
                          )}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p: ({ children }) => (
                      <p className="text-justify leading-relaxed text-gray-800 dark:text-gray-200">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc pl-6 space-y-1.5 my-3">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-6 space-y-1.5 my-3">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-gray-800 dark:text-gray-200">
                        <span className="-ml-1.5">{children}</span>
                      </li>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-7 mb-3">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-6 mb-2">
                        {children}
                      </h3>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 my-4 text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/50 p-3 rounded-r">
                        {children}
                      </blockquote>
                    ),
                    a: ({ children, href }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                      >
                        {children}
                      </a>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-gray-900 dark:text-white">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-gray-800 dark:text-gray-200">
                        {children}
                      </em>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4">
                        <table className="min-w-full border-collapse">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-left text-sm font-medium text-gray-700 dark:text-gray-200">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-200 dark:border-gray-600 px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {children}
                      </td>
                    ),
                    tr: ({ children }) => (
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        {children}
                      </tr>
                    ),
                  }}
                >
                  {getContentAsString(content)}
                </ReactMarkdown>

                {content &&
                  typeof content === "object" &&
                  "metadata" in content &&
                  content.metadata && (
                    <div className="mt-4 pt-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 space-y-1">
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {content.metadata.model && (
                          <div className="flex items-center">
                            <span className="font-medium">Model:</span>
                            <span className="ml-1.5 font-mono">
                              {content.metadata.model}
                            </span>
                          </div>
                        )}
                        {content.metadata.responseTime && (
                          <div className="flex items-center">
                            <span className="font-medium">Response Time:</span>
                            <span className="ml-1.5">
                              {content.metadata.responseTime}
                            </span>
                          </div>
                        )}
                        {content.metadata.tokens !== undefined && (
                          <div className="flex items-center">
                            <span className="font-medium">Tokens:</span>
                            <span className="ml-1.5">
                              {content.metadata.tokens.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {showButtons && (
            <div
              className={cn(
                "flex gap-x-2 mt-2 pt-2 border-t border-neutral-300 dark:border-neutral-600",
                role === "user" ? "justify-end" : "justify-start"
              )}
            >
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
      </div>

      {role === "user" && <UserAvatar />}
    </div>
  );
};
