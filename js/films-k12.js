/* batch k12 — Technique Atlas · Camera, Compositing: techshake · techrackfocus · techmotionblur.
   techshake (camera shake as a transform driven by decaying trauma: impacts on the beat add
   trauma, shake = trauma², each channel samples smooth noise — then crude per-frame random
   jitter for comparison; the world stays still while the camera frame moves over it) ·
   techrackfocus (focus pulled between a near Token, the mid Token and MOTION far back; blur per
   layer from the thin-lens circle of confusion, a top-down depth diagram with the focus plane and
   the depth-of-field band, then the lens stopped down from f/1.4 to f/11) ·
   techmotionblur (blur as temporal sampling: every frame averages up to 24 sub-frame renders of
   the spinning, sliding Token across the open shutter; the shutter angle steps 0°, 90°, 180°,
   360°, with a strobing 0° lane against a smooth 180° lane). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, vnoise, midi, text } = MG;
  const TK = MG.TK, P = TK.P, PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const label = (c, s, x, y, o = {}) => text(c, s, x, y, { font: TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
  const tag = (c, s, x, y, on = 1) => {   // small accent dot + mono label, top-left of frame
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: P.ink, weight: 700, size: 20 });
    c.restore();
  };
  const panel = (c, x0, W, H) => {   // right-hand instrument column
    c.fillStyle = 'rgba(236,232,223,0.95)'; c.fillRect(x0, 0, W - x0, H);
    c.fillStyle = 'rgba(23,24,28,0.12)'; c.fillRect(x0, 0, 2, H);
  };

  /* =====================================================================
     SHAKE — the "trauma" model. Every impact adds to a trauma value
     (clamped at 1) that drains linearly; the shake amount is trauma², so
     small knocks barely register and big hits read big. Each camera
     channel (x, y, roll) is max × shake × its own smooth noise. The world —
     grid, floor, Token, MOTION — never moves: the camera frame (rest
     position dashed, safe area inside) slides and rolls over it, and the
     inset shows what that camera records. Graphs on the right scroll the
     last three seconds of each channel inside the ±shake envelope. From
     5.75 s to 8.25 s the noise is swapped for a fresh random number every
     frame — the crude jitter — and the graphs turn to steps.
     ===================================================================== */
  const SH_HITS = [[1.0, 0.45], [2.0, 0.6], [3.0, 1.0], [4.5, 0.3], [5.0, 0.3], [6.0, 0.9], [7.0, 0.7], [7.5, 0.5], [8.5, 1.0]];
  const SH_DECAY = 0.9, SH_JIT = [5.75, 8.25], SH_F = 9;
  const SH_MAX = { x: 70, y: 50, r: 5 * PI / 180 };
  const SW = { cx: 700, cy: 450, fw: 880, fh: 495, floor: 640, ty: 520, ts: 220, wy: 300 };
  const SH_PX = 1264, SO = { x: 1300, y: 118, w: 548, h: 308 };
  function shTrauma(t) {
    if (t < SH_HITS[0][0]) return 0;
    let tr = 0, tp = 0;
    for (const [th, a] of SH_HITS) {
      if (th > t) break;
      tr = Math.min(1, Math.max(0, tr - SH_DECAY * (th - tp)) + a); tp = th;
    }
    return Math.max(0, tr - SH_DECAY * (t - tp));
  }
  const shJitter = t => t >= SH_JIT[0] && t < SH_JIT[1];
  function shSignal(t, ch) {   // −1..1 per channel
    if (shJitter(t)) return hash(Math.floor(t * 30 + 1e-6) * 3.17 + ch * 101.3) * 2 - 1;
    return vnoise(t * SH_F, ch * 7 + 1) * 0.75 + vnoise(t * SH_F * 2.3, ch * 7 + 4) * 0.25;
  }
  function shCam(t) {
    const tr = shTrauma(t), s = tr * tr;
    return { tr, s, x: SH_MAX.x * s * shSignal(t, 0), y: SH_MAX.y * s * shSignal(t, 1), r: SH_MAX.r * s * shSignal(t, 2) };
  }
  function shWorld(c) {
    c.fillStyle = P.ground; c.fillRect(-600, -600, 3200, 2400);
    c.strokeStyle = 'rgba(23,24,28,0.09)'; c.lineWidth = 1; c.beginPath();
    for (let x = -560; x <= 2560; x += 80) { c.moveTo(x, -600); c.lineTo(x, 1800); }
    for (let y = -560; y <= 1760; y += 80) { c.moveTo(-600, y); c.lineTo(2600, y); }
    c.stroke();
    c.fillStyle = P.ground2; c.fillRect(-600, SW.floor, 3200, 1600);
    c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(-600, SW.floor, 3200, 2);
    // registration crosses pinned to the world
    c.strokeStyle = 'rgba(23,24,28,0.45)'; c.lineWidth = 2; c.beginPath();
    [[240, 160], [1160, 160], [240, 560], [1160, 560], [700, 160], [160, 780]].forEach(([x, y]) => { c.moveTo(x - 12, y); c.lineTo(x + 12, y); c.moveTo(x, y - 12); c.lineTo(x, y + 12); });
    c.stroke();
    TK.shadow(c, SW.cx, SW.floor, SW.ts, SW.floor - (SW.ty + SW.ts / 2));
    TK.token(c, SW.cx, SW.ty, SW.ts);
    TK.word(c, SW.cx, SW.wy, { size: 96, ls: 6 });
  }
  function shCorners(fx, fy, r, w, h) {
    const co = Math.cos(r), si = Math.sin(r);
    return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]].map(([x, y]) => [fx + x * co - y * si, fy + x * si + y * co]);
  }
  function shGraph(c, x, y, w, h, t, chans, title) {
    const win = 3, t0 = t - win;
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(23,24,28,0.2)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w, h);
    c.fillStyle = 'rgba(23,24,28,0.18)'; c.fillRect(x, y + h / 2, w, 1);
    // jitter window shading
    const ja = clamp((SH_JIT[0] - t0) / win), jb = clamp((SH_JIT[1] - t0) / win);
    if (jb > ja) { c.fillStyle = 'rgba(47,91,255,0.08)'; c.fillRect(x + ja * w, y, (jb - ja) * w, h); }
    const Y = v => y + h / 2 - v * h * 0.46, N = 270;
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    // ±shake envelope
    c.setLineDash([3, 4]); c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 1;
    for (const sg of [1, -1]) {
      c.beginPath();
      for (let i = 0; i <= N; i++) { const ts = t0 + i / N * win, tr = shTrauma(ts), px = x + i / N * w, py = Y(sg * tr * tr); i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.stroke();
    }
    c.setLineDash([]);
    chans.forEach(({ ch, col }) => {
      c.strokeStyle = col; c.lineWidth = 2; c.beginPath();
      for (let i = 0; i <= N; i++) {
        const ts = t0 + i / N * win, tr = shTrauma(ts), v = tr * tr * shSignal(ts, ch);
        const px = x + i / N * w, py = Y(v); i ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.stroke();
    });
    c.restore();
    label(c, title, x, y - 12, { size: 14, ls: 2 });
  }

  MG.film({
    id: 'techshake', dur: 10, poster: 3.12,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Camera Shake', sub: 'Trauma in, noise out: the camera moves, the world does not', era: '1970s —',
      origin: 'Film crews shook the camera itself to sell explosions and earthquakes, and Clairmont Camera’s Image Shaker gave the move a dial for Saving Private Ryan (1998). Motion graphics made it a transform: After Effects users drive position and rotation with the wiggle() expression. Game developers formalised the feel — Jan Willem Nijman’s talk The Art of Screenshake (2013) and Squirrel Eiserloh’s GDC 2016 talk on juicing cameras, which set out trauma that decays, shake as trauma squared, and smooth noise instead of random jitter.',
      works: 'Saving Private Ryan (Steven Spielberg, 1998) · Nuclear Throne (Vlambeer, 2015) · Math for Game Programmers: Juicing Your Cameras With Math (Squirrel Eiserloh, GDC talk, 2016)',
      tech: ['Trauma: add on impact, drain over time', 'Shake = trauma² × max', 'Smooth noise per channel, not random jitter'],
      accent: '#ff5a1f',
      motionDNA: 'Nothing in the scene moves; only the camera does. Impacts land on the beat and fill the trauma meter, which drains in a straight line; the shake follows its square, so a light knock is a shiver and a heavy one a jolt that dies away smoothly. X, Y and roll each read their own noise at 9 Hz. For two and a half seconds the noise is swapped for a new random value every frame, and the same trauma turns into a nervous, frame-rate buzz.',
      visualDNA: 'The Technique Atlas stage as a fixed world with registration crosses; a 16:9 camera frame with orange corner brackets and a dashed action-safe area rides over it, its rest position dashed behind. A right-hand instrument column: the camera output inset, scrolling X/Y and roll graphs inside a dashed ±shake envelope, and trauma and trauma² meters.',
      transitions: 'Hits on the beat, smooth decay to stillness; a switch from smooth noise to per-frame jitter and back',
      implementation: ['Hand-held or shaker rigs on set; Image Shaker style mounts', 'After Effects wiggle() on position and rotation; game camera trauma systems', 'Canvas 2D: closed-form trauma decay, value noise per channel, inverse camera transform for the output'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const cam = shCam(t), fx = SW.cx + cam.x, fy = SW.cy + cam.y, jit = shJitter(t);
      shWorld(c);
      // dim everything outside the live frame
      const q = shCorners(fx, fy, cam.r, SW.fw, SW.fh);
      c.save(); c.beginPath(); c.rect(0, 0, SH_PX, H);
      c.moveTo(q[0][0], q[0][1]); q.slice(1).forEach(p => c.lineTo(p[0], p[1])); c.closePath();
      c.fillStyle = 'rgba(23,24,28,0.08)'; c.fill('evenodd'); c.restore();
      // rest frame
      c.save(); c.setLineDash([8, 8]); c.strokeStyle = 'rgba(23,24,28,0.4)'; c.lineWidth = 2;
      c.strokeRect(SW.cx - SW.fw / 2, SW.cy - SW.fh / 2, SW.fw, SW.fh); c.restore();
      label(c, 'REST', SW.cx - SW.fw / 2, SW.cy + SW.fh / 2 + 30, { size: 14, ls: 2 });
      label(c, 'WORLD  ·  FIXED', 186, 786, { size: 13, ls: 2 });
      // the live camera frame
      c.save(); c.translate(fx, fy); c.rotate(cam.r);
      const w2 = SW.fw / 2, h2 = SW.fh / 2, bl = 54;
      c.strokeStyle = P.ink; c.lineWidth = 2.5; c.strokeRect(-w2, -h2, SW.fw, SW.fh);
      c.strokeStyle = P.accent; c.lineWidth = 7; c.lineCap = 'square'; c.beginPath();
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => { c.moveTo(sx * w2, sy * h2 - sy * bl); c.lineTo(sx * w2, sy * h2); c.lineTo(sx * w2 - sx * bl, sy * h2); });
      c.stroke();
      c.setLineDash([6, 6]); c.strokeStyle = 'rgba(198,62,12,0.6)'; c.lineWidth = 1.5;
      c.strokeRect(-w2 * 0.9, -h2 * 0.9, SW.fw * 0.9, SW.fh * 0.9); c.setLineDash([]);
      c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(-18, 0); c.lineTo(18, 0); c.moveTo(0, -18); c.lineTo(0, 18); c.stroke();
      label(c, 'CAMERA', -w2 + 14, -h2 - 14, { size: 15, color: P.ink, weight: 700 });
      label(c, 'ACTION SAFE 90%', -w2 * 0.9 + 10, h2 * 0.9 - 10, { size: 12, ls: 2, color: P.accentD });
      c.restore();
      // offset vector from rest centre
      if (cam.s > 0.002) {
        c.strokeStyle = P.accent; c.lineWidth = 3; c.beginPath(); c.moveTo(SW.cx, SW.cy); c.lineTo(fx, fy); c.stroke();
        c.fillStyle = P.ink; c.beginPath(); c.arc(SW.cx, SW.cy, 4, 0, TAU); c.fill();
      }
      tag(c, jit ? 'CRUDE JITTER  ·  NEW RANDOM VALUE EVERY FRAME' : `SMOOTH NOISE  ·  ${SH_F} Hz  ·  CONTINUOUS`, 72, 84, seg(t, 0.15, 0.5));
      label(c, jit ? 'OFFSET = MAX × TRAUMA² × RANDOM()' : 'OFFSET = MAX × TRAUMA² × NOISE(t)', 98, 114, { size: 15, ls: 2, color: P.ink });

      // instrument column
      panel(c, SH_PX, W, H);
      c.save(); c.beginPath(); c.rect(SO.x, SO.y, SO.w, SO.h); c.clip();
      const k = SO.w / SW.fw;
      c.translate(SO.x + SO.w / 2, SO.y + SO.h / 2); c.scale(k, k); c.rotate(-cam.r); c.translate(-fx, -fy);
      shWorld(c);
      c.restore();
      c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(SO.x, SO.y, SO.w, SO.h);
      label(c, 'CAMERA OUTPUT', SO.x, SO.y - 14, { size: 14, ls: 2, color: P.ink, weight: 700 });
      label(c, `X ${cam.x >= 0 ? '+' : '−'}${Math.abs(cam.x).toFixed(0).padStart(2, '0')}  Y ${cam.y >= 0 ? '+' : '−'}${Math.abs(cam.y).toFixed(0).padStart(2, '0')}  R ${cam.r >= 0 ? '+' : '−'}${Math.abs(cam.r * 180 / PI).toFixed(1)}°`, SO.x + SO.w, SO.y - 14, { size: 14, ls: 1, align: 'right' });
      shGraph(c, SO.x, 486, SO.w, 110, t, [{ ch: 0, col: P.accent }, { ch: 1, col: P.blue }], `TRANSLATE  X ±${SH_MAX.x}  Y ±${SH_MAX.y} px  ·  LAST 3 s`);
      shGraph(c, SO.x, 648, SO.w, 80, t, [{ ch: 2, col: P.ink }], 'ROLL  ±5°');
      // trauma meters
      const mx = SO.x, mw = SO.w;
      [[cam.tr, 'TRAUMA', 772, P.accentL], [cam.s, 'SHAKE = TRAUMA²', 818, P.accent]].forEach(([v, n, y, col]) => {
        c.fillStyle = 'rgba(23,24,28,0.1)'; c.fillRect(mx, y, mw, 14);
        c.fillStyle = col; c.fillRect(mx, y, mw * v, 14);
        label(c, n, mx, y - 8, { size: 13, ls: 2, color: P.ink, weight: 700 });
        label(c, v.toFixed(2), mx + mw, y - 8, { size: 13, ls: 1, align: 'right' });
      });
      // last impact
      let last = null; for (const h of SH_HITS) if (h[0] <= t) last = h;
      if (last && t - last[0] < 0.45) {
        const u = (t - last[0]) / 0.45;
        c.save(); c.globalAlpha = 1 - u;
        label(c, `IMPACT +${last[1].toFixed(2)}`, mx + 150, 764 - u * 8, { size: 14, color: P.accentD, weight: 700 });
        c.restore();
      }
      TK.caption(c, t, W, H, { name: 'Camera Shake', cat: 'Camera', curve: u => u * u, span: [t - cam.tr, t - cam.tr + 1], lo: -0.1, hi: 1.15, curveLabel: 'SHAKE / TRAUMA' });
    },
    score(A) {
      TK.bed(A);
      SH_HITS.forEach(([th, a], i) => {
        A.impact(th, 0.12 + 0.28 * a, { rev: 0.4 });
        A.snare(th, 0.1 * a, { f: 900, dur: 0.25, rev: 0.35 });
        // rumble that drains with the trauma
        A.noise(th, { type: 'lowpass', f: 220, f2: 70, dur: 0.4 + a / SH_DECAY, g: 0.1 * a * a, rev: 0.2, pan: (i % 2 ? 0.25 : -0.25) });
        if (shJitter(th)) for (let k = 0; k < 12; k++) A.noise(th + k / 30, { type: 'bandpass', f: 1400 + 900 * hash(k + th * 13), q: 2, dur: 0.025, g: 0.05 * a * (1 - k / 12), crush: true, pan: hash(k * 3.3 + th) - 0.5 });
      });
      A.osc(SH_JIT[0], { type: 'square', f: 30, dur: 0.06, g: 0.04, lp: 1200 });
      A.osc(SH_JIT[1], { type: 'square', f: 30, dur: 0.06, g: 0.04, lp: 1200 });
      A.chord(9.6, [60, 64, 67, 72], { type: 'triangle', dur: 0.4, g: 0.03, a: 0.05, lp: 2400, rev: 0.6, width: 0.8 });
    },
  });

  /* =====================================================================
     RACK FOCUS — three subjects at three distances: a near Token at
     1.2 m, the mid Token at 3 m, MOTION at 10 m, a gridded wall at 16 m.
     A 50 mm lens; each layer is blurred by its circle of confusion from
     the thin-lens formula, c = f² / (N (s − f)) × |d − s| / d, mapped from a
     36 mm sensor onto 1920 px. The focus distance travels in dioptres
     (1/m), the way a focus ring moves, and each pull starts on the beat:
     mid → near → far → mid → far → mid. A top view on the right plots the
     subjects on a log depth axis with the focus plane and the depth-of-
     field band. Then the lens stops down from f/1.4 to f/11 — the band
     widens, a pull to the near Token barely reads — and opens again.
     ===================================================================== */
  const RF = { f: 0.05, coc: 0.00003 };
  const RV = { x: 72, y: 120, w: 1160, h: 680 };
  const RD = { x: 1300, y: 120, w: 548, h: 500 };
  const RF_WALL = 16;
  const RF_SUB = [
    { name: 'FAR', z: 10, kind: 'word', x: 900, y: 250, s: 120, lx: 900, ly: 168, la: 'center' },
    { name: 'MID', z: 3, kind: 'token', x: 650, y: 440, s: 210, rot: 0.12, col: P.accent, lx: 790, ly: 446, la: 'left' },
    { name: 'NEAR', z: 1.2, kind: 'token', x: 300, y: 640, s: 440, rot: -0.2, col: P.accentD, lx: 560, ly: 760, la: 'left' },
  ];
  const RF_FOCUS = [[0, 1 / 3], [1, 1 / 3], [1.5, 1 / 1.2], [2, 1 / 1.2], [2.75, 0.1], [3.5, 0.1], [4, 1 / 3], [5, 1 / 3], [5.5, 0.1], [6, 0.1], [6.5, 1 / 3], [7.5, 1 / 3], [8, 1 / 1.2], [8.5, 1 / 1.2], [9, 1 / 3]];
  const RF_STOPS = [[0, 0], [6.5, 0], [7.5, 6, E.ioS], [9, 6], [9.5, 0, E.ioS]];
  const RF_FN = ['1.4', '2', '2.8', '4', '5.6', '8', '11'];
  const rfDiop = t => kf(t, RF_FOCUS);
  const rfN = t => 1.4 * Math.pow(2, kf(t, RF_STOPS) / 2);
  function rfCoc(z, zf, N) {   // blur-circle diameter in px
    const cs = RF.f * RF.f / (N * (zf - RF.f)) * Math.abs(z - zf) / z;
    return cs / 0.036 * 1920;
  }
  function rfDof(zf, N) {
    const Hf = RF.f * RF.f / (N * RF.coc) + RF.f;
    return [zf * (Hf - RF.f) / (Hf + zf - 2 * RF.f), zf < Hf ? zf * (Hf - RF.f) / (Hf - zf) : Infinity];
  }
  const rfBlur = (c, d) => { c.filter = d > 0.8 ? `blur(${Math.min(48, d / 2).toFixed(1)}px)` : 'none'; };
  function rfSubject(c, s, scale = 1, ox = 0, oy = 0) {
    if (s.kind === 'word') TK.word(c, ox + s.x * scale, oy + s.y * scale, { size: s.s * scale, ls: 6 * scale });
    else TK.token(c, ox + s.x * scale, oy + s.y * scale, s.s * scale, { rot: s.rot, color: s.col });
  }
  function rfDepthY(z) { const b = RD.y + RD.h - 36, top = RD.y + 24; return lerp(b, top, Math.log(z / 0.8) / Math.log(20 / 0.8)); }

  MG.film({
    id: 'techrackfocus', dur: 10, poster: 4.6,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Rack Focus', sub: 'Pull the focus plane from one depth to another', era: '1910s —',
      origin: 'Shifting focus within a shot to move the audience’s attention became part of film grammar as lenses and focus rings improved; the focus puller (first assistant camera) marks distances on the lens and turns the ring on cue. Gregg Toland’s deep-focus work on Citizen Kane (1941) showed the opposite strategy — stopping down to keep every plane sharp. Mike Nichols’ The Graduate (1967) famously racks between Benjamin and Elaine, and modern cameras made the pull a menu option with follow-focus motors and autofocus tracking.',
      works: 'Citizen Kane (Orson Welles, cinematographer Gregg Toland, 1941; deep focus) · The Graduate (Mike Nichols, 1967) · Barry Lyndon (Stanley Kubrick, 1975; Zeiss f/0.7 lenses, razor-thin focus)',
      tech: ['Circle of confusion per depth layer', 'Focus moved in dioptres (1/distance)', 'Aperture sets the depth of field'],
      accent: '#ff5a1f',
      motionDNA: 'Nothing in the frame moves; attention does. Each pull starts on a beat and eases into place over one or two beats as the focus plane sweeps through depth — one layer sharpens while the others bloom out. After five pulls the iris closes six stops, the depth of field swells to cover the room, and a pull to the near Token hardly changes the picture; then the iris opens and the mid Token is isolated again.',
      visualDNA: 'The Technique Atlas stage seen through a 50 mm lens: a big dark-orange Token close to camera, the orange Token in the middle, MOTION and a gridded wall far back, each with a sharp mono readout of distance and blur. A top view on the right with a log depth axis, view cone, orange focus plane and shaded depth-of-field band; an iris icon and the f-number below.',
      transitions: 'Eased focus pulls on the beat between three depths; a slow stop-down and open-up of the aperture',
      implementation: ['Follow-focus gear and distance marks on the lens; a focus puller on set', 'After Effects Camera Lens Blur / 3D camera depth of field; Cinema 4D and Blender DOF', 'Canvas 2D: per-layer filter blur from thin-lens circle of confusion'],
      reproducibility: 'Fully procedural',
      loopable: true,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const D = rfDiop(t), zf = 1 / D, N = rfN(t), [dn, dfar] = rfDof(zf, N);
      TK.stage(c, W, H);
      // ---- lens view
      c.save(); c.beginPath(); c.rect(RV.x, RV.y, RV.w, RV.h); c.clip();
      c.fillStyle = P.ground; c.fillRect(RV.x, RV.y, RV.w, RV.h);
      rfBlur(c, rfCoc(RF_WALL, zf, N));
      c.strokeStyle = 'rgba(23,24,28,0.16)'; c.lineWidth = 2; c.beginPath();
      for (let x = RV.x + 40; x < RV.x + RV.w; x += 64) { c.moveTo(x, RV.y - 60); c.lineTo(x, RV.y + 520); }
      for (let y = RV.y + 24; y < RV.y + 520; y += 64) { c.moveTo(RV.x - 60, y); c.lineTo(RV.x + RV.w + 60, y); }
      c.stroke();
      c.fillStyle = P.ground2; c.fillRect(RV.x - 60, RV.y + 520, RV.w + 120, RV.h);
      c.filter = 'none';
      RF_SUB.forEach(s => { rfBlur(c, rfCoc(s.z, zf, N)); rfSubject(c, s); c.filter = 'none'; });
      c.restore();
      c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(RV.x, RV.y, RV.w, RV.h);
      // subject readouts (drawn sharp, outside the lens)
      RF_SUB.forEach(s => {
        const d = rfCoc(s.z, zf, N), sharp = s.z >= dn && s.z <= dfar;
        const str = `${s.name}  ${s.z.toFixed(1)} m  ·  BLUR ${d.toFixed(0)} px`;
        c.font = `700 16px ${TK.MONO}`;
        const tw = c.measureText(str).width + str.length * 2 + 44, x0 = s.la === 'center' ? s.lx - tw / 2 : s.lx;
        c.fillStyle = sharp ? P.ink : 'rgba(236,232,223,0.92)'; MG.rrect(c, x0, s.ly - 22, tw, 32, 6); c.fill();
        if (!sharp) { c.strokeStyle = 'rgba(23,24,28,0.3)'; c.lineWidth = 1; c.stroke(); }
        c.fillStyle = sharp ? P.accent : P.mute; c.beginPath(); c.arc(x0 + 16, s.ly - 6, 6, 0, TAU); c.fill();
        label(c, str, x0 + 30, s.ly, { size: 16, ls: 2, weight: 700, color: sharp ? P.ground : P.ink });
      });
      const focusName = RF_SUB.reduce((a, s) => (Math.abs(1 / s.z - D) < Math.abs(1 / a.z - D) ? s : a)).name;
      const moving = Math.abs(rfDiop(t + 0.02) - rfDiop(t)) > 1e-4;
      tag(c, moving ? `PULLING FOCUS  ·  ${zf.toFixed(1)} m` : `FOCUS ON ${focusName}  ·  ${zf.toFixed(1)} m  ·  f/${RF_FN[Math.round(kf(t, RF_STOPS))]}`, 72, 84, seg(t, 0.15, 0.5));
      label(c, 'LENS VIEW  ·  50 mm', RV.x + RV.w, 84, { size: 14, ls: 2, align: 'right' });

      // ---- top view: depth axis, cone, focus plane, DOF band
      const cx = RD.x + RD.w / 2 + 40, camY = RD.y + RD.h - 4, topY = RD.y + 8;
      const half = y => (camY - y) / (camY - topY) * (RD.w / 2 - 30);
      c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(RD.x, RD.y, RD.w, RD.h);
      c.strokeStyle = 'rgba(23,24,28,0.2)'; c.lineWidth = 1; c.strokeRect(RD.x + 0.5, RD.y + 0.5, RD.w, RD.h);
      label(c, 'TOP VIEW  ·  DEPTH (LOG)', RD.x, RD.y - 14, { size: 14, ls: 2, color: P.ink, weight: 700 });
      const yN = rfDepthY(Math.max(0.8, dn)), yF = dfar === Infinity ? topY : Math.max(topY, rfDepthY(Math.min(dfar, 20)));
      c.save(); c.beginPath(); c.moveTo(cx, camY); c.lineTo(cx - half(topY), topY); c.lineTo(cx + half(topY), topY); c.closePath(); c.clip();
      c.fillStyle = 'rgba(255,90,31,0.16)'; c.fillRect(RD.x, yF, RD.w, yN - yF);
      c.restore();
      c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 1.5; c.beginPath();
      c.moveTo(cx, camY); c.lineTo(cx - half(topY), topY); c.moveTo(cx, camY); c.lineTo(cx + half(topY), topY); c.stroke();
      // distance ticks
      [1, 2, 3, 5, 10, 20].forEach(z => {
        const y = rfDepthY(z);
        c.fillStyle = 'rgba(23,24,28,0.3)'; c.fillRect(RD.x + 58, y, 12, 1.5);
        label(c, `${z} m`, RD.x + 50, y + 5, { size: 13, ls: 1, align: 'right' });
      });
      // wall
      const yw = rfDepthY(RF_WALL);
      c.setLineDash([5, 5]); c.strokeStyle = 'rgba(23,24,28,0.4)'; c.beginPath(); c.moveTo(cx - half(yw), yw); c.lineTo(cx + half(yw), yw); c.stroke(); c.setLineDash([]);
      label(c, 'WALL', cx + half(yw) - 4, yw - 8, { size: 12, ls: 2, align: 'right' });
      // focus plane
      const yf = rfDepthY(zf);
      c.strokeStyle = P.accent; c.lineWidth = 4; c.beginPath(); c.moveTo(cx - half(yf) - 10, yf); c.lineTo(cx + half(yf) + 10, yf); c.stroke();
      label(c, `FOCUS ${zf.toFixed(1)} m`, cx - half(yf) - 18, yf + 5, { size: 13, ls: 1, weight: 700, color: P.accentD, align: 'right' });
      // subjects
      RF_SUB.forEach(s => {
        const y = rfDepthY(s.z), lat = (s.x - (RV.x + RV.w / 2)) / (RV.w / 2), x = cx + lat * half(y) * 0.9;
        const sharp = s.z >= dn && s.z <= dfar;
        if (s.kind === 'word') { c.fillStyle = P.ink; c.fillRect(x - 40, y - 5, 80, 10); }
        else TK.token(c, x, y, s.name === 'NEAR' ? 34 : 24, { color: s.col });
        const lx = x + (s.kind === 'word' ? 50 : 26);
        c.fillStyle = 'rgba(244,242,236,0.92)'; c.fillRect(lx - 4, y - 10, s.name.length * 11 + 8, 20);
        label(c, s.name, lx, y + 5, { size: 13, ls: 2, weight: 700, color: sharp ? P.accentD : P.mute });
      });
      // camera
      c.fillStyle = P.ink; c.beginPath(); c.moveTo(cx, camY - 14); c.lineTo(cx - 14, camY + 2); c.lineTo(cx + 14, camY + 2); c.closePath(); c.fill();
      label(c, `DEPTH OF FIELD  ${dn.toFixed(2)} – ${dfar === Infinity || dfar > 99 ? '∞' : dfar.toFixed(2)} m`, RD.x, RD.y + RD.h + 30, { size: 15, ls: 2, color: P.ink, weight: 700 });

      // ---- aperture
      const ix = RD.x + 56, iy = 740, R = 50, r = R * 1.4 / N * 0.92;
      c.fillStyle = P.ink; c.beginPath(); c.arc(ix, iy, R, 0, TAU); c.fill();
      c.fillStyle = P.ground; c.beginPath();
      for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + kf(t, RF_STOPS) * 0.25; i ? c.lineTo(ix + Math.cos(a) * r, iy + Math.sin(a) * r) : c.moveTo(ix + Math.cos(a) * r, iy + Math.sin(a) * r); }
      c.closePath(); c.fill();
      text(c, `f/${RF_FN[Math.round(kf(t, RF_STOPS))]}`, ix + 80, iy + 4, { font: TK.FONT, weight: 800, size: 44, color: P.ink });
      label(c, N < 2.5 ? 'WIDE APERTURE  ·  SHALLOW DOF' : N > 7 ? 'STOPPED DOWN  ·  DEEP DOF' : 'STOPPING DOWN', ix + 82, iy + 34, { size: 14, ls: 2 });
      TK.caption(c, t, W, H, { name: 'Rack Focus', cat: 'Camera', curve: u => (rfDiop(u * 10) - 0.1) / (1 / 1.2 - 0.1), span: [0, 10], lo: -0.12, hi: 1.15, curveLabel: 'FOCUS  1/DISTANCE  / TIME' });
    },
    score(A) {
      TK.bed(A);
      const pitch = d => 55 + (d - 0.1) / (1 / 1.2 - 0.1) * -12 + 12;   // near = low, far = high
      for (let i = 1; i < RF_FOCUS.length; i++) {
        const [t0, d0] = RF_FOCUS[i - 1], [t1, d1] = RF_FOCUS[i];
        if (d0 === d1) continue;
        const dur = t1 - t0;
        A.osc(t0, { type: 'sawtooth', f: midi(pitch(d0) + 12), f2: midi(pitch(d1) + 12), glide: dur, dur, g: 0.022, a: 0.06, lp: 1400, rev: 0.2, pan: d1 > d0 ? -0.3 : 0.3 });
        A.noise(t0, { type: 'bandpass', f: 3000, f2: 1800, q: 4, dur, g: 0.03, swell: 0.5 });
        A.pluck(t1, midi(pitch(d1) + 7), { g: 0.15, bright: 0.55, dur: 1.2, rev: 0.35 });
        A.bell(t1, midi(pitch(d1) + 24), { g: 0.04, dur: 1.2, rev: 0.5 });
      }
      // aperture clicks: one per stop
      for (let k = 0; k < 6; k++) { A.osc(6.5 + (k + 0.5) / 6, { f: 3200 - k * 250, dur: 0.03, g: 0.06 }); A.noise(6.5 + (k + 0.5) / 6, { type: 'highpass', f: 5000, dur: 0.02, g: 0.04 }); }
      for (let k = 0; k < 6; k++) A.osc(9 + (k + 0.5) / 12, { f: 2000 + k * 250, dur: 0.025, g: 0.05 });
      A.chord(9.5, [55, 62, 67, 71], { type: 'triangle', dur: 0.5, g: 0.035, a: 0.1, lp: 2200, rev: 0.6, width: 0.8 });
    },
  });

  /* =====================================================================
     MOTION BLUR — the Token swings across the stage (one full swing per two
     beats) while spinning 2.2 turns a second. Each output frame is the
     average of N renders at sub-frame times spread across the open
     shutter, centred on the frame (shutter phase −½). Exposure =
     angle / 360 × 1/30 s. Samples are added with 'lighter' at 1/N alpha
     into an offscreen layer, so the result is a true average. The angle
     steps 0° → 90° → 180° → 360° (first with 4 samples, which shows up as
     copies, then 24) → 180°. Two small lanes below run the same motion at
     0° and 180° with the previous three frames ghosted: separated, strobing
     copies against continuous streaks. To finish the Token slows to a
     stop and the blur shrinks with its speed.
     ===================================================================== */
  const MB_FPS = 30, MB_W = TAU * 20 / 9, MB_S = 200;
  const MB = { cx: 640, cy: 330, amp: 440, oy: 150, ow: 1300, oh: 380 };
  const MB_LANE = [{ ang: 0, n: 1, y: 660, name: '0°', sub: 'STROBOSCOPIC' }, { ang: 180, n: 16, y: 800, name: '180°', sub: 'SMOOTH' }];
  const ML = { cx: 700, amp: 300, s: 84, ow: 1240, oh: 150 };
  const MB_STEPS = [[0, 0, 1], [1.0, 90, 8], [2.5, 180, 16], [4.5, 360, 4], [5.5, 360, 24], [7.0, 180, 16]];
  const mbStep = t => { let s = MB_STEPS[0]; for (const k of MB_STEPS) if (t >= k[0]) s = k; return s; };
  const mbX = t => Math.sin(TAU * t) * (1 - E.ioS(seg(t, 8.5, 9.5)));
  function mbRot(t) {
    if (t < 8.5) return MB_W * t;
    const s = Math.min(t - 8.5, 1);
    return MB_W * (8.5 + s - s * s / 2);
  }
  // average n renders across the exposure into g (cleared first)
  function mbAccum(g, t, ang, n, drawAt) {
    g.clearRect(0, 0, g.canvas.width, g.canvas.height);
    const e = ang / 360 / MB_FPS;
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) {
      const ts = n === 1 ? t : t - e / 2 + e * (i + 0.5) / n;
      g.globalAlpha = 1 / n; drawAt(g, ts);
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  MG.film({
    id: 'techmotionblur', dur: 10, poster: 6.0,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Motion Blur', sub: 'Many instants averaged across the open shutter', era: '1984 —',
      origin: 'A film camera’s rotary shutter is open for part of each frame — 180° is the classic setting, half the frame time — so anything that moves smears across the exposure. Computer graphics had to fake it: Korein and Badler and Potmesil and Chakravarty published temporal antialiasing methods in 1983, and Cook, Porter and Carpenter’s Distributed Ray Tracing (SIGGRAPH 1984) sampled time across the shutter, shown in the still 1984 by Thomas Porter at Lucasfilm’s Computer Graphics division (later Pixar). Ray Harryhausen’s stop-motion lacked blur and strobed; Industrial Light & Magic’s go-motion for Dragonslayer (1981) moved the puppets during exposure to put it back.',
      works: '1984 (Thomas Porter, Lucasfilm Computer Graphics, 1984; distributed ray tracing still) · Dragonslayer (Matthew Robbins, 1981; ILM go-motion) · Saving Private Ryan (Steven Spielberg, 1998; narrow 45° and 90° shutter)',
      tech: ['Shutter angle sets the exposure window', 'N sub-frame samples, averaged', 'Strobing at 0°, streaks at 180°–360°'],
      accent: '#ff5a1f',
      motionDNA: 'The motion itself never changes — one swing every two beats, a steady 2.2 turns a second — only the exposure does. At 0° the Token is a crisp cut-out that jumps from frame to frame; at 90° and 180° it grows soft trailing edges, and the hole twists into an arc; at 360° the smear is a full frame long and four samples break it into visible copies until twenty-four melt them into a streak. When it slows to a stop the blur shrinks with its speed and leaves a sharp Token.',
      visualDNA: 'The Technique Atlas stage with the Token swinging along a ticked track; a rotary-shutter disc whose open sector widens and narrows, an exposure timeline with sample dots per frame, speed and blur-length readouts; two thin lanes underneath with ghosted previous frames — separate strobing copies at 0°, continuous streaks at 180°.',
      transitions: 'Shutter angle cut on the bar: 0°, 90°, 180°, 360° undersampled, 360°, 180°; a deceleration to stillness',
      implementation: ['Rotary shutter angle on film and digital cinema cameras', 'After Effects / Nuke motion blur (shutter angle, phase, samples per frame); renderer time sampling', 'Canvas 2D: N sub-frame Token renders averaged with lighter at 1/N alpha'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const o = MG.offscreen(MB.ow, MB.oh), l = MG.offscreen(ML.ow, ML.oh);
      return { g: o.getContext('2d'), gl: l.getContext('2d') };
    },
    draw(c, t, W, H, st) {
      const [, ang, n] = mbStep(t), e = ang / 360 / MB_FPS;
      TK.stage(c, W, H);
      // track
      const ty = MB.cy + MB_S / 2 + 26;
      c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(MB.cx - MB.amp - 60, ty, MB.amp * 2 + 120, 2);
      for (let i = -4; i <= 4; i++) { const x = MB.cx + i / 4 * MB.amp; c.fillRect(x - 0.5, ty - (i % 2 ? 6 : 12), 1.5, i % 2 ? 6 : 12); }
      // main render
      const drawMain = (g, ts) => TK.token(g, MB.cx + mbX(ts) * MB.amp, MB.cy - MB.oy, MB_S, { rot: mbRot(ts) });
      mbAccum(st.g, t, ang, n, drawMain);
      c.drawImage(st.g.canvas, 0, MB.oy);
      // sample markers under the Token: where each sub-frame sat
      if (n > 1) {
        for (let i = 0; i < n; i++) {
          const ts = t - e / 2 + e * (i + 0.5) / n, x = MB.cx + mbX(ts) * MB.amp;
          c.fillStyle = P.accentD; c.beginPath(); c.arc(x, ty + 14, 2.5, 0, TAU); c.fill();
        }
      } else { c.fillStyle = P.ink; c.beginPath(); c.arc(MB.cx + mbX(t) * MB.amp, ty + 14, 4, 0, TAU); c.fill(); }
      const v = Math.abs(Math.cos(TAU * t)) * TAU * MB.amp * (1 - E.ioS(seg(t, 8.5, 9.5)));
      const stepInfo = ang === 0 ? 'ONE INSTANT  ·  NO BLUR' : n === 4 ? 'UNDERSAMPLED  ·  4 COPIES SHOW' : `${n} SAMPLES  ·  1/${Math.round(1 / e)} s`;
      tag(c, `SHUTTER ${ang}°  ·  ${stepInfo}`, 72, 84, seg(t, 0.15, 0.5));
      label(c, t > 9.5 ? 'STOPPED  ·  NOTHING MOVES DURING THE EXPOSURE  ·  SHARP' : t > 8.5 ? 'SLOWING  ·  SHORTER MOVE PER EXPOSURE  ·  SHORTER BLUR' : 'FRAME = AVERAGE OF SUB-FRAME RENDERS ACROSS THE OPEN SHUTTER', 98, 114, { size: 15, ls: 2, color: P.ink });
      TK.word(c, MB.cx, 530, { size: 76, ls: 6, alpha: E.outC(seg(t, 9.3, 9.8)) });

      // comparison lanes: previous 3 frames ghosted
      MB_LANE.forEach(L => {
        const lcy = ML.oh / 2, drawL = (g, ts) => TK.token(g, ML.cx + mbX(ts) * ML.amp, lcy, ML.s, { rot: mbRot(ts) });
        c.fillStyle = 'rgba(23,24,28,0.12)'; c.fillRect(ML.cx - ML.amp - 70, L.y + ML.s / 2 + 12, ML.amp * 2 + 140, 1.5);
        [3, 2, 1, 0].forEach(k => {
          mbAccum(st.gl, t - k / MB_FPS, L.ang, L.n, drawL);
          c.save(); c.globalAlpha = [1, 0.4, 0.22, 0.12][k]; c.drawImage(st.gl.canvas, 0, L.y - lcy); c.restore();
        });
        label(c, L.name, 72, L.y - 4, { size: 26, color: P.ink, weight: 700, ls: 1 });
        label(c, L.sub, 72, L.y + 24, { size: 13, ls: 2 });
      });
      c.save(); c.globalAlpha = 1 - seg(t, 9.0, 9.3);
      label(c, 'SAME MOTION  ·  LAST 3 FRAMES GHOSTED', ML.cx + ML.amp + 70, MB_LANE[0].y - 66, { size: 13, ls: 2, align: 'right' });
      c.restore();

      // ---- instrument column: rotary shutter, exposure timeline, readouts
      panel(c, 1300, W, H);
      const dx = 1460, dy = 262, R = 112;
      label(c, 'ROTARY SHUTTER', 1340, 96, { size: 14, ls: 2, color: P.ink, weight: 700 });
      c.fillStyle = 'rgba(23,24,28,0.08)'; c.beginPath(); c.arc(dx, dy, R + 10, 0, TAU); c.fill();
      c.fillStyle = P.ink; c.beginPath(); c.moveTo(dx, dy);
      const a0 = -PI / 2 + (ang / 360) * PI, a1 = -PI / 2 - (ang / 360) * PI + TAU;
      c.arc(dx, dy, R, a0, a1); c.closePath(); c.fill();
      if (ang > 0) {
        c.strokeStyle = P.accent; c.lineWidth = 4; c.beginPath(); c.moveTo(dx, dy); c.arc(dx, dy, R, -PI / 2 - (ang / 360) * PI, a0); c.closePath(); c.stroke();
      } else { c.strokeStyle = P.accent; c.lineWidth = 4; c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx, dy - R); c.stroke(); }
      c.fillStyle = P.ground; c.beginPath(); c.arc(dx, dy, 10, 0, TAU); c.fill();
      label(c, 'OPEN', dx, dy - R - 18, { size: 12, ls: 2, align: 'center', color: P.accentD, weight: 700 });
      text(c, `${ang}°`, 1610, 250, { font: TK.FONT, weight: 800, size: 64, color: P.ink });
      label(c, ang === 0 ? 'EXPOSURE  0 s' : `EXPOSURE  1/${Math.round(1 / e)} s`, 1612, 288, { size: 14, ls: 2 });
      label(c, `${n} SAMPLE${n > 1 ? 'S' : ''} / FRAME`, 1612, 312, { size: 14, ls: 2 });

      // exposure timeline: three frames, open window centred on each
      const ex = 1340, ew = 504, ey = 470, fw = ew / 3;
      label(c, 'EXPOSURE WINDOW PER FRAME  ·  1/30 s', ex, ey - 54, { size: 14, ls: 2, color: P.ink, weight: 700 });
      c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(ex, ey, ew, 2);
      for (let f = 0; f < 3; f++) {
        const fx = ex + fw * (f + 0.5), ow = fw * ang / 360;
        c.fillStyle = 'rgba(255,90,31,0.28)'; c.fillRect(fx - ow / 2, ey - 24, ow, 48);
        c.fillStyle = P.ink; c.fillRect(fx - 1, ey - 30, 2, 60);
        for (let i = 0; i < n; i++) { const sx = n === 1 ? fx : fx - ow / 2 + ow * (i + 0.5) / n; c.fillStyle = P.accentD; c.beginPath(); c.arc(sx, ey + 1, n > 16 ? 2.2 : 3.2, 0, TAU); c.fill(); }
        label(c, ['F − 1', 'F', 'F + 1'][f], fx, ey + 52, { size: 13, ls: 2, align: 'center' });
      }
      [[`SPEED  ${Math.round(v)} px/s`, 620], [`BLUR LENGTH  ${Math.round(v * e)} px`, 650], ['PIXEL = 1/N × Σ RENDER(tᵢ)', 700], ['DRAWN, NOT SMEARED: TIME IS SAMPLED', 726]].forEach(([s, y], i) => label(c, s, 1340, y, { size: i < 2 ? 18 : 14, ls: 2, color: i < 2 ? P.ink : P.mute, weight: i < 2 ? 700 : 400 }));
      TK.caption(c, t, W, H, { name: 'Motion Blur', cat: 'Compositing', curve: u => mbStep(u * 10)[1] / 360, span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'SHUTTER ANGLE / TIME' });
    },
    score(A) {
      TK.bed(A);
      // a pass sound at every speed peak; its length follows the exposure
      for (let k = 0; k <= 18; k++) {
        const tp = k * 0.5, [, ang] = mbStep(tp), dir = k % 2 ? -1 : 1, slow = 1 - E.ioS(seg(tp, 8.5, 9.5));
        if (slow < 0.05) continue;
        if (ang === 0) A.osc(tp, { f: 2400, dur: 0.03, g: 0.06 * slow, pan: 0 });
        else A.whoosh(tp - 0.04 - ang / 1800, 0.08 + ang / 900, { f1: 500, f2: 2600, q: 1.6, g: (0.05 + ang / 360 * 0.09) * slow, swell: 0.5, pan: -dir * 0.5 });
      }
      // shutter changes
      MB_STEPS.slice(1).forEach(([ts, ang, n], i) => {
        A.snare(ts, 0.08, { f: 3000, dur: 0.06 });
        A.pluck(ts, midi(60 + [0, 4, 7, 12, 7][i]), { g: 0.14, bright: 0.55, dur: 1.1, rev: 0.3 });
        if (n === 4) for (let k = 0; k < 4; k++) A.osc(ts + 0.08 + k * 0.06, { f: 1800, dur: 0.03, g: 0.04 });
      });
      A.osc(8.5, { type: 'triangle', f: 330, f2: 110, glide: 1, dur: 1.05, g: 0.04, lp: 1600, rev: 0.3 });
      A.bell(9.5, midi(84), { g: 0.06, dur: 1.4, rev: 0.5 });
      A.chord(9.5, [60, 64, 67, 72], { type: 'triangle', dur: 0.5, g: 0.035, a: 0.05, lp: 2400, rev: 0.6, width: 0.8 });
    },
  });
})();
