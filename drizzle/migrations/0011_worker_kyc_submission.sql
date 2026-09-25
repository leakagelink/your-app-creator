CREATE TABLE public.worker_kyc (
  worker_id text PRIMARY KEY REFERENCES public.workers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  id_type text NOT NULL,
  id_number text NOT NULL,
  payout_account text NOT NULL,
  status text NOT NULL DEFAULT 'submitted',
  admin_note text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
GRANT SELECT ON public.worker_kyc TO authenticated;
GRANT ALL ON public.worker_kyc TO service_role;
ALTER TABLE public.worker_kyc ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin kyc read" ON public.worker_kyc FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.submit_worker_kyc(_full_name text, _phone text, _address text, _id_type text, _id_number text, _payout_account text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE w public.workers;
BEGIN
  SELECT * INTO w FROM public.workers WHERE user_id = auth.uid();
  IF w.id IS NULL THEN RAISE EXCEPTION 'worker account nahi mila'; END IF;
  IF w.kyc = 'verified' THEN RAISE EXCEPTION 'KYC pehle se approved hai'; END IF;
  IF length(trim(_full_name)) < 2 THEN RAISE EXCEPTION 'naam required'; END IF;
  IF length(regexp_replace(_phone, '\D', '', 'g')) < 10 THEN RAISE EXCEPTION 'sahi mobile number daalein'; END IF;
  IF length(trim(_address)) < 5 THEN RAISE EXCEPTION 'poora address daalein'; END IF;
  IF _id_type NOT IN ('aadhaar','pan','voter','dl') THEN RAISE EXCEPTION 'ID type galat hai'; END IF;
  IF length(trim(_id_number)) < 6 THEN RAISE EXCEPTION 'ID number galat hai'; END IF;
  IF length(trim(_payout_account)) < 5 THEN RAISE EXCEPTION 'UPI/bank details daalein'; END IF;
  INSERT INTO public.worker_kyc (worker_id, user_id, full_name, phone, address, id_type, id_number, payout_account, status, admin_note, submitted_at, reviewed_at)
  VALUES (w.id, auth.uid(), trim(_full_name), trim(_phone), trim(_address), _id_type, upper(trim(_id_number)), trim(_payout_account), 'submitted', NULL, now(), NULL)
  ON CONFLICT (worker_id) DO UPDATE SET full_name=EXCLUDED.full_name, phone=EXCLUDED.phone, address=EXCLUDED.address, id_type=EXCLUDED.id_type,
    id_number=EXCLUDED.id_number, payout_account=EXCLUDED.payout_account, status='submitted', admin_note=NULL, submitted_at=now(), reviewed_at=NULL;
  UPDATE public.workers SET kyc = 'submitted', name = trim(_full_name) WHERE id = w.id;
END; $$;
REVOKE ALL ON FUNCTION public.submit_worker_kyc(text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_worker_kyc(text,text,text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_worker_kyc(_worker_id text, _kyc text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'admin required'; END IF;
  IF _kyc NOT IN ('pending', 'verified', 'rejected') THEN RAISE EXCEPTION 'invalid kyc status'; END IF;
  UPDATE public.workers SET kyc = _kyc, available = CASE WHEN _kyc = 'verified' THEN available ELSE false END WHERE id = _worker_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'worker not found'; END IF;
  UPDATE public.worker_kyc SET status = CASE WHEN _kyc='verified' THEN 'approved' WHEN _kyc='rejected' THEN 'rejected' ELSE 'submitted' END, reviewed_at = now() WHERE worker_id = _worker_id;
END; $$;

CREATE OR REPLACE FUNCTION public.set_own_worker_service(_service_id text, _exp_years integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.services;
BEGIN
  SELECT * INTO s FROM public.services WHERE id = _service_id;
  IF s.id IS NULL THEN RAISE EXCEPTION 'service nahi mili'; END IF;
  UPDATE public.workers SET service_id = s.id, role = s.name, exp_years = greatest(0, least(60, coalesce(_exp_years,0))) WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'worker account nahi mila'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.set_own_worker_service(text,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_own_worker_service(text,integer) TO authenticated;