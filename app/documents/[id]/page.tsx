'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, Bot, ArrowLeft } from 'lucide-react';
import { DocumentChatMessage } from '@/components/document-chat-message';
import { useRouter } from 'next/navigation';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

type Document = {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  createdAt: string;
};

export default function DocumentChatPage() {
  const router = useRouter();
  const { id } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [document, setDocument] = useState<Document | null>(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(`document-chat-${id}`);
    return saved ? JSON.parse(saved) : [];
  }, [id]);

  const saveMessages = useCallback((msgs: Message[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`document-chat-${id}`, JSON.stringify(msgs));
    }
  }, [id]);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setIsLoadingDocument(true);
        setError(null);
        const response = await fetch(`/api/documents`);

        if (!response.ok) {
          throw new Error(`Failed to fetch documents: ${response.statusText}`);
        }

        const documents = await response.json();
        const doc = documents.find((d: Document) => d.id === id);

        if (!doc) {
          throw new Error('Document not found');
        }

        setDocument(doc);

        const savedMessages = loadMessages();
        if (savedMessages.length > 0) {
          setMessages(savedMessages);
        } else {
          const welcomeMessage = {
            id: 'welcome',
            content: `You are now chatting with the document: ${doc.title}. Ask me anything about it!`,
            role: 'assistant' as const,
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
          saveMessages([welcomeMessage]);
        }
      } catch (err) {
        console.error('Error fetching document:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoadingDocument(false);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id, loadMessages, saveMessages]);

  const updateMessages = useCallback((newMessages: Message[]) => {
    setMessages(newMessages);
    saveMessages(newMessages);

    if (!isLoading) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: messages.length > 1 ? 'smooth' : 'auto'
        });
      }, 0);
    }
  }, [saveMessages, isLoading, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });

  }, []);

  const handleDeleteMessage = (messageId: string) => {
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    updateMessages(updatedMessages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || !document) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: trimmedInput,
      role: 'user',
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    updateMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/documents/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: trimmedInput,
          documentId: id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        content: data.answer || 'I could not process your request.',
        role: 'assistant',
        timestamp: new Date(),
      };

      updateMessages([...updatedMessages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
      };
      updateMessages([...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingDocument) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <h2 className="text-2xl font-bold">Loading document...</h2>
          <p className="text-muted-foreground">Please wait while we load your document.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-destructive">Error loading document</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      <div className="border-b p-4 bg-card">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/documents')}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">{document.title}</h1>
          </div>
          {document.description && (
            <p className="text-muted-foreground">{document.description}</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto p-4 space-y-4">
            {messages.map((message) => (
              <DocumentChatMessage
                key={message.id}
                id={message.id}
                content={message.content}
                role={message.role}
                timestamp={new Date(message.timestamp)}
                onDelete={handleDeleteMessage}
                isError={message.id.startsWith('err-')}
              />
            ))}

            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2 rounded-bl-none">
                  <div className="flex space-x-2 py-2">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-8" />
          </div>
        </ScrollArea>
      </div>

      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto p-4 flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? 'Processing...' : 'Ask a question about this document...'}
            className="flex-1"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            size="icon"
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
