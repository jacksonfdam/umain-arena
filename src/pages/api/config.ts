// GET /api/config — exposes Supabase URL + anon key (public by design;
// security is RLS). The client uses it to wire up OAuth/storage.
import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const url = import.meta.env.SUPABASE_URL;
  const anonKey = import.meta.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey)
    return new Response(JSON.stringify({ error: 'not_configured' }), { status: 503, headers: { 'content-type': 'application/json' } });
  return new Response(JSON.stringify({ url, anonKey }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' },
  });
};
