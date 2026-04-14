// GET /api/admin/shopday — real-time shopping day dashboard data
// Returns: stats, store breakdown, unassigned children, active shoppers, avg times
// Admin auth required

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

  // Run all queries in parallel
  const [
    totalKids,
    totalVols,
    assignmentStats,
    storeBreakdown,
    unassignedKids,
    activeShoppers,
    completedTimes,
  ] = await Promise.all([
    // Total kids with completed intake
    env.DB.prepare(`
      SELECT COUNT(*) as count FROM nominations n
      JOIN parent_intake i ON i.nomination_id = n.id
      WHERE n.status = 'complete'
    `).first(),

    // Total registered volunteers
    env.DB.prepare('SELECT COUNT(*) as count FROM volunteers').first(),

    // Assignment rollup
    env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN checked_out = 0 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN checked_out = 1 THEN 1 ELSE 0 END) as completed,
        COUNT(DISTINCT volunteer_id) as volunteers_in
      FROM assignments
    `).first(),

    // Per-store breakdown
    env.DB.prepare(`
      SELECT
        store_location,
        COUNT(*) as total,
        SUM(CASE WHEN checked_out = 0 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN checked_out = 1 THEN 1 ELSE 0 END) as completed
      FROM assignments
      WHERE store_location IS NOT NULL
      GROUP BY store_location
    `).all(),

    // Unassigned children (completed intake, no assignment)
    env.DB.prepare(`
      SELECT n.id, n.child_first, n.school, n.grade, n.parent_token,
             i.shirt_size, i.pant_size, i.shoe_size, i.gender, i.department
      FROM nominations n
      JOIN parent_intake i ON i.nomination_id = n.id
      WHERE n.status = 'complete'
      AND n.id NOT IN (SELECT nomination_id FROM assignments)
      ORDER BY n.school, n.child_first
    `).all(),

    // Active shoppers (assigned, not checked out) with elapsed time
    env.DB.prepare(`
      SELECT a.id, a.assigned_at, a.store_location,
             n.child_first, n.school,
             v.first_name as vol_first, v.last_name as vol_last,
             i.shirt_size, i.pant_size, i.shoe_size
      FROM assignments a
      JOIN nominations n ON n.id = a.nomination_id
      JOIN volunteers v ON v.id = a.volunteer_id
      LEFT JOIN parent_intake i ON i.nomination_id = n.id
      WHERE a.checked_out = 0
      ORDER BY a.assigned_at ASC
    `).all(),

    // Completed assignments with duration for avg time calc
    env.DB.prepare(`
      SELECT assigned_at, checkout_at
      FROM assignments
      WHERE checked_out = 1 AND assigned_at IS NOT NULL AND checkout_at IS NOT NULL
    `).all(),
  ]);

  // Calculate average shopping time
  let avgMinutes = null;
  const durations = (completedTimes.results || [])
    .map(r => {
      const start = new Date(r.assigned_at).getTime();
      const end = new Date(r.checkout_at).getTime();
      return (end - start) / 60000; // minutes
    })
    .filter(d => d > 0 && d < 480); // filter out bogus data (>8 hours)

  if (durations.length > 0) {
    avgMinutes = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  }

  return cors(Response.json({
    overview: {
      totalKids: totalKids?.count || 0,
      totalVolunteers: totalVols?.count || 0,
      assigned: assignmentStats?.total || 0,
      active: assignmentStats?.active || 0,
      completed: assignmentStats?.completed || 0,
      unassigned: (totalKids?.count || 0) - (assignmentStats?.total || 0),
      volunteersIn: assignmentStats?.volunteers_in || 0,
      avgShoppingMinutes: avgMinutes,
    },
    stores: (storeBreakdown.results || []).map(s => ({
      id: s.store_location,
      total: s.total,
      active: s.active,
      completed: s.completed,
    })),
    unassignedKids: unassignedKids.results || [],
    activeShoppers: activeShoppers.results || [],
  }));
}
