/* batch m3 — Narrative Formats · Advertising: formatdemo · formatident · formatteaser.
   formatdemo (the product demo: an intro promise, then one feature per beat — each with a
   callout on the product in use and a magnified close-up — a hero shot with spec badges, and a
   brand-plus-action CTA) ·
   formatident (a channel ident between programmes: the DOG comes off, a cast of small Tokens
   builds the channel logo, the sting lands, and the logo flies into the corner bug inside title
   safe as the next programme starts; a ruler measures the ident against the 3–10 s norm) ·
   formatteaser (the launch teaser that withholds: open on black, three cropped, silhouetted and
   macro glimpses separated by cuts to black, a date, COMING SOON — and a readout of how much of
   the product has been shown, which never comes near 100 %). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, midi, text, rrect } = MG;
  const TK = MG.TK, FK = MG.FK, P = TK.P, PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const GROUND_D = 'rgba(236,232,223,0.92)', MUTE_D = 'rgba(236,232,223,0.55)';
  const tag = (c, s, x, y, on = 1, dark = false) => {   // accent dot + mono convention label
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    text(c, s, x + 26, y, { font: TK.MONO, size: 18, ls: 3, color: dark ? GROUND_D : P.ink, weight: 700 });
    c.restore();
  };
  // visibility envelope of a beat: fade in after t0, out before t1
  const env = (t, t0, t1, a = 0.3, z = 0.2) => seg(t, t0 + 0.05, t0 + a) * (1 - seg(t, t1 - z, t1));
  const tagFor = (c, beats, notes, t, x, y, dark) => beats.forEach((b, i) => notes[i] && tag(c, notes[i], x, y, env(t, b.t0, b.t1, 0.35, 0.15), dark));
  const outBounce = x => {
    const n = 7.5625, d = 2.75;
    if (x < 1 / d) return n * x * x;
    if (x < 2 / d) { x -= 1.5 / d; return n * x * x + 0.75; }
    if (x < 2.5 / d) { x -= 2.25 / d; return n * x * x + 0.9375; }
    x -= 2.625 / d; return n * x * x + 0.984375;
  };
  const rotv = (x, y, r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
  function pill(c, s, x, y, o = {}) {   // centred rounded label
    const size = o.size || 20;
    c.font = `700 ${size}px ${TK.MONO}`; if ('letterSpacing' in c) c.letterSpacing = '2px';
    const w = c.measureText(s).width + (o.pad ?? 26) * 2, h = size * 2;
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    rrect(c, x - w / 2, y - h / 2, w, h, h / 2);
    c.fillStyle = o.fill || P.ink; c.fill();
    if (o.stroke) { c.lineWidth = 2; c.strokeStyle = o.stroke; c.stroke(); }
    text(c, s, x, y + 1, { font: TK.MONO, size, ls: 2, color: o.color || P.ground, weight: 700, align: 'center', base: 'middle' });
    return w;
  }

  /* =====================================================================
     PRODUCT DEMO — the feature demo's grammar: promise, features one per
     beat, hero, call to action. The Token is the product. Intro: it drops
     onto the sweep under the promise "Meet the Token." Then three features,
     two seconds each, every one built the same way — a number and a one-line
     benefit, the product doing the thing, a callout on the part that does
     it and a magnified close-up tethered to that part: the hole (which reads
     rotation as it quarter-turns), the 22 % corner (rocking on it, with the
     radius dimensioned) and the bounce (squash and stretch on contact, the
     ratio read live). A cut to the hero shot — centred, spot-lit, reflected,
     with spec badges popping in — then a cut to the lockup and the button.
     ===================================================================== */
  const DB = [
    { t0: 0, t1: 1.5, name: 'Intro', kind: 'hook' },
    { t0: 1.5, t1: 3.5, name: 'Feature 1', kind: 'act' },
    { t0: 3.5, t1: 5.5, name: 'Feature 2', kind: 'act' },
    { t0: 5.5, t1: 7.5, name: 'Feature 3', kind: 'act' },
    { t0: 7.5, t1: 8.75, name: 'Hero', kind: 'turn' },
    { t0: 8.75, t1: 10, name: 'CTA', kind: 'cta' },
  ];
  const D_NOTES = ['INTRO · THE PROMISE', 'FEATURE 1 OF 3 · ONE FEATURE PER BEAT', 'FEATURE 2 OF 3 · CALLOUT + CLOSE-UP', 'FEATURE 3 OF 3 · SHOWN IN USE', 'HERO SHOT · SPEC BADGES', 'CTA · 1.25 s · LOCKUP + ACTION'];
  const D_FEAT = [
    { n: '01', title: 'Always knows which way is up.', key: 'THE HOLE  ·  OFF-CENTRE, SO ROTATION READS' },
    { n: '02', title: 'Soft on every edge.', key: 'CORNER RADIUS  ·  22 % OF THE SIDE' },
    { n: '03', title: 'Bounces back.', key: 'SQUASH & STRETCH  ·  VOLUME PRESERVED' },
  ];
  const D_FLOOR = 800, D_S = 280, D_X = 600;
  const D_TURNS = [[1.95, 2.25], [2.35, 2.65], [2.75, 3.05], [3.1, 3.4]];
  const D_BOUNCE = { t0: 5.6, per: 0.5, h: 170 };

  function dState(t) {
    let x = kf(t, [[0, 960], [1.45, 960], [1.9, D_X]]), rot = 0, sx = 1, sy = 1, lift = 0;
    const s = D_S;
    if (t < 1.5) lift = (1 - outBounce(seg(t, 0.05, 0.95))) * 950;
    if (t >= 1.5 && t < 3.5) rot = D_TURNS.reduce((a, [p, q]) => a + PI / 2 * E.ioC(seg(t, p, q)), 0);
    if (t >= 3.5 && t < 5.5) rot = -0.32 * Math.sin(PI * seg(t, 3.9, 5.2)) * Math.sin(TAU * 1.5 * seg(t, 3.9, 5.2));
    if (t >= 5.5 && t < 7.5) {
      const u = t - D_BOUNCE.t0, amp = 1 - E.ioS(seg(t, 6.85, 7.3));
      if (u > 0) {
        const p = (u / D_BOUNCE.per) % 1, hgt = 4 * D_BOUNCE.h * p * (1 - p) * amp;
        const q = Math.min(p, 1 - p), sq = Math.exp(-Math.pow(q / 0.07, 2)) * 0.3 * amp;
        const str = 0.08 * amp * Math.sin(PI * seg(q, 0.07, 0.32));   // stretch on the way up and down
        sx = 1 + sq - str; sy = 1 - sq + str; lift = hgt;
      }
    }
    const ext = s / 2 * (Math.abs(Math.cos(rot)) + Math.abs(Math.sin(rot)) - 1) * 0.72;
    return { x, y: D_FLOOR - s * sy / 2 - lift - ext, s, rot, sx, sy, lift: lift + ext };
  }
  function dProduct(c, p) {
    TK.shadow(c, p.x, D_FLOOR, p.s, p.lift);
    TK.token(c, p.x, p.y, p.s, { rot: p.rot, sx: p.sx, sy: p.sy });
  }
  function dScene(c, W, H, p) { TK.stage(c, W, H, { floor: D_FLOOR }); dProduct(c, p); }

  function closeUp(c, W, H, p, cx, cy, r, fx, fy, k, on, extra) {
    if (on <= 0.001) return;
    const rr = r * E.outB(clamp(on)), fr = r / k;
    c.save(); c.globalAlpha *= clamp(on);
    c.strokeStyle = 'rgba(23,24,28,0.38)'; c.lineWidth = 1.5;
    const ang = Math.atan2(cy - fy, cx - fx), nx = -Math.sin(ang), ny = Math.cos(ang);
    c.beginPath();
    c.moveTo(fx + nx * fr, fy + ny * fr); c.lineTo(cx + nx * rr, cy + ny * rr);
    c.moveTo(fx - nx * fr, fy - ny * fr); c.lineTo(cx - nx * rr, cy - ny * rr);
    c.stroke();
    c.setLineDash([5, 6]); c.beginPath(); c.arc(fx, fy, fr, 0, TAU); c.stroke(); c.setLineDash([]);
    c.save();
    c.beginPath(); c.arc(cx, cy, rr, 0, TAU); c.clip();
    c.translate(cx, cy); c.scale(k, k); c.translate(-fx, -fy);
    dScene(c, W, H, p);
    if (extra) extra(c, k);
    c.restore();
    c.lineWidth = 4; c.strokeStyle = P.ink; c.beginPath(); c.arc(cx, cy, rr, 0, TAU); c.stroke();
    FK.label(c, `CLOSE-UP  ×${k.toFixed(1)}`, cx, cy + rr + 34, { align: 'center', size: 15, color: P.mute });
    c.restore();
  }
  function callout(c, px, py, lx, ly, s, on, right = true) {
    if (on <= 0.001) return;
    const u = E.outC(clamp(on));
    c.save(); c.globalAlpha *= clamp(on * 1.5);
    c.strokeStyle = P.ink; c.lineWidth = 2;
    c.beginPath(); c.moveTo(px, py); c.lineTo(px, lerp(py, ly, u)); if (u > 0.6) c.lineTo(lerp(px, lx, seg(u, 0.6, 1)), ly); c.stroke();
    c.fillStyle = P.ground; c.beginPath(); c.arc(px, py, 9, 0, TAU); c.fill();
    c.fillStyle = P.ink; c.beginPath(); c.arc(px, py, 5, 0, TAU); c.fill();
    if (u > 0.95) text(c, s, lx + (right ? 12 : -12), ly + 1, { font: TK.MONO, size: 18, ls: 2, color: P.ink, weight: 700, align: right ? 'left' : 'right', base: 'middle' });
    c.restore();
  }
  function featureText(c, f, t0, t1, t) {
    const a = E.outC(seg(t, t0 + 0.05, t0 + 0.4)), on = a * (1 - seg(t, t1 - 0.2, t1));
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on; const dy = (1 - a) * 28;
    text(c, f.n, 116, 262 + dy, { font: TK.FONT, weight: 900, size: 104, color: P.accent });
    text(c, `FEATURE ${+f.n} OF 3`, 268, 196 + dy, { font: TK.MONO, size: 16, ls: 3, color: P.mute });
    text(c, f.title, 266, 256 + dy, { font: TK.FONT, weight: 800, size: 54, color: P.ink });
    text(c, f.key, 268, 300 + dy, { font: TK.MONO, size: 16, ls: 2, color: P.mute });
    c.restore();
  }

  MG.film({
    id: 'formatdemo', dur: 10, poster: 4.7,
    fonts: FK.fonts,
    meta: {
      family: 'M', name: 'Product Demo', sub: 'Promise, one feature per beat, hero, CTA', era: '1949 —',
      origin: 'The demonstration is the oldest television sales format: in early American TV the product was shown working, often live — Betty Furness opening Westinghouse refrigerators on CBS from 1949 is the classic case — and the pitchman’s fair-ground demo moved to TV with Ron Popeil’s Ronco spots in the 1960s. The modern feature demo keeps the structure and drops the presenter: a promise, features shown one at a time on the product in use with a callout and a close-up, a hero shot and a call to action, the grammar of phone, appliance and app ads since Apple’s iPhone TV spots of 2007.',
      works: 'Westinghouse demonstrations with Betty Furness (CBS, from 1949) · Ronco Veg-O-Matic TV spots (Ron Popeil, 1960s) · Apple iPhone TV ads, e.g. “Calamari” (TBWA\\Chiat\\Day, 2007)',
      tech: ['One feature per beat', 'Callout + close-up', 'Hero shot, then CTA'],
      accent: '#ff5a1f',
      motionDNA: 'Six beats on a 120 BPM grid: a 1.5 s intro (the product drops in under the promise), three 2 s feature beats built identically — number and benefit line, the product doing the thing, callout, close-up — a 1.25 s hero shot and a 1.25 s CTA. Moves within the features, cuts into the hero and the CTA.',
      visualDNA: 'The Token on the paper sweep as the product. Big orange feature numbers, Archivo benefit lines, mono spec lines; ink leader-line callouts and a ringed magnifier tethered to the part being shown, with the radius dimensioned. Hero: centred, spot-lit, reflected in the floor, ink spec pills. CTA: Token + MOTION lockup over an ink button.',
      transitions: 'Text slides in per feature and clears before the next; the close-up springs open from the callout; hard cuts to the hero and to the CTA',
      implementation: ['Template the feature beat once and reuse it: same layout, same timing, new content', 'Close-ups as a second render of the same scene, scaled about the feature point and clipped to a circle', 'Canvas 2D: one scene function drawn twice (wide + magnified), keyframed product state'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const p = dState(t);
      if (t < 7.5) {
        dScene(c, W, H, p);
        // intro promise
        const io = E.outC(seg(t, 0.55, 0.85)) * (1 - seg(t, 1.3, 1.5));
        if (io > 0.001) {
          c.save(); c.globalAlpha = io;
          text(c, 'Meet the Token.', 960, 300 + (1 - io) * 20, { font: TK.FONT, weight: 800, size: 92, color: P.ink, align: 'center' });
          FK.label(c, 'THE SHAPE THAT SHOWS ITS MOTION', 960, 352, { align: 'center', size: 18 });
          c.restore();
        }
        D_FEAT.forEach((f, i) => featureText(c, f, DB[i + 1].t0, DB[i + 1].t1, t));
        const CX = 1400, CY = 560, CR = 200;
        // feature 1: the hole
        if (t >= 1.5 && t < 3.5) {
          const on = seg(t, 1.85, 2.1) * (1 - seg(t, 3.3, 3.5));
          const [hx, hy] = rotv(p.s * TK.HOLE.x, p.s * TK.HOLE.y, p.rot), fx = p.x + hx, fy = p.y + hy;
          const deg = Math.round(((p.rot / TAU) * 360) % 360);
          callout(c, fx, fy, fx + 70, 452, `HOLE  ·  ROT ${String(deg).padStart(3, '0')}°`, seg(t, 1.75, 2.05) * (1 - seg(t, 3.3, 3.5)));
          closeUp(c, W, H, p, CX, CY, CR, fx, fy, 2.4, on);
        }
        // feature 2: the corner
        if (t >= 3.5 && t < 5.5) {
          const on = seg(t, 3.85, 4.1) * (1 - seg(t, 5.3, 5.5)), cr = TK.CORNER;
          const [ax, ay] = rotv(-p.s * (0.5 - cr + cr * Math.SQRT1_2), -p.s * (0.5 - cr + cr * Math.SQRT1_2), p.rot);
          const [ox, oy] = rotv(-p.s * (0.5 - cr), -p.s * (0.5 - cr), p.rot);
          const fx = p.x + ax, fy = p.y + ay;
          callout(c, fx, fy, fx - 70, 452, 'CORNER  ·  r = 22 %', seg(t, 3.75, 4.05) * (1 - seg(t, 5.3, 5.5)), false);
          closeUp(c, W, H, p, CX, CY, CR, p.x + lerp(ox, ax, 0.5), p.y + lerp(oy, ay, 0.5), 2.6, on, (g, k) => {
            g.save(); g.lineWidth = 2 / k; g.strokeStyle = P.ink; g.setLineDash([6 / k, 5 / k]);
            g.beginPath(); g.arc(p.x + ox, p.y + oy, p.s * cr, 0, TAU); g.stroke(); g.setLineDash([]);
            g.lineWidth = 3 / k; g.beginPath(); g.moveTo(p.x + ox, p.y + oy); g.lineTo(p.x + ax, p.y + ay); g.stroke();
            g.fillStyle = P.ink; g.beginPath(); g.arc(p.x + ox, p.y + oy, 5 / k, 0, TAU); g.fill();
            g.restore();
          });
          if (on > 0.5) FK.label(c, 'r = 0.22 × SIDE', CX, CY - CR - 22, { align: 'center', size: 16, color: P.ink, weight: 700 });
        }
        // feature 3: the bounce
        if (t >= 5.5 && t < 7.5) {
          const on = seg(t, 5.85, 6.1) * (1 - seg(t, 7.3, 7.5));
          const fx = p.x - p.s * p.sx / 2 + 10, fy = D_FLOOR - 8;
          callout(c, fx, fy, fx - 70, 866, `CONTACT  ·  ${p.sx.toFixed(2)} × ${p.sy.toFixed(2)}`, seg(t, 5.75, 6.05) * (1 - seg(t, 7.3, 7.5)), false);
          closeUp(c, W, H, p, CX, CY, CR, D_X, D_FLOOR - 70, 1.6, on);
          if (on > 0.5) FK.label(c, `SQUASH  ${p.sx.toFixed(2)} : ${p.sy.toFixed(2)}`, CX, CY - CR - 22, { align: 'center', size: 16, color: P.ink, weight: 700 });
        }
      } else if (t < 8.75) {
        // HERO — cut: centred, spot-lit, reflected, badges
        const u = seg(t, 7.5, 8.75), s = lerp(330, 350, u), rot = lerp(-0.06, 0.06, E.ioS(u)), fl = 820;
        TK.stage(c, W, H, { floor: fl });
        const gl = c.createRadialGradient(960, 600, 40, 960, 600, 720);
        gl.addColorStop(0, 'rgba(255,255,255,0.75)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = gl; c.fillRect(0, 0, W, H);
        MG.vignette(c, W, H, 0.22, '23,24,28');
        const ext = s / 2 * (Math.abs(Math.cos(rot)) + Math.abs(Math.sin(rot)) - 1) * 0.72, y = fl - s / 2 - ext;
        c.save(); c.beginPath(); c.rect(0, fl, W, H - fl); c.clip();
        c.globalAlpha = 0.16; c.translate(0, 2 * fl); c.scale(1, -1); TK.token(c, 960, y, s, { rot }); c.restore();
        TK.shadow(c, 960, fl, s, ext);
        TK.token(c, 960, y, s, { rot });
        const B = [['1 HOLE', 600, 470], ['22 % CORNERS', 1330, 470], ['120 BPM', 620, 720], ['0 SAMPLES', 1310, 720]];
        B.forEach(([s0, bx, by], i) => {
          const k = E.outB(seg(t, 7.7 + i * 0.12, 7.95 + i * 0.12));
          if (k <= 0.001) return;
          c.save(); c.translate(bx, by); c.scale(k, k); pill(c, s0, 0, 0, { size: 22 }); c.restore();
        });
        FK.label(c, 'THE TOKEN', 960, 230, { align: 'center', size: 22, color: P.ink, weight: 700, ls: 8 });
      } else {
        // CTA — cut: lockup + button
        TK.stage(c, W, H);
        const k = E.outB(seg(t, 8.8, 9.1)), wv = E.outC(seg(t, 8.95, 9.3));
        TK.token(c, 560, 480, 170 * k, { rot: (1 - k) * -0.6 });
        c.save(); c.beginPath(); c.rect(680, 360, 800 * wv, 240); c.clip();
        TK.word(c, 1070 - (1 - wv) * 60, 486, { size: 150, ls: 4 }); c.restore();
        const bo = E.outC(seg(t, 9.2, 9.45)), press = 1 - 0.05 * Math.sin(PI * seg(t, 9.6, 9.75));
        if (bo > 0.001) {
          c.save(); c.globalAlpha = bo; c.translate(960, 690 + (1 - bo) * 24); c.scale(press, press);
          pill(c, 'SEE IT IN MOTION  →', 0, 0, { size: 26, pad: 44, fill: P.accent, color: P.ink });
          c.restore();
          c.save(); c.globalAlpha = bo; FK.label(c, 'AVAILABLE NOW', 960, 790, { align: 'center', size: 18 }); c.restore();
        }
      }
      FK.strip(c, t, W, H, DB, { label: 'Product demo' });
      tagFor(c, DB, D_NOTES, t, 72, 128);
      FK.caption(c, t, W, H, { name: 'Product Demo', cat: 'Advertising' });
    },
    score(A) {
      TK.bed(A, { g: 0.55, until: 8.75 });
      // intro: three landings of the drop
      [[0.377, 0.4], [0.704, 0.2], [0.868, 0.1]].forEach(([t, g]) => { A.kick(t, g, { f: 160, f2: 60 }); A.osc(t, { type: 'triangle', f: 330, f2: 180, dur: 0.12, g: g * 0.3 }); });
      A.pluck(0.45, midi(72), { g: 0.2, bright: 0.7 }); A.pluck(0.6, midi(76), { g: 0.18 }); A.pluck(0.75, midi(79), { g: 0.2 });
      // happy plucked arpeggio over the bed's C Am F G
      const bars = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]];
      for (let b = 3; b < 15; b++) {
        const t = b * 0.5, ch = bars[Math.floor(t / 2) % 4], nt = ch[[0, 1, 2, 1][b % 4]] + 12;
        A.pluck(t, midi(nt), { g: 0.13, bright: 0.55, dur: 0.8, rev: 0.2, pan: b % 2 ? 0.2 : -0.2 });
      }
      // each feature: whoosh, callout pop, close-up zoom
      [1.5, 3.5, 5.5].forEach((t0, i) => {
        A.whoosh(t0 - 0.12, 0.35, { f1: 500, f2: 3200, g: 0.1, pan: -0.3 });
        A.osc(t0 + 0.05, { f: midi(84 + [0, 2, 4][i]), dur: 0.2, g: 0.06, rev: 0.3 });
        A.osc(t0 + 0.3, { f: 900, f2: 1500, dur: 0.07, g: 0.11 });
        A.whoosh(t0 + 0.35, 0.28, { f1: 1500, f2: 5000, q: 2, g: 0.05, pan: 0.4 });
      });
      D_TURNS.forEach(([, q]) => A.osc(q, { f: 2600, dur: 0.03, g: 0.08 }));
      for (let k = 0; k < 4; k++) A.osc(D_BOUNCE.t0 + k * D_BOUNCE.per, { type: 'triangle', f: 330, f2: 150, dur: 0.16, g: 0.16 * (1 - k * 0.2) });
      // hero
      A.riser(6.95, 0.55, { g: 0.1, f: 130 });
      A.impact(7.5, 0.32);
      A.chord(7.5, [48, 60, 64, 67, 72, 76], { type: 'sawtooth', dur: 1.3, g: 0.025, a: 0.02, lp: 2600, rev: 0.5, width: 0.8, spread: 6 });
      [7.7, 7.82, 7.94, 8.06].forEach((t, i) => A.osc(t, { f: midi(79 + [0, 4, 7, 12][i]), dur: 0.12, g: 0.06, rev: 0.25 }));
      // CTA: three-note sonic logo, button click
      A.whoosh(8.7, 0.2, { f1: 2000, f2: 400, g: 0.08 });
      A.bell(8.85, midi(72), { g: 0.12 }); A.bell(9.02, midi(76), { g: 0.12 }); A.bell(9.19, midi(79), { g: 0.14, dur: 2.6 });
      A.chord(9.19, [48, 55, 60, 64, 67], { type: 'triangle', dur: 0.8, g: 0.045, a: 0.02, lp: 3000, rev: 0.6, width: 0.7 });
      A.osc(9.62, { f: 1800, dur: 0.025, g: 0.1 }); A.osc(9.74, { f: 1400, dur: 0.025, g: 0.07 });
    },
  });

  /* =====================================================================
     CHANNEL IDENT — the short branded film between programmes, with the
     continuity conventions around it. The last programme fades to black
     with the channel's DOG in the corner; the DOG comes off for the ident.
     Setup: a field of small Tokens drifting in the dark. Build: each flies
     on a curved path to its cell in a large Token, the cast forming the
     logo. Sting: the cells snap to one solid Token with a flash and the
     audio logo. The MOTION wordmark wipes on beside it, then the lockup
     shrinks into the DOG — white, 60 %, top right inside title safe — as
     the next programme fades up underneath. Title-safe and action-safe
     guides stay on; a ruler measures the ident against the 3–10 s norm.
     ===================================================================== */
  const IB = [
    { t0: 0, t1: 1, name: 'Prog out', kind: 'break' },
    { t0: 1, t1: 2.4, name: 'Setup', kind: 'hook' },
    { t0: 2.4, t1: 4.4, name: 'Build', kind: 'act' },
    { t0: 4.4, t1: 6, name: 'Sting', kind: 'title' },
    { t0: 6, t1: 7, name: 'To bug', kind: 'turn' },
    { t0: 7, t1: 10, name: 'Next prog', kind: 'break' },
  ];
  const I_NOTES = ['PROG OUT · DOG ON · FADE TO BLACK', 'DOG OFF · IDENT STARTS · ONE IDEA', 'BUILD · THE CAST FORMS THE LOGO', 'STING · LOGO + AUDIO LOGO', 'HANDOFF · LOGO BECOMES THE BUG', 'PROGRAMME · DOG STAYS ON'];
  const I_BG = '#111216', I_S = 420, I_C = [960, 520], I_START = 1, I_END = 7;
  const I_LOCK = [910, 520], I_BUG = { x: 1612, y: 152, k: 0.17 };

  // Lockup: Token + MOTION at scale k around cx, cy. col: token, wcol: word, wv: word wipe 0..1
  function iLockup(c, cx, cy, k, col, wcol, wv = 1, tokS) {
    TK.token(c, cx - 350 * k, cy, (tokS ?? 300) * k, { color: col });
    if (wv <= 0.001) return;
    c.save(); c.beginPath(); c.rect(cx - 160 * k, cy - 120 * k, 780 * k * wv, 240 * k); c.clip();
    TK.word(c, cx + 232 * k, cy + 6 * k, { size: 160 * k, ls: 4 * k, color: wcol });
    c.restore();
  }
  function iBug(c, a) {
    if (a <= 0.001) return;
    c.save(); c.globalAlpha = a * 0.62;
    iLockup(c, I_BUG.x, I_BUG.y, I_BUG.k, P.ground, P.ground);
    c.restore();
  }
  function iProgramme(c, W, H, dawn) {
    const sky = c.createLinearGradient(0, 0, 0, H);
    if (dawn) { sky.addColorStop(0, '#5d7fa3'); sky.addColorStop(0.62, '#e9b48a'); sky.addColorStop(1, '#a1694b'); }
    else { sky.addColorStop(0, '#1d2540'); sky.addColorStop(0.6, '#6a4c68'); sky.addColorStop(1, '#2a1f2c'); }
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    TK.token(c, dawn ? 1240 : 620, dawn ? 560 : 330, dawn ? 150 : 90, { color: dawn ? '#ffe2b8' : '#f1e6d6', alpha: 0.9 });
    [[0.66, dawn ? '#7b5a4c' : '#2c2236', 0], [0.76, dawn ? '#5c4136' : '#1b1522', 2], [0.86, dawn ? '#3d2a24' : '#0f0c14', 5]].forEach(([yy, col, sd]) => {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 40) c.lineTo(x, H * yy + Math.sin(x * 0.004 + sd) * 40 + Math.sin(x * 0.011 + sd * 2) * 18);
      c.lineTo(W, H); c.closePath(); c.fill();
    });
  }
  function iRuler(c, t) {
    const on = seg(t, 1.1, 1.4);
    if (on <= 0.001) return;
    const x0 = 1300, x1 = 1800, y = 1004, X = s => lerp(x0, x1, s / 10);
    c.save(); c.globalAlpha = on;
    c.fillStyle = 'rgba(255,90,31,0.18)'; c.fillRect(X(3), y - 30, X(10) - X(3), 22);
    FK.label(c, 'TYPICAL IDENT  3–10 s', X(3) + 8, y - 14, { size: 13, ls: 2, color: GROUND_D });
    c.fillStyle = 'rgba(236,232,223,0.35)'; c.fillRect(x0, y, x1 - x0, 2);
    for (let s = 0; s <= 10; s++) c.fillRect(X(s) - 0.5, y - (s % 5 ? 4 : 8), 1, s % 5 ? 4 : 8);
    [0, 3, 5, 10].forEach(s => FK.label(c, `${s}`, X(s), y + 22, { size: 13, ls: 0, align: 'center', color: MUTE_D }));
    const el = clamp(t - I_START, 0, I_END - I_START);
    c.fillStyle = P.accent; c.fillRect(x0, y - 2, X(el) - x0, 6);
    c.beginPath(); c.arc(X(el), y + 1, 6, 0, TAU); c.fill();
    FK.label(c, `THIS IDENT  ${el.toFixed(1)} s`, x0, y - 44, { size: 15, color: GROUND_D, weight: 700 });
    c.restore();
  }

  MG.film({
    id: 'formatident', dur: 10, poster: 5.5,
    fonts: FK.fonts,
    meta: {
      family: 'M', name: 'Channel Ident', sub: 'Sting, logo, bug: the junction between programmes', era: '1950s —',
      origin: 'Broadcasters have identified themselves between programmes since the earliest television — the BBC’s mechanical rotating-globe idents ran for decades from the 1960s. The modern ident, a few seconds of branded film built around a moving logo, was defined by Martin Lambie-Nairn’s Channel 4 launch ident (1982), whose coloured blocks fly together into the 4, and his BBC Two “2s” (1991), a family of short films around one logo. Continuity rules surround it: the on-screen bug, or DOG, sits in a corner inside title safe during programmes and comes off for the junction.',
      works: 'Channel 4 launch ident (Martin Lambie-Nairn, CGI by Robert Abel and Associates, 1982) · BBC Two “2s” idents (Lambie-Nairn, 1991) · MTV launch ID, the moon-landing flag (1981)',
      tech: ['Ident length 3–10 s', 'The sting: logo + audio logo', 'DOG / bug inside title safe'],
      accent: '#ff5a1f',
      motionDNA: 'A six-second ident inside a ten-second junction: 1 s of programme out to black, 1.4 s setup, 2 s build as the cast converges on the logo, a hard sting at 4.4 s, a 1.6 s logo hold with the wordmark wipe, 1 s handoff into the corner bug, then the next programme fades up under it.',
      visualDNA: 'A dark junction: orange, ink and paper Tokens drifting on near-black, assembling cell by cell into one large Token; a white flash ring at the sting; the Token + MOTION lockup; the DOG as a white 60 % mark top right. Dashed title-safe and action-safe guides throughout, and a duration ruler bottom right.',
      transitions: 'Fade to black out of the programme; curved fly-ins to the logo cells; a flash-cut sting; a wordmark wipe; a scale-and-move into the bug while the next programme fades up',
      implementation: ['Broadcast design: logo animation in After Effects or Cinema 4D, sting scored to picture', 'Continuity: DOG keyed by the playout system inside title safe, off for idents and promos', 'Canvas 2D: grid-sampled target cells inside the Token path, eased curved fly-ins, one lockup drawn at any scale'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const S = I_S, step = S / 9, cr = TK.CORNER * S, cells = [], r = MG.rng(1982);
      for (let gy = -S / 2 + step / 2; gy < S / 2; gy += step) for (let gx = -S / 2 + step / 2; gx < S / 2; gx += step) {
        const dx = Math.max(Math.abs(gx) - (S / 2 - cr), 0), dy = Math.max(Math.abs(gy) - (S / 2 - cr), 0);
        if (Math.hypot(dx, dy) > cr - step * 0.3) continue;
        if (Math.hypot(gx - TK.HOLE.x * S, gy - TK.HOLE.y * S) < TK.HOLE.r * S + step * 0.35) continue;
        cells.push({ tx: gx, ty: gy });
      }
      const cols = [P.accent, P.accent, P.accentL, P.accentD, P.ground, P.blue];
      cells.forEach(cl => {
        cl.sx = 160 + r() * 1600; cl.sy = 170 + r() * 760; cl.ph = r() * TAU; cl.rot = (r() - 0.5) * 3;
        cl.spin = (r() - 0.5) * 1.2; cl.col = cols[Math.floor(r() * cols.length)]; cl.d = r(); cl.app = r(); cl.bend = r() < 0.5 ? -1 : 1;
      });
      return { cells, step };
    },
    draw(c, t, W, H, st) {
      if (t < 1) {
        iProgramme(c, W, H, false);
        c.fillStyle = `rgba(0,0,0,${E.inQ(seg(t, 0.45, 0.95))})`; c.fillRect(0, 0, W, H);
        iBug(c, 1 - seg(t, 0.55, 0.8));
      } else if (t < I_END + 0.6) {
        c.fillStyle = I_BG; c.fillRect(0, 0, W, H);
        const vg = c.createRadialGradient(960, 520, 100, 960, 520, 900);
        vg.addColorStop(0, 'rgba(255,90,31,0.10)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = vg; c.fillRect(0, 0, W, H);
        const [ccx, ccy] = I_C, tile = st.step * 0.84, solid = seg(t, 4.4, 4.55);
        if (t < 4.6) st.cells.forEach(cl => {
          const ap = E.outB(seg(t, 1.0 + cl.app * 0.8, 1.3 + cl.app * 0.8));
          if (ap <= 0.001) return;
          const dx = cl.sx + 50 * Math.sin(t * 0.7 + cl.ph), dy = cl.sy + 34 * Math.cos(t * 0.55 + cl.ph);
          const t0 = 2.4 + cl.d * 0.6, u = E.ioC(seg(t, t0, t0 + 1.3));
          const ex = ccx + cl.tx, ey = ccy + cl.ty, ang = Math.atan2(ey - dy, ex - dx), bow = Math.sin(PI * u) * 160 * cl.bend;
          const x = lerp(dx, ex, u) - Math.sin(ang) * bow, y = lerp(dy, ey, u) + Math.cos(ang) * bow;
          const rot = lerp(cl.rot + t * cl.spin, 0, u), col = u > 0.75 ? P.accent : cl.col;
          TK.token(c, x, y, tile * ap * lerp(0.9, 1, u), { rot, color: col, alpha: 1 - solid });
        });
        // sting → lockup → bug
        if (t >= 4.4) {
          const fl = 1 - seg(t, 4.4, 4.75);
          const mv = E.ioC(seg(t, 4.6, 5.1)), wv = E.ioC(seg(t, 5.0, 5.5)), go = E.ioC(seg(t, 6.0, 7.0));
          const k = lerp(1, I_BUG.k, go), cx = lerp(lerp(ccx + 350, I_LOCK[0], mv), I_BUG.x, go), cy = lerp(lerp(ccy, I_LOCK[1], mv), I_BUG.y, go);
          const tokS = lerp(I_S, 300, mv), a = lerp(1, 0.62, seg(t, 6.6, 7.0));
          const col = go > 0.5 ? (go > 0.85 ? P.ground : P.accentL) : P.accent;
          c.save(); c.globalAlpha = a * (1 - seg(t, 7.0, 7.1));
          iLockup(c, cx, cy, k, col, go > 0.85 ? P.ground : P.ground, wv, tokS);
          c.restore();
          if (fl > 0.001) {
            c.save();
            c.strokeStyle = `rgba(255,236,220,${fl})`; c.lineWidth = 14 * fl;
            c.beginPath(); c.arc(ccx, ccy, I_S * 0.55 + (1 - fl) * 520, 0, TAU); c.stroke();
            c.fillStyle = `rgba(255,240,228,${0.35 * fl * fl})`; c.fillRect(0, 0, W, H);
            c.restore();
          }
          if (t >= 5.0 && t < 6.2) { c.save(); c.globalAlpha = wv * (1 - seg(t, 5.9, 6.1)); FK.label(c, 'THE CHANNEL FOR MOVING THINGS', 960, 700, { align: 'center', size: 18, color: MUTE_D }); c.restore(); }
        }
        if (t >= 7) {
          c.save(); c.globalAlpha = E.ioS(seg(t, 7.0, 7.6)); iProgramme(c, W, H, true); c.restore();
        }
      } else iProgramme(c, W, H, true);
      if (t >= 7) iBug(c, 1);
      // bug position marker during the handoff
      if (t >= 6.4 && t < 8.6) {
        const on = seg(t, 6.4, 6.7) * (1 - seg(t, 8.3, 8.6));
        c.save(); c.globalAlpha = on; c.strokeStyle = P.accent; c.lineWidth = 2; c.setLineDash([4, 5]);
        c.strokeRect(I_BUG.x - 70, I_BUG.y - 36, 186, 72); c.setLineDash([]);
        FK.label(c, 'DOG  ·  60 %', I_BUG.x + 116, I_BUG.y + 62, { align: 'right', size: 14, color: GROUND_D, weight: 700 });
        c.restore();
      }
      FK.safeFrame(c, W, H, { dark: true, labels: true, alpha: 0.42 });
      iRuler(c, t);
      FK.strip(c, t, W, H, IB, { label: 'Channel ident', dark: true });
      tagFor(c, IB, I_NOTES, t, 214, 160, true);
      FK.caption(c, t, W, H, { name: 'Channel Ident', cat: 'Advertising', dark: true });
    },
    score(A) {
      // programme out: the last programme's music tail
      A.chord(0, [45, 52, 57, 64], { type: 'triangle', dur: 1.1, g: 0.05, a: 0.05, lp: 1200, rev: 0.5, width: 0.6 });
      A.pluck(0.1, midi(69), { g: 0.12, dur: 1, rev: 0.4 });
      // ident: D major
      A.whoosh(0.85, 0.4, { f1: 200, f2: 1200, g: 0.08 });
      A.chord(1.0, [38, 50, 57, 62], { type: 'triangle', dur: 3.5, g: 0.035, a: 0.6, lp: 900, rev: 0.6, width: 0.7 });
      const pent = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86];
      for (let i = 0; i < 9; i++) A.osc(1.05 + i * 0.09 + hash(i) * 0.04, { f: midi(pent[(i * 3) % 7] + 12), dur: 0.25, g: 0.035, rev: 0.5, pan: (hash(i + 5) - 0.5) * 1.2 });
      // build: accelerating arpeggio + riser
      for (let i = 0; i < 14; i++) {
        const u = i / 14, t = 2.4 + 1.95 * (1 - Math.pow(1 - u, 1.6));
        A.pluck(t, midi(pent[Math.min(i, pent.length - 1)]), { g: 0.12, bright: 0.65, dur: 0.6, rev: 0.3, pan: i % 2 ? 0.3 : -0.3 });
      }
      A.riser(2.4, 2.0, { g: 0.12, f: 73 });
      // sting
      A.impact(4.4, 0.38);
      A.chord(4.4, [50, 62, 66, 69, 74, 78], { type: 'sawtooth', dur: 2.2, g: 0.028, a: 0.01, lp: 3200, lp2: 900, lpT: 2.2, rev: 0.6, width: 0.9, spread: 7 });
      A.bell(4.42, midi(74), { g: 0.13 }); A.bell(4.6, midi(78), { g: 0.12 }); A.bell(4.78, midi(81), { g: 0.15, dur: 3 });
      A.hat(4.4, 0.08, true);
      A.whoosh(4.95, 0.5, { f1: 800, f2: 4200, g: 0.06, pan: 0.4 });
      // handoff to the bug
      A.whoosh(6.0, 0.9, { f1: 3000, f2: 500, g: 0.09, pan: 0.5 });
      A.osc(6.98, { f: midi(86), dur: 0.4, g: 0.05, rev: 0.4, pan: 0.6 });
      // next programme
      A.chord(7.1, [41, 53, 60, 65], { type: 'triangle', dur: 2.9, g: 0.04, a: 0.6, lp: 1100, rev: 0.6, width: 0.6 });
      [7.8, 8.4, 9.0, 9.3].forEach((t, i) => A.pluck(t, midi([65, 69, 72, 70][i]), { g: 0.1, bright: 0.5, dur: 1.2, rev: 0.4 }));
    },
  });

  /* =====================================================================
     TEASER — the launch teaser's rule is to reveal nothing. Open on black
     and sound. Three glimpses, each cut hard to black: a macro crop of one
     rounded corner with a rim light travelling along its edge; a silhouette
     rising against a backlit haze, glow showing through the hole; the hole
     alone, with light shining through it out of the dark. Then a date, then
     COMING SOON over a rim-lit sliver of the top edge. A readout tracks how
     much of the product has been on screen, plotted against the 100 % that
     only launch day gets.
     ===================================================================== */
  const TB = [
    { t0: 0, t1: 1.2, name: 'Black', kind: 'hook' },
    { t0: 1.2, t1: 3.4, name: 'Glimpse 1', kind: 'act' },
    { t0: 3.4, t1: 5.4, name: 'Glimpse 2', kind: 'act' },
    { t0: 5.4, t1: 7.2, name: 'Glimpse 3', kind: 'act' },
    { t0: 7.2, t1: 8.4, name: 'Date', kind: 'turn' },
    { t0: 8.4, t1: 10, name: 'Coming soon', kind: 'cta' },
  ];
  const T_NOTES = ['OPEN ON BLACK · SOUND FIRST', 'CROP · ONE EDGE, LIT', 'SILHOUETTE · SHAPE, NO SURFACE', 'DETAIL · ONE FEATURE, NO CONTEXT', 'DATE · THE ONLY HARD FACT', 'COMING SOON · NO PACKSHOT'];
  const T_BG = '#060607', T_DARK = '#121214';
  const T_G = [[1.3, 3.3], [3.5, 5.3], [5.5, 7.1]];
  const T_VIS = [[0, 0], [1.3, 0], [1.6, 3, E.lin], [3.28, 7, E.lin], [3.3, 0, E.lin], [3.5, 0], [3.8, 13, E.lin], [5.28, 19, E.lin], [5.3, 0, E.lin], [5.5, 0], [5.8, 4, E.lin], [7.08, 6, E.lin], [7.1, 0, E.lin], [8.5, 0], [8.9, 2, E.lin], [10, 3, E.lin]];
  const tVis = t => kf(t, T_VIS);
  const flick = (t, t0, d = 0.25) => (t < t0 ? 0 : t > t0 + d ? 1 : (hash(Math.floor(t * 30) * 3.7 + t0) > 0.45 ? 1 : 0.15));

  function rimToken(c, x, y, s, rot, lx, ly, lr, o = {}) {
    c.save(); c.translate(x, y); c.rotate(rot);
    TK.tokenPath(c, s);
    c.restore();
    c.fillStyle = o.fill || T_DARK; c.fill('evenodd');
    const g = c.createRadialGradient(lx, ly, 0, lx, ly, lr);
    g.addColorStop(0, 'rgba(255,170,120,1)'); g.addColorStop(0.35, 'rgba(255,90,31,0.7)'); g.addColorStop(1, 'rgba(255,90,31,0)');
    c.strokeStyle = g; c.lineWidth = o.glow || 26; c.globalAlpha = 0.25; c.stroke();
    c.globalAlpha = 1; c.lineWidth = o.lw || 4; c.stroke();
  }
  function tReadout(c, t) {
    const gx = 1470, gy = 890, gw = 370, gh = 110, Y = v => gy + gh - v / 100 * gh, X = s => gx + s / 10 * gw;
    c.save();
    c.strokeStyle = 'rgba(236,232,223,0.25)'; c.lineWidth = 1; c.strokeRect(gx + 0.5, gy + 0.5, gw, gh);
    c.setLineDash([4, 5]); c.strokeStyle = 'rgba(255,90,31,0.7)'; c.beginPath(); c.moveTo(gx, Y(100)); c.lineTo(gx + gw, Y(100)); c.stroke(); c.setLineDash([]);
    FK.label(c, 'LAUNCH DAY = 100 %', gx + gw - 6, Y(100) + 18, { align: 'right', size: 12, ls: 2, color: 'rgba(255,138,92,0.85)' });
    c.fillStyle = 'rgba(255,90,31,0.25)'; c.strokeStyle = P.accent; c.lineWidth = 2;
    c.beginPath(); c.moveTo(X(0), Y(0));
    for (let s = 0; s <= t; s += 0.04) c.lineTo(X(s), Y(tVis(s)));
    c.lineTo(X(t), Y(tVis(t))); c.stroke();
    c.lineTo(X(t), Y(0)); c.closePath(); c.fill();
    let mx = 0; for (let s = 0; s <= t; s += 0.04) mx = Math.max(mx, tVis(s));
    const v = tVis(t);
    FK.label(c, 'PRODUCT VISIBLE', gx, gy - 36, { size: 13, ls: 3, color: MUTE_D });
    FK.label(c, `${String(Math.round(v)).padStart(2, ' ')} %`, gx, gy - 10, { size: 26, ls: 1, color: GROUND_D, weight: 700 });
    FK.label(c, `MAX ${Math.round(mx)} %`, gx + gw, gy - 10, { align: 'right', size: 14, ls: 2, color: MUTE_D });
    c.restore();
  }

  MG.film({
    id: 'formatteaser', dur: 10, poster: 4.6,
    fonts: FK.fonts,
    meta: {
      family: 'M', name: 'Teaser', sub: 'Reveal nothing: glimpses, a date, coming soon', era: '1970s —',
      origin: 'The teaser trailer — a short spot released months before a film, built from almost nothing — took its modern form in the 1970s; the teaser for Ridley Scott’s Alien (1979), an egg cracking over “In space no one can hear you scream”, is still the model. Advertising adopted the same withholding for product launches: Apple’s “1984”, aired during Super Bowl XVIII, announced the Macintosh without ever showing it, and car makers tease new models as cropped details and silhouettes under cloth. The rules are constant: glimpses, not views; a date; coming soon.',
      works: 'Alien teaser trailer (20th Century Fox, 1979) · “1984”, Apple Macintosh (Ridley Scott for Chiat\\Day, 1984) · Cloverfield teaser (Paramount, 2007; released without a title)',
      tech: ['Reveal nothing', 'Glimpses cut to black', 'Date + COMING SOON'],
      accent: '#ff5a1f',
      motionDNA: 'Black and sound for 1.2 s, then three glimpses of about 1.8 s, each faded up out of black and cut hard back to it; a 1.2 s date card that flickers on; a 1.6 s COMING SOON end card. Moves are slow pushes and drifts — the light moves more than the product.',
      visualDNA: 'Near-black frames; the Token only as a dark mass picked out by orange rim light: a macro corner, a silhouette in backlit haze, light through the hole. Wide-tracked Archivo for the date and the end card. A small area readout of product visible over time against a dashed 100 % launch line.',
      transitions: 'Fades up from black and hard cuts to black between every glimpse; the date and end card flicker on like a failing lamp',
      implementation: ['Shoot or render details, not views: macro crops, backlight, silhouette, negative fill', 'Edit to sound: hits on the cuts, a drone and a heartbeat under the black', 'Canvas 2D: the Token path filled near-black and stroked with a moving radial-gradient rim light'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      c.fillStyle = T_BG; c.fillRect(0, 0, W, H);
      // hook: a line in the dark
      const h0 = seg(t, 0.25, 0.55) * (1 - seg(t, 0.95, 1.15));
      if (h0 > 0.001) text(c, 'SOMETHING IS TAKING SHAPE', 960, 545, { font: TK.FONT, weight: 500, size: 30, ls: 14, color: `rgba(236,232,223,${0.75 * h0})`, align: 'center', base: 'middle' });
      // glimpse 1 — macro crop of one corner, rim light travelling along it
      if (t >= T_G[0][0] && t < T_G[0][1]) {
        const u = seg(t, T_G[0][0], T_G[0][1]), fade = seg(t, 1.3, 1.65), S = 3200, k = lerp(1, 1.06, u);
        c.save(); c.globalAlpha = fade; c.translate(760, 600); c.scale(k, k); c.translate(-760, -600);
        const cx = 420 + S / 2, cy = 200 + S / 2, rc = S * TK.CORNER, oc = [420 + rc, 200 + rc];
        const a = lerp(PI * 0.92, PI * 1.62, E.ioS(u)), lx = oc[0] + Math.cos(a) * rc, ly = oc[1] + Math.sin(a) * rc;
        rimToken(c, cx, cy, S, 0, lx, ly, 620, { lw: 5 });
        const sh = c.createRadialGradient(lx + 120, ly + 120, 0, lx + 120, ly + 120, 600);
        sh.addColorStop(0, 'rgba(255,120,60,0.10)'); sh.addColorStop(1, 'rgba(255,120,60,0)');
        c.fillStyle = sh; c.fillRect(0, 0, W, H);
        c.restore();
      }
      // glimpse 2 — silhouette against backlit haze
      if (t >= T_G[1][0] && t < T_G[1][1]) {
        const u = seg(t, T_G[1][0], T_G[1][1]), fade = seg(t, 3.5, 3.85);
        c.save(); c.globalAlpha = fade;
        const gl = c.createRadialGradient(960, 620, 30, 960, 620, 760);
        gl.addColorStop(0, 'rgba(255,150,90,0.85)'); gl.addColorStop(0.35, 'rgba(255,90,31,0.45)'); gl.addColorStop(1, 'rgba(255,90,31,0)');
        c.fillStyle = gl; c.fillRect(0, 0, W, H);
        for (let i = 0; i < 4; i++) {   // drifting haze bands
          const hy = 400 + i * 120 + Math.sin(t * 0.6 + i) * 20;
          const hz = c.createLinearGradient(0, hy - 60, 0, hy + 60);
          hz.addColorStop(0, 'rgba(255,200,160,0)'); hz.addColorStop(0.5, 'rgba(255,200,160,0.05)'); hz.addColorStop(1, 'rgba(255,200,160,0)');
          c.fillStyle = hz; c.fillRect(0, hy - 60, W, 120);
        }
        const y = lerp(1010, 905, E.outC(u)), rot = lerp(0.2, 0.28, u);
        c.save(); c.translate(960, y); c.rotate(rot); TK.tokenPath(c, 600); c.restore();
        c.fillStyle = '#030304'; c.fill('evenodd');
        c.strokeStyle = 'rgba(255,170,120,0.55)'; c.lineWidth = 2; c.stroke();
        c.restore();
      }
      // glimpse 3 — the hole, lit from behind
      if (t >= T_G[2][0] && t < T_G[2][1]) {
        const u = seg(t, T_G[2][0], T_G[2][1]), S = 1700, lit = flick(t, 5.62, 0.3) * seg(t, 5.55, 5.7);
        const hx = 980 + lerp(0, -30, u), hy = 520, cx = hx - TK.HOLE.x * S, cy = hy - TK.HOLE.y * S, hr = TK.HOLE.r * S;
        c.save(); c.globalAlpha = seg(t, 5.5, 5.6);
        const bk = c.createRadialGradient(hx, hy, 0, hx, hy, hr * 1.1);
        bk.addColorStop(0, `rgba(255,236,214,${lit})`); bk.addColorStop(0.7, `rgba(255,150,90,${0.9 * lit})`); bk.addColorStop(1, `rgba(255,90,31,${0.7 * lit})`);
        c.fillStyle = bk; c.beginPath(); c.arc(hx, hy, hr * 1.1, 0, TAU); c.fill();
        c.save(); c.translate(cx, cy); TK.tokenPath(c, S); c.restore();
        c.fillStyle = T_DARK; c.fill('evenodd');
        c.globalCompositeOperation = 'lighter';
        const bl = c.createRadialGradient(hx, hy, hr * 0.6, hx, hy, hr * 3.2);
        bl.addColorStop(0, `rgba(255,120,60,${0.35 * lit})`); bl.addColorStop(1, 'rgba(255,90,31,0)');
        c.fillStyle = bl; c.fillRect(hx - hr * 3.2, hy - hr * 3.2, hr * 6.4, hr * 6.4);
        c.globalCompositeOperation = 'source-over';
        c.strokeStyle = `rgba(255,170,120,${0.8 * lit})`; c.lineWidth = 3;
        c.beginPath(); c.arc(hx, hy, hr, 0, TAU); c.stroke();
        c.restore();
      }
      // date card
      if (t >= 7.25 && t < 8.4) {
        const on = flick(t, 7.3, 0.28) * (1 - seg(t, 8.25, 8.4));
        text(c, '11 · 21', 960, 520, { font: TK.FONT, weight: 500, size: 190, ls: 40, color: `rgba(236,232,223,${0.92 * on})`, align: 'center', base: 'middle' });
      }
      // coming soon end card over a rim-lit sliver of the top edge
      if (t >= 8.5) {
        const on = flick(t, 8.5, 0.25), sl = E.outC(seg(t, 8.6, 9.8));
        text(c, 'COMING SOON', 960, 450, { font: TK.FONT, weight: 800, size: 104, ls: 26, color: `rgba(236,232,223,${on})`, align: 'center', base: 'middle' });
        text(c, '11 · 21', 960, 560, { font: TK.MONO, size: 26, ls: 12, color: `rgba(255,138,92,${0.9 * on})`, align: 'center', base: 'middle' });
        TK.word(c, 960, 640, { size: 34, ls: 14, color: `rgba(236,232,223,${0.45 * on})` });
        const S = 900, cy = 1085 + S / 2 - lerp(0, 95, sl);
        const lx = lerp(760, 1180, sl);
        rimToken(c, 960, cy, S, 0, lx, cy - S / 2, 420, { lw: 3, glow: 18, fill: '#0b0b0d' });
      }
      MG.grain(c, W, H, t, 0.05, 'screen');
      FK.strip(c, t, W, H, TB, { label: 'Teaser', dark: true });
      tagFor(c, TB, T_NOTES, t, 72, 128, true);
      tReadout(c, t);
      FK.caption(c, t, W, H, { name: 'Teaser', cat: 'Advertising', dark: true });
    },
    score(A) {
      // drone and rumble under the black; it stops dead before the end card
      A.osc(0, { f: 41.2, dur: 8.42, g: 0.12, a: 1.2, hold: true, rel: 0.08 });
      A.osc(0.5, { type: 'sawtooth', f: 55, dur: 7.9, g: 0.03, a: 2.5, lp: 220, hold: true, rel: 0.08 });
      A.noise(0, { type: 'lowpass', f: 180, dur: 8.42, g: 0.05, a: 1.5, hold: true, rel: 0.08 });
      // heartbeat, quickening
      [0.4, 1.35, 2.25, 3.1, 3.9, 4.65, 5.35, 6.0, 6.6, 7.15, 7.65, 8.1].forEach(t => {
        A.kick(t, 0.26, { f: 70, f2: 36 }); A.kick(t + 0.17, 0.15, { f: 66, f2: 34 });
      });
      // each glimpse: a reversed swell into a hit, a click on the cut to black
      T_G.forEach(([g0, g1], i) => {
        A.whoosh(g0 - 0.85, 0.85, { f1: 180, f2: 1600, swell: 0.97, g: 0.1, rev: 0.4 });
        A.impact(g0, 0.3 + i * 0.04, { rev: 0.7 });
        A.osc(g0, { f: midi([45, 44, 43][i]), dur: 1.6, g: 0.05, type: 'sawtooth', lp: 500, rev: 0.6 });
        A.noise(g1, { type: 'highpass', f: 5000, dur: 0.025, g: 0.12 });
      });
      A.osc(1.5, { f: midi(88), f2: midi(95), glide: 1.7, dur: 1.8, g: 0.018, a: 0.6, rev: 0.6 });   // rim-light shimmer
      for (let k = 0; k < 6; k++) A.noise(5.62 + k * 0.05, { type: 'bandpass', f: 120, q: 6, dur: 0.03, g: 0.08 }); // lamp flicker buzz
      A.bell(7.3, midi(57), { g: 0.1, dur: 2 });
      A.noise(7.3, { type: 'highpass', f: 6000, dur: 0.03, g: 0.1 });
      // silence, then the end-card braam and a last bell
      A.impact(8.5, 0.42, { rev: 0.8 });
      A.chord(8.5, [33, 40, 45, 52], { type: 'sawtooth', dur: 1.5, g: 0.05, a: 0.02, lp: 700, lp2: 200, lpT: 1.5, rev: 0.6, spread: 9, width: 0.6 });
      A.bell(9.35, midi(81), { g: 0.07, dur: 2.2, rev: 0.7 });
    },
  });
})();
