import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  initialWorkers,
  services,
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

type StoreState = {
  workers: Worker[];
  bookings: Booking[];
  withdrawals: Withdrawal[];
  rewardPoints: number;
  ratings: Record<string, number>;
  vouchers: Voucher[];
  currentWorkerId: string;
};

const seedBookings: Booking[] = [
  {
    id: "BK-1042",
    customerName: "Rohan Kumar",
    customerPhone: "98xxxxxx21",
    workerId: "w1",
    serviceId: "electrician",
    amount: 500,
    commission: 20,
    date: "2026-09-15",
    time: "11:00 AM",
    address: "Flat 402, Shree Heights, Pune",
    status: "completed",
    payment: "paid",
    createdAt: Date.now() - 86400000,
  },
  {
    id: "BK-1041",
    customerName: "Priya Sharma",
    customerPhone: "97xxxxxx45",
    workerId: "w3",
    serviceId: "ac",
    amount: 800,
    commission: 30,
    date: "2026-09-14",
    time: "4:30 PM",
    address: "B-12, Green Park, Pune",
    status: "completed",
    payment: "paid",
    createdAt: Date.now() - 172800000,
  },
];

const seedWithdrawals: Withdrawal[] = [
  { id: "WD-207", amount: 1500, status: "paid", date: "2026-09-10", account: "HDFC ****4521" },
  { id: "WD-208", amount: 800, status: "processing", date: "2026-09-14", account: "HDFC ****4521" },
];

const initialState: StoreState = {
  workers: initialWorkers,
  bookings: seedBookings,
  withdrawals: seedWithdrawals,
  rewardPoints: 120,
  ratings: {},
  vouchers: [],
  currentWorkerId: "w1",
};

const STORAGE_KEY = "badre-store-v1";

type StoreContextValue = StoreState & {
  commissionWallet: { total: number; withdrawn: number; pending: number; available: number };
  addBooking: (b: Omit<Booking, "id" | "createdAt" | "status" | "payment">) => Booking;
  setBookingStatus: (id: string, status: BookingStatus) => void;
  payBooking: (id: string) => void;
  cancelBooking: (id: string) => void;
  rateBooking: (id: string, stars: number) => void;
  redeemReward: () => Voucher | null;
  toggleWorkerAvailable: (id: string) => void;
  verifyKyc: (id: string) => void;
  setCurrentWorker: (id: string) => void;
  updateServiceCommission: (serviceId: string, commission: number) => void;
  commissions: Record<string, number>;
  requestWithdrawal: (amount: number, account: string) => void;
  setWithdrawalStatus: (id: string, status: WithdrawalStatus) => void;
  resetDemoData: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(initialState);
  const [commissions, setCommissions] = useState<Record<string, number>>(() =>
    Object.fromEntries(services.map((s) => [s.id, s.commission])),
  );

  // Load persisted state after hydration (avoids SSR mismatch)
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.state) setState({ ...initialState, ...parsed.state });
        if (parsed.commissions)
          setCommissions((c) => ({ ...c, ...parsed.commissions }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, commissions }));
    } catch {
      /* ignore */
    }
  }, [state, commissions]);

  const value = useMemo<StoreContextValue>(() => {
    const paid = state.bookings.filter(
      (b) => b.payment === "paid" && b.status !== "cancelled",
    );
    const total = paid.reduce((s, b) => s + b.commission, 0);
    const withdrawn = state.withdrawals
      .filter((w) => w.status === "paid")
      .reduce((s, w) => s + w.amount, 0);
    const pendingW = state.withdrawals
      .filter((w) => w.status === "pending" || w.status === "processing")
      .reduce((s, w) => s + w.amount, 0);

    return {
      ...state,
      commissions,
      commissionWallet: {
        total,
        withdrawn,
        pending: pendingW,
        available: Math.max(0, total - withdrawn - pendingW),
      },
      addBooking: (b) => {
        const booking: Booking = {
          ...b,
          id: `BK-${1043 + state.bookings.length}`,
          status: "pending",
          payment: "unpaid",
          createdAt: Date.now(),
        };
        setState((s) => ({ ...s, bookings: [booking, ...s.bookings] }));
        return booking;
      },
      setBookingStatus: (id, status) =>
        setState((s) => ({
          ...s,
          bookings: s.bookings.map((b) => (b.id === id ? { ...b, status } : b)),
        })),
      payBooking: (id) =>
        setState((s) => {
          const target = s.bookings.find((b) => b.id === id);
          if (!target || target.payment === "paid") return s;
          return {
            ...s,
            rewardPoints: s.rewardPoints + 10,
            bookings: s.bookings.map((b) =>
              b.id === id ? { ...b, payment: "paid" as const } : b,
            ),
          };
        }),
      cancelBooking: (id) =>
        setState((s) => ({
          ...s,
          bookings: s.bookings.map((b) =>
            b.id === id
              ? { ...b, status: "cancelled" as const, payment: b.payment === "paid" ? "refunded" as const : b.payment }
              : b,
          ),
        })),
      rateBooking: (id, stars) =>
        setState((s) => ({ ...s, ratings: { ...s.ratings, [id]: stars } })),
      redeemReward: () => {
        if (state.rewardPoints < 100) return null;
        const voucher: Voucher = {
          id: `VC-${state.vouchers.length + 1}`,
          points: 100,
          value: 50,
          code: `BADRE${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toISOString().slice(0, 10),
        };
        setState((s) => ({
          ...s,
          rewardPoints: Math.max(0, s.rewardPoints - 100),
          vouchers: [voucher, ...s.vouchers],
        }));
        return voucher;
      },
      toggleWorkerAvailable: (id) =>
        setState((s) => ({
          ...s,
          workers: s.workers.map((w) =>
            w.id === id ? { ...w, available: !w.available } : w,
          ),
        })),
      verifyKyc: (id) =>
        setState((s) => ({
          ...s,
          workers: s.workers.map((w) =>
            w.id === id ? { ...w, kyc: "verified" as const } : w,
          ),
        })),
      setCurrentWorker: (id) => setState((s) => ({ ...s, currentWorkerId: id })),
      updateServiceCommission: (serviceId, commission) =>
        setCommissions((c) => ({ ...c, [serviceId]: commission })),
      requestWithdrawal: (amount, account) =>
        setState((s) => ({
          ...s,
          withdrawals: [
            {
              id: `WD-${209 + s.withdrawals.length}`,
              amount,
              status: "pending",
              date: new Date().toISOString().slice(0, 10),
              account,
            },
            ...s.withdrawals,
          ],
        })),
      setWithdrawalStatus: (id, status) =>
        setState((s) => ({
          ...s,
          withdrawals: s.withdrawals.map((w) =>
            w.id === id ? { ...w, status } : w,
          ),
        })),
      resetDemoData: () => {
        setState(initialState);
        setCommissions(Object.fromEntries(services.map((s) => [s.id, s.commission])));
      },
    };
  }, [state, commissions]);

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
