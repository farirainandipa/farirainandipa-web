-- Bid Workspace (bw_*) — the software form of the Bid Development & Commercialisation Pack.
-- Multi-tenant from the first schema: every bid belongs to an owning organisation and
-- optionally a client organisation. Admins (public.allowlist) see everything.

create extension if not exists pgcrypto;

-- ---------- enums ----------
do $$ begin
  create type bw_org_kind as enum ('consultancy','client','bureau','partner');
exception when duplicate_object then null; end $$;
do $$ begin
  create type bw_bid_type as enum ('congress','destination','rfp_tender','eoi');
exception when duplicate_object then null; end $$;
do $$ begin
  create type bw_stage as enum ('qualify','decide','contract','mobilise','evidence','draft','submit','close');
exception when duplicate_object then null; end $$;
do $$ begin
  create type bw_outcome as enum ('open','submitted','shortlisted','won','lost','withdrawn','declined');
exception when duplicate_object then null; end $$;
do $$ begin
  create type bw_req_type as enum ('mandatory','scored','administrative','informational');
exception when duplicate_object then null; end $$;
do $$ begin
  create type bw_req_status as enum ('missing','requested','drafted','final','not_applicable');
exception when duplicate_object then null; end $$;
do $$ begin
  create type bw_ask_level as enum ('endorsement','facilitation','commitment','guarantee');
exception when duplicate_object then null; end $$;
do $$ begin
  create type bw_sh_status as enum ('not_sent','sent','overdue','received','declined','substituted');
exception when duplicate_object then null; end $$;
do $$ begin
  create type bw_ms_status as enum ('pending','in_progress','done','slipped');
exception when duplicate_object then null; end $$;
do $$ begin
  create type bw_doc_kind as enum ('requirements','evidence','draft','support_letter','submission','contract','other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type bw_visibility as enum ('client','internal');
exception when duplicate_object then null; end $$;

-- ---------- organisations & membership ----------
create table if not exists public.bw_orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind bw_org_kind not null default 'client',
  country_id int references public.countries(id),
  contact_name text,
  contact_email text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.bw_members (
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references public.bw_orgs(id) on delete cascade,
  email text not null,
  role text not null default 'member',          -- owner | member
  active boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz,
  primary key (user_id, org_id)
);

-- ---------- bids ----------
create table if not exists public.bw_bids (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.bw_orgs(id),          -- owning (consultancy) tenant
  client_org_id uuid references public.bw_orgs(id),            -- the applicant / client
  title text not null,
  issuing_body text,
  bid_type bw_bid_type not null default 'congress',
  host_country_id int references public.countries(id),
  host_city text,
  venue text,
  event_id int references public.events(id),                  -- link to the pipeline
  opportunity_id int references public.bid_opportunities(id),
  stage bw_stage not null default 'qualify',
  outcome bw_outcome not null default 'open',
  submission_deadline date,
  decision_date date,
  event_dates text,
  bid_director text,
  client_sponsor text,
  summary text,
  win_themes text,
  decision_log text,
  client_visible boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bw_bids_client_idx on public.bw_bids(client_org_id);
create index if not exists bw_bids_deadline_idx on public.bw_bids(submission_deadline);

-- scorecards: one row per kind per bid. factors = [{key,label,weight,score,basis}]
create table if not exists public.bw_scores (
  bid_id uuid not null references public.bw_bids(id) on delete cascade,
  kind text not null check (kind in ('bid_no_bid','complexity')),
  factors jsonb not null default '[]'::jsonb,
  extra jsonb not null default '{}'::jsonb,       -- fee adjustments, quoted fee, hours etc.
  notes text,
  updated_at timestamptz not null default now(),
  primary key (bid_id, kind)
);

create table if not exists public.bw_requirements (
  id uuid primary key default gen_random_uuid(),
  bid_id uuid not null references public.bw_bids(id) on delete cascade,
  seq int not null default 0,
  clause_ref text,
  requirement text not null,
  req_type bw_req_type not null default 'mandatory',
  points numeric,
  response_location text,
  input_from text,
  status bw_req_status not null default 'missing',
  due date,
  notes text,
  client_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bw_req_bid_idx on public.bw_requirements(bid_id, seq);

create table if not exists public.bw_stakeholders (
  id uuid primary key default gen_random_uuid(),
  bid_id uuid not null references public.bw_bids(id) on delete cascade,
  seq int not null default 0,
  stakeholder text not null,
  signatory text,
  template_key text,                               -- C1..C9 letter template
  ask_level bw_ask_level not null default 'commitment',
  specific_ask text,
  lead_time_weeks numeric not null default 3,
  drafted_on date,
  sent_on date,
  due_back date,
  chase1_on date,
  chase2_on date,
  received_on date,
  status bw_sh_status not null default 'not_sent',
  escalation_route text,
  notes text,
  client_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bw_sh_bid_idx on public.bw_stakeholders(bid_id, seq);

create table if not exists public.bw_milestones (
  id uuid primary key default gen_random_uuid(),
  bid_id uuid not null references public.bw_bids(id) on delete cascade,
  seq int not null default 0,
  title text not null,
  days_before_deadline int,
  target_date date,
  owner text,
  status bw_ms_status not null default 'pending',
  note text,
  controls_deadline boolean not null default false,
  client_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bw_ms_bid_idx on public.bw_milestones(bid_id, seq);

create table if not exists public.bw_documents (
  id uuid primary key default gen_random_uuid(),
  bid_id uuid not null references public.bw_bids(id) on delete cascade,
  name text not null,
  kind bw_doc_kind not null default 'other',
  storage_path text,                               -- bid-docs/<bid_id>/<file>
  external_url text,
  version int not null default 1,
  size_bytes bigint,
  uploaded_by text,
  note text,
  client_visible boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists bw_doc_bid_idx on public.bw_documents(bid_id);

create table if not exists public.bw_messages (
  id uuid primary key default gen_random_uuid(),
  bid_id uuid not null references public.bw_bids(id) on delete cascade,
  author_id uuid,
  author_email text,
  author_name text,
  body text not null,
  visibility bw_visibility not null default 'internal',
  created_at timestamptz not null default now()
);
create index if not exists bw_msg_bid_idx on public.bw_messages(bid_id, created_at);

create table if not exists public.bw_activity (
  id bigserial primary key,
  bid_id uuid references public.bw_bids(id) on delete cascade,
  at timestamptz not null default now(),
  actor text,
  action text not null,
  table_name text,
  summary text,
  client_visible boolean not null default true
);
create index if not exists bw_act_bid_idx on public.bw_activity(bid_id, at desc);

-- reference data: letter templates (Doc 07) and the milestone / stakeholder defaults (workbook tabs 4 and 7)
create table if not exists public.bw_letter_templates (
  key text primary key,
  title text not null,
  signed_by text,
  body text not null,
  sort int not null default 0
);

create table if not exists public.bw_milestone_defaults (
  seq int primary key,
  title text not null,
  days_before_deadline int not null,
  owner text,
  controls_deadline boolean not null default false
);

create table if not exists public.bw_stakeholder_defaults (
  seq int primary key,
  stakeholder text not null,
  signatory text,
  template_key text,
  ask_level bw_ask_level not null,
  lead_time_weeks numeric not null,
  route_in text,
  ask_for text
);

-- ---------- helpers ----------
-- Admin check: allowlisted JWT email, or a direct server-side session (no PostgREST JWT claims at all).
create or replace function public.bw_is_admin() returns boolean
language sql stable security definer set search_path = public as
$$ select public.is_allowlisted() or coalesce(nullif(current_setting('request.jwt.claims', true), ''), '') = '' $$;

create or replace function public.bw_my_orgs() returns setof uuid
language sql stable security definer set search_path = public as
$$ select org_id from public.bw_members where user_id = auth.uid() and active $$;

create or replace function public.bw_can_see_bid(b uuid) returns boolean
language sql stable security definer set search_path = public as
$$ select public.bw_is_admin() or exists (
     select 1 from public.bw_bids x
      where x.id = b and x.client_visible
        and (x.client_org_id in (select public.bw_my_orgs()) or x.org_id in (select public.bw_my_orgs()))) $$;

create or replace function public.bw_my_role() returns jsonb
language sql stable security definer set search_path = public as
$$ select case
     when public.bw_is_admin() then jsonb_build_object('role','admin','email', auth.jwt()->>'email')
     when exists (select 1 from public.bw_members where user_id = auth.uid() and active) then
       (select jsonb_build_object('role','client','email', m.email,
                'orgs', jsonb_agg(jsonb_build_object('id', o.id, 'name', o.name, 'kind', o.kind)))
          from public.bw_members m join public.bw_orgs o on o.id = m.org_id
         where m.user_id = auth.uid() and m.active group by m.email limit 1)
     else jsonb_build_object('role','none') end $$;

-- updated_at + activity log
create or replace function public.bw_touch() returns trigger language plpgsql as
$$ begin new.updated_at = now(); return new; end $$;

create or replace function public.bw_log() returns trigger
language plpgsql security definer set search_path = public as
$$
declare bid uuid; s text; vis boolean := true; jn jsonb; jo jsonb;
begin
  jn := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  jo := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  if tg_table_name = 'bw_bids' then
    bid := coalesce((jn->>'id')::uuid, (jo->>'id')::uuid);
    s := case tg_op when 'INSERT' then 'Bid created'
                    when 'UPDATE' then case when jn->>'stage' is distinct from jo->>'stage' then 'Stage moved to ' || (jn->>'stage')
                                            when jn->>'outcome' is distinct from jo->>'outcome' then 'Outcome set to ' || (jn->>'outcome')
                                            else 'Bid details updated' end
                    else 'Bid deleted' end;
  else
    bid := coalesce((jn->>'bid_id')::uuid, (jo->>'bid_id')::uuid);
    vis := coalesce((jn->>'client_visible')::boolean, (jo->>'client_visible')::boolean, true);
    if tg_table_name = 'bw_requirements' then
      s := case tg_op when 'INSERT' then 'Requirement added: ' || left(jn->>'requirement', 80)
                      when 'UPDATE' then 'Requirement ' || coalesce(jn->>'clause_ref','') || ' → ' || (jn->>'status')
                      else 'Requirement removed' end;
    elsif tg_table_name = 'bw_stakeholders' then
      s := case tg_op when 'INSERT' then 'Stakeholder added: ' || (jn->>'stakeholder')
                      when 'UPDATE' then (jn->>'stakeholder') || ' → ' || (jn->>'status')
                      else 'Stakeholder removed' end;
    elsif tg_table_name = 'bw_milestones' then
      s := case tg_op when 'INSERT' then 'Milestone added: ' || (jn->>'title')
                      when 'UPDATE' then (jn->>'title') || ' → ' || (jn->>'status')
                      else 'Milestone removed' end;
    elsif tg_table_name = 'bw_documents' then
      s := case tg_op when 'INSERT' then 'Document added: ' || (jn->>'name')
                      when 'DELETE' then 'Document removed: ' || (jo->>'name')
                      else 'Document updated: ' || (jn->>'name') end;
    end if;
  end if;
  if tg_op = 'UPDATE' and tg_table_name <> 'bw_bids' and (jn - 'updated_at') = (jo - 'updated_at') then
    return new;
  end if;
  insert into public.bw_activity (bid_id, actor, action, table_name, summary, client_visible)
  values (bid, public.audit_actor(), tg_op, tg_table_name, s, vis);
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

do $$ declare t text; begin
  foreach t in array array['bw_bids','bw_requirements','bw_stakeholders','bw_milestones'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format('create trigger %I_touch before update on public.%I for each row execute function public.bw_touch()', t, t);
  end loop;
  foreach t in array array['bw_bids','bw_requirements','bw_stakeholders','bw_milestones','bw_documents'] loop
    execute format('drop trigger if exists %I_log on public.%I', t, t);
    execute format('create trigger %I_log after insert or update or delete on public.%I for each row execute function public.bw_log()', t, t);
  end loop;
end $$;

-- stakeholder chase ladder (Doc 07 Part D): chase 1 day 10, chase 2 day 17, due back = sent + lead time
create or replace function public.bw_stakeholder_dates() returns trigger language plpgsql as
$$ begin
  if new.sent_on is not null and (tg_op = 'INSERT' or new.sent_on is distinct from old.sent_on) then
    new.chase1_on := coalesce(new.chase1_on, new.sent_on + 10);
    new.chase2_on := coalesce(new.chase2_on, new.sent_on + 17);
    new.due_back  := coalesce(new.due_back, new.sent_on + (new.lead_time_weeks * 7)::int);
    if new.status = 'not_sent' then new.status := 'sent'; end if;
  end if;
  if new.received_on is not null then new.status := 'received'; end if;
  if new.status = 'sent' and new.due_back is not null and new.due_back < current_date then new.status := 'overdue'; end if;
  return new;
end $$;
drop trigger if exists bw_stakeholders_dates on public.bw_stakeholders;
create trigger bw_stakeholders_dates before insert or update on public.bw_stakeholders
  for each row execute function public.bw_stakeholder_dates();

-- milestones recalc when the deadline changes
create or replace function public.bw_recalc_milestones() returns trigger language plpgsql as
$$ begin
  if new.submission_deadline is distinct from old.submission_deadline and new.submission_deadline is not null then
    update public.bw_milestones set target_date = new.submission_deadline - days_before_deadline
     where bid_id = new.id and days_before_deadline is not null;
  end if;
  return new;
end $$;
drop trigger if exists bw_bids_recalc on public.bw_bids;
create trigger bw_bids_recalc after update of submission_deadline on public.bw_bids
  for each row execute function public.bw_recalc_milestones();

-- seed helpers called by the app
create or replace function public.bw_generate_milestones(p_bid uuid) returns int
language plpgsql security definer set search_path = public as
$$ declare d date; n int; begin
  if not public.bw_is_admin() then raise exception 'admins only'; end if;
  select submission_deadline into d from public.bw_bids where id = p_bid;
  insert into public.bw_milestones (bid_id, seq, title, days_before_deadline, target_date, owner, controls_deadline)
  select p_bid, seq, title, days_before_deadline, case when d is null then null else d - days_before_deadline end, owner, controls_deadline
    from public.bw_milestone_defaults m
   where not exists (select 1 from public.bw_milestones x where x.bid_id = p_bid and x.seq = m.seq);
  get diagnostics n = row_count; return n;
end $$;

create or replace function public.bw_seed_stakeholders(p_bid uuid) returns int
language plpgsql security definer set search_path = public as
$$ declare n int; begin
  if not public.bw_is_admin() then raise exception 'admins only'; end if;
  insert into public.bw_stakeholders (bid_id, seq, stakeholder, signatory, template_key, ask_level, lead_time_weeks, specific_ask, escalation_route)
  select p_bid, seq, stakeholder, signatory, template_key, ask_level, lead_time_weeks, ask_for, route_in
    from public.bw_stakeholder_defaults s
   where not exists (select 1 from public.bw_stakeholders x where x.bid_id = p_bid and x.seq = s.seq);
  get diagnostics n = row_count; return n;
end $$;

-- bulk requirement insert (from the extractor)
create or replace function public.bw_add_requirements(p_bid uuid, rows jsonb) returns int
language plpgsql security definer set search_path = public as
$$ declare n int; base int; begin
  if not public.bw_is_admin() then raise exception 'admins only'; end if;
  select coalesce(max(seq),0) into base from public.bw_requirements where bid_id = p_bid;
  insert into public.bw_requirements (bid_id, seq, clause_ref, requirement, req_type, points, response_location, input_from, status, due, notes)
  select p_bid, base + (ord)::int, r->>'clause_ref', r->>'requirement',
         coalesce(nullif(r->>'req_type','')::bw_req_type, 'mandatory'),
         nullif(r->>'points','')::numeric, r->>'response_location', r->>'input_from',
         coalesce(nullif(r->>'status','')::bw_req_status, 'missing'), nullif(r->>'due','')::date, r->>'notes'
    from jsonb_array_elements(rows) with ordinality as t(r, ord)
   where coalesce(r->>'requirement','') <> '';
  get diagnostics n = row_count; return n;
end $$;

-- list with counters (what the front door shows)
create or replace function public.bw_bid_list() returns jsonb
language sql stable security definer set search_path = public as
$$ select coalesce(jsonb_agg(row_to_json(q)::jsonb order by
            case when q.outcome in ('open','submitted','shortlisted') then 0 else 1 end, q.submission_deadline nulls last), '[]'::jsonb)
   from (
     select b.id, b.title, b.issuing_body, b.bid_type, b.stage, b.outcome, b.submission_deadline, b.decision_date,
            b.host_city, c.name as host_country, co.name as client_org, b.client_org_id, b.event_id, b.updated_at,
            (b.submission_deadline - current_date) as days_left,
            (select count(*) from public.bw_requirements r where r.bid_id = b.id and (public.bw_is_admin() or r.client_visible)) as req_total,
            (select count(*) from public.bw_requirements r where r.bid_id = b.id and r.req_type = 'mandatory' and r.status not in ('final','not_applicable') and (public.bw_is_admin() or r.client_visible)) as mandatory_open,
            (select count(*) from public.bw_stakeholders s where s.bid_id = b.id and s.status = 'overdue' and (public.bw_is_admin() or s.client_visible)) as letters_overdue,
            (select count(*) from public.bw_stakeholders s where s.bid_id = b.id and s.status = 'received' and (public.bw_is_admin() or s.client_visible)) as letters_received,
            (select count(*) from public.bw_stakeholders s where s.bid_id = b.id and (public.bw_is_admin() or s.client_visible)) as letters_total,
            (select jsonb_build_object('title', m.title, 'target_date', m.target_date)
               from public.bw_milestones m where m.bid_id = b.id and m.status in ('pending','in_progress') and m.target_date is not null
                and (public.bw_is_admin() or m.client_visible)
              order by m.target_date limit 1) as next_milestone,
            (select count(*) from public.bw_milestones m where m.bid_id = b.id and m.status in ('pending','in_progress') and m.target_date < current_date and (public.bw_is_admin() or m.client_visible)) as milestones_overdue
       from public.bw_bids b
       left join public.countries c on c.id = b.host_country_id
       left join public.bw_orgs co on co.id = b.client_org_id
      where public.bw_can_see_bid(b.id)
   ) q $$;

-- ---------- RLS ----------
alter table public.bw_orgs enable row level security;
alter table public.bw_members enable row level security;
alter table public.bw_bids enable row level security;
alter table public.bw_scores enable row level security;
alter table public.bw_requirements enable row level security;
alter table public.bw_stakeholders enable row level security;
alter table public.bw_milestones enable row level security;
alter table public.bw_documents enable row level security;
alter table public.bw_messages enable row level security;
alter table public.bw_activity enable row level security;
alter table public.bw_letter_templates enable row level security;
alter table public.bw_milestone_defaults enable row level security;
alter table public.bw_stakeholder_defaults enable row level security;

-- orgs: admins all; members see their own orgs
drop policy if exists bw_orgs_admin on public.bw_orgs;
create policy bw_orgs_admin on public.bw_orgs for all to authenticated using (public.bw_is_admin()) with check (public.bw_is_admin());
drop policy if exists bw_orgs_member on public.bw_orgs;
create policy bw_orgs_member on public.bw_orgs for select to authenticated using (id in (select public.bw_my_orgs()));

drop policy if exists bw_members_admin on public.bw_members;
create policy bw_members_admin on public.bw_members for all to authenticated using (public.bw_is_admin()) with check (public.bw_is_admin());
drop policy if exists bw_members_self on public.bw_members;
create policy bw_members_self on public.bw_members for select to authenticated using (user_id = auth.uid());

-- bids: admins write; visible parties read
drop policy if exists bw_bids_admin on public.bw_bids;
create policy bw_bids_admin on public.bw_bids for all to authenticated using (public.bw_is_admin()) with check (public.bw_is_admin());
drop policy if exists bw_bids_read on public.bw_bids;
create policy bw_bids_read on public.bw_bids for select to authenticated using (public.bw_can_see_bid(id));

-- scores: admin only (fee and no-bid reasoning are internal)
drop policy if exists bw_scores_admin on public.bw_scores;
create policy bw_scores_admin on public.bw_scores for all to authenticated using (public.bw_is_admin()) with check (public.bw_is_admin());

-- child tables: admin all; clients read client-visible rows of bids they can see
do $$ declare t text; begin
  foreach t in array array['bw_requirements','bw_stakeholders','bw_milestones','bw_documents','bw_activity'] loop
    execute format('drop policy if exists %I_admin on public.%I', t, t);
    execute format('create policy %I_admin on public.%I for all to authenticated using (public.bw_is_admin()) with check (public.bw_is_admin())', t, t);
    execute format('drop policy if exists %I_client_read on public.%I', t, t);
    execute format('create policy %I_client_read on public.%I for select to authenticated using (client_visible and public.bw_can_see_bid(bid_id))', t, t);
  end loop;
end $$;

-- clients may add documents to their own bids (always client-visible)
drop policy if exists bw_documents_client_insert on public.bw_documents;
create policy bw_documents_client_insert on public.bw_documents for insert to authenticated
  with check (client_visible and public.bw_can_see_bid(bid_id));

-- clients may update status fields on their own stakeholder rows? No — they message instead (MVP).

-- messages: admin all; clients read/write client-visibility messages on bids they can see
drop policy if exists bw_messages_admin on public.bw_messages;
create policy bw_messages_admin on public.bw_messages for all to authenticated using (public.bw_is_admin()) with check (public.bw_is_admin());
drop policy if exists bw_messages_client_read on public.bw_messages;
create policy bw_messages_client_read on public.bw_messages for select to authenticated using (visibility = 'client' and public.bw_can_see_bid(bid_id));
drop policy if exists bw_messages_client_insert on public.bw_messages;
create policy bw_messages_client_insert on public.bw_messages for insert to authenticated
  with check (visibility = 'client' and author_id = auth.uid() and public.bw_can_see_bid(bid_id));

-- reference tables: read by any signed-in user, written by admins
do $$ declare t text; begin
  foreach t in array array['bw_letter_templates','bw_milestone_defaults','bw_stakeholder_defaults'] loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select to authenticated using (true)', t, t);
    execute format('drop policy if exists %I_admin on public.%I', t, t);
    execute format('create policy %I_admin on public.%I for all to authenticated using (public.bw_is_admin()) with check (public.bw_is_admin())', t, t);
  end loop;
end $$;

-- ---------- storage ----------
insert into storage.buckets (id, name, public, file_size_limit)
values ('bid-docs', 'bid-docs', false, 52428800)
on conflict (id) do nothing;

drop policy if exists bw_docs_read on storage.objects;
create policy bw_docs_read on storage.objects for select to authenticated
  using (bucket_id = 'bid-docs' and public.bw_can_see_bid(((storage.foldername(name))[1])::uuid));
drop policy if exists bw_docs_insert on storage.objects;
create policy bw_docs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'bid-docs' and public.bw_can_see_bid(((storage.foldername(name))[1])::uuid));
drop policy if exists bw_docs_admin on storage.objects;
create policy bw_docs_admin on storage.objects for all to authenticated
  using (bucket_id = 'bid-docs' and public.bw_is_admin()) with check (bucket_id = 'bid-docs' and public.bw_is_admin());

-- ---------- reference data ----------
insert into public.bw_milestone_defaults (seq, title, days_before_deadline, owner, controls_deadline) values
 (1,'Engagement commences — first payment received',84,'Bid director',false),
 (2,'Requirement documents complete, including all addenda',82,'Client',false),
 (3,'Compliance matrix built and signed off',77,'Compliance lead',false),
 (4,'Production schedule and roles agreed at kick-off',77,'Bid director',false),
 (5,'ALL third-party document requests issued',75,'Stakeholder lead',true),
 (6,'Win themes agreed with client',70,'Bid director',false),
 (7,'Venue hold or letter of intent obtained',63,'Client',false),
 (8,'Destination and technical evidence base complete',56,'Evidence lead',false),
 (9,'Budget model complete',49,'Evidence lead',false),
 (10,'Economic impact model complete',49,'Evidence lead',false),
 (11,'First full draft complete',35,'Bid director',false),
 (12,'Client review returned, consolidated',28,'Client sponsor',false),
 (13,'Support letter chase 2 / escalation point',28,'Stakeholder lead',false),
 (14,'Second draft complete',21,'Bid director',false),
 (15,'ALL third-party documents in hand',21,'Stakeholder lead',false),
 (16,'Compliance read complete — no gaps remain',17,'Reviewer',false),
 (17,'Content lock — no further text changes',14,'Bid director',false),
 (18,'Design and production complete',7,'Design',false),
 (19,'Full QA checklist run (Doc 09 Part A)',4,'Reviewer',false),
 (20,'Client written approval of final content',3,'Client sponsor',false),
 (21,'SUBMISSION LODGED',2,'Bid director',true),
 (22,'Written acknowledgement obtained from issuer',1,'Bid director',false),
 (23,'Pitch rehearsal 1',-7,'Bid director',false),
 (24,'Pitch rehearsal 2 with hostile Q&A',-14,'Bid director',false)
on conflict (seq) do update set title = excluded.title, days_before_deadline = excluded.days_before_deadline, owner = excluded.owner, controls_deadline = excluded.controls_deadline;

insert into public.bw_stakeholder_defaults (seq, stakeholder, signatory, template_key, ask_level, lead_time_weeks, route_in, ask_for) values
 (1,'Sponsoring ministry','Permanent Secretary','C1','commitment',6,'Permanent Secretary or Director of the relevant department','Commitment plus facilitation (visas, customs, protocol, named financial or in-kind support)'),
 (2,'National convention bureau','Chief Executive','C2','commitment',3,'Direct — this is their core business','Commitment: subvention, bid support, delegate services'),
 (3,'City / municipality','Mayor / Town Clerk','C3','commitment',4,'City clerk or economic development office','Civic welcome, city services, venue support'),
 (4,'National association','President','C4','commitment',3,'President or executive director','Endorsement plus membership mobilisation commitment'),
 (5,'Venue','Sales Director','C5','guarantee',2,'Sales director','Written hold or letter of intent with dates and rates'),
 (6,'Lead hotel(s)','Director of Sales','C6','commitment',3,'Director of sales, via the bureau where one exists','Provisional block with indicative rates'),
 (7,'Airline','Country Manager','C7','commitment',6,'Corporate sales or country manager','Official carrier arrangement or delegate fare'),
 (8,'Academic / research partner','Vice-Chancellor / Dean','C8','commitment',3,'Vice-chancellor''s office or faculty dean','Content partnership, speakers, legacy commitment'),
 (9,'Private sector sponsor','Marketing Director','C9','commitment',5,'Marketing or corporate affairs director','Financial commitment with a stated value')
on conflict (seq) do update set stakeholder = excluded.stakeholder, signatory = excluded.signatory, template_key = excluded.template_key, ask_level = excluded.ask_level, lead_time_weeks = excluded.lead_time_weeks, route_in = excluded.route_in, ask_for = excluded.ask_for;
