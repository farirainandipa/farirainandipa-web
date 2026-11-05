-- 013: a Free-tier login sees only the public teaser, so the full bureau
-- portal refuses it server side. Other tiers are unchanged here; Explorer's
-- own pipeline rules (Verified only, 30-day delay) are a separate change.
create or replace function public.bureau_portal()
returns jsonb language plpgsql security definer set search_path = public as $$
declare cid int; res jsonb; t text;
begin
  cid := public.bureau_country_id();
  if cid is null then return jsonb_build_object('error','not_a_bureau'); end if;
  t := public.my_tier();
  if t is null or t = 'free' then return jsonb_build_object('error','teaser_only','tier',t); end if;
  update public.user_access set last_seen_at = now() where user_id = auth.uid();
  res := public.portal_data(cid);
  return res || jsonb_build_object('tier', t, 'org', (select jsonb_build_object('org_name',org_name,'contact_name',contact_name,'email',email) from public.user_access where user_id=auth.uid()));
end $$;
