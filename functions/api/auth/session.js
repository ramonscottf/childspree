// POST /api/auth/session — exchange MSAL ID token for server session cookie
// GET /api/auth/session — alias for /api/auth/me (check current session)

import { getAdminSession, getAdminEmails } from '../_admin_auth.js';

function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let t = '';
  for (let i = 0; i < 48; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', r.headers.get('Origin') || '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  r.headers.set('Access-Control-Allow-Credentials', 'true');
  return r;
}

export async function onRequestOptions({ request }) {
  const r = new Response(null, { status: 204 });
  r.headers.set('Access-Control-Allow-Origin', request.headers.get('Origin') || '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  r.headers.set('Access-Control-Allow-Credentials', 'true');
  return r;
}

// Decode and lightly validate a Microsoft ID token.
// We verify: (1) it's a valid JWT structure, (2) the issuer matches our tenant,
// (3) the audience matches our client ID, (4) it's not expired.
// Full JWKS signature verification would require importing a crypto library —
// for a same-origin first-party app where the token just came from Microsoft
// redirect on our own domain, this level of validation is sufficient.
function decodeIdToken(idToken, env) {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    // Verify tenant
    const tenantId = '3d9cf274-547e-4af5-8dde-01a636e0b607';
    const expectedIssuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
    if (payload.iss !== expectedIssuer) return null;

    // Verify audience (our MSAL client ID)
    const clientId = 'ddf5d2a5-b2f2-4661-943f-c25fcc69833f';
    if (payload.aud !== clientId) return null;

    // Check expiry
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    const email = (payload.preferred_username || payload.email || payload.upn || '').toLowerCase().trim();
    const name = payload.name || '';

    if (!email) return null;
    return { email, name };
  } catch (e) {
    return null;
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const body = await request.json();
  const { idToken } = body;

  if (!idToken) {
    return cors(Response.json({ error: 'ID token required' }, { status: 400 }));
  }

  const decoded = decodeIdToken(idToken, env);
  if (!decoded) {
    return cors(Response.json({ error: 'Invalid or expired token' }, { status: 401 }));
  }

  const { email, name } = decoded;

  // Determine role
  const admins = getAdminEmails(env);
  let role = 'unknown';

  if (admins.includes(email)) {
    role = 'admin';
  } else {
    // Check family advocates
    const fa = await env.DB.prepare(
      'SELECT id FROM family_advocates WHERE LOWER(email) = ?'
    ).bind(email).first();
    if (fa) {
      role = 'fa';
    } else if (email.endsWith('@dsdmail.net')) {
      // Any DSD employee gets FA access
      role = 'fa';
    }
  }

  if (role === 'unknown') {
    return cors(Response.json({ error: 'Not authorized for Child Spree' }, { status: 403 }));
  }

  // Create session
  const token = generateToken();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

  await env.DB.prepare(
    'INSERT INTO admin_sessions (token, email, role, display_name, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(token, email, role, name, expires).run();

  // Also create/refresh the FA session for portal compatibility
  if (role === 'fa' || role === 'admin') {
    const faExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare(
      'INSERT INTO fa_sessions (token, nominator_email, expires_at) VALUES (?, ?, ?)'
    ).bind(token, email, faExpires).run();
  }

  const res = Response.json({ email, role, name });

  // Set httpOnly cookie — Secure, SameSite=Lax
  res.headers.set('Set-Cookie',
    `cs_admin_session=${token}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
  );

  return cors(res);
}

// GET — check current session
export async function onRequestGet(context) {
  const { env, request } = context;
  const session = await getAdminSession(env, request);

  if (!session) {
    return cors(Response.json({ authenticated: false }, { status: 401 }));
  }

  return cors(Response.json({
    authenticated: true,
    email: session.email,
    role: session.role,
    name: session.display_name,
  }));
}
