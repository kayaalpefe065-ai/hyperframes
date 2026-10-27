#!/usr/bin/env bash
# Crop downloaded prints to the picture itself (run once after tools/images.py).
set -euo pipefail
cd "$(dirname "$0")/../assets/img"
# Villa Diodati: the engraving sits in the middle of the scanned sheet (1280x909 download)
if [ "$(ffprobe -v error -select_streams v -show_entries stream=width -of csv=p=0 diodati.jpg)" = "1280" ]; then
  ffmpeg -v error -y -i diodati.jpg -vf "crop=644:416:354:208" -q:v 2 diodati.crop.jpg && mv diodati.crop.jpg diodati.jpg
fi
