"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DailyHistoryEntry = {
  minutes: number;
  goal: number;
};

type DailyHistory = Record<string, DailyHistoryEntry>;

type PracticeMessage = {
  role: "user" | "assistant";
  content: string;
};

type PracticeSession = {
  id: string;
  topic: string;
  provider: "gemini" | "openai";
  messages: PracticeMessage[];
  correctionCount: number;
  userMessageCount: number;
  accuracy: number;
  createdAt: string;
};

type SupabasePracticeSession = {
  id: string;
  topic: string;
  provider: "gemini" | "openai";
  messages: PracticeMessage[];
  correction_count: number;
  user_message_count: number;
  accuracy: number;
  created_at: string;
};

type DailyProgress = {
  date: string;
  minutes: number;
  goal: number;
};

type StreakData = {
  count: number;
  lastPracticeDate: string | null;
};

const DAILY_HISTORY_KEY = "speakeasy-daily-history";
const PRACTICE_HISTORY_KEY = "speakeasy-practice-history";
const DAILY_PROGRESS_KEY = "speakeasy-daily-progress";
const STREAK_KEY = "speakeasy-streak";

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getLastSevenDays(): string[] {
  const days: string[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    days.push(date.toISOString().slice(0, 10));
  }

  return days;
}

function loadDailyHistory(): DailyHistory {
  try {
    const saved = localStorage.getItem(DAILY_HISTORY_KEY);

    if (!saved) {
      return {};
    }

    const parsed = JSON.parse(saved);

    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const result: DailyHistory = {};

    Object.entries(parsed).forEach(([date, value]) => {
      if (
        value &&
        typeof value === "object" &&
        "minutes" in value &&
        "goal" in value
      ) {
        const entry = value as {
          minutes?: unknown;
          goal?: unknown;
        };

        result[date] = {
          minutes: Number(entry.minutes) || 0,
          goal: Number(entry.goal) || 15,
        };
      }
    });

    return result;
  } catch {
    return {};
  }
}

function loadPracticeHistory(): PracticeSession[] {
  try {
    const saved = localStorage.getItem(PRACTICE_HISTORY_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is PracticeSession =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.topic === "string" &&
        typeof item.createdAt === "string",
    );
  } catch {
    return [];
  }
}

function loadDailyProgress(): DailyProgress {
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

    const parsed = JSON.parse(saved);

    if (!parsed || typeof parsed !== "object") {
      return {
        date: today,
        minutes: 0,
        goal: 15,
      };
    }

    return {
      date: today,
      minutes:
        parsed.date === today
          ? Number(parsed.minutes) || 0
          : 0,
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

function loadStreak(): StreakData {
  try {
    const saved = localStorage.getItem(STREAK_KEY);

    if (!saved) {
      return {
        count: 0,
        lastPracticeDate: null,
      };
    }

    const parsed = JSON.parse(saved);

    return {
      count: Number(parsed.count) || 0,
      lastPracticeDate:
        typeof parsed.lastPracticeDate === "string"
          ? parsed.lastPracticeDate
          : null,
    };
  } catch {
    return {
      count: 0,
      lastPracticeDate: null,
    };
  }
}

function convertSupabaseSession(
  session: SupabasePracticeSession,
): PracticeSession {
  return {
    id: session.id,
    topic: session.topic,
    provider:
      session.provider === "openai"
        ? "openai"
        : "gemini",
    messages: Array.isArray(session.messages)
      ? session.messages
      : [],
    correctionCount:
      Number(session.correction_count) || 0,
    userMessageCount:
      Number(session.user_message_count) || 0,
    accuracy: Number(session.accuracy) || 0,
    createdAt: session.created_at,
  };
}

export default function ProgressPage() {
  const supabase = useMemo(() => createClient(), []);

  const [dailyHistory, setDailyHistory] =
    useState<DailyHistory>({});

  const [practiceHistory, setPracticeHistory] =
    useState<PracticeSession[]>([]);

  const [dailyProgress, setDailyProgress] =
    useState<DailyProgress>({
      date: getToday(),
      minutes: 0,
      goal: 15,
    });

  const [streak, setStreak] = useState<StreakData>({
    count: 0,
    lastPracticeDate: null,
  });

  const [isLoaded, setIsLoaded] = useState(false);

  const [supabaseLoading, setSupabaseLoading] =
    useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      setDailyHistory(loadDailyHistory());
      setDailyProgress(loadDailyProgress());
      setStreak(loadStreak());

      const localHistory = loadPracticeHistory();

      if (!cancelled) {
        setPracticeHistory(localHistory);
      }

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error(
            "Failed to get current user:",
            userError,
          );

          return;
        }

        if (!user) {
          return;
        }

        const { data, error } = await supabase
          .from("practice_sessions")
          .select(
            `
              id,
              topic,
              provider,
              messages,
              correction_count,
              user_message_count,
              accuracy,
              created_at
            `,
          )
          .eq("user_id", user.id)
          .order("created_at", {
            ascending: false,
          })
          .limit(100);

        if (error) {
          console.error(
            "Failed to load practice sessions:",
            error,
          );

          return;
        }

        if (!data || cancelled) {
          return;
        }

        const supabaseHistory =
          data.map((session) =>
            convertSupabaseSession(
              session as SupabasePracticeSession,
            ),
          );

        setPracticeHistory(supabaseHistory);
      } catch (error) {
        console.error(
          "Supabase progress loading error:",
          error,
        );
      } finally {
        if (!cancelled) {
          setSupabaseLoading(false);
          setIsLoaded(true);
        }
      }
    }

    loadProgress();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const lastSevenDays = useMemo(
    () => getLastSevenDays(),
    [],
  );

  const weeklyMinutes = useMemo(() => {
    return lastSevenDays.reduce((total, date) => {
      const entry = dailyHistory[date];

      if (!entry) {
        return total;
      }

      return total + Number(entry.minutes || 0);
    }, 0);
  }, [dailyHistory, lastSevenDays]);

  const weeklyGoal = useMemo(() => {
    return lastSevenDays.reduce((total, date) => {
      const entry = dailyHistory[date];

      if (!entry) {
        return total;
      }

      return total + Number(entry.goal || 15);
    }, 0);
  }, [dailyHistory, lastSevenDays]);

  const weeklyPercentage =
    weeklyGoal > 0
      ? Math.min(
          100,
          Math.round(
            (weeklyMinutes / weeklyGoal) * 100,
          ),
        )
      : 0;

  const totalPracticeMinutes = useMemo(() => {
    return Object.values(dailyHistory).reduce(
      (total, entry) =>
        total + Number(entry.minutes || 0),
      0,
    );
  }, [dailyHistory]);

  const totalSessions = practiceHistory.length;

  const averageAccuracy = useMemo(() => {
    if (practiceHistory.length === 0) {
      return 0;
    }

    const total = practiceHistory.reduce(
      (sum, session) =>
        sum + Number(session.accuracy || 0),
      0,
    );

    return Math.round(
      total / practiceHistory.length,
    );
  }, [practiceHistory]);

  const totalMessages = useMemo(() => {
    return practiceHistory.reduce(
      (total, session) =>
        total +
        Number(session.userMessageCount || 0),
      0,
    );
  }, [practiceHistory]);

  const totalCorrections = useMemo(() => {
    return practiceHistory.reduce(
      (total, session) =>
        total +
        Number(session.correctionCount || 0),
      0,
    );
  }, [practiceHistory]);

  const bestDay = useMemo(() => {
    const entries = Object.entries(dailyHistory);

    if (entries.length === 0) {
      return null;
    }

    return entries.reduce(
      (best, current) => {
        const currentMinutes =
          Number(current[1].minutes) || 0;

        const bestMinutes =
          Number(best[1].minutes) || 0;

        return currentMinutes > bestMinutes
          ? current
          : best;
      },
    );
  }, [dailyHistory]);

  const todayMinutes = Math.min(
    Number(dailyProgress.minutes) || 0,
    Number(dailyProgress.goal) || 15,
  );

  const todayGoal =
    Number(dailyProgress.goal) || 15;

  const todayPercentage =
    todayGoal > 0
      ? Math.min(
          100,
          Math.round(
            (todayMinutes / todayGoal) * 100,
          ),
        )
      : 0;

  if (!isLoaded) {
    return (
      <main className="min-h-screen bg-slate-50 pb-24 md:pb-8">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-green-600" />

              <p className="text-sm text-slate-500">
                Loading your progress...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-green-600">
            Your Progress
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Track your English improvement
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600">
            See your practice time, speaking accuracy,
            streak, and conversation activity.
          </p>

          {supabaseLoading && (
            <p className="mt-2 text-xs text-slate-400">
              Syncing your practice data...
            </p>
          )}
        </div>

        {/* Top Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Practice Time */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Practice Time
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {totalPracticeMinutes}

                  <span className="ml-1 text-sm font-medium text-slate-400">
                    min
                  </span>
                </p>
              </div>

              <span className="rounded-xl bg-green-50 px-3 py-2 text-lg">
                ⏱️
              </span>
            </div>
          </div>

          {/* Sessions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Practice Sessions
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {totalSessions}
                </p>
              </div>

              <span className="rounded-xl bg-blue-50 px-3 py-2 text-lg">
                💬
              </span>
            </div>
          </div>

          {/* Accuracy */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Average Accuracy
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {averageAccuracy}

                  <span className="text-lg font-medium text-slate-400">
                    %
                  </span>
                </p>
              </div>

              <span className="rounded-xl bg-purple-50 px-3 py-2 text-lg">
                🎯
              </span>
            </div>
          </div>

          {/* Streak */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Current Streak
                </p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {streak.count}

                  <span className="ml-1 text-sm font-medium text-slate-400">
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
          </div>
        </div>

        {/* Today + Weekly */}
        <div className="mb-6 grid gap-6 lg:grid-cols-2">

          {/* Today */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Today's Goal
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {todayMinutes}

                  <span className="text-base font-medium text-slate-400">
                    {" "}
                    / {todayGoal} min
                  </span>
                </h2>
              </div>

              <span className="rounded-xl bg-green-50 px-3 py-2 text-lg">
                🎯
              </span>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{
                  width: `${todayPercentage}%`,
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {todayPercentage}% complete
              </p>

              {todayPercentage >= 100 && (
                <p className="text-xs font-semibold text-green-600">
                  Goal complete 🎉
                </p>
              )}
            </div>
          </section>

          {/* Weekly */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Last 7 Days
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                  {weeklyMinutes}

                  <span className="text-base font-medium text-slate-400">
                    {" "}
                    / {weeklyGoal || 105} min
                  </span>
                </h2>
              </div>

              <span className="rounded-xl bg-blue-50 px-3 py-2 text-lg">
                📈
              </span>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{
                  width: `${weeklyPercentage}%`,
                }}
              />
            </div>

            <p className="mt-3 text-xs text-slate-500">
              {weeklyPercentage}% of your weekly target
            </p>
          </section>
        </div>

        {/* Weekly Activity */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Weekly Practice
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your practice activity over the last 7 days.
            </p>
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4">
            {lastSevenDays.map((date) => {
              const entry = dailyHistory[date];

              const minutes = entry
                ? Number(entry.minutes) || 0
                : 0;

              const goal = entry
                ? Number(entry.goal) || 15
                : 15;

              const percentage =
                goal > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (minutes / goal) * 100,
                      ),
                    )
                  : 0;

              const isToday =
                date === getToday();

              return (
                <div
                  key={date}
                  className="text-center"
                >
                  <p
                    className={`mb-2 text-xs font-semibold ${
                      isToday
                        ? "text-green-600"
                        : "text-slate-500"
                    }`}
                  >
                    {new Date(
                      `${date}T00:00:00`,
                    ).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "short",
                      },
                    )}
                  </p>

                  <div className="flex h-32 items-end justify-center rounded-xl bg-slate-50 p-2">
                    <div
                      className={`w-full max-w-[36px] rounded-lg transition-all ${
                        isToday
                          ? "bg-green-500"
                          : "bg-slate-300"
                      }`}
                      style={{
                        height: `${Math.max(
                          percentage,
                          minutes > 0 ? 8 : 3,
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs font-bold text-slate-700">
                    {minutes}m
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Detailed Activity */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900">
              Daily Activity
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your recorded practice time by day.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {lastSevenDays
              .slice()
              .reverse()
              .map((date) => {
                const entry = dailyHistory[date];

                const minutes = entry
                  ? Number(entry.minutes) || 0
                  : 0;

                const goal = entry
                  ? Number(entry.goal) || 15
                  : 15;

                const percentage =
                  goal > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (minutes / goal) * 100,
                        ),
                      )
                    : 0;

                return (
                  <div
                    key={date}
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {date === getToday()
                          ? "Today"
                          : formatDate(date)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Goal: {goal} minutes
                      </p>
                    </div>

                    <div className="flex min-w-[220px] items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <span className="w-14 text-right text-sm font-semibold text-slate-700">
                        {minutes}m
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>

        {/* Overall Stats */}
        <section className="mb-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Messages Sent
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalMessages}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Total speaking practice messages
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Corrections
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {totalCorrections}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Mistakes identified by AI
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Best Practice Day
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {bestDay
                ? formatDate(bestDay[0])
                : "Not yet"}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {bestDay
                ? `${Number(
                    bestDay[1].minutes || 0,
                  )} minutes practiced`
                : "Start practicing to see your best day"}
            </p>
          </div>
        </section>

        {/* Recent Sessions */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Recent Sessions
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your latest AI English conversations.
                </p>
              </div>

              <a
                href="/history"
                className="text-sm font-semibold text-green-600 transition hover:text-green-700"
              >
                View History →
              </a>
            </div>
          </div>

          {practiceHistory.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                💬
              </div>

              <h3 className="font-semibold text-slate-900">
                No practice sessions yet
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Start your first conversation to see
                your progress here.
              </p>

              <a
                href="/practice"
                className="mt-5 inline-flex rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Start Practice
              </a>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {practiceHistory
                .slice(0, 5)
                .map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {session.topic}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(
                          session.createdAt,
                        ).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}{" "}
                        ·{" "}
                        {session.provider ===
                        "gemini"
                          ? "Gemini"
                          : "OpenAI"}
                      </p>
                    </div>

                    <div className="flex items-center gap-5 text-sm">
                      <div>
                        <p className="font-bold text-slate-900">
                          {Number(
                            session.userMessageCount ||
                              0,
                          )}
                        </p>

                        <p className="text-xs text-slate-500">
                          messages
                        </p>
                      </div>

                      <div>
                        <p className="font-bold text-slate-900">
                          {Number(
                            session.accuracy || 0,
                          )}
                          %
                        </p>

                        <p className="text-xs text-slate-500">
                          accuracy
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        {/* Motivation */}
        <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
              🚀
            </div>

            <div>
              <h3 className="font-semibold">
                Keep going!
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                Consistent practice is more important
                than long practice sessions. Even 10–15
                minutes every day can help you become a
                more confident English speaker.
              </p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}