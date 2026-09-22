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
DECLARE
  _stored_price integer := NULLIF(_price, -1);
  _stored_commission integer := NULLIF(_commission, -1);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admin required'; END IF;
  IF _status NOT IN ('active', 'coming_soon') THEN RAISE EXCEPTION 'invalid service status'; END IF;
  IF _price < -1 OR _price = 0 THEN RAISE EXCEPTION 'invalid price'; END IF;
  IF _commission < -1 THEN RAISE EXCEPTION 'invalid commission'; END IF;
  IF _stored_commission IS NOT NULL AND _stored_price IS NOT NULL AND _stored_commission > _stored_price THEN RAISE EXCEPTION 'commission exceeds price'; END IF;
  IF _status = 'active' AND (_stored_price IS NULL OR _stored_commission IS NULL) THEN RAISE EXCEPTION 'active service requires pricing'; END IF;

  UPDATE public.services
  SET price = _stored_price, commission = _stored_commission, status = _status, updated_at = now()
  WHERE id = _service_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'service not found'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_service(text, integer, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_service(text, integer, integer, text) TO authenticated;