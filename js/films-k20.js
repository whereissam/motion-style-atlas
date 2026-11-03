/* batch k20 — Technique Atlas · Compositing, Temporal, Shape: techbloom · techloop · techtrimpaths.
   techbloom (glow as a post-process: threshold the bright parts, blur them at four radii — a
   blur pyramid — and add them back; shown pass by pass on a dark variant of the stage where the
   Token is emissive, then threshold, intensity and radius changed one at a time) ·
   techloop (a 2 s cycle that loops perfectly: frame 60 is frame 0, a badly keyed loop that pops
   at the seam, the fix with sin(2π·t/T), phase offsets across a row, and keys repeated by
   loopOut('cycle'); the whole film is five cycles, so it loops too) ·
   techtrimpaths (stroke drawing by trimming a path's start and end: the Token's outline draws on,
   a 25% segment chases around it by offset, a line-drawn MOTION trims simultaneously and then
   individually, burst strokes draw on and off with start lagging end). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, midi, text, rrect } = MG;
  const TK = MG.TK, P = TK.P, PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const label = (c, s, x, y, o = {}) => text(c, s, x, y, { font: TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
  const tag = (c, s, x, y, on = 1, col = P.ink) => {   // small accent dot + mono label, top-left of frame
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: col, weight: 700, size: 20 });
    c.restore();
  };
  const fade = (c, a, fn) => { if (a <= 0.001) return; c.save(); c.globalAlpha *= a; fn(); c.restore(); };
  // a slider: label + value above a bar, knob at v (0..1)
  function slider(c, x, y, w, name, val, v, o = {}) {
    const col = o.col || P.ink, dim = o.dim || 'rgba(23,24,28,0.15)';
    label(c, name, x, y - 12, { size: 13, ls: 2, color: o.active ? P.accent : (o.mute || P.mute), weight: o.active ? 700 : 400 });
    label(c, val, x + w, y - 12, { size: 13, ls: 1, color: col, align: 'right', weight: 700 });
    c.fillStyle = dim; c.fillRect(x, y, w, 3);
    c.fillStyle = o.active ? P.accent : col; c.fillRect(x, y, w * clamp(v), 3);
    c.beginPath(); c.arc(x + w * clamp(v), y + 1.5, o.active ? 8 : 6, 0, TAU); c.fill();
  }

  /* =====================================================================
     BLOOM — glow built the way a compositor or game renderer builds it.
     On paper there is nothing to glow against (the ground itself is
     brighter than the threshold), so an iris opens a dark variant of the
     stage where the Token is emissive. Step 1 keeps only what is brighter
     than the threshold (a soft knee), shown against a luma scale of five
     lamps; step 2 blurs that bright pass at four radii on quarter-size
     canvases (8 · 16 · 32 · 64 px — a blur pyramid); step 3 adds the sum
     back over the source. Then intensity, radius and threshold change one
     at a time, and the iris closes back onto paper. The pipeline runs
     down the right: SOURCE → BRIGHT PASS → BLUR PYRAMID → main view.
     ===================================================================== */
  const BV = { x: 80, y: 120, w: 1280, h: 720 };            // main view; scene units are 1280×720
  const BTX = 1456, BTY = [120, 372, 624], BTW = 384, BTH = 216;
  const BDARK = '#111216', BQ = 0.25;                       // quarter-size bloom canvases
  const BTOK = { x: 640, y: 280, s: 240 };
  const BLAMPS = [0.2, 0.4, 0.6, 0.8, 1.0], BLX = L => 340 + 500 * L, BLY = 590;
  const BW = [0.32, 0.27, 0.22, 0.18];                      // pyramid level weights
  const BIRIS = [[1.2, 1.9], [8.45, 9.1]];
  const bTh = t => kf(t, [[0, 0.7], [1.95, 0.7], [2.35, 0.95, E.ioS], [2.95, 0.3, E.ioS], [3.35, 0.7, E.ioS], [7.7, 0.7], [8.0, 0.3, E.ioS], [8.35, 0.7, E.ioS]]);
  const bI = t => kf(t, [[0, 1], [6.0, 1], [6.35, 1.6, E.outC], [6.65, 0.2, E.ioS], [6.9, 1, E.ioS]]);
  const bR = t => kf(t, [[0, 1], [6.9, 1], [7.15, 0.4, E.ioS], [7.5, 2, E.ioS], [7.7, 1, E.ioS]]);
  const bIris = t => E.ioC(seg(t, BIRIS[0][0], BIRIS[0][1])) * (1 - E.ioC(seg(t, BIRIS[1][0], BIRIS[1][1])));
  const knee = (L, th) => clamp((L - th) / 0.06);
  const grey = L => { const v = Math.round(255 * L); return `rgb(${v},${v},${v})`; };

  /* The scene in scene units. 'src' draws the dark ground and everything; 'bright' draws only
     what passes the threshold, on transparent. 'paper' is the same layout on the paper stage. */
  function bScene(c, mode, th) {
    const k = L => (mode === 'bright' ? knee(L, th) : 1);
    if (mode === 'src') {
      c.fillStyle = BDARK; c.fillRect(0, 0, 1280, 720);
      c.strokeStyle = 'rgba(236,232,223,0.05)'; c.lineWidth = 1; c.beginPath();
      for (let x = 0; x <= 1280; x += 80) { c.moveTo(x, 0); c.lineTo(x, 720); }
      for (let y = 0; y <= 720; y += 80) { c.moveTo(0, y); c.lineTo(1280, y); }
      c.stroke();
    }
    const paper = mode === 'paper';
    let a = k(0.35); if (a > 0) TK.word(c, 640, 486, { size: 84, color: paper ? P.ink : '#5c5c63', alpha: a, ls: 6 });
    a = k(0.82); if (a > 0) TK.token(c, BTOK.x, BTOK.y, BTOK.s, { color: paper ? P.accent : '#ff6a2a', alpha: a });
    a = k(1.0);
    if (a > 0 && !paper) {
      c.save(); c.globalAlpha *= a; c.strokeStyle = '#fff'; c.lineWidth = 7; c.beginPath();
      c.arc(BTOK.x + BTOK.s * TK.HOLE.x, BTOK.y + BTOK.s * TK.HOLE.y, BTOK.s * TK.HOLE.r - 3, 0, TAU); c.stroke(); c.restore();
    }
    BLAMPS.forEach(L => {
      a = k(L); if (a <= 0) return;
      c.save(); c.globalAlpha *= a; c.fillStyle = paper ? grey(0.25 + 0.7 * L) : grey(L);
      c.beginPath(); c.arc(BLX(L), BLY, 17, 0, TAU); c.fill(); c.restore();
    });
  }
  function bPasses(st, t) {
    const th = bTh(t), R = bR(t), bc = st.bright.getContext('2d');
    bc.clearRect(0, 0, 320, 180); bc.save(); bc.scale(BQ, BQ); bScene(bc, 'bright', th); bc.restore();
    st.lv.forEach((cv, i) => {
      const lc = cv.getContext('2d');
      lc.clearRect(0, 0, 320, 180);
      lc.filter = `blur(${(2 * R * Math.pow(2, i)).toFixed(2)}px)`;
      lc.drawImage(st.bright, 0, 0);
      lc.filter = 'none';
    });
  }
  // add pyramid levels over whatever is drawn at x,y,w,h; amount per level = gain * weight
  function bAdd(c, st, x, y, w, h, gains) {
    c.save(); c.globalCompositeOperation = 'lighter';
    st.lv.forEach((cv, i) => {
      let a = gains[i];
      while (a > 0.001) { c.globalAlpha = Math.min(1, a); c.drawImage(cv, x, y, w, h); a -= 1; }
    });
    c.restore();
  }
  function bStage(t) {   // 0 source, 1 threshold, 2 blur, 3 composite
    return t < 1.9 ? 0 : t < 3.45 ? 1 : t < 5.0 ? 2 : 3;
  }
  function bHUD(c, t, th) {
    // luma axis under the lamps, threshold marker, element lumas
    const X = u => BV.x + u, Y = v => BV.y + v;
    c.fillStyle = 'rgba(236,232,223,0.25)'; c.fillRect(X(BLX(0)), Y(BLY + 38), 500, 2);
    for (let i = 0; i <= 10; i++) c.fillRect(X(BLX(i / 10)) - 0.5, Y(BLY + 34), 1, i % 5 ? 6 : 10);
    BLAMPS.forEach(L => label(c, L.toFixed(1), X(BLX(L)), Y(BLY + 64), { align: 'center', size: 13, ls: 1, color: knee(L, th) > 0.5 ? '#fff' : 'rgba(236,232,223,0.4)' }));
    label(c, 'LUMA', X(BLX(0)) - 16, Y(BLY + 44), { align: 'right', size: 13, ls: 2, color: 'rgba(236,232,223,0.5)' });
    const tx = X(BLX(th));
    c.fillStyle = P.accent; c.fillRect(tx - 1.5, Y(BLY - 34), 3, 76);
    c.beginPath(); c.moveTo(tx, Y(BLY + 40)); c.lineTo(tx - 8, Y(BLY + 52)); c.lineTo(tx + 8, Y(BLY + 52)); c.fill();
    label(c, `th ${th.toFixed(2)}`, tx, Y(BLY - 44), { align: 'center', size: 14, ls: 1, color: P.accentL, weight: 700 });
    // element callouts
    const call = (s, L, x0, y0, x1, y1, al = 'left') => {
      const on = knee(L, th) > 0.5;
      c.strokeStyle = on ? 'rgba(255,255,255,0.6)' : 'rgba(236,232,223,0.25)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(X(x0), Y(y0)); c.lineTo(X(x1), Y(y1)); c.stroke();
      label(c, `${s} ${L.toFixed(2)}`, X(x1) + (al === 'left' ? 8 : -8), Y(y1) + 5, { size: 14, ls: 2, align: al, color: on ? '#fff' : 'rgba(236,232,223,0.45)', weight: on ? 700 : 400 });
    };
    call('RIM', 1.0, 735, 216, 860, 150);
    call('BODY', 0.82, 760, 330, 860, 360);
    call('WORD', 0.35, 470, 470, 330, 420, 'right');
  }

  MG.film({
    id: 'techbloom', dur: 10, poster: 5.7,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Bloom', sub: 'Threshold, blur, add back', era: '1982 —',
      origin: 'Bright light spreads in a lens and in film emulsion (halation), so overexposed highlights photograph with a soft halo. Tron (1982) got its glowing circuitry from backlit animation photographed through coloured filters. Real-time graphics rebuilt the look as a post-process — threshold the frame, blur the bright pass, add it back: Masaki Kawase’s GDC 2003 talk on Wreckless described stacking blurs of downsampled buffers, GPU Gems (2004) described the glow of Tron 2.0, and HDR bloom became standard in games from Half-Life 2: Lost Coast (2005) on. After Effects’ Glow effect exposes the same three controls: threshold, radius and intensity.',
      works: 'Tron (Steven Lisberger, Disney, 1982) · Ico (Team Ico, Sony, 2001) · Tron 2.0 (Monolith Productions, 2003)',
      tech: ['Soft-knee threshold', 'Blur pyramid · 4 radii', 'Additive composite'],
      accent: '#ff5a1f',
      motionDNA: 'Nothing in the picture moves; the pipeline does. An iris opens from the Token into a dark stage, then each pass takes about a bar and a half: the threshold sweeps up until only the hottest rim survives and down until even the word glows, the four blur levels fade in one per half-beat from tight to wide, the sum is added back. Then one parameter at a time — an intensity pulse, a radius squeeze and stretch, a threshold dip — before the iris closes onto paper.',
      visualDNA: 'The Technique Atlas stage turned into a dark rounded panel (#111216) with a faint grid; the Token in a hotter orange with a white-hot rim around its hole, MOTION in mid grey, a row of five grey lamps from luma 0.2 to 1.0 over a luma axis with an orange threshold marker. Right-hand pipeline thumbnails (source, bright pass on black, a 2×2 pyramid of blurs labelled by radius), three sliders in the top band, white callouts that light up when an element passes the threshold.',
      transitions: 'Iris from paper into the dark stage and back; cross-fades from pass to pass in the main view',
      implementation: ['After Effects Glow (threshold · radius · intensity), Nuke Glow / Bloom', 'Game engines: HDR bright pass + downsampled Gaussian or Kawase blur chain, added before tone mapping', 'Canvas 2D: bright pass and four filter-blur levels on 320×180 offscreen canvases, drawn back with lighter compositing'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      return { bright: MG.offscreen(320, 180), lv: [0, 1, 2, 3].map(() => MG.offscreen(320, 180)) };
    },
    draw(c, t, W, H, st) {
      const th = bTh(t), I = bI(t), R = bR(t), ir = bIris(t), sg = bStage(t);
      // ---- paper layer ----
      TK.stage(c, W, H);
      c.save(); c.translate(BV.x, BV.y); bScene(c, 'paper', th); c.restore();
      const paperOn = 1 - seg(t, 1.0, 1.25) + seg(t, 9.0, 9.3);
      if (ir < 0.999) {
        tag(c, t < 5 ? 'THE TOKEN · ON PAPER' : 'BACK ON PAPER · BLOOM OFF', 72, 80, clamp(paperOn));
        fade(c, clamp(paperOn), () => {
          label(c, 'PAPER LUMA 0.91 — THE GROUND ITSELF PASSES ANY USEFUL THRESHOLD', 98, 116, { size: 15, ls: 2 });
          // thumbnail: what bloom does on a light ground
          const x = BTX, y = BTY[1];
          c.save(); c.beginPath(); c.rect(x, y, BTW, BTH); c.clip();
          c.translate(x, y); c.scale(0.3, 0.3); c.fillStyle = P.ground; c.fillRect(0, 0, 1280, 720); bScene(c, 'paper', th);
          c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(236,232,223,0.78)'; c.fillRect(0, 0, 1280, 720);
          c.restore();
          c.strokeStyle = 'rgba(23,24,28,0.3)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, BTW, BTH);
          label(c, 'BLOOM ON PAPER  ·  th 0.70', x, y - 12, { size: 14, ls: 2, color: P.ink, weight: 700 });
          label(c, 'THE GROUND BLOWS OUT TO WHITE', x, y + BTH + 26, { size: 13, ls: 2 });
        });
      }
      // ---- dark panel through the iris ----
      if (ir > 0.001) {
        const cx = BV.x + BTOK.x, cy = BV.y + BTOK.y, rad = ir * 2100;
        c.save();
        c.beginPath(); c.arc(cx, cy, rad, 0, TAU); c.clip();
        rrect(c, 40, 40, 1840, 832, 28); c.clip();
        c.fillStyle = '#0b0c0f'; c.fillRect(0, 0, W, H);
        bPasses(st, t);
        // main view
        c.save(); c.beginPath(); c.rect(BV.x, BV.y, BV.w, BV.h); c.clip();
        c.translate(BV.x, BV.y);
        const gain = BW.map(w => w * I);
        if (sg === 0) bScene(c, 'src', th);
        else if (sg === 1) {
          bScene(c, 'src', th);
          fade(c, seg(t, 1.9, 2.2), () => { c.fillStyle = '#000'; c.fillRect(0, 0, 1280, 720); bScene(c, 'bright', th); });
        } else {
          const comp = sg === 3 ? E.ioS(seg(t, 5.0, 5.4)) : 0;
          if (comp > 0) { bScene(c, 'src', th); bAdd(c, st, 0, 0, 1280, 720, gain); }
          fade(c, 1 - comp, () => {
            c.fillStyle = '#000'; c.fillRect(0, 0, 1280, 720);
            c.save(); c.globalAlpha *= 1 - 0.6 * seg(t, 3.5, 4.0); bScene(c, 'bright', th); c.restore();
            bAdd(c, st, 0, 0, 1280, 720, BW.map((w, i) => w * 1.6 * seg(t, 3.55 + 0.3 * i, 3.8 + 0.3 * i)));
          });
        }
        c.restore();
        c.strokeStyle = 'rgba(236,232,223,0.25)'; c.lineWidth = 1; c.strokeRect(BV.x + 0.5, BV.y + 0.5, BV.w, BV.h);
        const VIEW = ['SOURCE', 'BRIGHT PASS', 'BLUR PYRAMID · Σ 4 LEVELS', 'COMPOSITE · SOURCE + I · Σ BLUR'][sg];
        label(c, `VIEW  ·  ${VIEW}`, BV.x + 20, BV.y + 34, { size: 15, ls: 2, color: '#fff', weight: 700 });
        const SUB = ['EMISSIVE TOKEN ON A DARK GROUND — GLOW NEEDS CONTRAST',
          'KEEP ONLY PIXELS BRIGHTER THAN th  (SOFT KNEE 0.06)',
          'BLUR THE BRIGHT PASS AT r = 8 · 16 · 32 · 64 PX  (×RADIUS)',
          'OUT = SRC + I · Σ wₖ · BLURₖ(BRIGHT)'][sg];
        label(c, SUB, BV.x + 20, BV.y + 58, { size: 13, ls: 2, color: 'rgba(236,232,223,0.6)' });
        if (sg <= 1 || sg === 3) bHUD(c, t, th);
        // pipeline thumbnails
        const thumbs = ['SOURCE', `BRIGHT PASS  ·  th ${th.toFixed(2)}`, 'BLUR PYRAMID  ·  ¼ SIZE'];
        thumbs.forEach((name, i) => {
          const x = BTX, y = BTY[i];
          c.save(); c.beginPath(); c.rect(x, y, BTW, BTH); c.clip(); c.translate(x, y);
          if (i === 0) { c.scale(0.3, 0.3); bScene(c, 'src', th); }
          else if (i === 1) { c.fillStyle = '#000'; c.fillRect(0, 0, BTW, BTH); c.drawImage(st.bright, 0, 0, BTW, BTH); }
          else {
            c.fillStyle = '#000'; c.fillRect(0, 0, BTW, BTH);
            st.lv.forEach((cv, k) => {
              const tx = (k % 2) * BTW / 2, ty = Math.floor(k / 2) * BTH / 2;
              c.save(); c.globalCompositeOperation = 'lighter';
              c.drawImage(cv, tx, ty, BTW / 2, BTH / 2); c.drawImage(cv, tx, ty, BTW / 2, BTH / 2); c.restore();
              label(c, `r ${Math.round(8 * R * Math.pow(2, k))}`, tx + 8, ty + 18, { size: 12, ls: 1, color: '#fff', weight: 700 });
            });
            c.fillStyle = 'rgba(236,232,223,0.25)'; c.fillRect(BTW / 2, 0, 1, BTH); c.fillRect(0, BTH / 2, BTW, 1);
          }
          c.restore();
          const cur = sg === i || (sg === 3 && i === 2);
          c.strokeStyle = cur ? P.accent : 'rgba(236,232,223,0.25)'; c.lineWidth = cur ? 3 : 1;
          c.strokeRect(x + 0.5, y + 0.5, BTW, BTH);
          label(c, `${i + 1}  ${name}`, x, y - 12, { size: 14, ls: 2, color: cur ? P.accentL : 'rgba(236,232,223,0.6)', weight: 700 });
          if (i < 2) label(c, '↓', x + BTW, y + BTH + 30, { align: 'right', size: 18, color: 'rgba(236,232,223,0.5)' });
        });
        if (sg === 3) {   // pyramid feeds back into the main view
          c.strokeStyle = P.accent; c.lineWidth = 2; c.setLineDash([5, 6]);
          c.beginPath(); c.moveTo(BTX - 8, BTY[2] + BTH / 2); c.lineTo(BV.x + BV.w + 12, BTY[2] + BTH / 2); c.stroke(); c.setLineDash([]);
          label(c, '+', BV.x + BV.w + 24, BTY[2] + BTH / 2 - 10, { size: 26, color: P.accent, weight: 700, align: 'center' });
        }
        // top band: tag + sliders
        const step = ['DARK STAGE · THE TOKEN IS EMISSIVE', 'STEP 1 / 3 · THRESHOLD', 'STEP 2 / 3 · BLUR PYRAMID', t < 6 ? 'STEP 3 / 3 · ADD BACK' : 'PARAMETERS'][sg];
        tag(c, step, 72, 92, 1, '#fff');
        const act = t >= 6.0 && t < 6.9 ? 1 : t >= 6.9 && t < 7.7 ? 2 : (t >= 7.7 && t < 8.4) || (t >= 1.95 && t < 3.4) ? 0 : -1;
        const so = k => ({ active: act === k, col: '#fff', dim: 'rgba(236,232,223,0.2)', mute: 'rgba(236,232,223,0.55)' });
        slider(c, 820, 96, 150, 'THRESHOLD', th.toFixed(2), th, so(0));
        slider(c, 1010, 96, 150, 'INTENSITY', I.toFixed(2), I / 2, so(1));
        slider(c, 1200, 96, 150, 'RADIUS', `×${R.toFixed(2)}`, R / 2.5, so(2));
        c.restore();
        // iris edge
        if (ir < 0.999) { c.strokeStyle = P.accent; c.lineWidth = 5; c.beginPath(); c.arc(cx, cy, rad, 0, TAU); c.stroke(); }
      }
      TK.caption(c, t, W, H, { name: 'Bloom', cat: 'Compositing', curve: u => bI(u * 10) / 1.6, span: [0, 10], curveLabel: 'INTENSITY / TIME', lo: -0.1, hi: 1.15 });
    },
    score(A) {
      TK.bed(A);
      // iris into the dark
      A.whoosh(1.15, 0.8, { f1: 3000, f2: 250, q: 1.2, g: 0.12, swell: 0.4, rev: 0.4 });
      A.osc(1.2, { type: 'triangle', f: midi(36), dur: 1.6, g: 0.06, a: 0.3, lp: 600 });
      // threshold sweep: a filtered drone whose cutoff follows the threshold down and up
      A.osc(1.95, { type: 'sawtooth', f: midi(48), dur: 0.42, g: 0.025, a: 0.05, lp: 1200, lp2: 300, lpT: 0.4, hold: true });
      A.osc(2.35, { type: 'sawtooth', f: midi(48), dur: 0.62, g: 0.025, a: 0.02, lp: 300, lp2: 3600, lpT: 0.6, hold: true });
      A.osc(2.95, { type: 'sawtooth', f: midi(48), dur: 0.42, g: 0.025, a: 0.02, lp: 3600, lp2: 1200, lpT: 0.4, hold: true });
      [2.4, 2.62, 2.75, 2.85, 2.92].forEach((tt, i) => A.osc(tt, { f: midi(84 - i * 3), dur: 0.06, g: 0.04 }));
      // blur levels: each wider level rings longer
      [0, 1, 2, 3].forEach(k => A.bell(3.55 + 0.3 * k, midi([72, 76, 79, 84][k]), { g: 0.06, dur: 1.4 + k * 0.6, rev: 0.3 + 0.15 * k }));
      // add back
      A.chord(5.0, [60, 64, 67, 71, 76], { type: 'sine', dur: 2.2, g: 0.035, a: 0.25, lp: 3000, rev: 0.7, width: 0.8 });
      A.bell(5.05, midi(88), { g: 0.05, dur: 2.2, rev: 0.6 });
      // intensity pulse, radius squeeze/stretch, threshold dip
      A.noise(6.0, { type: 'bandpass', f: 800, f2: 5000, sweep: 0.35, q: 1.5, dur: 0.65, g: 0.09, swell: 0.5, rev: 0.4 });
      A.whoosh(6.9, 0.8, { f1: 2400, f2: 400, q: 2, g: 0.1, swell: 0.6, rev: 0.5 });
      A.osc(7.7, { type: 'triangle', f: midi(79), f2: midi(67), glide: 0.3, dur: 0.6, g: 0.05, rev: 0.4 });
      // iris back to paper
      A.whoosh(8.45, 0.65, { f1: 250, f2: 3000, q: 1.2, g: 0.12, swell: 0.6, rev: 0.3 });
      A.pluck(9.1, midi(72), { g: 0.16, bright: 0.6, dur: 0.9 });
      A.chord(9.1, [60, 64, 67, 72], { type: 'triangle', dur: 0.9, g: 0.035, a: 0.02, lp: 2400, rev: 0.5, width: 0.8 });
    },
  });

  /* =====================================================================
     SEAMLESS LOOP — a 2 s cycle (60 frames at 30 fps) where frame 60 is
     frame 0. The hero Token on the left bobs on y = A·sin(2π·t/T) for the
     whole film, and a cycle ring top-right marks the seam at twelve. The
     centre demos one rule per section: a filmstrip whose frame 60 matches
     frame 0; a lane keyed 0 → 480 px with an ease that pops back at the
     seam; the same lane fixed with sin(2π·t/T) so value and slope both
     match; a row of seven Tokens offset by T/7 each (phase, not period);
     keys authored for one cycle and repeated by loopOut('cycle'). The
     film is five cycles long and ends on its opening frame.
     ===================================================================== */
  const LT = 2, LN = 60, LHX = 360, LHY = 430, LHS = 190;
  const LRING = { x: 1665, y: 245, r: 104 }, LIN = { x: 1500, y: 450, w: 340, h: 230 };
  const LSEC = [[0, 2.0], [2.0, 4.8], [4.8, 6.4], [6.4, 8.2], [8.2, 9.6]];
  const LLANE = { x0: 820, x1: 1300, y: 440, s: 120 };
  const LKEYS = [[0, 0], [0.5, 1, E.outQ], [1.0, 0, E.inQ], [1.5, 0.5, E.outQ], [2.0, 0, E.inQ]];
  const lPh = t => (((t / LT) % 1) + 1) % 1;
  const lHero = u => ({ y: LHY - 80 * Math.sin(TAU * u), rot: 0.22 * Math.sin(TAU * u) });
  const lBad = u => lerp(LLANE.x0, LLANE.x1, E.ioS(u));
  const lFix = u => (LLANE.x0 + LLANE.x1) / 2 + 240 * Math.sin(TAU * u);
  const lSecAt = t => { let k = 0; LSEC.forEach(([a], i) => { if (t >= a) k = i; }); return t >= 9.6 ? 0 : k; };
  function lVis(t, k) {
    if (k === 0) return Math.max(1 - seg(t, 1.8, 2.05), seg(t, 9.55, 9.9));
    const [a, b] = LSEC[k];
    return seg(t, a, a + 0.25) * (1 - seg(t, b - 0.2, b + 0.05));
  }
  function lLaneX(t) {
    const u = lPh(t), f = E.ioS(seg(t, 4.8, 5.2));
    return lerp(lBad(u), lFix(u), f);
  }
  function lGhost(c, x, y, s, rot = 0) {
    c.save(); c.translate(x, y); c.rotate(rot); TK.tokenPath(c, s);
    c.setLineDash([6, 6]); c.lineWidth = 2; c.strokeStyle = 'rgba(23,24,28,0.5)'; c.stroke(); c.restore();
  }
  function lRing(c, t, k) {
    const { x, y, r } = LRING, u = lPh(t), f = Math.floor(u * LN + 1e-6), cyc = Math.floor(t / LT + 1e-6) % 5 + 1;
    c.strokeStyle = 'rgba(23,24,28,0.12)'; c.lineWidth = 10; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    c.strokeStyle = P.accent; c.lineWidth = 10; c.beginPath(); c.arc(x, y, r, -PI / 2, -PI / 2 + u * TAU); c.stroke();
    c.fillStyle = 'rgba(23,24,28,0.35)';
    for (let i = 0; i < 4; i++) { const a = -PI / 2 + i * PI / 2; c.fillRect(x + Math.cos(a) * (r + 12) - 2, y + Math.sin(a) * (r + 12) - 2, 4, 4); }
    label(c, '15', x + r + 22, y + 5, { size: 12, ls: 1 }); label(c, '30', x, y + r + 30, { size: 12, ls: 1, align: 'center' }); label(c, '45', x - r - 22, y + 5, { size: 12, ls: 1, align: 'right' });
    // seam marker at twelve
    const pop = k === 1 || (t >= 4 && t < 4.8) ? 1 - seg(t, 4.0, 4.7) : 0;
    c.fillStyle = t >= 4 && t < 4.7 ? P.accentD : P.ink; c.fillRect(x - 2, y - r - 22, 4, 44);
    label(c, 'SEAM · 0 = 60', x, y - r - 32, { align: 'center', size: 13, ls: 2, color: P.ink, weight: 700 });
    if (pop > 0 && t >= 4) fade(c, pop, () => { c.strokeStyle = P.accentD; c.lineWidth = 3; c.beginPath(); c.arc(x, y - r, 18 + 30 * seg(t, 4.0, 4.5), 0, TAU); c.stroke(); });
    // head
    const a = -PI / 2 + u * TAU;
    c.fillStyle = P.ink; c.beginPath(); c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 9, 0, TAU); c.fill();
    // phase dots for the offset row
    fade(c, lVis(t, 3), () => {
      for (let i = 1; i < 7; i++) { const b = -PI / 2 + (u - i / 7) * TAU; c.fillStyle = P.accentL; c.beginPath(); c.arc(x + Math.cos(b) * r, y + Math.sin(b) * r, 6, 0, TAU); c.fill(); }
    });
    text(c, `f ${String(f).padStart(2, '0')}`, x, y - 2, { font: TK.MONO, size: 34, weight: 700, color: P.ink, align: 'center', base: 'middle' });
    label(c, `CYCLE ${cyc} / 5`, x, y + 32, { align: 'center', size: 13, ls: 2 });
    label(c, 'T = 2 S · 60 FRAMES', x, y + r + 58, { align: 'center', size: 13, ls: 2, color: P.ink });
  }
  // inset: frame 0 filled, frame 60 dashed, distance readout
  function lInset(c, t, k) {
    const { x, y, w, h } = LIN, cx = x + w / 2;
    c.fillStyle = 'rgba(23,24,28,0.04)'; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(23,24,28,0.25)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w, h);
    label(c, 'FRAME 0 ■   FRAME 60 ⬚', x, y - 12, { size: 13, ls: 2, color: P.ink, weight: 700 });
    let a, b, d, ok;
    if (k === 0) { const p = lHero(0); a = b = [0, (p.y - LHY) * 0.4]; d = 0; }
    else if (k === 1) { a = [(lBad(0) - 1060) * 0.25, 0]; b = [(lBad(1) - 1060) * 0.25, 0]; d = lBad(1) - lBad(0); }
    else if (k === 2) { a = b = [(lFix(0) - 1060) * 0.25, 0]; d = 0; }
    else if (k === 3) { a = b = [0, 0]; d = 0; }
    else { a = b = [0, 0]; d = 0; }
    ok = d < 0.5;
    const my = y + h / 2 - 10;
    if (k === 1) { c.fillStyle = 'rgba(23,24,28,0.15)'; c.fillRect(cx - 70, my + 34, 140, 2); }
    TK.token(c, cx + a[0], my + a[1], 54);
    c.save(); c.translate(cx + b[0], my + b[1]); TK.tokenPath(c, 54); c.setLineDash([5, 5]); c.lineWidth = 2.5; c.strokeStyle = P.ink; c.stroke(); c.restore();
    if (!ok) {
      c.strokeStyle = P.accentD; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + a[0], my + 50); c.lineTo(cx + b[0], my + 50); c.stroke();
      [a[0], b[0]].forEach(v => c.fillRect(cx + v - 1, my + 44, 2, 12));
    }
    label(c, ok ? 'Δ 0 PX  ·  MATCH' : `Δ ${Math.round(d)} PX  ·  POP`, cx, y + h - 22, { align: 'center', size: 16, ls: 2, color: ok ? P.ink : P.accentD, weight: 700 });
  }

  MG.film({
    id: 'techloop', dur: 10, poster: 4.15,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Seamless Loop', sub: 'The last frame leads back into the first', era: '1830s —',
      origin: 'Optical toys of the 1830s — Joseph Plateau’s phenakistiscope (1833) and the zoetrope — could only show cycles: a ring of drawings whose last leads straight back into the first. Hand-drawn animation kept walk and run cycles as a basic economy. Netscape Navigator 2.0 (1995) added a looping extension to the GIF format, making the endless loop a native form of the web; After Effects expressions (version 5.0, 2001) brought loopOut("cycle") and loopOut("pingpong") for repeating keyframes, and cinemagraphs (2011) and looping GIF art made the invisible seam the whole point.',
      works: 'Phenakistiscope discs (Joseph Plateau, 1833) · The Dancing Baby (1996) · Cinemagraphs (Jamie Beck and Kevin Burg, 2011)',
      tech: ['Frame N ≡ frame 0', 'Periodic functions sin(2π·t/T)', 'Phase offsets · loopOut("cycle")'],
      accent: '#ff5a1f',
      motionDNA: 'Everything runs on one 2-second clock — a bar of the 120 BPM bed — and the film is exactly five of them. The hero bobs on a sine for all ten seconds; a lane eased from left to right snaps back at the seam with a click, then slides on a sine and never snaps again; seven Tokens ripple a seventh of a cycle apart; a hop keyed as one big and one small jump repeats by loopOut. The last frame leads into the first.',
      visualDNA: 'The Technique Atlas stage: the hero Token bobbing over a soft contact shadow on the left, a cycle ring top-right with an orange progress arc, a frame counter and an ink seam bar at twelve; an inset comparing frame 0 (filled) with frame 60 (dashed) and a Δ readout; a five-cell filmstrip, a lane with key diamonds, mono formulas, a sine row of seven Tokens, and a keyframe graph whose authored cycle is solid and its repeats dashed.',
      transitions: 'Section cross-fades on the cycle clock; the last section fades back into the first so the film loops',
      implementation: ['After Effects loopOut("cycle") / loopOut("pingpong") and time-based sin(2π·time/T) expressions', 'Animated GIF / video loops exported with the duplicate end frame dropped', 'Canvas 2D: every motion a function of t mod T'],
      reproducibility: 'Fully procedural',
      loopable: true,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      const u = lPh(t), k = lSecAt(t), hp = lHero(u);
      // hero
      TK.shadow(c, LHX, 700, LHS, 700 - (hp.y + LHS / 2));
      fade(c, seg(t, 1.0, 1.4) * (1 - seg(t, 1.9, 2.1)), () => { const p = lHero(0); lGhost(c, LHX, p.y, LHS, p.rot); label(c, 'FRAME 0', LHX - LHS / 2 - 14, p.y - LHS / 2 + 4, { align: 'right', size: 13, ls: 2, color: P.ink }); });
      TK.token(c, LHX, hp.y, LHS, { rot: hp.rot });
      label(c, 'HERO  ·  y = A · sin(2π · t / T)', LHX, 752, { align: 'center', size: 15, ls: 2, color: P.ink, weight: 700 });
      // S1: filmstrip of frames 0..60
      fade(c, lVis(t, 0), () => {
        const cw = 112, gap = 22, x0 = 1060 - (5 * cw + 4 * gap) / 2, y0 = 300, ch = 170, f = Math.floor(u * LN + 1e-6);
        label(c, 'ONE CYCLE, FIVE FRAMES OF IT', x0, y0 - 24, { size: 15, ls: 2, color: P.ink, weight: 700 });
        [0, 15, 30, 45, 60].forEach((fr, i) => {
          const x = x0 + i * (cw + gap), p = lHero(fr / LN), cur = i < 4 && Math.floor(f / 15) === i, end = i === 0 || i === 4;
          c.fillStyle = cur ? 'rgba(255,90,31,0.1)' : 'rgba(23,24,28,0.04)'; c.fillRect(x, y0, cw, ch);
          c.strokeStyle = end ? P.accent : 'rgba(23,24,28,0.25)'; c.lineWidth = end ? 3 : 1; c.strokeRect(x + 0.5, y0 + 0.5, cw, ch);
          TK.token(c, x + cw / 2, y0 + ch / 2 + (p.y - LHY) * 0.45, 56, { rot: p.rot });
          label(c, `f ${fr}`, x + cw / 2, y0 + ch + 24, { align: 'center', size: 14, ls: 1, color: end ? P.accentD : P.mute, weight: 700 });
        });
        const xa = x0 + cw / 2, xb = x0 + 4 * (cw + gap) + cw / 2, yb = y0 + ch + 44;
        c.strokeStyle = P.accent; c.lineWidth = 2; c.beginPath(); c.moveTo(xa, yb - 6); c.lineTo(xa, yb); c.lineTo(xb, yb); c.lineTo(xb, yb - 6); c.stroke();
        label(c, 'FRAME 60 = FRAME 0  ·  EXPORT 0–59, NEVER BOTH', (xa + xb) / 2, yb + 26, { align: 'center', size: 14, ls: 2, color: P.ink });
      });
      // S2 + S3: the lane, bad then fixed
      const laneVis = Math.max(lVis(t, 1), lVis(t, 2));
      fade(c, laneVis, () => {
        const { x0, x1, y, s } = LLANE, x = lLaneX(t), fix = seg(t, 4.8, 5.2);
        c.fillStyle = 'rgba(23,24,28,0.15)'; c.fillRect(x0 - 80, y + s / 2 + 14, x1 - x0 + 160, 2);
        // keys / centre marks
        fade(c, 1 - fix, () => {
          [x0, x1].forEach((kx, i) => {
            c.save(); c.translate(kx, y + s / 2 + 15); c.rotate(PI / 4); c.fillStyle = P.ink; c.fillRect(-7, -7, 14, 14); c.restore();
            label(c, i ? 'KEY f 60 · x 480' : 'KEY f 0 · x 0', kx, y + s / 2 + 48, { align: 'center', size: 13, ls: 2, color: P.ink });
          });
          label(c, 'BAD LOOP  ·  EASED 0 → 480 PX, END ≠ START', 1060, y - s / 2 - 60, { align: 'center', size: 16, ls: 2, color: P.ink, weight: 700 });
        });
        fade(c, fix, () => {
          const xc = (x0 + x1) / 2;
          lGhost(c, xc, y, s);
          c.fillStyle = P.ink; c.fillRect(xc - 1, y + s / 2 + 6, 2, 18);
          label(c, 'f 0 = f 60', xc, y + s / 2 + 48, { align: 'center', size: 13, ls: 2, color: P.ink });
          label(c, 'x(t) = x₀ + A · sin(2π · t / T)', 1060, y - s / 2 - 66, { align: 'center', size: 24, ls: 1, color: P.ink, weight: 700 });
          label(c, 'AT t = 0 AND t = T: SAME VALUE, SAME SLOPE — NO POP, NO KINK', 1060, y - s / 2 - 34, { align: 'center', size: 13, ls: 2 });
        });
        // pop: the jump drawn for a moment after the seam
        const pop = t >= 4.0 && t < 4.8 ? 1 - seg(t, 4.05, 4.7) : 0;
        if (pop > 0) fade(c, pop, () => {
          c.strokeStyle = P.accentD; c.lineWidth = 3; c.setLineDash([8, 7]); c.beginPath(); c.moveTo(x1, y); c.lineTo(lBad(lPh(t)) + s / 2 + 12, y); c.stroke(); c.setLineDash([]);
          lGhost(c, x1, y, s);
          text(c, 'POP', x1, y - s / 2 - 18, { font: TK.FONT, weight: 900, size: 44, color: P.accentD, align: 'center' });
        });
        TK.token(c, x, y, s);
      });
      // S4: phase offsets
      fade(c, lVis(t, 3), () => {
        const n = 7, xs = i => 790 + i * 90, ys = (i, uu) => 450 - 80 * Math.sin(TAU * (uu - i / n));
        c.strokeStyle = 'rgba(23,24,28,0.18)'; c.lineWidth = 2; c.setLineDash([4, 6]); c.beginPath();
        for (let j = 0; j <= 120; j++) { const fi = j / 120 * (n - 1), px = xs(fi), py = ys(fi, u); j ? c.lineTo(px, py) : c.moveTo(px, py); }
        c.stroke(); c.setLineDash([]);
        for (let i = 0; i < n; i++) TK.token(c, xs(i), ys(i, u), 62, { color: i ? P.accentL : P.accent, rot: 0.22 * Math.sin(TAU * (u - i / n)) });
        label(c, 'yᵢ = A · sin(2π · (t / T − i / 7))', 1060, 280, { align: 'center', size: 22, ls: 1, color: P.ink, weight: 700 });
        label(c, 'OFFSETS SHIFT THE PHASE, NOT THE PERIOD — EVERY ONE STILL LOOPS IN T', 1060, 620, { align: 'center', size: 13, ls: 2 });
        for (let i = 0; i < n; i++) label(c, `φ ${i}/7`, xs(i), 580, { align: 'center', size: 12, ls: 1, color: i ? P.mute : P.ink });
      });
      // S5: keys for one cycle, repeated by loopOut('cycle')
      fade(c, lVis(t, 4), () => {
        const gx = 740, gw = 640, gy = 560, gh = 110, cyc = gw / 4, V = v => gy + gh - v * gh;
        const hop = kf(u * LT, LKEYS);
        TK.shadow(c, 1060, 470, 110, hop * 150);
        TK.token(c, 1060, 470 - 55 - hop * 150, 110);
        label(c, 'y: loopOut("cycle")', 1060, 232, { align: 'center', size: 22, ls: 1, color: P.ink, weight: 700 });
        c.fillStyle = 'rgba(23,24,28,0.15)'; c.fillRect(gx, gy + gh, gw, 2);
        for (let r = 0; r < 4; r++) {
          c.strokeStyle = r ? 'rgba(23,24,28,0.35)' : P.ink; c.lineWidth = r ? 2 : 3; if (r) c.setLineDash([5, 6]);
          c.beginPath();
          for (let j = 0; j <= 60; j++) { const tt = j / 60 * LT, px = gx + r * cyc + j / 60 * cyc, py = V(kf(tt, LKEYS)); j ? c.lineTo(px, py) : c.moveTo(px, py); }
          c.stroke(); c.setLineDash([]);
          c.fillStyle = 'rgba(23,24,28,0.2)'; c.fillRect(gx + r * cyc, gy - 10, 1, gh + 12);
          label(c, r ? `REPEAT ${r}` : 'AUTHORED', gx + r * cyc + cyc / 2, gy + gh + 24, { align: 'center', size: 12, ls: 2, color: r ? P.mute : P.ink, weight: 700 });
        }
        LKEYS.forEach(([kt, kv], i) => {
          const px = gx + kt / LT * cyc, py = V(kv);
          c.save(); c.translate(px, py); c.rotate(PI / 4);
          if (i === LKEYS.length - 1) { c.strokeStyle = P.accent; c.lineWidth = 2.5; c.strokeRect(-6, -6, 12, 12); } else { c.fillStyle = P.accent; c.fillRect(-6, -6, 12, 12); }
          c.restore();
        });
        label(c, 'LAST KEY = KEY 0', gx + cyc, gy - 22, { align: 'center', size: 12, ls: 1, color: P.accentD, weight: 700 });
        const ph = gx + u * cyc;
        c.fillStyle = P.accent; c.fillRect(ph - 1, gy - 14, 2, gh + 16);
        for (let r = 1; r < 4; r++) { c.fillStyle = 'rgba(255,90,31,0.35)'; c.fillRect(ph + r * cyc - 1, gy - 14, 2, gh + 16); }
      });
      lRing(c, t, k);
      lInset(c, t, k);
      // tags
      const TAGS = ['ONE CYCLE  ·  T = 2 S  ·  FRAME 60 = FRAME 0', 'THE POP  ·  LAST FRAME ≠ FIRST FRAME', 'THE FIX  ·  A PERIODIC FUNCTION', 'CYCLE OFFSETS  ·  ONE CLOCK, SEVEN PHASES', 'REPEAT THE KEYS  ·  loopOut("cycle")'];
      TAGS.forEach((s, i) => tag(c, s, 72, 80, i === 0 ? Math.max(1 - seg(t, 1.85, 2.0), seg(t, 9.6, 9.85)) : lVis(t, i)));
      const CV = [[u2 => 0.5 + 0.5 * Math.sin(TAU * u2), 'HERO y / ONE CYCLE'], [E.ioS, 'BAD KEYS x / ONE CYCLE'], [u2 => 0.5 + 0.5 * Math.sin(TAU * u2), 'FIXED x / ONE CYCLE'], [u2 => 0.5 + 0.5 * Math.sin(TAU * u2), 'TOKEN 0 y / ONE CYCLE'], [u2 => kf(u2 * LT, LKEYS), 'KEYED HOP / ONE CYCLE']];
      const c0 = t - u * LT;
      TK.caption(c, t, W, H, { name: 'Seamless Loop', cat: 'Temporal', curve: CV[k][0], span: [c0, c0 + LT], curveLabel: CV[k][1], lo: -0.15, hi: 1.15 });
    },
    score(A) {
      TK.bed(A);
      // a chime on every seam except the bad one
      [0, 2, 6, 8].forEach(t => A.bell(t, midi(84), { g: 0.05, dur: 1.2, rev: 0.4 }));
      // the hero's peak each cycle
      for (let k = 0; k < 5; k++) A.pluck(k * LT + 0.5, midi(67), { g: 0.08, bright: 0.5, dur: 0.8 });
      // filmstrip: frame ticks
      [0, 0.5, 1.0, 1.5].forEach(t => A.osc(t + 0.02, { f: 2600, dur: 0.03, g: 0.035 }));
      // bad lane slides, then pops
      A.whoosh(2.05, 1.9, { f1: 300, f2: 1800, q: 2, g: 0.06, swell: 0.5, pan: 0.3 });
      A.noise(4.0, { type: 'highpass', f: 1200, dur: 0.06, g: 0.28, crush: true });
      A.osc(4.0, { type: 'square', f: 70, dur: 0.1, g: 0.09, lp: 900 });
      A.snare(4.0, 0.14, { f: 3000, dur: 0.07 });
      // fixed lane: a tone whose vibrato has the cycle's period (0.5 Hz)
      A.osc(4.8, { type: 'triangle', f: midi(67), dur: 1.6, g: 0.04, a: 0.3, vib: [0.5, 14], lp: 2000, rev: 0.4 });
      // offsets: each Token plucks at its own peak
      for (let i = 0; i < 7; i++) {
        [6, 8].forEach(c0 => { const tt = c0 + LT * (((0.25 + i / 7) % 1)); if (tt > 6.45 && tt < 8.15) A.pluck(tt, midi([60, 62, 64, 67, 69, 72, 74][i]), { g: 0.1, bright: 0.6, dur: 0.7, pan: (i - 3) * 0.15 }); });
      }
      // loopOut hop: lift on each key, landing on 9.0
      [8.25, 9.0, 9.5].forEach((tt, i) => A.osc(tt, { f: midi([79, 72, 76][i]), dur: 0.12, g: 0.05 }));
      A.kick(9.0, 0.2, { f: 180, f2: 60, dur: 0.2 });
      A.chord(9.6, [60, 64, 67], { type: 'triangle', dur: 0.4, g: 0.03, a: 0.1, lp: 1800, rev: 0.3 });
    },
  });

  /* =====================================================================
     TRIM PATHS — a stroke drawn by trimming its path. Every path is a
     polyline sampled by arc length; start, end and offset pick the piece
     to stroke (wrapping across the start point on closed paths). The
     Token's outline (two paths: rounded square and hole, trimmed
     simultaneously) draws on with END and fills; a 25% segment chases
     two laps round it by OFFSET; MOTION, drawn as monoline strokes,
     trims SIMULTANEOUSLY in the top row and INDIVIDUALLY — one long path
     in stroke order — in the bottom row; burst strokes draw on and off
     with START lagging END; then the word draws back. A panel shows the
     current target's start / end / offset, length and visible length.
     ===================================================================== */
  const TX = 470, TY = 430, TS = 300, TLW = 12;
  function tPath(pts, closed) {
    const p = closed ? [...pts, pts[0]] : pts, L = [0];
    for (let i = 1; i < p.length; i++) L.push(L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
    return { p, L, len: L[L.length - 1], closed };
  }
  function tAt(P_, d) {
    const { p, L } = P_;
    let j = 1; while (j < L.length - 1 && L[j] < d) j++;
    const u = clamp((d - L[j - 1]) / ((L[j] - L[j - 1]) || 1));
    return [lerp(p[j - 1][0], p[j][0], u), lerp(p[j - 1][1], p[j][1], u)];
  }
  function tSub(c, P_, d0, d1) {
    if (d1 - d0 < 0.01) return;
    const a = tAt(P_, d0); c.moveTo(a[0], a[1]);
    for (let i = 0; i < P_.p.length; i++) if (P_.L[i] > d0 && P_.L[i] < d1) c.lineTo(P_.p[i][0], P_.p[i][1]);
    const b = tAt(P_, d1); c.lineTo(b[0], b[1]);
  }
  // add the trimmed piece of one path (s, e in 0..1, off in turns) to the current path
  function tTrim(c, P_, s, e, off = 0) {
    if (e - s <= 0.0005) return;
    if (!P_.closed) { tSub(c, P_, clamp(s + off) * P_.len, clamp(e + off) * P_.len); return; }
    if (e - s >= 0.9995) { tSub(c, P_, 0, P_.len); c.closePath(); return; }
    const a = ((s + off) % 1 + 1) % 1, b = a + (e - s);
    if (b <= 1) tSub(c, P_, a * P_.len, b * P_.len);
    else { tSub(c, P_, a * P_.len, P_.len); tSub(c, P_, 0, (b - 1) * P_.len); }
  }
  // INDIVIDUALLY: the paths in order form one long path; s, e are fractions of the total
  function tTrimSeq(c, paths, s, e) {
    const tot = paths.reduce((a, q) => a + q.len, 0);
    let acc = 0;
    paths.forEach(q => {
      const a = (s * tot - acc) / q.len, b = (e * tot - acc) / q.len;
      tTrim(c, q, clamp(a), clamp(b)); acc += q.len;
    });
  }
  const tStroke = (c, col, lw, fn) => { c.beginPath(); fn(); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); };
  const tGuide = (c, paths, a = 1) => fade(c, a, () => { c.save(); c.setLineDash([3, 8]); tStroke(c, 'rgba(23,24,28,0.22)', 2, () => paths.forEach(q => tTrim(c, q, 0, 1))); c.restore(); });

  // geometry (module level, so the score can time itself off the same lengths)
  const T_OUT = (() => {
    const s = TS, r = s * TK.CORNER, x0 = TX - s / 2, x1 = TX + s / 2, y0 = TY - s / 2, y1 = TY + s / 2, pts = [[TX, y0]];
    [[x1 - r, y0 + r, -PI / 2], [x1 - r, y1 - r, 0], [x0 + r, y1 - r, PI / 2], [x0 + r, y0 + r, PI]].forEach(([cx, cy, a0]) => {
      for (let i = 0; i <= 16; i++) { const a = a0 + i / 16 * PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    });
    return tPath(pts, true);
  })();
  const T_HOLE = (() => {
    const cx = TX + TS * TK.HOLE.x, cy = TY + TS * TK.HOLE.y, r = TS * TK.HOLE.r, pts = [];
    for (let i = 0; i < 64; i++) { const a = -PI / 2 + i / 64 * TAU; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return tPath(pts, true);
  })();
  const T_TOK = [T_OUT, T_HOLE], T_TOKLEN = T_OUT.len + T_HOLE.len;
  function tWord(x0, y0, h) {
    const gap = 0.36, out = [];
    const oval = (ox) => { const pts = []; for (let i = 0; i <= 48; i++) { const a = -PI / 2 - i / 48 * TAU; pts.push([ox + 0.475 + Math.cos(a) * 0.475, 0.5 + Math.sin(a) * 0.5]); } return [pts]; };
    const G = [
      [0.9, () => [[[0, 1], [0, 0], [0.45, 0.62], [0.9, 0], [0.9, 1]]]],
      [0.95, ox => oval(ox)],
      [0.8, () => [[[0, 0], [0.8, 0]], [[0.4, 0], [0.4, 1]]]],
      [0, () => [[[0, 0], [0, 1]]]],
      [0.95, ox => oval(ox)],
      [0.8, () => [[[0, 1], [0, 0], [0.8, 1], [0.8, 0]]]],
    ];
    let ox = 0;
    G.forEach(([w, f]) => {
      const strokes = f(0);
      strokes.forEach(s => out.push(tPath(s.map(([x, y]) => [x0 + (ox + x) * h, y0 + y * h]), false)));
      ox += w + gap;
    });
    return out;
  }
  const T_ROW1 = tWord(830, 250, 108), T_ROW2 = tWord(830, 470, 108);
  const T_ROWLEN = T_ROW1.reduce((a, q) => a + q.len, 0);
  const T_BURST = [0, 1, 2, 3, 4, 5].map(i => {
    const a = -PI / 2 + PI / 6 + i * TAU / 6, pts = [];
    for (let j = 0; j <= 24; j++) { const u = j / 24, r = 205 + u * 120, b = a + 0.35 * u * u; pts.push([TX + Math.cos(b) * r, TY + Math.sin(b) * r]); }
    return tPath(pts, false);
  });
  const tBurstSE = (t, i) => { const t0 = 6.95 + i * 0.08; return [E.ioC(seg(t, t0 + 0.2, t0 + 0.8)), E.outC(seg(t, t0, t0 + 0.55))]; };

  // timeline values
  const tTokEnd = t => E.ioC(seg(t, 0.3, 2.3));
  const tChase = t => seg(t, 2.75, 4.05);                         // offset in turns × 2
  const tChaseLen = t => lerp(1, 0.25, E.ioC(seg(t, 2.55, 2.8))) + 0.75 * E.ioC(seg(t, 4.05, 4.35));
  const tFill = t => E.outC(seg(t, 2.25, 2.55)) * (1 - 0.8 * seg(t, 2.6, 2.85)) + 0.8 * seg(t, 4.2, 4.5);
  const tR1 = t => [E.ioC(seg(t, 7.0, 7.7)) * (1 - seg(t, 8.4, 8.45)), E.ioC(seg(t, 4.4, 5.3)) * (1 - seg(t, 8.4, 8.45)) + E.ioC(seg(t, 8.6, 9.3))];
  const tR2 = t => [E.ioS(seg(t, 7.15, 8.15)) * (1 - seg(t, 8.4, 8.45)), E.ioS(seg(t, 5.4, 6.75)) * (1 - seg(t, 8.4, 8.45)) + E.ioS(seg(t, 8.7, 9.6))];
  function tFocus(t) {
    if (t < 2.6) return { name: 'TOKEN OUTLINE · 2 PATHS', s: 0, e: tTokEnd(t), off: 0, len: T_TOKLEN, mode: 'SIMULTANEOUSLY', curve: E.ioC, span: [0.3, 2.3], cl: 'END % / TIME' };
    if (t < 4.4) { const L = tChaseLen(t); return { name: 'TOKEN OUTLINE · 2 PATHS', s: 0, e: L, off: tChase(t) * 2, len: T_TOKLEN, mode: 'SIMULTANEOUSLY', curve: E.lin, span: [2.75, 4.05], cl: 'OFFSET (TURNS) / TIME' }; }
    if (t < 5.35) { const [s, e] = tR1(t); return { name: 'MOTION · TOP ROW · 9 PATHS', s, e, off: 0, len: T_ROWLEN, mode: 'SIMULTANEOUSLY', curve: E.ioC, span: [4.4, 5.3], cl: 'END % / TIME' }; }
    if (t < 6.85) { const [s, e] = tR2(t); return { name: 'MOTION · BOTTOM ROW · 9 PATHS', s, e, off: 0, len: T_ROWLEN, mode: 'INDIVIDUALLY', curve: E.ioS, span: [5.4, 6.75], cl: 'END % / TIME' }; }
    if (t < 8.5) { const [s, e] = tBurstSE(t, 0); return { name: 'BURST STROKE 1 OF 6', s, e, off: 0, len: T_BURST[0].len, mode: 'START LAGS END', curve: u => E.outC(u), span: [6.95, 7.5], cl: 'END % / TIME' }; }
    const [s, e] = tR2(t); return { name: 'MOTION · BOTTOM ROW · 9 PATHS', s, e, off: 0, len: T_ROWLEN, mode: 'INDIVIDUALLY', curve: E.ioS, span: [8.7, 9.6], cl: 'END % / TIME' };
  }
  // the times at which each bottom-row stroke starts drawing (individually), for the score
  const tSeqStarts = (t0, t1, ease) => { let acc = 0; return T_ROW2.map(q => { const f = acc / T_ROWLEN; acc += q.len; let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; ease(m) < f ? (lo = m) : (hi = m); } return lerp(t0, t1, lo); }); };

  MG.film({
    id: 'techtrimpaths', dur: 10, poster: 6.2,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Trim Paths', sub: 'Draw a stroke by trimming its start and end', era: '2007 —',
      origin: 'Draw-on lines came first as effects that revealed a stroke along a path, such as After Effects’ Stroke and Write-on. Trim Paths arrived with After Effects shape layers in CS3 (2007): an operator that keeps only the part of a path between a start and an end percentage, with an offset that slides the window round and a choice of trimming several paths simultaneously or one after another. On the web the same idea runs on an SVG stroke’s dash array and dash offset, popularised for line-drawing animation around 2013, and Airbnb’s Lottie (2017) carried After Effects trim paths into apps.',
      works: 'Animated line drawing in SVG (Jake Archibald, 2013) · Lottie (Airbnb, 2017; After Effects trim paths played back in apps) · Lottie (Airbnb, 2017)',
      tech: ['Start · end · offset', 'Simultaneous vs individual', 'Arc-length sampled paths'],
      accent: '#ff5a1f',
      motionDNA: 'The outline draws on over a bar on an in-out ease and the fill drops in on the downbeat; a quarter-length segment then laps the Token twice at constant speed and grows back to a closed line. MOTION draws all nine strokes at once in one row and stroke after stroke in the next, so the same END curve reads as one gesture or as handwriting; six bursts fire on and off with START a fifth of a second behind END, the rows erase by START, and the word draws back on.',
      visualDNA: 'The Technique Atlas stage: the Token outlined in a thick round-capped ink stroke over its orange fill, faint dotted guides showing each untrimmed path, orange S and E markers at the trimmed ends; MOTION as monoline ink strokes in two rows labelled by mode; orange burst strokes round the Token; a right-hand panel with START, END and OFFSET sliders, the target, its length and visible length in pixels.',
      transitions: 'Draw-on and draw-off by trim; the offset chase wraps across the path’s start point',
      implementation: ['After Effects shape layers: Trim Paths (start, end, offset; simultaneously / individually)', 'SVG stroke-dasharray / stroke-dashoffset with getTotalLength(); Lottie trim paths', 'Canvas 2D: polylines sampled by arc length, sub-path stroked between start and end'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      const fo = tFocus(t);
      // ---- Token ----
      const fill = tFill(t);
      if (fill > 0.001) fade(c, fill, () => TK.token(c, TX, TY, TS));
      tGuide(c, T_TOK, 1 - seg(t, 4.3, 4.6));
      let ts = 0, te = tTokEnd(t), toff = 0;
      if (t >= 2.55) { te = tChaseLen(t); toff = tChase(t) * 2; }
      tStroke(c, P.ink, TLW, () => T_TOK.forEach(q => tTrim(c, q, ts, te, toff)));
      // S / E markers on the outer path
      fade(c, 1 - seg(t, 4.3, 4.5), () => {
        const sp = tAt(T_OUT, (((ts + toff) % 1 + 1) % 1) * T_OUT.len), ep = tAt(T_OUT, (((te + toff) % 1 + 1) % 1) * T_OUT.len);
        [[sp, 'S'], [ep, 'E']].forEach(([p, n], i) => {
          if (i === 1 && te >= 0.999) return;
          c.fillStyle = P.accent; c.beginPath(); c.arc(p[0], p[1], 11, 0, TAU); c.fill();
          c.fillStyle = P.ground; c.beginPath(); c.arc(p[0], p[1], 4.5, 0, TAU); c.fill();
          const dx = p[0] - TX, dy = p[1] - TY, m = Math.hypot(dx, dy) || 1;
          label(c, n, p[0] + dx / m * 34, p[1] + dy / m * 34 + 6, { align: 'center', size: 18, color: P.accentD, weight: 700 });
        });
      });
      // bursts
      T_BURST.forEach((q, i) => { const [s, e] = tBurstSE(t, i); if (e > s) tStroke(c, P.accent, 9, () => tTrim(c, q, s, e)); });
      fade(c, seg(t, 6.85, 7.0) * (1 - seg(t, 8.0, 8.3)), () => tGuide(c, T_BURST, 0.6));
      // ---- MOTION rows ----
      const rowsOn = seg(t, 4.15, 4.4);
      fade(c, rowsOn, () => {
        const [s1, e1] = tR1(t), [s2, e2] = tR2(t);
        tGuide(c, T_ROW1, 0.9); tGuide(c, T_ROW2, 0.9);
        tStroke(c, P.ink, 14, () => T_ROW1.forEach(q => tTrim(c, q, s1, e1)));
        tStroke(c, P.ink, 14, () => tTrimSeq(c, T_ROW2, s2, e2));
        label(c, 'SIMULTANEOUSLY  ·  EVERY PATH 0 → 100% AT ONCE', 830, 222, { size: 14, ls: 2, color: t < 5.35 || (t > 6.9 && t < 7.8) ? P.ink : P.mute, weight: 700 });
        label(c, 'INDIVIDUALLY  ·  PATHS IN ORDER AS ONE LONG PATH', 830, 442, { size: 14, ls: 2, color: (t >= 5.35 && t < 6.85) || t >= 8.5 ? P.ink : P.mute, weight: 700 });
      });
      // ---- parameter panel ----
      const px = 1590, pw = 260;
      label(c, 'TRIM PATHS', px, 200, { size: 16, ls: 3, color: P.ink, weight: 700 });
      label(c, fo.name, px, 226, { size: 12, ls: 1, color: P.accentD, weight: 700 });
      const offDeg = Math.round(((fo.off % 1) + 1) % 1 * 360), turns = Math.floor(fo.off + 1e-6);
      slider(c, px, 286, pw, 'START', `${Math.round(fo.s * 100)}%`, fo.s, { active: t >= 6.95 && t < 8.3 });
      slider(c, px, 346, pw, 'END', `${Math.round(fo.e * 100)}%`, fo.e, { active: !(t >= 2.75 && t < 4.05) });
      slider(c, px, 406, pw, 'OFFSET', `${turns}× ${offDeg}°`, ((fo.off % 1) + 1) % 1, { active: t >= 2.75 && t < 4.05 });
      c.fillStyle = 'rgba(23,24,28,0.12)'; c.fillRect(px, 440, pw, 1);
      label(c, 'PATH LENGTH', px, 472, { size: 13, ls: 2 });
      label(c, `${Math.round(fo.len)} PX`, px + pw, 472, { size: 13, ls: 1, color: P.ink, align: 'right', weight: 700 });
      label(c, 'VISIBLE', px, 500, { size: 13, ls: 2 });
      label(c, `${Math.round(Math.max(0, fo.e - fo.s) * fo.len)} PX`, px + pw, 500, { size: 13, ls: 1, color: P.ink, align: 'right', weight: 700 });
      label(c, 'MULTIPLE PATHS', px, 528, { size: 13, ls: 2 });
      label(c, fo.mode, px + pw, 556, { size: 13, ls: 1, color: P.ink, align: 'right', weight: 700 });
      // tag
      const TG = t < 2.6 ? 'DRAW ON  ·  END 0 → 100%' : t < 4.4 ? 'OFFSET  ·  A 25% WINDOW LAPS THE PATH' : t < 6.85 ? 'MULTIPLE PATHS  ·  SIMULTANEOUSLY vs INDIVIDUALLY' : t < 8.5 ? 'DRAW OFF  ·  START FOLLOWS END' : 'DRAW ON AGAIN';
      tag(c, TG, 72, 80, seg(t, 0.05, 0.35));
      TK.caption(c, t, W, H, { name: 'Trim Paths', cat: 'Shape', curve: fo.curve, span: fo.span, curveLabel: fo.cl });
    },
    score(A) {
      TK.bed(A);
      // pen on paper while the outline draws
      A.noise(0.3, { type: 'bandpass', f: 2200, f2: 5200, sweep: 2, q: 5, dur: 2.0, g: 0.05, a: 0.15, hold: true, rel: 0.2 });
      A.osc(0.3, { type: 'triangle', f: midi(55), f2: midi(67), glide: 2, dur: 2.05, g: 0.035, a: 0.2, hold: true, rel: 0.2, lp: 1800 });
      A.pluck(2.3, midi(72), { g: 0.16, bright: 0.6, dur: 1 });
      A.kick(2.3, 0.22, { f: 160, f2: 60, dur: 0.25 });
      // offset chase: a tick each quarter lap, a bell per lap
      for (let k = 1; k <= 8; k++) A.osc(2.75 + k * 1.3 / 8, { f: k % 4 ? 2400 : 3200, dur: 0.035, g: k % 4 ? 0.035 : 0.06 });
      [3.4, 4.05].forEach((tt, i) => A.bell(tt, midi([79, 84][i]), { g: 0.05, dur: 1.2 }));
      // top row simultaneous: one swelling chord
      A.chord(4.4, [60, 64, 67, 71], { type: 'triangle', dur: 1.0, g: 0.03, a: 0.7, lp: 2400, rev: 0.4, width: 0.7 });
      A.noise(4.4, { type: 'bandpass', f: 1800, f2: 4500, sweep: 0.9, q: 3, dur: 0.95, g: 0.05, swell: 0.7 });
      // bottom row individually: a pluck as each stroke begins
      const notes = [60, 62, 64, 67, 69, 72, 74, 76, 79];
      tSeqStarts(5.4, 6.75, E.ioS).forEach((tt, i) => A.pluck(tt, midi(notes[i]), { g: 0.12, bright: 0.65, dur: 0.6, pan: (i - 4) * 0.1 }));
      // bursts and erase
      for (let i = 0; i < 6; i++) A.whoosh(6.95 + i * 0.08, 0.55, { f1: 900, f2: 5000, q: 2, g: 0.05, swell: 0.3, pan: Math.cos(i * TAU / 6) * 0.5 });
      A.pluck(7.0, midi(84), { g: 0.1, bright: 0.8, dur: 0.6 });
      A.noise(7.0, { type: 'bandpass', f: 4500, f2: 1500, sweep: 1.1, q: 3, dur: 1.15, g: 0.04, swell: 0.4 });
      // draw back on
      tSeqStarts(8.7, 9.6, E.ioS).forEach((tt, i) => A.pluck(tt, midi(notes[i] + 12), { g: 0.07, bright: 0.6, dur: 0.5 }));
      A.chord(9.6, [60, 64, 67, 72], { type: 'triangle', dur: 0.4, g: 0.04, a: 0.02, lp: 2600, rev: 0.6, width: 0.8 });
    },
  });
})();
