// functions/api/volunteers/[id].js
// PATCH  — quick status/notes update (admin only)
// PUT    — full edit of volunteer record (admin only)
// DELETE — remove volunteer record (admin only)

import { requireAdmin } from '../_admin_auth.js';

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, PUT, DELETE, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return r;
}
export async function onRequestOptions() { return cors(new Response(null, { status: 204 })); }

export async function onRequestPatch(context) {
  const { env, params, request } = context;
  const denied = await requireAdmin(env, request);
  if (denied) return cors(denied);

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

// Editable columns and their types (used for casting + whitelisting)
const EDITABLE = {
  first_name: 'string',
  last_name: 'string',
  email: 'string',
  phone: 'string',
  organization: 'string',
  group_type: 'string',
  group_size: 'string',
  shirt_size: 'string',
  store_location: 'string',
  arrival_time: 'string',
  volunteer_type: 'string',
  early_arrival: 'integer',
  sms_opt_in: 'integer',
  experience: 'string',
  hear_about: 'string',
  notes: 'string',
  status: 'string',
};

// Map camelCase from client → snake_case D1 columns
const CAMEL_TO_SNAKE = {
  firstName: 'first_name',
  lastName: 'last_name',
  groupType: 'group_type',
  groupSize: 'group_size',
  shirtSize: 'shirt_size',
  storeLocation: 'store_location',
  arrivalTime: 'arrival_time',
  volunteerType: 'volunteer_type',
  earlyArrival: 'early_arrival',
  smsOptIn: 'sms_opt_in',
  hearAbout: 'hear_about',
};

export async function onRequestPut(context) {
  const { env, params, request } = context;
  const denied = await requireAdmin(env, request);
  if (denied) return cors(denied);

  let body;
  try { body = await request.json(); }
  catch { return cors(Response.json({ error: 'Invalid JSON' }, { status: 400 })); }

  const fields = [], vals = [];
  for (const [k, v] of Object.entries(body)) {
    const col = CAMEL_TO_SNAKE[k] || k;
    if (!(col in EDITABLE)) continue;
    if (EDITABLE[col] === 'integer') {
      fields.push(`${col} = ?`);
      vals.push(v ? 1 : 0);
    } else {
      fields.push(`${col} = ?`);
      vals.push(v == null || v === '' ? null : String(v));
    }
  }
  if (!fields.length) return cors(Response.json({ error: 'Nothing to update' }, { status: 400 }));
  fields.push('updated_at = ?'); vals.push(new Date().toISOString());
  vals.push(params.id);

  await env.DB.prepare(`UPDATE volunteers SET ${fields.join(', ')} WHERE id = ?`).bind(...vals).run();
  return cors(Response.json({ id: params.id, updated: true, fieldsChanged: fields.length - 1 }));
}

export async function onRequestDelete(context) {
  const { env, params, request } = context;
  const denied = await requireAdmin(env, request);
  if (denied) return cors(denied);

  const result = await env.DB.prepare(`DELETE FROM volunteers WHERE id = ?`).bind(params.id).run();
  return cors(Response.json({ id: params.id, deleted: true, changes: result.meta?.changes ?? 0 }));
}
