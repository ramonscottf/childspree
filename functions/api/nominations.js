// GET /api/nominations — list all nominations (admin)
// POST /api/nominations — create a new nomination (counselor/teacher)

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

function generateToken() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 12; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}

function cors(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function onRequestOptions() {
  return cors(new Response(null, { status: 204 }));
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const school = url.searchParams.get('school');
  const search = url.searchParams.get('search');

  let query = 'SELECT n.*, pi.shirt_size, pi.pant_size, pi.shoe_size, pi.favorite_colors, pi.avoid_colors, pi.allergies, pi.preferences as intake_preferences, pi.video_uploaded FROM nominations n LEFT JOIN parent_intake pi ON n.id = pi.nomination_id WHERE 1=1';
  const params = [];

  if (status && status !== 'all') {
    query += ' AND n.status = ?';
    params.push(status);
  }
  if (school) {
    query += ' AND n.school = ?';
    params.push(school);
  }
  if (search) {
    query += ' AND (n.child_first LIKE ? OR n.child_last LIKE ? OR n.school LIKE ? OR n.nominator_name LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  query += ' ORDER BY n.created_at DESC';

  const { results } = await env.DB.prepare(query).bind(...params).all();

  const nominations = results.map(r => ({
    id: r.id,
    status: r.status,
    parentToken: r.parent_token,
    childFirst: r.child_first,
    childLast: r.child_last,
    school: r.school,
    grade: r.grade,
    nominatorName: r.nominator_name,
    nominatorRole: r.nominator_role,
    nominatorEmail: r.nominator_email,
    parentName: r.parent_name,
    parentPhone: r.parent_phone,
    parentEmail: r.parent_email,
    reason: r.reason,
    siblings: r.siblings,
    additionalNotes: r.additional_notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    parentIntake: r.shirt_size ? {
      shirtSize: r.shirt_size,
      pantSize: r.pant_size,
      shoeSize: r.shoe_size,
      favoriteColors: r.favorite_colors,
      avoidColors: r.avoid_colors,
      allergies: r.allergies,
      preferences: r.intake_preferences,
      hasVideo: !!r.video_uploaded,
    } : null,
  }));

  return cors(Response.json({ nominations, total: nominations.length }));
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const body = await request.json();

  const required = ['childFirst', 'childLast', 'school', 'grade', 'nominatorName', 'nominatorEmail', 'parentName'];
  for (const field of required) {
    if (!body[field]) {
      return cors(Response.json({ error: `Missing required field: ${field}` }, { status: 400 }));
    }
  }

  if (!body.parentPhone && !body.parentEmail) {
    return cors(Response.json({ error: 'Parent needs at least a phone or email' }, { status: 400 }));
  }

  const id = generateId();
  const token = generateToken();

  await env.DB.prepare(`
    INSERT INTO nominations (id, parent_token, child_first, child_last, school, grade,
      nominator_name, nominator_role, nominator_email,
      parent_name, parent_phone, parent_email,
      reason, siblings, additional_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id, token,
    body.childFirst, body.childLast, body.school, body.grade,
    body.nominatorName, body.nominatorRole || 'Teacher', body.nominatorEmail,
    body.parentName, body.parentPhone || null, body.parentEmail || null,
    body.reason || null, body.siblings || null, body.additionalNotes || null
  ).run();

  return cors(Response.json({ id, parentToken: token, status: 'pending' }, { status: 201 }));
}
