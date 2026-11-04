/* batch m8 — Narrative Formats · Advertising, Explainer: formatpreroll · formatsale · formatlisticle.
   formatpreroll (a skippable pre-roll in a video player: the brand on screen from the first frame
   and the whole pitch inside the five unskippable seconds, the 'Skip ad in 5…' box that unlocks at
   5 s, a cursor that hovers over SKIP AD and stays, then a payoff and a call to action written only
   for the stayers — with a 100-viewer audience grid emptying at the skip line) ·
   formatsale (a sale countdown: a slammed 40 % OFF that shrinks to a badge, the anchor price struck
   through to the sale price, stacked offers, a live 'only N left' stock bar draining, a ticking
   HH:MM:SS clock, SHOP NOW and the small print, with urgency rising on the caption graph) ·
   formatlisticle (a top-5 countdown: the tease '…and #1 might surprise you', numbered cards from
   #5 to #2 that each stay a little longer than the last, progress dots, a drumroll, and #1 —
   the original Token — held longest). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, midi, text, rng, rrect } = MG;
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
  const win = (t, a, b, f = 0.2) => clamp(Math.min(seg(t, a, a + f), 1 - seg(t, b - f, b)));
  /* A convention annotation: small accent tick + bold mono label. */
  function note(c, s, x, y, on = 1, o = {}) {
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    const al = o.align || 'left', dx = al === 'right' ? -1 : 1;
    c.fillStyle = o.tick || P.accent; c.fillRect(al === 'right' ? x - 4 : x, y - 12, 4, 13);
    label(c, s, x + dx * 13, y, { align: al, color: o.color || P.ink, weight: 700, size: o.size || 15, ls: o.ls ?? 2.5 });
    c.restore();
  }
  /* Mouse pointer with its tip at x,y; press 0..1 shrinks it a little. */
  function cursor(c, x, y, a = 1, press = 0) {
    if (a <= 0.01) return;
    c.save(); c.globalAlpha *= a; c.translate(x, y);
    const k = 1.5 * (1 - 0.12 * press); c.scale(k, k);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 24); c.lineTo(6, 18.5); c.lineTo(10.5, 28); c.lineTo(14, 26.4); c.lineTo(9.8, 17.4); c.lineTo(17.5, 17.4); c.closePath();
    c.fillStyle = '#fff'; c.fill(); c.lineJoin = 'round'; c.lineWidth = 1.6; c.strokeStyle = P.ink; c.stroke();
    c.restore();
  }
  const pill = (c, x, y, w, h) => rrect(c, x, y, w, h, h / 2);
  const FONTS = [...FK.fonts, [`500 30px ${TK.FONT}`, 'Drag it.'], [`700 18px ${TK.MONO}`, 'SKIP AD'], [`900 64px ${TK.FONT}`, '40% OFF']];

  /* =====================================================================
     SKIPPABLE PRE-ROLL — the ad plays inside a video player. The frame is
     the format: the 'Ad · 0:07' badge, the yellow ad progress bar, and the
     skip box counting 'Skip ad in 5…4…' until it unlocks as SKIP AD at
     5 s. Everything the advertiser must say — brand, product, the one line
     — happens before that skip line, because most viewers leave on it (the
     100-viewer grid on the right empties as the button appears). A cursor
     hovers on SKIP AD… and stays; the second half is written for stayers:
     'Still here?', a payoff, and an end card with an offer for watching.
     ===================================================================== */
  const PRB = [
    { t0: 0, t1: 1.5, name: 'Hook · brand', kind: 'hook' },
    { t0: 1.5, t1: 5, name: 'Whole pitch', kind: 'act' },
    { t0: 5, t1: 5.5, name: 'Skip', kind: 'turn' },
    { t0: 5.5, t1: 8.5, name: 'Stayer payoff', kind: 'title' },
    { t0: 8.5, t1: 10, name: 'CTA', kind: 'cta' },
  ];
  const PL = { x: 100, y: 104, w: 1280, h: 720 }, YEL = '#ffcc00', SKIP = 5;
  const SKBOX = { w: 262, h: 68 };
  SKBOX.x = PL.x + PL.w - SKBOX.w; SKBOX.y = PL.y + PL.h - 148;
  // share of the audience still watching (illustrative): a trickle before the skip line, most leave on it
  const prRet = t => t < SKIP ? 1 - 0.03 * t / SKIP : t < 6.4 ? lerp(0.97, 0.3, E.outC(seg(t, SKIP, 6.4))) : lerp(0.3, 0.27, seg(t, 6.4, 10));
  const PR_RANK = (() => {
    const r = rng(808), idx = [...Array(100).keys()].map(i => [r(), i]).sort((a, b) => a[0] - b[0]), rank = [];
    idx.forEach(([, i], k) => { rank[i] = k; });
    return rank;
  })();
  const PR_HOP = [500, 960, 1420, 960];
  function prProduct(t) {   // the hopping product Token during the pitch (video coords)
    if (t < 2.0) { const m = E.ioC(seg(t, 1.5, 2.0)); return { x: lerp(470, PR_HOP[0], m), y: lerp(560, 710, m), s: lerp(300, 180, m), rot: 0, sq: 0, hy: 0 }; }
    const k = Math.min(2, Math.floor(t - 2.0)), u = clamp(t - 2.0 - k), dir = PR_HOP[k + 1] > PR_HOP[k] ? 1 : -1;
    const ex = E.ioC(u), hy = Math.sin(PI * u) * 210;
    const sq = u < 0.12 ? 0.2 * (1 - u / 0.12) : u > 0.9 ? 0.2 * ((u - 0.9) / 0.1) : -0.07 * Math.sin(PI * u);
    return { x: lerp(PR_HOP[k], PR_HOP[k + 1], ex), y: 710 - hy + 90 * Math.max(0, sq), s: 180, rot: dir * TAU / 4 * ex, sq, hy };
  }
  function prBug(c, a) {   // brand bug, top-left of the video
    if (a <= 0.01) return;
    c.save(); c.globalAlpha *= a;
    TK.token(c, 104, 96, 50);
    text(c, 'MOTION', 146, 113, { font: TK.FONT, weight: 900, size: 46, ls: 3, color: P.ink });
    c.restore();
  }
  /* The ad itself, drawn on a virtual 1920×1080 frame that the player scales down. */
  function prVideo(c, t, W, H) {
    if (t < 1.5) {
      TK.stage(c, W, H);
      // the brand is in the very first frame: wordmark already up, the Token slams in beside it
      const land = seg(t, 0, 0.2), sq = t > 0.2 ? Math.exp(-(t - 0.2) * 11) * 0.26 : 0, ty = lerp(-180, 560, E.inQ(land));
      const m = E.ioC(seg(t, 1.25, 1.5));
      TK.shadow(c, 470, 712, 300, Math.max(0, 560 - ty));
      TK.token(c, 470, ty + 150 * sq, 300, { sx: 1 + sq, sy: 1 - sq });
      const punch = 1 + 0.06 * (1 - E.outC(seg(t, 0.2, 0.45)));
      c.save(); c.translate(lerp(1230, 290, m), lerp(560, 96, m)); c.scale(punch * lerp(1, 0.22, m), punch * lerp(1, 0.22, m));
      TK.word(c, 0, 0, { size: 200, ls: 6 }); c.restore();
      c.save(); c.globalAlpha = 1 - m;
      text(c, 'Before you skip —', 960, 290, { font: TK.FONT, weight: 900, size: 84, color: P.ink, align: 'center' });
      text(c, 'this is MOTION.', 960, 860, { font: TK.FONT, weight: 800, size: 60, color: P.accentD, align: 'center', });
      c.restore();
      return;
    }
    if (t < SKIP) {
      TK.stage(c, W, H, { floor: 800 });
      prBug(c, 1);
      const ha = seg(t, 1.55, 1.85);
      c.save(); c.globalAlpha = ha;
      text(c, 'Easing for every shape.', 960, 300 + 20 * (1 - E.outC(ha)), { font: TK.FONT, weight: 900, size: 104, color: P.ink, align: 'center' });
      c.restore();
      const sa = seg(t, 2.6, 2.9);
      if (sa > 0) text(c, 'Drag it. Drop it. It eases.', 960, 386, { font: TK.FONT, weight: 500, size: 50, color: `rgba(23,24,28,${0.7 * sa})`, align: 'center' });
      for (let j = 4; j >= 1; j--) {   // ghost trail
        const g = prProduct(t - j * 0.05); if (t - j * 0.05 < 2.0) continue;
        TK.token(c, g.x, g.y, g.s, { rot: g.rot, alpha: 0.1 });
      }
      const p = prProduct(t);
      TK.shadow(c, p.x, 800, p.s, p.hy);
      TK.token(c, p.x, p.y, p.s, { rot: p.rot, sx: 1 + p.sq, sy: 1 - p.sq });
      return;
    }
    if (t < 5.5) {
      TK.stage(c, W, H);
      prBug(c, 1);
      const k = E.outB(seg(t, SKIP - 0.06, SKIP + 0.16));   // already popping on the cut frame
      c.save(); c.translate(960, 520); c.scale(k, k);
      text(c, 'Still here?', 0, 0, { font: TK.FONT, weight: 900, size: 190, color: P.accentD, align: 'center', base: 'middle' });
      c.restore();
      TK.token(c, 960, lerp(1000, 800, E.outB(seg(t, 5.1, 5.35))), 150, { rot: -0.2 });
      return;
    }
    if (t < 8.5) {
      // the payoff: only stayers see this
      TK.stage(c, W, H);
      const g = c.createRadialGradient(960, 640, 60, 960, 640, 900); g.addColorStop(0, 'rgba(255,138,92,0.30)'); g.addColorStop(1, 'rgba(255,138,92,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      prBug(c, 1);
      const la = seg(t, 5.42, 5.68);
      c.save(); c.globalAlpha = la;
      text(c, 'Good. This part is just for you.', 960, 230, { font: TK.FONT, weight: 800, size: 66, color: P.ink, align: 'center' });
      c.restore();
      const open = E.outB(seg(t, 5.42, 5.97)), close = E.inC(seg(t, 7.5, 7.9)), R = 300 * open * (1 - close);
      if (t < 7.95) {
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * TAU + (t - 5.6) * 1.5, x = 960 + Math.cos(a) * R * 1.25, y = 640 + Math.sin(a) * R * 0.82;
          for (let j = 3; j >= 1; j--) { const a2 = a - j * 0.09; TK.token(c, 960 + Math.cos(a2) * R * 1.25, 640 + Math.sin(a2) * R * 0.82, 110, { rot: (t - j * 0.04) * 4 + i, alpha: 0.08, color: i % 4 === 3 ? P.blue : P.accent }); }
          TK.token(c, x, y, 110 * lerp(1, 0.6, close), { rot: t * 4 + i, color: i % 4 === 3 ? P.blue : i % 2 ? P.accentL : P.accent });
        }
      }
      const big = E.outB(seg(t, 7.9, 8.15));
      if (t >= 7.9) {
        const bu = t - 7.9;
        c.strokeStyle = `rgba(255,90,31,${0.6 * Math.exp(-bu * 3)})`; c.lineWidth = 6;
        for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, r0 = 220 + bu * 500, r1 = r0 + 90; c.beginPath(); c.moveTo(960 + Math.cos(a) * r0, 640 + Math.sin(a) * r0); c.lineTo(960 + Math.cos(a) * r1, 640 + Math.sin(a) * r1); c.stroke(); }
        TK.token(c, 960, 640, 340 * big, { rot: (1 - big) * PI });
      }
      return;
    }
    // end card
    c.fillStyle = P.ground; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(960, 460, 40, 960, 460, 900); g.addColorStop(0, '#fff7ee'); g.addColorStop(1, P.ground);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const tt = t - 8.5, inA = E.outB(seg(tt, -0.08, 0.22));   // the end card lands on the cut frame
    TK.token(c, 560, 420, 210 * inA, { rot: (1 - inA) * 0.8 });
    TK.word(c, 1180, 420, { size: 180, ls: 6, alpha: seg(tt, -0.06, 0.14) });
    const la = seg(tt, 0.2, 0.45);
    text(c, 'Two months free — for staying.', 960, 620, { font: TK.FONT, weight: 800, size: 60, color: `rgba(23,24,28,${la})`, align: 'center' });
    const ca = seg(tt, 0.35, 0.6), pul = 1 + 0.035 * Math.max(0, Math.sin((tt - 0.6) * TAU * 1.5)) * seg(tt, 0.6, 0.8);
    if (ca > 0) {
      c.save(); c.globalAlpha = ca; c.translate(960, 760); c.scale(pul, pul);
      c.fillStyle = P.accent; pill(c, -230, -50, 460, 100); c.fill();
      text(c, 'LEARN MORE  →', 0, 15, { font: TK.FONT, weight: 900, size: 42, ls: 3, color: P.ground, align: 'center' });
      c.restore();
    }
    text(c, 'motion.example', 960, 880, { font: TK.MONO, weight: 700, size: 26, ls: 3, color: `rgba(143,138,128,${ca})`, align: 'center' });
  }
  /* Player chrome on top of the ad: scrim, yellow ad progress bar, controls, Ad badge, skip box. */
  function prChrome(c, t) {
    const { x, y, w, h } = PL, by = y + h;
    const g = c.createLinearGradient(0, by - 130, 0, by); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
    c.fillStyle = g; c.fillRect(x, by - 130, w, 130);
    // progress
    c.fillStyle = 'rgba(255,255,255,0.32)'; c.fillRect(x, by - 7, w, 7);
    c.fillStyle = YEL; c.fillRect(x, by - 7, w * clamp(t / 10), 7);
    // controls: pause, next, volume, time
    c.fillStyle = '#fff';
    c.fillRect(x + 26, by - 44, 7, 24); c.fillRect(x + 39, by - 44, 7, 24);
    c.beginPath(); c.moveTo(x + 70, by - 44); c.lineTo(x + 88, by - 32); c.lineTo(x + 70, by - 20); c.closePath(); c.fill(); c.fillRect(x + 89, by - 44, 4, 24);
    c.beginPath(); c.moveTo(x + 116, by - 38); c.lineTo(x + 124, by - 38); c.lineTo(x + 134, by - 46); c.lineTo(x + 134, by - 18); c.lineTo(x + 124, by - 26); c.lineTo(x + 116, by - 26); c.closePath(); c.fill();
    text(c, `0:${String(Math.floor(t)).padStart(2, '0')} / 0:10`, x + 158, by - 25, { font: TK.MONO, weight: 700, size: 17, color: '#fff' });
    // Ad badge with the remaining ad time, and the advertiser link
    const rem = Math.max(0, Math.ceil(10 - t - 1e-6));
    c.fillStyle = 'rgba(0,0,0,0.62)'; pill(c, x + 20, by - 98, 172, 36); c.fill();
    text(c, 'Ad', x + 38, by - 73, { font: TK.FONT, weight: 900, size: 20, color: YEL });
    text(c, `·  0:${String(rem).padStart(2, '0')}`, x + 72, by - 73, { font: TK.MONO, weight: 700, size: 18, color: '#fff' });
    text(c, 'motion.example  ↗', x + 210, by - 73, { font: TK.MONO, weight: 700, size: 17, color: 'rgba(255,255,255,0.9)' });
    // skip box
    const { x: sx, y: sy, w: sw, h: sh } = SKBOX;
    if (t < SKIP) {
      c.fillStyle = 'rgba(0,0,0,0.64)'; c.fillRect(sx, sy, sw, sh);
      // thumbnail of the ad
      c.fillStyle = P.ground; c.fillRect(sx + 10, sy + 9, 88, 50);
      TK.token(c, sx + 54, sy + 34, 26);
      const n = Math.ceil(SKIP - t - 1e-6), fr = (SKIP - t) % 1;
      text(c, 'Skip ad in', sx + 112, sy + 42, { font: TK.FONT, weight: 500, size: 21, color: 'rgba(255,255,255,0.85)' });
      text(c, String(Math.max(1, n)), sx + 226, sy + 45, { font: TK.MONO, weight: 700, size: 30, color: '#fff', align: 'center' });
      c.strokeStyle = YEL; c.lineWidth = 3; c.beginPath(); c.arc(sx + 226, sy + 34, 21, -PI / 2, -PI / 2 + TAU * (fr || 1)); c.stroke();
    } else {
      const pop = 1 + 0.12 * (1 - E.outC(seg(t, SKIP, SKIP + 0.25))), hover = win(t, 4.92, 5.78, 0.08);
      c.save(); c.translate(sx + sw / 2, sy + sh / 2); c.scale(pop, pop); c.translate(-sx - sw / 2, -sy - sh / 2);
      c.fillStyle = hover > 0 ? `rgba(60,60,60,${0.7 + 0.2 * hover})` : 'rgba(0,0,0,0.7)'; c.fillRect(sx, sy, sw, sh);
      c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2; c.strokeRect(sx + 1, sy + 1, sw - 2, sh - 2);
      text(c, 'SKIP AD', sx + 46, sy + 44, { font: TK.FONT, weight: 900, size: 26, ls: 2, color: '#fff' });
      c.fillStyle = '#fff'; c.beginPath(); c.moveTo(sx + 186, sy + 22); c.lineTo(sx + 206, sy + 34); c.lineTo(sx + 186, sy + 46); c.closePath(); c.fill();
      c.fillRect(sx + 208, sy + 22, 5, 24);
      c.restore();
    }
    // the skip line on the progress bar
    const mx = x + w * SKIP / 10;
    c.save(); c.strokeStyle = P.accent; c.lineWidth = 2.5; c.setLineDash([5, 5]);
    c.beginPath(); c.moveTo(mx, by - 30); c.lineTo(mx, by + 26); c.stroke(); c.restore();
  }
  function person(c, x, y, col) {
    c.fillStyle = col;
    c.beginPath(); c.arc(x, y - 8, 6.5, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(x, y + 10, 11.5, 9, 0, PI, TAU); c.fill();
  }
  function prAudience(c, t) {
    const x0 = 1474, y0 = 196, sp = 38;
    label(c, 'AUDIENCE  ·  100 VIEWERS', 1460, 140, { size: 15, ls: 2.5, color: P.ink, weight: 700 });
    label(c, 'ILLUSTRATIVE', 1460, 164, { size: 12, ls: 2, color: P.mute });
    const n = prRet(t) * 100, stay = seg(t, 6.0, 6.5);
    for (let i = 0; i < 100; i++) {
      const px = x0 + (i % 10) * sp + 12, py = y0 + Math.floor(i / 10) * sp + 12;
      const a = clamp(n - PR_RANK[i]);
      person(c, px, py, 'rgba(23,24,28,0.10)');
      if (a > 0) { c.save(); c.globalAlpha = a; person(c, px, py, stay > 0.5 ? P.accent : P.ink); c.restore(); }
    }
    label(c, t < SKIP ? 'STILL WATCHING' : t < 6.4 ? 'SKIPPING…' : 'STAYERS', 1460, 606, { size: 14, ls: 2.5, color: t >= SKIP && t < 6.4 ? P.accentD : P.mute, weight: 700 });
    text(c, String(Math.round(n)), 1458, 672, { font: TK.FONT, weight: 900, size: 64, color: stay > 0.5 ? P.accentD : P.ink });
    // who sees what
    const rows = [['0–5 s  ·  EVERYONE', 'brand + the whole pitch', t < SKIP], ['5–10 s  ·  STAYERS ONLY', 'payoff + offer + CTA', t >= SKIP]];
    rows.forEach(([a, b, on], k) => {
      const ry = 724 + k * 58;
      c.fillStyle = on ? P.accent : 'rgba(23,24,28,0.2)'; c.fillRect(1460, ry - 13, 4, 36);
      label(c, a, 1476, ry, { size: 14, ls: 2, color: on ? P.ink : P.mute, weight: 700 });
      label(c, b, 1476, ry + 21, { size: 13, ls: 1, color: P.mute });
    });
  }
  MG.film({
    id: 'formatpreroll', dur: 10, poster: 6.5,
    fonts: FONTS,
    meta: {
      family: 'M', name: 'Skippable Pre-roll', sub: 'Brand before the skip, a payoff for stayers', era: '2010 —',
      origin: 'Pre-roll — the video ad that plays before the clip a viewer chose — spread with online video in the late 2000s. In 2010 YouTube introduced TrueView in-stream ads, which can be skipped after five seconds and which the advertiser pays for only when the viewer watches 30 seconds (or the whole of a shorter ad) or clicks. The skip line rewrote the structure of the spot: brand and hook front-loaded into the five unskippable seconds, the rest written as a reward for the people who stay. GEICO’s “Unskippable” (The Martin Agency, 2015) made the whole ad fit before the button and won the Film Grand Prix at Cannes Lions.',
      works: 'GEICO “Unskippable” (The Martin Agency, 2015) · YouTube TrueView in-stream ads (2010 —) · Google’s ABCD guidelines for YouTube ads (Attract, Brand, Connect, Direct)',
      tech: ['Brand and the whole pitch inside the unskippable 5 s', 'The player is the frame: Ad badge, yellow bar, skip box', 'Second half written as a payoff for stayers'],
      accent: '#ff5a1f',
      motionDNA: 'No fade in: frame one already holds the MOTION wordmark as the Token slams down beside it; the lockup shrinks to a brand bug at 1.5 s and the Token hops the one-line pitch on the beat while the skip box counts 5-4-3-2-1; at 5 s it pops into SKIP AD, the audience grid empties, a cursor hovers… and leaves; ‘Still here?’, then a ring of Tokens orbits and collapses into one big Token for the stayers; the end card lands at 8.5 s with the offer and LEARN MORE.',
      visualDNA: 'A dark video-player frame on the paper stage: the ad inside on the Technique Atlas ground, with a bottom scrim, white transport icons, a yellow ad progress bar, a black ‘Ad · 0:07’ pill and the classic skip box with a thumbnail. An orange dashed skip line on the progress bar. To the right a 10 × 10 grid of viewer icons that greys out at the skip line and turns orange for the stayers.',
      transitions: 'Lockup shrinks into a brand bug; hard cuts inside the ad on the skip line and into the payoff; skip box pops from countdown to button; the end card scales in',
      implementation: ['Edit to the platform’s skip point: brand in shot 1, message complete by 0:05', 'Second half cut as a reward cut-down; CTA overlay and end screen in the ad platform', 'Canvas 2D: the ad drawn on a virtual 1920 × 1080 frame scaled into a player mock'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      const { x, y, w, h } = PL;
      c.fillStyle = 'rgba(23,24,28,0.16)'; rrect(c, x + 8, y + 14, w, h, 14); c.fill();
      c.save(); rrect(c, x, y, w, h, 14); c.clip();
      c.save(); c.translate(x, y); c.scale(w / W, h / H); prVideo(c, t, W, H); c.restore();
      prChrome(c, t);
      c.restore();
      c.strokeStyle = P.ink; c.lineWidth = 2; rrect(c, x, y, w, h, 14); c.stroke();
      // the choice: a cursor goes for SKIP AD… and stays
      const sx = SKBOX.x + 130, sy = SKBOX.y + 40;
      if (t > 4.2 && t < 6.9) {
        const go = E.ioC(seg(t, 4.2, 4.9)), off = E.ioC(seg(t, 5.8, 6.4));
        const cx = lerp(lerp(1150, sx, go), 1040, off), cy = lerp(lerp(560, sy, go), 500, off);
        cursor(c, cx, cy, 1 - seg(t, 6.5, 6.9));
        note(c, 'THE CHOICE  ·  SKIP OR STAY', SKBOX.x + SKBOX.w - 12, SKBOX.y - 18, win(t, 4.9, 5.8, 0.15), { align: 'right' });
        note(c, 'THIS ONE STAYS', 1040 + 40, 560, win(t, 5.9, 6.9, 0.15));
      }
      // annotations under the player
      const by = y + h + 46;
      note(c, 'BRAND ON SCREEN FROM FRAME 1', x, by, t < 1.5 ? 1 - seg(t, 1.35, 1.5) : 0);
      note(c, 'THE WHOLE PITCH FITS BEFORE THE SKIP', x, by, win(t, 1.5, SKIP, 0.15));
      note(c, 'MOST VIEWERS LEAVE HERE', x, by, win(t, SKIP, 5.5, 0.1));
      note(c, 'STAYER PAYOFF  ·  A REWARD, NOT A RECAP', x, by, win(t, 5.5, 8.5, 0.15));
      note(c, 'CTA  ·  OFFER + CLICK-THROUGH', x, by, win(t, 8.5, 10.2, 0.15));
      label(c, 'SKIP LINE  ·  0:05', x + w / 2 + 10, by, { size: 15, ls: 2.5, color: t >= SKIP ? P.accentD : P.ink, weight: 700 });
      prAudience(c, t);
      FK.strip(c, t, W, H, PRB, { label: 'Pre-roll · skippable after 5 s' });
      FK.caption(c, t, W, H, { name: 'Skippable Pre-roll', cat: 'Advertising', curve: u => prRet(u * 10), span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'VIEWERS STILL WATCHING' });
    },
    score(A) {
      // frame one: the slam and the brand chord, no intro
      A.chord(0, [60, 64, 67, 72], { type: 'sawtooth', dur: 0.6, g: 0.035, a: 0.004, lp: 3200, rev: 0.4, width: 0.8 });
      A.bell(0, midi(84), { g: 0.08, dur: 1.0, rev: 0.5 });
      A.impact(0.2, 0.45, { rev: 0.4 });
      A.kick(0.2, 0.4, { f: 140, f2: 45 });
      // the pitch groove, 120 BPM, bright and front-loaded
      const bass = [48, 48, 45, 45, 41, 41, 43, 43];
      const mel = [72, 76, 79, 76, 77, 81, 79, 77, 76, 79, 84, 79, 77, 74, 72, 74];
      for (let b = 0; b < 9; b++) {
        const t = 0.5 + b * 0.5; if (t >= SKIP) break;
        A.kick(t, 0.3, { f: 120, f2: 45 }); A.hat(t + 0.25, 0.04);
        if (b % 2) A.clap(t, 0.12);
        A.osc(t, { type: 'triangle', f: midi(bass[b % 8] - 12), dur: 0.45, g: 0.13, a: 0.005 });
        if (t >= 1.5) { A.pluck(t, midi(mel[(b * 2) % 16]), { g: 0.12, bright: 0.75, dur: 0.45, pan: -0.15 }); A.pluck(t + 0.25, midi(mel[(b * 2 + 1) % 16]), { g: 0.1, bright: 0.75, dur: 0.45, pan: 0.15 }); }
      }
      A.whoosh(1.3, 0.3, { f1: 600, f2: 3000, g: 0.06 });
      // the hops land on the beat
      [3.0, 4.0].forEach(t => { A.osc(t - 0.9, { f: 300, f2: 620, glide: 0.4, dur: 0.45, g: 0.04 }); A.kick(t, 0.18, { f: 220, f2: 90, dur: 0.12 }); });
      // the skip box counts down: a soft UI tick on every number
      [1, 2, 3, 4].forEach(t => A.osc(t, { f: 2400, dur: 0.03, g: 0.05, pan: 0.5 }));
      // 5 s: the button unlocks — the music drops out under 'Still here?'
      A.osc(SKIP, { f: 660, f2: 1320, glide: 0.08, dur: 0.16, g: 0.08, pan: 0.5 });
      A.noise(SKIP, { type: 'highpass', f: 4000, dur: 0.04, g: 0.06 });
      A.osc(SKIP, { f: midi(36), dur: 0.5, g: 0.06, a: 0.05 });
      A.bell(5.1, midi(79), { g: 0.06, dur: 0.6, rev: 0.6 });
      A.bell(5.3, midi(83), { g: 0.05, dur: 0.5, rev: 0.6 });
      // the payoff: the groove comes back fuller, an arpeggio for the orbiting ring
      const pay = [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59], [48, 55, 64], [45, 52, 60]];
      for (let b = 0; b < 6; b++) {
        const t = 5.5 + b * 0.5, ch = pay[b];
        A.kick(t, 0.36, { f: 125, f2: 45 }); A.hat(t + 0.25, 0.05); A.hat(t + 0.125, 0.025); A.hat(t + 0.375, 0.025);
        if (b % 2) A.clap(t, 0.16);
        A.osc(t, { type: 'triangle', f: midi(ch[0] - 12), dur: 0.45, g: 0.15, a: 0.005 });
        A.chord(t, ch.map(m => m + 12), { type: 'triangle', dur: 0.48, g: 0.022, a: 0.02, lp: 2400, rev: 0.4, width: 0.7 });
        for (let k = 0; k < 4; k++) A.pluck(t + k * 0.125, midi(ch[k % 3] + 24), { g: 0.07, bright: 0.85, dur: 0.3, pan: (k % 2 ? 0.3 : -0.3) });
      }
      A.riser(6.9, 1.0, { g: 0.08, f: 220 });
      A.impact(7.9, 0.4, { rev: 0.5 });
      A.chord(7.9, [48, 55, 64, 67, 72], { type: 'sawtooth', dur: 0.6, g: 0.025, a: 0.01, lp: 2600, rev: 0.5, width: 0.8 });
      // end card: a three-note sonic tag
      [[8.5, 72], [8.7, 76], [8.9, 79]].forEach(([t, m], i) => { A.pluck(t, midi(m), { g: 0.18, bright: 0.85, dur: i === 2 ? 1.2 : 0.5, rev: 0.4 }); A.bell(t, midi(m + 12), { g: 0.04, dur: 0.6 }); });
      A.chord(8.9, [48, 55, 60, 64, 67], { type: 'triangle', dur: 1.05, g: 0.03, a: 0.02, lp: 2400, rev: 0.6, width: 0.8 });
      A.kick(8.5, 0.28, { f: 110, f2: 40 });
    },
  });

  /* =====================================================================
     SALE COUNTDOWN — the urgency promo. Five beats on the bars: the offer
     (40 % OFF slammed full-frame, then shrunk to a starburst badge), the
     price (the anchor $50 struck through, $30 popping in, the saving
     spelled out, offers stacked on top), scarcity (ONLY N LEFT, a stock
     bar draining, a live viewer count), the deadline (a ticking HH:MM:SS
     clock whose seconds flash on the beat) and the CTA (SHOP NOW, a click
     and the T&Cs in the small print). Every element stays once it lands,
     so the last frame is the whole stacked ad; urgency rises on the graph.
     ===================================================================== */
  const SLB = [
    { t0: 0, t1: 2, name: 'The offer', kind: 'hook' },
    { t0: 2, t1: 4, name: 'The price', kind: 'act' },
    { t0: 4, t1: 6, name: 'Scarcity', kind: 'turn' },
    { t0: 6, t1: 8, name: 'Deadline', kind: 'act' },
    { t0: 8, t1: 10, name: 'CTA', kind: 'cta' },
  ];
  const SX = 900, SX1 = 1848;
  const STOCK = [[4.45, 11], [4.8, 9], [5.15, 7], [5.5, 5], [5.85, 4], [6.9, 3], [8.3, 2]];
  const stockN = t => STOCK.reduce((s, [a, v]) => (t >= a ? v : s), 12);
  const stockF = t => STOCK.reduce((s, [a, v], i) => s - ((i ? STOCK[i - 1][1] : 12) - v) * E.outC(seg(t, a, a + 0.3)), 12);
  const saleClock = t => {
    const rem = 3 * 3600 - t, h = Math.floor(rem / 3600), m = Math.floor((rem % 3600) / 60), s = Math.floor(rem % 60), cs = Math.floor((rem % 1) * 100);
    return [h, m, s, cs].map(v => String(v).padStart(2, '0'));
  };
  const SALE_URG = [[0, 0.15], [2, 0.3, E.outC], [4, 0.45, E.outC], [6, 0.72, E.outC], [8, 0.92, E.outC], [10, 1.0]];
  function starburst(c, x, y, r0, r1, n, rot) {
    c.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = rot + i / (n * 2) * TAU, r = i % 2 ? r0 : r1; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
    c.closePath();
  }
  function saleHead(c, s, y, t, a, b, show = a) {   // block header: the beat's convention, bold while its beat plays
    const on = seg(t, show - 0.1, show + 0.15); if (on <= 0) return;
    const cur = t >= a && t < b;
    note(c, s, SX, y, on, { color: cur ? P.accentD : P.ink, tick: cur ? P.accent : 'rgba(23,24,28,0.35)', size: 14 });
  }
  function saleBanner(c, t, W) {
    c.fillStyle = P.ink; c.fillRect(0, 66, W, 40);
    const [h, m, s] = saleClock(t), str = `FLASH SALE   ·   40% OFF EVERYTHING   ·   ENDS IN ${h}:${m}:${s}   ·   `;
    const w = measure(c, str, 17, 700, TK.MONO, 3), off = (t * 140) % w;
    for (let k = -1; k < Math.ceil(W / w) + 1; k++) text(c, str, k * w - off, 92, { font: TK.MONO, weight: 700, size: 17, ls: 3, color: k % 2 ? P.ground : '#ffd9c7' });
  }
  MG.film({
    id: 'formatsale', dur: 10, poster: 9.7,
    fonts: FONTS,
    meta: {
      family: 'M', name: 'Sale Countdown', sub: 'Offer, anchor price, scarcity, deadline, CTA', era: '1900s — · online 2000s —',
      origin: 'Sale advertising is as old as the department store, and its devices have names. The struck-through original price is an anchor — Tversky and Kahneman described anchoring in 1974 — and limited stock and a closing deadline are the scarcity principle Robert Cialdini set out in Influence (1984). E-commerce made both live: deal-a-day sites such as Woot (2004) and Amazon’s Lightning Deals put a ticking clock and a claimed-stock bar beside the price, and shopping events such as Black Friday and Amazon Prime Day (first held on 15 July 2015) turned the countdown into the whole ad, with the conditions in the small print at the end.',
      works: 'Amazon Prime Day Lightning Deals (2015 —) · Woot deal-a-day (2004 —) · Black Friday doorbuster ads (US retail)',
      tech: ['Anchor price struck through, the saving spelled out', 'Scarcity: a live stock count and a draining bar', 'Deadline clock, one-verb CTA, T&Cs in the small print'],
      accent: '#ff5a1f',
      motionDNA: 'Every element lands on a bar line and stays: 40 % OFF slams in at frame one and shrinks to a spinning starburst at 2 s; the anchor price strikes through and the sale price pops at 2.8 s; three offers stack on the half beats; the stock count drops in jolts from 12 to 2 with the bar draining; from 6 s the clock’s seconds box flashes on every tick; SHOP NOW pulses and is clicked at 9 s.',
      visualDNA: 'Paper stage with a black scrolling FLASH SALE ticker; a big orange panel with diagonal stripes holding the Token as the product and an ink starburst badge; the right column stacks heavy Archivo prices, pill-shaped offer tags, a stock bar that turns orange when low, ink digit boxes and an orange CTA pill. Small grey T&Cs at the bottom; urgency plotted on the caption graph.',
      transitions: 'Slam-in, shrink-to-badge, strike-through draw, pop-ins on the beat; nothing ever leaves',
      implementation: ['Retail promo template in After Effects or a DCO ad tool, price and stock fields fed from a product feed', 'Countdown timer bound to the sale end time', 'Canvas 2D: one accumulating layout, keyframed reveals, stock and clock as functions of time'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      saleBanner(c, t, W);
      // the orange panel: full width for the offer, then the product's half
      const sh = E.ioC(seg(t, 2.0, 2.45)), px1 = lerp(SX1, 820, sh);
      c.save(); rrect(c, 72, 126, px1 - 72, 730, 28); c.fillStyle = P.accent; c.fill(); c.clip();
      c.strokeStyle = 'rgba(255,255,255,0.09)'; c.lineWidth = 26;
      const so = (t * 60) % 80;
      c.beginPath(); for (let k = -20; k < 40; k++) { const x = k * 80 + so; c.moveTo(x, 126); c.lineTo(x - 730, 856); } c.stroke();
      // the product
      const pa = E.outB(seg(t, 2.25, 2.65));
      if (pa > 0) {
        c.fillStyle = 'rgba(23,24,28,0.18)'; c.beginPath(); c.ellipse(446, 668, 170 * pa, 18 * pa, 0, 0, TAU); c.fill();
        TK.token(c, 446, 500 - 12 * Math.sin(t * 2.2), 300 * pa, { rot: 0.08 * Math.sin(t * 1.3), color: P.accentL });
        c.strokeStyle = P.ink; c.lineWidth = 4; c.save(); c.translate(446, 500 - 12 * Math.sin(t * 2.2)); c.rotate(0.08 * Math.sin(t * 1.3)); TK.tokenPath(c, 300 * pa); c.restore(); c.stroke();
        const na = seg(t, 2.4, 2.7);
        text(c, 'THE TOKEN', 446, 752, { font: TK.FONT, weight: 900, size: 62, ls: 2, color: `rgba(23,24,28,${na})`, align: 'center' });
        label(c, 'ORIGINAL ORANGE  ·  HOLE INCLUDED', 446, 792, { size: 15, align: 'center', color: `rgba(23,24,28,${0.7 * na})`, weight: 700 });
      }
      c.restore();
      // the offer: slammed full frame, then shrunk into the starburst badge
      const m = E.ioC(seg(t, 2.0, 2.5)), slam = 1 + 0.3 * (1 - E.outQt(seg(t, 0, 0.25)));
      const bx = lerp(960, 712, m), by = lerp(470, 246, m), bk = lerp(1, 0.25, m) * slam, br = lerp(0, -0.2, m);
      if (m > 0) {
        c.save(); c.globalAlpha = seg(m, 0.55, 0.9);
        c.fillStyle = P.ink; starburst(c, bx, by, 120, 142, 18, t * 0.4); c.fill();
        c.restore();
      }
      c.save(); c.translate(bx, by); c.rotate(br); c.scale(bk, bk);
      text(c, '40%', 0, -40, { font: TK.FONT, weight: 900, size: 380, color: P.ground, align: 'center', base: 'middle' });
      text(c, 'OFF', 0, 190, { font: TK.FONT, weight: 900, size: 150, ls: 20, color: m > 0.5 ? P.accent : P.ink, align: 'center', base: 'middle' });
      c.restore();
      if (t < 2.4) {
        const ea = seg(t, 0.4, 0.7) * (1 - seg(t, 1.9, 2.1));
        label(c, 'EVERYTHING  ·  THIS WEEKEND ONLY', 960, 812, { size: 26, ls: 6, align: 'center', color: `rgba(23,24,28,${ea})`, weight: 700 });
        note(c, 'THE OFFER  ·  ONE BIG NUMBER, FIRST', 110, 180, win(t, 0.3, 2.0, 0.2), { color: P.ink, tick: P.ink });
      }
      // price: anchor struck through → sale price, saving spelled out
      saleHead(c, 'ANCHOR PRICE  →  SALE PRICE', 150, t, 2, 4, 2.4);
      const a50 = seg(t, 2.25, 2.45);
      if (a50 > 0) {
        const w50 = measure(c, '$50', 110, 800);
        text(c, '$50', SX, 300, { font: TK.FONT, weight: 800, size: 110, color: `rgba(143,138,128,${a50})` });
        const st = E.outC(seg(t, 2.5, 2.75));
        if (st > 0) { c.strokeStyle = P.accent; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(SX - 8, 272); c.lineTo(SX - 8 + (w50 + 16) * st, 258 - 6 * st); c.stroke(); c.lineCap = 'butt'; }
        const p30 = E.outB(seg(t, 2.8, 3.05), 2.4);
        if (p30 > 0) {
          c.save(); c.translate(1170, 262); c.scale(p30, p30);
          text(c, '$30', 0, 50, { font: TK.FONT, weight: 900, size: 170, color: P.ink });
          c.restore();
        }
        const sv = E.outB(seg(t, 3.1, 3.3));
        if (sv > 0) {
          c.save(); c.translate(1700, 228); c.scale(sv, sv);
          c.fillStyle = P.ink; pill(c, -146, -30, 292, 60); c.fill();
          label(c, 'YOU SAVE $20', 0, 8, { size: 22, ls: 3, align: 'center', color: P.ground, weight: 700 });
          c.restore();
        }
      }
      // stacked offers
      saleHead(c, 'STACKED OFFERS', 372, t, 3.0, 4);
      let ox = SX;
      ['FREE SHIPPING', 'FREE RETURNS', 'GIFT WRAP'].forEach((s, i) => {
        const u = E.outB(seg(t, 3.0 + i * 0.3, 3.25 + i * 0.3)), tw = measure(c, s, 20, 700, TK.MONO, 2), pw = tw + 64;
        if (u > 0) {
          c.save(); c.globalAlpha = clamp(u); c.translate(ox + pw / 2, 412); c.scale(lerp(0.6, 1, u), lerp(0.6, 1, u));
          c.fillStyle = '#f8f5ef'; pill(c, -pw / 2, -24, pw, 48); c.fill(); c.strokeStyle = P.ink; c.lineWidth = 2; c.stroke();
          text(c, '+', -pw / 2 + 20, 11, { font: TK.FONT, weight: 900, size: 30, color: P.accent });
          label(c, s, -pw / 2 + 44, 8, { size: 20, ls: 2, color: P.ink, weight: 700 });
          c.restore();
        }
        ox += pw + 16;
      });
      // scarcity: live count and a draining stock bar
      saleHead(c, 'SCARCITY  ·  LIVE STOCK', 482, t, 4, 6);
      const sa = seg(t, 4.0, 4.25);
      if (sa > 0) {
        c.save(); c.globalAlpha = sa;
        const n = stockN(t), low = n <= 5, jolt = STOCK.reduce((j, [a]) => j + Math.exp(-Math.max(0, t - a) * 14) * (t >= a ? 1 : 0), 0);
        const w1 = measure(c, 'ONLY ', 66), w2 = measure(c, String(n), 66);
        text(c, 'ONLY ', SX, 556, { font: TK.FONT, weight: 900, size: 66, color: P.ink });
        c.save(); c.translate(SX + w1 + w2 / 2, 534); c.scale(1 + 0.25 * jolt, 1 + 0.25 * jolt);
        text(c, String(n), 0, 22, { font: TK.FONT, weight: 900, size: 66, color: low ? P.accentD : P.ink, align: 'center' });
        c.restore();
        text(c, ' LEFT', SX + w1 + w2, 556, { font: TK.FONT, weight: 900, size: 66, color: P.ink });
        const viewers = 23 + Math.floor(hash(Math.floor(t * 1.5) + 4) * 9);
        const vs = `${viewers} PEOPLE VIEWING NOW`, vw = measure(c, vs, 15, 700, TK.MONO, 2);
        c.fillStyle = P.accent; c.beginPath(); c.arc(SX1 - vw - 18, 536, 7, 0, TAU); c.fill();
        label(c, vs, SX1, 542, { size: 15, ls: 2, align: 'right', color: P.ink, weight: 700 });
        c.fillStyle = 'rgba(23,24,28,0.1)'; c.fillRect(SX, 574, SX1 - SX, 22);
        const f = stockF(t) / 12;
        c.fillStyle = low ? P.accent : P.ink; c.fillRect(SX, 574, (SX1 - SX) * f, 22);
        for (let k = 1; k < 12; k++) { c.fillStyle = 'rgba(236,232,223,0.6)'; c.fillRect(SX + (SX1 - SX) * k / 12 - 1, 574, 2, 22); }
        c.restore();
      }
      // deadline: a ticking clock
      saleHead(c, 'DEADLINE  ·  ENDS IN', 642, t, 6, 8);
      const da = seg(t, 6.0, 6.25);
      if (da > 0) {
        c.save(); c.globalAlpha = da;
        const parts = saleClock(t), tick = t >= 6 ? Math.exp(-(t - Math.floor(t)) * 5) : 0, BW = 168;
        parts.forEach((p, i) => {
          const x = SX + i * (BW + 34);
          c.fillStyle = i === 2 ? `rgb(${Math.round(lerp(23, 255, tick))},${Math.round(lerp(24, 90, tick))},${Math.round(lerp(28, 31, tick))})` : P.ink;
          rrect(c, x, 660, BW, 100, 12); c.fill();
          text(c, p, x + BW / 2, 740, { font: TK.MONO, weight: 700, size: i === 3 ? 62 : 80, color: i === 3 ? 'rgba(236,232,223,0.6)' : P.ground, align: 'center' });
          if (i < 3) text(c, i < 2 ? ':' : '.', x + BW + 17, 734, { font: TK.MONO, weight: 700, size: 64, color: P.accentD, align: 'center' });
          label(c, ['HRS', 'MIN', 'SEC', '1/100'][i], x + BW / 2, 782, { size: 12, align: 'center', color: P.mute });
        });
        c.restore();
      }
      // CTA
      const ca = seg(t, 8.0, 8.2);
      if (ca > 0) {
        const press = Math.exp(-Math.max(0, t - 9.0) * 9) * (t >= 9.0 ? 1 : 0);
        const pul = (1 + 0.04 * Math.max(0, Math.sin((t - 8.2) * TAU * 2)) * (1 - seg(t, 8.9, 9.0))) * (1 - 0.06 * press) * E.outB(seg(t, 8.0, 8.25));
        c.save(); c.translate(SX + 210, 838); c.scale(pul, pul);
        c.fillStyle = P.accent; pill(c, -210, -40, 420, 80); c.fill();
        text(c, 'SHOP NOW  →', 0, 15, { font: TK.FONT, weight: 900, size: 42, ls: 3, color: P.ground, align: 'center' });
        c.restore();
        if (t >= 9.0 && t < 9.6) { const r = 30 + 110 * E.outC(seg(t, 9.0, 9.6)); c.strokeStyle = `rgba(255,90,31,${0.6 * (1 - seg(t, 9.0, 9.6))})`; c.lineWidth = 4; c.beginPath(); c.arc(SX + 260, 846, r, 0, TAU); c.stroke(); }
        note(c, 'CTA  ·  ONE VERB, ONE BUTTON', 1360, 830, seg(t, 8.1, 8.3), { color: t >= 8 ? P.accentD : P.ink, size: 14 });
        label(c, 'CODE TOKEN40 AT CHECKOUT', 1373, 858, { size: 14, ls: 2, color: P.mute });
        const go = E.ioC(seg(t, 8.3, 8.9));
        cursor(c, lerp(1500, SX + 260, go), lerp(700, 846, go), seg(t, 8.3, 8.45), press);
      }
      // T&Cs
      const ta = seg(t, 8.4, 8.7);
      if (ta > 0) {
        c.save(); c.globalAlpha = ta;
        label(c, 'T&Cs', 72, 892, { size: 12, ls: 2, color: P.ink, weight: 700 });
        label(c, '*Ends Sunday 23:59. While stocks last. One Token per customer. Free shipping over $25. Hole not discounted.', 130, 892, { size: 12, ls: 1, color: P.mute });
        c.restore();
      }
      FK.strip(c, t, W, H, SLB, { label: 'Sale countdown' });
      FK.caption(c, t, W, H, { name: 'Sale Countdown', cat: 'Advertising', curve: u => kf(u * 10, SALE_URG), span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'URGENCY / TIME' });
    },
    score(A) {
      // the offer: a brass-like slam on frame one, then a driving 120 BPM groove under everything
      A.impact(0, 0.5);
      A.chord(0, [53, 60, 65, 69, 72], { type: 'sawtooth', dur: 0.9, g: 0.04, a: 0.005, lp: 2800, lp2: 900, lpT: 0.9, rev: 0.4, width: 0.8, spread: 6 });
      const bass = [41, 41, 43, 43, 45, 45, 48, 48];
      for (let b = 1; b < 20; b++) {
        const t = b * 0.5;
        A.kick(t, 0.32, { f: 125, f2: 45 }); A.hat(t + 0.25, 0.045);
        if (b % 2) A.clap(t, 0.13);
        if (t >= 6) A.hat(t + 0.125, 0.025);
        A.osc(t, { type: 'sawtooth', f: midi(bass[b % 8] - 12), dur: 0.4, g: 0.05, lp: 500, a: 0.005 });
        A.osc(t + 0.25, { type: 'sawtooth', f: midi(bass[b % 8]), dur: 0.2, g: 0.035, lp: 800, a: 0.005 });
      }
      A.whoosh(1.9, 0.45, { f1: 3000, f2: 400, g: 0.07 });
      // price: the strike swish and the ka-ching
      A.noise(2.5, { type: 'bandpass', f: 1500, f2: 5000, q: 2, dur: 0.25, g: 0.1 });
      A.noise(2.8, { type: 'highpass', f: 5000, dur: 0.15, g: 0.07 });
      A.bell(2.8, midi(88), { g: 0.12, dur: 1.0, rev: 0.4 });
      A.bell(2.86, midi(95), { g: 0.08, dur: 0.8, rev: 0.4 });
      [0, 0.04, 0.08, 0.12].forEach((d, i) => A.pluck(2.8 + d, midi(84 + i * 3), { g: 0.08, bright: 0.95, dur: 0.3 }));
      A.osc(3.1, { type: 'square', f: midi(79), dur: 0.12, g: 0.04, lp: 3000 });
      // stacked offers: three rising pops
      [[3.0, 76], [3.3, 79], [3.6, 84]].forEach(([t, m]) => { A.osc(t, { f: midi(m - 12), f2: midi(m), glide: 0.06, dur: 0.12, g: 0.07 }); A.pluck(t, midi(m), { g: 0.12, bright: 0.85, dur: 0.4 }); });
      // scarcity: a descending blip on every unit sold, a tense pad
      STOCK.forEach(([t, v]) => { A.osc(t, { type: 'square', f: midi(60 + v * 2), f2: midi(56 + v * 2), glide: 0.1, dur: 0.12, g: 0.045, lp: 2600 }); A.kick(t, 0.12, { f: 200, f2: 80, dur: 0.1 }); });
      A.chord(4.0, [52, 55, 59], { type: 'sawtooth', dur: 4.0, g: 0.018, a: 1.2, hold: true, rel: 0.2, lp: 900, rev: 0.4, width: 0.7, vib: [6, 4] });
      // deadline: the clock ticks on every second, a riser into the CTA
      [6, 7, 8, 9].forEach((t, i) => { A.osc(t, { f: i % 2 ? 1400 : 1800, dur: 0.04, g: 0.1 }); A.noise(t, { type: 'highpass', f: 6000, dur: 0.02, g: 0.06 }); });
      A.riser(6.0, 2.0, { g: 0.09, f: 110 });
      // CTA: the hit, a jingle and the click
      A.impact(8.0, 0.4);
      A.chord(8.0, [53, 60, 65, 69, 72], { type: 'sawtooth', dur: 0.8, g: 0.035, a: 0.005, lp: 3200, lp2: 1200, lpT: 0.8, rev: 0.4, width: 0.8, spread: 6 });
      [[8.5, 72], [8.625, 76], [8.75, 79], [8.875, 84]].forEach(([t, m]) => A.pluck(t, midi(m), { g: 0.14, bright: 0.85, dur: 0.4 }));
      A.osc(9.0, { type: 'square', f: 1200, dur: 0.025, g: 0.08 }); A.noise(9.0, { type: 'highpass', f: 3000, dur: 0.03, g: 0.08 });
      A.bell(9.05, midi(88), { g: 0.1, dur: 0.9, rev: 0.4 }); A.bell(9.1, midi(95), { g: 0.06, dur: 0.8, rev: 0.4 });
      A.chord(9.5, [53, 60, 65, 69, 77], { type: 'triangle', dur: 0.5, g: 0.03, a: 0.01, lp: 2600, rev: 0.6, width: 0.8 });
    },
  });

  /* =====================================================================
     TOP-5 LISTICLE — a countdown. The tease comes first: the title and
     '…and #1 might surprise you'. Then the entries in reverse, #5 to #2,
     each a numbered card with a Token variant, and each held a quarter of
     a second longer than the last (the on-screen bar in every card grows);
     progress dots track how far to the top, and a reminder chip keeps the
     tease open. A drumroll covers the last card; #1 — the original
     Token, the one you started with — is revealed and held longest.
     ===================================================================== */
  const LSB = [
    { t0: 0, t1: 1, name: 'Tease', kind: 'hook' },
    { t0: 1, t1: 2, name: '#5', kind: 'act' },
    { t0: 2, t1: 3.25, name: '#4', kind: 'act' },
    { t0: 3.25, t1: 4.75, name: '#3', kind: 'act' },
    { t0: 4.75, t1: 6.5, name: '#2', kind: 'act' },
    { t0: 6.5, t1: 7, name: 'Drumroll', kind: 'turn' },
    { t0: 7, t1: 10, name: '#1', kind: 'title' },
  ];
  const LE = [
    { n: 5, t0: 1, t1: 2, title: 'THE OUTLINE', line: 'All edge, no fill.' },
    { n: 4, t0: 2, t1: 3.25, title: 'THE BLUE ONE', line: 'Same shape, cooler head.' },
    { n: 3, t0: 3.25, t1: 4.75, title: 'THE SQUASH', line: 'Lands like it means it.' },
    { n: 2, t0: 4.75, t1: 6.5, title: 'THE STACK', line: 'Three Tokens make a tower.' },
    { n: 1, t0: 7, t1: 10, title: 'THE ORIGINAL', line: 'The one you started with.' },
  ];
  const DRUM = 6.5, REVEAL = 7;
  const CARD = { x: 700, y: 226, w: 1060, h: 540 }, VX = 925, VY = 500;
  const CONF = (() => { const r = rng(515), cols = [P.accent, P.blue, P.ink, P.accentL, '#ffcc00']; return [...Array(80)].map((_, i) => ({ vx: (r() - 0.5) * 1900, vy: -400 - r() * 900, w: 10 + r() * 14, h: 6 + r() * 8, sp: (r() - 0.5) * 14, col: cols[i % 5], d: r() * 0.15 })); })();
  function lsVariant(c, n, x, y, u) {
    if (n === 5) {
      c.save(); c.translate(x, y); c.rotate(0.25 * Math.sin(u * 2.4));
      TK.tokenPath(c, 240); c.lineWidth = 10; c.strokeStyle = P.ink; c.lineJoin = 'round'; c.stroke(); c.restore();
    } else if (n === 4) {
      TK.token(c, x, y, 240, { color: P.blue, rot: 0.2 * Math.sin(u * 4) });
    } else if (n === 3) {
      const ph = (u % 0.5) / 0.5, hgt = Math.sin(PI * ph) * 150, fy = y + 150, s = 170;
      const sq = ph < 0.12 ? 0.24 * (1 - ph / 0.12) : ph > 0.9 ? 0.24 * ((ph - 0.9) / 0.1) : -0.07 * Math.sin(PI * ph);
      c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(x - 170, fy, 340, 2);
      TK.shadow(c, x, fy, s, hgt);
      TK.token(c, x, fy - s / 2 - hgt + s / 2 * Math.max(0, sq), s, { sx: 1 + sq, sy: 1 - sq });
    } else if (n === 2) {
      const fy = y + 170, s = 112;
      c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(x - 170, fy, 340, 2);
      for (let i = 0; i < 3; i++) {
        const u0 = 0.1 + 0.2 * i, d = E.outB(seg(u, u0, u0 + 0.3), 1.2); if (u < u0) continue;
        const wob = 0.05 * i * Math.sin(u * 5 + i) * seg(u, 0.8, 1.0);
        TK.token(c, x + Math.sin(u * 5 + i) * 5 * i * seg(u, 0.8, 1.0), lerp(-320, fy - s / 2 - i * s, d), s, { rot: wob });
      }
    } else {
      const k = E.outB(seg(u, 0, 0.6), 2);
      TK.token(c, x, y, 280 * k, { rot: -TAU * (1 - E.outQt(seg(u, 0, 0.8))) });
    }
  }
  function lsCard(c, t, e, ox, cover = 0) {
    const { x, y, w, h } = CARD, top = e.n === 1;
    c.save(); c.translate(ox, 0);
    c.fillStyle = 'rgba(23,24,28,0.12)'; rrect(c, x + 10, y + 14, w, h, 22); c.fill();
    if (!cover) { c.fillStyle = '#f8f5ef'; rrect(c, x, y, w, h, 22); c.fill(); c.strokeStyle = top ? P.accent : P.ink; c.lineWidth = top ? 6 : 2; c.stroke(); }
    c.save(); rrect(c, x, y, w, h, 22); c.clip();
    const u = Math.max(0, t - e.t0);
    if (!cover) {
      lsVariant(c, e.n, VX, VY, u);
      c.fillStyle = 'rgba(23,24,28,0.12)'; c.fillRect(x + 450, y + 60, 2, h - 120);
      const tx = x + 490;
      label(c, `RANK #${e.n} OF 5`, tx, y + 130, { size: 15, ls: 3, color: top ? P.accentD : P.mute, weight: 700 });
      text(c, e.title, tx - 3, y + 210, { font: TK.FONT, weight: 900, size: 62, color: P.ink });
      text(c, e.line, tx, y + 268, { font: TK.FONT, weight: 500, size: 32, color: 'rgba(23,24,28,0.75)' });
      // on-screen time: each entry's bar is longer than the last
      const dur = e.t1 - e.t0, BL = 520, by = y + h - 92;
      label(c, `ON SCREEN  ${dur.toFixed(2)} s`, tx, by - 16, { size: 15, ls: 2.5, color: P.ink, weight: 700 });
      c.save(); c.setLineDash([4, 5]); c.strokeStyle = 'rgba(23,24,28,0.3)'; c.lineWidth = 1.5; c.strokeRect(tx + 0.5, by + 0.5, BL, 14); c.restore();
      c.fillStyle = 'rgba(23,24,28,0.18)'; c.fillRect(tx, by, BL * dur / 3, 15);
      c.fillStyle = top ? P.accent : P.ink; c.fillRect(tx, by, BL * dur / 3 * seg(t, e.t0, e.t1), 15);
      LE.forEach(f => { c.fillStyle = 'rgba(23,24,28,0.35)'; c.fillRect(tx + BL * (f.t1 - f.t0) / 3 - 1, by + 18, 2, 7); });
      label(c, '3.0 s', tx + BL, by + 40, { size: 12, ls: 1, color: P.mute, align: 'right' });
    }
    if (cover > 0) {
      // the drumroll cover
      c.save(); c.globalAlpha = clamp(cover);
      c.fillStyle = P.ink; c.fillRect(x, y, w, h);
      c.strokeStyle = 'rgba(236,232,223,0.08)'; c.lineWidth = 18;
      c.beginPath(); for (let k = -10; k < 20; k++) { c.moveTo(x + k * 70, y); c.lineTo(x + k * 70 - h, y + h); } c.stroke();
      text(c, '?', x + w / 2, y + h / 2 + 10, { font: TK.FONT, weight: 900, size: 300, color: P.accent, align: 'center', base: 'middle' });
      c.restore();
    }
    c.restore();
    if (cover) { c.save(); c.globalAlpha = clamp(cover); c.strokeStyle = P.accent; c.lineWidth = 6; rrect(c, x, y, w, h, 22); c.stroke(); c.restore(); }
    c.restore();
  }
  MG.film({
    id: 'formatlisticle', dur: 10, poster: 8.3,
    fonts: FONTS,
    meta: {
      family: 'M', name: 'Top-5 Listicle', sub: 'Countdown from five, tease the top, hold #1', era: '1970 —',
      origin: 'The countdown is a radio format first: Casey Kasem’s American Top 40 (from July 1970) played the week’s chart from the bottom up so that number one closed the show, with a tease before every break. Late Night with David Letterman’s Top Ten List (from 1985) turned it into a comedy bit, Channel 4’s 100 Greatest… specials (from 1999) into a television genre, and the web listicle — BuzzFeed in the late 2000s, WatchMojo’s top-ten videos on YouTube — set the conventions as video: tease number one at the start, count in reverse so the order itself builds, give each entry a little more time as it climbs, and hold the last.',
      works: 'American Top 40 (Casey Kasem, 1970 —) · Late Night with David Letterman, Top Ten List (1985 —) · WatchMojo top-ten videos (YouTube)',
      tech: ['Reverse order: count down from #5 to #1', 'Tease the top at the start, keep the loop open', 'Entries lengthen as they climb; #1 held longest'],
      accent: '#ff5a1f',
      motionDNA: 'A one-second tease with the title already up and the hook typed in; then whip-ins on the eighth notes: #5 for 1.0 s, #4 for 1.25, #3 for 1.5, #2 for 1.75 — the rank numeral rolls up and each card slides in and out; a covered card shakes under a half-second drumroll; at 7 s the cover flies off, confetti bursts and #1 spins in and is held for three seconds.',
      visualDNA: 'The Technique Atlas paper stage: a huge ink rank numeral with an orange hash on the left, a cream card with a Token variant (outline, blue, squashing, a stack, the original) and its title, line and an on-screen-time bar measured against 3 s; progress dots top right, a reminder chip below; for #1 an orange border, turning rays and confetti.',
      transitions: 'Card whip-ins and whip-outs on the beat, a rolling numeral, the drumroll cover pulled off to reveal #1',
      implementation: ['Template edit: one card layout re-used per entry, durations set per rank', 'Teaser and reminder chip carry the open loop to #1', 'Canvas 2D: entry table drives card, numeral, dots and the duration bars'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      // rays behind #1
      if (t >= REVEAL) {
        const ra = E.outC(seg(t, REVEAL, REVEAL + 0.5));
        c.save(); c.translate(CARD.x + CARD.w / 2, CARD.y + CARD.h / 2); c.rotate((t - REVEAL) * 0.25);
        c.fillStyle = `rgba(255,90,31,${0.1 * ra})`;
        for (let i = 0; i < 16; i++) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 1300, i / 16 * TAU, (i + 0.5) / 16 * TAU); c.closePath(); c.fill(); }
        c.restore();
      }
      // tease
      if (t < 1.05) {
        const out = E.inC(seg(t, 0.85, 1.05));
        c.save(); c.globalAlpha = 1 - out; c.translate(0, -80 * out);
        text(c, 'TOP 5', 960, 400, { font: TK.FONT, weight: 900, size: 250, color: P.ink, align: 'center' });
        TK.token(c, 1430, 220, 90, { rot: t * 2 });
        text(c, 'TOKENS OF ALL TIME', 960, 500, { font: TK.FONT, weight: 900, size: 66, ls: 4, color: P.ink, align: 'center' });
        const hook = '…and #1 might surprise you', n = Math.floor(clamp((t - 0.12) / 0.45) * hook.length);
        text(c, hook.slice(0, n), 960, 640, { font: TK.FONT, weight: 800, size: 58, color: P.accentD, align: 'center' });
        c.restore();
        note(c, 'TEASE  ·  PROMISE #1 UP FRONT', 720, 790, 1 - out);
      }
      // header + progress dots
      const ha = seg(t, 0.85, 1.05);
      if (ha > 0) {
        c.save(); c.globalAlpha = ha;
        text(c, 'TOP 5 TOKENS OF ALL TIME', 72, 128, { font: TK.FONT, weight: 900, size: 36, ls: 2, color: P.ink });
        label(c, 'PROGRESS', 1480, 112, { size: 12, ls: 2, align: 'right', color: P.mute, weight: 700 });
        LE.forEach((e, i) => {
          const dx = 1530 + i * 72, cur = t >= e.t0 && t < e.t1, done = t >= e.t1 || (e.n === 1 && t >= e.t0);
          const r = e.n === 1 ? 16 : 12;
          if (done || cur) { c.fillStyle = P.accent; c.beginPath(); c.arc(dx, 106, r, 0, TAU); c.fill(); }
          else { c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 2; c.beginPath(); c.arc(dx, 106, r, 0, TAU); c.stroke(); }
          if (cur) { const pr = (t * 2) % 1; c.strokeStyle = `rgba(255,90,31,${1 - pr})`; c.lineWidth = 2; c.beginPath(); c.arc(dx, 106, r + 4 + pr * 10, 0, TAU); c.stroke(); }
          label(c, `#${e.n}`, dx, 144, { size: 13, ls: 1, align: 'center', color: cur ? P.ink : P.mute, weight: cur ? 700 : 400 });
        });
        c.restore();
      }
      if (t >= 1) {
        // the rank numeral
        let ei = LE.findIndex(e => t >= e.t0 && t < e.t1);
        const drum = t >= DRUM && t < REVEAL;
        c.save(); c.beginPath(); c.rect(80, 200, 600, 590); c.clip();
        text(c, '#', 120, 420, { font: TK.FONT, weight: 900, size: 190, color: P.accent });
        c.beginPath(); c.rect(240, 200, 440, 590); c.clip();
        const numeral = (s, dy, col = P.ink) => text(c, s, 250, 700 + dy, { font: TK.FONT, weight: 900, size: 470, color: col });
        if (drum) {
          const k = Math.floor(t * 22), roll = ((t * 22) % 1) * 590;
          numeral(String(9 - (k % 9)), roll - 590, 'rgba(23,24,28,0.5)'); numeral(String(9 - ((k + 1) % 9)), roll, 'rgba(23,24,28,0.5)');
        } else if (ei >= 0) {
          const e = LE[ei], dy = (1 - E.outQt(seg(t, e.t0 - 0.07, e.t0 + 0.25))) * 590;
          const prev = e.n === 1 ? '2' : String(e.n + 1);
          if (dy > 0.5 && e.n < 5) numeral(prev, dy - 590);
          numeral(String(e.n), dy, e.n === 1 ? P.accentD : P.ink);
        }
        c.restore();
        // the card
        if (drum) {
          const sh = seg(t, DRUM, REVEAL), ox = (1 - E.outQt(seg(t, DRUM - 0.06, DRUM + 0.14))) * 1300 + Math.sin(t * 70) * 10 * sh;
          lsCard(c, t, LE[4], ox, 1);
        } else if (ei >= 0) {
          const e = LE[ei];
          // the whip-in starts just before the cut, so the cut frame already shows the card coming in
          const ox = e.n === 1 ? 0 : (1 - E.outQt(seg(t, e.t0 - 0.07, e.t0 + 0.25))) * 1300 - 1500 * E.inQ(seg(t, e.t1 - 0.16, e.t1));
          lsCard(c, t, e, ox, 0);
          if (e.n === 1) {
            // the cover flies off
            const off = seg(t, REVEAL, REVEAL + 0.35);
            if (off < 1) { c.save(); c.globalAlpha = 1 - seg(off, 0.6, 1); c.translate(0, -900 * E.inQ(off)); c.rotate(-0.15 * off); lsCard(c, t, e, 0, 1); c.restore(); }
          }
        }
        // annotations
        if (t < DRUM) {
          note(c, 'REVERSE ORDER  ·  BUILDS TO #1', 100, 840, seg(t, 1.1, 1.4));
          const ca = seg(t, 1.3, 1.6) * (0.75 + 0.25 * Math.sin(t * 6));
          c.save(); c.globalAlpha = ca;
          const s = '#1 MIGHT SURPRISE YOU…', w = measure(c, s, 15, 700, TK.MONO, 2.5);
          c.strokeStyle = P.accent; c.lineWidth = 2; pill(c, CARD.x, 812, w + 40, 40); c.stroke();
          label(c, s, CARD.x + 20, 838, { size: 15, ls: 2.5, color: P.accentD, weight: 700 });
          c.restore();
          note(c, 'EACH ENTRY HELD LONGER', CARD.x + CARD.w, 840, seg(t, 2.0, 2.3), { align: 'right' });
        } else if (drum) {
          note(c, 'DRUMROLL  ·  DELAY THE REVEAL', CARD.x, 840, seg(t, DRUM, DRUM + 0.1));
        } else {
          note(c, 'HELD LONGEST  ·  3.0 s  ·  PAYS OFF THE TEASE', CARD.x, 840, seg(t, REVEAL + 0.3, REVEAL + 0.6));
          label(c, '(yes — the Token from the start)', CARD.x + CARD.w, 840, { size: 14, ls: 1, align: 'right', color: `rgba(143,138,128,${seg(t, 7.8, 8.1)})` });
        }
      }
      // confetti on the reveal
      if (t >= REVEAL) {
        c.save(); c.beginPath(); c.rect(0, 70, W, 810); c.clip();
        CONF.forEach(p => {
          const u = t - REVEAL - p.d; if (u <= 0) return;
          const x = CARD.x + CARD.w / 2 + p.vx * u * 0.8, y = 360 + p.vy * u + 1100 * u * u;
          c.save(); c.globalAlpha = 1 - seg(u, 1.8, 2.6); c.translate(x, y); c.rotate(p.sp * u); c.scale(1, Math.cos(p.sp * u * 1.3));
          c.fillStyle = p.col; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore();
        });
        c.restore();
      }
      FK.strip(c, t, W, H, LSB, { label: 'Top-5 countdown' });
      const len = u => { const s = u * 10, e = LE.find(f => s >= f.t0 && s < f.t1); return e ? (e.t1 - e.t0) / 3 : s >= 9.99 ? 1 : 0; };
      FK.caption(c, t, W, H, { name: 'Top-5 Listicle', cat: 'Explainer', curve: len, span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'ENTRY LENGTH / TIME' });
    },
    score(A) {
      // tease: a bright sting and a question that does not resolve
      A.chord(0, [60, 64, 67, 72], { type: 'sawtooth', dur: 0.5, g: 0.035, a: 0.004, lp: 3000, rev: 0.4, width: 0.8 });
      A.kick(0, 0.35, { f: 130, f2: 45 });
      [[0.25, 67], [0.375, 69], [0.5, 71], [0.625, 74]].forEach(([t, m]) => A.pluck(t, midi(m), { g: 0.13, bright: 0.8, dur: 0.4 }));
      A.osc(0.75, { type: 'triangle', f: midi(74), f2: midi(78), glide: 0.2, dur: 0.25, g: 0.05 });
      // the pop bed, 120 BPM, up to the drumroll
      const bass = [48, 45, 41, 43];
      for (let b = 2; b * 0.5 < DRUM; b++) {
        const t = b * 0.5;
        A.kick(t, 0.3, { f: 120, f2: 45 }); A.hat(t + 0.25, 0.04);
        if (b % 2) A.clap(t, 0.12);
        A.osc(t, { type: 'triangle', f: midi(bass[Math.floor(b / 2) % 4] - 12), dur: 0.45, g: 0.13, a: 0.005 });
      }
      // each entry: a whoosh in and a number hit, one step higher each time
      LE.slice(0, 4).forEach((e, i) => {
        A.whoosh(e.t0 - 0.12, 0.3, { f1: 500, f2: 4000, g: 0.07, pan: 0.4 });
        A.bell(e.t0, midi(72 + i * 2), { g: 0.08, dur: 0.8, rev: 0.4 });
        A.chord(e.t0, [60, 64, 67].map(m => m + i * 2), { type: 'triangle', dur: e.t1 - e.t0 - 0.05, g: 0.022, a: 0.02, lp: 2200, rev: 0.4, width: 0.7 });
        A.noise(e.t1 - 0.16, { type: 'bandpass', f: 3000, f2: 800, dur: 0.16, g: 0.04, pan: -0.4 });
      });
      // entry sounds: the squash boings, the stack clacks
      for (let k = 0; k < 3; k++) { const t = 3.25 + k * 0.5; A.osc(t, { f: 180, f2: 90, glide: 0.1, dur: 0.15, g: 0.08 }); A.osc(t + 0.05, { f: 300, f2: 700, glide: 0.2, dur: 0.22, g: 0.03 }); }
      [0, 1, 2].forEach(i => { const t = 4.75 + 0.1 + 0.2 * i + 0.25; A.pluck(t, midi(67 + i * 5), { g: 0.14, bright: 0.4, dur: 0.25 }); A.noise(t, { type: 'bandpass', f: 1800, q: 4, dur: 0.05, g: 0.08 }); });
      // drumroll: a snare roll swelling into the reveal
      for (let t = DRUM, k = 0; t < REVEAL - 0.02; t += 0.032, k++) A.snare(t, 0.05 + 0.13 * (t - DRUM) / 0.5, { dur: 0.06 });
      A.riser(DRUM, 0.5, { g: 0.08, f: 220 });
      // #1: crash, fanfare, and the groove back for the hold
      A.impact(REVEAL, 0.5);
      A.noise(REVEAL, { type: 'highpass', f: 5000, dur: 1.6, g: 0.08, rev: 0.4 });
      A.chord(REVEAL, [48, 60, 64, 67, 72], { type: 'sawtooth', dur: 1.2, g: 0.035, a: 0.01, lp: 3200, lp2: 1400, lpT: 1.2, rev: 0.6, width: 0.8, spread: 6 });
      [[7.0, 72], [7.125, 76], [7.25, 79], [7.375, 84]].forEach(([t, m]) => A.pluck(t, midi(m), { g: 0.16, bright: 0.85, dur: 0.6 }));
      A.bell(7.4, midi(96), { g: 0.06, dur: 1.2, rev: 0.6 });
      const fan = [[48, 55, 64], [41, 48, 57], [43, 50, 59], [48, 55, 64]];
      for (let b = 0; b < 6; b++) {
        const t = 7.5 + b * 0.5, ch = fan[Math.floor(b / 2) % 4];
        A.kick(t, 0.32, { f: 125, f2: 45 }); A.hat(t + 0.25, 0.05);
        if (b % 2) A.clap(t, 0.15);
        A.osc(t, { type: 'triangle', f: midi(ch[0] - 12), dur: 0.45, g: 0.14, a: 0.005 });
        if (b % 2 === 0) A.chord(t, ch.map(m => m + 12), { type: 'triangle', dur: 0.95, g: 0.022, a: 0.02, lp: 2400, rev: 0.5, width: 0.7 });
        A.pluck(t + 0.25, midi(ch[2] + 12), { g: 0.08, bright: 0.8, dur: 0.3 });
      }
      A.chord(9.5, [48, 55, 60, 64, 67, 72], { type: 'triangle', dur: 0.5, g: 0.03, a: 0.01, lp: 2600, rev: 0.7, width: 0.8 });
      A.bell(9.5, midi(84), { g: 0.07, dur: 0.5, rev: 0.6 });
    },
  });
})();
