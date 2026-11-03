/* batch m9 — Narrative Formats · Explainer: formathowitworks · formatversus · formatmyth.
   formathowitworks (a system explainer, not a how-to: the whole machine first — still Tokens in,
   moving Tokens out, a closed box called MOTION in between — then a zoom into a cutaway of the
   mechanism with three numbered chambers and flow arrows, one idea per step (poses, timing,
   frames), a you-are-here map, and a pull back to the whole with the one-line takeaway) ·
   formatversus (a split-screen comparison: the square Token against a round variant, the same
   four criteria set out before round one and run in the same order on both sides, a live test
   per round, the spec row filled and the point tallied on the scoreboard, and a verdict that
   names what the answer depends on) ·
   formatmyth (myth vs fact: three myths about motion, each stated once and plainly, stamped
   MYTH in red, tested against evidence, struck out and replaced by the FACT in green, with a
   debunked tally — and a recap that lists only the facts). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, midi, text, rrect } = MG;
  const TK = MG.TK, FK = MG.FK, P = TK.P, PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const hasLS = typeof CanvasRenderingContext2D !== 'undefined' && 'letterSpacing' in CanvasRenderingContext2D.prototype;
  const label = (c, s, x, y, o = {}) => {
    if (o.alpha === undefined) return FK.label(c, s, x, y, o);
    if (o.alpha <= 0.01) return;
    c.save(); c.globalAlpha *= o.alpha; FK.label(c, s, x, y, o); c.restore();
  };
  function measure(c, s, size, weight = 800, font = TK.FONT, ls = 0) {
    c.font = `${weight} ${size}px ${font}`;
    if (hasLS) c.letterSpacing = ls + 'px';
    const w = c.measureText(s).width;
    if (hasLS) c.letterSpacing = '0px';
    return w;
  }
  const fit = (c, s, max, maxW, weight = 800) => Math.min(max, max * maxW / measure(c, s, max, weight));
  const sinc = u => Math.sin(PI * clamp(u));
  const win = (t, a, b, f = 0.2) => clamp(Math.min(seg(t, a, a + f), 1 - seg(t, b - f, b)));
  /* Small accent tag naming a convention as it happens: dot + mono label. */
  function tag(c, s, x, y, on = 1, o = {}) {
    if (on <= 0.01) return;
    c.save(); c.globalAlpha *= on;
    const al = o.align || 'left';
    let dx = x;
    if (al === 'center') dx = x - (measure(c, s, o.size || 16, 700, TK.MONO, 2.5) + 20) / 2;
    else if (al === 'right') dx = x - measure(c, s, o.size || 16, 700, TK.MONO, 2.5) - 20;
    c.fillStyle = o.dot || P.accent; c.beginPath(); c.arc(dx + 6, y - 6, 6, 0, TAU); c.fill();
    label(c, s, dx + 20, y, { color: o.color || P.ink, weight: 700, size: o.size || 16, ls: 2.5 });
    c.restore();
  }
  function arrow(c, x0, y0, x1, y1, col, lw = 3, head = 12) {
    const a = Math.atan2(y1 - y0, x1 - x0);
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1 - Math.cos(a) * head * 0.6, y1 - Math.sin(a) * head * 0.6); c.stroke();
    c.beginPath(); c.moveTo(x1, y1);
    c.lineTo(x1 - Math.cos(a - 0.45) * head, y1 - Math.sin(a - 0.45) * head);
    c.lineTo(x1 - Math.cos(a + 0.45) * head, y1 - Math.sin(a + 0.45) * head);
    c.closePath(); c.fill();
  }
  /* The round variant of the Token: a disc with the same off-centre hole. */
  function roundTok(c, x, y, s, o = {}) {
    c.save(); c.translate(x, y);
    if (o.sx || o.sy) c.scale(o.sx || 1, o.sy || 1);
    if (o.rot) c.rotate(o.rot);
    if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
    c.beginPath(); c.arc(0, 0, s / 2, 0, TAU);
    if (!o.solid) { c.moveTo(s * (TK.HOLE.x + TK.HOLE.r), s * TK.HOLE.y); c.arc(s * TK.HOLE.x, s * TK.HOLE.y, s * TK.HOLE.r, 0, TAU, true); }
    c.fillStyle = o.color || P.blue; c.fill('evenodd');
    c.restore();
  }
  const fonts = [...FK.fonts, [`700 16px ${TK.MONO}`, 'EVIDENCE'], [`800 40px ${TK.FONT}`, 'Myth Fact']];

  /* =====================================================================
     HOW IT WORKS — a system explainer. The whole machine first: grey
     Tokens ride a belt into a closed box marked MOTION and come out orange
     and hopping; brackets name INPUT → MECHANISM → OUTPUT, the mechanism
     a question mark. The camera zooms into the box and the casing is cut
     away: three numbered chambers joined by flow arrows, lit one at a time
     — 1 set two poses (keyframes), 2 shape the timing (an easing curve and
     its spacing), 3 fill the frames (onion-skinned in-betweens) — with a
     you-are-here map of the whole in the corner. Then the camera pulls
     back to the whole, the box now shows its three parts, and the
     one-line takeaway lands. The caption graph plots the level of detail.
     ===================================================================== */
  const HW_B = [
    { t0: 0, t1: 1.4, name: 'The whole', kind: 'hook' },
    { t0: 1.4, t1: 2.6, name: 'In → out', kind: 'act' },
    { t0: 2.6, t1: 3.2, name: 'Zoom in', kind: 'turn' },
    { t0: 3.2, t1: 4.6, name: 'Step 1', kind: 'act' },
    { t0: 4.6, t1: 6.0, name: 'Step 2', kind: 'act' },
    { t0: 6.0, t1: 7.4, name: 'Step 3', kind: 'act' },
    { t0: 7.4, t1: 8.0, name: 'Pull back', kind: 'turn' },
    { t0: 8.0, t1: 10, name: 'Takeaway', kind: 'cta' },
  ];
  const HW_ZOOM = [[2.6, 0], [3.2, 1, E.inC], [7.4, 1], [8.0, 0, E.outC]];
  const hwZoom = t => kf(t, HW_ZOOM);
  const HW_STEP = [3.2, 4.6, 6.0, 7.4];
  const hwStep = t => (t < HW_STEP[0] ? -1 : t < HW_STEP[1] ? 0 : t < HW_STEP[2] ? 1 : t < HW_STEP[3] ? 2 : 3);
  const HW_BELT = 640, HW_GREY = '#a29d93', HW_BOX = [640, 300, 640, 340];
  const HW_CH = [420, 960, 1500];
  const HW_NAMES = [['Set two poses', 'KEYFRAMES · WHERE IT STARTS AND ENDS'], ['Shape the timing', 'EASING · SLOW, FAST, SLOW'], ['Fill the frames', 'IN-BETWEENS · 12 FRAMES IN 0.5 s']];
  // in-between positions for step 3 (eased), shared with the takeaway
  const hwFrame = k => { const p = E.ioS(k / 11); return [lerp(1340, 1650, p), lerp(590, 410, p) - 110 * Math.sin(PI * p), p]; };

  function hwChamberIcon(c, i, x, y, s, col) {
    c.save(); c.translate(x, y); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 2.5;
    if (i === 0) { [-1, 1].forEach(d => { c.beginPath(); c.moveTo(d * s * 0.3, -s * 0.18); c.lineTo(d * s * 0.3 + s * 0.16, 0); c.lineTo(d * s * 0.3, s * 0.18); c.lineTo(d * s * 0.3 - s * 0.16, 0); c.closePath(); c.fill(); }); }
    else if (i === 1) { c.beginPath(); for (let k = 0; k <= 20; k++) { const u = k / 20, px = lerp(-s * 0.4, s * 0.4, u), py = lerp(s * 0.3, -s * 0.3, E.ioS(u)); k ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
    else { for (let k = 0; k < 4; k++) c.strokeRect(-s * 0.44 + k * s * 0.22, -s * 0.16, s * 0.18, s * 0.32); }
    c.restore();
  }

  function hwWhole(c, t, fin) {
    const W = 1920, H = 1080;
    TK.stage(c, W, H);
    // belt
    c.fillStyle = P.ink; rrect(c, 60, HW_BELT, 1800, 24, 12); c.fill();
    c.fillStyle = 'rgba(236,232,223,0.35)';
    const off = (t * 220) % 60;
    for (let x = 70 + off; x < 1850; x += 60) c.fillRect(x, HW_BELT + 10, 26, 4);
    [72, 1848].forEach(x => { c.fillStyle = P.mute; c.beginPath(); c.arc(x, HW_BELT + 12, 9, 0, TAU); c.fill(); });
    // legs
    c.fillStyle = 'rgba(23,24,28,0.25)'; [200, 960, 1720].forEach(x => c.fillRect(x - 3, HW_BELT + 24, 6, 26));
    // inputs: grey still Tokens ride in
    for (let k = Math.floor(t) - 1; k <= Math.floor(t) + 1; k++) {
      const p = t - k; if (p < 0 || p > 1.1) continue;
      TK.token(c, 160 + 480 * p, HW_BELT - 45, 90, { color: HW_GREY, alpha: seg(p, 0, 0.15) });
    }
    // outputs: orange Tokens hop out
    for (let k = Math.floor(t) - 2; k <= Math.floor(t); k++) {
      const q = t - k - 1.2; if (q < 0 || q > 1.3) continue;
      const x = 1240 + 460 * q, h = q * 2.6, lift = 80 * Math.abs(Math.sin(PI * h));
      const sq = Math.exp(-((h % 1) * 6)) * (h > 1 ? 0.18 : 0);
      if (lift < 30 && q < 1.1) TK.shadow(c, x, HW_BELT, 90, lift);
      TK.token(c, x, HW_BELT - 45 * (1 - sq) - lift, 90, { rot: PI / 2 * h, sy: 1 - sq, sx: 1 + sq * 0.7, alpha: 1 - seg(q, 1.1, 1.3) });
    }
    // the box
    const [bx, by, bw, bh] = HW_BOX;
    c.fillStyle = 'rgba(23,24,28,0.16)'; rrect(c, bx + 12, by + 14, bw, bh, 20); c.fill();
    c.fillStyle = P.ink; rrect(c, bx, by, bw, bh, 20); c.fill();
    c.fillStyle = '#26282e'; c.fillRect(bx - 10, HW_BELT - 96, 22, 96); c.fillRect(bx + bw - 12, HW_BELT - 96, 22, 96);   // mouths
    const wy = lerp(430, 372, fin), ws = lerp(104, 72, fin);
    TK.word(c, 960, wy, { size: ws, color: P.ground, ls: 6 });
    if (fin < 0.5) {
      for (let i = 0; i < 3; i++) { const on = Math.floor(t * 3) % 3 === i; c.fillStyle = on ? P.accent : 'rgba(236,232,223,0.2)'; c.beginPath(); c.arc(900 + i * 60, 548, 9, 0, TAU); c.fill(); }
      label(c, 'THE MOTION ENGINE', 960, 600, { align: 'center', size: 13, ls: 3, color: 'rgba(236,232,223,0.5)', alpha: 1 - fin * 2 });
    }
    if (fin > 0) {
      // the box now shows its three parts
      c.save(); c.globalAlpha *= fin;
      for (let i = 0; i < 3; i++) {
        const cx = 760 + i * 200, cy = 520;
        c.fillStyle = 'rgba(236,232,223,0.08)'; rrect(c, cx - 86, cy - 62, 172, 124, 10); c.fill();
        c.strokeStyle = 'rgba(236,232,223,0.5)'; c.lineWidth = 2; c.stroke();
        hwChamberIcon(c, i, cx, cy - 6, 90, P.accent);
        label(c, `${i + 1} · ${['POSES', 'TIMING', 'FRAMES'][i]}`, cx, cy + 46, { align: 'center', size: 13, ls: 2, color: P.ground, weight: 700 });
        if (i < 2) arrow(c, cx + 92, cy, cx + 108, cy, P.accent, 2.5, 9);
      }
      c.restore();
    }
    // input → mechanism → output brackets
    const BR = [[120, 600, 'INPUT', 'A STILL SHAPE'], [650, 1270, 'MECHANISM', t > 7.4 ? 'POSES · TIMING · FRAMES' : 'WHAT HAPPENS IN HERE?'], [1320, 1800, 'OUTPUT', 'A MOVING SHAPE']];
    const zf = 1 - seg(hwZoom(t), 0, 0.06);
    BR.forEach(([a, b, n, d], i) => {
      const on = seg(t, 1.4 + i * 0.25, 1.7 + i * 0.25) * zf;
      if (on <= 0.01) return;
      c.save(); c.globalAlpha *= on;
      c.strokeStyle = i === 1 ? P.accent : P.ink; c.lineWidth = 2;
      const m = (a + b) / 2, hw = (b - a) / 2 * E.outC(on);
      c.beginPath(); c.moveTo(m - hw, 694); c.lineTo(m - hw, 704); c.lineTo(m + hw, 704); c.lineTo(m + hw, 694); c.stroke();
      text(c, n, m, 748, { font: TK.FONT, weight: 800, size: 34, color: P.ink, align: 'center', ls: 2 });
      label(c, d, m, 780, { align: 'center', size: 14, ls: 2.5, color: i === 1 ? P.accentD : P.mute, weight: 700 });
      c.restore();
      if (i < 2) { c.save(); c.globalAlpha *= seg(t, 1.7 + i * 0.25, 1.9 + i * 0.25) * zf; arrow(c, b + 6, 740, b + 44, 740, P.mute, 2.5, 10); c.restore(); }
    });
  }

  function hwInside(c, t) {
    const W = 1920, H = 1080, st = hwStep(t);
    // cut casing around the frame
    c.fillStyle = '#1c1d22'; c.fillRect(0, 0, W, H);
    c.save(); c.strokeStyle = 'rgba(236,232,223,0.07)'; c.lineWidth = 2; c.beginPath();
    for (let x = -1100; x < W; x += 26) { c.moveTo(x, H); c.lineTo(x + H, 0); }
    c.stroke(); c.restore();
    c.save(); c.beginPath(); c.rect(80, 96, 1760, 770); c.clip();
    TK.stage(c, W, H);
    c.restore();
    c.strokeStyle = P.accent; c.lineWidth = 3; c.setLineDash([14, 10]); c.strokeRect(80, 96, 1760, 770); c.setLineDash([]);
    label(c, 'INSIDE THE MOTION ENGINE', 112, 140, { size: 18, color: P.ink, weight: 700 });
    label(c, 'CUTAWAY · CASING REMOVED', 112, 166, { size: 13, ls: 2.5, color: P.mute });
    // you-are-here map
    c.save();
    c.fillStyle = P.ink; c.fillRect(1560, 188, 270, 4);
    TK.token(c, 1584, 175, 22, { color: HW_GREY });
    rrect(c, 1612, 118, 156, 70, 8); c.fill();
    for (let i = 0; i < 3; i++) { c.fillStyle = i === st ? P.accent : i < st ? 'rgba(236,232,223,0.55)' : 'rgba(236,232,223,0.18)'; c.fillRect(1622 + i * 50, 132, 42, 44); }
    TK.token(c, 1802, 175, 22);
    c.restore();
    label(c, st >= 0 && st < 3 ? `YOU ARE HERE · STEP ${st + 1} OF 3` : 'YOU ARE HERE', 1830, 218, { align: 'right', size: 13, ls: 2, color: P.ink, weight: 700 });
    // input / output arrows at the edges
    TK.token(c, 128, 500, 44, { color: HW_GREY });
    arrow(c, 156, 500, 186, 500, P.mute, 3, 12);
    arrow(c, 1736, 500, 1770, 500, P.mute, 3, 12);
    TK.token(c, 1800, 500, 44);
    // chambers
    for (let i = 0; i < 3; i++) {
      const cx = HW_CH[i], x0 = cx - 230, y0 = 290, cur = i === st, past = i < st;
      const al = cur ? 1 : past ? 0.55 : 0.22;
      c.save(); c.globalAlpha *= al;
      c.fillStyle = 'rgba(255,255,255,0.55)'; rrect(c, x0, y0, 460, 410, 16); c.fill();
      c.strokeStyle = cur ? P.accent : P.ink; c.lineWidth = cur ? 4 : 2.5; c.stroke();
      // badge
      const bp = cur ? E.outB(seg(t, HW_STEP[i], HW_STEP[i] + 0.3)) : 1;
      c.fillStyle = cur ? P.accent : P.ink; c.beginPath(); c.arc(x0 + 40, y0, 28 * bp, 0, TAU); c.fill();
      text(c, String(i + 1), x0 + 40, y0 + 2, { font: TK.FONT, weight: 900, size: 32, color: '#fff', align: 'center', base: 'middle' });
      text(c, HW_NAMES[i][0], cx, 760, { font: TK.FONT, weight: 800, size: 38, color: P.ink, align: 'center' });
      label(c, HW_NAMES[i][1], cx, 792, { align: 'center', size: 14, ls: 2, color: P.mute, weight: 700 });
      // contents
      const lu = cur ? t - HW_STEP[i] : past ? 9 : 0;
      if (i === 0) hwStep1(c, lu, cur || past);
      else if (i === 1) hwStep2(c, lu, t, cur || past);
      else hwStep3(c, lu, cur || past);
      c.restore();
      // flow arrows to the next chamber, with a packet on the hand-off
      if (i < 2) {
        const ax = cx + 236, on = i < st ? 1 : 0.3;
        c.save(); c.globalAlpha *= on; arrow(c, ax, 495, ax + 66, 495, i < st ? P.accent : P.mute, 4, 14); c.restore();
        const hp = seg(t, HW_STEP[i + 1] - 0.05, HW_STEP[i + 1] + 0.3);
        if (hp > 0 && hp < 1) TK.token(c, lerp(ax - 30, ax + 96, E.ioS(hp)), 495 - 40 * Math.sin(PI * hp), 30, { rot: hp * PI });
      }
    }
    tag(c, 'ONE IDEA PER STEP · NUMBERED IN ORDER OF FLOW', 960, 846, seg(t, 3.4, 3.7), { align: 'center', size: 14 });
  }
  function hwStep1(c, u, on) {
    const fl = 610;
    c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(210, fl, 420, 2);
    const a = on ? E.outB(seg(u, 0.1, 0.35)) : 0, b = on ? E.outB(seg(u, 0.5, 0.75)) : 0;
    // ghost outlines (always), filled poses when keyed
    c.save(); c.setLineDash([6, 6]); c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 2;
    c.strokeRect(270 - 45, fl - 90, 90, 90);
    c.save(); c.translate(560, 420); c.rotate(PI / 2); c.strokeRect(-45, -45, 90, 90); c.restore();
    c.restore();
    if (a > 0.01) { c.save(); c.translate(270, fl - 45); c.scale(a, a); TK.token(c, 0, 0, 90); c.restore(); }
    if (b > 0.01) { c.save(); c.translate(560, 420); c.scale(b, b); TK.token(c, 0, 0, 90, { rot: PI / 2 }); c.restore(); }
    label(c, 'POSE A', 270, fl - 110, { align: 'center', size: 14, color: P.ink, weight: 700, alpha: clamp(a) });
    label(c, 'POSE B', 560, 352, { align: 'center', size: 14, color: P.ink, weight: 700, alpha: clamp(b) });
    // keyframe timeline
    c.fillStyle = P.ink; c.fillRect(250, 655, 340, 2);
    [[250, a, 'A · 0.0 s'], [590, b, 'B · 0.5 s']].forEach(([x, k, s]) => {
      c.save(); c.translate(x, 656); c.rotate(PI / 4);
      if (k > 0.01) { c.scale(k, k); c.fillStyle = P.accent; c.fillRect(-9, -9, 18, 18); }
      else { c.strokeStyle = P.mute; c.lineWidth = 2; c.strokeRect(-9, -9, 18, 18); }
      c.restore();
      label(c, s, x, 686, { align: 'center', size: 13, ls: 2, color: P.mute });
    });
  }
  function hwStep2(c, u, t, on) {
    const gx = 790, gy = 330, gw = 340, gh = 230;
    c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx, gy + gh); c.lineTo(gx + gw, gy + gh); c.stroke();
    label(c, 'POSITION', gx + 8, gy + 4, { size: 12, ls: 2, color: P.mute });
    label(c, 'TIME →', gx + gw, gy + gh + 22, { align: 'right', size: 12, ls: 2, color: P.mute });
    c.save(); c.setLineDash([5, 6]); c.strokeStyle = 'rgba(23,24,28,0.3)'; c.beginPath(); c.moveTo(gx, gy + gh); c.lineTo(gx + gw, gy); c.stroke(); c.restore();
    label(c, 'LINEAR', gx + gw * 0.7, gy + gh * 0.44, { size: 12, ls: 2, color: P.mute });
    const draw = on ? clamp(u / 0.6) : 0;
    c.strokeStyle = P.accent; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath();
    const N = Math.max(1, Math.round(60 * draw));
    for (let k = 0; k <= N; k++) { const v = k / 60, px = gx + gw * v, py = gy + gh - gh * E.ioS(v); k ? c.lineTo(px, py) : c.moveTo(px, py); }
    if (draw > 0) c.stroke();
    if (on && u > 0.6) {
      const v = ((t - 0.6) % 1) / 0.8, vv = clamp(v);
      c.fillStyle = P.ink; c.beginPath(); c.arc(gx + gw * vv, gy + gh - gh * E.ioS(vv), 9, 0, TAU); c.fill();
    }
    // spacing ticks: equal time steps, unequal distances
    const sy = 632, sp = on ? seg(u, 0.4, 0.8) : 0;
    c.fillStyle = 'rgba(23,24,28,0.2)'; c.fillRect(gx, sy, gw, 2);
    for (let k = 0; k <= 11; k++) {
      const x = gx + gw * E.ioS(k / 11);
      c.fillStyle = P.ink; c.globalAlpha *= 1; c.fillRect(x - 1.5, sy - 14 * sp, 3, 16 * sp + 2);
    }
    label(c, 'SLOW', gx + 30, 666, { align: 'center', size: 12, ls: 2, color: P.ink, weight: 700, alpha: sp });
    label(c, 'FAST', gx + gw / 2, 666, { align: 'center', size: 12, ls: 2, color: P.accentD, weight: 700, alpha: sp });
    label(c, 'SLOW', gx + gw - 30, 666, { align: 'center', size: 12, ls: 2, color: P.ink, weight: 700, alpha: sp });
  }
  function hwStep3(c, u, on) {
    const n = on ? Math.min(12, Math.floor(seg(u, 0.05, 1.0) * 12 + (u > 0 ? 1 : 0))) : 0;
    // path
    c.save(); c.setLineDash([5, 7]); c.strokeStyle = 'rgba(198,62,12,0.4)'; c.lineWidth = 2; c.beginPath();
    for (let k = 0; k <= 30; k++) { const p = k / 30, x = lerp(1340, 1650, p), y = lerp(590, 410, p) - 110 * Math.sin(PI * p); k ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke(); c.restore();
    for (let k = 0; k < n; k++) {
      const [x, y, p] = hwFrame(k), last = k === n - 1;
      TK.token(c, x, y, 56, { rot: PI / 2 * p, alpha: last ? 1 : 0.18 + 0.25 * k / 11, color: last ? P.accent : P.accentL });
    }
    // film strip
    const fx = 1300, fy = 632;
    c.fillStyle = P.ink; c.fillRect(fx, fy - 18, 400, 36);
    for (let k = 0; k < 12; k++) {
      const x = fx + 6 + k * 32.8;
      c.fillStyle = k < n ? P.ground : 'rgba(236,232,223,0.15)'; c.fillRect(x, fy - 12, 28, 24);
      if (k < n) TK.token(c, x + 14, fy, 14, { rot: PI / 2 * hwFrame(k)[2] });
    }
    label(c, `FRAME ${String(n).padStart(2, '0')} / 12`, 1500, 676, { align: 'center', size: 13, ls: 2, color: P.ink, weight: 700 });
  }

  MG.film({
    id: 'formathowitworks', dur: 10, poster: 5.6,
    fonts,
    meta: {
      family: 'M', name: 'How It Works', sub: 'System explainer: whole, part, whole', era: '1930s — · web explainers 2000s —',
      origin: 'The explanatory cutaway is older than film: technical illustrators drew engines with their casings removed, and from the 1930s motoring magazines such as The Autocar made the cutaway drawing a speciality. Sponsored and classroom films animated the same idea — the Jam Handy Organization’s Around the Corner (1937) explained Chevrolet’s differential gear by building it up from a single axle, part by part — and the web explainer revived it, from HowStuffWorks (1998) to animated channels such as Kurzgesagt (2013) and Animagraffs, in the same order: the whole system, a zoom into the mechanism one step at a time, and back to the whole.',
      works: 'Around the Corner (Jam Handy for Chevrolet, 1937; the differential explained) · David Macaulay, The Way Things Work (book, 1988) · Animagraffs, How a Car Engine Works (web animation, 2010s)',
      tech: ['Whole → part → whole, with a you-are-here map', 'Input → mechanism → output, then a cutaway', 'One idea per numbered step, joined by flow arrows'],
      accent: '#ff5a1f',
      motionDNA: 'A held wide shot of the whole machine for 2.6 s with the belt running at a steady pace and the brackets drawing on the beat; an accelerating zoom into the box (2.6–3.2 s); three steps of 1.4 s each, a numbered badge popping on each and a packet hopping along the flow arrow at every hand-off; a decelerating pull back (7.4–8.0 s) to the same wide, and a two-second hold on the takeaway.',
      visualDNA: 'The Technique Atlas paper stage: an ink conveyor and an ink box with MOTION reversed out of it, grey still Tokens in, orange hopping Tokens out. Inside, the casing is cut away to a hatched charcoal border with an orange dashed cut line; three white chambers with ink keylines, the current one outlined in orange, the others dimmed; a keyframe timeline, an easing graph with its spacing ticks, onion-skinned in-betweens and a film strip; a small map of the whole in the corner.',
      transitions: 'Push-in zoom through the box into the cutaway; pull back out to the same wide; steps lit in sequence rather than cut',
      implementation: ['After Effects: one master comp of the machine, a camera zoom into a precomp of the cutaway', 'Script per step: one noun, one verb, one visual', 'Canvas 2D: the wide drawn under a zoom transform, the cutaway cross-faded in screen space at full zoom'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const z = hwZoom(t), ins = seg(z, 0.6, 0.95), fin = E.outC(seg(t, 7.5, 8.1));
      if (ins < 1) {
        c.save();
        const k = lerp(1, 3.2, z);
        c.translate(960, 470); c.scale(k, k); c.translate(-960, -470);
        hwWhole(c, t, fin);
        c.restore();
        // headline / takeaway (screen space, only at the wide)
        const hq = win(t, 0.15, 2.7, 0.3);
        if (hq > 0.01) {
          c.save(); c.globalAlpha = hq;
          text(c, 'How does MOTION make a shape move?', 960, 210, { font: TK.FONT, weight: 800, size: 58, color: P.ink, align: 'center' });
          c.restore();
        }
        tag(c, 'THE WHOLE SYSTEM FIRST', 112, 130, win(t, 0.3, 1.4, 0.2), { size: 15 });
        tag(c, 'INPUT → MECHANISM → OUTPUT', 112, 130, win(t, 1.4, 2.65, 0.2), { size: 15 });
        const tk = seg(t, 8.2, 8.5);
        if (tk > 0.01) {
          c.save(); c.globalAlpha = tk;
          const dy = (1 - E.outC(tk)) * 14;
          text(c, 'Poses + timing + frames = motion.', 960, 214 + dy, { font: TK.FONT, weight: 800, size: 64, color: P.ink, align: 'center' });
          c.fillStyle = P.accent; const rw = 820 * E.outQt(seg(t, 8.4, 9.0)); c.fillRect(960 - rw / 2, 238, rw, 5);
          c.restore();
          tag(c, 'BACK TO THE WHOLE · THE ONE-LINE TAKEAWAY', 112, 130, seg(t, 8.5, 8.8), { size: 15 });
          tag(c, 'WHOLE → PART → WHOLE', 960, 840, seg(t, 8.8, 9.1), { align: 'center', size: 15, color: P.mute });
        }
        if (t > 2.6 && t < 3.2) tag(c, 'ZOOM INTO THE MECHANISM', 112, 130, seg(t, 2.6, 2.75) * (1 - ins), { size: 15 });
      }
      if (ins > 0) {
        c.save(); c.globalAlpha = ins; hwInside(c, t); c.restore();
      }
      const dark = ins > 0.5;
      FK.strip(c, t, W, H, HW_B, { label: 'How it works', dark });
      FK.caption(c, t, W, H, { name: 'How It Works', cat: 'Explainer', dark, curve: u => hwZoom(u * 10), span: [0, 10], lo: -0.12, hi: 1.15, curveLabel: 'DETAIL LEVEL / TIME' });
    },
    score(A) {
      const B = TK.BEAT;
      // machine bed: soft kick on the beat, ratchet ticks on the eighths, warm pad
      for (let b = 0; b * B < 10; b++) {
        const t = b * B;
        A.kick(t, 0.2, { f: 110, f2: 45 });
        A.noise(t + B / 2, { type: 'bandpass', f: 2400, q: 3, dur: 0.03, g: 0.05 });
      }
      [[0, [48, 55, 64]], [2, [45, 52, 60]], [4, [41, 48, 57]], [6, [43, 50, 59]], [8, [48, 55, 64]]].forEach(([t, n]) => A.chord(t, n, { type: 'triangle', dur: 2.1, g: 0.03, a: 0.3, lp: 900, rev: 0.4, width: 0.6 }));
      // belt hum at the wides
      A.osc(0, { type: 'sawtooth', f: midi(36), dur: 2.9, g: 0.012, a: 0.4, hold: true, rel: 0.3, lp: 300 });
      A.osc(7.6, { type: 'sawtooth', f: midi(36), dur: 2.4, g: 0.012, a: 0.4, hold: true, rel: 0.4, lp: 300 });
      // inputs clunk into the box; outputs hop out
      [1, 2, 9].forEach(t => { A.kick(t, 0.14, { f: 200, f2: 80, dur: 0.12 }); A.noise(t, { type: 'lowpass', f: 700, dur: 0.06, g: 0.06 }); });
      for (let k = -1; k <= 9; k++) for (let n = 1; n <= 3; n++) {
        const t = k + 1.2 + n / 2.6;
        if ((t > 0.2 && t < 2.7) || (t > 8.0 && t < 9.9)) A.pluck(t, midi([72, 76, 79][n - 1]), { g: 0.07, bright: 0.6, dur: 0.5 });
      }
      // brackets draw on
      for (let i = 0; i < 3; i++) A.osc(1.4 + i * 0.25, { f: midi(84 + i * 2), dur: 0.06, g: 0.03, type: 'triangle' });
      // zoom in: accelerating whoosh, filter opening
      A.whoosh(2.6, 0.62, { f1: 250, f2: 4200, g: 0.1, swell: 0.9 });
      A.osc(2.6, { type: 'sawtooth', f: midi(43), f2: midi(55), glide: 0.6, dur: 0.6, g: 0.03, lp: 400, lp2: 3000, lpT: 0.6 });
      A.noise(3.2, { type: 'highpass', f: 2500, dur: 0.05, g: 0.1 });
      // the steps: a badge chime each, rising
      HW_STEP.slice(0, 3).forEach((t, i) => { A.bell(t, midi([76, 79, 83][i]), { g: 0.07, dur: 1.1, rev: 0.4 }); A.pluck(t, midi([64, 67, 71][i]), { g: 0.12, bright: 0.6, dur: 0.8 }); });
      // step 1: two keyframes set
      [3.3, 3.7].forEach((t, i) => A.osc(t, { f: midi(88 + i * 5), dur: 0.08, g: 0.05, type: 'square', lp: 3000 }));
      // step 2: an eased glide, slow-fast-slow
      [5.2, 6.2].forEach(t => { if (t < 6.0) A.osc(t, { f: 330, f2: 990, glide: 0.8, dur: 0.8, g: 0.035, a: 0.25 }); });
      A.osc(4.6, { f: 330, f2: 990, glide: 0.6, dur: 0.6, g: 0.03, a: 0.2 });
      // step 3: a click per frame printed
      for (let k = 0; k < 12; k++) A.osc(6.0 + 0.05 + k * (0.95 / 12), { f: 2200 + k * 60, dur: 0.015, g: 0.05, type: 'square', lp: 5000 });
      // hand-off packets
      [4.6, 6.0].forEach(t => A.osc(t, { f: 500, f2: 1000, glide: 0.3, dur: 0.32, g: 0.05 }));
      // pull back: reverse whoosh
      A.whoosh(7.4, 0.6, { f1: 4200, f2: 250, g: 0.09, swell: 0.2 });
      // takeaway: the three step notes as one resolving phrase
      [[8.2, 76], [8.4, 79], [8.6, 83]].forEach(([t, m]) => A.pluck(t, midi(m), { g: 0.14, bright: 0.75, dur: 1.2, rev: 0.4 }));
      A.chord(8.6, [48, 55, 64, 71, 76], { type: 'triangle', dur: 1.4, g: 0.04, a: 0.03, lp: 2800, rev: 0.6, width: 0.8 });
      A.bell(8.6, midi(88), { g: 0.06, dur: 1.4 });
    },
  });

  /* =====================================================================
     VERSUS — a split-screen comparison: the square Token on warm paper
     on the left, the round variant on cool paper on the right. The four
     criteria are listed before round one and fought in that order on both
     sides: STACKS (three dropped on each; the discs roll off), ROLLS (one
     push; the square tips once, the disc keeps going), PACKS (a 4 × 3 box
     filled cell by cell; the gaps show in red) and SPINS (silhouette
     width traced as each turns). Each round fills its spec row, ticks the
     winner and adds the point to the scoreboard. At 2–2 the verdict names
     the condition: build with the square, travel with the disc.
     ===================================================================== */
  const VS_B = [
    { t0: 0, t1: 1.4, name: 'Face-off', kind: 'hook' },
    { t0: 1.4, t1: 3.0, name: 'R1 · Stacks', kind: 'act' },
    { t0: 3.0, t1: 4.6, name: 'R2 · Rolls', kind: 'act' },
    { t0: 4.6, t1: 6.2, name: 'R3 · Packs', kind: 'act' },
    { t0: 6.2, t1: 7.8, name: 'R4 · Spins', kind: 'act' },
    { t0: 7.8, t1: 10, name: 'Verdict', kind: 'turn' },
  ];
  const VS_R = [
    { n: 'STACKS', L: '3 HIGH', R: '1 HIGH', win: 0 },
    { n: 'ROLLS', L: 'TIPS ONCE', R: 'ROLLS ON', win: 1 },
    { n: 'PACKS', L: '96 % FILLED', R: '79 % FILLED', win: 0 },
    { n: 'SPINS', L: 'WOBBLES', R: 'STEADY', win: 1 },
  ];
  const vsR0 = i => 1.4 + i * 1.6, VS_DEC = 1.25, VS_VERD = 7.8;
  const vsScore = (t, side) => VS_R.filter((r, i) => r.win === side && t >= vsR0(i) + VS_DEC).length;
  const VS_FY = 500, VS_S = 110, COOL = '#e2e5ee';
  const vsTok = (side, c, x, y, s, o) => (side ? roundTok(c, x, y, s, o) : TK.token(c, x, y, s, o));

  function vsStack(c, side, cx, u) {
    const s = 96, fy = VS_FY;
    for (let k = 0; k < 3; k++) {
      const ta = 0.15 + 0.25 * k; if (u < ta) continue;
      const p = E.inQ(seg(u, ta, ta + 0.2));
      if (side === 0 || k === 0) { vsTok(side, c, cx, lerp(150, fy - s / 2 - k * s * (side ? 0 : 1), p), s); continue; }
      const dir = k === 1 ? 1 : -1, top = fy - s / 2 - s;
      let x = cx + dir * 4, y = lerp(150, top, p);
      if (u > ta + 0.2) {
        const q = E.inQ(seg(u, ta + 0.2, ta + 0.45)), a = -PI / 2 + dir * lerp(0.05, PI / 3, q);
        x = cx + s * Math.cos(a); y = fy - s / 2 + s * Math.sin(a);
        if (u > ta + 0.45) {
          const q2 = seg(u, ta + 0.45, ta + 0.62), xa = x;
          x = xa + dir * 50 * q2; y = lerp(y, fy - s / 2, E.inQ(q2));
          if (u > ta + 0.62) x += dir * 120 * E.outC(seg(u, ta + 0.62, 1.4));
        }
      }
      roundTok(c, x, y, s, { rot: (x - cx) / (s / 2) });
    }
    // height gauge
    const h = side ? 1 : Math.min(3, [0.35, 0.6, 0.85].filter(ta => u > ta).length);
    if (u > 1.0) {
      const gx = cx + (side ? -260 : 150);
      c.fillStyle = P.ink; c.fillRect(gx, fy - h * s, 3, h * s); c.fillRect(gx - 8, fy - h * s, 19, 3);
      label(c, `${h} HIGH`, gx + (side ? -14 : 18), fy - h * s + 12, { size: 14, color: P.ink, weight: 700, align: side ? 'right' : 'left', alpha: seg(u, 1.0, 1.15) });
    }
  }
  function vsRoll(c, side, cx, u) {
    const s = VS_S, fy = VS_FY, x0 = cx - 170;
    // push arrow
    const pa = seg(u, 0.1, 0.3) * (1 - seg(u, 0.45, 0.6));
    if (pa > 0.01) { c.save(); c.globalAlpha *= pa; arrow(c, x0 - s / 2 - 90 + 50 * seg(u, 0.1, 0.3), fy - s / 2, x0 - s / 2 - 12, fy - s / 2, P.ink, 5, 18); label(c, 'PUSH', x0 - s / 2 - 70, fy - s / 2 - 22, { size: 13, color: P.ink, weight: 700 }); c.restore(); }
    let x, y, rot;
    if (side === 0) {
      const th = PI / 2 * E.outC(seg(u, 0.3, 0.6)), px = x0 + s / 2;
      x = px - s / 2 * Math.cos(th) + s / 2 * Math.sin(th); y = fy - s / 2 * (Math.sin(th) + Math.cos(th)); rot = th;
    } else {
      const d = 360 * E.outQ(seg(u, 0.3, 1.3)); x = x0 + d; y = fy - s / 2; rot = d / (s / 2);
    }
    vsTok(side, c, x, y, s, { rot });
    // distance
    const dx = x - x0;
    if (u > 0.35) {
      c.strokeStyle = side === 0 ? P.ink : P.blue; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x0, fy + 26); c.lineTo(x0 + dx, fy + 26); c.moveTo(x0, fy + 18); c.lineTo(x0, fy + 34); c.moveTo(x0 + dx, fy + 18); c.lineTo(x0 + dx, fy + 34); c.stroke();
    }
  }
  function vsPack(c, side, cx, u) {
    const bw = 300, bh = 225, x0 = cx - bw / 2, y0 = 250, cs = 75;
    c.fillStyle = 'rgba(214,58,47,0.16)'; c.fillRect(x0, y0, bw, bh);
    const n = Math.min(12, Math.floor(seg(u, 0.12, 0.95) * 12 + (u > 0.12 ? 1 : 0)));
    for (let k = 0; k < n; k++) {
      const gx = x0 + (k % 4) * cs + cs / 2, gy = y0 + Math.floor(k / 4) * cs + cs / 2;
      const pop = E.outB(seg(u, 0.12 + k * 0.07, 0.22 + k * 0.07));
      c.save(); c.translate(gx, gy); c.scale(pop, pop);
      if (side === 0) { c.fillStyle = P.accent; rrect(c, -cs / 2, -cs / 2, cs, cs, cs * TK.CORNER); c.fill(); }
      else roundTok(c, 0, 0, cs, { solid: true });
      c.restore();
    }
    c.strokeStyle = P.ink; c.lineWidth = 3; c.strokeRect(x0, y0, bw, bh);
    const full = side ? 78.5 : 95.8, pct = full * n / 12;
    label(c, `COVERAGE  ${pct.toFixed(0)} %`, cx, y0 + bh + 34, { align: 'center', size: 15, color: P.ink, weight: 700 });
    if (side && n >= 12) label(c, 'GAPS', x0 + bw + 14, y0 + 44, { size: 13, color: '#c0392b', weight: 700, alpha: seg(u, 1.0, 1.1) });
  }
  function vsSpin(c, side, cx, u) {
    const s = 150, cy = 330, r = TK.CORNER * s;
    const th = u2 => 2.2 * PI * E.ioS(seg(u2, 0.12, 1.3));
    const wid = u2 => (side ? s : (s - 2 * r) * (Math.abs(Math.cos(th(u2))) + Math.abs(Math.sin(th(u2)))) + 2 * r);
    vsTok(side, c, cx, cy, s, { rot: th(u) });
    const w = wid(u);
    c.strokeStyle = side ? P.blue : P.ink; c.lineWidth = 2;
    c.beginPath(); c.moveTo(cx - w / 2, cy + 120); c.lineTo(cx + w / 2, cy + 120); c.moveTo(cx - w / 2, cy + 110); c.lineTo(cx - w / 2, cy + 130); c.moveTo(cx + w / 2, cy + 110); c.lineTo(cx + w / 2, cy + 130); c.stroke();
    label(c, `WIDTH ${Math.round(w)} px`, cx, cy + 150, { align: 'center', size: 13, ls: 2, color: P.ink, weight: 700 });
    // width trace
    const sx = cx - 150, sy = 515;
    c.fillStyle = 'rgba(23,24,28,0.12)'; c.fillRect(sx, sy, 300, 1);
    c.strokeStyle = side ? P.blue : P.accent; c.lineWidth = 2.5; c.beginPath();
    const N = Math.round(60 * clamp(u / 1.3));
    for (let k = 0; k <= N; k++) { const uu = k / 60 * 1.3, x = sx + 300 * k / 60, y = sy - (wid(uu) - s) * 0.45; k ? c.lineTo(x, y) : c.moveTo(x, y); }
    if (N > 0) c.stroke();
  }
  const VS_DEMO = [vsStack, vsRoll, vsPack, vsSpin];

  function vsTable(c, t, W) {
    const head = seg(t, 0.6, 1.0);
    if (head <= 0.01) return;
    c.save(); c.globalAlpha *= head;
    c.fillStyle = P.ink; c.fillRect(100, 566, 1720 * E.outC(head), 2);
    label(c, 'SQUARE', 820, 556, { align: 'right', size: 13, ls: 2, color: P.mute, weight: 700 });
    label(c, 'CRITERION', 960, 556, { align: 'center', size: 13, ls: 2, color: P.mute, weight: 700 });
    label(c, 'ROUND', 1100, 556, { size: 13, ls: 2, color: P.mute, weight: 700 });
    c.restore();
    VS_R.forEach((r, i) => {
      const y = 612 + i * 62, r0 = vsR0(i), lst = seg(t, 0.75 + i * 0.1, 0.95 + i * 0.1);
      if (lst <= 0.01) return;
      const act = t >= r0, cur = t >= r0 && t < r0 + 1.6 && t < VS_VERD, dec = seg(t, r0 + VS_DEC - 0.05, r0 + VS_DEC + 0.1);
      c.save(); c.globalAlpha *= lst;
      if (cur) { c.fillStyle = 'rgba(255,90,31,0.10)'; c.fillRect(100, y - 30, 1720, 60); }
      c.fillStyle = 'rgba(23,24,28,0.1)'; c.fillRect(100, y + 30, 1720, 1);
      label(c, `R${i + 1}`, 112, y + 6, { size: 15, color: act ? P.ink : P.mute, weight: 700 });
      // criterion pill
      const pp = act ? E.outB(seg(t, r0, r0 + 0.25)) : 1;
      c.save(); c.translate(960, y); c.scale(pp, pp);
      c.fillStyle = act ? P.ink : 'rgba(23,24,28,0.08)'; rrect(c, -96, -22, 192, 44, 22); c.fill();
      label(c, r.n, 0, 7, { align: 'center', size: 18, ls: 3, color: act ? '#fff' : P.mute, weight: 700 });
      c.restore();
      if (dec > 0.01) {
        [[0, r.L, 820, 'right'], [1, r.R, 1100, 'left']].forEach(([side, v, x, al]) => {
          const won = r.win === side;
          c.save(); c.globalAlpha *= dec;
          text(c, v, x, y + 12, { font: TK.FONT, weight: 800, size: 32, color: won ? P.ink : 'rgba(23,24,28,0.35)', align: al, ls: 1 });
          if (won) {
            const w = measure(c, v, 32, 800, TK.FONT, 1), cxk = side ? x + w + 34 : x - w - 34, k = E.outB(seg(t, r0 + VS_DEC, r0 + VS_DEC + 0.2));
            c.fillStyle = side ? P.blue : P.accent; c.beginPath(); c.arc(cxk, y, 17 * k, 0, TAU); c.fill();
            c.strokeStyle = '#fff'; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round';
            if (k > 0.5) { c.beginPath(); c.moveTo(cxk - 8, y); c.lineTo(cxk - 2, y + 6); c.lineTo(cxk + 8, y - 6); c.stroke(); }
          }
          c.restore();
        });
      }
      c.restore();
    });
    tag(c, 'SAME CRITERIA · SAME ORDER · BOTH SIDES', 960, 872, seg(t, 1.0, 1.3), { align: 'center', size: 14, color: P.mute });
  }

  MG.film({
    id: 'formatversus', dur: 10, poster: 7.6,
    fonts,
    meta: {
      family: 'M', name: 'Versus', sub: 'Split-screen comparison, round by round', era: '1930s print — · video 2000s —',
      origin: 'Side-by-side product comparison began in print: Consumers Union’s Consumer Reports (from 1936) rated rival products against the same criteria in the same table, and comparative advertising grew on American television after the FTC encouraged it in 1972 — the Pepsi Challenge (1975) turned it into a blind taste test with a score. Car television made the round-by-round head-to-head a format — Top Gear’s challenges, and the drag races and spec sheets of the web reviews that followed — and YouTube tech channels such as MKBHD and Linus Tech Tips settled its modern grammar: split screen, the same tests in the same order, a running score, and a verdict that usually says what it depends on.',
      works: 'Consumer Reports ratings tables (Consumers Union, 1936 —) · The Pepsi Challenge (BBDO for Pepsi, 1975) · Marques Brownlee (MKBHD), smartphone versus videos (2010s —)',
      tech: ['Same criteria in the same order for both sides', 'One round at a time, tallied on a running score', 'A verdict that names the condition'],
      accent: '#ff5a1f',
      motionDNA: 'A 1.4 s face-off: both contenders slide in from their edges, the VS badge slams at 0.8 s and the four criteria drop into the table. Four rounds of 1.6 s, each opening on a bell: the criterion pill pops, the same live test plays on both halves at once, and 1.25 s in the row fills, the winner is ticked and its score ticks up with a sound panned to its side. At 2–2 the verdict lands at 7.8 s and holds.',
      visualDNA: 'A hard vertical split: warm paper with the orange square Token on the left, cool blue-grey paper with a blue disc (the same off-centre hole) on the right. A scoreboard across the top with a black VS roundel; a spec table across the bottom with the criteria in black pills down the centre line, results in heavy Archivo either side, the loser greyed, the winner ticked in its own colour. Gauges, distance bars, red gaps and a width trace in each test.',
      transitions: 'Hard split held throughout; each round cross-fades its tests in place; the verdict replaces the tests while the table stays',
      implementation: ['Two cameras or two renders locked to the same framing, comped side by side', 'A test script fixed before shooting: criteria, order, scoring rule', 'Canvas 2D: one test function per round drawn twice with a side flag; score derived from the round table'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      // split ground
      TK.stage(c, W, H);
      c.save(); c.globalAlpha = 0.75; c.fillStyle = COOL; c.fillRect(960, 0, 960, H); c.restore();
      c.save(); c.globalAlpha = 1 - seg(t, VS_VERD - 0.1, VS_VERD + 0.15) * 0.85; c.fillStyle = P.ink; c.fillRect(958, 222, 4, 313 * E.outC(seg(t, 0, 0.5))); c.restore();
      // round in progress
      const ri = t < vsR0(0) ? -1 : t >= VS_VERD ? 4 : Math.floor((t - vsR0(0)) / 1.6), u = ri >= 0 && ri < 4 ? t - vsR0(ri) : 0;
      if (ri === -1) {
        // face-off: contenders slide in from their edges
        const e = E.outB(seg(t, 0.1, 0.65), 1.2);
        TK.shadow(c, lerp(-200, 480, e), VS_FY, 170, 0); TK.token(c, lerp(-200, 480, e), VS_FY - 85, 170);
        TK.shadow(c, lerp(2120, 1440, e), VS_FY, 170, 0); roundTok(c, lerp(2120, 1440, e), VS_FY - 85, 170, { rot: (lerp(2120, 1440, e) - 1440) / 85 });
        c.fillStyle = 'rgba(23,24,28,0.2)'; c.fillRect(180, VS_FY, 600, 2); c.fillRect(1140, VS_FY, 600, 2);
        tag(c, 'TWO CONTENDERS · ONE SPLIT FRAME', 112, 250, seg(t, 0.4, 0.6) * (1 - seg(t, 1.25, 1.4)), { size: 14 });
      } else if (ri < 4) {
        const a = seg(u, 0, 0.12) * (1 - seg(u, 1.45, 1.6));
        c.save(); c.globalAlpha = a;
        [[0, 480], [1, 1440]].forEach(([side, cx]) => {
          c.save(); c.beginPath(); side ? c.rect(962, 200, 958, 360) : c.rect(0, 200, 958, 360); c.clip();
          if (ri !== 2 && ri !== 3) { c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(cx - 320, VS_FY, 640, 2); }
          VS_DEMO[ri](c, side, cx, u);
          c.restore();
        });
        // round pill on the split
        c.fillStyle = P.accent; rrect(c, 960 - 86, 210, 172, 36, 18); c.fill();
        label(c, `ROUND ${ri + 1} / 4`, 960, 234, { align: 'center', size: 15, ls: 2.5, color: '#fff', weight: 700 });
        c.restore();
      } else {
        // verdict
        const v = seg(t, VS_VERD, VS_VERD + 0.3), bob = Math.sin((t - VS_VERD) * 5) * 6;
        c.save(); c.globalAlpha = v;
        TK.token(c, 480, 410 + bob, 110); roundTok(c, 1440, 410 - bob, 110, { rot: (t - VS_VERD) * 3 });
        const dy = (1 - E.outC(v)) * 16;
        text(c, 'It depends on the job.', 960, 300 + dy, { font: TK.FONT, weight: 800, size: 72, color: P.ink, align: 'center' });
        c.restore();
        const l1 = seg(t, 8.2, 8.45), l2 = seg(t, 8.45, 8.7);
        label(c, 'TO BUILD  →  SQUARE', 480, 515, { align: 'center', size: 22, ls: 3, color: P.accentD, weight: 700, alpha: l1 });
        label(c, 'TO TRAVEL  →  ROUND', 1440, 515, { align: 'center', size: 22, ls: 3, color: P.blue, weight: 700, alpha: l2 });
        tag(c, 'VERDICT · NAME WHAT IT DEPENDS ON', 960, 372, seg(t, 8.0, 8.3), { align: 'center', size: 14 });
      }
      // scoreboard
      const sb = seg(t, 0.2, 0.6);
      c.save(); c.globalAlpha = sb;
      text(c, 'SQUARE', 112, 158, { font: TK.FONT, weight: 800, size: 40, color: P.ink, ls: 3 });
      text(c, 'ROUND', 1808, 158, { font: TK.FONT, weight: 800, size: 40, color: P.ink, ls: 3, align: 'right' });
      [[0, 860, 'right', P.accent], [1, 1060, 'left', P.blue]].forEach(([side, x, al, col]) => {
        const sc = vsScore(t, side), lastI = VS_R.findIndex((r, i) => r.win === side && t >= vsR0(i) + VS_DEC && t < vsR0(i) + VS_DEC + 0.3);
        const pop = lastI >= 0 ? 1 + 0.3 * sinc(seg(t, vsR0(lastI) + VS_DEC, vsR0(lastI) + VS_DEC + 0.3)) : 1;
        c.save(); c.translate(x, 140); c.scale(pop, pop);
        text(c, String(sc), 0, 0, { font: TK.FONT, weight: 900, size: 84, color: col, align: al, base: 'middle' });
        c.restore();
      });
      c.restore();
      const vp = E.outB(seg(t, 0.75, 1.0), 2.4);
      if (vp > 0.01) {
        c.save(); c.translate(960, 140); c.scale(vp, vp);
        c.fillStyle = P.ink; c.beginPath(); c.arc(0, 0, 46, 0, TAU); c.fill();
        text(c, 'VS', 0, 3, { font: TK.FONT, weight: 900, size: 38, color: P.ground, align: 'center', base: 'middle', ls: 1 });
        c.restore();
      }
      label(c, t >= VS_VERD ? 'TIE · 2 – 2' : 'RUNNING SCORE', 960, 212 + (t >= VS_VERD ? 0 : 0), { align: 'center', size: 13, ls: 2.5, color: P.mute, weight: 700, alpha: seg(t, 1.0, 1.3) * (ri >= 0 && ri < 4 ? 0 : 1) });
      tag(c, 'RUNNING SCORE · ONE POINT PER ROUND', 112, 206, seg(t, 1.5, 1.8) * (1 - seg(t, VS_VERD - 0.2, VS_VERD)), { size: 13, color: P.mute });
      vsTable(c, t, W);
      FK.strip(c, t, W, H, VS_B, { label: 'Versus' });
      FK.caption(c, t, W, H, { name: 'Versus', cat: 'Explainer' });
    },
    score(A) {
      const B = TK.BEAT;
      // driving bed
      for (let b = 0; b * B < 7.8; b++) { const t = b * B; A.kick(t, 0.24, { f: 120, f2: 45 }); A.hat(t + B / 2, 0.04); if (b % 2) A.clap(t, 0.06); }
      [[0, [45, 52, 57]], [2, [41, 48, 57]], [4, [43, 50, 55]], [6, [40, 47, 56]]].forEach(([t, n]) => A.chord(t, n, { type: 'sawtooth', dur: 2.0, g: 0.018, a: 0.2, lp: 800, rev: 0.3, width: 0.7 }));
      // face-off: two whooshes from the sides, the VS slam
      A.whoosh(0.1, 0.5, { f1: 300, f2: 2400, g: 0.08, pan: -0.7 }); A.whoosh(0.1, 0.5, { f1: 300, f2: 2400, g: 0.08, pan: 0.7 });
      A.impact(0.8, 0.32); A.clap(0.8, 0.12);
      for (let i = 0; i < 4; i++) A.osc(0.75 + i * 0.1, { f: midi(76 + i * 2), dur: 0.05, g: 0.03, type: 'triangle' });
      // each round: the bell, the test sounds on both sides, the point panned to the winner
      VS_R.forEach((r, i) => {
        const r0 = vsR0(i);
        A.bell(r0, midi(88), { g: 0.07, dur: 0.9, rev: 0.3 }); A.bell(r0 + 0.12, midi(88), { g: 0.05, dur: 0.8, rev: 0.3 });
        if (i === 0) {
          for (let k = 0; k < 3; k++) { const ta = r0 + 0.35 + 0.25 * k; A.kick(ta, 0.16, { f: 180, f2: 80, dur: 0.12 }); A.noise(ta, { type: 'lowpass', f: 900, dur: 0.05, g: 0.06, pan: -0.5 }); }
          A.noise(r0 + 0.85, { type: 'bandpass', f: 600, q: 2, dur: 0.6, g: 0.04, pan: 0.6 }); A.noise(r0 + 1.1, { type: 'bandpass', f: 600, q: 2, dur: 0.5, g: 0.04, pan: 0.6 });
        } else if (i === 1) {
          A.noise(r0 + 0.3, { type: 'highpass', f: 2000, dur: 0.04, g: 0.08 });
          A.kick(r0 + 0.6, 0.18, { f: 160, f2: 70, dur: 0.15 });
          A.noise(r0 + 0.3, { type: 'bandpass', f: 500, f2: 250, q: 1.5, dur: 1.0, g: 0.05, pan: 0.6 });
        } else if (i === 2) {
          for (let k = 0; k < 12; k++) { const tt = r0 + 0.17 + k * 0.07; A.osc(tt, { f: midi(72 + k), dur: 0.04, g: 0.03, type: 'square', lp: 2500, pan: -0.5 }); A.osc(tt, { f: midi(72 + k), dur: 0.04, g: 0.03, type: 'triangle', pan: 0.5 }); }
        } else {
          A.whoosh(r0 + 0.12, 1.2, { f1: 400, f2: 1400, q: 4, g: 0.05, pan: 0.5 });
          for (let k = 0; k < 8; k++) A.noise(r0 + 0.2 + k * 0.14, { type: 'bandpass', f: 1200, q: 3, dur: 0.05, g: 0.04, pan: -0.5 });
        }
        const pan = r.win ? 0.7 : -0.7, td = r0 + VS_DEC;
        A.pluck(td, midi(r.win ? 79 : 76), { g: 0.16, bright: 0.8, dur: 0.9, pan, rev: 0.3 });
        A.pluck(td + 0.08, midi(r.win ? 86 : 83), { g: 0.12, bright: 0.8, dur: 0.9, pan, rev: 0.3 });
        A.noise(td, { type: 'highpass', f: 5000, dur: 0.08, g: 0.06, pan });
      });
      // verdict: the two themes together, resolving
      A.impact(VS_VERD, 0.25);
      A.chord(VS_VERD, [45, 57, 64, 69, 72, 76], { type: 'triangle', dur: 2.1, g: 0.035, a: 0.05, lp: 2400, rev: 0.6, width: 0.9 });
      A.pluck(8.2, midi(76), { g: 0.14, bright: 0.7, dur: 1.2, pan: -0.6, rev: 0.4 });
      A.pluck(8.45, midi(79), { g: 0.14, bright: 0.7, dur: 1.2, pan: 0.6, rev: 0.4 });
      A.bell(8.7, midi(88), { g: 0.06, dur: 1.2 });
    },
  });

  /* =====================================================================
     MYTH VS FACT — the debunking format. A short hook, then three myths
     about motion, each in the same order: the myth stated once, plainly;
     a red MYTH stamp; the evidence, played out in a panel underneath (two
     frame-rate lanes; a drop strobed at equal times; a squash with its
     area read out); then the myth is struck through and replaced in place
     by the FACT in green, with a green stamp. A tally top-right counts the
     myths debunked. The recap lists only the three facts — the myths are
     never repeated — and ends on them.
     ===================================================================== */
  const MY_RED = '#d23b2f', MY_GREEN = '#1e9a56';
  const MY = [
    { myth: 'Smooth motion needs 60 fps.', fact: '24 fps is plenty. Timing makes it smooth.', src: 'SOUND FILM SET 24 FPS AS THE STANDARD, c. 1926–29' },
    { myth: 'Linear motion looks natural.', fact: 'Real things ease in and ease out.', src: 'GALILEO, TWO NEW SCIENCES (1638): DISTANCES IN EQUAL TIMES GROW 1 : 3 : 5 : 7' },
    { myth: 'Squash makes a shape smaller.', fact: 'Squash keeps the volume: flatter, wider.', src: 'THOMAS & JOHNSTON, THE ILLUSION OF LIFE (1981): SQUASH AND STRETCH' },
  ];
  const MY_T0 = 0.8, MY_LEN = 2.4, myStart = i => MY_T0 + i * MY_LEN;
  const MY_B = [{ t0: 0, t1: MY_T0, name: 'Hook', kind: 'hook' }];
  MY.forEach((m, i) => {
    const a = myStart(i);
    MY_B.push({ t0: a, t1: a + 0.7, name: `Myth ${i + 1}`, kind: 'title' }, { t0: a + 0.7, t1: a + 1.5, name: 'Evidence', kind: 'act' }, { t0: a + 1.5, t1: a + MY_LEN, name: `Fact ${i + 1}`, kind: 'turn' });
  });
  MY_B.push({ t0: 8.0, t1: 10, name: 'The facts', kind: 'cta' });
  const MY_FACT = 1.5;

  function myStamp(c, s, x, y, col, on, rot) {
    if (on <= 0.01) return;
    const k = lerp(1.9, 1, E.outQt(clamp(on)));
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k); c.globalAlpha *= clamp(on * 1.4) * 0.92;
    const w = measure(c, s, 56, 900, TK.FONT, 8) + 56;
    c.strokeStyle = col; c.lineWidth = 6; rrect(c, -w / 2, -46, w, 92, 10); c.stroke();
    c.lineWidth = 2; rrect(c, -w / 2 + 9, -37, w - 18, 74, 6); c.stroke();
    text(c, s, 4, 3, { font: TK.FONT, weight: 900, size: 56, color: col, align: 'center', base: 'middle', ls: 8 });
    c.restore();
  }
  function myCheck(c, x, y, r, col, k = 1) {
    c.fillStyle = col; c.beginPath(); c.arc(x, y, r * k, 0, TAU); c.fill();
    if (k > 0.5) { c.strokeStyle = '#fff'; c.lineWidth = r * 0.24; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(x - r * 0.45, y); c.lineTo(x - r * 0.1, y + r * 0.35); c.lineTo(x + r * 0.45, y - r * 0.35); c.stroke(); }
  }
  // evidence 1: the same move at 60 fps linear and 24 fps eased
  function myEv1(c, e) {
    const L = [[505, '60 FPS · LINEAR', 60, E.lin], [675, '24 FPS · EASED', 24, E.ioS]];
    L.forEach(([y, nm, fps, ease], li) => {
      label(c, nm, 160, y - 20, { size: 16, color: P.ink, weight: 700 });
      label(c, `${fps} FRAMES / s`, 160, y + 6, { size: 13, ls: 2, color: P.mute });
      c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(520, y, 1180, 2);
      const sp = seg(e, 0, 0.5);
      for (let k = 0; k <= fps; k++) { const x = 560 + 1100 * ease(k / fps); c.fillStyle = li ? P.accentD : P.mute; c.fillRect(x - 1, y + 6, 2, (li ? 18 : 12) * sp); }
      const p = clamp(((Math.max(0, e) % 1.1)) / 1.0), pq = Math.floor(p * fps) / fps;
      TK.token(c, 560 + 1100 * ease(pq), y - 44, 80, { rot: PI / 2 * ease(pq), alpha: li ? 1 : 0.7, color: li ? P.accent : '#b9b4aa' });
    });
    label(c, 'FEWER FRAMES, BETTER SPACING · THE SPACING SETS THE FEEL', 1700, 760, { align: 'right', size: 14, ls: 2, color: P.ink, weight: 700, alpha: seg(e, 0.4, 0.6) });
  }
  // evidence 2: a drop, strobed at equal times
  function myEv2(c, e) {
    const top = 440, span = 320, X0 = 760, X1 = 1160, fl = (k => k / 5), fg = (k => (k / 5) * (k / 5));
    const n = Math.min(6, Math.floor(seg(e, 0, 0.8) * 6) + (e > 0 ? 1 : 0));
    c.fillStyle = 'rgba(23,24,28,0.3)'; c.fillRect(640, top + span + 22, 640, 2);
    label(c, 'LINEAR', X0, 412, { align: 'center', size: 15, color: P.mute, weight: 700 });
    label(c, 'GRAVITY', X1, 412, { align: 'center', size: 15, color: P.accentD, weight: 700 });
    for (let k = 0; k < n; k++) {
      const yl = top + span * fl(k), yg = top + span * fg(k), last = k === n - 1;
      // same instant on both sides: a dashed tie line
      c.save(); c.setLineDash([3, 6]); c.strokeStyle = 'rgba(23,24,28,0.22)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(X0 + 14, yl); c.lineTo(X1 - 14, yg); c.stroke(); c.restore();
      label(c, `${(k * 0.1).toFixed(1)} s`, X0 - 40, yl + 5, { align: 'right', size: 12, ls: 1, color: P.mute });
      [[X0, yl, '#b9b4aa'], [X1, yg, P.accent]].forEach(([x, y, col]) => {
        if (last) TK.token(c, x, y, 50, { color: col });
        else { c.fillStyle = col; c.globalAlpha *= 0.6; c.beginPath(); c.arc(x, y, 8, 0, TAU); c.fill(); c.globalAlpha /= 0.6; }
      });
      if (k > 0) label(c, String(2 * k - 1), X1 + 44, (top + span * fg(k - 1) + yg) / 2 + 6, { size: 15, color: P.accentD, weight: 700 });
    }
    label(c, 'EQUAL TIMES,', 1330, 560, { size: 22, color: P.ink, weight: 700 });
    label(c, 'GROWING GAPS', 1330, 592, { size: 22, color: P.accentD, weight: 700 });
    label(c, '1 : 3 : 5 : 7 : 9', 1330, 640, { size: 20, color: P.ink, alpha: seg(e, 0.7, 0.9) });
  }
  // evidence 3: squash with area kept vs. shrink
  function myEv3(c, e) {
    const fl = 720, s = 150, ph = ((Math.max(0, e) + 0.17) % 0.8) / 0.8, sq = sinc(seg(ph, 0.25, 0.75));
    const sy = 1 - 0.38 * sq;
    [[640, 1 / sy, sy, 'VOLUME KEPT', MY_GREEN], [1280, sy, sy, 'VOLUME LOST', MY_RED]].forEach(([x, kx, ky, nm, col], i) => {
      label(c, nm, x, 418, { align: 'center', size: 16, color: col, weight: 700 });
      c.fillStyle = 'rgba(23,24,28,0.3)'; c.fillRect(x - 240, fl, 480, 2);
      c.save(); c.setLineDash([6, 6]); c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 2; c.strokeRect(x - s / 2, fl - s, s, s); c.restore();
      TK.token(c, x, fl - s * ky / 2, s, { sx: kx, sy: ky, color: i ? '#b9b4aa' : P.accent });
      const area = kx * ky;
      label(c, `W ${kx.toFixed(2)} × H ${ky.toFixed(2)} = ${area.toFixed(2)}`, x, fl + 40, { align: 'center', size: 18, color: col, weight: 700 });
    });
    label(c, 'AREA OF THE REST POSE = 1.00', 960, 474, { align: 'center', size: 13, ls: 2, color: P.mute });
  }
  const MY_EV = [myEv1, myEv2, myEv3];

  function myBlock(c, t, i) {
    const m = MY[i], u = t - myStart(i), out = 1 - seg(u, MY_LEN - 0.15, MY_LEN);
    if (u < 0 || u > MY_LEN) return;
    c.save(); c.globalAlpha *= out;
    const isFact = u >= MY_FACT + 0.3;
    // kicker
    const kick = isFact ? `FACT ${i + 1} OF 3` : `MYTH ${i + 1} OF 3`;
    label(c, kick, 120, 158, { size: 18, ls: 4, color: isFact ? MY_GREEN : MY_RED, weight: 700, alpha: seg(u, 0, 0.15) });
    // the myth, once
    const ms = fit(c, m.myth, 66, 1180), mo = 1 - seg(u, MY_FACT + 0.18, MY_FACT + 0.3);
    if (mo > 0.01) {
      c.save(); c.globalAlpha *= mo * seg(u, 0, 0.18);
      const dy = (1 - E.outC(seg(u, 0, 0.25))) * 12 - 18 * seg(u, MY_FACT + 0.18, MY_FACT + 0.3);
      text(c, m.myth, 120, 250 + dy, { font: TK.FONT, weight: 800, size: ms, color: P.ink });
      const st = seg(u, MY_FACT, MY_FACT + 0.15);
      if (st > 0) { c.fillStyle = MY_RED; c.fillRect(114, 250 + dy - ms * 0.33, (measure(c, m.myth, ms) + 12) * st, 7); }
      c.restore();
    }
    // the fact, in place
    const fo = seg(u, MY_FACT + 0.3, MY_FACT + 0.45);
    if (fo > 0.01) {
      const fs = fit(c, m.fact, 66, 1180);
      c.save(); c.globalAlpha *= fo;
      text(c, m.fact, 120, 250 + (1 - E.outC(fo)) * 14, { font: TK.FONT, weight: 800, size: fs, color: MY_GREEN });
      c.restore();
    }
    // stamps
    myStamp(c, 'MYTH', 1570, 220, MY_RED, seg(u, 0.35, 0.5) * (1 - seg(u, MY_FACT + 0.15, MY_FACT + 0.3)), -0.12);
    myStamp(c, 'FACT', 1570, 220, MY_GREEN, seg(u, MY_FACT + 0.3, MY_FACT + 0.45), 0.08);
    // convention tags
    tag(c, 'STATE THE MYTH ONCE · PLAINLY', 124, 312, seg(u, 0.15, 0.3) * (1 - seg(u, 0.65, 0.75)), { size: 14, color: P.mute, dot: MY_RED });
    tag(c, 'CORRECT IT IN PLACE · END ON THE FACT', 124, 312, seg(u, MY_FACT + 0.35, MY_FACT + 0.5), { size: 14, color: P.mute, dot: MY_GREEN });
    // evidence panel
    const ep = seg(u, 0.6, 0.8);
    if (ep > 0.01) {
      c.save(); c.globalAlpha *= ep;
      c.fillStyle = 'rgba(255,255,255,0.5)'; rrect(c, 120, 340, 1680, 480, 16); c.fill();
      c.strokeStyle = 'rgba(23,24,28,0.25)'; c.lineWidth = 2; c.stroke();
      tag(c, 'EVIDENCE', 150, 382, 1, { size: 15 });
      MY_EV[i](c, u - 0.62);
      label(c, `SOURCE · ${m.src}`, 150, 800, { size: 12, ls: 1.5, color: P.mute });
      c.restore();
    }
    c.restore();
  }

  MG.film({
    id: 'formatmyth', dur: 10, poster: 7.25,
    fonts,
    meta: {
      family: 'M', name: 'Myth vs Fact', sub: 'Debunking: myth, evidence, the fact', era: '1990s — · video 2003 —',
      origin: 'Debunking as a format took shape in the 1990s and 2000s: the urban-legend site Snopes (from 1994), Discovery’s MythBusters (2003–2018), which tested one myth per segment and stamped it BUSTED, CONFIRMED or PLAUSIBLE, and the “myth vs fact” sheets of public-health agencies, from vaccine leaflets to the WHO’s COVID-19 Mythbusters pages (2020). Research on correcting misinformation shaped its order: Cook and Lewandowsky’s The Debunking Handbook (2011; updated 2020) advises stating the myth only once, explaining why it is wrong, and leading and ending with the fact — the “truth sandwich” — so the myth is not what sticks.',
      works: 'MythBusters (Beyond Productions for Discovery, 2003–2018) · The Debunking Handbook (John Cook & Stephan Lewandowsky, 2011 / 2020) · WHO, Coronavirus disease (COVID-19) advice for the public: Mythbusters (2020)',
      tech: ['State the myth once, plainly, and flag it', 'Correct it with evidence, not assertion', 'End on the fact; the recap never repeats the myth'],
      accent: '#ff5a1f',
      motionDNA: 'A 0.8 s hook, then three blocks of 2.4 s in identical order: the myth eases up (0.2 s), the red stamp slams down at 0.35 s, the evidence panel fades in at 0.6 s and plays its test, at 1.5 s a red strike draws through the myth, which drops away while the fact rises in green in the same place and the green stamp lands. The recap at 8 s ticks the three facts on, a quarter-second apart, and holds.',
      visualDNA: 'The Technique Atlas paper stage; heavy Archivo statements set flush left; double-ruled rubber stamps, MYTH in red tilted left, FACT in green tilted right; a white evidence panel with mono labels and a cited source line; two frame-rate lanes with frame ticks, a strobed drop with gap counts, a squash with its width × height read out against a dashed rest pose; a three-dot debunked tally top-right.',
      transitions: 'Strike-through and in-place replacement of the myth by the fact; stamps scale down onto the page; blocks fade through the paper',
      implementation: ['Script per myth: claim (once), evidence, fact; recap of facts only', 'After Effects: stamp precomps with scale-down and a camera nudge on impact', 'Canvas 2D: a myth table driving one block layout; evidence as one small simulation per myth'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const nudge = MY.reduce((a, m, i) => a + sinc(seg(t - myStart(i), 0.42, 0.55)) * 5 + sinc(seg(t - myStart(i), MY_FACT + 0.37, MY_FACT + 0.5)) * 3, 0);
      TK.stage(c, W, H);
      c.save(); c.translate(0, nudge);
      // hook
      if (t < MY_T0 + 0.05) {
        const a = seg(t, 0.05, 0.25) * (1 - seg(t, MY_T0 - 0.15, MY_T0));
        c.save(); c.globalAlpha = a;
        label(c, 'MYTH  vs  FACT', 960, 360, { align: 'center', size: 20, ls: 6, color: P.mute, weight: 700 });
        text(c, '3 myths about motion.', 960, 470, { font: TK.FONT, weight: 800, size: 84, color: P.ink, align: 'center' });
        const b = E.outB(seg(t, 0.15, 0.45));
        TK.token(c, 860, 610, 80 * b, { rot: (1 - b) * 0.8 });
        roundTok(c, 960, 610, 80 * b, { color: MY_RED });
        roundTok(c, 1060, 610, 80 * b, { color: MY_GREEN });
        c.restore();
      }
      for (let i = 0; i < MY.length; i++) myBlock(c, t, i);
      // recap: the facts only
      if (t >= 8.0) {
        const a = seg(t, 8.0, 8.2);
        c.save(); c.globalAlpha = a;
        label(c, 'THE FACTS', 120, 158, { size: 18, ls: 4, color: MY_GREEN, weight: 700 });
        c.restore();
        MY.forEach((m, i) => {
          const k = seg(t, 8.15 + i * 0.25, 8.4 + i * 0.25);
          if (k <= 0.01) return;
          const y = 290 + i * 120;
          c.save(); c.globalAlpha = clamp(k * 1.5);
          myCheck(c, 160, y - 20, 30, MY_GREEN, E.outB(k));
          text(c, m.fact, 220 + (1 - E.outC(k)) * 20, y, { font: TK.FONT, weight: 800, size: fit(c, m.fact, 58, 1100), color: P.ink });
          c.restore();
        });
        tag(c, 'RECAP THE FACTS ONLY · THE MYTH IS NOT REPEATED', 124, 700, seg(t, 8.9, 9.2), { size: 15, color: P.mute, dot: MY_GREEN });
        // sign-off: the Token, squashing with its volume kept
        const sp = (t - 8.0) % 0.8 / 0.8, sq = sinc(seg(sp, 0.3, 0.7)), sy = 1 - 0.3 * sq, lift = 120 * Math.max(0, Math.cos(PI * sp)) * (1 - sq);
        c.save(); c.globalAlpha = seg(t, 8.6, 8.9);
        c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(1500, 800, 260, 2);
        c.fillStyle = P.shadow; c.beginPath(); c.ellipse(1630, 804, 60 * (1 - lift / 400), 7, 0, 0, TAU); c.fill();
        TK.token(c, 1630, 800 - 55 * sy - lift * 0.6, 110, { sx: 1 / sy, sy });
        c.restore();
      }
      c.restore();
      // debunked tally
      const done = MY.filter((m, i) => t >= myStart(i) + MY_FACT + 0.3).length;
      const ta = seg(t, 0.8, 1.0);
      if (ta > 0.01) {
        c.save(); c.globalAlpha = ta;
        label(c, `DEBUNKED ${done} / 3`, 1708, 112, { align: 'right', size: 14, ls: 2.5, color: P.ink, weight: 700 });
        for (let i = 0; i < 3; i++) {
          const x = 1734 + i * 34, d = t >= myStart(i) + MY_FACT + 0.3, live = t >= myStart(i);
          if (d) myCheck(c, x, 106, 12, MY_GREEN, E.outB(seg(t, myStart(i) + MY_FACT + 0.3, myStart(i) + MY_FACT + 0.45)));
          else { c.strokeStyle = live ? MY_RED : 'rgba(23,24,28,0.25)'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, 106, 11, 0, TAU); c.stroke(); }
        }
        c.restore();
      }
      FK.strip(c, t, W, H, MY_B, { label: 'Myth vs fact' });
      FK.caption(c, t, W, H, { name: 'Myth vs Fact', cat: 'Explainer' });
    },
    score(A) {
      const B = TK.BEAT;
      // light bed
      for (let b = 0; b * B < 10; b++) { const t = b * B; A.kick(t, 0.18, { f: 110, f2: 45 }); A.hat(t + B / 2, 0.03); }
      [[0, [45, 52, 60]], [2, [41, 48, 57]], [4, [43, 50, 59]], [6, [40, 47, 55]], [8, [48, 55, 64]]].forEach(([t, n]) => A.chord(t, n, { type: 'triangle', dur: 2.1, g: 0.03, a: 0.3, lp: 900, rev: 0.4, width: 0.6 }));
      // hook
      [[0.15, 72], [0.25, 76], [0.35, 79]].forEach(([t, m]) => A.pluck(t, midi(m), { g: 0.12, bright: 0.7, dur: 0.8 }));
      MY.forEach((m, i) => {
        const a = myStart(i);
        // myth stated, then the stamp: a thud and a sour buzzer
        A.whoosh(a, 0.25, { f1: 400, f2: 1800, g: 0.04 });
        A.kick(a + 0.42, 0.34, { f: 90, f2: 40, dur: 0.3 }); A.noise(a + 0.42, { type: 'lowpass', f: 1200, dur: 0.12, g: 0.12 });
        A.osc(a + 0.45, { type: 'square', f: midi(50), dur: 0.28, g: 0.03, lp: 1200 }); A.osc(a + 0.45, { type: 'square', f: midi(51), dur: 0.28, g: 0.03, lp: 1200 });
        // evidence sounds
        const e = a + 0.62;
        if (i === 0) { for (let k = 0; k < 12; k++) A.osc(e + k * (1 / 24) * 2, { f: 2600, dur: 0.012, g: 0.03, type: 'square', lp: 5000 }); }
        else if (i === 1) { for (let k = 0; k < 6; k++) A.osc(e + k * 0.8 / 6, { f: midi(84 - k * 2), dur: 0.05, g: 0.04, type: 'triangle' }); A.kick(e + 0.8, 0.16, { f: 200, f2: 80, dur: 0.12 }); }
        else { [0.23, 1.03].forEach(d => { A.osc(e + d - 0.1, { f: 180, f2: 90, dur: 0.15, g: 0.08, type: 'triangle' }); A.osc(e + d + 0.1, { f: 300, f2: 600, glide: 0.2, dur: 0.2, g: 0.04 }); }); }
        // strike, then the fact: a bright major ding and the stamp
        A.noise(a + MY_FACT, { type: 'bandpass', f: 2500, f2: 5000, dur: 0.15, g: 0.05 });
        A.kick(a + MY_FACT + 0.4, 0.22, { f: 140, f2: 60, dur: 0.2 });
        A.chord(a + MY_FACT + 0.25, [60, 64, 67, 72], { type: 'triangle', dur: 0.9, g: 0.04, a: 0.01, lp: 3000, rev: 0.5, width: 0.8 });
        A.bell(a + MY_FACT + 0.4, midi([84, 86, 88][i]), { g: 0.07, dur: 1.0, rev: 0.4 });
      });
      // recap: one tick per fact, rising, and a resolving chord
      for (let i = 0; i < 3; i++) A.pluck(8.15 + i * 0.25, midi([76, 79, 84][i]), { g: 0.15, bright: 0.8, dur: 1.0, rev: 0.4 });
      A.chord(8.9, [48, 55, 64, 67, 72], { type: 'triangle', dur: 1.1, g: 0.045, a: 0.03, lp: 3000, rev: 0.6, width: 0.8 });
      A.bell(8.9, midi(84), { g: 0.06, dur: 1.1 });
      for (let k = 0; k < 2; k++) A.osc(8.0 + 0.8 * k + 0.4, { f: 180, f2: 90, dur: 0.12, g: 0.06, type: 'triangle' });
    },
  });
})();
