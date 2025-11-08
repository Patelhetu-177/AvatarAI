"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createFeedback } from "@/lib/actions/general.action";

type SavedMessage = { role: "user" | "assistant"; content: string };

interface AgentProps {
  userName: string;
  userId?: string;
  profileImage?: string;
  email?: string;
  role?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
}

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

export default function Agent({
  userName,
  userId,
  profileImage = "/user-avatar.jpeg",
  email,
  role,
  interviewId,
  feedbackId,
  type,
  questions = [],
}: AgentProps) {
  const router = useRouter();

  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [lastMessage, setLastMessage] = useState("");

  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== "undefined" ? window.speechSynthesis : null
  );
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const latestMessagesRef = useRef<SavedMessage[]>([]);

  useEffect(() => {
    latestMessagesRef.current = messages;
    if (messages.length > 0)
      setLastMessage(messages[messages.length - 1].content);
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    interface ExtendedWindow extends Window {
      webkitSpeechRecognition: typeof SpeechRecognition;
    }

    const SR = window.SpeechRecognition || (window as ExtendedWindow).webkitSpeechRecognition;
    if (!SR) {
      recognitionRef.current = null;
      return;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;
  }, []);

  const speak = (text: string) =>
    new Promise<void>((resolve) => {
      const synth = synthRef.current;
      if (!synth) return resolve();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      u.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };
      synth.cancel();
      synth.speak(u);
    });

  const startRecognition = (timeoutMs = 20000) =>
    new Promise<string>((resolve, reject) => {
      const rec = recognitionRef.current;
      if (!rec) return reject(new Error("SpeechRecognition not supported"));

      let done = false;
      const onResult = (ev: Event) => {
        if (done) return;
        done = true;
        try {
          const t = (ev as SpeechRecognitionEvent).results[0][0].transcript;
          cleanup();
          resolve(t);
        } catch (e) {
          cleanup();
          reject(e);
        }
      };
      const onError = (ev: Event) => {
        if (done) return;
        done = true;
        cleanup();
        reject(new Error((ev as SpeechRecognitionErrorEvent)?.error || "Recognition error"));
      };
      const onEnd = () => {
        if (done) return;
        done = true;
        cleanup();
        reject(new Error("No speech detected"));
      };

      function cleanup() {
        if (!rec) return;
        try {
          rec.removeEventListener("result", onResult);
          rec.removeEventListener("error", onError);
          rec.removeEventListener("end", onEnd);
        } catch {}
        try {
          rec.stop();
        } catch {}
        setListening(false);
      }

      rec.addEventListener("result", onResult);
      rec.addEventListener("error", onError);
      rec.addEventListener("end", onEnd);

      setListening(true);
      try {
        rec.start();
      } catch (e) {
        cleanup();
        return reject(e);
      }

      setTimeout(() => {
        if (!done) {
          done = true;
          cleanup();
          reject(new Error("listening timed out"));
        }
      }, timeoutMs);
    });

  const askQuestionFlow = async (index: number) => {
    if (!questions || index >= questions.length) {
      await speak("Thank you. The interview is complete. Ending now.");
      setCallStatus(CallStatus.FINISHED);
      return;
    }

    const q = questions[index];
    setMessages((prev) => [...prev, { role: "assistant", content: q }]);
    await speak(q);

    let answer = "";
    try {
      answer = await startRecognition(20000);
    } catch {
      // If audio capture fails, fall back to text input
      answer =
        window.prompt("Couldn't capture audio. Please type your answer:") || "";
    }

    if (!answer) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: "[no answer]" },
      ]);
    } else {
      setMessages((prev) => [...prev, { role: "user", content: answer }]);
    }

    try {
      const res = await fetch("/api/gemini/followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          answer,
          history: latestMessagesRef.current,
          user: { userName, userId, profileImage, email, role },
        }),
      });
      const data = await res.json();
      if (data?.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply },
        ]);
        await speak(data.reply);
      }
    } catch (err: unknown) {
      console.error("Followup error", err);
    }

    setTimeout(() => askQuestionFlow(index + 1), 700);
  };

  useEffect(() => {
    const saveFeedbackIfFinished = async () => {
      if (callStatus !== CallStatus.FINISHED || !interviewId || !userId) return;
      try {
        const payload = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));
        const { success, feedbackId: id } = await createFeedback({
          interviewId,
          userId,
          transcript: payload,
          feedbackId,
        });

        if (success && id) {
          router.push(`/skillwise/interview/${interviewId}/feedback`);
        } else {
          router.push("/skillwise");
        }
      } catch (e) {
        console.error("save feedback failed", e);
        router.push("/skillwise");
      }
    };

    saveFeedbackIfFinished();
  }, [callStatus, messages, interviewId, userId, feedbackId, router]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    setTimeout(async () => {
      setCallStatus(CallStatus.ACTIVE);
      await speak(`Hello ${userName}. Let's start the interview.`);
      if (type === "interview") {
        askQuestionFlow(0);
      } else {
        await speak("Interview generation mode active.");
        setCallStatus(CallStatus.FINISHED);
      }
    }, 500);
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    recognitionRef.current?.stop();
    synthRef.current?.cancel();
  };

  return (
    <>
      <div className="flex sm:flex-row flex-col gap-10 items-center justify-between w-full">
        <div className="flex-center flex-col gap-2 p-7 h-[400px] rounded-lg border border-gray-300 dark:border-primary-200/50 flex-1 sm:basis-1/2 w-full bg-gray-50 dark:bg-gray-800">
          <div className="z-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/60 rounded-full size-[120px] relative">
            <Image
              src="/ai-avatar.png"
              alt="profile-image"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && (
              <span className="absolute inline-flex size-5/6 animate-ping rounded-full bg-primary-200 opacity-75" />
            )}
          </div>
          <h3 className="text-black dark:text-white">AI Interviewer</h3>
        </div>

        <div className="border border-gray-300 dark:border-primary-200/50 rounded-2xl flex-1 sm:basis-1/2 w-full h-[400px] max-md:hidden">
          <div className="flex flex-col gap-2 justify-center items-center p-7 rounded-2xl min-h-full bg-gray-50 dark:bg-gray-800">
            <Image
              src={profileImage}
              alt="profile-image"
              width={120}
              height={120}
              className="rounded-full object-cover"
            />
            <h3 className="text-black dark:text-white">{userName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{email}</p>
            <p className="text-sm text-black dark:text-gray-300">{role}</p>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="border border-gray-300 dark:border-primary-200/50 rounded-2xl w-full mt-4">
          <div className="rounded-2xl min-h-12 px-5 py-3 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100 text-black dark:text-white"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center mt-6">
        {callStatus !== CallStatus.ACTIVE ? (
          <button
            className={cn(
              "relative inline-block px-7 py-3 font-bold text-sm leading-5 rounded-full shadow-sm min-w-28 cursor-pointer",
              "bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white focus:outline-none focus:shadow-2xl"
            )}
            onClick={handleCall}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75 inset-0 bg-green-400",
                callStatus !== CallStatus.CONNECTING && "hidden"
              )}
            />
            <span className="relative">
              {callStatus === CallStatus.INACTIVE ||
              callStatus === CallStatus.FINISHED
                ? "Call"
                : ". . ."}
            </span>
          </button>
        ) : (
          <button
            className="inline-block px-7 py-3 text-sm font-bold leading-5 text-white transition-colors duration-150 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-full shadow-sm focus:outline-none focus:shadow-2xl min-w-28"
            onClick={handleDisconnect}
          >
            End
          </button>
        )}
      </div>

      <div className="mt-4 text-center">
        {listening && (
          <div className="text-yellow-600 dark:text-yellow-400">Listening…</div>
        )}
      </div>
    </>
  );
}
