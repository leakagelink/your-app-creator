export type Service = {
  id: string;
  name: string;
  icon: string;
  tint: "amber" | "lav" | "volt";
  price: number | null;
  commission: number | null;
  status: "active" | "coming_soon";
};

export type Worker = {
  id: string;
  name: string;
  serviceId: string;
  role: string;
  expYears: number;
  rating: number;
  jobsDone: number;
  distanceKm: number;
  img: string | null;
  userId: string | null;
  available: boolean;
  kyc: "pending" | "submitted" | "verified" | "rejected";
  lat: number | null;
  lng: number | null;
  area: string;
};

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = (d: number) => (d * Math.PI) / 180;
  const x = Math.sin(r(bLat - aLat) / 2) ** 2 + Math.cos(r(aLat)) * Math.cos(r(bLat)) * Math.sin(r(bLng - aLng) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export type BookingStatus =
  | "pending"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";

export type Booking = {
  id: string;
  customerName: string;
  customerPhone: string;
  workerId: string;
  serviceId: string;
  amount: number;
  commission: number;
  date: string;
  time: string;
  address: string;
  status: BookingStatus;
  payment: PaymentStatus;
  createdAt: number;
  workerPayout: number;
  commissionPercent: number;
  payoutStatus: "not_due" | "due" | "paid";
  paymentMethod: string | null;
  paymentRef: string | null;
  payoutRef: string | null;
};

export type WithdrawalStatus = "pending" | "processing" | "paid" | "failed";

export type Withdrawal = {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  date: string;
  account: string;
};

export const statusLabels: Record<BookingStatus, string> = {
  pending: "Nayi booking",
  accepted: "Sweekar",
  in_progress: "Kaam chalu",
  completed: "Complete ✓",
  cancelled: "Cancel",
};

export const withdrawalLabels: Record<WithdrawalStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  paid: "Paid ✓",
  failed: "Failed",
};

export function workerPayout(b: Booking) {
  return b.workerPayout;
}

export type Transaction = {
  id: string;
  type: "customer_payment" | "commission_credit" | "worker_payout_due" | "worker_payout_paid" | "commission_withdrawal" | "wallet_deposit";
  amount: number;
  bookingCode: string | null;
  workerId: string | null;
  reference: string | null;
  note: string | null;
  date: string;
};

export const txnLabels: Record<Transaction["type"], string> = {
  customer_payment: "Customer payment",
  commission_credit: "Commission (Admin Wallet)",
  worker_payout_due: "Worker payout due",
  worker_payout_paid: "Worker payout paid",
  commission_withdrawal: "Admin withdrawal",
  wallet_deposit: "Customer wallet deposit",
};
