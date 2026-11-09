# CLAUDE.md

Guidance for Claude Code (and other agents) working in this repository.

## Project overview

Marketing website for Farirai Nandipa (event/MICE services). Vite + React +
TypeScript SPA styled with Tailwind, using React Router for client-side
routing and Supabase as the backend (Postgres + REST via `@supabase/supabase-js`).

Originally scaffolded with Bolt (`bolt-vite-react-ts` template, see `.bolt/`).

## Stack

- Vite 5, React 18, TypeScript 5
- Tailwind CSS, lucide-react icons
- react-router-dom v7
- Supabase (`src/lib/supabase.ts`) for data: articles, services, contact form

## Commands

```bash
npm install       # install deps
npm run dev        # start dev server
npm run build       # production build to dist/
npm run preview      # preview the production build
npm run lint        # eslint
npm run typecheck      # tsc --noEmit
```

## Structure

- `src/pages/` — one component per route (Home, About, Services, Packages,
  Insights, ArticleDetail, Contact)
- `src/components/` — shared layout pieces (Header, Footer, Layout, ScrollFade)
- `src/lib/supabase.ts` — Supabase client + row types (`Article`, `Service`,
  `ServiceItem`, `ContactSubmission`)
- `supabase/migrations/` — SQL migrations, applied directly to the linked
  Supabase project (see below)

## Environment variables

Required in `.env` (gitignored) for the app to run — `src/lib/supabase.ts`
throws at startup if either is missing:

```
VITE_SUPABASE_URL=https://upzkvszgoqhoefkiwoep.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable/anon key>
```

The anon/publishable key is safe to expose client-side; it is constrained by
the RLS policies below. Never put the `service_role` key in client code or
commit it anywhere.

The same two variables must be set in the Netlify site's environment
variables for production builds.

## Database (Supabase)

Project ref: `upzkvszgoqhoefkiwoep` (region eu-west-1).

Tables: `articles`, `contact_submissions`, `services`, `service_items`.
RLS is enabled on every table. Current policy shape:

- `articles`, `services`: public can `SELECT` only published/active rows;
  `authenticated` role can fully read/write.
- `service_items`: public read-all (no draft state on this table);
  `authenticated` can write.
- `contact_submissions`: public (anon) can `INSERT` only — this is how the
  Contact page submits the enquiry/consultation form. Only `authenticated`
  can read, update, or delete submissions.

**Update Oct 2026:** the same Supabase project also backs the Africa MICE Bid
Pipeline (`public/pipeline/index.html`, served at `/pipeline`). It has sign-in,
including client logins for convention bureaux (`user_access`, role `bureau`).
Because of that, every `authenticated` write/read policy on the website tables
above is now scoped to `public.is_allowlisted()` (admins in `allowlist`), not
to any signed-in user. Keep it that way: never reopen these policies to plain
`authenticated`, or bureau accounts could edit the website. Pipeline tables
(countries, bid_opportunities, events, policy_frameworks, country_sectors,
bid_alignments, etc.) are admin-only via RLS; bureaux read their own country
only through the `bureau_portal()` RPC.

Historically there was **no sign-in flow in the app**, so nothing actually held
the `authenticated` role today — writes to `articles`/`services`/`service_items`
and reads/updates on `contact_submissions` can only happen via the Supabase
dashboard, the `service_role` key, or a future admin login. If an admin UI or
auth flow is added, scope `authenticated` policies down further (e.g. to a
specific admin user/role claim) rather than leaving them open to any signed-in
user.

**Update Nov 2026 (pipeline v2 trust schema, migrations 004 and 005):**
`bid_opportunities` and `events` carry provenance on every row
(`source_tier` 1 primary / 2 official / 3 aggregator / 4 submitted,
`confidence` verified / stale / unverified / conflict, `verified_on`,
`conflict_note`) plus `series_key`, `edition_label` and `host_selection`.
Events also carry the rotation-map fields (`forum_group`, `decision_body`,
`lead_time`, `last_hosts`, `openness_2027_29`, `fixed_venue`). Only a Tier 1 or
2 page may set a date or host; aggregator hits create candidates only. The
nightly `public.pipeline_demote()` (pg_cron job `pipeline_demote_nightly`)
moves Verified to Stale after 60 days (14 for open bids), Stale to Unverified
after 120, and closes passed deadlines; the page also computes the effective
badge client-side so a missed job never shows a stale record as Verified.
`destination_profiles` (one row per country, fit-score inputs) and
`destination_profile_fields` (researched fields with source URL and
confidence) are admin-write, and a bureau can read its own country's rows.
`submissions` takes anonymous inserts from `public/pipeline/submit.html`
(the three gating questions are required); admins review it on the
Submissions tab, and confirming creates an `events` row at tier 4. The
agency's priority set is Zimbabwe, Zambia, Rwanda, Kenya, Botswana, Namibia
(`countries.priority`); every other country still has its own bureau view.
The operating rules for the weekly scan live in the Claude Project doc
`scan-rules.md`.

**Update Nov 2026 (bid history layer, migrations 008 to 015):** `series` is
now the parent of `events.series_key` and `bid_opportunities.series_key` (FK),
with `organisers` above it. `bid_wins` holds one row per awarded or held
edition (history only; future opportunities stay on `events`), with the same
trust fields plus `win_factors`/`win_factors_status` (draft until reviewed),
`source_quote` (max 14 words, check-enforced; never store ICCA article text)
and `source_published_on` (the ICCA post date, which is not the award date).
`user_access.tier` is `free`/`explorer`/`bureau`/`bureau_plus`; every bureau
login needs one. These three tables are admin-only under RLS. Subscribers read
them only through `bid_history()`, `bid_history_competitors()` (Bureau Plus)
and the anon `bid_wins_teaser()` (public page `public/pipeline/history.html`),
which apply the tier rules server side. Keep it that way: never add an
`authenticated` read policy on them. Pass 1 is the `icca-bid-wins` edge
function on pg_cron job `icca_bid_wins_weekly`. `history_recompute()` (run by
the nightly `pipeline_demote()`) derives depth, cycle, Dormant and the
estimated next window, and never overrides a Tier 1 bid window on `events`.
Details and the Pass 2 rules are in `docs/HANDOVER-bid-history.md`.

**Update Nov 2026 (destination partner submissions, migrations 016 and
017):** outside parties (bureaux, venues, ministries, associations, airlines)
propose profile data through `profile_submit()`, `profile_verify()` (magic
link) and `profile_status()`, the only anon surface. Rows land in
`profile_submitters`, `profile_submissions` and `profile_submission_fields`
(what may be proposed, and by which submitter type, is the
`profile_field_catalog`); all of these, plus `profile_review_audit`,
`profile_submission_attempts`, `freemail_domains` and
`verified_submitter_domains`, are admin-only under RLS and the anon and
bureau roles hold no table grants on them. Keep it that way. A submission
never writes live data: an admin promotes each field from the Partner Data
tab through `profile_review()` (migrations 019 to 021), which writes
`destination_profile_fields` (or a `countries` visa column) at `source_tier`
4, `confidence` unverified, with `recheck_due_on` 30 days out. It never
overrides a Verified row at Tier 1 or 2 (or with no tier, the researched
rows): that row is kept and marked Conflict with the proposal noted.
`profile_field_recheck()` closes a re-check, and only a Tier 1 or 2 URL may
set Verified. Accepting "events currently bidding for" creates a candidate
`events` row (with its `series` parent) at Tier 4, never a live edition.
`destination_profile_fields` now takes the four-state confidence (plus
`partial` for the researched rows) and joins `pipeline_demote()` only where
`source_tier` is set. Every change to `destination_profile_fields`,
`destination_profiles` and the visa block on `countries` lands in
`profile_review_audit` with the old row. Supporting documents go to the
private `submission-uploads` bucket; anon may upload only into a fresh
submission's folder. Submitter emails (magic link, "in the queue" with the status link
plus an admin notice, and a reviewer's confirm request) go through
`profile_notify()` to the `send-submission-verification` edge function,
which checks the shared secret `WEBHOOK_SECRET` (Vault
`submission_webhook_secret` holds the same value, migration 022). If the
Vault secret is missing, submissions simply wait in `awaiting_email` and an
admin can verify them by hand. Spec and build notes:
`docs/HANDOVER-partner-submissions.md`.

**Update Nov 2026 (Bid Workspace, migrations 023 and 024):** the Bid
Development Pack now runs as an app at `public/bids/index.html`, served at
`/bids` (netlify.toml redirect) and also from the `bids` edge function. Tables
are prefixed `bw_` (orgs, members, bids, scores, requirements, stakeholders,
milestones, documents, messages, activity, letter templates, defaults) and are
multi-tenant: every bid has an owning org and an optional client org. Admins
are `allowlist` emails (`bw_is_admin()`); client logins live in `bw_members`
and see only their org's bids and `client_visible` rows through
`bw_can_see_bid()`. Scorecards (`bw_scores`) are admin-only. Client logins are
created by the `bid-admin` edge function; `bid-extract` does AI requirement
extraction when `ANTHROPIC_API_KEY` is set. Files go to the private `bid-docs`
bucket. Keep every `bw_*` policy scoped as it is: never add a plain
`authenticated` policy. Full handover: `docs/HANDOVER-bid-workspace.md`.

When changing schema, add a new file under `supabase/migrations/` (don't edit
existing ones) and apply it to the linked project. After any DDL change, check
Supabase security advisors for new RLS/lint warnings.

**Update 9 Nov 2026 (pipeline moved, migration 023):** the Bid Pipeline now
lives on its own site, the Africa MICE Dashboard
(`github.com/farirainandipa/africa-mice-dashboard-web`, Netlify site
`africamicedashboard`). `netlify.toml` here 301-redirects every `/pipeline`
URL there (path and query kept, `force = true`) so old links and emails keep
working. The pipeline pages have been removed from this repo (`public/pipeline/`
is gone); the dashboard repo is the only source. The header's "Client Login"
link and the `send-submission-verification` emails point at the new site.
The database is unchanged and still shared, and migrations stay in this repo.
Migration 023 revoked EXECUTE from `anon` on every function except the
public-form RPCs (`bid_wins_teaser`, `partner_form_options`, `profile_submit`,
`profile_verify`, `profile_status`, `submission_upload_allowed`), removed
client EXECUTE on trigger functions, and pinned `search_path` on the `bw_*`
trigger functions. New SECURITY DEFINER functions must do the same.

## Deployment

Deployed via Netlify, building from the `main` branch of
`github.com/farirainandipa/farirainandipa-web`. Build command `npm run build`,
publish directory `dist`. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
in Netlify's site environment variables — the build will fail without them.

## Conventions

- Keep one page component per route under `src/pages/`; shared chrome goes in
  `src/components/Layout.tsx` (Header/Footer wrap `<Outlet />`).
- Icons: use `lucide-react` only (per `.bolt/prompt`); don't add another icon
  library.
- No test suite currently exists.

## Copy style

- No em dashes (—) anywhere in user-facing text. Use a comma, or rephrase.
- No Oxford colons (a colon before a list or explanatory clause in running
  prose, e.g. "We offer: planning, logistics"). Work the list into the
  sentence naturally instead.
