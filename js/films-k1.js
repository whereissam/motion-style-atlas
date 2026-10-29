/* batch k1 — Technique Atlas · Transitions: techmorph · techwipe · techsmear.
   techmorph (point-wise shape interpolation: the Token's outline resampled to 240 points and
   matched by arc length to a circle, a bar and the letter M, then back) ·
   techwipe (hard-edged mattes — linear, clock, iris and a Token-shaped wipe — each revealing the
   Token in a new state) ·
   techsmear (smear drawings: stretch, multiples and dry-brush streaks for two drawings of a fast
   move, then a frame-by-frame replay of every smear drawing). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, midi, text } = MG;
  const TK = MG.TK, P = TK.P, PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
  const label = (c, s, x, y, o = {}) => text(c, s, x, y, { font: TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
  const tag = (c, s, x, y, on = 1) => {   // small accent dot + mono label, top-left of frame
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: P.ink, weight: 700, size: 20 });
    c.restore();
  };

  /* =====================================================================
     MORPH — the Token's outline is resampled to 240 points by arc length,
     starting at the top centre and running clockwise; every other shape is
     sampled the same way, so point i always finds point i. The hole is a
     circle whose centre and radius interpolate too (cut out with an
     even-odd clip, so it can shrink to nothing anywhere). Token → circle →
     bar → letter M → Token, with the correspondence shown as dots and
     travel lines, and the shape sequence along the top.
     ===================================================================== */
  const MN = 240, MS = 340, MC = [960, 500];
  function rrPoly(w, h, r, n = 24) {
    const x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2, pts = [[0, y0]];
    [[x1 - r, y0 + r, -PI / 2], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, PI / 2], [x0 + r, y0 + r, PI]].forEach(([cx, cy, a0]) => {
      for (let i = 0; i <= n; i++) { const a = a0 + i / n * PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    });
    pts.push([0, y0]);
    return pts;
  }
  function resample(poly, n) {
    const L = [0];
    for (let i = 1; i < poly.length; i++) L.push(L[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
    const tot = L[L.length - 1], out = [];
    let j = 1;
    for (let k = 0; k < n; k++) {
      const d = k / n * tot;
      while (j < L.length - 1 && L[j] < d) j++;
      const u = (d - L[j - 1]) / ((L[j] - L[j - 1]) || 1);
      out.push([lerp(poly[j - 1][0], poly[j][0], u), lerp(poly[j - 1][1], poly[j][1], u)]);
    }
    return out;
  }
  function mmShapes() {
    const circ = []; for (let i = 0; i <= 360; i++) { const a = -PI / 2 + i / 360 * TAU; circ.push([Math.cos(a) * 0.565, Math.sin(a) * 0.565]); }
    const M = [[0, 0.02], [0.32, -0.5], [0.6, -0.5], [0.6, 0.5], [0.36, 0.5], [0.36, -0.1], [0.09, 0.34], [-0.09, 0.34], [-0.36, -0.1], [-0.36, 0.5], [-0.6, 0.5], [-0.6, -0.5], [-0.32, -0.5], [0, 0.02]].map(([x, y]) => [x * 1.1, y * 1.1]);
    const tok = { pts: resample(rrPoly(1, 1, TK.CORNER), MN), hole: [TK.HOLE.x, TK.HOLE.y, TK.HOLE.r], name: 'TOKEN' };
    return [
      tok,
      { pts: resample(circ, MN), hole: [0, 0, 0.2], name: 'CIRCLE' },
      { pts: resample(rrPoly(2.2, 0.46, 0.23), MN), hole: [0.82, 0, 0.11], name: 'BAR' },
      { pts: resample(M, MN), hole: [0.53, 0.25, 0], name: 'LETTER M' },
      { ...tok },
    ];
  }
  // [start, end, from, to, ease]
  const MM = [[1.0, 2.0, 0, 1, E.ioC], [2.5, 3.5, 1, 2, E.ioC], [4.0, 5.0, 2, 3, E.ioC], [6.0, 7.25, 3, 4, E.outB]];
  function mmAt(t) {
    let cur = MM[0], i = 0;
    for (let k = 0; k < MM.length; k++) if (t >= MM[k][0] - 0.5) { cur = MM[k]; i = k; }
    const raw = seg(t, cur[0], cur[1]);
    return { a: cur[2], b: cur[3], raw, u: t < cur[0] ? 0 : cur[4](raw), m: cur, i, moving: t > cur[0] && t < cur[1] };
  }
  function mmPath(c, pts, cx, cy, s) {
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(cx + p[0] * s, cy + p[1] * s) : c.moveTo(cx + p[0] * s, cy + p[1] * s)));
    c.closePath();
  }
  function mmFill(c, pts, hole, cx, cy, s, col) {
    c.save();
    if (hole[2] > 0.002) {
      c.beginPath(); c.rect(-10, -10, 1940, 1100);
      c.moveTo(cx + (hole[0] + hole[2]) * s, cy + hole[1] * s); c.arc(cx + hole[0] * s, cy + hole[1] * s, hole[2] * s, 0, TAU, true);
      c.clip('evenodd');
    }
    mmPath(c, pts, cx, cy, s); c.fillStyle = col; c.fill();
    c.restore();
  }

  MG.film({
    id: 'techmorph', dur: 10, poster: 4.55,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Morph', sub: 'Point-wise shape interpolation', era: '1974 —',
      origin: 'Computer shape interpolation grew out of the key-frame animation system Nestor Burtnyk and Marceli Wein built at Canada’s National Research Council, which Peter Foldès used to let drawings melt into one another in Hunger (La Faim, 1974). Vector shape tweening became an everyday motion-graphics tool with Flash shape tweens and After Effects path animation; image morphing, which also warps pixels, followed in film effects from the late 1980s.',
      works: 'Hunger / La Faim (Peter Foldès, National Film Board of Canada, 1974) · Willow (Ron Howard, 1988; ILM morph sequence) · Black or White, Michael Jackson (music video, 1991; PDI face morphs)',
      tech: ['Arc-length resampling', 'Matched point order', 'Interpolated hole'],
      accent: '#ff5a1f',
      motionDNA: 'Every point of one outline travels in a straight line to its partner on the next, all on the same eased clock, so the silhouette flows rather than cuts. Four morphs on the bar: Token to circle, circle to bar, bar to the letter M, then back to the Token on an overshooting ease that lets the points spring past their targets and settle.',
      visualDNA: 'The Technique Atlas stage: warm paper, a faint grid, the orange Token. Ink dots mark every eighth sample point, point 0 ringed; dashed ghosts of source and target outlines with thin travel lines between partner points; a strip of the five shapes along the top.',
      transitions: 'Point-wise morph between closed outlines; the hole drifts, shrinks to a point and grows back',
      implementation: ['After Effects path keyframes / shape layers', 'Flash shape tweens', 'Canvas 2D: arc-length resampling and per-point lerp'],
      reproducibility: 'Fully procedural',
      loopable: true,
    },
    setup() { return { sh: mmShapes() }; },
    draw(c, t, W, H, st) {
      const sh = st.sh, [cx, cy] = MC, m = mmAt(t), A = sh[m.a], B = sh[m.b], u = m.u;
      TK.stage(c, W, H);
      // shape strip along the top
      const prog = m.a + u * (m.b - m.a);
      for (let i = 0; i < 5; i++) {
        const x = 960 + (i - 2) * 190, y = 120, on = clamp(1 - Math.abs(prog - i));
        if (i < 4) label(c, '→', x + 95, y + 6, { align: 'center', size: 20 });
        if (on > 0.02) { c.save(); c.globalAlpha = on; mmFill(c, sh[i].pts, sh[i].hole, x, y, 52, P.accent); c.restore(); }
        mmPath(c, sh[i].pts, x, y, 52); c.strokeStyle = on > 0.5 ? P.ink : 'rgba(23,24,28,0.35)'; c.lineWidth = 1.5; c.stroke();
        label(c, sh[i].name, x, y + 64, { align: 'center', size: 13, ls: 2, color: on > 0.5 ? P.ink : P.mute });
      }
      const pts = A.pts.map((p, i) => [lerp(p[0], B.pts[i][0], u), lerp(p[1], B.pts[i][1], u)]);
      const hole = A.hole.map((v, i) => lerp(v, B.hole[i], u));
      hole[2] = Math.max(0, hole[2]);
      // ghosts + travel lines while morphing
      const gh = Math.sin(PI * clamp(seg(t, m.m[0] - 0.25, m.m[1] + 0.25)));
      if (m.a !== m.b && gh > 0.01) {
        c.save(); c.globalAlpha = gh;
        c.setLineDash([6, 8]); c.lineWidth = 2; c.strokeStyle = 'rgba(23,24,28,0.3)';
        mmPath(c, A.pts, cx, cy, MS); c.stroke();
        c.strokeStyle = 'rgba(198,62,12,0.55)'; mmPath(c, B.pts, cx, cy, MS); c.stroke();
        c.setLineDash([]);
        c.strokeStyle = 'rgba(23,24,28,0.16)'; c.lineWidth = 1; c.beginPath();
        for (let i = 0; i < MN; i += 8) { c.moveTo(cx + A.pts[i][0] * MS, cy + A.pts[i][1] * MS); c.lineTo(cx + B.pts[i][0] * MS, cy + B.pts[i][1] * MS); }
        c.stroke();
        c.restore();
      }
      mmFill(c, pts, hole, cx, cy, MS, P.accent);
      // correspondence dots
      const dv = seg(t, 0.4, 0.9) * (1 - seg(t, 7.6, 8.2));
      if (dv > 0.01) {
        c.save(); c.globalAlpha = dv;
        for (let i = 8; i < MN; i += 8) {
          const x = cx + pts[i][0] * MS, y = cy + pts[i][1] * MS;
          c.fillStyle = P.ground; c.beginPath(); c.arc(x, y, 5.5, 0, TAU); c.fill();
          c.fillStyle = P.ink; c.beginPath(); c.arc(x, y, 3.5, 0, TAU); c.fill();
        }
        const x0 = cx + pts[0][0] * MS, y0 = cy + pts[0][1] * MS;
        c.fillStyle = P.ink; c.beginPath(); c.arc(x0, y0, 10, 0, TAU); c.fill();
        c.fillStyle = P.ground; c.beginPath(); c.arc(x0, y0, 5, 0, TAU); c.fill();
        label(c, 'P0', x0, y0 - 22, { align: 'center', size: 16, color: P.ink, weight: 700 });
        const xq = cx + pts[60][0] * MS, yq = cy + pts[60][1] * MS;
        c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.arc(xq, yq, 9, 0, TAU); c.stroke();
        label(c, 'P60', xq + 18, yq + 6, { size: 16, color: P.ink, weight: 700 });
        c.restore();
        label(c, m.a === m.b ? `${A.name}  ·  ${MN} POINTS` : `${A.name}  →  ${B.name}`, 960, 226, { align: 'center', size: 20, color: P.ink, weight: 700 });
        label(c, 'RESAMPLED BY ARC LENGTH  ·  POINT i → POINT i', 960, 252, { align: 'center', size: 14, ls: 2 });
      }
      TK.word(c, 960, 800, { size: 110, alpha: E.outC(seg(t, 7.9, 8.5)), ls: 6 });
      TK.caption(c, t, W, H, { name: 'Morph', cat: 'Transitions', curve: m.m[4], span: [m.m[0], m.m[1]], curveLabel: 'INTERPOLATION u / TIME' });
    },
    score(A) {
      TK.bed(A);
      MM.forEach(([t0, t1, a, b], i) => {
        const d = t1 - t0;
        A.whoosh(t0 - 0.05, d + 0.1, { f1: 260 + i * 60, f2: 2400 + i * 400, q: 2.2, g: 0.13, swell: 0.55, rev: 0.35, pan: (i % 2 ? 0.3 : -0.3) });
        A.osc(t0, { type: 'triangle', f: midi(60 + [0, 4, 7, 12][a]), f2: midi(60 + [0, 4, 7, 12, 12][b] + (b === 4 ? 12 : 0)), glide: d, dur: d + 0.1, g: 0.05, a: 0.1, lp: 2400, rev: 0.4 });
        A.bell(t1, midi([76, 79, 84, 88][i]), { g: 0.07, dur: 1.4, rev: 0.5 });
        A.pluck(t1, midi([64, 67, 72, 76][i]), { g: 0.16, bright: 0.6, dur: 1.2, rev: 0.3 });
      });
      for (let k = 0; k < 6; k++) A.osc(0.45 + k * 0.08, { f: 2200 + k * 180, dur: 0.04, g: 0.03, pan: (k - 2.5) * 0.2 });
      A.kick(8, 0.4, { f: 110, f2: 40 });
      A.chord(8, [60, 64, 67, 72], { type: 'triangle', dur: 2, g: 0.04, a: 0.05, lp: 2400, rev: 0.6, width: 0.8 });
    },
  });

  /* =====================================================================
     WIPE — four hard-edged travelling mattes. Each holds the next state of
     the scene (the Token a quarter-turn further on, in a new colourway),
     clips it, and lays it over the last: a tilted linear wipe, a clock
     wipe sweeping from twelve, an iris opening from the centre, and a
     shaped wipe that grows the Token's own silhouette (hole and all) until
     it swallows the frame. An accent line marks each matte's edge.
     ===================================================================== */
  const WC = [960, 450], WSZ = 300;
  const WST = [
    { rot: 0, col: P.accent, name: 'STATE 0  ·  ORANGE  ·  0°' },
    { rot: PI / 2, col: P.ink, name: 'STATE 1  ·  INK  ·  90°', ox: 40, oy: 40 },
    { rot: PI, col: P.blue, name: 'STATE 2  ·  BLUE  ·  180°', word: true },
    { rot: PI * 1.5, col: P.ground, edge: 6, name: 'STATE 3  ·  OUTLINE  ·  270°', z: 2, floor: 760 },
    { rot: TAU, col: P.accent, name: 'STATE 4  ·  ORANGE  ·  360°', word: true, shadow: true },
  ];
  // [start, end, kind, ease, label]
  const WW = [[1.0, 2.0, 'linear', E.ioC, 'LINEAR WIPE'], [3.0, 4.0, 'clock', E.ioS, 'CLOCK WIPE'], [5.0, 6.0, 'iris', E.ioC, 'IRIS WIPE'], [7.0, 8.0, 'shape', E.inQ, 'SHAPED WIPE · TOKEN MATTE']];
  const W_TILT = Math.tan(14 * PI / 180);
  function wState(c, k) {
    const s = WST[k], W = 1920, H = 1080;
    TK.stage(c, W, H, { ox: s.ox, oy: s.oy, z: s.z, floor: s.floor });
    const y = s.word ? WC[1] - 40 : WC[1];
    if (s.shadow) TK.shadow(c, WC[0], y + WSZ / 2 + 40, WSZ, 40);
    TK.token(c, WC[0], y, WSZ, { rot: s.rot, color: s.col, edge: s.edge });
    if (s.word) TK.word(c, 960, 690, { size: 120, color: k === 2 ? P.blue : P.ink, ls: 6 });
    label(c, s.name, W - 72, 80, { align: 'right', size: 18, color: P.ink, weight: 700 });
  }
  function wMatte(c, kind, u) {
    const [cx, cy] = WC;
    c.beginPath();
    if (kind === 'linear') {
      const x = lerp(-320, 2240, u), dx = W_TILT * 560;
      c.moveTo(-400, -20); c.lineTo(x + dx, -20); c.lineTo(x - dx, 1100); c.lineTo(-400, 1100); c.closePath();
    } else if (kind === 'clock') {
      c.moveTo(cx, cy); c.arc(cx, cy, 2400, -PI / 2, -PI / 2 + u * TAU); c.closePath();
    } else if (kind === 'iris') {
      c.arc(cx, cy, Math.max(0.01, u * 1260), 0, TAU);
    } else {
      const s = 30 * Math.pow(14000 / 30, u);
      c.save(); c.translate(cx, cy); TK.tokenPath(c, s); c.restore();
    }
  }
  function wEdge(c, kind, u) {
    const [cx, cy] = WC;
    c.save(); c.strokeStyle = P.accent; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath();
    if (kind === 'linear') { const x = lerp(-320, 2240, u), dx = W_TILT * 560; c.moveTo(x + dx, -20); c.lineTo(x - dx, 1100); }
    else if (kind === 'clock') { const a = -PI / 2 + u * TAU; c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * 2400, cy + Math.sin(a) * 2400); c.moveTo(cx, cy); c.lineTo(cx, cy - 2400); }
    else if (kind === 'iris') c.arc(cx, cy, Math.max(0.01, u * 1260), 0, TAU);
    else { const s = 30 * Math.pow(14000 / 30, u); c.translate(cx, cy); TK.tokenPath(c, s); }
    c.stroke();
    if (kind === 'clock') { c.fillStyle = P.accent; c.beginPath(); c.arc(cx, cy, 10, 0, TAU); c.fill(); }
    c.restore();
  }
  function wAt(t) {
    let k = -1;
    for (let i = 0; i < WW.length; i++) if (t >= WW[i][0]) k = i;
    return k;
  }

  MG.film({
    id: 'techwipe', dur: 10, poster: 3.62,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Wipe', sub: 'A hard edge travels, a new picture follows', era: '1910s —',
      origin: 'A wipe replaces one image with another behind a moving edge. Early cinema already used iris and shaped mask transitions, and optical printers with travelling mattes made line, clock and pattern wipes routine by the 1930s. Akira Kurosawa cut Seven Samurai (1954) with crisp wipes, and George Lucas borrowed them, clock wipes included, for Star Wars (1977); video switchers later put a menu of wipe patterns on a single lever.',
      works: 'Seven Samurai (Akira Kurosawa, 1954) · Star Wars (George Lucas, 1977) · Looney Tunes iris-out endings (Warner Bros.)',
      tech: ['Moving matte as clip path', 'Hard edge, no blend', 'Shape wipe from the subject'],
      accent: '#ff5a1f',
      motionDNA: 'Nothing in either picture moves; only the boundary does. Each wipe runs exactly one bar of half-beats on its own ease — a tilted line crosses left to right, a hand sweeps a full clock turn from twelve, an iris opens from the Token’s centre, and the Token’s own silhouette grows exponentially until it fills the frame — with a held beat of the new state between.',
      visualDNA: 'The Technique Atlas stage repeated in five states: the Token turned a quarter further each time and recoloured orange, ink, blue, outline, orange again; the grid shifts and zooms between states; an orange accent line rides each matte edge; a mono state label in the top-right corner gets wiped with its picture.',
      transitions: 'Linear wipe, clock wipe, iris wipe, shaped (Token-silhouette) wipe',
      implementation: ['Optical printer with travelling mattes', 'Video switcher wipe patterns / After Effects track mattes', 'Canvas 2D: clip path per matte over the previous state'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const k = wAt(t);
      wState(c, Math.max(0, k));
      if (k >= 0) {
        const [t0, t1, kind, ease] = WW[k], raw = seg(t, t0, t1), u = ease(raw);
        if (raw < 1) {
          c.save(); wMatte(c, kind, u); c.clip(kind === 'shape' ? 'evenodd' : 'nonzero'); wState(c, k + 1); c.restore();
          if (raw > 0) wEdge(c, kind, u);
        } else wState(c, k + 1);
      }
      // the upcoming / current wipe, named top-left
      let nx = 0; for (let i = 0; i < WW.length; i++) if (t >= WW[i][0] - 0.75) nx = i;
      const done = t > WW[3][1] + 0.3;
      if (!done) {
        tag(c, `WIPE ${nx + 1} / 4  ·  ${WW[nx][4]}`, 72, 80, seg(t, 0.2, 0.6));
        // matte progress bar
        const [t0, t1] = WW[nx], p = seg(t, t0, t1);
        c.fillStyle = 'rgba(23,24,28,0.12)'; c.fillRect(98, 102, 300, 3);
        c.fillStyle = P.accent; c.fillRect(98, 102, 300 * WW[nx][3](p), 3);
      } else tag(c, 'FOUR WIPES  ·  ONE TOKEN', 72, 80, seg(t, 8.3, 8.7));
      TK.caption(c, t, W, H, { name: 'Wipe', cat: 'Transitions', curve: WW[nx][3], span: [WW[nx][0], WW[nx][1]], curveLabel: 'MATTE POSITION / TIME' });
    },
    score(A) {
      TK.bed(A);
      // linear: a pass from left to right
      A.whoosh(0.95, 1.1, { f1: 300, f2: 4200, g: 0.16, swell: 0.55, pan: -0.5 });
      A.whoosh(1.35, 0.7, { f1: 600, f2: 3000, g: 0.1, swell: 0.4, pan: 0.5 });
      // clock: a ratchet tick per hour
      for (let i = 0; i < 12; i++) { A.osc(3 + i / 12, { f: i % 3 ? 2600 : 3400, dur: 0.035, g: i % 3 ? 0.045 : 0.07, pan: Math.sin(i / 12 * TAU) * 0.6 }); }
      A.whoosh(3.0, 1.0, { f1: 500, f2: 2600, q: 3, g: 0.08, swell: 0.5 });
      // iris: an opening tone
      A.osc(5.0, { f: 220, f2: 880, glide: 1.0, dur: 1.05, g: 0.05, a: 0.2, lp: 2000, rev: 0.4 });
      A.whoosh(5.0, 1.0, { f1: 200, f2: 1800, q: 1.2, g: 0.12, swell: 0.7 });
      // shape: a riser into the hit
      A.riser(7.0, 1.0, { g: 0.12, f: 110 });
      A.impact(8.0, 0.42);
      A.chord(8.0, [48, 55, 60, 64, 67], { type: 'triangle', dur: 2, g: 0.04, a: 0.02, lp: 2600, rev: 0.6, width: 0.8 });
      // each wipe lands with a clack
      WW.forEach(([, t1], i) => { if (i < 3) { A.snare(t1, 0.12, { f: 2400, dur: 0.08, rev: 0.3 }); A.pluck(t1, midi([67, 71, 74][i]), { g: 0.14, bright: 0.6, dur: 1 }); } });
    },
  });

  /* =====================================================================
     SMEAR — the Token slides along the floor in three fast moves, each
     drawn on twos (15 drawings a second). A move is four drawings: two
     smears bridging the gap, a squashed landing and the clean pose. The
     smears are a stretch (one elongated, tapering body), multiples
     (overlapping copies along the path) and dry brush (streaks breaking up
     behind the lead). Then a slow replay steps through every smear drawing,
     one per beat, over onion-skin ghosts of the poses either side, before
     time resumes and MOTION smears into place.
     ===================================================================== */
  const SS = 240, SF = TK.FLOOR, SY = SF - SS / 2, SFPS = 15;
  const SM = [
    { t0: 1.0, a: 470, b: 1450, type: 'stretch', name: 'STRETCH' },
    { t0: 2.0, a: 1450, b: 470, type: 'multi', name: 'MULTIPLES' },
    { t0: 3.0, a: 470, b: 960, type: 'brush', name: 'DRY BRUSH' },
  ];
  const S_LEAD = [0, 0.5, 0.95, 1.04, 1], S_TAIL = [0, 0, 0.42, 1.04, 1];
  const S_REPLAY = [3.5, 8.0];
  // drawing k of move m: 0 clean at A, 1–2 smears, 3 landing squash, 4 clean at B
  function sPose(m, k) {
    const d = m.b - m.a, dir = Math.sign(d);
    return { xL: m.a + d * S_LEAD[k], xT: m.a + d * S_TAIL[k], dir, k };
  }
  function sLive(t) {
    let m = null;
    for (const mv of SM) if (t >= mv.t0) m = mv;
    if (!m) return { m: SM[0], k: 0 };
    return { m, k: Math.min(4, 1 + Math.floor((t - m.t0) * SFPS + 1e-6)) };
  }
  function sTokenAt(c, x, s, sx, sy, col, o = {}) {
    // Token resting on the floor, scaled about its base
    c.save(); c.translate(x, SF - s * sy / 2); c.scale(sx, sy);
    if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
    TK.tokenPath(c, s);
    if (o.ghost) { c.setLineDash([7, 7]); c.lineWidth = 2 / Math.min(sx, sy); c.strokeStyle = 'rgba(23,24,28,0.4)'; c.stroke(); }
    else { c.fillStyle = col; c.fill('evenodd'); if (o.sep) { c.lineWidth = o.sep / Math.min(sx, sy); c.strokeStyle = P.ground; c.stroke(); } }
    c.restore();
  }
  function sDraw(c, m, k, o = {}) {
    const p = sPose(m, k), dir = p.dir, s = SS, ghost = o.ghost;
    const span = Math.abs(p.xL - p.xT);
    if (!ghost) {
      // floor shadow, stretched under smears
      const cx = (p.xL + p.xT) / 2;
      c.fillStyle = P.shadow; c.beginPath(); c.ellipse(cx, SF + 4, (span + s) * 0.55, s * 0.07 + 3, 0, 0, TAU); c.fill();
    }
    if (k === 0 || k === 4) { sTokenAt(c, p.xL, s, 1, 1, P.accent, { ghost }); return; }
    if (k === 3) { sTokenAt(c, p.xL, s, 0.84, 1.16, P.accent, { ghost }); return; }
    if (m.type === 'stretch') {
      // body: the Token stretched over the front 40% of the gap; tail: a tapering wedge back to the trailing edge
      const bodyBack = p.xL - dir * (s / 2 + span * 0.4), bodyFront = p.xL + dir * s / 2;
      const bw = Math.abs(bodyFront - bodyBack), sx = bw / s, sy = clamp(1 / Math.sqrt(sx), 0.62, 1), h = s * sy;
      const tail = p.xT - dir * s * 0.5;
      if (!ghost) {
        c.fillStyle = P.accent; c.beginPath();
        const j = bodyBack + dir * h * 0.6;
        c.moveTo(j, SF - h * 0.97);
        c.lineTo(bodyBack + dir * h * 0.1, SF - h * 0.97);
        c.bezierCurveTo(lerp(bodyBack, tail, 0.45), SF - h * 0.75, lerp(bodyBack, tail, 0.8), SF - h * 0.18, tail, SF - h * 0.06);
        c.lineTo(tail, SF);
        c.lineTo(j, SF); c.closePath(); c.fill();
        // speed lines
        c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath();
        [0.3, 0.55, 0.78].forEach((f, i) => { const x0 = lerp(bodyBack, tail, 0.25 + i * 0.12) - dir * 30, x1 = tail - dir * (60 + i * 40); c.moveTo(x0, SF - h * f - 14 - i * 6); c.lineTo(x1, SF - h * f - 14 - i * 6); });
        c.stroke(); c.lineCap = 'butt';
      }
      sTokenAt(c, (bodyBack + bodyFront) / 2, s, sx, sy, P.accent, { ghost });
    } else if (m.type === 'multi') {
      const n = 4;
      for (let i = 0; i < n; i++) {
        const f = i / (n - 1), x = lerp(p.xT, p.xL, f);
        sTokenAt(c, x, s, 1, 1, mixc(P.accentL, P.accent, f), { ghost: ghost && i === n - 1, sep: ghost ? 0 : 5, alpha: ghost && i < n - 1 ? 0 : 1 });
      }
    } else {
      // dry brush: the lead mostly intact, the back breaking into streaks
      const back = p.xL - dir * s * 0.5, tail = p.xT - dir * s * 0.5;
      if (!ghost) {
        c.fillStyle = P.accent;
        for (let i = 0; i < 11; i++) {
          const y0 = SF - s * 0.95 + i * s * 0.086, th = s * (0.035 + 0.035 * hash(i * 3.1 + k));
          const len = Math.abs(tail - back) * (0.35 + 0.65 * hash(i * 7.7 + k * 1.3)) + s * 0.25;
          const x0 = back + dir * s * (0.1 + 0.2 * hash(i + 2.2)), x1 = x0 - dir * len;
          c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 + dir * th, y0 + th * 0.3); c.lineTo(x1, y0 + th * 0.5); c.lineTo(x1 + dir * th, y0 + th * 0.7); c.lineTo(x0, y0 + th); c.closePath(); c.fill();
        }
      }
      sTokenAt(c, p.xL - dir * s * 0.06, s, 1.12, 0.95, P.accent, { ghost });
    }
  }
  const sCurve = u => S_LEAD[Math.min(4, Math.floor(u * 5))];

  MG.film({
    id: 'techsmear', dur: 10, poster: 5.25,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Smear', sub: 'Two drawings that fill the gap', era: '1930s —',
      origin: 'Hand-drawn animation samples motion at 12 or 24 drawings a second, so a fast move can jump too far between frames and strobe. Animators bridge the gap with one or two smear drawings — the character stretched, multiplied or streaked along its path — that the eye reads as speed; Chuck Jones’s The Dover Boys (1942) made them famous, and Spider-Man: Into the Spider-Verse (2018) brought drawn smears and multiples into CG.',
      works: 'The Dover Boys at Pimento University (Chuck Jones, Warner Bros., 1942) · Looney Tunes and Merrie Melodies shorts (Warner Bros., 1940s–50s) · Spider-Man: Into the Spider-Verse (Sony Pictures Animation, 2018)',
      tech: ['Smears on twos', 'Stretch · multiples · dry brush', 'Frame-by-frame replay'],
      accent: '#ff5a1f',
      motionDNA: 'Long clean holds broken by moves that take four drawings on twos: two smears that span the gap, a squashed landing, the clean pose. Three moves on the downbeats, each with a different smear; then a replay at one drawing per beat (1/7.5 speed) steps through all nine smear and landing drawings over onion-skin ghosts, and time snaps back for the word to smear in.',
      visualDNA: 'The Technique Atlas stage with its floor line; the orange Token sliding along it, a stretched contact shadow under each smear; a tapering orange wedge with ink speed lines, overlapping copies fading from light to full orange, and dry-brush streaks; dashed ghost outlines, a dotted path and a drawing strip with frame numbers during the replay.',
      transitions: 'Smear drawings across fast moves; a rewind cut into a stepped replay and back',
      implementation: ['Hand-drawn smear frames (2D animation)', 'Blender / Maya smear rigs and Grease Pencil', 'Canvas 2D: motion quantised to 15 drawings per second'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H, { floor: SF });
      const replay = t >= S_REPLAY[0] && t < S_REPLAY[1];
      let curve = sCurve, span = [0.93, 1.27];
      if (!replay) {
        let { m, k } = sLive(t);
        if (t >= S_REPLAY[1]) { m = SM[2]; k = 4; }
        sDraw(c, m, k);
        span = [m.t0 - 1 / SFPS, m.t0 + 4 / SFPS];
        if (t < S_REPLAY[0]) {
          tag(c, 'LIVE  ·  15 DRAWINGS / S', 72, 80, seg(t, 0.1, 0.5));
          const on = t >= m.t0 && t < m.t0 + 0.9 ? 1 : 0;
          if (on) label(c, `${m.name} SMEAR`, 98, 116, { color: P.accentD, weight: 700, size: 18 });
          // rewind cue
          const rw = seg(t, 3.25, 3.5);
          if (rw > 0) label(c, '◀◀  REPLAY', W - 72, 80, { align: 'right', color: P.ink, weight: 700, size: 20 });
        } else {
          tag(c, 'LIVE', 72, 80, 1);
          // MOTION smears in from the right on twos
          const wk = t < 8.5 ? -1 : Math.min(4, Math.floor((t - 8.5) * SFPS + 1e-6) + 1);
          if (wk >= 1) {
            const wx = [0, 1500, 1060, 940, 960][wk], wsx = [1, 2.4, 1.5, 0.94, 1][wk];
            c.save(); c.translate(wx, 400); c.scale(wsx, 1 / Math.sqrt(wsx));
            if (wk <= 2) for (let i = 1; i <= 3; i++) TK.word(c, i * 90, 0, { size: 150, color: P.accentL, alpha: 0.35 / i, ls: 6 });
            TK.word(c, 0, 0, { size: 150, ls: 6 });
            c.restore();
          }
          span = [8.5 - 1 / SFPS, 8.5 + 4 / SFPS];
        }
      } else {
        // replay: drawings 1–3 of each move, one per beat
        const i = Math.floor((t - S_REPLAY[0]) / TK.BEAT), mi = Math.floor(i / 3), k = 1 + (i % 3), m = SM[mi];
        // dotted path
        c.save(); c.setLineDash([2, 10]); c.lineCap = 'round'; c.strokeStyle = 'rgba(23,24,28,0.45)'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(m.a, SF - SS - 40); c.lineTo(m.b, SF - SS - 40); c.stroke(); c.restore();
        [m.a, m.b].forEach((x, j) => { c.fillStyle = P.ink; c.fillRect(x - 1, SF - SS - 52, 2, 24); label(c, j ? 'B' : 'A', x, SF - SS - 64, { align: 'center', color: P.ink, weight: 700, size: 16 }); });
        sDraw(c, m, 0, { ghost: true });
        sDraw(c, m, 4, { ghost: true });
        if (k > 1) sDraw(c, m, k - 1, { ghost: true });
        sDraw(c, m, k);
        // lead / tail ticks for this drawing
        const p = sPose(m, k);
        c.fillStyle = P.accentD; [p.xL + p.dir * SS / 2, p.xT - p.dir * SS / 2].forEach(x => c.fillRect(x - 1, SF + 14, 2, 18));
        tag(c, `REPLAY  ·  ${m.name}  ·  1 DRAWING / BEAT`, 72, 80, 1);
        // drawing strip
        const sx0 = 98, cw = 74;
        for (let j = 0; j < 5; j++) {
          const x = sx0 + j * (cw + 8), y = 112, cur = j === k;
          c.fillStyle = cur ? P.ink : 'rgba(23,24,28,0.06)'; c.fillRect(x, y, cw, 44);
          c.strokeStyle = 'rgba(23,24,28,0.3)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, cw, 44);
          label(c, String(Math.round(m.t0 * SFPS) + j - 1).padStart(3, '0'), x + cw / 2, y + 22, { align: 'center', size: 15, ls: 1, color: cur ? P.ground : P.mute, base: 'middle', weight: 700 });
        }
        label(c, k <= 2 ? `SMEAR ${k} OF 2` : 'LANDING  ·  SQUASH', sx0, 190, { color: P.accentD, weight: 700, size: 18 });
        label(c, '×1/7.5 SPEED', W - 72, 80, { align: 'right', color: P.ink, weight: 700, size: 20 });
        span = [S_REPLAY[0] + mi * 1.5 - 0.5, S_REPLAY[0] + mi * 1.5 + 2.0];
      }
      TK.caption(c, t, W, H, { name: 'Smear', cat: 'Transitions', curve, span, curveLabel: 'POSITION / DRAWING', lo: -0.15, hi: 1.25 });
    },
    score(A) {
      TK.bed(A);
      const swish = (t, g, pan) => { A.whoosh(t - 0.03, 0.22, { f1: 900, f2: 6000, q: 1, g, swell: 0.35, rev: 0.15, pan }); };
      const land = t => { A.kick(t, 0.3, { f: 190, f2: 70, dur: 0.2 }); A.noise(t, { type: 'bandpass', f: 1400, q: 1.5, dur: 0.06, g: 0.14 }); };
      SM.forEach((m, i) => {
        const pan = m.b > m.a ? 0.4 : -0.4;
        swish(m.t0, 0.22, pan);
        if (m.type === 'multi') [0, 0.025, 0.05].forEach(d => A.noise(m.t0 + d, { type: 'bandpass', f: 3000 - d * 20000, q: 3, dur: 0.03, g: 0.09, pan }));
        if (m.type === 'brush') A.noise(m.t0, { type: 'bandpass', f: 4500, f2: 1200, q: 0.8, dur: 0.18, g: 0.1, crush: true, pan });
        land(m.t0 + 2 / SFPS);
        A.pluck(m.t0 + 2 / SFPS, midi([67, 64, 72][i]), { g: 0.12, bright: 0.7, dur: 0.8 });
      });
      // rewind
      A.noise(3.22, { type: 'bandpass', f: 5000, f2: 300, sweep: 0.28, q: 2, dur: 0.3, g: 0.12 });
      A.osc(3.22, { type: 'sawtooth', f: 900, f2: 120, glide: 0.28, dur: 0.3, g: 0.03, lp: 2400 });
      // replay: a projector tick per drawing, a slowed smear tone, a thud on each landing
      for (let i = 0; i < 9; i++) {
        const t = S_REPLAY[0] + i * TK.BEAT, k = 1 + (i % 3), mi = Math.floor(i / 3);
        A.osc(t, { f: 2800, dur: 0.03, g: 0.05 });
        if (k < 3) A.noise(t, { type: 'bandpass', f: 600 + k * 500, f2: 1800 + k * 900, q: 2, dur: 0.45, g: 0.06, swell: 0.3, rev: 0.3, pan: SM[mi].b > SM[mi].a ? 0.3 : -0.3 });
        else { A.kick(t, 0.24, { f: 150, f2: 50, dur: 0.3 }); A.bell(t, midi([79, 76, 84][mi]), { g: 0.05, dur: 1.2 }); }
      }
      // back to live, MOTION smears in
      A.whoosh(7.85, 0.3, { f1: 300, f2: 4000, g: 0.1, swell: 0.8 });
      swish(8.5, 0.2, 0.3);
      land(8.5 + 2 / SFPS);
      A.chord(8.65, [60, 64, 67, 72], { type: 'triangle', dur: 1.8, g: 0.04, a: 0.02, lp: 2600, rev: 0.6, width: 0.8 });
    },
  });
})();
