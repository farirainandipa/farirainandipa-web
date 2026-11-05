-- 008: Tag the 71 rotation-map forums (seed 005) with sectors from the 18-sector taxonomy.
-- Seed 005 only set events.sector, a four-value bucket (trade_industry_resources etc.) that
-- v_sector_matches does not read. Without event_sectors rows none of these forums matched any
-- country, so bureau views (bureau_portal / portal_data) never showed them.
--
-- Tags are an editorial first pass from each forum's name and remit, not researched.
-- event_sectors.is_estimate marks them so they can be reviewed and corrected; set it to false
-- once a tag has been checked. The first sector listed for each forum is its primary.
-- Safe to re-run: existing (event_id, econ_sector_id) rows are left alone.

begin;

alter table public.event_sectors add column if not exists is_estimate boolean not null default false;
comment on column public.event_sectors.is_estimate is
  'true = editorial first-pass tag (migration 008), not yet reviewed. Set false once checked.';

create temp table tag_map (series_key text, sectors text[]) on commit drop;
insert into tag_map values
  ('rm-aerc-biannual-plenary-research-policy-summit',              array['Science, research & higher learning','Finance, insurance & fintech','Governance, law & public administration']),
  ('rm-afdb-group-annual-meetings',                                array['Finance, insurance & fintech','Trade, investment & AfCFTA','Infrastructure, housing & urban development']),
  ('rm-afdb-integrate-africa-forum-inaugural',                     array['Trade, investment & AfCFTA','Infrastructure, housing & urban development','Finance, insurance & fintech']),
  ('rm-afpif-african-peering-interconnection-forum',               array['ICT, digital economy & innovation']),
  ('rm-afreximbank-africa-trade-forum-atf-afreximbank-trade-finance', array['Trade, investment & AfCFTA','Finance, insurance & fintech']),
  ('rm-africa-ceo-forum',                                          array['Trade, investment & AfCFTA','Finance, insurance & fintech']),
  ('rm-africa-climate-summit-acs',                                 array['Environment, climate & conservation','Energy & power']),
  ('rm-africa-climate-week-unfccc-regional',                       array['Environment, climate & conservation']),
  ('rm-africa-energy-indaba',                                      array['Energy & power']),
  ('rm-africa-fintech-summit-afts',                                array['Finance, insurance & fintech','ICT, digital economy & innovation']),
  ('rm-africa-health-agenda-international-conference-ahaic',       array['Health & life sciences']),
  ('rm-africa-internet-summit-ais',                                array['ICT, digital economy & innovation']),
  ('rm-africa-investment-forum-aif-market-days',                   array['Trade, investment & AfCFTA','Infrastructure, housing & urban development','Finance, insurance & fintech']),
  ('rm-africa-oil-week-africa-energies-summit',                    array['Energy & power','Mining & mineral beneficiation']),
  ('rm-africa-public-service-day-continental-celebration',         array['Governance, law & public administration']),
  ('rm-africa-regional-forum-on-sustainable-development-arfsd',    array['Social development, gender & population','Environment, climate & conservation','Governance, law & public administration']),
  ('rm-africa-s-travel-indaba',                                    array['Tourism, hospitality & MICE']),
  ('rm-africa-tech-summit-nairobi',                                array['ICT, digital economy & innovation','Finance, insurance & fintech']),
  ('rm-africa-tourism-leadership-forum-awards-atlf',               array['Tourism, hospitality & MICE']),
  ('rm-africa-water-week-aww-africa-water-sanitation-week',        array['Water & sanitation']),
  ('rm-africacom-africa-tech-festival',                            array['ICT, digital economy & innovation']),
  ('rm-african-development-forum-adf',                             array['Governance, law & public administration','Trade, investment & AfCFTA','Social development, gender & population']),
  ('rm-african-economic-conference-aec',                           array['Trade, investment & AfCFTA','Finance, insurance & fintech','Science, research & higher learning']),
  ('rm-african-energy-week-aew',                                   array['Energy & power']),
  ('rm-african-internet-governance-forum-afigf',                   array['ICT, digital economy & innovation','Governance, law & public administration']),
  ('rm-african-statistics-day-nov-au-ascc-codgs-statistics-meetings', array['Governance, law & public administration','Science, research & higher learning']),
  ('rm-africaribbean-trade-investment-forum-actif',                array['Trade, investment & AfCFTA','Finance, insurance & fintech']),
  ('rm-africasan-africa-sanitation-hygiene-conference',            array['Water & sanitation','Health & life sciences']),
  ('rm-amcen-african-ministerial-conference-on-the-environment-ordi', array['Environment, climate & conservation']),
  ('rm-amcow-general-assembly-governing-council',                  array['Water & sanitation']),
  ('rm-aprm-forum-of-heads-of-state-and-government',               array['Governance, law & public administration']),
  ('rm-au-agriculture-caadp-partnership-platform-africa-fertilizer-', array['Agriculture, food & agro-processing']),
  ('rm-au-assembly-ordinary-summit-feb',                           array['Governance, law & public administration','Trade, investment & AfCFTA']),
  ('rm-au-ecosocc-general-assembly-permanent-general-assembly-sessi', array['Social development, gender & population','Governance, law & public administration']),
  ('rm-au-eu-ministerial-meeting',                                 array['Governance, law & public administration','Trade, investment & AfCFTA']),
  ('rm-au-eu-summit',                                              array['Governance, law & public administration','Trade, investment & AfCFTA']),
  ('rm-au-mid-year-coordination-meeting-mycm-executive-council-mid-', array['Governance, law & public administration']),
  -- the STCs cover 14 sector committees, so this one carries more than three tags
  ('rm-au-specialised-technical-committee-stc-ordinary-sessions-stc', array['Governance, law & public administration','Agriculture, food & agro-processing','Health & life sciences','Education & skills','ICT, digital economy & innovation']),
  ('rm-chogm-commonwealth-heads-of-government-meeting-commonwealth-', array['Governance, law & public administration','Trade, investment & AfCFTA']),
  ('rm-comesa-business-forum-held-with-summit',                    array['Trade, investment & AfCFTA']),
  ('rm-comesa-source-international-trade-fair-high-level-business-s', array['Trade, investment & AfCFTA','Manufacturing & industrialisation']),
  ('rm-comesa-summit-of-heads-of-state-and-government-council-minis', array['Trade, investment & AfCFTA','Governance, law & public administration']),
  ('rm-commonwealth-trade-ministers-meeting-sectoral-ministerial-me', array['Trade, investment & AfCFTA']),
  ('rm-cop-unfccc-africa-s-turn',                                  array['Environment, climate & conservation','Energy & power']),
  ('rm-eac-council-of-ministers-sectoral-councils',                array['Governance, law & public administration','Trade, investment & AfCFTA']),
  ('rm-eac-ordinary-summit-of-heads-of-state',                     array['Governance, law & public administration','Trade, investment & AfCFTA']),
  ('rm-eac-secondary-cities-conference',                           array['Infrastructure, housing & urban development']),
  ('rm-east-african-petroleum-conference-exhibition-eapce',        array['Energy & power','Mining & mineral beneficiation']),
  ('rm-eca-conference-of-african-ministers-of-finance-planning-econ', array['Finance, insurance & fintech','Governance, law & public administration']),
  ('rm-global-africa-business-initiative-unstoppable-africa',      array['Trade, investment & AfCFTA','Finance, insurance & fintech']),
  ('rm-high-level-au-private-sector-forum',                        array['Trade, investment & AfCFTA','Manufacturing & industrialisation']),
  ('rm-iata-wings-of-change-focus-africa-wocfa-iata-aviation-day-af', array['Transport, aviation & logistics']),
  ('rm-id-africa-annual-general-meeting',                          array['ICT, digital economy & innovation','Governance, law & public administration']),
  ('rm-ilo-african-regional-meeting-arm',                          array['Social development, gender & population','Education & skills','Governance, law & public administration']),
  ('rm-investing-in-african-mining-indaba',                        array['Mining & mineral beneficiation']),
  ('rm-pan-african-parliament-ordinary-sessions',                  array['Governance, law & public administration']),
  ('rm-sadc-council-of-ministers-feb-mar-aug',                     array['Governance, law & public administration','Trade, investment & AfCFTA']),
  ('rm-sadc-industrialisation-week-siw-exhibition',                array['Manufacturing & industrialisation','Trade, investment & AfCFTA']),
  ('rm-sadc-parliamentary-forum-plenary-assembly',                 array['Governance, law & public administration']),
  ('rm-sadc-sectoral-ministerial-meetings-trade-energy-health-touri', array['Governance, law & public administration','Trade, investment & AfCFTA','Energy & power']),
  ('rm-sadc-summit-of-heads-of-state-and-government',              array['Governance, law & public administration','Trade, investment & AfCFTA']),
  ('rm-sadc-tfca-network-annual-meeting-and-periodic-sadc-tfca-inte', array['Environment, climate & conservation','Tourism, hospitality & MICE']),
  ('rm-sommet-de-la-francophonie',                                 array['Governance, law & public administration','Creative industries, culture & sport']),
  ('rm-statistical-commission-for-africa-statcom-africa-forum-on-af', array['Governance, law & public administration','Science, research & higher learning']),
  ('rm-un-environment-assembly-unea',                              array['Environment, climate & conservation']),
  ('rm-un-habitat-assembly-executive-board',                       array['Infrastructure, housing & urban development']),
  ('rm-un-tourism-regional-commission-for-africa-caf-meeting',     array['Tourism, hospitality & MICE']),
  ('rm-un-tourism-regional-conference-on-brand-africa-thematic-regi', array['Tourism, hospitality & MICE']),
  ('rm-unep-regional-consultative-meeting-for-africa',             array['Environment, climate & conservation']),
  ('rm-who-regional-committee-for-africa-rc',                      array['Health & life sciences']),
  ('rm-world-urban-forum-wuf',                                     array['Infrastructure, housing & urban development']);

-- Fail loudly if a series key or sector name doesn't resolve, rather than tagging silently short.
do $$
declare bad text;
begin
  select string_agg(t.series_key, ', ') into bad
    from tag_map t where not exists (select 1 from public.events e where e.series_key = t.series_key);
  if bad is not null then raise exception '008: unknown series_key: %', bad; end if;

  select string_agg(distinct s.name, ', ') into bad
    from tag_map t cross join unnest(t.sectors) as s(name)
   where not exists (select 1 from public.econ_sectors x where x.name = s.name);
  if bad is not null then raise exception '008: unknown sector: %', bad; end if;
end $$;

insert into public.event_sectors (event_id, econ_sector_id, is_primary, is_estimate)
select e.id, x.id, s.ord = 1, true
  from tag_map t
  join public.events e on e.series_key = t.series_key
  cross join lateral unnest(t.sectors) with ordinality as s(name, ord)
  join public.econ_sectors x on x.name = s.name
 where not exists (select 1 from public.event_sectors es where es.event_id = e.id and es.econ_sector_id = x.id);

commit;
