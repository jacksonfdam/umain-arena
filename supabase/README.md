# supabase/

Esta pasta é pública **de propósito** — e deve continuar assim.

## O que pode ficar aqui (seguro)

- `schema.sql` e migrations: estrutura de tabelas, RPCs, policies, views.
  Publicar schema NÃO enfraquece a segurança: as defesas (RLS, validação de
  token nos RPCs, rate limits) não dependem de segredo — um atacante já
  descobriria os endpoints observando o tráfego do client de qualquer forma.

## O que NUNCA pode entrar aqui (ou em qualquer lugar do git)

- `.env` / `.env.*` (ignorados globalmente no `.gitignore`)
- `service_role` key, senha do banco, connection strings com senha
- chaves de API de terceiros

A `service_role` e a `SUPABASE_URL` vivem **só** nas env vars da Vercel.
A `anon` key do client é pública por design — a segurança vem do RLS,
não de esconder a chave.

Se um segredo for commitado por acidente: **revogue imediatamente**
(Project Settings → API → regenerate) e reforce as envs na Vercel —
apagar o commit não basta, o histórico do git preserva.
