REVOKE EXECUTE ON FUNCTION public.add_reward_points(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.redeem_reward_points() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.add_reward_points(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_reward_points() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;