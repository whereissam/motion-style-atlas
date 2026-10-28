/* batch g3 — 2D, 3D & Generative: Children's Book · Cel-shaded 3D · Feedback Loops.
   A picture book that opens and turns its own pages, textured with tissue-paper collage, crayon and
   coloured pencil; a toon-shaded sailboat projected in canvas 2D with banded Lambert and inverted-hull
   outlines; and video feedback computed as N recursive, time-delayed, transformed copies of a base
   image — every frame a pure function of t. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, rng, hash, vnoise, midi, text, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,400&family=Bungee&family=Rubik:wght@700;900&family=Syne:wght@700;800&family=IBM+Plex+Mono:wght@500&display=block');
  const PI = Math.PI;
  const FRAU = 'Fraunces, Georgia, serif', BUNG = 'Bungee, Impact, sans-serif', RUB = 'Rubik, sans-serif', SYNE = 'Syne, sans-serif', PLEX = '"IBM Plex Mono", monospace';

  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixC = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
  const rgbaC = (h, a) => `rgba(${hex(h).join(',')},${a})`;
  const lerpHex = (a, b, u) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(u))).toString(16).padStart(2, '0')).join(''); };

  /* =====================================================================
     CHILDREN'S BOOK — a picture book opens on a table: Little Bear walks a
     tissue-paper hill toward the moon, climbs the tallest tree beside a
     deadpan owl, then finds the moon in the pond and lifts it out; the
     last spread carries the title
     ===================================================================== */
  const PB = { table: '#cdbd9f', paper: '#f3ead6', ink: '#2a2220', cream: '#f8efd9', bear: '#8b5a3c', bearL: '#c4925f', moon: '#f6d873' };
  const PB_BW = 1760, PB_BH = 940, PB_P = 880, PB_X = 80, PB_Y = 70, PB_TURN = 0.75;
  const PB_T = { open: 0.45, walk: 1.25, stop: 2.55, turn2: 3.4, climb: 4.2, top: 5.35, owl: 5.85, turn3: 6.5, look: 7.45, dip: 7.8, lift: 8.05, held: 8.75, title: 8.35, end: 9.15 };

  // Seamless 256² texture swatches, used as canvas patterns so a texture travels with its shape.
  function pbSwatch(col, kind, seed) {
    const S = 256, cv = offscreen(S, S), g = cv.getContext('2d'), r = rng(seed);
    const at = (x, y, m, fn) => { for (let ox = -S; ox <= S; ox += S) for (let oy = -S; oy <= S; oy += S) { const px = x + ox, py = y + oy; if (px > -m && px < S + m && py > -m && py < S + m) fn(px, py); } };
    const [R, G, B] = hex(col);
    const shade = (k, a) => `rgba(${clamp(R + k, 0, 255) | 0},${clamp(G + k, 0, 255) | 0},${clamp(B + k, 0, 255) | 0},${a})`;
    g.lineCap = 'round';
    if (kind === 'tissue' || kind === 'gouache') {
      // Carle-style painted tissue: broad translucent brush streaks lighter and darker than the base
      g.fillStyle = col; g.fillRect(0, 0, S, S);
      const n = kind === 'tissue' ? 90 : 55;
      for (let i = 0; i < n; i++) {
        const x = r() * S, y = r() * S, a = (kind === 'tissue' ? -0.6 : 0.15) + (r() - 0.5) * 1.1, len = 40 + r() * 150;
        const w = kind === 'tissue' ? 5 + r() * 26 : 3 + r() * 9, bend = (r() - 0.5) * 60, k = (r() < 0.5 ? 1 : -1) * (14 + r() * 26);
        const al = kind === 'tissue' ? 0.08 + r() * 0.16 : 0.05 + r() * 0.07, dx = Math.cos(a) * len, dy = Math.sin(a) * len;
        g.strokeStyle = shade(k, al); g.lineWidth = w;
        at(x, y, len + w, (px, py) => { g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + dx / 2 - Math.sin(a) * bend, py + dy / 2 + Math.cos(a) * bend, px + dx, py + dy); g.stroke(); });
      }
    } else if (kind === 'crayon') {
      // wax crayon: dense short strokes at one hand angle, then paper tooth punched out
      for (let i = 0; i < 2600; i++) {
        const x = r() * S, y = r() * S, a = 0.95 + (r() - 0.5) * 0.5, len = 8 + r() * 20, w = 1.4 + r() * 2.6, k = (r() - 0.5) * 40, al = 0.45 + r() * 0.5;
        const dx = Math.cos(a) * len, dy = Math.sin(a) * len;
        g.strokeStyle = shade(k, al); g.lineWidth = w;
        at(x, y, len + 4, (px, py) => { g.beginPath(); g.moveTo(px, py); g.lineTo(px + dx, py + dy); g.stroke(); });
      }
    } else {
      // coloured pencil: 45° hatching on a 4 px pitch (tiles exactly), a sparser cross-hatch
      for (let k = 0; k < 64; k++) {
        g.strokeStyle = shade((r() - 0.5) * 30, 0.22 + r() * 0.45); g.lineWidth = 0.9 + r() * 1.1;
        for (let o = -S; o <= S; o += S) { g.beginPath(); g.moveTo(k * 4 + o, 0); g.lineTo(k * 4 + o + S, S); g.stroke(); }
      }
      for (let k = 0; k < 32; k++) {
        if (r() < 0.45) continue;
        g.strokeStyle = shade((r() - 0.5) * 30, 0.1 + r() * 0.2); g.lineWidth = 0.8;
        for (let o = -S; o <= S; o += S) { g.beginPath(); g.moveTo(k * 8 + o, S); g.lineTo(k * 8 + o + S, 0); g.stroke(); }
      }
    }
    if (kind === 'crayon' || kind === 'pencil') {
      g.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < (kind === 'crayon' ? 2200 : 1400); i++) {
        const x = r() * S, y = r() * S, rr = 0.5 + r() * 1.4, a = 0.4 + r() * 0.6;
        g.fillStyle = `rgba(0,0,0,${a})`;
        at(x, y, 3, (px, py) => { g.beginPath(); g.arc(px, py, rr, 0, TAU); g.fill(); });
      }
      g.globalCompositeOperation = 'source-over';
    }
    return cv;
  }
  // Paper: cream base, low-frequency mottling and per-pixel tooth, plus a few fibres.
  function pbPaper(W, H, seed) {
    const cv = offscreen(W, H), g = cv.getContext('2d'), img = g.createImageData(W, H), d = img.data, r = rng(seed);
    const C = 48, GW = Math.ceil(W / C) + 2, GH = Math.ceil(H / C) + 2, lat = new Float32Array(GW * GH);
    for (let i = 0; i < lat.length; i++) lat[i] = r();
    const [R, G, B] = hex(PB.paper);
    for (let y = 0; y < H; y++) {
      const gy = y / C, yi = gy | 0, fy = gy - yi, uy = fy * fy * (3 - 2 * fy);
      for (let x = 0; x < W; x++) {
        const gx = x / C, xi = gx | 0, fx = gx - xi, ux = fx * fx * (3 - 2 * fx), q = yi * GW + xi;
        const m = lerp(lerp(lat[q], lat[q + 1], ux), lerp(lat[q + GW], lat[q + GW + 1], ux), uy) - 0.5;
        const v = m * 12 + (r() - 0.5) * 14, o = (y * W + x) * 4;
        d[o] = R + v; d[o + 1] = G + v; d[o + 2] = B + v * 1.15; d[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    g.lineCap = 'round';
    for (let i = 0; i < 260; i++) {
      const x = r() * W, y = r() * H, a = r() * TAU, l = 6 + r() * 18;
      g.strokeStyle = `rgba(120,95,60,${0.05 + r() * 0.07})`; g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 1) * l * 0.5, y + Math.sin(a + 1) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    return cv;
  }
  function pbTable() {
    const cv = offscreen(960, 540), g = cv.getContext('2d'), r = rng(1982);
    const gr = g.createRadialGradient(480, 250, 60, 480, 270, 640); gr.addColorStop(0, '#d9ccb2'); gr.addColorStop(1, '#a8977a');
    g.fillStyle = gr; g.fillRect(0, 0, 960, 540);
    for (let y = 0; y < 540; y += 2) { g.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.035})`; g.fillRect(0, y, 960, 1); }
    for (let x = 0; x < 960; x += 2) { g.fillStyle = `rgba(80,60,30,${0.015 + r() * 0.035})`; g.fillRect(x, 0, 1, 540); }
    return cv;
  }
  const PB_SW = {
    inkC: ['#2a2220', 'crayon'], cGrass: ['#2e5a33', 'crayon'], cWhite: ['#fbf6e8', 'crayon'], cYellow: ['#f7d44c', 'crayon'], cRed: ['#d23f2c', 'crayon'], cReed: ['#1f3b2c', 'crayon'],
    tBlue: ['#6f97ad', 'tissue'], tTeal: ['#3f6f7c', 'tissue'], tGreen: ['#9cc265', 'tissue'], tGreen2: ['#5b9a55', 'tissue'], tGreen3: ['#2f5e45', 'tissue'],
    tLeaf: ['#7fb04f', 'tissue'], tLeaf2: ['#b9cf5e', 'tissue'], tLeaf3: ['#3f8a4c', 'tissue'], tRed: ['#d9452f', 'tissue'], tMoon: ['#f6d873', 'tissue'], tGrey: ['#8f9bb3', 'tissue'], tOrange: ['#ee8a3a', 'tissue'],
    gBear: [PB.bear, 'gouache'], gBearL: [PB.bearL, 'gouache'], gTree: ['#2f5a45', 'gouache'], gTrunk: ['#6b4a35', 'gouache'], gNavy: ['#2b3f63', 'gouache'], gPond: ['#3a6290', 'gouache'],
    pWhite: ['#ffffff', 'pencil'], pYellow: ['#ffe9a0', 'pencil'], pDark: ['#1f2a3d', 'pencil'], pBrown: ['#3a2618', 'pencil'], pBlue: ['#a9c4e4', 'pencil'],
  };
  function pbPat(g, st, name) {
    let m = st.pc.get(g); if (!m) st.pc.set(g, m = {});
    return m[name] || (m[name] = g.createPattern(st.sw[name], 'repeat'));
  }
  // Fill / stroke the current path with a swatch.
  function pbFill(g, st, name, a = 1, mode) { g.save(); if (mode) g.globalCompositeOperation = mode; g.globalAlpha *= a; g.fillStyle = pbPat(g, st, name); g.fill(); g.restore(); }
  function pbLine(g, st, name, lw, a = 1) { g.save(); g.globalAlpha *= a; g.strokeStyle = pbPat(g, st, name); g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); g.restore(); }
  // Hand-cut blob: an ellipse with a seeded wobbling radius.
  function pbBlob(g, x, y, rx, ry, seed, amp = 0.05, rot = 0) {
    const n = 30, cr = Math.cos(rot), sr = Math.sin(rot);
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const a = i / n * TAU, k = 1 + amp * (Math.sin(a * 2 + seed) * 0.6 + Math.sin(a * 3 + seed * 1.7) * 0.4 + (hash(i + seed * 13) - 0.5) * 0.5);
      const px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k, X = x + px * cr - py * sr, Y = y + px * sr + py * cr;
      i ? g.lineTo(X, Y) : g.moveTo(X, Y);
    }
    g.closePath();
  }
  const pbHillY = (x, y0, amp, fq, seed) => y0 + amp * (vnoise(x * fq, seed) * 0.75 + vnoise(x * fq * 2.7, seed + 5) * 0.25);
  function pbHill(g, y0, amp, fq, seed, bottom = PB_BH + 60) {
    g.beginPath(); g.moveTo(-90, bottom);
    for (let x = -90; x <= PB_BW + 90; x += 14) g.lineTo(x, pbHillY(x, y0, amp, fq, seed) + (hash(x * 0.37 + seed) - 0.5) * 3);
    g.lineTo(PB_BW + 90, bottom); g.closePath();
  }
  function pbSky(g, st, top, mid, bot, hz) {
    const gr = g.createLinearGradient(0, 0, 0, hz); gr.addColorStop(0, top); gr.addColorStop(0.55, mid); gr.addColorStop(1, bot);
    g.fillStyle = gr; g.fillRect(0, 0, PB_BW, PB_BH);
    g.save(); g.globalAlpha = 0.07; g.fillStyle = pbPat(g, st, 'pWhite'); g.fillRect(0, 0, PB_BW, PB_BH); g.restore();
  }
  function pbStars(g, st, t, seed, n, x0, x1, y0, y1, a = 1) {
    const r = rng(seed);
    g.save(); g.strokeStyle = pbPat(g, st, 'cYellow'); g.lineCap = 'round'; g.lineWidth = 3.4;
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, r()), y = lerp(y0, y1, r()), s = 5 + r() * 8, ph = r() * TAU;
      g.globalAlpha = a * (0.7 + 0.3 * Math.sin(t * 2.2 + ph));
      g.beginPath(); g.moveTo(x - s, y); g.lineTo(x + s, y); g.moveTo(x, y - s); g.lineTo(x, y + s); g.stroke();
    }
    g.restore();
  }
  function pbMoon(g, st, x, y, r, seed, glow = 1) {
    pbBlob(g, x, y, r * 1.55, r * 1.55, seed + 2, 0.04); pbFill(g, st, 'pYellow', 0.4 * glow);
    pbBlob(g, x, y, r, r, seed, 0.035); pbFill(g, st, 'tMoon');
    pbBlob(g, x - r * 0.3, y - r * 0.2, r * 0.22, r * 0.18, seed + 5, 0.1); pbFill(g, st, 'tOrange', 0.25, 'multiply');
    pbBlob(g, x + r * 0.28, y + r * 0.3, r * 0.14, r * 0.12, seed + 7, 0.1); pbFill(g, st, 'tOrange', 0.22, 'multiply');
  }
  // Story text set in the illustration, word by word.
  function pbWords(g, s, x, y, t, t0, o = {}) {
    const size = o.size || 48, weight = o.weight || 400, style = o.style ?? 'italic', col = o.color || PB.cream, rate = o.rate || 0.11;
    g.font = `${style} ${weight} ${size}px ${FRAU}`;
    const sp = g.measureText(' ').width;
    let cx = x;
    s.split(' ').forEach((w, i) => {
      const a = E.outC(seg(t, t0 + i * rate, t0 + i * rate + 0.45));
      g.font = `${style} ${weight} ${size}px ${FRAU}`;
      const ww = g.measureText(w).width;
      if (a > 0) text(g, w, cx, y + (1 - a) * 10, { font: FRAU, style, weight, size, color: rgbaC(col, a * (o.alpha ?? 1)) });
      cx += ww + sp;
    });
  }
  // Little Bear: gouache body, crayon line, deadpan dot eyes, a red tissue-paper knit hat.
  function pbBear(g, st, x, y, s, o = {}) {
    const step = o.step || 0, walk = o.walk || 0, lx = o.lx || 0, ly = o.ly || 0, reach = o.reach || 0, climb = o.climb || 0, sit = o.sit || 0;
    const bob = walk * Math.abs(Math.sin(step)) * -6 + (o.tip || 0) * -6;
    g.save(); g.translate(x, y + bob * s); g.scale(s, s * (1 + (o.stretch || 0) * 0.05)); g.rotate(o.lean || 0);
    // legs (standing / walking / sitting with feet forward)
    [-1, 1].forEach(k => {
      const ph = step + (k > 0 ? PI : 0), lift = walk * Math.max(0, Math.sin(ph)) * 12 + climb * Math.max(0, Math.sin((o.armPh || 0) + (k > 0 ? 0 : PI))) * 14;
      const fx = walk * Math.cos(ph) * 8, lxp = lerp(k * 19 + fx, k * 22 + 18, sit), lyp = lerp(-12 - lift, -10, sit);
      pbBlob(g, lxp, lyp, lerp(17, 21, sit), 13, 11 + k * 3, 0.05); pbFill(g, st, 'gBear'); pbLine(g, st, 'inkC', 3.2);
    });
    const by = lerp(-66, -60, sit);
    // arms behind the body when reaching up, in front otherwise
    const arm = (k) => {
      const a = -k * (lerp(0.28, PI - 0.4, reach) + climb * Math.sin((o.armPh || 0) + (k > 0 ? PI : 0)) * 0.45);
      g.save(); g.translate(k * 34, by - 22); g.rotate(a);
      pbBlob(g, 0, 22, 11.5, 26, 61 + k, 0.05); pbFill(g, st, 'gBear'); pbLine(g, st, 'inkC', 3);
      g.restore();
    };
    if (reach > 0.5) { arm(-1); arm(1); }
    pbBlob(g, 0, by, 47, 56, 21, 0.035); pbFill(g, st, 'gBear'); pbLine(g, st, 'inkC', 3.6);
    pbBlob(g, 4 + lx * 4, by + 8, 26, 32, 23, 0.06); pbFill(g, st, 'gBearL', 0.9);
    if (reach <= 0.5) { arm(-1); arm(1); }
    // head, ears, snout
    const hx = lx * 3, hy = by - 74;
    [-1, 1].forEach(k => { pbBlob(g, hx + k * 29, hy - 28, 13, 13, 31 + k, 0.06); pbFill(g, st, 'gBear'); pbLine(g, st, 'inkC', 3); });
    pbBlob(g, hx, hy, 41, 38, 31, 0.03); pbFill(g, st, 'gBear'); pbLine(g, st, 'inkC', 3.6);
    pbBlob(g, hx + lx * 12, hy + 12, 17, 12, 37, 0.06); pbFill(g, st, 'gBearL');
    g.fillStyle = PB.ink; g.beginPath(); g.ellipse(hx + lx * 16, hy + 6, 6, 4.5, 0, 0, TAU); g.fill();
    // eyes: white almonds, pupils that slide, a straight heavy lid (the deadpan)
    [-1, 1].forEach(k => {
      const ex = hx + k * 15 + lx * 9, ey = hy - 7;
      g.fillStyle = '#fbf6ea'; g.beginPath(); g.ellipse(ex, ey, 8.5, 7, 0, 0, TAU); g.fill();
      g.fillStyle = PB.ink; g.beginPath(); g.arc(ex + lx * 3.8, ey + 0.5 + ly * 2.6, 3.7, 0, TAU); g.fill();
      g.strokeStyle = PB.ink; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 9.5, ey - 2.5); g.lineTo(ex + 9.5, ey - 2.5); g.stroke();
      g.fillStyle = PB.bear; g.fillRect(ex - 10, ey - 9, 20, 6.2);
    });
    // knit hat: tissue cone with a pencil shade, ribbed band, crayon bobble
    const sway = o.sway || 0, tipX = hx + 14 + sway * 22, tipY = hy - 100;
    g.beginPath(); g.moveTo(hx - 42, hy - 18); g.quadraticCurveTo(hx - 32, hy - 70, tipX, tipY); g.quadraticCurveTo(hx + 30, hy - 64, hx + 42, hy - 18); g.closePath();
    pbFill(g, st, 'tRed'); pbFill(g, st, 'pBrown', 0.22); pbLine(g, st, 'inkC', 3.2);
    g.beginPath(); g.roundRect(hx - 45, hy - 32, 90, 20, 8); pbFill(g, st, 'tRed'); pbFill(g, st, 'pBrown', 0.35); pbLine(g, st, 'inkC', 3);
    pbBlob(g, tipX, tipY, 11, 11, 71, 0.08); pbFill(g, st, 'cWhite'); pbLine(g, st, 'inkC', 2.6);
    g.restore();
  }
  function pbOwl(g, st, x, y, s, look, lookY = 0) {
    g.save(); g.translate(x, y); g.scale(s, s);
    [-1, 1].forEach(k => { g.beginPath(); g.moveTo(k * 8, -62); g.lineTo(k * 22, -80); g.lineTo(k * 24, -56); g.closePath(); pbFill(g, st, 'tGrey'); pbLine(g, st, 'inkC', 2.6); });
    pbBlob(g, 0, -36, 28, 38, 41, 0.04); pbFill(g, st, 'tGrey'); pbLine(g, st, 'inkC', 3);
    pbBlob(g, 0, -24, 16, 22, 43, 0.06); pbFill(g, st, 'cWhite', 0.55);
    [-1, 1].forEach(k => {
      g.fillStyle = '#fbf6ea'; g.beginPath(); g.arc(k * 11, -50, 10, 0, TAU); g.fill();
      g.strokeStyle = PB.ink; g.lineWidth = 2; g.stroke();
      g.fillStyle = PB.ink; g.beginPath(); g.arc(k * 11 + look * 4.5, -50 + lookY * 3, 4.4, 0, TAU); g.fill();
    });
    g.beginPath(); g.moveTo(-4, -42); g.lineTo(4, -42); g.lineTo(0, -34); g.closePath(); pbFill(g, st, 'tOrange');
    g.restore();
  }
  // Klassen-ish tall narrow tree.
  function pbTallTree(g, st, x, base, h, w, seed) {
    g.save(); g.beginPath(); g.rect(x - 4, base - h * 0.3, 8, h * 0.3 + 30); pbFill(g, st, 'gTrunk'); g.restore();
    pbBlob(g, x, base - h * 0.55, w, h * 0.45, seed, 0.04); pbFill(g, st, 'gTree'); pbFill(g, st, 'pDark', 0.35); pbLine(g, st, 'inkC', 2.4, 0.6);
  }

  // Spread 0: the closed cover (right half only).
  function pbCover(g, st, t) {
    g.save(); g.beginPath(); g.rect(PB_P, 0, PB_P, PB_BH); g.clip();
    g.fillStyle = pbPat(g, st, 'gNavy'); g.fillRect(PB_P, 0, PB_P, PB_BH);
    pbStars(g, st, t, 77, 16, PB_P + 40, PB_BW - 40, 40, 520, 0.9);
    pbMoon(g, st, 1330, 330, 165, 9, 1.1);
    pbHill(g, 790, 40, 0.003, 21); pbFill(g, st, 'tGreen2', 0.95);
    pbHill(g, 850, 26, 0.004, 25); pbFill(g, st, 'tGreen3', 0.9);
    pbBear(g, st, 1180, 805, 0.62, { lx: 0.6, ly: -1 });
    text(g, 'Little Bear', 1320, 640, { font: FRAU, weight: 600, size: 78, align: 'center', color: PB.cream });
    text(g, 'and the Moon', 1320, 712, { font: FRAU, style: 'italic', weight: 400, size: 52, align: 'center', color: rgbaC(PB.cream, 0.9) });
    // cloth spine and an inset frame
    const sg = g.createLinearGradient(PB_P, 0, PB_P + 40, 0); sg.addColorStop(0, 'rgba(10,14,30,0.65)'); sg.addColorStop(1, 'rgba(10,14,30,0)');
    g.fillStyle = sg; g.fillRect(PB_P, 0, 40, PB_BH);
    g.strokeStyle = rgbaC(PB.cream, 0.35); g.lineWidth = 2; g.strokeRect(PB_P + 46, 30, PB_P - 76, PB_BH - 60);
    g.restore();
  }
  // Spread 1: Little Bear wanted the moon.
  function pbS1(g, st, t) {
    const u = t - PB_T.open, P = d => -u * 14 * d;
    pbSky(g, st, '#2e4566', '#6d7ea3', '#f0b88e', 660);
    pbStars(g, st, t, 11, 22, 40, PB_BW - 40, 40, 360, 0.9);
    g.save(); g.translate(P(0.1), 0); pbMoon(g, st, 1330, 215, 92, 5); g.restore();
    g.save(); g.translate(P(0.3), 0); pbHill(g, 610, 70, 0.0028, 3); pbFill(g, st, 'tBlue', 0.95, 'multiply'); g.restore();
    g.save(); g.translate(P(0.6), 0);
    [[130, 170, 30], [215, 230, 36], [1020, 200, 32], [1110, 150, 28], [1560, 240, 36], [1660, 180, 30]].forEach(([x, h, w], i) => pbTallTree(g, st, x, pbHillY(x, 690, 60, 0.0022, 7) + 26, h, w, 90 + i));
    pbHill(g, 690, 60, 0.0022, 7); pbFill(g, st, 'tGreen', 0.95, 'multiply');
    g.restore();
    g.save(); g.translate(P(1), 0);
    pbHill(g, 790, 38, 0.0016, 11); pbFill(g, st, 'tGreen2', 0.95, 'multiply');
    // crayon grass tufts along the crest, a few flowers
    g.beginPath();
    for (let x = -60; x < PB_BW + 80; x += 22 + hash(x) * 14) { const y = pbHillY(x, 790, 38, 0.0016, 11) + 4; for (let k = -1; k <= 1; k++) { g.moveTo(x + k * 4, y); g.lineTo(x + k * 8 + (hash(x + k) - 0.5) * 4, y - 9 - hash(x * 3 + k) * 9); } }
    pbLine(g, st, 'cGrass', 2.6);
    for (let i = 0; i < 9; i++) { const x = 120 + hash(i * 7.1) * 1600, y = pbHillY(x, 790, 38, 0.0016, 11) + 30 + hash(i * 3.3) * 80; pbBlob(g, x, y, 7, 7, i, 0.15); pbFill(g, st, i % 3 ? 'cWhite' : 'cRed'); }
    // the walk: step phase follows distance so feet never slide
    const wk = seg(t, PB_T.walk, PB_T.stop), bx = lerp(-69, 600, E.outQ(wk)) + (t > PB_T.stop ? 0 : 0), walking = 1 - seg(t, PB_T.stop - 0.12, PB_T.stop + 0.05);
    const look = E.ioC(seg(t, PB_T.stop + 0.15, PB_T.stop + 0.5));
    pbBear(g, st, bx, pbHillY(bx, 790, 38, 0.0016, 11) + 8, 1, { step: bx * 0.075, walk: walking * (wk > 0 ? 1 : 0), lx: lerp(0.45, 0.85, look), ly: lerp(0, -1, look), sway: Math.sin(bx * 0.075) * 0.25 * walking + Math.sin(t * 3) * 0.06 });
    g.restore();
    pbWords(g, 'Little Bear wanted the moon.', 110, 160, t, PB_T.walk + 0.1, { size: 54 });
  }
  // Spread 2: the climb (a vertical pan with parallax).
  function pbS2(g, st, t) {
    const v = E.ioS(seg(t, PB_T.climb - 0.05, PB_T.top + 0.1)), lift = (1 - v) * 760, L = d => -lift * d;
    pbSky(g, st, '#1d2d4c', '#33507a', '#4f6f98', PB_BH);
    g.save(); g.translate(0, L(0.15)); pbStars(g, st, t, 23, 26, 40, PB_BW - 40, 30, 900, 0.9); g.restore();
    g.save(); g.translate(0, L(0.05)); pbMoon(g, st, 1500, 150, 72, 15); g.restore();
    g.save(); g.translate(0, L(0.4));
    [[150, 200, 30], [270, 260, 36], [420, 170, 28], [600, 230, 32], [760, 180, 28], [1500, 220, 32], [1650, 170, 28]].forEach(([x, h, w], i) => pbTallTree(g, st, x, pbHillY(x, 820, 50, 0.002, 31) + 26, h, w, 120 + i));
    pbHill(g, 820, 50, 0.002, 31, 1900); pbFill(g, st, 'tTeal', 0.95);
    g.restore();
    g.save(); g.translate(0, L(1));
    pbHill(g, 1600, 25, 0.002, 35, 1900); pbFill(g, st, 'tGreen3', 0.95);
    // the trunk
    g.beginPath();
    for (let i = 0; i <= 20; i++) { const y = lerp(1740, 330, i / 20), w = lerp(46, 18, i / 20); g.lineTo(1150 + Math.sin(i * 0.5) * 10 - w, y); }
    for (let i = 20; i >= 0; i--) { const y = lerp(1740, 330, i / 20), w = lerp(46, 18, i / 20); g.lineTo(1150 + Math.sin(i * 0.5) * 10 + w, y); }
    g.closePath(); pbFill(g, st, 'gTrunk'); pbFill(g, st, 'pBrown', 0.5); pbLine(g, st, 'inkC', 3.2);
    // branches
    const branch = ([x0, y0, x1, y1, w]) => {
      g.beginPath(); g.moveTo(x0, y0 - w); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - w - 8, x1, y1 - 3); g.lineTo(x1, y1 + 3); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + w - 8, x0, y0 + w); g.closePath();
      pbFill(g, st, 'gTrunk'); pbFill(g, st, 'pBrown', 0.5); pbLine(g, st, 'inkC', 2.8);
    };
    [ [1160, 470, 1340, 450, 11], [1150, 900, 980, 860, 12], [1155, 1180, 1330, 1130, 12]].forEach(branch);
    // tissue leaf clusters, layered translucent
    const lv = ['tLeaf', 'tLeaf2', 'tLeaf3'];
    [[1170, 330, 200, 110, 40], [990, 860, 120, 70, 14], [1320, 1100, 130, 70, 14], [1360, 450, 80, 50, 8]].forEach(([cx, cy, rx, ry, n], ci) => {
      const r = rng(300 + ci);
      for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()); pbBlob(g, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d - (ci === 0 ? 30 : 0), 34 + r() * 26, 20 + r() * 12, ci * 50 + i, 0.08, r() * PI); pbFill(g, st, lv[i % 3], 0.88); }
    });
    branch([1150, 430, 960, 412, 13]);
    // Little Bear climbs, steps onto the branch, reaches on tiptoe
    const cl = E.ioS(seg(t, PB_T.climb, PB_T.top)), on = E.ioS(seg(t, PB_T.top, PB_T.top + 0.25));
    const bx = lerp(1102, 1030, on), by = lerp(1615, 418, cl), climbing = t > PB_T.climb && t < PB_T.top ? 1 : 0;
    const reachUp = E.outB(seg(t, PB_T.top + 0.3, PB_T.top + 0.7)), toward = E.ioC(seg(t, PB_T.owl + 0.3, PB_T.owl + 0.5));
    pbBear(g, st, bx, by, 0.92, { climb: climbing, armPh: t * 9, reach: climbing ? 0.85 : reachUp, stretch: reachUp * (0.6 + 0.4 * Math.sin(t * 7)), tip: reachUp * (0.5 + 0.5 * Math.sin(t * 7)), lx: lerp(lerp(0.2, 0.8, reachUp), 1, toward), ly: lerp(lerp(-0.6, -1, reachUp), 0, toward), sway: Math.sin(t * 5) * 0.2 });
    // the owl: stares at the bear, the bear stares back
    const ow = E.ioC(seg(t, PB_T.owl, PB_T.owl + 0.2));
    pbOwl(g, st, 1300, 452, 0.95, lerp(0.3, -1, ow), lerp(0.4, 0, ow));
    g.restore();
    pbWords(g, 'So he climbed the tallest tree.', 110, 160, t, PB_T.climb + 0.05, { size: 54 });
    pbWords(g, 'It was not tall enough.', 110, 236, t, PB_T.top + 0.45, { size: 54 });
  }
  // Spread 3: the moon in the pond, lifted out; the title page.
  function pbS3(g, st, t) {
    const T = PB_T, u = t - T.turn3, P = d => -u * 10 * d;
    pbSky(g, st, '#18233d', '#2b3e62', '#4b6286', 600);
    pbStars(g, st, t, 37, 22, 900, PB_BW - 40, 30, 470, 1); pbStars(g, st, t, 38, 6, 40, 860, 30, 140, 1);
    g.save(); g.translate(P(0.1), 0); pbMoon(g, st, 1560, 165, 74, 25); g.restore();
    g.save(); g.translate(P(0.3), 0); pbHill(g, 540, 50, 0.0024, 41); pbFill(g, st, 'tTeal', 0.95); g.restore();
    g.save(); g.translate(P(0.6), 0);
    [[1240, 150, 28], [1330, 200, 32], [1760, 170, 30]].forEach(([x, h, w], i) => pbTallTree(g, st, x, pbHillY(x, 610, 40, 0.002, 45) + 26, h, w, 160 + i));
    pbHill(g, 610, 40, 0.002, 45); pbFill(g, st, 'tGreen3', 0.97);
    // pond
    pbBlob(g, 1390, 770, 330, 105, 51, 0.025); pbFill(g, st, 'gPond'); pbFill(g, st, 'pBlue', 0.3); pbLine(g, st, 'inkC', 3, 0.7);
    const lift = E.ioC(seg(t, T.lift, T.held)), dip = E.ioS(seg(t, T.dip, T.dip + 0.25)) * (1 - E.ioS(seg(t, T.lift, T.lift + 0.4)));
    // the reflection, in wobbling slices, until he lifts it out
    const rf = 1 - seg(t, T.lift, T.lift + 0.25);
    if (rf > 0) for (let i = 0; i < 6; i++) {
      const k = (i - 2.5) / 3, w = 68 * Math.sqrt(1 - k * k), yy = 772 + (i - 2.5) * 7.5, xo = Math.sin(t * 3.2 + i * 1.3) * 6 * (1 + seg(t, T.dip, T.dip + 0.3) * 2);
      g.beginPath(); g.roundRect(1300 - w + xo, yy - 3, 2 * w, 6, 3); pbFill(g, st, 'tMoon', 0.85 * rf);
    }
    // ripples from the dip
    if (t > T.dip + 0.1) for (let k = 0; k < 3; k++) {
      const age = t - T.dip - 0.1 - k * 0.22; if (age <= 0) continue;
      const rr = 30 + age * 140, a = clamp(1 - age / 1.6);
      g.beginPath(); g.ellipse(1260, 776, rr, rr * 0.28, 0, 0, TAU); pbLine(g, st, 'pBlue', 3, a * 0.9);
    }
    // reeds
    g.beginPath();
    [[1070, 6], [1690, 7], [1730, 5]].forEach(([x0, n]) => { for (let i = 0; i < n; i++) { const x = x0 + (i - n / 2) * 9, h = 60 + hash(x) * 70, sw = Math.sin(t * 1.4 + i) * 4; g.moveTo(x, 790); g.quadraticCurveTo(x + sw, 790 - h / 2, x + sw * 2 + (i - n / 2) * 3, 790 - h); } });
    pbLine(g, st, 'cReed', 3.2);
    // Little Bear on the bank
    const lookDown = E.ioC(seg(t, T.look, T.look + 0.3)), toUs = E.ioC(seg(t, T.end - 0.15, T.end + 0.15));
    const lx = lerp(lerp(0.3, 0.9, lookDown), -0.25, toUs), ly = lerp(lerp(0, 0.9, lookDown) * (1 - lift) + lift * -0.1, 0.1, toUs);
    pbBear(g, st, 1040, 790, 0.95, { sit: 1, lean: dip * 0.22 - lift * 0.04, reach: lerp(lerp(0.15, 0.35, dip), 0.62, lift), lx, ly, sway: Math.sin(t * 2) * 0.08 });
    // the moon he caught
    if (t > T.lift) {
      const mx = lerp(1300, 1060, lift), my = lerp(772, 735, lift) - Math.sin(lift * PI) * 90, mr = lerp(30, 36, lift);
      const gl = g.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 3.4); gl.addColorStop(0, 'rgba(255,236,160,0.45)'); gl.addColorStop(1, 'rgba(255,236,160,0)');
      g.fillStyle = gl; g.fillRect(mx - mr * 4, my - mr * 4, mr * 8, mr * 8);
      pbBlob(g, mx, my, mr, mr, 81, 0.04); pbFill(g, st, 'tMoon'); pbLine(g, st, 'inkC', 2.4, 0.5);
    }
    // fireflies rise once the moon is out
    if (t > T.lift) for (let i = 0; i < 18; i++) {
      const t0 = T.lift + hash(i * 3.1) * 0.6, age = t - t0; if (age <= 0) continue;
      const x = 960 + hash(i * 1.7) * 720 + Math.sin(t * 1.3 + i) * 26, y = 760 - age * (40 + hash(i * 5.3) * 50) - hash(i) * 60, a = clamp(age * 2) * (0.6 + 0.4 * Math.sin(t * 4 + i * 2));
      const fg = g.createRadialGradient(x, y, 0, x, y, 16); fg.addColorStop(0, `rgba(255,240,150,${0.7 * a})`); fg.addColorStop(1, 'rgba(255,240,150,0)');
      g.fillStyle = fg; g.fillRect(x - 16, y - 16, 32, 32);
      g.fillStyle = `rgba(255,250,210,${a})`; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill();
    }
    g.restore();
    pbWords(g, 'Then he looked down.', 110, 160, t, T.turn3 + PB_TURN + 0.1, { size: 54, alpha: 1 - seg(t, T.title - 0.3, T.title) });
    // the title page
    if (t > T.title) {
      pbWords(g, "Children's Book", 110, 250, t, T.title, { size: 92, style: '', weight: 600, rate: 0.14 });
      pbWords(g, 'Animation', 110, 352, t, T.title + 0.3, { size: 92, style: '', weight: 600 });
      const ra = E.outC(seg(t, T.title + 0.6, T.title + 1.1));
      g.fillStyle = rgbaC(PB.moon, ra * 0.9); g.fillRect(114, 392, 230 * ra, 3);
      pbWords(g, 'picture-book illustration in motion', 114, 446, t, T.title + 0.7, { size: 34, rate: 0.06, alpha: 0.85 });
      pbWords(g, 'The End.', 1500, 890, t, T.end + 0.2, { size: 40 });
    }
  }
  const PB_SPREADS = [pbCover, pbS1, pbS2, pbS3];
  function pbRender(st, cv, i, t) {
    const g = cv.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, PB_BW, PB_BH);
    if (i > 0) g.drawImage(st.paper, 0, 0);
    PB_SPREADS[i](g, st, t);
    // unify the page: paper tooth multiplied back over everything
    g.save(); if (i === 0) { g.beginPath(); g.rect(PB_P, 0, PB_P, PB_BH); g.clip(); }
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.55; g.drawImage(st.paper, 0, 0); g.restore();
  }
  // Page turn: the right page swings about the gutter, drawn in strips that foreshorten and lift.
  function pbTurn(c, A, B, p) {
    const P = PB_P, H = PB_BH, th = E.ioS(p) * PI, cw = Math.cos(th), sn = Math.sin(th), front = cw >= 0, ex = P + cw * P;
    c.drawImage(A, 0, 0, P, H, 0, 0, P, H);
    c.drawImage(B, P, 0, P, H, P, 0, P, H);
    // shadow cast on the page beneath
    const sw = 160 * sn + 10, sg = c.createLinearGradient(ex, 0, front ? ex + sw : ex - sw, 0);
    sg.addColorStop(0, `rgba(40,25,10,${0.4 * sn})`); sg.addColorStop(1, 'rgba(40,25,10,0)');
    c.fillStyle = sg; c.fillRect(front ? ex : ex - sw, 0, sw, H);
    const src = front ? A : B, N = 44, hy = u => H * 0.055 * sn * u;
    for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N, x0 = P + cw * u0 * P, x1 = P + cw * u1 * P;
      const dx = Math.min(x0, x1), dw = Math.abs(x1 - x0) + 0.9, lift = hy((u0 + u1) / 2);
      c.drawImage(src, front ? P + u0 * P : P - u1 * P, 0, P / N, H, dx, -lift, dw, H + 2 * lift);
    }
    if (Math.abs(ex - P) > 1) {
      const gr = c.createLinearGradient(P, 0, ex, 0);
      gr.addColorStop(0, `rgba(40,25,10,${0.3 * sn})`); gr.addColorStop(0.55, `rgba(255,250,235,${0.14 * sn})`); gr.addColorStop(1, `rgba(40,25,10,${0.22 * sn})`);
      c.fillStyle = gr; c.beginPath(); c.moveTo(P, 0); c.lineTo(ex, -hy(1)); c.lineTo(ex, H + hy(1)); c.lineTo(P, H); c.closePath(); c.fill();
    }
  }

  MG.film({
    id: 'picturebook', dur: 10, poster: 9.6,
    fonts: [['600 92px Fraunces', "Children's Book Animation Little Bear"], ['italic 400 54px Fraunces', 'Little Bear wanted the moon. So he climbed the tallest tree. picture-book The End.']],
    meta: {
      family: 'C', name: "Children's Book Animation", sub: 'Picture-book Illustration in Motion', era: '1950s —',
      origin: 'Picture-book art carried to the screen with its paper, crayon and paint intact. Morton Schindel\'s Weston Woods "iconographic" films (from 1955) slowly panned across the original book illustrations; Dianne Jackson\'s The Snowman (1982) animated the soft coloured-pencil texture of Raymond Briggs\'s 1978 book; Studio AKA\'s Lost and Found (2008) and Magic Light Pictures\' Julia Donaldson & Axel Scheffler films kept the page\'s look in motion. Eric Carle\'s painted tissue-paper collage and the deadpan restraint of Jon Klassen and Oliver Jeffers shaped the contemporary vocabulary.',
      works: 'Make Way for Ducklings (Weston Woods, 1955) · The Snowman (Dianne Jackson, 1982) · Lost and Found (Philip Hunt / Studio AKA, 2008, from Oliver Jeffers) · The Gruffalo (Jakob Schuh & Max Lang, 2009) · Room on the Broom (Jan Lachauer & Max Lang, 2012) · Eric Carle, The Very Hungry Caterpillar (book, 1969) · Jon Klassen, I Want My Hat Back (book, 2011)',
      tech: ['Paper-tooth crayon & coloured-pencil fills', 'Painted tissue-paper collage (multiply)', 'Page-turn structure', 'Gentle multiplane parallax'],
      accent: '#d9452f',
      motionDNA: 'Unhurried and quiet: the camera drifts, layers slide past each other in shallow parallax, the character does one small thing per page, and the story moves forward by turning the page. Eyes slide sideways instead of faces emoting.',
      visualDNA: 'Cream paper with visible tooth, translucent painted tissue shapes overlapping into darker layers, waxy broken crayon lines, coloured-pencil hatching over flat gouache skies, a small character with dot eyes, and serif story text set in the open sky of the spread.',
      transitions: 'Cover open, page turn, parallax drift, vertical pan, word-by-word text',
      implementation: ['Scanned textures + After Effects / Moho', 'TVPaint', 'Stop-frame cut paper', 'Canvas 2D (texture patterns, strip-drawn page turn)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const sw = {};
      Object.entries(PB_SW).forEach(([k, [col, kind]], i) => { sw[k] = pbSwatch(col, kind, 500 + i * 17); });
      return { sw, pc: new WeakMap(), paper: pbPaper(PB_BW, PB_BH, 1969), table: pbTable(), ca: offscreen(PB_BW, PB_BH), cb: offscreen(PB_BW, PB_BH) };
    },
    draw(c, t, W, H, st) {
      const T = PB_T, S = c.getTransform().a;
      c.imageSmoothingEnabled = true;
      c.drawImage(st.table, 0, 0, W, H);
      // which spread is showing, or which turn is in progress
      const turns = [[T.open, 0, 1], [T.turn2, 1, 2], [T.turn3, 2, 3]];
      let cur = 0, turn = null;
      turns.forEach(([t0, a, b]) => { if (t >= t0 + PB_TURN) cur = b; else if (t >= t0) turn = { a, b, p: (t - t0) / PB_TURN }; });
      if (turn) { pbRender(st, st.ca, turn.a, t); pbRender(st, st.cb, turn.b, t); } else pbRender(st, st.ca, cur, t);
      const open = E.ioC(seg(t, T.open, T.open + PB_TURN)), leftOn = seg(t, T.open + PB_TURN * 0.5, T.open + PB_TURN * 0.95);
      const ox = lerp(-PB_P / 2, 0, open), z = 1 + 0.012 * Math.sin(t * 0.6) + 0.02 * seg(t, 0, 10);
      c.save(); c.translate(960, 540); c.scale(z, z); c.translate(-960 + ox + PB_X, -540 + PB_Y);
      // page block with its shadow on the table
      c.save(); c.shadowColor = 'rgba(60,40,20,0.4)'; c.shadowBlur = 34 * S; c.shadowOffsetY = 14 * S;
      c.fillStyle = '#e9dfc8'; c.fillRect(PB_P, -3, PB_P + 9, PB_BH + 8);
      if (leftOn > 0) { c.globalAlpha = leftOn; c.fillRect(-9, -3, PB_P + 9, PB_BH + 8); }
      c.restore();
      c.strokeStyle = 'rgba(150,130,100,0.6)'; c.lineWidth = 1;
      for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(PB_BW + k * 2, 0); c.lineTo(PB_BW + k * 2, PB_BH); c.stroke(); if (leftOn > 0.5) { c.beginPath(); c.moveTo(-k * 2, 0); c.lineTo(-k * 2, PB_BH); c.stroke(); } }
      if (turn) pbTurn(c, st.ca, st.cb, turn.p); else c.drawImage(st.ca, 0, 0);
      // gutter
      if (leftOn > 0) {
        const gg = c.createLinearGradient(PB_P - 90, 0, PB_P + 90, 0);
        gg.addColorStop(0, 'rgba(50,30,15,0)'); gg.addColorStop(0.5, `rgba(50,30,15,${0.3 * leftOn})`); gg.addColorStop(1, 'rgba(50,30,15,0)');
        c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = gg; c.fillRect(PB_P - 90, 0, 180, PB_BH); c.restore();
      }
      c.restore();
      vignette(c, W, H, 0.28, '40,25,10');
      grain(c, W, H, t, 0.025, 'soft-light');
    },
    score(A) {
      A.bus.gain.value = 0.85;
      const T = PB_T;
      const cel = (t, m, g = 0.06, pan = 0) => A.bell(t, midi(m), { ratios: [1, 3, 5.2], g, dur: 1.3, rev: 0.45, pan });
      const piz = (t, m, g = 0.22, pan = 0) => A.pluck(t, midi(m), { g, dur: 0.8, bright: 0.45, decay: 0.993, lp: 1600, pan });
      const page = t0 => {
        A.noise(t0, { type: 'bandpass', f: 1600, f2: 4200, q: 0.7, dur: 0.65, g: 0.08, swell: 0.55, rev: 0.2 });
        for (let k = 0; k < 6; k++) A.noise(t0 + 0.06 + k * 0.08 + hash(k + t0) * 0.03, { type: 'highpass', f: 3500, dur: 0.02, g: 0.02 });
        A.noise(t0 + PB_TURN - 0.05, { type: 'lowpass', f: 700, dur: 0.14, g: 0.09 });
      };
      page(T.open); page(T.turn2); page(T.turn3);
      // a music-box lullaby in D major, 3/4
      const B = 0.42, pads = [[0.2, [50, 57, 62, 66]], [T.turn2, [47, 54, 59, 62]], [T.turn3, [43, 50, 55, 59, 62]], [T.held, [50, 57, 62, 66, 69]]];
      pads.forEach(([t, ch], i) => { const end = i < pads.length - 1 ? pads[i + 1][0] : 10; A.chord(t, ch, { type: 'triangle', dur: end - t + 0.4, g: 0.018, lp: 1400, a: 0.4, hold: true, rel: 0.5, spread: 5, rev: 0.5, width: 0.8 }); });
      const mel = [[0.3, 74], [0.72, 78], [1.14, 81], [1.56, 78], [1.98, 76], [2.4, 74], [2.82, 73], [4.25, 71], [4.67, 74], [5.09, 78], [5.51, 79], [5.93, 78], [6.35, 76], [7.4, 74], [7.82, 73]];
      mel.forEach(([t, m], i) => cel(t, m, 0.055, i % 2 ? 0.25 : -0.25));
      for (let k = 0; k * B < 9.6; k++) { const t = k * B + 0.3; if (k % 3 === 0) piz(t, t < T.turn2 ? 50 : t < T.turn3 ? 47 : 43, 0.2); else piz(t, t < T.turn2 ? 57 : t < T.turn3 ? 54 : 55, 0.09, 0.3); }
      // footsteps on the hill
      for (let x = -69, last = -1; x < 600; x += 2) { const s = Math.floor((x * 0.075) / PI); if (s !== last && last >= 0) { const u = Math.sqrt(1 - (x + 69) / 669); const tt = lerp(T.stop, T.walk, u); A.noise(tt, { type: 'lowpass', f: 500, dur: 0.06, g: 0.06 }); } last = s; }
      // the climb: a rising pizzicato scale
      [62, 64, 66, 67, 69, 71, 73, 74].forEach((m, i) => piz(T.climb + i * 0.14, m, 0.12, 0.2));
      // owl
      A.osc(T.owl, { f: 420, f2: 380, glide: 0.2, dur: 0.28, g: 0.05, vib: [6, 4], rev: 0.5 });
      A.osc(T.owl + 0.4, { f: 400, f2: 350, glide: 0.25, dur: 0.38, g: 0.05, vib: [6, 4], rev: 0.5 });
      // the dip, the lift
      A.osc(T.dip + 0.1, { f: 900, f2: 260, glide: 0.08, dur: 0.12, g: 0.1 }); A.noise(T.dip + 0.1, { type: 'bandpass', f: 1200, dur: 0.15, g: 0.04 });
      [74, 78, 81, 86, 90, 93].forEach((m, i) => cel(T.lift + i * 0.1, m, 0.045, (i / 5 - 0.5) * 0.8));
      A.osc(T.lift, { f: midi(86), dur: 1.4, g: 0.012, a: 0.6, hold: true, rel: 0.5, vib: [5, 6], rev: 0.7 });
      cel(T.held, 74, 0.07); cel(T.held, 81, 0.05); cel(T.end + 0.2, 86, 0.05); cel(T.end + 0.5, 90, 0.035);
    },
  });

  /* =====================================================================
     CEL-SHADED 3D — a sailboat appears as a plain grey Lambert render and
     a wipe toonifies it (3 hard bands + inverted-hull ink); the camera
     orbits, pulls wide to an island, hard-cuts to a low gust run with
     spray and speed lines, and settles at sunset on the title
     ===================================================================== */
  const CS = { ink: '#1b1530' };
  const CS_T = { wipe0: 0.35, wipe1: 1.45, gust: 5.72, title: 8.3, sub: 8.85 };
  const CS_MAT = ['#ea4a3a', '#f6f2e6', '#dba46a', '#8a5a3a', '#fbf4e2', '#2f7fe0', '#ffcc33', '#f2d38a', '#5cc35a', '#9b6b43', '#7a5233', '#3fae4a', '#9aa0b4', '#ffd3ad', '#2f6ee6', '#ffd23f'];
  const CM = { hull: 0, stripe: 1, deck: 2, mast: 3, sail: 4, sailB: 5, flag: 0, sand: 7, grass: 8, trunk: 9, trunk2: 10, frond: 11, rock: 12, skin: 13, shirt: 14, hat: 15 };
  // ---- a tiny mesh kit ----
  const v3 = {
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  };
  const csMesh = (o = {}) => ({ P: [], F: [], two: !!o.two, water: !!o.water });
  // Grid surface fn(u, v) → point; faces oriented away from ref(u, v) (a point inside the solid).
  function csGrid(m, nu, nv, fn, mat, o = {}) {
    const base = m.P.length, cols = o.wrapU ? nu : nu + 1;
    for (let j = 0; j <= nv; j++) for (let i = 0; i < cols; i++) m.P.push(fn(i / nu, j / nv));
    const id = (i, j) => base + j * cols + (o.wrapU ? i % nu : i);
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      const a = id(i, j), b = id(i + 1, j), c2 = id(i + 1, j + 1), d = id(i, j + 1), uu = (i + 0.5) / nu, vv = (j + 0.5) / nv, mi = mat(uu, vv, i, j);
      [[a, b, c2], [a, c2, d]].forEach(f => {
        if (o.ref) {
          const A = m.P[f[0]], B = m.P[f[1]], C = m.P[f[2]], n = v3.cross(v3.sub(B, A), v3.sub(C, A)), r = o.ref(uu, vv);
          const cen = [(A[0] + B[0] + C[0]) / 3 - r[0], (A[1] + B[1] + C[1]) / 3 - r[1], (A[2] + B[2] + C[2]) / 3 - r[2]];
          if (v3.dot(n, cen) < 0) f = [f[0], f[2], f[1]];
        }
        m.F.push([f[0], f[1], f[2], mi]);
      });
    }
    return m;
  }
  function csFan(m, pts, ctr, mat, ref) {
    const base = m.P.length; m.P.push(ctr, ...pts);
    for (let i = 0; i < pts.length; i++) {
      const f = [base, base + 1 + i, base + 1 + ((i + 1) % pts.length)], A = m.P[f[0]], B = m.P[f[1]], C = m.P[f[2]];
      const n = v3.cross(v3.sub(B, A), v3.sub(C, A)), cen = v3.sub([(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3, (A[2] + B[2] + C[2]) / 3], ref);
      m.F.push(v3.dot(n, cen) < 0 ? [f[0], f[2], f[1], mat] : [...f, mat]);
    }
  }
  // Face normals, smooth vertex normals (shading), position-welded normals (outline), boundary edges.
  function csFinish(m) {
    const n = m.P.length, N = new Float64Array(n * 3), FN = [];
    m.F.forEach(f => {
      const A = m.P[f[0]], B = m.P[f[1]], C = m.P[f[2]], c = v3.cross(v3.sub(B, A), v3.sub(C, A)), l = Math.hypot(c[0], c[1], c[2]);
      FN.push(l > 1e-9 ? [c[0] / l, c[1] / l, c[2] / l] : null);
      if (l > 1e-9) for (let k = 0; k < 3; k++) { N[f[k] * 3] += c[0]; N[f[k] * 3 + 1] += c[1]; N[f[k] * 3 + 2] += c[2]; }
    });
    const key = p => `${Math.round(p[0] * 500)},${Math.round(p[1] * 500)},${Math.round(p[2] * 500)}`, W = new Map();
    for (let i = 0; i < n; i++) { const k = key(m.P[i]); const w = W.get(k) || [0, 0, 0]; w[0] += N[i * 3]; w[1] += N[i * 3 + 1]; w[2] += N[i * 3 + 2]; W.set(k, w); }
    const NO = new Float64Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = v3.norm([N[i * 3], N[i * 3 + 1], N[i * 3 + 2]]); N[i * 3] = a[0]; N[i * 3 + 1] = a[1]; N[i * 3 + 2] = a[2];
      const w = v3.norm(W.get(key(m.P[i]))); NO[i * 3] = w[0]; NO[i * 3 + 1] = w[1]; NO[i * 3 + 2] = w[2];
    }
    if (m.two) {
      const ek = (a, b) => (a < b ? a + '_' + b : b + '_' + a), cnt = new Map();
      m.F.forEach(f => [[0, 1], [1, 2], [2, 0]].forEach(([i, j]) => { const k = ek(f[i], f[j]); cnt.set(k, (cnt.get(k) || 0) + 1); }));
      m.BE = m.F.map(f => [[0, 1], [1, 2], [2, 0]].map(([i, j]) => cnt.get(ek(f[i], f[j])) === 1));
    }
    m.N = N; m.NO = NO; m.FN = FN;
    return m;
  }
  const csSphere = (m, c, rx, ry, rz, nu, nv, mat, v0 = 0, v1 = 1) => csGrid(m, nu, nv, (u, v) => { const th = lerp(v0, v1, v) * PI, ph = u * TAU; return [c[0] + rx * Math.sin(th) * Math.cos(ph), c[1] + ry * Math.cos(th), c[2] + rz * Math.sin(th) * Math.sin(ph)]; }, mat, { wrapU: true, ref: () => c });
  // ---- the boat ----
  const hb = u => 0.74 * Math.pow(clamp(1 - Math.pow((u - 0.36) / 0.64, 2)), 0.5);
  const htop = u => 0.62 + 0.3 * u * u * u;
  const hkeel = u => -0.5 * Math.pow(Math.sin(PI * clamp(u * 0.85 + 0.08)), 0.6);
  const hullPt = (u, v) => { const b = hb(u), top = htop(u), k = hkeel(u), a = PI * v; return [lerp(-2, 2.15, u), top - (top - k) * Math.pow(Math.sin(a), 0.85), -Math.cos(a) * b]; };
  function csBuildHull() {
    const m = csMesh({ water: true });
    csGrid(m, 22, 12, hullPt, (u, v) => (v < 0.09 || v > 0.91 ? CM.stripe : CM.hull), { ref: u => [lerp(-2, 2.15, u), 0.15, 0] });
    csGrid(m, 22, 2, (u, v) => [lerp(-2, 2.15, u), htop(u) + 0.05 * Math.sin(PI * v), lerp(-hb(u), hb(u), v)], () => CM.deck, { ref: u => [lerp(-2, 2.15, u), htop(u) - 0.4, 0] });
    const ring = []; for (let j = 0; j <= 12; j++) ring.push(hullPt(0, j / 12));
    csFan(m, ring, [-2, 0.25, 0], CM.hull, [-1.4, 0.25, 0]);
    // sailor: body, head, beanie with a pompom
    csSphere(m, [-1.05, 0.87, 0], 0.28, 0.34, 0.26, 10, 7, () => CM.shirt);
    csSphere(m, [-1.05, 1.42, 0], 0.25, 0.25, 0.25, 12, 8, () => CM.skin);
    csSphere(m, [-1.05, 1.47, 0], 0.27, 0.27, 0.27, 12, 4, () => CM.hat, 0, 0.5);
    csSphere(m, [-1.05, 1.78, 0], 0.08, 0.08, 0.08, 6, 4, () => CM.hat);
    // mast
    csGrid(m, 6, 1, (u, v) => [0.35 + 0.06 * Math.cos(u * TAU), lerp(0.6, 3.75, v), 0.06 * Math.sin(u * TAU)], () => CM.mast, { wrapU: true, ref: (u, v) => [0.35, lerp(0.6, 3.75, v), 0] });
    return csFinish(m);
  }
  // Sails, boom and flag change with wind every frame.
  function csBuildRig(t, B) {
    const sw = B.swing, cs = Math.cos(sw), sn = Math.sin(sw), mx = 0.35;
    const rot = p => { const dx = p[0] - mx, dz = p[2]; return [mx + dx * cs + dz * sn, p[1], -dx * sn + dz * cs]; };
    const sail = csMesh({ two: true });
    csGrid(sail, 6, 8, (u, v) => { const y = lerp(1.04, 3.55, v), xl = lerp(-1.55, mx, v); return rot([lerp(mx, xl, u), y, B.bulge * Math.sin(PI * u) * (1 - 0.65 * v) + 0.02 * Math.sin(t * 9 + v * 6) * u]); }, (u, v, i, j) => (j === 2 ? CM.sailB : CM.sail));
    const jib = csMesh({ two: true }), tack = [2.05, 0.84, 0], head = [0.4, 3.2, 0], clew = [0.62, 0.98, 0.35 + 0.4 * B.gust];
    csGrid(jib, 4, 6, (u, v) => { const L = [lerp(tack[0], head[0], v), lerp(tack[1], head[1], v), 0], R = [lerp(clew[0], head[0], v), lerp(clew[1], head[1], v), lerp(clew[2], 0, v)]; return [lerp(L[0], R[0], u), lerp(L[1], R[1], u), lerp(L[2], R[2], u) + B.bulge * 0.6 * Math.sin(PI * u) * (1 - v)]; }, () => CM.sail);
    const boom = csMesh();
    csGrid(boom, 6, 1, (u, v) => rot([lerp(mx, -1.6, v), 1.0 + 0.05 * Math.cos(u * TAU), 0.05 * Math.sin(u * TAU)]), () => CM.mast, { wrapU: true, ref: (u, v) => rot([lerp(mx, -1.6, v), 1.0, 0]) });
    const flag = csMesh({ two: true });
    csGrid(flag, 4, 1, (u, v) => [mx - 0.55 * u, 3.62 + lerp(-0.13, 0.13, v) * (1 - u * 0.75), 0.13 * Math.sin(u * 4 - t * 13) * u + 0.15 * u], () => CM.flag);
    return [csFinish(sail), csFinish(jib), csFinish(boom), csFinish(flag)];
  }
  // ---- the island ----
  const CS_ISL = [30, 0, 7], CS_IR = 6.2;
  const islY = v => 2.0 * (1 - Math.pow(v, 2.2)) - 0.6 * Math.pow(v, 4);
  function csBuildIsland() {
    const m = csMesh({ water: true }), [X, , Z] = CS_ISL;
    csGrid(m, 28, 9, (u, v) => { const rr = v * CS_IR * (1 + 0.09 * Math.sin(u * TAU * 3 + 1) + 0.05 * Math.sin(u * TAU * 7)); return [X + rr * Math.cos(u * TAU), islY(v), Z + rr * Math.sin(u * TAU)]; }, (u, v) => (islY(v) < 0.5 ? CM.sand : CM.grass), { wrapU: true, ref: () => [X, -1, Z] });
    csSphere(m, [X + 4.6, 0.1, Z - 3.3], 0.9, 0.7, 0.8, 8, 6, () => CM.rock);
    csSphere(m, [X + 5.3, 0.0, Z - 2.4], 0.5, 0.45, 0.5, 7, 5, () => CM.rock);
    const palm = (bx, bz, h, lx, lz, seed) => {
      const by = islY(Math.hypot(bx - X, bz - Z) / CS_IR) - 0.1, c = v => [bx + lx * v * v, by + h * v, bz + lz * v * v];
      csGrid(m, 6, 6, (u, v) => { const p = c(v), r = 0.17 * (1 - 0.4 * v); return [p[0] + r * Math.cos(u * TAU), p[1], p[2] + r * Math.sin(u * TAU)]; }, (u, v, i, j) => (j % 2 ? CM.trunk2 : CM.trunk), { wrapU: true, ref: (u, v) => c(v) });
      const top = c(1);
      csSphere(m, [top[0], top[1] - 0.05, top[2]], 0.2, 0.18, 0.2, 6, 4, () => CM.trunk2);
      const fr = csMesh({ two: true });
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * TAU + seed, d = [Math.cos(a), 0, Math.sin(a)], sd = [-Math.sin(a), 0, Math.cos(a)], len = 1.9 + 0.3 * Math.sin(i * 2.3 + seed);
        csGrid(fr, 2, 5, (u, v) => { const w = 0.38 * Math.pow(Math.sin(PI * Math.min(1, v * 1.08 + 0.02)), 0.8) + 0.02, o = (u - 0.5) * 2 * w; return [top[0] + d[0] * len * v + sd[0] * o, top[1] + 0.4 * v - 1.25 * v * v - Math.abs(o) * 0.35, top[2] + d[2] * len * v + sd[2] * o]; }, () => CM.frond);
      }
      return csFinish(fr);
    };
    const f1 = palm(X - 1.6, Z + 1.0, 3.3, 0.7, 0.3, 0.4), f2 = palm(X + 1.4, Z - 1.6, 2.6, -0.5, -0.4, 1.7), f3 = palm(X - 0.2, Z - 2.8, 2.2, 0.2, -0.6, 2.9);
    return [csFinish(m), f1, f2, f3];
  }
  // ---- motion ----
  function csBoat(t) {
    const pos = tt => [1.3 * tt + 5.2 * E.ioS(seg(tt, 5.6, 8.4)), 0, 0.7 * Math.sin(tt * 0.3)];
    const p = pos(t), q = pos(t + 0.02), gust = E.ioS(seg(t, 5.6, 6.1)) * (1 - E.ioS(seg(t, 7.2, 8.3)));
    return {
      p, gust, yaw: -Math.atan2(q[2] - p[2], q[0] - p[0]), y: 0.07 * Math.sin(2.1 * t), pitch: 0.035 * Math.sin(1.7 * t + 1) + 0.05 * gust * Math.sin(t * 6),
      roll: -0.05 * Math.sin(1.3 * t) + 0.3 * gust, swing: 0.42 + 0.12 * gust, bulge: 0.28 + 0.22 * gust,
    };
  }
  const m3 = (yaw, pitch, roll) => {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    // Ry(yaw) · Rz(pitch) · Rx(roll)
    const Rz = [cp, -sp, 0, sp, cp, 0, 0, 0, 1], Rx = [1, 0, 0, 0, cr, -sr, 0, sr, cr], Ry = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
    const mul = (A, B) => { const o = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o.push(A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]); return o; };
    return mul(Ry, mul(Rz, Rx));
  };
  const mv = (R, p) => [R[0] * p[0] + R[1] * p[1] + R[2] * p[2], R[3] * p[0] + R[4] * p[1] + R[5] * p[2], R[6] * p[0] + R[7] * p[1] + R[8] * p[2]];
  // camera keys in the boat's heading frame: t, azimuth, radius, height, target xyz, roll, focal, ease into this key
  const CS_CAM = [
    [0.0, -0.80, 6.4, 1.5, 0.1, 1.45, 0.0, 0.0, 1150],
    [1.6, -0.90, 7.0, 1.85, 0.0, 1.5, 0.0, 0.0, 1150, E.ioS],
    [3.9, -2.15, 8.4, 2.8, 0.3, 1.4, 0.0, 0.0, 1150, E.ioS],
    [5.7, -2.55, 16.5, 7.4, 7.5, 0.4, 2.0, 0.0, 1150, E.ioC],
    [5.72, -1.25, 4.9, 0.7, 0.8, 1.25, 0.0, -0.1, 880, E.lin],
    [7.3, -1.9, 4.5, 0.85, 0.0, 1.3, 0.0, 0.06, 950, E.lin],
    [8.2, -2.55, 9.4, 2.3, 5.5, 1.9, 1.6, 0.0, 1150, E.ioC],
    [10, -2.62, 10.0, 2.5, 5.5, 2.0, 1.6, 0.0, 1150, E.ioS],
  ];
  function csCamera(t, B) {
    const K = CS_CAM; let i = 1; while (i < K.length - 1 && t > K[i][0]) i++;
    const a = K[i - 1], b = K[i], u = (b[9] || E.ioS)(seg(t, a[0], b[0])), L = j => lerp(a[j], b[j], u);
    const az = L(1), r = L(2), Ry = m3(B.yaw, 0, 0);
    const off = mv(Ry, [r * Math.cos(az), 0, r * Math.sin(az)]), tg = mv(Ry, [L(4), 0, L(6)]);
    const e = [B.p[0] + off[0], L(3), B.p[2] + off[2]], ta = [B.p[0] + tg[0], L(5), B.p[2] + tg[2]];
    const w = v3.norm(v3.sub(ta, e)), uu = v3.norm(v3.cross(w, [0, 1, 0])), vv = v3.cross(uu, w), ro = L(7) + (t > 5.72 && t < 7.4 ? 0.03 * Math.sin(t * 5) : 0);
    return { e, u: uu, v: vv, w, f: L(8), cr: Math.cos(ro), sr: Math.sin(ro) };
  }
  function csP(C, x, y, z, o) {
    const dx = x - C.e[0], dy = y - C.e[1], dz = z - C.e[2];
    const X = dx * C.u[0] + dy * C.u[1] + dz * C.u[2], Y = dx * C.v[0] + dy * C.v[1] + dz * C.v[2], Z = dx * C.w[0] + dy * C.w[1] + dz * C.w[2];
    const xr = X * C.cr - Y * C.sr, yr = X * C.sr + Y * C.cr;
    o[0] = 960 + C.f * xr / Z; o[1] = 540 - C.f * yr / Z; o[2] = Z;
    return o;
  }
  // Sutherland–Hodgman against fd(p) ≥ 0; all attributes interpolate.
  function clipHalf(pts, fd) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], da = fd(a), db = fd(b);
      if (da >= 0) out.push(a);
      if ((da >= 0) !== (db >= 0)) { const k = da / (da - db); out.push(a.map((v, j) => v + (b[j] - v) * k)); }
    }
    return out;
  }
  const CS_B1 = 0.04, CS_B2 = 0.8;
  // Project one mesh into the item list: banded faces + (for closed meshes) inverted-hull ink.
  function csEmit(items, C, L, m, R, T, pal, plain, lw) {
    const n = m.P.length, wp = new Float64Array(n * 3), wo = new Float64Array(n * 3), s = new Float64Array(n), q = [0, 0, 0];
    for (let i = 0; i < n; i++) {
      const p = mv(R, m.P[i]); wp[i * 3] = p[0] + T[0]; wp[i * 3 + 1] = p[1] + T[1]; wp[i * 3 + 2] = p[2] + T[2];
      const nn = mv(R, [m.N[i * 3], m.N[i * 3 + 1], m.N[i * 3 + 2]]); s[i] = nn[0] * L[0] + nn[1] * L[1] + nn[2] * L[2];
      if (!m.two && !plain) {
        const no = mv(R, [m.NO[i * 3], m.NO[i * 3 + 1], m.NO[i * 3 + 2]]), z = Math.max(0.1, csP(C, wp[i * 3], wp[i * 3 + 1], wp[i * 3 + 2], q)[2]), k = lw * z / C.f;
        wo[i * 3] = wp[i * 3] + no[0] * k; wo[i * 3 + 1] = wp[i * 3 + 1] + no[1] * k; wo[i * 3 + 2] = wp[i * 3 + 2] + no[2] * k;
      }
    }
    for (let fi = 0; fi < m.F.length; fi++) {
      const f = m.F[fi], fn0 = m.FN[fi]; if (!fn0) continue;
      const fn = mv(R, fn0), a = f[0] * 3, b = f[1] * 3, c = f[2] * 3;
      const cx = (wp[a] + wp[b] + wp[c]) / 3 - C.e[0], cy = (wp[a + 1] + wp[b + 1] + wp[c + 1]) / 3 - C.e[1], cz = (wp[a + 2] + wp[b + 2] + wp[c + 2]) / 3 - C.e[2];
      const front = fn[0] * cx + fn[1] * cy + fn[2] * cz < 0;
      const tri = (W, sg) => [[W[a], W[a + 1], W[a + 2], s[f[0]] * sg], [W[b], W[b + 1], W[b + 2], s[f[1]] * sg], [W[c], W[c + 1], W[c + 2], s[f[2]] * sg]];
      const project = poly => {
        const out = []; let zs = 0;
        for (const p of poly) { csP(C, p[0], p[1], p[2], q); if (q[2] < 0.08) return null; out.push([q[0], q[1], p[3]]); zs += q[2]; }
        return { pts: out, z: zs / poly.length };
      };
      if (!front && !m.two) {
        if (plain) continue;
        let poly = tri(wo, 1); if (m.water) poly = clipHalf(poly, p => p[1]); if (poly.length < 3) continue;
        const pr = project(poly); if (!pr) continue;
        items.push({ z: pr.z + 0.12, pts: pr.pts, col: CS.ink });
        continue;
      }
      let poly = tri(wp, front ? 1 : -1); if (m.water) poly = clipHalf(poly, p => p[1]); if (poly.length < 3) continue;
      const pr = project(poly); if (!pr) continue;
      const P3 = pal[f[3]];
      let edges = null;
      if (m.two && m.BE) { const be = m.BE[fi], tp = project(tri(wp, 1)); if (tp) { edges = []; [[0, 1], [1, 2], [2, 0]].forEach(([i, j], k) => { if (be[k]) edges.push(tp.pts[i], tp.pts[j]); }); } }
      if (plain) {
        const fs = (fn[0] * L[0] + fn[1] * L[1] + fn[2] * L[2]) * (front ? 1 : -1), g = Math.round(70 + 150 * clamp(0.2 + 0.8 * fs));
        items.push({ z: pr.z, pts: pr.pts, col: `rgb(${g},${g},${g + 4})` });
        continue;
      }
      // split the polygon at the ramp thresholds so band edges are smooth across faces
      const lo = Math.min(...pr.pts.map(p => p[2])), hi = Math.max(...pr.pts.map(p => p[2]));
      const bands = [[-9, CS_B1, P3[0]], [CS_B1, CS_B2, P3[1]], [CS_B2, 9, P3[2]]];
      bands.forEach(([b0, b1, col], bi) => {
        if (hi < b0 || lo >= b1) return;
        let pp = pr.pts;
        if (lo < b0) pp = clipHalf(pp, p => p[2] - b0);
        if (hi >= b1) pp = clipHalf(pp, p => b1 - p[2]);
        if (pp.length >= 3) items.push({ z: pr.z - bi * 1e-4, pts: pp, col, edges: bi === 0 ? edges : null });
      });
      if (edges && !bands.some(([b0, b1], bi) => bi === 0 && !(hi < b0 || lo >= b1))) items.push({ z: pr.z - 3e-4, pts: [], col: null, edges });
    }
  }
  function csPalette(sun, plain) {
    const sh = lerpHex('#3c428f', '#5a2470', sun), li = lerpHex('#ffffff', '#ffcf8a', sun);
    return CS_MAT.map(c0 => { const c = lerpHex(c0, '#ff9a5a', 0.14 * sun); return [mixC(c, sh, 0.42), c, mixC(c, li, 0.5)]; });
  }
  // Wind-Waker-ish cloud: ink rim, lavender shadow band, white top, a swirl.
  const CS_CLOUDS = [[0.05, 0.13, 70, 1], [0.6, 0.2, 60, 2], [1.3, 0.11, 75, 3], [2.2, 0.17, 65, 4], [2.9, 0.12, 80, 5], [3.7, 0.22, 55, 6], [4.5, 0.14, 70, 7], [5.3, 0.18, 60, 8], [-0.45, 0.09, 50, 9]];
  function csCloud(c, x, y, s, seed, sun) {
    const r = rng(seed * 31), puffs = [];
    for (let i = 0; i < 6; i++) { const dx = lerp(-1, 1, i / 5) + (r() - 0.5) * 0.25, rr = (0.28 + r() * 0.22) * (1 - Math.abs(dx) * 0.35); puffs.push([dx, -rr * 0.6 - r() * 0.15, rr]); }
    const path = (k, oy = 0, rk = 1) => { c.beginPath(); puffs.forEach(([dx, dy, rr]) => { c.moveTo(x + dx * s + (rr * rk * s + k), y + (dy + oy) * s); c.arc(x + dx * s, y + (dy + oy) * s, rr * rk * s + k, 0, TAU); }); };
    c.save(); c.beginPath(); c.rect(x - 2 * s, y - 2 * s, 4 * s, 2 * s + 2); c.clip();
    path(4); c.fillStyle = CS.ink; c.fill();
    path(0); c.fillStyle = lerpHex('#b9b7ee', '#c97a9c', sun); c.fill();
    c.save(); path(0); c.clip(); path(0, -0.14, 0.92); c.fillStyle = lerpHex('#ffffff', '#ffe2c8', sun); c.fill(); c.restore();
    c.restore();
    c.fillStyle = CS.ink; c.fillRect(x - 1.3 * s, y - 2, 2.6 * s, 4);
    const [dx, dy, rr] = puffs[2];
    c.strokeStyle = CS.ink; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath();
    for (let k = 0; k <= 24; k++) { const a = k / 24 * TAU * 1.3, rad = rr * s * 0.55 * (1 - k / 30); const px = x + dx * s + Math.cos(a) * rad, py = y + dy * s + Math.sin(a) * rad * 0.8; k ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke();
  }
  function csRender(c, st, t, plain) {
    const B = csBoat(t), C = csCamera(t, B), sun = plain ? 0 : E.ioS(seg(t, 4.0, 8.3)), q = [0, 0, 0];
    const dayL = v3.norm([-0.25, 0.85, -0.5]), sunD = v3.norm([1, 0.16, 0.42]), L = v3.norm(dayL.map((v, i) => lerp(v, lerp(v, sunD[i], 0.45), sun)));
    const pal = csPalette(sun, plain);
    // sky
    const hz = []; for (let k = -16; k <= 16; k++) {
      const fx = C.w[0], fz = C.w[2], fl = Math.hypot(fx, fz) || 1, a = Math.atan2(fz / fl, fx / fl) + k * 0.075;
      csP(C, C.e[0] + Math.cos(a) * 3000, 0, C.e[2] + Math.sin(a) * 3000, q); if (q[2] > 0) hz.push([q[0], q[1]]);
    }
    const hy = hz.length ? hz[hz.length >> 1][1] : 540;
    const sk = c.createLinearGradient(0, hy - 900, 0, hy);
    if (plain) { sk.addColorStop(0, '#9a9ca2'); sk.addColorStop(1, '#d4d5d8'); }
    else { sk.addColorStop(0, lerpHex('#2f8ff5', '#3b3a8c', sun)); sk.addColorStop(0.6, lerpHex('#6cc0ff', '#d9668a', sun)); sk.addColorStop(1, lerpHex('#c9eeff', '#ffc37a', sun)); }
    c.fillStyle = sk; c.fillRect(0, 0, 1920, 1080);
    if (!plain) {
      // sun with a hard ring
      csP(C, C.e[0] + sunD[0] * 900, C.e[1] + sunD[1] * 900, C.e[2] + sunD[2] * 900, q);
      if (q[2] > 0) { const R = C.f * 0.055; c.fillStyle = rgbaC(lerpHex('#fff7c8', '#ffd98a', sun), 0.45); c.beginPath(); c.arc(q[0], q[1], R * 1.7, 0, TAU); c.fill(); c.fillStyle = lerpHex('#fffbe6', '#fff0b0', sun); c.beginPath(); c.arc(q[0], q[1], R, 0, TAU); c.fill(); }
      CS_CLOUDS.forEach(([az, el, sz, seed]) => {
        const d = [Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)];
        csP(C, C.e[0] + d[0] * 700, C.e[1] + d[1] * 700, C.e[2] + d[2] * 700, q);
        if (q[2] > 0 && q[0] > -600 && q[0] < 2520) csCloud(c, q[0], q[1], C.f * sz / q[2], seed, sun);
      });
    }
    // sea in hard distance bands
    const ring = R => { const out = []; const fl = Math.hypot(C.w[0], C.w[2]) || 1, a0 = Math.atan2(C.w[2] / fl, C.w[0] / fl); for (let k = -18; k <= 18; k++) { const a = a0 + k * 0.07; csP(C, C.e[0] + Math.cos(a) * R, 0, C.e[2] + Math.sin(a) * R, q); if (q[2] > 0.1) out.push([q[0], q[1]]); } return out; };
    const band = (R, col) => { const pts = ring(R); if (pts.length < 2) return; c.beginPath(); c.moveTo(-200, 1300); pts.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(2200, pts[pts.length - 1][1]); c.lineTo(2200, 1300); c.closePath(); c.fillStyle = col; c.fill(); };
    if (plain) { band(3000, '#7d8085'); band(40, '#6c6f74'); }
    else { band(3000, lerpHex('#7fe0f0', '#ffb08a', sun)); band(120, lerpHex('#36b5e0', '#c36d8e', sun)); band(45, lerpHex('#1d8ccf', '#6a4c96', sun)); band(18, lerpHex('#1474bd', '#4d3a85', sun)); }
    const items = [];
    if (!plain) {
      // foam crests on a world lattice
      c.strokeStyle = rgbaC('#ffffff', 0.92); c.lineCap = 'round';
      const G = 5, ex = C.e[0], ez = C.e[2];
      for (let i = Math.floor((ex - 48) / G); i <= Math.ceil((ex + 48) / G); i++) for (let j = Math.floor((ez - 48) / G); j <= Math.ceil((ez + 48) / G); j++) {
        const h = hash(i * 17.3 + j * 91.7), x = i * G + h * G, z = j * G + hash(i * 3.1 + j * 7.7) * G, life = Math.sin(t * 1.6 + h * 40);
        if (life < 0.15) continue;
        const dxw = x - ex, dzw = z - ez; if (dxw * dxw + dzw * dzw > 48 * 48) continue;
        const len = 0.5 + h * 0.7, pts = [];
        for (let k = 0; k <= 4; k++) { const s2 = k / 2 - 1; csP(C, x + s2 * len, 0, z - 0.25 * (1 - s2 * s2), q); if (q[2] < 0.5) { pts.length = 0; break; } pts.push([q[0], q[1], q[2]]); }
        if (pts.length < 5 || pts[2][2] < 5 || pts[2][0] < -50 || pts[2][0] > 1970 || pts[2][1] < hy) continue;
        c.lineWidth = Math.max(1.2, C.f * 0.11 / pts[2][2] * (life - 0.15) * 1.3);
        c.beginPath(); pts.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke();
      }
      // speed lines during the gust run
      const sl = seg(t, 5.75, 6.0) * (1 - seg(t, 7.0, 7.4));
      if (sl > 0) {
        const fr = Math.floor(t * 12);
        for (let k = 0; k < 26; k++) { const y = hash(fr * 13 + k) * 1080, x = hash(fr * 7 + k * 3) * 1920, l = 200 + hash(k + fr) * 500; c.fillStyle = `rgba(255,255,255,${0.55 * sl})`; c.fillRect(x - l / 2, y, l, 2 + hash(k * 9) * 4); }
      }
      // wake: two white lines spreading from the stern
      for (const side of [-1, 1]) for (let k = 1; k < 28; k++) {
        const pts = [];
        for (const kk of [k, k + 1]) {
          const te = t - kk * 0.09, Bt = csBoat(te), hd = [Math.cos(Bt.yaw), 0, -Math.sin(Bt.yaw)], lt = [Math.sin(Bt.yaw), 0, Math.cos(Bt.yaw)], sp = side * (0.4 + 0.55 * (t - te));
          const sx = Bt.p[0] - hd[0] * 1.9 + lt[0] * sp, sz = Bt.p[2] - hd[2] * 1.9 + lt[2] * sp, wd = 0.22 * (1 - kk / 30);
          pts.push([sx - lt[0] * wd, sz - lt[2] * wd], [sx + lt[0] * wd, sz + lt[2] * wd]);
        }
        const pp = [pts[0], pts[1], pts[3], pts[2]].map(([x, z]) => csP(C, x, 0.01, z, [0, 0, 0]));
        if (pp.some(p => p[2] < 0.2)) continue;
        items.push({ z: (pp[0][2] + pp[2][2]) / 2 + 0.5, pts: pp, col: '#ffffff' });
      }
      // foam collar around the hull and the island shore
      const Ry = m3(B.yaw, 0, 0), col = [];
      for (let k = 0; k <= 16; k++) { const u = k / 16; col.push([lerp(-2.1, 2.3, u), hb(Math.min(1, u * 1.02)) + 0.18 + 0.05 * Math.sin(t * 5 + k)]); }
      const collar = [...col.map(([x, z]) => [x, z]), ...col.reverse().map(([x, z]) => [x, -z])].map(([x, z]) => { const p = mv(Ry, [x, 0, z]); return csP(C, B.p[0] + p[0], 0.01, B.p[2] + p[2], [0, 0, 0]); });
      if (collar.every(p => p[2] > 0.2)) { csP(C, B.p[0], 0, B.p[2], q); items.push({ z: q[2] + 1.0, pts: collar, col: '#ffffff' }); }
      const shore = []; for (let k = 0; k < 40; k++) { const a = k / 40 * TAU, rr = CS_IR * 0.93 * (1 + 0.09 * Math.sin(a * 3 + 1) + 0.05 * Math.sin(a * 7)) + 0.55 + 0.12 * Math.sin(t * 2 + k); shore.push(csP(C, CS_ISL[0] + rr * Math.cos(a), 0.01, CS_ISL[2] + rr * Math.sin(a), [0, 0, 0])); }
      if (shore.every(p => p[2] > 0.2)) { csP(C, CS_ISL[0], 0, CS_ISL[2], q); items.push({ z: q[2] + CS_IR, pts: shore, col: '#ffffff' }); }
    }
    // meshes
    const R = m3(B.yaw, B.pitch, B.roll), T = [B.p[0], B.y, B.p[2]], I = m3(0, 0, 0), lw = 3.6;
    csEmit(items, C, L, st.hull, R, T, pal, plain, lw);
    csBuildRig(t, B).forEach(m => csEmit(items, C, L, m, R, T, pal, plain, lw));
    st.island.forEach(m => csEmit(items, C, L, m, I, [0, 0, 0], pal, plain, lw * 0.85));
    // sailor's eyes: decals on the head sphere
    [-1, 1].forEach(k => {
      const d = v3.norm([0.9, 0.1, k * 0.36]), lp = [-1.05 + d[0] * 0.25, 1.42 + d[1] * 0.25, d[2] * 0.25], wpnt = mv(R, lp), wn = mv(R, d);
      const P = [wpnt[0] + T[0], wpnt[1] + T[1], wpnt[2] + T[2]], view = v3.sub(P, C.e);
      if (v3.dot(wn, view) > -0.05) return;
      const pr = csP(C, P[0], P[1], P[2], [0, 0, 0]); if (pr[2] < 0.1) return;
      const sc = C.f / pr[2], fac = clamp(-v3.dot(wn, v3.norm(view)) * 1.4);
      items.push({ z: pr[2] - 0.08, fn: g => { g.fillStyle = CS.ink; g.beginPath(); g.ellipse(pr[0], pr[1], 0.04 * sc * fac + 0.5, 0.075 * sc, 0, 0, TAU); g.fill(); } });
    });
    if (!plain) {
      // gulls circling ahead
      for (let i = 0; i < 3; i++) {
        const a = t * 0.6 + i * 2.1, gp = [B.p[0] + 6 + Math.cos(a) * 4, 5.5 + i * 0.7 + Math.sin(t * 1.3 + i) * 0.4, 3 + Math.sin(a) * 4];
        const pr = csP(C, gp[0], gp[1], gp[2], [0, 0, 0]); if (pr[2] < 1) continue;
        const s = C.f * 0.45 / pr[2], fl = Math.sin(t * 9 + i * 2) * 0.45;
        items.push({ z: pr[2], fn: g => { g.lineCap = 'round'; g.lineJoin = 'round'; [[CS.ink, 0.22], ['#ffffff', 0.11]].forEach(([cc, w]) => { g.strokeStyle = cc; g.lineWidth = Math.max(2, s * w); g.beginPath(); g.moveTo(pr[0] - s, pr[1] - s * fl); g.quadraticCurveTo(pr[0] - s * 0.4, pr[1] - s * 0.35, pr[0], pr[1]); g.quadraticCurveTo(pr[0] + s * 0.4, pr[1] - s * 0.35, pr[0] + s, pr[1] - s * fl); g.stroke(); }); } });
      }
      // bow spray in the gust
      if (t > 5.72) for (let k = 0; k < 60; k++) {
        const t0 = 5.72 + k * 0.026; if (t0 > 7.3) break; const age = t - t0; if (age < 0 || age > 0.75) continue;
        const B0 = csBoat(t0), R0 = m3(B0.yaw, 0, 0), side = k % 2 ? 1 : -1, bow = mv(R0, [1.95, 0.3, side * 0.2]), v = mv(R0, [-0.6 + hash(k) * 0.6, 0, side * (1.6 + hash(k * 3) * 1.4)]);
        const vy = 2.6 + hash(k * 7) * 1.6, y = 0.3 + vy * age - 4.9 * age * age; if (y < 0) continue;
        const pr = csP(C, B0.p[0] + bow[0] + (v[0] + 1.3 + 3) * age, y, B0.p[2] + bow[2] + v[2] * age, [0, 0, 0]); if (pr[2] < 0.3) continue;
        const rr = C.f * (0.07 + hash(k * 11) * 0.08) / pr[2] * (1 - age * 0.6);
        items.push({ z: pr[2], fn: g => { g.fillStyle = CS.ink; g.beginPath(); g.arc(pr[0], pr[1], rr + 2.5, 0, TAU); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(pr[0], pr[1], rr, 0, TAU); g.fill(); } });
      }
    }
    items.sort((a, b) => b.z - a.z);
    c.lineJoin = 'round';
    for (const it of items) {
      if (it.fn) { it.fn(c); continue; }
      if (it.pts.length) {
        c.beginPath(); it.pts.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
        c.fillStyle = it.col; c.fill(); c.strokeStyle = it.col; c.lineWidth = 1.1; c.stroke();
      }
      if (it.edges) { c.strokeStyle = CS.ink; c.lineWidth = 3.2; c.lineCap = 'round'; c.beginPath(); for (let k = 0; k < it.edges.length; k += 2) { c.moveTo(it.edges[k][0], it.edges[k][1]); c.lineTo(it.edges[k + 1][0], it.edges[k + 1][1]); } c.stroke(); }
    }
  }
  function csTitle(c, t) {
    const T = CS_T, word = 'CEL-SHADED 3D', size = 150;
    c.font = `400 ${size}px ${BUNG}`;
    if (c.letterSpacing !== undefined) c.letterSpacing = '0px';
    const ws = [...word].map(ch => c.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0);
    let x = 960 - tot / 2; const by = 300;
    [...word].forEach((ch, i) => {
      const t0 = T.title + i * 0.045, p = t <= t0 ? 0 : spring(t - t0, 2.4, 0.42), cx = x + ws[i] / 2; x += ws[i];
      if (p <= 0.01 || ch === ' ') return;
      c.save(); c.translate(cx, by); c.rotate((1 - clamp(p)) * 0.4 * (i % 2 ? 1 : -1)); c.scale(p, p);
      c.font = `400 ${size}px ${BUNG}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.lineJoin = 'round'; c.strokeStyle = CS.ink; c.lineWidth = 26; c.strokeText(ch, 8, 10); c.fillStyle = CS.ink; c.fillText(ch, 8, 10);
      c.strokeText(ch, 0, 0);
      c.fillStyle = '#ff5a3c'; c.fillText(ch, 0, 0);
      c.save(); c.beginPath(); c.rect(-200, -size, 400, size * 0.58); c.clip(); c.fillStyle = '#ffd23f'; c.fillText(ch, 0, 0); c.restore();
      c.save(); c.beginPath(); c.rect(-200, -size, 400, size * 0.2); c.clip(); c.fillStyle = '#fff6d0'; c.fillText(ch, 0, 0); c.restore();
      c.restore();
    });
    const sa = E.outC(seg(t, T.sub, T.sub + 0.4));
    if (sa > 0) {
      c.save(); c.globalAlpha = sa; c.translate(0, (1 - sa) * 14);
      c.fillStyle = CS.ink; MG.rrect(c, 960 - 470, 352, 940, 64, 32); c.fill();
      text(c, 'TOON RAMP  ·  INVERTED-HULL INK  ·  2000 —', 960, 395, { font: RUB, weight: 900, size: 30, align: 'center', color: '#fff6d0', ls: 3 });
      c.restore();
    }
  }

  MG.film({
    id: 'celshaded', dur: 10, poster: 9.6,
    fonts: [['400 150px Bungee', 'CEL-SHADED 3D'], ['900 30px Rubik', 'TOON RAMP · INVERTED-HULL INK 2000 —'], ['700 22px Rubik', 'LAMBERT 3-BAND RAMP']],
    meta: {
      family: 'D', name: 'Cel-shaded 3D', sub: 'Toon Shading', era: '2000 —',
      origin: 'Non-photorealistic rendering that makes 3D models look like inked animation cels: diffuse light is quantised into two or three hard bands through a ramp lookup, and black outlines come from the inverted-hull trick (the back faces of a slightly inflated copy) or from edge detection. Sega\'s Jet Set Radio (Smilebit, 2000) brought it to games, Nintendo\'s The Legend of Zelda: The Wind Waker (2002) made it a classic, and it runs through Borderlands (2009), Guilty Gear Xrd (2014) and the NPR films Spider-Man: Into the Spider-Verse (2018) and Arcane (2021).',
      works: 'Jet Set Radio (Smilebit / Sega, 2000) · The Legend of Zelda: The Wind Waker (Nintendo, 2002) · Ōkami (Clover Studio, 2006) · Borderlands (Gearbox, 2009) · Guilty Gear Xrd (Arc System Works, 2014) · Spider-Man: Into the Spider-Verse (Sony Pictures Animation, 2018) · Arcane (Fortiche, 2021)',
      tech: ['Banded Lambert ramp (3 tones)', 'Inverted-hull outlines', 'Flat anime palette with tinted shadows', 'Painter-sorted mesh projection'],
      accent: '#ff5a3c',
      motionDNA: 'Real 3D camera moves — orbits, a wide reveal, a hard anime cut to a low skimming run — but everything reads as drawn: shading jumps between bands instead of gliding, and speed lines, spray dots and swirl clouds are graphic shapes.',
      visualDNA: 'Saturated flat colour in two or three hard tones per surface, cool violet shadows and warm highlights, constant-width ink silhouettes, a banded sea with white foam strokes, and puffy outlined clouds with a curl.',
      transitions: 'Lambert-to-toon wipe, orbit, hard cut, speed-line burst, spring-pop title',
      implementation: ['Toon ramp shaders (Unity / Unreal / Blender)', 'Blender Line Art / Freestyle', 'Pencil+ (3ds Max / Maya)', 'Canvas 2D (CPU projection, band-split faces, painter\'s sort)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { hull: csBuildHull(), island: csBuildIsland() }; },
    draw(c, t, W, H, st) {
      const T = CS_T, wx = lerp(-60, 1980, E.ioC(seg(t, T.wipe0, T.wipe1)));
      if (t < T.wipe1) {
        c.save(); c.beginPath(); c.rect(wx, 0, W, H); c.clip(); csRender(c, st, t, true); c.restore();
      }
      if (t > T.wipe0) {
        c.save(); if (t < T.wipe1) { c.beginPath(); c.rect(0, 0, wx, H); c.clip(); } csRender(c, st, t, false); c.restore();
      }
      if (t < T.wipe1 + 0.4) {
        const la = 1 - seg(t, T.wipe1, T.wipe1 + 0.4);
        c.save(); c.globalAlpha = la;
        if (t > T.wipe0 && t < T.wipe1) { c.fillStyle = CS.ink; c.fillRect(wx - 5, 0, 10, H); c.fillStyle = '#ffd23f'; c.fillRect(wx - 2, 0, 4, H); }
        const lab = (s, x, al, col, bg) => { c.font = `700 24px ${RUB}`; const w = c.measureText(s).width + 40 + s.length * 2; c.fillStyle = bg; MG.rrect(c, al === 'left' ? x : x - w, 60, w, 48, 24); c.fill(); text(c, s, al === 'left' ? x + 20 : x - 20, 93, { font: RUB, weight: 700, size: 24, color: col, align: al, ls: 2 }); };
        if (wx < 1500) lab('LAMBERT · NO INK', 1860, 'right', '#30323a', 'rgba(255,255,255,0.75)');
        if (t > T.wipe0 + 0.15) lab('3-BAND RAMP + INVERTED HULL', 60, 'left', '#fff6d0', CS.ink);
        c.restore();
      }
      if (t > T.title) csTitle(c, t);
      grain(c, W, H, t, 0.02, 'soft-light');
    },
    score(A) {
      A.bus.gain.value = 0.8;
      const B = 0.48, T = CS_T;
      // the sea under everything
      for (let k = 0; k < 5; k++) A.noise(k * 2, { type: 'lowpass', f: 500, f2: 900, sweep: 2.2, q: 0.5, dur: 2.4, g: 0.05, swell: 0.5, rev: 0.3 });
      // the wipe: a bright zip and a pop
      A.whoosh(T.wipe0, 1.1, { f1: 400, f2: 5000, g: 0.08 });
      A.osc(T.wipe1, { f: 900, f2: 300, glide: 0.08, dur: 0.12, g: 0.12 }); A.osc(T.wipe1, { f: 1800, f2: 2400, glide: 0.05, dur: 0.1, g: 0.05, type: 'square', lp: 4000 });
      // funky break, E dorian, ~125 bpm
      const bass = [40, 40, 52, 43, 45, 47, 45, 38];
      for (let k = 0; k * B / 2 < 9.6; k++) {
        const tb = 1.45 + k * B / 2; if (tb > 9.7) break;
        const gap = tb > T.gust - 0.25 && tb < T.gust + 0.1, bar = k % 8;
        if (!gap) {
          if (bar === 0 || bar === 5) A.kick(tb, 0.55, { f: 120, f2: 45 });
          if (bar === 2 || bar === 6) A.snare(tb, 0.3, { f: 2100, rev: 0.12 });
          A.hat(tb, k % 2 ? 0.045 : 0.03, false, { pan: 0.3 });
          if (tb > T.gust && tb < 7.4) A.hat(tb + B / 4, 0.03, false, { pan: -0.3 });
          if (k % 2 === 0 || bar === 3) A.osc(tb, { type: 'sawtooth', f: midi(bass[bar]), dur: 0.17, g: 0.11, lp: 900, lp2: 220, lpT: 0.15 });
        }
        if (bar === 3 && !gap) A.chord(tb, tb < 5 ? [64, 67, 71, 74, 78] : [62, 66, 69, 73, 76], { type: 'sawtooth', dur: 0.14, g: 0.022, lp: 2400, lp2: 900, lpT: 0.12, spread: 9, width: 0.8, rev: 0.25 });
      }
      // gulls
      [4.3, 4.65, 5.1].forEach((t, i) => A.osc(t, { f: 2300 - i * 200, f2: 1500, glide: 0.25, dur: 0.3, g: 0.025, vib: [22, 60], pan: (i - 1) * 0.6, rev: 0.4 }));
      // gust: the hard cut
      A.riser(T.gust - 1.0, 1.0, { g: 0.1, f: 98 });
      A.impact(T.gust, 0.6, { rev: 0.4 }); A.whoosh(T.gust, 1.6, { f1: 300, f2: 2500, g: 0.15, swell: 0.3 });
      for (let k = 0; k < 14; k++) A.noise(T.gust + 0.05 + k * 0.11, { type: 'highpass', f: 1500 + hash(k) * 3000, dur: 0.12, g: 0.04, pan: (hash(k * 3) - 0.5) * 1.4 });
      A.osc(T.gust, { type: 'square', f: midi(76), f2: midi(88), glide: 1.2, dur: 1.3, g: 0.02, lp: 3000, vib: [6, 10], rev: 0.4 });
      // settle: the title stab
      A.riser(7.3, 0.95, { g: 0.08, f: 110 });
      A.kick(T.title, 0.7, { f: 110, f2: 38, dur: 0.6 }); A.noise(T.title, { type: 'highpass', f: 5000, dur: 1.4, g: 0.07, rev: 0.6 });
      A.chord(T.title, [52, 59, 64, 67, 71, 74], { type: 'sawtooth', dur: 1.6, g: 0.03, lp: 2600, lp2: 700, lpT: 1.6, a: 0.005, hold: true, rel: 0.6, spread: 10, width: 0.9, rev: 0.5 });
      [76, 79, 83, 86, 88, 91, 95, 98, 100, 103, 105, 107].forEach((m, i) => A.osc(T.title + i * 0.045, { type: 'square', f: midi(m - 12), dur: 0.08, g: 0.018, lp: 4000, pan: (i / 11 - 0.5) * 0.8 }));
      A.bell(T.sub, midi(88), { g: 0.05, dur: 1.8, rev: 0.6 });
    },
  });

  /* =====================================================================
     FEEDBACK LOOPS — a camera stares into its own monitor: a black-and-
     white tunnel of nested TVs with a penlight trail spiralling inward;
     zooming through it into colour howlaround blooms, then digital
     kaleidoscopic feedback that folds back on itself; the title resolves
     as a receding tunnel of its own echoes. Every frame = N copies of a
     base image at t − kΔ under the k-th power of a zoom/rotate map
     ===================================================================== */
  const FB_W = 960, FB_H = 540;
  const FB_T = { light: 0.3, zoom0: 0.55, zoom1: 2.75, x12: [2.3, 2.95], x23: [5.05, 5.6], fold: 6.7, x34: [7.6, 8.2], title: 7.9, sub: 8.75 };
  const FB_R = { x: 540, y: 297.5, w: 720, h: 405 };
  // Similarity p' = C' + s·Rot(θ)·(p − C), kept as its fixed point so any real power is one transform.
  function fbSim(s, th, cx, cy, tx = 0, ty = 0) {
    const a = s * Math.cos(th), b = s * Math.sin(th), rx = cx + tx - (a * cx - b * cy), ry = cy + ty - (b * cx + a * cy), det = (1 - a) * (1 - a) + b * b;
    return det < 1e-9 ? { s, th, Fx: cx, Fy: cy, tx, ty, tr: true } : { s, th, Fx: ((1 - a) * rx - b * ry) / det, Fy: (b * rx + (1 - a) * ry) / det };
  }
  function fbPow(g, M, x) {
    if (M.tr) { g.translate(M.tx * x, M.ty * x); return; }
    g.translate(M.Fx, M.Fy); g.rotate(M.th * x); const s = Math.pow(M.s, x); g.scale(s, s); g.translate(-M.Fx, -M.Fy);
  }
  // The loop itself: copies from the oldest/most transformed to the newest.
  function fbLoop(g, t, o) {
    const u = o.u || 0, kMin = Math.max(0, Math.floor(u) - 2);
    for (let k = o.N; k >= kMin; k--) {
      const a = Math.pow(o.gain, k); if (a < 0.012) continue;
      g.save(); fbPow(g, o.M, k - u); g.globalAlpha = a; g.globalCompositeOperation = o.op || 'lighter';
      o.base(g, t - k * o.dt, k);
      g.restore();
    }
  }
  const hsl = (h, s, l, a = 1) => `hsla(${((h % 360) + 360) % 360},${s}%,${l}%,${a})`;
  const fbLight = tau => [960 + 640 * Math.sin(1.25 * tau), 520 + 300 * Math.sin(1.7 * tau + 0.8)];
  // Act 1 base: the room and the TV, screen left open, plus the penlight in front.
  function fbTV(g, tau, k) {
    const R = FB_R;
    g.beginPath(); g.rect(-60, -60, 2040, 1200); g.roundRect(R.x, R.y, R.w, R.h, 34);
    const rg = g.createRadialGradient(900, 480, 200, 900, 520, 1200); rg.addColorStop(0, '#3a3a3e'); rg.addColorStop(1, '#0c0c0e');
    g.fillStyle = rg; g.fill('evenodd');
    // table
    g.fillStyle = '#1b1b1d'; g.fillRect(-60, 800, 2040, 400); g.fillStyle = '#4a4a4e'; g.fillRect(-60, 800, 2040, 6);
    // the set: body with a screen hole, knob panel, speaker slots
    g.beginPath(); g.roundRect(R.x - 64, R.y - 56, R.w + 64 + 210, R.h + 56 + 92, 46); g.roundRect(R.x, R.y, R.w, R.h, 34);
    const bg = g.createLinearGradient(0, R.y - 56, 0, R.y + R.h + 92); bg.addColorStop(0, '#6c6c70'); bg.addColorStop(1, '#2a2a2e');
    g.fillStyle = bg; g.fill('evenodd');
    g.strokeStyle = '#8e8e92'; g.lineWidth = 6; g.beginPath(); g.roundRect(R.x - 8, R.y - 8, R.w + 16, R.h + 16, 40); g.stroke();
    const px = R.x + R.w + 70;
    [[px + 40, R.y + 70], [px + 40, R.y + 190]].forEach(([x, y]) => { g.fillStyle = '#1c1c1e'; g.beginPath(); g.arc(x, y, 38, 0, TAU); g.fill(); g.fillStyle = '#9a9a9e'; g.beginPath(); g.arc(x, y, 26, 0, TAU); g.fill(); g.fillStyle = '#1c1c1e'; g.fillRect(x - 3, y - 26, 6, 22); });
    g.fillStyle = '#18181a'; for (let i = 0; i < 6; i++) g.fillRect(px + 8, R.y + 270 + i * 18, 64, 7);
    g.fillStyle = '#18181a'; g.fillRect(R.x + 40, R.y + R.h + 92, 60, 30); g.fillRect(R.x + R.w + 60, R.y + R.h + 92, 60, 30);
    // glass: a faint glow that piles up into the tunnel
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(190,205,230,0.05)'; g.beginPath(); g.roundRect(R.x, R.y, R.w, R.h, 34); g.fill(); g.restore();
    // penlight in front of the set
    const on = seg(tau, FB_T.light, FB_T.light + 0.3);
    if (on > 0) {
      const [x, y] = fbLight(tau), lg = g.createRadialGradient(x, y, 0, x, y, 90);
      lg.addColorStop(0, `rgba(255,255,255,${on})`); lg.addColorStop(0.18, `rgba(235,240,255,${0.8 * on})`); lg.addColorStop(1, 'rgba(200,210,255,0)');
      g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = lg; g.fillRect(x - 90, y - 90, 180, 180); g.restore();
    }
  }
  const fbM1 = fbSim(FB_R.w / 1920, 0.055, 960, 540, FB_R.x + FB_R.w / 2 - 960, FB_R.y + FB_R.h / 2 - 540);
  // Act 2 base: a live Lissajous trace and a pulse ring, coloured per pass.
  function fbLiss(g, tau, k) {
    const on = seg(tau, FB_T.x12[0], FB_T.x12[0] + 0.5); if (on <= 0) return;
    const h = 190 + (tau - 2.3) * 28 + k * 22, pulse = Math.exp(-((tau * 2.08) % 1) * 5);
    g.strokeStyle = hsl(h, 95, 62, on); g.lineWidth = 9; g.lineJoin = 'round'; g.beginPath();
    for (let i = 0; i <= 120; i++) { const a = i / 120 * TAU; const x = 960 + 300 * Math.sin(3 * a + tau * 0.9), y = 540 + 230 * Math.sin(2 * a + tau * 0.45); i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
    g.strokeStyle = hsl(h + 120, 90, 60, on * (0.4 + 0.6 * pulse)); g.lineWidth = 5; g.beginPath(); g.arc(960, 540, 90 + pulse * 30, 0, TAU); g.stroke();
    const dx = 960 + 380 * Math.cos(tau * 1.7), dy = 540 + 380 * Math.sin(tau * 1.7);
    g.fillStyle = hsl(h + 60, 100, 75, on); g.beginPath(); g.arc(dx, dy, 18, 0, TAU); g.fill();
  }
  // Act 3 base: a mirrored rotating triangle and orbiting dots.
  function fbKal(g, tau, k) {
    const on = seg(tau, FB_T.x23[0], FB_T.x23[0] + 0.4); if (on <= 0) return;
    const h = 300 + tau * 40 + k * 13, beat = Math.exp(-((tau * 2.08) % 1) * 4), sc = 1 + 0.22 * beat;
    for (const mx of [1, -1]) for (const my of [1, -1]) {
      g.save(); g.translate(960, 540); g.scale(mx, my);
      g.save(); g.translate(220, 130); g.rotate(tau * 1.4); g.scale(sc, sc);
      g.strokeStyle = hsl(h, 95, 60, on); g.lineWidth = 8; g.beginPath();
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU - PI / 2; i ? g.lineTo(Math.cos(a) * 95, Math.sin(a) * 95) : g.moveTo(Math.cos(a) * 95, Math.sin(a) * 95); }
      g.closePath(); g.stroke(); g.restore();
      const a = tau * 1.1; g.fillStyle = hsl(h + 150, 100, 70, on); g.beginPath(); g.arc(Math.cos(a) * 330, Math.sin(a) * 200, 14, 0, TAU); g.fill();
      g.restore();
    }
  }
  // Act 4 base: the title, its frame — the echoes become a tunnel of monitors again.
  function fbTitleBase(g, tau, k) {
    const a = seg(tau, FB_T.title, FB_T.title + 0.35); if (a <= 0) return;
    const sc = lerp(0.55, 1, E.outC(seg(tau, FB_T.title, FB_T.title + 0.7))), h = 185 + k * 17 + tau * 10;
    g.save(); g.translate(960, 520); g.scale(sc, sc);
    g.strokeStyle = k ? hsl(h, 90, 60, a) : `rgba(230,250,255,${a})`; g.lineWidth = 7; g.beginPath(); g.roundRect(-760, -330, 1520, 660, 60); g.stroke();
    if (k) text(g, 'Feedback Loops', 0, 38, { font: SYNE, weight: 800, size: 108, align: 'center', color: hsl(h, 90, 58, a * 0.75) });
    g.restore();
  }
  function fbAct(g, i, t) {
    g.setTransform(0.5, 0, 0, 0.5, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
    if (i === 0) fbLoop(g, t, { M: fbM1, N: 9, dt: 0.12, gain: 1, op: 'source-over', u: 1.95 * E.ioC(seg(t, FB_T.zoom0, FB_T.zoom1)), base: fbTV });
    else if (i === 1) fbLoop(g, t, { M: fbSim(1.05, 0.07 + 0.03 * Math.sin(t * 0.8), 960, 540, 0, -3), N: 34, dt: 0.05, gain: 0.86, base: fbLiss });
    else if (i === 2) {
      const s = MG.kf(t, [[5.0, 1.06], [6.5, 1.075], [7.1, 0.95, E.ioS], [8.2, 0.93]]), th = MG.kf(t, [[5.0, 0.08], [6.5, 0.12], [7.0, -0.1, E.ioS], [8.2, -0.06]]);
      fbLoop(g, t, { M: fbSim(s, th, 960, 540), N: 40, dt: 0.035, gain: 0.87, base: fbKal });
    } else fbLoop(g, t, { M: fbSim(0.94, 0.03, 960, 540, 0, 6), N: 26, dt: 0.06, gain: 0.82, base: fbTitleBase });
  }

  MG.film({
    id: 'feedback', dur: 10, poster: 9.5,
    fonts: [['800 108px Syne', 'Feedback Loops'], ['500 24px "IBM Plex Mono"', 'VIDEO FEEDBACK · HOWLAROUND 1963 · PAIK · VASULKA LOOP k=0']],
    meta: {
      family: 'E', name: 'Feedback Loops', sub: 'Video Feedback / Howlaround', era: '1963 —',
      origin: 'Point a camera at the monitor showing its own picture and the image re-enters itself every frame: nested screens, spiralling trails and luminous blooms emerge from nothing but zoom, tilt and delay. Bernard Lodge built Doctor Who\'s 1963 title sequence from this BBC "howlaround"; 1970s video artists — Nam June Paik (with Shuya Abe\'s Paik–Abe Synthesizer, 1969–70) and Steina & Woody Vasulka at The Kitchen — made it a medium; digital frame feedback (MilkDrop, TouchDesigner, VJ software) adds zoom, rotation and hue shift on every pass.',
      works: 'Doctor Who title sequence (Bernard Lodge, BBC, 1963) · Nam June Paik & Shuya Abe, Paik–Abe Video Synthesizer (1969–70) · Steina & Woody Vasulka, video feedback works (1970s) · Queen, "Bohemian Rhapsody" video (Bruce Gowers, 1975) · MilkDrop (Ryan Geiss, 2001) · TouchDesigner feedback TOPs (Derivative, 2000s —)',
      tech: ['Recursive zoom / rotate per pass', 'One-pass time delay per copy', 'Additive decay + hue shift per pass', 'Monitor-in-monitor tunnel'],
      accent: '#5ee7ff',
      motionDNA: 'Nothing is animated directly: one small moving thing is re-photographed again and again, so its past spirals inward or blooms outward. Changing the zoom, tilt or delay changes the whole organism at once; the motion is slow, breathing, self-similar.',
      visualDNA: 'A dark field with glowing structures: nested screens receding into a spiral tunnel, blooming petals of trailed light, colour cycling through the passes, CRT scanlines and soft bloom.',
      transitions: 'Infinite zoom through nested screens, crossfade between regimes, rotation reversal (fold), echo tunnel title',
      implementation: ['Camera + monitor (analog howlaround)', 'Video synthesizers & colorizers', 'TouchDesigner / MilkDrop frame feedback', 'Canvas 2D (N recursive copies as a function of t)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const mk = () => { const cv = offscreen(FB_W, FB_H); return { cv, g: cv.getContext('2d') }; };
      const scan = offscreen(4, 4), sg = scan.getContext('2d'); sg.fillStyle = 'rgba(0,0,0,0.38)'; sg.fillRect(0, 3, 4, 1);
      return { a: mk(), b: mk(), acc: mk(), bl1: mk(), bl2: offscreen(240, 135), scan };
    },
    draw(c, t, W, H, st) {
      const T = FB_T, w = [
        1 - seg(t, T.x12[0], T.x12[1]),
        seg(t, T.x12[0], T.x12[1]) * (1 - seg(t, T.x23[0], T.x23[1])),
        seg(t, T.x23[0], T.x23[1]) * (1 - seg(t, T.x34[0], T.x34[1])),
        seg(t, T.x34[0], T.x34[1]),
      ];
      const act = w.map((v, i) => [v, i]).filter(([v]) => v > 0.001);
      const A = st.acc.g; A.setTransform(1, 0, 0, 1, 0, 0); A.globalAlpha = 1; A.globalCompositeOperation = 'source-over'; A.fillStyle = '#000'; A.fillRect(0, 0, FB_W, FB_H);
      act.forEach(([v, i], n) => {
        const buf = n ? st.b : st.a; fbAct(buf.g, i, t);
        A.globalAlpha = v; A.globalCompositeOperation = 'lighter'; A.drawImage(buf.cv, 0, 0);
      });
      A.globalAlpha = 1; A.globalCompositeOperation = 'source-over';
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(st.acc.cv, 0, 0, W, H);
      // bloom
      const B1 = st.bl1.g; B1.setTransform(1, 0, 0, 1, 0, 0); B1.drawImage(st.acc.cv, 0, 0, FB_W, FB_H);
      const B2 = st.bl2.getContext('2d'); B2.drawImage(st.bl1.cv, 0, 0, 240, 135);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22; c.filter = 'blur(6px)'; c.drawImage(st.bl1.cv, 0, 0, W, H); c.filter = 'none'; c.globalAlpha = 0.35; c.drawImage(st.bl2, 0, 0, W, H); c.restore();
      // the newest pass of the title, crisp
      if (t > T.title) {
        const a = seg(t, T.title, T.title + 0.35), sc = lerp(0.55, 1, E.outC(seg(t, T.title, T.title + 0.7)));
        c.save(); c.translate(960, 520); c.scale(sc, sc); c.shadowColor = 'rgba(120,230,255,0.8)'; c.shadowBlur = 24 * c.getTransform().a;
        text(c, 'Feedback Loops', 0, 38, { font: SYNE, weight: 800, size: 108, align: 'center', color: `rgba(245,253,255,${a})` });
        c.restore();
        const sa = E.outC(seg(t, T.sub, T.sub + 0.5));
        if (sa > 0) text(c, 'VIDEO FEEDBACK  ·  HOWLAROUND 1963  ·  PAIK  ·  VASULKA', 960, 660 + (1 - sa) * 10, { font: PLEX, weight: 500, size: 24, align: 'center', ls: 6, color: `rgba(200,245,255,${sa * 0.92})` });
      }
      // CRT: scanlines, a slow roll bar, a cool tint in the black-and-white act
      c.save(); c.fillStyle = c.createPattern(st.scan, 'repeat'); c.globalCompositeOperation = 'multiply'; c.fillRect(0, 0, W, H); c.restore();
      const ry = ((t * 0.18) % 1) * (H + 300) - 150, rb = c.createLinearGradient(0, ry - 150, 0, ry + 150);
      rb.addColorStop(0, 'rgba(255,255,255,0)'); rb.addColorStop(0.5, `rgba(255,255,255,${0.035 * w[0] + 0.015})`); rb.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = rb; c.fillRect(0, ry - 150, W, 300);
      if (w[0] > 0) { c.save(); c.globalCompositeOperation = 'color'; c.globalAlpha = 0.25 * w[0]; c.fillStyle = '#9fb8d8'; c.fillRect(0, 0, W, H); c.restore(); }
      vignette(c, W, H, 0.55);
      grain(c, W, H, t, 0.035, 'screen');
    },
    score(A) {
      A.bus.gain.value = 0.8;
      const T = FB_T;
      // tape echo: every event repeats, quieter each pass — the audio loop
      const echo = (fn, t, n = 4, d = 0.24, k = 0.5) => { for (let i = 0; i < n; i++) fn(t + i * d, Math.pow(k, i), i); };
      // power on, mains hum
      A.noise(0.1, { type: 'highpass', f: 2000, dur: 0.03, g: 0.12 }); A.osc(0.1, { f: 1200, f2: 80, glide: 0.25, dur: 0.3, g: 0.06 });
      A.osc(0.15, { f: 50, dur: 2.7, g: 0.05, a: 0.2, hold: true, rel: 0.4 }); A.osc(0.15, { type: 'sawtooth', f: 100, dur: 2.7, g: 0.012, lp: 380, a: 0.2, hold: true, rel: 0.4 });
      // the howl: a tone that swells as the loop gains, with a beating twin
      A.osc(0.6, { f: midi(81), dur: 2.3, g: 0.03, a: 2.0, hold: true, rel: 0.3, vib: [5, 7], rev: 0.5 });
      A.osc(0.9, { f: midi(81) * 1.006, dur: 2.0, g: 0.02, a: 1.7, hold: true, rel: 0.3, rev: 0.5 });
      A.whoosh(1.6, 1.2, { f1: 600, f2: 4000, g: 0.06 });
      // act 2: galloping bass ostinato with echoes, a gliding lead
      const Bt = 0.48;
      for (let k = 0; ; k++) {
        const t0 = 2.6 + k * Bt; if (t0 > 7.6) break;
        const root = t0 < 4.5 ? 40 : t0 < 5.5 ? 43 : t0 < 6.7 ? 45 : 38;
        [[0, root, 0.2], [0.16, root, 0.11], [0.24, root + 12, 0.08]].forEach(([d, m, g]) => A.osc(t0 + d, { type: 'sawtooth', f: midi(m), dur: 0.14, g, lp: 700, lp2: 200, lpT: 0.12 }));
        if (t0 > 5.3) A.kick(t0, 0.35, { f: 100, f2: 40 });
        if (t0 > 5.3 && k % 2) A.hat(t0 + Bt / 2, 0.05, true, { pan: 0.3 });
      }
      [[2.9, 76, 79], [3.9, 79, 74], [4.9, 74, 83], [5.9, 83, 81], [6.9, 81, 76]].forEach(([t, a, b], i) => echo((tt, g) => A.osc(tt, { f: midi(a), f2: midi(b), glide: 0.5, dur: 0.85, g: 0.035 * g, vib: [6, 9], a: 0.05, rev: 0.4, pan: i % 2 ? 0.4 : -0.4 }), t, 3, 0.3, 0.45));
      // act 3: digital arps crushed, echo density
      for (let k = 0; k < 40; k++) { const t = 5.3 + k * 0.06; if (t > 7.6) break; A.osc(t, { type: 'square', f: midi([69, 72, 76, 81][k % 4] + (t > T.fold ? -3 : 0)), dur: 0.05, g: 0.016, lp: 3200, crush: k % 3 === 0, pan: (k % 2 ? 0.5 : -0.5) }); }
      A.osc(T.fold, { type: 'sawtooth', f: 880, f2: 110, glide: 0.8, dur: 0.9, g: 0.05, lp: 3000, lp2: 400, lpT: 0.8 });
      A.riser(6.9, 1.0, { g: 0.12, f: 110 });
      // act 4: arrival, then the title echoing away
      A.impact(T.title, 0.6, { rev: 0.6 });
      A.chord(T.title, [40, 47, 52, 56, 59, 64], { type: 'sawtooth', dur: 2.1, g: 0.02, lp: 1800, lp2: 600, lpT: 2, a: 0.02, hold: true, rel: 0.8, spread: 8, width: 0.9, rev: 0.6 });
      echo((t, g, i) => A.bell(t, midi(88 - i * 2), { g: 0.05 * g, dur: 1.6, rev: 0.5, pan: i % 2 ? 0.4 : -0.4 }), T.title + 0.1, 6, 0.3, 0.62);
      echo((t, g) => A.osc(t, { f: midi(76), dur: 0.1, g: 0.03 * g, type: 'triangle', rev: 0.4 }), T.sub, 5, 0.2, 0.55);
    },
  });
})();
