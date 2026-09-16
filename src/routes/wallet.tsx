import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell, SectionTitle } from "@/components/AppShell";
import { services, workerPayout } from "@/lib/data";
import { inr, useStore } from "@/lib/store";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet & Rewards — Badre Electrician Service" },
      { name: "description", content: "Payment history, rewards aur receipts." },
      { property: "og:title", content: "Wallet & Rewards" },
      { property: "og:description", content: "Payment history aur rewards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const { bookings, rewardPoints, workers, vouchers, redeemReward } = useStore();
  const paid = bookings.filter((b) => b.payment === "paid");
  const totalSpent = paid.reduce((s, b) => s + b.amount, 0);
  const canRedeem = rewardPoints >= 100;

  return (
    <AppShell>
      <header className="rise">
        <h1 className="font-display text-2xl tracking-tight">Wallet</h1>
        <p className="mt-1 text-sm text-ink-soft">Payments, receipts aur rewards</p>
      </header>

      {/* rewards */}
      <section className="rise rounded-3xl bg-ink p-4 text-white [animation-delay:60ms]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-white/60">🎁 Reward points</p>
            <p className="font-mono text-3xl font-bold">{rewardPoints}</p>
            <p className="mt-1 text-[11px] text-white/50">
              100 points = ₹50 gift voucher
            </p>
          </div>
          <div className="pop grid size-12 place-items-center rounded-2xl bg-amber/20 text-2xl">
            🎉
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-amber"
            style={{ width: `${Math.min(100, rewardPoints % 100)}%` }}
          />
        </div>
      </section>

      {/* spend summary */}
      <section className="rise grid grid-cols-2 gap-2.5 [animation-delay:120ms]">
        <div className="rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60 backdrop-blur-md">
          <p className="text-[11px] text-ink-soft">Total kharcha</p>
          <p className="mt-1 font-mono text-xl font-bold">{inr(totalSpent)}</p>
        </div>
        <div className="rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60 backdrop-blur-md">
          <p className="text-[11px] text-ink-soft">Payments</p>
          <p className="mt-1 font-mono text-xl font-bold">{paid.length}</p>
        </div>
      </section>

      {/* receipts */}
      <section className="rise [animation-delay:180ms]">
        <SectionTitle>Payment history</SectionTitle>
        <div className="space-y-2.5">
          {bookings.map((b) => {
            const service = services.find((s) => s.id === b.serviceId);
            const worker = workers.find((w) => w.id === b.workerId);
            return (
              <div
                key={b.id}
                className="rounded-3xl bg-glass/80 p-3.5 ring-1 ring-white/60 backdrop-blur-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{service?.icon}</span>
                    <div>
                      <p className="text-xs font-bold">
                        {service?.name} · {worker?.name}
                      </p>
                      <p className="font-mono text-[10px] text-ink-soft">
                        {b.id} · {b.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold">{inr(b.amount)}</p>
                    <p
                      className={`text-[10px] font-bold ${
                        b.payment === "paid"
                          ? "text-volt"
                          : b.payment === "refunded"
                            ? "text-lav"
                            : "text-amber"
                      }`}
                    >
                      {b.payment === "paid"
                        ? "Paid ✓"
                        : b.payment === "refunded"
                          ? "Refunded"
                          : "Pending"}
                    </p>
                  </div>
                </div>
                {b.payment === "paid" && (
                  <div className="mt-2 flex justify-between rounded-xl bg-ink/5 px-2.5 py-1.5 text-[10px] text-ink-soft">
                    <span>Commission {inr(b.commission)}</span>
                    <span>Worker ko {inr(workerPayout(b))}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <Link
        to="/profile"
        className="rise block rounded-2xl bg-glass/80 p-3 text-center text-xs font-bold text-ink-soft ring-1 ring-white/60 backdrop-blur-md [animation-delay:240ms]"
      >
        Worker/Admin panel ke liye Profile kholein →
      </Link>
    </AppShell>
  );
}
