"use client";

import { usePathname } from "next/navigation";

const navigationItems = [
  {
    name: "Home",
    href: "/dashboard",
    icon: "🏠",
  },
  {
    name: "Practice",
    href: "/practice",
    icon: "🎤",
  },
  {
    name: "History",
    href: "/history",
    icon: "📚",
  },
  {
    name: "Progress",
    href: "/progress",
    icon: "📈",
  },
  {
    name: "You",
    href: "/profile",
    icon: "👤",
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white md:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex min-w-14 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-xs font-medium transition-colors ${
                isActive
                  ? "text-green-600"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span
                className={`text-xl transition-transform ${
                  isActive ? "scale-110" : ""
                }`}
              >
                {item.icon}
              </span>

              <span>
                {item.name}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}