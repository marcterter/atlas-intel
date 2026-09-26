#!/usr/bin/env bash
# Rend une scène en demi-résolution et produit une planche d'images (une toutes les 3 s).
# Usage : tools/preview.sh S04   →  output/preview/S04.mp4 et output/preview/S04.png
set -euo pipefail
cd "$(dirname "$0")/.."
id=$1
mkdir -p output/preview
npx remotion render "Scene-$id" "output/preview/$id.mp4" --scale=0.5 --log=error >/dev/null
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "output/preview/$id.mp4")
n=$(python3 -c "import math;print(max(1,math.ceil($dur/3)))")
cols=4; rows=$(( (n + cols - 1) / cols ))
ffmpeg -v error -y -i "output/preview/$id.mp4" -vf "fps=1/3,scale=480:-1,drawtext=text='%{pts\:hms}':x=8:y=8:fontsize=14:fontcolor=white,tile=${cols}x${rows}" -frames:v 1 "output/preview/$id.png" 2>/dev/null \
  || ffmpeg -v error -y -i "output/preview/$id.mp4" -vf "fps=1/3,scale=480:-1,tile=${cols}x${rows}" -frames:v 1 "output/preview/$id.png"
echo "output/preview/$id.png"
