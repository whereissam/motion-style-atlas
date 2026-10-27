/* batch f2 — Typography & Screen: Typewriter · Text-on-Path · Screensaver.
   Typed slugs on bond paper, letters riding curves, and the idle screens of the 1990s CRT. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, rrect, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Special+Elite&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Bricolage+Grotesque:wght@400;800&family=Fraunces:ital,wght@1,600&family=Exo+2:ital,wght@1,900&family=VT323&family=Caveat:wght@600&display=block');
  const PI = Math.PI;

  // Shared: smooth value-noise lattice for baked textures.
  function lattice(r, w, h) {
    const lat = new Float32Array((w + 2) * (h + 2));
    for (let i = 0; i < lat.length; i++) lat[i] = r();
    return (x, y) => {
      const xi = Math.floor(x) % w, yi = Math.floor(y) % h, fx = x - Math.floor(x), fy = y - Math.floor(y), W2 = w + 2, i = yi * W2 + xi;
      const a = lat[i], b = lat[i + 1], c = lat[i + W2], d = lat[i + W2 + 1];
      const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }

  /* =====================================================================
     TYPEWRITER — macro on the strike point of a front-strike machine:
     slugs hit the ribbon, the carriage steps a pitch per key, the bell
     warns of the margin, a typo is x-ed out; the camera pulls back to the
     whole machine, a red slug strikes, and we dive into that letter to
     become a typed-on title card
     ===================================================================== */
  const TW = { pitch: 10, ls: 16.67, fs: 17.5, ml: 110, top: 150, pw: 850 };
  const TWC = { paper: '#efe7d3', ink: '28,25,30', red: '168,30,26', wall: '#17110d', enamel: '#121014' };
  const TWF = '"Special Elite", "Courier Prime", monospace', TWM = '"Courier Prime", "Courier New", monospace';
  const TW_T = { pull: 5.72, pullEnd: 6.36, red: 6.5, dive: 6.66, stage: 7.1 };

  // The keystroke script: every strike, space, backspace and return with its time.
  const TW_S = (() => {
    const r = rng(1874), ev = [], colM = [], lineM = [];
    let col = 0, line = 0;
    const type = (s, t0, t1, o = {}) => {
      const chars = [...s], w = chars.map(ch => (0.5 + r() * 1.0) * (ch === ' ' ? 1.35 : 1));
      const sum = w.slice(0, -1).reduce((a, b) => a + b, 0) || 1;
      let acc = 0;
      chars.forEach((ch, i) => {
        const te = t0 + (t1 - t0) * acc / sum; acc += w[i];
        ev.push(ch === ' ' ? { k: 'sp', t: te } : { k: 'ch', ch, t: te, line, col, red: !!o.red, j: r() });
        if (o.bell === col) ev.push({ k: 'bell', t: te + 0.012 });
        colM.push([te + 0.004, te + 0.03, col, col + 1, E.outQ]); col++;
      });
    };
    const bs = (n, t0, dt) => { for (let i = 0; i < n; i++) { const te = t0 + i * dt; ev.push({ k: 'bs', t: te }); colM.push([te, te + 0.04, col, col - 1, E.outQ]); col--; } };
    const cr = (te, n) => {
      ev.push({ k: 'cr', t: te, n, from: col });
      lineM.push([te, te + 0.12, line, line + n, E.outQ]);
      colM.push([te + 0.07, te + 0.4, col, 0, E.outC]); col = 0; line += n;
    };
    type('The quick brown fox jumps over the lazy dog.', 0.55, 2.72, { bell: 36 });
    cr(2.86, 1);
    type('Each word, one key at a tiem', 3.38, 4.56);
    bs(4, 4.68, 0.075);
    type('xxxx', 4.99, 5.2);
    type(' time.', 5.27, 5.5);
    cr(5.62, 2);
    type('T', TW_T.red, TW_T.red, { red: true });
    return { ev, colM, lineM, strikes: ev.filter(e => e.k === 'ch' || e.k === 'sp') };
  })();
  const twMove = (M, t, v0) => {
    let v = v0;
    for (const [a, b, f, to, e] of M) { if (t <= a) return v; if (t < b) return lerp(f, to, e((t - a) / (b - a))); v = to; }
    return v;
  };

  // Title card typed after the dive: letters, positions and strike times (laid out on first draw).
  const TW_TITLE = 'Typewriter', TW_AN = 'ANIMATION', TW_SUB = '— one keystroke at a time —';
  function twLayout(c) {
    const L = { a: [], b: [], s: [] };
    c.font = `400 250px ${TWF}`;
    const wA = [...TW_TITLE].map(ch => c.measureText(ch).width), WA = wA.reduce((a, b) => a + b, 0);
    let x = 960 - WA / 2;
    [...TW_TITLE].forEach((ch, i) => {
      L.a.push({ ch, x: x + wA[i] / 2, y: 500, t: i === 0 ? TW_T.red : 7.2 + (i - 1) * 0.083, j: i === 0 ? TW_S.ev.find(e => e.red).j : hash(i * 7.7) });
      x += wA[i];
    });
    c.font = `700 86px ${TWM}`;
    const wB = [...TW_AN].map(ch => c.measureText(ch).width + 30), WB = wB.reduce((a, b) => a + b, 0) - 30;
    x = 960 - WB / 2;
    [...TW_AN].forEach((ch, i) => { L.b.push({ ch, x: x + (wB[i] - 30) / 2, y: 655, t: 8.16 + i * 0.068, j: hash(i * 3.3 + 1) }); x += wB[i]; });
    c.font = `italic 400 38px ${TWM}`;
    const wS = [...TW_SUB].map(ch => c.measureText(ch).width + 2), WS = wS.reduce((a, b) => a + b, 0);
    x = 960 - WS / 2;
    [...TW_SUB].forEach((ch, i) => { L.s.push({ ch, x: x + wS[i] / 2, y: 770, t: 8.84 + i * 0.021, j: hash(i * 5.1 + 2) }); x += wS[i]; });
    return L;
  }

  // One slug impression: per-character misalignment (the same slug is always off the same way),
  // uneven pressure across the face, and a squeezed-out ink rim on fresh strikes.
  function twSlug(g, ch, x, y, size, j, rgb, age, font) {
    const code = ch.charCodeAt(0), h1 = hash(code * 1.37), h2 = hash(code * 4.11 + 2), h3 = hash(code * 0.71 + j * 9.3);
    const dy = ((h1 - 0.5) * 0.08 + (j - 0.5) * 0.03) * size, rot = (h2 - 0.5) * 0.05 + (j - 0.5) * 0.025;
    const a = 0.8 + 0.2 * j, fresh = Math.exp(-Math.max(0, age) * 28);
    g.save(); g.translate(x, y + dy); g.rotate(rot);
    if (fresh > 0.02) g.scale(1 + 0.05 * fresh, 1 + 0.05 * fresh);
    g.font = font; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const s = h3 < 0.5 ? 1 : -1;
    const gr = g.createLinearGradient(-size * 0.3 * s, -size * 0.7, size * 0.3 * s, size * 0.05);
    gr.addColorStop(0, `rgba(${rgb},${a * (0.42 + 0.4 * h3)})`); gr.addColorStop(1, `rgba(${rgb},${a})`);
    g.fillStyle = gr; g.fillText(ch, 0, 0);
    g.globalAlpha = 0.22 + 0.4 * fresh; g.fillStyle = `rgb(${rgb})`; g.fillText(ch, size * 0.012, size * 0.01);
    g.restore();
  }
  const twChrome = (g, y0, y1) => {
    const gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, '#f6f3ec'); gr.addColorStop(0.3, '#a3a1a0'); gr.addColorStop(0.55, '#e0ddd7'); gr.addColorStop(1, '#4a484b');
    return gr;
  };
  const TW_KEYS = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL;', 'ZXCVBNM,./'];
  const twKeyPos = ch => {
    const u = ch.toUpperCase();
    for (let r = 0; r < 4; r++) { const i = TW_KEYS[r].indexOf(u); if (i >= 0) return [(i - 4.5) * 78 + r * 16 - 20, 400 + r * 68]; }
    return null;
  };

  // Everything behind the paper's ink: wall, desk, paper table, platen, the sheet itself.
  function twBack(g, PL, PT, st) {
    g.fillStyle = TWC.wall; g.fillRect(-4000, -3000, 8000, 3760);
    const wd = g.createLinearGradient(0, 740, 0, 1300); wd.addColorStop(0, '#4a2e1b'); wd.addColorStop(1, '#1d120a');
    g.fillStyle = wd; g.fillRect(-4000, 740, 8000, 2000);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.beginPath(); g.ellipse(0, 760, 760, 46, 0, 0, TAU); g.fill();
    // paper table behind the sheet
    const tb = g.createLinearGradient(0, -180, 0, -30); tb.addColorStop(0, '#0e0d10'); tb.addColorStop(1, '#2b292e');
    g.fillStyle = tb; g.fillRect(PL - 70, -180, TW.pw + 140, 150);
    g.fillStyle = twChrome(g, -184, -176); g.fillRect(PL - 70, -184, TW.pw + 140, 8);
    // platen: hard black rubber cylinder
    const pg = g.createLinearGradient(0, -34, 0, 34);
    pg.addColorStop(0, '#050506'); pg.addColorStop(0.3, '#3a393d'); pg.addColorStop(0.45, '#1a191c'); pg.addColorStop(1, '#030304');
    g.fillStyle = pg; g.fillRect(PL - 120, -34, TW.pw + 240, 68);
    // platen knobs, knurled
    [PL - 170, PL + TW.pw + 120].forEach(x => {
      g.fillStyle = '#0b0a0c'; rrect(g, x, -56, 50, 112, 10); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.13)'; g.lineWidth = 1.5;
      for (let y = -50; y < 54; y += 6) { g.beginPath(); g.moveTo(x + 4, y); g.lineTo(x + 46, y); g.stroke(); }
      g.fillStyle = twChrome(g, -20, 20); g.fillRect(x + (x < PL ? 50 : -18), -16, 18, 32);
    });
    // carriage-return lever
    g.strokeStyle = twChrome(g, -170, -40); g.lineWidth = 14; g.lineCap = 'round';
    g.beginPath(); g.moveTo(PL - 150, -40); g.quadraticCurveTo(PL - 200, -110, PL - 300, -150); g.stroke();
    g.fillStyle = twChrome(g, -170, -130); rrect(g, PL - 350, -170, 70, 34, 12); g.fill();
    // the sheet, curling over the platen
    g.save();
    g.beginPath(); g.rect(PL, PT, TW.pw, 34 - PT); g.clip();
    g.fillStyle = TWC.paper; g.fillRect(PL, PT, TW.pw, 34 - PT);
    if (st.fibP) { g.save(); g.translate(PL, PT); g.fillStyle = st.fibP; g.globalAlpha = 0.5; g.fillRect(0, 0, TW.pw, 34 - PT); g.restore(); }
    const sh = g.createLinearGradient(0, -40, 0, 34); sh.addColorStop(0, 'rgba(60,40,20,0)'); sh.addColorStop(0.55, 'rgba(60,40,20,0.06)'); sh.addColorStop(1, 'rgba(30,20,10,0.45)');
    g.fillStyle = sh; g.fillRect(PL, -40, TW.pw, 74);
    const tp = g.createLinearGradient(0, PT, 0, PT + 120); tp.addColorStop(0, 'rgba(40,28,15,0.28)'); tp.addColorStop(1, 'rgba(40,28,15,0)');
    g.fillStyle = tp; g.fillRect(PL, PT, TW.pw, 120);
    const sd = g.createLinearGradient(PL, 0, PL + 40, 0); sd.addColorStop(0, 'rgba(40,28,15,0.18)'); sd.addColorStop(1, 'rgba(40,28,15,0)');
    g.fillStyle = sd; g.fillRect(PL, PT, 40, 34 - PT);
    g.restore();
  }

  // Everything in front of the ink: bail, scale, body, typebar basket, ribbon, type guide, keys.
  function twFront(g, t, PL, fade) {
    // paper bail and rollers
    g.fillStyle = twChrome(g, -66, -58); g.fillRect(PL - 90, -66, TW.pw + 180, 8);
    [PL + 190, PL + 660].forEach(x => { g.fillStyle = '#141215'; rrect(g, x - 24, -70, 48, 16, 6); g.fill(); g.fillStyle = 'rgba(255,255,255,0.15)'; g.fillRect(x - 20, -68, 40, 3); });
    // carriage scale
    g.fillStyle = twChrome(g, 34, 48); g.fillRect(PL - 70, 34, TW.pw + 140, 14);
    g.fillStyle = '#2a2628'; g.font = `700 6px ${TWM}`; g.textAlign = 'center';
    for (let k = 0; k <= 80; k++) {
      const x = PL + TW.ml + k * TW.pitch;
      g.fillRect(x - 0.4, 34, 0.8, k % 5 ? 3 : 5);
      if (k % 10 === 0) g.fillText(String(k), x, 46);
    }
    // body: black enamel with a gold pinstripe
    g.save(); g.globalAlpha = fade;
    const body = () => { g.beginPath(); g.moveTo(-620, 50); g.lineTo(620, 50); g.quadraticCurveTo(660, 52, 664, 110); g.lineTo(700, 720); g.lineTo(-700, 720); g.lineTo(-664, 110); g.quadraticCurveTo(-660, 52, -620, 50); g.closePath(); };
    const bg = g.createLinearGradient(0, 50, 0, 720); bg.addColorStop(0, '#2a272c'); bg.addColorStop(0.08, TWC.enamel); bg.addColorStop(1, '#060507');
    body(); g.fillStyle = bg; g.fill();
    g.strokeStyle = 'rgba(214,170,80,0.75)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(-600, 68); g.lineTo(600, 68); g.lineTo(640, 700); g.lineTo(-640, 700); g.closePath(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.06)'; g.beginPath(); g.ellipse(-300, 120, 260, 18, -0.02, 0, TAU); g.fill();
    // ribbon spools
    [-380, 380].forEach(x => {
      g.fillStyle = twChrome(g, 52, 84); g.beginPath(); g.ellipse(x, 68, 80, 18, 0, 0, TAU); g.fill();
      g.fillStyle = '#100d0f'; g.beginPath(); g.ellipse(x, 64, 56, 11, 0, 0, TAU); g.fill();
      g.fillStyle = '#6b1714'; g.beginPath(); g.ellipse(x, 64, 56, 11, 0, 0, PI); g.fill();
    });
    // typebar basket
    g.fillStyle = '#060506';
    g.beginPath(); g.arc(0, 40, 300, 0.08 * PI, 0.92 * PI); g.arc(0, 40, 64, 0.92 * PI, 0.08 * PI, true); g.closePath(); g.fill();
    const NB = 40;
    for (let i = 0; i < NB; i++) {
      const a = lerp(0.13 * PI, 0.87 * PI, i / (NB - 1)), ca = Math.cos(a), sa = Math.sin(a);
      g.strokeStyle = 'rgba(190,188,184,0.55)'; g.lineWidth = 3.2;
      g.beginPath(); g.moveTo(ca * 100, 40 + sa * 100); g.lineTo(ca * 276, 40 + sa * 276); g.stroke();
      g.fillStyle = '#2b2a2d'; g.save(); g.translate(ca * 280, 40 + sa * 280); g.rotate(a); g.fillRect(-6, -5, 12, 10); g.restore();
    }
    g.strokeStyle = twChrome(g, 120, 160); g.lineWidth = 12;
    g.beginPath(); g.arc(0, 40, 100, 0.1 * PI, 0.9 * PI); g.stroke();
    // keyboard: glass-topped round keys in chrome rings
    TW_KEYS.forEach((row, r) => [...row].forEach((ch, i) => {
      const x = (i - 4.5) * 78 + r * 16 - 20, y = 400 + r * 68;
      const p = twPress(t, ch), yy = y + p * 7;
      g.fillStyle = 'rgba(0,0,0,0.6)'; g.beginPath(); g.ellipse(x, y + 26, 26, 8, 0, 0, TAU); g.fill();
      g.strokeStyle = '#8b8a8c'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, yy + 10); g.lineTo(x, y + 26); g.stroke();
      g.fillStyle = twChrome(g, yy - 27, yy + 27); g.beginPath(); g.arc(x, yy, 27, 0, TAU); g.fill();
      const kg = g.createRadialGradient(x - 8, yy - 10, 2, x, yy, 23); kg.addColorStop(0, '#3a383c'); kg.addColorStop(1, '#080709');
      g.fillStyle = kg; g.beginPath(); g.arc(x, yy, 22, 0, TAU); g.fill();
      g.fillStyle = '#f1ece0'; g.font = `700 22px ${TWM}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, x, yy + 1);
      g.textBaseline = 'alphabetic';
    }));
    const sp = twPress(t, ' ');
    g.fillStyle = twChrome(g, 640 + sp * 6, 664 + sp * 6); rrect(g, -240, 640 + sp * 6, 480, 24, 12); g.fill();
    g.restore();
    // the striking typebar (behind the ribbon)
    const ev = TW_S.strikes.find(e => e.k === 'ch' && t > e.t - 0.04 && t < e.t + 0.06);
    if (ev) {
      const a = lerp(0.13 * PI, 0.87 * PI, hash(ev.ch.charCodeAt(0) * 0.37)), ca = Math.cos(a), sa = Math.sin(a);
      const u = t < ev.t ? E.inQ(seg(t, ev.t - 0.04, ev.t)) : 1 - E.outQ(seg(t, ev.t, ev.t + 0.06));
      const piv = [ca * 100, 40 + sa * 100], rest = [ca * 276, 40 + sa * 276], tip = [lerp(rest[0], 0, u), lerp(rest[1], 6, u)];
      g.strokeStyle = '#d8d6d2'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(piv[0], piv[1]); g.quadraticCurveTo(lerp(piv[0], tip[0], 0.5) + ca * 30 * u, lerp(piv[1], tip[1], 0.5), tip[0], tip[1]); g.stroke();
      g.fillStyle = '#3a383b'; g.fillRect(tip[0] - 7, tip[1] - 2, 14, 12);
    }
    // ribbon: black over red, lifted by the vibrator on each strike
    let lift = 0, red = false;
    for (const e of TW_S.strikes) {
      if (e.k !== 'ch') continue;
      if (t > e.t - 0.035 && t < e.t + 0.07) { lift = t < e.t ? E.outQ(seg(t, e.t - 0.035, e.t)) : 1 - E.inQ(seg(t, e.t, e.t + 0.07)); red = e.red; }
    }
    const ly = lift * (red ? 30 : 20);
    const ribbon = (y0, col) => {
      g.fillStyle = col; g.beginPath();
      g.moveTo(-380, 58 + y0); g.lineTo(-60, 12 + y0); g.lineTo(-24, 12 + y0 - ly); g.lineTo(24, 12 + y0 - ly); g.lineTo(60, 12 + y0); g.lineTo(380, 58 + y0);
      g.lineTo(380, 63 + y0); g.lineTo(60, 17 + y0); g.lineTo(24, 17 + y0 - ly); g.lineTo(-24, 17 + y0 - ly); g.lineTo(-60, 17 + y0); g.lineTo(-380, 63 + y0); g.closePath(); g.fill();
    };
    ribbon(0, '#151214'); ribbon(5, '#7a1814');
    // type guide: the chrome fork that centres every slug
    g.fillStyle = twChrome(g, 0, 34);
    g.beginPath(); g.moveTo(-30, 34); g.lineTo(-30, 22); g.lineTo(-11, 22); g.lineTo(-7, 4); g.lineTo(-3, 4); g.lineTo(-3, 26); g.lineTo(3, 26); g.lineTo(3, 4); g.lineTo(7, 4); g.lineTo(11, 22); g.lineTo(30, 22); g.lineTo(30, 34); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-30, 31, 60, 3);
    // card fingers
    g.fillStyle = twChrome(g, 18, 30);
    [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * 30, 30); g.lineTo(s * 80, 30); g.lineTo(s * 84, 24); g.lineTo(s * 40, 22); g.closePath(); g.fill(); });
  }
  function twPress(t, ch) {
    let p = 0;
    for (const e of TW_S.strikes) {
      const c2 = e.k === 'sp' ? ' ' : e.ch.toUpperCase();
      if (c2 !== ch) continue;
      if (t > e.t - 0.05 && t < e.t + 0.08) p = Math.max(p, t < e.t ? seg(t, e.t - 0.05, e.t) : 1 - seg(t, e.t, e.t + 0.08));
    }
    return p;
  }
  // Camera: macro on the strike point, pull-back to the machine, dive into the red slug.
  function twCam(t, colAtRed) {
    const S = 250 / TW.fs;
    const close = { x: vnoise(t * 0.4, 3) * 4, y: -26 + vnoise(t * 0.4, 5) * 3, s: lerp(4.7, 4.2, E.outC(seg(t, 0, 2))) };
    const wide = { x: 0, y: 190, s: 0.8 };
    const target = st => ({ x: -colAtRed * TW.pitch + (st.lay ? 0 : 0), y: 0, s: S });
    const zoom = (A, B, u) => {
      const s = Math.exp(lerp(Math.log(A.s), Math.log(B.s), u));
      const w = (1 / A.s - 1 / s) / (1 / A.s - 1 / B.s || 1);
      return { x: lerp(A.x, B.x, w), y: lerp(A.y, B.y, w), s };
    };
    return { close, wide, target, zoom };
  }

  MG.film({
    id: 'typewriter', dur: 10, poster: 9.6,
    fonts: [['400 60px "Special Elite"', 'The quick brown fox jumps over the lazy dog. Each word, one key at a tiem Typewriter'], ['700 40px "Courier Prime"', 'ANIMATION 0123456789 QWERTYUIOPASDFGHJKL;ZXCVBNM,./'], ['italic 400 40px "Courier Prime"', '— one keystroke at a time —']],
    meta: {
      family: 'B', name: 'Typewriter Animation', sub: 'Slug-Struck Type', era: '1874 —',
      origin: 'The Sholes & Glidden "Type-Writer", sold by Remington from 1874, fixed the QWERTY layout and the look of monospaced slug-struck type; the Underwood No. 5 (1900) made front-strike visible writing the office standard. Film and television borrowed its rhythm for typed-on titles and location supers, and After Effects ships a "Typewriter" text preset that reveals one character at a time.',
      works: 'Sholes & Glidden Type-Writer (Remington, 1874) · Underwood No. 5 (1900) · Leroy Anderson, "The Typewriter" (1950) · Naked Lunch (David Cronenberg, 1991) · Atonement (Joe Wright, 2007; typewriter in Dario Marianelli’s score)',
      tech: ['Per-keystroke timing with human jitter', 'Carriage escapement, bell & return', 'Uneven ribbon ink, misaligned slugs', 'Bichrome black/red ribbon'],
      accent: '#b3221d',
      motionDNA: 'Time is quantised into keystrokes: each letter lands with a hard impact while the carriage steps one pitch left; a bell warns of the margin, the return lever throws the page back and ratchets a line, and mistakes are x-ed out instead of erased.',
      visualDNA: 'Monospaced slab-serif slugs pressed unevenly into off-white bond — heavy where the bar hit hard, broken where the ribbon ran dry, each letter a hair off the baseline — in black or red ribbon, framed by chrome and black enamel.',
      transitions: 'Carriage-return whip, line feed, pull-back reveal, macro dive into a single glyph, typed-on title card',
      implementation: ['After Effects (Typewriter text preset)', 'Canvas 2D', 'Web Audio'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const r = rng(1900);
      // dry-ribbon speckle: clustered holes knocked out of the ink
      const N = 512, sp = offscreen(N, N), sg = sp.getContext('2d'), sd = sg.createImageData(N, N), vn = lattice(r, 86, 86);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const n = 0.45 * r() + 0.55 * vn(x / 6, y / 6);
        const i = (y * N + x) * 4; sd.data[i + 3] = clamp((n - 0.56) / 0.22) * 235;
      }
      sg.putImageData(sd, 0, 0);
      // bond paper fibres
      const fb = offscreen(512, 512), fg = fb.getContext('2d');
      for (let k = 0; k < 2600; k++) { fg.fillStyle = r() < 0.5 ? 'rgba(120,95,60,0.10)' : 'rgba(255,255,248,0.35)'; fg.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 1.5); }
      for (let k = 0; k < 500; k++) { const x = r() * 512, y = r() * 512, a = r() * TAU, l = 6 + r() * 20; fg.strokeStyle = 'rgba(110,85,50,0.08)'; fg.lineWidth = 0.8; fg.beginPath(); fg.moveTo(x, y); fg.quadraticCurveTo(x + Math.cos(a + 1) * l * 0.5, y + Math.sin(a + 1) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); fg.stroke(); }
      return { speck: sp, fib: fb, L: offscreen(1920, 1080) };
    },
    draw(c, t, W, H, st) {
      const base = c.getTransform();
      if (!st.lay) st.lay = twLayout(c);
      if (!st.fibP) { st.fibP = c.createPattern(st.fib, 'repeat'); st.fibP.setTransform(new DOMMatrix().scale(0.35)); }
      const g = st.L.getContext('2d');
      if (!st.pats) {
        st.pats = [g.createPattern(st.speck, 'repeat'), g.createPattern(st.speck, 'repeat')];
        st.sfib = c.createPattern(st.fib, 'repeat');
      }
      const clearL = () => { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, st.L.width, st.L.height); };
      const speckOut = (m1, m2, w, h) => {
        g.globalCompositeOperation = 'destination-out';
        st.pats[0].setTransform(m1); st.pats[1].setTransform(m2);
        g.fillStyle = st.pats[0]; g.globalAlpha = 0.8; g.fillRect(0, 0, w, h);
        g.fillStyle = st.pats[1]; g.globalAlpha = 0.45; g.fillRect(0, 0, w, h);
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      };
      const flushL = () => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'multiply'; c.drawImage(st.L, 0, 0); c.restore(); };

      const colNow = twMove(TW_S.colM, t, 0), lineNow = twMove(TW_S.lineM, t, 0);
      const colAtRed = twMove(TW_S.colM, TW_T.red + 0.2, 0);
      const PL = -(TW.ml + colNow * TW.pitch), PT = -(TW.top + lineNow * TW.ls);

      if (t < TW_T.stage + 0.12) {
        // ----- the machine -----
        const K = twCam(t, colAtRed);
        const tgtT = st.lay.a[0];
        const S = 250 / TW.fs;
        const target = { x: -colAtRed * TW.pitch - (tgtT.x - 960) / S, y: -(tgtT.y - 540) / S, s: S };
        let cam = K.close;
        if (t > TW_T.pull) cam = K.zoom(K.close, K.wide, E.ioC(seg(t, TW_T.pull, TW_T.pullEnd)));
        if (t > TW_T.dive) cam = K.zoom(K.wide, target, E.inC(seg(t, TW_T.dive, TW_T.stage)));
        // strike jolt
        let jolt = 0;
        for (const e of TW_S.strikes) if (t >= e.t && t < e.t + 0.12) jolt = Math.max(jolt, Math.exp(-(t - e.t) * 40));
        c.save();
        c.translate(960, 540); c.scale(cam.s, cam.s); c.translate(-cam.x, -cam.y + jolt * 0.9 * (cam.s > 2 ? 1 : 0));
        twBack(c, PL, PT, st);
        // ink layer, locked to the paper
        clearL(); g.setTransform(c.getTransform());
        for (const e of TW_S.ev) {
          if (e.k !== 'ch' || t < e.t) continue;
          twSlug(g, e.ch, (e.col - colNow) * TW.pitch, (e.line - lineNow) * TW.ls, TW.fs, e.j, e.red ? TWC.red : TWC.ink, t - e.t, `400 ${TW.fs}px ${TWF}`);
        }
        const M = c.getTransform().translate(PL, PT);
        g.setTransform(1, 0, 0, 1, 0, 0);
        speckOut(M.scale(0.1), M.rotate(40).scale(0.137), st.L.width, st.L.height);
        flushL();
        const machFade = 1 - seg(cam.s, 3, 8);
        if (machFade > 0) { c.save(); c.globalAlpha = machFade; twFront(c, t, PL, 1); c.restore(); }
        c.restore();
        // dive: the page swallows the frame
        const pv = seg(t, TW_T.dive + 0.3, TW_T.stage);
        if (pv > 0) {
          c.save(); c.globalAlpha = E.inQ(pv); c.fillStyle = TWC.paper; c.fillRect(0, 0, W, H); c.restore();
          clearL(); g.setTransform(c.getTransform());
          g.save(); g.translate(960, 540); g.scale(cam.s, cam.s); g.translate(-cam.x, -cam.y);
          const e = TW_S.ev.find(x => x.red);
          twSlug(g, 'T', (e.col - colNow) * TW.pitch, (e.line - lineNow) * TW.ls, TW.fs, e.j, TWC.red, t - e.t, `400 ${TW.fs}px ${TWF}`);
          g.restore();
          flushL();
        }
        // warm lamp falloff and opening fade
        if (t < TW_T.dive + 0.2) vignette(c, W, H, 0.6, '12,6,2');
        const fi = 1 - E.outQ(seg(t, 0, 0.45));
        if (fi > 0) { c.fillStyle = `rgba(0,0,0,${fi})`; c.fillRect(0, 0, W, H); }
      }
      if (t >= TW_T.stage) {
        // ----- the typed-on title card -----
        const L = st.lay, all = [...L.a, ...L.b, ...L.s];
        let last = -1, big = true;
        all.forEach((q, i) => { if (q.t <= t) { last = Math.max(last, q.t); big = i < L.a.length + L.b.length; } });
        const age = t - last, jy = (big ? 7 : 2) * Math.exp(-age * 32) * Math.cos(age * 70);
        const xf = seg(t, TW_T.stage, TW_T.stage + 0.12);
        c.save(); c.globalAlpha = xf < 1 ? xf : 1;
        c.fillStyle = TWC.paper; c.fillRect(0, 0, W, H);
        c.save(); c.translate(0, jy); c.fillStyle = st.sfib; c.globalAlpha *= 0.7; c.fillRect(0, -20, W, H + 40); c.restore();
        // the platen's shadow along the top, the paper bail's line, margins
        const sh = c.createLinearGradient(0, 0, 0, 160); sh.addColorStop(0, 'rgba(50,32,15,0.3)'); sh.addColorStop(1, 'rgba(50,32,15,0)');
        c.fillStyle = sh; c.fillRect(0, 0, W, 160);
        c.restore();
        clearL(); g.setTransform(base); g.translate(0, jy);
        L.a.forEach(q => { if (t >= q.t) twSlug(g, q.ch, q.x, q.y, 250, q.j, TWC.red, t - q.t, `400 250px ${TWF}`); });
        L.b.forEach(q => { if (t >= q.t) twSlug(g, q.ch, q.x, q.y, 86, q.j, TWC.ink, t - q.t, `700 86px ${TWM}`); });
        L.s.forEach(q => { if (t >= q.t) twSlug(g, q.ch, q.x, q.y, 38, q.j * 0.5 + 0.5, TWC.ink, t - q.t, `italic 400 38px ${TWM}`); });
        g.setTransform(1, 0, 0, 1, 0, 0);
        const bm = base.translate(0, jy);
        speckOut(bm.scale(1.25), bm.rotate(31).scale(1.7), st.L.width, st.L.height);
        if (xf < 1) { c.save(); c.globalAlpha = xf; flushL(); c.restore(); } else flushL();
        // corner notes, typed small
        if (t > 9.1) {
          const n = Math.floor((t - 9.1) * 60);
          const s1 = 'FAMILY B · TYPOGRAPHY'.slice(0, n), s2 = '-30-'.slice(0, Math.max(0, n - 6));
          text(c, s1, 140, 980, { font: TWM, weight: 400, size: 24, color: `rgba(${TWC.ink},0.7)`, ls: 3 });
          text(c, s2, 1780, 980, { font: TWM, weight: 700, size: 28, align: 'right', color: `rgba(${TWC.red},0.85)`, ls: 2 });
        }
        vignette(c, W, H, 0.32, '60,40,20');
      }
      grain(c, W, H, t, 0.06, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.85;
      const clack = (t, g = 0.3, o = {}) => {
        A.noise(t - 0.012, { type: 'lowpass', f: 600, dur: 0.03, g: g * 0.35 });                  // key travel
        A.noise(t, { type: 'highpass', f: o.hi || 2600, dur: 0.022, g, pan: o.pan || 0 });          // slug on platen
        A.noise(t, { type: 'bandpass', f: o.body || 950, q: 1.6, dur: 0.05, g: g * 0.8, pan: o.pan || 0 });
        A.osc(t, { f: o.f || 150, f2: 70, glide: 0.05, dur: 0.07, g: g * 0.5 });
        A.noise(t + 0.024, { type: 'highpass', f: 5200, dur: 0.012, g: g * 0.25 });                 // escapement tick
      };
      const bell = (t, g = 0.14) => A.bell(t, 2093, { ratios: [1, 2.32, 4.25, 6.63], g, dur: 1.8, rev: 0.3 });
      const ratchet = (t, n) => { for (let k = 0; k < n * 3; k++) A.noise(t + k * 0.025, { type: 'bandpass', f: 3400, q: 3, dur: 0.012, g: 0.16 }); };
      const ret = (e) => {
        ratchet(e.t, e.n);
        A.noise(e.t + 0.08, { type: 'bandpass', f: 1300, f2: 700, q: 0.9, dur: 0.32, g: 0.16, swell: 0.3, pan: 0.3 });
        A.noise(e.t + 0.08, { type: 'highpass', f: 6000, dur: 0.3, g: 0.035 });
        A.osc(e.t + 0.4, { f: 110, f2: 55, glide: 0.1, dur: 0.18, g: 0.32 });
        A.noise(e.t + 0.4, { type: 'bandpass', f: 700, q: 1, dur: 0.1, g: 0.3 });
      };
      // room tone and a warm electric-piano bed
      A.noise(0, { type: 'lowpass', f: 380, dur: 7.1, g: 0.018, a: 0.6, hold: true, rel: 0.4 });
      const ep = (t, ns, g = 0.028, dur = 2.6) => ns.forEach((m, i) => { A.osc(t + i * 0.015, { f: midi(m), dur, g, a: 0.006, rev: 0.4 }); A.osc(t + i * 0.015, { f: midi(m) * 2, dur: dur * 0.3, g: g * 0.25, a: 0.004 }); });
      ep(0.3, [50, 57, 62, 66]); ep(2.9, [47, 54, 59, 62]); ep(5.0, [43, 50, 55, 59, 62], 0.026, 1.6);
      TW_S.ev.forEach((e, i) => {
        const pan = clamp(-(e.col || 0) / 60 + 0.3, -0.5, 0.5);
        if (e.k === 'ch') clack(e.t, e.red ? 0.42 : 0.24 + hash(i) * 0.1, { pan, f: e.red ? 120 : 150 });
        else if (e.k === 'sp') { A.noise(e.t, { type: 'lowpass', f: 800, dur: 0.05, g: 0.22 }); A.osc(e.t, { f: 95, f2: 60, dur: 0.06, g: 0.18 }); A.noise(e.t + 0.02, { type: 'highpass', f: 5200, dur: 0.012, g: 0.06 }); }
        else if (e.k === 'bs') { A.noise(e.t, { type: 'bandpass', f: 2000, q: 2, dur: 0.03, g: 0.18 }); A.osc(e.t, { f: 300, f2: 200, dur: 0.04, g: 0.08 }); }
        else if (e.k === 'bell') bell(e.t);
        else if (e.k === 'cr') ret(e);
      });
      // pull back: air opens up; dive: a rising rush into the letter
      A.whoosh(TW_T.pull, 0.7, { f1: 2000, f2: 300, g: 0.08 });
      A.riser(TW_T.dive - 0.05, 0.5, { g: 0.12, f: 220 });
      A.whoosh(TW_T.dive + 0.1, 0.36, { f1: 400, f2: 5000, g: 0.16 });
      // title card: every slug a heavy strike with a piano note under it
      const pno = (t, m, g = 0.08) => { A.pluck(t, midi(m), { dur: 1.8, g, bright: 0.35, decay: 0.997, lp: 3000, rev: 0.35 }); A.osc(t, { f: midi(m), dur: 1.4, g: g * 0.5, rev: 0.3 }); };
      A.impact(TW_T.stage, 0.5);
      const scaleA = [62, 64, 66, 69, 71, 74, 76, 78, 81];
      for (let i = 1; i < TW_TITLE.length; i++) { const t = 7.2 + (i - 1) * 0.083; clack(t, 0.38, { f: 110, body: 700 }); A.kick(t, 0.22, { f: 90, f2: 40, dur: 0.15 }); pno(t, scaleA[i - 1], 0.05); }
      bell(7.72, 0.16);
      ret({ t: 7.98, n: 2 });
      for (let i = 0; i < TW_AN.length; i++) { const t = 8.16 + i * 0.068; clack(t, 0.34, { f: 120, body: 820 }); A.kick(t, 0.16, { f: 100, f2: 45, dur: 0.12 }); }
      ep(8.16, [38, 45, 50, 54, 57], 0.03, 2.2);
      for (let i = 0; i < TW_SUB.length; i++) if (TW_SUB[i] !== ' ') clack(8.84 + i * 0.021, 0.12, { hi: 3200 });
      pno(9.45, 74, 0.08); pno(9.45, 62, 0.06); pno(9.5, 66, 0.05); pno(9.55, 69, 0.05);
      bell(9.45, 0.13);
    },
  });

  /* =====================================================================
     TEXT-ON-PATH — a hairline draws itself and words ride onto it; the
     line swells into a ribbon band that throws loops, a second ribbon
     counter-flows, everything winds into a turning Vertigo spiral,
     collapses to a point and bursts out as a rotating seal
     ===================================================================== */
  const TP = { bg: '#efe6d3', ink: '#17130f', red: '#e2401c', blue: '#2140b6', gold: '#f2b632', cream: '#fbf4e4' };
  const TPF = '"Bricolage Grotesque", "Archivo", sans-serif', TPS = 'Fraunces, Georgia, serif';
  const TP_N = 900;
  const TP_A = 'follow the line · along the curve · around the bend · ';
  const TP_B = 'TEXT ON PATH · ';
  const TP_B2 = 'follow the line · ';
  const TP_RING = 'TEXT · ON · PATH · MOTION · TEXT · ON · PATH · MOTION · ';
  const TP_T = { band: 1.7, loop: 2.6, spiral: 4.3, spiralIn: 5.2, collapse: 6.45, burst: 7.0, title: 7.6, sub: 8.55 };

  // Path shapes, each u ∈ [0,1] → [x, y].
  const tpWave = (u, t) => [-300 + 2520 * u, 560 + 150 * Math.sin(u * 5.4 - 1.3 + t * 0.5)];
  const tpLoop = (u, t, s = 1) => { const w = TAU * 2.1, p = w * u + 0.8 - t * 0.9; return [-300 + 2520 * u + 235 * Math.sin(p), 540 + s * (40 + 230 * Math.cos(p))]; };
  const tpSpiral = (u, rot, G) => { const r = G * (1180 * Math.pow(1 - u, 1.3) + 26 * u), a = rot + u * 4.3 * TAU; return [960 + r * Math.cos(a), 540 + r * Math.sin(a)]; };
  function tpBuild(st, key, fn) {
    const P = st[key] || (st[key] = { x: new Float32Array(TP_N + 1), y: new Float32Array(TP_N + 1), s: new Float32Array(TP_N + 1), L: 0 });
    let L = 0;
    for (let i = 0; i <= TP_N; i++) {
      const [x, y] = fn(i / TP_N); P.x[i] = x; P.y[i] = y;
      if (i) L += Math.hypot(x - P.x[i - 1], y - P.y[i - 1]);
      P.s[i] = L;
    }
    P.L = L;
    return P;
  }
  function tpAt(P, s) {
    let lo = 0, hi = TP_N;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P.s[m] < s) lo = m; else hi = m; }
    const d = P.s[hi] - P.s[lo] || 1, f = clamp((s - P.s[lo]) / d);
    return [lerp(P.x[lo], P.x[hi], f), lerp(P.y[lo], P.y[hi], f), Math.atan2(P.y[hi] - P.y[lo], P.x[hi] - P.x[lo])];
  }
  function tpStroke(c, P, upTo = Infinity) {
    c.beginPath(); c.moveTo(P.x[0], P.y[0]);
    for (let i = 1; i <= TP_N; i++) {
      if (P.s[i] > upTo) { const [x, y] = tpAt(P, upTo); c.lineTo(x, y); break; }
      c.lineTo(P.x[i], P.y[i]);
    }
  }
  // Set a repeating string along a path by arc length; o.scale(x,y) sizes glyphs, o.k(i) pops them.
  function tpRun(c, st, P, str, o) {
    const font = o.font, size = o.size;
    const wk = font + size;
    const cache = st.w[wk] || (st.w[wk] = {});
    c.font = `${font.replace('$', size)}`;
    const wid = ch => cache[ch] ?? (cache[ch] = c.measureText(ch).width);
    let period = cache.__p;
    if (period == null) { period = 0; for (const ch of str) period += wid(ch) + (o.track || 0); cache.__p = period; }
    let s = o.start != null ? o.start : -(((o.flow % period) + period) % period);
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    let i = 0, guard = 0;
    while (s < P.L && guard++ < 1600) {
      const ch = str[i % str.length];
      const [px, py] = tpAt(P, Math.max(0, s));
      const f = o.scale ? o.scale(px, py) : 1;
      const adv = (wid(ch) + (o.track || 0)) * f;
      const sc = s + adv / 2;
      if (sc >= 0 && sc <= P.L && ch !== ' ') {
        const k = o.k ? o.k(i, sc) : 1;
        if (k > 0.01 && f * k > 0.03) {
          const [x, y, a] = tpAt(P, sc);
          c.save(); c.translate(x, y); c.rotate(a); c.scale(f * k, f * k);
          c.fillStyle = o.color; c.fillText(ch, 0, o.off || 0);
          c.restore();
        }
      }
      s += adv; i++;
    }
  }
  const tpMix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  const tpCol = (a, b, k) => { const p = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16)); const A = p(a), B = p(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], k))).join(',')})`; };

  function tpTitleLayout(c) {
    const out = [];
    const line = (s, font, size, y, color) => {
      c.font = `${font.replace('$', size)}`;
      const ws = [...s].map(ch => c.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0);
      let x = 960 - tot / 2;
      [...s].forEach((ch, i) => { out.push({ ch, x: x + ws[i] / 2, y, font, size, color }); x += ws[i]; });
    };
    line('Text', `800 $px ${TPF}`, 168, 488, TP.cream);
    line('on', `italic 600 $px ${TPS}`, 92, 576, TP.gold);
    line('Path', `800 $px ${TPF}`, 168, 718, TP.cream);
    return out;
  }

  MG.film({
    id: 'textpath', dur: 10, poster: 9.5,
    fonts: [['800 120px "Bricolage Grotesque"', 'follow the line along curve around bend TEXT ON PATH MOTION Text Path · —'], ['italic 600 80px Fraunces', 'follow the line on ·'], ['400 30px "Bricolage Grotesque"', 'TYPE THAT FOLLOWS THE LINE · FAMILY B']],
    meta: {
      family: 'B', name: 'Text-on-Path Motion', sub: 'Type Along a Curve', era: '1958 —',
      origin: 'Letters that ride a line instead of a baseline. Calligrams bent verse into pictures, Saul Bass and John Whitney built the Vertigo (1958) titles around turning spirals, and 1990s title designers such as Kyle Cooper made type itself a moving line. After Effects 6.0 (2003) brought text layers with Path Options, and ribbons, spirals and rotating rings of words became a staple of brand films.',
      works: 'Calligrammes (Guillaume Apollinaire, 1918) · Vertigo title sequence (Saul Bass & John Whitney, 1958) · Kyle Cooper / Imaginary Forces title work (1996 —) · After Effects text Path Options (Adobe, 2003) · SVG <textPath> (W3C, 2001)',
      tech: ['Arc-length glyph placement', 'Perpendicular-to-path rotation', 'Path morph & first-margin flow', 'Ribbon band with knocked-out letters'],
      accent: '#e2401c',
      motionDNA: 'Letters never move on their own: the path moves and the type flows along it — a line draws on, swells into a looping ribbon, winds into a turning spiral, collapses to a point and snaps shut as a rotating ring.',
      visualDNA: 'Heavy grotesk and an italic serif riding vermilion and ultramarine bands on warm paper; Bass-like flat shapes, hairline guides and a single circular seal.',
      transitions: 'Path draw-on, path morph, spiral collapse, ring burst, letters riding arcs into a lock-up',
      implementation: ['After Effects (Path Options)', 'SVG textPath', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { w: {} }; },
    draw(c, t, W, H, st) {
      if (!st.title) st.title = tpTitleLayout(c);
      c.fillStyle = TP.bg; c.fillRect(0, 0, W, H);
      const kBand = E.ioC(seg(t, TP_T.band, TP_T.loop));
      const kLoop = E.ioC(seg(t, TP_T.band, TP_T.loop + 0.2));
      const kSp = E.ioC(seg(t, TP_T.spiral, TP_T.spiralIn));
      const G = 1 - E.inC(seg(t, TP_T.collapse, TP_T.burst));
      const rot = -0.35 * (t - TP_T.spiral) - 2.2 * Math.pow(seg(t, TP_T.collapse - 0.3, TP_T.burst), 2) * 3;
      // flow: letters advance along the line, faster as it loops, rushing inward at the collapse
      const flow = 260 * t + 900 * E.ioC(seg(t, 1.4, 3.6)) + 700 * seg(t, 4.0, 6.5) + 3200 * E.inC(seg(t, TP_T.collapse, TP_T.burst));

      if (t < TP_T.burst) {
        const P = tpBuild(st, 'P', u => {
          let p = tpMix(tpWave(u, t), tpLoop(u, t), kLoop);
          if (kSp > 0) p = tpMix(p, tpSpiral(u, rot, G), kSp);
          return p;
        });
        // the counter-flowing blue ribbon
        const kB = E.outC(seg(t, 2.3, 3.0)) * (1 - E.inC(seg(t, 3.9, 4.5)));
        if (kB > 0.01) {
          const Q = tpBuild(st, 'Q', u => tpLoop(1 - u, t * 0.8 + 1.7, -1).map((v, i) => (i ? v + 40 : 1920 - v)));
          c.lineJoin = 'round'; c.lineCap = 'butt';
          c.strokeStyle = TP.blue; c.lineWidth = 104 * kB; tpStroke(c, Q); c.stroke();
          tpRun(c, st, Q, TP_B2, { font: `italic 600 $px ${TPS}`, size: 62, color: TP.cream, flow: -flow * 0.8 + 400, off: 20, scale: () => kB, track: 4 });
        }
        // the main line → band
        const bw = 150 * kBand * (1 - E.inQ(seg(t, TP_T.spiral + 0.2, TP_T.spiralIn + 0.2)));
        const draw0 = E.ioC(seg(t, 0.05, 1.0)) * P.L;
        if (bw > 0.5) { c.lineJoin = 'round'; c.strokeStyle = TP.red; c.lineWidth = bw; tpStroke(c, P); c.stroke(); }
        const hair = t < TP_T.spiral ? 1 - kBand : E.outQ(seg(t, TP_T.spiralIn - 0.3, TP_T.spiralIn + 0.3));
        if (hair > 0.01) {
          c.lineCap = 'round'; c.strokeStyle = t < TP_T.spiral ? TP.ink : TP.red; c.globalAlpha = hair; c.lineWidth = t < TP_T.spiral ? 3 : 2.5;
          tpStroke(c, P, t < TP_T.spiral ? draw0 : Infinity); c.stroke(); c.globalAlpha = 1;
        }
        // pen nib leading the draw-on
        if (t < 1.05) { const [x, y] = tpAt(P, draw0); c.fillStyle = TP.red; c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); }
        // text A: rides the line, then sits inside the band; shrinks away as the spiral takes over
        const kA = 1 - E.inC(seg(t, TP_T.spiral + 0.3, TP_T.spiralIn + 0.2));
        if (kA > 0.01) {
          const enter = 1900 * (1 - E.outC(seg(t, 0.3, 1.6)));
          tpRun(c, st, P, TP_A, {
            font: `800 $px ${TPF}`, size: 96, color: tpCol(TP.ink, TP.cream, kBand), flow: flow - enter, track: 2, off: lerp(-10, 34, kBand),
            k: (i, s) => kA * (s < draw0 + 40 || t > 1.2 ? 1 : 0),
          });
        }
        // text B: the spiral's own words, scaled by radius
        const kBt = E.outC(seg(t, TP_T.spiral + 0.5, TP_T.spiralIn + 0.4));
        if (kBt > 0.01) {
          tpRun(c, st, P, TP_B, {
            font: `800 $px ${TPF}`, size: 84, color: TP.ink, flow: flow * 1.1, track: 6, off: -8,
            scale: (x, y) => lerp(1, clamp(Math.hypot(x - 960, y - 540) / 560, 0.06, 1.25), kSp),
            k: () => kBt,
          });
        }
        // the point everything falls into
        const dot = E.outB(seg(t, TP_T.collapse + 0.25, TP_T.burst));
        if (dot > 0) { c.fillStyle = TP.red; c.beginPath(); c.arc(960, 540, 22 * dot, 0, TAU); c.fill(); }
      } else {
        // ----- the seal -----
        const ub = seg(t, TP_T.burst, TP_T.burst + 0.5), R = 340 * E.outB(ub, 1.4);
        const spin = -PI / 2 - 1.6 * E.outC(seg(t, TP_T.burst, TP_T.burst + 1.2)) - 0.12 * (t - TP_T.burst);
        // shock ring
        const sr = seg(t, TP_T.burst, TP_T.burst + 0.6);
        if (sr > 0 && sr < 1) { c.strokeStyle = TP.red; c.globalAlpha = 1 - sr; c.lineWidth = 6; c.beginPath(); c.arc(960, 540, 340 + 500 * E.outC(sr), 0, TAU); c.stroke(); c.globalAlpha = 1; }
        // outer orbit hairline with a travelling dot
        const ko = E.outC(seg(t, TP_T.burst + 0.3, TP_T.burst + 1.1));
        if (ko > 0) {
          c.strokeStyle = TP.ink; c.lineWidth = 2; c.globalAlpha = 0.5;
          c.beginPath(); c.arc(960, 540, 440, -PI / 2, -PI / 2 + TAU * ko); c.stroke(); c.globalAlpha = 1;
          const a = -PI / 2 + TAU * ko + (t - TP_T.burst) * 0.9;
          c.fillStyle = TP.blue; c.beginPath(); c.arc(960 + Math.cos(a) * 440, 540 + Math.sin(a) * 440, 9, 0, TAU); c.fill();
        }
        // blue disc inside, red band ring
        c.fillStyle = TP.blue; c.beginPath(); c.arc(960, 540, Math.max(0, R - 56), 0, TAU); c.fill();
        c.strokeStyle = TP.red; c.lineWidth = 112 * clamp(ub * 2); c.beginPath(); c.arc(960, 540, Math.max(1, R), 0, TAU); c.stroke();
        // ring text, fitted exactly to the circumference
        if (R > 20) {
          const Pr = tpBuild(st, 'R', u => [960 + R * Math.cos(spin + u * TAU), 540 + R * Math.sin(spin + u * TAU)]);
          const key = `800 $px ${TPF}` + 56;
          if (!st.w[key] || st.w[key].__p == null) tpRun(c, st, Pr, TP_RING, { font: `800 $px ${TPF}`, size: 56, color: 'rgba(0,0,0,0)', flow: 0 });
          const natural = st.w[key].__p, track = (2 * PI * 340 - natural) / TP_RING.length;
          const fit = R / 340;
          tpRun(c, st, Pr, TP_RING, {
            font: `800 $px ${TPF}`, size: 56, color: TP.cream, start: 0, off: 20, track: track,
            scale: () => fit,
            k: i => E.outB(seg(t, TP_T.burst + 0.15 + i * 0.012, TP_T.burst + 0.4 + i * 0.012), 2.5),
          });
        }
        // title letters ride their own arcs from the ring into the lock-up
        st.title.forEach((q, i) => {
          const t0 = TP_T.title + i * 0.055, u = seg(t, t0, t0 + 0.6);
          if (u <= 0) return;
          const e = E.outC(u), a0 = spin + i * 0.55;
          const S = [960 + Math.cos(a0) * 340, 540 + Math.sin(a0) * 340], Ee = [q.x, q.y];
          const C = [960 + Math.cos(a0 + 1.3) * 160, 540 + Math.sin(a0 + 1.3) * 160];
          const x = (1 - e) * (1 - e) * S[0] + 2 * (1 - e) * e * C[0] + e * e * Ee[0], y = (1 - e) * (1 - e) * S[1] + 2 * (1 - e) * e * C[1] + e * e * Ee[1];
          const tx = 2 * (1 - e) * (C[0] - S[0]) + 2 * e * (Ee[0] - C[0]), ty = 2 * (1 - e) * (C[1] - S[1]) + 2 * e * (Ee[1] - C[1]);
          const ang = Math.atan2(ty, tx) * (1 - E.outQ(u)), sc = lerp(0.35, 1, E.outB(u, 1.6));
          c.save(); c.translate(x, y); c.rotate(ang); c.scale(sc, sc);
          c.font = q.font.replace('$', q.size); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
          c.fillStyle = q.color; c.fillText(q.ch, 0, 0); c.restore();
        });
        // subtitle along the bottom arc, written on letter by letter
        const sub = 'TYPE THAT FOLLOWS THE LINE';
        const ks = seg(t, TP_T.sub, TP_T.sub + 0.6);
        if (ks > 0) {
          c.font = `400 30px ${TPF}`; c.textAlign = 'center'; c.textBaseline = 'middle';
          const n = sub.length, R2 = 492, span = n * 25 / R2;
          for (let i = 0; i < n; i++) {
            if (i / n > ks * 1.02) break;
            const a = PI / 2 + span / 2 - (i + 0.5) / n * span;
            c.save(); c.translate(960 + Math.cos(a) * R2, 540 + Math.sin(a) * R2); c.rotate(a - PI / 2);
            c.fillStyle = TP.ink; c.fillText(sub[i], 0, 0); c.restore();
          }
          const top = 'MOTION STYLE ATLAS · FAMILY B';
          for (let i = 0; i < top.length; i++) {
            if (i / top.length > ks * 1.02) break;
            const sp2 = top.length * 25 / R2, a = -PI / 2 - sp2 / 2 + (i + 0.5) / top.length * sp2;
            c.save(); c.translate(960 + Math.cos(a) * R2, 540 + Math.sin(a) * R2); c.rotate(a + PI / 2);
            c.fillStyle = TP.red; c.fillText(top[i], 0, 0); c.restore();
          }
        }
      }
      // print texture
      grain(c, W, H, t, 0.07, 'multiply');
      vignette(c, W, H, 0.22, '70,40,10');
    },
    score(A) {
      A.bus.gain.value = 0.8;
      const B = 0.5;
      const pad = (t, ns, dur, g = 0.02) => A.chord(t, ns, { type: 'sawtooth', dur, g, lp: 900, lp2: 2400, lpT: dur, a: 0.4, hold: true, rel: 0.6, spread: 8, rev: 0.5, width: 0.8 });
      pad(0, [53, 60, 64, 69], 2.6); pad(2.5, [50, 57, 62, 69], 2.0); pad(4.4, [46, 53, 58, 65], 2.4);
      // flowing arpeggio: sixteenths that follow the line
      const arpA = [65, 69, 72, 76, 79, 76, 72, 69], arpB = [62, 65, 69, 74, 77, 74, 69, 65];
      for (let k = 0; k < 26; k++) {
        const t = 0.25 + k * B / 2; if (t > 6.4) break;
        const ar = t < 2.5 ? arpA : arpB;
        A.pluck(t, midi(ar[k % 8]), { dur: 0.6, g: 0.12, bright: 0.55, decay: 0.993, lp: 3200, rev: 0.3, pan: Math.sin(k * 0.7) * 0.5 });
      }
      // a soft pulse once the band forms
      for (let k = 0; k < 9; k++) { const t = TP_T.band + k * B; A.kick(t, 0.32, { f: 110, f2: 45 }); A.hat(t + B / 2, 0.05); }
      // pen draw-on
      A.noise(0.05, { type: 'bandpass', f: 2600, f2: 4800, q: 2, dur: 0.95, g: 0.04, swell: 0.3, pan: -0.4 });
      A.whoosh(TP_T.band, 0.8, { f1: 300, f2: 2500, g: 0.14 });
      A.whoosh(2.3, 0.7, { f1: 3000, f2: 400, g: 0.1, pan: 0.5 });
      // into the spiral: a harp glissando, a turning Shepard-like rise
      A.whoosh(TP_T.spiral, 0.9, { f1: 400, f2: 3000, g: 0.14 });
      const harp = [50, 53, 57, 60, 62, 65, 69, 72, 74, 77, 81, 84];
      harp.forEach((m, i) => A.pluck(TP_T.spiral + 0.4 + i * 0.07, midi(m), { dur: 1.4, g: 0.1, bright: 0.45, decay: 0.997, rev: 0.5, pan: (i / 11 - 0.5) * 0.8 }));
      for (let k = 0; k < 3; k++) A.osc(5.2, { type: 'triangle', f: midi(57 + k * 12), f2: midi(57 + k * 12) * 1.5, glide: 1.7, dur: 1.8, g: 0.03 / (1 + k), a: 0.5, hold: true, rel: 0.3, rev: 0.4 });
      [5.3, 5.55, 5.8, 6.05, 6.3].forEach((t, i) => A.pluck(t, midi([69, 72, 76, 79, 84][i]), { dur: 1.1, g: 0.09, bright: 0.6, rev: 0.45 }));
      // collapse: everything sucked into the point
      A.noise(TP_T.collapse - 0.2, { type: 'bandpass', f: 400, f2: 6000, q: 1.5, dur: 0.75, g: 0.2, swell: 0.95, rev: 0.3 });
      A.osc(TP_T.collapse - 0.2, { type: 'sawtooth', f: 110, f2: 880, glide: 0.75, dur: 0.75, g: 0.04, lp: 2000, a: 0.6 });
      // burst: the ring snaps shut
      A.impact(TP_T.burst, 0.75);
      A.kick(TP_T.burst, 0.8);
      A.chord(TP_T.burst, [53, 60, 64, 67, 72], { type: 'sawtooth', dur: 2.6, g: 0.024, lp: 3000, lp2: 900, lpT: 2.4, a: 0.01, hold: true, rel: 1, spread: 9, rev: 0.6, width: 1 });
      for (let i = 0; i < 20; i++) A.noise(TP_T.burst + 0.15 + i * 0.024, { type: 'bandpass', f: 2500 + hash(i) * 3000, q: 4, dur: 0.03, g: 0.05, pan: Math.sin(i * 0.8) * 0.7 });
      // title letters riding in
      for (let i = 0; i < 10; i++) A.pluck(TP_T.title + i * 0.055 + 0.3, midi([72, 76, 79, 84, 81, 79, 76, 77, 81, 84][i]), { dur: 0.9, g: 0.08, bright: 0.6, rev: 0.4, pan: (i / 9 - 0.5) * 0.6 });
      A.kick(TP_T.title + 0.85, 0.5);
      // resolve
      A.chord(8.6, [41, 53, 60, 64, 69, 72], { type: 'triangle', dur: 1.5, g: 0.04, a: 0.02, rev: 0.6, width: 1 });
      A.bell(8.6, midi(84), { g: 0.1, dur: 2 });
      A.bell(8.9, midi(91), { g: 0.06, dur: 1.6, pan: 0.3 });
    },
  });

  /* =====================================================================
     OLD-SCHOOL SCREENSAVER — a beige CRT left alone in a dark office
     cycles through its savers: a starfield warps, two polygons mystify,
     3D pipes grow and fill the tube, then a logo-free badge bounces —
     wall, wall, wall... and hits the corner dead on
     ===================================================================== */
  const SS = { W: 640, H: 480 };
  const SS_T = { mys: 2.35, pipes: 4.5, dvd: 6.65, slow: 8.1, hit: 8.7, home: 9.0 };
  const SSG = { x: 400, y: 92, w: 1120, h: 840, r: 44 };
  const SSF = '"Exo 2", "Archivo", sans-serif';
  const SS_COLS = ['#ff3b3b', '#3bd6ff', '#ffd23b', '#7dff5a', '#ff5ad1', '#ffffff'];
  const ssRefl = (v, L) => { const m = ((v % (2 * L)) + 2 * L) % (2 * L); return m <= L ? m : 2 * L - m; };
  // Bounce clock: real time until the slow-motion approach, then half speed.
  const ssTau = t => { const u = t - (SS_T.dvd + 0.1); return u < SS_T.slow - (SS_T.dvd + 0.1) ? u : (SS_T.slow - SS_T.dvd - 0.1) + (t - SS_T.slow) * 0.5; };
  const SS_B = (() => {
    const bw = 210, bh = 72, Lx = SS.W - bw, Ly = SS.H - bh, TH = ssTau(SS_T.hit);
    const X0 = 40, Y0 = 170, X1 = 2 * Lx, Y1 = 3 * Ly;
    return { bw, bh, Lx, Ly, X0, Y0, vx: (X1 - X0) / TH, vy: (Y1 - Y0) / TH, TH };
  })();
  const ssBadgeAt = t => {
    const tau = Math.min(ssTau(t), SS_B.TH);
    const X = SS_B.X0 + SS_B.vx * tau, Y = SS_B.Y0 + SS_B.vy * tau;
    const hits = Math.floor(X / SS_B.Lx) + Math.floor(Y / SS_B.Ly) - (tau >= SS_B.TH - 1e-6 ? 0 : 0);
    return { x: ssRefl(X, SS_B.Lx), y: ssRefl(Y, SS_B.Ly), hits: Math.max(0, Math.floor((X - 1e-6) / SS_B.Lx) + Math.floor((Y - 1e-6) / SS_B.Ly)), hitsRaw: hits };
  };
  // A logo-free bouncing badge: italic wordmark over a swoosh pill.
  function ssBadge(g, x, y, col, s = 1) {
    g.save(); g.translate(x + SS_B.bw / 2, y + SS_B.bh / 2); g.scale(s, s);
    g.fillStyle = col; g.font = `italic 900 31px ${SSF}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    if (MG.text) { g.letterSpacing = '-1px'; }
    g.fillText('SCREENSAVER', 0, 4);
    g.letterSpacing = '0px';
    g.beginPath(); g.ellipse(0, 20, 70, 11, 0, 0, TAU); g.fill();
    g.globalCompositeOperation = 'destination-out';
    g.font = `italic 900 13px ${SSF}`; g.letterSpacing = '3px'; g.fillText('OLD-SCHOOL', 2, 25); g.letterSpacing = '0px';
    g.globalCompositeOperation = 'source-over';
    g.restore();
  }
  // Starfield Simulation: points flying out of a vanishing point.
  function ssStars(g, st, D, bright = 1) {
    for (const s of st.stars) {
      const z = 1 - ((((s.z - D) % 1) + 1) % 1) * 0.985, z2 = Math.min(1, z + 0.02 + (st.warp || 0) * 0.1);
      const x = 320 + s.x / z * 150, y = 240 + s.y / z * 150;
      if (x < -20 || x > 660 || y < -20 || y > 500) continue;
      const v = clamp(0.25 + (1 - z) * 1.6) * bright, sz = 1 + (1 - z) * 2.8;
      g.strokeStyle = g.fillStyle = `rgba(255,255,255,${v})`;
      if (st.warp > 0.15) { const x2 = 320 + s.x / z2 * 150, y2 = 240 + s.y / z2 * 150; g.lineWidth = sz; g.beginPath(); g.moveTo(x2, y2); g.lineTo(x, y); g.stroke(); }
      else g.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }
  }
  // Mystify: two bouncing quadrilaterals with echo trails.
  function ssMystify(g, st, tl) {
    g.lineWidth = 1.3;
    st.mys.forEach((p, pi) => {
      const hue = (p.h + tl * 60) % 360;
      for (let e = 5; e >= 0; e--) {
        const te = tl - e * 0.055;
        g.strokeStyle = `hsla(${hue},100%,${60 - e * 3}%,${1 - e * 0.1})`;
        g.beginPath();
        p.v.forEach((v, i) => { const x = ssRefl(v.x + v.vx * te, SS.W), y = ssRefl(v.y + v.vy * te, SS.H); i ? g.lineTo(x, y) : g.moveTo(x, y); });
        g.closePath(); g.stroke();
      }
    });
  }
  // 3D Pipes: painter-sorted capsules growing through a grid.
  const SS_PF = 480, ssProj = p => [320 + SS_PF * p[0] / p[2], 240 + SS_PF * p[1] / p[2]];
  function ssPipes(g, st, tl) {
    const items = [];
    for (const s of st.segs) {
      if (tl < s.t0) continue;
      const u = clamp((tl - s.t0) / (s.t1 - s.t0));
      const b = [lerp(s.a[0], s.b[0], u), lerp(s.a[1], s.b[1], u), lerp(s.a[2], s.b[2], u)];
      items.push({ z: (s.a[2] + b[2]) / 2 + 0.01, a: s.a, b, col: s.col, cap: true });
      if (s.joint) items.push({ z: s.a[2] - 0.02, ball: s.a, col: s.col });
    }
    items.sort((p, q) => q.z - p.z);
    const R = 0.27;
    for (const it of items) {
      const [r, gg, bb] = it.col, fog = clamp(1 - (it.z - 8) / 16, 0.35, 1);
      const C = k => `rgb(${Math.round(r * k * fog)},${Math.round(gg * k * fog)},${Math.round(bb * k * fog)})`;
      if (it.ball) {
        const [x, y] = ssProj(it.ball), rr = SS_PF * R * 1.35 / it.ball[2];
        const rg = g.createRadialGradient(x - rr * 0.35, y - rr * 0.4, rr * 0.1, x, y, rr);
        rg.addColorStop(0, C(1.6)); rg.addColorStop(0.45, C(1)); rg.addColorStop(1, C(0.35));
        g.fillStyle = rg; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill();
        continue;
      }
      const A2 = ssProj(it.a), B2 = ssProj(it.b), ra = SS_PF * R / it.a[2], rb = SS_PF * R / it.b[2];
      let dx = B2[0] - A2[0], dy = B2[1] - A2[1]; const l = Math.hypot(dx, dy);
      // end discs (also the whole pipe when it points at the camera)
      [[A2, ra], [B2, rb]].forEach(([p, rr]) => {
        const rg = g.createRadialGradient(p[0] - rr * 0.3, p[1] - rr * 0.35, rr * 0.1, p[0], p[1], rr);
        rg.addColorStop(0, C(1.45)); rg.addColorStop(0.5, C(0.95)); rg.addColorStop(1, C(0.4));
        g.fillStyle = rg; g.beginPath(); g.arc(p[0], p[1], rr, 0, TAU); g.fill();
      });
      if (l < 0.5) continue;
      dx /= l; dy /= l;
      const nx = -dy, ny = dx, lit = nx * -0.6 + ny * -0.8 > 0 ? 1 : -1;
      const gr = g.createLinearGradient(A2[0] - nx * ra * lit, A2[1] - ny * ra * lit, A2[0] + nx * ra * lit, A2[1] + ny * ra * lit);
      gr.addColorStop(0, C(1.7)); gr.addColorStop(0.22, C(1.25)); gr.addColorStop(0.55, C(0.85)); gr.addColorStop(1, C(0.3));
      g.fillStyle = gr; g.beginPath();
      g.moveTo(A2[0] + nx * ra, A2[1] + ny * ra); g.lineTo(B2[0] + nx * rb, B2[1] + ny * rb);
      g.lineTo(B2[0] - nx * rb, B2[1] - ny * rb); g.lineTo(A2[0] - nx * ra, A2[1] - ny * ra); g.closePath(); g.fill();
    }
  }

  MG.film({
    id: 'screensaver', dur: 10, poster: 9.6,
    fonts: [['italic 900 40px "Exo 2"', 'SCREENSAVER OLD-SCHOOL'], ['400 40px VT323', 'PRESS ANY KEY 1990s'], ['600 40px Caveat', 'back in 5 min!']],
    meta: {
      family: 'G', name: 'Old-school Screensaver', sub: 'Moving Pixels vs. Burn-in', era: '1983 — 2000s',
      origin: 'Static images burned permanently into always-on CRT phosphor, so John Socha published SCRNSAVE for the IBM PC in 1983 to blank the screen. Berkeley Systems’ After Dark (1989) turned the idle screen into entertainment, Windows 3.1 (1992) made Starfield Simulation and Mystify universal, and the OpenGL savers of Windows NT 3.5 (1994) added 3D Pipes. The DVD player’s bouncing idle logo later became a shared ritual of waiting for the perfect corner hit.',
      works: 'SCRNSAVE (John Socha, 1983) · After Dark & Flying Toasters (Berkeley Systems, 1989) · Windows 3.1 Starfield Simulation & Mystify (1992) · 3D Pipes, Windows NT 3.5 OpenGL savers (1994) · The Office, “Scott’s Tots” corner hit (NBC, 2009)',
      tech: ['Perspective-divide starfield', 'Polygon echo trails', 'Painter-sorted 3D pipe growth', 'Bounce, recolour & corner hit'],
      accent: '#3bd6ff',
      motionDNA: 'Endless, unattended motion: constant-velocity bounces, stars streaming from a vanishing point, pipes growing segment by segment until the tube is full — no cuts and no story, only loops waiting for a keypress, until the badge finally kisses the corner.',
      visualDNA: 'Saturated primaries on pure black: 1-pixel vector lines, flat-shaded OpenGL tubes and an italic wordmark at VGA resolution, seen through the curved glass, scanlines and bloom of a yellowing beige monitor in a dark office.',
      transitions: 'Saver hand-off with mode-switch blackout, screen-fill reset, corner-hit flash, badge homes to centre',
      implementation: ['Win32 .scr (C)', 'OpenGL 1.x', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const r = rng(1992);
      const stars = Array.from({ length: 700 }, () => ({ x: (r() - 0.5) * 4.4, y: (r() - 0.5) * 3.3, z: r() }));
      const mys = [0, 1].map(p => ({ h: p * 170 + 20, v: Array.from({ length: 4 }, () => ({ x: r() * SS.W, y: r() * SS.H, vx: (r() < 0.5 ? -1 : 1) * (110 + r() * 170), vy: (r() < 0.5 ? -1 : 1) * (90 + r() * 150) })) }));
      // grow pipes: three concurrent growth slots on a shared occupancy grid
      const NX = 13, NY = 10, NZ = 10, occ = new Uint8Array(NX * NY * NZ), id = (i, j, k) => (k * NY + j) * NX + i;
      const W3 = (i, j, k) => [(i - (NX - 1) / 2) * 1.0, (j - (NY - 1) / 2) * 1.0, 8.6 + k * 1.0];
      const pal = [[214, 40, 40], [40, 170, 70], [40, 100, 225], [225, 190, 30], [200, 200, 205], [30, 175, 190], [195, 60, 170]];
      const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
      const segs = [], rate = 1 / 17, slots = [];
      let pc = 0;
      const start = () => {
        for (let tries = 0; tries < 50; tries++) {
          const p = [Math.floor(r() * NX), Math.floor(r() * NY), Math.floor(r() * NZ * 0.7)];
          if (!occ[id(...p)]) { occ[id(...p)] = 1; return { p, d: dirs[Math.floor(r() * 6)], col: pal[pc++ % pal.length], first: true, n: 0 }; }
        }
        return null;
      };
      for (let s = 0; s < 5; s++) slots.push(start());
      for (let tick = 0; tick < 38; tick++) {
        const t0 = tick * rate - 0.02;
        slots.forEach((sl, si) => {
          if (!sl) { slots[si] = start(); return; }
          let d = sl.d; const turn = r() < 0.3 || sl.first;
          const ok = dd => { const q = [sl.p[0] + dd[0], sl.p[1] + dd[1], sl.p[2] + dd[2]]; return q[0] >= 0 && q[0] < NX && q[1] >= 0 && q[1] < NY && q[2] >= 0 && q[2] < NZ && !occ[id(...q)]; };
          if (turn || !ok(d)) { const opts = dirs.filter(dd => ok(dd) && !(dd[0] === -d[0] && dd[1] === -d[1] && dd[2] === -d[2])); d = opts.length ? opts[Math.floor(r() * opts.length)] : null; }
          if (!d || sl.n > 30) { slots[si] = start(); return; }
          const q = [sl.p[0] + d[0], sl.p[1] + d[1], sl.p[2] + d[2]];
          occ[id(...q)] = 1;
          segs.push({ a: W3(...sl.p), b: W3(...q), t0: Math.max(0, t0), t1: Math.max(0, t0) + rate, col: sl.col, joint: d !== sl.d || sl.first });
          sl.p = q; sl.d = d; sl.first = false; sl.n++;
        });
      }
      const confetti = Array.from({ length: 70 }, () => ({ a: -PI / 2 + r() * PI / 2 * 0.95, v: 160 + r() * 380, c: SS_COLS[Math.floor(r() * SS_COLS.length)], s: 2 + Math.floor(r() * 3) }));
      // monitor casing with the glass cut out
      const mon = offscreen(1920, 1080), mg = mon.getContext('2d');
      const cg = mg.createLinearGradient(0, 20, 0, 1080); cg.addColorStop(0, '#ddd4bc'); cg.addColorStop(0.6, '#cdc3a8'); cg.addColorStop(1, '#b5ab90');
      mg.fillStyle = 'rgba(0,0,0,0.5)'; rrect(mg, 284, 30, 1352, 1100, 46); mg.fill();
      mg.fillStyle = cg; rrect(mg, 296, 16, 1328, 1100, 40); mg.fill();
      for (let k = 0; k < 9000; k++) { mg.fillStyle = r() < 0.5 ? 'rgba(90,80,50,0.06)' : 'rgba(255,255,240,0.08)'; mg.fillRect(296 + r() * 1328, 16 + r() * 1080, 2, 2); }
      const rg = mg.createLinearGradient(296, 0, 1624, 0); rg.addColorStop(0, 'rgba(255,255,255,0.12)'); rg.addColorStop(0.5, 'rgba(255,255,255,0)'); rg.addColorStop(1, 'rgba(0,0,0,0.14)');
      mg.fillStyle = rg; rrect(mg, 296, 16, 1328, 1100, 40); mg.fill();
      // recessed bezel around the tube
      const bez = mg.createLinearGradient(0, 60, 0, 970); bez.addColorStop(0, '#8e866f'); bez.addColorStop(0.05, '#bdb398'); bez.addColorStop(0.95, '#c8bea3'); bez.addColorStop(1, '#e8e0ca');
      mg.fillStyle = bez; rrect(mg, SSG.x - 34, SSG.y - 30, SSG.w + 68, SSG.h + 62, 60); mg.fill();
      mg.fillStyle = '#4a4538'; rrect(mg, SSG.x - 10, SSG.y - 8, SSG.w + 20, SSG.h + 16, 50); mg.fill();
      mg.globalCompositeOperation = 'destination-out'; rrect(mg, SSG.x, SSG.y, SSG.w, SSG.h, SSG.r); mg.fill();
      mg.globalCompositeOperation = 'source-over';
      // chin: badge, controls
      mg.fillStyle = 'rgba(80,72,52,0.55)'; mg.font = `italic 900 22px ${SSF}`; mg.textAlign = 'left'; mg.fillText('SVGA', 440, 1012);
      mg.font = `400 22px VT323`; mg.fillStyle = 'rgba(80,72,52,0.6)'; mg.fillText('COLOR MONITOR  1024 × 768', 520, 1011);
      for (let k = 0; k < 4; k++) { mg.fillStyle = '#b3a98e'; rrect(mg, 1200 + k * 44, 992, 30, 18, 4); mg.fill(); mg.fillStyle = 'rgba(0,0,0,0.25)'; mg.fillRect(1200 + k * 44, 1007, 30, 3); }
      mg.fillStyle = '#a99f83'; rrect(mg, 1400, 984, 64, 34, 6); mg.fill(); mg.fillStyle = 'rgba(255,255,255,0.3)'; mg.fillRect(1404, 986, 56, 3);
      mg.fillStyle = 'rgba(70,62,44,0.35)'; for (let k = 0; k < 14; k++) mg.fillRect(860 + k * 14, 34, 6, 22);
      // room
      const room = offscreen(1920, 1080), rgx = room.getContext('2d');
      const wg = rgx.createLinearGradient(0, 0, 0, 1080); wg.addColorStop(0, '#0d1018'); wg.addColorStop(1, '#06070b');
      rgx.fillStyle = wg; rgx.fillRect(0, 0, 1920, 1080);
      for (let k = 0; k < 7000; k++) { rgx.fillStyle = `rgba(255,255,255,${r() * 0.025})`; rgx.fillRect(r() * 1920, r() * 1080, 2, 2); }
      // scanlines + aperture grille, at the tube's 480 lines
      const scan = offscreen(SSG.w, SSG.h), sg = scan.getContext('2d');
      for (let y = 0; y < SSG.h; y += SSG.h / 480) { sg.fillStyle = 'rgba(0,0,0,0.38)'; sg.fillRect(0, y + SSG.h / 480 * 0.55, SSG.w, SSG.h / 480 * 0.45); }
      for (let x = 0; x < SSG.w; x += 3) { sg.fillStyle = 'rgba(0,0,0,0.08)'; sg.fillRect(x, 0, 1, SSG.h); }
      return { stars, mys, segs, confetti, mon, room, scan, scr: offscreen(SS.W, SS.H), blm: offscreen(160, 120) };
    },
    draw(c, t, W, H, st) {
      const g = st.scr.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
      g.fillStyle = '#000'; g.fillRect(0, 0, SS.W, SS.H);
      let glow = '120,140,255', glowA = 0.1, flash = 0;
      const black = [SS_T.mys, SS_T.pipes, SS_T.dvd].some(x => t > x - 0.1 && t < x);
      if (black) glowA = 0;
      else if (t < SS_T.mys) {
        st.warp = E.inQ(seg(t, 1.3, SS_T.mys - 0.1));
        ssStars(g, st, 0.26 * t + 0.9 * E.inQ(seg(t, 1.2, SS_T.mys)) * 1.2);
        glow = '200,210,255'; glowA = 0.06 + st.warp * 0.12;
      } else if (t < SS_T.pipes) {
        ssMystify(g, st, t - SS_T.mys + 3);
        const h = (st.mys[0].h + (t - SS_T.mys + 3) * 60) % 360;
        glow = h < 120 ? '255,120,80' : h < 240 ? '80,255,140' : '120,120,255'; glowA = 0.1;
      } else if (t < SS_T.dvd) {
        ssPipes(g, st, t - SS_T.pipes);
        glow = '180,170,140'; glowA = 0.08 + 0.12 * seg(t, SS_T.pipes, SS_T.dvd);
      } else {
        // the bounce
        const b = ssBadgeAt(t), hit = t >= SS_T.hit;
        let col = SS_COLS[b.hits % SS_COLS.length];
        let x = b.x, y = b.y, s = 1;
        if (t >= SS_T.home - 0.3) {
          // background callback: a slow starfield
          st.warp = 0; ssStars(g, st, 0.05 * t, E.outC(seg(t, SS_T.home - 0.3, SS_T.home + 0.5)) * 0.7);
        }
        if (hit) {
          const u = t - SS_T.hit;
          col = SS_COLS[(b.hits + Math.floor(u * 14)) % SS_COLS.length];
          if (t > SS_T.home) col = SS_COLS[(b.hits + Math.floor((t - SS_T.home) * 2.5)) % SS_COLS.length];
          flash = Math.exp(-u * 7);
          // confetti pixels from the corner
          st.confetti.forEach(p => {
            const px = 6 + Math.cos(p.a) * p.v * u, py = SS.H - 6 + Math.sin(p.a) * p.v * u + 260 * u * u;
            if (u < 1.4 && py < SS.H) { g.fillStyle = p.c; g.globalAlpha = clamp(1.4 - u); g.fillRect(Math.round(px), Math.round(py), p.s, p.s); g.globalAlpha = 1; }
          });
          const h = E.outB(seg(t, SS_T.home, SS_T.home + 0.55), 1.3);
          x = lerp(b.x, (SS.W - SS_B.bw) / 2, h); y = lerp(b.y, (SS.H - SS_B.bh) / 2 - 18, h);
          s = lerp(1, 2.25, h) * (1 + 0.12 * Math.exp(-u * 9) * Math.sin(u * 40));
        }
        if (flash > 0) { g.fillStyle = '#fff'; g.globalAlpha = flash * 0.4; g.fillRect(0, 0, SS.W, SS.H); g.globalAlpha = 1; }
        ssBadge(g, x, y, col, s);
        if (t > SS_T.home + 0.5 && Math.floor(t * 2.2) % 2 === 0) {
          g.font = '400 22px VT323'; g.textAlign = 'center'; g.fillStyle = 'rgba(220,220,220,0.85)'; g.fillText('PRESS ANY KEY', SS.W / 2, 388);
        }
        const rgbc = parseInt(col.slice(1), 16);
        glow = `${rgbc >> 16},${(rgbc >> 8) & 255},${rgbc & 255}`; glowA = 0.12 + flash * 0.35;
      }
      // ----- the room and the tube -----
      const cam = 1 + 0.045 * E.ioS(t / 10) + 0.012 * Math.exp(-Math.max(0, t - SS_T.hit) * 6) * (t > SS_T.hit ? 1 : 0);
      c.save(); c.translate(960, 520); c.scale(cam, cam); c.translate(-960, -520);
      c.drawImage(st.room, -60, -40, 2040, 1160);
      const rg = c.createRadialGradient(960, 512, 200, 960, 512, 1250);
      rg.addColorStop(0, `rgba(${glow},${glowA})`); rg.addColorStop(1, `rgba(${glow},0)`);
      c.fillStyle = rg; c.fillRect(-100, -100, 2120, 1280);
      c.save(); rrect(c, SSG.x, SSG.y, SSG.w, SSG.h, SSG.r); c.clip();
      c.fillStyle = '#121513'; c.fillRect(SSG.x, SSG.y, SSG.w, SSG.h);
      // mode-switch: brightness and width settle after each hand-off
      let jit = 0, amp = 1;
      [SS_T.mys, SS_T.pipes, SS_T.dvd].forEach(x => { if (t >= x && t < x + 0.25) { const u = seg(t, x, x + 0.25); amp = Math.min(amp, E.outQ(u)); jit = (1 - u) * 14 * Math.sin(t * 160); } });
      c.globalCompositeOperation = 'lighter';
      c.imageSmoothingEnabled = true;
      c.globalAlpha = amp;
      c.drawImage(st.scr, SSG.x - 8 + jit, SSG.y - 6, SSG.w + 16, SSG.h + 12);
      // bloom from a tiny copy
      const bg = st.blm.getContext('2d'); bg.globalCompositeOperation = 'source-over'; bg.drawImage(st.scr, 0, 0, 160, 120);
      c.globalAlpha = 0.3 * amp; c.drawImage(st.blm, SSG.x - 30, SSG.y - 24, SSG.w + 60, SSG.h + 48);
      c.globalAlpha = 0.2 * amp; c.drawImage(st.blm, SSG.x - 80, SSG.y - 60, SSG.w + 160, SSG.h + 120);
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      c.drawImage(st.scan, SSG.x, SSG.y);
      // curved glass: darker edges, a soft window reflection
      const vg = c.createRadialGradient(960, 512, 300, 960, 512, 760);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
      c.fillStyle = vg; c.fillRect(SSG.x, SSG.y, SSG.w, SSG.h);
      const hl = c.createLinearGradient(SSG.x, SSG.y, SSG.x + 600, SSG.y + 500);
      hl.addColorStop(0, 'rgba(255,255,255,0.09)'); hl.addColorStop(0.5, 'rgba(255,255,255,0.025)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = hl; c.beginPath(); c.ellipse(SSG.x + 300, SSG.y + 200, 520, 300, -0.5, 0, TAU); c.fill();
      c.restore();
      c.drawImage(st.mon, 0, 0);
      // the screen lights its own bezel
      c.save(); c.globalCompositeOperation = 'soft-light';
      const bl = c.createRadialGradient(960, 512, 500, 960, 512, 760); bl.addColorStop(0, `rgba(${glow},${glowA * 2})`); bl.addColorStop(1, `rgba(${glow},0)`);
      c.fillStyle = bl; c.fillRect(296, 16, 1328, 1080); c.restore();
      // power LED
      c.fillStyle = '#4dff6a'; c.shadowColor = '#4dff6a'; c.shadowBlur = 16; c.beginPath(); c.arc(1500, 1001, 6, 0, TAU); c.fill(); c.shadowBlur = 0;
      // sticky note on the bezel
      c.save(); c.translate(1530, 120); c.rotate(0.07);
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(-72, -64, 150, 146);
      const ng = c.createLinearGradient(0, -70, 0, 80); ng.addColorStop(0, '#fff07a'); ng.addColorStop(1, '#f2d84a');
      c.fillStyle = ng; c.fillRect(-78, -72, 150, 146);
      c.fillStyle = 'rgba(0,0,0,0.06)'; c.fillRect(-78, -72, 150, 22);
      text(c, 'back in', -3, -8, { font: 'Caveat, cursive', weight: 600, size: 38, align: 'center', color: '#2a3a8a' });
      text(c, '5 min!', -3, 36, { font: 'Caveat, cursive', weight: 600, size: 38, align: 'center', color: '#2a3a8a' });
      c.restore();
      c.restore();
      // the whole office flashes with the corner hit
      if (flash > 0) { c.fillStyle = `rgba(${glow},${flash * 0.12})`; c.fillRect(0, 0, W, H); }
      vignette(c, W, H, 0.5, '0,0,0');
      grain(c, W, H, t, 0.05, 'overlay');
      const fi = 1 - E.outQ(seg(t, 0, 0.4));
      if (fi > 0) { c.fillStyle = `rgba(0,0,0,${fi})`; c.fillRect(0, 0, W, H); }
    },
    score(A) {
      A.bus.gain.value = 0.8;
      // office hum: CRT 60 Hz, fan hiss, flyback whine
      A.osc(0, { f: 60, dur: 10, g: 0.03, a: 0.3, hold: true, rel: 0.2 });
      A.osc(0, { f: 120, dur: 10, g: 0.012, a: 0.3, hold: true, rel: 0.2 });
      A.noise(0, { type: 'lowpass', f: 500, dur: 10, g: 0.02, a: 0.4, hold: true, rel: 0.3 });
      A.osc(0, { f: 15734, dur: 10, g: 0.003, a: 0.5, hold: true, rel: 0.2 });
      // relay click + degauss thump at each saver hand-off
      const sw = t => { A.noise(t - 0.1, { type: 'highpass', f: 3000, dur: 0.02, g: 0.2 }); A.osc(t - 0.1, { f: 220, f2: 80, dur: 0.06, g: 0.1 }); A.osc(t, { f: 55, f2: 40, dur: 0.35, g: 0.12, vib: [12, 8] }); };
      [SS_T.mys, SS_T.pipes, SS_T.dvd].forEach(sw);
      // starfield: a slow FM-ish pad, then the warp rush
      A.chord(0.1, [57, 64, 71, 74], { type: 'triangle', dur: 2.2, g: 0.03, a: 0.5, hold: true, rel: 0.3, rev: 0.6, width: 0.8, spread: 6 });
      A.noise(1.0, { type: 'bandpass', f: 300, f2: 5000, q: 1.2, dur: 1.25, g: 0.14, swell: 0.95, rev: 0.3 });
      // General-MIDI groove under mystify & pipes
      const B = 60 / 132;
      for (let k = 0; k < 9; k++) {
        const t = SS_T.mys + k * B; if (t > SS_T.dvd - 0.15) break;
        A.kick(t, 0.38); A.hat(t + B / 2, 0.06); if (k % 2) A.snare(t, 0.2, { rev: 0.25 });
        A.osc(t, { type: 'square', f: midi([45, 45, 48, 43][Math.floor(k / 2) % 4]), dur: B * 0.8, g: 0.04, lp: 700 });
      }
      const arp = [69, 72, 76, 79, 81, 79, 76, 72];
      for (let k = 0; k < 16; k++) { const t = SS_T.mys + k * B / 2; if (t > SS_T.pipes - 0.12) break; A.osc(t, { type: 'square', f: midi(arp[k % 8]), dur: 0.14, g: 0.025, lp: 2600, pan: Math.sin(k) * 0.5 }); }
      // pipes: a bubbly blip at each joint
      [0, 0.2, 0.47, 0.6, 0.87, 1.0, 1.27, 1.47, 1.67, 1.87].forEach((d, i) => A.osc(SS_T.pipes + d + 0.05, { f: midi(60 + (i * 5) % 17), f2: midi(72 + (i * 5) % 17), glide: 0.06, dur: 0.12, g: 0.05, rev: 0.3 }));
      A.chord(SS_T.pipes, [48, 55, 62, 67], { type: 'sawtooth', dur: 2.1, g: 0.016, lp: 1200, a: 0.3, hold: true, rel: 0.3, spread: 8, rev: 0.4 });
      // bounce: a blip on each wall hit, suspense under the slow approach
      let prev = ssBadgeAt(SS_T.dvd + 0.1).hits;
      for (let t = SS_T.dvd + 0.1; t < SS_T.hit - 0.01; t += 0.002) { const h = ssBadgeAt(t).hits; if (h !== prev) { A.osc(t, { type: 'square', f: midi(76 + h * 2), dur: 0.09, g: 0.05, lp: 3000 }); A.osc(t, { f: 180, f2: 90, dur: 0.12, g: 0.1 }); prev = h; } }
      A.osc(SS_T.slow, { type: 'sawtooth', f: 55, f2: 110, glide: 0.6, dur: 0.62, g: 0.05, lp: 600, lp2: 2000, a: 0.3 });
      A.noise(SS_T.slow, { type: 'bandpass', f: 800, f2: 4000, q: 2, dur: 0.6, g: 0.07, swell: 0.95 });
      // corner hit: fanfare and a cheering office
      A.impact(SS_T.hit, 0.6);
      A.chord(SS_T.hit, [60, 64, 67, 72, 76], { type: 'sawtooth', dur: 1.3, g: 0.03, lp: 4000, lp2: 1500, lpT: 1.2, a: 0.01, hold: true, rel: 0.5, spread: 10, rev: 0.5, width: 1 });
      A.noise(SS_T.hit + 0.05, { type: 'bandpass', f: 1400, q: 0.6, dur: 1.2, g: 0.08, swell: 0.3, rev: 0.4 });
      for (let i = 0; i < 18; i++) A.clap(SS_T.hit + 0.1 + i * 0.05 + hash(i) * 0.04, 0.05 + hash(i * 3) * 0.04);
      [72, 76, 79, 84].forEach((m, i) => A.osc(SS_T.home + i * 0.09, { type: 'square', f: midi(m), dur: 0.2, g: 0.04, lp: 3500 }));
      A.chord(SS_T.home + 0.36, [48, 60, 64, 67, 72], { type: 'triangle', dur: 1.2, g: 0.04, a: 0.02, rev: 0.6, width: 1 });
      A.bell(SS_T.home + 0.36, midi(84), { g: 0.07, dur: 1.4 });
    },
  });
})();
