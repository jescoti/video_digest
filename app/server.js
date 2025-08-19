import 'dotenv/config';
import express from 'express';
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

const PORT = process.env.PORT || 7777;
app.listen(PORT, ()=>console.log('Video Digest listening on http://localhost:'+PORT));
