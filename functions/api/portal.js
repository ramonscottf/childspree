// functions/api/portal.js
// POST /api/portal/login — FA enters email, get session token
// GET  /api/portal/dashboard — FA sees their nominations

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

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/portal', '');

  if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

  // POST /api/portal/login
  if (path === '/login' && request.method === 'POST') {
    const { email } = await request.json();
    if (!email) return cors(Response.json({ error: 'Email required' }, { status: 400 }));

    const norm = email.toLowerCase().trim();

    // Check family_advocates registry OR existing nominations
    const faRecord = await env.DB.prepare(
      "SELECT first_name, last_name, school, languages FROM family_advocates WHERE LOWER(email) = ?"
    ).bind(norm).first();

    const nomCheck = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM nominations WHERE LOWER(nominator_email) = ?"
    ).bind(norm).first();

    const isSSOLogin = body.sso === true;
    const isDSDEmail = norm.endsWith('@dsdmail.net');

    // SSO logins from @dsdmail.net are always allowed — Microsoft already authenticated them
    if (!isSSOLogin && !faRecord && (!nomCheck || nomCheck.count === 0)) {
      return cors(Response.json({
        error: 'Email not found. Please use your @dsdmail.net school email address.',
        notFound: true,
      }, { status: 404 }));
    }

    // Non-DSD emails that aren't in FA registry and have no nominations — reject even with SSO
    if (isSSOLogin && !isDSDEmail && !faRecord && (!nomCheck || nomCheck.count === 0)) {
      return cors(Response.json({
        error: 'This email is not registered for Child Spree.',
        notFound: true,
      }, { status: 404 }));
    }

    // Create session token (7 day expiry)
    const token = generateToken();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare(
      'INSERT INTO fa_sessions (token, nominator_email, expires_at) VALUES (?, ?, ?)'
    ).bind(token, norm, expires).run();

    const displayName = body.name || (faRecord ? faRecord.first_name + ' ' + faRecord.last_name : null);
    return cors(Response.json({ token, email: norm, name: displayName, school: faRecord?.school, languages: faRecord?.languages }));
  }

  // GET /api/portal/dashboard
  if (path === '/dashboard' && request.method === 'GET') {
    const token = request.headers.get('X-FA-Token');
    if (!token) return cors(Response.json({ error: 'Not authenticated' }, { status: 401 }));

    // Validate session
    const session = await env.DB.prepare(
      'SELECT * FROM fa_sessions WHERE token = ? AND expires_at > datetime("now")'
    ).bind(token).first();
    if (!session) return cors(Response.json({ error: 'Session expired. Please log in again.' }, { status: 401 }));

    const email = session.nominator_email;
    // Look up FA registry for display name and school
    const faInfo = await env.DB.prepare("SELECT first_name, last_name, school FROM family_advocates WHERE LOWER(email) = ?").bind(email).first();

    // Get all nominations with intake status
    const { results } = await env.DB.prepare(`
      SELECT
        n.id, n.child_first, n.child_last, n.school, n.grade,
        n.parent_name, n.parent_phone, n.parent_email,
        n.status, n.created_at, n.sibling_count,
        n.nominator_name,
        pi.id as intake_id,
        pi.shirt_size, pi.pant_size, pi.shoe_size,
        pi.gender, pi.department,
        pi.parent_consent, pi.video_uploaded,
        pi.language, pi.created_at as intake_submitted_at
      FROM nominations n
      LEFT JOIN parent_intake pi ON n.id = pi.nomination_id
      WHERE LOWER(n.nominator_email) = ?
      ORDER BY n.created_at DESC
    `).bind(email).all();

    const nominations = results.map(r => ({
      id: r.id,
      childFirst: r.child_first,
      childLast: r.child_last,
      school: r.school,
      grade: r.grade,
      parentName: r.parent_name,
      parentPhone: r.parent_phone,
      parentEmail: r.parent_email,
      status: r.status,
      createdAt: r.created_at,
      siblingCount: r.sibling_count || 0,
      nominatorName: r.nominator_name,
      intake: r.intake_id ? {
        submitted: true,
        submittedAt: r.intake_submitted_at,
        shirtSize: r.shirt_size,
        pantSize: r.pant_size,
        shoeSize: r.shoe_size,
        gender: r.gender,
        department: r.department,
        consent: !!r.parent_consent,
        videoRecorded: !!r.video_uploaded,
        language: r.language || 'en',
      } : { submitted: false, consent: false, videoRecorded: false },
    }));

    // Summary stats
    const total = nominations.length;
    const intakeComplete = nominations.filter(n => n.intake.submitted).length;
    const consented = nominations.filter(n => n.intake.consent).length;
    const needsVideo = nominations.filter(n => n.intake.submitted && !n.intake.videoRecorded).length;
    const awaitingParent = nominations.filter(n => n.status === 'sent' && !n.intake.submitted).length;
    const pending = nominations.filter(n => n.status === 'pending' || n.status === 'approved').length;

    return cors(Response.json({
      email, nominatorName: faInfo ? faInfo.first_name + ' ' + faInfo.last_name : (results[0]?.nominator_name || email), faSchool: faInfo?.school,
      stats: { total, intakeComplete, consented, needsVideo, awaitingParent, pending },
      nominations,
    }));
  }

  return cors(Response.json({ error: 'Not found' }, { status: 404 }));
}
