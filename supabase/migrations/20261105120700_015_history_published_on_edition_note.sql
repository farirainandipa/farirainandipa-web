-- 015: two data-quality fixes in the history layer.
-- (1) Pass 1 stored the ICCA post date in awarded_on. That is when ICCA
--     published the post, not when the host was decided, and it skewed the
--     award-to-event lead times. It now lives in source_published_on;
--     awarded_on is only set when a source states the decision date.
-- (2) Rotation-map context notes ("Announced Jul 2026", "At AfDB HQ", ...) were
--     stored as win factors. They move to edition_note; win_factors is kept
--     for how a bid was actually won.

alter table public.bid_wins add column if not exists source_published_on date;
alter table public.bid_wins add column if not exists edition_note text;

update public.bid_wins set source_published_on = awarded_on, awarded_on = null
 where added_by = 'icca-pass1' and awarded_on is not null;

update public.bid_wins set edition_note = win_factors, win_factors = null, win_factors_status = 'draft'
 where added_by = 'rotation-map-history' and win_factors is not null;

-- Pass 1 ingest: post date goes to source_published_on.
create or replace function public.history_ingest_icca(posts jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p jsonb; t text; n text; k text; yr int; q text; rc int; added int := 0; skipped int := 0; new_series int := 0;
begin
  for p in select * from jsonb_array_elements(posts) loop
    if exists (select 1 from public.bid_wins where icca_post_id = (p->>'id')::bigint or source_url = p->>'link') then
      skipped := skipped + 1; continue;
    end if;
    t := btrim(p->>'title');
    n := public.series_norm(public.series_clean_name(t));
    yr := (regexp_match(t, '(?<![0-9])(20[2-4][0-9])(?![0-9])'))[1]::int;
    select s.key into k from public.series s
     where public.series_norm(public.series_clean_name(s.name)) = n
        or exists (select 1 from unnest(s.aliases) a where public.series_norm(public.series_clean_name(a)) = n)
     limit 1;
    if k is null then
      k := 'icca-' || left(regexp_replace(n, '\s+', '-', 'g'), 60);
      if exists (select 1 from public.series where key = k) then k := k || '-' || (p->>'id'); end if;
      insert into public.series (key, name, aliases, source_url, source_tier, confidence)
      values (k, public.series_clean_name(t), array[t], p->>'link', 2, 'unverified');
      new_series := new_series + 1;
    end if;
    q := nullif(array_to_string((regexp_split_to_array(btrim(coalesce(p->>'text','')), '\s+'))[1:14], ' '), '');
    insert into public.bid_wins (series_key, edition_year, edition_label, award_status, source_published_on, source_quote,
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

-- Explorer's delay also counts from the publication date.
create or replace function public.history_known_since(b public.bid_wins)
returns date language sql immutable set search_path = public as $$
  select least(b.created_at::date, coalesce(b.awarded_on, b.source_published_on, b.event_start, make_date(b.edition_year, 1, 1), b.created_at::date))
$$;

-- history_data: add the edition note and the source's publication date.
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
      'status', w.award_status, 'awarded_on', w.awarded_on, 'published_on', w.source_published_on, 'event_start', w.event_start, 'event_end', w.event_end,
      'city', w.host_city, 'country', w.host_country_name, 'iso2', w.host_iso2, 'region', w.host_region, 'africa', w.africa_hosted,
      'winning_bidder', w.winning_bidder, 'competing', case when cardinality(w.competing_destinations) > 0 then to_jsonb(w.competing_destinations) end,
      'decision_body', w.decision_body, 'lead_months', w.decision_lead_time_months, 'sector', w.sector, 'note', w.edition_note,
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

select public.history_recompute();
