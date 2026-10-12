import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Release = { apk_path: string | null; version: string | null; file_size: number | null; updated_at: string };

function useRelease() {
  const [release, setRelease] = useState<Release | null>(null);
  const load = async () => {
    const { data } = await supabase.from("app_release").select("apk_path, version, file_size, updated_at").eq("id", 1).maybeSingle();
    setRelease((data as Release) ?? null);
  };
  useEffect(() => { void load(); }, []);
  return { release, reload: load };
}

async function download(path: string) {
  const { data, error } = await supabase.storage.from("app-apk").createSignedUrl(path, 600, { download: "BadreElectrician.apk" });
  if (error || !data) { toast.error("Download link nahi bana, dobara try karein"); return; }
  window.location.href = data.signedUrl;
}

export function ApkDownloadBanner() {
  const { release } = useRelease();
  if (!release?.apk_path) return null;
  return (
    <button onClick={() => void download(release.apk_path!)} className="rise flex w-full items-center justify-between rounded-3xl bg-volt px-4 py-3 text-left text-white shadow-md active:scale-[0.98]">
      <div><p className="text-sm font-bold">📲 Android App download karein</p><p className="text-[11px] text-white/80">{release.version ? `Version ${release.version}` : "Latest APK"}{release.file_size ? ` · ${(release.file_size / 1048576).toFixed(1)} MB` : ""}</p></div>
      <span className="text-lg">⬇</span>
    </button>
  );
}

export function AdminApkUpload() {
  const { release, reload } = useRelease();
  const [file, setFile] = useState<File | null>(null);
  const [version, setVersion] = useState("");
  const [busy, setBusy] = useState(false);
  const upload = async () => {
    if (!file) { toast.error("APK file chunein"); return; }
    if (!file.name.toLowerCase().endsWith(".apk")) { toast.error("Sirf .apk file upload karein"); return; }
    setBusy(true);
    const path = `${Date.now()}-badre.apk`;
    const { error } = await supabase.storage.from("app-apk").upload(path, file, { contentType: "application/vnd.android.package-archive" });
    if (error) { setBusy(false); toast.error("Upload nahi hua: " + error.message); return; }
    const old = release?.apk_path;
    const { error: e2 } = await supabase.from("app_release").update({ apk_path: path, version: version.trim() || null, file_size: file.size, updated_at: new Date().toISOString() }).eq("id", 1);
    if (e2) { setBusy(false); toast.error("Save nahi hua"); return; }
    if (old) await supabase.storage.from("app-apk").remove([old]);
    setBusy(false); setFile(null); setVersion(""); toast.success("APK upload ho gaya — ab sab download kar sakte hain"); void reload();
  };
  return (
    <section className="rounded-3xl bg-glass/80 p-4 ring-1 ring-white/60">
      <p className="text-sm font-bold">📲 App APK upload</p>
      <p className="mt-1 text-[11px] text-ink-soft">{release?.apk_path ? `Abhi live: ${release.version ?? "APK"} · ${new Date(release.updated_at).toLocaleDateString("en-IN")}` : "Abhi koi APK upload nahi hai"}</p>
      <input type="file" accept=".apk,application/vnd.android.package-archive" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-2 w-full text-xs" />
      <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Version (jaise 1.0.2)" className="mt-2 w-full rounded-xl bg-ink/5 px-3 py-2.5 text-sm" />
      <button disabled={busy} onClick={() => void upload()} className="mt-2 w-full rounded-xl bg-ink py-3 text-sm font-bold text-white disabled:opacity-60">{busy ? "Upload ho raha hai..." : "APK upload karein"}</button>
      {release?.apk_path ? <button onClick={() => void download(release.apk_path!)} className="mt-2 w-full text-xs font-bold text-volt">Current APK download karke check karein</button> : null}
    </section>
  );
}
