/* batch m6 — Narrative Formats · Film & TV: formatsting · formatnextweek · formatbumper.
   formatsting (the post-credits sting: the end crawl tails off on the legal line, a cut to black,
   a held beat of silence while the audience decides whether to leave, then a short scene that
   teases the sequel — a crack of light in the floor, something stirs, a second Token rises in
   silhouette — a hard cut, and the promise card THE TOKEN WILL RETURN) ·
   formatnextweek (the "Next week on" promo, the mirror of the recap: fragments of next week's
   unseen scenes, each under a second and pulled out of order from across the episode, questions
   raised as supers and never answered, a cut to black mid-leap, and the airdate card
   THURSDAY 9/8c) ·
   formatbumper (the ad-break bumpers: the act out on a hook, the out-bumper WE'LL BE RIGHT BACK
   with the logo loop, the commercial pod compressed with its break clock, the in-bumper NOW BACK
   TO, and the act in that repeats the last beat with the logo bug on). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, hash, vnoise, midi, text, rng, rrect } = MG;
  const TK = MG.TK, FK = MG.FK, P = TK.P, PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const CREAM = '#ece8df', CREAM2 = 'rgba(236,232,223,0.62)', BLACK = '#070708', BLUE_INK = '#1d2a4a';
  const label = (c, s, x, y, o = {}) => FK.label(c, s, x, y, { size: o.size || 14, ls: o.ls ?? 2.5, color: o.color || CREAM2, align: o.align, weight: o.weight, base: o.base });
  const win = (t, a, b, f = 0.3) => Math.min(seg(t, a, a + f), 1 - seg(t, b - f, b));   // fade in / hold / fade out
  const shake = (t, amp, seed) => [vnoise(t * 9, seed) * amp, vnoise(t * 9, seed + 7) * amp];
  /* A convention annotation: small accent tick + mono label. */
  function note(c, s, x, y, on = 1, o = {}) {
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    const al = o.align || 'left', dx = al === 'right' ? -1 : 1;
    c.fillStyle = P.accent; c.fillRect(al === 'right' ? x - 4 : x, y - 11, 4, 12);
    label(c, s, x + dx * 12, y, { align: al, color: o.color || CREAM, weight: 700, size: o.size || 14 });
    c.restore();
  }
  const tw = (c, s, size, weight, font, ls) => { c.font = `${weight} ${size}px ${font}`; c.letterSpacing = ls + 'px'; const w = c.measureText(s).width; c.letterSpacing = '0px'; return w; };
  const FONTS = [...FK.fonts, [`500 22px ${TK.FONT}`, 'WILL RETURN'], [`700 22px ${TK.MONO}`, '9/8c']];
  /* Scrims for full-bleed orange frames: the kit's mute labels and orange playhead vanish on the
     accent colour, so darken a band behind the structure strip (top) and the caption (bottom) and
     draw both with their dark-frame ink. o.box: also a rounded scrim behind [x, y, w, h]. */
  function orangeScrim(c, W, H, a, o = {}) {
    if (a <= 0.001) return;
    c.save(); c.globalAlpha *= a;
    const g = c.createLinearGradient(0, 0, 0, 84);
    g.addColorStop(0, 'rgba(14,12,12,0.6)'); g.addColorStop(0.68, 'rgba(14,12,12,0.6)'); g.addColorStop(1, 'rgba(14,12,12,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, 84);
    const b = c.createLinearGradient(0, H - 250, 0, H);
    b.addColorStop(0, 'rgba(14,12,12,0)'); b.addColorStop(0.35, 'rgba(14,12,12,0.45)'); b.addColorStop(1, 'rgba(14,12,12,0.6)');
    c.fillStyle = b; c.fillRect(0, H - 250, W, 250);
    if (o.box) { c.fillStyle = 'rgba(14,12,12,0.5)'; rrect(c, o.box[0], o.box[1], o.box[2], o.box[3], 10); c.fill(); }
    c.restore();
  }

  /* =====================================================================
     POST-CREDITS STING — black throughout. The crawl tails off (special
     thanks, the disclaimer, the logo row) and the legal line stops and
     holds; a cut to black; then the held beat — no music, only a few
     footsteps, while a diagram of the house empties seat by seat. Then,
     for the ones who stayed: a crack of orange light opens in a dark
     floor, dust in the beam, a glowing hole rises through it — a second
     Token, mirrored, ink-black and rim-lit — one image, a hard cut, and
     the promise card. A mid- vs post-credits map sits top right.
     ===================================================================== */
  const SB = [
    { t0: 0, t1: 2.2, name: 'CRAWL TAIL', kind: 'act' },
    { t0: 2.2, t1: 2.6, name: 'BLACK', kind: 'break' },
    { t0: 2.6, t1: 5.0, name: 'THE WAIT', kind: 'break' },
    { t0: 5.0, t1: 7.4, name: 'TEASE', kind: 'hook' },
    { t0: 7.4, t1: 8.3, name: 'REVEAL', kind: 'turn' },
    { t0: 8.3, t1: 10, name: 'WILL RETURN', kind: 'title' },
  ];
  const S_CUT = 2.2, S_TEASE = 5.0, S_REV = 7.4, S_OUT = 8.2, S_CARD = 8.3;
  // the crawl: [kind, a, b] laid out top to bottom, y in crawl space
  const SCRAWL = (() => {
    const L = []; let y = 0;
    const add = (k, a, b, h) => { L.push({ k, a, b, y }); y += h; };
    add('r', 'Dolly grip', 'R. LERP', 44); add('r', 'Best boy', 'E. OUTBACK', 44); add('r', 'Colourist', 'H. SATURATION', 44);
    y += 40; add('h', 'SPECIAL THANKS', '', 60);
    add('r', 'The Grid', 'AND ALL ITS SQUARES', 44); add('r', 'The Orange', 'FOR THE COLOUR', 44);
    y += 50; add('c', 'NO TOKENS WERE HARMED IN THE MAKING OF THIS FILM', '', 40);
    add('c', 'FILMED ENTIRELY IN CANVAS 2D', '', 40);
    y += 50; add('logos', '', '', 110);
    y += 30; add('legal', '© MMXXVI PAPER STUDIO  ·  ALL RIGHTS RESERVED', '', 0);
    return L;
  })();
  const S_LEGAL = SCRAWL[SCRAWL.length - 1].y;
  // the house: seats in rows, each with the time its occupant gets up (null = stays)
  const SEATS = (() => {
    const out = [], r = rng(61);
    for (let row = 0; row < 4; row++) for (let k = 0; k < 16; k++) {
      const v = r(), stay = v < 0.17;
      out.push({ row, k, leave: stay ? null : lerp(2.2, 4.7, Math.pow(r(), 0.8)) - (v > 0.8 ? 0.6 : 0) });
    }
    return out;
  })();
  const seated = t => SEATS.filter(s => s.leave === null || t < s.leave).length;

  function stCrawl(c, t, W) {
    const v = 260, stopAt = 520, end = S_LEGAL + 980 - stopAt, off = Math.min(end - v * (1.35 - t), end);   // the legal line stops at 1.35 s
    const Y = y => 980 + y - off;
    SCRAWL.forEach(l => {
      const y = Y(l.y); if (y < 230 || y > 900) return;
      const a = seg(y, 250, 340) * (1 - seg(y, 780, 870));
      c.save(); c.globalAlpha *= a;
      if (l.k === 'r') {
        text(c, l.a.toUpperCase(), 940, y, { font: TK.FONT, weight: 500, size: 22, ls: 4, color: CREAM2, align: 'right' });
        text(c, l.b, 980, y, { font: TK.FONT, weight: 800, size: 24, ls: 4, color: CREAM });
      } else if (l.k === 'h') {
        text(c, l.a, 960, y, { font: TK.FONT, weight: 800, size: 26, ls: 10, color: CREAM, align: 'center' });
      } else if (l.k === 'c') {
        text(c, l.a, 960, y, { font: TK.FONT, weight: 500, size: 20, ls: 5, color: CREAM2, align: 'center' });
      } else if (l.k === 'logos') {
        for (let i = 0; i < 5; i++) {
          const x = 960 + (i - 2) * 150;
          c.strokeStyle = 'rgba(236,232,223,0.45)'; c.lineWidth = 1.5;
          if (i === 2) TK.token(c, x, y + 30, 54, { color: CREAM });
          else if (i % 2) { c.beginPath(); c.arc(x, y + 30, 28, 0, TAU); c.stroke(); text(c, i === 1 ? 'DLB' : 'SND', x, y + 36, { font: TK.MONO, size: 14, weight: 700, ls: 1, color: CREAM2, align: 'center' }); }
          else { c.strokeRect(x - 44, y + 8, 88, 44); text(c, i === 0 ? 'GUILD' : 'ASSN', x, y + 36, { font: TK.MONO, size: 14, weight: 700, ls: 2, color: CREAM2, align: 'center' }); }
        }
      } else if (l.k === 'legal') {
        text(c, l.a, 960, y, { font: TK.MONO, size: 16, ls: 3, color: CREAM2, align: 'center' });
      }
      c.restore();
    });
    const held = t >= 1.35;
    note(c, held ? 'THE LAST LINE IS LEGAL  ·  IT STOPS AND HOLDS' : 'CRAWL  ·  CONSTANT SPEED  ·  260 px/s', 80, 112, 1, { size: 13 });
  }
  /* The mid- vs post-credits map, top right. */
  function stMap(c, t, on) {
    if (on <= 0.001) return;
    const x0 = 1180, x1 = 1848, y = 128, X = u => lerp(x0, x1, u);
    c.save(); c.globalAlpha *= on;
    label(c, 'WHERE THE SCENE SITS', x1, y - 26, { align: 'right', size: 12, color: 'rgba(236,232,223,0.45)' });
    const segs = [[0, 0.22, 'END TITLES'], [0.22, 0.74, 'CRAWL'], [0.74, 1, 'AFTER']];
    segs.forEach(([a, b, n], i) => {
      c.fillStyle = i === 2 ? 'rgba(255,90,31,0.18)' : 'rgba(236,232,223,0.12)'; c.fillRect(X(a) + 1, y, X(b) - X(a) - 2, 12);
      label(c, n, X(a) + 4, y + 30, { size: 12, ls: 2, color: 'rgba(236,232,223,0.5)' });
    });
    // mid-credits pin and post-credits pin
    const pin = (u, s, sub, hi) => {
      c.fillStyle = hi ? P.accent : 'rgba(236,232,223,0.55)';
      c.fillRect(X(u) - 1, y - 8, 2, 28);
      c.beginPath(); c.arc(X(u), y - 8, 4, 0, TAU); c.fill();
      label(c, s, X(u), y + 58, { align: 'center', size: 12, ls: 2, color: hi ? CREAM : 'rgba(236,232,223,0.55)', weight: hi ? 700 : 400 });
      label(c, sub, X(u), y + 78, { align: 'center', size: 11, ls: 1, color: 'rgba(236,232,223,0.42)' });
    };
    pin(0.36, 'MID-CREDITS', 'CUTS INTO THE CRAWL', false);
    pin(0.87, 'POST-CREDITS', 'ONLY AFTER THE LAST LINE', t >= S_CUT);
    // where we are
    const u = t < S_CUT ? lerp(0.6, 0.74, seg(t, 0, 1.7)) : lerp(0.74, 0.87, seg(t, S_CUT, S_TEASE));
    c.fillStyle = CREAM; c.beginPath(); c.moveTo(X(u), y - 2); c.lineTo(X(u) - 7, y - 12); c.lineTo(X(u) + 7, y - 12); c.closePath(); c.fill();
    c.restore();
  }
  function stWait(c, t, W, H) {
    const a = seg(t, 2.5, 2.7);   // already half up on the cut into THE WAIT
    // silence: a flat line and a counter
    c.save(); c.globalAlpha *= a;
    c.fillStyle = 'rgba(236,232,223,0.35)'; c.fillRect(420, 360, 1080, 1.5);
    for (let k = 0; k <= 12; k++) c.fillRect(420 + k * 90, 356, 1, 9);
    label(c, 'MUSIC  −∞ dB', 420, 336, { size: 13, ls: 2, color: 'rgba(236,232,223,0.5)' });
    const held = clamp(t - S_CUT, 0, S_TEASE - S_CUT);
    text(c, held.toFixed(1) + ' s', 1500, 336, { font: TK.MONO, weight: 700, size: 30, color: CREAM, align: 'right' });
    note(c, 'THE HELD BEAT  ·  NOTHING ON SCREEN, NOTHING IN THE TRACK', 420, 410, 1, { size: 14 });
    c.restore();
    // the house, seen from the screen
    const n = seated(t);
    c.save(); c.globalAlpha *= a;
    SEATS.forEach(s => {
      const x = 960 + (s.k - 7.5) * 62 + (s.row % 2) * 10, y = 560 + s.row * 62, sc = 1 - s.row * 0.04;
      c.fillStyle = 'rgba(236,232,223,0.13)'; rrect(c, x - 22 * sc, y, 44 * sc, 34 * sc, 8); c.fill();
      if (s.leave !== null && t >= s.leave) {
        const u = seg(t, s.leave, s.leave + 0.35);   // stands and goes
        if (u < 1) { c.fillStyle = `rgba(236,232,223,${0.75 * (1 - u)})`; c.beginPath(); c.arc(x, y - 6 - 26 * u, 15 * sc, 0, TAU); c.fill(); }
      } else {
        const stay = s.leave === null;
        c.fillStyle = stay && t > 4.2 ? P.accent : 'rgba(236,232,223,0.75)';
        c.beginPath(); c.arc(x, y - 6, 15 * sc, 0, TAU); c.fill();
      }
    });
    label(c, 'THE HOUSE', 1500, 590, { size: 13, ls: 3, color: 'rgba(236,232,223,0.5)' });
    text(c, String(n), 1500, 650, { font: TK.MONO, weight: 700, size: 44, color: n < 20 ? P.accent : CREAM });
    label(c, 'STILL SEATED', 1500, 680, { size: 12, ls: 2 });
    label(c, `OF ${SEATS.length}`, 1500, 700, { size: 12, ls: 2 });
    label(c, 'SCREEN  ↑', 960, 500, { align: 'center', size: 12, ls: 3, color: 'rgba(236,232,223,0.4)' });
    note(c, 'THE AUDIENCE DECIDES  ·  STAY OR GO', 1500, 860, seg(t, 3.0, 3.4), { align: 'right', size: 13 });
    c.restore();
  }
  // the tease scene: floor in the dark, a crack of light, the second Token rising
  const S_CRK = (() => { const r = rng(77), p = []; for (let i = 0; i <= 14; i++) p.push([lerp(-330, 330, i / 14), (r() - 0.5) * 16]); return p; })();
  function stTease(c, t, W, H) {
    const FY = 700, tt = t - S_TEASE;
    const open = E.ioS(seg(t, 5.15, 6.9)), gap = 2 + 30 * open + 26 * E.outQ(seg(t, S_REV, 7.7));
    const hits = [5.15, 5.75, 6.35];
    let amp = 0; hits.forEach(h => { amp += 10 * (seg(t, h, h + 0.04) - seg(t, h + 0.04, h + 0.45)); });
    amp += 16 * (seg(t, S_REV, S_REV + 0.05) - seg(t, S_REV + 0.05, S_REV + 0.6));
    const [sx, sy] = shake(t, amp, 11);
    const z = lerp(1, 1.16, E.ioS(seg(t, S_TEASE, S_OUT)));
    c.fillStyle = '#050506'; c.fillRect(0, 0, W, H);
    c.save(); c.translate(960 + sx, FY + sy); c.scale(z, z); c.translate(-960, -FY);
    // the floor: faint perspective lines
    const fl = 0.6 + 0.4 * seg(t, 5.15, 6.4);
    c.strokeStyle = `rgba(255,140,80,${0.12 * fl})`; c.lineWidth = 1; c.beginPath();
    for (let i = -14; i <= 14; i++) { c.moveTo(960 + i * 50, FY); c.lineTo(960 + i * 240, 1100); }
    for (let k = 0; k < 6; k++) { const y = FY + Math.pow(k / 6, 1.8) * 400 + 6; c.moveTo(0, y); c.lineTo(W, y); }
    c.stroke();
    // beam + dust (behind what rises)
    if (t > 5.15) {
      const grow = E.outC(seg(t, 5.15, 5.5)) * 0.4 + 0.35 * E.outC(seg(t, 5.75, 6.0)) + 0.25 * E.outC(seg(t, 6.35, 6.6));
      const bm = seg(t, 5.3, 6.2);
      const bg = c.createLinearGradient(0, FY, 0, FY - 600); bg.addColorStop(0, `rgba(255,150,80,${0.16 * bm})`); bg.addColorStop(1, 'rgba(255,150,80,0)');
      c.fillStyle = bg; c.beginPath(); c.moveTo(960 - 330 * grow, FY); c.lineTo(960 + 330 * grow, FY); c.lineTo(960 + 460 * grow, FY - 600); c.lineTo(960 - 460 * grow, FY - 600); c.closePath(); c.fill();
      const r = rng(91);
      for (let i = 0; i < 40; i++) {
        const x0 = (r() - 0.5) * 600 * grow, sp = 30 + r() * 60, ph = r() * 10;
        const y = FY - ((tt * sp + ph * 60) % 560), x = 960 + x0 + Math.sin(tt * 1.3 + ph) * 12;
        c.fillStyle = `rgba(255,200,150,${(0.25 + r() * 0.4) * bm * (1 - (FY - y) / 560)})`; c.fillRect(x, y, 2.5, 2.5);
      }
    }
    // what rises: the second Token, mirrored (hole top-left), ink-black, rim-lit from below
    const rise = 120 * E.ioS(seg(t, 6.3, S_REV)) + 230 * E.outB(seg(t, S_REV, 7.75), 1.4);
    const TS2 = 260, ty = FY + TS2 / 2 + 30 - rise;
    if (t > 6.2) {
      c.save(); c.beginPath(); c.rect(0, 0, W, FY); c.clip();   // only what is above the floor
      const glow = c.createRadialGradient(960, FY, 10, 960, FY, 520);
      glow.addColorStop(0, `rgba(255,120,50,${0.35 * open})`); glow.addColorStop(1, 'rgba(255,120,50,0)');
      c.fillStyle = glow; c.fillRect(400, FY - 520, 1120, 520);
      c.save(); c.translate(960, ty); c.scale(-1, 1);
      TK.tokenPath(c, TS2); c.fillStyle = '#0a0b10'; c.fill('evenodd');
      c.lineWidth = 3; c.strokeStyle = `rgba(255,140,80,${0.25 + 0.5 * seg(t, S_REV, 7.6)})`; c.stroke();
      // the hole glows
      c.fillStyle = `rgba(255,170,90,${0.5 + 0.5 * Math.abs(Math.sin(tt * 5))})`;
      c.beginPath(); c.arc(TS2 * TK.HOLE.x, TS2 * TK.HOLE.y, TS2 * TK.HOLE.r * 0.82, 0, TAU); c.fill();
      c.restore();
      c.restore();
    }
    // before the first hit: a pin-prick of light in the floor, so the cut into the tease is not a bare frame
    if (t <= 5.2) {
      c.save(); c.globalAlpha = 1 - seg(t, 5.15, 5.2); c.shadowColor = 'rgba(255,120,50,0.9)'; c.shadowBlur = 24;
      c.fillStyle = '#ffb27a'; c.beginPath(); c.ellipse(960, FY, 24 + 6 * Math.sin(tt * 9), 3.5, 0, 0, TAU); c.fill(); c.restore();
    }
    // the crack of light in the floor
    if (t > 5.15) {
      const grow = E.outC(seg(t, 5.15, 5.5)) * 0.4 + 0.35 * E.outC(seg(t, 5.75, 6.0)) + 0.25 * E.outC(seg(t, 6.35, 6.6));
      const n = S_CRK.length - 1, m = n * clamp(grow), mid = n / 2;
      c.save();
      c.shadowColor = 'rgba(255,120,50,0.9)'; c.shadowBlur = 30;
      c.fillStyle = '#ffb27a';
      c.beginPath();
      const pts = S_CRK.filter((_, i) => Math.abs(i - mid) <= m / 2 + 0.01);
      pts.forEach(([x, y], i) => { const h = gap * (1 - Math.pow(Math.abs(x) / 340, 2)) / 2; i ? c.lineTo(960 + x, FY + y - h) : c.moveTo(960 + x, FY + y - h); });
      for (let i = pts.length - 1; i >= 0; i--) { const [x, y] = pts[i], h = gap * (1 - Math.pow(Math.abs(x) / 340, 2)) / 2; c.lineTo(960 + x, FY + y + h * 0.4); }
      c.closePath(); c.fill();
      c.restore();
    }
    c.restore();
    // the one image: a flare on the reveal
    const fl2 = seg(t, S_REV, S_REV + 0.05) * (1 - seg(t, S_REV + 0.05, S_REV + 0.4));
    if (fl2 > 0) { c.fillStyle = `rgba(255,200,160,${0.45 * fl2})`; c.fillRect(0, 0, W, H); }
    const vg = c.createRadialGradient(960, 560, 250, 960, 560, 1100); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.75)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
    // conventions
    label(c, `FOR THE ${SEATS.filter(s => s.leave === null).length} WHO STAYED`, 80, 112, { size: 13, ls: 3, color: 'rgba(236,232,223,0.5)' });
    const qs = [['WHAT IS IT?', 5.3], ['WHERE DID IT COME FROM?', 5.9], ['WHEN DOES IT RETURN?', 6.5]];
    if (t < S_REV + 0.6) {
      note(c, 'THE TEASE WITHHOLDS', 80, 160, seg(t, S_TEASE - 0.12, S_TEASE + 0.12), { size: 14 });
      qs.forEach(([q, a], i) => {
        const on = seg(t, a, a + 0.2); if (on <= 0) return;
        label(c, q, 92, 192 + i * 26, { size: 13, ls: 2, color: `rgba(236,232,223,${0.8 * on})` });
        label(c, '—  NOT ANSWERED', 500, 192 + i * 26, { size: 13, ls: 2, color: `rgba(255,90,31,${on})`, weight: 700 });
      });
    }
    if (t >= S_REV) {
      note(c, 'REVEAL  ·  ONE IMAGE, IN SILHOUETTE', 1840, 780, seg(t, S_REV + 0.1, S_REV + 0.3), { align: 'right', size: 14 });
      note(c, 'CUT BEFORE IT ACTS', 1840, 808, seg(t, 7.8, 8.0), { align: 'right', size: 14 });
    }
  }
  function stCard(c, t, W) {
    const u = t - S_CARD;
    const a1 = E.outC(seg(u, -0.1, 0.4)), a2 = E.outC(seg(u, 0.5, 1.0));   // line one already up on the cut
    text(c, 'THE END OF MOTION', 960, 380, { font: TK.FONT, weight: 500, size: 22, ls: 12, color: `rgba(236,232,223,${0.6 * a1})`, align: 'center' });
    c.save(); c.globalAlpha = a1;
    text(c, 'THE TOKEN', 960, 500, { font: TK.FONT, weight: 800, size: 104, ls: lerp(40, 18, E.outC(seg(u, 0.1, 1.2))), color: CREAM, align: 'center' });
    c.restore();
    c.save(); c.globalAlpha = a2;
    text(c, 'WILL RETURN', 960, 620, { font: TK.FONT, weight: 800, size: 104, ls: lerp(40, 18, E.outC(seg(u, 0.5, 1.6))), color: P.accent, align: 'center' });
    c.restore();
    const a3 = seg(u, 1.0, 1.3);
    c.fillStyle = `rgba(236,232,223,${0.35 * a3})`; c.fillRect(760, 668, 400, 1.5);
    text(c, 'IN  MOTION  II', 960, 712, { font: TK.MONO, weight: 700, size: 20, ls: 8, color: `rgba(236,232,223,${0.7 * a3})`, align: 'center' });
    note(c, 'PROMISE CARD  ·  A BOND-FILM HABIT SINCE THE 1960s', 600, 820, seg(u, 0.9, 1.2), { size: 13 });
    note(c, 'THE STING NEVER RESOLVES  ·  IT POINTS TO THE SEQUEL', 600, 846, seg(u, 0.95, 1.15), { size: 13 });
  }
  MG.film({
    id: 'formatsting', dur: 10, poster: 7.75,
    fonts: FONTS,
    meta: {
      family: 'M', name: 'Post-credits Sting', sub: 'Wait, then tease the sequel', era: '1979 —',
      origin: 'A scene after the end credits began as a joke for whoever stayed: The Muppet Movie (1979) ends with Animal shouting “Go home!”, Airplane! (1980) returns to the passenger abandoned in the taxi, and Ferris Bueller’s Day Off (1986) sends its audience home in person. Iron Man (2008) turned it into marketing: Nick Fury after the crawl, announcing a shared universe, and Marvel Studios made the mid-credits scene (cut into the crawl) and the post-credits scene (after its last line) routine — The Avengers (2012) has both. The promise card is older: the Bond films have closed since the 1960s on “James Bond will return”.',
      works: 'The Muppet Movie (1979) · Iron Man (2008; Nick Fury) · The Avengers (2012; mid- and post-credits)',
      tech: ['Post-credits: only after the last line of the crawl', 'A held beat of black and silence first', 'The tease withholds: one image, no answer, a promise card'],
      accent: '#ff5a1f',
      motionDNA: 'The crawl at a constant 260 px/s until the legal line stops and holds; a hard cut to black at 2.2 s; 2.8 s of silence in which the house empties seat by seat; at 5.0 s a low rumble and three cracks of light on accelerating hits, a slow push-in while something rises; the reveal hit at 7.4 s, a single held silhouette, a hard cut at 8.2 s; the promise card fades up in two lines.',
      visualDNA: 'Black throughout. Cream credits in Archivo with a mono legal line; a diagram of the house as rows of seats, the stayers lit orange; a dark floor with a glowing orange crack, dust in the beam, a second Token mirrored in ink-black with a glowing hole and an orange rim; THE TOKEN / WILL RETURN in wide-tracked cream and orange. A mid- vs post-credits map top right.',
      transitions: 'Hard cut from the held legal line to black; hard cut out of the reveal; the promise card fades up',
      implementation: ['Editorial: the scene appended after the crawl, after a black hold', 'Sound: true silence for the wait, a hard sound cut with the picture', 'Canvas 2D: crawl table, seat diagram with seeded leave times, clipped silhouette over a procedural light crack'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      c.fillStyle = BLACK; c.fillRect(0, 0, W, H);
      if (t < S_CUT) stCrawl(c, t, W);
      else if (t < S_TEASE) { stWait(c, t, W, H); if (t < 2.6) note(c, 'CUT TO BLACK  ·  THE FILM IS OVER — OR IS IT?', 80, 112, seg(t, S_CUT - 0.04, S_CUT + 0.1), { size: 13 }); }
      else if (t < S_OUT) stTease(c, t, W, H);
      else if (t >= S_CARD) stCard(c, t, W);
      stMap(c, t, t < S_TEASE ? 1 : t < S_OUT ? 0.5 : 0);
      FK.strip(c, t, W, H, SB, { dark: true, label: 'After the credits' });
      FK.caption(c, t, W, H, { name: 'Post-credits Sting', cat: 'Film & TV', dark: true });
    },
    score(A) {
      // the end-titles cue running out: soft piano over a pad, last chord decays into the cut
      A.chord(0, [53, 60, 65, 69], { type: 'triangle', dur: 2.2, g: 0.03, a: 0.3, hold: true, rel: 0.6, lp: 1200, rev: 0.6, width: 0.7 });
      [[0.0, 77], [0.35, 72], [0.7, 69], [1.05, 72], [1.5, 65]].forEach(([t, m], i) => A.pluck(t, midi(m), { g: 0.16 - i * 0.02, bright: 0.35, dur: 1.4, rev: 0.6 }));
      A.osc(0, { f: midi(41), dur: 2.2, g: 0.06, a: 0.2, hold: true, rel: 0.5 });
      A.bell(1.5, midi(77), { g: 0.04, dur: 0.7, rev: 0.6 });
      // the wait: no music — only the house: seats flipping up, steps, a far door
      SEATS.forEach((s, i) => {
        if (s.leave === null || i % 3) return;
        A.noise(s.leave, { type: 'bandpass', f: 700 + hash(i) * 500, q: 3, dur: 0.06, g: 0.022, pan: (s.k - 7.5) / 9 });
        for (let k = 0; k < 2; k++) A.noise(s.leave + 0.25 + k * 0.28, { type: 'lowpass', f: 300, dur: 0.07, g: 0.03, pan: (s.k - 7.5) / 9 });
      });
      A.noise(4.3, { type: 'lowpass', f: 180, dur: 0.35, g: 0.05, pan: 0.6, rev: 0.6 });
      // everything in the tease stops dead on the cut
      const end = (t, d) => Math.min(d, S_OUT - t);
      A.osc(S_TEASE, { f: midi(26), dur: end(S_TEASE, 3.2), g: 0.09, a: 1.0, hold: true, rel: 0.01 });
      A.noise(S_TEASE, { type: 'lowpass', f: 160, dur: end(S_TEASE, 3.2), g: 0.05, a: 0.8, hold: true, rel: 0.01 });
      [5.15, 5.75, 6.35].forEach((t, k) => {
        A.noise(t, { type: 'highpass', f: 2500, dur: 0.07, g: 0.12 + k * 0.03 });
        A.osc(t, { f: 90, f2: 40, glide: 0.25, dur: 0.5, g: 0.22 + k * 0.05 });
        A.noise(t + 0.02, { type: 'bandpass', f: 1200, q: 1, dur: 0.4, g: 0.04, rev: 0.6 });
      });
      for (let t = 5.4, dt = 0.6; t < S_REV - 0.1; t += dt, dt = Math.max(0.3, dt * 0.88)) A.kick(t, 0.18, { f: 70, f2: 38, dur: 0.25 });
      A.osc(6.3, { type: 'sawtooth', f: midi(38), f2: midi(50), glide: 1.1, dur: end(6.3, 1.9), g: 0.04, a: 0.9, lp: 400, lp2: 2200, lpT: 1.1, rev: 0.4, hold: true, rel: 0.01 });
      A.riser(6.6, 0.8, { g: 0.1, f: 73 });
      // the reveal
      A.impact(S_REV, 0.55, { rev: 0.7 });
      A.chord(S_REV, [26, 33, 38, 41], { type: 'sawtooth', dur: end(S_REV, 0.8), g: 0.05, a: 0.02, lp: 700, rev: 0.5, width: 0.6, spread: 9, hold: true, rel: 0.01 });
      A.osc(S_REV, { type: 'sine', f: midi(86), dur: end(S_REV, 0.8), g: 0.02, a: 0.3, vib: [6, 8], hold: true, rel: 0.01 });
      // the promise card: the theme, in the minor
      A.chord(S_CARD + 0.1, [50, 57, 62, 65], { type: 'triangle', dur: 1.6, g: 0.03, a: 0.4, lp: 1600, rev: 0.7, width: 0.8 });
      [[0.1, 62], [0.6, 65], [0.95, 69], [1.25, 74]].forEach(([d, m]) => A.bell(S_CARD + d, midi(m + 12), { g: 0.05, dur: 1.2, rev: 0.7 }));
      A.osc(S_CARD + 0.6, { f: midi(38), dur: 1.1, g: 0.08, a: 0.1, rev: 0.4 });
    },
  });

  /* =====================================================================
     "NEXT WEEK ON" — the recap's mirror. An orange fast-forward slate,
     then fragments of next week's episode: none longer than a second
     (a readout measures each against a one-second bar), each pulled from
     somewhere else in the episode (a scene map plots them, out of order),
     questions supered over them and tallied — raised, never answered —
     and a last, longer shot of the Token leaping a gap that cuts to black
     at the top of the jump. Then the airdate card: THURSDAY 9/8c.
     ===================================================================== */
  const NB = [
    { t0: 0, t1: 0.9, name: 'NEXT WEEK', kind: 'hook' },
    { t0: 0.9, t1: 6.4, name: 'FRAGMENTS · OUT OF ORDER', kind: 'act' },
    { t0: 6.4, t1: 7.3, name: 'CLIFFHANGER', kind: 'turn' },
    { t0: 7.3, t1: 7.8, name: 'BLACK', kind: 'break' },
    { t0: 7.8, t1: 10, name: 'AIRDATE', kind: 'cta' },
  ];
  // fragments: [t0, t1, shot, scene number in next week's episode]
  const NF = [
    [0.9, 1.5, 'door', 21], [1.5, 1.85, 'roll', 4], [1.85, 2.6, 'box', 27], [2.6, 2.95, 'crack', 12],
    [2.95, 3.8, 'face', 18], [3.8, 4.15, 'alarm', 30], [4.15, 4.85, 'spin', 9], [4.85, 5.25, 'scatter', 25],
    [5.25, 5.85, 'boxlight', 28], [5.85, 6.4, 'chase', 14], [6.4, 7.3, 'leap', 29],
  ];
  const NQ = [['WHO IS AT THE DOOR?', 0.95, 1.85], ['WHAT IS IN THE BOX?', 1.95, 3.4], ['WHO IS THE OTHER TOKEN?', 3.5, 5.2], ['WILL IT MAKE THE JUMP?', 6.55, 7.3]];
  const N_BLACK = 7.3, N_DATE = 7.8, NSC = 32;
  const fragAt = t => NF.findIndex(f => t >= f[0] && t < f[1]);
  const NLIGHT = { roll: 1, box: 1, crack: 1, face: 1, scatter: 1, boxlight: 1, chase: 1, leap: 1 };
  function nStage(c, W, H, tint) {
    TK.stage(c, W, H, { floor: 760 });
    if (tint) { c.fillStyle = tint; c.fillRect(0, 0, W, H); }
  }
  function box(c, x, y, s, lid = 0, glow = 0) {
    if (glow > 0) {
      const g = c.createRadialGradient(x, y - s / 2, 10, x, y - s / 2, s * 2.2);
      g.addColorStop(0, `rgba(255,220,140,${0.85 * glow})`); g.addColorStop(1, 'rgba(255,220,140,0)');
      c.fillStyle = g; c.fillRect(x - s * 2.2, y - s * 2.7, s * 4.4, s * 4.4);
      c.fillStyle = `rgba(255,240,200,${glow})`; c.beginPath(); c.moveTo(x - s / 2, y - s / 2); c.lineTo(x + s / 2, y - s / 2); c.lineTo(x + s * 1.1, y - s * 2.6); c.lineTo(x - s * 1.1, y - s * 2.6); c.closePath(); c.globalAlpha = 0.25; c.fill(); c.globalAlpha = 1;
    }
    c.fillStyle = P.ink; c.fillRect(x - s / 2, y - s / 2, s, s / 2 + s / 2);
    c.save(); c.translate(x - s / 2, y - s / 2); c.rotate(-0.5 * lid);
    c.fillStyle = '#2a2b31'; c.fillRect(-6, -s * 0.16, s + 12, s * 0.16);
    c.restore();
    text(c, '?', x, y + s * 0.18, { font: TK.FONT, weight: 900, size: s * 0.55, color: P.accent, align: 'center', base: 'middle' });
  }
  function nShot(c, t, W, H, f, u, d) {
    const [t0, , type, sc] = f, k = u / d, seed = t0 * 10;
    const [sx, sy] = shake(t, type === 'crack' || type === 'alarm' || type === 'chase' ? 9 : 3, seed);
    c.save(); c.translate(sx, sy);
    if (type === 'door') {
      c.fillStyle = '#0d0f16'; c.fillRect(-20, -20, W + 40, H + 40);
      const op = E.outC(seg(k, 0.05, 0.7)), dx = 1180, dw = 300 * op;
      const g = c.createLinearGradient(dx, 0, dx - 700, 0); g.addColorStop(0, 'rgba(180,200,255,0.35)'); g.addColorStop(1, 'rgba(180,200,255,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(dx, 220); c.lineTo(dx, 780); c.lineTo(dx - 800 * op, 1080); c.lineTo(dx - 900 * op, 1080); c.closePath(); c.fill();
      c.fillStyle = '#dfe6ff'; c.fillRect(dx, 220, dw, 560);
      c.fillStyle = '#05060a'; c.fillRect(dx + dw, 220, 300 - dw + 4, 560);
      if (dw > 40) { c.save(); c.beginPath(); c.rect(dx, 220, dw, 560); c.clip(); TK.token(c, dx + 150, 640, 220, { color: BLUE_INK }); c.restore(); }
    } else if (type === 'roll') {
      nStage(c, W, H);
      const x = lerp(-200, 2100, k);
      for (let j = 6; j >= 0; j--) TK.token(c, x - j * 70, 680, 160, { rot: (x - j * 70) / 102, alpha: j ? 0.08 : 1 });
    } else if (type === 'box') {
      nStage(c, W, H, 'rgba(23,24,28,0.25)');
      const z = 1 + 0.25 * k; c.translate(1100, 680); c.scale(z, z); c.translate(-1100, -680);
      box(c, 1240, 660, 200, 0.4 * seg(k, 0.6, 1), 0.6 * seg(k, 0.6, 1));
      TK.token(c, lerp(620, 860, E.outQ(k)), 680, 160);
    } else if (type === 'crack') {
      nStage(c, W, H);
      c.translate(960, 800); c.scale(1.8, 1.8); c.translate(-960, -800);
      const r = rng(31);
      c.strokeStyle = P.ink; c.lineWidth = 3; c.beginPath();
      for (let b = 0; b < 7; b++) {
        let x = 960, y = 770; const a = -PI + 0.2 + b / 6 * (PI - 0.4); c.moveTo(x, y);
        const n = Math.ceil(6 * E.outC(k)); for (let j = 0; j < n; j++) { x += Math.cos(a + (r() - 0.5)) * 36; y += Math.abs(Math.sin(a + (r() - 0.5))) * 22 + 6; c.lineTo(x, y); }
      }
      c.stroke();
      TK.token(c, 960, 690, 150, { rot: 0.1 * Math.sin(t * 40) });
    } else if (type === 'face') {
      nStage(c, W, H, 'rgba(47,91,255,0.1)');
      const z = 1 + 0.18 * E.ioS(k); c.translate(960, 680); c.scale(z, z); c.translate(-960, -680);
      TK.shadow(c, 720, 760, 220, 0); TK.shadow(c, 1200, 760, 220, 0);
      TK.token(c, 720, 650, 220, { rot: 0.05 });
      c.save(); c.translate(1200, 650); c.scale(-1, 1); TK.token(c, 0, 0, 220, { color: BLUE_INK, rot: 0.05 }); c.restore();
    } else if (type === 'alarm') {
      const on = Math.floor(u * 12) % 2;
      c.fillStyle = on ? '#8a1408' : '#2a0603'; c.fillRect(-20, -20, W + 40, H + 40);
      const a = u * 9, g = c.createLinearGradient(960, 540, 960 + Math.cos(a) * 1200, 540 + Math.sin(a) * 1200);
      g.addColorStop(0, 'rgba(255,80,40,0.6)'); g.addColorStop(1, 'rgba(255,80,40,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(960, 540); c.arc(960, 540, 1400, a - 0.3, a + 0.3); c.closePath(); c.fill();
      TK.token(c, 960, 600, 200, { color: '#140302' });
    } else if (type === 'spin') {
      c.fillStyle = P.blue; c.fillRect(-20, -20, W + 40, H + 40);
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 2;
      for (let i = 0; i < 20; i++) { const a = i / 20 * TAU + u * 2; c.beginPath(); c.moveTo(960 + Math.cos(a) * 240, 540 + Math.sin(a) * 240); c.lineTo(960 + Math.cos(a) * 1100, 540 + Math.sin(a) * 1100); c.stroke(); }
      TK.token(c, 960, lerp(600, 480, E.outQ(k)), 280, { rot: u * 12 });
    } else if (type === 'scatter') {
      nStage(c, W, H, 'rgba(255,90,31,0.12)');
      const L = TK.WORD.split(''), e = E.outC(k);
      L.forEach((ch, i) => {
        const x0 = 960 + (i - 2.5) * 150, vx = (hash(i * 7.3) - 0.5) * 900, vy = -200 - hash(i * 3.1) * 500;
        c.save(); c.translate(x0 + vx * e, 540 + vy * e + 600 * e * e); c.rotate((hash(i) - 0.5) * 3 * e);
        TK.word(c, 0, 0, { text: ch, size: 200, ls: 0 }); c.restore();
      });
    } else if (type === 'boxlight') {
      c.fillStyle = '#1a1308'; c.fillRect(-20, -20, W + 40, H + 40);
      box(c, 960, 700, 240, 0.9, 0.7 + 0.3 * seg(k, 0, 0.5));
      // the Token's face lit by whatever is inside — we never see it
      TK.token(c, 560, 690, 170, { color: '#ffb070' });
    } else if (type === 'chase') {
      nStage(c, W, H);
      c.fillStyle = 'rgba(23,24,28,0.06)'; for (let i = 0; i < 9; i++) c.fillRect(0, 300 + i * 50, W, 2);
      const x = lerp(1500, 2050, k);
      TK.token(c, x, 680, 150, { rot: x / 96 });
      TK.token(c, x - 520, 680, 150, { color: BLUE_INK, rot: (x - 520) / 96 });
    } else if (type === 'leap') {
      // a run-up, a gap, the leap — cut at the top of the arc
      TK.stage(c, W, H);
      const camx = lerp(0, 240, E.ioS(k));
      c.translate(-camx, 0);
      const FLR = 680;
      c.fillStyle = P.ground2; c.fillRect(-100, FLR, 1100, 400); c.fillRect(1500, FLR, 900, 400);
      c.fillStyle = 'rgba(23,24,28,0.3)'; c.fillRect(-100, FLR, 1100, 2); c.fillRect(1500, FLR, 900, 2);
      const pg = c.createLinearGradient(0, FLR, 0, FLR + 260); pg.addColorStop(0, '#26272c'); pg.addColorStop(1, '#0b0b0c');
      c.fillStyle = pg; c.fillRect(1000, FLR + 2, 500, 400);
      text(c, 'THE GAP', 1250, FLR + 80, { font: TK.MONO, size: 16, ls: 6, color: 'rgba(236,232,223,0.45)', align: 'center' });
      const run = seg(u, 0, 0.55), jump = seg(u, 0.55, 0.9);
      const x = lerp(300, 950, E.inQ(run)) + 330 * jump, y = FLR - 75 - Math.sin(jump * PI / 2) * 200;
      TK.shadow(c, x, FLR, 150, FLR - 75 - y);
      TK.token(c, x, y, 150, { rot: x / 96 + 2.4 * jump, sx: 1 - 0.1 * jump, sy: 1 + 0.12 * jump });
    }
    c.restore();
    // a hard white frame on every cut
    if (u < 0.04) { c.fillStyle = `rgba(255,255,255,${0.55 * (1 - u / 0.04)})`; c.fillRect(0, 0, W, H); }
  }
  function nPanel(c, x, y, w, h) { c.fillStyle = 'rgba(11,11,12,0.72)'; c.fillRect(x, y, w, h); }
  function nHud(c, t, W, H, i) {
    const LM = 'rgba(236,232,223,0.55)';
    // fragment length vs one second
    if (i >= 0 && t < N_BLACK) {
      const f = NF[i], d = f[1] - f[0];
      nPanel(c, 72, 92, 440, 82);
      label(c, i === NF.length - 1 ? 'LAST SHOT  ·  LONGEST' : `FRAGMENT ${String(i + 1).padStart(2, '0')}`, 90, 118, { size: 13, color: CREAM, weight: 700 });
      text(c, d.toFixed(2) + ' s', 494, 120, { font: TK.MONO, weight: 700, size: 22, color: P.accent, align: 'right' });
      const bx = 90, bw = 400, by = 140;
      c.fillStyle = 'rgba(236,232,223,0.2)'; c.fillRect(bx, by, bw, 8);
      c.fillStyle = CREAM; c.fillRect(bx, by, bw * d * clamp((t - f[0]) / d), 8);
      c.fillStyle = P.accent; c.fillRect(bx + bw - 1, by - 5, 2, 18);
      label(c, '1 s', bx + bw, by + 26, { size: 11, align: 'right', color: LM });
      label(c, 'EVERY FRAGMENT UNDER A SECOND', bx, by + 26, { size: 11, ls: 1.5, color: LM });
    }
    // questions tally
    const raised = NQ.filter(q => t >= q[1]).length;
    if (t >= 0.95) {
      const dk = t < N_DATE;
      if (dk) nPanel(c, W - 432, 92, 360, 82);
      const ink = dk ? CREAM : P.ink, mu = dk ? LM : P.mute;
      label(c, 'QUESTIONS RAISED', W - 90, 118, { align: 'right', size: 13, color: mu });
      text(c, String(raised), W - 300, 122, { font: TK.MONO, weight: 700, size: 26, color: ink, align: 'right' });
      label(c, 'ANSWERED', W - 90, 156, { align: 'right', size: 13, color: mu });
      text(c, '0', W - 300, 160, { font: TK.MONO, weight: 700, size: 26, color: P.accent, align: 'right' });
      for (let q = 0; q < NQ.length; q++) { c.fillStyle = q < raised ? P.accent : (dk ? 'rgba(236,232,223,0.2)' : 'rgba(23,24,28,0.15)'); c.fillRect(W - 414 + q * 22, 106, 14, 14); }
    }
    // scene map: x = where the fragment sits in next week's episode, y = when the promo shows it
    if (t >= 0.9 && t < N_DATE) {
      const x0 = 1250, x1 = W - 96, top = 884, bot = 1000, X = s => lerp(x0, x1, (s - 0.5) / NSC), Y = k => lerp(top, bot - 14, k / (NF.length - 1));
      nPanel(c, 1180, 832, W - 72 - 1180, 206);
      label(c, `NEXT WEEK’S EPISODE  ·  SCENES 1–${NSC}  →`, x0, 858, { size: 12, ls: 2, color: LM });
      label(c, 'PROMO', 1196, top + 6, { size: 11, ls: 1.5, color: LM });
      label(c, 'ORDER ↓', 1196, top + 24, { size: 11, ls: 1.5, color: LM });
      c.fillStyle = 'rgba(236,232,223,0.22)'; c.fillRect(x0, bot, x1 - x0, 1.5);
      for (let s = 1; s <= NSC; s++) c.fillRect(X(s) - 0.5, bot - (s % 5 ? 3 : 7), 1, s % 5 ? 3 : 7);
      const shown = NF.filter(f => t >= f[0]);
      c.strokeStyle = 'rgba(255,90,31,0.6)'; c.lineWidth = 1.5; c.beginPath();
      shown.forEach((f, k) => { const px = X(f[3]), py = Y(k); k ? c.lineTo(px, py) : c.moveTo(px, py); });
      c.stroke();
      shown.forEach((f, k) => {
        const cur = k === i, px = X(f[3]), py = Y(k);
        c.fillStyle = 'rgba(236,232,223,0.1)'; c.fillRect(px - 0.5, py, 1, bot - py);
        c.fillStyle = cur ? P.accent : CREAM; c.beginPath(); c.arc(px, py, cur ? 6 : 3.5, 0, TAU); c.fill();
        if (cur) label(c, `SC ${f[3]}`, px + (f[3] > 24 ? -12 : 12), py + 5, { align: f[3] > 24 ? 'right' : 'left', size: 12, color: CREAM, weight: 700 });
      });
      label(c, 'PROMO ORDER ≠ STORY ORDER', x0, bot + 26, { size: 11, ls: 1.5, color: LM });
    }
  }
  MG.film({
    id: 'formatnextweek', dur: 10, poster: 2.3,
    fonts: FONTS,
    meta: {
      family: 'M', name: '"Next Week On" Promo', sub: 'Fragments, questions, no answers', era: '1960s —',
      origin: 'Episodic television has always sold the next episode at the end of this one. US network series closed on scenes from next week’s episode for decades, and serialised drama sharpened the form into a montage of very short fragments cut out of order, questions supered or voiced over them, a cut to black before anything lands, and the airdate and time slot — “9/8c”, nine Eastern, eight Central. Anime made it a ritual: the narrated next-episode previews of Dragon Ball Z (1989–96) and Neon Genesis Evangelion (1995–96), whose previews, narrated by Misato, end on “Service, service!”; Lost (ABC, 2004–10) leaned on its promos to keep its mysteries open.',
      works: 'Dragon Ball Z (1989–96; “Next time on…”) · Neon Genesis Evangelion (1995–96; next-episode previews) · Lost (ABC, 2004–10)',
      tech: ['Fragments under a second, cut out of story order', 'Questions raised, never answered', 'Cut to black mid-action, then airdate + time slot'],
      accent: '#ff5a1f',
      motionDNA: 'A 0.9 s orange slate; ten fragments from 0.3 to 0.85 s, every cut on a hit with a white frame; four questions supered over them; the last shot runs longest — a run-up and a leap — and cuts to black at the top of the arc at 7.3 s with the sound; half a second of black; the airdate card lands at 7.8 s with a three-note network sting.',
      visualDNA: 'Next week in full colour, unlike the recap’s drained past: the paper stage lit blue, red, amber; a second Token in ink-blue; a box with a question mark whose contents we never see. Bold cream questions on black bands. HUD panels: each fragment’s length against a one-second bar, a questions-raised / answered tally, a scene map plotting the fragments out of order. Airdate card in ink and orange on paper.',
      transitions: 'Hard cuts with one white frame; a cut to black mid-action; a chevron wipe onto the airdate card',
      implementation: ['Editorial: a promo cut from next week’s dailies or locked cut', 'Questions as supers or VO; the airdate from the network’s promo package', 'Canvas 2D: a fragment list with scene numbers; HUD computed from the list'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const i = fragAt(t);
      let dark = true;
      if (t < 0.9) {
        // the slate: orange field, fast-forward chevrons
        c.fillStyle = P.accent; c.fillRect(0, 0, W, H);
        const sl = E.outQt(seg(t, 0.0, 0.35));
        c.fillStyle = 'rgba(23,24,28,0.12)';
        for (let k = 0; k < 7; k++) { const x = -300 + k * 360 + t * 900; c.beginPath(); c.moveTo(x, 200); c.lineTo(x + 140, 540); c.lineTo(x, 880); c.lineTo(x + 70, 880); c.lineTo(x + 210, 540); c.lineTo(x + 70, 200); c.closePath(); c.fill(); }
        c.save(); c.translate(lerp(-500, 0, sl), 0);
        text(c, 'NEXT WEEK', 960, 520, { font: TK.FONT, weight: 900, size: 190, ls: 6, color: P.ink, align: 'center', base: 'middle' });
        c.restore();
        text(c, 'ON  MOTION', 960, 660, { font: TK.MONO, weight: 700, size: 30, ls: 14, color: `rgba(23,24,28,${seg(t, 0.25, 0.45)})`, align: 'center', base: 'middle' });
        dark = false;
      } else if (t < N_BLACK) {
        const f = NF[i];
        nShot(c, t, W, H, f, t - f[0], f[1] - f[0]);
        dark = !NLIGHT[f[2]];
      } else if (t < N_DATE) {
        c.fillStyle = BLACK; c.fillRect(0, 0, W, H);
        note(c, 'CUT TO BLACK  ·  MID-ACTION  ·  NO LANDING', 760, 520, seg(t, N_BLACK - 0.04, N_BLACK + 0.1), { size: 16 });
        note(c, 'SOUND CUTS WITH THE PICTURE', 760, 552, seg(t, N_BLACK + 0.18, N_BLACK + 0.3), { size: 14, color: CREAM2 });
      } else {
        dark = false;
        const u = t - N_DATE;
        c.fillStyle = P.ground; c.fillRect(0, 0, W, H);
        // chevron wipe off
        const wp = E.inC(seg(u, 0, 0.35));
        if (wp < 1) { c.fillStyle = P.accent; c.beginPath(); c.moveTo(W * wp, 0); c.lineTo(W + 400, 0); c.lineTo(W + 400, H); c.lineTo(W * wp, H); c.lineTo(W * wp + 300, H / 2); c.closePath(); c.fill(); }
        const a = E.outC(seg(u, -0.2, 0.25));   // the card is already there under the wipe on the cut frame
        c.save(); c.globalAlpha = a;
        c.fillStyle = P.accent; rrect(c, 960 - 110, 268, 220, 44, 22); c.fill();
        text(c, 'ALL-NEW', 960, 299, { font: TK.MONO, weight: 700, size: 22, ls: 6, color: P.ground, align: 'center' });
        TK.word(c, 960, 410, { size: 150, color: P.ink, ls: 8 });
        c.restore();
        const b = E.outB(seg(u, 0.45, 0.85), 1.6);
        c.save(); c.translate(960, 600); c.scale(lerp(0.6, 1, b), lerp(0.6, 1, b)); c.globalAlpha = seg(u, 0.45, 0.6);
        const w1 = tw(c, 'THURSDAY', 120, 900, TK.FONT, 4), w2 = tw(c, '9/8c', 120, 900, TK.FONT, 0), x0 = -(w1 + 50 + w2) / 2;
        text(c, 'THURSDAY', x0, 0, { font: TK.FONT, weight: 900, size: 120, ls: 4, color: P.ink, base: 'middle' });
        text(c, '9/8c', x0 + w1 + 50, 0, { font: TK.FONT, weight: 900, size: 120, ls: 0, color: P.accent, base: 'middle' });
        c.restore();
        TK.token(c, 960 - 160, 290, 44, { alpha: seg(u, 0.85, 1.0), rot: (1 - E.outB(seg(u, 0.85, 1.2))) * -PI });
        FK.label(c, 'AIRDATE + TIME SLOT', 600, 780, { size: 14, ls: 2.5, color: P.ink, weight: 700 }); c.fillStyle = P.accent; c.fillRect(586, 769, 4, 12);
        FK.label(c, '9/8c  =  9 PM EASTERN · 8 PM CENTRAL', 600, 806, { size: 13, ls: 2, color: P.mute });
        FK.label(c, 'NOTHING WAS RESOLVED  ·  THAT IS THE POINT', 600, 832, { size: 13, ls: 2, color: P.mute });
      }
      // questions supered over the fragments
      NQ.forEach(([q, a, b]) => {
        const on = win(t, a, b, 0.08); if (on <= 0 || t >= N_BLACK) return;
        c.save(); c.globalAlpha = on;
        const w = tw(c, q, 64, 900, TK.FONT, 3);
        c.fillStyle = 'rgba(7,7,8,0.82)'; c.fillRect(960 - w / 2 - 30, 204, w + 60, 96);
        const dy = (1 - E.outC(seg(t, a, a + 0.15))) * 16;
        text(c, q, 960, 276 + dy, { font: TK.FONT, weight: 900, size: 64, ls: 3, color: CREAM, align: 'center' });
        c.restore();
      });
      nHud(c, t, W, H, i);
      // full-bleed orange (the slate, and the chevron as it wipes off the airdate card): scrim the strip and caption
      const orange = t < 0.9 ? 1 : t >= N_DATE ? 1 - E.inC(seg(t - N_DATE, 0, 0.35)) : 0;
      orangeScrim(c, W, H, orange);
      FK.strip(c, t, W, H, NB, { dark: dark || orange > 0.5, label: 'Next week on' });
      FK.caption(c, t, W, H, { name: '"Next Week On" Promo', cat: 'Film & TV', dark: t < N_DATE || orange > 0.5 });
    },
    score(A) {
      // slate: tape-wind whoosh up into a stab
      A.whoosh(0, 0.35, { f1: 300, f2: 5000, g: 0.08, swell: 0.9 });
      A.kick(0.32, 0.4, { f: 140, f2: 45 }); A.clap(0.32, 0.18);
      A.chord(0.32, [57, 64, 69, 72], { type: 'sawtooth', dur: 0.45, g: 0.03, lp: 2800, rev: 0.3, width: 0.8 });
      // the drive under the fragments: staccato strings on sixteenths, stepping up a tone per question
      for (let t = 0.9; t < N_BLACK - 0.01; t += 0.125) {
        const q = NQ.filter(x => t >= x[1]).length, r = 45 + [0, 2, 3, 5, 7][q];
        A.osc(t, { type: 'sawtooth', f: midi(r - 12 + ((Math.round(t * 8) % 4 === 2) ? 7 : 0)), dur: Math.min(0.1, N_BLACK - t), g: 0.035, a: 0.005, lp: 900 + 300 * q, rev: 0.15 });
      }
      // a hit on every cut, and each fragment's own sound, cut off with it
      NF.forEach(([t0, t1, type], k) => {
        const d = t1 - t0;
        A.kick(t0, 0.3, { f: 130, f2: 42 }); A.noise(t0, { type: 'highpass', f: 2500, dur: 0.04, g: 0.08 });
        const o = { door: () => A.noise(t0, { type: 'bandpass', f: 400, f2: 900, q: 4, dur: d, g: 0.08, hold: true, rel: 0.01 }),
          roll: () => A.noise(t0, { type: 'lowpass', f: 500, dur: d, g: 0.08, hold: true, rel: 0.01 }),
          box: () => A.osc(t0 + d * 0.6, { f: midi(84), f2: midi(91), glide: d * 0.4, dur: d * 0.4, g: 0.04, hold: true, rel: 0.01 }),
          crack: () => { A.noise(t0, { type: 'highpass', f: 1800, dur: 0.08, g: 0.14 }); A.osc(t0, { f: 80, f2: 40, dur: d, g: 0.2 }); },
          face: () => A.osc(t0, { type: 'sawtooth', f: midi(34), dur: d, g: 0.05, lp: 500, a: 0.2, hold: true, rel: 0.01 }),
          alarm: () => { for (let j = 0; j < 4; j++) A.osc(t0 + j * 0.0833, { type: 'square', f: j % 2 ? 660 : 880, dur: 0.08, g: 0.03, lp: 2500 }); },
          spin: () => A.whoosh(t0, d, { f1: 300, f2: 3000, g: 0.08, swell: 0.6 }),
          scatter: () => { A.impact(t0, 0.28); A.noise(t0, { type: 'bandpass', f: 3000, q: 0.8, dur: d, g: 0.06, hold: true, rel: 0.01 }); },
          boxlight: () => A.chord(t0, [72, 76, 79, 83], { type: 'sine', dur: d, g: 0.025, a: 0.05, hold: true, rel: 0.01, rev: 0.5 }),
          chase: () => { for (let j = 0; j < 4; j++) A.kick(t0 + 0.06 + j * 0.12, 0.12, { f: 200, f2: 110, dur: 0.06 }); },
          leap: () => {},
        };
        (o[type] || (() => {}))();
      });
      // a low boom under each question
      NQ.forEach(([, a]) => { A.osc(a, { f: 60, f2: 38, glide: 0.4, dur: 0.6, g: 0.22 }); A.bell(a, midi(76), { g: 0.035, dur: 0.6, rev: 0.6 }); });
      // the leap: run-up steps, a riser — everything stops dead on the cut
      for (let j = 0; j < 5; j++) A.kick(6.4 + j * 0.1, 0.12, { f: 220, f2: 120, dur: 0.05 });
      A.riser(6.4, N_BLACK - 6.4, { g: 0.09, f: 110 });
      A.osc(6.9, { type: 'sawtooth', f: midi(57), f2: midi(69), glide: 0.4, dur: N_BLACK - 6.9, g: 0.04, lp: 2000, hold: true, rel: 0.005 });
      // the airdate card: chevron whoosh, a three-note network sting
      A.whoosh(N_DATE - 0.05, 0.35, { f1: 3000, f2: 400, g: 0.07, swell: 0.3 });
      A.kick(N_DATE + 0.45, 0.35, { f: 140, f2: 50 });
      [[0.45, 72], [0.62, 76], [0.8, 79]].forEach(([d, m]) => A.bell(N_DATE + d, midi(m), { g: 0.07, dur: 1.4, rev: 0.5 }));
      A.chord(N_DATE + 0.8, [48, 55, 60, 64, 67], { type: 'triangle', dur: 1.4, g: 0.03, a: 0.02, lp: 2400, rev: 0.6, width: 0.8 });
    },
  });

  /* =====================================================================
     AD-BREAK BUMPER — the two short idents that bracket a commercial
     break. The act ends on a hook (the blue cube tips at the table's
     edge, freeze, dip to black); the out-bumper (logo, WE'LL BE RIGHT
     BACK, a one-beat loop); the break itself compressed ×35 — the pod of
     spots on a timeline, the current spot in a monitor, a break clock
     counting down two minutes; the in-bumper (the same loop, NOW BACK
     TO); the act in, which repeats the last beat of the act out and then
     carries on, with the logo bug in the corner. A rundown of the half
     hour runs top right.
     ===================================================================== */
  const BB = [
    { t0: 0, t1: 1.6, name: 'ACT OUT', kind: 'act' },
    { t0: 1.6, t1: 3.0, name: 'OUT-BUMPER', kind: 'title' },
    { t0: 3.0, t1: 6.4, name: 'BREAK · 2:00', kind: 'break' },
    { t0: 6.4, t1: 7.8, name: 'IN-BUMPER', kind: 'title' },
    { t0: 7.8, t1: 10, name: 'ACT IN', kind: 'act' },
  ];
  const B_FREEZE = 1.25, B_OUT = 1.6, B_BRK = 3.0, B_IN = 6.4, B_ACT = 7.8, BRK_S = 120, B_K = BRK_S / (B_IN - B_BRK);
  // the pod: [seconds, kind, name]
  const POD = [[30, 'AD', 'SPOT A · SOAP'], [30, 'AD', 'SPOT B · CAR'], [15, 'PROMO', 'TONIGHT AT 10'], [15, 'AD', 'SPOT C · CEREAL'], [30, 'AD', 'SPOT D · PHONE']];
  const POD_T = (() => { let s = 0; return POD.map(p => { const a = s; s += p[0]; return [a, s]; }); })();
  const B_TABLE = 1300, B_TY = 640;
  /* The show: a table edge, a blue cube teetering, the Token reaching for it. u is story time. */
  function bShow(c, W, H, u) {
    TK.stage(c, W, H, { floor: 860 });
    c.fillStyle = P.ink; c.fillRect(200, B_TY, B_TABLE - 200, 24); c.fillRect(260, B_TY + 24, 24, 860 - B_TY - 24); c.fillRect(B_TABLE - 70, B_TY + 24, 24, 860 - B_TY - 24);
    // cube teeters on the edge: angle grows, then (after the break) falls and is caught
    const S = 150, teeter = 0.32 * E.ioS(seg(u, 0.2, 1.25)) + 0.06 * Math.sin(u * 7) * seg(u, 0.4, 1.25);
    const fall = seg(u, 1.6, 2.15), caught = u >= 2.15;
    const tx = lerp(760, 1040, E.ioS(seg(u, 0, 1.2)));
    // the cube rotates about the table's corner
    const pvx = B_TABLE, pvy = B_TY;
    c.save();
    if (!caught) {
      const r = u < 1.6 ? teeter : lerp(teeter, 1.2, E.inQ(fall));
      const drop = u < 1.6 ? 0 : 380 * E.inQ(fall);
      c.translate(pvx, pvy + drop); c.rotate(r);
      c.fillStyle = P.blue; c.fillRect(-S, -S, S, S);
      c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(-S, -S * 0.15, S, S * 0.15);
    } else {
      const sq = Math.exp(-(u - 2.15) * 10) * Math.sin((u - 2.15) * 30) * 0.1;
      c.translate(B_TABLE + 120, 860 - 150 - S / 2 + 4); c.scale(1 + sq, 1 - sq);
      c.fillStyle = P.blue; c.fillRect(-S / 2, -S / 2, S, S);
    }
    c.restore();
    // the Token: slides up to the cube, then dives off the table to catch it underneath
    if (!caught && u < 1.6) {
      TK.token(c, tx, B_TY - 70, 140, { rot: 0.1 * Math.sin(u * 3) });
    } else if (!caught) {
      const dv = E.inQ(fall);
      TK.token(c, lerp(1040, B_TABLE + 120, E.outQ(fall)), lerp(B_TY - 70, 860 - 70, dv), 140, { rot: -0.6 * fall });
    } else {
      TK.shadow(c, B_TABLE + 120, 860, 140, 0);
      TK.token(c, B_TABLE + 120, 860 - 70, 140, { sx: 1.04, sy: 0.96 });
    }
  }
  function bBumper(c, t, W, H, a, inb) {
    const u = t - a, d = 1.4;
    const bg = inb ? P.blue : P.accent;
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    // the logo loop comes up fast and is already most of the way in on the cut frame
    const wi = E.outQt(seg(u, -0.08, 0.2));
    // the loop: one beat (0.5 s) — the Token hops over the word and lands
    const beat = 0.5, lu = (u % beat) / beat, n = Math.floor(u / beat);
    c.fillStyle = 'rgba(255,255,255,0.08)';
    for (let k = 0; k < 12; k++) { const r = 120 + ((k * 90 + lu * 90) % 1080); c.beginPath(); c.arc(960, 470, r, 0, TAU); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.08)'; c.stroke(); }
    c.save(); c.globalAlpha = wi;
    TK.word(c, 960, 470, { size: 200, color: inb ? P.ground : P.ink, ls: 10 });
    const hop = Math.sin(lu * PI) * 120, sq = lu < 0.12 ? (1 - lu / 0.12) * 0.18 : 0;
    TK.token(c, lerp(560, 1360, (n % 2 ? 1 - lu : lu)), 300 - hop, 90, { color: inb ? P.accent : P.ground, sx: 1 + sq, sy: 1 - sq, rot: (n % 2 ? -1 : 1) * lu * PI / 2 });
    text(c, inb ? 'NOW BACK TO' : 'WE’LL BE RIGHT BACK', 960, 650, { font: TK.FONT, weight: 800, size: 54, ls: 12, color: inb ? P.ground : P.ink, align: 'center' });
    c.restore();
    // loop counter + bumper length
    const ink = inb ? P.ground : P.ink;
    label(c, `LOOP  ·  0.5 s  ·  ×${Math.min(n + 1, 3)}`, 960, 720, { align: 'center', size: 13, color: ink });
    c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(760, 740, 400, 4);
    c.fillStyle = ink; c.fillRect(760, 740, 400 * clamp(u / d), 4);
    for (let k = 1; k < 3; k++) c.fillRect(760 + 400 * k * 0.5 / d - 0.5, 735, 1, 14);
    note(c, inb ? 'IN-BUMPER  ·  SAME LOOP, NEW LINE  ·  ≈ 5 s ON AIR' : 'OUT-BUMPER  ·  LOGO + A SHORT LOOP  ·  ≈ 5 s ON AIR', 80, 112, seg(u, 0.1, 0.25), { color: ink, size: 13 });
    note(c, inb ? 'SEPARATES THE ADS FROM THE SHOW, AGAIN' : 'SEPARATES THE SHOW FROM THE ADS', 80, 140, seg(u, 0.3, 0.45), { color: ink, size: 13 });
  }
  function bSpot(c, x, y, w, h, i, k, t) {   // a tiny generic spot inside the monitor, k = 0..1 through it
    c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
    const cx = x + w / 2, cy = y + h / 2;
    if (i === 0) {   // soap: bubbles
      c.fillStyle = '#bfe3f2'; c.fillRect(x, y, w, h);
      for (let b = 0; b < 14; b++) { const bx = x + hash(b) * w, by = y + h - ((k * 600 + hash(b + 9) * h) % (h + 60)); c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 3; c.beginPath(); c.arc(bx, by, 14 + hash(b * 3) * 26, 0, TAU); c.stroke(); }
      c.fillStyle = '#2d7fa6'; rrect(c, cx - 50, cy - 70, 100, 150, 20); c.fill();
      text(c, 'FRESH', cx, cy + 10, { font: TK.FONT, weight: 900, size: 26, color: '#fff', align: 'center', base: 'middle' });
    } else if (i === 1) {   // car: a road and a shape
      c.fillStyle = '#20232b'; c.fillRect(x, y, w, h); c.fillStyle = '#3a3e48'; c.fillRect(x, cy + 50, w, h);
      for (let s = 0; s < 8; s++) { c.fillStyle = '#d8d2c2'; c.fillRect(x + ((s * 130 - k * 900) % (w + 130) + w + 130) % (w + 130) - 60, cy + 110, 60, 6); }
      c.fillStyle = '#e8e2d4'; rrect(c, cx - 140, cy - 10, 280, 60, 18); c.fill(); rrect(c, cx - 70, cy - 50, 150, 50, 16); c.fill();
      c.fillStyle = '#111'; c.beginPath(); c.arc(cx - 80, cy + 52, 22, 0, TAU); c.arc(cx + 80, cy + 52, 22, 0, TAU); c.fill();
    } else if (i === 2) {   // the channel's own promo
      c.fillStyle = P.ink; c.fillRect(x, y, w, h);
      TK.token(c, cx, cy - 40, 70, { rot: k * PI });
      text(c, 'TONIGHT AT 10', cx, cy + 50, { font: TK.FONT, weight: 800, size: 34, ls: 6, color: CREAM, align: 'center', base: 'middle' });
    } else if (i === 3) {   // cereal: a bowl, bouncing bits
      c.fillStyle = '#ffd34d'; c.fillRect(x, y, w, h);
      for (let b = 0; b < 10; b++) { const ph = (k * 4 + hash(b)) % 1; c.fillStyle = b % 2 ? P.accent : '#c63e0c'; c.beginPath(); c.arc(cx - 120 + b * 26, cy + 10 - Math.sin(ph * PI) * 90, 10, 0, TAU); c.fill(); }
      c.fillStyle = '#fff'; c.beginPath(); c.arc(cx, cy + 20, 150, 0, PI); c.fill();
    } else {   // phone: a glowing slab
      c.fillStyle = '#e9e6ff'; c.fillRect(x, y, w, h);
      c.save(); c.translate(cx, cy); c.rotate(-0.3 + 0.3 * k);
      c.fillStyle = '#17181c'; rrect(c, -60, -110, 120, 220, 18); c.fill();
      const g = c.createLinearGradient(0, -100, 0, 100); g.addColorStop(0, '#7a5cff'); g.addColorStop(1, '#2f5bff'); c.fillStyle = g; rrect(c, -52, -100, 104, 200, 12); c.fill();
      c.restore();
    }
    c.restore();
  }
  function bBreak(c, t, W, H) {
    const u = t - B_BRK, s = u * B_K;   // real seconds into the break
    c.fillStyle = '#121317'; c.fillRect(0, 0, W, H);
    const cur = Math.min(POD.length - 1, POD_T.findIndex(p => s < p[1]) < 0 ? POD.length - 1 : POD_T.findIndex(p => s < p[1]));
    // the monitor
    const mx = 600, my = 150, mw = 720, mh = 405;
    const k = clamp((s - POD_T[cur][0]) / POD[cur][0]);
    bSpot(c, mx, my, mw, mh, cur, k, t);
    // a black frame between spots (not before the first: the cut in from the bumper lands on spot A)
    if (cur > 0 && k < 0.05) { c.fillStyle = '#000'; c.fillRect(mx, my, mw, mh); }
    c.strokeStyle = 'rgba(236,232,223,0.35)'; c.lineWidth = 2; c.strokeRect(mx - 1, my - 1, mw + 2, mh + 2);
    label(c, `${POD[cur][1]}  ·  :${POD[cur][0]}  ·  ${POD[cur][2]}`, mx, my - 14, { size: 13, color: CREAM, weight: 700 });
    // the break clock
    const left = Math.max(0, BRK_S - s), mm = Math.floor(left / 60), ss = Math.floor(left % 60);
    label(c, 'BREAK CLOCK', 1400, 210, { size: 13, ls: 3 });
    text(c, `${mm}:${String(ss).padStart(2, '0')}`, 1400, 300, { font: TK.MONO, weight: 700, size: 88, color: left < 10 ? P.accent : CREAM });
    label(c, 'REMAINING', 1400, 332, { size: 12, ls: 2 });
    note(c, `TIME-COMPRESSED  ×${B_K.toFixed(0)}`, 1400, 400, 1, { size: 13 });
    label(c, '2:00 OF ADS IN 3.4 s', 1412, 426, { size: 12, ls: 1.5 });
    // left: what a break is made of
    label(c, 'COMMERCIAL BREAK 2 OF 4', 520, 210, { size: 13, ls: 3, align: 'right', color: CREAM, weight: 700 });
    label(c, 'A POD OF SPOTS', 520, 236, { size: 12, ls: 2, align: 'right' });
    label(c, 'SOLD IN :15 / :30', 520, 258, { size: 12, ls: 2, align: 'right' });
    label(c, 'PLUS THE CHANNEL’S', 520, 290, { size: 12, ls: 2, align: 'right' });
    label(c, 'OWN PROMO', 520, 312, { size: 12, ls: 2, align: 'right' });
    // the pod timeline
    const px0 = 360, px1 = 1560, py = 650, X = v => lerp(px0, px1, v / BRK_S);
    POD.forEach((p, j) => {
      const [a, b] = POD_T[j], on = j === cur, done = s >= b;
      c.fillStyle = on ? P.accent : done ? 'rgba(236,232,223,0.35)' : 'rgba(236,232,223,0.1)';
      c.fillRect(X(a) + 2, py, X(b) - X(a) - 4, 40);
      if (p[1] === 'PROMO') { c.strokeStyle = CREAM; c.setLineDash([4, 4]); c.lineWidth = 1.5; c.strokeRect(X(a) + 2.5, py + 0.5, X(b) - X(a) - 5, 39); c.setLineDash([]); }
      label(c, `:${p[0]}`, X(a) + 12, py + 27, { size: 14, color: on ? P.ink : CREAM, weight: 700 });
      label(c, p[1], X(a) + 12, py + 68, { size: 12, ls: 2, color: on ? CREAM : 'rgba(236,232,223,0.5)' });
    });
    c.fillStyle = CREAM; c.fillRect(X(Math.min(s, BRK_S)) - 1, py - 10, 2, 60);
    label(c, '0:00', px0, py - 18, { size: 11 }); label(c, '2:00', px1, py - 18, { size: 11, align: 'right' });
    note(c, 'BREAK DURATION  ·  2:00  ·  FIVE SLOTS', px0, py + 120, seg(u, 0.2, 0.5), { size: 13 });
  }
  function bRundown(c, t, W, dark) {
    // a half hour: 4 acts, 3 breaks (bumpers either side), top right
    const R = [['ACT 1', 6], ['', 2], ['ACT 2', 6], ['', 2.7], ['ACT 3', 5.5], ['', 2.7], ['ACT 4', 4.5], ['', 0.6]];
    const tot = R.reduce((s, r) => s + r[1], 0), x0 = 1180, x1 = 1848, y = 100;
    const ink = dark ? CREAM : P.ink, mu = dark ? 'rgba(236,232,223,0.5)' : P.mute;
    label(c, 'THE HALF HOUR  ·  ≈ 22 MIN SHOW + 8 MIN ADS', x1, y - 6, { align: 'right', size: 11, ls: 1.5, color: mu });
    let s = 0;
    R.forEach(([n, d], j) => {
      const a = lerp(x0, x1, s / tot), b = lerp(x0, x1, (s + d) / tot);
      const isBreak = !n, here = j === 3 ? (t >= B_OUT && t < B_ACT) : j === 2 ? t < B_OUT : j === 4 ? t >= B_ACT : false;
      c.fillStyle = isBreak ? (here ? P.accent : (dark ? 'rgba(236,232,223,0.25)' : 'rgba(23,24,28,0.2)')) : (here ? ink : (dark ? 'rgba(236,232,223,0.12)' : 'rgba(23,24,28,0.08)'));
      c.fillRect(a + 1, y + 6, b - a - 2, 14);
      if (n) label(c, n, a + 6, y + 40, { size: 11, ls: 1.5, color: here ? ink : mu, weight: here ? 700 : 400 });
      s += d;
    });
  }
  MG.film({
    id: 'formatbumper', dur: 10, poster: 4.3,
    fonts: FONTS,
    meta: {
      family: 'M', name: 'Ad-break Bumper', sub: 'We’ll be right back · now back to', era: '1950s —',
      origin: 'Commercial television split its programmes into acts around advertising from the start, and short station or programme idents either side of the break — bumpers — marked where the show stopped and resumed. In the US the FCC’s 1974 policy on children’s television required a separation device around the ads in children’s programmes, which made bumpers a fixture of Saturday-morning cartoons; Japanese anime has its own version in the mid-episode eyecatch. Cartoon Network’s and Adult Swim’s bumps from the late 1990s and 2000s turned the form into a showcase. Writers end each act on a hook — the act out — and the act in often repeats its last beat.',
      works: 'Saturday-morning cartoon bumpers (US, 1970s–90s) · Cowboy Bebop (1998; eyecatches) · Adult Swim bumps (2001 —)',
      tech: ['Act out on a hook, dip to black', 'Out- and in-bumper: logo, one line, a short loop', 'Act in repeats the last beat; logo bug on'],
      accent: '#ff5a1f',
      motionDNA: 'The act runs to a freeze at 1.25 s and dips to black; the out-bumper wipes in at 1.6 s, its logo loop on half-second beats, ending on an unresolved chord; the break runs compressed ×35, five spots in 3.4 s, each with its own jingle and a black frame between; the in-bumper at 6.4 s plays the same loop and resolves; the act in at 7.8 s replays the teeter and goes on — the catch lands at about 9.15 s.',
      visualDNA: 'The show on the paper stage: an ink table, a blue cube tipping off its edge, the orange Token. Bumpers as full-bleed orange (out) and blue (in) cards with MOTION and the hopping Token. The break in master-control grey: a monitor with generic spots, the pod as a slot timeline with :15 / :30 labels, a big mono break clock. A rundown of the half hour top right, a translucent logo bug bottom right.',
      transitions: 'Freeze and dip to black out of the act; hard wipes in and out of the bumpers; a black frame between spots; a straight cut back into the act',
      implementation: ['Network presentation package: bumpers, logo bug, break format', 'Playout automation inserts the pod between the bumpers', 'Canvas 2D: one show rig driven by story time, a pod table driving monitor, timeline and clock'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      let dark = false;
      if (t < B_OUT) {
        const u = Math.min(t, B_FREEZE);
        bShow(c, W, H, u);
        note(c, 'ACT OUT  ·  END THE ACT ON A HOOK', 80, 112, 1, { color: P.ink, size: 13 });
        if (t >= B_FREEZE) {
          note(c, 'FREEZE  ·  DIP TO BLACK', 80, 140, seg(t, B_FREEZE, B_FREEZE + 0.08), { color: P.ink, size: 13 });
          const d = seg(t, B_FREEZE + 0.05, B_OUT - 0.05); c.fillStyle = `rgba(7,7,8,${d})`; c.fillRect(0, 0, W, H);
          dark = d > 0.5;
        }
      } else if (t < B_BRK) {
        bBumper(c, t, W, H, B_OUT, false);
      } else if (t < B_IN) {
        bBreak(c, t, W, H); dark = true;
      } else if (t < B_ACT) {
        bBumper(c, t, W, H, B_IN, true); dark = true;
      } else {
        const u = t - B_ACT, story = 0.8 + u;   // the act in starts 0.45 s before the freeze point
        bShow(c, W, H, story);
        note(c, 'ACT IN  ·  REPEATS THE LAST BEAT, THEN GOES ON', 80, 112, 1, { color: P.ink, size: 13 });
        if (story < B_FREEZE) note(c, 'REPLAY  ·  THE LAST 0.45 s OF THE ACT OUT', 80, 140, 1, { color: P.mute, size: 13 });
        else note(c, 'NEW STORY FROM HERE', 80, 140, seg(story, B_FREEZE, B_FREEZE + 0.1), { color: P.ink, size: 13 });
        // the logo bug
        const bg = seg(u, 0.3, 0.7);
        c.save(); c.globalAlpha = 0.45 * bg;
        TK.token(c, 1640, 940, 40, { color: P.ink });
        text(c, 'MOTION', 1672, 948, { font: TK.FONT, weight: 900, size: 26, ls: 2, color: P.ink });
        c.restore();
        note(c, 'LOGO BUG  ·  ~45 % OPACITY', 1848, 896, seg(u, 0.6, 0.9), { color: P.ink, size: 12, align: 'right' });
        if (u < 0.08) { c.fillStyle = `rgba(7,7,8,${0.5 * (1 - u / 0.08)})`; c.fillRect(0, 0, W, H); }   // a quick lift from the dip, never a black cut frame
      }
      // the out-bumper is full-bleed orange: scrim the strip, caption and rundown and use their dark ink
      const orange = t >= B_OUT && t < B_BRK;
      orangeScrim(c, W, H, orange ? 1 : 0, { box: [1166, 76, 696, 78] });
      bRundown(c, t, W, dark || orange || (t >= B_BRK && t < B_IN));
      FK.strip(c, t, W, H, BB, { dark: dark || orange || (t >= B_BRK && t < B_IN), label: 'The break' });
      FK.caption(c, t, W, H, { name: 'Ad-break Bumper', cat: 'Film & TV', dark: dark || orange });
    },
    score(A) {
      // the show's cue: bass and plucks, tension climbing on the teeter, a sting on the freeze
      for (let k = 0; k * 0.25 < B_FREEZE; k++) A.osc(k * 0.25, { type: 'triangle', f: midi([38, 38, 45, 38][k % 4]), dur: 0.2, g: 0.12, a: 0.005 });
      [[0.0, 62], [0.5, 65], [0.75, 66], [1.0, 67]].forEach(([t, m]) => A.pluck(t, midi(m), { g: 0.15, bright: 0.5, dur: 0.6 }));
      A.osc(0.4, { type: 'sawtooth', f: midi(74), f2: midi(80), glide: 0.85, dur: 0.85, g: 0.02, lp: 1800, vib: [8, 6] });
      A.impact(B_FREEZE, 0.35, { rev: 0.6 });
      A.chord(B_FREEZE, [38, 45, 50, 53, 56], { type: 'sawtooth', dur: 0.4, g: 0.04, lp: 1800, rev: 0.7, width: 0.7, hold: true, rel: 0.25 });
      // the bumper jingle: four notes on the half-second loop; out ends on the dominant, in resolves
      const jingle = (t0, end) => {
        for (let b = 0; b < 3; b++) { A.kick(t0 + b * 0.5, 0.26, { f: 160, f2: 60, dur: 0.2 }); A.hat(t0 + b * 0.5 + 0.25, 0.05); }
        [[0, 67], [0.125, 72], [0.25, 76], [0.5, 79], [0.75, 76], [1.0, end]].forEach(([d, m]) => A.pluck(t0 + d, midi(m), { g: 0.2, bright: 0.8, dur: 0.6 }));
        A.chord(t0 + 1.0, end === 74 ? [55, 62, 67, 71] : [48, 55, 64, 72], { type: 'triangle', dur: 0.4, g: 0.035, a: 0.01, lp: 2600, rev: 0.4, width: 0.8 });
        A.whoosh(t0 - 0.06, 0.22, { f1: 800, f2: 5000, g: 0.06, swell: 0.8 });
      };
      jingle(B_OUT, 74);
      // the break: each spot its own jingle, compressed, louder and brighter than the show
      POD_T.forEach(([a, b], j) => {
        const t0 = B_BRK + a / B_K, d = (b - a) / B_K - 0.03;
        A.noise(t0, { type: 'highpass', f: 4000, dur: 0.02, g: 0.06 });
        if (j === 0) for (let k = 0; k < 5; k++) A.bell(t0 + 0.05 + k * 0.15, midi(84 + [0, 4, 7, 4, 12][k]), { g: 0.05, dur: 0.3 });
        if (j === 1) { for (let k = 0; k < 6; k++) A.osc(t0 + k * 0.13, { type: 'sawtooth', f: midi(36 + (k % 2) * 7), dur: 0.11, g: 0.06, lp: 900 }); A.whoosh(t0 + 0.3, 0.4, { f1: 200, f2: 2000, g: 0.06 }); }
        if (j === 2) { A.chord(t0 + 0.02, [60, 67, 72], { type: 'sawtooth', dur: d, g: 0.025, lp: 1500, rev: 0.4 }); A.bell(t0 + 0.02, midi(79), { g: 0.05, dur: 0.4 }); }
        if (j === 3) for (let k = 0; k < 6; k++) A.osc(t0 + k * 0.07, { type: 'square', f: midi([72, 76, 79, 84, 79, 84][k]), dur: 0.06, g: 0.03, lp: 3000 });
        if (j === 4) { [0, 0.15, 0.3].forEach((dd, k) => A.osc(t0 + dd, { f: midi([88, 83, 91][k]), dur: 0.25, g: 0.05 })); A.chord(t0 + 0.4, [64, 71, 76], { type: 'sine', dur: d - 0.4, g: 0.025, rev: 0.5 }); }
        A.kick(t0, 0.22, { f: 150, f2: 50, dur: 0.18 });
      });
      jingle(B_IN, 72);
      // the act in: the show's cue again, the catch, a resolving chord
      for (let k = 0; k * 0.25 < 10 - B_ACT; k++) A.osc(B_ACT + k * 0.25, { type: 'triangle', f: midi([38, 38, 45, 38][k % 4]), dur: 0.2, g: 0.11, a: 0.005 });
      A.whoosh(B_ACT + 0.95, 0.55, { f1: 2000, f2: 300, g: 0.06 });
      A.kick(B_ACT + 1.35, 0.45, { f: 120, f2: 45 }); A.clap(B_ACT + 1.35, 0.16);
      A.chord(B_ACT + 1.35, [50, 57, 62, 66, 69], { type: 'triangle', dur: 1.0, g: 0.03, a: 0.02, lp: 2400, rev: 0.6, width: 0.8 });
      [[1.35, 74], [1.6, 78], [1.85, 81]].forEach(([d, m]) => A.pluck(B_ACT + d, midi(m), { g: 0.16, bright: 0.7, dur: 0.8 }));
    },
  });
})();
