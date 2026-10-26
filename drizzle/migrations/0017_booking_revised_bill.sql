ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS original_amount integer, ADD COLUMN IF NOT EXISTS bill_amount integer, ADD COLUMN IF NOT EXISTS bill_note text, ADD COLUMN IF NOT EXISTS bill_status text NOT NULL DEFAULT 'none', ADD COLUMN IF NOT EXISTS bill_updated_at timestamptz;

CREATE OR REPLACE FUNCTION public.worker_propose_bill(_code text, _amount integer, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bookings;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE code = _code FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS (SELECT 1 FROM public.workers w WHERE w.id = b.worker_id AND w.user_id = auth.uid()) THEN RAISE EXCEPTION 'Booking not assigned to you'; END IF;
  IF b.payment = 'paid' OR b.status IN ('cancelled','completed') THEN RAISE EXCEPTION 'Is booking ka bill ab nahi badal sakta'; END IF;
  IF _amount < 50 OR _amount > 1000000 THEN RAISE EXCEPTION 'Amount ₹50 se ₹10,00,000 ke beech ho'; END IF;
  IF length(trim(coalesce(_note,''))) < 5 THEN RAISE EXCEPTION 'Kaam ki details likhein'; END IF;
  UPDATE public.bookings SET bill_amount = _amount, bill_note = left(trim(_note), 500), bill_status = 'pending', bill_updated_at = now() WHERE code = _code;
END $$;

CREATE OR REPLACE FUNCTION public.customer_respond_bill(_code text, _accept boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.bookings; c integer;
BEGIN
  SELECT * INTO b FROM public.bookings WHERE code = _code FOR UPDATE;
  IF NOT FOUND OR b.user_id <> auth.uid() THEN RAISE EXCEPTION 'Booking not found'; END IF;
  IF b.bill_status <> 'pending' OR b.payment = 'paid' THEN RAISE EXCEPTION 'Koi pending bill nahi hai'; END IF;
  IF _accept THEN
    c := round(b.bill_amount * b.commission_percent / 100.0)::integer;
    UPDATE public.bookings SET original_amount = coalesce(original_amount, amount), amount = b.bill_amount, commission = c, worker_payout = b.bill_amount - c, bill_status = 'accepted', bill_updated_at = now() WHERE code = _code;
  ELSE
    UPDATE public.bookings SET bill_status = 'rejected', bill_updated_at = now() WHERE code = _code;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.worker_propose_bill(text, integer, text) FROM public, anon;
REVOKE ALL ON FUNCTION public.customer_respond_bill(text, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.worker_propose_bill(text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.customer_respond_bill(text, boolean) TO authenticated;