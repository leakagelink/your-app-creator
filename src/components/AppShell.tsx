import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

const navItems = [
  { to: "/", icon: "🏠", label: "Home" },
  { to: "/bookings", icon: "📋", label: "Bookings" },
  { to: "/", icon: "＋", label: "", fab: true },
  { to: "/wallet", icon: "💳", label: "Wallet" },
  { to: "/profile", icon: "👤", label: "Profile" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-b from-ice via-paper to-ice font-sans text-ink antialiased">
      <div className="relative mx-auto min-h-[100dvh] w-full max-w-[420px] overflow-hidden">
        {/* ambient blobs */}
        <div className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-lav/25 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -right-20 size-72 rounded-full bg-amber/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-24 left-1/3 size-64 rounded-full bg-volt/15 blur-3xl" />

        <div className="relative space-y-5 px-4 pt-5 pb-32">{children}</div>

        {/* bottom nav */}
        <nav className="fixed bottom-0 left-1/2 w-full max-w-[420px] -translate-x-1/2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between rounded-3xl bg-glass/85 px-3 py-2.5 shadow-lg ring-1 ring-white/70 backdrop-blur-xl">
            {navItems.map((item, i) =>
              "fab" in item && item.fab ? (
                <Link
                  key={i}
                  to="/"
                  className="-mt-7 grid size-14 place-items-center rounded-full bg-volt text-white shadow-lg ring-4 ring-paper transition active:scale-95"
                  aria-label="Book service"
                >
                  <span className="text-xl leading-none">＋</span>
                </Link>
              ) : (
                <Link
                  key={i}
                  to={item.to}
                  className={`flex flex-col items-center gap-0.5 px-3 ${
                    pathname === item.to ? "text-volt" : "text-ink-soft"
                  }`}
                >
                  <span className="text-lg leading-none">{item.icon}</span>
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </Link>
              ),
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}

export function SectionTitle({
  children,
  tag,
}: {
  children: ReactNode;
  tag?: string;
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between">
      <h2 className="text-sm font-bold">{children}</h2>
      {tag ? <span className="font-mono text-[11px] text-ink-soft">{tag}</span> : null}
    </div>
  );
}
