-- Email delivery for contact form submissions.
--
-- On every insert into contact_submissions, call the
-- `send-enquiry-notification` edge function, which emails the enquiry to the
-- admin inbox over SMTP. The call is made asynchronously via pg_net so a slow
-- or failing email never blocks (or fails) the form submission itself.
--
-- The edge function is protected by a shared secret sent in the
-- `x-webhook-secret` header. The secret value is stored in Supabase Vault under
-- the name `contact_webhook_secret` (created separately, not in this migration,
-- so the secret is never committed to git) and must match the WEBHOOK_SECRET
-- edge function secret.

-- pg_net lets Postgres make outbound HTTP calls (installs the `net` schema).
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_contact_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_secret TEXT;
BEGIN
  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'contact_webhook_secret'
  LIMIT 1;

  PERFORM net.http_post(
    url := 'https://upzkvszgoqhoefkiwoep.supabase.co/functions/v1/send-enquiry-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', COALESCE(v_secret, '')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'contact_submissions',
      'record', to_jsonb(NEW)
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contact_submissions_notify ON public.contact_submissions;

CREATE TRIGGER contact_submissions_notify
AFTER INSERT ON public.contact_submissions
FOR EACH ROW EXECUTE FUNCTION public.notify_contact_submission();

-- The function only ever runs as a trigger; it must not be callable directly
-- via the PostgREST RPC endpoint (it is SECURITY DEFINER).
REVOKE EXECUTE ON FUNCTION public.notify_contact_submission() FROM PUBLIC, anon, authenticated;
