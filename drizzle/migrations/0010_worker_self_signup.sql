CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _svc public.services; _exp integer;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, city)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'phone', NEW.raw_user_meta_data ->> 'city')
  ON CONFLICT (id) DO NOTHING;

  IF EXISTS (SELECT 1 FROM public.admin_allowlist a WHERE lower(a.email) = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT (user_id, role) DO NOTHING;
    IF (NEW.raw_user_meta_data ->> 'account_type') = 'worker' THEN
      SELECT * INTO _svc FROM public.services WHERE id = NEW.raw_user_meta_data ->> 'service_id';
      IF _svc.id IS NOT NULL THEN
        _exp := LEAST(GREATEST(COALESCE(NULLIF(regexp_replace(COALESCE(NEW.raw_user_meta_data ->> 'exp_years',''), '[^0-9]', '', 'g'), '')::integer, 0), 0), 60);
        INSERT INTO public.workers (id, user_id, name, service_id, role, exp_years, rating, jobs_done, distance_km, photo, available, kyc)
        VALUES (gen_random_uuid()::text, NEW.id, COALESCE(NULLIF(trim(NEW.raw_user_meta_data ->> 'full_name'), ''), split_part(NEW.email, '@', 1)),
                _svc.id, _svc.name, _exp, 0, 0, 0, '', false, 'pending');
        INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'worker') ON CONFLICT (user_id, role) DO NOTHING;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;