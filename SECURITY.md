# Security model — Umain Arena

## The technical truth first

This is a game **with no authoritative server** (for now): the match runs
100% in the player's browser. That means **the client is, by definition,
untrusted** — an attacker with a trainer (memory/JS editing) can get god mode,
speed, autoshot etc. in THEIR OWN game. **No client-side anti-cheat fixes this** —
it's obfuscation theater, and we don't do theater.

What can actually be defended today is the **integrity of the ranking** — and
that's where we focus everything: statistical validation and moderation on the server.

The real fix is authoritative multiplayer (a future phase), where the server
witnesses the kills. Until then, the layers below.

## Active layers

1. **Per-nick token** (UUID in the browser) — prevents theft of someone else's nick/stats.
2. **Rate limit per nick** (90s) and **per IP** (60s + 200 matches/day, via
   `submit_log`) — against floods and nick-hopping.
3. **Absolute caps** — 150 kills/deaths, streak 30, 1500s per match.
4. **Physical consistency (anti-trainer)**:
   - kills ≤ 45 per round (the 2.5s respawn makes more than that impossible);
   - ≥ 80s per round (a speed hack can't produce an instant match).
5. **Automatic flags** — an implausible attempt = +1 flag; **3 flags = removed
   from the ranking automatically** (`players.hidden`).
6. **Registration with rate limit** (10/min per IP) against nick-farming.
7. **RLS on every table**; writes only via validated RPC; the `service_role`
   key exists only in Vercel's env vars.
8. **No secrets on the client** — the anon key is public by design (security
   comes from RLS, not from hiding the key).

## GDPR / privacy

- `submit_log` stores IP + nick + timestamp **only** for operational
  security (anti-abuse), with a **maximum retention of 7 days** — purge it
  periodically: `delete from submit_log where created_at < now() - interval '7 days';`
- Map geo is at the city level (Vercel header), the IP is never persisted.

## Moderation (ready-made SQL)

```sql
-- hide a player from the ranking
update players set hidden = true where nick = 'NICK';
-- unban + reset flags
update players set hidden = false, flagged_count = 0 where nick = 'NICK';
-- suspects accumulating flags
select nick, flagged_count, hidden from players where flagged_count > 0 order by flagged_count desc;
-- recent submits from an IP
select * from submit_log where ip = '1.2.3.4' order by created_at desc limit 50;
```

## What we do NOT do (on purpose)

- Client-side payload signing/HMAC — works against naive `curl` scripts, but
  any trainer extracts the secret from the JS. Cost without real benefit.
- Client-side anti-cheat (devtools detection, debugger traps) — bypassed
  in minutes by anyone using a trainer. Not worth the maintenance.

## Security roadmap

- **Authoritative multiplayer** (future phase): the server validates kills/damage —
  the only complete fix against trainers.
- Match sessions signed by the server (a match only counts if started and
  ended with the server watching).
