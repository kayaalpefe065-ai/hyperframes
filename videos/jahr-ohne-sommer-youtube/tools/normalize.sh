#!/usr/bin/env bash
# Loudness-normalise the voice takes to -16 LUFS / -1.5 dBTP (YouTube plays around -14).
set -euo pipefail
cd "$(dirname "$0")/../assets/voice"
for f in [0-9][0-9].mp3; do
  ffmpeg -v error -y -i "$f" -af "loudnorm=I=-16:TP=-1.5:LRA=11" -ar 44100 -b:a 160k "${f%.mp3}.norm.mp3"
  mv "${f%.mp3}.norm.mp3" "$f"
done
