# Real-data-only backend cleanup

## Goal
App se har fake, mock, demo aur fallback record hatana. Screen par sirf Lovable Cloud database mein maujood asli customer, worker, booking, payment, commission, reward aur withdrawal data dikhana.

## Changes

### 1. Fake records permanently remove
- Database se seeded workers (Suresh, Imran, Vikram, Ramesh, Anil) aur unse judi test booking hataenge.
- Test customer profile ko public app data se hataenge; required admin account `hello@badre.com` ko rakhenge.
- Existing migration se fake worker INSERT statements nikaalenge, taaki future setup mein ye records dobara na aayein.
- Nayi cleanup migration add karenge, taaki preview aur published database dono consistent rahen.

### 2. Services ko database-driven banana
- `services` table banegi: service name, icon, price, commission, active/coming-soon status.
- User-confirmed Electrician ₹500 / ₹20 commission ko active configuration rakhenge.
- Plumber aur AC ko real offered categories ke roop mein rakhenge, lekin invented prices nahi dikhayenge; admin price set hone tak booking disabled rahegi.
- Carpenter, Painter, Cleaning, Locksmith ko future/coming-soon rakhenge.
- Home, services, booking aur admin settings static arrays ke badle isi table ko use karenge.

### 3. Workers ko real accounts se bind karna
- Worker list mein sirf database ke worker profiles dikhेंगे.
- Fake stock worker photos aur fallback names/photos hataenge; photo na ho to naam ka initial dikhेगा.
- Worker panel ka “demo login” selector hataenge.
- Worker panel logged-in user ke linked worker record ko hi dikhayega; linked record na ho to clear empty state.
- Admin panel mein real worker add/link form denge, including email, service, experience, optional photo URL, KYC and availability.

### 4. Fake UI defaults remove
- `Pune` location fallback, `Pune (GPS location)`, fake WhatsApp number, fake HDFC/SBI/UPI accounts, fixed `4.9 ★`, fixed ₹500/₹20/₹480 wallet example हटेंगे.
- Booking ke liye real address required hoga.
- Withdrawal ke liye admin ko actual bank/UPI destination type karna hoga.
- Empty lists “abhi koi real record nahi” state dikhayengi; loading aur database errors alag dikhेंगे.

### 5. Payment honesty and transaction safety
- Current fake “UPI payment successful” button हटेगा; payment gateway connected na hone tak app payment ko paid mark nahi karega.
- Booking unpaid rahegi aur screen clearly “online payment abhi available nahi” dikhayegi.
- Reward points aur commission sirf verified paid transaction par credit honge; client button se direct credit nahi hoga.
- Database function booking ownership, payment state, and duplicate reward protection enforce karegi.

### 6. Security and admin controls
- Customer sirf apni bookings/vouchers dekhega.
- Worker sirf apne assigned jobs dekhega aur apni availability/status badal payega.
- Admin sab bookings, workers, commission config aur withdrawals manage karega.
- Database permissions and policies review karke least-access rules लागू करेंगे.

### 7. Verification and go-live
- Signed-out home: zero fake workers, no fake location or totals.
- Real admin login: clean dashboard, real service settings, worker creation, no demo selector.
- Real customer login: booking requires a real worker, address and configured price; record database mein save/read back hota hai.
- Desktop and mobile checks ke baad app publish karenge and published URL verify karenge.

## Important limitation
Real online UPI/card collection and automatic payout merchant gateway credentials ke bina activate nahi ho sakte. Cleanup ke baad app payment success fake nahi karega; gateway milne tak bookings unpaid रहेंगी.

## Technical details
- Add a migration for `services`, worker-safe identity linking, payment/reward safeguards, and cleanup of seeded records.
- Replace static service/worker data imports with StoreProvider database queries and typed empty/error states.
- Keep the required admin account and existing authentication flow.
- Regenerate database types after schema changes.
