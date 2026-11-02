/* batch k7 — Technique Atlas · Timing, Camera: techstagger · techdolly · techinfinitezoom.
   techstagger (one 500 ms pop-in run on 45 Tokens with offset start times — linear, from the
   centre, diagonal and shuffled orders — then on the letters of MOTION, with a delay heat map on
   the grid and a timing chart of offset bars) ·
   techdolly (a pinhole camera physically travelling toward and away from the Token through a
   small 3D set, then side by side with a zoom that matches the framing: same Token size, different
   perspective, with per-depth magnification readouts and a top view) ·
   techinfinitezoom (a seamless endless zoom: every Token's hole holds the next Token at a quarter
   size, the camera moves in log space at one level a second toward the fixed point, with the zoom
   factor, depth level, a linear and a log axis). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, hash, midi, text, rrect, rng } = MG;
  const TK = MG.TK, P = TK.P, PI = Math.PI, BEAT = TK.BEAT;

  /* ---------------- shared helpers ---------------- */
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, u) => { const A = hex(a), B = hex(b); u = clamp(u); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
  const label = (c, s, x, y, o = {}) => text(c, s, x, y, { font: TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
  const tag = (c, s, x, y, on = 1) => {   // small accent dot + mono label, top-left of frame
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: P.ink, weight: 700, size: 20 });
    c.restore();
  };
  const plate = (c, x, y, w, h, a = 0.94) => {   // paper plate behind HUD text
    c.save(); c.globalAlpha *= a; rrect(c, x, y, w, h, 10); c.fillStyle = P.ground; c.fill();
    c.globalAlpha = 1; c.strokeStyle = 'rgba(23,24,28,0.18)'; c.lineWidth = 1; c.stroke(); c.restore();
  };
  const fmtZ = z => (z < 10 ? z.toFixed(2) : z < 100 ? z.toFixed(1) : Math.round(z).toLocaleString('en-US'));

  /* =====================================================================
     STAGGER — one animation, many start times. Every Token in a 9 × 5
     grid runs the same 500 ms pop-in (scale on an overshooting ease, a
     quarter turn unwinding); only its delay differs. Four orders, one per
     bar: linear by index (20 ms apart), from the centre by distance,
     diagonal by column + row, and a shuffled index. Behind each cell a heat
     tile shows its delay (pale = early, orange = late) with the value in
     ms; on the right a timing chart draws one offset bar per item with a
     playhead, so the stagger pattern is visible as a shape — a staircase,
     a V, a ramp, a scatter. Then the six letters of MOTION drop in 100 ms
     apart. The caption curve is the fraction of items that have arrived.
     ===================================================================== */
  const SG = { cols: 9, rows: 5, tile: 96, x0: 198, y0: 262, dur: 0.5, ts: 60 };
  const SG_N = SG.cols * SG.rows;
  const SG_PERM = (() => {
    const r = rng(11), a = Array.from({ length: SG_N }, (_, i) => i);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  })();
  const SG_PH = [
    { t0: 0.5, name: 'LINEAR', f: 'delay(i) = i × 20 ms', d: (i, col, row) => i * 0.02 },
    { t0: 2.5, name: 'FROM CENTRE', f: 'delay = distance to centre × 200 ms', d: (i, col, row) => Math.hypot(col - 4, row - 2) * 0.2 },
    { t0: 4.5, name: 'DIAGONAL', f: 'delay = (col + row) × 75 ms', d: (i, col, row) => (col + row) * 0.075 },
    { t0: 6.5, name: 'RANDOM', f: 'delay = shuffle(i) × 20 ms', d: (i) => SG_PERM[i] * 0.02 },
  ];
  const SG_DMAX = 0.9, SG_SPAN = 1.5, SG_OUT = [1.65, 1.9];
  const SG_LT = 8.5, SG_LD = 0.1;   // letters: start, delay per letter
  const sgDelays = p => { const out = []; for (let i = 0; i < SG_N; i++) out.push(SG_PH[p].d(i, i % SG.cols, Math.floor(i / SG.cols))); return out; };
  const SG_D = SG_PH.map((_, p) => sgDelays(p));
  const SG_LDS = [0, 1, 2, 3, 4, 5].map(k => k * SG_LD);
  function sgPhase(t) { let p = -1; for (let i = 0; i < 4; i++) if (t >= SG_PH[i].t0 - 0.1) p = i; return t >= SG_LT - 0.1 ? 4 : p; }
  // fraction of items whose animation has finished… smoothly: mean linear progress
  const sgArrived = (ds, lt) => ds.reduce((s, d) => s + clamp((lt - d) / SG.dur), 0) / ds.length;

  function sgChart(c, t, ds, t0, big) {
    const x0 = 1150, x1 = 1810, y0 = 212, h = 432, px = x1 - x0, X = s => x0 + s / SG_SPAN * px;
    label(c, 'TIMING  ·  ONE 500 ms ANIMATION, OFFSET STARTS', x0, 176, { size: 15, ls: 2, color: P.ink, weight: 700 });
    // axis
    c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(x0, y0 + h + 10, px, 1.5);
    for (let k = 0; k <= 6; k++) {
      const x = X(k * 0.25); c.fillRect(x - 0.5, y0 + h + 4, 1, k % 2 ? 6 : 12);
      if (k % 2 === 0) label(c, k ? `${(k * 0.25).toFixed(1)} s` : '0', x, y0 + h + 36, { size: 13, ls: 1, align: 'center' });
    }
    const n = ds.length, rh = h / n, bh = big ? rh * 0.62 : Math.max(3, rh * 0.62), lt = t - t0;
    for (let i = 0; i < n; i++) {
      const y = y0 + i * rh + (rh - bh) / 2, d = ds[i], xa = X(d), xb = X(d + SG.dur);
      // delay: a dotted lead-in from zero
      c.fillStyle = 'rgba(23,24,28,0.16)';
      for (let x = x0; x < xa - 3; x += 6) c.fillRect(x, y + bh / 2 - 0.5, 2, 1);
      c.fillStyle = mixc('#e2dacd', '#f9bfa2', d / (big ? 0.5 : SG_DMAX)); c.fillRect(xa, y, xb - xa, bh);
      const u = clamp((lt - d) / SG.dur);
      if (u > 0) { c.fillStyle = u >= 1 ? P.accent : P.accentL; c.fillRect(xa, y, (xb - xa) * u, bh); }
      if (big) label(c, `+${Math.round(d * 1000)} ms`, xa - 12, y + bh / 2 + 6, { size: 15, ls: 1, align: 'right', color: P.ink });
    }
    label(c, big ? 'LETTER' : 'ITEM 0', x0 - 14, y0 + 10, { size: 12, ls: 1, align: 'right' });
    if (!big) label(c, `${n - 1}`, x0 - 14, y0 + h, { size: 12, ls: 1, align: 'right' });
    // playhead
    const ph = clamp(lt, 0, SG_SPAN);
    if (lt > -0.05 && lt < SG_SPAN + 0.4) {
      c.fillStyle = P.ink; c.fillRect(X(ph) - 1, y0 - 12, 2, h + 22);
      c.beginPath(); c.moveTo(X(ph) - 6, y0 - 18); c.lineTo(X(ph) + 6, y0 - 18); c.lineTo(X(ph), y0 - 10); c.fill();
    }
  }

  MG.film({
    id: 'techstagger', dur: 10, poster: 3.05,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Stagger', sub: 'One animation, offset start times', era: '1930s —',
      origin: 'Staggering — running the same move on many elements with each start delayed a little more than the last — is how a crowd of parts reads as one gesture. Cel animators and title designers did it by hand with offset exposure-sheet timings; in motion graphics it became a standard control through After Effects text animators and expression offsets, and web motion libraries such as GSAP made a stagger value, with orders from the start, centre, edges or random, a single parameter.',
      works: 'Saul Bass, The Man with the Golden Arm titles (1955) · After Effects text animator range selectors (Adobe) · GSAP stagger option (GreenSock)',
      tech: ['Delay = f(index)', 'Linear · centre · diagonal · random orders', 'Same duration and ease for every item'],
      accent: '#ff5a1f',
      motionDNA: 'Every item runs the identical 500 ms pop-in on an overshooting ease; only the start time changes. Four orders, one per bar, each finishing within 1.4 s — a reading-order sweep, a ripple out from the centre, a diagonal wave from the top-left, a sparkling shuffle — each cleared at once before the next, then the six letters of MOTION drop in 100 ms apart.',
      visualDNA: 'The Technique Atlas stage with a 9 × 5 grid of small orange Tokens over delay heat tiles (pale to orange, labelled in ms); a timing chart of 45 offset bars, dotted lead-ins for each delay and a black playhead; mono tags naming the order and its formula.',
      transitions: 'Staggered pop-ins; each pattern cleared with a single simultaneous scale-down',
      implementation: ['After Effects text animators / layer offset sequencing', 'GSAP stagger, Framer Motion staggerChildren, CSS animation-delay', 'Canvas 2D: per-item delay = f(index, position), one shared easing'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      const p = sgPhase(t);
      let curve = null, span = [0, 1];
      if (p >= 0 && p < 4) {
        const ph = SG_PH[p], ds = SG_D[p], lt = t - ph.t0;
        const out = E.inQ(seg(lt, SG_OUT[0], SG_OUT[1])), heat = seg(lt, -0.1, 0.1) * (1 - seg(lt, SG_OUT[0], SG_OUT[1] + 0.05));
        for (let i = 0; i < SG_N; i++) {
          const col = i % SG.cols, row = Math.floor(i / SG.cols), x = SG.x0 + col * SG.tile, y = SG.y0 + row * SG.tile, d = ds[i];
          // heat tile + delay in ms
          c.save(); c.globalAlpha = heat;
          rrect(c, x - 42, y - 42, 84, 84, 10); c.fillStyle = mixc('#e6dfd2', '#fbb08e', d / SG_DMAX); c.fill();
          label(c, `${Math.round(d * 1000)}`, x - 36, y + 36, { size: 11, ls: 0, color: 'rgba(23,24,28,0.55)' });
          c.restore();
          const u = clamp((lt - d) / SG.dur);
          if (u <= 0) continue;
          const s = SG.ts * E.outB(u) * (1 - out);
          if (s < 0.5) continue;
          TK.token(c, x, y - 4, s, { rot: -(1 - E.outC(u)) * PI / 2, alpha: clamp(u * 4) });
          if (u < 1) { c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y - 4, 40, -PI / 2, -PI / 2 + u * TAU); c.stroke(); }
        }
        sgChart(c, t, ds, ph.t0, false);
        tag(c, `STAGGER ${p + 1} / 5  ·  ${ph.name}`, 72, 80, seg(t, 0.1, 0.4));
        label(c, ph.f, 98, 116, { color: P.accentD, weight: 700, size: 18, ls: 1 });
        label(c, `${SG_N} ITEMS  ·  SAME 500 ms POP-IN  ·  DELAY HEAT IN ms`, SG.x0 - 42, SG.y0 + 4 * SG.tile + 84, { size: 14, ls: 2 });
        curve = u => sgArrived(ds, u * SG_SPAN); span = [ph.t0, ph.t0 + SG_SPAN];
      } else if (p === 4) {
        // letters of MOTION, each its own item
        const lt = t - SG_LT, size = 170, ls = 6, cx = 582, cy = 500;
        c.font = `900 ${size}px ${TK.FONT}`;
        const ws = TK.WORD.split('').map(ch => c.measureText(ch).width + ls), tw = ws.reduce((a, b) => a + b, 0) - ls;
        let x = cx - tw / 2;
        TK.WORD.split('').forEach((ch, k) => {
          const d = SG_LDS[k], u = clamp((lt - d) / SG.dur), xc = x + (ws[k] - ls) / 2;
          rrect(c, x + 4, cy + 104, ws[k] - ls - 8, 10, 5); c.fillStyle = mixc('#e4dccd', '#ffb595', d / 0.5); c.fill();
          label(c, `+${Math.round(d * 1000)}`, xc, cy + 146, { size: 14, ls: 1, align: 'center' });
          if (u > 0) {
            c.save(); c.globalAlpha = clamp(u * 3);
            text(c, ch, xc, cy - (1 - E.outB(u)) * 150, { font: TK.FONT, weight: 900, size, color: P.ink, align: 'center', base: 'middle' });
            c.restore();
          }
          x += ws[k];
        });
        TK.token(c, cx, cy - 210, 70, { rot: (1 - E.outB(seg(lt, 0.6, 1.1))) * PI / 2 });
        sgChart(c, t, SG_LDS, SG_LT, true);
        tag(c, 'STAGGER 5 / 5  ·  LETTERS', 72, 80);
        label(c, 'delay(k) = k × 100 ms', 98, 116, { color: P.accentD, weight: 700, size: 18, ls: 1 });
        curve = u => sgArrived(SG_LDS, u * SG_SPAN); span = [SG_LT, SG_LT + SG_SPAN];
      } else {
        tag(c, 'STAGGER  ·  SAME MOVE, OFFSET STARTS', 72, 80, seg(t, 0.1, 0.4));
        sgChart(c, t, SG_D[0], SG_PH[0].t0, false);
        curve = u => sgArrived(SG_D[0], u * SG_SPAN); span = [SG_PH[0].t0, SG_PH[0].t0 + SG_SPAN];
      }
      TK.caption(c, t, W, H, { name: 'Stagger', cat: 'Timing', curve, span, curveLabel: 'ITEMS ARRIVED / TIME', lo: -0.12, hi: 1.15 });
    },
    score(A) {
      TK.bed(A);
      const pent = [0, 2, 4, 7, 9];
      SG_PH.forEach((ph, p) => {
        SG_D[p].forEach((d, i) => {
          const col = i % SG.cols, row = Math.floor(i / SG.cols), k = col + (4 - row);
          const note = 72 + 12 * Math.floor(k / 5) + pent[k % 5] - 12;
          A.osc(ph.t0 + d, { type: 'triangle', f: midi(note), dur: 0.09, g: 0.028, pan: (col - 4) * 0.18 });
        });
        A.whoosh(ph.t0 + SG_OUT[0] - 0.05, 0.3, { f1: 2600, f2: 400, g: 0.07, swell: 0.4, pan: 0 });
        A.osc(ph.t0 + SG_OUT[0], { f: 520, f2: 260, glide: 0.2, dur: 0.22, g: 0.03 });
      });
      SG_LDS.forEach((d, k) => {
        A.pluck(SG_LT + d + 0.1, midi([60, 64, 67, 72, 76, 79][k]), { g: 0.16, bright: 0.65, dur: 1.2, pan: (k - 2.5) * 0.15 });
        A.kick(SG_LT + d + 0.12, 0.1, { f: 160, f2: 70, dur: 0.12 });
      });
      A.chord(SG_LT + 0.7, [60, 64, 67, 72], { type: 'triangle', dur: 1.6, g: 0.04, a: 0.03, lp: 2600, rev: 0.6, width: 0.8 });
    },
  });

  /* =====================================================================
     DOLLY — a pinhole camera on a track. The set is a real 3D layout: the
     Token standing on a gridded floor, two small ink Tokens 1.8 m in front
     of it, posts every few metres behind it and MOTION on a billboard 12 m
     back. A dolly moves the camera itself (9 m → 3.6 m from the Token, lens
     fixed at 24 mm), so every depth magnifies by a different amount: the
     near markers ×4, the Token ×2.5, the billboard only ×1.35 — near things
     grow faster than far ones. Then the frame splits: a dolly on the left,
     a zoom on the right (camera parked at 9 m, 24 → 60 mm) matched so the
     Token lands at the same size; the zoom magnifies every depth by the
     same ×2.5 and the perspective stays flat. Top views and per-depth
     magnification bars spell out the difference.
     ===================================================================== */
  const D = { f0: 1280, z0: -9, z1: -3.6, camY: 0.65, cx: 960, cy: 470 };
  const D_MOVES = [[0.6, 2.8, D.z0, D.z1], [3.4, 4.8, D.z1, D.z0]];
  const D_SPLIT = [5.0, 5.5], D_SM = [5.8, 7.8];
  const D_POSTS = [3, 6, 10, 16, 24];
  const D_LAYERS = [['NEAR  −1.8 m', -1.8], ['TOKEN  0 m', 0], ['FAR  +12 m', 12]];
  const dmm = f => f * 36 / 1920;
  function dP(cam, x, y, z) { const dz = z - cam.zc; if (dz < 0.05) return null; return [D.cx + cam.f * x / dz, D.cy - cam.f * (y - D.camY) / dz, dz]; }
  const dMag = (cam, z) => (cam.f / (z - cam.zc)) / (D.f0 / (z - D.z0));
  function dScene(c, cam) {
    c.fillStyle = P.ground; c.fillRect(0, 0, 1920, 1080);
    const g = c.createLinearGradient(0, D.cy, 0, 1080); g.addColorStop(0, P.ground); g.addColorStop(0.35, P.ground2); g.addColorStop(1, P.ground2);
    c.fillStyle = g; c.fillRect(0, D.cy, 1920, 1080 - D.cy);
    // floor grid in perspective (1 m squares)
    c.strokeStyle = 'rgba(23,24,28,0.13)'; c.lineWidth = 1.5; c.beginPath();
    const zn = cam.zc + 0.6;
    for (let z = Math.ceil(zn), prev = 1e9; z <= 60; z++) { const sy = D.cy + cam.f * D.camY / (z - cam.zc); if (prev - sy < 7) break; prev = sy; c.moveTo(0, sy); c.lineTo(1920, sy); }
    for (let x = -24; x <= 24; x++) { const a = dP(cam, x, 0, zn), b = dP(cam, x, 0, 40); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
    c.stroke();
    // haze at the horizon hides the far, dense end of the grid
    const hz = c.createLinearGradient(0, D.cy, 0, D.cy + 70); hz.addColorStop(0, P.ground); hz.addColorStop(1, 'rgba(236,232,223,0)');
    c.fillStyle = hz; c.fillRect(0, D.cy, 1920, 70);
    c.fillStyle = 'rgba(23,24,28,0.22)'; c.fillRect(0, D.cy - 1, 1920, 2);
    const objs = [];
    D_POSTS.forEach(z => [-2.6, 2.6].forEach(x => objs.push({ z, k: 'post', x })));
    objs.push({ z: 12, k: 'board' }, { z: 0, k: 'token' }, { z: -1.8, k: 'near', x: -1.2 }, { z: -1.8, k: 'near', x: 1.2 });
    objs.sort((a, b) => b.z - a.z);
    for (const o of objs) {
      if (o.z - cam.zc < 0.3) continue;
      if (o.k === 'post') {
        const a = dP(cam, o.x - 0.08, 2.0, o.z), b = dP(cam, o.x + 0.08, 0, o.z);
        c.fillStyle = 'rgba(23,24,28,0.78)'; c.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
        if (o.x > 0 && o.z <= 10) label(c, `+${o.z} m`, (a[0] + b[0]) / 2, a[1] - 10, { size: clamp(cam.f * 0.26 / (o.z - cam.zc), 10, 40), ls: 1, align: 'center', color: P.ink });
      } else if (o.k === 'board') {
        const p = dP(cam, 0, 2.6, o.z), s = cam.f * 1.0 / p[2];
        TK.word(c, p[0], p[1], { size: s, ls: s * 0.03 });
      } else if (o.k === 'token') {
        const p = dP(cam, 0, 0.65, 0), f = dP(cam, 0, 0, 0), s = cam.f * 1.3 / p[2];
        c.fillStyle = P.shadow; c.beginPath(); c.ellipse(f[0], f[1], s * 0.55, s * 0.08 + 2, 0, 0, TAU); c.fill();
        TK.token(c, p[0], p[1], s);
      } else {
        const p = dP(cam, o.x, 0.25, o.z), f = dP(cam, o.x, 0, o.z), s = cam.f * 0.5 / p[2];
        c.fillStyle = P.shadow; c.beginPath(); c.ellipse(f[0], f[1], s * 0.55, s * 0.08 + 2, 0, 0, TAU); c.fill();
        TK.token(c, p[0], p[1], s, { color: P.ink });
      }
    }
  }
  // top view: z runs left → right, camera on the left looking right
  function dMap(c, x, y, w, h, cam) {
    const zA = -10, zB = 26, sz = w / (zB - zA), sx = h / 10, MX = z => x + (z - zA) * sz, MY = xx => y + h / 2 + xx * sx;
    c.save();
    c.fillStyle = 'rgba(221,216,204,0.7)'; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(23,24,28,0.3)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w, h);
    c.beginPath(); c.rect(x, y, w, h); c.clip();
    // frustum
    const tn = 960 / cam.f, cxp = MX(cam.zc), L = zB - cam.zc + 2;
    c.fillStyle = 'rgba(255,90,31,0.12)'; c.beginPath(); c.moveTo(cxp, MY(0)); c.lineTo(MX(cam.zc + L), MY(-tn * L)); c.lineTo(MX(cam.zc + L), MY(tn * L)); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(198,62,12,0.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(MX(cam.zc + L), MY(-tn * L)); c.lineTo(cxp, MY(0)); c.lineTo(MX(cam.zc + L), MY(tn * L)); c.stroke();
    c.fillStyle = P.ink;
    D_POSTS.forEach(z => [-2.6, 2.6].forEach(px => { c.beginPath(); c.arc(MX(z), MY(px), 2.5, 0, TAU); c.fill(); }));
    c.fillRect(MX(12) - 1.5, MY(-2.3), 3, 4.6 * sx);
    [-1.2, 1.2].forEach(px => c.fillRect(MX(-1.8) - 3, MY(px) - 3, 6, 6));
    c.fillStyle = P.accent; c.fillRect(MX(0) - 2.5, MY(-0.65), 5, 1.3 * sx);
    // camera body
    c.fillStyle = P.ink; c.beginPath(); c.moveTo(cxp + 2, MY(0)); c.lineTo(cxp - 14, MY(0) - 8); c.lineTo(cxp - 14, MY(0) + 8); c.closePath(); c.fill();
    c.restore();
    label(c, 'TOP VIEW', x + w - 8, y + h - 8, { size: 11, ls: 2, align: 'right', color: P.ink });
  }
  function dBars(c, x, y, w, cam, hl) {
    D_LAYERS.forEach(([name, z], i) => {
      const m = dMag(cam, z), yy = y + i * 34, bw = (w - 250) * clamp((m - 1) / 3) + 3;
      label(c, name, x, yy + 5, { size: 13, ls: 1, color: P.ink });
      c.fillStyle = 'rgba(23,24,28,0.1)'; c.fillRect(x + 130, yy - 6, w - 250, 12);
      c.fillStyle = i === 1 ? P.accent : i === 0 ? P.ink : P.mute; c.fillRect(x + 130, yy - 6, bw, 12);
      label(c, `×${m.toFixed(2)}`, x + w, yy + 6, { size: 16, ls: 1, align: 'right', color: P.ink, weight: hl ? 700 : 400 });
    });
  }
  function dZ(t) {
    for (const [a, b, z0, z1] of D_MOVES) if (t < b) return t < a ? z0 : lerp(z0, z1, E.ioS(seg(t, a, b)));
    return D.z0;
  }
  const dSizeCurve = (d0, d1) => u => { const d = lerp(d0, d1, E.ioS(u)); return (1 / d - 1 / 9) / (1 / 3.6 - 1 / 9); };

  MG.film({
    id: 'techdolly', dur: 10, poster: 8.6,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Dolly', sub: 'The camera moves, so perspective changes', era: '1910s —',
      origin: 'A dolly shot moves the whole camera toward or away from the subject on a wheeled platform, often on track. Because the viewpoint itself travels, near objects grow faster than far ones and the parallax between them changes — which a zoom, magnifying from a fixed point, cannot do. Giovanni Pastrone’s Cabiria (1914) made long tracking moves famous enough that they were called "Cabiria movements"; the zoom lens only became common decades later, and Hitchcock’s Vertigo (1958) combined the two against each other in the dolly zoom.',
      works: 'Cabiria (Giovanni Pastrone, 1914) · Vertigo (Alfred Hitchcock, 1958; dolly zoom) · Jaws (Steven Spielberg, 1975; dolly zoom on the beach)',
      tech: ['Camera translation, fixed focal length', 'Magnification ∝ 1 / distance per depth', 'Matched zoom for comparison'],
      accent: '#ff5a1f',
      motionDNA: 'A slow, eased push in from 9 m to 3.6 m, a hold, a pull back out; then the same push beside a zoom that keeps the camera parked and racks 24 → 60 mm so the Token grows identically. In the dolly the foreground markers swing outward and swell ×4 while the billboard behind barely grows; in the zoom everything scales together about the centre.',
      visualDNA: 'The Technique Atlas Token on a gridded floor plane in true perspective, ink marker Tokens in front, ink posts with distance labels and MOTION on a far billboard; paper HUD plates with a top-view map (orange frustum widening or narrowing), camera distance, focal length and magnification bars for near, Token and far.',
      transitions: 'Full-frame dolly shrinks into the left half of a split screen as the zoom panel slides in',
      implementation: ['Dolly and track, slider, crane or Steadicam on set', 'Camera translation in Cinema 4D / Blender / After Effects 3D camera', 'Canvas 2D: pinhole projection x·f/z of a small 3D set, painter-sorted'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      const split = seg(t, D_SPLIT[0], D_SPLIT[1]), sp = E.ioC(split);
      let curve, span;
      if (t < D_SPLIT[0]) {
        const cam = { zc: dZ(t), f: D.f0 };
        dScene(c, cam);
        const mv = t < 3.1 ? D_MOVES[0] : D_MOVES[1];
        const inn = mv === D_MOVES[0];
        tag(c, inn ? 'DOLLY IN  ·  THE CAMERA MOVES, THE LENS STAYS' : 'DOLLY OUT  ·  THE CAMERA BACKS AWAY', 72, 80, seg(t, 0.1, 0.4) * (1 - seg(t, 4.85, 5.0)));
        label(c, inn ? 'NEAR THINGS GROW FASTER THAN FAR THINGS' : 'NEAR THINGS SHRINK FASTER THAN FAR THINGS', 98, 116, { color: P.accentD, weight: 700, size: 18, ls: 1 });
        c.save(); c.globalAlpha = 1 - seg(t, 4.8, 5.0);
        plate(c, 1468, 40, 400, 326);
        dMap(c, 1490, 60, 356, 112, cam);
        label(c, `CAMERA DIST  ${(-cam.zc).toFixed(2)} m`, 1490, 204, { size: 17, ls: 1, color: P.ink, weight: 700 });
        label(c, `FOCAL  ${dmm(cam.f).toFixed(0)} mm  (FIXED)`, 1490, 232, { size: 17, ls: 1, color: P.ink });
        dBars(c, 1490, 270, 356, cam);
        c.restore();
        curve = dSizeCurve(inn ? 9 : 3.6, inn ? 3.6 : 9); span = [mv[0], mv[1]];
      } else {
        const k = lerp(1, 0.46, sp), lx = lerp(0, 60, sp), ly = lerp(0, 196, sp);
        const u = E.ioS(seg(t, D_SM[0], D_SM[1]));
        const camL = { zc: lerp(D.z0, D.z1, u), f: D.f0 }, camR = { zc: D.z0, f: D.f0 * lerp(1, 2.5, u) };
        const panel = (x, y, cam) => {
          c.save(); c.translate(x, y); c.scale(k, k); c.beginPath(); c.rect(0, 0, 1920, 1080); c.clip(); dScene(c, cam); c.restore();
          c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(x, y, 1920 * k, 1080 * k);
        };
        panel(lx, ly, camL);
        if (split > 0) panel(lerp(1940, 977, sp), 196, camR);
        const on = seg(t, 5.4, 5.8);
        c.save(); c.globalAlpha = on;
        tag(c, 'DOLLY vs ZOOM  ·  SAME FRAMING OF THE TOKEN', 72, 80);
        label(c, 'DOLLY: EACH DEPTH GROWS DIFFERENTLY  ·  ZOOM: EVERYTHING ×2.5', 98, 116, { color: P.accentD, weight: 700, size: 18, ls: 1 });
        label(c, `DOLLY  ·  CAMERA ${(-camL.zc).toFixed(1)} m  ·  LENS 24 mm`, 60, 180, { size: 17, ls: 2, color: P.ink, weight: 700 });
        label(c, `ZOOM  ·  CAMERA 9.0 m  ·  LENS ${dmm(camR.f).toFixed(0)} mm`, 977, 180, { size: 17, ls: 2, color: P.ink, weight: 700 });
        dMap(c, 60, 718, 300, 132, camL); dMap(c, 977, 718, 300, 132, camR);
        const hl = t > D_SM[1];
        dBars(c, 390, 742, 553, camL, hl); dBars(c, 1307, 742, 553, camR, hl);
        c.restore();
        curve = dSizeCurve(9, 3.6); span = D_SM;
      }
      TK.caption(c, t, W, H, { name: 'Dolly', cat: 'Camera', curve, span, curveLabel: 'TOKEN SIZE / TIME', lo: -0.12, hi: 1.15 });
    },
    score(A) {
      TK.bed(A);
      const track = (t0, t1, g, pan, up) => {
        const d = t1 - t0;
        A.noise(t0, { type: 'lowpass', f: 160, f2: up ? 320 : 120, sweep: d, q: 0.8, dur: d + 0.2, g, swell: 0.5, pan });
        A.osc(t0, { f: up ? 55 : 82, f2: up ? 82 : 55, glide: d, dur: d + 0.1, g: g * 0.5, a: d * 0.4 });
        for (let k = 0; k < Math.floor(d / 0.25); k++) A.osc(t0 + 0.12 + k * 0.25, { f: 1900, dur: 0.02, g: 0.012 + 0.01 * Math.sin(PI * k * 0.25 / d), pan });
        A.kick(t0, 0.12, { f: 220, f2: 90, dur: 0.12 }); A.kick(t1, 0.14, { f: 200, f2: 80, dur: 0.15 });
      };
      track(D_MOVES[0][0], D_MOVES[0][1], 0.16, 0, true);
      A.pluck(D_MOVES[0][1], midi(67), { g: 0.12, bright: 0.6, dur: 1 });
      track(D_MOVES[1][0], D_MOVES[1][1], 0.14, 0, false);
      A.pluck(D_MOVES[1][1], midi(60), { g: 0.1, bright: 0.6, dur: 1 });
      A.whoosh(D_SPLIT[0], 0.5, { f1: 500, f2: 3500, g: 0.1, swell: 0.6, pan: 0.4 });
      A.snare(D_SPLIT[1], 0.08, { f: 2600, dur: 0.08 });
      // split: dolly rumble left, zoom servo whine right
      track(D_SM[0], D_SM[1], 0.13, -0.55, true);
      A.osc(D_SM[0], { type: 'sawtooth', f: 700, f2: 1200, glide: 2, dur: 2.05, g: 0.018, a: 0.2, lp: 2200, pan: 0.6 });
      A.noise(D_SM[0], { type: 'bandpass', f: 3200, q: 9, dur: 2.0, g: 0.04, a: 0.2, hold: true, pan: 0.6 });
      A.bell(D_SM[1] + 0.05, midi(76), { g: 0.06, dur: 1.4, pan: -0.4 });
      A.bell(D_SM[1] + 0.3, midi(79), { g: 0.06, dur: 1.4, pan: 0.4 });
      A.chord(8, [60, 64, 67, 72], { type: 'triangle', dur: 2, g: 0.04, a: 0.05, lp: 2400, rev: 0.6, width: 0.8 });
    },
  });

  /* =====================================================================
     INFINITE ZOOM — a picture that contains itself at a fixed ratio, and a
     camera that moves in log space. Every Token's hole holds the next Token
     at a quarter of its size (K = 4), on its own patch of gridded paper.
     The camera aims at the fixed point of that copy-inside-copy mapping —
     the one point that is in the same place at every level — and the zoom
     factor is Z = 4^L, with L rising at a constant one level per second
     (two beats), eased in and out. Equal steps in L are equal ×4 steps in
     Z, so the motion feels constant and the frame at L = n is the frame at
     L = n + 1: only the levels to draw shift by one, which makes the loop
     seamless. HUD: zoom factor, depth level, Z on a linear axis (an
     exploding exponential) and on a log ruler (a steady climb).
     ===================================================================== */
  const IZ = { K: 4, S0: 420, vx: 72, vy: 124, vw: 1356, vh: 736, fx: 752, fy: 492, L: 8 };
  const IZ_C = 4 / 3 * 0.2, IZ_H = IZ_C - 0.2;   // token centre and hole centre offsets from the fixed point (× size)
  // L(t): ease in over 0.5–1.5, one level per second, ease out over 8.5–9.5 to land on L = 8
  function izL(t) {
    if (t <= 0.5) return 0;
    if (t <= 1.5) { const u = t - 0.5; return u * u / 2; }
    if (t <= 8.5) return 0.5 + (t - 1.5);
    if (t <= 9.5) { const u = t - 8.5; return 7.5 + u - u * u / 2; }
    return IZ.L;
  }
  function izWorld(c, L) {
    const n = Math.floor(L + 1e-9), fr = L - n, F = [IZ.fx, IZ.fy];
    c.fillStyle = P.ground; c.fillRect(IZ.vx, IZ.vy, IZ.vw, IZ.vh);
    for (let j = -2; j <= 8; j++) {
      const m = n + j, S = IZ.S0 * Math.pow(IZ.K, fr - j);
      if (S < 1.5) break;
      const cx = F[0] - IZ_C * S, cy = F[1] + IZ_C * S;
      TK.token(c, cx, cy, S);
      if (m >= 0) {
        const fs = Math.min(0.062 * S, 56);
        if (fs > 7) {
          label(c, `LEVEL ${m}`, cx - 0.4 * S, cy + 0.32 * S, { size: fs, ls: fs * 0.08, color: 'rgba(23,24,28,0.78)', weight: 700 });
          label(c, `×${Math.pow(IZ.K, m).toLocaleString('en-US')}`, cx - 0.4 * S, cy + 0.32 * S + fs * 1.3, { size: fs * 0.8, ls: fs * 0.06, color: 'rgba(23,24,28,0.55)' });
        }
      }
      // inside the hole: the next patch of paper, its grid scaled to the next Token
      const hx = F[0] - IZ_H * S, hy = F[1] + IZ_H * S, r = TK.HOLE.r * S;
      c.beginPath(); c.arc(hx, hy, r, 0, TAU); c.clip();
      c.fillStyle = P.ground; c.fillRect(hx - r, hy - r, 2 * r, 2 * r);
      const g = S / IZ.K * 80 / IZ.S0;
      if (g > 3) {
        c.strokeStyle = P.line; c.lineWidth = 1; c.beginPath();
        const ox = hx - Math.floor(r / g + 1) * g, oy = hy - Math.floor(r / g + 1) * g;
        for (let x = ox; x <= hx + r; x += g) { c.moveTo(x, hy - r); c.lineTo(x, hy + r); }
        for (let y = oy; y <= hy + r; y += g) { c.moveTo(hx - r, y); c.lineTo(hx + r, y); }
        c.stroke();
      }
    }
  }
  function izHud(c, t, L) {
    const Z = Math.pow(IZ.K, L), x = 1482, w = 366;
    label(c, 'ZOOM FACTOR  Z = 4^L', x, 146, { size: 15, ls: 2 });
    text(c, `×${fmtZ(Z)}`, x - 2, 206, { font: TK.FONT, weight: 800, size: 56, color: P.ink });
    label(c, `= 10^${Math.log10(Z).toFixed(2)}`, x, 240, { size: 17, ls: 1, color: P.ink });
    label(c, `DEPTH LEVEL  L = ${L.toFixed(2)}`, x, 278, { size: 17, ls: 1, color: P.accentD, weight: 700 });
    // Z on a linear axis
    const gx = x, gy = 330, gh = 112, Zmax = Math.pow(IZ.K, IZ.L);
    label(c, 'Z ON A LINEAR AXIS', gx, gy - 10, { size: 13, ls: 2 });
    c.strokeStyle = 'rgba(23,24,28,0.2)'; c.lineWidth = 1; c.strokeRect(gx + 0.5, gy + 0.5, w, gh);
    c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath();
    for (let i = 0; i <= 120; i++) { const tt = i / 12, px = gx + tt / 10 * w, py = gy + gh - Math.pow(IZ.K, izL(tt)) / Zmax * (gh - 8); i ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke();
    c.fillStyle = P.accent; c.beginPath(); c.arc(gx + clamp(t / 10) * w, gy + gh - Z / Zmax * (gh - 8), 6, 0, TAU); c.fill();
    label(c, 'FLAT, THEN EXPLODES', gx + 8, gy + 22, { size: 12, ls: 1 });
    // Z on a log ruler: a steady climb
    const rx = x + 10, r0 = 850, r1 = 520, RY = z => lerp(r0, r1, Math.log10(z) / 5);
    label(c, 'Z ON A LOG AXIS  ·  STEADY', gx, 494, { size: 13, ls: 2 });
    c.fillStyle = 'rgba(23,24,28,0.3)'; c.fillRect(rx - 1, r1, 2, r0 - r1);
    ['×1', '×10', '×100', '×1k', '×10k', '×100k'].forEach((s, k) => {
      const y = RY(Math.pow(10, k)); c.fillRect(rx - 10, y - 0.75, 20, 1.5);
      label(c, s, rx - 18, y + 5, { size: 12, ls: 1, align: 'right' });
    });
    for (let m = 0; m <= IZ.L; m++) {
      const y = RY(Math.pow(IZ.K, m)), past = L >= m - 1e-6;
      c.fillStyle = past ? P.accent : 'rgba(23,24,28,0.25)'; c.beginPath(); c.arc(rx + 30, y, 4.5, 0, TAU); c.fill();
      label(c, `L${m}  ×${Math.pow(IZ.K, m).toLocaleString('en-US')}`, rx + 46, y + 5, { size: 12, ls: 1, color: past ? P.ink : P.mute });
    }
    const my = RY(Z);
    c.fillStyle = P.ink; c.beginPath(); c.moveTo(rx + 2, my); c.lineTo(rx + 18, my - 8); c.lineTo(rx + 18, my + 8); c.closePath(); c.fill();
  }

  MG.film({
    id: 'techinfinitezoom', dur: 10, poster: 4.62,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Infinite Zoom', sub: 'Self-similar picture, log-space camera', era: '1904 —',
      origin: 'An infinite zoom needs a picture that contains a scaled copy of itself — a Droste image, so named after the Dutch cocoa tin whose 1904 nurse holds a tin bearing her own picture — and a camera that scales by a constant factor per unit of time, so it moves evenly through log space. Fractal zoom films of the 1980s made it a computer-graphics spectacle; Eames Office’s Powers of Ten (1977) had already paced its journey as a factor of ten every ten seconds, and the rising Shepard–Risset tone is its sonic twin.',
      works: 'Powers of Ten (Charles and Ray Eames, 1977) · Droste cocoa tin artwork (1904) · Zoom (Istvan Banyai, picture book, 1995)',
      tech: ['Self-similar nesting, ratio K = 4', 'Exponential zoom Z = K^L, L linear in time', 'Aim at the fixed point; wrap L mod 1'],
      accent: '#ff5a1f',
      motionDNA: 'A held frame, an ease into a constant climb of one level per second — the hole swelling until it becomes the frame and the next Token arrives at the size the last one had — then an ease out that lands exactly on level 8, a frame identical to the first. No acceleration is felt in between, because every second is the same ×4.',
      visualDNA: 'The Technique Atlas stage seen through a rounded viewport: orange Tokens nested hole within hole, each on its own patch of gridded paper and lettered with its level and ×4^n; a crosshair on the fixed point; a HUD with the zoom factor, depth level, an exponential on a linear axis and a straight climb on a log ruler.',
      transitions: 'Continuous self-similar zoom; the end frame matches the start frame for a seamless loop',
      implementation: ['Droste / recursive comps zoomed with an exponential scale expression', 'Fractal explorers and shader zooms in log space', 'Canvas 2D: draw levels n−2 … n+8 from frac(L), nested hole clips'],
      reproducibility: 'Fully procedural',
      loopable: true,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      const L = izL(t);
      c.save(); rrect(c, IZ.vx, IZ.vy, IZ.vw, IZ.vh, 18); c.clip();
      izWorld(c, L);
      c.restore();
      rrect(c, IZ.vx, IZ.vy, IZ.vw, IZ.vh, 18); c.strokeStyle = P.ink; c.lineWidth = 2; c.stroke();
      // fixed point crosshair
      const [fx, fy] = [IZ.fx, IZ.fy];
      c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath();
      c.moveTo(fx - 22, fy); c.lineTo(fx - 7, fy); c.moveTo(fx + 7, fy); c.lineTo(fx + 22, fy);
      c.moveTo(fx, fy - 22); c.lineTo(fx, fy - 7); c.moveTo(fx, fy + 7); c.lineTo(fx, fy + 22); c.stroke();
      c.fillStyle = P.accent; c.beginPath(); c.arc(fx, fy, 3.5, 0, TAU); c.fill();
      label(c, 'FIXED POINT', fx + 28, fy - 12, { size: 13, ls: 2, color: P.ink, weight: 700 });
      // intro callout: the hole holds the next Token at 1/4
      const ci = seg(t, 0.15, 0.4) * (1 - seg(t, 1.2, 1.5));
      if (ci > 0.01) {
        c.save(); c.globalAlpha = ci;
        const S = IZ.S0 * Math.pow(IZ.K, L), hx = fx - IZ_H * S, hy = fy + IZ_H * S;
        c.strokeStyle = P.accentD; c.lineWidth = 2; c.setLineDash([6, 6]);
        c.beginPath(); c.arc(hx, hy, TK.HOLE.r * S + 8, 0, TAU); c.stroke(); c.setLineDash([]);
        plate(c, 960, 176, 430, 74);
        label(c, 'EACH HOLE HOLDS THE NEXT TOKEN', 980, 206, { size: 16, ls: 1, color: P.ink, weight: 700 });
        label(c, 'AT 1/4 SIZE  →  RATIO K = 4', 980, 234, { size: 16, ls: 1, color: P.accentD, weight: 700 });
        c.restore();
      }
      tag(c, 'INFINITE ZOOM  ·  ×4 EVERY SECOND, IN LOG SPACE', 72, 80, seg(t, 0.1, 0.4));
      izHud(c, t, L);
      TK.caption(c, t, W, H, { name: 'Infinite Zoom', cat: 'Camera', curve: u => izL(u * 10) / IZ.L, span: [0, 10], curveLabel: 'LOG ZOOM  L / TIME', lo: -0.1, hi: 1.15 });
    },
    score(A) {
      TK.bed(A, { g: 0.8 });
      // Shepard-style glissando: each voice climbs four octaves in four seconds (one octave per level),
      // swelling in and out, a new one every second, so the pitch rises forever like the zoom
      for (let k = 0; k < 9; k++) {
        const t0 = 0.5 + k;
        if (t0 + 4 > 10.2) break;
        A.osc(t0, { type: 'triangle', f: 98, f2: 98 * 16, glide: 4, dur: 4, a: 2, g: 0.045, lp: 3200, rev: 0.4, pan: (k % 2 ? 0.25 : -0.25) });
      }
      // a level passes every second from t = 2: a soft tick and a pluck on the downbeat
      for (let n = 1; n <= 7; n++) {
        const t = n + 1;   // L(t) = n at t = n + 1
        A.pluck(t, midi([72, 74, 76, 79, 81, 84, 86][n - 1]), { g: 0.1, bright: 0.6, dur: 0.9, pan: n % 2 ? 0.3 : -0.3 });
        A.osc(t, { f: 2800, dur: 0.03, g: 0.03 });
      }
      A.riser(7.6, 1.9, { g: 0.07, f: 110 });
      A.bell(9.5, midi(84), { g: 0.08, dur: 1.6, rev: 0.5 });
      A.chord(9.5, [60, 64, 67, 72], { type: 'triangle', dur: 1.8, g: 0.04, a: 0.04, lp: 2600, rev: 0.6, width: 0.8 });
    },
  });
})();
