// GET /api/volunteers/store-counts — public endpoint for store capacity display

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
  const { env } = context;
  const STORE_CAPS = { "Kohl's Layton (881 W Antelope Dr)": 200, "Kohl's Centerville (510 N 400 W)": 175, "Kohl's Clinton (1526 N 2000 W)": 200 };
  const OPS_CAPS = { "Kohl's Layton (881 W Antelope Dr)": 9, "Kohl's Centerville (510 N 400 W)": 8, "Kohl's Clinton (1526 N 2000 W)": 8 };
  const { results } = await env.DB.prepare(
    "SELECT store_location, volunteer_type, COUNT(*) as n FROM volunteers WHERE status != 'waitlisted' GROUP BY store_location, volunteer_type"
  ).all();
  const shoppers = {};
  const ops = {};
  results.forEach(r => {
    if (!r.store_location) return;
    if (r.volunteer_type === 'ops_crew') { ops[r.store_location] = r.n; }
    else { shoppers[r.store_location] = r.n; }
  });
  return cors(Response.json({ shoppers, ops, caps: STORE_CAPS, opsCaps: OPS_CAPS }));
}
