"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type UserProfile = {
  id: string;
  full_name: string | null;
  daily_goal: number;
};

type PracticeSession = {
  id: string;
  topic: string;
  provider: string;
  accuracy: number;
  messages: Message[];
  user_message_count: number;
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

const LOCAL_HISTORY_KEY = "speakeasy-practice-history";
const LOCAL_DAILY_PROGRESS_KEY = "speakeasy-daily-progress";
const LOCAL_STREAK_KEY = "speakeasy-streak";

const topics = [
  {
    title: "At a Restaurant",
    icon: "🍽️",
    description: "Practice ordering food and talking with restaurant staff.",
  },
  {
    title: "Introduce Yourself",
    icon: "👋",
    description: "Practice introducing yourself in everyday conversations.",
  },
  {
    title: "Job Interview",
    icon: "💼",
    description: "Build confidence answering common interview questions.",
  },
  {
    title: "Traveling",
    icon: "✈️",
    description: "Practice useful English for airports, hotels, and travel.",
  },
];

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(dateString: string) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTopic(topic: string) {
  if (!topic) return "English Practice";

  return topic
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getLocalSessions(): PracticeSession[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);

    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({
      id: String(item.id ?? crypto.randomUUID()),
      topic: String(item.topic ?? "English Practice"),
      provider: String(item.provider ?? "AI"),
      accuracy: Number(item.accuracy ?? 0),
      messages: Array.isArray(item.messages) ? item.messages : [],
      user_message_count: Number(
        item.user_message_count ??
          (Array.isArray(item.messages)
            ? item.messages.filter((message: Message) => message.role === "user")
                .length
            : 0),
      ),
      created_at: String(item.created_at ?? new Date().toISOString()),
    }));
  } catch {
    return [];
  }
}

function getLocalDailyProgress(): DailyProgress {
  if (typeof window === "undefined") {
    return {
      date: getToday(),
      minutes: 0,
      goal: 15,
    };
  }

  try {
    const raw = localStorage.getItem(LOCAL_DAILY_PROGRESS_KEY);

    if (!raw) {
      return {
        date: getToday(),
        minutes: 0,
        goal: 15,
      };
    }

    const parsed = JSON.parse(raw);

    return {
      date: String(parsed.date ?? getToday()),
      minutes: Number(parsed.minutes ?? 0),
      goal: Number(parsed.goal ?? 15),
    };
  } catch {
    return {
      date: getToday(),
      minutes: 0,
      goal: 15,
    };
  }
}

function getLocalStreak(): StreakData {
  if (typeof window === "undefined") {
    return {
      count: 0,
      lastPracticeDate: null,
    };
  }

  try {
    const raw = localStorage.getItem(LOCAL_STREAK_KEY);

    if (!raw) {
      return {
        count: 0,
        lastPracticeDate: null,
      };
    }

    const parsed = JSON.parse(raw);

    return {
      count: Number(parsed.count ?? 0),
      lastPracticeDate: parsed.lastPracticeDate ?? null,
    };
  } catch {
    return {
      count: 0,
      lastPracticeDate: null,
    };
  }
}

function calculateStreak(rows: DailyProgress[]) {
  const dates = new Set(
    rows
      .filter((row) => row.minutes > 0)
      .map((row) => row.date),
  );

  let streak = 0;
  const current = new Date(`${getToday()}T00:00:00`);

  while (true) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");

    const date = `${year}-${month}-${day}`;

    if (!dates.has(date)) {
      break;
    }

    streak += 1;
    current.setDate(current.getDate() - 1);
  }

  return streak;
}

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>({
    date: getToday(),
    minutes: 0,
    goal: 15,
  });
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/login";
        return;
      }

      /* --------------------------------------------------
         PROFILE
      -------------------------------------------------- */

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, daily_goal")
        .eq("id", user.id)
        .maybeSingle();

      const localProgress = getLocalDailyProgress();

      const userProfile: UserProfile = {
        id: user.id,
        full_name:
          profileData?.full_name ??
          user.user_metadata?.full_name ??
          null,
        daily_goal: Number(
          profileData?.daily_goal ??
            localProgress.goal ??
            15,
        ),
      };

      setProfile(userProfile);

      /* --------------------------------------------------
         PRACTICE SESSIONS
      -------------------------------------------------- */

      const { data: sessionData, error: sessionError } = await supabase
        .from("practice_sessions")
        .select(
          "id, topic, provider, accuracy, messages, user_message_count, created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      let cloudSessions: PracticeSession[] = [];

      if (!sessionError && Array.isArray(sessionData)) {
        cloudSessions = sessionData.map((session) => ({
          id: session.id,
          topic: session.topic ?? "English Practice",
          provider: session.provider ?? "AI",
          accuracy: Number(session.accuracy ?? 0),
          messages: Array.isArray(session.messages)
            ? session.messages
            : [],
          user_message_count: Number(
            session.user_message_count ?? 0,
          ),
          created_at: session.created_at,
        }));
      }

      const localSessions = getLocalSessions();

      /*
       * Prefer Supabase when it contains sessions.
       * Otherwise use local history as a fallback.
       */
      if (cloudSessions.length > 0) {
        setSessions(cloudSessions);
      } else {
        setSessions(localSessions);
      }

      /* --------------------------------------------------
         DAILY PROGRESS
      -------------------------------------------------- */

      const { data: progressRows, error: progressError } =
        await supabase
          .from("daily_progress")
          .select("date, minutes, goal")
          .eq("user_id", user.id)
          .order("date", { ascending: false })
          .limit(365);

      if (!progressError && Array.isArray(progressRows)) {
        const rows: DailyProgress[] = progressRows.map((row) => ({
          date: String(row.date),
          minutes: Number(row.minutes ?? 0),
          goal: Number(row.goal ?? userProfile.daily_goal ?? 15),
        }));

        const today = getToday();

        const todayRow = rows.find(
          (row) => row.date === today,
        );

        if (todayRow) {
          setDailyProgress({
            date: todayRow.date,
            minutes: todayRow.minutes,
            goal: userProfile.daily_goal,
          });
        } else {
          setDailyProgress({
            date: today,
            minutes: localProgress.minutes,
            goal: userProfile.daily_goal,
          });
        }

        const cloudStreak = calculateStreak(rows);

        if (cloudStreak > 0) {
          setStreak(cloudStreak);
        } else {
          setStreak(getLocalStreak().count);
        }

        /*
         * Keep localStorage synchronized as a fallback.
         */
        try {
          localStorage.setItem(
            LOCAL_DAILY_PROGRESS_KEY,
            JSON.stringify({
              date: today,
              minutes: todayRow?.minutes ?? localProgress.minutes,
              goal: userProfile.daily_goal,
            }),
          );

          localStorage.setItem(
            LOCAL_STREAK_KEY,
            JSON.stringify({
              count:
                cloudStreak > 0
                  ? cloudStreak
                  : getLocalStreak().count,
              lastPracticeDate:
                cloudStreak > 0
                  ? today
                  : getLocalStreak().lastPracticeDate,
            }),
          );
        } catch {
          // Ignore localStorage errors.
        }
      } else {
        /*
         * Supabase daily_progress fallback.
         */
        setDailyProgress({
          date: getToday(),
          minutes: localProgress.minutes,
          goal: userProfile.daily_goal,
        });

        setStreak(getLocalStreak().count);
      }
    } catch (error) {
      console.error("DASHBOARD LOAD ERROR:", error);

      /*
       * Keep Dashboard usable even if Supabase temporarily fails.
       */
      const localProgress = getLocalDailyProgress();

      setDailyProgress(localProgress);
      setStreak(getLocalStreak().count);
      setSessions(getLocalSessions());
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  /* --------------------------------------------------
     CALCULATED DASHBOARD VALUES
  -------------------------------------------------- */

  const totalSessions = sessions.length;

  const totalMessages = sessions.reduce(
    (total, session) =>
      total +
      Number(
        session.user_message_count ??
          session.messages.filter(
            (message) => message.role === "user",
          ).length,
      ),
    0,
  );

  const averageAccuracy =
    totalSessions > 0
      ? Math.round(
          sessions.reduce(
            (total, session) =>
              total + Number(session.accuracy ?? 0),
            0,
          ) / totalSessions,
        )
      : 0;

  const recentSessions = sessions.slice(0, 5);

  const dailyGoal = Math.max(
    Number(profile?.daily_goal ?? dailyProgress.goal ?? 15),
    1,
  );

  const todayMinutes = Math.max(
    Number(dailyProgress.minutes ?? 0),
    0,
  );

  const goalPercentage = Math.min(
    Math.round((todayMinutes / dailyGoal) * 100),
    100,
  );

  const remainingMinutes = Math.max(
    dailyGoal - todayMinutes,
    0,
  );

  const firstName =
    profile?.full_name?.trim().split(" ")[0] || "there";

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />

            <p className="text-sm font-medium text-slate-500">
              Loading your dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {/* ==================================================
          NAVBAR
      ================================================== */}

      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-xl">
              🗣️
            </div>

            <div>
              <div className="text-lg font-bold tracking-tight">
                SpeakEasy AI
              </div>

              <div className="text-xs text-slate-500">
                AI English Practice
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Profile
            </Link>

            <Link
              href="/settings"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Settings
            </Link>
          </div>
        </div>
      </nav>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* ==================================================
            WELCOME
        ================================================== */}

        <section className="mb-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">
                Your Dashboard
              </p>

              <h1 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                Welcome back, {firstName}! 👋
              </h1>

              <p className="mt-3 max-w-2xl text-lg text-slate-500">
                Ready to practice English and become a more confident
                speaker?
              </p>
            </div>

            <Link
              href="/practice"
              className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-600 hover:shadow-lg"
            >
              Start Practicing
              <span className="ml-2 text-lg">→</span>
            </Link>
          </div>
        </section>

        {/* ==================================================
            STATS
        ================================================== */}

        <section className="mb-10 grid gap-5 md:grid-cols-3">
          {/* Daily Goal */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Daily Goal
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {todayMinutes}
                  <span className="text-lg font-medium text-slate-400">
                    {" "}
                    / {dailyGoal} min
                  </span>
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                🎯
              </div>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{
                  width: `${goalPercentage}%`,
                }}
              />
            </div>

            <p className="mt-3 text-sm text-slate-500">
              {remainingMinutes > 0
                ? `${remainingMinutes} minutes left today`
                : "Daily goal completed! 🎉"}
            </p>
          </div>

          {/* Current Streak */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Current Streak
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {streak}
                  <span className="ml-2 text-lg font-medium text-slate-400">
                    {streak === 1 ? "day" : "days"}
                  </span>
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                🔥
              </div>
            </div>

            <p className="text-sm text-slate-500">
              {streak > 0
                ? "Keep practicing every day to keep your streak alive."
                : "Start practicing today to begin your streak."}
            </p>
          </div>

          {/* Overview */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500">
                  Overview
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {averageAccuracy}%
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                📈
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Your average English practice accuracy.
            </p>
          </div>
        </section>

        {/* ==================================================
            PRACTICE TOPICS
        ================================================== */}

        <section className="mb-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                Practice Topics
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose a conversation and start speaking.
              </p>
            </div>

            <Link
              href="/practice"
              className="hidden text-sm font-bold text-emerald-600 hover:text-emerald-700 sm:block"
            >
              View all →
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {topics.map((topic) => (
              <div
                key={topic.title}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                  {topic.icon}
                </div>

                <h3 className="text-lg font-bold text-slate-950">
                  {topic.title}
                </h3>

                <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                  {topic.description}
                </p>

                <Link
                  href="/practice"
                  className="mt-5 inline-flex items-center text-sm font-bold text-emerald-600 transition group-hover:text-emerald-700"
                >
                  Start
                  <span className="ml-1">→</span>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ==================================================
            RECENT PRACTICE
        ================================================== */}

        <section className="mb-10">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">
                Recent Practice
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review your latest English conversations.
              </p>
            </div>

            <Link
              href="/history"
              className="text-sm font-bold text-emerald-600 hover:text-emerald-700"
            >
              View history →
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <div className="mb-3 text-4xl">🎤</div>

              <h3 className="text-lg font-bold text-slate-950">
                No practice sessions yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Start your first AI English conversation and your
                recent practice will appear here.
              </p>

              <Link
                href="/practice"
                className="mt-5 inline-flex items-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600"
              >
                Start Practicing →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                      {session.topic
                        .toLowerCase()
                        .includes("restaurant")
                        ? "🍽️"
                        : session.topic
                            .toLowerCase()
                            .includes("interview")
                        ? "💼"
                        : session.topic
                            .toLowerCase()
                            .includes("travel")
                        ? "✈️"
                        : "🗣️"}
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-950">
                        {formatTopic(session.topic)}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(session.created_at)}
                        {" · "}
                        {session.provider}
                        {" · "}
                        {session.user_message_count}{" "}
                        {session.user_message_count === 1
                          ? "message"
                          : "messages"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-5 md:justify-end">
                    <div className="text-right">
                      <div className="text-xl font-bold text-slate-950">
                        {Math.round(session.accuracy)}%
                      </div>

                      <div className="text-xs text-slate-500">
                        Accuracy
                      </div>
                    </div>

                    <Link
                      href="/history"
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ==================================================
            QUICK LINKS
        ================================================== */}

        <section className="mb-10">
          <h2 className="mb-5 text-2xl font-bold text-slate-950">
            Quick Links
          </h2>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/practice"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-2xl">
                🎤
              </div>

              <h3 className="text-lg font-bold text-slate-950">
                Practice
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Start an AI English conversation.
              </p>
            </Link>

            <Link
              href="/progress"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                📊
              </div>

              <h3 className="text-lg font-bold text-slate-950">
                Progress
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Track your English improvement.
              </p>
            </Link>

            <Link
              href="/history"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-2xl">
                🕘
              </div>

              <h3 className="text-lg font-bold text-slate-950">
                History
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Review your previous conversations.
              </p>
            </Link>

            <Link
              href="/settings"
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-2xl">
                ⚙️
              </div>

              <h3 className="text-lg font-bold text-slate-950">
                Settings
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Manage your daily practice goal.
              </p>
            </Link>
          </div>
        </section>

        {/* ==================================================
            KEEP GOING
        ================================================== */}

        <section className="mb-10 overflow-hidden rounded-3xl bg-slate-950 px-8 py-10 shadow-lg md:px-10">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-emerald-400">
                Keep Going
              </p>

              <h2 className="max-w-3xl text-3xl font-bold tracking-tight text-white md:text-4xl">
                Small practice every day creates big progress.
              </h2>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
                Your goal is not perfect English. Your goal is to
                communicate with more confidence every day.
              </p>
            </div>

            {/* CLEARLY VISIBLE PRACTICE NOW BUTTON */}

            <Link
              href="/practice"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-400 px-7 py-4 text-base font-bold text-slate-950 shadow-lg transition-all duration-200 hover:scale-105 hover:bg-emerald-300 hover:shadow-xl"
            >
              🎤 Practice Now
              <span className="ml-2 text-lg">→</span>
            </Link>
          </div>
        </section>

        {/* ==================================================
            SUMMARY
        ================================================== */}

        <section className="grid gap-5 pb-10 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-7 text-center shadow-sm">
            <div className="text-3xl font-bold text-slate-950">
              {totalSessions}
            </div>

            <div className="mt-1 text-sm font-medium text-slate-500">
              Total Sessions
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-7 text-center shadow-sm">
            <div className="text-3xl font-bold text-slate-950">
              {totalMessages}
            </div>

            <div className="mt-1 text-sm font-medium text-slate-500">
              Messages
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-7 text-center shadow-sm">
            <div className="text-3xl font-bold text-slate-950">
              {averageAccuracy}%
            </div>

            <div className="mt-1 text-sm font-medium text-slate-500">
              Average Accuracy
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}