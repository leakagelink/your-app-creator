import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, SectionTitle } from "@/components/AppShell";
import { services, statusLabels, withdrawalLabels } from "@/lib/data";
import { inr, useStore } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Badre Electrician Service" },
      { name: "description", content: "Commission wallet, bookings, workers aur withdrawals manage karein." },
      { property: "og:title", content: "Admin Panel" },
      { property: "og:description", content: "Commission wallet aur management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const wStatusColor: Record<string, string> = {
  pending: "bg-amber/15 text-amber",
  processing: "bg-lav/15 text-lav",
  paid: "bg-volt/15 text-volt",
  failed: "bg-red/15 text-red",
};

function AdminPage() {
  const {
    bookings,
    workers,
    withdrawals,
    commissionWallet,
    commissions,
    updateServiceCommission,
    verifyKyc,
    requestWithdrawal,
    setWithdrawalStatus,
  } = useStore();
  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [account, setAccount] = useState("HDFC ****4521");
  const [tab, setTab] = useState<"wallet" | "bookings" | "workers" | "settings">(
    "wallet",
  );

  const revenue = bookings
    .filter((b) => b.payment === "paid" && b.status !== "cancelled")
    .reduce((s, b) => s + b.amount, 0);

  return (
    <AppShell>
      <header className="rise flex items-center gap-3">
        <Link
          to="/profile"
          className="grid size-9 place-items-center rounded-full bg-glass/70 ring-1 ring-white/60 backdrop-blur-md"
        >
          ←
        </Link>
        <div>
          <h1 className="font-display text-xl tracking-tight">Admin Panel</h1>
          <p className="text-[11px] text-ink-soft">👑 Malik — poora control</p>
        </div>
      </header>

      {/* stats */}
      <section className="rise grid grid-cols-3 gap-2 [animation-delay:60ms]">
        <div className="rounded-3xl bg-ink p-3.5 text-white">
          <p className="text-[10px] text-white/60">Kul revenue</p>
          <p className="mt-1 font-mono text-base font-bold">{inr(revenue)}</p>
        </div>
        <div className="rounded-3xl bg-glass/80 p-3.5 ring-1 ring-white/60 backdrop-blur-md">
          <p className="text-[10px] text-ink-soft">Bookings</p>
          <p className="mt-1 font-mono text-base font-bold">{bookings.length}</p>
        </div>
        <div className="rounded-3xl bg-glass/80 p-3.5 ring-1 ring-white/60 backdrop-blur-md">
          <p className="text-[10px] text-ink-soft">Workers</p>
          <p className="mt-1 font-mono text-base font-bold">{workers.length}</p>
        </div>
      </section>

      {/* tabs */}
      <div className="rise flex gap-1.5 overflow-x-auto [animation-delay:90ms]">
        {(
          [
            ["wallet", "💰 Wallet"],
            ["bookings", "📋 Bookings"],
            ["workers", "👷 Workers"],
            ["settings", "⚙️ Settings"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[11px] font-bold transition ${
              tab === key
                ? "bg-ink text-white"
                : "bg-glass/75 text-ink-soft ring-1 ring-white/60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "wallet" && (
        <>
          {/* commission wallet */}
          <section className="rise rounded-3xl bg-ink p-5 text-white shadow-md [animation-delay:120ms]">
            <p className="text-[11px] text-white/60">💰 Commission Wallet</p>
            <p className="mt-1 font-mono text-3xl font-bold">
              {inr(commissionWallet.available)}
            </p>
            <p className="text-[11px] text-volt">Available balance</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-white/10 p-2.5">
                <p className="text-[10px] text-white/55">Kul commission</p>
                <p className="mt-0.5 font-mono text-sm font-bold">
                  {inr(commissionWallet.total)}
                </p>
              </div>
              <div className="rounded-2xl bg-amber/20 p-2.5">
                <p className="text-[10px] text-amber">Pending</p>
                <p className="mt-0.5 font-mono text-sm font-bold">
                  {inr(commissionWallet.pending)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-2.5">
                <p className="text-[10px] text-white/55">Nikala gaya</p>
                <p className="mt-0.5 font-mono text-sm font-bold">
                  {inr(commissionWallet.withdrawn)}
                </p>
              </div>
            </div>
          </section>

          {/* withdraw */}
          <section className="rise rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60 backdrop-blur-md [animation-delay:180ms]">
            <SectionTitle>💸 Paise nikalein (Bank/UPI)</SectionTitle>
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full rounded-2xl bg-ink/5 px-3 py-2.5 text-xs font-semibold outline-none"
            >
              <option>HDFC ****4521</option>
              <option>SBI ****8834</option>
              <option>UPI: badre@upi</option>
            </select>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={withdrawAmt}
                onChange={(e) => setWithdrawAmt(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder={`Amount (max ${inr(commissionWallet.available)})`}
                className="min-w-0 flex-1 rounded-2xl bg-ink/5 px-3 py-2.5 font-mono text-sm outline-none placeholder:font-sans placeholder:text-ink-soft/60"
              />
              <button
                onClick={() => setWithdrawAmt(String(commissionWallet.available))}
                className="shrink-0 rounded-2xl bg-ink px-3.5 py-2.5 text-xs font-bold text-white active:scale-95"
              >
                Max
              </button>
            </div>
            <button
              onClick={() => {
                const amt = Number(withdrawAmt);
                if (!amt || amt <= 0) {
                  toast.error("Pehle amount daalein");
                  return;
                }
                if (amt > commissionWallet.available) {
                  toast.error("Itna balance available nahi hai", {
                    description: `Available: ${inr(commissionWallet.available)}`,
                  });
                  return;
                }
                requestWithdrawal(amt, account);
                setWithdrawAmt("");
                toast.success(`${inr(amt)} ki withdrawal request bhej di`, {
                  description: `${account} me 24-48 ghante me aayega.`,
                });
              }}
              className="mt-2.5 w-full rounded-2xl bg-volt py-3 text-sm font-bold text-white transition active:scale-[0.98]"
            >
              Withdrawal request karein
            </button>
          </section>

          {/* withdrawals history */}
          <section className="rise [animation-delay:240ms]">
            <SectionTitle>Withdrawal history</SectionTitle>
            <div className="space-y-2">
              {withdrawals.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between rounded-2xl bg-glass/80 p-3 ring-1 ring-white/60 backdrop-blur-md"
                >
                  <div>
                    <p className="font-mono text-sm font-bold">{inr(w.amount)}</p>
                    <p className="text-[10px] text-ink-soft">
                      {w.id} · {w.account} · {w.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${wStatusColor[w.status]}`}
                    >
                      {withdrawalLabels[w.status]}
                    </span>
                    {w.status === "pending" && (
                      <button
                        onClick={() => setWithdrawalStatus(w.id, "processing")}
                        className="rounded-full bg-lav/15 px-2 py-0.5 text-[10px] font-bold text-lav"
                      >
                        Process
                      </button>
                    )}
                    {w.status === "processing" && (
                      <button
                        onClick={() => setWithdrawalStatus(w.id, "paid")}
                        className="rounded-full bg-volt/15 px-2 py-0.5 text-[10px] font-bold text-volt"
                      >
                        Mark paid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* commission history */}
          <section className="rise [animation-delay:300ms]">
            <SectionTitle>Har booking ka commission</SectionTitle>
            <div className="space-y-2">
              {bookings
                .filter((b) => b.payment === "paid" && b.status !== "cancelled")
                .map((b) => {
                  const service = services.find((s) => s.id === b.serviceId);
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-2xl bg-glass/80 p-3 ring-1 ring-white/60 backdrop-blur-md"
                    >
                      <div className="flex items-center gap-2">
                        <span>{service?.icon}</span>
                        <div>
                          <p className="text-xs font-bold">{b.id}</p>
                          <p className="text-[10px] text-ink-soft">
                            ₹{b.amount} booking → worker ₹{b.amount - b.commission}
                          </p>
                        </div>
                      </div>
                      <p className="font-mono text-sm font-bold text-amber">
                        +{inr(b.commission)}
                      </p>
                    </div>
                  );
                })}
            </div>
          </section>
        </>
      )}

      {tab === "bookings" && (
        <section className="rise space-y-2.5 [animation-delay:120ms]">
          {bookings.map((b) => {
            const service = services.find((s) => s.id === b.serviceId);
            const worker = workers.find((w) => w.id === b.workerId);
            return (
              <div
                key={b.id}
                className="rounded-3xl bg-glass/80 p-3.5 ring-1 ring-white/60 backdrop-blur-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{service?.icon}</span>
                    <div>
                      <p className="text-xs font-bold">
                        {b.customerName} → {worker?.name}
                      </p>
                      <p className="text-[10px] text-ink-soft">
                        {b.id} · {b.date}, {b.time} · {service?.name}
                      </p>
                    </div>
                  </div>
                  <p className="font-mono text-sm font-bold">{inr(b.amount)}</p>
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-ink-soft">
                  <span>
                    {statusLabels[b.status]} ·{" "}
                    {b.payment === "paid" ? "Paid ✓" : b.payment}
                  </span>
                  <span>
                    Commission <span className="font-bold text-amber">{inr(b.commission)}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {tab === "workers" && (
        <section className="rise space-y-2.5 [animation-delay:120ms]">
          {workers.map((w) => (
            <div
              key={w.id}
              className="flex items-center gap-3 rounded-3xl bg-glass/80 p-3 ring-1 ring-white/60 backdrop-blur-md"
            >
              <img
                src={w.img}
                alt={w.name}
                loading="lazy"
                width={44}
                height={44}
                className="size-11 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{w.name}</p>
                <p className="text-[11px] text-ink-soft">
                  {w.role} · {w.rating} ★ · {w.jobsDone} kaam
                </p>
              </div>
              {w.kyc === "verified" ? (
                <span className="rounded-full bg-volt/15 px-2 py-1 text-[10px] font-bold text-volt">
                  KYC ✓
                </span>
              ) : (
                <button
                  onClick={() => verifyKyc(w.id)}
                  className="rounded-full bg-amber/15 px-2.5 py-1 text-[10px] font-bold text-amber active:scale-95"
                >
                  KYC approve
                </button>
              )}
            </div>
          ))}
        </section>
      )}

      {tab === "settings" && (
        <section className="rise space-y-2.5 [animation-delay:120ms]">
          <p className="text-[11px] text-ink-soft">
            Har service ka commission yahan badlein (₹15–₹30 ya jitna chahein).
          </p>
          {services.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-3xl bg-glass/80 p-3.5 ring-1 ring-white/60 backdrop-blur-md"
            >
              <span className="text-lg">{s.icon}</span>
              <div className="flex-1">
                <p className="text-sm font-bold">{s.name}</p>
                <p className="text-[10px] text-ink-soft">
                  Visit price {inr(s.price)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-ink-soft">₹</span>
                <input
                  type="number"
                  value={commissions[s.id] ?? s.commission}
                  onChange={(e) =>
                    updateServiceCommission(s.id, Number(e.target.value) || 0)
                  }
                  className="w-16 rounded-xl bg-ink/5 px-2 py-1.5 text-center font-mono text-sm font-bold outline-none"
                />
              </div>
            </div>
          ))}
          <p className="pt-1 text-[10px] text-ink-soft">
            ℹ️ Nayi bookings par naya commission lagega. Refund par commission
            apne-aap adjust ho jayega.
          </p>
        </section>
      )}
    </AppShell>
  );
}
