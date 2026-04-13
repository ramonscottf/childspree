// GET /api/intake/:token
// POST /api/intake/:token — submit sizes + notify admin

import { notifyIntakeComplete, notifyFAVideoNeeded, sendEmail, sendSMS } from '../_notify.js';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}
function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return r;
}

export async function onRequestOptions() {
  return cors(new Response(null, { status: 204 }));
}

export async function onRequestGet(context) {
  const { env, params } = context;
  const nom = await env.DB.prepare(
    'SELECT id, child_first, child_last, school, grade, status, parent_language FROM nominations WHERE parent_token = ?'
  ).bind(params.token).first();
  if (!nom) return cors(Response.json({ error: 'Invalid or expired link' }, { status: 404 }));
  if (nom.status !== 'sent' && nom.status !== 'complete') {
    return cors(Response.json({ error: 'This link is not yet active' }, { status: 403 }));
  }
  const existing = await env.DB.prepare('SELECT id FROM parent_intake WHERE nomination_id = ?').bind(nom.id).first();
  return cors(Response.json({
    childFirst: nom.child_first, childLast: nom.child_last,
    school: nom.school, grade: nom.grade, alreadySubmitted: !!existing,
    parentLanguage: nom.parent_language || 'en',
  }));
}

export async function onRequestPost(context) {
  const { env, params, request } = context;
  const body = await request.json();

  const nom = await env.DB.prepare('SELECT * FROM nominations WHERE parent_token = ?').bind(params.token).first();
  if (!nom) return cors(Response.json({ error: 'Invalid or expired link' }, { status: 404 }));
  if (nom.status !== 'sent') return cors(Response.json({ error: 'Intake already submitted or not active' }, { status: 400 }));
  if (!body.shirtSize || !body.pantSize || !body.shoeSize) {
    return cors(Response.json({ error: 'Shirt, pant, and shoe sizes required' }, { status: 400 }));
  }
  if (!body.parentConsent) {
    return cors(Response.json({ error: 'Parent consent is required' }, { status: 400 }));
  }

  const intakeId = generateId();
  await env.DB.prepare(`
    INSERT INTO parent_intake (id, nomination_id, gender, department, shirt_size, pant_size, shoe_size,
      favorite_colors, avoid_colors, allergies, preferences, parent_consent, language, child_age)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(intakeId, nom.id, body.gender||null, body.department||null, body.shirtSize, body.pantSize, body.shoeSize,
    body.favoriteColors||null, body.avoidColors||null, body.allergies||null, body.preferences||null,
    body.parentConsent ? 1 : 0, body.language||"en", body.childAge||null
  ).run();

  const now = new Date().toISOString();
  await env.DB.prepare(
    'UPDATE nominations SET status = ?, updated_at = ?, completed_at = ? WHERE id = ?'
  ).bind('complete', now, now, nom.id).run();

  // Notify admin + FA/nominator
  context.waitUntil((async () => {
    await notifyIntakeComplete(env, {
      childFirst: nom.child_first, childLast: nom.child_last,
      school: nom.school, grade: nom.grade,
    }, {
      gender: body.gender, department: body.department, shirtSize: body.shirtSize, pantSize: body.pantSize, shoeSize: body.shoeSize,
      favoriteColors: body.favoriteColors, avoidColors: body.avoidColors,
      allergies: body.allergies, preferences: body.preferences, videoUploaded: false,
    });

    // Notify the nominator (FA) — they need to go record a video
    const nominatorEmail = (nom.nominator_email || '').toLowerCase().trim();
    if (nominatorEmail) {
      // Get phone from fa_phones if they registered one
      const phoneRow = await env.DB.prepare('SELECT phone FROM fa_phones WHERE email = ?').bind(nominatorEmail).first();

      // Send email
      await sendEmail(env, {
        to: nominatorEmail,
        subject: `Child Spree — ${nom.child_first}'s parent submitted sizes! Time to record a video`,
        html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <div style="text-align:center;margin-bottom:16px;"><img src="https://media.daviskids.org/Child%20Spree%20Logo%20Icon.png" alt="Child Spree" style="width:48px;height:48px;"/></div>
          <h3 style="color:#1B3A4B;">Great news, ${nom.nominator_name}!</h3>
          <p style="color:#555;font-size:14px;line-height:1.7;"><strong>${nom.child_first} ${nom.child_last}</strong>'s parent just submitted their clothing sizes for Child Spree 2026.</p>
          <p style="color:#555;font-size:14px;line-height:1.7;">The next step is for you to <strong>record a short video with ${nom.child_first} at ${nom.school}</strong>. The volunteer who shops for them will watch this video — it makes all the difference.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="https://childspree.org/#/portal" style="background:#E8548C;color:#fff;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">Open My Portal →</a>
          </div>
          <p style="color:#888;font-size:12px;line-height:1.5;">Log in with your @dsdmail.net email, find ${nom.child_first}'s card, and tap "Record." Takes about 60 seconds.</p>
          <p style="color:#999;font-size:11px;margin-top:20px;">Davis Education Foundation · Child Spree 2026</p>
        </div>`,
      });

      // Send SMS if we have their phone
      if (phoneRow?.phone) {
        await sendSMS(env, phoneRow.phone,
          `Child Spree: ${nom.child_first}'s parent just submitted sizes! Please visit ${nom.child_first} at ${nom.school} to record a short video. Open your portal: childspree.org/#/portal`
        );
      }
    }

    // Legacy: also check fa_id for backwards compat
    if (nom.fa_id) {
      const fa = await env.DB.prepare('SELECT * FROM family_advocates WHERE id=?').bind(nom.fa_id).first();
      if (fa && fa.email?.toLowerCase() !== nominatorEmail) {
        await notifyFAVideoNeeded(env, { fa, nom, intake: { shirt_size: body.shirtSize, gender: body.gender, favorite_colors: body.favoriteColors } });
      }
    }
  })());

  return cors(Response.json({ id: intakeId, status: 'complete' }, { status: 201 }));
}
