#!/usr/bin/env bash
# Render the profile picture and crop it to a 1080x1080 PNG (profilbild.png).
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -I tools/profil.py
png=$(npx --yes hyperframes@0.8.209 snapshot --at 0.5 2>&1 | grep -oE "/[^ ]*at-0.5s.png" | head -1)
ffmpeg -v error -y -i "$png" -vf "crop=1080:1080:0:420" profilbild.png
echo profilbild.png
