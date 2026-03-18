"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, MessageSquare, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: number;
};

export function ZyraAIAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [isClient, setIsClient] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const storedSessionId = localStorage.getItem("zyraAISessionId");
    const sid =
      storedSessionId ||
      `zyraai-${Math.random().toString(36).substring(2, 11)}`;

    if (!storedSessionId) {
      localStorage.setItem("zyraAISessionId", sid);
    }
    setSessionId(sid);

    setMessages([
      {
        id: "welcome",
        content:
          "Hey there! 👋 I'm Zyra, your AI assistant. Ask me anything about interviews, learning, creating companions, or anything else. How can I help today?",
        role: "assistant",
        timestamp: Date.now(),
      },
    ]);
  }, [isClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isClient) return;

    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: trimmedInput,
      role: "user",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "https://n8n-agent.tech";
      const response = await fetch(
        `${apiUrl}/webhook/webhook/ai-agent-chat-zyra`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmedInput,
            sessionId,
            pageUrl: window.location.href,
          }),
        },
      );

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const replyText = await response.text();

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          content: replyText || "I'm not sure how to respond to that.",
          role: "assistant",
          timestamp: Date.now(),
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: `⚠️ Sorry, I encountered an error: ${error.message}`,
          role: "assistant",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        aria-label="Chat with Zyra"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      <div
        className={`fixed bottom-24 right-6 z-50 flex h-[600px] w-[400px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300 ease-in-out ${
          isOpen
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Zyra</h3>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Online
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-tr-none"
                    : "bg-muted text-foreground rounded-tl-none"
                }`}
              >
                {message.role === "assistant" ? (
                  <article className="prose prose-sm prose-stone dark:prose-invert max-w-none break-words">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </article>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 flex space-x-1.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-duration:800ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-duration:800ms] [animation-delay:200ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/40 [animation-duration:800ms] [animation-delay:400ms]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="border-t border-border bg-background p-4"
        >
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border border-input bg-muted/50 px-4 py-2.5 text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-50"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
