# Contributing to Umain Arena

Thanks for wanting to contribute! 🎮 This is an open source project, made
for fun — a light-hearted Designers vs Developers rivalry, shared equally
across both sides.

## Where we stand (read before contributing)

- **The game takes no sides.** Designers and Developers are teams with the
  same mechanics, the same exaggerated personas, the same playful humor.
- **The game does NOT promote hate** against any person or group. It's light,
  cartoonish, fictional fun — no gore, no realistic violence.
- **No real people.** No public figures, celebrities or identifiable private
  people (name, face, imitated voice). Only original fictional personas.
- Contributions that break these principles will be rejected.

## Made with Kimi K3

This project was created with the help of **Kimi K3** (Kimi Code CLI) — from
code to character design. Human and/or AI-assisted contributions are
welcome, as long as you review and test them yourself.

## Running locally

```bash
git clone https://github.com/jacksonfdam/umain-arena.git
cd umain-arena
npm install
npm run fetch-audio      # downloads the audio pack (not versioned)
npm run dev              # full site (Astro) — game at /game/
# or just the game, no dependencies: cd public && python3 -m http.server 8123
```

Without the audio pack the game works with synthesized sounds (fallback).

## Contribution rules

**Content**
- No copyrighted assets: sprites, sounds or models from commercial games,
  logos, brands, photos — only original material or freely licensed material
  with a compatible license.
- New characters/teams follow the pattern: fictional persona, fictional name,
  humor without cruelty, no targeting protected groups.
- Large audio/image files **do not go into git** — the `audio/` directory
  is ignored; new sounds go into the pack via `audio/manifest.example.json`.

**Code — two zones**
- **Game (`public/`)**: vanilla JS with ES modules, **no framework and no
  build** — a project decision (the game must run by dragging the folder to
  any static host). Three.js is vendored in `public/vendor/` — do not
  add CDNs or runtime deps to the game without opening an issue first.
- **Site (root, Astro)**: landing, content pages and API routes. Here a
  framework is welcome — but keep the pages light and the game untouched.
- **Secrets**: never commit `service_role` keys or `.env` — envs only on Vercel.
- Match the surrounding code style (naming, comments, patterns).
- Small, focused PRs: one feature or one fix per PR.

**Process**
1. For large features, open an **issue** first (see `IDEAS.md`).
2. Fork + branch (`feat/my-idea`), PR with a clear description and screenshots.
3. Test before submitting: game opens, no console errors, a full match
   runs (round ends, scoreboard opens with Tab).
4. By contributing, you agree to license your contribution under the **MIT**
   license (see `LICENSE`).

## Reporting bugs

Open an issue with: what happened, what you expected, steps to reproduce,
browser/OS and, if possible, a screenshot of the console (F12).
