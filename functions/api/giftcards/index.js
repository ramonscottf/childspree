// POST /api/giftcards/link — link a gift card to a volunteer + child assignment
// GET /api/giftcards — list gift cards (admin)
// POST /api/giftcards/generate — batch generate gift card codes (admin)

import { requireAdmin } from '../_admin_auth.js';

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Cookie');
  r.headers.set('Access-Control-Allow-Credentials', 'true');
  return r;
}
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
}

export async function onRequestOptions() {
  return cors(new Response(null, { status: 204 }));
}

export async function onRequestGet(context) {
  const { env, request } = context;
  const authErr = await requireAdmin(env, request);
  if (authErr) return cors(authErr);

  const { results } = await env.DB.prepare(`
    SELECT gc.*,
           n.child_first, n.school,
           v.first_name as vol_first, v.last_name as vol_last
    FROM gift_cards gc
    LEFT JOIN nominations n ON n.id = gc.nomination_id
    LEFT JOIN volunteers v ON v.id = gc.volunteer_id
    ORDER BY gc.created_at DESC
  `).all();

  return cors(Response.json({ giftCards: results }));
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));

  // POST /api/giftcards/generate — admin generates batch of gift card codes
  if (url.pathname.endsWith('/generate')) {
    const authErr = await requireAdmin(env, request);
    if (authErr) return cors(authErr);

    const count = Math.min(body.count || 10, 500);
    const amount = body.amount || 150.00;
    const now = new Date().toISOString();
    const cards = [];

    for (let i = 0; i < count; i++) {
      const id = generateId();
      const code = `CS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      await env.DB.prepare(
        'INSERT INTO gift_cards (id, card_code, amount, created_at) VALUES (?, ?, ?, ?)'
      ).bind(id, code, amount, now).run();
      cards.push({ id, code, amount });
    }

    return cors(Response.json({ ok: true, cards, count: cards.length }, { status: 201 }));
  }

  // POST /api/giftcards/link — link gift card to assignment (ops crew, admin)
  if (url.pathname.endsWith('/link')) {
    const authErr = await requireAdmin(env, request);
    if (authErr) return cors(authErr);

    const { cardCode, volunteerId, assignmentId } = body;
    if (!cardCode) return cors(Response.json({ error: 'cardCode required' }, { status: 400 }));

    // Find the gift card
    const card = await env.DB.prepare('SELECT * FROM gift_cards WHERE card_code = ?').bind(cardCode).first();
    if (!card) return cors(Response.json({ error: 'Gift card not found' }, { status: 404 }));
    if (card.used) return cors(Response.json({ error: 'Gift card already used' }, { status: 409 }));

    // If assignmentId provided, look up the nomination + volunteer from it
    let nomId = body.nominationId;
    let volId = volunteerId;

    if (assignmentId) {
      const a = await env.DB.prepare('SELECT nomination_id, volunteer_id FROM assignments WHERE id = ?').bind(assignmentId).first();
      if (a) {
        nomId = nomId || a.nomination_id;
        volId = volId || a.volunteer_id;
      }
    }

    const now = new Date().toISOString();
    await env.DB.prepare(`
      UPDATE gift_cards SET nomination_id = ?, volunteer_id = ?, assignment_id = ?, linked_at = ?, used = 1
      WHERE id = ?
    `).bind(nomId || null, volId || null, assignmentId || null, now, card.id).run();

    return cors(Response.json({ ok: true, cardId: card.id }));
  }

  return cors(Response.json({ error: 'Use /generate or /link' }, { status: 400 }));
}
