CREATE TABLE public.services (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL,
  tint text NOT NULL CHECK (tint IN ('amber', 'lav', 'volt')),
  price integer CHECK (price IS NULL OR price > 0),
  commission integer CHECK (commission IS NULL OR commission >= 0),
  status text NOT NULL DEFAULT 'coming_soon' CHECK (status IN ('active', 'coming_soon')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services readable" ON public.services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin manage services" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reward_credited boolean NOT NULL DEFAULT false;

COMMENT ON TABLE public.service_commissions IS 'DEPRECATED: service price and commission are now stored in public.services';

CREATE OR REPLACE FUNCTION public.create_booking(
  _worker_id text,
  _booking_date text,
  _booking_time text,
  _address text
)
RETURNS public.bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _profile public.profiles;
  _worker public.workers;
  _service public.services;
  _booking public.bookings;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF length(trim(COALESCE(_address, ''))) < 5 THEN RAISE EXCEPTION 'valid address required'; END IF;
  IF length(trim(COALESCE(_booking_date, ''))) = 0 OR length(trim(COALESCE(_booking_time, ''))) = 0 THEN
    RAISE EXCEPTION 'date and time required';
  END IF;

  SELECT * INTO _profile FROM public.profiles WHERE id = auth.uid();
  IF _profile.id IS NULL OR length(trim(COALESCE(_profile.full_name, ''))) = 0 THEN
    RAISE EXCEPTION 'complete profile required';
  END IF;

  SELECT * INTO _worker FROM public.workers WHERE id = _worker_id AND available = true AND kyc = 'verified';
  IF _worker.id IS NULL THEN RAISE EXCEPTION 'worker unavailable'; END IF;

  SELECT * INTO _service FROM public.services
  WHERE id = _worker.service_id AND status = 'active' AND price IS NOT NULL AND commission IS NOT NULL;
  IF _service.id IS NULL THEN RAISE EXCEPTION 'service unavailable'; END IF;
  IF _service.commission > _service.price THEN RAISE EXCEPTION 'invalid service pricing'; END IF;

  INSERT INTO public.bookings (
    user_id, customer_name, customer_phone, worker_id, service_id,
    amount, commission, booking_date, booking_time, address
  ) VALUES (
    auth.uid(), trim(_profile.full_name), COALESCE(_profile.phone, ''), _worker.id, _service.id,
    _service.price, _service.commission, trim(_booking_date), trim(_booking_time), trim(_address)
  ) RETURNING * INTO _booking;
  RETURN _booking;
END;
$$;
REVOKE ALL ON FUNCTION public.create_booking(text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_booking(text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_own_booking(_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE code = _code AND user_id = auth.uid() AND status IN ('pending', 'accepted') AND payment = 'unpaid';
  IF NOT FOUND THEN RAISE EXCEPTION 'booking cannot be cancelled'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.cancel_own_booking(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_own_booking(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.rate_own_booking(_code text, _rating integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _rating < 1 OR _rating > 5 THEN RAISE EXCEPTION 'invalid rating'; END IF;
  UPDATE public.bookings
  SET rating = _rating
  WHERE code = _code AND user_id = auth.uid() AND status = 'completed' AND rating IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'booking cannot be rated'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.rate_own_booking(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rate_own_booking(text, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_own_worker_availability(_available boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  UPDATE public.workers SET available = _available WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'worker profile not linked'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.set_own_worker_availability(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_own_worker_availability(boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.set_assigned_booking_status(_code text, _status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _current text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _status NOT IN ('accepted', 'in_progress', 'completed', 'cancelled') THEN RAISE EXCEPTION 'invalid status'; END IF;
  SELECT b.status INTO _current
  FROM public.bookings b JOIN public.workers w ON w.id = b.worker_id
  WHERE b.code = _code AND w.user_id = auth.uid() FOR UPDATE;
  IF _current IS NULL THEN RAISE EXCEPTION 'job not assigned'; END IF;
  IF NOT ((_current = 'pending' AND _status IN ('accepted', 'cancelled')) OR
          (_current = 'accepted' AND _status = 'in_progress') OR
          (_current = 'in_progress' AND _status = 'completed')) THEN
    RAISE EXCEPTION 'invalid status transition';
  END IF;
  UPDATE public.bookings SET status = _status WHERE code = _code;
END;
$$;
REVOKE ALL ON FUNCTION public.set_assigned_booking_status(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_assigned_booking_status(text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_link_worker(
  _email text,
  _name text,
  _service_id text,
  _exp_years integer,
  _photo text DEFAULT ''
)
RETURNS public.workers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE _user_id uuid; _service public.services; _worker public.workers;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admin required'; END IF;
  SELECT id INTO _user_id FROM auth.users WHERE lower(email) = lower(trim(_email));
  IF _user_id IS NULL THEN RAISE EXCEPTION 'email account not found'; END IF;
  SELECT * INTO _service FROM public.services WHERE id = _service_id;
  IF _service.id IS NULL THEN RAISE EXCEPTION 'service not found'; END IF;
  IF length(trim(COALESCE(_name, ''))) < 2 THEN RAISE EXCEPTION 'worker name required'; END IF;
  IF _exp_years < 0 OR _exp_years > 80 THEN RAISE EXCEPTION 'invalid experience'; END IF;
  IF EXISTS (SELECT 1 FROM public.workers WHERE user_id = _user_id) THEN RAISE EXCEPTION 'account already linked'; END IF;

  INSERT INTO public.workers (id, user_id, name, service_id, role, exp_years, rating, jobs_done, distance_km, photo, available, kyc)
  VALUES (gen_random_uuid()::text, _user_id, trim(_name), _service.id, _service.name, _exp_years, 0, 0, 0, trim(COALESCE(_photo, '')), false, 'pending')
  RETURNING * INTO _worker;
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'worker') ON CONFLICT (user_id, role) DO NOTHING;
  RETURN _worker;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_link_worker(text, text, text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_link_worker(text, text, text, integer, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.add_reward_points(integer) FROM authenticated;
REVOKE UPDATE ON public.bookings FROM authenticated;
REVOKE INSERT ON public.bookings FROM authenticated;
REVOKE UPDATE ON public.workers FROM authenticated;