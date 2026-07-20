// POST /api/submit-match — validates + rate-limits (per IP) and writes via RPC to the DB.
// The player token validation happens inside the RPC (schema.sql).
import type { APIRoute } from 'astro';
import { supabaseAdmin, NOT_CONFIGURED } from '../../lib/supabase';
import { geoFrom } from '../../lib/geo';

export const prerender = false;

// rate limit per IP (best-effort: serverless instance memory;
// the durable per-nick limit lives in the RPC — 1 submit/90s)
const hits = new Map<string, number>();
const WINDOW_MS = 30_000;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!supabaseAdmin)
    return new Response(NOT_CONFIGURED, { status: 503, headers: { 'content-type': 'application/json' } });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || clientAddress || 'unknown';
  const now = Date.now();
  if (hits.get(ip) && now - hits.get(ip)! < WINDOW_MS)
    return new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers: { 'content-type': 'application/json' } });

  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'bad_json' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }
  const { nick, token, won, kills, deaths, headshots, bestStreak, rounds, team, seconds, character } = body ?? {};
  if (typeof nick !== 'string' || typeof token !== 'string')
    return new Response(JSON.stringify({ error: 'missing_fields' }), { status: 400, headers: { 'content-type': 'application/json' } });

  const n = nick.slice(0, 14);
  // compatibility cascade: if the database function is out of date
  // (missing p_character/p_seconds/p_rounds/p_team), write the core stats anyway
  const attempts = [
    { p_nick: n, p_token: token, p_won: !!won, p_kills: kills | 0, p_deaths: deaths | 0, p_headshots: headshots | 0, p_best_streak: bestStreak | 0, p_rounds: rounds | 0, p_team: team === 'P' || team === 'B' ? team : null, p_seconds: seconds | 0, p_character: typeof character === 'string' ? character.slice(0, 20) : null, p_ip: ip },
    { p_nick: n, p_token: token, p_won: !!won, p_kills: kills | 0, p_deaths: deaths | 0, p_headshots: headshots | 0, p_best_streak: bestStreak | 0, p_rounds: rounds | 0, p_team: team === 'P' || team === 'B' ? team : null },
    { p_nick: n, p_token: token, p_won: !!won, p_kills: kills | 0, p_deaths: deaths | 0, p_headshots: headshots | 0, p_best_streak: bestStreak | 0 },
  ];
  let error: any = null, degraded = false;
  for (let i = 0; i < attempts.length; i++) {
    const r = await supabaseAdmin.rpc('submit_match', attempts[i]);
    if (!r.error) { degraded = i > 0; error = null; break; }
    error = r.error;
    if (!/could not find the function|schema cache/i.test(r.error.message)) break; // real error (token, rate limit…)
  }
  if (error)
    return new Response(JSON.stringify({ error: error.message }), { status: 403, headers: { 'content-type': 'application/json' } });

  hits.set(ip, now);
  // geo: presence + aggregated history per city (never raw IP)
  const g = geoFrom(request);
  if (g) {    const today = new Date().toISOString().slice(0, 10);
    await supabaseAdmin.from('presence').upsert({
      nick: nick.slice(0, 14), last_seen: new Date().toISOString(),
      city: g.city, country: g.country, lat: g.lat, lon: g.lon,
    });
    if (g.city) {
      const { data: row } = await supabaseAdmin
        .from('city_daily').select('matches, rounds').eq('day', today).eq('city', g.city).maybeSingle();
      await supabaseAdmin.from('city_daily').upsert({
        day: today, city: g.city, country: g.country,
        matches: (row?.matches ?? 0) + 1,
        rounds: (row?.rounds ?? 0) + (rounds | 0),
      });
    }
  }
  return new Response(JSON.stringify(degraded
    ? { ok: true, warn: 'database out of date — run supabase/schema.sql (lost rounds/team/time for this match)' }
    : { ok: true }), { headers: { 'content-type': 'application/json' } });
};
