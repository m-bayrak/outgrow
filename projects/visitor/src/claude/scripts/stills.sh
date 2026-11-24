#!/usr/bin/env bash
# Render the key frames (1–7) and a contact sheet of all that exist.
# Usage: scripts/stills.sh [n ...]
set -euo pipefail
cd "$(dirname "$0")/.."
[ $# -eq 0 ] && set -- 1 2 3 4 5 6 7
npx remotion bundle src/index.ts --out-dir=build --log=error >/dev/null
mkdir -p out/stills
for n in "$@"; do
  npx remotion still build VisitorFrames "out/stills/frame-$n.png" --frame=$((n - 1)) --log=error
done
if [ -f out/stills/frame-7.png ]; then
  ffmpeg -y -loglevel error -i out/stills/frame-%d.png \
    -vf "scale=540:-1,tile=4x2:padding=6:color=0x333333" -frames:v 1 out/sheet.png
  echo "out/sheet.png"
fi
