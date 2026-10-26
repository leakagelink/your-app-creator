import { useMemo, useState } from "react";
import { SectionTitle } from "@/components/AppShell";
import { inr, useStore } from "@/lib/store";

function Stat({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return <div className="rounded-2xl bg-glass/80 p-3 ring-1 ring-white/60"><p className="text-[10px] text-ink-soft">{label}</p><p className={`font-mono text-base font-bold ${tone}`}>{value}</p></div>;
}

export function AdminLedger() {
  const { bookings, workers } = useStore();
  const [view, setView] = useState<"workers" | "customers">("workers");
  const live = bookings.filter((b) => b.status !== "cancelled");
  const paid = live.filter((b) => b.payment === "paid");
  const sum = (list: typeof bookings, f: (b: (typeof bookings)[number]) => number) => list.reduce((s, b) => s + f(b), 0);

  const byWorker = useMemo(() => {
    const m = new Map<string, { name: string; jobs: number; done: number; earned: number; due: number; paidOut: number }>();
    for (const b of live) {
      const r = m.get(b.workerId) ?? { name: workers.find((w) => w.id === b.workerId)?.name ?? b.workerId, jobs: 0, done: 0, earned: 0, due: 0, paidOut: 0 };
      r.jobs++; if (b.status === "completed") r.done++;
      if (b.payment === "paid") r.earned += b.workerPayout;
      if (b.payoutStatus === "due") r.due += b.workerPayout;
      if (b.payoutStatus === "paid") r.paidOut += b.workerPayout;
      m.set(b.workerId, r);
    }
    return [...m.values()].sort((a, b) => b.due - a.due);
  }, [live, workers]);

  const byCustomer = useMemo(() => {
    const m = new Map<string, { name: string; phone: string; jobs: number; paid: number; unpaid: number }>();
    for (const b of live) {
      const key = b.customerPhone || b.customerName;
      const r = m.get(key) ?? { name: b.customerName, phone: b.customerPhone, jobs: 0, paid: 0, unpaid: 0 };
      r.jobs++; if (b.payment === "paid") r.paid += b.amount; else r.unpaid += b.amount;
      m.set(key, r);
    }
    return [...m.values()].sort((a, b) => b.unpaid - a.unpaid);
  }, [live]);

  return <>
    {live.some((b) => b.billStatus === "pending") ? <section className="rounded-2xl bg-amber/10 p-3 text-xs font-bold ring-1 ring-amber/20">🧾 {live.filter((b) => b.billStatus === "pending").length} booking mein worker ne naya bill daala hai — Bookings tab mein dekhein</section> : null}
    <section><SectionTitle>Poora hisaab</SectionTitle><div className="grid grid-cols-2 gap-2">
      <Stat label={`Kul bookings (${live.length})`} value={inr(sum(live, (b) => b.amount))} />
      <Stat label={`Customer se mila (${paid.length})`} value={inr(sum(paid, (b) => b.amount))} tone="text-volt" />
      <Stat label="Customer se baaki" value={inr(sum(live.filter((b) => b.payment !== "paid"), (b) => b.amount))} tone="text-red" />
      <Stat label="Admin commission" value={inr(sum(paid, (b) => b.commission))} tone="text-volt" />
      <Stat label="Worker ko dena baaki" value={inr(sum(live.filter((b) => b.payoutStatus === "due"), (b) => b.workerPayout))} tone="text-amber" />
      <Stat label="Worker ko de diya" value={inr(sum(live.filter((b) => b.payoutStatus === "paid"), (b) => b.workerPayout))} />
    </div></section>
    <div className="grid grid-cols-2 gap-2">{(["workers", "customers"] as const).map((k) => <button key={k} onClick={() => setView(k)} className={`rounded-2xl py-2.5 text-xs font-bold ${view === k ? "bg-ink text-white" : "bg-glass/75 ring-1 ring-white/60"}`}>{k === "workers" ? "👷 Worker ka hisaab" : "🙋 Customer ka hisaab"}</button>)}</div>
    {view === "workers" ? <section className="space-y-2">{byWorker.map((w) => <div key={w.name} className="rounded-2xl bg-glass/80 p-3 ring-1 ring-white/60">
      <div className="flex justify-between"><p className="text-sm font-bold">{w.name}</p><p className="text-[10px] text-ink-soft">{w.jobs} bookings · {w.done} complete</p></div>
      <div className="mt-2 grid grid-cols-3 gap-1 text-center text-[10px]"><div><p className="text-ink-soft">Kamaai</p><p className="font-mono text-xs font-bold">{inr(w.earned)}</p></div><div><p className="text-ink-soft">Dena baaki</p><p className="font-mono text-xs font-bold text-amber">{inr(w.due)}</p></div><div><p className="text-ink-soft">De diya</p><p className="font-mono text-xs font-bold text-volt">{inr(w.paidOut)}</p></div></div>
    </div>)}{byWorker.length === 0 ? <p className="text-center text-xs text-ink-soft">Abhi koi booking nahi hai.</p> : null}</section>
    : <section className="space-y-2">{byCustomer.map((c) => <div key={c.phone + c.name} className="rounded-2xl bg-glass/80 p-3 ring-1 ring-white/60">
      <div className="flex justify-between"><p className="text-sm font-bold">{c.name}</p><p className="text-[10px] text-ink-soft">{c.phone} · {c.jobs} bookings</p></div>
      <div className="mt-2 grid grid-cols-2 gap-1 text-center text-[10px]"><div><p className="text-ink-soft">Paid</p><p className="font-mono text-xs font-bold text-volt">{inr(c.paid)}</p></div><div><p className="text-ink-soft">Baaki</p><p className="font-mono text-xs font-bold text-red">{inr(c.unpaid)}</p></div></div>
    </div>)}{byCustomer.length === 0 ? <p className="text-center text-xs text-ink-soft">Abhi koi booking nahi hai.</p> : null}</section>}
  </>;
}
