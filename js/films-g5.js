/* batch g5 — Cultural & Commercial: Indian Miniature · African Pattern · Concert VJ.
   miniature (Pahari / Rajput / Mughal album painting) · africanpattern (Kente strip-weaving, Adinkra stamping, Ndebele mural painting) · vj (concert LED-wall loops). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, offscreen, roughPoly, grain, vignette, rrect } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Rozha+One&family=Tiro+Devanagari+Hindi&family=Cormorant+Garamond:ital,wght@0,600;1,500&family=Unbounded:wght@500;800&family=DM+Sans:ital,wght@0,500;0,700;1,500&family=Archivo+Black&family=JetBrains+Mono:wght@500;700&display=block');
  const PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  // closed smooth path through points (quadratic through midpoints)
  function smooth(g, pts, closed = true) {
    const n = pts.length;
    g.beginPath();
    if (!closed) {
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < n - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
      g.lineTo(pts[n - 1][0], pts[n - 1][1]);
      return;
    }
    const m = i => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
    const s = m(n - 1); g.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) { const e = m(i); g.quadraticCurveTo(pts[i][0], pts[i][1], e[0], e[1]); }
    g.closePath();
  }
  const poly = (g, pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
  // Tapered tube around a polyline (arms, stems, trunks).
  function tube(g, pts, w0, w1) {
    const n = pts.length, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const w = lerp(w0, w1, i / (n - 1));
      L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    g.beginPath();
    L.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    const e = pts[n - 1]; g.arc(e[0], e[1], w1, Math.atan2(L[n - 1][1] - e[1], L[n - 1][0] - e[0]), Math.atan2(R[n - 1][1] - e[1], R[n - 1][0] - e[0]), true);
    for (let i = n - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
    g.closePath();
  }
  const bez = (p0, p1, p2, p3, n = 16) => Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n, v = 1 - u;
    return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]];
  });
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
  // Paper / cloth texture tile: soft mottling, short fibres, fine speckle.
  function paperTile(base, seed, fib = 0.06, size = 512, dark = '90,60,30', lite = '255,252,240', blobs = 80) {
    const c = offscreen(size, size), g = c.getContext('2d'), r = rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, size, size);
    for (let k = 0; k < blobs; k++) {
      const x = r() * size, y = r() * size, rr = 20 + r() * 90, d = r() < 0.5;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, d ? `rgba(${dark},${0.03 + r() * 0.04})` : `rgba(${lite},${0.04 + r() * 0.05})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { g.save(); g.translate(ox, oy); g.fillRect(x - rr, y - rr, rr * 2, rr * 2); g.restore(); }
    }
    g.lineCap = 'round';
    for (let k = 0; k < 1200; k++) {
      const x = r() * size, y = r() * size, a = r() * TAU, l = 5 + r() * 24, d = r() < 0.55;
      g.strokeStyle = d ? `rgba(${dark},${fib * (0.4 + r())})` : `rgba(${lite},${fib * 1.5 * (0.4 + r())})`;
      g.lineWidth = 0.5 + r();
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    for (let k = 0; k < 8000; k++) { g.fillStyle = r() < 0.5 ? `rgba(${dark},0.05)` : `rgba(${lite},0.06)`; g.fillRect(r() * size, r() * size, 1 + r(), 1 + r()); }
    return c;
  }

  /* =====================================================================
     INDIAN MINIATURE — a Pahari album folio is made in front of us: gold
     rules and a flowering hashiya margin are burnished on, a red-ochre
     khaka underdrawing sketches a Kangra garden terrace, mineral colour
     floods in layer by layer and gold leaf is laid and glints; then Krishna
     plays his flute to Radha, a peacock calls, cranes cross the evening
     sky, and the camera pulls back to the folio and its inscription
     ===================================================================== */
  const MN = {
    lapis: '#1f3d8e', lapisD: '#13265e', sky: '#7d9fd0', dawn: '#f1dfb8', streak: '#d9643a', ink: '#2b1a12', khaka: '#b8532f',
    hill: '#a9c486', hillD: '#7fa868', meadow: '#5f9a4e', greenD: '#21492c', green: '#3c7d45', greenL: '#8fbf6a', leaf: '#2f6a3a',
    marble: '#f1eadb', marbleS: '#d9cdb6', red: '#c9361f', lac: '#9b1d33', yel: '#e8b62b', orange: '#e0782c', pink: '#eaa39a',
    krishna: '#4769b4', krishnaD: '#2f4d8f', skin: '#efc49a', skinD: '#d39e72', water: '#8aa6c2', waterD: '#5d7fa6', gold: '#d3a23a',
    paper: '#efe3c6', hashiya: '#ead3b3', cloth: '#5c1519', bark: '#6d4a2e', white: '#f7f2e6',
  };
  const MN_PW = 1100, MN_PH = 740;           // painting, in folio units; the folio extends 162 units beyond on every side
  const MN_B = 162;
  // reveal times per layer: [line start, line end, colour start, colour end]
  const MN_L = { sky: [1.3, 1.95, 2.25, 2.75], hills: [1.4, 2.15, 2.4, 2.95], terr: [1.45, 2.35, 2.5, 3.05], pav: [1.55, 2.6, 2.65, 3.2], trees: [1.6, 2.7, 2.8, 3.35], figs: [1.85, 3.05, 3.15, 3.85] };
  const MN_T = { gold: 4.0, peacock: [5.25, 6.55], flute: 4.3, birds: [4.2, 8.8], pull: [6.6, 8.0], title: 8.05, seal: 8.75 };
  const MN_R = { line: 1, col: 1 };
  let MN_GOLD = '#d3a23a', MN_GA = 1;        // per-frame gold sheen gradient and gold-leaf coverage
  function mnLayer(t, k) { const [l0, l1, c0, c1] = MN_L[k]; MN_R.line = E.outQ(seg(t, l0, l1)); MN_R.col = E.ioS(seg(t, c0, c1)); }
  function mnFill(g, col) { if (MN_R.col <= 0) return; g.globalAlpha = MN_R.col; g.fillStyle = col; g.fill(); g.globalAlpha = 1; }
  // khaka: the red-ochre underdrawing line, which is redrawn in fine dark ink once colour is in
  function mnLine(g, lw = 1.6, len = 1400) {
    const L = MN_R.line; if (L <= 0) return;
    g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round';
    g.strokeStyle = mixc(MN.khaka, MN.ink, MN_R.col * 0.8);
    if (L < 1) { g.setLineDash([L * len + 0.01, 1e5]); g.stroke(); g.setLineDash([]); } else g.stroke();
  }
  const mnFL = (g, col, lw, len) => { mnFill(g, col); mnLine(g, lw, len); };
  // gold leaf: laid last, sweeping left to right, then burnished to a moving sheen
  function mnGold(g, x, lw = 0, rule = 'nonzero') {
    const a = clamp(MN_GA * 2.4 - x / MN_PW * 1.4); if (a <= 0) return;
    g.globalAlpha = a; g.fillStyle = MN_GOLD; g.fill(rule);
    if (lw) { g.lineWidth = lw; g.strokeStyle = '#8a5f1c'; g.stroke(); }
    g.globalAlpha = 1;
  }
  function mnLeaf(g, x, y, l, a, w = 0.3) {
    const ca = Math.cos(a), sa = Math.sin(a);
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + ca * l * 0.5 - sa * l * w, y + sa * l * 0.5 + ca * l * w, x + ca * l, y + sa * l);
    g.quadraticCurveTo(x + ca * l * 0.5 + sa * l * w, y + sa * l * 0.5 - ca * l * w, x, y);
  }

  function mnSky(g, t) {
    g.beginPath(); g.rect(0, 0, MN_PW, 170);
    const gr = g.createLinearGradient(0, 0, 0, 170);
    gr.addColorStop(0, MN.lapisD); gr.addColorStop(0.42, MN.lapis); gr.addColorStop(0.78, MN.sky); gr.addColorStop(1, MN.dawn);
    mnFill(g, gr);
    // the evening streak along the horizon
    g.beginPath(); g.moveTo(0, 128);
    for (let x = 0; x <= MN_PW; x += 50) g.lineTo(x, 126 + Math.sin(x * 0.012) * 6);
    for (let x = MN_PW; x >= 0; x -= 50) g.lineTo(x, 142 + Math.sin(x * 0.015 + 1) * 4);
    g.closePath(); g.globalAlpha = MN_R.col * 0.75; g.fillStyle = MN.streak; g.fill(); g.globalAlpha = 1;
    // Persian-style ribbon clouds, white with gold rims, drifting
    [[180, 58, 1.0], [520, 40, 0.8], [860, 70, 1.1]].forEach(([x, y, s], i) => {
      const dx = Math.sin(t * 0.25 + i) * 10 + t * 3;
      g.save(); g.translate(x + dx, y); g.scale(s, s);
      const cl = () => { g.beginPath(); g.moveTo(-90, 10); g.bezierCurveTo(-80, -14, -50, -16, -36, -4); g.bezierCurveTo(-30, -24, 4, -28, 12, -8); g.bezierCurveTo(24, -26, 60, -22, 62, -2); g.bezierCurveTo(86, -8, 100, 6, 92, 14); g.bezierCurveTo(40, 22, -40, 22, -90, 10); g.closePath(); };
      cl(); mnFill(g, 'rgba(247,242,230,0.92)'); mnLine(g, 1.2, 500);
      g.beginPath(); g.moveTo(-60, 2); g.quadraticCurveTo(-46, -10, -34, 2); g.moveTo(-4, -4); g.quadraticCurveTo(10, -16, 24, -2); g.moveTo(40, 2); g.quadraticCurveTo(54, -8, 66, 4);
      g.lineWidth = 1.6; g.strokeStyle = MN_GOLD; g.globalAlpha = clamp(MN_GA * 2 - 0.3); g.stroke(); g.globalAlpha = 1;
      g.restore();
    });
  }
  function mnHills(g, t, st) {
    // two rows of soft Kangra hills with tiny trees along the ridges
    [[150, MN.hill, 0], [205, MN.hillD, 2]].forEach(([y0, col, ph]) => {
      g.beginPath(); g.moveTo(0, 360);
      for (let x = 0; x <= MN_PW; x += 20) g.lineTo(x, y0 - 30 * Math.sin(x * 0.006 + ph) - 18 * Math.sin(x * 0.017 + ph * 2));
      g.lineTo(MN_PW, 360); g.closePath(); mnFL(g, col, 1.4, 1600);
      g.globalAlpha = MN_R.col;
      for (let x = 14; x < MN_PW; x += 26 + hash(x + ph) * 22) {
        const y = y0 - 30 * Math.sin(x * 0.006 + ph) - 18 * Math.sin(x * 0.017 + ph * 2) + 4;
        g.fillStyle = MN.bark; g.fillRect(x - 0.8, y - 8, 1.6, 8);
        g.fillStyle = ph ? '#4d7f45' : '#6f9b58'; g.beginPath(); g.ellipse(x, y - 13, 5 + hash(x) * 3, 8 + hash(x * 3) * 4, 0, 0, TAU); g.fill();
      }
      g.globalAlpha = 1;
    });
    // meadow down to the terrace, with the river Yamuna winding across
    g.beginPath(); g.moveTo(0, 250);
    for (let x = 0; x <= MN_PW; x += 25) g.lineTo(x, 252 - 10 * Math.sin(x * 0.01 + 4));
    g.lineTo(MN_PW, 560); g.lineTo(0, 560); g.closePath(); mnFL(g, MN.meadow, 1.4, 1800);
    const river = [[-20, 300], [120, 284], [300, 318], [520, 296], [700, 310]], rw = 32;
    g.beginPath();
    river.forEach((p, i) => (i ? g.lineTo(p[0], p[1] - rw * (1 - i * 0.12)) : g.moveTo(p[0], p[1] - rw)));
    for (let i = river.length - 1; i >= 0; i--) g.lineTo(river[i][0], river[i][1] + rw * (1 - i * 0.12));
    g.closePath(); mnFL(g, MN.water, 1.4, 1600);
    // basket-weave ripples, slowly flowing
    g.save(); g.clip();
    g.globalAlpha = MN_R.col * 0.8; g.strokeStyle = '#e8eef3'; g.lineWidth = 1.1;
    for (let row = 0; row < 7; row++) for (let k = -1; k < 48; k++) {
      const x = k * 16 + (row % 2) * 8 + (t * 9 % 16), y = 266 + row * 10 + x * 0.02;
      g.beginPath(); g.arc(x, y, 6, PI * 1.1, PI * 1.9); g.stroke();
    }
    g.restore(); g.globalAlpha = 1;
    // cows grazing on the far bank: Krishna the cowherd's herd
    [[86, 372, 1, 0], [196, 386, -1, 1.7], [690, 380, -1, 3.1]].forEach(([x, y, s, ph]) => mnCow(g, x, y, s * 0.9, t, ph));
    // flowering shrubs dotted on the meadow
    g.globalAlpha = MN_R.col;
    st.shrubs.forEach(([x, y, r, c]) => { g.fillStyle = MN.green; g.beginPath(); g.ellipse(x, y, r * 1.6, r, 0, 0, TAU); g.fill(); g.fillStyle = c; for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x + (k - 2) * r * 0.55, y - r * 0.4 + (k % 2) * 3, 1.8, 0, TAU); g.fill(); } });
    g.globalAlpha = 1;
  }
  function mnCow(g, x, y, s, t, ph) {
    const graze = 0.5 + 0.5 * Math.sin(t * 0.8 + ph);
    g.save(); g.translate(x, y); g.scale(s, Math.abs(s));
    [[-22, 0], [-14, 2], [14, 2], [22, 0]].forEach(([lx]) => { g.beginPath(); g.rect(lx - 2, -6, 4, 22); mnFL(g, MN.white, 1); });
    smooth(g, [[-34, -18], [-6, -24], [26, -22], [34, -10], [28, 6], [-26, 8], [-36, -4]]); mnFL(g, MN.white, 1.2, 300);
    g.globalAlpha = MN_R.col; g.fillStyle = '#c89a6a'; g.beginPath(); g.ellipse(-6, -8, 10, 7, 0.2, 0, TAU); g.fill(); g.globalAlpha = 1;
    g.beginPath(); g.moveTo(-34, -10); g.quadraticCurveTo(-44, 0, -40, 12); g.lineWidth = 1.4; g.strokeStyle = MN.ink; g.globalAlpha = MN_R.line; g.stroke(); g.globalAlpha = 1;
    g.save(); g.translate(30, -16); g.rotate(0.2 + graze * 0.7);
    smooth(g, [[-2, -6], [16, -6], [24, 4], [20, 10], [2, 8]]); mnFL(g, MN.white, 1.2, 200);
    g.beginPath(); g.moveTo(2, -6); g.quadraticCurveTo(0, -16, 8, -18); g.moveTo(8, -6); g.quadraticCurveTo(12, -15, 18, -14); g.lineWidth = 1.6; g.strokeStyle = MN.ink; g.globalAlpha = MN_R.line; g.stroke(); g.globalAlpha = 1;
    g.restore();
    g.restore();
  }
  function mnTrees(g, t, st) {
    const sw = Math.sin(t * 1.1) * 1.5;
    // cypress with a flowering creeper (the lover's vine) twined round it
    g.save(); g.translate(120, 0);
    tube(g, [[0, 560], [0, 420]], 6, 5); mnFL(g, MN.bark, 1.2);
    smooth(g, [[0, 120 + sw], [16, 200], [34, 320], [36, 430], [0, 470], [-36, 430], [-34, 320], [-16, 200]]); mnFL(g, MN.greenD, 1.4, 900);
    g.globalAlpha = MN_R.col; g.strokeStyle = '#3d7a4a'; g.lineWidth = 1.2;
    for (let y = 150; y < 460; y += 12) { const w = Math.min(30, (y - 120) * 0.22) * (y > 430 ? (470 - y) / 40 : 1); g.beginPath(); g.moveTo(-w, y + 6); g.quadraticCurveTo(0, y - 4, w, y + 6); g.stroke(); }
    g.strokeStyle = '#6b8f3a'; g.lineWidth = 1.6; g.beginPath();
    for (let y = 150; y < 460; y += 3) { const w = Math.min(28, (y - 120) * 0.2) * (y > 430 ? (470 - y) / 40 : 1); const x = Math.sin(y * 0.08) * w; y === 150 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
    for (let y = 160; y < 450; y += 14) { const w = Math.min(28, (y - 120) * 0.2); const x = Math.sin(y * 0.08) * w; g.fillStyle = y % 28 < 14 ? MN.red : MN.white; g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); }
    g.globalAlpha = 1; g.restore();
    // big mango tree with dense layered leaves, and a flowering tree near the pavilion
    st.trees.forEach(tr => {
      tube(g, tr.trunk, tr.w0, tr.w1); mnFL(g, MN.bark, 1.4, 600);
      tr.branches.forEach(b => { tube(g, b, 4, 1.5); mnFL(g, MN.bark, 1); });
      smooth(g, tr.crown); mnFL(g, tr.base, 1.4, 1200);
      g.save(); smooth(g, tr.crown); g.clip();
      g.globalAlpha = MN_R.col;
      tr.leaves.forEach(([x, y, l, a, c]) => { mnLeaf(g, x + sw * (y < tr.cy ? 1 : 0.4), y, l, a); g.fillStyle = c; g.fill(); });
      if (tr.flowers) tr.flowers.forEach(([x, y]) => { g.fillStyle = MN.white; g.beginPath(); g.arc(x + sw, y, 2.4, 0, TAU); g.fill(); g.fillStyle = MN.pink; g.beginPath(); g.arc(x + sw, y, 1, 0, TAU); g.fill(); });
      g.globalAlpha = 1; g.restore();
      smooth(g, tr.crown); mnLine(g, 1.3, 1200);
    });
    // plantain leaves beside the pavilion
    [[706, 470, -1.9], [712, 470, -1.2], [700, 470, -2.5], [716, 470, -0.8]].forEach(([x, y, a], i) => {
      const l = 110 - i * 10, aa = a + Math.sin(t * 1.3 + i) * 0.03;
      mnLeaf(g, x, y, l, aa, 0.22); mnFL(g, i % 2 ? MN.green : '#4f9150', 1.2, 300);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(aa) * l * 0.95, y + Math.sin(aa) * l * 0.95); g.strokeStyle = '#2b5a33'; g.lineWidth = 1; g.globalAlpha = MN_R.col; g.stroke(); g.globalAlpha = 1;
    });
  }
  function mnPavilion(g, t) {
    const X0 = 735, X1 = 1085;
    // plinth and body
    g.beginPath(); g.rect(X0 - 10, 500, X1 - X0 + 20, 40); mnFL(g, MN.marbleS, 1.4);
    g.beginPath(); g.rect(X0, 300, X1 - X0, 200); mnFL(g, MN.marble, 1.6, 1200);
    // side niches
    [X0 + 40, X1 - 40].forEach(x => { g.beginPath(); g.moveTo(x - 22, 470); g.lineTo(x - 22, 380); g.quadraticCurveTo(x - 22, 350, x, 342); g.quadraticCurveTo(x + 22, 350, x + 22, 380); g.lineTo(x + 22, 470); g.closePath(); mnFL(g, '#e2d6bf', 1.2, 400); });
    // the cusped (multifoil) arch opening onto a red interior
    const ax = (X0 + X1) / 2, aw = 78, ay = 360;
    const arch = () => {
      g.beginPath(); g.moveTo(ax - aw, 500); g.lineTo(ax - aw, ay + 10);
      for (let k = 0; k < 7; k++) { const a0 = PI + k / 7 * PI, a1 = PI + (k + 1) / 7 * PI; const xm = ax + Math.cos((a0 + a1) / 2) * aw * 0.92, ym = ay + Math.sin((a0 + a1) / 2) * aw * 0.92; g.quadraticCurveTo(xm, ym - 6, ax + Math.cos(a1) * aw, ay + Math.sin(a1) * aw); }
      g.lineTo(ax + aw, 500); g.closePath();
    };
    arch(); mnFL(g, MN.red, 1.6, 900);
    g.save(); arch(); g.clip();
    g.globalAlpha = MN_R.col;
    // interior: a niche with a lamp, a carpet seen from above and a bolster
    g.fillStyle = '#8f1f1c'; g.beginPath(); g.moveTo(ax - 18, 460); g.lineTo(ax - 18, 410); g.quadraticCurveTo(ax, 392, ax + 18, 410); g.lineTo(ax + 18, 460); g.fill();
    const fl = 0.8 + 0.2 * Math.sin(t * 13) * Math.sin(t * 7.3);
    g.fillStyle = MN.yel; g.beginPath(); g.ellipse(ax, 432 - fl * 2, 3, 7 * fl, 0, 0, TAU); g.fill();
    g.fillStyle = '#2f3f7a'; g.fillRect(ax - aw, 470, aw * 2, 30);
    g.fillStyle = '#e0b84a'; for (let x = ax - aw + 6; x < ax + aw; x += 12) g.fillRect(x, 474, 6, 3);
    g.fillStyle = MN.yel; rrect(g, ax - 50, 456, 100, 16, 8); g.fill();
    g.globalAlpha = 1; g.restore();
    // chajja (eave) and balustrade
    g.beginPath(); g.moveTo(X0 - 16, 300); g.lineTo(X1 + 16, 300); g.lineTo(X1 + 4, 284); g.lineTo(X0 - 4, 284); g.closePath(); mnFL(g, MN.marbleS, 1.4);
    g.beginPath(); g.rect(X0, 254, X1 - X0, 30); mnFL(g, MN.marble, 1.3);
    g.globalAlpha = MN_R.line; g.strokeStyle = mixc(MN.khaka, MN.ink, MN_R.col * 0.8); g.lineWidth = 1;
    for (let x = X0 + 8; x < X1; x += 12) { g.beginPath(); g.moveTo(x, 258); g.lineTo(x, 280); g.stroke(); }
    g.globalAlpha = 1;
    // central bangaldar (curved Bengal) roof pavilion and two domed chhatris
    g.beginPath(); g.rect(ax - 62, 200, 124, 54); mnFL(g, MN.marble, 1.3);
    [ax - 40, ax, ax + 40].forEach(x => { g.beginPath(); g.moveTo(x - 12, 254); g.lineTo(x - 12, 222); g.quadraticCurveTo(x, 210, x + 12, 222); g.lineTo(x + 12, 254); g.closePath(); mnFL(g, '#c43a2a', 1); });
    g.beginPath(); g.moveTo(ax - 74, 204); g.quadraticCurveTo(ax, 150, ax + 74, 204); g.quadraticCurveTo(ax, 188, ax - 74, 204); mnFL(g, MN.marbleS, 1.4);
    [X0 + 36, X1 - 36].forEach(x => {
      g.beginPath(); g.rect(x - 26, 222, 52, 32); mnFL(g, MN.marble, 1.2);
      g.beginPath(); g.rect(x - 14, 228, 28, 26); mnFL(g, '#c43a2a', 1);
      g.beginPath(); g.moveTo(x - 32, 224); g.lineTo(x + 32, 224); g.lineTo(x + 24, 214); g.lineTo(x - 24, 214); g.closePath(); mnFL(g, MN.marbleS, 1.2);
      g.beginPath(); g.moveTo(x - 22, 214); g.bezierCurveTo(x - 26, 180, x - 6, 172, x, 160); g.bezierCurveTo(x + 6, 172, x + 26, 180, x + 22, 214); g.closePath(); mnFL(g, MN.marble, 1.3, 300);
      g.beginPath(); g.moveTo(x - 3, 162); g.lineTo(x, 146); g.lineTo(x + 3, 162); g.closePath(); mnGold(g, x, 0.8);
      g.beginPath(); g.arc(x, 150, 3.2, 0, TAU); mnGold(g, x);
    });
    g.beginPath(); g.moveTo(ax - 3, 170); g.lineTo(ax, 150); g.lineTo(ax + 3, 170); g.closePath(); mnGold(g, ax, 0.8);
    // gold rule on the cornice and a red-and-white inlay band on the plinth
    g.beginPath(); g.rect(X0 - 16, 299, X1 - X0 + 32, 3); mnGold(g, X0);
    g.globalAlpha = MN_R.col; g.fillStyle = '#b6452e';
    for (let x = X0 - 6; x < X1 + 6; x += 18) { g.beginPath(); g.moveTo(x, 520); g.lineTo(x + 9, 510); g.lineTo(x + 18, 520); g.lineTo(x + 9, 530); g.closePath(); g.fill(); }
    g.globalAlpha = 1;
  }
  // Peacock perched on the parapet: origin at its feet, facing left; tail train hangs over the eave.
  function mnPeacock(g, t) {
    const p = seg(t, MN_T.peacock[0], MN_T.peacock[0] + 0.4) * (1 - seg(t, MN_T.peacock[1] - 0.3, MN_T.peacock[1]));
    const call = E.ioS(p), sway = Math.sin(t * 1.7) * 0.03;
    g.save(); g.translate(1010, 256);
    // train: long, fanning slightly as it calls
    g.save(); g.rotate(-0.15 + sway - call * 0.35);
    for (let k = -3; k <= 3; k++) {
      const a = PI * 0.08 + k * (0.05 + call * 0.06), L = 120 - Math.abs(k) * 6;
      g.save(); g.rotate(a);
      mnLeaf(g, 0, 0, L, 0, 0.09); mnFL(g, MN.green, 0.8, 300);
      g.globalAlpha = MN_R.col;
      for (let e = 0.45; e < 1; e += 0.18) { g.fillStyle = '#2b9a8a'; g.beginPath(); g.ellipse(L * e, 0, 4.2, 3, 0, 0, TAU); g.fill(); g.fillStyle = '#1a2d6a'; g.beginPath(); g.arc(L * e, 0, 1.6, 0, TAU); g.fill(); }
      g.globalAlpha = 1; g.restore();
    }
    g.restore();
    // body, neck and crest
    smooth(g, [[-14, -8], [0, -18], [22, -14], [26, -4], [6, 2], [-12, 0]]); mnFL(g, '#2a63a8', 1.2, 200);
    const nk = -0.2 - call * 0.35;
    g.save(); g.translate(-10, -12); g.rotate(nk);
    tube(g, [[0, 0], [-4, -14], [-6, -26]], 5, 3.5); mnFL(g, '#2f56b8', 1);
    g.beginPath(); g.arc(-7, -29, 5, 0, TAU); mnFL(g, '#2f56b8', 1);
    g.beginPath(); g.moveTo(-11, -29); g.lineTo(-19 - call * 3, -27 + call * 2); g.lineTo(-11, -26); g.closePath(); mnFL(g, '#c9b28a', 0.8);
    g.globalAlpha = MN_R.col; g.fillStyle = MN.white; g.beginPath(); g.arc(-8, -30, 1.4, 0, TAU); g.fill();
    g.strokeStyle = '#2f56b8'; g.lineWidth = 0.8; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(-6, -33); g.lineTo(-6 + k * 4, -42); g.stroke(); g.beginPath(); g.arc(-6 + k * 4, -43, 1.3, 0, TAU); g.fillStyle = MN_GOLD; g.fill(); }
    g.globalAlpha = 1; g.restore();
    g.restore();
  }
  function mnTerrace(g, t) {
    // the terrace is shown from above while everything on it stands upright: the miniature's tilted ground plane
    g.beginPath(); g.rect(0, 520, MN_PW, 220); mnFL(g, MN.marble, 1.6, 1800);
    g.globalAlpha = MN_R.col; g.strokeStyle = 'rgba(160,140,110,0.5)'; g.lineWidth = 1;
    for (let x = 0; x < MN_PW; x += 55) { g.beginPath(); g.moveTo(x, 522); g.lineTo(x, 712); g.stroke(); }
    g.globalAlpha = 1;
    // charbagh flowerbed: rows of poppies and irises drawn upright
    g.beginPath(); g.rect(30, 552, 220, 138); mnFL(g, '#4e8c4a', 1.4, 800);
    g.globalAlpha = MN_R.col;
    for (let row = 0; row < 4; row++) for (let k = 0; k < 8; k++) {
      const x = 46 + k * 27 + (row % 2) * 12, y = 580 + row * 30, s = Math.sin(t * 1.5 + k + row) * 1.2;
      g.strokeStyle = '#2d5e33'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y + 12); g.lineTo(x + s, y); g.stroke();
      g.fillStyle = '#3b7a40'; mnLeaf(g, x, y + 10, 9, -2.4); g.fill(); mnLeaf(g, x, y + 8, 9, -0.7); g.fill();
      g.fillStyle = (row + k) % 3 ? MN.red : MN.white; g.beginPath(); g.arc(x + s, y - 2, 4, 0, TAU); g.fill();
      g.fillStyle = MN.ink; g.beginPath(); g.arc(x + s, y - 2, 1.1, 0, TAU); g.fill();
    }
    g.globalAlpha = 1;
    // lotus tank before the pavilion
    g.beginPath(); g.moveTo(740, 580); g.lineTo(1060, 580); g.lineTo(1080, 600); g.lineTo(1080, 680); g.lineTo(1060, 700); g.lineTo(740, 700); g.lineTo(720, 680); g.lineTo(720, 600); g.closePath(); mnFL(g, MN.waterD, 1.6, 1000);
    g.save(); g.clip();
    g.globalAlpha = MN_R.col * 0.75; g.strokeStyle = '#d9e4ee'; g.lineWidth = 1;
    for (let row = 0; row < 12; row++) for (let k = 0; k < 26; k++) { const x = 716 + k * 14 + (row % 2) * 7 - (t * 6 % 14), y = 586 + row * 10; g.beginPath(); g.arc(x, y, 5, PI * 1.1, PI * 1.9); g.stroke(); }
    g.globalAlpha = 1; g.restore();
    [[780, 620], [860, 660], [960, 612], [1030, 666], [900, 600]].forEach(([x, y], i) => {
      g.beginPath(); g.ellipse(x, y + 6, 18, 7, 0, 0, TAU); mnFL(g, '#3f7d4a', 1);
      const op = 0.6 + 0.4 * E.outQ(seg(t, 4.6 + i * 0.25, 5.4 + i * 0.25));
      for (let k = -2; k <= 2; k++) { g.save(); g.translate(x, y + 2); g.rotate(k * 0.32 * op); mnLeaf(g, 0, 0, 14, -PI / 2, 0.35); mnFL(g, i % 2 ? MN.white : MN.pink, 0.8, 80); g.restore(); }
    });
    // carpet laid flat: crimson field, gold border, floral lattice
    g.beginPath(); g.rect(290, 566, 380, 118); mnFL(g, MN.lac, 1.6, 1000);
    g.beginPath(); g.rect(290, 566, 380, 118); g.rect(300, 576, 360, 98); mnGold(g, 300, 0, 'evenodd');
    g.globalAlpha = MN_R.col;
    for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) { const x = 322 + i * 40 + (j % 2) * 20, y = 596 + j * 28; g.fillStyle = '#e6b43a'; g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); g.fillStyle = MN.white; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + Math.cos(k * PI / 2) * 7, y + Math.sin(k * PI / 2) * 7, 2, 0, TAU); g.fill(); } }
    g.globalAlpha = 1;
    // front edge: red sandstone with white inlay, and a low gold-capped step
    g.beginPath(); g.rect(0, 712, MN_PW, 28); mnFL(g, '#a8432c', 1.4, 1200);
    g.globalAlpha = MN_R.col; g.strokeStyle = MN.white; g.lineWidth = 1.6;
    for (let x = 0; x < MN_PW; x += 24) { g.beginPath(); g.moveTo(x, 726); g.lineTo(x + 12, 718); g.lineTo(x + 24, 726); g.lineTo(x + 12, 734); g.closePath(); g.stroke(); }
    g.globalAlpha = 1;
  }

  // Profile head facing right, centre at origin (≈ 40 units tall): the long Kangra forehead-and-nose line.
  function mnHead(g, skin, fem) {
    if (fem) { // long braid down the back
      g.beginPath(); g.moveTo(-14, 4); g.bezierCurveTo(-24, 30, -26, 70, -20, 110); g.lineTo(-14, 110); g.bezierCurveTo(-18, 70, -14, 30, -6, 8); g.closePath(); mnFL(g, '#17110d', 1);
    }
    g.beginPath(); g.moveTo(2, -19); g.lineTo(21, -1); g.lineTo(17, 2); g.quadraticCurveTo(19, 5, 16, 7); g.quadraticCurveTo(18, 9, 15, 11); g.quadraticCurveTo(13, 16, 6, 17);
    g.quadraticCurveTo(-2, 18, -4, 26); g.lineTo(-12, 26); g.quadraticCurveTo(-18, 10, -16, -4); g.quadraticCurveTo(-12, -20, 2, -19); g.closePath();
    mnFL(g, skin, 1.2, 260);
    // hair cap
    g.beginPath(); g.moveTo(3, -19); g.quadraticCurveTo(-14, -22, -19, -6); g.quadraticCurveTo(-21, 8, -13, 14); g.quadraticCurveTo(-8, 4, -4, -2); g.quadraticCurveTo(-1, -10, 7, -13); g.closePath(); mnFL(g, '#17110d', 1);
    if (MN_R.col > 0) {
      g.globalAlpha = MN_R.col;
      // the long fish-shaped eye reaching toward the temple
      g.beginPath(); g.moveTo(1, -5); g.quadraticCurveTo(7, -10, 13, -6); g.quadraticCurveTo(7, -3, 1, -5); g.fillStyle = MN.white; g.fill();
      g.strokeStyle = MN.ink; g.lineWidth = 0.9; g.stroke();
      g.beginPath(); g.moveTo(1, -5); g.lineTo(-4, -6); g.stroke();
      g.fillStyle = '#120c08'; g.beginPath(); g.arc(9, -6.4, 1.9, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(-1, -10); g.quadraticCurveTo(7, -14, 14, -9); g.lineWidth = 1.1; g.stroke();
      g.fillStyle = MN.red; g.beginPath(); g.ellipse(15.6, 8.6, 1.8, 1.0, 0, 0, TAU); g.fill();
      g.globalAlpha = 1;
    }
  }
  // Krishna, profile facing right, playing the flute; origin between the feet.
  function mnKrishna(g, t) {
    const br = Math.sin(t * 2.2) * 0.6;
    // vanamala garland and scarf behind
    g.beginPath(); g.moveTo(-24, -228); g.bezierCurveTo(-46, -180, -56, -110, -52, -50); g.bezierCurveTo(-46, -80, -40, -150, -16, -216); g.closePath(); mnFL(g, MN.orange, 1, 500);
    // far arm (behind the body)
    tube(g, [[-4, -226], [10, -194], [44, -246]], 6.5, 5); mnFL(g, MN.krishnaD, 1.1, 300);
    // feet
    [[-16, 0], [12, 0]].forEach(([x]) => { g.beginPath(); g.moveTo(x - 8, -10); g.lineTo(x - 8, 0); g.lineTo(x + 16, 0); g.quadraticCurveTo(x + 12, -6, x + 4, -10); g.closePath(); mnFL(g, MN.krishna, 1); });
    // pitambar: the yellow dhoti, hip shifted (tribhanga)
    smooth(g, [[-30, -152], [32, -154], [40, -108], [34, -58], [38, -14], [12, -10], [0, -40], [-12, -10], [-40, -14], [-36, -60], [-42, -110]]); mnFL(g, MN.yel, 1.4, 700);
    g.globalAlpha = MN_R.col; g.strokeStyle = '#c98d1c'; g.lineWidth = 1.2;
    [[-24, -140, -30, -20], [-8, -142, -10, -50], [10, -144, 22, -20], [24, -146, 34, -60]].forEach(([x0, y0, x1, y1]) => { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + 6, (y0 + y1) / 2, x1, y1); g.stroke(); });
    g.globalAlpha = 1;
    // sash with gold ends
    g.beginPath(); g.moveTo(24, -152); g.quadraticCurveTo(36 + br, -110, 30 + br, -54); g.lineTo(20 + br, -54); g.quadraticCurveTo(26, -110, 16, -150); g.closePath(); mnFL(g, MN.red, 1);
    g.beginPath(); g.rect(20 + br, -64, 10, 10); mnGold(g, 300);
    g.beginPath(); g.rect(-34, -158, 70, 8); mnFL(g, MN.lac, 1); g.beginPath(); g.rect(-34, -156, 70, 3); mnGold(g, 300);
    // torso
    smooth(g, [[-30, -150], [28, -152], [30, -192], [30, -222], [14, -238], [-16, -238], [-30, -222], [-34, -190]]); mnFL(g, MN.krishna, 1.4, 500);
    // necklace and garland front
    g.beginPath(); g.moveTo(-14, -236); g.quadraticCurveTo(4, -200, 22, -234); g.lineWidth = 2.6; g.strokeStyle = MN_GOLD; g.globalAlpha = clamp(MN_GA * 2.4 - 0.6); g.stroke(); g.globalAlpha = 1;
    // vanamala: a long garland of forest flowers on a green strand
    g.globalAlpha = MN_R.col; g.beginPath();
    for (let k = 0; k <= 30; k++) { const u = k / 30, x = lerp(-14, 22, u) + Math.sin(u * PI) * 6, y = -234 + Math.sin(u * PI) * 96; k ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.strokeStyle = '#2d6a3a'; g.lineWidth = 2.2; g.stroke();
    for (let k = 1; k < 30; k++) { const u = k / 30, x = lerp(-14, 22, u) + Math.sin(u * PI) * 6, y = -234 + Math.sin(u * PI) * 96; g.fillStyle = k % 3 === 0 ? MN.white : k % 3 === 1 ? MN.red : MN.orange; g.beginPath(); g.arc(x, y, 2.3, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
    // head, crown and peacock feather
    g.save(); g.translate(6, -262); g.rotate(-0.06);
    mnHead(g, MN.krishna, false);
    g.beginPath(); g.moveTo(-14, -14); g.lineTo(8, -18); g.lineTo(4, -40); g.lineTo(-4, -50); g.lineTo(-10, -38); g.closePath(); mnGold(g, 300, 0.8);
    g.globalAlpha = MN_R.col; g.fillStyle = MN.red; [[0, -28], [-6, -22], [2, -38]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 1.8, 0, TAU); g.fill(); }); g.globalAlpha = 1;
    g.save(); g.translate(-4, -46); g.rotate(-0.9 + Math.sin(t * 1.4) * 0.04);
    mnLeaf(g, 0, 0, 34, -PI / 2, 0.18); mnFL(g, '#2f8a5a', 0.8, 100);
    g.globalAlpha = MN_R.col; g.fillStyle = '#2aa5a0'; g.beginPath(); g.ellipse(0, -26, 4.6, 6, 0, 0, TAU); g.fill(); g.fillStyle = '#1c2a78'; g.beginPath(); g.ellipse(0, -26, 2.2, 3, 0, 0, TAU); g.fill(); g.globalAlpha = 1;
    g.restore();
    g.beginPath(); g.arc(-3, 8, 2.6, 0, TAU); mnGold(g, 300);
    g.restore();
    // near arm and the bansuri flute
    g.beginPath(); g.moveTo(24, -259); g.lineTo(124, -239); g.lineWidth = 4; g.strokeStyle = mixc(MN.khaka, '#5a3a1c', MN_R.col); g.globalAlpha = MN_R.line; g.stroke(); g.globalAlpha = 1;
    g.globalAlpha = MN_R.col; g.fillStyle = MN_GOLD; [40, 70, 104, 118].forEach(x => { g.fillRect(x - 1.2, -259 + (x - 24) * 0.2 - 2.4, 2.4, 4.8); }); g.globalAlpha = 1;
    tube(g, [[16, -224], [50, -196], [94, -244]], 6.5, 5); mnFL(g, MN.krishna, 1.2, 300);
    [[44, -248], [96, -243]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 7, 5, 0.3, 0, TAU); mnFL(g, MN.krishna, 1, 60); });
    [[46, -200], [24, -222]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 5, 3, 0.8, 0, TAU); mnGold(g, 300); });
  }
  // Radha, drawn facing right and mirrored by the caller; origin between the feet.
  function mnRadha(g, t) {
    const fl = Math.sin(t * 1.6) * 3;
    // odhni (veil) back panel, translucent, falling to the ground behind her
    g.beginPath(); g.moveTo(-6, -292); g.bezierCurveTo(-40, -270, -56, -160, -70 - fl, -4); g.lineTo(-30, -4); g.bezierCurveTo(-30, -120, -24, -220, 10, -280); g.closePath();
    mnFill(g, 'rgba(226,108,40,0.55)'); mnLine(g, 1, 500);
    // ghagra skirt: flared, pleated, gold hem
    const sk = () => { g.beginPath(); g.moveTo(-24, -150); g.lineTo(26, -152); g.quadraticCurveTo(44, -90, 66 + fl * 0.5, -4); g.quadraticCurveTo(0, 6, -58, -4); g.quadraticCurveTo(-44, -90, -24, -150); g.closePath(); };
    sk(); mnFL(g, '#2e6b46', 1.4, 600);
    g.save(); sk(); g.clip();
    g.globalAlpha = MN_R.col; g.strokeStyle = '#1d4a30'; g.lineWidth = 1.2;
    for (let k = -5; k <= 5; k++) { g.beginPath(); g.moveTo(k * 4, -150); g.quadraticCurveTo(k * 8, -80, k * 12 + fl * 0.3, 0); g.stroke(); }
    g.fillStyle = '#f1d48a'; for (let k = 0; k < 40; k++) { const u = hash(k * 3.3), v = hash(k * 7.1); g.beginPath(); g.arc(lerp(-50, 56, u) * lerp(0.4, 1, v), lerp(-140, -20, v), 1.4, 0, TAU); g.fill(); }
    g.globalAlpha = 1; g.restore();
    g.beginPath(); g.moveTo(-58, -4); g.quadraticCurveTo(0, 6, 66 + fl * 0.5, -4); g.lineTo(64, -16); g.quadraticCurveTo(0, -6, -55, -16); g.closePath(); mnGold(g, 500, 0.6);
    // feet with red alta
    [[-10, -2], [16, -2]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x - 4, y - 6); g.lineTo(x + 16, y); g.lineTo(x - 4, y + 2); g.closePath(); mnFL(g, MN.skin, 0.9); g.beginPath(); g.rect(x - 4, y, 20, 2); mnFill(g, MN.red); });
    // choli and midriff
    smooth(g, [[-20, -150], [22, -152], [24, -176], [-22, -174]]); mnFL(g, MN.skin, 1);
    smooth(g, [[-22, -176], [26, -178], [24, -212], [12, -232], [-12, -232], [-24, -212]]); mnFL(g, MN.red, 1.3, 400);
    // necklace
    g.beginPath(); g.moveTo(-10, -230); g.quadraticCurveTo(4, -208, 16, -230); g.lineWidth = 2.4; g.strokeStyle = MN_GOLD; g.globalAlpha = clamp(MN_GA * 2.4 - 0.7); g.stroke(); g.globalAlpha = 1;
    // head with nose ring
    g.save(); g.translate(4, -256); g.rotate(0.1);
    mnHead(g, MN.skin, true);
    g.beginPath(); g.arc(17, 4, 4, -0.4, PI * 1.2); g.lineWidth = 1; g.strokeStyle = MN_GOLD; g.globalAlpha = clamp(MN_GA * 2.4 - 0.7); g.stroke(); g.globalAlpha = 1;
    g.beginPath(); g.arc(-4, 7, 2.4, 0, TAU); mnGold(g, 500);
    g.restore();
    // odhni over the head and across the front, with a gold-dotted border
    const veil = [[-20, -278], [-2, -284], [2, -270], [-4, -250], [-6, -232], [20, -204], [32, -160], [14, -166], [-18, -214], [-24, -250]];
    smooth(g, veil); mnFill(g, 'rgba(226,108,40,0.5)'); mnLine(g, 1, 400);
    g.globalAlpha = clamp(MN_GA * 2.4 - 0.7); g.fillStyle = MN_GOLD;
    const edge = bez([-1, -280], [0, -262], [-10, -236], [28, -170], 14);
    edge.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 1.4, 0, TAU); g.fill(); });
    g.globalAlpha = 1;
    // arms: one hand raised shyly to the veil, one lowered holding a lotus
    tube(g, [[14, -222], [28, -190], [24, -226]], 5, 4); mnFL(g, MN.skin, 1, 200);
    tube(g, [[-12, -222], [-18, -180], [-10, -140]], 5, 4); mnFL(g, MN.skin, 1, 200);
    g.beginPath(); g.moveTo(-10, -140); g.quadraticCurveTo(-4, -120, 2, -100); g.lineWidth = 1.2; g.strokeStyle = '#2d5e33'; g.globalAlpha = MN_R.col; g.stroke(); g.globalAlpha = 1;
    for (let k = -2; k <= 2; k++) { g.save(); g.translate(-10, -142); g.rotate(k * 0.3 - 0.4); mnLeaf(g, 0, 0, 12, -PI / 2, 0.35); mnFL(g, MN.pink, 0.7, 60); g.restore(); }
    [[24, -214], [-14, -170]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 4.5, 2.6, 0.6, 0, TAU); mnGold(g, 500); });
  }
  function mnBirds(g, t) {
    const [b0, b1] = MN_T.birds; if (t < b0 || t > b1) return;
    const u = seg(t, b0, b1);
    [[0, 0], [38, 14]].forEach(([dx, dy], i) => {
      const x = lerp(1160, -80, u) + dx, y = 62 + dy + Math.sin(u * 4 + i) * 6, f = Math.sin(t * 7 + i * 1.3);
      g.save(); g.translate(x, y);
      g.fillStyle = '#f2efe6'; g.strokeStyle = MN.ink; g.lineWidth = 0.8;
      g.beginPath(); g.ellipse(0, 0, 13, 4, 0, 0, TAU); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-4, 0); g.quadraticCurveTo(2, -14 * f, 12, -20 * f); g.lineTo(6, -2); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(-12, 0); g.lineTo(-26, -3); g.lineWidth = 1.4; g.stroke();
      g.fillStyle = MN.red; g.beginPath(); g.arc(-26, -3, 1.8, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(12, 0); g.lineTo(28, 4); g.strokeStyle = '#7a5a3a'; g.lineWidth = 1; g.stroke();
      g.restore();
    });
  }
  // The painted scene, in painting units (0..1100 × 0..740).
  function mnPainting(g, t, st) {
    g.save(); g.beginPath(); g.rect(0, 0, MN_PW, MN_PH); g.clip();
    g.fillStyle = st.paperPat; g.fillRect(0, 0, MN_PW, MN_PH);
    mnLayer(t, 'sky'); mnSky(g, t);
    mnBirds(g, t);
    mnLayer(t, 'hills'); mnHills(g, t, st);
    mnLayer(t, 'trees'); mnTrees(g, t, st);
    mnLayer(t, 'pav'); mnPavilion(g, t); mnPeacock(g, t);
    mnLayer(t, 'terr'); mnTerrace(g, t);
    mnLayer(t, 'figs');
    g.save(); g.translate(408, 640); mnKrishna(g, t); g.restore();
    g.save(); g.translate(596, 640); g.scale(-1, 1); mnRadha(g, t); g.restore();
    // falling blossoms from the flowering tree once the flute plays
    if (t > MN_T.flute) {
      g.fillStyle = MN.white;
      for (let k = 0; k < 14; k++) {
        const t0 = MN_T.flute + k * 0.33, u = (t - t0) / 3.2; if (u < 0 || u > 1) continue;
        const x = 560 + hash(k) * 160 + Math.sin(u * 7 + k) * 14 - u * 40, y = 260 + u * 360;
        g.globalAlpha = Math.sin(u * PI); g.beginPath(); g.ellipse(x, y, 2.6, 1.6, u * 6 + k, 0, TAU); g.fill();
      }
      g.globalAlpha = 1;
    }
    // burnished-paper sheen over all the pigment
    g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.35; g.fillStyle = st.paperPat; g.fillRect(0, 0, MN_PW, MN_PH);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.restore();
  }
  // Borders: painting rules, the lapis band with a gold vine, and the hashiya margin of gold flowering plants.
  function mnFrameArt(g, st) {
    const B = MN_B;
    g.fillStyle = st.hashPat; g.fillRect(-B, -B, MN_PW + B * 2, MN_PH + B * 2);
    // gold flowering plants all round the hashiya, upright on every side (as in Jahangir-period album margins)
    const r = rng(404), plant = (x, y, s, kind) => {
      g.save(); g.translate(x, y); g.scale(s, s);
      g.strokeStyle = '#a67a26'; g.fillStyle = '#c99a3a'; g.lineWidth = 1.6;
      g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-4, 10, 6, -10, 0, -30); g.stroke();
      [[-1, 18, -2.4], [1, 8, -0.6], [-1, -4, -2.6], [1, -14, -0.5]].forEach(([, ly, a]) => { mnLeaf(g, 0, ly, 18, a, 0.32); g.fill(); g.stroke(); });
      if (kind === 0) { for (let k = 0; k < 5; k++) { g.save(); g.translate(0, -32); g.rotate(-PI / 2 + (k - 2) * 0.45); mnLeaf(g, 0, 0, 14, 0, 0.4); g.fill(); g.stroke(); g.restore(); } }
      else if (kind === 1) { g.beginPath(); g.arc(0, -36, 8, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(0, -36, 3, 0, TAU); g.stroke(); }
      else { [-1, 1].forEach(sx => { g.beginPath(); g.ellipse(sx * 6, -34, 4, 9, sx * 0.5, 0, TAU); g.fill(); g.stroke(); }); g.beginPath(); g.ellipse(0, -40, 4, 10, 0, 0, TAU); g.fill(); g.stroke(); }
      g.restore();
    };
    const mid = -B / 2 - 23, bot = MN_PH + B / 2 + 23, rgt = MN_PW + B / 2 + 23;
    for (let i = 0; i <= 18; i++) {
      const x = -80 + i * (MN_PW + 160) / 18;
      if (Math.abs(x - MN_PW / 2) > 200) plant(x, mid + 4, 1.12, i % 3);
      plant(x, bot + 4, 1.12, (i + 1) % 3);
    }
    for (let i = 0; i <= 9; i++) { const y = 10 + i * (MN_PH - 20) / 9; plant(mid, y, 1.12, i % 3); plant(rgt, y, 1.12, (i + 2) % 3); }
    // small gold sprigs scattered between
    for (let i = 0; i < 160; i++) {
      const side = i % 4, u = r();
      const x = side < 2 ? lerp(-B + 10, MN_PW + B - 10, u) : side === 2 ? -B + 12 + r() * 90 : MN_PW + 22 + r() * 90;
      const y = side >= 2 ? lerp(-B + 10, MN_PH + B - 10, u) : side === 0 ? -B + 12 + r() * 90 : MN_PH + 22 + r() * 90;
      g.fillStyle = 'rgba(190,140,50,0.7)'; g.beginPath(); g.arc(x, y, 1.4 + r() * 1.4, 0, TAU); g.fill();
    }
    // lapis border band with a running gold vine
    g.fillStyle = MN.lapisD; g.beginPath(); g.rect(-40, -40, MN_PW + 80, MN_PH + 80); g.rect(-10, -10, MN_PW + 20, MN_PH + 20); g.fill('evenodd');
    g.strokeStyle = '#d6a63e'; g.fillStyle = '#d6a63e'; g.lineWidth = 1.4;
    const vine = (x0, y0, x1, y1) => {
      const L = Math.hypot(x1 - x0, y1 - y0), dx = (x1 - x0) / L, dy = (y1 - y0) / L, n = Math.round(L / 40);
      g.beginPath();
      for (let i = 0; i <= n * 8; i++) { const u = i / (n * 8), w = Math.sin(u * n * TAU) * 7; const x = x0 + dx * L * u - dy * w, y = y0 + dy * L * u + dx * w; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
      for (let i = 0; i < n; i++) { const u = (i + 0.25) / n, s = i % 2 ? 1 : -1; const x = x0 + dx * L * u - dy * 7 * s, y = y0 + dy * L * u + dx * 7 * s; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); mnLeaf(g, x, y, 8, Math.atan2(dy, dx) + s * 0.9, 0.4); g.fill(); }
    };
    vine(-25, -25, MN_PW + 25, -25); vine(-25, MN_PH + 25, MN_PW + 25, MN_PH + 25); vine(-25, -25, -25, MN_PH + 25); vine(MN_PW + 25, -25, MN_PW + 25, MN_PH + 25);
    // the inscription cartouche on the top margin (Pahari folios carry a takri or devanagari label here)
    g.fillStyle = '#e8c15a'; rrect(g, MN_PW / 2 - 170, -B + 30, 340, 64, 6); g.fill();
    g.strokeStyle = '#9b1d33'; g.lineWidth = 3; g.stroke();
  }
  function mnRules(g, u) {
    // ruled lines drawn on with the ruling pen, inner to outer
    const rule = (d, col, lw, k) => {
      const a = clamp(u * 1.6 - k * 0.12); if (a <= 0) return;
      const w = MN_PW + d * 2, h = MN_PH + d * 2, P = (w + h) * 2;
      g.beginPath(); g.rect(-d, -d, w, h); g.strokeStyle = col; g.lineWidth = lw;
      if (a < 1) { g.setLineDash([a * P, 1e5]); g.stroke(); g.setLineDash([]); } else g.stroke();
    };
    rule(2, '#120c08', 2.4, 0); rule(6, '#f6f0e0', 3.2, 1); rule(10, MN_GOLD, 2.2, 2); rule(42, MN_GOLD, 3, 3); rule(46, '#9b1d33', 2.2, 4); rule(MN_B - 1, 'rgba(120,80,40,0.5)', 1.2, 5);
  }
  const MN_CAM = { x: [[0, 550], [1.4, 550], [2.6, 550], [4.5, 520], [6.4, 486], [6.7, 486], [8.0, 550]], y: [[0, 392], [1.4, 392], [2.6, 372], [4.5, 400], [6.4, 452], [6.7, 452], [8.0, 492]], z: [[0, 0.8], [1.3, 0.8], [2.6, 1.42], [4.5, 1.6], [6.4, 2.25], [6.7, 2.25], [8.0, 0.78]] };

  MG.film({
    id: 'miniature', dur: 10, poster: 9.4,
    fonts: [['400 80px "Rozha One"', 'INDIAN MINIATURE'], ['400 48px "Tiro Devanagari Hindi"', 'लघुचित्र राधा कृष्ण'], ['italic 500 30px "Cormorant Garamond"', 'Mughal · Rajput · Pahari, 16th–19th century'], ['600 30px "Cormorant Garamond"', 'KANGRA']],
    meta: {
      family: 'I', name: 'Indian Miniature', sub: 'Mughal · Rajput · Pahari painting', era: '16th–19th c.',
      origin: 'Album and manuscript painting of the Mughal court (from Akbar’s atelier in the 1560s) and of the Rajput kingdoms of Rajasthan and the Pahari hill states of the Punjab Himalaya. Painters burnished wasli paper, sketched a red-ochre khaka, laid mineral and lake pigments in flat layers and finished with gold; Persian conventions — a high horizon, tilted ground planes, cypress and garden — met Indian devotional subjects, above all the love of Radha and Krishna in the Gita Govinda and Bhagavata Purana.',
      works: 'Hamzanama for Akbar (c. 1562–77) · Jahangir album pages with gold-flowered hashiya margins (c. 1610–20) · Nainsukh of Guler, paintings for Balwant Singh of Jasrota (c. 1740s–50s) · Kangra Gita Govinda series (c. 1775–80) · Kishangarh “Bani Thani” type, Nihal Chand (c. 1750)',
      tech: ['Burnished wasli paper, red khaka underdrawing', 'Flat mineral pigments (lapis, malachite, vermilion, Indian yellow)', 'Gold leaf and shell gold, burnished', 'Tilted perspective, profile figures, ornate hashiya margins'],
      accent: '#c9361f',
      motionDNA: 'The painting is built the way a workshop built it — rules drawn, margin burnished, khaka sketched, colour laid layer by layer, gold applied last — then only gentle, devotional motion: a flute raised, a veil lifting, a peacock’s call, ripples in the tank, cranes crossing the sky.',
      visualDNA: 'A high-horizon garden terrace shown from above with upright profile figures, white marble pavilions with cusped arches and chhatris, rounded trees of countless leaves, jewel-tone lapis, vermilion and malachite on cream, fine dark outlines and glinting gold, inside rules, a lapis vine border and a gold-flowered hashiya.',
      transitions: 'Ruling-pen line draw, khaka-to-colour layering, gold-leaf sweep with sheen, slow camera glide across the folio, pull-back to the album page and its inscription',
      implementation: ['Mineral pigment and gold on wasli', 'Illustrator / Procreate + AE layered reveal', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const st = {};
      const tmp = offscreen(4, 4).getContext('2d');
      st.paperPat = tmp.createPattern(paperTile(MN.paper, 2101, 0.04, 512, '90,60,30', '255,252,240', 18), 'repeat');
      st.hashPat = tmp.createPattern(paperTile(MN.hashiya, 2117, 0.06), 'repeat');
      const r = rng(2203);
      st.shrubs = Array.from({ length: 26 }, () => [r() * MN_PW, 330 + r() * 180, 5 + r() * 6, r() < 0.5 ? MN.white : MN.pink]);
      // trees: mango and a flowering tree; each crown a lobed outline filled with seeded leaves
      const mkTree = (cx, cy, rx, ry, base, shades, n, trunkX, flowers) => {
        const crown = Array.from({ length: 22 }, (_, i) => { const a = i / 22 * TAU, m = 1 + 0.1 * Math.sin(i * 2.3) + (i % 2) * 0.06; return [cx + Math.cos(a) * rx * m, cy + Math.sin(a) * ry * m]; });
        const leaves = [];
        for (let k = 0; k < n; k++) { const a = r() * TAU, d = Math.sqrt(r()); leaves.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, 9 + r() * 6, -PI / 2 + (r() - 0.5) * 2.2, shades[Math.floor(r() * shades.length)]]); }
        leaves.sort((p, q) => p[1] - q[1]);
        const fl = flowers ? Array.from({ length: flowers }, () => { const a = r() * TAU, d = Math.sqrt(r()) * 0.95; return [cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d]; }) : null;
        return { cy, crown, leaves, base, flowers: fl, trunk: bez([trunkX, 560], [trunkX - 6, 500], [cx + 4, cy + ry * 0.9], [cx, cy + ry * 0.4], 8), w0: 9, w1: 5,
          branches: [bez([cx, cy + ry * 0.5], [cx - 20, cy + 20], [cx - rx * 0.5, cy], [cx - rx * 0.6, cy - 10], 6), bez([cx, cy + ry * 0.5], [cx + 20, cy + 20], [cx + rx * 0.5, cy], [cx + rx * 0.6, cy - 16], 6)] };
      };
      st.trees = [
        mkTree(300, 300, 150, 118, MN.greenD, ['#2f6a3a', '#3d7f45', '#25553a', '#4c8f4e', '#1f4a2e'], 520, 280, 0),
        mkTree(610, 300, 98, 90, '#2c5a35', ['#3b7a44', '#2f6a3a', '#4f9150'], 260, 620, 70),
      ];
      // folio frame (hashiya + border band) pre-rendered at 1.5×
      const K = 1.5, FW = MN_PW + MN_B * 2, FH = MN_PH + MN_B * 2;
      const fr = offscreen(Math.round(FW * K), Math.round(FH * K)), fg = fr.getContext('2d');
      fg.scale(K, K); fg.translate(MN_B, MN_B); mnFrameArt(fg, st);
      st.frame = fr;
      // the textile the folio rests on: madder-red cotton with small block-printed butis
      const cl = offscreen(1920, 1080), cg = cl.getContext('2d');
      cg.fillStyle = cg.createPattern(paperTile(MN.cloth, 2301, 0.08, 512, '20,0,0', '255,190,170'), 'repeat'); cg.fillRect(0, 0, 1920, 1080);
      cg.fillStyle = 'rgba(214,160,80,0.13)';
      for (let i = 0; i < 26; i++) for (let j = 0; j < 15; j++) {
        const x = i * 80 + (j % 2) * 40, y = j * 80;
        for (let k = 0; k < 6; k++) { cg.beginPath(); cg.ellipse(x + Math.cos(k / 6 * TAU) * 8, y + Math.sin(k / 6 * TAU) * 8, 6, 3, k / 6 * TAU, 0, TAU); cg.fill(); }
      }
      st.cloth = cl;
      return st;
    },
    draw(c, t, W, H, st) {
      c.drawImage(st.cloth, 0, 0);
      const fx = kf(t, MN_CAM.x), fy = kf(t, MN_CAM.y), z = Math.exp(kf(t, MN_CAM.z.map(([a, b]) => [a, Math.log(b)])));
      // gold sheen: a highlight band crossing the leaf as it is laid, then drifting slowly
      MN_GA = E.ioS(seg(t, MN_T.gold, MN_T.gold + 0.9));
      const sp = t < MN_T.gold + 1.2 ? lerp(-0.2, 1.2, seg(t, MN_T.gold, MN_T.gold + 1.2)) : 0.15 + ((t - MN_T.gold - 1.2) * 0.22) % 1.3;
      const gg = c.createLinearGradient(-200, -100, MN_PW + 200, MN_PH + 100);
      const st0 = clamp(sp - 0.1), st1 = clamp(sp), st2 = clamp(sp + 0.1);
      gg.addColorStop(0, '#c4922f'); if (st0 > 0) gg.addColorStop(st0, '#c4922f'); gg.addColorStop(st1, '#fbe7a2'); if (st2 < 1) gg.addColorStop(st2, '#c4922f'); gg.addColorStop(1, '#b8862a');
      MN_GOLD = gg;
      c.save(); c.translate(960, 540); c.scale(z, z); c.translate(-fx, -fy);
      // folio shadow and the burnished sheet
      c.save(); c.fillStyle = 'rgba(20,0,0,0.5)'; c.filter = 'blur(18px)'; c.fillRect(-MN_B + 10, -MN_B + 18, MN_PW + MN_B * 2, MN_PH + MN_B * 2); c.restore();
      c.fillStyle = st.hashPat; c.fillRect(-MN_B, -MN_B, MN_PW + MN_B * 2, MN_PH + MN_B * 2);
      // the margin and border are burnished in with a sweep round the page
      const fu = E.ioS(seg(t, 0.15, 1.45));
      if (fu > 0) {
        c.save();
        if (fu < 1) { c.beginPath(); c.moveTo(MN_PW / 2, MN_PH / 2); c.arc(MN_PW / 2, MN_PH / 2, 2000, -PI / 2, -PI / 2 + fu * TAU); c.closePath(); c.clip(); }
        c.drawImage(st.frame, -MN_B, -MN_B, MN_PW + MN_B * 2, MN_PH + MN_B * 2);
        c.restore();
      }
      c.fillStyle = st.paperPat; c.fillRect(0, 0, MN_PW, MN_PH);
      mnPainting(c, t, st);
      mnRules(c, seg(t, 0.05, 1.3));
      // the inscription: Devanagari label on the top margin, then a red seal
      if (t > MN_T.title) {
        const u = E.outC(seg(t, MN_T.title, MN_T.title + 0.7));
        c.save(); c.globalAlpha = u;
        text(c, 'लघुचित्र', MN_PW / 2, -MN_B + 64, { font: '"Tiro Devanagari Hindi", serif', size: 46, align: 'center', base: 'middle', color: '#7a1424' });
        c.restore();
      }
      c.restore();
      // English title on the cloth beneath the folio
      if (t > MN_T.title) {
        const u = E.outC(seg(t, MN_T.title + 0.15, MN_T.title + 0.85)), u2 = E.outC(seg(t, MN_T.title + 0.4, MN_T.title + 1.1));
        c.save(); c.globalAlpha = u;
        text(c, 'INDIAN MINIATURE', 960, 950 + (1 - u) * 14, { font: '"Rozha One", serif', size: 64, align: 'center', color: '#f3d58a', ls: 10 });
        c.globalAlpha = u2;
        text(c, 'Mughal · Rajput · Pahari album painting  —  16th–19th century', 960, 1006, { font: '"Cormorant Garamond", serif', style: 'italic', weight: 500, size: 30, align: 'center', color: 'rgba(243,226,190,0.85)' });
        c.restore();
      }
      grain(c, W, H, t, 0.035, 'multiply');
      vignette(c, W, H, 0.38, '30,5,5');
    },
    score(A) {
      A.bus.gain.value = 1.05;
      // tanpura: Pa–Sa–Sa–Sa' cycle on D, long buzzy plucks (jawari brightness)
      const tp = (t, m, g = 0.11) => A.pluck(t, midi(m), { dur: 3.2, g, bright: 0.85, decay: 0.9993, lp: 2600, rev: 0.4, pan: -0.2 });
      for (let k = 0; k < 16; k++) { const t = 0.1 + k * 0.62; [45, 50, 50, 38].forEach((m, i) => i === k % 4 && tp(t, m, i === 3 ? 0.13 : 0.1)); }
      A.osc(0.05, { f: midi(38), dur: 9.9, g: 0.035, a: 1.5, hold: true, rel: 1.2, lp: 500 });
      A.osc(0.05, { f: midi(45), dur: 9.9, g: 0.018, a: 2, hold: true, rel: 1.2, lp: 700 });
      // santoor-like shimmer as the ruling pen and the margin go round
      [62, 66, 69, 73, 74, 78, 81, 85].forEach((m, i) => A.pluck(0.2 + i * 0.15, midi(m), { dur: 1.6, g: 0.07, bright: 0.9, decay: 0.997, rev: 0.45, pan: (i / 7 - 0.5) * 0.8 }));
      // sitar phrases in raag Yaman (D: Sa Re Ga Ma♯ Pa Dha Ni) while the khaka and colour go down, with meend bends
      const sit = (t, m, g = 0.16, bend, pan = 0.15) => A.pluck(t, midi(m), { dur: 2.0, g, bright: 0.8, decay: 0.998, lp: 4200, rev: 0.35, pan, bend, bendAt: 0.12, bendT: 0.2 });
      [[1.5, 61], [1.75, 64], [2.0, 66], [2.4, 64, 1.06], [2.85, 68], [3.1, 69], [3.4, 71, 0.94], [3.75, 69]].forEach(([t, m, b]) => sit(t, m, 0.15, b));
      // gold laid: a soft bell and a rising glissando
      A.bell(MN_T.gold, midi(86), { g: 0.05, dur: 2.2, rev: 0.6 });
      [74, 76, 78, 80, 81, 83, 85, 86].forEach((m, i) => A.pluck(MN_T.gold + 0.05 + i * 0.07, midi(m), { dur: 1.2, g: 0.05, bright: 0.9, rev: 0.5, pan: 0.3 }));
      // bansuri: Krishna's flute, breathy with wide vibrato and glides between notes
      const fl = (t, m, d, m2, g = 0.07) => {
        A.osc(t, { f: midi(m), f2: m2 ? midi(m2) : undefined, glide: d * 0.5, dur: d, g, a: 0.08, hold: true, rel: 0.18, vib: [5.4, midi(m) * 0.01], lp: 3000, rev: 0.5, pan: -0.1 });
        A.noise(t, { type: 'bandpass', f: midi(m) * 2, q: 3, dur: d, g: g * 0.35, a: 0.06, hold: true, rel: 0.15, pan: -0.1 });
      };
      [[4.3, 73, 0.4], [4.7, 76, 0.35], [5.05, 78, 0.8, 80], [5.9, 81, 0.5], [6.4, 80, 0.3], [6.7, 78, 0.6, 76], [7.35, 73, 0.45], [7.8, 74, 1.2]].forEach(([t, m, d, m2]) => fl(t, m, d, m2));
      // tabla in keherwa (8 matras: dha ge na ti na ka dhi na) once the figures are alive
      const dayan = (t, g, f = midi(62)) => { A.osc(t, { f, dur: 0.28, g, a: 0.002 }); A.osc(t, { f: f * 2.01, dur: 0.12, g: g * 0.4, a: 0.002 }); A.noise(t, { type: 'bandpass', f: 3200, q: 2, dur: 0.02, g: g * 0.6 }); };
      const bayan = (t, g) => A.osc(t, { f: 80, f2: 112, glide: 0.18, dur: 0.4, g, a: 0.004 });
      const ta = (t, g) => A.noise(t, { type: 'bandpass', f: 2400, q: 1.5, dur: 0.05, g });
      const mat = 0.27;
      for (let cyc = 0; cyc < 2; cyc++) {
        const b0 = 4.3 + cyc * 8 * mat;
        ['dha', 'ge', 'na', 'ti', 'na', 'ka', 'dhi', 'na'].forEach((b, i) => {
          const t = b0 + i * mat;
          if (b === 'dha' || b === 'dhi') { bayan(t, 0.3); dayan(t, 0.16); }
          else if (b === 'ge') bayan(t, 0.24);
          else if (b === 'na') dayan(t, 0.12);
          else ta(t, 0.1);
        });
      }
      [[6.6, 'dha'], [6.87, 'dhi'], [7.14, 'na'], [7.41, 'dha']].forEach(([t]) => { bayan(t, 0.2); dayan(t, 0.1); });
      // ghungroo ankle bells, a light shimmer on the matras
      for (let k = 0; k < 16; k++) A.noise(4.3 + k * mat, { type: 'highpass', f: 7500, dur: 0.06, g: 0.04, pan: 0.3 });
      // the peacock's call: a rising, nasal cry
      [MN_T.peacock[0] + 0.1, MN_T.peacock[0] + 0.55].forEach((t, i) => { A.osc(t, { type: 'sawtooth', f: 620, f2: 980, glide: 0.18, dur: 0.32, g: 0.035, lp: 2400, rev: 0.4, pan: 0.5 }); A.osc(t + 0.2, { type: 'square', f: 900, f2: 700, glide: 0.1, dur: 0.14, g: 0.02, lp: 2000, pan: 0.5 }); });
      // pull back: a long sitar meend, then the title on Sa with a temple bell
      A.whoosh(MN_T.pull[0], 1.4, { f1: 200, f2: 1000, g: 0.06 });
      sit(MN_T.pull[0] + 0.2, 69, 0.14, 1.12, 0); sit(7.2, 66, 0.12, 0.94, 0);
      A.bell(MN_T.title, midi(62), { g: 0.08, dur: 2.6, ratios: [1, 2.0, 2.76, 4.1], rev: 0.6 });
      sit(MN_T.title + 0.05, 62, 0.2); sit(MN_T.title + 0.35, 69, 0.12); sit(MN_T.title + 0.6, 74, 0.13, 0.94);
      tp(MN_T.title, 38, 0.16);
      fl(8.7, 74, 1.1, 73, 0.05);
    },
  });

  /* =====================================================================
     AFRICAN PATTERN — three named traditions, each shown by its own process:
     an Asante narrow-strip loom weaves Kente and the strips are sewn edge
     to edge; Adinkra symbols are combed into a grid and stamped from carved
     calabash, each with its meaning; an amaNdebele wall is outlined in black
     and filled with flat colour; the three resolve into a labelled triptych
     ===================================================================== */
  const AP = { Y: '#f2b51e', G: '#1d7a3c', R: '#c8261e', K: '#19120d', B: '#1f4c9c', W: '#f1e6cc', O: '#e07a1f', bg: '#2a1a12', cloth: '#efe4cb', ink: '#1d1410', calabash: '#9a6a3a' };
  const AP_U = 1 / 6;                                  // 12/8 pulse: an eighth-note; a bar is 2 s
  const AP_BELL = [0, 2, 4, 5, 7, 9, 11];              // the standard 7-stroke bell timeline
  const AP_T = {
    picks: Array.from({ length: 11 }, (_, i) => 0.25 + i * 2 * AP_U * 0.85),   // shuttle passes
    zoom: [1.95, 2.75], sew: 2.05, kLabel: 2.5,
    cloth: [3.25, 3.6], comb: [[3.6, 3.95], [3.8, 4.15]],
    stamps: [4.0, 4.5, 5.0, 5.5], fill: [5.67, 6.25],
    wash: [6.15, 6.55], outline: [6.5, 7.45], fills: [7.3, 8.2], nLabel: 7.6,
    final: [8.45, 9.1],
  };
  const AP_KW = 60, AP_KK = 4, AP_KLEN = 1500, AP_KP = 150;   // strip width, px/unit, length, block period (units)
  // Weft-faced block motifs on a 20×20 grid of 3-unit cells.
  const AP_MOTIF = [
    (i, j, p) => p[[0, 1, 0, 2, 0, 3][(j >> 1) % 6]],
    (i, j, p) => (i < 2 || i > 17 ? p[2] : ((i >> 1) + (j >> 1)) % 2 ? p[3] : p[0]),
    (i, j, p) => { const d = Math.abs(i - 9.5) + Math.abs(j - 9.5); return d < 3.5 ? p[1] : d < 6.5 ? p[0] : d < 8.5 ? p[3] : p[2]; },
    (i, j, p) => (Math.abs(i - 9.5) < Math.abs(j - 9.5) - 1 ? p[3] : j % 4 < 2 ? p[0] : p[1]),
  ];
  function apStrip(warp, pal, shift) {
    const K = AP_KK, c = offscreen(AP_KW * K, AP_KLEN * K), g = c.getContext('2d');
    const tw = AP_KW / warp.length;
    for (let s0 = -AP_KP; s0 < AP_KLEN; s0 += AP_KP) {
      const a = s0 + shift, blk = ((Math.floor((a + AP_KP) / AP_KP) % 4) + 4) % 4;
      // warp-faced section: vertical warp stripes, weft just peeking between
      const w0 = Math.max(0, a), w1 = Math.min(AP_KLEN, a + 90);
      if (w1 > w0) {
        warp.forEach((col, k) => { g.fillStyle = col; g.fillRect(k * tw * K, w0 * K, tw * K + 0.5, (w1 - w0) * K); });
        for (let k = 0; k < warp.length; k++) {
          g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect((k + 0.35) * tw * K, w0 * K, tw * K * 0.3, (w1 - w0) * K);
          g.fillStyle = 'rgba(0,0,0,0.22)';
          for (let y = w0 + (k % 2) * 1.2; y < w1; y += 2.4) g.fillRect(k * tw * K, y * K, tw * K, 0.9 * K);
        }
      }
      // weft-faced block: the weft packs down and hides the warp, so the motif reads horizontally
      const b0 = Math.max(0, a + 90), b1 = Math.min(AP_KLEN, a + AP_KP);
      if (b1 > b0) {
        for (let j = 0; j < 20; j++) for (let i = 0; i < 20; i++) {
          const y = a + 90 + j * 3; if (y + 3 <= b0 || y >= b1) continue;
          g.fillStyle = AP_MOTIF[blk](i, j, pal); g.fillRect(i * 3 * K, y * K, 3 * K + 0.5, 3 * K + 0.5);
        }
        for (let y = b0; y < b1; y += 1.5) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, y * K, AP_KW * K, 0.5 * K); g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(0, (y + 1.1) * K, AP_KW * K, 0.4 * K); }
      }
    }
    // selvedges
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, K * 0.8, AP_KLEN * K); g.fillRect(AP_KW * K - K * 0.8, 0, K * 0.8, AP_KLEN * K);
    return c;
  }
  const AP_WARP_A = (() => { const { Y, G, R, K } = AP; return [Y, Y, G, Y, Y, R, R, Y, Y, K, Y, Y, G, G, G, G, Y, Y, K, Y, Y, R, R, Y, Y, G, Y, Y, Y, Y]; })();
  const AP_WARP_B = (() => { const { Y, G, R, K } = AP; return [G, G, Y, G, G, K, G, G, R, R, G, G, Y, Y, G, G, Y, Y, G, G, R, R, G, G, K, G, G, Y, G, G]; })();

  /* ---- Adinkra symbols (drawn in a ±90 box, black ink) ---- */
  function apSpiral(g, cx, cy, r0, r1, a0, turns, dir = 1) {
    const n = 40;
    for (let i = 0; i <= n; i++) { const u = i / n, a = a0 + dir * u * turns * TAU, r = lerp(r0, r1, u); const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; i ? g.lineTo(x, y) : g.moveTo(x, y); }
  }
  const AP_SYM = {
    adinkrahene: g => { g.beginPath(); [80, 64, 52, 36, 24].forEach(r => { g.moveTo(r, 0); g.arc(0, 0, r, 0, TAU); }); g.fill('evenodd'); },
    sankofa: g => {
      g.lineWidth = 15; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(0, -26); g.bezierCurveTo(-18, -78, -92, -74, -82, -12); g.bezierCurveTo(-74, 30, -30, 52, 0, 80); g.bezierCurveTo(30, 52, 74, 30, 82, -12); g.bezierCurveTo(92, -74, 18, -78, 0, -26); g.stroke();
      [-1, 1].forEach(s => { g.beginPath(); apSpiral(g, s * 26, -20, 26, 5, s > 0 ? PI : 0, 1.1, s > 0 ? 1 : -1); g.lineWidth = 11; g.stroke(); });
      g.beginPath(); g.moveTo(0, 84); g.lineTo(12, 98); g.lineTo(0, 112); g.lineTo(-12, 98); g.closePath(); g.fill();
    },
    dwennimmen: g => {
      g.lineWidth = 15; g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, -64); g.lineTo(0, 64); g.stroke();
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { g.beginPath(); g.moveTo(0, sy * 58); g.bezierCurveTo(sx * 30, sy * 84, sx * 86, sy * 70, sx * 80, sy * 30); apSpiral(g, sx * 50, sy * 30, 30, 6, sx > 0 ? 0 : PI, 0.95, sx * sy > 0 ? 1 : -1); g.stroke(); });
    },
    nkyinkyim: g => {
      g.lineWidth = 17; g.lineJoin = 'miter'; g.lineCap = 'butt';
      g.beginPath(); for (let k = 0; k <= 6; k++) g.lineTo((k % 2 ? 1 : -1) * 46, -84 + k * 28); g.stroke();
      g.lineWidth = 8; g.beginPath(); g.rect(-74, -92, 148, 184); g.stroke();
    },
    akoma: g => { g.beginPath(); g.moveTo(0, -36); g.bezierCurveTo(-22, -84, -94, -72, -84, -14); g.bezierCurveTo(-76, 30, -30, 54, 0, 82); g.bezierCurveTo(30, 54, 76, 30, 84, -14); g.bezierCurveTo(94, -72, 22, -84, 0, -36); g.fill(); },
    nsoromma: g => { g.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * TAU - PI / 2, r = k % 2 ? 36 : 84; k ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.moveTo(20, 0); g.arc(0, 0, 20, 0, TAU, true); g.fill('evenodd'); },
    osram: g => {
      g.beginPath(); g.arc(0, 10, 78, PI * 0.08, PI * 0.92); g.arc(0, -16, 70, PI * 0.86, PI * 0.14, true); g.closePath(); g.fill();
      g.beginPath(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU - PI / 2, r = k % 2 ? 16 : 40; k ? g.lineTo(Math.cos(a) * r, -22 + Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, -22 + Math.sin(a) * r); } g.closePath(); g.fill();
    },
  };
  const AP_NAMED = [
    ['adinkrahene', 'ADINKRAHENE', '“chief of the symbols” — greatness, leadership'],
    ['sankofa', 'SANKOFA', '“go back and fetch it” — learn from the past'],
    ['dwennimmen', 'DWENNIMMEN', '“ram’s horns” — humility with strength'],
    ['nkyinkyim', 'NKYINKYIM', '“twisting” — initiative, versatility'],
  ];
  const AP_FILL = ['akoma', 'nsoromma', 'osram', 'adinkrahene', 'sankofa', 'dwennimmen', 'nkyinkyim'];
  // Adinkra cloth layout: comb-ruled grid of 320-px squares on a 1920×1080 frame
  const AP_CELL = 320, AP_COLS = 6, AP_ROWS = 4, AP_GY = -100;
  const apCellXY = (i, j) => [i * AP_CELL + AP_CELL / 2, AP_GY + j * AP_CELL + AP_CELL / 2];
  const AP_STAMP_CELLS = [[1, 1], [2, 1], [3, 1], [4, 1]];

  /* ---- Ndebele wall: regions as polygons, painted outline-first then flat-filled ---- */
  function apNdebeleRegions() {
    const { Y, G, R, K, B, W } = AP, LB = '#5fb3dc', PK = '#c8457c';
    const regs = [];
    const add = (pts, col, o = 0) => regs.push({ pts, col, o });
    const mir = pts => pts.map(([x, y]) => [1920 - x, y]).reverse();
    // top zigzag frieze
    for (let k = 0; k < 16; k++) {
      const x0 = k * 120;
      add([[x0, 150], [x0 + 60, 60], [x0 + 120, 150]], k % 2 ? Y : B, 0.02 * k);
    }
    // side panels: stepped pyramids above, the "razor blade" (ichefana) band, ladder stripes below
    [0, 1].forEach(side => {
      const m = side ? mir : (p => p), sw = side ? 1 : 0;
      add(m([[120, 220], [700, 220], [700, 420], [120, 420]]), LB, 0.3 + sw * 0.05);
      [0, 1, 2].forEach(k => {
        const x0 = 150 + k * 185, w = 170;
        add(m([[x0, 410], [x0, 370], [x0 + 25, 370], [x0 + 25, 330], [x0 + 55, 330], [x0 + 55, 285], [x0 + w - 55, 285], [x0 + w - 55, 330], [x0 + w - 25, 330], [x0 + w - 25, 370], [x0 + w, 370], [x0 + w, 410]]), [Y, G, PK][(k + sw) % 3], 0.4 + k * 0.04 + sw * 0.02);
      });
      add(m([[120, 430], [700, 430], [700, 650], [120, 650]]), W, 0.5);
      add(m([[150, 540], [250, 450], [570, 450], [670, 540], [570, 630], [250, 630]]), sw ? G : B, 0.55 + sw * 0.03);
      add(m([[230, 540], [290, 485], [530, 485], [590, 540], [530, 595], [290, 595]]), Y, 0.62 + sw * 0.03);
      add(m([[330, 540], [370, 510], [450, 510], [490, 540], [450, 570], [370, 570]]), R, 0.68 + sw * 0.03);
      for (let k = 0; k < 9; k++) { const x0 = 130 + k * 63; add(m([[x0, 670], [x0 + 50, 670], [x0 + 50, 860], [x0, 860]]), [R, G, B][(k + sw) % 3], 0.74 + k * 0.015 + sw * 0.02); }
    });
    // the gateway: stepped gable round a dark doorway
    add([[760, 930], [760, 420], [820, 420], [820, 360], [880, 360], [880, 300], [1040, 300], [1040, 360], [1100, 360], [1100, 420], [1160, 420], [1160, 930]], R, 0.2);
    add([[800, 930], [800, 460], [860, 460], [860, 400], [920, 400], [920, 340], [1000, 340], [1000, 400], [1060, 400], [1060, 460], [1120, 460], [1120, 930]], Y, 0.26);
    [[820, 500], [960, 500], [1100, 500]].forEach(([x], k) => add([[x - 30, 500], [x, 456], [x + 30, 500]], k === 1 ? R : B, 0.32 + k * 0.03));
    add([[850, 930], [850, 560], [1070, 560], [1070, 930]], '#3a2418', 0.36);
    // plinth band with white triangles on black
    add([[0, 930], [1920, 930], [1920, 990], [0, 990]], K, 0.9);
    for (let k = 0; k < 24; k++) add([[k * 80 + 10, 980], [k * 80 + 40, 940], [k * 80 + 70, 980]], W, 0.93);
    return regs;
  }
  function apPerim(pts) { let L = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); } return L; }
  function apPointAt(pts, u) {
    let d = u * apPerim(pts);
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= l) return [lerp(a[0], b[0], d / l), lerp(a[1], b[1], d / l)]; d -= l; }
    return pts[0];
  }
  // The painted wall in 1920×1080 design space; p: outline progress, f: fill progress (0..1 each).
  function apNdebele(g, st, p, f, t) {
    g.fillStyle = st.limePat; g.fillRect(0, 0, 1920, 1080);
    g.fillStyle = '#b77a45'; g.fillRect(0, 990, 1920, 90);
    g.fillStyle = 'rgba(70,40,20,0.25)'; g.fillRect(0, 990, 1920, 8);
    const R = st.nreg, n = R.length;
    // fills: each region floods top-down when its turn comes
    R.forEach(r => {
      const u = E.outQ(clamp((f - r.o * 0.75) / 0.25)); if (u <= 0) return;
      const ys = r.pts.map(q => q[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
      g.save(); g.beginPath(); g.rect(0, y0 - 2, 1920, (y1 - y0 + 4) * u); g.clip();
      poly(g, r.pts); g.fillStyle = r.col; g.fill(); g.restore();
    });
    // outlines: thick, freehand-steady black, region by region; the brush tip rides the wet end
    g.lineJoin = 'round'; g.lineCap = 'round'; g.strokeStyle = AP.K; g.lineWidth = 11;
    let tip = null;
    R.forEach((r, i) => {
      const u = clamp(p * n * 1.0 - st.nord[i]); if (u <= 0) return;
      poly(g, r.pts);
      if (u < 1) { const L = apPerim(r.pts); g.setLineDash([u * L, 1e5]); g.stroke(); g.setLineDash([]); tip = apPointAt(r.pts, u); } else g.stroke();
    });
    // white separators inside the black: the crisp double line of Ndebele work
    if (f > 0) { g.strokeStyle = `rgba(250,248,240,${clamp(f * 3) * 0.9})`; g.lineWidth = 2.2; R.forEach(r => { poly(g, r.pts); g.stroke(); }); }
    if (tip && p < 1) {
      g.save(); g.translate(tip[0], tip[1]);
      g.strokeStyle = '#7b5530'; g.lineWidth = 10; g.beginPath(); g.moveTo(0, 0); g.lineTo(70, -150); g.stroke();
      g.fillStyle = AP.K; g.beginPath(); g.ellipse(4, -8, 9, 16, 0.45, 0, TAU); g.fill();
      g.restore();
    }
  }
  // Adinkra cloth in 1920×1080 design space up to time t (comb lines, stamped symbols).
  function apAdinkra(g, st, t) {
    g.fillStyle = st.clothPat; g.fillRect(0, -200, 1920, 1500);
    // comb (dua afe) rakes four parallel lines between the squares
    const ch = E.ioS(seg(t, ...AP_T.comb[0])), cv = E.ioS(seg(t, ...AP_T.comb[1]));
    g.strokeStyle = 'rgba(29,20,16,0.88)'; g.lineWidth = 3.2;
    for (let j = 0; j <= AP_ROWS; j++) for (let k = 0; k < 4; k++) { const y = AP_GY + j * AP_CELL + (k - 1.5) * 9; g.beginPath(); g.moveTo(0, y + Math.sin(j * 3 + k) * 1.5); g.lineTo(1920 * ch, y + Math.sin(j * 3 + k + 2) * 2); g.stroke(); }
    for (let i = 0; i <= AP_COLS; i++) for (let k = 0; k < 4; k++) { const x = i * AP_CELL + (k - 1.5) * 9; g.beginPath(); g.moveTo(x, -10); g.lineTo(x + Math.sin(i + k) * 2, -10 + 1100 * cv); g.stroke(); }
    // stamped symbols
    st.stampList.forEach(s => {
      if (t < s.t) return;
      const a = clamp((t - s.t) / 0.06);
      g.globalAlpha = a * s.ink; g.drawImage(st.sym[s.k], s.x - s.r, s.y - s.r, s.r * 2, s.r * 2); g.globalAlpha = 1;
    });
    // the names and meanings under the four named stamps
    AP_NAMED.forEach(([, name, mean], k) => {
      const t0 = AP_T.stamps[k] + 0.08; if (t < t0) return;
      const [x, y] = apCellXY(...AP_STAMP_CELLS[k]), u = E.outC(seg(t, t0, t0 + 0.3));
      g.save(); g.globalAlpha = u;
      text(g, name, x, y + 116 + (1 - u) * 8, { font: '"Unbounded", sans-serif', weight: 800, size: 22, align: 'center', color: AP.ink, ls: 2 });
      g.restore();

    });
  }

  MG.film({
    id: 'africanpattern', dur: 10, poster: 9.5,
    fonts: [['800 60px "Unbounded"', 'KENTE ADINKRA NDEBELE'], ['500 30px "Unbounded"', 'Ghana South Africa'], ['500 28px "DM Sans"', 'Asante & Ewe strip-weaving “’—·'], ['italic 500 28px "DM Sans"', 'learn from the past'], ['700 24px "DM Sans"', 'WOVEN STAMPED PAINTED']],
    meta: {
      family: 'I', name: 'African Pattern Animation', sub: 'Kente · Adinkra · Ndebele', era: '17th c. — today',
      origin: 'Not one “African style” but distinct living traditions. Kente is woven by Asante and Ewe weavers in Ghana on horizontal treadle looms as narrow strips (about 10 cm) that are sewn edge to edge, alternating warp-faced stripes and weft-faced blocks; Adinkra cloth, also Asante, is ruled with a comb and stamped with carved-calabash symbols, each a named proverb; amaNdebele women in South Africa paint homestead walls with black-outlined geometry and flat colour, a practice Esther Mahlangu carried onto canvas, a BMW Art Car and global design.',
      works: 'Asante royal Kente (Bonwire, Ashanti Region) and Ewe Kente (Agotime, Volta Region) · Adinkra cloths from Ntonso, Ghana; symbol sets catalogued by W. Bruce Willis, The Adinkra Dictionary (1998) · Esther Mahlangu, BMW 525i Art Car (1991) and Magiciens de la Terre, Paris (1989) · Kente stoles in graduation and diaspora fashion',
      tech: ['Narrow-strip treadle-loom weaving, strips sewn edge to edge', 'Comb-ruled grid and calabash stamps in badie-bark ink', 'Freehand black outlines filled with flat colour', 'Each motif named; meaning carried by symbol and colour'],
      accent: '#f2b51e',
      motionDNA: 'Motion follows the making: shuttle and beater on the 12/8 bell, strips sliding together into a checkerboard, stamps pressing down on the dotted-quarter beat with each symbol’s name, a brush tip tracing black outlines and colour flooding each field.',
      visualDNA: 'Gold, green, red and black Kente with blocky weft-faced motifs; black Adinkra symbols in comb-ruled squares on cream cotton; whitewashed Ndebele walls of stepped gables, razor-blade hexagons and ladder stripes in primary colour with thick black and fine white outlines.',
      transitions: 'Loom pull-back to sewn cloth, cloth slide-over, comb rake, stamp press, lime-wash brush wipe, collapse into a labelled triptych',
      implementation: ['Loom, stamp and brush as process animation', 'Illustrator / AE shape layers with trim paths', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const st = {};
      const { Y, G, R, K, B } = AP;
      st.stripA = apStrip(AP_WARP_A, [Y, R, G, K], 0);
      st.stripB = apStrip(AP_WARP_B, [G, Y, K, R], AP_KP / 2);
      const tmp = offscreen(4, 4).getContext('2d');
      st.clothPat = tmp.createPattern(paperTile(AP.cloth, 3101, 0.07, 512, '110,80,40', '255,252,240', 30), 'repeat');
      st.limePat = tmp.createPattern(paperTile('#f4f0e6', 3121, 0.05, 512, '120,110,90', '255,255,255', 40), 'repeat');
      st.woodPat = tmp.createPattern(paperTile('#5a3a22', 3141, 0.12, 512, '20,10,5', '200,150,100', 60), 'repeat');
      // stamped symbols: black ink with the speckle and soft edge of a hand-pressed calabash
      st.sym = {};
      const r = rng(3301);
      Object.entries(AP_SYM).forEach(([k, fn]) => {
        const c = offscreen(220, 220), g = c.getContext('2d');
        g.translate(110, 110); g.fillStyle = g.strokeStyle = AP.ink; fn(g);
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < 260; i++) { g.globalAlpha = 0.25 + r() * 0.6; g.beginPath(); g.arc(r() * 220, r() * 220, 0.6 + r() * 2.4, 0, TAU); g.fill(); }
        g.globalAlpha = 0.12; g.fillRect(0, 0, 220, 220);
        st.sym[k] = c;
      });
      // stamp schedule: four named stamps, then the other squares filled 2×2 at a fast pulse
      st.stampList = [];
      AP_NAMED.forEach(([k], i) => { const [x, y] = apCellXY(...AP_STAMP_CELLS[i]); st.stampList.push({ k, x, y: y - 14, r: 92, t: AP_T.stamps[i], ink: 0.94 }); });
      const others = [];
      for (let j = 0; j < AP_ROWS; j++) for (let i = 0; i < AP_COLS; i++) if (!AP_STAMP_CELLS.some(([a, b]) => a === i && b === j)) others.push([i, j]);
      others.sort((a, b) => hash(a[0] * 7 + a[1] * 13) - hash(b[0] * 7 + b[1] * 13));
      const [f0, f1] = AP_T.fill;
      others.forEach(([i, j], n) => {
        const [x, y] = apCellXY(i, j), k = AP_FILL[(i + j * 2) % AP_FILL.length], t0 = f0 + (n / others.length) * (f1 - f0);
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy], q) => st.stampList.push({ k, x: x + sx * 68, y: y + sy * 68, r: 54, t: t0 + q * 0.025, ink: 0.85 + r() * 0.12 }));
      });
      st.nreg = apNdebeleRegions();
      // outline order: frieze first, then the gateway, then panels outward
      st.nord = st.nreg.map(rg => rg.o * st.nreg.length);
      return st;
    },
    draw(c, t, W, H, st) {
      const { Y, G, R, K } = AP;
      const fin = E.ioC(seg(t, ...AP_T.final));
      // ---- act 3 / finale panel geometry ----
      const PAN = [[110, 190], [690, 190], [1270, 190]], PW = 540, PH = 620;
      const kenteAct = (g, alpha) => {
        // the loom close-up pulls back to the sewn cloth
        const zu = E.ioC(seg(t, ...AP_T.zoom));
        const z = Math.exp(lerp(Math.log(5), Math.log(2.1), zu));
        const fellY = lerp(600, -520, E.inQ(zu));
        // woven length at the fell: a step per shuttle pass, then time-lapse during the pull-back
        let L = 220; AP_T.picks.forEach(p => { L += 6 * E.outC(seg(t, p + 0.08, p + 0.2)); });
        L += 720 * E.inQ(zu);
        g.fillStyle = st.woodPat; g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, W, H);
        const sx = k => 960 + (k * AP_KW - AP_KW / 2) * z;
        // neighbouring strips slide in and are sewn on, blocks alternating like a checkerboard
        const nS = 9;
        for (let k = -nS; k <= nS; k++) {
          if (k === 0) continue;
          const t0 = AP_T.sew + (Math.abs(k) - 1) * 0.09 + (k > 0 ? 0.04 : 0), u = spring(t - t0, 1.6, 0.75);
          if (t < t0) continue;
          const dir = (k % 2 ? 1 : -1), off = (1 - u) * 1400 * dir;
          const img = Math.abs(k) % 2 ? st.stripB : st.stripA;
          const s0 = L - (H - fellY) / z;
          g.drawImage(img, 0, 0, img.width, img.height, sx(k), fellY + (L - AP_KLEN) * z + off, AP_KW * z, AP_KLEN * z);
          void s0;
          if (u > 0.98) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(sx(k) - 1, 0, 2, H); }
        }
        // the strip coming off the loom (only woven below the fell)
        g.save(); g.beginPath(); g.rect(0, fellY, W, H - fellY + 2); g.clip();
        g.drawImage(st.stripA, 0, 0, st.stripA.width, st.stripA.height, sx(0), fellY + (L - AP_KLEN) * z, AP_KW * z, AP_KLEN * z);
        g.restore();
        const la = 1 - seg(zu, 0, 0.3);
        if (la > 0) {
          g.save(); g.globalAlpha = la;
          // warp threads above the fell, parted into a shed that flips at every pass
          const nPick = AP_T.picks.filter(p => t >= p).length, tw = AP_KW / AP_WARP_A.length;
          for (let i = 0; i < AP_WARP_A.length; i++) {
            const up = (i + nPick) % 2 === 0, x = sx(0) + (i + 0.5) * tw * z + (up ? -1.5 : 1.5);
            g.strokeStyle = AP_WARP_A[i]; g.lineWidth = tw * z * 0.78; g.globalAlpha = la * (up ? 1 : 0.72);
            g.beginPath(); g.moveTo(x, fellY); g.lineTo(x, -20); g.stroke();
          }
          g.globalAlpha = la;
          // heddles (string loops on a bar) and the reed/beater
          const hy = fellY - 330;
          // heddle cords up to the pulley, and the loom's side posts
          g.strokeStyle = 'rgba(230,215,190,0.6)'; g.lineWidth = 2;
          [sx(0) - 60, sx(0) + AP_KW * z + 60].forEach(x => { g.beginPath(); g.moveTo(x, hy - 8); g.lineTo(960 + (x - 960) * 0.4, -10); g.stroke(); });
          g.fillStyle = '#5e3b20'; g.fillRect(sx(0) - 420, -10, 46, H); g.fillRect(sx(0) + AP_KW * z + 374, -10, 46, H);
          g.fillStyle = 'rgba(255,220,170,0.12)'; g.fillRect(sx(0) - 420, -10, 8, H); g.fillRect(sx(0) + AP_KW * z + 374, -10, 8, H);
          g.fillStyle = '#8a5a32'; g.fillRect(sx(0) - 70, hy - 14, AP_KW * z + 140, 12); g.fillRect(sx(0) - 70, hy + 46, AP_KW * z + 140, 12);
          g.strokeStyle = 'rgba(240,230,210,0.75)'; g.lineWidth = 1.2;
          for (let i = 0; i < AP_WARP_A.length; i++) { const x = sx(0) + (i + 0.5) * tw * z; g.beginPath(); g.moveTo(x, hy - 2); g.lineTo(x, hy + 46); g.stroke(); }
          let beat = 0; AP_T.picks.forEach(p => { const d = t - p - 0.12; if (d > 0 && d < 0.16) beat = Math.sin(d / 0.16 * PI); });
          const by = fellY - 120 + beat * 100;
          g.fillStyle = '#6e4526'; g.fillRect(sx(0) - 50, by - 16, AP_KW * z + 100, 18);
          g.fillStyle = 'rgba(30,20,10,0.6)'; for (let i = 0; i <= 60; i++) g.fillRect(sx(0) + i * AP_KW * z / 60 - 1, by + 2, 2, 26);
          g.fillStyle = '#6e4526'; g.fillRect(sx(0) - 50, by + 26, AP_KW * z + 100, 12);
          // shuttle: a boat of wood carrying a bobbin of the current weft colour, crossing at each pass
          AP_T.picks.forEach((p, i) => {
            const u = seg(t, p - 0.04, p + 0.12); if (u <= 0 || u >= 1) return;
            const dir = i % 2 ? -1 : 1, x = lerp(-280, AP_KW * z + 280, dir > 0 ? E.ioS(u) : 1 - E.ioS(u)) + sx(0), y = fellY - 40;
            const wc = ((L + 30) % AP_KP) < 90 ? Y : [Y, R, G, K][Math.floor(L / AP_KP) % 4];
            g.strokeStyle = wc; g.lineWidth = 3; g.beginPath(); g.moveTo(dir > 0 ? sx(0) - 10 : sx(0) + AP_KW * z + 10, y + 6); g.lineTo(x, y + 6); g.stroke();
            g.fillStyle = '#a0703e'; g.beginPath(); g.ellipse(x, y, 130, 24, 0, 0, TAU); g.fill();
            g.fillStyle = '#6a4424'; g.beginPath(); g.ellipse(x, y, 70, 12, 0, 0, TAU); g.fill();
            g.fillStyle = wc; g.fillRect(x - 50, y - 8, 100, 16);
          });
          // breast beam where the woven strip winds on
          g.fillStyle = '#7b4e2a'; g.fillRect(0, H - 70, W, 70); g.fillStyle = 'rgba(255,220,170,0.15)'; g.fillRect(0, H - 70, W, 6);
          g.restore();
        }
        // label
        const lu = E.outC(seg(t, 0.35, 0.9)) * (1 - seg(t, 1.8, 2.1));
        if (lu > 0) {
          g.save(); g.globalAlpha = lu;
          g.fillStyle = 'rgba(20,12,8,0.8)'; rrect(g, 70, 70, 520, 118, 10); g.fill();
          text(g, '1 · THE STRIP LOOM', 100, 118, { font: '"DM Sans", sans-serif', weight: 700, size: 24, color: Y, ls: 3 });
          text(g, 'one ~10 cm strip at a time, shuttle and beater', 100, 160, { font: '"DM Sans", sans-serif', weight: 500, size: 24, color: '#f1e6cc' });
          g.restore();
        }
        const ku = E.outC(seg(t, AP_T.kLabel, AP_T.kLabel + 0.4));
        if (ku > 0) {
          g.save(); g.globalAlpha = ku * alpha;
          g.fillStyle = 'rgba(20,12,8,0.86)'; rrect(g, 70, 760 + (1 - ku) * 20, 860, 250, 12); g.fill();
          text(g, 'KENTE', 104, 840 + (1 - ku) * 20, { font: '"Unbounded", sans-serif', weight: 800, size: 64, color: Y, ls: 4 });
          text(g, 'Asante & Ewe strip-weaving · Ghana', 104, 890 + (1 - ku) * 20, { font: '"DM Sans", sans-serif', weight: 700, size: 28, color: '#f1e6cc' });
          [[Y, 'gold · wealth'], [G, 'green · growth'], [R, 'red · sacrifice'], [K, 'black · maturity']].forEach(([col, s], i) => {
            const x = 104 + i * 205, y = 944 + (1 - ku) * 20;
            g.fillStyle = col; g.fillRect(x, y, 26, 26); g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 1; g.strokeRect(x, y, 26, 26);
            text(g, s, x + 36, y + 20, { font: '"DM Sans", sans-serif', weight: 500, size: 21, color: 'rgba(241,230,204,0.85)' });
          });
          g.restore();
        }
      };
      const adinkraAct = g => {
        // the stamp: a carved calabash with a bamboo handle, seen from above, pressing on each beat
        apAdinkra(g, st, t);
        const ST = AP_T.stamps;
        let sx = -300, sy = 400, h = 1;
        if (t < ST[0]) { const u = E.outC(seg(t, ST[0] - 0.45, ST[0])); sx = lerp(2100, apCellXY(...AP_STAMP_CELLS[0])[0], u); sy = apCellXY(...AP_STAMP_CELLS[0])[1] - 14; h = 1 - E.inQ(seg(t, ST[0] - 0.12, ST[0])); }
        else if (t < ST[3] + 0.5) {
          const i = Math.min(3, ST.filter(s => t >= s).length - 1), a = apCellXY(...AP_STAMP_CELLS[i]), b = i < 3 ? apCellXY(...AP_STAMP_CELLS[i + 1]) : [2200, 300];
          const d = t - ST[i], u = E.ioS(seg(d, 0.1, 0.42));
          sx = lerp(a[0], b[0], u); sy = lerp(a[1], b[1], u) - 14; h = d < 0.1 ? E.outQ(d / 0.1) : d > 0.38 && i < 3 ? 1 - E.inQ(seg(d, 0.38, 0.5)) : 1;
        } else h = -1;
        if (h >= 0) {
          const sc = 1 + h * 0.32;
          g.save(); g.fillStyle = `rgba(30,15,5,${0.35 - h * 0.15})`; g.filter = `blur(${4 + h * 18}px)`; g.beginPath(); g.arc(sx + 10 + h * 50, sy + 14 + h * 60, 96 * sc, 0, TAU); g.fill(); g.restore();
          g.save(); g.translate(sx, sy); g.scale(sc, sc);
          const cg = g.createRadialGradient(-30, -30, 10, 0, 0, 100); cg.addColorStop(0, '#c08a50'); cg.addColorStop(1, '#7a4c26');
          g.fillStyle = cg; g.beginPath(); g.arc(0, 0, 98, 0, TAU); g.fill();
          g.strokeStyle = 'rgba(60,30,10,0.5)'; g.lineWidth = 2; for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(0, 0, 20 + k * 12, 0.3 + k, 1.6 + k); g.stroke(); }
          g.strokeStyle = '#c9b27a'; g.lineWidth = 11; g.lineCap = 'round';
          [0, 2.1, 4.2].forEach(a => { g.beginPath(); g.moveTo(Math.cos(a) * 46, Math.sin(a) * 46); g.lineTo(0, -6); g.stroke(); });
          g.fillStyle = '#d8c08a'; g.beginPath(); g.arc(0, -6, 14, 0, TAU); g.fill();
          g.restore();
        }
        // running caption: the latest named symbol and its meaning
        const ci = ST.filter(s => t >= s + 0.08).length - 1;
        const au = E.outC(seg(t, 3.75, 4.1));
        g.save(); g.globalAlpha = au;
        g.fillStyle = 'rgba(25,16,10,0.95)'; rrect(g, 70, 820, 1000, 196, 12); g.fill();
        text(g, 'ADINKRA', 104, 890, { font: '"Unbounded", sans-serif', weight: 800, size: 56, color: '#f1e6cc', ls: 4 });
        text(g, 'Asante stamped cloth · Ghana', 510, 888, { font: '"DM Sans", sans-serif', weight: 700, size: 26, color: Y });
        if (ci >= 0) {
          const [, name, mean] = AP_NAMED[ci], cu = E.outC(seg(t, ST[ci] + 0.08, ST[ci] + 0.3));
          g.globalAlpha = au * cu;
          text(g, name, 104, 948, { font: '"DM Sans", sans-serif', weight: 700, size: 28, color: Y, ls: 2 });
          text(g, mean, 104, 990, { font: '"DM Sans", sans-serif', style: 'italic', weight: 500, size: 28, color: '#f1e6cc' });
        } else {
          text(g, 'comb-ruled grid, calabash stamps, badie-bark ink', 104, 960, { font: '"DM Sans", sans-serif', style: 'italic', weight: 500, size: 28, color: 'rgba(241,230,204,0.85)' });
        }
        g.restore();
      };
      const ndebeleAct = (g, label = 1) => {
        apNdebele(g, st, E.ioS(seg(t, ...AP_T.outline)), seg(t, ...AP_T.fills), t);
        const nu = E.outC(seg(t, AP_T.nLabel, AP_T.nLabel + 0.4)) * label;
        if (nu > 0) {
          g.save(); g.globalAlpha = nu;
          g.fillStyle = 'rgba(25,16,10,0.88)'; rrect(g, 460, 690 + (1 - nu) * 20, 1000, 200, 12); g.fill();
          text(g, 'NDEBELE', 960, 770 + (1 - nu) * 20, { font: '"Unbounded", sans-serif', weight: 800, size: 60, align: 'center', color: '#f4f0e6', ls: 6 });
          text(g, 'amaNdebele mural painting · Mpumalanga, South Africa', 960, 818 + (1 - nu) * 20, { font: '"DM Sans", sans-serif', weight: 700, size: 27, align: 'center', color: Y });
          text(g, 'outline first, then flat colour — after Esther Mahlangu (b. 1935)', 960, 858 + (1 - nu) * 20, { font: '"DM Sans", sans-serif', style: 'italic', weight: 500, size: 25, align: 'center', color: 'rgba(244,240,230,0.85)' });
          g.restore();
        }
      };

      if (fin <= 0) {
        if (t < AP_T.cloth[1]) kenteAct(c, 1);
        // the Adinkra cloth slides over the Kente
        if (t >= AP_T.cloth[0] && t < AP_T.wash[1]) {
          const u = E.ioC(seg(t, ...AP_T.cloth));
          c.save(); c.translate((1 - u) * 1960, 0);
          c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(-30, 0, 30, H);
          c.beginPath(); c.rect(0, 0, W, H); c.clip();
          adinkraAct(c);
          c.restore();
        }
        // lime-wash: broad white brush strokes wipe across, the Ndebele wall appears under them
        if (t >= AP_T.wash[0]) {
          const [w0, w1] = AP_T.wash;
          c.save();
          c.beginPath();
          for (let k = 0; k < 5; k++) {
            const u = E.ioS(seg(t, w0 + k * 0.05, w0 + 0.22 + k * 0.05)), y = k * 230 - 40;
            if (u <= 0) continue;
            // a broad lime-wash brush: wavy edges, a ragged bristle front
            const d = k % 2 ? -1 : 1, xs = d > 0 ? -60 : 1980, x1 = xs + d * u * 2100;
            c.moveTo(xs, y + 6);
            for (let q = 1; q <= 8; q++) { const x = lerp(xs, x1, q / 8); c.lineTo(x, y + 6 + Math.sin(q * 1.7 + k) * 7); }
            for (let q = 0; q <= 16; q++) c.lineTo(x1 + d * (hash(k * 31 + q) * 50 - 10) * (q % 2 ? 0.4 : 1), y + q / 16 * 268);
            for (let q = 7; q >= 0; q--) { const x = lerp(xs, x1, q / 8); c.lineTo(x, y + 268 + Math.sin(q * 2.3 + k) * 7); }
            c.closePath();
          }
          if (t > w1) { c.beginPath(); c.rect(0, 0, W, H); }
          c.clip();
          ndebeleAct(c);
          c.restore();
        }
      } else {
        // finale: the three traditions side by side, each named precisely
        c.fillStyle = '#21140d'; c.fillRect(0, 0, W, H);
        c.fillStyle = st.woodPat; c.globalAlpha = 0.5; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
        const T = (fr, to) => [lerp(fr[0], to[0], fin), lerp(fr[1], to[1], fin), lerp(fr[2], to[2], fin), lerp(fr[3], to[3], fin)];
        const boxes = [T([-640, 190, PW, PH], [PAN[0][0], PAN[0][1], PW, PH]), T([690, 1200, PW, PH], [PAN[1][0], PAN[1][1], PW, PH]), T([0, 0, W, H], [PAN[2][0], PAN[2][1], PW, PH])];
        boxes.forEach(([x, y, w, h], i) => {
          c.save();
          c.fillStyle = 'rgba(0,0,0,0.4)'; c.filter = 'blur(14px)'; c.fillRect(x + 8, y + 14, w, h); c.filter = 'none';
          c.beginPath(); c.rect(x, y, w, h); c.clip();
          if (i === 0) {
            const zz = 1.9;
            for (let k = 0; k < 6; k++) { const img = k % 2 ? st.stripB : st.stripA; c.drawImage(img, 0, 0, img.width, img.height, x + k * AP_KW * zz - 30, y - 400 - (k % 2) * 0 + Math.sin(t * 0.3) * 4, AP_KW * zz, AP_KLEN * zz); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x + k * AP_KW * zz - 31, y, 2, h); }
          } else if (i === 1) {
            c.translate(x, y); c.scale(w / 960, w / 960); c.translate(-AP_CELL * 1, -AP_GY - AP_CELL * 0.5); apAdinkra(c, st, 9.99);
          } else {
            const s = lerp(1, PH / 1080 * 1.4, fin);
            c.translate(x + w / 2, y + h / 2); c.scale(s, s); c.translate(-lerp(960, 410, fin), -lerp(540, 560, fin));
            apNdebele(c, st, 1, 1, t);
          }
          c.restore();
          c.strokeStyle = 'rgba(241,230,204,0.25)'; c.lineWidth = 2; c.strokeRect(x, y, w, h);
        });
        const lu = E.outC(seg(t, AP_T.final[1] - 0.25, AP_T.final[1] + 0.35));
        c.save(); c.globalAlpha = lu;
        [['KENTE', 'Asante & Ewe · Ghana', 'woven'], ['ADINKRA', 'Asante · Ghana', 'stamped'], ['NDEBELE', 'amaNdebele · South Africa', 'painted']].forEach(([n, o, v], i) => {
          const x = PAN[i][0] + PW / 2;
          text(c, n, x, 880 + (1 - lu) * 12, { font: '"Unbounded", sans-serif', weight: 800, size: 40, align: 'center', color: [Y, '#f1e6cc', '#f4f0e6'][i], ls: 4 });
          text(c, o, x, 922 + (1 - lu) * 12, { font: '"DM Sans", sans-serif', weight: 700, size: 25, align: 'center', color: 'rgba(241,230,204,0.85)' });
          text(c, v.toUpperCase(), x, 168 - (1 - lu) * 8, { font: '"DM Sans", sans-serif', weight: 700, size: 20, align: 'center', color: 'rgba(242,181,30,0.9)', ls: 6 });
        });
        const tu = E.outC(seg(t, AP_T.final[1] + 0.05, AP_T.final[1] + 0.6));
        c.globalAlpha = tu;
        text(c, 'AFRICAN PATTERN ANIMATION', 960, 1010, { font: '"Unbounded", sans-serif', weight: 500, size: 30, align: 'center', color: '#f1e6cc', ls: 8 });
        text(c, 'three traditions, not one style', 960, 1048, { font: '"DM Sans", sans-serif', style: 'italic', weight: 500, size: 24, align: 'center', color: 'rgba(241,230,204,0.7)' });
        c.restore();
      }
      grain(c, W, H, t, 0.035, 'multiply');
      vignette(c, W, H, 0.3, '20,10,5');
    },
    score(A) {
      A.bus.gain.value = 1.0;
      const U = AP_U;
      // dawuro / gankogui bell: the 12/8 standard pattern, all the way through
      for (let bar = 0; bar < 5; bar++) AP_BELL.forEach((s, i) => { const t = bar * 2 + s * U + 0.05; if (t > 9.3) return; A.osc(t, { type: 'square', f: i === 0 ? 1180 : 1480, dur: 0.09, g: 0.03, lp: 3800, rev: 0.15, pan: 0.35 }); A.osc(t, { f: i === 0 ? 1180 * 2.7 : 1480 * 2.7, dur: 0.05, g: 0.012, pan: 0.35 }); });
      // loom: the shuttle swishes across, the beater clacks it home, the treadle thumps
      AP_T.picks.forEach((p, i) => {
        A.noise(p - 0.04, { type: 'bandpass', f: 1800, f2: 3800, q: 2, dur: 0.16, g: 0.08, swell: 0.5, pan: i % 2 ? -0.5 : 0.5 });
        A.noise(p + 0.14, { type: 'bandpass', f: 1300, q: 3, dur: 0.05, g: 0.3 }); A.osc(p + 0.14, { type: 'triangle', f: 340, f2: 240, glide: 0.05, dur: 0.08, g: 0.14 });
        if (i % 2 === 0) A.osc(p - 0.02, { f: 90, f2: 60, glide: 0.08, dur: 0.18, g: 0.18 });
      });
      // sewn together: a rising run of plucked strings (a seperewa-like harp-lute)
      [62, 64, 67, 69, 71, 74, 76, 79].forEach((m, i) => A.pluck(AP_T.sew + i * 0.1, midi(m), { dur: 1.4, g: 0.12, bright: 0.65, decay: 0.996, rev: 0.3, pan: (i / 7 - 0.5) * 0.8 }));
      A.whoosh(AP_T.zoom[0], 0.8, { f1: 300, f2: 1600, g: 0.07 });
      // cloth slides over; the comb rakes; atumpan talking drums speak each symbol's name
      A.whoosh(AP_T.cloth[0], 0.4, { f1: 500, f2: 2500, g: 0.12, pan: 0.5 });
      AP_T.comb.forEach(([a, b]) => A.noise(a, { type: 'bandpass', f: 2600, f2: 1800, q: 2, dur: b - a, g: 0.06, swell: 0.4 }));
      const atu = (t, f0, f1, g = 0.3) => { A.osc(t, { f: f0, f2: f1, glide: 0.12, dur: 0.32, g, a: 0.003 }); A.noise(t, { type: 'bandpass', f: 900, q: 1, dur: 0.03, g: g * 0.4 }); };
      AP_T.stamps.forEach((t, i) => {
        A.osc(t, { f: 110, f2: 46, glide: 0.1, dur: 0.3, g: 0.5 }); A.noise(t, { type: 'lowpass', f: 700, dur: 0.08, g: 0.2 });
        [[0.12, 180, 140], [0.24, 140, 180], [0.33, 200, 150]].forEach(([d, a, b], k) => atu(t + d, a + i * 8, b + i * 8, 0.18 - k * 0.03));
      });
      // axatse shaker on the pulse during the stamping
      for (let k = 0; k < 18; k++) { const t = 3.67 + k * U; A.noise(t, { type: 'highpass', f: 6500, dur: k % 3 === 0 ? 0.08 : 0.04, g: k % 3 === 0 ? 0.07 : 0.035, pan: -0.3 }); }
      // the grid fills: quick muffled stamps
      for (let k = 0; k < 14; k++) { const t = AP_T.fill[0] + k * (AP_T.fill[1] - AP_T.fill[0]) / 14; A.osc(t, { f: 140, f2: 70, glide: 0.06, dur: 0.12, g: 0.2 }); }
      // lime-wash: three broad brush swishes, then the outline brush and colour pops as the wall fills
      [0, 0.1, 0.2].forEach((d, i) => A.noise(AP_T.wash[0] + d, { type: 'bandpass', f: 900, f2: 2600, q: 0.8, dur: 0.3, g: 0.12, swell: 0.3, pan: i % 2 ? 0.5 : -0.5 }));
      A.noise(AP_T.outline[0], { type: 'bandpass', f: 2200, q: 1.5, dur: AP_T.outline[1] - AP_T.outline[0], g: 0.03, hold: true, rel: 0.2 });
      // close-harmony chords (I–IV–V–I), the sound of South African choral music, under the painting
      [[6.5, [55, 59, 62, 67]], [7.0, [60, 64, 67, 72]], [7.5, [62, 66, 69, 74]], [8.0, [55, 59, 62, 67]]].forEach(([t, ch]) => A.chord(t, ch, { type: 'triangle', dur: 0.55, g: 0.04, a: 0.04, hold: true, rel: 0.2, lp: 2200, rev: 0.35, width: 0.8 }));
      [43, 48, 50, 43].forEach((m, i) => A.pluck(6.5 + i * 0.5, midi(m), { dur: 0.8, g: 0.24, bright: 0.5, decay: 0.993, lp: 900 }));
      for (let k = 0; k < 12; k++) A.pluck(AP_T.fills[0] + k * 0.075, midi([67, 71, 74, 79, 76, 74, 71, 74, 79, 83, 79, 86][k]), { dur: 0.6, g: 0.07, bright: 0.9, decay: 0.994, rev: 0.25, pan: (hash(k) - 0.5) * 0.8 });
      // finale: drums and bell together, one big chord
      A.whoosh(AP_T.final[0], 0.6, { f1: 300, f2: 2000, g: 0.1 });
      A.osc(AP_T.final[1], { f: 100, f2: 45, glide: 0.2, dur: 0.6, g: 0.5 });
      A.chord(AP_T.final[1], [43, 55, 59, 62, 67, 71], { type: 'triangle', dur: 1.6, g: 0.05, a: 0.02, rev: 0.5, width: 0.9 });
      [0, 0.17, 0.33, 0.5].forEach((d, i) => atu(AP_T.final[1] + 0.15 + d, 150 + i * 20, 190 - i * 10, 0.16));
      A.osc(AP_T.final[1] + 0.05, { type: 'square', f: 1180, dur: 0.6, g: 0.035, lp: 3800, rev: 0.4 });
    },
  });

  /* =====================================================================
     CONCERT VJ — a live set from the VJ's laptop to the LED wall: a clip is
     launched on the downbeat in a Resolume-style deck and we dive through
     the output preview onto the stage; a beat-locked tunnel runs, a data
     build scrolls (after UVA's walls for Massive Attack), the drop lights a
     pyramid (after Daft Punk's Alive 2007) and a projection-mapped cube
     booth (after Amon Tobin's ISAM), lasers fan over the crowd, and the wall
     resolves into the title. Every pulse is computed from the score's own
     timing tables; no strobing — pulses, sweeps and smooth decays only
     ===================================================================== */
  const VJ_B = 60 / 128;                               // 128 BPM
  const vjAt = k => k * VJ_B;
  const VJ_T = { launch: vjAt(4), build: vjAt(10), drop: vjAt(12), outro: vjAt(18) };
  const VJ_KICKS = [4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18].map(vjAt);
  const VJ_CLAPS = [5, 7, 9, 13, 15, 17].map(vjAt);
  // build: snare roll accelerating from eighths to sixteenths to thirty-seconds
  const VJ_ROLL = (() => { const a = []; let t = VJ_T.build; [[2, 0.5], [4, 0.25], [8, 0.125]].forEach(([n, d], i) => { const L = i === 0 ? 1 : 0.5; for (let k = 0; k < n * L * 2; k++) { a.push(t); t += d * VJ_B; } }); return a.filter(x => x < VJ_T.drop - 0.01); })();
  const VJ_BASS = [33, 29, 36, 31];                    // A F C G, one per bar
  const VJ_LED_W = 160, VJ_LED_H = 60, VJ_WALL = [240, 70, 1440, 540];
  const vjEnv = (t, list, k = 7) => { let e = 0; for (const x of list) { if (x > t) break; e = Math.exp(-(t - x) * k); } return e; };
  const VJ_DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];

  /* ---- loops, drawn into the 160×60 LED canvas ---- */
  function vjIdle(g, t) {
    g.fillStyle = '#040208'; g.fillRect(0, 0, VJ_LED_W, VJ_LED_H);
    for (let x = 0; x < VJ_LED_W; x += 2) { const y = 30 + Math.sin(x * 0.05 + t * 1.2) * 10 + Math.sin(x * 0.11 - t) * 5; g.fillStyle = `rgba(110,60,200,${0.25 + 0.15 * Math.sin(x * 0.1 + t)})`; g.fillRect(x, y, 2, 2); }
  }
  function vjTunnel(g, t, e) {
    g.fillStyle = '#000'; g.fillRect(0, 0, VJ_LED_W, VJ_LED_H);
    const cx = 80 + Math.sin(t * 0.7) * 6, cy = 30 + Math.cos(t * 0.9) * 3, N = 12, ph = (t / VJ_B) * 0.5;
    g.save(); g.translate(cx, cy); g.rotate(Math.sin(t * 0.4) * 0.12);
    for (let k = 0; k < N; k++) {
      const d = ((k + ph) % N) / N, s = Math.pow(d, 2.2) * 1.15;
      const w = 170 * s, h = 64 * s;
      g.strokeStyle = k % 3 === 0 ? `rgba(255,60,190,${d})` : `rgba(80,230,255,${d})`; g.lineWidth = 0.6 + d * 1.6;
      g.strokeRect(-w / 2, -h / 2, w, h);
    }
    // the kick sends one bright ring outward (local, not a full-frame flash)
    VJ_KICKS.forEach(tk => { const u = (t - tk) / (VJ_B * 1.6); if (u < 0 || u > 1) return; const s = Math.pow(u, 1.6) * 1.2; g.strokeStyle = `rgba(255,255,255,${(1 - u) * 0.9})`; g.lineWidth = 2.2; g.strokeRect(-85 * s, -32 * s, 170 * s, 64 * s); });
    g.restore();
    g.fillStyle = `rgba(80,230,255,${0.05 + e.kick * 0.06})`; g.fillRect(0, 0, VJ_LED_W, VJ_LED_H);
  }
  function vjData(g, t, e) {
    // after UVA's LED walls for Massive Attack: columns of figures scrolling at different speeds
    g.fillStyle = '#020100'; g.fillRect(0, 0, VJ_LED_W, VJ_LED_H);
    const acc = 1 + 3 * Math.pow(e.prog, 2);
    for (let col = 0; col < 40; col++) {
      const v = (14 + hash(col * 3.1) * 30) * acc, off = (t * v + hash(col) * 60) % 6;
      for (let row = -1; row < 11; row++) {
        const y = row * 6 + off, id = Math.floor((t * v + hash(col) * 60) / 6) - row;
        const dgt = VJ_DIG[Math.floor(hash(col * 17 + id * 7.7) * 10)], b = 0.25 + 0.75 * hash(col * 5 + id * 3.3);
        g.fillStyle = hash(col * 9 + id) > 0.92 ? `rgba(255,255,255,${b})` : `rgba(255,176,60,${b * 0.85})`;
        for (let p = 0; p < 15; p++) if (dgt[p] === '1') g.fillRect(col * 4 + (p % 3), y + Math.floor(p / 3), 1, 1);
      }
    }
    // a smooth scan bar sweeping once per beat
    const sx = ((t - VJ_T.build) / VJ_B % 1) * 200 - 20;
    const gr = g.createLinearGradient(sx - 18, 0, sx + 18, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,240,210,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(sx - 18, 0, 36, VJ_LED_H);
  }
  function vjPyramid(g, t, e) {
    g.fillStyle = '#050008'; g.fillRect(0, 0, VJ_LED_W, VJ_LED_H);
    const cx = 80, cy = 36, N = 10, ph = (t - VJ_T.drop) / VJ_B * 0.5;
    // rays from the apex
    for (let k = 0; k < 16; k++) {
      const a = k / 16 * TAU + t * 0.3, l = 120;
      g.strokeStyle = `rgba(255,${k % 2 ? 120 : 60},${k % 2 ? 40 : 200},0.25)`; g.lineWidth = 1;
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * l, cy + Math.sin(a) * l); g.stroke();
    }
    const tri = s => { g.beginPath(); g.moveTo(cx, cy - 40 * s); g.lineTo(cx + 46 * s, cy + 26 * s); g.lineTo(cx - 46 * s, cy + 26 * s); g.closePath(); };
    for (let k = 0; k < N; k++) {
      const d = ((k + ph) % N) / N, s = Math.pow(d, 2) * 1.8;
      g.save(); g.translate(cx, cy); g.rotate((k % 2 ? 1 : -1) * 0.05 * Math.sin(t)); g.translate(-cx, -cy);
      tri(s); g.strokeStyle = `hsla(${(300 + k * 22 + t * 30) % 360},100%,62%,${d})`; g.lineWidth = 0.8 + d * 2.2; g.stroke();
      g.restore();
    }
    VJ_KICKS.forEach(tk => { if (tk < VJ_T.drop) return; const u = (t - tk) / (VJ_B * 1.4); if (u < 0 || u > 1) return; tri(0.2 + u * 1.6); g.strokeStyle = `rgba(255,255,255,${(1 - u) * 0.85})`; g.lineWidth = 2; g.stroke(); });
    g.fillStyle = `rgba(255,80,200,${0.04 + e.kick * 0.05})`; g.fillRect(0, 0, VJ_LED_W, VJ_LED_H);
  }
  function vjTitle(g, t, st) {
    g.fillStyle = '#020204'; g.fillRect(0, 0, VJ_LED_W, VJ_LED_H);
    if (!st.titleBmp) {
      const c = offscreen(VJ_LED_W, VJ_LED_H), tg = c.getContext('2d');
      text(tg, 'CONCERT VJ', 80, 30, { font: '"Archivo Black", sans-serif', size: 21, align: 'center', base: 'middle', color: '#fff', ls: 1 });
      st.titleBmp = c;
    }
    const u = (t - VJ_T.outro);
    // a slow shimmer passes across the letters only; thin rule lines draw out
    if (!st.titleTmp) st.titleTmp = offscreen(VJ_LED_W, VJ_LED_H);
    const tg = st.titleTmp.getContext('2d');
    tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, VJ_LED_W, VJ_LED_H); tg.drawImage(st.titleBmp, 0, 0);
    tg.globalCompositeOperation = 'source-atop';
    const sx = (u * 90) % 260 - 50, gr = tg.createLinearGradient(sx - 30, 0, sx + 30, 0);
    gr.addColorStop(0, 'rgba(80,230,255,0.0)'); gr.addColorStop(0.5, 'rgba(80,230,255,0.9)'); gr.addColorStop(1, 'rgba(80,230,255,0)');
    tg.fillStyle = gr; tg.fillRect(0, 0, VJ_LED_W, VJ_LED_H);
    g.drawImage(st.titleTmp, 0, 0);
    const lw = E.outC(clamp(u / 0.8)) * 120;
    g.fillStyle = 'rgba(255,60,190,0.9)'; g.fillRect(80 - lw / 2, 15, lw, 1); g.fillRect(80 - lw / 2, 45, lw, 1);
  }
  function vjLoop(g, t, st, e) {
    if (t < VJ_T.launch) vjIdle(g, t);
    else if (t < VJ_T.build) vjTunnel(g, t, e);
    else if (t < VJ_T.drop) vjData(g, t, e);
    else if (t < VJ_T.outro) vjPyramid(g, t, e);
    else vjTitle(g, t, st);
  }

  // isometric cube face set, for the ISAM-style mapped booth
  function vjCube(g, x, y, s, lit, hue) {
    const P = (dx, dy) => [x + dx * s, y + dy * s];
    const faces = [
      [[P(0, -1), P(0.87, -1.5), P(0, -2), P(-0.87, -1.5)], 0.9],
      [[P(-0.87, -1.5), P(0, -1), P(0, 0), P(-0.87, -0.5)], 0.55],
      [[P(0, -1), P(0.87, -1.5), P(0.87, -0.5), P(0, 0)], 0.35],
    ];
    faces.forEach(([pts, sh], i) => {
      poly(g, pts);
      const l = lit[i];
      g.fillStyle = `hsl(${hue},${70}%,${4 + sh * 10 + l * 48 * sh}%)`; g.fill();
      g.strokeStyle = `hsla(${hue},100%,80%,${0.25 + l * 0.6})`; g.lineWidth = 1.5; g.stroke();
    });
  }

  MG.film({
    id: 'vj', dur: 10, poster: 7.2,
    fonts: [['400 40px "Archivo Black"', 'CONCERT VJ LOOPS'], ['500 20px "JetBrains Mono"', 'COMPOSITION LAYER CLIP 128.00 BPM'], ['700 20px "JetBrains Mono"', 'TUNNEL DATA PYRAMID'], ['500 26px "DM Sans"', 'after UVA × Massive Attack · Amon Tobin ISAM']],
    meta: {
      family: 'J', name: 'Concert VJ Loops', sub: 'Live visuals for stage & club', era: '1990s —',
      origin: 'VJs perform visuals live, triggering and mixing beat-locked loops on clip-launcher software (Resolume Arena, TouchDesigner, earlier VDMX and Modul8) onto LED walls and projection-mapped stage sets. The form grew out of club projection in the 1980s–90s; by the 2000s studios such as United Visual Artists built LED walls and custom software for Massive Attack, Daft Punk toured a light-up pyramid, and Amon Tobin’s ISAM stage turned a stack of cubes into a projection-mapped instrument.',
      works: 'UVA (United Visual Artists) — Massive Attack 100th Window tour LED wall (2003) and Heligoland tour (2010) · Daft Punk, Alive 2006/2007 pyramid stage · Amon Tobin, ISAM Live (2011), with Heavy Projects and V Squared Labs · Resolume Arena / TouchDesigner VJ sets in clubs and festivals',
      tech: ['Clip launcher with BPM sync / tap tempo', 'LED wall mapping at low pixel pitch', 'Projection-mapped set pieces', 'Lasers and moving heads through haze'],
      accent: '#ff3cbe',
      motionDNA: 'Everything is locked to the beat grid: loops cycle in bar lengths, kicks launch local rings rather than full-frame flashes, a build accelerates scroll speed and roll density, the drop changes clip on the downbeat and lasers fan on the bar.',
      visualDNA: 'A black stage with a wide LED wall of visible pixels, neon cyan, magenta and amber geometry — tunnels, data columns, nested triangles — bloom and floor reflections, a pyramid outline, a mapped cube booth, laser fans over a silhouetted crowd with raised hands and phone screens.',
      transitions: 'Dive through the software output preview onto the wall, clip cuts on the downbeat, scan sweeps, accelerating build, pulse decays, title resolved in LED pixels',
      implementation: ['Resolume Arena / TouchDesigner + LED processor', 'Notch / After Effects loop authoring', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: true,
    },
    setup() {
      const st = {};
      st.led = offscreen(VJ_LED_W, VJ_LED_H); st.lg = st.led.getContext('2d');
      // LED mesh: dark gaps between round diodes, one cell per LED (9 px)
      const m = offscreen(9, 9), mg = m.getContext('2d');
      mg.fillStyle = 'rgba(0,0,0,0.82)'; mg.fillRect(0, 0, 9, 9);
      mg.globalCompositeOperation = 'destination-out'; mg.beginPath(); mg.arc(4.5, 4.5, 3.4, 0, TAU); mg.fill();
      st.mesh = offscreen(4, 4).getContext('2d').createPattern(m, 'repeat');
      // clip thumbnails for the deck (rendered once)
      const e0 = { kick: 0.3, clap: 0, prog: 0.4 };
      const mk = (fn, t) => { const c = offscreen(VJ_LED_W, VJ_LED_H); fn(c.getContext('2d'), t, e0, st); return c; };
      st.thumbs = [
        [['IDLE WAVE', mk(vjIdle, 1)], ['TUNNEL', mk(vjTunnel, 2.3)], ['DATA COLUMNS', mk(vjData, 5.1)], ['PYRAMID', mk(vjPyramid, 6.0)], ['TUNNEL B', mk(vjTunnel, 3.7)], ['SCAN', mk(vjData, 5.4)]],
        [['TRI RAYS', mk(vjPyramid, 7.1)], ['GRID', mk(vjTunnel, 4.1)], ['FIGURES', mk(vjData, 4.9)], ['WAVE 2', mk(vjIdle, 3)], ['NEST', mk(vjPyramid, 6.6)], ['RINGS', mk(vjTunnel, 2.9)]],
      ];
      // crowd: three rows of silhouettes, some with hands up, some holding phones
      const r = rng(5101);
      st.crowd = [[860, 0.62, 30], [950, 0.85, 20], [1070, 1.2, 12]].map(([y, s, n]) => Array.from({ length: n }, (_, i) => ({
        x: (i + 0.2 + r() * 0.6) / n * 2000 - 40, y: y + r() * 16, s: s * (0.9 + r() * 0.2), arms: r() < 0.4 ? (r() < 0.5 ? 2 : 1) : 0, phone: r() < 0.3, ph: r() < 0.7 ? 0 : 0.5, lean: (r() - 0.5) * 0.2,
      })));
      // haze: soft static clouds
      const hz = offscreen(480, 270), hg = hz.getContext('2d');
      for (let k = 0; k < 40; k++) { const x = r() * 480, y = 40 + r() * 200, rr = 30 + r() * 80, gr = hg.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, 'rgba(160,170,220,0.06)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); hg.fillStyle = gr; hg.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
      st.haze = hz;
      return st;
    },
    draw(c, t, W, H, st) {
      const e = { kick: vjEnv(t, VJ_KICKS, 6), clap: vjEnv(t, VJ_CLAPS, 8), prog: seg(t, VJ_T.build, VJ_T.drop) };
      const drop = t >= VJ_T.drop && t < VJ_T.outro, beatF = t / VJ_B;
      // render this frame's loop into the LED canvas
      vjLoop(st.lg, t, st, e);
      const [WX, WY, WW, WH] = VJ_WALL;
      // the stage, with a slow push and a small punch on the drop
      const push = 1 + 0.035 * seg(t, VJ_T.launch, 10) + 0.012 * (t > VJ_T.drop ? Math.exp(-(t - VJ_T.drop) * 3) * Math.sin((t - VJ_T.drop) * 20) : 0);
      c.save(); c.translate(960, 560); c.scale(push, push); c.translate(-960, -560);
      const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#05040b'); bg.addColorStop(1, '#0b0a14');
      c.fillStyle = bg; c.fillRect(-100, -100, W + 200, H + 200);
      // wall bloom through the haze (kept steady; only slow section changes)
      c.save(); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true;
      c.globalAlpha = t > VJ_T.outro ? 0.12 : 0.28; c.drawImage(st.led, WX - 260, WY - 200, WW + 520, WH + 400);
      c.globalAlpha = t > VJ_T.outro ? 0.05 : 0.16; c.drawImage(st.led, WX - 700, WY - 420, WW + 1400, WH + 900);
      c.restore();
      // the LED wall: nearest-neighbour pixels under a diode mesh, in a black bezel
      c.fillStyle = '#000'; c.fillRect(WX - 14, WY - 14, WW + 28, WH + 28);
      c.save(); c.imageSmoothingEnabled = false; c.drawImage(st.led, WX, WY, WW, WH); c.restore();
      c.save(); c.translate(WX, WY); c.fillStyle = st.mesh; c.fillRect(0, 0, WW, WH); c.restore();
      c.strokeStyle = 'rgba(120,120,140,0.3)'; c.lineWidth = 1;
      for (let k = 1; k < 8; k++) { c.beginPath(); c.moveTo(WX + k * WW / 8, WY); c.lineTo(WX + k * WW / 8, WY + WH); c.stroke(); }
      // truss with moving heads; beams sweep through the haze
      c.fillStyle = '#16151d'; c.fillRect(120, 22, 1680, 26);
      c.strokeStyle = '#2a2833'; c.lineWidth = 2; for (let x = 120; x < 1800; x += 26) { c.beginPath(); c.moveTo(x, 22); c.lineTo(x + 26, 48); c.stroke(); }
      const beamA = t < VJ_T.launch ? 0.05 : drop ? 0.16 : 0.09;
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 6; k++) {
        const x = 300 + k * 264, a = PI / 2 + Math.sin(t * 0.9 + k * 1.1) * 0.35 + (drop ? Math.sin(beatF * PI / 4 + k) * 0.2 : 0), L = 900, sp = 0.07;
        const gr = c.createLinearGradient(x, 48, x + Math.cos(a) * L, 48 + Math.sin(a) * L);
        const col = k % 2 ? '120,220,255' : '255,120,220';
        gr.addColorStop(0, `rgba(${col},${beamA * 2})`); gr.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = gr; c.beginPath(); c.moveTo(x, 52); c.lineTo(x + Math.cos(a - sp) * L, 52 + Math.sin(a - sp) * L); c.lineTo(x + Math.cos(a + sp) * L, 52 + Math.sin(a + sp) * L); c.closePath(); c.fill();
        c.fillStyle = `rgba(${col},0.8)`; c.beginPath(); c.arc(x, 50, 7, 0, TAU); c.fill();
      }
      c.restore();
      // pyramid (after Daft Punk, Alive 2007): an LED outline that draws up on the drop with a chase
      const pu = E.outC(seg(t, VJ_T.drop, VJ_T.drop + 0.45)), pa = 1 - 0.65 * seg(t, VJ_T.outro, VJ_T.outro + 0.8);
      if (pu > 0) {
        const apex = [960, 260], bl = [560, 720], br = [1360, 720];
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.globalAlpha = pa;
        const edges = [[bl, apex], [br, apex], [bl, br], [[760, 490], [1160, 490]], [[660, 605], [1260, 605]]];
        edges.forEach(([a, b], i) => {
          const u = clamp(pu * 1.4 - i * 0.1); if (u <= 0) return;
          const ex = lerp(a[0], b[0], u), ey = lerp(a[1], b[1], u);
          c.strokeStyle = 'rgba(255,90,200,0.25)'; c.lineWidth = 14; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(ex, ey); c.stroke();
          c.strokeStyle = 'rgba(255,200,240,0.9)'; c.lineWidth = 3; c.stroke();
          // chase dots running along each edge, a lap per beat
          for (let k = 0; k < 4; k++) { const v = ((beatF + k / 4 + i * 0.13) % 1) * u; c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(lerp(a[0], b[0], v), lerp(a[1], b[1], v), 4, 0, TAU); c.fill(); }
        });
        c.restore();
      }
      // stage deck with the wall reflected in it
      c.fillStyle = '#07070c'; c.fillRect(0, 700, W, 90);
      c.save(); c.beginPath(); c.rect(0, 700, W, 90); c.clip();
      c.globalAlpha = 0.22; c.translate(0, 700); c.scale(1, -0.16); c.drawImage(st.led, WX, -WH, WW, WH); c.restore();
      c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(0, 700, W, 2);
      // performer behind the booth: headphones, arms up on the drop
      const arms = drop ? E.outB(seg(t, VJ_T.drop, VJ_T.drop + 0.3)) : 0, bob = Math.abs(Math.sin(beatF * PI)) * 6 * (t > VJ_T.launch ? 1 : 0.3);
      c.fillStyle = '#020205';
      c.save(); c.translate(960, 600 + bob);
      c.beginPath(); c.arc(0, -40, 26, 0, TAU); c.fill(); rrect(c, -50, -16, 100, 120, 26); c.fill();
      c.strokeStyle = '#020205'; c.lineWidth = 16; c.lineCap = 'round';
      [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * 40, 0); c.lineTo(s * lerp(70, 80, arms), lerp(60, -70, arms)); c.lineTo(s * lerp(60, 96, arms), lerp(90, -140, arms)); c.stroke(); });
      c.strokeStyle = 'rgba(255,120,220,0.35)'; c.lineWidth = 2; c.beginPath(); c.arc(0, -40, 28, PI * 1.1, PI * 1.9); c.stroke();
      c.restore();
      // booth: a stack of mapped cubes (after Amon Tobin's ISAM), faces chasing on the beat
      const bi = Math.floor(beatF), hue = drop ? 300 : t < VJ_T.build ? 190 : 32;
      const cubes = [[860, 720], [960, 720], [1060, 720], [910, 670], [1010, 670]];
      cubes.forEach(([x, y], i) => {
        const lit = [0, 1, 2].map(f => { if (t < VJ_T.launch) return 0.1; const ph = ((bi - i - f * 2) % 5 + 5) % 5; return (ph === 0 ? Math.exp(-(beatF - bi) * 3) : 0) * 0.9 + 0.12; });
        vjCube(c, x, y, 50, lit, hue);
      });
      // lasers: fans from the stage edges and the truss, sweeping on the bar (drop only, one fan in the tunnel)
      const la = drop ? 1 : t > VJ_T.launch && t < VJ_T.build ? 0.35 : 0;
      if (la > 0) {
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        const fans = drop ? [[330, 700, -1], [1590, 700, 1], [960, 50, 0]] : [[960, 50, 0]];
        fans.forEach(([x, y, side], fi) => {
          const n = 7, spread = 0.9 + 0.25 * Math.sin(beatF * PI / 2 + fi);
          for (let k = 0; k < n; k++) {
            const base = side === 0 ? PI / 2 : side < 0 ? -PI / 2 - 0.5 : -PI / 2 + 0.5;
            const a = base + (k / (n - 1) - 0.5) * spread + Math.sin(t * 1.3 + fi) * 0.25;
            const x2 = x + Math.cos(a) * 2600, y2 = y + Math.sin(a) * 2600;
            const col = fi === 2 ? '80,255,140' : '80,230,255';
            c.strokeStyle = `rgba(${col},${0.12 * la})`; c.lineWidth = 9; c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2); c.stroke();
            c.strokeStyle = `rgba(${col},${0.7 * la})`; c.lineWidth = 1.6; c.stroke();
          }
          c.fillStyle = `rgba(200,255,220,${0.8 * la})`; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill();
        });
        c.restore();
      }
      // haze layer
      c.save(); c.globalCompositeOperation = 'lighter'; c.drawImage(st.haze, Math.sin(t * 0.2) * 40 - 40, 0, W + 80, H); c.restore();
      // crowd silhouettes, rim-lit by the wall, bouncing on the beat
      const rim = drop ? '255,110,220' : t < VJ_T.build ? '90,220,255' : '255,180,80';
      st.crowd.forEach((row, ri) => row.forEach(p => {
        const live = t > VJ_T.launch ? 1 : 0.25;
        const bounce = Math.pow(Math.abs(Math.sin((beatF + p.ph) * PI)), 2) * 10 * p.s * live;
        const x = p.x, y = p.y - bounce, s = p.s * 46;
        const shape = (dy, col) => {
          c.fillStyle = col; c.strokeStyle = col;
          c.beginPath(); c.arc(x + p.lean * s, y - s * 1.55 + dy, s * 0.42, 0, TAU); c.fill();
          rrect(c, x - s * 0.85, y - s * 1.05 + dy, s * 1.7, s * 2.2, s * 0.5); c.fill();
          if (p.arms) { c.lineWidth = s * 0.3; c.lineCap = 'round'; const up = drop ? 1 : 0.7; [-1, 1].slice(0, p.arms).forEach(sd => { c.beginPath(); c.moveTo(x + sd * s * 0.6, y - s * 0.8 + dy); c.lineTo(x + sd * s * 0.9, y - s * (1.7 + up * 0.5) + dy); c.lineTo(x + sd * s * 0.75, y - s * (2.4 + up * 0.7) + dy); c.stroke(); }); }
        };
        shape(-2, `rgba(${rim},${0.35 + ri * 0.05})`);
        shape(0, '#020206');
        if (p.phone && p.arms) { const up = drop ? 1 : 0.7; c.fillStyle = 'rgba(200,220,255,0.8)'; c.fillRect(x - s * 0.89, y - s * (2.4 + up * 0.7) - s * 0.5, s * 0.28, s * 0.45); }
      }));
      c.restore();
      // cue captions naming the references, like a running set list
      const cues = [[VJ_T.launch + 0.6, VJ_T.build, 'L2 · TUNNEL', 'beat-synced loop · 4-bar cycle'], [VJ_T.build + 0.05, VJ_T.drop, 'L2 · DATA COLUMNS', 'after UVA’s LED walls for Massive Attack'], [VJ_T.drop + 0.4, VJ_T.drop + 1.5, 'STAGE · PYRAMID', 'after Daft Punk, Alive 2007'], [VJ_T.drop + 1.5, VJ_T.outro, 'BOOTH · MAPPED CUBES', 'after Amon Tobin, ISAM (2011)']];
      cues.forEach(([a, b, h, s]) => {
        const u = E.outC(seg(t, a, a + 0.25)) * (1 - seg(t, b - 0.15, b)); if (u <= 0) return;
        c.save(); c.globalAlpha = u;
        c.fillStyle = 'rgba(5,5,10,0.92)'; rrect(c, 60, 940, 600, 92, 8); c.fill();
        c.fillStyle = '#ff3cbe'; c.fillRect(60, 940, 6, 92);
        text(c, h, 88, 978, { font: '"JetBrains Mono", monospace', weight: 700, size: 22, color: '#fff', ls: 2 });
        text(c, s, 88, 1012, { font: '"DM Sans", sans-serif', weight: 500, size: 24, color: 'rgba(220,225,240,0.85)' });
        c.restore();
      });
      // outro caption under the LED title
      if (t > VJ_T.outro) {
        const u = E.outC(seg(t, VJ_T.outro + 0.5, VJ_T.outro + 1.1));
        c.save(); c.globalAlpha = u;
        c.fillStyle = 'rgba(3,3,8,0.8)'; rrect(c, 360, 930, 1200, 110, 10); c.fill();
        text(c, 'CONCERT VJ LOOPS', 960, 975, { font: '"Archivo Black", sans-serif', size: 34, align: 'center', color: '#fff', ls: 6 });
        text(c, 'live beat-synced visuals · Resolume / TouchDesigner · LED wall, lasers, mapped stage', 960, 1015, { font: '"DM Sans", sans-serif', weight: 500, size: 24, align: 'center', color: 'rgba(220,225,240,0.8)' });
        c.restore();
      }

      // ---- the VJ's deck: shown first, then we dive through its output preview onto the wall ----
      const du = E.ioC(seg(t, VJ_T.launch, VJ_T.launch + 0.6));
      if (du < 1) {
        const PV = [660, 600, 600, 225];               // preview rect in UI space
        const s = lerp(1, WW / PV[2], du), tx = lerp(0, WX - PV[0] * (WW / PV[2]), du), ty = lerp(0, WY - PV[1] * (WW / PV[2]), du);
        c.save(); c.globalAlpha = 1 - E.inQ(du); c.translate(tx, ty); c.scale(s, s);
        c.fillStyle = '#17181c'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#22242a'; c.fillRect(0, 0, W, 56);
        text(c, 'COMPOSITION · LIVE SET', 30, 37, { font: '"JetBrains Mono", monospace', weight: 700, size: 20, color: '#d8dbe3', ls: 2 });
        // BPM and beat lamps (small, on the grid)
        text(c, '128.00 BPM', 1500, 37, { font: '"JetBrains Mono", monospace', weight: 700, size: 22, color: '#e6e8ef' });
        const bi0 = Math.floor(beatF) % 4;
        for (let k = 0; k < 4; k++) { c.fillStyle = k === bi0 ? `rgba(255,60,190,${0.4 + 0.6 * Math.exp(-(beatF % 1) * 4)})` : '#3a3d46'; c.fillRect(1680 + k * 52, 20, 40, 20); }
        // layers × clips
        ['L2 GEOMETRY', 'L1 BASE'].forEach((nm, row) => {
          const y = 96 + row * 200;
          c.fillStyle = '#202228'; c.fillRect(30, y, 220, 170);
          text(c, nm, 50, y + 40, { font: '"JetBrains Mono", monospace', weight: 700, size: 18, color: '#c9ccd6' });
          c.fillStyle = '#34363e'; c.fillRect(50, y + 120, 180, 8); c.fillStyle = '#ff3cbe'; c.fillRect(50, y + 120, row ? 120 : 180, 8);
          st.thumbs[row].forEach(([lab, img], col) => {
            const x = 280 + col * 270;
            c.fillStyle = '#0c0d10'; c.fillRect(x, y, 250, 170);
            c.drawImage(img, x + 6, y + 6, 238, 120);
            text(c, lab, x + 10, y + 154, { font: '"JetBrains Mono", monospace', weight: 500, size: 16, color: '#aeb2bd' });
            const sel = row === 0 && col === 1, on = sel && t >= VJ_T.launch, hov = sel && t > VJ_T.launch - 0.5;
            const playing = (row === 0 && col === 0 && t < VJ_T.launch);
            if (on || playing) { c.strokeStyle = '#3cff8c'; c.lineWidth = 4; c.strokeRect(x, y, 250, 170); }
            else if (hov) { c.strokeStyle = '#8a8fa0'; c.lineWidth = 2; c.strokeRect(x, y, 250, 170); }
          });
        });
        // output preview (the live LED canvas)
        c.fillStyle = '#0c0d10'; c.fillRect(PV[0] - 10, PV[1] - 44, PV[2] + 20, PV[3] + 54);
        text(c, 'OUTPUT · LED WALL 160×60', PV[0], PV[1] - 14, { font: '"JetBrains Mono", monospace', weight: 700, size: 16, color: '#8a8fa0' });
        c.save(); c.imageSmoothingEnabled = false; c.drawImage(st.led, PV[0], PV[1], PV[2], PV[3]); c.restore();
        text(c, 'CLIP TRIGGER · QUANTISE 1 BAR', 30, 980, { font: '"JetBrains Mono", monospace', weight: 500, size: 18, color: '#6d717d' });
        // cursor glides to TUNNEL and clicks on the downbeat
        const cu = E.ioC(seg(t, 0.4, VJ_T.launch - 0.25));
        const cx = lerp(1300, 280 + 270 + 125, cu), cy = lerp(760, 96 + 85, cu), press = t > VJ_T.launch - 0.06 && t < VJ_T.launch + 0.12;
        c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 2;
        c.save(); c.translate(cx, cy); c.scale(press ? 0.85 : 1, press ? 0.85 : 1);
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 34); c.lineTo(9, 26); c.lineTo(16, 40); c.lineTo(22, 37); c.lineTo(15, 23); c.lineTo(27, 23); c.closePath(); c.fill(); c.stroke();
        c.restore();
        c.restore();
      }
      grain(c, W, H, t, 0.03, 'overlay');
      vignette(c, W, H, 0.45);
    },
    score(A) {
      A.bus.gain.value = 0.95;
      const B = VJ_B;
      // intro: filtered pad and tap-tempo clicks while the deck is open
      A.chord(0.0, [57, 60, 64, 67, 71], { type: 'sawtooth', dur: VJ_T.launch + 0.1, g: 0.03, a: 0.6, hold: true, rel: 0.1, lp: 400, lp2: 2200, lpT: VJ_T.launch, spread: 8, width: 0.9, rev: 0.4 });
      for (let k = 0; k < 4; k++) A.osc(vjAt(k), { type: 'square', f: k === 0 ? 2000 : 1500, dur: 0.03, g: 0.03 });
      for (let k = 0; k < 4; k++) A.hat(vjAt(k + 0.5), 0.05, false, { pan: 0.2 });
      A.noise(VJ_T.launch - 0.06, { type: 'bandpass', f: 3000, q: 4, dur: 0.02, g: 0.12 });
      A.whoosh(VJ_T.launch - 0.4, 0.7, { f1: 400, f2: 5000, g: 0.12 });
      // four-on-the-floor, claps on 2 and 4, offbeat hats
      VJ_KICKS.forEach((t, i) => A.kick(t, i === VJ_KICKS.length - 1 ? 1.0 : 0.85));
      VJ_CLAPS.forEach(t => A.clap(t, 0.32));
      for (let k = 4; k < 18; k++) { if (k === 10 || k === 11) continue; A.hat(vjAt(k + 0.5), 0.09, k % 2 === 1, { pan: -0.2 }); A.hat(vjAt(k + 0.25), 0.035, false, { pan: 0.3 }); A.hat(vjAt(k + 0.75), 0.035, false, { pan: 0.3 }); }
      // bass: offbeat eighths, one root per bar
      for (let k = 4; k < 18; k++) {
        if (k === 10 || k === 11) continue;
        const m = VJ_BASS[Math.floor((k - 4) / 4) % 4] + 12;
        A.osc(vjAt(k + 0.5), { type: 'sawtooth', f: midi(m), dur: B * 0.42, g: 0.13, lp: 900, lp2: 300, lpT: B * 0.4, q: 4 });
        A.osc(vjAt(k + 0.5), { f: midi(m - 12), dur: B * 0.42, g: 0.12 });
      }
      // tunnel: soft chord stabs on the bar
      [4, 8].forEach(k => A.chord(vjAt(k), [57, 64, 67, 71], { type: 'triangle', dur: B * 1.5, g: 0.04, rev: 0.5, lp: 2000, width: 0.8 }));
      // build: accelerating snare roll, riser, filtered noise sweep
      VJ_ROLL.forEach((t, i) => A.snare(t, 0.12 + 0.25 * (i / VJ_ROLL.length), { dur: 0.08, rev: 0.2 }));
      A.riser(VJ_T.build, VJ_T.drop - VJ_T.build, { g: 0.16, f: 110 });
      // drop: impact, supersaw stabs and a sixteenth-note arpeggio
      A.impact(VJ_T.drop, 0.6);
      [12, 13.5, 14, 16, 17.5].forEach((k, i) => A.chord(vjAt(k), [[69, 72, 76], [69, 72, 76], [65, 69, 72], [72, 76, 79], [67, 71, 74]][i], { type: 'sawtooth', dur: B * 0.6, g: 0.05, spread: 14, lp: 3500, lp2: 900, lpT: B * 0.6, width: 1, rev: 0.3 }));
      const arp = [69, 72, 76, 81, 76, 72, 69, 64];
      for (let k = 0; k < 24; k++) { const t = VJ_T.drop + k * B / 4; A.osc(t, { type: 'square', f: midi(arp[k % 8] + 12), dur: B * 0.2, g: 0.025, lp: 3000, pan: (k % 2 ? 0.4 : -0.4), rev: 0.25 }); }
      // outro: last hit, a long chord and the wall title shimmer
      A.impact(VJ_T.outro, 0.5);
      A.chord(VJ_T.outro, [45, 57, 64, 67, 72], { type: 'sawtooth', dur: 1.5, g: 0.045, a: 0.01, spread: 10, lp: 2800, lp2: 500, lpT: 1.5, width: 1, rev: 0.7 });
      A.bell(VJ_T.outro + 0.5, midi(88), { g: 0.04, dur: 1.2, rev: 0.6 });
    },
  });
})();
