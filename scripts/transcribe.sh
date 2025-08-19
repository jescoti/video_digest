#!/usr/bin/env bash
# $1: input.mp4  $2: outdir
set -euo pipefail
IN="$1"; OUT="$2"; mkdir -p "$OUT"
# Model fetch (small.en as default)
test -f models/ggml-small.en.bin || {
  mkdir -p models
  curl -L -o models/ggml-small.en.bin https://ggml.ggerganov.com/ggml-model-whisper-small.en.bin
}
# Resolve whisper.cpp binary (homebrew may name it 'whisper-cpp' or 'main')
BIN=""
if command -v whisper-cpp >/dev/null 2>&1; then BIN="whisper-cpp"; fi
if [ -z "$BIN" ] && command -v main >/dev/null 2>&1; then BIN="main"; fi
if [ -z "$BIN" ]; then
  echo "whisper.cpp binary not found (tried 'whisper-cpp' and 'main'). Install via 'brew install whisper-cpp'." >&2
  exit 1
fi
$BIN -m models/ggml-small.en.bin -f "$IN" -of "$OUT/transcript" -ovtt -np
