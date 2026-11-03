/* batch k15 — Technique Atlas · Typography: techtypemorph · techtracking · techtextreveal.
   techtypemorph (letterforms as pen strokes on a skeleton: the weight axis widens the pen, the
   width axis scales the skeleton but not the pen, and glyphs interpolate point by point —
   MOTION → ACTION → MOTION — with the path through design space plotted) ·
   techtracking (uniform letter-spacing in thousandths of an em: MOTION goes tight to −50, then
   slowly tracks out to +800 around a fixed centre, advance widths and tracking gaps drawn, and a
   naive centred line underneath that drifts by half a gap) ·
   techtextreveal (four reveals of MOTION and a second line in four labelled panels: masked
   slide-up, typewriter, blur + tracking-in, and a seeded scramble that decodes left to right). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, midi, text } = MG;
  const TK = MG.TK, P = TK.P, PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const label = (c, s, x, y, o = {}) => text(c, s, x, y, { font: TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
  const tag = (c, s, x, y, on = 1) => {   // small accent dot + mono label, top-left of frame
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: P.ink, weight: 700, size: 20 });
    c.restore();
  };
  const dashed = (c, x0, y0, x1, y1, col = 'rgba(23,24,28,0.3)', lw = 1.5, d = [6, 6]) => {
    c.save(); c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(d);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.restore();
  };
  const dashRect = (c, x, y, w, h, col = 'rgba(23,24,28,0.3)', lw = 1.5, d = [6, 6]) => {
    c.save(); c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(d); c.strokeRect(x, y, w, h); c.restore();
  };
  // Horizontal slider with the Token as its knob. v01 = knob position 0..1.
  function slider(c, x0, x1, y, v01, name, val, o = {}) {
    c.fillStyle = 'rgba(23,24,28,0.16)'; c.fillRect(x0, y - 2, x1 - x0, 4);
    c.fillStyle = o.active ? P.ink : 'rgba(23,24,28,0.45)'; c.fillRect(x0, y - 2, (x1 - x0) * clamp(v01), 4);
    (o.ticks || []).forEach(([u, s]) => {
      c.fillStyle = 'rgba(23,24,28,0.35)'; c.fillRect(x0 + (x1 - x0) * u - 0.5, y + 8, 1, 8);
      if (s) label(c, s, x0 + (x1 - x0) * u, y + 34, { align: 'center', size: 13, ls: 1 });
    });
    label(c, name, x0 - 28, y + 6, { align: 'right', size: 20, color: o.active ? P.ink : P.mute, weight: 700, ls: 2 });
    label(c, val, x1 + 34, y + 6, { size: 20, color: o.active ? P.ink : P.mute, weight: 700, ls: 1 });
    TK.token(c, x0 + (x1 - x0) * clamp(v01), y, o.size || 34, { rot: o.rot || 0, color: o.active ? P.accent : P.accentL });
  }

  /* =====================================================================
     TYPE MORPH — letters built the METAFONT way: a skeleton of strokes
     (polylines in em units, each resampled to 64 points) drawn with a
     pen. The weight axis (wght 100 → 900) only widens the pen; the width
     axis (wdth 60 → 150) scales the skeleton in x while the pen stays the
     same, and advances follow both. Glyph → glyph pairs every stroke with
     a stroke of the target (missing strokes grow from a point), so M → A
     and O → C interpolate point i → point i while T I O N, shared by
     MOTION and ACTION, hold still. A design-space inset plots the path
     of (wght, wdth) through the whole film.
     ===================================================================== */
  const TN = 64, TEM = 180, TY = 430;
  const tmArc = (rx, ry, a0, a1, n = 72) => { const o = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); o.push([Math.cos(a) * rx, Math.sin(a) * ry]); } return o; };
  // glyph skeletons: x across the skeleton width w (em), y from −0.5 (cap) to 0.5 (baseline)
  const TG = {
    M: { w: 0.74, s: [[[-0.37, 0.5], [-0.37, -0.5], [0, 0.24], [0.37, -0.5], [0.37, 0.5]]] },
    O: { w: 0.74, s: [tmArc(0.37, 0.5, 0, TAU + 0.06)] },
    T: { w: 0.70, s: [[[-0.35, -0.5], [0.35, -0.5]], [[0, -0.5], [0, 0.5]]] },
    I: { w: 0.00, s: [[[0, -0.5], [0, 0.5]]] },
    N: { w: 0.62, s: [[[-0.31, 0.5], [-0.31, -0.5], [0.31, 0.5], [0.31, -0.5]]] },
    A: { w: 0.78, s: [[[-0.39, 0.5], [0, -0.5], [0.39, 0.5]], [[-0.22, 0.16], [0.22, 0.16]]] },
    C: { w: 0.70, s: [tmArc(0.35, 0.5, 0.3 * PI, 1.7 * PI)] },
  };
  function tmResample(poly, n) {
    const L = [0];
    for (let i = 1; i < poly.length; i++) L.push(L[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
    const tot = L[L.length - 1] || 1, out = [];
    let j = 1;
    for (let k = 0; k < n; k++) {
      const d = k / (n - 1) * tot;
      while (j < L.length - 1 && L[j] < d) j++;
      const u = (d - L[j - 1]) / ((L[j] - L[j - 1]) || 1);
      out.push([lerp(poly[j - 1][0], poly[j][0], u), lerp(poly[j - 1][1], poly[j][1], u)]);
    }
    return out;
  }
  // pair two glyphs: equal stroke counts, missing strokes collapsed onto a point of the first stroke
  function tmPair(a, b) {
    const A = TG[a].s.map(s => tmResample(s, TN)), B = TG[b].s.map(s => tmResample(s, TN));
    const pad = (S, n) => { while (S.length < n) { const p = S[0][TN >> 1]; S.push(Array.from({ length: TN }, () => [p[0], p[1]])); } };
    pad(A, B.length); pad(B, A.length);
    return { a: A, b: B, wa: TG[a].w, wb: TG[b].w, same: a === b };
  }
  const tmWght = t => kf(t, [[0, 100], [0.6, 100], [2.8, 900, E.ioC], [7.9, 900], [9.6, 100, E.ioC]]);
  const tmWdth = t => kf(t, [[0, 100], [3.0, 100], [3.9, 60, E.ioC], [4.9, 150, E.ioC], [5.4, 100, E.outB], [7.9, 100], [8.75, 130, E.ioC], [9.6, 100, E.ioC]]);
  const tmGlyph = t => kf(t, [[0, 0], [5.5, 0], [6.4, 1, E.ioC], [6.95, 1], [7.75, 0, E.outB]]);
  const tmPen = w => 0.03 + (w - 100) / 800 * 0.2;         // pen width in em
  const TM_SECT = [
    [0, 'WEIGHT AXIS  ·  wght WIDENS THE PEN, NOT THE SKELETON'],
    [3.0, 'WIDTH AXIS  ·  SKELETON SCALES IN x, PEN STAYS THE SAME'],
    [5.45, 'GLYPH → GLYPH  ·  STROKE i → STROKE i, POINT i → POINT i'],
    [7.85, 'BOTH AXES  ·  ONE PATH THROUGH THE DESIGN SPACE'],
  ];
  function tmLayout(st, t) {
    const wg = tmWght(t), wd = tmWdth(t) / 100, g = tmGlyph(t), pen = tmPen(wg), sb = 0.11;
    const items = st.pairs.map(p => {
      const w = lerp(p.wa, p.wb, p.same ? 0 : g);
      const strokes = p.a.map((S, k) => S.map((q, i) => {
        const r = p.same ? q : [lerp(q[0], p.b[k][i][0], g), lerp(q[1], p.b[k][i][1], g)];
        return [r[0] * wd, r[1] * (1 - pen)];
      }));
      return { p, strokes, adv: (w * wd + pen + sb) * TEM, ink: (w * wd + pen) * TEM };
    });
    const tot = items.reduce((s, it) => s + it.adv, 0) - sb * TEM;
    let x = 960 - tot / 2;
    items.forEach(it => { it.x = x; it.cx = x + it.ink / 2; x += it.adv; });
    return { items, wg, wd, g, pen, tot };
  }
  /* Draw a glyph's strokes. For ink (pen > 2 px), open stroke ends that run mostly vertical are
     extended past the cap line / baseline and the glyph is clipped to that band, so stems end flat
     on the cap height and baseline like a drawn letter instead of in angled pen caps. */
  function tmStroke(c, it, cy, s, lw, col, ink) {
    c.save();
    if (ink) { c.beginPath(); c.rect(0, cy - s / 2, 1920, s); c.clip(); }
    c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'butt'; c.lineJoin = 'miter'; c.miterLimit = 2.2;
    it.strokes.forEach(S => {
      if (Math.hypot(S[0][0] - S[TN - 1][0], S[0][1] - S[TN - 1][1]) < 1e-4 && Math.hypot(S[0][0] - S[TN >> 1][0], S[0][1] - S[TN >> 1][1]) < 1e-4) return;
      const pts = S.map(q => [it.cx + q[0] * s, cy + q[1] * s]);
      if (ink && Math.hypot(S[0][0] - S[TN - 1][0], S[0][1] - S[TN - 1][1]) > 0.05) {
        const ext = (a, b) => { const dx = a[0] - b[0], dy = a[1] - b[1], d = Math.hypot(dx, dy) || 1; return Math.abs(dy) > Math.abs(dx) && Math.abs(a[1] - cy) > s * 0.49 * (1 - lw / s) ? [a[0] + dx / d * lw * 2, a[1] + dy / d * lw * 2] : null; };
        const e0 = ext(pts[0], pts[3]), e1 = ext(pts[TN - 1], pts[TN - 4]);
        if (e0) pts.unshift(e0);
        if (e1) pts.push(e1);
      }
      c.beginPath(); pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.stroke();
    });
    c.restore();
  }

  MG.film({
    id: 'techtypemorph', dur: 10, poster: 6.0,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Type Morph', sub: 'Glyphs interpolated along weight, width and shape', era: '1977 —',
      origin: 'Donald Knuth’s METAFONT (first version 1977–79) described letters as pen strokes along skeleton paths, so weight and width became parameters instead of separate drawings. Adobe’s Multiple Master fonts (1991) interpolated between drawn master outlines along design axes, Apple’s TrueType GX variations followed in the mid-1990s, and OpenType Font Variations — variable fonts, announced jointly by Adobe, Apple, Google and Microsoft in 2016 — made registered axes such as weight (wght) and width (wdth) standard, and animatable on screen.',
      works: 'METAFONT and Computer Modern (Donald Knuth, 1977–86) · Myriad MM (Robert Slimbach and Carol Twombly, Adobe, 1992; weight and width Multiple Master axes) · OpenType Font Variations (Adobe, Apple, Google and Microsoft, 2016)',
      tech: ['Skeleton + pen width', 'Design-space axes', 'Glyph-to-glyph point correspondence'],
      accent: '#ff5a1f',
      motionDNA: 'Three axes moved one at a time, then two at once. The weight axis eases from 100 to 900 over a bar and the letters swell around fixed skeletons while the word grows with its advances; the width axis squeezes to 60 and stretches to 150 with a small overshoot home; M and O morph into A and C and back while the shared TION never moves; finally weight and width travel together on a curved path back to the start.',
      visualDNA: 'The Technique Atlas stage with MOTION drawn as ink pen strokes over thin orange skeletons with sample dots, dashed advance boxes, cap-height and baseline guides; three sliders below (wght, wdth, glyph) with the Token as their knobs; a design-space inset top-right plotting wght × wdth with the film’s path traced in orange.',
      transitions: 'Continuous axis interpolation; glyph-to-glyph point morph with an overshooting return',
      implementation: ['Variable fonts: CSS font-variation-settings / animated wght and wdth axes', 'Font editors (Glyphs, FontLab): masters, compatible outlines and interpolation', 'Canvas 2D: stroked skeletons resampled to 64 points, lerped per point'],
      reproducibility: 'Fully procedural',
      loopable: true,
    },
    setup() { return { pairs: [...'MOTION'].map((ch, i) => tmPair(ch, 'ACTION'[i])) }; },
    draw(c, t, W, H, st) {
      TK.stage(c, W, H);
      const L = tmLayout(st, t), s = TEM, cy = TY;
      let sec = 0; TM_SECT.forEach(([t0], i) => { if (t >= t0) sec = i; });
      tag(c, TM_SECT[sec][1], 72, 92, clamp(seg(t, TM_SECT[sec][0], TM_SECT[sec][0] + 0.3) + (sec === 0 ? 1 : 0)));
      // guides: cap height and baseline
      const x0 = 960 - L.tot / 2 - 40, x1 = 960 + L.tot / 2 + 40;
      dashed(c, 150, cy - s / 2, 1770, cy - s / 2, 'rgba(23,24,28,0.22)', 1);
      dashed(c, 150, cy + s / 2, 1770, cy + s / 2, 'rgba(23,24,28,0.22)', 1);
      label(c, 'CAP', 140, cy - s / 2 + 5, { align: 'right', size: 13, ls: 2 });
      label(c, 'BASE', 140, cy + s / 2 + 5, { align: 'right', size: 13, ls: 2 });
      // advance boxes
      L.items.forEach(it => dashRect(c, it.x, cy - s / 2 - 22, it.adv, s + 44, 'rgba(23,24,28,0.16)', 1, [3, 5]));
      // glyph-morph travel lines (source → target) for the morphing letters
      const gm = Math.sin(PI * clamp(seg(t, 5.35, 6.55))) + Math.sin(PI * clamp(seg(t, 6.85, 7.9)));
      // glyphs
      L.items.forEach(it => tmStroke(c, it, cy, s, L.pen * s, P.ink, true));
      if (gm > 0.01) {
        c.save(); c.globalAlpha = clamp(gm);
        L.items.forEach(it => {
          if (it.p.same) return;
          c.strokeStyle = 'rgba(198,62,12,0.6)'; c.lineWidth = 1;
          it.p.a.forEach((S, k) => { c.beginPath(); for (let i = 0; i < TN; i += 6) { const a = S[i], b = it.p.b[k][i]; c.moveTo(it.cx + a[0] * L.wd * s, cy + a[1] * (1 - L.pen) * s); c.lineTo(it.cx + b[0] * L.wd * s, cy + b[1] * (1 - L.pen) * s); } c.stroke(); });
          c.fillStyle = P.accent; label(c, it.p.same ? '' : '◆', it.cx, cy - s / 2 - 40, { align: 'center', size: 16, color: P.accent });
        });
        c.restore();
      }
      // skeleton + sample dots
      L.items.forEach(it => {
        tmStroke(c, it, cy, s, 2, P.accentL);
        c.fillStyle = P.ground;
        it.strokes.forEach(S => { for (let i = 0; i < TN; i += 9) { c.beginPath(); c.arc(it.cx + S[i][0] * s, cy + S[i][1] * s, 2.6, 0, TAU); c.fill(); } });
      });
      // pen-width callout on the first stem of M / A
      const m0 = L.items[0], top = m0.strokes[0][Math.round(TN * 0.15)];
      const px = m0.cx + top[0] * s, py = cy + top[1] * s, half = L.pen * s / 2;
      c.strokeStyle = P.accent; c.lineWidth = 4; c.beginPath();
      const ang = Math.atan2((m0.strokes[0][Math.round(TN * 0.15) + 1][1] - top[1]), (m0.strokes[0][Math.round(TN * 0.15) + 1][0] - top[0])) + PI / 2;
      c.moveTo(px - Math.cos(ang) * half, py - Math.sin(ang) * half); c.lineTo(px + Math.cos(ang) * half, py + Math.sin(ang) * half); c.stroke();
      label(c, `PEN ${(L.pen * 1000).toFixed(0)}/1000 em`, x0 - 4, cy + s / 2 + 64, { size: 15, color: P.accentD, weight: 700, ls: 2 });
      label(c, `WORD ${(L.tot / s * 1000).toFixed(0)}/1000 em`, x1 + 4, cy + s / 2 + 64, { size: 15, align: 'right', ls: 2 });
      label(c, L.g < 0.5 ? 'MOTION' : 'ACTION', 960, cy + s / 2 + 64, { size: 15, align: 'center', color: P.ink, weight: 700, ls: 6 });
      // sliders
      const sx0 = 520, sx1 = 1400, act = sec;
      slider(c, sx0, sx1, 700, (L.wg - 100) / 800, 'wght', String(Math.round(L.wg)), { active: act === 0 || act === 3, ticks: [[0, '100'], [0.5, '500'], [0.875, '800'], [1, '900']] });
      slider(c, sx0, sx1, 780, (L.wd * 100 - 50) / 100, 'wdth', String(Math.round(L.wd * 100)), { active: act === 1 || act === 3, ticks: [[0, '50'], [0.5, '100'], [1, '150']] });
      slider(c, sx0, sx1, 860, L.g, 'glyph', L.g.toFixed(2), { active: act === 2, ticks: [[0, 'MOTION'], [1, 'ACTION']] });
      // design-space inset
      const gx = 1560, gy = 150, gw = 280, gh = 170, X = w => gx + 14 + (w - 100) / 800 * (gw - 28), Y = d => gy + gh - 12 - (d - 50) / 100 * (gh - 24);
      c.fillStyle = 'rgba(236,232,223,0.85)'; c.fillRect(gx, gy, gw, gh);
      c.strokeStyle = 'rgba(23,24,28,0.25)'; c.lineWidth = 1; c.strokeRect(gx + 0.5, gy + 0.5, gw, gh);
      dashed(c, gx, Y(100), gx + gw, Y(100), 'rgba(23,24,28,0.15)', 1, [3, 4]);
      label(c, 'DESIGN SPACE', gx, gy - 14, { size: 14, ls: 2 });
      label(c, 'wght →', gx + gw, gy + gh + 22, { size: 13, align: 'right', ls: 1 });
      label(c, 'wdth ↑', gx - 10, gy + 12, { size: 13, align: 'right', ls: 1 });
      c.strokeStyle = 'rgba(23,24,28,0.2)'; c.lineWidth = 2; c.beginPath();
      for (let i = 0; i <= 200; i++) { const tt = i / 20; i ? c.lineTo(X(tmWght(tt)), Y(tmWdth(tt))) : c.moveTo(X(tmWght(tt)), Y(tmWdth(tt))); }
      c.stroke();
      c.strokeStyle = P.accent; c.lineWidth = 2.5; c.beginPath();
      const n = Math.floor(t * 20);
      for (let i = 0; i <= n; i++) { const tt = i / 20; i ? c.lineTo(X(tmWght(tt)), Y(tmWdth(tt))) : c.moveTo(X(tmWght(tt)), Y(tmWdth(tt))); }
      c.lineTo(X(L.wg), Y(L.wd * 100)); c.stroke();
      TK.token(c, X(L.wg), Y(L.wd * 100), 22, { color: P.accent });
      TK.caption(c, t, W, H, { name: 'Type Morph', cat: 'Typography', curve: u => (tmWght(u * 10) - 100) / 800, span: [0, 10], curveLabel: 'wght / TIME' });
    },
    score(A) {
      TK.bed(A);
      // weight swell: a saw opening its filter as the pen widens
      A.osc(0.6, { type: 'sawtooth', f: midi(36), dur: 2.4, g: 0.06, a: 0.5, lp: 180, lp2: 2600, lpT: 2.2, rev: 0.3 });
      A.osc(0.6, { type: 'triangle', f: midi(48), f2: midi(55), glide: 2.2, dur: 2.4, g: 0.05, a: 0.4 });
      A.pluck(2.8, midi(67), { g: 0.16, bright: 0.6, dur: 1.2, rev: 0.3 });
      // width squeeze and stretch
      A.whoosh(3.0, 0.9, { f1: 3000, f2: 600, q: 2.5, g: 0.1, swell: 0.6, pan: -0.3 });
      A.whoosh(3.9, 1.0, { f1: 500, f2: 3800, q: 2.5, g: 0.1, swell: 0.6, pan: 0.3 });
      A.pluck(5.4, midi(64), { g: 0.14, bright: 0.5, dur: 1 });
      // glyph morphs
      [[5.5, 6.4, 60, 65], [6.95, 7.75, 65, 60]].forEach(([t0, t1, a, b], i) => {
        A.osc(t0, { type: 'triangle', f: midi(a), f2: midi(b), glide: t1 - t0, dur: t1 - t0 + 0.1, g: 0.06, a: 0.1, lp: 2400, rev: 0.4 });
        A.whoosh(t0 - 0.05, t1 - t0 + 0.1, { f1: 400, f2: 2600, q: 2, g: 0.1, swell: 0.55, rev: 0.3, pan: i ? 0.3 : -0.3 });
        A.bell(t1, midi([77, 72][i]), { g: 0.07, dur: 1.4, rev: 0.5 });
      });
      // both axes home
      A.osc(7.9, { type: 'sawtooth', f: midi(43), dur: 1.8, g: 0.05, a: 0.2, lp: 2600, lp2: 200, lpT: 1.7, rev: 0.3 });
      A.chord(9.6, [60, 64, 67], { type: 'triangle', dur: 0.4, g: 0.03, a: 0.01, lp: 2000, rev: 0.4, width: 0.6 });
    },
  });

  /* =====================================================================
     TRACKING — one value, T, added after every glyph, measured in
     thousandths of an em (T = 100 at 150 px is 15 px per gap). The word
     is laid out glyph by glyph from its kerned advances plus i·T and
     centred on its ink width minus the trailing gap, so the optical
     centre never moves. MOTION pinches to −50 (gaps go negative and the
     advance boxes overlap), then tracks out slowly to +800 on a long
     smoothstep, the classic film-title move, then snaps home. A small
     line below is centred the naive way, with the browser's trailing
     space included, and drifts left by half a gap.
     ===================================================================== */
  const TRS = 150, TRY = 420;
  const trT = t => kf(t, [[0, 0], [0.5, 0], [1.3, -50, E.ioC], [2.0, -50], [7.4, 800, E.ioS], [8.0, 800], [8.7, 0, E.outB]]);
  function trGlyphs(c, size, T) {
    c.font = `900 ${size}px ${TK.FONT}`; c.letterSpacing = '0px';
    const W0 = c.measureText(TK.WORD).width, ls = T / 1000 * size, g = [];
    for (let i = 0; i < 6; i++) {
      const a = c.measureText(TK.WORD.slice(0, i)).width, b = c.measureText(TK.WORD.slice(0, i + 1)).width;
      g.push({ ch: TK.WORD[i], pre: a + i * ls, adv: b - a });
    }
    const tot = W0 + 5 * ls;
    return { g, tot, ls };
  }

  MG.film({
    id: 'techtracking', dur: 10, poster: 5.6,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Tracking', sub: 'Uniform letter-spacing, in thousandths of an em', era: '1960s —',
      origin: 'In metal type, spacing a word out meant inserting thin spaces between the sorts by hand. Phototypesetting in the 1960s and 70s turned spacing into a dial, and tight, near-touching settings became a period look; desktop publishing then made tracking a number, which Adobe applications measure in thousandths of an em, and CSS1 (1996) added letter-spacing to the web. On screen, the slow tracking-out became a stock film-title and trailer move: the word keeps its centre while its letters drift apart.',
      works: 'Alien (Ridley Scott, 1979; title by R/Greenberg Associates, widely spaced letters assembling) · Adobe InDesign (1999; tracking and kerning in 1/1000 em) · CSS1 letter-spacing (W3C Recommendation, 1996)',
      tech: ['Tracking in 1/1000 em', 'Advance widths + i·T', 'Centre without the trailing space'],
      accent: '#ff5a1f',
      motionDNA: 'A single scalar drives everything. MOTION pinches from 0 to −50 in a bar, holds, then tracks out to +800 over five and a half seconds on a smoothstep so slow it reads as a drift, holds for a beat and snaps back to 0 with a small overshoot. Every gap grows by the same amount, so the outer letters travel five times as far as the inner gap opens.',
      visualDNA: 'The Technique Atlas stage with MOTION in Archivo 900 at 150 px, each glyph in a dashed advance box with its width in 1/1000 em, the tracking gaps tinted orange (and hatched where negative tracking makes boxes overlap), a fixed orange centre line; a big mono readout of T and pixels, a tracking slider with the Token as knob, and a naive centred line that drifts off the centre line.',
      transitions: 'One continuous value change; a snap back with overshoot',
      implementation: ['After Effects: Text Animator → Tracking Amount', 'CSS letter-spacing in em, or Figma / InDesign tracking', 'Canvas 2D: per-glyph advances + i·T, centred on the width without the trailing gap'],
      reproducibility: 'Fully procedural',
      loopable: true,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      const T = trT(t), S = TRS, L = trGlyphs(c, S, T), x0 = 960 - L.tot / 2;
      tag(c, 'TRACKING  ·  THE SAME EXTRA SPACE AFTER EVERY GLYPH', 72, 92);
      // readout
      const sign = T >= 0 ? '+' : '−';
      text(c, `${sign}${Math.abs(Math.round(T))}`, 960, 232, { font: TK.MONO, weight: 700, size: 64, color: P.ink, align: 'center' });
      label(c, `T  /1000 em   =   ${sign}${Math.abs(L.ls).toFixed(1)} px PER GAP AT ${S} px`, 960, 272, { align: 'center', size: 16 });
      // advance boxes and gaps
      const top = TRY - 92, hgt = 184;
      L.g.forEach((q, i) => {
        const gx = x0 + q.pre;
        dashRect(c, gx, top, q.adv, hgt, 'rgba(23,24,28,0.28)', 1, [3, 4]);
        label(c, String(Math.round(q.adv / S * 1000)), gx + q.adv / 2, top + hgt + 24, { align: 'center', size: 13, ls: 1 });
        if (i < 5) {
          const ex = gx + q.adv, nx = x0 + L.g[i + 1].pre;
          if (L.ls > 0.5) { c.fillStyle = 'rgba(255,90,31,0.16)'; c.fillRect(ex, top, nx - ex, hgt); c.fillStyle = P.accent; c.fillRect(ex, top - 8, nx - ex, 3); }
          else if (L.ls < -0.5) {
            c.save(); c.beginPath(); c.rect(nx, top, ex - nx, hgt); c.clip();
            c.strokeStyle = 'rgba(198,62,12,0.6)'; c.lineWidth = 1.5; c.beginPath();
            for (let k = -hgt; k < ex - nx + hgt; k += 7) { c.moveTo(nx + k, top); c.lineTo(nx + k - hgt, top + hgt); }
            c.stroke(); c.restore();
          }
        }
      });
      label(c, 'ADVANCE  /1000 em', x0, top + hgt + 50, { size: 12, ls: 2 });
      if (L.ls > 14) {
        const ex = x0 + L.g[0].pre + L.g[0].adv, nx = x0 + L.g[1].pre;
        label(c, 'T', (ex + nx) / 2, top + 24, { align: 'center', size: 16, color: P.accentD, weight: 700, ls: 0 });
      }
      // glyphs
      L.g.forEach(q => text(c, q.ch, x0 + q.pre, TRY, { font: TK.FONT, weight: 900, size: S, color: P.ink, base: 'middle' }));
      // fixed optical centre
      dashed(c, 960, 300, 960, 650, P.accent, 2, [8, 6]);
      label(c, 'CENTRE · FIXED', 972, 646, { size: 13, color: P.accentD, weight: 700, ls: 2 });
      // outer edges move ±(5T)/2
      const le = x0, re = x0 + L.tot;
      c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath();
      [le, re].forEach(x => { c.moveTo(x, top - 30); c.lineTo(x, top - 10); });
      c.moveTo(le, top - 20); c.lineTo(re, top - 20); c.stroke();
      label(c, `WIDTH = WORD + 5T = ${Math.round(L.tot / S * 1000)}`, le, top - 34, { size: 13, ls: 1, color: P.ink });
      // slider
      const v01 = (T + 100) / 1100;
      slider(c, 460, 1460, 730, v01, 'T', `${sign}${Math.abs(Math.round(T))}`, { active: true, rot: T / 800 * PI / 2, ticks: [[0, '−100'], [100 / 1100, '0'], [50 / 1100, ''], [300 / 1100, '200'], [500 / 1100, '400'], [700 / 1100, '600'], [900 / 1100, '800'], [1, '1000']] });
      // naive centred line underneath
      const ns = 60, nT = T, nls = nT / 1000 * ns, ny = 846;
      c.font = `900 ${ns}px ${TK.FONT}`; c.letterSpacing = '0px';
      const nw = c.measureText(TK.WORD).width + 5 * nls, nL = 960 - (nw + nls) / 2;
      text(c, TK.WORD, 960, ny, { font: TK.FONT, weight: 900, size: ns, color: P.mute, align: 'center', base: 'middle', ls: nls });
      c.fillStyle = P.accent; c.fillRect(959, ny - 44, 2, 30);
      c.fillStyle = P.ink; c.fillRect(nL + nw / 2 - 1, ny - 34, 2, 14);
      if (nls > 4) { c.fillStyle = P.accentD; c.fillRect(nL + nw / 2, ny - 41, 960 - (nL + nw / 2), 3); }
      c.strokeStyle = P.ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(nL, ny - 27); c.lineTo(nL + nw, ny - 27); c.stroke();
      label(c, `NAIVE: CENTRED WITH THE TRAILING GAP  ·  OFF BY ${Math.abs(nls / 2).toFixed(1)} px`, 960, ny + 48, { align: 'center', size: 13, ls: 2 });
      TK.caption(c, t, W, H, { name: 'Tracking', cat: 'Typography', curve: u => (trT(u * 10) + 50) / 850, span: [0, 10], curveLabel: 'TRACKING / TIME' });
    },
    score(A) {
      TK.bed(A);
      // pinch
      A.noise(0.5, { type: 'bandpass', f: 2600, f2: 900, q: 3, dur: 0.8, g: 0.06, swell: 0.7 });
      A.pluck(1.3, midi(55), { g: 0.14, bright: 0.4, dur: 0.6 });
      // slow tracking-out: a held fifth opening up, plus a tick each time T crosses a hundred
      A.osc(2.0, { type: 'triangle', f: midi(48), dur: 5.6, g: 0.04, a: 3, lp: 900, rev: 0.5, hold: true });
      A.osc(2.0, { type: 'sawtooth', f: midi(55), dur: 5.6, g: 0.025, a: 4, lp: 300, lp2: 3000, lpT: 5.4, rev: 0.5, hold: true, detune: 6 });
      A.noise(2.0, { type: 'bandpass', f: 500, f2: 5000, sweep: 5.4, q: 3, dur: 5.6, g: 0.05, swell: 0.95, rev: 0.4 });
      let prev = Math.floor(trT(2.0) / 100);
      for (let i = 0; i <= 540; i++) {
        const tt = 2.0 + i / 100, k = Math.floor(trT(tt) / 100);
        if (k > prev) { A.osc(tt, { f: midi(72 + Math.min(k, 8) * 2), dur: 0.08, g: 0.05, pan: (k / 8 - 0.5) * 1.2, rev: 0.3 }); prev = k; }
      }
      A.bell(7.4, midi(84), { g: 0.06, dur: 1.6, rev: 0.5 });
      // snap back
      A.whoosh(7.95, 0.7, { f1: 5000, f2: 400, q: 2, g: 0.13, swell: 0.6 });
      A.kick(8.5, 0.36, { f: 140, f2: 45 });
      A.clap(8.5, 0.14);
      A.chord(8.5, [60, 67, 72], { type: 'triangle', dur: 1.4, g: 0.035, a: 0.02, lp: 2400, rev: 0.5, width: 0.7 });
    },
  });

  /* =====================================================================
     TEXT REVEAL — four panels, four reveals of the same two lines, one
     after another, each labelled with its mechanism and with its mask
     drawn: (1) masked slide-up — each line rises inside its own clip
     rectangle, the part still below the mask ghosted; (2) typewriter —
     one glyph per step at 12 per second, the clip edge and a block cursor
     stepping with it; (3) blur + tracking-in — no mask, opacity, blur
     radius and tracking all ease together; (4) scramble — every slot
     shows a seeded random glyph that changes 20 times a second until its
     lock time, slots locking left to right. The Token in each panel is
     revealed by the same technique.
     ===================================================================== */
  const RL1 = 'MOTION', RL2 = 'FOUR WAYS IN', RS1 = 112, RS2 = 40;
  const RP = [
    { x: 72, y: 66, w: 868, h: 390, t0: 0.3, t1: 2.2, name: '01  MASKED SLIDE-UP', ease: E.outQt },
    { x: 980, y: 66, w: 868, h: 390, t0: 2.4, t1: 4.4, name: '02  TYPEWRITER', ease: u => Math.floor(u * 18) / 18 },
    { x: 72, y: 486, w: 868, h: 390, t0: 4.5, t1: 6.4, name: '03  BLUR + TRACKING-IN', ease: E.outC },
    { x: 980, y: 486, w: 868, h: 390, t0: 6.5, t1: 8.6, name: '04  SCRAMBLE / DECODE', ease: u => Math.floor(clamp(u / 0.8) * 18) / 18 },
  ];
  const RGLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*?';
  const RTW = 12;                  // typewriter: glyphs per second
  const RSC = 20;                  // scramble: steps per second
  function rFonts(c, which) { c.font = which === 1 ? `900 ${RS1}px ${TK.FONT}` : `800 ${RS2}px ${TK.FONT}`; c.letterSpacing = '0px'; }
  function rSlots(c, s, which) {   // left edge and width of every glyph in the line
    rFonts(c, which); const out = [];
    for (let i = 0; i < s.length; i++) { const a = c.measureText(s.slice(0, i)).width, b = c.measureText(s.slice(0, i + 1)).width; out.push([a, b - a]); }
    return { slots: out, w: c.measureText(s).width };
  }
  const line = (c, s, x, y, which, o = {}) => text(c, s, x, y, { font: TK.FONT, weight: which === 1 ? 900 : 800, size: which === 1 ? RS1 : RS2, color: o.color || P.ink, base: 'middle', ls: o.ls || 0, align: o.align });
  function rPanelFrame(c, p, t, i) {
    const act = t >= p.t0 - 0.1 && t < p.t1 + 0.2;
    c.fillStyle = 'rgba(236,232,223,0.6)'; c.fillRect(p.x, p.y, p.w, p.h);
    c.strokeStyle = act ? P.accent : 'rgba(23,24,28,0.18)'; c.lineWidth = act ? 3 : 1.5; c.strokeRect(p.x, p.y, p.w, p.h);
    label(c, p.name, p.x + 26, p.y + 40, { size: 18, color: act || t > p.t1 ? P.ink : P.mute, weight: 700, ls: 2 });
    const u = seg(t, p.t0, p.t1);
    c.fillStyle = 'rgba(23,24,28,0.12)'; c.fillRect(p.x + p.w - 186, p.y + 32, 160, 3);
    c.fillStyle = P.accent; c.fillRect(p.x + p.w - 186, p.y + 32, 160 * u, 3);
    return u;
  }

  MG.film({
    id: 'techtextreveal', dur: 10, poster: 7.35,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Text Reveal', sub: 'Four ways to bring a line on screen', era: '1950s —',
      origin: 'Title designers of the 1950s and 60s, Saul Bass first among them, made the way words arrive part of the film, revealing type with travelling mattes, sliding bars and wipes on the animation stand and optical printer. The typewriter reveal borrows from teleprinters and computer terminals; blur- and tracking-in became trailer staples once desktop compositors such as After Effects (1993) brought per-character text animation; and the scramble or decode reveal — random characters cycling until each locks — became screen shorthand for computers cracking a code.',
      works: 'Psycho (Alfred Hitchcock, 1960; titles by Saul Bass, type sliced and slid by bars) · All the President’s Men (Alan J. Pakula, 1976; typewriter keys strike the opening) · WarGames (John Badham, 1983; launch-code characters cycle and lock one by one)',
      tech: ['Clip-rect line masks', 'Stepped glyph count + cursor', 'Seeded scramble with staggered lock'],
      accent: '#ff5a1f',
      motionDNA: 'Four reveals in sequence, about two seconds each, and every revealed panel holds. The slide-up rises on a hard ease-out, the second line a beat-fraction behind; the typewriter steps at twelve glyphs a second and the cursor blinks on the half-beat once it stops; the blur-in closes tracking, blur and opacity together on one ease-out; the scramble flickers at twenty steps a second and locks left to right with a little seeded jitter.',
      visualDNA: 'The Technique Atlas stage split into four panels with numbered mono headers and progress bars, MOTION in Archivo 900 over a second line in Archivo 800, the Token beside each; dashed orange mask rectangles with the clipped-off part ghosted, a stepping clip edge and block cursor, live blur and tracking readouts, and orange unlocked glyphs turning ink as they lock.',
      transitions: 'Masked slide, stepped typewriter, blur-and-track focus-in, decode scramble',
      implementation: ['After Effects text animators: Range Selector with Position, Blur, Tracking and Character Offset', 'CSS/JS: overflow-hidden line wrappers, steps() timing, seeded scramble scripts', 'Canvas 2D: clip rects, ctx.filter blur, per-slot hashed glyphs keyed to a step count'],
      reproducibility: 'Fully procedural (scramble seeded)',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      const S1 = rSlots(c, RL1, 1), S2 = rSlots(c, RL2, 2);
      RP.forEach((p, i) => {
        const u = rPanelFrame(c, p, t, i), tx = p.x + 64, y1 = p.y + 170, y2 = p.y + 270, kx = p.x + p.w - 130, ky = p.y + 200, ks = 120;
        const loc = t - p.t0;
        c.save(); c.beginPath(); c.rect(p.x + 2, p.y + 2, p.w - 4, p.h - 4); c.clip();
        if (i === 0) {
          // masked slide-up: per-line clip rects
          const rows = [[RL1, 1, y1, 68, S1.w, 0], [RL2, 2, y2, 30, S2.w, 0.18]];
          rows.forEach(([s, which, y, hh, w, d]) => {
            const v = E.outQt(seg(loc, d, d + 1.1)), dy = (1 - v) * hh * 2.1;
            dashRect(c, tx - 10, y - hh, w + 20, hh * 2, t < p.t1 + 0.3 ? P.accent : 'rgba(255,90,31,0.45)', 1.5, [6, 5]);
            if (v < 1) { c.save(); c.globalAlpha = 0.12; line(c, s, tx, y + dy, which); c.restore(); }
            c.save(); c.beginPath(); c.rect(tx - 10, y - hh, w + 20, hh * 2); c.clip(); line(c, s, tx, y + dy, which); c.restore();
          });
          label(c, 'MASK', tx - 10, y1 - 68 - 10, { size: 13, color: P.accentD, weight: 700, ls: 2 });
          const v = E.outQt(seg(loc, 0.3, 1.4));
          dashRect(c, kx - ks / 2 - 10, ky - ks / 2 - 10, ks + 20, ks + 20, 'rgba(255,90,31,0.45)', 1.5, [6, 5]);
          c.save(); c.beginPath(); c.rect(kx - ks / 2 - 10, ky - ks / 2 - 10, ks + 20, ks + 20); c.clip();
          TK.token(c, kx, ky + (1 - v) * (ks + 20), ks); c.restore();
          label(c, `LINE 1 y + ${Math.round((1 - E.outQt(seg(loc, 0, 1.1))) * 160)} px   ·   LINE 2 DELAY 0.18 s`, p.x + 26, p.y + p.h - 26, { size: 14, ls: 1 });
        } else if (i === 1) {
          // typewriter: n glyphs typed, cursor + clip edge
          const tot = RL1.length + RL2.length, n = clamp(Math.floor(Math.max(0, loc) * RTW), 0, tot);
          const n1 = Math.min(n, RL1.length), n2 = Math.max(0, n - RL1.length);
          if (n1) line(c, RL1.slice(0, n1), tx, y1, 1);
          if (n2) line(c, RL2.slice(0, n2), tx, y2, 2);
          const onL2 = n >= RL1.length && loc > 0;
          const cx = onL2 ? tx + (n2 ? S2.slots[n2 - 1][0] + S2.slots[n2 - 1][1] : 0) : tx + (n1 ? S1.slots[n1 - 1][0] + S1.slots[n1 - 1][1] : 0);
          const cy = onL2 ? y2 : y1, ch = onL2 ? 44 : 112, done = n >= tot;
          const blink = !done || Math.floor((t - p.t0 - tot / RTW) / (TK.BEAT / 2)) % 2 === 0;
          if (t > p.t0 - 0.1 && blink) { c.fillStyle = P.accent; c.fillRect(cx + 6, cy - ch / 2, onL2 ? 22 : 54, ch); }
          if (t > p.t0 - 0.1) {
            dashed(c, cx + 3, cy - ch / 2 - 18, cx + 3, cy + ch / 2 + 18, P.accentD, 1.5, [5, 5]);
            label(c, 'CLIP EDGE', cx + 3, cy - ch / 2 - 26, { size: 12, color: P.accentD, align: 'center', weight: 700, ls: 2 });
          }
          if (done) { const v = E.outB(seg(t, p.t0 + tot / RTW, p.t0 + tot / RTW + 0.4)); TK.token(c, kx, ky, ks * v); }
          label(c, `STEP 1 GLYPH / ${Math.round(1000 / RTW)} ms   ·   ${n} / ${tot} TYPED`, p.x + 26, p.y + p.h - 26, { size: 14, ls: 1 });
        } else if (i === 2) {
          // blur + tracking-in, no mask
          const v = E.outC(seg(loc, 0, 1.6)), a = seg(loc, 0, 0.7);
          const b = lerp(16, 0, v), ls1 = lerp(30, 0, v), ls2 = lerp(22, 0, v);
          if (a > 0) {
            c.save(); c.globalAlpha = a; if (b > 0.2) c.filter = `blur(${b.toFixed(1)}px)`;
            line(c, RL1, tx + S1.w / 2 + ls1 / 2, y1, 1, { ls: ls1, align: 'center' });
            line(c, RL2, tx + S2.w / 2 + ls2 / 2, y2, 2, { ls: ls2, align: 'center' });
            TK.token(c, kx, ky, ks * lerp(1.25, 1, v), { rot: lerp(-0.4, 0, v) });
            c.restore();
          }
          const wnow = S1.w + 5 * ls1;
          if (t >= p.t0 - 0.1) {
          c.strokeStyle = P.accentD; c.lineWidth = 1.5; c.beginPath();
          const l = tx + S1.w / 2 - wnow / 2, r = tx + S1.w / 2 + wnow / 2;
          c.moveTo(l, p.y + 86); c.lineTo(r, p.y + 86); c.moveTo(l, p.y + 80); c.lineTo(l, p.y + 92); c.moveTo(r, p.y + 80); c.lineTo(r, p.y + 92); c.stroke();
          label(c, 'NO MASK  ·  INK WIDTH', tx, p.y + 76, { size: 12, color: P.accentD, weight: 700, ls: 2 });
          }
          label(c, `OPACITY ${a.toFixed(2)}   ·   BLUR ${b.toFixed(1)} px   ·   TRACKING +${Math.round(ls1 / RS1 * 1000)}`, p.x + 26, p.y + p.h - 26, { size: 14, ls: 1 });
        } else {
          // scramble / decode
          const step = Math.floor(t * RSC), all = [];
          S1.slots.forEach((s, k) => all.push({ ch: RL1[k], x: tx + s[0], w: s[1], y: y1, which: 1, k }));
          S2.slots.forEach((s, k) => all.push({ ch: RL2[k], x: tx + s[0], w: s[1], y: y2, which: 2, k: k + RL1.length }));
          let locked = 0, count = 0;
          all.forEach(g => {
            if (g.ch === ' ') return;
            count++;
            const on = p.t0 + g.k * 0.025, lock = p.t0 + 0.35 + g.k * 0.075 + hash(g.k * 3.7 + 7) * 0.12;
            const box = g.which === 1 ? 62 : 26;
            c.strokeStyle = 'rgba(23,24,28,0.14)'; c.lineWidth = 1; c.strokeRect(g.x + 0.5, g.y - box + 0.5, g.w - 1, box * 2);
            if (t < on) return;
            if (t >= lock) { locked++; line(c, g.ch, g.x, g.y, g.which); }
            else {
              const r = RGLYPHS[Math.floor(hash(g.k * 31.7 + step * 7.31 + 7) * RGLYPHS.length)];
              rFonts(c, g.which);
              const sx = Math.min(1, (g.w - 4) / c.measureText(r).width);   // squeeze a wide random glyph into its slot
              c.save(); c.translate(g.x + g.w / 2, g.y); c.scale(sx, 1);
              line(c, r, 0, 0, g.which, { color: P.accent, align: 'center' }); c.restore();
            }
            c.fillStyle = t >= lock ? P.ink : P.accent; c.fillRect(g.x + 3, g.y + box + 6, g.w - 6, 3);
          });
          // Token: rotation scrambles in quarter-ish steps, then locks upright
          const tl = p.t0 + 1.45;
          if (t >= p.t0) {
            const rot = t < tl ? Math.floor(hash(step * 5.1 + 3) * 8) * PI / 4 : 0;
            TK.token(c, kx, ky, ks, { rot, color: t < tl ? P.accentL : P.accent });
          }
          label(c, `SEED 7   ·   ${RSC} STEPS / s   ·   LOCKED ${locked} / ${count}`, p.x + 26, p.y + p.h - 26, { size: 14, ls: 1 });
        }
        c.restore();
      });
      // caption: the active panel's progress curve
      let k = 0; RP.forEach((p, i) => { if (t >= p.t0 - 0.1) k = i; });
      TK.caption(c, t, W, H, { name: 'Text Reveal', cat: 'Typography', curve: RP[k].ease, span: [RP[k].t0, RP[k].t1], curveLabel: 'REVEAL / TIME' });
    },
    score(A) {
      TK.bed(A);
      const p = RP;
      // 1 slide-up: two rising swishes and a pluck on settle
      A.whoosh(p[0].t0, 0.5, { f1: 400, f2: 3600, q: 1.6, g: 0.12, swell: 0.4, pan: -0.3 });
      A.whoosh(p[0].t0 + 0.18, 0.5, { f1: 600, f2: 4200, q: 1.6, g: 0.09, swell: 0.4, pan: 0.3 });
      A.pluck(p[0].t0 + 0.6, midi(67), { g: 0.14, bright: 0.6, dur: 1 });
      A.pluck(p[0].t0 + 0.8, midi(72), { g: 0.1, bright: 0.6, dur: 1 });
      // 2 typewriter: a key per glyph, carriage bell at the end
      const tot = RL1.length + RL2.length;
      for (let k = 0; k < tot; k++) {
        const tt = p[1].t0 + k / RTW, sp = (RL1 + RL2)[k] === ' ';
        A.noise(tt, { type: 'bandpass', f: sp ? 900 : 2600 + hash(k) * 900, q: 2, dur: 0.035, g: sp ? 0.08 : 0.12, pan: (k / tot - 0.5) * 0.8 });
        A.osc(tt, { type: 'triangle', f: 180, f2: 90, dur: 0.05, g: 0.06 });
      }
      A.bell(p[1].t0 + tot / RTW, midi(88), { g: 0.06, dur: 1.2, rev: 0.4 });
      // 3 blur-in: a reversed-feeling swell that resolves into a chord
      A.noise(p[2].t0, { type: 'lowpass', f: 300, f2: 6000, sweep: 1.4, dur: 1.6, g: 0.07, swell: 0.85, rev: 0.6 });
      A.chord(p[2].t0 + 0.2, [64, 67, 71], { type: 'sine', dur: 2, g: 0.03, a: 1.2, rev: 0.6, width: 0.8 });
      // 4 scramble: data blips each step, a tick per lock, a bell when decoded
      for (let s = Math.floor(p[3].t0 * RSC); s < Math.floor((p[3].t0 + 1.7) * RSC); s++) A.osc(s / RSC, { type: 'square', f: 900 + Math.floor(hash(s * 7.31) * 8) * 180, dur: 0.03, g: 0.012, lp: 3000, pan: (hash(s) - 0.5) * 0.8 });
      let k = 0;
      for (const ch of RL1 + RL2) {
        if (ch !== ' ') A.osc(p[3].t0 + 0.35 + k * 0.075 + hash(k * 3.7 + 7) * 0.12, { f: midi(84 + (k % 5) * 2), dur: 0.06, g: 0.035, rev: 0.2 });
        k++;
      }
      A.bell(p[3].t0 + 1.9, midi(79), { g: 0.07, dur: 1.6, rev: 0.5 });
      A.chord(8.6, [60, 64, 67, 72], { type: 'triangle', dur: 1.4, g: 0.035, a: 0.05, lp: 2400, rev: 0.6, width: 0.8 });
    },
  });
})();
