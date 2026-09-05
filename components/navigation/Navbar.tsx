import Button from "@/components/ui/Button";

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-lg">
            💬
          </span>

          <span className="text-lg font-bold text-slate-900">
            SpeakEasy AI
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="/#how-it-works"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-green-600"
          >
            How It Works
          </a>

          <a
            href="/dashboard"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-green-600"
          >
            Dashboard
          </a>

          <a
            href="/practice"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-green-600"
          >
            Practice
          </a>
          <a
  href="/progress"
  className="text-sm font-medium text-slate-600 transition-colors hover:text-green-600"
>
  Progress
</a>
          {/* History */}
          <a
            href="/history"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-green-600"
          >
            History
          </a>
          <a
  href="/settings"
  className="text-sm font-medium text-slate-600 transition-colors hover:text-green-600"
>
  Settings
</a>
          <a
            href="/login"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-green-600"
          >
            Login
          </a>

          <a href="/signup">
            <Button size="small">
              Start Free
            </Button>
          </a>
        </nav>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-3 md:hidden">
          <a
            href="/login"
            className="text-sm font-semibold text-green-600"
          >
            Login
          </a>

          <a href="/signup">
            <Button size="small">
              Start
            </Button>
          </a>
        </div>
      </div>
    </header>
  );
}