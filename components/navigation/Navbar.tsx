export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/30 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        
        {/* Logo */}
        <a
          href="/"
          className="flex items-center gap-2 group"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm text-lg transition-transform group-hover:scale-105">
            💬
          </span>

          <span className="text-lg font-bold text-slate-900 drop-shadow-sm">
            SpeakEasy AI
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-4 md:flex">
          <a
            href="/#how-it-works"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-white/50 hover:text-teal-700"
          >
            How It Works
          </a>

          <a
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-white/50 hover:text-teal-700"
          >
            Dashboard
          </a>

          <a
            href="/practice"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-white/50 hover:text-teal-700"
          >
            Practice
          </a>
          
          <a
            href="/progress"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-white/50 hover:text-teal-700"
          >
            Progress
          </a>
          
          <a
            href="/history"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-white/50 hover:text-teal-700"
          >
            History
          </a>
          
          <a
            href="/settings"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-white/50 hover:text-teal-700"
          >
            Settings
          </a>
          
          <a
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-white/50 hover:text-teal-700"
          >
            Login
          </a>

          {/* FIXED: Highly visible solid teal button */}
          <a href="/signup" className="ml-2">
            <button className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-teal-700 hover:shadow-lg">
              Start Free
            </button>
          </a>
        </nav>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-4 md:hidden">
          <a
            href="/login"
            className="text-sm font-semibold text-teal-700 transition-colors hover:text-teal-800"
          >
            Login
          </a>

          {/* FIXED: Highly visible solid teal button */}
          <a href="/signup">
            <button className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700">
              Start
            </button>
          </a>
        </div>

      </div>
    </header>
  );
}