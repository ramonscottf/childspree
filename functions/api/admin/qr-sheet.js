// GET /api/admin/qr-sheet — returns children with completed intake for QR code generation
// Authenticated (admin session required)
// Optional ?school=xxx filter

import { requireAdmin } from '../_admin_auth.js';

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Cookie');
  r.headers.set('Access-Control-Allow-Credentials', 'true');
  return r;
}

export async function onRequestOptions() {
  return cors(new Response(null, { status: 204 }));
}

export async function onRequestGet(context) {
  const { env, request } = context;

  // Require admin auth
  const authErr = await requireAdmin(env, request);
  if (authErr) return cors(authErr);

  const url = new URL(request.url);
  const schoolFilter = url.searchParams.get('school');

  let sql = `
    SELECT n.id, n.parent_token, n.child_first, n.school, n.grade,
           i.gender, i.department, i.shirt_size, i.pant_size, i.shoe_size
    FROM nominations n
    JOIN parent_intake i ON i.nomination_id = n.id
    WHERE n.status = 'complete'
  `;
  const binds = [];

  if (schoolFilter) {
    sql += ' AND n.school = ?';
    binds.push(schoolFilter);
  }

  sql += ' ORDER BY n.school, n.child_first';

  const stmt = env.DB.prepare(sql);
  const result = binds.length ? await stmt.bind(...binds).all() : await stmt.all();

  // Also get distinct schools for the filter dropdown
  const schools = await env.DB.prepare(
    "SELECT DISTINCT school FROM nominations WHERE status = 'complete' ORDER BY school"
  ).all();

  return cors(Response.json({
    children: result.results || [],
    schools: (schools.results || []).map(r => r.school),
    total: (result.results || []).length,
  }));
}
