import { useCallback, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { inr, useStore } from "@/lib/store";
import { SectionTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { MerchantQr, useMerchantUpi } from "@/components/MerchantPayments";
import { hasMerchantPayment } from "@/lib/merchant-payments";
export { AdminMerchantUpi, useMerchantUpi } from "@/components/MerchantPayments";

const card = "rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60";
const input = "w-full rounded-2xl bg-ink/5 px-3 py-2.5 text-sm outline-none";
const btn = "w-full rounded-2xl bg-volt py-3 text-sm font-bold text-white disabled:opacity-50";

type Deposit = { code: string; user_id: string; amount: number; utr: string | null; status: string; admin_note: string | null; created_at: string; expires_at: string };
type Method = { id: string; method_type: string; holder_name: string; account_number: string | null; ifsc: string | null; upi_id: string | null; qr_path: string | null };
type WWithdrawal = { code: string; worker_id: string; amount: number; method_type: string; destination: string; qr_path: string | null; status: string; payout_ref: string | null; created_at: string };

export const depositLabels: Record<string, string> = { awaiting_payment: "Payment baaki", pending: "Admin review mein", approved: "Approved ✓", rejected: "Rejected", expired: "Samay khatam" };
export const wwLabels: Record<string, string> = { pending: "Pending", processing: "Processing", paid: "Paid ✓", rejected: "Rejected" };
const err = (e: { message: string } | null) => e?.message ?? "Kuch galat hua";

function Countdown({ until, onEnd }: { until: string; onEnd: () => void }) {
  const [left, setLeft] = useState(() => Math.max(0, new Date(until).getTime() - Date.now()));
  useEffect(() => {
    const t = setInterval(() => { const l = Math.max(0, new Date(until).getTime() - Date.now()); setLeft(l); if (l === 0) { clearInterval(t); onEnd(); } }, 1000);
    return () => clearInterval(t);
  }, [until, onEnd]);
  const m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
  return <p className={`text-center font-mono text-2xl font-bold ${left < 60000 ? "text-red" : "text-ink"}`}>⏱ {m}:{String(s).padStart(2, "0")}</p>;
}

/* ---------------- Customer wallet ---------------- */
export function CustomerWallet() {
  const { user, profile, refreshProfile } = useAuth();
  const { upi } = useMerchantUpi();
  const [amount, setAmount] = useState("");
  const [active, setActive] = useState<Deposit | null>(null);
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<Deposit[]>([]);
  const balance = (profile as { wallet_balance?: number } | null)?.wallet_balance ?? 0;

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("wallet_deposits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    setList((data ?? []) as Deposit[]);
  }, [user]);
  useEffect(() => { void load(); void refreshProfile(); }, [load]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    const value = Number(amount);
    if (!value) { toast.error("Amount likhein"); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc("start_wallet_deposit", { _amount: value });
    setBusy(false);
    if (error || !data) { toast.error(err(error)); return; }
    setActive(data as Deposit); setUtr("");
  };
  const submit = async () => {
    if (!active) return;
    setBusy(true);
    const { error } = await supabase.rpc("submit_deposit_utr", { _code: active.code, _utr: utr.trim() });
    setBusy(false);
    if (error) { toast.error(err(error)); return; }
    toast.success("Request admin ko bhej di gayi"); setActive(null); setAmount(""); void load();
  };
  const upiLink = active ? `upi://pay?pa=${encodeURIComponent(upi.id)}&pn=${encodeURIComponent(upi.name)}&am=${active.amount}&cu=INR&tn=${encodeURIComponent(active.code)}` : "";

  return <>
    <section className="rounded-3xl bg-ink p-5 text-white"><p className="text-[11px] text-white/60">Wallet balance</p><p className="font-mono text-3xl font-bold">{inr(balance)}</p><p className="text-[11px] text-white/60">Admin approve karne ke baad hi paisa judta hai</p></section>
    {!active ? <section className={card}><SectionTitle>Paise jodein (Bank / UPI / QR)</SectionTitle>
      {!hasMerchantPayment(upi) ? <p className="text-xs text-ink-soft">Admin ne abhi payment details set nahi ki hain. Thodi der baad try karein.</p> : <>
        <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Amount (₹10 – ₹1,00,000)" className={input} />
        <div className="mt-2 flex gap-1.5">{[200, 500, 1000, 2000].map((v) => <button key={v} onClick={() => setAmount(String(v))} className="flex-1 rounded-xl bg-ink/5 py-1.5 text-[11px] font-bold">₹{v}</button>)}</div>
        <button disabled={busy} onClick={() => void start()} className={`mt-2 ${btn}`}>Aage badhein</button></>}
    </section> : <section className={`${card} space-y-3`}>
      <SectionTitle tag={active.code}>{inr(active.amount)} pay karein</SectionTitle>
      <Countdown until={active.expires_at} onEnd={() => { toast.error("10 minute khatam — dobara shuru karein"); setActive(null); void load(); }} />
      {upi.qrPath ? <MerchantQr path={upi.qrPath} /> : upi.id ? <div className="mx-auto w-fit rounded-lg bg-paper p-3"><QRCodeSVG value={upiLink} size={190} /></div> : null}
      {(upi.id || upi.qrPath) ? <p className="text-center text-xs font-bold text-ink">{upi.name}</p> : null}
      {upi.id ? <><p className="break-all text-center font-mono text-xs font-bold text-ink">{upi.id}</p><Button asChild className="w-full"><a href={upiLink}>UPI app se pay karein</a></Button></> : null}
      {upi.account ? <dl className="space-y-1 border-y border-ink/10 py-3 text-xs"><div><dt className="text-ink-soft">Bank</dt><dd className="break-words font-bold">{upi.bankName}</dd></div><div><dt className="text-ink-soft">Account holder</dt><dd className="break-words font-bold">{upi.holder}</dd></div><div><dt className="text-ink-soft">Account number</dt><dd className="break-all font-mono font-bold">{upi.account}</dd></div><div><dt className="text-ink-soft">IFSC</dt><dd className="font-mono font-bold">{upi.ifsc}</dd></div></dl> : null}
      <input value={utr} onChange={(e) => setUtr(e.target.value.replace(/[^A-Za-z0-9]/g, ""))} placeholder="Transaction ID / UTR (12 digit)" className={input} />
      <button disabled={busy || utr.length < 8} onClick={() => void submit()} className={btn}>Transaction ID submit karein</button>
      <button onClick={() => setActive(null)} className="w-full text-xs font-bold text-ink-soft">Cancel</button>
    </section>}
    <section><SectionTitle>Deposit history</SectionTitle>{list.map((d) => <div key={d.code} className="mb-2 flex items-center justify-between rounded-2xl bg-glass/80 p-3 ring-1 ring-white/60"><div><p className="font-mono text-sm font-bold">{inr(d.amount)}</p><p className="text-[10px] text-ink-soft">{d.code} · {d.utr ?? "—"} · {new Date(d.created_at).toLocaleString("en-IN")}</p>{d.admin_note ? <p className="text-[10px] text-ink-soft">Note: {d.admin_note}</p> : null}</div><span className="text-[10px] font-bold">{d.status === "awaiting_payment" && new Date(d.expires_at) < new Date() ? depositLabels["expired"] : depositLabels[d.status] ?? d.status}</span></div>)}{list.length === 0 ? <p className="text-center text-xs text-ink-soft">Abhi koi deposit nahi.</p> : null}</section>
  </>;
}

/* ---------------- Worker wallet ---------------- */
function methodText(m: Method) {
  return m.method_type === "bank" ? `🏦 ${m.holder_name} · A/c ••${(m.account_number ?? "").slice(-4)} · ${m.ifsc}` : m.method_type === "upi" ? `📱 ${m.holder_name} · ${m.upi_id}` : `🔳 ${m.holder_name} · QR code`;
}

export function WorkerWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [methods, setMethods] = useState<Method[]>([]);
  const [list, setList] = useState<WWithdrawal[]>([]);
  const [type, setType] = useState<"bank" | "upi" | "qr">("upi");
  const [f, setF] = useState({ holder: "", account: "", ifsc: "", upi: "" });
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState("");
  const [methodId, setMethodId] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [b, m, w] = await Promise.all([
      supabase.rpc("my_worker_balance"),
      supabase.from("payout_methods").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("worker_withdrawals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setBalance(Number(b.data ?? 0)); setMethods((m.data ?? []) as Method[]); setList((w.data ?? []) as WWithdrawal[]);
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  const addMethod = async () => {
    if (!user) return;
    setBusy(true);
    let qrPath: string | null = null;
    if (type === "qr") {
      if (!file) { setBusy(false); toast.error("QR image chunein"); return; }
      qrPath = `${user.id}/${Date.now()}-${file.name.replace(/[^A-Za-z0-9.]/g, "")}`;
      const { error } = await supabase.storage.from("payout-qr").upload(qrPath, file);
      if (error) { setBusy(false); toast.error(err(error)); return; }
    }
    const { error } = await supabase.rpc("add_payout_method", { _type: type, _holder: f.holder, _account: f.account, _ifsc: f.ifsc, _upi: f.upi, _qr_path: qrPath ?? "" });
    setBusy(false);
    if (error) { toast.error(err(error)); return; }
    toast.success("Payout method save ho gaya"); setF({ holder: "", account: "", ifsc: "", upi: "" }); setFile(null); void load();
  };
  const remove = async (id: string) => { const { error } = await supabase.from("payout_methods").delete().eq("id", id); if (error) toast.error(err(error)); else void load(); };
  const withdraw = async () => {
    if (!methodId) { toast.error("Kisme paisa lena hai, chunein"); return; }
    setBusy(true);
    const { error } = await supabase.rpc("request_worker_withdrawal", { _amount: Number(amount), _method_id: methodId });
    setBusy(false);
    if (error) { toast.error(err(error)); return; }
    toast.success("Withdrawal request admin ko bhej di"); setAmount(""); void load();
  };

  return <>
    <section className="rounded-3xl bg-ink p-5 text-white"><p className="text-[11px] text-white/60">Nikalne layak kamai</p><p className="font-mono text-3xl font-bold">{inr(balance)}</p><p className="text-[11px] text-white/60">Paid + complete jobs ka aapka hissa</p></section>
    <section className={card}><SectionTitle>Withdrawal request</SectionTitle>
      {methods.length === 0 ? <p className="text-xs text-ink-soft">Pehle neeche bank, UPI ya QR add karein.</p> : <>
        <p className="mb-1 text-[11px] font-bold text-ink-soft">Kisme paisa chahiye?</p>
        <div className="space-y-1.5">{methods.map((m) => <label key={m.id} className={`flex items-center gap-2 rounded-2xl p-2.5 text-xs ${methodId === m.id ? "bg-volt/15 ring-1 ring-volt" : "bg-ink/5"}`}><input type="radio" checked={methodId === m.id} onChange={() => setMethodId(m.id)} />{methodText(m)}</label>)}</div>
        <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder={`Amount (max ${inr(balance)})`} className={`mt-2 ${input}`} />
        <button disabled={busy || !Number(amount)} onClick={() => void withdraw()} className={`mt-2 ${btn}`}>Request bhejein</button></>}
    </section>
    <section className={card}><SectionTitle>Mere payout account</SectionTitle>
      {methods.map((m) => <div key={m.id} className="mb-1.5 flex items-center justify-between rounded-2xl bg-ink/5 p-2.5 text-xs"><span>{methodText(m)}</span><button onClick={() => void remove(m.id)} className="text-[10px] font-bold text-red">Hatao</button></div>)}
      <div className="mt-2 flex gap-1.5">{(["upi", "bank", "qr"] as const).map((t) => <button key={t} onClick={() => setType(t)} className={`flex-1 rounded-xl py-2 text-[11px] font-bold ${type === t ? "bg-ink text-white" : "bg-ink/5"}`}>{t === "upi" ? "UPI ID" : t === "bank" ? "Bank" : "QR code"}</button>)}</div>
      <div className="mt-2 space-y-2">
        <input value={f.holder} onChange={(e) => setF({ ...f, holder: e.target.value })} placeholder="Account holder ka naam" className={input} />
        {type === "bank" ? <><input value={f.account} onChange={(e) => setF({ ...f, account: e.target.value.replace(/\D/g, "") })} inputMode="numeric" placeholder="Bank account number" className={input} /><input value={f.ifsc} onChange={(e) => setF({ ...f, ifsc: e.target.value.toUpperCase() })} placeholder="IFSC code" className={input} /></> : null}
        {type === "upi" ? <input value={f.upi} onChange={(e) => setF({ ...f, upi: e.target.value.trim() })} placeholder="UPI ID (jaise naam@okaxis)" className={input} /> : null}
        {type === "qr" ? <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-xs" /> : null}
        <button disabled={busy} onClick={() => void addMethod()} className={btn}>Save karein</button>
      </div>
    </section>
    <section><SectionTitle>Withdrawal history</SectionTitle>{list.map((w) => <div key={w.code} className="mb-2 flex items-center justify-between rounded-2xl bg-glass/80 p-3 ring-1 ring-white/60"><div><p className="font-mono text-sm font-bold">{inr(w.amount)}</p><p className="text-[10px] text-ink-soft">{w.code} · {w.destination}</p>{w.payout_ref ? <p className="text-[10px] text-ink-soft">Ref: {w.payout_ref}</p> : null}</div><span className="text-[10px] font-bold">{wwLabels[w.status] ?? w.status}</span></div>)}{list.length === 0 ? <p className="text-center text-xs text-ink-soft">Abhi koi withdrawal nahi.</p> : null}</section>
  </>;
}

/* ---------------- Admin ---------------- */
export function AdminDeposits() {
  const { refresh } = useStore();
  const [list, setList] = useState<Deposit[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const load = useCallback(async () => { const { data } = await supabase.from("wallet_deposits").select("*").neq("status", "awaiting_payment").order("created_at", { ascending: false }).limit(200); setList((data ?? []) as Deposit[]); }, []);
  useEffect(() => { void load(); }, [load]);
  const review = async (code: string, approve: boolean) => { const { error } = await supabase.rpc("admin_review_deposit", { _code: code, _approve: approve, _note: notes[code] ?? "" }); if (error) toast.error(err(error)); else { toast.success(approve ? "Approve — wallet mein jud gaya" : "Reject kar diya"); void load(); void refresh(); } };
  return <section><SectionTitle tag={`${list.filter((d) => d.status === "pending").length} pending`}>Deposit requests</SectionTitle>{list.map((d) => <div key={d.code} className={`mb-2 ${card}`}><div className="flex justify-between"><div><p className="font-mono text-sm font-bold">{inr(d.amount)}</p><p className="text-[10px] text-ink-soft">{d.code} · {new Date(d.created_at).toLocaleString("en-IN")}</p><p className="text-xs">UTR: <span className="font-mono font-bold">{d.utr}</span></p></div><span className="text-[10px] font-bold">{depositLabels[d.status] ?? d.status}</span></div>{d.status === "pending" ? <><input value={notes[d.code] ?? ""} onChange={(e) => setNotes({ ...notes, [d.code]: e.target.value })} placeholder="Note (optional)" className={`mt-2 ${input}`} /><div className="mt-2 flex gap-2"><button onClick={() => void review(d.code, true)} className="flex-1 rounded-xl bg-volt py-2 text-xs font-bold text-white">Approve</button><button onClick={() => void review(d.code, false)} className="flex-1 rounded-xl bg-red/10 py-2 text-xs font-bold text-red">Reject</button></div></> : d.admin_note ? <p className="mt-1 text-[10px] text-ink-soft">Note: {d.admin_note}</p> : null}</div>)}{list.length === 0 ? <p className="text-center text-xs text-ink-soft">Koi deposit request nahi.</p> : null}</section>;
}

export function AdminWorkerWithdrawals() {
  const { workers } = useStore();
  const [list, setList] = useState<WWithdrawal[]>([]);
  const [refs, setRefs] = useState<Record<string, string>>({});
  const load = useCallback(async () => { const { data } = await supabase.from("worker_withdrawals").select("*").order("created_at", { ascending: false }).limit(200); setList((data ?? []) as WWithdrawal[]); }, []);
  useEffect(() => { void load(); }, [load]);
  const set = async (code: string, status: string) => { const { error } = await supabase.rpc("admin_set_worker_withdrawal", { _code: code, _status: status, _ref: refs[code] ?? "" }); if (error) toast.error(err(error)); else { toast.success("Status update ho gaya"); void load(); } };
  const openQr = async (path: string) => { const { data, error } = await supabase.storage.from("payout-qr").createSignedUrl(path, 300); if (error || !data) toast.error("QR nahi khula"); else window.open(data.signedUrl, "_blank"); };
  return <section><SectionTitle tag={`${list.filter((w) => w.status === "pending").length} pending`}>Worker withdrawals</SectionTitle>{list.map((w) => <div key={w.code} className={`mb-2 ${card}`}><div className="flex justify-between"><div><p className="font-mono text-sm font-bold">{inr(w.amount)}</p><p className="text-[10px] text-ink-soft">{w.code} · {workers.find((x) => x.id === w.worker_id)?.name ?? w.worker_id}</p><p className="text-xs">{w.destination}</p>{w.qr_path ? <button onClick={() => void openQr(w.qr_path!)} className="text-[11px] font-bold text-lav">QR dekhein</button> : null}{w.payout_ref ? <p className="text-[10px] text-ink-soft">Ref: {w.payout_ref}</p> : null}</div><span className="text-[10px] font-bold">{wwLabels[w.status] ?? w.status}</span></div>
    {w.status === "pending" ? <div className="mt-2 flex gap-2"><button onClick={() => void set(w.code, "processing")} className="flex-1 rounded-xl bg-lav py-2 text-xs font-bold text-white">Process</button><button onClick={() => void set(w.code, "rejected")} className="flex-1 rounded-xl bg-red/10 py-2 text-xs font-bold text-red">Reject</button></div> : null}
    {w.status === "processing" ? <><input value={refs[w.code] ?? ""} onChange={(e) => setRefs({ ...refs, [w.code]: e.target.value })} placeholder="Payout transaction ID" className={`mt-2 ${input}`} /><div className="mt-2 flex gap-2"><button onClick={() => void set(w.code, "paid")} className="flex-1 rounded-xl bg-volt py-2 text-xs font-bold text-white">Paid</button><button onClick={() => void set(w.code, "rejected")} className="flex-1 rounded-xl bg-red/10 py-2 text-xs font-bold text-red">Reject</button></div></> : null}
  </div>)}{list.length === 0 ? <p className="text-center text-xs text-ink-soft">Koi worker withdrawal nahi.</p> : null}</section>;
}
