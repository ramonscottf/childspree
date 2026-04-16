// POST /api/delivery/confirm — FA confirms bag delivery
// GET /api/delivery/status — delivery status for a nomination (public, by nomination_id query param)

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return r;
}
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

export async function onRequestOptions() {
  return cors(new Response(null, { status: 204 }));
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const nomId = url.searchParams.get('nomination_id');

  if (!nomId) return cors(Response.json({ error: 'nomination_id required' }, { status: 400 }));

  const nom = await env.DB.prepare(`
    SELECT n.child_first, n.school, n.grade, n.delivered_at, n.delivered_by,
           dc.confirmed_at, dc.confirmed_by, dc.photo_key, dc.notes
    FROM nominations n
    LEFT JOIN delivery_confirmations dc ON dc.nomination_id = n.id
    WHERE n.id = ?
  `).bind(nomId).first();

  if (!nom) return cors(Response.json({ error: 'Not found' }, { status: 404 }));

  return cors(Response.json({
    childFirst: nom.child_first,
    school: nom.school,
    grade: nom.grade,
    delivered: !!nom.delivered_at,
    deliveredAt: nom.delivered_at,
    confirmedAt: nom.confirmed_at,
    confirmedBy: nom.confirmed_by,
    hasPhoto: !!nom.photo_key,
  }));
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const contentType = request.headers.get('content-type') || '';

  let nominationId, confirmedBy, notes, photoData, photoExt;

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    nominationId = form.get('nomination_id');
    confirmedBy = form.get('confirmed_by') || 'FA';
    notes = form.get('notes') || '';
    const photoFile = form.get('photo');
    if (photoFile && photoFile.size > 0) {
      photoData = await photoFile.arrayBuffer();
      const name = photoFile.name || '';
      photoExt = name.endsWith('.png') ? 'png' : name.endsWith('.webp') ? 'webp' : 'jpg';
    }
  } else {
    const body = await request.json().catch(() => ({}));
    nominationId = body.nomination_id;
    confirmedBy = body.confirmed_by || 'FA';
    notes = body.notes || '';
  }

  if (!nominationId) return cors(Response.json({ error: 'nomination_id required' }, { status: 400 }));

  // Verify nomination exists
  const nom = await env.DB.prepare('SELECT id, school FROM nominations WHERE id = ?').bind(nominationId).first();
  if (!nom) return cors(Response.json({ error: 'Nomination not found' }, { status: 404 }));

  // Upload photo if provided
  let photoKey = null;
  if (photoData) {
    photoKey = `delivery/${nominationId}/${Date.now()}.${photoExt}`;
    await env.VIDEOS.put(photoKey, photoData, {
      httpMetadata: { contentType: `image/${photoExt}` },
    });
  }

  const now = new Date().toISOString();
  const id = generateId();

  // Upsert delivery confirmation
  await env.DB.prepare(`
    INSERT INTO delivery_confirmations (id, nomination_id, confirmed_by, confirmed_at, photo_key, school, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(nomination_id) DO UPDATE SET
      confirmed_by = excluded.confirmed_by,
      confirmed_at = excluded.confirmed_at,
      photo_key = COALESCE(excluded.photo_key, delivery_confirmations.photo_key),
      notes = excluded.notes
  `).bind(id, nominationId, confirmedBy, now, photoKey, nom.school, notes).run();

  // Update nomination status
  await env.DB.prepare(
    'UPDATE nominations SET delivered_at = ?, delivered_by = ?, delivery_photo_key = COALESCE(?, delivery_photo_key) WHERE id = ?'
  ).bind(now, confirmedBy, photoKey, nominationId).run();

  return cors(Response.json({ ok: true, delivered: true }));
}
