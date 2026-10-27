#!/usr/bin/env bash
# Word timings for every voice take -> tools/words/NN.json (whisper small, German).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p tools/words
work=$(mktemp -d -p "${TMPDIR:-.}")
for f in assets/voice/*.mp3; do
  id=$(basename "$f" .mp3)
  [ -s "tools/words/$id.json" ] && continue
  mkdir -p "$work/$id" && cp "$f" "$work/$id/"
  (cd "$work/$id" && npx --yes hyperframes@0.8.209 transcribe "$id.mp3" --model small --language de --json >/dev/null 2>&1)
  cp "$work/$id/transcript.json" "tools/words/$id.json"
  echo -n "$id "
done
rm -rf "$work"
