'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Copy, Volume2, VolumeX, Trash, User, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type MessageRole = 'user' | 'assistant';

interface DocumentChatMessageProps {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date;
  onDelete?: (messageId: string) => void;
  isError?: boolean;
}

export const DocumentChatMessage = ({
  id,
  content,
  role,
  timestamp,
  onDelete,
  isError = false,
}: DocumentChatMessageProps) => {
  const { toast } = useToast();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (utteranceRef.current && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast({
      description: 'Message copied to clipboard',
      duration: 2000,
    });
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(content);
      utteranceRef.current = utterance;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to read message',
        });
      };

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Not supported',
        description: 'Text-to-speech is not supported in your browser',
      });
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(id);
    }
  };

  const formattedTime = timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={cn(
        'group flex gap-3',
        role === 'user' ? 'justify-end' : 'justify-start'
      )}
    >
      {role === 'assistant' && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}
      
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-3 relative group/message shadow-sm',
          role === 'user'
            ? 'bg-primary text-primary-foreground rounded-br-none shadow-primary/20'
            : 'bg-card border border-border rounded-bl-none shadow-sm',
          isError && 'bg-destructive/10 text-destructive-foreground border-destructive/20'
        )}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {role === 'assistant' ? (
            <div className="space-y-2">
              <div className="font-medium text-sm text-muted-foreground mb-1">
                Assistant
              </div>
              <div className="whitespace-pre-wrap break-words text-foreground">
                {content}
              </div>
            </div>
          ) : (
            <div className="whitespace-pre-wrap break-words">
              {content}
            </div>
          )}
          
          <div className={cn(
            'flex items-center justify-between mt-2 pt-2',
            role === 'user' ? 'border-t border-primary/20' : 'border-t border-border/50'
          )}>
            <span className={cn(
              'text-xs',
              role === 'user' ? 'opacity-80' : 'opacity-70 text-muted-foreground'
            )}>
              {formattedTime}
            </span>
            <div className="flex gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0.5 hover:bg-background/20"
                onClick={handleCopy}
                title="Copy message"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0.5 hover:bg-background/20"
                onClick={handleSpeak}
                title={isSpeaking ? 'Stop reading' : 'Read aloud'}
              >
                {isSpeaking ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5" />
                )}
              </Button>
              
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0.5 hover:bg-destructive/20 hover:text-destructive"
                  onClick={handleDelete}
                  title="Delete message"
                >
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {role === 'user' && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
      )}
    </div>
  );
};
