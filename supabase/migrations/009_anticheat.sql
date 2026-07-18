-- Migration 009: anti-trainer (consistência física, rate limit por IP, flags)
alter table public.players add column if not exists flagged_count int not null default 0;

create table if not exists public.submit_log (
  id         bigint generated always as identity primary key,
  nick       text,
  ip         text,
  created_at timestamptz not null default now()
);
alter table public.submit_log enable row level security;

-- depois deste arquivo, recrie o _flag e o submit_match do schema.sql atual
-- (create or replace, com p_ip e as checagens físicas)

-- ranking cabe todo mundo (25/página no site)
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
