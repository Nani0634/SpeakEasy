import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const scenarios = [
  {
    icon: "👋",
    title: "Introduce Yourself",
    description: "Practice meeting someone for the first time.",
    level: "Beginner",
    duration: "5 min",
    href: "/practice/introduce-yourself",
    variant: "green" as const,
  },
  {
    icon: "☀️",
    title: "Daily Conversation",
    description: "Talk about your day, hobbies, and routine.",
    level: "Beginner",
    duration: "5 min",
    href: "/practice/daily-conversation",
    variant: "green" as const,
  },
  {
    icon: "🛍️",
    title: "Shopping",
    description: "Practice asking about prices, sizes, and products.",
    level: "Beginner",
    duration: "5 min",
    href: "/practice/shopping",
    variant: "green" as const,
  },
  {
    icon: "🍽️",
    title: "Restaurant",
    description: "Practice ordering food and talking with staff.",
    level: "Beginner",
    duration: "5 min",
    href: "/practice/restaurant",
    variant: "green" as const,
  },
  {
    icon: "✈️",
    title: "Travel",
    description: "Practice useful English for airports and hotels.",
    level: "Elementary",
    duration: "10 min",
    href: "/practice/travel",
    variant: "blue" as const,
  },
  {
    icon: "💼",
    title: "Job Interview",
    description: "Practice answering common interview questions.",
    level: "Intermediate",
    duration: "15 min",
    href: "/practice/job-interview",
    variant: "purple" as const,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">

      {/* =====================================================
          HERO SECTION
      ====================================================== */}
      <section className="overflow-hidden bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          
          {/* Hero Text */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
              <span>🌱</span>
              <span>Build confidence by speaking</span>
            </div>

            <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Practice English by{" "}
              <span className="text-green-600">Talking</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Build your confidence through simple, real-life conversations
              with your personal AI speaking partner.
            </p>

            {/* Hero Buttons */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a href="/signup">
                <Button size="large">
                  Start Speaking — It&apos;s Free
                  <span>→</span>
                </Button>
              </a>

              <a href="#how-it-works">
                <Button variant="outline" size="large">
                  See How It Works
                </Button>
              </a>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              No English partner? No problem. Practice anytime.
            </p>
          </div>

          {/* AI Conversation Demo */}
          <div className="relative">
            {/* Decorative circles */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-green-100 blur-3xl" />

            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-100 blur-3xl" />

            {/* Conversation Card */}
            <Card className="relative p-5 shadow-xl sm:p-7">
              
              {/* AI Header */}
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-xl">
                  🤖
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    Alex
                  </p>

                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    AI Speaking Partner
                  </div>
                </div>
              </div>

              {/* AI Message */}
              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
                  🤖
                </div>

                <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3">
                  <p className="text-sm leading-6 text-slate-700">
                    Hi! Nice to meet you. What&apos;s your name?
                  </p>
                </div>
              </div>

              {/* User Message */}
              <div className="mb-5 flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-green-600 px-4 py-3">
                  <p className="text-sm leading-6 text-white">
                    Hi, my name is Nikhil.
                  </p>
                </div>
              </div>

              {/* AI Message */}
              <div className="mb-6 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
                  🤖
                </div>

                <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3">
                  <p className="text-sm leading-6 text-slate-700">
                    Nice to meet you, Nikhil! Where are you from?
                  </p>
                </div>
              </div>

              {/* Voice Button */}
              <div className="border-t border-slate-100 pt-5">
                <button
                  type="button"
                  className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-green-50 px-5 py-4 font-semibold text-green-700 transition-colors hover:bg-green-100"
                >
                  <span className="text-xl">🎤</span>
                  Hold to Speak
                </button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* =====================================================
          BENEFITS
      ====================================================== */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          
          {/* Section Heading */}
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-semibold text-green-600">
              WHY SPEAKEASY AI?
            </p>

            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              Learn English by actually using it
            </h2>

            <p className="mt-4 text-slate-600">
              Practice speaking in a comfortable environment where mistakes
              are part of learning.
            </p>
          </div>

          {/* Benefit Cards */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            
            <Card hover>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                🗣️
              </div>

              <h3 className="text-xl font-semibold text-slate-900">
                Practice Speaking
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Improve your speaking skills through realistic everyday
                conversations instead of memorizing long lessons.
              </p>
            </Card>

            <Card hover>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                🤖
              </div>

              <h3 className="text-xl font-semibold text-slate-900">
                Your AI Partner
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Practice anytime with a friendly AI partner who adapts the
                conversation to your English level.
              </p>
            </Card>

            <Card hover>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-2xl">
                ✨
              </div>

              <h3 className="text-xl font-semibold text-slate-900">
                Simple Corrections
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Get useful corrections and phrases without being interrupted
                every time you make a mistake.
              </p>
            </Card>

          </div>
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}
      <section
        id="how-it-works"
        className="bg-white py-20"
      >
        <div className="mx-auto max-w-7xl px-6">
          
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-semibold text-green-600">
              HOW IT WORKS
            </p>

            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              Simple practice. Real improvement.
            </h2>

            <p className="mt-4 text-slate-600">
              Talk, learn, and repeat. That&apos;s it.
            </p>
          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            
            {/* Step 1 */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 font-bold text-green-700">
                01
              </div>

              <h3 className="mt-5 text-xl font-semibold text-slate-900">
                Choose a situation
              </h3>

              <p className="mx-auto mt-3 max-w-sm leading-7 text-slate-600">
                Pick a real-life situation such as shopping, travel,
                restaurants, or meeting someone new.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 font-bold text-green-700">
                02
              </div>

              <h3 className="mt-5 text-xl font-semibold text-slate-900">
                Talk with AI
              </h3>

              <p className="mx-auto mt-3 max-w-sm leading-7 text-slate-600">
                Have a natural conversation with your AI speaking partner
                using simple English.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 font-bold text-green-700">
                03
              </div>

              <h3 className="mt-5 text-xl font-semibold text-slate-900">
                Learn &amp; improve
              </h3>

              <p className="mx-auto mt-3 max-w-sm leading-7 text-slate-600">
                Review useful corrections, learn new phrases, and practice
                difficult sentences again.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          PRACTICE SCENARIOS
      ====================================================== */}
      <section
        id="practice"
        className="bg-slate-50 py-20"
      >
        <div className="mx-auto max-w-7xl px-6">
          
          {/* Section Header */}
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="font-semibold text-green-600">
                PRACTICE
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
                Practice real-life English
              </h2>

              <p className="mt-3 max-w-xl text-slate-600">
                Choose a situation you might experience in everyday life.
              </p>
            </div>

            <a
              href="/practice"
              className="font-semibold text-green-600 transition-colors hover:text-green-700"
            >
              View all scenarios →
            </a>
          </div>

          {/* Scenario Cards */}
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <a
                key={scenario.title}
                href={scenario.href}
                className="group block"
              >
                <Card hover className="h-full">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-3xl">
                      {scenario.icon}
                    </span>

                    <span className="text-slate-300 transition-colors group-hover:text-green-500">
                      →
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-slate-900">
                    {scenario.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {scenario.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Badge variant={scenario.variant}>
                      {scenario.level}
                    </Badge>

                    <Badge variant="gray">
                      {scenario.duration}
                    </Badge>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}
      <section className="bg-green-600 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          
          <div className="text-5xl">
            🌱
          </div>

          <h2 className="mt-6 text-3xl font-bold text-white sm:text-4xl">
            Ready to start speaking?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-lg leading-8 text-green-50">
            Your first conversation takes less than 5 minutes.
          </p>

          <div className="mt-8">
            <a href="/signup">
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-7 text-base font-semibold text-green-700 transition-colors hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-600"
              >
                Start Speaking Free
                <span>→</span>
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="bg-slate-950 py-12 text-white">
        <div className="mx-auto max-w-7xl px-6">
          
          <div className="grid gap-10 md:grid-cols-3">
            
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 text-lg font-bold">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600">
                  💬
                </span>

                SpeakEasy AI
              </div>

              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
                Practice English. Speak with Confidence.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold">
                Product
              </h3>

              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <a
                  href="#how-it-works"
                  className="transition-colors hover:text-white"
                >
                  How It Works
                </a>

                <a
                  href="/practice"
                  className="transition-colors hover:text-white"
                >
                  Practice
                </a>

                <a
                  href="/dashboard"
                  className="transition-colors hover:text-white"
                >
                  Dashboard
                </a>
              </div>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold">
                Support
              </h3>

              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <a
                  href="/profile"
                  className="transition-colors hover:text-white"
                >
                  Profile
                </a>

                <a
                  href="/settings"
                  className="transition-colors hover:text-white"
                >
                  Settings
                </a>

                <a
                  href="/login"
                  className="transition-colors hover:text-white"
                >
                  Login
                </a>
              </div>
            </div>

          </div>

          {/* Copyright */}
          <div className="mt-10 border-t border-slate-800 pt-6 text-sm text-slate-500">
            © 2026 SpeakEasy AI. All rights reserved.
          </div>

        </div>
      </footer>
    </main>
  );
}