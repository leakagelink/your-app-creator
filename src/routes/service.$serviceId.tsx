import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, SectionTitle } from "@/components/AppShell";
import { inr, useStore } from "@/lib/store";

export const Route = createFileRoute("/service/$serviceId")({ head: () => ({ meta: [
  { title: "Available Workers — Badre Electrician Service" }, { name: "description", content: "Is service ke verified workers dekhein." },
  { property: "og:title", content: "Available Workers" }, { property: "og:description", content: "Verified worker availability." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] }), component: ServiceWorkersPage });

function Avatar({ name, image, small = false }: { name: string; image: string | null; small?: boolean }) { const size = small ? "size-10 rounded-xl" : "size-14 rounded-2xl"; return image ? <img src={image} alt={name} className={`${size} shrink-0 object-cover`} /> : <div className={`grid ${size} shrink-0 place-items-center bg-ink font-display text-amber`}>{name.charAt(0).toUpperCase()}</div>; }
function ServiceWorkersPage() {
  const { serviceId } = Route.useParams(); const { services, workers } = useStore(); const service = services.find((item) => item.id === serviceId);
  if (!service) return <AppShell><p className="pt-10 text-center text-ink-soft">Service nahi mili.</p><Link to="/services" className="block text-center text-sm font-bold text-volt">Saari services dekhein →</Link></AppShell>;
  const bookable = service.status === "active" && service.price != null && service.commission != null;
  const list = workers.filter((worker) => worker.serviceId === service.id && worker.kyc === "verified"); const available = list.filter((worker) => worker.available); const offline = list.filter((worker) => !worker.available);
  return <AppShell><header className="rise flex items-center gap-3"><Link to="/services" className="grid size-9 place-items-center rounded-full bg-glass/70 ring-1 ring-white/60">←</Link><div><h1 className="font-display text-xl">{service.icon} {service.name}</h1><p className="text-[11px] text-ink-soft">{bookable ? `${inr(service.price as number)} / visit` : "Coming soon — booking band hai"}</p></div></header>
    {!bookable ? <section className="rounded-3xl bg-amber/10 p-4 text-center text-xs text-ink-soft ring-1 ring-amber/20">Admin price aur commission set karega, tab booking shuru hogi.</section> : null}
    <section className="rise"><SectionTitle tag={`${available.length} online`}>Available workers</SectionTitle><div className="space-y-2.5">{available.map((worker) => <div key={worker.id} className="flex items-center gap-3 rounded-3xl bg-glass/80 p-3 ring-1 ring-white/60"><Avatar name={worker.name} image={worker.img} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{worker.name}</p><p className="text-[11px] text-ink-soft">{worker.expYears} yrs · {worker.jobsDone} jobs{worker.rating > 0 ? ` · ${worker.rating} ★` : ""}</p></div>{bookable ? <Link to="/worker/$workerId" params={{ workerId: worker.id }} className="rounded-full bg-volt px-4 py-2 text-xs font-bold text-white">Book</Link> : null}</div>)}{available.length === 0 ? <p className="rounded-3xl bg-glass/70 p-4 text-center text-xs text-ink-soft ring-1 ring-white/60">Abhi koi verified worker online nahi hai.</p> : null}</div></section>
    {offline.length > 0 ? <section><SectionTitle>Offline</SectionTitle><div className="space-y-2">{offline.map((worker) => <div key={worker.id} className="flex items-center gap-3 rounded-2xl bg-glass/60 p-3"><Avatar name={worker.name} image={worker.img} small /><p className="flex-1 truncate text-xs font-bold text-ink-soft">{worker.name}</p><span className="text-[10px] text-ink-soft">Offline</span></div>)}</div></section> : null}
  </AppShell>;
}