-- 025: Reopened bids scan.
-- The weekly bid scan (Claude routine "Weekly mice bid scan", Mondays 08:00
-- Africa/Johannesburg) now rechecks what the pipeline already treats as closed,
-- so a call that reopens, has its deadline extended or starts its next cycle is
-- caught instead of sitting in the closed list.
--
-- Three sources feed the recheck.
--  * opportunity: bid_opportunities with list_status 'closed'.
--  * event: tracked events whose bid window has passed or that were set aside
--    (bid_status lost or not_pursued, or a bid_deadline in the past).
--  * series: bid-history series (public.series, fed by bid_wins) whose next
--    host-selection window is open, due within 90 days, or unknown while the
--    last recorded edition is recent.
-- Anything that already has an open or watchlist opportunity under the same
-- series_key is left out, as it is already being tracked.
--
-- reopen_checks logs every recheck, so each week works through the items that
-- were checked longest ago (never-checked first) instead of repeating the same
-- ones. Admin only, like every other pipeline table.

create table if not exists public.reopen_checks (
  id              bigint generated always as identity primary key,
  kind            text not null check (kind in ('opportunity','event','series')),
  ref             text not null,          -- bid_opportunities.id, events.id or series.key
  series_key      text,
  checked_on      date not null default current_date,
  outcome         text not null check (outcome in (
                    'still_closed',      -- nothing new on the official page
                    'reopened',          -- same call reopened or deadline extended
                    'next_cycle_open',   -- a new call for the next edition is open
                    'window_announced',  -- next call announced, not yet open
                    'host_decided',      -- next host already chosen, nothing to bid for
                    'dormant',           -- series paused or discontinued
                    'unverifiable')),    -- source could not be reached or read
  new_deadline    date,
  source_url      text,
  opportunity_id  integer references public.bid_opportunities(id) on delete set null,
  note            text,
  checked_by      text not null default 'weekly-scan',
  created_at      timestamptz not null default now()
);

create index if not exists reopen_checks_ref_idx on public.reopen_checks (kind, ref, checked_on desc);

alter table public.reopen_checks enable row level security;

drop policy if exists reopen_checks_admin on public.reopen_checks;
create policy reopen_checks_admin on public.reopen_checks
  for all to authenticated
  using (public.is_allowlisted())
  with check (public.is_allowlisted());

revoke all on public.reopen_checks from anon;

-- The queue for one weekly run. Read only; the scan writes its findings to
-- reopen_checks and the pipeline tables itself.
create or replace function public.reopen_scan_queue(p_limit integer default 20)
returns table (
  kind          text,
  ref           text,
  series_key    text,
  title         text,
  closed_on     date,
  source_url    text,
  hint          text,
  priority      integer,
  last_checked  date,
  last_outcome  text
)
language sql
stable
security invoker
set search_path = public
as $$
  with tracked as (
    -- series already followed by a live opportunity
    select o.series_key from bid_opportunities o
     where o.list_status in ('open','watchlist') and o.series_key is not null
    union
    select e.series_key from events e
     where e.bid_status in ('bid_open','bid_in_prep','submitted','shortlisted')
       and (e.bid_deadline is null or e.bid_deadline >= current_date)
       and e.series_key is not null
  ),
  cand as (
    select 'opportunity'::text as kind,
           o.id::text          as ref,
           o.series_key,
           o.title,
           o.submission_deadline as closed_on,
           coalesce(o.primary_source_url, o.secondary_url) as source_url,
           'Closed call. Check the official page for a reopened call, an extended deadline or the next cycle''s call.'
             || case when o.verify_next is not null then ' Verify next: ' || o.verify_next else '' end as hint,
           case when o.submission_deadline >= current_date - 180 then 1 else 2 end as priority
      from bid_opportunities o
     where o.list_status = 'closed'

    union all
    select 'event',
           e.id::text,
           e.series_key,
           e.event_name,
           e.bid_deadline,
           e.source_url,
           case
             when e.bid_status in ('lost','not_pursued')
               then 'Set aside as ' || replace(e.bid_status::text,'_',' ') || '. Check whether a new host call or EOI window is open for the next edition.'
             else 'Bid window passed on ' || e.bid_deadline::text || '. Check for an extension, a re-issued call or the next edition''s call.'
           end
             || coalesce(' Next available edition: ' || e.next_available_edition || '.', ''),
           case when e.bid_deadline is not null then 2 else 3 end
      from events e
     where e.verification_status <> 'archived'
       and coalesce(e.fixed_venue, false) = false
       and (e.bid_status in ('lost','not_pursued')
            or (e.bid_deadline < current_date and e.bid_status in ('watching','bid_open','bid_in_prep')))

    union all
    select 'series',
           s.key,
           s.key,
           s.name,
           null::date,
           s.source_url,
           'Bid history series. Last recorded edition ' || coalesce(s.last_edition_year::text, 'unknown')
             || case
                  when s.next_window_start is not null
                    then '; next host window ' || s.next_window_start::text
                         || coalesce(' to ' || s.next_window_end::text, '')
                         || coalesce(' (' || s.next_window_basis || ')', '')
                  else '; next window not yet estimated'
                end
             || '. Check whether a call for the next host is open.',
           case when s.next_window_start <= current_date then 1 else 2 end
      from series s
     where coalesce(s.dormant, false) = false
       and coalesce(s.fixed_venue, false) = false
       and (
             (s.next_window_start is not null
              and s.next_window_start <= current_date + 90
              and coalesce(s.next_window_end, s.next_window_start + 365) >= current_date)
          or (s.next_window_start is null
              and s.last_edition_year between extract(year from current_date)::int - 1
                                          and extract(year from current_date)::int + 2)
           )
  ),
  last_check as (
    select distinct on (c.kind, c.ref) c.kind, c.ref, c.checked_on, c.outcome
      from reopen_checks c
     order by c.kind, c.ref, c.checked_on desc, c.id desc
  )
  select c.kind, c.ref, c.series_key, c.title, c.closed_on, c.source_url, c.hint,
         c.priority, l.checked_on, l.outcome
    from cand c
    left join last_check l on l.kind = c.kind and l.ref = c.ref
   where (c.series_key is null or c.series_key not in (select t.series_key from tracked t))
     -- skip anything checked in the last six days (one weekly run)
     and (l.checked_on is null or l.checked_on < current_date - 6)
     -- a host already decided or a dormant series waits 180 days before the next look
     and not coalesce(l.outcome in ('host_decided','dormant') and l.checked_on >= current_date - 180, false)
   order by (l.checked_on is not null), c.priority, l.checked_on nulls first, c.closed_on desc nulls last, c.kind, c.ref
   limit greatest(coalesce(p_limit, 20), 1);
$$;

revoke execute on function public.reopen_scan_queue(integer) from public, anon;
grant execute on function public.reopen_scan_queue(integer) to authenticated, service_role;
