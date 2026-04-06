// GET /api/nominations/:id
// PATCH /api/nominations/:id — update status + fire notifications

import { notifyParentIntakeReady } from '../_notify.js';

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return r;
}

export async function onRequestOptions() {
  return cors(new Response(null, { status: 204 }));
}

export async function onRequestGet(context) {
  const { env, params } = context;
  const nom = await env.DB.prepare('SELECT * FROM nominations WHERE id = ?').bind(params.id).first();
  if (!nom) return cors(Response.json({ error: 'Not found' }, { status: 404 }));
  const intake = await env.DB.prepare('SELECT * FROM parent_intake WHERE nomination_id = ?').bind(params.id).first();
  return cors(Response.json({
    id: nom.id, status: nom.status, parentToken: nom.parent_token,
    childFirst: nom.child_first, childLast: nom.child_last, school: nom.school, grade: nom.grade,
    nominatorName: nom.nominator_name, nominatorRole: nom.nominator_role, nominatorEmail: nom.nominator_email,
    parentName: nom.parent_name, parentPhone: nom.parent_phone, parentEmail: nom.parent_email,
    reason: nom.reason, siblings: nom.siblings, createdAt: nom.created_at,
    parentIntake: intake ? {
      shirtSize: intake.shirt_size, pantSize: intake.pant_size, shoeSize: intake.shoe_size,
      favoriteColors: intake.favorite_colors, avoidColors: intake.avoid_colors,
      allergies: intake.allergies, preferences: intake.preferences, hasVideo: !!intake.video_uploaded,
    } : null,
  }));
}

export async function onRequestPatch(context) {
  const { env, params, request } = context;
  const body = await request.json();

  const nom = await env.DB.prepare('SELECT * FROM nominations WHERE id = ?').bind(params.id).first();
  if (!nom) return cors(Response.json({ error: 'Not found' }, { status: 404 }));

  const transitions = { pending:['approved','declined'], approved:['sent','declined'], sent:['complete'], declined:['pending'] };
  if (body.status) {
    if (!(transitions[nom.status]||[]).includes(body.status)) {
      return cors(Response.json({ error: `Cannot go from ${nom.status} to ${body.status}` }, { status: 400 }));
    }
    const now = new Date().toISOString();
    let extra = '';
    if (body.status==='approved') extra=', approved_at = ?';
    if (body.status==='sent') extra=', sent_at = ?';
    if (body.status==='complete') extra=', completed_at = ?';
    const binds = [body.status, now];
    if (extra) binds.push(now);
    binds.push(params.id);
    await env.DB.prepare(`UPDATE nominations SET status = ?, updated_at = ?${extra} WHERE id = ?`).bind(...binds).run();

    // When marked "sent" — text + email parent with their intake link
    if (body.status === 'sent') {
      context.waitUntil(notifyParentIntakeReady(env, {
        parentName: nom.parent_name,
        parentPhone: nom.parent_phone,
        parentEmail: nom.parent_email,
        parentToken: nom.parent_token,
        childFirst: nom.child_first,
        childLast: nom.child_last,
      }));
    }
  }

  return cors(Response.json({ id: params.id, status: body.status, updated: true }));
}
