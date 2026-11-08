// Serves the Bid Workspace single-page app from site_assets.bids.html.
// Update the app by replacing that row — no redeploy needed.
import { createClient } from "npm:@supabase/supabase-js@2";

let cache: { html: string; at: number } | null = null;
const TTL = 60_000;

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  if (url.searchParams.has("nocache")) cache = null;
  if (!cache || Date.now() - cache.at > TTL) {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await sb.from("site_assets").select("content").eq("name", "bids.html").single();
    if (error || !data) return new Response("Bid Workspace is not published yet.", { status: 404 });
    cache = { html: data.content, at: Date.now() };
  }
  return new Response(cache.html, {
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache", "x-frame-options": "SAMEORIGIN" },
  });
});
