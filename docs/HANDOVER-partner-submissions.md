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
