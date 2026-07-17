# Changelog

## [1.2.0] — 2026-07-17
Ranking global (Fase 2) — código completo, ativa ao configurar o Supabase.

### Adicionado
- Stats novos por jogador: rounds jogados e partidas como Petista × Bolsonarista
- Página pública de perfil `/u/[nick]` com badge de stats compartilhável
  (PNG dinâmica em `/api/badge/[nick].png`, aparece no card ao postar o link)
- Página `/ranking` com o leaderboard global (top 100)
- Tela RANKING do jogo mostra o top 10 global sem sair do canvas, com links
  pro ranking completo e pro perfil
- Registro automático de nick no primeiro jogo (token UUID no navegador) e
  envio automático de stats ao fim de cada partida via `/api/*` (SSR, sem
  chave no client)

## [1.1.0] — 2026-07-17
O jogo agora é a rota principal (`/`), menu redesenhado e troca de time livre.

### Adicionado
- Troca de time a qualquer momento com **M** (respawn no outro lado + um bot
  deserta pro time oposto, mantendo o 4×4)
- Landing Astro com FAQ e SEO movida para `/sobre`

### Mudado
- Jogo movido de `/game/` para `/` — URL principal é o jogo
- Menu com botões menores em grid (nick e link social lado a lado)

## [1.0.2] — 2026-07-17
### Corrigido
- Pointer lock: sem ele, tiros/mouse/ESC eram ignorados em silêncio. Agora o
  jogo mostra "clique para ativar a mira" e qualquer clique re-tenta o lock.

## [1.0.1] — 2026-07-17
### Corrigido
- Arma travava inclinada ao trocar de arma no meio da recarga (reload dip
  resetado + decaimento de segurança).

## [1.0.0] — 2026-07-17
Primeira release pública.

### Incluído
- Jogo completo: FPS estilo CS 1.6 com AWP/pistola/faca, bots com IA, rounds,
  placar, radar, rádio de voz, multikills estilo UT e headshots
- 8 personagens satíricos originais (Petistas × Bolsonaristas), mapa
  awp_map brasileiro procedural, 100% vanilla JS + Three.js, zero build
- Site Astro (landing, personagens, como-jogar) + API routes SSR pro ranking
- Ranking local com nick + link social; schema Supabase pronto (Fase 2)
- SEO/AEO: JSON-LD, sitemap, robots, llms.txt, og-image
