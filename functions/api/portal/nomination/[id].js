// GET /api/portal/nomination/:id — get single nomination details
// PATCH /api/portal/nomination/:id — FA updates intake data (sizes, colors, etc.)
// Requires X-FA-Token session header

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
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
  const { env, params, request } = context;
  const session = await getSession(env, request);
  if (!session) return cors(Response.json({ error: 'Not authenticated' }, { status: 401 }));

  const nom = await env.DB.prepare(`
    SELECT n.id, n.child_first, n.child_last, n.school, n.grade, n.parent_token, n.status,
           pi.video_uploaded, pi.shirt_size, pi.pant_size, pi.shoe_size,
           pi.favorite_colors, pi.avoid_colors, pi.allergies, pi.preferences,
           pi.gender, pi.department, pi.video_key
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
    videoKey: nom.video_key || null,
    intake: nom.shirt_size ? {
      shirtSize: nom.shirt_size,
      pantSize: nom.pant_size,
      shoeSize: nom.shoe_size,
      favoriteColors: nom.favorite_colors,
      avoidColors: nom.avoid_colors,
      allergies: nom.allergies,
      preferences: nom.preferences,
      gender: nom.gender,
      department: nom.department,
    } : null,
  }));
}

export async function onRequestPatch(context) {
  const { env, params, request } = context;
  const session = await getSession(env, request);
  if (!session) return cors(Response.json({ error: 'Not authenticated' }, { status: 401 }));

  // Verify nomination belongs to this FA
  const nom = await env.DB.prepare(
    'SELECT id FROM nominations WHERE id = ? AND LOWER(nominator_email) = ?'
  ).bind(params.id, session.nominator_email).first();
  if (!nom) return cors(Response.json({ error: 'Nomination not found' }, { status: 404 }));

  const body = await request.json();

  // Update nomination-level fields
  const nomFields = [];
  const nomValues = [];
  if (body.childFirst !== undefined) { nomFields.push('child_first = ?'); nomValues.push(body.childFirst); }
  if (body.childLast !== undefined) { nomFields.push('child_last = ?'); nomValues.push(body.childLast); }
  if (body.parentName !== undefined) { nomFields.push('parent_name = ?'); nomValues.push(body.parentName); }
  if (body.parentPhone !== undefined) { nomFields.push('parent_phone = ?'); nomValues.push(body.parentPhone); }
  if (body.parentEmail !== undefined) { nomFields.push('parent_email = ?'); nomValues.push(body.parentEmail); }
  if (body.parentLanguage !== undefined) { nomFields.push('parent_language = ?'); nomValues.push(body.parentLanguage); }
  if (body.school !== undefined) { nomFields.push('school = ?'); nomValues.push(body.school); }
  if (body.grade !== undefined && body.grade !== '') { nomFields.push('grade = ?'); nomValues.push(body.grade); }
  if (body.reason !== undefined) { nomFields.push('reason = ?'); nomValues.push(body.reason); }
  if (body.additionalNotes !== undefined) { nomFields.push('additional_notes = ?'); nomValues.push(body.additionalNotes); }

  if (nomFields.length > 0) {
    nomFields.push('updated_at = ?'); nomValues.push(new Date().toISOString());
    nomValues.push(params.id);
    await env.DB.prepare(
      `UPDATE nominations SET ${nomFields.join(', ')} WHERE id = ?`
    ).bind(...nomValues).run();
  }

  // Check if intake record exists
  const existing = await env.DB.prepare(
    'SELECT id FROM parent_intake WHERE nomination_id = ?'
  ).bind(params.id).first();

  if (existing) {
    const fields = [];
    const values = [];
    if (body.shirtSize !== undefined) { fields.push('shirt_size = ?'); values.push(body.shirtSize); }
    if (body.pantSize !== undefined) { fields.push('pant_size = ?'); values.push(body.pantSize); }
    if (body.shoeSize !== undefined) { fields.push('shoe_size = ?'); values.push(body.shoeSize); }
    if (body.favoriteColors !== undefined) { fields.push('favorite_colors = ?'); values.push(body.favoriteColors); }
    if (body.avoidColors !== undefined) { fields.push('avoid_colors = ?'); values.push(body.avoidColors); }
    if (body.allergies !== undefined) { fields.push('allergies = ?'); values.push(body.allergies); }
    if (body.preferences !== undefined) { fields.push('preferences = ?'); values.push(body.preferences); }
    if (body.gender !== undefined) { fields.push('gender = ?'); values.push(body.gender); }
    if (body.department !== undefined) { fields.push('department = ?'); values.push(body.department); }

    if (fields.length > 0) {
      values.push(params.id);
      await env.DB.prepare(
        `UPDATE parent_intake SET ${fields.join(', ')} WHERE nomination_id = ?`
      ).bind(...values).run();
    }
  }

  return cors(Response.json({ updated: true }));
}
