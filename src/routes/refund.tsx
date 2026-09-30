import { createFileRoute } from "@tanstack/react-router";
import { BUSINESS, LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/refund")({
  head: () => ({ meta: [
    { title: "Cancellation & Refund Policy — Badre Electrician Service" }, { name: "description", content: "Booking cancel karne aur refund paane ke niyam." },
    { property: "og:title", content: "Cancellation & Refund Policy — Badre Electrician Service" }, { property: "og:description", content: "Booking cancel karne aur refund paane ke niyam." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  return <LegalPage title="Cancellation & Refund Policy"><><h2>Cancellation</h2><ul><li>Customer worker ke kaam shuru karne se pehle booking free mein cancel kar sakta hai.</li><li>Worker ke pahunchne ke baad cancel karne par visit charge lag sakta hai.</li><li>Worker ya platform booking cancel kare to poora paisa wapas milega.</li></ul><h2>Refund</h2><ul><li>Kaam na hone, galat service ya double payment par poora refund.</li><li>Refund request booking ke 7 din ke andar {BUSINESS.email} par booking ID ke saath bhejein.</li><li>Approve hone ke baad refund 5–7 working days mein original payment method (UPI/card/bank) mein aata hai.</li></ul><h2>Non-refundable</h2><p>Poora aur sahi kiya gaya kaam, aur customer dwara diye gaye spare parts ka kharcha refund nahi hota.</p></></LegalPage>;
}
