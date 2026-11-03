/* batch k11 — Technique Atlas · Transitions · Timing: techdissolve · techsquash · techfollowthrough.
   techdissolve (the cross-dissolve: two Token shots mixed by opacity, a probe pixel and layer bars
   showing the muddy 50/50 midpoint; dips to black and to white; then the same cut dissolved
   normally beside an additive dissolve that adds light and clips the paper to white) ·
   techsquash (squash and stretch with volume kept: the Token stretches along its velocity and
   squashes on contact while sx·sy stays 1, beside a rigid Token on the same bounce; then just
   right, too much, and a squash that loses volume) ·
   techfollowthrough (follow-through and overlapping action: a four-segment antenna on the Token,
   simulated as a chain of lagging springs, keeps swinging after the body stops; onion-skin drag,
   a rigid ghost for comparison and a per-segment angle chart with each segment's lag in frames). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, midi, text, offscreen } = MG;
  const TK = MG.TK, P = TK.P, PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixRGB = (a, b, u) => { const A = hex(a), B = hex(b); return A.map((v, i) => Math.round(lerp(v, B[i], u))); };
  const rgbHex = v => '#' + v.map(x => clamp(x, 0, 255).toString(16).padStart(2, '0')).join('');
  const label = (c, s, x, y, o = {}) => {
    if (o.alpha !== undefined) { if (o.alpha <= 0.005) return; c.save(); c.globalAlpha *= o.alpha; }
    text(c, s, x, y, { font: TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
    if (o.alpha !== undefined) c.restore();
  };
  const tag = (c, s, x, y, on = 1) => {   // small accent dot + mono label
    if (on <= 0.005) return;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: P.ink, weight: 700, size: 20 });
    c.restore();
  };
  // An extra curve drawn into the caption's value/time graph (same box geometry as TK.caption).
  function graphOverlay(c, W, H, fn, o = {}) {
    const gw = 240, gh = 120, gx = W - 72 - gw, gy = H - 52 - gh;
    const lo = o.lo ?? -0.2, hi = o.hi ?? 1.3, Y = v => gy + gh - (clamp(v, lo, hi) - lo) / (hi - lo) * gh;
    c.save(); c.globalAlpha = o.alpha ?? 0.7;
    c.strokeStyle = o.color || P.mute; c.lineWidth = 2; c.setLineDash(o.dash || [6, 5]);
    c.beginPath();
    for (let i = 0; i <= 96; i++) { const u = i / 96, px = gx + u * gw, py = Y(fn(u)); i ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke(); c.restore();
  }
  // Horizontal meter: name left, value right, track below.
  function meter(c, x, y, w, name, v, val, col, o = {}) {
    label(c, name, x, y, { size: 16, ls: 2, color: P.ink, weight: 700, alpha: o.alpha });
    label(c, val, x + w, y, { size: 16, ls: 1, color: o.vcol || P.ink, weight: 700, align: 'right', alpha: o.alpha });
    c.save(); if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
    c.fillStyle = 'rgba(23,24,28,0.08)'; c.fillRect(x, y + 12, w, 18);
    c.fillStyle = col; c.fillRect(x, y + 12, w * clamp(v), 18);
    if (o.outline) { c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 12.5, w * clamp(v), 17); }
    c.restore();
  }

  /* =====================================================================
     DISSOLVE — one shot fades out while the next fades in over it:
     OUT = A·(1−u) + B·u. Shown on a program monitor beside the layer
     opacities. First an orange Token shot dissolves into a blue one that
     overlaps it; a probe pixel where both Tokens sit shows the mix going
     muddy at 50/50, when neither shape has full contrast. Then a dip to
     black (outgoing shot fades to a black plate, the next fades up from
     it) and a dip to white. Finally the monitor splits: the same cut is
     dissolved normally on the left and additively on the right, where
     both layers ride near full strength in the middle, light adds, and
     the paper clips to white — the brightness bump.
     ===================================================================== */
  const DVM = { x: 140, y: 120, w: 1120, h: 630 };
  const DVL = { x: 130, y: 200, w: 800, h: 450 }, DVR = { x: 990, y: 200, w: 800, h: 450 };
  const DX = { xd: [0.8, 3.2], db: [3.5, 4.9], dw: [5.15, 6.15], lay: [6.3, 6.8], ad: [7.0, 9.0] };
  const DPROBE = [880, 560], D_PAPER = 0.912, DPX = 1330, DPW = 490;
  const D_NAMES = ['SHOT 0  ·  ORANGE', 'SHOT 1  ·  BLUE', 'SHOT 2  ·  INK + WORD', 'SHOT 3  ·  OUTLINE', 'SHOT 4  ·  ORANGE + WORD'];
  // Each shot drawn in full-frame 1920×1080 coordinates.
  function dShot(c, k) {
    if (k === 0) { TK.stage(c, 1920, 1080, { floor: 860 }); TK.shadow(c, 760, 860, 400, 100); TK.token(c, 760, 560, 400); }
    else if (k === 1) { TK.stage(c, 1920, 1080, { ox: 40, oy: 40, floor: 860 }); TK.shadow(c, 1000, 860, 400, 160); TK.token(c, 1000, 500, 400, { rot: PI / 2, color: P.blue }); }
    else if (k === 2) { TK.stage(c, 1920, 1080, { z: 1.5 }); TK.token(c, 960, 420, 330, { rot: PI, color: P.ink }); TK.word(c, 960, 790, { size: 150, ls: 6 }); }
    else if (k === 3) { TK.stage(c, 1920, 1080, { z: 2, ox: 60 }); TK.token(c, 960, 540, 560, { rot: PI * 1.5, color: P.ground, edge: 10 }); }
    else { TK.stage(c, 1920, 1080); TK.token(c, 960, 410, 360, { rot: TAU }); TK.word(c, 960, 790, { size: 150, ls: 6 }); }
  }
  function dIn(c, R, fn) {
    c.save(); c.beginPath(); c.rect(R.x, R.y, R.w, R.h); c.clip();
    c.translate(R.x, R.y); c.scale(R.w / 1920, R.h / 1080); fn(); c.restore();
  }
  function dFrame(c, R, a = 1) {
    c.save(); c.globalAlpha *= a; c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(R.x - 1, R.y - 1, R.w + 2, R.h + 2);
    c.fillStyle = P.ink; [[R.x, R.y], [R.x + R.w, R.y], [R.x, R.y + R.h], [R.x + R.w, R.y + R.h]].forEach(([x, y]) => c.fillRect(x - 5, y - 5, 10, 10));
    c.restore();
  }
  const dRect = (A, B, u) => ({ x: lerp(A.x, B.x, u), y: lerp(A.y, B.y, u), w: lerp(A.w, B.w, u), h: lerp(A.h, B.h, u) });
  const dAddW = u => [Math.min(1, 2 * (1 - u)), Math.min(1, 2 * u)];
  function dPhase(t) { return t < DX.db[0] - 0.15 ? 'xd' : t < DX.dw[0] - 0.12 ? 'db' : t < DX.lay[0] ? 'dw' : 'ad'; }

  MG.film({
    id: 'techdissolve', dur: 10, poster: 2.0,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Dissolve', sub: 'One picture fades out as the next fades in', era: '1890s —',
      origin: 'The dissolve began in the camera: the operator faded a shot out with the shutter or iris, wound the film back and faded the next shot in over the same frames. Georges Méliès used dissolves to join the tableaux of Cinderella (Cendrillon, 1899); from the 1930s they were made on the optical printer, and Hollywood grammar settled on the dissolve for passing time and the fade to black for ending a scene. Editing software kept the vocabulary: Cross Dissolve, Dip to Black, Dip to White and an Additive Dissolve that sums the two pictures are standard transitions in Premiere Pro, and Avid and Final Cut have their own equivalents.',
      works: 'Cinderella / Cendrillon (Georges Méliès, 1899) · Psycho (Alfred Hitchcock, 1960; the dissolve from the shower drain to Marion’s eye) · Apocalypse Now (Francis Ford Coppola, 1979; the opening dissolves between Willard and the burning jungle)',
      tech: ['Linear opacity mix', 'Dip to black / white', 'Additive vs. normal dissolve'],
      accent: '#ff5a1f',
      motionDNA: 'Nothing moves: only opacity changes, on a linear ramp. Two seconds of cross-dissolve with a long, muddy middle where both shots are half there; a quicker dip through black that empties the frame for an instant before the next shot rises; a one-second dip through white; then a held comparison where a normal and an additive dissolve play the same cut side by side.',
      visualDNA: 'The Technique Atlas stage around a framed program monitor showing five Token shots (orange, blue, ink with the word, outline, orange with the word); layer-opacity bars and a probe crosshair with swatches for A, B and the mixed pixel on a side panel; then two monitors with formulas and paper-luma meters, the additive one flaring to white at the midpoint.',
      transitions: 'Cross-dissolve, dip to black, dip to white, normal and additive dissolve on the same cut',
      implementation: ['Premiere Pro Cross Dissolve / Dip to Black / Dip to White / Additive Dissolve', 'After Effects layer opacity keyframes · Avid and Final Cut dissolves', 'Canvas 2D: globalAlpha over the outgoing shot; globalCompositeOperation lighter on offscreen shots for the additive mix'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { bA: offscreen(960, 540), bB: offscreen(960, 540) }; },
    draw(c, t, W, H, st) {
      TK.stage(c, W, H);
      const ph = dPhase(t);
      const xd = seg(t, ...DX.xd), db = seg(t, ...DX.db), dw = seg(t, ...DX.dw), ad = seg(t, ...DX.ad);
      const fadeIn = E.outC(seg(t, 0.1, 0.5));
      if (ph !== 'ad') {
        // ---------------- single program monitor ----------------
        let rows, head, formula, mon;
        if (ph === 'xd') {
          dIn(c, DVM, () => { dShot(c, 0); if (xd > 0) { c.globalAlpha = xd; dShot(c, 1); } });
          head = 'CROSS-DISSOLVE'; formula = 'OUT = A · (1 − u) + B · u';
          rows = [['A  ·  ' + D_NAMES[0], 1 - xd, P.accent], ['B  ·  ' + D_NAMES[1], xd, P.blue]];
          mon = `${D_NAMES[0]}  →  ${D_NAMES[1]}`;
        } else {
          const blk = ph === 'db', u = blk ? db : dw, a = blk ? 1 : 2, b = blk ? 2 : 3, plate = blk ? '#000000' : '#ffffff';
          dIn(c, DVM, () => {
            c.fillStyle = plate; c.fillRect(0, 0, 1920, 1080);
            if (u < 0.5) { c.globalAlpha = 1 - 2 * u; dShot(c, a); } else { c.globalAlpha = 2 * u - 1; dShot(c, b); }
          });
          head = blk ? 'DIP TO BLACK' : 'DIP TO WHITE';
          formula = u < 0.5 ? `OUT = ${blk ? 'BLACK' : 'WHITE'} + (A − ${blk ? 'BLACK' : 'WHITE'}) · (1 − 2u)` : `OUT = ${blk ? 'BLACK' : 'WHITE'} + (B − ${blk ? 'BLACK' : 'WHITE'}) · (2u − 1)`;
          rows = [['A  ·  ' + D_NAMES[a], clamp(1 - 2 * u), a === 1 ? P.blue : P.ink],
            [blk ? 'PLATE  ·  BLACK' : 'PLATE  ·  WHITE', 1 - Math.abs(1 - 2 * u), blk ? P.ink : '#ffffff'],
            ['B  ·  ' + D_NAMES[b], clamp(2 * u - 1), b === 2 ? P.ink : P.mute]];
          mon = `${D_NAMES[a]}  →  ${blk ? 'BLACK' : 'WHITE'}  →  ${D_NAMES[b]}`;
        }
        dFrame(c, DVM);
        label(c, 'PROGRAM', DVM.x, DVM.y - 18, { size: 15, ls: 3, color: P.ink, weight: 700 });
        label(c, mon, DVM.x + DVM.w, DVM.y - 18, { size: 15, ls: 2, align: 'right' });
        const u = ph === 'xd' ? xd : ph === 'db' ? db : dw;
        // side panel
        c.save(); c.globalAlpha = fadeIn;
        tag(c, head, DPX, 150);
        label(c, formula, DPX, 190, { size: 15, ls: 1, color: P.ink });
        label(c, `u = ${u.toFixed(2)}   ·   LINEAR`, DPX, 220, { size: 15, ls: 2 });
        rows.forEach(([n, v, col], i) => meter(c, DPX, 290 + i * 74, DPW, n, v, `${Math.round(v * 100)}%`, col, { outline: col === '#ffffff' }));
        c.restore();
        if (ph === 'xd') {
          // probe pixel where both Tokens overlap
          const px = DVM.x + DPROBE[0] * DVM.w / 1920, py = DVM.y + DPROBE[1] * DVM.h / 1080, pv = fadeIn * (1 - seg(t, 3.2, 3.4));
          c.save(); c.globalAlpha = pv;
          c.strokeStyle = '#ffffff'; c.lineWidth = 5; c.beginPath(); c.arc(px, py, 16, 0, TAU); c.stroke();
          c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.arc(px, py, 16, 0, TAU);
          c.moveTo(px - 30, py); c.lineTo(px - 8, py); c.moveTo(px + 8, py); c.lineTo(px + 30, py);
          c.moveTo(px, py - 30); c.lineTo(px, py - 8); c.moveTo(px, py + 8); c.lineTo(px, py + 30); c.stroke();
          label(c, 'PROBE', px + 26, py - 22, { size: 14, ls: 2, color: P.ink, weight: 700 });
          const out = mixRGB(P.accent, P.blue, xd);
          const sw = [['A', P.accent], ['B', P.blue], ['OUT', rgbHex(out)]];
          label(c, 'PROBE PIXEL', DPX, 470, { size: 15, ls: 3, color: P.ink, weight: 700 });
          sw.forEach(([n, col], i) => {
            const x = DPX + i * 168, y = 488, s = i === 2 ? 120 : 88;
            c.fillStyle = col; c.fillRect(x, y, s, s);
            c.strokeStyle = 'rgba(23,24,28,0.3)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, s, s);
            label(c, n, x, y + s + 24, { size: 15, ls: 2, color: P.ink, weight: 700 });
            label(c, col.toUpperCase(), x, y + s + 46, { size: 13, ls: 1 });
            if (i < 2) label(c, i ? '=' : '+', x + 128, y + 54, { size: 26, color: P.ink, align: 'center', weight: 700 });
          });
          const mud = clamp(1 - Math.abs(xd - 0.5) / 0.18) * pv;
          if (mud > 0.01) {
            c.globalAlpha = mud;
            c.fillStyle = P.accent; c.fillRect(DPX, 672, DPW, 54);
            label(c, '50 / 50  ·  BOTH HALF THERE', DPX + 18, 696, { size: 17, ls: 2, color: '#ffffff', weight: 700 });
            label(c, 'NEITHER SHAPE HAS FULL CONTRAST', DPX + 18, 717, { size: 13, ls: 2, color: '#ffffff' });
          }
          c.restore();
        } else {
          // the plate swatch, big
          const blk = ph === 'db', u2 = blk ? db : dw, on = 1 - Math.abs(1 - 2 * u2);
          label(c, blk ? 'THE FRAME EMPTIES TO BLACK' : 'THE FRAME FLASHES TO WHITE', DPX, 540, { size: 15, ls: 2, color: P.ink, weight: 700, alpha: fadeIn });
          label(c, 'BEFORE THE NEXT SHOT RISES', DPX, 564, { size: 15, ls: 2, alpha: fadeIn });
          c.save(); c.fillStyle = blk ? '#000' : '#fff'; c.globalAlpha = 0.25 + 0.75 * on;
          c.fillRect(DPX, 590, 120, 120); c.restore();
          c.strokeStyle = 'rgba(23,24,28,0.3)'; c.lineWidth = 1; c.strokeRect(DPX + 0.5, 590.5, 120, 120);
          label(c, `PLATE ${Math.round(on * 100)}%`, DPX + 140, 660, { size: 16, ls: 2, color: P.ink, weight: 700 });
        }
        // caption curve
        if (ph === 'xd') {
          TK.caption(c, t, W, H, { name: 'Dissolve', cat: 'Transitions', curve: u2 => u2, span: DX.xd, lo: -0.1, hi: 1.15, curveLabel: 'OPACITY  B  ·  A (DASH)' });
          graphOverlay(c, W, H, u2 => 1 - u2, { lo: -0.1, hi: 1.15, color: P.accent });
        } else {
          TK.caption(c, t, W, H, { name: 'Dissolve', cat: 'Transitions', curve: u2 => Math.abs(1 - 2 * u2), span: ph === 'db' ? DX.db : DX.dw, lo: -0.1, hi: 1.15, curveLabel: 'PICTURE OPACITY / TIME' });
        }
        return;
      }
      // ---------------- normal vs additive, side by side ----------------
      const lay = E.ioC(seg(t, ...DX.lay));
      const gA = st.bA.getContext('2d'), gB = st.bB.getContext('2d');
      gA.setTransform(0.5, 0, 0, 0.5, 0, 0); dShot(gA, 3);
      gB.setTransform(0.5, 0, 0, 0.5, 0, 0); dShot(gB, 4);
      const RL = dRect(DVM, DVL, lay), RR = dRect({ x: 1920, y: DVR.y, w: DVR.w, h: DVR.h }, DVR, lay);
      const mon = (R, add) => {
        c.save(); c.beginPath(); c.rect(R.x, R.y, R.w, R.h); c.clip();
        if (add) {
          const [a, b] = dAddW(ad);
          c.fillStyle = '#000'; c.fillRect(R.x, R.y, R.w, R.h);
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha = a; c.drawImage(st.bA, R.x, R.y, R.w, R.h);
          if (b > 0) { c.globalAlpha = b; c.drawImage(st.bB, R.x, R.y, R.w, R.h); }
        } else {
          c.drawImage(st.bA, R.x, R.y, R.w, R.h);
          if (ad > 0) { c.globalAlpha = ad; c.drawImage(st.bB, R.x, R.y, R.w, R.h); }
        }
        c.restore();
        dFrame(c, R);
      };
      mon(RL, false); mon(RR, true);
      const on = seg(t, 6.6, 6.9);
      const [a, b] = dAddW(ad), lumN = D_PAPER, lumA = Math.min(1, (a + b) * D_PAPER);
      [[DVL, false], [DVR, true]].forEach(([R, add]) => {
        const x = R.x;
        tag(c, add ? 'ADDITIVE DISSOLVE' : 'NORMAL DISSOLVE', x, R.y - 26, on);
        label(c, add ? 'LIGHTER' : 'SOURCE-OVER', x + R.w, R.y - 26, { size: 15, ls: 2, align: 'right', alpha: on });
        label(c, add ? 'OUT = A · min(1, 2(1−u)) + B · min(1, 2u)' : 'OUT = A · (1 − u) + B · u', x, R.y + R.h + 40, { size: 15, ls: 1, color: P.ink, alpha: on });
        const wa = add ? a : 1 - ad, wb = add ? b : ad;
        label(c, `A ${Math.round(wa * 100)}%  +  B ${Math.round(wb * 100)}%  =  ${Math.round((wa + wb) * 100)}% LIGHT`, x, R.y + R.h + 68, { size: 15, ls: 2, color: add && wa + wb > 1.05 ? P.accentD : P.mute, weight: 700, alpha: on });
        const lum = add ? lumA : lumN;
        c.save(); c.globalAlpha *= on;
        meter(c, x, R.y + R.h + 112, R.w, 'PAPER LUMA', lum, add && lum > 0.995 ? 'CLIPPED  100%' : `${Math.round(lum * 100)}%`, add ? P.accent : P.mute, { vcol: add && lum > 0.995 ? P.accentD : P.ink });
        c.fillStyle = P.ink; c.fillRect(x + R.w - 1, R.y + R.h + 118, 2, 30);
        c.restore();
      });
      const bump = clamp(1 - Math.abs(ad - 0.5) / 0.3) * on;
      label(c, 'BRIGHTNESS BUMP  ·  BOTH LAYERS NEAR FULL, LIGHT ADDS UP', DVR.x + DVR.w, DVR.y + DVR.h + 186, { size: 14, ls: 2, color: P.accentD, weight: 700, align: 'right', alpha: bump });
      label(c, `${D_NAMES[3]}  →  ${D_NAMES[4]}   ·   u = ${ad.toFixed(2)}`, 960, 120, { size: 15, ls: 2, align: 'center', color: P.ink, alpha: on });
      TK.caption(c, t, W, H, { name: 'Dissolve', cat: 'Transitions', curve: u => dAddW(u)[0] + dAddW(u)[1], span: DX.ad, lo: -0.1, hi: 2.2, curveLabel: 'LIGHT A+B  ·  ADD / NORM' });
      graphOverlay(c, W, H, () => 1, { lo: -0.1, hi: 2.2 });
    },
    score(A) {
      TK.bed(A);
      // cross-dissolve: the outgoing tone fades as the incoming one swells, crossing at the midpoint
      A.osc(0.3, { type: 'triangle', f: midi(64), dur: 3.0, g: 0.06, a: 0.4, lp: 2200, rev: 0.4, pan: -0.3 });
      A.osc(DX.xd[0], { type: 'triangle', f: midi(71), dur: 3.0, g: 0.06, a: 2.3, lp: 2200, rev: 0.4, pan: 0.3 });
      A.noise(DX.xd[0], { type: 'bandpass', f: 1400, q: 0.8, dur: DX.xd[1] - DX.xd[0], g: 0.035, swell: 0.5, rev: 0.4 });
      A.bell(DX.xd[1], midi(83), { g: 0.06, dur: 1.4, rev: 0.5 });
      // dip to black: everything sinks to a low hush at black, then rises
      const dbm = (DX.db[0] + DX.db[1]) / 2;
      A.osc(DX.db[0], { type: 'triangle', f: midi(59), f2: midi(47), glide: dbm - DX.db[0], dur: dbm - DX.db[0] + 0.1, g: 0.06, lp: 1600, rev: 0.3 });
      A.osc(dbm, { f: 55, dur: 0.6, g: 0.18, a: 0.01 });
      A.osc(dbm, { type: 'triangle', f: midi(48), f2: midi(60), glide: DX.db[1] - dbm, dur: DX.db[1] - dbm + 0.3, g: 0.06, a: 0.3, lp: 1800, rev: 0.4 });
      A.pluck(DX.db[1], midi(72), { g: 0.15, bright: 0.6, dur: 1.2, rev: 0.3 });
      // dip to white: a bright shimmer peaking on the white frame
      const dwm = (DX.dw[0] + DX.dw[1]) / 2;
      A.noise(DX.dw[0], { type: 'highpass', f: 5000, dur: DX.dw[1] - DX.dw[0], g: 0.06, swell: 0.5, rev: 0.4 });
      A.bell(dwm, midi(88), { g: 0.07, dur: 1.2, rev: 0.6 });
      A.pluck(DX.dw[1], midi(76), { g: 0.14, bright: 0.7, dur: 1.2, rev: 0.3 });
      // split: two dissolves at once; the additive one gets a bright swell at the midpoint
      A.whoosh(DX.lay[0], 0.5, { g: 0.09, f1: 600, f2: 2600 });
      A.osc(DX.ad[0], { type: 'triangle', f: midi(67), dur: 2.4, g: 0.05, a: 0.3, lp: 2000, rev: 0.4, pan: -0.4 });
      A.chord(DX.ad[0] + 0.5, [72, 76, 79], { type: 'sawtooth', dur: 1.0, g: 0.02, a: 0.45, lp: 3400, rev: 0.5, width: 0.6, pan: 0.4 });
      A.noise(DX.ad[0] + 0.2, { type: 'bandpass', f: 3000, q: 0.7, dur: 1.6, g: 0.07, swell: 0.5, rev: 0.4, pan: 0.4 });
      A.chord(DX.ad[1], [60, 64, 67, 72], { type: 'triangle', dur: 1.6, g: 0.035, a: 0.05, lp: 2400, rev: 0.6, width: 0.8 });
      A.bell(DX.ad[1], midi(84), { g: 0.06, dur: 1.6, rev: 0.5 });
    },
  });

  /* =====================================================================
     SQUASH & STRETCH — the first principle: a body deforms with its
     motion but keeps its volume. The Token hops back and forth on the
     beat; in flight it stretches along its velocity vector (the axis
     tilts with the arc), on contact it is planted and squashes flat and
     wide, and the deformation is always an area-preserving matrix, so
     sx·sy = 1 (read out live with a deformed unit square). A rigid Token
     makes the same hops beside it. Then three Tokens drop together:
     just right, too much, and a squash that forgets to widen — the area
     readout falls and it looks like it shrinks.
     ===================================================================== */
  const SQ = { S: 190, Hh: 360, w: 0.075, X: [[200, 720], [1200, 1720]], c1: 1.0, n1: 5, c2: 6.5, n2: 3, cols: [380, 960, 1540], S2: 150, Hh2: 270 };
  const SQV = 4 * SQ.Hh / (1 - 2 * SQ.w);   // vertical speed at contact
  // Hop state: contacts at c0, c0+1, … (n of them), apex held before the first.
  function sqHop(t, c0, n, Hh) {
    const w = SQ.w, r = Math.max(t - c0, -0.5), ci = Math.round(r);
    if (r > n - 1 + w) return { h: 0, vy: 0, k: n - 1, p: 1, planted: false, rest: true, ci: n - 1 };
    if (ci >= 0 && ci <= n - 1 && Math.abs(r - ci) < w) return { h: 0, vy: 0, planted: true, u: (r - ci + w) / (2 * w), ci, k: ci };
    const k = Math.floor(r), p = clamp((r - k - w) / (1 - 2 * w));
    return { h: 4 * Hh * p * (1 - p), vy: 4 * Hh * (1 - 2 * p) / (1 - 2 * w), k, p, planted: false };
  }
  // 2×2 area-preserving stretch of factor s along angle th: R(th)·diag(s,1/s)·R(−th) → [a b c d] (canvas order)
  function sqAlong(s, th) {
    const co = Math.cos(th), si = Math.sin(th), i = 1 / s;
    return [s * co * co + i * si * si, (s - i) * si * co, (s - i) * si * co, s * si * si + i * co * co];
  }
  const sqMul = (M, N) => [M[0] * N[0] + M[2] * N[1], M[1] * N[0] + M[3] * N[1], M[0] * N[2] + M[2] * N[3], M[1] * N[2] + M[3] * N[3]];
  function sqSV(M) {   // singular values
    const T = M[0] * M[0] + M[1] * M[1] + M[2] * M[2] + M[3] * M[3], D = M[0] * M[3] - M[1] * M[2];
    const q = Math.sqrt(Math.max(0, T * T / 4 - D * D));
    return [Math.sqrt(T / 2 + q), Math.sqrt(Math.max(0, T / 2 - q))];
  }
  // Deformation for a hop state. mode: 'keep' (volume kept) or 'lose' (only the vertical axis scales).
  function sqPose(b, vx, kS, kQ, mode = 'keep') {
    let M = [1, 0, 0, 1];
    const stretchAt = (vy, amt) => {
      const sp = Math.hypot(vx, vy) / SQV, s = 1 + kS * sp * amt;
      if (mode === 'lose') return [1, 0, 0, s];
      return sqAlong(s, Math.atan2(-vy, vx || 1e-6));
    };
    if (b.rest) return M;
    if (b.planted) {
      const e = Math.sin(PI * b.u), q = 1 - kQ * e;
      const vy = b.u < 0.5 ? -SQV : SQV;
      const St = stretchAt(vy, 1 - e);
      const Sq = mode === 'lose' ? [1, 0, 0, q] : [1 / q, 0, 0, q];
      M = sqMul(St, Sq);
    } else {
      M = stretchAt(b.vy, 1);
    }
    return M;
  }
  function sqToken(c, x, h, M, S, o = {}) {
    const hy = S / 2 * (Math.abs(M[1]) + Math.abs(M[3])), cy = TK.FLOOR - h - hy;
    const wx = S * (Math.abs(M[0]) + Math.abs(M[2]));
    TK.shadow(c, x, TK.FLOOR, wx, h);
    c.save(); c.translate(x, cy); c.transform(M[0], M[1], M[2], M[3], 0, 0);
    if (o.ref) {   // dashed undeformed outline, unscaled
      c.restore(); c.save(); c.translate(x, TK.FLOOR - h - S / 2);
      c.setLineDash([6, 7]); c.strokeStyle = 'rgba(23,24,28,0.3)'; c.lineWidth = 2; c.strokeRect(-S / 2, -S / 2, S, S);
      c.restore(); c.save(); c.translate(x, cy); c.transform(M[0], M[1], M[2], M[3], 0, 0);
    }
    TK.tokenPath(c, S); c.fillStyle = o.color || P.accent; c.fill('evenodd');
    c.restore();
    return cy;
  }
  // Readout box: a deformed unit square in a dashed reference square, the two axis scales and the area.
  function sqReadout(c, x, y, M, title, o = {}) {
    const [s1, s2] = sqSV(M), area = Math.abs(M[0] * M[3] - M[1] * M[2]), bad = Math.abs(area - 1) > 0.02;
    c.save(); if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
    const bw = o.w || 470;
    c.fillStyle = 'rgba(236,232,223,0.92)'; c.fillRect(x - bw / 2, y, bw, 92);
    c.strokeStyle = 'rgba(23,24,28,0.25)'; c.lineWidth = 1; c.strokeRect(x - bw / 2 + 0.5, y + 0.5, bw, 92);
    const ix = x - bw / 2 + 50, iy = y + 46, u = 30;
    c.setLineDash([4, 4]); c.strokeStyle = 'rgba(23,24,28,0.4)'; c.strokeRect(ix - u / 2, iy - u / 2, u, u); c.setLineDash([]);
    c.save(); c.beginPath(); c.rect(x - bw / 2 + 4, y + 4, 92, 84); c.clip();
    c.translate(ix, iy); c.transform(M[0], M[1], M[2], M[3], 0, 0);
    c.fillStyle = bad ? P.accentD : P.accent; c.globalAlpha *= 0.85; c.fillRect(-u / 2, -u / 2, u, u); c.restore();
    label(c, title, x - bw / 2 + 100, y + 28, { size: 15, ls: 2, color: P.ink, weight: 700 });
    label(c, `LONG ×${s1.toFixed(2)}   SHORT ×${s2.toFixed(2)}`, x - bw / 2 + 100, y + 54, { size: 15, ls: 1, color: P.ink });
    label(c, `AREA  sx·sy = ${area.toFixed(2)}`, x - bw / 2 + 100, y + 78, { size: 15, ls: 1, color: bad ? P.accentD : P.mute, weight: 700 });
    c.restore();
  }
  const sqX = (b, side) => {
    const X = SQ.X[side], xk = k => X[((k % 2) + 2) % 2];
    if (b.rest || b.planted) return xk(b.ci);
    return lerp(xk(b.k), xk(b.k + 1), b.p);
  };
  const sqVx = (b, side) => {
    if (b.rest || b.planted) return 0;
    const X = SQ.X[side], xk = k => X[((k % 2) + 2) % 2];
    return (xk(b.k + 1) - xk(b.k)) / (1 - 2 * SQ.w);
  };
  const SQ_COLS = [
    { name: 'JUST RIGHT', note: 'VOLUME KEPT', kS: 0.32, kQ: 0.36, mode: 'keep' },
    { name: 'TOO MUCH', note: 'RUBBER, NOT A SOLID', kS: 1.0, kQ: 0.68, mode: 'keep' },
    { name: 'VOLUME LOST', note: 'SQUASH WITHOUT WIDENING', kS: 0.32, kQ: 0.36, mode: 'lose' },
  ];
  // vertical scale of the left Token across section 1, for the caption graph
  const sqCurveY = u => { const t = 0.5 + u * 5; const b = sqHop(t, SQ.c1, SQ.n1, SQ.Hh); return sqPose(b, sqVx(b, 0), 0.45, 0.42)[3]; };
  const sqCurveX = u => { const t = 0.5 + u * 5; const b = sqHop(t, SQ.c1, SQ.n1, SQ.Hh); return sqPose(b, sqVx(b, 0), 0.45, 0.42)[0]; };

  MG.film({
    id: 'techsquash', dur: 10, poster: 1.8,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Squash & Stretch', sub: 'Deform with the motion, keep the volume', era: '1930s —',
      origin: 'Disney’s animators of the early 1930s found that drawings read as alive when a body stretched in fast motion and squashed on impact, provided it never seemed to gain or lose bulk. Frank Thomas and Ollie Johnston put it first of the twelve principles in The Illusion of Life (1981), illustrated by the half-filled flour sack that slumps, stretches and folds without changing its volume. John Lasseter carried it into computer animation in his SIGGRAPH paper Principles of Traditional Animation Applied to 3D Computer Animation (1987), and in software it is a scale with x and y set to reciprocals.',
      works: 'The Illusion of Life: Disney Animation (Frank Thomas and Ollie Johnston, 1981; the flour-sack drawings) · Principles of Traditional Animation Applied to 3D Computer Animation (John Lasseter, SIGGRAPH 1987) · Snow White and the Seven Dwarfs (Walt Disney Productions, 1937)',
      tech: ['Stretch along the velocity vector', 'Squash on contact', 'Area-preserving scale, sx·sy = 1'],
      accent: '#ff5a1f',
      motionDNA: 'Hops on the beat with gravity arcs. In flight the Token stretches in proportion to its speed along the direction of travel, so the axis tilts over the arc and the shape is rounder at the apex; on the contact frames it is planted and squashes flat and wide, then springs out stretched the other way. A rigid twin keeps the same timing and reads as stone. Then three drops compare restraint, excess and a squash that loses volume.',
      visualDNA: 'The Technique Atlas stage with its floor band split down the middle; the orange Token with a dashed undeformed outline and a velocity arrow on the left, a darker rigid Token on the right; readout boxes with a deformed unit square, long and short axis scales and the area; three columns for the extremes; scale-x and scale-y curves in the caption.',
      transitions: 'Side-by-side comparison into three columns dropped on the same beat',
      implementation: ['After Effects scale with linked reciprocal X/Y (expressions) or a squash-and-stretch rig', 'Spine, Rive and Maya squash deformers that preserve volume', 'Canvas 2D: R(θ)·diag(s, 1/s)·R(−θ) applied with transform(), θ from the velocity'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const F = TK.FLOOR;
      TK.stage(c, W, H, { floor: F });
      const one = 1 - seg(t, 5.55, 5.8), two = seg(t, 5.75, 6.05);
      if (one > 0.005) {
        c.save(); c.globalAlpha = one;
        // split line
        c.setLineDash([8, 10]); c.strokeStyle = 'rgba(23,24,28,0.25)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(960, 70); c.lineTo(960, F - 10); c.stroke(); c.setLineDash([]);
        tag(c, 'SQUASH & STRETCH', 120, 110);
        tag(c, 'RIGID', 1100, 110);
        label(c, 'SAME HOPS  ·  SAME TIMING', 1820, 110, { size: 15, ls: 2, align: 'right' });
        const b = sqHop(t, SQ.c1, SQ.n1, SQ.Hh);
        [0, 1].forEach(side => {
          const x = sqX(b, side), vx = sqVx(b, side);
          if (side === 0) {
            const M = sqPose(b, vx, 0.45, 0.42);
            const cy = sqToken(c, x, b.h, M, SQ.S, { ref: true });
            // velocity arrow
            const sp = Math.hypot(vx, b.vy);
            if (!b.planted && !b.rest && sp > 150) {
              const ang = Math.atan2(-b.vy, vx), L = 60 + 120 * sp / SQV, ax = x + Math.cos(ang) * (SQ.S * 0.75), ay = cy + Math.sin(ang) * (SQ.S * 0.75);
              const bx = ax + Math.cos(ang) * L, by = ay + Math.sin(ang) * L;
              c.strokeStyle = P.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
              c.fillStyle = P.ink; c.beginPath(); c.moveTo(bx + Math.cos(ang) * 14, by + Math.sin(ang) * 14);
              c.lineTo(bx + Math.cos(ang + 2.4) * 14, by + Math.sin(ang + 2.4) * 14); c.lineTo(bx + Math.cos(ang - 2.4) * 14, by + Math.sin(ang - 2.4) * 14); c.fill();
              // stretch axis through the body
              c.setLineDash([3, 6]); c.strokeStyle = 'rgba(198,62,12,0.6)'; c.lineWidth = 2; c.beginPath();
              c.moveTo(x - Math.cos(ang) * SQ.S, cy - Math.sin(ang) * SQ.S); c.lineTo(x + Math.cos(ang) * SQ.S * 0.7, cy + Math.sin(ang) * SQ.S * 0.7); c.stroke(); c.setLineDash([]);
              label(c, 'v', bx + 16, by + 4, { size: 18, color: P.ink, weight: 700 });
            }
            if (b.planted && Math.sin(PI * b.u) > 0.6) label(c, 'CONTACT  ·  SQUASH', x, F + 34, { size: 15, ls: 2, align: 'center', color: P.accentD, weight: 700 });
            sqReadout(c, 480, 136, M, b.planted ? 'SQUASH  ·  PLANTED' : b.rest || Math.hypot(vx, b.vy) < 200 ? 'APEX  ·  NEAR ROUND' : 'STRETCH  ·  ALONG v', { w: 480 });
          } else {
            TK.shadow(c, x, F, SQ.S, b.h);
            TK.token(c, x, F - b.h - SQ.S / 2, SQ.S, { color: P.accentD });
            sqReadout(c, 1440, 136, [1, 0, 0, 1], 'NO DEFORMATION  ·  READS AS STONE', { w: 480 });
          }
        });
        c.restore();
      }
      if (two > 0.005) {
        c.save(); c.globalAlpha = two;
        tag(c, 'THE EXTREMES', 120, 110);
        label(c, 'SAME DROP  ·  THREE AMOUNTS', 1820, 110, { size: 15, ls: 2, align: 'right' });
        const b = sqHop(t, SQ.c2, SQ.n2, SQ.Hh2);
        SQ_COLS.forEach((o, i) => {
          const x = SQ.cols[i], M = sqPose(b, 0, o.kS, o.kQ, o.mode);
          sqToken(c, x, b.h, M, SQ.S2, { ref: true, color: o.mode === 'lose' ? P.accentL : P.accent });
          label(c, o.name, x, 172, { size: 20, ls: 3, align: 'center', color: P.ink, weight: 700 });
          label(c, o.note, x, 200, { size: 14, ls: 2, align: 'center', color: o.mode === 'lose' || i === 1 ? P.accentD : P.mute });
          sqReadout(c, x, 236, M, o.mode === 'lose' ? 'sy ONLY' : `k = ${o.kQ.toFixed(2)}`, { w: 420 });
        });
        c.restore();
      }
      if (t < 5.7) {
        TK.caption(c, t, W, H, { name: 'Squash & Stretch', cat: 'Timing', curve: sqCurveY, span: [0.5, 5.5], lo: -0.2, hi: 1.75, curveLabel: 'SCALE  Y  ·  X (DASH)' });
        graphOverlay(c, W, H, sqCurveX, { lo: -0.2, hi: 1.75, color: P.accent });
      } else {
        const fy = u => { const b = sqHop(6 + u * 3, SQ.c2, SQ.n2, SQ.Hh2); const M = sqPose(b, 0, 0.32, 0.36, 'lose'); return M[0] * M[3]; };
        const fk = u => { const b = sqHop(6 + u * 3, SQ.c2, SQ.n2, SQ.Hh2); const M = sqPose(b, 0, 0.32, 0.36); return M[0] * M[3]; };
        TK.caption(c, t, W, H, { name: 'Squash & Stretch', cat: 'Timing', curve: fy, span: [6, 9], lo: -0.2, hi: 1.75, curveLabel: 'AREA  LOST · KEPT (DASH)' });
        graphOverlay(c, W, H, fk, { lo: -0.2, hi: 1.75, color: P.accent });
      }
    },
    score(A) {
      TK.bed(A);
      const boink = (t, g, f = 330, wob = 0) => {
        A.osc(t, { f: 140, f2: 60, glide: 0.08, dur: 0.16, g: 0.22 * g, a: 0.002 });
        A.osc(t, { type: 'triangle', f, f2: f * 1.8, glide: 0.08, dur: 0.22, g: 0.11 * g, rev: 0.15, vib: wob ? [wob, f * 0.1] : undefined });
      };
      const knock = (t, g) => {   // rigid: a dry wood-block click
        A.noise(t, { type: 'bandpass', f: 1100, q: 6, dur: 0.06, g: 0.16 * g });
        A.osc(t, { f: 780, f2: 700, dur: 0.05, g: 0.08 * g, a: 0.001 });
      };
      for (let k = 0; k < SQ.n1; k++) {
        const t = SQ.c1 + k;
        boink(t, 1, 330 + (k % 2) * 60);
        knock(t + 0.004, 0.9);
        A.whoosh(t + 0.06, 0.4, { g: 0.04, f1: 500, f2: 2200, pan: -0.3 });   // stretch out of the squash
      }
      A.whoosh(5.6, 0.5, { g: 0.08, f1: 2400, f2: 500 });
      for (let k = 0; k < SQ.n2; k++) {
        const t = SQ.c2 + k;
        boink(t, 0.8, 392, 0);                                      // just right
        A.osc(t, { type: 'triangle', f: 196, f2: 420, glide: 0.25, dur: 0.6, g: 0.07, vib: [11, 30], rev: 0.25 });   // too much: a long wobbly boing
        A.noise(t + 0.01, { type: 'lowpass', f: 900, f2: 200, dur: 0.3, g: 0.07 });   // volume lost: a deflating puff
      }
      A.chord(9.0, [60, 64, 67, 72], { type: 'triangle', dur: 1.0, g: 0.03, a: 0.05, lp: 2400, rev: 0.5, width: 0.7 });
    },
  });

  /* =====================================================================
     FOLLOW-THROUGH — overlapping action. The Token carries an antenna of
     four linked segments with a ball on the tip. Each segment is a damped
     angular spring pulled toward the angle of the one below it, and the
     first one toward upright, kicked by the body's acceleration; so every
     segment lags its parent by a few frames (drag), and when the body
     stops dead the antenna keeps going, overshoots and settles one segment
     after another. The chain is simulated once in setup at 1200 Hz and
     sampled at 120 Hz. Onion skins show the last few frames of the
     antenna, a dashed rigid antenna shows what stopping dead looks like,
     and a chart plots each segment's angle with its lag in frames.
     ===================================================================== */
  const FT = {
    S: 180, L: 54, N: 4, x0: 340, moves: [[0.8, 1.6, 340, 1160], [4.4, 4.95, 1160, 620], [6.9, 7.3, 620, 940]],
    rate: 120, chart: { x: 1080, y: 104, w: 760, h: 270 },
  };
  function ftX(t) {
    let x = FT.x0;
    for (const [t0, t1, a, b] of FT.moves) if (t >= t0) x = lerp(a, b, E.ioC(seg(t, t0, t1)));
    return x;
  }
  function ftSim() {
    const dt = 1 / 1200, steps = 12000, every = 1200 / FT.rate;
    const th = new Float64Array(FT.N), om = new Float64Array(FT.N);
    const out = [];   // out[k] = [θ0..θ3] at k / rate
    const wN = [9, 8.55, 8.12, 7.72], z = 0.3, drag = 2.5, kick = 0.0018;
    const acc = t => (ftX(t + 0.002) - 2 * ftX(t) + ftX(t - 0.002)) / (0.002 * 0.002);
    for (let s = 0; s <= steps; s++) {
      const t = s * dt;
      if (s % every === 0) out.push(Array.from(th));
      const a = acc(t);
      for (let i = 0; i < FT.N; i++) {
        const tgt = i ? th[i - 1] : 0, tv = i ? om[i - 1] : 0;
        const al = -wN[i] * wN[i] * (th[i] - tgt) - 2 * z * wN[i] * (om[i] - tv) - drag * om[i] - (i ? 0.4 : 1) * kick * a;
        om[i] += al * dt;
      }
      for (let i = 0; i < FT.N; i++) th[i] += om[i] * dt;
    }
    // per-segment peak after the first stop (positive swing), in frames at 30 fps
    const t1 = FT.moves[0][1], peaks = [];
    for (let i = 0; i < FT.N; i++) {
      let best = -1, bk = 0;
      for (let k = Math.round(t1 * FT.rate); k < Math.round((t1 + 1) * FT.rate); k++) if (out[k][i] > best) { best = out[k][i]; bk = k; }
      peaks.push({ t: bk / FT.rate, v: best });
    }
    let mx = 0; out.forEach(r => r.forEach(v => { mx = Math.max(mx, Math.abs(v)); }));
    return { out, peaks, mx };
  }
  function ftAng(st, t) {
    const f = clamp(t, 0, 10) * FT.rate, k = Math.min(Math.floor(f), st.out.length - 2), u = f - k;
    return st.out[k].map((v, i) => lerp(v, st.out[k + 1][i], u));
  }
  // joint positions from the body top centre
  function ftChain(x, yTop, th) {
    const pts = [[x, yTop]];
    for (let i = 0; i < FT.N; i++) { const [px, py] = pts[i]; pts.push([px + Math.sin(th[i]) * FT.L, py - Math.cos(th[i]) * FT.L]); }
    return pts;
  }
  function ftDrawChain(c, pts, o = {}) {
    c.save(); if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (o.dash) c.setLineDash(o.dash);
    c.strokeStyle = o.color || P.ink; c.lineWidth = o.lw || 7;
    c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); c.setLineDash([]);
    if (o.joints) {
      for (let i = 1; i < pts.length - 1; i++) { c.fillStyle = P.ground; c.beginPath(); c.arc(pts[i][0], pts[i][1], 8, 0, TAU); c.fill(); c.strokeStyle = P.ink; c.lineWidth = 3; c.stroke(); }
    }
    const [tx, ty] = pts[pts.length - 1];
    c.fillStyle = o.tip || P.accent; c.beginPath(); c.arc(tx, ty, o.tipR || 16, 0, TAU); c.fill();
    if (o.tipEdge) { c.strokeStyle = o.color || P.ink; c.lineWidth = 2; c.stroke(); }
    c.restore();
  }
  const FT_SEGC = ['rgba(23,24,28,0.4)', 'rgba(23,24,28,0.75)', '#e0723f', P.accent];

  MG.film({
    id: 'techfollowthrough', dur: 10, poster: 1.95,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Follow-through', sub: 'The body stops, the loose parts keep going', era: '1930s —',
      origin: 'Disney’s animators described how the loose parts of a character — ears, tail, clothing, hair — trail behind the main mass, keep moving after it stops and settle one after another. Frank Thomas and Ollie Johnston named the pair Follow Through and Overlapping Action, the fifth of the twelve principles in The Illusion of Life (1981); John Lasseter restated it for computer animation at SIGGRAPH in 1987, and Richard Williams drilled it as drag and overlap with tails and flags in The Animator’s Survival Kit (2001). Riggers now get it from delayed or spring-driven secondary chains.',
      works: 'The Illusion of Life: Disney Animation (Frank Thomas and Ollie Johnston, 1981) · Principles of Traditional Animation Applied to 3D Computer Animation (John Lasseter, SIGGRAPH 1987) · The Animator’s Survival Kit (Richard Williams, 2001; drag, overlap and the flag)',
      tech: ['Chain of lagging damped springs', 'Drag: each segment a few frames behind', 'Overshoot and settle after the stop'],
      accent: '#ff5a1f',
      motionDNA: 'The body moves on plain ease-in-out slides and stops dead; everything else is secondary. On the start the antenna bends back from the base up, segment by segment; on the stop it whips forward, the tip last and farthest, swings back and settles over a couple of seconds, each segment peaking a few frames after the one below it. Three moves: a long slide, a quicker return, a short jolt.',
      visualDNA: 'The Technique Atlas stage with its floor; the orange Token with a four-segment ink antenna, ring joints and an orange ball tip; faint onion skins of the last frames of the antenna; a dashed rigid antenna for comparison; BODY STOPS and TAIL KEEPS GOING callouts; a framed chart of the four segment angles over the whole film with stop markers and each segment’s lag in frames.',
      transitions: 'Three moves on one stage; the rigid ghost and chart annotations fade in as the comparison starts',
      implementation: ['After Effects Duik / Limber dynamics, or delayed valueAtTime() expressions down a parented chain', 'Spring bones / jiggle chains in Maya, Blender and game engines', 'Canvas 2D: a chain of damped angular springs integrated in setup() at 1200 Hz, sampled and lerped per frame'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return ftSim(); },
    draw(c, t, W, H, st) {
      const F = TK.FLOOR, S = FT.S;
      TK.stage(c, W, H, { floor: F });
      const x = ftX(t), yTop = F - S;
      const stop1 = FT.moves[0][1];
      // ---- chart
      const C = FT.chart, cOn = E.outC(seg(t, 0.2, 0.6));
      c.save(); c.globalAlpha = cOn;
      c.fillStyle = 'rgba(236,232,223,0.9)'; c.fillRect(C.x, C.y, C.w, C.h);
      c.strokeStyle = 'rgba(23,24,28,0.25)'; c.lineWidth = 1; c.strokeRect(C.x + 0.5, C.y + 0.5, C.w, C.h);
      label(c, 'SEGMENT ANGLE / TIME', C.x, C.y - 14, { size: 14, ls: 2, color: P.ink, weight: 700 });
      const PW = C.w - 190, CY = v => C.y + C.h / 2 - v / st.mx * (C.h / 2 - 16), CX = tt => C.x + tt / 10 * PW;
      c.setLineDash([3, 4]); c.strokeStyle = 'rgba(23,24,28,0.2)'; c.beginPath(); c.moveTo(C.x, CY(0)); c.lineTo(C.x + PW, CY(0)); c.stroke(); c.setLineDash([]);
      // body motion as shaded bands, stop markers
      FT.moves.forEach(([t0, t1]) => {
        c.fillStyle = 'rgba(23,24,28,0.06)'; c.fillRect(CX(t0), C.y + 1, CX(t1) - CX(t0), C.h - 2);
        c.strokeStyle = P.ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(CX(t1), C.y + 4); c.lineTo(CX(t1), C.y + C.h - 4); c.stroke();
      });
      label(c, 'MOVE', CX(FT.moves[0][0]) + 4, C.y + C.h - 10, { size: 11, ls: 1 });
      label(c, 'STOP', CX(stop1) + 5, C.y + C.h - 10, { size: 11, ls: 1, color: P.ink, weight: 700 });
      const tEnd = Math.min(t, 10), nS = Math.floor(tEnd * 60);
      for (let i = 0; i < FT.N; i++) {
        c.strokeStyle = FT_SEGC[i]; c.lineWidth = i === 3 ? 2.5 : 2; c.beginPath();
        for (let k = 0; k <= nS; k++) { const tt = k / 60, v = st.out[Math.min(st.out.length - 1, Math.round(tt * FT.rate))][i]; k ? c.lineTo(CX(tt), CY(v)) : c.moveTo(CX(tt), CY(v)); }
        c.lineTo(CX(tEnd), CY(ftAng(st, tEnd)[i])); c.stroke();
      }
      // playhead
      c.fillStyle = P.accent; c.fillRect(CX(tEnd) - 1, C.y + 2, 2, C.h - 4);
      // legend: segment key, then each segment's peak after the first stop and its lag in frames
      const LX = C.x + PW + 22;
      c.fillStyle = 'rgba(23,24,28,0.15)'; c.fillRect(C.x + PW, C.y + 1, 1, C.h - 2);
      label(c, 'FIRST STOP', LX, C.y + 32, { size: 12, ls: 2, color: P.ink, weight: 700 });
      label(c, 'PEAK LAG, 30 FPS', LX, C.y + 52, { size: 11, ls: 1 });
      const f0 = st.peaks[0].t;
      st.peaks.forEach((p, i) => {
        const y = C.y + 92 + i * 40;
        c.fillStyle = FT_SEGC[i]; c.fillRect(LX, y - 7, 22, 4);
        label(c, `S${i + 1}`, LX + 32, y, { size: 15, ls: 1, color: P.ink, weight: 700 });
        if (t >= p.t) {
          const lag = Math.round((p.t - f0) * 30);
          label(c, i ? `+${lag}f` : '0f', LX + 80, y, { size: 15, ls: 1, color: i > 1 ? P.accentD : P.ink, weight: 700 });
          c.fillStyle = FT_SEGC[i]; c.beginPath(); c.arc(CX(p.t), CY(p.v), 5, 0, TAU); c.fill();
        }
      });
      c.restore();
      // ---- the subject
      TK.shadow(c, x, F, S, 0);
      const th = ftAng(st, t);
      // rigid comparison ghost
      const gOn = seg(t, 4.0, 4.4);
      if (gOn > 0) ftDrawChain(c, ftChain(x, yTop, [0, 0, 0, 0]), { alpha: 0.4 * gOn, dash: [6, 9], lw: 3, color: P.ink, tip: 'rgba(0,0,0,0)', tipEdge: true, tipR: 14 });
      // onion skins: the antenna on previous frames
      const slow = 1 - clamp(Math.abs(ftX(t + 0.01) - ftX(t - 0.01)) / 0.02 / 500);   // skins only when the body is (nearly) still
      for (let k = 6; k >= 2 && slow > 0.01; k -= 2) {
        const tk = t - k / 30;
        if (tk < 0) continue;
        const pts = ftChain(ftX(tk), yTop, ftAng(st, tk));
        ftDrawChain(c, pts, { alpha: slow * (0.14 * (1 - k / 8) + 0.06), lw: 5, color: P.accentD, tip: P.accentL });
      }
      const pts = ftChain(x, yTop, th);
      TK.token(c, x, F - S / 2, S);
      ftDrawChain(c, pts, { joints: true });
      // segment labels
      const sl = seg(t, 0.3, 0.7) * (1 - seg(t, 3.6, 4.0)) + seg(t, 8.6, 9.0);
      if (sl > 0) for (let i = 0; i < FT.N; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
        label(c, `S${i + 1}`, mx + 18, my + 5, { size: 13, ls: 1, color: P.ink, weight: 700, alpha: clamp(sl) });
      }
      // callouts
      const stops = FT.moves.map(m => m[1]);
      stops.forEach((ts, j) => {
        const a = seg(t, ts - 0.02, ts + 0.12) * (1 - seg(t, ts + (j === 0 ? 1.9 : 1.3), ts + (j === 0 ? 2.2 : 1.6)));
        if (a <= 0.005) return;
        const bx = ftX(ts), dir = Math.sign(FT.moves[j][3] - FT.moves[j][2]);
        c.save(); c.globalAlpha = a;
        // body stops: a pin on the body
        c.fillStyle = P.ink; c.fillRect(bx - 2, F + 14, 4, 20);
        label(c, 'BODY STOPS', bx, F + 58, { size: 16, ls: 2, align: 'center', color: P.ink, weight: 700 });
        label(c, `t ${ts.toFixed(2)} s`, bx, F + 80, { size: 13, ls: 2, align: 'center' });
        // tail keeps going: arrow at the tip in the direction of travel
        const [tx, ty] = pts[FT.N];
        const ax = tx + dir * 34, ay = ty - 10;
        c.strokeStyle = P.accentD; c.lineWidth = 3; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + dir * 70, ay); c.stroke();
        c.fillStyle = P.accentD; c.beginPath(); c.moveTo(ax + dir * 84, ay); c.lineTo(ax + dir * 68, ay - 9); c.lineTo(ax + dir * 68, ay + 9); c.fill();
        label(c, 'TAIL KEEPS GOING', ax + dir * 96, ay + 6, { size: 16, ls: 2, align: dir > 0 ? 'left' : 'right', color: P.accentD, weight: 700 });
        c.restore();
      });
      // drag callout on the start of the first move
      const dA = seg(t, 0.85, 1.0) * (1 - seg(t, 1.45, 1.6));
      if (dA > 0.005) {
        const [tx, ty] = pts[FT.N];
        label(c, 'DRAG  ·  BASE LEADS, TIP LAGS', tx - 40, ty - 40, { size: 16, ls: 2, align: 'right', color: P.ink, weight: 700, alpha: dA });
      }
      if (gOn > 0) {
        label(c, 'RIGID  ·  STOPS DEAD', 72, 160, { size: 16, ls: 2, color: P.mute, weight: 700, alpha: gOn });
        label(c, 'OVERLAPPING  ·  DRAGS, OVERSHOOTS, SETTLES', 72, 188, { size: 16, ls: 2, color: P.accentD, weight: 700, alpha: gOn });
        c.save(); c.globalAlpha = gOn; c.setLineDash([6, 6]); c.strokeStyle = 'rgba(23,24,28,0.5)'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(72 - 46, 154); c.lineTo(72 - 12, 154); c.stroke(); c.setLineDash([]);
        c.strokeStyle = P.accent; c.beginPath(); c.moveTo(72 - 46, 182); c.lineTo(72 - 12, 182); c.stroke(); c.restore();
      }
      tag(c, 'FOLLOW-THROUGH  ·  OVERLAPPING ACTION', 72, 110, E.outC(seg(t, 0.1, 0.5)));
      // caption: body position vs tip position (same scale)
      const nx = v => (v - 340) / (1160 - 340);
      const tipX = u => { const tt = u * 10, a = ftAng(st, tt); let s = ftX(tt); a.forEach(v => { s += Math.sin(v) * FT.L; }); return nx(s); };
      TK.caption(c, t, W, H, { name: 'Follow-through', cat: 'Timing', curve: u => nx(ftX(u * 10)), span: [0, 10], lo: -0.25, hi: 1.3, curveLabel: 'X  BODY  ·  TIP (DASH)' });
      graphOverlay(c, W, H, tipX, { lo: -0.25, hi: 1.3, color: P.accent, dash: [4, 3] });
    },
    score(A) {
      TK.bed(A);
      const st = ftSim();
      FT.moves.forEach(([t0, t1], j) => {
        A.whoosh(t0 - 0.05, t1 - t0 + 0.15, { g: 0.1, f1: 300, f2: 2200, pan: j % 2 ? 0.3 : -0.3 });
        A.osc(t1, { f: 120, f2: 50, glide: 0.1, dur: 0.25, g: 0.3, a: 0.002 });   // body stops: a thunk
        A.noise(t1, { type: 'lowpass', f: 1200, dur: 0.08, g: 0.08 });
      });
      // first stop: each segment's peak gets a note, rising up the chain; then a decaying spring wobble
      st.peaks.forEach((p, i) => {
        A.pluck(p.t, midi([67, 71, 74, 79][i]), { g: 0.14, bright: 0.65, dur: 1.0, rev: 0.3, pan: -0.2 + i * 0.15 });
      });
      [FT.moves[0][1], FT.moves[1][1], FT.moves[2][1]].forEach((t1, j) => {
        A.osc(t1 + 0.04, { type: 'triangle', f: [330, 294, 392][j], dur: 1.6, g: 0.05, vib: [2.4, 22], a: 0.02, lp: 2200, rev: 0.35 });
      });
      A.chord(9.0, [60, 64, 67, 72], { type: 'triangle', dur: 1.0, g: 0.03, a: 0.05, lp: 2400, rev: 0.5, width: 0.7 });
    },
  });
})();
