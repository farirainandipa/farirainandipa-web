# Bid Workspace handover (9 Nov 2026)

The Bid Workspace is the working-software form of the Bid Development & Commercialisation Pack.
It lives in this repo as of this handover; the copy in `D:\Farirai Nandipa MICE\Bid Workspace\` is the
build-session original and should be treated as read-only from now on.

## What exists and where

| Thing | Where |
|---|---|
| Live app | https://upzkvszgoqhoefkiwoep.supabase.co/functions/v1/bids |
| Supabase project | `upzkvszgoqhoefkiwoep` ("farirainandipa's Project"). Also hosts the Africa MICE Dashboard/pipeline data (`events`, `bid_opportunities`, `countries`, `series`, `bid_wins`, policy layer). Do not touch those tables. |
| App source | `public/bids/index.html` — ONE self-contained file (vanilla JS + supabase-js 2.45.4, pdf.js 3.11.174, mammoth 1.6.0 from CDN). No build step. |
| Published copy | `public.site_assets` row `name='bids.html'` — served by edge function `bids`. **Deploy = replace that row.** |
| Edge functions | `supabase/functions/bids/index.ts` (serves page, verify_jwt=false), `supabase/functions/bid-admin/index.ts` (client logins, admins only), `supabase/functions/bid-extract/index.ts` (AI requirement extraction, admins only; needs secret `ANTHROPIC_API_KEY`, optional `ANTHROPIC_MODEL`). All three deployed. |
| Schema | `supabase/migrations/20261109000100_023_bid_workspace.sql` (already applied to the project as `bid_workspace_schema`, `bw_is_admin_server_side`, `bw_event_name_and_list_order`; the file is the consolidated result) and `20261109000200_024_bid_workspace_letter_templates.sql` (applied). Do not re-apply. |
| Storage | private bucket `bid-docs`, paths `<bid_id>/<timestamp>_<file>` |
| Tests | `node tests/bid-workspace/mock-run.cjs admin|client` — Playwright run of every screen with Supabase auth+REST mocked from `test/fixture.json`. CDN libs must be served locally when offline (see the `local` map in the script; `npm i @supabase/supabase-js@2.45.4 pdfjs-dist@3.11.174 mammoth@1.6.0` in `tests/bid-workspace/`, not committed). |
| Operating guide | `D:\Farirai Nandipa MICE\Bid Workspace\README.md` (user-facing; copy into `docs/` if wanted) |
| Website route | `netlify.toml` redirect `/bids` → `/bids/index.html`, so the app is at farirainandipa.co.zw/bids once the `bid-workspace` branch is merged to `main`. The Supabase-served copy stays as a fallback. |

## Data model (all tables prefixed `bw_`, RLS on)

- `bw_orgs` (kind: consultancy|client|bureau|partner, country_id → countries) · `bw_members` (user_id → auth.users, org_id, email, active)
- `bw_bids` (org_id = owning consultancy org, client_org_id, title, **event_name** (used in letters), issuing_body, bid_type congress|destination|rfp_tender|eoi, host_country_id, host_city, venue, event_id → events, opportunity_id → bid_opportunities, stage qualify…close, outcome open|submitted|shortlisted|won|lost|withdrawn|declined, submission_deadline, decision_date, event_dates, bid_director, client_sponsor, summary, win_themes, decision_log, client_visible)
- `bw_scores` (bid_id, kind bid_no_bid|complexity, factors jsonb [{key,label,weight,score,basis}], extra jsonb {adj,fee_quoted,success_fee,hours,disbursements}, notes) — admin only
- `bw_requirements` (seq, clause_ref, requirement, req_type mandatory|scored|administrative|informational, points, response_location, input_from, status missing|requested|drafted|final|not_applicable, due, notes, client_visible)
- `bw_stakeholders` (seq, stakeholder, signatory, template_key C1..C9, ask_level, specific_ask, lead_time_weeks, drafted_on, sent_on, due_back, chase1_on, chase2_on, received_on, status not_sent|sent|overdue|received|declined|substituted, escalation_route, notes, client_visible). Trigger `bw_stakeholder_dates`: on sent_on → chase1 = +10d, chase2 = +17d, due_back = + lead_time weeks, status sent; received_on → received; past due_back → overdue.
- `bw_milestones` (seq, title, days_before_deadline, target_date, owner, status pending|in_progress|done|slipped, note, controls_deadline, client_visible). Trigger on `bw_bids.submission_deadline` change recalculates target dates.
- `bw_documents` (name, kind, storage_path | external_url, version, size_bytes, uploaded_by, note, client_visible)
- `bw_messages` (author_id/email/name, body, visibility client|internal)
- `bw_activity` — written by trigger `bw_log()` on bids/requirements/stakeholders/milestones/documents
- Reference: `bw_letter_templates` (C0 covering email, C1–C9 Doc 07 letters, `[bracket]` merge fields), `bw_milestone_defaults` (24 rows, workbook tab 4), `bw_stakeholder_defaults` (9 rows, Doc 07 Part B)

### Access rules
- Admin = email in `public.allowlist` (currently nandie@farirainandipa.co.zw, admin@farirainandipa.co.zw). `bw_is_admin()` also returns true for direct server-side SQL (no JWT claims) so seeds/migrations can call the RPCs.
- Client = row in `bw_members`. `bw_can_see_bid(bid)`: admin, or bid.client_visible and the bid's client_org_id/org_id is one of the user's orgs. Clients read only `client_visible` rows and `visibility='client'` messages; may insert documents (client_visible forced) and client messages.
- RPCs: `bw_my_role()`, `bw_bid_list()` (list + counters, respects visibility), `bw_generate_milestones(p_bid)`, `bw_seed_stakeholders(p_bid)`, `bw_add_requirements(p_bid, rows jsonb)` — the last three admin-only.
- Storage policies on `bid-docs` use the first path segment as bid id → `bw_can_see_bid`.

## How to change things

- **App change:** edit `public/bids/index.html`, run `node tests/bid-workspace/mock-run.cjs admin` (expects "No JS errors"), merge to `main` (Netlify deploys). Optionally mirror to the Supabase copy: `update public.site_assets set content = $bw$<file>$bw$ where name='bids.html';` (the `bids` function caches 60 s, add `?nocache` to bust).
- **Schema change:** add a new file under `supabase/migrations/` (next number 025), apply via Supabase MCP `apply_migration`, then check security advisors. Never edit applied files.
- **Edge function change:** edit `supabase/functions/<name>/index.ts`, deploy via Supabase MCP `deploy_edge_function` (keep `verify_jwt` false for `bids`, true for the others).
- Config constants (`SUPABASE_URL`, publishable key `sb_publishable_7j49ndRbw7OQ8qLScg6qSw_UweRUpz7`) are at the top of the inline script. Pack reference data (STAGES, BNB_FACTORS, CX_FACTORS, BANDS, ADJUSTMENTS) is also there — change there if the pack is recalibrated.

## Live data
- Orgs: Farirai Nandipa MICE Consultancy (consultancy), Tourism Business Council of Zimbabwe (TBCZ) (client).
- Bids: **AAS8 2027 — Zimbabwe** (AfSAE; stage qualify; 36 requirements pre-loaded from the AAS7 RFP — reconfirm against AAS8 guidelines; 9 stakeholders; deadline unknown, AAS7 RFP dates conflict 31 Mar vs 16 Jan) and **eLearning Africa 2028 — Harare** (submitted 2026-09-28, stage close).
- Source documents on disk: `D:\Farirai Nandipa MICE\Leads\Bids\AAS7_RFP.pdf`, `Leads\AfSAE Letter.docx` (EOI 11 Nov 2026), `Leads\Bids\eLearning Africa 2028\`.
- Pack originals: `D:\Farirai Nandipa MICE\Bid Development Pack\` (Docs 00–10 .docx + `Bid_Control_Workbook.xlsx`). Workbook tabs 5 (event budget) and 6 (economic impact) are NOT in the app yet.

## Backlog (priority order)
1. Merge `bid-workspace` to `main`; add https://www.farirainandipa.co.zw/bids to Supabase Auth → URL configuration (redirect allow-list) so password-reset emails work.
2. Set `ANTHROPIC_API_KEY` secret on the project → AI requirement extraction goes live (fallback rule-based splitter already works).
3. Event budget + economic impact tabs (workbook tabs 5–6) as bid tabs, with sourced assumptions per line.
4. Deadline / chase reminders by email (pg_cron or a scheduled edge function reading `bw_stakeholders` chase dates and `bw_milestones` target dates).
5. Pipeline → bid handoff: a "Start a bid" action on the Africa MICE Dashboard that creates a `bw_bids` row with `event_id` set (the New Bid modal already links events by search).
6. Win-theme worksheet and Doc 09 QA checklist as structured tabs.
7. Tier 4 (bureau product): same tables, different surface — a bureau org with many shallow bids. Nothing in the schema blocks it.

## Conventions
- British English, pack vocabulary (Stage 1 Qualify … Stage 8 Close; "compliance matrix", "support letters", "bid director", "client sponsor").
- White-label: the app shows the consultancy name only in the shell; clients see their own org name.
- Evidence discipline from Doc 00 applies to anything the app generates: quote issuer wording, no invented figures, bracketed placeholders stay visible until filled.
- Never delete `bw_*` rows in bulk; `bw_bids` cascade-deletes its children.

## Known deviation from repo copy style
The app's UI copy uses em dashes (the pack's own house style), which the website convention forbids.
Decide once: either exempt `public/bids/` and `public/pipeline/` from the rule in CLAUDE.md, or sweep the
strings in `public/bids/index.html` (search for " — ") and re-run the mocked test. Not done in this handover
to avoid breaking merge-field strings in the letter generator.
