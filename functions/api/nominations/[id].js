// GET /api/nominations/:id — admin only
// PATCH /api/nominations/:id — update status + fire notifications — admin only

import { notifyParentIntakeReady, notifyParentFamilyIntakeReady } from '../_notify.js';
import { requireAdmin } from '../_admin_auth.js';

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
  const { env, params, request } = context;
  const denied = await requireAdmin(env, request);
  if (denied) return cors(denied);

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
  const denied = await requireAdmin(env, request);
  if (denied) return cors(denied);

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
      const familyGroup = nom.family_group;

      if (familyGroup) {
        // Family group — update ALL family members to 'sent' and send one family email
        await env.DB.prepare(`UPDATE nominations SET status = 'sent', sent_at = ?, updated_at = ? WHERE family_group = ? AND status IN ('pending','approved')`)
          .bind(now, now, familyGroup).run();

        // Get all family members
        const { results: familyMembers } = await env.DB.prepare(
          `SELECT child_first, child_last, grade, parent_token FROM nominations WHERE family_group = ?`
        ).bind(familyGroup).all();

        const allChildren = familyMembers.map(m => ({
          childFirst: m.child_first, childLast: m.child_last, grade: m.grade, parentToken: m.parent_token,
        }));

        context.waitUntil(notifyParentFamilyIntakeReady(env, {
          parentName: nom.parent_name, parentPhone: nom.parent_phone, parentEmail: nom.parent_email,
          children: allChildren, lang: nom.parent_language || 'en',
        }));
      } else if ((nom.sibling_count || 0) === 0) {
        // Single child, no family group — normal flow
        context.waitUntil(notifyParentIntakeReady(env, {
          parentName: nom.parent_name, parentPhone: nom.parent_phone, parentEmail: nom.parent_email,
          parentToken: nom.parent_token, childFirst: nom.child_first, childLast: nom.child_last,
          siblingCount: 0, lang: nom.parent_language || 'en',
        }));
      } else {
        // Legacy: old nominations with sibling_count > 0 but no family_group (pre-migration)
        // Fall back to old sibling creation logic
        const siblings = [];
        let siblingDefs = [];
        try {
          const parsed = JSON.parse(nom.sibling_names || '[]');
          if (Array.isArray(parsed)) {
            siblingDefs = parsed.map(s => ({
              name: s.name || '', studentId: s.studentId || '', grade: nom.grade,
            })).filter(s => s.name);
          }
        } catch(e) {
          siblingDefs = (nom.sibling_names || '').split(',').map(s => s.trim()).filter(Boolean).map(raw => {
            const match = raw.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
            return { name: match ? match[1].trim() : raw, grade: match ? match[2].trim() : nom.grade, studentId: '' };
          }).filter(s => s.name);
        }

        for (const sibDef of siblingDefs) {
          const raw = sibDef.name;
          const parts = raw.split(' ');
          const firstName = parts[0] || raw;
          const grade = sibDef.grade || nom.grade;
          const lastName = parts.slice(1).join(' ') || nom.child_last;
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

        const allChildren = [
          { childFirst: nom.child_first, childLast: nom.child_last, grade: nom.grade, parentToken: nom.parent_token },
          ...siblings,
        ];

        context.waitUntil(notifyParentFamilyIntakeReady(env, {
          parentName: nom.parent_name, parentPhone: nom.parent_phone, parentEmail: nom.parent_email,
          children: allChildren, lang: nom.parent_language || 'en',
        }));
      }
    }
  }

  // Field editing (admin can edit anything)
  const nomFields = [];
  const nomValues = [];
  if (body.childFirst !== undefined) { nomFields.push('child_first = ?'); nomValues.push(body.childFirst); }
  if (body.childLast !== undefined) { nomFields.push('child_last = ?'); nomValues.push(body.childLast); }
  if (body.parentName !== undefined) { nomFields.push('parent_name = ?'); nomValues.push(body.parentName); }
  if (body.parentPhone !== undefined) { nomFields.push('parent_phone = ?'); nomValues.push(body.parentPhone); }
  if (body.parentEmail !== undefined) { nomFields.push('parent_email = ?'); nomValues.push(body.parentEmail); }
  if (body.parentLanguage !== undefined) { nomFields.push('parent_language = ?'); nomValues.push(body.parentLanguage); }
  if (body.school !== undefined) { nomFields.push('school = ?'); nomValues.push(body.school); }
  if (body.grade !== undefined) { nomFields.push('grade = ?'); nomValues.push(body.grade); }
  if (body.reason !== undefined) { nomFields.push('reason = ?'); nomValues.push(body.reason); }
  if (body.additionalNotes !== undefined) { nomFields.push('additional_notes = ?'); nomValues.push(body.additionalNotes); }
  if (body.nominatorName !== undefined) { nomFields.push('nominator_name = ?'); nomValues.push(body.nominatorName); }
  if (body.nominatorEmail !== undefined) { nomFields.push('nominator_email = ?'); nomValues.push(body.nominatorEmail); }

  if (nomFields.length > 0) {
    nomFields.push('updated_at = ?'); nomValues.push(new Date().toISOString());
    nomValues.push(params.id);
    await env.DB.prepare(
      `UPDATE nominations SET ${nomFields.join(', ')} WHERE id = ?`
    ).bind(...nomValues).run();
  }

  // Intake field editing
  if (body.shirtSize !== undefined || body.pantSize !== undefined || body.shoeSize !== undefined ||
      body.favoriteColors !== undefined || body.avoidColors !== undefined || body.allergies !== undefined ||
      body.preferences !== undefined || body.gender !== undefined || body.department !== undefined) {
    const existing = await env.DB.prepare('SELECT id FROM parent_intake WHERE nomination_id = ?').bind(params.id).first();
    if (existing) {
      const iFields = [];
      const iValues = [];
      if (body.shirtSize !== undefined) { iFields.push('shirt_size = ?'); iValues.push(body.shirtSize); }
      if (body.pantSize !== undefined) { iFields.push('pant_size = ?'); iValues.push(body.pantSize); }
      if (body.shoeSize !== undefined) { iFields.push('shoe_size = ?'); iValues.push(body.shoeSize); }
      if (body.favoriteColors !== undefined) { iFields.push('favorite_colors = ?'); iValues.push(body.favoriteColors); }
      if (body.avoidColors !== undefined) { iFields.push('avoid_colors = ?'); iValues.push(body.avoidColors); }
      if (body.allergies !== undefined) { iFields.push('allergies = ?'); iValues.push(body.allergies); }
      if (body.preferences !== undefined) { iFields.push('preferences = ?'); iValues.push(body.preferences); }
      if (body.gender !== undefined) { iFields.push('gender = ?'); iValues.push(body.gender); }
      if (body.department !== undefined) { iFields.push('department = ?'); iValues.push(body.department); }
      if (iFields.length > 0) {
        iValues.push(params.id);
        await env.DB.prepare(`UPDATE parent_intake SET ${iFields.join(', ')} WHERE nomination_id = ?`).bind(...iValues).run();
      }
    }
  }

  return cors(Response.json({ id: params.id, status: body.status, updated: true }));
}
