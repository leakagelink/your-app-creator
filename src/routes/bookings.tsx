import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { services, statusLabels } from "@/lib/data";
import { inr, useStore } from "@/lib/store";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title: "Meri Bookings — Badre Electrician Service" },
      { name: "description", content: "Apni saari bookings aur unka status dekhein." },
      { property: "og:title", content: "Meri Bookings" },
      { property: "og:description", content: "Booking status aur history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookingsPage,
});

const statusColor: Record<string, string> = {
  pending: "bg-amber/15 text-amber",
  accepted: "bg-lav/15 text-lav",
  in_progress: "bg-lav/15 text-lav",
  completed: "bg-volt/15 text-volt",
  cancelled: "bg-red/15 text-red",
};

function BookingsPage() {
  const { bookings, workers, cancelBooking, payBooking, rateBooking, ratings } =
    useStore();
  const [rateFor, setRateFor] = useState<string | null>(null);

  return (
    <AppShell>
      <header className="rise">
        <h1 className="font-display text-2xl tracking-tight">Meri bookings</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {bookings.length} bookings · status live
        </p>
      </header>

      <div className="space-y-2.5">
        {bookings.map((b, i) => {
          const worker = workers.find((w) => w.id === b.workerId);
          const service = services.find((s) => s.id === b.serviceId);
          return (
            <div
              key={b.id}
              className="rise rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60 backdrop-blur-md"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{service?.icon}</span>
                  <div>
                    <p className="text-sm font-bold">{service?.name}</p>
                    <p className="text-[11px] text-ink-soft">
                      {b.id} · {b.date}, {b.time}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColor[b.status]}`}
                >
                  {statusLabels[b.status]}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-ink/5 p-2.5">
                {worker && (
                  <img
                    src={worker.img}
                    alt={worker.name}
                    loading="lazy"
                    width={36}
                    height={36}
                    className="size-9 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{worker?.name}</p>
                  <p className="text-[10px] text-ink-soft">{b.address}</p>
                </div>
                <p className="font-mono text-sm font-bold">{inr(b.amount)}</p>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-ink-soft">
                  {b.payment === "paid"
                    ? "✅ Payment ho gaya"
                    : b.payment === "refunded"
                      ? "↩️ Refunded"
                      : "⏳ Payment pending"}
                </span>
                <div className="flex gap-2">
                  {b.payment === "unpaid" && b.status !== "cancelled" && (
                    <button
                      onClick={() => {
                        payBooking(b.id);
                        toast.success(`Payment ho gaya · ${inr(b.amount)}`, {
                          description: "🎁 +10 reward points mile!",
                        });
                      }}
                      className="rounded-full bg-volt px-3 py-1.5 text-[11px] font-bold text-white active:scale-95"
                    >
                      Pay karein
                    </button>
                  )}
                  {(b.status === "pending" || b.status === "accepted") && (
                    <button
                      onClick={() => {
                        cancelBooking(b.id);
                        toast("Booking cancel ho gayi", {
                          description:
                            b.payment === "paid"
                              ? "Paise refund kar diye gaye."
                              : "Koi charge nahi laga.",
                        });
                      }}
                      className="rounded-full bg-red/10 px-3 py-1.5 text-[11px] font-bold text-red active:scale-95"
                    >
                      Cancel
                    </button>
                  )}
                  {b.status === "completed" &&
                    (ratings[b.id] ? (
                      <span className="rounded-full bg-amber/15 px-3 py-1.5 text-[11px] font-bold text-amber">
                        {"★".repeat(ratings[b.id]!)} diya
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          setRateFor(rateFor === b.id ? null : b.id)
                        }
                        className="rounded-full bg-amber/15 px-3 py-1.5 text-[11px] font-bold text-amber active:scale-95"
                      >
                        ★ Rating dein
                      </button>
                    ))}
                </div>
              </div>

              {rateFor === b.id && !ratings[b.id] && (
                <div className="mt-3 rounded-2xl bg-amber/10 p-3 text-center">
                  <p className="text-[11px] font-bold text-ink-soft">
                    {worker?.name} ka kaam kaisa laga?
                  </p>
                  <div className="mt-2 flex justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          rateBooking(b.id, n);
                          setRateFor(null);
                          toast.success(`Shukriya! ${n} star rating mil gayi`);
                        }}
                        aria-label={`${n} star`}
                        className="grid size-9 place-items-center rounded-xl bg-glass text-lg ring-1 ring-white/60 active:scale-90"
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {bookings.length === 0 && (
          <p className="pt-10 text-center text-sm text-ink-soft">
            Abhi koi booking nahi hai.
          </p>
        )}
      </div>
    </AppShell>
  );
}
