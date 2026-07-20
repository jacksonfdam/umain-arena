# supabase/

This folder is public **on purpose** — and should stay that way.

## What can live here (safe)

- `schema.sql` and migrations: table structure, RPCs, policies, views.
  Publishing the schema does NOT weaken security: the defenses (RLS, token
  validation in the RPCs, rate limits) don't depend on secrecy — an attacker
  would discover the endpoints by watching the client's traffic anyway.

## What can NEVER go here (or anywhere in git)

- `.env` / `.env.*` (ignored globally in `.gitignore`)
- `service_role` key, database password, connection strings with a password
- third-party API keys

The `service_role` and `SUPABASE_URL` live **only** in Vercel's env vars.
The client's `anon` key is public by design — security comes from RLS,
not from hiding the key.

If a secret is committed by accident: **revoke it immediately**
(Project Settings → API → regenerate) and refresh the envs on Vercel —
deleting the commit is not enough, git history preserves it.
