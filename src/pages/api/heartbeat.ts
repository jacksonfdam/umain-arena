// POST /api/heartbeat — "online now" presence with approximate geo (city).
import type { APIRoute } from 'astro';
import { supabaseAdmin, NOT_CONFIGURED } from '../../lib/supabase';
import { geoFrom } from '../../lib/geo';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseAdmin)
    return new Response(NOT_CONFIGURED, { status: 503, headers: { 'content-type': 'application/json' } });
  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'bad_json' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  const { nick, token } = body ?? {};
  if (typeof nick !== 'string' || typeof token !== 'string')
    return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400, headers: { 'content-type': 'application/json' } });

  const { data: player } = await supabaseAdmin
    .from('players').select('nick').eq('nick', nick.slice(0, 14)).eq('token', token).maybeSingle();
  if (!player)
    return new Response(JSON.stringify({ error: 'invalid token' }), { status: 403, headers: { 'content-type': 'application/json' } });

  const g = geoFrom(request);
  await supabaseAdmin.from('presence').upsert({
    nick: player.nick, last_seen: new Date().toISOString(),
    city: g?.city ?? null, country: g?.country ?? null, lat: g?.lat ?? null, lon: g?.lon ?? null,
  });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
