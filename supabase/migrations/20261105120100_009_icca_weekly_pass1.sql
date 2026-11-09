-- 009: weekly Pass 1 for the bid history layer.
-- A sync log for the icca-bid-wins edge function, and a pg_cron job that calls
-- it every Monday at 03:00 UTC. The function is idempotent and limits
-- non-admin calls to one run per 6 hours. The key in the job is the public
-- anon key, which only lets it trigger the sync.
-- Reversal: select cron.unschedule('icca_bid_wins_weekly'); drop table public.history_sync_log;

create table if not exists public.history_sync_log (
  id        bigserial primary key,
  ran_at    timestamptz not null default now(),
  source    text not null,
  by_admin  boolean not null default false,
  result    jsonb
);
alter table public.history_sync_log enable row level security;
drop policy if exists hsl_admin_read on public.history_sync_log;
create policy hsl_admin_read on public.history_sync_log for select to authenticated using (public.is_allowlisted());

do $$
begin
  perform cron.unschedule(jobid) from cron.job where jobname = 'icca_bid_wins_weekly';
  perform cron.schedule('icca_bid_wins_weekly', '0 3 * * 1', $job$
    select net.http_post(
      url     := 'https://upzkvszgoqhoefkiwoep.supabase.co/functions/v1/icca-bid-wins',
      headers := jsonb_build_object('Content-Type','application/json',
                   'Authorization','Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwemt2c3pnb3Fob2Vma2l3b2VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMzg1MjQsImV4cCI6MjA5NzcxNDUyNH0.4RB-5FCWW7JXvGBKs0PlzkYcUeG5kTVxTVdoXUNp8ao'),
      body    := '{"source":"cron"}'::jsonb,
      timeout_milliseconds := 60000)
  $job$);
end $$;
