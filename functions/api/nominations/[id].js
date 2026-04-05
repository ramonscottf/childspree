// GET /api/nominations/:id — get single nomination
// PATCH /api/nominations/:id — update status (approve, decline, send)

function cors(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

export async function onRequestOptions() {
  return cors(new Response(null, { status: 204 }));
}

export async function onRequestGet(context) {
  const { env, params } = context;
  const id = params.id;

  const nom = await env.DB.prepare('SELECT * FROM nominations WHERE id = ?').bind(id).first();
  if (!nom) return cors(Response.json({ error: 'Not found' }, { status: 404 }));

  const intake = await env.DB.prepare('SELECT * FROM parent_intake WHERE nomination_id = ?').bind(id).first();

  return cors(Response.json({
    id: nom.id,
    status: nom.status,
    parentToken: nom.parent_token,
    childFirst: nom.child_first,
    childLast: nom.child_last,
    school: nom.school,
    grade: nom.grade,
    nominatorName: nom.nominator_name,
    nominatorRole: nom.nominator_role,
    nominatorEmail: nom.nominator_email,
    parentName: nom.parent_name,
    parentPhone: nom.parent_phone,
    parentEmail: nom.parent_email,
    reason: nom.reason,
    siblings: nom.siblings,
    createdAt: nom.created_at,
    parentIntake: intake ? {
      shirtSize: intake.shirt_size,
      pantSize: intake.pant_size,
      shoeSize: intake.shoe_size,
      favoriteColors: intake.favorite_colors,
      avoidColors: intake.avoid_colors,
      allergies: intake.allergies,
      preferences: intake.preferences,
      hasVideo: !!intake.video_uploaded,
    } : null,
  }));
}

export async function onRequestPatch(context) {
  const { env, params, request } = context;
  const id = params.id;
  const body = await request.json();

  const nom = await env.DB.prepare('SELECT * FROM nominations WHERE id = ?').bind(id).first();
  if (!nom) return cors(Response.json({ error: 'Not found' }, { status: 404 }));

  const validTransitions = {
    pending: ['approved', 'declined'],
    approved: ['sent', 'declined'],
    sent: ['complete'],
    declined: ['pending'],
  };

  if (body.status) {
    const allowed = validTransitions[nom.status] || [];
    if (!allowed.includes(body.status)) {
      return cors(Response.json({
        error: `Cannot transition from ${nom.status} to ${body.status}`
      }, { status: 400 }));
    }

    const now = new Date().toISOString();
    let extraSql = '';
    if (body.status === 'approved') extraSql = ', approved_at = ?';
    if (body.status === 'sent') extraSql = ', sent_at = ?';
    if (body.status === 'complete') extraSql = ', completed_at = ?';

    const query = `UPDATE nominations SET status = ?, updated_at = ?${extraSql} WHERE id = ?`;
    const binds = [body.status, now];
    if (extraSql) binds.push(now);
    binds.push(id);

    await env.DB.prepare(query).bind(...binds).run();
  }

  return cors(Response.json({ id, status: body.status, updated: true }));
}
