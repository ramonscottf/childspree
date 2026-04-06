// functions/api/volunteers/[id].js
// PATCH — update status or notes

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return r;
}
export async function onRequestOptions() { return cors(new Response(null, { status: 204 })); }

export async function onRequestPatch(context) {
  const { env, params, request } = context;
  const body = await request.json();
  const fields = [], vals = [];
  if (body.status) { fields.push('status = ?'); vals.push(body.status); }
  if (body.notes !== undefined) { fields.push('notes = ?'); vals.push(body.notes); }
  if (!fields.length) return cors(Response.json({ error: 'Nothing to update' }, { status: 400 }));
  fields.push('updated_at = ?'); vals.push(new Date().toISOString());
  vals.push(params.id);
  await env.DB.prepare(`UPDATE volunteers SET ${fields.join(', ')} WHERE id = ?`).bind(...vals).run();
  return cors(Response.json({ id: params.id, updated: true }));
}
