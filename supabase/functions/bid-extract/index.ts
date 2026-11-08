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

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-5-5",
      max_tokens: 8000,
      system: SYSTEM,
      messages: [{ role: "user", content: `Requirement document:\n\n${text}` }],
    }),
  });
  if (!r.ok) return json({ ai: false, reason: `Anthropic API ${r.status}: ${(await r.text()).slice(0, 300)}` });
  const out = await r.json();
  const raw = (out.content || []).map((c: any) => c.text || "").join("");
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
