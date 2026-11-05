-- 008: Bid history layer (ICCA Bid Wins)
-- Adds organisers, series and bid_wins, a licence tier on user_access, tier-gated
-- read RPCs for the bureau portal, a public teaser RPC, the rotation estimate and
-- the history rules in the nightly demotion job.
-- Specs: Claude Docs "Bid History Layer: ICCA Bid Wins in the Pipeline" and
-- "Bureau Licence Tiers" (5 Nov 2026).
--
-- Reversal (run in this order):
--   select cron.unschedule('icca_bid_wins_weekly');
--   drop function if exists public.bid_wins_teaser(), public.bid_history(), public.bid_history_preview(int,text),
--     public.bid_history_competitors(text[]), public.history_data(int,text), public.history_ingest_icca(jsonb),
--     public.history_recompute(), public.my_tier(), public.tier_rank(text), public.series_norm(text), public.lead_text_months(text);
--   alter table public.events drop constraint if exists events_series_fk;
--   alter table public.bid_opportunities drop constraint if exists bid_opportunities_series_fk;
--   drop table if exists public.bid_wins, public.series, public.organisers;
--   alter table public.user_access drop constraint if exists user_access_bureau_tier_chk, drop column if exists tier;
--   then re-apply pipeline_demote() and my_access() from migration 004 / the live definitions noted below.

begin;

-- ---------------------------------------------------------------------------
-- 1. Organisers
-- ---------------------------------------------------------------------------
create table if not exists public.organisers (
  id           bigserial primary key,
  name         text not null,
  aliases      text[] not null default '{}',
  website      text,
  icca_listed  boolean not null default false,
  source_url   text,
  verified_on  date,
  created_at   timestamptz not null default now()
);
create unique index if not exists organisers_name_uq on public.organisers (lower(name));

-- ---------------------------------------------------------------------------
-- 2. Series (parent record for events.series_key)
-- ---------------------------------------------------------------------------
create table if not exists public.series (
  key                       text primary key,
  name                      text not null,
  aliases                   text[] not null default '{}',
  organiser_id              bigint references public.organisers(id) on delete set null,
  sector                    public.sector_bucket,
  cycle_length_months       int,
  rotation_pattern          text,
  decision_body             text,
  typical_award_lead_months int,
  next_window_start         date,
  next_window_end           date,
  next_window_basis         text,
  history_depth             int not null default 0,
  last_edition_year         int,
  dormant                   boolean not null default false,
  fixed_venue               boolean not null default false,
  source_url                text,
  source_tier               smallint check (source_tier between 1 and 4),
  confidence                text not null default 'unverified'
    check (confidence in ('verified','stale','unverified','conflict')),
  verified_on               date,
  conflict_note             text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Name normaliser used for matching: lower case, no years, no ordinals or
-- roman numerals, no punctuation.
create or replace function public.series_norm(t text)
returns text language sql immutable set search_path = public as $$
  select btrim(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(lower(coalesce(t,'')),
    '\m(19|20)\d{2}\M', ' ', 'g'),
    '\m\d+(st|nd|rd|th)\M', ' ', 'g'),
    '\m(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|[ivxlc]+)\M', ' ', 'g'),
    '[^a-z0-9]+', ' ', 'g'),
    '\s+', ' ', 'g'))
$$;

-- Backfill one series per distinct events / bid_opportunities series_key.
insert into public.series (key, name, sector, rotation_pattern, decision_body, fixed_venue, source_url, source_tier, confidence, verified_on, aliases)
select distinct on (e.series_key)
       e.series_key,
       btrim(regexp_replace(e.event_name, '\s*\(?\m(19|20)\d{2}\M\)?', '', 'g')),
       e.sector, e.rotation_pattern, e.decision_body, coalesce(e.fixed_venue,false),
       e.source_url, e.source_tier, e.confidence, e.verified_on,
       array[e.event_name]
  from public.events e
 where e.series_key is not null
 order by e.series_key, e.id
on conflict (key) do nothing;

insert into public.series (key, name, source_url, source_tier, confidence, verified_on, aliases)
select distinct on (o.series_key) o.series_key, o.title, o.primary_source_url, o.source_tier, o.confidence, o.verified_on, array[o.title]
  from public.bid_opportunities o
 where o.series_key is not null
 order by o.series_key, o.id
on conflict (key) do nothing;

-- Organisers from the rotation map (one per distinct organiser string).
insert into public.organisers (name, source_url, verified_on)
select distinct on (lower(e.organiser)) e.organiser, e.source_url, e.verified_on
  from public.events e where e.organiser is not null and btrim(e.organiser) <> ''
 order by lower(e.organiser), e.id
on conflict do nothing;

update public.series s set organiser_id = o.id
  from public.events e join public.organisers o on lower(o.name) = lower(e.organiser)
 where e.series_key = s.key and s.organiser_id is null;

alter table public.events drop constraint if exists events_series_fk;
alter table public.events add constraint events_series_fk
  foreign key (series_key) references public.series(key) on update cascade on delete set null;
alter table public.bid_opportunities drop constraint if exists bid_opportunities_series_fk;
alter table public.bid_opportunities add constraint bid_opportunities_series_fk
  foreign key (series_key) references public.series(key) on update cascade on delete set null;

-- ---------------------------------------------------------------------------
-- 3. Bid wins: one row per awarded or held edition. History only; future
--    opportunities stay on events / bid_opportunities.
-- ---------------------------------------------------------------------------
create table if not exists public.bid_wins (
  id                      bigserial primary key,
  series_key              text not null references public.series(key) on update cascade on delete cascade,
  edition_year            int check (edition_year between 1950 and 2100),
  edition_label           text,
  award_status            text not null default 'awarded' check (award_status in ('awarded','held','cancelled')),
  awarded_on              date,
  event_start             date,
  event_end               date,
  host_country_id         int references public.countries(id),
  host_country_name       text,
  host_iso2               text check (host_iso2 ~ '^[A-Z]{2}$'),
  host_region             text,     -- African region from countries, or a world region for non-African hosts
  host_city               text,
  africa_hosted           boolean generated always as (host_country_id is not null) stored,
  winning_bidder          text,
  competing_destinations  text[] not null default '{}',
  win_factors             text,
  win_factors_status      text not null default 'draft' check (win_factors_status in ('draft','reviewed')),
  source_quote            text check (source_quote is null or array_length(regexp_split_to_array(btrim(source_quote), '\s+'), 1) < 15),
  decision_body           text,
  decision_lead_time_months int generated always as (
    case when awarded_on is not null and event_start is not null and event_start > awarded_on
         then round((event_start - awarded_on) / 30.4375)::int end) stored,
  sector                  public.sector_bucket,
  source_url              text,
  source_tier             smallint check (source_tier between 1 and 4),
  icca_post_id            bigint unique,
  confidence              text not null default 'unverified'
    check (confidence in ('verified','stale','unverified','conflict')),
  verified_on             date,
  conflict_note           text,
  added_by                text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create unique index if not exists bid_wins_edition_uq on public.bid_wins (series_key, coalesce(edition_label, edition_year::text, id::text));
create index if not exists bid_wins_host_country_idx on public.bid_wins (host_country_id);
create index if not exists bid_wins_series_idx on public.bid_wins (series_key, edition_year);

drop trigger if exists trg_bid_wins_updated on public.bid_wins;
create trigger trg_bid_wins_updated before update on public.bid_wins for each row execute function public.update_updated_at_column();
drop trigger if exists trg_series_updated on public.series;
create trigger trg_series_updated before update on public.series for each row execute function public.update_updated_at_column();

-- past_events_hosted (0 rows) is superseded by bid_wins; left in place, unused.
comment on table public.past_events_hosted is 'Superseded by bid_wins (migration 008). Empty; kept so older code paths do not break.';

-- RLS: base tables are admin-only. Bureaux and the public read through the
-- tier-gated security-definer RPCs below, never the tables.
alter table public.organisers enable row level security;
alter table public.series     enable row level security;
alter table public.bid_wins   enable row level security;
drop policy if exists org_admin_all on public.organisers;
create policy org_admin_all on public.organisers for all to authenticated using (public.is_allowlisted()) with check (public.is_allowlisted());
drop policy if exists series_admin_all on public.series;
create policy series_admin_all on public.series for all to authenticated using (public.is_allowlisted()) with check (public.is_allowlisted());
drop policy if exists bw_admin_all on public.bid_wins;
create policy bw_admin_all on public.bid_wins for all to authenticated using (public.is_allowlisted()) with check (public.is_allowlisted());

-- ---------------------------------------------------------------------------
-- 4. Licence tier on user_access
-- ---------------------------------------------------------------------------
alter table public.user_access add column if not exists tier text
  check (tier in ('free','explorer','bureau','bureau_plus'));
-- Every bureau login needs a tier. NOT VALID because the two legacy bureau rows
-- are removed separately after the owner confirms the list; validate then.
alter table public.user_access drop constraint if exists user_access_bureau_tier_chk;
alter table public.user_access add constraint user_access_bureau_tier_chk
  check (role <> 'bureau' or tier is not null) not valid;

create or replace function public.tier_rank(t text)
returns int language sql immutable set search_path = public as $$
  select case t when 'admin' then 9 when 'bureau_plus' then 3 when 'bureau' then 2 when 'explorer' then 1 when 'free' then 0 else -1 end
$$;

create or replace function public.my_tier()
returns text language sql stable security definer set search_path = public as $$
  select case when public.is_allowlisted() then 'admin'
              else (select tier from public.user_access where user_id = auth.uid() and role = 'bureau' and active limit 1) end
$$;

-- my_access() as before, plus the tier.
create or replace function public.my_access()
returns jsonb language sql stable security definer set search_path = public as $$
  select case
    when public.is_allowlisted() then jsonb_build_object('role','admin','tier','admin')
    when exists(select 1 from public.user_access where user_id=auth.uid() and role='bureau' and active)
      then (select jsonb_build_object('role','bureau','country_id',ua.country_id,'country',c.name,'iso2',c.iso2,'org_name',ua.org_name,'tier',ua.tier)
            from public.user_access ua join public.countries c on c.id=ua.country_id where ua.user_id=auth.uid() limit 1)
    else jsonb_build_object('role','none') end
$$;

-- ---------------------------------------------------------------------------
-- 5. Rotation estimate
-- ---------------------------------------------------------------------------
-- "~2-3 years", "~9-12 months", "4-12 months (short lead)" -> the longer bound in months.
create or replace function public.lead_text_months(t text)
returns int language sql immutable set search_path = public as $$
  select case when m is null then null
              when m[3] like 'year%' then coalesce(m[2], m[1])::int * 12
              else coalesce(m[2], m[1])::int end
    from (select regexp_match(lower(coalesce(t,'')), '(\d+)\s*(?:[-–to ]+\s*(\d+))?\s*(years?|months?)') m) x
$$;

create or replace function public.history_recompute()
returns void language plpgsql security definer set search_path = public as $$
declare r record; yrs int[]; gaps int[]; cyc int; lead int; lead_src text; last_d date; next_d date; tier1 boolean;
begin
  for r in select s.* from public.series s loop
    -- editions with a known host, one per year, oldest first
    select array_agg(y order by y) into yrs from (
      select distinct coalesce(extract(year from event_start)::int, edition_year) y
        from public.bid_wins
       where series_key = r.key and award_status <> 'cancelled'
         and (host_city is not null or host_country_name is not null)
         and coalesce(extract(year from event_start)::int, edition_year) is not null) q;

    cyc := null; lead := null; lead_src := null; next_d := null;
    if coalesce(array_length(yrs,1),0) >= 2 then
      select array_agg(yrs[i+1]-yrs[i] order by i) into gaps from generate_subscripts(yrs,1) i where i < array_length(yrs,1);
      select (percentile_disc(0.5) within group (order by g) * 12)::int into cyc from unnest(gaps) g where g > 0;
    end if;

    select (percentile_disc(0.5) within group (order by decision_lead_time_months))::int into lead
      from public.bid_wins where series_key = r.key and decision_lead_time_months is not null;
    if lead is not null then lead_src := 'median award-to-event lead from history';
    else
      select public.lead_text_months(e.lead_time) into lead from public.events e
       where e.series_key = r.key and public.lead_text_months(e.lead_time) is not null order by e.source_tier nulls last limit 1;
      if lead is not null then lead_src := 'lead time recorded on the rotation map'; end if;
    end if;

    -- an organiser-published (Tier 1) bid window on events always wins
    select exists(select 1 from public.events e where e.series_key = r.key and e.source_tier = 1
                    and e.bid_deadline is not null and e.bid_deadline >= current_date) into tier1;

    select coalesce(max(coalesce(event_start, make_date(edition_year, 7, 1))), null) into last_d
      from public.bid_wins where series_key = r.key and award_status <> 'cancelled'
       and (event_start is not null or edition_year is not null);

    update public.series s set
      history_depth = coalesce(array_length(yrs,1),0),
      last_edition_year = yrs[array_length(yrs,1)],
      cycle_length_months = cyc,
      typical_award_lead_months = lead,
      dormant = (last_d is not null and last_d < current_date - interval '18 months'
                 and not exists (select 1 from public.events e where e.series_key = r.key and e.bid_status not in ('lost','not_pursued')
                                   and e.edition_year is not null and e.edition_year >= extract(year from current_date)::int)),
      next_window_start = null, next_window_end = null,
      next_window_basis = case
        when r.fixed_venue then 'Fixed venue: no bid window to estimate.'
        when tier1 then 'The organiser has published a bid window; see Strategic Events. No estimate shown.'
        when coalesce(array_length(yrs,1),0) < 3 then format('History only: %s edition(s) with a known host; an estimate needs three.', coalesce(array_length(yrs,1),0))
        when cyc is null then 'Editions do not show a regular cycle.'
        when lead is null then 'Cycle known but no lead time recorded, so no window is estimated.'
        else null end
     where s.key = r.key;

    if not r.fixed_venue and not tier1 and coalesce(array_length(yrs,1),0) >= 3 and cyc is not null and cyc > 0 and lead is not null then
      next_d := last_d;
      while next_d <= current_date loop next_d := (next_d + make_interval(months => cyc))::date; end loop;
      -- if the next edition is already awarded, the open window is the one after it
      if exists(select 1 from public.bid_wins where series_key = r.key and award_status = 'awarded'
                  and coalesce(event_start, make_date(edition_year,7,1)) >= next_d - interval '2 months') then
        next_d := (next_d + make_interval(months => cyc))::date;
      end if;
      update public.series s set
        next_window_end   = (next_d - make_interval(months => lead))::date,
        next_window_start = (next_d - make_interval(months => lead + 6))::date,
        next_window_basis = format('Estimate from %s editions (%s), cycle %s months, %s of %s months, minus a 6-month margin. Next edition expected around %s.',
                                   array_length(yrs,1), array_to_string(yrs, ', '), cyc, lead_src, lead, to_char(next_d, 'Mon YYYY'))
       where s.key = r.key;
    end if;
  end loop;
end $$;
revoke all on function public.history_recompute() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Read RPCs (tier-gated, server side)
-- ---------------------------------------------------------------------------
-- Internal: everything a subscriber at tier p_tier may see for country p_cid.
-- Explorer: Verified editions only, 30-day delay on new records (licence doc),
-- no win factors, no next-window fields, no Opening soon.
create or replace function public.history_data(p_cid int, p_tier text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare rk int := public.tier_rank(p_tier); res jsonb;
begin
  if rk < 1 then raise exception 'history requires a paid tier'; end if;
  with w as (
    select b.*, s.name series_name
      from public.bid_wins b join public.series s on s.key = b.series_key
     where b.award_status <> 'cancelled'
       and (rk >= 2 or (b.confidence = 'verified' and b.created_at <= now() - interval '30 days'))
  ), ed as (
    select w.*, jsonb_strip_nulls(jsonb_build_object(
      'id', w.id, 'series_key', w.series_key, 'series', w.series_name, 'year', w.edition_year, 'label', w.edition_label,
      'status', w.award_status, 'awarded_on', w.awarded_on, 'event_start', w.event_start, 'event_end', w.event_end,
      'city', w.host_city, 'country', w.host_country_name, 'iso2', w.host_iso2, 'region', w.host_region, 'africa', w.africa_hosted,
      'winning_bidder', w.winning_bidder, 'competing', case when cardinality(w.competing_destinations) > 0 then to_jsonb(w.competing_destinations) end,
      'decision_body', w.decision_body, 'lead_months', w.decision_lead_time_months, 'sector', w.sector,
      'source_url', w.source_url, 'source_tier', w.source_tier, 'confidence', w.confidence, 'verified_on', w.verified_on,
      'conflict_note', w.conflict_note, 'quote', w.source_quote,
      'win_factors', case when rk >= 2 then w.win_factors end,
      'win_factors_status', case when rk >= 2 and w.win_factors is not null then w.win_factors_status end)) j
      from w
  )
  select jsonb_build_object(
    'tier', p_tier,
    'country', (select jsonb_build_object('id',c.id,'name',c.name,'iso2',c.iso2,'region',c.region) from public.countries c where c.id = p_cid),
    'wins', coalesce((select jsonb_agg(j order by coalesce(edition_year, 0) desc, series_name) from ed where host_country_id = p_cid), '[]'::jsonb),
    'series', coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'key', s.key, 'name', s.name, 'organiser', o.name, 'sector', s.sector, 'rotation_pattern', s.rotation_pattern,
        'decision_body', s.decision_body, 'cycle_months', s.cycle_length_months, 'history_depth', s.history_depth,
        'dormant', s.dormant, 'fixed_venue', s.fixed_venue, 'confidence', s.confidence, 'verified_on', s.verified_on,
        'typical_award_lead_months', case when rk >= 2 then s.typical_award_lead_months end,
        'next_window_start', case when rk >= 2 and s.history_depth >= 3 then s.next_window_start end,
        'next_window_end',   case when rk >= 2 and s.history_depth >= 3 then s.next_window_end end,
        'next_window_basis', case when rk >= 2 then s.next_window_basis end,
        'africa_editions', (select count(*) from ed where ed.series_key = s.key and ed.africa_hosted),
        'editions', (select jsonb_agg(j order by coalesce(edition_year,0) desc) from ed where ed.series_key = s.key)))
        order by s.name)
      from public.series s left join public.organisers o on o.id = s.organiser_id
     where exists (select 1 from ed where ed.series_key = s.key)), '[]'::jsonb),
    'opening_soon', case when rk >= 2 then coalesce((select jsonb_agg(jsonb_build_object(
        'key', s.key, 'name', s.name, 'start', s.next_window_start, 'end', s.next_window_end, 'basis', s.next_window_basis,
        'history_depth', s.history_depth, 'confidence', s.confidence, 'verified_on', s.verified_on) order by s.next_window_start)
      from public.series s
     where s.history_depth >= 3 and s.next_window_end is not null
       and s.next_window_end >= current_date and s.next_window_start <= current_date + interval '18 months'), '[]'::jsonb) end
  ) into res;
  return res;
end $$;
revoke all on function public.history_data(int, text) from public, anon, authenticated;

-- Subscriber entry point: own country, own tier.
create or replace function public.bid_history()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare t text := public.my_tier(); cid int := public.bureau_country_id();
begin
  if t = 'admin' then raise exception 'admins use bid_history_preview(country_id, tier)'; end if;
  if cid is null or public.tier_rank(t) < 1 then return jsonb_build_object('error','not_entitled','tier',t); end if;
  return public.history_data(cid, t);
end $$;

create or replace function public.bid_history_preview(cid int, p_tier text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_allowlisted() then raise exception 'admins only'; end if;
  if p_tier = 'free' then return jsonb_build_object('teaser', public.bid_wins_teaser()); end if;
  return public.history_data(cid, p_tier);
end $$;

-- Competitor view: Bureau Plus only. Wins hosted in the named rival
-- destinations (country names or ISO2 codes, African or not).
create or replace function public.bid_history_competitors(rivals text[])
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare t text := public.my_tier();
begin
  if public.tier_rank(t) < 3 then raise exception 'The competitor view is part of Bureau Plus'; end if;
  return coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'series', s.name, 'series_key', b.series_key, 'year', b.edition_year, 'city', b.host_city, 'country', b.host_country_name,
      'iso2', b.host_iso2, 'region', b.host_region, 'sector', coalesce(b.sector, s.sector), 'status', b.award_status,
      'winning_bidder', b.winning_bidder, 'confidence', b.confidence, 'verified_on', b.verified_on, 'source_url', b.source_url))
      order by b.host_country_name, b.edition_year desc)
    from public.bid_wins b join public.series s on s.key = b.series_key
   where b.award_status <> 'cancelled'
     and (lower(b.host_country_name) = any (select lower(x) from unnest(rivals) x)
          or b.host_iso2 = any (select upper(x) from unnest(rivals) x))), '[]'::jsonb);
end $$;

-- Free teaser: public, no login. Series name plus the last three host
-- countries and years, nothing else.
create or replace function public.bid_wins_teaser()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('series', name, 'hosts', hosts) order by name), '[]'::jsonb)
    from (
      select s.name,
             (select jsonb_agg(jsonb_build_object('country', h.host_country_name, 'year', h.y) order by h.y desc)
                from (select distinct on (coalesce(extract(year from b.event_start)::int, b.edition_year))
                             b.host_country_name, coalesce(extract(year from b.event_start)::int, b.edition_year) y
                        from public.bid_wins b
                       where b.series_key = s.key and b.award_status <> 'cancelled' and b.host_country_name is not null
                         and coalesce(extract(year from b.event_start)::int, b.edition_year) is not null
                       order by coalesce(extract(year from b.event_start)::int, b.edition_year) desc
                       limit 3) h) hosts
        from public.series s
       where exists (select 1 from public.bid_wins b where b.series_key = s.key and b.host_country_name is not null
                       and b.award_status <> 'cancelled')
    ) q
$$;

revoke all on function public.bid_history() from public, anon;
revoke all on function public.bid_history_preview(int, text) from public, anon;
revoke all on function public.bid_history_competitors(text[]) from public, anon;
grant execute on function public.bid_history() to authenticated;
grant execute on function public.bid_history_preview(int, text) to authenticated;
grant execute on function public.bid_history_competitors(text[]) to authenticated;
grant execute on function public.bid_wins_teaser() to anon, authenticated;
revoke all on function public.my_tier() from public, anon;
grant execute on function public.my_tier() to authenticated;

-- ---------------------------------------------------------------------------
-- 7. Pass 1 ingestion (called by the icca-bid-wins edge function with the
--    service role). Each new ICCA post becomes a candidate edition at Tier 2,
--    Unverified. Only a short quote of the post is stored, never the article.
--    posts: [{id, date, link, title, text}]
-- ---------------------------------------------------------------------------
create or replace function public.history_ingest_icca(posts jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p jsonb; t text; n text; k text; yr int; q text; rc int; added int := 0; skipped int := 0; new_series int := 0;
begin
  for p in select * from jsonb_array_elements(posts) loop
    if exists (select 1 from public.bid_wins where icca_post_id = (p->>'id')::bigint or source_url = p->>'link') then
      skipped := skipped + 1; continue;
    end if;
    t := btrim(p->>'title');
    n := public.series_norm(t);
    yr := (regexp_match(t, '\m(20[2-4]\d)\M'))[1]::int;
    select s.key into k from public.series s
     where public.series_norm(s.name) = n
        or exists (select 1 from unnest(s.aliases) a where public.series_norm(a) = n)
     limit 1;
    if k is null then
      k := 'icca-' || left(regexp_replace(n, '\s+', '-', 'g'), 60);
      if exists (select 1 from public.series where key = k) then k := k || '-' || (p->>'id'); end if;
      insert into public.series (key, name, aliases, source_url, source_tier, confidence)
      values (k, btrim(regexp_replace(t, '\s*\(?\m(19|20)\d{2}\M\)?', '', 'g')), array[t], p->>'link', 2, 'unverified');
      new_series := new_series + 1;
    end if;
    q := nullif(array_to_string((regexp_split_to_array(btrim(coalesce(p->>'text','')), '\s+'))[1:14], ' '), '');
    insert into public.bid_wins (series_key, edition_year, edition_label, award_status, awarded_on, source_quote,
                                 source_url, source_tier, icca_post_id, confidence, added_by)
    values (k, yr, coalesce(yr::text, 'ICCA post ' || (p->>'id')),
            case when yr is not null and yr < extract(year from current_date)::int then 'held' else 'awarded' end,
            (p->>'date')::date, q, p->>'link', 2, (p->>'id')::bigint, 'unverified', 'icca-pass1')
    on conflict do nothing;
    get diagnostics rc = row_count;
    if rc > 0 then added := added + 1; else skipped := skipped + 1; end if;
  end loop;
  perform public.history_recompute();
  return jsonb_build_object('added', added, 'skipped', skipped, 'new_series', new_series);
end $$;
revoke all on function public.history_ingest_icca(jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. Nightly demotion: same rules as 004, plus the history layer.
--    bid_wins: Verified -> Stale after 60 days (30 for a Tier 2 ICCA fact not
--    yet confirmed at Tier 1), Stale -> Unverified after 120; Awarded -> Held
--    once the edition has passed. Series: recompute depth, cycle, window and
--    Dormant (18 months without a successor edition).
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

  perform public.history_recompute();
end $$;
revoke all on function public.pipeline_demote() from public, anon, authenticated;

commit;
