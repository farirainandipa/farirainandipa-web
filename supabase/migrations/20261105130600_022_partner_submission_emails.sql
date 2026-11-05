-- 022: Submitter emails for partner submissions.
-- profile_notify() posts to the send-submission-verification edge function
-- with the shared secret from Vault (submission_webhook_secret, created
-- separately so it is never committed). profile_verify() now sends the
-- "in the review queue" email with the status link, and a trigger sends the
-- reviewer's question when a field is set to confirm_requested. The magic
-- link itself is still sent by profile_submit() from migration 016; the
-- function treats a payload without a kind as "verify".

begin;

create or replace function public.profile_notify(p_kind text, p_body jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'submission_webhook_secret' limit 1;
  if v_secret is null then return false; end if;
  perform net.http_post(
    url := 'https://upzkvszgoqhoefkiwoep.supabase.co/functions/v1/send-submission-verification',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', v_secret),
    body := p_body || jsonb_build_object('kind', p_kind),
    timeout_milliseconds := 5000);
  return true;
end $$;
revoke all on function public.profile_notify(text, jsonb) from public, anon, authenticated;

create or replace function public.profile_verify(token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  s      public.profile_submissions%rowtype;
  u      public.profile_submitters%rowtype;
  cname  text;
  n      int;
  sent   boolean := false;
begin
  if token is null or length(token) <> 64 then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  select * into s from public.profile_submissions
   where token_hash = encode(extensions.digest(token, 'sha256'), 'hex');
  if s.id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;
  if s.status <> 'awaiting_email' then
    return jsonb_build_object('ok', true, 'already', true, 'status_key', s.status_key);
  end if;
  if s.token_expires_at < now() then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;
  update public.profile_submissions
     set status = 'new', email_verified_at = now(), token_hash = null, token_expires_at = null
   where id = s.id;
  update public.profile_submitters set email_verified_at = coalesce(email_verified_at, now()) where id = s.submitter_id
  returning * into u;
  select name into cname from public.countries where id = s.country_id;
  select count(*) into n from public.profile_submission_fields where submission_id = s.id;
  sent := public.profile_notify('confirmed', jsonb_build_object(
    'submission_id', s.id, 'email', u.work_email, 'name', u.full_name, 'organisation', u.organisation,
    'country', cname, 'status_key', s.status_key, 'field_count', n));
  return jsonb_build_object('ok', true, 'status_key', s.status_key, 'email_sent', sent);
end $$;
revoke all on function public.profile_verify(text) from public;
grant execute on function public.profile_verify(text) to anon, authenticated;

create or replace function public.profile_confirm_request_notify()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r record;
begin
  if new.decision = 'confirm_requested' and old.decision is distinct from 'confirm_requested' then
    select ps.id, ps.status_key, u.work_email, u.full_name, c.name as country, k.label
      into r
      from public.profile_submissions ps
      join public.profile_submitters u on u.id = ps.submitter_id
      join public.countries c on c.id = ps.country_id
      join public.profile_field_catalog k on k.key = new.field_key
     where ps.id = new.submission_id;
    perform public.profile_notify('confirm_request', jsonb_build_object(
      'submission_id', r.id, 'email', r.work_email, 'name', r.full_name, 'country', r.country,
      'status_key', r.status_key, 'label', r.label, 'note', new.reviewer_note));
  end if;
  return new;
end $$;
revoke all on function public.profile_confirm_request_notify() from public, anon, authenticated;

drop trigger if exists profile_confirm_request_notify on public.profile_submission_fields;
create trigger profile_confirm_request_notify
  after update of decision on public.profile_submission_fields
  for each row execute function public.profile_confirm_request_notify();

commit;
