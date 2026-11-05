-- 017: Covering indexes for the foreign keys added in 016, flagged by the
-- performance advisor, and audit_actor() off the RPC surface (the audit
-- triggers run as the owner and do not need the grant).

begin;

create index if not exists profile_submissions_submitter_idx on public.profile_submissions (submitter_id);
create index if not exists profile_submissions_country_idx   on public.profile_submissions (country_id);
create index if not exists psf_field_key_idx                 on public.profile_submission_fields (field_key);
create index if not exists psf_live_field_idx                on public.profile_submission_fields (live_field_id) where live_field_id is not null;
create index if not exists vsd_country_idx                   on public.verified_submitter_domains (country_id);

revoke all on function public.audit_actor() from public, anon, authenticated;

commit;
