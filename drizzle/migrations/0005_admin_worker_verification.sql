CREATE OR REPLACE FUNCTION public.admin_set_worker_kyc(_worker_id text, _kyc text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admin required'; END IF;
  IF _kyc NOT IN ('pending', 'verified') THEN RAISE EXCEPTION 'invalid kyc status'; END IF;
  UPDATE public.workers SET kyc = _kyc WHERE id = _worker_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'worker not found'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_worker_kyc(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_worker_kyc(text, text) TO authenticated;