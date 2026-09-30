import { createFileRoute } from "@tanstack/react-router";
import { BUSINESS, LegalPage } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "Privacy Policy — Badre Electrician Service" }, { name: "description", content: "Hum aapka personal data kaise collect, use aur protect karte hain." },
    { property: "og:title", content: "Privacy Policy — Badre Electrician Service" }, { property: "og:description", content: "Hum aapka personal data kaise collect, use aur protect karte hain." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Page,
});

function Page() {
  return <LegalPage title="Privacy Policy"><><p>{BUSINESS.name} aapki privacy ka samman karta hai. Yeh policy batati hai ki hum kaunsi jaankari lete hain aur uska use kaise hota hai.</p><h2>Hum kya collect karte hain</h2><ul><li>Naam, email, mobile number, address</li><li>Booking details aur payment reference</li><li>Workers ke liye KYC details (ID, bank/UPI) — sirf verification aur payout ke liye</li></ul><h2>Use</h2><ul><li>Booking poori karna aur worker se jodna</li><li>Payment process karna aur refund dena</li><li>Customer support aur fraud rokna</li></ul><h2>Payments</h2><p>Online payments secure payment gateway (jaise Razorpay) se process hote hain. Hum aapka card/UPI PIN ya poora card number store nahi karte.</p><h2>Sharing</h2><p>Aapka data sirf booking se jude worker, payment partner aur kanooni zaroorat par authority ke saath share hota hai. Hum data bechte nahi hain.</p><h2>Security aur aapke adhikar</h2><p>Data encrypted connection par surakshit rakha jata hai. Aap apna data dekhne, sudharne ya account delete karne ke liye {BUSINESS.email} par email kar sakte hain.</p></></LegalPage>;
}
