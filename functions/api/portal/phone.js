// GET /api/portal/phone — get FA's saved phone
// POST /api/portal/phone — save/update FA's phone

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-FA-Token');
  return r;
}
export async function onRequestOptions() { return cors(new Response(null, { status: 204 })); }

async function getSession(env, request) {
  const token = request.headers.get('X-FA-Token');
  if (!token) return null;
  return env.DB.prepare(
    'SELECT * FROM fa_sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first();
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const session = await getSession(env, request);
  if (!session) return cors(Response.json({ error: 'Not authenticated' }, { status: 401 }));

  const row = await env.DB.prepare('SELECT phone FROM fa_phones WHERE email = ?').bind(session.nominator_email).first();
  return cors(Response.json({ phone: row?.phone || null }));
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const session = await getSession(env, request);
  if (!session) return cors(Response.json({ error: 'Not authenticated' }, { status: 401 }));

  const body = await request.json();
  const phone = (body.phone || '').trim();
  if (!phone) return cors(Response.json({ error: 'Phone required' }, { status: 400 }));

  await env.DB.prepare(
    "INSERT OR REPLACE INTO fa_phones (email, phone, updated_at) VALUES (?, ?, datetime('now'))"
  ).bind(session.nominator_email, phone).run();

  return cors(Response.json({ saved: true, phone }));
}
