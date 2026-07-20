# Changelog

## [1.13.0] — 2026-07-20
### Added
- **12 new weapons** playable alongside the existing arsenal, with dedicated
  viewmodels and ground pickups on the Pool map:
  - Rifles: **FAMAS**, **Galil**
  - Scoped: **AUG**, **SG-552** (zoom without unscoping), **Scout SSG** (bolt-action)
  - SMG/LMG: **P90**, **MAC-10**, **UMP-45**, **M249 Para**
  - Secondaries: **Glock-18**, **USP** (suppressed), **Dual Berettas**
- **Grenades** (full-loadout mode): **HE** (radius damage with line-of-sight
  falloff), **Flashbang** (screen blind scaled by how directly you're looking at
  it; also blinds bots) and **Smoke** (a cloud that blocks bullets and bot vision).
  Select with **4** or **G** (cycles), throw with left-click. Ground pickups top
  up your kit; you respawn with a full set.
- **Weapon slots**: **1** = primary, **2** = secondary, **3** = knife — the number
  keys now remember whatever gun you picked up into that slot.
- **4 new player skins** (procedural, original personas): Content Designer &
  Design Systems Lead (Designers), Mobile Dev & Data Engineer (Developers).

### Changed
- Scope is generalized: any scoped weapon zooms on right-click; only bolt-action
  snipers (AWP, Scout) re-chamber between shots.
- PISTOLS ONLY mode now allows every secondary (Glock/USP/Dual Berettas/DE) in pickups.

## [1.12.3] — 2026-07-18
### Fixed
- **Weapon mode also filters the map**: in PISTOLS ONLY/KNIFE/AWP, incompatible
  pickups disappear from the ground (not just from the player's hands)
- Home: RANKING/HOW TO PLAY/SETTINGS became smaller side buttons; the weapon
  dropdown is now custom with **SVG weapon icons** (same CSS as the map dropdown)

## [1.12.2] — 2026-07-18
### Changed
- **Nick required** to play: with no name, PLAY won't let you through (the field
  shakes, turns red and asks "ENTER A NICK FIRST!")

## [1.12.1] — 2026-07-18
### Added
- **Weapon mode** (dropdown next to the map): ALL / PISTOLS ONLY (pistol +
  deagle in pickups) / KNIFE ONLY (no weapons or pickups) / AWP ONLY (no pistol,
  AWP-only pickups) — affects the starting loadout and which pickups the player can
  grab with E (bots stay on the AWP default)

## [1.12.0] — 2026-07-18
### Added
- **Full arsenal**: AK-47, M4A1, MP5, M3 Shotgun and Desert Eagle playable
  (auto-fire with bloom, 8 pellets on the M3, dedicated viewmodels, real sounds
  from the `audio/weapons/` folder) alongside the AWP, pistol and knife
- **Pickup with E** + `[E] GRAB <WEAPON>` hint (bots still pick up by walking over)
- **M shows the character selection** for the new team before switching sides
- **Map dropdown** on the home screen (after the fields, before PLAY)
- More obstacles in the Pool map (pillars, benches, shower boxes, trash cans)
  and in the Farm map (hay bales, tractor, well, water trough, extra fences)

## [1.11.0] — 2026-07-18
### Added
- **fy_pool_day "Pool Party" map** (cherry-picked from PR #3 by
  [@daltonfontes](https://github.com/daltonfontes) 🎉) + map registry
  (`js/maps.js`) and MAP selector in the menu — "full weapons" style with 22
  weapon pickups on the ground
- **Weapon drop**: a dead player drops their weapon on the ground (classic CS);
  walking over it picks it up + full ammo — drops disappear when picked up, map
  pickups respawn
- **1.5x difficulty**: accuracy ×1.5 (with a bonus for standing still), bot reaction
  and fire rate 1.5× faster, damage 42→63; more responsive weapon switching and
  scoping for the player
- **Smarter bots**: they hunt whoever shot them even without seeing the attacker
- **+2 characters**: two new personas, one per team; 5v5 roster, 4v4 kept in play

## [1.10.0] — 2026-07-18
### Added
- **Anti-trainer (server)**: physical consistency in the RPC — kills ≤ 45/round
  and ≥ 80s/round (impossible for a speed/autoshot trainer), per-IP rate limit
  via `submit_log` (60s + 200/day), automatic flags (3 = removed from the ranking)
  — migration 009
- **Pagination on /ranking** (25/page) and a view capped at 500 players
- **Real brand icons** (simple-icons CC0) on the social chips
- Social URLs auto-normalized (fixes broken links from old data)
- `SECURITY.md`: honest security model + moderation SQL

## [1.9.0] — 2026-07-18
### Added
- **Y2K/Half-Life terminal theme** on the site: amber on a dark background,
  monospace, straight corners, scanlines, terminal tables and cards (Layout + pages)
- **Multi social networks** (up to 3) on the menu profile card, with automatic
  handle extraction when a URL is pasted, plus validation — `players.socials`
  (jsonb, migration 008)
- **Network chips** (X/GH/IG/in/TT/YT icons) on the ranking and profile instead of the raw URL
- **Character as icon fallback** on the ranking and profile (charSvg
  shared via `src/lib/charsvg.ts`)
- **In-game HUD buttons**: ⚙ settings and 🔊/🔇 to toggle voice lines
  (clips only — victory/UT/weapon still play), also in settings

## [1.8.1] — 2026-07-18
### Changed
- Social login buttons removed from the menu (OAuth is reserved for the multiplayer era)
- Photo upload now lives **on the main screen**, visible when the network is not
  X/GitHub (those pull the avatar automatically)
- Smaller logo, moved higher up in the menu

## [1.8.0] — 2026-07-18
### Added
- **Social network selector** in the menu (X, GitHub, Instagram, LinkedIn, TikTok,
  YouTube, own site) + handle — no login required; the username field
  stays disabled until a network is chosen
- **Automatic GitHub avatar** (official, `github.com/handle.png`) alongside X
- **Photo upload without login** (`POST /api/avatar`, validated by nick+token,
  128×128 resize on the server) — covers Instagram/LinkedIn/TikTok, which have
  no public avatar fetch

### Changed
- Social OAuth becomes optional/dormant (returns in the multiplayer era)

## [1.7.6] — 2026-07-18
### Added
- Map: city name always visible (permanent yellow tooltip) and a popup with
  the **player list + total per city** (via presence; cities with 0
  matches but with players also appear)

## [1.7.5] — 2026-07-18
### Fixed
- Badge card proportions: compact header, 3×3 grid with real margins,
  skyline removed (it collided with the last row of stats)

## [1.7.4] — 2026-07-18
### Added
- **Deaths** on the ranking, profile, local panel and badge (now in a 3×3
  grid with DEATHS between KILLS and HEADSHOTS)

## [1.7.3] — 2026-07-18
### Changed
- Zeroed wins show as "—" (no longer looks like a bug) on the ranking, profile,
  badge and local panel

## [1.7.2] — 2026-07-18
### Fixed
- Submits rejected by the 90s rate limit (abandon + a match right after)
  now go into a local queue and are resent automatically — no match is
  lost to a rate-limit window anymore

## [1.7.1] — 2026-07-18
### Added
- Overall scoreboard on `/mapa`: total players, matches and kills + a
  proportion bar of % Designers vs % Developers

## [1.7.0] — 2026-07-18
### Added
- **Character as avatar**: with no photo/X, the badge uses the character chosen in
  the game (SVG by id) and shows "plays as &lt;character&gt;" — `last_character`
  recorded per match (run schema.sql to create the column)
- **NEUTRAL**: a side tie (1 Designer × 1 Developer) becomes a third state on the card
- **Immersive site**: the Astro pages now have the game's 3D background (the real
  world orbiting, same code as the menu) with a dark overlay
- **Corner buttons** in the game menu: RANKING ↗ MAP ↗ ABOUT ↗

### Changed
- Badge card redesign: rounded stat cards, glow in the side's color,
  arena skyline in the footer

## [1.6.3] — 2026-07-18
### Changed
- "Takedowns" becomes "kills" across the whole UI (scoreboard, ranking, profile, badge, docs)

## [1.6.2] — 2026-07-18
### Fixed
- Heartbeat/submit use the nick **registered** in the session (editing the nick in
  the menu no longer breaks the token) and stop retrying after a 403

## [1.6.1] — 2026-07-17
### Fixed
- Self-recovering `submit-match`: if the database function is out of date
  (no p_seconds/p_rounds/p_team), it still records the core stats and
  responds with a warning to run the current schema.sql

## [1.6.0] — 2026-07-17
### Added
- **Abandon stats**: players who leave mid-match (quit button or closing the
  tab) also enter the ranking — partial submit on exit + sendBeacon on unload
- **Map with all-time history** per city (matches + rounds), not just 7 days
- **Clickable social link** on the profile and on /ranking
- **Automatic X/Twitter avatar** via unavatar.io when the social link is an
  X handle (badge, profile and ranking; fallback: initial)
- city_daily now sums rounds too (migration 005)

## [1.5.3] — 2026-07-17
### Fixed
- Badge with no text in production: the Linux native binding of `resvg-js`
  ignored buffered fonts — rendering migrated to `@resvg/resvg-wasm` (single
  embedded binary, deterministic on any serverless)

## [1.5.2] — 2026-07-17
### Fixed
- Profile links with `undefined` when the view has no `id` (fallback /u/nick)

## [1.5.1] — 2026-07-17
### Fixed
- Ranking submit failures (out-of-date function, rate limit, token) were
  swallowed silently — they now appear on the end-of-match screen and in the console

## [1.5.0] — 2026-07-17
### Changed
- Profile URL is now the canonical `/u/<id>/<nick>` (stable even when the nick
  changes and ready for duplicate nicks in the future); `/u/<nick>` redirects (301)
- Badge accepts id or nick (`/api/badge/<id>.png`)
- Leaderboard exposes `players.id` (migration 004)

## [1.4.3] — 2026-07-17
### Fixed
- "0min" time on matches from before tracking: now estimated from rounds
  (`~Xh Ymin` = estimated, ~99s/round) on the badge, profile, /ranking and local panel

## [1.4.2] — 2026-07-17
### Fixed
- `/mapa` page broken: the Layout had no `<slot name="head"/>` — the Leaflet CSS
  (and the landing's JSON-LD and the profile meta) were discarded
- Map tiles now dark (CARTO dark), matching the site theme

## [1.4.1] — 2026-07-17
### Added
- User avatar on the shareable badge (a circle with a ring in the team's color;
  fallback: nick initial) and at the top of the `/u/[nick]` profile

## [1.4.0] — 2026-07-17
### Added
- **Play time** per user (min/hours/days): counted per match on the client
  and summed in the ranking — appears on the shareable badge, the `/u/[nick]` profile,
  the `/ranking` page and the game's local panel
- Badge now has 8 stats (TIME and ROUNDS added)

## [1.3.1] — 2026-07-17
### Fixed
- Profile badge rendered text as boxes (□□□): Vercel serverless has no
  system fonts — rendering now via `@resvg/resvg-js` with
  DejaVu Sans Bold embedded in the bundle
- The profile og:image was overwritten by the Layout default (the crawler picked
  the wrong image) — `ogImage` is now a Layout prop and `/u/[nick]` uses the badge

## [1.3.0] — 2026-07-17
Phase 3: social login, avatar and live map.

### Added
- Login with **Google, GitHub, LinkedIn and X** (Supabase Auth) — buttons in the
  main menu; the provider's avatar enters the profile automatically
- **Profile photo upload** (RANKING screen): resizes to 128×128 on the
  client and uploads to the `avatars` bucket with an owner policy
- **Live map** (`/mapa`): players online now + matches per city
  over the last 7 days, via Leaflet/OpenStreetMap. Approximate geo (city) from
  Vercel headers — the IP is never stored
- Presence heartbeat every 30s during the game (`/api/heartbeat`)
- `city_daily`: aggregated history of matches per city
- `GET /api/config`: delivers the URL + anon key (public) so the client can enable OAuth

## [1.2.0] — 2026-07-17
Global ranking (Phase 2) — code complete, activates once Supabase is configured.

### Added
- New per-player stats: rounds played and matches as Designer vs Developer
- Public profile page `/u/[nick]` with a shareable stats badge
  (dynamic PNG at `/api/badge/[nick].png`, appears on the card when the link is posted)
- `/ranking` page with the global leaderboard (top 100)
- The game's RANKING screen shows the global top 10 without leaving the canvas, with links
  to the full ranking and to the profile
- Automatic nick registration on the first game (UUID token in the browser) and
  automatic stats submission at the end of each match via `/api/*` (SSR, no
  key on the client)

## [1.1.0] — 2026-07-17
The game is now the main route (`/`), redesigned menu and free team switching.

### Added
- Switch team at any time with **M** (respawn on the other side + a bot
  defects to the opposite team, keeping it 4v4)
- Astro landing with FAQ and SEO moved to `/sobre`

### Changed
- Game moved from `/game/` to `/` — the main URL is the game
- Menu with smaller buttons in a grid (nick and social link side by side)

## [1.0.2] — 2026-07-17
### Fixed
- Pointer lock: without it, shots/mouse/ESC were ignored silently. Now the
  game shows "click to enable aiming" and any click retries the lock.

## [1.0.1] — 2026-07-17
### Fixed
- Weapon stuck tilted when switching weapons mid-reload (reload dip
  reset + safety decay).

## [1.0.0] — 2026-07-17
First public release.

### Included
- Complete game: CS 1.6-style FPS with AWP/pistol/knife, bots with AI, rounds,
  scoreboard, radar, voice radio, UT-style multikills and headshots
- 8 original fictional characters (Designers vs Developers), procedural
  awp_map arena, 100% vanilla JS + Three.js, zero build
- Astro site (landing, characters, how-to-play) + SSR API routes for the ranking
- Local ranking with nick + social link; Supabase schema ready (Phase 2)
- SEO/AEO: JSON-LD, sitemap, robots, llms.txt, og-image
