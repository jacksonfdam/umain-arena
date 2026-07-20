#!/usr/bin/env bash
# Downloads the audio pack (voice lines + weapon sounds) into public/audio/.
# The pack is NOT committed for licensing reasons — see README, "Audio pack".
set -e
cd "$(dirname "$0")/.."

# Pack zip URL. Configure via the AUDIO_PACK_URL env var or edit here
# (e.g. a GitHub Release asset, or a private R2/S3 URL for deploys).
URL="${AUDIO_PACK_URL:-https://github.com/jacksonfdam/umain-arena/releases/download/audio-pack-v3/audio-pack-v3.zip}"
DEST="public/audio"

if [ -f "$DEST/manifest.json" ]; then
  echo "audio/ already configured — nothing to do."
  exit 0
fi
mkdir -p "$DEST"
echo "Downloading audio pack from: $URL"
curl -fsSL "$URL" -o /tmp/umain-arena-audio.zip
unzip -o -q /tmp/umain-arena-audio.zip -d "$DEST/"
[ -f "$DEST/manifest.json" ] || cp "$DEST/manifest.example.json" "$DEST/manifest.json"
echo "Done. Audio installed in $DEST/."
