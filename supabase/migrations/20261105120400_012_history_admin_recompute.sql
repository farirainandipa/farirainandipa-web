-- 012: let an admin refresh history depth, cycles and windows straight after
-- editing editions, instead of waiting for the nightly job.
create or replace function public.history_recompute_admin()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_allowlisted() then raise exception 'admins only'; end if;
  perform public.history_recompute();
end $$;
revoke all on function public.history_recompute_admin() from public, anon;
grant execute on function public.history_recompute_admin() to authenticated;
