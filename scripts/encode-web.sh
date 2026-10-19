#!/usr/bin/env bash
# Encode a master render into a web video and a poster frame for docs/media.
# Usage: scripts/encode-web.sh <master.mp4> <out-base-without-extension> [poster-second]
# Example: scripts/encode-web.sh projects/outgrow/src/claude/out/final.mp4 docs/media/outgrow/04-claude-loop 12
set -euo pipefail
master=$1
base=$2
poster_at=${3:-}
if [ -e "$base.mp4" ]; then
  echo "Refusing to overwrite $base.mp4 — published versions are never replaced." >&2
  exit 1
fi
mkdir -p "$(dirname "$base")"
ffmpeg -y -loglevel error -i "$master" -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart -an "$base.mp4"
if [ -z "$poster_at" ]; then
  duration=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$master")
  poster_at=$(awk "BEGIN { printf \"%.2f\", $duration - 0.5 }")
fi
ffmpeg -y -loglevel error -ss "$poster_at" -i "$master" -frames:v 1 -vf "scale=540:-2" -q:v 3 "$base.jpg"
ls -la "$base.mp4" "$base.jpg"
