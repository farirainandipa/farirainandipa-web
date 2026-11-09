// Supabase Edge Function: send-submission-verification
//
// Emails destination partner submitters (public form at /pipeline/partner):
//   kind "verify"          the magic link that places a submission in the
//                          review queue (default when kind is missing; sent
//                          by profile_submit())
//   kind "confirmed"       the submission is in the queue, with the private
//                          status link (sent by profile_verify()); the admin
//                          inbox gets a short notice at the same time
//   kind "confirm_request" a reviewer needs the submitter to confirm one data
//                          point (sent by the trigger on confirm_requested)
//
// Called from the database over pg_net. Protected by the shared secret in
// the x-webhook-secret header, checked against WEBHOOK_SECRET (the Vault
// secret submission_webhook_secret holds the same value), so verify_jwt is
// off. With dry_run true the composed email is returned, nothing is sent.
//
// Secrets (Project Settings -> Edge Functions): WEBHOOK_SECRET, SMTP_HOSTNAME,
// SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, NOTIFY_FROM, NOTIFY_TO.

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const SITE = "https://africamicedashboard.netlify.app/pipeline/partner";
const DASHBOARD = "https://africamicedashboard.netlify.app/pipeline/";
const SIGNATURE = "Farirai Nandipa MICE Agency\nAfrica MICE Bid Pipeline";

interface Payload {
  kind?: string;
  submission_id?: number;
  email?: string;
  name?: string;
  organisation?: string;
  country?: string;
  token?: string;
  status_key?: string;
  label?: string;
  note?: string;
  field_count?: number;
  dry_run?: boolean;
}

interface Mail { to: string; subject: string; text: string; replyTo?: string }

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function html(text: string): string {
  const paras = text.split("\n\n").map((p) => {
    const safe = esc(p).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" style="color:#46666a">$1</a>').replace(/\n/g, "<br>");
    return `<p style="margin:0 0 14px">${safe}</p>`;
  });
  return `<div style="font-family:Arial,sans-serif;color:#1f2222;font-size:15px;line-height:1.5;max-width:600px">${paras.join("")}</div>`;
}

function compose(p: Payload, adminTo: string): { mails: Mail[]; kind: string } {
  const kind = p.kind || "verify";
  const name = p.name?.trim() || "there";
  const country = p.country?.trim() || "the destination";
  const mails: Mail[] = [];
  if (kind === "verify") {
    if (!p.token) throw new Error("verify needs a token");
    const link = `${SITE}?token=${encodeURIComponent(p.token)}`;
    mails.push({
      to: p.email!,
      subject: "Confirm your destination data submission",
      replyTo: adminTo,
      text: [
        `Hello ${name},`,
        `Thank you for submitting data about ${country} to the Africa MICE Bid Pipeline.`,
        `Please confirm your email address within 48 hours so the submission can enter our review queue:\n${link}`,
        `If you did not make this submission, you can ignore this email and nothing will be stored against your name.`,
        SIGNATURE,
      ].join("\n\n"),
    });
  } else if (kind === "confirmed") {
    const link = `${SITE}?status=${encodeURIComponent(p.status_key || "")}`;
    const n = p.field_count ?? 0;
    mails.push({
      to: p.email!,
      subject: "Your submission is in the review queue",
      replyTo: adminTo,
      text: [
        `Hello ${name},`,
        `Your ${n === 1 ? "data point" : `${n} data points`} for ${country} ${n === 1 ? "is" : "are"} now with our review team.`,
        `We check every value against a primary source before it reaches the destination profile, and we may email you to confirm a detail. You can follow progress here (the link is private to you):\n${link}`,
        SIGNATURE,
      ].join("\n\n"),
    });
    mails.push({
      to: adminTo,
      subject: `Partner submission ready for review: ${country}${p.organisation ? ` (${p.organisation})` : ""}`,
      replyTo: p.email,
      text: [
        `${name}${p.organisation ? `, ${p.organisation}` : ""} has confirmed a submission of ${n} data point${n === 1 ? "" : "s"} for ${country}.`,
        `Review it on the Partner Data tab:\n${DASHBOARD}`,
      ].join("\n\n"),
    });
  } else if (kind === "confirm_request") {
    const link = `${SITE}?status=${encodeURIComponent(p.status_key || "")}`;
    mails.push({
      to: p.email!,
      subject: `A question about your ${country} submission`,
      replyTo: adminTo,
      text: [
        `Hello ${name},`,
        `Before we publish one of your data points for ${country}, our reviewer needs you to confirm it.`,
        `Data point: ${p.label || "(not named)"}${p.note ? `\nQuestion: ${p.note}` : ""}`,
        `Reply to this email with the confirmation, or a corrected value and its source. Your status page:\n${link}`,
        SIGNATURE,
      ].join("\n\n"),
    });
  } else {
    throw new Error(`unknown kind ${kind}`);
  }
  return { mails, kind };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const expectedSecret = Deno.env.get("WEBHOOK_SECRET");
  const providedSecret = req.headers.get("x-webhook-secret");
  if (!expectedSecret || providedSecret !== expectedSecret) return new Response("Unauthorized", { status: 401 });

  let p: Payload;
  try { p = await req.json(); } catch { return new Response("Invalid JSON body", { status: 400 }); }
  if (!p?.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email)) return new Response("No recipient", { status: 400 });

  const adminTo = Deno.env.get("NOTIFY_TO") ?? "admin@farirainandipa.co.zw";
  let composed;
  try { composed = compose(p, adminTo); } catch (err) { return new Response(String(err), { status: 400 }); }

  if (p.dry_run) {
    return new Response(JSON.stringify({ ok: true, dry_run: true, kind: composed.kind, mails: composed.mails }), { headers: { "Content-Type": "application/json" } });
  }

  const hostname = Deno.env.get("SMTP_HOSTNAME") ?? "smtp.gmail.com";
  const port = Number(Deno.env.get("SMTP_PORT") ?? "465");
  const username = Deno.env.get("SMTP_USERNAME");
  const password = Deno.env.get("SMTP_PASSWORD");
  const from = Deno.env.get("NOTIFY_FROM") ?? username ?? "admin@farirainandipa.co.zw";
  if (!username || !password) {
    console.error("SMTP credentials are not configured");
    return new Response("SMTP not configured", { status: 500 });
  }

  const client = new SMTPClient({ connection: { hostname, port, tls: true, auth: { username, password } } });
  try {
    for (const m of composed.mails) {
      await client.send({ from, to: m.to, replyTo: m.replyTo, subject: m.subject, content: m.text, html: html(m.text) });
    }
    await client.close();
  } catch (err) {
    console.error(`Failed to send ${composed.kind} email for submission ${p.submission_id}:`, err);
    try { await client.close(); } catch (_) { /* ignore */ }
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify({ ok: true, kind: composed.kind, sent: composed.mails.length }), { headers: { "Content-Type": "application/json" } });
});
