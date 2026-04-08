// functions/dl/[code].js
// Catches old Glide deep links (childspree.org/dl/XXXXX)
// Redirects to the new Child Spree app

export async function onRequestGet(context) {
  // Any Glide deep link → land on our nominate page
  // Could eventually map specific codes to specific pages
  return Response.redirect('https://childspree.org/#/nominate', 302);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204 });
}
