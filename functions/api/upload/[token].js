// POST /api/upload/:token — upload parent video to R2

function cors(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
}

export async function onRequestOptions() {
  return cors(new Response(null, { status: 204 }));
}

export async function onRequestPost(context) {
  const { env, params, request } = context;
  const token = params.token;

  // Verify token
  const nom = await env.DB.prepare(
    'SELECT id, child_first, child_last FROM nominations WHERE parent_token = ?'
  ).bind(token).first();

  if (!nom) {
    return cors(Response.json({ error: 'Invalid link' }, { status: 404 }));
  }

  // Get the file from form data
  const formData = await request.formData();
  const file = formData.get('video');

  if (!file) {
    return cors(Response.json({ error: 'No video file provided' }, { status: 400 }));
  }

  // Max 50MB
  if (file.size > 50 * 1024 * 1024) {
    return cors(Response.json({ error: 'Video must be under 50MB' }, { status: 400 }));
  }

  // Upload to R2
  const ext = file.name?.split('.').pop() || 'mp4';
  const key = `videos/${nom.id}/${Date.now()}.${ext}`;

  await env.VIDEOS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || 'video/mp4' },
    customMetadata: {
      nominationId: nom.id,
      childName: `${nom.child_first} ${nom.child_last}`,
      uploadedAt: new Date().toISOString(),
    },
  });

  // Update parent_intake with video key
  await env.DB.prepare(
    'UPDATE parent_intake SET video_key = ?, video_uploaded = 1 WHERE nomination_id = ?'
  ).bind(key, nom.id).run();

  return cors(Response.json({ uploaded: true, key }));
}
