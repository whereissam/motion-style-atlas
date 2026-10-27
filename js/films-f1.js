/* batch f1 — Family A: Graphic Design & Historical. De Stijl · Risograph Animation · Neo-Brutalism. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600&family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Space+Mono:wght@400;700&family=Archivo+Black&family=Space+Grotesk:wght@500;700&family=Tinos:wght@400;700&display=block');
  const PI = Math.PI;

  // Shared piano: Karplus–Strong body + sine fundamental with a soft hammer.
  const piano = (A, t, m, g = 0.12, dur = 2.4, o = {}) => {
    A.pluck(t, midi(m), { dur, g: g * 1.2, bright: o.bright ?? 0.4, decay: 0.997, lp: o.lp ?? 3200, rev: o.rev ?? 0.3, pan: o.pan || 0 });
    A.osc(t, { f: midi(m), dur: dur * 0.8, g: g * 0.5, a: 0.003, rev: o.rev ?? 0.3, pan: o.pan || 0 });
    A.osc(t, { f: midi(m) * 2, dur: dur * 0.35, g: g * 0.1, a: 0.003 });
  };

  /* =====================================================================
     DE STIJL — taut black lines are laid across an empty ground over a
     charcoal under-drawing, primary planes snap into the cells and the
     whole grid rebalances; the lines turn yellow and Boogie-Woogie traffic
     hops along them, then the traffic assembles the block-letter masthead
     and the composition locks back into black
     ===================================================================== */
  const DS = { ground: '#eeebe2', red: '#cc2a1e', blue: '#1f3c8c', yel: '#f1cb1d', blk: '#161616', grey: '#bdbab1', lw: 24 };
  const DS_F = 'Jost, Futura, sans-serif';
  const DS_T = { boogie: 4.5, hop: 4.95, gather: 6.5, lock: 7.45, cap: 7.95 };
  // Structural lines: positions [first composition, after rebalance, final masthead]; mv = rebalance time, fm = final move.
  const DS_L = {
    hA: { o: 'h', p: [340, 420, 300], mv: 3.5, fm: 6.95, draw: [0.3, 0.72, 1] },
    vA: { o: 'v', p: [640, 560, 1260], mv: 3.75, fm: 6.98, draw: [0.75, 1.12, 1] },
    hB: { o: 'h', p: [820, 780, 860], mv: 4.25, fm: 7.01, draw: [1.25, 1.55, -1] },
    vB: { o: 'v', p: [1480, 1360, 1640], mv: 4.0, fm: 7.04, draw: [1.5, 1.78, 1] },
    vC: { o: 'v', p: [300, 250, 140], mv: 3.75, fm: 7.06, draw: [1.75, 1.96, -1] },
    hC: { o: 'h', p: [600, 640, 600], mv: 4.0, fm: 7.08, draw: [2.0, 2.2, 1] },
    h0: { o: 'h', p: [170, 170, 150], mv: 3.5, fm: 7.1, draw: [2.15, 2.38, 1] },
  };
  const DS_SPAN = { hA: () => [0, 1920], vA: () => [0, 1080], hB: () => [0, 1920], vB: G => [G.hA, 1080], vC: G => [G.hB, 1080], hC: G => [G.vB, 1920], h0: G => [0, G.vA] };
  // Colour planes are cells bounded by the live lines; in the Boogie-Woogie phase they contract to blinking blocks.
  const DS_P = [
    { col: DS.red, boo: DS.red, inner: DS.grey, r: G => [G.vA, 0, 1920, G.hA], at: 2.5, dir: 'd', blk: [170, 110] },
    { col: DS.blue, boo: DS.blue, inner: DS.yel, r: G => [0, G.hB, G.vC, 1080], at: 2.75, dir: 'r', blk: [96, 96] },
    { col: DS.yel, boo: DS.yel, inner: DS.red, r: G => [G.vB, G.hC, 1920, G.hB], at: 3.0, dir: 'u', blk: [130, 84] },
    { col: DS.blk, boo: DS.grey, inner: DS.blue, r: G => [G.vB, G.hB, 1920, 1080], at: 3.25, dir: 'l', blk: [104, 104] },
  ];
  // Extra Boogie-Woogie lines (thin, full length) drawn on the 8ths.
  const DS_X = [['v', 140], ['h', 70], ['v', 930], ['h', 560], ['v', 1120], ['h', 960], ['v', 1600], ['v', 1800]];
  // Block alphabet after Vilmos Huszár's 1917 De Stijl masthead: letters built from separate bars on a module grid.
  const DS_GLYPH = {
    D: [5, [[0, 0, 1, 7], [1, 0, 3, 1], [1, 6, 3, 1], [4, 1, 1, 5]]],
    E: [5, [[0, 0, 1, 7], [1, 0, 4, 1], [1, 3, 3, 1], [1, 6, 4, 1]]],
    S: [5, [[0, 0, 5, 1], [0, 1, 1, 2], [0, 3, 5, 1], [4, 4, 1, 2], [0, 6, 5, 1]]],
    T: [5, [[0, 0, 5, 1], [2, 1, 1, 6]]],
    I: [1, [[0, 0, 1, 7]]],
    J: [4, [[3, 0, 1, 6], [0, 6, 4, 1], [0, 4, 1, 2]]],
    L: [4, [[0, 0, 1, 7], [1, 6, 3, 1]]],
  };

  function dsGeo(t) {
    const G = {};
    for (const k in DS_L) {
      const L = DS_L[k];
      G[k] = kf(t, [[L.mv, L.p[0]], [L.mv + 0.24, L.p[1], E.ioX], [L.fm, L.p[1]], [L.fm + 0.4, L.p[2], E.ioX]]);
    }
    return G;
  }
  function dsBar(c, o, pos, a, b, w, col) {
    c.fillStyle = col;
    if (o === 'h') c.fillRect(Math.min(a, b) - w / 2, pos - w / 2, Math.abs(b - a) + w, w);
    else c.fillRect(pos - w / 2, Math.min(a, b) - w / 2, w, Math.abs(b - a) + w);
  }
  // Masthead block rectangles (sorted left to right so the traffic sweeps in reading order).
  function dsMasthead() {
    const m = 26, gapL = 1.4, gapW = 3.4, rects = [];
    let x = 0;
    'DE STIJL'.split('').forEach(ch => {
      if (ch === ' ') { x += gapW - gapL; return; }
      const [w, bars] = DS_GLYPH[ch];
      bars.forEach(([bx, by, bw, bh]) => rects.push([x + bx, by, bw, bh]));
      x += w + gapL;
    });
    const total = (x - gapL) * m, x0 = Math.round((1260 - total) / 2), y0 = 488;
    return rects.map(([bx, by, bw, bh]) => [x0 + bx * m + 4, y0 + by * m + 4, bw * m - 8, bh * m - 8]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  }

  MG.film({
    id: 'destijl', dur: 10, poster: 9.4,
    fonts: [['500 30px Jost', 'NEOPLASTICISM · 1917'], ['400 22px Jost', 'MONDRIAN']],
    meta: {
      family: 'A', name: 'De Stijl', sub: 'Neoplasticism in Motion', era: '1917 —',
      origin: 'Founded in Leiden in 1917 around Theo van Doesburg’s magazine De Stijl, with Piet Mondrian, Vilmos Huszár, Bart van der Leck and Gerrit Rietveld. Mondrian’s Neoplasticism reduced painting to horizontal and vertical black lines, the three primaries and white, held in asymmetric balance; in New York his black lines dissolved into the pulsing yellow grid of Broadway Boogie Woogie.',
      works: 'Composition with Red, Blue and Yellow (Mondrian, 1930) · Broadway Boogie Woogie (Mondrian, 1942–43) · Red and Blue Chair (Rietveld, c. 1918–23) · De Stijl magazine masthead (Vilmos Huszár, 1917) · Counter-Composition V (van Doesburg, 1924) · Rietveld Schröder House (Utrecht, 1924)',
      tech: ['Orthogonal line draw-on', 'Cells bound to live grid lines', 'Asymmetric rebalance', 'Boogie-Woogie block traffic'],
      accent: '#cc2a1e',
      motionDNA: 'Strictly horizontal and vertical: lines shoot across like pulled tape and stop dead, colour planes snap into their cells, then the whole grid slides to a new balance; in the boogie section small squares hop along the lines on the 16ths.',
      visualDNA: 'Off-white ground, heavy black lines of one weight, flat red, blue and yellow planes with a hint of brushed paint, never a diagonal, never a gradient; blocky constructed letters with gaps between the bars.',
      transitions: 'Line draw-on, plane snap-fill, grid rebalance, black-to-yellow recolour, blocks assemble into type',
      implementation: ['After Effects (shape layers)', 'SVG / CSS grid', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const W = 1920, H = 1080, r = rng(1917);
      // brushed oil paint: short orthogonal strokes, light and dark
      const tex = offscreen(W, H), g = tex.getContext('2d');
      for (let k = 0; k < 5000; k++) {
        const x = r() * W, y = r() * H, l = 20 + r() * 90, hz = r() < 0.6;
        g.strokeStyle = r() < 0.55 ? `rgba(60,50,30,${0.006 + r() * 0.014})` : `rgba(255,255,250,${0.01 + r() * 0.025})`;
        g.lineWidth = 1 + r() * 3;
        g.beginPath(); g.moveTo(x, y); hz ? g.lineTo(x + l, y + (r() - 0.5) * 2) : g.lineTo(x + (r() - 0.5) * 2, y + l); g.stroke();
      }
      for (let k = 0; k < 2200; k++) { g.fillStyle = `rgba(80,70,50,${0.04 + r() * 0.05})`; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
      // charcoal under-drawing: searching lines around the first composition
      const sk = offscreen(W, H), s = sk.getContext('2d');
      s.strokeStyle = 'rgba(40,38,34,1)'; s.lineCap = 'round';
      const sketch = (o, pos, a, b) => {
        for (let pass = 0; pass < 2; pass++) {
          s.lineWidth = 1.2 + r() * 1.2; s.globalAlpha = 0.35 + r() * 0.3; s.beginPath();
          const n = 30, j = () => (r() - 0.5) * 3;
          for (let i = 0; i <= n; i++) { const u = lerp(a, b, i / n); o === 'h' ? (i ? s.lineTo(u, pos + j() + pass * 3) : s.moveTo(u, pos + j())) : (i ? s.lineTo(pos + j() + pass * 3, u) : s.moveTo(pos + j(), u)); }
          s.stroke();
        }
      };
      sketch('h', 340, 0, 1920); sketch('h', 352, 300, 1400); sketch('v', 640, 0, 1080); sketch('v', 610, 200, 900);
      sketch('h', 820, 0, 1920); sketch('v', 1480, 340, 1080); sketch('v', 1430, 500, 1000); sketch('v', 300, 820, 1080);
      sketch('h', 600, 1480, 1920); sketch('h', 650, 1400, 1900); sketch('h', 170, 0, 640); sketch('v', 960, 100, 700);
      // traffic: small squares riding the lanes of the yellow grid
      const lanes = [['h', 420, 0, 1920], ['v', 560, 0, 1080], ['h', 780, 0, 1920], ['v', 1360, 420, 1080], ['h', 640, 1360, 1920], ['v', 250, 780, 1080],
        ...DS_X.map(([o, p]) => [o, p, 0, o === 'h' ? 1920 : 1080])];
      const cols = [DS.red, DS.blue, DS.grey, DS.red, DS.blue];
      const sq = Array.from({ length: 40 }, (_, i) => {
        const L = lanes[i % lanes.length];
        return { L, u0: r() * (L[3] - L[2]), dir: r() < 0.5 ? -1 : 1, hop: 36 + ((r() * 3) | 0) * 18, every: r() < 0.3 ? 2 : 1, col: cols[i % cols.length], pop: DS_T.hop - 0.1 + (i % 8) * 0.0625 };
      });
      return { tex, sk, sq, mast: dsMasthead() };
    },
    draw(c, t, W, H, st) {
      const G = dsGeo(t);
      c.fillStyle = DS.ground; c.fillRect(0, 0, W, H);
      const boo = t >= DS_T.boogie && t < DS_T.lock;
      const lockPunch = t > DS_T.lock ? 0.012 * Math.exp(-(t - DS_T.lock) * 7) : 0;
      const zs = lerp(1.07, 1, E.ioC(seg(t, 0, 2.7))) + lockPunch;
      c.save(); c.translate(W / 2, H / 2); c.scale(zs, zs); c.translate(-W / 2, -H / 2);

      // charcoal under-drawing, rubbed out as the paint goes on
      const ska = seg(t, 0.02, 0.28) * (1 - seg(t, 2.3, 3.4));
      if (ska > 0) { c.globalAlpha = ska * 0.55; c.drawImage(st.sk, 0, 0); c.globalAlpha = 1; }

      // ----- colour planes: under the lines as cells, over them as boogie blocks -----
      const planes = front => DS_P.forEach((P, i) => {
        const fill = E.outQn(seg(t, P.at, P.at + 0.26));
        if (fill <= 0) return;
        let [x0, y0, x1, y1] = P.r(G);
        // contract to a block for the boogie section, re-expand at the lock
        const b = t < DS_T.lock ? E.ioX(seg(t, DS_T.boogie + i * 0.07, DS_T.boogie + 0.36 + i * 0.07)) : 1 - E.outQn(seg(t, DS_T.lock, DS_T.lock + 0.42 + i * 0.05));
        if ((b >= 0.5 && t < DS_T.lock) !== front) return;
        if (b > 0) {
          const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, beat = Math.floor(Math.max(0, t - DS_T.boogie) / 0.25);
          const pulse = boo && t > 4.9 ? (beat % 2 ? 1.06 : 1) : 1, bw = P.blk[0] * pulse / 2, bh = P.blk[1] * pulse / 2;
          x0 = lerp(x0, cx - bw, b); x1 = lerp(x1, cx + bw, b); y0 = lerp(y0, cy - bh, b); y1 = lerp(y1, cy + bh, b);
        }
        // the wipe enters from the cell's own edge
        let wx0 = x0, wx1 = x1, wy0 = y0, wy1 = y1;
        if (P.dir === 'd') wy1 = lerp(y0, y1, fill); else if (P.dir === 'u') wy0 = lerp(y1, y0, fill);
        else if (P.dir === 'r') wx1 = lerp(x0, x1, fill); else wx0 = lerp(x1, x0, fill);
        c.fillStyle = b > 0.5 && t < DS_T.lock ? P.boo : P.col;
        c.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0);
        // blinking inner square, as in Broadway Boogie Woogie
        if (b > 0.8 && boo && t > 4.95 && (Math.floor((t - 4.95) / 0.25) + i) % 2 === 0) {
          const s = Math.min(x1 - x0, y1 - y0) * 0.42;
          c.fillStyle = P.inner; c.fillRect((x0 + x1) / 2 - s / 2, (y0 + y1) / 2 - s / 2, s, s);
        }
      });
      planes(false);

      // ----- lines -----
      const rc = boo ? E.outQ(seg(t, DS_T.boogie, DS_T.boogie + 0.3)) : 0;
      const lw = boo ? lerp(DS.lw, 18, rc) : DS.lw;
      for (const k in DS_L) {
        const L = DS_L[k], [d0, d1, dir] = L.draw, p = E.outQt(seg(t, d0, d1));
        if (p <= 0) continue;
        const [a, b] = DS_SPAN[k](G), pos = G[k];
        const s0 = dir > 0 ? a : lerp(b, a, p), s1 = dir > 0 ? lerp(a, b, p) : b;
        dsBar(c, L.o, pos, s0, s1, lw, DS.blk);
        if (rc > 0) { const m = (a + b) / 2, h = (b - a) / 2 * rc + lw; dsBar(c, L.o, pos, m - h, m + h, lw + 0.5, DS.yel); }
      }
      // Boogie-Woogie lines, thin and yellow
      if (t > 4.6 && t < 7.4) DS_X.forEach(([o, pos], i) => {
        const d0 = 4.62 + i * 0.125, p = E.outQt(seg(t, d0, d0 + 0.22)), q = E.inQ(seg(t, 6.85 + i * 0.04, 7.15 + i * 0.04));
        if (p <= 0 || q >= 1) return;
        const len = o === 'h' ? W : H, fwd = i % 2 === 0;
        const s0 = fwd ? len * q : len * (1 - p), s1 = fwd ? len * p : len * (1 - q);
        dsBar(c, o, pos, s0, s1, 16, DS.yel);
      });

      planes(true);

      // ----- traffic, then the masthead -----
      const dt = 0.125;
      st.sq.forEach((S, i) => {
        if (t < S.pop) return;
        const lanePos = tt => {
          const n = Math.max(0, tt - DS_T.hop) / (dt * S.every), k = Math.floor(n), f = n - k;
          const steps = k + E.outQn(clamp(f / 0.45));
          const len = S.L[3] - S.L[2];
          const u = (((S.u0 + S.dir * S.hop * steps) % len) + len) % len + S.L[2];
          return S.L[0] === 'h' ? [u, S.L[1]] : [S.L[1], u];
        };
        const popS = E.outB(seg(t, S.pop, S.pop + 0.12), 3);
        let sz = 18 * popS;
        if (i < st.mast.length) {
          const tg = DS_T.gather + i * 0.018, u = E.ioX(seg(t, tg, tg + 0.55));
          const [px, py] = lanePos(Math.min(t, tg));
          const [rx, ry, rw, rh] = st.mast[i];
          const cx = lerp(px, rx + rw / 2, u), cy = lerp(py, ry + rh / 2, u), w = lerp(sz, rw, u), h = lerp(sz, rh, u);
          c.fillStyle = u > 0.62 ? DS.blk : S.col;
          c.fillRect(cx - w / 2, cy - h / 2, w, h);
        } else {
          const out = 1 - E.inQ(seg(t, DS_T.gather + (i % 6) * 0.03, DS_T.gather + 0.25 + (i % 6) * 0.03));
          if (out <= 0) return;
          const [px, py] = lanePos(t);
          sz *= out; c.fillStyle = S.col; c.fillRect(px - sz / 2, py - sz / 2, sz, sz);
        }
      });

      // ----- captions, set like a magazine cover -----
      const cap = (s, x, y, t0, o) => {
        const u = E.outQn(seg(t, t0, t0 + 0.45)); if (u <= 0) return;
        c.save(); c.beginPath(); c.rect(x - 4, y - 60, 1200 * u, 90); c.clip();
        text(c, s, x, y, { font: DS_F, color: DS.blk, ...o }); c.restore();
      };
      const mx = st.mast[0][0];
      cap('THE MOTION STYLE ATLAS  ·  FAMILY A', mx, 412, DS_T.cap, { size: 22, weight: 500, ls: 7 });
      cap('NEOPLASTICISM  ·  1917 —', mx, 752, DS_T.cap + 0.15, { size: 34, weight: 500, ls: 11 });
      cap('MONDRIAN  ·  VAN DOESBURG  ·  HUSZÁR  ·  RIETVELD', mx, 800, DS_T.cap + 0.3, { size: 21, weight: 400, ls: 6 });
      c.restore();

      c.drawImage(st.tex, 0, 0);
      grain(c, W, H, t, 0.045, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.95;
      // each line is laid like pulled tape, landing on a piano note
      Object.keys(DS_L).forEach((k, i) => {
        const [d0, d1] = DS_L[k].draw;
        A.noise(d0, { type: 'bandpass', f: 1800, f2: 4200, q: 1.4, dur: d1 - d0, g: 0.05, swell: 0.7, pan: (i % 2 ? 0.3 : -0.3) });
        A.noise(d1 - 0.01, { type: 'highpass', f: 2500, dur: 0.03, g: 0.08 });
        piano(A, d1, [60, 67, 64, 69, 74, 79, 72][i], 0.12, 2.2, { pan: (i % 2 ? 0.25 : -0.25) });
      });
      piano(A, 0.72, 36, 0.1, 3.2, { bright: 0.25 });
      // planes: a chord per colour
      [[2.5, [48, 55, 64, 67]], [2.75, [45, 52, 60, 64]], [3.0, [41, 48, 57, 64]], [3.25, [43, 50, 59, 62]]].forEach(([t, ch], i) => {
        ch.forEach((m, j) => piano(A, t + j * 0.012, m, j ? 0.06 : 0.09, 1.8));
        A.osc(t, { f: 90 - i * 6, f2: 50, glide: 0.08, dur: 0.18, g: 0.12 });
      });
      // rebalance: a walking bass under each slide
      [[3.5, 36], [3.75, 40], [4.0, 43], [4.25, 45]].forEach(([t, m]) => {
        piano(A, t, m, 0.14, 0.6, { bright: 0.3 });
        A.noise(t, { type: 'bandpass', f: 900, f2: 300, q: 1, dur: 0.24, g: 0.05 });
        A.noise(t + 0.24, { type: 'bandpass', f: 1400, q: 8, dur: 0.03, g: 0.06 });
      });
      // Boogie-Woogie: rolling left hand in 8ths, right-hand stabs with crushed grace notes
      const LH = [36, 40, 43, 45, 46, 45, 43, 40];
      for (let k = 0; k < 8; k++) { const t = DS_T.boogie + k * 0.25; piano(A, t, LH[k], 0.13, 0.5, { bright: 0.35 }); piano(A, t, LH[k] + 12, 0.05, 0.4); }
      [[4.5, [64, 67, 70]], [5.0, [64, 67, 70]], [5.375, [64, 67, 70]], [5.75, [65, 69, 72]], [6.0, [64, 67, 70]], [6.25, [67, 70, 74]]].forEach(([t, ch]) => {
        piano(A, t - 0.03, ch[0] - 1, 0.04, 0.12);
        ch.forEach(m => piano(A, t, m + 12, 0.055, 0.5, { bright: 0.6 }));
      });
      for (let k = 0; k < 13; k++) { const t = DS_T.hop + k * 0.125; A.hat(t, k % 2 ? 0.02 : 0.035, false, { pan: k % 2 ? 0.35 : -0.35 }); }
      [5.0, 6.0].forEach(t => A.snare(t, 0.07, { f: 2400, rev: 0.2 }));
      [4.5, 5.5].forEach(t => A.kick(t, 0.25, { f: 110, f2: 45 }));
      // traffic gathers: a glissando, one note per landing block
      A.whoosh(DS_T.gather, 0.6, { f1: 400, f2: 3000, g: 0.06 });
      const scale = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98, 100, 103, 105, 108];
      for (let i = 0; i < 21; i++) { const t = DS_T.gather + i * 0.018 + 0.55; A.pluck(t, midi(scale[i] - 12), { dur: 0.5, g: 0.07, bright: 0.7, pan: (i / 20 - 0.5) * 0.8 }); }
      // the lock: everything back to black, C6/9 rings out
      const L = DS_T.lock;
      A.kick(L, 0.4, { f: 90, f2: 40 });
      [36, 48, 55, 62, 64, 69, 72, 76].forEach((m, j) => piano(A, L + j * 0.008, m, j < 2 ? 0.12 : 0.07, 3.6, { rev: 0.5 }));
      A.noise(L, { type: 'highpass', f: 6000, dur: 0.6, g: 0.03, rev: 0.4 });
      piano(A, DS_T.cap, 84, 0.04, 1.6, { rev: 0.6 });
      piano(A, DS_T.cap + 0.3, 79, 0.035, 1.6, { rev: 0.6 });
      piano(A, 9.0, 91, 0.025, 1.0, { rev: 0.6 });
    },
  });

  /* =====================================================================
     RISOGRAPH — a sheet feeds into the duplicator and is printed one drum
     at a time (yellow, fluorescent pink, blue) so the overprints mix by
     multiply; the finished print comes alive on twos, every frame a fresh
     pull with its own grain and registration; a registration storm tears
     the plates apart, the sheet jams and ejects, and a new sheet prints
     the title
     ===================================================================== */
  const RS = { paper: '#f3eee1', tray: '#28272c', pink: '#ff48b0', blue: '#0078bf', yel: '#ffe800' };
  const RS_INK = [RS.yel, RS.pink, RS.blue];
  const RS_HZ = 640, RS_SUN = [1290, 560, 230];
  const RS_T = { pass: [[0.55, 1.4], [1.55, 2.4], [2.55, 3.4]], live: 3.45, storm: 6.2, jam: 7.0, eject: 7.3, next: 7.45, pass2: [[7.85, 8.2], [8.1, 8.45], [8.35, 8.7]] };
  const RS_MONO = '"Space Mono", monospace', RS_DISP = '"Bricolage Grotesque", "Arial Black", sans-serif';

  // Rotated halftone screen; rf(x, y) gives the dot radius (black, for later colouring).
  function rsDots(g, x0, y0, w, h, sp, ang, rf) {
    const ca = Math.cos(ang), sa = Math.sin(ang), cx = x0 + w / 2, cy = y0 + h / 2, R = Math.hypot(w, h) / 2 + sp;
    g.beginPath();
    for (let v = -R; v <= R; v += sp) for (let u = -R; u <= R; u += sp) {
      const x = cx + u * ca - v * sa, y = cy + u * sa + v * ca;
      if (x < x0 - sp || x > x0 + w + sp || y < y0 - sp || y > y0 + h + sp) continue;
      const r = rf(x, y); if (r < 0.5) continue;
      g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU);
    }
    g.fill();
  }
  const rsMtn = g => {
    g.beginPath(); g.moveTo(0, RS_HZ);
    [[0, 520], [110, 440], [210, 490], [350, 372], [470, 470], [560, 430], [700, 548], [800, RS_HZ]].forEach(([x, y]) => g.lineTo(x, y));
    g.closePath();
    g.moveTo(1560, RS_HZ); [[1680, 556], [1760, 584], [1860, 498], [1920, 520], [1920, RS_HZ]].forEach(([x, y]) => g.lineTo(x, y)); g.closePath();
  };
  const rsDune = g => { g.beginPath(); g.moveTo(0, 850); g.quadraticCurveTo(420, 800, 860, 1080); g.lineTo(0, 1080); g.closePath(); };
  const rsBoat = s => ({ x: 600 + s * 36, y: RS_HZ + 120 + Math.sin(s * 3.1) * 4, a: Math.sin(s * 2.3) * 0.05 });
  function rsReg(g, lw = 2.5) {
    g.lineWidth = lw;
    [[56, 56], [1864, 56], [56, 1024], [1864, 1024]].forEach(([x, y]) => {
      g.beginPath(); g.arc(x, y, 15, 0, TAU); g.moveTo(x - 28, y); g.lineTo(x + 28, y); g.moveTo(x, y - 28); g.lineTo(x, y + 28); g.stroke();
    });
  }
  function rsBirds(g, s, x0, y0, n, fr) {
    g.lineWidth = 6; g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      const x = x0 + i * 120 + s * 70 + (i % 2) * 40, y = y0 + i * 26 + Math.sin(s * 2 + i) * 10 - (i % 3) * 30, up = (fr + i) % 2 ? -1 : 1, sz = 22 - i * 1.5;
      g.beginPath(); g.moveTo(x - sz, y - 6 * up); g.quadraticCurveTo(x - sz * 0.4, y - 10 * up, x, y + 4); g.quadraticCurveTo(x + sz * 0.4, y - 10 * up, x + sz, y - 6 * up); g.stroke();
    }
  }
  // halo > 0 strokes a wider outline (for knocking the sea out around the tree)
  function rsPalm(g, s, halo = 0) {
    const put = () => { if (halo) { g.lineWidth = halo; g.lineJoin = 'round'; g.stroke(); } g.fill(); };
    const sw = Math.sin(s * 1.6) * 0.06, tx = 330, ty = 560;
    g.beginPath(); g.moveTo(206, 890); g.quadraticCurveTo(250, 700, tx - 8, ty); g.lineTo(tx + 10, ty + 4); g.quadraticCurveTo(272, 700, 240, 892); g.closePath(); put();
    for (let k = 0; k < 7; k++) {
      const a = -PI / 2 + (k - 3) * 0.48 + sw * (1 + k * 0.1), L = 150 + (k % 2) * 40, droop = 60 + Math.abs(k - 3) * 18;
      const ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + droop * 0.6;
      const mx = tx + Math.cos(a) * L * 0.5, my = ty + Math.sin(a) * L * 0.5 - 30;
      const nx = -Math.sin(a) * 16, ny = Math.cos(a) * 16;
      g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(mx + nx, my + ny, ex, ey); g.quadraticCurveTo(mx - nx * 0.4, my - ny * 0.4 + 18, tx, ty + 6); put();
    }
  }

  MG.film({
    id: 'risograph', dur: 10, poster: 9.4,
    fonts: [['800 200px "Bricolage Grotesque"', 'RISOGRAPH'], ['700 40px "Space Mono"', 'ANIMATION'], ['400 20px "Space Mono"', 'FLUO PINK']],
    meta: {
      family: 'A', name: 'Risograph Animation', sub: 'Stencil-Duplicator Print Look', era: '1986 — · revival 2010s —',
      origin: 'Riso Kagaku of Tokyo released its first Risograph digital duplicator in 1986: a thermal master stencil is burned and wrapped on an ink drum, and each colour is a separate pass of soy-based ink. Built for schools and offices, the machines were adopted by zine makers and art-book presses in the 2010s, and riso-printed flipbooks and frame-by-frame print animations, often faked digitally, turned its grain, fluorescent pink and loose registration into a motion look.',
      works: 'RISOGRAPH 007 (Riso Kagaku, 1986) · Print Gocco (Riso Kagaku, 1977) · Nieves zines (Zurich, Benjamin Sommerhalder) · Hato Press (London) · Colorama (Berlin) · Risotto Studio (Glasgow)',
      tech: ['One offscreen plate per ink, multiplied', 'Per-frame misregistration', 'Stochastic ink coverage mask', 'Rotated halftone screens'],
      accent: '#ff48b0',
      motionDNA: 'Animated on twos, and every drawing is a separate pull: the plates shift a few pixels and the grain changes each frame, so even a still image boils; colour arrives one drum pass at a time.',
      visualDNA: 'Cream uncoated paper, fluorescent pink, yellow and blue soy inks overprinting into orange, purple and green, grainy uneven solids, coarse halftone gradients, white knockouts and registration marks.',
      transitions: 'Drum pass wipe, overprint build-up, misregistration storm, paper jam smear, sheet eject and feed',
      implementation: ['Photoshop / Procreate riso brushes', 'Real Risograph print-and-scan', 'Canvas 2D (multiply compositing)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const W = 1920, H = 1080, r = rng(1986);
      // uncoated cream stock with fibres and stray ink specks
      const paper = offscreen(W, H), p = paper.getContext('2d');
      p.fillStyle = RS.paper; p.fillRect(0, 0, W, H);
      for (let k = 0; k < 16000; k++) { p.fillStyle = r() < 0.5 ? `rgba(120,100,70,${0.04 + r() * 0.06})` : 'rgba(255,255,250,0.35)'; p.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 1.5); }
      for (let k = 0; k < 700; k++) { const x = r() * W, y = r() * H, a = r() * TAU, l = 6 + r() * 22; p.strokeStyle = `rgba(110,90,60,${0.05 + r() * 0.06})`; p.lineWidth = 0.8; p.beginPath(); p.moveTo(x, y); p.quadraticCurveTo(x + Math.cos(a + 1) * l * 0.5, y + Math.sin(a + 1) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); p.stroke(); }
      for (let k = 0; k < 140; k++) { p.fillStyle = [RS.pink, RS.blue, '#d9c900'][k % 3]; p.globalAlpha = 0.25 + r() * 0.4; p.beginPath(); p.arc(r() * W, r() * H, 0.8 + r() * 1.8, 0, TAU); p.fill(); }
      p.globalAlpha = 1;
      const pv = p.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.7); pv.addColorStop(0, 'rgba(160,130,90,0)'); pv.addColorStop(1, 'rgba(160,130,90,0.12)');
      p.fillStyle = pv; p.fillRect(0, 0, W, H);
      // ink coverage masks: uneven density, roller banding and speckle holes
      const mask = [0, 1, 2].map(li => {
        const MW = 2048, MH = 1152, cv = offscreen(MW, MH), g = cv.getContext('2d'), id = g.createImageData(MW, MH), d = id.data, rr = rng(400 + li * 17);
        const LW = 70, LH = 40, lat = new Float32Array(LW * LH); for (let i = 0; i < lat.length; i++) lat[i] = rr();
        const lf = (x, y) => { const xi = x | 0, yi = y | 0, fx = x - xi, fy = y - yi, i = yi * LW + xi; const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return lerp(lerp(lat[i], lat[i + 1], u), lerp(lat[i + LW], lat[i + LW + 1], u), v); };
        const row = new Float32Array(MH); let rv = 0; for (let y = 0; y < MH; y++) { rv = rv * 0.93 + (rr() - 0.5) * 0.035; row[y] = rv; }
        for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
          let a = 0.8 + 0.2 * lf(x / 34, y / 34) + row[y];
          const q = rr();
          if (q < 0.13) a -= 0.18 + q * 3.2; else if (q > 0.997) a = 0.05;
          d[(y * MW + x) * 4 + 3] = clamp(a) * 255;
        }
        g.putImageData(id, 0, 0);
        return cv;
      });
      // halftone sprites, all drawn in black and coloured at print time
      const skyP = offscreen(W, RS_HZ + 8), sg = skyP.getContext('2d');
      rsDots(sg, 0, 0, W, RS_HZ + 8, 12, 0.26, (x, y) => 6.6 * Math.pow(clamp((y - 40) / (RS_HZ - 40)), 1.35));
      const sunY = offscreen(760, 760), yg = sunY.getContext('2d');
      yg.beginPath(); yg.arc(380, 380, RS_SUN[2], 0, TAU); yg.fill();
      rsDots(yg, 0, 0, 760, 760, 11, 0.79, (x, y) => { const d = Math.hypot(x - 380, y - 380); return d < RS_SUN[2] ? 0 : 5.6 * clamp(1 - (d - RS_SUN[2]) / 140); });
      const cloudY = offscreen(W + 400, 420), cg = cloudY.getContext('2d');
      const blobs = [[420, 250, 300, 34], [560, 214, 180, 26], [1640, 150, 260, 30], [1760, 120, 150, 22], [980, 330, 220, 22], [2140, 260, 260, 28]];
      rsDots(cg, 0, 0, W + 400, 420, 10, 0.79, (x, y) => { let v = 0; blobs.forEach(([bx, by, rx, ry]) => { v = Math.max(v, 1 - Math.hypot((x - bx) / rx, (y - by) / ry)); }); return v > 0 ? 2 + 4.2 * Math.min(1, v * 2.4) : 0; });
      const mtnB = offscreen(W, RS_HZ + 4), mg = mtnB.getContext('2d');
      mg.save(); rsMtn(mg); mg.clip();
      rsDots(mg, 0, 300, W, RS_HZ - 296, 9, 1.31, (x, y) => 1 + 3.6 * clamp((y - 380) / 260));
      mg.restore();
      const duneP = offscreen(W, H), dg = duneP.getContext('2d');
      dg.save(); rsDune(dg); dg.clip(); rsDots(dg, 0, 780, 900, 300, 11, 0.26, (x, y) => 1.2 + 4.6 * clamp((y - 840) / 220 + (x < 300 ? 0 : -0.15))); dg.restore();
      const dotsU = offscreen(W, H), ug = dotsU.getContext('2d');
      rsDots(ug, 0, 0, W, H, 9, 0.79, () => 3.3);
      return { paper, mask, skyP, sunY, cloudY, mtnB, duneP, dotsU, L: offscreen(W, H), T: offscreen(W, H) };
    },
    draw(c, t, W, H, st) {
      const fr = Math.floor(t * 12), tq = fr / 12;
      c.fillStyle = RS.tray; c.fillRect(0, 0, W, H);
      // tray: worn steel, a feed guide
      c.fillStyle = 'rgba(255,255,255,0.04)'; for (let k = 0; k < 12; k++) c.fillRect(0, 90 * k + 40, W, 2);
      const live = t >= RS_T.live, s = live ? tq - RS_T.live : 0;
      // registration jitter: every frame on twos is a new pull
      const storm = kf(t, [[RS_T.storm, 0], [6.85, 34, E.inQ], [7.25, 110, E.inQ]]);
      const reg = (li, sheet) => {
        if (!live && sheet === 0) return [[0, 3, -2][li], [0, -2, 3][li], 0];
        const f = sheet === 0 ? fr : fr + 50;
        let x = [0, 4, -3][li] + (hash(f * 3.7 + li * 11) - 0.5) * 5, y = [0, -3, 3][li] + (hash(f * 5.3 + li * 7) - 0.5) * 4, a = 0;
        if (sheet === 0 && storm > 0) { x += storm * vnoise(tq * 2.4, 10 + li * 3) * [0.7, 1.2, -1.1][li]; y += storm * 0.45 * vnoise(tq * 2.4, 30 + li * 3); a = storm * 0.00045 * vnoise(tq * 2, 50 + li); }
        return [x, y, a];
      };
      const ink = (sheet, li, wipe, draw) => {
        const g = st.L.getContext('2d');
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
        g.fillStyle = '#000'; g.strokeStyle = '#000';
        draw(g);
        g.globalCompositeOperation = 'source-in'; g.fillStyle = RS_INK[li]; g.fillRect(0, 0, W, H);
        const f = live || sheet ? fr : 0;
        g.globalCompositeOperation = 'destination-in'; g.drawImage(st.mask[li], -((hash(f * 1.3 + li) * 127) | 0), -((hash(f * 2.9 + li) * 71) | 0));
        if (wipe < 1) { const e = lerp(-60, W + 60, wipe); g.globalCompositeOperation = 'destination-out'; g.fillRect(e, 0, W - e + 60, H); }
        const [ox, oy, oa] = reg(li, sheet);
        c.save(); c.globalCompositeOperation = 'multiply';
        c.translate(W / 2 + ox, H / 2 + oy); c.rotate(oa); c.translate(-W / 2, -H / 2);
        c.drawImage(st.L, 0, 0);
        // paper jam: the drum slips and smears the plate along the feed
        const jam = sheet === 0 ? seg(t, RS_T.jam, RS_T.eject) : 0;
        if (jam > 0) [1, 2, 3].forEach(k => { c.globalAlpha = 0.32 / k; c.drawImage(st.L, k * 40 * jam * (li === 1 ? 1.4 : 1), 0); });
        c.restore();
      };
      const passOf = (P, k) => seg(t, P[k][0], P[k][1]);
      const roller = (P, sheetX) => P.forEach(([a, b]) => {
        if (t < a || t > b) return;
        const e = lerp(-60, W + 60, seg(t, a, b)) + sheetX;
        const gr = c.createLinearGradient(e - 140, 0, e + 30, 0);
        gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.8, 'rgba(40,30,20,0.13)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = gr; c.fillRect(e - 140, 0, 170, H);
      });
      const sheetAt = (x, y, body) => {
        c.save(); c.translate(x, y);
        c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(14, 18, W, H);
        c.beginPath(); c.rect(0, 0, W, H); c.clip();
        c.drawImage(st.paper, 0, 0);
        body();
        c.restore();
      };

      // ----- sheet one: the seaside print -----
      if (t < RS_T.eject + 0.35) {
        const sx = t < RS_T.eject ? lerp(W + 40, 0, E.outQt(seg(t, 0, 0.45))) : -W * E.inQ(seg(t, RS_T.eject, RS_T.eject + 0.32));
        const shake = storm > 0 ? [vnoise(t * 30, 4) * storm * 0.08, vnoise(t * 30, 9) * storm * 0.06] : [0, 0];
        const P = RS_T.pass, sun = [RS_SUN[0], RS_SUN[1] + 30 * clamp(s / 5.5)], b = rsBoat(s);
        const boatPath = g => { g.save(); g.translate(b.x, b.y); g.rotate(b.a); g.beginPath(); g.moveTo(-112, 0); g.lineTo(112, 0); g.lineTo(80, 36); g.lineTo(-80, 36); g.closePath(); g.restore(); };
        sheetAt(sx + shake[0], shake[1], () => {
          ink(0, 0, passOf(P, 0), g => {
            g.save(); g.beginPath(); g.rect(0, 0, W, RS_HZ); g.clip();
            g.drawImage(st.sunY, sun[0] - 380, sun[1] - 380);
            // retro sunset: bars knocked out of the lower half
            g.globalCompositeOperation = 'destination-out';
            for (let k = 0; k < 6; k++) { const y = sun[1] + 10 + k * 26 - ((s * 18) % 26); g.fillRect(sun[0] - 260, y, 520, 4 + k * 2.4); }
            g.restore();
            g.drawImage(st.cloudY, -280 + s * 16, 0);
            // the sun's path on the water
            for (let k = 0; k < 11; k++) { const y = RS_HZ + 16 + k * 30, w = (300 - k * 20) * (0.75 + 0.25 * Math.sin(s * 4 + k * 1.3)), x = sun[0] + Math.sin(s * 2.4 + k * 1.7) * 16; g.fillRect(x - w / 2, y, w, 8 + k * 0.7); }
            rsDune(g); g.fill();
            g.save(); g.translate(b.x, b.y); g.rotate(b.a); g.beginPath(); g.moveTo(6, -196); g.lineTo(6, -12); g.lineTo(122, -16); g.closePath(); g.fill(); g.restore();
            boatPath(g); g.fill();
            rsReg(g);
          });
          ink(0, 1, passOf(P, 1), g => {
            g.drawImage(st.skyP, 0, 0);
            rsMtn(g); g.fill();
            g.drawImage(st.duneP, 0, 0);
            rsPalm(g, s);
            g.save(); g.translate(b.x, b.y); g.rotate(b.a); g.beginPath(); g.moveTo(-6, -170); g.lineTo(-6, -12); g.lineTo(-96, -12); g.closePath(); g.fill(); g.restore();
            boatPath(g); g.fill();
            rsReg(g);
          });
          ink(0, 2, passOf(P, 2), g => {
            g.drawImage(st.mtnB, 0, 0);
            g.fillRect(0, RS_HZ, W, H - RS_HZ);
            g.globalCompositeOperation = 'destination-out';
            for (let k = 0; k < 15; k++) {
              const y = RS_HZ + 8 + k * (13 + k * 2.4); if (y > H) break;
              g.lineWidth = 2 + k * 0.5; g.beginPath();
              for (let x = -20; x <= W + 20; x += 16) { const yy = y + Math.sin(x / (50 + k * 9) + s * (2.2 + k * 0.12) + k * 1.9) * (2 + k * 0.55); x < 0 ? g.moveTo(x, yy) : g.lineTo(x, yy); }
              g.stroke();
            }
            for (let k = 0; k < 11; k++) { const y = RS_HZ + 14 + k * 30, w = (330 - k * 20) * (0.75 + 0.25 * Math.sin(s * 4 + k * 1.3)), x = sun[0] + Math.sin(s * 2.4 + k * 1.7) * 16; g.fillRect(x - w / 2, y - 2, w, 12 + k * 0.7); }
            g.save(); g.translate(b.x, b.y); g.rotate(b.a); g.beginPath(); g.moveTo(-130, -6); g.lineTo(130, -6); g.lineTo(92, 46); g.lineTo(-92, 46); g.closePath(); g.fill(); g.restore();
            rsDune(g); g.fill();
            rsPalm(g, s, 18);
            g.globalCompositeOperation = 'source-over';
            g.save(); g.translate(b.x, b.y); g.rotate(b.a); g.fillRect(-3, -206, 6, 206); g.restore();
            rsPalm(g, s);
            rsBirds(g, s, 260, 230, 5, live ? fr : 0);
            rsReg(g);
            text(g, 'RISO ZINE Nº 03', 110, 92, { font: RS_MONO, size: 22, weight: 700, color: '#000', ls: 4 });
            text(g, 'SUMMER PRINT RUN — 3 DRUMS', 1810, 92, { font: RS_MONO, size: 22, weight: 400, color: '#000', ls: 4, align: 'right' });
          });
          roller(P, 0);
        });
      }

      // ----- sheet two: the title pull -----
      if (t > RS_T.next) {
        const sx = lerp(W + 40, 0, E.outQt(seg(t, RS_T.next, RS_T.next + 0.38)));
        const P = RS_T.pass2, s2 = Math.max(0, tq - 7.8);
        let fs = 250; const g0 = st.L.getContext('2d'); g0.font = `800 ${fs}px ${RS_DISP}`; const tw = g0.measureText('RISOGRAPH').width; if (tw > 1500) fs *= 1500 / tw;
        const word = (g, dx, dy, mode) => { g.font = `800 ${fs}px ${RS_DISP}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; if (mode === 's') { g.lineWidth = 5; g.lineJoin = 'round'; g.strokeText('RISOGRAPH', 960 + dx, 590 + dy); } else g.fillText('RISOGRAPH', 960 + dx, 590 + dy); };
        const venn = [[230, 900], [300, 900], [265, 840]];
        sheetAt(sx, 0, () => {
          ink(1, 0, passOf(P, 0), g => {
            g.drawImage(st.sunY, 1500 - 380, 330 - 380);
            const T = st.T.getContext('2d'); T.setTransform(1, 0, 0, 1, 0, 0); T.globalCompositeOperation = 'source-over'; T.clearRect(0, 0, W, H);
            T.fillStyle = '#000'; word(T, 22, 20, 'f'); T.globalCompositeOperation = 'destination-in'; T.drawImage(st.dotsU, 0, 0);
            g.drawImage(st.T, 0, 0);
            g.beginPath(); g.arc(venn[0][0], venn[0][1], 58, 0, TAU); g.fill();
            rsReg(g);
          });
          ink(1, 1, passOf(P, 1), g => {
            word(g, 0, 0, 'f');
            g.beginPath(); g.arc(venn[1][0], venn[1][1], 58, 0, TAU); g.fill();
            text(g, 'YELLOW  ·  FLUO PINK  ·  BLUE', 380, 880, { font: RS_MONO, size: 20, weight: 700, color: '#000', ls: 3 });
            rsReg(g);
          });
          ink(1, 2, passOf(P, 2), g => {
            word(g, -9, -7, 's');
            g.beginPath(); g.arc(venn[2][0], venn[2][1], 58, 0, TAU); g.fill();
            text(g, 'A N I M A T I O N', 960, 690, { font: RS_MONO, size: 44, weight: 700, color: '#000', align: 'center', ls: 10 });
            text(g, 'THE MOTION STYLE ATLAS — FAMILY A', 110, 120, { font: RS_MONO, size: 22, weight: 700, color: '#000', ls: 4 });
            text(g, 'SOY INK ON UNCOATED STOCK', 380, 920, { font: RS_MONO, size: 20, weight: 400, color: '#000', ls: 3 });
            text(g, 'STENCIL DUPLICATOR  ·  1986 —', 1810, 1000, { font: RS_MONO, size: 22, weight: 700, color: '#000', ls: 4, align: 'right' });
            rsBirds(g, s2, 250, 220, 4, fr);
            rsReg(g);
            g.lineWidth = 2.5; g.beginPath(); g.moveTo(110, 760); g.lineTo(1810, 760); g.stroke();
          });
          roller(P, 0);
        });
      }
      grain(c, W, H, t, 0.05, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.9;
      const thunk = (t, g = 0.3) => { A.osc(t, { f: 120, f2: 55, glide: 0.06, dur: 0.14, g, type: 'triangle' }); A.noise(t, { type: 'bandpass', f: 1600, q: 1.5, dur: 0.035, g: g * 0.5 }); };
      // drum pass: a whirring ink drum with sheet-feed clatter
      const pass = (a, b, g = 1) => {
        thunk(a, 0.32 * g); thunk(b, 0.26 * g);
        A.osc(a, { type: 'sawtooth', f: 55, dur: b - a, g: 0.05 * g, lp: 260, hold: true, rel: 0.08 });
        for (let x = a; x < b; x += 1 / 16) A.noise(x, { type: 'bandpass', f: 900 + hash(x * 13) * 500, q: 2, dur: 0.035, g: 0.03 * g, pan: 0.2 });
        A.noise(a, { type: 'highpass', f: 3000, dur: b - a, g: 0.025 * g, hold: true, rel: 0.05 });
      };
      A.whoosh(0, 0.45, { f1: 2000, f2: 600, g: 0.1 }); thunk(0.45, 0.35);
      RS_T.pass.forEach(([a, b]) => pass(a, b));
      // lo-fi keys: a wobbly electric piano
      const keys = (t, ch, dur = 1.2, g = 0.03, wob = 4) => ch.forEach((m, i) => {
        A.osc(t + i * 0.01, { f: midi(m), dur, g, a: 0.01, vib: [5.5, wob], rev: 0.35, pan: (i - 1.5) * 0.15 });
        A.osc(t + i * 0.01, { type: 'triangle', f: midi(m) * 2, dur: dur * 0.4, g: g * 0.25, a: 0.005 });
      });
      const prog = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
      [0.55, 1.8, 3.05, 4.3, 5.55].forEach((t, i) => { keys(t, prog[i % 4], 1.3); A.osc(t, { f: midi(prog[i % 4][0] - 12), dur: 1.1, g: 0.1, lp: 300 }); });
      // a bell for every new ink
      [[1.4, 84], [2.4, 88], [3.4, 91]].forEach(([t, m]) => A.bell(t, midi(m), { g: 0.05, dur: 1.4 }));
      // the print comes alive: dusty beat
      const B = 0.625;
      for (let k = 0; k < 9; k++) {
        const t = RS_T.live + k * B * 0.5; if (t > RS_T.jam) break;
        if (k % 4 === 0) A.kick(t, 0.38, { f: 110, f2: 45 });
        if (k % 4 === 2) A.snare(t, 0.12, { f: 1600, rev: 0.25 });
        A.hat(t + 0.04, 0.03, false, { f: 6000, pan: k % 2 ? 0.3 : -0.3 });
      }
      for (let k = 0; k < 6; k++) A.noise(RS_T.live + k * 0.6, { type: 'highpass', f: 5000, dur: 0.6, g: 0.008, hold: true });
      [[3.6, 72], [3.9, 76], [4.2, 79], [4.85, 81], [5.2, 79], [5.5, 76], [5.8, 72]].forEach(([t, m]) => A.pluck(t, midi(m), { dur: 0.9, g: 0.09, bright: 0.5, rev: 0.3 }));
      // storm: plates drift apart, the keys warp, the drum grinds
      keys(6.2, [53, 57, 60, 64], 1.0, 0.03, 30);
      A.osc(6.2, { type: 'sawtooth', f: 110, f2: 40, glide: 1.1, dur: 1.1, g: 0.05, lp: 700 });
      A.noise(6.3, { type: 'bandpass', f: 400, f2: 2500, q: 3, dur: 0.95, g: 0.07, swell: 0.9 });
      for (let x = RS_T.jam; x < RS_T.eject; x += 1 / 14) A.noise(x, { type: 'bandpass', f: 600 + hash(x * 7) * 1600, q: 3, dur: 0.04, g: 0.08, crush: true });
      A.impact(RS_T.eject, 0.35, { rev: 0.2 });
      A.whoosh(RS_T.eject, 0.35, { f1: 3000, f2: 300, g: 0.12 });
      A.whoosh(RS_T.next, 0.38, { f1: 500, f2: 2500, g: 0.08 });
      thunk(RS_T.next + 0.38, 0.3);
      // title pull: three quick passes, three bells, the chord blooms
      RS_T.pass2.forEach(([a, b], i) => { pass(a, b, 0.7); A.bell(b, midi([84, 88, 91][i]), { g: 0.05, dur: 1.6 }); });
      keys(8.7, [53, 57, 60, 64, 67], 1.3, 0.035, 3);
      A.osc(8.7, { f: midi(41), dur: 1.3, g: 0.12, lp: 300 });
      A.kick(8.7, 0.3, { f: 100, f2: 42 });
      A.pluck(9.0, midi(84), { dur: 1, g: 0.05, bright: 0.5, rev: 0.5 });
    },
  });

  /* =====================================================================
     NEO-BRUTALISM — an unstyled HTML page loads in Times on white, then
     the stylesheet lands: hard black borders, offset shadows and loud flat
     cards slam onto an exposed 12-column grid; a cursor clicks, a modal
     asks ARE YOU SURE?, the layout reflows on the beat and alert windows
     spam the screen until a hard cut to the title slab
     ===================================================================== */
  const NB = { ink: '#0b0b0b', cream: '#fff4dc', yel: '#ffd23f', pink: '#ff90e8', lime: '#b4f461', blue: '#7aa2ff', orange: '#ff7a45', lilac: '#c4a7ff', mint: '#9ff0d8', white: '#ffffff' };
  const NB_BW = 6, NB_SH = 12;
  const NB_D = '"Archivo Black", "Arial Black", sans-serif', NB_G = '"Space Grotesk", Arial, sans-serif', NB_M = '"Space Mono", monospace', NB_RAW = 'Tinos, "Times New Roman", serif';
  const NB_T = { css: 1.0, click: 3.5, modal: 3.75, yes: 4.75, close: 4.85, reflow: [5.0, 5.5, 6.0], spam: 6.35, cut: 7.35, title: 7.45, word: 7.65, sticker: 7.9, btn: 8.05, type: 8.15, press: 8.75 };
  const nbX = i => 60 + i * 152; // 12 columns: 128 px + 24 px gutter
  const R = (c0, c1, y0, y1) => [nbX(c0), y0, nbX(c1) + 128 - nbX(c0), y1 - y0];
  // Cards with three grid layouts; the page reflows A → B → C → A on the beat.
  const NB_CARDS = [
    { k: 'hero', col: NB.pink, at: 1.25, from: [-1, 0], L: [R(0, 6, 160, 560), R(5, 11, 160, 560), R(3, 8, 720, 1020)] },
    { k: 'stats', col: NB.lime, at: 1.5, from: [0, -1], L: [R(7, 11, 160, 330), R(0, 4, 160, 330), R(0, 2, 720, 1020)] },
    { k: 'button', col: NB.yel, at: 1.625, from: [1, 0], L: [R(7, 9, 370, 540), R(0, 2, 370, 540), R(0, 5, 160, 330)] },
    { k: 'toggle', col: NB.white, at: 1.75, from: [1, 0], L: [R(10, 11, 370, 540), R(3, 4, 370, 540), R(6, 11, 160, 330)] },
    { k: 'c1', col: NB.blue, at: 2.0, from: [0, 1], L: [R(0, 2, 720, 1020), R(9, 11, 720, 1020), R(0, 3, 370, 540)], n: '01', lab: 'BORDER: 6PX SOLID' },
    { k: 'c2', col: NB.orange, at: 2.125, from: [0, 1], L: [R(3, 5, 720, 1020), R(0, 2, 720, 1020), R(4, 7, 370, 540)], n: '02', lab: 'SHADOW: 12PX 12PX 0' },
    { k: 'c3', col: NB.lilac, at: 2.25, from: [0, 1], L: [R(6, 8, 720, 1020), R(3, 5, 720, 1020), R(8, 11, 370, 540)], n: '03', lab: 'FONT: SYSTEM-UI' },
    { k: 'check', col: NB.white, at: 2.375, from: [0, 1], L: [R(9, 11, 720, 1020), R(6, 8, 720, 1020), R(9, 11, 720, 1020)] },
  ];
  const NB_SEQ = [0, 1, 2, 0];
  const NB_SLAMS = [NB_T.css, ...NB_CARDS.map(C => C.at + 0.12), 1.995, 2.62, NB_T.modal, ...NB_T.reflow.map(x => x + 0.16), NB_T.title + 0.1, NB_T.word, NB_T.btn + 0.1];

  // Hard-shadow box: the shadow stays put, the face sinks into it when pressed.
  function nbBox(c, x, y, w, h, fill, o = {}) {
    const sh = o.sh ?? NB_SH, bw = o.bw ?? NB_BW, p = o.press || 0;
    c.fillStyle = NB.ink; c.fillRect(x + sh, y + sh, w, h);
    const fx = x + sh * p, fy = y + sh * p;
    c.fillRect(fx - bw / 2, fy - bw / 2, w + bw, h + bw);
    c.fillStyle = fill; c.fillRect(fx + bw / 2, fy + bw / 2, w - bw, h - bw);
    return [fx, fy];
  }
  function nbTag(c, s, x, y) {
    c.font = `700 18px ${NB_M}`; const w = c.measureText(s).width + 20;
    c.fillStyle = NB.ink; c.fillRect(x - 3, y - 30, w, 30);
    text(c, s, x + 7, y - 9, { font: NB_M, size: 18, weight: 700, color: NB.white });
  }
  function nbFit(c, s, font, size, maxW) { c.font = `400 ${size}px ${font}`; const w = c.measureText(s).width; return w > maxW ? size * maxW / w : size; }
  function nbStar(c, x, y, r, n, rot, fill, lines, fs) {
    c.save(); c.translate(x, y); c.rotate(rot);
    const path = (ox, oy) => { c.beginPath(); for (let k = 0; k < n * 2; k++) { const a = k / (n * 2) * TAU, rr = k % 2 ? r * 0.8 : r; c.lineTo(ox + Math.cos(a) * rr, oy + Math.sin(a) * rr); } c.closePath(); };
    path(10, 10); c.fillStyle = NB.ink; c.fill();
    path(0, 0); c.fillStyle = fill; c.fill(); c.lineWidth = NB_BW; c.lineJoin = 'miter'; c.strokeStyle = NB.ink; c.stroke();
    lines.forEach((s, i) => text(c, s, 0, (i - (lines.length - 1) / 2) * fs * 1.0 + fs * 0.36, { font: NB_D, size: fs, align: 'center', color: NB.ink }));
    c.restore();
  }
  function nbCursor(c, x, y, down) {
    c.save(); c.translate(x, y); c.scale(down ? 1.5 : 1.65, down ? 1.5 : 1.65);
    c.beginPath(); [[0, 0], [0, 34], [9, 26], [15, 40], [21, 37], [15, 24], [26, 24]].forEach(([a, b]) => c.lineTo(a, b)); c.closePath();
    c.lineJoin = 'miter'; c.lineWidth = 2.4; c.strokeStyle = NB.white; c.fillStyle = NB.ink; c.fill(); c.stroke();
    c.restore();
  }
  function nbMarquee(c, y, h, s, speed, t0, t, rot, bg, fg) {
    const u = seg(t, t0, t0 + 0.2); if (u <= 0) return;
    c.save(); c.translate(960, y + h / 2); c.rotate(rot); c.translate(-960, -h / 2);
    c.beginPath(); c.rect(-100, -20, 2120 * u, h + 40); c.clip();
    c.fillStyle = NB.ink; c.fillRect(-100, -NB_BW, 2120, h + NB_BW * 2);
    c.fillStyle = bg; c.fillRect(-100, 0, 2120, h);
    c.font = `700 ${h * 0.5}px ${NB_M}`; const w = c.measureText(s).width;
    let x = -((speed % w) + w) % w - 100;
    for (; x < 2020; x += w) text(c, s, x, h * 0.68, { font: NB_M, size: h * 0.5, weight: 700, color: fg });
    c.restore();
  }
  function nbWindow(c, x, y, w, h, bar, title, msg, o = {}) {
    nbBox(c, x, y, w, h, NB.white);
    c.fillStyle = bar; c.fillRect(x + 3, y + 3, w - 6, 56); c.fillStyle = NB.ink; c.fillRect(x, y + 56, w, NB_BW);
    text(c, title, x + 22, y + 40, { font: NB_M, size: 24, weight: 700, color: NB.ink, ls: 2 });
    nbBox(c, x + w - 56, y + 12, 34, 34, NB.white, { sh: 4, bw: 4 });
    c.strokeStyle = NB.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(x + w - 48, y + 20); c.lineTo(x + w - 30, y + 38); c.moveTo(x + w - 30, y + 20); c.lineTo(x + w - 48, y + 38); c.stroke();
    text(c, msg, x + w / 2, y + 62 + (o.btns ? 120 : (h - 62) / 2 + 18), { font: NB_D, size: o.fs || 48, align: 'center', color: NB.ink });
  }

  MG.film({
    id: 'brutalism', dur: 10, poster: 9.4,
    fonts: [['400 120px "Archivo Black"', 'NEO-BRUTALISM'], ['700 30px "Space Grotesk"', 'CLICK ME'], ['700 24px "Space Mono"', 'border: 6px'], ['400 40px Tinos', 'Welcome'], ['700 70px Tinos', 'Welcome']],
    meta: {
      family: 'A', name: 'Neo-Brutalism', sub: 'Deliberately Unstyled', era: '2014 —',
      origin: 'Named after Brutalist architecture’s béton brut, web brutalism began as a reaction to polished template sites: Pascal Deville’s brutalistwebsites.com (2014) collected pages that exposed raw HTML, default fonts and visible structure. Around 2020–21 product design softened it into neo-brutalism — thick black borders, hard offset shadows, flat loud colours and chunky grotesk type — popularised by Gumroad’s redesign and a wave of SaaS and portfolio UIs.',
      works: 'brutalistwebsites.com (Pascal Deville, 2014) · Craigslist (1995 —) and the Drudge Report as raw ancestors · Balenciaga.com redesign (2017) · Bloomberg Businessweek covers (Richard Turley, 2010–14) · Gumroad redesign (2021)',
      tech: ['Hard-shadow boxes with press-in states', 'Exposed 12-column grid overlay', 'Linear, un-eased slams and jump cuts', 'Marquee tickers and stacked alert windows'],
      accent: '#ffd23f',
      motionDNA: 'No easing and no apology: elements slam in at constant speed and stop dead with a one-frame jolt, buttons sink exactly into their shadows, layouts jump between grid states on the beat and windows pile up instead of fading.',
      visualDNA: 'Thick black borders, solid black offset shadows, flat loud fills (yellow, pink, lime, lilac), default or grotesk/monospace type at huge sizes, visible grid and HTML tags, zero gradients, zero blur.',
      transitions: 'Stylesheet-load hard cut, linear slam, press-in, grid reflow jump, window cascade, hard cut to title',
      implementation: ['HTML / CSS (border + box-shadow)', 'Figma', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const fr = Math.floor(t * 30);
      // one-frame jolts on every slam, constant rattle during the spam
      let jx = 0, jy = 0;
      NB_SLAMS.forEach(ts => { if (t >= ts && t < ts + 0.067) { jx += Math.round((hash(ts * 9) - 0.5) * 16); jy += Math.round((hash(ts * 5) - 0.5) * 12); } });
      if (t > NB_T.spam && t < NB_T.cut) { const a = 2 + 4 * seg(t, NB_T.spam, NB_T.cut); jx += Math.round((hash(fr * 1.7) - 0.5) * a * 2); jy += Math.round((hash(fr * 3.1) - 0.5) * a * 2); }

      // ---------- raw HTML, before the stylesheet ----------
      if (t < NB_T.css) {
        c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
        const on = t0 => t >= t0;
        if (on(0.05)) text(c, 'Welcome to my homepage!', 40, 110, { font: NB_RAW, size: 72, weight: 700, color: '#000' });
        if (on(0.2)) text(c, 'This page is best viewed in any browser.', 40, 190, { font: NB_RAW, size: 36, color: '#000' });
        const link = (s, x, y) => { text(c, s, x, y, { font: NB_RAW, size: 36, color: '#0000ee' }); c.font = `400 36px ${NB_RAW}`; c.fillStyle = '#0000ee'; c.fillRect(x, y + 5, c.measureText(s).width, 2.5); };
        if (on(0.32)) link('Click here to enter', 40, 256);
        if (on(0.42)) { c.fillStyle = '#9a9a9a'; c.fillRect(40, 296, 1840, 2); c.fillStyle = '#eeeeee'; c.fillRect(40, 298, 1840, 2); }
        ['About me', 'My links', 'Guestbook'].forEach((s, i) => { if (!on(0.5 + i * 0.07)) return; c.fillStyle = '#000'; c.beginPath(); c.arc(84, 352 + i * 52, 6, 0, TAU); c.fill(); link(s, 110, 364 + i * 52); });
        if (on(0.72)) {
          c.fillStyle = '#efefef'; MG.rrect(c, 40, 530, 170, 58, 6); c.fill(); c.strokeStyle = '#767676'; c.lineWidth = 2; c.stroke();
          text(c, 'Submit', 125, 568, { font: 'Arial, sans-serif', size: 26, align: 'center', color: '#000' });
        }
        if (on(0.82)) {
          c.fillStyle = '#e8e8e8'; c.fillRect(0, 1036, W, 44); c.fillStyle = '#b0b0b0'; c.fillRect(0, 1036, W, 2);
          text(c, 'Transferring data from brutal.css …', 16, 1066, { font: NB_RAW, size: 26, color: '#333' });
        }
        // a text caret blinking after the heading
        if (Math.floor(t * 4) % 2 === 0) { c.fillStyle = '#000'; c.fillRect(40, 620, 3, 40); }
        return;
      }

      // ---------- the styled page ----------
      const final = t >= NB_T.cut;
      let bg = NB.cream;
      if (t >= 5.0 && t < 5.5) bg = NB.mint; else if (t >= 5.5 && t < 6.0) bg = NB.lilac;
      if (t >= NB_T.spam && !final) bg = [NB.yel, NB.pink][Math.floor((t - NB_T.spam) / 0.5) % 2]; // ≤ 2 full-frame changes per second (WCAG 2.3.1)
      if (final) bg = NB.yel;
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      c.save(); c.translate(jx, jy);
      // exposed grid: a dev-tools overlay when the CSS lands, then raw guides
      const ov = 1 - seg(t, 1.45, 1.7);
      for (let i = 0; i < 12; i++) {
        if (ov > 0) { c.fillStyle = `rgba(255,0,110,${0.12 * ov})`; c.fillRect(nbX(i), 0, 128, H); }
        c.fillStyle = 'rgba(0,0,0,0.13)'; c.fillRect(nbX(i), 0, 2, H); c.fillRect(nbX(i) + 126, 0, 2, H);
        if (ov > 0 || final) text(c, String(i + 1), nbX(i) + 64, final ? 1070 : 150, { font: NB_M, size: 18, weight: 700, align: 'center', color: final ? 'rgba(0,0,0,0.45)' : `rgba(255,0,110,${ov})` });
      }

      if (!final) {
        // nav
        nbBox(c, 60, 40, 1800, 76, NB.white, { sh: 8 });
        c.fillStyle = NB.ink; c.fillRect(63, 43, 300, 70);
        text(c, 'BRUTAL.WEB', 213, 92, { font: NB_D, size: 34, align: 'center', color: NB.yel });
        ['WORK', 'ABOUT', 'SHOP', 'BLOG'].forEach((s, i) => text(c, s, 430 + i * 170, 90, { font: NB_G, size: 28, weight: 700, color: NB.ink }));
        nbBox(c, 1640, 54, 196, 48, NB.yel, { sh: 5, bw: 4 });
        text(c, 'CART (0)', 1738, 87, { font: NB_M, size: 22, weight: 700, align: 'center', color: NB.ink });
        // marquee
        const mv = t < NB_T.spam ? (t - 1.875) * 190 : (NB_T.spam - 1.875) * 190 + (t - NB_T.spam) * 1400;
        nbMarquee(c, 592, 74, '★ NO GRADIENTS ★ HARD SHADOWS ★ RAW GRID ★ DEFAULT FONTS ★ ZERO BLUR ', mv, 1.875, t, -0.012, NB.ink, NB.yel);
        // cards
        const toggled = t >= NB_T.click + 0.05;
        NB_CARDS.forEach((C, ci) => {
          if (t < C.at) return;
          let r = C.L[0];
          NB_T.reflow.forEach((rt, j) => {
            const u = seg(t, rt + ci * 0.018, rt + ci * 0.018 + 0.14); if (u <= 0) return;
            const a = C.L[NB_SEQ[j]], b = C.L[NB_SEQ[j + 1]];
            r = a.map((v, q) => lerp(v, b[q], u));
          });
          let [x, y, w, h] = r;
          const u = seg(t, C.at, C.at + 0.12);
          x += (1 - u) * 1400 * C.from[0]; y += (1 - u) * 900 * C.from[1];
          const hover = C.k === 'button' && t > 3.3 && t < 4.0;
          const press = C.k === 'button' ? (t >= NB_T.click && t < NB_T.click + 0.12 ? 1 : 0) : 0;
          const [fx, fy] = nbBox(c, x, y, w, h, hover ? NB.orange : C.col, { press });
          c.save(); c.beginPath(); c.rect(fx + 3, fy + 3, w - 6, h - 6); c.clip();
          if (C.k === 'hero') {
            const fs = Math.min(150, (h - 80) / 2.2, nbFit(c, 'BUILD IT', NB_D, 150, w - 80));
            text(c, 'BUILD IT', fx + 40, fy + 50 + fs, { font: NB_D, size: fs, color: NB.ink });
            text(c, 'LOUD.', fx + 40, fy + 50 + fs * 2.05, { font: NB_D, size: fs, color: NB.ink, stroke: null });
            c.fillStyle = NB.ink; c.fillRect(fx + 40, fy + h - 34, Math.min(w - 80, 420), 8);
          } else if (C.k === 'stats') {
            const fs = Math.min(110, h * 0.42);
            text(c, '★ 4.9', fx + 34, fy + 24 + fs, { font: NB_D, size: fs, color: NB.ink });
            text(c, '2,048 PEOPLE CLICKED', fx + 34, fy + h - 22, { font: NB_M, size: 22, weight: 700, color: NB.ink });
          } else if (C.k === 'button') {
            text(c, 'CLICK ME →', fx + w / 2, fy + h / 2 + 18, { font: NB_G, size: Math.min(52, w / 8), weight: 700, align: 'center', color: NB.ink });
          } else if (C.k === 'toggle') {
            text(c, 'DARK MODE', fx + 22, fy + 44, { font: NB_M, size: 20, weight: 700, color: NB.ink });
            const sw = Math.min(w - 44, 210), sx = fx + 22, sy = fy + h - 82;
            c.fillStyle = NB.ink; MG.rrect(c, sx - 3, sy - 3, sw + 6, 62, 31); c.fill();
            c.fillStyle = toggled ? NB.lime : '#dddddd'; MG.rrect(c, sx + 3, sy + 3, sw - 6, 50, 25); c.fill();
            const kx = toggled ? sx + sw - 30 : sx + 28;
            c.fillStyle = NB.ink; c.beginPath(); c.arc(kx, sy + 28, 22, 0, TAU); c.fill(); c.fillStyle = NB.white; c.beginPath(); c.arc(kx, sy + 28, 16, 0, TAU); c.fill();
            text(c, toggled ? 'ON' : 'OFF', toggled ? sx + 24 : sx + sw - 24, sy + 36, { font: NB_M, size: 20, weight: 700, color: NB.ink, align: toggled ? 'left' : 'right' });
          } else if (C.n) {
            const fs = Math.min(110, h * 0.48);
            text(c, C.n, fx + 30, fy + 20 + fs, { font: NB_D, size: fs, color: NB.ink });
            text(c, C.lab, fx + 30, fy + h - 30, { font: NB_M, size: 22, weight: 700, color: NB.ink });
            c.fillStyle = NB.ink; c.beginPath(); c.arc(fx + w - 50, fy + 50, 18, 0, TAU); c.fill();
          } else if (C.k === 'check') {
            c.fillStyle = NB.ink; c.fillRect(fx, fy, w, 50);
            text(c, 'TODO.TXT', fx + 20, fy + 35, { font: NB_M, size: 22, weight: 700, color: NB.white, ls: 2 });
            [['BORDERS', 3.65], ['SHADOWS', 3.8], ['GRADIENTS', -1]].forEach(([s, tk], i) => {
              const yy = fy + 78 + i * 46; if (yy > fy + h - 20) return;
              c.fillStyle = NB.ink; c.fillRect(fx + 20, yy, 30, 30); c.fillStyle = NB.white; c.fillRect(fx + 24, yy + 4, 22, 22);
              if (tk > 0 && t > tk) { c.strokeStyle = NB.ink; c.lineWidth = 5; c.beginPath(); c.moveTo(fx + 25, yy + 15); c.lineTo(fx + 33, yy + 24); c.lineTo(fx + 47, yy + 4); c.stroke(); }
              text(c, s, fx + 66, yy + 25, { font: NB_M, size: 24, weight: 700, color: NB.ink });
              if (tk < 0 && t > 3.95) { c.fillStyle = NB.ink; c.fillRect(fx + 60, yy + 13, 150, 5); }
            });
            const n = clamp(Math.floor((t - 3.6) / 0.1), 0, 10), by = fy + h - 54;
            if (by > fy + 200) { c.fillStyle = NB.ink; c.fillRect(fx + 20, by, w - 40, 34); for (let k = 0; k < 10; k++) { c.fillStyle = k < n ? NB.lime : NB.white; c.fillRect(fx + 24 + k * (w - 48) / 10, by + 4, (w - 48) / 10 - 4, 26); } }
          }
          c.restore();
          if (C.k === 'hero' && u >= 1) nbTag(c, '<h1>', x, y);
          if (C.k === 'button' && u >= 1) nbTag(c, '<button>', x, y);
          if (C.k === 'hero' && t >= 2.5) { const p = 1 + 0.5 * (1 - seg(t, 2.5, 2.57)); nbStar(c, x + w - 40, y + 40, 78 * p, 12, 0.2, NB.yel, ['NEW!'], 32 * p); }
        });
        // modal
        if (t >= NB_T.modal && t < NB_T.close) {
          const p = 1 + 0.08 * (1 - seg(t, NB_T.modal, NB_T.modal + 0.07));
          c.save(); c.translate(960, 520); c.scale(p, p); c.translate(-960, -520);
          nbWindow(c, 550, 320, 820, 400, NB.yel, 'CONFIRM.EXE', 'ARE YOU SURE?', { btns: true, fs: 70 });
          const yesP = t >= NB_T.yes && t < NB_T.yes + 0.1 ? 1 : 0;
          nbBox(c, 640, 580, 260, 84, NB.lime, { press: yesP, sh: 8 });
          text(c, 'YES', 770 + yesP * 8, 636 + yesP * 8, { font: NB_D, size: 38, align: 'center', color: NB.ink });
          nbBox(c, 960, 580, 320, 84, NB.pink, { sh: 8 });
          text(c, 'ALSO YES', 1120, 636, { font: NB_D, size: 38, align: 'center', color: NB.ink });
          c.restore();
        }
        // alert spam
        if (t >= NB_T.spam) {
          const n = Math.min(17, Math.floor((t - NB_T.spam) / 0.058) + 1), cols = [NB.yel, NB.pink, NB.lime, NB.blue, NB.orange, NB.lilac];
          for (let i = 0; i < n; i++) nbWindow(c, 120 + i * 62, 120 + (i % 9) * 52 + Math.floor(i / 9) * 30, 660, 300, cols[i % 6], 'ERROR_' + String(i + 1).padStart(2, '0') + '.EXE', ['ARE YOU SURE?', 'REALLY SURE?', 'NO GRADIENTS?'][i % 3]);
        }
        // cursor: straight lines, no easing
        const cx = kf(t, [[2.6, 2000, E.lin], [3.25, 1360, E.lin], [3.6, 1360], [4.3, 1360], [4.6, 790, E.lin], [4.9, 790], [5.3, 1500, E.lin], [6.3, 1500], [7.3, 900, E.lin]]);
        const cy = kf(t, [[2.6, 1150, E.lin], [3.25, 470, E.lin], [3.6, 470], [4.3, 470], [4.6, 640, E.lin], [4.9, 640], [5.3, 880, E.lin], [6.3, 880], [7.3, 300, E.lin]]);
        const down = (t >= NB_T.click && t < NB_T.click + 0.12) || (t >= NB_T.yes && t < NB_T.yes + 0.1);
        if (t > 2.6) nbCursor(c, cx, cy, down);
      } else if (t >= NB_T.title) {
        // ---------- the title slab ----------
        text(c, 'THE MOTION STYLE ATLAS — FAMILY A', 60, 126, { font: NB_M, size: 24, weight: 700, color: NB.ink, ls: 2 });
        const [x, y0, w, h] = R(0, 9, 170, 690), u = seg(t, NB_T.title, NB_T.title + 0.1), y = y0 - (1 - u) * 900;
        nbBox(c, x, y, w, h, NB.white, { sh: 20, bw: 8 });
        nbTag(c, '<h1>', x, y);
        const fs = nbFit(c, 'BRUTALISM', NB_D, 240, w - 110);
        text(c, 'NEO-', x + 52, y + 40 + fs * 0.95, { font: NB_D, size: fs, color: NB.ink });
        if (t >= NB_T.word) {
          c.fillStyle = NB.pink; c.fillRect(x + 46, y + 70 + fs * 1.18, w - 92, fs * 0.84);
          text(c, 'BRUTALISM', x + 52, y + 54 + fs * 1.95, { font: NB_D, size: fs, color: NB.ink });
        }
        if (t >= NB_T.sticker) { const p = 1 + 0.5 * (1 - seg(t, NB_T.sticker, NB_T.sticker + 0.07)); nbStar(c, 1722, 380, 150 * p, 14, -0.18, NB.lilac, ['SINCE', '2014'], 44 * p); }
        if (t >= NB_T.btn) {
          const [bx, by0, bw, bh] = R(0, 3, 770, 880), bu = seg(t, NB_T.btn, NB_T.btn + 0.1), by = by0 + (1 - bu) * 600;
          const p = t >= NB_T.press && t < NB_T.press + 0.14 ? 1 : 0;
          const [fx, fy] = nbBox(c, bx, by, bw, bh, NB.lime, { press: p });
          text(c, 'VIEW SOURCE ↗', fx + bw / 2, fy + bh / 2 + 15, { font: NB_G, size: 42, weight: 700, align: 'center', color: NB.ink });
          const [qx, qy, qw, qh] = R(4, 11, 770, 880);
          nbBox(c, qx, qy + (1 - bu) * 600, qw, qh, NB.ink);
          const code = 'border: 6px solid #000; box-shadow: 12px 12px 0 #000;', nch = Math.floor(clamp((t - NB_T.type) / 0.55) * code.length);
          text(c, code.slice(0, nch) + (Math.floor(t * 4) % 2 ? '█' : ''), qx + 30, qy + (1 - bu) * 600 + 66, { font: NB_M, size: 26, weight: 700, color: NB.lime });
        }
        nbMarquee(c, 930, 80, 'HARD BORDERS ★ FLAT COLOUR ★ OFFSET SHADOWS ★ DEFAULT TYPE ★ EXPOSED GRID ★ ', (t - 7.55) * 160, 7.55, t, 0, NB.ink, NB.white);
        const cx = kf(t, [[8.3, 2000, E.lin], [8.65, 300, E.lin]]), cy = kf(t, [[8.3, 1100, E.lin], [8.65, 832, E.lin]]);
        if (t > 8.3) nbCursor(c, cx, cy, t >= NB_T.press && t < NB_T.press + 0.14);
      }
      c.restore();
    },
    score(A) {
      A.bus.gain.value = 0.9;
      const thunk = (t, g = 0.3, f = 150) => { A.osc(t, { type: 'square', f, f2: 50, glide: 0.07, dur: 0.12, g: g * 0.5, lp: 900, crush: true }); A.noise(t, { type: 'highpass', f: 2500, dur: 0.02, g: g * 0.5 }); };
      const click = (t, g = 0.18) => { A.noise(t, { type: 'highpass', f: 3500, dur: 0.012, g }); A.noise(t + 0.09, { type: 'highpass', f: 4500, dur: 0.01, g: g * 0.7 }); };
      const blip = (t, m, g = 0.05, d = 0.07) => A.osc(t, { type: 'square', f: midi(m), dur: d, g, lp: 4000 });
      // raw HTML: each line pops with a tiny tick
      [0.05, 0.2, 0.32, 0.42, 0.5, 0.57, 0.64, 0.72, 0.82].forEach((t, i) => { A.noise(t, { type: 'highpass', f: 6000, dur: 0.01, g: 0.06 }); A.osc(t, { f: 1200 + i * 60, dur: 0.03, g: 0.012 }); });
      A.osc(0.82, { type: 'sawtooth', f: 60, dur: 0.18, g: 0.03, lp: 300 });
      // the stylesheet lands
      A.kick(NB_T.css, 0.8, { f: 160, f2: 38 }); A.noise(NB_T.css, { type: 'lowpass', f: 5000, dur: 0.25, g: 0.2, crush: true });
      A.chord(NB_T.css, [40, 47, 52, 55], { type: 'square', dur: 0.25, g: 0.03, lp: 2400, crush: true });
      NB_CARDS.forEach((C, i) => thunk(C.at + 0.12, 0.3, 150 + i * 12));
      thunk(1.995, 0.2, 200); A.osc(2.5, { type: 'square', f: 600, f2: 1200, glide: 0.06, dur: 0.1, g: 0.04 });
      // hard-quantised beat, square bass
      const bass = [40, 40, 43, 40, 45, 43, 38, 38];
      for (let k = 0; k < 25; k++) {
        const t = 1.0 + k * 0.25; if (t >= NB_T.spam) break;
        if (k % 2 === 0) A.kick(t, 0.5, { f: 140, f2: 40 });
        if (k % 4 === 2) A.clap(t, 0.18, { rev: 0.1 });
        A.hat(t + 0.125, 0.04, false, { pan: k % 2 ? 0.3 : -0.3 });
        A.osc(t, { type: 'square', f: midi(bass[k % 8] - 12), dur: 0.2, g: 0.06, lp: 700, lp2: 200, lpT: 0.18 });
      }
      // interaction: click, toggle, checks, chunky progress, the modal
      click(NB_T.click, 0.25); blip(NB_T.click + 0.05, 76, 0.05);
      [3.65, 3.8].forEach(t => blip(t, 83, 0.04)); A.noise(3.95, { type: 'bandpass', f: 1500, q: 2, dur: 0.12, g: 0.06 });
      for (let k = 1; k <= 10; k++) blip(3.6 + k * 0.1, 64 + k, 0.025, 0.04);
      A.osc(NB_T.modal, { type: 'square', f: 440, dur: 0.12, g: 0.06, lp: 3000 }); A.osc(NB_T.modal + 0.13, { type: 'square', f: 330, dur: 0.18, g: 0.06, lp: 3000 });
      click(NB_T.yes, 0.25); A.noise(NB_T.close, { type: 'highpass', f: 2000, dur: 0.04, g: 0.15 });
      // reflows on the beat
      NB_T.reflow.forEach((t, i) => { A.whoosh(t, 0.16, { f1: 600, f2: 3000, g: 0.08 }); thunk(t + 0.16, 0.3, 120 + i * 30); A.chord(t, [[40, 47, 52], [43, 50, 55], [45, 52, 57]][i], { type: 'square', dur: 0.2, g: 0.025, lp: 2000 }); });
      // alert spam
      for (let i = 0; i < 17; i++) { const t = NB_T.spam + i * 0.058; if (t >= NB_T.cut) break; blip(t, 64 + (i % 2 ? 7 : 0) + Math.floor(i / 2), 0.04, 0.05); }
      for (let k = 0; k < 8; k++) { const t = NB_T.spam + k * 0.125; A.kick(t, 0.45, { f: 150, f2: 45 }); A.osc(t, { type: 'square', f: midi(28), dur: 0.1, g: 0.08, lp: 500 }); }
      A.riser(NB_T.spam, NB_T.cut - NB_T.spam, { g: 0.1, f: 110 });
      // hard cut, then the stamps
      A.impact(NB_T.title + 0.1, 0.8, { rev: 0.25 }); A.kick(NB_T.title + 0.1, 0.8, { f: 170, f2: 35 });
      A.chord(NB_T.title + 0.1, [28, 40, 47, 52, 55], { type: 'square', dur: 0.5, g: 0.035, lp: 3000, lp2: 600, lpT: 0.4, crush: true });
      thunk(NB_T.word, 0.5, 110); A.noise(NB_T.word, { type: 'lowpass', f: 4000, dur: 0.2, g: 0.15, crush: true });
      A.osc(NB_T.sticker, { type: 'square', f: 500, f2: 1000, glide: 0.06, dur: 0.1, g: 0.05 });
      thunk(NB_T.btn + 0.1, 0.35, 160);
      for (let k = 0; k < 14; k++) A.noise(NB_T.type + k * 0.04, { type: 'bandpass', f: 3000 + hash(k) * 2000, q: 2, dur: 0.015, g: 0.08 });
      click(NB_T.press, 0.3);
      for (let k = 0; k < 9; k++) { const t = 7.55 + k * 0.25; A.hat(t, 0.03, false); if (k % 2 === 0) A.kick(t, 0.3, { f: 120, f2: 40 }); }
      A.chord(NB_T.press, [40, 52, 55, 59, 64], { type: 'square', dur: 1.2, g: 0.02, lp: 2500, lp2: 500, lpT: 1.1, rev: 0.3 });
      A.osc(NB_T.press, { type: 'square', f: midi(28), dur: 1.1, g: 0.07, lp: 300 });
    },
  });
})();
