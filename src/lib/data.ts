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
  kyc: "pending" | "verified";
};

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
  return b.amount - b.commission;
}
