# IDEAS.md — Community roadmap

Valid ideas for where Umain Arena could go. Want to pick one up? Open an
issue with the idea's tag before you start coding (see `CONTRIBUTING.md`).
Levels: 🟢 easy · 🟡 medium · 🔴 large.

## Priority #1: Extra difficulties

Right now the bots have a fixed skill level. The game's first big evolution is
having **selectable difficulty levels** in the menu (before any online
ranking — difficulty is what gives replayability):

- 🟢 **Easy** — slow to react (0.8s+), poor aim, less damage.
- 🟢 **Medium** (current) — balanced default.
- 🟡 **Hard** — 0.2s reaction, near-perfect aim, fast strafe, coordinated
  group rush.
- 🟡 **Insane** — Hard + modifiers: no crosshair, no radar,
  friendly fire on, one life per round (no respawn).
- 🟡 **Standalone modifiers** (combinable with any level): headshot-only
  kills, minimal HUD, HP 50, speed ×1.5.

The foundation is ready: `skill`, `reactAt`, `nextShotAt` and bot damage in
`js/game.js` are parameters easy to scale per level.

## Gameplay

- 🟢 **Classic CS mode** — no respawn within the round (elimination), with
  a timer and victory by elimination or time.
- 🟢 **Custom match** — round time, number of bots (1v1 up to 5v5),
  friendly fire on/off, knife only, AWP only.
- 🟢 **New fictional characters** — new personas on both teams
  (following the CONTRIBUTING content rules).
- 🟡 **New weapons** — shotgun (cone spread), automatic rifle, confetti
  grenade (visual effect, no gore).
- 🟡 **Smarter bots** — use cover, retreat on low HP, coordinated
  group rush.
- 🟡 **Killcam / replay** — see the kill from the killer's angle for 3s.
- 🟡 **Local achievements** — first headshot, 10 knife kills, etc.
  (localStorage).

## Maps

- 🟢 **Variations of the current map** — `js/map.js` is declarative; you can
  generate "night", "rain", "party" by changing lights/props.
- 🟡 **New themed maps** — stadium, beach boardwalk, warehouse, transit
  terminal. Same symmetrical arena scheme.
- 🟡 **Map editor** — export/import layout as JSON.

## Graphics & tech

- 🟡 **Higher-quality models via Blender + MCP** — generate characters and
  props as GLB with the Blender MCP (AI-assisted pipeline) and load them in
  place of the box figures, keeping the same API (`buildCharacter`).
- 🟡 **Offline PWA** — service worker caching the whole game.
- ✅ ~~**Astro site around the game**~~ — DONE: landing `/`, `/personagens`,
  `/como-jogar` and API routes `/api/*` (SSR) for the ranking. Next steps:
  wire up Supabase and the public ranking/map pages.
- 🔴 **Unity/Godot port** — a separate client for mobile/desktop builds,
  sharing assets and concepts (the web version stays the main one).
- 🔴 **Mobile** — touch controls (virtual joysticks, aim assist).
  Depends on the engine decision (see the port above).

## Online & backend (future private repo)

- 🟡 **Online ranking** — global and weekly leaderboards (Supabase: auth +
  Postgres). Server-side anti-cheat validation.
- 🟡 **Live player map** — real-time presence per city on a Leaflet
  map (Edge Function + GeoIP; approximate geo, no raw IP, aggregated
  history — schema already prepared in `supabase/schema.sql`).
- 🟡 **Player profiles** — unique nick, stats, favorite character.
- 🔴 **Real multiplayer** — 4v4 rooms via WebSocket/WebRTC with an
  authoritative server.
- 🔴 **Clans and tournaments** — bracket table, seasons.

## Audio & content

- 🟢 **New voice packs** — more fictional lines per team (always original
  or licensed, see the content rules).
- 🟢 **New graffiti/posters** — fictional slogans in `js/textures.js`.
- 🟡 **Procedural soundtrack** — menu music generated in WebAudio
  (8-bit chiptune?).

## Governance

- 🟢 **Translations** — localized UI for other languages.
- 🟢 **Accessibility** — colorblind mode, key remapping, HUD scaling.
- 🟡 **CI** — GitHub Actions: syntax check + headless smoke test on every PR.
