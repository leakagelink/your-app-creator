import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Login / Account banayein — Badre Electrician Service" },
      {
        name: "description",
        content:
          "Email aur password se account banayein ya login karein — booking, payment aur rewards ke liye.",
      },
      { property: "og:title", content: "Login — Badre Electrician Service" },
      {
        property: "og:description",
        content: "Email se account banayein ya login karein.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const inputCls =
  "w-full rounded-2xl bg-white/80 px-4 py-3 text-sm ring-1 ring-white/60 outline-none placeholder:text-ink-soft/70 focus:ring-2 focus:ring-lav/40";

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/", replace: true });
  }, [loading, session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Email aur password dono bharein");
      return;
    }
    if (mode === "signup" && !name.trim()) {
      toast.error("Apna naam likhein");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: name.trim(),
              phone: phone.trim(),
              city: city.trim(),
            },
          },
        });
        if (error) throw error;
        toast.success("Account ban gaya — welcome!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Login ho gaya");
      }
      navigate({ to: "/", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Kuch galat ho gaya";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      toast.error("Pehle apna email likhein");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset link email par bhej diya");
  };

  return (
    <AppShell>
      <header className="rise text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-ink font-display text-2xl text-amber">
          B
        </div>
        <h1 className="mt-3 text-lg font-extrabold">
          {mode === "login" ? "Login karein" : "Naya account banayein"}
        </h1>
        <p className="mt-1 text-xs text-ink-soft">
          Email aur password se — mobile OTP ki zaroorat nahi
        </p>
      </header>

      <form onSubmit={submit} className="rise space-y-2.5 [animation-delay:60ms]">
        {mode === "signup" && (
          <>
            <input
              className={inputCls}
              placeholder="Poora naam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            <input
              className={inputCls}
              placeholder="Mobile number (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
            />
            <input
              className={inputCls}
              placeholder="Sheher (optional)"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </>
        )}
        <input
          className={inputCls}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          className={inputCls}
          type="password"
          placeholder="Password (kam se kam 6 akshar)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {busy
            ? "Ruko..."
            : mode === "login"
              ? "Login"
              : "Account banayein"}
        </button>
      </form>

      <div className="rise space-y-2 text-center [animation-delay:120ms]">
        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="text-xs font-bold text-lav"
        >
          {mode === "login"
            ? "Naya user hain? Account banayein"
            : "Pehle se account hai? Login karein"}
        </button>
        {mode === "login" && (
          <div>
            <button onClick={forgot} className="text-[11px] text-ink-soft underline">
              Password bhool gaye?
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
