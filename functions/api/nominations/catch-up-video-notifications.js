// POST /api/nominations/catch-up-video-notifications
// One-time: send video-needed notifications to all FAs whose kids have intake but no video

import { sendEmail, sendSMS } from '../_notify.js';

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return r;
}
export async function onRequestOptions() { return cors(new Response(null, { status: 204 })); }

export async function onRequestPost(context) {
  const { env } = context;

  // Find all nominations with intake done but no video
  const { results } = await env.DB.prepare(`
    SELECT n.id, n.child_first, n.child_last, n.school, n.nominator_name, n.nominator_email
    FROM nominations n
    JOIN parent_intake pi ON n.id = pi.nomination_id
    WHERE (pi.video_uploaded = 0 OR pi.video_uploaded IS NULL)
    AND n.status IN ('sent', 'complete')
  `).all();

  const sent = [];

  // Group by nominator email to avoid spamming same FA
  const byFA = {};
  for (const r of results) {
    const email = (r.nominator_email || '').toLowerCase().trim();
    if (!email) continue;
    if (!byFA[email]) byFA[email] = { name: r.nominator_name, kids: [] };
    byFA[email].kids.push({ first: r.child_first, last: r.child_last, school: r.school });
  }

  for (const [email, data] of Object.entries(byFA)) {
    const kidList = data.kids.map(k => `${k.first} ${k.last} at ${k.school}`).join(', ');
    const kidNames = data.kids.map(k => k.first).join(', ');

    // Email
    await sendEmail(env, {
      to: email,
      subject: `Child Spree — Video needed for ${kidNames}`,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <div style="text-align:center;margin-bottom:16px;"><img src="https://media.daviskids.org/Child%20Spree%20Logo%20Icon.png" alt="Child Spree" style="width:48px;height:48px;"/></div>
        <h3 style="color:#1B3A4B;">Hi ${data.name}!</h3>
        <p style="color:#555;font-size:14px;line-height:1.7;">The parents have submitted clothing sizes for the following children you nominated for Child Spree 2026:</p>
        <ul style="color:#1B3A4B;font-size:14px;line-height:2;">
          ${data.kids.map(k => `<li><strong>${k.first} ${k.last}</strong> — ${k.school}</li>`).join('')}
        </ul>
        <p style="color:#555;font-size:14px;line-height:1.7;">The next step is for you to <strong>record a short video with each child at school</strong>. The volunteer who shops for them will watch this video before shopping day — it makes all the difference.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://childspree.org/#/portal" style="background:#E8548C;color:#fff;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Open My Portal →</a>
        </div>
        <p style="color:#888;font-size:12px;">Log in with your @dsdmail.net email, find each child's card, and tap "Record."</p>
        <p style="color:#999;font-size:11px;margin-top:20px;">Davis Education Foundation · Child Spree 2026</p>
      </div>`,
    });

    // SMS if phone registered
    const phoneRow = await env.DB.prepare('SELECT phone FROM fa_phones WHERE email = ?').bind(email).first();
    if (phoneRow?.phone) {
      await sendSMS(env, phoneRow.phone,
        `Child Spree: Parents submitted sizes for ${kidNames}! Please visit them at school to record a short video. Log in: childspree.org/#/portal`
      );
    }

    sent.push({ email, kids: data.kids.length, hasPhone: !!phoneRow?.phone });
  }

  return cors(Response.json({ sent, total: sent.length }));
}
