-- 011: rotation estimate fix.
-- 008 projected the edition after the last known one, even when that edition's
-- host decision date had already passed, so some windows came out in the past.
-- The estimate now steps forward one cycle at a time from the last known
-- (held or already awarded) edition until it reaches the first edition whose
-- decision point (edition date minus lead time) is still ahead. The window is
-- the six months before that decision point.

create or replace function public.history_recompute()
returns void language plpgsql security definer set search_path = public as $$
declare r record; yrs int[]; gaps int[]; cyc int; lead int; lead_src text; last_d date; next_d date; tier1 boolean;
begin
  for r in select s.* from public.series s loop
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

    select exists(select 1 from public.events e where e.series_key = r.key and e.source_tier = 1
                    and e.bid_deadline is not null and e.bid_deadline >= current_date) into tier1;

    -- latest known edition, held or already awarded
    select max(coalesce(event_start, make_date(edition_year, 7, 1))) into last_d
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

    if not r.fixed_venue and not tier1 and coalesce(array_length(yrs,1),0) >= 3 and cyc is not null and cyc > 0 and lead is not null and last_d is not null then
      next_d := (last_d + make_interval(months => cyc))::date;
      while (next_d - make_interval(months => lead))::date < current_date loop
        next_d := (next_d + make_interval(months => cyc))::date;
      end loop;
      update public.series s set
        next_window_end   = (next_d - make_interval(months => lead))::date,
        next_window_start = (next_d - make_interval(months => lead + 6))::date,
        next_window_basis = format('Estimate from %s editions (%s): cycle %s months, %s of %s months. The first edition still open to bids is expected around %s, so the host is likely chosen by %s; the window shown is the six months before that.',
                                   array_length(yrs,1), array_to_string(yrs, ', '), cyc, lead_src, lead,
                                   to_char(next_d, 'Mon YYYY'), to_char(next_d - make_interval(months => lead), 'Mon YYYY'))
       where s.key = r.key;
    end if;
  end loop;
end $$;
revoke all on function public.history_recompute() from public, anon, authenticated;

select public.history_recompute();
