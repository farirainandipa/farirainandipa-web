-- 014: two fixes found while checking tier gating.
-- (1) Explorer's 30-day delay on new records ran from created_at, which is the
--     backfill date for history that is years old, so Explorer saw nothing.
--     The delay now runs from when the fact became public: the award date, or
--     the edition date, whichever is earlier, capped by when we recorded it.
-- (2) The teaser listed series whose only known host had no year, with an
--     empty host list. Those are left out.

create or replace function public.history_known_since(b public.bid_wins)
returns date language sql immutable set search_path = public as $$
  select least(b.created_at::date, coalesce(b.awarded_on, b.event_start, make_date(b.edition_year, 1, 1), b.created_at::date))
$$;

create or replace function public.history_data(p_cid int, p_tier text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare rk int := public.tier_rank(p_tier); res jsonb;
begin
  if rk < 1 then raise exception 'history requires a paid tier'; end if;
  with w as (
    select b.*, s.name series_name
      from public.bid_wins b join public.series s on s.key = b.series_key
     where b.award_status <> 'cancelled'
       and (rk >= 2 or (b.confidence = 'verified' and public.history_known_since(b) <= current_date - 30))
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
                       and b.award_status <> 'cancelled'
                       and coalesce(extract(year from b.event_start)::int, b.edition_year) is not null)
    ) q
$$;
grant execute on function public.bid_wins_teaser() to anon, authenticated;
