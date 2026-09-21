-- reward points on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reward_points integer NOT NULL DEFAULT 0;

-- service commissions (admin editable)
CREATE TABLE IF NOT EXISTS public.service_commissions (
  service_id text PRIMARY KEY,
  commission integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_commissions TO anon, authenticated;
GRANT INSERT, UPDATE ON public.service_commissions TO authenticated;
GRANT ALL ON public.service_commissions TO service_role;
ALTER TABLE public.service_commissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "commissions readable" ON public.service_commissions;
CREATE POLICY "commissions readable" ON public.service_commissions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin manage commissions" ON public.service_commissions;
CREATE POLICY "admin manage commissions" ON public.service_commissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.service_commissions (service_id, commission) VALUES
  ('electrician', 20), ('plumber', 20), ('ac', 30), ('carpenter', 20),
  ('painter', 25), ('cleaning', 15), ('locksmith', 15)
ON CONFLICT (service_id) DO NOTHING;

-- workers
CREATE TABLE IF NOT EXISTS public.workers (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  service_id text NOT NULL,
  role text NOT NULL,
  exp_years integer NOT NULL DEFAULT 1,
  rating numeric NOT NULL DEFAULT 4.5,
  jobs_done integer NOT NULL DEFAULT 0,
  distance_km numeric NOT NULL DEFAULT 2,
  photo text NOT NULL DEFAULT 'suresh',
  available boolean NOT NULL DEFAULT true,
  kyc text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.workers TO authenticated;
GRANT ALL ON public.workers TO service_role;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workers readable" ON public.workers;
CREATE POLICY "workers readable" ON public.workers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admin manage workers" ON public.workers;
CREATE POLICY "admin manage workers" ON public.workers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "worker updates own row" ON public.workers;
CREATE POLICY "worker updates own row" ON public.workers FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

INSERT INTO public.workers (id, name, service_id, role, exp_years, rating, jobs_done, distance_km, photo, available, kyc) VALUES
  ('w1', 'Suresh Patil', 'electrician', 'Electrician', 7, 4.8, 132, 2.1, 'suresh', true, 'verified'),
  ('w2', 'Imran Shaikh', 'plumber', 'Plumber', 5, 4.9, 86, 1.4, 'imran', true, 'verified'),
  ('w3', 'Vikram Singh', 'ac', 'AC Mechanic', 9, 4.7, 203, 3.0, 'vikram', true, 'pending'),
  ('w4', 'Ramesh Verma', 'electrician', 'Electrician', 4, 4.6, 54, 3.8, 'suresh', true, 'pending'),
  ('w5', 'Anil Gupta', 'ac', 'AC Mechanic', 6, 4.5, 71, 4.2, 'vikram', true, 'verified')
ON CONFLICT (id) DO NOTHING;

-- bookings
CREATE SEQUENCE IF NOT EXISTS public.booking_code_seq START 1043;
CREATE TABLE IF NOT EXISTS public.bookings (
  code text PRIMARY KEY DEFAULT ('BK-' || nextval('public.booking_code_seq')),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_phone text NOT NULL DEFAULT '',
  worker_id text NOT NULL REFERENCES public.workers(id) ON DELETE RESTRICT,
  service_id text NOT NULL,
  amount integer NOT NULL,
  commission integer NOT NULL,
  booking_date text NOT NULL,
  booking_time text NOT NULL,
  address text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment text NOT NULL DEFAULT 'unpaid',
  rating integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
GRANT USAGE ON SEQUENCE public.booking_code_seq TO authenticated;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own or assigned or admin" ON public.bookings;
CREATE POLICY "read own or assigned or admin" ON public.bookings FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.workers w WHERE w.id = bookings.worker_id AND w.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert own bookings" ON public.bookings;
CREATE POLICY "insert own bookings" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "update own or assigned or admin" ON public.bookings;
CREATE POLICY "update own or assigned or admin" ON public.bookings FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.workers w WHERE w.id = bookings.worker_id AND w.user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.workers w WHERE w.id = bookings.worker_id AND w.user_id = auth.uid())
  );

-- withdrawals (merchant wallet, admin only)
CREATE SEQUENCE IF NOT EXISTS public.withdrawal_code_seq START 209;
CREATE TABLE IF NOT EXISTS public.withdrawals (
  code text PRIMARY KEY DEFAULT ('WD-' || nextval('public.withdrawal_code_seq')),
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  account text NOT NULL,
  requested_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.withdrawals TO authenticated;
GRANT ALL ON public.withdrawals TO service_role;
GRANT USAGE ON SEQUENCE public.withdrawal_code_seq TO authenticated;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin manage withdrawals" ON public.withdrawals;
CREATE POLICY "admin manage withdrawals" ON public.withdrawals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- reward vouchers
CREATE TABLE IF NOT EXISTS public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points integer NOT NULL,
  value integer NOT NULL,
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.vouchers TO authenticated;
GRANT ALL ON public.vouchers TO service_role;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own vouchers" ON public.vouchers;
CREATE POLICY "own vouchers" ON public.vouchers FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "insert own vouchers" ON public.vouchers;
CREATE POLICY "insert own vouchers" ON public.vouchers FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- reward point helpers (secure, prevents arbitrary point edits)
CREATE OR REPLACE FUNCTION public.add_reward_points(_points integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_total integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _points < 0 OR _points > 100 THEN RAISE EXCEPTION 'invalid points'; END IF;
  UPDATE public.profiles SET reward_points = reward_points + _points, updated_at = now()
  WHERE id = auth.uid() RETURNING reward_points INTO new_total;
  RETURN COALESCE(new_total, 0);
END; $$;
GRANT EXECUTE ON FUNCTION public.add_reward_points(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.redeem_reward_points()
RETURNS public.vouchers LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE pts integer; v public.vouchers;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT reward_points INTO pts FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF COALESCE(pts, 0) < 100 THEN RAISE EXCEPTION 'not enough points'; END IF;
  UPDATE public.profiles SET reward_points = reward_points - 100, updated_at = now() WHERE id = auth.uid();
  INSERT INTO public.vouchers (user_id, points, value, code)
  VALUES (auth.uid(), 100, 50, 'BADRE' || lpad((1000 + floor(random() * 9000))::int::text, 4, '0'))
  RETURNING * INTO v;
  RETURN v;
END; $$;
GRANT EXECUTE ON FUNCTION public.redeem_reward_points() TO authenticated;