import workerSuresh from "@/assets/worker-suresh.jpg";
import workerImran from "@/assets/worker-imran.jpg";
import workerVikram from "@/assets/worker-vikram.jpg";

export type Service = {
  id: string;
  name: string;
  icon: string;
  tint: "amber" | "lav" | "volt";
  price: number;
  commission: number;
};

export const services: Service[] = [
  { id: "electrician", name: "Electrician", icon: "⚡", tint: "amber", price: 500, commission: 20 },
  { id: "plumber", name: "Plumber", icon: "🔧", tint: "lav", price: 400, commission: 20 },
  { id: "ac", name: "AC Mechanic", icon: "❄️", tint: "volt", price: 800, commission: 30 },
  { id: "carpenter", name: "Carpenter", icon: "🪚", tint: "amber", price: 450, commission: 20 },
  { id: "painter", name: "Painter", icon: "🎨", tint: "lav", price: 600, commission: 25 },
  { id: "cleaning", name: "Cleaning", icon: "🧽", tint: "volt", price: 350, commission: 15 },
  { id: "locksmith", name: "Locksmith", icon: "🔒", tint: "amber", price: 300, commission: 15 },
];

export type Worker = {
  id: string;
  name: string;
  serviceId: string;
  role: string;
  expYears: number;
  rating: number;
  jobsDone: number;
  distanceKm: number;
  img: string;
  available: boolean;
  kyc: "pending" | "verified";
};

export const initialWorkers: Worker[] = [
  { id: "w1", name: "Suresh Patil", serviceId: "electrician", role: "Electrician", expYears: 7, rating: 4.8, jobsDone: 132, distanceKm: 2.1, img: workerSuresh, available: true, kyc: "verified" },
  { id: "w2", name: "Imran Shaikh", serviceId: "plumber", role: "Plumber", expYears: 5, rating: 4.9, jobsDone: 86, distanceKm: 1.4, img: workerImran, available: true, kyc: "verified" },
  { id: "w3", name: "Vikram Singh", serviceId: "ac", role: "AC Mechanic", expYears: 9, rating: 4.7, jobsDone: 203, distanceKm: 3.0, img: workerVikram, available: true, kyc: "pending" },
  { id: "w4", name: "Ramesh Verma", serviceId: "electrician", role: "Electrician", expYears: 4, rating: 4.6, jobsDone: 54, distanceKm: 3.8, img: workerSuresh, available: false, kyc: "pending" },
  { id: "w5", name: "Anil Gupta", serviceId: "ac", role: "AC Mechanic", expYears: 6, rating: 4.5, jobsDone: 71, distanceKm: 4.2, img: workerVikram, available: true, kyc: "verified" },
];

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
