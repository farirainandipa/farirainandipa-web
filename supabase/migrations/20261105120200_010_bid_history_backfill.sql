-- 010: Bid history backfill, Africa first.
-- (a) Past and awarded editions of the rotation-map forums, parsed from
--     events.last_hosts (already researched against Tier 1 sources in the
--     rotation-map import). Each edition inherits its forum's source and
--     confidence; editions the research itself marked unverified stay Unverified.
-- (b) Facts stated in the ICCA Bid Wins posts ingested by Pass 1 (Tier 2,
--     Unverified until Pass 2 confirms them at Tier 1), plus the one Tier 1
--     confirmation already done (UNESCO Africa Engineering Week, Kampala 2025).
-- (c) Tidier series names for ICCA-created series, a name cleaner for future
--     ingests, and the ICCA test post parked as cancelled so it never shows.
-- Win-factors notes are short drafts written from the post text, status
-- 'draft', for a team member to review. No ICCA article text is stored beyond
-- the 14-word quote Pass 1 keeps.
-- Reversal: delete from public.bid_wins where added_by in ('rotation-map-history','history-backfill-010');
--           (ICCA rows: delete from public.bid_wins where added_by = 'icca-pass1'; then delete the icca-* series.)

-- ---------------------------------------------------------------------------
-- (a) Rotation-map history
-- ---------------------------------------------------------------------------
create temp table rmh (k text, yr int, lbl text, city text, country text, iso2 text, wregion text,
                       d1 date, d2 date, unv boolean default false, competing text[] default '{}', note text);

insert into rmh (k, yr, lbl, city, country, iso2, wregion, d1, d2, unv, competing, note) values
('rm-intra-african-trade-fair-iatf',2021,'IATF2021','Durban','South Africa','ZA',null,null,null,false,'{}',null),
('rm-intra-african-trade-fair-iatf',2023,'2023','Cairo','Egypt','EG',null,null,null,false,'{}',null),
('rm-intra-african-trade-fair-iatf',2025,'2025','Algiers','Algeria','DZ',null,'2025-09-04','2025-09-10',false,'{}',null),
('rm-un-tourism-general-assembly-when-in-africa',2023,'2023','Samarkand','Uzbekistan','UZ','Asia',null,null,false,'{}',null),
('rm-un-tourism-general-assembly-when-in-africa',2025,'2025','Riyadh','Saudi Arabia','SA','Middle East',null,null,false,'{}',null),
('rm-un-tourism-general-assembly-when-in-africa',2027,'2027',null,'Dominican Republic','DO','Americas',null,null,false,'{}','Voted by member states at the preceding General Assembly'),
('rm-icasa-international-conference-on-aids-and-stis-in-africa',2023,'22nd (2023)','Harare','Zimbabwe','ZW',null,'2023-12-04','2023-12-09',false,'{}',null),
('rm-icasa-international-conference-on-aids-and-stis-in-africa',2025,'23rd (2025)','Accra','Ghana','GH',null,'2025-12-03','2025-12-08',false,'{}',null),
('rm-icasa-international-conference-on-aids-and-stis-in-africa',2027,'24th (2027)','Cotonou','Benin','BJ',null,'2027-12-05','2027-12-09',false,'{}',null),
('rm-africities-summit',2022,'9th (2022)','Kisumu','Kenya','KE',null,null,null,false,'{}',null),
('rm-transform-africa-summit-tas',2023,'6th (2023)','Victoria Falls','Zimbabwe','ZW',null,'2023-04-26','2023-04-28',false,'{}','First edition outside Rwanda'),
('rm-transform-africa-summit-tas',2025,'7th (2025)','Conakry','Guinea','GN',null,'2025-11-12','2025-11-14',false,'{}','Planned for Nairobi in Aug 2024, finally held in Conakry'),
('rm-africa-food-systems-forum-agrf-afs-forum-annual-summit',2023,'2023','Dar es Salaam','Tanzania','TZ',null,null,null,false,'{}',null),
('rm-africa-food-systems-forum-agrf-afs-forum-annual-summit',2024,'2024','Kigali','Rwanda','RW',null,null,null,false,'{}',null),
('rm-africa-food-systems-forum-agrf-afs-forum-annual-summit',2025,'2025','Dakar','Senegal','SN',null,null,null,false,'{}',null),
('rm-africa-food-systems-forum-agrf-afs-forum-annual-summit',2026,'2026','Kigali','Rwanda','RW',null,'2026-08-31','2026-09-04',false,'{}',null),
('rm-africa-energy-forum-aef',2023,'2023','Nairobi','Kenya','KE',null,null,null,false,'{}',null),
('rm-africa-energy-forum-aef',2024,'2024','Barcelona','Spain','ES','Europe','2024-06-25','2024-06-28',false,'{}',null),
('rm-africa-energy-forum-aef',2025,'2025','Cape Town','South Africa','ZA',null,'2025-06-17','2025-06-20',false,'{}',null),
('rm-africa-energy-forum-aef',2026,'2026','Cape Town','South Africa','ZA',null,null,null,false,'{}',null),
('rm-afraa-annual-general-assembly-summit-aga',2024,'56th (2024)','Cairo','Egypt','EG',null,null,null,true,'{}','Hosted by EgyptAir'),
('rm-afraa-annual-general-assembly-summit-aga',2025,'57th (2025)','Luanda','Angola','AO',null,null,null,false,'{}','Hosted by TAAG'),
('rm-afraa-annual-general-assembly-summit-aga',2026,'58th (2026)','Libreville','Gabon','GA',null,'2026-11-22','2026-11-24',false,'{}','Hosted by FlyGabon'),
('rm-afreximbank-annual-meetings-aam',2024,'31st (2024)','Nassau','Bahamas','BS','Americas',null,null,false,'{}','Held with ACTIF'),
('rm-afreximbank-annual-meetings-aam',2025,'32nd (2025)','Abuja','Nigeria','NG',null,'2025-06-23','2025-06-28',false,'{}',null),
('rm-afreximbank-annual-meetings-aam',2026,'33rd (2026)','El Alamein','Egypt','EG',null,'2026-06-21','2026-06-24',false,'{}',null),
('rm-au-assembly-ordinary-summit-feb',2024,'2024','Addis Ababa','Ethiopia','ET',null,null,null,false,'{}',null),
('rm-au-assembly-ordinary-summit-feb',2025,'2025','Addis Ababa','Ethiopia','ET',null,null,null,false,'{}',null),
('rm-au-assembly-ordinary-summit-feb',2026,'2026','Addis Ababa','Ethiopia','ET',null,null,null,false,'{}',null),
('rm-au-mid-year-coordination-meeting-mycm-executive-council-mid-',2023,'5th (2023)','Nairobi','Kenya','KE',null,null,null,false,'{}',null),
('rm-au-mid-year-coordination-meeting-mycm-executive-council-mid-',2024,'6th (2024)','Accra','Ghana','GH',null,null,null,false,'{}',null),
('rm-au-mid-year-coordination-meeting-mycm-executive-council-mid-',2025,'7th (2025)','Malabo','Equatorial Guinea','GQ',null,null,null,false,'{}',null),
('rm-au-mid-year-coordination-meeting-mycm-executive-council-mid-',2026,'8th (2026)','El Alamein','Egypt','EG',null,'2026-10-04','2026-10-04',false,'{}',null),
('rm-high-level-au-private-sector-forum',2023,'14th (2023)','Nairobi','Kenya','KE',null,null,null,true,'{}',null),
('rm-high-level-au-private-sector-forum',2024,'15th (2024)','Lusaka','Zambia','ZM',null,'2024-10-31','2024-11-02',false,'{}',null),
('rm-high-level-au-private-sector-forum',2025,'16th (2025)','Djibouti','Djibouti','DJ',null,'2025-12-14','2025-12-16',false,'{}',null),
('rm-africa-public-service-day-continental-celebration',2025,'2025','Nairobi','Kenya','KE',null,null,null,false,'{}',null),
('rm-pan-african-parliament-ordinary-sessions',2024,'2024','Midrand','South Africa','ZA',null,null,null,false,'{}',null),
('rm-pan-african-parliament-ordinary-sessions',2025,'2025','Midrand','South Africa','ZA',null,null,null,false,'{}',null),
('rm-pan-african-parliament-ordinary-sessions',2026,'2026','Midrand','South Africa','ZA',null,null,null,false,'{}',null),
('rm-aprm-forum-of-heads-of-state-and-government',2026,'35th (2026)','Addis Ababa','Ethiopia','ET',null,null,null,false,'{}','On the margins of the AU Summit'),
('rm-au-eu-summit',2017,'5th (2017)','Abidjan','Cote d''Ivoire','CI',null,null,null,false,'{}',null),
('rm-au-eu-summit',2022,'6th (2022)','Brussels','Belgium','BE','Europe',null,null,false,'{}',null),
('rm-au-eu-summit',2025,'7th (2025)','Luanda','Angola','AO',null,'2025-11-24','2025-11-25',false,'{}',null),
('rm-au-eu-ministerial-meeting',2022,'2nd (2022)','Kigali','Rwanda','RW',null,null,null,true,'{}',null),
('rm-au-eu-ministerial-meeting',2025,'3rd (2025)','Brussels','Belgium','BE','Europe','2025-05-21','2025-05-21',false,'{}',null),
('rm-africa-climate-summit-acs',2023,'ACS1 (2023)','Nairobi','Kenya','KE',null,null,null,false,'{}',null),
('rm-africa-climate-summit-acs',2025,'ACS2 (2025)','Addis Ababa','Ethiopia','ET',null,'2025-09-08','2025-09-10',false,'{}','Kenya had offered to host if others passed'),
('rm-africa-climate-week-unfccc-regional',2022,'2022','Libreville','Gabon','GA',null,null,null,false,'{}',null),
('rm-africa-climate-week-unfccc-regional',2023,'2023','Nairobi','Kenya','KE',null,null,null,false,'{}','Held with ACS1'),
('rm-africa-climate-week-unfccc-regional',2025,'2025','Addis Ababa','Ethiopia','ET',null,'2025-09-01','2025-09-06',false,'{}','Held with ACS2'),
('rm-sadc-summit-of-heads-of-state-and-government',2024,'44th (2024)','Luanda','Angola','AO',null,null,null,false,'{}',null),
('rm-sadc-summit-of-heads-of-state-and-government',2025,'45th (2025)','Antananarivo','Madagascar','MG',null,null,null,false,'{}',null),
('rm-sadc-summit-of-heads-of-state-and-government',2026,'46th (2026)','Durban','South Africa','ZA',null,'2026-08-17','2026-08-17',false,'{}',null),
('rm-sadc-summit-of-heads-of-state-and-government',2027,'47th (2027)',null,'Zambia','ZM',null,null,null,false,'{}','Announced in the 46th Summit communique; Zambia is incoming chair'),
('rm-sadc-council-of-ministers-feb-mar-aug',2025,'Aug 2025','Antananarivo','Madagascar','MG',null,null,null,false,'{}',null),
('rm-sadc-council-of-ministers-feb-mar-aug',2026,'Mar 2026','Pretoria','South Africa','ZA',null,null,null,true,'{}',null),
('rm-sadc-council-of-ministers-feb-mar-aug',2026,'Aug 2026','Durban','South Africa','ZA',null,null,null,false,'{}',null),
('rm-sadc-industrialisation-week-siw-exhibition',2024,'7th (2024)','Harare','Zimbabwe','ZW',null,'2024-07-28','2024-08-02',false,'{}',null),
('rm-sadc-industrialisation-week-siw-exhibition',2025,'8th (2025)','Antananarivo','Madagascar','MG',null,'2025-07-28','2025-08-01',false,'{}',null),
('rm-sadc-industrialisation-week-siw-exhibition',2026,'9th (2026)','Durban','South Africa','ZA',null,'2026-07-27','2026-07-31',false,'{}',null),
('rm-sadc-tfca-network-annual-meeting-and-periodic-sadc-tfca-inte',2026,'2026','Skukuza','South Africa','ZA',null,'2026-11-09','2026-11-13',false,'{}','Kruger National Park'),
('rm-sadc-parliamentary-forum-plenary-assembly',2025,'57th (Jun 2025)','Luanda','Angola','AO',null,null,null,false,'{}',null),
('rm-sadc-parliamentary-forum-plenary-assembly',2025,'58th (Nov 2025)','Durban','South Africa','ZA',null,'2025-11-30','2025-12-05',false,'{}',null),
('rm-sadc-parliamentary-forum-plenary-assembly',2026,'59th (2026)',null,'Seychelles','SC',null,null,null,false,'{}',null),
('rm-eac-ordinary-summit-of-heads-of-state',2024,'Nov 2024','Arusha','Tanzania','TZ',null,null,null,false,'{}',null),
('rm-eac-ordinary-summit-of-heads-of-state',2026,'26th (2026)','Arusha','Tanzania','TZ',null,null,null,false,'{}',null),
('rm-east-african-petroleum-conference-exhibition-eapce',2023,'10th (2023)','Kampala','Uganda','UG',null,null,null,false,'{}',null),
('rm-east-african-petroleum-conference-exhibition-eapce',2025,'11th (2025)','Dar es Salaam','Tanzania','TZ',null,'2025-03-05','2025-03-07',false,'{}',null),
('rm-east-african-petroleum-conference-exhibition-eapce',2027,'12th (2027)','Kigali','Rwanda','RW',null,'2027-03-09','2027-03-11',false,'{}',null),
('rm-comesa-summit-of-heads-of-state-and-government-council-minis',2023,'23rd (2023)','Lusaka','Zambia','ZM',null,null,null,true,'{}',null),
('rm-comesa-summit-of-heads-of-state-and-government-council-minis',2025,'24th (2025)','Nairobi','Kenya','KE',null,'2025-10-07','2025-10-09',false,'{}',null),
('rm-comesa-summit-of-heads-of-state-and-government-council-minis',2026,'25th (2026)','Harare','Zimbabwe','ZW',null,'2026-10-22','2026-10-22',false,'{}',null),
('rm-comesa-business-forum-held-with-summit',2025,'2025','Nairobi','Kenya','KE',null,null,null,false,'{}',null),
('rm-comesa-business-forum-held-with-summit',2026,'2026','Harare','Zimbabwe','ZW',null,'2026-10-20','2026-10-20',false,'{}',null),
('rm-comesa-source-international-trade-fair-high-level-business-s',2019,'2019','Nairobi','Kenya','KE',null,null,null,false,'{}',null),
('rm-eca-conference-of-african-ministers-of-finance-planning-econ',2024,'56th (2024)','Addis Ababa','Ethiopia','ET',null,null,null,true,'{}',null),
('rm-eca-conference-of-african-ministers-of-finance-planning-econ',2025,'57th (2025)','Addis Ababa','Ethiopia','ET',null,null,null,true,'{}',null),
('rm-eca-conference-of-african-ministers-of-finance-planning-econ',2026,'58th (2026)','Tangier','Morocco','MA',null,'2026-03-28','2026-04-03',false,'{}',null),
('rm-africa-regional-forum-on-sustainable-development-arfsd',2024,'10th (2024)','Addis Ababa','Ethiopia','ET',null,'2024-04-23','2024-04-25',false,'{}',null),
('rm-africa-regional-forum-on-sustainable-development-arfsd',2025,'11th (2025)','Kampala','Uganda','UG',null,null,null,true,'{}',null),
('rm-africa-regional-forum-on-sustainable-development-arfsd',2026,'12th (2026)','Addis Ababa','Ethiopia','ET',null,null,null,false,'{}',null),
('rm-african-economic-conference-aec',2022,'2022','Port Louis','Mauritius','MU',null,null,null,false,'{}',null),
('rm-african-economic-conference-aec',2023,'2023','Addis Ababa','Ethiopia','ET',null,null,null,true,'{}',null),
('rm-african-economic-conference-aec',2024,'2024','Gaborone','Botswana','BW',null,'2024-11-23','2024-11-25',false,'{}',null),
('rm-african-economic-conference-aec',2026,'2026','Abidjan','Cote d''Ivoire','CI',null,'2026-07-09','2026-07-11',false,'{}','2025 edition postponed; 2026 at AfDB HQ'),
('rm-african-development-forum-adf',2008,'VI (2008)','Addis Ababa','Ethiopia','ET',null,null,null,false,'{}',null),
('rm-african-development-forum-adf',2010,'VII (2010)','Addis Ababa','Ethiopia','ET',null,null,null,false,'{}',null),
('rm-african-development-forum-adf',2012,'VIII (2012)','Addis Ababa','Ethiopia','ET',null,null,null,false,'{}',null),
('rm-statistical-commission-for-africa-statcom-africa-forum-on-af',2026,'10th (2026)','Addis Ababa','Ethiopia','ET',null,null,null,false,'{}',null),
('rm-african-statistics-day-nov-au-ascc-codgs-statistics-meetings',2026,'CoDGs/ASCC 2026','Abuja','Nigeria','NG',null,'2026-12-07','2026-12-16',false,'{}',null),
('rm-who-regional-committee-for-africa-rc',2024,'RC74 (2024)','Brazzaville','Congo (Republic)','CG',null,'2024-08-26','2024-08-30',false,'{}',null),
('rm-who-regional-committee-for-africa-rc',2025,'RC75 (2025)','Lusaka','Zambia','ZM',null,'2025-08-25','2025-08-29',false,'{}',null),
('rm-who-regional-committee-for-africa-rc',2026,'RC76 (2026)','Addis Ababa','Ethiopia','ET',null,'2026-08-24','2026-08-28',false,'{}',null),
('rm-ilo-african-regional-meeting-arm',2015,'13th (2015)','Addis Ababa','Ethiopia','ET',null,null,null,true,'{}',null),
('rm-ilo-african-regional-meeting-arm',2019,'14th (2019)','Abidjan','Cote d''Ivoire','CI',null,'2019-12-03','2019-12-06',false,'{}',null),
('rm-ilo-african-regional-meeting-arm',2026,'15th (2026)','Windhoek','Namibia','NA',null,'2026-12-02','2026-12-04',false,'{}','Namibia offered; approved by the Governing Body Mar 2026'),
('rm-un-tourism-regional-commission-for-africa-caf-meeting',2024,'67th (2024)','Livingstone','Zambia','ZM',null,'2024-07-22','2024-07-24',false,'{}',null),
('rm-un-tourism-regional-commission-for-africa-caf-meeting',2025,'68th (2025)','Abuja','Nigeria','NG',null,null,null,false,'{"Kenya","Algeria","Ghana"}','Ghana withdrew in favour of Nigeria'),
('rm-un-tourism-regional-commission-for-africa-caf-meeting',2026,'69th (2026)','Victoria','Seychelles','SC',null,'2026-07-02','2026-07-04',false,'{}',null),
('rm-un-tourism-regional-conference-on-brand-africa-thematic-regi',2023,'1st (2023)','Windhoek','Namibia','NA',null,null,null,true,'{}',null),
('rm-un-tourism-regional-conference-on-brand-africa-thematic-regi',2024,'2nd (2024)','Livingstone','Zambia','ZM',null,null,null,false,'{}',null),
('rm-un-habitat-assembly-executive-board',2019,'2019','Nairobi','Kenya','KE',null,null,null,false,'{}',null),
('rm-un-habitat-assembly-executive-board',2023,'2023','Nairobi','Kenya','KE',null,null,null,false,'{}',null),
('rm-un-habitat-assembly-executive-board',2025,'Resumed 2025','Nairobi','Kenya','KE',null,null,null,false,'{}',null),
('rm-world-urban-forum-wuf',2022,'WUF11 (2022)','Katowice','Poland','PL','Europe',null,null,false,'{}',null),
('rm-world-urban-forum-wuf',2024,'WUF12 (2024)','Cairo','Egypt','EG',null,null,null,false,'{}',null),
('rm-world-urban-forum-wuf',2026,'WUF13 (2026)','Baku','Azerbaijan','AZ','Asia',null,null,false,'{}',null),
('rm-amcen-african-ministerial-conference-on-the-environment-ordi',2021,'18th (2021)','Dakar','Senegal','SN',null,null,null,true,'{}',null),
('rm-amcen-african-ministerial-conference-on-the-environment-ordi',2023,'19th (2023)','Addis Ababa','Ethiopia','ET',null,null,null,false,'{}',null),
('rm-amcen-african-ministerial-conference-on-the-environment-ordi',2025,'20th (2025)','Nairobi','Kenya','KE',null,'2025-07-14','2025-07-18',false,'{}','Libya held the presidency; session at UNEP HQ'),
('rm-unep-regional-consultative-meeting-for-africa',2025,'2025','Nairobi','Kenya','KE',null,null,null,false,'{}',null),
('rm-amcow-general-assembly-governing-council',2022,'13th (2022)',null,'Egypt','EG',null,null,null,false,'{}',null),
('rm-amcow-general-assembly-governing-council',2025,'14th (2025)','Dakar','Senegal','SN',null,'2025-09-29','2025-09-29',false,'{}','Senegal as AMCOW Chair 2025 to 2027'),
('rm-africa-water-week-aww-africa-water-sanitation-week',2018,'7th (2018)','Libreville','Gabon','GA',null,null,null,false,'{}',null),
('rm-africa-water-week-aww-africa-water-sanitation-week',2021,'8th (2021)',null,'Namibia','NA',null,null,null,false,'{}','Virtual or hybrid'),
('rm-africa-water-week-aww-africa-water-sanitation-week',2024,'9th (2024)','Cairo','Egypt','EG',null,'2024-10-13','2024-10-17',false,'{}','With Cairo Water Week'),
('rm-africasan-africa-sanitation-hygiene-conference',2019,'AfricaSan5 (2019)','Cape Town','South Africa','ZA',null,null,null,true,'{}',null),
('rm-africasan-africa-sanitation-hygiene-conference',2022,'2022','Windhoek','Namibia','NA',null,null,null,true,'{}','Edition number unverified'),
('rm-africasan-africa-sanitation-hygiene-conference',2025,'AfricaSan8 (2025)','Accra','Ghana','GH',null,'2025-09-13','2025-09-17',false,'{}','Ghana won the bid in Nov 2023'),
('rm-afdb-group-annual-meetings',2024,'59th (2024)','Nairobi','Kenya','KE',null,null,null,false,'{}',null),
('rm-afdb-group-annual-meetings',2025,'60th (2025)','Abidjan','Cote d''Ivoire','CI',null,'2025-05-26','2025-05-30',false,'{}','At AfDB HQ'),
('rm-afdb-group-annual-meetings',2026,'61st (2026)','Brazzaville','Congo (Republic)','CG',null,'2026-05-25','2026-05-29',false,'{}','Host MoU signed Sep 2025'),
('rm-africa-investment-forum-aif-market-days',2018,'2018','Johannesburg','South Africa','ZA',null,null,null,false,'{}',null),
('rm-africa-investment-forum-aif-market-days',2019,'2019','Johannesburg','South Africa','ZA',null,null,null,false,'{}',null),
('rm-africa-investment-forum-aif-market-days',2022,'2022','Abidjan','Cote d''Ivoire','CI',null,null,null,false,'{}',null),
('rm-africa-investment-forum-aif-market-days',2023,'2023','Marrakech','Morocco','MA',null,'2023-11-08','2023-11-10',false,'{}',null),
('rm-africa-investment-forum-aif-market-days',2024,'2024','Rabat','Morocco','MA',null,'2024-12-04','2024-12-06',false,'{}',null),
('rm-africa-investment-forum-aif-market-days',2025,'2025','Rabat','Morocco','MA',null,'2025-11-26','2025-11-28',false,'{}',null),
('rm-afreximbank-africa-trade-forum-atf-afreximbank-trade-finance',2025,'ATFS 2025','Abidjan','Cote d''Ivoire','CI',null,null,null,true,'{}',null),
('rm-africaribbean-trade-investment-forum-actif',2024,'2024','Nassau','Bahamas','BS','Americas',null,null,false,'{}',null),
('rm-africaribbean-trade-investment-forum-actif',2025,'2025',null,'Grenada','GD','Americas',null,null,true,'{}',null),
('rm-africaribbean-trade-investment-forum-actif',2026,'2026',null,'Saint Kitts and Nevis','KN','Americas',null,null,false,'{}',null),
('rm-africa-ceo-forum',2023,'2023','Abidjan','Cote d''Ivoire','CI',null,null,null,false,'{}',null),
('rm-africa-ceo-forum',2024,'2024','Kigali','Rwanda','RW',null,null,null,false,'{}',null),
('rm-africa-ceo-forum',2025,'12th (2025)','Abidjan','Cote d''Ivoire','CI',null,'2025-05-12','2025-05-13',false,'{}',null),
('rm-africa-ceo-forum',2026,'2026','Kigali','Rwanda','RW',null,'2026-05-14','2026-05-15',false,'{}',null),
('rm-africa-ceo-forum',2027,'2027','Abidjan','Cote d''Ivoire','CI',null,'2027-05-03','2027-05-04',false,'{}','Announced Jul 2026'),
('rm-id-africa-annual-general-meeting',2024,'2024','Cape Town','South Africa','ZA',null,null,null,true,'{}',null),
('rm-id-africa-annual-general-meeting',2025,'2025','Addis Ababa','Ethiopia','ET',null,null,null,false,'{}',null),
('rm-id-africa-annual-general-meeting',2026,'2026','Abidjan','Cote d''Ivoire','CI',null,'2026-05-12','2026-05-15',false,'{}',null),
('rm-afpif-african-peering-interconnection-forum',2023,'2023','Accra','Ghana','GH',null,null,null,false,'{}',null),
('rm-afpif-african-peering-interconnection-forum',2024,'2024','Kinshasa','DR Congo','CD',null,null,null,false,'{}',null),
('rm-afpif-african-peering-interconnection-forum',2025,'2025','Lagos','Nigeria','NG',null,'2025-08-19','2025-08-21',false,'{}',null),
('rm-afpif-african-peering-interconnection-forum',2026,'2026','Kigali','Rwanda','RW',null,'2026-08-18','2026-08-20',false,'{}',null),
('rm-africa-internet-summit-ais',2024,'2024','Dar es Salaam','Tanzania','TZ',null,null,null,true,'{}',null),
('rm-africa-internet-summit-ais',2025,'2025','Accra','Ghana','GH',null,null,null,false,'{}',null),
('rm-africa-internet-summit-ais',2026,'2026','Nairobi','Kenya','KE',null,'2026-06-22','2026-06-26',false,'{}',null),
('rm-africa-tech-summit-nairobi',2025,'2025','Nairobi','Kenya','KE',null,null,null,false,'{}',null),
('rm-africa-tech-summit-nairobi',2026,'2026','Nairobi','Kenya','KE',null,null,null,false,'{}',null),
('rm-africa-tech-summit-nairobi',2027,'2027','Nairobi','Kenya','KE',null,null,null,false,'{}',null),
('rm-africa-fintech-summit-afts',2024,'2024','Nairobi','Kenya','KE',null,null,null,true,'{}',null),
('rm-africa-fintech-summit-afts',2025,'14th (2025)','Accra','Ghana','GH',null,null,null,true,'{}',null),
('rm-africacom-africa-tech-festival',2024,'2024','Cape Town','South Africa','ZA',null,null,null,false,'{}','CTICC'),
('rm-africacom-africa-tech-festival',2025,'2025','Cape Town','South Africa','ZA',null,null,null,false,'{}','CTICC'),
('rm-africacom-africa-tech-festival',2026,'2026','Cape Town','South Africa','ZA',null,null,null,false,'{}','CTICC'),
('rm-investing-in-african-mining-indaba',2025,'2025','Cape Town','South Africa','ZA',null,null,null,false,'{}',null),
('rm-investing-in-african-mining-indaba',2026,'2026','Cape Town','South Africa','ZA',null,null,null,false,'{}',null),
('rm-investing-in-african-mining-indaba',2027,'2027','Cape Town','South Africa','ZA',null,'2027-02-08','2027-02-11',false,'{}',null),
('rm-africa-energy-indaba',2025,'2025','Cape Town','South Africa','ZA',null,null,null,false,'{}',null),
('rm-africa-energy-indaba',2026,'2026','Cape Town','South Africa','ZA',null,null,null,false,'{}',null),
('rm-africa-energy-indaba',2027,'2027','Cape Town','South Africa','ZA',null,'2027-03-02','2027-03-04',false,'{}',null),
('rm-african-energy-week-aew',2024,'2024','Cape Town','South Africa','ZA',null,null,null,false,'{}',null),
('rm-african-energy-week-aew',2025,'2025','Cape Town','South Africa','ZA',null,null,null,false,'{}',null),
('rm-african-energy-week-aew',2026,'2026','Cape Town','South Africa','ZA',null,'2026-10-12','2026-10-16',false,'{}',null),
('rm-africa-oil-week-africa-energies-summit',2024,'AOW 2024','Cape Town','South Africa','ZA',null,null,null,true,'{}',null),
('rm-africa-oil-week-africa-energies-summit',2025,'AES 2025','London','United Kingdom','GB','Europe',null,null,true,'{}',null),
('rm-africa-oil-week-africa-energies-summit',2026,'AES 2026','London','United Kingdom','GB','Europe',null,null,true,'{}',null),
('rm-africa-s-travel-indaba',2024,'2024','Durban','South Africa','ZA',null,null,null,false,'{}',null),
('rm-africa-s-travel-indaba',2025,'2025','Durban','South Africa','ZA',null,null,null,false,'{}',null),
('rm-africa-s-travel-indaba',2026,'2026','Durban','South Africa','ZA',null,'2026-05-11','2026-05-14',false,'{}','Fixed in Durban for five years from 2026 by SA Tourism tender'),
('rm-africa-tourism-leadership-forum-awards-atlf',2026,'2026','Polokwane','South Africa','ZA',null,'2026-09-02','2026-09-04',true,'{}',null),
('rm-global-africa-business-initiative-unstoppable-africa',2024,'2024','New York','United States','US','Americas',null,null,false,'{}',null),
('rm-global-africa-business-initiative-unstoppable-africa',2025,'2025','New York','United States','US','Americas',null,null,false,'{}',null),
('rm-global-africa-business-initiative-unstoppable-africa',2026,'2026','New York','United States','US','Americas','2026-09-20','2026-09-21',false,'{}',null),
('rm-africa-health-agenda-international-conference-ahaic',2019,'2019','Kigali','Rwanda','RW',null,null,null,false,'{}',null),
('rm-africa-health-agenda-international-conference-ahaic',2023,'2023','Kigali','Rwanda','RW',null,null,null,false,'{}',null),
('rm-africa-health-agenda-international-conference-ahaic',2025,'2025','Kigali','Rwanda','RW',null,null,null,false,'{}','Per Rwanda MoH'),
('rm-africa-health-agenda-international-conference-ahaic',2027,'2027','Kigali','Rwanda','RW',null,'2027-02-28','2027-03-03',false,'{}',null),
('rm-iata-wings-of-change-focus-africa-wocfa-iata-aviation-day-af',2025,'WOCFA 2025','Johannesburg','South Africa','ZA',null,null,null,false,'{}',null),
('rm-aerc-biannual-plenary-research-policy-summit',2025,'AERC 2025 Summit','Nairobi','Kenya','KE',null,'2025-11-30','2025-11-30',false,'{}',null),
('rm-chogm-commonwealth-heads-of-government-meeting-commonwealth-',2022,'2022','Kigali','Rwanda','RW',null,null,null,false,'{}',null),
('rm-chogm-commonwealth-heads-of-government-meeting-commonwealth-',2024,'2024','Apia','Samoa','WS','Oceania',null,null,false,'{}',null),
('rm-chogm-commonwealth-heads-of-government-meeting-commonwealth-',2026,'2026','St John''s','Antigua and Barbuda','AG','Americas','2026-11-01','2026-11-04',false,'{}','Selected on the final day of CHOGM 2024'),
('rm-sommet-de-la-francophonie',2022,'XVIIIe (2022)','Djerba','Tunisia','TN',null,null,null,false,'{}',null),
('rm-sommet-de-la-francophonie',2024,'XIXe (2024)','Villers-Cotterets and Paris','France','FR','Europe',null,null,false,'{}',null),
('rm-sommet-de-la-francophonie',2026,'XXe (2026)','Phnom Penh','Cambodia','KH','Asia',null,null,false,'{}',null),
('rm-cop-unfccc-africa-s-turn',2022,'COP27 (2022)','Sharm el-Sheikh','Egypt','EG',null,null,null,false,'{}',null),
('rm-cop-unfccc-africa-s-turn',2025,'COP30 (2025)','Belem','Brazil','BR','Americas',null,null,false,'{}',null),
('rm-cop-unfccc-africa-s-turn',2026,'COP31 (2026)','Antalya','Turkiye','TR','Europe',null,null,false,'{}',null),
('rm-cop-unfccc-africa-s-turn',2027,'COP32 (2027)',null,'Ethiopia','ET',null,null,null,false,'{"Nigeria"}','Ethiopia beat Nigeria for the African Group nomination, Nov 2025'),
('rm-au-agriculture-caadp-partnership-platform-africa-fertilizer-',2024,'Fertilizer & Soil Health Summit 2024','Nairobi','Kenya','KE',null,null,null,false,'{}',null);

insert into public.bid_wins (series_key, edition_year, edition_label, award_status, event_start, event_end,
       host_country_id, host_country_name, host_iso2, host_region, host_city, competing_destinations, conflict_note,
       decision_body, sector, source_url, source_tier, confidence, verified_on, added_by, win_factors)
select r.k, r.yr, r.lbl,
       case when coalesce(r.d2, r.d1, make_date(r.yr, 12, 31)) < current_date then 'held' else 'awarded' end,
       r.d1, r.d2,
       c.id, coalesce(c.name, r.country), r.iso2, coalesce(c.region, r.wregion), r.city, r.competing,
       null, e.decision_body, e.sector, e.source_url, e.source_tier,
       case when r.unv then 'unverified' else e.confidence end,
       case when r.unv then null else e.verified_on end,
       'rotation-map-history',
       null
  from rmh r
  join lateral (select * from public.events ev where ev.series_key = r.k order by ev.id limit 1) e on true
  left join public.countries c on c.name = r.country and c.type = 'country'
on conflict do nothing;

-- Keep the rotation-map notes as conflict-free context on the edition.
update public.bid_wins b set winning_bidder = r.note
  from rmh r
 where b.added_by = 'rotation-map-history' and b.series_key = r.k and b.edition_label = r.lbl
   and r.note ~* '^hosted by';
update public.bid_wins b set win_factors = r.note, win_factors_status = 'draft'
  from rmh r
 where b.added_by = 'rotation-map-history' and b.series_key = r.k and b.edition_label = r.lbl
   and r.note is not null and r.note !~* '^hosted by';

-- ---------------------------------------------------------------------------
-- (b) Facts the ICCA posts state (Tier 2), and the first Tier 1 confirmation
-- ---------------------------------------------------------------------------
update public.bid_wins set host_city='Berlin', host_country_name='Germany', host_iso2='DE', host_region='Europe',
       event_start='2027-06-09', event_end='2027-06-12', winning_bidder='visitBerlin with Messe Berlin', sector='health_education_social',
       win_factors='City bureau and venue operator bid together; the congress expects about 14,000 international participants, so large-venue capacity was central.'
 where icca_post_id = 9099;
update public.bid_wins set host_city='Yokohama', host_country_name='Japan', host_iso2='JP', host_region='Asia', sector='health_education_social'
 where icca_post_id = 9121;
update public.bid_wins set host_country_name='India', host_iso2='IN', host_region='Asia', sector='trade_industry_resources',
       winning_bidder='ICCA member with the national Indian society',
       win_factors='An ICCA member spotted the open call and partnered with the local national society to bid; a local association partner was the route in.'
 where icca_post_id = 7451;
update public.bid_wins set edition_year=2025, edition_label='11th (2025)', award_status='held', host_city='Xi''an', host_country_name='China', host_iso2='CN', host_region='Asia',
       winning_bidder='Xi''an Qujiang International Convention Center, with PCO Xi''an Kaili Conference and Exhibition', sector='digital_economy_finance'
 where icca_post_id = 7452;
update public.bid_wins set edition_year=2026, edition_label='17th (2026)', award_status='held', event_start='2026-03-12', event_end='2026-03-14',
       host_city='Da Nang', host_country_name='Vietnam', host_iso2='VN', host_region='Asia',
       winning_bidder='Vietnamese Society of Ultrasound in Medicine (VSUM)', sector='health_education_social',
       win_factors='National society host with a purpose-built convention centre (Ariyana, Da Nang); about 1,500 participants from 25 countries.'
 where icca_post_id = 7469;
update public.bid_wins set host_city='Bruges', host_country_name='Belgium', host_iso2='BE', host_region='Europe', sector='health_education_social',
       winning_bidder='Local host with the Belgian Hip Society, Visit Bruges and VISITFLANDERS Convention Bureaux',
       win_factors='A local clinical champion and the national society bid together with the city and regional convention bureaux, with the Bruges Meeting & Convention Centre as venue.'
 where icca_post_id = 7444;
update public.bid_wins set win_factors='The bureau found the opportunity through ICCA and approached the local association to bid.', sector='health_education_social'
 where icca_post_id = 7465;
update public.bid_wins set win_factors='The opportunity was found through database research, and peer-to-peer insight shaped the bid.', sector='health_education_social'
 where icca_post_id = 7515;

-- UNESCO Africa Engineering Week: Tier 1 confirmed (WFEO event page).
update public.bid_wins set edition_year=2025, edition_label='11th (2025)', award_status='held', event_start='2025-09-14', event_end='2025-09-20',
       host_city='Kampala', host_country_id=(select id from public.countries where iso2='UG' and type='country'),
       host_country_name='Uganda', host_iso2='UG', host_region='Eastern', sector='trade_industry_resources',
       winning_bidder='Uganda Institution of Professional Engineers (UIPE) with the Uganda Tourism Board',
       win_factors='The national engineering institution and the tourism board bid jointly; held at Speke Resort Convention Centre, Munyonyo.',
       source_url='https://www.wfeo.org/events/11th-unesco-africa-engineering-week-and-9th-africa-engineering-conference/',
       source_tier=1, confidence='verified', verified_on=current_date
 where icca_post_id = 7664;
insert into public.bid_wins (series_key, edition_year, edition_label, award_status, host_country_id, host_country_name, host_iso2, host_region,
       host_city, sector, source_url, source_tier, confidence, added_by)
select b.series_key, 2024, '10th (2024)', 'held', c.id, 'Angola', 'AO', c.region, 'Luanda', 'trade_industry_resources',
       'https://www.wfeo.org/wp-content/themes/wfeo/_mail/files/Newsletter-57_June-2024/10th-UNESCO-Africa-Engineering-Week.pdf', 2, 'unverified', 'history-backfill-010'
  from public.bid_wins b, public.countries c
 where b.icca_post_id = 7664 and c.iso2 = 'AO'
on conflict do nothing;

-- The ICCA test post ("ICCA Skills Benelux") is not a bid win. Parked as
-- cancelled so it never shows and Pass 1 never re-imports it.
update public.bid_wins set award_status='cancelled', conflict_note='Not a bid win: test post on the ICCA feed.' where icca_post_id = 7455;

-- ---------------------------------------------------------------------------
-- (c) Series names
-- ---------------------------------------------------------------------------
create or replace function public.series_clean_name(t text)
returns text language sql immutable set search_path = public as $$
  select case when length(x) - length(replace(x, '(', '')) > length(x) - length(replace(x, ')', '')) then x || ')' else x end
    from (select btrim(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(coalesce(t,''),
           '\s*-([A-Za-z0-9&]+)-\s*', ' (\1) ', 'g'),                    -- "-WFSF-" -> "(WFSF)"
           '(?<![0-9])(19|20)[0-9]{2}(?![0-9])', '', 'g'),                -- years, also "IACMR2025"
           '^(the\s+)?([0-9]+(st|nd|rd|th)|[IVXLC]+)\s+', '', 'i'),      -- leading ordinal
           '\(\s*\)|\s+-\s*$', '', 'g'),
           '\s+', ' ', 'g')) x) q
$$;

update public.series s set name = public.series_clean_name(s.name) where s.key like 'icca-%';
update public.series set name = 'EULAR Congress', aliases = aliases || array['EULAR European Congress of Rheumatology'] where key = 'icca-berlin-wins-the-eular-congress';
update public.series set name = 'OHBM Annual Meeting (Organization for Human Brain Mapping)' where key = 'icca-leading-global-brain-science-conference-ohbm-to-be-held-in-y';
update public.series set name = 'UNESCO Africa Engineering Week and African Engineering Conference', sector = 'trade_industry_resources',
       rotation_pattern = 'Rotates among African countries; national engineering institutions bid with UNESCO and the Federation of African Engineering Organisations',
       source_url = 'https://www.wfeo.org/events/11th-unesco-africa-engineering-week-and-9th-africa-engineering-conference/', source_tier = 1
 where key = 'icca-unesco-africa-engineering-week-african-engineering-conferenc';

-- Sector on ICCA series from the edition, else by keyword.
update public.series s set sector = coalesce(
  (select b.sector from public.bid_wins b where b.series_key = s.key and b.sector is not null limit 1),
  case when s.name ~* '(medic|surg|health|diabet|gastro|anaesth|anesth|pathol|ophthal|thyroid|wound|apheresis|suicide|osteopor|ultrasound|mycolog|autism|brain|rheumat|genetic|histochem|dermat|veterinar|ECVIM|sport|pediatric|paediatric|lions)' then 'health_education_social'
       when s.name ~* '(web|neural|ieee|multimedia|electron|fab lab|communication|futures|space|cospar)' then 'digital_economy_finance'
       when s.name ~* '(financ|development financing)' then 'digital_economy_finance'
       when s.name ~* '(soil|plant|agricult|crustacean|cell technology|measurement|non-destructive|engineering|imeko|cigr)' then 'trade_industry_resources'
       when s.name ~* '(bonsai|law|iucn)' then 'tourism_transport_creative'
  end::public.sector_bucket)
 where s.key like 'icca-%' and s.sector is null;
update public.bid_wins b set sector = s.sector from public.series s where s.key = b.series_key and b.sector is null;

-- Future Pass 1 ingests use the cleaner for new series names and catch years
-- glued to acronyms ("IACMR2025").
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

drop table rmh;
select public.history_recompute();
