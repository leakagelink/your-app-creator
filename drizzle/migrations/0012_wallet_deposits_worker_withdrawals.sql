ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS merchant_upi_id text NOT NULL DEFAULT '';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS merchant_name text NOT NULL DEFAULT 'Badre Electrician Service';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance integer NOT NULL DEFAULT 0;
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, city, updated_at) ON public.profiles TO authenticated;

CREATE SEQUENCE IF NOT EXISTS public.deposit_code_seq START 1001;
CREATE TABLE public.wallet_deposits (
  code text PRIMARY KEY DEFAULT ('DP-' || nextval('public.deposit_code_seq')),
  user_id uuid NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  utr text,
  status text NOT NULL DEFAULT 'awaiting_payment',
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '10 minutes',
  submitted_at timestamptz,
  reviewed_at timestamptz
);
CREATE UNIQUE INDEX wallet_deposits_utr_unique ON public.wallet_deposits (lower(utr)) WHERE utr IS NOT NULL AND status <> 'rejected';
GRANT SELECT ON public.wallet_deposits TO authenticated;
GRANT ALL ON public.wallet_deposits TO service_role;
ALTER TABLE public.wallet_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin deposits" ON public.wallet_deposits FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.payout_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  method_type text NOT NULL CHECK (method_type IN ('bank','upi','qr')),
  holder_name text NOT NULL,
  account_number text,
  ifsc text,
  upi_id text,
  qr_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.payout_methods TO authenticated;
GRANT ALL ON public.payout_methods TO service_role;
ALTER TABLE public.payout_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin payout methods" ON public.payout_methods FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "delete own payout methods" ON public.payout_methods FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE SEQUENCE IF NOT EXISTS public.worker_withdrawal_code_seq START 1001;
CREATE TABLE public.worker_withdrawals (
  code text PRIMARY KEY DEFAULT ('WW-' || nextval('public.worker_withdrawal_code_seq')),
  user_id uuid NOT NULL,
  worker_id text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  method_type text NOT NULL,
  destination text NOT NULL,
  qr_path text,
  status text NOT NULL DEFAULT 'pending',
  payout_ref text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.worker_withdrawals TO authenticated;
GRANT ALL ON public.worker_withdrawals TO service_role;
ALTER TABLE public.worker_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin worker withdrawals" ON public.worker_withdrawals FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.admin_set_merchant_upi(_upi text, _name text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF trim(_upi) !~ '^[A-Za-z0-9._-]{2,}@[A-Za-z0-9.-]{2,}$' THEN RAISE EXCEPTION 'Valid UPI ID likhein'; END IF;
  UPDATE public.app_settings SET merchant_upi_id = trim(_upi), merchant_name = coalesce(nullif(trim(_name),''), merchant_name), updated_at = now() WHERE id = 1;
END $$;

CREATE OR REPLACE FUNCTION public.start_wallet_deposit(_amount integer) RETURNS public.wallet_deposits
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.wallet_deposits;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
  IF _amount < 10 OR _amount > 100000 THEN RAISE EXCEPTION 'Amount ₹10 se ₹1,00,000 ke beech ho'; END IF;
  IF coalesce((SELECT merchant_upi_id FROM public.app_settings WHERE id = 1),'') = '' THEN RAISE EXCEPTION 'Admin ne abhi UPI ID set nahi ki'; END IF;
  UPDATE public.wallet_deposits SET status = 'expired' WHERE user_id = auth.uid() AND status = 'awaiting_payment' AND expires_at < now();
  INSERT INTO public.wallet_deposits (user_id, amount) VALUES (auth.uid(), _amount) RETURNING * INTO r;
  RETURN r;
END $$;

CREATE OR REPLACE FUNCTION public.submit_deposit_utr(_code text, _utr text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.wallet_deposits;
BEGIN
  SELECT * INTO r FROM public.wallet_deposits WHERE code = _code AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Deposit nahi mila'; END IF;
  IF r.status <> 'awaiting_payment' THEN RAISE EXCEPTION 'Yeh deposit already submit/expire ho chuka hai'; END IF;
  IF r.expires_at < now() THEN RAISE EXCEPTION '10 minute ka samay khatam ho gaya'; END IF;
  IF trim(_utr) !~ '^[A-Za-z0-9]{8,30}$' THEN RAISE EXCEPTION 'Sahi transaction ID / UTR likhein (8-30 letters/numbers)'; END IF;
  IF EXISTS (SELECT 1 FROM public.wallet_deposits WHERE lower(utr) = lower(trim(_utr)) AND status <> 'rejected') THEN RAISE EXCEPTION 'Yeh transaction ID pehle hi use ho chuki hai'; END IF;
  UPDATE public.wallet_deposits SET utr = trim(_utr), status = 'pending', submitted_at = now() WHERE code = _code;
END $$;

CREATE OR REPLACE FUNCTION public.admin_review_deposit(_code text, _approve boolean, _note text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.wallet_deposits;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT * INTO r FROM public.wallet_deposits WHERE code = _code FOR UPDATE;
  IF NOT FOUND OR r.status <> 'pending' THEN RAISE EXCEPTION 'Sirf pending deposit update ho sakta hai'; END IF;
  IF _approve THEN
    UPDATE public.wallet_deposits SET status = 'approved', reviewed_at = now(), admin_note = nullif(trim(_note),'') WHERE code = _code;
    UPDATE public.profiles SET wallet_balance = wallet_balance + r.amount WHERE id = r.user_id;
    INSERT INTO public.transactions (type, amount, customer_id, reference, note) VALUES ('wallet_deposit', r.amount, r.user_id, r.utr, r.code);
  ELSE
    UPDATE public.wallet_deposits SET status = 'rejected', reviewed_at = now(), admin_note = nullif(trim(_note),'') WHERE code = _code;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.pay_booking_from_wallet(_code text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bookings; bal integer;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE code = _code AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Booking nahi mili'; END IF;
  IF b.payment <> 'unpaid' OR b.status = 'cancelled' THEN RAISE EXCEPTION 'Is booking ka payment nahi ho sakta'; END IF;
  SELECT wallet_balance INTO bal FROM public.profiles WHERE id = auth.uid() FOR UPDATE;
  IF coalesce(bal,0) < b.amount THEN RAISE EXCEPTION 'Wallet mein balance kam hai'; END IF;
  UPDATE public.profiles SET wallet_balance = wallet_balance - b.amount WHERE id = auth.uid();
  UPDATE public.bookings SET payment = 'paid', payment_method = 'wallet', payment_ref = 'WALLET-' || b.code, paid_at = now() WHERE code = b.code;
  INSERT INTO public.transactions (type, amount, booking_code, worker_id, customer_id, reference, note)
  VALUES ('customer_payment', b.amount, b.code, b.worker_id, b.user_id, 'WALLET-' || b.code, 'Wallet se payment'),
         ('commission_credit', b.commission, b.code, b.worker_id, b.user_id, 'WALLET-' || b.code, 'Commission');
  PERFORM public.mark_payout_due_if_ready(b.code);
END $$;

CREATE OR REPLACE FUNCTION public.worker_available_balance(_user uuid) RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (coalesce((SELECT sum(b.worker_payout) FROM public.bookings b JOIN public.workers w ON w.id = b.worker_id
            WHERE w.user_id = _user AND b.payout_status = 'due'),0)
        - coalesce((SELECT sum(amount) FROM public.worker_withdrawals WHERE user_id = _user AND status IN ('pending','processing','paid')),0))::integer
$$;
REVOKE EXECUTE ON FUNCTION public.worker_available_balance(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.my_worker_balance() RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT public.worker_available_balance(auth.uid()) $$;

CREATE OR REPLACE FUNCTION public.add_payout_method(_type text, _holder text, _account text, _ifsc text, _upi text, _qr_path text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
  IF length(trim(coalesce(_holder,''))) < 2 THEN RAISE EXCEPTION 'Account holder ka naam likhein'; END IF;
  IF _type = 'bank' THEN
    IF trim(coalesce(_account,'')) !~ '^[0-9]{9,18}$' THEN RAISE EXCEPTION 'Sahi bank account number likhein'; END IF;
    IF upper(trim(coalesce(_ifsc,''))) !~ '^[A-Z]{4}0[A-Z0-9]{6}$' THEN RAISE EXCEPTION 'Sahi IFSC code likhein'; END IF;
    INSERT INTO public.payout_methods (user_id, method_type, holder_name, account_number, ifsc) VALUES (auth.uid(), 'bank', trim(_holder), trim(_account), upper(trim(_ifsc)));
  ELSIF _type = 'upi' THEN
    IF trim(coalesce(_upi,'')) !~ '^[A-Za-z0-9._-]{2,}@[A-Za-z0-9.-]{2,}$' THEN RAISE EXCEPTION 'Sahi UPI ID likhein'; END IF;
    INSERT INTO public.payout_methods (user_id, method_type, holder_name, upi_id) VALUES (auth.uid(), 'upi', trim(_holder), trim(_upi));
  ELSIF _type = 'qr' THEN
    IF coalesce(_qr_path,'') NOT LIKE auth.uid()::text || '/%' THEN RAISE EXCEPTION 'QR image upload karein'; END IF;
    INSERT INTO public.payout_methods (user_id, method_type, holder_name, qr_path) VALUES (auth.uid(), 'qr', trim(_holder), _qr_path);
  ELSE RAISE EXCEPTION 'Invalid method'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.request_worker_withdrawal(_amount integer, _method_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.payout_methods; wid text; dest text;
BEGIN
  SELECT id INTO wid FROM public.workers WHERE user_id = auth.uid();
  IF wid IS NULL THEN RAISE EXCEPTION 'Worker account required'; END IF;
  SELECT * INTO m FROM public.payout_methods WHERE id = _method_id AND user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Payout method chunein'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext('ww' || auth.uid()::text));
  IF _amount < 1 OR _amount > public.worker_available_balance(auth.uid()) THEN RAISE EXCEPTION 'Amount available balance se zyada hai'; END IF;
  dest := CASE m.method_type WHEN 'bank' THEN m.holder_name || ' · A/c ' || m.account_number || ' · ' || m.ifsc
                             WHEN 'upi' THEN m.holder_name || ' · UPI ' || m.upi_id
                             ELSE m.holder_name || ' · QR code' END;
  INSERT INTO public.worker_withdrawals (user_id, worker_id, amount, method_type, destination, qr_path)
  VALUES (auth.uid(), wid, _amount, m.method_type, dest, m.qr_path);
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_worker_withdrawal(_code text, _status text, _ref text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.worker_withdrawals;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT * INTO r FROM public.worker_withdrawals WHERE code = _code FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Request nahi mili'; END IF;
  IF NOT ((r.status = 'pending' AND _status IN ('processing','rejected')) OR (r.status = 'processing' AND _status IN ('paid','rejected'))) THEN
    RAISE EXCEPTION 'Yeh status change allowed nahi'; END IF;
  IF _status = 'paid' AND length(trim(coalesce(_ref,''))) < 3 THEN RAISE EXCEPTION 'Payout transaction ID likhein'; END IF;
  UPDATE public.worker_withdrawals SET status = _status, payout_ref = coalesce(nullif(trim(_ref),''), payout_ref), updated_at = now() WHERE code = _code;
  IF _status = 'paid' THEN
    INSERT INTO public.transactions (type, amount, worker_id, reference, note) VALUES ('worker_payout_paid', r.amount, r.worker_id, trim(_ref), 'Withdrawal ' || r.code);
  END IF;
END $$;

CREATE POLICY "upload own payout qr" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payout-qr' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "read own or admin payout qr" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payout-qr' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));