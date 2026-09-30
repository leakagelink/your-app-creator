import { createFileRoute } from "@tanstack/react-router";
import { BUSINESS, LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [
    { title: "Terms & Conditions — Badre Electrician Service" }, { name: "description", content: "Badre Electrician Service use karne ki sharten." },
    { property: "og:title", content: "Terms & Conditions — Badre Electrician Service" }, { property: "og:description", content: "Badre Electrician Service use karne ki sharten." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  return <LegalPage title="Terms & Conditions"><><p>{BUSINESS.name} ({BUSINESS.site}) ka use karke aap in sharton ko sweekar karte hain.</p><h2>Service</h2><ul><li>Hum customers ko independent, KYC-verified service professionals se jodte hain.</li><li>Service ka price booking ke samay saaf dikhaya jata hai.</li><li>Platform har booking par ek service fee (commission) leta hai; baaki rakam worker ko milti hai.</li></ul><h2>Customer ki zimmedari</h2><ul><li>Sahi address aur contact details dena</li><li>Tay samay par worker ko ghar mein access dena</li></ul><h2>Worker ki zimmedari</h2><ul><li>Sahi KYC details dena aur professional tareeke se kaam karna</li><li>Galat jaankari par account band kiya ja sakta hai</li></ul><h2>Payment</h2><p>Payments INR mein hote hain. Refund hamari Cancellation & Refund Policy ke anusar honge.</p><h2>Liability</h2><p>Hum kaam ki quality par shikayat ko gambhirta se lete hain, lekin hamari zimmedari booking amount tak seemit hai.</p><h2>Kanoon</h2><p>Yeh sharten Bharat ke kanoon ke adheen hain.</p></></LegalPage>;
}
