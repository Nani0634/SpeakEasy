"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Provider = "gemini" | "openai";

// ADDED: New modern conversation topics
type Topic =
  | "At a Restaurant"
  | "Introduce Yourself"
  | "Job Interview"
  | "Traveling"
  | "Small Talk with Strangers"
  | "Hobbies & Entertainment"
  | "Asking for Help";

type DailyProgress = {
  date: string;
  minutes: number;
  goal: number;
};

type StreakData = {
  count: number;
  lastPracticeDate: string | null;
};

type PracticeSession = {
  id: string;
  topic: string;
  provider: Provider;
  messages: Message[];
  correctionCount: number;
  userMessageCount: number;
  accuracy: number;
  createdAt: string;
};

type SpeechRecognitionResultEvent = Event & {
  results: SpeechRecognitionResultList;
};

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const PRACTICE_KEY = "speakeasy-practice";
const HISTORY_KEY = "speakeasy-practice-history";
const DAILY_PROGRESS_KEY = "speakeasy-daily-progress";
const DAILY_HISTORY_KEY = "speakeasy-daily-history";
const STREAK_KEY = "speakeasy-streak";

// ADDED: New topics to the array
const TOPICS: Topic[] = [
  "Introduce Yourself",
  "At a Restaurant",
  "Job Interview",
  "Traveling",
  "Small Talk with Strangers",
  "Hobbies & Entertainment",
  "Asking for Help",
];

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: "gemini", label: "Gemini" },
  { value: "openai", label: "OpenAI" },
];

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getYesterday() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return getDateKey(date);
}

function getDailyProgress(): DailyProgress {
  const today = getToday();
  try {
    const saved = localStorage.getItem(DAILY_PROGRESS_KEY);
    if (!saved) return { date: today, minutes: 0, goal: 15 };
    
    const parsed = JSON.parse(saved) as DailyProgress;
    if (parsed.date !== today) {
      return { date: today, minutes: 0, goal: parsed.goal || 15 };
    }
    return {
      date: today,
      minutes: Number(parsed.minutes) || 0,
      goal: Number(parsed.goal) || 15,
    };
  } catch {
    return { date: today, minutes: 0, goal: 15 };
  }
}

function saveDailyProgress(progress: DailyProgress) {
  try {
    localStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(progress));
  } catch {}
}

function saveDailyHistory(progress: DailyProgress) {
  try {
    const saved = localStorage.getItem(DAILY_HISTORY_KEY);
    let history: Record<string, { minutes: number; goal: number }> = {};
    if (saved) history = JSON.parse(saved);
    
    history[progress.date] = { minutes: progress.minutes, goal: progress.goal };
    localStorage.setItem(DAILY_HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

function getStreak(): StreakData {
  try {
    const saved = localStorage.getItem(STREAK_KEY);
    if (!saved) return { count: 0, lastPracticeDate: null };
    return JSON.parse(saved) as StreakData;
  } catch {
    return { count: 0, lastPracticeDate: null };
  }
}

function updateStreak(): StreakData {
  const today = getToday();
  const yesterday = getYesterday();
  const current = getStreak();
  let nextCount = current.count;

  if (current.lastPracticeDate === today) return current;
  if (current.lastPracticeDate === yesterday) nextCount = current.count + 1;
  else nextCount = 1;

  const next: StreakData = { count: nextCount, lastPracticeDate: today };
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

function calculateAccuracy(userMessageCount: number, correctionCount: number) {
  if (userMessageCount <= 0) return 100;
  const accuracy = ((userMessageCount - correctionCount) / userMessageCount) * 100;
  return Math.max(0, Math.min(100, Math.round(accuracy)));
}

function hasCorrection(content: string) {
  return content.includes("Correction:") || content.includes("❌") || content.includes("✅");
}

function cleanSpeechText(content: string) {
  return content
    .replace(/Conversation:/gi, "")
    .replace(/Correction:/gi, "")
    .replace(/Tip:/gi, "")
    .replace(/❌/g, "")
    .replace(/✅/g, "")
    .replace(/💡/g, "")
    .replace(/\*\*/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatAIResponse(content: string) {
  const conversationMatch = content.match(/Conversation:\s*([\s\S]*?)(?=Correction:|Tip:|$)/i);
  const correctionMatch = content.match(/Correction:\s*([\s\S]*?)(?=Tip:|$)/i);
  const tipMatch = content.match(/Tip:\s*([\s\S]*)/i);

  return {
    conversation: conversationMatch?.[1]?.trim() || content.trim(),
    correction: correctionMatch?.[1]?.trim() || "",
    tip: tipMatch?.[1]?.trim() || "",
  };
}

export default function PracticePage() {
  const supabase = useMemo(() => createClient(), []);

  const [topic, setTopic] = useState<Topic>("Introduce Yourself");
  const [provider, setProvider] = useState<Provider>("gemini");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [started, setStarted] = useState(false);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [correctionCount, setCorrectionCount] = useState(0);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSavingSession, setIsSavingSession] = useState(false);

  const [dailyProgress, setDailyProgress] = useState<DailyProgress>({
    date: getToday(),
    minutes: 0,
    goal: 15,
  });

  const [streak, setStreak] = useState<StreakData>({
    count: 0,
    lastPracticeDate: null,
  });

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const practiceStartedAt = useRef<number | null>(null);
  const lastProgressUpdate = useRef<number | null>(null);
  const hasStartedStreak = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const dailyProgressRef = useRef<DailyProgress>(dailyProgress);

  useEffect(() => {
    dailyProgressRef.current = dailyProgress;
  }, [dailyProgress]);

  const saveDailyProgressToSupabase = useCallback(async (progress: DailyProgress) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;

      const { error } = await supabase.from("daily_progress").upsert(
        {
          user_id: user.id,
          date: progress.date,
          minutes: progress.minutes,
          goal: progress.goal,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,date" }
      );

      if (error) console.error("DAILY PROGRESS ERROR", error);
    } catch (err) {}
  }, [supabase]);

  const loadCloudDailyProgress = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("daily_goal").eq("id", user.id).maybeSingle();
      const profileGoal = Number(profile?.daily_goal) || 15;

      const { data: todayProgress } = await supabase.from("daily_progress")
        .select("date, minutes, goal").eq("user_id", user.id).eq("date", getToday()).maybeSingle();

      const cloudProgress: DailyProgress = {
        date: getToday(),
        minutes: Number(todayProgress?.minutes) || 0,
        goal: profileGoal,
      };

      if (todayProgress) {
        setDailyProgress(cloudProgress);
        dailyProgressRef.current = cloudProgress;
        saveDailyProgress(cloudProgress);
        saveDailyHistory(cloudProgress);
      } else {
        const localProgress = getDailyProgress();
        const nextProgress: DailyProgress = { date: getToday(), minutes: localProgress.minutes, goal: profileGoal };
        setDailyProgress(nextProgress);
        dailyProgressRef.current = nextProgress;
        saveDailyProgress(nextProgress);
        await saveDailyProgressToSupabase(nextProgress);
      }

      const { data: progressRows } = await supabase.from("daily_progress")
        .select("date, minutes, goal").eq("user_id", user.id).order("date", { ascending: false }).limit(365);

      if (progressRows && progressRows.length > 0) {
        const practiceDates = progressRows.map((row) => row.date).filter(Boolean);
        let count = 0;
        let checkDate = new Date();

        while (true) {
          if (practiceDates.includes(getDateKey(checkDate))) {
            count += 1;
            checkDate.setDate(checkDate.getDate() - 1);
          } else break;
        }

        const cloudStreak: StreakData = count > 0
          ? { count, lastPracticeDate: getToday() }
          : { count: 0, lastPracticeDate: null };

        setStreak(cloudStreak);
        try { localStorage.setItem(STREAK_KEY, JSON.stringify(cloudStreak)); } catch {}
      }
    } catch {}
  }, [saveDailyProgressToSupabase, supabase]);

  useEffect(() => {
    try {
      const savedPractice = localStorage.getItem(PRACTICE_KEY);
      if (savedPractice) {
        const parsed = JSON.parse(savedPractice);
        if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
        if (TOPICS.includes(parsed.topic)) setTopic(parsed.topic);
        if (parsed.provider === "gemini" || parsed.provider === "openai") setProvider(parsed.provider);
        setCorrectionCount(Number(parsed.correctionCount) || 0);
        setUserMessageCount(Number(parsed.userMessageCount) || 0);
        if (parsed.messages?.length > 0) setStarted(true);
      }
      const localProgress = getDailyProgress();
      setDailyProgress(localProgress);
      dailyProgressRef.current = localProgress;
      setStreak(getStreak());
    } catch {}
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated) void loadCloudDailyProgress();
  }, [isHydrated, loadCloudDailyProgress]);

  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(PRACTICE_KEY, JSON.stringify({ topic, provider, messages, correctionCount, userMessageCount }));
    } catch {}
  }, [topic, provider, messages, correctionCount, userMessageCount, isHydrated]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const saveCurrentPracticeTime = useCallback(() => {
    if (!practiceStartedAt.current) return;
    const now = Date.now();
    const previous = lastProgressUpdate.current ?? practiceStartedAt.current;
    const elapsedMinutes = Math.floor((now - previous) / 60000);

    if (elapsedMinutes <= 0) return;
    const current = dailyProgressRef.current;
    const nextMinutes = Math.min(current.goal, current.minutes + elapsedMinutes);
    const next: DailyProgress = { ...current, date: getToday(), minutes: nextMinutes };

    dailyProgressRef.current = next;
    setDailyProgress(next);
    saveDailyProgress(next);
    saveDailyHistory(next);
    void saveDailyProgressToSupabase(next);

    lastProgressUpdate.current = now;
    practiceStartedAt.current = now;
  }, [saveDailyProgressToSupabase]);

  useEffect(() => {
    if (!started) return;
    if (!practiceStartedAt.current) practiceStartedAt.current = Date.now();
    if (!lastProgressUpdate.current) lastProgressUpdate.current = practiceStartedAt.current;

    const interval = window.setInterval(() => {
      saveCurrentPracticeTime();
    }, 15000);

    return () => {
      window.clearInterval(interval);
      saveCurrentPracticeTime();
    };
  }, [started, saveCurrentPracticeTime]);

  const recordPractice = useCallback(() => {
    if (hasStartedStreak.current) return;
    const next = updateStreak();
    setStreak(next);
    hasStartedStreak.current = true;

    const current = dailyProgressRef.current;
    const progressForToday: DailyProgress = { ...current, date: getToday() };

    dailyProgressRef.current = progressForToday;
    setDailyProgress(progressForToday);
    saveDailyProgress(progressForToday);
    saveDailyHistory(progressForToday);
    void saveDailyProgressToSupabase(progressForToday);
  }, [saveDailyProgressToSupabase]);

  const speakMessage = useCallback((content: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const text = cleanSpeechText(content);
    if (!text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  const startPractice = useCallback(() => {
    if (started) return;

    // ADDED: Greetings for the new topics
    const openingMessages: Record<Topic, string> = {
      "At a Restaurant": "Hello! Welcome to the restaurant. What would you like to order today?",
      "Introduce Yourself": "Hi! Nice to meet you. Could you introduce yourself?",
      "Job Interview": "Welcome to the interview. Could you tell me a little about yourself?",
      "Traveling": "Hi! Where are you planning to travel, and what kind of trip are you looking forward to?",
      "Small Talk with Strangers": "Hi there! Beautiful day today, isn't it? How are you doing?",
      "Hobbies & Entertainment": "Hey! I'm looking for some new recommendations. What do you like to do for fun?",
      "Asking for Help": "Hello! You look like you might need some assistance. How can I help you?",
    };

    const opening = openingMessages[topic];

    setMessages([{ role: "assistant", content: opening }]);
    setStarted(true);
    practiceStartedAt.current = Date.now();
    lastProgressUpdate.current = Date.now();
    recordPractice();
    speakMessage(opening);
  }, [started, topic, recordPractice, speakMessage]);

  const saveCurrentSession = useCallback(async () => {
    if (messages.length === 0 || userMessageCount <= 0) return;
    const accuracy = calculateAccuracy(userMessageCount, correctionCount);
    const session: PracticeSession = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      topic,
      provider,
      messages,
      correctionCount,
      userMessageCount,
      accuracy,
      createdAt: new Date().toISOString(),
    };

    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      let history: PracticeSession[] = [];
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) history = parsed;
      }
      history.unshift(session);
      history = history.slice(0, 100);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch {}

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("practice_sessions").insert({
        user_id: user.id,
        topic,
        provider,
        messages,
        correction_count: correctionCount,
        user_message_count: userMessageCount,
        accuracy,
        created_at: session.createdAt,
      });
      if (error) console.error("Failed to save to Supabase:", error);
    } catch (err) {}
  }, [messages, userMessageCount, correctionCount, topic, provider, supabase]);

  const newConversation = useCallback(async () => {
    if (isSavingSession) return;
    setIsSavingSession(true);
    try {
      saveCurrentPracticeTime();
      await saveCurrentSession();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      recognitionRef.current = null;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      try { localStorage.removeItem(PRACTICE_KEY); } catch {}
      setMessage("");
      setMessages([]);
      setStarted(false);
      setListening(false);
      setLoading(false);
      setCorrectionCount(0);
      setUserMessageCount(0);
      practiceStartedAt.current = null;
      lastProgressUpdate.current = null;
      hasStartedStreak.current = false;
    } finally {
      setIsSavingSession(false);
    }
  }, [isSavingSession, saveCurrentPracticeTime, saveCurrentSession]);

  const handleTopicChange = async (newTopic: Topic) => {
    if (newTopic === topic) return;
    if (messages.length > 0) await newConversation();
    setTopic(newTopic);
  };

  const handleProviderChange = async (newProvider: Provider) => {
    if (newProvider === provider) return;
    if (messages.length > 0) await newConversation();
    setProvider(newProvider);
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || loading) return;
    if (!started) startPractice();
    recordPractice();

    const userMessage: Message = { role: "user", content: trimmedMessage };
    const conversation: Message[] = [...messages, userMessage];

    setMessages([...conversation, { role: "assistant", content: "" }]);
    setMessage("");
    setUserMessageCount((current) => current + 1);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation, provider, topic }),
      });

      if (!response.ok) throw new Error(`Status ${response.status}`);

      if (provider === "gemini") {
        if (!response.body) throw new Error("Empty stream");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullReply = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line) continue;
            const data = line.startsWith("data:") ? line.slice(5).trim() : line;
            if (!data || data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const chunk = parsed.text ?? parsed.reply ?? parsed.content ?? "";
              if (typeof chunk === "string") {
                fullReply += chunk;
                setMessages((current) => {
                  const updated = [...current];
                  const lastIndex = updated.length - 1;
                  if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
                    updated[lastIndex] = { role: "assistant", content: fullReply };
                  }
                  return updated;
                });
              }
            } catch {
              if (!data.startsWith("{") && !data.startsWith("[")) {
                fullReply += data;
                setMessages((current) => {
                  const updated = [...current];
                  const lastIndex = updated.length - 1;
                  if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
                    updated[lastIndex] = { role: "assistant", content: fullReply };
                  }
                  return updated;
                });
              }
            }
          }
        }

        const finalLine = buffer.trim();
        if (finalLine && finalLine !== "[DONE]") {
          const data = finalLine.startsWith("data:") ? finalLine.slice(5).trim() : finalLine;
          try {
            const parsed = JSON.parse(data);
            const chunk = parsed.text ?? parsed.reply ?? parsed.content ?? "";
            if (typeof chunk === "string") fullReply += chunk;
          } catch {
            if (!data.startsWith("{") && !data.startsWith("[")) fullReply += data;
          }
        }

        if (!fullReply.trim()) throw new Error("Empty response.");
        if (hasCorrection(fullReply)) setCorrectionCount((c) => c + 1);
        
        setMessages((current) => {
          const updated = [...current];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
            updated[lastIndex] = { role: "assistant", content: fullReply };
          }
          return updated;
        });
        speakMessage(fullReply);

      } else {
        const data = await response.json();
        const reply = data.reply ?? data.content ?? data.message ?? "";
        if (typeof reply !== "string" || !reply.trim()) throw new Error("Empty response.");
        
        if (hasCorrection(reply)) setCorrectionCount((c) => c + 1);
        setMessages((current) => {
          const updated = [...current];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
            updated[lastIndex] = { role: "assistant", content: reply };
          }
          return updated;
        });
        speakMessage(reply);
      }
    } catch (error) {
      setMessages((current) => {
        const updated = [...current];
        const lastIndex = updated.length - 1;
        if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
          updated[lastIndex] = { role: "assistant", content: "Sorry, I couldn't connect right now. Please try again." };
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    if (typeof window === "undefined") return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please try Google Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setMessage(transcript);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
      if (!started) startPractice();
    } catch {
      setListening(false);
      recognitionRef.current = null;
    }
  };

  const currentAccuracy = calculateAccuracy(userMessageCount, correctionCount);
  const goal = dailyProgress.goal > 0 ? dailyProgress.goal : 15;
  const minutes = Math.min(dailyProgress.minutes, goal);
  const goalPercentage = Math.min(100, Math.round((minutes / goal) * 100));

  return (
    // Removed solid backgrounds for full glass effect
    <main className="min-h-screen pb-24 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-teal-700">
              AI English Practice
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl drop-shadow-sm">
              Practice speaking English
            </h1>
            <p className="mt-2 max-w-2xl text-slate-700 font-medium">
              Have natural conversations with AI, get corrections, and build your speaking confidence.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void newConversation()}
            disabled={isSavingSession}
            className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/30 backdrop-blur-md px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:bg-white/50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSavingSession ? "Saving..." : messages.length > 0 ? "Finish & New" : "+ New Conversation"}
          </button>
        </div>

        {/* Daily Goal + Streak */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {/* Daily Goal - Glassmorphism */}
          <div className="rounded-2xl border border-white/40 bg-white/30 backdrop-blur-md p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Daily Goal</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {minutes}
                  <span className="text-base font-medium text-slate-500"> / {goal} min</span>
                </p>
              </div>
              <span className="rounded-xl bg-white/50 backdrop-blur-sm px-3 py-2 text-lg shadow-sm">🎯</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/40 border border-white/30">
              <div
                className="h-full rounded-full bg-teal-500 shadow-sm transition-all"
                style={{ width: `${goalPercentage}%` }}
              />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-600">
              {goalPercentage >= 100 ? "Daily goal complete! 🎉" : `${goalPercentage}% completed today`}
            </p>
          </div>

          {/* Streak - Glassmorphism */}
          <div className="rounded-2xl border border-white/40 bg-white/30 backdrop-blur-md p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Practice Streak</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {streak.count}
                  <span className="ml-1 text-base font-medium text-slate-500">
                    {streak.count === 1 ? "day" : "days"}
                  </span>
                </p>
              </div>
              <span className="rounded-xl bg-white/50 backdrop-blur-sm px-3 py-2 text-lg shadow-sm">🔥</span>
            </div>
            <p className="mt-4 text-xs font-medium text-slate-600">
              Keep practicing every day to grow your streak.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {/* Topic - Glassmorphism */}
          <div className="rounded-2xl border border-white/40 bg-white/30 backdrop-blur-md p-5 shadow-sm">
            <label htmlFor="topic" className="mb-2 block text-sm font-semibold text-slate-800">
              Conversation Topic
            </label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => void handleTopicChange(e.target.value as Topic)}
              className="w-full rounded-xl border border-white/50 bg-white/50 backdrop-blur-sm px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              {TOPICS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <p className="mt-2 text-xs font-medium text-slate-600">
              Changing the topic starts a fresh conversation.
            </p>
          </div>

          {/* Provider - Glassmorphism */}
          <div className="rounded-2xl border border-white/40 bg-white/30 backdrop-blur-md p-5 shadow-sm">
            <label htmlFor="provider" className="mb-2 block text-sm font-semibold text-slate-800">
              AI Provider
            </label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => void handleProviderChange(e.target.value as Provider)}
              className="w-full rounded-xl border border-white/50 bg-white/50 backdrop-blur-sm px-4 py-3 text-sm text-slate-900 outline-none shadow-sm transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              {PROVIDERS.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <p className="mt-2 text-xs font-medium text-slate-600">
              Changing the provider starts a fresh conversation.
            </p>
          </div>
        </div>

        {/* Practice Card - Glassmorphism */}
        <section className="overflow-hidden rounded-2xl border border-white/40 bg-white/30 backdrop-blur-xl shadow-lg">
          {/* Conversation Header */}
          <div className="flex flex-col gap-3 border-b border-white/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/60 shadow-sm backdrop-blur-md">
                  🤖
                </span>
                <div>
                  <h2 className="font-semibold text-slate-900">{topic}</h2>
                  <p className="text-xs text-slate-600">
                    {provider === "gemini" ? "Powered by Gemini" : "Powered by OpenAI"}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl bg-white/50 backdrop-blur-sm border border-white/40 px-3 py-2 shadow-sm">
              <p className="text-xs text-slate-600">Accuracy</p>
              <p className="text-lg font-bold text-slate-900">{currentAccuracy}%</p>
            </div>
          </div>

          {/* Conversation Area */}
          <div className="min-h-[420px] space-y-5 p-5">
            {messages.length === 0 ? (
              <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/60 shadow-sm border border-white/50 backdrop-blur-md text-4xl">
                  🎤
                </div>
                <h3 className="text-xl font-bold text-slate-900">Ready to practice?</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-slate-700">
                  Start a conversation and practice speaking naturally. The AI will respond, correct mistakes, and give you useful tips.
                </p>
                <button
                  type="button"
                  onClick={startPractice}
                  className="mt-6 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-teal-700 hover:scale-105"
                >
                  Start Practice
                </button>
              </div>
            ) : (
              <>
                {messages.map((item, index) => {
                  const isUser = item.role === "user";
                  const formatted = !isUser && item.content ? formatAIResponse(item.content) : null;

                  return (
                    <div key={`${index}-${item.role}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[90%] sm:max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-sm backdrop-blur-md border ${
                            isUser
                              ? "rounded-br-md bg-teal-600 border-teal-400/30 text-white"
                              : "rounded-bl-md bg-white/60 border-white/50 text-slate-800"
                          }`}
                        >
                          {isUser ? (
                            <p className="whitespace-pre-wrap text-sm leading-6">{item.content}</p>
                          ) : item.content ? (
                            <div className="space-y-3">
                              <p className="whitespace-pre-wrap text-sm leading-6">{formatted?.conversation}</p>
                              {formatted?.correction && (
                                <div className="rounded-xl border border-red-200/50 bg-red-50/80 backdrop-blur-sm p-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-red-600">Correction</p>
                                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-red-800">{formatted.correction}</p>
                                </div>
                              )}
                              {formatted?.tip && (
                                <div className="rounded-xl border border-amber-200/50 bg-amber-50/80 backdrop-blur-sm p-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-amber-600">💡 Tip</p>
                                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-800">{formatted.tip}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                            </div>
                          )}
                        </div>
                        {!isUser && item.content && (
                          <button
                            type="button"
                            onClick={() => speakMessage(item.content)}
                            className="mt-2 text-xs font-medium text-slate-500 transition hover:text-teal-700"
                          >
                            🔊 Listen
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Composer - Glassmorphism */}
          <div className="border-t border-white/30 bg-white/20 backdrop-blur-lg p-4">
            <div className="flex items-end gap-2 rounded-2xl border border-white/50 bg-white/40 backdrop-blur-sm p-2 shadow-sm focus-within:border-teal-400/50 focus-within:bg-white/60 transition-all">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={listening ? "Listening..." : "Type your response in English..."}
                rows={2}
                disabled={loading}
                className="min-h-[52px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 disabled:opacity-50"
              />

              <button
                type="button"
                onClick={toggleListening}
                disabled={loading}
                aria-label={listening ? "Stop listening" : "Start voice input"}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg transition shadow-sm ${
                  listening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-white/60 text-slate-700 border border-white/50 hover:bg-teal-100 hover:text-teal-700 hover:border-teal-200"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {listening ? "⏹" : "🎤"}
              </button>

              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !message.trim()}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-lg text-white shadow-md transition hover:bg-teal-700 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                aria-label="Send message"
              >
                {loading ? "…" : "➤"}
              </button>
            </div>
            <p className="mt-2 text-center text-xs font-medium text-slate-500">
              Press Enter to send · Shift + Enter for a new line
            </p>
          </div>
        </section>

        {/* Bottom Stats - Glassmorphism */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/40 bg-white/30 backdrop-blur-md p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{userMessageCount}</p>
            <p className="mt-1 text-xs font-medium text-slate-600">Your Messages</p>
          </div>
          <div className="rounded-2xl border border-white/40 bg-white/30 backdrop-blur-md p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{correctionCount}</p>
            <p className="mt-1 text-xs font-medium text-slate-600">Corrections</p>
          </div>
          <div className="rounded-2xl border border-white/40 bg-white/30 backdrop-blur-md p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{currentAccuracy}%</p>
            <p className="mt-1 text-xs font-medium text-slate-600">Accuracy</p>
          </div>
          <div className="rounded-2xl border border-white/40 bg-white/30 backdrop-blur-md p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">
              {minutes}<span className="text-sm font-medium text-slate-500"> min</span>
            </p>
            <p className="mt-1 text-xs font-medium text-slate-600">Today</p>
          </div>
        </div>

        {/* Practice Tip - Dark Glassmorphism */}
        <div className="mt-6 rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-md p-5 text-white shadow-lg">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/10 backdrop-blur-sm text-lg shadow-sm">
              💡
            </div>
            <div>
              <h3 className="font-semibold text-teal-300">Practice Tip</h3>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Don't worry about making mistakes. Try to answer naturally and keep the conversation going. Your corrections are there to help you improve!
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}