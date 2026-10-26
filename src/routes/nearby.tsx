import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, SectionTitle } from "@/components/AppShell";
import { distanceKm } from "@/lib/data";
import { inr, useStore } from "@/lib/store";

export const Route = createFileRoute("/nearby")({
  head: () => ({ meta: [
    { title: "Paas ke Workers — Badre Electrician Service" },
    { name: "description", content: "Apne aaspaas ke available verified workers dekhein aur booking karein." },
    { property: "og:title", content: "Paas ke Workers" },
    { property: "og:description", content: "Nearby verified electrician, plumber aur AC workers." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: NearbyPage,
});

const RADII = [5, 10, 25, 0];

function NearbyPage() {
  const { services, workers } = useStore();
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [serviceId, setServiceId] = useState("all");
  const [radius, setRadius] = useState(10);

  const locate = () => {
    if (!navigator.geolocation) { toast.error("Location support nahi hai"); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition((p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setBusy(false); },
      () => { setBusy(false); toast.error("Location permission allow karein"); }, { enableHighAccuracy: true, timeout: 15000 });
  };

  const list = useMemo(() => workers
    .filter((w) => w.available && w.kyc === "verified" && (serviceId === "all" || w.serviceId === serviceId))
    .map((w) => ({ w, d: pos && w.lat != null && w.lng != null ? distanceKm(pos.lat, pos.lng, w.lat, w.lng) : null }))
    .filter((x) => !pos || radius === 0 || (x.d != null && x.d <= radius))
    .sort((a, b) => (a.d ?? 9999) - (b.d ?? 9999)), [workers, serviceId, pos, radius]);

  return <AppShell>
    <header className="rise flex items-center gap-3"><Link to="/" className="grid size-9 place-items-center rounded-full bg-glass/70 ring-1 ring-white/60">←</Link><h1 className="text-lg font-extrabold">📍 Paas ke workers</h1></header>
    <section className="rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60">
      <button onClick={locate} disabled={busy} className="w-full rounded-2xl bg-ink py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Location le rahe hain..." : pos ? "Location dobara lein" : "Meri location use karein"}</button>
      {pos ? <div className="mt-3 grid grid-cols-4 gap-2">{RADII.map((r) => <button key={r} onClick={() => setRadius(r)} className={`rounded-2xl py-2 text-xs font-bold ${radius === r ? "bg-volt text-white" : "bg-glass/75 ring-1 ring-white/60"}`}>{r === 0 ? "Sab" : `${r} km`}</button>)}</div> : <p className="mt-2 text-center text-[11px] text-ink-soft">Location dene par sabse paas wale workers upar dikhenge.</p>}
    </section>
    <div className="flex gap-2 overflow-x-auto pb-1">{[{ id: "all", name: "Sab", icon: "✨" }, ...services.filter((s) => s.status === "active")].map((s) => <button key={s.id} onClick={() => setServiceId(s.id)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${serviceId === s.id ? "bg-ink text-white" : "bg-glass/75 ring-1 ring-white/60"}`}>{s.icon} {s.name}</button>)}</div>
    <section><SectionTitle tag={`${list.length} online`}>Available workers</SectionTitle><div className="space-y-2.5">
      {list.map(({ w, d }) => { const s = services.find((x) => x.id === w.serviceId); const bookable = s?.status === "active" && s.price != null; return <div key={w.id} className="flex items-center gap-3 rounded-3xl bg-glass/80 p-3 ring-1 ring-white/60">
        {w.img ? <img src={w.img} alt={w.name} className="size-14 shrink-0 rounded-2xl object-cover" /> : <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink font-display text-amber">{w.name.charAt(0).toUpperCase()}</div>}
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{w.name}</p><p className="text-[11px] text-ink-soft">{s?.icon} {s?.name} · {w.expYears} yrs{w.rating > 0 ? ` · ${w.rating} ★` : ""}</p><p className="text-[11px] font-semibold">{d != null ? `${d < 1 ? "1 km se kam" : `${d.toFixed(1)} km door`}` : "Doori pata nahi"}{w.area ? ` · ${w.area}` : ""}{s?.price != null ? ` · ${inr(s.price)}` : ""}</p></div>
        {bookable ? <Link to="/worker/$workerId" params={{ workerId: w.id }} className="rounded-full bg-volt px-4 py-2 text-xs font-bold text-white">Book</Link> : null}
      </div>; })}
      {list.length === 0 ? <p className="rounded-3xl bg-glass/70 p-4 text-center text-xs text-ink-soft ring-1 ring-white/60">{pos ? "Is doori mein abhi koi worker online nahi hai. Doori badhakar dekhein." : "Abhi koi verified worker online nahi hai."}</p> : null}
    </div></section>
  </AppShell>;
}
