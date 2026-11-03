/* batch m7 — Narrative Formats · Film & TV / Advertising: formatinterview · formattestimonial · formatunboxing.
   formatinterview (documentary talking-head grammar: the Token framed on the left third with lead
   room, its eyeline to an off-camera interviewer beside the lens, a two-camera setup cutting wide ↔
   close on the same answer, the lower-third name super on first appearance, an archive B-roll
   cutaway laid over a jump cut in the interview track — the hidden cut shown live in a V1 monitor —
   and the key line pulled out as type while it is spoken; a plan view and an edit timeline run
   alongside) ·
   formattestimonial (the customer-testimonial ad: open on the strongest line, then the customer
   tells it in their own words — the problem, the moment it changed, a measured result — under a
   REAL CUSTOMER super and burned-in captions; the one voice becomes a wall of reviews and a star
   rating, and only then does the brand speak: product, CTA and the results-not-typical small print) ·
   formatunboxing (the overhead unboxing video: a sealed box on the desk, the tape cut, the flaps,
   the lid, then the slowest beat of the film — sticker and tissue — before the reveal of the Token
   in its foam; the contents laid out knolling-style at right angles with even gaps, and a
   first-impression verdict; the caption graph plots the pace, dipping just before the reveal). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, vnoise, midi, text, rng, rrect } = MG;
  const TK = MG.TK, FK = MG.FK, P = TK.P, PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const CREAM = '#ece8df', CREAM2 = 'rgba(236,232,223,0.62)';
  const label = (c, s, x, y, o = {}) => FK.label(c, s, x, y, { size: o.size || 14, ls: o.ls ?? 2.5, color: o.color || P.mute, align: o.align, weight: o.weight, base: o.base });
  const win = (t, a, b, f = 0.3) => Math.min(seg(t, a, a + f), 1 - seg(t, b - f, b));   // fade in / hold / fade out
  const sinc = u => Math.sin(PI * clamp(u));
  /* A convention annotation: small accent tick + bold mono label. */
  function note(c, s, x, y, on = 1, o = {}) {
    if (on <= 0.01) return;
    c.save(); c.globalAlpha *= on;
    const al = o.align || 'left', dx = al === 'right' ? -1 : 1;
    c.fillStyle = P.accent; c.fillRect(al === 'right' ? x - 4 : x, y - 11, 4, 12);
    label(c, s, x + dx * 12, y, { align: al, color: o.color || P.ink, weight: 700, size: o.size || 14 });
    c.restore();
  }
  const sub = (c, s, x, y, on, o = {}) => { if (on <= 0.01) return; c.save(); c.globalAlpha *= on; label(c, s, x, y, o); c.restore(); };
  /* Speech: syllable onsets for phrases [t0, t1], an envelope for lip-sync pulses, and a
     formant-ish mumble voice (filtered saw + breath) for the score. */
  function sylls(phrases, seed) {
    const out = [];
    phrases.forEach(([a, b], p) => { for (let s = a, k = 0; s < b; k++) { out.push(s); s += 0.14 + 0.12 * hash(seed + p * 31 + k * 7.3); } });
    return out;
  }
  const talk = (t, S, d = 0.14) => { let v = 0; for (let i = 0; i < S.length; i++) { const u = t - S[i]; if (u >= 0 && u < d) v = Math.max(v, Math.sin(PI * u / d)); } return v; };
  function voice(A, S, o = {}) {
    const g = o.g ?? 0.05;
    S.forEach((s, i) => {
      const h = hash(i * 3.7 + (o.seed || 0)), f = (o.f || 150) * (1 + 0.22 * h - (i % 6 === 5 ? 0.12 : 0));
      A.osc(s, { type: 'sawtooth', f, f2: f * (0.86 + 0.2 * hash(i + 9)), glide: 0.12, dur: 0.13, g, a: 0.015, lp: o.lp || 1000, q: 3, pan: o.pan || 0 });
      A.noise(s, { type: 'bandpass', f: 1500 + 900 * h, q: 3, dur: 0.05, g: g * 0.35, pan: o.pan || 0 });
    });
  }
  function star(c, x, y, r, fill, stroke) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); }
  }
  /* Measure a string in a given font (letter-spacing aware). */
  function measure(c, s, size, weight = 800, ls = 0, font = TK.FONT) {
    c.font = `${weight} ${size}px ${font}`; c.letterSpacing = ls + 'px';
    const w = c.measureText(s).width; c.letterSpacing = '0px'; return w;
  }
  const FONTS = [...FK.fonts, [`500 22px ${TK.FONT}`, 'REAL CUSTOMER'], [`700 14px ${TK.MONO}`, 'EYELINE']];

  /* =====================================================================
     TALKING-HEAD INTERVIEW — a dim, warm interview set. A-cam wide holds
     the room with the Token on the left third, looking across lead room
     to an interviewer just off-lens (eyeline line); B-cam close is the
     same answer from a second angle and carries the lower-third super.
     The answer is edited — a jump cut at 5.0 s — and an archive B-roll
     photo, Ken Burns-pushed, is laid over it on V2 while the voice runs
     on; a small V1 monitor shows the cut it hides. Back on A-cam on a
     pause, then the key line is pulled out as type, word by word. A plan
     view (top right) and the edit (bottom right) run alongside.
     ===================================================================== */
  const IB = [
    { t0: 0, t1: 1.8, name: 'Wide · A-cam', kind: 'hook' },
    { t0: 1.8, t1: 4.2, name: 'Close · super', kind: 'title' },
    { t0: 4.2, t1: 5.8, name: 'B-roll', kind: 'turn' },
    { t0: 5.8, t1: 7.6, name: 'Wide · A-cam', kind: 'act' },
    { t0: 7.6, t1: 10, name: 'Pull quote', kind: 'title' },
  ];
  const IV_JUMP = 5.0;
  const IV_Q = [['I', 7.8], ['was', 7.94], ['a', 8.08], ['square.', 8.2], ['Then', 8.72], ['I', 8.88], ['learned', 9.0], ['to', 9.2], ['move.', 9.32]];
  const IV_LINES = [[0, 4], [4, 7], [7, 9]];
  const IV_SYL = [...sylls([[0.2, 1.55], [2.0, 3.95], [4.3, 4.95], [5.05, 5.6], [6.05, 7.35]], 11), ...IV_Q.map(q => q[1]), 8.36];
  const IV_WIDE = { fx: 960, fy: 540, sx: 960, sy: 540, z: 1 };
  const ivClose = t => (t < IV_JUMP ? { fx: 640, fy: 600, sx: 700, sy: 500, z: 2.4 } : { fx: 640, fy: 600, sx: 748, sy: 482, z: 2.52, r: 0.05 });
  /* The set, seen through a camera {fx, fy → sx, sy, z}: the back wall zooms less than the subject
     (parallax) and softens in the close-up (shallow focus). */
  function ivSet(c, t, W, H, cam, env) {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#272b34'); g.addColorStop(1, '#15171c');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const zb = 1 + (cam.z - 1) * 0.4, close = clamp((cam.z - 1) / 1.4);
    c.save(); c.translate(cam.sx, cam.sy); c.scale(zb, zb); c.translate(-cam.fx, -cam.fy);
    // floor
    c.fillStyle = '#111217'; c.fillRect(-600, 830, 3200, 800);
    // practical lamp glow
    const lg = c.createRadialGradient(1480, 380, 10, 1480, 380, 560); lg.addColorStop(0, 'rgba(255,176,104,0.30)'); lg.addColorStop(1, 'rgba(255,176,104,0)');
    c.fillStyle = lg; c.fillRect(900, -200, 1200, 1200);
    c.globalAlpha = 1 - 0.45 * close;
    // bookshelf
    c.fillStyle = '#1d2027'; c.fillRect(130, 200, 320, 630);
    const r = rng(17), BC = ['#5a4a3c', '#3c4a5a', '#6b5440', '#44504a', '#7a3f2a', '#4d4237'];
    for (let row = 0; row < 4; row++) {
      const sy = 320 + row * 125;
      c.fillStyle = '#323642'; c.fillRect(130, sy, 320, 9);
      for (let x = 146; x < 430;) { const w = 14 + r() * 16, h = 66 + r() * 40; c.fillStyle = BC[Math.floor(r() * BC.length)]; c.fillRect(x, sy - h, w - 2, h); x += w; }
    }
    // plant
    c.fillStyle = '#2b2620'; c.fillRect(1690, 730, 90, 100);
    c.fillStyle = '#2f4a3a';
    for (let k = 0; k < 7; k++) { c.save(); c.translate(1735, 730); c.rotate(-1.2 + k * 0.4); c.beginPath(); c.ellipse(0, -90, 22, 90, 0, 0, TAU); c.fill(); c.restore(); }
    // lamp
    c.fillStyle = '#3a3530'; c.fillRect(1478, 390, 5, 440);
    c.fillStyle = '#e9c79c'; c.beginPath(); c.moveTo(1430, 320); c.lineTo(1530, 320); c.lineTo(1560, 395); c.lineTo(1400, 395); c.closePath(); c.fill();
    c.globalAlpha = 1;
    // string lights as bokeh (bigger, softer in the close-up)
    for (let i = 0; i < 10; i++) {
      const x = 860 + i * 100, y = 210 + 26 * Math.sin(i * 0.9), rr = 10 + 26 * close;
      const bg = c.createRadialGradient(x, y, 0, x, y, rr * 1.8); bg.addColorStop(0, `rgba(255,214,150,${0.5 - 0.25 * close})`); bg.addColorStop(0.5, `rgba(255,190,120,${0.18 - 0.05 * close})`); bg.addColorStop(1, 'rgba(255,190,120,0)');
      c.fillStyle = bg; c.fillRect(x - rr * 2, y - rr * 2, rr * 4, rr * 4);
    }
    c.restore();
    // subject + stool at full camera zoom
    c.save(); c.translate(cam.sx, cam.sy); c.scale(cam.z, cam.z); c.translate(-cam.fx, -cam.fy);
    c.fillStyle = '#3a3026'; c.fillRect(560, 700, 160, 16);
    c.strokeStyle = '#2b241d'; c.lineWidth = 7; c.beginPath(); c.moveTo(580, 716); c.lineTo(566, 830); c.moveTo(700, 716); c.lineTo(714, 830); c.moveTo(590, 780); c.lineTo(690, 780); c.stroke();
    // key light from camera left: warm rim
    const kl = c.createRadialGradient(560, 520, 10, 600, 580, 260); kl.addColorStop(0, 'rgba(255,220,180,0.10)'); kl.addColorStop(1, 'rgba(255,220,180,0)');
    c.fillStyle = kl; c.fillRect(300, 300, 600, 600);
    TK.token(c, 640, 600 - 3 * env, 200 * (1 + 0.012 * env), { rot: cam.r || 0 });
    c.restore();
    const vg = c.createRadialGradient(960, 540, 380, 960, 540, 1150); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
  }
  const ivToScreen = (cam, x, y) => [cam.sx + (x - cam.fx) * cam.z, cam.sy + (y - cam.fy) * cam.z];
  function ivThirds(c, W, H, a) {
    if (a <= 0.01) return;
    c.save(); c.globalAlpha = a; c.strokeStyle = 'rgba(236,232,223,0.22)'; c.lineWidth = 1.5; c.setLineDash([5, 9]);
    c.beginPath(); [640, 1280].forEach(x => { c.moveTo(x, 80); c.lineTo(x, H - 190); }); [360, 720].forEach(y => { c.moveTo(0, y); c.lineTo(W, y); }); c.stroke();
    c.restore();
  }
  /* Eyeline (dashed, from the hole across the lead room and out of frame) and the lead-room bracket. */
  function ivEyeline(c, t, W, cam, a, yb) {
    if (a <= 0.01) return;
    const s = 200 * cam.z, [tx, ty] = ivToScreen(cam, 640, 600), hx = tx + s * TK.HOLE.x, hy = ty + s * TK.HOLE.y;
    c.save(); c.globalAlpha = a;
    c.strokeStyle = P.accent; c.lineWidth = 2.5; c.setLineDash([10, 9]); c.lineDashOffset = -t * 40;
    const ex = tx + s / 2 + 12, ey = lerp(hy, hy - 40, (ex - hx) / (W - hx));
    c.beginPath(); c.moveTo(ex, ey); c.lineTo(W, hy - 40); c.stroke(); c.setLineDash([]);
    c.fillStyle = P.accent; c.beginPath(); c.moveTo(W - 4, hy - 40); c.lineTo(W - 26, hy - 50); c.lineTo(W - 24, hy - 29); c.closePath(); c.fill();
    c.restore();
    note(c, 'EYELINE → INTERVIEWER, JUST OFF-LENS', W - 80, hy - 62, a, { align: 'right', color: CREAM });
    // lead room
    const rx = tx + s / 2 + 24;
    c.save(); c.globalAlpha = a * 0.85; c.strokeStyle = CREAM2; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(rx, yb - 10); c.lineTo(rx, yb + 10); c.moveTo(rx, yb); c.lineTo(W - 80, yb); c.moveTo(W - 80, yb - 10); c.lineTo(W - 80, yb + 10); c.stroke();
    c.restore();
    sub(c, 'LEAD ROOM · SPACE ON THE SIDE THEY FACE', (rx + W - 80) / 2, yb - 14, a, { align: 'center', color: CREAM, weight: 700, size: 13 });
  }
  /* Plan view of the two-camera setup; the live camera gets the red tally. */
  function ivPlan(c, t, live, a) {
    if (a <= 0.01) return;
    const x0 = 1500, y0 = 92, w = 348, h = 232;
    c.save(); c.globalAlpha = a;
    c.fillStyle = 'rgba(10,11,14,0.72)'; rrect(c, x0, y0, w, h, 10); c.fill();
    c.strokeStyle = 'rgba(236,232,223,0.18)'; c.lineWidth = 1; c.stroke();
    label(c, 'PLAN · TWO-CAMERA SETUP', x0 + 16, y0 + 26, { size: 12, color: CREAM2 });
    const S = [x0 + 80, y0 + 140], I = [x0 + 270, y0 + 140], CA = [x0 + 250, y0 + 196], CB = [x0 + 268, y0 + 74];
    // eyeline in plan
    c.strokeStyle = 'rgba(255,90,31,0.5)'; c.setLineDash([4, 5]); c.lineWidth = 1.5; c.beginPath(); c.moveTo(S[0] + 18, S[1]); c.lineTo(I[0] - 14, I[1]); c.stroke(); c.setLineDash([]);
    const cone = (C, wide, on) => {
      const ang = Math.atan2(S[1] - C[1], S[0] - C[0]), sp = wide ? 0.42 : 0.16, L = Math.hypot(S[0] - C[0], S[1] - C[1]) + 30;
      c.fillStyle = on ? 'rgba(255,90,31,0.22)' : 'rgba(236,232,223,0.06)';
      c.beginPath(); c.moveTo(C[0], C[1]); c.lineTo(C[0] + Math.cos(ang - sp) * L, C[1] + Math.sin(ang - sp) * L); c.lineTo(C[0] + Math.cos(ang + sp) * L, C[1] + Math.sin(ang + sp) * L); c.closePath(); c.fill();
      c.save(); c.translate(C[0], C[1]); c.rotate(ang); c.fillStyle = on ? CREAM : 'rgba(236,232,223,0.45)'; c.fillRect(-12, -9, 22, 18); c.fillRect(10, -5, 8, 10); c.restore();
      if (on && Math.floor(t * 2) % 2 === 0) { c.fillStyle = '#ff3b30'; c.beginPath(); c.arc(C[0] + 18, C[1] - 16, 5, 0, TAU); c.fill(); }
    };
    cone(CA, true, live === 'A'); cone(CB, false, live === 'B');
    TK.token(c, S[0], S[1], 30);
    c.fillStyle = 'rgba(236,232,223,0.7)'; c.beginPath(); c.arc(I[0], I[1], 13, 0, TAU); c.fill();
    label(c, 'SUBJECT', S[0], S[1] + 42, { size: 11, ls: 1.5, color: CREAM2, align: 'center' });
    label(c, 'INTERVIEWER', I[0], I[1] - 22, { size: 11, ls: 1.5, color: CREAM2, align: 'center' });
    label(c, 'A · WIDE', CA[0] + 22, CA[1] + 26, { size: 11, ls: 1.5, color: live === 'A' ? CREAM : CREAM2, weight: live === 'A' ? 700 : 400, align: 'right' });
    label(c, 'B · CLOSE', CB[0] - 34, CB[1] - 4, { size: 11, ls: 1.5, color: live === 'B' ? CREAM : CREAM2, weight: live === 'B' ? 700 : 400, align: 'right' });
    c.restore();
  }
  /* The edit: V2 (B-roll, graphics), V1 (A / B camera), A1 (the voice, unbroken). */
  function ivEdit(c, t) {
    const x0 = 1180, x1 = 1848, X = s => lerp(x0, x1, s / 10), rows = { V2: 948, V1: 974, A1: 1000 };
    label(c, 'EDIT', x0 - 46, 932, { size: 12, color: CREAM2, weight: 700 });
    label(c, 'B-ROLL ON V2 COVERS THE CUT ON V1', x1, 932, { size: 12, color: CREAM2, align: 'right' });
    Object.entries(rows).forEach(([n, y]) => label(c, n, x0 - 46, y + 15, { size: 12, color: CREAM2 }));
    const clip = (a, b, y, col, s, h = 20) => {
      c.fillStyle = col; c.fillRect(X(a) + 1, y, X(b) - X(a) - 2, h);
      if (X(b) - X(a) > 44) label(c, s, X(a) + 6, y + 14, { size: 10, ls: 1, color: '#17181c', weight: 700 });
    };
    clip(0, 1.8, rows.V1, '#8a93a6', 'A');
    clip(1.8, IV_JUMP, rows.V1, '#c6b79c', 'B · TAKE 1');
    clip(IV_JUMP, 5.8, rows.V1, '#c6b79c', 'B · T3');
    clip(5.8, 7.6, rows.V1, '#8a93a6', 'A');
    const drop = E.outB(seg(t, 4.0, 4.25));
    if (t > 4.0) { c.save(); c.globalAlpha = drop; c.translate(0, -18 * (1 - drop)); clip(4.2, 5.8, rows.V2, P.accent, 'B-ROLL'); c.restore(); }
    if (t > 7.4) clip(7.6, 10, rows.V2, CREAM, 'QUOTE GFX');
    // jump cut marker on V1
    c.strokeStyle = '#ff3b30'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(X(IV_JUMP), rows.V1 - 4); c.lineTo(X(IV_JUMP), rows.V1 + 24); c.stroke();
    // A1: voice waveform, unbroken
    c.fillStyle = 'rgba(120,200,150,0.75)';
    for (let x = x0; x < x1; x += 4) {
      const s = (x - x0) / (x1 - x0) * 10, v = talk(s, IV_SYL, 0.16);
      const h = 2 + 18 * v * (0.6 + 0.4 * hash(Math.floor(x)));
      c.fillRect(x, rows.A1 + 11 - h / 2, 2, h);
    }
    const px = X(t); c.fillStyle = P.accent; c.fillRect(px - 1, 940, 2, 86);
  }
  /* Archive B-roll: a sepia photograph of the plain square, pushed in (Ken Burns). */
  function ivBroll(c, t, W, H) {
    c.fillStyle = '#0d0e11'; c.fillRect(0, 0, W, H);
    const u = seg(t, 4.2, 5.8), k = lerp(1.0, 1.14, u);
    c.save(); c.translate(1060 - 40 * u, 470 + 10 * u); c.scale(k, k); c.rotate(-0.03);
    c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 40; c.fillStyle = '#efe6d2'; c.fillRect(-440, -300, 880, 600); c.shadowColor = 'transparent';
    const g = c.createRadialGradient(0, -40, 40, 0, 0, 520); g.addColorStop(0, '#c9ae82'); g.addColorStop(1, '#7d6446');
    c.fillStyle = g; c.fillRect(-410, -270, 820, 480);
    c.fillStyle = '#6a5238'; c.fillRect(-410, 90, 820, 120);           // table
    c.fillStyle = '#8c7252'; c.fillRect(-120, 60, 240, 34);            // plinth
    c.fillStyle = '#3e2f20'; c.fillRect(-90, -120, 180, 180);         // the square, before the corners
    c.fillStyle = 'rgba(255,240,210,0.12)'; c.fillRect(-90, -120, 60, 180);
    // dust & scratches, re-dealt 12× a second
    const r = rng(1 + Math.floor(t * 12));
    for (let i = 0; i < 18; i++) { c.fillStyle = `rgba(40,30,20,${0.2 + r() * 0.3})`; c.fillRect(-410 + r() * 820, -270 + r() * 480, 2 + r() * 3, 2 + r() * 3); }
    c.fillStyle = 'rgba(255,250,230,0.25)'; c.fillRect(-410 + r() * 820, -270, 1.5, 480);
    text(c, 'FIG. 1 — THE SQUARE, BEFORE THE CORNERS', 0, 262, { font: TK.MONO, size: 16, ls: 2, color: '#5a4a36', align: 'center' });
    c.restore();
    // V1 monitor: what the B-roll hides
    const mx = 90, my = 560, mw = 400, mh = 225, on = seg(t, 4.35, 4.6);
    if (on > 0.01) {
      c.save(); c.globalAlpha = on;
      label(c, 'V1 UNDERNEATH · WHAT THE B-ROLL HIDES', mx, my - 14, { size: 12, color: CREAM, weight: 700 });
      c.save(); c.beginPath(); c.rect(mx, my, mw, mh); c.clip(); c.translate(mx, my); c.scale(mw / W, mh / H);
      ivSet(c, t, W, H, ivClose(t), talk(t, IV_SYL)); c.restore();
      const jf = 1 - seg(t, IV_JUMP, IV_JUMP + 0.6);
      c.strokeStyle = t >= IV_JUMP && jf > 0 ? '#ff3b30' : 'rgba(236,232,223,0.4)'; c.lineWidth = t >= IV_JUMP && jf > 0 ? 4 : 1.5; c.strokeRect(mx, my, mw, mh);
      if (t >= IV_JUMP) {
        c.fillStyle = `rgba(255,59,48,${0.85 * Math.max(jf, 0.35)})`; rrect(c, mx + 12, my + 12, 214, 30, 4); c.fill();
        label(c, 'JUMP CUT · TAKE 1 → 3', mx + 22, my + 32, { size: 12, ls: 1.5, color: '#fff', weight: 700 });
      }
      label(c, 'SUBJECT JUMPS IN FRAME — COVERED', mx, my + mh + 22, { size: 12, color: CREAM2 });
      c.restore();
    }
  }
  function ivQuote(c, t, W, H) {
    c.fillStyle = '#111216'; c.fillRect(0, 0, W, H);
    const gl = c.createRadialGradient(1460, 520, 30, 1460, 520, 620); gl.addColorStop(0, 'rgba(255,160,90,0.18)'); gl.addColorStop(1, 'rgba(255,160,90,0)');
    c.fillStyle = gl; c.fillRect(800, 0, 1120, H);
    const env = talk(t, IV_SYL), sl = E.outC(seg(t, 7.6, 8.1));
    TK.token(c, lerp(1560, 1480, sl), 500 - 3 * env, 340 * (1 + 0.01 * env), { alpha: sl });
    text(c, '“', 150, 400, { font: TK.FONT, weight: 900, size: 260, color: P.accent });
    let wi = 0;
    IV_LINES.forEach(([a, b], li) => {
      let x = 200; const y = 440 + li * 108;
      for (let i = a; i < b; i++, wi++) {
        const [wd, wt] = IV_Q[i], on = seg(t, wt - 0.05, wt + 0.12);
        text(c, wd, x, y, { font: TK.FONT, weight: 800, size: 92, color: on > 0.5 && i === 8 ? P.accent : CREAM, ls: 1 });
        if (on < 1) { c.save(); c.globalAlpha = 1 - on; c.fillStyle = '#111216'; c.fillRect(x - 2, y - 88, measure(c, wd, 92, 800, 1) + 6, 112); c.globalAlpha = 0.18 * (1 - on); text(c, wd, x, y, { font: TK.FONT, weight: 800, size: 92, color: CREAM, ls: 1 }); c.restore(); }
        x += measure(c, wd + ' ', 92, 800, 1);
      }
    });
    sub(c, '— THE TOKEN, IN INTERVIEW', 204, 760, seg(t, 8.2, 8.5), { size: 18, color: CREAM2, ls: 4 });
    note(c, 'PULL QUOTE · THE KEY LINE SET AS TYPE, WORD BY WORD AS IT IS SPOKEN', 80, 118, seg(t, 7.7, 7.95), { color: CREAM });
    note(c, 'SAME AUDIO · PICTURE BECOMES TYPOGRAPHY', 80, 146, seg(t, 7.9, 8.15), { color: CREAM2 });
  }
  MG.film({
    id: 'formatinterview', dur: 10, poster: 3.1,
    fonts: FONTS,
    meta: {
      family: 'M', name: 'Talking-head Interview', sub: 'Thirds, eyeline, two cameras, super, B-roll', era: '1960s —',
      origin: 'Documentary interviews on camera became common once sync-sound 16 mm rigs arrived around 1960, and their grammar settled over the next decades: the subject off-centre on the thirds with lead room, looking at an interviewer sitting just beside the lens rather than into it, a name super on first appearance, and B-roll laid over the edits in the answer. Errol Morris inverted the eyeline with the Interrotron for The Thin Blue Line (1988) and Fast, Cheap & Out of Control (1997), so his subjects look straight down the lens; a second camera for a wide and a close on the same answer became routine in the 2000s, and Ken Burns’ The Civil War (1990) made the slow push into archive stills a byword.',
      works: 'The Civil War (Ken Burns, PBS, 1990) · The Thin Blue Line (Errol Morris, 1988) · The Last Dance (ESPN / Netflix, 2020)',
      tech: ['Subject on the third, lead room, eyeline just off-lens', 'Two cameras: wide ↔ close on the same answer', 'Lower-third super; B-roll laid over the edits'],
      accent: '#ff5a1f',
      motionDNA: 'Locked-off shots that cut only on pauses in the voice: A-cam wide for 1.8 s, B-cam close with the lower third wiping on at 2.1 s and holding 1.9 s, a B-roll cutaway at 4.2 s with a slow Ken Burns push while the answer continues — a jump cut at 5.0 s hidden underneath — back to the wide at 5.8 s, then a pull quote whose words light up as they are spoken from 7.8 s. The Token barely moves: small pulses on the syllables.',
      visualDNA: 'A dim, warm interview set — bookshelf, practical lamp, string lights as bokeh, a stool — with the orange Token on the left third. Dashed thirds, an orange eyeline running out of frame right, a lead-room bracket; a dark plan view of subject, interviewer and the two camera cones with a red tally; an NLE-style edit with V2, V1 and an unbroken A1 waveform. Sepia archive photo for the B-roll; cream Archivo pull quote with an orange opening quote mark.',
      transitions: 'Straight cuts on pauses between camera angles; cut to B-roll and back; cut to the pull-quote card',
      implementation: ['Two cameras rolling on the same take, synced by timecode', 'Edit in an NLE: B-roll on V2 over cuts in the A1 dialogue', 'Canvas 2D: one set drawn through two virtual cameras with parallax'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const env = talk(t, IV_SYL);
      let live = null;
      if (t < 1.8 || (t >= 5.8 && t < 7.6)) {
        live = 'A';
        ivSet(c, t, W, H, IV_WIDE, env);
        const a1 = t < 1.8 ? seg(t, 0.25, 0.6) : seg(t, 6.0, 6.35);
        ivThirds(c, W, H, a1);
        ivEyeline(c, t, W, IV_WIDE, a1, 770);
        if (t < 1.8) {
          note(c, 'A-CAM · WIDE · ESTABLISHES THE ROOM', 80, 118, seg(t, 0.1, 0.35), { color: CREAM });
          note(c, 'SUBJECT ON THE LEFT THIRD', 652, 340, seg(t, 0.5, 0.8), { color: CREAM });
        } else {
          note(c, 'BACK TO A-CAM · CUT ON A PAUSE IN THE ANSWER', 80, 118, seg(t, 5.85, 6.1), { color: CREAM });
          note(c, 'WIDE ↔ CLOSE · SAME TAKE, TWO ANGLES', 80, 146, seg(t, 6.1, 6.35), { color: CREAM2 });
        }
      } else if (t < 4.2) {
        live = 'B';
        const cam = ivClose(t);
        ivSet(c, t, W, H, cam, env);
        ivThirds(c, W, H, seg(t, 1.9, 2.2) * 0.8);
        ivEyeline(c, t, W, cam, seg(t, 2.0, 2.3), 800);
        note(c, 'B-CAM · CLOSE · SAME ANSWER, SECOND ANGLE', 80, 118, seg(t, 1.85, 2.05), { color: CREAM });
        // lower third
        const lt = seg(t, 2.1, 2.45), lo = 1 - seg(t, 3.85, 4.05);
        if (lt > 0 && lo > 0) {
          c.save(); c.globalAlpha = lo;
          c.fillStyle = P.accent; c.fillRect(150, 744, 8, 84 * E.outC(lt));
          c.save(); c.beginPath(); c.rect(166, 730, 640 * E.outC(seg(t, 2.2, 2.6)), 110); c.clip();
          c.fillStyle = 'rgba(10,11,14,0.55)'; c.fillRect(166, 744, 420, 84);
          text(c, 'THE TOKEN', 184, 790, { font: TK.FONT, weight: 800, size: 40, ls: 4, color: CREAM });
          label(c, 'SHAPE · SUBJECT OF THIS FILM', 186, 816, { size: 15, color: CREAM2, ls: 2 });
          c.restore(); c.restore();
          note(c, 'LOWER THIRD · NAME SUPER ON FIRST APPEARANCE · TITLE-SAFE', 150, 862, seg(t, 2.45, 2.7) * lo, { color: CREAM, size: 13 });
        }
      } else if (t < 5.8) {
        ivBroll(c, t, W, H);
        note(c, 'B-ROLL CUTAWAY · ARCHIVE PHOTO, KEN BURNS PUSH', 80, 118, seg(t, 4.25, 4.45), { color: CREAM });
        note(c, 'THE ANSWER CONTINUES UNDER IT', 80, 146, seg(t, 4.45, 4.65), { color: CREAM2 });
      } else {
        ivQuote(c, t, W, H);
      }
      const pa = live ? (t < 1.8 ? seg(t, 0.6, 0.9) : 1) : 0;
      ivPlan(c, t, live, pa * (t < 7.6 ? 1 : 0));
      ivEdit(c, t);
      FK.strip(c, t, W, H, IB, { dark: true, label: 'Interview · edit' });
      FK.caption(c, t, W, H, { name: 'Talking-head Interview', cat: 'Film & TV', dark: true });
    },
    score(A) {
      // room tone under the interview, cut with the picture
      A.noise(0, { type: 'lowpass', f: 380, dur: 7.6, g: 0.02, a: 0.2, hold: true, rel: 0.05 });
      // documentary piano: sparse, D major-ish, chords on the cuts
      const CH = [[0, [50, 57, 61, 66]], [1.8, [47, 54, 59, 62]], [4.2, [43, 50, 55, 59]], [5.8, [45, 52, 57, 61]]];
      CH.forEach(([t, n]) => {
        A.chord(t, n, { type: 'triangle', dur: 2.2, g: 0.018, a: 0.4, lp: 900, rev: 0.6, width: 0.6 });
        n.forEach((m, i) => A.pluck(t + 0.05 + i * 0.32, midi(m + 12), { g: 0.06, bright: 0.3, dur: 1.4, rev: 0.6, pan: (i - 1.5) * 0.2 }));
      });
      // the B-roll: a swell and the crackle of an archive still
      A.chord(4.2, [62, 66, 69, 74], { type: 'sine', dur: 1.6, g: 0.02, a: 0.5, rev: 0.7, width: 0.8 });
      for (let k = 0; k < 26; k++) { const t = 4.2 + hash(k * 3.3) * 1.6; A.noise(t, { type: 'highpass', f: 3000, dur: 0.008, g: 0.03 }); }
      A.osc(IV_JUMP, { f: 1800, dur: 0.02, g: 0.02 });                    // the splice, barely there
      // the voice: one unbroken answer, then the quote
      voice(A, IV_SYL, { f: 150, g: 0.05, seed: 3 });
      // pull quote: a held chord, a note on each line ending
      A.chord(7.6, [50, 57, 62, 66, 69], { type: 'triangle', dur: 2.4, g: 0.022, a: 0.3, lp: 1600, rev: 0.7, width: 0.8 });
      A.bell(8.2, midi(78), { g: 0.05, dur: 1.4, rev: 0.6 });
      A.bell(9.32, midi(81), { g: 0.07, dur: 1.6, rev: 0.7 });
      A.pluck(9.32, midi(62), { g: 0.12, bright: 0.4, dur: 1.2, rev: 0.6 });
    },
  });

  /* =====================================================================
     TESTIMONIAL AD — the customer's story in their own words. It opens on
     the strongest line, then the customer (the Token, on a sofa at home)
     speaks in burned-in captions under a REAL CUSTOMER super: the problem
     (their stiff work, before), the moment it changed (a friend's message,
     the app on a phone), the result (a number they measured). One voice
     becomes many — a wall of reviews and a star rating — and only then
     does the brand speak: product, CTA, the results-not-typical small
     print. A VOICE switch top right marks who is talking.
     ===================================================================== */
  const TB = [
    { t0: 0, t1: 1.2, name: 'Hook line', kind: 'hook' },
    { t0: 1.2, t1: 3.4, name: 'The problem', kind: 'act' },
    { t0: 3.4, t1: 5.2, name: 'The moment', kind: 'turn' },
    { t0: 5.2, t1: 7.2, name: 'The result', kind: 'act' },
    { t0: 7.2, t1: 8.6, name: 'Social proof', kind: 'act' },
    { t0: 8.6, t1: 10, name: 'Product · CTA', kind: 'cta' },
  ];
  const TS_LINES = [
    [1.35, 3.3, 'My animations felt stiff.', 'Clients scrolled right past.'],
    [3.5, 5.1, 'Then a friend sent me', 'a link to MOTION.'],
    [5.3, 7.1, 'Now I get three times', 'the replies.*'],
  ];
  const TS_SYL = sylls([[0.15, 1.0], [1.4, 3.15], [3.55, 4.95], [5.35, 6.9]], 23);
  const TS_BRAND = sylls([[8.85, 9.6]], 41);
  const TS_REV = [
    ['“Now every project moves.”', 'TOKEN · DESIGNER', P.accent, 5],
    ['“Easing that finally feels right.”', 'J.R. · ANIMATOR', P.blue, 5],
    ['“Cut my keyframing in half.”', 'M.K. · EDITOR', '#17181c', 5],
    ['“My clients noticed first.”', 'A.S. · STUDIO LEAD', '#c63e0c', 4],
    ['“Learned it in one evening.”', 'D.P. · STUDENT', '#8f8a80', 5],
    ['“The bounce is addictive.”', 'L.O. · ILLUSTRATOR', '#3f8f6b', 5],
  ];
  function tsRoom(c, t, W, H, env) {
    c.fillStyle = P.ground; c.fillRect(0, 0, W, H);
    // window and its light
    c.fillStyle = '#f8f5ee'; c.fillRect(1430, 160, 340, 360);
    c.strokeStyle = '#cfc8ba'; c.lineWidth = 10; c.strokeRect(1430, 160, 340, 360);
    c.lineWidth = 6; c.beginPath(); c.moveTo(1600, 160); c.lineTo(1600, 520); c.moveTo(1430, 340); c.lineTo(1770, 340); c.stroke();
    c.fillStyle = 'rgba(255,236,200,0.35)'; c.beginPath(); c.moveTo(1430, 520); c.lineTo(1770, 520); c.lineTo(1600, 900); c.lineTo(1180, 900); c.closePath(); c.fill();
    // floor
    c.fillStyle = P.ground2; c.fillRect(0, 700, W, H - 700);
    // sofa
    c.fillStyle = '#c3b8a5'; rrect(c, 1000, 480, 760, 170, 26); c.fill();
    c.fillStyle = '#b5a993'; rrect(c, 970, 600, 820, 110, 22); c.fill();
    c.fillStyle = '#ab9f88'; rrect(c, 950, 520, 70, 200, 20); c.fill(); rrect(c, 1740, 520, 70, 200, 20); c.fill();
    c.fillStyle = 'rgba(23,24,28,0.12)'; c.fillRect(990, 708, 780, 10);
    // cushion
    c.fillStyle = '#2f5bff'; c.globalAlpha = 0.55; rrect(c, 1560, 520, 130, 110, 22); c.fill(); c.globalAlpha = 1;
    // the customer
    TK.shadow(c, 1320, 606, 240, 0);
    TK.token(c, 1320, 486 - 4 * env, 240 * (1 + 0.012 * env), { rot: 0.02 * Math.sin(t * 1.3) });
  }
  function tsCaption(c, t) {   // burned-in captions: the customer's own words
    TS_LINES.forEach(([a, b, l1, l2]) => {
      const on = win(t, a, b, 0.15); if (on <= 0.01) return;
      c.save(); c.globalAlpha = on;
      [l1, l2].forEach((s, i) => {
        const w = measure(c, s, 42, 800, 0.5), y = 790 + i * 58;
        c.fillStyle = 'rgba(23,24,28,0.88)'; rrect(c, 960 - w / 2 - 18, y - 42, w + 36, 54, 8); c.fill();
        text(c, s, 960, y, { font: TK.FONT, weight: 800, size: 42, color: CREAM, align: 'center', ls: 0.5 });
      });
      c.restore();
    });
  }
  function tsVoiceSwitch(c, t, dark) {
    const brand = t >= 8.6, x = 1848, y = 112, ink = P.ink;
    label(c, 'VOICE', x - 300, y, { size: 12, color: P.mute });
    [['CUSTOMER', !brand], ['BRAND', brand]].forEach(([n, on], i) => {
      const bx = x - 228 + i * 140;
      c.beginPath(); c.arc(bx, y - 5, 7, 0, TAU);
      if (on) { c.fillStyle = P.accent; c.fill(); } else { c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 1.5; c.stroke(); }
      label(c, n, bx + 14, y, { size: 12, color: on ? ink : P.mute, weight: on ? 700 : 400 });
    });
  }
  function tsProblem(c, t, a) {
    if (a <= 0.01) return;
    c.save(); c.globalAlpha = a;
    c.fillStyle = '#fff'; rrect(c, 130, 190, 660, 380, 16); c.fill();
    c.strokeStyle = 'rgba(23,24,28,0.1)'; c.lineWidth = 1.5; c.stroke();
    label(c, 'THEIR WORK, BEFORE', 160, 230, { size: 13, color: P.mute, weight: 700 });
    // a stiff, stepped, linear move — the problem as the customer describes it
    const st = Math.floor((t - 1.2) * 5) / 5, p = (st % 1.6) / 1.6, x = lerp(200, 640, p);
    c.fillStyle = 'rgba(23,24,28,0.12)'; c.fillRect(190, 470, 450, 2);
    for (let k = 1; k <= 3; k++) { c.fillStyle = `rgba(143,138,128,${0.12 / k})`; c.fillRect(x - k * 55 - 50, 370, 100, 100); }
    c.fillStyle = '#9a958c'; c.fillRect(x - 50, 370, 100, 100);
    label(c, 'LINEAR · 5 FPS · NO EASE', 160, 530, { size: 13, color: P.mute });
    // their feed: nobody stops
    for (let i = 0; i < 3; i++) { const yy = 260 + ((i * 70 + (t - 1.2) * 160) % 210); c.fillStyle = 'rgba(23,24,28,0.07)'; rrect(c, 660, yy, 100, 54, 8); c.fill(); }
    label(c, 'SCROLL', 710, 550, { size: 11, color: P.mute, align: 'center' });
    c.restore();
    note(c, 'THE PROBLEM · IN THEIR WORDS, SHOWN ON THEIR WORK', 130, 620, a);
  }
  function tsMoment(c, t, a) {
    if (a <= 0.01) return;
    c.save(); c.globalAlpha = a;
    const [x, y, w, h, r] = FK.phone(c, 420, 400, 400);
    c.save(); rrect(c, x, y, w, h, r); c.clip();
    c.fillStyle = P.ground; c.fillRect(x, y, w, h);
    TK.word(c, x + w / 2, y + 60, { size: 30, ls: 2 });
    const p = ((t - 3.6) % 1.2 + 1.2) % 1.2 / 1.2, hop = Math.sin(PI * clamp(p / 0.6)) * 90 * (p < 0.6 ? 1 : 0), sq = p > 0.6 ? 0.18 * Math.exp(-(p - 0.6) * 18) : 0;
    c.fillStyle = 'rgba(23,24,28,0.15)'; c.fillRect(x + 30, y + 300, w - 60, 2);
    TK.token(c, x + w / 2, y + 300 - 40 * (1 - sq) - hop, 80, { sx: 1 + sq, sy: 1 - sq });
    label(c, 'EASE · OUT BACK', x + w / 2, y + h - 24, { size: 11, align: 'center', color: P.mute });
    c.restore();
    // the friend's message
    const m = E.outB(seg(t, 3.55, 3.85));
    if (m > 0) {
      c.save(); c.translate(560, 250); c.scale(m, m);
      c.fillStyle = P.blue; rrect(c, 0, -34, 280, 68, 22); c.fill();
      c.beginPath(); c.moveTo(10, 20); c.lineTo(-14, 40); c.lineTo(34, 30); c.closePath(); c.fill();
      text(c, 'you need this →', 24, 9, { font: TK.FONT, weight: 800, size: 28, color: '#fff' });
      c.restore();
      label(c, 'A FRIEND · 3:12 PM', 574, 316, { size: 11, color: P.mute });
    }
    c.restore();
    note(c, 'THE MOMENT IT CHANGED · THE PRODUCT ENTERS THEIR STORY', 130, 670, a);
  }
  function tsResult(c, t, a) {
    if (a <= 0.01) return;
    c.save(); c.globalAlpha = a;
    const v = lerp(1, 3, E.outC(seg(t, 5.3, 6.1)));
    text(c, v.toFixed(1) + '×', 130, 400, { font: TK.FONT, weight: 900, size: 220, color: P.accent });
    text(c, 'more client replies*', 138, 470, { font: TK.FONT, weight: 800, size: 44, color: P.ink });
    const bars = [['BEFORE', 4, '#9a958c'], ['AFTER', 12, P.accent]];
    bars.forEach(([n, val, col], i) => {
      const y = 520 + i * 44, g = i ? E.outC(seg(t, 5.5, 6.1)) : 1;
      label(c, n, 138, y + 17, { size: 13, color: P.mute });
      c.fillStyle = col; c.fillRect(240, y, 38 * val * g, 24);
      label(c, `${Math.round(val * g)} / WEEK`, 252 + 38 * val * g, y + 17, { size: 13, color: P.ink, weight: 700 });
    });
    c.restore();
    note(c, 'THE RESULT · ONE SPECIFIC NUMBER THEY MEASURED', 130, 650, a);
    sub(c, '* SEE THE SMALL PRINT', 142, 678, a, { size: 12 });
  }
  function tsProof(c, t, W, H) {
    c.fillStyle = P.ground; c.fillRect(0, 0, W, H);
    const hd = seg(t, 7.2, 7.45);
    c.save(); c.globalAlpha = hd;
    for (let k = 0; k < 5; k++) { const on = seg(t, 7.25 + k * 0.08, 7.33 + k * 0.08); star(c, 702 + k * 50, 186, 20 * (0.6 + 0.4 * E.outB(on)), on > 0 ? (k < 4 || on >= 1 ? P.accent : P.accentL) : null, 'rgba(23,24,28,0.3)'); }
    text(c, '4.8 / 5', 980, 200, { font: TK.FONT, weight: 900, size: 46, color: P.ink });
    label(c, 'FROM 2,140 REVIEWS', 1136, 198, { size: 15, color: P.mute, weight: 700 });
    c.restore();
    TS_REV.forEach(([q, n, col, st], i) => {
      const cx = 150 + (i % 3) * 550, cy = 250 + Math.floor(i / 3) * 220, on = E.outB(seg(t, 7.3 + i * 0.12, 7.6 + i * 0.12));
      if (on <= 0.01) return;
      c.save(); c.translate(cx + 260, cy + 95); c.scale(0.85 + 0.15 * on, 0.85 + 0.15 * on); c.translate(-cx - 260, -cy - 95); c.globalAlpha = clamp(on);
      c.fillStyle = '#fff'; rrect(c, cx, cy, 520, 190, 14); c.fill();
      c.strokeStyle = i === 0 ? P.accent : 'rgba(23,24,28,0.1)'; c.lineWidth = i === 0 ? 3 : 1.5; c.stroke();
      TK.token(c, cx + 52, cy + 52, 52, { color: col });
      for (let k = 0; k < 5; k++) star(c, cx + 104 + k * 26, cy + 50, 10, k < st ? P.accent : null, k < st ? null : 'rgba(23,24,28,0.3)');
      if (i === 0) label(c, 'OUR CUSTOMER', cx + 500, cy + 54, { size: 11, color: P.accent, weight: 700, align: 'right' });
      text(c, q, cx + 30, cy + 122, { font: TK.FONT, weight: 800, size: 25, color: P.ink });
      label(c, n, cx + 30, cy + 162, { size: 12, color: P.mute });
      c.restore();
    });
    note(c, 'SOCIAL PROOF · ONE VOICE BECOMES MANY · AGGREGATE RATING', 150, 740, seg(t, 7.5, 7.75));
  }
  function tsEnd(c, t, W, H) {
    const tt = t - 8.6;
    c.fillStyle = P.ground; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(960, 400, 40, 960, 400, 900); g.addColorStop(0, '#fff7ee'); g.addColorStop(1, P.ground);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const inA = E.outB(seg(tt, 0, 0.35));
    TK.token(c, 540, 330, 150 * inA);
    TK.word(c, 1060, 330, { size: 140, ls: 8, alpha: seg(tt, 0.05, 0.3) });
    text(c, '“Now every project moves.”  — Token, designer', 960, 470, { font: TK.FONT, weight: 500, size: 30, color: P.ink, align: 'center', alpha: 1 });
    for (let k = 0; k < 5; k++) star(c, 850 + k * 34, 524, 13, P.accent);
    label(c, '4.8 · 2,140 REVIEWS', 1030, 530, { size: 14, color: P.mute, weight: 700 });
    const ca = seg(tt, 0.3, 0.55), pul = 1 + 0.04 * Math.max(0, Math.sin((tt - 0.55) * TAU * 1.5)) * seg(tt, 0.55, 0.7);
    if (ca > 0) {
      c.save(); c.globalAlpha = ca; c.translate(960, 640); c.scale(pul, pul);
      c.fillStyle = P.accent; rrect(c, -230, -42, 460, 84, 42); c.fill();
      text(c, 'TRY MOTION FREE  →', 0, 12, { font: TK.FONT, weight: 900, size: 32, ls: 3, color: P.ground, align: 'center' });
      c.restore();
    }
    const fp = seg(tt, 0.35, 0.6);
    label(c, '*Results not typical. Individual results vary. Reply rates self-reported over 8 weeks.', 960, 770, { align: 'center', size: 13, ls: 1, color: `rgba(143,138,128,${fp})` });
    label(c, 'Real customer; not paid for this testimonial. Free plan limits apply.', 960, 792, { align: 'center', size: 13, ls: 1, color: `rgba(143,138,128,${fp})` });
    c.save(); c.globalAlpha = seg(tt, 0.55, 0.8);
    c.strokeStyle = P.accent; c.lineWidth = 2; c.beginPath(); c.moveTo(960, 802); c.lineTo(960, 822); c.stroke();
    c.restore();
    note(c, 'FINE PRINT · RESULTS-NOT-TYPICAL DISCLAIMER', 790, 848, seg(tt, 0.55, 0.8), { size: 13 });
    note(c, 'NOW THE BRAND SPEAKS · PRODUCT + CTA', 80, 118, seg(tt, 0.1, 0.35));
  }
  MG.film({
    id: 'formattestimonial', dur: 10, poster: 6.4,
    fonts: FONTS,
    meta: {
      family: 'M', name: 'Testimonial Ad', sub: 'A real customer’s story, then the proof', era: '1890s — · on TV 1950s —',
      origin: 'Testimonials are as old as advertising — Victorian patent-medicine ads ran letters from grateful users, and in the 1920s J. Walter Thompson’s Pond’s campaign paid society women to endorse cold cream. Television made the ‘real people, not actors’ spot a genre: hidden-camera taste tests such as Folgers’ ‘we secretly replaced…’ (from the late 1970s) let ordinary customers tell it in their own words. The rules came with it: the US FTC’s Endorsement Guides (1980; revised 2009, 2023) require that a customer’s results be typical or that what is typical be disclosed, and that paid endorsements be labelled — hence the small print.',
      works: 'Pond’s cold cream endorsements (J. Walter Thompson, 1920s) · Folgers ‘secretly replaced’ campaign (from 1970s) · Dove ‘Real Beauty’ (Ogilvy & Mather, 2004 —)',
      tech: ['The customer’s voice: problem → moment → result', 'REAL CUSTOMER super, burned-in captions', 'Social proof, then CTA and the disclaimer'],
      accent: '#ff5a1f',
      motionDNA: 'Opens cold on the strongest line held 1.2 s; then three captioned answers of about two seconds each — problem, the moment, the result with a count-up to 3× — while the customer sits still and only pulses as they speak; at 7.2 s a hard cut to a review wall where six cards pop in 0.12 s apart and five stars fill; at 8.6 s the voice switches to the brand: lockup, a pulsing CTA pill and the fine print.',
      visualDNA: 'The paper stage dressed as a living room — window light, a sofa, a blue cushion — with the orange Token as the customer on the right; ink-plated, centred burned-in captions; an ink REAL CUSTOMER pill; left-hand cards for the before work (a grey, stepped square), a phone with the app and a friend’s blue message, and a huge orange 3.0×. White review cards with coloured Tokens and orange stars; a VOICE switch, mono annotations and grey small print.',
      transitions: 'Hard cuts between the hook card, the interview, the review wall and the end card; cross-fades between the left-hand cards',
      implementation: ['Customer interview filmed unscripted, cut down to problem / moment / result', 'Burned-in captions for sound-off feeds; claims checked against the FTC guides', 'Canvas 2D: one room set, caption plates measured per line, staggered card pops'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const env = talk(t, TS_SYL);
      if (t < 1.2) {
        c.fillStyle = P.ground; c.fillRect(0, 0, W, H);
        const a = E.outC(seg(t, 0.05, 0.35)), k = 1 + 0.03 * t;
        c.save(); c.translate(960, 470); c.scale(k, k); c.globalAlpha = a;
        text(c, '“I almost gave up', 0, -40, { font: TK.FONT, weight: 900, size: 104, color: P.ink, align: 'center' });
        text(c, 'on animation.”', 0, 80, { font: TK.FONT, weight: 900, size: 104, color: P.ink, align: 'center' });
        c.restore();
        sub(c, '— TOKEN, REAL CUSTOMER', 960, 640, seg(t, 0.3, 0.55), { size: 18, align: 'center', color: P.mute, ls: 4 });
        note(c, 'HOOK · OPEN ON THE CUSTOMER’S STRONGEST LINE', 80, 118, seg(t, 0.15, 0.4));
      } else if (t < 7.2) {
        tsRoom(c, t, W, H, env);
        tsProblem(c, t, win(t, 1.3, 3.4, 0.2));
        tsMoment(c, t, win(t, 3.4, 5.2, 0.2));
        tsResult(c, t, Math.min(seg(t, 5.2, 5.4), 1));
        tsCaption(c, t);
        // REAL CUSTOMER super + name
        const rc = seg(t, 1.3, 1.5);
        c.save(); c.globalAlpha = rc;
        const pw = measure(c, 'REAL CUSTOMER', 15, 700, 3, TK.MONO) + 40;
        c.fillStyle = P.ink; rrect(c, 80, 96, pw, 36, 18); c.fill();
        label(c, 'REAL CUSTOMER', 100, 120, { size: 15, color: CREAM, weight: 700, ls: 3 });
        c.restore();
        note(c, 'AUTHENTICITY SUPER · NOT AN ACTOR', 100 + pw, 120, seg(t, 1.5, 1.7) * (1 - seg(t, 3.2, 3.4)));
        const nm = win(t, 1.6, 3.4, 0.25);
        if (nm > 0.01) {
          c.save(); c.globalAlpha = nm;
          c.fillStyle = P.accent; c.fillRect(1180, 640, 6, 44);
          text(c, 'TOKEN', 1198, 668, { font: TK.FONT, weight: 800, size: 30, color: P.ink, ls: 3 });
          label(c, 'FREELANCE DESIGNER · CUSTOMER SINCE 2024', 1200, 690, { size: 12, color: P.ink });
          c.restore();
        }
        { const s = 'THEIR WORDS, NOT THE BRAND’S · BURNED-IN CAPTIONS', w = measure(c, s, 13, 700, 2.5, TK.MONO) + 12; note(c, s, 960 - w / 2, 735, win(t, 1.6, 3.3, 0.2), { size: 13 }); }
      } else if (t < 8.6) {
        tsProof(c, t, W, H);
      } else {
        tsEnd(c, t, W, H);
      }
      tsVoiceSwitch(c, t);
      FK.strip(c, t, W, H, TB, { label: 'Testimonial · customer voice' });
      FK.caption(c, t, W, H, { name: 'Testimonial Ad', cat: 'Advertising' });
    },
    score(A) {
      // hook: a single held note under the line
      A.osc(0, { type: 'triangle', f: midi(57), dur: 1.2, g: 0.04, a: 0.1, rev: 0.6 });
      // the problem: a quiet guitar arpeggio in A minor
      const arp = (t0, t1, notes, g) => { for (let k = 0, t = t0; t < t1; k++, t += 0.25) A.pluck(t, midi(notes[k % notes.length]), { g, bright: 0.45, dur: 0.9, rev: 0.4, pan: (k % 2 ? 0.2 : -0.2) }); };
      arp(1.2, 3.4, [45, 52, 57, 60, 64, 60, 57, 52], 0.07);
      // the moment: the music opens up to C major
      A.chord(3.4, [48, 55, 60, 64, 67, 74], { type: 'triangle', dur: 1.9, g: 0.025, a: 0.25, lp: 2400, rev: 0.6, width: 0.8 });
      A.bell(3.55, midi(79), { g: 0.06, dur: 1.2, rev: 0.6 });                          // the message arrives
      arp(3.4, 5.2, [48, 55, 60, 64, 67, 64, 60, 55], 0.08);
      // the result: groove under the count-up
      arp(5.2, 7.2, [41, 48, 53, 57, 60, 57, 53, 48, 43, 50, 55, 59, 62, 59, 55, 50], 0.085);
      for (let k = 0; k < 4; k++) { A.kick(5.2 + k * 0.5, 0.22, { f: 110, f2: 45 }); A.hat(5.45 + k * 0.5, 0.03); }
      for (let k = 0; k < 9; k++) A.osc(5.3 + k * 0.09, { f: midi(72 + k), dur: 0.05, g: 0.025 });
      // social proof: the cards and the stars
      for (let k = 0; k < 5; k++) A.bell(7.25 + k * 0.08, midi([76, 79, 81, 84, 88][k]), { g: 0.04, dur: 0.5, rev: 0.4 });
      TS_REV.forEach((r, i) => A.osc(7.3 + i * 0.12, { f: 600 + i * 60, f2: 900 + i * 60, glide: 0.06, dur: 0.08, g: 0.03 }));
      A.chord(7.2, [53, 57, 60, 65], { type: 'triangle', dur: 1.4, g: 0.025, a: 0.05, lp: 2400, rev: 0.5, width: 0.7 });
      // the brand: resolved chord, a second voice, the CTA click
      A.chord(8.6, [48, 55, 60, 64, 67, 72], { type: 'triangle', dur: 1.4, g: 0.03, a: 0.02, lp: 2600, rev: 0.6, width: 0.8 });
      A.kick(8.6, 0.3, { f: 110, f2: 40 });
      A.osc(9.15, { f: 900, dur: 0.03, g: 0.05 });
      // the voices: the customer, then the brand (lower, closer)
      voice(A, TS_SYL, { f: 195, g: 0.045, seed: 5, lp: 1300 });
      voice(A, TS_BRAND, { f: 108, g: 0.05, seed: 9, lp: 900 });
    },
  });

  /* =====================================================================
     UNBOXING — overhead, locked-off on a desk. A sealed shipping box drops
     in; simple-shape hands cut the tape, fold out the flaps, lift the lid
     of the inner box — each action shorter than the last — then the film
     slows right down for the sticker and the two sheets of tissue: the
     longest single action, with the music pulled out. Reveal: the Token
     in black foam, a shine, a push-in. The contents are laid out knolling
     style — square to the frame, even 60 px gaps, guides shown — and a
     first-impression verdict card lands. The caption graph is the pace.
     ===================================================================== */
  const UB = [
    { t0: 0, t1: 1.4, name: 'The box', kind: 'hook' },
    { t0: 1.4, t1: 3.85, name: 'The open', kind: 'act' },
    { t0: 3.85, t1: 5.45, name: 'Tissue · hold', kind: 'break' },
    { t0: 5.45, t1: 6.4, name: 'Reveal', kind: 'turn' },
    { t0: 6.4, t1: 8.7, name: 'Contents', kind: 'act' },
    { t0: 8.7, t1: 10, name: 'Verdict', kind: 'cta' },
  ];
  const REVEAL = 5.45;
  const BX = 960, BY = 480, BW = 640, BH = 420;
  const KRAFT = '#c49a64', KRAFT_D = '#a87f4c', KRAFT_I = '#d8b789', SKIN = '#e7b48f', SLEEVE = '#34404f';
  const ubPace = t => kf(t, [[0, 0.45], [0.55, 0.8], [1.4, 0.55], [1.9, 0.85], [2.4, 0.8], [3.0, 0.9], [3.6, 0.8], [3.95, 0.45], [4.6, 0.2], [5.35, 0.1], [5.47, 1.2, E.outQ], [6.3, 0.7], [7.0, 0.75], [8.6, 0.6], [10, 0.35]]);
  const ACTS = [['TAPE', 1.5, 2.3], ['FLAPS', 2.45, 3.2], ['LID', 3.35, 3.85], ['TISSUE', 3.9, REVEAL]];
  // contents: [id, name, w, h, local x/y in the box, in-box scale, dest x/y]
  const ITEMS = [
    ['token', 'THE TOKEN', 240, 240, 0, 0, 0.875, 1110, 290],
    ['card', 'WORDMARK CARD', 520, 160, 0, -110, 0.5, 1550, 250],
    ['book', 'QUICK START', 240, 300, -150, 40, 0.5, 1110, 620],
    ['stick', 'STICKERS', 250, 200, 20, 70, 0.5, 1415, 570],
    ['ease', 'EASING CARD', 180, 240, 175, 40, 0.5, 1690, 590],
  ];
  const FLY = [6.75, 7.13, 7.51, 7.89, 8.27], FLYD = 0.36;   // L carries 0, 2, 4; R carries 1, 3
  const ubBox = t => { const u = E.ioC(seg(t, 6.4, 6.75)); return { x: lerp(BX, 500, u), y: lerp(BY, 380, u), s: lerp(1, 0.58, u) }; };
  const ubZoom = t => 1 + 0.1 * E.outC(seg(t, REVEAL, 6.0)) * (1 - E.ioC(seg(t, 6.2, 6.6)));
  function ubTable(c, W, H) {
    c.fillStyle = '#dcc7a6'; c.fillRect(-200, -200, W + 400, H + 400);
    c.strokeStyle = 'rgba(120,80,40,0.09)'; c.lineWidth = 2;
    for (let i = 0; i < 34; i++) {
      const y0 = -100 + i * 40 + hash(i) * 20; c.beginPath();
      for (let k = 0; k <= 24; k++) { const x = -200 + k * 100, y = y0 + vnoise(k * 0.4, i) * 10; k ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    }
  }
  function ubItem(c, id, x, y, k, o = {}) {
    const it = ITEMS.find(q => q[0] === id), w = it[2] * k, h = it[3] * k;
    c.save();
    if (id !== 'token') { const d = 6 + 26 * (o.lift || 0); c.fillStyle = `rgba(60,35,10,${0.18 + 0.08 * (o.lift || 0)})`; rrect(c, x - w / 2 + d, y - h / 2 + d + 2, w, h, 8 * k); c.fill(); }
    if (id === 'token') {
      c.fillStyle = 'rgba(60,35,10,0.2)'; c.save(); c.translate(x + 8 + 26 * (o.lift || 0), y + 10 + 26 * (o.lift || 0)); TK.tokenPath(c, w); c.fill('evenodd'); c.restore();
      TK.token(c, x, y, w, { rot: o.rot || 0, sx: o.sx, sy: o.sy });
    } else if (id === 'card') {
      c.fillStyle = '#fbf9f4'; rrect(c, x - w / 2, y - h / 2, w, h, 8 * k); c.fill();
      TK.word(c, x, y + 4 * k, { size: 92 * k, ls: 4 * k });
    } else if (id === 'book') {
      c.fillStyle = P.accent; rrect(c, x - w / 2, y - h / 2, w, h, 6 * k); c.fill();
      c.fillStyle = P.accentD; c.fillRect(x - w / 2, y - h / 2, 10 * k, h);
      TK.token(c, x, y - 40 * k, 80 * k, { color: P.ground });
      text(c, 'QUICK START', x + 4 * k, y + 50 * k, { font: TK.FONT, weight: 800, size: 24 * k, color: P.ground, align: 'center', ls: 2 * k });
      c.fillStyle = 'rgba(236,232,223,0.5)'; for (let i = 0; i < 3; i++) c.fillRect(x - 70 * k, y + (78 + i * 16) * k, (140 - i * 30) * k, 4 * k);
    } else if (id === 'stick') {
      c.fillStyle = '#fbf9f4'; rrect(c, x - w / 2, y - h / 2, w, h, 8 * k); c.fill();
      const cols = [P.accent, P.blue, P.ink, P.accentL, '#3f8f6b', P.accentD];
      for (let i = 0; i < 6; i++) TK.token(c, x + (-75 + (i % 3) * 75) * k, y + (-42 + Math.floor(i / 3) * 84) * k, 56 * k, { color: cols[i] });
    } else if (id === 'ease') {
      c.fillStyle = '#fbf9f4'; rrect(c, x - w / 2, y - h / 2, w, h, 8 * k); c.fill();
      c.strokeStyle = 'rgba(23,24,28,0.2)'; c.lineWidth = 1.5 * k; c.strokeRect(x - 66 * k, y - 90 * k, 132 * k, 132 * k);
      c.strokeStyle = P.accent; c.lineWidth = 4 * k; c.beginPath();
      for (let i = 0; i <= 30; i++) { const u = i / 30, px = x - 66 * k + u * 132 * k, py = y + 42 * k - E.outB(u) * 120 * k; i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.stroke();
      text(c, 'EASE OUT', x, y + 88 * k, { font: TK.MONO, weight: 700, size: 18 * k, color: P.ink, align: 'center', ls: 2 * k });
    }
    c.restore();
  }
  /* Where item i is at time t (and how far it is lifted), from in-box to its knolled spot. */
  function ubItemAt(i, t) {
    const it = ITEMS[i], b = ubBox(t), u = seg(t, FLY[i], FLY[i] + FLYD), q = E.ioC(u);
    const sx = b.x + it[4] * b.s, sy = b.y + it[5] * b.s, sk = it[6] * b.s;
    return { x: lerp(sx, it[7], q), y: lerp(sy, it[8], q) - 30 * sinc(u), k: lerp(sk, 1, q), lift: sinc(u), u };
  }
  /* A simple-shape hand seen from above: sleeve, palm, four fingers, thumb. Fingers point along ang. */
  function hand(c, x, y, ang, o = {}) {
    const side = o.side || 1;
    const shape = (col, sl) => {
      c.fillStyle = sl; c.fillRect(-1200, -46, 1140, 92);
      c.fillStyle = col; rrect(c, -86, -58, 128, 116, 44); c.fill();
      if (o.tool) o.tool(c);
      c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = 25;
      [[-39, 64], [-13, 76], [13, 72], [39, 58]].forEach(([fy, L]) => { c.beginPath(); c.moveTo(20, fy); c.lineTo(20 + L * (1 - 0.35 * (o.curl || 0)), fy * 1.04); c.stroke(); });
      c.lineWidth = 27; c.beginPath(); c.moveTo(-40, side * 48); c.lineTo(10, side * 82); c.stroke();
    };
    const tool = o.tool;
    c.save(); c.translate(x + 7, y + 11); c.rotate(ang); c.globalAlpha *= 0.13; o.tool = null; shape('#4a2e14', '#4a2e14'); o.tool = tool; c.restore();
    c.save(); c.translate(x, y); c.rotate(ang);
    shape(SKIN, SLEEVE);
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(-1200, -46, 1140, 14);
    c.restore();
  }
  const cutter = c => { c.fillStyle = P.accent; rrect(c, 30, -14, 170, 28, 8); c.fill(); c.fillStyle = '#c8ccd2'; c.beginPath(); c.moveTo(200, -10); c.lineTo(236, 0); c.lineTo(200, 10); c.closePath(); c.fill(); };
  /* Hand tracks — returns [{x, y, a, side, tool}] for the two hands at time t. */
  function ubHands(t) {
    const out = [], up = -PI / 2;
    const ent = (p, q, u) => [lerp(p[0], q[0], u), lerp(p[1], q[1], u), lerp(p[2], q[2], u)];
    const LR = [700, 1260, -1.3], RR = [1220, 1260, -1.84];          // off-frame rests
    const LB = [700, 820, -1.25], RB = [1220, 820, -1.89];            // resting at the box corners
    const cy = lerp(240, 720, E.ioS(seg(t, 1.5, 2.3)));
    // left hand
    let L = null;
    if (t < 1.3) L = ent(LR, LB, E.outC(seg(t, 0.7, 1.1)));
    else if (t < 2.35) L = ent(LB, [560, 480, 0], E.ioC(seg(t, 1.3, 1.5)));
    else if (t < 3.2) { const th = PI * E.ioC(seg(t, 2.45, 3.05)); L = ent([560, 480, 0], [lerp(800, 360, (1 - Math.cos(th)) / 2), 640, up], E.ioC(seg(t, 2.35, 2.5))); }
    else if (t < 3.95) { const lift = E.inQ(seg(t, 3.35, 3.85)); L = ent([360, 640, up], [590, 570, -0.55], E.ioC(seg(t, 3.2, 3.35))); if (t > 3.35) { L[0] += 900 * lift * 0.5; L[1] -= 700 * lift * 0.5; } if (t > 3.62) L = ent(L, LR, E.ioC(seg(t, 3.62, 3.95))); }
    else if (t < 4.95) { const th = PI * 0.92 * E.ioS(seg(t, 4.35, 4.95)), ex = BX - 270 + 280 * Math.cos(th); L = ent(LR, [ex + 33, BY + 167, up - 0.35], E.ioC(seg(t, 4.05, 4.35))); if (t > 4.35) L = [ex + 33, BY + 167, up - 0.35]; }
    else if (t < 5.6) L = ent([BX - 270 + 280 * Math.cos(PI * 0.92) + 33, BY + 167, up - 0.35], [1000, 1300, up - 0.35], E.inQ(seg(t, 4.95, 5.4)));
    // right hand
    let R = null;
    if (t < 1.3) R = ent(RR, RB, E.outC(seg(t, 0.75, 1.15)));
    else if (t < 2.35) { R = ent(RB, [BX + 6, 240 + 236, up], E.ioC(seg(t, 1.3, 1.5))); if (t >= 1.5) R = [BX + 6, cy + 236, up]; }
    else if (t < 3.2) { const th = PI * E.ioC(seg(t, 2.6, 3.2)); R = ent([BX + 6, 956, up], [lerp(1120, 1560, (1 - Math.cos(th)) / 2), 640, up], E.ioC(seg(t, 2.35, 2.55))); }
    else if (t < 3.95) { const lift = E.inQ(seg(t, 3.35, 3.85)); R = ent([1560, 640, up], [1330, 570, -PI + 0.55], E.ioC(seg(t, 3.2, 3.35))); if (t > 3.35) { R[0] += 900 * lift * 0.5; R[1] -= 700 * lift * 0.5; } if (t > 3.62) R = ent(R, RR, E.ioC(seg(t, 3.62, 3.95))); }
    else if (t < 4.5) { const pk = E.ioC(seg(t, 4.1, 4.35)); R = ent([1260, 1260, up], [BX + 8, BY + 128, up], E.ioC(seg(t, 3.9, 4.1))); if (t > 4.1) R = [BX + 8 + 130 * pk, BY + 128 + 80 * pk, up + 0.3 * pk]; if (t > 4.35) R = ent(R, RR, E.ioC(seg(t, 4.35, 4.6))); }
    else if (t < 5.6) { const th = PI * 0.92 * E.ioS(seg(t, 4.95, 5.45)), ex = BX + 270 - 280 * Math.cos(th); R = ent(RR, [ex + 10, BY + 175, up], E.ioC(seg(t, 4.7, 4.95))); if (t > 4.95) R = [ex + 10, BY + 175, up]; if (t > 5.42) R = ent(R, RR, E.inQ(seg(t, 5.42, 5.7))); }
    // contents: alternate hands carry the items
    const carry = (ids, rest) => {
      for (let j = 0; j < ids.length; j++) {
        const i = ids[j], a = FLY[i], it = ITEMS[i];
        const grip = tt => { const p = ubItemAt(i, tt); return [p.x, p.y + it[3] * p.k / 2 + 70, up]; };
        const prev = j ? (() => { const q = ITEMS[ids[j - 1]]; return [q[7], q[8] + q[3] / 2 + 70, up]; })() : rest;
        const pStart = j ? FLY[ids[j - 1]] + FLYD : a - 0.4;
        if (t >= pStart && t < a) return ent(prev, grip(a), E.ioC(seg(t, pStart, a - 0.05)));
        if (t >= a && t < a + FLYD) return grip(t);
      }
      const last = ITEMS[ids[ids.length - 1]], e = FLY[ids[ids.length - 1]] + FLYD;
      if (t >= e && t < e + 0.5) return ent([last[7], last[8] + last[3] / 2 + 70, up], rest, E.inQ(seg(t, e, e + 0.45)));
      return null;
    };
    if (t >= 6.3 && t < 9) { L = carry([0, 2, 4], [760, 1260, up]); R = carry([1, 3], [1500, 1260, up]); }
    if (L) out.push({ x: L[0], y: L[1], a: L[2], side: 1 });
    if (R) out.push({ x: R[0], y: R[1], a: R[2], side: -1, tool: t > 1.3 && t < 2.42 ? cutter : null });
    return out;
  }
  /* A panel that folds about pivot px (local x), covering w toward dir (+1 right) when closed;
     th 0 → π folds it over to the other side, outer face → inner face. */
  function fold(c, px, dir, w, y0, h, th, outer, inner, deco) {
    const cs = Math.cos(th), x1 = px + dir * w * cs;
    const a = Math.min(px, x1), b = Math.max(px, x1);
    if (b - a < 0.5) return;
    c.fillStyle = cs > 0 ? outer : inner; c.fillRect(a, y0, b - a, h);
    c.fillStyle = `rgba(40,20,0,${0.25 * (1 - Math.abs(cs))})`; c.fillRect(a, y0, b - a, h);
    if (cs > 0 && deco) { c.save(); c.beginPath(); c.rect(a, y0, b - a, h); c.clip(); c.translate(px, 0); c.scale(dir * cs, 1); deco(c); c.restore(); }
    c.fillStyle = 'rgba(40,20,0,0.25)'; c.fillRect(x1 - (dir * cs > 0 ? 2 : 0), y0, 2, h);
  }
  function ubBoxDraw(c, t, b) {
    c.save(); c.translate(b.x, b.y); c.scale(b.s, b.s);
    const drop = E.inQ(seg(t, 0.1, 0.55)), dz = t < 0.55 ? lerp(1.35, 1, drop) : 1 + 0.02 * sinc(seg(t, 0.55, 0.75));
    c.scale(dz, dz);
    const sh = t < 0.55 ? lerp(70, 14, drop) : 14;
    c.fillStyle = `rgba(60,35,10,${t < 0.55 ? 0.12 + 0.1 * drop : 0.22})`; c.fillRect(-BW / 2 + sh, -BH / 2 + sh, BW, BH);
    c.fillStyle = KRAFT_D; c.fillRect(-BW / 2, -BH / 2, BW, BH);
    const thL = PI * E.ioC(seg(t, 2.45, 3.05)), thR = PI * E.ioC(seg(t, 2.6, 3.2));
    // outer flaps (tape and print on the outside)
    const tapeCut = seg(t, 1.5, 2.3), cyL = lerp(-BH / 2 - 30, BH / 2 + 30, E.ioS(tapeCut));
    const decoL = c2 => {
      c2.fillStyle = '#d7c9a8'; c2.fillRect(BW / 2 - 36, -BH / 2, 36, BH);   // tape half
      c2.fillStyle = '#fbf9f4'; c2.fillRect(60, -150, 210, 130);
      c2.fillStyle = P.ink; for (let i = 0; i < 4; i++) c2.fillRect(80, -128 + i * 18, 140 - i * 22, 6);
      for (let i = 0; i < 26; i++) c2.fillRect(80 + i * 6, -50, hash(i * 3.1) > 0.5 ? 3 : 1.5, 22);
    };
    const decoR = c2 => {
      c2.fillStyle = '#d7c9a8'; c2.fillRect(BW / 2 - 36, -BH / 2, 36, BH);
      c2.save(); c2.translate(BW / 2 - 150, 90); c2.scale(-1, 1);
      c2.strokeStyle = '#b8322a'; c2.lineWidth = 4; c2.strokeRect(-105, -30, 210, 60);
      text(c2, 'FRAGILE', 2, 11, { font: TK.FONT, weight: 900, size: 30, color: '#b8322a', align: 'center', ls: 3 });
      c2.restore();
      c2.save(); c2.translate(BW / 2 - 150, -90); c2.scale(-1, 1); c2.fillStyle = P.ink;
      for (let k = -1; k <= 1; k += 2) { c2.beginPath(); c2.moveTo(k * 30, -36); c2.lineTo(k * 30 + 18, -12); c2.lineTo(k * 30 + 6, -12); c2.lineTo(k * 30 + 6, 30); c2.lineTo(k * 30 - 6, 30); c2.lineTo(k * 30 - 6, -12); c2.lineTo(k * 30 - 18, -12); c2.closePath(); c2.fill(); }
      c2.restore();
    };
    const openL = Math.cos(thL) < 0, openR = Math.cos(thR) < 0;   // flaps folded out lie under the contents
    if (openL) fold(c, -BW / 2, 1, BW / 2, -BH / 2, BH, thL, KRAFT, KRAFT_I, decoL);
    if (openR) fold(c, BW / 2, -1, BW / 2, -BH / 2, BH, thR, KRAFT, KRAFT_I, decoR);
    if (t > 2.45) {
      // inside: walls, the inner box
      c.fillStyle = '#8e6a3e'; c.fillRect(-BW / 2 + 12, -BH / 2 + 12, BW - 24, BH - 24);
      c.fillStyle = '#efe9de'; c.fillRect(-285, -175, 570, 350);
      c.fillStyle = '#26272c'; rrect(c, -265, -158, 530, 316, 8); c.fill();       // foam
      if (t > 6.8) {   // second layer under the foam tray
        c.fillStyle = '#e6dfd2'; c.fillRect(-265, -158, 530, 316);
        for (let i = 1; i < ITEMS.length; i++) if (t < FLY[i]) ubItem(c, ITEMS[i][0], ITEMS[i][4], ITEMS[i][5], ITEMS[i][6]);
      }
      if (t < FLY[0]) {
        c.fillStyle = '#121316'; c.save(); TK.tokenPath(c, 226); c.fill(); c.restore();
        if (t < 6.8 || t < FLY[0]) TK.token(c, 0, 0, 210);
        // shine on the reveal
        const sw = seg(t, REVEAL + 0.05, REVEAL + 0.6);
        if (sw > 0 && sw < 1) {
          c.save(); TK.tokenPath(c, 210); c.clip('evenodd');
          const gx = lerp(-260, 260, sw), g = c.createLinearGradient(gx - 60, -60, gx + 60, 60);
          g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = g; c.fillRect(-140, -140, 280, 280); c.restore();
        }
      }
      // tissue: two sheets folded back slowly, the sticker first
      const tl = PI * 0.92 * E.ioS(seg(t, 4.35, 4.95)), tr = PI * 0.92 * E.ioS(seg(t, 4.95, 5.45));
      if (t > 3.3 && t < 6.4) {
        const crinkle = c2 => { c2.strokeStyle = 'rgba(120,110,95,0.18)'; c2.lineWidth = 2; const r = rng(31); c2.beginPath(); for (let i = 0; i < 9; i++) { const x = r() * 280, y = -170 + r() * 340; c2.moveTo(x, y); c2.lineTo(x + 40 - r() * 80, y + 30 + r() * 60); } c2.stroke(); };
        fold(c, -280, 1, 290, -170, 340, tl, '#f6f3ee', '#ebe6dd', crinkle);
        fold(c, 280, -1, 290, -170, 340, tr, '#f9f6f1', '#ebe6dd', crinkle);
        // sticker seal
        const pk = E.ioC(seg(t, 4.1, 4.35));
        if (t < 4.5) {
          c.save(); c.translate(130 * pk, 80 * pk); c.rotate(0.6 * pk); c.globalAlpha = 1 - seg(t, 4.35, 4.5);
          c.fillStyle = P.accent; c.beginPath(); c.arc(0, 0, 40, 0, TAU); c.fill();
          TK.token(c, 0, 0, 34, { color: P.ground });
          c.restore();
        }
      }
    }
    if (!openL) fold(c, -BW / 2, 1, BW / 2, -BH / 2, BH, thL, KRAFT, KRAFT_I, decoL);
    if (!openR) fold(c, BW / 2, -1, BW / 2, -BH / 2, BH, thR, KRAFT, KRAFT_I, decoR);
    if (t < 2.45) {
      // the uncut tape overhangs the box ends; the cut line runs down it
      c.fillStyle = '#d7c9a8'; c.fillRect(-36, -BH / 2 - 26, 72, 26); c.fillRect(-36, BH / 2, 72, 26);
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(-36, -BH / 2 - 26, 72, BH + 52);
      if (tapeCut > 0) { c.strokeStyle = '#5a3d1c'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -BH / 2 - 26); c.lineTo(0, Math.min(cyL, BH / 2 + 26)); c.stroke(); }
    }
    // the inner box lid, lifted above everything
    if (t > 2.45 && t < 3.85) {
      const lu = E.inQ(seg(t, 3.35, 3.85));
      c.save(); c.translate(900 * lu * 0.5 / b.s, -700 * lu * 0.5 / b.s); c.scale(1 + 0.35 * lu, 1 + 0.35 * lu); c.globalAlpha = 1 - seg(t, 3.7, 3.85);
      c.fillStyle = `rgba(60,35,10,${0.2 + 0.2 * lu})`; c.fillRect(-290 + 10 + 60 * lu, -180 + 12 + 60 * lu, 580, 360);
      c.fillStyle = '#fbf9f4'; c.fillRect(-290, -180, 580, 360);
      c.strokeStyle = 'rgba(23,24,28,0.08)'; c.lineWidth = 2; c.strokeRect(-280, -170, 560, 340);
      TK.word(c, 30, 10, { size: 84, ls: 6 });
      TK.token(c, -205, 8, 46);
      c.restore();
    }
    c.restore();
  }
  function ubActs(c, t) {   // action-length bars, top right: the tissue is the longest
    const a = seg(t, 1.5, 1.8) * (1 - seg(t, 6.0, 6.3));
    if (a <= 0.01) return;
    c.save(); c.globalAlpha = a;
    const x1 = 1848, x0 = x1 - 300, k = 150;
    label(c, 'ACTION LENGTH', x1, 104, { size: 12, align: 'right', color: P.ink, weight: 700 });
    ACTS.forEach(([n, s0, s1], i) => {
      const y = 126 + i * 28, d = clamp(t - s0, 0, s1 - s0), tis = n === 'TISSUE';
      label(c, n, x0 - 12, y + 13, { size: 12, align: 'right', color: tis ? P.ink : P.mute, weight: tis ? 700 : 400 });
      c.fillStyle = 'rgba(23,24,28,0.08)'; c.fillRect(x0, y, k * (s1 - s0), 16);
      c.fillStyle = tis ? P.accent : 'rgba(23,24,28,0.45)'; c.fillRect(x0, y, k * d, 16);
      if (d > 0) label(c, `${d.toFixed(1)} s`, x0 + k * d + 8, y + 13, { size: 12, color: P.ink });
    });
    c.restore();
  }
  MG.film({
    id: 'formatunboxing', dur: 10, poster: 4.75,
    fonts: FONTS,
    meta: {
      family: 'M', name: 'Unboxing', sub: 'Overhead, slow before the reveal, knolled contents', era: '2006 —',
      origin: 'Unboxing videos grew up on YouTube in the mid-2000s with gadget launches — fans filmed themselves opening the first iPhone in June 2007 — and by 2010 ‘unboxing’ was a search category of its own. The grammar is consistent: an overhead or over-the-shoulder camera, the sealed box shown first, the tape cut and the layers removed one by one, a deliberately slow last layer before the product, then the contents laid out and a first-impression verdict. Brands answered with packaging designed to be filmed — Apple’s nested boxes and pull tabs — and the laid-out contents borrow knolling, Andrew Kromelow’s 1987 habit at Frank Gehry’s furniture shop of arranging tools at right angles, popularised by Tom Sachs.',
      works: 'iPhone launch unboxings (YouTube, June 2007) · Unbox Therapy (Lewis Hilsenteger, 2010 —) · Tom Sachs, ‘Ten Bullets’ (2010; ‘Always be knolling’)',
      tech: ['Overhead locked-off camera, hands in frame', 'Each layer slower; the last layer before the reveal slowest', 'Knolled contents and a first-impression verdict'],
      accent: '#ff5a1f',
      motionDNA: 'Action gets shorter then stops: the box drops with a thud, the tape cut runs 0.8 s, the flaps 0.75 s, the lid lifts off in 0.5 s — then the sticker and two tissue sheets take 1.55 s on a slow ease with the music pulled out. The reveal at 5.45 s is a hit, a shine sweep and a 10 % push-in; the box slides aside and five items fly to their knolled spots, alternate hands, one every 0.38 s; the verdict card stamps down at 8.9 s and the Token hops.',
      visualDNA: 'Top-down light-oak desk; a kraft shipping box with a white label, barcode, red FRAGILE and this-side-up arrows; an off-white inner box with MOTION on the lid, white tissue sealed with an orange sticker, black foam cradling the orange Token. Simple-shape hands with navy sleeves and soft drop shadows. Knolled contents — wordmark card, orange quick-start booklet, sticker sheet, easing card — with dashed alignment guides and gap dimensions.',
      transitions: 'One continuous overhead take; a push-in on the reveal and back out for the layout',
      implementation: ['Overhead rig (camera on a C-stand arm or copy stand) and diffused top light', 'Real-time capture with a slowed reveal; knolling laid out by hand on a grid', 'Canvas 2D: fold transforms for flaps and tissue, keyed hand tracks, a pace curve in the caption'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const z = ubZoom(t), b = ubBox(t);
      c.save(); c.translate(BX, BY); c.scale(z, z); c.translate(-BX, -BY);
      ubTable(c, W, H);
      ubBoxDraw(c, t, b);
      // knolling guides
      const gd = seg(t, 8.35, 8.7);
      if (gd > 0.01) {
        c.save(); c.globalAlpha = gd; c.strokeStyle = 'rgba(47,91,255,0.55)'; c.lineWidth = 1.5; c.setLineDash([6, 6]);
        c.beginPath(); [170, 470].forEach(y => { c.moveTo(960, y); c.lineTo(1860, y); }); [990, 1290, 1600].forEach(x => { c.moveTo(x, 150); c.lineTo(x, 800); }); c.stroke(); c.setLineDash([]);
        [[1230, 1290, 220], [1540, 1600, 520]].forEach(([a, z2, y]) => { c.beginPath(); c.moveTo(a, y); c.lineTo(z2, y); c.stroke(); label(c, '60', (a + z2) / 2, y - 8, { size: 11, align: 'center', color: P.blue, weight: 700 }); });
        c.beginPath(); c.moveTo(1200, 410); c.lineTo(1200, 470); c.stroke(); label(c, '60', 1208, 446, { size: 11, color: P.blue, weight: 700 });
        c.restore();
      }
      // contents in flight / placed (the Token hops at the verdict)
      ITEMS.forEach((it, i) => {
        if (t < FLY[i]) return;
        const p = ubItemAt(i, t);
        let o = { lift: p.lift };
        if (i === 0 && t > 9.0) { const hp = sinc(seg(t, 9.0, 9.35)), sq = t > 9.35 ? 0.16 * Math.exp(-(t - 9.35) * 14) : 0; p.y -= 50 * hp; o = { sx: 1 + sq, sy: 1 - sq }; }
        ubItem(c, it[0], p.x, p.y, p.k, o);
        if (p.u >= 1) sub(c, it[1], it[7] - it[2] / 2, it[8] + it[3] / 2 + 24, seg(t, FLY[i] + FLYD, FLY[i] + FLYD + 0.2), { size: 12, color: P.ink, weight: 700 });
      });
      ubHands(t).forEach(h => hand(c, h.x, h.y, h.a, { side: h.side, tool: h.tool }));
      c.restore();
      // verdict card
      const vd = E.outB(seg(t, 8.75, 8.95), 1.4);
      if (vd > 0.01) {
        c.save(); c.translate(500, 720); c.rotate(-0.025); c.scale(lerp(1.25, 1, clamp(vd)), lerp(1.25, 1, clamp(vd))); c.globalAlpha = clamp(vd * 1.5);
        c.fillStyle = 'rgba(60,35,10,0.2)'; c.fillRect(-300 + 10, -110 + 12, 600, 220);
        c.fillStyle = '#fbf9f4'; c.fillRect(-300, -110, 600, 220);
        c.fillStyle = P.accent; c.fillRect(-300, -110, 600, 8);
        label(c, 'FIRST IMPRESSION', -270, -64, { size: 14, color: P.mute, weight: 700 });
        text(c, '9/10', -272, 20, { font: TK.FONT, weight: 900, size: 92, color: P.ink });
        for (let k = 0; k < 5; k++) { const x = -258 + k * 40; TK.token(c, x, 70, 28, { color: k < 4 ? P.accent : 'rgba(23,24,28,0.15)' }); }
        ['+ Feels solid in the hand', '+ That reveal', '+ It actually moves', '− Box is a bit big'].forEach((s, i) => label(c, s, 10, -54 + i * 36, { size: 16, ls: 0.5, color: i === 3 ? P.mute : P.ink }));
        c.restore();
      }
      // annotations
      const N = [
        [0.1, 1.4, 'THE BOX · SHOW IT SEALED FIRST', 'OVERHEAD, LOCKED OFF · HANDS IN FRAME'],
        [1.45, 3.85, 'THE OPEN · ONE LAYER AT A TIME', 'EACH ACTION SHORTER THAN THE LAST'],
        [3.9, REVEAL, 'TISSUE · THE SLOWEST BEAT, RIGHT BEFORE THE REVEAL', 'MUSIC PULLED OUT · ANTICIPATION'],
        [REVEAL, 6.4, 'REVEAL · HERO IN ITS FOAM, A SHINE, A PUSH-IN', 'HOLD IT — LET IT LAND'],
        [6.4, 8.7, 'CONTENTS · KNOLLING: SQUARE TO FRAME, EVEN GAPS', 'EVERY ITEM SHOWN AND NAMED'],
        [8.7, 10.01, 'VERDICT · FIRST IMPRESSIONS, ON CAMERA', 'NOT A LONG-TERM REVIEW'],
      ];
      N.forEach(([a, z2, s1, s2]) => { const on = win(t, a, z2, 0.15); note(c, s1, 80, 118, on); sub(c, s2, 92, 146, on, { size: 13, color: P.ink }); });
      ubActs(c, t);
      FK.strip(c, t, W, H, UB, { label: 'Unboxing · pace' });
      FK.caption(c, t, W, H, { name: 'Unboxing', cat: 'Advertising', curve: u => ubPace(u * 10), span: [0, 10], lo: -0.05, hi: 1.3, curveLabel: 'PACE / TIME' });
    },
    score(A) {
      // lo-fi bed for the busy parts; pulled out for the tissue
      const bar = (t0, t1, g) => {
        for (let t = t0; t < t1 - 0.01; t += 0.5) { A.kick(t, 0.22 * g, { f: 100, f2: 42 }); A.hat(t + 0.25, 0.03 * g); if (Math.round((t - t0) / 0.5) % 2) A.snare(t, 0.07 * g, { f: 1600 }); }
      };
      bar(0.55, 3.85, 1);
      [[0.55, [50, 57, 60, 65]], [2.55, [46, 53, 57, 62]]].forEach(([t, n]) => A.chord(t, n, { type: 'triangle', dur: 2.0, g: 0.025, a: 0.05, lp: 1400, rev: 0.4, width: 0.6 }));
      // foley: thud, tape cut, flaps, lid suction
      A.impact(0.55, 0.25, { rev: 0.2 }); A.noise(0.55, { type: 'lowpass', f: 300, dur: 0.2, g: 0.12 });
      for (let k = 0; k < 16; k++) A.noise(1.5 + k * 0.05, { type: 'bandpass', f: 2600 + 600 * hash(k), q: 2, dur: 0.045, g: 0.05 });
      [2.45, 2.6].forEach((t, i) => A.noise(t, { type: 'bandpass', f: 380, f2: 220, q: 3, dur: 0.5, g: 0.06, pan: i ? 0.4 : -0.4 }));
      A.noise(3.4, { type: 'lowpass', f: 600, f2: 200, dur: 0.45, g: 0.09, swell: 0.6 });
      // the hold: a single held note, sticker peel, tissue crinkle, near silence before the reveal
      A.osc(3.85, { f: midi(62), dur: 1.5, g: 0.035, a: 0.4, hold: true, rel: 0.15, rev: 0.6 });
      A.noise(4.1, { type: 'highpass', f: 2500, f2: 6000, dur: 0.25, g: 0.04 });
      for (let k = 0; k < 40; k++) { const t = 4.35 + hash(k * 7.7) * 1.05; A.noise(t, { type: 'highpass', f: 4000, dur: 0.02, g: 0.02 + 0.02 * hash(k) }); }
      A.riser(4.4, 1.0, { g: 0.04, f: 147 });
      // reveal
      A.chord(REVEAL, [50, 57, 62, 66, 69, 74], { type: 'triangle', dur: 2.0, g: 0.035, a: 0.01, lp: 3200, rev: 0.7, width: 0.8 });
      A.bell(REVEAL, midi(86), { g: 0.08, dur: 1.6, rev: 0.7 });
      A.bell(REVEAL + 0.12, midi(93), { g: 0.04, dur: 1.2, rev: 0.7 });
      A.noise(REVEAL + 0.05, { type: 'highpass', f: 6000, f2: 12000, dur: 0.6, g: 0.04, swell: 0.4 });
      // contents: the bed returns, a soft tap as each item lands
      bar(6.4, 8.7, 0.8);
      [[6.4, [50, 57, 62, 66]], [7.4, [47, 54, 59, 62]], [8.4, [43, 50, 55, 59]]].forEach(([t, n]) => A.chord(t, n, { type: 'triangle', dur: 1.1, g: 0.022, a: 0.05, lp: 1600, rev: 0.4, width: 0.6 }));
      FLY.forEach((t, i) => { A.noise(t + FLYD, { type: 'bandpass', f: 900 + i * 120, q: 2, dur: 0.06, g: 0.08 }); A.osc(t + FLYD, { f: 180, f2: 90, dur: 0.08, g: 0.06 }); });
      // verdict: the card stamps down, the Token hops
      A.kick(8.9, 0.32, { f: 120, f2: 45 }); A.noise(8.9, { type: 'lowpass', f: 1200, dur: 0.15, g: 0.08 });
      A.chord(8.9, [50, 57, 62, 66, 69], { type: 'triangle', dur: 1.1, g: 0.03, a: 0.02, lp: 2600, rev: 0.6, width: 0.8 });
      A.osc(9.0, { f: 400, f2: 800, glide: 0.2, dur: 0.25, g: 0.05 });
      A.kick(9.35, 0.14, { f: 220, f2: 100, dur: 0.12 });
    },
  });
})();
