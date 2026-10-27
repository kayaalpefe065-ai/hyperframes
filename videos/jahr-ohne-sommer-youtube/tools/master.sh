#!/usr/bin/env bash
# Two-pass loudness master of a rendered MP4 to -14 LUFS / -1.5 dBTP (video stream copied).
# Usage: tools/master.sh in.mp4 out.mp4
set -euo pipefail
in=$1; out=$2
m=$(ffmpeg -hide_banner -i "$in" -vn -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$m" | python3 -I -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -hide_banner -v error -y -i "$in" -c:v copy -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true" -c:a aac -b:a 192k -ar 48000 "$out"
