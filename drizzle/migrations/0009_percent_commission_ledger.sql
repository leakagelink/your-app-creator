CREATE TABLE public.app_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  commission_percent numeric(5,2) NOT NULL DEFAULT 4,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings readable" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.app_settings (id, commission_percent) VALUES (1, 4);

ALTER TABLE public.bookings
  ADD COLUMN worker_payout integer NOT NULL DEFAULT 0,
  ADD COLUMN commission_percent numeric(5,2) NOT NULL DEFAULT 4,
  ADD COLUMN payout_status text NOT NULL DEFAULT 'not_due',
  ADD COLUMN payment_method text,
  ADD COLUMN payment_ref text,
  ADD COLUMN paid_at timestamptz,
  ADD COLUMN payout_ref text,
  ADD COLUMN payout_paid_at timestamptz;
UPDATE public.bookings SET worker_payout = amount - commission;

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  amount integer NOT NULL,
  booking_code text,
  worker_id text,
  customer_id uuid,
  reference text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin reads all transactions" ON public.transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "customer reads own payments" ON public.transactions FOR SELECT TO authenticated USING (customer_id = auth.uid() AND type = 'customer_payment');
CREATE POLICY "worker reads own payouts" ON public.transactions FOR SELECT TO authenticated USING (type IN ('worker_payout_due','worker_payout_paid') AND EXISTS (SELECT 1 FROM public.workers w WHERE w.id = transactions.worker_id AND w.user_id = auth.uid()));

-- Recalculate service commission from global percent
CREATE OR REPLACE FUNCTION public.calc_commission(_amount integer)
RETURNS integer LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT round(_amount * (SELECT commission_percent FROM public.app_settings WHERE id = 1) / 100.0)::integer
$$;

UPDATE public.services SET commission = public.calc_commission(price) WHERE price IS NOT NULL;

CREATE OR REPLACE FUNCTION public.admin_set_commission_percent(_percent numeric)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admin required'; END IF;
  IF _percent IS NULL OR _percent < 0 OR _percent > 50 THEN RAISE EXCEPTION 'invalid percent'; END IF;
  UPDATE public.app_settings SET commission_percent = _percent, updated_at = now() WHERE id = 1;
  UPDATE public.services SET commission = public.calc_commission(price), updated_at = now() WHERE price IS NOT NULL;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_update_service(_service_id text, _price integer, _commission integer, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _stored_price integer := NULLIF(_price, -1);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admin required'; END IF;
  IF _status NOT IN ('active', 'coming_soon') THEN RAISE EXCEPTION 'invalid service status'; END IF;
  IF _price < -1 OR _price = 0 THEN RAISE EXCEPTION 'invalid price'; END IF;
  IF _status = 'active' AND _stored_price IS NULL THEN RAISE EXCEPTION 'active service requires pricing'; END IF;
  UPDATE public.services
  SET price = _stored_price,
      commission = CASE WHEN _stored_price IS NULL THEN NULL ELSE public.calc_commission(_stored_price) END,
      status = _status, updated_at = now()
  WHERE id = _service_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'service not found'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.create_booking(_worker_id text, _booking_date text, _booking_time text, _address text)
RETURNS bookings LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _profile public.profiles; _worker public.workers; _service public.services; _booking public.bookings; _pct numeric; _comm integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF length(trim(COALESCE(_address, ''))) < 5 THEN RAISE EXCEPTION 'valid address required'; END IF;
  IF length(trim(COALESCE(_booking_date, ''))) = 0 OR length(trim(COALESCE(_booking_time, ''))) = 0 THEN RAISE EXCEPTION 'date and time required'; END IF;
  SELECT * INTO _profile FROM public.profiles WHERE id = auth.uid();
  IF _profile.id IS NULL OR length(trim(COALESCE(_profile.full_name, ''))) = 0 THEN RAISE EXCEPTION 'complete profile required'; END IF;
  SELECT * INTO _worker FROM public.workers WHERE id = _worker_id AND available = true AND kyc = 'verified';
  IF _worker.id IS NULL THEN RAISE EXCEPTION 'worker unavailable'; END IF;
  SELECT * INTO _service FROM public.services WHERE id = _worker.service_id AND status = 'active' AND price IS NOT NULL;
  IF _service.id IS NULL THEN RAISE EXCEPTION 'service unavailable'; END IF;
  SELECT commission_percent INTO _pct FROM public.app_settings WHERE id = 1;
  _comm := public.calc_commission(_service.price);
  INSERT INTO public.bookings (user_id, customer_name, customer_phone, worker_id, service_id, amount, commission, commission_percent, worker_payout, booking_date, booking_time, address)
  VALUES (auth.uid(), trim(_profile.full_name), COALESCE(_profile.phone, ''), _worker.id, _service.id, _service.price, _comm, _pct, _service.price - _comm, trim(_booking_date), trim(_booking_time), trim(_address))
  RETURNING * INTO _booking;
  RETURN _booking;
END; $$;

-- When a booking is both paid and completed, worker payout becomes due
CREATE OR REPLACE FUNCTION public.mark_payout_due_if_ready(_code text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bookings;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE code = _code FOR UPDATE;
  IF b.payment = 'paid' AND b.status = 'completed' AND b.payout_status = 'not_due' THEN
    UPDATE public.bookings SET payout_status = 'due' WHERE code = _code;
    INSERT INTO public.transactions (type, amount, booking_code, worker_id, note)
    VALUES ('worker_payout_due', b.worker_payout, b.code, b.worker_id, 'Kaam complete — worker payout due');
  END IF;
END; $$;
REVOKE EXECUTE ON FUNCTION public.mark_payout_due_if_ready(text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_assigned_booking_status(_code text, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _current text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _status NOT IN ('accepted', 'in_progress', 'completed', 'cancelled') THEN RAISE EXCEPTION 'invalid status'; END IF;
  SELECT b.status INTO _current FROM public.bookings b JOIN public.workers w ON w.id = b.worker_id
  WHERE b.code = _code AND w.user_id = auth.uid() FOR UPDATE;
  IF _current IS NULL THEN RAISE EXCEPTION 'job not assigned'; END IF;
  IF NOT ((_current = 'pending' AND _status IN ('accepted', 'cancelled')) OR
          (_current = 'accepted' AND _status = 'in_progress') OR
          (_current = 'in_progress' AND _status = 'completed')) THEN RAISE EXCEPTION 'invalid status transition'; END IF;
  UPDATE public.bookings SET status = _status WHERE code = _code;
  PERFORM public.mark_payout_due_if_ready(_code);
END; $$;

-- Admin records a verified customer payment received in merchant account
CREATE OR REPLACE FUNCTION public.admin_mark_booking_paid(_code text, _method text, _ref text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bookings;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admin required'; END IF;
  IF _method NOT IN ('cash', 'upi', 'bank') THEN RAISE EXCEPTION 'invalid method'; END IF;
  IF length(trim(COALESCE(_ref, ''))) < 3 THEN RAISE EXCEPTION 'payment reference required'; END IF;
  SELECT * INTO b FROM public.bookings WHERE code = _code FOR UPDATE;
  IF b.code IS NULL THEN RAISE EXCEPTION 'booking not found'; END IF;
  IF b.payment <> 'unpaid' OR b.status = 'cancelled' THEN RAISE EXCEPTION 'booking cannot be marked paid'; END IF;
  UPDATE public.bookings SET payment = 'paid', payment_method = _method, payment_ref = trim(_ref), paid_at = now() WHERE code = _code;
  INSERT INTO public.transactions (type, amount, booking_code, worker_id, customer_id, reference, note) VALUES
    ('customer_payment', b.amount, b.code, b.worker_id, b.user_id, trim(_ref), 'Customer payment (' || _method || ')'),
    ('commission_credit', b.commission, b.code, b.worker_id, NULL, trim(_ref), b.commission_percent || '% commission Admin Wallet mein');
  PERFORM public.mark_payout_due_if_ready(_code);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_mark_worker_paid(_code text, _ref text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bookings;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admin required'; END IF;
  IF length(trim(COALESCE(_ref, ''))) < 3 THEN RAISE EXCEPTION 'payout reference required'; END IF;
  SELECT * INTO b FROM public.bookings WHERE code = _code FOR UPDATE;
  IF b.code IS NULL OR b.payout_status <> 'due' THEN RAISE EXCEPTION 'payout not due'; END IF;
  UPDATE public.bookings SET payout_status = 'paid', payout_ref = trim(_ref), payout_paid_at = now() WHERE code = _code;
  INSERT INTO public.transactions (type, amount, booking_code, worker_id, reference, note)
  VALUES ('worker_payout_paid', b.worker_payout, b.code, b.worker_id, trim(_ref), 'Worker ko payout bheja gaya');
END; $$;

CREATE OR REPLACE FUNCTION public.admin_set_withdrawal_status(_code text, _status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _current text; _amount integer; _account text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admin required'; END IF;
  IF _status NOT IN ('processing', 'paid', 'failed') THEN RAISE EXCEPTION 'invalid withdrawal status'; END IF;
  SELECT status, amount, account INTO _current, _amount, _account FROM public.withdrawals WHERE code = _code FOR UPDATE;
  IF _current IS NULL THEN RAISE EXCEPTION 'withdrawal not found'; END IF;
  IF NOT ((_current = 'pending' AND _status IN ('processing', 'failed')) OR
          (_current = 'processing' AND _status IN ('paid', 'failed'))) THEN RAISE EXCEPTION 'invalid withdrawal transition'; END IF;
  UPDATE public.withdrawals SET status = _status WHERE code = _code;
  IF _status = 'paid' THEN
    INSERT INTO public.transactions (type, amount, reference, note) VALUES ('commission_withdrawal', _amount, _code, 'Admin withdrawal → ' || _account);
  END IF;
END; $$;

REVOKE EXECUTE ON FUNCTION public.calc_commission(integer) FROM anon;
