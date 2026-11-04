-- 007: Copy style on seeded pipeline text (CLAUDE.md, no em dashes in user-facing text).
-- Seed 005 carried em dashes from the research workbook into events, destination
-- profiles and profile fields. This rewrites them in place:
--   * a field that is only a dash was a "no data" placeholder and becomes NULL
--   * "Typical size: —" at the end of a note becomes "Typical size: not stated"
--   * a dash joining two clauses becomes a comma
-- Safe to re-run (it only touches rows that still contain an em dash). Run it again
-- if 005 is ever re-applied, since 005 still holds the original text.

begin;

create or replace function pg_temp.nodash(t text) returns text language sql immutable as $$
  select case
    when t is null or position('—' in t) = 0 then t
    when btrim(t) ~ '^[—\s-]*$' then null
    else regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(t,
           '^\s*—\s*', ''),                 -- leading dash
           ':\s*—\s*$', ': not stated'),    -- "label: —" at the end
           '\(\s*—\s*', '(', 'g'),          -- "( — x" -> "(x"
           '\s*—\s*', ', ', 'g'),           -- clause joiner -> comma
           ',\s*,', ',', 'g'),              -- tidy doubled commas
           ',\s*([).;])', '\1', 'g')        -- tidy comma before closing punctuation
  end
$$;

update public.events set
  event_name             = pg_temp.nodash(event_name),
  notes                  = pg_temp.nodash(notes),
  rotation_pattern       = pg_temp.nodash(rotation_pattern),
  openness_note          = pg_temp.nodash(openness_note),
  last_hosts             = pg_temp.nodash(last_hosts),
  decision_body          = pg_temp.nodash(decision_body),
  lead_time              = pg_temp.nodash(lead_time),
  next_available_edition = pg_temp.nodash(next_available_edition),
  host_requirements      = pg_temp.nodash(host_requirements),
  source_url             = pg_temp.nodash(source_url)
where concat_ws(' ', event_name, notes, rotation_pattern, openness_note, last_hosts, decision_body,
                lead_time, next_available_edition, host_requirements, source_url) like '%—%';

update public.destination_profiles set
  bureau_exists   = pg_temp.nodash(bureau_exists),
  bids_formally   = pg_temp.nodash(bids_formally),
  subvention_fund = pg_temp.nodash(subvention_fund),
  fcdo_summary    = pg_temp.nodash(fcdo_summary),
  bureau_detail   = pg_temp.nodash(bureau_detail),
  venue_detail    = pg_temp.nodash(venue_detail),
  visa_detail     = pg_temp.nodash(visa_detail),
  updated_at      = now()
where concat_ws(' ', bureau_exists, bids_formally, subvention_fund, fcdo_summary, bureau_detail, venue_detail, visa_detail) like '%—%';

update public.destination_profile_fields set
  value = pg_temp.nodash(value),
  field = coalesce(pg_temp.nodash(field), field)
where concat_ws(' ', value, field) like '%—%';

commit;
