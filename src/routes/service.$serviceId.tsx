import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, SectionTitle } from "@/components/AppShell";
import { services } from "@/lib/data";
import { inr, useStore } from "@/lib/store";

export const Route = createFileRoute("/service/$serviceId")({
  head: () => ({
    meta: [
      { title: "Service ke Workers — Badre Electrician Service" },
      {
        name: "description",
        content: "Is service ke available workers dekhein aur book karein.",
      },
      { property: "og:title", content: "Service ke Workers" },
      { property: "og:description", content: "Available workers aur price." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ServiceWorkersPage,
});

function ServiceWorkersPage() {
  const { serviceId } = Route.useParams();
  const { workers, commissions } = useStore();
  const service = services.find((s) => s.id === serviceId);

  if (!service) {
    return (
      <AppShell>
        <p className="pt-10 text-center text-ink-soft">Service nahi mili.</p>
        <Link to="/services" className="block text-center text-sm font-bold text-volt">
          Saari services dekhein →
        </Link>
      </AppShell>
    );
  }

  const list = workers.filter((w) => w.serviceId === service.id);
  const available = list.filter((w) => w.available);
  const offline = list.filter((w) => !w.available);

  return (
    <AppShell>
      <header className="rise flex items-center gap-3">
        <Link
          to="/services"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-glass/70 ring-1 ring-white/60 backdrop-blur-md"
          aria-label="Wapas"
        >
          ←
        </Link>
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl tracking-tight">
            {service.icon} {service.name}
          </h1>
          <p className="text-[11px] text-ink-soft">
            {inr(service.price)} / visit · commission{" "}
            {inr(commissions[service.id] ?? service.commission)}
          </p>
        </div>
      </header>

      <section className="rise [animation-delay:60ms]">
        <SectionTitle tag={`${available.length} online`}>Available workers</SectionTitle>
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
                className="size-14 shrink-0 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-bold">{w.name}</p>
                  <span className="shrink-0 rounded-full bg-volt/15 px-1.5 py-0.5 text-[10px] font-bold text-volt">
                    {w.rating} ★
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft">
                  {w.expYears} yrs · {w.jobsDone} kaam · {w.distanceKm} km
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
          {available.length === 0 && (
            <p className="rounded-3xl bg-glass/70 p-4 text-center text-xs text-ink-soft ring-1 ring-white/60">
              Abhi koi worker online nahi hai — thodi der baad dekhein.
            </p>
          )}
        </div>
      </section>

      {offline.length > 0 && (
        <section className="rise [animation-delay:120ms]">
          <SectionTitle>Abhi offline</SectionTitle>
          <div className="space-y-2">
            {offline.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-3 rounded-2xl bg-glass/60 p-3 ring-1 ring-white/50"
              >
                <img
                  src={w.img}
                  alt={w.name}
                  loading="lazy"
                  width={40}
                  height={40}
                  className="size-10 shrink-0 rounded-xl object-cover opacity-60"
                />
                <p className="min-w-0 flex-1 truncate text-xs font-bold text-ink-soft">
                  {w.name}
                </p>
                <span className="shrink-0 text-[10px] font-bold text-ink-soft">Offline</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
