-- 018: Options for the partner submission form.
-- Anon cannot read countries or profile_field_catalog directly (both are
-- admin-only), so the public form takes the country list and the active
-- catalog from this read-only RPC. Nothing else from either table is exposed.

begin;

create or replace function public.partner_form_options()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'countries', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'iso2', iso2) order by name)
        from public.countries where type = 'country'), '[]'::jsonb),
    'fields', coalesce((
      select jsonb_agg(jsonb_build_object(
               'key', key, 'label', label, 'group', field_group, 'value_kind', value_kind,
               'enum_values', enum_values, 'allowed_types', allowed_types, 'target_kind', target_kind)
             order by sort_order)
        from public.profile_field_catalog where active), '[]'::jsonb))
$$;
revoke all on function public.partner_form_options() from public;
grant execute on function public.partner_form_options() to anon, authenticated;

commit;
