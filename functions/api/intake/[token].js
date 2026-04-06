// GET /api/intake/:token
// POST /api/intake/:token — submit sizes + notify admin

import { notifyIntakeComplete } from '../_notify.js';

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
    'SELECT id, child_first, child_last, school, grade, status FROM nominations WHERE parent_token = ?'
  ).bind(params.token).first();
  if (!nom) return cors(Response.json({ error: 'Invalid or expired link' }, { status: 404 }));
  if (nom.status !== 'sent' && nom.status !== 'complete') {
    return cors(Response.json({ error: 'This link is not yet active' }, { status: 403 }));
  }
  const existing = await env.DB.prepare('SELECT id FROM parent_intake WHERE nomination_id = ?').bind(nom.id).first();
  return cors(Response.json({
    childFirst: nom.child_first, childLast: nom.child_last,
    school: nom.school, grade: nom.grade, alreadySubmitted: !!existing,
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

  const intakeId = generateId();
  await env.DB.prepare(`
    INSERT INTO parent_intake (id, nomination_id, gender, department, shirt_size, pant_size, shoe_size,
      favorite_colors, avoid_colors, allergies, preferences)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(intakeId, nom.id, body.gender||null, body.department||null, body.shirtSize, body.pantSize, body.shoeSize,
    body.favoriteColors||null, body.avoidColors||null, body.allergies||null, body.preferences||null
  ).run();

  const now = new Date().toISOString();
  await env.DB.prepare(
    'UPDATE nominations SET status = ?, updated_at = ?, completed_at = ? WHERE id = ?'
  ).bind('complete', now, now, nom.id).run();

  // Notify admin
  context.waitUntil(notifyIntakeComplete(env, {
    childFirst: nom.child_first, childLast: nom.child_last,
    school: nom.school, grade: nom.grade,
  }, {
    gender: body.gender, department: body.department, shirtSize: body.shirtSize, pantSize: body.pantSize, shoeSize: body.shoeSize,
    favoriteColors: body.favoriteColors, avoidColors: body.avoidColors,
    allergies: body.allergies, preferences: body.preferences, videoUploaded: false,
  }));

  return cors(Response.json({ id: intakeId, status: 'complete' }, { status: 201 }));
}
