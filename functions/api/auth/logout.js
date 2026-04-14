// POST /api/auth/logout — clear session cookie and delete from D1

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', r.headers.get('Origin') || '*');
  r.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  r.headers.set('Access-Control-Allow-Credentials', 'true');
  return r;
}
export async function onRequestOptions({ request }) {
  const r = new Response(null, { status: 204 });
  r.headers.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
  r.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  r.headers.set('Access-Control-Allow-Credentials', 'true');
  return r;
}

function parseSessionCookie(request) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)cs_admin_session=([^\s;]+)/);
  return match ? match[1] : null;
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const token = parseSessionCookie(request);

  if (token) {
    await env.DB.prepare('DELETE FROM admin_sessions WHERE token = ?').bind(token).run();
    // Also clean from fa_sessions
    await env.DB.prepare('DELETE FROM fa_sessions WHERE token = ?').bind(token).run();
  }

  const res = Response.json({ loggedOut: true });
  res.headers.set('Set-Cookie',
    'cs_admin_session=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
  );
  return cors(res);
}
