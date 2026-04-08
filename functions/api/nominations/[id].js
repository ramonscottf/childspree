// GET /api/nominations/:id
// PATCH /api/nominations/:id — update status + fire notifications

import { notifyParentIntakeReady, notifyParentFamilyIntakeReady } from '../_notify.js';

function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 8); }
function generateToken() {
  const c = 'abcdefghjkmnpqrstuvwxyz23456789';
  let t = ''; for (let i=0; i<12; i++) t += c[Math.floor(Math.random()*c.length)]; return t;
}
function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return r;
}
export async function onRequestOptions() { return cors(new Response(null, { status: 204 })); }

export async function onRequestGet(context) {
  const { env, params } = context;
  const nom = await env.DB.prepare('SELECT * FROM nominations WHERE id = ?').bind(params.id).first();
  if (!nom) return cors(Response.json({ error: 'Not found' }, { status: 404 }));
  const intake = await env.DB.prepare('SELECT * FROM parent_intake WHERE nomination_id = ?').bind(params.id).first();
  return cors(Response.json({
    id: nom.id, status: nom.status, parentToken: nom.parent_token,
    childFirst: nom.child_first, childLast: nom.child_last, school: nom.school, grade: nom.grade,
    nominatorName: nom.nominator_name, nominatorRole: nom.nominator_role, nominatorEmail: nom.nominator_email,
    parentName: nom.parent_name, parentPhone: nom.parent_phone, parentEmail: nom.parent_email,
    reason: nom.reason, siblingCount: nom.sibling_count||0, siblingNames: nom.sibling_names,
    createdAt: nom.created_at,
    parentIntake: intake ? {
      shirtSize: intake.shirt_size, pantSize: intake.pant_size, shoeSize: intake.shoe_size,
      gender: intake.gender, department: intake.department,
      favoriteColors: intake.favorite_colors, avoidColors: intake.avoid_colors,
      allergies: intake.allergies, preferences: intake.preferences, hasVideo: !!intake.video_uploaded,
    } : null,
  }));
}

export async function onRequestPatch(context) {
  const { env, params, request } = context;
  const body = await request.json();

  const nom = await env.DB.prepare('SELECT * FROM nominations WHERE id = ?').bind(params.id).first();
  if (!nom) return cors(Response.json({ error: 'Not found' }, { status: 404 }));

  const transitions = { pending:['approved','declined'], approved:['sent','declined'], sent:['complete'], declined:['pending'] };
  if (body.status) {
    if (!(transitions[nom.status]||[]).includes(body.status)) {
      return cors(Response.json({ error: `Cannot go from ${nom.status} to ${body.status}` }, { status: 400 }));
    }
    const now = new Date().toISOString();
    let extra = '';
    if (body.status==='approved') extra=', approved_at = ?';
    if (body.status==='sent') extra=', sent_at = ?';
    if (body.status==='complete') extra=', completed_at = ?';
    const binds = [body.status, now];
    if (extra) binds.push(now);
    binds.push(params.id);
    await env.DB.prepare(`UPDATE nominations SET status = ?, updated_at = ?${extra} WHERE id = ?`).bind(...binds).run();

    if (body.status === 'sent') {
      const siblingCount = nom.sibling_count || 0;

      if (siblingCount === 0) {
        // Single child — normal flow
        context.waitUntil(notifyParentIntakeReady(env, {
          parentName: nom.parent_name, parentPhone: nom.parent_phone, parentEmail: nom.parent_email,
          parentToken: nom.parent_token, childFirst: nom.child_first, childLast: nom.child_last,
          siblingCount: 0, lang: nom.parent_language || 'en',
        }));
      } else {
        // Multi-child family — auto-create sibling nominations then send one family email
        const siblings = [];

        // Parse sibling names into individual children
        // e.g. "Maria (3rd), James (K)" → [{name: "Maria", grade: "3rd"}, ...]
        const rawNames = (nom.sibling_names || '').split(',').map(s => s.trim()).filter(Boolean);

        for (const raw of rawNames) {
          const match = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
          const firstName = match ? match[1].trim() : raw;
          const grade = match ? match[2].trim() : nom.grade;
          const lastName = nom.child_last;

          const sibId = generateId();
          const sibToken = generateToken();

          await env.DB.prepare(`
            INSERT INTO nominations (id, parent_token, child_first, child_last, school, grade,
              nominator_name, nominator_role, nominator_email,
              parent_name, parent_phone, parent_email, reason, status, sent_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?, ?)
          `).bind(
            sibId, sibToken, firstName, lastName, nom.school, grade,
            nom.nominator_name, nom.nominator_role, nom.nominator_email,
            nom.parent_name, nom.parent_phone, nom.parent_email,
            nom.reason || null, now, now
          ).run();

          siblings.push({ childFirst: firstName, childLast: lastName, grade, parentToken: sibToken });
        }

        // Build full family array: primary child first, then siblings
        const allChildren = [
          { childFirst: nom.child_first, childLast: nom.child_last, grade: nom.grade, parentToken: nom.parent_token },
          ...siblings,
        ];

        // Send ONE family email/SMS with all intake links
        context.waitUntil(notifyParentFamilyIntakeReady(env, {
          parentName: nom.parent_name, parentPhone: nom.parent_phone, parentEmail: nom.parent_email,
          children: allChildren, lang: nom.parent_language || 'en',
        }));
      }
    }
  }

  return cors(Response.json({ id: params.id, status: body.status, updated: true }));
}
