import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import type { Worker } from "@/lib/data";

const idTypes = [
  { v: "aadhaar", l: "Aadhaar Card" },
  { v: "pan", l: "PAN Card" },
  { v: "voter", l: "Voter ID" },
  { v: "dl", l: "Driving Licence" },
];
const input = "w-full rounded-xl bg-ink/5 px-3 py-2.5 text-sm";

export function WorkerKycForm({ worker }: { worker: Worker }) {
  const { profile } = useAuth();
  const { refresh } = useStore();
  const [f, setF] = useState({ name: worker.name, phone: profile?.phone ?? "", address: "", idType: "aadhaar", idNumber: "", payout: "" });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("submit_worker_kyc", {
      _full_name: f.name, _phone: f.phone, _address: f.address, _id_type: f.idType, _id_number: f.idNumber, _payout_account: f.payout,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("KYC submit ho gaya — admin approval ka intezaar karein");
    await refresh();
  };

  if (worker.kyc === "submitted")
    return <section className="rounded-3xl bg-amber/10 p-4 ring-1 ring-amber/30"><p className="text-sm font-bold">⏳ KYC review mein hai</p><p className="mt-1 text-xs text-ink-soft">Aapki details admin ko bhej di gayi hain. Approve hote hi aap online hokar jobs le sakenge.</p></section>;

  return (
    <section className="space-y-2 rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60">
      <p className="text-sm font-bold">🪪 KYC details bharein</p>
      {worker.kyc === "rejected" ? <p className="rounded-xl bg-red/10 p-2 text-xs text-red">Pichla KYC reject hua. Sahi details dobara bharein.</p> : <p className="text-xs text-ink-soft">KYC approve hone ke baad hi customers aapko dekh aur book kar payenge.</p>}
      <input className={input} placeholder="Poora naam (ID jaisa)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <input className={input} placeholder="Mobile number" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      <textarea className={input} rows={2} placeholder="Poora address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
      <select className={input} value={f.idType} onChange={(e) => setF({ ...f, idType: e.target.value })}>{idTypes.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}</select>
      <input className={input} placeholder="ID number" value={f.idNumber} onChange={(e) => setF({ ...f, idNumber: e.target.value })} />
      <input className={input} placeholder="Payment ke liye UPI ID ya Bank A/c + IFSC" value={f.payout} onChange={(e) => setF({ ...f, payout: e.target.value })} />
      <button disabled={busy} onClick={() => void submit()} className="w-full rounded-xl bg-ink py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? "Bhej rahe hain..." : "KYC submit karein"}</button>
    </section>
  );
}

export function WorkerServiceEditor({ worker }: { worker: Worker }) {
  const { services, refresh } = useStore();
  const [serviceId, setServiceId] = useState(worker.serviceId);
  const [exp, setExp] = useState(String(worker.expYears));
  const save = async () => {
    const { error } = await supabase.rpc("set_own_worker_service", { _service_id: serviceId, _exp_years: Number(exp) || 0 });
    if (error) { toast.error(error.message); return; }
    toast.success("Service update ho gayi");
    await refresh();
  };
  return (
    <section className="space-y-2 rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60">
      <p className="text-sm font-bold">🛠️ Meri service</p>
      <select className={input} value={serviceId} onChange={(e) => setServiceId(e.target.value)}>{services.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}{s.status === "active" ? "" : " (coming soon)"}</option>)}</select>
      <input className={input} inputMode="numeric" placeholder="Experience (saal)" value={exp} onChange={(e) => setExp(e.target.value.replace(/\D/g, ""))} />
      <button onClick={() => void save()} className="w-full rounded-xl bg-volt py-2.5 text-xs font-bold text-white">Save</button>
    </section>
  );
}

type KycRow = { worker_id: string; full_name: string; phone: string; address: string; id_type: string; id_number: string; payout_account: string; status: string; submitted_at: string };

export function AdminKycReview() {
  const { workers, refresh } = useStore();
  const [rows, setRows] = useState<KycRow[]>([]);
  const load = async () => {
    const { data } = await supabase.from("worker_kyc").select("*").order("submitted_at", { ascending: false });
    setRows((data ?? []) as KycRow[]);
  };
  useEffect(() => { void load(); }, [workers]);
  const decide = async (id: string, kyc: "verified" | "rejected") => {
    const { error } = await supabase.rpc("admin_set_worker_kyc", { _worker_id: id, _kyc: kyc });
    if (error) { toast.error(error.message); return; }
    toast.success(kyc === "verified" ? "KYC approve ho gaya" : "KYC reject kiya");
    await refresh();
  };
  const pending = rows.filter((r) => r.status === "submitted");
  return (
    <section className="space-y-2.5">
      <p className="text-sm font-bold">🪪 KYC requests ({pending.length})</p>
      {pending.map((r) => (
        <div key={r.worker_id} className="rounded-3xl bg-glass/80 p-4 text-xs ring-1 ring-white/60">
          <p className="text-sm font-bold">{r.full_name}</p>
          <p className="text-ink-soft">{workers.find((w) => w.id === r.worker_id)?.role}</p>
          <p className="mt-1">📱 {r.phone}</p>
          <p>📍 {r.address}</p>
          <p>🪪 {idTypes.find((t) => t.v === r.id_type)?.l}: <span className="font-mono">{r.id_number}</span></p>
          <p>💳 {r.payout_account}</p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => void decide(r.worker_id, "verified")} className="flex-1 rounded-xl bg-volt py-2 font-bold text-white">Approve</button>
            <button onClick={() => void decide(r.worker_id, "rejected")} className="flex-1 rounded-xl bg-red/10 py-2 font-bold text-red">Reject</button>
          </div>
        </div>
      ))}
      {pending.length === 0 ? <p className="text-center text-xs text-ink-soft">Koi naya KYC request nahi.</p> : null}
    </section>
  );
}

export function WorkerLocationEditor({ worker }: { worker: Worker }) {
  const { refresh } = useStore();
  const [area, setArea] = useState(worker.area);
  const [busy, setBusy] = useState(false);
  const save = () => {
    if (!navigator.geolocation) { toast.error("Is phone mein location support nahi hai"); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { error } = await supabase.rpc("set_own_worker_location", { _lat: pos.coords.latitude, _lng: pos.coords.longitude, _area: area });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Location save ho gayi — ab paas ke customer aapko dekh payenge"); await refresh();
    }, () => { setBusy(false); toast.error("Location permission allow karein"); }, { enableHighAccuracy: true, timeout: 15000 });
  };
  return <section className="rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60">
    <p className="text-sm font-bold">📍 Meri kaam ki location</p>
    <p className="text-[11px] text-ink-soft">{worker.lat != null ? `Saved${worker.area ? ` · ${worker.area}` : ""}` : "Abhi location save nahi hai — customers ko aap 'paas mein' nahi dikhenge"}</p>
    <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Area / mohalla (jaise: Civil Lines, Nagpur)" className="mt-2 w-full rounded-2xl bg-glass/75 px-4 py-2.5 text-sm ring-1 ring-white/60 outline-none" />
    <button onClick={save} disabled={busy} className="mt-2 w-full rounded-2xl bg-ink py-2.5 text-xs font-bold text-white disabled:opacity-50">{busy ? "Location le rahe hain..." : "Abhi ki GPS location save karein"}</button>
  </section>;
}
