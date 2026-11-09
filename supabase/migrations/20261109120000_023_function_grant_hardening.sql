-- 023: Function grant hardening (applied 2026-11-09 as migration 009_function_grant_hardening
-- from the africa-mice-dashboard-web work; recorded here as the canonical copy).
-- Table RLS was already correct. This closes the remaining advisor warnings:
--  * functions that only make sense for a signed-in user are no longer
--    executable by anon (PostgreSQL grants EXECUTE to PUBLIC by default);
--  * trigger / event-trigger functions are not callable over the REST API at all;
--  * three trigger functions get a fixed search_path.
-- Left executable by anon on purpose (used by public forms/pages):
--  bid_wins_teaser, partner_form_options, profile_submit, profile_verify,
--  profile_status, submission_upload_allowed (storage insert policy).

-- 1. Signed-in only
do $$
declare f text;
begin
  foreach f in array array[
    'public.bw_add_requirements(uuid, jsonb)',
    'public.bw_bid_list()',
    'public.bw_can_see_bid(uuid)',
    'public.bw_generate_milestones(uuid)',
    'public.bw_is_admin()',
    'public.bw_my_orgs()',
    'public.bw_my_role()',
    'public.bw_seed_stakeholders(uuid)',
    'public.is_allowlisted()'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;

-- 2. Trigger and event-trigger functions: never called directly by clients
do $$
declare f text;
begin
  foreach f in array array[
    'public.bw_log()',
    'public.bw_touch()',
    'public.bw_stakeholder_dates()',
    'public.bw_recalc_milestones()',
    'public.update_updated_at_column()',
    'public.rls_auto_enable()'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
  end loop;
end $$;

-- 3. Fixed search_path on trigger functions
alter function public.bw_touch() set search_path = public;
alter function public.bw_stakeholder_dates() set search_path = public;
alter function public.bw_recalc_milestones() set search_path = public;
