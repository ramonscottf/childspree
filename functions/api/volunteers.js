// functions/api/volunteers.js
// GET /api/volunteers — list all (admin)
// POST /api/volunteers — register new volunteer (public)

import { notifyVolunteerRegistered } from './_notify.js';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}
function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return r;
}
export async function onRequestOptions() { return cors(new Response(null, { status: 204 })); }

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');

  let q = 'SELECT * FROM volunteers WHERE 1=1';
  const p = [];
  if (status && status !== 'all') { q += ' AND status = ?'; p.push(status); }
  if (search) { q += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR organization LIKE ?)'; const s = `%${search}%`; p.push(s,s,s,s); }
  q += ' ORDER BY created_at DESC';

  const { results } = await env.DB.prepare(q).bind(...p).all();
  const volunteers = results.map(r => ({
    id: r.id, status: r.status,
    firstName: r.first_name, lastName: r.last_name,
    email: r.email, phone: r.phone,
    organization: r.organization, groupType: r.group_type,
    shirtSize: r.shirt_size, arrivalTime: r.arrival_time, earlyArrival: !!r.early_arrival, storeLocation: r.store_location,
    experience: r.experience, hearAbout: r.hear_about,
    smsOptIn: !!r.sms_opt_in, notes: r.notes,
    createdAt: r.created_at,
  }));
  return cors(Response.json({ volunteers, total: volunteers.length }));
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const body = await request.json();
  if (!body.firstName || !body.lastName) return cors(Response.json({ error: 'Name required' }, { status: 400 }));
  if (!body.email && !body.phone) return cors(Response.json({ error: 'Email or phone required' }, { status: 400 }));

  const id = generateId();
  await env.DB.prepare(`
    INSERT INTO volunteers (id, first_name, last_name, email, phone, organization, group_type, shirt_size, store_location, arrival_time, early_arrival, experience, hear_about, sms_opt_in)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, body.firstName, body.lastName, body.email||null, body.phone||null,
    body.organization||null, body.groupType||'Individual', body.shirtSize||null, body.storeLocation||null, body.arrivalTime||null,
    body.arrivalTime === '6:30 AM' ? 1 : 0, body.experience||null, body.hearAbout||null,
    body.smsOptIn!==false?1:0
  ).run();

  context.waitUntil(notifyVolunteerRegistered(env, {
    firstName: body.firstName, lastName: body.lastName,
    email: body.email, phone: body.phone,
    organization: body.organization, groupType: body.groupType,
    shirtSize: body.shirtSize, earlyArrival: body.earlyArrival,
  }));

  return cors(Response.json({ id, status: 'registered' }, { status: 201 }));
}
