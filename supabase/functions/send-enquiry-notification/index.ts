// Supabase Edge Function: send-enquiry-notification
//
// Triggered by a database webhook (see the migration that creates the
// `contact_submissions_notify` trigger) whenever a new row is inserted into
// `contact_submissions`. It emails the enquiry to the admin inbox over SMTP.
//
// This function is deployed with `verify_jwt = false` because the database
// webhook does not send a Supabase JWT. Instead it is protected by a shared
// secret sent in the `x-webhook-secret` header, checked against the
// WEBHOOK_SECRET env var.
//
// Required secrets (set in Supabase: Project Settings -> Edge Functions):
//   WEBHOOK_SECRET  - shared secret, must match the value stored in Vault
//   SMTP_HOSTNAME   - e.g. smtp.gmail.com
//   SMTP_PORT       - e.g. 465
//   SMTP_USERNAME   - the Google Workspace mailbox, e.g. admin@farirainandipa.co.zw
//   SMTP_PASSWORD   - a Google App Password for that mailbox (NOT the login password)
//   NOTIFY_TO       - recipient, e.g. admin@farirainandipa.co.zw
//   NOTIFY_FROM     - sender, e.g. admin@farirainandipa.co.zw

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const SERVICE_LABELS: Record<string, string> = {
  conferences: "Conferences & Meetings Management",
  strategic: "Strategic & Specialised Consulting",
  exhibitions: "Exhibition Management",
  travel: "Travel Management",
  "packages-conferences": "Conference Packages",
  "packages-incentive": "Incentive Travel Packages",
  "packages-exhibition-tours": "Exhibition Tour Packages",
  compliance: "Compliance Management",
  training: "Training",
  other: "Other",
};

interface Submission {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  message?: string;
  submission_type?: string;
  created_at?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const expectedSecret = Deno.env.get("WEBHOOK_SECRET");
  const providedSecret = req.headers.get("x-webhook-secret");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  let record: Submission | undefined;
  try {
    const payload = await req.json();
    record = payload?.record ?? payload;
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!record || !record.email) {
    return new Response("No submission record in payload", { status: 400 });
  }

  const hostname = Deno.env.get("SMTP_HOSTNAME") ?? "smtp.gmail.com";
  const port = Number(Deno.env.get("SMTP_PORT") ?? "465");
  const username = Deno.env.get("SMTP_USERNAME");
  const password = Deno.env.get("SMTP_PASSWORD");
  const to = Deno.env.get("NOTIFY_TO") ?? "admin@farirainandipa.co.zw";
  const from = Deno.env.get("NOTIFY_FROM") ?? username ?? "admin@farirainandipa.co.zw";

  if (!username || !password) {
    console.error("SMTP credentials are not configured");
    return new Response("SMTP not configured", { status: 500 });
  }

  const serviceLabel = record.service
    ? (SERVICE_LABELS[record.service] ?? record.service)
    : "Not specified";
  const kind = record.submission_type === "consultation" ? "Consultation request" : "Enquiry";
  const subject = `New ${kind}: ${record.name ?? "Website visitor"} (${serviceLabel})`;

  const lines = [
    `${kind} received via the website contact form.`,
    "",
    `Name:    ${record.name ?? "-"}`,
    `Email:   ${record.email}`,
    `Phone:   ${record.phone ?? "-"}`,
    `Service: ${serviceLabel}`,
    "",
    "Message:",
    record.message ?? "-",
    "",
    record.created_at ? `Submitted: ${record.created_at}` : "",
  ];
  const text = lines.join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #3A3A3A; max-width: 600px;">
      <h2 style="color: #21436A; margin-bottom: 4px;">New ${escapeHtml(kind)}</h2>
      <p style="color: #6b7280; margin-top: 0;">Received via the website contact form.</p>
      <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
        <tr><td style="padding: 6px 12px; font-weight: bold; width: 120px;">Name</td><td style="padding: 6px 12px;">${escapeHtml(record.name ?? "-")}</td></tr>
        <tr><td style="padding: 6px 12px; font-weight: bold;">Email</td><td style="padding: 6px 12px;"><a href="mailto:${escapeHtml(record.email)}">${escapeHtml(record.email)}</a></td></tr>
        <tr><td style="padding: 6px 12px; font-weight: bold;">Phone</td><td style="padding: 6px 12px;">${escapeHtml(record.phone ?? "-")}</td></tr>
        <tr><td style="padding: 6px 12px; font-weight: bold;">Service</td><td style="padding: 6px 12px;">${escapeHtml(serviceLabel)}</td></tr>
      </table>
      <div style="margin-top: 16px;">
        <div style="font-weight: bold; margin-bottom: 4px;">Message</div>
        <div style="white-space: pre-wrap; background: #F9FAFB; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px;">${escapeHtml(record.message ?? "-")}</div>
      </div>
      ${record.created_at ? `<p style="color: #6b7280; margin-top: 16px; font-size: 12px;">Submitted: ${escapeHtml(record.created_at)}</p>` : ""}
    </div>
  `;

  const client = new SMTPClient({
    connection: {
      hostname,
      port,
      tls: true,
      auth: { username, password },
    },
  });

  try {
    await client.send({
      from,
      to,
      replyTo: record.email,
      subject,
      content: text,
      html,
    });
    await client.close();
  } catch (err) {
    console.error("Failed to send enquiry email:", err);
    try {
      await client.close();
    } catch (_) {
      // ignore close errors
    }
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ ok: true }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
