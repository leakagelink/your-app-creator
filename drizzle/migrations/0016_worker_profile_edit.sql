CREATE OR REPLACE FUNCTION public.set_own_worker_profile(_name text, _photo text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
  IF length(trim(coalesce(_name,''))) < 2 THEN RAISE EXCEPTION 'Naam likhein'; END IF;
  IF _photo IS NOT NULL AND _photo <> '' AND (_photo NOT LIKE 'data:image/jpeg;base64,%' OR length(_photo) > 200000) THEN RAISE EXCEPTION 'Photo sahi nahi hai'; END IF;
  UPDATE public.workers SET name = left(trim(_name), 60), photo = coalesce(_photo, photo) WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Worker account not found'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.set_own_worker_profile(text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_own_worker_profile(text, text) TO authenticated;