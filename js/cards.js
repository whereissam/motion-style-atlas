/* Atlas cards — the chapter card shown before every film, plus the reel's opening and closing.
   Loaded after every films-*.js so it can read each film's meta and render its poster frame. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, rng, hash, text, font, rrect, grain, vignette, offscreen } = MG;

  // Card copy comes from MG.ATLAS (original films) or each film's own English `meta`.
  const metaOf = id => {
    const m = MG.ATLAS[id] || (MG.films[id] && MG.films[id].meta);
    return m && m.name ? { ...m, cn: m.name, en: m.sub || '' } : null;
  };
  const present = () => MG.ORDER.filter(id => MG.films[id] && metaOf(id));

  const BG = '#0d0c0b', INK = '#ece6dc', MUTE = '#8f877d';
  const NS = '"Noto Sans SC", "PingFang SC", sans-serif';
  const MONO = '"JetBrains Mono", monospace';
  const ARCH = 'Archivo, "Helvetica Neue", Arial, sans-serif';

  function wrap(c, s, maxW) {
    const lines = [];
    let cur = '';
    for (const ch of s) {
      if (c.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch; }
      else cur += ch;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function wrapW(c, s, maxW) {
    const lines = []; let cur = '';
    for (const w of s.split(' ')) {
      const nx = cur ? cur + ' ' + w : w;
      if (c.measureText(nx).width > maxW && cur) { lines.push(cur); cur = w; } else cur = nx;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function poster(id, w, h) {
    const cv = offscreen(w, h);
    try { MG.frame(id, MG.films[id].poster ?? 9, cv); } catch (e) { console.error('poster', id, e); }
    return cv;
  }
  function maskUp(c, x, y, h, p, draw) {
    c.save();
    c.beginPath(); c.rect(x - 40, y - h, 4000, h + 30); c.clip();
    c.translate(0, (1 - p) * (h + 30));
    draw();
    c.restore();
  }
  function cardScore(A, dur) {
    A.whoosh(0, 0.45, { f1: 3500, f2: 300, g: 0.14, swell: 0.25 });
    A.kick(0.06, 0.45, { f: 110, f2: 40, dur: 0.6 });
    A.osc(0.06, { f: 55, dur: 1.4, g: 0.12 });
    [0.62, 0.74, 0.86].forEach((t, i) => A.osc(t, { f: 1800 + i * 240, dur: 0.05, g: 0.05, type: 'triangle' }));
    A.bell(0.3, MG.midi(84), { g: 0.04, dur: 1.6 });
    A.riser(dur - 0.75, 0.75, { g: 0.12 });
    A.whoosh(dur - 0.38, 0.38, { f1: 400, f2: 5000, g: 0.14 });
  }

  /* ---------- chapter card before each film ---------- */
  function makeCard(id) {
    const dur = 3.2;
    MG.film({
      id: 'card-' + id,
      dur,
      setup() { return { pv: poster(id, 960, 540) }; },
      draw(c, t, W, H, st) {
        // Number within the family, not across the atlas: new styles are appended to their family,
        // so existing cards never change and a new wave only renders its own cards.
        const m = metaOf(id), idx = present().filter(x => metaOf(x).family === m.family).indexOf(id) + 1, acc = m.accent || '#e8e2d6';
        c.fillStyle = BG; c.fillRect(0, 0, W, H);
        const bar = E.outX(seg(t, 0, 0.4));
        c.fillStyle = acc; c.fillRect(118, 150, 6, 820 * bar);
        text(c, `MOTION STYLE ATLAS  ·  ${m.family}  ${(MG.FAMILIES[m.family] || {}).name || ''}`.toUpperCase(), 150, 110, { font: MONO, size: 22, ls: 4, color: MUTE });
        text(c, `${m.family} · ${String(idx).padStart(2, '0')}`, W - 120, 110, { font: MONO, size: 22, ls: 4, align: 'right', color: MUTE });
        maskUp(c, 150, 430, 280, E.outX(seg(t, 0.04, 0.5)), () => text(c, String(idx).padStart(2, '0'), 140, 430, { font: 'Anton, sans-serif', size: 300, color: acc }));
        text(c, m.era, 520, 430, { font: MONO, weight: 800, size: 30, ls: 2, color: `rgba(236,230,220,${seg(t, 0.35, 0.6)})` });
        font(c, 120, ARCH, 900);
        const nsz = Math.min(120, 120 * 820 / c.measureText(m.cn).width);
        maskUp(c, 150, 610, 170, E.outX(seg(t, 0.14, 0.6)), () => text(c, m.cn, 146, 600, { font: ARCH, weight: 900, size: nsz, ls: -2, color: INK }));
        text(c, m.en.toUpperCase(), 154, 676, { font: ARCH, weight: 800, size: 40, ls: 9, color: `rgba(236,230,220,${0.75 * seg(t, 0.3, 0.6)})` });
        font(c, 30, ARCH, 400);
        const oa = seg(t, 0.45, 0.8);
        wrapW(c, m.origin, 800).slice(0, 3).forEach((ln, i) => text(c, ln, 154, 764 + i * 44, { font: ARCH, weight: 400, size: 30, color: `rgba(216,210,201,${oa})` }));
        let cx = 154;
        (m.tech || []).slice(0, 3).forEach((s, i) => {
          font(c, 26, ARCH, 800);
          const w = c.measureText(s).width + 44, sp = spring(t - 0.62 - i * 0.12, 2.6, 0.5);
          if (sp > 0) {
            c.save(); c.translate(cx + w / 2, 930); c.scale(sp, sp);
            c.strokeStyle = acc; c.lineWidth = 2.5; rrect(c, -w / 2, -28, w, 56, 28); c.stroke();
            text(c, s, 0, 2, { font: ARCH, weight: 800, size: 26, align: 'center', base: 'middle', color: INK });
            c.restore();
          }
          cx += w + 18;
        });
        // preview of the film, wiping in
        const px = 1010, py = 236, pw = 790, ph = pw * 9 / 16;
        const wp = E.ioX(seg(t, 0.2, 0.75));
        if (wp > 0) {
          c.save();
          c.beginPath(); c.rect(px, py, pw * wp, ph); c.clip();
          const z = lerp(1.08, 1, E.outC(seg(t, 0.2, dur)));
          c.translate(px + pw / 2, py + ph / 2); c.scale(z, z);
          c.drawImage(st.pv, -pw / 2, -ph / 2, pw, ph);
          c.restore();
          c.strokeStyle = acc; c.lineWidth = 2; c.strokeRect(px - 10, py - 10, pw * wp + 20, ph + 20);
        }
        text(c, 'PREVIEW', px - 10, py - 30, { font: MONO, size: 20, ls: 4, color: `rgba(143,135,125,${seg(t, 0.5, 0.8)})` });
        if (m.works) {
          font(c, 24, ARCH, 400);
          wrapW(c, 'KEY WORKS   ' + m.works, pw + 20).slice(0, 2).forEach((ln, i) => text(c, ln, px - 10, py + ph + 56 + i * 36, { font: ARCH, weight: 400, size: 24, color: `rgba(143,135,125,${seg(t, 0.7, 1)})` }));
        }
        if (t > 2.0 && Math.floor(t * 4) % 2 === 0) text(c, 'PLAY ▶', W - 120, 1010, { font: MONO, weight: 800, size: 24, ls: 4, align: 'right', color: acc });
        // exit: accent panel sweeps across, the film cuts in on the next frame
        const ex = E.inX(seg(t, dur - 0.42, dur - 0.04));
        if (ex > 0) { c.fillStyle = acc; c.fillRect(0, 0, W * ex, H); }
        grain(c, W, H, t, 0.05, 'screen');
      },
      score(A) { cardScore(A, dur); },
    });
  }

  /* ---------- reel opening ---------- */
  MG.film({
    id: 'atlas-open',
    dur: 5,
    setup() { return { th: present().map(id => ({ id, cv: poster(id, 384, 216) })) }; },
    draw(c, t, W, H, st) {
      c.fillStyle = BG; c.fillRect(0, 0, W, H);
      const n = st.th.length, cols = 6, tw = 384, th = 216, gap = 18;
      const rows = Math.ceil(n / cols);
      const ox = (W - (cols * tw + (cols - 1) * gap)) / 2, oy = (H - (rows * th + (rows - 1) * gap)) / 2;
      const drift = lerp(0, -60, t / 5);
      st.th.forEach(({ cv }, i) => {
        const col = i % cols, row = Math.floor(i / cols), d = Math.hypot(col - 2.5, row - (rows - 1) / 2);
        const s = spring(t - 0.1 - d * 0.08, 2, 0.6);
        if (s <= 0) return;
        c.save();
        c.globalAlpha = 0.6 * clamp(s);
        c.translate(ox + col * (tw + gap) + tw / 2, oy + row * (th + gap) + th / 2 + drift * (row % 2 ? 1 : -1));
        c.scale(s, s);
        c.drawImage(cv, -tw / 2, -th / 2, tw, th);
        c.restore();
      });
      const shade = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1000);
      shade.addColorStop(0, 'rgba(13,12,11,0.86)'); shade.addColorStop(0.55, 'rgba(13,12,11,0.6)'); shade.addColorStop(1, 'rgba(13,12,11,0.2)');
      c.fillStyle = shade; c.fillRect(0, 0, W, H);
      maskUp(c, 0, 560, 240, E.outX(seg(t, 0.5, 1.2)), () => text(c, 'MOTION STYLE ATLAS', W / 2, 540, { font: ARCH, weight: 900, size: 132, ls: -3, align: 'center', color: INK }));
      text(c, 'THE CLASSIC STYLES OF MOTION DESIGN', W / 2, 640, { font: ARCH, weight: 800, size: 40, ls: 14, align: 'center', color: `rgba(236,230,220,${seg(t, 1.1, 1.6)})` });
      const line = E.ioX(seg(t, 1.3, 1.9));
      c.fillStyle = '#e8b04a'; c.fillRect(W / 2 - 300 * line, 690, 600 * line, 4);
      text(c, `${n} styles  ·  10 seconds each  ·  what it is, then the film`, W / 2, 770, { font: ARCH, weight: 400, size: 38, align: 'center', color: `rgba(216,210,201,${seg(t, 1.7, 2.2)})` });
      text(c, 'EVERY FRAME AND SOUND GENERATED IN CODE', W / 2, 830, { font: MONO, size: 22, ls: 5, align: 'center', color: `rgba(143,135,125,${seg(t, 2.0, 2.5)})` });
      const ex = E.inX(seg(t, 4.55, 4.96));
      if (ex > 0) { c.fillStyle = BG; c.fillRect(0, 0, W, H * ex); }
      grain(c, W, H, t, 0.05, 'screen');
      vignette(c, W, H, 0.5);
    },
    score(A) {
      A.chord(0.1, [38, 45, 50, 57, 62], { type: 'sawtooth', dur: 4.8, g: 0.03, a: 1.2, hold: true, rel: 1, lp: 900, spread: 10, rev: 0.5, width: 1.2 });
      A.impact(0.55, 0.7);
      A.bell(0.6, MG.midi(74), { g: 0.08, dur: 3 });
      A.bell(1.3, MG.midi(81), { g: 0.06, dur: 3 });
      A.bell(1.75, MG.midi(86), { g: 0.05, dur: 3 });
      A.riser(3.9, 1.0, { g: 0.14 });
    },
  });

  /* ---------- reel closing ---------- */
  MG.film({
    id: 'atlas-end',
    dur: 6,
    setup() { return { th: present().map(id => ({ id, cv: poster(id, 384, 216) })) }; },
    draw(c, t, W, H, st) {
      c.fillStyle = BG; c.fillRect(0, 0, W, H);
      // fewest columns whose rows still fit the frame below the header
      const n = st.th.length, gx = 18, labelH = 34, gy = 14, availW = W - 240, availH = H - 190 - 70;
      let cols = 4, tw, th, rowH;
      for (; cols < 16; cols++) {
        tw = (availW - (cols - 1) * gx) / cols; th = tw * 9 / 16; rowH = th + labelH + gy;
        if (Math.ceil(n / cols) * rowH <= availH) break;
      }
      const rows = Math.ceil(n / cols);
      const ox = 120, oy = 190 + (availH - rows * rowH) / 2;
      const step = Math.min(0.07, 2.6 / n);
      text(c, 'MOTION STYLE ATLAS', 120, 120, { font: ARCH, weight: 900, size: 56, color: INK });
      text(c, `${n} STYLES  ·  ${n * 10} SECONDS`, W - 120, 118, { font: MONO, weight: 800, size: 24, ls: 4, align: 'right', color: MUTE });
      st.th.forEach(({ id, cv }, i) => {
        const col = i % cols, row = Math.floor(i / cols), m = metaOf(id);
        const s = E.outB(seg(t, 0.2 + i * step, 0.6 + i * step), 1.2);
        if (s <= 0) return;
        const x = ox + col * (tw + gx), y = oy + row * rowH;
        c.save(); c.translate(x + tw / 2, y + th / 2); c.scale(s, s);
        c.drawImage(cv, -tw / 2, -th / 2, tw, th);
        c.strokeStyle = m.accent || INK; c.lineWidth = 2; c.strokeRect(-tw / 2, -th / 2, tw, th);
        c.restore();
        const a = seg(t, 0.4 + i * step, 0.7 + i * step);
        const num = String(i + 1).padStart(2, '0'), ny = y + th + 24;
        font(c, 15, MONO, 800);
        const nw = c.measureText(num).width + 8, room = tw - nw;
        text(c, num, x, ny, { font: MONO, weight: 800, size: 15, color: `rgba(232,176,74,${a})` });
        // shrink the name to its cell, then ellipsise if it still does not fit
        let size = 17, name = m.cn;
        font(c, size, ARCH, 800);
        while (size > 12 && c.measureText(name).width > room) font(c, --size, ARCH, 800);
        if (c.measureText(name).width > room) { while (name.length > 3 && c.measureText(name + '…').width > room) name = name.slice(0, -1); name += '…'; }
        text(c, name, x + nw, ny, { font: ARCH, weight: 800, size, color: `rgba(236,230,220,${a})` });
      });
      const ex = E.inC(seg(t, 5.3, 6));
      if (ex > 0) { c.fillStyle = `rgba(0,0,0,${ex})`; c.fillRect(0, 0, W, H); }
      grain(c, W, H, t, 0.05, 'screen');
    },
    score(A) {
      const n = present().length;
      const step = Math.min(0.07, 2.6 / n);
      for (let i = 0; i < n; i++) A.pluck(0.2 + i * step, MG.midi([62, 64, 66, 69, 71][i % 5] + 12 * (Math.floor(i / 5) % 3)), { dur: 1.2, g: 0.16 * Math.min(1, 14 / n + 0.35), bright: 0.6, rev: 0.4, pan: (i % 6) / 5 - 0.5 });
      A.chord(2.0, [50, 57, 62, 66, 69, 74], { type: 'sine', dur: 4, g: 0.05, a: 0.4, hold: true, rel: 2, rev: 0.7, width: 1.2 });
      A.bell(2.0, MG.midi(86), { g: 0.06, dur: 3.5 });
    },
  });

  present().forEach(makeCard);

  MG.films['atlas-open'].fonts = [['900 120px Archivo', 'A'], ['400 30px Archivo', 'A'], ['800 30px Archivo', 'A'], ['400 300px Anton', '0123456789'], ['800 20px "JetBrains Mono"', 'A1']];
})();
