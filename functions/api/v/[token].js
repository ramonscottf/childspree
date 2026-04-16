// GET /api/v/:token — public volunteer profile (QR scan resolves here)
// POST /api/v/:token/agree — volunteer agrees to terms
// POST /api/v/:token/checkin — ops crew checks in volunteer (admin only)

import { requireAdmin } from '../_admin_auth.js';

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, Cookie');
  r.headers.set('Access-Control-Allow-Credentials', 'true');
  return r;
}

export async function onRequestOptions() {
  return cors(new Response(null, { status: 204 }));
}

export async function onRequestGet(context) {
  const { env, params } = context;
  const token = params.token;

  if (!token || token.length < 10) {
    return cors(Response.json({ error: 'Invalid token' }, { status: 400 }));
  }

  const vol = await env.DB.prepare(`
    SELECT id, first_name, last_name, email, phone, organization,
           store_location, arrival_time, volunteer_type, shirt_size,
           agreed_to_terms, agreed_at, checked_in, checked_in_at,
           status, token
    FROM volunteers WHERE token = ?
  `).bind(token).first();

  if (!vol) {
    return cors(Response.json({ error: 'Volunteer not found' }, { status: 404 }));
  }

  // Check if they have an active assignment
  const assignment = await env.DB.prepare(`
    SELECT a.id as assignment_id, a.nomination_id, a.assigned_at, a.checked_out, a.checkout_at,
           n.child_first, n.school, n.grade, n.parent_token,
           i.shirt_size as child_shirt, i.pant_size, i.shoe_size,
           i.favorite_colors, i.avoid_colors, i.allergies, i.preferences,
           i.gender, i.department, i.video_key, i.video_uploaded, i.child_age
    FROM assignments a
    JOIN nominations n ON n.id = a.nomination_id
    LEFT JOIN parent_intake i ON i.nomination_id = n.id
    WHERE a.volunteer_id = ?
    ORDER BY a.assigned_at DESC LIMIT 1
  `).bind(vol.id).first();

  const response = {
    id: vol.id,
    firstName: vol.first_name,
    lastName: vol.last_name,
    email: vol.email,
    phone: vol.phone,
    organization: vol.organization,
    storeLocation: vol.store_location,
    arrivalTime: vol.arrival_time,
    volunteerType: vol.volunteer_type,
    shirtSize: vol.shirt_size,
    agreedToTerms: !!vol.agreed_to_terms,
    agreedAt: vol.agreed_at,
    checkedIn: !!vol.checked_in,
    checkedInAt: vol.checked_in_at,
    status: vol.status,
    token: vol.token,
  };

  // Include assignment if exists
  if (assignment) {
    response.assignment = {
      id: assignment.assignment_id,
      childFirst: assignment.child_first,
      school: assignment.school,
      grade: assignment.grade,
      age: assignment.child_age,
      gender: assignment.gender,
      department: assignment.department,
      shirtSize: assignment.child_shirt,
      pantSize: assignment.pant_size,
      shoeSize: assignment.shoe_size,
      favoriteColors: assignment.favorite_colors,
      avoidColors: assignment.avoid_colors,
      allergies: assignment.allergies,
      preferences: assignment.preferences,
      hasVideo: !!(assignment.video_key && assignment.video_uploaded),
      videoUrl: (assignment.video_key && assignment.video_uploaded)
        ? `/api/video/${assignment.parent_token}` : null,
      assignedAt: assignment.assigned_at,
      checkedOut: !!assignment.checked_out,
      checkoutAt: assignment.checkout_at,
    };
  }

  return cors(Response.json(response));
}

export async function onRequestPost(context) {
  const { env, params, request } = context;
  const token = params.token;

  if (!token || token.length < 10) {
    return cors(Response.json({ error: 'Invalid token' }, { status: 400 }));
  }

  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));

  // Determine action from URL or body
  const action = body.action || 'agree';

  if (action === 'agree') {
    // Public — volunteer agrees to terms
    const result = await env.DB.prepare(
      'UPDATE volunteers SET agreed_to_terms = 1, agreed_at = ? WHERE token = ? AND agreed_to_terms = 0'
    ).bind(new Date().toISOString(), token).run();

    if (result.meta.changes === 0) {
      // Already agreed or not found
      const vol = await env.DB.prepare('SELECT agreed_to_terms FROM volunteers WHERE token = ?').bind(token).first();
      if (!vol) return cors(Response.json({ error: 'Volunteer not found' }, { status: 404 }));
      return cors(Response.json({ ok: true, alreadyAgreed: true }));
    }

    return cors(Response.json({ ok: true }));
  }

  if (action === 'checkin') {
    // Admin only — ops crew checks in volunteer
    const authErr = await requireAdmin(env, request);
    if (authErr) return cors(authErr);

    const now = new Date().toISOString();
    const result = await env.DB.prepare(
      'UPDATE volunteers SET checked_in = 1, checked_in_at = ? WHERE token = ?'
    ).bind(now, token).run();

    if (result.meta.changes === 0) {
      return cors(Response.json({ error: 'Volunteer not found' }, { status: 404 }));
    }

    // Return the volunteer data for the assign UI
    const vol = await env.DB.prepare(
      'SELECT id, first_name, last_name, store_location, volunteer_type, agreed_to_terms FROM volunteers WHERE token = ?'
    ).bind(token).first();

    return cors(Response.json({
      ok: true,
      volunteer: {
        id: vol.id,
        firstName: vol.first_name,
        lastName: vol.last_name,
        storeLocation: vol.store_location,
        volunteerType: vol.volunteer_type,
        agreedToTerms: !!vol.agreed_to_terms,
      }
    }));
  }

  return cors(Response.json({ error: 'Unknown action' }, { status: 400 }));
}
