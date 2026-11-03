/* batch k14 — Technique Atlas · Temporal, Typography: techecho · techframestep · techcharstagger.
   techecho (the time-echo effect: the Token composited with copies of itself sampled at
   t + k × echo time, each copy's opacity scaled by starting intensity × decay^k — the number of
   echoes, the echo time, the decay and the echo operator (composite in back, add, maximum) each
   changed in turn, with an effect-controls panel and a layer-time strip of the echo samples) ·
   techframestep (one smooth move sampled and held: four lanes on ones, twos, fours and at a
   posterised 6 fps, each with a hold strip of its last twelve frames and a dashed ghost of where
   ones would be; then a 6 fps stop-motion pass with pose jitter, onion skins and exposure flicker) ·
   techcharstagger (a text animator on the letters of MOTION: one property set — rise and fade,
   rotate in, scale — run per character with a range selector handing each letter its amount,
   ordered left to right, right to left, from the centre and at random, with index chips, a
   selector amount strip and per-letter timing bars; then the same animator on a 39-character line). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, midi, text, rrect } = MG;
  const TK = MG.TK, P = TK.P, PI = Math.PI, BEAT = TK.BEAT;

  /* ---------------- shared helpers ---------------- */
  const label = (c, s, x, y, o = {}) => text(c, s, x, y, { font: TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
  const tag = (c, s, x, y, on = 1) => {   // small accent dot + mono label, top-left of frame
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: P.ink, weight: 700, size: 20 });
    c.restore();
  };
  const pad = (n, k) => String(n).padStart(k, '0');
  const FPS = 30;
  const frameOf = t => Math.floor(t * FPS + 1e-6);
  // phase table lookup: rows are [t0, ...]
  const phaseAt = (rows, t) => { let k = 0; rows.forEach((r, i) => { if (t >= r[0]) k = i; }); return k; };

  /* =====================================================================
     ECHO — the time-echo effect. The Token runs a figure-eight; the effect
     composites the layer with N copies of itself sampled from other
     times: echo k shows the layer at t + k × echoTime (echo time is
     negative, so the copies come from earlier frames) at opacity
     startingIntensity × decay^k. The number of echoes grows from 0 to 8,
     the echo time stretches from −2 to −8 frames so the trail spreads,
     the decay drops so it fades faster, then the echo operator changes:
     ADD (overlaps sum towards white), MAXIMUM (overlaps keep the brighter
     pixel) and back to COMPOSITE IN BACK as the source stops and every
     echo catches up with it. Echoes are drawn into their own layer and
     composited with the operator; nothing is read from earlier frames.
     ===================================================================== */
  const EC = { s: 200, cx: 960, cy: 500, ax: 520, ay: 170, stop: 8.9 };
  const EC_PH = [
    [0, 'SOURCE LAYER  ·  NO ECHOES', 'ONE TOKEN ON A FIGURE-EIGHT PATH', -1],
    [1.0, 'NUMBER OF ECHOES  0 → 8', 'COPIES OF THE LAYER FROM EARLIER FRAMES', 1],
    [2.4, 'ECHO TIME  −2 → −8 FRAMES', 'A LONGER ECHO TIME SPREADS THE TRAIL', 0],
    [4.4, 'DECAY  0.85 → 0.55', 'EACH ECHO IS THE ONE BEFORE IT × DECAY', 3],
    [6.2, 'ECHO OPERATOR  ·  ADD', 'OVERLAPS SUM AND BURN TOWARDS WHITE', 4],
    [7.2, 'ECHO OPERATOR  ·  MAXIMUM', 'OVERLAPS KEEP THE BRIGHTER PIXEL  ·  NO BUILD-UP', 4],
    [8.2, 'COMPOSITE IN BACK  ·  THE SOURCE STOPS', 'EVERY ECHO CATCHES UP: SAME LAYER, LATER FRAME', 4],
  ];
  const ecN = t => Math.min(8, Math.floor(kf(t, [[1.0, 0], [2.4, 8.999, E.lin]])));
  const ecFrames = t => kf(t, [[2.4, 2], [4.0, 8, E.ioS], [5.8, 8], [6.2, 3, E.ioS]]);
  const ecDecay = t => kf(t, [[4.4, 0.85], [5.4, 0.55, E.ioS], [5.8, 0.55], [6.2, 0.85, E.ioS]]);
  const EC_I0 = 1;
  const ecOp = t => (t < 6.2 ? 'back' : t < 7.2 ? 'add' : t < 8.2 ? 'max' : 'back');
  const EC_OPS = { back: 'Composite In Back', add: 'Add', max: 'Maximum' };
  // source clock: real time until 8.2, then an ease to a stop at 8.9 (entry speed 1)
  const ecTau = t => (t < 8.2 ? t : 8.2 + 0.7 * E.outQ(seg(t, 8.2, 9.6)));
  function ecPose(tau) {
    const u = tau - EC.stop;
    return { x: EC.cx + EC.ax * Math.sin(PI * u / 2), y: EC.cy + EC.ay * Math.sin(PI * u), rot: tau * 1.1 };
  }

  MG.film({
    id: 'techecho', dur: 10, poster: 3.7,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Echo', sub: 'The layer, composited with itself from earlier frames', era: '1880s —',
      origin: 'Showing several moments of one movement in a single picture goes back to Étienne-Jules Marey’s chronophotographs of the 1880s, and Marcel Duchamp painted it in Nude Descending a Staircase, No. 2 (1912). Norman McLaren put it in motion in Pas de deux (1968), optically printing each dancer over delayed copies of themselves. Compositing software turned it into an effect: After Effects’ Echo samples the layer at fixed time offsets, with an echo time, a number of echoes, a starting intensity, a decay and an operator that decides how the copies combine.',
      works: 'Étienne-Jules Marey, chronophotographs (1880s) · Nude Descending a Staircase, No. 2 (Marcel Duchamp, 1912) · Pas de deux (Norman McLaren, National Film Board of Canada, 1968)',
      tech: ['Echo k = layer at t + k × echo time', 'Opacity = intensity × decay^k', 'Echo operator: back · add · maximum'],
      accent: '#ff5a1f',
      motionDNA: 'The source never changes — one even figure-eight — and the effect only resamples it. Echoes switch on one at a time over a bar and a half, the echo time eases from −2 to −8 frames so a tight smear opens into a spaced chain, the decay drops so the tail dies within a few copies, the operator flips from compositing to adding to maximum on the beat, and when the source eases to a stop the copies arrive one after another and stack on it.',
      visualDNA: 'The Technique Atlas stage: the orange Token on a figure-eight with up to eight fading copies, burning to pale yellow where added copies overlap; small index labels on each echo while it is spread; an effect-controls panel top right with the active parameter marked; a layer-time strip of frame ticks and echo sample bars, bar height = opacity.',
      transitions: 'Parameter changes on the beat; operator switches as hard cuts; the trail collapses onto the stopped source',
      implementation: ['Optical printing of delayed multiple exposures', 'After Effects Echo effect / Nuke TimeEcho / frame-blend trails', 'Canvas 2D: each echo redrawn from the closed-form path at t + k × echo time into its own layer, composited with lighter / lighten / source-over'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { L: MG.offscreen(1920, 1080) }; },
    draw(c, t, W, H, st) {
      TK.stage(c, W, H);
      const N = ecN(t), eF = ecFrames(t), e = -eF / FPS, d = ecDecay(t), op = ecOp(t);
      const ph = phaseAt(EC_PH, t), row = EC_PH[ph];
      // path guide
      c.save(); c.setLineDash([2, 12]); c.lineCap = 'round'; c.strokeStyle = 'rgba(23,24,28,0.22)'; c.lineWidth = 3; c.beginPath();
      for (let i = 0; i <= 200; i++) { const p = ecPose(i / 200 * 4); i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); }
      c.stroke(); c.restore();
      // echoes into their own layer, combined with the operator
      const L = st.L, lc = L.getContext('2d');
      lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, W, H);
      lc.globalCompositeOperation = op === 'add' ? 'lighter' : 'source-over';
      for (let k = N; k >= 0; k--) {     // oldest first, so the source lands in front (composite in back)
        const p = ecPose(ecTau(t + k * e)), a = EC_I0 * Math.pow(d, k);
        if (op === 'max') {
          // maximum: every copy is the same colour, so the brightest copy wins — opacities rise with
          // each newer copy, so each one replaces what is under it instead of building on it
          lc.save(); lc.translate(p.x, p.y); lc.rotate(p.rot); lc.beginPath(); TK.tokenPath(lc, EC.s); lc.clip('evenodd');
          lc.clearRect(-EC.s, -EC.s, EC.s * 2, EC.s * 2); lc.globalAlpha = a; lc.fillStyle = P.accent; lc.fillRect(-EC.s, -EC.s, EC.s * 2, EC.s * 2);
          lc.restore();
          continue;
        }
        lc.globalAlpha = a;
        TK.token(lc, p.x, p.y, EC.s, { rot: p.rot });
      }
      lc.globalAlpha = 1; lc.globalCompositeOperation = 'source-over';
      c.drawImage(L, 0, 0);
      // echo indices while the trail is spread
      const ia = seg(eF, 5, 7) * (1 - seg(t, 5.5, 5.9));
      if (ia > 0.01) {
        c.save(); c.globalAlpha = ia;
        for (let k = 1; k <= N; k++) {
          const p = ecPose(ecTau(t + k * e));
          label(c, `k${k}`, p.x, p.y - EC.s * 0.62, { align: 'center', size: 16, ls: 1, color: P.ink, weight: 700 });
        }
        const p0 = ecPose(ecTau(t));
        label(c, 'SOURCE', p0.x, p0.y - EC.s * 0.62, { align: 'center', size: 16, ls: 2, color: P.accentD, weight: 700 });
        c.restore();
      }
      // tag + formula
      const on = seg(t, row[0], row[0] + 0.2) * seg(t, 0.1, 0.4);
      tag(c, row[1], 72, 80, on);
      c.save(); c.globalAlpha = on; label(c, row[2], 98, 112, { size: 15, ls: 2 }); c.restore();
      label(c, 'ECHO k  =  LAYER AT ( t + k · echoTime )   ·   OPACITY  I0 · decay^k', 98, 146, { size: 15, ls: 1, color: P.ink, weight: 700 });
      // effect controls panel
      const px = 1470, py = 52, pw = 378, rh = 34;
      rrect(c, px, py, pw, 46 + rh * 5 + 10, 10); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fill();
      c.strokeStyle = 'rgba(23,24,28,0.18)'; c.lineWidth = 1; c.stroke();
      label(c, 'fx  ECHO  ·  EFFECT CONTROLS', px + 16, py + 30, { size: 14, ls: 2, color: P.ink, weight: 700 });
      const rows = [
        ['Echo Time (s)', `${(e).toFixed(3).replace('-', '−')}  (${(-eF).toFixed(1).replace('-', '−')} f)`],
        ['Number Of Echoes', String(N)],
        ['Starting Intensity', EC_I0.toFixed(2)],
        ['Decay', d.toFixed(2)],
        ['Echo Operator', EC_OPS[op]],
      ];
      rows.forEach(([k, v], i) => {
        const y = py + 46 + rh * i + 22, act = i === row[3];
        if (act) { c.fillStyle = 'rgba(255,90,31,0.12)'; c.fillRect(px + 6, y - 22, pw - 12, rh - 2); c.fillStyle = P.accent; c.beginPath(); c.arc(px + 16, y - 6, 5, 0, TAU); c.fill(); }
        label(c, k, px + 28, y, { size: 14, ls: 1, color: act ? P.ink : P.mute, weight: act ? 700 : 400 });
        label(c, v, px + pw - 16, y, { size: 14, ls: 1, color: P.ink, weight: 700, align: 'right' });
      });
      // layer-time strip: frame ticks and echo sample bars (height = opacity)
      const sx0 = 720, sx1 = 1520, sy = 1004, span = 2.2, X = tt => sx1 - (t - tt) / span * (sx1 - sx0);
      label(c, 'LAYER TIME  ·  ONE TICK = ONE FRAME  ·  BAR = ECHO OPACITY', sx0, 912, { size: 13, ls: 2 });
      c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(sx0, sy, sx1 - sx0, 2);
      for (let f = frameOf(t); f / FPS > t - span; f--) { const x = X(f / FPS), big = f % FPS === 0; c.fillRect(x - 0.5, sy + 2, 1, big ? 12 : 6); }
      const gap = Math.abs(e) / span * (sx1 - sx0);
      for (let k = N; k >= 0; k--) {
        const x = X(t + k * e), h = 64 * EC_I0 * Math.pow(d, k);
        if (x < sx0 + 2) continue;
        c.fillStyle = k ? `rgba(255,90,31,${0.35 + 0.65 * Math.pow(d, k)})` : P.ink;
        c.fillRect(x - 4, sy - h, 8, h);
        if (gap > 22 || k === 0 || k === N) label(c, k ? String(k) : 't', x, sy + 34, { align: 'center', size: 13, ls: 0, color: k ? P.mute : P.ink, weight: k ? 400 : 700 });
      }
      label(c, `−${span.toFixed(1)} s`, sx0 - 14, sy + 5, { size: 12, ls: 1, align: 'right' });
      TK.caption(c, t, W, H, { name: 'Echo', cat: 'Temporal', curve: u => EC_I0 * Math.pow(d, u * 8), span: [t - N / 8, t - N / 8 + 1], lo: -0.1, hi: 1.15, curveLabel: `OPACITY / ECHO k  ·  ${d.toFixed(2)}^k` });
    },
    score(A) {
      TK.bed(A);
      // every half-bar a ping, repeated like the picture: one repeat per echo, echo time apart, × decay each time
      for (let b = 0; b < 19; b++) {
        const t = 0.5 + b * BEAT * 1, N = ecN(t), e = ecFrames(t) / FPS, d = ecDecay(t), op = ecOp(t);
        const note = midi([72, 76, 79, 74, 77, 81, 76, 79][b % 8]);
        for (let k = 0; k <= N; k++) {
          const g = (op === 'add' ? 0.1 : 0.12) * Math.pow(d, k);
          if (op === 'max' && k > 0) continue;   // maximum: overlaps don't add — a single, longer note
          A.pluck(t + k * e, note, { g, bright: op === 'add' ? 0.9 : 0.6, dur: op === 'max' ? 1.2 : 0.6, pan: Math.sin(k * 0.9) * 0.4 });
        }
        if (op === 'max') A.osc(t, { type: 'triangle', f: note, dur: 0.45, g: 0.05, a: 0.01, hold: true, lp: 3000 });
      }
      // each echo switching on
      for (let k = 1; k <= 8; k++) A.osc(1.0 + k * 1.4 / 9, { f: 1800 + k * 140, dur: 0.04, g: 0.035 });
      A.whoosh(2.4, 1.6, { f1: 400, f2: 2200, q: 2, g: 0.08, swell: 0.6, rev: 0.35 });
      A.osc(4.4, { type: 'triangle', f: 660, f2: 330, glide: 1.0, dur: 1.1, g: 0.04, a: 0.1, lp: 2000, rev: 0.4 });
      A.snare(6.2, 0.14, { f: 3000, dur: 0.1 }); A.snare(7.2, 0.12, { f: 1600, dur: 0.1 });
      // the source stops; the echoes arrive one after another
      for (let k = 0; k <= 8; k++) A.osc(9.6 + k * 0.1 * 0.5, { f: midi(84 - k), dur: 0.05, g: 0.04 * Math.pow(0.85, k) });
      A.bell(9.6, midi(84), { g: 0.08, dur: 1.4, rev: 0.5 });
      A.chord(9.6, [60, 64, 67, 72], { type: 'triangle', dur: 0.8, g: 0.035, a: 0.05, lp: 2400, rev: 0.6, width: 0.8 });
    },
  });

  /* =====================================================================
     FRAME STEPPING — one smooth move (a bar-long ease across and back,
     turning once) sampled and held. Four lanes run the identical curve on
     a 30 fps project: on ones (a new drawing every frame), on twos (each
     held two frames), on fours (four) and through Posterize Time at 6 fps
     (held five). A dashed ghost shows where ones would be, so the lag and
     catch-up of every hold is visible; a strip beside each lane shows its
     last twelve frames with repeated drawings merged into one block. Then
     a single large Token runs at 6 fps with the marks of stop motion —
     each pose nudged by hand (seeded jitter), onion skins of the two
     poses before, a flicker of exposure — and MOTION goes up letter by
     letter on the same 6 fps clock.
     ===================================================================== */
  const FS_LANES = [
    { name: 'ON ONES', fps: 30, sub: '30 DRAWINGS / S', hold: 'HOLD 1 FRAME' },
    { name: 'ON TWOS', fps: 15, sub: '15 DRAWINGS / S', hold: 'HOLD 2 FRAMES' },
    { name: 'ON FOURS', fps: 7.5, sub: '7.5 DRAWINGS / S', hold: 'HOLD 4 FRAMES' },
    { name: 'POSTERIZE TIME', fps: 6, sub: '6 FPS', hold: 'HOLD 5 FRAMES' },
  ];
  const FS_Y = [250, 405, 560, 715], FS_S = 104, FS_X0 = 480, FS_X1 = 1380;
  const FS_STOP = 6.0, FS_FL = 790, FS_BIG = 220;
  const FS_PH = [
    [0, 'SAME MOTION  ·  FOUR SAMPLE RATES', 'PROJECT 30 FPS  ·  EACH LANE HOLDS A DRAWING FOR n FRAMES'],
    [3.0, 'DASHED  =  WHERE ONES WOULD BE', 'A HOLD LAGS THE CURVE, THEN JUMPS TO CATCH UP'],
    [FS_STOP, 'STOP-MOTION FEEL  ·  6 FPS', 'HOLDS  +  HAND-PLACED POSE JITTER  +  EXPOSURE FLICKER'],
  ];
  const held = (t, fps) => Math.floor(t * fps + 1e-6) / fps;
  function fsP(tau) {   // across in one second, back in the next
    const ph = ((tau % 2) + 2) % 2;
    return ph < 1 ? E.ioC(ph) : 1 - E.ioC(ph - 1);
  }
  // the hold strip: last 12 project frames, repeated drawings merged
  function fsStrip(c, t, x0, y, framesPerDrawing, a = 1) {
    const n = 12, cw = 29, ch = 34, f = frameOf(t);
    c.save(); c.globalAlpha *= a;
    let j = 0;
    while (j < n) {
      const g = f - (n - 1) + j, dr = Math.floor(g / framesPerDrawing + 1e-6);
      let k = j; while (k + 1 < n && Math.floor((f - (n - 1) + k + 1) / framesPerDrawing + 1e-6) === dr) k++;
      const x = x0 + j * cw, w = (k - j + 1) * cw - 3, cur = k === n - 1;
      rrect(c, x, y, w, ch, 5); c.fillStyle = cur ? P.accent : 'rgba(23,24,28,0.08)'; c.fill();
      if (w >= 26) label(c, pad(((dr % 1000) + 1000) % 1000, framesPerDrawing === 1 ? 2 : 3).slice(-(framesPerDrawing === 1 ? 2 : 3)), x + w / 2, y + ch / 2 + 1, { align: 'center', size: framesPerDrawing === 1 ? 11 : 13, ls: 0, base: 'middle', color: cur ? '#fff' : P.ink, weight: 700 });
      j = k + 1;
    }
    const mx = x0 + (n - 1) * cw + (cw - 3) / 2;   // now-marker under the last cell
    c.fillStyle = P.ink; c.beginPath(); c.moveTo(mx, y + ch + 4); c.lineTo(mx - 7, y + ch + 14); c.lineTo(mx + 7, y + ch + 14); c.closePath(); c.fill();
    c.restore();
  }

  MG.film({
    id: 'techframestep', dur: 10, poster: 4.64,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Frame Stepping', sub: 'Ones, twos, fours: sampling motion and holding it', era: '1910s —',
      origin: 'Drawn animation has been shot on twos — each drawing held for two frames — since the silent era, halving the drawings for movement that still reads; fast action goes to ones, and the limited animation of 1950s and 60s television leaned on threes, fours and long holds. Stop motion such as Willis O’Brien’s work on King Kong (1933) carries the same stepped look, with every pose placed by hand. Digital tools made it a setting: After Effects’ Posterize Time effect and posterizeTime() expression resample any smooth animation to a lower rate, and Spider-Man: Into the Spider-Verse (2018) mixed ones and twos on purpose.',
      works: 'King Kong (Merian C. Cooper and Ernest B. Schoedsack, 1933; stop motion by Willis O’Brien) · The Lego Movie (Phil Lord and Christopher Miller, 2014) · Spider-Man: Into the Spider-Verse (Sony Pictures Animation, 2018)',
      tech: ['Sample and hold: t → floor(t · fps) / fps', 'Ones · twos · fours · posterised 6 fps', 'Pose jitter for a hand-placed feel'],
      accent: '#ff5a1f',
      motionDNA: 'One curve, four clocks: a bar-long ease across and back with a full turn, identical in every lane but redrawn every frame, every second, every fourth and every fifth frame — so the same ease reads as fluid, crisp, choppy and stuttering. The holds lag the smooth ghost and jump to catch up, biggest jumps in the middle of the ease. Then a 6 fps stop-motion run of rolls and hops that never sits quite still between poses, and a word set letter by letter on the same clock.',
      visualDNA: 'The Technique Atlas stage split into four labelled lanes, small orange Tokens on thin tracks, dashed outline ghosts at the ones position; hold strips of twelve frame cells, repeated drawings merged into blocks numbered by drawing, the current one orange; then a floor, a large Token, dashed onion skins and a drawing counter; the held-time staircase as the caption graph.',
      transitions: 'Lanes enter on the beat and clear together; a cut to the single stop-motion Token; letters appear on the held clock',
      implementation: ['Exposure sheets: ones, twos, threes, holds', 'After Effects Posterize Time / posterizeTime(fps); Blender Stepped Interpolation modifier', 'Canvas 2D: the time fed to the pose is floor(t · fps) / fps; jitter seeded by drawing number'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const stop = t >= FS_STOP;
      TK.stage(c, W, H, stop ? { floor: FS_FL } : {});
      const la = 1 - seg(t, FS_STOP - 0.3, FS_STOP);
      if (!stop) {
        label(c, 'LAST 12 FRAMES  ·  NOW ▸', 1500 + 12 * 29 - 2, FS_Y[0] - 70, { size: 13, ls: 2, align: 'right' });
        FS_LANES.forEach((ln, i) => {
          const y = FS_Y[i], a = seg(t, 0.2 + i * 0.5, 0.5 + i * 0.5) * la;
          if (a <= 0.01) return;
          c.save(); c.globalAlpha = a;
          label(c, ln.name, 72, y - 12, { size: 20, color: P.ink, weight: 700 });
          label(c, ln.sub, 72, y + 16, { size: 15, ls: 2 });
          label(c, ln.hold, 72, y + 40, { size: 15, ls: 2, color: P.accentD, weight: 700 });
          // track
          c.fillStyle = 'rgba(23,24,28,0.18)'; c.fillRect(FS_X0 - 70, y + FS_S / 2 + 10, FS_X1 - FS_X0 + 140, 2);
          // ghost at the ones position
          const ps = fsP(t);
          if (ln.fps < 30) {
            c.save(); c.translate(lerp(FS_X0, FS_X1, ps), y); c.rotate(ps * TAU); TK.tokenPath(c, FS_S); c.restore();
            c.setLineDash([6, 6]); c.strokeStyle = 'rgba(23,24,28,0.45)'; c.lineWidth = 2; c.stroke(); c.setLineDash([]);
          }
          const th = held(t, ln.fps), p = fsP(th), x = lerp(FS_X0, FS_X1, p);
          TK.token(c, x, y, FS_S, { rot: p * TAU });
          // lag readout
          if (ln.fps < 30) {
            const lagF = Math.round((t - th) * FPS);
            label(c, `+${lagF} F`, x, y - FS_S / 2 - 14, { align: 'center', size: 13, ls: 1, color: lagF ? P.accentD : P.mute, weight: 700 });
          }
          fsStrip(c, t, 1500, y - 17, 30 / ln.fps);
          c.restore();
        });
      } else {
        // stop-motion pass at 6 fps
        const th = held(t, 6), dn = Math.floor(t * 6 + 1e-6);
        const pose = tt => {
          const u = seg(tt, 6.3, 9.0), x = lerp(430, 1440, E.ioS(u)), hop = Math.abs(Math.sin(PI * u * 4)) * 110 * (u > 0 && u < 1 ? 1 : 0);
          const n = Math.floor(tt * 6 + 1e-6);
          return { x: x + (hash(n * 1.7) - 0.5) * 14, y: FS_FL - FS_BIG / 2 - hop + (hash(n * 3.3) - 0.5) * 6, rot: (x - 430) / 140 + (hash(n * 5.1) - 0.5) * 0.06, hop };
        };
        const q = pose(th);
        for (let k = 2; k >= 1; k--) {
          const o = pose(th - k / 6);
          c.save(); c.translate(o.x, o.y); c.rotate(o.rot); TK.tokenPath(c, FS_BIG); c.restore();
          c.setLineDash([7, 7]); c.strokeStyle = `rgba(198,62,12,${0.55 - k * 0.18})`; c.lineWidth = 2; c.stroke(); c.setLineDash([]);
        }
        TK.shadow(c, q.x, FS_FL, FS_BIG, q.hop);
        TK.token(c, q.x, q.y, FS_BIG, { rot: q.rot });
        // the word, letter by letter on the 6 fps clock
        const nl = clamp(Math.floor((t - 9.0) * 6 + 1e-6) + 1, 0, 6);
        if (t >= 9.0) {
          c.font = `900 150px ${TK.FONT}`;
          const ws = [...TK.WORD].map(ch => c.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0) + 8 * 5;
          let x = 960 - tot / 2;
          for (let i = 0; i < nl; i++) { text(c, TK.WORD[i], x + ws[i] / 2 + (hash(i * 9.1 + dn) - 0.5) * 4, 440 + (hash(i * 4.4 + dn) - 0.5) * 4, { font: TK.FONT, weight: 900, size: 150, color: P.ink, align: 'center', base: 'middle' }); x += ws[i] + 8; }
        }
        // readouts
        label(c, `DRAWING ${pad(dn, 3)}  ·  HELD 5 FRAMES`, 1848, 80, { align: 'right', size: 20, color: P.ink, weight: 700 });
        fsStrip(c, t, 1500, 104, 5);
        label(c, 'DASHED  =  ONION SKINS, TWO DRAWINGS BACK', 98, 146, { size: 14, ls: 2, color: P.accentD });
        // exposure flicker: each drawing a slightly different exposure
        c.fillStyle = `rgba(23,24,28,${0.035 * hash(dn * 7.7)})`; c.fillRect(0, 0, W, H);
      }
      const ph = phaseAt(FS_PH, t), row = FS_PH[ph], on = seg(t, row[0], row[0] + 0.2) * seg(t, 0.1, 0.4);
      tag(c, row[1], 72, 80, on);
      c.save(); c.globalAlpha = on; label(c, row[2], 98, 112, { size: 15, ls: 2 }); c.restore();
      const s0 = Math.floor(t);
      TK.caption(c, t, W, H, { name: 'Frame Stepping', cat: 'Temporal', curve: u => Math.floor(u * 6 + 1e-6) / 6, span: [s0, s0 + 1], lo: -0.1, hi: 1.15, curveLabel: 'HELD / SOURCE TIME · 6 FPS' });
    },
    score(A) {
      TK.bed(A);
      FS_LANES.forEach((ln, i) => A.pluck(0.2 + i * 0.5, midi([60, 64, 67, 72][i]), { g: 0.14, bright: 0.6, dur: 1 }));
      // a soft tick for each new 6 fps drawing in the bottom lane
      for (let n = 12; n < FS_STOP * 6 - 1; n++) A.osc(n / 6, { f: 2400, dur: 0.03, g: 0.025, pan: 0.3 });
      A.whoosh(FS_STOP - 0.35, 0.4, { f1: 300, f2: 3000, g: 0.1, swell: 0.7 });
      // stop motion: a shutter click per drawing, a thud per landing
      for (let n = FS_STOP * 6; n < 60; n++) {
        const t = n / 6;
        A.noise(t, { type: 'bandpass', f: 3200 + hash(n) * 800, q: 2, dur: 0.035, g: 0.07 });
        A.osc(t, { f: 180, f2: 120, dur: 0.05, g: 0.05 });
      }
      for (let k = 1; k <= 4; k++) {
        const tl = Math.ceil((6.3 + 2.7 * (k / 4)) * 6 - 1e-6) / 6;   // first drawing at or after each landing
        if (tl < 9.0) { A.kick(tl, 0.28, { f: 170, f2: 60, dur: 0.2 }); A.pluck(tl, midi([67, 64, 69, 72][k - 1]), { g: 0.1, bright: 0.5, dur: 0.6 }); }
      }
      for (let i = 0; i < 6; i++) A.pluck(9.0 + i / 6, midi([72, 74, 76, 79, 81, 84][i]), { g: 0.12, bright: 0.7, dur: 0.9 });
      A.chord(9.85, [60, 64, 67, 72], { type: 'triangle', dur: 0.6, g: 0.03, a: 0.03, lp: 2400, rev: 0.5, width: 0.8 });
    },
  });

  /* =====================================================================
     CHARACTER STAGGER — a text animator. One animator holds the property
     offsets (rise 100 px and fade from 0%; rotate in from −90°; scale from
     0% with overshoot); a range selector based on characters decides how
     much of it each letter receives. As the selector's offset sweeps the
     indices, each letter's amount falls from 1 to 0 a fixed delay after
     its neighbour's, so one animation plays per character. Four orders on
     MOTION — left to right, right to left, from the centre, random — with
     index chips and delays above the letters, the selector's amount per
     letter below them and a timing bar per letter; then the same animator
     on a 39-character line at 22 ms per letter.
     ===================================================================== */
  const CS_SZ = 200, CS_Y = 410, CS_LS = 8, CS_DUR = 0.55, CS_LEAD = 0.15;
  const CS_RANK = [3, 0, 5, 1, 4, 2];
  const CS_PH = [
    { t0: 0.3, t1: 2.55, fx: 'rise', ord: 'LEFT → RIGHT', d: i => i * 0.09, f: 'DELAY(i) = i × 90 ms', props: ['Position Y', '+100 px', 'Opacity', '0 %'], rnd: 'Off' },
    { t0: 2.55, t1: 4.6, fx: 'rot', ord: 'RIGHT → LEFT', d: i => (5 - i) * 0.09, f: 'DELAY(i) = (5 − i) × 90 ms', props: ['Rotation', '−90°', 'Opacity', '0 %'], rnd: 'Off' },
    { t0: 4.6, t1: 6.6, fx: 'scale', ord: 'FROM CENTRE', d: i => Math.abs(i - 2.5) * 0.16 - 0.08, f: 'DELAY(i) = (|i − 2.5| − 0.5) × 160 ms', props: ['Scale', '0 %', 'Ease', 'Overshoot'], rnd: 'Off' },
    { t0: 6.6, t1: 8.5, fx: 'rise', ord: 'RANDOM', d: i => CS_RANK[i] * 0.09, f: 'DELAY(i) = rank(i) × 90 ms  ·  SEEDED SHUFFLE', props: ['Position Y', '+100 px', 'Opacity', '0 %'], rnd: 'On' },
  ];
  const CS_LINE = 'ONE ANIMATION · ONE DELAY PER CHARACTER', CS_LT0 = 8.6, CS_LD = 0.022, CS_LDUR = 0.4, CS_LY = 720;
  function csPhase(t) { let k = 0; CS_PH.forEach((p, i) => { if (t >= p.t0) k = i; }); return k; }
  // amount the selector gives letter i (1 = full animator offset, 0 = none); ease applied
  function csAmt(ph, i, t) {
    const p = seg(t, ph.t0 + CS_LEAD + ph.d(i), ph.t0 + CS_LEAD + ph.d(i) + CS_DUR);
    return 1 - (ph.fx === 'scale' ? E.outB(p, 2.2) : E.outC(p));
  }
  function csLayout(c, s, size, ls, cx) {
    c.font = `900 ${size}px ${TK.FONT}`;
    const ws = [...s].map(ch => c.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0) + ls * (s.length - 1);
    let x = cx - tot / 2; const xs = [];
    ws.forEach(w => { xs.push(x + w / 2); x += w + ls; });
    return { xs, ws, l: cx - tot / 2, r: cx + tot / 2 };
  }

  MG.film({
    id: 'techcharstagger', dur: 10, poster: 0.85,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Character Stagger', sub: 'One text animator, a delay per letter', era: '2003 —',
      origin: 'Title designers long animated lettering one character at a time by hand or on the rostrum camera; software made it a property of the text itself. Adobe After Effects 6.0 (2003) introduced text animators: property offsets (position, rotation, scale, opacity) applied through range selectors that hand each character, word or line a share of the animator, with start, end and offset, shape, ease and randomise-order controls. Cinema 4D’s MoText (MoGraph, 2006) and web libraries that split text into characters, such as GSAP’s SplitText, carried the same idea into 3D and the browser.',
      works: 'Adobe After Effects text animators and range selectors (2003) · Cinema 4D MoGraph MoText (Maxon, 2006) · GSAP SplitText (GreenSock)',
      tech: ['Animator: property offsets per character', 'Range selector: amount by index', 'Orders: left · right · centre · random'],
      accent: '#ff5a1f',
      motionDNA: 'Six letters, one move each, starting a fixed delay apart so the word reads as a single wave: a rise and fade sweeping left to right, letters spinning up from −90° right to left, a pop of overshooting scale opening from the centre out, and a random order that sparkles; each pattern clears in one beat. The last bar runs the same rise on a 39-character line at 22 ms a letter, fast enough to look like a ripple rather than a sequence.',
      visualDNA: 'The Technique Atlas stage with MOTION set large in Archivo Black; numbered index chips with delays above each letter; under the word, the range selector shown as an amount bar per letter joined into a ramp; a timing chart of six offset bars with a playhead; a text-animator panel top right; the delay-by-index profile as the caption graph.',
      transitions: 'Each order clears with a single simultaneous fade; the long line ripples in under the word',
      implementation: ['After Effects text animators with range selectors (based on characters)', 'Cinema 4D MoText effectors / GSAP SplitText stagger', 'Canvas 2D: the word split into measured glyphs, each drawn with offsets × selector amount(i, t)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      const k = csPhase(t), ph = CS_PH[k], last = k === CS_PH.length - 1;
      const out = last ? 0 : seg(t, ph.t1 - 0.25, ph.t1 - 0.02);
      const lo = csLayout(c, TK.WORD, CS_SZ, CS_LS, 960);
      const pa = seg(t, ph.t0 - 0.05, ph.t0 + 0.15) * (1 - out), lineOn = seg(t, CS_LT0 - 0.2, CS_LT0);
      const chartA = pa * (1 - lineOn);
      // letters
      const amts = [];
      for (let i = 0; i < 6; i++) {
        const a = csAmt(ph, i, t); amts.push(a);
        let dy = 0, rot = 0, sc = 1, al = clamp(1 - a);
        if (ph.fx === 'rise') dy = 100 * a;
        else if (ph.fx === 'rot') rot = -PI / 2 * a;
        else { sc = Math.max(0, 1 - a); al = 1; }
        al *= 1 - out;
        if (al <= 0.003 || sc <= 0.003) continue;
        c.save(); c.globalAlpha = al; c.translate(lo.xs[i], CS_Y + dy); c.rotate(rot); c.scale(sc, sc);
        text(c, TK.WORD[i], 0, 0, { font: TK.FONT, weight: 900, size: CS_SZ, color: P.ink, align: 'center', base: 'middle' });
        c.restore();
      }
      // index chips + delays above the letters
      c.save(); c.globalAlpha = pa * (1 - lineOn);
      for (let i = 0; i < 6; i++) {
        const x = lo.xs[i], started = t >= ph.t0 + CS_LEAD + ph.d(i);
        rrect(c, x - 22, 196, 44, 34, 6); c.fillStyle = started ? P.accent : 'rgba(23,24,28,0.08)'; c.fill();
        label(c, String(i), x, 214, { align: 'center', size: 16, ls: 0, base: 'middle', color: started ? '#fff' : P.ink, weight: 700 });
        label(c, `+${Math.round(Math.max(0, ph.d(i)) * 1000)}`, x, 258, { align: 'center', size: 13, ls: 0 });
      }
      label(c, 'INDEX', lo.l - 40, 219, { align: 'right', size: 13, ls: 2, color: P.ink, weight: 700 });
      label(c, 'DELAY ms', lo.l - 40, 262, { align: 'right', size: 13, ls: 2 });
      c.restore();
      // range selector: amount per character, joined into a ramp
      c.save(); c.globalAlpha = chartA;
      const ry = 622, rh = 56;
      label(c, 'RANGE SELECTOR', lo.l - 40, ry - 30, { align: 'right', size: 13, ls: 2, color: P.ink, weight: 700 });
      label(c, 'AMOUNT / CHAR', lo.l - 40, ry - 10, { align: 'right', size: 13, ls: 2 });
      c.fillStyle = 'rgba(23,24,28,0.2)'; c.fillRect(lo.l - 20, ry, lo.r - lo.l + 40, 2);
      c.fillStyle = 'rgba(255,90,31,0.12)'; c.beginPath(); c.moveTo(lo.xs[0], ry);
      for (let i = 0; i < 6; i++) c.lineTo(lo.xs[i], ry - rh * clamp(amts[i], 0, 1.2));
      c.lineTo(lo.xs[5], ry); c.closePath(); c.fill();
      c.strokeStyle = P.accentD; c.lineWidth = 2; c.beginPath();
      for (let i = 0; i < 6; i++) { const y = ry - rh * clamp(amts[i], 0, 1.2); i ? c.lineTo(lo.xs[i], y) : c.moveTo(lo.xs[i], y); }
      c.stroke();
      for (let i = 0; i < 6; i++) {
        const h = rh * clamp(amts[i], 0, 1.2);
        c.fillStyle = P.accent; c.fillRect(lo.xs[i] - 9, ry - h, 18, h);
        label(c, `${Math.round(clamp(amts[i], 0, 1.2) * 100)}%`, lo.xs[i], ry + 24, { align: 'center', size: 13, ls: 0, color: P.ink });
      }
      c.restore();
      // timing chart: one bar per letter
      c.save(); c.globalAlpha = chartA;
      const cx0 = 760, cx1 = 1500, cy0 = 680, rr = 26, tmax = 1.4, TX = s => cx0 + s / tmax * (cx1 - cx0), lt = t - ph.t0 - CS_LEAD;
      for (let i = 0; i < 6; i++) {
        const y = cy0 + i * rr, d = Math.max(0, ph.d(i));
        label(c, `${i}  ${TK.WORD[i]}`, cx0 - 20, y + 15, { align: 'right', size: 14, ls: 2, color: P.ink, weight: 700 });
        c.fillStyle = 'rgba(23,24,28,0.06)'; c.fillRect(cx0, y + 3, cx1 - cx0, rr - 8);
        c.fillStyle = 'rgba(255,90,31,0.3)'; c.fillRect(TX(d), y + 3, TX(d + CS_DUR) - TX(d), rr - 8);
        const done = clamp((lt - d) / CS_DUR);
        c.fillStyle = P.accent; c.fillRect(TX(d), y + 3, (TX(d + CS_DUR) - TX(d)) * done, rr - 8);
      }
      for (let s = 0; s <= tmax + 1e-6; s += 0.2) { c.fillStyle = 'rgba(23,24,28,0.3)'; c.fillRect(TX(s) - 0.5, cy0 + 6 * rr, 1, 6); label(c, `${Math.round(s * 1000)}`, TX(s), cy0 + 6 * rr + 22, { align: 'center', size: 12, ls: 0 }); }
      const phx = TX(clamp(lt, 0, tmax));
      c.fillStyle = P.ink; c.fillRect(phx - 1, cy0 - 6, 2, 6 * rr + 6);
      label(c, 'ms', cx1 + 14, cy0 + 6 * rr + 22, { size: 12, ls: 1 });
      c.restore();
      // the long line
      if (t >= CS_LT0 - 0.2) {
        const ll = csLayout(c, CS_LINE, 54, 2, 960), n = CS_LINE.length;
        for (let i = 0; i < n; i++) {
          const p = E.outC(seg(t, CS_LT0 + i * CS_LD, CS_LT0 + i * CS_LD + CS_LDUR)), a = 1 - p;
          if (p > 0) { c.save(); c.globalAlpha = p; text(c, CS_LINE[i], ll.xs[i], CS_LY + 60 * a, { font: TK.FONT, weight: 900, size: 54, color: P.ink, align: 'center', base: 'middle' }); c.restore(); }
        }
        // the selector's sweep under the line
        const head = clamp((t - CS_LT0) / CS_LD, 0, n), hx = head >= n ? ll.r : ll.xs[Math.min(n - 1, Math.floor(head))];
        c.fillStyle = 'rgba(23,24,28,0.15)'; c.fillRect(ll.l, CS_LY + 62, ll.r - ll.l, 2);
        c.fillStyle = P.accent; c.fillRect(ll.l, CS_LY + 62, hx - ll.l, 3);
        for (let i = 0; i < n; i += 5) label(c, String(i), ll.xs[i], CS_LY + 88, { align: 'center', size: 12, ls: 0 });
      }
      // tag, formula, animator panel
      const lng = t >= CS_LT0 - 0.2, on = lng ? seg(t, CS_LT0 - 0.2, CS_LT0) : seg(t, ph.t0, ph.t0 + 0.2) * seg(t, 0.1, 0.4);
      tag(c, lng ? 'A LONGER LINE  ·  LEFT → RIGHT' : `ORDER  ·  ${ph.ord}`, 72, 80, on);
      c.save(); c.globalAlpha = on; label(c, lng ? `DELAY(i) = i × ${Math.round(CS_LD * 1000)} ms  ·  ${CS_LINE.length} CHARACTERS` : ph.f, 98, 112, { size: 15, ls: 2 }); c.restore();
      label(c, 'VALUE(i, t)  =  ANIMATOR OFFSET  ×  SELECTOR AMOUNT(i, t)', 98, 146, { size: 15, ls: 1, color: P.ink, weight: 700 });
      const px = 1470, py = 52, pw = 378, rows = [
        ['Animator 1', '', true], [ph.props[0], ph.props[1]], [ph.props[2], ph.props[3]],
        ['Range Selector 1', '', true], ['Based On', 'Characters'], ['Offset', `${Math.round(clamp(lng ? (t - CS_LT0) / (CS_LINE.length * CS_LD + CS_LDUR) : (t - ph.t0 - CS_LEAD) / (Math.max(...[0, 1, 2, 3, 4, 5].map(ph.d)) + CS_DUR)) * 100)} %`], ['Randomize Order', lng ? 'Off' : ph.rnd],
      ];
      rrect(c, px, py, pw, 24 + rows.length * 28, 10); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fill();
      c.strokeStyle = 'rgba(23,24,28,0.18)'; c.lineWidth = 1; c.stroke();
      rows.forEach(([a, b, head], i) => {
        const y = py + 34 + i * 28;
        label(c, a, px + (head ? 16 : 30), y, { size: 14, ls: 1, color: head ? P.ink : P.mute, weight: head ? 700 : 400 });
        if (b) label(c, b, px + pw - 16, y, { size: 14, ls: 1, color: (a === 'Randomize Order' && b === 'On') || a === 'Offset' ? P.accentD : P.ink, weight: 700, align: 'right' });
      });
      const curve = last && t >= CS_LT0 - 0.2 ? (u => Math.floor(Math.min(0.9999, u) * CS_LINE.length) / (CS_LINE.length - 1)) : (u => Math.max(0, ph.d(Math.min(5, Math.floor(u * 6))) ) / Math.max(...[0, 1, 2, 3, 4, 5].map(ph.d)));
      TK.caption(c, t, W, H, { name: 'Character Stagger', cat: 'Typography', curve, span: last && t >= CS_LT0 - 0.2 ? [CS_LT0, CS_LT0 + CS_LINE.length * CS_LD] : [ph.t0 + CS_LEAD, ph.t0 + CS_LEAD + Math.max(...[0, 1, 2, 3, 4, 5].map(ph.d)) + 0.001], lo: -0.1, hi: 1.15, curveLabel: 'DELAY / CHARACTER INDEX' });
    },
    score(A) {
      TK.bed(A);
      const scales = { rise: [72, 74, 76, 79, 81, 84], rot: [84, 81, 79, 76, 74, 72], scale: [67, 72, 76, 79, 76, 72], rnd: [72, 74, 76, 79, 81, 84] };
      CS_PH.forEach((ph, k) => {
        for (let i = 0; i < 6; i++) {
          const ts = ph.t0 + CS_LEAD + Math.max(0, ph.d(i));
          const note = k === 3 ? scales.rnd[CS_RANK[i]] : scales[ph.fx][i];
          if (ph.fx === 'scale') A.bell(ts, midi(note), { g: 0.05, dur: 0.9, rev: 0.4, pan: (i - 2.5) * 0.15 });
          else A.pluck(ts, midi(note), { g: 0.12, bright: ph.fx === 'rot' ? 0.8 : 0.6, dur: 0.8, pan: (i - 2.5) * 0.15 });
          if (ph.fx === 'rot') A.noise(ts, { type: 'bandpass', f: 1800, f2: 4000, q: 2, dur: 0.12, g: 0.04, pan: (i - 2.5) * 0.15 });
        }
        if (k < 3) A.whoosh(ph.t1 - 0.25, 0.25, { f1: 2000, f2: 500, g: 0.06, swell: 0.4 });
      });
      // the long line: a ripple of ticks, 22 ms apart
      for (let i = 0; i < CS_LINE.length; i++) if (CS_LINE[i] !== ' ') A.osc(CS_LT0 + i * CS_LD, { f: 1600 + i * 40, dur: 0.03, g: 0.025, pan: (i / CS_LINE.length - 0.5) * 1.2 });
      A.whoosh(CS_LT0, 1.0, { f1: 400, f2: 3800, g: 0.07, swell: 0.6, pan: 0 });
      A.chord(CS_LT0 + 1.0, [60, 64, 67, 72], { type: 'triangle', dur: 1.0, g: 0.035, a: 0.03, lp: 2400, rev: 0.6, width: 0.8 });
    },
  });
})();
