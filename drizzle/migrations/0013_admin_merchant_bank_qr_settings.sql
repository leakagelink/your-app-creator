ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS merchant_bank_name text NOT NULL DEFAULT '';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS merchant_account_holder text NOT NULL DEFAULT '';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS merchant_account_number text NOT NULL DEFAULT '';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS merchant_ifsc text NOT NULL DEFAULT '';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS merchant_qr_path text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.admin_set_merchant_payment_details(_upi text, _name text, _bank_name text, _holder text, _account text, _ifsc text, _qr_path text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE u text := trim(coalesce(_upi,'')); n text := trim(coalesce(_name,'')); b text := trim(coalesce(_bank_name,'')); h text := trim(coalesce(_holder,'')); a text := trim(coalesce(_account,'')); i text := upper(trim(coalesce(_ifsc,''))); q text := trim(coalesce(_qr_path,''));
BEGIN
 IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
 IF u <> '' AND u !~ '^[A-Za-z0-9._-]{2,}@[A-Za-z0-9.-]{2,}$' THEN RAISE EXCEPTION 'Valid UPI ID likhein'; END IF;
 IF (u <> '' OR q <> '') AND length(n) < 2 THEN RAISE EXCEPTION 'Payment receiver ka naam likhein'; END IF;
 IF b <> '' OR h <> '' OR a <> '' OR i <> '' THEN
  IF length(b) < 2 OR length(h) < 2 OR a !~ '^[0-9]{9,18}$' OR i !~ '^[A-Z]{4}0[A-Z0-9]{6}$' THEN RAISE EXCEPTION 'Bank name, holder, account number aur IFSC sahi bharein'; END IF;
 END IF;
 IF q <> '' AND NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'merchant-qr' AND name = q) THEN RAISE EXCEPTION 'QR image upload karein'; END IF;
 UPDATE public.app_settings SET merchant_upi_id = u, merchant_name = n, merchant_bank_name = b, merchant_account_holder = h, merchant_account_number = a, merchant_ifsc = i, merchant_qr_path = q, updated_at = now() WHERE id = 1;
 IF NOT FOUND THEN RAISE EXCEPTION 'Payment settings nahi mili'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.admin_set_merchant_payment_details(text,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_merchant_payment_details(text,text,text,text,text,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.start_wallet_deposit(_amount integer) RETURNS public.wallet_deposits
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.wallet_deposits;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
 IF _amount IS NULL OR _amount < 10 OR _amount > 100000 THEN RAISE EXCEPTION 'Amount ₹10 se ₹1,00,000 ke beech ho'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.app_settings WHERE id = 1 AND (merchant_upi_id <> '' OR merchant_qr_path <> '' OR merchant_account_number <> '')) THEN RAISE EXCEPTION 'Admin ne payment details set nahi ki'; END IF;
 UPDATE public.wallet_deposits SET status = 'expired' WHERE user_id = auth.uid() AND status = 'awaiting_payment' AND expires_at < now();
 INSERT INTO public.wallet_deposits (user_id, amount) VALUES (auth.uid(), _amount) RETURNING * INTO r;
 RETURN r;
END $$;

CREATE POLICY "admin upload merchant qr" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'merchant-qr' AND public.has_role(auth.uid(), 'admin') AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "read saved merchant qr" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'merchant-qr' AND (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.app_settings WHERE id = 1 AND merchant_qr_path = name)));
