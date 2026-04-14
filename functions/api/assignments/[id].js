// PATCH /api/assignments/:id — update assignment (checkout, unassign)
// DELETE /api/assignments/:id — remove assignment (unassign child)
// Admin auth required

import { requireAdmin } from '../_admin_auth.js';

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'PATCH, DELETE, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Cookie');
  r.headers.set('Access-Control-Allow-Credentials', 'true');
  return r;
}

export async function onRequestOptions() {
  return cors(new Response(null, { status: 204 }));
}

export async function onRequestPatch(context) {
  const { env, request, params } = context;
  const authErr = await requireAdmin(env, request);
  if (authErr) return cors(authErr);

  const id = params.id;
  const body = await request.json();

  const assignment = await env.DB.prepare('SELECT * FROM assignments WHERE id = ?').bind(id).first();
  if (!assignment) return cors(Response.json({ error: 'Assignment not found' }, { status: 404 }));

  // Handle checkout
  if (body.action === 'checkout') {
    if (assignment.checked_out) {
      return cors(Response.json({ error: 'Already checked out' }, { status: 400 }));
    }
    await env.DB.prepare(
      'UPDATE assignments SET checked_out = 1, checkout_at = ?, notes = COALESCE(?, notes) WHERE id = ?'
    ).bind(new Date().toISOString(), body.notes || null, id).run();
    return cors(Response.json({ success: true, action: 'checked_out' }));
  }

  // Handle undo checkout
  if (body.action === 'undo_checkout') {
    await env.DB.prepare(
      'UPDATE assignments SET checked_out = 0, checkout_at = NULL WHERE id = ?'
    ).bind(id).run();
    return cors(Response.json({ success: true, action: 'undo_checkout' }));
  }

  // Generic update (notes, store_location)
  if (body.notes !== undefined) {
    await env.DB.prepare('UPDATE assignments SET notes = ? WHERE id = ?').bind(body.notes, id).run();
  }
  if (body.storeLocation !== undefined) {
    await env.DB.prepare('UPDATE assignments SET store_location = ? WHERE id = ?').bind(body.storeLocation, id).run();
  }

  return cors(Response.json({ success: true }));
}

export async function onRequestDelete(context) {
  const { env, request, params } = context;
  const authErr = await requireAdmin(env, request);
  if (authErr) return cors(authErr);

  const id = params.id;
  const assignment = await env.DB.prepare('SELECT * FROM assignments WHERE id = ?').bind(id).first();
  if (!assignment) return cors(Response.json({ error: 'Assignment not found' }, { status: 404 }));

  await env.DB.prepare('DELETE FROM assignments WHERE id = ?').bind(id).run();
  return cors(Response.json({ success: true, deleted: id }));
}
