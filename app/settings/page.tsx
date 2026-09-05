"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const DAILY_PROGRESS_KEY = "speakeasy-daily-progress";

type Profile = {
  id: string;
  daily_goal: number | null;
};

export default function SettingsPage() {
  const [dailyGoal, setDailyGoal] = useState(10);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadDailyGoal();
  }, []);

  async function loadDailyGoal() {
    setLoading(true);

    // First try Supabase.
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("id, daily_goal")
          .eq("id", user.id)
          .maybeSingle();

        if (!error && profile) {
          const supabaseGoal =
            typeof profile.daily_goal === "number"
              ? profile.daily_goal
              : 15;

          setDailyGoal(supabaseGoal);

          // Keep localStorage synchronized.
          syncLocalProgress(supabaseGoal);

          setLoading(false);
          return;
        }
      }
    } catch (error) {
      console.error(
        "Failed to load daily goal from Supabase:",
        error
      );
    }

    // Fallback to localStorage.
    try {
      const stored = localStorage.getItem(
        DAILY_PROGRESS_KEY
      );

      if (stored) {
        const parsed = JSON.parse(stored);

        if (
          parsed &&
          typeof parsed.goal === "number"
        ) {
          setDailyGoal(parsed.goal);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load local settings:",
        error
      );
    }

    setLoading(false);
  }

  function syncLocalProgress(goal: number) {
    try {
      const stored = localStorage.getItem(
        DAILY_PROGRESS_KEY
      );

      let currentProgress = {
        date: "",
        minutes: 0,
        goal,
      };

      if (stored) {
        const parsed = JSON.parse(stored);

        if (
          parsed &&
          typeof parsed === "object"
        ) {
          currentProgress = {
            date:
              typeof parsed.date === "string"
                ? parsed.date
                : "",
            minutes:
              typeof parsed.minutes === "number"
                ? parsed.minutes
                : 0,
            goal,
          };
        }
      }

      localStorage.setItem(
        DAILY_PROGRESS_KEY,
        JSON.stringify(currentProgress)
      );
    } catch (error) {
      console.error(
        "Failed to sync local progress:",
        error
      );
    }
  }

  async function saveDailyGoal() {
    setSaving(true);
    setSaved(false);

    let supabaseSaved = false;

    // Save to Supabase.
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase
          .from("profiles")
          .update({
            daily_goal: dailyGoal,
          })
          .eq("id", user.id);

        if (!error) {
          supabaseSaved = true;
        } else {
          console.error(
            "Failed to save daily goal to Supabase:",
            error
          );
        }
      }
    } catch (error) {
      console.error(
        "Supabase settings error:",
        error
      );
    }

    // Always save locally as well.
    syncLocalProgress(dailyGoal);

    setSaving(false);
    setSaved(true);

    if (!supabaseSaved) {
      console.warn(
        "Daily goal was saved locally, but not to Supabase."
      );
    }

    setTimeout(() => {
      setSaved(false);
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 pb-24">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold text-green-600">
            SETTINGS
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Customize your practice
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600">
            Adjust your SpeakEasy AI practice
            preferences.
          </p>
        </div>

        {/* Practice Settings */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              Practice
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Set your daily English practice target.
            </p>
          </div>

          <div className="p-6">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="font-semibold text-slate-900">
                  Daily Practice Goal
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  How many minutes would you like to
                  practice each day?
                </p>
              </div>

              <div className="flex items-center gap-3">

                <select
                  value={dailyGoal}
                  disabled={loading || saving}
                  onChange={(event) =>
                    setDailyGoal(
                      Number(event.target.value)
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value={5}>
                    5 minutes
                  </option>

                  <option value={10}>
                    10 minutes
                  </option>

                  <option value={15}>
                    15 minutes
                  </option>

                  <option value={20}>
                    20 minutes
                  </option>

                  <option value={30}>
                    30 minutes
                  </option>

                  <option value={45}>
                    45 minutes
                  </option>

                  <option value={60}>
                    60 minutes
                  </option>
                </select>

                <button
                  onClick={saveDailyGoal}
                  disabled={loading || saving}
                  className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save"}
                </button>

              </div>
            </div>

            {saved && (
              <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                ✓ Daily goal saved successfully.
              </div>
            )}
          </div>
        </section>

        {/* AI Settings */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-bold text-slate-900">
              AI Practice
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your AI conversation experience.
            </p>
          </div>

          <div className="divide-y divide-slate-100">

            <div className="flex items-center justify-between gap-4 px-6 py-5">
              <div>
                <p className="font-medium text-slate-900">
                  AI Conversations
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Practice natural English conversations
                  with AI.
                </p>
              </div>

              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Enabled
              </span>
            </div>

            <div className="flex items-center justify-between gap-4 px-6 py-5">
              <div>
                <p className="font-medium text-slate-900">
                  Grammar Corrections
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Track corrections during practice
                  sessions.
                </p>
              </div>

              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Enabled
              </span>
            </div>

          </div>
        </section>

        {/* Navigation */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-bold text-slate-900">
            Quick Links
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Jump to another part of your account.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">

            <a
              href="/profile"
              className="rounded-xl border border-slate-200 p-4 transition hover:border-green-300 hover:bg-green-50"
            >
              <div className="mb-2 text-2xl">
                👤
              </div>

              <p className="font-semibold text-slate-900">
                Profile
              </p>

              <p className="mt-1 text-xs text-slate-500">
                View your profile
              </p>
            </a>

            <a
              href="/progress"
              className="rounded-xl border border-slate-200 p-4 transition hover:border-green-300 hover:bg-green-50"
            >
              <div className="mb-2 text-2xl">
                📈
              </div>

              <p className="font-semibold text-slate-900">
                Progress
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Track your improvement
              </p>
            </a>

            <a
              href="/history"
              className="rounded-xl border border-slate-200 p-4 transition hover:border-green-300 hover:bg-green-50"
            >
              <div className="mb-2 text-2xl">
                📚
              </div>

              <p className="font-semibold text-slate-900">
                History
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Review conversations
              </p>
            </a>

          </div>
        </section>

        {/* Account Information */}
        <section className="rounded-2xl bg-slate-900 p-6">

          <div className="flex items-start gap-4">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl">
              💡
            </div>

            <div>
              <h2 className="font-bold text-white">
                Keep practicing
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                Consistent daily practice is one of
                the best ways to build English
                speaking confidence.
              </p>

              <a
                href="/practice"
                className="mt-4 inline-flex rounded-xl bg-green-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-600"
              >
                Practice Now →
              </a>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}