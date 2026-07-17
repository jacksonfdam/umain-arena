// GET /api/config — expõe URL + anon key do Supabase (públicas por design;
// a segurança é o RLS). O client usa pra ligar OAuth/storage.
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
