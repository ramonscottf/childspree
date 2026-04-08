// functions/api/fa/video/[nominationId].js — mark video uploaded for FA-recorded video

function cors(r) { r.headers.set('Access-Control-Allow-Origin','*'); r.headers.set('Access-Control-Allow-Methods','POST,OPTIONS'); r.headers.set('Access-Control-Allow-Headers','Content-Type'); return r; }
export async function onRequestOptions() { return cors(new Response(null,{status:204})); }

export async function onRequestPost(context) {
  const { env, params } = context;
  const nom = await env.DB.prepare('SELECT * FROM nominations WHERE id=?').bind(params.nominationId).first();
  if (!nom) return cors(Response.json({ error: 'Not found' }, { status: 404 }));

  // Mark video_uploaded on parent_intake (create if doesn't exist yet)
  const existing = await env.DB.prepare('SELECT id FROM parent_intake WHERE nomination_id=?').bind(params.nominationId).first();
  if (existing) {
    await env.DB.prepare('UPDATE parent_intake SET video_uploaded=1 WHERE nomination_id=?').bind(params.nominationId).run();
  } else {
    const id = Date.now().toString(36) + Math.random().toString(36).substr(2,8);
    await env.DB.prepare('INSERT INTO parent_intake (id, nomination_id, video_uploaded) VALUES (?,?,1)').bind(id, params.nominationId).run();
  }
  return cors(Response.json({ ok: true }));
}
