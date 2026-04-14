// functions/api/volunteers/message.js
// POST — send bulk SMS/email to volunteers (admin only)

import { sendSMS, sendEmail } from '../_notify.js';
import { requireAdmin } from '../_admin_auth.js';

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return r;
}
export async function onRequestOptions() { return cors(new Response(null, { status: 204 })); }

export async function onRequestPost(context) {
  const { env, request } = context;
  const denied = await requireAdmin(env, request);
  if (denied) return cors(denied);

  const body = await request.json();
  const { channel = 'both', to = 'all', message, subject, ids } = body;
  if (!message) return cors(Response.json({ error: 'Message required' }, { status: 400 }));

  // Fetch recipients
  let q = 'SELECT * FROM volunteers WHERE 1=1';
  const p = [];
  if (to === 'confirmed') { q += " AND status = 'confirmed'"; }
  else if (to === 'assigned') { q += " AND status IN ('confirmed','assigned')"; }
  else if (to === 'ids' && ids?.length) { q += ` AND id IN (${ids.map(()=>'?').join(',')})`;  p.push(...ids); }

  const { results } = await env.DB.prepare(q).bind(...p).all();
  const msgId = Date.now().toString(36);
  let smsSent = 0, emailSent = 0, smsErrors = [], emailErrors = [];

  for (const v of results) {
    const name = `${v.first_name} ${v.last_name}`;
    if ((channel === 'sms' || channel === 'both') && v.phone && v.sms_opt_in) {
      const res = await sendSMS(env, v.phone, message);
      if (res?.ok) smsSent++; else if (res) smsErrors.push(`${name}: ${res.error}`);
    }
    if ((channel === 'email' || channel === 'both') && v.email) {
      const res = await sendEmail(env, {
        to: v.email,
        replyTo: env.ADMIN_EMAIL,
        subject: subject || 'Child Spree 2026 — Volunteer Update',
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <div style="background:#1B3A4B;padding:16px 20px;border-radius:8px 8px 0 0;"><h3 style="color:#fff;margin:0;font-size:16px;">Child Spree 2026 · Volunteer Update</h3></div>
          <div style="background:#f9f9f9;padding:24px;border:1px solid #e5e5e5;border-top:none;border-radius:0 0 8px 8px;">
            <p style="color:#333;font-size:15px;">Hi ${v.first_name},</p>
            <p style="color:#555;font-size:14px;line-height:1.7;">${message.replace(/\n/g,'<br/>')}</p>
            <hr style="border:none;border-top:1px solid #e5e5e5;margin:20px 0;"/>
            <p style="color:#999;font-size:11px;">Davis Education Foundation · Child Spree 2026 · daviskids.org<br/>To unsubscribe from volunteer updates, reply to this email.</p>
          </div>
        </div>`,
      });
      if (res?.ok) emailSent++; else if (res) emailErrors.push(`${name}: ${res.error}`);
    }
  }

  // Log the send
  await env.DB.prepare('INSERT INTO volunteer_messages (id, channel, recipient_count, subject, body) VALUES (?, ?, ?, ?, ?)')
    .bind(msgId, channel, results.length, subject||null, message).run();

  return cors(Response.json({ smsSent, emailSent, total: results.length, smsErrors: smsErrors.slice(0,5), emailErrors: emailErrors.slice(0,5) }));
}
