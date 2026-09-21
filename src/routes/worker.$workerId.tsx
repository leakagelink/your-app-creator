import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, SectionTitle } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { inr, useStore } from "@/lib/store";

export const Route = createFileRoute("/worker/$workerId")({ head: () => ({ meta: [
  { title: "Worker Book Karein — Badre Electrician Service" }, { name: "description", content: "Verified worker ke saath service booking karein." },
  { property: "og:title", content: "Worker Booking" }, { property: "og:description", content: "Verified local worker booking." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
] }), component: WorkerBookingPage });

function isoDate(offset: number) { const date = new Date(); date.setDate(date.getDate() + offset); return date.toISOString().slice(0, 10); }
function dateLabel(offset: number) { return offset === 0 ? "Aaj" : offset === 1 ? "Kal" : new Intl.DateTimeFormat("hi-IN", { day: "numeric", month: "short" }).format(new Date(`${isoDate(offset)}T12:00:00`)); }

function WorkerBookingPage() {
  const { workerId } = Route.useParams(); const navigate = useNavigate();
  const { services, workers, addBooking } = useStore(); const { user } = useAuth();
  const worker = workers.find((item) => item.id === workerId); const service = services.find((item) => item.id === worker?.serviceId);
  const dates = useMemo(() => [0, 1, 2, 3].map((offset) => ({ value: isoDate(offset), label: dateLabel(offset) })), []);
  const [date, setDate] = useState(dates[0]?.value ?? ""); const [time, setTime] = useState("10:00 AM"); const [address, setAddress] = useState(""); const [booked, setBooked] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  if (!worker || !service) return <AppShell><p className="pt-10 text-center text-ink-soft">Worker nahi mila.</p></AppShell>;
  const bookable = worker.available && worker.kyc === "verified" && service.status === "active" && service.price != null && service.commission != null;
  const handleBook = async () => {
    if (!user) { toast.error("Booking ke liye login karein"); navigate({ to: "/auth" }); return; }
    if (address.trim().length < 5) { toast.error("Poora service address likhein"); return; }
    setBusy(true); const booking = await addBooking({ workerId: worker.id, date, time, address }); setBusy(false);
    if (!booking) { toast.error("Booking save nahi hui. Details check karein."); return; }
    setBooked(booking.id); toast.success("Booking database mein save ho gayi");
  };
  return <AppShell><header className="rise flex items-center gap-3"><Link to="/service/$serviceId" params={{ serviceId: service.id }} className="grid size-9 place-items-center rounded-full bg-glass/70 ring-1 ring-white/60">←</Link><h1 className="text-lg font-extrabold">Booking karein</h1></header>
    <section className="rise flex items-center gap-3 rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60">{worker.img ? <img src={worker.img} alt={worker.name} className="size-16 rounded-2xl object-cover" /> : <div className="grid size-16 place-items-center rounded-2xl bg-ink font-display text-2xl text-amber">{worker.name.charAt(0).toUpperCase()}</div>}<div><p className="text-base font-bold">{worker.name}</p><p className="text-xs text-ink-soft">{worker.role} · {worker.expYears} yrs{worker.rating > 0 ? ` · ${worker.rating} ★` : ""}</p><p className="text-[11px] text-volt">✓ KYC verified</p></div></section>
    {!booked ? <><section className="rise"><SectionTitle>Kab?</SectionTitle><div className="grid grid-cols-4 gap-2">{dates.map((item) => <button key={item.value} onClick={() => setDate(item.value)} className={`rounded-2xl py-2.5 text-xs font-bold ${date === item.value ? "bg-ink text-white" : "bg-glass/75 ring-1 ring-white/60"}`}>{item.label}</button>)}</div><div className="mt-2 grid grid-cols-2 gap-2">{["10:00 AM", "12:00 PM", "3:00 PM", "6:00 PM"].map((item) => <button key={item} onClick={() => setTime(item)} className={`rounded-2xl py-2.5 text-xs font-bold ${time === item ? "bg-volt text-white" : "bg-glass/75 ring-1 ring-white/60"}`}>{item}</button>)}</div></section>
      <section><SectionTitle>Service address</SectionTitle><textarea value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Ghar / flat, gali, area aur city" rows={3} className="w-full resize-none rounded-2xl bg-glass/75 px-4 py-3 text-sm ring-1 ring-white/60 outline-none" /></section>
      <section className="rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60"><SectionTitle>Price</SectionTitle>{service.price != null && service.commission != null ? <><div className="flex justify-between text-sm"><span>{service.name} visit</span><span className="font-mono font-bold">{inr(service.price)}</span></div><div className="mt-1 flex justify-between text-xs text-ink-soft"><span>Commission</span><span>{inr(service.commission)}</span></div></> : <p className="text-xs text-ink-soft">Price configured nahi hai.</p>}<button onClick={handleBook} disabled={!bookable || busy} className="mt-4 w-full rounded-2xl bg-ink py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Save ho raha hai..." : service.price != null ? `Booking confirm · ${inr(service.price)}` : "Booking unavailable"}</button></section></> : <section className="rounded-3xl bg-glass/80 p-5 text-center ring-1 ring-white/60"><div className="mx-auto grid size-14 place-items-center rounded-full bg-volt text-2xl text-white">✓</div><h2 className="mt-3 text-lg font-extrabold">Booking ho gayi</h2><p className="mt-1 text-sm text-ink-soft">{booked} · payment pending</p><div className="mt-4 rounded-2xl bg-amber/10 p-3 text-xs text-ink-soft">Online payment gateway abhi connected nahi hai. App payment ko paid mark nahi karega.</div><button onClick={() => navigate({ to: "/bookings" })} className="mt-4 w-full rounded-2xl bg-ink py-3 text-sm font-bold text-white">Meri bookings dekhein</button></section>}
  </AppShell>;
}