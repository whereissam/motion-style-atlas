/* batch k10 — Technique Atlas · Compositing, Temporal: techrotoscope · techdoubleexposure · techtimeremap.
   techrotoscope (a shaded, grainy 24 fps reference plate of the Token tumbling; a roto spline
   re-keyed every frame, then ink drawings traced over it on twos on a light table with onion
   skins and line boil, until the plate fades and only the painted drawings remain) ·
   techdoubleexposure (two exposures, one frame: the same pair combined with ADD, SCREEN and
   MULTIPLY, then the silhouette variant, where a dark Token shot against white takes the
   second exposure; live pixel probes read E1, E2 and OUT) ·
   techtimeremap (one fixed source clip of the Token hopping, played through a remap curve:
   normal speed, a ramp into slow motion, a freeze, reverse, a ramp up to 250% and back). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, midi, text, rrect } = MG;
  const TK = MG.TK, P = TK.P, PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const label = (c, s, x, y, o = {}) => text(c, s, x, y, { font: TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
  const tag = (c, s, x, y, on = 1) => {   // small accent dot + mono label, top-left of frame
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: P.ink, weight: 700, size: 20 });
    c.restore();
  };
  const pad = (n, k) => String(Math.max(0, n)).padStart(k, '0');
  // the Token's outline (side 1) as a closed polygon, starting top centre, clockwise
  function tokenPoly(n) {
    const r = TK.CORNER, h = 0.5, pts = [];
    const corners = [[h - r, -h + r, -PI / 2], [h - r, h - r, 0], [-h + r, h - r, PI / 2], [-h + r, -h + r, PI]];
    const raw = [[0, -h]];
    corners.forEach(([cx, cy, a0]) => { for (let i = 0; i <= 12; i++) { const a = a0 + i / 12 * PI / 2; raw.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } });
    raw.push([0, -h]);
    const L = [0];
    for (let i = 1; i < raw.length; i++) L.push(L[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
    let j = 1;
    for (let k = 0; k < n; k++) {
      const d = k / n * L[L.length - 1];
      while (j < L.length - 1 && L[j] < d) j++;
      const u = (d - L[j - 1]) / ((L[j] - L[j - 1]) || 1);
      pts.push([lerp(raw[j - 1][0], raw[j][0], u), lerp(raw[j - 1][1], raw[j][1], u)]);
    }
    return pts;
  }

  /* =====================================================================
     ROTOSCOPE — a reference plate (the Token shot as "footage": shaded,
     motion-blurred, grainy, stepping at 24 fps with a burned-in frame
     number) plays under a sheet of animation paper. First a roto spline,
     eight Bezier vertices plus four on the hole, is re-keyed on every plate
     frame. Then the light table comes on: ink drawings are traced over the
     plate on twos (one drawing per two plate frames), each redrawn by hand
     so the line boils, with onion skins of the drawings either side. The
     plate fades out, the drawings get painted, and only the traced
     animation is left.
     ===================================================================== */
  const RP = { x: 330, y: 150, w: 1260, h: 590 }, RFL = RP.y + RP.h - 70, RS = 180, PAPER = '#f6f3ec';
  function rPose(tt) {
    const ph = tt % 1, hop = 4 * ph * (1 - ph);
    return { x: 960 + 400 * Math.sin(TAU * tt / 10), y: RFL - RS * 0.64 - 240 * hop, rot: tt * 2.2 + 0.3, sx: 1, lift: 240 * hop };
  }
  const rXf = (p, q, s) => { const cs = Math.cos(q.rot), sn = Math.sin(q.rot), x = p[0] * s, y = p[1] * s; return [q.x + (x * cs - y * sn) * q.sx, q.y + x * sn + y * cs]; };
  const rPlateA = t => 1 - E.ioS(seg(t, 6.0, 7.0));
  const rVeil = t => 0.4 * seg(t, 2.8, 3.3);
  function rTokenShaded(c, q, a) {
    c.save(); c.translate(q.x, q.y); c.scale(q.sx, 1); c.rotate(q.rot); TK.tokenPath(c, RS); c.restore();
    const g = c.createLinearGradient(q.x - RS * 0.6, q.y - RS * 0.6, q.x + RS * 0.6, q.y + RS * 0.6);
    g.addColorStop(0, '#f39a66'); g.addColorStop(0.5, '#d4602a'); g.addColorStop(1, '#7c3112');
    c.save(); c.globalAlpha *= a; c.fillStyle = g; c.fill('evenodd');
    c.lineWidth = 2; c.strokeStyle = 'rgba(255,214,180,0.35)'; c.stroke(); c.restore();
  }
  function rPlate(c, W, H, tt, fr, pa) {
    const { x, y, w, h } = RP, q = rPose(tt);
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    let g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#34312e'); g.addColorStop(0.86, '#77706a'); g.addColorStop(0.88, '#6d665e'); g.addColorStop(1, '#4b4640');
    c.fillStyle = g; c.fillRect(x, y, w, h);
    g = c.createRadialGradient(q.x, q.y - 40, 20, q.x, q.y - 40, 560);
    g.addColorStop(0, 'rgba(255,236,214,0.22)'); g.addColorStop(1, 'rgba(255,236,214,0)');
    c.fillStyle = g; c.fillRect(x, y, w, h);
    // contact shadow, soft
    c.save(); c.translate(q.x, RFL + 2); c.scale(1, 0.13);
    const sr = RS * (0.85 - q.lift / 900);
    g = c.createRadialGradient(0, 0, 0, 0, 0, sr);
    g.addColorStop(0, `rgba(10,8,6,${0.6 * (1 - q.lift / 400)})`); g.addColorStop(1, 'rgba(10,8,6,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, sr, 0, TAU); c.fill(); c.restore();
    // shutter motion blur: two trailing sub-frame copies, then the frame
    rTokenShaded(c, rPose(tt - 1 / 40), 0.16);
    rTokenShaded(c, rPose(tt - 1 / 80), 0.28);
    rTokenShaded(c, q, 1);
    g = c.createRadialGradient(960, y + h / 2, h * 0.35, 960, y + h / 2, w * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
    c.fillStyle = g; c.fillRect(x, y, w, h);
    MG.grain(c, W, H, tt, 0.14 * pa);
    label(c, `REF PLATE  ·  FR ${pad(fr, 4)}  ·  24 FPS`, x + 22, y + h - 22, { size: 15, ls: 2, color: 'rgba(255,255,255,0.75)' });
    c.restore();
  }
  // one hand-traced drawing k (on twos: pose of plate frame 2k), boiled by its own seed
  function rInk(c, st, k, o = {}) {
    const q = rPose(k / 12), sd = hash(k * 1.37 + (o.seed || 0)) * TAU, sd2 = hash(k * 2.91 + 4 + (o.seed || 0)) * TAU;
    const boil = (i, n) => 1.1 * Math.sin(i / n * TAU * 5 + sd) + 0.9 * Math.sin(i / n * TAU * 13 + sd2);
    const ring = (poly, s) => poly.map((p, i) => {
      const v = rXf(p, q, s), dx = v[0] - q.x, dy = v[1] - q.y, L = Math.hypot(dx, dy) || 1, j = boil(i, poly.length);
      return [v[0] + dx / L * j, v[1] + dy / L * j];
    });
    const out = ring(st.out, RS), hole = ring(st.hole, RS).map(p => p);
    const n = o.frac === undefined ? out.length : Math.floor(out.length * o.frac);
    c.save(); c.globalAlpha *= o.alpha ?? 1; c.lineJoin = 'round'; c.lineCap = 'round';
    if (o.fill) {
      c.beginPath(); out.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      hole.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      c.globalAlpha *= o.fill; c.fillStyle = P.accent; c.fill('evenodd'); c.globalAlpha /= o.fill;
    }
    c.strokeStyle = o.color || P.ink; c.lineWidth = o.lw || 4.5;
    c.beginPath();
    for (let i = 0; i <= n && i <= out.length; i++) { const p = out[i % out.length]; i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
    if (n >= out.length) { c.moveTo(hole[0][0], hole[0][1]); hole.forEach(p => c.lineTo(p[0], p[1])); c.closePath(); }
    c.stroke();
    if (!o.ghost && n >= out.length) {   // a second, lighter pencil pass
      c.globalAlpha *= 0.35; c.lineWidth = 1.6; c.beginPath();
      out.forEach((p, i) => { const a = i / out.length * TAU * 5 + sd2; const px = p[0] + Math.cos(a) * 2.2, py = p[1] + Math.sin(a) * 2.2; i ? c.lineTo(px, py) : c.moveTo(px, py); });
      c.closePath(); c.stroke();
    }
    c.restore();
  }
  function rSpline(c, q, a) {
    const r = TK.CORNER, h = 0.5, d = Math.SQRT1_2, cc = h - r;
    const vs = [
      [[0, -h], [1, 0], 0.15], [[cc + r * d, -cc - r * d], [d, d], 0.09], [[h, 0], [0, 1], 0.15], [[cc + r * d, cc + r * d], [-d, d], 0.09],
      [[0, h], [-1, 0], 0.15], [[-cc - r * d, cc + r * d], [-d, -d], 0.09], [[-h, 0], [0, -1], 0.15], [[-cc - r * d, -cc - r * d], [d, -d], 0.09],
    ];
    const H0 = TK.HOLE;
    [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([ux, uy]) => vs.push([[H0.x + ux * H0.r, H0.y + uy * H0.r], [-uy, ux], H0.r * 0.55]));
    c.save(); c.globalAlpha *= a;
    // the spline itself
    c.save(); c.translate(q.x, q.y); c.scale(q.sx, 1); c.rotate(q.rot); TK.tokenPath(c, RS); c.restore();
    c.strokeStyle = P.accentL; c.lineWidth = 2.5; c.stroke();
    vs.forEach(([p, tg, L]) => {
      const v = rXf(p, q, RS), h1 = rXf([p[0] + tg[0] * L, p[1] + tg[1] * L], q, RS), h2 = rXf([p[0] - tg[0] * L, p[1] - tg[1] * L], q, RS);
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(h1[0], h1[1]); c.lineTo(h2[0], h2[1]); c.stroke();
      c.fillStyle = '#fff'; [h1, h2].forEach(hp => { c.beginPath(); c.arc(hp[0], hp[1], 3.2, 0, TAU); c.fill(); });
      c.fillStyle = P.ink; c.fillRect(v[0] - 5.5, v[1] - 5.5, 11, 11);
      c.fillStyle = P.accent; c.fillRect(v[0] - 3.5, v[1] - 3.5, 7, 7);
    });
    c.restore();
  }

  MG.film({
    id: 'techrotoscope', dur: 10, poster: 4.6,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Rotoscope', sub: 'Tracing over footage, frame by frame', era: '1915 —',
      origin: 'Max Fleischer patented the rotoscope (filed 1915, granted 1917): a projector threw live-action film one frame at a time onto a glass drawing surface so an animator could trace it, and his brother Dave, filmed in a clown suit, became Koko in the Out of the Inkwell series. Disney traced live reference for Snow White (1937), Ralph Bakshi built whole features on it in the 1970s, and digital roto — Bezier splines keyed frame by frame — became the everyday way to cut mattes in compositing.',
      works: 'Out of the Inkwell (Max and Dave Fleischer, 1918–1929) · The Lord of the Rings (Ralph Bakshi, 1978) · A Scanner Darkly (Richard Linklater, 2006)',
      tech: ['Reference plate under the paper', 'Traced on twos with line boil', 'Roto spline keyed per frame'],
      accent: '#ff5a1f',
      motionDNA: 'All motion comes from the plate: a tumbling hop that lands once a second, sampled at 24 fps. The roto spline snaps to it on every plate frame; the ink drawings snap on every second frame, so the traced animation steps at 12 drawings a second, with the outline trembling as each drawing is redrawn. The motion stays the same while its source fades away.',
      visualDNA: 'The Technique Atlas stage with a sheet of animation paper and a peg bar; under it a dim, grainy, vignetted plate with a shaded, motion-blurred Token and a burned-in frame counter. Orange spline with white Bezier handles; ink outlines with a lighter pencil pass, orange and blue onion skins, a drawing number in the corner; a 24-cell frame strip marking the plate frames and the drawings on twos.',
      transitions: 'Plate to light table (a paper veil), plate fade-out, ink-and-paint fill',
      implementation: ['Fleischer rotoscope: projector under a glass drawing table', 'Digital roto: Bezier spline mattes (Silhouette, Nuke, After Effects Roto)', 'Canvas 2D: a 24 fps plate under 12 fps traced outlines with per-drawing boil'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { out: tokenPoly(96), hole: Array.from({ length: 40 }, (_, i) => [TK.HOLE.x + Math.cos(i / 40 * TAU) * TK.HOLE.r, TK.HOLE.y + Math.sin(i / 40 * TAU) * TK.HOLE.r]) }; },
    draw(c, t, W, H, st) {
      TK.stage(c, W, H);
      const fr = Math.floor(t * 24 + 1e-6), tt = fr / 24, k = Math.floor(t * 12 + 1e-6);
      const pa = rPlateA(t), veil = rVeil(t), inkOn = t >= 2.9;
      // animation paper
      c.fillStyle = 'rgba(23,24,28,0.07)'; c.fillRect(RP.x + 8, RP.y + 10, RP.w, RP.h);
      c.fillStyle = PAPER; c.fillRect(RP.x, RP.y, RP.w, RP.h);
      // the plate, under the paper
      if (pa > 0.003) {
        c.save(); c.globalAlpha = pa; rPlate(c, W, H, tt, fr, pa);
        c.globalAlpha = pa * veil; c.fillStyle = PAPER; c.fillRect(RP.x, RP.y, RP.w, RP.h);
        c.restore();
      }
      // roto spline on the plate frame
      const rs = seg(t, 0.9, 1.3) * (1 - seg(t, 2.9, 3.4));
      if (rs > 0.01) rSpline(c, rPose(tt), rs);
      // onion skins, then the current drawing
      const os = seg(t, 3.4, 3.8) * (1 - seg(t, 6.3, 6.8));
      if (os > 0.01) {
        rInk(c, st, k - 2, { color: P.accent, alpha: 0.28 * os, lw: 3, ghost: true });
        rInk(c, st, k - 1, { color: P.accent, alpha: 0.55 * os, lw: 3, ghost: true });
        rInk(c, st, k + 1, { color: P.blue, alpha: 0.45 * os, lw: 3, ghost: true });
      }
      if (inkOn) rInk(c, st, k, { frac: seg(t, 2.9, 3.4), fill: seg(t, 6.8, 7.2) });
      // peg bar and the drawing number
      c.fillStyle = '#a19b90'; rrect(c, 960 - 170, RP.y - 15, 340, 28, 7); c.fill();
      c.fillStyle = P.ground;
      c.beginPath(); c.arc(960, RP.y - 1, 8, 0, TAU); c.fill();
      [-110, 110].forEach(dx => { rrect(c, 960 + dx - 18, RP.y - 8, 36, 14, 7); c.fill(); });
      if (inkOn) {
        const nx = RP.x + RP.w - 46, ny = RP.y + 40;
        c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.arc(nx, ny - 7, 24, 0, TAU); c.stroke();
        label(c, String(k), nx, ny, { align: 'center', size: 20, ls: 0, color: P.ink, weight: 700 });
      }
      c.strokeStyle = 'rgba(23,24,28,0.3)'; c.lineWidth = 1; c.strokeRect(RP.x + 0.5, RP.y + 0.5, RP.w, RP.h);
      // frame strip: one second of plate frames, drawings on twos
      const sec = Math.floor(fr / 24), x0 = 1200, cw = 27;
      label(c, 'PLATE  24 FPS', x0 - 16, 74, { align: 'right', size: 14, ls: 2 });
      for (let i = 0; i < 24; i++) {
        const f = sec * 24 + i;
        c.fillStyle = f === fr ? P.ink : f < fr ? 'rgba(23,24,28,0.3)' : 'rgba(23,24,28,0.1)';
        c.fillRect(x0 + i * cw, 60, cw - 4, 16);
      }
      const dOn = seg(t, 2.9, 3.3);
      if (dOn > 0) {
        c.save(); c.globalAlpha = dOn;
        label(c, 'DRAWN ON TWOS', x0 - 16, 104, { align: 'right', size: 14, ls: 2, color: P.ink });
        for (let i = 0; i < 24; i += 2) {
          const d = (sec * 24 + i) / 2, x = x0 + i * cw;
          c.fillStyle = d === k ? P.accent : d < k ? 'rgba(255,90,31,0.45)' : 'rgba(23,24,28,0.1)';
          c.fillRect(x, 90, cw * 2 - 4, 16);
          if (d === k) { c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(x - 1, 89, cw * 2 - 2, 18); }
        }
        c.restore();
      }
      // phase tags
      const PH = [
        [0, 'REFERENCE PLATE', 'LIVE-ACTION FOOTAGE  ·  24 FRAMES A SECOND'],
        [0.9, 'ROTO SPLINE TRACKS THE PLATE', '8 BEZIER VERTICES + 4 ON THE HOLE  ·  RE-KEYED EVERY FRAME'],
        [2.9, 'LIGHT TABLE  ·  TRACED ON TWOS', 'EACH DRAWING REDRAWN BY HAND  ·  THE LINE BOILS'],
        [3.8, 'LIGHT TABLE  ·  ONION SKIN', 'PREVIOUS DRAWINGS IN ORANGE  ·  NEXT IN BLUE'],
        [6.0, 'PLATE OFF', 'THE REFERENCE FADES  ·  THE DRAWINGS KEEP ITS MOTION'],
        [6.8, 'INK & PAINT', 'TRACED ANIMATION ONLY  ·  12 DRAWINGS A SECOND'],
      ];
      let pi = 0; PH.forEach((p, i) => { if (t >= p[0]) pi = i; });
      const pOn = Math.min(seg(t, PH[pi][0], PH[pi][0] + 0.25), pi ? 1 : seg(t, 0.1, 0.4));
      tag(c, `${[1, 2, 3, 3, 4, 5][pi]}  ·  ${PH[pi][1]}`, 72, 80, pOn);
      c.save(); c.globalAlpha = pOn; label(c, PH[pi][2], 98, 112, { size: 15, ls: 2 }); c.restore();
      // the word, traced too: it jitters on twos
      const wo = E.outC(seg(t, 7.9, 8.4));
      if (wo > 0) TK.word(c, 960 + (hash(k) - 0.5) * 3, 826 + (hash(k + 5) - 0.5) * 3, { size: 92, alpha: wo, ls: 6 });
      TK.caption(c, t, W, H, { name: 'Rotoscope', cat: 'Compositing', curve: u => rPlateA(u * 10) * (1 - rVeil(u * 10)), span: [0, 10], curveLabel: 'PLATE OPACITY / TIME' });
    },
    score(A) {
      TK.bed(A);
      // the projector: a low hum and a soft shutter flutter while the plate runs
      A.osc(0, { type: 'sawtooth', f: 55, dur: 7.0, g: 0.02, lp: 260, a: 0.4, hold: true, rel: 0.9 });
      for (let i = 0; i < 28; i++) A.noise(i * 0.25, { type: 'bandpass', f: 1400, q: 3, dur: 0.03, g: 0.015 * (1 - seg(i * 0.25, 5.8, 7)) });
      // roto: a blip as each vertex is keyed on the beat
      for (let b = 2; b < 6; b++) A.osc(b * 0.5, { f: 1760 + (b % 2) * 440, dur: 0.06, g: 0.05, pan: (b % 2 ? 0.4 : -0.4) });
      // tracing: a pencil scratch per drawing (12 a second)
      for (let d = 35; d < 84; d++) A.noise(d / 12, { type: 'bandpass', f: 3200 + hash(d) * 1800, q: 2.5, dur: 0.05, g: 0.022, pan: (hash(d + 3) - 0.5) * 0.6 });
      A.whoosh(2.85, 0.6, { f1: 400, f2: 2600, g: 0.08, swell: 0.6 });
      A.pluck(3.0, midi(67), { g: 0.14, bright: 0.5, dur: 1.2 });
      // plate off: a falling sweep
      A.noise(6.0, { type: 'bandpass', f: 3000, f2: 260, q: 1.5, dur: 1.0, g: 0.09, swell: 0.3, rev: 0.4 });
      // ink & paint
      A.chord(6.95, [60, 64, 67], { type: 'triangle', dur: 1.1, g: 0.04, a: 0.02, lp: 2200, rev: 0.4, width: 0.6 });
      A.pluck(7.0, midi(72), { g: 0.16, bright: 0.6, dur: 1.2 });
      A.kick(8, 0.4, { f: 110, f2: 40 });
      A.bell(8, midi(84), { g: 0.06, dur: 1.6, rev: 0.5 });
      A.chord(8, [60, 64, 67, 72], { type: 'triangle', dur: 2, g: 0.04, a: 0.05, lp: 2400, rev: 0.6, width: 0.8 });
    },
  });

  /* =====================================================================
     DOUBLE EXPOSURE — two exposures, one frame. Exposure 1 (the Token) and
     exposure 2 (blue light bars and the word) are drawn in their own
     panels and combined in the result with a real blend: ADD (light on
     light, clipping to white), SCREEN (the same, softly, never past
     white), MULTIPLY (two slides sandwiched: only what both let through).
     Then the silhouette variant: the Token shot dark against a white sky
     takes exposure 2 through SCREEN — white stays white, the dark shape
     fills with the second picture. A probe reads E1, E2 and OUT from the
     actual pixels.
     ===================================================================== */
  const DW = 960, DH = 540;
  const DP = { e1: [120, 190, 480, 270], e2: [120, 540, 480, 270], out: [780, 190, 1000, 562.5] };
  const DM = [
    { t0: 0.5, t1: 3.0, op: 'lighter', name: 'ADD', kind: 'dark', formula: 'OUT = E1 + E2   ·   OVERLAPS GO BRIGHTER, CLIP AT WHITE', f: (a, b) => Math.min(1, a + b), probe: [300, 305] },
    { t0: 3.0, t1: 5.0, op: 'screen', name: 'SCREEN', kind: 'dark', formula: 'OUT = 1 − (1 − E1)(1 − E2)   ·   BRIGHTER, NEVER PAST WHITE', f: (a, b) => 1 - (1 - a) * (1 - b), probe: [300, 305] },
    { t0: 5.0, t1: 7.0, op: 'multiply', name: 'MULTIPLY', kind: 'light', formula: 'OUT = E1 × E2   ·   TWO SLIDES SANDWICHED, ONLY SHARED LIGHT', f: (a, b) => a * b, probe: [300, 305] },
    { t0: 7.0, t1: 10, op: 'screen', name: 'SILHOUETTE', kind: 'sil', formula: 'SCREEN   ·   WHITE STAYS WHITE, THE DARK SHAPE TAKES E2', f: (a, b) => 1 - (1 - a) * (1 - b), probe: [400, 340] },
  ];
  const dModeAt = t => { let m = 0; DM.forEach((d, i) => { if (t >= d.t0) m = i; }); return m; };
  function dE1(g, t, kind) {
    g.globalCompositeOperation = 'source-over';
    if (kind === 'sil') {
      const gr = g.createLinearGradient(0, 0, 0, DH);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#efebe3');
      g.fillStyle = gr; g.fillRect(0, 0, DW, DH);
      g.save(); g.translate(480, 270 + Math.sin(t * 0.9) * 8); g.rotate(-0.08 + Math.sin(t * 0.7) * 0.06);
      TK.tokenPath(g, 380); g.fillStyle = '#141416'; g.fill('evenodd'); g.restore();
      return;
    }
    g.fillStyle = kind === 'dark' ? '#0d0d0f' : '#f3efe7'; g.fillRect(0, 0, DW, DH);
    if (kind === 'dark') {   // a little studio falloff around the subject
      const gr = g.createRadialGradient(330, 270, 40, 330, 270, 380);
      gr.addColorStop(0, 'rgba(255,120,60,0.16)'); gr.addColorStop(1, 'rgba(255,120,60,0)');
      g.fillStyle = gr; g.fillRect(0, 0, DW, DH);
    }
    g.save(); g.translate(330 + Math.sin(t * 0.6) * 30, 270); g.rotate(Math.sin(t * 0.7) * 0.12);
    TK.tokenPath(g, 280); g.fillStyle = P.accent; g.fill('evenodd'); g.restore();
  }
  function dE2(g, t, kind) {
    g.globalCompositeOperation = 'source-over';
    if (kind === 'sil') {
      const gr = g.createLinearGradient(0, 0, DW, DH);
      gr.addColorStop(0, '#1d3fd6'); gr.addColorStop(1, '#2f8bff');
      g.fillStyle = gr; g.fillRect(0, 0, DW, DH);
      g.save(); g.translate(480, 270); g.rotate(-0.22); g.translate(-480, -270);
      for (let r = -3; r <= 3; r++) {
        const dir = r % 2 ? 1 : -1, off = ((t * 70 * dir) % 460 + 460) % 460;
        for (let i = -2; i < 4; i++) {
          text(g, 'MOTION', -200 + off + i * 460, 270 + r * 92, { font: TK.FONT, weight: 900, size: 92, color: r % 2 ? P.accent : '#ffe2c9', base: 'middle', ls: 4 });
        }
      }
      g.restore();
      return;
    }
    const dark = kind === 'dark';
    g.fillStyle = dark ? '#0d0d0f' : '#f3efe7'; g.fillRect(0, 0, DW, DH);
    const col = dark ? '#3d6bff' : '#5b86ff';
    [[118, 26], [305, 40], [470, 22]].forEach(([y, h], i) => {
      const x0 = -60 + ((t * (40 + i * 25)) % 120);
      const gr = g.createLinearGradient(0, 0, DW, 0);
      gr.addColorStop(0, 'rgba(61,107,255,0)'); gr.addColorStop(0.15, col); gr.addColorStop(0.85, col); gr.addColorStop(1, 'rgba(61,107,255,0)');
      g.fillStyle = gr; g.fillRect(x0, y - h / 2, DW + 60, h);
    });
    text(g, 'MOTION', 640 - Math.sin(t * 0.5) * 40, 410, { font: TK.FONT, weight: 900, size: 150, color: dark ? '#4f7bff' : '#6f93ff', align: 'center', base: 'middle', ls: 6 });
  }
  function dPanel(c, img, r, ttl, flash, sub) {
    const [x, y, w, h] = r;
    c.fillStyle = 'rgba(23,24,28,0.12)'; c.fillRect(x + 6, y + 8, w, h);
    c.drawImage(img, x, y, w, h);
    if (flash > 0) { c.fillStyle = `rgba(255,255,255,${flash})`; c.fillRect(x, y, w, h); }
    c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(x, y, w, h);
    label(c, ttl, x, y - 14, { size: 16, ls: 3, color: P.ink, weight: 700 });
    if (sub) label(c, sub, x + w, y - 14, { size: 14, ls: 2, align: 'right' });
  }
  const dRGB = (g, p) => { const d = g.getImageData(p[0], p[1], 1, 1).data; return [d[0], d[1], d[2]]; };

  MG.film({
    id: 'techdoubleexposure', dur: 10, poster: 8.6,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Double Exposure', sub: 'Two exposures, one frame', era: '1850s —',
      origin: 'Exposing the same plate or frame twice adds the light of both images: whatever was dark in one shows the other. Victorian photographers used it for “spirit” photographs, and Georges Méliès, rewinding his camera and masking parts of the frame, built trick films on it from 1898. In film it became the superimposition and the dissolve; digital compositing turned it into blend modes, where add (linear dodge) and screen reproduce the light-adding of a double exposure and multiply the sandwiching of two transparencies.',
      works: 'The Man with the Rubber Head / L’Homme à la tête en caoutchouc (Georges Méliès, 1901) · The Phantom Carriage / Körkarlen (Victor Sjöström, 1921) · True Detective (HBO, 2014; title sequence by Elastic)',
      tech: ['Add · screen · multiply', 'Dark areas take the other exposure', 'Silhouette as matte'],
      accent: '#ff5a1f',
      motionDNA: 'The exposures barely move — a slow drift and sway in each — because the technique is in the combine, not the motion. Every two seconds a new pair is shot on the beat: exposure 1 flashes, exposure 2 half a beat later, and the result develops a beat after that under a new blend mode; the silhouette pass holds for the last three seconds with its texture scrolling inside the Token.',
      visualDNA: 'The Technique Atlas stage with three framed panels: exposure 1 and exposure 2 stacked on the left, joined by + and = to a large result. Near-black exposures for add and screen, paper for multiply, a black Token on white for the silhouette; blue light bars and the word MOTION as the second exposure; a mode strip, a crosshair probe with live RGB readouts and the blend formula under the result.',
      transitions: 'Shutter flash per exposure; the result re-develops under each new blend mode',
      implementation: ['In-camera: rewind and re-expose the same frame', 'Optical printer superimposition / After Effects blend modes (Add, Screen, Multiply)', 'Canvas 2D: globalCompositeOperation lighter, screen and multiply on offscreen exposures'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const mk = () => { const cv = MG.offscreen(DW, DH); return { cv, g: cv.getContext('2d', { willReadFrequently: true }) }; };
      return { a1: mk(), a2: mk(), b1: mk(), b2: mk(), r: mk() };
    },
    draw(c, t, W, H, st) {
      TK.stage(c, W, H);
      const mi = dModeAt(t), m = DM[mi];
      // panels switch on their own exposure: E1 on t0, E2 half a beat later, result a beat later
      const m1 = DM[mi], m2 = DM[t >= m.t0 + 0.25 ? mi : Math.max(0, mi - 1)], mr = DM[t >= m.t0 + 0.5 ? mi : Math.max(0, mi - 1)];
      dE1(st.a1.g, t, m1.kind); dE2(st.a2.g, t, m2.kind);
      dE1(st.b1.g, t, mr.kind); dE2(st.b2.g, t, mr.kind);
      const r = st.r.g;
      r.globalCompositeOperation = 'source-over'; r.drawImage(st.b1.cv, 0, 0);
      r.globalCompositeOperation = mr.op; r.drawImage(st.b2.cv, 0, 0);
      r.globalCompositeOperation = 'source-over';
      const intro = seg(t, 0.1, 0.5);
      const fl = te => (t >= te ? 0.85 * (1 - E.outC(seg(t, te, te + 0.35))) : 0);
      c.save(); c.globalAlpha = intro;
      dPanel(c, st.a1.cv, DP.e1, 'EXPOSURE 1', fl(m.t0), m1.kind === 'sil' ? 'SUBJECT, BACKLIT' : 'SUBJECT');
      dPanel(c, st.a2.cv, DP.e2, 'EXPOSURE 2', fl(m.t0 + 0.25), m2.kind === 'sil' ? 'TEXTURE' : 'LIGHT + TYPE');
      dPanel(c, st.r.cv, DP.out, 'RESULT  ·  ONE FRAME', fl(m.t0 + 0.5) * 0.6, '');
      // operators
      text(c, '+', 360, 500, { font: TK.FONT, weight: 800, size: 44, color: P.ink, align: 'center', base: 'middle' });
      c.strokeStyle = P.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(626, 470); c.lineTo(752, 470); c.stroke();
      c.fillStyle = P.ink; c.beginPath(); c.moveTo(758, 470); c.lineTo(744, 461); c.lineTo(744, 479); c.closePath(); c.fill();
      label(c, mr.name === 'SILHOUETTE' ? 'SCREEN' : mr.name, 690, 454, { align: 'center', size: 14, ls: 2, color: P.accentD, weight: 700 });
      c.restore();
      // mode strip
      const MX = [1200, 1300, 1450, 1630];
      DM.forEach((d, i) => {
        const on = i === dModeAt(t - 0.5) && t >= 1.0;
        label(c, d.name, MX[i], 80, { size: 18, ls: 3, color: on ? P.ink : P.mute, weight: on ? 700 : 400 });
        if (on) { c.fillStyle = P.accent; c.fillRect(MX[i], 92, d.name.length * 13.6, 4); }
      });
      // big mode name over the result
      const mOn = E.outC(seg(t, m.t0 + 0.5, m.t0 + 0.8));
      if (t >= 1.0) {
        c.save(); c.globalAlpha = intro;
        text(c, mr.name, 1780, 172, { font: TK.FONT, weight: 800, size: 40, color: P.ink, align: 'right' });
        c.restore();
      }
      // probe: the same pixel in all three, read back from the actual images
      if (t >= 1.0) {
        const pr = mr.probe, pOn = seg(t, 1.0, 1.4) * (t >= m.t0 + 0.5 ? 1 : 0.4 + 0.6 * mOn);
        const [rx, ry, rw] = DP.out, k = rw / DW;
        const cross = (x, y, s) => {
          c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath();
          c.arc(x, y, 9 * s, 0, TAU); c.moveTo(x - 18 * s, y); c.lineTo(x - 5 * s, y); c.moveTo(x + 5 * s, y); c.lineTo(x + 18 * s, y);
          c.moveTo(x, y - 18 * s); c.lineTo(x, y - 5 * s); c.moveTo(x, y + 5 * s); c.lineTo(x, y + 18 * s); c.stroke();
          c.strokeStyle = '#fff'; c.lineWidth = 1; c.stroke();
        };
        c.save(); c.globalAlpha = pOn;
        cross(rx + pr[0] * k, ry + pr[1] * k, 1);
        [DP.e1, DP.e2].forEach(([x, y, w]) => cross(x + pr[0] * w / DW, y + pr[1] * w / DW, 0.7));
        const v1 = dRGB(st.b1.g, pr), v2 = dRGB(st.b2.g, pr), vo = dRGB(r, pr);
        const f = v => v.map(n => String(n).padStart(3, ' ')).join(' ');
        const y0 = DP.out[1] + DP.out[3] + 40;
        label(c, `PROBE   E1 ${f(v1)}   E2 ${f(v2)}   →   OUT ${f(vo)}`, rx, y0, { size: 17, ls: 1, color: P.ink, weight: 700 });
        [[v1, 0], [v2, 1], [vo, 2]].forEach(([v, i]) => { c.fillStyle = `rgb(${v.join(',')})`; c.fillRect(rx + 1000 - 3 * 34 + i * 34, y0 - 18, 26, 22); c.strokeStyle = P.ink; c.lineWidth = 1; c.strokeRect(rx + 1000 - 3 * 34 + i * 34 + 0.5, y0 - 17.5, 26, 22); });
        label(c, mr.formula, rx, y0 + 32, { size: 15, ls: 2 });
        c.restore();
      }
      tag(c, t < 7.5 ? 'TWO EXPOSURES  ·  ONE FRAME' : 'SILHOUETTE  ·  THE SUBJECT IS THE MATTE', 72, 80, seg(t, 0.1, 0.5));
      TK.caption(c, t, W, H, { name: 'Double Exposure', cat: 'Compositing', curve: u => mr.f(u, 0.5), span: [mr.t0 + 0.5, mr.t1], lo: -0.15, hi: 1.2, curveLabel: 'OUT / E1  ·  E2 = 0.5' });
    },
    score(A) {
      TK.bed(A);
      const shutter = (t, g) => {
        A.noise(t, { type: 'highpass', f: 2600, dur: 0.025, g: 0.13 * g });
        A.noise(t + 0.055, { type: 'highpass', f: 3200, dur: 0.02, g: 0.09 * g });
        A.osc(t, { f: 190, f2: 90, dur: 0.08, g: 0.08 * g, type: 'triangle' });
      };
      const RES = [
        { notes: [60, 67, 72, 76], lp: 3200, g: 0.045 },
        { notes: [60, 67, 72, 76], lp: 1800, g: 0.035 },
        { notes: [48, 55, 60, 63], lp: 700, g: 0.04 },
        { notes: [60, 64, 67, 71, 74], lp: 2600, g: 0.04 },
      ];
      DM.forEach((d, i) => {
        shutter(d.t0, 1); A.pluck(d.t0, midi(60), { g: 0.12, bright: 0.5, dur: 0.8, pan: -0.4 });
        shutter(d.t0 + 0.25, 0.9); A.pluck(d.t0 + 0.25, midi(67), { g: 0.12, bright: 0.5, dur: 0.8, pan: 0.4 });
        const R = RES[i];
        A.chord(d.t0 + 0.5, R.notes, { type: 'triangle', dur: 1.6, g: R.g, a: 0.04, lp: R.lp, rev: 0.5, width: 0.7 });
        A.whoosh(d.t0 + 0.3, 0.3, { f1: 600, f2: 2800, g: 0.06, swell: 0.8 });
      });
      A.bell(7.5, midi(84), { g: 0.06, dur: 2, rev: 0.5 });
      A.kick(7.5, 0.35, { f: 110, f2: 40 });
    },
  });

  /* =====================================================================
     TIME REMAPPING — one fixed source clip (the Token hopping left to
     right, a landing every 0.8 source seconds) is never changed; only the
     clock that reads it is. The speed is keyed — 100%, a ramp into 20%
     slow motion, a hold (freeze frame), −100% reverse, a ramp through zero
     up to 250%, and back to 100% — and integrated into a remap curve,
     source time as a function of output time. A ruler under the Token is
     the source clip, with its playhead; ghosts at fixed output intervals
     bunch up in slow motion, collapse in the freeze and spread out when
     fast.
     ===================================================================== */
  const VK = [[0, 1], [2, 1], [3, 0.2, E.ioS], [4.5, 0.2], [4.501, 0, E.lin], [5.5, 0], [5.501, -1, E.lin], [6.5, -1], [7.5, 2.5, E.ioS], [9, 2.5], [10, 1, E.ioS]];
  const TN = 3000;   // integration steps (1/300 s)
  const TRS = 150, TFL = 690, TX0 = 230, TX1 = 1690, THOP = 0.8;
  const TSEG = [
    [0, 'NORMAL SPEED', 'SOURCE TIME = OUTPUT TIME'],
    [2, 'SPEED RAMP  ·  100% → 20%', 'THE REMAP CURVE BENDS FLAT'],
    [3, 'SLOW MOTION  ·  20%', 'ONE SOURCE SECOND TAKES FIVE'],
    [4.5, 'FREEZE FRAME  ·  0%', 'SOURCE TIME HOLDS  ·  THE CURVE GOES FLAT'],
    [5.5, 'REVERSE  ·  −100%', 'SOURCE TIME RUNS BACKWARDS'],
    [6.5, 'SPEED RAMP  ·  −100% → 250%', 'THROUGH ZERO AND FORWARD AGAIN'],
    [7.5, 'FAST MOTION  ·  250%', 'TWO AND A HALF SOURCE SECONDS PER SECOND'],
    [9, 'RAMP BACK  ·  250% → 100%', 'THE CURVE SETTLES TO 45°'],
  ];
  const tV = t => kf(t, VK);
  function tSrc(st, t) {
    const f = clamp(t / 10) * TN, i = Math.min(TN - 1, Math.floor(f));
    return lerp(st.s[i], st.s[i + 1], f - i);
  }
  function tPose(st, s) {
    const ph = ((s / THOP) % 1 + 1) % 1, hop = 4 * ph * (1 - ph), ct = clamp(1 - Math.min(ph, 1 - ph) / 0.07);
    return { x: lerp(TX0, TX1, s / st.smax), y: TFL - TRS * 0.62 - 200 * hop + ct * 8, rot: s * PI * 0.8, sx: 1 + 0.12 * ct, sy: 1 - 0.14 * ct, lift: 200 * hop };
  }

  MG.film({
    id: 'techtimeremap', dur: 10, poster: 6.1,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Time Remapping', sub: 'One clip, a new clock', era: '1890s —',
      origin: 'Changing the speed of time on screen is as old as the hand-cranked camera: overcranking gave slow motion, undercranking fast motion, and early filmmakers ran film backwards for reverse. Optical printers could hold frames for a freeze or skip them, and the closing freeze of Truffaut’s The 400 Blows (1959) made the held frame famous. Digital editing turned it into a curve: Adobe After Effects’ Time Remapping maps output time to source time per frame, and speed ramps became a staple of music videos and action films after The Matrix (1999).',
      works: 'The 400 Blows / Les Quatre Cents Coups (François Truffaut, 1959; final freeze frame) · The Matrix (The Wachowskis, 1999) · 300 (Zack Snyder, 2007; speed ramps)',
      tech: ['Keyed speed integrated to a remap curve', 'Freeze as a hold', 'Reverse as negative speed'],
      accent: '#ff5a1f',
      motionDNA: 'The source clip is an even, regular hop; all the expression comes from the clock. Two seconds at 100%, a one-second ease into 20%, a hard hold at 4.5 s, a cut into −100% reverse at 5.5 s, a ramp through zero up to 250% and a final ease back to 100% — so the same hop reads as floaty, frozen, rewound and frantic.',
      visualDNA: 'The Technique Atlas stage with its floor line: the orange Token hopping across a dotted path, six outlined ghosts at fixed output intervals, an ink arrow showing source velocity; a source ruler under the floor with a playhead and source-frame counter; a speed graph and a large speed percentage top right; the remap curve (source time over output time) as the caption graph.',
      transitions: 'Speed ramps, a hold (freeze frame), a hard cut into reverse',
      implementation: ['Over- and undercranked cameras, optical-printer step printing', 'After Effects Time Remapping / Premiere and Resolve speed ramps', 'Canvas 2D: keyed speed integrated in setup() into a source-time table'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const s = new Float32Array(TN + 1);
      for (let i = 1; i <= TN; i++) { const ta = (i - 1) / TN * 10, tb = i / TN * 10; s[i] = s[i - 1] + (tV(ta) + tV(tb)) / 2 * (tb - ta); }
      let smin = 0, smax = 0; for (let i = 0; i <= TN; i++) { smin = Math.min(smin, s[i]); smax = Math.max(smax, s[i]); }
      return { s, smax };
    },
    draw(c, t, W, H, st) {
      TK.stage(c, W, H, { floor: TFL });
      const s = tSrc(st, t), v = tV(t), q = tPose(st, s);
      // the source clip's whole path, dotted
      c.fillStyle = 'rgba(23,24,28,0.22)';
      for (let k = 0; k <= 400; k++) { const p = tPose(st, k / 400 * st.smax); c.beginPath(); c.arc(p.x, p.y, 2, 0, TAU); c.fill(); }
      // ghosts at fixed output intervals: bunch up when slow, stack in a freeze, spread when fast
      for (let i = 6; i >= 1; i--) {
        const tg = t - i * 0.08; if (tg < 0) continue;
        const g = tPose(st, tSrc(st, tg));
        c.save(); c.translate(g.x, g.y); c.scale(g.sx, g.sy); c.rotate(g.rot); TK.tokenPath(c, TRS); c.restore();
        c.strokeStyle = `rgba(198,62,12,${0.5 - i * 0.065})`; c.lineWidth = 2; c.stroke();
      }
      TK.shadow(c, q.x, TFL, TRS, q.lift);
      TK.token(c, q.x, q.y, TRS, { rot: q.rot, sx: q.sx, sy: q.sy });
      // source velocity arrow
      if (Math.abs(v) > 0.02) {
        const ay = Math.max(300, q.y - 135), L = v * 70, d = Math.sign(v);
        c.strokeStyle = P.ink; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(q.x, ay); c.lineTo(q.x + L, ay); c.stroke(); c.lineCap = 'butt';
        c.fillStyle = P.ink; c.beginPath(); c.moveTo(q.x + L + d * 14, ay); c.lineTo(q.x + L - d * 4, ay - 11); c.lineTo(q.x + L - d * 4, ay + 11); c.closePath(); c.fill();
      } else {
        // hold marker
        c.fillStyle = P.ink; const hy = Math.max(285, q.y - 150); c.fillRect(q.x - 14, hy, 9, 30); c.fillRect(q.x + 5, hy, 9, 30);
      }
      // source ruler, aligned with the Token's x
      const ry = 770;
      label(c, 'SOURCE CLIP', 72, ry + 6, { size: 14, ls: 2, color: P.ink, weight: 700 });
      c.fillStyle = 'rgba(23,24,28,0.18)'; c.fillRect(TX0, ry, TX1 - TX0, 2);
      for (let k = 0; k <= Math.floor(st.smax * 2); k++) {
        const x = lerp(TX0, TX1, k / 2 / st.smax), big = k % 2 === 0;
        c.fillStyle = 'rgba(23,24,28,0.35)'; c.fillRect(x - 0.5, ry - (big ? 10 : 5), 1, big ? 10 : 5);
        if (big) label(c, `${k / 2}s`, x, ry + 26, { align: 'center', size: 13, ls: 1 });
      }
      c.fillStyle = P.accent; c.fillRect(TX0, ry, q.x - TX0, 2);
      c.beginPath(); c.moveTo(q.x, ry - 4); c.lineTo(q.x - 9, ry - 18); c.lineTo(q.x + 9, ry - 18); c.closePath(); c.fill();
      label(c, `SRC FR ${pad(Math.floor(s * 24 + 1e-6), 3)}`, q.x, ry + 52, { align: 'center', size: 14, ls: 2, color: P.accentD, weight: 700 });
      // readouts
      let si = 0; TSEG.forEach((g, i) => { if (t >= g[0]) si = i; });
      const sOn = seg(t, TSEG[si][0], TSEG[si][0] + 0.2) * seg(t, 0.1, 0.4);
      tag(c, TSEG[si][1], 72, 80, sOn);
      c.save(); c.globalAlpha = sOn; label(c, TSEG[si][2], 98, 112, { size: 15, ls: 2 }); c.restore();
      label(c, `OUTPUT  ${t.toFixed(2).padStart(5, '0')} s     SOURCE  ${s.toFixed(2).padStart(5, '0')} s`, 98, 146, { size: 17, ls: 2, color: P.ink, weight: 700 });
      const pct = Math.round(v * 100);
      text(c, `${pct < 0 ? '−' : ''}${Math.abs(pct)}%`, 1848, 104, { font: TK.FONT, weight: 800, size: 56, color: pct === 0 ? P.ink : P.accent, align: 'right' });
      label(c, 'SPEED', 1368, 102, { align: 'right', size: 16, ls: 3, color: P.ink, weight: 700 });
      // speed graph
      const gx = 1368, gy = 138, gw = 480, gh = 104, lo = -1.3, hi = 2.8, Y = u => gy + gh - (u - lo) / (hi - lo) * gh;
      c.strokeStyle = 'rgba(23,24,28,0.2)'; c.lineWidth = 1; c.strokeRect(gx + 0.5, gy + 0.5, gw, gh);
      c.setLineDash([3, 4]); c.beginPath(); c.moveTo(gx, Y(0)); c.lineTo(gx + gw, Y(0)); c.moveTo(gx, Y(1)); c.lineTo(gx + gw, Y(1)); c.stroke(); c.setLineDash([]);
      label(c, '100%', gx - 8, Y(1) + 5, { align: 'right', size: 12, ls: 1 });
      label(c, '0%', gx - 8, Y(0) + 5, { align: 'right', size: 12, ls: 1 });
      c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath();
      for (let i = 0; i <= 400; i++) { const tt = i / 40, px = gx + tt / 10 * gw, py = Y(tV(tt)); i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.stroke();
      c.fillStyle = P.accent; c.beginPath(); c.arc(gx + t / 10 * gw, Y(v), 6, 0, TAU); c.fill();
      label(c, 'SPEED / OUTPUT TIME', gx, gy + gh + 22, { size: 13, ls: 2 });
      // ghosts key
      label(c, 'GHOSTS EVERY 0.08 s OF OUTPUT TIME', 98, 178, { size: 14, ls: 2, color: P.accentD });
      TK.caption(c, t, W, H, { name: 'Time Remapping', cat: 'Temporal', curve: u => tSrc(st, u * 10) / st.smax, span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'SOURCE TIME / OUTPUT TIME' });
    },
    score(A) {
      TK.bed(A);
      // the source's own sound — a landing every 0.8 source seconds — lands wherever the remap puts it
      const S = [0];
      for (let i = 1; i <= TN; i++) { const ta = (i - 1) / TN * 10, tb = i / TN * 10; S[i] = S[i - 1] + (tV(ta) + tV(tb)) / 2 * (tb - ta); }
      let last = -1;
      for (let i = 1; i <= TN; i++) {
        const a = Math.floor(S[i - 1] / THOP + 0.5), b = Math.floor(S[i] / THOP + 0.5), t = i / TN * 10;
        if (a !== b && t - last > 0.06) {
          last = t;
          const sp = clamp(Math.abs(tV(t)), 0.35, 2.5);
          A.osc(t, { type: 'triangle', f: midi(55) * sp, f2: midi(43) * sp, glide: 0.08, dur: 0.18, g: 0.12 });
          A.noise(t, { type: 'bandpass', f: 1800 * sp, q: 1.5, dur: 0.04, g: 0.06 });
        }
      }
      // a tape tone whose pitch follows the speed
      const f0 = 330, TONE = [[0, 2, 1, 1], [2, 3, 1, 0.2], [3, 4.5, 0.2, 0.2], [5.5, 6.5, 1, 1], [6.5, 6.86, 1, 0.12], [6.86, 7.5, 0.12, 2.5], [7.5, 9, 2.5, 2.5], [9, 10, 2.5, 1]];
      TONE.forEach(([a, b, va, vb]) => A.osc(a, { type: 'triangle', f: f0 * va, f2: f0 * vb, glide: b - a, dur: b - a, g: 0.022, a: 0.02, hold: true, rel: 0.03, lp: 1600 }));
      // freeze: a struck, held shimmer
      A.clap(4.5, 0.18);
      A.chord(4.5, [72, 76, 79, 83], { type: 'sine', dur: 1.0, g: 0.025, a: 0.01, rev: 0.6, width: 0.8 });
      // reverse: a swell that ends on the cut, like a sound played backwards
      A.noise(4.9, { type: 'bandpass', f: 600, f2: 3200, q: 1.2, dur: 0.6, g: 0.1, swell: 0.95, rev: 0.2 });
      A.osc(5.5, { type: 'sawtooth', f: 660, f2: 330, glide: 0.15, dur: 0.18, g: 0.04, lp: 1800 });
      // ramp up and the fast run
      A.riser(6.6, 0.9, { g: 0.1, f: 110 });
      A.impact(7.5, 0.3);
      A.chord(9.0, [60, 64, 67, 72], { type: 'triangle', dur: 1.0, g: 0.035, a: 0.05, lp: 2400, rev: 0.5, width: 0.8 });
    },
  });
})();
