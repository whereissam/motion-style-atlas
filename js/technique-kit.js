/* Technique Atlas kit — the shared subject, stage, caption and beat bed for family K.
   Every technique film draws the same Token on the same stage over the same 120 BPM bed,
   so the only thing that changes from film to film is the motion technique itself.

   The Token: an orange rounded square with a round hole punched off-centre (top right),
   so its rotation always reads. The word: MOTION, set in Archivo Black-weight 900. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, text, rrect } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Archivo:wght@500;800;900&family=JetBrains+Mono:wght@400;700&display=block');

  const P = {
    ground: '#ece8df', ground2: '#ddd8cc', ink: '#17181c', mute: '#8f8a80', line: 'rgba(23,24,28,0.07)',
    accent: '#ff5a1f', accentL: '#ff8a5c', accentD: '#c63e0c', blue: '#2f5bff', shadow: 'rgba(23,24,28,0.16)',
  };
  const FONT = 'Archivo, "Helvetica Neue", Arial, sans-serif';
  const MONO = '"JetBrains Mono", monospace';
  const BPM = 120, BEAT = 60 / BPM;
  const WORD = 'MOTION';
  const FLOOR = 800;   // default floor line (y) for techniques that need gravity

  // Hole geometry in Token units (side = 1): centre offset and radius.
  const HOLE = { x: 0.2, y: -0.2, r: 0.17 }, CORNER = 0.22;

  /* Studio stage: warm paper ground, an 80 px grid (ox/oy shift it for camera moves, z scales it),
     and an optional floor line. */
  function stage(c, W, H, o = {}) {
    c.fillStyle = P.ground; c.fillRect(0, 0, W, H);
    const z = o.z || 1, g = 80 * z, ox = ((o.ox || 0) % g + g) % g, oy = ((o.oy || 0) % g + g) % g;
    c.strokeStyle = P.line; c.lineWidth = 1; c.beginPath();
    for (let x = ox - g; x < W + g; x += g) { c.moveTo(x, 0); c.lineTo(x, H); }
    for (let y = oy - g; y < H + g; y += g) { c.moveTo(0, y); c.lineTo(W, y); }
    c.stroke();
    if (o.floor !== false && o.floor !== undefined) {
      c.fillStyle = P.ground2; c.fillRect(0, o.floor, W, H - o.floor);
      c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(0, o.floor, W, 2);
    }
  }

  /* Path of the Token (rounded square with the hole) centred on 0,0 at side s; fill with 'evenodd'. */
  function tokenPath(c, s) {
    rrect(c, -s / 2, -s / 2, s, s, s * CORNER);
    c.moveTo(s * (HOLE.x + HOLE.r), s * HOLE.y);
    c.arc(s * HOLE.x, s * HOLE.y, s * HOLE.r, 0, TAU, true);
  }

  /* The Token at x,y with side s. o: rot (rad), sx/sy (squash & stretch, applied after rotation
     along screen axes), alpha, color, edge (ink outline width, 0 = none). */
  function token(c, x, y, s, o = {}) {
    c.save();
    c.translate(x, y);
    if (o.sx || o.sy) c.scale(o.sx || 1, o.sy || 1);
    if (o.rot) c.rotate(o.rot);
    if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
    tokenPath(c, s);
    c.fillStyle = o.color || P.accent; c.fill('evenodd');
    if (o.edge) { c.lineWidth = o.edge; c.strokeStyle = P.ink; c.stroke(); }
    c.restore();
  }

  /* Soft contact shadow under a Token whose bottom is `lift` px above the floor. */
  function shadow(c, x, floorY, s, lift = 0) {
    const k = clamp(1 - lift / 600, 0.25, 1);
    c.save(); c.globalAlpha = 0.9 * k;
    c.fillStyle = P.shadow; c.beginPath();
    c.ellipse(x, floorY + 4, s * 0.55 * (0.6 + 0.4 * k), s * 0.07 * k + 3, 0, 0, TAU); c.fill();
    c.restore();
  }

  /* The word MOTION centred at x,y. o: size, color, ls, alpha. */
  function word(c, x, y, o = {}) {
    c.save(); if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
    text(c, o.text || WORD, x, y, { font: FONT, weight: 900, size: o.size || 160, color: o.color || P.ink, align: 'center', base: 'middle', ls: o.ls ?? 4 });
    c.restore();
  }

  /* Caption, identical in every technique film.
     o.name ('Elastic'), o.cat ('Timing'); optional o.curve (u → value, about 0..1) with o.span
     [t0, t1] draws the curve as a small graph bottom-right with a dot at the current progress. */
  function caption(c, t, W, H, o) {
    const x = 72, y = H - 92;
    text(c, `TECHNIQUE ATLAS  ·  ${(o.cat || '').toUpperCase()}`, x, y - 62, { font: MONO, size: 18, ls: 3, color: P.mute });
    text(c, o.name, x - 3, y, { font: FONT, weight: 800, size: 54, color: P.ink });
    // 10 s timeline, beat ticks, playhead
    const tx = x, tw = 560, ty = H - 52;
    c.fillStyle = 'rgba(23,24,28,0.14)'; c.fillRect(tx, ty, tw, 2);
    c.fillStyle = 'rgba(23,24,28,0.3)';
    for (let b = 0; b <= 20; b++) c.fillRect(tx + tw * b / 20 - 0.5, ty - (b % 4 ? 3 : 7), 1, b % 4 ? 3 : 7);
    c.fillStyle = P.accent; c.fillRect(tx, ty, tw * clamp(t / 10), 2);
    c.beginPath(); c.arc(tx + tw * clamp(t / 10), ty + 1, 5, 0, TAU); c.fill();
    if (o.curve) {
      const gw = 240, gh = 120, gx = W - 72 - gw, gy = H - 52 - gh;
      c.strokeStyle = 'rgba(23,24,28,0.2)'; c.lineWidth = 1;
      c.strokeRect(gx + 0.5, gy + 0.5, gw, gh);
      const lo = o.lo ?? -0.2, hi = o.hi ?? 1.3, Y = v => gy + gh - (v - lo) / (hi - lo) * gh;
      c.setLineDash([3, 4]); c.beginPath(); c.moveTo(gx, Y(0)); c.lineTo(gx + gw, Y(0)); c.moveTo(gx, Y(1)); c.lineTo(gx + gw, Y(1)); c.stroke(); c.setLineDash([]);
      c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath();
      for (let i = 0; i <= 96; i++) { const u = i / 96, px = gx + u * gw, py = Y(o.curve(u)); i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.stroke();
      const [t0, t1] = o.span || [0, 10], u = clamp((t - t0) / (t1 - t0));
      c.fillStyle = P.accent; c.beginPath(); c.arc(gx + u * gw, Y(o.curve(u)), 6, 0, TAU); c.fill();
      text(c, o.curveLabel || 'VALUE / TIME', gx, gy - 12, { font: MONO, size: 14, ls: 2, color: P.mute });
    }
  }

  /* Shared score bed: soft kick on every beat, offbeat hats, one low pad per bar (C, Am, F, G).
     Films add their technique sounds on top; keep added peaks under ~0.7. */
  function bed(A, o = {}) {
    const g = o.g ?? 1, until = o.until ?? 10;
    for (let b = 0; b * BEAT < until; b++) {
      const t = b * BEAT;
      A.kick(t, 0.32 * g, { f: 120, f2: 45 });
      A.hat(t + BEAT / 2, 0.035 * g);
    }
    const bars = [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59], [48, 55, 64]];
    bars.forEach((n, i) => { if (i * 2 < until) A.chord(i * 2, n, { type: 'triangle', dur: 2.1, g: 0.035 * g, a: 0.3, lp: 900, rev: 0.4, width: 0.6 }); });
  }

  const fonts = [[`900 160px ${FONT}`, WORD], [`800 54px ${FONT}`, 'Technique'], [`400 18px ${MONO}`, 'TECHNIQUE ATLAS']];

  MG.TK = { P, FONT, MONO, BPM, BEAT, WORD, FLOOR, HOLE, CORNER, stage, tokenPath, token, shadow, word, caption, bed, fonts };
})();
