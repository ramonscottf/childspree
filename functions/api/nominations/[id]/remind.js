// POST /api/nominations/:id/remind — admin sends parent a reminder

import { sendSMS, sendEmail } from '../../_notify.js';

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return r;
}
export async function onRequestOptions() { return cors(new Response(null, { status: 204 })); }

export async function onRequestPost(context) {
  const { env, params } = context;

  const nom = await env.DB.prepare('SELECT * FROM nominations WHERE id = ?').bind(params.id).first();
  if (!nom) return cors(Response.json({ error: 'Not found' }, { status: 404 }));
  if (nom.status !== 'sent') return cors(Response.json({ error: 'Can only remind when status is sent' }, { status: 400 }));

  // Check if intake already submitted
  const intake = await env.DB.prepare('SELECT id FROM parent_intake WHERE nomination_id = ?').bind(params.id).first();
  if (intake) return cors(Response.json({ error: 'Parent already submitted' }, { status: 400 }));

  const intakeUrl = `https://childspree.org/#/intake/${nom.parent_token}`;
  const lang = nom.parent_language || 'en';
  const isEs = lang === 'es';

  // SMS
  let smsSent = false;
  if (nom.parent_phone) {
    const smsBody = isEs
      ? `Hola ${nom.parent_name}! Recordatorio: por favor complete las tallas de ropa para ${nom.child_first} en Child Spree 2026. Solo toma 2 minutos: ${intakeUrl} Responda STOP para cancelar.`
      : `Hi ${nom.parent_name}! Quick reminder — please fill out ${nom.child_first}'s clothing sizes for Child Spree 2026. Takes 2 minutes: ${intakeUrl} Reply STOP to opt out.`;
    const r = await sendSMS(env, nom.parent_phone, smsBody);
    smsSent = r?.ok || false;
  }

  // Email
  let emailSent = false;
  if (nom.parent_email) {
    const subject = isEs
      ? `Recordatorio — tallas de ${nom.child_first} para Child Spree`
      : `Reminder — ${nom.child_first}'s sizes for Child Spree`;
    const r = await sendEmail(env, {
      to: nom.parent_email,
      subject,
      html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <div style="text-align:center;margin-bottom:20px;">
          <img src="https://media.daviskids.org/Child%20Spree%20Logo%20Icon.png" alt="Child Spree" style="width:48px;height:48px;"/>
        </div>
        <h3 style="color:#1B3A4B;">${isEs ? 'Hola' : 'Hi'} ${nom.parent_name},</h3>
        <p style="color:#555;font-size:14px;line-height:1.7;">${isEs
          ? `Solo un recordatorio rápido para completar las tallas de ropa de ${nom.child_first} para Child Spree 2026. ¡Solo toma 2 minutos!`
          : `Just a quick reminder to fill out ${nom.child_first}'s clothing sizes for Child Spree 2026. It only takes 2 minutes!`
        }</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${intakeUrl}" style="background:#E8548C;color:#fff;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">${isEs
            ? `Completar tallas de ${nom.child_first} →`
            : `Fill out ${nom.child_first}'s sizes →`
          }</a>
        </div>
        <p style="color:#999;font-size:11px;">Davis Education Foundation · Child Spree 2026</p>
      </div>`,
    });
    emailSent = r?.ok || false;
  }

  return cors(Response.json({ smsSent, emailSent }));
}
