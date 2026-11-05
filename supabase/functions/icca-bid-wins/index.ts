// Pass 1 for the bid history layer: read the public ICCA Bid Wins feed
// (WordPress REST API on iccaworld.org), and hand every post not yet stored to
// public.history_ingest_icca(), which creates candidate bid_wins rows at
// Tier 2 / Unverified and matches or creates the series.
//
// Called weekly by pg_cron (job icca_bid_wins_weekly) and on demand by an admin
// from the pipeline's Bid History tab. Idempotent: posts already stored are
// skipped. Non-admin calls are limited to one run per 6 hours.
//
// Only the title, date, link and the first 14 words of each post leave this
// function; ICCA article text is never stored in full.
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "content-type": "application/json" } });

const WP = "https://www.iccaworld.org/wp-json/wp/v2";
const UA = "FNMICE-Pipeline/1.0 (bid history scan)";

const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", ndash: "-", mdash: "-", rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', hellip: "..." };
function decode(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m)
    .replace(/[–—]/g, "-");
}
const strip = (h: string) => decode((h || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const firstWords = (s: string, n = 14) => s.split(/\s+/).filter(Boolean).slice(0, n).join(" ");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const svc = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  // Admins may run it any time; anyone else (the cron job uses the anon key)
  // at most once every 6 hours.
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: acc } = await caller.rpc("my_access");
  const isAdmin = acc?.role === "admin";
  if (!isAdmin) {
    const { data: last } = await svc.from("history_sync_log").select("ran_at").eq("source", "icca_bid_wins")
      .order("ran_at", { ascending: false }).limit(1).maybeSingle();
    if (last && Date.now() - new Date(last.ran_at).getTime() < 6 * 3600e3) return json({ ok: true, skipped: "ran recently" });
  }

  try {
    const cat = await fetch(`${WP}/categories?slug=bid-wins&_fields=id,count`, { headers: { "User-Agent": UA } }).then((r) => r.json());
    const catId = cat?.[0]?.id ?? 154;
    const posts: unknown[] = [];
    for (let page = 1; page <= 20; page++) {
      const r = await fetch(`${WP}/posts?categories=${catId}&per_page=100&page=${page}&orderby=date&order=desc&_fields=id,date,link,title,content,excerpt`,
        { headers: { "User-Agent": UA } });
      if (!r.ok) break;
      const batch = await r.json();
      for (const p of batch) {
        const text = strip(p.content?.rendered || "") || strip(p.excerpt?.rendered || "");
        posts.push({ id: p.id, date: String(p.date).slice(0, 10), link: p.link, title: strip(p.title?.rendered || ""), text: firstWords(text) });
      }
      const pages = Number(r.headers.get("X-WP-TotalPages") || "1");
      if (page >= pages) break;
    }
    const { data, error } = await svc.rpc("history_ingest_icca", { posts });
    const result = error ? { error: error.message } : { ...data, fetched: posts.length };
    await svc.from("history_sync_log").insert({ source: "icca_bid_wins", result, by_admin: isAdmin });
    return json(error ? { error: error.message } : { ok: true, ...result }, error ? 500 : 200);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await svc.from("history_sync_log").insert({ source: "icca_bid_wins", result: { error: msg }, by_admin: isAdmin });
    return json({ error: msg }, 502);
  }
});
