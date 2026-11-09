// Admin-only management of client logins for the Bid Workspace.
// Actions: create (org_id, email) · reset_password (user_id) · set_active (user_id, active)
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "content-type": "application/json" } });

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
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: role, error: roleErr } = await caller.rpc("bw_my_role");
  if (roleErr || role?.role !== "admin") return json({ error: "Admins only" }, 403);

  const svc = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  if (body.action === "create") {
    const email = String(body.email || "").trim().toLowerCase();
    const org_id = String(body.org_id || "");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !org_id) return json({ error: "Email and organisation are required" }, 400);
    const { data: org } = await svc.from("bw_orgs").select("id,name").eq("id", org_id).maybeSingle();
    if (!org) return json({ error: "Organisation not found" }, 404);
    const { data: al } = await svc.from("allowlist").select("email").ilike("email", email).maybeSingle();
    if (al) return json({ error: "That email is an admin account" }, 400);
    // reuse an existing auth user (e.g. a bureau login) if present
    let userId: string | null = null; let pw: string | null = null;
    const { data: existing } = await svc.from("bw_members").select("user_id").eq("email", email).maybeSingle();
    if (existing) userId = existing.user_id;
    if (!userId) {
      pw = tempPassword();
      const { data: u, error } = await svc.auth.admin.createUser({ email, password: pw, email_confirm: true, user_metadata: { role: "bid_client" } });
      if (error) {
        // user may already exist in auth from another product; look them up
        const { data: list } = await svc.auth.admin.listUsers({ perPage: 1000 });
        const found = list?.users?.find((x: any) => x.email?.toLowerCase() === email);
        if (!found) return json({ error: error.message }, 400);
        userId = found.id; pw = tempPassword();
        await svc.auth.admin.updateUserById(userId, { password: pw });
      } else userId = u.user.id;
    }
    const { error: insErr } = await svc.from("bw_members").upsert({ user_id: userId, org_id, email, role: "member", active: true });
    if (insErr) return json({ error: insErr.message }, 400);
    return json({ ok: true, user_id: userId, email, org: org.name, temp_password: pw });
  }

  if (body.action === "reset_password") {
    const { data: m } = await svc.from("bw_members").select("user_id,email").eq("user_id", body.user_id).maybeSingle();
    if (!m) return json({ error: "Client login not found" }, 404);
    const pw = tempPassword();
    const { error } = await svc.auth.admin.updateUserById(m.user_id, { password: pw });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, email: m.email, temp_password: pw });
  }

  if (body.action === "set_active") {
    const { data: m } = await svc.from("bw_members").select("user_id").eq("user_id", body.user_id).maybeSingle();
    if (!m) return json({ error: "Client login not found" }, 404);
    const active = !!body.active;
    await svc.from("bw_members").update({ active }).eq("user_id", m.user_id);
    await svc.auth.admin.updateUserById(m.user_id, { ban_duration: active ? "none" : "876000h" });
    return json({ ok: true, active });
  }

  return json({ error: "Unknown action" }, 400);
});
