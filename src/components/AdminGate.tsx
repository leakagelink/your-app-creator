import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const inputCls =
  "w-full rounded-2xl bg-white/80 px-4 py-3 text-sm ring-1 ring-white/60 outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-lav/40";

export function AdminGate({ children }: { children: ReactNode }) {
  const { loading, session, isAdmin, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <AppShell>
        <p className="mt-10 text-center text-sm text-ink-soft">Ruko...</p>
      </AppShell>
    );
  }

  if (session && isAdmin) return <>{children}</>;

  if (session && !isAdmin) {
    return (
      <AppShell>
        <div className="rise mt-8 space-y-3 rounded-3xl bg-glass/80 p-5 text-center ring-1 ring-white/60 backdrop-blur-md">
          <p className="text-3xl">🔒</p>
          <h1 className="text-base font-extrabold">Sirf admin ke liye</h1>
          <p className="text-xs text-ink-soft">
            Ye panel sirf malik ke admin account se khulta hai.
          </p>
          <button
            onClick={() => void signOut()}
            className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-bold text-white"
          >
            Logout karke admin se login karein
          </button>
          <Link to="/" className="block text-[11px] font-bold text-lav">
            Home par jayein
          </Link>
        </div>
      </AppShell>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Email aur password dono bharein");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      toast.success("Admin login ho gaya");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login fail ho gaya");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <header className="rise mt-6 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-ink font-display text-2xl text-amber">
          👑
        </div>
        <h1 className="mt-3 text-lg font-extrabold">Admin Login</h1>
        <p className="mt-1 text-xs text-ink-soft">
          Admin panel sirf malik ke account se khulta hai
        </p>
      </header>

      <form onSubmit={submit} className="rise space-y-2.5 [animation-delay:60ms]">
        <input
          className={inputCls}
          type="email"
          placeholder="Admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className={inputCls}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Ruko..." : "Login"}
        </button>
      </form>

      <Link to="/" className="rise block text-center text-[11px] font-bold text-lav">
        ← Home
      </Link>
    </AppShell>
  );
}
