-- 020: profile_review() must create the parent series row before the
-- candidate event, since events.series_key references series (migration 008).
-- Same body as 019 otherwise.

begin;

create or replace function public.profile_review(p_field_id bigint, p_decision text, p_value text default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  f       public.profile_submission_fields%rowtype;
  s       public.profile_submissions%rowtype;
  k       public.profile_field_catalog%rowtype;
  depth   text;
  fno     smallint;
  v       text;
  live_id bigint;
  live    public.destination_profile_fields%rowtype;
  actor   text := public.audit_actor();
  outcome text := p_decision;
  org     text;
  n_pending int; n_confirm int; n_accepted int;
begin
  if not public.is_allowlisted() then raise exception 'admin only' using errcode = 'insufficient_privilege'; end if;
  if p_decision not in ('accepted','edited','rejected','confirm_requested') then
    raise exception 'unknown decision %', p_decision using errcode = 'check_violation';
  end if;
  select * into f from public.profile_submission_fields where id = p_field_id;
  if f.id is null then raise exception 'field not found' using errcode = 'no_data_found'; end if;
  select * into s from public.profile_submissions where id = f.submission_id;
  select * into k from public.profile_field_catalog where key = f.field_key;
  if s.status = 'awaiting_email' then
    raise exception 'The submitter has not confirmed their email yet' using errcode = 'check_violation';
  end if;

  v := btrim(coalesce(case when p_decision = 'edited' then p_value end, f.proposed_value));
  if p_decision = 'edited' and coalesce(v, '') = '' then
    raise exception 'An edited decision needs a value' using errcode = 'check_violation';
  end if;

  if p_decision in ('accepted','edited') then
    if k.target_kind = 'profile_field' then
      select coalesce(dp.profile_depth, 'base') into depth from public.countries c
        left join public.destination_profiles dp on dp.country_id = c.id where c.id = s.country_id;
      fno := case when depth = 'full' then k.full_field_no else k.base_field_no end;
      select * into live from public.destination_profile_fields where country_id = s.country_id and field_no = fno;
      if live.id is not null and live.source_tier in (1, 2) and live.confidence = 'verified' then
        -- A Tier 4 value cannot override a verified Tier 1 or 2 fact.
        update public.destination_profile_fields
           set confidence = 'conflict',
               conflict_note = left('Partner submission ' || s.id || ' (' || current_date || ') proposes: ' || v, 1000),
               recheck_due_on = current_date + 30
         where id = live.id;
        live_id := live.id; outcome := 'conflict';
      else
        insert into public.destination_profile_fields
          (country_id, field_no, field_group, field, value, source_url, confidence, verified_on, source_tier, as_of_date, recheck_due_on, conflict_note)
        values (s.country_id, fno, k.field_group, k.label, v, f.source_url, 'unverified', current_date, 4, f.as_of_date, current_date + 30, null)
        on conflict (country_id, field_no) do update
          set value = excluded.value, source_url = excluded.source_url, confidence = 'unverified', verified_on = current_date,
              source_tier = 4, as_of_date = excluded.as_of_date, recheck_due_on = current_date + 30, conflict_note = null
        returning id into live_id;
      end if;
    elsif k.target_kind = 'country_column' then
      if k.value_kind = 'boolean' then
        execute format('update public.countries set %I = %L::boolean, visa_verified_on = current_date where id = %s', k.target_column, (v = 'yes'), s.country_id);
      elsif k.target_column = 'visa_africa' then
        execute format('update public.countries set %I = %L::visa_africa_access, visa_verified_on = current_date where id = %s', k.target_column, v, s.country_id);
      else
        execute format('update public.countries set %I = %L, visa_verified_on = current_date where id = %s', k.target_column, v, s.country_id);
      end if;
    elsif f.field_key = 'bidding_now' then
      -- A bid-relevant item becomes a candidate in the discovery queue, never a live edition.
      select organisation into org from public.profile_submitters where id = s.submitter_id;
      insert into public.series (key, name, source_url, source_tier, confidence)
      values ('partner-' || f.id, left(v, 120), f.source_url, 4, 'unverified')
      on conflict (key) do nothing;
      insert into public.events (event_name, organiser, bid_status, source_tier, confidence, source_url, series_key, added_by, notes)
      values (left(v, 120), org, 'watching', 4, 'unverified', f.source_url, 'partner-' || f.id, 'partner-' || s.id,
              'Candidate from partner submission ' || s.id || ' (' || coalesce(org, '') || '): ' || v);
    end if;
  end if;

  update public.profile_submission_fields
     set decision = p_decision, decided_value = case when p_decision in ('accepted','edited') then v end,
         decided_at = now(), decided_by = actor, reviewer_note = nullif(btrim(coalesce(p_note, '')), ''),
         live_field_id = coalesce(live_id, live_field_id)
   where id = f.id;

  select count(*) filter (where decision = 'pending'), count(*) filter (where decision = 'confirm_requested'),
         count(*) filter (where decision in ('accepted','edited'))
    into n_pending, n_confirm, n_accepted
    from public.profile_submission_fields where submission_id = s.id;
  update public.profile_submissions
     set status = case when n_pending > 0 or n_confirm > 0 then 'in_review'
                       when n_accepted > 0 then 'published' else 'rejected' end,
         reviewer = actor, reviewed_at = now()
   where id = s.id and status <> 'confirmed';

  return jsonb_build_object('ok', true, 'outcome', outcome, 'live_field_id', live_id);
end $$;
revoke all on function public.profile_review(bigint, text, text, text) from public, anon;
grant execute on function public.profile_review(bigint, text, text, text) to authenticated;

commit;
