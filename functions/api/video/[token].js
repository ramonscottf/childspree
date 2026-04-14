// GET /api/video/:token — public, token-gated video stream from R2
// Streams the child's video for the volunteer shopper.
// Supports Range requests for seeking in video player.

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Range');
  return r;
}

export async function onRequestOptions() {
  return cors(new Response(null, { status: 204 }));
}

export async function onRequestGet(context) {
  const { env, params, request } = context;
  const token = params.token;

  if (!token || token.length < 6) {
    return cors(Response.json({ error: 'Invalid token' }, { status: 400 }));
  }

  // Look up nomination + intake to get video_key
  const row = await env.DB.prepare(`
    SELECT n.id, i.video_key, i.video_uploaded
    FROM nominations n
    JOIN parent_intake i ON i.nomination_id = n.id
    WHERE n.parent_token = ? AND n.status = 'complete'
  `).bind(token).first();

  if (!row) {
    return cors(Response.json({ error: 'Not found' }, { status: 404 }));
  }

  if (!row.video_key || !row.video_uploaded) {
    return cors(Response.json({ error: 'No video available for this child' }, { status: 404 }));
  }

  // Fetch from R2
  const object = await env.VIDEOS.get(row.video_key);

  if (!object) {
    return cors(Response.json({ error: 'Video file not found' }, { status: 404 }));
  }

  const contentType = object.httpMetadata?.contentType || 'video/mp4';
  const size = object.size;

  // Handle Range requests for video seeking
  const rangeHeader = request.headers.get('Range');

  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : size - 1;
      const chunkSize = end - start + 1;

      // R2 supports range reads via offset/length on get()
      const rangeObject = await env.VIDEOS.get(row.video_key, {
        range: { offset: start, length: chunkSize },
      });

      if (!rangeObject) {
        return cors(new Response('Range not satisfiable', { status: 416 }));
      }

      const resp = new Response(rangeObject.body, {
        status: 206,
        headers: {
          'Content-Type': contentType,
          'Content-Length': chunkSize.toString(),
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600',
        },
      });
      return cors(resp);
    }
  }

  // Full response
  const resp = new Response(object.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': size.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600',
    },
  });
  return cors(resp);
}
