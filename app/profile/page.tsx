"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type PracticeSession = {
  id: string;
  topic: string;
  provider: "gemini" | "openai";
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
  correctionCount: number;
  userMessageCount: number;
  accuracy: number;
  createdAt: string;
};

type SupabasePracticeSession = {
  id: string;
  topic: string;
  provider: "gemini" | "openai";
  messages: {
    role: "user" | "assistant";
    content: string;
  }[];
  correction_count: number;
  user_message_count: number;
  accuracy: number;
  created_at: string;
};

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  daily_goal: number;
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadProfile();
    loadPracticeSessions();
  }, []);

  async function loadProfile() {
    setLoadingProfile(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoadingProfile(false);
      router.push("/login");
      return;
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, email, full_name, daily_goal")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile) {
      setProfile(existingProfile);
      setLoadingProfile(false);
      return;
    }

    // Create a profile for older accounts that don't have one yet.
    const { data: newProfile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? null,
        daily_goal: 15,
      })
      .select("id, email, full_name, daily_goal")
      .single();

    if (!insertError && newProfile) {
      setProfile(newProfile);
    }

    setLoadingProfile(false);
  }

  async function loadPracticeSessions() {
    setLoadingSessions(true);

    // First make sure there is a logged-in user.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadingSessions(false);
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
        `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      const cloudSessions: PracticeSession[] =
        (data as SupabasePracticeSession[]).map((session) => ({
          id: session.id,
          topic: session.topic,
          provider: session.provider,
          messages: session.messages ?? [],
          correctionCount: session.correction_count ?? 0,
          userMessageCount: session.user_message_count ?? 0,
          accuracy: session.accuracy ?? 0,
          createdAt: session.created_at,
        }));

      setSessions(cloudSessions);
      setLoadingSessions(false);
      return;
    }

    // Fallback to local history if Supabase cannot be read.
    try {
      const savedHistory = localStorage.getItem(
        "speakeasy-practice-history"
      );

      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);

        if (Array.isArray(parsed)) {
          setSessions(parsed);
        }
      }
    } catch {
      setSessions([]);
    }

    setLoadingSessions(false);
  }

  const totalSessions = sessions.length;

  const totalMessages = sessions.reduce(
    (total, session) => total + session.userMessageCount,
    0
  );

  const averageAccuracy =
    sessions.length === 0
      ? 0
      : Math.round(
          sessions.reduce(
            (total, session) => total + session.accuracy,
            0
          ) / sessions.length
        );

  async function handleClearHistory() {
    const confirmed = window.confirm(
      "Are you sure you want to delete all practice history?"
    );

    if (!confirmed) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Delete cloud history.
    if (user) {
      const { error } = await supabase
        .from("practice_sessions")
        .delete()
        .eq("user_id", user.id);

      if (error) {
        alert(
          "Could not delete your cloud practice history. Please try again."
        );
        return;
      }
    }

    // Delete local history too.
    localStorage.removeItem("speakeasy-practice-history");

    setSessions([]);
  }

  async function handleLogout() {
    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setLoggingOut(false);
      alert(error.message);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-green-600">
            Your Profile
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Keep improving your English 🚀
          </h1>

          <p className="mt-2 text-slate-600">
            Track your practice and keep building confidence.
          </p>
        </div>

        {/* Profile Card */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-green-100 text-4xl">
              👤
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900">
                {profile?.full_name || "English Learner"}
              </h2>

              <p className="mt-1 truncate text-sm text-slate-500">
                {loadingProfile
                  ? "Loading account..."
                  : profile?.email || "SpeakEasy AI member"}
              </p>

              <div className="mt-3 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Keep practicing 💪
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Practice Sessions
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loadingSessions ? "..." : totalSessions}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Messages Practiced
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loadingSessions ? "..." : totalMessages}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Average Accuracy
            </p>

            <p className="mt-2 text-3xl font-bold text-green-600">
              {loadingSessions ? "..." : `${averageAccuracy}%`}
            </p>
          </div>
        </section>

        {/* Account */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Account
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {/* Email */}
            <div className="flex items-center justify-between gap-4 px-6 py-5">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">
                  Email
                </p>

                <p className="mt-1 truncate text-sm text-slate-500">
                  {loadingProfile
                    ? "Loading..."
                    : profile?.email || "No email available"}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Active
              </span>
            </div>

            {/* Learning Goal */}
            <div className="flex items-center justify-between gap-4 px-6 py-5">
              <div>
                <p className="font-medium text-slate-900">
                  Daily Practice Goal
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {profile?.daily_goal || 15} minutes per day
                </p>
              </div>

              <span className="text-xl">🎯</span>
            </div>

            {/* AI Practice */}
            <div className="flex items-center justify-between gap-4 px-6 py-5">
              <div>
                <p className="font-medium text-slate-900">
                  AI Practice
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Practice conversations with AI
                </p>
              </div>

              <span className="text-xl">🤖</span>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-slate-900">
            Quick Actions
          </h2>

          <div className="grid gap-3 sm:grid-cols-3">
            <a
              href="/practice"
              className="rounded-xl border border-slate-200 p-4 transition hover:border-green-300 hover:bg-green-50"
            >
              <div className="mb-2 text-2xl">🎤</div>

              <p className="font-semibold text-slate-900">
                Start Practice
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Practice speaking with AI
              </p>
            </a>

            <a
              href="/progress"
              className="rounded-xl border border-slate-200 p-4 transition hover:border-green-300 hover:bg-green-50"
            >
              <div className="mb-2 text-2xl">📈</div>

              <p className="font-semibold text-slate-900">
                View Progress
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Check your performance
              </p>
            </a>

            <a
              href="/history"
              className="rounded-xl border border-slate-200 p-4 transition hover:border-green-300 hover:bg-green-50"
            >
              <div className="mb-2 text-2xl">📚</div>

              <p className="font-semibold text-slate-900">
                Practice History
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Review past conversations
              </p>
            </a>
          </div>
        </section>

        {/* Data */}
        <section className="mb-6 rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Data
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Delete your locally and cloud stored practice history.
          </p>

          <button
            onClick={handleClearHistory}
            className="mt-4 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            Clear Practice History
          </button>
        </section>

        {/* Logout */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            Session
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Sign out of your SpeakEasy AI account.
          </p>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? "Logging out..." : "Log Out"}
          </button>
        </section>
      </div>
    </main>
  );
}