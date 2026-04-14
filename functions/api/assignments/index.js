// GET /api/assignments — list assignments (optionally by store)
// POST /api/assignments — assign a volunteer to a child
// All routes require admin auth

import { requireAdmin } from '../_admin_auth.js';

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Cookie');
  r.headers.set('Access-Control-Allow-Credentials', 'true');
  return r;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

export async function onRequestOptions() {
  return cors(new Response(null, { status: 204 }));
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const authErr = await requireAdmin(env, request);
  if (authErr) return cors(authErr);

  const url = new URL(request.url);
  const store = url.searchParams.get('store');
  const status = url.searchParams.get('status'); // 'active' | 'completed' | 'all'

  let sql = `
    SELECT a.*,
           n.child_first, n.school, n.grade, n.parent_token,
           v.first_name as vol_first, v.last_name as vol_last, v.email as vol_email, v.phone as vol_phone,
           i.shirt_size, i.pant_size, i.shoe_size, i.gender, i.department
    FROM assignments a
    JOIN nominations n ON n.id = a.nomination_id
    JOIN volunteers v ON v.id = a.volunteer_id
    LEFT JOIN parent_intake i ON i.nomination_id = n.id
    WHERE 1=1
  `;
  const binds = [];

  if (store) {
    sql += ' AND a.store_location = ?';
    binds.push(store);
  }
  if (status === 'active') {
    sql += ' AND a.checked_out = 0';
  } else if (status === 'completed') {
    sql += ' AND a.checked_out = 1';
  }

  sql += ' ORDER BY a.assigned_at DESC';

  const stmt = env.DB.prepare(sql);
  const result = binds.length ? await stmt.bind(...binds).all() : await stmt.all();

  // Summary stats
  const stats = await env.DB.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN checked_out = 0 THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN checked_out = 1 THEN 1 ELSE 0 END) as completed
    FROM assignments
  `).first();

  // Unassigned children count
  const unassigned = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM nominations n
    JOIN parent_intake i ON i.nomination_id = n.id
    WHERE n.status = 'complete'
    AND n.id NOT IN (SELECT nomination_id FROM assignments)
  `).first();

  // Checked-in volunteers (those with at least one assignment)
  const checkedInVols = await env.DB.prepare(
    'SELECT COUNT(DISTINCT volunteer_id) as count FROM assignments'
  ).first();

  return cors(Response.json({
    assignments: result.results || [],
    stats: {
      total: stats?.total || 0,
      active: stats?.active || 0,
      completed: stats?.completed || 0,
      unassigned: unassigned?.count || 0,
      volunteersCheckedIn: checkedInVols?.count || 0,
    },
  }));
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const authErr = await requireAdmin(env, request);
  if (authErr) return cors(authErr);

  const body = await request.json();
  const { nominationId, volunteerId, storeLocation } = body;

  if (!nominationId || !volunteerId) {
    return cors(Response.json({ error: 'nominationId and volunteerId required' }, { status: 400 }));
  }

  // Verify nomination exists and is complete
  const nom = await env.DB.prepare(
    'SELECT id, child_first, status FROM nominations WHERE id = ?'
  ).bind(nominationId).first();
  if (!nom) return cors(Response.json({ error: 'Nomination not found' }, { status: 404 }));
  if (nom.status !== 'complete') return cors(Response.json({ error: 'Child intake not complete' }, { status: 400 }));

  // Verify volunteer exists
  const vol = await env.DB.prepare(
    'SELECT id, first_name, last_name FROM volunteers WHERE id = ?'
  ).bind(volunteerId).first();
  if (!vol) return cors(Response.json({ error: 'Volunteer not found' }, { status: 404 }));

  // Check if child is already assigned
  const existing = await env.DB.prepare(
    'SELECT id FROM assignments WHERE nomination_id = ?'
  ).bind(nominationId).first();
  if (existing) return cors(Response.json({ error: 'Child already assigned to a volunteer' }, { status: 409 }));

  const id = generateId();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO assignments (id, nomination_id, volunteer_id, store_location, assigned_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(id, nominationId, volunteerId, storeLocation || null, now).run();

  return cors(Response.json({
    id,
    childName: nom.child_first,
    volunteerName: `${vol.first_name} ${vol.last_name}`,
    assignedAt: now,
  }, { status: 201 }));
}
