import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

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
  const [accountType, setAccountType] = useState<"user" | "worker">("user");
  const [serviceId, setServiceId] = useState("");
  const [exp, setExp] = useState("");
  const { services } = useStore();

  useEffect(() => {
    if (!loading && session) navigate({ to: isWorker ? "/worker-panel" : "/", replace: true });
  }, [loading, session, isWorker, navigate]);

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
    if (mode === "signup" && accountType === "worker" && (!serviceId || !phone.trim() || !city.trim())) {
      toast.error("Worker ke liye service, mobile aur sheher zaroori hai");
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
              account_type: accountType,
              ...(accountType === "worker" ? { service_id: serviceId, exp_years: exp || "0" } : {}),
            },
          },
        });
        if (error) throw error;
        toast.success(accountType === "worker" ? "Worker account ban gaya — KYC verification pending" : "Account ban gaya — welcome!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success("Login ho gaya");
      }
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
        <Logo className="mx-auto size-14" />
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
            <div className="grid grid-cols-2 gap-2">
              {(["user", "worker"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setAccountType(t)}
                  className={`rounded-2xl px-3 py-3 text-xs font-bold ring-1 transition ${accountType === t ? "bg-ink text-white ring-ink" : "bg-white/80 text-ink ring-white/60"}`}
                >
                  {t === "user" ? "🏠 Customer\nService lena hai" : "👷 Worker\nService dena hai"}
                </button>
              ))}
            </div>
            <input
              className={inputCls}
              placeholder="Poora naam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
            <input
              className={inputCls}
              placeholder={accountType === "worker" ? "Mobile number" : "Mobile number (optional)"}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
            />
            <input
              className={inputCls}
              placeholder={accountType === "worker" ? "Sheher" : "Sheher (optional)"}
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            {accountType === "worker" && (
              <>
                <select
                  className={inputCls}
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                >
                  <option value="">Aap kaunsi service denge?</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.icon} {s.name}
                    </option>
                  ))}
                </select>
                <input
                  className={inputCls}
                  placeholder="Kitne saal ka anubhav? (jaise 3)"
                  value={exp}
                  onChange={(e) => setExp(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                />
                <p className="text-[11px] text-ink-soft">
                  Worker account admin ke KYC verify karne ke baad customers ko dikhega.
                </p>
              </>
            )}
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
