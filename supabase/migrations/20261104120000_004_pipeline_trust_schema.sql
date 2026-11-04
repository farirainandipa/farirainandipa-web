-- 004: Pipeline v2 trust schema
-- Adds provenance and confidence to every pipeline record, series/edition fields,
-- non-RFP host-selection fields on events, a structured destination profile per
-- country, a public submission channel for movable conferences, and the nightly
-- demotion job. Resets the priority set to the agency's current six.
-- Spec: Claude Doc "Pipeline Record Schema & Scan Rules" (4 Nov 2026).

begin;

-- ---------------------------------------------------------------------------
-- 1. Trust fields on bid_opportunities and events
-- ---------------------------------------------------------------------------
alter table public.bid_opportunities
  add column if not exists series_key     text,
  add column if not exists edition_label  text,
  add column if not exists host_selection text
    check (host_selection in ('open_bid','call_for_hosts','invitation','member_offer','rotation','fixed_venue')),
  add column if not exists source_tier    smallint check (source_tier between 1 and 4),
  add column if not exists confidence     text not null default 'unverified'
    check (confidence in ('verified','stale','unverified','conflict')),
  add column if not exists verified_on    date,
  add column if not exists conflict_note  text;

alter table public.events
  add column if not exists series_key        text,
  add column if not exists edition_label     text,
  add column if not exists forum_group       text,
  add column if not exists host_selection    text
    check (host_selection in ('open_bid','call_for_hosts','invitation','member_offer','rotation','fixed_venue')),
  add column if not exists decision_body     text,
  add column if not exists lead_time         text,
  add column if not exists last_hosts        text,
  add column if not exists openness_2027_29  text
    check (openness_2027_29 in ('open','partly','rotation','fixed','unknown')),
  add column if not exists openness_note     text,
  add column if not exists fixed_venue       boolean not null default false,
  add column if not exists source_tier       smallint check (source_tier between 1 and 4),
  add column if not exists confidence        text not null default 'unverified'
    check (confidence in ('verified','stale','unverified','conflict')),
  add column if not exists verified_on       date,
  add column if not exists conflict_note     text;

create index if not exists bid_opportunities_confidence_idx on public.bid_opportunities (confidence);
create index if not exists events_confidence_idx on public.events (confidence);
create index if not exists events_series_key_idx on public.events (series_key);

-- Backfill. Nothing is deleted; every row re-earns Verified through the
-- verification pass. Events that already had a primary source and a verified
-- flag start as Stale (re-check queued), everything else as Unverified.
update public.bid_opportunities
   set confidence = 'unverified',
       source_tier = coalesce(source_tier, 3),
       series_key = coalesce(series_key, lower(regexp_replace(title, '[^A-Za-z]+', '-', 'g'))),
       host_selection = coalesce(host_selection, 'open_bid')
 where confidence = 'unverified';

update public.events
   set confidence  = case when verification_status = 'verified' and source_url is not null then 'stale' else 'unverified' end,
       verified_on = case when verification_status = 'verified' and source_url is not null then coalesce(updated_at::date, created_at::date) end,
       source_tier = case when source_url is not null then 1 else 3 end,
       series_key  = coalesce(series_key, lower(regexp_replace(event_name, '[^A-Za-z]+', '-', 'g'))),
       edition_label = coalesce(edition_label, edition_year::text)
 where confidence = 'unverified';

-- Open calls whose deadline has passed are closed.
update public.bid_opportunities
   set list_status = 'closed',
       verification_note = coalesce(verification_note,'') || ' | Deadline passed; auto-closed by migration 004 on ' || current_date::text
 where list_status = 'open' and submission_deadline is not null and submission_deadline < current_date;

-- ---------------------------------------------------------------------------
-- 2. Priority set (agency view): Zimbabwe, Zambia, Rwanda, Kenya, Botswana, Namibia
-- ---------------------------------------------------------------------------
update public.countries set priority = (iso2 in ('ZW','ZM','RW','KE','BW','NA')) where type = 'country';

-- ---------------------------------------------------------------------------
-- 3. Structured destination profile (one row per country) + long field table
-- ---------------------------------------------------------------------------
create table if not exists public.destination_profiles (
  country_id        int primary key references public.countries(id) on delete cascade,
  profile_depth     text not null default 'base' check (profile_depth in ('base','full')),
  bureau_exists     text,          -- Yes / No / Partial (free text keeps the nuance)
  bids_formally     text,          -- Yes / Informal / No
  subvention_fund   text,          -- Yes / Partial / No
  visa_ease         smallint check (visa_ease between 1 and 5),
  intl_nonstops     smallint,      -- approximate band
  largest_plenary   int,           -- theatre-style seats in the largest purpose-built hall
  icca_2024_meetings smallint,
  icca_2024_top10   boolean not null default false,
  advisory_level    text check (advisory_level in ('green','amber','red')),
  fcdo_summary      text,
  bureau_detail     text,
  venue_detail      text,
  visa_detail       text,
  verified_on       date,
  updated_at        timestamptz not null default now()
);

create table if not exists public.destination_profile_fields (
  id          bigserial primary key,
  country_id  int not null references public.countries(id) on delete cascade,
  field_no    smallint not null,
  field_group text,
  field       text not null,
  value       text,
  source_url  text,
  confidence  text not null default 'unverified' check (confidence in ('verified','partial','unverified')),
  verified_on date,
  unique (country_id, field_no)
);

alter table public.destination_profiles enable row level security;
alter table public.destination_profile_fields enable row level security;

drop policy if exists dp_admin_all on public.destination_profiles;
create policy dp_admin_all on public.destination_profiles
  for all to authenticated using (public.is_allowlisted()) with check (public.is_allowlisted());
drop policy if exists dp_bureau_own on public.destination_profiles;
create policy dp_bureau_own on public.destination_profiles
  for select to authenticated using (
    exists (select 1 from public.user_access ua
             where ua.user_id = auth.uid() and ua.active and ua.role = 'bureau'
               and ua.country_id = destination_profiles.country_id));

drop policy if exists dpf_admin_all on public.destination_profile_fields;
create policy dpf_admin_all on public.destination_profile_fields
  for all to authenticated using (public.is_allowlisted()) with check (public.is_allowlisted());
drop policy if exists dpf_bureau_own on public.destination_profile_fields;
create policy dpf_bureau_own on public.destination_profile_fields
  for select to authenticated using (
    exists (select 1 from public.user_access ua
             where ua.user_id = auth.uid() and ua.active and ua.role = 'bureau'
               and ua.country_id = destination_profile_fields.country_id));

-- ---------------------------------------------------------------------------
-- 4. Public submission channel for movable corporate and private conferences
-- ---------------------------------------------------------------------------
create table if not exists public.submissions (
  id                 bigserial primary key,
  created_at         timestamptz not null default now(),
  status             text not null default 'review' check (status in ('review','confirmed','declined')),
  host_open          text not null,     -- the three gating questions
  decision_when      text not null,
  decision_who       text not null,
  event_name         text not null,
  organisation       text not null,
  org_type           text,
  sector_id          int references public.econ_sectors(id),
  expected_delegates int,
  international_share smallint,
  preferred_quarter  text,
  duration_days      smallint,
  room_nights        int,
  venue_needs        text,
  host_needs         text,
  past_hosts         text,
  submitter_name     text not null,
  submitter_email    text not null,
  notes              text,
  reviewed_at        timestamptz,
  review_note        text,
  event_id           int references public.events(id)
);
alter table public.submissions enable row level security;
drop policy if exists sub_public_insert on public.submissions;
create policy sub_public_insert on public.submissions for insert to anon, authenticated with check (true);
drop policy if exists sub_admin_all on public.submissions;
create policy sub_admin_all on public.submissions
  for all to authenticated using (public.is_allowlisted()) with check (public.is_allowlisted());

-- ---------------------------------------------------------------------------
-- 5. Nightly demotion. Verified -> Stale after 60 days (14 for open bids),
--    Stale -> Unverified after 120 days, passed deadlines closed.
-- ---------------------------------------------------------------------------
create or replace function public.pipeline_demote()
returns void language sql security definer set search_path = public as $$
  update public.events set confidence = 'stale'
   where confidence = 'verified' and verified_on is not null
     and verified_on < current_date - case when bid_status = 'bid_open' then 14 else 60 end;
  update public.events set confidence = 'unverified'
   where confidence = 'stale' and verified_on is not null and verified_on < current_date - 120;
  update public.bid_opportunities set confidence = 'stale'
   where confidence = 'verified' and verified_on is not null
     and verified_on < current_date - case when list_status = 'open' then 14 else 60 end;
  update public.bid_opportunities set confidence = 'unverified'
   where confidence = 'stale' and verified_on is not null and verified_on < current_date - 120;
  update public.bid_opportunities
     set list_status = 'closed',
         verification_note = coalesce(verification_note,'') || ' | Deadline passed; auto-closed ' || current_date::text
   where list_status = 'open' and submission_deadline is not null and submission_deadline < current_date;
$$;
revoke all on function public.pipeline_demote() from public;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'pipeline_demote_nightly';
    perform cron.schedule('pipeline_demote_nightly', '15 2 * * *', 'select public.pipeline_demote()');
  else
    raise notice 'pg_cron not enabled; enable it in Database > Extensions and re-run: select cron.schedule(''pipeline_demote_nightly'', ''15 2 * * *'', ''select public.pipeline_demote()'')';
  end if;
end $$;

commit;
