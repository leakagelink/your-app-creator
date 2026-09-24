import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type {
  Booking,
  BookingStatus,
  Service,
  Transaction,
  Withdrawal,
  WithdrawalStatus,
  Worker,
} from "./data";

export type Voucher = { id: string; points: number; value: number; code: string; date: string };

type StoreContextValue = {
  loading: boolean;
  error: string | null;
  services: Service[];
  workers: Worker[];
  bookings: Booking[];
  withdrawals: Withdrawal[];
  rewardPoints: number;
  ratings: Record<string, number>;
  vouchers: Voucher[];
  transactions: Transaction[];
  commissionPercent: number;
  setCommissionPercent: (percent: number) => Promise<boolean>;
  markBookingPaid: (id: string, method: "cash" | "upi" | "bank", ref: string) => Promise<string | null>;
  markWorkerPaid: (id: string, ref: string) => Promise<string | null>;
  currentWorker: Worker | null;
  commissionWallet: { total: number; withdrawn: number; pending: number; available: number };
  refresh: () => Promise<void>;
  addBooking: (b: { workerId: string; date: string; time: string; address: string }) => Promise<Booking | null>;
  setBookingStatus: (id: string, status: BookingStatus) => Promise<boolean>;
  cancelBooking: (id: string) => Promise<boolean>;
  rateBooking: (id: string, stars: number) => Promise<boolean>;
  redeemReward: () => Promise<Voucher | null>;
  toggleWorkerAvailable: (id: string) => Promise<boolean>;
  verifyKyc: (id: string) => Promise<boolean>;
  updateService: (id: string, price: number | null, commission: number | null, status: Service["status"]) => Promise<boolean>;
  addWorker: (input: { email: string; name: string; serviceId: string; expYears: number; photo: string }) => Promise<string | null>;
  requestWithdrawal: (amount: number, account: string) => Promise<boolean>;
  setWithdrawalStatus: (id: string, status: WithdrawalStatus) => Promise<boolean>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

type WorkerRow = { id: string; user_id: string | null; name: string; service_id: string; role: string; exp_years: number; rating: number | string; jobs_done: number; distance_km: number | string; photo: string; available: boolean; kyc: string };
type BookingRow = { code: string; customer_name: string; customer_phone: string; worker_id: string; service_id: string; amount: number; commission: number; booking_date: string; booking_time: string; address: string; status: string; payment: string; rating: number | null; created_at: string; worker_payout: number; commission_percent: number | string; payout_status: string; payment_method: string | null; payment_ref: string | null; payout_ref: string | null };
type WithdrawalRow = { code: string; amount: number; status: string; account: string; requested_on: string };

const mapService = (r: { id: string; name: string; icon: string; tint: string; price: number | null; commission: number | null; status: string }): Service => ({
  id: r.id, name: r.name, icon: r.icon, tint: (r.tint === "lav" || r.tint === "volt" ? r.tint : "amber"), price: r.price, commission: r.commission, status: r.status === "active" ? "active" : "coming_soon",
});
const mapWorker = (r: WorkerRow): Worker => ({
  id: r.id, userId: r.user_id, name: r.name, serviceId: r.service_id, role: r.role,
  expYears: r.exp_years, rating: Number(r.rating), jobsDone: r.jobs_done,
  distanceKm: Number(r.distance_km), img: r.photo.trim() || null, available: r.available,
  kyc: r.kyc === "verified" ? "verified" : "pending",
});
const mapBooking = (r: BookingRow): Booking => ({
  id: r.code, customerName: r.customer_name, customerPhone: r.customer_phone,
  workerId: r.worker_id, serviceId: r.service_id, amount: r.amount, commission: r.commission,
  date: r.booking_date, time: r.booking_time, address: r.address,
  status: r.status as BookingStatus, payment: r.payment as Booking["payment"],
  createdAt: new Date(r.created_at).getTime(),
  workerPayout: r.worker_payout ?? r.amount - r.commission, commissionPercent: Number(r.commission_percent ?? 4),
  payoutStatus: (r.payout_status === "due" || r.payout_status === "paid" ? r.payout_status : "not_due"),
  paymentMethod: r.payment_method ?? null, paymentRef: r.payment_ref ?? null, payoutRef: r.payout_ref ?? null,
});
const mapWithdrawal = (r: WithdrawalRow): Withdrawal => ({ id: r.code, amount: r.amount, status: r.status as WithdrawalStatus, date: r.requested_on, account: r.account });

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, profile, isAdmin, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [commissionPercent, setPct] = useState(4);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [serviceResult, workerResult, settingsResult] = await Promise.all([
      supabase.from("services").select("*").order("created_at"),
      supabase.from("workers").select("*").order("created_at"),
      supabase.from("app_settings").select("commission_percent").eq("id", 1).maybeSingle(),
    ]);
    if (settingsResult.data) setPct(Number(settingsResult.data.commission_percent));
    const publicError = serviceResult.error ?? workerResult.error;
    setServices((serviceResult.data ?? []).map(mapService));
    setWorkers(((workerResult.data ?? []) as WorkerRow[]).map(mapWorker));
    if (user) {
      const [bookingResult, withdrawalResult, voucherResult, txnResult] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
        supabase.from("vouchers").select("*").order("created_at", { ascending: false }),
        supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(500),
      ]);
      setTransactions((txnResult.data ?? []).map((t) => ({ id: t.id, type: t.type as Transaction["type"], amount: t.amount, bookingCode: t.booking_code, workerId: t.worker_id, reference: t.reference, note: t.note, date: new Date(t.created_at).toLocaleString("en-IN") })));
      const rows = (bookingResult.data ?? []) as BookingRow[];
      setBookings(rows.map(mapBooking));
      setRatings(Object.fromEntries(rows.filter((r) => r.rating != null).map((r) => [r.code, r.rating as number])));
      setWithdrawals(((withdrawalResult.data ?? []) as WithdrawalRow[]).map(mapWithdrawal));
      setVouchers((voucherResult.data ?? []).map((r) => ({ id: r.id, points: r.points, value: r.value, code: r.code, date: String(r.created_at).slice(0, 10) })));
      setError((publicError ?? bookingResult.error)?.message ?? null);
    } else {
      setBookings([]); setWithdrawals([]); setVouchers([]); setRatings({}); setTransactions([]);
      setError(publicError?.message ?? null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  const value = useMemo<StoreContextValue>(() => {
    const paid = bookings.filter((b) => b.payment === "paid" && b.status !== "cancelled");
    const total = paid.reduce((sum, b) => sum + b.commission, 0);
    const withdrawn = withdrawals.filter((w) => w.status === "paid").reduce((sum, w) => sum + w.amount, 0);
    const pending = withdrawals.filter((w) => w.status === "pending" || w.status === "processing").reduce((sum, w) => sum + w.amount, 0);
    const currentWorker = workers.find((w) => w.userId === user?.id) ?? null;
    return {
      loading, error, services, workers, bookings, withdrawals, vouchers, ratings, currentWorker, transactions, commissionPercent,
      setCommissionPercent: async (percent) => {
        if (!isAdmin) return false;
        const { error: rpcError } = await supabase.rpc("admin_set_commission_percent", { _percent: percent });
        if (!rpcError) await refresh();
        return !rpcError;
      },
      markBookingPaid: async (id, method, ref) => {
        if (!isAdmin) return "Admin access required";
        const { error: rpcError } = await supabase.rpc("admin_mark_booking_paid", { _code: id, _method: method, _ref: ref.trim() });
        if (!rpcError) { await refresh(); return null; }
        return rpcError.message;
      },
      markWorkerPaid: async (id, ref) => {
        if (!isAdmin) return "Admin access required";
        const { error: rpcError } = await supabase.rpc("admin_mark_worker_paid", { _code: id, _ref: ref.trim() });
        if (!rpcError) { await refresh(); return null; }
        return rpcError.message;
      },
      rewardPoints: profile?.reward_points ?? 0,
      commissionWallet: { total, withdrawn, pending, available: Math.max(0, total - withdrawn - pending) },
      refresh,
      addBooking: async ({ workerId, date, time, address }) => {
        if (!user || !address.trim()) return null;
        const { data, error: rpcError } = await supabase.rpc("create_booking", { _worker_id: workerId, _booking_date: date, _booking_time: time, _address: address.trim() });
        if (rpcError || !data) return null;
        await refresh();
        return mapBooking(data as BookingRow);
      },
      setBookingStatus: async (id, status) => {
        const { error: rpcError } = await supabase.rpc("set_assigned_booking_status", { _code: id, _status: status });
        if (!rpcError) await refresh();
        return !rpcError;
      },
      cancelBooking: async (id) => {
        const { error: rpcError } = await supabase.rpc("cancel_own_booking", { _code: id });
        if (!rpcError) await refresh();
        return !rpcError;
      },
      rateBooking: async (id, stars) => {
        const { error: rpcError } = await supabase.rpc("rate_own_booking", { _code: id, _rating: stars });
        if (!rpcError) await refresh();
        return !rpcError;
      },
      redeemReward: async () => {
        const { data, error: rpcError } = await supabase.rpc("redeem_reward_points");
        if (rpcError || !data) return null;
        await Promise.all([refresh(), refreshProfile()]);
        return { id: data.id, points: data.points, value: data.value, code: data.code, date: String(data.created_at).slice(0, 10) };
      },
      toggleWorkerAvailable: async (id) => {
        const worker = workers.find((w) => w.id === id);
        if (!worker || worker.userId !== user?.id) return false;
        const { error: rpcError } = await supabase.rpc("set_own_worker_availability", { _available: !worker.available });
        if (!rpcError) await refresh();
        return !rpcError;
      },
      verifyKyc: async (id) => {
        if (!isAdmin) return false;
        const { error: rpcError } = await supabase.rpc("admin_set_worker_kyc", { _worker_id: id, _kyc: "verified" });
        if (!rpcError) await refresh();
        return !rpcError;
      },
      updateService: async (id, price, commission, status) => {
        if (!isAdmin) return false;
        const { error: rpcError } = await supabase.rpc("admin_update_service", { _service_id: id, _price: price ?? -1, _commission: commission ?? -1, _status: status });
        if (!rpcError) await refresh();
        return !rpcError;
      },
      addWorker: async ({ email, name, serviceId, expYears, photo }) => {
        if (!isAdmin) return "Admin access required";
        const { error: rpcError } = await supabase.rpc("admin_link_worker", { _email: email.trim(), _name: name.trim(), _service_id: serviceId, _exp_years: expYears, _photo: photo.trim() });
        if (!rpcError) { await refresh(); return null; }
        return rpcError.message;
      },
      requestWithdrawal: async (amount, account) => {
        if (!isAdmin || !account.trim() || amount <= 0 || amount > Math.max(0, total - withdrawn - pending)) return false;
        const { error: rpcError } = await supabase.rpc("admin_request_withdrawal", { _amount: amount, _account: account.trim() });
        if (!rpcError) await refresh();
        return !rpcError;
      },
      setWithdrawalStatus: async (id, status) => {
        if (!isAdmin) return false;
        const { error: rpcError } = await supabase.rpc("admin_set_withdrawal_status", { _code: id, _status: status });
        if (!rpcError) await refresh();
        return !rpcError;
      },
    };
  }, [loading, error, services, workers, bookings, withdrawals, vouchers, ratings, transactions, commissionPercent, profile, user, isAdmin, refresh, refreshProfile]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
}

export function inr(amount: number) { return `₹${amount.toLocaleString("en-IN")}`; }