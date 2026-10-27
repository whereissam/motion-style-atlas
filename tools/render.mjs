// Offline renderer for the Motion Style Atlas. Drives render.html in headless Chromium,
// pipes JPEG frames + the film's WAV score into ffmpeg.
//
//   node tools/render.mjs film <id...>            videos/<id>.mp4            (10 s, 1920×1080, 30 fps)
//   node tools/render.mjs card <id...>            videos/cards/card-<id>.mp4 (also atlas-open / atlas-end)
//   node tools/render.mjs poster [id...]          atlas/posters/<id>.jpg     (640×360 at the film's poster time)
//   node tools/render.mjs still <id> <t,t,...> [dir]   preview JPEGs, default dir: /tmp/mg-stills
//   node tools/render.mjs data                    atlas/atlas-data.js        (then: node tools/build-prompts.mjs)
//   node tools/render.mjs reel complete|best      videos/Motion-Style-Atlas-{COMPLETE,BEST-OF}[-share].mp4
//   node tools/render.mjs web [id...]             media/<id>.mp4             (≤ ~8 MB web copy of each film, tracked in git)
//
// Options: -j N renders N films in parallel (default 3).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const FPS = 30;
const CHROME = process.env.MG_CHROME || path.join(os.homedir(), 'Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell');

const argv = process.argv.slice(2);
let jobs = 3;
const ji = argv.indexOf('-j');
if (ji >= 0) { jobs = +argv[ji + 1] || 1; argv.splice(ji, 2); }
const [mode, ...args] = argv;

function run(cmd, a, input) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, a, { stdio: [input ? 'pipe' : 'ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', d => { err += d; if (err.length > 20000) err = err.slice(-10000); });
    p.on('close', code => (code ? rej(new Error(`${cmd} exited ${code}\n${err.slice(-2000)}`)) : res()));
    if (input) input(p.stdin);
  });
}

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await page.goto('file://' + path.join(ROOT, 'render.html'));
  await page.evaluate(() => window.fontsLoaded);
  page.errors = errors;
  return page;
}

async function filmInfo(page) {
  return page.evaluate(() => ({
    films: Object.fromEntries(Object.entries(MG.films).map(([id, f]) => [id, { dur: f.dur || MG.DUR, poster: f.poster ?? 9 }])),
    order: MG.ORDER.filter(id => MG.films[id]),
    reel: (MG.REEL || []).filter(id => MG.films[id]),
  }));
}

const jpeg = url => Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');

// Render one film id (a film or a card) to an mp4.
async function renderVideo(page, id, out) {
  const { dur } = await page.evaluate(id => { const f = MG.films[id]; if (!f) throw new Error('no film ' + id); return { dur: f.dur || MG.DUR }; }, id);
  const n = Math.round(dur * FPS);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mg-'));
  const wav = path.join(tmp, 'a.wav');
  fs.writeFileSync(wav, Buffer.from(await page.evaluate(id => window.renderWav(id), id), 'base64'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const t0 = Date.now();
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-', '-i', wav,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '12', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-t', String(dur), '-movflags', '+faststart', out],
  async stdin => {
    for (let i = 0; i < n; i++) {
      const buf = jpeg(await page.evaluate(([id, t]) => window.drawFrame(id, t), [id, i / FPS]));
      if (!stdin.write(buf)) await new Promise(r => stdin.once('drain', r));
      if (i % 60 === 59) process.stdout.write(`  ${id} ${i + 1}/${n}\r`);
    }
    stdin.end();
  });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`✓ ${path.relative(ROOT, out)}  ${n} frames  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

async function pool(browser, ids, fn) {
  const queue = [...ids], failed = [];
  await Promise.all(Array.from({ length: Math.min(jobs, ids.length) }, async () => {
    const page = await openPage(browser);
    while (queue.length) {
      const id = queue.shift();
      page.errors.length = 0;
      try { await fn(page, id); } catch (e) { failed.push(id); console.error(`✗ ${id}: ${e.message}`); }
      if (page.errors.length) console.error(`  ${id} page errors:\n   ` + [...new Set(page.errors)].slice(0, 8).join('\n   '));
    }
    await page.close();
  }));
  if (failed.length) { console.error('failed: ' + failed.join(' ')); process.exitCode = 1; }
}

async function writeData(page) {
  const atlas = await page.evaluate(() => {
    const items = MG.ORDER.filter(id => MG.films[id]).map(id => {
      const f = MG.films[id], m = MG.ATLAS[id] || f.meta;
      if (!m) return null;
      return { id, ...m, dur: f.dur || MG.DUR, poster: f.poster ?? 9 };
    }).filter(Boolean);
    return { families: MG.FAMILIES, items };
  });
  atlas.items.forEach(it => {
    // the site serves the web copies; the full-quality masters in videos/ are not published
    if (fs.existsSync(path.join(ROOT, 'media', it.id + '.mp4'))) it.video = `media/${it.id}.mp4`;
    it.posterImg = `atlas/posters/${it.id}.jpg`;
  });
  atlas.built = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(ROOT, 'atlas/atlas-data.js'), '/* generated by render.mjs data */\nwindow.ATLAS = ' + JSON.stringify(atlas, null, 1) + ';\n');
  console.log(`✓ atlas/atlas-data.js  ${atlas.items.length} items`);
}

async function reel(info, which) {
  const ids = which === 'best' ? info.reel : info.order;
  const name = which === 'best' ? 'Motion-Style-Atlas-BEST-OF' : 'Motion-Style-Atlas-COMPLETE';
  const parts = [path.join(ROOT, 'videos/cards/atlas-open.mp4')];
  ids.forEach(id => parts.push(path.join(ROOT, `videos/cards/card-${id}.mp4`), path.join(ROOT, `videos/${id}.mp4`)));
  parts.push(path.join(ROOT, 'videos/cards/atlas-end.mp4'));
  const missing = parts.filter(p => !fs.existsSync(p));
  if (missing.length) throw new Error('missing segments:\n  ' + missing.map(p => path.relative(ROOT, p)).join('\n  '));
  const list = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'mg-')), 'list.txt');
  fs.writeFileSync(list, parts.map(p => `file '${p}'`).join('\n'));
  const out = path.join(ROOT, 'videos', name + '.mp4');
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out]);
  console.log(`✓ ${path.relative(ROOT, out)}  ${ids.length} styles`);
  const share = path.join(ROOT, 'videos', name + '-share.mp4');
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', out, '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-maxrate', '2.5M', '-bufsize', '5M',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', share]);
  console.log(`✓ ${path.relative(ROOT, share)}`);
}

const browser = await chromium.launch({ executablePath: CHROME, args: ['--disable-web-security', '--allow-file-access-from-files'] });
try {
  const page = await openPage(browser);
  const info = await filmInfo(page);
  const pick = list => (args.length ? args : list);
  if (mode === 'film') {
    await pool(browser, pick(info.order), (p, id) => renderVideo(p, id, path.join(ROOT, 'videos', id + '.mp4')));
  } else if (mode === 'card') {
    await pool(browser, pick(['atlas-open', ...info.order, 'atlas-end']), (p, id) => {
      const fid = id.startsWith('atlas-') ? id : 'card-' + id;
      return renderVideo(p, fid, path.join(ROOT, 'videos/cards', fid + '.mp4'));
    });
  } else if (mode === 'poster') {
    for (const id of pick(info.order)) {
      const buf = jpeg(await page.evaluate(([id, t]) => {
        const big = document.createElement('canvas'); big.width = 1920; big.height = 1080;
        MG.frame(id, t, big);
        const s = document.createElement('canvas'); s.width = 640; s.height = 360;
        const g = s.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(big, 0, 0, 640, 360);
        return s.toDataURL('image/jpeg', 0.88);
      }, [id, info.films[id].poster]));
      fs.writeFileSync(path.join(ROOT, 'atlas/posters', id + '.jpg'), buf);
      console.log(`✓ atlas/posters/${id}.jpg`);
    }
  } else if (mode === 'still') {
    const [id, ts = '1,3,5,7,9', dir = '/tmp/mg-stills'] = args;
    fs.mkdirSync(dir, { recursive: true });
    for (const t of ts.split(',').map(Number)) {
      const f = path.join(dir, `${id}-${t.toFixed(2)}.jpg`);
      fs.writeFileSync(f, jpeg(await page.evaluate(([id, t]) => window.drawFrame(id, t, 0.85), [id, t])));
      console.log(f);
    }
  } else if (mode === 'web') {
    fs.mkdirSync(path.join(ROOT, 'media'), { recursive: true });
    const queue = [...pick(info.order)];
    await Promise.all(Array.from({ length: jobs }, async () => {
      while (queue.length) {
        const id = queue.shift(), src = path.join(ROOT, 'videos', id + '.mp4'), out = path.join(ROOT, 'media', id + '.mp4');
        if (!fs.existsSync(src)) { console.error(`✗ ${id}: no videos/${id}.mp4 (run film first)`); process.exitCode = 1; continue; }
        await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-maxrate', '6M', '-bufsize', '12M',
          '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out]);
        console.log(`✓ media/${id}.mp4  ${(fs.statSync(out).size / 1e6).toFixed(1)} MB`);
      }
    }));
  } else if (mode === 'data') {
    await writeData(page);
  } else if (mode === 'reel') {
    await reel(info, args[0] || 'complete');
  } else {
    console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(0, 12).join('\n'));
  }
  if (page.errors.length) console.error('page errors:\n  ' + [...new Set(page.errors)].join('\n  '));
} finally {
  await browser.close();
}
