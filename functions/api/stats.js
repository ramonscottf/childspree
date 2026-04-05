// GET /api/stats — dashboard stats for admin

function cors(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function onRequestOptions() {
  return cors(new Response(null, { status: 204 }));
}

export async function onRequestGet(context) {
  const { env } = context;

  const [total, byStatus, bySchool, recent] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) as count FROM nominations').first(),
    env.DB.prepare('SELECT status, COUNT(*) as count FROM nominations GROUP BY status').all(),
    env.DB.prepare('SELECT school, COUNT(*) as count FROM nominations GROUP BY school ORDER BY count DESC LIMIT 15').all(),
    env.DB.prepare('SELECT id, child_first, child_last, school, status, created_at FROM nominations ORDER BY created_at DESC LIMIT 10').all(),
  ]);

  const statusCounts = { pending: 0, approved: 0, sent: 0, complete: 0, declined: 0 };
  byStatus.results.forEach(r => { statusCounts[r.status] = r.count; });

  return cors(Response.json({
    total: total.count,
    byStatus: statusCounts,
    bySchool: bySchool.results.map(r => ({ school: r.school, count: r.count })),
    recent: recent.results.map(r => ({
      id: r.id,
      childFirst: r.child_first,
      childLast: r.child_last,
      school: r.school,
      status: r.status,
      createdAt: r.created_at,
    })),
  }));
}
