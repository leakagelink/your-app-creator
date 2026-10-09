import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CustomerWallet, WorkerWallet } from "@/components/Wallet";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/wallet")({
  head: () => ({ meta: [
    { title: "Wallet — Badre Electrician Service" },
    { name: "description", content: "UPI ya QR se wallet mein paise jodein aur withdrawal request lagayein." },
    { property: "og:title", content: "Wallet — Badre Electrician Service" },
    { property: "og:description", content: "UPI/QR deposit aur withdrawal." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  ssr: false,
  component: WalletPage,
});

function WalletPage() {
  const { loading, user, isWorker } = useAuth();
  if (loading) return <AppShell><p className="pt-10 text-center text-sm text-ink-soft">Load ho raha hai...</p></AppShell>;
  if (!user) return <AppShell><p className="pt-10 text-center text-sm text-ink-soft">Wallet ke liye login karein.</p><Link to="/auth" className="block text-center text-sm font-bold text-volt">Login →</Link></AppShell>;
  return <AppShell><header><h1 className="font-display text-2xl">Wallet</h1></header>{isWorker ? <WorkerWallet /> : <CustomerWallet />}</AppShell>;
}
