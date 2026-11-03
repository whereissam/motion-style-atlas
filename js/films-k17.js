/* batch k17 — Technique Atlas · Timing, Camera: techarcs · techmotionpath · techpan.
   techarcs (the animation principle that natural motion follows arcs: the same two keys and the
   same timing joined first by a straight in-between, then by a breakdown drawing pushed off the
   line, so the Token travels an arc; spacing dots trace both; then a swing, where a fixed pivot
   and radius draw the arc and the onion skins show wide spacing at the bottom, tight at the
   extremes) ·
   techmotionpath (spatial interpolation: four keyframe positions joined by a polyline, then
   tangent handles pulled out into a bezier path; the Token follows it with auto-orient off, then
   on; then the same path with a new speed graph — linear against easy ease — so "where" and
   "when" separate, with a speed graph and keyframe diamonds) ·
   techpan (the camera rotates about a fixed nodal point: a slow pan across a wide set in which a
   near and a far Token keep their overlap, a plan view of the rotating view cone, a fast pan
   rendered at 24 fps that judders, with a pan-speed readout, then a tilt up to MOTION). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, midi, text } = MG;
  const TK = MG.TK, P = TK.P, PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const label = (c, s, x, y, o = {}) => text(c, s, x, y, { font: TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
  const tag = (c, s, x, y, on = 1) => {   // small accent dot + mono label
    if (on <= 0.01) return;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: P.ink, weight: 700, size: 20 });
    c.restore();
  };
  const dot = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const arrowHead = (c, x, y, ang, s = 12, col = P.ink) => {
    c.save(); c.translate(x, y); c.rotate(ang); c.fillStyle = col;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(-s, -s * 0.5); c.lineTo(-s, s * 0.5); c.closePath(); c.fill(); c.restore();
  };
  const win = (t, a, b, f = 0.3) => clamp(seg(t, a, a + f)) * (1 - seg(t, b - f, b));   // fade in at a, out at b
  const box = (c, x, y, w, h) => {
    c.fillStyle = 'rgba(236,232,223,0.95)'; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(23,24,28,0.22)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w, h);
  };

  /* =====================================================================
     ARCS — two keys (KEY 1 low left, KEY 2 high right, a third of a turn
     apart) and one eased timing. First the computer's answer: a straight
     in-between, the ink Token sliding along the chord, its middle drawing
     sitting on the line. Then the animator's: a breakdown drawing pushed
     up off the line, which turns the in-betweens into an arc (a quadratic
     through KEY 1, BREAKDOWN, KEY 2, so the breakdown is exactly the middle
     drawing). Same keys, same spacing, different path. Then a swing: a
     fixed pivot and a fixed radius force the arc; onion skins and a row
     of spacing dots show it is wide at the bottom and tight at the ends,
     and the dotted chord shows the shortcut a straight in-between takes.
     ===================================================================== */
  const AR = { A: [420, 700], B: [1500, 430], BD: [887, 274], s: 150, r0: -0.3, r1: 0.42,
    S: [1.0, 2.6], R: [3.5, 5.1], N: 12, sw: 5.8, piv: [960, 132], L: 440, th0: 0.8, ss: 160 };
  const AR_C = [2 * AR.BD[0] - (AR.A[0] + AR.B[0]) / 2, 2 * AR.BD[1] - (AR.A[1] + AR.B[1]) / 2];
  const arLine = u => [lerp(AR.A[0], AR.B[0], u), lerp(AR.A[1], AR.B[1], u)];
  const arArc = u => { const v = 1 - u; return [v * v * AR.A[0] + 2 * v * u * AR_C[0] + u * u * AR.B[0], v * v * AR.A[1] + 2 * v * u * AR_C[1] + u * u * AR.B[1]]; };
  const arTh = t => t < AR.sw ? -AR.th0 : -AR.th0 * Math.exp(-0.11 * (t - AR.sw)) * Math.cos(PI * (t - AR.sw));
  const arSwPos = t => { const th = arTh(t); return [AR.piv[0] + AR.L * Math.sin(th), AR.piv[1] + AR.L * Math.cos(th), th]; };

  function arScene1(c, t) {
    const [A, B, BD] = [AR.A, AR.B, AR.BD], keysOn = clamp(seg(t, 0.3, 0.7));
    // key ghosts
    c.save(); c.globalAlpha *= keysOn;
    c.setLineDash([6, 7]);
    [[A, AR.r0], [B, AR.r1]].forEach(([p, r]) => { c.save(); c.translate(p[0], p[1]); c.rotate(r); TK.tokenPath(c, AR.s); c.restore(); c.strokeStyle = 'rgba(23,24,28,0.45)'; c.lineWidth = 2; c.stroke(); });
    c.setLineDash([]);
    label(c, 'KEY 1', A[0], A[1] + 112, { align: 'center', color: P.ink, weight: 700 });
    label(c, 'KEY 2', B[0], B[1] + 112, { align: 'center', color: P.ink, weight: 700 });
    c.restore();
    // straight chord + spacing dots
    const sOn = clamp(seg(t, AR.S[0] - 0.3, AR.S[0]));
    if (sOn > 0) {
      c.save(); c.globalAlpha *= sOn;
      c.setLineDash([4, 8]); c.strokeStyle = 'rgba(23,24,28,0.4)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); c.setLineDash([]);
      for (let k = 0; k <= AR.N; k++) {
        const tk = lerp(AR.S[0], AR.S[1], k / AR.N); if (tk > t) break;
        const p = arLine(E.ioS(k / AR.N)); dot(c, p[0], p[1], k === AR.N / 2 ? 8 : 5, P.ink);
      }
      c.restore();
    }
    // breakdown: arrow from the straight middle drawing, ghost at the breakdown
    const bOn = clamp(seg(t, 2.8, 3.3));
    if (bOn > 0) {
      const M = arLine(0.5), q = E.outC(bOn);
      c.save(); c.globalAlpha *= bOn;
      const ex = lerp(M[0], BD[0], q), ey = lerp(M[1], BD[1], q) + 90 * q;
      c.strokeStyle = P.accent; c.lineWidth = 3; c.beginPath(); c.moveTo(M[0], M[1] - 14); c.lineTo(ex, ey); c.stroke();
      arrowHead(c, ex, ey, Math.atan2(ey - M[1], ex - M[0]), 16, P.accent);
      c.save(); c.translate(BD[0], BD[1]); c.rotate((AR.r0 + AR.r1) / 2); TK.tokenPath(c, AR.s); c.restore();
      c.setLineDash([6, 6]); c.strokeStyle = P.accentD; c.lineWidth = 2.5; c.stroke(); c.setLineDash([]);
      label(c, 'BREAKDOWN', BD[0], BD[1] - 120, { color: P.accentD, weight: 700, size: 20, align: 'center' });
      label(c, 'THE MIDDLE DRAWING, PUSHED OFF THE LINE', BD[0], BD[1] - 94, { size: 15, align: 'center' });
      label(c, 'STRAIGHT MIDDLE', M[0] + 22, M[1] + 40, { size: 15, color: P.ink });
      c.restore();
    }
    // arc path + spacing dots
    const aOn = clamp(seg(t, AR.R[0] - 0.3, AR.R[0]));
    if (aOn > 0) {
      c.save(); c.globalAlpha *= aOn;
      const up = clamp(seg(t, AR.R[0], AR.R[1]));
      c.strokeStyle = 'rgba(255,90,31,0.55)'; c.lineWidth = 3; c.beginPath();
      for (let i = 0; i <= 80; i++) { const p = arArc(E.ioS(up) * i / 80); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
      c.stroke();
      for (let k = 0; k <= AR.N; k++) {
        const tk = lerp(AR.R[0], AR.R[1], k / AR.N); if (tk > t) break;
        const p = arArc(E.ioS(k / AR.N)); dot(c, p[0], p[1], k === AR.N / 2 ? 8 : 5, P.accentD);
      }
      c.restore();
    }
    // the two Tokens
    const us = E.ioS(seg(t, AR.S[0], AR.S[1])), ps = arLine(us), inkA = 1 - seg(t, AR.S[1] + 0.1, AR.S[1] + 0.5);
    if (inkA > 0) TK.token(c, ps[0], ps[1], AR.s, { rot: lerp(AR.r0, AR.r1, us), color: P.ink, alpha: inkA * keysOn });
    const oa = clamp(seg(t, 3.0, 3.4));
    if (oa > 0) { const ua = E.ioS(seg(t, AR.R[0], AR.R[1])), pa = arArc(ua); TK.token(c, pa[0], pa[1], AR.s, { rot: lerp(AR.r0, AR.r1, ua), alpha: oa }); }
    // verdict labels
    const vOn = clamp(seg(t, AR.R[1], AR.R[1] + 0.3));
    if (vOn > 0) {
      c.save(); c.globalAlpha *= vOn;
      label(c, 'STRAIGHT  ·  MECHANICAL', 1010, 650, { color: P.ink, weight: 700, size: 20 });
      label(c, 'ARC  ·  NATURAL', 560, 330, { color: P.accentD, weight: 700, size: 20, align: 'right' });
      c.restore();
    }
    label(c, 'SAME KEYS  ·  SAME TIMING  ·  ' + AR.N + ' FRAMES', 72, 140, { size: 16 });
    tag(c, '01  ·  STRAIGHT IN-BETWEEN', 72, 104, win(t, 0.3, 2.75));
    tag(c, '02  ·  ADD A BREAKDOWN', 72, 104, win(t, 2.75, 3.45));
    tag(c, '03  ·  IN-BETWEEN ON THE ARC', 72, 104, win(t, 3.45, 5.6));
  }

  function arScene2(c, t) {
    const [px, py] = AR.piv, L = AR.L, th0 = AR.th0;
    // arc guide and chord
    c.setLineDash([5, 7]); c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 2;
    c.beginPath(); c.arc(px, py, L, PI / 2 - th0 - 0.06, PI / 2 + th0 + 0.06); c.stroke();
    const xL = px - L * Math.sin(th0), xR = px + L * Math.sin(th0), yE = py + L * Math.cos(th0);
    c.setLineDash([2, 7]); c.beginPath(); c.moveTo(xL, yE); c.lineTo(xR, yE); c.stroke(); c.setLineDash([]);
    label(c, 'STRAIGHT CHORD  ·  THE SHORTCUT', px, yE - 16, { align: 'center', size: 15 });
    // spacing dots of the first half swing, every 1/12 s
    const RO = L + 125, rad = (th, r) => [px + r * Math.sin(th), py + r * Math.cos(th)];
    for (let k = 0; k <= 12; k++) { const q = rad(arTh(AR.sw + k / 12), RO); dot(c, q[0], q[1], 4.5, P.accentD); }
    const qb = rad(0, RO + 40), qe = rad(-th0, RO), qf = rad(th0, RO);
    label(c, 'WIDE  ·  FAST', qb[0], qb[1], { align: 'center', size: 15, color: P.ink, weight: 700 });
    label(c, 'SPACING EVERY 1/12 S', qb[0], qb[1] + 26, { align: 'center', size: 14 });
    label(c, 'TIGHT  ·  SLOW', qe[0] - 30, qe[1] + 6, { align: 'right', size: 15, color: P.ink, weight: 700 });
    label(c, 'TIGHT  ·  SLOW', qf[0] + 30, qf[1] + 6, { size: 15, color: P.ink, weight: 700 });
    // onion skins (closed form: earlier instants of the same swing)
    for (let k = 8; k >= 1; k--) {
      const tk = t - k / 15; if (tk < AR.sw) continue;
      const p = arSwPos(tk);
      c.save(); c.translate(p[0], p[1]); c.rotate(-p[2]); TK.tokenPath(c, AR.ss); c.restore();
      c.strokeStyle = `rgba(198,62,12,${0.5 * (1 - k / 9)})`; c.lineWidth = 2; c.stroke();
    }
    // rod, pivot, Token
    const p = arSwPos(t);
    c.strokeStyle = P.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(px, py); c.lineTo(p[0], p[1]); c.stroke();
    TK.token(c, p[0], p[1], AR.ss, { rot: -p[2] });
    dot(c, px, py, 13, P.ink); dot(c, px, py, 5, P.ground);
    label(c, 'PIVOT', px + 26, py - 14, { color: P.ink, weight: 700 });
    const mx = lerp(px, p[0], 0.5), my = lerp(py, p[1], 0.5);
    label(c, 'RADIUS FIXED  →  ARC', mx + (p[2] > 0 ? -24 : 24), my, { align: p[2] > 0 ? 'right' : 'left', size: 15, color: P.ink });
    tag(c, '04  ·  A SWING: THE PIVOT DRAWS THE ARC', 72, 104, 1);
    label(c, `ANGLE  ${(p[2] * 180 / PI).toFixed(1).padStart(5, ' ')}°`, 72, 140, { size: 16 });
  }

  MG.film({
    id: 'techarcs', dur: 10, poster: 5.0,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Arcs', sub: 'Natural motion travels on curves, not straight lines', era: '1930s —',
      origin: 'Arcs are one of the twelve principles of animation that Disney animators Ollie Johnston and Frank Thomas set down in The Illusion of Life (1981), codifying practice from the Disney studio of the 1930s: limbs pivot at joints, so almost every natural movement traces a curve, and in-betweens drawn on a straight line look mechanical. The animator fixes the curve with a breakdown drawing between the keys; Richard Williams’ Animator’s Survival Kit (2001) drills the same habit of plotting the arc and spacing every in-between along it.',
      works: 'Snow White and the Seven Dwarfs (Disney, 1937) · The Illusion of Life: Disney Animation (Frank Thomas & Ollie Johnston, 1981) · The Animator’s Survival Kit (Richard Williams, 2001)',
      tech: ['Breakdown pose off the straight line', 'Arc-plotted in-betweens', 'Pivot + fixed radius swing'],
      accent: '#ff5a1f',
      motionDNA: 'Two keys and one eased timing, played twice: an ink Token slides the straight chord, then the orange Token, with the same spacing and rotation, rises through a breakdown and lands on the same key along a curve. After a crossfade the Token hangs from a pivot and swings, slow at the extremes and fast through the bottom, its amplitude decaying on every beat-aligned pass.',
      visualDNA: 'The Technique Atlas stage with dashed key ghosts, a dashed chord and ink spacing dots against an orange arc and dark-orange dots; a breakdown ghost with an accent arrow from the straight middle drawing; then a pivot, an ink rod, a dashed arc guide, a dotted chord, a row of spacing dots and fading onion skins.',
      transitions: 'Straight pass, breakdown, arc pass, then a crossfade to the swing',
      implementation: ['Hand-drawn keys, breakdowns and in-betweens plotted on arc charts', 'After Effects motion-path bezier or a parented null as pivot', 'Canvas 2D: quadratic through key, breakdown and key; closed-form damped pendulum with onion skins'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      const f = E.ioS(seg(t, 5.35, 5.85));
      if (f < 1) { c.save(); c.globalAlpha = 1 - f; arScene1(c, t); c.restore(); }
      if (f > 0) { c.save(); c.globalAlpha = f; arScene2(c, t); c.restore(); }
      if (t < 5.6) {
        const inArc = t > AR.R[0] - 0.4, sp = inArc ? AR.R : AR.S;
        TK.caption(c, t, W, H, { name: 'Arcs', cat: 'Timing', curve: inArc ? (u => { const e = E.ioS(u); return 4 * e * (1 - e); }) : (() => 0), span: sp, lo: -0.15, hi: 1.2, curveLabel: 'DISTANCE OFF THE STRAIGHT LINE' });
      } else {
        TK.caption(c, t, W, H, { name: 'Arcs', cat: 'Timing', curve: u => -arTh(AR.sw + u * 4.2) / AR.th0, span: [AR.sw, AR.sw + 4.2], lo: -1.25, hi: 1.25, curveLabel: 'SWING ANGLE / TIME' });
      }
    },
    score(A) {
      TK.bed(A);
      A.pluck(0.3, midi(60), { g: 0.14, dur: 0.8, bright: 0.5, rev: 0.3, pan: -0.4 });
      A.pluck(0.5, midi(67), { g: 0.14, dur: 0.8, bright: 0.5, rev: 0.3, pan: 0.4 });
      // straight pass: one flat, even tone (mechanical)
      A.osc(AR.S[0], { type: 'square', f: midi(60), f2: midi(67), glide: AR.S[1] - AR.S[0], dur: AR.S[1] - AR.S[0], g: 0.025, a: 0.05, lp: 1200, hold: true });
      A.whoosh(AR.S[0], AR.S[1] - AR.S[0], { f1: 400, f2: 900, q: 2, g: 0.06, swell: 0.5, pan: 0 });
      A.pluck(AR.S[1], midi(67), { g: 0.14, dur: 0.6, bright: 0.3 });
      // breakdown appears
      A.bell(2.8, midi(79), { g: 0.08, dur: 1.4, rev: 0.5 });
      // arc pass: pitch rises and falls with the curve
      const hR = (AR.R[1] - AR.R[0]) / 2;
      A.osc(AR.R[0], { type: 'triangle', f: midi(60), f2: midi(72), glide: hR, dur: hR + 0.02, g: 0.06, a: 0.08, lp: 2600, rev: 0.4 });
      A.osc(AR.R[0] + hR, { type: 'triangle', f: midi(72), f2: midi(67), glide: hR, dur: hR + 0.3, g: 0.06, a: 0.02, lp: 2600, rev: 0.4 });
      A.whoosh(AR.R[0], AR.R[1] - AR.R[0], { f1: 300, f2: 2600, q: 1.6, g: 0.1, swell: 0.5, rev: 0.3 });
      A.pluck(AR.R[1], midi(67), { g: 0.18, dur: 1.2, bright: 0.6, rev: 0.3 });
      A.bell(AR.R[1], midi(84), { g: 0.06, dur: 1.4, rev: 0.5 });
      // swing: a whoosh through each bottom pass, a pluck at each extreme
      for (let k = 0; k < 4; k++) {
        const tb = AR.sw + 0.5 + k, amp = Math.exp(-0.11 * (0.5 + k));
        A.whoosh(tb - 0.3, 0.6, { f1: 250, f2: 1800 * amp, q: 1.4, g: 0.12 * amp, swell: 0.5, pan: k % 2 ? -0.3 : 0.3 });
        if (k < 3) A.pluck(AR.sw + 1 + k, midi([72, 67, 72][k]), { g: 0.15 * amp, dur: 0.8, bright: 0.5, rev: 0.3, pan: k % 2 ? -0.5 : 0.5 });
      }
      A.chord(AR.sw, [60, 64, 67, 72], { type: 'triangle', dur: 1.4, g: 0.035, a: 0.05, lp: 2000, rev: 0.5, width: 0.8 });
    },
  });

  /* =====================================================================
     MOTION PATH — the spatial half of a keyframe. Four keyframe positions
     pop on, joined first by straight segments (linear spatial
     interpolation, hard corners), then each key's tangent handles pull out
     and the path relaxes into a smooth cubic bezier. The Token follows the
     path at constant speed (arc-length parameterised, so it moves the same
     distance every frame) with auto-orient off — always upright — then
     with auto-orient on, rotated to the path tangent. Last, the same path
     with a new speed graph: a linear ghost and an easy-eased Token run it
     side by side, the spacing dots and the keyframe diamonds in time move,
     the path does not. The speed graph sits top right.
     ===================================================================== */
  const MP = { K: [[240, 690], [640, 330], [1080, 650], [1580, 540]], T: [[300, -380], [520, 0], [520, 0], [420, -220]], hk: 0.42, s: 120,
    M: [[2.4, 4.6, 'lin', false], [4.9, 7.1, 'lin', true], [7.3, 9.5, 'ease', true]], gx: 1360, gy: 92, gw: 488, gh: 170 };
  const mpSegs = h => MP.K.slice(0, 3).map((p, i) => {
    const q = MP.K[i + 1], a = MP.T[i], b = MP.T[i + 1], k = MP.hk * h;
    return [p, [p[0] + a[0] * k, p[1] + a[1] * k], [q[0] - b[0] * k, q[1] - b[1] * k], q];
  });
  const bez = (s, u) => { const v = 1 - u, w = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u]; return [0, 1].map(j => w[0] * s[0][j] + w[1] * s[1][j] + w[2] * s[2][j] + w[3] * s[3][j]); };
  function mpTable() {
    const S = mpSegs(1), tab = { s: [0], p: [bez(S[0], 0)], key: [0] };
    S.forEach((sg, i) => {
      for (let j = 1; j <= 240; j++) {
        const p = bez(sg, j / 240), q = tab.p[tab.p.length - 1];
        tab.s.push(tab.s[tab.s.length - 1] + Math.hypot(p[0] - q[0], p[1] - q[1])); tab.p.push(p);
      }
      tab.key.push(tab.s[tab.s.length - 1]);
    });
    tab.L = tab.s[tab.s.length - 1];
    return tab;
  }
  function mpAt(tab, d) {   // position and tangent angle at distance d along the path
    d = clamp(d, 0, tab.L);
    let lo = 0, hi = tab.s.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; tab.s[m] < d ? (lo = m) : (hi = m); }
    const u = (d - tab.s[lo]) / ((tab.s[hi] - tab.s[lo]) || 1), a = tab.p[lo], b = tab.p[hi];
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), Math.atan2(b[1] - a[1], b[0] - a[0])];
  }
  const mpEase = u => E.ioS(u);
  const mpInv = v => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; mpEase(m) < v ? (lo = m) : (hi = m); } return lo; };
  function mpMode(t) {
    let m = MP.M[0];
    MP.M.forEach(x => { if (t >= x[0] - 0.25) m = x; });
    return { t0: m[0], t1: m[1], ease: m[2] === 'ease', orient: m[3], i: MP.M.indexOf(m), u: seg(t, m[0], m[1]) };
  }

  function mpGraph(c, t, tab, m) {
    const { gx, gy, gw, gh } = MP;
    box(c, gx - 20, gy - 44, gw + 40, gh + 196 - (m.ease ? 0 : 22));
    tag(c, 'SPEED GRAPH  ·  WHEN', gx - 6, gy - 14, 1);
    c.strokeStyle = 'rgba(23,24,28,0.25)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(gx, gy + 10); c.lineTo(gx, gy + gh); c.lineTo(gx + gw, gy + gh); c.stroke();
    label(c, 'PX / S', gx + 8, gy + 24, { size: 12 });
    label(c, 'TIME  →', gx + gw, gy + gh + 20, { size: 12, align: 'right' });
    const D = MP.M[0][1] - MP.M[0][0], v0 = tab.L / D, Y = v => gy + gh - v / (1.65 * v0) * (gh - 10);
    const on = clamp(seg(t, MP.M[0][0] - 0.4, MP.M[0][0]));
    if (on < 1) label(c, 'NO TIMING YET', gx + gw / 2, gy + gh / 2, { size: 15, align: 'center', color: `rgba(143,138,128,${1 - on})` });
    if (on > 0) {
      c.save(); c.globalAlpha *= on;
      const lin = () => { c.strokeStyle = P.ink; c.lineWidth = 2.5; c.beginPath(); c.moveTo(gx, Y(v0)); c.lineTo(gx + gw, Y(v0)); c.stroke(); };
      const eas = () => { c.strokeStyle = P.accent; c.lineWidth = 3; c.beginPath(); for (let i = 0; i <= 80; i++) { const u = i / 80, x = gx + u * gw, y = Y(v0 * 6 * u * (1 - u)); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); };
      if (m.ease) { c.save(); c.setLineDash([5, 5]); c.globalAlpha *= 0.6; lin(); c.restore(); eas(); } else lin();
      const v = m.ease ? v0 * 6 * m.u * (1 - m.u) : v0;
      dot(c, gx + m.u * gw, Y(v), 7, P.accent);
      label(c, m.ease ? 'EASY EASE  ·  LINEAR (DASH)' : 'LINEAR  ·  CONSTANT', gx + 10, gy + gh + 20, { size: 13, color: m.ease ? P.accentD : P.ink, weight: 700 });
      label(c, `v = ${Math.round(v * (m.u > 0 && m.u < 1 ? 1 : 0))} PX/S`, gx + gw, gy - 14, { size: 15, align: 'right', color: P.ink, weight: 700 });
      // keyframe diamonds in time
      const ty = gy + gh + 74;
      label(c, 'KEYFRAMES IN TIME', gx, ty - 32, { size: 12 });
      c.strokeStyle = 'rgba(23,24,28,0.3)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(gx, ty); c.lineTo(gx + gw, ty); c.stroke();
      const dia = (x, y, col, hg) => {
        c.fillStyle = col; c.beginPath();
        if (hg) { c.moveTo(x - 8, y - 9); c.lineTo(x + 8, y - 9); c.lineTo(x - 8, y + 9); c.lineTo(x + 8, y + 9); }
        else { c.moveTo(x, y - 10); c.lineTo(x + 9, y); c.lineTo(x, y + 10); c.lineTo(x - 9, y); }
        c.closePath(); c.fill();
      };
      tab.key.forEach((d, i) => {
        const ul = d / tab.L; dia(gx + ul * gw, ty - (m.ease ? 16 : 0), m.ease ? 'rgba(23,24,28,0.45)' : P.ink, false);
        if (m.ease) { const ue = i === 0 ? 0 : i === 3 ? 1 : mpInv(ul); dia(gx + ue * gw, ty + 16, P.accent, i === 0 || i === 3); }
        label(c, 'K' + (i + 1), gx + ul * gw, ty + (m.ease ? 52 : 30), { size: 12, align: 'center', color: P.ink });
      });
      c.fillStyle = P.accent; c.fillRect(gx + m.u * gw - 1, ty - 30, 2, 60);
      c.restore();
    }
  }

  MG.film({
    id: 'techmotionpath', dur: 10, poster: 5.75,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Motion Path', sub: 'Where on a bezier, when on a speed graph', era: '1970s —',
      origin: 'Keyframe interpolation along curved paths was worked out in early computer animation research; Kochanek and Bartels’ tension-continuity-bias splines (SIGGRAPH 1984) gave animators control over the shape of the path through each key. After Effects (1993) made the split explicit for motion designers: a layer’s position keys carry spatial bezier handles that shape the motion path in the comp, and separate temporal ease, edited in the speed graph, that decides how fast the layer travels along it; Auto-Orient turns the layer to the path tangent.',
      works: 'Kochanek & Bartels, “Interpolating Splines with Local Tension, Continuity, and Bias Control” (SIGGRAPH, 1984) · Adobe After Effects motion paths, speed graph and Auto-Orient (1993 —) · Adobe Flash motion guides (1997 —)',
      tech: ['Spatial bezier handles', 'Arc-length parameterisation', 'Auto-orient to tangent'],
      accent: '#ff5a1f',
      motionDNA: 'Keys pop on one per beat, the polyline relaxes into a curve as the handles pull out, then the Token runs the path three times: upright at constant speed, turned to the tangent at constant speed, and finally eased, starting slow, rushing through the middle and settling, beside a linear ghost on the same path.',
      visualDNA: 'The Technique Atlas stage with an ink bezier path, orange key points, handle bars with round ends, spacing dots that reveal speed, a tangent arrow; a boxed speed graph top right with keyframe diamonds and easy-ease hourglasses on a mini timeline.',
      transitions: 'Build the path, then three passes separated by a fade back to the first key',
      implementation: ['After Effects position keyframes with spatial bezier handles, Auto-Orient and the speed graph', 'Arc-length lookup table so equal time steps give equal distance', 'Canvas 2D: cubic bezier segments, binary-searched distance table, tangent from neighbouring samples'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { tab: mpTable() }; },
    draw(c, t, W, H, st) {
      const tab = st.tab, m = mpMode(t);
      TK.stage(c, W, H);
      const h = E.ioC(seg(t, 1.3, 2.1)), S = mpSegs(h);
      // polyline ghost (linear spatial)
      const poly = clamp(seg(t, 0.6, 0.9)) * (1 - 0.75 * h);
      if (poly > 0) {
        c.save(); c.globalAlpha *= poly; c.setLineDash([6, 8]); c.strokeStyle = 'rgba(23,24,28,0.5)'; c.lineWidth = 2;
        c.beginPath(); MP.K.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); c.restore();
      }
      // the bezier path
      if (h > 0) {
        c.strokeStyle = P.ink; c.lineWidth = 2.5; c.beginPath(); c.moveTo(S[0][0][0], S[0][0][1]);
        S.forEach(s => c.bezierCurveTo(s[1][0], s[1][1], s[2][0], s[2][1], s[3][0], s[3][1])); c.stroke();
      }
      // handles + keys
      const hv = h * (1 - 0.6 * seg(t, 2.4, 2.8));
      MP.K.forEach((p, i) => {
        const r = seg(t, 0.3 + i * 0.2, 0.5 + i * 0.2); if (r <= 0) return; const on = E.outB(r);
        if (hv > 0) {
          const a = MP.T[i], k = MP.hk * h;
          c.save(); c.globalAlpha *= hv; c.strokeStyle = P.accentD; c.lineWidth = 1.5; c.beginPath();
          const ends = [i > 0 ? [p[0] - a[0] * k, p[1] - a[1] * k] : null, i < 3 ? [p[0] + a[0] * k, p[1] + a[1] * k] : null];
          ends.forEach(e => { if (e) { c.moveTo(p[0], p[1]); c.lineTo(e[0], e[1]); } }); c.stroke();
          ends.forEach(e => { if (e) { dot(c, e[0], e[1], 6, P.ground); c.lineWidth = 2; c.beginPath(); c.arc(e[0], e[1], 6, 0, TAU); c.stroke(); } });
          c.restore();
        }
        c.save(); c.translate(p[0], p[1]); c.scale(on, on); c.rotate(PI / 4);
        c.fillStyle = P.accent; c.fillRect(-9, -9, 18, 18); c.strokeStyle = P.ink; c.lineWidth = 2; c.strokeRect(-9, -9, 18, 18); c.restore();
        label(c, 'K' + (i + 1), p[0], p[1] + (i === 1 ? -26 : 40), { align: 'center', color: P.ink, weight: 700, size: 16 });
      });
      if (t < 2.4) {
        label(c, h < 0.5 ? 'LINEAR SPATIAL  ·  HARD CORNERS' : 'BEZIER SPATIAL  ·  TANGENT HANDLES', 640, 210, { align: 'center', size: 16, color: P.ink, weight: 700, });
      }
      // spacing dots for the current pass (equal time steps)
      const D = m.t1 - m.t0, dd = u => (m.ease ? mpEase(u) : u) * tab.L;
      const run = clamp(seg(t, m.t0 - 0.25, m.t0));
      if (run > 0 && t >= MP.M[0][0] - 0.25) {
        const n = Math.round(D * 10);
        for (let k = 0; k <= n; k++) {
          if (m.t0 + k / 10 > t) break;
          const p = mpAt(tab, dd(k / n)); dot(c, p[0], p[1], 5, m.ease ? P.accentD : P.ink);
          if (m.ease) { const q = mpAt(tab, k / n * tab.L), nx = -Math.sin(q[2]), ny = Math.cos(q[2]); c.strokeStyle = 'rgba(23,24,28,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(q[0] + nx * 10, q[1] + ny * 10); c.lineTo(q[0] + nx * 20, q[1] + ny * 20); c.stroke(); }
        }
        const fade = (1 - seg(t, m.t1 + 0.05, m.t1 + 0.25)) * (m.i === 2 ? 1 : 1), fin = clamp(seg(t, m.t0 - 0.25, m.t0)), al = m.i === 2 ? fin : fin * fade;
        if (m.ease) {   // the linear ghost on the same path
          const g = mpAt(tab, m.u * tab.L);
          TK.token(c, g[0], g[1], MP.s, { rot: g[2], color: P.ground, edge: 3, alpha: al * 0.85 });
          label(c, 'LINEAR', g[0], g[1] - 84, { align: 'center', size: 14, color: P.ink, weight: 700 });
        }
        const p = mpAt(tab, dd(m.u));
        TK.token(c, p[0], p[1], MP.s, { rot: m.orient ? p[2] : 0, alpha: al });
        if (m.orient && !m.ease) {
          const ex = p[0] + Math.cos(p[2]) * 130, ey = p[1] + Math.sin(p[2]) * 130;
          c.strokeStyle = P.accentD; c.lineWidth = 3; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(ex, ey); c.stroke();
          arrowHead(c, ex, ey, p[2], 14, P.accentD);
          label(c, 'TANGENT', ex + 12, ey + 28, { size: 14, color: P.accentD, weight: 700 });
        }
        if (m.ease) label(c, 'EASED', p[0], p[1] + 96, { align: 'center', size: 14, color: P.accentD, weight: 700 });
        if (!m.orient) { c.strokeStyle = 'rgba(23,24,28,0.5)'; c.lineWidth = 2; c.setLineDash([4, 5]); c.beginPath(); c.moveTo(p[0], p[1] - 90); c.lineTo(p[0], p[1] + 90); c.stroke(); c.setLineDash([]); label(c, 'UPRIGHT', p[0] + 14, p[1] - 76, { size: 14, color: P.ink }); }
      }
      mpGraph(c, t, tab, m);
      tag(c, '01  ·  WHERE: KEY POSITIONS + SPATIAL HANDLES', 72, 104, win(t, 0.2, 2.3));
      tag(c, '02  ·  FOLLOW THE PATH  ·  AUTO-ORIENT OFF', 72, 104, win(t, 2.3, 4.8));
      tag(c, '03  ·  AUTO-ORIENT ON  ·  ROTATE ALONG THE PATH', 72, 104, win(t, 4.8, 7.2));
      tag(c, '04  ·  SAME PATH, NEW SPEED GRAPH', 72, 104, win(t, 7.2, 10.4));
      if (t > 7.2) label(c, 'DOTS EVERY 0.1 S  ·  TICKS = LINEAR', 72, 140, { size: 15, alpha: 1 });
      else if (t > 2.3) label(c, `PATH LENGTH ${Math.round(tab.L)} PX  ·  DOTS EVERY 0.1 S`, 72, 140, { size: 15 });
      TK.caption(c, t, W, H, { name: 'Motion Path', cat: 'Timing', curve: m.ease ? mpEase : (u => u), span: [m.t0, m.t1], lo: -0.1, hi: 1.15, curveLabel: 'DISTANCE ALONG PATH / TIME' });
    },
    score(A) {
      TK.bed(A);
      [60, 64, 67, 72].forEach((n, i) => A.pluck(0.3 + i * 0.2, midi(n), { g: 0.15, dur: 0.8, bright: 0.55, rev: 0.3, pan: -0.6 + i * 0.4 }));
      A.osc(1.3, { type: 'triangle', f: midi(55), f2: midi(67), glide: 0.8, dur: 1.0, g: 0.05, a: 0.1, lp: 2000, rev: 0.4 });
      A.bell(2.1, midi(79), { g: 0.06, dur: 1.2, rev: 0.5 });
      const tab = mpTable();
      MP.M.forEach(([t0, t1, kind], mi) => {
        const D = t1 - t0, ease = kind === 'ease', n = 10;
        for (let i = 0; i < n; i++) {   // travel noise panned with x, louder where faster
          const u = (i + 0.5) / n, v = ease ? 6 * u * (1 - u) : 1, x = mpAt(tab, (ease ? mpEase(u) : u) * tab.L)[0];
          A.noise(t0 + i * D / n, { type: 'bandpass', f: 500 + 700 * v, q: 1.2, dur: D / n * 1.6, g: 0.05 * clamp(v, 0.15, 1.5), swell: 0.5, pan: (x / 1920 - 0.5) * 1.4, rev: 0.2 });
        }
        tab.key.forEach((d, k) => {   // a pluck as the Token passes each key
          const ul = d / tab.L, u = ease ? (k === 0 ? 0 : k === 3 ? 1 : mpInv(ul)) : ul;
          A.pluck(t0 + u * D, midi([60, 64, 67, 72][k] + (mi === 1 ? 12 : 0)), { g: 0.13, dur: 0.7, bright: 0.5, rev: 0.3, pan: (MP.K[k][0] / 1920 - 0.5) * 1.2 });
          if (ease) A.hat(t0 + ul * D, 0.05, false, { pan: (MP.K[k][0] / 1920 - 0.5) * 1.2 });
        });
      });
      A.chord(9.5, [60, 64, 67, 72], { type: 'triangle', dur: 0.8, g: 0.04, lp: 2400, width: 0.8, rev: 0.5 });
    },
  });

  /* =====================================================================
     PAN & TILT — the camera turns on its nodal point and does not move.
     The set is laid out by direction (azimuth, elevation) and distance; a
     rotation only shifts every direction by the same angle, so screen
     position = f × (direction − camera angle), whatever the distance. A
     near Token and a far ink Token that overlap keep exactly the same
     overlap through a slow pan (the opposite of Parallax and Dolly, where
     the camera translates). A plan view shows the view cone turning about
     the fixed camera with the rays to both Tokens unchanged. A fast whip
     back is shown sampled at 24 fps — each frame held, the previous one
     ghosting — with a readout of degrees per second, pixels per frame and
     seconds to cross the frame against the 7-second rule of thumb; then a
     side view as the camera tilts up to reveal MOTION high on the far wall.
     ===================================================================== */
  const PN = { F: 1371, cx: 960, cy: 540, fps: 24,
    pan: [[0, 0], [0.8, 0], [3.6, 0.36, E.ioS], [4.2, 0.36], [5.0, -0.36, E.ioS]], tilt: [[0, 0], [5.9, 0], [8.1, 0.45, E.ioS]],
    near: { az: 0, el: -0.06, d: 3, S: 0.6 }, far: { az: 0.12, el: -0.02, d: 9, S: 1.2 }, word: { az: -0.36, el: 0.48, d: 10 } };
  const pnPan = t => kf(t, PN.pan), pnTilt = t => kf(t, PN.tilt);
  const pnX = (az, psi) => PN.cx + PN.F * (az - psi), pnY = (el, th) => PN.cy + PN.F * (th - el);
  const PN_ROW = Array.from({ length: 12 }, (_, k) => ({ az: -1.25 + k * 0.23, el: -0.13, d: 10, S: 1.15, rot: (k % 3 - 1) * 0.25 }));
  const pnJudder = t => t > 4.15 && t < 5.15;

  function pnScene(c, W, H, psi, th, objOnly, ghost) {
    if (!objOnly) TK.stage(c, W, H, { ox: -PN.F * psi, oy: PN.F * th, floor: pnY(-0.2, th) });
    if (ghost !== undefined) { c.save(); c.globalAlpha = 0.32; pnScene(c, W, H, ghost, th, true); c.restore(); }
    // far wall flats: posts every 0.3 rad
    c.fillStyle = 'rgba(23,24,28,0.08)';
    for (let k = -5; k <= 5; k++) { const x = pnX(k * 0.3 + 0.15, psi); if (x > -20 && x < W + 20) c.fillRect(x - 3, pnY(0.6, th), 6, pnY(-0.2, th) - pnY(0.6, th)); }
    PN_ROW.forEach(o => { const x = pnX(o.az, psi); if (x > -200 && x < W + 200) TK.token(c, x, pnY(o.el, th), PN.F * o.S / o.d, { rot: o.rot, color: '#f2b79f' }); });
    TK.word(c, pnX(PN.word.az, psi), pnY(PN.word.el, th), { size: 150, ls: 8 });
    const f = PN.far, n = PN.near;
    TK.token(c, pnX(f.az, psi), pnY(f.el, th), PN.F * f.S / f.d, { rot: 0.2, color: P.ink });
    TK.token(c, pnX(n.az, psi), pnY(n.el, th), PN.F * n.S / n.d, { rot: -0.08 });
  }

  function pnPlan(c, t, psi, a) {
    if (a <= 0.01) return;
    const x0 = 72, y0 = 170, w = 430, h = 300, cx = x0 + w / 2, cy = y0 + h - 34, k = 21;
    c.save(); c.globalAlpha *= a;
    box(c, x0, y0, w, h);
    label(c, 'PLAN VIEW  ·  PAN', x0 + 16, y0 + 28, { size: 14, color: P.ink, weight: 700 });
    c.save(); c.beginPath(); c.rect(x0 + 1, y0 + 40, w - 2, h - 41); c.clip();
    const P2 = (az, d) => [cx + Math.sin(az) * d * k, cy - Math.cos(az) * d * k];
    // view cone (70° horizontal)
    const R = 260;
    c.fillStyle = 'rgba(255,90,31,0.12)'; c.beginPath(); c.moveTo(cx, cy);
    c.arc(cx, cy, R, -PI / 2 + psi - 0.61, -PI / 2 + psi + 0.61); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(198,62,12,0.6)'; c.lineWidth = 1.5; c.stroke();
    // rays to the near and far Tokens: fixed
    [PN.near, PN.far].forEach(o => { const p = P2(o.az, o.d + 1); c.setLineDash([3, 5]); c.strokeStyle = 'rgba(23,24,28,0.45)'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(p[0], p[1]); c.stroke(); c.setLineDash([]); });
    PN_ROW.forEach(o => { const p = P2(o.az, o.d); dot(c, p[0], p[1], 5, '#e9a487'); });
    const pw = P2(PN.word.az, PN.word.d); c.fillStyle = P.ink; c.fillRect(pw[0] - 14, pw[1] - 4, 28, 8);
    label(c, 'MOTION (HIGH)', pw[0] - 20, pw[1] + 22, { size: 11, align: 'center', color: P.ink });
    const pf = P2(PN.far.az, PN.far.d), pn = P2(PN.near.az, PN.near.d);
    c.fillStyle = P.ink; c.fillRect(pf[0] - 8, pf[1] - 8, 16, 16);
    c.fillStyle = P.accent; c.fillRect(pn[0] - 10, pn[1] - 10, 20, 20);
    label(c, 'FAR', pf[0] + 14, pf[1] + 5, { size: 11, color: P.ink });
    label(c, 'NEAR', pn[0] + 16, pn[1] + 5, { size: 11, color: P.ink });
    c.restore();
    // camera body rotating about its nodal point, rotation arrow
    c.save(); c.translate(cx, cy); c.rotate(psi);
    c.fillStyle = P.ink; c.fillRect(-12, -6, 24, 18); c.beginPath(); c.moveTo(-7, -6); c.lineTo(7, -6); c.lineTo(10, -16); c.lineTo(-10, -16); c.closePath(); c.fill();
    c.restore();
    dot(c, cx, cy, 3.5, P.accent);
    const vel = (pnPan(t + 0.02) - pnPan(t - 0.02)) / 0.04;
    if (Math.abs(vel) > 0.02) {
      const s = Math.sign(vel), a0 = -PI / 2 + psi, a1 = a0 + s * 0.7;
      c.strokeStyle = P.accentD; c.lineWidth = 2.5; c.beginPath(); c.arc(cx, cy, 34, Math.min(a0, a1), Math.max(a0, a1)); c.stroke();
      arrowHead(c, cx + Math.cos(a1) * 34, cy + Math.sin(a1) * 34, a1 + s * PI / 2, 10, P.accentD);
    }
    label(c, 'NODAL POINT FIXED  ·  RAYS UNCHANGED', x0 + w / 2, y0 + h + 26, { size: 13, align: 'center', color: P.ink });
    c.restore();
  }

  function pnSide(c, t, th, a) {
    if (a <= 0.01) return;
    const x0 = 72, y0 = 170, w = 430, h = 300, cx = x0 + 60, cy = y0 + 200, k = 21;
    c.save(); c.globalAlpha *= a;
    box(c, x0, y0, w, h);
    label(c, 'SIDE VIEW  ·  TILT', x0 + 16, y0 + 28, { size: 14, color: P.ink, weight: 700 });
    c.save(); c.beginPath(); c.rect(x0 + 1, y0 + 40, w - 2, h - 41); c.clip();
    const P2 = (el, d) => [cx + Math.cos(el) * d * k, cy - Math.sin(el) * d * k];
    const vf = 540 / PN.F;
    c.fillStyle = 'rgba(255,90,31,0.12)'; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, 300, -th - vf, -th + vf); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(198,62,12,0.6)'; c.lineWidth = 1.5; c.stroke();
    c.strokeStyle = 'rgba(23,24,28,0.3)'; c.beginPath(); c.moveTo(x0, P2(-0.2, 10)[1]); c.lineTo(x0 + w, P2(-0.2, 10)[1]); c.stroke();
    const pw = P2(PN.word.el, PN.word.d); c.fillStyle = P.ink; c.fillRect(pw[0] - 4, pw[1] - 14, 8, 28);
    label(c, 'MOTION', pw[0] - 14, pw[1] + 5, { size: 11, align: 'right', color: P.ink });
    const pr = P2(-0.13, 10); dot(c, pr[0], pr[1], 5, '#e9a487');
    const pf = P2(PN.far.el, PN.far.d), pn = P2(PN.near.el, PN.near.d);
    c.fillStyle = P.ink; c.fillRect(pf[0] - 6, pf[1] - 6, 12, 12); c.fillStyle = P.accent; c.fillRect(pn[0] - 8, pn[1] - 8, 16, 16);
    c.restore();
    c.save(); c.translate(cx, cy); c.rotate(-th); c.fillStyle = P.ink; c.fillRect(-12, -9, 22, 18); c.beginPath(); c.moveTo(10, -6); c.lineTo(10, 6); c.lineTo(20, 10); c.lineTo(20, -10); c.closePath(); c.fill(); c.restore();
    dot(c, cx, cy, 3.5, P.accent);
    label(c, 'SAME PIVOT  ·  HORIZONTAL AXIS', x0 + w / 2, y0 + h + 26, { size: 13, align: 'center', color: P.ink });
    c.restore();
  }

  function pnReadout(c, t, psi, th) {
    const x0 = 1380, y0 = 64, w = 468, h = 268;
    box(c, x0, y0, w, h);
    label(c, 'CAMERA', x0 + 20, y0 + 32, { size: 14, color: P.ink, weight: 700 });
    label(c, `PAN  ${(psi * 180 / PI).toFixed(1)}°    TILT  ${(th * 180 / PI).toFixed(1)}°`, x0 + w - 20, y0 + 32, { size: 14, align: 'right', color: P.ink });
    const tilting = t > 5.6, fn = tilting ? pnTilt : pnPan;
    const w1 = Math.abs(fn(t + 0.01) - fn(t - 0.01)) / 0.02, deg = w1 * 180 / PI, pxs = w1 * PN.F, ppf = pxs / PN.fps;
    const span = tilting ? 1080 : 1920, cross = pxs > 1 ? span / pxs : Infinity;
    label(c, 'SPEED', x0 + 20, y0 + 76, { size: 13 });
    text(c, `${deg.toFixed(1)}°/s`, x0 + 20, y0 + 114, { font: TK.FONT, weight: 800, size: 38, color: P.ink });
    label(c, `@ ${PN.fps} FPS`, x0 + 250, y0 + 76, { size: 13 });
    text(c, `${ppf.toFixed(0)} px/frame`, x0 + 250, y0 + 114, { font: TK.FONT, weight: 800, size: 30, color: P.ink });
    label(c, `CROSSES THE FRAME IN  ${cross === Infinity ? '—' : cross.toFixed(1) + ' S'}`, x0 + 20, y0 + 156, { size: 14, color: P.ink });
    // meter: frame-crossing speed, rule of thumb at 7 s
    const bx = x0 + 20, by = y0 + 186, bw = w - 40, maxS = 2400, X = v => bx + clamp(v / maxS) * bw;
    c.fillStyle = 'rgba(47,91,255,0.15)'; c.fillRect(bx, by, X(span / 7) - bx, 14);
    c.fillStyle = 'rgba(255,90,31,0.18)'; c.fillRect(X(span / 7), by, X(span / 2) - X(span / 7), 14);
    c.fillStyle = 'rgba(198,62,12,0.45)'; c.fillRect(X(span / 2), by, bx + bw - X(span / 2), 14);
    c.fillStyle = P.ink; c.fillRect(X(span / 7) - 1, by - 6, 2, 26);
    label(c, '7 S RULE', X(span / 7), by + 38, { size: 12, align: 'center', color: P.ink });
    c.fillStyle = P.ink; c.beginPath(); c.moveTo(X(pxs), by - 2); c.lineTo(X(pxs) - 8, by - 14); c.lineTo(X(pxs) + 8, by - 14); c.closePath(); c.fill();
    const status = pxs < 1 ? 'HOLD' : cross >= 7 ? 'SMOOTH' : cross >= 2 ? 'CAUTION' : 'JUDDER';
    label(c, status, x0 + w - 20, y0 + 248, { size: 18, align: 'right', weight: 700, color: status === 'JUDDER' ? P.accentD : P.ink });
    label(c, 'SAFE  ·  STROBES', bx, y0 + 248, { size: 12 });
  }

  MG.film({
    id: 'techpan', dur: 10, poster: 2.4,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Pan & Tilt', sub: 'The camera turns on a fixed point', era: '1890s —',
      origin: 'Panning, short for panorama, arrived when cameras were first mounted on heads that could turn: early actuality films around 1896–1900 swept across crowds and landscapes, and geared and later fluid heads made smooth pans and tilts routine. Because the camera only rotates (ideally about the lens’s nodal point) nothing shows parallax; every object shifts by the same angle, which is why panoramas can be stitched and why a fast pan at 24 frames a second strobes. Cinematographers’ handbooks such as the American Cinematographer Manual give pan-speed tables; the common rule of thumb is that an object should take about seven seconds to cross the frame.',
      works: 'The Great Train Robbery (Edwin S. Porter, 1903) · Lawrence of Arabia (David Lean, 1962) · American Cinematographer Manual (ASC, pan-speed tables)',
      tech: ['Rotation about the nodal point', 'Screen shift = focal × angle, depth-free', 'Pan speed vs frame rate'],
      accent: '#ff5a1f',
      motionDNA: 'A held frame, a slow eased pan right in which every object slides together and a near Token stays locked over a far one, a beat of rest, then a whip back that steps in held 24 fps frames with a ghost of the last, and after a pause a long eased tilt that drops the Tokens out of frame and lifts MOTION into the centre.',
      visualDNA: 'The Technique Atlas stage as a wide set: pale Token copies along a far wall with faint posts, the ink far Token behind the orange near Token, MOTION high on the wall; a boxed plan view with a rotating orange view cone and fixed rays, swapped for a side view during the tilt, and a camera readout box with speed, pixels per frame and a seven-second meter.',
      transitions: 'Pan, whip pan with strobing, plan view crossfades to side view, tilt up and hold',
      implementation: ['Fluid or geared head; After Effects one-node camera rotation or 2D position on a panorama', 'Every object offset by focal length × camera angle, independent of distance', 'Canvas 2D: cylindrical projection; whip pan sampled at 24 fps with the previous frame ghosted'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const jd = pnJudder(t), tq = jd ? Math.floor(t * PN.fps) / PN.fps : t, psi = pnPan(tq), th = pnTilt(t);
      // during the whip the eye still holds the last 24 fps frame: ghost it under the new one
      pnScene(c, W, H, psi, th, false, jd ? pnPan(tq - 1 / PN.fps) : undefined);
      if (jd) label(c, `24 FPS  ·  FRAME ${Math.floor(t * PN.fps)}  ·  EACH FRAME HELD, LAST ONE GHOSTED`, 72, 140, { size: 15, color: P.ink });
      // the locked overlap of near and far
      const ov = win(t, 0.5, 4.1);
      if (ov > 0) {
        const xn = pnX(PN.near.az, psi), xf = pnX(PN.far.az, psi), y = 360;
        c.save(); c.globalAlpha *= ov;
        c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(xn, y + 10); c.lineTo(xn, y - 10); c.moveTo(xn, y); c.lineTo(xf, y); c.moveTo(xf, y + 10); c.lineTo(xf, y - 10); c.stroke();
        label(c, `NEAR ↔ FAR  ${Math.round(xf - xn)} PX  ·  NEVER CHANGES`, (xn + xf) / 2, y - 22, { size: 15, align: 'center', color: P.ink, weight: 700 });
        label(c, 'NEAR  d 3', xn - 30, 830, { size: 14, align: 'right', color: P.ink });
        label(c, 'FAR  d 9', xf + 110, 470, { size: 14, color: P.ink });
        c.restore();
      }
      const pv = clamp(seg(t, 0.3, 0.7)) * (1 - seg(t, 5.5, 5.9)), sv = seg(t, 5.6, 6.0);
      pnPlan(c, t, psi, pv);
      pnSide(c, t, th, sv);
      pnReadout(c, jd ? tq : t, psi, th);
      tag(c, '01  ·  PAN  ·  THE CAMERA TURNS, IT DOES NOT TRAVEL', 72, 104, win(t, 0.2, 4.1));
      tag(c, '02  ·  WHIP PAN  ·  TOO FAST FOR 24 FPS', 72, 104, win(t, 4.1, 5.6));
      tag(c, '03  ·  TILT  ·  THE SAME TURN, VERTICAL', 72, 104, win(t, 5.6, 10.4));
      if (t > 8.1) label(c, 'TILT UP  ·  REVEAL', pnX(PN.word.az, psi), pnY(PN.word.el, th) + 110, { size: 16, align: 'center', color: P.ink, alpha: 1 });
      if (t < 5.6) TK.caption(c, t, W, H, { name: 'Pan & Tilt', cat: 'Camera', curve: u => pnPan(u * 5.6) / 0.36, span: [0, 5.6], lo: -1.3, hi: 1.3, curveLabel: 'PAN ANGLE / TIME' });
      else TK.caption(c, t, W, H, { name: 'Pan & Tilt', cat: 'Camera', curve: u => pnTilt(5.6 + u * 4.4) / 0.45, span: [5.6, 10], lo: -0.1, hi: 1.15, curveLabel: 'TILT ANGLE / TIME' });
    },
    score(A) {
      TK.bed(A);
      // slow pan: an airy sweep panned left to right
      for (let i = 0; i < 8; i++) {
        const s = lerp(0.8, 3.6, i / 8), d = 2.8 / 8, v = Math.sin(PI * (i + 0.5) / 8);
        A.noise(s, { type: 'bandpass', f: 400 + v * 500, q: 1.1, dur: d * 1.7, g: 0.05 * clamp(v, 0.2, 1), swell: 0.5, pan: lerp(-0.6, 0.6, i / 7), rev: 0.25 });
      }
      A.pluck(0.5, midi(64), { g: 0.13, dur: 0.9, bright: 0.45, rev: 0.3, pan: -0.2 });
      A.pluck(3.6, midi(67), { g: 0.15, dur: 0.9, bright: 0.5, rev: 0.3, pan: 0.5 });
      // whip pan: a whoosh plus a click on every held 24 fps frame (the judder)
      A.whoosh(4.15, 0.9, { f1: 600, f2: 4000, q: 1.6, g: 0.16, swell: 0.5, pan: -0.3 });
      for (let k = Math.ceil(4.2 * PN.fps); k < 5.0 * PN.fps; k++) A.hat(k / PN.fps, 0.035, false, { f: 5000, pan: lerp(0.6, -0.6, (k / PN.fps - 4.2) / 0.8) });
      A.impact(5.0, 0.18, { rev: 0.4 });
      A.pluck(5.0, midi(60), { g: 0.16, dur: 0.9, bright: 0.6, rev: 0.3, pan: -0.5 });
      // tilt: a slow rising glide, then the reveal
      A.osc(5.9, { type: 'triangle', f: midi(48), f2: midi(60), glide: 2.2, dur: 2.4, g: 0.05, a: 0.6, lp: 1400, rev: 0.4 });
      A.riser(6.9, 1.2, { g: 0.06, f: 110 });
      A.chord(8.1, [60, 64, 67, 72], { type: 'triangle', dur: 1.8, g: 0.045, a: 0.03, lp: 2600, rev: 0.6, width: 0.8 });
      A.bell(8.1, midi(84), { g: 0.06, dur: 1.6, rev: 0.5 });
      A.kick(8.1, 0.3, { f: 100, f2: 40 });
    },
  });
})();
