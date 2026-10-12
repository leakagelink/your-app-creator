import { createFileRoute, Link } from "@tanstack/react-router";
import { PolicyLinks } from "@/components/LegalPage";
import { ApkDownloadBanner } from "@/components/ApkDownload";
import { AppShell, SectionTitle } from "@/components/AppShell";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { inr, useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Badre Electrician Service — होम सर्विस" },
    { name: "description", content: "Real local home-service workers ko online book karein." },
    { property: "og:title", content: "Badre Electrician Service" },
    { property: "og:description", content: "Real local home-service workers ko book karein." },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: "Badre Electrician Service" },
    { property: "og:image", content: "https://badreelectricianservice.online/og-badre.jpg" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:image", content: "https://badreelectricianservice.online/og-badre.jpg" },
  ] }),
  component: HomePage,
});

const tintClasses = { amber: "bg-amber/15", lav: "bg-lav/15", volt: "bg-volt/15" } as const;

function WorkerAvatar({ name, image }: { name: string; image: string | null }) {
  return image ? <img src={image} alt={name} className="size-14 shrink-0 rounded-2xl object-cover" /> : <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink font-display text-xl text-amber">{name.charAt(0).toUpperCase()}</div>;
}

function HomePage() {
  const { services, workers, rewardPoints, loading, error } = useStore();
  const { profile, user } = useAuth();
  const available = workers.filter((w) => w.available && w.kyc === "verified");
  const displayName = profile?.full_name || user?.email?.split("@")[0];
  return <AppShell>
    <header className="rise flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3"><Logo className="size-11" /><div className="min-w-0"><p className="text-[11px] text-ink-soft">Namaste{displayName ? "," : ""}</p><p className="truncate text-base font-extrabold">{displayName || "Badre Electrician Service"}</p></div></div>
      {profile?.city ? <span className="shrink-0 rounded-full bg-glass/70 px-3 py-2 text-xs font-semibold text-ink-soft ring-1 ring-white/60">📍 {profile.city}</span> : null}
    </header>
    <ApkDownloadBanner />
    <section className="rise flex items-center justify-between rounded-3xl bg-ink px-4 py-3 text-white shadow-md"><div><p className="text-[11px] text-white/60">Badre Electrician Service</p><p className="text-sm font-bold">होम सर्विस</p></div><span className="rounded-full bg-volt/20 px-2.5 py-1 text-[11px] font-semibold text-volt">Live</span></section>
    <div className="rise"><h1 className="font-display text-[2rem] leading-none">होम सर्विस</h1><p className="mt-1.5 text-sm text-ink-soft">Database mein registered local workers.</p></div>
    {error ? <p className="rounded-2xl bg-red/10 p-3 text-xs font-semibold text-red">Live data load nahi hua. Dobara kholein.</p> : null}
    <section className="rise"><SectionTitle>Kya chahiye aaj?</SectionTitle><div className="grid grid-cols-4 gap-2.5">
      {services.slice(0, 7).map((service) => <Link key={service.id} to="/service/$serviceId" params={{ serviceId: service.id }} className="rounded-2xl bg-glass/75 p-3 text-center ring-1 ring-white/60"><div className={`mx-auto mb-1.5 grid size-10 place-items-center rounded-xl text-lg ${tintClasses[service.tint]}`}>{service.icon}</div><p className="text-[11px] leading-tight font-semibold">{service.name}</p></Link>)}
      <Link to="/services" className="rounded-2xl bg-ink p-3 text-center text-white"><div className="mx-auto mb-1.5 grid size-10 place-items-center rounded-xl bg-white/10 text-lg">＋</div><p className="text-[11px] font-semibold">Sab dekho</p></Link>
    </div></section>
    <section className="rise"><SectionTitle>Available workers</SectionTitle><div className="space-y-2.5">
      {available.map((worker) => { const service = services.find((item) => item.id === worker.serviceId); return <div key={worker.id} className="flex items-center gap-3 rounded-3xl bg-glass/80 p-3 ring-1 ring-white/60"><WorkerAvatar name={worker.name} image={worker.img} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{worker.name}</p><p className="text-[11px] text-ink-soft">{worker.role} · {worker.expYears} yrs{worker.rating > 0 ? ` · ${worker.rating} ★` : ""}</p>{service?.price != null ? <p className="mt-0.5 text-[11px] font-semibold">{inr(service.price)} / visit</p> : null}</div><Link to="/worker/$workerId" params={{ workerId: worker.id }} className="rounded-full bg-volt px-4 py-2 text-xs font-bold text-white">Book</Link></div>; })}
      {!loading && available.length === 0 ? <p className="rounded-3xl bg-glass/70 p-4 text-center text-xs text-ink-soft ring-1 ring-white/60">Abhi koi verified worker available nahi hai.</p> : null}
    </div></section>
    {user ? <section className="rise rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60"><div className="flex items-center justify-between"><div><p className="text-sm font-bold">Aapke rewards</p><p className="text-[11px] text-ink-soft">Sirf verified payments par milte hain</p></div><span className="rounded-full bg-volt/15 px-2.5 py-1 text-xs font-bold text-volt">{rewardPoints} points</span></div></section> : null}
  <PolicyLinks /></AppShell>;
}