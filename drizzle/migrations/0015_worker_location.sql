ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS lat numeric, ADD COLUMN IF NOT EXISTS lng numeric, ADD COLUMN IF NOT EXISTS area text NOT NULL DEFAULT '';
CREATE OR REPLACE FUNCTION public.set_own_worker_location(_lat numeric, _lng numeric, _area text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
  IF _lat < -90 OR _lat > 90 OR _lng < -180 OR _lng > 180 THEN RAISE EXCEPTION 'Invalid location'; END IF;
  -- rounded to ~1 km so exact home location is never public
  UPDATE public.workers SET lat = round(_lat, 2), lng = round(_lng, 2), area = left(coalesce(trim(_area), ''), 80) WHERE user_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Worker account not found'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.set_own_worker_location(numeric, numeric, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_own_worker_location(numeric, numeric, text) TO authenticated;