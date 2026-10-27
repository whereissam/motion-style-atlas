/* Batch c2 — Family B, Typography & Text Motion: Variable Font Motion, ASCII Motion, 3D Typography. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Roboto+Flex:opsz,wdth,wght@8..144,25..151,100..1000&family=Archivo:wdth,wght@62..125,100..900&family=JetBrains+Mono:wght@400;700;800&display=block');

  const MONO = '"JetBrains Mono", monospace';
  const flashAt = (t, times, k = 5) => times.reduce((m, L) => (t >= L ? Math.max(m, Math.exp(-(t - L) * k)) : m), 0);
  const hexRGB = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixRGB = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const css = (a, al = 1) => `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${al})`;

  /* ================================================================
     VARIABLE FONT MOTION — Roboto Flex, every row justified edge to edge
     while weight and width ripple through it per glyph.
     ================================================================ */
  const VF = '"Roboto Flex"';
  const VREF = 200;                                   // all glyphs rasterised at one size → stable metrics
  const VS = [50, 62.5, 75, 87.5, 100, 112.5, 125, 150];
  const VK = ['ultra-condensed', 'extra-condensed', 'condensed', 'semi-condensed', 'normal', 'semi-expanded', 'expanded', 'extra-expanded'];
  const VINK = hexRGB('#121212'), VPAP = hexRGB('#efebe2'), VRED = hexRGB('#ff4a1c'), VWHT = hexRGB('#f3f0e9');
  const BEAT = 0.5;

  // metric cache: [advance, inkLeft, inkRight] at VREF
  function vMet(c, st, ch, w, si) {
    const key = ch + w + '|' + si;
    let m = st.met.get(key);
    if (!m) {
      c.font = `${w} ${VREF}px ${VF}`;
      c.fontStretch = VK[si];
      const r = c.measureText(ch);
      m = [r.width, -r.actualBoundingBoxLeft, r.actualBoundingBoxRight];
      st.met.set(key, m);
    }
    return m;
  }
  // continuous width (50..150) → interpolated metrics + the instance to draw and its x-scale
  function vGlyph(c, st, ch, w, wd) {
    w = Math.round(clamp(w, 100, 1000) / 5) * 5;
    wd = clamp(wd, 50, 150);
    let si = 0;
    while (si < VS.length - 2 && VS[si + 1] <= wd) si++;
    const f = clamp((wd - VS[si]) / (VS[si + 1] - VS[si]));
    const a = vMet(c, st, ch, w, si), b = vMet(c, st, ch, w, si + 1);
    const adv = lerp(a[0], b[0], f), l = lerp(a[1], b[1], f), r = lerp(a[2], b[2], f);
    const di = f < 0.5 ? si : si + 1, dm = f < 0.5 ? a : b;
    return { adv, l, r, w, si: di, sx: dm[0] > 0 ? adv / dm[0] : 1 };
  }
  /* A justified row: glyph weights w[i], width wishes wd[i]; a common width offset is solved
     so the ink spans exactly rw. Falls back to tracking (too short) or squeeze (too long). */
  function vRow(c, st, txt, x, base, rw, rh, w, wd, col, o = {}) {
    const n = txt.length, k = rh / st.capH;
    const lay = off => {
      const g = []; let tot = 0;
      for (let i = 0; i < n; i++) { const q = vGlyph(c, st, txt[i], w[i], wd[i] + off); g.push(q); tot += q.adv; }
      tot -= g[0].l + (g[n - 1].adv - g[n - 1].r);
      return { g, tot: tot * k };
    };
    let lo = -110, hi = 110, L = lay(hi), track = 0, sq = 1;
    if (L.tot < rw) {
      // too short even at max width: stretch a little, then track out the rest
      sq = Math.min(o.maxStretch ?? 1.3, rw / L.tot);
      track = n > 1 ? (rw - L.tot * sq) / (n - 1) : 0;
    }
    else {
      L = lay(lo);
      if (L.tot > rw) sq = rw / L.tot;
      else {
        for (let it = 0; it < 15; it++) { const m = (lo + hi) / 2, T = lay(m); if (T.tot > rw) hi = m; else { lo = m; L = T; } }
      }
    }
    const g = L.g;
    let px = n === 1 ? x + (rw - (g[0].r - g[0].l) * k * sq) / 2 - g[0].l * k * sq : x - g[0].l * k * sq;
    for (let i = 0; i < n; i++) {
      const q = g[i];
      c.font = `${q.w} ${VREF}px ${VF}`;
      c.fontStretch = VK[q.si];
      c.fillStyle = typeof col === 'function' ? col(i, q) : col;
      c.save();
      c.translate(px, base);
      c.scale(k * q.sx * sq, k * (o.sy ? o.sy(i) : 1));
      c.fillText(txt[i], 0, 0);
      c.restore();
      px += q.adv * k * sq + track;
    }
    c.fontStretch = 'normal';
    return g;
  }
  // vertical stack of justified rows inside a rect; rows: {txt, h (relative), w[], wd[], col}
  function vStack(c, st, rows, x, y, w, h, gap) {
    const tot = rows.reduce((s, r) => s + r.h, 0), avail = h - gap * (rows.length - 1);
    let cy = y;
    rows.forEach(r => {
      const rh = (avail * r.h) / tot;
      if (rh > 1.5) vRow(c, st, r.txt, x, cy + rh, w, rh, r.w, r.wd, r.col, r);
      cy += rh + gap;
    });
  }
  const tri = x => 1 - Math.abs(((x % 2) + 2) % 2 - 1) * 2; // −1..1 triangle

  MG.film({
    id: 'variablefont', dur: 10, poster: 9.4,
    fonts: [['400 200px "Roboto Flex"', 'FLEXVARIABLWGHTIDONS'], ['1000 200px "Roboto Flex"', 'FLEXVARIABLWGHTIDONS'], ['400 16px "JetBrains Mono"', 'Aa1·—'], ['700 16px "JetBrains Mono"', 'Aa1']],
    meta: {
      family: 'B', name: 'Variable Font Motion', sub: 'Animated Type Axes', era: '2016 —',
      origin: 'OpenType Font Variations were announced jointly by Apple, Google, Microsoft and Adobe at ATypI Warsaw in 2016, letting one font file carry continuous design axes such as weight, width and optical size that can be animated like any other property.',
      works: 'Roboto Flex (Font Bureau / Google Fonts, 2022) · Decovar (David Berlow, 2017) · Amstelvar (David Berlow, 2016) · Bahnschrift (Aaron Bell / Microsoft, 2017) · DJR Font of the Month specimens',
      tech: ['Per-glyph wght / wdth interpolation', 'Justified rows solved to the frame edge', 'Phase-offset sine waves across glyphs'],
      accent: '#ff4a1c',
      motionDNA: 'Letters never move position — they breathe in weight and width, waves travel through the word while every line stays locked to the frame edge.',
      visualDNA: 'Full-bleed grotesk on paper, ink and one signal red, specimen-sheet mono labels and axis sliders.',
      transitions: 'Hairline-to-black weight snaps, rows splitting and collapsing, width stretch to full bleed, hard cuts on the downbeat.',
      implementation: ['CSS font-variation-settings', 'Canvas 2D', 'After Effects'],
      reproducibility: 'Fully procedural',
      loopable: true,
    },
    setup() { return { met: new Map(), capH: 0 }; },
    draw(c, t, W, H, st) {
      if (!st.capH) {
        c.font = `700 ${VREF}px ${VF}`; c.fontStretch = 'normal';
        st.capH = c.measureText('H').actualBoundingBoxAscent || VREF * 0.71;
      }
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';

      if (t < 2) vfIntro(c, t, W, H, st);
      else if (t < 7.5) vfWall(c, t, W, H, st);
      else vfFinal(c, t, W, H, st);

      // downbeat flashes on the cuts
      const fl = flashAt(t, [2, 4, 7.5], 9);
      if (fl > 0.01) { c.fillStyle = `rgba(255,255,255,${fl * 0.35})`; c.fillRect(0, 0, W, H); }
      grain(c, W, H, t, t < 2 ? 0.07 : 0.05, t < 2 ? 'screen' : 'multiply');
    },
    score(A) {
      A.bus.gain.value = 0.66; A.send.gain.value = 0.66; // headroom: keep the master peak under 0 dBFS
      // hook: hairline ping, then four weight snaps
      A.bell(0.04, midi(96), { g: 0.05, dur: 1.2, rev: 0.5 });
      A.osc(0.02, { f: midi(84), f2: midi(72), glide: 0.45, dur: 0.48, g: 0.04, a: 0.01, type: 'triangle', rev: 0.4 });
      [0.5, 0.75, 1.0, 1.25].forEach((s, i) => {
        A.kick(s, 0.55 + i * 0.07);
        A.osc(s, { type: 'sawtooth', f: midi(33 + [0, 0, 3, 5][i]), dur: 0.24, g: 0.12, lp: 200, lp2: 3200, lpT: 0.06, q: 6 });
        A.pluck(s, midi(69 + [0, 3, 7, 10][i]), { g: 0.22, bright: 0.85, dur: 0.9, rev: 0.25, pan: -0.45 + i * 0.3 });
      });
      // stretch to full bleed
      A.osc(1.45, { type: 'sawtooth', f: midi(38), f2: midi(50), glide: 0.55, dur: 0.56, g: 0.1, lp: 300, lp2: 6000, lpT: 0.55, q: 4, a: 0.3 });
      A.whoosh(1.4, 0.6, { f1: 400, f2: 7000, g: 0.14, swell: 0.95 });
      // wall groove — 120 bpm, bass cutoff follows the weight wave
      A.impact(2, 0.55);
      const bass = [33, 33, 36, 31];
      for (let b = 0; b < 10; b++) {
        const s = 2 + b * BEAT, bar = Math.floor(b / 4) % 4;
        A.kick(s, b % 4 === 0 ? 0.85 : 0.68);
        A.hat(s + 0.25, 0.07, b % 2 === 1, { pan: 0.3 });
        if (b % 2 === 1) A.clap(s, 0.26);
        A.osc(s, { type: 'sawtooth', f: midi(bass[bar]), dur: 0.46, g: 0.11, lp: 180, lp2: 2400, lpT: 0.22, q: 5 });
        A.osc(s + 0.25, { type: 'sawtooth', f: midi(bass[bar] + 12), dur: 0.2, g: 0.05, lp: 900, lp2: 300, lpT: 0.2, q: 3 });
      }
      // cut to the waterfall
      A.impact(4, 0.4);
      A.chord(4, [57, 60, 64, 67], { type: 'triangle', dur: 1.8, g: 0.03, a: 0.02, rev: 0.6, width: 1 });
      for (let b = 0; b < 12; b++) {
        const s = 4 + b * BEAT;
        A.kick(s, 0.75);
        A.hat(s + 0.25, 0.08, true, { pan: -0.3 });
        A.hat(s + 0.125, 0.04); A.hat(s + 0.375, 0.04);
        if (b % 2 === 1) A.snare(s, 0.24);
        A.osc(s, { type: 'sawtooth', f: midi([33, 36, 38, 31][Math.floor(b / 2) % 4]), dur: 0.46, g: 0.1, lp: 200, lp2: 3000 + b * 300, lpT: 0.25, q: 6 });
        A.pluck(s + 0.25, midi([76, 79, 81, 74][b % 4]), { g: 0.12, bright: 0.9, dur: 0.6, rev: 0.3, pan: b % 2 ? 0.5 : -0.5 });
      }
      // accelerating stabs → ink flood
      for (let k = 0; k < 8; k++) A.osc(6 + k * 0.125, { type: 'square', f: midi(57 + k), dur: 0.09, g: 0.035, lp: 2000 + k * 600, rev: 0.2 });
      A.riser(6, 1.5, { g: 0.16, f: 110 });
      A.noise(7.0, { type: 'lowpass', f: 300, f2: 80, dur: 0.5, g: 0.18 });
      // final hit + lockup
      A.impact(7.5, 0.8);
      A.kick(7.5, 0.9);
      A.chord(7.5, [45, 52, 57, 60, 64, 71], { type: 'sawtooth', dur: 2.4, g: 0.035, a: 0.01, lp: 3500, lp2: 600, lpT: 2.2, spread: 9, rev: 0.6, width: 1.4 });
      A.chord(7.52, [57, 64, 69], { type: 'sine', dur: 2.45, g: 0.05, a: 0.4, hold: true, rel: 0.6, rev: 0.6 });
      [8.05, 8.25, 8.45].forEach((s, i) => A.bell(s, midi([88, 91, 93][i]), { g: 0.05, dur: 1.4, pan: -0.4 + i * 0.4 }));
      A.osc(8.9, { f: midi(81), dur: 0.9, g: 0.03, rev: 0.6 });
    },
  });

  /* ---- scene A: "FLEX" from hairline to black, then to full bleed ---- */
  function vfIntro(c, t, W, H, st) {
    c.fillStyle = '#0b0b0c'; c.fillRect(0, 0, W, H);
    const txt = 'FLEX', snaps = [0.5, 0.75, 1.0, 1.25];
    const grow = E.ioX(seg(t, 1.42, 1.96));
    const rw = lerp(760, W - 72, grow), rh = lerp(300, H - 72, grow);
    const x = (W - rw) / 2, base = (H + rh) / 2 + lerp(0, 0, grow);
    const w = [], wd = [];
    for (let i = 0; i < 4; i++) {
      const s = spring(t - snaps[i], 3.2, 0.32);
      w[i] = lerp(100, 1000, clamp(s));
      wd[i] = lerp(50, 70, clamp(s)) + (s - 1) * 60 * (s > 1 ? 1 : 0) + lerp(0, 80, grow);
    }
    // letters rise out of a hairline baseline
    const sy = i => E.outQt(seg(t, 0.04 + i * 0.07, 0.42 + i * 0.07));
    // baseline rule
    const ra = seg(t, 0, 0.2) * (1 - seg(t, 1.35, 1.5));
    if (ra > 0) { c.fillStyle = `rgba(243,240,233,${0.25 * ra})`; c.fillRect(x - 60, base + 18, (rw + 120) * E.outQt(seg(t, 0, 0.5)), 2); }
    vRow(c, st, txt, x, base, rw, rh, w, wd, i => (t >= snaps[i] && t < snaps[i] + 0.09 ? css(VRED) : css(VWHT)), { sy });
    // specimen readout
    const la = seg(t, 0.15, 0.4) * (1 - seg(t, 1.4, 1.55));
    if (la > 0) {
      let cur = 0; snaps.forEach((s, i) => { if (t >= s) cur = i; });
      const wv = Math.round(lerp(100, 1000, clamp(spring(t - snaps[cur], 3.2, 0.32))));
      text(c, 'ROBOTO FLEX', 72, 86, { font: MONO, size: 16, weight: 700, ls: 3, color: `rgba(243,240,233,${la * 0.8})` });
      text(c, 'VARIABLE · 3 AXES', 72, 112, { font: MONO, size: 16, ls: 3, color: `rgba(243,240,233,${la * 0.45})` });
      text(c, `wght ${String(t < 0.5 ? 100 : wv).padStart(4, ' ')}`, W - 72, 86, { font: MONO, size: 16, weight: 700, ls: 2, align: 'right', color: `rgba(255,74,28,${la})` });
      text(c, 'wdth   50', W - 72, 112, { font: MONO, size: 16, ls: 2, align: 'right', color: `rgba(243,240,233,${la * 0.45})` });
      // weight slider
      const sx = 72, sw = W - 144, sy0 = H - 84;
      c.fillStyle = `rgba(243,240,233,${la * 0.22})`; c.fillRect(sx, sy0, sw, 2);
      const kx = sx + sw * ((t < 0.5 ? 100 : wv) - 100) / 900 * ((cur + 1) / 4);
      c.fillStyle = `rgba(255,74,28,${la})`; c.fillRect(sx, sy0 - 1, kx - sx, 4);
      c.beginPath(); c.arc(kx, sy0 + 1, 8, 0, TAU); c.fill();
      text(c, '100', sx, sy0 + 34, { font: MONO, size: 14, color: `rgba(243,240,233,${la * 0.45})` });
      text(c, '1000', sx + sw, sy0 + 34, { font: MONO, size: 14, align: 'right', color: `rgba(243,240,233,${la * 0.45})` });
    }
  }

  /* ---- scene B: justified walls (B1 axis rows, B2 waterfall, C ink flood) ---- */
  function vfWall(c, t, W, H, st) {
    const flood = E.ioC(seg(t, 6.9, 7.42));
    c.fillStyle = css(mixRGB(VPAP, [232, 226, 214], flood)); c.fillRect(0, 0, W, H);
    const M = 36;
    if (t < 4) {
      // B1 — two rows, each demonstrating its axis; row heights trade on the beat
      const b = (t - 2) / BEAT, bi = Math.floor(b), bf = b - bi;
      const trade = lerp(bi % 2 ? -1 : 1, bi % 2 ? 1 : -1, E.outQt(clamp(bf * 2.2))) * (t < 2.25 ? E.outC(seg(t, 2, 2.25)) : 1);
      const en = E.outQt(seg(t, 2, 2.4));
      const rowsDef = [
        { txt: 'WEIGHT', h: 1 + 0.42 * trade, axis: 'w' },
        { txt: 'WIDTH', h: 1 - 0.42 * trade, axis: 'd' },
      ];
      const rows = rowsDef.map((r, ri) => {
        const n = r.txt.length, w = [], wd = [];
        for (let i = 0; i < n; i++) {
          const ph = i / n * 1.6 - (t - 2) * 1.1 + ri * 0.5;
          const v = 0.5 + 0.5 * Math.sin(ph * TAU);
          if (r.axis === 'w') { w[i] = lerp(120, 1000, v) ; wd[i] = 100; }
          else { w[i] = 760; wd[i] = lerp(50, 150, v); }
          w[i] = lerp(1000, w[i], en);
        }
        return { txt: r.txt, h: r.h, w, wd, col: (i, q) => css(mixRGB(VINK, VRED, r.axis === 'w' ? clamp((q.w - 935) / 25) : 0)) };
      });
      vStack(c, st, rows, M, M, W - 2 * M, H - 2 * M, 26);
      vHud(c, t, W, H, rows, 'AXIS STUDY 01', 1, en);
    } else {
      // B2 — waterfall of VARIABLE; weight wave travels diagonally, rows breathe on the beat
      const N = 6, hero = 2;
      const acc = seg(t, 5.9, 7.0);
      const ph0 = (t - 4) * (0.9 + acc * 2.2) + acc * acc * 1.5;
      const collapse = E.ioX(seg(t, 7.0, 7.48));
      const en = E.outQt(seg(t, 4, 4.35));
      const rows = [];
      for (let r = 0; r < N; r++) {
        const n = 8, w = [], wd = [];
        for (let i = 0; i < n; i++) {
          const ph = (r / N) * 0.9 + (i / n) * 0.55 - ph0;
          const v = 0.5 + 0.5 * Math.sin(ph * TAU);
          w[i] = lerp(lerp(100, 1000, r / (N - 1)), lerp(100, 1000, v), en);
          w[i] = lerp(w[i], 1000, flood);
          wd[i] = lerp(55, 150, v);
        }
        const beatPulse = Math.exp(-(((t - 4) % BEAT)) * 7) * (1 - acc);
        let h = 1 + 0.35 * Math.sin((r / N) * TAU - (t - 4) * 3.2) + (r === ((Math.floor((t - 4) / BEAT) * 3) % N) ? beatPulse * 0.6 : 0);
        h = lerp(h, r === hero ? 1 : 0.001, collapse);
        rows.push({ txt: 'VARIABLE', h, w, wd, col: (i, q) => css(mixRGB(VINK, VRED, (flood < 0.25 ? clamp((q.w - 935) / 25) : 0))) });
      }
      const gap = lerp(lerp(14, 4, flood), 0, collapse);
      // as the stack collapses the hero row eases toward the final lockup position
      const fy = lerp(M, 168, collapse), fh = lerp(H - 2 * M, 372, collapse), fx = lerp(M, 108, collapse);
      vStack(c, st, rows, fx, fy, W - 2 * fx, fh, gap);
      vHud(c, t, W, H, rows, 'WATERFALL 100—1000', 2, en * (1 - flood));
    }
  }

  function vHud(c, t, W, H, rows, label, n, a) {
    if (a <= 0.01) return;
    const r = rows[Math.min(rows.length - 1, 1)];
    const wv = Math.round(r.w[2]), dv = Math.round(r.wd[2]);
    c.save();
    c.fillStyle = css(VPAP, 0.9);
    const lines = [`${String(n).padStart(2, '0')} / ${label}`, `wght ${wv}  wdth ${dv}  opsz 144`];
    c.font = `700 14px ${MONO}`;
    const bw = 380;
    c.globalAlpha = a;
    c.fillRect(W - 36 - bw, H - 36 - 60, bw, 60);
    c.fillStyle = css(VRED); c.fillRect(W - 36 - bw, H - 36 - 60, 6, 60);
    text(c, lines[0], W - 36 - bw + 22, H - 36 - 34, { font: MONO, size: 14, weight: 700, ls: 2, color: css(VINK) });
    text(c, lines[1], W - 36 - bw + 22, H - 36 - 12, { font: MONO, size: 14, ls: 1, color: css(VINK, 0.6) });
    c.restore();
  }

  /* ---- scene D: lockup on signal red ---- */
  function vfFinal(c, t, W, H, st) {
    const k = t - 7.5;
    c.fillStyle = css(VRED); c.fillRect(0, 0, W, H);
    const s1 = spring(k, 1.6, 0.42), s2 = spring(k - 0.18, 1.6, 0.45);
    const breathe = 0.5 + 0.5 * Math.sin(k * 4.2);
    const settle = 1 - E.ioC(seg(t, 8.2, 9.0));
    const top = 'VARIABLE', bot = 'FONTS';
    const w1 = [], d1 = [], w2 = [], d2 = [];
    for (let i = 0; i < 8; i++) {
      const ramp = i / 7;
      w1[i] = lerp(1000, lerp(100, 1000, Math.pow(ramp, 1.5)), clamp(s1)) + settle * 60 * Math.sin(i - k * 6);
      d1[i] = lerp(150, lerp(60, 150, ramp), clamp(s1)) + (s1 - 1) * 50 + settle * 8 * breathe;
    }
    for (let i = 0; i < 5; i++) {
      const ramp = 1 - i / 4;
      w2[i] = lerp(100, lerp(150, 1000, ramp), clamp(s2));
      d2[i] = lerp(50, lerp(150, 80, ramp), clamp(s2)) + (s2 - 1) * 40;
    }
    const x = 108, rw = W - 216;
    vRow(c, st, top, x, 168 + 372, rw, 372, w1, d1, css(VINK));
    // second line rises out of its baseline, letter by letter
    if (k > 0.08) vRow(c, st, bot, x, 168 + 372 + 34 + 300, rw, 300, w2, d2, css(VINK), { sy: i => E.outQt(seg(k, 0.08 + i * 0.05, 0.5 + i * 0.05)) });

    // specimen furniture
    const a = E.outC(seg(k, 0.45, 0.9));
    if (a > 0) {
      const ink = al => css(VINK, al * a);
      text(c, 'ROBOTO FLEX', x, 104, { font: MONO, size: 16, weight: 800, ls: 4, color: ink(1) });
      text(c, 'OPENTYPE FONT VARIATIONS — 2016', W - x, 104, { font: MONO, size: 16, ls: 3, align: 'right', color: ink(0.75) });
      c.fillStyle = ink(0.85); c.fillRect(x, 124, rw * E.outQt(seg(k, 0.45, 1.1)), 2);
      const axes = [['wght', 100, 1000, 742], ['wdth', 25, 151, 118], ['opsz', 8, 144, 144]];
      const sw = (rw - 2 * 60) / 3;
      axes.forEach(([nm, lo, hi, v], i) => {
        const ax = x + i * (sw + 60), ay = H - 92;
        const p = E.outQt(seg(k, 0.6 + i * 0.15, 1.5 + i * 0.15));
        const val = Math.round(lerp(lo, v, p));
        text(c, nm, ax, ay - 22, { font: MONO, size: 15, weight: 800, ls: 2, color: ink(1) });
        text(c, String(val), ax + sw, ay - 22, { font: MONO, size: 15, align: 'right', color: ink(0.8) });
        c.fillStyle = ink(0.3); c.fillRect(ax, ay, sw, 2);
        const kx = ax + sw * (val - lo) / (hi - lo);
        c.fillStyle = ink(1); c.fillRect(ax, ay - 1, kx - ax, 4);
        c.beginPath(); c.arc(kx, ay + 1, 9, 0, TAU); c.fill();
        text(c, `${lo}`, ax, ay + 30, { font: MONO, size: 13, color: ink(0.55) });
        text(c, `${hi}`, ax + sw, ay + 30, { font: MONO, size: 13, align: 'right', color: ink(0.55) });
      });
    }
  }
  /* ================================================================
     ASCII MOTION — a raymarched torus rendered as characters: it spins,
     morphs, gets colour-scanned, collapses into rain and lands as a banner.
     ================================================================ */
  const AC_W = 12, AC_H = 22, ACOLS = 156, AROWS = 47, AOX = 24, AOY = 23;
  const RAMP = ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
  const DONUT = '.,-~:;=!*#$@';
  const RAIN = 'ｱｲｳｴｵ01#$%&*+=<>?@ABCDEFXYZ/\\|';
  const RAIN_ASCII = '01#$%&*+=<>?@ABCDEFGHKXYZ/\\|{}[]';
  const BANNER = {
    A: [' █████╗ ', '██╔══██╗', '███████║', '██╔══██║', '██║  ██║', '╚═╝  ╚═╝'],
    S: ['███████╗', '██╔════╝', '███████╗', '╚════██║', '███████║', '╚══════╝'],
    C: [' ██████╗', '██╔════╝', '██║     ', '██║     ', '╚██████╗', ' ╚═════╝'],
    I: ['██╗', '██║', '██║', '██║', '██║', '╚═╝'],
    ' ': [' ', ' ', ' ', ' ', ' ', ' '],
  };
  // each banner cell becomes 4×3 grid cells; '#' = solid, others = shadow strokes
  const SUB = {
    '█': ['BBBB', 'BBBB', 'BBBB'],
    '═': ['    ', '----', '    '],
    '║': [' |  ', ' |  ', ' |  '],
    '╗': ['    ', '-+  ', ' |  '],
    '╔': ['    ', ' +--', ' |  '],
    '╝': [' |  ', '-+  ', '    '],
    '╚': [' |  ', ' +--', '    '],
  };
  function acBanner(word) {
    const rows = ['', '', '', '', '', ''];
    [...word].forEach((ch, i) => { BANNER[ch].forEach((l, r) => (rows[r] += (i ? ' ' : '') + l)); });
    const bw = rows[0].length, cells = [];
    for (let r = 0; r < 6; r++) for (let x = 0; x < bw; x++) {
      const s = SUB[rows[r][x]];
      if (!s) continue;
      for (let sr = 0; sr < 3; sr++) for (let sc = 0; sc < 4; sc++) {
        const k = s[sr][sc];
        if (k !== ' ') cells.push({ r: r * 3 + sr, c: x * 4 + sc, k });
      }
    }
    return { cells, w: bw * 4, h: 18 };
  }
  const AC_TITLE = acBanner('ASCII');
  const AC_T0 = { r: 11, c: Math.floor((ACOLS - AC_TITLE.w) / 2) };

  // SDFs (object space)
  const sdTorus = (x, y, z, R, r) => Math.hypot(Math.hypot(x, z) - R, y) - r;
  const sdBox = (x, y, z, b, r) => {
    const qx = Math.abs(x) - b, qy = Math.abs(y) - b, qz = Math.abs(z) - b;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
  };
  function acScene(t) {
    // morph weights through the film: torus → twisted blob → rounded cube → torus knot-ish
    const mBlob = E.ioC(seg(t, 3.55, 4.35)) * (1 - E.ioC(seg(t, 4.95, 5.6)));
    const mBox = E.ioC(seg(t, 4.95, 5.6));
    const twist = 1.6 * E.ioS(seg(t, 3.3, 4.2)) * (1 - E.ioS(seg(t, 5.0, 5.6)));
    const ay = (t - 1.1) * 1.05 + 1.4 * E.ioC(seg(t, 5.8, 7.2)), ax = 0.75 + t * 0.42, az = 0.25 * Math.sin(t * 0.7);
    const ca = Math.cos(ay), sa = Math.sin(ay), cb = Math.cos(ax), sb = Math.sin(ax), cz = Math.cos(az), sz = Math.sin(az);
    const wob = t * 2.4;
    const f = (px, py, pz) => {
      // rotate world → object
      let x = px * cz + py * sz, y = -px * sz + py * cz, z = pz;
      let x2 = x * ca - z * sa, z2 = x * sa + z * ca; x = x2; z = z2;
      let y2 = y * cb - z * sb; z2 = y * sb + z * cb; y = y2; z = z2;
      if (twist) { const th = y * twist, ct = Math.cos(th), st = Math.sin(th); x2 = x * ct - z * st; z = x * st + z * ct; x = x2; }
      let d = sdTorus(x, y, z, 1.0, 0.44);
      if (mBlob > 0) {
        const b = Math.hypot(x, y, z) - 1.12 + 0.16 * Math.sin(4 * x + wob) * Math.sin(4 * y + wob * 0.7) * Math.sin(4 * z);
        d = lerp(d, b, mBlob);
      }
      if (mBox > 0) d = lerp(d, sdBox(x, y, z, 0.72, 0.16), mBox);
      return d;
    };
    return f;
  }
  // render luminance + normal-hue + depth into Float32 grids
  function acRender(t, st, scale = 1) {
    const f = acScene(t), L = st.L, N = st.N;
    const lx = -0.5, ly = 0.65, lz = -0.58, ll = Math.hypot(lx, ly, lz);
    const Lx = lx / ll, Ly = ly / ll, Lz = lz / ll;
    const roz = -4.2, foc = 1.75;
    for (let r = 0; r < AROWS; r++) {
      const vy = -(AOY + (r + 0.5) * AC_H - 540) / 540 / scale;
      for (let q = 0; q < ACOLS; q++) {
        const vx = (AOX + (q + 0.5) * AC_W - 960) / 540 / scale;
        const il = 1 / Math.hypot(vx, vy, foc), dx = vx * il, dy = vy * il, dz = foc * il;
        const i = r * ACOLS + q;
        // bounding sphere r=1.75
        const b = roz * dz, cc = roz * roz - 3.06, disc = b * b - cc;
        L[i] = -1;
        if (disc < 0) continue;
        let d = -b - Math.sqrt(disc), hit = false;
        const dmax = -b + Math.sqrt(disc);
        for (let s = 0; s < 48; s++) {
          const h = f(dx * d, dy * d, roz + dz * d);
          if (h < 0.003) { hit = true; break; }
          d += h * 0.85;
          if (d > dmax) break;
        }
        if (!hit) continue;
        const px = dx * d, py = dy * d, pz = roz + dz * d, e = 0.004;
        let nx = f(px + e, py, pz) - f(px - e, py, pz), ny = f(px, py + e, pz) - f(px, py - e, pz), nz = f(px, py, pz + e) - f(px, py, pz - e);
        const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        const diff = Math.max(0, nx * Lx + ny * Ly + nz * Lz);
        // Blinn spec
        let hx = Lx - dx, hy = Ly - dy, hz = Lz - dz; const hl = Math.hypot(hx, hy, hz); hx /= hl; hy /= hl; hz /= hl;
        const spec = Math.pow(Math.max(0, nx * hx + ny * hy + nz * hz), 24);
        const rim = Math.pow(1 - Math.max(0, -(nx * dx + ny * dy + nz * dz)), 3);
        L[i] = clamp(0.06 + diff * 0.78 + spec * 0.55 + rim * 0.18);
        N[i] = Math.atan2(ny, nx) / TAU + 0.5 + nz * 0.15;
      }
    }
  }
  const hsl2rgb = (h, s, l) => {
    h = ((h % 1) + 1) % 1;
    const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h * 12) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    return [f(0) * 255, f(8) * 255, f(4) * 255];
  };
  const PHOS = L => (L < 0.55 ? [lerp(10, 40, L / 0.55), lerp(60, 255, L / 0.55), lerp(20, 90, L / 0.55)] : [lerp(40, 225, (L - 0.55) / 0.45), 255, lerp(90, 210, (L - 0.55) / 0.45)]);

  MG.film({
    id: 'ascii', dur: 10, poster: 9.4,
    fonts: [['700 20px "JetBrains Mono"', RAMP + DONUT + RAIN_ASCII], ['400 20px "JetBrains Mono"', 'Aa1·→—']],
    meta: {
      family: 'B', name: 'ASCII Motion', sub: 'Luminance as Characters', era: '1966 —',
      origin: 'Born when Kenneth Knowlton and Leon Harmon built pictures from printed symbols at Bell Labs in 1966, then carried on through teletype art, BBS ANSI scenes, the demoscene and real-time converters such as AAlib.',
      works: 'Studies in Perception I (Knowlton & Harmon, 1966) · ASCII Star Wars (Simon Jansen, 1997) · AAlib / BB demo (1997) · donut.c (Andy Sloane, 2006) · FIGlet banners (1991)',
      tech: ['Per-cell raymarched SDF', 'Luminance → glyph density ramp', 'Column cascade + banner reassembly'],
      accent: '#3dff7a',
      motionDNA: 'Nothing moves but the character in each fixed cell: motion is luminance changing glyphs on a rigid monospace grid.',
      visualDNA: 'Phosphor green on black with bloom and scanlines, density ramps from dot to @, then full-colour lolcat scans.',
      transitions: 'Character dissolve, scanline colour wipe, matrix-rain cascade, banner rain-in.',
      implementation: ['Canvas 2D', 'WebGL shader', 'Terminal'],
      reproducibility: 'Fully procedural',
      loopable: true,
    },
    setup() {
      const G = offscreen(1920, 1080), S = offscreen(480, 270);
      return { G, g: G.getContext('2d'), S, s: S.getContext('2d'), L: new Float32Array(ACOLS * AROWS), N: new Float32Array(ACOLS * AROWS) };
    },
    draw(c, t, W, H, st) {
      const g = st.g;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.fillStyle = '#020604'; g.fillRect(0, 0, W, H);
      g.font = `700 20px ${MONO}`; g.textBaseline = 'middle'; g.textAlign = 'left';
      const buckets = new Map();
      const put = (r, q, ch, rgb) => {
        if (r < 0 || r >= AROWS || q < 0 || q >= ACOLS || ch === ' ') return;
        const key = ((rgb[0] >> 4) << 8) | ((rgb[1] >> 4) << 4) | (rgb[2] >> 4);
        let b = buckets.get(key);
        if (!b) { b = []; buckets.set(key, b); }
        b.push(AOX + q * AC_W, AOY + r * AC_H + AC_H / 2 + 1, ch);
      };
      const frame = Math.floor(t * 24);

      // ---- 3D scene (0.7 → 7.8) ----
      const sceneOn = t > 0.7 && t < 7.9;
      if (sceneOn) {
        const zoom = kf(t, [[0.7, 0.8], [1.6, 1.28, E.outC], [3.6, 1.36], [5.8, 1.45], [6.4, 1.62, E.ioC], [7.6, 1.3]]);
        acRender(t, st, zoom);
        const L = st.L, Nh = st.N;
        const reveal = seg(t, 0.75, 1.45);
        const scanY = lerp(-6, AROWS + 6, E.ioS(seg(t, 3.75, 4.65)));
        const rainbow = seg(t, 5.9, 6.3);
        const casc = t > 6.25;
        const bgA = seg(t, 1.3, 2.4) * (1 - seg(t, 7.3, 7.6)) * 0.8;
        for (let r = 1; r < AROWS - 1; r++) for (let q = 0; q < ACOLS; q++) {
          let sr = r, fall = 0;
          if (casc) {
            const t0 = 6.25 + hash(q * 3.1) * 0.75 + Math.abs(q - 78) * 0.004;
            const k = Math.max(0, t - t0);
            fall = Math.floor(k * k * 34 + k * 6);
            sr = r - fall;
            if (sr < 1) {
              // rain trail above the falling scene
              const d = 1 - sr;
              if (fall > 0 && d < 12 + hash(q) * 10) {
                const ch = RAIN_ASCII[Math.floor(hash(q * 7 + r * 13 + frame) * RAIN_ASCII.length)];
                const a = d === 1 ? 1 : Math.exp(-d * 0.22) * 0.7;
                put(r, q, ch, d === 1 ? [220, 255, 230] : hsl2rgb(q / ACOLS + t * 0.5, 0.9, 0.3 + a * 0.3).map(v => v * a + 4));
              }
              continue;
            }
          }
          const i = sr * ACOLS + q, lum = L[i];
          if (lum < 0) {
            // demoscene plasma, dim, in the empty cells
            if (bgA <= 0) continue;
            const pv = (Math.sin(q * 0.09 + t * 1.3) + Math.sin(sr * 0.2 - t * 0.9) + Math.sin((q + sr * 2) * 0.05 + t * 0.7) + Math.sin(Math.hypot(q - 78, (sr - 23) * 1.8) * 0.13 - t * 2.2)) / 8 + 0.5;
            const band = pv * 6 % 1;
            if (band < 0.55) continue;
            const v = (band - 0.55) / 0.45 * bgA;
            const pc = ' .:-=+*'[Math.min(6, 1 + Math.floor(v * 6))];
            const colK2 = clamp((scanY - r) / 3);
            const rgbp = colK2 > 0 ? hsl2rgb(pv * 1.5 + t * 0.3, 0.8, 0.06 + v * 0.16) : PHOS(0.05 + v * 0.18);
            put(r, q, pc, rgbp);
            continue;
          }
          if (hash(i * 0.37 + 1.3) > reveal) continue;
          const ramp = t < 3.75 ? DONUT : RAMP;
          let ci = Math.floor(lum * (ramp.length - 1) + 0.5);
          // characters flicker through neighbours while morphing
          const jit = seg(t, 3.5, 3.8) * (1 - seg(t, 5.6, 5.9)) * 0.6 + (casc ? 0.6 : 0);
          if (jit > 0 && hash(i + frame * 0.731) < jit * 0.25) ci = Math.floor(hash(i * 3 + frame) * ramp.length);
          const ch = ramp[clamp(ci, 1, ramp.length - 1)];
          const colK = clamp((scanY - r) / 3);
          let rgb = PHOS(lum);
          if (colK > 0) {
            const hue = lerp(Nh[i] * 0.5 + 0.35, q / ACOLS * 1.4 - r / AROWS * 0.6 + t * 0.6, rainbow);
            const cr = hsl2rgb(hue, 0.95, 0.12 + lum * 0.62);
            rgb = mixRGB(rgb, cr, colK);
          }
          // the scanline itself
          if (Math.abs(scanY - r) < 1) rgb = [230, 255, 240];
          put(r, q, ch, rgb);
        }
        // colour scan beam label
        if (scanY > 0 && scanY < AROWS) put(Math.floor(scanY), 2, '>', [255, 255, 255]);
      }

      // ---- boot prompt (0 → 1.2) ----
      if (t < 1.25) {
        const cmd = '$ ./donut --ramp ".,-~:;=!*#$@" --fps 30';
        const n = Math.floor(seg(t, 0.08, 0.62) * cmd.length);
        const fade = 1 - seg(t, 0.95, 1.25);
        const col = PHOS(0.75 * fade + 0.05);
        for (let i = 0; i < n; i++) put(2, 2 + i, cmd[i], col);
        if (Math.floor(t * 4) % 2 === 0 || n < cmd.length) put(2, 2 + n, '█', col);
        const boot = ['compiling torus.c ............ ok', 'raymarch 160x49 cells ....... ok', 'luminance ramp 12 glyphs ..... ok'];
        boot.forEach((l, k) => {
          const m = Math.floor(seg(t, 0.62 + k * 0.08, 0.72 + k * 0.08) * l.length);
          for (let i = 0; i < m; i++) put(4 + k, 2 + i, l[i], PHOS((l[i] === 'o' && i > l.length - 3 ? 0.95 : 0.45) * fade + 0.03));
        });
      }

      // ---- banner (7.55 → 10) ----
      if (t > 7.5) {
        const T0 = AC_T0;
        AC_TITLE.cells.forEach((cel, idx) => {
          const tl = 7.6 + (cel.c / AC_TITLE.w) * 0.85 + hash(cel.c * 1.7) * 0.25 + cel.r * 0.012;
          const R = T0.r + cel.r, Q = T0.c + cel.c;
          if (t < tl - 0.45) return;
          const hue = (cel.c / AC_TITLE.w) * 0.85 - cel.r * 0.012 + 0.28 - Math.max(0, 9.0 - t) * 0.15;
          if (t < tl) {
            // falling head with trail
            const p = E.inQ(seg(t, tl - 0.45, tl)), y = Math.floor(lerp(0, R, p));
            put(y, Q, RAIN_ASCII[Math.floor(hash(idx + frame * 1.3) * RAIN_ASCII.length)], [235, 255, 240]);
            for (let k = 1; k < 4; k++) if (y - k > 0) put(y - k, Q, RAIN_ASCII[Math.floor(hash(idx * 3 + k + frame) * RAIN_ASCII.length)], hsl2rgb(hue, 0.9, 0.42 - k * 0.09));
            return;
          }
          const fl = Math.exp(-(t - tl) * 9);
          let ch, rgb;
          if (cel.k === 'B') {
            const sweep = Math.exp(-Math.pow((Q - lerp(-20, ACOLS + 20, seg(t, 8.75, 9.35))) / 6, 2));
            const lum = 0.62 + 0.3 * (1 - cel.r / 18) + sweep * 0.3;
            ch = '@%#&$B8W'[Math.floor(hash(idx * 0.13) * 3 + (1 - lum) * 4) % 8];
            if (lum > 0.9) ch = '@';
            rgb = mixRGB(hsl2rgb(hue, 0.95, 0.5 + 0.1 * (1 - cel.r / 18) + sweep * 0.3), [255, 255, 255], fl);
          } else {
            ch = cel.k === '-' ? '=' : cel.k === '|' ? '|' : '+';
            rgb = mixRGB(hsl2rgb(hue, 0.7, 0.26), [255, 255, 255], fl);
          }
          put(R, Q, ch, rgb);
        });
        // subtitle + prompt
        const sub = 'A S C I I   M O T I O N';
        const n1 = Math.floor(seg(t, 8.55, 8.95) * sub.length);
        for (let i = 0; i < n1; i++) put(33, Math.floor((ACOLS - sub.length) / 2) + i, sub[i], [235, 245, 235]);
        const sub2 = 'luminance → glyph    .,-~:;=!*#$@    1966 — knowlton · aalib · donut.c';
        const n2 = Math.floor(seg(t, 8.85, 9.3) * sub2.length);
        for (let i = 0; i < n2; i++) put(35, Math.floor((ACOLS - sub2.length) / 2) + i, sub2[i], PHOS(0.42));
      }

      // ---- status bars ----
      const sb = seg(t, 0.2, 0.5);
      if (sb > 0) {
        const mode = t < 3.75 ? 'TORUS  ramp:12' : t < 6.25 ? 'MORPH  ramp:70  scan' : t < 7.6 ? 'CASCADE' : 'BANNER figlet|lolcat';
        const top = ` tty1  ${ACOLS}x${AROWS}  ${mode}`;
        const fr = `frame ${String(Math.floor(t * 30)).padStart(4, '0')} `;
        const dim = PHOS(0.3 * sb);
        for (let i = 0; i < top.length; i++) put(0, i, top[i], dim);
        for (let i = 0; i < fr.length; i++) put(0, ACOLS - fr.length + i, fr[i], dim);
        const bot = t < 9 ? ` lum→char  ${DONUT}` : ' $ ';
        for (let i = 0; i < bot.length; i++) put(AROWS - 1, i, bot[i], dim);
        if (t > 9 && Math.floor(t * 2.5) % 2 === 0) put(AROWS - 1, bot.length, '█', PHOS(0.7));
      }

      // flush buckets
      buckets.forEach((arr, key) => {
        g.fillStyle = `rgb(${((key >> 8) & 15) * 17},${((key >> 4) & 15) * 17},${(key & 15) * 17})`;
        for (let i = 0; i < arr.length; i += 3) g.fillText(arr[i + 2], arr[i], arr[i + 1]);
      });

      // composite: bloom + scanlines + flicker
      c.fillStyle = '#010302'; c.fillRect(0, 0, W, H);
      const shake = t > 7.55 && t < 7.8 ? Math.sin(t * 120) * 6 * (1 - seg(t, 7.55, 7.8)) : 0;
      c.drawImage(st.G, shake, 0);
      st.s.globalCompositeOperation = 'copy';
      st.s.drawImage(st.G, 0, 0, 480, 270);
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.filter = 'blur(6px)'; c.globalAlpha = 1.0 + 0.3 * flashAt(t, [0.75, 6.25, 7.6], 4);
      c.drawImage(st.S, shake, 0, W, H);
      c.filter = 'blur(24px)'; c.globalAlpha = 0.5;
      c.drawImage(st.S, 0, 0, W, H);
      c.restore();
      c.fillStyle = 'rgba(0,0,0,0.28)';
      for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1.6);
      const fl = flashAt(t, [7.6], 6);
      if (fl > 0.01) { c.fillStyle = `rgba(200,255,220,${fl * 0.25})`; c.fillRect(0, 0, W, H); }
      vignette(c, W, H, 0.7);
      grain(c, W, H, t, 0.05, 'screen');
    },
    score(A) {
      A.bus.gain.value = 0.8; A.send.gain.value = 0.8; // headroom: keep the master peak under 0 dBFS
      // typing + PC-speaker beep
      for (let i = 0; i < 26; i++) A.noise(0.08 + i * 0.021 + hash(i) * 0.008, { type: 'bandpass', f: 3000 + hash(i * 3) * 2500, q: 3, dur: 0.012, g: 0.12, pan: (hash(i * 5) - 0.5) * 0.4 });
      for (let i = 0; i < 6; i++) A.noise(0.64 + i * 0.03, { type: 'highpass', f: 6000, dur: 0.01, g: 0.06 });
      A.osc(0.72, { type: 'square', f: 988, dur: 0.09, g: 0.05, hold: true, rel: 0.01 });
      A.noise(0.75, { type: 'highpass', f: 2000, f2: 9000, dur: 0.7, g: 0.08, swell: 0.3, crush: true });
      // demoscene chip loop, 120 bpm
      const S16 = 0.125;
      const prog = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]];
      for (let s = 0; s < 54; s++) {
        const tt = 0.75 + s * S16;
        if (tt > 7.55) break;
        const bar = Math.floor(s / 16) % 4, ch = prog[bar];
        const hot = tt > 6.25;
        A.osc(tt, { type: 'square', f: midi(ch[s % 3] + 12 + (hot ? 12 : 0)), dur: 0.1, g: 0.03, lp: 3000, rev: 0.15, pan: s % 2 ? 0.3 : -0.3 });
        if (s % 4 === 0) A.kick(tt, 0.7);
        if (s % 8 === 4) A.snare(tt, 0.22, { f: 2400 });
        if (s % 2 === 1) A.hat(tt, 0.05);
        if (s % 2 === 0) A.osc(tt, { type: 'triangle', f: midi(ch[0] - 24), dur: 0.12, g: 0.14 });
      }
      // morph + colour scan
      A.whoosh(3.45, 0.5, { f1: 200, f2: 4000, g: 0.12 });
      A.osc(3.75, { type: 'sawtooth', f: 220, f2: 1760, glide: 0.9, dur: 0.92, g: 0.03, lp: 800, lp2: 6000, crush: true, rev: 0.3 });
      A.bell(4.65, midi(84), { g: 0.06, dur: 1.2 });
      A.whoosh(4.9, 0.6, { f1: 4000, f2: 300, g: 0.1 });
      // cascade
      A.impact(6.25, 0.45);
      A.osc(6.25, { type: 'square', f: 1760, f2: 110, glide: 1.25, dur: 1.3, g: 0.03, lp: 5000, lp2: 400, crush: true, rev: 0.3 });
      A.noise(6.25, { type: 'bandpass', f: 5000, f2: 900, q: 0.8, dur: 1.3, g: 0.08, crush: true, swell: 0.3 });
      for (let k = 0; k < 18; k++) A.noise(6.3 + k * 0.07, { type: 'highpass', f: 4000 + hash(k) * 4000, dur: 0.015, g: 0.05, pan: (hash(k * 2) - 0.5) });
      // banner lands
      A.kick(7.6, 0.9); A.impact(7.6, 0.6);
      for (let k = 0; k < 20; k++) A.pluck(7.6 + k * 0.045 + hash(k) * 0.02, midi([69, 72, 76, 79, 81, 84][k % 6] + 12), { g: 0.06, bright: 0.95, dur: 0.4, pan: -0.6 + (k / 20) * 1.2 });
      A.chord(8.5, [45, 57, 64, 69, 73, 76], { type: 'square', dur: 1.5, g: 0.016, a: 0.01, lp: 2600, lp2: 700, lpT: 1.4, rev: 0.5, width: 1.2 });
      A.chord(8.5, [57, 64, 69], { type: 'triangle', dur: 1.5, g: 0.05, a: 0.05, hold: true, rel: 0.5, rev: 0.4 });
      A.osc(8.5, { type: 'triangle', f: midi(33), dur: 1.5, g: 0.16, hold: true, rel: 0.6 });
      [8.75, 8.875, 9.0, 9.125].forEach((s, i) => A.osc(s, { type: 'square', f: midi([81, 85, 88, 93][i]), dur: 0.2, g: 0.025, lp: 4000, rev: 0.4 }));
      for (let i = 0; i < 12; i++) A.noise(8.88 + i * 0.022, { type: 'bandpass', f: 3500, q: 3, dur: 0.01, g: 0.07 });
    },
  });
  /* ================================================================
     3D TYPOGRAPHY — chrome-faced, orange-plastic extruded letters.
     Each glyph is an affine-projected plane; the extrusion is a stack of
     perspective-correct layers lit by a key light; floor reflection pass.
     ================================================================ */
  const T3_WORD = 'DEPTH', T3_FS = 300, T3_DEP = 96, T3_FOC = 1900;
  const T3_FONT = `900 ${T3_FS}px Archivo`;
  const T3_OR = hexRGB('#ff5a14');
  const v3 = (x, y, z) => [x, y, z];
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  // R = Ry · Rx · Rz, stored as columns (local X, Y, Z axes in world)
  function rot3(rx, ry, rz) {
    const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
    const ax = (v) => { // apply Rz, then Rx, then Ry
      let [x, y, z] = v;
      [x, y] = [x * cz - y * sz, x * sz + y * cz];
      [y, z] = [y * cx - z * sx, y * sx + z * cx];
      [x, z] = [x * cy + z * sy, -x * sy + z * cy];
      return [x, y, z];
    };
    return [ax([1, 0, 0]), ax([0, 1, 0]), ax([0, 0, 1])];
  }
  const app = (R, v) => add3(add3(mul3(R[0], v[0]), mul3(R[1], v[1])), mul3(R[2], v[2]));

  // per-letter entrances: [land time, from offset, from rotation, kind]
  const T3_IN = [
    { tl: 0.75, off: [0, 1100, -200], rot: [-TAU * 0.75, 0.3, 0], kind: 'drop' },
    { tl: 1.25, off: [-1500, 260, 300], rot: [0, -0.6, TAU * 0.5], kind: 'fly' },
    { tl: 1.75, off: [0, 120, 4200], rot: [TAU * 0.5, TAU * 0.5, 0], kind: 'fly' },
    { tl: 2.25, off: [1500, 300, 200], rot: [0, TAU * 0.75, -0.5], kind: 'fly' },
    { tl: 2.75, off: [0, 1300, 0], rot: [0, TAU, 0], kind: 'drop' },
  ];
  const T3_LOCK = 7.4;

  function t3Camera(t, gs) {
    const yaw = kf(t, [[0, -0.62], [3.0, -0.38, E.ioS], [5.4, 0.62, E.ioS], [6.55, 0.78, E.outQ], [T3_LOCK, -0.16, E.ioX], [9.0, -0.1, E.outC], [10, -0.1]]);
    const pitch = kf(t, [[0, 0.07], [3.0, 0.12, E.ioS], [4.6, 0.36, E.ioS], [6.55, 0.2, E.ioS], [T3_LOCK, 0.12, E.ioX], [9.0, 0.17, E.outC], [10, 0.17]]);
    const dist = kf(t, [[0, 1350], [2.75, 1600, E.ioS], [3.6, 2450, E.ioC], [5.4, 2150, E.ioS], [6.55, 1800, E.ioS], [T3_LOCK, 1850, E.ioX], [9.0, 1980, E.outC], [10, 1980]]);
    const ty = kf(t, [[0, 40], [T3_LOCK, 60], [9, -40, E.outC], [10, -40]]);
    const X = i => gs[i].x;
    const tx = kf(t, [[0, X(0) * 0.85], [0.8, X(0) * 0.75], [1.3, X(1) * 0.7], [1.8, X(2) * 0.6], [2.3, X(3) * 0.6], [2.8, X(4) * 0.55], [3.6, 0, E.ioC]]);
    return { yaw, pitch, dist, ty, tx };
  }

  MG.film({
    id: 'type3d', dur: 10, poster: 9.4,
    fonts: [[T3_FONT, T3_WORD], ['800 30px Archivo', '3D TYPOGRAPHY'], ['400 15px "JetBrains Mono"', 'Aa1·—']],
    meta: {
      family: 'B', name: '3D Typography', sub: 'Extruded Letterforms', era: '1978 —',
      origin: 'Grew out of the late-1970s and 1980s broadcast idents, when studios such as Robert Abel and Associates and Pacific Data Images flew chrome and extruded logos through computer-generated space; Cinema 4D and real-time engines later made it a staple of title design.',
      works: 'Superman title sequence (R/Greenberg Associates, 1978) · Robert Abel & Associates broadcast idents (1980s) · 20th Century Fox logo (CG version, 1994) · Universal Pictures logo (CG version, 1997)',
      tech: ['Affine-projected glyph planes', 'Perspective layer-stack extrusion', 'Chrome env-band shading + floor reflection'],
      accent: '#ff5a14',
      motionDNA: 'Heavy letters tumble in with weight and bounce, the camera orbits to prove they are solid, then everything locks into a frontal hero lockup.',
      visualDNA: 'Chrome faces with horizon-band reflections on saturated plastic sides, dark studio cyclorama, glossy floor reflection, lens glint.',
      transitions: 'Drop-and-bounce landings, domino flips, camera whip-pan, glint sweep on the lock.',
      implementation: ['Cinema 4D', 'Three.js', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const R = offscreen(960, 540);
      return { R, r: R.getContext('2d'), glyph: null };
    },
    draw(c, t, W, H, st) {
      if (!st.glyph) {
        c.font = T3_FONT; c.fontStretch = 'expanded';
        const capH = c.measureText('H').actualBoundingBoxAscent || T3_FS * 0.72;
        const gs = [...T3_WORD].map(ch => {
          const m = c.measureText(ch);
          return { ch, adv: m.width, cx: (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2, w: m.actualBoundingBoxRight + m.actualBoundingBoxLeft };
        });
        const gap = 58, tot = gs.reduce((s, g) => s + g.w, 0) + gap * (gs.length - 1);
        let x = -tot / 2;
        gs.forEach(g => { g.x = x + g.w / 2; x += g.w + gap; });
        c.fontStretch = 'normal';
        st.glyph = { gs, capH, tot };
      }
      const { gs, capH } = st.glyph;

      // camera
      const cm = t3Camera(t, gs);
      let shake = 0;
      [...T3_IN.map(o => o.tl), T3_LOCK].forEach((L, i) => { if (t >= L) shake += Math.exp(-(t - L) * 10) * Math.sin((t - L) * 70) * (i === 5 ? 14 : 8); });
      const target = v3(cm.tx, capH * 0.5 + cm.ty, 0);
      const cp = v3(target[0] + cm.dist * Math.sin(cm.yaw) * Math.cos(cm.pitch), target[1] + cm.dist * Math.sin(cm.pitch), target[2] - cm.dist * Math.cos(cm.yaw) * Math.cos(cm.pitch));
      const f = norm3(sub3(target, cp)), r = norm3(cross3(v3(0, 1, 0), f)), u = cross3(f, r);
      const cam = { cp, f, r, u, sx: W / 2, sy: H / 2 + shake };
      const proj = p => { const d = sub3(p, cp), z = dot3(d, f); const s = T3_FOC / z; return [cam.sx + dot3(d, r) * s, cam.sy - dot3(d, u) * s, z, s]; };

      // letter poses
      const L = gs.map((g, i) => {
        const e = T3_IN[i];
        let off = [0, 0, 0], rx = 0, ry = 0, rz = 0, sqx = 1, sqy = 1, vis = t > e.tl - 0.75;
        const k = t - e.tl;
        if (k < 0) {
          const p = seg(t, e.tl - 0.75, e.tl);
          const pe = e.kind === 'drop' ? E.inQ(p) : E.outC(p);
          off = mul3(e.off, 1 - pe);
          if (e.kind !== 'drop') off[1] = e.off[1] * (1 - E.inQ(p));
          rx = e.rot[0] * (1 - E.outQ(p)); ry = e.rot[1] * (1 - E.outQ(p)); rz = e.rot[2] * (1 - E.outQ(p));
        } else {
          const b = Math.exp(-k * 5.5);
          off = [0, Math.abs(Math.sin(k * 9)) * 70 * b * (e.kind === 'drop' ? 1 : 0.4), 0];
          const sq = Math.exp(-k * 9) * Math.cos(k * 26) * 0.16;
          sqy = 1 - sq; sqx = 1 + sq * 0.6;
          rz = Math.sin(k * 14) * 0.07 * b;
        }
        // domino flip
        const fu = E.ioC(seg(t, 3.45 + i * 0.13, 4.35 + i * 0.13));
        rx += fu * TAU;
        off[1] += Math.sin(fu * Math.PI) * 110;
        // whip spin into the lock
        const wu = E.ioC(seg(t, 6.45 + i * 0.07, T3_LOCK - 0.28 + i * 0.07));
        ry += wu * TAU;
        off[1] += Math.sin(wu * Math.PI) * 60;
        const lk = Math.max(0, t - (T3_LOCK + i * 0.07 - 0.28));
        if (t > T3_LOCK - 0.3) { const sq = Math.exp(-lk * 8) * Math.sin(lk * 30) * 0.06; sqy *= 1 - sq; sqx *= 1 + sq; }
        const pos = add3(v3(g.x, capH / 2, 0), off);
        return { g, i, pos, R: rot3(rx, ry, rz), sqx, sqy, vis };
      });

      // ---- background studio ----
      const bg = c.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#07080a'); bg.addColorStop(0.55, '#141519'); bg.addColorStop(1, '#060607');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      const base = proj(v3(0, 0, 0));
      const hz = proj(v3(0, 0, 9000));
      const sp = c.createRadialGradient(W / 2, base[1] - 260, 0, W / 2, base[1] - 260, 1050);
      const warm = seg(t, 0.1, 1.2);
      sp.addColorStop(0, `rgba(120,128,150,${0.32 * warm})`); sp.addColorStop(0.5, `rgba(60,64,80,${0.16 * warm})`); sp.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = sp; c.fillRect(0, 0, W, H);
      // soft volumetric key beam from above
      c.save();
      c.globalCompositeOperation = 'lighter';
      const bx = W / 2 + Math.sin(cm.yaw) * 260, by = base[1];
      const bm = c.createLinearGradient(0, 0, 0, by);
      bm.addColorStop(0, `rgba(150,160,190,${0.0})`); bm.addColorStop(0.35, `rgba(150,160,190,${0.05 * warm})`); bm.addColorStop(1, `rgba(170,175,200,${0.09 * warm})`);
      c.fillStyle = bm;
      c.beginPath(); c.moveTo(bx - 140, 0); c.lineTo(bx + 140, 0); c.lineTo(bx + 900, by); c.lineTo(bx - 900, by); c.closePath();
      c.filter = 'blur(40px)'; c.fill(); c.filter = 'none';
      c.restore();
      // floor plane tint below horizon
      const fl = c.createLinearGradient(0, hz[1], 0, H);
      fl.addColorStop(0, 'rgba(30,31,36,0)'); fl.addColorStop(0.08, 'rgba(26,27,32,0.9)'); fl.addColorStop(1, 'rgba(8,8,10,1)');
      c.fillStyle = fl; c.fillRect(0, hz[1], W, H - hz[1]);
      // orange rim on the horizon
      const hg = c.createLinearGradient(0, hz[1] - 40, 0, hz[1] + 40);
      hg.addColorStop(0, 'rgba(255,90,20,0)'); hg.addColorStop(0.5, `rgba(255,110,40,${0.12 * warm})`); hg.addColorStop(1, 'rgba(255,90,20,0)');
      c.fillStyle = hg; c.fillRect(0, hz[1] - 40, W, 80);

      // contact shadows
      L.forEach(o => {
        if (!o.vis) return;
        const h = Math.max(0, o.pos[1] - capH / 2);
        const a = clamp(1 - h / 700) * 0.75;
        if (a <= 0.01) return;
        const p = proj(v3(o.pos[0], 0, o.pos[2]));
        const rx = (o.g.w * 0.62 + h * 0.3) * p[3], ry = rx * 0.22 * (0.4 + Math.sin(cm.pitch) * 3);
        c.save(); c.translate(p[0], p[1]); c.scale(1, ry / rx);
        const sg = c.createRadialGradient(0, 0, 0, 0, 0, rx);
        sg.addColorStop(0, `rgba(0,0,0,${a})`); sg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = sg; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill();
        c.restore();
      });

      // light (world), glint sweep position
      const LW = norm3(v3(-0.45, 0.8, -0.5));
      const glint = lerp(-1500, 1500, E.ioS(seg(t, T3_LOCK - 0.05, T3_LOCK + 0.85)));
      const glint2 = lerp(-1500, 1500, E.ioS(seg(t, 2.85, 3.55)));

      const drawLetter = (g2, o, mir) => {
        const M = v => (mir ? [v[0], -v[1], v[2]] : v);
        const Rl = [M(o.R[0]), M(o.R[1]), M(o.R[2])], pos = M(o.pos);
        const ex = mul3(Rl[0], o.sqx), ey = mul3(Rl[1], o.sqy), ez = Rl[2];
        const C0 = add3(pos, mul3(ez, -T3_DEP / 2)), C1 = add3(pos, mul3(ez, T3_DEP / 2));
        const nF = mul3(ez, -1);
        const frontVis = dot3(nF, sub3(cp, C0)) > 0;
        const P0 = proj(C0), P1 = proj(C1);
        if (P0[2] < 50 || P1[2] < 50) return;
        const n = clamp(Math.ceil(Math.hypot(P1[0] - P0[0], P1[1] - P0[1]) / 1.4), 2, 150);
        // light in glyph space: local light → canvas (x, −y)
        const lx = dot3(LW, Rl[0]), ly = dot3(LW, Rl[1]);
        let gx = lx, gy = -ly; const gl = Math.hypot(gx, gy) || 1; gx /= gl; gy /= gl;
        const R2 = capH * 0.75;
        const xf = (P, s) => {
          g2.setTransform(cam.m[0], 0, 0, cam.m[0], 0, 0);
          g2.transform(s * dot3(ex, r), -s * dot3(ex, u), -s * dot3(ey, r), s * dot3(ey, u), P[0], P[1]);
        };
        const gch = o.g.ch, cx = o.g.cx;
        g2.font = T3_FONT; g2.fontStretch = 'expanded';
        for (let j = 0; j < n; j++) {
          const kk = frontVis ? 1 - j / n : j / n;             // 1 = back
          const z = lerp(-T3_DEP / 2, T3_DEP / 2, kk);
          const P = proj(add3(pos, mul3(ez, z)));
          xf(P, P[3]);
          const dk = lerp(1, 0.42, kk) * (mir ? 0.8 : 1);
          const gr = g2.createLinearGradient(-gx * R2, -gy * R2, gx * R2, gy * R2);
          gr.addColorStop(0, css(mul3(T3_OR, 0.16 * dk)));
          gr.addColorStop(0.5, css(mul3(T3_OR, 0.62 * dk)));
          gr.addColorStop(0.85, css(mixRGB(mul3(T3_OR, dk), [255, 200, 150], 0.25)));
          gr.addColorStop(1, css(mixRGB(T3_OR, [255, 236, 210], 0.6 * dk)));
          g2.fillStyle = gr;
          g2.fillText(gch, -cx, capH / 2);
        }
        // cap face (chrome)
        const Pc = frontVis ? P0 : P1;
        xf(Pc, Pc[3]);
        const nc = frontVis ? nF : ez;
        const tilt = clamp(dot3(nc, u) * 1.4 + dot3(nc, r) * 0.25, -0.9, 0.9);
        const hh = capH / 2;
        const ch = g2.createLinearGradient(0, -hh * (1.15 + tilt), 0, hh * (1.15 - tilt));
        const b = frontVis ? 1 : 0.55;
        const gcol = (v, al = 1) => `rgba(${v[0] * b | 0},${v[1] * b | 0},${v[2] * b | 0},${al})`;
        ch.addColorStop(0, gcol([250, 252, 255])); ch.addColorStop(0.22, gcol([186, 196, 210]));
        ch.addColorStop(0.46, gcol([70, 78, 92])); ch.addColorStop(0.5, gcol([20, 22, 28]));
        ch.addColorStop(0.53, gcol([255, 214, 170])); ch.addColorStop(0.62, gcol([224, 230, 238]));
        ch.addColorStop(0.84, gcol([120, 130, 146])); ch.addColorStop(1, gcol([40, 44, 52]));
        g2.fillStyle = ch;
        g2.fillText(gch, -cx, capH / 2);
        // glint sweeps (glyph-space band at the world x of the sweep)
        [[glint, 0.95], [glint2, 0.55]].forEach(([gxw, ga]) => {
          const lxp = gxw - o.pos[0];
          if (Math.abs(lxp) > o.g.w + 260) return;
          const sw = g2.createLinearGradient(lxp - 240, -hh, lxp + 240, hh);
          sw.addColorStop(0, 'rgba(255,255,255,0)'); sw.addColorStop(0.5, `rgba(255,255,255,${ga * b})`); sw.addColorStop(1, 'rgba(255,255,255,0)');
          g2.fillStyle = sw; g2.globalCompositeOperation = mir ? 'source-over' : 'lighter';
          g2.fillText(gch, -cx, capH / 2);
          g2.globalCompositeOperation = 'source-over';
        });
        // bevel edge
        g2.lineWidth = 2.2; g2.lineJoin = 'round';
        g2.strokeStyle = `rgba(255,236,214,${0.55 * b})`;
        g2.strokeText(gch, -cx, capH / 2);
        g2.fontStretch = 'normal';
      };
      const order = L.filter(o => o.vis).map(o => ({ o, z: dot3(sub3(o.pos, cp), f) })).sort((a, b) => b.z - a.z);

      // ---- reflection pass (half res, mirrored, faded) ----
      const rg = st.r;
      rg.setTransform(1, 0, 0, 1, 0, 0); rg.clearRect(0, 0, 960, 540);
      cam.m = [0.5];
      order.forEach(({ o }) => drawLetter(rg, o, true));
      rg.setTransform(1, 0, 0, 1, 0, 0);
      rg.globalCompositeOperation = 'destination-in';
      const ry0 = base[1] / 2;
      const mg = rg.createLinearGradient(0, ry0 - 6, 0, ry0 + 92);
      mg.addColorStop(0, 'rgba(0,0,0,0.4)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
      rg.fillStyle = mg; rg.fillRect(0, 0, 960, 540);
      rg.globalCompositeOperation = 'source-over';
      c.save(); c.filter = 'blur(1.5px)'; c.drawImage(st.R, 0, 0, W, H); c.restore();

      // ---- letters ----
      cam.m = [c.getTransform().a];
      c.save();
      order.forEach(({ o }) => drawLetter(c, o, false));
      c.restore();
      c.setTransform(cam.m[0], 0, 0, cam.m[0], 0, 0);

      // ---- lock glint flare ----
      const fk = t - T3_LOCK;
      if (fk > -0.05 && fk < 1.2) {
        const gp = proj(v3(glint, capH * 0.92, -T3_DEP / 2));
        const a = Math.sin(clamp((fk + 0.05) / 1.0) * Math.PI);
        c.save(); c.globalCompositeOperation = 'lighter';
        const fg = c.createRadialGradient(gp[0], gp[1], 0, gp[0], gp[1], 260);
        fg.addColorStop(0, `rgba(255,240,220,${0.7 * a})`); fg.addColorStop(0.2, `rgba(255,140,60,${0.25 * a})`); fg.addColorStop(1, 'rgba(255,90,20,0)');
        c.fillStyle = fg; c.fillRect(gp[0] - 260, gp[1] - 260, 520, 520);
        const st2 = c.createLinearGradient(gp[0] - 900, 0, gp[0] + 900, 0);
        st2.addColorStop(0, 'rgba(255,120,50,0)'); st2.addColorStop(0.5, `rgba(255,220,190,${0.55 * a})`); st2.addColorStop(1, 'rgba(255,120,50,0)');
        c.fillStyle = st2;
        [[1.2, 1], [5, 0.35], [14, 0.12]].forEach(([hh, al]) => { c.globalAlpha = al; c.fillRect(gp[0] - 900, gp[1] - hh, 1800, hh * 2); });
        c.globalAlpha = 1;
        c.restore();
      }
      // tagline
      const ta = E.outC(seg(t, 8.15, 8.8));
      if (ta > 0) {
        const ty = Math.min(H - 110, base[1] + 262);
        text(c, '3D TYPOGRAPHY', W / 2, ty + (1 - ta) * 16, { font: 'Archivo, sans-serif', weight: 800, size: 30, ls: 18, align: 'center', color: `rgba(238,236,232,${ta})` });
        c.fillStyle = `rgba(255,90,20,${ta})`; c.fillRect(W / 2 - 40 * ta, ty + 26, 80 * ta, 3);
        const sa = E.outC(seg(t, 8.45, 9.0));
        text(c, 'EXTRUDED  ·  LIT  ·  ORBITED', W / 2, ty + 62, { font: MONO, size: 15, ls: 6, align: 'center', color: `rgba(238,236,232,${sa * 0.5})` });
      }
      // lock flash
      const lf = flashAt(t, [T3_LOCK], 5);
      if (lf > 0.01) {
        c.save(); c.globalCompositeOperation = 'lighter';
        const lg = c.createRadialGradient(W / 2, base[1] - 120, 0, W / 2, base[1] - 120, 1100);
        lg.addColorStop(0, `rgba(255,200,160,${0.35 * lf})`); lg.addColorStop(1, 'rgba(255,120,60,0)');
        c.fillStyle = lg; c.fillRect(0, 0, W, H); c.restore();
      }
      // opening fade from black
      const fin = 1 - seg(t, 0, 0.45);
      if (fin > 0) { c.fillStyle = `rgba(0,0,0,${fin})`; c.fillRect(0, 0, W, H); }
      grain(c, W, H, t, 0.045, 'overlay');
      vignette(c, W, H, 0.62);
    },
    score(A) {
      A.bus.gain.value = 0.74; A.send.gain.value = 0.74; // headroom: keep the master peak under 0 dBFS
      // studio drone
      A.osc(0.0, { type: 'sawtooth', f: midi(33), dur: 7.4, g: 0.05, a: 1.5, hold: true, rel: 0.4, lp: 220, lp2: 900, lpT: 7.2 });
      A.osc(0.0, { f: midi(21), dur: 7.4, g: 0.12, a: 1.2, hold: true, rel: 0.3 });
      // landings
      T3_IN.forEach((e, i) => {
        A.whoosh(e.tl - 0.55, 0.55, { f1: 300 + i * 100, f2: 2500 + i * 400, g: 0.13, pan: [-0.2, -0.6, 0, 0.6, 0.1][i] });
        A.kick(e.tl, 0.85, { f: 120, f2: 38 });
        A.noise(e.tl, { type: 'lowpass', f: 1800, f2: 200, dur: 0.35, g: 0.22, rev: 0.4 });
        A.bell(e.tl, midi(40 + [0, 3, 7, 5, 12][i]), { g: 0.06, dur: 1.4, ratios: [1, 2.41, 3.93, 5.37], rev: 0.5, pan: [-0.2, -0.5, 0, 0.5, 0.1][i] });
      });
      // pulse + domino flips
      for (let b = 0; b < 8; b++) {
        const s = 3.0 + b * 0.5;
        A.kick(s, 0.6);
        A.hat(s + 0.25, 0.06, true);
        [0, 0.25].forEach(d => A.osc(s + d, { type: 'sawtooth', f: midi([33, 33, 36, 31][Math.floor(b / 2)] + (d ? 12 : 0)), dur: 0.22, g: 0.07, lp: 600, lp2: 200, lpT: 0.2 }));
      }
      for (let i = 0; i < 5; i++) {
        A.whoosh(3.45 + i * 0.13, 0.9, { f1: 500, f2: 3000, g: 0.06, pan: -0.6 + i * 0.3 });
        A.pluck(3.9 + i * 0.13, midi([64, 67, 71, 74, 76][i]), { g: 0.14, bright: 0.8, dur: 1.2, rev: 0.4, pan: -0.6 + i * 0.3 });
      }
      // build + whip
      A.riser(5.4, 2.0, { g: 0.16, f: 82 });
      A.whoosh(6.45, 0.95, { f1: 200, f2: 6000, g: 0.2, swell: 0.85 });
      // the lock
      A.impact(T3_LOCK, 0.9);
      A.kick(T3_LOCK, 0.9, { f: 110, f2: 32, dur: 0.7 });
      A.chord(T3_LOCK, [33, 45, 52, 57, 61, 64], { type: 'sawtooth', dur: 2.55, g: 0.035, a: 0.02, lp: 4200, lp2: 500, lpT: 2.4, spread: 8, rev: 0.6, width: 1.4 });
      A.chord(T3_LOCK, [57, 64, 69, 73], { type: 'sine', dur: 2.55, g: 0.04, a: 0.5, hold: true, rel: 0.8, rev: 0.6 });
      A.noise(T3_LOCK, { type: 'highpass', f: 5000, f2: 12000, dur: 1.0, g: 0.06, swell: 0.4, rev: 0.6 });
      A.bell(T3_LOCK + 0.35, midi(88), { g: 0.06, dur: 2, pan: 0.3 });
      A.bell(8.2, midi(81), { g: 0.05, dur: 1.7, pan: -0.2 });
    },
  });
})();
