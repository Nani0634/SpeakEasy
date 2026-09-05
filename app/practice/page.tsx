"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Provider = "gemini" | "openai";

type Topic =
  | "At a Restaurant"
  | "Introduce Yourself"
  | "Job Interview"
  | "Traveling";

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
  onresult:
    | ((event: SpeechRecognitionResultEvent) => void)
    | null;
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

const TOPICS: Topic[] = [
  "At a Restaurant",
  "Introduce Yourself",
  "Job Interview",
  "Traveling",
];

const PROVIDERS: { value: Provider; label: string }[] = [
  {
    value: "gemini",
    label: "Gemini",
  },
  {
    value: "openai",
    label: "OpenAI",
  },
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

    if (!saved) {
      return {
        date: today,
        minutes: 0,
        goal: 15,
      };
    }

    const parsed = JSON.parse(saved) as DailyProgress;

    if (parsed.date !== today) {
      return {
        date: today,
        minutes: 0,
        goal: parsed.goal || 15,
      };
    }

    return {
      date: today,
      minutes: Number(parsed.minutes) || 0,
      goal: Number(parsed.goal) || 15,
    };
  } catch {
    return {
      date: today,
      minutes: 0,
      goal: 15,
    };
  }
}

function saveDailyProgress(progress: DailyProgress) {
  try {
    localStorage.setItem(
      DAILY_PROGRESS_KEY,
      JSON.stringify(progress),
    );
  } catch {
    // Ignore localStorage errors.
  }
}

function saveDailyHistory(progress: DailyProgress) {
  try {
    const saved = localStorage.getItem(DAILY_HISTORY_KEY);

    let history: Record<
      string,
      {
        minutes: number;
        goal: number;
      }
    > = {};

    if (saved) {
      history = JSON.parse(saved);
    }

    history[progress.date] = {
      minutes: progress.minutes,
      goal: progress.goal,
    };

    localStorage.setItem(
      DAILY_HISTORY_KEY,
      JSON.stringify(history),
    );
  } catch {
    // Ignore localStorage errors.
  }
}

function getStreak(): StreakData {
  try {
    const saved = localStorage.getItem(STREAK_KEY);

    if (!saved) {
      return {
        count: 0,
        lastPracticeDate: null,
      };
    }

    return JSON.parse(saved) as StreakData;
  } catch {
    return {
      count: 0,
      lastPracticeDate: null,
    };
  }
}

function updateStreak(): StreakData {
  const today = getToday();
  const yesterday = getYesterday();
  const current = getStreak();

  let nextCount = current.count;

  if (current.lastPracticeDate === today) {
    return current;
  }

  if (current.lastPracticeDate === yesterday) {
    nextCount = current.count + 1;
  } else {
    nextCount = 1;
  }

  const next: StreakData = {
    count: nextCount,
    lastPracticeDate: today,
  };

  try {
    localStorage.setItem(
      STREAK_KEY,
      JSON.stringify(next),
    );
  } catch {
    // Ignore localStorage errors.
  }

  return next;
}

function calculateAccuracy(
  userMessageCount: number,
  correctionCount: number,
) {
  if (userMessageCount <= 0) {
    return 100;
  }

  const accuracy =
    ((userMessageCount - correctionCount) /
      userMessageCount) *
    100;

  return Math.max(
    0,
    Math.min(100, Math.round(accuracy)),
  );
}

function hasCorrection(content: string) {
  return (
    content.includes("Correction:") ||
    content.includes("❌") ||
    content.includes("✅")
  );
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
  const conversationMatch = content.match(
    /Conversation:\s*([\s\S]*?)(?=Correction:|Tip:|$)/i,
  );

  const correctionMatch = content.match(
    /Correction:\s*([\s\S]*?)(?=Tip:|$)/i,
  );

  const tipMatch = content.match(
    /Tip:\s*([\s\S]*)/i,
  );

  return {
    conversation:
      conversationMatch?.[1]?.trim() ||
      content.trim(),

    correction:
      correctionMatch?.[1]?.trim() || "",

    tip:
      tipMatch?.[1]?.trim() || "",
  };
}

export default function PracticePage() {
  const supabase = useMemo(() => createClient(), []);

  const [topic, setTopic] =
    useState<Topic>("Introduce Yourself");

  const [provider, setProvider] =
    useState<Provider>("gemini");

  const [message, setMessage] = useState("");

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [started, setStarted] = useState(false);

  const [listening, setListening] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [correctionCount, setCorrectionCount] =
    useState(0);

  const [userMessageCount, setUserMessageCount] =
    useState(0);

  const [isHydrated, setIsHydrated] =
    useState(false);

  const [isSavingSession, setIsSavingSession] =
    useState(false);

  const [dailyProgress, setDailyProgress] =
    useState<DailyProgress>({
      date: getToday(),
      minutes: 0,
      goal: 15,
    });

  const [streak, setStreak] =
    useState<StreakData>({
      count: 0,
      lastPracticeDate: null,
    });

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(null);

  const practiceStartedAt =
    useRef<number | null>(null);

  const lastProgressUpdate =
    useRef<number | null>(null);

  const hasStartedStreak =
    useRef(false);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  const dailyProgressRef =
    useRef<DailyProgress>(dailyProgress);

  useEffect(() => {
    dailyProgressRef.current = dailyProgress;
  }, [dailyProgress]);

  /*
   * Save daily progress to Supabase.
   */
  const saveDailyProgressToSupabase = useCallback(
  async (progress: DailyProgress) => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error(
          "Supabase user error:",
          JSON.stringify(userError, null, 2),
        );
        return;
      }

      if (!user) {
        console.error("No logged-in Supabase user found.");
        return;
      }

      const { error } = await supabase
        .from("daily_progress")
        .upsert(
          {
            user_id: user.id,
            date: progress.date,
            minutes: progress.minutes,
            goal: progress.goal,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,date",
          },
        );

      if (error) {
        console.error(
          "DAILY PROGRESS SUPABASE ERROR",
          JSON.stringify(
            {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            },
            null,
            2,
          ),
        );
        return;
      }

      console.log("Daily progress saved successfully.");
    } catch (error) {
      console.error(
        "DAILY PROGRESS UNEXPECTED ERROR",
        error instanceof Error
          ? error.message
          : JSON.stringify(error, null, 2),
      );
    }
  },
  [supabase],
);
  /*
   * Load daily progress and streak from Supabase.
   */
  const loadCloudDailyProgress =
    useCallback(async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        /*
         * Load the user's daily goal.
         */
        const { data: profile } =
          await supabase
            .from("profiles")
            .select("daily_goal")
            .eq("id", user.id)
            .maybeSingle();

        const profileGoal =
          Number(profile?.daily_goal) || 15;

        /*
         * Load today's progress.
         */
        const { data: todayProgress } =
          await supabase
            .from("daily_progress")
            .select(
              "date, minutes, goal",
            )
            .eq("user_id", user.id)
            .eq("date", getToday())
            .maybeSingle();

        const cloudProgress: DailyProgress = {
          date: getToday(),
          minutes:
            Number(todayProgress?.minutes) || 0,
          goal: profileGoal,
        };

        /*
         * If Supabase has today's progress,
         * use it as the source of truth.
         */
        if (todayProgress) {
          setDailyProgress(cloudProgress);
          dailyProgressRef.current =
            cloudProgress;

          saveDailyProgress(cloudProgress);
          saveDailyHistory(cloudProgress);
        } else {
          /*
           * No cloud row yet.
           * Keep local progress if it exists.
           */
          const localProgress =
            getDailyProgress();

          const nextProgress: DailyProgress = {
            date: getToday(),
            minutes: localProgress.minutes,
            goal: profileGoal,
          };

          setDailyProgress(nextProgress);
          dailyProgressRef.current =
            nextProgress;

          saveDailyProgress(nextProgress);

          await saveDailyProgressToSupabase(
            nextProgress,
          );
        }

        /*
         * Load recent daily progress records.
         * We use these dates to calculate the
         * cloud streak.
         */
        const { data: progressRows } =
          await supabase
            .from("daily_progress")
            .select(
              "date, minutes, goal",
            )
            .eq("user_id", user.id)
            .order("date", {
              ascending: false,
            })
            .limit(365);

        if (
          progressRows &&
          progressRows.length > 0
        ) {
          const practiceDates =
            progressRows
              .map((row) => row.date)
              .filter(Boolean);

          const today = getToday();

          /*
           * Calculate consecutive days ending today.
           */
          let count = 0;
          let checkDate = new Date();

          while (true) {
            const dateKey =
              getDateKey(checkDate);

            if (
              practiceDates.includes(
                dateKey,
              )
            ) {
              count += 1;
              checkDate.setDate(
                checkDate.getDate() - 1,
              );
            } else {
              break;
            }
          }

          /*
           * If there is no activity today,
           * keep the streak at zero when it has
           * already broken.
           */
          const cloudStreak: StreakData =
            count > 0
              ? {
                  count,
                  lastPracticeDate: today,
                }
              : {
                  count: 0,
                  lastPracticeDate: null,
                };

          setStreak(cloudStreak);

          try {
            localStorage.setItem(
              STREAK_KEY,
              JSON.stringify(cloudStreak),
            );
          } catch {
            // Ignore localStorage errors.
          }
        }
      } catch (error) {
        console.error(
          "Failed to load cloud daily progress:",
          error,
        );
      }
    }, [
      saveDailyProgressToSupabase,
      supabase,
    ]);

  /*
   * Load saved practice data.
   */
  useEffect(() => {
    try {
      const savedPractice =
        localStorage.getItem(PRACTICE_KEY);

      if (savedPractice) {
        const parsed =
          JSON.parse(savedPractice);

        if (
          Array.isArray(parsed.messages)
        ) {
          setMessages(parsed.messages);
        }

        if (TOPICS.includes(parsed.topic)) {
          setTopic(parsed.topic);
        }

        if (
          parsed.provider === "gemini" ||
          parsed.provider === "openai"
        ) {
          setProvider(parsed.provider);
        }

        setCorrectionCount(
          Number(parsed.correctionCount) || 0,
        );

        setUserMessageCount(
          Number(parsed.userMessageCount) || 0,
        );

        if (parsed.messages?.length > 0) {
          setStarted(true);
        }
      }

      const localProgress =
        getDailyProgress();

      setDailyProgress(localProgress);
      dailyProgressRef.current =
        localProgress;

      setStreak(getStreak());
    } catch {
      // Ignore corrupted localStorage data.
    }

    setIsHydrated(true);
  }, []);

  /*
   * Load cloud data after hydration.
   */
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    void loadCloudDailyProgress();
  }, [
    isHydrated,
    loadCloudDailyProgress,
  ]);

  /*
   * Persist the active practice session.
   */
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    try {
      localStorage.setItem(
        PRACTICE_KEY,
        JSON.stringify({
          topic,
          provider,
          messages,
          correctionCount,
          userMessageCount,
        }),
      );
    } catch {
      // Ignore localStorage errors.
    }
  }, [
    topic,
    provider,
    messages,
    correctionCount,
    userMessageCount,
    isHydrated,
  ]);

  /*
   * Auto-scroll conversation.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  /*
   * Save elapsed practice time.
   */
  const saveCurrentPracticeTime =
    useCallback(() => {
      if (!practiceStartedAt.current) {
        return;
      }

      const now = Date.now();

      const previous =
        lastProgressUpdate.current ??
        practiceStartedAt.current;

      const elapsedMinutes = Math.floor(
        (now - previous) / 60000,
      );

      if (elapsedMinutes <= 0) {
        return;
      }

      const current =
        dailyProgressRef.current;

      const nextMinutes = Math.min(
        current.goal,
        current.minutes + elapsedMinutes,
      );

      const next: DailyProgress = {
        ...current,
        date: getToday(),
        minutes: nextMinutes,
      };

      dailyProgressRef.current = next;
      setDailyProgress(next);

      saveDailyProgress(next);
      saveDailyHistory(next);

      void saveDailyProgressToSupabase(
        next,
      );

      lastProgressUpdate.current = now;
      practiceStartedAt.current = now;
    }, [
      saveDailyProgressToSupabase,
    ]);

  /*
   * Practice timer.
   */
  useEffect(() => {
    if (!started) {
      return;
    }

    if (!practiceStartedAt.current) {
      practiceStartedAt.current =
        Date.now();
    }

    if (!lastProgressUpdate.current) {
      lastProgressUpdate.current =
        practiceStartedAt.current;
    }

    const interval =
      window.setInterval(() => {
        saveCurrentPracticeTime();
      }, 15000);

    return () => {
      window.clearInterval(interval);
      saveCurrentPracticeTime();
    };
  }, [
    started,
    saveCurrentPracticeTime,
  ]);

  /*
   * Mark the streak once per active practice session.
   */
  const recordPractice =
    useCallback(() => {
      if (hasStartedStreak.current) {
        return;
      }

      const next = updateStreak();

      setStreak(next);

      hasStartedStreak.current = true;

      /*
       * Create today's daily progress row
       * in Supabase so the practice day is
       * available across devices.
       */
      const current =
        dailyProgressRef.current;

      const progressForToday: DailyProgress = {
        ...current,
        date: getToday(),
      };

      dailyProgressRef.current =
        progressForToday;

      setDailyProgress(
        progressForToday,
      );

      saveDailyProgress(
        progressForToday,
      );

      saveDailyHistory(
        progressForToday,
      );

      void saveDailyProgressToSupabase(
        progressForToday,
      );
    }, [
      saveDailyProgressToSupabase,
    ]);

  /*
   * Speak AI response.
   */
  const speakMessage =
    useCallback((content: string) => {
      if (
        typeof window === "undefined" ||
        !("speechSynthesis" in window)
      ) {
        return;
      }

      const text =
        cleanSpeechText(content);

      if (!text) {
        return;
      }

      window.speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(text);

      utterance.lang = "en-US";
      utterance.rate = 0.95;
      utterance.pitch = 1;

      window.speechSynthesis.speak(
        utterance,
      );
    }, []);

  /*
   * Start a conversation.
   */
  const startPractice =
    useCallback(() => {
      if (started) {
        return;
      }

      const openingMessages: Record<
        Topic,
        string
      > = {
        "At a Restaurant":
          "Hello! Welcome to the restaurant. What would you like to order today?",

        "Introduce Yourself":
          "Hi! Nice to meet you. Could you introduce yourself?",

        "Job Interview":
          "Welcome to the interview. Could you tell me a little about yourself?",

        Traveling:
          "Hi! Where are you planning to travel, and what kind of trip are you looking forward to?",
      };

      const opening =
        openingMessages[topic];

      setMessages([
        {
          role: "assistant",
          content: opening,
        },
      ]);

      setStarted(true);

      practiceStartedAt.current =
        Date.now();

      lastProgressUpdate.current =
        Date.now();

      recordPractice();

      speakMessage(opening);
    }, [
      started,
      topic,
      recordPractice,
      speakMessage,
    ]);

  /*
   * Save the current session to:
   * 1. LocalStorage
   * 2. Supabase
   */
  const saveCurrentSession =
    useCallback(async () => {
      if (
        messages.length === 0 ||
        userMessageCount <= 0
      ) {
        return;
      }

      const accuracy =
        calculateAccuracy(
          userMessageCount,
          correctionCount,
        );

      const session: PracticeSession = {
        id: `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`,
        topic,
        provider,
        messages,
        correctionCount,
        userMessageCount,
        accuracy,
        createdAt:
          new Date().toISOString(),
      };

      /*
       * Save to localStorage.
       */
      try {
        const savedHistory =
          localStorage.getItem(
            HISTORY_KEY,
          );

        let history: PracticeSession[] =
          [];

        if (savedHistory) {
          const parsed =
            JSON.parse(savedHistory);

          if (Array.isArray(parsed)) {
            history = parsed;
          }
        }

        history.unshift(session);

        history = history.slice(0, 100);

        localStorage.setItem(
          HISTORY_KEY,
          JSON.stringify(history),
        );
      } catch {
        // Ignore localStorage errors.
      }

      /*
       * Save to Supabase.
       */
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.error(
            "No logged-in user found. Session was only saved locally.",
          );
          return;
        }

        const { error } =
          await supabase
            .from("practice_sessions")
            .insert({
              user_id: user.id,
              topic,
              provider,
              messages,
              correction_count:
                correctionCount,
              user_message_count:
                userMessageCount,
              accuracy,
              created_at:
                session.createdAt,
            });

        if (error) {
          console.error(
            "Failed to save practice session to Supabase:",
            error,
          );
        }
      } catch (error) {
        console.error(
          "Supabase practice history error:",
          error,
        );
      }
    }, [
      messages,
      userMessageCount,
      correctionCount,
      topic,
      provider,
      supabase,
    ]);

  /*
   * Start a completely new conversation.
   */
  const newConversation =
    useCallback(async () => {
      if (isSavingSession) {
        return;
      }

      setIsSavingSession(true);

      try {
        saveCurrentPracticeTime();

        await saveCurrentSession();

        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch {
            // Ignore recognition errors.
          }
        }

        recognitionRef.current = null;

        if (
          typeof window !== "undefined" &&
          "speechSynthesis" in window
        ) {
          window.speechSynthesis.cancel();
        }

        try {
          localStorage.removeItem(
            PRACTICE_KEY,
          );
        } catch {
          // Ignore localStorage errors.
        }

        setMessage("");
        setMessages([]);
        setStarted(false);
        setListening(false);
        setLoading(false);
        setCorrectionCount(0);
        setUserMessageCount(0);

        practiceStartedAt.current =
          null;

        lastProgressUpdate.current =
          null;

        hasStartedStreak.current =
          false;
      } finally {
        setIsSavingSession(false);
      }
    }, [
      isSavingSession,
      saveCurrentPracticeTime,
      saveCurrentSession,
    ]);

  /*
   * Topic changes automatically finish
   * the current conversation.
   */
  const handleTopicChange = async (
    newTopic: Topic,
  ) => {
    if (newTopic === topic) {
      return;
    }

    if (messages.length > 0) {
      await newConversation();
    }

    setTopic(newTopic);
  };

  /*
   * Provider changes also start a fresh conversation.
   */
  const handleProviderChange = async (
    newProvider: Provider,
  ) => {
    if (newProvider === provider) {
      return;
    }

    if (messages.length > 0) {
      await newConversation();
    }

    setProvider(newProvider);
  };

  /*
   * Send a user message to the AI.
   */
  const handleSend = async () => {
    const trimmedMessage =
      message.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    if (!started) {
      startPractice();
    }

    recordPractice();

    const userMessage: Message = {
      role: "user",
      content: trimmedMessage,
    };

    const conversation: Message[] = [
      ...messages,
      userMessage,
    ];

    setMessages([
      ...conversation,
      {
        role: "assistant",
        content: "",
      },
    ]);

    setMessage("");

    setUserMessageCount(
      (current) => current + 1,
    );

    setLoading(true);

    try {
      const response = await fetch(
        "/api/chat",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            messages: conversation,
            provider,
            topic,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}`,
        );
      }

      /*
       * Gemini streaming response.
       */
      if (provider === "gemini") {
        if (!response.body) {
          throw new Error(
            "The AI response stream was empty.",
          );
        }

        const reader =
          response.body.getReader();

        const decoder =
          new TextDecoder();

        let buffer = "";
        let fullReply = "";

        while (true) {
          const {
            done,
            value,
          } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(
            value,
            {
              stream: true,
            },
          );

          const lines =
            buffer.split("\n");

          buffer =
            lines.pop() || "";

          for (const rawLine of lines) {
            const line =
              rawLine.trim();

            if (!line) {
              continue;
            }

            const data =
              line.startsWith("data:")
                ? line.slice(5).trim()
                : line;

            if (
              !data ||
              data === "[DONE]"
            ) {
              continue;
            }

            try {
              const parsed =
                JSON.parse(data);

              const chunk =
                parsed.text ??
                parsed.reply ??
                parsed.content ??
                "";

              if (
                typeof chunk ===
                "string"
              ) {
                fullReply += chunk;

                setMessages(
                  (current) => {
                    const updated = [
                      ...current,
                    ];

                    const lastIndex =
                      updated.length -
                      1;

                    if (
                      lastIndex >= 0 &&
                      updated[
                        lastIndex
                      ].role ===
                        "assistant"
                    ) {
                      updated[
                        lastIndex
                      ] = {
                        role:
                          "assistant",
                        content:
                          fullReply,
                      };
                    }

                    return updated;
                  },
                );
              }
            } catch {
              /*
               * Some servers may return plain text.
               */
              if (
                !data.startsWith(
                  "{",
                ) &&
                !data.startsWith(
                  "[",
                )
              ) {
                fullReply += data;

                setMessages(
                  (current) => {
                    const updated = [
                      ...current,
                    ];

                    const lastIndex =
                      updated.length -
                      1;

                    if (
                      lastIndex >= 0 &&
                      updated[
                        lastIndex
                      ].role ===
                        "assistant"
                    ) {
                      updated[
                        lastIndex
                      ] = {
                        role:
                          "assistant",
                        content:
                          fullReply,
                      };
                    }

                    return updated;
                  },
                );
              }
            }
          }
        }

        /*
         * Process final buffer.
         */
        const finalLine =
          buffer.trim();

        if (
          finalLine &&
          finalLine !== "[DONE]"
        ) {
          const data =
            finalLine.startsWith(
              "data:",
            )
              ? finalLine
                  .slice(5)
                  .trim()
              : finalLine;

          try {
            const parsed =
              JSON.parse(data);

            const chunk =
              parsed.text ??
              parsed.reply ??
              parsed.content ??
              "";

            if (
              typeof chunk ===
              "string"
            ) {
              fullReply += chunk;
            }
          } catch {
            if (
              !data.startsWith(
                "{",
              ) &&
              !data.startsWith(
                "[",
              )
            ) {
              fullReply += data;
            }
          }
        }

        if (!fullReply.trim()) {
          throw new Error(
            "The AI returned an empty response.",
          );
        }

        if (
          hasCorrection(fullReply)
        ) {
          setCorrectionCount(
            (current) => current + 1,
          );
        }

        setMessages(
          (current) => {
            const updated = [
              ...current,
            ];

            const lastIndex =
              updated.length - 1;

            if (
              lastIndex >= 0 &&
              updated[
                lastIndex
              ].role === "assistant"
            ) {
              updated[
                lastIndex
              ] = {
                role: "assistant",
                content: fullReply,
              };
            }

            return updated;
          },
        );

        speakMessage(fullReply);
      } else {
        /*
         * OpenAI JSON response.
         */
        const data =
          await response.json();

        const reply =
          data.reply ??
          data.content ??
          data.message ??
          "";

        if (
          typeof reply !==
            "string" ||
          !reply.trim()
        ) {
          throw new Error(
            "The AI returned an empty response.",
          );
        }

        if (hasCorrection(reply)) {
          setCorrectionCount(
            (current) => current + 1,
          );
        }

        setMessages(
          (current) => {
            const updated = [
              ...current,
            ];

            const lastIndex =
              updated.length - 1;

            if (
              lastIndex >= 0 &&
              updated[
                lastIndex
              ].role === "assistant"
            ) {
              updated[
                lastIndex
              ] = {
                role: "assistant",
                content: reply,
              };
            }

            return updated;
          },
        );

        speakMessage(reply);
      }
    } catch (error) {
      console.error(
        "Practice error:",
        error,
      );

      const errorMessage =
        "Sorry, I couldn't connect to the AI right now. Please check your API settings and try again.";

      setMessages(
        (current) => {
          const updated = [
            ...current,
          ];

          const lastIndex =
            updated.length - 1;

          if (
            lastIndex >= 0 &&
            updated[
              lastIndex
            ].role === "assistant"
          ) {
            updated[
              lastIndex
            ] = {
              role: "assistant",
              content: errorMessage,
            };
          }

          return updated;
        },
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Keyboard handling.
   */
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSend();
    }
  };

  /*
   * Speech recognition.
   */
  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    if (
      typeof window === "undefined"
    ) {
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech recognition is not supported in this browser. Please try Google Chrome or Microsoft Edge.",
      );
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (
      event: SpeechRecognitionResultEvent,
    ) => {
      let transcript = "";

      for (
        let i = 0;
        i < event.results.length;
        i++
      ) {
        transcript +=
          event.results[i][0]
            .transcript;
      }

      setMessage(transcript);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current =
        null;
    };

    recognitionRef.current =
      recognition;

    try {
      recognition.start();

      setListening(true);

      if (!started) {
        startPractice();
      }
    } catch {
      setListening(false);
      recognitionRef.current =
        null;
    }
  };

  const currentAccuracy =
    calculateAccuracy(
      userMessageCount,
      correctionCount,
    );

  const goal =
    dailyProgress.goal > 0
      ? dailyProgress.goal
      : 15;

  const minutes = Math.min(
    dailyProgress.minutes,
    goal,
  );

  const goalPercentage =
    Math.min(
      100,
      Math.round(
        (minutes / goal) * 100,
      ),
    );

  return (
    <main className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-green-600">
              AI English Practice
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Practice speaking English
            </h1>

            <p className="mt-2 max-w-2xl text-slate-600">
              Have natural conversations with AI,
              get corrections, and build your
              speaking confidence.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void newConversation();
            }}
            disabled={isSavingSession}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-green-300 hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSavingSession
              ? "Saving..."
              : messages.length > 0
                ? "Finish & New"
                : "+ New Conversation"}
          </button>
        </div>

        {/* Daily Goal + Streak */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">

          {/* Daily Goal */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Daily Goal
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {minutes}

                  <span className="text-base font-medium text-slate-400">
                    {" "}
                    / {goal} min
                  </span>
                </p>
              </div>

              <span className="rounded-xl bg-green-50 px-3 py-2 text-lg">
                🎯
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{
                  width: `${goalPercentage}%`,
                }}
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {goalPercentage >= 100
                ? "Daily goal complete! 🎉"
                : `${goalPercentage}% completed today`}
            </p>
          </div>

          {/* Streak */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Practice Streak
                </p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {streak.count}

                  <span className="ml-1 text-base font-medium text-slate-400">
                    {streak.count === 1
                      ? "day"
                      : "days"}
                  </span>
                </p>
              </div>

              <span className="rounded-xl bg-orange-50 px-3 py-2 text-lg">
                🔥
              </span>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Keep practicing every day to grow
              your streak.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-6 grid gap-4 md:grid-cols-2">

          {/* Topic */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label
              htmlFor="topic"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Conversation Topic
            </label>

            <select
              id="topic"
              value={topic}
              onChange={(event) => {
                void handleTopicChange(
                  event.target.value as Topic,
                );
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              {TOPICS.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-slate-500">
              Changing the topic starts a fresh
              conversation.
            </p>
          </div>

          {/* Provider */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <label
              htmlFor="provider"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              AI Provider
            </label>

            <select
              id="provider"
              value={provider}
              onChange={(event) => {
                void handleProviderChange(
                  event.target.value as Provider,
                );
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
            >
              {PROVIDERS.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-slate-500">
              Changing the provider starts a fresh
              conversation.
            </p>
          </div>
        </div>

        {/* Practice Card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Conversation Header */}
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100">
                  🤖
                </span>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    {topic}
                  </h2>

                  <p className="text-xs text-slate-500">
                    {provider === "gemini"
                      ? "Powered by Gemini"
                      : "Powered by OpenAI"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-500">
                Accuracy
              </p>

              <p className="text-lg font-bold text-slate-900">
                {currentAccuracy}%
              </p>
            </div>
          </div>

          {/* Conversation */}
          <div className="min-h-[420px] space-y-5 p-5">
            {messages.length === 0 ? (
              <div className="flex min-h-[380px] flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50 text-4xl">
                  🎤
                </div>

                <h3 className="text-xl font-bold text-slate-900">
                  Ready to practice?
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Start a conversation and practice
                  speaking naturally. The AI will
                  respond, correct mistakes, and give
                  you useful tips.
                </p>

                <button
                  type="button"
                  onClick={startPractice}
                  className="mt-6 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
                >
                  Start Practice
                </button>
              </div>
            ) : (
              <>
                {messages.map(
                  (item, index) => {
                    const isUser =
                      item.role === "user";

                    const formatted =
                      !isUser &&
                      item.content
                        ? formatAIResponse(
                            item.content,
                          )
                        : null;

                    return (
                      <div
                        key={`${index}-${item.role}`}
                        className={`flex ${
                          isUser
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[90%] sm:max-w-[78%] ${
                            isUser
                              ? "items-end"
                              : "items-start"
                          }`}
                        >
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              isUser
                                ? "rounded-br-md bg-green-600 text-white"
                                : "rounded-bl-md bg-slate-100 text-slate-800"
                            }`}
                          >
                            {isUser ? (
                              <p className="whitespace-pre-wrap text-sm leading-6">
                                {item.content}
                              </p>
                            ) : item.content ? (
                              <div className="space-y-3">
                                <p className="whitespace-pre-wrap text-sm leading-6">
                                  {formatted?.conversation}
                                </p>

                                {formatted?.correction && (
                                  <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-red-600">
                                      Correction
                                    </p>

                                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-red-800">
                                      {
                                        formatted.correction
                                      }
                                    </p>
                                  </div>
                                )}

                                {formatted?.tip && (
                                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                                    <p className="text-xs font-bold uppercase tracking-wide text-amber-600">
                                      💡 Tip
                                    </p>

                                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-800">
                                      {
                                        formatted.tip
                                      }
                                    </p>
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

                          {!isUser &&
                            item.content && (
                              <button
                                type="button"
                                onClick={() =>
                                  speakMessage(
                                    item.content,
                                  )
                                }
                                className="mt-2 text-xs font-medium text-slate-500 transition hover:text-green-600"
                              >
                                🔊 Listen
                              </button>
                            )}
                        </div>
                      </div>
                    );
                  },
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-slate-200 bg-slate-50 p-4">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(
                    event.target.value,
                  )
                }
                onKeyDown={handleKeyDown}
                placeholder={
                  listening
                    ? "Listening..."
                    : "Type your response in English..."
                }
                rows={2}
                disabled={loading}
                className="min-h-[52px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:opacity-50"
              />

              <button
                type="button"
                onClick={toggleListening}
                disabled={loading}
                aria-label={
                  listening
                    ? "Stop listening"
                    : "Start voice input"
                }
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg transition ${
                  listening
                    ? "bg-red-100 text-red-600"
                    : "bg-slate-100 text-slate-700 hover:bg-green-100 hover:text-green-600"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {listening
                  ? "⏹"
                  : "🎤"}
              </button>

              <button
                type="button"
                onClick={handleSend}
                disabled={
                  loading ||
                  !message.trim()
                }
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600 text-lg text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                {loading ? "…" : "➤"}
              </button>
            </div>

            <p className="mt-2 text-center text-xs text-slate-400">
              Press Enter to send · Shift + Enter
              for a new line
            </p>
          </div>
        </section>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">
              {userMessageCount}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Your Messages
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">
              {correctionCount}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Corrections
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">
              {currentAccuracy}%
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Accuracy
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-slate-900">
              {minutes}

              <span className="text-sm font-medium text-slate-400">
                {" "}
                min
              </span>
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Today
            </p>
          </div>
        </div>

        {/* Practice Tip */}
        <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg">
              💡
            </div>

            <div>
              <h3 className="font-semibold">
                Practice Tip
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                Don't worry about making mistakes.
                Try to answer naturally and keep the
                conversation going. Your corrections
                are there to help you improve.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}