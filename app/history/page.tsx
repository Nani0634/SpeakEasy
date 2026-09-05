"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Provider = "gemini" | "openai";

type PracticeSession = {
  id: string;
  user_id: string;
  topic: string;
  provider: Provider;
  messages: Message[];
  correction_count: number;
  user_message_count: number;
  accuracy: number;
  created_at: string;
};

export default function HistoryPage() {
  const supabase = useMemo(() => createClient(), []);

  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [selectedSession, setSelectedSession] =
    useState<PracticeSession | null>(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  /*
   * Load practice sessions from Supabase.
   */
  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setSessions([]);
        setSelectedSession(null);
        setError("Please log in to view your practice history.");
        return;
      }

      const { data, error: sessionsError } = await supabase
        .from("practice_sessions")
        .select(
          `
            id,
            user_id,
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
        });

      if (sessionsError) {
        throw sessionsError;
      }

      const safeSessions: PracticeSession[] = (
        data ?? []
      ).map((session) => ({
        id: session.id,
        user_id: session.user_id,
        topic: session.topic,
        provider:
          session.provider === "openai"
            ? "openai"
            : "gemini",
        messages: Array.isArray(session.messages)
          ? (session.messages as Message[])
          : [],
        correction_count:
          Number(session.correction_count) || 0,
        user_message_count:
          Number(session.user_message_count) || 0,
        accuracy:
          Number(session.accuracy) || 0,
        created_at: session.created_at,
      }));

      setSessions(safeSessions);

      /*
       * Keep the selected session if it still exists.
       * Otherwise select the newest session automatically.
       */
      setSelectedSession((current) => {
        if (current) {
          const stillExists = safeSessions.find(
            (session) => session.id === current.id,
          );

          if (stillExists) {
            return stillExists;
          }
        }

        return safeSessions[0] ?? null;
      });
    } catch (err) {
      console.error(
        "Failed to load practice history:",
        err,
      );

      setError(
        "We couldn't load your practice history. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  /*
   * Load history when the page opens.
   */
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  /*
   * Search sessions.
   */
  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return sessions;
    }

    return sessions.filter((session) => {
      const topic = session.topic.toLowerCase();
      const provider = session.provider.toLowerCase();

      const messageText = session.messages
        .map((message) => message.content)
        .join(" ")
        .toLowerCase();

      return (
        topic.includes(query) ||
        provider.includes(query) ||
        messageText.includes(query)
      );
    });
  }, [sessions, search]);

  /*
   * Format date/time for the history list.
   */
  const formatDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(dateString));
    } catch {
      return "Unknown date";
    }
  };

  /*
   * Short date for smaller screens.
   */
  const formatShortDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(dateString));
    } catch {
      return "Unknown date";
    }
  };

  /*
   * Get a preview from the user's messages.
   */
  const getPreview = (
    session: PracticeSession,
  ) => {
    const userMessage = session.messages.find(
      (message) => message.role === "user",
    );

    if (!userMessage?.content) {
      return "Practice conversation";
    }

    const text = userMessage.content.trim();

    if (text.length <= 100) {
      return text;
    }

    return `${text.slice(0, 100)}...`;
  };

  /*
   * Delete one practice session.
   */
  const deleteSession = async (
    sessionId: string,
  ) => {
    const confirmed = window.confirm(
      "Delete this practice session? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        setError(
          "Please log in to delete this session.",
        );
        return;
      }

      /*
       * The user_id condition provides an additional
       * safety check. RLS also protects this table.
       */
      const { error: deleteError } =
        await supabase
          .from("practice_sessions")
          .delete()
          .eq("id", sessionId)
          .eq("user_id", user.id);

      if (deleteError) {
        throw deleteError;
      }

      setSessions((current) =>
        current.filter(
          (session) => session.id !== sessionId,
        ),
      );

      setSelectedSession((current) =>
        current?.id === sessionId
          ? null
          : current,
      );
    } catch (err) {
      console.error(
        "Failed to delete practice session:",
        err,
      );

      setError(
        "We couldn't delete this session. Please try again.",
      );
    } finally {
      setDeleting(false);
    }
  };

  /*
   * Empty/loading states.
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 pb-24 md:pb-8">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-green-600">
              Practice History
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Your conversations
            </h1>

            <p className="mt-2 text-slate-600">
              Review your previous English practice
              sessions and track your progress.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-4 border-slate-200 border-t-green-500 animate-spin" />

            <p className="text-sm font-medium text-slate-600">
              Loading your practice history...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-green-600">
              Practice History
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Your conversations
            </h1>

            <p className="mt-2 max-w-2xl text-slate-600">
              Review your previous English practice
              sessions and see how you are improving.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSessions}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-green-300 hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Search */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              🔍
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search your conversations..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              {filteredSessions.length}{" "}
              {filteredSessions.length === 1
                ? "session"
                : "sessions"}
            </span>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="font-semibold text-green-600 hover:text-green-700"
              >
                Clear search
              </button>
            )}
          </div>
        </div>

        {/* No sessions */}
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-green-50 text-4xl">
              💬
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              No practice sessions yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Start an English practice conversation
              and your completed sessions will appear
              here automatically.
            </p>

            <a
              href="/practice"
              className="mt-6 inline-flex rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              Start Practicing
            </a>
          </div>
        ) : filteredSessions.length === 0 ? (
          /* No search results */
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
              🔎
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              No matching sessions
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Try searching for a different topic,
              provider, or phrase.
            </p>
          </div>
        ) : (
          /* History layout */
          <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
            {/* Session list */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="font-semibold text-slate-900">
                  Recent Sessions
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Select a session to view the full
                  conversation.
                </p>
              </div>

              <div className="max-h-[700px] overflow-y-auto">
                {filteredSessions.map(
                  (session) => {
                    const isSelected =
                      selectedSession?.id ===
                      session.id;

                    return (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() =>
                          setSelectedSession(
                            session,
                          )
                        }
                        className={`w-full border-b border-slate-100 p-4 text-left transition last:border-b-0 ${
                          isSelected
                            ? "bg-green-50"
                            : "bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${
                                  isSelected
                                    ? "bg-green-100"
                                    : "bg-slate-100"
                                }`}
                              >
                                💬
                              </span>

                              <div className="min-w-0">
                                <h3 className="truncate text-sm font-semibold text-slate-900">
                                  {session.topic}
                                </h3>

                                <p className="text-xs text-slate-500">
                                  {session.provider ===
                                  "gemini"
                                    ? "Gemini"
                                    : "OpenAI"}
                                </p>
                              </div>
                            </div>

                            <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">
                              {getPreview(session)}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-xs font-bold text-slate-900">
                              {session.accuracy}%
                            </p>

                            <p className="mt-1 text-[11px] text-slate-400">
                              {formatShortDate(
                                session.created_at,
                              )}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            </section>

            {/* Selected session */}
            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {selectedSession ? (
                <>
                  {/* Session header */}
                  <div className="border-b border-slate-200 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-xl">
                            🤖
                          </span>

                          <div>
                            <h2 className="text-lg font-bold text-slate-900">
                              {selectedSession.topic}
                            </h2>

                            <p className="text-xs text-slate-500">
                              {selectedSession.provider ===
                              "gemini"
                                ? "Powered by Gemini"
                                : "Powered by OpenAI"}
                            </p>
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-slate-500">
                          {formatDate(
                            selectedSession.created_at,
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          deleteSession(
                            selectedSession.id,
                          )
                        }
                        disabled={deleting}
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deleting
                          ? "Deleting..."
                          : "🗑 Delete"}
                      </button>
                    </div>

                    {/* Session stats */}
                    <div className="mt-5 grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-slate-50 p-3 text-center">
                        <p className="text-lg font-bold text-slate-900">
                          {
                            selectedSession.user_message_count
                          }
                        </p>

                        <p className="text-[11px] text-slate-500">
                          Messages
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3 text-center">
                        <p className="text-lg font-bold text-slate-900">
                          {
                            selectedSession.correction_count
                          }
                        </p>

                        <p className="text-[11px] text-slate-500">
                          Corrections
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3 text-center">
                        <p className="text-lg font-bold text-slate-900">
                          {selectedSession.accuracy}%
                        </p>

                        <p className="text-[11px] text-slate-500">
                          Accuracy
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Conversation */}
                  <div className="max-h-[650px] space-y-5 overflow-y-auto p-5">
                    {selectedSession.messages.length ===
                    0 ? (
                      <div className="py-10 text-center">
                        <p className="text-sm text-slate-500">
                          This session has no messages.
                        </p>
                      </div>
                    ) : (
                      selectedSession.messages.map(
                        (message, index) => {
                          const isUser =
                            message.role ===
                            "user";

                          return (
                            <div
                              key={`${selectedSession.id}-${index}`}
                              className={`flex ${
                                isUser
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[90%] sm:max-w-[78%]`}
                              >
                                <div
                                  className={`rounded-2xl px-4 py-3 ${
                                    isUser
                                      ? "rounded-br-md bg-green-600 text-white"
                                      : "rounded-bl-md bg-slate-100 text-slate-800"
                                  }`}
                                >
                                  <p
                                    className={`mb-1 text-[10px] font-bold uppercase tracking-wide ${
                                      isUser
                                        ? "text-green-100"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {isUser
                                      ? "You"
                                      : "AI"}
                                  </p>

                                  <p className="whitespace-pre-wrap text-sm leading-6">
                                    {
                                      message.content
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        },
                      )
                    )}
                  </div>
                </>
              ) : (
                <div className="flex min-h-[500px] items-center justify-center p-10 text-center">
                  <div>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-3xl">
                      💬
                    </div>

                    <h2 className="text-lg font-bold text-slate-900">
                      Select a session
                    </h2>

                    <p className="mt-2 text-sm text-slate-500">
                      Choose a practice session from
                      the list to view it.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Bottom tip */}
        <div className="mt-6 rounded-2xl bg-slate-900 p-5 text-white shadow-sm">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg">
              💡
            </div>

            <div>
              <h3 className="font-semibold">
                Keep practicing
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                Review your corrections, notice
                repeated mistakes, and try the same
                topics again. Consistent practice is
                the key to improving your English.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}