#!/usr/bin/env bash
# Generate a single voice-line mp3 for the Umain Arena audio pack.
#
# Usage:
#   scripts/gen-voice.sh "frase a falar" [saida.mp3]
#
# Pergunta apenas o TOM da voz e se a voz é MASCULINA. O resto é automático:
# se não passar a saída, o nome vem de um slug da frase (ex.: "Ship it!" -> ship-it.mp3).
#
# Pular as perguntas (útil pra automação/lote):
#   TOM=4 MASC=s scripts/gen-voice.sh "Ship it!" developers/ingame/dev-01.mp3
#
# Requisitos: macOS `say` + `lame` (brew install lame).
# Vozes: sobrescreva com VOICE_MALE / VOICE_FEMALE se quiser outras.
set -euo pipefail

PHRASE="${1:-}"
OUT="${2:-}"

if [ -z "$PHRASE" ]; then
  echo "uso: $0 \"frase a falar\" [saida.mp3]" >&2
  exit 1
fi

command -v say  >/dev/null 2>&1 || { echo "erro: 'say' não encontrado (precisa de macOS)." >&2; exit 1; }
command -v lame >/dev/null 2>&1 || { echo "erro: 'lame' não encontrado — rode: brew install lame" >&2; exit 1; }

VOICE_MALE="${VOICE_MALE:-Daniel}"      # en_GB masculina
VOICE_FEMALE="${VOICE_FEMALE:-Samantha}" # en_US feminina

# --- pergunta 1: tom (rate = velocidade, poff = ajuste de altura) ---
TOM="${TOM:-}"
if [ -z "$TOM" ]; then
  echo "Tom da voz:"
  echo "  1) normal    2) grave    3) agudo    4) animado    5) calmo"
  printf "Escolha [1-5] (1): "
  read -r TOM || true
fi
TOM="${TOM:-1}"

case "$TOM" in
  1|normal)  RATE=175; POFF=0;   TOM_NAME=normal  ;;
  2|grave)   RATE=160; POFF=-12; TOM_NAME=grave   ;;
  3|agudo)   RATE=185; POFF=12;  TOM_NAME=agudo   ;;
  4|animado) RATE=210; POFF=8;   TOM_NAME=animado ;;
  5|calmo)   RATE=140; POFF=-4;  TOM_NAME=calmo   ;;
  *) echo "erro: tom inválido '$TOM' (use 1-5)." >&2; exit 1 ;;
esac

# --- pergunta 2: voz masculina? ---
MASC="${MASC:-}"
if [ -z "$MASC" ]; then
  printf "Voz masculina? [s/N]: "
  read -r MASC || true
fi
case "$MASC" in
  s|S|sim|SIM|y|Y|yes|YES) VOICE="$VOICE_MALE";   PBASE=40 ;;
  *)                       VOICE="$VOICE_FEMALE"; PBASE=50 ;;
esac

# altura final (pitch base), com trava de segurança
PBAS=$(( PBASE + POFF ))
[ "$PBAS" -lt 20 ] && PBAS=20
[ "$PBAS" -gt 70 ] && PBAS=70

# --- saída: slug da frase se não informado ---
if [ -z "$OUT" ]; then
  SLUG=$(printf '%s' "$PHRASE" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-*//;s/-*$//')
  [ -z "$SLUG" ] && SLUG=voice
  OUT="${SLUG}.mp3"
fi
mkdir -p "$(dirname "$OUT")"

# --- gera: say -> WAV -> lame -> MP3 ---
TMPD=$(mktemp -d)
trap 'rm -rf "$TMPD"' EXIT
say -v "$VOICE" -r "$RATE" -o "$TMPD/v.wav" \
  --file-format=WAVE --data-format=LEI16@44100 \
  "[[pbas $PBAS]] $PHRASE"
lame --quiet -m m -b 96 "$TMPD/v.wav" "$OUT"

echo "✓ gerado: $OUT  (voz=$VOICE, tom=$TOM_NAME, rate=$RATE, pitch=$PBAS)"
