import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, SectionTitle } from "@/components/AppShell";
import { services } from "@/lib/data";
import { inr, useStore } from "@/lib/store";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Saari Services — Badre Electrician Service" },
      {
        name: "description",
        content:
          "Electrician, Plumber, AC, Carpenter, Painter, Cleaning aur Locksmith — sabhi services ek jagah.",
      },
      { property: "og:title", content: "Saari Services" },
      { property: "og:description", content: "Ghar ke kaam ki sabhi services." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ServicesPage,
});

const tintClasses: Record<string, string> = {
  amber: "bg-amber/15",
  lav: "bg-lav/15",
  volt: "bg-volt/15",
};

function ServicesPage() {
  const { workers, commissions } = useStore();

  return (
    <AppShell>
      <header className="rise flex items-center gap-3">
        <Link
          to="/"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-glass/70 ring-1 ring-white/60 backdrop-blur-md"
          aria-label="Wapas"
        >
          ←
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-xl tracking-tight">Saari services</h1>
          <p className="text-[11px] text-ink-soft">Service chunein aur worker book karein</p>
        </div>
      </header>

      <section className="rise [animation-delay:60ms]">
        <SectionTitle tag={`${services.length} services`}>Services</SectionTitle>
        <div className="space-y-2.5">
          {services.map((s) => {
            const count = workers.filter(
              (w) => w.serviceId === s.id && w.available,
            ).length;
            return (
              <Link
                key={s.id}
                to="/service/$serviceId"
                params={{ serviceId: s.id }}
                className="flex items-center gap-3 rounded-3xl bg-glass/80 p-3.5 ring-1 ring-white/60 backdrop-blur-md transition active:scale-[0.98]"
              >
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-2xl text-lg ${tintClasses[s.tint]}`}
                >
                  {s.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{s.name}</p>
                  <p className="text-[11px] text-ink-soft">
                    {inr(s.price)} / visit · commission {inr(commissions[s.id] ?? s.commission)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-volt/15 px-2.5 py-1 text-[10px] font-bold text-volt">
                  {count} available
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
