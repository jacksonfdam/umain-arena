// POST /api/register — registra nick (único) + token do jogador.
import type { APIRoute } from 'astro';
import { supabaseAdmin, NOT_CONFIGURED } from '../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!supabaseAdmin)
    return new Response(NOT_CONFIGURED, { status: 503, headers: { 'content-type': 'application/json' } });
  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'bad_json' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  const { nick, token, social } = body ?? {};
  if (typeof nick !== 'string' || typeof token !== 'string' || nick.trim().length < 2)
    return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400, headers: { 'content-type': 'application/json' } });
  const { error } = await supabaseAdmin.rpc('register_player', {
    p_nick: nick.trim().slice(0, 14), p_token: token,
    p_social: typeof social === 'string' ? social.slice(0, 60) : null,
  });
  if (error)
    return new Response(JSON.stringify({ error: error.message }), { status: 409, headers: { 'content-type': 'application/json' } });
  return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
};
