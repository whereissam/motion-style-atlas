/* batch k9 — Technique Atlas · Procedural / Compositing: techfeedback · techmasking · techkeying.
   techfeedback (each frame is the last frame redrawn under a small scale / rotate / offset and a
   decay, with the new Token on top; the loop is rebuilt in closed form from the last generations
   and their accumulated transforms, so trails turn into a tunnel, a spiral and a drifting vortex) ·
   techmasking (animated masks over a hidden plate: add, subtract, feather, invert, then track
   mattes — alpha from the word MOTION, luma from a grey ramp — with outlines, a mask stack and a
   live matte inset) ·
   techkeying (the Token shot on an unevenly lit green screen with spill; a difference key pulls the
   matte, clip black/white clean it, despill fixes the fringe and it lands on a new background,
   shown through wipes and a three-way RAW / MATTE / COMP split). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, midi, text, offscreen, rrect } = MG;
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
  const arrow = (c, x0, y0, x1, y1, col = P.ink) => {
    const a = Math.atan2(y1 - y0, x1 - x0);
    c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - Math.cos(a) * 6, y1 - Math.sin(a) * 6); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - Math.cos(a - 0.45) * 13, y1 - Math.sin(a - 0.45) * 13); c.lineTo(x1 - Math.cos(a + 0.45) * 13, y1 - Math.sin(a + 0.45) * 13); c.closePath(); c.fill();
    c.restore();
  };
  const pill = (c, s, x, y, o = {}) => {   // mono label on an ink (or accent) chip
    c.save(); c.font = `700 ${o.size || 16}px ${TK.MONO}`;
    if ('letterSpacing' in c) c.letterSpacing = '2px';
    const w = c.measureText(s).width + 22; c.restore();
    c.fillStyle = o.bg || P.ink; rrect(c, x, y, w, 30, 4); c.fill();
    label(c, s, x + 11, y + 16, { size: o.size || 16, ls: 2, color: o.color || P.ground, weight: 700, base: 'middle' });
    return w;
  };

  /* =====================================================================
     FEEDBACK — video feedback is a loop: OUT(f) = NEW(f) over DECAY ×
     TRANSFORM(OUT(f − 1)). Instead of reading the previous canvas, the
     frame is rebuilt in closed form: generation k (the Token drawn k frames
     ago) is painted, oldest first, under the product of the k transforms
     applied since it was drawn, at the product of the k decays. A
     parameter schedule walks four regimes on the bar lines — no transform
     (plain trails), scale up (tunnel), scale down + rotate (spiral) and
     scale up + counter-rotate + offset (a drifting vortex). The live
     transform is printed beside the monitor and the first few nested
     copies of the monitor frame are traced as dashed rectangles.
     ===================================================================== */
  const FB = { x: 500, y: 70, w: 1348, h: 770 }, FBC = [FB.x + FB.w / 2, FB.y + FB.h / 2], FBS = 116, FPS = 30;
  const FB_PH = [[0, 'TRAILS'], [2.55, 'TUNNEL'], [5.05, 'SPIRAL'], [7.55, 'VORTEX']];
  const fbParams = tt => ({
    s: kf(tt, [[0, 1], [2.3, 1], [2.8, 1.024, E.ioS], [4.8, 1.024], [5.3, 0.975, E.ioS], [7.3, 0.975], [7.8, 1.03, E.ioS], [10, 1.03]]),
    r: kf(tt, [[0, 0], [4.8, 0], [5.3, -6, E.ioS], [7.3, -6], [7.8, -2.2, E.ioS], [10, -2.2]]),
    ox: kf(tt, [[0, 0], [7.3, 0], [7.8, 7, E.ioS], [10, 7]]),
    oy: kf(tt, [[0, 0], [7.3, 0], [7.8, -4, E.ioS], [10, -4]]),
    d: kf(tt, [[0, 0.86], [2.3, 0.86], [2.8, 0.92, E.ioS], [4.8, 0.92], [5.3, 0.96, E.ioS], [7.3, 0.96], [7.8, 0.93, E.ioS], [10, 0.93]]),
  });
  // T(f): maps the previous output into frame f — about the monitor centre, then offset
  function fbMat(p) {
    const a = p.s * Math.cos(p.r * PI / 180), b = p.s * Math.sin(p.r * PI / 180), [cx, cy] = FBC;
    return [a, b, -b, a, cx + p.ox - (a * cx - b * cy), cy + p.oy - (b * cx + a * cy)];
  }
  const mmul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
  // the Token's own path: a Lissajous for the trails, blending into a circular orbit for the rest
  const fbPos = tt => {
    const w = kf(tt, [[0, 0], [2.0, 0], [2.8, 1, E.ioS]]), a = 2.6 * tt, rad = kf(tt, [[0, 1], [4.8, 1], [5.3, 1.65, E.ioS], [7.3, 1.65], [7.8, 1, E.ioS]]);
    return [FBC[0] + lerp(420 * Math.sin(1.15 * tt), 190 * rad * Math.cos(a), w), FBC[1] + lerp(215 * Math.sin(1.8 * tt + 0.6), 150 * rad * Math.sin(a), w)];
  };
  const fbCol = b => mixc(P.accent, P.blue, 0.85 * (0.5 - 0.5 * Math.cos(b * 0.2)));
  const fbPhase = tt => { let k = 0; FB_PH.forEach(([t0], i) => { if (tt >= t0) k = i; }); return k; };
  const fbCurve = u => (fbParams(u * 10).s - 0.95) / 0.09;

  MG.film({
    id: 'techfeedback', dur: 10, poster: 6.9,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Feedback', sub: 'Each frame is the last frame, transformed, under the new one', era: '1960s —',
      origin: 'Pointing a video camera at the monitor it feeds makes a loop in which every frame contains the last one, scaled, rotated and dimmed by the camera’s framing — the tunnel explored by video artists such as Steina and Woody Vasulka in the late 1960s and early 1970s. The BBC’s Doctor Who titles (from 1963) were built on howl-round feedback, and digital tools turned the loop into a parameter set: a feedback buffer redrawn every frame with a scale, rotation, offset and decay, as in MilkDrop music visualisers and VJ software.',
      works: 'Doctor Who opening titles (Bernard Lodge, BBC, 1963; howl-round feedback) · Steina and Woody Vasulka, video feedback works (The Kitchen, New York, early 1970s) · MilkDrop (Ryan Geiss, Winamp visualiser, 2001)',
      tech: ['Frame-to-frame transform', 'Decay per generation', 'Closed-form reconstruction'],
      accent: '#ff5a1f',
      motionDNA: 'The Token flies a Lissajous loop at constant pace; everything else is the loop’s echo. Four regimes on the bar lines, each eased in over a quarter-second: no transform leaves plain fading trails, ×1.024 per frame blows them into a tunnel, ×0.975 with −6° a frame (against the Token’s orbit) winds them into an inward spiral, and ×1.03 with −2.2° and an offset sends a drifting vortex out from a shifted vanishing point.',
      visualDNA: 'The Technique Atlas stage with a framed monitor on the right; dozens of Token generations fading from orange to blue and back by birth frame, each inked at its edge; dashed rectangles tracing the monitor frame nested inside itself; a left column with the live parameters (scale, rotate, offset, decay, generations) and a loop diagram with a pulse running round it.',
      transitions: 'Parameter crossfades between feedback regimes; no cuts',
      implementation: ['Camera pointed at its own monitor (analog howl-round)', 'Feedback buffer in TouchDesigner / MilkDrop / After Effects echo', 'Canvas 2D: last N generations redrawn under accumulated affine transforms and decays'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      // per-frame transforms and decays for frames 0..300
      const T = [], D = [], Pm = [];
      for (let f = 0; f <= 301; f++) { const p = fbParams(f / FPS); Pm.push(p); T.push(fbMat(p)); D.push(p.d); }
      return { T, D, Pm };
    },
    draw(c, t, W, H, st) {
      TK.stage(c, W, H);
      const f = Math.min(300, Math.floor(t * FPS + 1e-6)), p = st.Pm[f], ph = fbPhase(t);
      // generations: M_k = T(f) ∘ T(f−1) ∘ … ∘ T(f−k+1), alpha_k = Π decays
      const gens = []; let M = [1, 0, 0, 1, 0, 0], al = 1;
      for (let k = 0; k <= 120 && f - k >= 0; k++) {
        if (k > 0) { M = mmul(M, st.T[f - k + 1]); al *= st.D[f - k + 1]; }
        if (al < 0.012) break;
        gens.push({ b: f - k, M, al });
      }
      // monitor
      c.save();
      c.fillStyle = 'rgba(23,24,28,0.035)'; c.fillRect(FB.x, FB.y, FB.w, FB.h);
      c.beginPath(); c.rect(FB.x, FB.y, FB.w, FB.h); c.clip();
      // nested monitor frames (where the previous outputs land)
      const nest = Math.min(gens.length - 1, 4);
      for (let k = nest; k >= 1; k--) {
        const m = gens[k].M;
        c.save(); c.transform(...m); c.setLineDash([10, 10]);
        c.lineWidth = 2 / Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]));
        c.strokeStyle = `rgba(23,24,28,${0.26 * (1 - k / 5)})`; c.strokeRect(FB.x + 12, FB.y + 12, FB.w - 24, FB.h - 24);
        c.restore();
      }
      for (let i = gens.length - 1; i >= 0; i--) {
        const g = gens[i], tt = g.b / FPS, [x, y] = fbPos(tt);
        c.save(); c.transform(...g.M); c.globalAlpha = g.al;
        TK.token(c, x, y, FBS, { rot: tt * 1.8, color: fbCol(g.b), edge: i === 0 ? 3 : 2 });
        c.restore();
      }
      c.restore();
      c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(FB.x, FB.y, FB.w, FB.h);
      label(c, `OUTPUT  ·  FRAME ${String(f).padStart(3, '0')}`, FB.x + 18, FB.y + 34, { color: P.ink, weight: 700, size: 16 });
      label(c, `${gens.length} GENERATIONS REDRAWN`, FB.x + FB.w - 18, FB.y + 34, { align: 'right', size: 16 });
      if (nest >= 1 && ph > 0) label(c, 'FRAME n−1', FB.x + FB.w - 18, FB.y + FB.h - 20, { align: 'right', size: 14 });

      // left column: regime, live parameters, loop diagram
      const lx = 72;
      tag(c, `FEEDBACK  ·  ${FB_PH[ph][1]}`, lx, 98, seg(t, 0.1, 0.5));
      label(c, `REGIME ${ph + 1} / 4`, lx + 26, 130, { size: 15 });
      const prev = fbParams(Math.max(0, t - 0.6)), chg = k => Math.abs(p[k] - prev[k]) > 1e-4 || Math.abs(p[k] - fbParams(Math.min(10, t + 0.3))[k]) > 1e-4;
      const sgn = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1);
      const rows = [
        ['SCALE', `×${p.s.toFixed(3)}`, 's'], ['ROTATE', `${sgn(p.r)}°`, 'r'], ['OFFSET', `${sgn(p.ox)}, ${sgn(p.oy)} px`, 'ox'],
        ['DECAY', `×${p.d.toFixed(3)}`, 'd'],
      ];
      rows.forEach(([n, v, k], i) => {
        const y = 196 + i * 46, hot = chg(k);
        c.fillStyle = hot ? P.accent : 'rgba(23,24,28,0.25)'; c.fillRect(lx, y - 20, 4, 26);
        label(c, n, lx + 18, y, { size: 16, color: P.mute });
        label(c, v, lx + 150, y, { size: 21, color: hot ? P.accentD : P.ink, weight: 700, ls: 1 });
      });
      label(c, 'PER FRAME, 30 FPS', lx + 18, 196 + 4 * 46 - 6, { size: 13, ls: 2 });
      // loop diagram
      const bx = lx, by = 470, bw = 196, bh = 40, gap = 74;
      const boxes = [['NEW TOKEN', 0], ['OVER', 1], ['OUTPUT', 2]];
      boxes.forEach(([s, i]) => {
        const y = by + i * gap, on = i === 2;
        c.fillStyle = on ? P.ink : P.ground; c.strokeStyle = P.ink; c.lineWidth = 2;
        rrect(c, bx, y, bw, bh, 6); c.fill(); c.stroke();
        label(c, s, bx + bw / 2, y + bh / 2 + 1, { align: 'center', base: 'middle', size: 15, color: on ? P.ground : P.ink, weight: 700 });
        if (i < 2) arrow(c, bx + bw / 2, y + bh + 2, bx + bw / 2, y + gap - 2);
      });
      // return path: OUTPUT → TRANSFORM → × DECAY → OVER
      const rx = bx + bw + 46;
      c.strokeStyle = P.accent; c.lineWidth = 3;
      c.beginPath(); c.moveTo(bx + bw, by + 2 * gap + bh / 2); c.lineTo(rx, by + 2 * gap + bh / 2); c.lineTo(rx, by + gap + bh / 2); c.stroke();
      arrow(c, rx, by + gap + bh / 2, bx + bw + 2, by + gap + bh / 2, P.accent);
      label(c, 'TRANSFORM T', rx + 14, by + 2 * gap - 4, { size: 14, color: P.accentD, weight: 700, ls: 1 });
      label(c, '× DECAY d', rx + 14, by + gap + bh / 2 + 30, { size: 14, color: P.accentD, weight: 700, ls: 1 });
      label(c, 'PREVIOUS FRAME', rx + 14, by + 2 * gap + bh / 2 + 34, { size: 12, ls: 2 });
      // pulse round the loop, one lap per beat
      const lp = (t / TK.BEAT) % 1, pts = [[bx + bw, by + 2 * gap + bh / 2], [rx, by + 2 * gap + bh / 2], [rx, by + gap + bh / 2], [bx + bw, by + gap + bh / 2]];
      const L = [rx - bx - bw, gap, rx - bx - bw], tot = L[0] + L[1] + L[2];
      let dist = lp * tot, si = 0; while (si < 2 && dist > L[si]) { dist -= L[si]; si++; }
      const q = clamp(dist / L[si]), px = lerp(pts[si][0], pts[si + 1][0], q), py = lerp(pts[si][1], pts[si + 1][1], q);
      c.fillStyle = P.ink; c.beginPath(); c.arc(px, py, 6, 0, TAU); c.fill();
      label(c, 'OUT(f) = NEW over', lx, by + 3 * gap + 20, { size: 14, color: P.ink, ls: 1 });
      label(c, '  d · T(OUT(f−1))', lx, by + 3 * gap + 42, { size: 14, color: P.ink, ls: 1 });
      TK.caption(c, t, W, H, { name: 'Feedback', cat: 'Procedural', curve: fbCurve, span: [0, 10], curveLabel: 'SCALE PER FRAME / TIME', lo: -0.1, hi: 1.15 });
    },
    score(A) {
      TK.bed(A);
      // a delay line echoing each beat's pluck, its feedback following the picture's decay
      const scale = [60, 64, 67, 71, 72, 67, 64, 62];
      for (let b = 0; b < 20; b++) {
        const t = b * TK.BEAT + 0.25, p = fbParams(t), fb = Math.pow(p.d, 6);
        const n = scale[b % 8] + (b >= 10 ? 7 : 0) - (b >= 15 ? 5 : 0);
        for (let j = 0; j < 5; j++) {
          const g = 0.13 * Math.pow(fb, j); if (g < 0.01) break;
          const det = j * (p.s - 1) * 1200 * 0.25 + j * p.r * 3;   // echoes drift in pitch with scale / rotation
          A.osc(t + j * 0.1875, { type: 'triangle', f: midi(n + 12) * Math.pow(2, det / 1200), dur: 0.35, g, lp: 3200 - j * 450, rev: 0.35, pan: (j % 2 ? 0.35 : -0.35) * Math.min(1, j) });
        }
      }
      FB_PH.slice(1).forEach(([t0], i) => {
        A.whoosh(t0 - 0.3, 0.6, { f1: 300 + i * 150, f2: 3000 + i * 600, g: 0.12, swell: 0.6, rev: 0.4 });
        A.bell(t0, midi([79, 76, 84][i]), { g: 0.06, dur: 1.6, rev: 0.5 });
      });
      A.osc(2.55, { type: 'sawtooth', f: 110, f2: 220, glide: 2.4, dur: 2.4, g: 0.025, lp: 900, lp2: 3000, a: 0.4, rev: 0.4 });
      A.osc(5.05, { type: 'triangle', f: 660, f2: 330, glide: 2.4, dur: 2.4, g: 0.03, a: 0.3, vib: [6, 8], rev: 0.5 });
      A.riser(7.55, 2.3, { g: 0.07, f: 82 });
    },
  });

  /* =====================================================================
     MASKING — a hidden plate (ink card, Token, MOTION) is revealed only
     where the mask is white. The mask is rendered to its own canvas and
     applied with destination-in: two masks ADDed (a union), a mask
     SUBTRACTed (a travelling hole), a feather growing from hard to soft
     (the mask blurred), the same mask INVERTED, and then track mattes —
     another layer's alpha (the word MOTION) and another layer's luma (a
     grey ramp, converted to alpha per pixel at half resolution). Mask
     outlines with vertices, a mask-stack readout and a live matte inset
     explain what is happening at every moment.
     ===================================================================== */
  const MK_PL = { x: 360, y: 200, w: 1200, h: 620 }, MK_C = [960, 510];
  const MK_SEC = [
    { t0: 0.3, mode: 'add', name: 'MASK ADD', sub: 'MASK 1 ∪ MASK 2' },
    { t0: 2.6, mode: 'sub', name: 'MASK SUBTRACT', sub: 'MASK 1 − MASK 2' },
    { t0: 4.6, mode: 'feather', name: 'FEATHER', sub: 'HARD EDGE → SOFT EDGE' },
    { t0: 6.2, mode: 'invert', name: 'INVERTED MASK', sub: 'INSIDE ↔ OUTSIDE' },
    { t0: 7.3, mode: 'alpha', name: 'TRACK MATTE · ALPHA', sub: 'LAYER ABOVE: ITS ALPHA = OPACITY' },
    { t0: 8.65, mode: 'luma', name: 'TRACK MATTE · LUMA', sub: 'LAYER ABOVE: ITS BRIGHTNESS = OPACITY' },
  ];
  const mkSec = t => { let k = 0; MK_SEC.forEach((s, i) => { if (t >= s.t0) k = i; }); return k; };
  const mkFeather = t => t < 6.2 ? 90 * E.ioC(seg(t, 4.8, 5.8)) : t < 7.3 ? lerp(90, 28, E.ioC(seg(t, 6.2, 6.5))) : 0;
  // mask shapes for time t: [{k:'circle'|'rrect'|'ell', ...}], with modes
  function mkShapes(t) {
    const s = MK_SEC[mkSec(t)];
    if (s.mode === 'add') {
      const u = seg(t, 0.3, 2.5);
      return t < 0.95 ? [{ k: 'circle', x: lerp(660, 880, E.ioS(u)), y: 470, r: Math.max(1, 250 * E.outB(seg(t, 0.3, 0.9))), op: 'ADD', n: 1 }] : [
        { k: 'circle', x: lerp(660, 880, E.ioS(u)), y: 470, r: Math.max(1, 250 * E.outB(seg(t, 0.3, 0.9))), op: 'ADD', n: 1 },
        { k: 'rrect', x: lerp(1380, 1080, E.ioS(seg(t, 0.9, 2.5))), y: 580, w: 400 * E.outB(seg(t, 0.95, 1.45)) + 8, h: 280, rot: lerp(0.35, -0.12, E.ioS(seg(t, 0.9, 2.5))), op: 'ADD', n: 2 },
      ];
    }
    if (s.mode === 'sub') {
      const u = E.ioS(seg(t, 2.75, 4.5));
      return [
        { k: 'rrect', x: 960, y: 510, w: 1080, h: 540, rot: 0, op: 'ADD', n: 1 },
        { k: 'circle', x: lerp(560, 1360, u), y: 480 + 90 * Math.sin(u * TAU), r: 190 * E.outB(seg(t, 2.6, 3.0)) + 1, op: 'SUBTRACT', n: 2 },
      ];
    }
    if (s.mode === 'feather') return [{ k: 'ell', x: 960, y: 500, rx: 440, ry: 270, op: 'ADD', n: 1 }];
    if (s.mode === 'invert') return [{ k: 'ell', x: lerp(760, 1160, E.ioS(seg(t, 6.3, 7.3))), y: 480, rx: lerp(440, 300, E.ioC(seg(t, 6.2, 6.5))), ry: lerp(270, 230, E.ioC(seg(t, 6.2, 6.5))), op: 'ADD', n: 1, inv: true }];
    return [];
  }
  function mkPath(c, s, grow = 0) {
    c.beginPath();
    if (s.k === 'circle') c.arc(s.x, s.y, Math.max(1, s.r + grow), 0, TAU);
    else if (s.k === 'ell') c.ellipse(s.x, s.y, Math.max(1, s.rx + grow), Math.max(1, s.ry + grow), 0, 0, TAU);
    else { c.save(); c.translate(s.x, s.y); c.rotate(s.rot); rrect(c, -s.w / 2 - grow, -s.h / 2 - grow, s.w + grow * 2, s.h + grow * 2, 24); c.restore(); }
  }
  function mkVerts(s) {
    if (s.k === 'circle') return [[s.x, s.y - s.r], [s.x + s.r, s.y], [s.x, s.y + s.r], [s.x - s.r, s.y]];
    if (s.k === 'ell') return [[s.x, s.y - s.ry], [s.x + s.rx, s.y], [s.x, s.y + s.ry], [s.x - s.rx, s.y]];
    const co = Math.cos(s.rot), si = Math.sin(s.rot);
    return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [s.x + co * a * s.w / 2 - si * b * s.h / 2, s.y + si * a * s.w / 2 + co * b * s.h / 2]);
  }
  function mkPlate(g, t) {
    const { x, y, w, h } = MK_PL;
    g.fillStyle = P.ink; rrect(g, x, y, w, h, 18); g.fill();
    g.save(); rrect(g, x, y, w, h, 18); g.clip();
    g.strokeStyle = 'rgba(236,232,223,0.07)'; g.lineWidth = 1; g.beginPath();
    for (let gx = x + 40; gx < x + w; gx += 80) { g.moveTo(gx, y); g.lineTo(gx, y + h); }
    for (let gy = y + 30; gy < y + h; gy += 80) { g.moveTo(x, gy); g.lineTo(x + w, gy); }
    g.stroke();
    g.fillStyle = P.blue; g.globalAlpha = 0.5; g.beginPath(); g.arc(x + w - 150, y + 130, 230, 0, TAU); g.fill(); g.globalAlpha = 1;
    g.restore();
    TK.token(g, 960, 440, 270, { rot: t * 0.35 });
    TK.word(g, 960, 690, { size: 110, color: P.ground, ls: 6 });
    label(g, 'LAYER 1  ·  PLATE', x + 26, y + 40, { size: 16, color: P.accentL, weight: 700 });
  }

  MG.film({
    id: 'techmasking', dur: 10, poster: 3.55,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Masking', sub: 'Show a layer only where another shape says so', era: '1900s —',
      origin: 'In-camera masks — a card in front of the lens, then a matte box exposing one part of the frame at a time — let early filmmakers such as Edwin S. Porter in The Great Train Robbery (1903) combine images; optical printers with travelling mattes made the matte a moving, frame-by-frame element. Digital compositing turned masks into editable bezier shapes with modes, feather and inversion, and desktop compositors such as After Effects made the other trick a one-click layer setting: the track matte, where one layer’s alpha or luminance sets another layer’s opacity.',
      works: 'Un homme de têtes (Georges Méliès, 1898; masked multiple exposures) · The Great Train Robbery (Edwin S. Porter, 1903; matted-in backgrounds) · Catch Me If You Can title sequence (Kuntzel + Deygas, 2002)',
      tech: ['Mask modes: add · subtract', 'Feather and invert', 'Alpha and luma track mattes'],
      accent: '#ff5a1f',
      motionDNA: 'The plate never moves except the Token turning slowly; only the masks do. Each mode gets about a bar: two masks slide toward each other and merge, a round hole travels a sine path through a big mask, the edge softens from 0 to 90 px, the mask snaps inside-out and drifts, the word MOTION scales up as an alpha matte, and a bright band sweeps along a luma matte.',
      visualDNA: 'The Technique Atlas stage with a hidden ink plate (dashed ghost of its Token and card); mask outlines in orange with square vertices and dashed feather bounds; a mask-stack readout under the tag (mask, mode, feather, inverted); a black-and-white matte inset top right.',
      transitions: 'Hard cuts between mask modes on the beat; matte changes in place',
      implementation: ['After Effects masks (Add / Subtract / Feather / Inverted) and track mattes', 'Nuke Roto + Merge (mask), Shuffle for luma', 'Canvas 2D: mask canvas applied with destination-in; luma → alpha on a half-res canvas'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const L = offscreen(1920, 1080), M = offscreen(1920, 1080), S = offscreen(960, 540), S2 = offscreen(960, 540);
      S.getContext('2d', { willReadFrequently: true });
      return { L, M, S, S2 };
    },
    draw(c, t, W, H, st) {
      TK.stage(c, W, H);
      const si = mkSec(t), sec = MK_SEC[si], shapes = mkShapes(t), fe = mkFeather(t);
      // ghost of the hidden plate
      c.save(); c.setLineDash([8, 8]); c.strokeStyle = 'rgba(23,24,28,0.28)'; c.lineWidth = 2;
      rrect(c, MK_PL.x, MK_PL.y, MK_PL.w, MK_PL.h, 18); c.stroke();
      c.save(); c.translate(960, 440); c.rotate(t * 0.35); TK.tokenPath(c, 270); c.restore(); c.stroke();
      c.restore();
      label(c, 'HIDDEN LAYER', MK_PL.x + MK_PL.w - 20, MK_PL.y + MK_PL.h - 20, { align: 'right', size: 14 });

      // build the mask
      const mg = st.M.getContext('2d');
      mg.setTransform(1, 0, 0, 1, 0, 0); mg.clearRect(0, 0, 1920, 1080);
      let insetSrc = st.M;
      if (sec.mode === 'alpha' || sec.mode === 'luma') {
        const sg = st.S.getContext('2d');
        sg.setTransform(0.5, 0, 0, 0.5, 0, 0); sg.fillStyle = '#000'; sg.fillRect(0, 0, 1920, 1080);
        const sz = sec.mode === 'alpha' ? lerp(150, 250, E.outB(seg(t, 7.3, 7.9))) : 250;
        if (sec.mode === 'alpha') TK.word(sg, 960, 510, { size: sz, color: '#fff', ls: 6 });
        else {
          const u = seg(t, 8.65, 10), gx = lerp(-700, 1500, u);
          const gr = sg.createLinearGradient(gx, 0, gx + 1100, 0);
          gr.addColorStop(0, '#000'); gr.addColorStop(0.3, '#555'); gr.addColorStop(0.5, '#fff'); gr.addColorStop(0.7, '#555'); gr.addColorStop(1, '#000');
          TK.word(sg, 960, 510, { size: sz, color: gr, ls: 6 });
          sg.fillStyle = '#7f7f7f'; sg.fillRect(380, 752, 560, 54);   // a 50 % grey bar
          sg.fillStyle = '#fff'; sg.fillRect(980, 752, 560, 54);      // a white bar
          label(sg, '50 % GREY', 400, 790, { size: 30, color: '#000', weight: 700 }); label(sg, 'WHITE', 1000, 790, { size: 30, color: '#000', weight: 700 });
        }
        // the matte layer is drawn white-on-black here, so its alpha and its luma agree; read brightness → alpha
        const id = sg.getImageData(0, 0, 960, 540), d = id.data;
        for (let i = 0; i < d.length; i += 4) { const lum = d[i]; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = lum; }
        st.S2.getContext('2d').putImageData(id, 0, 0);
        mg.drawImage(st.S2, 0, 0, 1920, 1080);
        insetSrc = st.S;
      } else if (shapes.length) {
        const inv = shapes.some(s => s.inv);
        mg.filter = fe > 0.5 ? `blur(${(fe / 2.4).toFixed(1)}px)` : 'none';
        if (inv) { mg.fillStyle = '#fff'; mg.fillRect(0, 0, 1920, 1080); mg.globalCompositeOperation = 'destination-out'; }
        shapes.forEach(s => {
          if (!inv) mg.globalCompositeOperation = s.op === 'SUBTRACT' ? 'destination-out' : 'source-over';
          mkPath(mg, s); mg.fillStyle = '#fff'; mg.fill();
        });
        mg.globalCompositeOperation = 'source-over'; mg.filter = 'none';
      }
      // layer × mask
      const lg = st.L.getContext('2d');
      lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, 1920, 1080);
      mkPlate(lg, t);
      lg.globalCompositeOperation = 'destination-in'; lg.drawImage(st.M, 0, 0); lg.globalCompositeOperation = 'source-over';
      c.drawImage(st.L, 0, 0, 1920, 1080);

      // mask outlines + vertices
      shapes.forEach(s => {
        c.save(); c.strokeStyle = P.accent; c.lineWidth = 3; mkPath(c, s); c.stroke();
        if (fe > 1) { c.setLineDash([6, 8]); c.lineWidth = 1.5; c.strokeStyle = P.accentD; mkPath(c, s, fe / 2); c.stroke(); mkPath(c, s, -fe / 2); c.stroke(); }
        c.restore();
        mkVerts(s).forEach(([x, y]) => { c.fillStyle = P.ground; c.fillRect(x - 6, y - 6, 12, 12); c.strokeStyle = P.accent; c.lineWidth = 2.5; c.strokeRect(x - 6, y - 6, 12, 12); });
        const [vx, vy] = mkVerts(s).reduce((m, v) => (v[1] < m[1] ? v : m));
        pill(c, `MASK ${s.n} · ${s.op}${s.inv ? ' · INV' : ''}`, vx + 14, vy - 40, { bg: P.accent, color: P.ink, size: 13 });
      });
      if (sec.mode === 'feather') label(c, `FEATHER ${Math.round(fe)} PX`, 960, 820 - 34, { align: 'center', size: 18, color: P.ground, weight: 700 });
      if (sec.mode === 'luma') {
        label(c, '→ 50 % OPAQUE', 380, 842, { size: 14, color: P.ink, weight: 700 }); label(c, '→ 100 % OPAQUE', 980, 842, { size: 14, color: P.ink, weight: 700 });
      }
      if (sec.mode === 'alpha' || sec.mode === 'luma') {
        c.save(); c.globalAlpha = 0.5; text(c, TK.WORD, 960, 510, { font: TK.FONT, weight: 900, size: 250, ls: 6, align: 'center', base: 'middle', color: null, stroke: P.accent, lw: 2 }); c.restore();
      }

      // top-left: mode + mask stack
      tag(c, sec.name, 72, 80, seg(t, 0.1, 0.4));
      label(c, sec.sub, 98, 110, { size: 15, color: P.accentD, weight: 700 });
      const rows = sec.mode === 'alpha' || sec.mode === 'luma'
        ? [['LAYER 2', 'MATTE', `${sec.mode === 'alpha' ? 'ALPHA' : 'LUMA'} SOURCE · HIDDEN`], ['LAYER 1', 'PLATE', `TRKMAT: ${sec.mode === 'alpha' ? 'ALPHA MATTE' : 'LUMA MATTE'}`]]
        : shapes.map(s => [`MASK ${s.n}`, s.op, `FEATHER ${Math.round(fe)} PX  ·  INVERTED ${s.inv ? '■' : '□'}`]);
      rows.forEach((r, i) => {
        const y = 150 + i * 26;
        label(c, r[0], 98, y, { size: 14, color: P.ink, weight: 700, ls: 2 });
        label(c, r[1], 200, y, { size: 14, color: P.accentD, weight: 700, ls: 2 });
        label(c, r[2], 330, y, { size: 14, ls: 2 });
      });
      // matte inset, top right
      const ix = 1560, iy = 36, iw = 288, ih = 162;
      c.fillStyle = '#000'; c.fillRect(ix, iy, iw, ih);
      c.drawImage(insetSrc, ix, iy, iw, ih);
      c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(ix, iy, iw, ih);
      label(c, sec.mode === 'luma' ? 'MATTE  ·  LUMA → ALPHA' : 'MATTE  ·  WHITE = SHOWN', ix, iy + ih + 22, { size: 13, ls: 2, color: P.ink, weight: 700 });
      TK.caption(c, t, W, H, { name: 'Masking', cat: 'Compositing', curve: u => mkFeather(u * 10) / 90, span: [0, 10], curveLabel: 'FEATHER / TIME', lo: -0.15, hi: 1.2 });
    },
    score(A) {
      TK.bed(A);
      MK_SEC.forEach((s, i) => {
        A.snare(s.t0, 0.1, { f: 2600, dur: 0.07, rev: 0.25 });
        A.pluck(s.t0, midi([64, 67, 71, 72, 76, 79][i]), { g: 0.15, bright: 0.65, dur: 1.1 });
      });
      // add: two shapes slide in
      A.whoosh(0.3, 0.7, { f1: 300, f2: 2600, g: 0.12, swell: 0.4, pan: -0.4 });
      A.whoosh(0.9, 0.7, { f1: 400, f2: 3000, g: 0.11, swell: 0.4, pan: 0.4 });
      A.bell(2.5, midi(84), { g: 0.05, dur: 1 });
      // subtract: the travelling hole, a sweeping hollow tone
      A.osc(2.75, { type: 'triangle', f: 330, f2: 660, glide: 1.75, dur: 1.8, g: 0.04, a: 0.2, lp: 1600, vib: [5, 6], rev: 0.4 });
      A.noise(2.75, { type: 'bandpass', f: 500, f2: 3000, sweep: 1.75, q: 4, dur: 1.8, g: 0.06, swell: 0.5, rev: 0.3 });
      // feather: a filter closing as the edge softens
      A.osc(4.8, { type: 'sawtooth', f: midi(52), dur: 1.3, g: 0.04, lp: 5000, lp2: 300, lpT: 1.0, a: 0.02, rev: 0.4 });
      A.osc(4.8, { type: 'sawtooth', f: midi(59), dur: 1.3, g: 0.03, lp: 5000, lp2: 300, lpT: 1.0, a: 0.02, rev: 0.4 });
      // invert: a flip
      A.osc(6.2, { type: 'square', f: 880, f2: 220, glide: 0.12, dur: 0.15, g: 0.04, lp: 3000 });
      A.osc(6.32, { type: 'square', f: 220, f2: 880, glide: 0.12, dur: 0.15, g: 0.04, lp: 3000 });
      // track mattes
      A.whoosh(7.25, 0.6, { f1: 200, f2: 2000, g: 0.12, swell: 0.7 });
      A.chord(7.3, [60, 64, 67, 71], { type: 'triangle', dur: 1.4, g: 0.035, a: 0.05, lp: 2600, rev: 0.5, width: 0.8 });
      A.noise(8.65, { type: 'bandpass', f: 400, f2: 5000, sweep: 1.3, q: 2, dur: 1.35, g: 0.07, swell: 0.6, rev: 0.4 });
      A.chord(8.65, [57, 64, 69, 72, 76], { type: 'triangle', dur: 1.3, g: 0.035, a: 0.05, lp: 2800, rev: 0.6, width: 0.8 });
    },
  });

  /* =====================================================================
     KEYING — the Token is "shot" on a green screen at 640 × 360: a backdrop
     with a hot spot, fall-off to dark corners, a fold, tracking markers,
     sensor noise, and green spill bleeding into the Token's edges. Every
     frame the plate is keyed per pixel: d = G − max(R, B) gives the raw
     matte, clip black / clip white crush its grey backdrop to 0 and its
     subject to 1, despill limits G to (R + B) / 2, and the foreground is
     composited over the Technique Atlas stage. Views are swapped with
     wipes (RAW → MATTE → COMP, despill off → on) and end in a three-way
     split; the keyer's parameters and transfer curve sit beside the viewer.
     ===================================================================== */
  const KW = 640, KH = 360, KV = { x: 72, y: 110, w: 1280, h: 720 }, KREF = 120;
  const kClip = t => [kf(t, [[0, 0], [3.0, 0], [4.0, 0.66, E.ioS]]), kf(t, [[0, 1], [3.0, 1], [4.0, 0.9, E.ioS]])];
  const kDespill = t => seg(t, 6.4, 7.4);   // divider position for despill on (0 = off everywhere, 1 = on everywhere)
  const kTok = t => ({ x: 320 + 150 * Math.sin(0.7 * t), y: 148 + 10 * Math.sin(1.4 * t), rot: 0.35 * Math.sin(0.5 * t) });
  const K_MARK = [[70, 50], [580, 46], [60, 315], [585, 318], [470, 150], [150, 190]];
  function kPlate(g, t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = 'rgb(60,175,80)'; g.fillRect(0, 0, KW, KH);
    let gr = g.createRadialGradient(230, 110, 0, 230, 110, 300);
    gr.addColorStop(0, 'rgba(100,225,110,0.95)'); gr.addColorStop(1, 'rgba(100,225,110,0)');
    g.fillStyle = gr; g.fillRect(0, 0, KW, KH);
    gr = g.createRadialGradient(320, 170, 140, 320, 170, 430);
    gr.addColorStop(0, 'rgba(30,110,50,0)'); gr.addColorStop(1, 'rgba(30,110,50,0.95)');
    g.fillStyle = gr; g.fillRect(0, 0, KW, KH);
    gr = g.createLinearGradient(440, 0, 500, 0);   // a fold in the cloth
    gr.addColorStop(0, 'rgba(30,110,50,0)'); gr.addColorStop(0.5, 'rgba(30,110,50,0.45)'); gr.addColorStop(1, 'rgba(30,110,50,0)');
    g.fillStyle = gr; g.fillRect(440, 0, 60, KH);
    g.strokeStyle = 'rgb(40,105,52)'; g.lineWidth = 3;
    K_MARK.forEach(([x, y]) => { g.beginPath(); g.moveTo(x - 9, y); g.lineTo(x + 9, y); g.moveTo(x, y - 9); g.lineTo(x, y + 9); g.stroke(); });
    // subject: the Token and the word, with green spill on the Token's edges
    const k = kTok(t);
    TK.token(g, k.x, k.y, 132, { rot: k.rot });
    g.save(); g.translate(k.x, k.y); g.rotate(k.rot); TK.tokenPath(g, 132); g.clip('evenodd');
    g.filter = 'blur(1.5px)'; g.strokeStyle = 'rgba(70,225,80,0.55)'; g.lineWidth = 6; TK.tokenPath(g, 132); g.stroke(); g.filter = 'none';
    g.restore();
    TK.word(g, 320, 290, { size: 58, ls: 3 });
  }

  MG.film({
    id: 'techkeying', dur: 10, poster: 9.7,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Keying', sub: 'Pull a matte from a colour, then replace it', era: '1940 —',
      origin: 'Blue-screen travelling mattes were pioneered by Larry Butler for The Thief of Bagdad (1940), and Petro Vlahos refined the colour-difference process (and later the Ultimatte electronic keyer) whose idea — the matte is how much the backing colour exceeds the other channels — every digital keyer still uses. Green became the usual backing with digital video sensors, and keying grew its standard controls: clip black and white to clean the matte, and spill suppression to remove backing colour reflected onto the subject.',
      works: 'The Thief of Bagdad (1940; Larry Butler’s blue-screen mattes) · Ben-Hur (1959; Petro Vlahos’s colour-difference blue screen) · Mary Poppins (1964; the sodium-vapour matte process)',
      tech: ['Colour-difference matte', 'Clip black / clip white', 'Spill suppression'],
      accent: '#ff5a1f',
      motionDNA: 'The Token drifts slowly left and right on the green screen while the keyer, not the subject, does the moving: one-bar wipes swap RAW for MATTE and MATTE for COMP, the clip values ease over one bar so the grey matte snaps clean, a slow wipe turns despill on across the frame, and two dividers slide in to hold a three-way split the Token crosses.',
      visualDNA: 'A 16:9 viewer on the Technique Atlas stage showing a drawn green-screen plate (hot spot, dark corners, a fold, dark tracking crosses, sensor noise, green rim on the orange Token), its black-and-white matte and the composite on the paper-and-grid stage; orange wipe dividers with view chips; a keyer panel on the right with clip values, despill state, formulas and a live transfer curve; a loupe on the Token edge showing the green fringe.',
      transitions: 'Hard-edged wipes between RAW, MATTE and COMP; a three-way split',
      implementation: ['Ultimatte / Primatte / Keylight colour-difference keyers', 'Nuke Keylight + IBK, After Effects Keylight with spill suppression', 'Canvas 2D: per-pixel key on a 640 × 360 canvas (getImageData), scaled 2× into the viewer'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const R = offscreen(KW, KH), Mt = offscreen(KW, KH), C0 = offscreen(KW, KH), C1 = offscreen(KW, KH), B = offscreen(KW, KH);
      R.getContext('2d', { willReadFrequently: true });
      const bg = B.getContext('2d'); bg.scale(KW / 1920, KH / 1080); TK.stage(bg, 1920, 1080, { floor: 900 });
      const ids = [Mt, C0, C1].map(cv => cv.getContext('2d').createImageData(KW, KH));
      return { R, Mt, C0, C1, bgD: bg.getImageData(0, 0, KW, KH).data, ids };
    },
    draw(c, t, W, H, st) {
      TK.stage(c, W, H);
      const rg = st.R.getContext('2d');
      kPlate(rg, t);
      // per-pixel: sensor noise, then key, despill, comp
      const raw = rg.getImageData(0, 0, KW, KH), s = raw.data, bg = st.bgD;
      const [cb, cw] = kClip(t), mD = st.ids[0].data, c0 = st.ids[1].data, c1 = st.ids[2].data;
      let q = (Math.floor(t * 30) * 2654435761) >>> 0;
      for (let i = 0; i < s.length; i += 4) {
        q = (Math.imul(q, 1664525) + 1013904223) >>> 0;
        const nl = ((q >>> 24) - 128) / 128 * 6, ng = (((q >>> 16) & 255) - 128) / 128 * 4;
        s[i] += nl; s[i + 1] += nl + ng; s[i + 2] += nl;
        const R = s[i], G = s[i + 1], B = s[i + 2];
        const m0 = clamp(1 - (G - Math.max(R, B)) / KREF), a = clamp((m0 - cb) / (cw - cb));
        mD[i] = mD[i + 1] = mD[i + 2] = a * 255; mD[i + 3] = 255;
        const Gd = Math.min(G, (R + B) / 2);
        c0[i] = R * a + bg[i] * (1 - a); c0[i + 1] = G * a + bg[i + 1] * (1 - a); c0[i + 2] = B * a + bg[i + 2] * (1 - a); c0[i + 3] = 255;
        c1[i] = c0[i]; c1[i + 1] = Gd * a + bg[i + 1] * (1 - a); c1[i + 2] = c0[i + 2]; c1[i + 3] = 255;
      }
      rg.putImageData(raw, 0, 0);
      st.Mt.getContext('2d').putImageData(st.ids[0], 0, 0);
      st.C0.getContext('2d').putImageData(st.ids[1], 0, 0);
      st.C1.getContext('2d').putImageData(st.ids[2], 0, 0);
      const V = { RAW: st.R, MATTE: st.Mt, COMP: st.C0, COMPD: st.C1 };

      // which views where: list of [view, x0, x1] in viewer units 0..1
      let regions, divs = [];
      const w1 = E.ioC(seg(t, 2.0, 2.8)), w2 = E.ioC(seg(t, 4.4, 5.2)), w3 = E.ioS(kDespill(t)), w4 = E.ioC(seg(t, 8.0, 8.6));
      if (t < 2.0) regions = [['RAW', 0, 1]];
      else if (t < 2.8) { regions = [['MATTE', 0, w1], ['RAW', w1, 1]]; divs = [w1]; }
      else if (t < 4.4) regions = [['MATTE', 0, 1]];
      else if (t < 5.2) { regions = [['COMP', 0, w2], ['MATTE', w2, 1]]; divs = [w2]; }
      else if (t < 6.4) regions = [['COMP', 0, 1]];
      else if (t < 7.4) { regions = [['COMPD', 0, w3], ['COMP', w3, 1]]; divs = [w3]; }
      else if (t < 8.0) regions = [['COMPD', 0, 1]];
      else { regions = [['RAW', 0, w4 / 3], ['MATTE', w4 / 3, w4 * 2 / 3], ['COMPD', w4 * 2 / 3, 1]]; divs = [w4 / 3, w4 * 2 / 3]; }
      c.save(); c.imageSmoothingEnabled = true;
      regions.forEach(([v, a, b]) => {
        if (b - a <= 0) return;
        c.save(); c.beginPath(); c.rect(KV.x + a * KV.w, KV.y, (b - a) * KV.w, KV.h); c.clip();
        c.drawImage(V[v], KV.x, KV.y, KV.w, KV.h); c.restore();
      });
      c.restore();
      c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(KV.x, KV.y, KV.w, KV.h);
      divs.forEach(u => {
        if (u <= 0.001) return;
        const x = KV.x + u * KV.w;
        c.fillStyle = P.accent; c.fillRect(x - 2, KV.y, 4, KV.h);
        c.beginPath(); c.arc(x, KV.y + KV.h / 2, 12, 0, TAU); c.fill();
        c.fillStyle = P.ground; c.beginPath(); c.arc(x, KV.y + KV.h / 2, 4, 0, TAU); c.fill();
      });
      const vname = { RAW: 'RAW', MATTE: 'MATTE', COMP: 'COMP · DESPILL OFF', COMPD: t >= 8 ? 'COMP' : 'COMP · DESPILL ON' };
      regions.forEach(([v, a, b]) => {
        if ((b - a) * KV.w < 140) return;
        pill(c, vname[v], KV.x + a * KV.w + 14, KV.y + 14, { bg: v === 'MATTE' ? P.accent : P.ink, color: v === 'MATTE' ? P.ink : P.ground });
      });
      // annotations on the raw plate
      const toV = (x, y) => [KV.x + x * KV.w / KW, KV.y + y * KV.h / KH];
      if (t < 2.1) {
        const tk = kTok(t), notes = [
          [0.3, 'HOT SPOT', [230, 110], [300, 40]],
          [0.6, 'FALL-OFF', [600, 330], [480, 300]],
          [0.9, 'TRACKING MARKER', [580, 46], [440, 80]],
          [1.2, 'GREEN SPILL', [tk.x - 62, tk.y + 30], [tk.x - 230, tk.y + 110]],
        ];
        notes.forEach(([t0, s, p, l]) => {
          const on = seg(t, t0, t0 + 0.25) * (1 - seg(t, 1.85, 2.05)); if (on <= 0) return;
          c.save(); c.globalAlpha = on;
          const [px, py] = toV(...p), [lx, ly] = toV(...l);
          arrow(c, lx, ly, px, py, P.ground);
          pill(c, s, lx - 10, ly - 32, { size: 14 });
          c.restore();
        });
      }
      if (t > 2.8 && t < 4.4) {
        const before = t < 3.4;
        pill(c, before ? 'GREY BACKDROP = PARTLY OPAQUE' : 'CLIPPED: BACKDROP 0, SUBJECT 1', KV.x + 14, KV.y + KV.h - 46, { bg: P.accent, color: P.ink, size: 15 });
      }
      // loupe on the Token's left edge
      const lo = seg(t, 5.3, 5.6) * (1 - seg(t, 7.6, 7.9));
      if (lo > 0) {
        const tk = kTok(t), sx = tk.x - 66 * Math.cos(tk.rot), sy = tk.y - 66 * Math.sin(tk.rot), R = 130, z = 4, [cx, cy] = [KV.x + KV.w - 250, KV.y + 230];
        const src = sx / KW < w3 ? st.C1 : st.C0;
        c.save(); c.globalAlpha = lo;
        c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.save(); c.clip();
        c.imageSmoothingEnabled = false;
        c.drawImage(src, sx - R / z, sy - R / z, 2 * R / z, 2 * R / z, cx - R, cy - R, 2 * R, 2 * R);
        c.restore();
        c.strokeStyle = P.ink; c.lineWidth = 4; c.stroke();
        const [ex, ey] = toV(sx, sy);
        c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.arc(ex, ey, R / z * 2, 0, TAU); c.stroke();
        const an = Math.atan2(cy - ey, cx - ex); c.beginPath(); c.moveTo(ex + Math.cos(an) * R / z * 2, ey + Math.sin(an) * R / z * 2); c.lineTo(cx - Math.cos(an) * R, cy - Math.sin(an) * R); c.stroke();
        pill(c, src === st.C0 ? 'GREEN FRINGE ×4' : 'DESPILLED ×4', cx - R, cy + R + 10, { bg: src === st.C0 ? P.accent : P.ink, color: src === st.C0 ? P.ink : P.ground, size: 14 });
        c.restore();
      }

      // keyer panel
      const px = 1400;
      const stageName = t < 2 ? 'RAW PLATE' : t < 4.4 ? 'PULL THE MATTE' : t < 6.4 ? 'COMPOSITE' : t < 8 ? 'SPILL SUPPRESSION' : 'RAW · MATTE · COMP';
      tag(c, `CHROMA KEY  ·  ${stageName}`, 72, 74, seg(t, 0.1, 0.4));
      label(c, 'KEYER', px, 140, { size: 22, color: P.ink, weight: 700 });
      const despOn = t >= 6.4, rows = [
        ['KEY COLOUR', 'GREEN', null], ['CLIP BLACK', cb.toFixed(2), t > 3 && t < 4.1], ['CLIP WHITE', cw.toFixed(2), t > 3 && t < 4.1],
        ['DESPILL', despOn ? 'ON' : 'OFF', t > 6.4 && t < 7.5], ['BACKGROUND', t >= 4.4 ? 'ATLAS STAGE' : '—', t > 4.4 && t < 5.3],
      ];
      rows.forEach(([n, v, hot], i) => {
        const y = 190 + i * 40;
        c.fillStyle = hot ? P.accent : 'rgba(23,24,28,0.25)'; c.fillRect(px, y - 18, 4, 24);
        label(c, n, px + 16, y, { size: 15 });
        label(c, v, px + 200, y, { size: 19, color: hot ? P.accentD : P.ink, weight: 700, ls: 1 });
        if (i === 0) { c.fillStyle = 'rgb(60,175,80)'; c.fillRect(px + 300, y - 18, 24, 24); }
      });
      // transfer curve: alpha vs green difference
      const gx = px, gy = 420, gw = 440, gh = 170, d2x = d => gx + d / KREF * gw, a2y = a => gy + gh - a * gh;
      c.fillStyle = 'rgba(60,175,80,0.18)'; c.fillRect(d2x(55), gy, d2x(118) - d2x(55), gh);
      c.fillStyle = 'rgba(255,90,31,0.18)'; c.fillRect(gx, gy, d2x(8) - gx, gh);
      c.strokeStyle = 'rgba(23,24,28,0.3)'; c.lineWidth = 1; c.strokeRect(gx + 0.5, gy + 0.5, gw, gh);
      c.strokeStyle = P.ink; c.lineWidth = 2.5; c.beginPath();
      for (let i = 0; i <= 120; i++) { const d = i / 120 * KREF, a = clamp((clamp(1 - d / KREF) - cb) / (cw - cb)); i ? c.lineTo(d2x(d), a2y(a)) : c.moveTo(d2x(d), a2y(a)); }
      c.stroke();
      [[(1 - cb) * KREF, 'CB'], [(1 - cw) * KREF, 'CW']].forEach(([d, s]) => {
        c.save(); c.setLineDash([4, 5]); c.strokeStyle = P.accentD; c.lineWidth = 1.5; c.beginPath(); c.moveTo(d2x(d), gy); c.lineTo(d2x(d), gy + gh); c.stroke(); c.restore();
        label(c, s, d2x(d), gy - 8, { align: 'center', size: 13, color: P.accentD, weight: 700, ls: 1 });
      });
      label(c, 'SUBJECT', gx + 6, gy + gh + 22, { size: 12, ls: 1, color: P.accentD });
      label(c, 'BACKDROP', d2x(86), gy + gh + 22, { size: 12, ls: 1, color: 'rgb(40,120,60)', align: 'center' });
      label(c, 'α', gx - 12, gy + 14, { size: 14, align: 'right', color: P.ink });
      label(c, 'ALPHA / GREEN DIFFERENCE', gx, gy - 30, { size: 13, ls: 2 });
      const fx = px, fy = 660;
      [['d = G − max(R, B)', 0], ['α = clip(1 − d / 120)', 1], ['DESPILL  G → min(G, (R+B)/2)', 2], ['COMP = FG·α + BG·(1 − α)', 3]].forEach(([s, i]) => {
        label(c, s, fx, fy + i * 32, { size: 16, color: P.ink, ls: 1, weight: (i === 2 && t > 6.4) || (i === 3 && t > 4.4) || (i < 2 && t > 2.8 && t < 4.4) ? 700 : 400 });
      });
      TK.caption(c, t, W, H, { name: 'Keying', cat: 'Compositing' });
    },
    score(A) {
      TK.bed(A);
      // studio hum under the raw plate
      A.osc(0, { type: 'sawtooth', f: 60, dur: 2.0, g: 0.02, lp: 300, hold: true, a: 0.3, rel: 0.3 });
      [0.3, 0.6, 0.9, 1.2].forEach((t, i) => A.osc(t, { f: 1800 + i * 300, dur: 0.05, g: 0.04, pan: (i - 1.5) * 0.3 }));
      // wipes
      [[2.0, -0.5], [4.4, 0.0], [8.0, 0.5]].forEach(([t, pan]) => A.whoosh(t, 0.8, { f1: 300, f2: 3500, g: 0.13, swell: 0.5, rev: 0.3, pan }));
      A.whoosh(6.4, 1.0, { f1: 2000, f2: 500, q: 2, g: 0.09, swell: 0.6, pan: 0.3 });
      // clip values easing: a rising tick train, then a clean chord when the matte snaps
      for (let k = 0; k < 10; k++) A.osc(3.0 + k * 0.1, { f: 900 + k * 120, dur: 0.04, g: 0.035 });
      A.bell(4.0, midi(84), { g: 0.06, dur: 1.4 });
      A.pluck(4.0, midi(72), { g: 0.14, bright: 0.6, dur: 1 });
      // comp lands on the new background
      A.chord(5.2, [60, 64, 67], { type: 'triangle', dur: 1.2, g: 0.035, a: 0.03, lp: 2400, rev: 0.5, width: 0.7 });
      A.pluck(7.4, midi(76), { g: 0.13, bright: 0.7, dur: 1 });
      // three-way split
      A.impact(8.6, 0.3);
      A.chord(8.6, [57, 64, 69, 72, 76], { type: 'triangle', dur: 1.4, g: 0.04, a: 0.03, lp: 2600, rev: 0.6, width: 0.8 });
    },
  });
})();
