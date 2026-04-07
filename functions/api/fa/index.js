// functions/api/fa/index.js — GET all FAs (admin) + POST create FA

import { notifyFAWelcome } from '../../_notify.js';

function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2,8); }
function generateToken() { const c='abcdefghjkmnpqrstuvwxyz23456789'; let t=''; for(let i=0;i<16;i++) t+=c[Math.floor(Math.random()*c.length)]; return t; }
function cors(r) { r.headers.set('Access-Control-Allow-Origin','*'); r.headers.set('Access-Control-Allow-Methods','GET,POST,OPTIONS'); r.headers.set('Access-Control-Allow-Headers','Content-Type,Authorization'); return r; }
export async function onRequestOptions() { return cors(new Response(null,{status:204})); }

export async function onRequestGet(context) {
  const { env } = context;
  const { results } = await env.DB.prepare('SELECT * FROM family_advocates ORDER BY first_name ASC').all();
  const fas = results.map(r => ({
    id: r.id, portalToken: r.portal_token,
    firstName: r.first_name, lastName: r.last_name,
    email: r.email, phone: r.phone, school: r.school,
    status: r.status, notes: r.notes, createdAt: r.created_at,
  }));
  // Get nomination counts per FA
  for (const fa of fas) {
    const row = await env.DB.prepare(
      "SELECT COUNT(*) as total, SUM(CASE WHEN status='complete' THEN 1 ELSE 0 END) as complete FROM nominations WHERE fa_id=?"
    ).bind(fa.id).first();
    fa.nominationCount = row?.total || 0;
    fa.completeCount = row?.complete || 0;
  }
  return cors(Response.json({ fas, total: fas.length }));
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const body = await request.json();
  if (!body.firstName || !body.lastName) return cors(Response.json({ error: 'Name required' }, { status: 400 }));
  if (!body.email && !body.phone) return cors(Response.json({ error: 'Email or phone required' }, { status: 400 }));

  const id = generateId();
  const token = generateToken();

  await env.DB.prepare(`
    INSERT INTO family_advocates (id, portal_token, first_name, last_name, email, phone, school, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, token, body.firstName, body.lastName, body.email||null, body.phone||null, body.school||null, body.notes||null).run();

  context.waitUntil(notifyFAWelcome(env, {
    firstName: body.firstName, lastName: body.lastName,
    email: body.email, phone: body.phone, portalToken: token,
  }));

  return cors(Response.json({ id, portalToken: token, status: 'active' }, { status: 201 }));
}
