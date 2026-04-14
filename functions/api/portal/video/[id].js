// GET /api/portal/video/:id — stream video from R2 for FA to watch
// DELETE /api/portal/video/:id — delete video from R2 and reset D1 flag

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-FA-Token');
  return r;
}
export async function onRequestOptions() { return cors(new Response(null, { status: 204 })); }

async function getSession(env, request) {
  // Accept token from header OR query param (video player can't send headers)
  let token = request.headers.get('X-FA-Token');
  if (!token) {
    const url = new URL(request.url);
    token = url.searchParams.get('t');
  }
  if (!token) return null;
  return env.DB.prepare(
    'SELECT * FROM fa_sessions WHERE token = ? AND expires_at > datetime("now")'
  ).bind(token).first();
}

async function verifyOwnership(env, nominationId, email) {
  // FA must own this nomination, OR be admin
  const nom = await env.DB.prepare(
    'SELECT id, child_first FROM nominations WHERE id = ? AND LOWER(nominator_email) = ?'
  ).bind(nominationId, email).first();
  return nom;
}

export async function onRequestGet(context) {
  const { env, params, request } = context;
  const session = await getSession(env, request);
  if (!session) return cors(new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } }));

  const nom = await verifyOwnership(env, params.id, session.nominator_email);
  if (!nom) return cors(new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } }));

  // Get video key from parent_intake
  const intake = await env.DB.prepare(
    'SELECT video_key FROM parent_intake WHERE nomination_id = ?'
  ).bind(params.id).first();

  if (!intake?.video_key) {
    return cors(new Response(JSON.stringify({ error: 'No video found' }), { status: 404, headers: { 'Content-Type': 'application/json' } }));
  }

  // Stream from R2
  const obj = await env.VIDEOS.get(intake.video_key);
  if (!obj) {
    return cors(new Response(JSON.stringify({ error: 'Video file not found in storage' }), { status: 404, headers: { 'Content-Type': 'application/json' } }));
  }

  const headers = new Headers();
  headers.set('Content-Type', obj.httpMetadata?.contentType || 'video/mp4');
  headers.set('Cache-Control', 'private, max-age=3600');
  headers.set('Accept-Ranges', 'bytes');
  // Handle range requests for video seeking
  const range = request.headers.get('Range');
  if (range && obj.size) {
    const match = range.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1]);
      const end = match[2] ? parseInt(match[2]) : obj.size - 1;
      const chunk = end - start + 1;
      headers.set('Content-Range', `bytes ${start}-${end}/${obj.size}`);
      headers.set('Content-Length', String(chunk));
      // R2 supports range via .get with range option
      const rangeObj = await env.VIDEOS.get(intake.video_key, { range: { offset: start, length: chunk } });
      return new Response(rangeObj.body, { status: 206, headers });
    }
  }
  if (obj.size) headers.set('Content-Length', String(obj.size));
  return new Response(obj.body, { headers });
}

export async function onRequestDelete(context) {
  const { env, params, request } = context;
  const session = await getSession(env, request);
  if (!session) return cors(Response.json({ error: 'Not authenticated' }, { status: 401 }));

  const nom = await verifyOwnership(env, params.id, session.nominator_email);
  if (!nom) return cors(Response.json({ error: 'Not found' }, { status: 404 }));

  // Get video key
  const intake = await env.DB.prepare(
    'SELECT video_key FROM parent_intake WHERE nomination_id = ?'
  ).bind(params.id).first();

  if (intake?.video_key) {
    // Delete from R2
    try {
      await env.VIDEOS.delete(intake.video_key);
    } catch (e) {
      console.error('R2 delete error:', e);
    }
  }

  // Reset D1 flags
  await env.DB.prepare(
    'UPDATE parent_intake SET video_key = NULL, video_uploaded = 0 WHERE nomination_id = ?'
  ).bind(params.id).run();

  return cors(Response.json({ deleted: true }));
}
