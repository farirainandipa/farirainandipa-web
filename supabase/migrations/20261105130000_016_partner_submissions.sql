-- 016: Destination partner submissions
-- Staging tables, field catalog, review queue, audit log and public intake
-- RPCs for data that convention bureaux, venues, immigration ministries,
-- tourism associations and airlines submit about a country's destination
-- profile. Submissions never write to live profile data; an admin promotes
-- each field from the review queue (the promote RPC and the review screen
-- follow in the next migration). Spec: HANDOVER-partner-submissions.md
-- (5 Nov 2026).
--
-- `submissions` already holds the movable-conference channel from migration
-- 004, so everything here is prefixed `profile_`.
--
-- Tenancy: every row carries country_id. All tables are admin-only under RLS
-- (is_allowlisted()); bureau logins have no policy on any of them. The anon
-- role holds no table privileges here at all and reaches the data only
-- through the three RPCs at the end.

begin;

-- ---------------------------------------------------------------------------
-- 1. Trust fields on the live profile table
--    The confidence vocabulary joins the four-state model used on events,
--    bid_opportunities, series and bid_wins. 'partial' stays for the 304
--    researched rows that already use it.
-- ---------------------------------------------------------------------------
alter table public.destination_profile_fields
  drop constraint if exists destination_profile_fields_confidence_check;
alter table public.destination_profile_fields
  add constraint destination_profile_fields_confidence_check
    check (confidence in ('verified','partial','stale','unverified','conflict'));

alter table public.destination_profile_fields
  add column if not exists source_tier    smallint check (source_tier between 1 and 4),
  add column if not exists conflict_note  text,
  add column if not exists as_of_date     date,
  add column if not exists recheck_due_on date;

create index if not exists dpf_recheck_due_idx
  on public.destination_profile_fields (recheck_due_on) where recheck_due_on is not null;

-- ---------------------------------------------------------------------------
-- 2. Field catalog: what a partner may propose, where it lands, who may
--    propose it. Full (21-field) and base (12-field) profiles number their
--    fields differently, so both numbers are kept. Fields that do not exist
--    on either profile yet are numbered from 101 on both.
-- ---------------------------------------------------------------------------
create table if not exists public.profile_field_catalog (
  key            text primary key,
  label          text not null,
  field_group    text not null,
  target_kind    text not null check (target_kind in ('profile_field','country_column','evidence')),
  full_field_no  smallint,
  base_field_no  smallint,
  target_column  text,
  value_kind     text not null default 'text' check (value_kind in ('text','integer','boolean','enum')),
  enum_values    text[],
  allowed_types  text[] not null,
  sort_order     smallint not null default 100,
  active         boolean not null default true,
  check (target_kind <> 'profile_field' or (full_field_no is not null and base_field_no is not null)),
  check (target_kind <> 'country_column' or target_column is not null),
  check (value_kind <> 'enum' or enum_values is not null)
);

insert into public.profile_field_catalog
  (key, label, field_group, target_kind, full_field_no, base_field_no, target_column, value_kind, enum_values, allowed_types, sort_order)
values
  -- Convention bureau
  ('bureau_body',        'Convention bureau and legal status',             'Institutional',     'profile_field', 1,   1,   null, 'text',    null, '{bureau}', 10),
  ('bids_formally',      'Bids formally for events',                       'Institutional',     'profile_field', 101, 2,   null, 'enum',    '{yes,informal,no}', '{bureau}', 11),
  ('subvention_type',    'Subvention fund type',                           'Bid support',       'profile_field', 102, 102, null, 'enum',    '{cash,in_kind,proposed,none}', '{bureau}', 12),
  ('subvention_fund',    'Bid support / subvention fund details',          'Bid support',       'profile_field', 6,   3,   null, 'text',    null, '{bureau}', 13),
  ('bid_contact',        'Bid contact',                                    'Bid support',       'profile_field', 103, 103, null, 'text',    null, '{bureau}', 14),
  ('events_won',         'Events won',                                     'Track record',      'profile_field', 16,  9,   null, 'text',    null, '{bureau}', 15),
  ('bidding_now',        'Events currently bidding for',                   'Track record',      'evidence',      null, null, null, 'text',   null, '{bureau}', 16),
  -- Venue or hotel
  ('largest_plenary',    'Largest plenary (theatre seats)',                'Capacity',          'profile_field', 12,  6,   null, 'integer', null, '{venue}', 20),
  ('meeting_space_sqm',  'Total meeting space (square metres)',            'Capacity',          'profile_field', 104, 104, null, 'integer', null, '{venue}', 21),
  ('breakout_rooms',     'Breakout room count',                            'Capacity',          'profile_field', 105, 105, null, 'integer', null, '{venue}', 22),
  ('onsite_rooms',       'On-site rooms (this venue)',                     'Capacity',          'profile_field', 106, 106, null, 'integer', null, '{venue}', 23),
  ('accessibility',      'Accessibility features',                         'Capacity',          'profile_field', 107, 107, null, 'text',    null, '{venue}', 24),
  ('renovation',         'Recent renovation or planned expansion',         'Capacity',          'profile_field', 108, 108, null, 'text',    null, '{venue}', 25),
  -- Immigration or government ministry
  ('visa_categories',    'Visa categories',                                'Access',            'profile_field', 9,   4,   null, 'text',    null, '{ministry}', 30),
  ('visa_free_regions',  'Visa-free and e-visa eligibility by region',     'Access',            'profile_field', 109, 109, null, 'text',    null, '{ministry}', 31),
  ('evisa',              'E-visa available',                               'Access',            'country_column', null, null, 'evisa', 'boolean', null, '{ministry}', 32),
  ('visa_on_arrival',    'Visa on arrival available',                      'Access',            'country_column', null, null, 'visa_on_arrival', 'boolean', null, '{ministry}', 33),
  ('univisa',            'Regional univisa in force',                      'Access',            'country_column', null, null, 'univisa', 'boolean', null, '{ministry}', 34),
  ('visa_africa',        'Access for African passport holders',            'Access',            'country_column', null, null, 'visa_africa', 'enum', '{visa_free_all,visa_free_most,mixed,restrictive}', '{ministry}', 35),
  ('visa_processing',    'Visa processing time',                           'Access',            'profile_field', 110, 110, null, 'text',    null, '{ministry}', 36),
  ('visa_fees',          'Visa fees',                                      'Access',            'profile_field', 111, 111, null, 'text',    null, '{ministry}', 37),
  ('visa_facilitation',  'Delegate facilitation (group visas, fast-track)','Access',            'country_column', null, null, 'visa_events_note', 'text', null, '{ministry}', 38),
  ('exhibition_customs', 'Tax and customs rules for exhibitions',          'Access',            'profile_field', 112, 112, null, 'text',    null, '{ministry}', 39),
  -- Tourism industry association
  ('member_count',       'Member count',                                   'Institutional',     'profile_field', 113, 113, null, 'integer', null, '{association}', 40),
  ('sectors_represented','Sectors represented',                            'Institutional',     'profile_field', 114, 114, null, 'text',    null, '{association}', 41),
  ('mice_working_group', 'MICE working group and contact',                 'Institutional',     'profile_field', 115, 115, null, 'text',    null, '{association}', 42),
  ('support_letters',    'Support letters or endorsements for bids',       'Bid support',       'evidence',      null, null, null, 'text',   null, '{association}', 43),
  -- Airline
  ('routes',             'Routes serving the country',                     'Access',            'profile_field', 10,  5,   null, 'text',    null, '{airline}', 50),
  ('nonstop_intercontinental', 'Non-stop intercontinental service',        'Access',            'profile_field', 116, 116, null, 'boolean', null, '{airline}', 51),
  ('weekly_frequencies', 'Weekly frequencies',                             'Access',            'profile_field', 117, 117, null, 'text',    null, '{airline}', 52),
  ('seasonal_changes',   'Seasonal changes',                               'Access',            'profile_field', 118, 118, null, 'text',    null, '{airline}', 53),
  ('delegate_fares',     'Delegate fares or event partnership offers',     'Bid support',       'profile_field', 119, 119, null, 'text',    null, '{airline}', 54)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Abuse-control reference tables
-- ---------------------------------------------------------------------------
create table if not exists public.freemail_domains (
  domain text primary key
);
insert into public.freemail_domains (domain) values
  ('gmail.com'),('googlemail.com'),('yahoo.com'),('yahoo.co.uk'),('ymail.com'),
  ('hotmail.com'),('hotmail.co.uk'),('outlook.com'),('live.com'),('msn.com'),
  ('icloud.com'),('me.com'),('aol.com'),('protonmail.com'),('proton.me'),
  ('gmx.com'),('gmx.net'),('mail.com'),('yandex.com'),('yandex.ru'),('zoho.com')
on conflict do nothing;

-- Domains known to belong to a partner organisation. Empty until the owner
-- decides the list; a match sets domain_verified on the submitter.
create table if not exists public.verified_submitter_domains (
  domain        text primary key,
  organisation  text not null,
  country_id    int references public.countries(id),
  note          text,
  added_at      timestamptz not null default now()
);

-- One row per intake attempt, kept seven days, for rate limits.
create table if not exists public.profile_submission_attempts (
  id        bigserial primary key,
  at        timestamptz not null default now(),
  email     text,
  ip_hash   text,
  outcome   text not null
);
create index if not exists psa_email_at_idx on public.profile_submission_attempts (email, at);
create index if not exists psa_ip_at_idx on public.profile_submission_attempts (ip_hash, at);

-- ---------------------------------------------------------------------------
-- 4. Submitters, submissions, proposed fields
-- ---------------------------------------------------------------------------
create table if not exists public.profile_submitters (
  id                bigserial primary key,
  created_at        timestamptz not null default now(),
  full_name         text not null,
  organisation      text not null,
  role              text,
  work_email        text not null,
  email_domain      text generated always as (lower(split_part(work_email, '@', 2))) stored,
  submitter_type    text not null check (submitter_type in ('bureau','venue','ministry','association','airline')),
  country_id        int not null references public.countries(id),
  email_verified_at timestamptz,
  freemail_flag     boolean not null default false,
  domain_verified   boolean not null default false,
  status            text not null default 'active' check (status in ('active','blocked'))
);
create unique index if not exists profile_submitters_identity_idx
  on public.profile_submitters (lower(work_email), country_id, submitter_type);
create index if not exists profile_submitters_country_idx on public.profile_submitters (country_id);

create table if not exists public.profile_submissions (
  id                bigserial primary key,
  created_at        timestamptz not null default now(),
  submitter_id      bigint not null references public.profile_submitters(id) on delete cascade,
  country_id        int not null references public.countries(id),
  submitter_type    text not null check (submitter_type in ('bureau','venue','ministry','association','airline')),
  status            text not null default 'awaiting_email'
                    check (status in ('awaiting_email','new','in_review','confirmed','rejected','published')),
  submitted_at      timestamptz not null default now(),
  email_verified_at timestamptz,
  token_hash        text,
  token_expires_at  timestamptz,
  upload_key        uuid not null default gen_random_uuid(),
  status_key        uuid not null default gen_random_uuid(),
  ip_hash           text,
  freemail_flag     boolean not null default false,
  reviewer          text,
  reviewed_at       timestamptz,
  reviewer_note     text
);
create index if not exists profile_submissions_queue_idx on public.profile_submissions (status, country_id, submitter_type);
create unique index if not exists profile_submissions_token_idx on public.profile_submissions (token_hash) where token_hash is not null;
create unique index if not exists profile_submissions_upload_key_idx on public.profile_submissions (upload_key);
create unique index if not exists profile_submissions_status_key_idx on public.profile_submissions (status_key);

create table if not exists public.profile_submission_fields (
  id               bigserial primary key,
  submission_id    bigint not null references public.profile_submissions(id) on delete cascade,
  field_key        text not null references public.profile_field_catalog(key),
  proposed_value   text not null,
  as_of_date       date not null,
  source_url       text,
  supporting_file  text,
  reviewer_note    text,
  decision         text not null default 'pending'
                   check (decision in ('pending','accepted','edited','rejected','confirm_requested')),
  decided_value    text,
  decided_at       timestamptz,
  decided_by       text,
  live_field_id    bigint references public.destination_profile_fields(id) on delete set null,
  unique (submission_id, field_key),
  check (source_url is not null or supporting_file is not null),
  check (length(proposed_value) <= 4000),
  check (source_url is null or source_url ~* '^https?://')
);
create index if not exists psf_submission_idx on public.profile_submission_fields (submission_id);

-- Field scope by submitter type, and value shape, enforced on every write
-- (admin edits included).
create or replace function public.profile_submission_field_guard()
returns trigger language plpgsql set search_path = public as $$
declare
  c   public.profile_field_catalog%rowtype;
  typ text;
begin
  select * into c from public.profile_field_catalog where key = new.field_key;
  if not found or not c.active then
    raise exception 'unknown or inactive field %', new.field_key using errcode = 'check_violation';
  end if;
  select submitter_type into typ from public.profile_submissions where id = new.submission_id;
  if typ is null or not (typ = any (c.allowed_types)) then
    raise exception 'field % is not open to submitter type %', new.field_key, coalesce(typ,'?') using errcode = 'check_violation';
  end if;
  new.proposed_value := btrim(new.proposed_value);
  if c.value_kind = 'integer' and new.proposed_value !~ '^\d{1,9}$' then
    raise exception 'field % needs a whole number', new.field_key using errcode = 'check_violation';
  elsif c.value_kind = 'boolean' then
    new.proposed_value := case lower(new.proposed_value)
      when 'yes' then 'yes' when 'true' then 'yes' when 'no' then 'no' when 'false' then 'no' end;
    if new.proposed_value is null then
      raise exception 'field % needs yes or no', new.field_key using errcode = 'check_violation';
    end if;
  elsif c.value_kind = 'enum' and not (new.proposed_value = any (c.enum_values)) then
    raise exception 'field % must be one of %', new.field_key, array_to_string(c.enum_values, ', ') using errcode = 'check_violation';
  end if;
  if new.as_of_date > current_date then
    raise exception 'as-of date cannot be in the future' using errcode = 'check_violation';
  end if;
  return new;
end $$;
revoke all on function public.profile_submission_field_guard() from public, anon, authenticated;

drop trigger if exists profile_submission_fields_guard on public.profile_submission_fields;
create trigger profile_submission_fields_guard
  before insert or update of field_key, proposed_value, as_of_date on public.profile_submission_fields
  for each row execute function public.profile_submission_field_guard();

-- ---------------------------------------------------------------------------
-- 5. Audit log: every reviewer decision and every change to live profile
--    data, old row kept. Inserted by SECURITY DEFINER triggers only; the
--    authenticated role can read it and nothing else.
-- ---------------------------------------------------------------------------
create table if not exists public.profile_review_audit (
  id                  bigserial primary key,
  at                  timestamptz not null default now(),
  actor               text not null,
  action              text not null,
  table_name          text not null,
  row_id              text not null,
  country_id          int,
  submission_field_id bigint,
  old_row             jsonb,
  new_row             jsonb
);
create index if not exists pra_country_at_idx on public.profile_review_audit (country_id, at desc);

create or replace function public.audit_actor()
returns text language sql stable set search_path = public as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email', current_user)
$$;
revoke all on function public.audit_actor() from public, anon;

create or replace function public.audit_live_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cid int;
  rid text;
  visa_cols text[] := array['visa_regime','visa_notes','visa_africa','evisa','visa_on_arrival','univisa','visa_portal_url','visa_verified_on','visa_events_note'];
  changed boolean := true;
begin
  if tg_table_name = 'countries' then
    -- Only the visa block is live profile data on this table.
    if tg_op = 'UPDATE' then
      changed := (to_jsonb(old) - (select array_agg(k) from jsonb_object_keys(to_jsonb(old)) k where k <> all (visa_cols)))
              is distinct from
                 (to_jsonb(new) - (select array_agg(k) from jsonb_object_keys(to_jsonb(new)) k where k <> all (visa_cols)));
    else
      changed := false;
    end if;
    if not changed then return coalesce(new, old); end if;
    cid := (to_jsonb(new) ->> 'id')::int;
    rid := cid::text;
  else
    cid := coalesce((to_jsonb(new) ->> 'country_id')::int, (to_jsonb(old) ->> 'country_id')::int);
    rid := coalesce(to_jsonb(new) ->> 'id', to_jsonb(old) ->> 'id', cid::text);
  end if;
  insert into public.profile_review_audit (actor, action, table_name, row_id, country_id, old_row, new_row)
  values (public.audit_actor(), 'live_' || lower(tg_op), tg_table_name, rid, cid,
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return coalesce(new, old);
end $$;
revoke all on function public.audit_live_profile() from public, anon, authenticated;

drop trigger if exists audit_destination_profile_fields on public.destination_profile_fields;
create trigger audit_destination_profile_fields
  after insert or update or delete on public.destination_profile_fields
  for each row execute function public.audit_live_profile();

drop trigger if exists audit_destination_profiles on public.destination_profiles;
create trigger audit_destination_profiles
  after insert or update or delete on public.destination_profiles
  for each row execute function public.audit_live_profile();

drop trigger if exists audit_countries_visa on public.countries;
create trigger audit_countries_visa
  after update on public.countries
  for each row execute function public.audit_live_profile();

create or replace function public.audit_submission_decision()
returns trigger language plpgsql security definer set search_path = public as $$
declare cid int;
begin
  if new.decision is not distinct from old.decision and new.decided_value is not distinct from old.decided_value then
    return new;
  end if;
  select country_id into cid from public.profile_submissions where id = new.submission_id;
  insert into public.profile_review_audit (actor, action, table_name, row_id, country_id, submission_field_id, old_row, new_row)
  values (public.audit_actor(), 'decision', 'profile_submission_fields', new.id::text, cid, new.id, to_jsonb(old), to_jsonb(new));
  return new;
end $$;
revoke all on function public.audit_submission_decision() from public, anon, authenticated;

drop trigger if exists audit_profile_submission_decision on public.profile_submission_fields;
create trigger audit_profile_submission_decision
  after update on public.profile_submission_fields
  for each row execute function public.audit_submission_decision();

-- ---------------------------------------------------------------------------
-- 6. RLS and GRANTs (two separate layers, both narrowed)
-- ---------------------------------------------------------------------------
alter table public.profile_field_catalog         enable row level security;
alter table public.freemail_domains              enable row level security;
alter table public.verified_submitter_domains    enable row level security;
alter table public.profile_submission_attempts   enable row level security;
alter table public.profile_submitters            enable row level security;
alter table public.profile_submissions           enable row level security;
alter table public.profile_submission_fields     enable row level security;
alter table public.profile_review_audit          enable row level security;

drop policy if exists pfc_admin_all on public.profile_field_catalog;
create policy pfc_admin_all on public.profile_field_catalog
  for all to authenticated using (public.is_allowlisted()) with check (public.is_allowlisted());
drop policy if exists fmd_admin_all on public.freemail_domains;
create policy fmd_admin_all on public.freemail_domains
  for all to authenticated using (public.is_allowlisted()) with check (public.is_allowlisted());
drop policy if exists vsd_admin_all on public.verified_submitter_domains;
create policy vsd_admin_all on public.verified_submitter_domains
  for all to authenticated using (public.is_allowlisted()) with check (public.is_allowlisted());
drop policy if exists psa_admin_read on public.profile_submission_attempts;
create policy psa_admin_read on public.profile_submission_attempts
  for select to authenticated using (public.is_allowlisted());
drop policy if exists psub_admin_all on public.profile_submitters;
create policy psub_admin_all on public.profile_submitters
  for all to authenticated using (public.is_allowlisted()) with check (public.is_allowlisted());
drop policy if exists ps_admin_all on public.profile_submissions;
create policy ps_admin_all on public.profile_submissions
  for all to authenticated using (public.is_allowlisted()) with check (public.is_allowlisted());
drop policy if exists psf_admin_all on public.profile_submission_fields;
create policy psf_admin_all on public.profile_submission_fields
  for all to authenticated using (public.is_allowlisted()) with check (public.is_allowlisted());
drop policy if exists pra_admin_read on public.profile_review_audit;
create policy pra_admin_read on public.profile_review_audit
  for select to authenticated using (public.is_allowlisted());

-- Supabase grants every privilege on new tables to anon and authenticated by
-- default. Take it all back, then grant only what the admin screen needs.
revoke all on table
  public.profile_field_catalog, public.freemail_domains, public.verified_submitter_domains,
  public.profile_submission_attempts, public.profile_submitters, public.profile_submissions,
  public.profile_submission_fields, public.profile_review_audit
from anon, authenticated;
revoke all on sequence
  public.profile_submission_attempts_id_seq, public.profile_submitters_id_seq,
  public.profile_submissions_id_seq, public.profile_submission_fields_id_seq,
  public.profile_review_audit_id_seq
from anon, authenticated;

grant select, insert, update, delete on table
  public.profile_field_catalog, public.freemail_domains, public.verified_submitter_domains,
  public.profile_submitters, public.profile_submissions, public.profile_submission_fields
to authenticated;
grant select on table public.profile_submission_attempts, public.profile_review_audit to authenticated;
grant usage on sequence
  public.profile_submitters_id_seq, public.profile_submissions_id_seq, public.profile_submission_fields_id_seq
to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Private bucket for supporting documents. Anonymous upload only into the
--    folder of a submission created in the last two hours, at most five
--    objects per submission; nobody but an admin can read.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('submission-uploads', 'submission-uploads', false, 10485760,
        array['application/pdf','image/png','image/jpeg',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.submission_upload_allowed(object_name text)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare
  folder text := (storage.foldername(object_name))[1];
  fkey   text := (storage.foldername(object_name))[2];
  sid    bigint;
begin
  if folder is null or fkey is null then return false; end if;
  select s.id into sid
    from public.profile_submissions s
   where s.upload_key::text = folder
     and s.created_at > now() - interval '2 hours'
     and s.status in ('awaiting_email','new')
     and exists (select 1 from public.profile_submission_fields f
                  where f.submission_id = s.id and f.field_key = fkey);
  if sid is null then return false; end if;
  return (select count(*) from storage.objects o
           where o.bucket_id = 'submission-uploads'
             and (storage.foldername(o.name))[1] = folder) < 5;
end $$;
revoke all on function public.submission_upload_allowed(text) from public;
grant execute on function public.submission_upload_allowed(text) to anon, authenticated;

drop policy if exists submission_uploads_admin_all on storage.objects;
create policy submission_uploads_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'submission-uploads' and public.is_allowlisted())
  with check (bucket_id = 'submission-uploads' and public.is_allowlisted());

drop policy if exists submission_uploads_anon_insert on storage.objects;
create policy submission_uploads_anon_insert on storage.objects
  for insert to anon
  with check (bucket_id = 'submission-uploads' and public.submission_upload_allowed(name));

-- ---------------------------------------------------------------------------
-- 8. Public intake RPCs. These are the only way anon reaches the tables.
-- ---------------------------------------------------------------------------

-- The IP as the gateway forwards it, hashed so the stored value is not PII.
create or replace function public.request_ip_hash()
returns text language sql stable set search_path = public as $$
  select encode(extensions.digest(
           coalesce(nullif(btrim(split_part(
             nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-forwarded-for', ',', 1)), ''), 'unknown'),
           'sha256'), 'hex')
$$;
revoke all on function public.request_ip_hash() from public, anon, authenticated;

-- profile_submit(payload)
-- payload: { full_name, organisation, role, work_email, submitter_type,
--            country_id, website (honeypot, must be empty),
--            fields: [ { key, value, as_of, source_url, supporting_file } ] }
-- Returns { ok, submission_id, upload_key, email_sent } or raises.
create or replace function public.profile_submit(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_email    text := lower(btrim(coalesce(payload ->> 'work_email', '')));
  v_type     text := payload ->> 'submitter_type';
  v_country  int  := (payload ->> 'country_id')::int;
  v_ip       text := public.request_ip_hash();
  v_sub      bigint;
  v_subm     bigint;
  v_token    text;
  v_secret   text;
  v_sent     boolean := false;
  v_free     boolean;
  v_domain   text;
  v_dom_ok   boolean;
  f          jsonb;
  n          int := 0;
begin
  delete from public.profile_submission_attempts where at < now() - interval '7 days';

  -- Honeypot: bots fill the hidden field. Log and pretend it worked.
  if coalesce(payload ->> 'website', '') <> '' then
    insert into public.profile_submission_attempts (email, ip_hash, outcome) values (v_email, v_ip, 'honeypot');
    return jsonb_build_object('ok', true);
  end if;

  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'A valid work email is required' using errcode = 'check_violation';
  end if;
  if coalesce(btrim(payload ->> 'full_name'), '') = '' or coalesce(btrim(payload ->> 'organisation'), '') = '' then
    raise exception 'Full name and organisation are required' using errcode = 'check_violation';
  end if;
  if v_type is null or v_type not in ('bureau','venue','ministry','association','airline') then
    raise exception 'Choose a submitter type' using errcode = 'check_violation';
  end if;
  if not exists (select 1 from public.countries where id = v_country and type = 'country') then
    raise exception 'Choose the country covered' using errcode = 'check_violation';
  end if;
  if coalesce(jsonb_typeof(payload -> 'fields'), '') <> 'array' or jsonb_array_length(payload -> 'fields') = 0 then
    raise exception 'Add at least one data point' using errcode = 'check_violation';
  end if;
  if jsonb_array_length(payload -> 'fields') > 40 then
    raise exception 'Too many data points in one submission' using errcode = 'check_violation';
  end if;

  -- Rate limits: 3 submissions per email per day, 10 attempts per IP per hour.
  if (select count(*) from public.profile_submission_attempts
       where email = v_email and at > now() - interval '24 hours' and outcome = 'submitted') >= 3 then
    insert into public.profile_submission_attempts (email, ip_hash, outcome) values (v_email, v_ip, 'rate_email');
    raise exception 'Daily limit reached for this email. Try again tomorrow.' using errcode = 'check_violation';
  end if;
  if (select count(*) from public.profile_submission_attempts
       where ip_hash = v_ip and at > now() - interval '1 hour') >= 10 then
    insert into public.profile_submission_attempts (email, ip_hash, outcome) values (v_email, v_ip, 'rate_ip');
    raise exception 'Too many attempts. Try again in an hour.' using errcode = 'check_violation';
  end if;

  v_domain := split_part(v_email, '@', 2);
  v_free   := exists (select 1 from public.freemail_domains where domain = v_domain);
  v_dom_ok := exists (select 1 from public.verified_submitter_domains d
                       where d.domain = v_domain and (d.country_id is null or d.country_id = v_country));

  select id into v_sub from public.profile_submitters
   where lower(work_email) = v_email and country_id = v_country and submitter_type = v_type;
  if v_sub is null then
    insert into public.profile_submitters (full_name, organisation, role, work_email, submitter_type, country_id, freemail_flag, domain_verified)
    values (btrim(payload ->> 'full_name'), btrim(payload ->> 'organisation'), nullif(btrim(payload ->> 'role'), ''),
            v_email, v_type, v_country, v_free, v_dom_ok)
    returning id into v_sub;
  else
    if exists (select 1 from public.profile_submitters where id = v_sub and status = 'blocked') then
      insert into public.profile_submission_attempts (email, ip_hash, outcome) values (v_email, v_ip, 'blocked');
      raise exception 'This submitter is blocked. Contact the pipeline team.' using errcode = 'check_violation';
    end if;
    update public.profile_submitters
       set full_name = btrim(payload ->> 'full_name'), organisation = btrim(payload ->> 'organisation'),
           role = nullif(btrim(payload ->> 'role'), ''), freemail_flag = v_free, domain_verified = v_dom_ok
     where id = v_sub;
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.profile_submissions (submitter_id, country_id, submitter_type, token_hash, token_expires_at, ip_hash, freemail_flag)
  values (v_sub, v_country, v_type, encode(extensions.digest(v_token, 'sha256'), 'hex'), now() + interval '48 hours', v_ip, v_free)
  returning id into v_subm;

  for f in select * from jsonb_array_elements(payload -> 'fields') loop
    if coalesce(f ->> 'value', '') = '' then continue; end if;
    if coalesce(f ->> 'as_of', '') !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'Each data point needs an as-of date (YYYY-MM-DD)' using errcode = 'check_violation';
    end if;
    insert into public.profile_submission_fields (submission_id, field_key, proposed_value, as_of_date, source_url, supporting_file)
    values (v_subm, f ->> 'key', f ->> 'value', (f ->> 'as_of')::date,
            nullif(btrim(f ->> 'source_url'), ''),
            case when coalesce(f ->> 'supporting_file', '') <> ''
                 then (select upload_key::text from public.profile_submissions where id = v_subm) || '/' || (f ->> 'key') || '/' || regexp_replace(f ->> 'supporting_file', '[^A-Za-z0-9._-]', '_', 'g')
            end);
    n := n + 1;
  end loop;
  if n = 0 then
    raise exception 'Add at least one data point' using errcode = 'check_violation';
  end if;

  insert into public.profile_submission_attempts (email, ip_hash, outcome) values (v_email, v_ip, 'submitted');

  -- Verification email. The edge function and the Vault secret are created
  -- separately; until both exist the submission waits in awaiting_email and
  -- an admin can verify it by hand.
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'submission_webhook_secret' limit 1;
  if v_secret is not null then
    perform net.http_post(
      url := 'https://upzkvszgoqhoefkiwoep.supabase.co/functions/v1/send-submission-verification',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
      body := jsonb_build_object('submission_id', v_subm, 'email', v_email,
                                 'name', btrim(payload ->> 'full_name'), 'token', v_token),
      timeout_milliseconds := 5000);
    v_sent := true;
  end if;

  return jsonb_build_object('ok', true, 'submission_id', v_subm,
                            'upload_key', (select upload_key from public.profile_submissions where id = v_subm),
                            'email_sent', v_sent);
end $$;
revoke all on function public.profile_submit(jsonb) from public;
grant execute on function public.profile_submit(jsonb) to anon, authenticated;

-- profile_verify(token): the magic link. Moves the submission into the queue.
create or replace function public.profile_verify(token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s public.profile_submissions%rowtype;
begin
  if token is null or length(token) <> 64 then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  select * into s from public.profile_submissions
   where token_hash = encode(extensions.digest(token, 'sha256'), 'hex');
  if s.id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  if s.status <> 'awaiting_email' then
    return jsonb_build_object('ok', true, 'already', true, 'status_key', s.status_key);
  end if;
  if s.token_expires_at < now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;
  update public.profile_submissions
     set status = 'new', email_verified_at = now(), token_hash = null, token_expires_at = null
   where id = s.id;
  update public.profile_submitters set email_verified_at = coalesce(email_verified_at, now()) where id = s.submitter_id;
  return jsonb_build_object('ok', true, 'status_key', s.status_key);
end $$;
revoke all on function public.profile_verify(text) from public;
grant execute on function public.profile_verify(text) to anon, authenticated;

-- profile_status(status_key): what the submitter sees afterwards. No
-- reviewer notes, no other submitters' data.
create or replace function public.profile_status(skey uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'status', s.status,
    'submitted_at', s.submitted_at,
    'country', c.name,
    'fields', coalesce((
      select jsonb_agg(jsonb_build_object('label', k.label, 'decision', f.decision) order by k.sort_order)
        from public.profile_submission_fields f
        join public.profile_field_catalog k on k.key = f.field_key
       where f.submission_id = s.id), '[]'::jsonb))
  from public.profile_submissions s
  join public.countries c on c.id = s.country_id
  where s.status_key = skey
$$;
revoke all on function public.profile_status(uuid) from public;
grant execute on function public.profile_status(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 9. Nightly demotion now covers promoted profile fields. Only rows that
--    carry a source_tier (i.e. that entered through the review queue) are
--    touched; the researched rows from migration 005 have none and keep
--    their confidence until a later decision.
-- ---------------------------------------------------------------------------
create or replace function public.pipeline_demote()
returns void language plpgsql security definer set search_path = public as $$
begin
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

  update public.bid_wins set confidence = 'stale'
   where confidence = 'verified' and verified_on is not null
     and verified_on < current_date - case when source_tier = 2 then 30 else 60 end;
  update public.bid_wins set confidence = 'unverified'
   where confidence = 'stale' and verified_on is not null and verified_on < current_date - 120;
  update public.bid_wins set award_status = 'held'
   where award_status = 'awarded'
     and coalesce(event_end, event_start, make_date(edition_year, 12, 31)) < current_date;
  update public.series set confidence = 'stale'
   where confidence = 'verified' and verified_on is not null and verified_on < current_date - 60;
  update public.series set confidence = 'unverified'
   where confidence = 'stale' and verified_on is not null and verified_on < current_date - 120;

  update public.destination_profile_fields set confidence = 'stale'
   where source_tier is not null and confidence = 'verified'
     and verified_on is not null and verified_on < current_date - 60;
  update public.destination_profile_fields set confidence = 'unverified'
   where source_tier is not null and confidence = 'stale'
     and verified_on is not null and verified_on < current_date - 120;

  perform public.history_recompute();
end $$;
revoke all on function public.pipeline_demote() from public, anon, authenticated;

commit;
