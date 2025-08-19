import 'dotenv/config';
import fs from 'fs'; import fsp from 'fs/promises';
import path from 'path'; import { spawnSync, execSync } from 'child_process';
import { summarizeToMarp } from './llm.js';

const SUM = process.env.SUMMARIES_DIR || './summaries';
const SITE = process.env.SITE_DIR || './site';

function sh(cmd, opts={}){ console.log('>', cmd); execSync(cmd, {stdio:'inherit', shell:'/bin/zsh', ...opts}); }
function run(cmd, args, opts={}){ console.log('>', cmd, (args||[]).join(' ')); const r=spawnSync(cmd, args, {stdio:'inherit', shell:false, ...opts}); if(r.status) throw new Error(`${cmd} ${r.status}`); }

export async function pipelineForUrl(url, focus=""){
  // Determine YouTube ID (yt-dlp)
  const yt_id = execSync(`yt-dlp --get-id "${url}"`, {shell:'/bin/zsh'}).toString().trim();
  const vdir = path.join(SUM, 'videos', yt_id);
  await fsp.mkdir(path.join(vdir, 'keyframes'), { recursive: true });
  await fsp.writeFile(path.join(vdir,'source.txt'), url);

  // Download if not present
  if (!fs.existsSync(path.join(vdir, 'input.mp4'))) {
    sh(`yt-dlp -f "best[ext=mp4]/best" -o "${vdir}/input.%(ext)s" "${url}"`);
    if (fs.existsSync(path.join(vdir,'input.mkv'))) sh(`ffmpeg -y -i "${vdir}/input.mkv" -c copy "${vdir}/input.mp4"`);
  }

  // Meta
  const meta = JSON.parse(execSync(`yt-dlp -J "${url}"`, {shell:'/bin/zsh'}).toString());
  await fsp.writeFile(path.join(vdir,'meta.json'), JSON.stringify({
    yt_id, title: meta.title, channel: meta.uploader, duration: meta.duration,
    upload_date: meta.upload_date, url
  }, null, 2));

  // Keyframes + showinfo log
  run('bash', ['scripts/keyframes.sh', `${vdir}/input.mp4`, vdir, process.env.SCENE_THRESH || '0.30']);
  // Parse pts_time sequence
  const times = JSON.parse(execSync(`node scripts/parse_showinfo.js "${vdir}/keyframes/_showinfo.log"`).toString());
  const files = fs.readdirSync(path.join(vdir,'keyframes')).filter(f=>/^kf_\d+\.jpg$/.test(f)).sort();

  // OCR (Apple Vision)
  const ocrJsonPath = path.join(vdir,'_ocr.json');
  const cmd = `./scripts/ocr_vision ${files.map(f=>path.join(vdir,'keyframes',f)).join(' ')} > "${ocrJsonPath}"`;
  sh(cmd);

  // Build raw frames array {file,t,ocr_text}
  const ocrArr = JSON.parse(fs.readFileSync(ocrJsonPath,'utf8'));
  const raw = files.map((f,i)=>({ file: path.join(vdir,'keyframes',f), t: times[i] ?? 0, ocr_text: (ocrArr.find(o=>o.file.endsWith(f))||{}).text || "" }));
  await fsp.writeFile(path.join(vdir,'_frames_w_ocr_and_time.json'), JSON.stringify(raw,null,2));

  // Dedupe (OCR+phash+time)
  const PHASH = process.env.PHASH_THRESH || '6';
  const RUN   = process.env.RUN_JOIN_SEC || '60';
  const JACC  = process.env.TEXT_JACCARD || '0.90';
  const SIMH  = process.env.SIMHASH_HAMMING || '3';
  sh(`python3 scripts/dedupe_ocr_aware.py "${vdir}/_frames_w_ocr_and_time.json" ${PHASH} ${RUN} ${JACC} ${SIMH} > "${vdir}/kf_index.json"`);

  // Transcribe
  run('bash', ['scripts/transcribe.sh', `${vdir}/input.mp4`, vdir]);
  const vtt = path.join(vdir,'transcript.vtt');
  const md  = path.join(vdir,'transcript_clean.md');
  const clean = spawnSync('python3', ['scripts/clean_vtt.py'], { input: fs.readFileSync(vtt), encoding:'utf8' });
  if (clean.status) throw new Error('clean_vtt failed');
  fs.writeFileSync(md, clean.stdout);

  // Align (most recent prior)
  const LOOK = process.env.ALIGN_LOOKBACK_SEC || '600';
  run('python3', ['scripts/align_frames_prior.py', vdir, LOOK]);

  // LLM → Marp slides
  await summarizeToMarp(vdir, { focus });

  // Compile slides → HTML
  run('npx', ['-y','@marp-team/marp-cli', path.join(vdir,'slides.md'), '--html', '--allow-local-files', '--output', path.join(vdir,'slides.html')]);

  // Update site index
  await regenerateSiteIndex();

  // Commitable (user can git init later)
  console.log('Done:', yt_id);
  return yt_id;
}

export async function listDecks(){
  const base = path.join(SUM,'videos');
  if (!fs.existsSync(base)) return [];
  const ids = fs.readdirSync(base).filter(f=>fs.existsSync(path.join(base,f,'slides.html')));
  return ids.map(id=>{
    const m = JSON.parse(fs.readFileSync(path.join(base,id,'meta.json'),'utf8'));
    return { id, title: m.title, channel: m.channel, slides: `/summaries/videos/${id}/slides.html` };
  });
}

async function regenerateSiteIndex(){
  await fsp.mkdir(SITE, { recursive:true });
  const list = await listDecks();
  const html = `<!doctype html><meta charset="utf-8"><title>Video Digest Index</title>
  <link rel="stylesheet" href="/assets/style.css"><div class=wrap>
  <h1>All Digests</h1><ul>${list.map(v=>`<li><a href="/summaries/videos/${v.id}/slides.html">${v.title}</a> — ${v.channel}</li>`).join('')}</ul></div>`;
  await fsp.writeFile(path.join(SITE,'index.html'), html);
}
