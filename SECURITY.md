# Modelo de segurança — CS BRASIL

## A verdade técnica primeiro

Este é um jogo **sem servidor autoritativo** (por enquanto): a partida roda
100% no browser do jogador. Isso significa que **o client é, por definição,
não-confiável** — um atacante com um trainer (edição de memória/JS, como o da
screenshot do pentester) consegue god mode, speed, autoshot etc. no PRÓPRIO
jogo dele. **Nenhum anti-cheat client-side para isso** — é teatro de
obfuscação, e nós não fazemos teatro.

O que dá pra defender de verdade hoje é a **integridade do ranking** — e é
aí que concentrarmos tudo: validação estatística e moderação no servidor.

A fix real é o multiplayer autoritativo (fase futura), onde o servidor
testemunha as kills. Até lá, as camadas abaixo.

## Camadas ativas

1. **Token por nick** (UUID no navegador) — impede roubo de nick/stats alheios.
2. **Rate limit por nick** (90s) e **por IP** (60s + 200 partidas/dia, via
   `submit_log`) — contra floods e nick-hopping.
3. **Tetos absolutos** — 150 kills/deaths, streak 30, 1500s por partida.
4. **Consistência física (anti-trainer)**:
   - kills ≤ 45 por round (respawn de 2,5s torna mais impossível);
   - ≥ 80s por round (speed hack não produz partida instantânea).
5. **Flags automáticas** — tentativa implausível = +1 flag; **3 flags = sai
   do ranking sozinho** (`players.hidden`).
6. **Registro com rate limit** (10/min por IP) contra nick-farming.
7. **RLS em todas as tabelas**; escrita só via RPC validado; `service_role`
   key existe apenas nas env vars da Vercel.
8. **Sem segredos no client** — a anon key é pública por design (a segurança
   é o RLS, não esconder a chave).

## LGPD / privacidade

- `submit_log` guarda IP + nick + timestamp **apenas** para segurança
  operacional (anti-abuso), com **retenção máxima de 7 dias** — apague
  periodicamente: `delete from submit_log where created_at < now() - interval '7 days';`
- Geo no mapa é nível cidade (header da Vercel), IP nunca é persistido.

## Moderação (SQL pronto)

```sql
-- esconder um jogador do ranking
update players set hidden = true where nick = 'NICK';
-- desbanir + zerar flags
update players set hidden = false, flagged_count = 0 where nick = 'NICK';
-- suspeitos acumulando flags
select nick, flagged_count, hidden from players where flagged_count > 0 order by flagged_count desc;
-- submits recentes de um IP
select * from submit_log where ip = '1.2.3.4' order by created_at desc limit 50;
```

## O que NÃO fazemos (de propósito)

- Assinatura/HMAC de payload no client — para scripts de `curl` ingênuos, mas
  qualquer trainer extrai o segredo do JS. Custo sem benefício real.
- Anti-cheat client-side (detecção de devtools, debugger traps) — bypassado
  em minutos por quem usa trainer. Não vale a manutenção.

## Roadmap de segurança

- **Multiplayer autoritativo** (fase futura): servidor valida kills/dano —
  o único fix completo contra trainer.
- Sessões de partida assinadas pelo servidor (partida só conta se iniciada e
  encerrada com o servidor observando).
