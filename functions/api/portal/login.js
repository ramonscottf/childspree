// POST /api/portal/login — FA enters email, get session token

function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let t = '';
  for (let i = 0; i < 32; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}
function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-FA-Token');
  return r;
}
export async function onRequestOptions() { return cors(new Response(null, { status: 204 })); }

export async function onRequestPost(context) {
  const { env, request } = context;
  const body = await request.json();
  const { email, sso, name: bodyName, phone } = body;
  if (!email) return cors(Response.json({ error: 'Email required' }, { status: 400 }));

  const norm = email.toLowerCase().trim();

  const faRecord = await env.DB.prepare(
    "SELECT first_name, last_name, school, languages FROM family_advocates WHERE LOWER(email) = ?"
  ).bind(norm).first();

  const nomCheck = await env.DB.prepare(
    "SELECT COUNT(*) as count FROM nominations WHERE LOWER(nominator_email) = ?"
  ).bind(norm).first();

  const isSSOLogin = sso === true;
  const isDSDEmail = norm.endsWith('@dsdmail.net');

  if (!isSSOLogin && !faRecord && (!nomCheck || nomCheck.count === 0)) {
    return cors(Response.json({
      error: 'Email not found. Please use your @dsdmail.net school email address.',
      notFound: true,
    }, { status: 404 }));
  }

  if (isSSOLogin && !isDSDEmail && !faRecord && (!nomCheck || nomCheck.count === 0)) {
    return cors(Response.json({
      error: 'This email is not registered for Child Spree.',
      notFound: true,
    }, { status: 404 }));
  }

  const token = generateToken();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await env.DB.prepare(
    'INSERT INTO fa_sessions (token, nominator_email, expires_at) VALUES (?, ?, ?)'
  ).bind(token, norm, expires).run();

  // Store phone number if provided (update FA record or nominations)
  if (phone && phone.trim()) {
    const cleanPhone = phone.trim();
    if (faRecord) {
      await env.DB.prepare("UPDATE family_advocates SET phone = ? WHERE LOWER(email) = ?").bind(cleanPhone, norm).run();
    }
    // Also store in a lightweight lookup for SMS notifications
    await env.DB.prepare(
      "INSERT OR REPLACE INTO fa_phones (email, phone, updated_at) VALUES (?, ?, datetime('now'))"
    ).bind(norm, cleanPhone).run();
  }

  const displayName = bodyName || (faRecord ? faRecord.first_name + ' ' + faRecord.last_name : null);
  return cors(Response.json({ token, email: norm, name: displayName, school: faRecord?.school, languages: faRecord?.languages }));
}
