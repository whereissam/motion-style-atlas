/* batch k18 — Technique Atlas · Camera, Simulation, Rigging: techwhippan · techflocking · techik.
   techwhippan (a pan so fast it smears the frame into horizontal streaks, used to hide a cut:
   shot A whips out, the cut lands inside the blur, shot B whips in; angular velocity, pan
   heading, blur length and a frame-by-frame replay that exposes the hidden cut) ·
   techflocking (Reynolds boids: 120 small Tokens, separation, alignment and cohesion switched on
   one at a time, then a big predator Token; one boid's neighbour radius and its steering vectors) ·
   techik (a jointed arm reaching for the Token: forward kinematics by hand, two-bone analytic IK
   with the reach limit and an elbow flip, then a three-bone FABRIK solve shown iteration by
   iteration). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, midi, text, rrect } = MG;
  const TK = MG.TK, P = TK.P, PI = Math.PI, BEAT = TK.BEAT;

  /* ---------------- shared helpers ---------------- */
  const label = (c, s, x, y, o = {}) => text(c, s, x, y, { font: TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
  const tag = (c, s, x, y, on = 1) => {   // small accent dot + mono label, top-left of frame
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: P.ink, weight: 700, size: 20 });
    c.restore();
  };
  const panel = (c, x, y, w, h, a = 0.92) => {
    c.save(); c.globalAlpha *= a; c.fillStyle = P.ground; rrect(c, x, y, w, h, 14); c.fill();
    c.globalAlpha = 1; c.strokeStyle = 'rgba(23,24,28,0.14)'; c.lineWidth = 1; c.stroke(); c.restore();
  };
  const arrow = (c, x0, y0, x1, y1, col, lw = 3) => {
    const L = Math.hypot(x1 - x0, y1 - y0); if (L < 2) return;
    const ux = (x1 - x0) / L, uy = (y1 - y0) / L, h = Math.min(14, L * 0.45);
    c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - ux * h * 0.6, y1 - uy * h * 0.6); c.stroke();
    c.beginPath(); c.moveTo(x1, y1); c.lineTo(x1 - ux * h - uy * h * 0.5, y1 - uy * h + ux * h * 0.5); c.lineTo(x1 - ux * h + uy * h * 0.5, y1 - uy * h - ux * h * 0.5); c.closePath(); c.fill();
    c.restore();
  };
  const dashCircle = (c, x, y, r, col, lw = 1.5, d = [6, 7]) => { c.save(); c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(d); c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); c.restore(); };
  const GREEN = '#23935a';

  /* =====================================================================
     WHIP PAN — the camera swings so fast (peak 900°/s) that a 180° shutter
     smears each frame into a 480 px horizontal streak. The angular velocity
     is a sech² pulse, so the heading is a tanh: an S of 162° in about a
     third of a second. Shot A whips out; while the frame is nothing but
     streaked grid the picture switches to shot B (the cut), which whips in
     and settles with a little operator wobble. Each frame is the average of
     up to 48 sub-frame samples across the open shutter. A heading tape, an
     ω graph with the cut marked, and a dimension line for the blur length
     explain it; a frame-by-frame replay shows the one frame where the cut
     sits; then the same whip runs back to shot A.
     ===================================================================== */
  const WP = { px: 32, sh: 1 / 60, wmax: 900, s: 0.09, rp: [4.0, 7.0], f0: 45, nf: 30 };
  const WP_W = [{ tc: 2.0, dir: 1, a: 0, b: 1 }, { tc: 8.0, dir: -1, a: 1, b: 0 }];
  const WP_TOT = 2 * WP.wmax * WP.s;   // 162°
  const sech2 = x => { const ch = Math.cosh(x); return 1 / (ch * ch); };
  const wpOmega = t => WP_W.reduce((w, p) => w + p.dir * WP.wmax * sech2((t - p.tc) / WP.s), 0);
  const wpSettle = (t, p) => { const tl = p.tc + 0.13; return t > tl ? p.dir * 1.6 * Math.exp(-(t - tl) * 7) * Math.sin((t - tl) * TAU * 3.2) : 0; };
  const wpAngle = t => WP_W.reduce((a, p) => a + p.dir * WP.wmax * WP.s * (1 + Math.tanh((t - p.tc) / WP.s)) + wpSettle(t, p), 0);
  const wpShot = tf => { let shot = 0, home = 0; for (const p of WP_W) if (tf >= p.tc - 1e-6) { shot = p.b; home += p.dir * WP_TOT; } return { shot, home }; };
  const wpBlur = t => Math.abs(wpOmega(t)) * WP.px * WP.sh;
  // replay: source frame shown at output time t (null outside the replay)
  const wpReplay = t => (t >= WP.rp[0] && t < WP.rp[1] ? WP.f0 + Math.floor((t - WP.rp[0]) / ((WP.rp[1] - WP.rp[0]) / WP.nf)) : null);
  // set dressing in the wings of each shot: only seen while the camera whips past it
  const WP_PROPS = [0, 1].map(sh => Array.from({ length: 16 }, (_, i) => {
    const h = k => hash(i * 13.7 + sh * 101 + k * 3.1);
    return { x: sh ? -820 - i * 210 - h(1) * 120 : 2120 + i * 210 + h(1) * 120, w: 26 + h(2) * 120, y: 170 + h(3) * 300, h: 90 + h(4) * 290,
      col: ['rgba(23,24,28,0.6)', P.accent, P.accentD, 'rgba(47,91,255,0.7)', P.ground2, 'rgba(23,24,28,0.3)'][Math.floor(h(5) * 6)] };
  }));
  function wpScene(c, shot, dx) {   // one sharp instant of a shot, content shifted left by dx
    if (shot === 0) {
      TK.stage(c, 1920, 1080, { ox: -dx });
      TK.token(c, 960 - dx, 470, 300);
      label(c, 'SHOT A  ·  THE TOKEN', 960 - dx, 700, { align: 'center', size: 20, color: P.ink, weight: 700 });
    } else {
      TK.stage(c, 1920, 1080, { ox: -dx + 40, oy: 40, floor: 760 });
      TK.shadow(c, 640 - dx, 760, 220, 0);
      TK.token(c, 640 - dx, 650, 220, { rot: 0.18 });
      TK.word(c, 1240 - dx, 600, { size: 140, ls: 6 });
      label(c, 'SHOT B  ·  TOKEN + WORD', 960 - dx, 840, { align: 'center', size: 20, color: P.ink, weight: 700 });
    }
    for (const q of WP_PROPS[shot]) { const sx = q.x - dx; if (sx > -q.w && sx < 1920) { c.fillStyle = q.col; c.fillRect(sx, q.y, q.w, q.h); } }
  }
  function wpFrame(c, te) {   // the exposed frame at time te: shot fixed by te, samples across the shutter
    const { shot, home } = wpShot(te), bl = wpBlur(te), N = clamp(Math.ceil(bl / 3) + 1, 1, 48);
    if (N === 1) { wpScene(c, shot, (wpAngle(te) - home) * WP.px); return; }
    c.save();
    for (let k = 0; k < N; k++) {
      const ts = te + (k / (N - 1) - 0.5) * WP.sh;
      c.globalAlpha = 1 / (k + 1);
      wpScene(c, shot, (wpAngle(ts) - home) * WP.px);
    }
    c.restore();
  }
  function wpTape(c, te) {   // heading tape along the top
    const cx = 960, y = 72, hw = 520, k = 5, a = wpAngle(te);
    panel(c, cx - hw - 20, y - 40, hw * 2 + 40, 92, 0.9);
    c.save(); c.beginPath(); c.rect(cx - hw, y - 40, hw * 2, 92); c.clip();
    c.fillStyle = P.ink;
    for (let d = Math.floor((a - hw / k) / 5) * 5; d <= a + hw / k; d += 5) {
      const x = cx + (d - a) * k, big = d % 30 === 0;
      c.fillRect(x - 0.75, y + 4, 1.5, big ? 22 : 10);
      if (big) label(c, `${d}°`, x, y - 4, { align: 'center', size: 14, ls: 1, color: P.ink });
    }
    [[0, 'A'], [WP_TOT, 'B']].forEach(([d, s]) => { const x = cx + (d - a) * k; c.fillStyle = P.accent; c.fillRect(x - 13, y + 30, 26, 18); label(c, s, x, y + 45, { align: 'center', size: 14, ls: 0, color: P.ground, weight: 700 }); });
    const xc = cx + (WP_TOT / 2 - a) * k;
    c.strokeStyle = P.accent; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(xc, y - 30); c.lineTo(xc, y + 48); c.stroke(); c.setLineDash([]);
    label(c, 'CUT', xc + 6, y + 46, { size: 12, ls: 2, color: P.accentD, weight: 700 });
    c.restore();
    c.fillStyle = P.ink; c.beginPath(); c.moveTo(cx - 9, y - 40); c.lineTo(cx + 9, y - 40); c.lineTo(cx, y - 26); c.closePath(); c.fill();
    label(c, `PAN HEADING  ${a.toFixed(0).padStart(3, ' ')}°`, cx - hw - 20, y - 52, { size: 14, ls: 2 });
  }
  function wpGraph(c, te) {   // ω around the nearest whip, cut marked, playhead
    const p = Math.abs(te - WP_W[0].tc) < Math.abs(te - WP_W[1].tc) ? WP_W[0] : WP_W[1];
    const x = 1500, y = 170, w = 348, h = 250, gx = x + 24, gw = w - 48, gy = y + 46, gh = 120, span = 0.5;
    panel(c, x, y, w, h);
    label(c, 'ANGULAR VELOCITY  ω', x + 24, y + 32, { size: 14, ls: 2, color: P.ink, weight: 700 });
    const X = tt => gx + (tt - p.tc + span) / (2 * span) * gw, Y = v => gy + gh - v / WP.wmax * gh;
    c.strokeStyle = 'rgba(23,24,28,0.2)'; c.lineWidth = 1; c.beginPath(); c.moveTo(gx, gy + gh); c.lineTo(gx + gw, gy + gh); c.stroke();
    c.fillStyle = 'rgba(255,90,31,0.14)'; c.beginPath(); c.moveTo(gx, gy + gh);
    for (let i = 0; i <= 80; i++) { const tt = p.tc - span + i / 80 * 2 * span; c.lineTo(X(tt), Y(Math.abs(wpOmega(tt)))); }
    c.lineTo(gx + gw, gy + gh); c.closePath(); c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath();
    for (let i = 0; i <= 80; i++) { const tt = p.tc - span + i / 80 * 2 * span; i ? c.lineTo(X(tt), Y(Math.abs(wpOmega(tt)))) : c.moveTo(X(tt), Y(Math.abs(wpOmega(tt)))); }
    c.stroke();
    c.strokeStyle = P.accent; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(X(p.tc), gy - 6); c.lineTo(X(p.tc), gy + gh); c.stroke(); c.setLineDash([]);
    label(c, 'CUT', X(p.tc), gy + gh + 18, { align: 'center', size: 12, ls: 2, color: P.accentD, weight: 700 });
    const tp = clamp(te, p.tc - span, p.tc + span);
    c.fillStyle = P.accent; c.beginPath(); c.arc(X(tp), Y(Math.abs(wpOmega(tp))), 6, 0, TAU); c.fill();
    label(c, `ω ${Math.abs(wpOmega(te)).toFixed(0).padStart(4, ' ')} °/s`, x + 24, y + 212, { size: 24, ls: 1, color: P.ink, weight: 700 });
    label(c, `BLUR ${wpBlur(te).toFixed(0).padStart(3, ' ')} px · 180° SHUTTER`, x + 24, y + 238, { size: 13, ls: 1 });
  }
  function wpStrip(c, fi, on) {   // replay film strip: one cell per source frame, bar = blur length
    if (on <= 0.01) return;
    const x0 = 690, w = 860, cw = w / WP.nf, y = 880;
    c.save(); c.globalAlpha *= on;
    panel(c, x0 - 16, y - 96, w + 32, 128, 0.94);
    label(c, 'SOURCE FRAMES 45–74  ·  BAR = BLUR LENGTH', x0, y - 72, { size: 13, ls: 2, color: P.ink, weight: 700 });
    for (let k = 0; k < WP.nf; k++) {
      const f = WP.f0 + k, te = f / 30, b = wpBlur(te), sh = wpShot(te).shot, x = x0 + k * cw;
      const bh = 6 + b / 480 * 48;
      c.fillStyle = sh ? P.accent : 'rgba(23,24,28,0.45)'; c.fillRect(x + 3, y - bh, cw - 6, bh);
      label(c, sh ? 'B' : 'A', x + cw / 2, y + 20, { align: 'center', size: 12, ls: 0, color: f === fi ? P.ink : P.mute, weight: 700 });
      if (f === fi) { c.strokeStyle = P.ink; c.lineWidth = 2.5; c.strokeRect(x + 1, y - 58, cw - 2, 84); }
    }
    const xc = x0 + (WP_W[0].tc * 30 - WP.f0) * cw;
    c.strokeStyle = P.accentD; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(xc, y - 62); c.lineTo(xc, y + 26); c.stroke(); c.setLineDash([]);
    label(c, 'CUT', xc, y - 66 + 0, { align: 'center', size: 12, ls: 2, color: P.accentD, weight: 700 });
    c.restore();
  }

  MG.film({
    id: 'techwhippan', dur: 10, poster: 5.53,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Whip Pan', sub: 'A pan so fast it streaks, with the cut hidden inside the blur', era: '1930s —',
      origin: 'A whip pan (also swish or flash pan) swings the camera so quickly that the frame dissolves into horizontal streaks. Because a streaked frame shows nothing recognisable, editors learned to join two whip pans at their fastest point so the cut vanishes into the blur, turning a change of place or time into one apparent move. Orson Welles used flash pans in Citizen Kane (1941); Sergio Leone and the New Hollywood leaned on them, and Damien Chazelle built the rhythm of Whiplash (2014) and the climax of La La Land (2016) around whips between players.',
      works: 'Citizen Kane (Orson Welles, 1941) · Whiplash (Damien Chazelle, 2014) · La La Land (Damien Chazelle, 2016)',
      tech: ['sech² angular-velocity pulse, tanh heading', 'Shutter-averaged sub-frame samples', 'Cut placed at peak ω'],
      accent: '#ff5a1f',
      motionDNA: 'Hold, lunge, hold. A calm shot of the Token, then a 162° swing that peaks at 900°/s for barely a quarter second, landing on the beat on a different set-up with a short operator wobble as the pan is caught. A slowed, frame-by-frame replay steps through the 30 frames of the move, then the whip runs back the other way to the opening shot.',
      visualDNA: 'The Technique Atlas stage in two set-ups — the Token alone; the Token on a floor with MOTION — and grey light stands in the wings that smear into bands; a heading tape across the top with shot A, shot B and the cut marked; an ω graph with the cut line; a dimension line measuring the streak; a replay strip of blur bars.',
      transitions: 'Whip out of shot A, hard cut at the fastest frame, whip into shot B; then the reverse whip back to A',
      implementation: ['Fluid-head pan by hand, cut on the blur in the edit', 'Directional / motion blur over a position keyframe in After Effects', 'Canvas 2D: up to 48 shutter samples averaged per frame'],
      reproducibility: 'Fully procedural',
      loopable: true,
    },
    draw(c, t, W, H) {
      const fi = wpReplay(t), te = fi === null ? t : fi / 30;
      wpFrame(c, te);
      const bl = wpBlur(te), sh = wpShot(te).shot;
      // blur dimension line
      if (bl > 30) {
        const a = clamp((bl - 30) / 60), x0 = 960 - bl / 2, x1 = 960 + bl / 2, y = 330;
        c.save(); c.globalAlpha = a; c.strokeStyle = P.ink; c.lineWidth = 2;
        c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.moveTo(x0, y - 14); c.lineTo(x0, y + 14); c.moveTo(x1, y - 14); c.lineTo(x1, y + 14); c.stroke();
        panel(c, 960 - 230, y + 22, 460, 40, 0.9);
        label(c, `BLUR ${bl.toFixed(0)} px  =  ω × PX/° × 1/60 s`, 960, y + 49, { align: 'center', size: 16, ls: 2, color: P.ink, weight: 700 });
        c.restore();
      }
      // the cut frame: the first exposed frame of the new shot
      const cut = WP_W.find(p => te >= p.tc - 1e-6 && te < p.tc + 1 / 30 - 1e-6);
      if (cut) {
        c.save(); c.fillStyle = P.accent; rrect(c, 960 - 150, 470, 300, 76, 12); c.fill();
        text(c, 'CUT', 960, 524, { font: TK.FONT, weight: 900, size: 52, color: P.ground, align: 'center', ls: 6 });
        c.restore();
        label(c, 'THE NEW SHOT STARTS HERE — INSIDE THE STREAK', 960, 580, { align: 'center', size: 16, ls: 2, color: P.ink, weight: 700 });
      }
      wpTape(c, te);
      wpGraph(c, te);
      // phase tag, top left
      const p = Math.abs(te - WP_W[0].tc) < Math.abs(te - WP_W[1].tc) ? WP_W[0] : WP_W[1], d = te - p.tc;
      const ph = fi !== null ? `REPLAY · FRAME ${fi}` : d < -0.3 ? 'HOLD' : d < 0 ? 'WHIP OUT' : d < 0.3 ? 'WHIP IN' : 'HOLD';
      panel(c, 56, 40, 330, 104, 0.9);
      tag(c, `SHOT ${sh ? 'B' : 'A'}`, 72, 80);
      label(c, ph, 98, 112, { size: 16, ls: 2, color: fi !== null ? P.accentD : P.mute, weight: 700 });
      if (fi !== null) label(c, `SOURCE t ${te.toFixed(3)} s`, 98, 134, { size: 13, ls: 2 });
      const ron = Math.min(seg(t, WP.rp[0] - 0.3, WP.rp[0]), 1 - seg(t, WP.rp[1], WP.rp[1] + 0.3));
      wpStrip(c, fi === null ? -1 : fi, ron);
      if (t > WP.rp[0] - 0.6 && t < WP.rp[0]) label(c, 'REPLAY  ·  ONE SOURCE FRAME EVERY 0.1 s', 960, 200, { align: 'center', size: 18, color: P.ink, weight: 700 });
      TK.caption(c, t, W, H, { name: 'Whip Pan', cat: 'Camera', curve: u => wpAngle(u * 10) / WP_TOT, span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'PAN ANGLE / TIME' });
    },
    score(A) {
      TK.bed(A);
      WP_W.forEach(p => {
        A.whoosh(p.tc - 0.34, 0.4, { f1: 300, f2: 6500, q: 0.8, g: 0.34, swell: 0.85, rev: 0.12, pan: -0.5 * p.dir });
        A.whoosh(p.tc, 0.34, { f1: 6000, f2: 400, q: 0.9, g: 0.24, swell: 0.12, rev: 0.2, pan: 0.5 * p.dir });
        A.kick(p.tc + 0.14, 0.34, { f: 120, f2: 40 });
        A.pluck(p.tc + 0.14, midi(p.dir > 0 ? 67 : 60), { g: 0.16, bright: 0.6, dur: 1.2, rev: 0.3 });
        A.pluck(p.tc + 0.38, midi(p.dir > 0 ? 74 : 67), { g: 0.08, bright: 0.5, dur: 1.0, rev: 0.4 });
      });
      // replay: a projector tick per source frame, the streak re-heard slowly, a bell on the cut frame
      for (let k = 0; k < WP.nf; k++) {
        const f = WP.f0 + k, b = wpBlur(f / 30);
        A.osc(WP.rp[0] + k * 0.1, { type: 'square', f: 900 + b * 2.5, dur: 0.03, g: 0.018, lp: 4000 });
      }
      A.noise(WP.rp[0] + 0.6, { type: 'bandpass', f: 300, f2: 3000, sweep: 0.9, dur: 1.8, q: 1, g: 0.1, swell: 0.5, rev: 0.3 });
      A.bell(WP.rp[0] + (WP_W[0].tc * 30 - WP.f0) * 0.1, midi(84), { g: 0.09, dur: 1.4, rev: 0.5 });
      A.chord(8.5, [60, 64, 67, 72], { type: 'triangle', dur: 1.5, g: 0.035, a: 0.05, lp: 2400, rev: 0.5, width: 0.8 });
    },
  });

  /* =====================================================================
     FLOCKING — Reynolds boids, precomputed in setup(): 120 small Tokens,
     each steering only by the boids inside its 120 px neighbour radius.
     The three rules switch on one at a time on the beat — separation
     (push off anything inside 44 px), alignment (match the neighbours'
     mean velocity), cohesion (steer to their centre) — then a predator
     Token chases one boid and every boid within 320 px flees. One boid is
     inked: its radius, its neighbours and its steering vectors (one per
     rule) are drawn; the curve is local order, |Σ v̂| / n over each
     boid's neighbourhood, averaged over the flock.
     ===================================================================== */
  const FK = { N: 120, x0: 70, x1: 1850, y0: 70, y1: 860, R: 120, Rs: 44, vmin: 120, vmax: 235, vflee: 400, s: 22, FPS: 30, NF: 300, SUB: 2,
    kS: 1500, kA: 4.0, kC: 2.0, fR: 320, fK: 2800, ob: [0, 0, 650, 330], pIn: 6.1, pOut: 8.6 };
  // [time, separation, alignment, cohesion, predator]
  const FK_PH = [[0, 0, 0, 0, 0], [1.5, 1, 0, 0, 0], [3.0, 1, 1, 0, 0], [4.5, 1, 1, 1, 0], [6.5, 1, 1, 1, 1]];
  const fkRules = t => { let r = FK_PH[0]; for (const p of FK_PH) if (t >= p[0]) r = p; return r; };
  const FK_COL = [P.accentD, P.blue, GREEN, P.ink];
  const FK_ROWS = [['SEPARATION', 'STEER AWAY FROM CROWDING'], ['ALIGNMENT', 'MATCH NEIGHBOURS’ HEADING'], ['COHESION', 'STEER TO NEIGHBOURS’ CENTRE'], ['PREDATOR', 'FLEE INSIDE 320 px']];
  function flockSim() {
    const { N, NF, SUB, R, Rs } = FK, r = rng(1818), dt = 1 / (FK.FPS * SUB), R2 = R * R;
    const x = new Float64Array(N), y = new Float64Array(N), vx = new Float64Array(N), vy = new Float64Array(N), ax = new Float64Array(N), ay = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      x[i] = lerp(FK.x0 + 120, FK.x1 - 120, r()); y[i] = lerp(FK.y0 + 120, FK.y1 - 120, r());
      if (x[i] < FK.ob[2] + 60 && y[i] < FK.ob[3] + 60) y[i] += 420;
      const a = r() * TAU, s = lerp(140, 200, r()); vx[i] = Math.cos(a) * s; vy[i] = Math.sin(a) * s;
    }
    x[0] = 1060; y[0] = 520;
    const pos = new Float32Array((NF + 1) * N * 4), frc = new Float32Array((NF + 1) * 8), pol = new Float32Array(NF + 1), pr = new Float32Array((NF + 1) * 4);
    const pd = { x: -160, y: 470, vx: 900, vy: 0 }, F0 = new Float64Array(8);
    for (let f = 0; f <= NF; f++) {
      let ord = 0, no = 0;
      for (let i = 0; i < N; i++) {
        const o = (f * N + i) * 4; pos[o] = x[i]; pos[o + 1] = y[i]; pos[o + 2] = vx[i]; pos[o + 3] = vy[i];
        // local order: how well a boid's neighbourhood agrees on a heading
        let sx = 0, sy = 0, n = 0;
        for (let j = 0; j < N; j++) {
          const dx = x[i] - x[j], dy = y[i] - y[j];
          if (dx * dx + dy * dy > R2) continue;
          const sp = Math.hypot(vx[j], vy[j]) || 1; sx += vx[j] / sp; sy += vy[j] / sp; n++;
        }
        if (n > 1) { ord += Math.hypot(sx, sy) / n; no++; }
      }
      pol[f] = no ? ord / no : 0;
      for (let k = 0; k < 8; k++) frc[f * 8 + k] = F0[k];
      pr[f * 4] = pd.x; pr[f * 4 + 1] = pd.y; pr[f * 4 + 2] = pd.vx; pr[f * 4 + 3] = pd.vy;
      if (f === NF) break;
      for (let s = 0; s < SUB; s++) {
        const tt = (f * SUB + s) * dt, [, wS, wA, wC] = fkRules(tt), pAct = tt >= FK.pIn && pd.x > -400 && pd.x < 2320 && pd.y > -400 && pd.y < 1480, pFlee = pAct;
        if (pAct) {   // predator: turn-limited pursuit of boid 0, then exit
          const sp0 = Math.hypot(pd.vx, pd.vy) || 1, chase = tt < FK.pOut;
          const gx = chase ? x[0] : pd.x + pd.vx / sp0 * 1000, gy = chase ? y[0] : pd.y + pd.vy / sp0 * 1000, d = Math.hypot(gx - pd.x, gy - pd.y) || 1, spd = chase ? 900 : 1500;
          let dvx = (gx - pd.x) / d * spd - pd.vx, dvy = (gy - pd.y) / d * spd - pd.vy; const m = Math.hypot(dvx, dvy), lim = 1500 * dt;
          if (m > lim) { dvx *= lim / m; dvy *= lim / m; }
          pd.vx += dvx; pd.vy += dvy; pd.x += pd.vx * dt; pd.y += pd.vy * dt;
        }
        for (let i = 0; i < N; i++) {
          let n = 0, mvx = 0, mvy = 0, cx = 0, cy = 0, spx = 0, spy = 0;
          for (let j = 0; j < N; j++) {
            if (j === i) continue;
            const dx = x[i] - x[j], dy = y[i] - y[j], d2 = dx * dx + dy * dy;
            if (d2 > R2) continue;
            n++; mvx += vx[j]; mvy += vy[j]; cx += x[j]; cy += y[j];
            const d = Math.sqrt(d2) || 0.01;
            if (d < Rs) { spx += dx / d * (1 - d / Rs); spy += dy / d * (1 - d / Rs); }
          }
          let fsx = 0, fsy = 0, fax = 0, fay = 0, fcx = 0, fcy = 0, ffx = 0, ffy = 0;
          if (n) {
            fsx = spx * FK.kS * wS; fsy = spy * FK.kS * wS;
            fax = (mvx / n - vx[i]) * FK.kA * wA; fay = (mvy / n - vy[i]) * FK.kA * wA;
            fcx = (cx / n - x[i]) * FK.kC * wC; fcy = (cy / n - y[i]) * FK.kC * wC;
          }
          if (pAct && pFlee) {
            const dx = x[i] - pd.x, dy = y[i] - pd.y, d = Math.hypot(dx, dy) || 1;
            if (d < FK.fR) { ffx = dx / d * FK.fK * (1 - d / FK.fR); ffy = dy / d * FK.fK * (1 - d / FK.fR); }
          }
          const sp = Math.hypot(vx[i], vy[i]) || 1, wn = (r() - 0.5) * 2 * 130;
          let tx = fsx + fax + fcx + ffx - vy[i] / sp * wn, ty = fsy + fay + fcy + ffy + vx[i] / sp * wn;
          const M = 120;   // walls and the rule panel act as soft obstacles
          if (x[i] < FK.x0 + M) tx += (FK.x0 + M - x[i]) * 10; if (x[i] > FK.x1 - M) tx -= (x[i] - FK.x1 + M) * 10;
          if (y[i] < FK.y0 + M) ty += (FK.y0 + M - y[i]) * 10; if (y[i] > FK.y1 - M) ty -= (y[i] - FK.y1 + M) * 10;
          const px = FK.ob[2] + 90 - x[i], py = FK.ob[3] + 90 - y[i];
          if (px > 0 && py > 0) { if (px < py) tx += px * 10; else ty += py * 10; }
          ax[i] = tx; ay[i] = ty;
          if (i === 0 && s === 0) { F0[0] = fsx; F0[1] = fsy; F0[2] = fax; F0[3] = fay; F0[4] = fcx; F0[5] = fcy; F0[6] = ffx; F0[7] = ffy; }
        }
        for (let i = 0; i < N; i++) {
          vx[i] += ax[i] * dt; vy[i] += ay[i] * dt;
          const sp = Math.hypot(vx[i], vy[i]) || 1, near = pAct && Math.hypot(x[i] - pd.x, y[i] - pd.y) < FK.fR, hi = near ? FK.vflee : FK.vmax;
          const cl = clamp(sp, FK.vmin, hi); vx[i] *= cl / sp; vy[i] *= cl / sp;
          x[i] = clamp(x[i] + vx[i] * dt, 10, 1910); y[i] = clamp(y[i] + vy[i] * dt, 10, 900);
        }
      }
    }
    let pexit = 10; for (let f = Math.ceil(FK.pOut * FK.FPS); f <= NF; f++) { const qx = pr[f * 4], qy = pr[f * 4 + 1]; if (qx < -100 || qx > 2020 || qy < -100 || qy > 1180) { pexit = f / FK.FPS; break; } }
    return { pos, frc, pol, pr, pexit };
  }
  const fkPol = (S, t) => { const f = clamp(t * FK.FPS, 0, FK.NF), k = Math.min(FK.NF - 1, Math.floor(f)); return lerp(S.pol[k], S.pol[k + 1], f - k); };

  MG.film({
    id: 'techflocking', dur: 10, poster: 7.45,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Flocking', sub: 'Three local steering rules, no leader', era: '1987 —',
      origin: 'Craig Reynolds introduced boids in “Flocks, Herds, and Schools: A Distributed Behavioral Model” at SIGGRAPH 1987: each agent sees only nearby flockmates and steers by separation, alignment and cohesion, and flocking emerges with nobody choreographing it. The method went straight into film crowds — the bat swarms and penguins of Batman Returns (1992) — and later into dedicated crowd and swarm tools such as Massive and Houdini’s crowd and POP solvers.',
      works: 'Stanley and Stella in: Breaking the Ice (Symbolics with Whitney / Demos, 1987; Reynolds’ boids) · Batman Returns (Tim Burton, 1992; bat swarms and penguin army) · The Lion King (Disney, 1994; wildebeest stampede)',
      tech: ['Neighbour radius 120 px, separation 44 px', 'Steering = Σ weighted rule forces, clamped speed', 'Predator: flee force inside 320 px'],
      accent: '#ff5a1f',
      motionDNA: 'Disorder becoming order one rule at a time, on the beat: with no rules the Tokens wander and cross; separation spaces them out; alignment turns them into parallel streams; cohesion pulls the streams into flocks that bank together at the walls. A big Token then dives through the flock, which bursts open around it and closes behind; once it leaves, the flock re-forms.',
      visualDNA: 'The Technique Atlas stage with 120 small orange Tokens, each rotated to its heading and trailing a faint line of its last frames; one inked boid with its dashed neighbour and separation radii, thin links to its neighbours and colour-coded steering arrows; a rule panel with switches; the big predator Token with its flee radius.',
      transitions: 'Rules switch on at 1.5, 3.0 and 4.5 s; predator in at 6.5 s, breaks off at 8.6 s and leaves frame',
      implementation: ['Reynolds steering behaviours (1987)', 'Houdini POP / crowd solvers, Massive, Unity and Unreal boids', 'Canvas 2D: O(N²) boids precomputed at 60 Hz in setup(), 301 frames interpolated'],
      reproducibility: 'Seeded simulation',
      loopable: false,
    },
    setup() { return { sim: flockSim() }; },
    draw(c, t, W, H, st) {
      const S = st.sim, N = FK.N, f = clamp(t * FK.FPS, 0, FK.NF), k = Math.min(FK.NF - 1, Math.floor(f)), u = f - k;
      const at = (fr, i, q) => S.pos[(fr * N + i) * 4 + q];
      const bx = new Float64Array(N), by = new Float64Array(N), bh = new Float64Array(N);
      for (let i = 0; i < N; i++) {
        bx[i] = lerp(at(k, i, 0), at(k + 1, i, 0), u); by[i] = lerp(at(k, i, 1), at(k + 1, i, 1), u);
        bh[i] = Math.atan2(lerp(at(k, i, 3), at(k + 1, i, 3), u), lerp(at(k, i, 2), at(k + 1, i, 2), u));
      }
      const R = fkRules(t).slice(); R[4] = t >= 6.5 && t < S.pexit ? 1 : 0;
      TK.stage(c, W, H);
      // trails: the last 10 frames of every boid
      c.save(); c.strokeStyle = 'rgba(255,90,31,0.22)'; c.lineWidth = 2; c.beginPath();
      for (let i = 0; i < N; i++) {
        c.moveTo(bx[i], by[i]);
        for (let j = k; j >= Math.max(0, k - 10); j--) c.lineTo(at(j, i, 0), at(j, i, 1));
      }
      c.stroke(); c.restore();
      // focus boid neighbourhood
      const fx = bx[0], fy = by[0], nb = [];
      for (let i = 1; i < N; i++) if (Math.hypot(bx[i] - fx, by[i] - fy) < FK.R) nb.push(i);
      c.save(); c.fillStyle = 'rgba(47,91,255,0.05)'; c.beginPath(); c.arc(fx, fy, FK.R, 0, TAU); c.fill(); c.restore();
      dashCircle(c, fx, fy, FK.R, 'rgba(23,24,28,0.5)');
      dashCircle(c, fx, fy, FK.Rs, 'rgba(198,62,12,0.7)', 1.5, [3, 4]);
      c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 1; c.beginPath();
      nb.forEach(i => { c.moveTo(fx, fy); c.lineTo(bx[i], by[i]); }); c.stroke();
      // predator
      const pk = (q) => lerp(S.pr[k * 4 + q], S.pr[(k + 1) * 4 + q], u), px = pk(0), py = pk(1), pact = t >= FK.pIn;
      if (pact) {
        dashCircle(c, px, py, FK.fR, R[4] ? 'rgba(23,24,28,0.35)' : 'rgba(23,24,28,0.12)', 1.5, [10, 8]);
        c.save(); c.fillStyle = P.shadow; c.beginPath(); c.ellipse(px + 10, py + 82, 60, 11, 0, 0, TAU); c.fill(); c.restore();
      }
      // boids
      for (let i = 1; i < N; i++) TK.token(c, bx[i], by[i], FK.s, { rot: bh[i] });
      if (pact) {
        TK.token(c, px, py, 130, { rot: Math.atan2(pk(3), pk(2)) * 0.5 + t * 0.6 });
        label(c, 'PREDATOR', px, py + 112, { align: 'center', size: 15, color: P.ink, weight: 700 });
      }
      // focus boid + steering vectors
      const fo = (q) => lerp(S.frc[k * 8 + q], S.frc[(k + 1) * 8 + q], u);
      TK.token(c, fx, fy, 30, { rot: bh[0], color: P.ink });
      c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.arc(fx, fy, 26, 0, TAU); c.stroke();
      // steering vectors, length saturating with force so small corrections still read
      [0, 1, 2, 3].forEach(r => {
        const ax = fo(r * 2), ay = fo(r * 2 + 1), F = Math.hypot(ax, ay), L = 150 * (1 - Math.exp(-F / 110));
        if (L < 6) return;
        const ux = ax / F, uy = ay / F;
        c.save(); c.strokeStyle = P.ground; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(fx + ux * 28, fy + uy * 28); c.lineTo(fx + ux * (34 + L), fy + uy * (34 + L)); c.stroke(); c.restore();
        arrow(c, fx + ux * 28, fy + uy * 28, fx + ux * (34 + L), fy + uy * (34 + L), FK_COL[r], 4);
        label(c, ['SEP', 'ALI', 'COH', 'FLEE'][r], fx + ux * (52 + L), fy + uy * (52 + L) + 5, { align: 'center', size: 13, ls: 1, color: FK_COL[r], weight: 700 });
      });
      label(c, `BOID 0  ·  ${nb.length} NEIGHBOURS`, fx, fy - FK.R - 12, { align: 'center', size: 14, color: P.ink, weight: 700 });
      label(c, 'R 120', fx + FK.R * 0.72 + 6, fy + FK.R * 0.72 + 14, { size: 12, ls: 1 });
      // rule panel
      panel(c, 40, 34, FK.ob[2] - 40, FK.ob[3] - 34, 0.94);
      tag(c, 'BOIDS  ·  LOCAL RULES', 64, 76);
      FK_ROWS.forEach(([nm, desc], r) => {
        const y = 118 + r * 52, on = R[r + 1] > 0, tOn = FK_PH.find(p => p[r + 1] > 0) || [99], fl = Math.exp(-Math.max(0, t - tOn[0]) * 3) * (t >= tOn[0] ? 1 : 0);
        if (fl > 0.02) { c.save(); c.globalAlpha = fl * 0.35; c.fillStyle = P.accent; rrect(c, 52, y - 22, FK.ob[2] - 64, 48, 8); c.fill(); c.restore(); }
        c.fillStyle = FK_COL[r]; c.fillRect(66, y - 12, 22, 6);
        label(c, nm, 104, y - 2, { size: 17, color: on ? P.ink : P.mute, weight: 700 });
        label(c, desc, 104, y + 18, { size: 12, ls: 1.5 });
        const sx = FK.ob[2] - 104; c.fillStyle = on ? P.accent : 'rgba(23,24,28,0.15)'; rrect(c, sx, y - 20, 60, 28, 14); c.fill();
        c.fillStyle = P.ground; c.beginPath(); c.arc(on ? sx + 46 : sx + 14, y - 6, 10, 0, TAU); c.fill();
        label(c, on ? 'ON' : 'OFF', sx - 12, y - 1, { size: 13, align: 'right', color: on ? P.ink : P.mute, weight: 700 });
      });
      // readout top right
      panel(c, W - 372, 34, 332, 70, 0.9);
      label(c, `N ${N}  ·  LOCAL ORDER ${fkPol(S, t).toFixed(2)}`, W - 56, 76, { align: 'right', size: 17, color: P.ink, weight: 700 });
      TK.caption(c, t, W, H, { name: 'Flocking', cat: 'Simulation', curve: v => fkPol(S, v * 10), span: [0, 10], lo: -0.05, hi: 1.1, curveLabel: 'LOCAL ORDER  |Σ v̂| / n' });
    },
    score(A) {
      TK.bed(A);
      // each rule switching on: a click and a rising pluck
      FK_PH.slice(1, 4).forEach(([t0], i) => {
        A.osc(t0, { type: 'square', f: 1400, dur: 0.03, g: 0.04, lp: 5000 });
        A.pluck(t0, midi([64, 67, 72][i]), { g: 0.16, bright: 0.6, dur: 1.4, rev: 0.35 });
        A.pluck(t0 + BEAT / 2, midi([71, 74, 79][i]), { g: 0.07, bright: 0.5, dur: 1.0, rev: 0.4 });
      });
      // a soft flutter of wings, denser as the flock tightens
      for (let i = 0; i < 70; i++) {
        const tt = 0.2 + i * 0.13 + hash(i * 3.3) * 0.06;
        A.noise(tt, { type: 'bandpass', f: 2200 + hash(i) * 2500, q: 2, dur: 0.05, g: 0.012 + 0.016 * seg(tt, 3, 6), pan: (hash(i * 7.1) - 0.5) * 1.4 });
      }
      // predator dive and the burst
      A.osc(6.5, { type: 'sawtooth', f: 55, f2: 90, glide: 1.4, dur: 1.8, g: 0.06, lp: 500, lp2: 1400, lpT: 1.4, a: 0.3 });
      A.whoosh(6.6, 0.7, { f1: 300, f2: 4000, q: 1, g: 0.22, swell: 0.6, rev: 0.25 });
      A.impact(7.1, 0.16, { rev: 0.4 });
      A.whoosh(8.5, 0.6, { f1: 3000, f2: 300, q: 1, g: 0.14, swell: 0.4, rev: 0.3 });
      A.chord(8.5, [60, 64, 67, 71], { type: 'triangle', dur: 1.6, g: 0.035, a: 0.1, lp: 2200, rev: 0.6, width: 0.8 });
      A.bell(9.0, midi(84), { g: 0.06, dur: 1.2, rev: 0.5 });
    },
  });

  /* =====================================================================
     INVERSE KINEMATICS — a jointed arm on a mount, the Token as its goal.
     FK (0–2.8 s): angles in, tip out — the shoulder then the elbow are
     turned by hand until the tip finds the Token. Two-bone IK (2.8–6.3 s):
     tip goal in, angles out — the law of cosines solves both joints every
     frame as the Token moves; the Token leaves the reach circle and the arm
     straightens and points; the elbow swivels about the shoulder→tip axis
     to the mirrored solution. FABRIK (6.3–10 s): with a third bone there
     is no closed form, so the chain is solved iteratively — each iteration
     pins the tip to the goal and pulls the joints back (forward pass), then
     pins the root to the mount and pushes them out (backward pass); four
     iterations are shown with their error, then two per frame track a
     moving Token.
     ===================================================================== */
  const IK = { B: [900, 520], L: [230, 190], L3: [170, 140, 110], ts: 92, T0: [1180, 330], T3: [700, 770], it: [6.6, 0.5, 4], live: 8.6 };
  const IK_RCH = IK.L[0] + IK.L[1];
  function ik2(T, bend) {
    const [bx, by] = IK.B, [L1, L2] = IK.L, dx = T[0] - bx, dy = T[1] - by, D = Math.hypot(dx, dy);
    const d = clamp(D, Math.abs(L1 - L2) + 1, L1 + L2 - 0.001), a = Math.atan2(dy, dx);
    const al = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
    const be = Math.acos(clamp((L1 * L1 + L2 * L2 - d * d) / (2 * L1 * L2), -1, 1));
    return { th1: a - bend * al, th2: bend * (PI - be), D };
  }
  function fk2(th1, th2) {
    const [bx, by] = IK.B, [L1, L2] = IK.L, e = [bx + L1 * Math.cos(th1), by + L1 * Math.sin(th1)];
    return [IK.B, e, [e[0] + L2 * Math.cos(th1 + th2), e[1] + L2 * Math.sin(th1 + th2)]];
  }
  const IK_S0 = ik2(IK.T0, 1);
  const ikTh1FK = t => kf(t, [[0, 1.25], [0.35, 1.25], [1.2, IK_S0.th1 - 0.16, E.ioC], [1.45, IK_S0.th1, E.ioS]]);
  const ikTh2FK = t => kf(t, [[0, 0.35], [1.45, 0.35], [2.1, IK_S0.th2 + 0.24, E.ioC], [2.45, IK_S0.th2, E.ioS]]);
  const IK_TX = [[2.8, 1180], [3.6, 1120], [4.3, 1300], [4.75, 1300], [5.15, 1150], [5.9, 1150], [6.3, 1060], [6.45, 1060], [6.62, IK.T3[0], E.ioC]];
  const IK_TY = [[2.8, 330], [3.6, 700], [4.3, 200], [4.75, 200], [5.15, 540], [5.9, 540], [6.3, 300], [6.45, 300], [6.62, IK.T3[1], E.ioC]];
  const IK_FL = [5.25, 5.85];
  function ikLiveT(t) { const a = 2.245 - (t - IK.live) * 1.3, r = 320 - 50 * Math.sin((t - IK.live) * 3.2); return [IK.B[0] + Math.cos(a) * r, IK.B[1] + Math.sin(a) * r]; }
  function ikTarget(t) {
    if (t < 2.8) return IK.T0;
    if (t < IK.live) return [kf(t, IK_TX), kf(t, IK_TY)];
    return ikLiveT(t);
  }
  // two-bone pose during the IK phase, with the swivel flip projected into the picture plane
  function ik2Pose(t) {
    const T = ikTarget(t), phi = PI * E.ioS(seg(t, IK_FL[0], IK_FL[1]));
    const s = ik2(T, 1), pts = fk2(s.th1, s.th2);
    if (phi <= 0) return { pts, th1: s.th1, th2: s.th2, D: s.D, phi };
    const [b, e, p] = pts, ax = p[0] - b[0], ay = p[1] - b[1], al = Math.hypot(ax, ay), ux = ax / al, uy = ay / al;
    const along = (e[0] - b[0]) * ux + (e[1] - b[1]) * uy, hx = e[0] - b[0] - ux * along, hy = e[1] - b[1] - uy * along, cp = Math.cos(phi);
    const e2 = [b[0] + ux * along + hx * cp, b[1] + uy * along + hy * cp];
    const th1 = Math.atan2(e2[1] - b[1], e2[0] - b[0]);
    let th2 = Math.atan2(p[1] - e2[1], p[0] - e2[0]) - th1; th2 = Math.atan2(Math.sin(th2), Math.cos(th2));
    return { pts: [b, e2, p], th1, th2, D: s.D, phi, depth: Math.sin(phi) };
  }
  const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
  function fabrik(pts, T, L) {   // one iteration: returns [forward-pass chain, backward-pass chain]
    const n = pts.length, F = pts.map(p => p.slice());
    F[n - 1] = T.slice();
    for (let i = n - 2; i >= 0; i--) { const d = len(F[i + 1], F[i]) || 1; F[i] = [F[i + 1][0] + (F[i][0] - F[i + 1][0]) / d * L[i], F[i + 1][1] + (F[i][1] - F[i + 1][1]) / d * L[i]]; }
    const Bk = F.map(p => p.slice()); Bk[0] = IK.B.slice();
    for (let i = 1; i < n; i++) { const d = len(Bk[i - 1], Bk[i]) || 1; Bk[i] = [Bk[i - 1][0] + (Bk[i][0] - Bk[i - 1][0]) / d * L[i - 1], Bk[i - 1][1] + (Bk[i][1] - Bk[i - 1][1]) / d * L[i - 1]]; }
    return [F, Bk];
  }
  function ikSetup() {
    // initial three-bone pose: a gentle curve pointing up and right
    const P0 = [IK.B.slice()]; let a = -0.95;
    IK.L3.forEach((L, i) => { a += i ? 0.42 : 0; const q = P0[i]; P0.push([q[0] + Math.cos(a) * L, q[1] + Math.sin(a) * L]); });
    const its = []; let cur = P0;
    for (let k = 0; k < IK.it[2]; k++) { const [F, Bk] = fabrik(cur, IK.T3, IK.L3); its.push({ F, B: Bk, err: len(Bk[3], IK.T3) }); cur = Bk; }
    const live = [];
    for (let f = 0; f <= 300; f++) {
      const tt = f / 30;
      if (tt >= IK.live) { const T = ikLiveT(tt); for (let r = 0; r < 2; r++) cur = fabrik(cur, T, IK.L3)[1]; }
      live.push(cur.map(p => p.slice()));
    }
    return { P0, its, err0: len(P0[3], IK.T3), live };
  }
  const lerpPose = (A, B, u) => A.map((p, i) => [lerp(p[0], B[i][0], u), lerp(p[1], B[i][1], u)]);
  function drawBones(c, pts, o = {}) {
    c.save(); if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
    c.lineJoin = 'round';
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], L = len(a, b) || 1, ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, w = Math.min(30, L * 0.15) * (o.wk || 1);
      const mx = a[0] + ux * L * 0.14, my = a[1] + uy * L * 0.14;
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(mx - uy * w, my + ux * w); c.lineTo(b[0], b[1]); c.lineTo(mx + uy * w, my - ux * w); c.closePath();
      if (o.dash) c.setLineDash(o.dash);
      if (!o.ghost) { c.fillStyle = o.fill || '#f8f5ef'; c.fill(); }
      c.strokeStyle = o.stroke || P.ink; c.lineWidth = o.lw || 3; c.stroke(); c.setLineDash([]);
    }
    if (!o.ghost) pts.forEach((p, i) => {
      if (i === pts.length - 1) { c.strokeStyle = o.stroke || P.ink; c.lineWidth = 3; c.beginPath(); c.arc(p[0], p[1], 9, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(p[0] - 15, p[1]); c.lineTo(p[0] + 15, p[1]); c.moveTo(p[0], p[1] - 15); c.lineTo(p[0], p[1] + 15); c.stroke(); return; }
      c.fillStyle = o.stroke || P.ink; c.beginPath(); c.arc(p[0], p[1], i ? 12 * (o.jk ? o.jk[i] || 1 : 1) : 16, 0, TAU); c.fill();
      c.fillStyle = P.ground; c.beginPath(); c.arc(p[0], p[1], i ? 4.5 : 6, 0, TAU); c.fill();
    });
    c.restore();
  }
  function ikMount(c) {
    const [bx, by] = IK.B;
    c.save(); c.fillStyle = P.ink; rrect(c, bx - 46, by + 18, 92, 26, 6); c.fill();
    c.fillRect(bx - 7, by + 15, 14, 8);
    c.strokeStyle = 'rgba(23,24,28,0.45)'; c.lineWidth = 2; c.beginPath();
    for (let i = 0; i < 7; i++) { c.moveTo(bx - 44 + i * 14, by + 58); c.lineTo(bx - 34 + i * 14, by + 46); }
    c.stroke(); c.restore();
  }
  function ikAngles(c, pts, th1, th2, on = 1) {
    const [b, e] = pts, deg = v => `${(v * 180 / PI).toFixed(0)}°`;
    c.save(); c.globalAlpha *= on; c.strokeStyle = 'rgba(23,24,28,0.4)'; c.lineWidth = 1.5; c.setLineDash([5, 6]);
    c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(b[0] + 90, b[1]);
    c.moveTo(e[0], e[1]); c.lineTo(e[0] + Math.cos(th1) * 80, e[1] + Math.sin(th1) * 80); c.stroke(); c.setLineDash([]);
    c.strokeStyle = P.accent; c.lineWidth = 3;
    c.beginPath(); c.arc(b[0], b[1], 62, Math.min(0, th1), Math.max(0, th1)); c.stroke();
    c.beginPath(); c.arc(e[0], e[1], 50, Math.min(th1, th1 + th2), Math.max(th1, th1 + th2)); c.stroke();
    const m1 = th1 / 2, m2 = th1 + th2 / 2;
    label(c, `θ1 ${deg(-th1)}`, b[0] + Math.cos(m1) * 96, b[1] + Math.sin(m1) * 96 + 6, { align: 'center', size: 16, color: P.accentD, weight: 700, ls: 1 });
    label(c, `θ2 ${deg(-th2)}`, e[0] + Math.cos(m2) * 84, e[1] + Math.sin(m2) * 84 + 6, { align: 'center', size: 16, color: P.accentD, weight: 700, ls: 1 });
    c.restore();
  }
  function ikGizmo(c, p, a0, a1, s) {   // "turned by hand" rotation arrow around a joint
    c.save(); c.strokeStyle = P.blue; c.fillStyle = P.blue; c.lineWidth = 4; c.lineCap = 'round';
    const r = 34, lo = Math.min(a0, a1), hi = Math.max(a0, a1);
    c.beginPath(); c.arc(p[0], p[1], r, lo - 0.6, hi + 0.6); c.stroke();
    const ae = a1 >= a0 ? hi + 0.6 : lo - 0.6, dir = a1 >= a0 ? 1 : -1, ex = p[0] + Math.cos(ae) * r, ey = p[1] + Math.sin(ae) * r, tx = -Math.sin(ae) * dir, ty = Math.cos(ae) * dir;
    c.beginPath(); c.moveTo(ex + tx * 12, ey + ty * 12); c.lineTo(ex - ty * 9, ey + tx * 9); c.lineTo(ex + ty * 9, ey - tx * 9); c.closePath(); c.fill();
    label(c, s, p[0] - r - 14, p[1] + 6, { align: 'right', size: 15, color: P.blue, weight: 700 });
    c.restore();
  }
  const ikErrCurve = (st) => u => { const k = clamp(Math.floor(u * IK.it[2] + 1e-6), 0, IK.it[2]); return (k ? st.its[k - 1].err : st.err0) / st.err0; };

  MG.film({
    id: 'techik', dur: 10, poster: 5.5,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Inverse Kinematics', sub: 'Place the tip; the joints are solved', era: '1980s —',
      origin: 'Forward kinematics poses a chain joint by joint; inverse kinematics runs the other way, solving the joint angles that put the end of the chain on a goal. The maths came from robotics in the 1970s and 80s, and IK handles reached 3D animation packages by the early 1990s (Softimage was an early champion), along with the two-bone analytic solver still used for arms and legs. Iterative solvers handle longer chains: Cyclic Coordinate Descent (Wang and Chen, 1991) and FABRIK, Forward And Backward Reaching IK, published by Andreas Aristidou and Joan Lasenby in 2011.',
      works: 'Jurassic Park (Steven Spielberg, 1993; Softimage-animated dinosaurs) · Toy Story (Pixar, 1995) · Duik (Nicolas Dufresne; free IK rigging tools for After Effects character animation)',
      tech: ['Two-bone law-of-cosines solve', 'Reach limit and bend (pole) flip', 'FABRIK forward / backward passes'],
      accent: '#ff5a1f',
      motionDNA: 'First the slow, fussy way: the shoulder is turned, then the elbow, overshooting and correcting until the tip finds the Token. Then the Token leads and the arm follows instantly — down, out past its reach until it locks straight and points, back in, and a swivel that flips the elbow to the other side without moving the tip. Finally a three-bone arm solves on the beat, one iteration per beat, snapping closer each time, then tracks the Token smoothly.',
      visualDNA: 'The Technique Atlas stage with a rigging-viewport arm: octahedral bones in paper and ink, ink joint discs, a crosshair end effector and a hatched mount; the orange Token as the goal; orange angle arcs, blue hand-rotation gizmos, a dashed reach circle; dashed ghost chains and an error list for each FABRIK iteration.',
      transitions: 'FK → two-bone IK at 2.8 s; elbow swivel at 5.25 s; re-rig to three bones and FABRIK at 6.3 s',
      implementation: ['Maya IK handles: rotate-plane solver (two-bone) with a pole vector', 'FABRIK / CCD chain solvers in Unity, Unreal, Blender', 'Canvas 2D: analytic solve per frame; FABRIK iterations precomputed in setup()'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return ikSetup(); },
    draw(c, t, W, H, st) {
      TK.stage(c, W, H);
      const T = ikTarget(t), phase = t < 2.8 ? 0 : t < 6.3 ? 1 : 2;
      // reach circle
      const reachOn = phase === 1 ? 1 : phase === 0 ? seg(t, 2.2, 2.8) : 1 - seg(t, 6.3, 6.6) * 0.5;
      const pose = phase === 1 ? ik2Pose(t) : null, out = pose && pose.D > IK_RCH + 0.5;
      dashCircle(c, IK.B[0], IK.B[1], IK_RCH, out ? P.accent : `rgba(23,24,28,${0.28 * reachOn})`, out ? 2.5 : 1.5, [8, 8]);
      label(c, `REACH ${IK_RCH} px`, IK.B[0] - IK_RCH * 0.71 - 10, IK.B[1] + IK_RCH * 0.71 + 20, { align: 'right', size: 13, ls: 2, color: out ? P.accentD : P.mute });
      // the goal
      TK.token(c, T[0], T[1], IK.ts, { rot: 0.12 });
      let mode, sub, rows = [];
      if (phase === 0) {
        const th1 = ikTh1FK(t), th2 = ikTh2FK(t), pts = fk2(th1, th2);
        // tip trail
        c.save(); c.strokeStyle = 'rgba(47,91,255,0.5)'; c.lineWidth = 2; c.setLineDash([2, 5]); c.beginPath();
        for (let s = 0; s <= t + 1e-6; s += 1 / 30) { const q = fk2(ikTh1FK(s), ikTh2FK(s))[2]; s ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }
        c.stroke(); c.restore();
        drawBones(c, pts);
        ikAngles(c, pts, th1, th2);
        if (t > 0.3 && t < 1.5) ikGizmo(c, pts[0], 1.25, IK_S0.th1, 'TURN θ1');
        if (t > 1.45 && t < 2.5) ikGizmo(c, pts[1], th1 + 0.35, th1 + IK_S0.th2, 'TURN θ2');
        const d = len(pts[2], T);
        if (d < 4) label(c, 'TIP ON TARGET — BY HAND', T[0], T[1] + 84, { align: 'center', size: 16, color: P.ink, weight: 700 });
        mode = 'FORWARD KINEMATICS'; sub = 'ANGLES IN  →  TIP OUT';
        rows = [['θ1 SHOULDER', `${(-th1 * 180 / PI).toFixed(1)}°`], ['θ2 ELBOW', `${(-th2 * 180 / PI).toFixed(1)}°`], ['TIP → GOAL', `${d.toFixed(0)} px`]];
      } else if (phase === 1) {
        const p = pose, pts = p.pts;
        if (p.phi > 0 && p.phi < PI) {   // swivel axis
          c.save(); c.strokeStyle = P.blue; c.lineWidth = 2; c.setLineDash([10, 6]); c.beginPath();
          c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[2][0], pts[2][1]); c.stroke(); c.restore();
          const s0 = ik2(T, 1), e0 = fk2(s0.th1, s0.th2), s1 = ik2(T, -1), e1 = fk2(s1.th1, s1.th2);
          drawBones(c, e0, { ghost: true, dash: [5, 6], stroke: 'rgba(23,24,28,0.35)', lw: 2 });
          drawBones(c, e1, { ghost: true, dash: [5, 6], stroke: 'rgba(198,62,12,0.6)', lw: 2 });
          label(c, 'SWIVEL ABOUT SHOULDER → TIP', (pts[0][0] + pts[2][0]) / 2, (pts[0][1] + pts[2][1]) / 2 + 150, { align: 'center', size: 15, color: P.blue, weight: 700 });
        }
        if (out) {
          c.save(); c.strokeStyle = P.accentD; c.lineWidth = 2; c.setLineDash([4, 5]); c.beginPath(); c.moveTo(pts[2][0], pts[2][1]); c.lineTo(T[0], T[1]); c.stroke(); c.restore();
          label(c, `OUT OF REACH · GAP ${(p.D - IK_RCH).toFixed(0)} px`, T[0] - 40, T[1] - 96, { align: 'center', size: 16, color: P.accentD, weight: 700 });
          label(c, 'FULLY EXTENDED · POINTING AT GOAL', T[0] - 40, T[1] - 70, { align: 'center', size: 13, ls: 2, color: P.ink });
        }
        drawBones(c, pts, { jk: [1, 1 + 0.35 * (p.depth || 0)] });
        ikAngles(c, pts, p.th1, p.th2, 1);
        const bend = p.phi < PI / 2 ? '+' : '−';
        mode = 'INVERSE KINEMATICS'; sub = 'TIP GOAL IN  →  ANGLES OUT';
        rows = [['SOLVER', '2-BONE ANALYTIC'], ['θ1 SHOULDER', `${(-p.th1 * 180 / PI).toFixed(1)}°`], ['θ2 ELBOW', `${(-p.th2 * 180 / PI).toFixed(1)}°`], ['BEND', p.phi > 0 && p.phi < PI ? `${bend}  (SWIVEL ${(p.phi * 180 / PI).toFixed(0)}°)` : bend], ['GOAL DIST', `${p.D.toFixed(0)} / ${IK_RCH} px`]];
      } else {
        const [i0, id, n] = IK.it, k = Math.floor((t - i0) / id) + 1, u = (t - i0) / id - (k - 1);
        let pts, note = '';
        if (t < i0) { pts = st.P0; note = '+1 BONE  ·  NO CLOSED FORM  →  ITERATE'; }
        else if (k <= n) {
          const it = st.its[k - 1], prev = k === 1 ? st.P0 : st.its[k - 2].B;
          for (let j = 0; j < k - 1; j++) drawBones(c, st.its[j].B, { ghost: true, dash: [4, 6], stroke: 'rgba(23,24,28,0.25)', lw: 1.5 });
          if (u < 0.5) {
            pts = lerpPose(prev, it.F, E.ioC(clamp(u * 2 / 0.8)));
            note = `ITERATION ${k}  ·  FORWARD: TIP PINNED TO GOAL`;
            c.save(); c.strokeStyle = P.accentD; c.lineWidth = 2; c.setLineDash([4, 5]); c.beginPath(); c.moveTo(IK.B[0], IK.B[1]); c.lineTo(pts[0][0], pts[0][1]); c.stroke(); c.restore();
            if (len(pts[0], IK.B) > 30) label(c, 'ROOT PULLED OFF THE MOUNT', pts[0][0] + 26, pts[0][1] - 20, { size: 13, color: P.accentD, weight: 700, ls: 2 });
          } else {
            pts = lerpPose(it.F, it.B, E.ioC(clamp((u - 0.5) * 2 / 0.8)));
            note = `ITERATION ${k}  ·  BACKWARD: ROOT PINNED TO MOUNT`;
          }
        } else {
          const f = clamp(t * 30, 0, 300), j = Math.min(299, Math.floor(f));
          pts = lerpPose(st.live[j], st.live[j + 1], f - j);
          note = 'LIVE  ·  2 ITERATIONS PER FRAME, WARM START';
        }
        drawBones(c, pts, { alpha: t < i0 ? E.outC(seg(t, 6.3, 6.5)) : 1 });
        if (t < 6.5) { const q = ik2Pose(6.299).pts; drawBones(c, q, { alpha: 1 - seg(t, 6.3, 6.45), ghost: true, lw: 2 }); }
        label(c, note, 960, 980 - 0, { align: 'center', size: 15, color: P.ink, weight: 700 });
        mode = 'INVERSE KINEMATICS'; sub = 'TIP GOAL IN  →  ANGLES OUT';
        rows = [['SOLVER', 'FABRIK · 3 BONES']];
        const ke = t < i0 ? 0 : Math.min(n, k - (u < 0.5 ? 1 : 0));
        rows.push(['ITER 0', `ERR ${st.err0.toFixed(1)} px`]);
        for (let j = 0; j < ke; j++) rows.push([`ITER ${j + 1}`, `ERR ${st.its[j].err.toFixed(1)} px`]);
        if (t >= IK.live) rows.push(['TIP → GOAL', `${len(pts[3], T).toFixed(1)} px`]);
      }
      ikMount(c);
      // left tag, right panel
      panel(c, 56, 40, 470, 104, 0.9);
      tag(c, mode, 72, 80);
      label(c, sub, 98, 114, { size: 16, ls: 2, color: P.accentD, weight: 700 });
      panel(c, 1500, 40, 364, 64 + rows.length * 38, 0.92);
      rows.forEach(([a, b], i) => {
        label(c, a, 1522, 84 + i * 38, { size: 15, ls: 2 });
        label(c, b, 1840, 84 + i * 38, { size: 17, ls: 1, color: P.ink, weight: 700, align: 'right' });
      });
      if (phase === 0) TK.caption(c, t, W, H, { name: 'Inverse Kinematics', cat: 'Rigging', curve: v => len(fk2(ikTh1FK(v * 2.8), ikTh2FK(v * 2.8))[2], IK.T0) / len(fk2(1.25, 0.35)[2], IK.T0), span: [0, 2.8], lo: -0.1, hi: 1.25, curveLabel: 'TIP → GOAL / TIME' });
      else if (phase === 1) TK.caption(c, t, W, H, { name: 'Inverse Kinematics', cat: 'Rigging', curve: v => -ik2Pose(2.8 + v * 3.5).th2 / PI, span: [2.8, 6.3], lo: -1.1, hi: 1.1, curveLabel: 'ELBOW θ2 / π  ·  SIGN = BEND' });
      else TK.caption(c, t, W, H, { name: 'Inverse Kinematics', cat: 'Rigging', curve: ikErrCurve(st), span: [IK.it[0], IK.it[0] + IK.it[1] * IK.it[2]], lo: -0.1, hi: 1.15, curveLabel: 'FABRIK ERROR / ITERATION' });
    },
    score(A) {
      TK.bed(A);
      // FK: a ratchet click every 4° the hand turns a joint
      let last1 = ikTh1FK(0), last2 = ikTh2FK(0);
      for (let s = 0; s < 2.6; s += 0.005) {
        const a = ikTh1FK(s), b = ikTh2FK(s);
        if (Math.abs(a - last1) > 4 * PI / 180) { A.osc(s, { type: 'square', f: 2400, dur: 0.012, g: 0.022, lp: 6000 }); last1 = a; }
        if (Math.abs(b - last2) > 4 * PI / 180) { A.osc(s, { type: 'square', f: 1800, dur: 0.012, g: 0.022, lp: 6000 }); last2 = b; }
      }
      A.pluck(2.45, midi(72), { g: 0.16, bright: 0.6, dur: 1.2, rev: 0.3 });
      // IK: the goal leads, a soft glide follows each move
      [[2.8, 3.6, 67, 64], [3.6, 4.3, 64, 71], [4.75, 5.15, 71, 67], [5.9, 6.3, 67, 69]].forEach(([a, b, m0, m1]) => A.osc(a, { type: 'triangle', f: midi(m0), f2: midi(m1), glide: b - a, dur: b - a + 0.1, g: 0.05, a: 0.05, lp: 2000, rev: 0.4 }));
      // reach limit: the arm locks straight
      let tl = 4.3; for (let s = 3.6; s < 4.3; s += 0.005) if (ik2Pose(s).D > IK_RCH) { tl = s; break; }
      A.kick(tl, 0.32, { f: 160, f2: 60 }); A.noise(tl, { type: 'bandpass', f: 900, q: 3, dur: 0.12, g: 0.1 });
      A.osc(tl, { type: 'sawtooth', f: 98, f2: 104, glide: 0.45, dur: 0.5, g: 0.035, lp: 700 });
      // elbow swivel
      A.whoosh(IK_FL[0], IK_FL[1] - IK_FL[0], { f1: 400, f2: 2600, q: 1.4, g: 0.16, swell: 0.6, rev: 0.3 });
      A.pluck(IK_FL[1], midi(76), { g: 0.14, bright: 0.6, dur: 1.2, rev: 0.35 });
      // FABRIK: goal jumps, then forward (high) and backward (low) blips per iteration, rising as error falls
      A.whoosh(6.42, 0.24, { f1: 600, f2: 4000, q: 1, g: 0.14, swell: 0.7 });
      for (let k = 0; k < IK.it[2]; k++) {
        const t0 = IK.it[0] + k * IK.it[1];
        A.pluck(t0, midi(72 + k * 2), { g: 0.13, bright: 0.7, dur: 0.6, rev: 0.25 });
        A.pluck(t0 + IK.it[1] / 2, midi(60 + k * 2), { g: 0.12, bright: 0.5, dur: 0.6, rev: 0.25 });
      }
      A.bell(IK.live, midi(84), { g: 0.08, dur: 1.4, rev: 0.5 });
      A.chord(IK.live, [60, 64, 67, 72], { type: 'triangle', dur: 1.4, g: 0.035, a: 0.05, lp: 2400, rev: 0.5, width: 0.8 });
    },
  });
})();
