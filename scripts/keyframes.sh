#!/usr/bin/env bash
# $1: input.mp4  $2: outdir  $3: scene threshold (e.g. 0.30)
set -euo pipefail
IN="$1"; OUT="$2"; TH="${3:-0.30}"
mkdir -p "$OUT/keyframes"
ffmpeg -hide_banner -loglevel info -y -i "$IN"   -vf "select='gt(scene,$TH)',showinfo" -vsync vfr "$OUT/keyframes/kf_%04d.jpg"   2> "$OUT/keyframes/_showinfo.log"
