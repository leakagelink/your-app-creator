import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PolicyLinks } from "@/components/LegalPage";
import { AppShell, SectionTitle } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Badre Electrician Service" },
      { name: "description", content: "Profile, support aur panels." },
      { property: "og:title", content: "Profile" },
      { property: "og:description", content: "Profile aur settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut, isAdmin, isWorker } = useAuth();

  const displayName = profile?.full_name?.trim() || user?.email?.split("@")[0] || "Profile";
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Logout ho gaya");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <AppShell>
      <header className="rise flex items-center gap-3">
        <div className="grid size-14 place-items-center rounded-2xl bg-ink font-display text-2xl text-amber">
          {initial}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-extrabold">{displayName}</h1>
          <p className="truncate text-xs text-ink-soft">
            {user
              ? `✉️ ${user.email}${profile?.city ? ` · ${profile.city}` : ""}`
              : "Login nahi kiya"}
          </p>
        </div>
      </header>

      {/* account */}
      <section className="rise rounded-3xl bg-lav/10 p-4 ring-1 ring-lav/20 [animation-delay:60ms]">
        {loading ? (
          <p className="text-xs text-ink-soft">Account check kar rahe hain...</p>
        ) : user ? (
          <>
            <p className="text-xs font-bold text-lav">🔐 Email account</p>
            <p className="mt-1 text-[11px] text-ink-soft">
              {user.email}
              {profile?.phone ? ` · 📱 ${profile.phone}` : ""}
            </p>
            <button
              onClick={handleSignOut}
              className="mt-3 w-full rounded-2xl bg-ink px-4 py-2.5 text-xs font-bold text-white transition active:scale-[0.98]"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <p className="text-xs font-bold text-lav">🔐 Login karein</p>
            <p className="mt-1 text-[11px] text-ink-soft">
              Email aur password se account banayein — booking, payment aur rewards
              save rahenge.
            </p>
            <Link
              to="/auth"
              className="mt-3 block rounded-2xl bg-ink px-4 py-2.5 text-center text-xs font-bold text-white transition active:scale-[0.98]"
            >
              Login / Account banayein
            </Link>
          </>
        )}
      </section>

      {/* role panels */}
      {user && (isAdmin || isWorker) ? <section className="rise [animation-delay:120ms]">
        <SectionTitle>Panels</SectionTitle>
        <div className="space-y-2.5">
          {isWorker ? <Link
            to="/worker-panel"
            className="flex items-center justify-between rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60 backdrop-blur-md transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-volt/15 text-lg">
                👷
              </span>
              <div>
                <p className="text-sm font-bold">Worker Panel</p>
                <p className="text-[11px] text-ink-soft">
                  Naye jobs, kamai, payout status
                </p>
              </div>
            </div>
            <span className="text-ink-soft">→</span>
          </Link> : null}
          {isAdmin ? <Link
            to="/admin"
            className="flex items-center justify-between rounded-3xl bg-ink p-4 text-white transition active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-amber/20 text-lg">
                👑
              </span>
              <div>
                <p className="text-sm font-bold">Admin Panel (Malik)</p>
                <p className="text-[11px] text-white/60">
                  Commission, bookings, users, KYC
                </p>
              </div>
            </div>
            <span className="text-amber">→</span>
          </Link> : null}
        </div>
      </section> : null}

      <p className="rise pt-2 text-center font-mono text-[10px] text-ink-soft [animation-delay:240ms]">
        Badre Electrician Service · badreelectricianservice.online
      </p>
    <PolicyLinks /></AppShell>
  );
}
