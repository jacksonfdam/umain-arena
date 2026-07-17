-- Migration 007: tetos de plausibilidade realistas (rode no SQL Editor)
create or replace function public.submit_match(
  p_nick text, p_token uuid,
  p_won boolean, p_kills int, p_deaths int, p_headshots int, p_best_streak int,
  p_rounds int default 0, p_team text default null, p_seconds int default 0,
  p_character text default null
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_last timestamptz;
begin
  if not exists (select 1 from players where nick = p_nick and token = p_token) then
    raise exception 'token inválido';
  end if;
  -- rate limit: 1 partida a cada 90s por nick (uma partida real dura ~2-8 min)
  select updated_at into v_last from stats where nick = p_nick;
  if v_last is not null and now() - v_last < interval '90 seconds' then
    raise exception 'aguarde antes de submeter outra partida';
  end if;
  -- sanity check anti-cheat básico (tetos bem acima do possível em 6 rounds:
  -- ~1 kill/3s sustentado; o rate limit de 90s já limita a frequência)
  if p_kills < 0 or p_kills > 150 or p_deaths < 0 or p_deaths > 150
     or p_headshots < 0 or p_headshots > p_kills or p_best_streak < 0 or p_best_streak > 30
     or p_rounds < 0 or p_rounds > 6 or p_seconds < 0 or p_seconds > 1500 then
    raise exception 'stats implausíveis';
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
