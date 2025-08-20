#!/usr/bin/env bash
# $1: input.mp4  $2: outdir
set -euo pipefail
IN="$1"; OUT="$2"; mkdir -p "$OUT"
# Model fetch (small.en as default)
test -f models/ggml-small.en.bin || {
  mkdir -p models
  curl -L -o models/ggml-small.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin
}
# Use whisper-cli
if ! command -v whisper-cli >/dev/null 2>&1; then
  echo "whisper-cli binary not found. Install via 'brew install whisper-cli'." >&2
  exit 1
fi
# Convert to WAV first since whisper-cli needs WAV format
ffmpeg -y -i "$IN" -ar 16000 -ac 1 -c:a pcm_s16le "$OUT/audio.wav"
whisper-cli -m models/ggml-small.en.bin -f "$OUT/audio.wav" -of "$OUT/transcript" -ovtt -np