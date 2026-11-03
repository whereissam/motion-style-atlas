/* batch m5 — Narrative Formats · Explainer, Social: formattimeline · formatstory · formatmanifesto.
   formattimeline (a history explainer: the camera dollies along a horizontal timeline from one
   milestone card to the next — the Token's entirely fictional chronology — then pulls back to
   re-space the evenly stepped milestones to scaled time, and zooms in on the present) ·
   formatstory (a 9:16 social story in a phone: segmented progress bars, a hook inside the first
   second, tap-forward cuts, text stickers, a poll sticker and a link sticker, with the top and
   bottom UI safe zones and the segment lengths annotated beside the phone) ·
   formatmanifesto (a brand manifesto: one idea per line in kinetic type, a word on every beat of
   an imagined voice-over, a build on the half-beat, a cut to silence, then the Token as emblem and
   the brand line). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, spring, midi, text, rrect } = MG;
  const TK = MG.TK, FK = MG.FK, P = TK.P, PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const label = FK.label;
  const hasLS = typeof CanvasRenderingContext2D !== 'undefined' && 'letterSpacing' in CanvasRenderingContext2D.prototype;
  function measure(c, s, size, weight = 900, font = TK.FONT, ls = 0) {
    c.font = `${weight} ${size}px ${font}`;
    if (hasLS) c.letterSpacing = ls + 'px';
    const w = c.measureText(s).width;
    if (hasLS) c.letterSpacing = '0px';
    return w;
  }
  // small accent dot + mono label (as in the Technique Atlas films)
  function tag(c, s, x, y, on = 1, dark = false) {
    if (on <= 0.01) return;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 6, y - 6, 6, 0, TAU); c.fill();
    label(c, s, x + 22, y, { color: dark ? P.ground : P.ink, weight: 700, size: 16, ls: 2 });
    c.restore();
  }
  const win = (t, a, b, f = 0.2) => clamp(Math.min(seg(t, a, a + f), 1 - seg(t, b - f, b)));
  const fonts = [...FK.fonts, [`700 16px ${TK.MONO}`, 'MILESTONE'], [`500 32px ${TK.FONT}`, 'Send message']];

  /* =====================================================================
     TIMELINE — the history explainer. One horizontal axis, a camera that
     travels along it and stops on the beat at each milestone, where a card
     pops out on a stem (year, one line, a small drawing of the Token at
     that stage). The chronology is invented and says so. The convention
     shown at the turn: explainers usually space milestones evenly (one
     step per event), which hides how uneven history is; the camera pulls
     back, the gaps are labelled, and the axis re-spaces to scaled time,
     where distance is proportional to years. Then a push in on the
     present: the Token and MOTION.
     ===================================================================== */
  const TLM = [
    { y: 1924, n: 'THE SQUARE IS DRAWN' },
    { y: 1951, n: 'ITS CORNERS SOFTEN' },
    { y: 1968, n: 'A HOLE IS PUNCHED' },
    { y: 1983, n: 'IT TURNS ORANGE' },
    { y: 1999, n: 'IT LEARNS TO TURN' },
    { y: 2026, n: 'IT MOVES' },
  ];
  const TL_ARR = [1.5, 2.5, 3.5, 4.5, 5.5];          // camera arrives on the beat
  const TL_L = 2800, TL_Y = 560, TL_NOW = 8.5;
  const tlEven = i => i * TL_L / 5, tlScaled = y => (y - 1924) / 102 * TL_L;
  const TL_BEATS = [
    { t0: 0, t1: 1.4, name: 'Title', kind: 'hook' },
    { t0: 1.4, t1: 6.0, name: 'Milestones · even steps', kind: 'act' },
    { t0: 6.0, t1: 8.0, name: 'Scaled time', kind: 'turn' },
    { t0: 8.0, t1: 10, name: 'The present', kind: 'title' },
  ];
  const tlCam = t => kf(t, [[0, -150], [1.5, 0, E.outC], [1.95, 0], [2.5, 560], [2.95, 560], [3.5, 1120], [3.95, 1120], [4.5, 1680], [4.95, 1680], [5.5, 2240], [6.1, 2240], [6.9, 1400], [8.0, 1400], [8.7, 2800, E.ioC]]);
  const tlZoom = t => kf(t, [[0, 1], [6.1, 1], [6.9, 0.56], [8.0, 0.56], [8.7, 1.0, E.ioC]]);
  const tlU = t => E.ioC(seg(t, 6.95, 7.75));        // even → scaled
  const tlX = (i, u) => lerp(tlEven(i), tlScaled(TLM[i].y), u);

  function tlIcon(c, i, x, y, s, t) {
    c.save(); c.translate(x, y);
    c.strokeStyle = P.ink; c.lineWidth = s * 0.06;
    if (i === 0) c.strokeRect(-s / 2, -s / 2, s, s);
    else if (i === 1) { rrect(c, -s / 2, -s / 2, s, s, s * TK.CORNER); c.stroke(); }
    else if (i === 2) TK.token(c, 0, 0, s, { color: P.ink });
    else if (i === 3) TK.token(c, 0, 0, s);
    else {
      TK.token(c, 0, 0, s * 0.78, { rot: Math.max(0, t - 4.4) * 2.2 });
      c.lineWidth = 3; c.beginPath(); c.arc(0, 0, s * 0.66, -PI * 0.95, -PI * 0.2); c.stroke();
      const a = -PI * 0.2, r = s * 0.66, ax = Math.cos(a) * r, ay = Math.sin(a) * r;
      c.fillStyle = P.ink; c.beginPath(); c.moveTo(ax + 9, ay - 3); c.lineTo(ax - 6, ay - 9); c.lineTo(ax - 2, ay + 8); c.closePath(); c.fill();
    }
    c.restore();
  }
  function tlCard(c, m, i, x, up, p, t) {
    const cw = 430, ch = 150, stem = 80, dir = up ? -1 : 1;
    const sp = clamp(p * 1.6);
    c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(x, dir * 16); c.lineTo(x, dir * (16 + stem * sp)); c.stroke();
    if (p <= 0.01) return;
    const ay = dir * (stem + 16), top = up ? ay - ch : ay;
    c.save();
    c.translate(x, ay); c.scale(p, p); c.translate(-x, -ay);
    c.fillStyle = 'rgba(23,24,28,0.10)'; rrect(c, x - cw / 2 + 6, top + 8, cw, ch, 14); c.fill();
    c.fillStyle = '#f8f5ef'; rrect(c, x - cw / 2, top, cw, ch, 14); c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 2; c.stroke();
    c.fillStyle = P.accent; c.fillRect(x - cw / 2, top + 22, 6, ch - 44);
    text(c, String(m.y), x - cw / 2 + 30, top + 80, { font: TK.FONT, weight: 900, size: 64, color: P.ink });
    text(c, m.n, x - cw / 2 + 30, top + 118, { font: TK.MONO, weight: 700, size: 15, ls: 2, color: P.ink });
    tlIcon(c, i, x + cw / 2 - 72, top + ch / 2 - 4, 74, t);
    c.restore();
  }

  MG.film({
    id: 'formattimeline', dur: 10, poster: 7.9,
    fonts,
    meta: {
      family: 'M', name: 'Timeline', sub: 'History told as a camera move along one axis', era: '1765 —',
      origin: 'The timeline as a picture of history goes back to Joseph Priestley’s A Chart of Biography (1765), which drew lives as bars on a single scaled time axis, and his New Chart of History (1769). Television documentaries and museum films turned it into a camera move: a line travelling across the frame, dates rolling past, an event card at each stop. Web and motion explainers made it a template — the horizontal scroll, the milestone card on a stem, the jump to “today” — and with it a choice every timeline makes: even steps, one per event, or scaled time, where gaps are as long as the years they hold.',
      works: 'Joseph Priestley, A Chart of Biography (1765) · Charles Joseph Minard and later infographic history charts in print · Knight Lab TimelineJS (Northwestern University, 2012 —) used across web journalism',
      tech: ['Milestone cards on stems', 'Even steps vs. scaled time', 'Zoom to the present'],
      accent: '#ff5a1f',
      motionDNA: 'A short title, then the camera dollies along the axis in hold-and-move steps, arriving on every second beat so each milestone card can spring out on its stem while the next marker waits off to the right. At the turn the camera pulls back to show the whole line, the gaps between events are labelled in years, and the evenly spaced markers slide to their true positions in scaled time. Then a push in on the present, where the Token and MOTION land.',
      visualDNA: 'The Technique Atlas paper stage; one ink axis with round markers; cream cards with an ink keyline, an orange edge bar, a heavy year and a mono line, each with a small drawing of the Token at that stage (sharp square, rounded square, punched hole, orange, turning). Decade ticks appear only in scaled time; a small EVEN | SCALED switch and a FICTIONAL CHRONOLOGY note sit under the structure strip.',
      transitions: 'Camera dolly between stops; pull-back and re-spacing of the axis; push-in to the present',
      implementation: ['After Effects null-driven camera on a long precomp', 'Web scroll timelines (TimelineJS, scrollytelling)', 'Canvas 2D: one world transform per frame (camera x, zoom), markers lerped between even and scaled x'],
      reproducibility: 'Fully procedural (the chronology is invented)',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H, { ox: -tlCam(t) * tlZoom(t) * 0.3 });
      const z = tlZoom(t), cam = tlCam(t), u = tlU(t);
      // ---- world ----
      c.save();
      c.translate(960, TL_Y); c.scale(z, z); c.translate(-cam, 0);
      const draw0 = E.outC(seg(t, 0.5, 1.4));
      const reach = -900 + (TL_L + 2600) * draw0;
      c.fillStyle = P.ink; c.fillRect(-900, -1.5, reach + 900, 3);
      // decade ticks (scaled time only)
      if (u > 0.01) {
        c.save(); c.globalAlpha = u;
        for (let yr = 1930; yr <= 2020; yr += 10) {
          const x = tlScaled(yr);
          c.fillStyle = P.ink; c.fillRect(x - 1, -12, 2, 24);
          text(c, String(yr), x, 50, { font: TK.MONO, size: 24, color: P.mute, align: 'center' });
        }
        c.restore();
      }
      // gap labels
      const ga = seg(t, 6.3, 6.8) * (1 - seg(t, 8.1, 8.5));
      if (ga > 0.01) {
        c.save(); c.globalAlpha = ga;
        for (let i = 0; i < 5; i++) {
          const a = tlX(i, u), b = tlX(i + 1, u), d = TLM[i + 1].y - TLM[i].y;
          c.strokeStyle = P.blue; c.lineWidth = 3; c.beginPath();
          c.moveTo(a + 22, 300); c.lineTo(b - 22, 300); c.moveTo(a + 22, 290); c.lineTo(a + 22, 310); c.moveTo(b - 22, 290); c.lineTo(b - 22, 310); c.stroke();
          const lw = 120;
          c.fillStyle = P.ground; c.fillRect((a + b) / 2 - lw / 2, 282, lw, 36);
          text(c, `+${d} YRS`, (a + b) / 2, 310, { font: TK.MONO, size: 28, weight: 700, color: P.blue, align: 'center' });
        }
        c.restore();
      }
      // markers + cards
      TLM.forEach((m, i) => {
        const x = tlX(i, u), now = i === 5;
        const tp = now ? TL_NOW : TL_ARR[i] - 0.1, seen = t >= tp;
        if (x > reach) return;
        if (now) {
          const pulse = 0.5 + 0.5 * Math.sin(t * TAU * 2);
          c.fillStyle = 'rgba(255,90,31,0.25)'; c.beginPath(); c.arc(x, 0, 18 + 8 * pulse, 0, TAU); c.fill();
          c.fillStyle = P.accent; c.beginPath(); c.arc(x, 0, 13, 0, TAU); c.fill();
          text(c, 'NOW', x, -32, { font: TK.MONO, size: 24, weight: 700, color: P.accentD, align: 'center', ls: 3 });
        } else {
          c.fillStyle = seen ? P.ink : P.ground; c.beginPath(); c.arc(x, 0, 13, 0, TAU); c.fill();
          c.strokeStyle = P.ink; c.lineWidth = 3; c.stroke();
          if (!seen) text(c, String(m.y), x, 44, { font: TK.MONO, size: 22, color: P.mute, align: 'center' });
        }
        if (!now) tlCard(c, m, i, x, i % 2 === 0, seen ? spring(t - tp, 2.4, 0.5) : 0, t);
      });
      // the present: Token and MOTION
      const pn = spring(t - (TL_NOW - 0.05), 2.2, 0.45);
      if (t > TL_NOW - 0.05) {
        const x = TL_L;
        TK.token(c, x, -210, 210 * pn, { rot: (1 - pn) * -0.6 });
        TK.word(c, x, 175, { size: 104, alpha: E.outC(seg(t, 8.75, 9.2)), ls: 6 });
        label(c, `${TLM[5].y}  ·  ${TLM[5].n}`, x, 260, { align: 'center', size: 20, color: P.ink, weight: 700, ls: 3 });
      }
      c.restore();
      // ---- screen-space ----
      // title
      const ta = E.outC(seg(t, 0.05, 0.4)) * (1 - seg(t, 1.1, 1.4));
      if (ta > 0.01) {
        c.save(); c.globalAlpha = ta;
        const dy = (1 - E.outC(seg(t, 0.05, 0.5))) * 20;
        label(c, 'A BRIEF HISTORY OF', 960, 300 + dy, { align: 'center', size: 22, color: P.ink, weight: 700, ls: 6 });
        text(c, 'THE TOKEN', 960, 410 + dy, { font: TK.FONT, weight: 900, size: 116, color: P.ink, align: 'center', ls: 4 });
        label(c, '(A FICTIONAL CHRONOLOGY)', 960, 470 + dy, { align: 'center', size: 18, color: P.accentD, ls: 4 });
        c.restore();
      }
      // under-strip furniture: spacing switch, fiction note
      const fa = seg(t, 1.2, 1.6);
      c.save(); c.globalAlpha = fa;
      label(c, 'SPACING', 72, 112, { size: 14, ls: 3 });
      [['EVEN', 0], ['SCALED', 1]].forEach(([s, k], j) => {
        const on = k ? u : 1 - u, x = 168 + j * 104;
        c.fillStyle = `rgba(23,24,28,${0.9 * on})`; rrect(c, x, 94, 96, 26, 13); c.fill();
        c.strokeStyle = P.ink; c.lineWidth = 1.5; rrect(c, x, 94, 96, 26, 13); c.stroke();
        label(c, s, x + 48, 112, { size: 13, ls: 2, align: 'center', weight: 700, color: on > 0.5 ? P.ground : P.ink });
      });
      label(c, 'FICTIONAL CHRONOLOGY  ·  NOT REAL HISTORY', 1848, 112, { size: 14, ls: 3, align: 'right' });
      c.restore();
      // card annotation on the first stop
      tag(c, 'MILESTONE CARD  ·  YEAR + ONE LINE', 740, 278, win(t, 1.55, 2.4));
      // status line, bottom right
      const st = t < 6.0 ? ['EVEN SPACING', 'ONE STEP PER MILESTONE, WHATEVER THE GAP'] : t < 8.0 ? (u < 0.5 ? ['THE GAPS ARE NOT EQUAL', '27 · 17 · 15 · 16 · 27 YEARS'] : ['SCALED TIME', 'DISTANCE ∝ YEARS  ·  DECADE TICKS']) : ['ZOOM TO THE PRESENT', 'THE STORY ENDS ON TODAY'];
      const sa = seg(t, 1.6, 2.0);
      if (sa > 0) {
        c.save(); c.globalAlpha = sa;
        label(c, st[0], 1848, 990, { align: 'right', size: 20, color: P.ink, weight: 700 });
        label(c, st[1], 1848, 1020, { align: 'right', size: 14, ls: 2 });
        c.restore();
      }
      FK.strip(c, t, W, H, TL_BEATS, { label: 'Timeline explainer' });
      FK.caption(c, t, W, H, { name: 'Timeline', cat: 'Explainer' });
    },
    score(A) {
      TK.bed(A, { g: 0.55 });
      A.chord(0.05, [60, 67, 72], { type: 'triangle', dur: 1.5, g: 0.04, a: 0.15, lp: 1800, rev: 0.5, width: 0.6 });
      A.bell(0.3, midi(84), { g: 0.05, dur: 1.4 });
      TL_ARR.forEach((t, i) => {
        if (i) A.whoosh(t - 0.55, 0.55, { f1: 350, f2: 2400, g: 0.07, swell: 0.7, pan: 0.35 });
        A.pluck(t - 0.1, midi([67, 69, 71, 72, 74][i]), { g: 0.2, bright: 0.6, dur: 1.0, rev: 0.3 });
        A.osc(t - 0.1, { f: 3200, dur: 0.03, g: 0.05 });
        A.bell(t, midi([79, 81, 83, 84, 86][i]), { g: 0.045, dur: 1.2, pan: 0.2 });
      });
      A.whoosh(6.1, 0.8, { f1: 2600, f2: 300, g: 0.1, swell: 0.4 });
      for (let k = 0; k < 5; k++) A.osc(6.4 + k * 0.1, { f: 1700 + k * 220, dur: 0.035, g: 0.04, pan: (k - 2) * 0.25 });
      A.osc(6.95, { type: 'triangle', f: midi(55), f2: midi(67), glide: 0.8, dur: 0.9, g: 0.07, lp: 2200, rev: 0.4 });
      A.pluck(7.75, midi(79), { g: 0.16, bright: 0.5, dur: 0.8, rev: 0.3 });
      A.whoosh(8.0, 0.6, { f1: 300, f2: 3000, g: 0.1 });
      A.kick(8.5, 0.42, { f: 110, f2: 40 });
      A.chord(8.5, [60, 64, 67, 72, 76], { type: 'triangle', dur: 1.5, g: 0.045, a: 0.03, lp: 2600, rev: 0.6, width: 0.8 });
      A.bell(8.5, midi(84), { g: 0.08, dur: 1.8 });
      A.pluck(8.75, midi(79), { g: 0.15, dur: 1.2, rev: 0.4 });
    },
  });

  /* =====================================================================
     VERTICAL STORY — a 9:16 social story inside a phone, centred in the
     16:9 frame with the conventions annotated beside it. Four segments
     under four progress bars: the hook (the Token slams in inside the
     first second), text stickers, a poll sticker that takes one tap, and
     a link sticker as the call to action. A tap on the right of the
     screen cuts to the next segment. The top and bottom bands of the
     screen belong to the app (progress, profile; reply, link) and are
     hatched as keep-clear zones; nothing important is placed there.
     ===================================================================== */
  const ST_SEG = [[0, 2.5], [2.5, 5], [5, 7.5], [7.5, 10]];
  const ST_NAMES = ['HOOK + REVEAL', 'TEXT STICKERS', 'POLL STICKER', 'LINK STICKER'];
  const ST_BEATS = [
    { t0: 0, t1: 1, name: 'Hook', kind: 'hook' },
    { t0: 1, t1: 2.5, name: 'Seg 1', kind: 'act' },
    { t0: 2.5, t1: 5, name: 'Seg 2 · stickers', kind: 'act' },
    { t0: 5, t1: 7.5, name: 'Seg 3 · poll', kind: 'turn' },
    { t0: 7.5, t1: 10, name: 'Seg 4 · link', kind: 'cta' },
  ];
  const ST_TAPS = [[2.42, 860, 960], [4.92, 860, 960], [5.9, 400, 1175], [7.42, 860, 960], [9.0, 540, 1300]];
  const ST_PH = { cx: 960, cy: 565, h: 880 };
  const SB = 250;   // keep-clear band height, phone px of 1920

  function stRipple(c, t, t0, x, y) {
    const u = seg(t, t0, t0 + 0.5);
    if (u <= 0 || u >= 1) return;
    c.save();
    c.fillStyle = `rgba(255,255,255,${0.55 * (1 - u)})`; c.beginPath(); c.arc(x, y, 34, 0, TAU); c.fill();
    c.strokeStyle = `rgba(255,255,255,${1 - u})`; c.lineWidth = 6; c.beginPath(); c.arc(x, y, 34 + 110 * E.outC(u), 0, TAU); c.stroke();
    c.restore();
  }
  function sticker(c, t, t0, x, y, rot, fn) {
    if (t < t0) return;
    const k = spring(t - t0, 3, 0.42);
    c.save(); c.translate(x, y); c.rotate(rot * (0.4 + 0.6 * k)); c.scale(k, k); fn(c); c.restore();
  }
  function stContent(c, t) {
    const sI = t < 2.5 ? 0 : t < 5 ? 1 : t < 7.5 ? 2 : 3;
    if (sI === 0) {
      c.fillStyle = '#17181c'; c.fillRect(0, 0, 1080, 1920);
      const g = c.createRadialGradient(540, 1000, 50, 540, 1000, 900); g.addColorStop(0, 'rgba(255,90,31,0.35)'); g.addColorStop(1, 'rgba(255,90,31,0)');
      c.fillStyle = g; c.fillRect(0, 0, 1080, 1920);
      const k = spring(t - 0.08, 2.6, 0.4), sp = seg(t, 1.0, 1.7);
      TK.token(c, 540, 1020, 440 * k, { rot: -0.25 * (1 - k) + E.ioC(sp) * PI, sx: 1 + 0.22 * Math.sin(PI * sp), sy: 1 - 0.16 * Math.sin(PI * sp) });
      if (t < 1.0) {
        const w = spring(t - 0.25, 3.2, 0.4);
        if (t > 0.25) { c.save(); c.translate(540, 520); c.scale(w, w); text(c, 'WAIT.', 0, 0, { font: TK.FONT, weight: 900, size: 230, color: '#fff', align: 'center', base: 'middle' }); c.restore(); }
      } else {
        [['IT MOVES', 1.05, '#fff', 450], ['NOW.', 1.3, P.accent, 620]].forEach(([s, t0, col, y]) => {
          if (t < t0) return;
          const w = spring(t - t0, 3.2, 0.42);
          c.save(); c.translate(540, y); c.scale(w, w); text(c, s, 0, 0, { font: TK.FONT, weight: 900, size: 170, color: col, align: 'center', base: 'middle' }); c.restore();
        });
      }
    } else if (sI === 1) {
      c.fillStyle = P.ground; c.fillRect(0, 0, 1080, 1920);
      c.strokeStyle = P.line; c.lineWidth = 2; c.beginPath();
      for (let x = 0; x <= 1080; x += 120) { c.moveTo(x, 0); c.lineTo(x, 1920); }
      for (let y = 0; y <= 1920; y += 120) { c.moveTo(0, y); c.lineTo(1080, y); }
      c.stroke();
      const bob = Math.sin((t - 2.5) * TAU) * 16;
      c.fillStyle = P.shadow; c.beginPath(); c.ellipse(540, 1200, 170 - bob * 2, 22, 0, 0, TAU); c.fill();
      TK.token(c, 540, 980 + bob, 380, { rot: Math.sin((t - 2.5) * PI) * 0.12 });
      sticker(c, t, 2.75, 540, 560, -0.08, g => {
        g.fillStyle = P.ink; g.fillRect(-290, -95, 580, 190);
        text(g, 'MOTION', 0, 6, { font: TK.FONT, weight: 900, size: 130, color: '#fff', align: 'center', base: 'middle', ls: 4 });
      });
      sticker(c, t, 3.25, 330, 1360, 0.06, g => {
        rrect(g, -230, -48, 460, 96, 48); g.fillStyle = P.blue; g.fill();
        text(g, '@motion.token', 0, 4, { font: TK.FONT, weight: 800, size: 48, color: '#fff', align: 'center', base: 'middle' });
      });
      sticker(c, t, 3.75, 820, 1420, 0.18, g => {
        g.fillStyle = P.accentL; g.beginPath(); g.arc(0, 0, 130, 0, TAU); g.fill();
        g.strokeStyle = P.ink; g.lineWidth = 5; g.stroke();
        text(g, 'NEW', 0, -6, { font: TK.FONT, weight: 900, size: 84, color: P.ink, align: 'center', base: 'middle' });
        text(g, 'IN MOTION', 0, 58, { font: TK.MONO, weight: 700, size: 24, color: P.ink, align: 'center', base: 'middle', ls: 2 });
      });
    } else if (sI === 2) {
      c.fillStyle = P.blue; c.fillRect(0, 0, 1080, 1920);
      const spin = E.outB(seg(t, 6.15, 7.0));
      TK.token(c, 540, 640, 300, { rot: spin * TAU, color: P.accent });
      sticker(c, t, 5.2, 540, 1180, -0.03, g => {
        rrect(g, -380, -230, 760, 460, 36); g.fillStyle = '#fff'; g.fill();
        text(g, 'SHOULD IT SPIN?', 0, -140, { font: TK.FONT, weight: 900, size: 62, color: P.ink, align: 'center', base: 'middle' });
        const voted = t >= 5.95, res = E.outC(seg(t, 6.0, 6.6));
        [['YES', 82, -30], ['NO', 18, 100]].forEach(([s, pc, y], j) => {
          rrect(g, -330, y - 50, 660, 100, 50); g.fillStyle = '#eef0f6'; g.fill();
          if (voted) {
            g.save(); rrect(g, -330, y - 50, 660, 100, 50); g.clip();
            g.fillStyle = j ? 'rgba(47,91,255,0.25)' : P.accent; g.fillRect(-330, y - 50, 660 * pc / 100 * res, 100); g.restore();
          }
          text(g, s, voted ? -290 : 0, y + 2, { font: TK.FONT, weight: 900, size: 46, color: P.ink, align: voted ? 'left' : 'center', base: 'middle' });
          if (voted) text(g, `${Math.round(pc * res)}%`, 290, y + 2, { font: TK.FONT, weight: 800, size: 42, color: P.ink, align: 'right', base: 'middle' });
        });
      });
    } else {
      c.fillStyle = '#17181c'; c.fillRect(0, 0, 1080, 1920);
      const k = spring(t - 7.5, 2.4, 0.45);
      TK.token(c, 540, 740, 320 * k, { rot: (1 - k) * 1.2 });
      TK.word(c, 540, 1060, { size: 150, color: '#fff', alpha: E.outC(seg(t, 7.65, 8.0)), ls: 6 });
      const press = 1 - 0.08 * Math.sin(PI * seg(t, 9.0, 9.25));
      sticker(c, t, 7.95, 540, 1320, 0, g => {
        const pulse = (1 + 0.025 * Math.sin((t - 7.95) * TAU * 2)) * press;
        g.scale(pulse, pulse);
        rrect(g, -340, -60, 680, 120, 60); g.fillStyle = '#fff'; g.fill();
        g.strokeStyle = P.blue; g.lineWidth = 7;
        [[-268, -8], [-246, 8]].forEach(([x, y]) => { rrect(g, x - 24, y - 13, 48, 26, 13); g.stroke(); });
        text(g, 'WATCH THE FILM', 40, 4, { font: TK.FONT, weight: 800, size: 46, color: P.blue, align: 'center', base: 'middle' });
      });
    }
    return sI;
  }
  function stChrome(c, t) {
    let g = c.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, 'rgba(0,0,0,0.42)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, 1080, 300);
    g = c.createLinearGradient(0, 1620, 0, 1920); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.42)');
    c.fillStyle = g; c.fillRect(0, 1620, 1080, 300);
    // progress bars
    const bw = (1080 - 48 - 3 * 10) / 4;
    ST_SEG.forEach(([a, b], i) => {
      const x = 24 + i * (bw + 10);
      c.fillStyle = 'rgba(255,255,255,0.38)'; rrect(c, x, 36, bw, 8, 4); c.fill();
      c.fillStyle = '#fff'; rrect(c, x, 36, Math.max(0.01, bw * seg(t, a, b)), 8, 4); c.fill();
    });
    // profile row
    c.fillStyle = P.accent; c.beginPath(); c.arc(78, 118, 36, 0, TAU); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
    TK.token(c, 78, 118, 34, { color: '#fff' });
    text(c, 'motion.token', 130, 130, { font: TK.FONT, weight: 800, size: 32, color: '#fff' });
    text(c, '2h', 384, 130, { font: TK.FONT, weight: 500, size: 30, color: 'rgba(255,255,255,0.7)' });
    c.fillStyle = '#fff'; [930, 950, 970].forEach(x => { c.beginPath(); c.arc(x, 118, 5, 0, TAU); c.fill(); });
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.moveTo(1010, 102); c.lineTo(1042, 134); c.moveTo(1042, 102); c.lineTo(1010, 134); c.stroke();
    // reply bar
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 3; rrect(c, 36, 1790, 800, 96, 48); c.stroke();
    text(c, 'Send message', 80, 1849, { font: TK.FONT, weight: 500, size: 32, color: 'rgba(255,255,255,0.85)' });
    c.save(); c.translate(920, 1840); c.beginPath();   // heart
    c.moveTo(0, 22); c.bezierCurveTo(-46, -8, -22, -40, 0, -16); c.bezierCurveTo(22, -40, 46, -8, 0, 22); c.stroke(); c.restore();
    c.beginPath(); c.moveTo(990, 1818); c.lineTo(1044, 1838); c.lineTo(990, 1860); c.lineTo(1002, 1838); c.closePath(); c.stroke();   // send
  }
  function stZones(c, t) {
    const em = 0.45 + 0.55 * Math.max(win(t, 0.3, 2.2, 0.3), win(t, 9.3, 10.2, 0.3));
    c.save(); c.globalAlpha = em;
    [[0, SB], [1920 - SB, SB]].forEach(([y, h]) => {
      c.save(); c.beginPath(); c.rect(0, y, 1080, h); c.clip();
      c.fillStyle = 'rgba(255,90,31,0.12)'; c.fillRect(0, y, 1080, h);
      c.strokeStyle = 'rgba(255,90,31,0.55)'; c.lineWidth = 3; c.beginPath();
      for (let x = -h; x < 1080 + h; x += 36) { c.moveTo(x, y + h); c.lineTo(x + h, y); }
      c.stroke(); c.restore();
    });
    c.setLineDash([16, 12]); c.strokeStyle = P.accent; c.lineWidth = 4; c.beginPath();
    c.moveTo(0, SB); c.lineTo(1080, SB); c.moveTo(0, 1920 - SB); c.lineTo(1080, 1920 - SB); c.stroke();
    c.restore();
  }

  MG.film({
    id: 'formatstory', dur: 10, poster: 6.4,
    fonts,
    meta: {
      family: 'M', name: 'Vertical Story', sub: 'Full-screen segments that vanish in a day', era: '2013 —',
      origin: 'Snapchat introduced Stories in October 2013: a chain of full-screen vertical photos and clips, played in order and gone after 24 hours. Instagram Stories copied the format in August 2016, then WhatsApp Status, Facebook and others, which fixed its grammar — segmented progress bars across the top, tap right to skip and left to go back, a reply bar along the bottom, and stickers (text, mentions, polls) placed on top. The swipe-up link was replaced on Instagram by the link sticker in 2021. Ad guidance for Stories asks for the top and bottom of the frame (about 250 px each on a 1080 × 1920 canvas) to be kept free of text and logos, because the app’s own interface covers them.',
      works: 'Snapchat Stories (2013 —) · Instagram Stories (2016 —) with poll stickers (2017) and link stickers (2021) · WhatsApp Status (2017 —)',
      tech: ['Hook inside the first second', 'Segments + tap-forward', 'Top / bottom UI safe zones'],
      accent: '#ff5a1f',
      motionDNA: 'Four segments under four progress bars. Segment one hooks inside the first second — the Token slams in with WAIT. — then pays off. A tap on the right of the screen hard-cuts to segment two, where tilted text stickers spring on one after another; segment three asks a question with a poll sticker, takes one tap and fills its result bars while the Token spins; segment four ends on the wordmark and a pulsing link sticker that is tapped. Every cut lands on a bar of the 120 BPM bed.',
      visualDNA: 'The Technique Atlas paper stage with a 9:16 phone in the middle. Inside: bold colour-blocked segments (ink with an orange glow, paper grid, cobalt, ink), heavy Archivo stickers, a white poll card with orange result bars, a white link pill; generic story chrome (bars, avatar, name, reply field, heart, send). The top and bottom 250 px are hatched orange keep-clear zones; mono annotations, a hook timer and a segment list sit outside the phone.',
      transitions: 'Hard cuts on tap-forward between segments; stickers spring on with overshoot; the poll fills on the vote',
      implementation: ['Instagram / Snapchat in-app story editor', 'Figma or After Effects 1080 × 1920 story templates with safe-zone guides', 'Canvas 2D: the story drawn at 1080 × 1920 under a scale transform, clipped to the phone screen'],
      reproducibility: 'Fully procedural (generic app UI, fictional account, no real logos)',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      const [x, y, w, h, r] = FK.phone(c, ST_PH.cx, ST_PH.cy, ST_PH.h);
      const ps = w / 1080, Y = v => y + v * ps;
      c.save();
      rrect(c, x, y, w, h, r); c.clip();
      c.translate(x, y); c.scale(ps, ps);
      const sI = stContent(c, t);
      stChrome(c, t);
      stZones(c, t);
      // tap zones, shown at the first tap
      const tz = win(t, 2.1, 2.9, 0.15);
      if (tz > 0.01) {
        c.save(); c.globalAlpha = tz;
        c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0, SB, 360, 1920 - 2 * SB);
        c.setLineDash([14, 12]); c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.moveTo(360, SB); c.lineTo(360, 1920 - SB); c.stroke();
        text(c, '← BACK', 180, 1300, { font: TK.MONO, weight: 700, size: 34, color: '#fff', align: 'center' });
        text(c, 'NEXT →', 720, 1300, { font: TK.MONO, weight: 700, size: 34, color: '#fff', align: 'center' });
        c.restore();
      }
      ST_TAPS.forEach(([t0, px, py]) => stRipple(c, t, t0, px, py));
      c.restore();
      // ---- outside the phone ----
      const R = x + w + 14, L = x - 14;
      // zone labels on the right
      [[SB / 2, 'TOP 250 PX  ·  KEEP CLEAR', 'PROGRESS BARS · PROFILE'], [1920 - SB / 2, 'BOTTOM 250 PX  ·  KEEP CLEAR', 'REPLY FIELD · LIKE · SHARE']].forEach(([v, a, b]) => {
        const yy = Y(v);
        c.save(); c.setLineDash([5, 6]); c.strokeStyle = P.accent; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(R + 4, yy); c.lineTo(1262, yy); c.stroke(); c.restore();
        c.fillStyle = P.accent; c.beginPath(); c.arc(1266, yy, 5, 0, TAU); c.fill();
        label(c, a, 1284, yy - 2, { size: 16, color: P.ink, weight: 700, ls: 2 });
        label(c, b, 1284, yy + 22, { size: 13, ls: 2 });
      });
      // segment list on the right
      label(c, 'SEGMENTS', 1284, 360, { size: 14, ls: 3 });
      ST_SEG.forEach(([a, b], i) => {
        const yy = 400 + i * 74, cur = i === sI, past = i < sI;
        label(c, `0${i + 1}`, 1284, yy + 18, { size: 16, color: cur ? P.accentD : P.mute, weight: 700 });
        label(c, ST_NAMES[i], 1330, yy + 18, { size: 16, color: cur || past ? P.ink : P.mute, weight: cur ? 700 : 400, ls: 2 });
        label(c, `${(b - a).toFixed(1)} S`, 1800, yy + 18, { size: 16, color: cur ? P.ink : P.mute, align: 'right', weight: cur ? 700 : 400 });
        c.fillStyle = 'rgba(23,24,28,0.12)'; c.fillRect(1330, yy + 30, 470, 4);
        c.fillStyle = cur ? P.accent : past ? P.ink : 'rgba(0,0,0,0)'; c.fillRect(1330, yy + 30, 470 * (past ? 1 : seg(t, a, b)), 4);
      });
      label(c, 'COMPRESSED HERE · A PHOTO SEGMENT', 1284, 712, { size: 12, ls: 2 });
      label(c, 'PLAYS ABOUT 5 S ON THE APPS', 1284, 732, { size: 12, ls: 2 });
      // left column: format + per-segment convention
      label(c, '9:16  ·  1080 × 1920', L - 26, 196, { align: 'right', size: 18, color: P.ink, weight: 700 });
      label(c, 'FULL-SCREEN · TAP-FORWARD · 24 H', L - 26, 222, { align: 'right', size: 13, ls: 2 });
      const notes = [
        null,
        ['TEXT STICKERS', 'POP ON · TILTED · INSIDE THE SAFE AREA'],
        ['POLL STICKER', 'ONE TAP TO ANSWER · RESULTS SHOW AT ONCE'],
        ['LINK STICKER · THE CTA', 'REPLACED THE SWIPE-UP LINK IN 2021'],
      ];
      if (sI === 0) {
        const hk = clamp(t);
        label(c, 'HOOK IN THE FIRST 1 S', L - 26, 330, { align: 'right', size: 18, color: P.ink, weight: 700 });
        text(c, `${hk.toFixed(2)} S`, L - 26, 400, { font: TK.FONT, weight: 900, size: 60, color: t < 1 ? P.accent : P.ink, align: 'right' });
        c.fillStyle = 'rgba(23,24,28,0.12)'; c.fillRect(L - 326, 420, 300, 6);
        c.fillStyle = P.accent; c.fillRect(L - 326, 420, 300 * hk, 6);
        c.fillStyle = P.ink; c.fillRect(L - 326 + 300 * 0.25 - 1, 414, 2, 18);
        label(c, 'TOKEN + “WAIT.” LAND AT 0.25 S', L - 26, 458, { align: 'right', size: 13, ls: 2, color: t > 0.25 ? P.ink : P.mute });
        if (t > 1) label(c, 'THEN THE PAYOFF', L - 26, 484, { align: 'right', size: 13, ls: 2, color: P.ink });
      } else {
        const [a, b] = notes[sI], na = seg(t, ST_SEG[sI][0] + 0.05, ST_SEG[sI][0] + 0.3);
        c.save(); c.globalAlpha = na;
        label(c, a, L - 26, 330, { align: 'right', size: 18, color: P.ink, weight: 700 });
        label(c, b, L - 26, 358, { align: 'right', size: 13, ls: 2 });
        c.restore();
      }
      const tn = win(t, 2.1, 2.9, 0.15);
      if (tn > 0.01) { c.save(); c.globalAlpha = tn; tag(c, 'TAP RIGHT → NEXT SEGMENT', L - 360, 560); label(c, 'TAP LEFT ← BACK · HOLD TO PAUSE', L - 26, 588, { align: 'right', size: 13, ls: 2 }); c.restore(); }
      const tc = win(t, 8.9, 9.8, 0.15);
      if (tc > 0.01) { c.save(); c.globalAlpha = tc; tag(c, 'CTA · THE TAP IS THE CONVERSION', L - 440, 560); c.restore(); }
      FK.strip(c, t, W, H, ST_BEATS, { label: 'Vertical story · 9:16' });
      FK.caption(c, t, W, H, { name: 'Vertical Story', cat: 'Social' });
    },
    score(A) {
      const B = TK.BEAT;
      for (let b = 0; b < 20; b++) {
        const t = b * B;
        A.kick(t, b % 2 ? 0.16 : 0.26, { f: 125, f2: 45 });
        if (b % 2) A.clap(t, 0.1);
        A.hat(t + B / 2, 0.04, false, { pan: 0.2 });
      }
      const bars = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [60, 64, 67, 72]];
      for (let s = 0; s < 40; s++) if (s % 4 === 1 || s % 4 === 3) A.chord(s * 0.25, bars[Math.floor(s / 8)], { type: 'square', dur: 0.12, g: 0.016, a: 0.004, lp: 1800, width: 0.7 });
      // hook
      A.impact(0.08, 0.32);
      A.pluck(0.25, midi(84), { g: 0.2, bright: 0.8, dur: 0.6 });
      A.pluck(0.25, midi(72), { g: 0.16, dur: 0.6 });
      A.whoosh(0.95, 0.75, { f1: 400, f2: 3000, g: 0.08 });
      A.pluck(1.05, midi(76), { g: 0.16, dur: 0.5 }); A.pluck(1.3, midi(79), { g: 0.16, dur: 0.7 });
      // taps (click) and cuts
      ST_TAPS.forEach(([t]) => { A.osc(t, { f: 1900, f2: 900, glide: 0.03, dur: 0.04, g: 0.09 }); A.noise(t, { type: 'highpass', f: 5000, dur: 0.02, g: 0.06 }); });
      [2.5, 5.0, 7.5].forEach(t => A.whoosh(t - 0.06, 0.2, { f1: 1200, f2: 5000, g: 0.06, swell: 0.3 }));
      // stickers
      [2.75, 3.25, 3.75].forEach((t, i) => A.pluck(t, midi([72, 76, 79][i]), { g: 0.2, bright: 0.7, dur: 0.6, bend: 1.12, bendT: 0.08, pan: [-0.3, -0.1, 0.3][i] }));
      // poll
      A.pluck(5.2, midi(74), { g: 0.16, dur: 0.6, bend: 1.12, bendT: 0.08 });
      A.bell(5.95, midi(84), { g: 0.08, dur: 1.2 });
      [79, 83, 86, 91].forEach((m, i) => A.osc(6.0 + i * 0.08, { type: 'triangle', f: midi(m), dur: 0.25, g: 0.05, rev: 0.3 }));
      A.whoosh(6.15, 0.8, { f1: 600, f2: 3600, g: 0.06, pan: 0.2 });
      // link CTA
      A.chord(7.5, [60, 64, 67, 72], { type: 'triangle', dur: 1.6, g: 0.04, a: 0.02, lp: 2600, rev: 0.5, width: 0.8 });
      [88, 91, 96].forEach((m, i) => A.bell(7.95 + i * 0.07, midi(m), { g: 0.035, dur: 0.9, pan: (i - 1) * 0.4 }));
      A.bell(9.0, midi(91), { g: 0.07, dur: 1.4 });
      A.pluck(9.0, midi(84), { g: 0.15, dur: 1.0, rev: 0.4 });
    },
  });

  /* =====================================================================
     MANIFESTO — the brand manifesto film. One idea per line, read by an
     (imagined) voice-over a word to a beat; each line gets its own
     kinetic setting: quiet, then slammed, then pointedly held still, then
     MOTION at full size, then a build in which the words arrive on the
     half-beat over flashing grounds until the last word fills the frame.
     A beat of black and silence, then the sign-off: the Token draws on as
     the emblem, MOTION as the wordmark, the brand line underneath. The VO
     track bottom-right shows the script with each word on its beat.
     ===================================================================== */
  // [time, word, line]
  const MW = [
    [0.5, 'WE', 0], [1.0, 'BELIEVE', 0],
    [1.5, 'IN', 1], [2.0, 'THINGS', 1], [2.5, 'THAT', 1], [3.0, 'MOVE.', 1],
    [3.5, 'STILL', 2], [4.0, 'IS', 2], [4.5, 'SAFE.', 2],
    [5.0, 'MOTION', 3], [5.5, 'IS', 3], [6.0, 'MEANING.', 3],
    [6.5, 'SO', 4], [6.75, 'WE', 4], [7.0, 'MOVE', 4], [7.25, 'FIRST.', 4],
    [8.75, 'MOTION.', 5], [9.1, 'MADE', 5], [9.35, 'TO', 5], [9.6, 'MOVE.', 5],
  ];
  const MF_MEL = [62, 69, 62, 65, 67, 69, 60, 60, 60, 74, 72, 69, 69, 72, 74, 77, 74, 72, 74, 79];
  const MF_LINE0 = [0.5, 1.5, 3.5, 5.0, 6.5, 8.0];
  const MF_BEATS = [
    { t0: 0, t1: 1.5, name: 'Line 1', kind: 'hook' },
    { t0: 1.5, t1: 3.5, name: 'Line 2', kind: 'act' },
    { t0: 3.5, t1: 5, name: 'Line 3', kind: 'act' },
    { t0: 5, t1: 6.5, name: 'Line 4', kind: 'act' },
    { t0: 6.5, t1: 8, name: 'Build', kind: 'turn' },
    { t0: 8, t1: 10, name: 'Sign-off', kind: 'title' },
  ];
  const MF_BG = '#111214', MF_INK = '#ece8df';
  const mfLine = t => (t < 1.5 ? 0 : t < 3.5 ? 1 : t < 5 ? 2 : t < 6.5 ? 3 : t < 8 ? 4 : 5);
  const mfWords = L => MW.filter(w => w[2] === L);

  // lay words out on a row, centred at cx (or left at x0 when left = true); returns [x, w] per word
  function mfRow(c, words, size, cx, left = false, gap = 0.28) {
    const ws = words.map(s => measure(c, s, size)), sp = size * gap;
    const tot = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
    let x = left ? cx : cx - tot / 2;
    return ws.map(w => { const r = [x, w]; x += w + sp; return r; });
  }
  function mfSignoff(c, t) {
    const cx = 960, cy = 410, s = 230;
    if (t < 8.05) return;
    // stroke-on outline
    const d = E.ioC(seg(t, 8.05, 8.45));
    const f = E.outC(seg(t, 8.38, 8.55));
    const bump = 1 + 0.08 * Math.sin(PI * seg(t, 8.5, 8.75));
    c.save(); c.translate(cx, cy); c.scale(bump, bump);
    if (f > 0) { c.save(); c.globalAlpha = f; c.beginPath(); TK.tokenPath(c, s); c.fillStyle = P.accent; c.fill('evenodd'); c.restore(); }
    c.strokeStyle = P.accent; c.lineWidth = 5;
    const po = 4 * s - (8 - 2 * PI) * s * TK.CORNER, ph = TAU * s * TK.HOLE.r, d2 = E.ioC(seg(t, 8.25, 8.5));
    rrect(c, -s / 2, -s / 2, s, s, s * TK.CORNER); c.setLineDash([po * d, po + 10]); c.stroke();
    if (d2 > 0) { c.beginPath(); c.arc(s * TK.HOLE.x, s * TK.HOLE.y, s * TK.HOLE.r, -PI / 2, -PI / 2 + TAU * d2); c.setLineDash([]); c.stroke(); }
    c.restore();
    // wordmark with tracking easing in
    const wa = seg(t, 8.72, 9.0), tr = E.outQn(seg(t, 8.72, 9.5));
    if (wa > 0) TK.word(c, 960, 680, { size: 120, color: MF_INK, alpha: wa, ls: lerp(60, 10, tr) });
    // brand line, word by word with the VO
    const bl = mfWords(5).slice(1), bw = bl.map(w => measure(c, w[1], 30, 700, TK.MONO, 8)), sp = 30;
    let bx = 960 - (bw.reduce((a, b) => a + b, 0) + sp * (bw.length - 1)) / 2;
    bl.forEach((w, i) => {
      const a = E.outC(seg(t, w[0] - 0.02, w[0] + 0.18));
      if (a > 0) { c.save(); c.globalAlpha = a; label(c, w[1], bx, 780, { size: 30, color: P.accent, weight: 700, ls: 8 }); c.restore(); }
      bx += bw[i] + sp;
    });
  }
  function mfType(c, t, L) {
    const ws = mfWords(L), on = w => E.outC(seg(t, w[0] - 0.03, w[0] + 0.14));
    if (L === 0) {
      const row = mfRow(c, ws.map(w => w[1]), 110, 960);
      ws.forEach((w, i) => {
        const a = on(w); if (a <= 0) return;
        c.save(); c.globalAlpha = a;
        text(c, w[1], row[i][0], 540 + (1 - a) * 30, { font: TK.FONT, weight: 900, size: 110, color: MF_INK });
        c.restore();
      });
    } else if (L === 1) {
      const rows = [mfRow(c, ['IN', 'THINGS'], 180, 170, true), mfRow(c, ['THAT', 'MOVE.'], 180, 170, true)];
      ws.forEach((w, i) => {
        if (t < w[0] - 0.02) return;
        const r = rows[i >> 1][i & 1], k = E.outC(seg(t, w[0] - 0.02, w[0] + 0.12)), sc = lerp(1.35, 1, k);
        const y = i < 2 ? 420 : 620, slide = i === 3 ? 60 * E.outB(seg(t, 3.15, 3.45)) : 0;
        const cx = r[0] + r[1] / 2 + slide;
        c.save(); c.globalAlpha = clamp(k * 1.6); c.translate(cx, y - 60); c.scale(sc, sc);
        text(c, w[1], 0, 60, { font: TK.FONT, weight: 900, size: 180, color: i === 3 ? P.accent : MF_INK, align: 'center' });
        c.restore();
      });
    } else if (L === 2) {
      const row = mfRow(c, ws.map(w => w[1]), 160, 960);
      ws.forEach((w, i) => { if (t >= w[0]) text(c, w[1], row[i][0], 560, { font: TK.FONT, weight: 900, size: 160, color: null, stroke: 'rgba(236,232,223,0.6)', lw: 3 }); });
    } else if (L === 3) {
      const m = ws[0], k = E.outQn(seg(t, m[0] - 0.04, m[0] + 0.3));
      if (k > 0) TK.word(c, 960 + (1 - k) * 700, 430, { size: 280, color: P.accent, alpha: clamp(k * 2), ls: 2 });
      const row = mfRow(c, ['IS', 'MEANING.'], 110, 960);
      ws.slice(1).forEach((w, i) => {
        const a = on(w); if (a <= 0) return;
        c.save(); c.globalAlpha = a;
        text(c, w[1], row[i][0], 690 - (1 - a) * 24, { font: TK.FONT, weight: 900, size: 110, color: MF_INK });
        c.restore();
      });
    } else if (L === 4) {
      let i = ws.length - 1; while (i > 0 && t < ws[i][0]) i--;
      const w = ws[i], k = E.outC(seg(t, w[0], w[0] + 0.1));
      const size = [210, 250, 300, 330][i], zoom = i === 3 ? 1 + 7 * E.inC(seg(t, 7.5, 8.0)) : lerp(1.2, 1, k);
      c.save(); c.translate(960, 520); c.scale(zoom, zoom);
      text(c, w[1], 0, 0, { font: TK.FONT, weight: 900, size, color: i % 2 ? P.ink : MF_INK, align: 'center', base: 'middle' });
      c.restore();
    }
  }

  MG.film({
    id: 'formatmanifesto', dur: 10, poster: 6.3,
    fonts,
    meta: {
      family: 'M', name: 'Manifesto', sub: 'What the brand believes, one line at a time', era: '1997 —',
      origin: 'The brand manifesto film is a statement of belief rather than a product demonstration: a voice reads short declarative lines, each one idea, over images or kinetic type, building to the logo and the brand line. Apple’s “Think Different” (TBWA\\Chiat\\Day, 1997), read over portraits of “the crazy ones”, set the template; Nike’s long-running “Just Do It” campaign films and many later brand launches use the same shape. In kinetic-type versions the edit is cut to the reading — a word or a phrase to a beat — so the rhythm of the voice becomes the rhythm of the picture.',
      works: 'Apple, “Think Different” — Here’s to the Crazy Ones (TBWA\\Chiat\\Day, 1997) · Nike, “Just Do It” campaign films (Wieden+Kennedy, 1988 —) · Levi’s, “Go Forth” (Wieden+Kennedy, 2009)',
      tech: ['One idea per line', 'VO-led rhythm: a word per beat', 'Build, silence, sign-off'],
      accent: '#ff5a1f',
      motionDNA: 'The voice sets the clock: a word on every beat at 120 BPM, each line one idea. WE BELIEVE rises quietly; IN THINGS THAT MOVE slams in word by word and MOVE. kicks sideways; STILL IS SAFE. is set in outline and held dead still on purpose; MOTION sweeps in at full width; then the build doubles the rate to the half-beat, flashing the ground with each word, and FIRST. zooms through the lens. A cut to black and silence, then the sign-off: the Token draws on and fills on the beat, the wordmark tracks in, the brand line follows the voice.',
      visualDNA: 'Near-black ground, warm off-white Archivo Black type, the brand orange for the key words, the emblem and the brand line; one line of outline type for the held idea; full-frame orange and paper flashes during the build. A small VO track bottom-right shows the script with each word dotted on the 10 s beat grid.',
      transitions: 'Hard cuts line to line on the beat; slam-ins, a sideways kick, a sweep-on; full-frame colour flashes; a zoom-through into a cut to black',
      implementation: ['After Effects text animators cut to a VO read', 'Premiere / Avid edit locked to the voice track', 'Canvas 2D: a word list timed to beats drives each line’s layout; the emblem strokes on with a line-dash'],
      reproducibility: 'Fully procedural (no recorded voice; the read is implied by the type and the VO track)',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const L = mfLine(t);
      // ground: flashes during the build
      let bg = MF_BG;
      if (L === 4) { let i = 3; while (i > 0 && t < mfWords(4)[i][0]) i--; bg = i % 2 ? P.accent : MF_BG; if (t >= 7.25) bg = P.accent; }
      if (L === 5) bg = '#0b0b0c';
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      if (t < 0.5) {   // in-breath before the first word
        const a = Math.sin(PI * seg(t, 0.05, 0.5));
        c.fillStyle = `rgba(255,90,31,${0.8 * a})`; c.fillRect(960 - 60 * a, 538, 120 * a, 4);
      }
      if (L < 5) mfType(c, t, L); else mfSignoff(c, t);
      const dark = !(L === 4 && bg === P.accent);
      // annotations under the strip
      const notes = [
        'ONE IDEA PER LINE  ·  LINE 1 / 5', 'ONE IDEA PER LINE  ·  LINE 2 / 5', 'HELD STILL ON PURPOSE  ·  LINE 3 / 5',
        'THE NAME, FULL WIDTH  ·  LINE 4 / 5', 'THE BUILD  ·  WORDS ON THE HALF-BEAT', 'SIGN-OFF  ·  EMBLEM + BRAND LINE',
      ];
      const na = t < 0.5 ? seg(t, 0.2, 0.5) : t >= 8 && t < 8.3 ? 0 : 1;
      tag(c, notes[L], 72, 112, na, dark);
      if (t > 7.95 && t < 8.3) label(c, 'SILENCE  ·  ONE BEAT', 960, 548, { align: 'center', size: 16, ls: 4, color: 'rgba(236,232,223,0.5)' });
      // VO track, bottom right
      const vx1 = 1848, vw = 520, vx0 = vx1 - vw, col = dark ? MF_INK : P.ink, mute = dark ? 'rgba(236,232,223,0.42)' : 'rgba(23,24,28,0.5)';
      label(c, 'VO  ·  A WORD PER BEAT', vx1, 952, { align: 'right', size: 13, ls: 3, color: mute });
      const lw = mfWords(L), parts = lw.map(w => w[1]), widths = parts.map(s => measure(c, s, 22, 700, TK.MONO, 2) + 14);
      let xx = vx1 - widths.reduce((a, b) => a + b, 0) + 14;
      lw.forEach((w, i) => { label(c, w[1], xx, 986, { size: 22, ls: 2, weight: 700, color: t >= w[0] ? (i === lw.length - 1 && L === 3 ? P.accent : col) : mute }); xx += widths[i]; });
      const gy = 1018;
      c.fillStyle = mute; c.fillRect(vx0, gy, vw, 1);
      for (let b = 0; b <= 20; b++) c.fillRect(vx0 + vw * b / 20 - 0.5, gy - (b % 4 ? 3 : 6), 1, b % 4 ? 3 : 6);
      MW.forEach(w => {
        const px = vx0 + vw * w[0] / 10, said = t >= w[0], cur = w[2] === L;
        c.fillStyle = said ? (cur ? P.accent : col) : mute;
        c.beginPath(); c.arc(px, gy, cur ? 4.5 : 3, 0, TAU); c.fill();
      });
      c.fillStyle = P.accent; c.fillRect(vx0 + vw * clamp(t / 10) - 1, gy - 12, 2, 24);
      FK.strip(c, t, W, H, MF_BEATS, { label: 'Brand manifesto', dark });
      FK.caption(c, t, W, H, { name: 'Manifesto', cat: 'Social', dark });
    },
    score(A) {
      // a low held pad under the read, cut dead for the silence at 8.0
      A.chord(0, [38, 45, 50, 57], { type: 'sawtooth', dur: 8.0, g: 0.018, a: 1.2, lp: 520, rev: 0.4, width: 0.7, hold: true, rel: 0.04 });
      A.chord(5.0, [41, 48, 53, 60], { type: 'triangle', dur: 3.0, g: 0.02, a: 0.4, lp: 1400, rev: 0.4, width: 0.7, hold: true, rel: 0.04 });
      MW.forEach(([t, , L], i) => {
        if (L === 5) return;
        A.kick(t, L === 2 ? 0.12 : L === 4 ? 0.36 : 0.28, { f: 100, f2: 40 });
        A.pluck(t, midi(MF_MEL[i]), { g: L === 2 ? 0.08 : 0.15, bright: 0.45, dur: L === 2 ? 1.4 : 0.9, lp: 2600, rev: 0.35 });
        if (L === 1 || L === 3) A.osc(t, { type: 'triangle', f: midi(MF_MEL[i] - 24), dur: 0.4, g: 0.08 });
      });
      A.impact(3.0, 0.22);
      A.whoosh(4.92, 0.4, { f1: 300, f2: 2800, g: 0.09, pan: 0.4 });
      // the build
      A.riser(6.5, 1.5, { g: 0.13, f: 80 });
      for (let k = 0; k < 12; k++) A.snare(6.5 + k * 0.125, 0.05 + 0.11 * k / 12, { dur: 0.08 });
      A.whoosh(7.5, 0.5, { f1: 200, f2: 6000, g: 0.12, swell: 0.95 });
      // silence 8.0–8.05, then the sign-off
      A.osc(8.05, { type: 'sine', f: midi(86), dur: 0.4, g: 0.03, a: 0.3, rev: 0.5 });
      A.impact(8.5, 0.42);
      A.chord(8.5, [50, 57, 62, 66, 69], { type: 'triangle', dur: 1.5, g: 0.04, a: 0.02, lp: 2600, rev: 0.6, width: 0.8 });
      [[8.75, 74], [9.1, 78], [9.35, 81], [9.6, 86]].forEach(([t, m]) => A.bell(t, midi(m), { g: 0.06, dur: 1.4, rev: 0.5 }));
    },
  });
})();
