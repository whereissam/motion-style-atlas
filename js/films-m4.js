/* batch m4 — Narrative Formats · Explainer: formattutorial · formatproblem · formatbeforeafter.
   formattutorial (a screen-recorded how-to: an intro card promising the result, three numbered
   steps — each one tool and one action, with the cursor, click ripples, keystroke badges and a
   spotlight on the control in use — then a recap of the steps and a next-lesson card) ·
   formatproblem (the problem → solution explainer arc: the grey Token fails to climb a ledge, the
   stakes are raised as the feed scrolls past, the turn reveals MOTION, three numbered points
   explain how it works, the Token makes the climb as proof, and an end card asks for the click;
   the caption graph plots the tension curve) ·
   formatbeforeafter (the comparison format: one locked-off frame of the Token's desk, messy and
   dull BEFORE, tidy and vivid AFTER, a draggable slider that teases and then snaps the reveal,
   and a side-by-side hold with guides proving the framing is identical). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, midi, text, rrect } = MG;
  const TK = MG.TK, FK = MG.FK, P = TK.P, PI = Math.PI;
  const label = (c, s, x, y, o = {}) => {
    if (o.alpha === undefined) return FK.label(c, s, x, y, o);
    if (o.alpha <= 0.01) return;
    c.save(); c.globalAlpha *= o.alpha; FK.label(c, s, x, y, o); c.restore();
  };
  const sinc = u => Math.sin(PI * clamp(u));   // 0 → 1 → 0 bump

  /* Small accent tag naming a convention as it happens: dot + mono label. */
  function tag(c, s, x, y, on = 1, o = {}) {
    if (on <= 0.01) return;
    c.save(); c.globalAlpha *= on;
    const al = o.align || 'left';
    if (al === 'left') { c.fillStyle = P.accent; c.beginPath(); c.arc(x + 6, y - 6, 6, 0, TAU); c.fill(); }
    label(c, s, al === 'left' ? x + 20 : x, y, { color: o.color || P.ink, weight: 700, size: o.size || 16, ls: 2.5, align: al });
    c.restore();
  }
  /* The macOS-style arrow pointer; press 0..1 shrinks it slightly. */
  function pointer(c, x, y, press = 0, s = 1.25) {
    c.save(); c.translate(x, y); c.scale(s * (1 - 0.1 * press), s * (1 - 0.1 * press));
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 30); c.lineTo(7, 23.5); c.lineTo(12.5, 35); c.lineTo(17.5, 32.5); c.lineTo(12, 21.5); c.lineTo(21.5, 21.5); c.closePath();
    c.shadowColor = 'rgba(0,0,0,0.25)'; c.shadowBlur = 6; c.shadowOffsetY = 2;
    c.fillStyle = P.ink; c.fill(); c.shadowColor = 'transparent';
    c.lineJoin = 'round'; c.lineWidth = 2.2; c.strokeStyle = '#fff'; c.stroke();
    c.restore();
  }
  /* Expanding click ripple at each click time. */
  function ripples(c, t, x, y, clicks) {
    clicks.forEach(tc => {
      const k = seg(t, tc, tc + 0.4);
      if (k <= 0 || k >= 1) return;
      c.save(); c.globalAlpha = 1 - k; c.strokeStyle = P.accent; c.lineWidth = 4;
      c.beginPath(); c.arc(x, y, 8 + 34 * E.outC(k), 0, TAU); c.stroke(); c.restore();
    });
  }
  /* Keyboard-shortcut badge (the screencast keystroke overlay). */
  function keycap(c, s, x, y, on) {
    if (on <= 0.01) return;
    c.save(); c.globalAlpha *= on;
    c.font = `700 18px ${TK.MONO}`; const w = c.measureText(s).width + 30;
    c.fillStyle = P.ink; rrect(c, x, y - 30, w, 40, 8); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x + 6, y + 4, w - 12, 3);
    text(c, s, x + 15, y - 3, { font: TK.MONO, size: 18, weight: 700, color: '#fff', ls: 1 });
    c.restore();
  }
  /* Two-key parallel interpolation of a cursor path: keys [t, x, y, ease?]. */
  const path2 = (t, K) => [kf(t, K.map(k => [k[0], k[1], k[3]])), kf(t, K.map(k => [k[0], k[2], k[3]]))];

  /* =====================================================================
     TUTORIAL — a screen-recorded how-to inside a mock design tool. The
     intro card states the outcome (what you'll make, how many steps); then
     each numbered step is one tool and one action: SHIFT-drag a square,
     drag the corner-radius slider to 22 %, ALT-drag an ellipse from the
     centre to punch the hole. The cursor is always visible, every click
     ripples and clicks, the control in use is spotlit, keystrokes appear
     as badges, and the step card names the step, its one action and its
     time. A recap repeats the three steps as cards; a next-lesson card
     closes. The caption graph is the staircase of steps completed.
     ===================================================================== */
  const TU_B = [
    { t0: 0, t1: 1.2, name: 'Intro', kind: 'title' },
    { t0: 1.2, t1: 3.6, name: 'Step 1', kind: 'act' },
    { t0: 3.6, t1: 5.6, name: 'Step 2', kind: 'act' },
    { t0: 5.6, t1: 7.8, name: 'Step 3', kind: 'act' },
    { t0: 7.8, t1: 9.2, name: 'Recap', kind: 'turn' },
    { t0: 9.2, t1: 10, name: 'Next', kind: 'cta' },
  ];
  const TU_STEPS = [
    { title: 'Draw a square', how: 'RECTANGLE TOOL · SHIFT-DRAG', done: 3.25, short: 'SQUARE' },
    { title: 'Round the corners', how: 'CORNER RADIUS → 22 %', done: 5.15, short: 'RADIUS 22 %' },
    { title: 'Punch the hole', how: 'ELLIPSE TOOL · ALT-DRAG', done: 7.15, short: 'HOLE' },
  ];
  const WX = 240, WY = 104, WW = 1440, WH = 776;           // app window
  const TBX = 290, TOOLY = i => 196 + i * 78;              // toolbar column centre, tool rows
  const AC = [820, 500], AS = 300;                         // art centre and side
  const SL0 = 1330, SLW = 310, SLY = 604;                  // radius slider track
  const HC = [AC[0] + AS * TK.HOLE.x, AC[1] + AS * TK.HOLE.y], HR = AS * TK.HOLE.r;
  const CLICKS = [1.85, 2.35, 4.22, 6.05, 6.45];
  const tuRad = t => 0.22 * E.ioC(seg(t, 4.3, 5.0));
  const tuKnob = t => SL0 + tuRad(t) / 0.5 * SLW;
  const tuSq = t => E.ioC(seg(t, 2.35, 3.1));
  const tuHole = t => E.ioC(seg(t, 6.45, 6.95));
  function tuCursor(t) {
    if (t >= 4.22 && t <= 5.0) return [tuKnob(t), SLY + 4];
    const d = Math.SQRT1_2 * HR;
    if (t >= 6.45 && t <= 6.95) { const u = tuHole(t); return [HC[0] + d * u, HC[1] + d * u]; }
    if (t >= 2.35 && t <= 3.1) { const u = tuSq(t); return [lerp(AC[0] - AS / 2, AC[0] + AS / 2, u), lerp(AC[1] - AS / 2, AC[1] + AS / 2, u)]; }
    return path2(t, [
      [1.2, 1060, 760], [1.75, TBX, TOOLY(1), E.ioC], [1.95, TBX, TOOLY(1)], [2.3, AC[0] - AS / 2, AC[1] - AS / 2, E.ioC],
      [3.1, AC[0] + AS / 2, AC[1] + AS / 2], [3.5, 1080, 740, E.ioC], [3.7, 1080, 740], [4.15, SL0, SLY + 4, E.ioC],
      [5.0, SL0 + 0.44 * SLW, SLY + 4], [5.45, 1120, 760, E.ioC], [5.7, 1120, 760], [6.0, TBX, TOOLY(2), E.ioC],
      [6.1, TBX, TOOLY(2)], [6.4, HC[0], HC[1], E.ioC], [6.95, HC[0] + Math.SQRT1_2 * HR, HC[1] + Math.SQRT1_2 * HR],
      [7.5, 1100, 720, E.ioC],
    ]);
  }
  function tuTool(c, i, x, y, active, hover) {
    c.save();
    if (active > 0.01) { c.globalAlpha = active; c.fillStyle = P.accent; rrect(c, x - 28, y - 28, 56, 56, 12); c.fill(); c.globalAlpha = 1; }
    else if (hover > 0.01) { c.globalAlpha = hover * 0.5; c.fillStyle = P.ground2; rrect(c, x - 28, y - 28, 56, 56, 12); c.fill(); c.globalAlpha = 1; }
    const ink = active > 0.5 ? '#fff' : P.ink;
    c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = 3;
    if (i === 0) { c.beginPath(); c.moveTo(x - 7, y - 12); c.lineTo(x - 7, y + 10); c.lineTo(x - 1, y + 5); c.lineTo(x + 4, y + 13); c.lineTo(x + 8, y + 11); c.lineTo(x + 3, y + 3); c.lineTo(x + 10, y + 3); c.closePath(); c.fill(); }
    else if (i === 1) c.strokeRect(x - 12, y - 12, 24, 24);
    else if (i === 2) { c.beginPath(); c.arc(x, y, 13, 0, TAU); c.stroke(); }
    else text(c, 'T', x, y + 1, { font: TK.FONT, weight: 800, size: 28, color: ink, align: 'center', base: 'middle' });
    c.restore();
  }
  function tuArt(c, t) {
    if (t < 2.35) return;
    const u = tuSq(t), x0 = AC[0] - AS / 2, y0 = AC[1] - AS / 2, w = AS * u + 2, h = AS * u + 2;
    const punched = t >= 6.95, pop = 1 + 0.05 * sinc(seg(t, 6.95, 7.25));
    if (punched) {
      TK.token(c, AC[0], AC[1], AS * pop);
    } else {
      c.fillStyle = P.accent; rrect(c, x0, y0, w, h, Math.min(w, h) * tuRad(t)); c.fill();
      const hu = tuHole(t);
      if (t >= 6.45 && hu > 0.001) {
        c.save(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(HC[0], HC[1], HR * hu, 0, TAU); c.fill();
        c.setLineDash([7, 6]); c.strokeStyle = P.ink; c.lineWidth = 2; c.stroke(); c.setLineDash([]);
        c.fillStyle = P.ink; c.beginPath(); c.arc(HC[0], HC[1], 3.5, 0, TAU); c.fill(); c.restore();
      }
    }
    // selection box + handles
    const sel = seg(t, 2.35, 2.4) * (1 - seg(t, 7.5, 7.7));
    if (sel > 0.01) {
      c.save(); c.globalAlpha = sel; c.strokeStyle = P.blue; c.lineWidth = 2; c.strokeRect(x0 - 0.5, y0 - 0.5, w, h);
      [[x0, y0], [x0 + w, y0], [x0, y0 + h], [x0 + w, y0 + h]].forEach(([x, y]) => { c.fillStyle = '#fff'; c.fillRect(x - 6, y - 6, 12, 12); c.strokeRect(x - 6, y - 6, 12, 12); });
      c.restore();
      const dim = seg(t, 2.4, 2.5) * (1 - seg(t, 3.5, 3.7));
      if (dim > 0.01) {
        c.save(); c.globalAlpha = dim; c.fillStyle = P.blue;
        rrect(c, x0 + w / 2 - 62, y0 + h + 14, 124, 30, 6); c.fill(); c.restore();
        label(c, `${Math.round(AS * u)} × ${Math.round(AS * u)}`, x0 + w / 2, y0 + h + 35, { align: 'center', size: 15, ls: 1, color: '#fff', weight: 700 });
      }
      const rl = seg(t, 4.3, 4.4) * (1 - seg(t, 5.3, 5.5));
      if (rl > 0.01) {
        c.save(); c.globalAlpha = rl; c.fillStyle = P.blue; rrect(c, x0 + w / 2 - 62, y0 + h + 14, 124, 30, 6); c.fill();
        label(c, `R ${Math.round(tuRad(t) * AS)} PX`, x0 + w / 2, y0 + h + 35, { align: 'center', size: 15, ls: 1, color: '#fff', weight: 700 });
        c.restore();
      }
    }
  }
  function tuWindow(c, t) {
    // window chrome
    c.save();
    c.shadowColor = 'rgba(23,24,28,0.18)'; c.shadowBlur = 40; c.shadowOffsetY = 14;
    c.fillStyle = '#f8f6f1'; rrect(c, WX, WY, WW, WH, 18); c.fill(); c.restore();
    c.save(); rrect(c, WX, WY, WW, WH, 18); c.clip();
    c.fillStyle = '#e4e0d6'; c.fillRect(WX, WY, WW, 44);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(WX + 26 + i * 22, WY + 22, 7, 0, TAU); c.fill(); });
    label(c, 'token.design — MOTION Studio', WX + WW / 2, WY + 28, { align: 'center', size: 15, ls: 1, color: P.mute });
    // toolbar
    c.fillStyle = '#efece5'; c.fillRect(WX, WY + 44, 100, WH - 44);
    c.fillStyle = 'rgba(23,24,28,0.1)'; c.fillRect(WX + 100, WY + 44, 1, WH - 44); c.fillRect(1300, WY + 44, 1, WH - 44);
    const act1 = seg(t, 1.85, 1.9) * (1 - seg(t, 3.1, 3.15)), act2 = seg(t, 6.05, 6.1) * (1 - seg(t, 6.95, 7.0));
    for (let i = 0; i < 4; i++) {
      const a = i === 1 ? act1 : i === 2 ? act2 : i === 0 ? 1 - Math.max(act1, act2) : 0;
      tuTool(c, i, TBX, TOOLY(i), a, 0);
    }
    // canvas: dot grid
    c.fillStyle = 'rgba(23,24,28,0.12)';
    for (let x = 380; x < 1290; x += 40) for (let y = 180; y < 870; y += 40) c.fillRect(x, y, 2, 2);
    tuArt(c, t);
    // right panel: step card
    const si = t < 3.6 ? 0 : t < 5.6 ? 1 : 2, S = TU_STEPS[si], b = TU_B[si + 1];
    const swap = Math.min(seg(t, b.t0, b.t0 + 0.25), 1 - seg(t, b.t1 - 0.15, b.t1));
    const px = 1324, pw = 332;
    c.fillStyle = '#fff'; rrect(c, px, 168, pw, 268, 14); c.fill();
    c.strokeStyle = 'rgba(23,24,28,0.1)'; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = P.accent; c.fillRect(px, 168, 6, 268);
    c.save(); c.globalAlpha = si === 0 && t < 1.2 ? 1 : clamp(swap * 1.5);
    label(c, `STEP ${si + 1} / 3`, px + 28, 210, { size: 18, color: P.accent, weight: 700 });
    text(c, S.title, px + 26, 260, { font: TK.FONT, weight: 800, size: 34, color: P.ink });
    label(c, S.how, px + 28, 296, { size: 14, ls: 1.5, color: P.ink });
    label(c, `STEP TIME  ${(b.t1 - b.t0).toFixed(1)} s`, px + 28, 412, { size: 13, ls: 2, color: P.mute });
    c.restore();
    label(c, 'ONE ACTION PER STEP', px + 28, 340, { size: 13, ls: 2, color: P.mute });
    for (let i = 0; i < 3; i++) {
      const done = t >= TU_STEPS[i].done, x = px + 36 + i * 34, y = 372;
      c.beginPath(); c.arc(x, y, 11, 0, TAU);
      if (done) { c.fillStyle = P.accent; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 5, y); c.lineTo(x - 1, y + 4); c.lineTo(x + 6, y - 4); c.stroke(); }
      else { c.strokeStyle = i === si ? P.ink : 'rgba(23,24,28,0.25)'; c.lineWidth = 2; c.stroke(); }
    }
    // done badge pop
    const db = sinc(seg(t, S.done, S.done + 0.55));
    if (t >= S.done && db > 0.01) {
      c.save(); c.globalAlpha = clamp(db * 2); c.fillStyle = P.ink; rrect(c, px + pw - 108, 186, 86, 30, 15); c.fill();
      label(c, 'DONE', px + pw - 65, 207, { size: 14, color: '#fff', weight: 700, align: 'center' }); c.restore();
    }
    // properties
    label(c, 'PROPERTIES', px + 4, 476, { size: 13, ls: 2 });
    const has = t >= 2.35, wv = has ? Math.round(AS * tuSq(t)) : 0;
    [['W', wv], ['H', wv]].forEach(([n, v], i) => {
      const x = px + i * 168; c.fillStyle = '#efece5'; rrect(c, x, 494, 160, 40, 8); c.fill();
      label(c, n, x + 14, 520, { size: 15, color: P.mute }); label(c, has ? String(v) : '—', x + 44, 520, { size: 15, color: P.ink, weight: 700 });
    });
    label(c, 'CORNER RADIUS', px + 4, 576, { size: 13, ls: 2 });
    label(c, `${Math.round(tuRad(t) * 100)} %`, px + pw, 576, { size: 15, color: P.ink, weight: 700, align: 'right' });
    c.fillStyle = 'rgba(23,24,28,0.15)'; c.fillRect(SL0, SLY - 2, SLW, 4);
    c.fillStyle = P.accent; c.fillRect(SL0, SLY - 2, tuKnob(t) - SL0, 4);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(tuKnob(t), SLY, 12, 0, TAU); c.fill(); c.strokeStyle = P.ink; c.lineWidth = 2.5; c.stroke();
    label(c, 'FILL', px + 4, 676, { size: 13, ls: 2 });
    c.fillStyle = has ? P.accent : 'rgba(23,24,28,0.12)'; rrect(c, px + 80, 654, 30, 30, 6); c.fill();
    label(c, has ? '#FF5A1F' : '—', px + 124, 676, { size: 15, color: P.ink });
    label(c, 'LAYERS', px + 4, 740, { size: 13, ls: 2 });
    label(c, has ? (t >= 6.95 ? 'Token  (square − ellipse)' : 'Rectangle 1') : '—', px + 4, 774, { size: 15, color: P.ink, ls: 0.5 });
    // spotlight on the control in use
    const HL = [[1.55, 2.05, TBX - 34, TOOLY(1) - 34, 68, 68, 'CLICK · HIGHLIGHT'], [3.85, 5.15, SL0 - 18, SLY - 50, SLW + 36, 76, 'HIGHLIGHT'], [5.75, 6.25, TBX - 34, TOOLY(2) - 34, 68, 68, 'CLICK · HIGHLIGHT']];
    HL.forEach(([a, z, x, y, w, h, s]) => {
      const on = seg(t, a, a + 0.15) * (1 - seg(t, z - 0.15, z));
      if (on <= 0.01) return;
      c.save(); c.globalAlpha = on * 0.13; c.fillStyle = P.ink;
      c.beginPath(); c.rect(WX, WY, WW, WH); c.moveTo(x + w, y); c.lineTo(x, y); c.lineTo(x, y + h); c.lineTo(x + w, y + h); c.closePath(); c.fill('evenodd');
      c.globalAlpha = on; c.strokeStyle = P.accent; c.lineWidth = 3.5; rrect(c, x, y, w, h, 12); c.stroke();
      c.restore();
      if (x < 400) tag(c, s, x + w + 16, y + h / 2 + 6, on, { size: 14 });
      else tag(c, s, x + 2, y - 12, on, { size: 14 });
    });
    c.restore();
    // keystroke badges
    keycap(c, 'SHIFT', 1080, 840, seg(t, 2.3, 2.4) * (1 - seg(t, 3.1, 3.25)));
    keycap(c, 'ALT', 1080, 840, seg(t, 6.4, 6.5) * (1 - seg(t, 6.95, 7.1)));
    tag(c, 'KEYSTROKE', 1080, 784, seg(t, 2.4, 2.5) * (1 - seg(t, 3.1, 3.25)), { size: 13 });
    // cursor
    const [cx, cy] = tuCursor(t);
    const press = (t >= 2.35 && t <= 3.1) || (t >= 4.22 && t <= 5.0) || (t >= 6.45 && t <= 6.95) ? 1 : CLICKS.some(k => t >= k && t < k + 0.1) ? 1 : 0;
    ripples(c, t, cx, cy, CLICKS);
    if (t > 1.15 && t < 7.7) pointer(c, cx, cy, press);
  }
  function tuMini(c, i, x, y, s) {
    if (i === 2) { TK.token(c, x, y, s); return; }
    c.fillStyle = P.accent; rrect(c, x - s / 2, y - s / 2, s, s, i === 1 ? s * TK.CORNER : 0); c.fill();
  }

  MG.film({
    id: 'formattutorial', dur: 10, poster: 4.6,
    fonts: FK.fonts,
    meta: {
      family: 'M', name: 'Tutorial', sub: 'Step-by-step how-to', era: '1960s TV — · screencast 2004 —',
      origin: 'The how-to demonstration became a television genre with Julia Child’s The French Chef (WGBH, 1963) and Bob Ross’s The Joy of Painting (PBS, 1983): one task, broken into steps, shown at the speed you can follow. The software tutorial is its screen-recorded descendant — Jon Udell popularised the word “screencast” in 2004, and YouTube (2005) and Khan Academy (2008) made the narrated screen recording, with a visible cursor and highlighted clicks, the everyday way people learn a tool.',
      works: 'The French Chef (Julia Child, WGBH, 1963–1973) · The Joy of Painting (Bob Ross, PBS, 1983–1994) · Khan Academy video lessons (Sal Khan, 2008 —)',
      tech: ['One action per numbered step', 'Visible cursor, click ripples and highlights', 'Promise up front, recap at the end'],
      accent: '#ff5a1f',
      motionDNA: 'Intro card (1.2 s) promises the result and the step count; three numbered steps of about two seconds each, every one a tool pick plus one drag — cursor eases to the control, a click ripple and tick, the spotlight, the drag, a DONE badge; a 1.4 s recap lays the three steps out as cards; a 0.8 s next-lesson card ends on the finished Token hopping.',
      visualDNA: 'The Technique Atlas paper stage behind a light mock design app: traffic-light title bar, tool column, dot-grid canvas, a right panel with a step card (STEP n / 3, the instruction, its one action, step time) above real controls. Orange for the subject and highlights, blue selection handles, ink keystroke badges.',
      transitions: 'Window scales in over the intro card; step card swaps per step; spotlight dims the window around the control in use; recap cards rise over the dimmed app; cut to the next-lesson card',
      implementation: ['Screen recording (Camtasia / ScreenFlow / OBS) with cursor and click highlighting', 'After Effects callouts, zooms and keystroke overlays', 'Canvas 2D: mock UI, keyframed cursor path, evenodd spotlight mask'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      // intro card
      const ia = 1 - seg(t, 0.95, 1.2);
      if (ia > 0.01) {
        c.save(); c.globalAlpha = ia;
        const u = E.outC(seg(t, 0.05, 0.45));
        label(c, 'MOTION  ·  TUTORIAL 01', 200, 360 - 20 * (1 - u), { size: 20, color: P.accent, weight: 700 });
        text(c, 'How to build', 196, 470 - 30 * (1 - u), { font: TK.FONT, weight: 800, size: 96, color: P.ink });
        text(c, 'the Token', 196, 576 - 30 * (1 - u), { font: TK.FONT, weight: 800, size: 96, color: P.ink });
        label(c, '3 STEPS  ·  NO PLUG-INS', 200, 650, { size: 18, color: P.mute, alpha: u });
        const v = E.outB(seg(t, 0.25, 0.7));
        TK.token(c, 1400, 470, 260 * v, { rot: (1 - v) * 0.6 });
        label(c, 'WHAT YOU’LL MAKE', 1400, 660, { size: 16, align: 'center', color: P.ink, weight: 700 });
        tag(c, 'PROMISE THE RESULT', 200, 760, seg(t, 0.4, 0.6), { size: 15 });
        c.restore();
      }
      // the app window
      const wa = E.outC(seg(t, 0.95, 1.3)), recap = seg(t, 7.8, 8.1), outro = seg(t, 9.2, 9.35);
      if (wa > 0.01 && outro < 1) {
        c.save(); c.globalAlpha = wa * (1 - outro);
        const k = lerp(0.95, 1, wa) * lerp(1, 0.97, E.ioC(recap));
        c.translate(960, 492); c.scale(k, k); c.translate(-960, -492);
        tuWindow(c, t);
        c.restore();
      }
      // recap
      if (recap > 0.001 && outro < 1) {
        c.save(); c.globalAlpha = (1 - outro);
        c.fillStyle = `rgba(236,232,223,${0.86 * E.ioC(recap)})`; c.fillRect(0, 0, W, H);
        label(c, 'RECAP  ·  3 STEPS', 960, 250, { align: 'center', size: 20, color: P.ink, weight: 700, alpha: recap });
        for (let i = 0; i < 3; i++) {
          const u = E.outB(seg(t, 7.9 + i * 0.16, 8.3 + i * 0.16));
          if (u <= 0) continue;
          const x = 560 + i * 400, y = 300 + 50 * (1 - u);
          c.save(); c.globalAlpha *= clamp(u);
          c.shadowColor = 'rgba(23,24,28,0.12)'; c.shadowBlur = 24; c.shadowOffsetY = 8;
          c.fillStyle = '#fff'; rrect(c, x - 170, y, 340, 360, 18); c.fill(); c.shadowColor = 'transparent';
          tuMini(c, i, x, y + 120, 130);
          label(c, `STEP ${i + 1}`, x - 140, y + 262, { size: 16, color: P.accent, weight: 700 });
          text(c, TU_STEPS[i].title, x - 141, y + 304, { font: TK.FONT, weight: 800, size: 30, color: P.ink });
          label(c, TU_STEPS[i].how, x - 140, y + 334, { size: 12, ls: 1, color: P.mute });
          if (i < 2) label(c, '→', x + 200, y + 130, { align: 'center', size: 30, color: P.ink });
          c.restore();
        }
      }
      // next lesson
      if (outro > 0.001) {
        c.save(); c.globalAlpha = E.outC(outro);
        const hop = Math.abs(Math.sin(PI * clamp((t - 9.35) / 0.55)));
        TK.shadow(c, 960, 560, 170, hop * 90);
        TK.token(c, 960, 475 - hop * 90, 170, { rot: hop * 0.25, sy: 1 + 0.08 * hop, sx: 1 - 0.06 * hop });
        TK.word(c, 960, 680, { size: 120, ls: 6 });
        label(c, 'NEXT LESSON  →  MAKE IT MOVE', 960, 780, { align: 'center', size: 20, color: P.ink, weight: 700 });
        tag(c, 'NEXT-UP CARD', 1440, 300, seg(t, 9.4, 9.55), { size: 14 });
        c.restore();
      }
      FK.strip(c, t, W, H, TU_B, { label: 'Tutorial' });
      const stairs = u => { const s = u * 10; return TU_STEPS.reduce((a, S) => a + E.outC(seg(s, S.done, S.done + 0.2)) / 3, 0); };
      FK.caption(c, t, W, H, { name: 'Tutorial', cat: 'Explainer', curve: stairs, span: [0, 10], lo: -0.12, hi: 1.15, curveLabel: 'STEPS DONE / TIME' });
    },
    score(A) {
      const B = TK.BEAT;
      // light, unobtrusive tutorial bed: soft plucked pattern + quiet kick from the first step
      const prog = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
      for (let b = 0; b * B < 9.2; b++) {
        const t = b * B, ch = prog[Math.floor(b / 4) % 4];
        A.pluck(t, midi(ch[b % 3] + 12), { g: 0.07, bright: 0.45, dur: 0.9, rev: 0.3, pan: (b % 2 ? 0.25 : -0.25) });
        if (t >= 1.2 && t < 7.8) { A.kick(t, 0.12, { f: 110, f2: 45 }); A.hat(t + B / 2, 0.02); }
      }
      for (let i = 0; i < 5; i++) A.chord(i * 2, prog[i % 4].map(n => n - 12), { type: 'triangle', dur: 2.1, g: 0.025, a: 0.3, lp: 800, rev: 0.4, width: 0.6 });
      // intro: soft whoosh + title note
      A.whoosh(0, 0.5, { f1: 400, f2: 2600, g: 0.08 });
      A.bell(0.3, midi(84), { g: 0.05, dur: 1.2 });
      A.whoosh(0.95, 0.4, { f1: 300, f2: 2000, g: 0.07 });
      // mouse clicks: press + release
      const click = (t, g = 1) => { A.noise(t, { type: 'highpass', f: 3500, dur: 0.012, g: 0.22 * g }); A.osc(t, { f: 2100, dur: 0.025, g: 0.05 * g, type: 'square', lp: 4000 }); };
      [1.85, 4.22, 6.05].forEach(t => { click(t); click(t + 0.09, 0.55); });
      [2.35, 6.45].forEach(t => click(t));
      [3.1, 5.0, 6.95].forEach(t => click(t, 0.55));
      // drag ticks (snapping) and slider detents with rising pitch
      for (let k = 0; k < 10; k++) A.osc(2.4 + k * 0.07, { f: 3200, dur: 0.012, g: 0.025 });
      for (let k = 0; k <= 11; k++) A.osc(4.3 + k * 0.06, { f: midi(76 + k), dur: 0.03, g: 0.035, type: 'triangle' });
      A.noise(6.45, { type: 'bandpass', f: 1800, f2: 3200, dur: 0.5, g: 0.03, swell: 0.6 });
      A.osc(6.95, { f: 180, f2: 90, dur: 0.15, g: 0.12, type: 'triangle' });    // the punch
      // step complete dings
      TU_STEPS.forEach((S, i) => { A.bell(S.done, midi([79, 83, 86][i]), { g: 0.08, dur: 1.0, rev: 0.4 }); A.pluck(S.done + 0.06, midi([84, 88, 91][i]), { g: 0.08, dur: 0.8 }); });
      // recap: three soft card pops
      for (let i = 0; i < 3; i++) A.pluck(7.95 + i * 0.16, midi([72, 76, 79][i]), { g: 0.12, bright: 0.6, dur: 1.0, rev: 0.35 });
      A.whoosh(7.75, 0.4, { f1: 500, f2: 2400, g: 0.06 });
      // next card: little hop boing + resolve
      A.osc(9.35, { type: 'sine', f: 320, f2: 700, glide: 0.25, dur: 0.3, g: 0.08 });
      A.chord(9.25, [60, 64, 67, 72], { type: 'triangle', dur: 0.9, g: 0.04, a: 0.02, lp: 2600, rev: 0.5, width: 0.8 });
      A.bell(9.3, midi(84), { g: 0.06, dur: 0.8 });
    },
  });

  /* =====================================================================
     PROBLEM → SOLUTION — the explainer arc in ten seconds. Problem: the
     grey Token tries twice to hop onto a ledge and bonks off it ("Your logo
     just sits there"). Agitation: it slumps while a feed of look-alike
     posts scrolls past faster and faster, the frame shakes and the counter
     climbs. The turn: silence, then a circle wipe to full colour and
     MOTION. How it works: three numbered points, each with a looping demo
     (anticipate, arc, settle). Result: the Token uses all three to make
     the climb. CTA: the lockup, the line and the button. The caption graph
     plots the tension the arc is built on.
     ===================================================================== */
  const PS_B = [
    { t0: 0, t1: 2, name: 'Problem', kind: 'hook' },
    { t0: 2, t1: 3.6, name: 'Agitate', kind: 'act' },
    { t0: 3.6, t1: 5, name: 'Solution', kind: 'turn' },
    { t0: 5, t1: 7.6, name: 'How it works', kind: 'act' },
    { t0: 7.6, t1: 8.8, name: 'Result', kind: 'act' },
    { t0: 8.8, t1: 10, name: 'CTA', kind: 'cta' },
  ];
  const PS_TENSION = [[0, 0.22], [2, 0.5, E.ioS], [3.55, 1.0, E.inQ], [3.75, 0.12, E.outC], [5, 0.18], [7.6, 0.28], [8.25, 0.46], [8.6, 0.1, E.outC], [10, 0.04]];
  const PF = 780, PLX = 1180, PLY = 600, PS = 170;        // floor, ledge left face and top, token size
  const GREY = '#a29d93';
  function psLedge(c, grey) {
    c.fillStyle = grey ? '#bdb9b0' : P.ground2; c.fillRect(PLX, PLY, 1920 - PLX, PF - PLY);
    c.fillStyle = grey ? '#8f8b84' : P.ink; c.fillRect(PLX, PLY, 1920 - PLX, 4); c.fillRect(PLX, PLY, 4, PF - PLY);
  }
  function psStage(c, W, H, grey) {
    TK.stage(c, W, H, { floor: PF });
    if (grey) { c.fillStyle = 'rgba(110,114,122,0.22)'; c.fillRect(0, 0, W, H); }
  }
  // problem-section Token pose
  function psPose(t) {
    const x = kf(t, [[0, 760], [0.5, 760], [0.85, PLX - PS / 2 - 4, E.lin], [1.1, 990, E.outQ], [1.4, 900, E.outC], [1.6, 900], [1.9, PLX - PS / 2 - 4, E.lin], [2.15, 1010, E.outQ], [2.6, 960, E.outC]]);
    const lift = kf(t, [[0, 0], [0.5, 0], [0.75, 150, E.outQ], [0.85, 140, E.lin], [1.1, 0, E.inQ], [1.6, 0], [1.8, 120, E.outQ], [1.9, 110, E.lin], [2.15, 0, E.inQ]]);
    const rot = kf(t, [[0, 0], [0.5, 0], [0.85, 0.18], [1.1, -0.12], [1.45, 0], [1.6, 0], [1.9, 0.24], [2.15, -0.14], [2.6, -0.24]]);
    const sy = kf(t, [[0, 1], [0.35, 1], [0.5, 0.82], [0.56, 1.08, E.outQ], [0.85, 1], [1.1, 1], [1.16, 0.8, E.outQ], [1.32, 1], [1.45, 1], [1.6, 0.86], [1.66, 1.05], [2.15, 1], [2.22, 0.78, E.outQ], [2.5, 0.9], [3.6, 0.86, E.lin]]);
    return { x, lift, rot, sy };
  }
  function psToken(c, x, lift, s, o) {
    const sy = o.sy || 1, sx = 1 + (1 - sy) * 0.7;
    TK.shadow(c, x, PF - (o.base || 0), s, lift);
    TK.token(c, x, PF - (o.base || 0) - lift - s / 2 * sy, s, { rot: o.rot || 0, sx, sy, color: o.color });
  }
  function psBonk(c, t, tb) {
    const k = seg(t, tb, tb + 0.35);
    if (k <= 0 || k >= 1) return;
    c.save(); c.globalAlpha = 1 - k; c.strokeStyle = P.ink; c.lineWidth = 4; c.lineCap = 'round';
    const y = PLY + 20;
    for (let i = 0; i < 5; i++) { const a = PI - 0.9 + i * 0.45, r0 = 24 + 30 * k, r1 = 46 + 34 * k; c.beginPath(); c.moveTo(PLX + Math.cos(a) * r0, y + Math.sin(a) * r0); c.lineTo(PLX + Math.cos(a) * r1, y + Math.sin(a) * r1); c.stroke(); }
    c.restore();
  }
  function psFeed(c, t, W, H) {
    // agitation: look-alike posts scroll past, faster and faster
    const on = seg(t, 2.0, 2.3);
    if (on <= 0) return;
    const tt = Math.max(0, t - 2), off = 160 * tt + 260 * tt * tt;
    c.save(); c.globalAlpha = on;
    c.beginPath(); c.rect(1240, 90, 520, PLY - 110); c.clip();
    for (let i = -1; i < 14; i++) {
      const yy = ((560 - i * 170 - off) % 2380 + 2380) % 2380 - 1500;
      c.fillStyle = 'rgba(255,255,255,0.75)'; rrect(c, 1270, yy, 460, 150, 14); c.fill();
      c.fillStyle = 'rgba(23,24,28,0.12)'; rrect(c, 1290, yy + 20, 110, 110, 10); c.fill();
      TK.token(c, 1345, yy + 75, 60, { color: '#b9b4aa', rot: hash(i) * 0.4 - 0.2 });
      c.fillStyle = 'rgba(23,24,28,0.16)'; c.fillRect(1420, yy + 36, 220 + hash(i + 3) * 80, 14); c.fillRect(1420, yy + 66, 160 + hash(i + 7) * 60, 14);
      label(c, 'SKIPPED', 1420, yy + 118, { size: 13, ls: 2, color: '#a85a3e' });
    }
    c.restore();
    const n = Math.floor(12 * Math.pow(1 + tt * 3.2, 3.1));
    label(c, `SCROLLED PAST  ${n.toLocaleString('en-US')}`, 1740, PLY - 2 - 14, { align: 'right', size: 16, color: P.ink, weight: 700, alpha: on });
  }
  function psHow(c, t, ox) {
    c.save(); c.translate(ox, 0);
    TK.stage(c, 1920, 1080);
    label(c, 'HOW IT WORKS', 960, 168, { align: 'center', size: 20, color: P.ink, weight: 700 });
    const PTS = [['Anticipate', 'SQUASH BEFORE THE MOVE'], ['Arc', 'TRAVEL ON CURVES'], ['Settle', 'OVERSHOOT, THEN REST']];
    PTS.forEach(([n, d], i) => {
      const t0 = 5.15 + i * 0.7, u = E.outB(seg(t, t0, t0 + 0.4));
      if (u <= 0.001) return;
      const x = 480 + i * 480;
      c.save(); c.globalAlpha *= clamp(u);
      c.fillStyle = P.ink; c.beginPath(); c.arc(x, 270, 30 * u, 0, TAU); c.fill();
      text(c, String(i + 1), x, 272, { font: TK.FONT, weight: 900, size: 34, color: '#fff', align: 'center', base: 'middle' });
      // demo zone
      const fl = 620, s = 110, p = ((t - t0) % 1.4 + 1.4) % 1.4 / 1.4;
      c.fillStyle = 'rgba(23,24,28,0.2)'; c.fillRect(x - 170, fl, 340, 2);
      if (i === 0) {
        const sy = 1 - 0.32 * sinc(seg(p, 0.1, 0.7)), sx = 1 + 0.25 * sinc(seg(p, 0.1, 0.7));
        TK.shadow(c, x, fl, s, 0); TK.token(c, x, fl - s / 2 * sy, s, { sx, sy });
      } else if (i === 1) {
        const q = E.ioS(seg(p, 0.05, 0.85)), px = lerp(x - 120, x + 120, q), lift = 150 * Math.sin(PI * q);
        c.strokeStyle = 'rgba(198,62,12,0.5)'; c.setLineDash([6, 7]); c.lineWidth = 2.5; c.beginPath();
        for (let k = 0; k <= 40; k++) { const v = k / 40; const yy = fl - s / 2 - 150 * Math.sin(PI * v); k ? c.lineTo(lerp(x - 120, x + 120, v), yy) : c.moveTo(x - 120, yy); }
        c.stroke(); c.setLineDash([]);
        TK.shadow(c, px, fl, s * 0.7, lift); TK.token(c, px, fl - s * 0.35 - lift, s * 0.7, { rot: q * PI / 2 });
      } else {
        const v = MG.spring(p * 1.4, 2.2, 0.28), px = lerp(x - 130, x + 40, v);
        c.strokeStyle = 'rgba(23,24,28,0.3)'; c.setLineDash([4, 6]); c.lineWidth = 2; c.beginPath(); c.moveTo(x + 40, fl - 150); c.lineTo(x + 40, fl + 10); c.stroke(); c.setLineDash([]);
        TK.shadow(c, px, fl, s, 0); TK.token(c, px, fl - s / 2, s, { rot: (v - 1) * 0.6 });
      }
      text(c, n, x, 712, { font: TK.FONT, weight: 800, size: 46, color: P.ink, align: 'center' });
      label(c, d, x, 752, { align: 'center', size: 15, ls: 2, color: P.mute });
      c.restore();
    });
    tag(c, 'THREE POINTS, ONE PER BEAT', 960, 820, seg(t, 5.3, 5.5), { align: 'center', color: P.mute, size: 14 });
    c.restore();
  }

  MG.film({
    id: 'formatproblem', dur: 10, poster: 4.3,
    fonts: FK.fonts,
    meta: {
      family: 'M', name: 'Problem → Solution', sub: 'The explainer’s narrative arc', era: '1950s — · web explainers 2007 —',
      origin: 'Showing the problem before the product is one of television advertising’s oldest moves: Rosser Reeves’ 1950s Anacin commercials for Ted Bates dramatised the headache with hammers before the relief. Copywriters later formalised the arc as problem – agitate – solve, and the web explainer of the late 2000s compressed it into a minute: Common Craft’s “In Plain English” videos (from 2007) and the start-up homepage videos that followed open on a relatable pain, raise the stakes, introduce the product as the turn, explain it in three points and end on a call to action.',
      works: 'Anacin TV commercials (Rosser Reeves / Ted Bates & Co., 1950s) · Dollar Shave Club launch video (2012; problem, product, punchline) · Dropbox homepage explainer video (c. 2009)',
      tech: ['Pain point before product', 'Turn at the tension peak', 'Three points, then proof and CTA'],
      accent: '#ff5a1f',
      motionDNA: 'Tension rises for 3.5 s and is released in one cut: two failed hops (0–2 s), a slump while the feed accelerates and the frame shakes (2–3.6 s), a beat of silence, then the circle wipe and MOTION slam (3.6 s); three points arrive one every 0.7 s (5–7.6 s); the proof hop uses all three (7.6–8.8 s); the CTA holds 1.2 s.',
      visualDNA: 'The problem half is graded grey — Token, stage and type desaturated under a cool wash with a growing vignette; the solution half is the full Technique Atlas palette: warm paper, orange Token, ink type. Big left-aligned headline supers, a ledge as the obstacle, numbered ink badges, a pill CTA button.',
      transitions: 'Hard cut to silence at the tension peak, circle wipe from the Token into colour, horizontal push to the three points and back, wipe up to the end card',
      implementation: ['Script on the PAS arc (problem, agitate, solve) with a storyboard per beat', 'After Effects character rig, shape layers and type supers', 'Canvas 2D: grey / colour scenes composited through a circular clip'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const wipe = E.ioC(seg(t, 3.62, 4.12)), push = kf(t, [[5, 1920], [5.3, 0, E.outC], [7.6, 0], [7.9, -1920, E.inQ]]);
      const shake = t < 3.6 ? 9 * Math.pow(seg(t, 2.0, 3.55), 2) : 0;
      const sx = shake * (MG.vnoise(t * 22, 3) - 0.5) * 2, sy = shake * (MG.vnoise(t * 22, 9) - 0.5) * 2;
      // ---- grey problem world ----
      if (t < 4.12) {
        c.save(); c.translate(sx, sy);
        psStage(c, W, H, true); psLedge(c, true);
        psFeed(c, t, W, H);
        const p = psPose(Math.min(t, 3.6));
        psToken(c, p.x, p.lift, PS, { rot: p.rot, sy: p.sy, color: GREY });
        psBonk(c, t, 0.85); psBonk(c, t, 1.9);
        const h1 = seg(t, 0.15, 0.45) * (1 - seg(t, 1.85, 2.05)), h2 = seg(t, 2.05, 2.3);
        if (h1 > 0.01) { c.save(); c.globalAlpha = h1; text(c, 'Your logo just', 120, 230, { font: TK.FONT, weight: 800, size: 72, color: P.ink }); text(c, 'sits there.', 120, 310, { font: TK.FONT, weight: 800, size: 72, color: P.ink }); c.restore(); }
        if (h2 > 0.01) { c.save(); c.globalAlpha = h2; text(c, 'And everyone', 120, 230, { font: TK.FONT, weight: 800, size: 72, color: P.ink }); text(c, 'scrolls past it.', 120, 310, { font: TK.FONT, weight: 800, size: 72, color: P.ink }); c.restore(); }
        tag(c, 'PAIN POINT', 124, 372, h1, { size: 15 });
        tag(c, 'AGITATE · RAISE THE STAKES', 124, 372, h2, { size: 15 });
        // vignette grows with tension
        const vg = 0.15 + 0.45 * seg(t, 2, 3.55);
        const g = c.createRadialGradient(960, 540, 300, 960, 540, 1150); g.addColorStop(0, 'rgba(23,24,28,0)'); g.addColorStop(1, `rgba(23,24,28,${vg})`);
        c.fillStyle = g; c.fillRect(-20, -20, W + 40, H + 40);
        c.restore();
      }
      // ---- colour solution world (circle wipe from the Token) ----
      if (t >= 3.62 && push > 0) {
        c.save();
        if (wipe < 1) { c.beginPath(); c.arc(960, PF - 75, 10 + wipe * 2300, 0, TAU); c.clip(); }
        c.translate(push - 1920, 0);
        psStage(c, W, H, false); psLedge(c, false);
        const sp = MG.spring(t - 3.62, 2.4, 0.3), ws = E.outB(seg(t, 3.85, 4.15));
        TK.shadow(c, 960, PF, PS, 0);
        TK.token(c, 960, PF - PS / 2 * lerp(0.86, 1, sp), PS, { rot: lerp(-0.24, 0, sp), sy: lerp(0.86, 1, sp), sx: lerp(1.1, 1, sp) });
        if (ws > 0.01) {
          c.save(); c.translate(960, 330); c.scale(ws, ws); TK.word(c, 0, 0, { size: 190, ls: 8 }); c.restore();
          label(c, 'MAKES ANYTHING MOVE', 960, 452, { align: 'center', size: 20, color: P.ink, weight: 700, alpha: seg(t, 4.1, 4.3) });
          c.globalAlpha = 1;
        }
        tag(c, 'THE TURN · MEET THE PRODUCT', 124, 160, seg(t, 3.75, 3.95) * (1 - seg(t, 4.85, 5)), { size: 15 });
        c.restore();
      }
      // ---- how it works ----
      if (t > 5 && t < 7.9) {
        psHow(c, t, push);
      }
      // ---- result: the Token makes the climb ----
      if (t > 7.6 && t < 9.1) {
        c.save(); c.translate(t < 7.9 ? push + 1920 : 0, 0);
        psStage(c, W, H, false); psLedge(c, false);
        const u = seg(t, 8.12, 8.52), q = E.ioS(u), land = seg(t, 8.52, 8.8);
        const x = lerp(860, 1430, q), base = q >= 1 ? PF - PLY : 0;
        const lift = u > 0 && u < 1 ? (PF - PLY) * q + 230 * Math.sin(PI * q) : 0;
        const ant = sinc(seg(t, 7.92, 8.14)), sq = sinc(seg(t, 8.52, 8.66));
        const set = u >= 1 ? 1 + 0.12 * Math.exp(-6 * land) * Math.sin(land * 18) : 1;
        const sy = 1 - 0.28 * ant - 0.22 * sq;
        if (u > 0.02) {
          c.save(); c.strokeStyle = 'rgba(198,62,12,0.45)'; c.setLineDash([7, 8]); c.lineWidth = 2.5; c.beginPath();
          for (let k = 0; k <= 40; k++) { const v = k / 40 * Math.min(1, u * 1.2), qq = E.ioS(v); const yy = PF - PS / 2 - ((PF - PLY) * qq + 230 * Math.sin(PI * qq)); k ? c.lineTo(lerp(860, 1430, qq), yy) : c.moveTo(860, yy); }
          c.stroke(); c.restore();
        }
        if (u > 0 && u < 1) { TK.shadow(c, x, x > PLX ? PLY : PF, PS, lift - (x > PLX ? PF - PLY : 0)); TK.token(c, x, PF - lift - PS / 2, PS, { rot: q * PI / 2 }); }
        else psToken(c, x, 0, PS, { sy: sy * set, base, rot: 0 });
        const burst = seg(t, 8.55, 8.9);
        if (burst > 0 && burst < 1) {
          c.save(); c.globalAlpha = 1 - burst; c.strokeStyle = P.accent; c.lineWidth = 5; c.lineCap = 'round';
          for (let i = 0; i < 7; i++) { const a = -PI + i * PI / 6; c.beginPath(); c.moveTo(1430 + Math.cos(a) * (120 + 40 * burst), PLY - 85 + Math.sin(a) * (120 + 40 * burst)); c.lineTo(1430 + Math.cos(a) * (150 + 70 * burst), PLY - 85 + Math.sin(a) * (150 + 70 * burst)); c.stroke(); }
          c.restore();
        }
        const hu = seg(t, 7.9, 8.15);
        c.save(); c.globalAlpha = hu;
        text(c, 'Now it gets', 120, 230, { font: TK.FONT, weight: 800, size: 72, color: P.ink });
        text(c, 'noticed.', 120, 310, { font: TK.FONT, weight: 800, size: 72, color: P.accent });
        c.restore();
        tag(c, 'RESULT · SHOW THE PROOF', 124, 372, hu, { size: 15 });
        c.restore();
      }
      // ---- CTA end card ----
      const cu = E.ioC(seg(t, 8.8, 9.1));
      if (cu > 0) {
        c.save(); c.beginPath(); c.rect(0, H * (1 - cu), W, H * cu); c.clip();
        TK.stage(c, W, H);
        const lu = E.outB(seg(t, 8.95, 9.3));
        TK.token(c, 545, 440, 150 * lu, { rot: (1 - lu) * -0.8 });
        TK.word(c, 1035, 446, { size: 150, ls: 6, alpha: seg(t, 9.0, 9.2) });
        c.save(); c.globalAlpha = seg(t, 9.15, 9.35); text(c, 'Make anything move.', 960, 590, { font: TK.FONT, weight: 800, size: 44, color: P.ink, align: 'center' }); c.restore();
        const bu = E.outB(seg(t, 9.25, 9.5)), pulse = 1 + 0.03 * Math.sin((t - 9.5) * 9) * seg(t, 9.5, 9.6);
        if (bu > 0.01) {
          c.save(); c.translate(960, 690); c.scale(bu * pulse, bu * pulse);
          c.fillStyle = P.ink; rrect(c, -190, -38, 380, 76, 38); c.fill();
          label(c, 'TRY MOTION FREE  →', 0, 8, { align: 'center', size: 22, color: '#fff', weight: 700, ls: 2 });
          c.restore();
        }
        tag(c, 'CTA · 1.2 s', 124, 160, seg(t, 9.1, 9.3), { size: 15 });
        c.restore();
      }
      // flash at the cut
      const fl = 1 - seg(t, 3.6, 3.75);
      if (t >= 3.6 && fl > 0) { c.fillStyle = `rgba(255,255,255,${0.55 * fl})`; c.fillRect(0, 0, W, H); }
      FK.strip(c, t, W, H, PS_B, { label: 'Problem → Solution' });
      FK.caption(c, t, W, H, { name: 'Problem → Solution', cat: 'Explainer', curve: u => kf(u * 10, PS_TENSION), span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'TENSION / TIME' });
    },
    score(A) {
      const B = TK.BEAT;
      // problem: sparse minor plucks + clock tick
      [[0, 57], [0.5, 60], [1.0, 64], [1.5, 62], [2.0, 57], [2.5, 60], [3.0, 63]].forEach(([t, n]) => A.pluck(t, midi(n), { g: 0.09, bright: 0.3, dur: 1.4, lp: 1600, rev: 0.3 }));
      A.chord(0, [45, 52, 57], { type: 'triangle', dur: 2.1, g: 0.035, a: 0.3, lp: 600, rev: 0.4, width: 0.5 });
      A.chord(2, [44, 50, 56], { type: 'sawtooth', dur: 1.6, g: 0.022, a: 0.6, lp: 700, lp2: 2200, lpT: 1.5, rev: 0.4, width: 0.6 });
      for (let t = 0; t < 3.55;) { A.osc(t, { f: 1500, dur: 0.02, g: 0.04, type: 'square', lp: 3000 }); t += t < 2 ? 0.5 : t < 2.8 ? 0.25 : 0.125; }
      // hop attempts + bonks
      [0.5, 1.6].forEach((t, i) => A.osc(t, { type: 'sine', f: 260, f2: 420, glide: 0.25, dur: 0.3, g: 0.07 * (1 - i * 0.3) }));
      [0.85, 1.9].forEach(t => { A.osc(t, { type: 'triangle', f: 140, f2: 70, dur: 0.18, g: 0.25 }); A.noise(t, { type: 'lowpass', f: 900, dur: 0.08, g: 0.12 }); });
      [1.1, 2.15].forEach(t => A.kick(t, 0.22, { f: 90, f2: 40 }));
      // agitation: dissonant rise, feed whooshes, cut to silence at 3.55
      A.riser(2.0, 1.55, { g: 0.12, f: 98 });
      A.osc(2.2, { type: 'sawtooth', f: midi(46), f2: midi(52), glide: 1.35, dur: 1.35, g: 0.03, lp: 500, lp2: 3000, lpT: 1.3, hold: true, rel: 0.02 });
      for (let k = 0; k < 6; k++) A.whoosh(2.2 + k * 0.22 - k * k * 0.012, 0.22, { f1: 700, f2: 2600, g: 0.03 + k * 0.006, pan: k % 2 ? 0.5 : -0.5 });
      // the turn
      A.impact(3.62, 0.38);
      A.whoosh(3.6, 0.5, { f1: 300, f2: 5000, g: 0.12, swell: 0.3 });
      A.chord(3.65, [60, 64, 67, 72, 76], { type: 'triangle', dur: 1.6, g: 0.05, a: 0.01, lp: 3200, rev: 0.6, width: 0.9 });
      A.bell(3.9, midi(84), { g: 0.08, dur: 1.4 }); A.bell(3.9, midi(91), { g: 0.04, dur: 1.2 });
      // upbeat bed for the solution half
      for (let b = 8; b * B < 8.8; b++) { const t = b * B; A.kick(t, 0.26, { f: 120, f2: 45 }); A.hat(t + B / 2, 0.04); if (b % 2) A.clap(t, 0.08); }
      [[4, [48, 55, 64]], [6, [53, 57, 65]], [8, [55, 59, 67]]].forEach(([t, n]) => A.chord(t, n, { type: 'triangle', dur: 2.1, g: 0.035, a: 0.1, lp: 1400, rev: 0.4, width: 0.6 }));
      for (let i = 0; i < 3; i++) { A.pluck(5.15 + i * 0.7, midi([72, 76, 79][i]), { g: 0.16, bright: 0.7, dur: 1.0, rev: 0.3 }); A.bell(5.15 + i * 0.7, midi([84, 88, 91][i]), { g: 0.04, dur: 0.6 }); }
      A.whoosh(5.0, 0.35, { f1: 500, f2: 3000, g: 0.07 }); A.whoosh(7.6, 0.35, { f1: 500, f2: 3000, g: 0.07, pan: -0.3 });
      // result hop
      A.osc(8.12, { type: 'sine', f: 300, f2: 900, glide: 0.4, dur: 0.42, g: 0.09 });
      A.kick(8.52, 0.32, { f: 140, f2: 50 }); A.bell(8.56, midi(88), { g: 0.06, dur: 0.9 });
      // CTA: sonic logo
      A.whoosh(8.8, 0.35, { f1: 400, f2: 2600, g: 0.07 });
      [[9.0, 67], [9.15, 72], [9.3, 76]].forEach(([t, n]) => A.pluck(t, midi(n + 12), { g: 0.15, bright: 0.75, dur: 1.2, rev: 0.4 }));
      A.chord(9.3, [48, 60, 64, 67, 72], { type: 'triangle', dur: 0.75, g: 0.045, a: 0.02, lp: 3000, rev: 0.6, width: 0.8 });
      A.bell(9.3, midi(84), { g: 0.06, dur: 0.75 });
    },
  });

  /* =====================================================================
     BEFORE / AFTER — one locked-off frame of the Token's desk in two
     states: BEFORE, a dull grey mess (books toppled, notes everywhere, the
     MOTION poster crooked and its letters on the floor, the Token knocked
     over); AFTER, the same frame tidy and vivid. A draggable slider enters,
     drags halfway, teases back, pushes further and then snaps off for the
     reveal; the after state holds; then both shrink to a side-by-side with
     guides that prove the framing is identical, and the brand line ends
     it. The music's low-pass opens as more of AFTER is revealed; the
     caption graph is the share of the frame showing AFTER.
     ===================================================================== */
  const BA_B = [
    { t0: 0, t1: 2, name: 'Before', kind: 'act' },
    { t0: 2, t1: 5, name: 'Slider', kind: 'turn' },
    { t0: 5, t1: 6, name: 'Reveal', kind: 'title' },
    { t0: 6, t1: 8.6, name: 'Side by side', kind: 'act' },
    { t0: 8.6, t1: 10, name: 'End', kind: 'cta' },
  ];
  const BA_X = [[0, 1920], [2.0, 1920], [3.0, 960, E.ioC], [3.4, 960], [3.85, 1340, E.ioC], [4.6, 420, E.ioC], [4.95, 420], [5.2, 0, E.inQ]];
  const baX = t => kf(t, BA_X);
  const baRev = t => 1 - baX(t) / 1920;
  const DESK = 760, TOKC = [960, 650], TOKS = 200;
  const YEL = '#f2b134';
  function baWorld(c, after, t) {
    const W = 1920, H = 1080;
    // wall + desk
    c.fillStyle = after ? P.ground : '#c4c0b6'; c.fillRect(0, 0, W, H);
    if (after) {
      c.strokeStyle = P.line; c.lineWidth = 1; c.beginPath();
      for (let x = 0; x < W; x += 80) { c.moveTo(x, 0); c.lineTo(x, DESK); } for (let y = 0; y < DESK; y += 80) { c.moveTo(0, y); c.lineTo(W, y); } c.stroke();
      const g = c.createRadialGradient(560, 120, 40, 560, 120, 900); g.addColorStop(0, 'rgba(255,214,150,0.35)'); g.addColorStop(1, 'rgba(255,214,150,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, DESK);
    } else {
      // stains, scuffs
      c.fillStyle = 'rgba(80,76,70,0.08)';
      for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(200 + hash(i * 3.1) * 1500, 120 + hash(i * 5.7) * 560, 50 + hash(i) * 70, 30 + hash(i + 2) * 40, hash(i + 9) * 3, 0, TAU); c.fill(); }
    }
    c.fillStyle = after ? P.ground2 : '#a9a59c'; c.fillRect(0, DESK, W, H - DESK);
    c.fillStyle = after ? P.ink : '#77736c'; c.fillRect(0, DESK, W, 4);
    // poster with MOTION
    c.save();
    if (!after) { c.translate(780, 170); c.rotate(-0.11); c.translate(-780, -170); }
    c.fillStyle = after ? '#fbf9f4' : '#d6d2c8'; c.fillRect(420, 170, 720, 240);
    c.strokeStyle = after ? P.ink : '#77736c'; c.lineWidth = 5; c.strokeRect(420, 170, 720, 240);
    if (after) { TK.word(c, 780, 285, { size: 118, ls: 6 }); c.fillStyle = P.accent; c.fillRect(470, 360, 620, 8); }
    else { text(c, 'M  T  O', 500, 265, { font: TK.FONT, weight: 900, size: 64, color: '#8c887f' }); }
    c.restore();
    c.fillStyle = after ? P.ink : '#55524c'; c.beginPath(); c.arc(780, 162, 7, 0, TAU); c.fill();
    if (!after) {
      // fallen letters on the desk
      [['I', 1160, 752, 1.35], ['O', 1660, 742, -0.4], ['N', 300, 748, 0.9]].forEach(([s, x, y, r]) => {
        c.save(); c.translate(x, y); c.rotate(r); text(c, s, 0, 0, { font: TK.FONT, weight: 900, size: 70, color: '#8c887f', align: 'center', base: 'bottom' }); c.restore();
      });
    }
    // sticky notes
    const NC = [YEL, P.accentL, '#8fa6ff', YEL, '#8fa6ff', P.accentL];
    for (let i = 0; i < 6; i++) {
      c.save();
      if (after) { c.translate(1330 + (i % 3) * 96, 200 + Math.floor(i / 3) * 96); c.fillStyle = NC[i]; }
      else { c.translate(260 + hash(i * 7.3) * 1400, 90 + hash(i * 2.9) * 560); c.rotate((hash(i * 4.1) - 0.5) * 1.4); c.fillStyle = ['#b9b39f', '#b7aca2', '#a8acb6'][i % 3]; }
      c.fillRect(-36, -36, 72, 72); c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(-36, -36, 72, 12);
      c.restore();
    }
    if (!after) for (let i = 6; i < 11; i++) { c.save(); c.translate(240 + hash(i * 7.3) * 1450, 120 + hash(i * 2.9) * 560); c.rotate((hash(i * 4.1) - 0.5) * 1.6); c.fillStyle = ['#b9b39f', '#b7aca2', '#a8acb6'][i % 3]; c.fillRect(-32, -32, 64, 64); c.restore(); }
    // books
    const BW = [46, 40, 52, 42, 48], BH = [196, 164, 210, 176, 150], BC = [P.blue, P.accent, P.ink, YEL, P.accentL], BG = ['#8d8f95', '#9a948c', '#6f6f72', '#a49e90', '#8f8a83'];
    const MESS = [[470, DESK - 23, 1.57], [640, DESK - 60, 0.42], [1520, DESK - 26, -1.57], [820, DESK - 22, 1.5], [1250, DESK - 70, 0.25]];
    let bx = 520;
    for (let i = 0; i < 5; i++) {
      c.save();
      if (after) { c.translate(bx + BW[i] / 2, DESK - BH[i] / 2); bx += BW[i] + 6; }
      else { c.translate(MESS[i][0], MESS[i][1]); c.rotate(MESS[i][2]); }
      if (after) { c.fillStyle = 'rgba(23,24,28,0.12)'; c.fillRect(-BW[i] / 2 + 8, -BH[i] / 2 + 6, BW[i], BH[i]); }
      c.fillStyle = after ? BC[i] : BG[i]; c.fillRect(-BW[i] / 2, -BH[i] / 2, BW[i], BH[i]);
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-BW[i] / 2 + 6, -BH[i] / 2 + 18, BW[i] - 12, 6);
      c.restore();
    }
    // balls
    const BL = after ? [[1210, P.accent], [1286, P.blue], [1362, YEL]] : [[1700, '#9b968d'], [380, '#8f9198'], [1080, '#a39e92']];
    BL.forEach(([x, col], i) => {
      const y = DESK - 34 + (after ? 0 : 0);
      if (after) { c.fillStyle = 'rgba(23,24,28,0.14)'; c.beginPath(); c.ellipse(x, DESK + 3, 30, 6, 0, 0, TAU); c.fill(); }
      c.fillStyle = col; c.beginPath(); c.arc(x, y, 34 - (after ? 0 : i * 4), 0, TAU); c.fill();
    });
    // cable / scribble mess
    if (!after) {
      c.strokeStyle = '#6d6a64'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath();
      for (let k = 0; k <= 60; k++) { const x = 200 + k * 26, y = DESK - 8 - 14 * Math.sin(k * 0.7) - 10 * Math.sin(k * 0.23 + 1); k ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
      c.strokeStyle = 'rgba(70,68,64,0.45)'; c.lineWidth = 3; c.beginPath();
      for (let k = 0; k <= 50; k++) { const a = k * 0.55, r = 20 + k * 0.9; const x = 1700 + Math.cos(a) * r, y = 300 + Math.sin(a) * r * 0.6; k ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    }
    // the Token
    if (after) {
      const br = 1 + 0.015 * Math.sin(t * PI * 2);
      TK.shadow(c, TOKC[0], DESK, TOKS, 0);
      TK.token(c, TOKC[0], DESK - TOKS / 2 * br, TOKS, { sy: br, sx: 2 - br });
    } else {
      TK.token(c, TOKC[0] + 30, DESK - TOKS * 0.6, TOKS, { rot: 0.78, color: '#9a958c' });
    }
  }
  function baHandle(c, x, H, on) {
    if (on <= 0.01) return;
    c.save(); c.globalAlpha = on;
    c.shadowColor = 'rgba(0,0,0,0.3)'; c.shadowBlur = 10;
    c.fillStyle = '#fff'; c.fillRect(x - 2.5, 0, 5, H);
    c.beginPath(); c.arc(x, 540, 40, 0, TAU); c.fill(); c.shadowColor = 'transparent';
    c.strokeStyle = P.ink; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = P.ink;
    [-1, 1].forEach(d => { c.beginPath(); c.moveTo(x + d * 8, 528); c.lineTo(x + d * 22, 540); c.lineTo(x + d * 8, 552); c.closePath(); c.fill(); });
    c.restore();
  }
  function baPill(c, s, x, y, on, align = 'left', dark = true) {
    if (on <= 0.01) return;
    c.save(); c.globalAlpha *= on;
    c.font = `700 20px ${TK.MONO}`; const w = c.measureText(s).width + 44, x0 = align === 'left' ? x : x - w;
    c.fillStyle = dark ? P.ink : P.accent; rrect(c, x0, y - 30, w, 44, 22); c.fill();
    text(c, s, x0 + 22, y, { font: TK.MONO, size: 20, weight: 700, color: '#fff', ls: 3 });
    c.restore();
  }

  MG.film({
    id: 'formatbeforeafter', dur: 10, poster: 3.2,
    fonts: FK.fonts,
    meta: {
      family: 'M', name: 'Before / After', sub: 'Comparison with slider reveal', era: '1890s print — · web sliders 2010s —',
      origin: 'Paired “before” and “after” pictures were a fixture of patent-medicine and beauty advertising by the late nineteenth century; makeover television turned the comparison into a ritual reveal, from This Old House (PBS, 1979) to Extreme Makeover: Home Edition and Queer Eye for the Straight Guy (both 2003). The draggable comparison slider is a web-era form — newsrooms used it for satellite imagery of disasters, as The New York Times did after the 2011 Tōhoku earthquake and tsunami, and open-source plugins such as ZURB’s TwentyTwenty made it a stock component.',
      works: 'This Old House (PBS, 1979 —) · Extreme Makeover: Home Edition (ABC, 2003–2012) · Satellite Photos of Japan, Before and After the Quake and Tsunami (The New York Times, 2011)',
      tech: ['Identical framing on both sides', 'Slider reveal with a tease', 'Side-by-side hold'],
      accent: '#ff5a1f',
      motionDNA: 'Two seconds of BEFORE to establish the problem; the slider enters and drags to the middle (2–3 s), teases back, pushes further, then snaps off-frame for the reveal at 5 s; one second of full AFTER; a 2.6 s side-by-side hold with framing guides; a 1.4 s brand end.',
      visualDNA: 'One locked-off frontal frame — wall, desk line, poster, notes, books, three balls and the Token — rendered twice: BEFORE desaturated grey, stained, crooked and scattered; AFTER on the Technique Atlas palette, gridded, aligned, lit warm with soft shadows. White slider bar with a round arrow handle; ink BEFORE and orange AFTER pills; dashed orange alignment guides.',
      transitions: 'Vertical slider wipe (drag, tease, push, snap), scale-down into two panels, guides drawing across both, brand line fading up',
      implementation: ['Two renders or plates locked to the same camera, composited with a moving matte', 'Web: two stacked images, clip-path or width driven by a draggable handle (e.g. TwentyTwenty)', 'Canvas 2D: one scene function drawn in two states through a rectangular clip'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const xs = baX(t);
      const sbs = E.ioC(seg(t, 6.0, 6.6)), endU = E.ioC(seg(t, 8.6, 9.0));
      if (sbs <= 0) {
        baWorld(c, false, t);
        if (xs < 1920) { c.save(); c.beginPath(); c.rect(xs, 0, W - xs, H); c.clip(); baWorld(c, true, t); c.restore(); }
        const hOn = seg(t, 1.8, 2.0) * (1 - seg(t, 5.1, 5.25));
        baHandle(c, Math.min(xs, 1900), H, hOn);
        baPill(c, 'BEFORE', 72, 128, seg(t, 0.2, 0.45) * (xs > 260 ? 1 : seg(xs, 0, 260)));
        baPill(c, 'AFTER', 1848, 128, seg(t, 2.1, 2.4) * (1 - seg(t, 5.1, 5.2)), 'right', false);
        tag(c, 'SLIDER REVEAL', Math.min(xs, 1900) + 56, 470, seg(t, 2.1, 2.4) * (1 - seg(t, 4.7, 4.9)), { size: 15 });
        tag(c, 'THE TEASE', Math.min(xs, 1900) + 56, 620, sinc(seg(t, 3.3, 3.95)), { size: 15 });
        // reveal flash + super
        const rf = 1 - seg(t, 5.18, 5.5);
        if (t > 5.18 && rf > 0) { c.fillStyle = `rgba(255,255,255,${0.5 * rf})`; c.fillRect(0, 0, W, H); }
        const rs = E.outB(seg(t, 5.25, 5.55));
        if (rs > 0.01 && t < 6.05) { c.save(); c.globalAlpha = 1 - seg(t, 5.85, 6.0); c.translate(1848, 128); c.scale(1.35 * rs, 1.35 * rs); baPill(c, 'AFTER', 0, 0, 1, 'right', false); c.restore(); tag(c, 'THE REVEAL', 1848, 200, seg(t, 5.3, 5.5) * (1 - seg(t, 5.85, 6.0)), { size: 15, align: 'right' }); }
      } else {
        TK.stage(c, W, H);
        const k = lerp(1, 0.455, sbs) * lerp(1, 0.86, endU), pw = 1920 * k, ph = 1080 * k;
        const gap = 28, py = lerp(0, lerp(200, 170, endU), sbs);
        const lx0 = 960 - gap / 2 - pw, rx0 = sbs < 1 ? lerp(0, 960 + gap / 2, sbs) : 960 + gap / 2;
        const lxx = lerp(-pw - 40, lx0, sbs);
        [[lxx, false], [rx0, true]].forEach(([x, after]) => {
          c.save();
          c.shadowColor = 'rgba(23,24,28,0.2)'; c.shadowBlur = 30 * sbs; c.shadowOffsetY = 10 * sbs;
          c.fillStyle = '#000'; c.fillRect(x, py, pw, ph); c.shadowColor = 'transparent';
          c.beginPath(); c.rect(x, py, pw, ph); c.clip();
          c.translate(x, py); c.scale(k, k); baWorld(c, after, t);
          c.restore();
        });
        const la = seg(t, 6.4, 6.6);
        baPill(c, 'BEFORE', lxx, py - 22, la);
        baPill(c, 'AFTER', rx0, py - 22, la, 'left', false);
        // identical-framing guides
        const gu = E.ioC(seg(t, 6.7, 7.3)) * (1 - endU);
        if (gu > 0.01) {
          c.save(); c.strokeStyle = P.accent; c.lineWidth = 2.5; c.setLineDash([10, 8]);
          const gy = py + DESK * k, ty = py + TOKC[1] * k, py2 = py + 170 * k;
          c.beginPath(); c.moveTo(40, gy); c.lineTo(40 + (1880 - 40) * gu, gy); c.stroke();
          c.beginPath(); c.moveTo(40, py2); c.lineTo(40 + (1880 - 40) * gu, py2); c.stroke();
          c.setLineDash([]); c.lineWidth = 2;
          [lxx, rx0].forEach(x => {
            const tx = x + TOKC[0] * k; c.globalAlpha = gu;
            c.beginPath(); c.moveTo(tx - 30, ty); c.lineTo(tx + 30, ty); c.moveTo(tx, ty - 30); c.lineTo(tx, ty + 30); c.stroke();
            c.beginPath(); c.arc(tx, ty, 14, 0, TAU); c.stroke();
          });
          c.restore();
          label(c, 'DESK LINE', 1880, gy - 10, { align: 'right', size: 13, ls: 2, color: P.accentD, alpha: gu });
          label(c, 'POSTER TOP', 1880, py2 - 10, { align: 'right', size: 13, ls: 2, color: P.accentD, alpha: gu });
          c.globalAlpha = 1;
          tag(c, 'IDENTICAL FRAMING · SAME CAMERA, SAME HORIZON', 960, py + ph + 70, seg(t, 7.0, 7.3) * (1 - endU), { align: 'center', size: 16 });
          tag(c, 'SIDE-BY-SIDE HOLD · 2.6 s', 960, py + ph + 104, seg(t, 7.3, 7.6) * (1 - endU), { align: 'center', size: 14, color: P.mute });
        }
        // end: brand line
        if (endU > 0.01) {
          c.save(); c.globalAlpha = endU;
          TK.word(c, 960, py + ph + 105, { size: 96, ls: 6 });
          label(c, 'SAME FRAME.  NEW WORLD.', 960, py + ph + 175, { align: 'center', size: 20, color: P.ink, weight: 700 });
          c.restore();
        }
      }
      FK.strip(c, t, W, H, BA_B, { label: 'Before / After' });
      FK.caption(c, t, W, H, { name: 'Before / After', cat: 'Explainer', curve: u => baRev(u * 10), span: [0, 10], lo: -0.12, hi: 1.15, curveLabel: 'AFTER REVEALED / TIME' });
    },
    score(A) {
      const B = TK.BEAT;
      const lp = t => 380 + 5200 * Math.pow(clamp(baRev(t) + (t > 5 ? 1 : 0)), 1.6);
      const PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
      const MEL = [76, 72, 69, 72, 74, 72, 67, 71];
      for (let b = 0; b * B < 8.6; b++) {
        const t = b * B, ch = PROG[Math.floor(b / 4) % 4], f = lp(t), dull = 1 - clamp(baRev(t) + (t > 5 ? 1 : 0));
        A.chord(t, ch, { type: 'sawtooth', dur: B * 0.9, g: 0.022, a: 0.01, lp: f, rev: 0.3, width: 0.6, spread: 8 * dull });
        A.pluck(t + B / 2, midi(MEL[b % 8]), { g: 0.08, bright: 0.3 + 0.5 * (1 - dull), dur: 0.8, lp: f * 1.2, rev: 0.3 });
        A.kick(t, 0.14 + 0.1 * (1 - dull), { f: 110, f2: 45 });
        if (t >= 5) A.hat(t + B / 2, 0.04);
      }
      // vinyl crackle under BEFORE
      for (let i = 0; i < 40; i++) { const t = hash(i * 3.7) * 5; A.noise(t, { type: 'highpass', f: 5000, dur: 0.008, g: 0.05 * (1 - baRev(t)) + 0.005 }); }
      A.noise(0, { type: 'bandpass', f: 3000, q: 0.5, dur: 5.1, g: 0.012, hold: true, rel: 0.2 });
      // slider: grab click, drag scrapes
      A.osc(1.95, { f: 1900, dur: 0.03, g: 0.05, type: 'square', lp: 4000 }); A.noise(1.95, { type: 'highpass', f: 3500, dur: 0.012, g: 0.2 });
      [[2.0, 1.0, -0.3], [3.4, 0.45, 0.3], [3.85, 0.75, -0.4]].forEach(([t, d, p]) => A.whoosh(t, d, { f1: 600, f2: 2400, q: 3, g: 0.06, swell: 0.5, pan: p }));
      // the reveal
      A.whoosh(4.95, 0.3, { f1: 800, f2: 6000, g: 0.1 });
      A.impact(5.2, 0.3);
      for (let k = 0; k < 7; k++) A.bell(5.2 + k * 0.045, midi(84 + [0, 2, 4, 7, 9, 12, 16][k]), { g: 0.04, dur: 0.9, pan: (k - 3) * 0.2 });
      A.chord(5.2, [60, 64, 67, 72, 76], { type: 'triangle', dur: 1.8, g: 0.05, a: 0.01, lp: 4000, rev: 0.6, width: 0.9 });
      A.whoosh(6.0, 0.5, { f1: 400, f2: 2200, g: 0.06 });
      [6.7, 7.0].forEach((t, i) => A.osc(t, { f: midi(88 + i * 3), dur: 0.08, g: 0.04, type: 'triangle' }));
      // end sting
      [[8.7, 67], [8.85, 72], [9.0, 79]].forEach(([t, n]) => A.pluck(t, midi(n + 12), { g: 0.14, bright: 0.75, dur: 1.2, rev: 0.4 }));
      A.chord(9.0, [48, 60, 64, 67, 72], { type: 'triangle', dur: 1.0, g: 0.045, a: 0.02, lp: 3200, rev: 0.6, width: 0.8 });
      A.bell(9.0, midi(84), { g: 0.06, dur: 1.0 });
    },
  });
})();
