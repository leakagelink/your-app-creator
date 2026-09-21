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
import {
  services,
  workerPhotos,
  type Booking,
  type BookingStatus,
  type Withdrawal,
  type WithdrawalStatus,
  type Worker,
} from "./data";

export type Voucher = {
  id: string;
  points: number;
  value: number;
  code: string;
  date: string;
};

type StoreContextValue = {
  loading: boolean;
  workers: Worker[];
  bookings: Booking[];
  withdrawals: Withdrawal[];
  rewardPoints: number;
  ratings: Record<string, number>;
  vouchers: Voucher[];
  currentWorkerId: string;
  commissions: Record<string, number>;
  commissionWallet: { total: number; withdrawn: number; pending: number; available: number };
  refresh: () => Promise<void>;
  addBooking: (
    b: Omit<Booking, "id" | "createdAt" | "status" | "payment">,
  ) => Promise<Booking | null>;
  setBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  payBooking: (id: string) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  rateBooking: (id: string, stars: number) => Promise<void>;
  redeemReward: () => Promise<Voucher | null>;
  toggleWorkerAvailable: (id: string) => Promise<void>;
  verifyKyc: (id: string) => Promise<void>;
  setCurrentWorker: (id: string) => void;
  updateServiceCommission: (serviceId: string, commission: number) => Promise<void>;
  requestWithdrawal: (amount: number, account: string) => Promise<void>;
  setWithdrawalStatus: (id: string, status: WithdrawalStatus) => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

type WorkerRow = {
  id: string;
  name: string;
  service_id: string;
  role: string;
  exp_years: number;
  rating: number | string;
  jobs_done: number;
  distance_km: number | string;
  photo: string;
  available: boolean;
  kyc: string;
};

type BookingRow = {
  code: string;
  customer_name: string;
  customer_phone: string;
  worker_id: string;
  service_id: string;
  amount: number;
  commission: number;
  booking_date: string;
  booking_time: string;
  address: string;
  status: string;
  payment: string;
  rating: number | null;
  created_at: string;
};

type WithdrawalRow = {
  code: string;
  amount: number;
  status: string;
  account: string;
  requested_on: string;
};

function mapWorker(r: WorkerRow): Worker {
  return {
    id: r.id,
    name: r.name,
    serviceId: r.service_id,
    role: r.role,
    expYears: r.exp_years,
    rating: Number(r.rating),
    jobsDone: r.jobs_done,
    distanceKm: Number(r.distance_km),
    img: workerPhotos[r.photo] ?? workerPhotos["suresh"]!,
    available: r.available,
    kyc: r.kyc === "verified" ? "verified" : "pending",
  };
}

function mapBooking(r: BookingRow): Booking {
  return {
    id: r.code,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    workerId: r.worker_id,
    serviceId: r.service_id,
    amount: r.amount,
    commission: r.commission,
    date: r.booking_date,
    time: r.booking_time,
    address: r.address,
    status: r.status as BookingStatus,
    payment: r.payment as Booking["payment"],
    createdAt: new Date(r.created_at).getTime(),
  };
}

function mapWithdrawal(r: WithdrawalRow): Withdrawal {
  return {
    id: r.code,
    amount: r.amount,
    status: r.status as WithdrawalStatus,
    date: r.requested_on,
    account: r.account,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [commissions, setCommissions] = useState<Record<string, number>>(() =>
    Object.fromEntries(services.map((s) => [s.id, s.commission])),
  );
  const [currentWorkerId, setCurrentWorkerId] = useState("w1");

  const refresh = useCallback(async () => {
    const [w, c] = await Promise.all([
      supabase.from("workers").select("*").order("created_at", { ascending: true }),
      supabase.from("service_commissions").select("service_id, commission"),
    ]);
    setWorkers(((w.data ?? []) as unknown as WorkerRow[]).map(mapWorker));
    if (c.data?.length) {
      setCommissions((prev) => ({
        ...prev,
        ...Object.fromEntries(c.data.map((r) => [r.service_id, r.commission])),
      }));
    }

    if (user) {
      const [b, wd, v] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
        supabase.from("vouchers").select("*").order("created_at", { ascending: false }),
      ]);
      const rows = (b.data ?? []) as unknown as BookingRow[];
      setBookings(rows.map(mapBooking));
      setRatings(
        Object.fromEntries(
          rows.filter((r) => r.rating != null).map((r) => [r.code, r.rating as number]),
        ),
      );
      setWithdrawals(((wd.data ?? []) as unknown as WithdrawalRow[]).map(mapWithdrawal));
      setVouchers(
        (v.data ?? []).map((r) => ({
          id: r.id,
          points: r.points,
          value: r.value,
          code: r.code,
          date: String(r.created_at).slice(0, 10),
        })),
      );
    } else {
      setBookings([]);
      setWithdrawals([]);
      setVouchers([]);
      setRatings({});
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<StoreContextValue>(() => {
    const paid = bookings.filter((b) => b.payment === "paid" && b.status !== "cancelled");
    const total = paid.reduce((s, b) => s + b.commission, 0);
    const withdrawn = withdrawals
      .filter((w) => w.status === "paid")
      .reduce((s, w) => s + w.amount, 0);
    const pendingW = withdrawals
      .filter((w) => w.status === "pending" || w.status === "processing")
      .reduce((s, w) => s + w.amount, 0);

    type BookingPatch = {
      status?: string;
      payment?: string;
      rating?: number;
    };
    const updateBooking = async (id: string, patch: BookingPatch) => {
      await supabase.from("bookings").update(patch).eq("code", id);
      await refresh();
    };

    return {
      loading,
      workers,
      bookings,
      withdrawals,
      vouchers,
      ratings,
      commissions,
      currentWorkerId,
      rewardPoints: profile?.reward_points ?? 0,
      commissionWallet: {
        total,
        withdrawn,
        pending: pendingW,
        available: Math.max(0, total - withdrawn - pendingW),
      },
      refresh,
      addBooking: async (b) => {
        if (!user) return null;
        const { data, error } = await supabase
          .from("bookings")
          .insert({
            user_id: user.id,
            customer_name: b.customerName,
            customer_phone: b.customerPhone,
            worker_id: b.workerId,
            service_id: b.serviceId,
            amount: b.amount,
            commission: b.commission,
            booking_date: b.date,
            booking_time: b.time,
            address: b.address,
          })
          .select("*")
          .maybeSingle();
        if (error || !data) return null;
        await refresh();
        return mapBooking(data as unknown as BookingRow);
      },
      setBookingStatus: (id, status) => updateBooking(id, { status }),
      payBooking: async (id) => {
        const target = bookings.find((b) => b.id === id);
        if (!target || target.payment === "paid") return;
        await supabase.from("bookings").update({ payment: "paid" }).eq("code", id);
        await supabase.rpc("add_reward_points", { _points: 10 });
        await Promise.all([refresh(), refreshProfile()]);
      },
      cancelBooking: async (id) => {
        const target = bookings.find((b) => b.id === id);
        await updateBooking(id, {
          status: "cancelled",
          ...(target?.payment === "paid" ? { payment: "refunded" } : {}),
        });
      },
      rateBooking: (id, stars) => updateBooking(id, { rating: stars }),
      redeemReward: async () => {
        const { data, error } = await supabase.rpc("redeem_reward_points");
        if (error || !data) return null;
        const row = data as unknown as {
          id: string;
          points: number;
          value: number;
          code: string;
          created_at: string;
        };
        await Promise.all([refresh(), refreshProfile()]);
        return {
          id: row.id,
          points: row.points,
          value: row.value,
          code: row.code,
          date: String(row.created_at).slice(0, 10),
        };
      },
      toggleWorkerAvailable: async (id) => {
        const w = workers.find((x) => x.id === id);
        if (!w) return;
        await supabase.from("workers").update({ available: !w.available }).eq("id", id);
        await refresh();
      },
      verifyKyc: async (id) => {
        await supabase.from("workers").update({ kyc: "verified" }).eq("id", id);
        await refresh();
      },
      setCurrentWorker: (id) => setCurrentWorkerId(id),
      updateServiceCommission: async (serviceId, commission) => {
        setCommissions((c) => ({ ...c, [serviceId]: commission }));
        await supabase
          .from("service_commissions")
          .upsert({ service_id: serviceId, commission }, { onConflict: "service_id" });
      },
      requestWithdrawal: async (amount, account) => {
        await supabase.from("withdrawals").insert({ amount, account });
        await refresh();
      },
      setWithdrawalStatus: async (id, status) => {
        await supabase.from("withdrawals").update({ status }).eq("code", id);
        await refresh();
      },
    };
  }, [
    loading,
    workers,
    bookings,
    withdrawals,
    vouchers,
    ratings,
    commissions,
    currentWorkerId,
    profile,
    user,
    refresh,
    refreshProfile,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}
