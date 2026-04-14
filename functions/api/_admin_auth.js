// functions/api/_admin_auth.js
// Shared auth middleware for admin-only routes.
// Validates admin session cookie set by POST /api/auth/session.

const ADMIN_EMAILS = [
  'sfoster@dsdmail.net',
  'ktoone@dsdmail.net',
  'kbuchi@dsdmail.net',
];

export function getAdminEmails(env) {
  // Allow override via env var, but always include the hardcoded list
  const extra = (env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  return [...new Set([...ADMIN_EMAILS, ...extra])];
}

function parseSessionCookie(request) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)cs_admin_session=([^\s;]+)/);
  return match ? match[1] : null;
}

// Returns session object { email, role, display_name } or null
export async function getAdminSession(env, request) {
  const token = parseSessionCookie(request);
  if (!token) return null;

  const session = await env.DB.prepare(
    'SELECT email, role, display_name FROM admin_sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first();

  return session || null;
}

// Middleware: returns 401 Response if not authenticated, or null if OK
export async function requireAdmin(env, request) {
  const session = await getAdminSession(env, request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const admins = getAdminEmails(env);
  if (!admins.includes(session.email.toLowerCase())) {
    return new Response(JSON.stringify({ error: 'Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null; // authenticated
}

// For routes that allow any staff (admin or FA)
export async function requireStaff(env, request) {
  const session = await getAdminSession(env, request);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}
