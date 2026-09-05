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
    <main className="min-h-screen">

      {/* =====================================================
          HERO SECTION
      ====================================================== */}
      <section className="relative overflow-hidden pt-10">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
          
          {/* Hero Text */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/40 backdrop-blur-md border border-white/50 shadow-sm px-4 py-2 text-sm font-semibold text-teal-800">
              <span>🌱</span>
              <span>Build confidence by speaking</span>
            </div>

            <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Practice English by{" "}
              <span className="text-teal-600 drop-shadow-sm">Talking</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-700">
              Build your confidence through simple, real-life conversations
              with your personal AI speaking partner.
            </p>

            {/* FIXED BUTTONS: Solid Teal for high visibility */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a href="/signup">
                <button className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-teal-700 hover:shadow-xl">
                  Start Speaking — It&apos;s Free
                  <span className="ml-2">→</span>
                </button>
              </a>

              <a href="#how-it-works">
                <button className="inline-flex items-center justify-center rounded-xl border border-white/50 bg-white/30 px-8 py-4 text-base font-bold text-teal-900 shadow-sm backdrop-blur-sm transition-all hover:bg-white/50">
                  See How It Works
                </button>
              </a>
            </div>

            <p className="mt-5 text-sm font-medium text-slate-600">
              No English partner? No problem. Practice anytime.
            </p>
          </div>

          {/* AI Conversation Demo - Glassmorphism */}
          <div className="relative">
            <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-teal-300/40 blur-3xl mix-blend-multiply" />
            <div className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-purple-300/40 blur-3xl mix-blend-multiply" />

            <Card className="relative border border-white/50 bg-white/30 p-5 shadow-2xl backdrop-blur-xl sm:p-7">
              <div className="mb-6 flex items-center gap-3 border-b border-white/30 pb-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/60 text-xl shadow-sm backdrop-blur-md">
                  🤖
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Alex</p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                    AI Speaking Partner
                  </div>
                </div>
              </div>

              <div className="mb-5 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60 shadow-sm backdrop-blur-md">
                  🤖
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-white/50 bg-white/60 px-4 py-3 shadow-sm backdrop-blur-md">
                  <p className="text-sm leading-6 text-slate-800">
                    Hi! Nice to meet you. What&apos;s your name?
                  </p>
                </div>
              </div>

              <div className="mb-5 flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-sm border border-teal-400/30 bg-teal-600/90 px-4 py-3 shadow-md backdrop-blur-md">
                  <p className="text-sm leading-6 text-white">
                    Hi, my name is Nikhil.
                  </p>
                </div>
              </div>

              <div className="mb-6 flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/60 shadow-sm backdrop-blur-md">
                  🤖
                </div>
                <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-white/50 bg-white/60 px-4 py-3 shadow-sm backdrop-blur-md">
                  <p className="text-sm leading-6 text-slate-800">
                    Nice to meet you, Nikhil! Where are you from?
                  </p>
                </div>
              </div>

              <div className="border-t border-white/30 pt-5">
                <button
                  type="button"
                  className="flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-white/60 bg-white/50 px-5 py-4 font-semibold text-teal-800 shadow-sm backdrop-blur-md transition-all hover:bg-white/70 hover:shadow-md"
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
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-semibold tracking-wider text-teal-700">
              WHY SPEAKEASY AI?
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              Learn English by actually using it
            </h2>
            <p className="mt-4 text-slate-700">
              Practice speaking in a comfortable environment where mistakes
              are part of learning.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card hover className="border-white/40 bg-white/30 shadow-sm backdrop-blur-md">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/50 bg-white/60 text-2xl shadow-sm">
                🗣️
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                Practice Speaking
              </h3>
              <p className="mt-3 leading-7 text-slate-700">
                Improve your speaking skills through realistic everyday
                conversations instead of memorizing long lessons.
              </p>
            </Card>

            <Card hover className="border-white/40 bg-white/30 shadow-sm backdrop-blur-md">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/50 bg-white/60 text-2xl shadow-sm">
                🤖
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                Your AI Partner
              </h3>
              <p className="mt-3 leading-7 text-slate-700">
                Practice anytime with a friendly AI partner who adapts the
                conversation to your English level.
              </p>
            </Card>

            <Card hover className="border-white/40 bg-white/30 shadow-sm backdrop-blur-md">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/50 bg-white/60 text-2xl shadow-sm">
                ✨
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                Simple Corrections
              </h3>
              <p className="mt-3 leading-7 text-slate-700">
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
      <section id="how-it-works" className="relative py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-semibold tracking-wider text-teal-700">
              HOW IT WORKS
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              Simple practice. Real improvement.
            </h2>
            <p className="mt-4 text-slate-700">
              Talk, learn, and repeat. That&apos;s it.
            </p>
          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-3">
            <div className="rounded-2xl border border-white/30 bg-white/20 p-6 text-center shadow-sm backdrop-blur-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-xl font-bold text-teal-700 shadow-sm">
                01
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">
                Choose a situation
              </h3>
              <p className="mx-auto mt-3 max-w-sm leading-7 text-slate-700">
                Pick a real-life situation such as shopping, travel,
                restaurants, or meeting someone new.
              </p>
            </div>

            <div className="rounded-2xl border border-white/30 bg-white/20 p-6 text-center shadow-sm backdrop-blur-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-xl font-bold text-teal-700 shadow-sm">
                02
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">
                Talk with AI
              </h3>
              <p className="mx-auto mt-3 max-w-sm leading-7 text-slate-700">
                Have a natural conversation with your AI speaking partner
                using simple English.
              </p>
            </div>

            <div className="rounded-2xl border border-white/30 bg-white/20 p-6 text-center shadow-sm backdrop-blur-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/50 bg-white/60 text-xl font-bold text-teal-700 shadow-sm">
                03
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">
                Learn &amp; improve
              </h3>
              <p className="mx-auto mt-3 max-w-sm leading-7 text-slate-700">
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
      <section id="practice" className="relative py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="font-semibold tracking-wider text-teal-700">
                PRACTICE
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
                Practice real-life English
              </h2>
              <p className="mt-3 max-w-xl text-slate-700">
                Choose a situation you might experience in everyday life.
              </p>
            </div>

            <a
              href="/practice"
              className="rounded-full border border-white/50 bg-white/40 px-4 py-2 font-semibold text-teal-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white/60 hover:text-teal-800"
            >
              View all scenarios →
            </a>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <a
                key={scenario.title}
                href={scenario.href}
                className="group block h-full"
              >
                <Card hover className="h-full border-white/40 bg-white/30 shadow-sm backdrop-blur-md transition hover:bg-white/50">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/50 bg-white/60 text-2xl shadow-sm">
                      {scenario.icon}
                    </span>

                    <span className="text-slate-400 transition-colors group-hover:text-teal-600">
                      →
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-slate-900">
                    {scenario.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {scenario.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Badge variant={scenario.variant}>{scenario.level}</Badge>
                    <Badge variant="gray">{scenario.duration}</Badge>
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
          FINAL CTA - Glassmorphism Panel
      ====================================================== */}
      <section className="relative mx-4 mb-20 mt-10 max-w-6xl overflow-hidden rounded-[3rem] border border-white/30 bg-teal-800/40 py-20 shadow-2xl backdrop-blur-xl sm:mx-6 lg:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/20 to-purple-500/20 mix-blend-overlay" />
        
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="text-5xl drop-shadow-md">🌱</div>

          <h2 className="mt-6 text-3xl font-bold text-slate-900 drop-shadow-sm sm:text-4xl">
            Ready to start speaking?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-lg font-medium leading-8 text-slate-800">
            Your first conversation takes less than 5 minutes.
          </p>

          <div className="mt-8">
            <a href="/signup">
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-600 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-teal-700 focus:outline-none"
              >
                Start Speaking Free <span>→</span>
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER - Dark Glassmorphism
      ====================================================== */}
      <footer className="border-t border-white/10 bg-slate-900/60 py-12 text-white backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 md:grid-cols-3">
            
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 text-lg font-bold">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-teal-500/80 backdrop-blur-sm">
                  💬
                </span>
                SpeakEasy AI
              </div>

              <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
                Practice English. Speak with Confidence.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-slate-100">Product</h3>

              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <a href="#how-it-works" className="transition-colors hover:text-teal-300">
                  How It Works
                </a>
                <a href="/practice" className="transition-colors hover:text-teal-300">
                  Practice
                </a>
                <a href="/dashboard" className="transition-colors hover:text-teal-300">
                  Dashboard
                </a>
              </div>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold text-slate-100">Support</h3>

              <div className="mt-4 flex flex-col gap-3 text-sm text-slate-400">
                <a href="/profile" className="transition-colors hover:text-teal-300">
                  Profile
                </a>
                <a href="/settings" className="transition-colors hover:text-teal-300">
                  Settings
                </a>
                <a href="/login" className="transition-colors hover:text-teal-300">
                  Login
                </a>
              </div>
            </div>

          </div>

          <div className="mt-10 border-t border-slate-700/50 pt-6 text-sm text-slate-400">
            © 2026 SpeakEasy AI. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}