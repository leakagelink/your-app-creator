import { useCallback, useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { emptyMerchantDetails, type MerchantPaymentDetails } from "@/lib/merchant-payments";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/AppShell";

export function useMerchantUpi() {
  const [upi, setUpi] = useState<MerchantPaymentDetails>(emptyMerchantDetails);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    const { data, error } = await supabase.from("app_settings").select("merchant_upi_id, merchant_name, merchant_bank_name, merchant_account_holder, merchant_account_number, merchant_ifsc, merchant_qr_path").eq("id", 1).maybeSingle();
    if (error) toast.error("Payment details load nahi hui");
    if (data) setUpi({ id: data.merchant_upi_id, name: data.merchant_name, bankName: data.merchant_bank_name, holder: data.merchant_account_holder, account: data.merchant_account_number, ifsc: data.merchant_ifsc, qrPath: data.merchant_qr_path });
    setLoading(false);
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  return { upi, reload, loading };
}

export function MerchantQr({ path }: { path: string }) {
  const [url, setUrl] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let current = true;
    setUrl(""); setFailed(false);
    void supabase.storage.from("merchant-qr").createSignedUrl(path, 600).then(({ data, error }) => {
      if (!current) return;
      if (error || !data) setFailed(true); else setUrl(data.signedUrl);
    });
    return () => { current = false; };
  }, [path]);
  if (!url) return <p className="text-center text-xs text-ink-soft">{failed ? "QR load nahi hua" : "QR load ho raha hai…"}</p>;
  return <img src={url} alt="Merchant payment QR" onError={() => setFailed(true)} className="mx-auto max-h-72 w-full max-w-72 rounded-lg object-contain" />;
}

const inputClass = "w-full rounded-lg bg-ink/5 px-3 py-2.5 text-sm outline-none";

export function AdminMerchantUpi() {
  const { user } = useAuth();
  const { upi, reload, loading } = useMerchantUpi();
  const [form, setForm] = useState(emptyMerchantDetails);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setForm(upi); }, [upi]);
  const change = (key: keyof MerchantPaymentDetails, value: string) => setForm((old) => ({ ...old, [key]: value }));
  const save = async () => {
    if (!user) return;
    setBusy(true);
    try {
      let qrPath = form.qrPath;
      if (file) {
        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error("PNG, JPG ya WebP QR image chunein (max 5 MB)");
        qrPath = `${user.id}/${crypto.randomUUID()}.${file.type.split("/")[1]}`;
        const { error } = await supabase.storage.from("merchant-qr").upload(qrPath, file, { contentType: file.type });
        if (error) throw error;
      }
      const { error } = await supabase.rpc("admin_set_merchant_payment_details", {
        _upi: form.id, _name: form.name, _bank_name: form.bankName, _holder: form.holder,
        _account: form.account, _ifsc: form.ifsc, _qr_path: qrPath,
      });
      if (error) throw error;
      setFile(null);
      await reload();
      toast.success("Bank, UPI aur QR details save ho gayi");
    } catch (error) { toast.error(error instanceof Error ? error.message : (error as { message?: string }).message ?? "Save nahi hua"); }
    finally { setBusy(false); }
  };
  return <section className="space-y-3">
    <SectionTitle>Payment settings</SectionTitle>
    <fieldset disabled={busy || loading} className="space-y-3">
      <label className="block text-xs font-bold">Payment receiver<input value={form.name} onChange={(e) => change("name", e.target.value)} className={`mt-1 ${inputClass}`} /></label>
      <label className="block text-xs font-bold">UPI ID<input value={form.id} onChange={(e) => change("id", e.target.value.trim())} className={`mt-1 ${inputClass}`} /></label>
      <h3 className="pt-2 text-sm font-bold">Bank account</h3>
      <label className="block text-xs font-bold">Bank name<input value={form.bankName} onChange={(e) => change("bankName", e.target.value)} className={`mt-1 ${inputClass}`} /></label>
      <label className="block text-xs font-bold">Account holder<input value={form.holder} onChange={(e) => change("holder", e.target.value)} className={`mt-1 ${inputClass}`} /></label>
      <label className="block text-xs font-bold">Account number<input inputMode="numeric" value={form.account} onChange={(e) => change("account", e.target.value.replace(/\D/g, ""))} className={`mt-1 ${inputClass}`} /></label>
      <label className="block text-xs font-bold">IFSC<input value={form.ifsc} onChange={(e) => change("ifsc", e.target.value.toUpperCase())} className={`mt-1 ${inputClass}`} /></label>
      <label className="block text-xs font-bold">Payment QR<input key={form.qrPath + String(file === null)} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-2 block w-full text-xs" /></label>
      {form.qrPath && !file ? <><MerchantQr path={form.qrPath} /><Button variant="outline" size="sm" onClick={() => change("qrPath", "")}><Trash2 /> QR hatao</Button></> : null}
      {file ? <p className="break-all text-xs text-ink-soft">{file.name}</p> : null}
      <Button disabled={busy || loading} onClick={() => void save()} className="w-full"><Save />{busy ? "Save ho raha hai…" : "Payment details save karein"}</Button>
    </fieldset>
  </section>;
}