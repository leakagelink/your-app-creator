import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, SectionTitle } from "@/components/AppShell";
import { services, statusLabels, workerPayout } from "@/lib/data";
import { inr, useStore } from "@/lib/store";

export const Route = createFileRoute("/worker-panel")({
  head: () => ({
    meta: [
      { title: "Worker Panel — Badre Electrician Service" },
      { name: "description", content: "Naye jobs, kamai aur payout status." },
      { property: "og:title", content: "Worker Panel" },
      { property: "og:description", content: "Jobs aur kamai." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WorkerPanelPage,
});

const statusColor: Record<string, string> = {
  pending: "bg-amber/15 text-amber",
  accepted: "bg-lav/15 text-lav",
  in_progress: "bg-lav/15 text-lav",
  completed: "bg-volt/15 text-volt",
  cancelled: "bg-red/15 text-red",
};

function WorkerPanelPage() {
  const {
    workers,
    bookings,
    setBookingStatus,
    toggleWorkerAvailable,
    currentWorkerId,
    setCurrentWorker,
  } = useStore();
  const ME = workers.some((w) => w.id === currentWorkerId)
    ? currentWorkerId
    : workers[0]!.id;
  const me = workers.find((w) => w.id === ME)!;
  const myJobs = bookings.filter((b) => b.workerId === ME);
  const newRequests = myJobs.filter((b) => b.status === "pending");
  const earned = myJobs
    .filter((b) => b.payment === "paid" && b.status !== "cancelled")
    .reduce((s, b) => s + workerPayout(b), 0);
  const commissionCut = myJobs
    .filter((b) => b.payment === "paid" && b.status !== "cancelled")
    .reduce((s, b) => s + b.commission, 0);

  return (
    <AppShell>
      <header className="rise flex items-center gap-3">
        <Link
          to="/profile"
          className="grid size-9 place-items-center rounded-full bg-glass/70 ring-1 ring-white/60 backdrop-blur-md"
        >
          ←
        </Link>
        <img
          src={me.img}
          alt={me.name}
          width={44}
          height={44}
          className="size-11 rounded-2xl object-cover"
        />
        <div className="flex-1">
          <h1 className="text-base font-extrabold">{me.name}</h1>
          <p className="text-[11px] text-ink-soft">
            {me.role} · {me.kyc === "verified" ? "✅ KYC verified" : "⏳ KYC pending"}
          </p>
        </div>
      </header>

      {/* availability */}
      <section className="rise flex items-center justify-between rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60 backdrop-blur-md [animation-delay:60ms]">
        <div>
          <p className="text-sm font-bold">
            {me.available ? "🟢 Aap available hain" : "🔴 Aap offline hain"}
          </p>
          <p className="text-[11px] text-ink-soft">
            Naye job requests {me.available ? "mil rahe hain" : "band hain"}
          </p>
        </div>
        <button
          onClick={() => toggleWorkerAvailable(me.id)}
          className={`rounded-full px-4 py-2 text-xs font-bold text-white transition active:scale-95 ${
            me.available ? "bg-red" : "bg-volt"
          }`}
        >
          {me.available ? "Offline jayein" : "Online aayein"}
        </button>
      </section>

      {/* earnings */}
      <section className="rise grid grid-cols-3 gap-2 [animation-delay:120ms]">
        <div className="rounded-3xl bg-ink p-3.5 text-white">
          <p className="text-[10px] text-white/60">Kul kamai</p>
          <p className="mt-1 font-mono text-lg font-bold">{inr(earned)}</p>
        </div>
        <div className="rounded-3xl bg-glass/80 p-3.5 ring-1 ring-white/60 backdrop-blur-md">
          <p className="text-[10px] text-ink-soft">Commission kata</p>
          <p className="mt-1 font-mono text-lg font-bold text-amber">
            {inr(commissionCut)}
          </p>
        </div>
        <div className="rounded-3xl bg-glass/80 p-3.5 ring-1 ring-white/60 backdrop-blur-md">
          <p className="text-[10px] text-ink-soft">Payout</p>
          <p className="mt-1 font-mono text-lg font-bold text-volt">Weekly</p>
        </div>
      </section>

      {/* new requests */}
      {newRequests.length > 0 && (
        <section className="rise [animation-delay:180ms]">
          <SectionTitle>🔔 Naye job requests</SectionTitle>
          <div className="space-y-2.5">
            {newRequests.map((b) => {
              const service = services.find((s) => s.id === b.serviceId);
              return (
                <div
                  key={b.id}
                  className="rounded-3xl bg-ink p-4 text-white shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{service?.icon}</span>
                      <div>
                        <p className="text-sm font-bold">{service?.name}</p>
                        <p className="text-[11px] text-white/60">
                          {b.date}, {b.time} · {b.customerName}
                        </p>
                      </div>
                    </div>
                    <p className="font-mono text-sm font-bold">
                      {inr(workerPayout(b))}
                    </p>
                  </div>
                  <p className="mt-2 text-[11px] text-white/60">📍 {b.address}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setBookingStatus(b.id, "accepted")}
                      className="rounded-xl bg-volt py-2.5 text-xs font-bold active:scale-95"
                    >
                      ✅ Sweekar karein
                    </button>
                    <button
                      onClick={() => setBookingStatus(b.id, "cancelled")}
                      className="rounded-xl bg-white/10 py-2.5 text-xs font-bold active:scale-95"
                    >
                      ❌ Asweekar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* all jobs */}
      <section className="rise [animation-delay:240ms]">
        <SectionTitle>Mere jobs</SectionTitle>
        <div className="space-y-2.5">
          {myJobs.map((b) => {
            const service = services.find((s) => s.id === b.serviceId);
            return (
              <div
                key={b.id}
                className="rounded-3xl bg-glass/80 p-3.5 ring-1 ring-white/60 backdrop-blur-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{service?.icon}</span>
                    <div>
                      <p className="text-xs font-bold">
                        {service?.name} · {b.customerName}
                      </p>
                      <p className="text-[10px] text-ink-soft">
                        {b.id} · {b.date}, {b.time}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColor[b.status]}`}
                  >
                    {statusLabels[b.status]}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-xl bg-ink/5 px-2.5 py-1.5 text-[10px]">
                  <span className="text-ink-soft">
                    ₹{b.amount} − ₹{b.commission} commission
                  </span>
                  <span className="font-mono font-bold text-volt">
                    +{inr(workerPayout(b))}
                  </span>
                </div>
                {(b.status === "accepted" || b.status === "in_progress") && (
                  <div className="mt-2.5 flex gap-2">
                    {b.status === "accepted" && (
                      <button
                        onClick={() => setBookingStatus(b.id, "in_progress")}
                        className="flex-1 rounded-xl bg-lav py-2 text-[11px] font-bold text-white active:scale-95"
                      >
                        ▶️ Kaam shuru karein
                      </button>
                    )}
                    {b.status === "in_progress" && (
                      <button
                        onClick={() => setBookingStatus(b.id, "completed")}
                        className="flex-1 rounded-xl bg-volt py-2 text-[11px] font-bold text-white active:scale-95"
                      >
                        ✅ Kaam complete
                      </button>
                    )}
                    <a
                      href="https://wa.me/919999999999"
                      target="_blank"
                      rel="noreferrer"
                      className="grid w-10 place-items-center rounded-xl bg-ink/5 text-sm"
                    >
                      💬
                    </a>
                  </div>
                )}
              </div>
            );
          })}
          {myJobs.length === 0 && (
            <p className="pt-6 text-center text-sm text-ink-soft">
              Abhi koi job nahi mila.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
