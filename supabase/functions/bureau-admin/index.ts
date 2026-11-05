// Admin-only management of bureau (client) logins for the pipeline portal.
// v2 (Nov 2026): every bureau login carries a licence tier
// (free / explorer / bureau / bureau_plus); set_tier changes it.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "content-type": "application/json" } });
const TIERS = ["free", "explorer", "bureau", "bureau_plus"];

function tempPassword(): string {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const r = crypto.getRandomValues(new Uint8Array(14));
  return Array.from(r, (x) => a[x % a.length]).join("") + "!7";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const auth = req.headers.get("Authorization") ?? "";
  // 1. caller must be an allowlisted admin
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: acc, error: accErr } = await caller.rpc("my_access");
  if (accErr || acc?.role !== "admin") return json({ error: "Admins only" }, 403);

  const svc = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const { action } = body;

  if (action === "create") {
    const email = String(body.email || "").trim().toLowerCase();
    const country_id = Number(body.country_id);
    const tier = String(body.tier || "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !country_id) return json({ error: "Email and country are required" }, 400);
    if (!TIERS.includes(tier)) return json({ error: "Choose a licence tier" }, 400);
    const { data: al } = await svc.from("allowlist").select("email").ilike("email", email).maybeSingle();
    if (al) return json({ error: "That email is an admin account and cannot be a bureau login" }, 400);
    const pw = tempPassword();
    const { data: u, error } = await svc.auth.admin.createUser({ email, password: pw, email_confirm: true, user_metadata: { role: "bureau" } });
    if (error) return json({ error: error.message }, 400);
    const { error: insErr } = await svc.from("user_access").insert({
      user_id: u.user.id, email, role: "bureau", country_id, tier,
      org_name: body.org_name || null, contact_name: body.contact_name || null, active: true,
    });
    if (insErr) { await svc.auth.admin.deleteUser(u.user.id); return json({ error: insErr.message }, 400); }
    return json({ ok: true, user_id: u.user.id, email, tier, temp_password: pw });
  }

  if (action === "set_tier") {
    const tier = String(body.tier || "");
    if (!TIERS.includes(tier)) return json({ error: "Unknown tier" }, 400);
    const { data: ua } = await svc.from("user_access").select("user_id,role").eq("user_id", body.user_id).maybeSingle();
    if (!ua || ua.role !== "bureau") return json({ error: "Bureau account not found" }, 404);
    const { error } = await svc.from("user_access").update({ tier }).eq("user_id", ua.user_id);
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, tier });
  }

  if (action === "reset_password") {
    const { data: ua } = await svc.from("user_access").select("user_id,email,role").eq("user_id", body.user_id).maybeSingle();
    if (!ua || ua.role !== "bureau") return json({ error: "Bureau account not found" }, 404);
    const pw = tempPassword();
    const { error } = await svc.auth.admin.updateUserById(ua.user_id, { password: pw });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, email: ua.email, temp_password: pw });
  }

  if (action === "set_active") {
    const { data: ua } = await svc.from("user_access").select("user_id,role").eq("user_id", body.user_id).maybeSingle();
    if (!ua || ua.role !== "bureau") return json({ error: "Bureau account not found" }, 404);
    const active = !!body.active;
    await svc.from("user_access").update({ active }).eq("user_id", ua.user_id);
    await svc.auth.admin.updateUserById(ua.user_id, { ban_duration: active ? "none" : "876000h" });
    return json({ ok: true, active });
  }

  return json({ error: "Unknown action" }, 400);
});
