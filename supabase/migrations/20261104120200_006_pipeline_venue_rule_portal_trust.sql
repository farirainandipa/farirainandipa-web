-- 006: Venue rule, bureau portal trust fields, hardening after 004.
--
-- 1. Venue rule. "Largest plenary" = largest purpose-built theatre-style hall,
--    not an arena or flat floor. destination_profiles (seeded by 005) already
--    follows it; the page now reads its headline venue from there. This brings
--    the pre-v2 venues/countries rows into line so the two sources agree.
-- 2. bureau_portal() / bureau_portal_preview() return confidence, verified_on
--    and source tier on every bid and event (the badge a bureau pays for),
--    the event's host-selection fields, and the country's own destination
--    profile so the portal can show the host-fit breakdown.
-- 3. pipeline_demote() is for pg_cron only: revoke it from anon/authenticated
--    (004 revoked it from PUBLIC, but Supabase grants API roles directly).
-- 4. Public submissions can only arrive as fresh, unreviewed rows.
-- 5. The 18-sector taxonomy is readable anonymously so the public submission
--    form builds its list from econ_sectors instead of a hard-coded copy.
--
-- Safe to re-run.

begin;

-- ---------------------------------------------------------------------------
-- 1. Venue rule
-- ---------------------------------------------------------------------------
-- Durban ICC: AIPC lists 6,000 theatre seats; the 5,000 figure mixed ICC and Arena.
update public.venues
   set plenary_capacity = 6000,
       notes = 'Inkosi Albert Luthuli ICC. 6,000 theatre seats (AIPC); the Arena is a separate 10,000 flat-floor space. Largest plenary under the theatre rule, Nov 2026.'
 where id = 14 and name like 'Durban ICC%';

-- BK Arena is an arena, so it does not count as Rwanda's largest plenary.
update public.venues
   set notes = 'Indoor arena, 10,000. Not counted as a plenary under the theatre rule; Kigali Convention Centre (2,600-seat auditorium) is the headline venue.'
 where id = 25 and name = 'BK Arena';

update public.countries
   set mice_summary = 'Africa''s fastest-risen MICE brand: Kigali Convention Centre (2,600-seat auditorium, the largest purpose-built plenary), with Intare Conference Arena and BK Arena (10,000, arena) for overflow and ceremonies; single-window state support via RCB; CHOGM 2022, Women Deliver 2023, annual MWC Kigali.'
 where iso2 = 'RW' and type = 'country' and mice_summary like '%BK Arena (10,000)%';

-- Durban figure on the profile row, in case 005 is re-run from an older copy.
update public.destination_profiles dp
   set largest_plenary = 6000
  from public.countries c
 where c.id = dp.country_id and c.iso2 = 'ZA' and dp.largest_plenary is distinct from 6000;

-- ---------------------------------------------------------------------------
-- 2. Bureau portal: trust fields, host-selection fields, own profile
-- ---------------------------------------------------------------------------
create or replace function public.portal_data(cid integer)
 returns jsonb
 language plpgsql
 stable security definer
 set search_path to 'public'
as $function$
declare res jsonb;
begin
  with m as (
    select vm.* from public.v_sector_matches vm
    where vm.country_id = cid
      and not exists (select 1 from public.bid_alignments d where d.country_id=cid and d.status='dismissed'
                      and ((vm.kind='opportunity' and d.opportunity_id=vm.item_id) or (vm.kind='event' and d.event_id=vm.item_id))
                      and (d.econ_sector_id is null or d.econ_sector_id = vm.econ_sector_id))
  ), a as (
    select ba.*, case when ba.opportunity_id is not null then 'opportunity' else 'event' end kind,
           coalesce(ba.opportunity_id, ba.event_id) item_id
    from public.bid_alignments ba where ba.country_id=cid and ba.status='confirmed' and ba.share_with_bureau
  ), items as (
    select kind, item_id from m union select kind, item_id from a
  ), scored as (
    select i.kind, i.item_id,
      coalesce((select jsonb_agg(distinct s.name) from m join public.econ_sectors s on s.id=m.econ_sector_id where m.kind=i.kind and m.item_id=i.item_id),'[]'::jsonb) as sectors,
      coalesce((select jsonb_agg(jsonb_build_object('sector',s.name,'policy',p.title,'policy_short',p.short_name,'rationale',a.rationale,'strength',a.strength))
                from a left join public.econ_sectors s on s.id=a.econ_sector_id left join public.policy_frameworks p on p.id=a.policy_id
                where a.kind=i.kind and a.item_id=i.item_id),'[]'::jsonb) as alignments,
      coalesce((select jsonb_agg(distinct coalesce(p.short_name,p.title)) from m join public.policy_frameworks p on p.id=m.policy_id where m.kind=i.kind and m.item_id=i.item_id),'[]'::jsonb) as policies,
      coalesce((select sum(6 - m.priority_rank + case when m.is_primary then 1 else 0 end) from m where m.kind=i.kind and m.item_id=i.item_id),0)
       + coalesce((select sum(a.strength*2) from a where a.kind=i.kind and a.item_id=i.item_id),0) as fit
    from items i
  )
  select jsonb_build_object(
    'country', (select jsonb_build_object('id',c.id,'name',c.name,'iso2',c.iso2,'region',c.region,'afcfta_status',c.afcfta_status,
        'mice_summary',c.mice_summary,'bureau_name',c.bureau_name,'transport_summary',c.transport_summary,
        'visa_regime',c.visa_regime,'visa_notes',c.visa_notes,'visa_africa',c.visa_africa,'evisa',c.evisa,'visa_on_arrival',c.visa_on_arrival,
        'univisa',c.univisa,'visa_portal_url',c.visa_portal_url,'visa_verified_on',c.visa_verified_on,'visa_events_note',c.visa_events_note)
      from public.countries c where c.id=cid),
    'profile', (select to_jsonb(dp) - 'updated_at' from public.destination_profiles dp where dp.country_id=cid),
    'policies', coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'title',p.title,'short_name',p.short_name,'level',p.level,'sector',s.name,
        'period_start',p.period_start,'period_end',p.period_end,'issuing_body',p.issuing_body,'status',p.status,'summary',p.summary,
        'source_url',p.source_url,'document_path',p.document_path,'parent_id',p.parent_id) order by p.level, p.period_end desc nulls last)
      from public.policy_frameworks p left join public.econ_sectors s on s.id=p.econ_sector_id where p.country_id=cid),'[]'::jsonb),
    'sectors', coalesce((select jsonb_agg(jsonb_build_object('sector',s.name,'code',s.code,'rank',cs.priority_rank,'policy',p.title,'policy_short',p.short_name,
        'reference',cs.policy_reference,'target',cs.target,'mice_angle',cs.mice_angle,
        'n_items',(select count(distinct (m.kind, m.item_id)) from m where m.econ_sector_id=cs.econ_sector_id)) order by cs.priority_rank, s.sort)
      from public.country_sectors cs join public.econ_sectors s on s.id=cs.econ_sector_id left join public.policy_frameworks p on p.id=cs.policy_id where cs.country_id=cid),'[]'::jsonb),
    'bids', coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'title',o.title,'issuing_body',o.issuing_body,'event_type',o.event_type,'bid_type',o.bid_type,
        'eligibility',o.eligibility,'submission_deadline',o.submission_deadline,'required_documents',o.required_documents,'source_url',o.primary_source_url,
        'summary',o.summary,'host_year',o.host_year,'status',o.list_status,'sectors',sc.sectors,'policies',sc.policies,'alignments',sc.alignments,'fit',sc.fit,
        'confidence',o.confidence,'verified_on',o.verified_on,'source_tier',o.source_tier,'edition_label',o.edition_label,'host_selection',o.host_selection)
        order by sc.fit desc, o.submission_deadline nulls last)
      from scored sc join public.bid_opportunities o on o.id=sc.item_id
      where sc.kind='opportunity' and o.list_status in ('open','watchlist') and (o.submission_deadline is null or o.submission_deadline >= current_date)),'[]'::jsonb),
    'events', coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'name',e.event_name,'organiser',e.organiser,'scope',e.scope,'edition_year',e.edition_year,
        'attendance',e.typical_attendance,'rotation',e.rotation_pattern,'host_requirements',e.host_requirements,'bid_deadline',e.bid_deadline,
        'next_edition',e.next_available_edition,'status',e.bid_status,'source_url',e.source_url,'sectors',sc.sectors,'policies',sc.policies,'alignments',sc.alignments,'fit',sc.fit,
        'host_fit',(select cm.total_score from public.country_matches cm where cm.event_id=e.id and cm.country_id=cid limit 1),
        'confidence',e.confidence,'verified_on',e.verified_on,'source_tier',e.source_tier,'edition_label',e.edition_label,
        'host_selection',e.host_selection,'decision_body',e.decision_body,'lead_time',e.lead_time,
        'openness_2027_29',e.openness_2027_29,'openness_note',e.openness_note,'fixed_venue',e.fixed_venue)
        order by sc.fit desc)
      from scored sc join public.events e on e.id=sc.item_id
      where sc.kind='event' and e.bid_status not in ('lost','not_pursued','awarded')),'[]'::jsonb)
  ) into res;
  return res;
end $function$;

-- portal_data stays internal: only bureau_portal() and bureau_portal_preview() call it.
revoke all on function public.portal_data(integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. pipeline_demote is for the nightly cron job only
-- ---------------------------------------------------------------------------
revoke all on function public.pipeline_demote() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Public submissions arrive unreviewed and unlinked
-- ---------------------------------------------------------------------------
drop policy if exists sub_public_insert on public.submissions;
create policy sub_public_insert on public.submissions for insert to anon, authenticated
  with check (status = 'review' and reviewed_at is null and review_note is null and event_id is null);

-- ---------------------------------------------------------------------------
-- 5. Sector taxonomy is public reference data (names only, read-only)
-- ---------------------------------------------------------------------------
drop policy if exists econ_sectors_public_read on public.econ_sectors;
create policy econ_sectors_public_read on public.econ_sectors for select to anon using (true);

commit;
