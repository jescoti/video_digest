# Video Digest — Debugging Worklog (Append-Only)

Purpose: A timestamped, append-only log to coordinate debugging toward a reliable end-to-end run without modifying application code. Add new entries only at the end of this file.

Conventions:
- Timestamp in ISO 8601 with local timezone.
- Keep secrets out of the log; redact credentials and sensitive paths.
- Use clickable file/function links, for example [pipelineForUrl()](app/pipeline.js:12), [summarizeToMarp()](app/llm.js:7), [server.js](app/server.js:36).
- Commands are copy-pasteable as single-line shell invocations.

Fields per entry:
- Timestamp:
- Action:
- Command(s):
- Expected:
- Actual:
- Error (if any):
- Hypothesis:
- Next step:
- Files/Functions touched:
- Outcome:

----------------------------------------------------------------
Entry 1 — Day 0 Preflight

Timestamp:
Action: Preflight environment checks (Node, brew tools, Python packages, Swift toolchain, Marp CLI, env presence, writable dirs)
Command(s):
- node -v
- npm -v
- which ffmpeg && ffmpeg -version
- which yt-dlp && yt-dlp --version
- python3 -V
- python3 -m pip show pillow imagehash numpy
- xcode-select -p
- swiftc --version
- npx --yes @marp-team/marp-cli --version
- test -n "$OPENAI_API_KEY" && echo OPENAI_API_KEY=OK || echo OPENAI_API_KEY=MISSING
- test -d summaries && test -w summaries && echo summaries=OK || echo summaries=NOT_WRITABLE
- test -d site && test -w site && echo site=OK || echo site=NOT_WRITABLE
Expected:
- Node >= 20, npm present, ffmpeg and yt-dlp installed with versions printed.
- Python 3 present; pillow, ImageHash, numpy show as installed when venv is active if used.
- Xcode CLT path resolves; swiftc prints version.
- Marp CLI prints a version.
- OPENAI_API_KEY is present in shell env (provided by .env at runtime); summaries/ and site/ exist and are writable.
Actual:
Error (if any):
Hypothesis:
Next step:
Files/Functions touched:
- [server.js](app/server.js:1) loads .env
- [pipeline.js](app/pipeline.js:1) reads env and paths
- Tools referenced by [keyframes.sh](scripts/keyframes.sh:6), [transcribe.sh](scripts/transcribe.sh:11), [build_ocr.sh](scripts/build_ocr.sh:3), [ocr_vision.swift](scripts/ocr_vision.swift:1), [dedupe_ocr_aware.py](scripts/dedupe_ocr_aware.py:1), [parse_showinfo.js](scripts/parse_showinfo.js:1), [clean_vtt.py](scripts/clean_vtt.py:1)
- Functions: [pipelineForUrl()](app/pipeline.js:12), [summarizeToMarp()](app/llm.js:7)
Outcome:

----------------------------------------------------------------
Entry 2 — Server Startup

Timestamp:
Action: Start development server and verify endpoints
Command(s):
- npm run dev
- open http://localhost:7777/
- curl -s http://localhost:7777/api/list | jq .
Expected:
- Server logs show listening on port 7777 (fallback from env) per [server.js](app/server.js:36).
- UI loads at / (serves [ui.html](app/ui.html)).
- /api/list returns JSON index of prior runs (if any) and updates after ingestion.
Actual:
Error (if any):
Hypothesis:
Next step:
Files/Functions touched:
- [server.js](app/server.js:36) http server listen
- Static UI: [ui.html](app/ui.html)
Outcome:

----------------------------------------------------------------
Entry 3 — Test URL Ingestion

Timestamp:
Action: Trigger ingestion for test URL and monitor pipeline
Command(s):
- curl -s -X POST http://localhost:7777/api/ingest -H 'Content-Type: application/json' -d '{"url":"https://www.youtube.com/watch?v=lXEnnoXX-nA","focus":""}'
Expected:
- Server enqueues job and invokes [pipelineForUrl()](app/pipeline.js:12).
- Logs show external commands prefixed with ">" from sh()/run() ([pipeline.js](app/pipeline.js:9)).
- Artifacts appear under summaries/videos/lXEnnoXX-nA/: meta.json, keyframes/, kf_index.json, transcript.vtt, transcript_clean.md, slides.md, slides.html.
- Site index regenerated to /site/index.html by [regenerateSiteIndex()](app/pipeline.js:91).
Actual:
Error (if any):
Hypothesis:
Next step:
Files/Functions touched:
- Orchestrator: [pipelineForUrl()](app/pipeline.js:12)
- Keyframes: [keyframes.sh](scripts/keyframes.sh:6), [parse_showinfo.js](scripts/parse_showinfo.js:1)
- OCR: [build_ocr.sh](scripts/build_ocr.sh:3), [ocr_vision.swift](scripts/ocr_vision.swift:1)
- Dedupe: [dedupe_ocr_aware.py](scripts/dedupe_ocr_aware.py:1)
- Transcription: [transcribe.sh](scripts/transcribe.sh:11), [clean_vtt.py](scripts/clean_vtt.py:1)
- Site: [regenerateSiteIndex()](app/pipeline.js:91)
Outcome:

----------------------------------------------------------------
Entry 4 — LLM / Slides Generation

Timestamp:
Action: Validate LLM summarization and Marp rendering
Command(s):
- test -n "$OPENAI_API_KEY" && echo OPENAI_API_KEY=OK || echo OPENAI_API_KEY=MISSING
- echo "Model=${OPENAI_MODEL:-DEFAULT_IN_CODE}"  # set OPENAI_MODEL in .env if access errors
- ls -1 summaries/videos/lXEnnoXX-nA/slides.md summaries/videos/lXEnnoXX-nA/slides.html
- open summaries/videos/lXEnnoXX-nA/slides.html
Expected:
- LLM call from [summarizeToMarp()](app/llm.js:7) succeeds against the model configured in .env (fallback allowed).
- OpenAI chat.completions invoked at [app/llm.js](app/llm.js:30).
- Marp CLI (npx) runs at [pipeline.js](app/pipeline.js:71) and produces slides.html from slides.md.
- /site/index.html updated by [regenerateSiteIndex()](app/pipeline.js:91), and the deck is listed.
Actual:
Error (if any):
Hypothesis:
Next step:
Files/Functions touched:
- LLM: [summarizeToMarp()](app/llm.js:7), [app/llm.js](app/llm.js:30)
- Render: Marp step at [pipeline.js](app/pipeline.js:71)
- Site index: [regenerateSiteIndex()](app/pipeline.js:91)
Outcome:

----------------------------------------------------------------
Append new entries below this line, preserving append-only history.
## 2025-08-19T03:05:19Z — Day 0 Preflight (spec: [DEBUGGING_SPEC.md](docs/DEBUGGING_SPEC.md:1))

Action:
- Ran lightweight preflight probes to validate env without modifying code (per spec “Preflight Checks”).

Commands:
- node -v; npm -v
- which ffmpeg && ffmpeg -version
- which yt-dlp && yt-dlp --version
- python3 -V
- python3 -m pip show pillow imagehash numpy
- xcode-select -p; swiftc --version
- npx --yes @marp-team/marp-cli --version
- test -n "$OPENAI_API_KEY"
- test -d summaries && test -w summaries
- test -d site && test -w site

Expected:
- All core tools present and functional; OPENAI_API_KEY set; summaries/site writable.

Actual:
- Node/npm: OK (v24.6.0 / 11.5.1)
- ffmpeg: OK (/opt/homebrew/bin/ffmpeg, ffmpeg 7.1.1)
- yt-dlp: Present but BROKEN: “bad interpreter” due to missing embedded Python path (/opt/homebrew/Cellar/yt-dlp/2025.8.11/libexec/bin/python)
- Python3: OK (3.12.11)
- Python pkgs: MISSING pillow, ImageHash, numpy (required by [dedupe_ocr_aware.py](scripts/dedupe_ocr_aware.py:1))
- Xcode CLT: OK (/Library/Developer/CommandLineTools)
- Swift: OK (Apple Swift 6.1.2) for [scripts/ocr_vision.swift](scripts/ocr_vision.swift:1)
- Marp: OK (@marp-team/marp-cli v4.2.3)
- OPENAI_API_KEY: MISSING (will block [summarizeToMarp()](app/llm.js:7) at [openai.chat.completions.create()](app/llm.js:30))
- Directory perms: summaries=OK; site=BAD (missing/not writable), which will block [regenerateSiteIndex()](app/pipeline.js:91)

Error:
- yt-dlp “bad interpreter”; missing OPENAI_API_KEY; missing Python pkgs; missing/wrong perms for site dir.

Hypothesis:
- Top blockers for end-to-end: (1) yt-dlp broken prevents input.mp4 download in [pipelineForUrl()](app/pipeline.js:12); (2) missing OPENAI_API_KEY blocks LLM at [llm.js](app/llm.js:7). Secondary: Python pkgs needed by [dedupe_ocr_aware.py](scripts/dedupe_ocr_aware.py:1); site dir required by [pipeline.js](app/pipeline.js:91).

Next step:
- Remediate environment per spec Step 2 (Homebrew install/repair, venv, build OCR helper); then create .env (not committed), then proceed to server run and ingestion.

Files/Functions referenced:
- [server.js](app/server.js:36)
- [pipelineForUrl()](app/pipeline.js:12)
- [summarizeToMarp()](app/llm.js:7), [openai.chat.completions.create()](app/llm.js:30)
- [transcribe.sh](scripts/transcribe.sh:11)
- [scripts/dedupe_ocr_aware.py](scripts/dedupe_ocr_aware.py:1)
- [regenerateSiteIndex()](app/pipeline.js:91)

Outcome:
- Preflight recorded; remediation required.

---

## 2025-08-19T03:06:02Z — Step 2 Remediation (spec: “Dependency setup and environment”)

Action:
- Repaired yt-dlp; ensured site dir; created Python venv and installed pkgs; ensured whisper CLI; installed Node deps; built OCR helper. No code changes.

Commands and Results:
- brew reinstall yt-dlp → Reinstalled; yt-dlp --version → 2025.08.11 (OK). Fixes “bad interpreter” for [pipelineForUrl()](app/pipeline.js:12) download.
- mkdir -p site && test -w site → site=OK (unblocks [regenerateSiteIndex()](app/pipeline.js:91)).
- python3 -m venv .venv && source .venv/bin/activate && pip install pillow ImageHash numpy → pip pkgs=OK (satisfies [dedupe_ocr_aware.py](scripts/dedupe_ocr_aware.py:1)).
- brew install whisper-cli (not available) → whisper-cli reported OK at /opt/homebrew/bin/whisper-cli. If fallback needed, plan was to install whisper-cpp and symlink per [transcribe.sh](scripts/transcribe.sh:11). Current state: whisper-cli present.
- npm install → up to date; 0 vulnerabilities.
- npm run build-ocr → Built [scripts/ocr_vision](scripts/ocr_vision) via [build_ocr.sh](scripts/build_ocr.sh:3) successfully.

Expected:
- yt-dlp working; site dir writable; Python deps installed; whisper CLI available; OCR helper built; Node deps installed.

Actual:
- Matches expected; all listed remediation succeeded.

Error:
- None during remediation. OPENAI_API_KEY still missing (by design; to be set in .env next).

Hypothesis:
- With yt-dlp fixed and deps installed, the pipeline should proceed through download, keyframes, OCR, dedupe, and transcription (assuming ffmpeg+whisper-cli OK). LLM summarization will fail without OPENAI_API_KEY until .env is provided.

Next step:
- Create .env with required keys (without committing) per spec Step 3 and confirm availability in shell for [server.js](app/server.js:1) and [pipeline.js](app/pipeline.js:1). Then proceed to start server (Step 4) and trigger ingestion (Step 5).

Files/Functions referenced:
- [pipelineForUrl()](app/pipeline.js:12)
- [transcribe.sh](scripts/transcribe.sh:11)
- [build_ocr.sh](scripts/build_ocr.sh:3)
- [ocr_vision.swift](scripts/ocr_vision.swift:1)
- [regenerateSiteIndex()](app/pipeline.js:91)

Outcome:
- Environment remediated. Proceed to .env creation and server run.

## 2025-08-19T03:07:09Z — Step 4 Start Server (entry: [server.js](app/server.js:36))

Action:
- Attempted to start dev server with env from .env loaded into shell.

Commands:
- set -a; . ./.env; set +a
- npm run dev  (starts [server.js](app/server.js:1))

Expected:
- Console: “Video Digest listening on http://localhost:7777” from [server.listen()](app/server.js:36).

Actual:
- Error: EADDRINUSE: address already in use :::7777
- Stack at [server.listen() call](app/server.js:37)
- Node v24.6.0

Error:
- Port 7777 already taken by an existing process.

Hypothesis:
- A prior or background instance of the app (or another service) is occupying port 7777. Since [server.js](app/server.js:36) has a port fallback to 7777, we either need to free 7777 or set PORT in env to a free port.

Next step:
- Identify and kill the process on port 7777 (macOS): lsof -i :7777 -nP and kill PID. Then re-run npm run dev. Alternatively, export PORT=7878 (non-privileged free port) and re-run to verify server boot without changing code.

Files/Functions referenced:
- [server.listen()](app/server.js:36)
- Port fallback logic in [server.js](app/server.js:36)

Outcome:
- Server not started due to port conflict. Proceed to free the port or use PORT override and retry.

## 2025-08-19T03:17:04Z — Server listening (entry: [server.js](app/server.js:36))

Action:
- Diagnosed and cleared port 7777 conflict; started server. Monitored live logs for readiness.

Commands:
- lsof -nP -iTCP:7777 -sTCP:LISTEN
- kill PID (if found) then re-check
- npm run dev (launch [server.js](app/server.js:1))

Expected:
- “Video Digest listening on http://localhost:7777”

Actual:
- 7777 free
- Video Digest listening on http://localhost:7777

Error:
- None after freeing port.

Hypothesis:
- Server is healthy; ready to accept ingestion requests at /api/ingest (handled in [server.js](app/server.js:26) trimming inputs and invoking [pipelineForUrl()](app/pipeline.js:12)).

Next step:
- Step 5: Trigger ingestion via POST to /api/ingest with test URL; observe server logs for subprocess markers from [sh()](app/pipeline.js:9)/[run()](app/pipeline.js:10), including yt-dlp download, keyframes, OCR, dedupe, transcribe, LLM, Marp, and site index regeneration.

Files/Functions referenced:
- [server.js](app/server.js:26)
- [pipelineForUrl()](app/pipeline.js:12)
- [sh()](app/pipeline.js:9), [run()](app/pipeline.js:10)

Outcome:
- Server running; proceed to ingestion.

## 2025-08-19T03:17:41Z — Step 5 Ingestion triggered and failure captured (pipeline: [pipelineForUrl()](app/pipeline.js:12))

Action:
- POST /api/ingest with test URL. Monitored server-side subprocess logs.

Commands:
- curl -s -X POST http://localhost:7777/api/ingest -H 'Content-Type: application/json' -d '{"url":"https://www.youtube.com/watch?v=lXEnnoXX-nA","focus":""}'
- Probed filesystem for artifacts; sampled server output.

Expected:
- With deps resolved, pipeline proceeds through keyframes → OCR → dedupe → transcription → LLM → Marp → site index regeneration.

Actual (server logs excerpt):
- > bash [scripts/keyframes.sh](scripts/keyframes.sh:6) summaries/videos/lXEnnoXX-nA/input.mp4 summaries/videos/lXEnnoXX-nA 0.30
- > [scripts/ocr_vision](scripts/ocr_vision) … > "summaries/videos/lXEnnoXX-nA/_ocr.json"
- > python3 [scripts/dedupe_ocr_aware.py](scripts/dedupe_ocr_aware.py:1) "…/_frames_w_ocr_and_time.json" 6 60 0.90 3 > "…/kf_index.json"
- Traceback: ModuleNotFoundError: No module named 'PIL'
- Thrown via [sh()](app/pipeline.js:9) called from [pipelineForUrl()](app/pipeline.js:53)

Error:
- Python module PIL missing in the environment used by node/execSync.

Hypothesis:
- The venv (.venv) has Pillow/ImageHash/numpy installed, but [pipeline.js](app/pipeline.js:9) calls `python3` without activating the venv, so it runs system python lacking PIL. Two non-code-change remediations per spec: (a) install required pkgs globally for system python3; or (b) ensure PATH/ENV uses .venv/bin/python3 for subprocesses by exporting PATH in shell before starting server.

Next step:
- Install the required Python packages into the system python3 environment (no code changes). Then re-trigger ingestion. If still failing, export PATH to include .venv/bin ahead of starting the server to have python3 resolve to venv interpreter.

Files/Functions referenced:
- [pipelineForUrl()](app/pipeline.js:12), [sh()](app/pipeline.js:9)
- [scripts/dedupe_ocr_aware.py](scripts/dedupe_ocr_aware.py:1)

Outcome:
- Pipeline failed at dedupe step due to missing PIL in active python. Proceed to remediate Python packages globally and retry.

## 2025-08-19T03:58:49Z — Plan review and decision (no code changes applied)

Action:
- Reviewed proposed plan to add shims and modify [pipeline.js](app/pipeline.js:12) to force venv usage and replace direct `python3`/`yt-dlp` calls.

Proposal summary (from user):
- Add scripts/ensure_venv.sh, scripts/py, scripts/yt; wrapper scripts/run_dev.sh and scripts/run; chmod +x.
- Update package.json to run server via wrapper.
- Edit [pipeline.js](app/pipeline.js:12) to call shims instead of raw commands.

Analysis:
- The plan is robust for long-term agent-proofing and ensures consistent interpreter/tooling.
- However, current debug task explicitly states: “Do not change code.” The proposal includes edits to [pipeline.js](app/pipeline.js:12) and package.json, which are code/config changes beyond environment setup.
- For this debug run, we can achieve end-to-end success without changing code by launching the server with PATH prefixed to .venv/bin so child `python3` resolves to venv (Pillow/ImageHash/numpy already installed). This aligns with the spec’s constraints and avoids repository changes.

Decision:
- Proceed with no repository code changes. Use environment-only remediation: start server with PATH prefixed to .venv/bin and re-run ingestion. If successful, document outcome and acceptance checklist per [DEBUGGING_SPEC.md](docs/DEBUGGING_SPEC.md).

Next step:
- Kill any existing server; start server with PATH="$(pwd)/.venv/bin:$PATH"; trigger ingestion; verify artifacts (transcript, slides); open slides and site index.

References:
- [sh()](app/pipeline.js:9), [pipelineForUrl()](app/pipeline.js:12), [server.listen()](app/server.js:36), [transcribe.sh](scripts/transcribe.sh:11), [summarizeToMarp()](app/llm.js:7).

Outcome:
- Approved environment-only path for this debug session; defer shim-based repo changes to a separate code task if desired later.
