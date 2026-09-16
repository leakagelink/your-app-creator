import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Naya password — Badre Electrician Service" },
      { name: "description", content: "Apna naya password set karein." },
      { property: "og:title", content: "Naya password set karein" },
      { property: "og:description", content: "Password reset karein." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password kam se kam 6 akshar ka ho");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password badal gaya");
      navigate({ to: "/", replace: true });
    }
  };

  return (
    <AppShell>
      <h1 className="rise text-lg font-extrabold">Naya password</h1>
      <form onSubmit={save} className="rise space-y-2.5 [animation-delay:60ms]">
        <input
          type="password"
          className="w-full rounded-2xl bg-white/80 px-4 py-3 text-sm ring-1 ring-white/60 outline-none focus:ring-2 focus:ring-lav/40"
          placeholder="Naya password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? "Ruko..." : "Password save karein"}
        </button>
      </form>
    </AppShell>
  );
}
