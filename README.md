# Local Video Digest Webapp

Paste a YouTube URL → the app downloads the video, extracts keyframes, OCRs + dedupes slides, transcribes locally (CPU), aligns transcript to the most recent prior keyframe, then asks OpenAI (GPT‑5) to produce a **Marp** slide deck. The deck is compiled to **HTML** and saved to `summaries/…/slides.html`. A local index page lists all processed talks.

## Quick start (macOS, Apple Silicon)

```bash
# 1) Install system deps (Homebrew recommended)
xcode-select --install
/bin/zsh -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install ffmpeg yt-dlp jq node python gh tesseract

# whisper-cli (local STT)
brew install whisper-cli

# Marp CLI (for HTML slides)
npm -g i @marp-team/marp-cli

# 2) Set up Python virtual environment
cd video_digest
python3 -m venv .venv
source .venv/bin/activate
pip install pillow ImageHash numpy

# 3) Install project deps
cp .env.example .env   # add your OpenAI key
npm install
npm run build-ocr      # compile the Apple Vision OCR helper (Swift)

# 4) Run (with venv activated)
source .venv/bin/activate
PATH="$(pwd)/.venv/bin:$PATH" npm run dev
# open http://localhost:7777
```

## Environment

Edit `.env` (copied from `.env.example`):

- `OPENAI_API_KEY` — your key
- `OPENAI_MODEL` — defaults to `gpt-5` (or set `gpt-5-chat-latest`)
- Tuning knobs (scene threshold, dedupe, etc.) are also in `.env`

## Usage

1. Open the web UI → paste a YouTube URL.
2. (Optional) Provide a **Focus** instruction (e.g., _“Focus on how they used the Lumi system, and specific numerical benchmarks.”_)
3. The job queues and runs. When done, the deck appears in the list.
4. Artifacts live under `summaries/videos/{yt_id}/`:
   - `meta.json`, `source.txt`
   - `transcript.vtt`, `transcript_clean.md`
   - `keyframes/…`
   - `kf_index.json`, `segments.json`
   - `slides.md`, `slides.html`

## Notes

- **CPU-only** pipeline (no GPU). whisper-cli runs locally.
- **Apple Vision OCR** used via a tiny Swift binary (fast + on-device). Tesseract is installed as a fallback if you want to extend.
- **Python virtual environment** is required for the dedupe script dependencies (Pillow, ImageHash, numpy).
- Alignment is **left-anchored**: transcript text is associated to the most recent prior keyframe (within a configurable lookback).
- We never commit video files; only images + text. Initialize your own git repo if you want versioning or push to GitHub.

## Scripts overview

- `scripts/keyframes.sh` — ffmpeg scene-based keyframe extraction (+ showinfo log)
- `scripts/parse_showinfo.js` — parse frame timestamps
- `scripts/ocr_vision.swift` / `npm run build-ocr` — Apple Vision OCR
- `scripts/dedupe_ocr_aware.py` — OCR+phash+time dedupe
- `scripts/transcribe.sh` — whisper-cli → VTT
- `scripts/clean_vtt.py` — turn VTT into readable Markdown with `[mm:ss]`
- `scripts/align_frames_prior.py` — left-anchored alignment
- `app/llm.js` — OpenAI call to produce Marp slides (HTML via marp-cli)
- `app/pipeline.js` — orchestrates the pipeline
- `app/server.js` — local web UI + API

## License

MIT (yours to adapt).