-- 019: Partner submissions, review queue and promotion.
-- Three admin-only RPCs behind the dashboard's Partner Data tab:
--   profile_review_queue()  every submission with its fields, each beside
--                           the live value it would replace
--   profile_review()        one decision per field; accept writes the live
--                           row at Tier 4 / Unverified with a 30-day re-check
--   profile_field_recheck() closes a re-check: Verified only with a Tier 1
--                           or 2 source, otherwise Conflict or another 30 days
-- A submitted value never overrides a fact a Tier 1 or 2 page has verified:
-- accepting against one marks the live row Conflict and keeps its value.

begin;

create or replace function public.profile_review_queue()
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not public.is_allowlisted() then jsonb_build_object('error', 'admin only') else jsonb_build_object(
    'submissions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'status', s.status, 'submitted_at', s.submitted_at, 'email_verified_at', s.email_verified_at,
        'country_id', s.country_id, 'country', c.name, 'iso2', c.iso2, 'profile_depth', coalesce(dp.profile_depth, 'base'),
        'submitter_type', s.submitter_type, 'freemail_flag', s.freemail_flag,
        'reviewer', s.reviewer, 'reviewed_at', s.reviewed_at, 'reviewer_note', s.reviewer_note,
        'submitter', jsonb_build_object('id', u.id, 'full_name', u.full_name, 'organisation', u.organisation, 'role', u.role,
                                        'work_email', u.work_email, 'domain_verified', u.domain_verified, 'status', u.status),
        'fields', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', f.id, 'key', f.field_key, 'label', k.label, 'group', k.field_group, 'target_kind', k.target_kind,
            'value_kind', k.value_kind, 'enum_values', k.enum_values,
            'proposed_value', f.proposed_value, 'as_of_date', f.as_of_date, 'source_url', f.source_url, 'supporting_file', f.supporting_file,
            'decision', f.decision, 'decided_value', f.decided_value, 'decided_at', f.decided_at, 'decided_by', f.decided_by,
            'reviewer_note', f.reviewer_note, 'live_field_id', f.live_field_id,
            'live', case k.target_kind
              when 'profile_field' then (
                select jsonb_build_object('value', d.value, 'source_url', d.source_url, 'source_tier', d.source_tier,
                                          'confidence', d.confidence, 'verified_on', d.verified_on, 'as_of_date', d.as_of_date)
                  from public.destination_profile_fields d
                 where d.country_id = s.country_id
                   and d.field_no = case when coalesce(dp.profile_depth, 'base') = 'full' then k.full_field_no else k.base_field_no end)
              when 'country_column' then jsonb_build_object('value', to_jsonb(c) ->> k.target_column, 'source_url', c.visa_portal_url,
                                          'source_tier', null, 'confidence', null, 'verified_on', c.visa_verified_on)
              else null end
          ) order by k.sort_order)
          from public.profile_submission_fields f
          join public.profile_field_catalog k on k.key = f.field_key
          where f.submission_id = s.id), '[]'::jsonb)
      ) order by s.submitted_at desc)
      from (select * from public.profile_submissions order by submitted_at desc limit 500) s
      join public.profile_submitters u on u.id = s.submitter_id
      join public.countries c on c.id = s.country_id
      left join public.destination_profiles dp on dp.country_id = s.country_id), '[]'::jsonb),
    'rechecks', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', d.id, 'country_id', d.country_id, 'country', c.name, 'field_no', d.field_no, 'field', d.field, 'value', d.value,
        'source_url', d.source_url, 'source_tier', d.source_tier, 'confidence', d.confidence, 'verified_on', d.verified_on,
        'as_of_date', d.as_of_date, 'recheck_due_on', d.recheck_due_on, 'conflict_note', d.conflict_note)
        order by d.recheck_due_on, c.name)
      from public.destination_profile_fields d
      join public.countries c on c.id = d.country_id
      where d.recheck_due_on is not null), '[]'::jsonb)
  ) end
$$;
revoke all on function public.profile_review_queue() from public, anon;
grant execute on function public.profile_review_queue() to authenticated;

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
      insert into public.events (event_name, organiser, bid_status, source_tier, confidence, series_key, added_by, notes)
      values (left(v, 120), (select organisation from public.profile_submitters where id = s.submitter_id), 'watching', 4, 'unverified',
              'partner-' || f.id, 'partner-' || s.id, 'Candidate from partner submission ' || s.id || ': ' || v);
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

create or replace function public.profile_field_recheck(p_live_id bigint, p_outcome text, p_source_url text default null, p_source_tier int default null, p_note text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_allowlisted() then raise exception 'admin only' using errcode = 'insufficient_privilege'; end if;
  if p_outcome = 'verified' then
    if coalesce(p_source_url, '') !~* '^https?://' or p_source_tier is null or p_source_tier > 2 then
      raise exception 'Verified needs a Tier 1 or Tier 2 source URL' using errcode = 'check_violation';
    end if;
    update public.destination_profile_fields
       set confidence = 'verified', source_url = p_source_url, source_tier = p_source_tier, verified_on = current_date,
           recheck_due_on = null, conflict_note = null
     where id = p_live_id;
  elsif p_outcome = 'conflict' then
    update public.destination_profile_fields
       set confidence = 'conflict', conflict_note = nullif(btrim(coalesce(p_note, '')), ''), verified_on = current_date,
           recheck_due_on = current_date + 30
     where id = p_live_id;
  elsif p_outcome = 'unverified' then
    update public.destination_profile_fields
       set confidence = 'unverified', verified_on = current_date, recheck_due_on = current_date + 30,
           conflict_note = nullif(btrim(coalesce(p_note, '')), '')
     where id = p_live_id;
  else
    raise exception 'unknown outcome %', p_outcome using errcode = 'check_violation';
  end if;
  if not found then raise exception 'field not found' using errcode = 'no_data_found'; end if;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.profile_field_recheck(bigint, text, text, int, text) from public, anon;
grant execute on function public.profile_field_recheck(bigint, text, text, int, text) to authenticated;

commit;
