# Handover: finish and ship Pipeline v2 (PR #13)

For a Claude Code session working in `farirainandipa/farirainandipa-web`. Read `CLAUDE.md` first; it is the source of truth for the stack, RLS rules and copy style. This file says what is already done, what is left, how to verify each piece, and how to ship.

## Context in one paragraph

The Africa MICE Bid Pipeline is a standalone page at `public/pipeline/index.html` (served at `/pipeline`), backed by the website's Supabase project. On 4 Nov 2026 the owner decided to move it to a "v2 trust schema": provenance and a confidence badge on every record, a rotation map of 80 non-RFP forums, structured destination profiles for all 54 African states, a public submission form for movable corporate and association events, a nightly demotion job, and a new agency priority set (Zimbabwe, Zambia, Rwanda, Kenya, Botswana, Namibia). The design rationale lives in three Claude Docs in the owner's project ("Pipeline Record Schema & Scan Rules", "Bureau Licence Tiers", "Live Build vs Prototype") and the research data in `Pipeline_Reference_Data.xlsx`. The operating rules for the weekly scan are in the Claude Project doc `scan-rules.md`; the 54-country fit inputs are in `fit-score-inputs.md` there.

Branch `pipeline-v2-trust-schema` already carries most of this as PR #13 ("Pipeline v2: provenance, rotation map, all-Africa profiles, submissions"). Do not start over. Verify it, close the gaps below, and ship it.

## What is already on the branch

| Piece | Where | Status |
| --- | --- | --- |
| Trust columns on `bid_opportunities` and `events` (`source_tier`, `confidence`, `verified_on`, `conflict_note`, `series_key`, `edition_label`, `host_selection`) | `supabase/migrations/20261104120000_004_pipeline_trust_schema.sql` | Written |
| Rotation-map fields on `events` (`forum_group`, `decision_body`, `lead_time`, `last_hosts`, `openness_2027_29`, `openness_note`, `fixed_venue`) | same | Written |
| `destination_profiles`, `destination_profile_fields`, `submissions` tables with RLS (admin write, bureau reads own country, anon insert on submissions) | same | Written |
| `public.pipeline_demote()` + pg_cron job `pipeline_demote_nightly` at 02:15 UTC | same | Written; prints a notice if pg_cron is not enabled |
| Priority set reset to ZW, ZM, RW, KE, BW, NA | same, section 2 | Written |
| Seed: 71 forum rows into `events` (keyed on `series_key`, updates the 9 already tracked), 54 `destination_profiles`, 702 `destination_profile_fields`, 4 `policy_frameworks` and 13 `country_sectors` for Botswana and Namibia | `supabase/migrations/20261104120100_005_pipeline_v2_seed.sql` | Written; idempotent (`where not exists` on `series_key` / `country_id`) |
| Page: confidence badge and verified-on in rows, client-side effective badge, Rotation map fields and "Hide fixed-venue series" toggle on Strategic Events, fit score with openness multiplier, Submissions review tab, Destinations reading `destination_profiles` | `public/pipeline/index.html` | Written |
| Public submission form with the three gating questions required | `public/pipeline/submit.html` | Written |
| CLAUDE.md "Update Nov 2026" section | `CLAUDE.md` | Written |

## What is not known yet

Whether migrations 004 and 005 have been applied to the linked Supabase project (`upzkvszgoqhoefkiwoep`). Nothing in the repo records this. Check before anything else (step 1 below). The deploy preview the owner reviewed on 4 Nov was PR #11, not this branch.

## Steps, in order

### 1. Confirm the database state

- Open the Supabase SQL editor (or `supabase db` with the linked project) and run:
  `select column_name from information_schema.columns where table_name='events' and column_name in ('confidence','series_key','openness_2027_29');`
  `select count(*) from public.events where added_by='rotation-map-import';` (expect 71)
  `select count(*) from public.destination_profiles;` (expect 54)
  `select priority, count(*) from public.countries group by 1;` (expect 6 true)
  `select jobname from cron.job where jobname='pipeline_demote_nightly';`
- If the columns are missing, apply 004 then 005 in that order. If 005 was applied before 004 (it would have failed), re-run 004 then 005; both are safe to re-run.
- If pg_cron is not enabled, enable it under Database > Extensions and run the `cron.schedule` line printed in the notice.
- Run Supabase security advisors after DDL. Fix any new RLS or lint warning before continuing. Never widen an `authenticated` policy; bureau accounts must not be able to write.

### 2. Reconcile the venue rule

The owner chose the rule "largest plenary = largest purpose-built theatre-style hall, not arena or flat-floor". The pre-v2 `countries` rows for the old priority six still carry arena figures (Rwanda "BK Arena 10,000", South Africa "Durban ICC & Arena 5,000"). The new `destination_profiles` rows use the theatre rule (Kigali Convention Centre 2,600; Durban ICC 6,000). Make the page read the headline venue from `destination_profiles` for every country, and update the six legacy `countries` rows so the two sources agree. Add this as migration 006; do not edit 004 or 005.

### 3. Close the remaining page gaps

Check each on the deploy preview, not only locally. Items found still missing on 4 Nov:

- **Bid Pipeline rows have no detail panel.** Strategic Events has one; RFP rows do not. Add a panel showing source URL, source tier, verified-on, conflict note, series and edition, and the host-fit breakdown. Reuse the Strategic Events panel markup.
- **Fit breakdown is a single number.** The score multiplies a base by an openness factor (`{open:1, partly:0.8, unknown:0.6, rotation:0.35, fixed:0}` at about line 308 of `index.html`). Show the components (bureau, bids formally, subvention, visa ease, air access, venue vs typical size, ICCA, openness, advisory) next to the number so a bureau can see why it ranks where it does. Weights are placeholders and may stay as they are.
- **Submission form sector list.** `submit.html` builds its sector `<select>` from a template; confirm it is populated from the 18-sector taxonomy the rest of the app uses (`sectors` table), not a hard-coded list.
- **Bureau portal badge.** Confirm the `bureau_portal()` RPC returns `confidence` and `verified_on` and that the portal view renders the badge. A bureau paying for the pipeline is paying for that badge.
- **Policy layer for the new priority pair.** Seed 005 added 4 frameworks and 13 key sectors for Botswana and Namibia. Open the Policy & Sectors matrix and confirm both countries appear with ranks; if the matrix still shows Malawi and South Africa as priority, it is reading an old flag.
- **Overview tiles.** The "Policy frameworks" and "Confirmed policy links" tiles should count across all countries, not only the old six.

### 4. Run the checks

```bash
npm install
npm run lint
npm run typecheck   # if present; otherwise tsc --noEmit
npm run build
```

Then open the Netlify deploy preview for PR #13 and walk every tab signed in as an admin, then "Preview a bureau's view" for Kenya and for Botswana. Specifically confirm:

- A row whose deadline has passed is not shown as Open (the pre-v2 page showed "ICME-17 (2032)" as Open with a passed deadline).
- The header no longer shows one table-wide "last updated" date; each row has its own.
- "Hide fixed-venue series" removes Mining Indaba, AfricaCom, Travel Indaba and the AU Assembly.
- Submitting the public form creates a `submissions` row and it appears on the Submissions tab; confirming it creates an `events` row with `source_tier = 4`.
- Signing in as a bureau user shows only that country.

### 5. Ship

- Push fixes to `pipeline-v2-trust-schema`; keep PR #13 as the vehicle. GitHub GraphQL is not reachable from Claude Code sessions; use `gh api repos/farirainandipa/farirainandipa-web/...` (REST) for PR operations.
- Update the PR description with what changed since the first commit and the migration-applied status.
- Merge to `main` only after the owner has looked at the deploy preview. Netlify builds `main`; `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must already be set there.
- After merge, confirm the nightly job ran once (`select * from cron.job_run_details where jobid = (select jobid from cron.job where jobname='pipeline_demote_nightly') order by start_time desc limit 1;`).

## Out of scope for this handover

- The weekly discovery and verification scan itself (it runs as a scheduled Claude task against `scan-rules.md`, not in this repo).
- Pricing, licence tiers and the client portal / Bid Development Pack (separate consultancy workstream).
- The prototype artifact the owner used for comparison; it is retired once PR #13 is live.

## Conventions that bite

- Copy style from `CLAUDE.md`: no em dashes and no colon-before-a-list in user-facing text. The pipeline page has some; fix any you touch.
- Add migrations as new files; never edit 001 to 005.
- `lucide-react` only for icons in the React app; the pipeline page is plain HTML and uses none.
- Commit messages and the PR body end with the attribution lines the session is given.
