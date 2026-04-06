// GET /api/nominations — list all (admin)
// POST /api/nominations — create nomination + notify

import { notifyNewNomination } from './_notify.js';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}
function generateToken() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let t = '';
  for (let i = 0; i < 12; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}
function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return r;
}

export async function onRequestOptions() {
  return cors(new Response(null, { status: 204 }));
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');

  let q = 'SELECT n.*, pi.shirt_size, pi.pant_size, pi.shoe_size, pi.favorite_colors, pi.avoid_colors, pi.allergies, pi.preferences as intake_preferences, pi.video_uploaded FROM nominations n LEFT JOIN parent_intake pi ON n.id = pi.nomination_id WHERE 1=1';
  const p = [];
  if (status && status !== 'all') { q += ' AND n.status = ?'; p.push(status); }
  if (search) { q += ' AND (n.child_first LIKE ? OR n.child_last LIKE ? OR n.school LIKE ? OR n.nominator_name LIKE ?)'; const s = `%${search}%`; p.push(s,s,s,s); }
  q += ' ORDER BY n.created_at DESC';

  const { results } = await env.DB.prepare(q).bind(...p).all();

  const nominations = results.map(r => ({
    id: r.id, status: r.status, parentToken: r.parent_token,
    childFirst: r.child_first, childLast: r.child_last, school: r.school, grade: r.grade,
    nominatorName: r.nominator_name, nominatorRole: r.nominator_role, nominatorEmail: r.nominator_email,
    parentName: r.parent_name, parentPhone: r.parent_phone, parentEmail: r.parent_email,
    reason: r.reason, siblings: r.siblings, additionalNotes: r.additional_notes,
    createdAt: r.created_at, updatedAt: r.updated_at,
    parentIntake: r.shirt_size ? {
      shirtSize: r.shirt_size, pantSize: r.pant_size, shoeSize: r.shoe_size,
      favoriteColors: r.favorite_colors, avoidColors: r.avoid_colors,
      allergies: r.allergies, preferences: r.intake_preferences,
      hasVideo: !!r.video_uploaded,
    } : null,
  }));

  return cors(Response.json({ nominations, total: nominations.length }));
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const body = await request.json();

  const required = ['childFirst','childLast','school','grade','nominatorName','nominatorEmail','parentName'];
  for (const f of required) {
    if (!body[f]) return cors(Response.json({ error: `Missing: ${f}` }, { status: 400 }));
  }
  if (!body.parentPhone && !body.parentEmail) {
    return cors(Response.json({ error: 'Parent needs phone or email' }, { status: 400 }));
  }

  const id = generateId();
  const token = generateToken();

  await env.DB.prepare(`
    INSERT INTO nominations (id, parent_token, child_first, child_last, school, grade,
      nominator_name, nominator_role, nominator_email,
      parent_name, parent_phone, parent_email,
      reason, siblings, additional_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, token,
    body.childFirst, body.childLast, body.school, body.grade,
    body.nominatorName, body.nominatorRole || 'Teacher', body.nominatorEmail,
    body.parentName, body.parentPhone || null, body.parentEmail || null,
    body.reason || null, body.siblings || null, body.additionalNotes || null
  ).run();

  // Fire notifications async (don't block response)
  context.waitUntil(notifyNewNomination(env, {
    childFirst: body.childFirst, childLast: body.childLast,
    school: body.school, grade: body.grade,
    nominatorName: body.nominatorName, nominatorRole: body.nominatorRole,
    nominatorEmail: body.nominatorEmail,
    parentName: body.parentName, parentPhone: body.parentPhone, parentEmail: body.parentEmail,
    reason: body.reason, siblings: body.siblings,
  }));

  return cors(Response.json({ id, parentToken: token, status: 'pending' }, { status: 201 }));
}
