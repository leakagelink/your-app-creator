import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, SectionTitle } from "@/components/AppShell";
import { services } from "@/lib/data";
import { inr, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Badre Electrician Service — Ghar ka kaam, abhi" },
      {
        name: "description",
        content:
          "Electrician, Plumber, AC Mechanic aur aur bhi — trusted local workers ko book karein. Online payment, live status, rewards.",
      },
      { property: "og:title", content: "Badre Electrician Service" },
      {
        property: "og:description",
        content: "Ghar ke liye trusted service — 30 min mein local expert.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

const tintClasses: Record<string, string> = {
  amber: "bg-amber/15",
  lav: "bg-lav/15",
  volt: "bg-volt/15",
};

function HomePage() {
  const { workers, commissionWallet } = useStore();
  const available = workers.filter((w) => w.available);

  return (
    <AppShell>
      {/* header */}
      <header className="rise flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-ink font-display text-xl text-amber shadow-sm">
            B
          </div>
          <div>
            <p className="text-[11px] font-medium text-ink-soft">Namaste,</p>
            <p className="text-base leading-none font-extrabold">Rohan Kumar</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-glass/70 px-3 py-2 text-xs font-semibold ring-1 ring-white/60 backdrop-blur-md">
            <span className="text-ink-soft">📍 Pune</span>{" "}
            <span className="text-ink">·</span>{" "}
            <span className="text-volt">Home</span>
          </div>
        </div>
      </header>

      {/* savings banner */}
      <section className="rise flex items-center justify-between rounded-3xl bg-ink px-4 py-3 text-white shadow-md [animation-delay:60ms]">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">⚡</span>
          <div>
            <p className="text-[11px] text-white/60">Badre Electrician Service</p>
            <p className="text-sm font-bold">Ghar ka kaam, abhi.</p>
          </div>
        </div>
        <span className="rounded-full bg-volt/20 px-2.5 py-1 text-[11px] font-semibold text-volt">
          Live
        </span>
      </section>

      {/* hero */}
      <div className="rise flex items-end justify-between [animation-delay:120ms]">
        <div>
          <h1 className="font-display text-[2rem] leading-[0.95] tracking-tight">
            Ghar ka
            <br />
            kaam, abhi.
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Trusted local experts — 30 min mein.
          </p>
        </div>
        <span className="mb-1 rounded-full bg-glass/70 px-3 py-1 text-[11px] font-semibold text-ink ring-1 ring-white/60 backdrop-blur-md">
          4.9 ★
        </span>
      </div>

      {/* services */}
      <section className="rise [animation-delay:180ms]">
        <SectionTitle>Kya chahiye aaj?</SectionTitle>
        <div className="grid grid-cols-4 gap-2.5">
          {services.map((s) => (
            <Link
              key={s.id}
              to="/service/$serviceId"
              params={{ serviceId: s.id }}
              className="rounded-2xl bg-glass/75 p-3 text-center ring-1 ring-white/60 backdrop-blur-md transition active:scale-95"
            >
              <div
                className={`mx-auto mb-1.5 grid size-10 place-items-center rounded-xl text-lg ${tintClasses[s.tint]}`}
              >
                {s.icon}
              </div>
              <p className="text-[11px] leading-tight font-semibold">{s.name}</p>
            </Link>
          ))}
          <Link
            to="/services"
            className="rounded-2xl bg-ink p-3 text-center text-white transition active:scale-95"
          >
            <div className="mx-auto mb-1.5 grid size-10 place-items-center rounded-xl bg-white/10 text-lg">
              ➕
            </div>
            <p className="text-[11px] leading-tight font-semibold">Sab dekho</p>
          </Link>
        </div>
      </section>

      {/* workers */}
      <section className="rise [animation-delay:240ms]">
        <SectionTitle>Paas ke available workers</SectionTitle>
        <div className="space-y-2.5">
          {available.map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-3 rounded-3xl bg-glass/80 p-3 ring-1 ring-white/60 backdrop-blur-md"
            >
              <img
                src={w.img}
                alt={w.name}
                loading="lazy"
                width={56}
                height={56}
                className="size-14 shrink-0 rounded-2xl object-cover outline-1 -outline-offset-1 outline-black/5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-bold">{w.name}</p>
                  <span className="rounded-full bg-volt/15 px-1.5 py-0.5 text-[10px] font-bold text-volt">
                    {w.rating} ★
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft">
                  {w.role} · {w.expYears} yrs · {w.distanceKm} km
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-ink">
                  {inr(services.find((s) => s.id === w.serviceId)?.price ?? 500)}{" "}
                  <span className="font-normal text-ink-soft">/ visit</span>
                </p>
              </div>
              <Link
                to="/worker/$workerId"
                params={{ workerId: w.id }}
                className="shrink-0 rounded-full bg-volt px-4 py-2 text-xs font-bold text-white transition active:scale-95"
              >
                Book
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* wallet preview */}
      <section className="rise rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60 backdrop-blur-md [animation-delay:300ms]">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">Aapka wallet</h2>
          <span className="rounded-full bg-volt/15 px-2 py-0.5 text-[10px] font-bold text-volt">
            {inr(commissionWallet.available)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-ink/5 p-2.5">
            <p className="text-[10px] text-ink-soft">Aap pay karo</p>
            <p className="mt-0.5 font-mono text-base font-semibold">₹500</p>
          </div>
          <div className="rounded-2xl bg-amber/10 p-2.5">
            <p className="text-[10px] text-ink-soft">Commission</p>
            <p className="mt-0.5 font-mono text-base font-semibold">₹20</p>
          </div>
          <div className="rounded-2xl bg-volt/10 p-2.5">
            <p className="text-[10px] text-ink-soft">Worker ko</p>
            <p className="mt-0.5 font-mono text-base font-semibold">₹480</p>
          </div>
        </div>
        <Link
          to="/wallet"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3 text-sm font-bold text-white transition active:scale-[0.98]"
        >
          <span className="pop text-volt">✓</span> Wallet kholein
        </Link>
      </section>
    </AppShell>
  );
}
