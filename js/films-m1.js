/* batch m1 — Narrative Formats · Film & TV: formattitles · formattrailer · formatcoldopen.
   formattitles (an opening title sequence: distributor, possessory, cast and crew credits held
   long enough to read over evolving graphic action — a line, the Token rolling along it, the
   Token as star, a bar graph of Tokens for the music — ending on the main title MOTION) ·
   formattrailer (a compressed theatrical trailer: studio ident, 'IN A WORLD…' setup cards, the
   braam on the turn, a montage whose cutting rate climbs to the beat, the drop, the title card
   and the 'COMING SOON' date button, with a cuts-per-second readout) ·
   formatcoldopen (a pre-title teaser: straight into the Token on a cracking ledge at night, a
   cliffhanger, a smash cut to the series title card, then back to TWELVE HOURS EARLIER). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, vnoise, midi, text, rng } = MG;
  const TK = MG.TK, FK = MG.FK, P = TK.P, PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const CREAM = '#ece8df', CREAM2 = 'rgba(236,232,223,0.62)', BLACK = '#070708';
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
  const FONTS = [...FK.fonts, [`500 22px ${TK.FONT}`, 'PRESENTS']];

  /* =====================================================================
     TITLE SEQUENCE — scope-letterboxed dark field. The credits run in the
     conventional order (distributor → possessory → lead cast → key crew →
     main title), each placed in open space around the graphic action and
     held long enough to read (annotated hold bar), while the action
     evolves underneath: an orange line draws across, the Token drops on
     it and rolls, grows into the star, splits into a bar graph of Tokens
     that dances to the score, collapses to a point — then MOTION.
     ===================================================================== */
  const TB = [
    { t0: 0, t1: 0.5, name: 'FADE IN', kind: 'break' },
    { t0: 0.5, t1: 2, name: 'PRESENTS', kind: 'act' },
    { t0: 2, t1: 4, name: 'A FILM BY', kind: 'act' },
    { t0: 4, t1: 6, name: 'STARRING', kind: 'act' },
    { t0: 6, t1: 7.5, name: 'MUSIC BY', kind: 'act' },
    { t0: 7.5, t1: 8, name: 'BEAT', kind: 'break' },
    { t0: 8, t1: 10, name: 'MAIN TITLE', kind: 'title' },
  ];
  // credits: [t0, t1, small line, name, x, y, align, order label]
  const TC = [
    [0.5, 2.0, 'PAPER STUDIO', 'PRESENTS', 960, 790, 'center', '1 · DISTRIBUTOR'],
    [2.0, 4.0, 'A FILM BY', 'THE GRID', 200, 330, 'left', '2 · POSSESSORY CREDIT'],
    [4.0, 6.0, 'STARRING', 'THE TOKEN', 200, 500, 'left', '3 · LEAD CAST'],
    [6.0, 7.5, 'MUSIC BY', 'A. OSCILLATOR', 200, 760, 'left', '4 · KEY CREW'],
  ];
  const T_LINE = 600, T_S = 90;
  function tToken(t) {   // the Token's state through the action: x, y, side, rot, alpha
    if (t < 1.0) return null;
    if (t < 4.0) {
      const drop = E.outB(seg(t, 1.0, 1.45), 2.2), x = lerp(520, 1500, E.ioS(seg(t, 1.6, 3.9)));
      return { x, y: lerp(150, T_LINE - T_S / 2, drop), s: T_S, rot: (x - 520) / (T_S * 0.64), a: seg(t, 1.0, 1.1) };
    }
    if (t < 6.2) {
      const u = E.ioC(seg(t, 4.0, 4.9)), x0 = 1500, rot0 = (1500 - 520) / (T_S * 0.64);
      const rq = Math.round(rot0 / (PI / 2)) * (PI / 2);
      return { x: lerp(x0, 1330, u), y: lerp(T_LINE - T_S / 2, 540, u), s: lerp(T_S, 400, u) * (1 + 0.03 * seg(t, 4.9, 6.2)), rot: lerp(rot0, rq, u) + 0.06 * Math.sin((t - 4.9) * 1.2) * seg(t, 4.9, 5.4), a: 1 - seg(t, 6.0, 6.2) };
    }
    return null;
  }
  MG.film({
    id: 'formattitles', dur: 10, poster: 5.2,
    fonts: FONTS,
    meta: {
      family: 'M', name: 'Title Sequence', sub: 'Opening credits in order, held to be read', era: '1950s —',
      origin: 'Early sound films opened on static title cards. In the mid-1950s Saul Bass turned the opening credits into a designed sequence, starting with Carmen Jones (1954) and The Man with the Golden Arm (1955), and the title sequence became its own craft — Maurice Binder’s Bond openings from Dr. No (1962), Pablo Ferro, and later Kyle Cooper’s Se7en (1995). The order of the credits themselves is set largely by guild agreements and contracts: distributor and production company first, the possessory credit, the stars, the main title, the key crew, and the director last.',
      works: 'The Man with the Golden Arm (Saul Bass, 1955) · Dr. No (Maurice Binder, 1962) · Se7en (Kyle Cooper, 1995)',
      tech: ['Credit order: distributor → possessory → cast → crew → title', 'Hold each card long enough to read (≈ 2–3 s)', 'Credits placed in open space around the action'],
      accent: '#ff5a1f',
      motionDNA: 'Four credit cards on the bar lines at 120 BPM — distributor, possessory credit, lead cast, music — each fading in, holding about two seconds and fading out while the graphic action keeps evolving underneath; a half-second black beat; then the main title lands on the downbeat at 8 s and holds to the end.',
      visualDNA: 'A 2.39 : 1 scope frame on near-black: one orange line, the Token rolling along it, growing into the star and splitting into a bar graph of Tokens; credits in wide-tracked cream Archivo, a small line over a big name; MOTION as the main title over an orange rule. Mono hold bars and the credit order in the bars.',
      transitions: 'Credits cross-fade over continuous graphic action; a black beat before the main title',
      implementation: ['After Effects / Nuke title design with an edit-locked credit list', 'Credits timed to the score’s bar lines', 'Canvas 2D: credit table with hold windows over a procedural action layer'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      c.fillStyle = BLACK; c.fillRect(0, 0, W, H);
      const pic = [0, (H - W / 2.39) / 2, W, W / 2.39];
      c.save(); c.beginPath(); c.rect(...pic); c.clip();
      const fade = seg(t, 0, 0.5) * (1 - seg(t, 7.5, 7.75)) + seg(t, 7.95, 8.0);
      // field + vignette
      const gr = c.createRadialGradient(960, 540, 100, 960, 540, 1100);
      gr.addColorStop(0, '#1a1a1e'); gr.addColorStop(1, '#0c0c0e');
      c.fillStyle = gr; c.fillRect(...pic);
      c.globalAlpha = clamp(fade);
      if (t < 8) {
        // the line (draws on, retracts into the centre in the beat)
        const lx1 = W * E.outC(seg(t, 0.3, 1.6)), col = seg(t, 6.0, 6.6), shrink = E.inC(seg(t, 7.1, 7.5));
        c.fillStyle = P.accent;
        const la = lerp(0, 960, shrink), lb = lerp(lx1, 960, shrink);
        c.globalAlpha = clamp(fade) * (1 - col * 0.6); c.fillRect(la, T_LINE - 1.5, lb - la, 3); c.globalAlpha = clamp(fade);
        // staff lines + stamps left behind by the rolling Token
        const st = seg(t, 2.0, 2.8) * (1 - seg(t, 4.0, 4.6));
        if (st > 0) {
          c.fillStyle = `rgba(236,232,223,${0.08 * st})`;
          for (let k = 1; k <= 3; k++) { c.fillRect(0, T_LINE - k * 46, W, 1); c.fillRect(0, T_LINE + k * 46, W, 1); }
          const tk = tToken(t);
          for (let k = 0; k < 9; k++) {
            const sx = 520 + k * 120; if (!tk || sx > tk.x - 60) continue;
            c.strokeStyle = `rgba(255,90,31,${0.5 * st})`; c.lineWidth = 1.5;
            c.strokeRect(sx - 14, T_LINE + 18, 28, 28);
          }
        }
        // the star moment: rings around the big Token
        const ring = seg(t, 4.6, 5.0) * (1 - seg(t, 5.8, 6.1));
        if (ring > 0) {
          c.strokeStyle = `rgba(236,232,223,${0.12 * ring})`; c.lineWidth = 1;
          for (let k = 0; k < 4; k++) { const r = 290 + k * 70 + ((t - 4.6) * 40) % 70; c.beginPath(); c.arc(1330, 540, r, 0, TAU); c.stroke(); }
        }
        const tk = tToken(t);
        if (tk) TK.token(c, tk.x, tk.y, tk.s, { rot: tk.rot, alpha: tk.a });
        // music: a bar graph of Tokens dancing on the eighths
        const mb = seg(t, 6.0, 6.35), mc = E.inC(seg(t, 7.05, 7.45));
        if (mb > 0 && t < 7.5) {
          const n = 11, e8 = Math.floor(t / 0.25);
          for (let i = 0; i < n; i++) {
            const bx = lerp(lerp(1330, 980 + i * 70, E.outB(mb)), 960, mc);
            const lvl = 0.25 + 0.75 * hash(i * 13.7 + e8 * 3.1) * (0.5 + 0.5 * Math.sin(i * 0.7 + t * 2));
            const ph = 1 - ((t / 0.25) % 1), hgt = lerp(1, lvl * (0.7 + 0.3 * ph), mb) * (1 - mc);
            const cnt = Math.max(1, Math.round(hgt * 6));
            for (let j = 0; j < cnt; j++) TK.token(c, bx, T_LINE - 30 - j * 62 * (1 - mc), 48 * (1 - mc * 0.9), { alpha: mb * (j === cnt - 1 ? 1 : 0.55) });
          }
        }
        // credits
        TC.forEach(([a, b, sm, nm, x, y, al, ord], i) => {
          const on = win(t, a, b, 0.3); if (on <= 0) return;
          c.save(); c.globalAlpha *= on;
          const dy = (1 - E.outC(seg(t, a, a + 0.5))) * 10;
          text(c, sm, x, y - 54 + dy, { font: TK.FONT, weight: 500, size: 22, ls: 9, color: CREAM2, align: al });
          text(c, nm, x, y + dy, { font: TK.FONT, weight: 800, size: i === 2 ? 64 : 54, ls: 7, color: CREAM, align: al });
          // hold bar
          const hw = 150, hx = al === 'center' ? x - hw / 2 : x, hy = y + 34, hold = b - a;
          c.fillStyle = 'rgba(236,232,223,0.18)'; c.fillRect(hx, hy, hw, 2);
          c.fillStyle = P.accent; c.fillRect(hx, hy, hw * seg(t, a, b), 2);
          label(c, `${ord}  ·  HOLD ${hold.toFixed(1)} s`, al === 'center' ? x : hx, hy + 24, { align: al, size: 13 });
          c.restore();
        });
      } else {
        // main title
        const u = seg(t, 8.0, 10), ls = lerp(46, 18, E.outQt(seg(t, 8.0, 9.2)));
        c.save(); c.translate(960, 540); c.scale(1 + 0.035 * u, 1 + 0.035 * u);
        TK.word(c, 0, 10, { size: 210, color: CREAM, ls, alpha: E.outC(seg(t, 8.0, 8.5)) });
        c.fillStyle = P.accent; const rw = 760 * E.outQt(seg(t, 8.25, 9.0)); c.fillRect(-rw / 2, 128, rw, 4);
        const dr = E.outB(seg(t, 8.1, 8.6), 2);
        TK.token(c, 0, lerp(-330, -170, dr), 70, { rot: (1 - dr) * PI, alpha: seg(t, 8.1, 8.2) });
        c.restore();
        note(c, 'MAIN TITLE  ·  HOLD 2.0 s  ·  TITLE SAFE', 960 - 200, 860, seg(t, 8.4, 8.8), { size: 13 });
        FK.safeFrame(c, W, H, { dark: true, alpha: 0.22 * seg(t, 8.4, 8.9) });
      }
      c.restore();
      // credit order, bottom-right in the scope bar
      const ORD = ['DISTRIBUTOR', 'FILM BY', 'CAST', 'CREW', 'MAIN TITLE'];
      const cur = t < 2 ? 0 : t < 4 ? 1 : t < 6 ? 2 : t < 7.5 ? 3 : t < 8 ? -1 : 4;
      label(c, 'CREDIT ORDER', W - 72, H - 118, { align: 'right', size: 12, color: 'rgba(236,232,223,0.45)' });
      let ox = W - 72;
      for (let i = ORD.length - 1; i >= 0; i--) {
        const s = ORD[i] + (i < ORD.length - 1 ? '  ›  ' : '');
        c.font = `${i === cur ? 700 : 400} 13px ${TK.MONO}`; c.letterSpacing = '2px';
        const w = c.measureText(s).width; c.letterSpacing = '0px';
        label(c, s, ox, H - 92, { align: 'right', size: 13, ls: 2, color: i === cur ? CREAM : 'rgba(236,232,223,0.4)', weight: i === cur ? 700 : 400 });
        ox -= w;
      }
      FK.strip(c, t, W, H, TB, { dark: true, label: 'Opening titles' });
      FK.caption(c, t, W, H, { name: 'Title Sequence', cat: 'Film & TV', dark: true });
    },
    score(A) {
      // ostinato: low strings on the eighths, A minor → F → C → E, swelling as the credits run
      const roots = [45, 41, 48, 40];
      for (let k = 0; k < 30; k++) {
        const t = 0.5 + k * 0.25; if (t >= 7.5) break;
        const r = roots[Math.floor((t - 0.5) / 2) % 4], g = 0.05 + 0.04 * clamp((t - 0.5) / 7);
        A.osc(t, { type: 'sawtooth', f: midi(r - 12 + (k % 2 ? 12 : 0)), dur: 0.22, g, a: 0.01, lp: 500 + t * 80, rev: 0.2 });
      }
      // a soft chord stab on each new credit card
      [[0.5, [57, 64, 69]], [2.0, [53, 60, 65, 69]], [4.0, [60, 64, 67, 72]], [6.0, [52, 59, 64, 68]]].forEach(([t, n]) => {
        A.chord(t, n, { type: 'triangle', dur: 1.8, g: 0.035, a: 0.2, lp: 1800, rev: 0.6, width: 0.7, spread: 5 });
        A.bell(t, midi(n[n.length - 1] + 12), { g: 0.05, dur: 1.6, rev: 0.6 });
      });
      A.pluck(1.42, midi(57), { g: 0.2, bright: 0.5, dur: 0.6 });   // the Token lands on the line
      for (let k = 0; k < 6; k++) A.osc(4.0 + k * 0.33, { type: 'triangle', f: midi([72, 76, 79, 81, 79, 76][k]), dur: 0.5, g: 0.04, a: 0.02, rev: 0.5 });
      for (let k = 0; k < 6; k++) { A.kick(6.0 + k * 0.25, 0.2, { f: 120, f2: 48 }); A.hat(6.125 + k * 0.25, 0.04); }
      A.whoosh(7.05, 0.45, { f1: 3000, f2: 200, g: 0.08, swell: 0.3 });
      // the main title on the downbeat
      A.impact(8.0, 0.45);
      A.chord(8.0, [45, 57, 64, 69, 72], { type: 'sawtooth', dur: 2.0, g: 0.03, a: 0.04, lp: 1400, lp2: 600, lpT: 2, rev: 0.6, width: 0.8, spread: 7 });
      A.bell(8.0, midi(81), { g: 0.07, dur: 2.2, rev: 0.7 });
    },
  });

  /* =====================================================================
     TRAILER — scope-letterboxed. A shot list drives everything: the studio
     ident, slow Act I shots of the Token alone with 'IN A WORLD…' cards,
     the braam on 'ONE SHAPE', then a montage whose shots get shorter and
     shorter (cut ticks above the strip, cuts per second in the corner),
     the drop to black and silence, the title card, the COMING SOON date
     and a last gag — the button.
     ===================================================================== */
  const RB = [
    { t0: 0, t1: 1, name: 'IDENT', kind: 'hook' },
    { t0: 1, t1: 3.5, name: 'ACT I · SETUP', kind: 'act' },
    { t0: 3.5, t1: 4.2, name: 'TURN', kind: 'turn' },
    { t0: 4.2, t1: 5.6, name: 'ACT II · STAKES', kind: 'act' },
    { t0: 5.6, t1: 6.8, name: 'ACT III · MONTAGE', kind: 'act' },
    { t0: 6.8, t1: 7.2, name: 'DROP', kind: 'break' },
    { t0: 7.2, t1: 8.6, name: 'TITLE', kind: 'title' },
    { t0: 8.6, t1: 10, name: 'DATE', kind: 'cta' },
  ];
  // shot list [start, type, card text]
  const RS = [
    [0, 'ident'], [1.0, 'rest'], [1.8, 'card', 'IN A WORLD…'], [2.4, 'wide'], [2.9, 'card', 'WHERE NOTHING MOVES…'],
    [3.5, 'card', 'ONE SHAPE'], [4.2, 'roll'], [4.7, 'close'], [5.05, 'card', 'WILL'], [5.3, 'cube'], [5.55, 'spin'],
    [5.75, 'card', 'CHANGE'], [5.92, 'fall'], [6.06, 'streak'], [6.18, 'flash'], [6.27, 'close'], [6.36, 'card', 'EVERYTHING'],
    [6.5, 'spin'], [6.58, 'roll'], [6.65, 'flash'], [6.72, 'streak'], [6.8, 'black'], [7.2, 'title'], [8.6, 'date'],
  ];
  const shotAt = t => { let i = 0; for (let k = 0; k < RS.length; k++) if (t >= RS[k][0]) i = k; return i; };
  const cutRate = t => RS.filter(s => s[0] > 0 && s[0] <= t && s[0] > t - 1).length;
  const GRADE = { bg: '#0d1a1d', bg2: '#16292c', floor: '#0a1315' };
  function rFloor(c, W, y) {
    c.fillStyle = GRADE.floor; c.fillRect(0, y, W, 1080 - y);
    c.fillStyle = 'rgba(120,200,200,0.12)'; c.fillRect(0, y, W, 2);
  }
  function spot(c, x, y, r, a = 0.35) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,190,140,${a})`); g.addColorStop(1, 'rgba(255,190,140,0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function rShot(c, t, W, H, s, u, d) {
    const type = s[1], seed = s[0] * 10;
    if (type === 'black') { c.fillStyle = BLACK; c.fillRect(0, 0, W, H); return; }
    if (type === 'card') {
      c.fillStyle = BLACK; c.fillRect(0, 0, W, H);
      const big = s[2] === 'ONE SHAPE', k = 1 + 0.05 * u / d;
      c.save(); c.translate(960, 540); c.scale(k, k);
      text(c, s[2], 0, 0, { font: TK.FONT, weight: 800, size: big ? 120 : 76, ls: big ? 24 : 16, color: big ? P.accent : CREAM, align: 'center', base: 'middle', style: '' });
      c.restore();
      return;
    }
    const bg = c.createLinearGradient(0, 138, 0, 942); bg.addColorStop(0, GRADE.bg2); bg.addColorStop(1, GRADE.bg);
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    const [sx, sy] = shake(t, type === 'cube' || type === 'fall' ? 10 : type === 'rest' || type === 'wide' ? 0 : 4, seed);
    c.save(); c.translate(sx, sy);
    if (type === 'ident') {
      c.fillStyle = BLACK; c.fillRect(0, 0, W, H);
      const a = E.outC(seg(u, 0.05, 0.45)) * (1 - seg(u, 0.85, 1.0));
      spot(c, 960, 480, 520, 0.25 * a);
      TK.token(c, 960, 450, 120, { rot: (1 - E.outQt(seg(u, 0.05, 0.6))) * -PI, alpha: a });
      text(c, 'PAPER STUDIO', 960, 600, { font: TK.FONT, weight: 800, size: 46, ls: 22, color: CREAM, align: 'center', base: 'middle' });
      c.fillStyle = BLACK; c.globalAlpha = 1 - a; c.fillRect(500, 560, 920, 80); c.globalAlpha = 1;
      c.restore(); return;
    }
    if (type === 'rest') {
      const k = 1 + 0.06 * u / d; c.translate(960, 640); c.scale(k, k); c.translate(-960, -640);
      rFloor(c, W, 700); spot(c, 960, 560, 420, 0.32);
      TK.token(c, 960, 620, 160, { color: P.accent });
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(960, 704, 110, 10, 0, 0, TAU); c.fill();
      const r = rng(7); for (let i = 0; i < 40; i++) { const x = r() * W, y = 200 + r() * 600 - u * 20 * (0.5 + r()); c.fillStyle = `rgba(255,220,190,${0.12 + r() * 0.2})`; c.fillRect(x, y, 2, 2); }
    } else if (type === 'wide') {
      rFloor(c, W, 760);
      c.strokeStyle = 'rgba(120,200,200,0.08)'; c.lineWidth = 1; c.beginPath();
      for (let i = -12; i <= 12; i++) { c.moveTo(960 + i * 40, 760); c.lineTo(960 + i * 260, 1080); }
      c.stroke();
      spot(c, 1320, 700, 260, 0.25);
      TK.token(c, 1320 - u * 10, 726, 64);
    } else if (type === 'roll') {
      rFloor(c, W, 740);
      const x = lerp(300, 1500, u / d);
      for (let k = 4; k >= 0; k--) TK.token(c, x - k * 40, 650, 180, { rot: (x - k * 40) / 115, alpha: k ? 0.12 : 1 });
    } else if (type === 'close') {
      const r = 0.4 * u;
      TK.token(c, 960 - 0.2 * 1800, 540 + 0.2 * 1800, 1800, { rot: r * 0.2 });
      spot(c, 960, 540, 360, 0.25);
    } else if (type === 'cube') {
      rFloor(c, W, 760);
      const z = 1 + 1.6 * u / d;
      c.fillStyle = P.blue; c.fillRect(1240 - 160 * z, 760 - 320 * z, 320 * z, 320 * z);
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(1240 - 160 * z, 760 - 40 * z, 320 * z, 40 * z);
      TK.token(c, 640, 699, 120);
    } else if (type === 'spin') {
      c.strokeStyle = 'rgba(255,190,140,0.18)'; c.lineWidth = 3;
      for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + u; c.beginPath(); c.moveTo(960 + Math.cos(a) * 260, 540 + Math.sin(a) * 260); c.lineTo(960 + Math.cos(a) * 900, 540 + Math.sin(a) * 900); c.stroke(); }
      TK.token(c, 960, 540, 300, { rot: u * 14 });
    } else if (type === 'fall') {
      c.fillStyle = 'rgba(160,220,220,0.12)';
      const r = rng(11); for (let i = 0; i < 30; i++) c.fillRect(r() * W, (r() * 1200 - u * 3000) % 1200 + 100, 2, 120);
      TK.token(c, 960, lerp(200, 800, u / d), 220, { rot: 0.6 + u * 3 });
    } else if (type === 'streak') {
      c.fillStyle = BLACK; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 5; i++) { const y = 300 + i * 110 + hash(seed + i) * 40, x = (u * 9000 + hash(seed + i * 3) * W) % (W + 800) - 400; const g = c.createLinearGradient(x - 600, 0, x + 600, 0); g.addColorStop(0, 'rgba(255,90,31,0)'); g.addColorStop(0.5, i % 2 ? 'rgba(120,220,230,0.8)' : 'rgba(255,140,80,0.9)'); g.addColorStop(1, 'rgba(255,90,31,0)'); c.fillStyle = g; c.fillRect(x - 600, y, 1200, 4); }
      TK.token(c, 960, 540, 140, { alpha: 0.9 });
    } else if (type === 'flash') {
      c.fillStyle = `rgba(255,244,230,${1 - u / d * 0.6})`; c.fillRect(0, 0, W, H);
      TK.token(c, 960, 540, 240, { color: '#ffd0b0', alpha: 0.5 });
    }
    c.restore();
  }
  MG.film({
    id: 'formattrailer', dur: 10, poster: 7.9,
    fonts: FONTS,
    meta: {
      family: 'M', name: 'Trailer', sub: 'Three acts, accelerating cuts, title, date', era: '1910s —',
      origin: 'The first film trailers were shown after the feature — hence the name — in American cinemas in the 1910s; for decades the National Screen Service produced most of them for the studios. The modern grammar arrived from the 1980s: Don LaFontaine’s ‘In a world…’ voice-over, montage cut to the music, and in the 2010s the Inception-style braam and the drop to silence before the title, followed by the release date and often a last gag shot, the button.',
      works: 'Alien (teaser, 1979) · Inception (trailer, 2010) · The Social Network (trailer, 2010)',
      tech: ['Three-act structure: setup, stakes, montage', 'Cutting rate rising to the music', 'Braam, drop to silence, title, date button'],
      accent: '#ff5a1f',
      motionDNA: 'A one-second studio ident; Act I in long shots under quiet piano with white-on-black setup cards; the braam on ONE SHAPE at 3.5 s; Act II and III cut shorter and shorter — from one cut a second to about twelve — over a riser and hits on every cut; a 0.4 s drop to silence; the title slam at 7.2 s; COMING SOON with the date at 8.6 s and a final button gag.',
      visualDNA: 'Scope letterbox, teal-and-orange grade: the orange Token alone under a warm spot on a dark teal floor, rolling, spinning, falling, facing a blue cube; anamorphic streaks and white flashes in the montage; wide-tracked cream cards on black; MOTION as a cream title. Cut ticks above the strip, a cuts-per-second readout.',
      transitions: 'Hard cuts throughout, white flash frames, cut to black for the drop',
      implementation: ['Avid / Premiere edit cut to a trailer cue (risers, braams, hits)', 'Cards and title from After Effects', 'Canvas 2D: a shot list of procedural shots, cut rate computed from it'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const i = shotAt(t), s = RS[i], u = t - s[0], d = (RS[i + 1] ? RS[i + 1][0] : 10) - s[0];
      const pic = [0, (H - W / 2.39) / 2, W, W / 2.39];
      c.fillStyle = BLACK; c.fillRect(0, 0, W, H);
      c.save(); c.beginPath(); c.rect(...pic); c.clip();
      if (s[1] === 'title') {
        const k = 1 + 0.04 * u / d, hit = 1 - seg(u, 0, 0.25);
        c.save(); c.translate(960, 540); c.scale(k * (1 + 0.06 * hit), k * (1 + 0.06 * hit));
        TK.word(c, 0, 0, { size: 250, color: CREAM, ls: 22 });
        c.restore();
        note(c, 'TITLE CARD', 960 - 60, 720, seg(u, 0.2, 0.4));
      } else if (s[1] === 'date') {
        TK.word(c, 960, 350, { size: 84, color: CREAM, ls: 12 });
        text(c, 'COMING SOON', 960, 560, { font: TK.FONT, weight: 800, size: 96, ls: 20, color: CREAM, align: 'center', base: 'middle' });
        text(c, 'ONLY IN CINEMAS  ·  OCTOBER 10', 960, 660, { font: TK.FONT, weight: 500, size: 30, ls: 10, color: P.accent, align: 'center', base: 'middle' });
        note(c, 'DATE  ·  CTA', 600, 820, seg(u, 0.2, 0.4));
        // the button: the Token drops on the card and settles
        if (u > 0.6) {
          const b = E.inQ(seg(u, 0.6, 0.98)), sq = Math.exp(-(u - 0.98) * 14) * (u > 0.98 ? 1 : 0);
          TK.token(c, 1350, lerp(150, 488, b), 70, { sy: 1 - 0.25 * sq, sx: 1 + 0.2 * sq });
          note(c, 'BUTTON', 1390, 830, seg(u, 0.9, 1.1));
        }
      } else rShot(c, t, W, H, s, u, d);
      c.restore();
      // act / convention annotations inside the frame
      if (s[1] === 'ident') note(c, 'STUDIO IDENT', 80, 900, win(t, 0.1, 1.0, 0.15));
      if (s[1] === 'card' && t < 3.5) note(c, 'SETUP CARD', 80, 900, 1);
      if (t >= 3.5 && t < 4.2) note(c, 'BRAAM', 80, 900, 1);
      if (t >= 6.8 && t < 7.2) note(c, 'DROP  ·  SILENCE', 80, 900, 1);
      // cut ticks above the strip + rate readout
      c.fillStyle = 'rgba(236,232,223,0.6)';
      RS.forEach(r => { if (r[0] > 0 && r[0] <= t) c.fillRect(lerp(72, W - 72, r[0] / 10) - 0.75, 12, 1.5, 9); });
      const cr = cutRate(t);
      label(c, 'CUTS / S', W - 150, 104, { align: 'right', size: 13 });
      text(c, String(cr), W - 72, 106, { font: TK.MONO, weight: 700, size: 34, color: cr > 5 ? P.accent : CREAM, align: 'right' });
      for (let k = 0; k < 12; k++) { c.fillStyle = k < cr ? (cr > 5 ? P.accent : CREAM) : 'rgba(236,232,223,0.15)'; c.fillRect(W - 440 + k * 14, 94, 10, 10); }
      FK.strip(c, t, W, H, RB, { dark: true });
      FK.caption(c, t, W, H, { name: 'Trailer', cat: 'Film & TV', dark: true });
    },
    score(A) {
      // ident sting
      A.whoosh(0.0, 0.35, { f1: 400, f2: 3000, g: 0.06 });
      A.chord(0.3, [64, 67, 72, 76], { type: 'triangle', dur: 0.9, g: 0.04, a: 0.01, lp: 3000, rev: 0.6, width: 0.8 });
      A.bell(0.3, midi(84), { g: 0.06, dur: 1.0 });
      // Act I: drone and sparse piano
      A.osc(1.0, { f: midi(33), dur: 2.6, g: 0.08, a: 0.6, hold: true, rel: 0.3 });
      A.chord(1.0, [45, 52, 57], { type: 'triangle', dur: 2.5, g: 0.025, a: 0.5, hold: true, rel: 0.4, lp: 900, rev: 0.5, width: 0.6 });
      [[1.0, 69], [1.8, 64], [2.4, 60], [2.9, 57], [3.15, 60]].forEach(([t, m]) => A.pluck(t, midi(m), { g: 0.18, bright: 0.35, dur: 1.4, rev: 0.6 }));
      // the turn: braam
      A.impact(3.5, 0.4);
      A.chord(3.5, [33, 40, 45, 52], { type: 'sawtooth', dur: 1.3, g: 0.055, a: 0.03, lp: 700, lp2: 300, lpT: 1.3, rev: 0.5, width: 0.5, spread: 9 });
      // montage: riser, hits on every cut, an accelerating tick
      A.riser(4.2, 2.6, { g: 0.12, f: 110 });
      RS.forEach(r => { if (r[0] >= 4.2 && r[0] < 6.8) { const k = (r[0] - 4.2) / 2.6; A.kick(r[0], 0.22 + 0.2 * k, { f: 130, f2: 40 }); A.noise(r[0], { type: 'bandpass', f: 900, q: 0.8, dur: 0.12, g: 0.06 + 0.06 * k }); } });
      for (let t = 4.2, dt = 0.25; t < 6.8; t += dt, dt = Math.max(0.0625, dt * 0.9)) A.osc(t, { f: 2600, dur: 0.02, g: 0.04 });
      for (let k = 0; k < 20; k++) { const t = 5.6 + k * 0.0625; A.osc(t, { type: 'sawtooth', f: midi([45, 48, 52, 57][k % 4]), dur: 0.06, g: 0.035, lp: 1600 }); }
      // the drop: silence, then a reversed suck into the title
      A.noise(6.95, { type: 'highpass', f: 1500, dur: 0.25, g: 0.08, swell: 0.97 });
      A.impact(7.2, 0.5);
      A.chord(7.2, [33, 40, 45, 52, 57], { type: 'sawtooth', dur: 1.4, g: 0.045, a: 0.02, lp: 900, lp2: 250, lpT: 1.4, rev: 0.6, width: 0.6, spread: 9 });
      A.bell(7.2, midi(69), { g: 0.06, dur: 1.6, rev: 0.7 });
      // date card + button
      A.chord(8.6, [57, 64, 69, 72], { type: 'triangle', dur: 1.3, g: 0.03, a: 0.05, lp: 2000, rev: 0.6, width: 0.8 });
      A.osc(9.58, { f: 320, f2: 700, glide: 0.12, dur: 0.18, g: 0.08 });
      A.kick(9.58, 0.18, { f: 200, f2: 90, dur: 0.15 });
    },
  });

  /* =====================================================================
     COLD OPEN — no titles: the film drops straight in at night on the
     Token sliding toward the end of a tilting, cracking ledge in the rain,
     handheld and pushing in; jolts, falling debris, a snap zoom, the chunk
     breaks away — and on the peak of the fall, a smash cut to the bright
     series title card. Then the show resumes: daylight, the same ledge
     intact, the Token at rest, the super TWELVE HOURS EARLIER.
     ===================================================================== */
  const CB = [
    { t0: 0, t1: 1.6, name: 'IN MEDIAS RES', kind: 'hook' },
    { t0: 1.6, t1: 4.6, name: 'TENSION', kind: 'act' },
    { t0: 4.6, t1: 5.6, name: 'CLIFFHANGER', kind: 'turn' },
    { t0: 5.6, t1: 7.4, name: 'MAIN TITLE', kind: 'title' },
    { t0: 7.4, t1: 10, name: 'ACT ONE', kind: 'act' },
  ];
  const SMASH = 5.6, BACK = 7.4, XC = 1000, LEND = 1260, CS = 150, PIV = [-40, 640];
  const chunkB = t => kf(t, [[3.35, 0], [3.45, 0.012, E.outQ], [4.05, 0.012], [4.15, 0.028, E.outQ], [4.55, 0.028], [4.65, 0.045, E.outQ], [5.0, 0.05]]) + 1.5 * E.inQ(seg(t, 5.0, 6.0));
  function ledge(c, night, broken, b, drop) {
    const top = night ? '#3a4658' : '#d4cec1', face = night ? '#1c2430' : '#bdb6a7', edge = night ? 'rgba(150,180,220,0.35)' : 'rgba(23,24,28,0.4)';
    const slab = (x0, x1) => { c.fillStyle = face; c.fillRect(x0, 0, x1 - x0, 150); c.fillStyle = night ? 'rgba(150,180,220,0.12)' : 'rgba(23,24,28,0.25)'; c.fillRect(x1 - 3, 0, 3, 150); c.fillStyle = top; c.fillRect(x0, -2, x1 - x0, 14); c.fillStyle = edge; c.fillRect(x0, -2, x1 - x0, 2); };
    slab(-400, broken ? XC : LEND);
    if (broken) {
      c.save(); c.translate(XC, drop); c.rotate(b); c.translate(-XC, 0);
      slab(XC, LEND); c.restore();
    }
  }
  function crack(c, t) {
    const g = seg(t, 1.2, 4.9); if (g <= 0) return;
    const r = rng(23), pts = [[XC, 0]];
    for (let i = 1; i <= 8; i++) pts.push([XC + (r() - 0.5) * 26, i * 19]);
    c.strokeStyle = 'rgba(5,8,12,0.9)'; c.lineWidth = 3; c.beginPath();
    const n = Math.max(1, Math.round(g * 8));
    pts.slice(0, n + 1).forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.stroke();
  }
  function coldScene(c, t, W, H) {
    // night: tilt, slide, jolts, debris, rain, swinging lamp, handheld push-in
    const tilt = 0.055 * E.ioS(seg(t, 0, 1.6));
    const slide = lerp(820, 1110, E.ioS(seg(t, 0.0, 1.7))) + 14 * seg(t, 3.4, 3.5) + 16 * seg(t, 4.1, 4.2) + 10 * seg(t, 4.6, 4.7);
    const b = chunkB(t), drop = 520 * E.inQ(seg(t, 5.1, 6.0));
    const z = lerp(1, 1.35, E.ioS(seg(t, 0.8, 4.6))) + 0.4 * E.outQt(seg(t, 5.05, 5.2));
    const amp = 3 + 6 * seg(t, 1.6, 4.6) + 10 * seg(t, 4.6, 5.0) + 14 * (seg(t, 3.4, 3.5) - seg(t, 3.5, 3.8)) + 14 * (seg(t, 4.1, 4.2) - seg(t, 4.2, 4.5));
    const [sx, sy] = shake(t, amp, 3);
    const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#101826'); bg.addColorStop(1, '#05070b');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.save();
    c.translate(1020 + sx, 540 + sy); c.scale(z, z); c.translate(-1090, -600);
    // distant city lights in the void
    const r0 = rng(5);
    for (let i = 0; i < 40; i++) { const x = r0() * 2400 - 200, y = 760 + r0() * 400; c.fillStyle = `rgba(255,200,120,${0.06 + r0() * 0.12})`; c.fillRect(x, y, 3, 3); }
    // lamp cone
    const lx = 1050 + 140 * Math.sin(t * 1.7);
    const lg = c.createRadialGradient(lx, 300, 20, lx, 560, 520); lg.addColorStop(0, 'rgba(200,215,255,0.18)'); lg.addColorStop(1, 'rgba(200,215,255,0)');
    c.fillStyle = lg; c.fillRect(lx - 600, 0, 1200, 1100);
    c.save(); c.translate(PIV[0], PIV[1]); c.rotate(tilt);
    const broken = t >= 4.98;
    ledge(c, true, broken, b, drop);
    if (!broken) crack(c, t);
    // the Token rides the chunk
    c.save();
    if (slide > XC) { c.translate(XC, broken ? drop : 0); c.rotate(b); c.translate(-XC, 0); }
    const tw = Math.sin(t * 9) * 0.02 * seg(t, 1.6, 4.6);
    TK.token(c, slide, -CS / 2 - 2, CS, { rot: tw + 0.03 * seg(t, 4.6, 5.0) });
    c.restore();
    // debris from the crack
    [3.42, 4.12, 4.62, 5.0].forEach((t0, k) => {
      const u = t - t0; if (u < 0 || u > 1.5) return;
      const r = rng(40 + k);
      for (let i = 0; i < 6; i++) { const vx = (r() - 0.3) * 120, x = XC + vx * u, y = 40 + 900 * u * u + r() * 20; c.fillStyle = 'rgba(70,85,105,0.9)'; c.fillRect(x, y, 6 + r() * 8, 6 + r() * 8); }
    });
    c.restore();
    c.restore();
    // rain (screen space)
    c.strokeStyle = 'rgba(170,190,230,0.16)'; c.lineWidth = 1.5; c.beginPath();
    const rr = rng(9);
    for (let i = 0; i < 90; i++) { const x = rr() * 2100, sp = 1500 + rr() * 900, y = ((rr() * 1200 + t * sp) % 1200) - 60; c.moveTo(x, y); c.lineTo(x - 10, y + 44); }
    c.stroke();
    // vignette
    const vg = c.createRadialGradient(960, 540, 300, 960, 540, 1150); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.7)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
  }
  function daySceneC(c, t, W, H) {
    TK.stage(c, W, H);
    c.save(); c.translate(PIV[0], PIV[1]);
    ledge(c, false, false, 0, 0);
    const hop = Math.max(0, Math.sin(PI * seg(t, 8.7, 9.15))) * 60;
    const sq = Math.exp(-(t - 9.15) * 12) * (t > 9.15 ? 1 : 0);
    TK.token(c, 560, -CS / 2 - 2 - hop, CS, { sy: 1 - 0.2 * sq, sx: 1 + 0.15 * sq });
    c.restore();
    TK.shadow(c, 560 + PIV[0], PIV[1] - 2, CS, hop);
  }
  MG.film({
    id: 'formatcoldopen', dur: 10, poster: 5.3,
    fonts: FONTS,
    meta: {
      family: 'M', name: 'Cold Open', sub: 'Pre-title teaser, cliffhanger, smash cut', era: '1950s —',
      origin: 'Television drama took the teaser from radio and film serials: a scene before the opening titles that drops the viewer into the action and ends on a hook strong enough to hold them through the credits. It was standard on American network series by the 1960s — Star Trek (1966) opened most episodes this way — and from the 1990s the cold open on a cliffhanger, smash-cut to the title card and followed by a time-jump super, became a fixture of prestige drama such as Breaking Bad (2008).',
      works: 'Star Trek (NBC, 1966–69) · The X-Files (Fox, 1993–2002) · Breaking Bad (AMC, 2008–13; pilot cold open)',
      tech: ['In medias res: no titles until the hook lands', 'Smash cut on the peak of the action', 'Time-jump super back into the story'],
      accent: '#ff5a1f',
      motionDNA: 'No titles, no fade in: the first frame is already mid-slide. Tension builds for three seconds of handheld push-in with jolts on the off-beats; the cliffhanger at 4.6 s, a snap zoom at 5.05 s, the ledge breaks; a smash cut at 5.6 s on the peak of the fall to a still, bright title card held 1.8 s; a straight cut back at 7.4 s to calm daylight and a typed TWELVE HOURS EARLIER super.',
      visualDNA: 'Night: a blue-black void with distant lights, rain, a swinging lamp, a slate ledge cracking under the orange Token, heavy vignette. The title card: the paper ground with MOTION in black at full width. Day: the Technique Atlas paper stage, the same ledge whole, the Token at rest. Mono annotations name each convention.',
      transitions: 'Smash cut (night to bright title, sound cut with it); straight cut back to the story',
      implementation: ['Editorial: cut on action at the peak, hard sound cut', 'Title card and super from the show’s graphics package', 'Canvas 2D: one ledge rig drawn as night and day, with a procedural handheld camera'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      let dark = true;
      if (t < SMASH) {
        coldScene(c, t, W, H);
        note(c, `NO TITLES UNTIL ${SMASH.toFixed(1)} s  ·  T−${Math.max(0, SMASH - t).toFixed(1)}`, 80, 112, 1);
        if (t < 1.4) note(c, 'IN MEDIAS RES  ·  NO FADE IN', 80, 140, 1 - seg(t, 1.1, 1.4));
        if (t > 4.6) note(c, 'CLIFFHANGER', 80, 140, seg(t, 4.6, 4.8));
      } else if (t < BACK) {
        dark = false;
        c.fillStyle = P.ground; c.fillRect(0, 0, W, H);
        TK.word(c, 960, 520, { size: 300, color: P.ink, ls: 10 });
        TK.token(c, 960, 300, 90);
        text(c, 'S01  ·  E01  ·  “THE LEDGE”', 960, 700, { font: TK.MONO, weight: 700, size: 22, ls: 6, color: P.mute, align: 'center' });
        FK.label(c, 'SMASH CUT  ·  0 FRAMES OF TRANSITION', 92, 112, { size: 14, ls: 2.5, color: P.ink, weight: 700 });
        c.fillStyle = P.accent; c.fillRect(80, 101, 4, 12);
        FK.label(c, 'MAIN TITLE  ·  HOLD 1.8 s', 92, 140, { size: 14, ls: 2.5, color: P.mute });
        // smash flash: a frame of pure white on the cut
        const fl = 1 - seg(t, SMASH, SMASH + 0.08); if (fl > 0) { c.fillStyle = `rgba(255,255,255,${fl * 0.8})`; c.fillRect(0, 0, W, H); }
      } else {
        dark = false;
        daySceneC(c, t, W, H);
        const sup = 'TWELVE HOURS EARLIER', n = Math.floor(clamp((t - 7.7) / 0.9) * sup.length);
        if (t > 7.7) {
          text(c, sup.slice(0, n), 160, 820, { font: TK.FONT, weight: 800, size: 40, ls: 8, color: P.ink });
          if (n < sup.length || Math.floor(t * 3) % 2) { c.font = `800 40px ${TK.FONT}`; c.letterSpacing = '8px'; const w = c.measureText(sup.slice(0, n)).width; c.letterSpacing = '0px'; c.fillStyle = P.accent; c.fillRect(160 + w + 4, 788, 4, 36); }
        }
        FK.label(c, 'CUT BACK  ·  SUPER: TIME JUMP', 92, 112, { size: 14, ls: 2.5, color: P.ink, weight: 700 });
        c.fillStyle = P.accent; c.fillRect(80, 101, 4, 12);
        FK.label(c, 'ACT ONE BEGINS', 92, 140, { size: 14, ls: 2.5, color: P.mute });
      }
      FK.strip(c, t, W, H, CB, { dark, label: 'Cold open' });
      FK.caption(c, t, W, H, { name: 'Cold Open', cat: 'Film & TV', dark });
    },
    score(A) {
      // everything before the smash cut ends exactly on it
      const end = (t, d) => Math.min(d, SMASH - t);
      A.noise(0, { type: 'lowpass', f: 900, dur: SMASH, g: 0.05, a: 0.02, hold: true, rel: 0.01 });            // rain bed
      A.osc(0, { type: 'sawtooth', f: midi(81), dur: SMASH, g: 0.012, a: 1.5, hold: true, rel: 0.01, lp: 3000, vib: [11, 9] });   // high string tremolo
      A.osc(0, { f: midi(31), dur: SMASH, g: 0.07, a: 0.5, hold: true, rel: 0.01 });                             // sub drone
      // heartbeat, quickening
      for (let t = 0.3, dt = 0.85; t < SMASH - 0.1; t += dt, dt = Math.max(0.42, dt * 0.93)) {
        A.kick(t, 0.26, { f: 70, f2: 38, dur: end(t, 0.3) }); if (t + 0.16 < SMASH) A.kick(t + 0.16, 0.16, { f: 64, f2: 36, dur: end(t + 0.16, 0.25) });
      }
      // creaks and cracks
      A.noise(1.2, { type: 'bandpass', f: 220, f2: 160, q: 6, dur: 0.6, g: 0.07 });
      [3.42, 4.12, 4.62].forEach((t, k) => { A.noise(t, { type: 'highpass', f: 2000, dur: 0.06, g: 0.14 + k * 0.03 }); A.noise(t, { type: 'bandpass', f: 180, q: 4, dur: 0.4, g: 0.08 }); });
      A.riser(4.6, end(4.6, 1.0), { g: 0.12, f: 98 });
      A.noise(5.0, { type: 'highpass', f: 900, dur: 0.3, g: 0.14 });
      A.whoosh(5.05, 0.2, { f1: 800, f2: 4000, g: 0.07, swell: 0.5 });
      // smash cut: the theme sting, loud and bright
      A.kick(SMASH, 0.5, { f: 140, f2: 45 }); A.clap(SMASH, 0.22);
      A.chord(SMASH, [60, 64, 67, 72], { type: 'sawtooth', dur: 0.5, g: 0.035, a: 0.005, lp: 3200, rev: 0.4, width: 0.8 });
      [[0, 72], [0.25, 76], [0.5, 79], [0.75, 84]].forEach(([d, m]) => A.pluck(SMASH + d, midi(m), { g: 0.2, bright: 0.8, dur: 0.8, rev: 0.3 }));
      A.bell(SMASH + 0.75, midi(84), { g: 0.08, dur: 1.2, rev: 0.6 });
      A.chord(SMASH + 0.75, [48, 55, 64, 72], { type: 'triangle', dur: 1.05, g: 0.03, a: 0.02, lp: 2400, rev: 0.6, width: 0.8 });
      // back: daylight — birds, a soft pad, typing on the super, the little hop
      A.chord(BACK, [53, 57, 60, 65], { type: 'triangle', dur: 2.6, g: 0.022, a: 0.4, lp: 1400, rev: 0.6, width: 0.8 });
      [7.6, 8.05, 8.3, 9.4].forEach((t, k) => A.osc(t, { f: 3200 + k * 300, f2: 4200 + k * 200, glide: 0.08, dur: 0.1, g: 0.03, pan: k % 2 ? 0.5 : -0.4 }));
      for (let k = 0; k < 20; k++) A.noise(7.7 + k * 0.045, { type: 'highpass', f: 3500, dur: 0.01, g: 0.05 });
      A.osc(8.7, { f: 400, f2: 800, glide: 0.2, dur: 0.25, g: 0.05 });
      A.kick(9.15, 0.16, { f: 220, f2: 100, dur: 0.12 });
    },
  });
})();
