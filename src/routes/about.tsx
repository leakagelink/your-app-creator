import { createFileRoute } from "@tanstack/react-router";
import { BUSINESS, LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About Us — Badre Electrician Service" }, { name: "description", content: "Badre Electrician Service ke baare mein — ghar par electrician, plumber, AC aur home services." },
    { property: "og:title", content: "About Us — Badre Electrician Service" }, { property: "og:description", content: "Badre Electrician Service ke baare mein — ghar par electrician, plumber, AC aur home services." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  return <LegalPage title="About Us"><><p>{BUSINESS.name} ek home-service platform hai jo customers ko verified electrician, plumber, AC technician aur anya home service professionals se jodta hai.</p><h2>Hum kya karte hain</h2><ul><li>Electrician, Plumber, AC service, Carpenter, Painter, Cleaning, Locksmith</li><li>Sabhi workers ka KYC verification</li><li>Booking se pehle saaf price — koi hidden charge nahi</li></ul><h2>Business details</h2><p>{BUSINESS.name}<br />{BUSINESS.address}<br />Email: {BUSINESS.email}<br />Phone: {BUSINESS.phone}</p></></LegalPage>;
}
