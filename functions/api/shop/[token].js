// GET /api/shop/:token — public, token-gated shopper profile
// Returns child info (no last name), sizes, colors, preferences, video status.
// Used by volunteers on shopping day after scanning QR code.

function cors(r) {
  r.headers.set('Access-Control-Allow-Origin', '*');
  r.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return r;
}

export async function onRequestOptions() {
  return cors(new Response(null, { status: 204 }));
}

export async function onRequestGet(context) {
  const { env, params } = context;
  const token = params.token;

  if (!token || token.length < 6) {
    return cors(Response.json({ error: 'Invalid token' }, { status: 400 }));
  }

  // Look up nomination by parent_token
  const nom = await env.DB.prepare(`
    SELECT n.id, n.child_first, n.school, n.grade, n.status,
           i.gender, i.department, i.shirt_size, i.pant_size, i.shoe_size,
           i.favorite_colors, i.avoid_colors, i.allergies, i.preferences,
           i.video_key, i.video_uploaded, i.child_age
    FROM nominations n
    LEFT JOIN parent_intake i ON i.nomination_id = n.id
    WHERE n.parent_token = ?
  `).bind(token).first();

  if (!nom) {
    return cors(Response.json({ error: 'Child not found' }, { status: 404 }));
  }

  // Only allow access to children with completed intake
  if (nom.status !== 'complete') {
    return cors(Response.json({ error: 'This child\'s information is not yet available' }, { status: 403 }));
  }

  // Return profile — NO last name for privacy
  return cors(Response.json({
    childFirst: nom.child_first,
    school: nom.school,
    grade: nom.grade,
    age: nom.child_age,
    gender: nom.gender,
    department: nom.department,
    shirtSize: nom.shirt_size,
    pantSize: nom.pant_size,
    shoeSize: nom.shoe_size,
    favoriteColors: nom.favorite_colors,
    avoidColors: nom.avoid_colors,
    allergies: nom.allergies,
    preferences: nom.preferences,
    hasVideo: !!(nom.video_key && nom.video_uploaded),
    videoUrl: (nom.video_key && nom.video_uploaded) ? `/api/video/${token}` : null,
  }));
}
