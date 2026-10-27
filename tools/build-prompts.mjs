// Writes prompts/PROMPTS.md (all styles) and prompts/styles/<id>.md from atlas/atlas-data.js.
// Run after `render.mjs data`:  node tools/build-prompts.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'atlas/atlas-data.js'), 'utf8'), ctx);
const { families, items } = ctx.window.ATLAS;
const { buildPrompt, videoPrompt } = createRequire(import.meta.url)(path.join(ROOT, 'atlas/prompt-template.js'));

const outDir = path.join(ROOT, 'prompts', 'styles');
fs.mkdirSync(outDir, { recursive: true });

const block = (it, n) => `## ${String(n).padStart(2, '0')} · ${it.name}
*${it.sub} · ${it.era} · ${families[it.family].name}*

Reference film: \`videos/${it.id}.mp4\`

### Build prompt (Claude / any coding model / a motion designer)
\`\`\`text
${buildPrompt(it, families)}
\`\`\`

### Video-model prompt (Sora / Runway / Kling / Veo)
\`\`\`text
${videoPrompt(it)}
\`\`\`
`;

const intro = `# Motion Style Atlas: Regeneration Prompts

Each of the ${items.length} styles below has two prompts:

- **Build prompt**: a full director's brief. Give it to Claude or another coding model to make a procedural 10-second film (Canvas/WebGL + Web Audio), or hand it to a motion designer as a creative brief.
- **Video-model prompt**: a short descriptive prompt for text-to-video tools.

To match the atlas exactly, attach the reference film from \`videos/\` and, for coding models, \`js/engine.js\` (the shared timing, easing and audio helpers). Every film in the atlas follows the same contract: \`MG.film({ id, dur, meta, setup, draw(c, t, W, H, st), score(A) })\`.

`;

let all = intro;
items.forEach((it, i) => {
  const md = block(it, i + 1);
  fs.writeFileSync(path.join(outDir, `${it.id}.md`), `# ${it.name}\n\n` + md.split('\n').slice(1).join('\n'));
  all += md + '\n';
});
fs.writeFileSync(path.join(ROOT, 'prompts', 'PROMPTS.md'), all);
console.log(`wrote prompts/PROMPTS.md and ${items.length} files in prompts/styles/`);
