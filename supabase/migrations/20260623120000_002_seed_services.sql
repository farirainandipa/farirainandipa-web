-- Seed services and service_items: the Services page renders rows from
-- these tables, which were left empty after the initial schema migration.
with s as (
  insert into services (category_key, title, description, icon_name, display_order, is_active) values
    ('conferences', 'Conferences & Meetings', 'End-to-end planning and delivery of conferences, summits, and corporate meetings.', 'Users', 1, true),
    ('consulting', 'Strategic Consulting', 'Advisory support for bid development, MICE strategy, and destination marketing.', 'Target', 2, true),
    ('exhibitions', 'Exhibition Management', 'Curation and management of trade exhibitions and exhibitor logistics.', 'LayoutGrid', 3, true),
    ('incentives', 'Incentive Travel', 'Design and coordination of incentive travel programs across Africa.', 'Plane', 4, true),
    ('sustainability', 'Sustainability Frameworks', 'Integrating environmental responsibility and sustainable practices into events.', 'Shield', 5, true),
    ('training', 'Training', 'Professional development programs delivered through the Institute of Events Professionals in Zimbabwe (IEPZ).', 'GraduationCap', 6, true)
  returning id, category_key
)
insert into service_items (service_id, name, display_order)
select id, item, ord from s
join (values
  ('conferences', 'Conference and summit planning', 1),
  ('conferences', 'Corporate meeting management', 2),
  ('conferences', 'Delegate and logistics coordination', 3),
  ('consulting', 'Bid development and preparation', 1),
  ('consulting', 'MICE research and strategy', 2),
  ('consulting', 'Destination marketing and management', 3),
  ('exhibitions', 'Trade exhibition curation', 1),
  ('exhibitions', 'Exhibitor and stand management', 2),
  ('exhibitions', 'Expo floor logistics', 3),
  ('incentives', 'Incentive program design', 1),
  ('incentives', 'Destination and venue sourcing', 2),
  ('incentives', 'On-site program delivery', 3),
  ('sustainability', 'Sustainable event frameworks', 1),
  ('sustainability', 'Environmental impact assessments', 2),
  ('sustainability', 'Green certification guidance', 3),
  ('training', 'Events professional certification', 1),
  ('training', 'Industry workshops and seminars', 2),
  ('training', 'Capacity-building programs', 3)
) as items(category_key, item, ord) on items.category_key = s.category_key;
