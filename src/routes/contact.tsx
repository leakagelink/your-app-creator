import { createFileRoute } from "@tanstack/react-router";
import { BUSINESS, LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact Us — Badre Electrician Service" }, { name: "description", content: "Badre Electrician Service se sampark karein — email, phone aur address." },
    { property: "og:title", content: "Contact Us — Badre Electrician Service" }, { property: "og:description", content: "Badre Electrician Service se sampark karein — email, phone aur address." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  return <LegalPage title="Contact Us"><><p>Kisi bhi sawal, shikayat ya refund ke liye humse sampark karein. Hum 24–48 ghante mein jawab dete hain.</p><h2>Contact details</h2><p><b>Business:</b> {BUSINESS.name}<br /><b>Email:</b> <a className="text-volt" href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a><br /><b>Phone:</b> {BUSINESS.phone}<br /><b>Address:</b> {BUSINESS.address}<br /><b>Timing:</b> Mon–Sun, 9:00 AM – 8:00 PM</p><h2>Grievance</h2><p>Shikayat ke liye booking ID ke saath email karein. Hum 7 working days ke andar samadhan karte hain.</p></></LegalPage>;
}
