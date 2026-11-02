/* batch k6 — Technique Atlas · Transitions · Timing: techmatchcut · techdisplace · techovershoot.
   techmatchcut (hard cuts that carry a shape, a position or an action across: the spinning Token
   cuts to a dial with the same silhouette and spin, the dial's porthole to a sun of the same size,
   the horizon to a floor, and a toss started in a wide shot lands in a close one) ·
   techdisplace (a displacement-map transition: Token states pushed apart by the luminance of a
   noise map, a gradient and a ripple, computed at half resolution on a small offscreen canvas) ·
   techovershoot (ease-out-back: one pass past the target and back, in five lanes of increasing
   strength, then on scale, rotation and position). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, hash, midi, text, offscreen } = MG;
  const TK = MG.TK, P = TK.P, PI = Math.PI, BEAT = TK.BEAT;

  /* ---------------- shared helpers ---------------- */
  const label = (c, s, x, y, o = {}) => {
    if (o.alpha !== undefined) { if (o.alpha <= 0.005) return; c.save(); c.globalAlpha *= o.alpha; }
    text(c, s, x, y, { font: TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
    if (o.alpha !== undefined) c.restore();
  };
  const tag = (c, s, x, y, on = 1) => {   // small accent dot + mono label, top-left of frame
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: P.ink, weight: 700, size: 20 });
    c.restore();
  };
  // geometry of the caption's value/time graph (mirrors TK.caption) for extra marks drawn under it
  const GR = { x: 1920 - 72 - 240, y: 1080 - 52 - 120, w: 240, h: 120 };
  const grY = (v, lo, hi) => GR.y + GR.h - (v - lo) / (hi - lo) * GR.h;
  function grCut(c, u, s = 'CUT') {
    const x = GR.x + u * GR.w;
    c.save(); c.strokeStyle = P.accent; c.lineWidth = 2; c.setLineDash([4, 4]);
    c.beginPath(); c.moveTo(x, GR.y + 4); c.lineTo(x, GR.y + GR.h - 4); c.stroke(); c.restore();
    label(c, s, x + 6, GR.y + GR.h - 8, { size: 12, ls: 1, color: P.accentD, weight: 700 });
  }

  /* =====================================================================
     MATCH CUT — six shots, five hard cuts, every cut on the beat. Each cut
     keeps something constant across the splice: the Token spinning at
     centre cuts to an ink dial with the same silhouette, mid-spin at the
     same angle and speed (graphic match); the camera pushes into the dial's
     porthole, which cuts to a sun of the same position and size; the sun
     sets onto a horizon that cuts to the floor line, the Token where the
     sun went down; the Token is tossed in the wide shot and the cut lands
     mid-rise — the toss finishes in a close shot (action match); the
     landed Token cuts to a title with the Token in the same place. The
     matched outline is carried over each cut as a dashed accent guide, and
     a shot strip top-right marks every splice on the beat grid.
     ===================================================================== */
  const MC_CUT = [1.5, 3.5, 5.0, 6.5, 8.5];
  const MC_SHOT = ['TOKEN', 'DIAL', 'SUN', 'WIDE', 'CLOSE', 'TITLE'];
  const MC_MATCH = ['SILHOUETTE + ROTATION', 'POSITION + SIZE', 'HORIZON → FLOOR', 'ACTION · CUT MID-TOSS', 'POSITION + SIZE'];
  const MC_C = [960, 470], MC_S = 340;
  const MC_W0 = TAU / 2.25;                              // spin speed: stops exactly at one turn by 3.0 s
  function mcSpin(t) {
    if (t <= 1.5) return MC_W0 * t;
    const v = Math.min(t, 3) - 1.5;
    return MC_W0 * (1.5 + v - v * v / 3);
  }
  const MC_HOLE = [MC_C[0] + TK.HOLE.x * MC_S, MC_C[1] + TK.HOLE.y * MC_S];
  const MC_SUN = { x: 960, y: 430, r: 110 };
  const MC_PUSH = MC_SUN.r / (TK.HOLE.r * MC_S);
  // the toss (world units of the wide shot): launch at 6.0, land at 7.5
  const MC_T = { x0: 960, x1: 1400, h: 240, s: 160, t0: 6.0, t1: 7.5, fl: TK.FLOOR };
  const MC_CL = { k: 1.6, fx: 1400, fy: 800, sx: 960, sy: 860 };   // close shot camera
  function mcToss(t) {
    const T = MC_T, u = seg(t, T.t0, T.t1);
    let x = lerp(T.x0, T.x1, E.ioS(u) * 0.3 + u * 0.7), h = 4 * T.h * u * (1 - u), sy = 1, rot = u * PI / 2;
    if (t < T.t0) { const a = seg(t, 5.45, T.t0); sy = 1 - 0.2 * Math.sin(a * PI / 2) * (a < 1 ? 1 : 0); }
    if (t >= T.t0 && t < T.t0 + 0.12) sy = lerp(0.8, 1.12, seg(t, T.t0, T.t0 + 0.12));
    else if (t >= T.t0 + 0.12 && t < T.t1) sy = lerp(1.12, 1, seg(t, T.t0 + 0.12, T.t0 + 0.5));
    if (t >= T.t1) { const l = seg(t, T.t1, T.t1 + 0.45); sy = 1 - 0.22 * Math.sin(l * PI) * (1 - l); }
    return { x, y: T.fl - T.s * sy / 2 - h, h, sy, sx: 1 / Math.sqrt(sy), rot };
  }
  const mcHeight = t => { const p = mcToss(t); return (p.h - MC_T.s * (1 - p.sy) / 2) / MC_T.h; };
  function mcTokenW(c, p, o = {}) {   // world-space Token, scaled about its base
    c.save(); c.translate(p.x, MC_T.fl - p.h); c.scale(p.sx, p.sy); c.translate(0, -MC_T.s / 2);
    if (o.ghost) { c.rotate(p.rot); TK.tokenPath(c, MC_T.s); c.setLineDash([6, 6]); c.lineWidth = 2.5 / p.sy; c.strokeStyle = o.ghost; c.stroke(); }
    else TK.token(c, 0, 0, MC_T.s, { rot: p.rot });
    c.restore();
  }
  function mcPath(c, ta, tb, dash, col, lw) {
    c.save(); c.setLineDash(dash); c.lineCap = 'round'; c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
    for (let i = 0; i <= 40; i++) { const p = mcToss(lerp(ta, tb, i / 40)); i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y); }
    c.stroke(); c.restore();
  }
  function mcDial(c, x, y, s, rot) {
    c.save(); c.translate(x, y); c.rotate(rot);
    TK.tokenPath(c, s); c.fillStyle = P.ink; c.fill('evenodd');
    const hx = TK.HOLE.x * s, hy = TK.HOLE.y * s, hr = TK.HOLE.r * s;
    c.fillStyle = P.blue; c.beginPath(); c.arc(hx, hy, hr * 0.8, 0, TAU); c.fill();
    c.strokeStyle = P.ground; c.lineWidth = s * 0.018; c.beginPath(); c.arc(hx, hy, hr * 0.9, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = s * 0.012; c.beginPath(); c.arc(hx, hy, hr * 0.6, PI * 1.1, PI * 1.45); c.stroke();
    c.fillStyle = P.ground; [-0.3, -0.18, -0.06].forEach(k => { c.beginPath(); c.arc(k * s, 0.3 * s, 0.032 * s, 0, TAU); c.fill(); });
    c.fillStyle = P.mute; c.fillRect(-0.36 * s, -0.33 * s, 0.3 * s, 0.05 * s);
    c.fillStyle = P.accent; c.beginPath(); c.arc(0.27 * s, 0.3 * s, 0.05 * s, 0, TAU); c.fill();
    c.restore();
  }
  function mcGuideTok(c, x, y, s, rot, a) {
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(rot);
    TK.tokenPath(c, s); c.setLineDash([12, 9]); c.lineWidth = 4; c.strokeStyle = P.accent; c.stroke();
    c.restore();
  }
  function mcGuideCirc(c, x, y, r, a) {
    c.save(); c.globalAlpha *= a; c.setLineDash([12, 9]); c.lineWidth = 4; c.strokeStyle = P.accent;
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    c.setLineDash([]); c.lineWidth = 2; c.beginPath(); c.moveTo(x - 18, y); c.lineTo(x + 18, y); c.moveTo(x, y - 18); c.lineTo(x, y + 18); c.stroke();
    c.restore();
  }
  // guide visibility around cut i: in for half a second before, carried for 0.6 s after
  const mcGuide = (t, i) => { const tc = MC_CUT[i]; return t < tc ? seg(t, tc - 0.5, tc - 0.3) : 1 - seg(t, tc + 0.35, tc + 0.65); };
  function mcStrip(c, t, k) {
    const x0 = 1920 - 72 - 600, w = 600, y = 64, h = 30, X = s => x0 + w * s / 10;
    label(c, 'SHOTS  ·  CUTS ON THE BEAT', x0, y - 14, { size: 13, ls: 2 });
    const bounds = [0, ...MC_CUT, 10];
    for (let i = 0; i < 6; i++) {
      const a = X(bounds[i]), b = X(bounds[i + 1]), cur = i === k;
      c.fillStyle = cur ? P.ink : i % 2 ? 'rgba(23,24,28,0.12)' : 'rgba(23,24,28,0.06)';
      c.fillRect(a, y, b - a, h);
      label(c, String(i + 1), (a + b) / 2, y + h / 2 + 1, { align: 'center', base: 'middle', size: 14, ls: 0, weight: 700, color: cur ? P.ground : P.mute });
    }
    c.fillStyle = 'rgba(23,24,28,0.3)';
    for (let b = 0; b <= 20; b++) c.fillRect(X(b * BEAT) - 0.5, y + h + 3, 1, b % 4 ? 4 : 8);
    MC_CUT.forEach(tc => {
      c.fillStyle = P.accent; c.fillRect(X(tc) - 1.5, y - 5, 3, h + 10);
      c.beginPath(); c.moveTo(X(tc), y - 12); c.lineTo(X(tc) + 6, y - 5); c.lineTo(X(tc) - 6, y - 5); c.closePath(); c.fill();
    });
    c.fillStyle = P.ink; c.fillRect(X(t) - 1, y - 4, 2, h + 18);
  }

  MG.film({
    id: 'techmatchcut', dur: 10, poster: 3.62,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Match Cut', sub: 'A hard cut that carries a shape or an action across', era: '1920s —',
      origin: 'Soviet montage and the silent avant-garde treated the splice itself as a tool, and editors soon learned that a cut disappears, or rhymes, when something carries across it: a shape, a position, a direction, a movement. The graphic match is the showpiece — Stanley Kubrick’s bone tossed into the air that becomes an orbiting satellite in 2001: A Space Odyssey (1968) — while the humbler cut on action, which finishes a movement in the next shot, is the everyday glue of continuity editing.',
      works: '2001: A Space Odyssey (Stanley Kubrick, 1968; bone-to-satellite cut) · Lawrence of Arabia (David Lean, 1962; match-to-sunrise cut) · Psycho (Alfred Hitchcock, 1960; plughole-to-eye match dissolve)',
      tech: ['Graphic match on silhouette and spin', 'Position and size match', 'Cut on action'],
      accent: '#ff5a1f',
      motionDNA: 'Five hard cuts, all on the beat at 1.5, 3.5, 5, 6.5 and 8.5 s. Motion continues through each splice: the spin keeps its angle and speed and only slows in the second shot, a push-in delivers the porthole at the sun’s exact size, the horizon becomes the floor at the same height, and a toss launched in the wide shot is cut a third of the way up and lands in the close shot.',
      visualDNA: 'The Technique Atlas stage, the orange Token, an ink dial with a blue porthole, an orange striped sun on a horizon; dashed orange guide outlines laid over the outgoing shot and carried into the incoming one; a dotted toss path split at the cut point; a numbered shot strip with beat ticks and accent cut markers.',
      transitions: 'Graphic match cut, position match cut, horizon-to-floor match, cut on action',
      implementation: ['Picture editing (Avid, Premiere, Resolve) with onion-skin overlays to line up the match', 'After Effects: guide layers and parented nulls across comps', 'Canvas 2D: one draw function per shot, switched on beat-aligned cut times'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      let k = 0; MC_CUT.forEach((tc, i) => { if (t >= tc) k = i + 1; });
      const th = mcSpin(t);
      if (k === 0) {
        TK.stage(c, W, H);
        TK.token(c, MC_C[0], MC_C[1], MC_S, { rot: th });
        mcGuideTok(c, MC_C[0], MC_C[1], MC_S, th, mcGuide(t, 0));
      } else if (k === 1) {
        const p = E.ioC(seg(t, 3.0, 3.45)), z = lerp(1, MC_PUSH, p);
        const fx = lerp(MC_HOLE[0], MC_SUN.x, p), fy = lerp(MC_HOLE[1], MC_SUN.y, p);
        TK.stage(c, W, H, { z, ox: fx - MC_HOLE[0] * z, oy: fy - MC_HOLE[1] * z });
        c.save(); c.translate(fx, fy); c.scale(z, z); c.translate(-MC_HOLE[0], -MC_HOLE[1]);
        mcDial(c, MC_C[0], MC_C[1], MC_S, th);
        c.restore();
        mcGuideTok(c, MC_C[0], MC_C[1], MC_S, th, mcGuide(t, 0));
        mcGuideCirc(c, fx, fy, TK.HOLE.r * MC_S * z, mcGuide(t, 1));
        if (p > 0 && p < 1) {
          const ly = fy - TK.HOLE.r * MC_S * z - 34;
          c.fillStyle = P.accent; c.fillRect(fx - 62, ly - 20, 124, 30);
          label(c, 'PUSH IN', fx, ly + 1, { align: 'center', color: P.ground, weight: 700, size: 16, ls: 2 });
        }
      } else if (k === 2) {
        const fl = TK.FLOOR, sy = lerp(MC_SUN.y, 770, E.ioS(seg(t, 3.7, 4.95)));
        TK.stage(c, W, H, { floor: fl });
        c.save(); c.beginPath(); c.rect(0, 0, W, fl); c.clip();
        c.fillStyle = P.accent; c.beginPath(); c.arc(MC_SUN.x, sy, MC_SUN.r, 0, TAU); c.fill();
        c.beginPath(); c.arc(MC_SUN.x, sy, MC_SUN.r, 0, TAU); c.clip();
        c.fillStyle = P.ground;
        for (let i = 0; i < 5; i++) { const yy = sy + 18 + i * 19, hh = 3 + i * 2; c.fillRect(MC_SUN.x - 200, yy, 400, hh); }
        c.restore();
        mcGuideCirc(c, MC_SUN.x, MC_SUN.y, MC_SUN.r, mcGuide(t, 1));
        const g = mcGuide(t, 2);
        if (g > 0.01) {
          c.save(); c.globalAlpha = g; c.strokeStyle = P.accent; c.lineWidth = 4; c.setLineDash([14, 10]);
          c.beginPath(); c.moveTo(0, fl); c.lineTo(W, fl); c.stroke(); c.restore();
          label(c, 'HORIZON  y = 800', W - 72, fl - 16, { align: 'right', color: P.accentD, weight: 700, size: 16 });
        }
      } else if (k === 3) {
        TK.stage(c, W, H, { floor: MC_T.fl });
        const g = mcGuide(t, 2);
        if (g > 0.01) {
          c.save(); c.globalAlpha = g; c.strokeStyle = P.accent; c.lineWidth = 4; c.setLineDash([14, 10]);
          c.beginPath(); c.moveTo(0, MC_T.fl); c.lineTo(W, MC_T.fl); c.stroke(); c.restore();
          label(c, 'FLOOR  y = 800', W - 72, MC_T.fl - 16, { align: 'right', color: P.accentD, weight: 700, size: 16, alpha: g });
        }
        const p = mcToss(t);
        TK.shadow(c, p.x, MC_T.fl, MC_T.s * p.sx, p.h);
        if (t > MC_T.t0) mcPath(c, MC_T.t0, t, [2, 12], 'rgba(23,24,28,0.5)', 4);
        mcTokenW(c, p);
        const a = seg(t, 5.6, 5.8);
        if (a > 0) label(c, t < MC_T.t0 ? 'ACTION STARTS ↑' : 'ACTION STARTS', MC_T.x0, MC_T.fl + 46, { align: 'center', color: P.ink, weight: 700, size: 18 });
        const q = mcGuide(t, 3);
        if (t > 6.0 && q > 0.01) {
          const pc = mcToss(6.5);
          c.save(); c.globalAlpha = q; mcTokenW(c, pc, { ghost: P.accent }); c.restore();
          label(c, 'CUT POINT', pc.x + 100, pc.y + 6, { color: P.accentD, weight: 700, size: 16 });
        }
      } else if (k === 4) {
        const L = MC_CL;
        TK.stage(c, W, H, { floor: L.sy, z: L.k, ox: L.sx - L.fx * L.k, oy: L.sy - L.fy * L.k });
        c.save(); c.translate(L.sx, L.sy); c.scale(L.k, L.k); c.translate(-L.fx, -L.fy);
        const p = mcToss(t);
        TK.shadow(c, p.x, MC_T.fl, MC_T.s * p.sx, p.h);
        mcPath(c, MC_T.t0, 6.5, [6, 8], 'rgba(23,24,28,0.3)', 2.5);
        mcPath(c, 6.5, MC_T.t1, [1, 9], P.accent, 4);
        const pc = mcToss(6.5);
        c.fillStyle = P.accent; c.beginPath(); c.arc(pc.x, pc.y, 9, 0, TAU); c.fill();
        c.fillStyle = P.ground; c.beginPath(); c.arc(pc.x, pc.y, 4, 0, TAU); c.fill();
        const q = mcGuide(t, 3);
        if (q > 0.01) { c.save(); c.globalAlpha = q; mcTokenW(c, pc, { ghost: P.accent }); c.restore(); }
        mcTokenW(c, p);
        c.restore();
        const sx = L.sx + (pc.x - L.fx) * L.k, sy = L.sy + (pc.y - L.fy) * L.k;
        c.fillStyle = P.accentD; c.fillRect(sx - 1, sy - 186, 2, 172);
        label(c, 'CUT ON ACTION', sx, sy - 220, { align: 'center', color: P.accentD, weight: 700, size: 16 });
        label(c, 'SHOT 4 ¦ SHOT 5', sx, sy - 196, { align: 'center', size: 14 });
        if (t > MC_T.t1) label(c, 'ACTION FINISHES', L.sx, L.sy + 46, { align: 'center', color: P.ink, weight: 700, size: 18, alpha: seg(t, MC_T.t1, MC_T.t1 + 0.2) });
        mcGuideTok(c, L.sx, L.sy - MC_T.s * L.k / 2, MC_T.s * L.k, PI / 2, mcGuide(t, 4));
      } else {
        TK.stage(c, W, H);
        const y = MC_CL.sy - MC_T.s * MC_CL.k / 2, s = MC_T.s * MC_CL.k;
        TK.token(c, MC_CL.sx, y, s, { rot: PI / 2 });
        mcGuideTok(c, MC_CL.sx, y, s, PI / 2, mcGuide(t, 4));
        TK.word(c, 960, 400, { size: 150, ls: 6, alpha: E.outC(seg(t, 9.0, 9.4)) });
      }
      // shot tag, match label, cut flash
      tag(c, `SHOT ${k + 1}  ·  ${MC_SHOT[k]}`, 72, 80);
      for (let i = 0; i < MC_CUT.length; i++) {
        const g = mcGuide(t, i);
        if (g > 0.01) label(c, `MATCH  ·  ${MC_MATCH[i]}`, 98, 116, { color: P.accentD, weight: 700, size: 18, alpha: g });
      }
      if (k > 0 && t - MC_CUT[k - 1] < 0.4) label(c, `CUT ${k}  ·  BEAT ${Math.round(MC_CUT[k - 1] / BEAT) + 1}`, 98, 148, { color: P.ink, weight: 700, size: 18 });
      mcStrip(c, t, k);
      // caption graph: the matched quantity runs straight through the cut
      const spin = t < 5, lo = -0.25, hi = 1.25;
      grCut(c, 1.5 / 3.5, spin ? 'CUT 1' : 'CUT 4');
      if (spin) TK.caption(c, t, W, H, { name: 'Match Cut', cat: 'Transitions', curve: u => mcSpin(u * 3.5) / TAU, span: [0, 3.5], curveLabel: 'SPIN ANGLE / TIME', lo, hi });
      else TK.caption(c, t, W, H, { name: 'Match Cut', cat: 'Transitions', curve: u => mcHeight(5 + u * 3.5), span: [5, 8.5], curveLabel: 'TOSS HEIGHT / TIME', lo, hi });
    },
    score(A) {
      TK.bed(A);
      // the spin: a whir that carries over cut 1 and winds down in the dial shot
      A.osc(0, { type: 'sawtooth', f: 150, dur: 1.55, g: 0.025, lp: 900, vib: [6, 8], hold: true, a: 0.2 });
      A.osc(1.5, { type: 'sawtooth', f: 150, f2: 50, glide: 1.5, dur: 1.5, g: 0.025, lp: 900, lp2: 300, vib: [6, 8] });
      [1.8, 2.3, 2.75].forEach((t, i) => A.osc(t, { f: 1800 - i * 200, dur: 0.03, g: 0.05 }));
      A.riser(3.0, 0.5, { g: 0.08, f: 160 });
      // sun: a warm swell; horizon to floor
      A.chord(3.5, [52, 59, 64, 71], { type: 'sine', dur: 1.6, g: 0.035, a: 0.3, lp: 1800, rev: 0.6, width: 0.8 });
      // the toss: one whoosh bridges cut 4, so the sound carries the action across
      A.osc(5.45, { type: 'triangle', f: 160, f2: 110, glide: 0.5, dur: 0.55, g: 0.06 });
      A.whoosh(6.0, 1.5, { f1: 400, f2: 3000, q: 1.3, g: 0.16, swell: 0.35, pan: 0 });
      A.kick(7.5, 0.4, { f: 180, f2: 60, dur: 0.3 });
      A.pluck(7.5, midi(67), { g: 0.16, bright: 0.6, dur: 1 });
      // every splice: a tape-click and a note that steps up
      MC_CUT.forEach((tc, i) => {
        A.noise(tc, { type: 'highpass', f: 5000, dur: 0.02, g: 0.16 });
        A.osc(tc, { f: 120, f2: 70, dur: 0.08, g: 0.12 });
        A.pluck(tc, midi([60, 64, 67, 69, 72][i]), { g: 0.13, bright: 0.7, dur: 1.1, rev: 0.3 });
      });
      A.chord(8.5, [60, 64, 67, 72], { type: 'triangle', dur: 1.5, g: 0.04, a: 0.02, lp: 2600, rev: 0.6, width: 0.8 });
      A.bell(9.0, midi(84), { g: 0.06, dur: 1.2 });
    },
  });

  /* =====================================================================
     DISPLACEMENT — a transition driven by a greyscale map. During a move
     from state A to state B every pixel p samples A at p + k·v(p) and B
     at p − k·v(p), where v comes from the map's luminance m(p) and k
     swells and dies on a sine; a pixel switches from A to B once the
     progress u passes 0.6·m(p), so dark areas of the map flip first.
     Three maps: value-noise (diagonal push), a horizontal gradient
     (stretch and sweep), and concentric ripples (radial push). The pixel
     work runs on a 480×320 offscreen buffer covering the Token's area at
     half resolution; displacement fades to zero at the buffer's edges so
     it sits seamlessly in the stage. The current map is shown top-right
     with sampled displacement vectors.
     ===================================================================== */
  const DR = { x: 480, y: 150, w: 960, h: 640 }, DSW = 480, DSH = 320, DK = 60;   // k in buffer px (= 120 px)
  const DST = [
    { name: 'STATE A  ·  ORANGE  ·  0°', draw: c => TK.token(c, 960, 470, 340) },
    { name: 'STATE B  ·  INK  ·  90°', draw: c => TK.token(c, 960, 470, 340, { rot: PI / 2, color: P.ink }) },
    { name: 'STATE C  ·  BLUE + WORD', draw: c => { TK.token(c, 960, 360, 230, { rot: PI, color: P.blue }); TK.word(c, 960, 620, { size: 120, ls: 6 }); } },
    { name: 'STATE A  ·  ORANGE  ·  0°', draw: c => TK.token(c, 960, 470, 340) },
  ];
  // [start, end, from, to, map]
  const DT = [[1.0, 2.5, 0, 1, 0], [3.5, 5.0, 1, 2, 1], [6.0, 7.5, 2, 3, 2]];
  const DMAP = ['NOISE', 'GRADIENT', 'RIPPLE'];
  const dAmt = u => Math.sin(PI * u);
  function n2(x, y, s) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const h = (a, b) => hash(a * 57.13 + b * 131.7 + s * 17.31);
    return lerp(lerp(h(ix, iy), h(ix + 1, iy), ux), lerp(h(ix, iy + 1), h(ix + 1, iy + 1), ux), uy);
  }
  function dBuild() {
    const N = DSW * DSH, maps = [];
    const win = (x, y) => { const e = Math.min(x, DSW - 1 - x, y, DSH - 1 - y); return E.ioS(clamp(e / 50)); };
    for (let mi = 0; mi < 3; mi++) {
      const m = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N);
      let lo = 1e9, hi = -1e9;
      for (let y = 0; y < DSH; y++) for (let x = 0; x < DSW; x++) {
        const i = y * DSW + x;
        let v;
        if (mi === 0) v = n2(x / 60, y / 60, 1) * 0.6 + n2(x / 26, y / 26, 2) * 0.3 + n2(x / 11, y / 11, 3) * 0.1;
        else if (mi === 1) v = x / DSW * 0.88 + y / DSH * 0.12;
        else v = 0.5 + 0.5 * Math.cos(Math.hypot(x - DSW / 2, y - DSH * 0.5) / 22 * PI);
        m[i] = v; lo = Math.min(lo, v); hi = Math.max(hi, v);
      }
      for (let y = 0; y < DSH; y++) for (let x = 0; x < DSW; x++) {
        const i = y * DSW + x, v = (m[i] - lo) / (hi - lo), w = win(x, y);
        m[i] = v;
        if (mi === 0) { vx[i] = (v - 0.5) * 2 * 0.8 * w; vy[i] = (v - 0.5) * 2 * 0.6 * w; }
        else if (mi === 1) { vx[i] = (v - 0.5) * 2 * w; vy[i] = 0; }
        else { const dx = x - DSW / 2, dy = y - DSH / 2, d = Math.hypot(dx, dy) || 1; vx[i] = dx / d * (v - 0.5) * 2 * w; vy[i] = dy / d * (v - 0.5) * 2 * w; }
      }
      const cv = offscreen(DSW, DSH), g = cv.getContext('2d'), im = g.createImageData(DSW, DSH);
      for (let i = 0; i < N; i++) { const l = Math.round(lerp(28, 236, m[i])); im.data[i * 4] = l; im.data[i * 4 + 1] = l; im.data[i * 4 + 2] = l; im.data[i * 4 + 3] = 255; }
      g.putImageData(im, 0, 0);
      maps.push({ m, vx, vy, cv });
    }
    // state images: the stage + state, cropped to the region at half resolution
    const states = DST.map(s => {
      const cv = offscreen(DSW, DSH), g = cv.getContext('2d');
      g.scale(DSW / DR.w, DSH / DR.h); g.translate(-DR.x, -DR.y);
      TK.stage(g, 1920, 1080); s.draw(g);
      return g.getImageData(0, 0, DSW, DSH).data;
    });
    const out = offscreen(DSW, DSH), og = out.getContext('2d');
    return { maps, states, out, og, im: og.createImageData(DSW, DSH) };
  }
  function dCompose(st, tr, u) {
    const mp = st.maps[tr[4]], A = st.states[tr[2]], B = st.states[tr[3]], o = st.im.data;
    const k = DK * dAmt(u), { m, vx, vy } = mp, W1 = DSW - 1, H1 = DSH - 1;
    for (let y = 0, i = 0; y < DSH; y++) for (let x = 0; x < DSW; x++, i++) {
      const dx = vx[i] * k, dy = vy[i] * k, b = E.ioS(clamp((u - 0.6 * m[i]) / 0.4));
      let ax = Math.round(x + dx), ay = Math.round(y + dy), bx = Math.round(x - dx), by = Math.round(y - dy);
      ax = ax < 0 ? 0 : ax > W1 ? W1 : ax; ay = ay < 0 ? 0 : ay > H1 ? H1 : ay;
      bx = bx < 0 ? 0 : bx > W1 ? W1 : bx; by = by < 0 ? 0 : by > H1 ? H1 : by;
      const ja = (ay * DSW + ax) * 4, jb = (by * DSW + bx) * 4, j = i * 4;
      o[j] = A[ja] + (B[jb] - A[ja]) * b; o[j + 1] = A[ja + 1] + (B[jb + 1] - A[ja + 1]) * b; o[j + 2] = A[ja + 2] + (B[jb + 2] - A[ja + 2]) * b; o[j + 3] = 255;
    }
    st.og.putImageData(st.im, 0, 0);
    return st.out;
  }
  function dAt(t) {
    let i = 0; for (let k = 0; k < DT.length; k++) if (t >= DT[k][0] - 0.6) i = k;
    return i;
  }

  MG.film({
    id: 'techdisplace', dur: 10, poster: 6.85,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Displacement', sub: 'A greyscale map pushes pixels from one picture into the next', era: '1990s —',
      origin: 'A displacement map offsets each pixel of an image by the brightness of a second, greyscale image. Digital compositors used it for heat haze, refraction and ripples; After Effects shipped a Displacement Map effect, and motion designers turned it into a transition by animating the amount up and back down across a cut. Real-time versions became shader transitions, collected in the open-source GL Transitions library and the WebGL image sliders popular on agency sites.',
      works: 'After Effects Displacement Map effect (Adobe) · GL Transitions, open-source shader transition collection (Gaëtan Renaudeau and contributors) · WebGL hover and slider distortion effects on agency portfolio sites (2010s)',
      tech: ['Luminance map → pixel offset', 'Amount swells and dies on a sine', 'Map-ordered switch from A to B'],
      accent: '#ff5a1f',
      motionDNA: 'Three transitions, each 1.5 s, with a beat of hold between. The displacement amount rises from zero, peaks mid-transition at 120 px and falls back to zero, so both ends are clean; meanwhile the picture flips from A to B in the order the map dictates — noise in blotches, the gradient as a sweep from left to right, the ripple ring by ring.',
      visualDNA: 'The Technique Atlas stage with the Token in four states (orange, ink turned 90°, blue upside-down above MOTION, orange again); grid lines bend with the image; a greyscale inset of the current map with sampled offset arrows, a row of all three maps, a state label beneath the Token.',
      transitions: 'Noise-map displacement, gradient-map displacement, ripple-map displacement',
      implementation: ['After Effects Displacement Map / Turbulent Displace across a cut', 'GLSL transition shader: texture2D(from, uv + m·k·p), texture2D(to, uv − m·k·(1−p))', 'Canvas 2D: per-pixel offsets on a 480×320 offscreen buffer scaled into the frame'],
      reproducibility: 'Fully procedural',
      loopable: true,
    },
    setup() { return {}; },
    draw(c, t, W, H, st) {
      if (!st.maps) Object.assign(st, dBuild());
      TK.stage(c, W, H);
      const ti = dAt(t), tr = DT[ti], raw = seg(t, tr[0], tr[1]), u = E.ioS(raw), live = t > tr[0] && t < tr[1];
      let si = t < tr[0] ? tr[2] : tr[3];
      if (live) {
        c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
        c.drawImage(dCompose(st, tr, u), DR.x, DR.y, DR.w, DR.h);
        // fade in the full-resolution state where the displacement is nearly zero
        const crisp = 1 - clamp(dAmt(u) * 5);
        if (crisp > 0) { c.globalAlpha = crisp; c.beginPath(); c.rect(DR.x, DR.y, DR.w, DR.h); c.clip(); TK.stage(c, W, H); DST[u < 0.5 ? tr[2] : tr[3]].draw(c); }
        c.restore();
        si = u < 0.5 ? tr[2] : tr[3];
      } else DST[si].draw(c);
      label(c, DST[si].name, 960, 850, { align: 'center', color: P.ink, weight: 700, size: 18 });
      // left: what is happening
      const fin = t > 7.9;
      tag(c, fin ? 'THREE MAPS  ·  ONE TOKEN' : `MAP ${ti + 1} / 3  ·  ${DMAP[tr[4]]}`, 72, 80, seg(t, 0.1, 0.5));
      label(c, 'A(p + k·v)  →  B(p − k·v)', 98, 120, { size: 17, color: P.ink });
      label(c, 'v = MAP LUMINANCE m(p) · DIRECTION', 98, 148, { size: 14, ls: 2 });
      label(c, 'SWITCH A → B WHEN u > 0.6·m(p)', 98, 172, { size: 14, ls: 2 });
      if (live) label(c, `k = ${Math.round(DK * 2 * dAmt(u)).toString().padStart(3, ' ')} PX   u = ${u.toFixed(2)}`, 98, 210, { size: 18, color: P.accentD, weight: 700 });
      // right: the map inset with displacement vectors, and the three maps
      const iw = 288, ih = 192, ix = W - 72 - iw, iy = 84, mp = st.maps[tr[4]];
      label(c, `DISPLACEMENT MAP  ·  ${DMAP[tr[4]]}`, ix, iy - 14, { size: 13, ls: 2, color: P.ink, weight: 700 });
      c.drawImage(mp.cv, ix, iy, iw, ih);
      c.strokeStyle = P.ink; c.lineWidth = 1; c.strokeRect(ix + 0.5, iy + 0.5, iw, ih);
      const va = live ? dAmt(u) : 0.25;
      c.strokeStyle = P.accent; c.lineWidth = 2; c.beginPath();
      for (let gy = 0; gy < 6; gy++) for (let gx = 0; gx < 9; gx++) {
        const sx = Math.floor((gx + 0.5) / 9 * DSW), sy = Math.floor((gy + 0.5) / 6 * DSH), j = sy * DSW + sx;
        const px = ix + (gx + 0.5) / 9 * iw, py = iy + (gy + 0.5) / 6 * ih, l = 34 * va;
        c.moveTo(px, py); c.lineTo(px + mp.vx[j] * l, py + mp.vy[j] * l);
      }
      c.stroke();
      if (live) {   // the A/B switch front: share of the map already flipped
        const f = clamp(u / 0.6);
        label(c, `FLIPPED WHERE m < ${f.toFixed(2)}`, ix, iy + ih + 24, { size: 13, ls: 2, color: P.accentD, weight: 700 });
      }
      for (let i = 0; i < 3; i++) {
        const w = 88, h = 58, x = ix + i * (w + 12), y = iy + ih + 44, on = fin || i === tr[4];
        c.save(); c.globalAlpha = on ? 1 : 0.35; c.drawImage(st.maps[i].cv, x, y, w, h); c.restore();
        c.strokeStyle = on ? P.accent : 'rgba(23,24,28,0.3)'; c.lineWidth = on ? 3 : 1; c.strokeRect(x, y, w, h);
        label(c, DMAP[i], x + w / 2, y + h + 20, { align: 'center', size: 12, ls: 1, color: on ? P.ink : P.mute, weight: on ? 700 : 400 });
      }
      TK.caption(c, t, W, H, { name: 'Displacement', cat: 'Transitions', curve: v => dAmt(E.ioS(v)), span: [tr[0], tr[1]], curveLabel: 'DISPLACEMENT k / TIME' });
    },
    score(A) {
      TK.bed(A);
      // noise map: a granular, bit-crushed swell
      A.noise(1.0, { type: 'bandpass', f: 600, f2: 3200, sweep: 0.75, q: 1.2, dur: 1.5, g: 0.14, swell: 0.5, crush: true, rev: 0.3 });
      for (let i = 0; i < 14; i++) A.osc(1.1 + i * 0.09, { f: 900 + hash(i * 3.3) * 2400, dur: 0.03, g: 0.03 * Math.sin(PI * i / 14), pan: (hash(i) - 0.5) * 1.2 });
      // gradient map: a sweep from left to right
      A.whoosh(3.5, 1.5, { f1: 250, f2: 4000, q: 1.6, g: 0.15, swell: 0.5, pan: -0.6 });
      A.whoosh(4.1, 0.9, { f1: 500, f2: 2500, q: 1.4, g: 0.1, swell: 0.4, pan: 0.6 });
      // ripple map: a wobbling tone
      A.osc(6.0, { type: 'sine', f: 330, f2: 220, glide: 1.5, dur: 1.5, g: 0.07, a: 0.4, vib: [7, 22], rev: 0.5 });
      A.osc(6.0, { type: 'triangle', f: 660, f2: 440, glide: 1.5, dur: 1.5, g: 0.03, a: 0.4, vib: [5, 30], rev: 0.5 });
      DT.forEach(([t0, t1], i) => {
        A.osc(t0, { f: 2400, dur: 0.03, g: 0.05 });
        A.pluck(t1, midi([67, 71, 72][i]), { g: 0.14, bright: 0.6, dur: 1.2, rev: 0.3 });
        A.bell(t1, midi([79, 83, 84][i]), { g: 0.05, dur: 1.2 });
      });
      A.chord(8.0, [60, 64, 67, 72], { type: 'triangle', dur: 2, g: 0.04, a: 0.05, lp: 2400, rev: 0.6, width: 0.8 });
    },
  });

  /* =====================================================================
     OVERSHOOT — ease-out-back, f(u) = 1 + (s+1)(u−1)³ + s(u−1)²: the
     value leaves fast, sails past its target exactly once, turns around and
     settles with no further swing (unlike a spring). Five lanes run the
     same one-second move with s = 0, 0.8, 1.70158, 2.6 and 4; each lane
     leaves a ghost at its peak with the measured overshoot. The lanes run
     back the other way, then one Token shows the same curve on scale,
     rotation and position (with MOTION sliding in beside it).
     ===================================================================== */
  const OS = [0, 0.8, 1.70158, 2.6, 4.0];
  const OLY = [190, 320, 450, 580, 710], OA = 600, OB = 1240, OSZ = 90;
  const OM = [[1.0, 2.0, OA, OB], [3.0, 4.0, OB, OA]];
  const oBack = (u, s) => (u <= 0 ? 0 : u >= 1 ? 1 : E.outB(u, s));
  const oPeakU = s => 1 - 2 * s / (3 * (s + 1));
  const oPeak = s => oBack(oPeakU(s), s);
  const OH = { c: [960, 430], s: 260, k: 2.2 };
  // hero steps: [start, end, property]
  const OHS = [[5.0, 5.6, 'SCALE'], [6.0, 6.6, 'ROTATION'], [7.0, 7.6, 'POSITION']];
  const OWORD = [7.15, 7.85];
  function oArrow(c, x0, x1, y, col) {
    c.strokeStyle = col; c.lineWidth = 2; c.beginPath();
    c.moveTo(x0, y); c.lineTo(x1, y); c.moveTo(x0, y - 7); c.lineTo(x0, y + 7); c.moveTo(x1, y - 7); c.lineTo(x1, y + 7); c.stroke();
  }
  function oVline(c, x, y0, y1, col, txt, tcol) {
    c.save(); c.strokeStyle = col; c.lineWidth = 2; c.setLineDash([8, 7]);
    c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); c.restore();
    if (txt) label(c, txt, x, y0 - 12, { align: 'center', size: 14, ls: 2, color: tcol || col, weight: 700 });
  }

  MG.film({
    id: 'techovershoot', dur: 10, poster: 2.1,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Overshoot', sub: 'One pass past the target, then settle', era: '1930s —',
      origin: 'Disney animators taught overshoot as part of follow-through: a move carries past its final pose and eases back into it, so it reads as having weight and energy. In software it became the “back” easing curve — Robert Penner’s easing equations (2001) defined easeOutBack with its overshoot constant 1.70158, about a 10% overshoot — and that curve now ships in CSS cubic-bezier presets, GSAP’s back.out and nearly every animation library.',
      works: 'The Illusion of Life: Disney Animation (Frank Thomas and Ollie Johnston, 1981; follow-through and overlapping action) · Robert Penner’s Easing Equations (Flash ActionScript, 2001) · GSAP back.out ease (GreenSock)',
      tech: ['Ease-out-back curve', 'Overshoot strength s', 'Single pass, no oscillation'],
      accent: '#ff5a1f',
      motionDNA: 'Every move takes one second: a fast start, a single excursion past the target, a turn and a soft settle — no second swing. Five lanes compare strengths from none (plain cubic ease-out) to s = 4 (about 38% past); they return on the next bar, overshooting the start mark; then the same curve drives a pop-in scale, a quarter-turn and a slide, with MOTION sliding in a beat behind.',
      visualDNA: 'The Technique Atlas stage; five lanes of small orange Tokens on thin tracks between dashed START and TARGET lines; dashed ghosts at each peak with a bracket and the measured overshoot; then one large Token with a dashed target outline, an angle arc with target and peak ticks, and target lines for the slide; all five curves faint in the caption graph with the active one in ink.',
      transitions: 'Lane race into a hero Token; overshoot on scale, rotation and position',
      implementation: ['After Effects graph editor / Flow presets with back easing', 'CSS cubic-bezier(0.34, 1.56, 0.64, 1) · GSAP back.out(s)', 'Canvas 2D: f(u) = 1 + (s+1)(u−1)³ + s(u−1)², peak at u = 1 − 2s / 3(s+1)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      const lanes = 1 - seg(t, 4.4, 4.9);
      let curveS = OS[2], span = [1, 2], lab = 'PROGRESS / TIME';
      if (lanes > 0) {
        c.save(); c.globalAlpha = lanes;
        const mi = t < 2.6 ? 0 : 1, [t0, t1, a, b] = OM[mi], dir = Math.sign(b - a);
        span = [t0, t1];
        oVline(c, a, 140, 760, 'rgba(23,24,28,0.35)', 'START', P.mute);
        oVline(c, b, 140, 760, P.accent, 'TARGET', P.accentD);
        OS.forEach((s, i) => {
          const y = OLY[i], hi = i === 2;
          c.fillStyle = 'rgba(23,24,28,0.12)'; c.fillRect(OA, y - 1, OB - OA, 2);
          label(c, `s = ${s.toFixed(s === OS[2] ? 5 : 2)}`, 72, y - 4, { size: 17, color: P.ink, weight: 700 });
          label(c, i === 0 ? 'NO OVERSHOOT' : hi ? 'PENNER DEFAULT' : `PEAKS +${((oPeak(s) - 1) * 100).toFixed(0)}%`, 72, y + 20, { size: 13, ls: 2, color: hi ? P.accentD : P.mute });
          const tp = t0 + oPeakU(s) * (t1 - t0), px = lerp(a, b, oPeak(s));
          if (s > 0 && t >= tp && t < t1 + 0.9) {
            const g = seg(t, tp, tp + 0.08);
            c.save(); c.globalAlpha *= g;
            c.translate(px, y); TK.tokenPath(c, OSZ); c.setLineDash([5, 5]); c.lineWidth = 2; c.strokeStyle = P.accentD; c.stroke();
            c.restore();
            c.save(); c.globalAlpha *= g;
            oArrow(c, b, px, y + OSZ / 2 + 10, P.accentD);
            const d = Math.abs(px - b);
            label(c, `+${((oPeak(s) - 1) * 100).toFixed(1)}%  ·  ${Math.round(d)} PX`, px + dir * 14, y + OSZ / 2 + 15, { size: 14, ls: 1, color: P.accentD, weight: 700, align: dir > 0 ? 'left' : 'right' });
            c.restore();
          }
          const x = lerp(a, b, oBack(seg(t, t0, t1), s));
          TK.token(c, x, y, OSZ, { color: hi ? P.accent : P.accentL });
          if (hi) { c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.arc(x, y, OSZ * 0.72, 0, TAU); c.stroke(); }
        });
        c.restore();
        tag(c, t < 2.6 ? 'FIVE STRENGTHS  ·  ONE PASS PAST, THEN SETTLE' : 'AND BACK  ·  PAST THE START MARK', 72, 80, seg(t, 0.1, 0.5) * lanes);
        label(c, 'NO SECOND SWING  ·  NOT A SPRING', 98, 116, { size: 15, ls: 2, alpha: seg(t, 2.0, 2.3) * lanes, color: P.ink });
      }
      if (t > 4.6) {
        // hero Token: scale, then rotation, then position
        const k = OH.k, pk = oPeak(k), [cx, cy] = OH.c, S = OH.s;
        const sc = oBack(seg(t, 5.0, 5.6), k), rot = PI / 2 * oBack(seg(t, 6.0, 6.6), k);
        const x = lerp(cx, 700, oBack(seg(t, 7.0, 7.6), k)), wx = lerp(2400, 1300, oBack(seg(t, OWORD[0], OWORD[1]), k));
        let si = 0; OHS.forEach((h, i) => { if (t >= h[0] - 0.3) si = i; });
        const fin = t > 8.0;
        curveS = k; span = [OHS[si][0], OHS[si][1]];
        lab = `${OHS[si][2]} / TIME  ·  s = ${k}`;
        if (fin) span = [OWORD[0], OWORD[1]];
        tag(c, fin ? 'THE SAME CURVE ON ANY PROPERTY' : `PROPERTY ${si + 1} / 3  ·  ${OHS[si][2]}`, 72, 80, seg(t, 4.8, 5.0));
        const an = (i) => seg(t, OHS[i][0] + 0.1, OHS[i][0] + 0.25) * (1 - seg(t, OHS[i][0] + 0.8, OHS[i][0] + 0.95));
        TK.shadow(c, x, 640, S * Math.max(0.01, sc), 40);
        // scale: target and peak outlines
        if (an(0) > 0) {
          c.save(); c.globalAlpha = an(0); c.translate(cx, cy); c.setLineDash([8, 7]); c.lineWidth = 2;
          TK.tokenPath(c, S); c.strokeStyle = 'rgba(23,24,28,0.5)'; c.stroke();
          if (t > 5.0 + oPeakU(k) * 0.6) { c.beginPath(); TK.tokenPath(c, S * pk); c.strokeStyle = P.accentD; c.stroke(); }
          c.restore();
          label(c, 'TARGET ×1.00', cx - S / 2, cy + S / 2 + 34, { size: 14, ls: 2, alpha: an(0), color: P.ink, weight: 700 });
          if (t > 5.0 + oPeakU(k) * 0.6) label(c, `PEAK ×${pk.toFixed(2)}`, cx + S * pk / 2 + 16, cy - S * pk / 2 + 14, { size: 14, ls: 2, alpha: an(0), color: P.accentD, weight: 700 });
        }
        // rotation: angle arc with target and peak ticks
        if (an(1) > 0) {
          const R = 215, a0 = -PI / 2, aT = 0, aP = PI / 2 * pk - PI / 2, ac = rot - PI / 2;
          c.save(); c.globalAlpha = an(1);
          c.strokeStyle = 'rgba(23,24,28,0.2)'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R, a0 - 0.2, aP + 0.25); c.stroke();
          c.strokeStyle = P.accent; c.lineWidth = 5; c.beginPath(); c.arc(cx, cy, R, a0, Math.max(a0, ac)); c.stroke();
          const tick = (a, col, len, w) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(cx + Math.cos(a) * (R - len), cy + Math.sin(a) * (R - len)); c.lineTo(cx + Math.cos(a) * (R + len), cy + Math.sin(a) * (R + len)); c.stroke(); };
          tick(a0, P.ink, 12, 2); tick(aT, P.ink, 16, 3);
          if (t > 6.0 + oPeakU(k) * 0.6) tick(aP, P.accentD, 16, 3);
          c.restore();
          label(c, '0°', cx, cy - R - 22, { align: 'center', size: 14, alpha: an(1), color: P.ink, weight: 700 });
          label(c, 'TARGET 90°', cx + R + 24, cy - 4, { size: 14, ls: 2, alpha: an(1), color: P.ink, weight: 700 });
          if (t > 6.0 + oPeakU(k) * 0.6) label(c, `PEAK ${(90 * pk).toFixed(1)}°  (+${(90 * (pk - 1)).toFixed(1)}°)`, cx + Math.cos(aP) * (R + 24), cy + Math.sin(aP) * (R + 24) + 14, { size: 14, ls: 1, alpha: an(1), color: P.accentD, weight: 700 });
        }
        // position: target lines for the Token and the word
        const ap = seg(t, 7.1, 7.25);
        if (ap > 0) {
          c.save(); c.globalAlpha = ap;
          oVline(c, 700, 240, 640, P.accent, 'TARGET', P.accentD);
          oVline(c, 1300, 240, 640, P.accent, 'TARGET', P.accentD);
          if (t > 7.0 + oPeakU(k) * 0.6) { const pxT = lerp(cx, 700, pk); oArrow(c, 700, pxT, 600, P.accentD); label(c, `${Math.round(700 - pxT)} PX`, pxT - 10, 590, { align: 'right', size: 13, ls: 1, color: P.accentD, weight: 700 }); }
          if (t > OWORD[0] + oPeakU(k) * 0.7) { const pxW = lerp(2400, 1300, pk); oArrow(c, 1300, pxW, 600, P.accentD); label(c, `${Math.round(1300 - pxW)} PX`, pxW - 10, 590, { align: 'right', size: 13, ls: 1, color: P.accentD, weight: 700 }); }
          c.restore();
        }
        if (sc > 0.001) TK.token(c, x, cy, S * sc, { rot });
        if (wx < 2300) TK.word(c, wx, cy, { size: 130, ls: 6 });
      }
      // all five curves faint in the caption graph
      const lo = -0.1, hi = 1.45;
      c.save(); c.strokeStyle = 'rgba(23,24,28,0.16)'; c.lineWidth = 1.5;
      OS.forEach(s => { c.beginPath(); for (let i = 0; i <= 60; i++) { const u = i / 60, y = grY(oBack(u, s), lo, hi); i ? c.lineTo(GR.x + u * GR.w, y) : c.moveTo(GR.x + u * GR.w, y); } c.stroke(); });
      const pu = oPeakU(curveS);
      c.fillStyle = P.accentD; c.beginPath(); c.arc(GR.x + pu * GR.w, grY(oPeak(curveS), lo, hi), 3.5, 0, TAU); c.fill();
      c.restore();
      label(c, 'PEAK', GR.x + pu * GR.w, grY(oPeak(curveS), lo, hi) - 9, { align: 'center', size: 11, ls: 1, color: P.accentD, weight: 700 });
      TK.caption(c, t, W, H, { name: 'Overshoot', cat: 'Timing', curve: u => oBack(u, curveS), span, curveLabel: lab, lo, hi });
    },
    score(A) {
      TK.bed(A);
      // pitch follows the curve: up past the target note, then back down onto it
      const glideTo = (t0, d, s, f0, f1, g, pan = 0) => {
        const up = oPeakU(s) * d, fp = f0 * Math.pow(f1 / f0, oPeak(s));
        A.osc(t0, { type: 'triangle', f: f0, f2: fp, glide: up, dur: up, g, a: 0.01, hold: true, rel: 0.02, pan });
        A.osc(t0 + up, { type: 'triangle', f: fp, f2: f1, glide: d - up, dur: d - up + 0.35, g, a: 0.01, pan });
      };
      OM.forEach(([t0, t1, a, b], mi) => {
        A.whoosh(t0 - 0.02, 0.5, { f1: 400, f2: 3200, g: 0.12, swell: 0.3, pan: b > a ? 0.4 : -0.4 });
        glideTo(t0, t1 - t0, OS[2], midi(mi ? 72 : 60), midi(mi ? 60 : 72), 0.05);
        OS.forEach((s, i) => { if (s > 0) A.osc(t0 + oPeakU(s) * (t1 - t0), { f: 1400 + i * 300, dur: 0.035, g: 0.045, pan: (i - 2) * 0.25 }); });
        A.pluck(t1, midi(mi ? 60 : 67), { g: 0.14, bright: 0.6, dur: 1.1 });
      });
      // scale pop, rotation ratchet, slide
      A.osc(5.0, { f: 180, f2: 90, dur: 0.12, g: 0.12 });
      glideTo(5.0, 0.6, OH.k, midi(55), midi(67), 0.06);
      for (let i = 0; i < 6; i++) A.osc(6.0 + i * 0.05, { f: 2600 + i * 120, dur: 0.025, g: 0.04 });
      glideTo(6.0, 0.6, OH.k, midi(60), midi(72), 0.05, 0.2);
      A.whoosh(6.95, 0.5, { f1: 600, f2: 3500, g: 0.12, swell: 0.3, pan: -0.4 });
      A.whoosh(OWORD[0] - 0.05, 0.6, { f1: 300, f2: 2800, g: 0.12, swell: 0.3, pan: 0.5 });
      glideTo(7.0, 0.6, OH.k, midi(64), midi(76), 0.045, -0.3);
      A.chord(8.0, [60, 64, 67, 72], { type: 'triangle', dur: 2, g: 0.04, a: 0.03, lp: 2600, rev: 0.6, width: 0.8 });
      A.bell(8.0, midi(84), { g: 0.06, dur: 1.4 });
    },
  });
})();
