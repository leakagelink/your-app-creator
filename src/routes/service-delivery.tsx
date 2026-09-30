import { createFileRoute } from "@tanstack/react-router";
import { BUSINESS, LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/service-delivery")({
  head: () => ({ meta: [
    { title: "Service Delivery Policy — Badre Electrician Service" }, { name: "description", content: "Home service kaise aur kab deliver hoti hai." },
    { property: "og:title", content: "Service Delivery Policy — Badre Electrician Service" }, { property: "og:description", content: "Home service kaise aur kab deliver hoti hai." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  return <LegalPage title="Service Delivery Policy"><><p>{BUSINESS.name} physical products ship nahi karta. Hum ghar par service dete hain.</p><h2>Delivery</h2><ul><li>Service aapke diye gaye address par chune gaye date aur time slot par di jaati hai.</li><li>Worker booking accept karne ke baad tay samay par pahunchta hai.</li><li>Service area: jahan verified workers available hon.</li></ul><h2>Deri</h2><p>Worker na pahunche to hum doosra worker bhejte hain ya poora refund dete hain.</p></></LegalPage>;
}
