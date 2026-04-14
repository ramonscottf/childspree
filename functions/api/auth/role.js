import { getAdminEmails } from '../_admin_auth.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email')?.toLowerCase();
  if (!email) return Response.json({ role: 'unknown' });

  // Check admin list first
  const adminEmails = getAdminEmails(env);
  if (adminEmails.includes(email)) return Response.json({ role: 'admin' });

  // Check family advocates table
  const fa = await env.DB.prepare(
    'SELECT id FROM family_advocates WHERE LOWER(email) = ?'
  ).bind(email).first();
  if (fa) return Response.json({ role: 'fa' });

  // Any @dsdmail.net employee can use FA role
  if (email.endsWith('@dsdmail.net')) return Response.json({ role: 'fa' });

  return Response.json({ role: 'unknown' });
}
