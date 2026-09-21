import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, SectionTitle } from "@/components/AppShell";
import { inr, useStore } from "@/lib/store";

export const Route = createFileRoute("/services")({ head: () => ({ meta: [
  { title: "Services — Badre Electrician Service" }, { name: "description", content: "Available aur coming-soon home services." },
  { property: "og:title", content: "Home Services" }, { property: "og:description", content: "Live service availability aur pricing." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] }), component: ServicesPage });

const tintClasses = { amber: "bg-amber/15", lav: "bg-lav/15", volt: "bg-volt/15" } as const;
function ServicesPage() {
  const { services, workers, loading } = useStore();
  return <AppShell><header className="rise flex items-center gap-3"><Link to="/" className="grid size-9 place-items-center rounded-full bg-glass/70 ring-1 ring-white/60">←</Link><div><h1 className="font-display text-xl">Saari services</h1><p className="text-[11px] text-ink-soft">Live database se</p></div></header>
    <section className="rise"><SectionTitle tag={`${services.length} services`}>Services</SectionTitle><div className="space-y-2.5">{services.map((service) => { const count = workers.filter((w) => w.serviceId === service.id && w.available && w.kyc === "verified").length; const active = service.status === "active" && service.price != null; return <Link key={service.id} to="/service/$serviceId" params={{ serviceId: service.id }} className="flex items-center gap-3 rounded-3xl bg-glass/80 p-3.5 ring-1 ring-white/60"><span className={`grid size-11 place-items-center rounded-2xl text-lg ${tintClasses[service.tint]}`}>{service.icon}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold">{service.name}</p><p className="text-[11px] text-ink-soft">{active ? `${inr(service.price as number)} / visit` : "Coming soon — price abhi set nahi"}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${active ? "bg-volt/15 text-volt" : "bg-amber/15 text-amber"}`}>{active ? `${count} available` : "Soon"}</span></Link>; })}{!loading && services.length === 0 ? <p className="text-center text-sm text-ink-soft">Abhi koi service configured nahi hai.</p> : null}</div></section>
  </AppShell>;
}