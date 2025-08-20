import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipelineForUrl, listDecks } from './pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express(); app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/summaries', express.static(path.join(__dirname, '..', 'summaries')));
app.use('/site', express.static(path.join(__dirname, '..', 'site')));
app.get('/', (_,res)=>res.sendFile(path.join(__dirname,'ui.html')));

let busy = false;
const q = [];
async function pump(){
  if (busy || !q.length) return;
  busy = true;
  const { url, focus } = q.shift();
  try { await pipelineForUrl(url, focus); }
  catch(e){ console.error(e); }
  finally { busy = false; pump(); }
}

app.post('/api/ingest', async (req,res)=>{
  const url = (req.body?.url||'').trim();
  const focus = (req.body?.focus||'').trim();
  if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(url))
    return res.status(400).json({error:'Bad URL'});
  q.push({ url, focus }); pump();
  res.json({ ok:true, message:'Queued' });
});

app.get('/api/list', async (_,res)=> res.json(await listDecks()));

app.get('/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  const slidePath = path.join(__dirname, '..', 'summaries', 'videos', videoId, 'slides.html');
  
  if (!fs.existsSync(slidePath)) {
    // Try to generate if slides don't exist
    try {
      console.log(`Generating slides for ${videoId}...`);
      // For existing video directories, just run the LLM and compilation steps
      const vdir = path.join(__dirname, '..', 'summaries', 'videos', videoId);
      if (fs.existsSync(vdir)) {
        const { summarizeToMarp } = await import('./llm.js');
        await summarizeToMarp(vdir, { focus: "" });
        // Compile slides → HTML
        const { spawn } = await import('child_process');
        const marp = spawn('npx', ['-y','@marp-team/marp-cli', path.join(vdir,'slides.md'), '--html', '--allow-local-files', '--output', path.join(vdir,'slides.html')]);
        await new Promise((resolve, reject) => {
          marp.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Marp failed with code ${code}`)));
        });
      }
    } catch (error) {
      console.error('Error generating slides:', error);
      return res.status(500).send('Error generating slides');
    }
  }
  
  if (fs.existsSync(slidePath)) {
    res.sendFile(slidePath);
  } else {
    res.status(404).send('Video not found');
  }
});

const PORT = process.env.PORT || 7777;
app.listen(PORT, ()=>console.log('Video Digest listening on http://localhost:'+PORT));
