// GET /api/admin/allocations — school allocation tracking
// Shows allocated spots vs actual nominations (approved/sent/complete) per school
// Admin only

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
  const authErr = await requireAdmin(env, request);
  if (authErr) return cors(authErr);

  // Get all allocations
  const { results: allocations } = await env.DB.prepare(
    'SELECT school, spots_allocated FROM school_allocations ORDER BY school'
  ).all();

  // Get nomination counts by school (only count non-declined)
  const { results: nomCounts } = await env.DB.prepare(
    "SELECT school, COUNT(*) as used FROM nominations WHERE status != 'declined' GROUP BY school"
  ).all();

  // Get nomination counts by school AND status for breakdown
  const { results: statusCounts } = await env.DB.prepare(
    "SELECT school, status, COUNT(*) as n FROM nominations WHERE status != 'declined' GROUP BY school, status"
  ).all();

  // Build lookup maps
  const usedMap = {};
  nomCounts.forEach(r => { usedMap[r.school] = r.used; });

  const statusMap = {};
  statusCounts.forEach(r => {
    if (!statusMap[r.school]) statusMap[r.school] = {};
    statusMap[r.school][r.status] = r.n;
  });

  // Combine: each allocation + used count + status breakdown
  const schools = allocations.map(a => {
    const used = usedMap[a.school] || 0;
    const statuses = statusMap[a.school] || {};

    // Check for nominations that don't match any allocation (fuzzy match)
    return {
      school: a.school,
      allocated: a.spots_allocated,
      used,
      remaining: a.spots_allocated - used,
      pending: statuses.pending || 0,
      approved: statuses.approved || 0,
      sent: statuses.sent || 0,
      complete: statuses.complete || 0,
    };
  });

  // Find nominations for schools NOT in allocations (orphans)
  const allocSchools = new Set(allocations.map(a => a.school));
  const orphans = [];
  for (const [school, count] of Object.entries(usedMap)) {
    if (!allocSchools.has(school)) {
      orphans.push({ school, used: count, statuses: statusMap[school] || {} });
    }
  }

  // Totals
  const totalAllocated = allocations.reduce((sum, a) => sum + a.spots_allocated, 0);
  const totalUsed = Object.values(usedMap).reduce((sum, n) => sum + n, 0);

  return cors(Response.json({
    schools,
    orphans,
    totals: {
      allocated: totalAllocated,
      used: totalUsed,
      remaining: totalAllocated - totalUsed,
      schoolCount: allocations.length,
    },
  }));
}
