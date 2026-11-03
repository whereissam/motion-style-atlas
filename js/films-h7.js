/* batch h7 — Lyric Video (B: Typography & Text Motion) · Linocut / Woodcut Animation (C: 2D Animation & Illustration) · Photoreal CGI (D: 3D & CGI Motion). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, spring, rng, hash, midi, text, roughPoly, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Permanent+Marker&family=Space+Mono:wght@400;700&family=Alfa+Slab+One&family=IM+Fell+English:ital@0;1&family=Caveat:wght@500;700&family=Inter:wght@200;300;500&family=IBM+Plex+Mono:wght@400;500&display=block');
  const PI = Math.PI;
  const ss = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  // 2D value noise from the engine hash (seeded, smooth).
  const n2 = (x, y, s = 0) => {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const h = (a, b) => hash(a * 157.31 + b * 311.7 + s * 17.17);
    return lerp(lerp(h(i, j), h(i + 1, j), u), lerp(h(i, j + 1), h(i + 1, j + 1), u), v);
  };

  /* =====================================================================
     LYRIC VIDEO — an original four-line song, "Streetlights", and every
     word is timed to the syllable the synthetic voice sings it on. Verse
     one glows on as neon, letter by letter in a karaoke wipe, each word
     sitting higher or lower with the note it is sung on; verse two is
     scrawled in marker and the held "HOME" stretches and trembles with
     the vibrato; verse three goes Prince — an eye for "I", a "2" and a
     "U" — with shapes popping behind each word; the chorus slams "LOUD-
     ER!" on a yellow ground in a burst of drawn emoji-style icons, and
     the title itself is sung, one syllable per wipe. A pitch trace of
     the vocal line runs underneath the whole time.
     ===================================================================== */
  const LY = { ink: '#1a0f2e', white: '#fff6ea', amber: '#ffc53d', pink: '#ff4fa3', mint: '#7dffd3', violet: '#a35bff', teal: '#19c3c9', accent: '#ffc53d' };
  const LY_F = { black: '"Archivo Black", sans-serif', hand: '"Permanent Marker", cursive', mono: '"Space Mono", monospace' };
  const LY_T = { l0: 0.5, l1: 3.0, l2: 5.0, l3: 7.0, out: 8.3, title: 8.45, sub: 9.2 };
  // The song: lines of words, words of syllables [text, onset, length, midi note, vowel].
  const LY_L = [
    { style: 'neon', t0: 0.25, t1: 2.95, words: [[['STREET', 0.5, 0.42, 64, 'i'], ['LIGHTS', 1.0, 0.42, 67, 'a']], [['HUM', 1.5, 0.42, 69, 'a']], [['YOUR', 2.0, 0.22, 67, 'o']], [['NAME', 2.25, 0.62, 64, 'e']]] },
    { style: 'hand', t0: 2.95, t1: 4.95, words: [[['ALL', 3.0, 0.22, 65, 'o']], [['THE', 3.25, 0.22, 67, 'e']], [['WAY', 3.5, 0.42, 69, 'e']], [['HOME', 4.0, 0.85, 72, 'o']]] },
    { style: 'prince', t0: 4.95, t1: 7.0, words: [[['I', 5.0, 0.22, 72, 'a']], [['SING', 5.25, 0.42, 74, 'i']], [['IT', 5.75, 0.2, 72, 'i']], [['BACK', 6.0, 0.42, 67, 'a']], [['2', 6.5, 0.22, 69, 'u']], [['U', 6.75, 0.6, 76, 'u']]] },
    { style: 'shout', t0: 6.98, t1: 8.3, words: [[['LOUD', 7.0, 0.45, 79, 'a']], [['ER!', 7.5, 0.75, 76, 'e']]] },
    { style: 'title', t0: 8.45, t1: 10.1, words: [[['LY', 8.55, 0.18, 72, 'i'], ['RIC', 8.75, 0.18, 74, 'i']], [['VI', 8.95, 0.18, 76, 'i'], ['DE', 9.15, 0.18, 74, 'e'], ['O', 9.35, 0.55, 72, 'o']]] },
  ];
  const LY_SYL = [];
  LY_L.forEach((L, li) => L.words.forEach((w, wi) => w.forEach(s => LY_SYL.push({ s: s[0], t: s[1], d: s[2], m: s[3], v: s[4], li, wi }))));
  // Section grounds: [from, outer, inner].
  const LY_BG = [[0, '#0d0826', '#3b1462'], [LY_T.l1, '#041a24', '#0f5257'], [LY_T.l2, '#1f0420', '#6d1150'], [LY_T.l3, '#ff9a1f', '#ffd52e'], [LY_T.title, '#0b0620', '#2c1250']];
  const lyAmp = (s, t) => seg(t, s.t - 0.01, s.t + 0.04) * (1 - seg(t, s.t + s.d, s.t + s.d + 0.12));
  // The sung pitch at time t: scoop into each note, vibrato on held ones, amplitude envelope.
  function lyPitch(t) {
    let prev = LY_SYL[0];
    for (const s of LY_SYL) {
      if (t < s.t - 0.01) break;
      prev = s;
    }
    const s = prev, a = lyAmp(s, t);
    let m = s.m - 0.7 * (1 - seg(t, s.t, s.t + 0.07));
    if (s.d >= 0.4) m += Math.sin(TAU * 5.2 * (t - s.t)) * 0.28 * seg(t, s.t + 0.15, s.t + 0.35);
    return { m, a, s };
  }
  // Per-letter layout of a word in the current font: x offsets carry the syllable each letter belongs to.
  function lyLay(c, word, ls = 0) {
    const L = [];
    let x = 0;
    word.forEach(sy => {
      for (let k = 0; k < sy[0].length; k++) {
        const ch = sy[0][k], w = c.measureText(ch).width;
        L.push({ ch, x, w, sy, k, n: sy[0].length });
        x += w + ls;
      }
    });
    return { L, w: x - ls };
  }
  // When a letter lights: syllables wipe across their letters over most of the sung note.
  const lyLetterT = l => { const span = Math.min(l.sy[2], 0.45) * 0.8; return [l.sy[1] + (l.k / l.n) * span, span / l.n + 0.02]; };
  const lySylAmp = (sy, t) => lyAmp({ t: sy[1], d: sy[2] }, t);

  function lyHeart(c, s) {
    c.beginPath(); c.moveTo(0, s * 0.42);
    c.bezierCurveTo(-s * 1.1, -s * 0.25, -s * 0.5, -s * 1.0, 0, -s * 0.45);
    c.bezierCurveTo(s * 0.5, -s * 1.0, s * 1.1, -s * 0.25, 0, s * 0.42);
    c.closePath();
  }
  function lyStar(c, r, n = 5) {
    c.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = -PI / 2 + i * PI / n, rr = i % 2 ? r * 0.45 : r; i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    c.closePath();
  }
  // Emoji-style icons, drawn (no emoji font): heart, star, bolt, singing face, note.
  function lyIcon(c, kind, s, t) {
    c.lineJoin = 'round'; c.lineWidth = s * 0.09; c.strokeStyle = LY.ink;
    if (kind === 0) { lyHeart(c, s); c.fillStyle = LY.pink; c.fill(); c.stroke(); }
    else if (kind === 1) { lyStar(c, s * 0.62); c.fillStyle = LY.white; c.fill(); c.stroke(); }
    else if (kind === 2) {
      c.beginPath(); c.moveTo(s * 0.1, -s * 0.6); c.lineTo(-s * 0.32, s * 0.08); c.lineTo(-s * 0.02, s * 0.08); c.lineTo(-s * 0.12, s * 0.6); c.lineTo(s * 0.34, -s * 0.12); c.lineTo(s * 0.04, -s * 0.12); c.closePath();
      c.fillStyle = LY.violet; c.fill(); c.stroke();
    } else if (kind === 3) {
      c.beginPath(); c.arc(0, 0, s * 0.5, 0, TAU); c.fillStyle = LY.white; c.fill(); c.stroke();
      c.fillStyle = LY.ink; [-1, 1].forEach(k => { c.beginPath(); c.ellipse(k * s * 0.17, -s * 0.12, s * 0.055, s * 0.09, 0, 0, TAU); c.fill(); });
      const o = 0.6 + 0.4 * Math.abs(Math.sin(t * 9));
      c.beginPath(); c.ellipse(0, s * 0.17, s * 0.13, s * 0.15 * o, 0, 0, TAU); c.fillStyle = LY.pink; c.fill(); c.stroke();
    } else {
      c.fillStyle = LY.teal;
      c.beginPath(); c.ellipse(-s * 0.18, s * 0.32, s * 0.2, s * 0.15, -0.4, 0, TAU); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(0, s * 0.3); c.lineTo(0, -s * 0.55); c.quadraticCurveTo(s * 0.38, -s * 0.38, s * 0.3, -s * 0.05); c.stroke();
    }
  }
  function lyEye(c, w, open, col) {
    const h = w * 0.36 * open;
    c.beginPath(); c.moveTo(-w / 2, 0); c.quadraticCurveTo(0, -h * 1.6, w / 2, 0); c.quadraticCurveTo(0, h * 1.6, -w / 2, 0); c.closePath();
    c.fillStyle = LY.white; c.fill();
    c.save(); c.clip();
    c.beginPath(); c.arc(0, 0, w * 0.2, 0, TAU); c.fillStyle = col; c.fill();
    c.beginPath(); c.arc(0, 0, w * 0.09, 0, TAU); c.fillStyle = LY.ink; c.fill();
    c.beginPath(); c.arc(w * 0.06, -w * 0.07, w * 0.035, 0, TAU); c.fillStyle = '#fff'; c.fill();
    c.restore();
    c.lineWidth = w * 0.05; c.strokeStyle = LY.white; c.lineCap = 'round';
    for (let i = -2; i <= 2; i++) { const a = -PI / 2 + i * 0.32; c.beginPath(); c.moveTo(Math.cos(a) * w * 0.42, Math.sin(a) * h * 1.25 - h * 0.15); c.lineTo(Math.cos(a) * w * 0.56, Math.sin(a) * h * 1.6 - h * 0.35); c.stroke(); }
  }

  function lyBackground(c, t, W, H, st) {
    let i = 0;
    for (let k = 0; k < LY_BG.length; k++) if (t >= LY_BG[k][0] - 0.16) i = k;
    const paint = (b, a) => {
      if (a <= 0) return;
      const g = c.createRadialGradient(W / 2, H * 0.62, 60, W / 2, H * 0.55, W * 0.72);
      g.addColorStop(0, b[2]); g.addColorStop(1, b[1]);
      c.globalAlpha = a; c.fillStyle = g; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
    };
    // the chorus pop is a fast cut (one hard change), the rest are soft dissolves
    const fast = i === 3 || i === 4;
    const u = i === 0 ? 1 : seg(t, LY_BG[i][0] - (fast ? 0.04 : 0.16), LY_BG[i][0] + (fast ? 0.02 : 0.1));
    if (u < 1) paint(LY_BG[i - 1], 1);
    paint(LY_BG[i], u);
    // streetlight bokeh drifting past, swelling with the voice
    const P = lyPitch(t), warm = i === 3;
    c.save(); c.globalCompositeOperation = warm ? 'source-over' : 'lighter';
    st.bokeh.forEach(b => {
      const x = ((b.x - t * b.v) % 2300 + 2300) % 2300 - 190, y = b.y + Math.sin(t * 0.7 + b.ph) * 18;
      const r = b.r * (1 + 0.08 * P.a * b.k), a = (warm ? 0.22 : b.a) * (0.75 + 0.25 * Math.sin(t * 2.1 + b.ph));
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      const col = warm ? '255,255,255' : b.col;
      g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(0.72, `rgba(${col},${a * 0.8})`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    });
    c.restore();
  }
  // The vocal line as a moving trace: past bright, future a faint guide; the playhead pulses with the voice.
  function lyTrace(c, t) {
    const dark = t >= LY_T.l3 - 0.04 && t < LY_T.title - 0.04, col = dark ? '26,15,46' : '255,246,234';
    const x0 = 960, k = 300, Y = m => 1000 - (m - 64) * 8;
    c.save();
    c.globalAlpha = 0.9 * seg(t, 0.1, 0.5);
    c.lineCap = 'round';
    LY_SYL.forEach(s => {
      const a = x0 + (s.t - t) * k, b = x0 + (s.t + s.d - t) * k;
      if (b < 60 || a > 1860) return;
      // note bar (guide)
      c.fillStyle = `rgba(${col},${s.t > t ? 0.14 : 0.08})`;
      c.fillRect(Math.max(60, a), Y(s.m) - 5, Math.min(1860, b) - Math.max(60, a), 10);
    });
    // the sung contour, drawn through the past
    c.strokeStyle = `rgba(${col},0.85)`;
    let on = false;
    for (let x = 80; x <= x0; x += 4) {
      const tt = t + (x - x0) / k;
      if (tt < 0.4) continue;
      const P = lyPitch(tt);
      if (P.a > 0.05) {
        const y = Y(P.m);
        if (!on) { c.beginPath(); c.moveTo(x, y); on = true; } else c.lineTo(x, y);
        c.lineWidth = 2 + P.a * 4;
      } else if (on) { c.stroke(); on = false; }
    }
    if (on) c.stroke();
    const P = lyPitch(t);
    c.fillStyle = dark ? LY.ink : LY.amber;
    c.beginPath(); c.arc(x0, Y(P.m), 6 + 10 * P.a, 0, TAU); c.fill();
    c.strokeStyle = `rgba(${col},0.35)`; c.lineWidth = 1.5; c.beginPath(); c.arc(x0, Y(P.m), 16 + 22 * P.a, 0, TAU); c.stroke();
    c.restore();
  }

  // Verse 1: neon outline that lights letter by letter; word height follows the note.
  function lyNeon(c, L, t) {
    const size = 150, gap = 50;
    c.font = `400 ${size}px ${LY_F.black}`;
    const lays = L.words.map(w => lyLay(c, w, 2));
    // two rows: the first word alone, then the rest
    const rowW = [lays[0].w, lays.slice(1).reduce((a, l) => a + l.w, 0) + gap * (lays.length - 2)];
    let x = 960 - rowW[0] / 2;
    lays.forEach((lay, wi) => {
      if (wi === 1) x = 960 - rowW[1] / 2;
      const w0 = L.words[wi][0], y = (wi ? 700 : 450) - (w0[3] - 66) * 11;
      const app = E.outC(seg(t, L.t0 + wi * 0.08, L.t0 + wi * 0.08 + 0.5));
      lay.L.forEach((l, li) => {
        const [lt, ld] = lyLetterT(l), u = seg(t, lt, lt + ld), ex = E.inQ(seg(t, L.t1 - 0.2 + (wi * 4 + li) * 0.012, L.t1 + 0.05 + (wi * 4 + li) * 0.012));
        const pulse = u > 0 ? Math.exp(-(t - lt) * 7) : 0, amp = lySylAmp(l.sy, t);
        const lx = x + l.x, ly = y + (1 - app) * 40 - ex * 90 - pulse * 10;
        c.save(); c.globalAlpha = app * (1 - ex);
        c.translate(lx + l.w / 2, ly); c.scale(1 + pulse * 0.14 + amp * 0.03, 1 + pulse * 0.14 + amp * 0.05);
        text(c, l.ch, -l.w / 2, 0, { font: LY_F.black, size, color: null, stroke: 'rgba(255,246,234,0.42)', lw: 2.5 });
        if (u > 0) {
          c.beginPath(); c.rect(-l.w / 2 - 4, -size, (l.w + 8) * u, size * 1.4); c.clip();
          c.shadowColor = LY.amber; c.shadowBlur = 22 + 36 * amp;
          text(c, l.ch, -l.w / 2, 0, { font: LY_F.black, size, color: amp > 0.1 ? '#fffdf6' : '#ffe7b8' });
          c.shadowBlur = 0;
        }
        c.restore();
      });
      x += lay.w + gap;
    });
  }
  // Verse 2: scrawled in marker as it is sung; the long note spreads its letters and shakes with vibrato.
  function lyHand(c, L, t) {
    const size = 150, gap = 40;
    c.font = `400 ${size}px ${LY_F.hand}`;
    const spread = l => (l.sy[2] >= 0.6 ? l.k * 30 * E.outC(seg(t, l.sy[1] + 0.05, l.sy[1] + l.sy[2])) : 0);
    const lays = L.words.map(w => { const lay = lyLay(c, w, 4); lay.L.forEach(l => (l.sx = spread(l))); lay.w += lay.L[lay.L.length - 1].sx; return lay; });
    const tot = lays.reduce((a, l) => a + l.w, 0) + gap * (lays.length - 1);
    let x = 960 - tot / 2;
    lays.forEach((lay, wi) => {
      const sy0 = L.words[wi][0], y = 590 - (sy0[3] - 68) * 10;
      lay.L.forEach((l, li) => {
        const [lt, ld] = lyLetterT(l), u = E.outC(seg(t, lt - 0.02, lt + ld + 0.04));
        if (u <= 0) return;
        const ex = E.inQ(seg(t, L.t1 - 0.32 + li * 0.015 + wi * 0.03, L.t1 - 0.1 + li * 0.015 + wi * 0.03));
        const amp = lySylAmp(l.sy, t), long = l.sy[2] >= 0.6;
        const vib = long ? Math.sin(TAU * 5.2 * (t - l.sy[1]) + l.k * 1.1) * 12 * seg(t, l.sy[1] + 0.15, l.sy[1] + 0.35) * Math.max(amp, 0.3) : 0;
        c.save(); c.globalAlpha = 1 - ex;
        c.translate(x + l.x + l.sx + l.w / 2, y + vib + ex * 140);
        c.rotate((hash(li * 7.1 + wi * 3.3) - 0.5) * 0.14 + ex * (li % 2 ? 0.4 : -0.4));
        c.beginPath(); c.rect(-l.w / 2 - 10, -size, (l.w + 20) * u, size * 1.5); c.clip();
        text(c, l.ch, -l.w / 2 + 6, 7, { font: LY_F.hand, size, color: '#0a3d40' });
        text(c, l.ch, -l.w / 2, 0, { font: LY_F.hand, size, color: amp > 0.1 ? '#c8fff0' : LY.mint });
        c.restore();
      });
      // a swash under the held word, drawn while the note is held
      const s = L.words[wi][0];
      if (s[2] >= 0.6) {
        const p = E.outC(seg(t, s[1] + 0.1, s[1] + s[2])), ex = seg(t, L.t1 - 0.3, L.t1 - 0.1);
        if (p > 0) {
          c.save(); c.globalAlpha = 1 - ex; c.strokeStyle = LY.amber; c.lineWidth = 10; c.lineCap = 'round';
          c.beginPath();
          for (let k = 0; k <= 30 * p; k++) { const v = k / 30, xx = x - 10 + v * (lay.w + 30), yy = y + 40 + Math.sin(v * 5.5) * 8 - v * 10; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
          c.stroke(); c.restore();
        }
      }
      x += lay.w + gap;
    });
  }
  // Verse 3: Prince-style rebus — an eye for I, a 2 and a U — each word pops in on its note over a shape.
  const LY_PR = [
    { row: 0, f: 'eye', w: 210, col: LY.violet, shape: 0 },
    { row: 0, f: LY_F.black, size: 150, col: LY.white, shape: 1 },
    { row: 0, f: LY_F.black, size: 150, col: LY.amber, shape: -1 },
    { row: 1, f: LY_F.black, size: 150, col: LY.white, shape: 2 },
    { row: 1, f: LY_F.hand, size: 250, col: LY.amber, shape: -1 },
    { row: 1, f: LY_F.hand, size: 290, col: LY.pink, shape: 3 },
  ];
  function lyPrince(c, L, t) {
    const rows = [[], []], ROT = [-0.06, 0.03, -0.04, 0.04, -0.14, 0.09];
    L.words.forEach((w, i) => {
      const P = LY_PR[i];
      if (P.f !== 'eye') { c.font = `400 ${P.size}px ${P.f}`; P.mw = c.measureText(w[0][0]).width; } else P.mw = P.w;
      rows[P.row].push(i);
    });
    const ex = seg(t, L.t1 - 0.1, L.t1 + 0.08);
    rows.forEach((r, ri) => {
      const gap = 50, tot = r.reduce((a, i) => a + LY_PR[i].mw, 0) + gap * (r.length - 1);
      let x = 960 - tot / 2;
      r.forEach(i => {
        const P = LY_PR[i], sy = L.words[i][0], y = ri ? 760 : 480, t0 = sy[1] - 0.04;
        const cx = x + P.mw / 2;
        x += P.mw + gap;
        if (t < t0) return;
        const p = spring(t - t0, 3.4, 0.38), amp = lySylAmp(sy, t);
        const sc = p * (1 + amp * 0.05) * (1 + ex * 0.9);
        c.save(); c.globalAlpha = 1 - ex;
        // the backing shape pops a beat-fraction later and keeps breathing with the voice
        if (P.shape >= 0) {
          const q = spring(t - t0 - 0.05, 2.6, 0.4) * (1 + 0.06 * amp);
          c.save(); c.translate(cx, y - (P.size || 150) * 0.32); c.rotate(-ROT[i] * 2 + (t - t0) * 0.3); c.scale(q, q);
          c.globalAlpha *= 0.9;
          if (P.shape === 0) { c.beginPath(); c.arc(0, 0, 150, 0, TAU); c.fillStyle = '#ff2e8a'; c.fill(); }
          else if (P.shape === 1) { c.beginPath(); c.arc(0, 0, 135, 0, TAU); c.lineWidth = 22; c.strokeStyle = LY.teal; c.stroke(); }
          else if (P.shape === 2) { c.beginPath(); c.moveTo(0, -170); c.lineTo(160, 110); c.lineTo(-160, 110); c.closePath(); c.fillStyle = LY.violet; c.fill(); }
          else { c.translate(0, 30); lyHeart(c, 200); c.fillStyle = 'rgba(255,214,61,0.95)'; c.fill(); }
          c.restore();
        }
        c.translate(cx, y); c.rotate(ROT[i]); c.scale(sc, sc);
        if (P.f === 'eye') {
          c.translate(0, -50);
          let open = 1; const bl = seg(t, sy[1] + 0.12, sy[1] + 0.32); if (bl > 0 && bl < 1) open = Math.abs(bl * 2 - 1);
          lyEye(c, P.w, Math.max(0.08, open * E.outC(seg(t, t0, t0 + 0.12))), P.col);
        } else {
          text(c, sy[0], 7, 8, { font: P.f, size: P.size, color: LY.ink, align: 'center' });
          text(c, sy[0], 0, 0, { font: P.f, size: P.size, color: P.col, align: 'center' });
        }
        c.restore();
      });
    });
  }
  // Chorus: LOUD-ER slammed down on yellow, squashing with the voice, icons bursting out on each syllable.
  function lyShout(c, L, t, st) {
    const ex = E.inC(seg(t, L.t1 - 0.12, L.t1 + 0.12));
    c.save(); c.translate(960, 600); c.scale(1 + ex * 0.4, 1 - ex * 0.96); c.translate(-960, -600);
    L.words.forEach((w, i) => {
      const sy = w[0], t0 = sy[1];
      // the icons, born on the syllable, flying out on an ellipse and hanging there
      st.icons.forEach(ic => {
        if (ic.w !== i) return;
        const u = seg(t, t0 + ic.d, t0 + ic.d + 0.65);
        if (u <= 0) return;
        const r = E.outQt(u), x = 960 + Math.cos(ic.a) * (ic.r0 + ic.r1 * r) * 1.35, y = 590 + Math.sin(ic.a) * (ic.r0 + ic.r1 * r) * 0.78 + (t - t0) * 30;
        const s = ic.s * spring(t - t0 - ic.d, 2.8, 0.4);
        c.save(); c.translate(x, y); c.rotate(ic.rot + (t - t0) * ic.spin); lyIcon(c, ic.k, s, t + ic.a); c.restore();
      });
    });
    L.words.forEach((w, i) => {
      const sy = w[0], t0 = sy[1];
      if (t < t0 - 0.02) return;
      const slam = 1 + 1.3 * (1 - E.outQt(seg(t, t0 - 0.02, t0 + 0.1))), amp = lySylAmp(sy, t);
      const vib = Math.sin(TAU * 5.2 * (t - t0)) * seg(t, t0 + 0.15, t0 + 0.3) * amp;
      const sx = slam * (1 + 0.04 * amp - 0.03 * vib), syy = slam * (1 + 0.1 * amp + 0.05 * vib);
      const shk = amp * 4, jx = (hash(Math.floor(t * 30) + i) - 0.5) * shk, jy = (hash(Math.floor(t * 30) + 9 + i) - 0.5) * shk;
      const y = i ? 830 : 520;
      c.save(); c.globalAlpha = clamp((t - t0 + 0.02) / 0.05);
      c.translate(960 + jx, y + jy); c.rotate(i ? 0.03 : -0.035); c.scale(sx, syy);
      text(c, sy[0], 12, 12, { font: LY_F.black, size: 270, color: LY.pink, align: 'center' });
      text(c, sy[0], 0, 0, { font: LY_F.black, size: 270, color: LY.ink, align: 'center', stroke: '#fff6ea', lw: 14 });
      c.restore();
    });
    c.restore();
  }
  // Title: the name of the style is the last line of the song, wiped syllable by syllable as it is sung.
  function lyTitle(c, L, t) {
    const size = 160, gap = 50;
    c.font = `400 ${size}px ${LY_F.black}`;
    const lays = L.words.map(w => lyLay(c, w, 0));
    const tot = lays.reduce((a, l) => a + l.w, 0) + gap;
    let x = 960 - tot / 2;
    lays.forEach((lay, wi) => {
      lay.L.forEach((l, li) => {
        const [lt, ld] = lyLetterT(l), u = seg(t, lt, lt + ld), app = E.outC(seg(t, L.t0 + li * 0.02 + wi * 0.1, L.t0 + 0.35 + li * 0.02 + wi * 0.1));
        const pulse = u > 0 ? Math.exp(-(t - lt) * 8) : 0;
        c.save(); c.globalAlpha = app;
        c.translate(x + l.x + l.w / 2, 520 + (1 - app) * 30 - pulse * 14); c.scale(1 + pulse * 0.1, 1 + pulse * 0.1);
        text(c, l.ch, -l.w / 2, 0, { font: LY_F.black, size, color: null, stroke: 'rgba(255,246,234,0.5)', lw: 3 });
        if (u > 0) {
          c.beginPath(); c.rect(-l.w / 2 - 4, -size, (l.w + 8) * u, size * 1.4); c.clip();
          c.shadowColor = 'rgba(255,197,61,0.8)'; c.shadowBlur = 30;
          text(c, l.ch, -l.w / 2, 0, { font: LY_F.black, size, color: LY.amber });
          c.shadowBlur = 0;
        }
        c.restore();
      });
      x += lay.w + gap;
    });
    const u = E.outC(seg(t, LY_T.sub, LY_T.sub + 0.5));
    c.save(); c.globalAlpha = u;
    text(c, 'EVERY WORD ON THE BEAT', 960, 620 + (1 - u) * 14, { font: LY_F.mono, weight: 700, size: 32, color: 'rgba(255,246,234,0.85)', align: 'center', ls: 8 });
    c.restore();
  }

  MG.film({
    id: 'lyric', dur: 10, poster: 7.62,
    fonts: [['400 160px "Archivo Black"', 'STREETLIGHTSHUMYOURNAMEISINGBACKLOUDER!LyricVideo'], ['400 150px "Permanent Marker"', 'ALLTHEWAYHOME2U'], ['700 32px "Space Mono"', 'EVERY WORD ON THE BEAT (LYRICVIDEO)']],
    meta: {
      family: 'B', name: 'Lyric Video', sub: 'Every Word on the Beat', era: '1987 —',
      origin: 'A music video whose picture is the song’s own words, each one landing on the syllable it is sung on. Prince’s "Sign o’ the Times" (1987) — animated words and pulsing shapes in place of the singer — set the template; YouTube turned it into a release ritual in the 2010s, with lyric videos posted before the official clip, and Katy Perry’s "Roar" (2013) swapped the words for emoji on a phone screen. It descends from the bouncing-ball sing-along cartoon and karaoke’s colour wipe.',
      works: 'Song Car-Tunes, the bouncing-ball sing-alongs (Fleischer Studios, 1924 —) · "Subterranean Homesick Blues" cue cards (Bob Dylan, in D. A. Pennebaker’s Dont Look Back, 1967) · "Sign o’ the Times" (Prince, dir. Bill Konersman, 1987) · "Roar" lyric video (Katy Perry, 2013)',
      tech: ['Syllable-timed karaoke wipe', 'Pitch-tracking baselines', 'Formant-synth vocal'],
      accent: LY.accent,
      motionDNA: 'Time is the lyric sheet: nothing moves until it is sung, then each syllable wipes across its letters over the length of its note; words sit higher or lower with their pitch, held notes stretch and tremble with the vibrato, short notes pop with a spring, and every line changes treatment so the next verse reads as new.',
      visualDNA: 'Big display type in neon outline, wet marker and heavy grotesk over soft streetlight bokeh, a new ground colour per verse, rebus glyphs (an eye for "I", "2", "U") and drawn emoji-style icons on the chorus, with a pitch trace of the voice running underneath.',
      transitions: 'Line changes on the downbeat: letters float off, fall away or scatter; one hard cut to yellow for the chorus; the chorus squashes flat into the sung title',
      implementation: ['After Effects text animators keyed to a lyric timing sheet', 'Timestamped lyric files (LRC) or forced alignment against the vocal stem', 'Canvas 2D: one syllable table drives the per-letter wipes, the pitch trace and a formant-synth voice'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const r = rng(4117), cols = ['255,190,90', '255,150,70', '255,110,170', '120,220,230', '255,220,150'];
      const bokeh = Array.from({ length: 26 }, () => ({ x: r() * 2300, y: 60 + r() * 960, r: 30 + r() * 110, v: 18 + r() * 50, a: 0.05 + r() * 0.12, ph: r() * TAU, k: r(), col: cols[(r() * cols.length) | 0] }));
      const icons = [];
      for (let w = 0; w < 2; w++) for (let k = 0; k < 9; k++) icons.push({ w, k: (k + w * 2) % 5, a: (k / 9) * TAU + w * 0.35 + (r() - 0.5) * 0.3, r0: 120, r1: 340 + r() * 140, s: 80 + r() * 50, d: r() * 0.08, rot: (r() - 0.5) * 0.8, spin: (r() - 0.5) * 1.2 });
      return { bokeh, icons };
    },
    draw(c, t, W, H, st) {
      lyBackground(c, t, W, H, st);
      // a slight push on each downbeat once the drums are in
      const beat = t >= LY_T.l1 && t < LY_T.title ? Math.exp(-((t % 0.5) * 9)) : 0;
      c.save(); c.translate(960, 560); c.scale(1 + beat * 0.012, 1 + beat * 0.012); c.translate(-960, -560);
      LY_L.forEach(L => {
        if (t < L.t0 - 0.05 || t > L.t1 + 0.25) return;
        if (L.style === 'neon') lyNeon(c, L, t);
        else if (L.style === 'hand') lyHand(c, L, t);
        else if (L.style === 'prince') lyPrince(c, L, t);
        else if (L.style === 'shout') lyShout(c, L, t, st);
        else lyTitle(c, L, t);
      });
      c.restore();
      lyTrace(c, t);
      // the uploader's caption, YouTube style
      const dark = t >= LY_T.l3 - 0.04 && t < LY_T.title - 0.04;
      c.save(); c.globalAlpha = 0.8 * seg(t, 0.2, 0.7) * (1 - seg(t, LY_T.out, LY_T.title));
      text(c, 'STREETLIGHTS (LYRIC VIDEO)', 80, 96, { font: LY_F.mono, weight: 700, size: 22, color: dark ? LY.ink : LY.white, ls: 4 });
      c.fillStyle = dark ? LY.ink : LY.amber; c.fillRect(80, 112, 60, 4);
      c.restore();
      vignette(c, W, H, 0.4);
      grain(c, W, H, t, 0.04, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.95;
      const B = 0.5;
      // chords under each line: Am, F, C, G, then C for the title
      const prog = [[0, [57, 60, 64], 45], [3.0, [53, 57, 60, 64], 41], [5.0, [55, 60, 64], 48], [7.0, [55, 59, 62, 67], 43], [8.45, [48, 55, 60, 64, 67], 36]];
      prog.forEach(([tt, ch], i) => {
        const d = (prog[i + 1] ? prog[i + 1][0] : 10.2) - tt;
        A.chord(tt, ch, { type: 'sawtooth', dur: d + 0.15, g: i === 3 ? 0.018 : 0.013, a: i === 3 ? 0.02 : 0.25, hold: true, rel: 0.3, lp: 700 + i * 260, spread: 8, width: 0.9, rev: 0.45 });
      });
      for (let b = 1; b < 20; b++) {
        const tt = b * B, root = tt >= 8.45 ? 36 : tt >= 7 ? 43 : tt >= 5 ? 48 : tt >= 3 ? 41 : 45;
        A.pluck(tt, midi(root), { g: tt < 3 ? 0.14 : 0.22, dur: 0.48, bright: 0.35, decay: 0.99 });
        if (tt >= 3 && tt < 8.3) A.kick(tt, tt >= 7 ? 0.75 : 0.55);
        if (tt >= 5 && tt < 8.3 && b % 2 === 0) A.clap(tt, 0.22);
        if (tt >= 3 && tt < 8.3) { A.hat(tt + 0.25, 0.05, false, { pan: 0.3 }); A.hat(tt, 0.03, false, { pan: -0.3 }); }
      }
      A.noise(7.0, { type: 'highpass', f: 5000, dur: 1.2, g: 0.08, rev: 0.4 });
      A.riser(6.0, 1.0, { g: 0.06, f: 220 });
      A.impact(8.45, 0.35);
      // the voice: additive harmonics shaped by vowel formants, scooping into each note, vibrato on held ones
      const VOW = { i: [[290, 2250, 2950], [1, 0.4, 0.28]], e: [[480, 1850, 2600], [1, 0.5, 0.28]], a: [[760, 1220, 2600], [1, 0.65, 0.22]], o: [[470, 820, 2550], [1, 0.55, 0.12]], u: [[340, 900, 2400], [1, 0.35, 0.1]] };
      const voice = (s, g, shift = 0, pan = 0) => {
        const f0 = midi(s.m + shift), [F, Aw] = VOW[s.v], amps = [];
        let sum = 0;
        for (let h = 1; f0 * h < 4200; h++) {
          const f = f0 * h; let a = 0.12 / h;
          F.forEach((Fk, k) => { const bw = 80 + Fk * 0.06; a += Aw[k] * Math.exp(-(((f - Fk) / bw) ** 2)); });
          amps.push(a); sum += a;
        }
        const long = s.d >= 0.4;
        amps.forEach((a, i) => {
          const f = f0 * (i + 1);
          A.osc(s.t, { f: f * 0.96, f2: f, glide: 0.07, dur: s.d + 0.1, g: (g * a) / sum, a: 0.03, hold: true, rel: 0.1, vib: long ? [5.2, f * 0.012] : undefined, rev: 0.28, pan });
        });
        // consonant just ahead of the vowel
        const c0 = s.s[0];
        if ('SC'.includes(c0)) A.noise(s.t - 0.06, { type: 'highpass', f: 5200, dur: 0.07, g: 0.05 * g / 0.1, pan });
        else if ('TKBD2'.includes(c0)) A.noise(s.t - 0.015, { type: 'bandpass', f: c0 === 'B' ? 900 : 3600, q: 1.5, dur: 0.025, g: 0.06 * g / 0.1, pan });
        else if ('HN'.includes(c0)) A.noise(s.t - 0.04, { type: 'bandpass', f: 1500, q: 0.8, dur: 0.05, g: 0.025 * g / 0.1, pan });
      };
      LY_SYL.forEach(s => voice(s, s.li === 3 ? 0.13 : 0.1));
      // the chorus and the sung title get a harmony a third up and a soft double
      LY_SYL.filter(s => s.li >= 3).forEach(s => { voice(s, 0.04, s.li === 3 ? -3 : 4, -0.35); voice({ ...s, t: s.t + 0.012 }, 0.03, 0, 0.35); });
      [84, 88, 91].forEach((m, i) => A.bell(9.4 + i * 0.06, midi(m), { g: 0.03, dur: 1.2, rev: 0.5, pan: (i - 1) * 0.3 }));
    },
  });

  /* =====================================================================
     LINOCUT / WOODCUT — a wordless print novel in successive pulls. A
     press roller passes and the first print is there: a black city at
     night, its sky hatched with thin gouge lines, smoke curling from the
     stacks, a man in a long coat walking in. Every frame is a new print
     on 8 fps — the ink mottles differently and the paper shifts a hair.
     Dawn arrives as a second block: the red sun registers in, a touch
     off at first, then settles on the pins; the gouges widen into rays,
     the buildings recoil and the man throws up his arms. The sheet is
     pulled away and a title block is carved, print by print.
     ===================================================================== */
  const LI = { paper: '#ece2cc', ink: '#17130f', red: '#c2361f', bench: '#2c241e', pencil: 'rgba(58,54,48,0.78)', accent: '#c2361f' };
  const LI_F = { slab: '"Alfa Slab One", serif', fell: '"IM Fell English", serif', hand: 'Caveat, cursive' };
  const LI_T = { roll0: 0.12, roll1: 1.15, walk0: 1.15, dawn: 3.0, reg: 3.9, stop: 4.75, raise0: 5.4, raise1: 6.1, swap0: 7.25, swap1: 7.8, carve0: 7.95, carve1: 8.75, pencil: 8.7 };
  const LI_FPS = 8;
  const LI_B = { x: 230, y: 76, w: 1460, h: 808 };
  const LI_HZ = 600, LI_VP = 960;
  // a tapered gouge: pointed at both ends, widths w0 → w1 along its length, optional bend
  function liCut(c, x0, y0, x1, y1, w0, w1, bend = 0) {
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    const P = [0.12, 0.35, 0.65, 0.88], side = [];
    P.forEach(u => { const w = lerp(w0, w1, u) / 2, b = bend * Math.sin(u * PI); side.push([x0 + dx * u + nx * b, y0 + dy * u + ny * b, w]); });
    c.moveTo(x0, y0);
    side.forEach(p => c.lineTo(p[0] + nx * p[2], p[1] + ny * p[2]));
    c.lineTo(x1, y1);
    for (let i = side.length - 1; i >= 0; i--) { const p = side[i]; c.lineTo(p[0] - nx * p[2], p[1] - ny * p[2]); }
    c.closePath();
  }
  function liPose(tq) {
    // walk on fours (4 drawings), stop, turn to the light, arms up
    const walking = tq < LI_T.stop, ph = Math.floor(tq * LI_FPS / 2) % 4;
    const x = walking ? lerp(330, 735, seg(tq, LI_T.walk0, LI_T.stop)) : 735;
    const W = [
      { la: 0.42, ls: 0.12, lb: -0.36, lsb: -0.22, aa: -0.38, ab: 0.4, dy: 6 },
      { la: 0.08, ls: -0.55, lb: -0.04, lsb: 0.02, aa: -0.08, ab: 0.1, dy: 0 },
      { la: -0.36, ls: -0.22, lb: 0.42, lsb: 0.12, aa: 0.4, ab: -0.38, dy: 6 },
      { la: -0.04, ls: 0.02, lb: 0.08, lsb: -0.55, aa: 0.1, ab: -0.08, dy: 0 },
    ];
    let p = walking ? W[ph] : { la: 0.1, ls: 0, lb: -0.12, lsb: 0, aa: -0.1, ab: 0.12, dy: 0 };
    const up = walking ? 0 : Math.floor(seg(tq, LI_T.raise0, LI_T.raise1) * 4) / 4;
    p = { ...p, aa: lerp(p.aa, 2.25, E.outQ(up)), ab: lerp(p.ab, -2.2, E.outQ(up)), lean: -0.12 * up, x };
    return p;
  }
  // The man: limbs as thick strokes, a long coat, a hat. mode 'halo' strokes him wide for the carved outline.
  function liFigure(g, p, foot, mode) {
    const S = 1.0, hipY = foot - 150 * S + p.dy, x = p.x, lean = p.lean || 0;
    const sh = [x + Math.sin(lean) * 100, hipY - 100 * S];
    const extra = mode === 'halo' ? 18 : 0;
    const leg = (a, b) => { const k = [x + Math.sin(a) * 78, hipY + Math.cos(a) * 78], f = [k[0] + Math.sin(a + b) * 78, k[1] + Math.cos(a + b) * 78]; g.moveTo(x, hipY); g.lineTo(k[0], k[1]); g.lineTo(f[0], f[1]); g.lineTo(f[0] + 22, f[1]); };
    const arm = (a, side) => { const s0 = [sh[0] + side * 22, sh[1] + 8], e = [s0[0] + Math.sin(a) * 62, s0[1] + Math.cos(a) * 62], h = [e[0] + Math.sin(a * 1.05) * 58, e[1] + Math.cos(a * 1.05) * 58]; g.moveTo(s0[0], s0[1]); g.lineTo(e[0], e[1]); g.lineTo(h[0], h[1]); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); leg(p.la, p.ls); leg(p.lb, p.lsb); g.lineWidth = 20 + extra; g.stroke();
    g.beginPath(); arm(p.aa, -1); arm(p.ab, 1); g.lineWidth = 16 + extra; g.stroke();
    // coat: shoulders to below the knee, flared, with a flap swinging back
    g.beginPath();
    g.moveTo(sh[0] - 30, sh[1]); g.lineTo(sh[0] + 30, sh[1]);
    g.lineTo(x + 44, hipY + 70); g.lineTo(x + 10, hipY + 80); g.lineTo(x - 52, hipY + 74 + (p.dy ? 4 : -4)); g.closePath();
    if (extra) { g.lineWidth = extra; g.stroke(); }
    g.fill();
    // head and hat
    const hx = sh[0] + Math.sin(lean) * 30, hy = sh[1] - 34;
    g.beginPath(); g.arc(hx, hy, 23 + extra / 2, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(hx, hy - 16, 38 + extra / 2, 8 + extra / 2, lean, 0, TAU); g.fill();
    g.fillRect(hx - 21 - extra / 2, hy - 46 - extra / 2, 42 + extra, 30 + extra);
    return { sh, hipY, hx, hy };
  }
  function liLight(x, y, d, sun) {
    const night = 0.1 + 0.12 * clamp((y - LI_B.y) / (LI_HZ - LI_B.y));
    const r = Math.hypot(x - LI_VP, (y - sun) * 1.3);
    return night + d * (0.95 * Math.exp(-r / 460) + 0.22 * clamp((y - LI_B.y) / (LI_HZ - LI_B.y)));
  }
  // Black block for one print: inked, then carved (destination-out).
  function liBlack(g, tq, pf, st, env) {
    const { d, sun, R, rise } = env, B = LI_B;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, 1920, 1080);
    g.fillStyle = LI.ink;
    roughPoly(g, [[B.x, B.y], [B.x + B.w, B.y], [B.x + B.w, B.y + B.h], [B.x, B.y + B.h]], 1301, 2.2, 22); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.strokeStyle = '#000';
    const jj = (k) => (hash(k * 13.7 + pf * 3.1) - 0.5) * 1.2;   // the block boils a hair from pull to pull
    // sky hatching: horizontal gouges, wider where the light is
    g.beginPath();
    st.sky.forEach((row, j) => row.forEach((s, k) => {
      const mx = s.x + s.l / 2, L = liLight(mx, row.y, d, sun), w = 0.4 + 9 * L * L;
      if (w < 0.8 && s.h > L * 3) return;
      liCut(g, s.x, row.y + jj(j * 31 + k), s.x + s.l, row.y + jj(j * 31 + k + 5), w * 0.6, w, s.b);
    }));
    g.fill();
    // stars and the moon, at night
    if (d < 0.5) {
      g.beginPath();
      st.stars.forEach((s, i) => { if (hash(i * 3 + pf) < 0.15 || s.h < d * 2) return; const r = s.r; liCut(g, s.x - r, s.y, s.x + r, s.y, 0, 3); liCut(g, s.x, s.y - r, s.x, s.y + r, 0, 3); });
      g.fill();
      const my = 210 + tq * 26 + d * 160;
      g.beginPath(); g.arc(1460, my, 46, 0, TAU); g.fill();
      g.globalCompositeOperation = 'source-over'; g.fillStyle = LI.ink;
      g.beginPath(); g.arc(1478, my - 10, 41, 0, TAU); g.fill();
      g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
    }
    // dawn: the sun's hole, a carved ring and rays
    if (d > 0) {
      g.beginPath(); g.arc(LI_VP, sun, R + 5, 0, TAU); g.fill();
      g.lineWidth = 5; g.beginPath(); g.arc(LI_VP, sun, R + 22, 0, TAU); g.stroke();
      g.beginPath();
      for (let i = 0; i < 64; i++) {
        const a = -PI + (i + 0.5) * PI / 32 + (hash(i * 7.7) - 0.5) * 0.03, long = i % 2 ? 0.55 : 1;
        if (Math.sin(a) > 0.25) continue;
        const r0 = R + 34, r1 = r0 + (40 + 900 * d * long * (0.6 + 0.4 * hash(i * 1.3))) * rise;
        liCut(g, LI_VP + Math.cos(a) * r0, sun + Math.sin(a) * r0, LI_VP + Math.cos(a) * r1, sun + Math.sin(a) * r1, 3 + 15 * d * long, 0.5);
      }
      g.fill();
    }
    // buildings: re-ink their silhouettes over the sky, then carve windows and the lit edge
    g.globalCompositeOperation = 'source-over'; g.fillStyle = LI.ink;
    const lean = env.lean;
    const bp = b => { const L = b.side * lean, top = b.top, dx = L * (LI_HZ - top); return [[b.x0, LI_HZ + 4], [b.x1, LI_HZ + 4], [b.x1 + dx, top], [b.x0 + dx, top]]; };
    st.bld.forEach((b, i) => { roughPoly(g, bp(b), 200 + i, 1.4, 30); g.fill(); });
    st.stacks.forEach(s => { const dx = lean * (LI_HZ - s.top); g.beginPath(); g.moveTo(s.x - 15, LI_HZ); g.lineTo(s.x + 15, LI_HZ); g.lineTo(s.x + 11 + dx, s.top); g.lineTo(s.x - 11 + dx, s.top); g.closePath(); g.fill(); });
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
    g.beginPath();
    st.bld.forEach((b, i) => {
      const L = b.side * lean;
      b.win.forEach((w, k) => {
        const lit = w.h < 0.32 + d * 0.25;
        if (!lit) return;
        const sx = L * (LI_HZ - w.y);
        g.rect(w.x + sx, w.y, 8, 15);
      });
      // the edge facing the street catches the light
      const ex = b.side < 0 ? b.x1 - 6 : b.x0 + 6, dx = L * (LI_HZ - b.top);
      liCut(g, ex, LI_HZ - 6, ex + dx, b.top + 8, 1 + 5 * d, 1 + 2 * d);
      // floor lines on the lit face at dawn
      if (d > 0.3) for (let y = b.top + 30; y < LI_HZ - 20; y += 46) { const sx = L * (LI_HZ - y); liCut(g, b.x0 + 8 + sx, y, b.x1 - 8 + sx, y + 1, 0.5, 2.5 * d); }
    });
    g.fill();
    // smoke: wavy carved plumes drifting off the stacks, re-cut on every pull
    g.lineCap = 'round';
    st.stacks.forEach((s, si) => {
      const dx = lean * (LI_HZ - s.top);
      for (let k = -1; k <= 1; k++) {
        g.beginPath();
        for (let i = 0; i <= 24; i++) {
          const u = i / 24, x = s.x + dx - u * 330 + k * 9 * (0.4 + u), y = s.top - 14 - u * 140 + Math.sin(u * 9 - tq * 5 + si * 2 + k * 0.7) * (5 + 22 * u);
          i ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.lineWidth = k ? 2.5 : 4; g.stroke();
      }
    });
    // the ground: converging street lines and cobble rows, brighter on the path to the sun
    g.globalCompositeOperation = 'source-over'; g.fillStyle = LI.ink;
    g.fillRect(B.x + 2, LI_HZ, B.w - 4, B.y + B.h - LI_HZ - 3);
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
    g.beginPath();
    const yb = B.y + B.h - 6;
    for (let k = -14; k <= 14; k++) {
      const xb = LI_VP + k * 120, near = Math.exp(-Math.abs(k) / 4);
      liCut(g, LI_VP + k * 6, LI_HZ + 6, xb, yb, 0.5, 2.5 + (5 + 7 * d) * near * (0.5 + d) + 1.5);
    }
    for (let k = 1; k < 16; k++) {
      const y = LI_HZ + 3 * k * k * 0.6 + k * 4;
      if (y > yb - 6) break;
      const half = (y - LI_HZ) * 2.4;
      for (let s = -6; s < 6; s++) {
        const xa = LI_VP + s * half / 6 + (hash(k * 9 + s) - 0.5) * 20, xb2 = xa + half / 6 * (0.55 + 0.3 * hash(k + s * 3)), L = liLight((xa + xb2) / 2, y, d, sun);
        liCut(g, xa, y, xb2, y + 1, 0.5, 0.6 + 6 * L * (y - LI_HZ) / 280);
      }
    }
    g.fill();
    // his shadow, long, thrown back toward us from the low sun
    const P = liPose(tq), foot = 834;
    if (d > 0.15) {
      g.globalCompositeOperation = 'source-over'; g.fillStyle = LI.ink;
      const sl = (120 + 260 * (1 - rise)) * 1.35;
      g.beginPath(); g.moveTo(P.x - 20, foot); g.lineTo(P.x + 34, foot); g.lineTo(P.x - sl * 0.9 + 10, foot + 46); g.lineTo(P.x - sl * 0.9 - 60, foot + 42); g.closePath(); g.fill();
    }
    // the figure: carved halo, then inked body, then a few highlight cuts on his lit side
    g.save(); g.translate(P.x, foot); g.scale(1.35, 1.35); g.translate(-P.x, -foot);
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.strokeStyle = '#000';
    liFigure(g, P, foot, 'halo');
    g.globalCompositeOperation = 'source-over'; g.fillStyle = LI.ink; g.strokeStyle = LI.ink;
    const F = liFigure(g, P, foot, 'ink');
    if (d > 0.1) {
      g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000';
      g.beginPath();
      for (let k = 0; k < 4; k++) liCut(g, F.sh[0] + 12 + k * 6, F.sh[1] + 14 + k * 4, P.x + 18 + k * 7, F.hipY + 60, 0.5, 1 + 3 * d);
      liCut(g, F.hx + 10, F.hy - 12, F.hx + 18, F.hy + 14, 0.5, 3 * d);
      g.fill();
    }
    g.restore();
    // rolled-ink texture: where the roller left the block a little dry
    g.globalCompositeOperation = 'destination-out';
    g.save(); g.translate(-((hash(pf + 1) * 512) | 0), -((hash(pf + 2) * 512) | 0)); g.globalAlpha = 0.6;
    g.fillStyle = st.mottleP; g.fillRect(0, 0, 1920 + 512, 1080 + 512);
    g.restore();
    g.globalCompositeOperation = 'source-over';
  }
  // Red block: the sun, a glow band behind the city and a few windows.
  function liRed(g, pf, st, env) {
    const { d, sun, R } = env;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, 1920, 1080);
    g.fillStyle = LI.red;
    g.save(); g.beginPath(); g.rect(0, 0, 1920, LI_HZ + 4); g.clip();
    g.beginPath(); g.arc(LI_VP, sun, R + 9, 0, TAU); g.fill();
    g.restore();
    // glow band: rises with the dawn, rough top edge
    const top = LI_HZ - 70 - 330 * d, pts = [[LI_B.x + 4, LI_HZ + 6]];
    for (let x = LI_B.x + 4; x <= LI_B.x + LI_B.w - 4; x += 60) pts.push([x, top + Math.abs(x - LI_VP) * 0.32 + (hash(x * 0.37) - 0.5) * 30]);
    pts.push([LI_B.x + LI_B.w - 4, LI_HZ + 6]);
    roughPoly(g, pts, 77, 3, 30); g.fill();
    st.bld.forEach(b => b.win.forEach(w => { if (w.h < 0.09) { const sx = b.side * env.lean * (LI_HZ - w.y); g.fillRect(w.x + sx - 2, w.y - 2, 12, 19); } }));
    // the sun is carved too: concentric rings
    g.globalCompositeOperation = 'destination-out'; g.strokeStyle = '#000';
    for (let r = 22; r < R; r += 22) { g.lineWidth = 2 + (r / R) * 3; g.beginPath(); g.arc(LI_VP, sun, r, 0.2 + r * 0.01, TAU - 0.3 + r * 0.01); g.stroke(); }
    g.save(); g.translate(-((hash(pf + 5) * 512) | 0), -((hash(pf + 6) * 512) | 0)); g.globalAlpha = 0.7;
    g.fillStyle = st.mottleP; g.fillRect(0, 0, 1920 + 512, 1080 + 512);
    g.restore();
    g.globalCompositeOperation = 'source-over';
  }
  function liReg(c, x, y, col) {
    c.strokeStyle = col; c.lineWidth = 2;
    c.beginPath(); c.arc(x, y, 14, 0, TAU); c.moveTo(x - 24, y); c.lineTo(x + 24, y); c.moveTo(x, y - 24); c.lineTo(x, y + 24); c.stroke();
  }
  // Sheet one: the city print.
  function liPrintSheet(c, t, st) {
    const pf = Math.floor(t * LI_FPS), tq = pf / LI_FPS;
    const d = E.ioS(seg(tq, LI_T.dawn, LI_T.raise1 + 0.4)), rise = E.outC(seg(tq, LI_T.dawn + 0.2, LI_T.raise1 + 0.6));
    const env = { d, rise, R: 108, sun: lerp(LI_HZ + 150, LI_HZ - 205, rise), lean: kf(tq, [[0, 0.05], [LI_T.dawn, 0.05], [LI_T.raise1 + 0.3, -0.045, E.outB]]) };
    c.drawImage(st.paper, 0, 0);
    const jx = (hash(pf * 1.7) - 0.5) * 3, jy = (hash(pf * 2.3) - 0.5) * 3;
    // red goes down first, off its pins at first, then registers
    const reg = 1 - E.outC(seg(tq, LI_T.dawn, LI_T.reg)), rx = 16 * reg + (hash(pf * 5.1) - 0.5) * 3, ry = -11 * reg + (hash(pf * 6.7) - 0.5) * 3;
    if (tq >= LI_T.dawn) {
      liRed(st.redC, pf, st, env);
      c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.92 * clamp((tq - LI_T.dawn + 0.13) / 0.25); c.drawImage(st.red, rx + jx, ry + jy); c.restore();
    }
    liBlack(st.inkC, tq, pf, st, env);
    c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.96; c.drawImage(st.ink, jx, jy); c.restore();
    // registration marks in the margin: black, and the red block's own, closing in
    c.save(); c.globalAlpha = 0.75;
    liReg(c, 150, 480, 'rgba(23,19,15,0.8)'); liReg(c, 1770, 480, 'rgba(23,19,15,0.8)');
    if (tq >= LI_T.dawn) { liReg(c, 150 + rx, 480 + ry, 'rgba(194,54,31,0.9)'); liReg(c, 1770 + rx, 480 + ry, 'rgba(194,54,31,0.9)'); }
    c.restore();
    // pencil in the margin: the pull number, as an edition would be numbered
    text(c, `${pf + 1}/80`, 250, 950, { font: LI_F.hand, weight: 500, size: 40, color: LI.pencil });
    text(c, 'Dawn', 960, 950, { font: LI_F.hand, weight: 500, size: 40, color: LI.pencil, align: 'center' });
    c.save(); c.strokeStyle = LI.pencil; c.lineWidth = 2; c.beginPath();
    for (let k = 0; k <= 40; k++) { const u = k / 40, x = 1480 + u * 200, y = 940 + Math.sin(u * 19) * 9 - u * 10; k ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke(); c.restore();
  }
  // Sheet two: the title block, carved while you watch.
  function liTitleSheet(c, t, st) {
    const pf = Math.floor(t * LI_FPS), tq = pf / LI_FPS;
    c.drawImage(st.paper, 0, 0);
    const g = st.inkC, X = 440, Y = 120, Wb = 1040, Hb = 690;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, 1920, 1080);
    g.fillStyle = LI.ink; roughPoly(g, [[X, Y], [X + Wb, Y], [X + Wb, Y + Hb], [X, Y + Hb]], 909, 2, 22); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.strokeStyle = '#000';
    // double border rule
    g.lineWidth = 6; g.strokeRect(X + 26, Y + 26, Wb - 52, Hb - 52); g.lineWidth = 2.5; g.strokeRect(X + 40, Y + 40, Wb - 80, Hb - 80);
    // a small sun with rays over the title
    const sx = 960, sy = 300;
    g.beginPath(); g.arc(sx, sy, 62, 0, TAU); g.fill();
    g.beginPath();
    for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU, r0 = 82, r1 = r0 + (i % 2 ? 50 : 95); liCut(g, sx + Math.cos(a) * r0, sy + Math.sin(a) * r0, sx + Math.cos(a) * r1, sy + Math.sin(a) * r1, 7, 0.5); }
    g.fill();
    // hatching low in the block, the ground the title stands on
    g.beginPath();
    for (let k = 0; k < 6; k++) { const y = Y + Hb - 120 + k * 13; liCut(g, X + 70 + k * 10, y, X + Wb - 70 - k * 10, y, 1, 1 + k * 0.9); }
    g.fill();
    // the title, carved left to right a little more with every pull
    const cu = seg(tq, LI_T.carve0, LI_T.carve1);
    g.save(); g.beginPath(); g.rect(X, 400, 120 + (Wb - 240) * cu + 120, 260); g.clip();
    text(g, 'LINOCUT', 960, 600, { font: LI_F.slab, size: 160, color: '#000', align: 'center', ls: 6 });
    g.restore();
    // the gouge itself, a little white chip at the cutting edge
    if (cu > 0 && cu < 1) { const ex = X + 120 + (Wb - 240) * cu; g.beginPath(); liCut(g, ex - 30, 470 + hash(pf) * 100, ex + 6, 476 + hash(pf) * 100, 1, 6); g.fill(); }
    g.save(); g.translate(-((hash(pf + 1) * 512) | 0), -((hash(pf + 2) * 512) | 0)); g.globalAlpha = 0.6; g.fillStyle = st.mottleP; g.fillRect(0, 0, 2432, 1592); g.restore();
    g.globalCompositeOperation = 'source-over';
    // the red sun, second block
    const r = st.redC; r.setTransform(1, 0, 0, 1, 0, 0); r.clearRect(0, 0, 1920, 1080); r.fillStyle = LI.red;
    r.beginPath(); r.arc(sx, sy, 66, 0, TAU); r.fill();
    r.globalCompositeOperation = 'destination-out'; r.strokeStyle = '#000';
    for (let rr = 18; rr < 62; rr += 16) { r.lineWidth = 3; r.beginPath(); r.arc(sx, sy, rr, 0.4, TAU - 0.2); r.stroke(); }
    r.globalCompositeOperation = 'source-over';
    const jx = (hash(pf * 1.7) - 0.5) * 3, jy = (hash(pf * 2.3) - 0.5) * 3;
    c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.92; c.drawImage(st.red, 2 + jx, -1 + jy); c.drawImage(st.ink, jx, jy); c.restore();
    // pencil: the subtitle written in, then the edition and a signature scrawl
    const pu = seg(t, LI_T.pencil, LI_T.pencil + 0.7);
    c.save(); c.beginPath(); c.rect(0, 840, 560 + 900 * pu, 140); c.clip();
    text(c, 'Carved, Inked and Pulled', 960, 905, { font: LI_F.fell, style: 'italic', size: 46, color: 'rgba(40,36,32,0.88)', align: 'center' });
    text(c, '1/12', 450, 905, { font: LI_F.hand, weight: 500, size: 40, color: LI.pencil });
    c.restore();
    const su = seg(t, LI_T.pencil + 0.6, LI_T.pencil + 1.1);
    if (su > 0) {
      c.save(); c.strokeStyle = LI.pencil; c.lineWidth = 2.2; c.beginPath();
      for (let k = 0; k <= 50 * su; k++) { const u = k / 50, x = 1300 + u * 180, y = 895 + Math.sin(u * 23) * 10 * (1 - u * 0.5) - u * 8; k ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke(); c.restore();
    }
  }
  function liBench(c, W, H, st) {
    c.fillStyle = LI.bench; c.fillRect(0, 0, W, H);
    c.drawImage(st.bench, 0, 0);
  }

  MG.film({
    id: 'linocut', dur: 10, poster: 6.4,
    fonts: [['400 160px "Alfa Slab One"', 'LINOCUT'], ['italic 400 46px "IM Fell English"', 'Carved, Inked and Pulled'], ['500 40px Caveat', '0123456789/80Dawn']],
    meta: {
      family: 'C', name: 'Linocut', sub: 'Carved, Inked and Pulled', era: '1918 —',
      origin: 'Relief printmaking set in motion: every white line is a groove gouged out of a wood or linoleum block, ink is rolled over what is left, and each frame is a fresh pull of paper. Frans Masereel’s wordless woodcut novels (from 1918) and Lynd Ward’s Gods’ Man (1929) told whole stories in successive prints, and Berthold Bartosch animated Masereel’s The Idea as L’Idée (1932) in cut-outs on layered glass; today linocut is cut frame by frame, or faked with carved textures, for music videos and title sequences.',
      works: '25 Images of a Man’s Passion (Frans Masereel, 1918) · The Sun (Frans Masereel, 1919) · The Idea (Frans Masereel, 1920) · Gods’ Man (Lynd Ward, 1929) · L’Idée (Berthold Bartosch, 1932; score by Arthur Honegger)',
      tech: ['Tapered gouge-mark carving', 'Two-block colour registration', 'One print per frame, on 8 fps'],
      accent: LI.accent,
      motionDNA: 'Motion as a stack of prints: the picture steps at 8 drawings a second, and every pull boils slightly — the ink takes differently, the paper sits a hair off; light is not painted but cut, so dawn arrives as gouges widening into rays, and a second colour registers in from slightly off its pins before it locks.',
      visualDNA: 'Dense black ink on cream laid paper with carved white tapered gouges — hatched skies, ray bursts, cobbled perspective, a figure isolated by a cut halo — a single red second block for the sun, rolled-ink mottling, registration crosses and pencil numbering in the margin.',
      transitions: 'A press roller passes to reveal the first pull; prints step on 8 fps; the sheet is pulled away and the title block is carved pull by pull',
      implementation: ['Hand-cut lino or woodblocks, one pulled print per frame (rostrum-shot)', 'Cut-paper or glass-plane multiplane imitating woodcut (Bartosch)', 'After Effects / Procreate with carved-texture brushes and stepped time', 'Canvas 2D: ink block filled then carved with destination-out tapered gouges, mottle punched per pull, red block multiplied under black with animated misregistration'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const r = rng(1918);
      // paper: cream with soft cloud and fibres, made at half size and drawn up
      const pp = offscreen(960, 540), pg = pp.getContext('2d'), pd = pg.createImageData(960, 540);
      for (let y = 0; y < 540; y++) for (let x = 0; x < 960; x++) {
        const i = (y * 960 + x) * 4, n = n2(x / 60, y / 60, 3) * 0.6 + n2(x / 9, y / 9, 5) * 0.4, f = hash(x * 0.913 + y * 7.17) * 0.5;
        const v = 0.9 + n * 0.06 + f * 0.05;
        pd.data[i] = 236 * v; pd.data[i + 1] = 226 * v; pd.data[i + 2] = 204 * v; pd.data[i + 3] = 255;
      }
      pg.putImageData(pd, 0, 0);
      const paper = offscreen(1920, 1080), pc = paper.getContext('2d');
      pc.imageSmoothingEnabled = true; pc.drawImage(pp, 0, 0, 1920, 1080);
      pc.strokeStyle = 'rgba(120,100,70,0.12)'; pc.lineWidth = 1;
      for (let k = 0; k < 900; k++) { const x = r() * 1920, y = r() * 1080, a = r() * TAU, l = 6 + r() * 22; pc.beginPath(); pc.moveTo(x, y); pc.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); pc.stroke(); }
      // laid lines
      pc.fillStyle = 'rgba(120,100,70,0.025)'; for (let x = 0; x < 1920; x += 7) pc.fillRect(x, 0, 2, 1080);
      // rolled-ink mottle: speckles and dry streaks where ink failed to take
      const mo = offscreen(512, 512), mg = mo.getContext('2d'), md = mg.createImageData(512, 512);
      for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
        const i = (y * 512 + x) * 4, n = n2(x / 30, y / 7, 11) * 0.55 + n2(x / 9, y / 9, 13) * 0.3 + n2(x / 2.5, y / 2.5, 17) * 0.15;
        const sp = hash(x * 3.7 + y * 91.3) > 0.985 ? 0.8 : 0;
        md.data[i + 3] = 255 * clamp(Math.max((n - 0.66) * 2.6, sp));
      }
      mg.putImageData(md, 0, 0);
      // the bench under the sheet when it is pulled away
      const bench = offscreen(1920, 1080), bc = bench.getContext('2d');
      for (let y = 0; y < 1080; y += 3) { bc.fillStyle = `rgba(${70 + n2(0.3, y / 40, 2) * 30},${52 + n2(0.3, y / 40, 2) * 22},${40},${0.5 + hash(y) * 0.3})`; bc.fillRect(0, y, 1920, 3); }
      // sky rows of gouge segments, stable from pull to pull
      const sky = [];
      for (let y = LI_B.y + 14, j = 0; y < LI_HZ - 4; y += 12, j++) {
        const row = []; row.y = y;
        for (let x = LI_B.x + 8 + r() * 30; x < LI_B.x + LI_B.w - 30;) { const l = 40 + r() * 170; row.push({ x, l: Math.min(l, LI_B.x + LI_B.w - 10 - x), b: (r() - 0.5) * 6, h: r() }); x += l + 6 + r() * 26; }
        sky.push(row);
      }
      const stars = Array.from({ length: 34 }, () => ({ x: LI_B.x + 40 + r() * (LI_B.w - 80), y: LI_B.y + 30 + r() * 300, r: 4 + r() * 7, h: r() }));
      // the city: a canyon of tall blocks either side of the street, low at the middle
      const bld = [];
      for (let side = -1; side <= 1; side += 2) {
        let x = side < 0 ? LI_B.x + 4 : LI_B.x + LI_B.w - 4;
        while (side < 0 ? x < 850 : x > 1070) {
          const w = 80 + r() * 90, x0 = side < 0 ? x : x - w, x1 = x0 + w, mid = (x0 + x1) / 2, edge = Math.abs(mid - LI_VP) / 730;
          const top = LI_HZ - (130 + edge * edge * 330 + r() * 70);
          const win = [];
          for (let wy = top + 22; wy < LI_HZ - 26; wy += 34) for (let wx = x0 + 12; wx < x1 - 18; wx += 24) win.push({ x: wx, y: wy, h: r() });
          bld.push({ x0, x1, top, side, win });
          x = side < 0 ? x1 - 4 : x0 + 4;
        }
      }
      const stacks = [{ x: 1150, top: 300 }, { x: 1245, top: 255 }];
      const ink = offscreen(1920, 1080), red = offscreen(1920, 1080);
      const st = { paper, bench, sky, stars, bld, stacks, ink, red, inkC: ink.getContext('2d'), redC: red.getContext('2d') };
      st.mottleP = st.inkC.createPattern(mo, 'repeat');
      return st;
    },
    draw(c, t, W, H, st) {
      const sw = E.ioC(seg(t, LI_T.swap0, LI_T.swap1));
      if (sw > 0) liBench(c, W, H, st);
      if (sw < 1) {
        c.save();
        if (sw > 0) { c.translate(-2150 * sw, 30 * sw); c.rotate(-0.04 * sw); c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 40; c.fillStyle = LI.paper; c.fillRect(0, 0, W, H); c.shadowBlur = 0; }
        // the press roller reveals the first pull
        const rx = lerp(-160, 2100, E.ioS(seg(t, LI_T.roll0, LI_T.roll1)));
        if (t < LI_T.roll1) {
          c.drawImage(st.paper, 0, 0);
          c.save(); c.beginPath(); c.rect(0, 0, rx, H); c.clip(); liPrintSheet(c, Math.max(t, LI_T.walk0), st); c.restore();
          const g = c.createLinearGradient(rx - 80, 0, rx + 80, 0);
          g.addColorStop(0, '#1b1714'); g.addColorStop(0.35, '#4a423b'); g.addColorStop(0.5, '#8a8178'); g.addColorStop(0.62, '#3b342e'); g.addColorStop(1, '#0d0b0a');
          const sh = c.createLinearGradient(rx + 80, 0, rx + 180, 0); sh.addColorStop(0, 'rgba(30,20,10,0.35)'); sh.addColorStop(1, 'rgba(30,20,10,0)');
          c.fillStyle = sh; c.fillRect(rx + 80, 0, 100, H);
          c.fillStyle = g; c.fillRect(rx - 80, -10, 160, H + 20);
          c.fillStyle = 'rgba(0,0,0,0.35)'; for (let y = (t * 900) % 40; y < H; y += 40) c.fillRect(rx - 80, y, 160, 2);
        } else liPrintSheet(c, t, st);
        c.restore();
      }
      if (sw > 0) {
        c.save(); c.translate(2150 * (1 - sw), -24 * (1 - sw)); c.rotate(0.03 * (1 - sw));
        c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 40; c.fillStyle = LI.paper; c.fillRect(0, 0, W, H); c.shadowBlur = 0;
        liTitleSheet(c, t, st);
        c.restore();
      }
      vignette(c, W, H, 0.28, '40,25,10');
      grain(c, W, H, Math.floor(t * LI_FPS) / LI_FPS, 0.05, 'multiply');
    },
    score(A) {
      A.bus.gain.value = 1.2;
      const T = LI_T;
      // the press roller: a rumble and the hiss of paper
      A.noise(T.roll0, { type: 'lowpass', f: 380, dur: 1.05, g: 0.2, swell: 0.4 });
      A.osc(T.roll0, { f: 52, dur: 1.05, g: 0.12, a: 0.3, hold: true, rel: 0.3 });
      A.noise(T.roll0 + 0.1, { type: 'bandpass', f: 2500, q: 0.7, dur: 0.95, g: 0.04, swell: 0.6 });
      // a soft woodblock knock on every other pull, like a press in a quiet room
      for (let tt = T.walk0; tt < T.swap0; tt += 0.25) {
        const k = Math.round(tt * 4);
        A.osc(tt, { type: 'triangle', f: k % 2 ? 820 : 640, f2: 420, glide: 0.03, dur: 0.05, g: k % 2 ? 0.025 : 0.045, rev: 0.15, pan: k % 2 ? 0.2 : -0.2 });
      }
      // gouge scrapes as the light is cut in
      [3.2, 3.7, 4.3, 4.9, 5.5, 6.0, 6.6].forEach((tt, i) => A.noise(tt, { type: 'bandpass', f: 2200 + i * 300, f2: 4200, q: 3, dur: 0.22, g: 0.035, swell: 0.3, pan: (i % 2 ? 0.4 : -0.4) }));
      // night: low strings in D minor and an ondes-like sine melody (after Honegger's L'Idée)
      A.chord(T.walk0, [38, 45, 50], { type: 'sawtooth', dur: 1.95, g: 0.03, a: 0.5, hold: true, rel: 0.6, lp: 600, spread: 6, width: 0.6, rev: 0.4 });
      const ondes = (tt, m, d, g = 0.075) => A.osc(tt, { f: midi(m) * 0.985, f2: midi(m), glide: 0.12, dur: d, g, a: 0.09, hold: true, rel: 0.25, vib: [6, midi(m) * 0.012], rev: 0.5 });
      [[1.3, 69, 0.55], [1.85, 70, 0.4], [2.25, 69, 0.4], [2.65, 65, 0.4]].forEach(([tt, m, d]) => ondes(tt, m, d));
      ondes(3.05, 62, 0.85);
      // dawn: the harmony lifts to D major and the line climbs
      A.chord(T.dawn, [38, 45, 50, 53], { type: 'sawtooth', dur: 1.8, g: 0.026, a: 0.6, hold: true, rel: 0.5, lp: 800, spread: 6, width: 0.7, rev: 0.45 });
      A.chord(T.stop, [38, 45, 50, 54, 57], { type: 'sawtooth', dur: 2.6, g: 0.026, a: 0.5, hold: true, rel: 0.7, lp: 1300, spread: 6, width: 0.8, rev: 0.5 });
      [[3.95, 66, 0.45], [4.4, 69, 0.45], [4.85, 71, 0.45], [5.3, 74, 1.8, 0.09]].forEach(([tt, m, d, g]) => ondes(tt, m, d, g));
      A.osc(T.raise0, { f: midi(38), dur: 1.8, g: 0.09, a: 0.4, hold: true, rel: 0.6 });
      ondes(7.0, 78, 0.6, 0.05);
      // the sheet is pulled away, the title is carved, a bell for the signature
      A.whoosh(T.swap0, 0.6, { f1: 600, f2: 3000, g: 0.08, swell: 0.5 });
      A.noise(T.swap0 + 0.05, { type: 'bandpass', f: 1800, q: 0.8, dur: 0.4, g: 0.05 });
      for (let k = 0; k < 6; k++) A.noise(T.carve0 + k * 0.125, { type: 'bandpass', f: 3000 + hash(k) * 1500, q: 2.5, dur: 0.09, g: 0.05, pan: (k / 5 - 0.5) * 0.6 });
      A.chord(T.carve0, [50, 57, 62, 66, 69], { type: 'triangle', dur: 2.0, g: 0.03, a: 0.3, hold: true, rel: 0.8, lp: 2200, spread: 4, width: 0.8, rev: 0.5 });
      ondes(T.carve0 + 0.1, 74, 0.9, 0.06); ondes(T.carve0 + 1.0, 78, 0.9, 0.05);
      [74, 81, 86].forEach((m, i) => A.bell(T.pencil + 0.6 + i * 0.12, midi(m), { g: 0.04, dur: 1.4, rev: 0.5, pan: (i - 1) * 0.3 }));
    },
  });

  /* =====================================================================
     PHOTOREAL CGI — a still life on a table under a window, ray traced.
     It opens as a render in progress: buckets spiral out from the
     centre, each one noisy at four samples; then progressive passes
     double the sample count until the speckle settles into clean light
     — a window-shaped sun patch with muntin shadows on oak, colour
     bleeding up from it onto the wall, a chrome sphere mirroring the
     room, glazed and terracotta ceramics. Then the shot plays as film:
     scope bars, the chrome ball rolls through the light with motion
     blur and the focus racks from it to the terracotta pot behind.
     ===================================================================== */
  const PR = { ink: '#f4efe6', dim: 'rgba(244,239,230,0.65)', accent: '#f2b56b' };
  const PR_F = { thin: 'Inter, sans-serif', mono: '"IBM Plex Mono", monospace' };
  const PR_BW = 640, PR_BH = 360, PR_BK = 40;
  const PR_T = { b0: 0.3, b1: 2.55, conv: 4.45, film: 4.6, roll0: 5.0, roll1: 7.9, rack0: 6.6, rack1: 7.6, title: 8.3, sub: 8.8 };
  const PR_WZ = -2.2, PR_WIN = { x0: -2.5, x1: -0.75, y0: 0.3, y1: 2.3, mx: -1.62, my: 1.3 };
  const PR_SUN = (() => { const v = [-0.48, 0.52, -0.7], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();
  const PR_CYL = { x: -0.78, z: 0.3, r: 0.26, h: 0.58 };
  const PR_TER = { x: 0.88, y: 0.3, z: -0.62, r: 0.3 };
  const PR_SUNC = [6.2, 5.3, 4.2], PR_SKYC = [0.9, 1.15, 1.6], PR_BNC = [0.9, 0.55, 0.3], PR_AMB = [0.07, 0.065, 0.06];
  // ACES-fit tonemap and gamma, as a lookup over 0..16
  const PR_LUT = (() => { const L = new Uint8ClampedArray(4096); for (let i = 0; i < 4096; i++) { const x = (i / 4095) * 16, y = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14); L[i] = Math.pow(clamp(y), 1 / 2.2) * 255; } return L; })();
  const prTM = v => PR_LUT[v <= 0 ? 0 : v >= 12.8 ? 4095 : (v * 319.9) | 0];   // exposure +1/3 stop
  // Chrome ball: rests, then rolls toward the lens through the sun patch.
  const prBallX = t => kf(t, [[0, -0.12], [PR_T.roll0, -0.12], [PR_T.roll1, 0.06, E.ioS]]);
  const prBallZ = t => kf(t, [[0, 0.02], [PR_T.roll0, 0.02], [PR_T.roll1, 0.64, E.ioS]]);
  function prCam(t) {
    const u = E.ioS(seg(t, PR_T.film, 10));
    const e = [lerp(0.28, 0.44, u), lerp(0.88, 0.8, u), lerp(2.65, 2.4, u)], ta = [lerp(-0.02, 0.1, u), 0.34, -0.25];
    const w0 = [ta[0] - e[0], ta[1] - e[1], ta[2] - e[2]], wl = Math.hypot(w0[0], w0[1], w0[2]), w = [w0[0] / wl, w0[1] / wl, w0[2] / wl];
    const ul = Math.hypot(w[2], w[0]), uu = [-w[2] / ul, 0, w[0] / ul], v = [uu[1] * w[2] - uu[2] * w[1], uu[2] * w[0] - uu[0] * w[2], uu[0] * w[1] - uu[1] * w[0]];
    return { e, u: uu, v, w, f: PR_BW * 0.92 };
  }
  // Soft occlusion of a ray from P along L by a sphere (closest approach, penumbra grows with distance).
  function prSphOcc(cx, cy, cz, r, X, Y, Z, Lx, Ly, Lz, k) {
    const ox = cx - X, oy = cy - Y, oz = cz - Z, tc = ox * Lx + oy * Ly + oz * Lz;
    if (tc <= 0) return 1;
    const d = Math.sqrt(Math.max(0, ox * ox + oy * oy + oz * oz - tc * tc)), pen = 0.005 + k * tc;
    return ss(r - pen, r + pen, d);
  }
  function prCylOcc(X, Y, Z, Lx, Ly, Lz, k) {
    const C = PR_CYL, hh = Lx * Lx + Lz * Lz;
    if (hh < 1e-6) return 1;
    let s = ((C.x - X) * Lx + (C.z - Z) * Lz) / hh;
    if (s <= 0) return 1;
    if (Ly > 0 && Y < C.h) s = Math.min(s, (C.h - Y) / Ly);
    const dx = X + s * Lx - C.x, dz = Z + s * Lz - C.z, dh = Math.sqrt(dx * dx + dz * dz), y = Y + s * Ly, pen = 0.005 + k * s;
    return 1 - (1 - ss(C.r - pen, C.r + pen, dh)) * (1 - ss(C.h - pen, C.h + pen, y));
  }
  function prOcc(S, X, Y, Z, Lx, Ly, Lz, k, self) {
    let v = 1;
    if (self !== 1) v *= prSphOcc(S.bx, 0.42, S.bz, 0.42, X, Y, Z, Lx, Ly, Lz, k);
    if (self !== 2 && v > 0.01) v *= prSphOcc(PR_TER.x, PR_TER.y, PR_TER.z, PR_TER.r, X, Y, Z, Lx, Ly, Lz, k);
    if (self !== 3 && v > 0.01) v *= prCylOcc(X, Y, Z, Lx, Ly, Lz, k);
    return v;
  }
  // How much of the window's glass a point on the wall plane sees (soft-edged, minus the muntin cross).
  function prGlass(wx, wy, pw) {
    const W = PR_WIN;
    let m = ss(W.x0 - pw, W.x0 + pw, wx) * (1 - ss(W.x1 - pw, W.x1 + pw, wx)) * ss(W.y0 - pw, W.y0 + pw, wy) * (1 - ss(W.y1 - pw, W.y1 + pw, wy));
    if (m <= 0) return 0;
    m *= ss(0.022 - pw, 0.022 + pw, Math.abs(wx - W.mx)) * ss(0.022 - pw, 0.022 + pw, Math.abs(wy - W.my));
    return m;
  }
  const prSky = wy => 2.3 + 0.9 * clamp((wy - PR_WIN.y0) / 2);
  function prAO(S, X, Y, Z, nx, ny, nz, self) {
    let o = 0;
    const sph = (cx, cy, cz, r) => { const vx = cx - X, vy = cy - Y, vz = cz - Z, d2 = vx * vx + vy * vy + vz * vz, d = Math.sqrt(d2), c = (nx * vx + ny * vy + nz * vz) / d; if (c > 0) o += c * (r * r) / d2; };
    if (self !== 1) sph(S.bx, 0.42, S.bz, 0.42);
    if (self !== 2) sph(PR_TER.x, PR_TER.y, PR_TER.z, PR_TER.r);
    if (self !== 3) sph(PR_CYL.x, clamp(Y, 0.15, PR_CYL.h - 0.1), PR_CYL.z, PR_CYL.r * 1.05);
    let a = 1 - clamp(o * 1.1, 0, 0.85);
    if (self) a *= 1 - 0.55 * clamp(-ny) * Math.exp(-Y * 5);
    if (Z < PR_WZ + 0.6) a *= 1 - 0.35 * Math.exp(-(Z - PR_WZ) * 4) * (ny > 0.5 ? 1 : 0);
    if (nz > 0.5) a *= 1 - 0.4 * Math.exp(-Y * 3);
    return a;
  }
  // Diffuse light at a point: sun through the window, the window as an area light, one bounce from the sun patch, ambient.
  const PR_L = [0, 0, 0];
  function prLight(S, X, Y, Z, nx, ny, nz, self) {
    const ox = X + nx * 2e-3, oy = Y + ny * 2e-3, oz = Z + nz * 2e-3;
    let sun = 0;
    const nds = nx * PR_SUN[0] + ny * PR_SUN[1] + nz * PR_SUN[2];
    if (nds > 0 && PR_SUN[2] < 0 && oz > PR_WZ + 1e-3) {
      const s = (PR_WZ - oz) / PR_SUN[2], m = prGlass(ox + s * PR_SUN[0], oy + s * PR_SUN[1], 0.003 + 0.009 * s);
      if (m > 0) sun = nds * m * prOcc(S, ox, oy, oz, PR_SUN[0], PR_SUN[1], PR_SUN[2], 0.009, self);
    }
    let sky = 0;
    const lx = PR_WIN.mx - X, ly = PR_WIN.my - Y, lz = PR_WZ - Z, dd = lx * lx + ly * ly + lz * lz, dl = Math.sqrt(dd);
    const ndl = (nx * lx + ny * ly + nz * lz) / dl, cw = -lz / dl;
    if (ndl > 0 && cw > 0) sky = (ndl * cw * 3.2) / (dd + 0.8) * prOcc(S, ox, oy, oz, lx / dl, ly / dl, lz / dl, 0.32, self);
    let bn = 0;
    if (ny < 0.95) {
      const bx = S.bnc[0] - X, by = S.bnc[1] - Y, bz = S.bnc[2] - Z, b2 = bx * bx + by * by + bz * bz, bl = Math.sqrt(b2), nb = (nx * bx + ny * by + nz * bz) / bl;
      if (nb > 0) bn = (nb * clamp(-by / bl * 1.4 + 0.2)) / (b2 + 0.35);
    }
    const ao = prAO(S, X, Y, Z, nx, ny, nz, self), hemi = 0.6 + 0.4 * ny;
    for (let k = 0; k < 3; k++) PR_L[k] = PR_SUNC[k] * sun + PR_SKYC[k] * sky + PR_BNC[k] * bn * 0.55 * ao + PR_AMB[k] * ao * hemi * 1.6;
    S.sunv = sun;
    return PR_L;
  }
  function prWood(X, Z) {
    const plank = Math.floor((Z + 10) / 0.36), ph = hash(plank * 3.1), gx = X * (1 + ph * 0.3) + ph * 7;
    const grainv = 0.5 + 0.5 * Math.sin(Z * 70 + n2(gx * 1.4, Z * 4, 3) * 9 + ph * 20), fine = n2(gx * 9, Z * 30, 7);
    const seam = ss(0, 0.012, Math.abs(((Z + 10) / 0.36 - plank) - 0.5) * 0.36 - 0.168);
    const k = (0.75 + 0.25 * grainv) * (0.88 + 0.12 * fine) * (0.85 + 0.3 * ph) * (1 - 0.45 * seam);
    return [0.42 * k, 0.26 * k, 0.15 * k];
  }
  // Nearest hit along a ray: 1 chrome, 2 terracotta, 3 cylinder side, 6 cylinder top, 4 table, 5 wall, 0 room.
  const PR_H = { t: 0, k: 0 };
  function prHit(S, ox, oy, oz, dx, dy, dz, skip) {
    let tm = 1e9, k = 0;
    const sph = (cx, cy, cz, r, id) => {
      if (id === skip) return;
      const lx = ox - cx, ly = oy - cy, lz = oz - cz, b = lx * dx + ly * dy + lz * dz, c2 = lx * lx + ly * ly + lz * lz - r * r, disc = b * b - c2;
      if (disc > 0) { const tt = -b - Math.sqrt(disc); if (tt > 1e-4 && tt < tm) { tm = tt; k = id; } }
    };
    sph(S.bx, 0.42, S.bz, 0.42, 1);
    sph(PR_TER.x, PR_TER.y, PR_TER.z, PR_TER.r, 2);
    if (skip !== 3) {
      const C = PR_CYL, px = ox - C.x, pz = oz - C.z, a = dx * dx + dz * dz, b = px * dx + pz * dz, c2 = px * px + pz * pz - C.r * C.r, disc = b * b - a * c2;
      if (disc > 0 && a > 1e-9) {
        const tt = (-b - Math.sqrt(disc)) / a, y = oy + dy * tt;
        if (tt > 1e-4 && tt < tm && y >= 0 && y <= C.h) { tm = tt; k = 3; }
        else if (dy < 0) { const t2 = (C.h - oy) / dy, X = px + dx * t2, Z = pz + dz * t2; if (t2 > 1e-4 && t2 < tm && X * X + Z * Z <= C.r * C.r) { tm = t2; k = 6; } }
      }
    }
    if (dy < 0) { const tt = -oy / dy; if (tt > 1e-4 && tt < tm) { tm = tt; k = 4; } }
    if (dz < 0) { const tt = (PR_WZ - oz) / dz; if (tt > 1e-4 && tt < tm) { tm = tt; k = 5; } }
    PR_H.t = tm; PR_H.k = k;
    return PR_H;
  }
  // Radiance along a ray (depth 0 = camera). Writes into out[].
  const PR_TMP = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  function prRad(S, ox, oy, oz, dx, dy, dz, depth, out, skip) {
    const h = prHit(S, ox, oy, oz, dx, dy, dz, skip), k = h.k, tt = h.t;
    if (depth === 0) { S.hk = k; S.ht = tt; S.sunv = 0; }
    if (k === 0) {
      // the room behind the camera: dim, window light spilling on the left wall, a darker ceiling,
      // and the camera on its tripod, seen only in the chrome
      let g = 0.03 + 0.05 * ss(-0.1, -0.6, dx) * ss(0.7, 0.2, dy) - 0.012 * ss(0.5, 0.9, dy);
      const ce = S.toCam, cd = dx * ce[0] + dy * ce[1] + dz * ce[2];
      if (depth > 0 && cd > 0.985) g *= 0.25 + 0.75 * ss(0.995, 0.9895, cd);
      out[0] = g * 1.1; out[1] = g; out[2] = g * 0.88; return;
    }
    const X = ox + dx * tt, Y = oy + dy * tt, Z = oz + dz * tt;
    let nx = 0, ny = 1, nz = 0, alb, self = 0;
    if (k === 5) {
      const gl = prGlass(X, Y, 0.004 + tt * 0.0006);
      const fr = (X > PR_WIN.x0 - 0.07 && X < PR_WIN.x1 + 0.07 && Y > PR_WIN.y0 - 0.09 && Y < PR_WIN.y1 + 0.07) ? 1 : 0;
      if (gl > 0.001) {
        // the overexposed sky through the glass, a faint tree line low in the pane
        const tree = ss(0.02, -0.02, Y - 0.62 - 0.12 * n2(X * 3, 1, 4)) * 0.55;
        const L = prSky(Y) * (1 - tree);
        const frm = PR_L; prLight(S, X, Y, Z, 0, 0, 1, 0); const fb = (frm[0] + frm[1] + frm[2]) / 3;
        out[0] = lerp(fb * 0.9, L * 0.92, gl); out[1] = lerp(fb * 0.88, L * 1.0, gl); out[2] = lerp(fb * 0.85, L * 1.12, gl);
        if (depth === 0) S.sunv = 1;
        return;
      }
      nz = 1; ny = 0; alb = fr ? [0.86, 0.85, 0.82] : [0.62, 0.58, 0.52];
    } else if (k === 4) {
      alb = prWood(X, Z);
    } else if (k === 1 || k === 2) {
      const cx = k === 1 ? S.bx : PR_TER.x, cy = k === 1 ? 0.42 : PR_TER.y, cz = k === 1 ? S.bz : PR_TER.z, r = k === 1 ? 0.42 : PR_TER.r;
      nx = (X - cx) / r; ny = (Y - cy) / r; nz = (Z - cz) / r; self = k;
      alb = k === 1 ? [0.02, 0.02, 0.02] : (() => { const n = n2(nx * 6 + 3, ny * 6 + nz * 4, 9) * 0.25; return [0.56 - n * 0.2, 0.25 - n * 0.1, 0.14 - n * 0.05]; })();
    } else if (k === 3) {
      const l = Math.hypot(X - PR_CYL.x, Z - PR_CYL.z); nx = (X - PR_CYL.x) / l; nz = (Z - PR_CYL.z) / l; ny = 0; self = 3;
      alb = [0.8, 0.79, 0.74];
    } else { self = 3; alb = [0.8, 0.79, 0.74]; }
    const L = prLight(S, X, Y, Z, nx, ny, nz, self), sv = S.sunv;
    for (let c = 0; c < 3; c++) out[c] = alb[c] * L[c];
    const cosv = -(nx * dx + ny * dy + nz * dz), ddn = 2 * (nx * dx + ny * dy + nz * dz);
    const rx = dx - ddn * nx, ry = dy - ddn * ny, rz = dz - ddn * nz;
    const fres = Math.pow(1 - clamp(cosv), 5);
    if (k === 1) {
      // chrome: everything is reflection
      const F = [0.78 + 0.22 * fres, 0.77 + 0.23 * fres, 0.75 + 0.25 * fres];
      if (depth < 2) { const tmp = PR_TMP[depth]; prRad(S, X, Y, Z, rx, ry, rz, depth + 1, tmp, 1); for (let c = 0; c < 3; c++) out[c] = tmp[c] * F[c]; }
      else { out[0] = 0.3; out[1] = 0.28; out[2] = 0.26; }
    } else if (k === 3 || k === 6) {
      // glazed ceramic: a clear coat over the white body
      const F = 0.04 + 0.96 * fres;
      if (depth < 1) { const tmp = PR_TMP[depth]; prRad(S, X, Y, Z, rx, ry, rz, depth + 1, tmp, 3); for (let c = 0; c < 3; c++) out[c] = out[c] * (1 - F) + tmp[c] * F; }
    } else if (k === 2 || k === 4) {
      // rough terracotta sheen / varnished oak: a glossy window reflection only
      if (rz < 0) {
        const s = (PR_WZ - Z) / rz, wx = X + rx * s, wy = Y + ry * s;
        const m = prGlass(wx, wy, k === 4 ? 0.05 + s * 0.06 : 0.25), F = (k === 4 ? 0.05 : 0.03) + 0.9 * fres * (k === 4 ? 1 : 0.4);
        if (m > 0) { const vis = depth === 0 ? prOcc(S, X, Y + 1e-3, Z, rx, ry, rz, 0.08, self) : 1, L2 = prSky(wy) * m * F * vis; out[0] += L2 * 0.92; out[1] += L2; out[2] += L2 * 1.1; }
      }
    }
    if (depth === 0) S.sunv = sv;
  }
  function prScene(t) {
    const bx = prBallX(t), bz = prBallZ(t), C = prCam(t);
    // direction from the ball toward the lens, for the camera's own reflection
    const tc = [C.e[0] - bx, C.e[1] - 0.42, C.e[2] - bz], tl = Math.hypot(tc[0], tc[1], tc[2]);
    return { bx, bz, C, toCam: [tc[0] / tl, tc[1] / tl, tc[2] / tl], bnc: [-0.42, 0.02, -0.45], sunv: 0, hk: 0, ht: 0 };
  }
  // Render the low-res buffer: buckets in spiral order, progressive noise, motion blur on the moving ball.
  function prTrace(st, t) {
    const S = prScene(t), C = S.C, data = st.img.data, coc = st.coc, BW = PR_BW, BH = PR_BH, f = C.f, e = C.e, u = C.u, v = C.v, w = C.w;
    const spp = t < PR_T.b1 ? 4 : t < PR_T.conv ? 4 * Math.pow(2, Math.floor(seg(t, PR_T.b1, PR_T.conv) * 8.999)) : 0;
    const nk = spp ? 1.3 / Math.sqrt(spp) : 0, fr = Math.floor(t * 30);
    // focus: on the chrome ball, then racked back to the terracotta pot
    const dist = (x, y, z) => (x - e[0]) * w[0] + (y - e[1]) * w[1] + (z - e[2]) * w[2];
    const zf = lerp(dist(S.bx, 0.42, S.bz), dist(PR_TER.x, PR_TER.y, PR_TER.z), E.ioC(seg(t, PR_T.rack0, PR_T.rack1)));
    const aperture = 9;
    // the ball's screen box, swept over the shutter, for motion blur
    const vel = Math.hypot(prBallX(t + 0.02) - prBallX(t - 0.02), prBallZ(t + 0.02) - prBallZ(t - 0.02)) / 0.04, shutter = 1 / 24;
    let mb = null;
    if (vel > 0.02) {
      const pr = (x, z) => { const dx = x - e[0], dy = 0.42 - e[1], dz = z - e[2], Z = dx * w[0] + dy * w[1] + dz * w[2]; return [BW / 2 + f * (dx * u[0] + dy * u[1] + dz * u[2]) / Z, BH / 2 - f * (dx * v[0] + dy * v[1] + dz * v[2]) / Z, f * 0.42 / Z]; };
      const a = pr(prBallX(t - shutter / 2), prBallZ(t - shutter / 2)), b = pr(prBallX(t + shutter / 2), prBallZ(t + shutter / 2)), rr = Math.max(a[2], b[2]) * 1.15 + 2;
      mb = [Math.min(a[0], b[0]) - rr, Math.max(a[0], b[0]) + rr, Math.min(a[1], b[1]) - rr, Math.max(a[1], b[1]) + rr];
    }
    const out = [0, 0, 0], acc = [0, 0, 0];
    for (let py = 0; py < BH; py++) {
      const sy = BH / 2 - py - 0.5, bj = (py / PR_BK) | 0, ry = py - bj * PR_BK;
      for (let px = 0; px < BW; px++) {
        const idx = (py * BW + px) * 4;
        if (t < PR_T.b1) {
          const bi = st.border[bj * (BW / PR_BK) + ((px / PR_BK) | 0)], done = PR_T.b0 + bi * st.bstep;
          // not yet reached, or this bucket's scanline hasn't been drawn
          if (t < done - st.bdur || (t < done && ry > ((t - done + st.bdur) / st.bdur) * PR_BK)) { data[idx] = data[idx + 1] = data[idx + 2] = 12; data[idx + 3] = 255; coc[py * BW + px] = 0; continue; }
        }
        const sx = px + 0.5 - BW / 2;
        let dx = u[0] * sx + v[0] * sy + w[0] * f, dy = u[1] * sx + v[1] * sy + w[1] * f, dz = u[2] * sx + v[2] * sy + w[2] * f;
        const dl = 1 / Math.sqrt(dx * dx + dy * dy + dz * dz); dx *= dl; dy *= dl; dz *= dl;
        let R, G, B, sv, ht;
        if (mb && px >= mb[0] && px <= mb[1] && py >= mb[2] && py <= mb[3]) {
          acc[0] = acc[1] = acc[2] = 0; sv = 0; ht = 0;
          const j = hash(px * 1.31 + py * 7.7 + fr * 0.17);
          for (let s = 0; s < 4; s++) {
            const ts = t + ((s + j) / 4 - 0.5) * shutter;
            S.bx = prBallX(ts); S.bz = prBallZ(ts);
            prRad(S, e[0], e[1], e[2], dx, dy, dz, 0, out, 0);
            acc[0] += out[0]; acc[1] += out[1]; acc[2] += out[2]; sv += S.sunv; ht += S.ht;
          }
          S.bx = prBallX(t); S.bz = prBallZ(t);
          R = acc[0] / 4; G = acc[1] / 4; B = acc[2] / 4; sv /= 4; ht /= 4;
        } else {
          prRad(S, e[0], e[1], e[2], dx, dy, dz, 0, out, 0);
          R = out[0]; G = out[1]; B = out[2]; sv = S.sunv; ht = S.ht;
        }
        if (nk > 0) {
          // Monte Carlo speckle: worst where the light is indirect, with the odd firefly
          const hs = px * 12.9898 + py * 78.233 + fr * 37.719, a = nk * (0.35 + 1.4 * (1 - clamp(sv)));
          const hl = hash(hs) - 0.5, kR = 1 + a * (hl * 2.2 + (hash(hs + 1.7) - 0.5) * 0.9), kG = 1 + a * (hl * 2.2 + (hash(hs + 3.1) - 0.5) * 0.9), kB = 1 + a * (hl * 2.2 + (hash(hs + 5.3) - 0.5) * 0.9);
          R *= Math.max(0, kR); G *= Math.max(0, kG); B *= Math.max(0, kB);
          if (hash(hs + 9.9) > 1 - 0.006 * nk) { R += 6; G += 5.5; B += 5; }
        }
        data[idx] = prTM(R); data[idx + 1] = prTM(G); data[idx + 2] = prTM(B); data[idx + 3] = 255;
        const z = ht * (dx * w[0] + dy * w[1] + dz * w[2]);
        coc[py * BW + px] = ht > 1e8 ? aperture : aperture * Math.abs(1 - zf / Math.max(0.3, z));
      }
    }
    st.bctx.putImageData(st.img, 0, 0);
    return S;
  }
  // Depth of field: blend between three blurred copies by circle of confusion.
  function prDOF(st) {
    const lv = [1.4, 3.2, 7], ims = lv.map((r, i) => { const g = st.blC[i]; g.filter = `blur(${r}px)`; g.clearRect(0, 0, PR_BW, PR_BH); g.drawImage(st.buf, 0, 0); g.filter = 'none'; return g.getImageData(0, 0, PR_BW, PR_BH).data; });
    const s = st.img.data, o = st.img2.data, coc = st.coc, br = [0, 0.8, 2.2, 4.8, 9.5];
    for (let i = 0, p = 0; p < coc.length; p++, i += 4) {
      const k = coc[p];
      let a = s, b = ims[0], m = 0;
      if (k <= br[1]) { m = 0; }
      else if (k < br[2]) { m = (k - br[1]) / (br[2] - br[1]); }
      else if (k < br[3]) { a = ims[0]; b = ims[1]; m = (k - br[2]) / (br[3] - br[2]); }
      else { a = ims[1]; b = ims[2]; m = clamp((k - br[3]) / (br[4] - br[3])); }
      o[i] = a[i] + (b[i] - a[i]) * m; o[i + 1] = a[i + 1] + (b[i + 1] - a[i + 1]) * m; o[i + 2] = a[i + 2] + (b[i + 2] - a[i + 2]) * m; o[i + 3] = 255;
    }
    st.octx.putImageData(st.img2, 0, 0);
  }
  function prHUD(c, t, st) {
    const a = seg(t, 0.15, 0.4) * (1 - seg(t, PR_T.conv, PR_T.film));
    if (a <= 0) return;
    const nb = st.order.length, done = clamp(Math.floor((t - PR_T.b0) / st.bstep) + 1, 0, nb);
    const spp = t < PR_T.b1 ? 4 : 4 * Math.pow(2, Math.floor(seg(t, PR_T.b1, PR_T.conv) * 8.999));
    const el = t * 41.3, mm = Math.floor(el / 60), s2 = Math.floor(el % 60);
    c.save(); c.globalAlpha = a;
    c.fillStyle = 'rgba(10,10,12,0.72)'; c.fillRect(56, 56, 560, 150);
    text(c, 'PATH TRACER  ·  STILL_LIFE_v012.exr', 80, 92, { font: PR_F.mono, weight: 500, size: 20, color: PR.ink, ls: 1 });
    text(c, t < PR_T.b1 ? `BUCKETS  ${String(done).padStart(3, '0')} / ${nb}` : t < PR_T.conv ? 'PROGRESSIVE REFINE' : 'CONVERGED', 80, 130, { font: PR_F.mono, size: 20, color: PR.dim, ls: 1 });
    text(c, `SAMPLES  ${spp} spp     GI  6 bounces`, 80, 160, { font: PR_F.mono, size: 20, color: PR.dim, ls: 1 });
    text(c, `ELAPSED  00:${String(mm).padStart(2, '0')}:${String(s2).padStart(2, '0')}     DOF  f/2.0`, 80, 190, { font: PR_F.mono, size: 20, color: PR.dim, ls: 1 });
    // progress along the bottom
    const p = t < PR_T.b1 ? 0.5 * done / nb : 0.5 + 0.5 * seg(t, PR_T.b1, PR_T.conv);
    c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(56, 1022, 1808, 4);
    c.fillStyle = PR.accent; c.fillRect(56, 1022, 1808 * p, 4);
    // active buckets: corner brackets, render-view style
    if (t < PR_T.b1 + 0.05) {
      const S = 1920 / PR_BW, B = PR_BK * S;
      c.strokeStyle = PR.accent; c.lineWidth = 2;
      st.order.forEach((bk, i) => {
        const dn = PR_T.b0 + i * st.bstep;
        if (t < dn - st.bdur || t >= dn) return;
        const x = bk[0] * B, y = bk[1] * B, L = 18;
        c.beginPath();
        c.moveTo(x, y + L); c.lineTo(x, y); c.lineTo(x + L, y); c.moveTo(x + B - L, y); c.lineTo(x + B, y); c.lineTo(x + B, y + L);
        c.moveTo(x + B, y + B - L); c.lineTo(x + B, y + B); c.lineTo(x + B - L, y + B); c.moveTo(x + L, y + B); c.lineTo(x, y + B); c.lineTo(x, y + B - L);
        c.stroke();
      });
    }
    c.restore();
  }

  MG.film({
    id: 'photoreal', dur: 10, poster: 9.4,
    fonts: [['200 120px Inter', 'Photoreal CGI'], ['500 22px "IBM Plex Mono"', 'PATHTRACERSTILL_LIFEv012.exrBUCKETSPROGRESSIVEREFINECONVERGEDSAMPLESGIDOFf/0123456789·'], ['400 22px "IBM Plex Mono"', 'LIGHT, SIMULATED']],
    meta: {
      family: 'D', name: 'Photoreal CGI', sub: 'Light, Simulated', era: '1993 —',
      origin: 'Computer imagery made to be mistaken for photography: physically based materials lit by simulated light, with global illumination, soft shadows, depth of field and motion blur from a virtual camera. ILM’s T. rex in Jurassic Park (1993) made it a blockbuster tool, Pixar’s RenderMan rendered a generation of effects films, and path tracers (Arnold, RenderMan RIS, Cycles) made physically correct light the default in the 2010s; Alex Roman’s The Third & The Seventh (2009) showed one artist could make architecture indistinguishable from film.',
      works: 'The Road to Point Reyes (Lucasfilm Computer Division, 1983) · Jurassic Park (Steven Spielberg; ILM, 1993) · RenderMan (Pixar, 1988 —) · The Third & The Seventh (Alex Roman, 2009) · Gravity (Alfonso Cuarón; Framestore, 2013)',
      tech: ['Ray-traced soft shadows + one-bounce GI', 'Bucket and progressive render passes', 'Depth of field + motion blur'],
      accent: PR.accent,
      motionDNA: 'The camera behaves like a real one: a slow dolly and a measured focus pull, a 180°-ish shutter that smears only what moves, nothing faster than physics allows; the reveal is the render itself — buckets spiralling out, then noise resolving into light as samples double.',
      visualDNA: 'A quiet still life under a window: a hard window-shaped sun patch with muntin shadows on oak, soft skylight, warm bounce light bleeding up the wall, a chrome sphere mirroring the room, glazed and terracotta ceramics with Fresnel sheen, filmic tonemapping, shallow depth of field, bloom, vignette and grain, scope letterbox.',
      transitions: 'Render-view to film: the HUD and bucket brackets fade as the image converges, scope bars slide in and the shot starts to move',
      implementation: ['Pixar RenderMan / Arnold / V-Ray / Cycles path tracing with PBR shaders', 'Compositing in Nuke: lens distortion, DOF, motion blur, grain matching', 'Canvas 2D: a 640×360 ray tracer (analytic sphere and cylinder hits, window-masked sun, soft occlusion, chrome and clear-coat reflection rays, ACES tonemap) upscaled, with depth-blended blur for DOF and stochastic shutter samples for motion blur'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const buf = offscreen(PR_BW, PR_BH), bctx = buf.getContext('2d'), out = offscreen(PR_BW, PR_BH), octx = out.getContext('2d');
      const bl = [0, 1, 2].map(() => offscreen(PR_BW, PR_BH)), blC = bl.map(b => b.getContext('2d', { willReadFrequently: true }));
      const nx = PR_BW / PR_BK, ny = PR_BH / PR_BK, order = [];
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) order.push([i, j, Math.hypot(i + 0.5 - nx / 2, (j + 0.5 - ny / 2) * 1.0), Math.atan2(j + 0.5 - ny / 2, i + 0.5 - nx / 2)]);
      order.sort((a, b) => (Math.round(a[2] * 1.2) - Math.round(b[2] * 1.2)) || (a[3] - b[3]));
      const border = new Int16Array(nx * ny); order.forEach((b, i) => (border[b[1] * nx + b[0]] = i));
      const bstep = (PR_T.b1 - 0.15 - PR_T.b0) / order.length;
      const bloom = offscreen(320, 180);
      return { buf, bctx, out, octx, blC, img: bctx.createImageData(PR_BW, PR_BH), img2: octx.createImageData(PR_BW, PR_BH), coc: new Float32Array(PR_BW * PR_BH), order, border, bstep, bdur: bstep * 8, bloom, bloomC: bloom.getContext('2d') };
    },
    draw(c, t, W, H, st) {
      prTrace(st, t);
      prDOF(st);
      c.fillStyle = '#0c0c0c'; c.fillRect(0, 0, W, H);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(st.out, 0, 0, W, H);
      // bloom: highlights spread through the lens
      const bc = st.bloomC; bc.clearRect(0, 0, 320, 180); bc.filter = 'brightness(0.9) contrast(3.2) blur(7px)'; bc.drawImage(st.out, 0, 0, 320, 180); bc.filter = 'none';
      c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.32; c.drawImage(st.bloom, 0, 0, W, H); c.restore();
      // lens: gentle halation off the window and a vignette
      vignette(c, W, H, 0.42);
      grain(c, W, H, t, 0.055, 'overlay');
      // scope letterbox once it becomes a shot
      const lb = E.ioC(seg(t, PR_T.film - 0.1, PR_T.film + 0.6)) * 138;
      if (lb > 0) { c.fillStyle = '#000'; c.fillRect(0, 0, W, lb); c.fillRect(0, H - lb, W, lb); }
      prHUD(c, t, st);
      if (t > PR_T.film) {
        const a = seg(t, PR_T.film, PR_T.film + 0.4) * (1 - seg(t, PR_T.title - 0.3, PR_T.title));
        c.save(); c.globalAlpha = a * 0.75;
        text(c, 'SC 04  ·  TK 2  ·  35 MM  ·  T2.0', 80, 112, { font: PR_F.mono, size: 20, color: PR.ink, ls: 3 });
        text(c, t < PR_T.rack0 ? 'FOCUS  CHROME' : t < PR_T.rack1 ? 'FOCUS  PULL' : 'FOCUS  TERRACOTTA', 1840, 112, { font: PR_F.mono, size: 20, color: PR.ink, ls: 3, align: 'right' });
        c.restore();
      }
      if (t > PR_T.title) {
        const u = E.outC(seg(t, PR_T.title, PR_T.title + 1.0)), u2 = E.outC(seg(t, PR_T.sub, PR_T.sub + 0.7));
        c.save();
        c.globalAlpha = u;
        text(c, 'Photoreal CGI', 960, 1010 + (1 - u) * 10, { font: PR_F.thin, weight: 200, size: 72, color: PR.ink, align: 'center', ls: 14 });
        c.globalAlpha = u2;
        text(c, 'LIGHT, SIMULATED', 960, 72, { font: PR_F.mono, size: 22, color: PR.accent, align: 'center', ls: 10 });
        c.restore();
      }
    },
    score(A) {
      A.bus.gain.value = 1.1;
      const T = PR_T;
      // the render farm: a fan bed and data ticks as buckets finish
      A.noise(0, { type: 'lowpass', f: 900, dur: T.film + 0.2, g: 0.035, a: 0.3, hold: true, rel: 0.4 });
      A.osc(0, { f: 120, dur: T.film, g: 0.012, a: 0.4, hold: true, rel: 0.3 });
      for (let k = 0; k < 36; k++) { const tt = T.b0 + k * (T.b1 - T.b0) / 36; A.osc(tt, { type: 'square', f: 2400 + hash(k) * 1600, dur: 0.012, g: 0.012, lp: 5000, pan: (hash(k * 3) - 0.5) * 0.8 }); }
      // progressive passes: a soft blip per doubling, climbing
      for (let k = 0; k < 9; k++) A.bell(T.b1 + k * (T.conv - T.b1) / 9, midi(72 + [0, 2, 4, 7, 9, 12, 14, 16, 19][k]), { g: 0.018, dur: 0.6, ratios: [1, 2.01], rev: 0.4, pan: (k % 2 ? 0.3 : -0.3) });
      A.chord(T.b1, [50, 57, 62, 66], { type: 'sine', dur: T.conv - T.b1 + 0.4, g: 0.03, a: 1.4, hold: true, rel: 0.5, spread: 3, width: 0.8, rev: 0.6 });
      // converged: a low swell into the shot
      A.riser(T.conv - 1.0, 1.0, { g: 0.05, f: 110 });
      A.impact(T.film, 0.32, { rev: 0.7 });
      // film: a sparse piano over sustained strings, D major
      [[T.film, [38, 45, 50, 54, 57]], [7.0, [35, 47, 54, 57, 62]], [8.3, [43, 50, 55, 59, 62, 66]]].forEach(([tt, ch], i, arr) => {
        const d = (arr[i + 1] ? arr[i + 1][0] : 10.3) - tt;
        A.chord(tt, ch, { type: 'sawtooth', dur: d + 0.3, g: 0.014, a: 0.8, hold: true, rel: 0.8, lp: 900, spread: 7, width: 0.9, rev: 0.6 });
      });
      [[4.75, 74], [5.35, 69], [5.95, 78], [6.55, 76], [7.15, 74], [7.75, 71], [8.4, 74], [8.85, 79], [9.3, 78]].forEach(([tt, m], i) => A.pluck(tt, midi(m), { g: 0.13, dur: 2.2, bright: 0.25, decay: 0.997, lp: 2400, rev: 0.6, pan: (i % 3 - 1) * 0.25 }));
      // the ball rolling on oak: a low rumble that follows its speed
      for (let k = 0; k < 12; k++) { const tt = T.roll0 + k * 0.25, sp = Math.sin(PI * clamp((tt - T.roll0) / (T.roll1 - T.roll0))); A.noise(tt, { type: 'lowpass', f: 220 + 200 * sp, dur: 0.3, g: 0.07 * sp, a: 0.1, hold: true, rel: 0.12 }); }
      // focus pull: a lens servo whirr
      A.osc(T.rack0, { type: 'triangle', f: 900, f2: 1300, glide: T.rack1 - T.rack0, dur: T.rack1 - T.rack0, g: 0.008, a: 0.2, hold: true, rel: 0.2, lp: 2000 });
      [86, 90, 93].forEach((m, i) => A.bell(T.title + 0.1 + i * 0.1, midi(m), { g: 0.025, dur: 1.6, rev: 0.6, pan: (i - 1) * 0.3 }));
    },
  });
})();
