/* batch k13 — Technique Atlas · Simulation, Temporal: techparticles · techrope · techfreeze.
   techparticles (an emitter in the Token's hole: birth rate, spread cone, speed, lifespan,
   gravity and drag changed on the beat; age drives colour and size; live count as the graph) ·
   techrope (a Verlet chain with distance constraints holding the Token: released, swung,
   yanked, dropped to one constraint pass and back to twenty, then lowered to pile on the floor) ·
   techfreeze (the picture holds on a single source frame while the clock, beat and overlays keep
   running: flash, desaturate, push-in, callout, a short hold, then a final freeze to end).
   Particles and rope are integrated once in setup (cached at module level so score() hears the
   same events); draw(t) only looks up and interpolates stored samples. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, midi, text } = MG;
  const TK = MG.TK, P = TK.P, PI = Math.PI, FL = TK.FLOOR;
  const FPS = 30, NF = 300;

  /* ---------------- shared helpers ---------------- */
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
  const pad = (n, k) => String(Math.max(0, n)).padStart(k, '0');
  const label = (c, s, x, y, o = {}) => text(c, s, x, y, { font: TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
  const tag = (c, s, x, y, on = 1) => {   // small accent dot + mono label, top-left of frame
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: P.ink, weight: 700, size: 20 });
    c.restore();
  };
  const phaseOf = (list, t) => { let i = 0; list.forEach((g, k) => { if (t >= g[0]) i = k; }); return i; };
  function arrow(c, x0, y0, x1, y1, col, w = 3) {
    const a = Math.atan2(y1 - y0, x1 - x0);
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = w; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - Math.cos(a) * 10, y1 - Math.sin(a) * 10); c.stroke(); c.lineCap = 'butt';
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - Math.cos(a - 0.45) * 16, y1 - Math.sin(a - 0.45) * 16); c.lineTo(x1 - Math.cos(a + 0.45) * 16, y1 - Math.sin(a + 0.45) * 16); c.closePath(); c.fill();
  }

  /* =====================================================================
     PARTICLES — an emitter sits in the Token's hole. Every particle gets a
     birth time (the running integral of the birth rate crossing the next
     whole number), and at birth it samples the emitter: a direction inside
     the spread cone, a speed, a lifespan. From then on it is integrated on
     its own (gravity and linear drag are fields that act on every live
     particle, so switching gravity on bends particles already in flight),
     bounces off the floor and dies when its age passes its lifespan. Age
     drives colour (hot white → orange → ink) and size. The parameters
     change on the beat: rate, cone, gravity, drag, gravity off, a shorter
     lifespan, rate to zero, then a single-frame 360° burst.
     ===================================================================== */
  const PA = { S: 200, tx: 640, hz: 60, sub: 4, axis: -64 * PI / 180 };
  PA.ty = FL - PA.S / 2; PA.ex = PA.tx + PA.S * TK.HOLE.x; PA.ey = PA.ty + PA.S * TK.HOLE.y;
  const STEP = E.lin;
  const pRate = t => kf(t, [[0, 0], [0.5, 0], [0.501, 30, STEP], [1.0, 30], [1.001, 110, STEP], [7.999, 110], [8.0, 0, STEP]]);
  const pSpread = t => kf(t, [[0, 14], [2.0, 14], [2.2, 70, E.outC], [3.0, 70], [3.2, 160, E.outC], [4.0, 160], [4.2, 36, E.outC]]);
  const pSpeed = t => kf(t, [[0, 450], [4.0, 450], [4.2, 1050, E.outC]]);
  const pLife = t => kf(t, [[0, 1.4], [7.0, 1.4], [7.15, 0.4, E.outC]]);
  const pGrav = t => kf(t, [[0, 0], [4.0, 0], [4.001, 1500, STEP], [6.0, 1500], [6.001, 0, STEP], [8.5, 0], [8.501, 1100, STEP]]);
  const pDrag = t => kf(t, [[0, 0.15], [5.0, 0.15], [5.15, 3.0, E.outC], [8.5, 3.0], [8.501, 0.9, STEP]]);
  const PB = { t: 8.5, n: 90 };
  const PPH = [
    [0, 'EMITTER', 'A POINT IN THE TOKEN’S HOLE  ·  RATE 0'],
    [0.5, 'BIRTH RATE  ·  30 / s', 'EACH PARTICLE GETS A BIRTH TIME'],
    [1.0, 'BIRTH RATE  ·  110 / s', 'MORE BIRTHS PER SECOND, SAME RULES'],
    [2.0, 'SPREAD CONE  ·  70°', 'A RANDOM DIRECTION INSIDE THE CONE'],
    [3.0, 'SPREAD CONE  ·  160°', 'WIDER CONE, SAME BIRTH RATE'],
    [4.0, 'GRAVITY ON', 'EVERY LIVE PARTICLE ACCELERATES DOWN'],
    [5.0, 'DRAG  ·  k = 3', 'VELOCITY DECAYS  ·  v′ = g − k·v'],
    [6.0, 'GRAVITY OFF', 'DRAG ALONE  ·  PARTICLES COAST TO A STOP'],
    [7.0, 'LIFESPAN  ·  1.4 → 0.4 s', 'SHORTER LIVES, FEWER ALIVE AT ONCE'],
    [8.0, 'RATE  ·  0', 'NO NEW BIRTHS  ·  THE REST AGE OUT'],
    [8.5, 'BURST  ·  90 AT ONCE', 'ONE FRAME OF BIRTHS, 360° CONE'],
  ];
  // parameter rows: name, getter, formatter, max (for the bar), change times
  const PROWS = [
    ['RATE', pRate, v => `${Math.round(v)} / s`, 110, [0.5, 1.0, 8.0]],
    ['SPREAD', pSpread, v => `${Math.round(v)}°`, 180, [2.0, 3.0, 4.0]],
    ['SPEED', pSpeed, v => `${Math.round(v)} px/s`, 1100, [4.0]],
    ['LIFESPAN', pLife, v => `${v.toFixed(2)} s`, 1.8, [7.0]],
    ['GRAVITY', pGrav, v => (v < 1 ? 'OFF' : `${Math.round(v)} px/s²`), 1500, [4.0, 6.0, 8.5]],
    ['DRAG k', pDrag, v => `${v.toFixed(2)} / s`, 3.2, [5.0, 8.5]],
  ];
  const PCOL = [[0, '#fff1c2'], [0.14, '#ffb347'], [0.4, P.accent], [0.75, P.accentD], [1, P.ink]];
  const PLUT = Array.from({ length: 64 }, (_, i) => {
    const u = i / 63; let k = 1; while (k < PCOL.length - 1 && PCOL[k][0] < u) k++;
    return mixc(PCOL[k - 1][1], PCOL[k][1], seg(u, PCOL[k - 1][0], PCOL[k][0]));
  });
  let PSIM = null;
  function partSim() {
    if (PSIM) return PSIM;
    const ps = [];
    // births from the integrated rate
    let acc = 0, k = 0;
    for (let i = 0; i < 8000; i++) {
      const t = i / 1000; acc += pRate(t + 0.0005) / 1000;
      while (acc >= k + 0.5 * hash(k * 1.3 + 7)) { ps.push({ tb: t, burst: false }); k++; }
    }
    for (let b = 0; b < PB.n; b++) ps.push({ tb: PB.t + 0.02 * hash(b + 400), burst: true });
    const dt = 1 / (PA.hz * PA.sub), bounces = [];
    let tot = 0;
    const buf = [];
    ps.forEach((p, i) => {
      const h1 = hash(i * 3.1 + 1), h2 = hash(i * 5.7 + 2), h3 = hash(i * 9.1 + 3), h4 = hash(i * 2.3 + 4), h5 = hash(i * 7.7 + 5);
      let ang, sp;
      if (p.burst) { ang = h1 * TAU; sp = 300 + 650 * h2; p.L = 0.8 + 0.6 * h3; }
      else { ang = PA.axis + (h1 - 0.5) * pSpread(p.tb) * PI / 180; sp = pSpeed(p.tb) * (0.75 + 0.5 * h2); p.L = pLife(p.tb) * (0.7 + 0.6 * h3); }
      p.sz = 0.7 + 0.6 * h4;
      const r0 = PA.S * TK.HOLE.r * 0.5 * h5, a0 = h1 * 31;
      let x = PA.ex + Math.cos(a0) * r0, y = PA.ey + Math.sin(a0) * r0, vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp;
      const ns = Math.ceil(p.L * PA.hz) + 2;
      p.off = tot; p.ns = ns; tot += ns;
      for (let j = 0; j < ns; j++) {
        buf.push(x, y);
        for (let s = 0; s < PA.sub; s++) {
          const tt = p.tb + (j * PA.sub + s) * dt, g = pGrav(tt), kd = pDrag(tt);
          vx -= kd * vx * dt; vy += (g - kd * vy) * dt; x += vx * dt; y += vy * dt;
          if (y > FL - 3) { y = FL - 3; if (vy > 0) { if (vy > 140 && tt < p.tb + p.L) bounces.push(tt); vy *= -0.38; vx *= 0.7; } }
        }
      }
    });
    const XY = new Float32Array(buf);
    const count = new Float32Array(NF + 1);
    for (let f = 0; f <= NF; f++) { const t = f / FPS; let n = 0; for (const p of ps) if (t >= p.tb && t < p.tb + p.L) n++; count[f] = n; }
    let cmax = 1; for (let f = 0; f <= NF; f++) cmax = Math.max(cmax, count[f]);
    // the tracked particle of each phase: the first one born after these times
    const track = [1.25, 2.35, 3.3, 4.3, 5.35, 6.3, 7.3, 8.5].map(t0 => ps.findIndex(p => p.tb >= t0 && (t0 !== 8.5 || p.burst)));
    PSIM = { ps, XY, count, cmax, bounces, track };
    return PSIM;
  }
  function pPos(S, i, age) {
    const p = S.ps[i], f = Math.min(age * PA.hz, p.ns - 1.001), j = Math.floor(f), u = f - j, o = (p.off + j) * 2;
    return [lerp(S.XY[o], S.XY[o + 2], u), lerp(S.XY[o + 1], S.XY[o + 3], u)];
  }
  const pCount = (S, t) => { const f = clamp(t / 10) * NF, i = Math.min(NF - 1, Math.floor(f)); return lerp(S.count[i], S.count[i + 1], f - i); };

  MG.film({
    id: 'techparticles', dur: 10, poster: 4.7,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Particles', sub: 'Emit, age, die', era: '1982 —',
      origin: 'William T. Reeves at Lucasfilm defined the particle system for the Genesis Effect in Star Trek II: The Wrath of Khan (1982) and described it in Particle Systems — A Technique for Modeling a Class of Fuzzy Objects (SIGGRAPH 1983): emitters generate particles with a birth rate, each gets an initial position, velocity, colour, size and lifetime, moves under simple forces and is killed when its age runs out. The same emit-update-kill loop drives Maya and Houdini particles, Trapcode Particular in After Effects and every game engine’s effects system.',
      works: 'Star Trek II: The Wrath of Khan (Nicholas Meyer, 1982; Genesis sequence, Lucasfilm) · Trapcode Particular (Peder Norrby, After Effects plug-in, mid-2000s) · Journey (thatgamecompany, 2012; sand and cloth particles)',
      tech: ['Birth rate integrated to birth times', 'Per-particle sampling at birth (cone, speed, life)', 'Age → colour and size; kill at lifespan'],
      accent: '#ff5a1f',
      motionDNA: 'A trickle that becomes a stream on the beat, fans out as the cone widens, arcs into a fountain when gravity switches on, thickens and hangs as drag bites, drifts to a standstill when gravity goes off, shrinks to a short-lived spray when the lifespan drops, stops, and ends on one 360° burst that rains onto the floor and ages out.',
      visualDNA: 'The Technique Atlas stage with its floor line: the orange Token standing at left with particles pouring from its hole, each a dot that is born hot white, turns orange and dies small and ink-dark. A dashed spread cone and a gravity arrow at the emitter, one tracked particle ringed with its whole path dotted and its age shown, a parameter panel at right with live count, and the live-particle count as the caption graph.',
      transitions: 'Parameter changes on the beat; the particles already alive keep the values they were born with, while gravity and drag act on all of them at once',
      implementation: ['Emitter + per-particle state (Reeves 1983 / Houdini POPs / Trapcode Particular)', 'Births from the integrated rate, positions integrated at 240 Hz in setup()', 'Canvas 2D: age-indexed colour LUT and size, sampled paths interpolated by age'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { sim: partSim() }; },
    draw(c, t, W, H, st) {
      const S = st.sim;
      TK.stage(c, W, H, { floor: FL });
      TK.shadow(c, PA.tx, FL, PA.S, 0);
      TK.token(c, PA.tx, PA.ty, PA.S);
      // spread cone and field arrows at the emitter
      const spr = pSpread(t) * PI / 180, bOn = seg(t, PB.t - 0.05, PB.t) * (1 - seg(t, PB.t + 0.6, PB.t + 0.9));
      const cOn = seg(t, 0.2, 0.5) * (1 - seg(t, 7.9, 8.1));
      if (cOn > 0.01) {
        c.save(); c.globalAlpha = cOn * 0.8; c.setLineDash([6, 7]); c.strokeStyle = P.ink; c.lineWidth = 1.5;
        const R = 190; c.beginPath();
        c.moveTo(PA.ex + Math.cos(PA.axis - spr / 2) * R, PA.ey + Math.sin(PA.axis - spr / 2) * R); c.lineTo(PA.ex, PA.ey);
        c.lineTo(PA.ex + Math.cos(PA.axis + spr / 2) * R, PA.ey + Math.sin(PA.axis + spr / 2) * R); c.stroke();
        c.beginPath(); c.arc(PA.ex, PA.ey, R * 0.8, PA.axis - spr / 2, PA.axis + spr / 2); c.stroke(); c.setLineDash([]);
        label(c, `${Math.round(pSpread(t))}°`, PA.ex + Math.cos(PA.axis) * (R + 26), PA.ey + Math.sin(PA.axis) * (R + 26) + 6, { align: 'center', size: 16, color: P.ink, weight: 700 });
        c.restore();
      }
      if (bOn > 0.01) { c.save(); c.globalAlpha = bOn * 0.6; c.setLineDash([6, 7]); c.strokeStyle = P.ink; c.lineWidth = 1.5; c.beginPath(); c.arc(PA.ex, PA.ey, 150, 0, TAU); c.stroke(); c.restore(); }
      const g = pGrav(t), gOn = clamp(g / 1100);
      if (gOn > 0.01) { c.save(); c.globalAlpha = gOn; arrow(c, 1340, 440, 1340, 560, P.ink, 4); label(c, `g ${Math.round(g)}`, 1358, 506, { size: 16, color: P.ink, weight: 700 }); c.restore(); }
      const kd = pDrag(t), dOn = seg(kd, 0.2, 2.5);
      if (dOn > 0.01) {
        c.save(); c.globalAlpha = dOn; c.strokeStyle = P.ink; c.lineWidth = 2;
        for (let i = 0; i < 3; i++) { c.beginPath(); for (let x = 0; x <= 60; x += 4) { const y = 610 + i * 14 + 4 * Math.sin(x * 0.2 + i); x ? c.lineTo(1318 + x, y) : c.moveTo(1318 + x, y); } c.stroke(); }
        label(c, `DRAG ${kd.toFixed(1)}`, 1392, 632, { size: 16, color: P.ink, weight: 700 }); c.restore();
      }
      // tracked particle: its whole path dotted, ring + age
      const ti = S.track[[1.25, 2.35, 3.3, 4.3, 5.35, 6.3, 7.3, 8.5].reduce((a, t0, k) => (t >= t0 ? k : a), -1)];
      let tp = null;
      if (ti !== undefined && ti >= 0) {
        const p = S.ps[ti], age = t - p.tb;
        if (age >= 0 && age < p.L) {
          c.fillStyle = 'rgba(23,24,28,0.3)';
          for (let a = 0; a < p.L; a += 1 / 30) { const q = pPos(S, ti, a); c.beginPath(); c.arc(q[0], q[1], 1.8, 0, TAU); c.fill(); }
          tp = { p, age, q: pPos(S, ti, age) };
        }
      }
      // the particles
      for (let i = 0; i < S.ps.length; i++) {
        const p = S.ps[i], age = t - p.tb;
        if (age < 0 || age >= p.L) continue;
        const u = age / p.L, q = pPos(S, i, age), r = lerp(12, 2.5, Math.pow(u, 0.8)) * p.sz;
        c.globalAlpha = 1 - seg(u, 0.8, 1) * 0.9;
        c.fillStyle = PLUT[Math.round(u * 63)];
        c.beginPath(); c.arc(q[0], q[1], r, 0, TAU); c.fill();
      }
      c.globalAlpha = 1;
      if (tp) {
        const [x, y] = tp.q;
        c.strokeStyle = P.ink; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, 20, 0, TAU); c.stroke();
        c.beginPath(); c.moveTo(x + 14, y - 14); c.lineTo(x + 40, y - 40); c.lineTo(x + 70, y - 40); c.stroke();
        c.fillStyle = 'rgba(236,232,223,0.85)'; c.fillRect(x + 72, y - 62, 236, 50);
        label(c, `AGE ${tp.age.toFixed(2)} / ${tp.p.L.toFixed(2)} s`, x + 78, y - 41, { size: 16, color: P.ink, weight: 700, ls: 2 });
        label(c, `BORN AT ${tp.p.tb.toFixed(2)} s`, x + 78, y - 19, { size: 14, ls: 2 });
      }
      // phase tag + age legend
      const ph = PPH[phaseOf(PPH, t)];
      const on = seg(t, ph[0], ph[0] + 0.2) * seg(t, 0.05, 0.3);
      tag(c, ph[1], 72, 80, on);
      c.save(); c.globalAlpha = on; label(c, ph[2], 98, 112, { size: 15, ls: 2 }); c.restore();
      const lx = 98, ly = 170, lw = 300;
      label(c, 'AGE → COLOUR + SIZE', lx, ly - 18, { size: 14, ls: 2, color: P.ink, weight: 700 });
      for (let i = 0; i <= 8; i++) { const u = i / 8; c.fillStyle = PLUT[Math.round(u * 63)]; c.beginPath(); c.arc(lx + u * lw, ly + 16, lerp(12, 2.5, Math.pow(u, 0.8)), 0, TAU); c.fill(); }
      label(c, 'BIRTH', lx, ly + 52, { size: 13, ls: 2 }); label(c, 'DEATH', lx + lw, ly + 52, { size: 13, ls: 2, align: 'right' });
      // parameter panel
      const px = 1440, py = 64, pw = 408;
      c.fillStyle = 'rgba(236,232,223,0.9)'; c.fillRect(px - 16, py - 8, pw + 32, 360);
      c.strokeStyle = 'rgba(23,24,28,0.2)'; c.lineWidth = 1; c.strokeRect(px - 15.5, py - 7.5, pw + 31, 359);
      label(c, 'EMITTER PARAMETERS', px, py + 24, { size: 15, ls: 3, color: P.ink, weight: 700 });
      PROWS.forEach(([nm, fn, fmt, mx, ch], i) => {
        const y = py + 66 + i * 40, v = fn(t), hot = ch.some(t0 => t >= t0 && t < t0 + 0.9);
        label(c, nm, px, y, { size: 15, ls: 2, color: hot ? P.accentD : P.ink, weight: hot ? 700 : 400 });
        label(c, fmt(v), px + pw, y, { size: 15, ls: 1, color: hot ? P.accentD : P.ink, weight: 700, align: 'right' });
        c.fillStyle = 'rgba(23,24,28,0.1)'; c.fillRect(px, y + 9, pw, 4);
        c.fillStyle = hot ? P.accent : P.ink; c.fillRect(px, y + 9, pw * clamp(v / mx), 4);
      });
      const n = Math.round(pCount(S, t)), born = S.ps.reduce((a, p) => a + (p.tb <= t ? 1 : 0), 0);
      label(c, 'LIVE', px, py + 326, { size: 15, ls: 3 });
      text(c, String(n), px + 70, py + 330, { font: TK.FONT, weight: 800, size: 38, color: P.accent });
      label(c, `BORN ${born}`, px + pw, py + 326, { size: 15, ls: 2, align: 'right', color: P.ink });
      TK.caption(c, t, W, H, { name: 'Particles', cat: 'Simulation', curve: u => pCount(S, u * 10) / S.cmax, span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'LIVE PARTICLES / TIME' });
    },
    score(A) {
      TK.bed(A);
      const S = partSim();
      // the emission hiss follows births per 1/8 s
      for (let w = 0; w < 80; w++) {
        const t0 = w / 8; let n = 0;
        for (const p of S.ps) if (!p.burst && p.tb >= t0 && p.tb < t0 + 0.125) n++;
        if (n) A.noise(t0, { type: 'bandpass', f: 2600 + pSpread(t0) * 10, q: 1.2, dur: 0.16, g: Math.min(0.045, 0.011 * Math.sqrt(n)), a: 0.03, pan: 0.15 });
      }
      // single births are audible while the rate is low
      S.ps.forEach(p => { if (p.tb < 1.0) A.osc(p.tb, { f: 2400 + 800 * hash(p.tb * 9), dur: 0.03, g: 0.035, pan: 0.2 }); });
      // a pluck for every parameter change
      PPH.slice(1).forEach(([t0], i) => A.pluck(t0, midi([67, 72, 74, 79, 64, 60, 69, 76, 62, 84][i]), { g: 0.15, bright: 0.6, dur: 0.9, rev: 0.3 }));
      A.osc(4.0, { type: 'triangle', f: 900, f2: 180, glide: 0.35, dur: 0.4, g: 0.07 });
      A.noise(5.0, { type: 'lowpass', f: 3000, f2: 300, dur: 0.9, g: 0.06 });
      A.osc(6.0, { type: 'triangle', f: 180, f2: 900, glide: 0.35, dur: 0.4, g: 0.06 });
      for (let k = 0; k < 6; k++) A.osc(7.0 + k * 0.08, { f: 3200 - k * 300, dur: 0.03, g: 0.03 });
      // burst
      A.impact(PB.t, 0.3);
      A.noise(PB.t, { type: 'highpass', f: 2500, dur: 0.6, g: 0.08, rev: 0.4 });
      [84, 88, 91, 96].forEach((m, i) => A.bell(PB.t + 0.02 + i * 0.05, midi(m), { g: 0.04, dur: 1.2, rev: 0.5, pan: (i - 1.5) * 0.3 }));
      // floor patter, bucketed
      const bk = {};
      S.bounces.forEach(t => { const k = Math.floor(t * 20); bk[k] = (bk[k] || 0) + 1; });
      Object.keys(bk).forEach(k => A.noise(+k / 20, { type: 'bandpass', f: 4200, q: 2, dur: 0.03, g: Math.min(0.06, 0.012 * bk[k]), pan: -0.1 }));
      A.chord(9.0, [60, 64, 67, 72], { type: 'sine', dur: 1.0, g: 0.025, a: 0.05, rev: 0.6, width: 0.6 });
    },
  });

  /* =====================================================================
     ROPE — 25 nodes joined by 24 distance constraints, plus the Token as a
     heavy body hung from the last node. Each step moves every node by
     Verlet (x′ = x + (x − x_prev) + g·dt²), then projects the constraints
     a set number of times: with twenty passes the links come back to rest
     length and the rope stays taut; with one pass the error is never
     fully corrected and the rope stretches like elastic under the Token's
     weight. Held out and released, swung, yanked by the anchor, dropped to
     1 iteration and back to 20, then lowered until it piles on the floor.
     Links are coloured by strain; nodes are drawn as points.
     ===================================================================== */
  const RP = { n: 25, len: 500, S: 150, g: 1800, sub: 3, ax: 960, ay: 110, hold: 0.5, pre: 1.2, damp: 0.993 };
  RP.r = RP.len / (RP.n - 1);
  const rAX = t => kf(t, [[0, RP.ax], [2.0, RP.ax], [2.2, 1130, E.outC], [3.0, 1130], [3.2, 800, E.outC], [4.0, 800], [4.6, 960, E.ioS], [6.6, 960], [8.4, 1260, E.ioS]]);
  const rAY = t => kf(t, [[0, RP.ay], [6.6, RP.ay], [8.4, 700, E.ioS]]);
  const rIter = t => (t < 4 ? 20 : t < 6 ? 1 : Math.min(20, 1 + Math.floor((t - 6) * 60)));
  const RPH = [
    [0, 'HELD OUT', '25 NODES  ·  24 DISTANCE CONSTRAINTS  ·  THE TOKEN AT THE END'],
    [0.5, 'RELEASE', 'VERLET  ·  x′ = x + (x − x_prev) + g·dt²'],
    [2.0, 'YANK', 'THE ANCHOR MOVES  ·  A WAVE RUNS DOWN THE ROPE'],
    [4.0, '1 ITERATION', 'ONE CONSTRAINT PASS PER STEP  ·  ERROR PILES UP, THE ROPE STRETCHES'],
    [6.0, '20 ITERATIONS', 'TWENTY PASSES PER STEP  ·  THE LINKS SNAP BACK TO LENGTH'],
    [6.6, 'LOWER', 'THE ANCHOR COMES DOWN  ·  THE ROPE GOES SLACK'],
    [7.6, 'SETTLE', 'FLOOR CONTACT + FRICTION  ·  THE ROPE PILES UP'],
  ];
  let ROPE = null;
  function ropeSim() {
    if (ROPE) return ROPE;
    const n = RP.n, N = n + 1, T = n, AT = n - 1, S2 = RP.S / 2, dt = 1 / (FPS * RP.sub), dt2 = dt * dt;
    const X = new Float64Array(N), Y = new Float64Array(N), PX = new Float64Array(N), PY = new Float64Array(N), IM = new Float64Array(N);
    const a0 = 34 * PI / 180, dx = Math.cos(a0), dy = Math.sin(a0);
    for (let i = 0; i < n; i++) { X[i] = RP.ax + i * RP.r * dx * 0.97; Y[i] = RP.ay + i * RP.r * dy * 0.97; IM[i] = 1; }
    X[T] = X[AT] + dx * S2; Y[T] = Y[AT] + dy * S2;
    IM[0] = 0; IM[AT] = 0.5; IM[T] = 0.04;
    const HX = [X[AT], X[T]], HY = [Y[AT], Y[T]];
    for (let i = 0; i < N; i++) { PX[i] = X[i]; PY[i] = Y[i]; }
    let grounded = false, landT = -1, peakV = 0;
    const tokH = () => { const a = Math.atan2(Y[T] - Y[AT], X[T] - X[AT]) - PI / 2; return S2 * (Math.abs(Math.cos(a)) + Math.abs(Math.sin(a))) * 0.9; };
    function solve(a, b, rest) {
      const wa = IM[a], wb = IM[b], ws = wa + wb; if (!ws) return;
      const ex = X[b] - X[a], ey = Y[b] - Y[a], d = Math.hypot(ex, ey); if (d < 1e-6) return;
      const k = (d - rest) / (d * ws);
      X[a] += ex * k * wa; Y[a] += ey * k * wa; X[b] -= ex * k * wb; Y[b] -= ey * k * wb;
    }
    let floorHits = 0;
    const onF = new Uint8Array(N);
    function step(t) {
      const held = t < RP.hold;
      for (let i = 1; i < N; i++) {
        const vx = (X[i] - PX[i]) * RP.damp, vy = (Y[i] - PY[i]) * RP.damp;
        PX[i] = X[i]; PY[i] = Y[i]; X[i] += vx; Y[i] += vy + RP.g * dt2;
      }
      X[0] = rAX(Math.max(0, t)); Y[0] = rAY(Math.max(0, t));
      if (held) { X[AT] = HX[0]; Y[AT] = HY[0]; X[T] = HX[1]; Y[T] = HY[1]; PX[AT] = X[AT]; PY[AT] = Y[AT]; PX[T] = X[T]; PY[T] = Y[T]; }
      const sv = [IM[AT], IM[T]]; if (held) { IM[AT] = 0; IM[T] = 0; }
      const it = rIter(t);
      grounded = false;
      for (let k = 0; k < it; k++) {
        for (let i = 0; i < n - 1; i++) solve(i, i + 1, RP.r);
        for (let q = 0; q < 3; q++) solve(AT, T, S2);   // the Token itself is rigid
        for (let i = 1; i < n - 2; i++) {   // the rope cannot pass through the Token
          const ex = X[i] - X[T], ey = Y[i] - Y[T], d = Math.hypot(ex, ey), R0 = S2 * 1.02;
          if (d < R0 && d > 1e-6) { X[i] = X[T] + ex / d * R0; Y[i] = Y[T] + ey / d * R0; }
        }
        for (let i = 1; i < n; i++) if (Y[i] > FL - 4) {
          Y[i] = FL - 4; PX[i] = lerp(PX[i], X[i], 0.6);
          if (!onF[i]) { onF[i] = 1; floorHits++; }
        } else if (Y[i] < FL - 20) onF[i] = 0;
        const h = tokH();
        if (Y[T] > FL - h) {
          Y[T] = FL - h; PX[T] = lerp(PX[T], X[T], 0.85); grounded = true;
          X[AT] = lerp(X[AT], X[T], 0.3); Y[AT] = lerp(Y[AT], Y[T] - S2, 0.3);   // stands upright on landing
        }
      }
      IM[AT] = sv[0]; IM[T] = sv[1];
    }
    const pre = Math.round(RP.pre * FPS * RP.sub);
    for (let s = 0; s < pre; s++) step(-RP.pre + s * dt);
    const fr = new Float32Array((NF + 1) * N * 2), stretch = new Float32Array(NF + 1), speed = new Float32Array(NF + 1), hits = new Float32Array(NF + 1);
    const save = k => {
      const o = k * N * 2; let L = 0;
      for (let i = 0; i < N; i++) { fr[o + i * 2] = X[i]; fr[o + i * 2 + 1] = Y[i]; }
      for (let i = 0; i < n - 1; i++) L += Math.hypot(X[i + 1] - X[i], Y[i + 1] - Y[i]);
      stretch[k] = L / RP.len;
    };
    save(0);
    for (let k = 1; k <= NF; k++) {
      floorHits = 0;
      for (let s = 0; s < RP.sub; s++) step((k - 1) / FPS + s * dt);
      save(k);
      hits[k] = floorHits;
      speed[k] = Math.hypot(X[T] - PX[T], Y[T] - PY[T]) / dt;
      peakV = Math.max(peakV, speed[k]);
      if (grounded && landT < 0) landT = k / FPS;
    }
    let smax = 1; for (let k = 0; k <= NF; k++) smax = Math.max(smax, stretch[k]);
    // swing peaks: local maxima of Token speed
    const sw = [];
    for (let k = 2; k < NF; k++) if (speed[k] > 500 && speed[k] >= speed[k - 1] && speed[k] >= speed[k + 1]) sw.push([k / FPS, speed[k] / peakV]);
    ROPE = { fr, N, stretch, smax, hits, landT, sw };
    return ROPE;
  }
  const rStretch = (R, t) => { const f = clamp(t / 10) * NF, i = Math.min(NF - 1, Math.floor(f)); return lerp(R.stretch[i], R.stretch[i + 1], f - i); };

  MG.film({
    id: 'techrope', dur: 10, poster: 4.6,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Rope', sub: 'Verlet nodes, distance constraints', era: '1967 —',
      origin: 'Verlet integration was introduced to molecular dynamics by Loup Verlet in 1967: positions advance from the current and previous position, so velocity is implicit. Thomas Jakobsen’s Advanced Character Physics (GDC 2001), written from IO Interactive’s Hitman, paired it with relaxation — repeatedly projecting each distance constraint back to its rest length — and the more passes per step, the stiffer the result. Müller, Heidelberger, Hennix and Ratcliff generalised the idea as Position Based Dynamics (2006); ropes, chains, hair and cables in games and rigging tools are built on it.',
      works: 'Hitman: Codename 47 (IO Interactive, 2000; Verlet ragdolls) · Cut the Rope (ZeptoLab, 2010) · Half-Life 2 (Valve, 2004; physics ropes and cables)',
      tech: ['Verlet integration (position + previous position)', 'Distance-constraint relaxation, N passes per step', 'Kinematic anchor, heavy end mass, floor friction'],
      accent: '#ff5a1f',
      motionDNA: 'Held out to the side and let go on the beat, the Token swings as a heavy pendulum on a chain that bows behind it. The anchor jerks right then left, and whip-waves run down the links. At 4 s the solver drops to one pass and the rope stretches like a bungee, bouncing the Token low; at 6 s it returns to twenty and the rope snaps taut, kicking the Token up. Then the anchor descends, the Token lands and stands, and the rope folds down onto the floor and settles.',
      visualDNA: 'The Technique Atlas stage with its floor line: an ink anchor ring, a thick rope of 24 links coloured by strain (ink at rest length, orange when stretched) with every node drawn as a point, the orange Token hanging from the last node. A large iteration counter with twenty pips, a one-link projection diagram and rope length readout at right; rope stretch as the caption graph.',
      transitions: 'A release, kinematic yanks, and a solver setting switched on the beat',
      implementation: ['Verlet + constraint relaxation (Jakobsen 2001 / Position Based Dynamics)', 'Simulated once in setup() at 240 Hz, iteration count keyed over time', 'Canvas 2D: per-link strain colour, interpolated node positions'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { sim: ropeSim() }; },
    draw(c, t, W, H, st) {
      const R = st.sim, N = R.N, n = RP.n;
      TK.stage(c, W, H, { floor: FL });
      const f = clamp(t / 10) * NF, i0 = Math.min(NF - 1, Math.floor(f)), u = f - i0;
      const X = k => lerp(R.fr[(i0 * N + k) * 2], R.fr[((i0 + 1) * N + k) * 2], u);
      const Y = k => lerp(R.fr[(i0 * N + k) * 2 + 1], R.fr[((i0 + 1) * N + k) * 2 + 1], u);
      const xs = [], ys = []; for (let k = 0; k < N; k++) { xs.push(X(k)); ys.push(Y(k)); }
      // anchor path hint while it moves
      const ax = xs[0], ay = ys[0];
      // token
      const T = n, AT = n - 1, ang = Math.atan2(ys[T] - ys[AT], xs[T] - xs[AT]) - PI / 2;
      const lift = Math.max(0, FL - (ys[T] + RP.S / 2));
      TK.shadow(c, xs[T], FL, RP.S, lift);
      // links coloured by strain
      c.lineCap = 'round';
      for (let k = 0; k < n - 1; k++) {
        const d = Math.hypot(xs[k + 1] - xs[k], ys[k + 1] - ys[k]), e = d / RP.r - 1;
        c.strokeStyle = e > 0.01 ? mixc(P.ink, P.accent, clamp(e / 0.45)) : P.ink;
        c.lineWidth = 7 / Math.sqrt(Math.max(1, 1 + e));
        c.beginPath(); c.moveTo(xs[k], ys[k]); c.lineTo(xs[k + 1], ys[k + 1]); c.stroke();
      }
      c.lineCap = 'butt';
      TK.token(c, xs[T], ys[T], RP.S, { rot: ang });
      // the rope's attach eye on the Token
      for (let k = 1; k < n; k++) {
        c.fillStyle = P.ground; c.beginPath(); c.arc(xs[k], ys[k], 5, 0, TAU); c.fill();
        c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.arc(xs[k], ys[k], 5, 0, TAU); c.stroke();
      }
      // anchor
      c.fillStyle = P.ink; c.beginPath(); c.arc(ax, ay, 15, 0, TAU); c.fill();
      c.fillStyle = P.accent; c.beginPath(); c.arc(ax, ay, 6, 0, TAU); c.fill();
      if (ay < 200) { c.strokeStyle = 'rgba(23,24,28,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(ax, 0); c.lineTo(ax, ay - 15); c.stroke(); }
      label(c, 'ANCHOR', ax + 26, ay + 6, { size: 14, ls: 2, color: P.ink, weight: 700 });
      // phase tag
      const pi = phaseOf(RPH, t), ph = RPH[pi], on = seg(t, ph[0], ph[0] + 0.2) * seg(t, 0.05, 0.3);
      tag(c, ph[1], 72, 80, on);
      c.save(); c.globalAlpha = on; label(c, ph[2], 98, 112, { size: 15, ls: 2 }); c.restore();
      const sl = rStretch(R, t);
      label(c, 'ROPE LENGTH', 98, 160, { size: 15, ls: 3 });
      text(c, `${Math.round(sl * 100)}%`, 98, 214, { font: TK.FONT, weight: 800, size: 48, color: sl > 1.04 ? P.accent : P.ink });
      label(c, 'OF REST LENGTH', 98, 242, { size: 13, ls: 2 });
      // iteration panel
      const it = rIter(t), px = 1440, py = 64, pw = 408, hot = (t >= 4 && t < 4.8) || (t >= 6 && t < 6.8);
      label(c, 'CONSTRAINT ITERATIONS / STEP', px, py + 18, { size: 15, ls: 2, color: P.ink, weight: 700 });
      text(c, String(it), px + pw, py + 84, { font: TK.FONT, weight: 800, size: 64, color: hot ? P.accent : P.ink, align: 'right' });
      for (let k = 0; k < 20; k++) {
        const x = px + k * 15, lit = k < it;
        c.fillStyle = lit ? (hot ? P.accent : P.ink) : 'rgba(23,24,28,0.12)'; c.fillRect(x, py + 50, 10, 30);
      }
      label(c, '3 STEPS PER FRAME  ·  90 Hz', px, py + 106, { size: 13, ls: 2 });
      // one-link projection diagram
      const dy = py + 172, dx0 = px + 40, dx1 = px + 300, rest = 180, mid = (dx0 + dx1) / 2;
      c.setLineDash([4, 5]); c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(mid - rest / 2, dy - 26); c.lineTo(mid - rest / 2, dy + 26); c.moveTo(mid + rest / 2, dy - 26); c.lineTo(mid + rest / 2, dy + 26); c.stroke(); c.setLineDash([]);
      c.strokeStyle = P.accent; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(dx0, dy); c.lineTo(dx1, dy); c.stroke(); c.lineCap = 'butt';
      [dx0, dx1].forEach(x => { c.fillStyle = P.ground; c.beginPath(); c.arc(x, dy, 7, 0, TAU); c.fill(); c.strokeStyle = P.ink; c.lineWidth = 2.5; c.stroke(); });
      arrow(c, dx0 + 2, dy + 34, mid - rest / 2 + 2, dy + 34, P.ink, 2.5);
      arrow(c, dx1 - 2, dy + 34, mid + rest / 2 - 2, dy + 34, P.ink, 2.5);
      label(c, 'REST', mid, dy - 34, { size: 13, ls: 2, align: 'center' });
      label(c, 'ONE PASS: MOVE BOTH ENDS', px, dy + 76, { size: 13, ls: 2, color: P.ink });
      label(c, 'BACK TOWARD REST LENGTH', px, dy + 96, { size: 13, ls: 2, color: P.ink });
      // strain legend
      const ly = dy + 140;
      for (let k = 0; k < 40; k++) { c.fillStyle = mixc(P.ink, P.accent, k / 39); c.fillRect(px + k * 7.5, ly, 7.5, 8); }
      label(c, 'AT REST', px, ly + 28, { size: 13, ls: 2 }); label(c, 'STRETCHED', px + 300, ly + 28, { size: 13, ls: 2, align: 'right' });
      TK.caption(c, t, W, H, { name: 'Rope', cat: 'Simulation', curve: v => (rStretch(R, v * 10) - 1) / (R.smax - 1), span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'ROPE STRETCH / TIME' });
    },
    score(A) {
      TK.bed(A);
      const R = ropeSim();
      A.osc(RP.hold, { type: 'square', f: 2400, f2: 1600, dur: 0.04, g: 0.04, lp: 5000 });
      R.sw.forEach(([t, v], i) => A.whoosh(t - 0.18, 0.4, { f1: 200 + 300 * v, f2: 900 + 1600 * v, g: 0.09 * v + 0.02, q: 1.6, swell: 0.5, pan: (i % 2 ? 0.35 : -0.35) }));
      [2.0, 3.0].forEach((t, i) => { A.noise(t, { type: 'bandpass', f: 1800, q: 1.4, dur: 0.06, g: 0.14 }); A.osc(t, { type: 'triangle', f: 220, f2: 90, dur: 0.18, g: 0.08, pan: i ? -0.3 : 0.3 }); A.whoosh(t, 0.5, { f1: 400, f2: 2800, g: 0.08, swell: 0.3 }); });
      // 20 → 1: the rope goes rubbery
      A.osc(4.0, { type: 'sawtooth', f: 880, f2: 110, glide: 0.4, dur: 0.45, g: 0.04, lp: 1600 });
      A.osc(4.05, { type: 'sine', f: 120, f2: 70, glide: 0.6, dur: 0.9, g: 0.12, vib: [7, 12] });
      // 1 → 20: snap
      A.osc(6.0, { type: 'sawtooth', f: 110, f2: 880, glide: 0.08, dur: 0.12, g: 0.05, lp: 3000 });
      A.noise(6.0, { type: 'highpass', f: 2500, dur: 0.05, g: 0.16 });
      A.impact(6.02, 0.22);
      A.pluck(6.0, midi(43), { g: 0.25, bright: 0.8, dur: 1.4 });
      if (R.landT > 0) { A.osc(R.landT, { f: 110, f2: 45, dur: 0.3, g: 0.22 }); A.noise(R.landT, { type: 'lowpass', f: 500, dur: 0.18, g: 0.12 }); }
      for (let k = 1; k <= NF; k++) if (R.hits[k] > 0) A.noise(k / FPS, { type: 'bandpass', f: 700, q: 1.2, dur: 0.05, g: Math.min(0.08, 0.025 * R.hits[k]), pan: 0.25 });
      A.chord(8.4, [55, 62, 67, 71], { type: 'triangle', dur: 1.6, g: 0.03, a: 0.08, lp: 2000, rev: 0.5, width: 0.6 });
    },
  });

  /* =====================================================================
     FREEZE FRAME — the picture is a function of source time s, every
     overlay is a function of output time t. A freeze is a stretch of
     output time during which s stops: the Token is caught at the peak of
     a hop, mid-flip, and that one source frame repeats while the beat,
     the timecode and the presentation keep going. The first freeze
     stacks the classic treatments one by one — flash, desaturate,
     push-in, callout — then releases; the second is a short punch on a
     beat; the third holds to the end. A strip of the last ten output
     frames shows the same source frame number repeating.
     ===================================================================== */
  const FZ = { S: 170, x0: 330, vx: 170, hop: 280 };
  const FHOLD = [[1.5, 3.0, 'A'], [5.0, 5.5, 'B'], [7.5, 10.5, 'END']];
  function fSrc(t) { let s = t; for (const [a, b] of FHOLD) { if (t >= b) s -= b - a; else if (t > a) s -= t - a; } return s; }
  function fHold(t) { for (const h of FHOLD) if (t >= h[0] && t < h[1]) return { a: h[0], b: h[1], k: h[2], age: t - h[0] }; return null; }
  const fOut = s => s + (s > 1.5 ? 1.5 : 0) + (s > 3.5 ? 0.5 : 0);
  function fPose(s) {
    const k = Math.floor(s), ph = s - k, air = seg(ph, 0.1, 0.9), inAir = ph > 0.1 && ph < 0.9;
    const h = inAir ? 4 * air * (1 - air) * FZ.hop : 0;
    const gp = ph >= 0.9 ? (ph - 0.9) / 0.2 : ph <= 0.1 ? (ph + 0.1) / 0.2 : -1;
    const sq = gp >= 0 ? Math.sin(PI * gp) * 0.14 : 0;
    const rot = (k + E.ioS(air)) * PI / 2;
    return { x: FZ.x0 + s * FZ.vx, y: FL - FZ.S / 2 * (1 - sq) - h, rot, sx: 1 + sq, sy: 1 - sq, h, k, inAir };
  }
  // the picture: everything here is a function of source time s only
  function fPicture(c, s, W, H) {
    TK.stage(c, W, H, { floor: FL });
    // dust from the last landing
    const kl = Math.floor(s - 0.9), al = s - (kl + 0.9);
    if (kl >= 0 && al < 0.5) {
      const lx = FZ.x0 + (kl + 0.9) * FZ.vx;
      c.fillStyle = `rgba(143,138,128,${0.5 * (1 - al / 0.5)})`;
      for (let i = 0; i < 8; i++) { const d = (i % 2 ? 1 : -1) * (30 + 140 * E.outC(al / 0.5) * (0.6 + 0.4 * hash(i + kl * 9))); c.beginPath(); c.arc(lx + d, FL - 8 - 30 * al * hash(i + 3), 8 + 10 * al, 0, TAU); c.fill(); }
    }
    const q = fPose(s);
    if (q.inAir) for (let i = 4; i >= 1; i--) {
      const g = fPose(s - i * 0.035);
      c.save(); c.translate(g.x, g.y); c.rotate(g.rot); TK.tokenPath(c, FZ.S); c.restore();
      c.strokeStyle = `rgba(198,62,12,${0.45 - i * 0.09})`; c.lineWidth = 2; c.stroke();
    }
    TK.shadow(c, q.x, FL, FZ.S, q.h);
    TK.token(c, q.x, q.y, FZ.S, { rot: q.rot, sx: q.sx, sy: q.sy });
    return q;
  }
  const tc = t => { const sec = Math.floor(t + 1e-6), fr = Math.floor((t - sec) * 24 + 1e-6); return `00:00:${pad(sec, 2)}:${pad(fr, 2)}`; };

  MG.film({
    id: 'techfreeze', dur: 10, poster: 2.45,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Freeze Frame', sub: 'One frame held while time runs on', era: '1920s —',
      origin: 'A freeze frame is made by printing the same frame again and again: on the optical printer it was step-printing one negative frame for as many output frames as the hold needed, in editing software it is a hold or a still. Silent and early sound films used it for comic and dramatic stops; François Truffaut’s closing freeze on Jean-Pierre Léaud in The 400 Blows (1959) made it a signature ending, and Butch Cassidy and the Sundance Kid (1969) froze its heroes mid-charge, the frame going sepia. Television, sport replays and character-intro title cards added the flash, the push-in and the callout.',
      works: 'The 400 Blows / Les Quatre Cents Coups (François Truffaut, 1959; final freeze) · Butch Cassidy and the Sundance Kid (George Roy Hill, 1969; final freeze to sepia) · Lock, Stock and Two Smoking Barrels (Guy Ritchie, 1998; freeze-frame character intros)',
      tech: ['Source frame held, output clock running', 'Flash, desaturate, push-in, callout on the hold', 'Release back into motion; final freeze to end'],
      accent: '#ff5a1f',
      motionDNA: 'A lively run of hops, each a quarter-turn flip with squash on landing, on the beat. At 1.5 s it stops dead at the peak of a hop, tilted 45° in the air, for a second and a half while the beat plays on: a flash, the colour drains, the camera eases in, a callout draws itself; then it snaps back into colour and motion. A half-second punch hold on the beat at 5 s, and a final freeze at the peak of the last hop that drains to grey and pushes in slowly to the end.',
      visualDNA: 'The Technique Atlas stage with its floor line: the orange Token hopping left to right with ghost outlines and dust puffs. A filmstrip of the last ten output frames along the top, each with its source frame number, a HOLD bracket over repeats; a running timecode beside a held frame counter; a checklist of treatments that ticks off during the first hold; a leader-line callout; and the source-time curve as the caption graph.',
      transitions: 'Hard stops into holds with a white flash, a snap release back into colour, and a closing freeze',
      implementation: ['Optical-printer step printing / editorial hold frames', 'After Effects Freeze Frame or Time Remap hold, Premiere and Resolve frame holds', 'Canvas 2D: picture drawn from held source time s, overlays from output time t, saturation composite for desaturation'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const s = fSrc(t), hd = fHold(t), sq = fPose(s);
      // presentation amounts
      let flash = 0, desat = 0, zoom = 1;
      const rel = (b, d) => 1 - E.outC(seg(t, b, b + d));
      for (const [a, b, k] of FHOLD) {
        if (t < a) continue;
        const age = t - a;
        flash = Math.max(flash, 0.9 * (1 - E.outC(seg(age, 0, 0.28))) * (age < 0.3 ? 1 : 0));
        if (k === 'A') { desat = Math.max(desat, E.outC(seg(age, 0.12, 0.45)) * rel(b, 0.12)); zoom *= 1 + 0.08 * E.ioS(seg(age, 0.25, 1.45)) * rel(b, 0.15); }
        if (k === 'B') zoom *= 1 + 0.035 * E.outB(seg(age, 0, 0.12)) * rel(b, 0.1);
        if (k === 'END') { desat = Math.max(desat, 0.9 * E.ioS(seg(age, 0.15, 1.2))); zoom *= 1 + 0.12 * E.ioS(seg(age, 0.2, 2.5)); }
      }
      // release flash too, softer
      flash = Math.max(flash, 0.35 * (1 - seg(t, 3.0, 3.15)) * (t >= 3.0 ? 1 : 0));
      // the picture, pushed in around the held pose
      c.save();
      if (zoom !== 1) { c.translate(sq.x, sq.y); c.scale(zoom, zoom); c.translate(-sq.x, -sq.y); }
      fPicture(c, s, W, H);
      c.restore();
      if (desat > 0.005) {
        c.save(); c.globalCompositeOperation = 'saturation'; c.globalAlpha = desat; c.fillStyle = '#808080'; c.fillRect(0, 0, W, H); c.restore();
        if (hd && hd.k === 'END') { const v = c.createRadialGradient(960, 520, 300, 960, 520, 1100); v.addColorStop(0, 'rgba(23,24,28,0)'); v.addColorStop(1, `rgba(23,24,28,${0.28 * desat})`); c.fillStyle = v; c.fillRect(0, 0, W, H); }
      }
      if (flash > 0.005) { c.fillStyle = `rgba(255,255,255,${flash})`; c.fillRect(0, 0, W, H); }
      // hold frame border
      if (hd) { const b = seg(hd.age, 0, 0.1); c.strokeStyle = `rgba(255,90,31,${0.9 * b})`; c.lineWidth = 6; c.strokeRect(18, 18, W - 36, H - 36); }
      // the Token's on-screen position after the push-in
      const ox = sq.x, oy = sq.y;
      // callout during hold A and the end
      const call = hd && hd.k !== 'B' ? E.outC(seg(hd.age, hd.k === 'A' ? 0.55 : 0.9, (hd.k === 'A' ? 0.55 : 0.9) + 0.35)) : 0;
      if (call > 0.01) {
        const r = FZ.S * zoom * 0.78, dv = hd.k === 'A' ? -1 : 1, x1 = ox + r * 0.75, y1 = oy + dv * r * 0.75, x2 = x1 + 90 * call, y2 = y1 + dv * 90 * call, x3 = x2 + 260 * call;
        c.strokeStyle = P.accent; c.lineWidth = 3;
        c.beginPath(); c.arc(ox, oy, r, -PI / 2, -PI / 2 + TAU * call); c.stroke();
        c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y2); c.stroke();
        c.save(); c.globalAlpha = seg(call, 0.6, 1);
        label(c, hd.k === 'A' ? `PEAK OF HOP ${sq.k + 1}` : 'LAST FRAME', x2 + 4, y2 - 14, { size: 20, color: P.ink, weight: 700, ls: 2 });
        label(c, `HEIGHT ${Math.round(sq.h)} px  ·  ROT ${Math.round(sq.rot * 180 / PI) % 360}°`, x2 + 4, y2 + 26, { size: 15, ls: 2, color: P.ink });
        label(c, `SOURCE FRAME ${pad(Math.floor(s * 24 + 1e-6), 3)}`, x2 + 4, y2 + 50, { size: 15, ls: 2, color: P.accentD, weight: 700 });
        c.restore();
      }
      // filmstrip: the last ten output frames (12 per second)
      const n = 10, cw = 96, chh = 54, gap = 10, sx0 = 1848 - n * cw - (n - 1) * gap, sy = 48;
      const frs = [];
      for (let i = 0; i < n; i++) { const to = t - (n - 1 - i) / 12; frs.push(to < 0 ? null : fSrc(to)); }
      for (let i = 0; i < n; i++) {
        const x = sx0 + i * (cw + gap), sv = frs[i];
        c.fillStyle = 'rgba(23,24,28,0.85)'; c.fillRect(x - 3, sy - 3, cw + 6, chh + 6);
        if (sv === null) continue;
        c.save(); c.beginPath(); c.rect(x, sy, cw, chh); c.clip();
        c.fillStyle = P.ground; c.fillRect(x, sy, cw, chh);
        const k = cw / 1920, q = fPose(sv);
        c.fillStyle = P.ground2; c.fillRect(x, sy + FL * k, cw, chh);
        TK.token(c, x + q.x * k, sy + q.y * k, FZ.S * k, { rot: q.rot, sx: q.sx, sy: q.sy });
        c.restore();
        const fn = Math.floor(sv * 24 + 1e-6), rep = (i > 0 && frs[i - 1] !== null && Math.floor(frs[i - 1] * 24 + 1e-6) === fn) || (i < n - 1 && frs[i + 1] !== null && Math.floor(frs[i + 1] * 24 + 1e-6) === fn);
        label(c, pad(fn, 3), x + cw / 2, sy + chh + 26, { size: 14, ls: 1, align: 'center', color: rep ? P.accentD : P.ink, weight: rep ? 700 : 400 });
      }
      // HOLD bracket over repeating cells
      let r0 = -1;
      for (let i = 0; i <= n; i++) {
        const same = i < n && i > 0 && frs[i] !== null && frs[i - 1] !== null && Math.floor(frs[i] * 24 + 1e-6) === Math.floor(frs[i - 1] * 24 + 1e-6);
        if (same && r0 < 0) r0 = i - 1;
        if (!same && r0 >= 0) {
          const xa = sx0 + r0 * (cw + gap), xb = sx0 + (i - 1) * (cw + gap) + cw, yb = sy + chh + 40;
          c.strokeStyle = P.accent; c.lineWidth = 2; c.beginPath(); c.moveTo(xa, yb - 6); c.lineTo(xa, yb); c.lineTo(xb, yb); c.lineTo(xb, yb - 6); c.stroke();
          label(c, 'HOLD', (xa + xb) / 2, yb + 22, { size: 13, ls: 3, align: 'center', color: P.accentD, weight: 700 });
          r0 = -1;
        }
      }
      label(c, 'OUTPUT FRAMES  ·  SOURCE FRAME No.', sx0, sy - 14, { size: 13, ls: 2 });
      label(c, 'NOW', 1848 - cw / 2, sy - 14, { size: 13, ls: 2, align: 'center', color: P.ink, weight: 700 });
      // timecode runs, frame counter holds
      const hx = 1848, hy = 236;
      label(c, 'TIMECODE', hx - 300, hy, { size: 14, ls: 3, align: 'right' });
      label(c, tc(t), hx, hy, { size: 26, ls: 2, align: 'right', color: P.ink, weight: 700 });
      label(c, 'SOURCE FRAME', hx - 300, hy + 40, { size: 14, ls: 3, align: 'right' });
      label(c, pad(Math.floor(s * 24 + 1e-6), 3), hx - 150, hy + 40, { size: 26, ls: 2, align: 'right', color: hd ? P.accent : P.ink, weight: 700 });
      if (hd && Math.floor(t * 4) % 2 === 0) { c.fillStyle = P.accent; c.fillRect(hx - 126, hy + 18, 7, 24); c.fillRect(hx - 114, hy + 18, 7, 24); label(c, 'HOLD', hx, hy + 40, { size: 18, ls: 3, align: 'right', color: P.accent, weight: 700 }); }
      // phase tag
      const FPH = [[0, 'MOTION', 'PICTURE = SOURCE TIME  ·  OVERLAYS = OUTPUT TIME'], [1.5, 'FREEZE FRAME', 'ONE SOURCE FRAME REPEATS  ·  THE CLOCK RUNS ON'], [3.0, 'RELEASE', `MOTION RESUMES FROM FRAME ${pad(36, 3)}`], [5.0, 'SHORT HOLD  ·  12 FRAMES', 'A PUNCH ON THE BEAT'], [5.5, 'MOTION', 'SOURCE TIME RUNS AGAIN'], [7.5, 'FINAL FREEZE', 'END ON A HELD FRAME']];
      const pi = phaseOf(FPH, t), ph = FPH[pi], on = seg(t, ph[0], ph[0] + 0.2) * seg(t, 0.05, 0.3);
      tag(c, ph[1], 72, 80, on);
      c.save(); c.globalAlpha = on; label(c, ph[2], 98, 112, { size: 15, ls: 2 }); c.restore();
      // treatment checklist during the first hold
      const ck = [['FLASH', 0], ['DESATURATE', 0.12], ['PUSH-IN', 0.25], ['CALLOUT', 0.55], ['TIMECODE RUNS, FRAME HOLDS', 0.85]];
      const ckOn = seg(t, 1.5, 1.6) * (1 - seg(t, 3.3, 3.6));
      if (ckOn > 0.01) {
        c.save(); c.globalAlpha = ckOn;
        label(c, 'ON THE HOLD', 98, 172, { size: 14, ls: 3, color: P.ink, weight: 700 });
        ck.forEach(([nm, a], i) => {
          const y = 208 + i * 34, d = seg(t, 1.5 + a, 1.5 + a + 0.12);
          c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(98.5, y - 15.5, 18, 18);
          if (d > 0) { c.fillStyle = P.accent; c.fillRect(102, y - 12, 11 * d + 0.01, 11); }
          label(c, nm, 130, y, { size: 15, ls: 2, color: d > 0 ? P.ink : P.mute, weight: d > 0 ? 700 : 400 });
        });
        c.restore();
      }
      // final title
      const ta = E.outC(seg(t, 8.4, 9.0));
      if (ta > 0) TK.word(c, 700, 690 - 20 * (1 - ta), { size: 150, alpha: ta, color: P.ink, ls: 8 });
      TK.caption(c, t, W, H, { name: 'Freeze Frame', cat: 'Temporal', curve: u => fSrc(u * 10) / fSrc(10), span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'SOURCE TIME / OUTPUT TIME' });
    },
    score(A) {
      TK.bed(A);
      // the source's own sounds — takeoff and landing — only where source time runs
      for (let k = 0; k <= 5; k++) {
        const to = k + 0.1, la = k + 0.9;
        if (to < 5.5) A.whoosh(fOut(to), 0.35, { f1: 300, f2: 1800, g: 0.06, swell: 0.3, pan: -0.5 + k * 0.2 });
        if (la < 5.5) { const t = fOut(la); A.osc(t, { type: 'triangle', f: midi(48), f2: midi(36), glide: 0.08, dur: 0.2, g: 0.16 }); A.noise(t, { type: 'lowpass', f: 600, dur: 0.12, g: 0.08 }); A.pluck(t, midi([64, 67, 71, 72, 76][k % 5]), { g: 0.12, bright: 0.5, dur: 0.8 }); }
      }
      // freezes: a shutter clack + flash hit, then a held tone for the length of the hold
      FHOLD.forEach(([a, b, k]) => {
        const e = Math.min(b, 10);
        A.noise(a, { type: 'highpass', f: 3000, dur: 0.03, g: 0.16 });
        A.osc(a, { type: 'square', f: 1800, f2: 1200, dur: 0.05, g: 0.05, lp: 5000 });
        A.noise(a + 0.01, { type: 'bandpass', f: 5000, f2: 1500, q: 0.8, dur: 0.35, g: 0.07, rev: 0.4 });
        const notes = k === 'B' ? [79, 86] : k === 'A' ? [67, 71, 74, 79] : [60, 67, 72, 76];
        A.chord(a, notes, { type: 'sine', dur: e - a, g: k === 'END' ? 0.03 : 0.022, a: 0.02, hold: true, rel: 0.08, rev: 0.6, width: 0.7 });
        if (k !== 'END') A.noise(b - 0.3, { type: 'bandpass', f: 500, f2: 2800, q: 1.2, dur: 0.32, g: 0.08, swell: 0.95 });
      });
      A.impact(7.5, 0.25);
      A.bell(8.4, midi(84), { g: 0.05, dur: 1.6, rev: 0.6 });
    },
  });
})();
