/* batch d2 — Family A: Graphic Design & Historical.
   Op Art Kinetic (Riley / Vasarely, 1961—65), Memphis Design (Milan, 1981),
   Y2K Graphic Design (chrome, candy plastic & HUD, 1997—2004). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, spring, rng, hash, vnoise, midi, text, rrect, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Bungee&family=Silkscreen:wght@400;700&family=Rubik:wght@900&display=block');
  const ARC = 'Archivo, sans-serif';
  const MONO = '"JetBrains Mono", monospace';
  const bump = (t, a, up, hold, down) => E.outX(seg(t, a, a + up)) * (1 - E.ioC(seg(t, a + up + hold, a + up + hold + down)));
  const pulse = (t, T, k = 10) => (t >= T ? Math.exp(-(t - T) * k) : 0);
  // stage→pixel scale of the current transform (1 at 1920 wide)
  const pxScale = c => { const m = c.getTransform(); return clamp(Math.hypot(m.a, m.b), 0.2, 1); };

  /* =====================================================================
     A · OP ART KINETIC — a per-pixel black/white field with analytic AA.
     Each pixel gets one phase (stripes) or two (XOR checker / moiré);
     coverage comes from the phase and its screen-space derivative.
     ===================================================================== */
  const OPK = { ink: [12, 12, 12], paper: [245, 242, 235] };
  const OP_TITLE_T = 8.45;
  let FK = 0, F1 = 0, F2 = 0;           // field outputs: kind, phase 1, phase 2 (kind 2: F1 = direct coverage)

  function opBuf(st, w, h) {
    if (!st.op || st.op.w !== w) {
      const cv = offscreen(w, h), g = cv.getContext('2d');
      st.op = { w, h, cv, g, img: g.createImageData(w, h), P1: new Float64Array(w * h), P2: new Float64Array(w * h), K: new Uint8Array(w * h), M: null };
    }
    return st.op;
  }
  function opMask(o, s) {
    if (o.M) return o.M;
    const cv = offscreen(o.w, o.h), g = cv.getContext('2d');
    g.scale(s, s);
    g.fillStyle = '#fff';
    g.font = '900 400px Archivo, sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    if ('letterSpacing' in g) g.letterSpacing = '-6px';
    g.fillText('OP ART', 960, 655);
    const d = g.getImageData(0, 0, o.w, o.h).data, M = new Float32Array(o.w * o.h);
    for (let i = 0; i < M.length; i++) M[i] = d[i * 4 + 3] / 255;
    o.M = M;
    return M;
  }
  // lens: Vasarely bulge — magnify the centre, compress the rim (continuous at the rim)
  function lens(x, y, L) {
    const dx = x - L.x, dy = y - L.y, d2 = dx * dx + dy * dy, R = L.R;
    if (d2 >= R * R || R < 1) return null;
    const l = Math.sqrt(d2) / R;
    const nl = lerp(l, Math.pow(Math.asin(l) / (Math.PI / 2), 1.6), L.a);
    const k = l > 1e-6 ? nl / l : 0;
    return [L.x + dx * k, L.y + dy * k];
  }
  function opUniforms(t) {
    const U = { t };
    // hook: period collapse in 16th-note clicks
    let n = 0;
    for (let k = 0; k < 5; k++) n += E.outX(seg(t, 0.5 + k * 0.125, 0.58 + k * 0.125));
    n += 0.6 * E.ioC(seg(t, 1.1, 1.6));
    U.Pd = 1080 / Math.pow(2, n);
    U.bias = 0.994 * Math.pow(1 - seg(n, 0, 4.2), 1.5);
    U.hx = 980 * E.outX(seg(t, 0.12, 0.42));
    // Riley "Current": undulation
    U.amp = kf(t, [[1.3, 0], [2.0, 26, E.ioC], [2.7, 40, E.ioC], [3.3, 66, E.inQ]]);
    U.ph = t * 2.4 + 2.2 * E.inQ(seg(t, 2.4, 3.4)) * 3;
    U.pinch = E.ioC(seg(t, 1.6, 2.8));
    // wipe to squares
    U.wx = lerp(-500, 2500, E.ioC(seg(t, 3.25, 3.75)));
    // Riley "Movement in Squares": fold
    U.B = kf(t, [[3.5, 0], [4.55, 9, E.outC], [4.9, 8.2, E.ioS], [5.45, 0, E.ioC]]) * (1 + 0.08 * (pulse(t, 4.0, 9) + pulse(t, 4.5, 9)));
    U.xf = kf(t, [[3.4, 1480], [4.9, 760, E.ioS]]);
    U.sq = 90;
    // Vasarely "Vega": lenses
    const pR = 1 + 0.05 * (pulse(t, 6.0, 8) + pulse(t, 6.5, 8));
    U.lenses = [
      { x: 960 + 30 * Math.sin(t * 1.3), y: 540 + 18 * Math.cos(t * 1.1), R: 440 * spring(t - 5.0, 1.6, 0.42) * pR, a: E.outC(seg(t, 5.0, 5.6)) },
      { x: 350, y: 270, R: 230 * spring(t - 5.9, 2.4, 0.4) * pR, a: 1 },
      { x: 1580, y: 820, R: 250 * spring(t - 6.25, 2.4, 0.4) * pR, a: 1 },
    ].filter(L => L.R > 2);
    // moiré
    U.iris = 2400 * E.inQ(seg(t, 6.9, 7.3));
    U.per = kf(t, [[8.1, 40], [8.7, 54]]);
    U.dx = kf(t, [[6.9, 0], [7.3, 160, E.outC], [7.75, 70, E.ioC], [8.05, 240, E.ioC], [8.55, 0, E.ioC]]);
    U.rot = kf(t, [[6.9, 0], [8.55, 2.4, E.ioS]]);
    U.far = Math.pow(10, 5 * E.inQ(seg(t, 8.1, 8.75)));
    U.inv = (t >= 7.5 && t < 7.75) || (t >= 8.0 && t < 8.125) || (t >= 8.25 && t < 8.3125);
    // final still: undulation + title stripes rotate inside letters
    U.famp = 22 * E.ioC(seg(t, 8.5, 9.0));
    U.th = (Math.PI / 2) * clamp(spring(t - OP_TITLE_T, 1.4, 0.55), 0, 1.15);
    U.title = t >= OP_TITLE_T;
    return U;
  }
  function fieldA(x, y, U) {
    const t = U.t;
    if (t < 0.5 && Math.abs(x - 960) > U.hx) { FK = 2; F1 = 1; return; }
    if (t < 0.12) { FK = 2; F1 = 1; return; }
    let Pd = U.Pd, yy = y;
    if (U.amp > 0) {
      const lam = 300 + 110 * Math.sin(y * 0.004 + 0.6);
      yy = y + U.amp * Math.sin(TAU * x / lam + U.ph + y * 0.003) * (0.65 + 0.35 * Math.sin(y * 0.0045 - t * 1.7));
      const g = (x - lerp(1500, 520, U.pinch)) / 280;
      Pd *= 1 - 0.42 * U.pinch * Math.exp(-g * g);
    }
    FK = 0; F1 = (yy - 540) / Pd + 0.75;
  }
  function fieldB(x, y, U) {
    let X = x, Y = y;
    for (let i = 0; i < U.lenses.length; i++) { const r = lens(X, Y, U.lenses[i]); if (r) { X = r[0]; Y = r[1]; } }
    const s = 150, d = X - U.xf;
    const u = d + U.B * s * Math.atan(d / s);
    FK = 1; F1 = u / (2 * U.sq) + 0.0001; F2 = (Y - 540) / (2 * U.sq);
  }
  function fieldC(x, y, U, m) {
    const t = U.t;
    if (U.title && t > 8.62) {
      const yy = y + U.famp * Math.sin(TAU * x / 520 + 0.9) * (0.8 + 0.2 * Math.sin(y * 0.004));
      const q = (yy - 540) / (U.per / 2) + 0.5;
      if (m > 0) {
        const qi = ((x - 960) * Math.sin(U.th) + (y - 540) * Math.cos(U.th)) / (U.per / 2) + 0.5;
        F1 = lerp(q, qi, m);
      } else F1 = q;
      FK = 0; return;
    }
    const cy = 540 - U.far, ca = Math.cos(U.rot), sa = Math.sin(U.rot);
    const x1 = 960 + U.dx * ca, y1 = cy + U.dx * sa, x2 = 960 - U.dx * ca, y2 = cy - U.dx * sa;
    FK = 1;
    F1 = (Math.hypot(x - x1, y - y1) - U.far) / U.per;
    F2 = (Math.hypot(x - x2, y - y2) - U.far) / U.per + 0.25;
  }
  function opCov(p, fw, b) {
    const a = TAU * p, s = Math.sin(a) + b, cs = Math.max(Math.abs(Math.cos(a)), 0.2);
    let v = 0.5 + s / (TAU * cs * Math.max(fw, 1e-4) * 1.0);
    v = v < 0 ? 0 : v > 1 ? 1 : v;
    if (fw > 0.22) v = lerp(v, 0.5 + b * 0.35, clamp((fw - 0.22) / 0.25));
    return v;
  }
  function opRender(c, t, W, H, st) {
    const s = pxScale(c), w = Math.round(1920 * s), h = Math.round(1080 * s);
    const o = opBuf(st, w, h), U = opUniforms(t), M = U.title ? opMask(o, s) : null;
    const { P1, P2, K } = o, inv = 1 / s;
    for (let j = 0; j < h; j++) {
      const y = (j + 0.5) * inv;
      for (let i = 0; i < w; i++) {
        const x = (i + 0.5) * inv, idx = j * w + i;
        let mode;
        if (t < 3.25) mode = 0;
        else if (t < 3.75) mode = x < U.wx - (y - 540) * 0.45 ? 1 : 0;
        else if (t < 6.9) mode = 1;
        else if (t < 7.3) mode = (x - 960) * (x - 960) + (y - 540) * (y - 540) < U.iris * U.iris ? 2 : 1;
        else mode = 2;
        if (mode === 0) fieldA(x, y, U); else if (mode === 1) fieldB(x, y, U); else fieldC(x, y, U, M ? M[idx] : 0);
        K[idx] = FK; P1[idx] = F1; P2[idx] = F2;
      }
    }
    const d = o.img.data, [ir, ig, ib] = OPK.ink, [pr, pg, pb] = OPK.paper;
    const bias = t < 1.6 ? U.bias : 0;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const idx = j * w + i, k = K[idx];
        let v;
        if (k === 2) v = P1[idx];
        else {
          const il = i > 0 ? idx - 1 : idx + 1, iu = j > 0 ? idx - w : idx + w;
          const p = P1[idx], fw1 = Math.abs(p - P1[il]) + Math.abs(p - P1[iu]);
          const c1 = opCov(p, K[il] === k && K[iu] === k ? fw1 : 0.5, bias);
          if (k === 0) v = c1;
          else {
            const q = P2[idx], fw2 = Math.abs(q - P2[il]) + Math.abs(q - P2[iu]);
            const c2 = opCov(q, K[il] === k && K[iu] === k ? fw2 : 0.5, 0);
            v = c1 * (1 - c2) + c2 * (1 - c1);
          }
        }
        if (U.inv) v = 1 - v;
        const n = idx * 4;
        d[n] = pr + (ir - pr) * v; d[n + 1] = pg + (ig - pg) * v; d[n + 2] = pb + (ib - pb) * v; d[n + 3] = 255;
      }
    }
    o.g.putImageData(o.img, 0, 0);
    c.save();
    c.imageSmoothingEnabled = true;
    c.drawImage(o.cv, 0, 0, W, H);
    c.restore();
  }

  MG.film({
    id: 'opart', dur: 10, poster: 9.4,
    fonts: [['900 400px Archivo', 'OP ART'], ['800 22px Archivo', 'OPTICAL KINETIC RILEY VASARELY THE RESPONSIVE EYE MoMA 1961—1965 ·']],
    meta: {
      family: 'A', name: 'Op Art Kinetic', sub: 'Optical Vibration', era: '1960 —',
      origin: 'Op (optical) art used precise black-and-white geometry to make flat paintings appear to move, swell and flicker on the retina; Bridget Riley and Victor Vasarely led it, and MoMA’s 1965 exhibition The Responsive Eye made it a global sensation.',
      works: 'Movement in Squares (Bridget Riley, 1961) · Current (Bridget Riley, 1964) · Fall (Bridget Riley, 1963) · Vega series (Victor Vasarely, 1957—) · The Responsive Eye (MoMA, 1965)',
      tech: ['Analytic anti-aliased stripe fields', 'Moiré interference', 'Lens-warped checkerboards'],
      accent: '#111111',
      motionDNA: 'Precise, vibrating motion: periods collapse in clicks, lines undulate, squares fold and bulge, and two ring fields beat against each other until they lock still.',
      visualDNA: 'Pure black and white: dense parallel stripes, compressed checkerboards, spherical bulges and concentric rings, no colour and no texture.',
      transitions: 'Period-doubling, slanted wipe, fold relax into bulge, iris to moiré, ring flattening to stripes, phase-shift reveal',
      implementation: ['GLSL', 'Canvas 2D', 'After Effects'],
      reproducibility: 'Fully procedural', loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H, st) {
      opRender(c, t, W, H, st);
      // caption strip
      const ca = E.outC(seg(t, 8.85, 9.15));
      if (ca > 0) {
        const bw = 1920 * ca;
        c.fillStyle = 'rgb(245,242,235)';
        c.fillRect(960 - bw / 2, 938, bw, 64);
        c.fillStyle = 'rgb(12,12,12)';
        c.fillRect(960 - bw / 2, 938, bw, 3); c.fillRect(960 - bw / 2, 999, bw, 3);
        if (ca > 0.6) {
          const a = seg(ca, 0.6, 1);
          text(c, 'OP ART KINETIC', 120, 980, { font: ARC, weight: 800, size: 22, ls: 6, color: `rgba(12,12,12,${a})` });
          text(c, 'RILEY  ·  VASARELY  ·  THE RESPONSIVE EYE, MoMA  ·  1961—1965', 1800, 980, { font: ARC, weight: 800, size: 22, ls: 6, align: 'right', color: `rgba(12,12,12,${a})` });
        }
      }
    },
    score(A) {
      // hook: hairline zip + period-doubling clicks
      A.osc(0.12, { f: 1800, f2: 7000, glide: 0.3, dur: 0.32, g: 0.05 });
      A.noise(0.12, { type: 'highpass', f: 6000, dur: 0.3, g: 0.05, swell: 0.4 });
      for (let k = 0; k < 5; k++) {
        const T = 0.5 + k * 0.125;
        A.osc(T, { type: 'square', f: 220 * Math.pow(2, k * 0.6), dur: 0.05, g: 0.06, lp: 4000 });
        A.osc(T, { f: 110 * Math.pow(2, k * 0.6), dur: 0.12, g: 0.18 });
      }
      A.osc(1.125, { f: 660, dur: 0.4, g: 0.05, rev: 0.4 });
      // pulse grid (120 bpm)
      for (let k = 0; k < 14; k++) {
        const T = 1.25 + k * 0.5;
        if (T >= 8.1) break;
        A.osc(T, { f: 62, f2: 40, glide: 0.2, dur: 0.35, g: 0.32 });
        A.osc(T + 0.25, { type: 'square', f: 1760, dur: 0.018, g: 0.03, lp: 6000, pan: 0.3 });
        if (T > 3.3) A.osc(T + 0.125, { type: 'square', f: 2640, dur: 0.012, g: 0.018, pan: -0.3 });
        if (T > 3.3) A.osc(T + 0.375, { type: 'square', f: 2640, dur: 0.012, g: 0.018, pan: 0.3 });
      }
      // beating drone against the undulating lines: detune widens with amplitude
      A.osc(1.25, { f: 110, dur: 2.2, g: 0.07, a: 0.4, hold: true, rel: 0.3 });
      A.osc(1.25, { f: 112, f2: 118, glide: 2.0, dur: 2.2, g: 0.07, a: 0.4, hold: true, rel: 0.3 });
      A.osc(2.4, { f: 220, dur: 1.0, g: 0.035, a: 0.3, hold: true, rel: 0.2 });
      A.osc(2.4, { f: 226, f2: 238, glide: 1.0, dur: 1.0, g: 0.035, a: 0.3, hold: true, rel: 0.2 });
      // wipe
      A.whoosh(3.2, 0.6, { f1: 400, f2: 6000, g: 0.12, swell: 0.6 });
      A.osc(3.5, { type: 'triangle', f: 330, dur: 0.12, g: 0.1 });
      // fold: tone bends as columns compress
      A.osc(3.5, { f: 165, f2: 330, glide: 1.05, dur: 1.4, g: 0.06, a: 0.2, hold: true, rel: 0.25 });
      A.osc(3.5, { f: 167, f2: 336, glide: 1.05, dur: 1.4, g: 0.06, a: 0.2, hold: true, rel: 0.25 });
      [4.0, 4.5].forEach(T => A.osc(T, { type: 'square', f: 880, dur: 0.05, g: 0.05, lp: 3000 }));
      // relax → sphere
      A.osc(4.9, { f: 330, f2: 110, glide: 0.6, dur: 0.7, g: 0.06 });
      A.osc(5.0, { f: 55, f2: 82, glide: 0.5, dur: 0.9, g: 0.22, a: 0.3 });
      A.bell(5.35, midi(76), { g: 0.06, dur: 1.4, ratios: [1, 2, 3.01] });
      A.bell(5.9, midi(83), { g: 0.05, dur: 1.0, ratios: [1, 2, 3.01], pan: -0.4 });
      A.bell(6.25, midi(79), { g: 0.05, dur: 1.0, ratios: [1, 2, 3.01], pan: 0.4 });
      // iris into moiré: fast-beating high sines
      A.whoosh(6.85, 0.5, { f1: 6000, f2: 500, g: 0.1, swell: 0.7 });
      A.osc(7.1, { f: 880, dur: 1.4, g: 0.035, a: 0.15, hold: true, rel: 0.2, pan: -0.4 });
      A.osc(7.1, { f: 886, f2: 905, glide: 1.0, dur: 1.4, g: 0.035, a: 0.15, hold: true, rel: 0.2, pan: 0.4 });
      // inversions
      [7.5, 7.75, 8.0, 8.125, 8.25, 8.3125].forEach((T, i) => {
        A.noise(T, { type: 'highpass', f: 3000, dur: 0.04, g: 0.12 });
        A.osc(T, { type: 'square', f: i % 2 ? 1320 : 990, dur: 0.04, g: 0.05, lp: 5000 });
      });
      A.osc(7.5, { f: 70, f2: 40, glide: 0.2, dur: 0.4, g: 0.35 });
      A.riser(7.3, 1.1, { g: 0.07, f: 220 });
      // resolve: detuned pair glides to unison as the image stills
      A.impact(8.45, 0.4);
      A.osc(8.45, { f: 220, dur: 1.55, g: 0.06, a: 0.02, hold: true, rel: 0.8, rev: 0.4 });
      A.osc(8.45, { f: 227, f2: 220.05, glide: 0.55, dur: 1.55, g: 0.06, a: 0.02, hold: true, rel: 0.8, rev: 0.4 });
      A.osc(8.45, { f: 330, dur: 1.55, g: 0.03, a: 0.3, hold: true, rel: 0.8, rev: 0.4 });
      A.osc(8.45, { f: 440, dur: 1.55, g: 0.02, a: 0.5, hold: true, rel: 0.8, rev: 0.4 });
      A.osc(8.9, { type: 'square', f: 1760, dur: 0.02, g: 0.03, lp: 6000 });
      A.bell(9.0, midi(81), { g: 0.04, dur: 1.0 });
    },
  });

  /* =====================================================================
     B · MEMPHIS DESIGN — laminate patterns, hard black shadows,
     squash-and-stretch drops stacking into a Sottsass-style totem.
     ===================================================================== */
  const MP = { cream: '#f7eedd', pink: '#ff9fc6', hot: '#ff3c83', mint: '#68d9c2', teal: '#00a29a', yel: '#ffd23b', blue: '#2356d8', red: '#ff4b2e', lilac: '#b9a4ff', blk: '#151515', wht: '#ffffff' };
  const BUNGEE = 'Bungee, Archivo, sans-serif';
  const MP_SH = 12;           // hard shadow offset
  const MP_FLOOR = 880;
  const mpPatCache = new WeakMap();
  function mpTiles() {
    const T = {};
    const mk = (w, h, fn) => { const cv = offscreen(w, h), g = cv.getContext('2d'); fn(g, w, h); return cv; };
    // Bacterio (Sottsass, 1978): black worms on white
    T.bact = mk(180, 180, (g, w, h) => {
      g.fillStyle = MP.wht; g.fillRect(0, 0, w, h);
      const r = rng(81); g.strokeStyle = MP.blk; g.lineCap = 'round'; g.lineJoin = 'round';
      for (let k = 0; k < 16; k++) {
        const x = r() * w, y = r() * h, a = r() * TAU, L = 14 + r() * 16;
        g.lineWidth = 4 + r() * 2.5;
        for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
          g.beginPath();
          for (let i = 0; i <= 8; i++) {
            const u = i / 8, px = x + ox + Math.cos(a) * L * (u - 0.5) + Math.cos(a + 1.57) * Math.sin(u * 7 + k) * 5;
            const py = y + oy + Math.sin(a) * L * (u - 0.5) + Math.sin(a + 1.57) * Math.sin(u * 7 + k) * 5;
            i ? g.lineTo(px, py) : g.moveTo(px, py);
          }
          g.stroke();
        }
      }
    });
    T.grid = mk(30, 30, (g, w, h) => { g.fillStyle = MP.wht; g.fillRect(0, 0, w, h); g.fillStyle = MP.blk; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h); });
    T.dots = mk(44, 44, (g, w, h) => {
      g.fillStyle = MP.yel; g.fillRect(0, 0, w, h); g.fillStyle = MP.blk;
      [[11, 11], [33, 33]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); });
    });
    T.zig = mk(60, 40, (g, w, h) => {
      g.fillStyle = MP.blue; g.fillRect(0, 0, w, h); g.strokeStyle = MP.wht; g.lineWidth = 6; g.lineJoin = 'miter';
      for (const oy of [-h, 0, h]) { g.beginPath(); g.moveTo(-15, 30 + oy); g.lineTo(0, 10 + oy); g.lineTo(30, 30 + oy); g.lineTo(60, 10 + oy); g.lineTo(75, 30 + oy); g.stroke(); }
    });
    T.terr = mk(520, 520, (g, w, h) => {
      g.fillStyle = MP.cream; g.fillRect(0, 0, w, h);
      const r = rng(23), cols = [MP.red, MP.blue, MP.yel, MP.mint, MP.blk, MP.hot, MP.lilac];
      for (let k = 0; k < 230; k++) {
        const x = r() * w, y = r() * h, s = 3 + Math.pow(r(), 2.2) * 15, n = 3 + ((r() * 3) | 0), a0 = r() * TAU, col = cols[k % cols.length];
        for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
          g.beginPath();
          for (let i = 0; i < n; i++) { const a = a0 + i * TAU / n + (r() - 0.5) * 0.6, rr = s * (0.6 + r() * 0.6); i ? g.lineTo(x + ox + Math.cos(a) * rr, y + oy + Math.sin(a) * rr) : g.moveTo(x + ox + Math.cos(a) * rr, y + oy + Math.sin(a) * rr); }
          g.closePath(); g.fillStyle = col; g.fill();
        }
      }
    });
    T.stripe = mk(36, 36, (g, w, h) => {
      g.fillStyle = MP.pink; g.fillRect(0, 0, w, h); g.strokeStyle = MP.blk; g.lineWidth = 7;
      g.beginPath(); for (let k = -1; k <= 2; k++) { g.moveTo(k * 36 - 4, -4); g.lineTo(k * 36 + 40, 40); } g.stroke();
    });
    T.check = mk(40, 40, (g, w, h) => { g.fillStyle = MP.wht; g.fillRect(0, 0, w, h); g.fillStyle = MP.blk; g.fillRect(0, 0, 20, 20); g.fillRect(20, 20, 20, 20); });
    T.hatch = mk(16, 16, (g, w, h) => { g.fillStyle = MP.mint; g.fillRect(0, 0, w, h); g.fillStyle = MP.blk; g.fillRect(0, 0, w, 4); });
    return T;
  }
  let MP_TILES = null;
  function pat(c, name, ox = 0, oy = 0, sc = 1) {
    if (!MP_TILES) MP_TILES = mpTiles();
    let m = mpPatCache.get(c);
    if (!m) { m = {}; mpPatCache.set(c, m); }
    if (!m[name]) m[name] = c.createPattern(MP_TILES[name], 'repeat');
    const p = m[name];
    if (p.setTransform) p.setTransform(new DOMMatrix().translate(ox, oy).scale(sc));
    return p;
  }
  // ink(): hard drop shadow + fill + black keyline
  function ink(c, p, fill, o = {}) {
    const sh = o.sh ?? MP_SH;
    if (sh) { c.save(); c.translate(sh, sh); c.fillStyle = MP.blk; c.fill(p); c.restore(); }
    c.fillStyle = fill; c.fill(p);
    if (o.lw !== 0) { c.lineWidth = o.lw || 5; c.strokeStyle = MP.blk; c.lineJoin = 'round'; c.stroke(p); }
  }
  // drop with gravity bounces; returns lift (px above rest) and squash/stretch
  function mpDrop(t, t0, Hd, d = 0.3) {
    const tt = t - t0;
    if (tt < 0) return null;
    const hs = [0.2, 0.05], amps = [0.3, 0.14, 0.06];
    let y = 0, v = 0, last = -1, tl = 0;
    if (tt < d) { const p = tt / d; y = Hd * (1 - p * p); v = p; }
    else {
      let tb = tt - d; tl = d; last = 0;
      for (let k = 0; k < hs.length; k++) {
        const dd = 2 * d * Math.sqrt(hs[k]);
        if (tb < dd) { const p = tb / dd; y = Hd * hs[k] * 4 * p * (1 - p); v = Math.abs(1 - 2 * p) * Math.sqrt(hs[k]); break; }
        tb -= dd; tl += dd; last = k + 1;
      }
    }
    let q = 0;
    if (last >= 0 && y === 0) { const tau = tt - tl; q = amps[Math.min(last, 2)] * Math.exp(-tau * 11) * Math.cos(tau * 26); }
    else if (last >= 0) { const tau = tt - tl; q = amps[Math.min(last, 2)] * Math.exp(-tau * 11) * Math.cos(tau * 26) * 0.4; }
    const st = y > 0 ? 0.16 * v : 0;
    return { y, sx: (1 + q * 0.9) * (1 - st * 0.5), sy: (1 - q) * (1 + st) };
  }
  // shape paths (origin at bottom centre)
  const P = {
    cylBody(w, h) { const p = new Path2D(), ry = w * 0.17; p.moveTo(-w / 2, -h); p.lineTo(-w / 2, 0); p.ellipse(0, 0, w / 2, ry, 0, Math.PI, 0, true); p.lineTo(w / 2, -h); p.closePath(); return p; },
    cylTop(w, h) { const p = new Path2D(); p.ellipse(0, -h, w / 2, w * 0.17, 0, 0, TAU); return p; },
    cone(w, h) { const p = new Path2D(), ry = w * 0.16; p.moveTo(0, -h); p.lineTo(-w / 2, 0); p.ellipse(0, 0, w / 2, ry, 0, Math.PI, 0, true); p.closePath(); return p; },
    bowl(r) { const p = new Path2D(); p.arc(0, -r, r, 0, Math.PI); p.closePath(); return p; },
    moon(r) { const p = new Path2D(); p.arc(0, 0, r, Math.PI, 0); p.closePath(); return p; },
    ball(r) { const p = new Path2D(); p.arc(0, -r, r, 0, TAU); return p; },
    rect(w, h) { const p = new Path2D(); p.rect(-w / 2, -h, w, h); return p; },
    ring(r, th) { const p = new Path2D(); p.arc(0, 0, r, 0, TAU); p.arc(0, 0, r - th, 0, TAU, true); return p; },
    tri(s) { const p = new Path2D(); p.moveTo(0, -s); p.lineTo(s * 0.9, s * 0.55); p.lineTo(-s * 0.9, s * 0.55); p.closePath(); return p; },
  };
  function cylinder(c, w, h, body, top, ox = 0) {
    const b = P.cylBody(w, h), tp = P.cylTop(w, h);
    c.save(); c.translate(MP_SH, MP_SH); c.fillStyle = MP.blk; c.fill(b); c.fill(tp); c.restore();
    c.fillStyle = body; c.fill(b);
    // cylindrical shading band
    const g = c.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.72, 'rgba(0,0,0,0)'); g.addColorStop(0.73, 'rgba(21,21,21,0.18)'); g.addColorStop(1, 'rgba(21,21,21,0.18)');
    c.fillStyle = g; c.fill(b);
    c.lineWidth = 5; c.strokeStyle = MP.blk; c.lineJoin = 'round'; c.stroke(b);
    c.fillStyle = top; c.fill(tp); c.stroke(tp);
  }
  function ball(c, r, col) {
    const p = P.ball(r);
    ink(c, p, col);
    c.save(); c.clip(p);
    c.fillStyle = 'rgba(21,21,21,0.2)'; c.beginPath(); c.arc(r * 0.35, -r * 0.65, r * 1.05, 0, TAU); c.arc(-r * 0.15, -r * 1.15, r * 1.05, 0, TAU, true); c.fill('evenodd');
    c.restore();
    c.strokeStyle = MP.wht; c.lineWidth = r * 0.12; c.lineCap = 'round';
    c.beginPath(); c.arc(0, -r, r * 0.66, Math.PI * 1.08, Math.PI * 1.42); c.stroke();
  }
  function squig(c, x0, y0, len, amp, waves, lw, col, p0, p1 = 0, ang = 0, ph = 0) {
    if (p0 <= p1) return;
    c.save(); c.translate(x0, y0); c.rotate(ang);
    const path = () => {
      c.beginPath();
      const n = 90;
      for (let i = 0; i <= n; i++) {
        const u = lerp(p1, p0, i / n), x = u * len, y = amp * Math.sin(u * waves * TAU + ph);
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
    };
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.save(); c.translate(MP_SH * 0.7, MP_SH * 0.7); path(); c.strokeStyle = MP.blk; c.lineWidth = lw; c.stroke(); c.restore();
    path(); c.strokeStyle = col; c.lineWidth = lw; c.stroke();
    c.restore();
  }
  function zig(c, x0, y0, len, amp, n, lw, col, p, ang = 0) {
    if (p <= 0) return;
    c.save(); c.translate(x0, y0); c.rotate(ang);
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push([i / n * len, i % 2 ? -amp : amp]);
    const L = len * p, path = () => {
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) {
        if (pts[i][0] <= L) c.lineTo(pts[i][0], pts[i][1]);
        else { const a = pts[i - 1], b = pts[i], u = (L - a[0]) / (b[0] - a[0]); c.lineTo(lerp(a[0], b[0], u), lerp(a[1], b[1], u)); break; }
      }
    };
    c.lineCap = 'square'; c.lineJoin = 'miter';
    c.save(); c.translate(MP_SH * 0.7, MP_SH * 0.7); path(); c.strokeStyle = MP.blk; c.lineWidth = lw; c.stroke(); c.restore();
    path(); c.strokeStyle = col; c.lineWidth = lw; c.stroke();
    c.restore();
  }
  const MP_CONF_COLS = [MP.red, MP.blue, MP.yel, MP.mint, MP.hot, MP.lilac, MP.blk, MP.teal];
  function confettiPiece(c, k, s, col) {
    c.fillStyle = col;
    if (k === 0) c.fillRect(-s, -s * 0.35, s * 2, s * 0.7);
    else if (k === 1) { c.beginPath(); c.moveTo(0, -s); c.lineTo(s, s * 0.7); c.lineTo(-s, s * 0.7); c.closePath(); c.fill(); }
    else if (k === 2) { c.beginPath(); c.arc(0, 0, s * 0.7, 0, TAU); c.fill(); }
    else if (k === 3) { c.strokeStyle = col; c.lineWidth = s * 0.45; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i <= 10; i++) { const u = i / 10; const x = (u - 0.5) * s * 3, y = Math.sin(u * TAU * 1.5) * s * 0.5; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    else { c.strokeStyle = col; c.lineWidth = s * 0.4; c.beginPath(); c.moveTo(-s, 0); c.lineTo(s, 0); c.moveTo(0, -s); c.lineTo(0, s); c.stroke(); }
  }
  const MP_TITLE = 'MEMPHIS';
  const MP_TCOL = [MP.red, MP.yel, MP.blue, MP.mint, MP.hot, MP.lilac, MP.yel];
  const MP_BEAT = 0.5;

  MG.film({
    id: 'memphis', dur: 10, poster: 9.4,
    fonts: [['400 150px Bungee', MP_TITLE], ['400 34px Bungee', 'MILANO · 1981'], ['800 20px "JetBrains Mono"', 'ETTORE SOTTSASS · NATHALIE DU PASQUIER · MEMPHIS GROUP']],
    meta: {
      family: 'A', name: 'Memphis Design', sub: 'Postmodern Pop Pattern', era: '1981 — 1988',
      origin: 'A Milan design collective founded by Ettore Sottsass in December 1980 and launched at the 1981 Salone del Mobile; it threw out good-taste modernism for laminate patterns, clashing colours and toy-like geometry, and its look later flooded 1980s TV graphics and packaging.',
      works: 'Carlton room divider (Ettore Sottsass, 1981) · Bacterio laminate (Ettore Sottsass, 1978) · Gabon & Zambia patterns (Nathalie Du Pasquier, 1982) · Super lamp (Martine Bedin, 1981) · Saved by the Bell title graphics (NBC, 1989)',
      tech: ['Laminate patterns: squiggle, terrazzo, grid, dots', 'Hard offset shadows & black keylines', 'Squash-and-stretch bounce stacking'],
      accent: '#ff3c83',
      motionDNA: 'Bouncy and overshoot-heavy: shapes drop with squash and stretch, slide in past their mark and spring back, all locked to a synth-pop beat.',
      visualDNA: 'Pastel and primary clashes, black-and-white laminate patterns, squiggles, confetti terrazzo, zig-zags, cylinders, cones and half-moons with hard black shadows.',
      transitions: 'Pattern panel slide, spring pop, drop-and-bounce, palette clash flash, confetti burst',
      implementation: ['After Effects', 'Canvas 2D', 'Illustrator'],
      reproducibility: 'Fully procedural', loopable: false,
    },
    setup() {
      const r = rng(1981);
      const avoid = [[180, 120, 980, 900], [960, 330, 1880, 800]];
      const conf = [];
      while (conf.length < 46) {
        const x = 60 + r() * 1800, y = 50 + r() * 800;
        if (avoid.some(([a, b, c2, d]) => x > a && x < c2 && y > b && y < d) && r() > 0.12) continue;
        conf.push({ x, y, k: (r() * 5) | 0, s: 9 + r() * 10, col: MP_CONF_COLS[conf.length % MP_CONF_COLS.length], a: r() * TAU, spin: (r() - 0.5) * 30, d: r() * 0.18, ox: 960 + (r() - 0.5) * 60, oy: 540 + (r() - 0.5) * 60 });
      }
      return { conf };
    },
    draw(c, t, W, H, st) {
      // palette clash at the climax
      const clash = t >= 7.0 && t < 7.5 ? [MP.mint, MP.pink, MP.yel, MP.lilac][Math.floor((t - 7.0) / 0.125)] : MP.cream;
      c.fillStyle = clash; c.fillRect(0, 0, W, H);
      // hop: everything jumps on 7.0 and 7.5
      const hopY = t => { let y = 0; [7.0, 7.5].forEach(T => { const p = seg(t, T, T + 0.3); if (p > 0 && p < 1) y += 70 * 4 * p * (1 - p); }); return y; };
      const hopQ = t => { let q = 0; [7.3, 7.8].forEach(T => { if (t >= T) q += 0.12 * Math.exp(-(t - T) * 12) * Math.cos((t - T) * 28); }); return q; };
      const hy = hopY(t), hq = hopQ(t);
      const punch = [0.06, 0.5, 2.28, 2.53, 2.78, 3.03, 3.8, 4.78, 5.28, 7.3, 7.8, 8.0].reduce((a, T) => a + pulse(t, T, 14) * 0.012, 0);
      c.save(); c.translate(960, 540); c.scale(1 + punch, 1 + punch); c.rotate(punch * 0.15); c.translate(-960, -540);

      /* ---------- STAGE (from 3.2) ---------- */
      if (t >= 3.15) {
        // background pattern blocks
        const gp = spring(t - 3.2, 2.2, 0.45);
        c.save(); c.translate(540, 450); c.scale(gp, gp); c.rotate(-0.05 * (1 - Math.min(1, gp)));
        const panel = new Path2D(); panel.rect(-300, -300, 600, 600);
        ink(c, panel, pat(c, 'grid', 0, 0), { sh: 16 });
        c.restore();
        const cp = spring(t - 3.3, 2.0, 0.4);
        if (cp > 0) { c.save(); c.translate(880, 255); c.scale(cp, cp); const p = new Path2D(); p.arc(0, 0, 150, 0, TAU); ink(c, p, MP.pink, { sh: 14 }); c.restore(); }
        const mp = spring(t - 3.4, 1.8, 0.45);
        if (mp > 0) { c.save(); c.translate(1890, MP_FLOOR); c.scale(mp, mp); const p = new Path2D(); p.arc(0, 0, 215, Math.PI, Math.PI * 1.5); p.lineTo(0, 0); p.closePath(); ink(c, p, pat(c, 'dots'), { sh: 0 }); c.restore(); }
        // title backing slab
        const tb = E.outB(seg(t, 5.85, 6.15), 1.4);
        if (tb > 0) {
          c.save(); c.translate(1405, 455); c.rotate(-0.035); c.scale(tb, 1);
          const p = new Path2D(); p.rect(-450, -55, 900, 110);
          ink(c, p, pat(c, 'stripe'), { sh: 14 });
          c.restore();
        }
        // floor: terrazzo band
        const fp = E.outB(seg(t, 3.2, 3.5), 1.2);
        c.save(); c.translate(0, (1 - fp) * 260);
        c.fillStyle = pat(c, 'terr', 0, MP_FLOOR); c.fillRect(0, MP_FLOOR, W, H - MP_FLOOR + 10);
        c.fillStyle = MP.blk; c.fillRect(0, MP_FLOOR - 3, W, 7);
        c.restore();
      }

      /* ---------- confetti (burst 0.5, re-burst 7.0) ---------- */
      if (t >= 0.5) {
        st.conf.forEach((q, i) => {
          if (t < 3.15 && t > 1.0) return;
          const p = E.outC(seg(t, 0.5 + q.d, 1.05 + q.d));
          const p2 = t >= 7.0 ? seg(t, 7.0 + q.d * 0.5, 7.5 + q.d * 0.5) : 0;
          let x = lerp(q.ox, q.x, p), y = lerp(q.oy, q.y, p) - 120 * Math.sin(p * Math.PI) * 0.6;
          if (p2 > 0 && p2 < 1) { y -= 60 * Math.sin(p2 * Math.PI); x += (q.x - 960) * 0.06 * Math.sin(p2 * Math.PI); }
          const rot = q.a + q.spin * (1 - p) * 0.2 + (p2 > 0 ? (1 - Math.abs(1 - 2 * p2)) * q.spin * 0.05 : 0);
          if (t >= 3.15 && t < 3.6) { const k = E.outB(seg(t, 3.2 + q.d, 3.45 + q.d), 2); if (k <= 0) return; c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k); confettiPiece(c, q.k, q.s, q.col); c.restore(); return; }
          c.save(); c.translate(x, y); c.rotate(rot); confettiPiece(c, q.k, q.s, q.col); c.restore();
        });
      }

      /* ---------- HOOK (0 – 1.2) ---------- */
      if (t < 1.25) {
        const cp = spring(t - 0.04, 2.4, 0.38);
        if (cp > 0) { c.save(); c.translate(960, 540); c.scale(cp, cp); const p = new Path2D(); p.arc(0, 0, 300, 0, TAU); ink(c, p, MP.hot, { sh: 18 }); c.restore(); }
        const hp = E.outB(seg(t, 0.15, 0.4), 1.6);
        if (hp > 0) { c.save(); c.translate(960, 540); c.rotate(-0.3); c.scale(hp, hp); const p = P.moon(150); ink(c, p, pat(c, 'dots')); c.restore(); }
        squig(c, 380, 760, 1160, 46, 4.5, 30, MP.blue, E.ioC(seg(t, 0.25, 0.7)), E.inC(seg(t, 0.9, 1.25)), -0.12, t * 2);
        zig(c, 300, 260, 640, 34, 10, 22, MP.yel, E.outX(seg(t, 0.75, 0.95)), 0.06);
        const tr = E.outB(seg(t, 0.55, 0.8), 2);
        if (tr > 0) { c.save(); c.translate(1500, 300); c.rotate(0.4 + (1 - tr) * 2); c.scale(tr, tr); ink(c, P.tri(90), MP.mint); c.restore(); }
        const rg = E.outB(seg(t, 0.62, 0.86), 2);
        if (rg > 0) { c.save(); c.translate(420, 820); c.scale(rg, rg); ink(c, P.ring(70, 24), MP.yel); c.restore(); }
      }

      /* ---------- PATTERN PANELS (1.0 – 3.4) ---------- */
      if (t >= 0.98 && t < 3.45) {
        const pats = ['bact', 'dots', 'zig', 'terr'], fills = [null, null, null, null];
        for (let i = 0; i < 4; i++) {
          const tin = 1.0 + i * 0.25, tout = 3.0 + i * 0.06, dir = i % 2 ? 1 : -1;
          const pin = E.outB(seg(t, tin, tin + 0.28), 1.25), pout = E.inB(seg(t, tout, tout + 0.3), 1.3);
          if (pin <= 0) continue;
          const y = dir * H * (1 - pin) - dir * H * 1.1 * pout;
          c.save(); c.translate(i * 480, y);
          c.fillStyle = pat(c, pats[i], 0, t * 30 * dir); c.fillRect(0, 0, 482, H);
          c.fillStyle = MP.blk; c.fillRect(476, 0, 8, H);
          // hero shape per panel
          const T0 = 2.0 + i * 0.25, dr = mpDrop(t, T0, 700, 0.28);
          if (dr) {
            c.save(); c.translate(240, 760 - dr.y); c.scale(dr.sx, dr.sy);
            // floor disc shadow
            if (i === 0) cylinder(c, 220, 260, pat(c, 'stripe'), MP.red);
            else if (i === 1) { ink(c, P.cone(220, 330), MP.hot); c.save(); c.clip(P.cone(220, 330)); c.fillStyle = pat(c, 'grid'); c.globalAlpha = 0.9; c.fillRect(-110, -110, 220, 120); c.restore(); c.lineWidth = 5; c.strokeStyle = MP.blk; c.stroke(P.cone(220, 330)); }
            else if (i === 2) { c.translate(0, -10); ink(c, P.bowl(150), MP.yel); }
            else ball(c, 125, MP.red);
            c.restore();
          }
          c.restore();
        }
      }

      /* ---------- TOTEM (3.5 →) ---------- */
      if (t >= 3.5) {
        const X = 560;
        c.save(); c.translate(0, -hy);
        const sq = (cx, by) => { c.translate(cx, by); c.scale(1 + hq * 0.8, 1 - hq); };
        // cone leaning on the right (swings in about its base)
        const cr = spring(t - 5.25, 1.6, 0.35);
        if (t >= 5.25) {
          c.save(); sq(820, MP_FLOOR); c.rotate(lerp(-1.4, 0.16, cr));
          const p = P.cone(170, 320); ink(c, p, MP.mint);
          c.save(); c.clip(p); c.fillStyle = pat(c, 'zig'); c.fillRect(-90, -150, 180, 60); c.fillRect(-90, -60, 180, 30); c.restore();
          c.lineWidth = 5; c.strokeStyle = MP.blk; c.stroke(p);
          c.restore();
        }
        // cylinder
        const d1 = mpDrop(t, 3.5, 900, 0.3);
        if (d1) { c.save(); sq(X, MP_FLOOR); c.translate(0, -d1.y); c.scale(d1.sx, d1.sy); cylinder(c, 270, 250, pat(c, 'bact'), MP.red); c.restore(); }
        const top1 = MP_FLOOR - 250;
        // slab slides in from the left and settles
        if (t >= 4.0) {
          const sp = E.outB(seg(t, 4.0, 4.3), 2.2), wob = Math.exp(-Math.max(0, t - 4.3) * 7) * Math.sin(Math.max(0, t - 4.3) * 24) * 0.06;
          c.save(); sq(X, MP_FLOOR); c.translate(lerp(-900, 0, sp), top1 - MP_FLOOR + 6); c.rotate(wob + (1 - sp) * -0.3);
          ink(c, P.rect(380, 64), pat(c, 'zig'));
          c.restore();
        }
        const top2 = top1 + 6 - 64;
        // sphere drops into the bowl (drawn before the bowl so the bowl front hides it)
        const d3 = mpDrop(t, 5.0, 900, 0.28);
        if (d3) { c.save(); sq(X + 10, MP_FLOOR); c.translate(0, top2 - MP_FLOOR - 150 + 62 - d3.y); c.scale(d3.sx, d3.sy); ball(c, 84, MP.blue); c.restore(); }
        const d2 = mpDrop(t, 4.5, 900, 0.28);
        if (d2) {
          c.save(); sq(X, MP_FLOOR); c.translate(0, top2 - MP_FLOOR - d2.y); c.scale(d2.sx, d2.sy);
          const p = P.bowl(150); ink(c, p, MP.yel);
          c.save(); c.clip(p); c.fillStyle = pat(c, 'check'); c.fillRect(-160, -60, 320, 22); c.restore();
          c.lineWidth = 5; c.strokeStyle = MP.blk; c.stroke(p);
          c.restore();
        }
        // ring + small triangle
        const rg = E.outB(seg(t, 5.5, 5.75), 2.2);
        if (rg > 0) { c.save(); c.translate(260, 250); c.rotate(0.3); c.scale(rg, rg); ink(c, P.ring(62, 22), MP.red); c.restore(); }
        const tr = E.outB(seg(t, 5.62, 5.86), 2.2);
        if (tr > 0) { c.save(); c.translate(930, 600); c.rotate(-0.3 + (1 - tr) * 3); c.scale(tr, tr); ink(c, P.tri(48), MP.yel); c.restore(); }
        c.restore();
        // squiggles + zigzag frame the composition
        squig(c, 120, 110, 560, 26, 3.5, 22, MP.hot, E.ioC(seg(t, 5.5, 5.9)), 0, 0.05);
        zig(c, 1090, 842, 560, 16, 14, 14, MP.teal, E.outX(seg(t, 5.75, 6.0)), 0);
        squig(c, 1250, 120, 520, 20, 3, 16, MP.blue, E.ioC(seg(t, 5.65, 6.0)), 0, -0.04, 1);
      }

      /* ---------- TITLE (6.0 →) ---------- */
      if (t >= 6.0) {
        c.font = `400 150px ${BUNGEE}`;
        const widths = [...MP_TITLE].map(ch => c.measureText(ch).width), total = widths.reduce((a, b) => a + b, 0);
        let x = 1405 - total / 2;
        for (let i = 0; i < MP_TITLE.length; i++) {
          const ch = MP_TITLE[i], w = widths[i], T = 6.0 + i * 0.125;
          const dr = mpDrop(t, T, 600, 0.22);
          if (dr) {
            const lift = dr.y + hopY(t - 0.06 * i), q = hopQ(t - 0.06 * i);
            const col = t >= 7.0 && t < 7.5 ? MP_TCOL[(i + Math.floor((t - 7.0) / 0.125) + 1) % 7] : MP_TCOL[i];
            c.save(); c.translate(x + w / 2, 610 - lift); c.scale(dr.sx * (1 + q * 0.8), dr.sy * (1 - q)); c.rotate(((i % 2 ? 1 : -1) * 0.04));
            text(c, ch, MP_SH, MP_SH, { font: BUNGEE, size: 150, align: 'center', color: MP.blk });
            text(c, ch, 0, 0, { font: BUNGEE, size: 150, align: 'center', color: col, stroke: MP.blk, lw: 9 });
            text(c, ch, 0, 0, { font: BUNGEE, size: 150, align: 'center', color: col });
            c.restore();
          }
          x += w;
        }
        // subtitle pill
        const pp = E.outB(seg(t, 7.75, 8.05), 2);
        if (pp > 0) {
          c.save(); c.translate(1405, 700); c.scale(pp, pp); c.rotate(0.02);
          const p = new Path2D(); const w = 430, h = 70; p.roundRect ? p.roundRect(-w / 2, -h / 2, w, h, h / 2) : p.rect(-w / 2, -h / 2, w, h);
          ink(c, p, MP.blk, { sh: 10, lw: 0 });
          text(c, 'MILANO · 1981', 0, 13, { font: BUNGEE, size: 34, align: 'center', color: MP.yel, ls: 2 });
          c.restore();
        }
        const sa = seg(t, 8.05, 8.4);
        if (sa > 0) {
          const s = 'ETTORE SOTTSASS · NATHALIE DU PASQUIER · MEMPHIS GROUP', n = Math.floor(s.length * sa);
          text(c, s.slice(0, n), 1405, 776, { font: MONO, weight: 800, size: 17, align: 'center', ls: 1.5, color: MP.blk });
        }
      }
      c.restore();
      grain(c, W, H, t, 0.05, 'multiply');
    },
    score(A) {
      const B = MP_BEAT;
      const boing = (t, f = 300, g = 0.12) => { A.osc(t, { f, f2: f * 2.6, glide: 0.12, dur: 0.22, g, type: 'sine' }); A.osc(t + 0.05, { f: f * 2.6, f2: f * 1.2, glide: 0.18, dur: 0.24, g: g * 0.5, vib: [22, 30] }); };
      const thunk = (t, g = 0.4) => { A.osc(t, { f: 180, f2: 60, glide: 0.1, dur: 0.18, g, type: 'triangle' }); A.noise(t, { type: 'lowpass', f: 900, dur: 0.06, g: g * 0.3 }); };
      // hook
      boing(0.04, 220, 0.16);
      A.osc(0.15, { type: 'square', f: 520, f2: 780, glide: 0.08, dur: 0.1, g: 0.05, lp: 3000 });
      A.osc(0.25, { f: 400, dur: 0.45, g: 0.07, vib: [9, 40] });
      A.noise(0.5, { type: 'highpass', f: 5000, dur: 0.5, g: 0.08, swell: 0.1 });
      [84, 88, 91, 96].forEach((m, i) => A.bell(0.5 + i * 0.04, midi(m), { g: 0.035, dur: 0.6 }));
      A.osc(0.55, { type: 'square', f: 880, f2: 1320, glide: 0.05, dur: 0.08, g: 0.04, lp: 4000 });
      A.osc(0.62, { type: 'triangle', f: 660, f2: 990, glide: 0.05, dur: 0.1, g: 0.08 });
      A.noise(0.75, { type: 'bandpass', f: 2500, f2: 6000, q: 3, dur: 0.18, g: 0.08 });
      // chord progression (C · Am · F · G ...) — one chord per bar of 2 beats
      const prog = [[48, [60, 64, 67]], [45, [57, 60, 64]], [41, [57, 60, 65]], [43, [55, 59, 62]]];
      for (let k = 0; k < 14; k++) {
        const t = 1.0 + k * B;
        if (t >= 8.0) break;
        const bar = Math.floor(k / 2) % 4, [root, ch] = prog[bar];
        A.kick(t, 0.5);
        if (k % 2 === 1) { A.snare(t, 0.16, { rev: 0.25 }); A.clap(t, 0.14); }
        A.hat(t + B / 2, 0.06, false, { pan: 0.3 });
        A.hat(t + B / 4, 0.025, false, { pan: -0.3 });
        A.hat(t + 3 * B / 4, 0.025, false, { pan: -0.3 });
        // octave bass in 8ths
        [0, 1, 2, 3].forEach(j => A.osc(t + j * B / 4, { type: 'square', f: midi(root - 12 + (j % 2 ? 12 : 0)), dur: 0.11, g: 0.05, lp: 900, lp2: 300, lpT: 0.1 }));
        // offbeat stabs
        A.chord(t + B / 2, ch.map(m => m + 12), { type: 'square', dur: 0.12, g: 0.016, lp: 2600, lp2: 800, lpT: 0.12, spread: 6, width: 1 });
      }
      // panels: ascending bloops
      [72, 76, 79, 84].forEach((m, i) => { A.osc(1.0 + i * 0.25, { type: 'square', f: midi(m), dur: 0.14, g: 0.05, lp: 3000 }); A.whoosh(0.96 + i * 0.25, 0.2, { f1: 800, f2: 3000, g: 0.05, pan: i % 2 ? 0.4 : -0.4 }); });
      // hero shapes land in panels
      [2.28, 2.53, 2.78, 3.03].forEach((t, i) => { thunk(t, 0.3); boing(t, [260, 330, 390, 440][i], 0.09); });
      A.whoosh(2.98, 0.45, { f1: 3000, f2: 400, g: 0.12 });
      // stage pops
      [3.2, 3.3, 3.4].forEach((t, i) => A.osc(t, { f: [523, 659, 784][i], f2: [523, 659, 784][i] * 1.5, glide: 0.06, dur: 0.15, g: 0.06 }));
      // totem
      thunk(3.8, 0.45); boing(3.8, 200, 0.1);
      A.whoosh(4.0, 0.3, { f1: 400, f2: 2500, g: 0.08, pan: -0.5 }); A.osc(4.3, { type: 'triangle', f: 500, f2: 380, dur: 0.12, g: 0.1 });
      thunk(4.78, 0.4); boing(4.78, 300, 0.1);
      thunk(5.28, 0.35); boing(5.28, 420, 0.14);
      A.osc(5.25, { f: 900, f2: 300, glide: 0.3, dur: 0.35, g: 0.06, vib: [14, 30] });
      A.osc(5.5, { type: 'square', f: 1046, dur: 0.06, g: 0.04, lp: 4000 }); A.osc(5.62, { type: 'square', f: 1318, dur: 0.06, g: 0.04, lp: 4000 });
      A.osc(5.5, { f: 600, dur: 0.4, g: 0.05, vib: [10, 50] });
      A.noise(5.75, { type: 'bandpass', f: 1500, f2: 5000, q: 4, dur: 0.22, g: 0.06 });
      A.riser(5.0, 1.0, { g: 0.06, f: 220 });
      // title letters — arpeggio up
      [60, 64, 67, 69, 72, 76, 79].forEach((m, i) => { const t = 6.0 + i * 0.125 + 0.22; A.pluck(t, midi(m + 12), { dur: 0.5, g: 0.16, bright: 0.85 }); A.osc(t, { type: 'square', f: midi(m), dur: 0.08, g: 0.03, lp: 2500 }); });
      // climax hops + clash
      [7.0, 7.5].forEach(t => {
        A.chord(t, [48, 60, 64, 67, 72], { type: 'sawtooth', dur: 0.35, g: 0.025, lp: 4000, lp2: 900, lpT: 0.3, spread: 9, width: 1 });
        A.noise(t, { type: 'highpass', f: 6000, dur: 0.5, g: 0.05 });
        boing(t, 330, 0.1);
        thunk(t + 0.3, 0.35);
      });
      [7.0, 7.125, 7.25, 7.375].forEach((t, i) => A.osc(t, { type: 'square', f: midi([84, 88, 91, 96][i]), dur: 0.07, g: 0.035, lp: 5000 }));
      // fill + final
      [7.75, 7.8125, 7.875, 7.9375].forEach((t, i) => A.osc(t, { type: 'triangle', f: [300, 260, 220, 180][i], f2: 90, glide: 0.08, dur: 0.12, g: 0.18 }));
      A.kick(8.0, 0.6);
      A.noise(8.0, { type: 'highpass', f: 5000, dur: 1.2, g: 0.06 });
      A.chord(8.0, [48, 55, 60, 64, 67, 71], { type: 'sawtooth', dur: 1.95, g: 0.02, a: 0.01, hold: true, rel: 1.0, lp: 3000, lp2: 900, lpT: 1.6, spread: 10, rev: 0.4, width: 1.2 });
      A.osc(8.0, { type: 'square', f: midi(36), dur: 1.0, g: 0.06, lp: 400 });
      A.osc(7.75, { f: 260, f2: 780, glide: 0.25, dur: 0.3, g: 0.08 });
      [8.05, 8.15, 8.25, 8.35].forEach((t, i) => A.osc(t, { type: 'square', f: midi([79, 84, 88, 91][i]), dur: 0.05, g: 0.025, lp: 5000 }));
      A.bell(8.4, midi(84), { g: 0.05, dur: 1.4 });
    },
  });

  /* =====================================================================
     C · Y2K GRAPHIC DESIGN — per-pixel iridescent chrome metaballs,
     a blurred-glyph field for the bubble-letter morph, candy plastic
     capsules and a HUD layer in pixel micro-type.
     ===================================================================== */
  const YK = { bg0: '#f3f6f9', bg1: '#c7d0da', blue: '#1f4bff', ink: '#0d1430', orange: '#ff6a13', lime: '#c8ff2e' };
  const PIX = 'Silkscreen, "JetBrains Mono", monospace';
  const RUBIK = 'Rubik, Archivo, sans-serif';
  const YB = 60 / 140;                 // 140 bpm
  const YT = { land: 1.5 * YB, split: 2 * YB, groove: 3 * YB, capOut: 8 * YB, conv: 13 * YB, drop: 14 * YB, morph: 16 * YB, lock: 17 * YB, shine: 19 * YB };
  const CANDY = [['BONDI', '#06a7c9'], ['TANGERINE', '#ff8a1a'], ['LIME', '#86dc2c'], ['GRAPE', '#8b52dc'], ['STRAWBERRY', '#ff3f73']];
  const YQ = 0.25, YQW = 480, YQH = 270;   // glyph-field resolution (quarter stage)
  const yGlyph = {};
  function glyphField(str) {
    if (yGlyph[str]) return yGlyph[str];
    if (document.fonts && !document.fonts.check('900 100px Rubik')) return null;
    const cv = offscreen(YQW, YQH), g = cv.getContext('2d');
    g.scale(YQ, YQ);
    g.font = `900 ${str.length > 3 ? 380 : 420}px ${RUBIK}`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if ('letterSpacing' in g) g.letterSpacing = (str.length > 3 ? 14 : 30) + 'px';
    g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineJoin = 'round'; g.lineWidth = 8;
    g.fillText(str, 960, 470); g.strokeText(str, 960, 470);
    const d = g.getImageData(0, 0, YQW, YQH).data;
    let A = new Float32Array(YQW * YQH), B = new Float32Array(YQW * YQH);
    for (let i = 0; i < A.length; i++) A[i] = d[i * 4 + 3] / 255;
    const R = 3;
    for (let pass = 0; pass < 3; pass++) {
      for (let y = 0; y < YQH; y++) { let acc = 0; for (let x = -R; x <= R; x++) acc += A[y * YQW + clamp(x, 0, YQW - 1)]; for (let x = 0; x < YQW; x++) { B[y * YQW + x] = acc / (2 * R + 1); acc += A[y * YQW + Math.min(x + R + 1, YQW - 1)] - A[y * YQW + Math.max(x - R, 0)]; } }
      for (let x = 0; x < YQW; x++) { let acc = 0; for (let y = -R; y <= R; y++) acc += B[clamp(y, 0, YQH - 1) * YQW + x]; for (let y = 0; y < YQH; y++) { A[y * YQW + x] = acc / (2 * R + 1); acc += B[Math.min(y + R + 1, YQH - 1) * YQW + x] - B[Math.max(y - R, 0) * YQW + x]; } }
    }
    yGlyph[str] = A;
    return A;
  }
  const sampleQ = (A, x, y) => {
    const fx = x * YQ - 0.5, fy = y * YQ - 0.5, i = Math.floor(fx), j = Math.floor(fy);
    if (i < 0 || j < 0 || i >= YQW - 1 || j >= YQH - 1) return 0;
    const u = fx - i, v = fy - j, k = j * YQW + i;
    return (A[k] * (1 - u) + A[k + 1] * u) * (1 - v) + (A[k + YQW] * (1 - u) + A[k + YQW + 1] * u) * v;
  };
  // the chrome environment: a horizon map bent by the surface normal
  function chromeShade(nx, ny, nz, y, t, sweep) {
    const rx = 2 * nz * nx, ry = 2 * nz * ny, rz = 2 * nz * nz - 1;
    const u = ry * 0.9 + (y - 478) / 165 * 0.8;
    let r, g, b;
    if (u < 0) {              // sky: electric blue at the horizon → white at the zenith
      const k = Math.pow(clamp(-u / 1.0), 0.75);
      r = lerp(38, 248, k); g = lerp(92, 251, k); b = lerp(255, 255, k);
      const z = clamp((-u - 1.0) / 0.5); r = lerp(r, 150, z * 0.6); g = lerp(g, 170, z * 0.6);
      const st = Math.exp(-Math.pow((u + 0.62) / 0.07, 2)) * 0.55 + Math.exp(-Math.pow((u + 0.2) / 0.035, 2)) * 0.3;
      r += (255 - r) * st; g += (255 - g) * st; b += (255 - b) * st;
    } else if (u < 0.06) {    // horizon: near-black navy band
      const k = u / 0.06; r = lerp(18, 6, k); g = lerp(22, 8, k); b = lerp(60, 24, k);
    } else {                  // ground: deep violet → lilac → pearl
      const k = clamp((u - 0.06) / 0.95);
      r = lerp(24, 238, Math.pow(k, 1.1)); g = lerp(16, 226, Math.pow(k, 1.1)); b = lerp(52, 250, Math.pow(k, 1.1));
      const gs = Math.exp(-Math.pow((u - 0.5) / 0.1, 2)) * 0.35; r += (255 - r) * gs; g += (255 - g) * gs; b += (255 - b) * gs;
      if (u < 0.085) { const s = 1 - (u - 0.06) / 0.025; r = lerp(r, 255, s * 0.9); g = lerp(g, 255, s * 0.9); b = lerp(b, 255, s * 0.9); }
    }
    // thin-film iridescence, strongest at grazing angles
    const f = Math.pow(1 - nz, 1.4), hue = 1.3 * (1 - nz) + u * 0.35 + t * 0.08;
    const ir = 0.5 + 0.5 * Math.cos(TAU * hue), ig = 0.5 + 0.5 * Math.cos(TAU * (hue + 0.33)), ib = 0.5 + 0.5 * Math.cos(TAU * (hue + 0.67));
    const m = 0.06 + 0.5 * f;
    r = lerp(r, 120 + 135 * ir, m); g = lerp(g, 110 + 145 * ig, m); b = lerp(b, 140 + 115 * ib, m);
    // key + fill speculars
    const lx = -0.42, ly = -0.62, lz = 0.66;
    const d1 = Math.max(0, rx * lx + ry * ly + rz * lz);
    const sp = Math.pow(d1, 90) * 1.6 + Math.pow(d1, 14) * 0.22;
    const d2 = Math.max(0, rx * 0.55 + ry * 0.3 + rz * 0.78), sp2 = Math.pow(d2, 60) * 0.7;
    let w = sp + sp2;
    if (sweep !== null) w += Math.exp(-sweep * sweep * 0.0004) * 0.75;
    return [r + (255 - r) * Math.min(1, w), g + (255 - g) * Math.min(1, w), b + (255 - b) * Math.min(1, w)];
  }
  function blobRender(c, st, t, balls, txt) {
    const s = pxScale(c);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    balls.forEach(B => { if (B.w <= 0.001) return; const e = B.r * 2.3; x0 = Math.min(x0, B.x - e * B.sx); x1 = Math.max(x1, B.x + e * B.sx); y0 = Math.min(y0, B.y - e * B.sy); y1 = Math.max(y1, B.y + e * B.sy); });
    if (txt && txt.w > 0) { x0 = Math.min(x0, 150); x1 = Math.max(x1, 1770); y0 = Math.min(y0, 150); y1 = Math.max(y1, 800); }
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(1920, x1); y1 = Math.min(1080, y1);
    if (x1 <= x0 || y1 <= y0) return;
    const px0 = Math.floor(x0 * s), py0 = Math.floor(y0 * s), bw = Math.ceil(x1 * s) - px0, bh = Math.ceil(y1 * s) - py0;
    if (!st.yb || st.yb.F.length < bw * bh) st.yb = { F: new Float32Array(bw * bh * 1.2 | 0) };
    if (!st.ycv || st.ycv.width < bw || st.ycv.height < bh) { st.ycv = offscreen(Math.max(bw, st.ycv ? st.ycv.width : 0), Math.max(bh, st.ycv ? st.ycv.height : 0)); st.ycg = st.ycv.getContext('2d'); }
    const F = st.yb.F, inv = 1 / s;
    const A0 = txt && txt.w > 0 ? glyphField(txt.a) : null, A1 = txt && txt.w > 0 && txt.m > 0 ? glyphField(txt.b) : null;
    const nb = balls.length, bx = balls.map(B => B.x), by = balls.map(B => B.y), br = balls.map(B => B.r * B.r * B.w), bsx = balls.map(B => 1 / (B.sx * B.sx)), bsy = balls.map(B => 1 / (B.sy * B.sy));
    for (let j = 0; j < bh; j++) {
      const y = (py0 + j + 0.5) * inv;
      for (let i = 0; i < bw; i++) {
        const x = (px0 + i + 0.5) * inv;
        let f = 0;
        for (let k = 0; k < nb; k++) { const dx = x - bx[k], dy = y - by[k]; f += br[k] / (dx * dx * bsx[k] + dy * dy * bsy[k] + 1); }
        if (A0) { let a = sampleQ(A0, x, y); if (A1) a = lerp(a, sampleQ(A1, x, y), txt.m); f += txt.w * 2.05 * a; }
        F[j * bw + i] = f;
      }
    }
    const img = st.ycg.createImageData(bw, bh), d = img.data, hs = 120 * s;
    const H = f => (f > 1 ? Math.sqrt(1 - 1 / f) : 0);
    const sw = txt && txt.sweep !== undefined ? txt.sweep : null;
    for (let j = 1; j < bh - 1; j++) {
      for (let i = 1; i < bw - 1; i++) {
        const k = j * bw + i, f = F[k];
        if (f < 0.75) continue;
        const fl = F[k - 1], fr = F[k + 1], fu = F[k - bw], fd = F[k + bw];
        const gx = (fr - fl) / 2, gy = (fd - fu) / 2, gm = Math.hypot(gx, gy) + 1e-6;
        const cov = clamp(0.5 + (f - 1) / gm);
        if (cov <= 0) continue;
        let hx = (H(fr) - H(fl)) * 0.5 * hs, hy = (H(fd) - H(fu)) * 0.5 * hs;
        if (f < 1.02) { const e = Math.sqrt(hx * hx + hy * hy) + 1e-6; hx = gx / gm * Math.max(e, 3); hy = gy / gm * Math.max(e, 3); }
        const nl = Math.hypot(hx, hy, 1), nx = -hx / nl, ny = -hy / nl, nz = 1 / nl;
        const y = (py0 + j + 0.5) * inv, x = (px0 + i + 0.5) * inv;
        const col = chromeShade(nx, ny, nz, y, t, sw === null ? null : x + (y - 470) * 0.45 - sw);
        const n = k * 4;
        d[n] = col[0]; d[n + 1] = col[1]; d[n + 2] = col[2]; d[n + 3] = cov * 255;
      }
    }
    st.ycg.clearRect(0, 0, st.ycv.width, st.ycv.height);
    st.ycg.putImageData(img, 0, 0);
    c.save();
    c.shadowColor = 'rgba(16,34,96,0.32)'; c.shadowBlur = 50 * s; c.shadowOffsetY = 34 * s;
    c.drawImage(st.ycv, 0, 0, bw, bh, px0 * inv, py0 * inv, bw * inv, bh * inv);
    c.restore();
  }
  function star4(c, x, y, r, a = 1, rot = 0) {
    if (r <= 0.5 || a <= 0) return;
    c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = a;
    const g = c.createRadialGradient(0, 0, 0, 0, 0, r * 1.1);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.3, 'rgba(190,220,255,0.35)'); g.addColorStop(1, 'rgba(190,220,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 1.1, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath();
    for (let i = 0; i < 4; i++) {
      const an = i * Math.PI / 2;
      c.lineTo(Math.cos(an) * r, Math.sin(an) * r);
      c.quadraticCurveTo(0, 0, Math.cos(an + Math.PI / 2) * r, Math.sin(an + Math.PI / 2) * r);
    }
    c.fill();
    c.restore();
  }
  function capsule(c, x, y, w, h, col, label, a, tilt, t) {
    c.save(); c.translate(x, y); c.rotate(tilt); c.globalAlpha = a;
    const r = w / 2;
    rrect(c, -w / 2, -h / 2, w, h, r);
    const g = c.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, col + 'f0'); g.addColorStop(0.18, col + '9a'); g.addColorStop(0.55, col + '70'); g.addColorStop(0.85, col + 'b0'); g.addColorStop(1, col + 'f4');
    c.fillStyle = g; c.fill();
    c.save(); c.clip();
    // striated plastic
    c.globalAlpha = a * 0.22; c.fillStyle = '#ffffff';
    for (let sx = -w / 2 + 4; sx < w / 2; sx += 9) c.fillRect(sx, -h / 2, 2.5, h);
    c.globalAlpha = a;
    // gloss: top half-pill + lower bounce light
    const gl = c.createLinearGradient(0, -h / 2, 0, -h / 2 + h * 0.4);
    gl.addColorStop(0, 'rgba(255,255,255,0.85)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gl; rrect(c, -w / 2 + 12, -h / 2 + 8, w - 24, h * 0.4, (w - 24) / 2); c.fill();
    const bl = c.createRadialGradient(0, h / 2 - 20, 0, 0, h / 2 - 20, w * 0.7);
    bl.addColorStop(0, 'rgba(255,255,255,0.45)'); bl.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = bl; c.fillRect(-w / 2, 0, w, h / 2);
    c.restore();
    c.lineWidth = 3; c.strokeStyle = 'rgba(13,20,48,0.35)'; rrect(c, -w / 2, -h / 2, w, h, r); c.stroke();
    c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.9)'; rrect(c, -w / 2 + 5, -h / 2 + 5, w - 10, h - 10, r - 5); c.stroke();
    text(c, label, 0, h / 2 + 46, { font: PIX, size: 20, align: 'center', color: YK.ink, ls: 2 });
    text(c, '0' + (CANDY.findIndex(q => q[0] === label) + 1) + '/05', 0, h / 2 + 72, { font: PIX, size: 14, align: 'center', color: 'rgba(13,20,48,0.55)', ls: 2 });
    c.restore();
  }
  function lensRings(c, t, cx, cy, sc, a) {
    if (a <= 0 || sc <= 0) return;
    c.save(); c.translate(cx, cy); c.globalAlpha = a;
    c.strokeStyle = 'rgba(31,75,255,0.55)'; c.lineWidth = 1.5;
    [300, 330, 470].forEach((R, i) => { c.beginPath(); c.arc(0, 0, R * sc, 0, TAU); c.setLineDash(i === 1 ? [3, 9] : []); c.stroke(); });
    c.setLineDash([]);
    // tick ring
    c.save(); c.rotate(t * 0.25);
    c.beginPath();
    for (let k = 0; k < 120; k++) { const an = k * TAU / 120, L = k % 10 === 0 ? 22 : 9; c.moveTo(Math.cos(an) * 390 * sc, Math.sin(an) * 390 * sc); c.lineTo(Math.cos(an) * (390 + L) * sc, Math.sin(an) * (390 + L) * sc); }
    c.strokeStyle = 'rgba(13,20,48,0.5)'; c.lineWidth = 2; c.stroke();
    c.restore();
    // iridescent flare ring
    if (c.createConicGradient) {
      const g = c.createConicGradient(t * 0.6, 0, 0);
      ['#ff7ad9', '#7af2ff', '#c8ff2e', '#ffd36a', '#a98bff', '#ff7ad9'].forEach((q, i) => g.addColorStop(i / 5, q));
      c.strokeStyle = g; c.lineWidth = 6 * sc; c.globalAlpha = a * 0.8;
      c.beginPath(); c.arc(0, 0, 540 * sc, 0, TAU); c.stroke();
    }
    c.restore();
  }
  function hud(c, t, a, lock) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    const br = (x, y, sx, sy) => { c.beginPath(); c.moveTo(x, y + sy * 46); c.lineTo(x, y); c.lineTo(x + sx * 46, y); c.stroke(); };
    c.strokeStyle = YK.ink; c.lineWidth = 3;
    const m = lerp(90, 60, lock);
    br(m, m, 1, 1); br(1920 - m, m, -1, 1); br(m, 1080 - m, 1, -1); br(1920 - m, 1080 - m, -1, -1);
    // crosshair
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(13,20,48,0.6)';
    const cx = 960, cy = 540;
    c.beginPath(); c.moveTo(cx - 30, cy); c.lineTo(cx - 10, cy); c.moveTo(cx + 10, cy); c.lineTo(cx + 30, cy); c.moveTo(cx, cy - 30); c.lineTo(cx, cy - 10); c.moveTo(cx, cy + 10); c.lineTo(cx, cy + 30); c.stroke();
    const n = Math.floor(t * 24);
    text(c, 'SYS.2000 // ENV_CHROME', m + 16, m + 30, { font: PIX, size: 16, color: YK.ink, ls: 1 });
    text(c, `X ${String(960 + ((hash(n) * 400) | 0) * (1 - lock)).padStart(4, '0')}  Y ${String(540 + ((hash(n + 3) * 200) | 0) * (1 - lock)).padStart(4, '0')}`, 1920 - m - 16, m + 30, { font: PIX, size: 16, align: 'right', color: YK.ink, ls: 1 });
    text(c, 'BLOBJECT_ENGINE v2.0', m + 16, 1080 - m - 18, { font: PIX, size: 16, color: YK.ink, ls: 1 });
    // barcode
    c.fillStyle = YK.ink;
    let bx = 1920 - m - 220;
    for (let k = 0; k < 34; k++) { const w = 1 + ((hash(k * 7.3) * 3) | 0); c.fillRect(bx, 1080 - m - 40, w, 26); bx += w + 2 + ((hash(k * 3.1) * 3) | 0); }
    c.restore();
  }

  MG.film({
    id: 'y2k', dur: 10, poster: 9.4,
    fonts: [['900 420px Rubik', 'Y2K 2000'], ['400 20px Silkscreen', 'SYS.2000//ENV_CHROME XY0123456789 BLOBJECT_ENGINE v2.0 GRAPHIC DESIGN 1997—2004 BONDI TANGERINE LIME GRAPE STRAWBERRY/'], ['700 20px Silkscreen', 'Y2K GRAPHIC DESIGN 1997—2004']],
    meta: {
      family: 'A', name: 'Y2K Graphic Design', sub: 'Chrome Tech-Optimism', era: '1997 — 2004',
      origin: 'Millennium-era graphics fused tech optimism with the new 3D and vector tools: liquid chrome type, translucent candy plastic popularised by the 1998 iMac G3, HUD-like grids and pixel fonts, pushed furthest by Sheffield studio The Designers Republic.',
      works: 'iMac G3 Bondi Blue (Apple, 1998) · Wipeout 2097 packaging & HUD (The Designers Republic, 1996) · Warp Records sleeves (The Designers Republic, 1990s) · Sony PlayStation 2 launch identity (2000) · Windows XP Luna theme (2001)',
      tech: ['Environment-mapped liquid chrome', 'Translucent candy plastic', 'Pixel micro-type & HUD grids'],
      accent: '#1f4bff',
      motionDNA: 'Liquid and snappy: chrome blobs drop, split and orbit like mercury, candy capsules spring into line, HUD markers snap, and blobs fuse into bubble letters on the drop.',
      visualDNA: 'Iridescent chrome with a dark horizon line, ice-silver backgrounds, translucent aqua and candy plastics, lens rings, crosshairs, barcodes, 4-point star sparkles and tiny pixel type.',
      transitions: 'Mercury split, capsule carousel, blob converge, white flash, gooey glyph morph, shine sweep',
      implementation: ['Cinema 4D / 3ds Max', 'Illustrator + Photoshop', 'Canvas 2D'],
      reproducibility: 'Fully procedural', loopable: false,
    },
    setup() {
      const r = rng(2000);
      const sparks = Array.from({ length: 26 }, () => ({ x: 120 + r() * 1680, y: 90 + r() * 900, s: 8 + r() * 22, ph: r() * 10, sp: 2 + r() * 4 }));
      return { sparks };
    },
    draw(c, t, W, H, st) {
      // ---- background ----
      const bg = c.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, YK.bg0); bg.addColorStop(0.62, '#dde3ea'); bg.addColorStop(1, YK.bg1);
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      // dot grid
      const gA = E.outC(seg(t, 0.1, 0.8));
      c.fillStyle = `rgba(31,58,120,${0.2 * gA})`;
      for (let y = 30; y < H; y += 36) for (let x = 30; x < W; x += 36) c.fillRect(x - 1, y - 1, 2.5, 2.5);
      // perspective floor grid (fades in)
      const fg = E.outC(seg(t, 0.3, 1.2));
      if (fg > 0) {
        c.save(); c.globalAlpha = fg * 0.5; c.strokeStyle = 'rgba(31,75,255,0.45)'; c.lineWidth = 1.2;
        const hz = 760;
        c.beginPath();
        for (let k = -16; k <= 16; k++) { c.moveTo(960 + k * 40, hz); c.lineTo(960 + k * 260, H); }
        for (let k = 0; k < 9; k++) { const y = hz + Math.pow(k / 8, 2) * (H - hz) + ((t * 40) % 40) * Math.pow(k / 8, 2) * 0.5; c.moveTo(0, y); c.lineTo(W, y); }
        c.stroke(); c.restore();
      }
      // tDR-style super-graphic: orange block + micro type
      const ob = E.outX(seg(t, 1.3, 1.55));
      if (ob > 0) {
        c.fillStyle = YK.orange; c.fillRect(0, 128, 420 * ob, 46);
        c.save(); c.beginPath(); c.rect(0, 128, 420 * ob, 46); c.clip();
        text(c, 'PROTOTYPE_SERIES >>> 2000AD', 24, 159, { font: PIX, size: 18, color: '#fff', ls: 2 });
        c.restore();
        c.fillStyle = YK.blue; c.fillRect(1920 - 300 * ob, 906, 300 * ob, 30);
        c.save(); c.beginPath(); c.rect(1920 - 300 * ob, 906, 300, 30); c.clip();
        text(c, 'FUTURE IS NOW ++', 1920 - 284, 928, { font: PIX, size: 15, color: '#fff', ls: 2 });
        c.restore();
      }

      // ---- lens rings ----
      const ringIn = E.outX(seg(t, 0.0, 0.7)), ringLock = spring(t - YT.drop, 1.5, 0.5);
      const rsc = t < YT.drop ? lerp(0.2, 1, ringIn) : lerp(1.25, 1, clamp(ringLock, 0, 1.2));
      lensRings(c, t, 960, t < YT.drop ? 540 : 470, rsc, t < YT.capOut ? ringIn * 0.9 : 0.9);

      // ---- blobs ----
      const balls = [];
      let txt = null;
      if (t >= 0.25 && t < YT.drop + 0.6) {
        if (t < YT.split) {
          // single mercury drop falls and squashes
          const p = seg(t, 0.25, YT.land), y = lerp(-260, 540, E.inQ(p));
          const land = t - YT.land, q = land > 0 ? 0.35 * Math.exp(-land * 9) * Math.cos(land * 22) : -0.18 * p * p;
          balls.push({ x: 960, y: y + (land > 0 ? 40 * q : 0), r: 150, sx: 1 + q, sy: 1 - q, w: 1 });
        } else {
          const n = 7;
          for (let i = 0; i < n; i++) {
            const tt = t - YT.split;
            // split outward from the drop, settle into an orbit
            const sp = clamp(spring(tt, 1.1, 0.55), 0, 1.3);
            const a = i * TAU / n + tt * (0.55 + 0.11 * (i % 3)) + 0.4;
            const orx = lerp(0, i < 3 ? 600 : 560, sp), ory = lerp(0, 200, sp);
            let x = 960 + Math.cos(a) * orx, y = 540 + Math.sin(a) * ory + 30 * Math.sin(t * 2 + i);
            const depth = 0.5 + 0.5 * Math.sin(a);
            let r = (i < 3 ? 115 : 85) * (0.72 + 0.45 * depth) * (t < YT.groove ? lerp(1.2, 1, seg(t, YT.split, YT.groove)) : 1);
            let w = i < 3 ? 1 : E.outC(seg(t, YT.groove + i * 0.1, YT.groove + 0.4 + i * 0.1));
            // converge
            const cv = E.inC(seg(t, YT.conv, YT.drop));
            x = lerp(x, 960, cv); y = lerp(y, 480, cv); r *= 1 + 0.25 * cv;
            // explode into the glyph field
            const ex = seg(t, YT.drop, YT.drop + 0.45);
            if (ex > 0) { const tx = [560, 830, 1100, 1370][i % 4], ty = 470; x = lerp(x, tx, E.outC(ex)); y = lerp(y, ty, E.outC(ex)); w *= 1 - E.inQ(ex); }
            const pu = 1 + 0.08 * Math.sin(t * 5 + i * 1.7);
            balls.push({ x, y, r, sx: pu, sy: 2 - pu, w });
          }
        }
      }
      if (t >= YT.drop) {
        const tw = E.outC(seg(t, YT.drop, YT.drop + 0.4));
        const m = E.ioC(seg(t, YT.morph, YT.lock + 0.12));
        const sweep = t >= YT.shine && t < YT.shine + 1.0 ? lerp(-200, 2300, E.ioC(seg(t, YT.shine, YT.shine + 0.85))) : undefined;
        txt = { a: '2000', b: 'Y2K', w: tw, m, sweep };
      }
      // wireframe globe behind the blob dance
      const ga = E.outC(seg(t, YT.capOut - 0.2, YT.capOut + 0.4)) * (1 - E.inC(seg(t, YT.conv, YT.drop)));
      if (ga > 0) {
        c.save(); c.translate(960, 540); c.globalAlpha = ga; c.strokeStyle = 'rgba(31,75,255,0.75)'; c.lineWidth = 1.6;
        const R = 250 * (0.85 + 0.15 * ga), rot = t * 0.9;
        c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke();
        for (let k = -3; k <= 3; k++) { const la = k * Math.PI / 8, y = Math.sin(la) * R, rr = Math.cos(la) * R; c.beginPath(); c.ellipse(0, y * 0.98, rr, rr * 0.18, 0, 0, TAU); c.stroke(); }
        for (let k = 0; k < 8; k++) { const lo = rot + k * Math.PI / 8, cx = Math.cos(lo); c.beginPath(); c.ellipse(0, 0, Math.abs(cx) * R, R, 0, 0, TAU); c.globalAlpha = ga * (0.35 + 0.65 * Math.abs(Math.sin(lo))); c.stroke(); }
        c.globalAlpha = ga;
        text(c, 'GLOBAL.NET', 0, R + 40, { font: PIX, size: 16, align: 'center', color: YK.blue, ls: 4 });
        c.restore();
        // pixel ticker
        c.save(); c.globalAlpha = ga;
        c.fillStyle = YK.ink; c.fillRect(0, 1044, W, 36);
        c.beginPath(); c.rect(0, 1044, W, 36); c.clip();
        const msg = 'WELCOME TO THE NEW MILLENNIUM ++ LIQUID CHROME ++ CANDY PLASTIC ++ 2000AD ++ ';
        c.font = `400 18px ${PIX}`;
        const mw = c.measureText(msg).width + 1, off = -((t - YT.capOut) * 260) % mw;
        for (let x = off; x < W; x += mw) text(c, msg, x, 1069, { font: PIX, size: 18, color: YK.lime, ls: 0 });
        c.restore();
      }
      blobRender(c, st, t, balls, txt);

      // ---- candy capsules carousel ----
      if (t >= YT.groove - 0.05 && t < YT.capOut + 0.6) {
        CANDY.forEach(([label, col], i) => {
          const T0 = YT.groove + i * YB * 0.5, sp = spring(t - T0, 1.6, 0.48);
          if (t < T0) return;
          const out = E.inB(seg(t, YT.capOut + i * 0.05, YT.capOut + 0.35 + i * 0.05), 1.6);
          const x = lerp(2300, 380 + i * 290, sp) + (i - 2) * 900 * out;
          const y = 520 + Math.sin(t * 2.2 + i) * 10 - 700 * out * (i % 2 ? 1 : -1) * 0.2;
          capsule(c, x, y, 210, 470, col, label, 1, (1 - sp) * 0.25 + Math.sin(t * 1.7 + i) * 0.015, t);
        });
      }

      // ---- flash on the drop ----
      const fl = pulse(t, YT.drop, 7);
      if (fl > 0.01) { c.fillStyle = `rgba(255,255,255,${fl * 0.95})`; c.fillRect(0, 0, W, H); }

      // ---- HUD ----
      hud(c, t, E.outC(seg(t, 0.35, 0.8)), E.outX(seg(t, YT.lock, YT.lock + 0.4)));
      // boot text
      if (t < YT.groove + 0.3) {
        const s = 'INITIALIZING_CHROME.SYS', n = Math.floor(s.length * seg(t, 0.1, 0.7));
        const a = 1 - seg(t, YT.groove, YT.groove + 0.3);
        text(c, s.slice(0, n) + (Math.floor(t * 8) % 2 ? '█' : ''), 960, 880, { font: PIX, size: 22, align: 'center', color: `rgba(13,20,48,${a})`, ls: 3 });
        const pct = Math.floor(100 * seg(t, 0.2, YT.split));
        text(c, String(pct).padStart(3, '0') + '%', 960, 912, { font: PIX, size: 16, align: 'center', color: `rgba(31,75,255,${a})`, ls: 3 });
      }

      // ---- sparkles ----
      st.sparks.forEach((q, i) => {
        if (t < 0.8) return;
        const tw = Math.max(0, Math.sin(t * q.sp + q.ph));
        star4(c, q.x, q.y, q.s * Math.pow(tw, 3) * (t > YT.lock ? 0.7 : 1), 0.9, 0);
      });
      // burst stars around the logo on the drop + lock
      [[YT.drop, 0], [YT.lock, 1]].forEach(([T, k]) => {
        if (t < T || t > T + 1.4) return;
        const p = seg(t, T, T + 1.2);
        for (let i = 0; i < 10; i++) {
          const a = i * TAU / 10 + k * 0.3, R = lerp(200, 720, E.outC(p)) * (0.7 + 0.3 * hash(i + k * 11));
          star4(c, 960 + Math.cos(a) * R * 1.3, 470 + Math.sin(a) * R * 0.55, 34 * Math.sin(p * Math.PI) * (0.5 + hash(i * 3 + k)), 1, p * 2);
        }
      });
      // pinned glints on the final logo
      if (t >= YT.lock) {
        const gl = [[640, 330, 0.0], [1270, 360, 0.7], [1500, 600, 1.4]];
        gl.forEach(([x, y, ph]) => { const tw = 0.6 + 0.4 * Math.sin(t * 3 + ph * 3); star4(c, x, y, 46 * tw * E.outB(seg(t, YT.lock + 0.1 + ph * 0.2, YT.lock + 0.4 + ph * 0.2), 2), 1, 0); });
      }

      // ---- lockup type ----
      if (t >= YT.lock) {
        const bp = E.outB(seg(t, YT.lock + 0.25, YT.lock + 0.6), 1.6);
        if (bp > 0) {
          const w = 620 * bp;
          c.save();
          rrect(c, 960 - w / 2, 772, w, 56, 28);
          const g = c.createLinearGradient(0, 772, 0, 828); g.addColorStop(0, '#5b7dff'); g.addColorStop(0.5, YK.blue); g.addColorStop(1, '#0f2fc4');
          c.fillStyle = g; c.fill();
          c.fillStyle = 'rgba(255,255,255,0.35)'; rrect(c, 960 - w / 2 + 10, 776, w - 20, 20, 10); c.fill();
          if (bp > 0.8) text(c, 'GRAPHIC DESIGN  1997—2004', 960, 810, { font: PIX, weight: 700, size: 22, align: 'center', color: '#fff', ls: 4 });
          c.restore();
        }
        const ta = seg(t, YT.lock + 0.55, YT.lock + 0.9);
        if (ta > 0) {
          const s = 'CHROME · CANDY PLASTIC · HUD · BLOBJECTS', n = Math.floor(s.length * ta);
          text(c, s.slice(0, n), 960, 866, { font: PIX, size: 15, align: 'center', color: YK.ink, ls: 3 });
        }
      }
      vignette(c, W, H, 0.12, '20,30,70');
    },
    score(A) {
      const b = YB;
      // boot
      A.bell(0.05, midi(76), { g: 0.06, dur: 1.4, ratios: [1, 2, 3, 4.2] });
      A.bell(0.05, midi(83), { g: 0.04, dur: 1.4, ratios: [1, 2, 3] });
      A.osc(0.05, { type: 'sawtooth', f: midi(52), dur: 1.2, g: 0.03, lp: 400, lp2: 2400, lpT: 1.0, a: 0.4, hold: true, rel: 0.3 });
      for (let k = 0; k < 8; k++) A.osc(0.1 + k * 0.07, { type: 'square', f: 1200 + hash(k) * 1800, dur: 0.03, g: 0.025, lp: 6000, pan: (hash(k + 3) - 0.5) });
      // mercury drop + split
      A.osc(0.25, { f: 1400, f2: 300, glide: 0.38, dur: 0.4, g: 0.05 });
      A.osc(YT.land, { f: 110, f2: 45, glide: 0.2, dur: 0.4, g: 0.4 });
      A.noise(YT.land, { type: 'bandpass', f: 600, f2: 2400, q: 3, dur: 0.25, g: 0.08 });
      A.osc(YT.split, { f: 300, f2: 900, glide: 0.15, dur: 0.25, g: 0.08, vib: [18, 40] });
      A.osc(YT.split + 0.04, { f: 450, f2: 1350, glide: 0.15, dur: 0.25, g: 0.05, pan: 0.4 });
      A.osc(YT.split + 0.08, { f: 600, f2: 1800, glide: 0.15, dur: 0.25, g: 0.04, pan: -0.4 });
      // progression: Am F C G, one chord per 2 beats
      const prog = [[57, [69, 72, 76]], [53, [69, 72, 77]], [48, [67, 72, 76]], [55, [67, 71, 74]]];
      const bars = Math.round((YT.drop - YT.groove) / b);
      // groove: breakbeat (kick 1, &2½; snare 2,4; ghosts) — filtered build before the drop
      for (let k = 0; k < 26; k++) {
        const t = YT.groove + k * b;
        if (t >= 8.57) break;
        const pre = t < YT.drop, ib = k % 4, chord = prog[Math.floor(k / 2) % 4];
        const pf = pre ? lerp(900, 3000, k / bars) : 5200;
        if (ib === 0) A.kick(t, 0.55);
        if (ib === 2) { A.kick(t + b * 0.5, 0.45); }
        if (ib === 1 || ib === 3) { A.snare(t, 0.2, { rev: 0.18 }); A.clap(t, 0.08); }
        if (ib === 3) A.snare(t + b * 0.75, 0.06);
        if (ib === 1) A.snare(t + b * 0.75, 0.05);
        for (let h = 0; h < 4; h++) A.hat(t + h * b / 4, h === 2 ? 0.05 : 0.022, false, { pan: h % 2 ? 0.3 : -0.3 });
        // rolling offbeat bass
        A.osc(t + b / 2, { type: 'sawtooth', f: midi(chord[0] - 24), dur: b * 0.45, g: 0.07, lp: 500, lp2: 200, lpT: b * 0.4 });
        A.osc(t, { f: midi(chord[0] - 24), dur: b * 0.4, g: 0.06 });
        // 16th arp pluck
        for (let s = 0; s < 4; s++) { const nn = chord[1][(k * 4 + s) % 3] + (s === 3 ? 12 : 0); A.osc(t + s * b / 4, { type: 'square', f: midi(nn), dur: 0.09, g: 0.018, lp: pf, lp2: pf * 0.4, lpT: 0.09, pan: s % 2 ? 0.35 : -0.35 }); }
        // supersaw pad on bar starts
        if (k % 2 === 0) A.chord(t, chord[1].map(m => m - 12), { type: 'sawtooth', dur: b * 2, g: pre ? 0.012 : 0.018, a: 0.03, hold: true, rel: 0.15, lp: pf * 0.8, spread: 14, width: 1.2 });
      }
      // capsules: candy bloops
      CANDY.forEach((_, i) => { const t = YT.groove + i * YB * 0.5; A.osc(t + 0.05, { f: midi([76, 79, 81, 84, 88][i]), f2: midi([76, 79, 81, 84, 88][i]) * 1.5, glide: 0.05, dur: 0.16, g: 0.05 }); A.whoosh(t - 0.05, 0.22, { f1: 3000, f2: 900, g: 0.04, pan: 0.5 }); });
      A.whoosh(YT.capOut, 0.4, { f1: 800, f2: 5000, g: 0.1 });
      // riser → drop
      A.riser(YT.conv - 0.9, YT.drop - YT.conv + 0.9, { g: 0.11, f: 220 });
      A.noise(YT.conv, { type: 'lowpass', f: 300, f2: 4000, dur: YT.drop - YT.conv, g: 0.05, swell: 0.95 });
      A.impact(YT.drop, 0.5);
      A.noise(YT.drop, { type: 'highpass', f: 4000, dur: 1.4, g: 0.07, rev: 0.4 });
      A.chord(YT.drop, [45, 57, 64, 69, 72, 76], { type: 'sawtooth', dur: 0.9, g: 0.022, a: 0.005, lp: 6000, lp2: 1500, lpT: 0.8, spread: 16, width: 1.4, rev: 0.3 });
      // morph + lock shing
      A.osc(YT.morph, { f: 500, f2: 1500, glide: 0.4, dur: 0.45, g: 0.05, vib: [12, 30] });
      A.whoosh(YT.morph, 0.45, { f1: 600, f2: 4000, g: 0.08 });
      A.bell(YT.lock, midi(88), { g: 0.06, dur: 2.2 });
      A.bell(YT.lock + 0.06, midi(95), { g: 0.04, dur: 2.0, pan: 0.3 });
      A.noise(YT.lock, { type: 'bandpass', f: 7000, f2: 12000, q: 2, dur: 0.6, g: 0.06, swell: 0.1 });
      // shine sweep
      A.noise(YT.shine, { type: 'bandpass', f: 2000, f2: 11000, q: 4, dur: 0.85, g: 0.05, swell: 0.5, pan: 0.2 });
      // outro pad
      A.chord(8.57, [45, 52, 57, 64, 69, 71], { type: 'sawtooth', dur: 1.43, g: 0.017, a: 0.02, hold: true, rel: 0.9, lp: 3000, lp2: 700, lpT: 1.3, spread: 14, rev: 0.5, width: 1.4 });
      A.kick(8.57, 0.5);
      A.bell(8.75, midi(93), { g: 0.035, dur: 1.2 });
      A.bell(9.05, midi(100), { g: 0.025, dur: 0.9, pan: -0.3 });
    },
  });
})();
