# Bid history layer (ICCA Bid Wins): what was built, and how to run it

Built 5 Nov 2026 from `handover-bid-history-layer.md` and the Claude Docs "Bid History Layer: ICCA Bid Wins in the Pipeline" and "Bureau Licence Tiers". Database changes are live on project `upzkvszgoqhoefkiwoep`. The page changes ship with the next Netlify deploy of `main`.

## Pieces

| Piece | Where |
| --- | --- |
| `organisers`, `series`, `bid_wins`, `user_access.tier`, RLS, tier-gated RPCs, teaser RPC, rotation estimate, nightly rules | `supabase/migrations/…008_bid_history_layer.sql` |
| Weekly Pass 1: sync log and pg_cron job `icca_bid_wins_weekly` (Mondays 03:00 UTC) | `…009_icca_weekly_pass1.sql`, edge function `supabase/functions/icca-bid-wins` |
| Backfill: rotation-map history (Africa first), ICCA facts, first Tier 1 check, series names | `…010_bid_history_backfill.sql` |
| Fixes found while testing (estimate window, Explorer delay, teaser rows, post date vs award date, edition notes) | `…011`, `…014`, `…015` |
| Admin recompute RPC | `…012` |
| Free tier refused by `bureau_portal()` | `…013` |
| Tier on bureau logins (`create` needs a tier; new `set_tier`) | edge function `supabase/functions/bureau-admin` (v2, deployed) |
| Admin "Bid History" tab, bureau "Bid history" tab (country history, series profiles, Opening soon, competitors), tier picker on logins and previews | `public/pipeline/index.html` |
| Public teaser, no login | `public/pipeline/history.html`, served at `/pipeline/history` |

## Who sees what (enforced in the database, not the page)

| | Free | Explorer | Bureau | Bureau Plus |
| --- | --- | --- | --- | --- |
| Teaser: last three host countries and years per series | yes | yes | yes | yes |
| Win history in own country, series profiles, badges and last-checked dates | | Verified editions known for 30+ days | all | all |
| Win-factors notes (drafts flagged) | | | yes | yes |
| Estimated next window, Opening soon | | | yes | yes |
| Competitor view | | | | yes |

`bid_wins`, `series` and `organisers` are admin-only under RLS. Subscribers read them only through `bid_history()` (own country, own tier), `bid_history_competitors()` (Bureau Plus) and the anon `bid_wins_teaser()`. Admins preview any country and tier with `bid_history_preview(cid, tier)` from Bureau Access.

## Counts after the backfill (5 Nov 2026)

- ICCA Bid Wins posts on the public feed: 50 in total, Jun 2020 to Jun 2026. One is a test post ("ICCA Skills Benelux"), parked as cancelled. So "five years of Bid Wins" is 49 wins.
- ICCA posts that name a host: 7 (Berlin, Yokohama, India, Xi'an, Da Nang, Bruges, Kampala). The other 42 carry only a title and need Pass 2.
- Editions recorded: 242 (49 ICCA, 192 from the rotation map's researched past hosts, 1 Tier 1 find).
- Hosted in Africa: 171.
- Series with 3+ editions with a known host: 48. Estimated windows: 31 (fixed-venue series and series without a recorded lead time get none).
- Verified: 66. Win-factors notes: 7, all Draft.

## Schema choices that differ from the suggestion

1. **No `authenticated` read policy on `bid_wins`.** The handover suggested "readable by all authenticated users" plus views. Here the tables stay admin-only and every subscriber read goes through security-definer RPCs. That matches `bureau_portal()`, keeps bureau logins away from other countries' rows, and gates fields by tier server side.
2. **Teaser is an RPC, not a view.** A view readable by `anon` over an RLS table is a security-definer view, which the Supabase advisor flags as an error. `bid_wins_teaser()` returns the same shape.
3. **Extra columns on `bid_wins`:** `event_start`/`event_end` (needed to compute lead time), `host_iso2`, `host_region` (for non-African hosts and the competitor view), `africa_hosted` (generated), `source_quote` (at most 14 words, enforced by a check), `source_published_on` (the ICCA post date, kept apart from `awarded_on`), `edition_note`, `icca_post_id`, `sector`, `added_by`.
4. **Extra on `series`:** `fixed_venue`, `last_edition_year`, `sector`, `decision_body`.
5. **`past_events_hosted`** (0 rows) is superseded, not dropped.
6. **Lead time:** where no award date is known, the estimate uses the lead time already researched on the rotation map (`events.lead_time`). The basis text says which was used.
7. **Explorer's 30-day delay** counts from when a fact became public (award, post or edition date), not from the backfill date. Otherwise Explorer would see nothing for a month.
8. **Organisers:** ICCA's hosted-associations pages are not public (no page or API found), so `organisers` holds the 88 rotation-map organisers only. ICCA series have no organiser yet.

## Pass 1 (automatic, weekly)

`icca_bid_wins_weekly` posts to the `icca-bid-wins` edge function. It reads the WordPress REST API on iccaworld.org (`/wp-json/wp/v2/posts?categories=<Bid Wins>`), skips posts already stored, and calls `history_ingest_icca()`. That creates a candidate edition at Tier 2, Unverified, keeps the first 14 words as a quote, and matches the series by name or alias (case-insensitive, years and ordinals stripped) or creates one flagged Unverified. Admins can also press "Run Pass 1 now" on the Bid History tab. Results land in `history_sync_log`.

## Pass 2 and win factors (for the weekly scan in the Claude Project)

Add this to `scan-rules.md` in the Claude Project:

> **Bid history, Pass 2.** Open the Bid History tab and pick "Pass 2 queue". For each ICCA row, newest and Africa-hosted first:
> 1. Find the organiser's own page for that edition (Tier 1). Confirm year, dates, city and host country. Fill the host fields; pick the country from the list for African hosts.
> 2. If the organiser states when the host was chosen, set "Awarded on". Never use the ICCA post date for it.
> 3. Set the source URL to the Tier 1 page, tier 1, then "Save and mark checked today". An ICCA (Tier 2) fact left unconfirmed drops to Stale after 30 days.
> 4. If the organiser lists past congresses, add the earlier editions as new rows so the series reaches three editions. Ask an admin, or add them in SQL with `added_by = 'pass2'`.
> 5. If it is not a bid win (test post, duplicate), set status Cancelled with a note. Pass 1 will not re-import it.
>
> **Win factors.** From the announcement and the organiser page, write one to three sentences on how the bid was won (subvention, local champion, association criteria, venue, connectivity). Quote at most 14 words, in quotation marks, and keep the source link. Never paste article text. Leave status Draft; a team member sets Reviewed after checking it against the source. Leave it empty if the source says nothing useful; most ICCA posts say little.
>
> **Series names.** Rename ICCA-created series to the association's own name for the congress, and add the ICCA title as an alias, so next week's post matches.

## Still to do

1. **Remove the legacy bureau logins.** See below. Then validate the tier constraint.
2. **Pass 2 for the 42 ICCA wins with no host.** Run it through the weekly scan (rules above).
3. **Review the 7 Draft win-factors notes** on the Bid History tab.
4. **Explorer pipeline rules** ("Verified editions only, 30-day delay") are applied to the bid history, not yet to the rest of the bureau portal (`portal_data()`). That is a separate change.
5. **Organisers for ICCA series**, once a public source for the hosted-associations lists turns up.

## Removing the legacy bureau logins

On 5 Nov 2026 `user_access` held two bureau rows, both already disabled, neither on the allowlist:

| Email | Organisation | Country | Last seen |
| --- | --- | --- | --- |
| cafe@farirainandipa.co.zw | Zambia Tourism Agency | Zambia | 20 Oct 2026 |
| qa-bureau-test@example.invalid | QA test (Zambia), disabled | Zambia | never |

Deleting the auth accounts is permanent, so run it yourself in the Supabase SQL editor once you have confirmed the list:

```sql
begin;
delete from auth.users where id in (select user_id from public.user_access where role = 'bureau' and tier is null);
delete from public.user_access where role = 'bureau' and tier is null;
alter table public.user_access validate constraint user_access_bureau_tier_chk;
commit;
```

Admin rows and the `allowlist` are not touched. Re-create anyone who should keep access from Bureau Access, choosing a tier.
