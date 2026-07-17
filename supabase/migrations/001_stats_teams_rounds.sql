-- Migration 001: stats por time + rounds (rode se o schema antigo já foi aplicado)
alter table public.stats add column if not exists rounds int not null default 0;
alter table public.stats add column if not exists matches_p int not null default 0;
alter table public.stats add column if not exists matches_b int not null default 0;

-- recria a função com os novos parâmetros (copie o submit_match do schema.sql)
-- e a view leaderboard ampliada (copie do schema.sql)
