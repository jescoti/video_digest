import fs from 'fs'; import path from 'path';
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || 'gpt-5';

export async function summarizeToMarp(vdir, { focus = "" } = {}){
  const meta = JSON.parse(fs.readFileSync(path.join(vdir,'meta.json'),'utf8'));
  const transcript = fs.readFileSync(path.join(vdir,'transcript_clean.md'),'utf8');
  const kf = JSON.parse(fs.readFileSync(path.join(vdir,'kf_index.json'),'utf8'));
  const sys = fs.readFileSync('prompts/digest_system.txt','utf8');

  const kfList = kf.map(x=>path.basename(x.file));
  const kfHints = kfList.map(f=>`- keyframes/${f}`).join('\n');
  const title = `${meta.title} — ${meta.channel}`;

  const userPrompt = `
TITLE: ${title}

FOCUS (optional; obey strictly if present):
${focus || "(none)"}

AVAILABLE IMAGES (must exist; do not invent paths):
${kfHints}

TRANSCRIPT (markdown with [mm:ss] anchors):
${transcript.slice(0, 120000)}
`;

  const resp = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role:'system', content: sys },
      { role:'user', content: userPrompt }
    ],
  });

  const raw = resp.choices?.[0]?.message?.content?.trim() || "";
  const fm = `---\nmarp: true\ntheme: default\npaginate: true\ntitle: "${meta.title.replace(/"/g,'\\"')}"\nstyle: |\n  @import url('app/assets/video-digest-theme.css');\n---\n\n`;
  const slides = raw.startsWith('---') ? raw : (fm + raw);
  fs.writeFileSync(path.join(vdir,'slides.md'), slides);
  return slides;
}
