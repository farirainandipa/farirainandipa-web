// Requirement extraction for the compliance matrix.
// If ANTHROPIC_API_KEY is set as a function secret, the RFP text is parsed by Claude into
// requirement rows in the issuer's own wording. Otherwise returns { ai:false } and the
// browser falls back to its rule-based splitter. Admins only.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "content-type": "application/json" } });

const SYSTEM_BID = `You open bid files for a MICE bid consultancy from an RFP, call for bids, host requirements document or expression of interest.
Return ONLY a JSON object with three keys:
"bid": { "title" (short working title: event name, year, host country), "event_name" (the event as it would appear in a support letter), "issuing_body", "bid_type" (one of congress | destination | rfp_tender | eoi), "host_city", "host_country" (English country name or null), "submission_deadline" (YYYY-MM-DD or null), "deadline_note" (null, or a short warning if the document gives conflicting dates), "event_dates" (free text), "summary" (3-5 sentences: what is being bid for, who issues it, what the host must provide, how it is evaluated) }
"requirements": array of { clause_ref, requirement (issuer's own wording), req_type (mandatory | scored | administrative | informational), response_location, input_from, points, notes } covering EVERY requirement a bidder must address
"stakeholders": array of { stakeholder, signatory, template_key (C1 ministry, C2 convention bureau, C3 city, C4 association, C5 venue, C6 hotels, C7 airline, C8 academic, C9 sponsor, or null), ask_level (endorsement | facilitation | commitment | guarantee), lead_time_weeks (number), specific_ask } for every third party whose letter, hold, rate or commitment the document requires or implies.
No prose outside the JSON. Use null where the document is silent; never invent dates or figures.`;

const SYSTEM = `You build compliance matrices for competitive bids (association congress bids, destination bids, RFP/tender responses, EOIs).
From the requirement document text, extract EVERY requirement a bidder must address, quoted in the issuer's own wording (do not paraphrase), with its clause reference where one exists.
Classify each as: "mandatory" (must/shall/required, written confirmations, itemised budgets, eligibility), "scored" (evaluated content, descriptions, plans, strategies), "administrative" (page limits, format, forms, signatures, submission channel, deadlines), or "informational" (evaluation criteria, context, timelines that are not themselves a deliverable).
Set response_location to the proposal section the issuer expects it in, if stated. Set input_from to who must supply it (e.g. "Venue", "Ministry", "Convention bureau", "Hotels", "Airline", "Consultant"). Include a points value only if the document states one.
Return ONLY a JSON array of objects with keys: clause_ref, requirement, req_type, response_location, input_from, points, notes. No prose.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const caller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } });
  const { data: role, error: roleErr } = await caller.rpc("bw_my_role");
  if (roleErr || role?.role !== "admin") return json({ error: "Admins only" }, 403);

  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ ai: false, reason: "ANTHROPIC_API_KEY not configured" });

  let body: any; try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const text = String(body.text || "").slice(0, 120_000);
  if (text.length < 40) return json({ error: "No text" }, 400);
  const mode = body.mode === "bid" ? "bid" : "requirements";

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-5-5",
      max_tokens: mode === "bid" ? 12000 : 8000,
      system: mode === "bid" ? SYSTEM_BID : SYSTEM,
      messages: [{ role: "user", content: `${mode === "bid" ? "Bid document" : "Requirement document"}:\n\n${text}` }],
    }),
  });
  if (!r.ok) return json({ ai: false, reason: `Anthropic API ${r.status}: ${(await r.text()).slice(0, 300)}` });
  const out = await r.json();
  const raw = (out.content || []).map((c: any) => c.text || "").join("");
  const REQ_TYPES = ["mandatory", "scored", "administrative", "informational"];
  const cleanRows = (arr: any[]) => (arr || []).filter((x: any) => x && x.requirement).map((x: any) => ({
    clause_ref: x.clause_ref ?? null, requirement: String(x.requirement), req_type: REQ_TYPES.includes(x.req_type) ? x.req_type : "mandatory",
    response_location: x.response_location ?? null, input_from: x.input_from ?? null, points: typeof x.points === "number" ? x.points : null, notes: x.notes ?? null,
  }));
  if (mode === "bid") {
    const mo = raw.match(/\{[\s\S]*\}/);
    if (!mo) return json({ ai: false, reason: "No JSON in model output" });
    try {
      const o = JSON.parse(mo[0]);
      const b = o.bid || {};
      if (b.submission_deadline && !/^\d{4}-\d{2}-\d{2}$/.test(String(b.submission_deadline))) b.submission_deadline = null;
      return json({ ai: true, bid: b, requirements: cleanRows(o.requirements), stakeholders: (o.stakeholders || []).filter((x: any) => x && x.stakeholder) });
    } catch (_e) { return json({ ai: false, reason: "Could not parse model output" }); }
  }
  const m = raw.match(/\[[\s\S]*\]/);
  if (!m) return json({ ai: false, reason: "No JSON in model output" });
  try {
    const rows = JSON.parse(m[0]).filter((x: any) => x && x.requirement).map((x: any) => ({
      clause_ref: x.clause_ref ?? null, requirement: String(x.requirement), req_type: ["mandatory", "scored", "administrative", "informational"].includes(x.req_type) ? x.req_type : "mandatory",
      response_location: x.response_location ?? null, input_from: x.input_from ?? null, points: typeof x.points === "number" ? x.points : null, notes: x.notes ?? null,
    }));
    return json({ ai: true, rows });
  } catch (e) { return json({ ai: false, reason: "Could not parse model output" }); }
});
