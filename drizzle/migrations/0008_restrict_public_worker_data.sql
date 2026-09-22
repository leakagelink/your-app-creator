DROP POLICY IF EXISTS "commissions readable" ON public.service_commissions;
REVOKE SELECT ON public.service_commissions FROM anon, authenticated;

DROP POLICY IF EXISTS "workers readable" ON public.workers;
CREATE POLICY "available verified workers readable"
ON public.workers
FOR SELECT
TO anon, authenticated
USING (available = true AND kyc = 'verified');

CREATE POLICY "workers can read own row"
ON public.workers
FOR SELECT
TO authenticated
USING (user_id = auth.uid());