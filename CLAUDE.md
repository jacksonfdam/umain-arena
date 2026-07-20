# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Umain Arena — a browser FPS (CS 1.6-style AWP arena) where **Designers** take on
**Developers**. Characters are 100% fictional, playful role personas — no gore. UI
copy and docs are in **English**; keep that convention when editing.

> Rebrand of the original **"CS BRASIL: Treta Suprema"** by
> [@rubenmarcus](https://github.com/rubenmarcus). Some in-code comments remain in
> pt-BR from the original; translate opportunistically, don't churn.

## Commands

```bash
npm run dev          # Astro dev server (site + game)
npm run build        # build to dist/ (client + server) — the CI gate
npm run preview      # serve dist/client statically on :4321
npm run fetch-audio  # download the (git-ignored) audio pack; runs in the Vercel build

# Run ONLY the game, zero deps, any static server:
cd public && python3 -m http.server 8123
```

There is **no test runner** and **no linter**. CI (`.github/workflows/ci.yml`) is
the source of truth for "does it pass":
1. Syntax-check every game module: `node --input-type=module --check < public/js/<file>.js`
2. `npm run build` (Astro must build clean)

Run those two before considering a change done. Tagging `v*` triggers a GitHub
Release built from the matching `## [x.y.z]` section of `CHANGELOG.md`.

## The two zones (critical architecture constraint)

This repo is one deployable with **two independent codebases** that must not blur
together:

- **The game — `public/`** — vanilla JS ES modules + Three.js (vendored in
  `public/vendor/three.module.js`), **zero build, no framework, no CDN, no runtime
  deps**. It is served at the site root (`/`) via `public/index.html`, but is
  designed to run standalone by dropping `public/` onto any static host. This is a
  hard project decision — do not introduce a bundler, npm imports, or a framework
  into the game.
- **The site — repo root, Astro 7** (`output: 'static'` + Vercel adapter). Named
  content pages (`/sobre`, `/personagens`, `/como-jogar`, `/mapa`, `/ranking`,
  `/u/*`) and SSR API routes under `/api/*`. Frameworks/deps are fine here.

Because output is static, `public/index.html` (the game) is what `/` serves —
there is intentionally no `src/pages/index.astro`.

## Game internals (`public/js/`)

Loaded as ES modules from `index.html`; `main.js` is the entry point.

- `main.js` — boot, menu/settings, nickname & socials, main loop, all `/api/*`
  calls, and `localStorage` persistence (keys are `awpbr_*`: settings, nick,
  token UUID, socials, local stats, pending-submit queue).
- `game.js` — the `Game` class: FPS controller, weapons (`WEAPONS` table), bots,
  rounds, HUD, multikill logic. Round rules and tunables live as consts at the top.
- `characters.js` — `buildCharacter`/`poseCharacter` assemble players procedurally
  (no GLTF). `textures.js` — everything comes from `initTextures()`.
- `maps.js` — the map registry (`MAPS`, `DEFAULT_MAP`, `resolveMapId`); each map
  module (`map.js`, `map_pool_day.js`) exports a `build(scene, textures)` that
  returns the world incl. AABB colliders and weapon pickups.
- `audio.js` — `Sfx`: procedural WebAudio fallback + optional sample packs driven
  by `audio/manifest.json`.
- `version.js` — bump `VERSION` on every release; it must track the git `v*` tag.

## Ranking backend (site + Supabase)

`/api/*` routes are the only place the Supabase **`service_role`** key is used.
`src/lib/supabase.ts` reads `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (server
envs, set in Vercel only — never in the browser, never committed). When envs are
absent, `supabaseAdmin` is `null` and every endpoint returns **503**, so the game
degrades to local-only stats. Set `prerender = false` on any new API route.

- Players are identified by `nick` + a client-generated **token UUID** (no OAuth
  yet). Match writes go through Postgres RPCs (`register_player`, `submit_match`)
  where the real validation, rate-limiting, and RLS live — see `supabase/schema.sql`
  and `supabase/migrations/`.
- `submit-match.ts` uses a **fallback cascade**: it retries the RPC with fewer
  params when the DB schema is behind, so an outdated DB still records core stats.
  If you change the RPC signature, update both the migration and this cascade.
- `/api/badge/<id|nick>.png` renders a stats badge server-side with `resvg-wasm`
  (`public/wasm/resvg.wasm`) + a base64 DejaVu font embedded in `src/lib/font-data.ts`.
- Client geo comes from request headers (`src/lib/geo.ts`); only city/country are
  stored, never raw IPs.

## Content & tone rules (from CONTRIBUTING.md)

Enforced, not optional: no real people (names/faces/imitated voices); both teams
(Designers vs Developers) are mechanically identical, light-hearted personas; no copyrighted assets (CS 1.6
sounds are Valve's and are **not** bundled). The `public/audio/` pack is git-ignored
for licensing; without it the game uses synthesized sound.
