import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, SectionTitle } from "@/components/AppShell";
import { services } from "@/lib/data";
import { inr, useStore } from "@/lib/store";

export const Route = createFileRoute("/worker/$workerId")({
  head: () => ({
    meta: [
      { title: "Worker Book Karein — Badre Electrician Service" },
      { name: "description", content: "Worker chunein, date-time select karein aur online pay karein." },
      { property: "og:title", content: "Worker Book Karein" },
      { property: "og:description", content: "Trusted local worker booking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkerBookingPage,
});

const dates = ["Aaj", "Kal", "18 Sep", "19 Sep"];
const times = ["10:00 AM", "12:00 PM", "3:00 PM", "6:00 PM"];

function WorkerBookingPage() {
  const { workerId } = Route.useParams();
  const navigate = useNavigate();
  const { workers, commissions, addBooking, payBooking } = useStore();
  const worker = workers.find((w) => w.id === workerId);
  const [date, setDate] = useState(dates[0]);
  const [time, setTime] = useState(times[0]);
  const [address, setAddress] = useState("");
  const [booked, setBooked] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  if (!worker) {
    return (
      <AppShell>
        <p className="pt-10 text-center text-ink-soft">Worker nahi mila.</p>
      </AppShell>
    );
  }

  const service = services.find((s) => s.id === worker.serviceId)!;
  const commission = commissions[service.id] ?? service.commission;
  const amount = service.price;

  const handleBook = () => {
    const b = addBooking({
      customerName: "Rohan Kumar",
      customerPhone: "98xxxxxx21",
      workerId: worker.id,
      serviceId: service.id,
      amount,
      commission,
      date,
      time,
      address: address || "Pune (GPS location)",
    });
    setBooked(b.id);
  };

  const handlePay = () => {
    if (booked) {
      payBooking(booked);
      setPaid(true);
    }
  };

  return (
    <AppShell>
      <header className="rise flex items-center gap-3">
        <Link
          to="/"
          className="grid size-9 place-items-center rounded-full bg-glass/70 ring-1 ring-white/60 backdrop-blur-md"
        >
          ←
        </Link>
        <h1 className="text-lg font-extrabold">Booking karein</h1>
      </header>

      {/* worker card */}
      <section className="rise flex items-center gap-3 rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60 backdrop-blur-md [animation-delay:60ms]">
        <img
          src={worker.img}
          alt={worker.name}
          width={64}
          height={64}
          className="size-16 rounded-2xl object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-base font-bold">{worker.name}</p>
            <span className="rounded-full bg-volt/15 px-1.5 py-0.5 text-[10px] font-bold text-volt">
              {worker.rating} ★
            </span>
          </div>
          <p className="text-xs text-ink-soft">
            {worker.role} · {worker.expYears} yrs exp · {worker.jobsDone} kaam
          </p>
          <p className="mt-0.5 text-[11px] text-ink-soft">
            {worker.kyc === "verified" ? "✅ KYC verified" : "⏳ KYC pending"} ·{" "}
            {worker.distanceKm} km door
          </p>
        </div>
      </section>

      {!booked ? (
        <>
          <section className="rise [animation-delay:120ms]">
            <SectionTitle>Kaab?</SectionTitle>
            <div className="grid grid-cols-4 gap-2">
              {dates.map((d) => (
                <button
                  key={d}
                  onClick={() => setDate(d)}
                  className={`rounded-2xl py-2.5 text-xs font-bold transition ${
                    date === d
                      ? "bg-ink text-white"
                      : "bg-glass/75 text-ink ring-1 ring-white/60"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {times.map((t) => (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className={`rounded-2xl py-2.5 text-[11px] font-bold transition ${
                    time === t
                      ? "bg-volt text-white"
                      : "bg-glass/75 text-ink ring-1 ring-white/60"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </section>

          <section className="rise [animation-delay:180ms]">
            <SectionTitle>Address</SectionTitle>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Flat / ghar ka pata likhein"
              className="w-full rounded-2xl bg-glass/75 px-4 py-3 text-sm ring-1 ring-white/60 backdrop-blur-md outline-none placeholder:text-ink-soft/60"
            />
            <p className="mt-1.5 text-[11px] text-ink-soft">
              📍 Khali chhoda to GPS location use hogi
            </p>
          </section>

          <section className="rise rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60 backdrop-blur-md [animation-delay:240ms]">
            <SectionTitle>Price estimate</SectionTitle>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-soft">{service.name} visit</span>
                <span className="font-mono font-semibold">{inr(amount)}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-ink-soft">Platform commission</span>
                <span className="font-mono text-ink-soft">{inr(commission)}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-ink-soft">Worker ko milega</span>
                <span className="font-mono text-ink-soft">
                  {inr(amount - commission)}
                </span>
              </div>
            </div>
            <button
              onClick={handleBook}
              className="mt-4 w-full rounded-2xl bg-ink py-3 text-sm font-bold text-white transition active:scale-[0.98]"
            >
              Booking confirm karein · {inr(amount)}
            </button>
          </section>
        </>
      ) : (
        <section className="rise rounded-3xl bg-glass/80 p-5 text-center ring-1 ring-white/60 backdrop-blur-md [animation-delay:120ms]">
          {paid ? (
            <>
              <div className="pop mx-auto grid size-14 place-items-center rounded-full bg-volt text-2xl text-white">
                ✓
              </div>
              <h2 className="mt-3 text-lg font-extrabold">Payment successful!</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Booking {booked} — {inr(amount)} pay ho gaya.
              </p>
              <p className="mt-1 text-xs text-ink-soft">
                🎁 +10 reward points mile!
              </p>
              <button
                onClick={() => navigate({ to: "/bookings" })}
                className="mt-4 w-full rounded-2xl bg-ink py-3 text-sm font-bold text-white transition active:scale-[0.98]"
              >
                Meri bookings dekhein
              </button>
            </>
          ) : (
            <>
              <div className="pop mx-auto grid size-14 place-items-center rounded-full bg-amber/20 text-2xl">
                📋
              </div>
              <h2 className="mt-3 text-lg font-extrabold">Booking ho gayi!</h2>
              <p className="mt-1 text-sm text-ink-soft">
                {booked} · {date}, {time} · {worker.name}
              </p>
              <div className="mt-4 rounded-2xl bg-ink/5 p-3 text-left text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-soft">Pay karna hai</span>
                  <span className="font-mono font-bold">{inr(amount)}</span>
                </div>
              </div>
              <button
                onClick={handlePay}
                className="mt-4 w-full rounded-2xl bg-volt py-3 text-sm font-bold text-white transition active:scale-[0.98]"
              >
                💳 UPI se pay karein · {inr(amount)}
              </button>
              <p className="mt-2 text-[11px] text-ink-soft">
                Payment aapke merchant account mein jayega
              </p>
            </>
          )}
        </section>
      )}
    </AppShell>
  );
}
