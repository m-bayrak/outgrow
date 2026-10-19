#!/usr/bin/env bash
# Render key stills (times in seconds) and a contact sheet of them.
# Run from a Remotion project root. Usage: COMP=<CompositionId> stills.sh [t1 t2 ...]
# COMP defaults to Outgrow; FPS defaults to 60; times default to the Outgrow beats.
set -euo pipefail
comp=${COMP:-Outgrow}
fps=${FPS:-60}

times=("$@")
if [ ${#times[@]} -eq 0 ]; then
  times=(0.45 1.24 3.45 5.35 6.2 7.0 8.32 9.9 12.4)
fi

npx remotion bundle src/index.ts --out-dir=build --log=error >/dev/null
mkdir -p out/stills
inputs=()
for s in "${times[@]}"; do
  frame=$(awk "BEGIN { printf \"%d\", $s * $fps + 0.5 }")
  npx remotion still build "$comp" "out/stills/t$s.png" --frame="$frame" --log=error
  inputs+=(-i "out/stills/t$s.png")
done

n=${#times[@]}
if [ "$n" -ge 2 ]; then
  cols=3
  [ "$n" -lt 3 ] && cols=$n
  layout=""
  for ((k = 0; k < n; k++)); do
    c=$((k % cols)); r=$((k / cols))
    x="0"; for ((j = 0; j < c; j++)); do x="${x}+w0"; done
    y="0"; for ((j = 0; j < r; j++)); do y="${y}+h0"; done
    layout="${layout}${layout:+|}${x}_${y}"
  done
  ffmpeg -y -loglevel error "${inputs[@]}" \
    -filter_complex "xstack=inputs=$n:layout=$layout:fill=black,scale=1080:-1" out/sheet.png
  echo "out/sheet.png"
fi
