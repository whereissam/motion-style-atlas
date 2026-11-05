/* batch m10 — Narrative Formats · Social: formatyoutube · formatduet · formatvlog.
   formatyoutube (a creator's video intro in a generic 16:9 player: a flash-forward hook to the
   payoff, the "in this video…" chapter list, a 1.5 s channel sting, an animated subscribe + bell
   lower third, then into chapter one — with chapter markers on the progress bar and an
   illustrative audience-retention curve beside the player showing why the hook comes first) ·
   formatduet (a vertical duet: the original clip — the letters of MOTION stacked into a tower —
   on the left, the Token reacting on the right, every reaction landing six frames after the beat
   it answers; a reply sticker on top, the tower falls, the reactor gets the punchline) ·
   formatvlog (a day-in-the-life vlog from 7:00 AM to 11:00 PM: time supers, a handheld camera, a
   B-roll routine montage, jump cuts that skip hours, one sit-down chat to camera, the sky changing
   through the day and a "see you tomorrow" sign-off, with the clock drawn as the film's spine). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, spring, hash, vnoise, midi, text, rrect, rng } = MG;
  const TK = MG.TK, FK = MG.FK, P = TK.P, PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const label = FK.label;
  const CREAM = '#ece8df';
  const win = (t, a, b, f = 0.2) => clamp(Math.min(seg(t, a, a + f), 1 - seg(t, b - f, b)));
  const hasLS = typeof CanvasRenderingContext2D !== 'undefined' && 'letterSpacing' in CanvasRenderingContext2D.prototype;
  function measure(c, s, size, weight = 900, font = TK.FONT, ls = 0) {
    c.font = `${weight} ${size}px ${font}`;
    if (hasLS) c.letterSpacing = ls + 'px';
    const w = c.measureText(s).width;
    if (hasLS) c.letterSpacing = '0px';
    return w;
  }
  /* A convention annotation: accent dot + bold mono label. */
  function tag(c, s, x, y, on = 1, o = {}) {
    if (on <= 0.01) return;
    c.save(); c.globalAlpha *= on;
    const right = o.align === 'right';
    c.fillStyle = P.accent; c.beginPath(); c.arc(right ? x - 6 : x + 6, y - 6, 6, 0, TAU); c.fill();
    label(c, s, right ? x - 22 : x + 22, y, { color: o.color || (o.dark ? CREAM : P.ink), weight: 700, size: o.size || 16, ls: 2, align: right ? 'right' : 'left' });
    c.restore();
  }
  /* Burned-in subtitle: white on a dark box, centred. */
  function subtitle(c, s, cx, y, size = 30, a = 1) {
    if (a <= 0.01) return;
    c.save(); c.globalAlpha *= a;
    const w = measure(c, s, size, 600) + 40;
    c.fillStyle = 'rgba(10,10,12,0.72)'; rrect(c, cx - w / 2, y - size - 6, w, size + 24, 8); c.fill();
    text(c, s, cx, y, { font: TK.FONT, weight: 600, size, color: '#fff', align: 'center' });
    c.restore();
  }
  /* Mouse pointer (generic arrow). */
  function pointer(c, x, y, press = 0) {
    c.save(); c.translate(x, y); const k = 1 - 0.15 * press; c.scale(k, k);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 36); c.lineTo(9, 27); c.lineTo(16, 42); c.lineTo(23, 39); c.lineTo(16, 25); c.lineTo(28, 25); c.closePath();
    c.fillStyle = '#fff'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = P.ink; c.stroke();
    if (press > 0.05) { c.strokeStyle = `rgba(255,90,31,${press})`; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 16 + 18 * (1 - press), 0, TAU); c.stroke(); }
    c.restore();
  }
  /* Notification bell, swinging about its top by rot. */
  function bellIcon(c, x, y, s, rot = 0) {
    c.save(); c.translate(x, y - s * 0.45); c.rotate(rot); c.translate(0, s * 0.45);
    c.beginPath();
    c.moveTo(-s * 0.44, s * 0.28);
    c.quadraticCurveTo(-s * 0.32, s * 0.14, -s * 0.32, -s * 0.06);
    c.arc(0, -s * 0.06, s * 0.32, PI, 0);
    c.quadraticCurveTo(s * 0.32, s * 0.14, s * 0.44, s * 0.28);
    c.closePath(); c.fill();
    c.beginPath(); c.arc(0, s * 0.36, s * 0.09, 0, TAU); c.fill();
    c.fillRect(-s * 0.05, -s * 0.47, s * 0.1, s * 0.1);
    c.restore();
  }
  // two-triangle fast-forward / rewind glyph (dir 1 = forward)
  function ffIcon(c, x, y, s, dir = 1) {
    c.save(); c.translate(x, y); c.scale(dir, 1); c.beginPath();
    [-s * 0.5, 0].forEach(o => { c.moveTo(o, -s * 0.5); c.lineTo(o + s * 0.5, 0); c.lineTo(o, s * 0.5); c.closePath(); });
    c.fill(); c.restore();
  }
  const rgbOf = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, u) => { const A = rgbOf(a), B = rgbOf(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
  const fonts = [...FK.fonts, [`700 16px ${TK.MONO}`, 'IN THIS VIDEO'], [`600 30px ${TK.FONT}`, 'let’s get into it'], [`800 30px ${TK.FONT}`, 'Subscribe']];

  /* =====================================================================
     CREATOR INTRO — the first ten seconds of a 12:48 video, in a generic
     player. It opens mid-jump on a clip from 9:12 (the payoff, flashed
     forward), rewinds, lists the chapters (each drops its marker on the
     progress bar), plays a 1.5 s channel sting, slides in a subscribe +
     bell lower third that a cursor clicks, and cuts to the chapter-one
     card. Beside the player: an illustrative retention curve — the hook
     is there because most viewers who leave, leave in the first 30 s.
     ===================================================================== */
  const YP = { x: 72, y: 100, w: 1120, h: 630 };
  const YT_LEN = 768;                 // 12:48
  const YT_CH = [[0, 'Intro'], [9, 'The square'], [245, 'The roll'], [552, 'The jump'], [730, 'Outro']];
  const YT_PAY = 552;                 // the payoff the hook flashes forward to (9:12)
  const YT_LIST = [[1.5, 9, 'THE SQUARE'], [2.0, 245, 'THE ROLL'], [2.5, 552, 'THE JUMP']];   // first row lands on the cut
  const YT_BEATS = [
    { t0: 0, t1: 1.5, name: 'Hook · flash-forward', kind: 'hook' },
    { t0: 1.5, t1: 3.5, name: 'In this video', kind: 'act' },
    { t0: 3.5, t1: 5.0, name: 'Sting', kind: 'title' },
    { t0: 5.0, t1: 7.5, name: 'Subscribe + bell', kind: 'cta' },
    { t0: 7.5, t1: 10, name: 'Into chapter 1', kind: 'act' },
  ];
  const YT_ROWS = [
    [0, 1.5, 'HOOK · FLASH-FORWARD', 'THE PAYOFF FIRST · A CLIP FROM 9:12'],
    [1.5, 3.5, 'IN THIS VIDEO…', 'THE CHAPTER LIST IS THE PROMISE'],
    [3.5, 5.0, 'CHANNEL STING · 1.5 S', 'THE BRAND, KEPT UNDER 2 S'],
    [5.0, 7.5, 'SUBSCRIBE + BELL', 'ASK EARLY · ANIMATED LOWER THIRD'],
    [7.5, 10, 'INTO CHAPTER 1', 'NO MORE PREAMBLE · CONTENT STARTS'],
  ];
  const ytBX = v => 20 + 1080 * v / YT_LEN;   // progress-bar x, player-local
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const retHook = s => 100 - 20 * (1 - Math.exp(-s / 5)) - 0.07 * s;
  const retSlow = s => 100 - 48 * (1 - Math.exp(-s / 8)) - 0.1 * s;

  function ytSet(c, t, props) {
    c.fillStyle = '#e6dfd1'; c.fillRect(0, 0, 1120, 630);
    c.fillStyle = 'rgba(23,24,28,0.05)'; for (let x = 28; x < 1120; x += 56) c.fillRect(x, 0, 2, 500);
    const g = c.createRadialGradient(270, 330, 20, 270, 330, 380); g.addColorStop(0, 'rgba(255,90,31,0.26)'); g.addColorStop(1, 'rgba(255,90,31,0)');
    c.fillStyle = g; c.fillRect(0, 0, 1120, 630);
    if (props) {
      c.fillStyle = '#b9ad98'; c.fillRect(660, 190, 400, 10);
      c.fillStyle = P.blue; c.fillRect(700, 130, 60, 60);
      c.fillStyle = P.ink; c.beginPath(); c.arc(820, 162, 28, 0, TAU); c.fill();
      TK.token(c, 920, 160, 56, { rot: 0.2 });
      c.fillStyle = '#7f9a6b'; [[1000, 150, 0.5], [1020, 140, -0.3], [1010, 128, 0.1]].forEach(([x, y, r]) => { c.beginPath(); c.ellipse(x, y, 12, 30, r, 0, TAU); c.fill(); });
      c.fillStyle = '#a5694a'; c.fillRect(992, 166, 36, 24);
    }
    c.fillStyle = '#cfc5b3'; c.fillRect(0, 500, 1120, 130);
    c.fillStyle = 'rgba(23,24,28,0.22)'; c.fillRect(0, 500, 1120, 2);
  }
  function ytHost(c, x, y, s, t, talk) {
    const ta = talk ? Math.pow(Math.abs(Math.sin(t * 11)), 2) * 0.07 : 0;
    TK.token(c, x, y + s * ta / 2, s, { sy: 1 - ta, sx: 1 + ta * 0.5, rot: Math.sin(t * 1.9) * 0.035 });
  }
  function ytHook(c, t) {
    const g = c.createLinearGradient(0, 0, 0, 630); g.addColorStop(0, '#0c1650'); g.addColorStop(1, '#2f5bff');
    c.fillStyle = g; c.fillRect(0, 0, 1120, 630);
    c.strokeStyle = 'rgba(255,255,255,0.09)'; c.lineWidth = 1.5; c.beginPath();
    for (let i = -10; i <= 10; i++) { c.moveTo(560, 330); c.lineTo(560 + i * 130, 630); }
    for (let k = 0; k < 5; k++) { const y = 330 + Math.pow(k / 5, 1.8) * 300 + 20; c.moveTo(0, y); c.lineTo(1120, y); }
    c.stroke();
    c.fillStyle = '#0a1033'; c.fillRect(0, 470, 330, 160); c.fillRect(790, 470, 330, 160);
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(0, 470, 330, 3); c.fillRect(790, 470, 330, 3);
    // the jump: already mid-air at frame one, rewinds at the end
    const fwd = lerp(0.2, 1, seg(t, 0, 0.85)), back = E.inQ(seg(t, 1.2, 1.5));
    const s = lerp(fwd, 0.2, back);
    const sp = v => ({ x: lerp(200, 930, v), y: 470 - 55 - 360 * 4 * v * (1 - v), r: v * TAU });
    for (let k = 6; k >= 1; k--) { const p = sp(Math.max(0, s - k * 0.035)); TK.token(c, p.x, p.y, 110, { rot: p.r, alpha: 0.05 + 0.025 * (6 - k), color: '#ffb08a' }); }
    if (t > 0.85 && t < 1.25) {   // dust
      const u = seg(t, 0.85, 1.25); c.fillStyle = `rgba(255,255,255,${0.5 * (1 - u)})`;
      for (let i = 0; i < 8; i++) { const a = PI + (i / 7) * PI; c.beginPath(); c.arc(930 + Math.cos(a) * (60 + 110 * u), 466 + Math.sin(a) * 30 * u, 6, 0, TAU); c.fill(); }
    }
    const q = t > 0.85 && t < 1.05 ? 1 - seg(t, 0.85, 1.05) : 0, p = sp(s);
    TK.token(c, p.x, s >= 0.999 ? 470 - 55 * (1 - 0.25 * q) : p.y, 110, { rot: p.r, sx: 1 + 0.25 * q, sy: 1 - 0.25 * q });
    // the payoff line
    const wk = spring(t - 0.87, 3, 0.45);
    if (t > 0.87 && t < 1.2) {
      c.save(); c.translate(560, 150); c.scale(wk, wk);
      text(c, 'IT ACTUALLY MADE IT.', 4, 6, { font: TK.FONT, weight: 900, size: 66, color: 'rgba(0,0,0,0.45)', align: 'center', base: 'middle' });
      text(c, 'IT ACTUALLY MADE IT.', 0, 0, { font: TK.FONT, weight: 900, size: 66, color: '#fff', align: 'center', base: 'middle' });
      c.restore();
    }
    // badge
    c.fillStyle = 'rgba(0,0,0,0.55)'; rrect(c, 24, 24, 330, 50, 10); c.fill();
    c.fillStyle = back > 0 ? P.accent : '#fff'; ffIcon(c, 56, 49, 22, back > 0 ? -1 : 1);
    label(c, back > 0 ? 'REWIND → 0:00' : '9:12 · FLASH-FORWARD', 84, 56, { size: 18, color: '#fff', weight: 700, ls: 2 });
    // rewind: tracking bands + big glyph
    if (back > 0) {
      const f = Math.floor(t * 30);
      for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(255,255,255,${0.12 + 0.2 * hash(i * 3.1 + f)})`; c.fillRect(0, hash(i * 7.3 + f * 1.7) * 600, 1120, 4 + hash(i + f) * 12); }
      c.fillStyle = 'rgba(255,255,255,0.85)'; ffIcon(c, 560, 260, 110, -1);
    }
  }
  function ytThumb(c, i, x, y, w, h) {
    c.save(); rrect(c, x, y, w, h, 8); c.clip();
    if (i === 0) {
      c.fillStyle = P.ground; c.fillRect(x, y, w, h);
      c.strokeStyle = P.ink; c.lineWidth = 4; c.strokeRect(x + w / 2 - 24, y + h / 2 - 24, 48, 48);
    } else if (i === 1) {
      c.fillStyle = P.ground2; c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(23,24,28,0.3)'; c.fillRect(x, y + h - 16, w, 2);
      c.fillStyle = 'rgba(23,24,28,0.25)'; for (let k = 0; k < 3; k++) c.fillRect(x + 20, y + 30 + k * 10, 40 - k * 8, 3);
      TK.token(c, x + w / 2 + 16, y + h - 38, 44, { rot: 0.6 });
    } else {
      const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#0c1650'); g.addColorStop(1, '#2f5bff');
      c.fillStyle = g; c.fillRect(x, y, w, h);
      c.fillStyle = '#0a1033'; c.fillRect(x, y + h - 18, 40, 18); c.fillRect(x + w - 40, y + h - 18, 40, 18);
      TK.token(c, x + w / 2, y + h / 2 - 8, 38, { rot: -0.5 });
    }
    c.restore();
    c.strokeStyle = P.ink; c.lineWidth = 2; rrect(c, x, y, w, h, 8); c.stroke();
  }
  function ytChapters(c, t) {
    ytSet(c, t, false); ytHost(c, 250, 400, 200, t, true);
    c.fillStyle = 'rgba(248,245,239,0.94)'; rrect(c, 480, 60, 600, 420, 18); c.fill();
    c.strokeStyle = 'rgba(23,24,28,0.15)'; c.lineWidth = 2; c.stroke();
    label(c, 'IN THIS VIDEO…', 520, 116, { size: 22, color: P.ink, weight: 700, ls: 5 });
    c.fillStyle = P.accent; c.fillRect(520, 132, 70 * E.outC(seg(t, 1.55, 1.9)), 4);
    YT_LIST.forEach(([t0, ts, name], i) => {
      if (t < t0 - 0.1) return;
      const k = spring(t - t0 + 0.12, 2.4, 0.55), y = 160 + i * 102;
      c.save(); c.globalAlpha *= clamp(k * 1.5); c.translate((1 - k) * 80, 0);
      ytThumb(c, i, 520, y, 150, 84);
      c.fillStyle = i === 2 ? P.accent : P.ink; rrect(c, 694, y + 4, 84, 32, 6); c.fill();
      text(c, mmss(ts), 736, y + 27, { font: TK.MONO, weight: 700, size: 18, color: '#fff', align: 'center' });
      text(c, name, 692, y + 80, { font: TK.FONT, weight: 900, size: 38, color: P.ink });
      c.restore();
    });
    if (t > 2.8) tag(c, 'THE HOOK', 940, 160 + 2 * 102 + 28, seg(t, 2.8, 3.0), { size: 15 });
  }
  function ytSting(c, t) {
    const u = t - 3.5;
    c.fillStyle = '#141518'; c.fillRect(0, 0, 1120, 630);
    c.save(); c.translate(560, 250); c.rotate(u * 0.5); c.fillStyle = 'rgba(255,90,31,0.08)';
    for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); c.beginPath(); c.moveTo(0, 0); c.lineTo(900, -80); c.lineTo(900, 80); c.closePath(); c.fill(); }
    c.restore();
    const k = spring(u + 0.08, 2.2, 0.5), out = E.inC(seg(u, 1.2, 1.5));   // already spinning in on the cut frame
    TK.token(c, 560, 250, 170 * k * (1 + out * 7), { rot: (1 - k) * -TAU * 0.75 });
    const rb = seg(u, 0.35, 0.9);
    if (rb > 0 && rb < 1) { c.strokeStyle = `rgba(255,90,31,${1 - rb})`; c.lineWidth = 6; c.beginPath(); c.arc(560, 250, 100 + 300 * E.outC(rb), 0, TAU); c.stroke(); }
    const wp = E.outC(seg(u, 0.45, 0.8));
    c.save(); c.beginPath(); c.rect(560 - 340, 380, 680 * wp, 110); c.clip();
    text(c, 'MOTION LAB', 560, 452, { font: TK.FONT, weight: 900, size: 76, color: '#fff', align: 'center', ls: 10 });
    c.restore();
    c.fillStyle = P.accent; c.fillRect(560 - 160 * wp, 478, 320 * wp, 5);
    if (out > 0) { c.fillStyle = `rgba(255,255,255,${out})`; c.fillRect(0, 0, 1120, 630); }
    // sting timer
    c.fillStyle = 'rgba(0,0,0,0.55)'; rrect(c, 856, 24, 240, 64, 10); c.fill();
    label(c, 'STING', 876, 52, { size: 14, color: 'rgba(255,255,255,0.7)', weight: 700, ls: 3 });
    text(c, `${clamp(u, 0, 1.5).toFixed(1)} S`, 1076, 54, { font: TK.MONO, weight: 700, size: 22, color: '#fff', align: 'right' });
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(876, 68, 200, 4);
    c.fillStyle = P.accent; c.fillRect(876, 68, 200 * clamp(u / 2), 4);
    c.fillStyle = '#fff'; c.fillRect(876 + 200 - 1, 62, 2, 16);
    label(c, '2 S', 1076, 86, { size: 10, color: 'rgba(255,255,255,0.6)', align: 'right', ls: 1 });
  }
  function ytSub(c, t) {
    ytSet(c, t, true); ytHost(c, 250, 400, 200, t, true);
    const inK = E.outB(seg(t, 5.15, 5.55)), outK = E.inC(seg(t, 7.15, 7.45));
    const X = lerp(-600, 410, inK), Y = 320 + outK * 380;
    c.save(); c.globalAlpha *= 1 - outK;
    c.fillStyle = 'rgba(23,24,28,0.12)'; rrect(c, X - 6, Y - 52, 640, 104, 52); c.fill();
    c.fillStyle = P.accent; c.beginPath(); c.arc(X + 44, Y, 40, 0, TAU); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke();
    TK.token(c, X + 44, Y, 38, { color: '#fff' });
    const subbed = t >= 6.0, pr = Math.sin(PI * seg(t, 5.95, 6.15));
    c.save(); c.translate(X + 270, Y); c.scale(1 - 0.08 * pr, 1 - 0.08 * pr);
    rrect(c, -170, -38, 340, 76, 38); c.fillStyle = subbed ? '#d8d2c5' : P.ink; c.fill();
    text(c, subbed ? 'SUBSCRIBED' : 'SUBSCRIBE', subbed ? 20 : 0, 10, { font: TK.FONT, weight: 900, size: 27, color: subbed ? P.ink : '#fff', align: 'center', ls: 2 });
    if (subbed) { c.strokeStyle = P.ink; c.lineWidth = 5; c.beginPath(); c.moveTo(-142, 0); c.lineTo(-132, 11); c.lineTo(-114, -10); c.stroke(); }
    c.restore();
    if (t > 6.1) {
      const bk = spring(t - 6.1, 2.6, 0.45), ring = t > 6.5, bx = X + 496;
      const rot = ring ? 0.55 * Math.sin((t - 6.5) * 28) * Math.exp(-(t - 6.5) * 3.2) : 0;
      c.save(); c.translate(bx, Y); c.scale(bk, bk);
      c.fillStyle = ring ? P.accent : '#fff'; c.beginPath(); c.arc(0, 0, 38, 0, TAU); c.fill();
      c.strokeStyle = P.ink; c.lineWidth = 3; c.stroke();
      c.fillStyle = ring ? '#fff' : P.ink; bellIcon(c, 0, 2, 40, rot);
      if (ring && t < 7.1) {
        const a = 1 - seg(t, 6.5, 7.1); c.strokeStyle = `rgba(255,90,31,${a})`; c.lineWidth = 4;
        [-1, 1].forEach(d => { for (let k = 0; k < 2; k++) { c.beginPath(); c.arc(0, -4, 52 + k * 14, d > 0 ? -0.6 : PI - 0.5, d > 0 ? 0.5 : PI + 0.6); c.stroke(); } });
      }
      c.restore();
      if (ring) label(c, 'ALL NOTIFICATIONS', bx, Y + 66, { size: 13, color: P.ink, weight: 700, align: 'center', ls: 2 });
    }
    c.restore();
    if (t > 5.45 && t < 7.15) {
      const cx = kf(t, [[5.45, 1060], [5.85, X + 290], [6.2, X + 290], [6.45, X + 510]]);
      const cy = kf(t, [[5.45, 560], [5.85, Y + 6], [6.2, Y + 6], [6.45, Y + 8]]);
      const press = Math.max(Math.sin(PI * seg(t, 5.95, 6.15)), Math.sin(PI * seg(t, 6.45, 6.65)));
      pointer(c, cx, cy, press);
    }
  }
  function ytGo(c, t) {
    if (t < 9.0) {
      ytSet(c, t, true);
      const hop = Math.max(0, Math.sin(PI * seg(t, 8.45, 8.85))) * 90;
      ytHost(c, 250, 400 - hop, 200, t, t < 8.4);
    } else {
      c.fillStyle = P.accent; c.fillRect(0, 0, 1120, 630);
      const k = spring(t - 9.0, 2.4, 0.5);
      label(c, 'CHAPTER 01', 110 - (1 - k) * 40, 190, { size: 26, color: P.ink, weight: 700, ls: 8 });
      text(c, 'THE SQUARE', 104 - (1 - k) * 90, 310, { font: TK.FONT, weight: 900, size: 116, color: P.ink });
      const d = E.ioC(seg(t, 9.15, 9.7));
      c.strokeStyle = P.ink; c.lineWidth = 9; c.setLineDash([520 * d, 600]);
      c.strokeRect(112, 360, 120, 120); c.setLineDash([]);
      label(c, '0:09 → 4:05', 262, 430, { size: 22, color: P.ink, weight: 700, ls: 3, base: 'middle' });
    }
  }
  function ytChrome(c, t) {
    const g = c.createLinearGradient(0, 520, 0, 630); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
    c.fillStyle = g; c.fillRect(0, 520, 1120, 110);
    const by = 584, vt = t;
    YT_CH.forEach(([a], i) => {
      const b = YT_CH[i + 1] ? YT_CH[i + 1][0] : YT_LEN, x0 = ytBX(a) + (i ? 2 : 0), x1 = ytBX(b) - (YT_CH[i + 1] ? 2 : 0);
      const hot = YT_LIST.some(([t0, ts]) => ts === a && t >= t0 && t < t0 + 0.9);
      const hh = hot ? 9 : 5;
      c.fillStyle = 'rgba(255,255,255,0.32)'; c.fillRect(x0, by - hh / 2, x1 - x0, hh);
      c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(x0, by - hh / 2, Math.max(0, Math.min(x1, ytBX(vt + 40)) - x0), hh);
      c.fillStyle = P.accent; c.fillRect(x0, by - hh / 2, Math.max(0, Math.min(x1, ytBX(vt)) - x0), hh);
    });
    c.fillStyle = P.accent; c.beginPath(); c.arc(ytBX(vt), by, 8, 0, TAU); c.fill();
    // chapter tooltips as each chapter is named
    YT_LIST.forEach(([t0, ts, name]) => {
      const a = win(t, t0 - 0.06, t0 + 0.9, 0.08); if (a <= 0 || t < 1.5) return;
      const x = clamp(ytBX(ts), 110, 1010);
      c.save(); c.globalAlpha *= a;
      c.fillStyle = 'rgba(16,16,18,0.9)'; rrect(c, x - 100, by - 66, 200, 44, 8); c.fill();
      label(c, `${mmss(ts)} · ${name}`, x, by - 37, { size: 15, color: '#fff', weight: 700, align: 'center', ls: 1 });
      c.restore();
    });
    // controls row
    const cy = 612; c.fillStyle = '#fff';
    c.fillRect(24, cy - 10, 6, 20); c.fillRect(36, cy - 10, 6, 20);
    c.beginPath(); c.moveTo(62, cy - 10); c.lineTo(76, cy); c.lineTo(62, cy + 10); c.closePath(); c.fill(); c.fillRect(77, cy - 10, 3, 20);
    c.beginPath(); c.moveTo(98, cy - 5); c.lineTo(104, cy - 5); c.lineTo(112, cy - 11); c.lineTo(112, cy + 11); c.lineTo(104, cy + 5); c.lineTo(98, cy + 5); c.closePath(); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(114, cy, 9, -0.8, 0.8); c.stroke();
    const chn = YT_CH.filter(ch => ch[0] <= vt).pop()[1];
    label(c, `${mmss(vt)} / ${mmss(YT_LEN)}`, 142, cy + 7, { size: 17, color: '#fff', ls: 1 });
    label(c, `·  ${chn}  ›`, 300, cy + 7, { size: 17, color: '#fff', ls: 1, weight: 700 });
    c.strokeStyle = '#fff'; c.lineWidth = 2;
    rrect(c, 960, cy - 9, 28, 18, 3); c.stroke(); label(c, 'CC', 974, cy + 5, { size: 10, color: '#fff', align: 'center', ls: 0, weight: 700 });
    c.beginPath(); c.arc(1024, cy, 9, 0, TAU); c.stroke(); c.beginPath(); c.arc(1024, cy, 3, 0, TAU); c.stroke();
    c.beginPath(); [[1060, -1, -1], [1086, 1, -1], [1060, -1, 1], [1086, 1, 1]].forEach(([x, sx, sy]) => { c.moveTo(x, cy + sy * 3); c.lineTo(x, cy + sy * 9); c.lineTo(x - sx * 6, cy + sy * 9); }); c.stroke();
  }

  MG.film({
    id: 'formatyoutube', dur: 10, poster: 6.6,
    fonts,
    meta: {
      family: 'M', name: 'Creator Intro', sub: 'Hook, chapters, sting, subscribe — then the video', era: '2012 —',
      origin: 'Early online videos, after YouTube opened in 2005, often began like television: a long animated channel intro. When YouTube began ranking videos by watch time in 2012 and creators started reading the audience-retention graph in their analytics, the long intro gave way to the hook: open on the most striking moment — often a flash-forward to the payoff — say what the video will deliver, keep any branded sting to a second or two, ask for the subscribe and the notification bell early, and get into it. In 2020 YouTube added chapters: timestamps in the description split the progress bar into named segments, and the spoken “in this video…” list became a visible one. YouTube Studio reports how many viewers are still watching at 0:30, which is where the hook earns its place.',
      works: 'MrBeast (Jimmy Donaldson) videos, which open on the payoff · Marques Brownlee (MKBHD), a cold open then a short channel sting · Veritasium (Derek Muller, 2011 —), question-first hooks',
      tech: ['Flash-forward hook to the payoff', '“In this video…” list = chapter markers', 'Sting under 2 s, subscribe + bell early'],
      accent: '#ff5a1f',
      motionDNA: 'Frame one is already mid-jump: a clip from 9:12, the payoff, lands at 1.0 s and rewinds to 0:00. The host Token talks while three chapters spring in on the beat, each dropping its marker on the progress bar. A 1.5 s sting — Token spin-in, ring burst, wordmark wipe, white-out. A subscribe lower third slides in, a cursor clicks it, then the bell, which swings and rings. The host hops and the film hard-cuts to the chapter-one card on the downbeat at 9 s.',
      visualDNA: 'A generic 16:9 player on the Technique Atlas paper: a creator set (warm wall, orange key-light glow, shelf props), a cobalt flash-forward stunt, an ink-black sting, an orange chapter card; generic player chrome with chapter gaps in the progress bar and tooltips. Beside it, an illustrative retention graph (hook-first vs. slow intro) and the five intro conventions with their timings.',
      transitions: 'Rewind scrub from the flash-forward; hard cuts; white-out from the sting; a lower third that slides in and drops away',
      implementation: ['Premiere / Final Cut edit; sting and lower third from After Effects or a template pack', 'Chapters from description timestamps (first at 0:00)', 'Canvas 2D: the video drawn in a clipped player rect under generic chrome; retention curves are analytic functions'],
      reproducibility: 'Fully procedural (generic player UI, fictional channel, illustrative retention data)',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      c.fillStyle = 'rgba(23,24,28,0.12)'; rrect(c, YP.x + 8, YP.y + 10, YP.w, YP.h, 14); c.fill();
      c.save(); rrect(c, YP.x, YP.y, YP.w, YP.h, 14); c.clip(); c.translate(YP.x, YP.y);
      if (t < 1.5) ytHook(c, t);
      else if (t < 3.5) ytChapters(c, t);
      else if (t < 5.0) ytSting(c, t);
      else if (t < 7.5) ytSub(c, t);
      else ytGo(c, t);
      subtitle(c, 'if you’re new here…', 250, 556, 26, win(t, 5.05, 6.0, 0.08));
      subtitle(c, 'hit subscribe and the bell.', 560, 556, 28, win(t, 6.0, 7.1, 0.08));
      subtitle(c, 'okay. let’s get into it.', 560, 556, 30, win(t, 7.6, 8.95, 0.08));
      ytChrome(c, t);
      c.restore();
      // the flash-forward, mapped onto the progress bar
      const fa = win(t, 0.15, 1.45, 0.2);
      if (fa > 0) {
        const by = YP.y + 584, xa = YP.x + ytBX(YT_PAY), xb = YP.x + ytBX(0) + 4;
        c.save(); c.globalAlpha *= fa;
        c.strokeStyle = P.accent; c.lineWidth = 3; c.setLineDash([10, 8]);
        c.beginPath(); c.moveTo(xa, by - 10); c.quadraticCurveTo((xa + xb) / 2, by - 150, xb, by - 12); c.stroke(); c.setLineDash([]);
        c.fillStyle = P.accent; c.beginPath(); c.moveTo(xb, by - 8); c.lineTo(xb - 6, by - 26); c.lineTo(xb + 12, by - 22); c.closePath(); c.fill();
        c.beginPath(); c.arc(xa, by, 9, 0, TAU); c.fill();
        c.fillStyle = 'rgba(16,16,18,0.85)'; rrect(c, (xa + xb) / 2 - 190, by - 112, 380, 34, 8); c.fill();
        label(c, 'A CLIP FROM 9:12, SHOWN AT 0:00', (xa + xb) / 2, by - 89, { size: 14, color: '#fff', weight: 700, align: 'center', ls: 2 });
        c.restore();
      }
      // under the player: title + channel row
      text(c, 'How the Token learned to jump (it took 400 tries)', YP.x, 778, { font: TK.FONT, weight: 800, size: 28, color: P.ink });
      c.fillStyle = P.accent; c.beginPath(); c.arc(YP.x + 24, 826, 24, 0, TAU); c.fill();
      TK.token(c, YP.x + 24, 826, 22, { color: '#fff' });
      text(c, 'Motion Lab', YP.x + 60, 822, { font: TK.FONT, weight: 800, size: 22, color: P.ink });
      label(c, '48.2K SUBSCRIBERS', YP.x + 60, 846, { size: 12, ls: 1.5 });
      const subbed = t >= 6.0;
      c.fillStyle = subbed ? '#d8d2c5' : P.ink; rrect(c, YP.x + 270, 805, 150, 42, 21); c.fill();
      text(c, subbed ? 'Subscribed' : 'Subscribe', YP.x + 345, 833, { font: TK.FONT, weight: 800, size: 19, color: subbed ? P.ink : '#fff', align: 'center' });
      if (t >= 6.5) { c.fillStyle = '#d8d2c5'; c.beginPath(); c.arc(YP.x + 448, 826, 21, 0, TAU); c.fill(); c.fillStyle = P.ink; bellIcon(c, YP.x + 448, 828, 22, 0.3 * Math.sin((t - 6.5) * 26) * Math.exp(-(t - 6.5) * 3)); }
      [['Like · 12K', 840], ['Share', 980], ['Save', 1090]].forEach(([s, x]) => {
        const w = measure(c, s, 18, 700) + 36;
        c.fillStyle = 'rgba(23,24,28,0.08)'; rrect(c, x, 805, w, 42, 21); c.fill();
        text(c, s, x + w / 2, 833, { font: TK.FONT, weight: 700, size: 18, color: P.ink, align: 'center' });
      });
      // ---- right column ----
      const RX = 1250, RW = 598;
      label(c, 'THE FIRST 10 S OF A 12:48 VIDEO', RX, 112, { size: 17, color: P.ink, weight: 700, ls: 2 });
      label(c, 'INTRO CHAPTER 0:00–0:09 · 1 % OF THE RUNTIME', RX, 136, { size: 12, ls: 2 });
      const G = { x: RX, y: 200, w: RW, h: 220 };
      const GX = s => G.x + G.w * s / 60, GY = v => G.y + G.h * (100 - v) / 70;
      label(c, 'AUDIENCE RETENTION · FIRST 60 S', G.x, G.y - 16, { size: 13, color: P.ink, weight: 700, ls: 2 });
      label(c, 'ILLUSTRATIVE', G.x + G.w, G.y - 16, { size: 11, align: 'right', ls: 2 });
      c.fillStyle = 'rgba(47,91,255,0.07)'; c.fillRect(G.x, G.y, GX(30) - G.x, G.h);
      label(c, 'FIRST 30 S', GX(15), G.y + G.h - 10, { size: 11, align: 'center', color: P.blue, weight: 700, ls: 2 });
      c.strokeStyle = 'rgba(23,24,28,0.25)'; c.lineWidth = 1; c.strokeRect(G.x + 0.5, G.y + 0.5, G.w, G.h);
      [100, 75, 50].forEach(v => { c.fillStyle = 'rgba(23,24,28,0.1)'; c.fillRect(G.x, GY(v), G.w, 1); label(c, `${v}%`, G.x - 6, GY(v) + 4, { size: 10, ls: 0, align: 'right' }); });
      [0, 15, 30, 45, 60].forEach(s => label(c, `0:${String(s % 60).padStart(2, '0')}`.replace('0:00', s ? '1:00' : '0:00'), GX(s), G.y + G.h + 18, { size: 10, align: s === 0 ? 'left' : s === 60 ? 'right' : 'center', ls: 1 }));
      const curve = (f, col, lw, dash) => {
        c.strokeStyle = col; c.lineWidth = lw; c.setLineDash(dash || []); c.beginPath();
        for (let i = 0; i <= 90; i++) { const s = i / 90 * 60, x = GX(s), y = GY(f(s)); i ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.stroke(); c.setLineDash([]);
      };
      curve(retSlow, 'rgba(23,24,28,0.45)', 2, [7, 6]);
      curve(retHook, P.accent, 3.5);
      c.fillStyle = P.ink; c.fillRect(GX(t) - 1, G.y, 2, G.h);
      c.fillStyle = P.accent; c.beginPath(); c.arc(GX(t), GY(retHook(t)), 6, 0, TAU); c.fill();
      c.fillStyle = P.mute; c.beginPath(); c.arc(GX(t), GY(retSlow(t)), 5, 0, TAU); c.fill();
      const ra = seg(t, 0.6, 1.1);
      if (ra > 0) {
        c.save(); c.globalAlpha *= ra;
        c.fillStyle = 'rgba(23,24,28,0.3)'; c.fillRect(GX(30) - 0.5, G.y, 1, G.h);
        c.fillStyle = P.accent; c.beginPath(); c.arc(GX(30), GY(retHook(30)), 6, 0, TAU); c.fill();
        c.fillStyle = P.ink; c.beginPath(); c.arc(GX(30), GY(retSlow(30)), 5, 0, TAU); c.fill();
        label(c, `${Math.round(retHook(30))} %`, GX(30) + 12, GY(retHook(30)) - 10, { size: 15, color: P.accentD, weight: 700, ls: 1 });
        label(c, `${Math.round(retSlow(30))} %`, GX(30) + 12, GY(retSlow(30)) + 20, { size: 15, color: P.ink, weight: 700, ls: 1 });
        c.restore();
      }
      c.fillStyle = P.accent; c.fillRect(G.x, 460, 28, 4);
      label(c, 'HOOK FIRST', G.x + 38, 467, { size: 12, color: P.ink, weight: 700, ls: 2 });
      c.fillStyle = P.mute; c.fillRect(G.x + 170, 460, 10, 3); c.fillRect(G.x + 186, 460, 10, 3);
      label(c, 'SLOW INTRO', G.x + 206, 467, { size: 12, ls: 2 });
      label(c, 'STILL WATCHING AT 0:30', G.x + G.w, 467, { size: 12, ls: 2, align: 'right', color: P.ink });
      YT_ROWS.forEach(([a, b, n, s], i) => {
        const y = 540 + i * 70, cur = t >= a && t < b, past = t >= b;
        if (cur) { c.fillStyle = 'rgba(255,90,31,0.10)'; c.fillRect(RX, y - 28, RW, 62); c.fillStyle = P.accent; c.fillRect(RX, y - 28, 4, 62); }
        label(c, `${a.toFixed(1)}–${b.toFixed(1)} S`, RX + 16, y, { size: 13, color: cur ? P.accentD : P.mute, weight: 700, ls: 1 });
        label(c, n, RX + 150, y, { size: 16, color: cur || past ? P.ink : P.mute, weight: cur ? 700 : 400, ls: 2 });
        label(c, s, RX + 150, y + 22, { size: 12, ls: 1.5, color: P.mute });
      });
      FK.strip(c, t, W, H, YT_BEATS, { label: 'Creator intro · 16:9' });
      FK.caption(c, t, W, H, { name: 'Creator Intro', cat: 'Social' });
    },
    score(A) {
      // hook: mid-jump whoosh, the landing, the rewind
      A.whoosh(0, 0.85, { f1: 500, f2: 3200, g: 0.1, swell: 0.85 });
      A.osc(0, { type: 'sawtooth', f: midi(45), f2: midi(57), glide: 0.85, dur: 0.85, g: 0.03, lp: 1400 });
      A.impact(0.85, 0.32); A.kick(0.85, 0.38, { f: 140, f2: 45 });
      A.chord(0.87, [57, 64, 69, 73], { type: 'sawtooth', dur: 0.3, g: 0.03, lp: 2800, width: 0.8 });
      A.osc(1.2, { type: 'sawtooth', f: 1500, f2: 90, glide: 0.3, dur: 0.3, g: 0.04, lp: 3200 });
      A.noise(1.2, { type: 'bandpass', f: 3200, f2: 400, dur: 0.3, g: 0.08 });
      // lo-fi bed under the host (out for the sting)
      const ch = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
      for (let b = 3; b < 20; b++) {
        const t = b * 0.5; if (t >= 3.5 && t < 5.0) continue;
        A.kick(t, b % 2 ? 0.14 : 0.24, { f: 110, f2: 42 });
        if (b % 2) A.snare(t, 0.05, { dur: 0.12 });
        A.hat(t + 0.25, 0.028, false, { pan: 0.25 });
      }
      [[1.5, 0], [2.5, 1], [5.0, 2], [6.5, 3], [7.5, 0], [8.5, 1]].forEach(([t, i]) => A.chord(t, ch[i], { type: 'triangle', dur: 1.1, g: 0.022, a: 0.05, lp: 1400, rev: 0.4, width: 0.7 }));
      // chapter rows + markers
      YT_LIST.forEach(([t], i) => { A.pluck(t, midi([72, 76, 79][i]), { g: 0.18, bright: 0.7, dur: 0.7 }); A.osc(t, { f: 2600, dur: 0.03, g: 0.04 }); });
      // sting (1.5 s)
      [60, 64, 67, 72].forEach((m, i) => A.pluck(3.5 + i * 0.08, midi(m), { g: 0.16, bright: 0.8, dur: 0.6 }));
      A.impact(3.85, 0.3); A.kick(3.85, 0.4, { f: 150, f2: 45 });
      A.chord(3.85, [48, 55, 64, 67, 72], { type: 'sawtooth', dur: 0.9, g: 0.028, a: 0.01, lp: 3000, lp2: 900, lpT: 0.9, rev: 0.5, width: 0.8 });
      A.bell(3.95, midi(84), { g: 0.07, dur: 1.0 });
      A.whoosh(3.95, 0.35, { f1: 800, f2: 4000, g: 0.06, pan: 0.3 });
      A.riser(4.6, 0.4, { g: 0.08, f: 220 });
      // subscribe: slide, click, bell
      A.whoosh(5.15, 0.35, { f1: 300, f2: 2400, g: 0.07, pan: -0.3 });
      A.osc(6.0, { f: 2400, f2: 1200, glide: 0.03, dur: 0.04, g: 0.08 }); A.noise(6.0, { type: 'highpass', f: 5000, dur: 0.02, g: 0.06 });
      A.pluck(6.02, midi(79), { g: 0.16, dur: 0.6, bend: 1.12, bendT: 0.06 });
      A.osc(6.5, { f: 2400, f2: 1200, glide: 0.03, dur: 0.04, g: 0.08 });
      [0, 0.12, 0.24, 0.36].forEach((d, i) => A.bell(6.5 + d, midi(i % 2 ? 91 : 88), { g: 0.07 / (1 + i * 0.6), dur: 0.8, pan: i % 2 ? 0.3 : -0.3 }));
      A.whoosh(7.15, 0.3, { f1: 2400, f2: 400, g: 0.05 });
      // let's go: hop, chapter card on the downbeat
      A.osc(8.45, { type: 'triangle', f: 330, f2: 760, glide: 0.2, dur: 0.25, g: 0.06 });
      A.whoosh(8.7, 0.3, { f1: 400, f2: 3000, g: 0.07 });
      A.kick(9.0, 0.42, { f: 130, f2: 42 }); A.clap(9.0, 0.16);
      A.chord(9.0, [48, 55, 60, 64, 67], { type: 'triangle', dur: 1.0, g: 0.04, a: 0.01, lp: 2800, rev: 0.5, width: 0.8 });
      A.bell(9.0, midi(84), { g: 0.06, dur: 1.0 });
      A.osc(9.15, { type: 'square', f: midi(60), dur: 0.5, g: 0.02, lp: 1200 });
    },
  });

  /* =====================================================================
     DUET / REACTION — one vertical frame split down the middle. Left, the
     original: the letters of MOTION dropped one by one into a tower on the
     beat, the tower wobbling more with each block, then falling. Right, the
     reactor (the Token, under a ring light) answering every beat six frames
     late — nod, nod, lean in, gasp, flinch, cheer, cringe — with the
     comment it is replying to pinned as a sticker on top. The punchline
     has no call: the reactor jumps, taps the sticker and gets the last
     word. Beside the frame, the two lanes of call and response, a frame
     ruler for the lag and who holds the floor.
     ===================================================================== */
  const DF = { x: 72, y: 104, w: 438, h: 780 };
  const DU_CALL = [[0.5, 'M'], [1.5, 'O'], [2.5, 'T'], [3.5, 'I'], [4.5, 'O'], [5.5, 'N'], [7.0, 'FALL']];
  const DU_RESP = ['NOD', 'NOD', 'LEAN IN', 'GASP', 'FLINCH', 'CHEER', 'CRINGE'];
  const DU_LAG = 0.2, DU_PUNCH = 8.38, DU_LAND = 8.7;
  const DU_BEATS = [
    { t0: 0, t1: 0.5, name: 'Reply', kind: 'hook' },
    { t0: 0.5, t1: 3.4, name: 'Call · response', kind: 'act' },
    { t0: 3.4, t1: 6.6, name: 'Escalate', kind: 'act' },
    { t0: 6.6, t1: 7.6, name: 'The turn', kind: 'turn' },
    { t0: 7.6, t1: 10, name: 'Punchline · last word', kind: 'title' },
  ];
  const DU_NOTES = [
    [0, 'REPLY STICKER', 'THE COMMENT BEING ANSWERED, PINNED ON TOP'],
    [0.5, 'CALL → RESPONSE', 'EVERY BEAT OF THE ORIGINAL GETS A REACTION'],
    [3.4, 'ESCALATION', 'BIGGER BEATS, BIGGER REACTIONS'],
    [6.6, 'THE TURN', 'THE ORIGINAL FAILS · THE REACTOR CRINGES'],
    [7.6, 'PUNCHLINE · NO CALL', 'THE REACTOR GETS THE LAST WORD'],
  ];
  const BW = 150, BH = 72, BASEX = 219, FLOOR = 650;
  const DU_PILE = [[219, FLOOR - 36, 0], [92, FLOOR - 36, -0.05], [350, FLOOR - 36, 0.07], [150, FLOOR - 104, 0.28], [300, FLOOR - 100, -0.32], [222, FLOOR - 168, 0.62]];
  function duTheta(t) {
    let th = 0;
    if (t > 3.6) th += 0.022 * Math.sin(TAU * 1.4 * (t - 3.6)) * Math.exp(-(t - 3.6) * 1.2);
    if (t > 4.6) th += 0.055 * Math.sin(TAU * 1.2 * (t - 4.6)) * Math.exp(-(t - 4.6) * 1.1);
    if (t > 5.6) th += 0.03 * Math.sin(TAU * 1.5 * (t - 5.6)) * Math.exp(-(t - 5.6) * 2);
    if (t > 6.4) th += 0.035 * seg(t, 6.4, 6.9) * Math.sin(TAU * 1.7 * (t - 6.4)) + 0.16 * E.inQ(seg(t, 6.75, 7.0));
    return th;
  }
  function duBlock(c, x, y, rot, i, sq = 0) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(1 + sq * 0.6, 1 - sq);
    rrect(c, -BW / 2, -BH / 2, BW, BH, 10); c.fillStyle = i === 5 ? P.accent : '#f8f5ef'; c.fill();
    c.lineWidth = 3; c.strokeStyle = P.ink; c.stroke();
    text(c, 'MOTION'[i], 0, 3, { font: TK.FONT, weight: 900, size: 52, color: P.ink, align: 'center', base: 'middle' });
    c.restore();
  }
  function duOrig(c, t) {
    c.fillStyle = P.ground; c.fillRect(0, 0, DF.w, DF.h);
    c.strokeStyle = P.line; c.lineWidth = 1; c.beginPath();
    for (let x = 0; x <= DF.w; x += 60) { c.moveTo(x, 0); c.lineTo(x, DF.h); }
    for (let y = 0; y <= DF.h; y += 60) { c.moveTo(0, y); c.lineTo(DF.w, y); }
    c.stroke();
    c.fillStyle = P.ground2; c.fillRect(0, FLOOR, DF.w, DF.h - FLOOR);
    c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(0, FLOOR, DF.w, 2);
    const th = duTheta(Math.min(t, 7.0));
    if (t < 7.0) {
      c.save(); c.translate(BASEX, FLOOR); c.rotate(th);
      for (let i = 0; i < 6; i++) {
        const land = DU_CALL[i][0]; if (t < land - 0.32) continue;
        const ty = -BH / 2 - i * BH, d = E.inQ(seg(t, land - 0.32, land)), y = lerp(-FLOOR - 80, ty, d);
        const sq = t > land ? 0.16 * Math.exp(-(t - land) * 14) : 0;
        duBlock(c, 0, y + BH / 2 * sq, 0, i, sq);
      }
      c.restore();
    } else {
      const th0 = duTheta(7.0);
      for (let i = 0; i < 6; i++) {
        const r = BH / 2 + i * BH, x0 = BASEX + Math.sin(th0) * r, y0 = FLOOR - Math.cos(th0) * r;
        const [px, py, pr] = DU_PILE[i], dd = 0.28 + i * 0.06, u = seg(t, 7.0, 7.0 + dd);
        const sq = t > 7.0 + dd ? 0.12 * Math.exp(-(t - 7.0 - dd) * 14) : 0;
        duBlock(c, lerp(x0, px, E.outQ(u)), lerp(y0, py, E.inQ(u)), lerp(th0, pr, u), i, sq);
      }
    }
    // stack counter
    const n = t >= 7.0 ? 0 : DU_CALL.slice(0, 6).filter(cl => t >= cl[0]).length;
    c.fillStyle = n === 6 ? P.accent : P.ink; rrect(c, 24, 92, 150, 58, 12); c.fill();
    text(c, `${n} / 6`, 99, 133, { font: TK.FONT, weight: 900, size: 34, color: '#fff', align: 'center' });
    // header
    c.fillStyle = P.ink; c.beginPath(); c.arc(40, 46, 18, 0, TAU); c.fill();
    text(c, '@motion.word', 68, 54, { font: TK.FONT, weight: 800, size: 22, color: P.ink });
    label(c, 'ORIGINAL', DF.w - 20, 53, { size: 13, color: P.mute, align: 'right', weight: 700, ls: 2 });
  }
  function duPose(t) {
    let x = 0, y = 0, rot = 0, sx = 1, sy = 1, sym = null, symT = 0;
    DU_CALL.forEach(([tc], i) => {
      const r = tc + DU_LAG, u = t - r; if (u < 0) return;
      const ty = DU_RESP[i];
      if (ty === 'NOD') { y += 18 * Math.sin(PI * seg(u, 0, 0.28)); }
      else if (ty === 'LEAN IN') { rot += -0.18 * E.outC(seg(u, 0, 0.3)) * (1 - seg(t, 4.7, 4.9)); x -= 24 * E.outC(seg(u, 0, 0.3)) * (1 - seg(t, 4.7, 4.9)); }
      else if (ty === 'GASP') { const k = Math.sin(PI * seg(u, 0, 0.4)); sy *= 1 + 0.16 * k; sx *= 1 - 0.08 * k; if (u < 0.85) { sym = '!'; symT = r; } }
      else if (ty === 'FLINCH') { const k = E.outC(seg(u, 0, 0.12)) * (1 - E.ioC(seg(u, 0.45, 0.9))); x += 46 * k; rot += 0.22 * k; if (u < 0.85) { sym = '?!'; symT = r; } }
      else if (ty === 'CHEER') { y -= 130 * Math.sin(PI * seg(u, 0, 0.5)); rot += TAU * E.ioC(seg(u, 0, 0.5)); if (u < 1.1) { sym = '!!!'; symT = r; } }
      else if (ty === 'CRINGE') { const k = E.outC(seg(u, 0, 0.12)) * (1 - seg(u, 0.5, 0.75)); sy *= 1 - 0.24 * k; sx *= 1 + 0.12 * k; x += vnoise(t * 40, 4) * 7 * k; if (u < 0.55) { sym = '!!'; symT = r; } }
    });
    if (t > 7.75 && t < 8.1) { sym = '…'; symT = 7.75; }
    // punchline: jump, tap the sticker at the apex, land
    const jp = seg(t, 8.06, DU_LAND);
    if (jp > 0 && jp < 1) { y -= 290 * Math.sin(PI * jp); rot += TAU * E.ioC(seg(t, 8.12, 8.62)); }
    if (t > DU_LAND) { const q = 0.22 * Math.exp(-(t - DU_LAND) * 9); sy *= 1 - q; sx *= 1 + q * 0.7; }
    return { x, y, rot, sx, sy, sym, symT };
  }
  function duReact(c, t) {
    const g = c.createLinearGradient(0, 0, 0, DF.h); g.addColorStop(0, '#262d42'); g.addColorStop(1, '#12151f');
    c.fillStyle = g; c.fillRect(0, 0, DF.w, DF.h);
    const rg = c.createRadialGradient(219, 470, 40, 219, 470, 260); rg.addColorStop(0, 'rgba(255,236,214,0.22)'); rg.addColorStop(1, 'rgba(255,236,214,0)');
    c.fillStyle = rg; c.fillRect(0, 200, DF.w, 560);
    c.strokeStyle = 'rgba(255,240,222,0.55)'; c.lineWidth = 14; c.beginPath(); c.arc(219, 450, 160, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 3; c.beginPath(); c.arc(219, 450, 160, 0, TAU); c.stroke();
    c.fillStyle = '#0c0f17'; c.fillRect(0, FLOOR, DF.w, DF.h - FLOOR);
    c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(0, FLOOR, DF.w, 2);
    const p = duPose(t), S = 180, ty = FLOOR - S / 2;
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.beginPath(); c.ellipse(219 + p.x, FLOOR + 4, 90 * clamp(1 + p.y / 400, 0.4, 1), 9, 0, 0, TAU); c.fill();
    TK.token(c, 219 + p.x, ty + p.y + S * (1 - p.sy) / 2, S, { rot: p.rot, sx: p.sx, sy: p.sy });
    if (p.sym) {
      const k = spring(t - p.symT, 3, 0.4);
      c.save(); c.translate(219 + p.x + 120, ty - 110); c.rotate(0.12); c.scale(k, k);
      text(c, p.sym, 0, 0, { font: TK.FONT, weight: 900, size: p.sym === '…' ? 70 : 76, color: p.sym === '…' ? CREAM : P.accent, align: 'center', base: 'middle' });
      c.restore();
    }
    // reply sticker
    const sk = spring(t - 0.08, 2.6, 0.45), tap = t > DU_PUNCH ? Math.exp(-(t - DU_PUNCH) * 6) * Math.sin((t - DU_PUNCH) * 30) : 0;
    c.save(); c.translate(219, 150); c.rotate(-0.03 + 0.05 * tap); c.scale(sk * (1 + 0.1 * Math.abs(tap)), sk * (1 + 0.1 * Math.abs(tap)));
    c.fillStyle = '#fff'; rrect(c, -190, -50, 380, 100, 18); c.fill();
    c.beginPath(); c.moveTo(-150, 48); c.lineTo(-170, 76); c.lineTo(-118, 48); c.closePath(); c.fill();
    c.fillStyle = P.blue; c.beginPath(); c.arc(-160, -22, 11, 0, TAU); c.fill();
    label(c, 'REPLYING TO @lurker.42', -140, -16, { size: 13, color: P.mute, weight: 700, ls: 1 });
    text(c, '“bet it falls.”', -166, 30, { font: TK.FONT, weight: 800, size: 34, color: P.ink });
    if (t > DU_PUNCH) {
      const ck = spring(t - DU_PUNCH, 3, 0.45);
      c.save(); c.translate(160, -40); c.scale(ck, ck);
      c.fillStyle = P.accent; c.beginPath(); c.arc(0, 0, 26, 0, TAU); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.moveTo(-11, 0); c.lineTo(-3, 9); c.lineTo(12, -9); c.stroke();
      c.restore();
    }
    c.restore();
    // punchline
    if (t > 8.45) {
      const k = spring(t - 8.45, 2.6, 0.42);
      c.save(); c.translate(219, 300); c.rotate(-0.06); c.scale(k, k);
      text(c, 'CALLED IT.', 3, 5, { font: TK.FONT, weight: 900, size: 64, color: 'rgba(0,0,0,0.5)', align: 'center', base: 'middle' });
      text(c, 'CALLED IT.', 0, 0, { font: TK.FONT, weight: 900, size: 64, color: P.accent, align: 'center', base: 'middle' });
      c.restore();
    }
    // header
    c.fillStyle = P.accent; c.beginPath(); c.arc(40, 46, 18, 0, TAU); c.fill();
    TK.token(c, 40, 46, 18, { color: '#fff' });
    text(c, '@token.reacts', 68, 54, { font: TK.FONT, weight: 800, size: 22, color: '#fff' });
  }

  MG.film({
    id: 'formatduet', dur: 10, poster: 5.05,
    fonts,
    meta: {
      family: 'M', name: 'Duet / Reaction', sub: 'Call and response, a few frames late', era: '2010 —',
      origin: 'The reaction shot is as old as film editing, and Japanese variety television made a fixed convention of the wipe: a corner inset of the studio guests reacting to a taped segment. Online, reaction videos became their own genre on YouTube around 2010 with the Fine Brothers’ Kids React. Musical.ly’s duet put the original clip and the response side by side in one vertical frame; TikTok carried it over when it absorbed Musical.ly in 2018, added Stitch (clip the original, then answer it) in 2020, and let creators answer a comment with a video that carries the comment as a sticker. The craft is timing — each reaction lands just after the beat it answers, about a human reaction time — and the reactor keeps the last word.',
      works: 'Kids React (the Fine Brothers, YouTube, 2010 —) · TikTok Duet (2018 —, from Musical.ly) and Stitch (2020 —) · the wipe inset in Japanese variety television',
      tech: ['Split frame: original | reactor', 'Each reaction lags its beat by ~6 frames', 'Reply sticker and the punchline with no call'],
      accent: '#ff5a1f',
      motionDNA: 'The original keeps the clock: a letter block drops onto the tower on every bar line at 0.5, 1.5 … 5.5 s, the tower wobbling more after each, then a gust and the fall at 7.0 s. The reactor answers every beat 0.2 s (six frames) late — a nod, a nod, a lean in, a gasp, a flinch, a spinning cheer, a cringe — then a deadpan beat, and finally moves on its own: a jump that taps the reply sticker at its apex, CALLED IT., a squash landing and a rimshot.',
      visualDNA: 'One 9:8 frame made of two 9:16 halves with a white seam: the paper-and-grid Technique Atlas stage with cream letter blocks (the N in orange) on the left; a dark navy reaction set with a ring light and the orange Token on the right; a white reply sticker with a blue avatar dot; bold orange reaction marks. Beside it, ORIGINAL and REACTION lanes with lag connectors, a ten-frame lag ruler and a floor indicator.',
      transitions: 'None inside the split — the two halves run continuously; reactions spring on; the tower collapse and the punchline jump are the only big moves',
      implementation: ['In-app duet / stitch: record against the playing original', 'Reaction timing set by nudging the reactor clip a few frames late', 'Canvas 2D: two clipped half-frames from one timeline; reactions are the call times plus a fixed lag'],
      reproducibility: 'Fully procedural (generic app UI, fictional handles)',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      const FW = DF.w * 2;
      c.fillStyle = '#17181c'; rrect(c, DF.x - 12, DF.y - 12, FW + 24, DF.h + 24, 22); c.fill();
      c.save(); c.beginPath(); c.rect(DF.x, DF.y, DF.w, DF.h); c.clip(); c.translate(DF.x, DF.y); duOrig(c, t); c.restore();
      c.save(); c.beginPath(); c.rect(DF.x + DF.w, DF.y, DF.w, DF.h); c.clip(); c.translate(DF.x + DF.w, DF.y); duReact(c, t); c.restore();
      // shared bottom chrome
      c.save(); c.beginPath(); c.rect(DF.x, DF.y, FW, DF.h); c.clip();
      const g = c.createLinearGradient(0, DF.y + DF.h - 130, 0, DF.y + DF.h); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
      c.fillStyle = g; c.fillRect(DF.x, DF.y + DF.h - 130, FW, 130);
      text(c, '#duet with @motion.word', DF.x + DF.w + 24, DF.y + DF.h - 52, { font: TK.FONT, weight: 700, size: 22, color: '#fff' });
      label(c, '♪  ORIGINAL SOUND — MOTION.WORD', DF.x + 24, DF.y + DF.h - 28, { size: 13, color: 'rgba(255,255,255,0.85)', ls: 1.5 });
      label(c, 'REPLY · DUET · STITCH', DF.x + DF.w + 24, DF.y + DF.h - 22, { size: 13, color: 'rgba(255,255,255,0.7)', ls: 2 });
      c.restore();
      c.fillStyle = '#fff'; c.fillRect(DF.x + DF.w - 3, DF.y, 6, DF.h);
      // ---- right: call / response lanes ----
      const RX = 1030, LX0 = 1150, LX1 = 1840, LX = s => lerp(LX0, LX1, s / 10), YC = 214, YR = 300;
      label(c, 'CALL → RESPONSE', RX, 112, { size: 18, color: P.ink, weight: 700, ls: 3 });
      label(c, 'THE ORIGINAL SETS THE BEAT · THE REACTOR ANSWERS IT', RX, 136, { size: 12, ls: 2 });
      label(c, 'ORIGINAL', RX, YC + 5, { size: 13, color: P.ink, weight: 700, ls: 2 });
      label(c, 'REACTION', RX, YR + 5, { size: 13, color: P.accentD, weight: 700, ls: 2 });
      c.fillStyle = 'rgba(23,24,28,0.15)'; c.fillRect(LX0, YC, LX1 - LX0, 2); c.fillRect(LX0, YR, LX1 - LX0, 2);
      for (let s = 0; s <= 10; s++) { c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(LX(s) - 0.5, YR + 52, 1, s % 2 ? 4 : 8); if (s % 2 === 0) label(c, `${s}`, LX(s), YR + 76, { size: 11, align: 'center', ls: 0 }); }
      DU_CALL.forEach(([tc, nm], i) => {
        if (t < tc) return;
        const xa = LX(tc), xb = LX(tc + DU_LAG);
        c.fillStyle = P.ink; c.fillRect(xa - 7, YC - 7, 14, 14);
        label(c, nm, xa, YC - 18, { size: 13, color: P.ink, weight: 700, align: 'center', ls: 1 });
        if (t >= tc + DU_LAG) {
          c.strokeStyle = 'rgba(255,90,31,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(xa, YC + 8); c.lineTo(xb, YR - 9); c.stroke();
          c.fillStyle = P.accent; c.beginPath(); c.arc(xb, YR, 8, 0, TAU); c.fill();
          label(c, DU_RESP[i], xb, YR + (i % 2 ? 42 : 26), { size: 11, color: P.accentD, weight: 700, align: 'center', ls: 1 });
        }
      });
      if (t >= DU_PUNCH) {
        const xp = LX(DU_PUNCH);
        c.save(); c.setLineDash([4, 4]); c.strokeStyle = P.mute; c.lineWidth = 1.5; c.strokeRect(xp - 8, YC - 8, 16, 16); c.restore();
        label(c, 'NO CALL', xp, YC - 18, { size: 11, align: 'center', ls: 1 });
        c.fillStyle = P.accent; c.save(); c.translate(xp, YR); c.rotate(PI / 4); c.fillRect(-10, -10, 20, 20); c.restore();
        label(c, 'PUNCHLINE', xp, YR + 26, { size: 11, color: P.accentD, weight: 700, align: 'center', ls: 1 });
      }
      c.fillStyle = P.accent; c.fillRect(LX(t) - 1, YC - 36, 2, YR - YC + 62);
      // lag ruler
      const latest = DU_CALL.filter(([tc]) => t >= tc).pop();
      label(c, 'REACTION LAG', RX, 446, { size: 16, color: P.ink, weight: 700, ls: 3 });
      label(c, '6 FRAMES · 0.20 S AT 30 FPS · ABOUT A HUMAN REACTION TIME', RX, 470, { size: 12, ls: 1.5 });
      text(c, '+6 FR', 1848, 452, { font: TK.MONO, weight: 700, size: 34, color: P.accent, align: 'right' });
      const f = latest ? (t - latest[0]) * 30 : -1, CW = 80;
      for (let k = 0; k < 10; k++) {
        const x = RX + k * CW, on = f >= k;
        c.fillStyle = k === 0 ? (on ? P.ink : 'rgba(23,24,28,0.06)') : k === 6 ? (on ? P.accent : 'rgba(255,90,31,0.1)') : on && k < 6 ? 'rgba(23,24,28,0.22)' : 'rgba(23,24,28,0.06)';
        c.fillRect(x + 2, 494, CW - 4, 54);
        label(c, k === 0 ? 'CALL' : k === 6 ? 'REACT' : String(k), x + CW / 2, 527, { size: 13, color: (k === 0 && on) || (k === 6 && on) ? '#fff' : P.mute, weight: 700, align: 'center', ls: 1 });
      }
      label(c, latest ? `LAST CALL: ${latest[1]}  ·  FRAME ${Math.min(9, Math.max(0, Math.floor(f)))}` : 'WAITING FOR THE FIRST CALL', RX, 574, { size: 12, ls: 1.5, color: P.ink });
      // convention note
      const ni = DU_NOTES.filter(n => t >= n[0]).length - 1, nn = DU_NOTES[ni], na = seg(t, nn[0], nn[0] + 0.2);
      [[nn, na], [DU_NOTES[ni - 1], 1 - na]].forEach(([n, a]) => {
        if (!n || a <= 0.01) return;
        c.save(); c.globalAlpha *= a;
        tag(c, n[1], RX, 652, 1, { size: 18 });
        label(c, n[2], RX + 22, 680, { size: 13, ls: 2 });
        c.restore();
      });
      // who has the floor
      const react = t < 0.5 || t >= 7.6 || DU_CALL.some(([tc]) => t >= tc + DU_LAG && t < tc + DU_LAG + 0.3);
      label(c, 'WHO HAS THE FLOOR', RX, 760, { size: 13, ls: 3 });
      [['ORIGINAL', !react], ['REACTOR', react]].forEach(([s, on], j) => {
        const x = RX + j * 230;
        c.fillStyle = on ? (j ? P.accent : P.ink) : 'rgba(23,24,28,0.06)'; rrect(c, x, 776, 214, 44, 22); c.fill();
        label(c, s, x + 107, 804, { size: 15, color: on ? '#fff' : P.mute, weight: 700, align: 'center', ls: 3 });
      });
      label(c, 'THE REACTOR KEEPS THE LAST WORD', RX, 852, { size: 12, ls: 2, color: t >= 7.6 ? P.ink : P.mute, weight: t >= 7.6 ? 700 : 400 });
      FK.strip(c, t, W, H, DU_BEATS, { label: 'Duet · split 9:16 | 9:16' });
      FK.caption(c, t, W, H, { name: 'Duet / Reaction', cat: 'Social' });
    },
    score(A) {
      // the original's own sound: a bouncy marimba line on the eighths
      const bass = [48, 48, 53, 55];
      for (let k = 0; k < 28; k++) {
        const t = 0.5 + k * 0.25; if (t >= 7.0) break;
        A.pluck(t, midi(k % 2 ? 67 + (k % 4 === 3 ? 5 : 0) : 60), { g: 0.06, bright: 0.4, dur: 0.3, lp: 2400, pan: -0.45 });
        if (k % 2 === 0) A.osc(t, { type: 'triangle', f: midi(bass[Math.floor(k / 4) % 4] - 12), dur: 0.22, g: 0.07, pan: -0.3 });
      }
      // calls: a thud and a rising note per block (panned left, the original's side)
      DU_CALL.slice(0, 6).forEach(([t], i) => {
        A.kick(t, 0.3, { f: 110, f2: 50, dur: 0.25 });
        A.noise(t, { type: 'lowpass', f: 600, dur: 0.1, g: 0.08, pan: -0.4 });
        A.pluck(t, midi([60, 62, 64, 67, 69, 72][i]), { g: 0.18, bright: 0.7, dur: 0.8, pan: -0.4 });
      });
      A.bell(5.55, midi(84), { g: 0.05, dur: 0.9, pan: -0.4 });
      // responses, 0.2 s late (panned right, the reactor's side): little voice-like glides
      const R = DU_LAG, pr = 0.45;
      A.osc(0.5 + R, { type: 'triangle', f: 200, f2: 180, dur: 0.14, g: 0.08, lp: 900, pan: pr });
      A.osc(1.5 + R, { type: 'triangle', f: 210, f2: 188, dur: 0.14, g: 0.08, lp: 900, pan: pr });
      A.osc(2.5 + R, { type: 'triangle', f: 250, f2: 360, glide: 0.3, dur: 0.38, g: 0.07, lp: 1400, vib: [6, 8], pan: pr });
      A.noise(3.5 + R, { type: 'bandpass', f: 1800, dur: 0.12, g: 0.07, pan: pr }); A.osc(3.5 + R, { type: 'triangle', f: 420, f2: 760, glide: 0.15, dur: 0.18, g: 0.07, pan: pr });
      A.osc(4.5 + R, { type: 'sawtooth', f: 520, f2: 240, glide: 0.35, dur: 0.38, g: 0.035, lp: 1500, pan: pr });
      [72, 76, 79, 84].forEach((m, i) => A.pluck(5.5 + R + i * 0.07, midi(m), { g: 0.14, bright: 0.8, dur: 0.5, pan: pr })); A.clap(5.5 + R + 0.2, 0.12);
      // the fall: gust, tumbling blocks, the cringe
      A.whoosh(6.4, 0.7, { f1: 300, f2: 1400, g: 0.07, pan: -0.4, swell: 0.7 });
      for (let i = 0; i < 6; i++) { const t = 7.0 + 0.28 + i * 0.06; A.kick(t, 0.16 + i * 0.02, { f: 140 - i * 8, f2: 60, dur: 0.18 }); A.noise(t, { type: 'bandpass', f: 500 + i * 80, q: 2, dur: 0.08, g: 0.06, pan: -0.4 }); }
      A.osc(7.0 + R, { type: 'triangle', f: 320, f2: 150, glide: 0.5, dur: 0.55, g: 0.07, lp: 1100, vib: [5, 10], pan: pr });
      // deadpan: one cricket
      [7.8, 7.86, 7.92].forEach(t => A.osc(t, { f: 4200, dur: 0.035, g: 0.025, pan: 0.6 }));
      // punchline: jump, tap, landing, ba-dum-tss
      A.whoosh(8.06, 0.35, { f1: 400, f2: 3200, g: 0.07, pan: pr });
      A.osc(DU_PUNCH, { f: 1800, f2: 900, glide: 0.04, dur: 0.06, g: 0.08, pan: pr }); A.bell(DU_PUNCH, midi(88), { g: 0.06, dur: 0.9, pan: pr });
      A.kick(DU_LAND, 0.36, { f: 130, f2: 45 });
      A.osc(8.9, { f: 190, f2: 120, glide: 0.12, dur: 0.18, g: 0.16 });
      A.osc(9.05, { f: 150, f2: 90, glide: 0.12, dur: 0.2, g: 0.18 });
      A.kick(9.2, 0.2, { f: 100, f2: 45 }); A.noise(9.2, { type: 'highpass', f: 6000, dur: 0.75, g: 0.07, rev: 0.4 }); A.hat(9.2, 0.08, true);
    },
  });

  /* =====================================================================
     DAY IN THE LIFE — a handheld day from 7:00 AM to 11:00 PM in ten
     seconds. The clock is the spine: every segment opens on a time super,
     an analog clock and a day bar track the hour, and every cut is a jump
     forward in time (labelled with how much it skipped). Wake up; a B-roll
     montage of the routine at a quarter-second a shot; the walk out with a
     jump cut; the one sit-down chat to camera, its pauses cut out; golden
     hour into dusk; a timelapse of editing at night; see you tomorrow.
     The sky colour is a function of the clock.
     ===================================================================== */
  // shots: [start, hour at start, hour at end, scene]
  const VS = [
    [0, 7.0, 7.08, 'wake'],
    [1.5, 7.25, 7.27, 'mug'], [1.75, 7.5, 7.52, 'toast'], [2.0, 7.75, 7.77, 'shoes'], [2.25, 8.0, 8.02, 'plant'], [2.5, 8.33, 8.35, 'keys'], [2.75, 8.66, 8.68, 'door'],
    [3.0, 9.0, 9.05, 'walk'], [3.75, 9.66, 9.71, 'walk'],
    [4.5, 13.0, 13.01, 'talk'], [5.0, 13.025, 13.035, 'talk'], [5.5, 13.05, 13.06, 'talk'], [6.0, 13.075, 13.085, 'talk'],
    [6.5, 18.0, 18.08, 'golden'], [7.25, 19.25, 19.33, 'golden'],
    [8.0, 21.0, 22.5, 'edit'],
    [9.0, 23.0, 23.03, 'night'],
  ];
  const VSUP = [[0, '7:00 AM', 'WAKE UP · DAY 214'], [1.5, '7:15 AM', 'THE ROUTINE'], [3.0, '9:00 AM', 'OUT THE DOOR'], [4.5, '1:00 PM', 'LUNCH CHAT'], [6.5, '6:00 PM', 'GOLDEN HOUR'], [8.0, '9:00 PM', 'EDITING THIS'], [9.0, '11:00 PM', 'GOODNIGHT']];
  const VNOTE = [
    [0, 'TIME SUPER · EVERY SEGMENT OPENS ON THE CLOCK'],
    [1.5, 'B-ROLL ROUTINE · 6 SHOTS × 0.25 S'],
    [3.0, 'JUMP CUT · SAME WALK, 40 MIN LATER'],
    [4.5, 'SIT-DOWN · TALK TO CAMERA · PAUSES CUT OUT'],
    [6.5, 'GOLDEN HOUR · THE SKY KEEPS THE TIME'],
    [8.0, 'TIMELAPSE · THE CLOCK RUNS FAST'],
    [9.0, 'OUTRO · “SEE YOU TOMORROW”'],
  ];
  const VBEATS = [
    { t0: 0, t1: 1.5, name: '7 AM · wake', kind: 'hook' },
    { t0: 1.5, t1: 3.0, name: 'B-roll routine', kind: 'act' },
    { t0: 3.0, t1: 4.5, name: '9 AM · out', kind: 'act' },
    { t0: 4.5, t1: 6.5, name: '1 PM · sit-down', kind: 'turn' },
    { t0: 6.5, t1: 8.0, name: '6 PM · golden', kind: 'act' },
    { t0: 8.0, t1: 9.0, name: '9 PM', kind: 'act' },
    { t0: 9.0, t1: 10, name: '11 PM · outro', kind: 'cta' },
  ];
  const VSUBS = [[4.5, 'okay so.'], [5.0, 'today was a lot,'], [5.5, 'but honestly?'], [6.0, 'a good a lot.']];
  const vShot = t => { let i = 0; for (let k = 0; k < VS.length; k++) if (t >= VS[k][0]) i = k; return i; };
  const vHour = t => { const i = vShot(t), s = VS[i], d = (VS[i + 1] ? VS[i + 1][0] : 10) - s[0]; return lerp(s[1], s[2], clamp((t - s[0]) / d)); };
  const clockStr = h => { const hh = Math.floor(h), mm = Math.floor((h - hh) * 60 + 1e-6); return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'PM' : 'AM'}`; };
  const SKY = [[7, '#f0b49e', '#fde3c3'], [9, '#8dbfe8', '#dbecf6'], [13, '#4f97e4', '#c4e2f6'], [17.5, '#e5a660', '#fbd99b'], [18.2, '#ee8640', '#ffcf85'], [19.4, '#6b4682', '#eb8a4f'], [21, '#1e2250', '#3a3a70'], [23, '#0a0d22', '#1a1d3b']];
  function sky(h) {
    if (h <= SKY[0][0]) return [SKY[0][1], SKY[0][2]];
    for (let i = 1; i < SKY.length; i++) if (h <= SKY[i][0]) { const u = (h - SKY[i - 1][0]) / (SKY[i][0] - SKY[i - 1][0]); return [mix(SKY[i - 1][1], SKY[i][1], u), mix(SKY[i - 1][2], SKY[i][2], u)]; }
    const l = SKY[SKY.length - 1]; return [l[1], l[2]];
  }
  function skyFill(c, h, x, y, w, hh) { const [a, b] = sky(h), g = c.createLinearGradient(0, y, 0, y + hh); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(x, y, w, hh); }
  function glow(c, x, y, r, col, a) { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }

  function vBed(c, dark) {
    c.fillStyle = dark ? '#3d3140' : '#6b5543'; rrect(c, 190, 470, 110, 360, 16); c.fill();
    c.fillStyle = dark ? '#5d5a6e' : '#f3eee5'; rrect(c, 190, 660, 920, 150, 20); c.fill();
    c.fillStyle = dark ? '#6c6a80' : '#fff'; rrect(c, 250, 600, 230, 80, 30); c.fill();
    c.fillStyle = dark ? '#33406a' : '#7d98c4'; rrect(c, 560, 636, 560, 184, 24); c.fill();
    c.fillStyle = dark ? '#3a2e2a' : '#7a6450'; rrect(c, 1230, 650, 160, 170, 8); c.fill();
  }
  function vWindow(c, h, x, y, w, hh, extra) {
    c.save(); c.beginPath(); c.rect(x, y, w, hh); c.clip();
    skyFill(c, h, x, y, w, hh); if (extra) extra(); c.restore();
    c.strokeStyle = '#6a5442'; c.lineWidth = 16; c.strokeRect(x, y, w, hh);
    c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + hh); c.moveTo(x, y + hh / 2); c.lineTo(x + w, y + hh / 2); c.lineWidth = 10; c.stroke();
  }
  const vScenes = {
    wake(c, t, u, h) {
      c.fillStyle = '#e0cdb6'; c.fillRect(0, 0, 1920, 1080);
      glow(c, 1390, 400, 760, '255,196,150', 0.4);
      vWindow(c, h, 1180, 170, 420, 390, () => {
        c.fillStyle = '#ffe2b0'; c.beginPath(); c.arc(1300, 520 - u * 30, 48, 0, TAU); c.fill();
        c.fillStyle = '#c98f7a'; c.beginPath(); c.moveTo(1180, 560); c.quadraticCurveTo(1300, 470, 1420, 520); c.quadraticCurveTo(1520, 470, 1600, 510); c.lineTo(1600, 560); c.fill();
      });
      c.fillStyle = '#e07a4f'; c.fillRect(1120, 140, 70, 480); c.fillRect(1590, 140, 70, 480);
      c.fillStyle = '#a8927a'; c.fillRect(0, 820, 1920, 260);
      vBed(c, false);
      const k = spring(t - 0.75, 2.2, 0.45);
      TK.token(c, lerp(400, 470, k), lerp(605, 548, k), 130, { rot: lerp(-PI / 2, 0, k) });
      const ring = t < 0.7, sh = ring ? Math.sin(t * 90) * 5 : 0;
      c.fillStyle = P.ink; rrect(c, 1250 + sh, 584, 120, 66, 12); c.fill();
      text(c, '7:00', 1310 + sh, 630, { font: TK.MONO, weight: 700, size: 34, color: P.accent, align: 'center' });
      if (ring) { c.strokeStyle = P.ink; c.lineWidth = 4; [-1, 1].forEach(d => { for (let k2 = 0; k2 < 2; k2++) { c.beginPath(); c.arc(1310, 617, 80 + k2 * 18, d > 0 ? -0.5 : PI - 0.5, d > 0 ? 0.5 : PI + 0.5); c.stroke(); } }); }
    },
    mug(c, t, u) {
      c.fillStyle = '#efe1cc'; c.fillRect(0, 0, 1920, 1080);
      c.fillStyle = 'rgba(255,226,170,0.5)'; c.beginPath(); c.moveTo(300, 0); c.lineTo(900, 0); c.lineTo(1500, 780); c.lineTo(900, 780); c.fill();
      c.fillStyle = '#b99a78'; c.fillRect(0, 780, 1920, 300); c.fillStyle = '#cdb08e'; c.fillRect(0, 780, 1920, 14);
      c.fillStyle = '#6b3f22'; c.fillRect(948 + Math.sin(t * 40) * 3, 0, 24, 450);
      c.strokeStyle = '#f7f2e9'; c.lineWidth = 40; c.beginPath(); c.arc(1150, 610, 86, -PI / 2, PI / 2); c.stroke();
      c.strokeStyle = P.ink; c.lineWidth = 4; c.beginPath(); c.arc(1150, 610, 108, -PI / 2, PI / 2); c.stroke();
      c.fillStyle = '#f7f2e9'; rrect(c, 780, 440, 380, 360, 40); c.fill(); c.lineWidth = 5; c.stroke();
      c.fillStyle = '#4a2a16'; c.beginPath(); c.ellipse(970, 446, 186, 16, 0, 0, TAU); c.fill();
      TK.token(c, 970, 630, 130);
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 6;
      for (let k = 0; k < 3; k++) { c.beginPath(); for (let i = 0; i <= 20; i++) { const yy = 400 - i * 12, xx = 880 + k * 90 + Math.sin(i * 0.5 + t * 8 + k) * 14; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); }
    },
    toast(c, t, u) {
      c.fillStyle = '#e4ece4'; c.fillRect(0, 0, 1920, 1080);
      c.strokeStyle = 'rgba(0,0,0,0.07)'; c.lineWidth = 3; c.beginPath();
      for (let x = 0; x <= 1920; x += 90) { c.moveTo(x, 0); c.lineTo(x, 800); } for (let y = 0; y <= 800; y += 90) { c.moveTo(0, y); c.lineTo(1920, y); } c.stroke();
      c.fillStyle = '#a98b6e'; c.fillRect(0, 800, 1920, 280);
      const p = E.outB(seg(u, 0.02, 0.16), 2.4);
      [[830, 0], [1090, 1]].forEach(([x, i]) => {
        const y = lerp(600, 380, p);
        c.fillStyle = '#c58646'; rrect(c, x - 100, y - 120, 200, 220, 46); c.fill();
        c.fillStyle = '#ecc48b'; rrect(c, x - 84, y - 104, 168, 188, 38); c.fill();
        if (i) TK.token(c, x, y - 6, 92, { color: '#9a5422', alpha: 0.8 });
      });
      c.fillStyle = '#cfd4da'; rrect(c, 680, 540, 560, 280, 70); c.fill(); c.strokeStyle = P.ink; c.lineWidth = 5; c.stroke();
      c.fillStyle = '#9aa2ac'; c.fillRect(1240, 620, 30, 90);
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(720, 600, 480, 10);
    },
    shoes(c, t, u) {
      c.fillStyle = '#c79f74'; c.fillRect(0, 0, 1920, 1080);
      c.fillStyle = 'rgba(80,50,20,0.18)'; for (let y = 60; y < 1080; y += 130) c.fillRect(0, y, 1920, 4);
      [[760, -0.12], [1140, 0.12]].forEach(([x, r], j) => {
        c.save(); c.translate(x, 540); c.rotate(r);
        c.fillStyle = P.ink; c.beginPath(); c.ellipse(0, 0, 128, 268, 0, 0, TAU); c.fill();
        c.fillStyle = '#f5f4f0'; c.beginPath(); c.ellipse(0, -6, 112, 252, 0, 0, TAU); c.fill();
        c.fillStyle = P.accent; c.beginPath(); c.ellipse(0, 150, 70, 60, 0, 0, TAU); c.fill();
        c.fillStyle = '#e2ded5'; rrect(c, -50, -170, 100, 230, 40); c.fill();
        c.strokeStyle = P.ink; c.lineWidth = 6;
        for (let k = 0; k < 4; k++) { const yy = -140 + k * 52; c.beginPath(); c.moveTo(-46, yy); c.lineTo(46, yy + 26); c.moveTo(46, yy); c.lineTo(-46, yy + 26); c.stroke(); }
        if (j === 1) { const b = E.outB(seg(u, 0.02, 0.18)); c.lineWidth = 7; c.beginPath(); c.ellipse(-40, -186, 40 * b, 22 * b, -0.4, 0, TAU); c.moveTo(80, -186); c.ellipse(40, -186, 40 * b, 22 * b, 0.4, 0, TAU); c.stroke(); }
        c.restore();
      });
      TK.token(c, 1530, 860, 170, { rot: -0.2 });
    },
    plant(c, t, u) {
      c.fillStyle = '#dfe8d8'; c.fillRect(0, 0, 1920, 1080);
      glow(c, 1500, 260, 600, '255,240,200', 0.5);
      c.fillStyle = '#bfae96'; c.fillRect(0, 860, 1920, 220);
      c.fillStyle = '#4f8a5b';
      for (let k = 0; k < 7; k++) { const a = -PI / 2 + (k - 3) * 0.32 + Math.sin(t * 3 + k) * 0.04; c.save(); c.translate(1000, 680); c.rotate(a + PI / 2); c.beginPath(); c.ellipse(0, -170, 44, 150, 0, 0, TAU); c.fill(); c.restore(); }
      c.fillStyle = '#c9673f'; c.beginPath(); c.moveTo(860, 660); c.lineTo(1140, 660); c.lineTo(1100, 900); c.lineTo(900, 900); c.closePath(); c.fill();
      c.fillStyle = '#b3572f'; c.fillRect(850, 650, 300, 40);
      c.fillStyle = P.blue; rrect(c, 260, 260, 300, 220, 40); c.fill();
      c.strokeStyle = P.blue; c.lineWidth = 26; c.beginPath(); c.moveTo(540, 330); c.lineTo(760, 250); c.stroke();
      c.lineWidth = 16; c.beginPath(); c.arc(300, 300, 90, PI * 0.9, PI * 1.6); c.stroke();
      c.fillStyle = 'rgba(120,170,255,0.85)';
      for (let k = 0; k < 14; k++) { const f = ((t * 3 + k / 14) % 1), x = 770 + f * 200, y = 250 + f * f * 420 + hash(k) * 20; c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill(); }
    },
    keys(c, t, u) {
      c.fillStyle = '#d7cbbb'; c.fillRect(0, 0, 1920, 1080);
      c.fillStyle = '#8a6a4c'; rrect(c, 560, 230, 800, 90, 12); c.fill();
      c.fillStyle = '#5b4532'; [700, 960, 1220].forEach(x => { c.beginPath(); c.arc(x, 275, 12, 0, TAU); c.fill(); });
      const a = 0.5 * Math.cos(u * 26) * Math.exp(-u * 3);
      c.save(); c.translate(960, 275); c.rotate(a);
      c.strokeStyle = '#b8bcc4'; c.lineWidth = 10; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 150); c.stroke();
      c.beginPath(); c.arc(0, 200, 50, 0, TAU); c.stroke();
      [[-0.5, '#c9a64a'], [0.35, '#b8bcc4']].forEach(([r, col]) => {
        c.save(); c.translate(0, 240); c.rotate(r); c.fillStyle = col;
        c.beginPath(); c.arc(0, 40, 34, 0, TAU); c.fill(); c.fillRect(-10, 60, 20, 170);
        c.fillRect(10, 180, 22, 14); c.fillRect(10, 205, 16, 14);
        c.fillStyle = '#d7cbbb'; c.beginPath(); c.arc(0, 34, 10, 0, TAU); c.fill(); c.restore();
      });
      TK.token(c, 0, 290, 110, { rot: -a * 0.6 });
      c.restore();
    },
    door(c, t, u, h) {
      c.fillStyle = '#2b2622'; c.fillRect(0, 0, 1920, 1080);
      skyFill(c, h, 760, 160, 400, 760);
      c.fillStyle = '#9fb08a'; c.fillRect(760, 760, 400, 160);
      c.fillStyle = 'rgba(255,240,210,0.3)'; c.beginPath(); c.moveTo(760, 920); c.lineTo(1160, 920); c.lineTo(1500, 1080); c.lineTo(420, 1080); c.fill();
      const op = E.outC(seg(u, 0, 0.2));
      c.fillStyle = '#5a4030'; c.fillRect(760, 160, 400 * (1 - op) + 30, 760);
      c.fillStyle = '#3c2a1f'; c.fillRect(740, 140, 440, 20); c.fillRect(740, 140, 20, 800); c.fillRect(1160, 140, 20, 800);
      TK.token(c, 960, 834, 170 * (1 + u * 0.4), { alpha: 0.95 });
    },
    walk(c, t, u, h, idx) {
      skyFill(c, h, 0, 0, 1920, 820);
      glow(c, 1520, 200, 260, '255,250,220', 0.6); c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(1520, 200, 54, 0, TAU); c.fill();
      const sc = idx * 900 + u * 260;
      const r1 = rng(31);
      for (let i = 0; i < 18; i++) { const w = 150 + r1() * 120, hh = 220 + r1() * 280, x = ((i * 190 - sc * 0.35) % 3420 + 3420) % 3420 - 300; c.fillStyle = '#b6c3d2'; c.fillRect(x, 820 - hh, w, hh); }
      const r2 = rng(57);
      for (let i = 0; i < 10; i++) {
        const w = 230 + r2() * 160, hh = 300 + r2() * 260, x = ((i * 380 - sc) % 3800 + 3800) % 3800 - 400;
        c.fillStyle = '#7f90a6'; c.fillRect(x, 820 - hh, w, hh);
        c.fillStyle = 'rgba(255,255,255,0.22)'; for (let wy = 820 - hh + 30; wy < 780; wy += 60) for (let wx = x + 24; wx < x + w - 30; wx += 56) c.fillRect(wx, wy, 26, 32);
      }
      c.fillStyle = '#d3ccc0'; c.fillRect(0, 820, 1920, 260); c.fillStyle = '#a99f90'; c.fillRect(0, 820, 1920, 12);
      c.fillStyle = 'rgba(0,0,0,0.08)'; for (let k = 0; k < 12; k++) { const x = ((k * 240 - sc * 1.4) % 2880 + 2880) % 2880 - 200; c.fillRect(x, 832, 4, 248); }
      for (let k = 0; k < 4; k++) { const x = ((300 + k * 700 - sc * 1.2) % 2800 + 2800) % 2800 - 200; c.fillStyle = '#2c3038'; c.fillRect(x, 420, 12, 410); c.fillRect(x - 40, 420, 92, 12); }
      const step = Math.abs(Math.sin(u * TAU * 2.2)), x = 900 + u * 30;
      c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(x, 900, 80, 10, 0, 0, TAU); c.fill();
      TK.token(c, x, 900 - 80 - step * 24, 160, { rot: Math.sin(u * TAU * 2.2) * 0.07 });
    },
    talk(c, t, u, h, idx) {
      c.fillStyle = '#d9cfbf'; c.fillRect(0, 0, 1920, 1080);
      vWindow(c, h, 1380, 170, 380, 420, () => { c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(1500, 300, 70, 22, 0, 0, TAU); c.fill(); });
      c.fillStyle = '#8a6b50'; rrect(c, 140, 150, 440, 680, 8); c.fill();
      const r = rng(77), cols = ['#c9673f', P.blue, '#e3c27a', '#4f8a5b', P.ink, '#e8e0d2'];
      for (let s = 0; s < 4; s++) {
        const by = 170 + s * 165; c.fillStyle = '#6d533c'; c.fillRect(150, by + 140, 420, 14);
        let x = 165; while (x < 540) { const w = 22 + r() * 26, hh = 90 + r() * 46; c.fillStyle = cols[Math.floor(r() * cols.length)]; c.fillRect(x, by + 140 - hh, w, hh); x += w + 4; }
      }
      c.fillStyle = '#6d5643'; c.fillRect(0, 728, 1920, 352); c.fillStyle = '#8a705a'; c.fillRect(0, 728, 1920, 12);
      const tk = Math.pow(Math.abs(Math.sin(t * 12 + idx)), 2) * 0.06;
      c.fillStyle = 'rgba(40,25,15,0.18)'; c.beginPath(); c.ellipse(960, 732, 190, 10, 0, 0, TAU); c.fill();
      TK.token(c, 960, 560 + 165 * tk, 330, { sy: 1 - tk, sx: 1 + tk * 0.5, rot: Math.sin(t * 1.7 + idx) * 0.03 });
    },
    golden(c, t, u, h, idx) {
      skyFill(c, h, 0, 0, 1920, 1080);
      const sx = 1380 + idx * 80, sy = 640 + idx * 110 + u * 40;
      glow(c, sx, sy, 520, '255,200,120', 0.5);
      c.fillStyle = '#ffe0a0'; c.beginPath(); c.arc(sx, sy, 84, 0, TAU); c.fill();
      c.fillStyle = idx ? '#5a2a3e' : '#b06048'; c.beginPath(); c.moveTo(0, 780);
      for (let x = 0; x <= 1920; x += 40) c.lineTo(x, 700 + vnoise(x / 260, 6) * 50 + vnoise(x / 90, 8) * 14);
      c.lineTo(1920, 780); c.fill();
      c.fillStyle = idx ? '#2a1a26' : '#3b2626'; c.fillRect(0, 770, 1920, 310);
      c.fillStyle = 'rgba(255,200,140,0.35)'; c.fillRect(0, 770, 1920, 4);
      if (idx) { const r = rng(5); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,214,140,${0.4 + r() * 0.5})`; c.fillRect(r() * 1920, 712 + r() * 50, 4, 4); } }
      c.strokeStyle = 'rgba(40,20,30,0.7)'; c.lineWidth = 4;
      for (let k = 0; k < 4; k++) { const bx = ((300 + k * 140 + t * 120) % 2200) - 100, by = 260 + k * 40 + Math.sin(t * 3 + k) * 10, w = 16 + Math.sin(t * 12 + k) * 6; c.beginPath(); c.moveTo(bx - 18, by - w * 0.5); c.lineTo(bx, by); c.lineTo(bx + 18, by - w * 0.5); c.stroke(); }
      const x = (idx ? 900 : 560) + u * 280;
      c.fillStyle = 'rgba(15,5,10,0.5)'; c.beginPath(); c.ellipse(x - 300, 774, 320, 10, 0, 0, TAU); c.fill();
      TK.token(c, x, 770 - 72, 144, { rot: x / (144 * 0.64), color: '#e2561c' });
    },
    edit(c, t, u, h) {
      c.fillStyle = '#151726'; c.fillRect(0, 0, 1920, 1080);
      vWindow(c, h, 220, 160, 360, 300, () => { const r = rng(3); c.fillStyle = '#fff'; for (let i = 0; i < 26; i++) c.fillRect(220 + r() * 360, 160 + r() * 300, 3, 3); });
      glow(c, 1460, 640, 560, '255,190,120', 0.28);
      c.strokeStyle = '#3a3a46'; c.lineWidth = 12; c.beginPath(); c.moveTo(1640, 760); c.lineTo(1640, 440); c.lineTo(1500, 360); c.stroke();
      c.fillStyle = '#e8c58a'; c.beginPath(); c.moveTo(1440, 330); c.lineTo(1560, 330); c.lineTo(1580, 400); c.lineTo(1420, 400); c.fill();
      c.fillStyle = '#2b241f'; c.fillRect(0, 780, 1920, 300); c.fillStyle = 'rgba(255,200,140,0.18)'; c.fillRect(0, 780, 1920, 4);
      glow(c, 960, 600, 520, '150,180,255', 0.22);
      c.fillStyle = '#9aa0aa'; c.beginPath(); c.moveTo(700, 770); c.lineTo(1220, 770); c.lineTo(1270, 800); c.lineTo(650, 800); c.fill();
      c.fillStyle = '#9aa0aa'; rrect(c, 730, 420, 460, 352, 14); c.fill();
      c.fillStyle = '#101218'; c.fillRect(746, 436, 428, 320);
      const pg = c.createLinearGradient(0, 452, 0, 600); pg.addColorStop(0, '#ef8740'); pg.addColorStop(1, '#ffcf85'); c.fillStyle = pg; c.fillRect(800, 452, 320, 150);
      TK.token(c, 960 + Math.sin(t * 6) * 40, 560, 40, { color: '#e2561c' });
      [[650, [[0, 90, P.accent], [94, 70, P.blue], [168, 110, P.accent], [282, 130, '#8f8a80']]], [690, [[20, 150, '#4f8a5b'], [176, 90, '#4f8a5b'], [270, 140, '#4f8a5b']]], [725, [[0, 410, '#3a3f55']]]].forEach(([y, clips]) => clips.forEach(([x, w, col]) => { c.fillStyle = col; c.fillRect(756 + x, y, w - 4, 26); }));
      c.fillStyle = '#fff'; c.fillRect(756 + (u * 900) % 408, 640, 2, 116);
      TK.token(c, 1440, 780 - 70 - Math.abs(Math.sin(t * 18)) * 6, 140);
    },
    night(c, t, u, h) {
      c.fillStyle = '#252842'; c.fillRect(0, 0, 1920, 1080);
      const lampOn = t < 9.7;
      if (lampOn) glow(c, 1310, 560, 560, '255,190,120', 0.35);
      vWindow(c, h, 1180, 170, 420, 390, () => {
        const r = rng(9); c.fillStyle = '#fff'; for (let i = 0; i < 30; i++) c.fillRect(1180 + r() * 420, 170 + r() * 390, 3, 3);
        c.fillStyle = '#f4ecd2'; c.beginPath(); c.arc(1480, 260, 40, 0, TAU); c.fill();
        c.fillStyle = sky(h)[0]; c.beginPath(); c.arc(1498, 248, 36, 0, TAU); c.fill();
      });
      c.fillStyle = '#1c1b2b'; c.fillRect(0, 820, 1920, 260);
      vBed(c, true);
      c.fillStyle = lampOn ? '#e8c58a' : '#5a5060'; c.beginPath(); c.moveTo(1270, 520); c.lineTo(1350, 520); c.lineTo(1372, 590); c.lineTo(1248, 590); c.fill();
      c.fillStyle = '#3a3a46'; c.fillRect(1304, 590, 12, 60);
      const wave = t > 9.1 && t < 9.75 ? 0.24 * Math.sin((t - 9.1) * TAU * 1.8) : 0;
      TK.token(c, 470, 548, 130, { rot: wave });
    },
  };

  MG.film({
    id: 'formatvlog', dur: 10, poster: 6.9,
    fonts,
    meta: {
      family: 'M', name: 'Day in the Life', sub: 'The clock as the spine, jump cuts to compress it', era: '2007 —',
      origin: 'Video blogs followed soon after YouTube opened in 2005. The Vlogbrothers, John and Hank Green, made the jump-cut talking head — every pause cut out — a house style from Brotherhood 2.0 in 2007, and Casey Neistat’s daily vlog (March 2015 – November 2016) set the template for the day-in-the-life film: handheld, time-stamped, B-roll montages of small routines cut to music, one sit-down chat to camera and a sign-off. In the early 2020s “day in my life” videos became a staple of TikTok and YouTube Shorts, organised entirely by the clock — 7:00 AM, 9:00 AM, and on to bed.',
      works: 'Vlogbrothers — Brotherhood 2.0 (John and Hank Green, 2007) · Casey Neistat’s daily vlog (2015–16) · “day in my life” videos on TikTok and YouTube Shorts (2020 —)',
      tech: ['Time supers: the clock is the spine', 'Jump cuts compress hours into seconds', 'B-roll routine montage + one sit-down'],
      accent: '#ff5a1f',
      motionDNA: 'Sixteen hours in ten seconds on a 120 BPM lo-fi bed. An alarm, the Token pops up in bed; six quarter-second B-roll shots of the routine on the eighth notes; a walk with a jump cut forty minutes ahead; a sit-down chat to camera chopped into four jump cuts with the framing punched in and out; golden hour jump-cutting into dusk; a timelapse of editing at night with the clock racing; a wave goodnight and the lamp clicking off. Everything drifts slightly — a handheld camera made of two layers of noise.',
      visualDNA: 'Flat illustrated rooms and streets with the orange Token as the vlogger; a sky gradient driven by the hour — peach dawn, clear blue noon, orange golden hour, violet dusk, navy night — seen through every window. Bold white time supers with a dark offset, burned-in lowercase subtitles in the chat, an analog clock top right and a 7 AM → 11 PM day bar bottom right where each shot is a thin sliver and every jump cut is labelled with the time it skipped.',
      transitions: 'Hard jump cuts throughout (time skips, not scene transitions); a punch-in / punch-out between talking-head takes; the lamp switching off',
      implementation: ['Phone or compact camera, handheld; edited in Premiere / CapCut on a music bed', 'Time-stamp supers as a template; B-roll cut on the beat', 'Canvas 2D: a shot list keyed to clock time drives the scenes, the sky gradient and the overlays; vnoise handheld camera'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const si = vShot(t), S = VS[si], u = t - S[0], hr = vHour(t), scene = S[3];
      const idx = scene === 'walk' ? (si === 7 ? 0 : 1) : scene === 'talk' ? si - 9 : scene === 'golden' ? si - 13 : 0;
      // handheld camera
      const amp = scene === 'walk' ? 1.6 : scene === 'talk' ? 0.5 : 1;
      const dx = (vnoise(t * 0.8, 3) * 16 + vnoise(t * 2.7, 5) * 5) * amp, dy = (vnoise(t * 0.8, 9) * 10 + vnoise(t * 2.7, 11) * 4) * amp;
      let z = 1.06, ox = 0, oy = 0;
      if (si >= 1 && si <= 6) z *= 1 + u * 0.3;
      if (scene === 'talk') { z *= [1, 1.18, 1.05, 1.24][idx]; ox = [0, 60, -50, 30][idx]; oy = [0, 60, 20, 90][idx]; }
      c.save();
      c.translate(960 + dx, 540 + dy); c.rotate(vnoise(t * 0.6, 13) * 0.01 * amp); c.scale(z, z); c.translate(-960 + ox, -540 + oy);
      vScenes[scene](c, t, u, hr, idx);
      c.restore();
      if (scene === 'night' && t > 9.7) { c.fillStyle = `rgba(4,5,14,${0.5 * seg(t, 9.7, 9.76)})`; c.fillRect(0, 0, W, H); }
      MG.vignette(c, W, H, 0.3);
      // top band for the strip + notes
      const tg = c.createLinearGradient(0, 0, 0, 170); tg.addColorStop(0, 'rgba(0,0,0,0.5)'); tg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = tg; c.fillRect(0, 0, W, 170);
      // time super: up on the cut frame itself (it pops from 1.15× scale), never a bare frame
      const sup = VSUP.filter(s => t >= s[0]).pop(), su = t - sup[0], sa = clamp(Math.min(1, 1 - (sup[0] === 1.5 ? seg(su, 0.18, 0.25) : seg(su, 0.75, 0.9))));
      if (sa > 0 && !(sup[0] === 9.0 && t > 9.15)) {
        const k = spring(su, 3, 0.5);
        c.save(); c.globalAlpha *= sa; c.translate(110, 262); c.scale(lerp(1.15, 1, k), lerp(1.15, 1, k));
        text(c, sup[1], 5, 5, { font: TK.FONT, weight: 900, size: 104, color: 'rgba(0,0,0,0.45)' });
        text(c, sup[1], 0, 0, { font: TK.FONT, weight: 900, size: 104, color: '#fff' });
        c.fillStyle = P.accent; c.fillRect(2, 22, 70, 7);
        text(c, sup[2], 86, 34, { font: TK.MONO, weight: 700, size: 22, color: '#fff', ls: 4, stroke: 'rgba(0,0,0,0.5)', lw: 4 });
        c.restore();
      }
      // montage: small per-shot stamps
      if (si >= 2 && si <= 6) {
        c.fillStyle = 'rgba(0,0,0,0.55)'; rrect(c, 110, 210, 400, 56, 10); c.fill();
        text(c, clockStr(hr), 210, 250, { font: TK.MONO, weight: 700, size: 30, color: '#fff', align: 'center' });
        label(c, `B-ROLL ${si} / 6`, 330, 248, { size: 16, color: '#fff', weight: 700, ls: 3 });
      }
      // talking-head subtitles
      const sb = VSUBS.filter(s => t >= s[0] && t < 6.5).pop();
      if (sb) subtitle(c, sb[1], 960, 856, 40);
      // outro
      if (t > 9.15) {
        const k = spring(t - 9.15, 2.4, 0.45);
        c.save(); c.translate(960, 420); c.scale(k, k);
        text(c, 'SEE YOU TOMORROW', 6, 6, { font: TK.FONT, weight: 900, size: 110, color: 'rgba(0,0,0,0.5)', align: 'center', base: 'middle' });
        text(c, 'SEE YOU TOMORROW', 0, 0, { font: TK.FONT, weight: 900, size: 110, color: CREAM, align: 'center', base: 'middle' });
        c.restore();
        label(c, 'DAY 214 · END', 960, 520, { size: 20, color: P.accentL, weight: 700, align: 'center', ls: 6 });
      }
      // convention note
      const nt = VNOTE.filter(n => t >= n[0]).pop();
      tag(c, nt[1], 72, 112, seg(t - nt[0], -0.1, 0.1), { dark: true });
      // the clock: analog, top right
      const CX = 1768, CY = 210, CR = 62;
      label(c, 'THE CLOCK IS THE SPINE', 1848, 112, { size: 14, color: CREAM, weight: 700, align: 'right', ls: 2 });
      c.fillStyle = 'rgba(255,255,255,0.88)'; c.beginPath(); c.arc(CX, CY, CR, 0, TAU); c.fill();
      c.strokeStyle = P.ink; c.lineWidth = 3; c.stroke();
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.fillStyle = P.ink; c.save(); c.translate(CX, CY); c.rotate(a); c.fillRect(-1.5, -CR + 6, 3, k % 3 ? 6 : 12); c.restore(); }
      const ha = (hr % 12) / 12 * TAU, ma = (hr % 1) * TAU;
      c.strokeStyle = P.ink; c.lineCap = 'round'; c.lineWidth = 6; c.beginPath(); c.moveTo(CX, CY); c.lineTo(CX + Math.sin(ha) * CR * 0.5, CY - Math.cos(ha) * CR * 0.5); c.stroke();
      c.strokeStyle = P.accent; c.lineWidth = 4; c.beginPath(); c.moveTo(CX, CY); c.lineTo(CX + Math.sin(ma) * CR * 0.8, CY - Math.cos(ma) * CR * 0.8); c.stroke(); c.lineCap = 'butt';
      c.fillStyle = P.ink; c.beginPath(); c.arc(CX, CY, 5, 0, TAU); c.fill();
      c.fillStyle = 'rgba(0,0,0,0.55)'; rrect(c, CX - 84, CY + CR + 12, 168, 40, 8); c.fill();
      text(c, clockStr(hr), CX, CY + CR + 41, { font: TK.MONO, weight: 700, size: 24, color: '#fff', align: 'center' });
      if (scene === 'edit') label(c, 'TIMELAPSE ×5400', CX, CY + CR + 76, { size: 13, color: P.accentL, weight: 700, align: 'center', ls: 2 });
      // the day bar, bottom right
      const BX0 = 760, BX1 = 1848, BY = 1012, HX = hh => lerp(BX0, BX1, (hh - 7) / 16);
      c.fillStyle = 'rgba(8,9,14,0.5)'; rrect(c, BX0 - 24, BY - 62, BX1 - BX0 + 48, 108, 12); c.fill();
      label(c, '7 AM → 11 PM', BX0, BY - 30, { size: 13, color: CREAM, weight: 700, ls: 2 });
      label(c, 'SCREEN 10 S  ·  CLOCK 16 H', BX1, BY - 30, { size: 13, color: CREAM, weight: 700, align: 'right', ls: 2 });
      c.fillStyle = 'rgba(236,232,223,0.25)'; c.fillRect(BX0, BY - 1, BX1 - BX0, 2);
      for (let hh = 7; hh <= 23; hh++) {
        c.fillStyle = 'rgba(236,232,223,0.5)'; c.fillRect(HX(hh) - 0.5, BY - 5, 1, 10);
        if (hh % 2 === 1) label(c, `${((hh + 11) % 12) + 1}${hh >= 12 ? 'P' : 'A'}`, HX(hh), BY + 26, { size: 11, color: 'rgba(236,232,223,0.7)', align: 'center', ls: 0 });
      }
      VS.forEach((s, i) => {
        if (t < s[0]) return;
        const h1 = i === si ? hr : s[2];
        c.fillStyle = CREAM; c.fillRect(HX(s[1]) - 2, BY - 7, Math.max(4, HX(h1) - HX(s[1]) + 4), 14);
      });
      c.fillStyle = P.accent; c.beginPath(); c.arc(HX(hr), BY, 8, 0, TAU); c.fill();
      // jump-cut flag: what the last cut skipped
      if (si > 0) {
        const fa = 1 - seg(u, 0.55, 0.75);
        if (fa > 0) {
          const skip = Math.round((S[1] - VS[si - 1][2]) * 60), hrs = Math.floor(skip / 60), mins = skip % 60;
          const s = skip < 3 ? 'JUMP CUT · PAUSE REMOVED' : `JUMP CUT  +${hrs ? hrs + ' H ' : ''}${mins ? mins + ' MIN' : ''}`.trim();
          const x = clamp(HX(S[1]), BX0 + 170, BX1 - 170);
          c.save(); c.globalAlpha *= fa;
          c.fillStyle = P.accent; rrect(c, x - 160, BY - 112, 320, 38, 8); c.fill();
          c.fillRect(HX(S[1]) - 1, BY - 74, 2, 66);
          label(c, s, x, BY - 86, { size: 15, color: '#fff', weight: 700, align: 'center', ls: 2 });
          c.restore();
        }
      }
      FK.strip(c, t, W, H, VBEATS, { dark: true, label: 'Day in the life · vlog' });
      FK.caption(c, t, W, H, { name: 'Day in the Life', cat: 'Social', dark: true });
    },
    score(A) {
      // alarm, then the lo-fi bed (ducked under the sit-down chat)
      [0.02, 0.17, 0.32, 0.47].forEach(t => A.osc(t, { type: 'square', f: 1760, dur: 0.08, g: 0.04, lp: 4000 }));
      A.osc(0.75, { type: 'triangle', f: 300, f2: 700, glide: 0.2, dur: 0.25, g: 0.07 });
      const duck = t => (t >= 4.5 && t < 6.5 ? 0.4 : 1);
      for (let b = 2; b < 20; b++) {
        const t = b * 0.5, g = duck(t);
        if (b % 4 === 0 || b % 8 === 7) A.kick(t, 0.24 * g, { f: 100, f2: 42 });
        if (b % 2) A.snare(t, 0.06 * g, { dur: 0.12, f: 1500 });
        A.hat(t + 0.27, 0.025 * g, false, { pan: 0.25 }); A.hat(t, 0.015 * g, false, { pan: -0.2 });
      }
      const ch = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59], [53, 57, 60, 64]];
      ch.forEach((n, i) => A.chord(i ? i * 2 : 0.5, n, { type: 'triangle', dur: i ? 2.0 : 1.5, g: 0.022 * (i === 2 ? 0.55 : 1), a: 0.06, lp: 1300, rev: 0.4, width: 0.7 }));
      for (let k = 0; k < 40; k++) A.noise(k * 0.25 + hash(k) * 0.2, { type: 'highpass', f: 6000, dur: 0.008, g: 0.02 + hash(k + 9) * 0.02 });   // vinyl crackle
      // montage: a pluck per B-roll cut, the pour, the toaster
      VS.slice(1, 7).forEach(([t], i) => { A.pluck(t, midi([72, 74, 76, 79, 81, 84][i]), { g: 0.14, bright: 0.6, dur: 0.5, pan: (i - 2.5) * 0.15 }); A.noise(t, { type: 'highpass', f: 4000, dur: 0.015, g: 0.04 }); });
      A.noise(1.5, { type: 'lowpass', f: 700, dur: 0.24, g: 0.05 });
      A.osc(1.77, { f: 500, f2: 900, glide: 0.06, dur: 0.08, g: 0.06 });
      A.osc(2.5, { f: 3100, dur: 0.05, g: 0.03 }); A.osc(2.56, { f: 2700, dur: 0.05, g: 0.03 });
      A.noise(2.75, { type: 'lowpass', f: 1200, dur: 0.3, g: 0.05 });
      // the walk: footsteps; the jump cut skips one
      for (let t = 3.05; t < 4.5; t += 0.23) { if (t > 3.68 && t < 3.8) continue; A.noise(t, { type: 'lowpass', f: 500, dur: 0.05, g: 0.06, pan: 0.1 }); }
      A.noise(3.75, { type: 'bandpass', f: 2500, dur: 0.04, g: 0.05 });
      // the sit-down: murmured syllables, cut dead at each jump cut
      for (let k = 0; k < 15; k++) {
        const t = 4.55 + k * 0.13; if (t >= 6.45) break;
        const take = Math.floor((t - 4.5) / 0.5), tt = t - 4.5 - take * 0.5; if (tt > 0.42) continue;
        A.osc(t, { type: 'triangle', f: 150 + hash(k * 3.3) * 90, f2: 140 + hash(k * 5.1) * 70, glide: 0.1, dur: 0.1, g: 0.05, lp: 900 });
      }
      [5.0, 5.5, 6.0].forEach(t => A.noise(t, { type: 'highpass', f: 3000, dur: 0.012, g: 0.04 }));
      // golden hour: a warm swell and birds
      A.chord(6.5, [57, 64, 69, 72, 76], { type: 'triangle', dur: 1.5, g: 0.02, a: 0.3, lp: 2200, rev: 0.6, width: 0.9 });
      [6.65, 6.8, 7.4, 7.55].forEach((t, k) => A.osc(t, { f: 3400 + k * 250, f2: 4400, glide: 0.06, dur: 0.08, g: 0.025, pan: k % 2 ? 0.5 : -0.4 }));
      A.chord(7.25, [53, 60, 65, 69], { type: 'triangle', dur: 0.8, g: 0.02, a: 0.2, lp: 1600, rev: 0.6, width: 0.9 });
      // night editing: keyboard clicks and a timelapse riser
      for (let k = 0; k < 18; k++) A.noise(8.02 + k * 0.053 + hash(k) * 0.02, { type: 'highpass', f: 3500, dur: 0.012, g: 0.035, pan: 0.3 });
      A.riser(8.0, 1.0, { g: 0.07, f: 160 });
      // outro: music box, the wave, the lamp click
      [[9.0, 76], [9.15, 79], [9.3, 84], [9.45, 83], [9.6, 79]].forEach(([t, m]) => A.bell(t, midi(m), { g: 0.05, dur: 1.0, rev: 0.6 }));
      A.chord(9.0, [48, 55, 64, 67], { type: 'triangle', dur: 1.0, g: 0.025, a: 0.1, lp: 1600, rev: 0.6, width: 0.8 });
      A.osc(9.7, { f: 2000, f2: 900, glide: 0.02, dur: 0.03, g: 0.06 }); A.noise(9.7, { type: 'highpass', f: 4000, dur: 0.02, g: 0.05 });
    },
  });
})();
