"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Navbar from "@/components/navigation/Navbar";

const scenarios = {
  "introduce-yourself": {
    title: "Introduce Yourself",
    emoji: "👋",
    difficulty: "Beginner",
    description:
      "Practice introducing yourself, talking about where you are from, and sharing a little about yourself.",
    skills: ["Greetings", "Personal information", "Simple questions"],
    suggestedTime: "5 minutes",
  },

  "daily-conversation": {
    title: "Daily Conversation",
    emoji: "☀️",
    difficulty: "Beginner",
    description:
      "Have a natural conversation about your day, your routine, hobbies, and everyday life.",
    skills: ["Daily vocabulary", "Small talk", "Answering questions"],
    suggestedTime: "10 minutes",
  },

  shopping: {
    title: "Shopping",
    emoji: "🛍️",
    difficulty: "Beginner",
    description:
      "Practice asking about prices, sizes, colors, and buying things in a store.",
    skills: ["Prices", "Requests", "Shopping vocabulary"],
    suggestedTime: "5 minutes",
  },

  restaurant: {
    title: "Restaurant",
    emoji: "🍽️",
    difficulty: "Beginner",
    description:
      "Practice ordering food, asking questions about the menu, and talking to restaurant staff.",
    skills: ["Ordering food", "Polite requests", "Food vocabulary"],
    suggestedTime: "5 minutes",
  },

  travel: {
    title: "Travel",
    emoji: "✈️",
    difficulty: "Elementary",
    description:
      "Practice useful English for airports, hotels, directions, and common travel situations.",
    skills: ["Directions", "Travel vocabulary", "Useful questions"],
    suggestedTime: "10 minutes",
  },

  "job-interview": {
    title: "Job Interview",
    emoji: "💼",
    difficulty: "Intermediate",
    description:
      "Practice answering common interview questions and talking about your experience.",
    skills: ["Interview questions", "Work vocabulary", "Confident answers"],
    suggestedTime: "15 minutes",
  },
};

const durations = ["5 min", "10 min", "15 min"];

const aiPartners = [
  {
    name: "Alex",
    emoji: "🙂",
    description: "Friendly & patient",
  },
  {
    name: "Emma",
    emoji: "😊",
    description: "Warm & encouraging",
  },
  {
    name: "Sam",
    emoji: "😄",
    description: "Casual & relaxed",
  },
];

export default function ScenarioSetupPage() {
  const params = useParams<{ scenario: string }>();
  const scenario = scenarios[params.scenario as keyof typeof scenarios];

  const [selectedDuration, setSelectedDuration] = useState(
    scenario?.suggestedTime.replace(" minutes", " min") || "5 min"
  );

  const [selectedPartner, setSelectedPartner] = useState("Alex");

  if (!scenario) {
    return (
      <>
        <Navbar />

        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50 px-6">
          <div className="text-center">
            <div className="mb-4 text-5xl">😕</div>

            <h1 className="text-3xl font-bold text-slate-900">
              Scenario not found
            </h1>

            <p className="mt-3 text-slate-600">
              Sorry, we couldn't find that practice scenario.
            </p>

            <div className="mt-6">
              <a href="/practice">
                <Button>Back to Practice</Button>
              </a>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-4xl px-6 py-10 md:py-14">
        {/* Back */}
        <a
          href="/practice"
          className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-green-600"
        >
          ← Back to Practice
        </a>

        {/* Header */}
        <section className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-green-100 text-4xl">
            {scenario.emoji}
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <Badge variant="green">{scenario.difficulty}</Badge>
            <Badge variant="gray">{scenario.suggestedTime}</Badge>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            {scenario.title}
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            {scenario.description}
          </p>
        </section>

        {/* What you'll practice */}
        <section className="mt-10">
          <Card className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-900">
              What you'll practice
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {scenario.skills.map((skill) => (
                <div
                  key={skill}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                    ✓
                  </span>

                  <span className="text-sm font-medium text-slate-700">
                    {skill}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Conversation length */}
        <section className="mt-6">
          <Card className="p-6 md:p-8">
            <h2 className="text-xl font-bold text-slate-900">
              How long do you want to practice?
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              You can stop whenever you feel ready.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {durations.map((duration) => {
                const isSelected = selectedDuration === duration;

                return (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setSelectedDuration(duration)}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all ${
                      isSelected
                        ? "border-green-600 bg-green-50 text-green-700 ring-2 ring-green-100"
                        : "border-slate-200 bg-white text-slate-700 hover:border-green-300 hover:bg-green-50"
                    }`}
                  >
                    {duration}
                  </button>
                );
              })}
            </div>
          </Card>
        </section>

        {/* AI Partner */}
        <section className="mt-6">
          <Card className="p-6 md:p-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Choose your AI partner
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Don't worry — they are here to help you practice.
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {aiPartners.map((partner) => {
                const isSelected = selectedPartner === partner.name;

                return (
                  <button
                    key={partner.name}
                    type="button"
                    onClick={() => setSelectedPartner(partner.name)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? "border-green-600 bg-green-50 ring-2 ring-green-100"
                        : "border-slate-200 bg-white hover:border-green-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">
                        {partner.emoji}
                      </div>

                      <div>
                        <p className="font-semibold text-slate-900">
                          {partner.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {partner.description}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-3 text-xs font-semibold text-green-700">
                        ✓ Selected
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </section>

        {/* Start */}
        <section className="mt-8">
          <Card className="overflow-hidden bg-green-600 p-6 md:p-8">
            <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
              <div>
                <p className="text-lg font-bold text-white">
                  Ready to start?
                </p>

                <p className="mt-1 text-sm text-green-100">
                  {selectedDuration} with {selectedPartner}. Just be yourself
                  and start talking.
                </p>
              </div>

              <a
                href={`/conversation/${params.scenario}`}
                className="w-full md:w-auto"
              >
                <Button
                  size="large"
                  className="w-full bg-white text-green-700 hover:bg-green-50 md:w-auto"
                >
                  Start Conversation →
                </Button>
              </a>
            </div>
          </Card>
        </section>

        {/* Encouragement */}
        <p className="mt-8 text-center text-sm text-slate-500">
          💚 Remember: mistakes are part of learning. Just keep talking.
        </p>
      </main>
    </div>
  );
}