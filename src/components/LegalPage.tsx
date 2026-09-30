import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

export const BUSINESS = {
  name: "Badre Electrician Service",
  email: "hello@badre.com",
  phone: "+91-XXXXXXXXXX",
  address: "Address update karein, India",
  site: "badreelectricianservice.online",
  updated: "30 September 2026",
};

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <AppShell>
      <header className="flex items-center gap-3">
        <Link to="/profile" className="grid size-9 place-items-center rounded-full bg-glass/70 ring-1 ring-white/60">←</Link>
        <div>
          <h1 className="font-display text-2xl">{title}</h1>
          <p className="text-[11px] text-ink-soft">Last updated: {BUSINESS.updated}</p>
        </div>
      </header>
      <article className="space-y-4 rounded-3xl bg-glass/80 p-5 text-sm leading-relaxed ring-1 ring-white/60 [&_h2]:mt-2 [&_h2]:font-bold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </article>
      <PolicyLinks />
    </AppShell>
  );
}

export function PolicyLinks() {
  const links = [
    ["/about", "About Us"], ["/contact", "Contact Us"], ["/terms", "Terms & Conditions"],
    ["/privacy", "Privacy Policy"], ["/refund", "Cancellation & Refund"], ["/service-delivery", "Service Delivery"],
  ] as const;
  return (
    <nav className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 pt-2 text-[11px] text-ink-soft">
      {links.map(([to, label]) => <Link key={to} to={to} className="underline-offset-2 hover:underline">{label}</Link>)}
    </nav>
  );
}
