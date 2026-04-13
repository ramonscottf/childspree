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
  const { results } = await env.DB.prepare(
    "SELECT store_location, COUNT(*) as n FROM volunteers WHERE status != 'waitlisted' GROUP BY store_location"
  ).all();
  const counts = {};
  results.forEach(r => { if (r.store_location) counts[r.store_location] = r.n; });
  return cors(Response.json(counts));
}
