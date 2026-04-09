// GET /api/portal/nomination/:id — get single nomination for video recording
// Requires X-FA-Token session header

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-FA-Token');
  return r;
}
export async function onRequestOptions() { return cors(new Response(null, { status: 204 })); }

export async function onRequestGet(context) {
  const { env, params, request } = context;
  const token = request.headers.get('X-FA-Token');
  if (!token) return cors(Response.json({ error: 'Not authenticated' }, { status: 401 }));

  // Validate session
  const session = await env.DB.prepare(
    'SELECT * FROM fa_sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first();
  if (!session) return cors(Response.json({ error: 'Session expired' }, { status: 401 }));

  // Get the nomination — must belong to this nominator
  const nom = await env.DB.prepare(`
    SELECT n.id, n.child_first, n.child_last, n.school, n.grade, n.parent_token, n.status,
           pi.video_uploaded
    FROM nominations n
    LEFT JOIN parent_intake pi ON n.id = pi.nomination_id
    WHERE n.id = ? AND LOWER(n.nominator_email) = ?
  `).bind(params.id, session.nominator_email).first();

  if (!nom) return cors(Response.json({ error: 'Nomination not found' }, { status: 404 }));

  return cors(Response.json({
    id: nom.id,
    childFirst: nom.child_first,
    childLast: nom.child_last,
    school: nom.school,
    grade: nom.grade,
    parentToken: nom.parent_token,
    status: nom.status,
    videoUploaded: !!nom.video_uploaded,
  }));
}
