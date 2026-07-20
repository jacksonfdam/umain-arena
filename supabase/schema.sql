-- Umain Arena — global ranking schema (Phase 2, future)
-- Run in the Supabase SQL Editor. Then configure URL + anon key in the client
-- (js/ranking.js, to be created) — the anon key is public by design; security
-- comes from the policies below, not from hiding the key.

-- Players table: stable UUID id (PK, future link to auth.users in
-- Phase 3) + unique nick (anti-impersonation identity, CS 1.6 style).
-- If you ever want duplicate nicks (BattleTag model), just drop the
-- nick's unique constraint — the id still distinguishes each player.
create table if not exists public.players (
  id          uuid primary key default gen_random_uuid(),
  nick        text not null unique check (char_length(nick) between 2 and 14),
  token       uuid not null,
  social_link text check (char_length(social_link) <= 60),
  socials     jsonb not null default '[]'::jsonb,   -- [{net, url}] multi-networks
  avatar_url  text,                            -- OAuth avatar or Storage upload
  auth_user   uuid,                            -- Phase 3: link to auth.users(id)
  hidden      boolean not null default false,  -- moderation: hides from ranking
  created_at  timestamptz not null default now()
);

-- Aggregated stats per player (1:1 with players).
create table if not exists public.stats (
  nick        text primary key references public.players(nick) on delete cascade,
  matches     int not null default 0,
  wins        int not null default 0,
  rounds      int not null default 0,
  matches_p   int not null default 0,   -- matches as Designer
  matches_b   int not null default 0,   -- matches as Developer
  kills       int not null default 0,
  deaths      int not null default 0,
  headshots   int not null default 0,
  best_streak int not null default 0,
  play_seconds bigint not null default 0,
  updated_at  timestamptz not null default now()
);

alter table public.players enable row level security;

-- ---------------------------------------------------------------------------
-- AUTO-HEAL for old databases: create table if not exists does NOT add
-- columns to already-existing tables. These ALTERs are idempotent and bring
-- any previous version of the schema up to the current shape.
-- ---------------------------------------------------------------------------
alter table public.players add column if not exists avatar_url text;
alter table public.players add column if not exists auth_user uuid;
alter table public.players add column if not exists hidden boolean not null default false;
alter table public.players add column if not exists socials jsonb not null default '[]'::jsonb;
alter table public.players add column if not exists flagged_count int not null default 0;
alter table public.stats add column if not exists rounds int not null default 0;
alter table public.stats add column if not exists matches_p int not null default 0;
alter table public.stats add column if not exists matches_b int not null default 0;
alter table public.stats add column if not exists play_seconds bigint not null default 0;
alter table public.stats add column if not exists last_character text;

alter table public.stats   enable row level security;

-- Public read (the ranking is public).
drop policy if exists "players: leitura pública" on public.players;
create policy "players: leitura pública" on public.players
  for select using (true);
drop policy if exists "stats: leitura pública" on public.stats;
create policy "stats: leitura pública" on public.stats
  for select using (true);

-- NO direct insert/update/delete: only via the RPC below (security definer),
-- which validates the token before writing.

-- Register a new nick (fails if the nick already exists) or validate an existing token.
create or replace function public.register_player(p_nick text, p_token uuid, p_social text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into players (nick, token, social_link) values (p_nick, p_token, p_social)
  on conflict (nick) do nothing;
  if not exists (select 1 from players where nick = p_nick and token = p_token) then
    raise exception 'nick already taken';
  end if;
  if p_social is not null then
    update players set social_link = p_social where nick = p_nick and token = p_token;
  end if;
end $$;

-- Submit log for per-IP rate limiting and moderation (7-day retention —
-- delete old records periodically; operational security data).
create table if not exists public.submit_log (
  id         bigint generated always as identity primary key,
  nick       text,
  ip         text,
  created_at timestamptz not null default now()
);
alter table public.submit_log enable row level security;  -- no public policy: only the server reads/writes

-- Marks a player as suspicious; 3+ flags = disappears from the ranking automatically.
create or replace function public._flag(p_nick text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update players set flagged_count = flagged_count + 1 where nick = p_nick;
  update players set hidden = true where nick = p_nick and flagged_count >= 3;
end $$;

-- ---------------------------------------------------------------------------
-- IMPORTANT: "create or replace function" does NOT replace when the signature
-- changes — it creates OVERLOADS (that's what broke submit: 9/10/11-param
-- versions coexisting). This block drops ALL overloads before
-- recreating the current signature. Always keep it here.
-- ---------------------------------------------------------------------------
do $$
declare f record;
begin
  for f in select p.oid::regprocedure::text as sig
           from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where p.proname = 'submit_match' and n.nspname = 'public'
  loop
    execute 'drop function if exists ' || f.sig || ' cascade';
  end loop;
end $$;

-- Submit stats for a match (token + rate limits + PHYSICAL CONSISTENCY anti-trainer).
create or replace function public.submit_match(
  p_nick text, p_token uuid,
  p_won boolean, p_kills int, p_deaths int, p_headshots int, p_best_streak int,
  p_rounds int default 0, p_team text default null, p_seconds int default 0,
  p_character text default null, p_ip text default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_last timestamptz;
  v_ip_last timestamptz;
  v_ip_today int;
begin
  if not exists (select 1 from players where nick = p_nick and token = p_token) then
    raise exception 'invalid token';
  end if;
  -- rate limit per nick: 1 match every 90s
  select updated_at into v_last from stats where nick = p_nick;
  if v_last is not null and now() - v_last < interval '90 seconds' then
    raise exception 'wait before submitting another match';
  end if;
  -- rate limit per IP: 60s between submits + cap of 200/day (anti nick-hopping)
  if p_ip is not null then
    select max(created_at) into v_ip_last from submit_log where ip = p_ip;
    if v_ip_last is not null and now() - v_ip_last < interval '60 seconds' then
      raise exception 'too many matches in a row — slow down';
    end if;
    select count(*) into v_ip_today from submit_log where ip = p_ip and created_at > now() - interval '1 day';
    if v_ip_today >= 200 then
      raise exception 'daily match limit reached';
    end if;
  end if;
  -- absolute caps (with headroom for real gameplay)
  if p_kills < 0 or p_kills > 150 or p_deaths < 0 or p_deaths > 150
     or p_headshots < 0 or p_headshots > p_kills or p_best_streak < 0 or p_best_streak > 30
     or p_rounds < 0 or p_rounds > 6 or p_seconds < 0 or p_seconds > 1500 then
    perform public._flag(p_nick);
    raise exception 'implausible stats';
  end if;
  -- PHYSICAL CONSISTENCY (anti-trainer):
  -- a) kills per round: 2.5s respawn => theoretical cap ~40/round; 45 with headroom
  if p_kills > 45 * greatest(p_rounds, 1) then
    perform public._flag(p_nick);
    raise exception 'kills beyond what is physically possible';
  end if;
  -- b) minimum time per round (~80s): a speed hack won't produce an instant match
  if p_rounds > 0 and p_seconds > 0 and p_seconds < p_rounds * 80 then
    perform public._flag(p_nick);
    raise exception 'match too fast to be real';
  end if;
  if p_ip is not null then
    insert into submit_log (nick, ip) values (p_nick, p_ip);
  end if;
  insert into stats (nick, matches, wins, rounds, matches_p, matches_b, kills, deaths, headshots, best_streak, play_seconds, last_character)
  values (p_nick, 1, p_won::int, p_rounds,
          (p_team = 'P')::int, (p_team = 'B')::int,
          p_kills, p_deaths, p_headshots, p_best_streak, p_seconds, p_character)
  on conflict (nick) do update set
    matches     = stats.matches + 1,
    wins        = stats.wins + p_won::int,
    rounds      = stats.rounds + p_rounds,
    matches_p   = stats.matches_p + (p_team = 'P')::int,
    matches_b   = stats.matches_b + (p_team = 'B')::int,
    kills       = stats.kills + p_kills,
    deaths      = stats.deaths + p_deaths,
    headshots   = stats.headshots + p_headshots,
    best_streak = greatest(stats.best_streak, p_best_streak),
    play_seconds = stats.play_seconds + p_seconds,
    last_character = coalesce(p_character, stats.last_character),
    updated_at  = now();
end $$;

-- Leaderboard: top by kills, excluding players hidden by moderation.
-- (drop before recreating: Postgres won't allow changing columns of an
-- existing view with create or replace)
drop view if exists public.leaderboard;
create view public.leaderboard as
select p.id, s.nick, p.social_link, p.socials, p.avatar_url, s.matches, s.wins, s.rounds,
       s.matches_p, s.matches_b, s.kills, s.deaths,
       s.headshots, s.best_streak, s.play_seconds, s.last_character,
       round(s.kills::numeric / greatest(s.deaths, 1), 2) as kd
from stats s join players p on p.nick = s.nick
where not p.hidden
order by s.kills desc, s.wins desc
limit 500;

-- ---------------------------------------------------------------------------
-- PRESENCE & MAP ("live battle map")
-- Populated by an Edge Function (Deno) — PostgREST RPC does NOT have access
-- to the client's IP. The function reads x-forwarded-for, resolves GeoIP (city)
-- and upserts here. Privacy: do NOT store the raw IP — only approximate geo
-- (city), with consent on the registration screen.
-- ---------------------------------------------------------------------------
create table if not exists public.presence (
  nick      text primary key references public.players(nick) on delete cascade,
  last_seen timestamptz not null default now(),
  city      text,
  country   text,
  lat       float8,
  lon       float8
);

alter table public.presence enable row level security;
drop policy if exists "presence: leitura pública" on public.presence;
create policy "presence: leitura pública" on public.presence
  for select using (true);

-- =============================================================================
-- STORAGE (ranking avatars) — public bucket "avatars"; owner-only writes
-- (file name = <auth.users.id>.<ext>). Avatars are resized to
-- 128×128 on the client before upload.
-- =============================================================================
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');
drop policy if exists "avatars owner insert" on storage.objects;
create policy "avatars owner insert" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete" on storage.objects
  for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- "online now" = heartbeat in the last 2 minutes
create or replace view public.online_now as
select nick, city, country, lat, lon, last_seen
from presence
where last_seen > now() - interval '2 minutes';

-- AGGREGATED history per city (not per person) — privacy first.
create table if not exists public.city_daily (
  day     date not null,
  city    text not null,
  country text,
  matches int not null default 0,
  rounds  int not null default 0,
  primary key (day, city)
);
-- auto-heal: old databases (pre city_rounds) get the column here
alter table public.city_daily add column if not exists rounds int not null default 0;

alter table public.city_daily enable row level security;
drop policy if exists "city_daily: leitura pública" on public.city_daily;
create policy "city_daily: leitura pública" on public.city_daily
  for select using (true);

-- ---------------------------------------------------------------------------
-- GRANTS: HOSTED Supabase grants these privileges via "default
-- privileges"; on a LOCAL Postgres (`supabase start`) they don't come for free,
-- so the leaderboard view gave "permission denied". Making it explicit keeps the
-- schema portable (local + prod). service_role is used by ALL /api/* routes
-- (the service key stays only on the server); anon/authenticated only read what the
-- RLS policies allow (e.g. submit_log stays private — RLS with no policy).
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to service_role;
grant select on all tables in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated, service_role;
