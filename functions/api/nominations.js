// GET /api/nominations — list all (admin only, authenticated)
// POST /api/nominations — create nomination + notify (public)

import { notifyNewNomination } from './_notify.js';
import { requireAdmin } from './_admin_auth.js';

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

  // Auth required — this returns 91 children's PII
  const denied = await requireAdmin(env, request);
  if (denied) return cors(denied);

  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');

  let q = 'SELECT n.*, pi.shirt_size, pi.pant_size, pi.shoe_size, pi.favorite_colors, pi.avoid_colors, pi.allergies, pi.preferences as intake_preferences, pi.video_uploaded, pi.child_age, pi.parent_consent FROM nominations n LEFT JOIN parent_intake pi ON n.id = pi.nomination_id WHERE 1=1';
  const p = [];
  if (status && status !== 'all') { q += ' AND n.status = ?'; p.push(status); }
  if (search) { q += ' AND (n.child_first LIKE ? OR n.child_last LIKE ? OR n.school LIKE ? OR n.nominator_name LIKE ?)'; const s = `%${search}%`; p.push(s,s,s,s); }
  q += ' ORDER BY n.created_at DESC';

  const { results } = await env.DB.prepare(q).bind(...p).all();

  const nominations = results.map(r => ({
    id: r.id, status: r.status, parentToken: r.parent_token,
    childFirst: r.child_first, childLast: r.child_last, studentId: r.student_id, school: r.school, grade: r.grade,
    nominatorName: r.nominator_name, nominatorRole: r.nominator_role, nominatorEmail: r.nominator_email,
    parentName: r.parent_name, parentPhone: r.parent_phone, parentEmail: r.parent_email,
    reason: r.reason, siblingCount: r.sibling_count||0, siblingNames: r.sibling_names||null, additionalNotes: r.additional_notes, parentLanguage: r.parent_language||'en',
    familyGroup: r.family_group || null,
    declineReason: r.decline_reason || null,
    createdAt: r.created_at, updatedAt: r.updated_at,
    parentIntake: r.shirt_size ? {
      shirtSize: r.shirt_size, pantSize: r.pant_size, shoeSize: r.shoe_size,
      favoriteColors: r.favorite_colors, avoidColors: r.avoid_colors,
      allergies: r.allergies, preferences: r.intake_preferences,
      hasVideo: !!r.video_uploaded, childAge: r.child_age || null,
      consent: !!r.parent_consent,
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
  if (!body.parentPhone) {
    return cors(Response.json({ error: 'Parent phone number is required' }, { status: 400 }));
  }
  if (!body.parentEmail) {
    return cors(Response.json({ error: 'Parent email is required' }, { status: 400 }));
  }

  const id = generateId();
  const token = generateToken();

  // Parse siblings data
  let siblingDefs = [];
  if (body.siblingsData) {
    try {
      const parsed = JSON.parse(body.siblingsData);
      if (Array.isArray(parsed)) {
        siblingDefs = parsed.filter(s => s.name && s.name.trim());
      }
    } catch(e) {}
  }

  // If there are siblings, create a family group
  const familyGroup = siblingDefs.length > 0 ? `fam_${id}` : null;

  await env.DB.prepare(`
    INSERT INTO nominations (id, parent_token, child_first, child_last, student_id, school, grade,
      nominator_name, nominator_role, nominator_email,
      parent_name, parent_phone, parent_email,
      reason, sibling_count, sibling_names, additional_notes, parent_language, family_group)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, token,
    body.childFirst, body.childLast, body.studentId || null, body.school, body.grade,
    body.nominatorName, body.nominatorRole || 'Teacher', body.nominatorEmail,
    body.parentName, body.parentPhone || null, body.parentEmail || null,
    body.reason || null, body.siblingCount || 0, body.siblingNames || null, body.additionalNotes || null, body.parentLanguage || 'en',
    familyGroup
  ).run();

  // Store FA phone if provided
  if (body.nominatorPhone && body.nominatorPhone.trim()) {
    const normEmail = (body.nominatorEmail || '').toLowerCase().trim();
    const cleanPhone = body.nominatorPhone.trim();
    await env.DB.prepare(
      "INSERT OR REPLACE INTO fa_phones (email, phone, updated_at) VALUES (?, ?, datetime('now'))"
    ).bind(normEmail, cleanPhone).run();
  }

  // Create separate nomination rows for each sibling immediately
  const siblingIds = [];
  for (const sibDef of siblingDefs) {
    const raw = sibDef.name.trim();
    const parts = raw.split(' ');
    const firstName = parts[0] || raw;
    const lastName = parts.slice(1).join(' ') || body.childLast;
    const studentId = sibDef.studentId || null;

    const sibId = generateId();
    const sibToken = generateToken();

    await env.DB.prepare(`
      INSERT INTO nominations (id, parent_token, child_first, child_last, student_id, school, grade,
        nominator_name, nominator_role, nominator_email,
        parent_name, parent_phone, parent_email,
        reason, sibling_count, sibling_names, additional_notes, parent_language, family_group)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL, ?, ?)
    `).bind(
      sibId, sibToken, firstName, lastName, studentId, body.school, body.grade,
      body.nominatorName, body.nominatorRole || 'Teacher', body.nominatorEmail,
      body.parentName, body.parentPhone || null, body.parentEmail || null,
      body.reason || null, body.parentLanguage || 'en',
      familyGroup
    ).run();

    siblingIds.push(sibId);
  }

  // Fire notifications async (don't block response)
  context.waitUntil(notifyNewNomination(env, {
    childFirst: body.childFirst, childLast: body.childLast,
    school: body.school, grade: body.grade,
    nominatorName: body.nominatorName, nominatorRole: body.nominatorRole,
    nominatorEmail: body.nominatorEmail,
    parentName: body.parentName, parentPhone: body.parentPhone, parentEmail: body.parentEmail,
    reason: body.reason, siblingCount: body.siblingCount||0, siblingNames: body.siblingNames||null, parentLanguage: body.parentLanguage||'en',
  }));

  return cors(Response.json({ id, parentToken: token, status: 'pending', siblingIds }, { status: 201 }));
}
