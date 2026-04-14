// GET /api/portal/dashboard — FA sees their nominations

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-FA-Token');
  return r;
}
export async function onRequestOptions() { return cors(new Response(null, { status: 204 })); }

export async function onRequestGet(context) {
  const { env, request } = context;
  const token = request.headers.get('X-FA-Token');
  if (!token) return cors(Response.json({ error: 'Not authenticated' }, { status: 401 }));

  const session = await env.DB.prepare(
    'SELECT * FROM fa_sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first();
  if (!session) return cors(Response.json({ error: 'Session expired. Please log in again.' }, { status: 401 }));

  const email = session.nominator_email;
  const faInfo = await env.DB.prepare("SELECT first_name, last_name, school FROM family_advocates WHERE LOWER(email) = ?").bind(email).first();

  const { results } = await env.DB.prepare(`
    SELECT
      n.id, n.child_first, n.child_last, n.school, n.grade,
      n.parent_name, n.parent_phone, n.parent_email, n.parent_language,
      n.status, n.created_at, n.sibling_count, n.reason, n.additional_notes,
      n.nominator_name,
      pi.id as intake_id,
      pi.shirt_size, pi.pant_size, pi.shoe_size,
      pi.gender, pi.department,
      pi.parent_consent, pi.video_uploaded,
      pi.favorite_colors, pi.avoid_colors, pi.allergies, pi.preferences,
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
    parentLanguage: r.parent_language || 'en',
    status: r.status,
    createdAt: r.created_at,
    siblingCount: r.sibling_count || 0,
    reason: r.reason || '',
    additionalNotes: r.additional_notes || '',
    nominatorName: r.nominator_name,
    intake: r.intake_id ? {
      submitted: true,
      submittedAt: r.intake_submitted_at,
      shirtSize: r.shirt_size,
      pantSize: r.pant_size,
      shoeSize: r.shoe_size,
      gender: r.gender,
      department: r.department,
      favoriteColors: r.favorite_colors || '',
      avoidColors: r.avoid_colors || '',
      allergies: r.allergies || '',
      preferences: r.preferences || '',
      consent: !!r.parent_consent,
      videoRecorded: !!r.video_uploaded,
      language: r.language || 'en',
    } : { submitted: false, consent: false, videoRecorded: false },
  }));

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
