// functions/api/fa/[token].js — FA portal: GET their nominations + POST nudge parent

import { sendSMS, sendEmail } from '../../_notify.js';

function cors(r) { r.headers.set('Access-Control-Allow-Origin','*'); r.headers.set('Access-Control-Allow-Methods','GET,POST,OPTIONS'); r.headers.set('Access-Control-Allow-Headers','Content-Type,Authorization'); return r; }
export async function onRequestOptions() { return cors(new Response(null,{status:204})); }

export async function onRequestGet(context) {
  const { env, params } = context;
  const fa = await env.DB.prepare('SELECT * FROM family_advocates WHERE portal_token=?').bind(params.token).first();
  if (!fa) return cors(Response.json({ error: 'Invalid link' }, { status: 404 }));

  const { results } = await env.DB.prepare(`
    SELECT n.*, pi.shirt_size, pi.pant_size, pi.shoe_size, pi.gender, pi.department,
           pi.favorite_colors, pi.video_uploaded
    FROM nominations n
    LEFT JOIN parent_intake pi ON n.id = pi.nomination_id
    WHERE n.fa_id = ?
    ORDER BY n.created_at DESC
  `).bind(fa.id).all();

  const nominations = results.map(r => ({
    id: r.id, status: r.status, parentToken: r.parent_token,
    childFirst: r.child_first, childLast: r.child_last,
    school: r.school, grade: r.grade,
    parentName: r.parent_name, parentPhone: r.parent_phone, parentEmail: r.parent_email,
    createdAt: r.created_at,
    parentIntake: r.shirt_size ? {
      shirtSize: r.shirt_size, pantSize: r.pant_size, shoeSize: r.shoe_size,
      gender: r.gender, department: r.department,
      favoriteColors: r.favorite_colors, hasVideo: !!r.video_uploaded,
    } : null,
  }));

  return cors(Response.json({
    fa: { id: fa.id, firstName: fa.first_name, lastName: fa.last_name, school: fa.school },
    nominations,
  }));
}

export async function onRequestPost(context) {
  const { env, params, request } = context;
  const fa = await env.DB.prepare('SELECT * FROM family_advocates WHERE portal_token=?').bind(params.token).first();
  if (!fa) return cors(Response.json({ error: 'Invalid link' }, { status: 404 }));

  const body = await request.json();

  if (body.action === 'nudge') {
    // FA nudging parent to fill out intake
    const nom = await env.DB.prepare('SELECT * FROM nominations WHERE id=? AND fa_id=?').bind(body.nominationId, fa.id).first();
    if (!nom) return cors(Response.json({ error: 'Not found' }, { status: 404 }));

    const intakeUrl = `https://childspree.org/#/intake/${nom.parent_token}`;
    const msg = `Hi ${nom.parent_name}! This is ${fa.first_name} from ${fa.school||'school'}. Just a reminder to fill out sizes for ${nom.child_first}'s Child Spree shopping: ${intakeUrl} Takes 2 min! Reply STOP to opt out.`;

    let smsSent = false, emailSent = false;
    if (nom.parent_phone) { const r = await sendSMS(env, nom.parent_phone, msg); smsSent = r?.ok; }
    if (nom.parent_email) {
      const r = await sendEmail(env, {
        to: nom.parent_email,
        replyTo: fa.email,
        subject: `Reminder — ${nom.child_first}'s Child Spree form`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <h3 style="color:#1B3A4B;">Hi ${nom.parent_name},</h3>
          <p style="color:#555;font-size:14px;line-height:1.7;">${fa.first_name} from ${fa.school||'school'} here — just a quick reminder to fill out ${nom.child_first}'s size form for Child Spree 2026. It only takes 2 minutes!</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${intakeUrl}" style="background:#E8548C;color:#fff;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Fill Out ${nom.child_first}'s Sizes →</a>
          </div>
          <p style="color:#999;font-size:11px;">Davis Education Foundation · Child Spree 2026</p>
        </div>`,
      });
      emailSent = r?.ok;
    }
    return cors(Response.json({ smsSent, emailSent }));
  }

  return cors(Response.json({ error: 'Unknown action' }, { status: 400 }));
}
