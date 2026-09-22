CREATE OR REPLACE FUNCTION public.admin_update_service(
  _service_id text,
  _price integer,
  _commission integer,
  _status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admin required'; END IF;
  IF _status NOT IN ('active', 'coming_soon') THEN RAISE EXCEPTION 'invalid service status'; END IF;
  IF _price IS NOT NULL AND _price <= 0 THEN RAISE EXCEPTION 'invalid price'; END IF;
  IF _commission IS NOT NULL AND _commission < 0 THEN RAISE EXCEPTION 'invalid commission'; END IF;
  IF _commission IS NOT NULL AND _price IS NOT NULL AND _commission > _price THEN RAISE EXCEPTION 'commission exceeds price'; END IF;
  IF _status = 'active' AND (_price IS NULL OR _commission IS NULL) THEN RAISE EXCEPTION 'active service requires pricing'; END IF;

  UPDATE public.services
  SET price = _price, commission = _commission, status = _status, updated_at = now()
  WHERE id = _service_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'service not found'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_service(text, integer, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_service(text, integer, integer, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_request_withdrawal(
  _amount integer,
  _account text
)
RETURNS public.withdrawals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _earned bigint;
  _reserved bigint;
  _withdrawal public.withdrawals;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admin required'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'invalid amount'; END IF;
  IF length(trim(COALESCE(_account, ''))) < 3 THEN RAISE EXCEPTION 'valid payout destination required'; END IF;

  SELECT COALESCE(sum(commission), 0) INTO _earned
  FROM public.bookings
  WHERE payment = 'paid' AND status <> 'cancelled';

  SELECT COALESCE(sum(amount), 0) INTO _reserved
  FROM public.withdrawals
  WHERE status IN ('pending', 'processing', 'paid');

  IF _amount > (_earned - _reserved) THEN RAISE EXCEPTION 'insufficient commission balance'; END IF;

  INSERT INTO public.withdrawals(amount, account)
  VALUES (_amount, trim(_account))
  RETURNING * INTO _withdrawal;
  RETURN _withdrawal;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_request_withdrawal(integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_request_withdrawal(integer, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_withdrawal_status(
  _code text,
  _status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _current text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admin required'; END IF;
  IF _status NOT IN ('processing', 'paid', 'failed') THEN RAISE EXCEPTION 'invalid withdrawal status'; END IF;

  SELECT status INTO _current FROM public.withdrawals WHERE code = _code FOR UPDATE;
  IF _current IS NULL THEN RAISE EXCEPTION 'withdrawal not found'; END IF;
  IF NOT ((_current = 'pending' AND _status IN ('processing', 'failed')) OR
          (_current = 'processing' AND _status IN ('paid', 'failed'))) THEN
    RAISE EXCEPTION 'invalid withdrawal transition';
  END IF;

  UPDATE public.withdrawals SET status = _status WHERE code = _code;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_withdrawal_status(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_withdrawal_status(text, text) TO authenticated;

REVOKE INSERT, UPDATE, DELETE ON public.services FROM authenticated;
REVOKE INSERT, UPDATE ON public.withdrawals FROM authenticated;
REVOKE INSERT, DELETE ON public.workers FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.service_commissions FROM authenticated;