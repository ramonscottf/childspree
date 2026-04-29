// functions/api/volunteers.js
// GET /api/volunteers — list all (admin only, authenticated)
// POST /api/volunteers — register new volunteer (public)

import { notifyVolunteerRegistered } from './_notify.js';
import { requireAdmin } from './_admin_auth.js';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}
function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let token = '';
  for (let i = 0; i < 22; i++) token += chars[Math.floor(Math.random() * chars.length)];
  return token;
}
function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return r;
}
export async function onRequestOptions() { return cors(new Response(null, { status: 204 })); }

const STORE_CAPS = {
  "Kohl's Layton (881 W Antelope Dr)": 200,
  "Kohl's Centerville (510 N 400 W)": 175,
  "Kohl's Clinton (1526 N 2000 W)": 200,
};

const OPS_CAPS = {
  "Kohl's Layton (881 W Antelope Dr)": 8,
  "Kohl's Centerville (510 N 400 W)": 8,
  "Kohl's Clinton (1526 N 2000 W)": 10,
};

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  // Public endpoint: store counts for capacity display (split by type)
  if (url.pathname.endsWith('/store-counts')) {
    // group_size can be: NULL, '2', '3', ..., '10', '11-15', '16-20', '20+'
    // For individuals or NULL group_size, count as 1
    // For numeric values, use the number
    // For ranges like '11-15', use the upper bound to be safe
    const { results } = await env.DB.prepare(
      `SELECT store_location, volunteer_type, group_type, group_size FROM volunteers WHERE status != 'waitlisted'`
    ).all();

    function parseGroupCount(row) {
      const gs = row.group_size;
      if (!gs || row.group_type === 'Individual') return 1;
      // Handle ranges like '11-15', '16-20'
      if (gs.includes('-')) {
        const parts = gs.split('-');
        return parseInt(parts[1]) || parseInt(parts[0]) || 1;
      }
      if (gs === '20+') return 20;
      const n = parseInt(gs);
      return isNaN(n) ? 1 : n;
    }

    const shoppers = {};
    const ops = {};
    results.forEach(r => {
      if (!r.store_location) return;
      const count = parseGroupCount(r);
      if (r.volunteer_type === 'ops_crew') { ops[r.store_location] = (ops[r.store_location] || 0) + count; }
      else { shoppers[r.store_location] = (shoppers[r.store_location] || 0) + count; }
    });
    return cors(Response.json({ shoppers, ops, caps: STORE_CAPS, opsCaps: OPS_CAPS }));
  }

  // Everything below returns PII — admin only
  const denied = await requireAdmin(env, request);
  if (denied) return cors(denied);

  const status = url.searchParams.get('status');
  const search = url.searchParams.get('search');

  let q = 'SELECT * FROM volunteers WHERE 1=1';
  const p = [];
  if (status && status !== 'all') { q += ' AND status = ?'; p.push(status); }
  if (search) { q += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR organization LIKE ?)'; const s = `%${search}%`; p.push(s,s,s,s); }
  q += ' ORDER BY created_at DESC';

  const { results } = await env.DB.prepare(q).bind(...p).all();
  const volunteers = results.map(r => ({
    id: r.id, status: r.status, volunteerType: r.volunteer_type || 'shopper',
    firstName: r.first_name, lastName: r.last_name,
    email: r.email, phone: r.phone,
    organization: r.organization, groupType: r.group_type, groupSize: r.group_size,
    shirtSize: r.shirt_size, arrivalTime: r.arrival_time, earlyArrival: !!r.early_arrival, storeLocation: r.store_location,
    experience: r.experience, hearAbout: r.hear_about,
    smsOptIn: !!r.sms_opt_in, notes: r.notes,
    createdAt: r.created_at,
    token: r.token,
    agreedToTerms: !!r.agreed_to_terms, agreedAt: r.agreed_at,
    checkedIn: !!r.checked_in, checkedInAt: r.checked_in_at,
    qrSent: !!r.qr_sent,
  }));
  return cors(Response.json({ volunteers, total: volunteers.length }));
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const body = await request.json();
  if (!body.firstName || !body.lastName) return cors(Response.json({ error: 'Name required' }, { status: 400 }));
  if (!body.email && !body.phone) return cors(Response.json({ error: 'Email or phone required' }, { status: 400 }));

  const volunteerType = body.volunteerType === 'ops_crew' ? 'ops_crew' : 'shopper';
  const capsToUse = volunteerType === 'ops_crew' ? OPS_CAPS : STORE_CAPS;

  // Check store capacity (type-specific) — accounting for group sizes
  let waitlisted = false;
  const store = body.storeLocation || null;

  // Helper to sum actual people from volunteer rows
  function sumPeople(rows) {
    let total = 0;
    for (const r of rows) {
      const gs = r.group_size;
      if (!gs || r.group_type === 'Individual') { total += 1; continue; }
      if (gs.includes('-')) { total += parseInt(gs.split('-')[1]) || 1; continue; }
      if (gs === '20+') { total += 20; continue; }
      const n = parseInt(gs);
      total += isNaN(n) ? 1 : n;
    }
    return total;
  }

  if (store && capsToUse[store]) {
    const { results } = await env.DB.prepare(
      "SELECT group_type, group_size FROM volunteers WHERE store_location = ? AND volunteer_type = ? AND status != 'waitlisted'"
    ).bind(store, volunteerType).all();
    const cnt = sumPeople(results);
    if (cnt >= capsToUse[store]) { waitlisted = true; }
  }

  // If no store selected but all are full for this type, also waitlist
  if (!store) {
    const { results } = await env.DB.prepare(
      "SELECT store_location, group_type, group_size FROM volunteers WHERE volunteer_type = ? AND status != 'waitlisted'"
    ).bind(volunteerType).all();
    const cnts = {};
    results.forEach(r => {
      if (!r.store_location) return;
      const gs = r.group_size;
      let n = 1;
      if (gs && r.group_type !== 'Individual') {
        if (gs.includes('-')) n = parseInt(gs.split('-')[1]) || 1;
        else if (gs === '20+') n = 20;
        else { const p = parseInt(gs); n = isNaN(p) ? 1 : p; }
      }
      cnts[r.store_location] = (cnts[r.store_location] || 0) + n;
    });
    const allFull = Object.keys(capsToUse).every(k => (cnts[k]||0) >= capsToUse[k]);
    if (allFull) { waitlisted = true; }
  }

  const id = generateId();
  const token = generateToken();
  const status = waitlisted ? 'waitlisted' : 'registered';

  await env.DB.prepare(`
    INSERT INTO volunteers (id, first_name, last_name, email, phone, organization, group_type, group_size, shirt_size, store_location, arrival_time, early_arrival, experience, hear_about, sms_opt_in, status, volunteer_type, token)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, body.firstName, body.lastName, body.email||null, body.phone||null,
    body.organization||null, body.groupType||'Individual', body.groupSize||null, body.shirtSize||null, store, body.arrivalTime||null,
    (body.arrivalTime||'').includes('Setup') ? 1 : 0, body.experience||null, body.hearAbout||null,
    body.smsOptIn!==false?1:0, status, volunteerType, token
  ).run();

  context.waitUntil(notifyVolunteerRegistered(env, {
    firstName: body.firstName, lastName: body.lastName,
    email: body.email, phone: body.phone,
    organization: body.organization, groupType: body.groupType,
    shirtSize: body.shirtSize, waitlisted, volunteerType, token,
    storeLocation: store, arrivalTime: body.arrivalTime,
  }));

  return cors(Response.json({ id, status, waitlisted, token }, { status: 201 }));
}
