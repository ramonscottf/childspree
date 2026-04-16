// POST /api/receipts/:token — upload receipt photo (volunteer, token-gated)
// Receipt goes to R2, linked to assignment

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return r;
}

export async function onRequestOptions() {
  return cors(new Response(null, { status: 204 }));
}

export async function onRequestPost(context) {
  const { env, params, request } = context;
  const token = params.token;

  if (!token || token.length < 10) {
    return cors(Response.json({ error: 'Invalid token' }, { status: 400 }));
  }

  // Look up volunteer by token
  const vol = await env.DB.prepare('SELECT id FROM volunteers WHERE token = ?').bind(token).first();
  if (!vol) return cors(Response.json({ error: 'Volunteer not found' }, { status: 404 }));

  // Find their active assignment
  const assignment = await env.DB.prepare(
    'SELECT id, nomination_id FROM assignments WHERE volunteer_id = ? AND checked_out = 0 ORDER BY assigned_at DESC LIMIT 1'
  ).bind(vol.id).first();

  if (!assignment) {
    return cors(Response.json({ error: 'No active assignment found' }, { status: 404 }));
  }

  // Get the image data
  const contentType = request.headers.get('content-type') || '';
  let imageData;
  let ext = 'jpg';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('receipt') || formData.get('file') || formData.get('photo');
    if (!file) return cors(Response.json({ error: 'No file in form data' }, { status: 400 }));
    imageData = await file.arrayBuffer();
    const name = file.name || '';
    if (name.endsWith('.png')) ext = 'png';
    else if (name.endsWith('.webp')) ext = 'webp';
    else if (name.endsWith('.heic')) ext = 'heic';
  } else {
    imageData = await request.arrayBuffer();
    if (contentType.includes('png')) ext = 'png';
    else if (contentType.includes('webp')) ext = 'webp';
  }

  if (!imageData || imageData.byteLength === 0) {
    return cors(Response.json({ error: 'Empty file' }, { status: 400 }));
  }

  // Store in R2
  const key = `receipts/${assignment.nomination_id}/${Date.now()}.${ext}`;
  await env.VIDEOS.put(key, imageData, {
    httpMetadata: { contentType: contentType.includes('image') ? contentType : `image/${ext}` },
  });

  // Update assignment with receipt key
  const now = new Date().toISOString();
  await env.DB.prepare(
    'UPDATE assignments SET receipt_key = ?, receipt_uploaded_at = ? WHERE id = ?'
  ).bind(key, now, assignment.id).run();

  return cors(Response.json({ ok: true, key }));
}
