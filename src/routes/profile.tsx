import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
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
  const shareLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Is phone me location support nahi hai");
      return;
    }
    const id = toast.loading("Location le rahe hain...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const maps = `https://maps.google.com/?q=${latitude},${longitude}`;
        toast.success("Location mil gayi — WhatsApp par bhej rahe hain", { id });
        window.open(
          `https://wa.me/919999999999?text=${encodeURIComponent(
            `Meri location: ${maps}`,
          )}`,
          "_blank",
        );
      },
      () => toast.error("Location permission nahi mili", { id }),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <AppShell>
      <header className="rise flex items-center gap-3">
        <div className="grid size-14 place-items-center rounded-2xl bg-ink font-display text-2xl text-amber">
          R
        </div>
        <div>
          <h1 className="text-lg font-extrabold">Rohan Kumar</h1>
          <p className="text-xs text-ink-soft">📱 98xxxxxx21 · Pune</p>
        </div>
      </header>

      {/* demo login note */}
      <section className="rise rounded-3xl bg-lav/10 p-4 ring-1 ring-lav/20 [animation-delay:60ms]">
        <p className="text-xs font-bold text-lav">🔐 OTP Login (demo mode)</p>
        <p className="mt-1 text-[11px] text-ink-soft">
          Real mobile OTP login ke liye backend connect karna hoga — neeche
          "Backend connect" section dekhein.
        </p>
      </section>

      {/* role panels */}
      <section className="rise [animation-delay:120ms]">
        <SectionTitle>Panels</SectionTitle>
        <div className="space-y-2.5">
          <Link
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
          </Link>
          <Link
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
                  Commission wallet, bookings, users, KYC
                </p>
              </div>
            </div>
            <span className="text-amber">→</span>
          </Link>
        </div>
      </section>

      {/* help */}
      <section className="rise [animation-delay:180ms]">
        <SectionTitle>Support</SectionTitle>
        <div className="space-y-2.5">
          <a
            href="https://wa.me/919999999999"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60 backdrop-blur-md"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-volt/15 text-lg">
              💬
            </span>
            <div>
              <p className="text-sm font-bold">WhatsApp Support</p>
              <p className="text-[11px] text-ink-soft">Shikayat ya sawaal? Message karein</p>
            </div>
          </a>
          <button
            onClick={shareLocation}
            className="flex w-full items-center gap-3 rounded-3xl bg-glass/80 p-4 text-left ring-1 ring-white/60 backdrop-blur-md transition active:scale-[0.98]"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber/15 text-lg">
              📍
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold">Location bhejein</p>
              <p className="text-[11px] text-ink-soft">
                Worker ko apna GPS location share karein
              </p>
            </div>
          </button>
        </div>
      </section>

      <p className="rise pt-2 text-center font-mono text-[10px] text-ink-soft [animation-delay:240ms]">
        Badre Electrician Service · badreelectricianservice.online
      </p>
    </AppShell>
  );
}
