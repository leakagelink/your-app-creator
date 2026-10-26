import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Booking } from "@/lib/data";
import { inr, useStore } from "@/lib/store";

const statusText = { none: "", pending: "⏳ Customer ki manzoori baaki", accepted: "✓ Customer ne naya bill maana", rejected: "✗ Customer ne naya bill nahi maana" } as const;

function BillInfo({ b }: { b: Booking }) {
  if (b.billStatus === "none") return null;
  return <div className="mt-2 rounded-2xl bg-amber/10 p-2.5 text-[11px] ring-1 ring-amber/20">
    <p className="font-bold">🧾 Naya bill: {inr(b.billAmount ?? 0)}{b.originalAmount != null ? ` (pehle ${inr(b.originalAmount)})` : ""}</p>
    {b.billNote ? <p className="mt-0.5 text-ink-soft">{b.billNote}</p> : null}
    <p className="mt-0.5 font-semibold">{statusText[b.billStatus]}</p>
  </div>;
}

export function WorkerBillForm({ booking }: { booking: Booking }) {
  const { refresh } = useStore();
  const [open, setOpen] = useState(false); const [amount, setAmount] = useState(""); const [note, setNote] = useState(""); const [busy, setBusy] = useState(false);
  const editable = booking.payment !== "paid" && booking.status !== "cancelled" && booking.status !== "completed";
  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("worker_propose_bill", { _code: booking.id, _amount: Number(amount), _note: note });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Bill bhej diya — customer ki manzoori ka intezaar"); setOpen(false); setAmount(""); setNote(""); await refresh();
  };
  return <><BillInfo b={booking} />
    {editable && booking.billStatus !== "pending" ? (!open ? <button onClick={() => setOpen(true)} className="mt-2 w-full rounded-xl bg-amber/15 py-2 text-xs font-bold text-amber">🧾 Kaam zyada hai? Naya bill daalein</button>
      : <div className="mt-2 space-y-1.5 rounded-2xl bg-ink/5 p-2.5">
        <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Kul amount ₹ (jaise 10000)" className="w-full rounded-xl bg-glass px-3 py-2 text-sm outline-none" />
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Kaam ki details (jaise: 4 din ka wiring kaam, saamaan sahit)" className="w-full resize-none rounded-xl bg-glass px-3 py-2 text-xs outline-none" />
        <div className="flex gap-1.5"><button onClick={() => setOpen(false)} className="flex-1 rounded-xl bg-glass py-2 text-xs font-bold">Rehne dein</button><button onClick={submit} disabled={busy || !amount} className="flex-1 rounded-xl bg-ink py-2 text-xs font-bold text-white disabled:opacity-50">{busy ? "..." : "Customer ko bhejein"}</button></div>
      </div>) : null}
  </>;
}

export function CustomerBillReview({ booking }: { booking: Booking }) {
  const { refresh } = useStore(); const [busy, setBusy] = useState(false);
  const respond = async (accept: boolean) => {
    setBusy(true);
    const { error } = await supabase.rpc("customer_respond_bill", { _code: booking.id, _accept: accept });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(accept ? "Naya bill maan liya" : "Bill mana kar diya"); await refresh();
  };
  return <><BillInfo b={booking} />
    {booking.billStatus === "pending" && booking.payment !== "paid" ? <div className="mt-2 flex gap-1.5"><button disabled={busy} onClick={() => void respond(false)} className="flex-1 rounded-xl bg-red/10 py-2 text-xs font-bold text-red">Mana karein</button><button disabled={busy} onClick={() => void respond(true)} className="flex-1 rounded-xl bg-volt py-2 text-xs font-bold text-white">{inr(booking.billAmount ?? 0)} maan lein</button></div> : null}
  </>;
}

export function AdminBillInfo({ booking }: { booking: Booking }) { return <BillInfo b={booking} />; }
