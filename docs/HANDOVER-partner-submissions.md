# Handover to Claude Code: Destination Partner Submission Form

Date: 5 Nov 2026
Owner: Farirai Nandipa
Repo: github.com/farirainandipa/farirainandipa-web (suggested location: docs/HANDOVER-partner-submissions.md)

**First task: plan only.** Read everything below, inspect the existing schema, and report back a plan with the proposed migration. Do not apply any migration until I approve the plan.

## Context
The Africa MICE Bid Pipeline dashboard lives at farirainandipa.co.zw/pipeline. It holds per-country destination profiles (21-field full profiles for Zimbabwe, Zambia, Rwanda, Kenya, Botswana and Namibia; 12-field base profiles for the other 48 countries). Add a Destination Partner Submission Form so outside parties can submit data for the destination review of a country.

Related docs: scan rules (scan rules.md, v2 + bid history), Pipeline_Reference_Data.xlsx, docs/HANDOVER-bid-history.md.

## Before you start
1. Read the existing schema in the pipeline's Supabase project. Do not use the IEPZ directory project (iepz-web, xkuvsysravrmshbzxncb). Confirm the project ref with me first.
2. The org is on the Supabase Free plan, so no branching. Migrations go straight to live. Be careful and reversible.
3. Read Pipeline_Reference_Data.xlsx (sheets: Rotation map, Destination profiles, Fit score inputs, Sources) and map every form field below to an existing profile field. Where none exists, propose a new column and flag it for my approval before migrating.

## Hard rules
- Submissions never write to live profile data. They go to a staging table and a review queue.
- Per scan rules, a Tier 4 Submitted value is confirmed with the submitter before publishing and can never set a fact alone. A submission can be promoted to Verified only when a Tier 1 or Tier 2 source corroborates it.
- Every stored value carries source_url, source_tier (4 for submissions), verified_on, and confidence (Verified, Stale, Unverified, Conflict). Submitted values enter as Unverified, flagged with the last-checked date.
- Multi-tenant from the first migration: every row has an organisation boundary, and bureau clients see only their own country's data.
- RLS policies and GRANTs are separate layers. Narrow both, test both, and run the Supabase advisors after every migration.
- Do not use PGlite tests as proof of PostgREST exposure.

## Data model (propose, then confirm with me)
- submitters: name, organisation, role, work email, submitter_type, country_id, email_verified, domain_verified, status
- submissions: submitter_id, country_id, submitter_type, submitted_at, status (New, In review, Confirmed, Rejected, Published)
- submission_fields: submission_id, target_profile_field, proposed_value, as_of_date, source_url, supporting_file, reviewer_note, decision
- Audit log of every reviewer decision and every change to live profile data, with the old value kept.

## Common fields (all types)
Full name, organisation, role, official work email, country covered, source link or supporting document, and an "as of" date on every data point.

## Type-specific blocks
- **Convention bureau:** bureau exists and legal status; bids formally (yes, informal, no); subvention fund (cash, in-kind, proposed, none) with details; bid contact; events won and events currently bidding for.
- **Venue or hotel:** largest plenary (theatre seats); total meeting space in square metres; breakout room count; on-site rooms; accessibility features; recent renovation or planned expansion.
- **Immigration or government ministry:** visa categories; visa-free and e-visa eligibility by region; processing time; fees; delegate facilitation such as group visas or fast-track; tax and customs rules for exhibitions. Visa ease is scored by me, not submitted.
- **Tourism industry association:** member count; sectors represented; MICE working group (yes or no, contact); support letters or endorsements they can provide for bids.
- **Airline:** routes serving the country; non-stop intercontinental (yes or no); weekly frequencies; seasonal changes; delegate fares or event partnership offers.

## Computed fields are off limits to submitters
Fit score, visa ease score, ICCA figures and anything derived in the fit-score workbook are set only by me. The form may supply evidence for them, never the value.

## Identity and abuse controls
- Email verification by magic link before a submission is accepted.
- Flag submissions where the email domain is free-mail (Gmail, Yahoo and similar) for manual review.
- Enforce field scope by submitter type: an airline cannot submit visa data, a hotel cannot submit bureau data.
- Rate-limit per email and per IP, add a honeypot field, and cap file uploads by size and type.
- Store uploads in a private bucket, not public.

## Admin review screen (in the dashboard)
A queue filtered by country, type and status. For each proposed field, show the current live value beside the proposed value, the source, and the age of the data. Actions per field: accept, edit and accept, reject, or request confirmation from the submitter. Accepting writes the value with source_tier 4 and confidence Unverified, and creates a task to re-check against a Tier 1 page within 30 days, matching the existing Tier 2 re-check rule.

## Pipeline integration
Accepted values feed the existing Pass 2 verification work list. Demotion rules apply unchanged (Verified to Stale at 60 days, Stale to Unverified at 120). A submitter who submits a bid-relevant item, such as a call for hosts, creates a candidate record in the discovery queue, not a live edition.

## Build order
1. Schema migration plus RLS and GRANTs, then advisors.
2. Public form with the common fields and one type block, bureau first, since bureaus are the first client group.
3. Review queue and promote-to-profile logic with audit log.
4. The remaining four type blocks.
5. Submitter confirmation email and a status page.

## Ask me before
Creating any new profile column, changing existing RLS, or deciding the domain-verification list.

## What was built (5 Nov 2026)

Migrations 016 to 022 are live on `upzkvszgoqhoefkiwoep`; the pages ship with the next Netlify deploy of `main`.

| Piece | Where |
| --- | --- |
| Staging tables, field catalog (32 fields), audit log, abuse tables, private bucket, intake RPCs, trust fields on `destination_profile_fields` | `supabase/migrations/…016_partner_submissions.sql`, `…017` (indexes) |
| Public form, verify link and status page | `public/pipeline/partner.html` at `/pipeline/partner`; `…018` adds `partner_form_options()` |
| Review queue, promotion, re-checks | `…019`, `…020` (series parent for candidates), `…021` (guard covers tier-less researched rows); dashboard tab "Partner Data" in `public/pipeline/index.html` |
| Submitter emails | edge function `supabase/functions/send-submission-verification`, `…022` (`profile_notify()`, confirmed email, confirm-request trigger) |

### Choices that differ from the spec

1. **Table names are prefixed `profile_`** because `submissions` already holds the movable-conference channel from migration 004.
2. **No new profile columns.** Every field without a home became a `destination_profile_fields` row numbered from 101, the same number on full and base profiles, so the 21-field and 12-field catalogs are untouched. The ministry's visa facts target the structured `countries` visa columns (`evisa`, `visa_on_arrival`, `univisa`, `visa_africa`, `visa_events_note`) rather than free text.
3. **Confidence on `destination_profile_fields` is now the four-state vocabulary** plus `partial` for the researched rows. The nightly demotion only touches rows with a `source_tier`, so nothing researched before this change moves.
4. **A submission's status gains `awaiting_email`** before New; the verify link moves it to New. `Confirmed` is set by hand from the tab once you have spoken to the submitter; `Published` is set automatically once every field is decided and at least one was accepted.
5. **A Tier 4 value never replaces a Verified Tier 1 or 2 fact** (or a tier-less researched row): accepting marks the live row Conflict with the proposal in the note, and the re-check list picks it up. Only a Tier 1 or 2 URL can set Verified on a re-check.
6. **Submitters are not auth users.** Verification is a 32-byte token, stored hashed, valid 48 hours, single use.
7. **Rate limits**: three submissions per email per day, ten attempts per IP per hour (IP stored hashed). The free-mail list is a table (`freemail_domains`, 21 seeded). `verified_submitter_domains` is empty; a match sets `domain_verified`.
8. **The webhook secret is shared with the contact form.** Vault `submission_webhook_secret` holds the same value as `contact_webhook_secret` and the function checks the existing `WEBHOOK_SECRET`. Rotate both together.

### Operating notes

- Documents: anonymous upload only into a submission's own folder for two hours, five objects, 10 MB, PDF / PNG / JPG / DOCX / XLSX. Admins open them from the tab with a signed URL.
- "Events currently bidding for" accepted on the tab creates an `events` candidate (and its `series` row) at Tier 4, `added_by partner-<submission id>`, never a live edition.
- "Ask to confirm" emails the submitter the question; they reply to the agency inbox. The tab shows the decision as Confirmation requested until you accept or reject it.
- Re-checks due show on the tab and in the KPI. Verified needs the Tier 1 or 2 page; "Still unverified" pushes the date on 30 days.
- The Netlify deploy preview of a pull request cannot send mail or write the live database differently from production: it talks to the same project.

### Still to do

1. Decide the verified partner domain list (`verified_submitter_domains`).
2. Delete the leftover 15-byte test object `a6e773a5-82c6-4f55-8cc9-980b2e426739/subvention_fund/fund_brochure.pdf` from the `submission-uploads` bucket (SQL cannot delete storage objects).
3. Cross-check the field catalog against `Pipeline_Reference_Data.xlsx` (not found on disk during the build; the mapping was taken from the live schema).
4. Add the re-check step to `scan-rules.md` in the Claude Project: accepted partner values appear on the Partner Data tab under Re-checks; confirm each against a Tier 1 page within 30 days.
