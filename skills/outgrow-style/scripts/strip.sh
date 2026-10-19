#!/usr/bin/env bash
# Part of the outgrow-style skill.
# strip.sh <video> <start_s> <end_s> <count> <out.png> — tile evenly spaced frames in a row
set -euo pipefail
video=$1; a=$2; b=$3; n=$4; out=$5
dur=$(awk "BEGIN{print $b-$a}")
fps=$(awk "BEGIN{print ($n-1)/$dur}")
ffmpeg -y -loglevel error -ss "$a" -t "$(awk "BEGIN{print $dur+0.02}")" -i "$video" \
  -vf "fps=$fps,scale=216:-1,pad=iw+4:ih+4:2:2:0x333333,tile=${n}x1" -frames:v 1 "$out"
echo "$out"
