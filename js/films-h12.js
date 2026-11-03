/* batch h12 — Family C & G. Cut-out Animation · Lo-fi Loop · Liminal Spaces.
   cutout (jointed paper puppets on a multiplane stand) · lofi (the study-by-the-window livestream loop) · liminal (a Backrooms walk on VHS). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, rrect, roughPoly, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Special+Elite&family=Nunito:wght@600;800&family=VT323&display=block');
  const PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const patCache = new WeakMap();
  const patOf = (g, tile) => { let m = patCache.get(g); if (!m) patCache.set(g, (m = new Map())); if (!m.has(tile)) m.set(tile, g.createPattern(tile, 'repeat')); return m.get(tile); };
  // Closed smooth outline through points (quadratics through midpoints).
  function sPath(c, pts) {
    const n = pts.length;
    c.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    c.closePath();
  }
  // Open smooth curve through points.
  function sOpen(c, pts) {
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    const L = pts[pts.length - 1]; c.lineTo(L[0], L[1]);
  }
  // Ellipse as points; jit > 0 roughens it like a scissor cut (seeded, stable over time).
  const ellP = (cx, cy, rx, ry, n = 30, jit = 0, seed = 1) => { const r = rng(seed); return [...Array(n)].map((_, i) => { const a = (i / n) * TAU, k = 1 + (r() - 0.5) * jit; return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]; }); };
  const arcP = (cx, cy, r, a0, a1, n = 12) => [...Array(n + 1)].map((_, i) => { const a = lerp(a0, a1, i / n); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const R4 = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  // 2D affine matrices in canvas order [a, b, c, d, e, f].
  const mMul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
  const mTR = (x, y, a) => { const cs = Math.cos(a), sn = Math.sin(a); return [cs, sn, -sn, cs, x, y]; };
  const mAp = (M, x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
  const rgb = a => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`;
  const scanTile = (gap, a) => { const T = offscreen(8, gap), g = T.getContext('2d'); g.fillStyle = `rgba(0,0,0,${a})`; g.fillRect(0, 0, 8, 1); return T; };

  /* =====================================================================
     CUT-OUT — the multiplane stand. The plates are slid under the camera
     one at a time (a dusk sky of two overlapping sheets, a paper moon on a
     thread, far hills, pines, tracing-paper fog, the path, a blurred
     foreground); a wanderer is assembled piece by piece out of
     construction paper and every joint gets a brass split pin; on twos he
     walks into the fog with a swinging lantern while the planes truck past
     at their own speeds, an owl flaps in on hinged wings, he tilts his
     head back and his face is swapped for a surprised one, then the title
     is set down one cut tile at a time
     ===================================================================== */
  const CU = { sky0: '#1b2f45', sky1: '#3a5c71', sky2: '#9fb0a2', moon: '#efdca0', far: '#4b6876', mid: '#31504f', midP: '#27413f', pine: '#1e3832', pine2: '#29473a', bare: '#2b2a27', ground: '#5a4734', ground2: '#76603f', fg: '#121c17', coat: '#c2452d', coatD: '#8f2e1f', pants: '#3b3f5c', pantsD: '#2a2d43', boot: '#2a211c', skin: '#efcfa6', cheek: '#e48c7a', cap: '#d9a73a', capD: '#b5852a', scarf: '#3f8f8a', scarfD: '#2c6a66', lamp: '#f6d77a', iron: '#2b2622', owl: '#7d5e43', owlW: '#5e4430', owlL: '#c9ab7f', owlF: '#e3cea4', beak: '#e39a3a', brass: '#c9a24a', cream: '#ecdcb8', ink: '#1d1915' };
  const CU_T = { kit: 1.15, pins: 2.35, walk: 2.85, stop: 6.3, owl: 4.85, land: 5.75, look: 6.55, hoot: 6.95, smile: 7.3, title: 7.6, sub: 8.6 };
  const CU_F = { slab: '"Alfa Slab One", serif', type: '"Special Elite", monospace' };
  // Plates slid in by hand: [start, settle, dx, dy] for moon, far, mid, trees, ground, fog1, fog2, fog3, fg.
  const CU_PL = { moon: [0.2, 0.55, 0, -420], far: [0.0, 0.35, 0, 520], mid: [0.15, 0.5, 0, 520], trees: [0.35, 0.78, -1500, 0], ground: [0.5, 0.85, 0, 320], fog1: [0.65, 1.0, 1700, 0], fog2: [0.75, 1.1, -1700, 0], fog3: [0.85, 1.15, 1700, 0], fg: [0.95, 1.3, 0, 520] };
  // Puppet pieces arrive separately: [settle time, dx, dy, spin].
  const CU_IN = { torso: [1.3, 0, 820, 0.5], fL: [1.42, -1200, 60, -0.7], nL: [1.54, -1200, 0, -0.5], head: [1.7, 0, -820, 1.6], cap: [1.88, 160, -900, -2.2], fA: [1.98, 1200, 0, 0.9], nA: [2.08, 1200, -120, -0.9], scarf: [2.18, 900, -300, 1.3], lamp: [2.3, 1200, -260, 0.6] };
  const CU_TITLE = ['C', 'U', 'T', '-', 'O', 'U', 'T'];
  const CU_TCOL = [CU.coat, CU.cap, CU.scarf, CU.cream, CU.coat, CU.cap, CU.scarf];
  const q12 = t => Math.floor(t * 12 + 1e-6) / 12;
  const cuCam = tq => kf(tq, [[CU_T.walk, 0], [CU_T.stop + 0.35, 430, E.ioS]]);
  const cuCharX = tq => kf(tq, [[CU_T.walk, 690], [CU_T.stop, 1185, E.ioS]]);

  let paperTex = null;
  function paperTile() {
    if (paperTex) return paperTex;
    const N = 256, T = offscreen(N, N), g = T.getContext('2d'), r = rng(1997);
    for (let k = 0; k < 7000; k++) { g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${0.025 + r() * 0.05})` : `rgba(255,250,235,${0.03 + r() * 0.06})`; g.fillRect(r() * N, r() * N, 1 + r() * 2.2, 1 + r() * 1.4); }
    g.lineWidth = 1;
    for (let k = 0; k < 140; k++) {
      const x = r() * N, y = r() * N, a = r() * TAU, l = 6 + r() * 18;
      g.strokeStyle = r() < 0.5 ? 'rgba(255,250,235,0.09)' : 'rgba(0,0,0,0.06)';
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    return (paperTex = T);
  }
  // One piece of construction paper: soft shadow on what lies beneath, fibre texture, a pale cut edge.
  function cutPiece(c, pts, col, seed, o = {}) {
    c.save();
    if (o.shadow !== false) { c.shadowColor = o.sh || 'rgba(8,12,18,0.42)'; c.shadowBlur = o.blur ?? 9; c.shadowOffsetX = o.sx ?? 4; c.shadowOffsetY = o.sy ?? 6; }
    roughPoly(c, pts, seed, o.amp ?? 1.4, o.step ?? 16);
    c.fillStyle = col; c.fill();
    c.restore();
    c.fillStyle = patOf(c, paperTile()); c.fill();
    if (o.edge !== false) { c.lineWidth = o.ew ?? 1.6; c.strokeStyle = o.ec || 'rgba(255,246,226,0.28)'; c.stroke(); }
  }
  // Brass split pin: the fastener that makes a joint.
  function cuPin(c, x, y, s = 1) {
    if (s <= 0) return;
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.arc(1.5, 2, 7, 0, TAU); c.fill();
    const g = c.createRadialGradient(-2, -2, 0.5, 0, 0, 7); g.addColorStop(0, '#f6e3a0'); g.addColorStop(0.5, CU.brass); g.addColorStop(1, '#7c5e22');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 6.5, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(70,50,15,0.6)'; c.lineWidth = 1; c.stroke();
    c.restore();
  }
  const cuPine = (x, base, h, w) => [[x - w * 0.07, base], [x - w * 0.07, base - h * 0.1], [x - w * 0.5, base - h * 0.12], [x - w * 0.2, base - h * 0.4], [x - w * 0.38, base - h * 0.42], [x - w * 0.12, base - h * 0.68], [x - w * 0.25, base - h * 0.7], [x, base - h], [x + w * 0.25, base - h * 0.7], [x + w * 0.12, base - h * 0.68], [x + w * 0.38, base - h * 0.42], [x + w * 0.2, base - h * 0.4], [x + w * 0.5, base - h * 0.12], [x + w * 0.07, base - h * 0.1], [x + w * 0.07, base]];

  function cuSetup() {
    paperTile();
    const mk = (d, y0, h) => { const w = Math.ceil(1920 + 440 * d + 240), cv = offscreen(w, h), g = cv.getContext('2d'); g.translate(0, -y0); return { cv, g, d, y0, w }; };
    // sky: two sheets of blue paper overlapping, punched stars
    const sky = offscreen(1920, 1080), s = sky.getContext('2d'), r = rng(31);
    const sg = s.createLinearGradient(0, 0, 0, 1080); sg.addColorStop(0, CU.sky0); sg.addColorStop(0.5, CU.sky1); sg.addColorStop(0.8, CU.sky2); sg.addColorStop(1, CU.sky2);
    s.fillStyle = sg; s.fillRect(0, 0, 1920, 1080);
    s.fillStyle = patOf(s, paperTex); s.fillRect(0, 0, 1920, 1080);
    const sheet = [[1180, -20], [1940, -20], [1940, 1100], [1240, 1100]];
    s.save(); s.globalAlpha = 0.5; cutPiece(s, sheet, '#4a6b7d', 7, { amp: 3, step: 20, blur: 14, sx: -5, sy: 0, sh: 'rgba(5,10,16,0.5)' }); s.restore();
    for (let k = 0; k < 70; k++) { const x = r() * 1920, y = r() * 430, rr = 1.2 + r() * 2.2; s.fillStyle = `rgba(240,228,190,${0.35 + r() * 0.5})`; s.beginPath(); s.arc(x, y, rr, 0, TAU); s.fill(); }
    // far hills
    const far = mk(0.15, 440, 640);
    { const p = []; for (let x = -20; x <= far.w + 20; x += 70) p.push([x, 610 + 46 * vnoise(x * 0.0042, 3) + 22 * vnoise(x * 0.013, 4)]); p.push([far.w + 20, 1100], [-20, 1100]); cutPiece(far.g, p, CU.far, 21, { amp: 2.2, step: 22, blur: 16, sx: 0, sy: -2 }); }
    // mid hills with a ridge of little pines
    const mid = mk(0.35, 540, 540), hy = x => 712 + 40 * vnoise(x * 0.0035 + 4, 6) + 16 * vnoise(x * 0.011, 7);
    { const rr = rng(44); for (let x = 30; x < mid.w; x += 60 + rr() * 90) { const h = 50 + rr() * 70; cutPiece(mid.g, cuPine(x, hy(x) + 14, h, h * 0.5), CU.midP, 300 + x, { amp: 1, step: 12, blur: 6, sx: 2, sy: 3 }); }
      const p = []; for (let x = -20; x <= mid.w + 20; x += 60) p.push([x, hy(x)]); p.push([mid.w + 20, 1100], [-20, 1100]); cutPiece(mid.g, p, CU.mid, 22, { amp: 2, step: 20, blur: 14, sx: 0, sy: -3 }); }
    // pines and the bare tree the owl lands on
    const trees = mk(0.55, 100, 980);
    { const rr = rng(57); let k = 0;
      for (let x = 40; x < trees.w; x += 200 + rr() * 170) {
        if (x > 1620 && x < 2000) continue;
        const h = 300 + rr() * 230, base = 830 + rr() * 30;
        cutPiece(trees.g, cuPine(x, base, h, h * 0.42), k++ % 2 ? CU.pine : CU.pine2, 400 + k, { amp: 1.6, step: 18, blur: 12, sx: 4, sy: 6 });
      }
      const T = trees.g, B = CU.bare;
      cutPiece(T, [[1772, 860], [1836, 860], [1822, 640], [1816, 420], [1808, 300], [1796, 300], [1792, 430], [1784, 640]], B, 501, { amp: 1.6, step: 18, blur: 12 });
      cutPiece(T, [[1802, 512], [1560, 460], [1554, 472], [1800, 540]], B, 502, { amp: 1.2, step: 14, blur: 10 });
      cutPiece(T, [[1810, 420], [1930, 330], [1938, 340], [1812, 446]], B, 503, { amp: 1.2, step: 14, blur: 10 });
      cutPiece(T, [[1640, 478], [1604, 400], [1612, 396], [1652, 478]], B, 504, { amp: 1, step: 12, blur: 8 });
      cutPiece(T, [[1806, 610], [1906, 560], [1910, 570], [1808, 630]], B, 505, { amp: 1, step: 12, blur: 8 });
    }
    // tracing-paper fog: soft drifts plus one sheet with a visible edge
    const fogL = (d, y0, h, bands, a, seed) => {
      const L = mk(d, y0, h), g = L.g, rr = rng(seed);
      g.save(); g.filter = 'blur(26px)';
      for (let k = 0; k < 26; k++) { const x = rr() * L.w, y = lerp(bands[0], bands[1], rr()); g.fillStyle = `rgba(226,234,230,${a * (0.6 + rr() * 0.6)})`; g.beginPath(); g.ellipse(x, y, 180 + rr() * 260, 30 + rr() * 40, 0, 0, TAU); g.fill(); }
      g.restore();
      const p = []; for (let x = -20; x <= L.w + 20; x += 90) p.push([x, bands[0] + 30 * vnoise(x * 0.006, seed)]);
      p.push([L.w + 20, bands[1] + 60], [-20, bands[1] + 60]);
      g.save(); g.globalAlpha = a * 0.55; roughPoly(g, p, seed, 2.5, 22); g.fillStyle = '#e8eeea'; g.fill(); g.restore();
      return L;
    };
    const fog1 = fogL(0.25, 380, 520, [600, 760], 0.16, 61), fog2 = fogL(0.7, 560, 420, [770, 860], 0.17, 62), fog3 = fogL(1.15, 700, 380, [880, 960], 0.09, 63);
    // the path
    const ground = mk(1, 800, 280);
    { const g = ground.g, rr = rng(71), p = [];
      for (let x = -20; x <= ground.w + 20; x += 50) p.push([x, 856 + 8 * vnoise(x * 0.01, 9)]);
      p.push([ground.w + 20, 1100], [-20, 1100]);
      cutPiece(g, p, CU.ground, 72, { amp: 1.8, step: 18, blur: 14, sx: 0, sy: -4 });
      const band = []; for (let x = -20; x <= ground.w + 20; x += 60) band.push([x, 930 + 10 * vnoise(x * 0.008, 10)]);
      band.push([ground.w + 20, 1100], [-20, 1100]);
      cutPiece(g, band, '#4b3b2b', 73, { amp: 1.6, step: 18, blur: 8, sx: 0, sy: -3 });
      for (let k = 0; k < 60; k++) { const x = rr() * ground.w, y = 880 + rr() * 170, w = 8 + rr() * 16; cutPiece(g, ellP(x, y, w, w * 0.6, 9, 0.3, 80 + k), rr() < 0.5 ? CU.ground2 : '#6a5a48', 80 + k, { blur: 3, sx: 1, sy: 2, ew: 1 }); }
      for (let k = 0; k < 40; k++) { const x = rr() * ground.w, y = 862 + rr() * 6, h = 12 + rr() * 18; cutPiece(g, [[x - 9, y], [x - 6, y - h], [x - 1, y - 3], [x + 3, y - h * 1.2], [x + 5, y - 2], [x + 10, y - h * 0.8], [x + 10, y]], '#3d4a2a', 120 + k, { blur: 3, sx: 1, sy: 1, edge: false }); }
    }
    // blurred foreground: tall grass nearest the lens
    const fg = mk(1.5, 0, 1080);
    { const tmp = offscreen(fg.w, 1080), g = tmp.getContext('2d'), rr = rng(91);
      g.fillStyle = CU.fg;
      for (let cl = 0; cl < 9; cl++) {
        const cx = 120 + cl * (fg.w / 9) + rr() * 120;
        for (let k = 0; k < 14; k++) { const x = cx + (rr() - 0.5) * 220, h = 70 + rr() * 110, lean = (rr() - 0.5) * 60; g.beginPath(); g.moveTo(x - 10, 1090); g.quadraticCurveTo(x + lean * 0.3, 1080 - h * 0.6, x + lean, 1080 - h); g.quadraticCurveTo(x + lean * 0.3 + 6, 1080 - h * 0.5, x + 12, 1090); g.fill(); }
      }
      fg.g.save(); fg.g.setTransform(1, 0, 0, 1, 0, 0); fg.g.filter = 'blur(8px)'; fg.g.drawImage(tmp, 0, 0); fg.g.restore();
    }
    return { sky, far, mid, trees, fog1, fog2, fog3, ground, fg };
  }
  // A plate under the camera: parallax by depth, its slide-in, a hair of hand-placed jitter per exposure.
  function cuPlate(c, L, tq, camX, slide, drift = 0) {
    const [a, b, dx, dy] = slide, u = E.outQ(seg(tq, a, b));
    if (tq < a) return;
    const step = Math.floor(tq * 12), jx = (hash(step * 1.7 + L.d * 31) - 0.5) * 1.6, jy = (hash(step * 2.3 + L.d * 17) - 0.5) * 1.2;
    c.drawImage(L.cv, -100 - camX * L.d + dx * (1 - u) + jx + drift, L.y0 + dy * (1 - u) + jy);
  }
  function cuPose(tq) {
    const a = seg(tq, CU_T.walk, CU_T.walk + 0.35) * (1 - seg(tq, CU_T.stop - 0.1, CU_T.stop + 0.3));
    const ph = TAU * 1.15 * Math.max(0, tq - CU_T.walk), s = Math.sin(ph), co = Math.cos(ph);
    const look = E.outQ(seg(tq, CU_T.look, CU_T.look + 0.17)), dt = Math.max(0, tq - CU_T.stop);
    return {
      a, ph, look, bob: -7 * a * Math.abs(co), lean: 0.07 * a - 0.03 * look,
      nT: -0.42 * s * a, nS: (0.06 + 0.6 * Math.max(0, co)) * a, fT: 0.42 * s * a, fS: (0.06 + 0.6 * Math.max(0, -co)) * a,
      fU: -0.4 * s * a + 0.05, fF: -0.2 - 0.12 * a,
      nU: -0.95 + 0.05 * s * a - 0.3 * look, nF: -0.35 + 0.1 * look,
      head: 0.03 * s * a - 0.34 * look,
      scarf: 0.35 + (0.22 * Math.sin(ph * 2 + 1) + 0.25) * a + 0.12 * Math.exp(-dt * 2) * Math.sin(dt * 7) * (tq > CU_T.stop ? 1 : 0),
      swing: 0.24 * Math.sin(ph + 0.8) * a + (tq > CU_T.stop ? 0.26 * Math.exp(-dt * 1.4) * Math.sin(dt * 6.2) : 0),
      face: tq < CU_T.look + 0.08 ? 'side' : tq < CU_T.smile ? 'wow' : 'smile',
    };
  }
  function cuChar(c, tq, x, y) {
    if (tq < CU_T.kit) return;
    const P = cuPose(tq), step = Math.floor(tq * 12);
    const off = k => { const e = CU_IN[k], u = seg(tq, e[0] - 0.42, e[0]); if (u <= 0) return null; const v = 1 - E.outB(u, 1.2); return [e[1] * v, e[2] * v, e[3] * v]; };
    const R = mTR(x, y + P.bob, 0), torso = mMul(R, mTR(0, 0, P.lean)), head = mMul(torso, mTR(4, -146, P.head));
    const leg = (T, S) => { const th = mMul(R, mTR(0, -6, T)), sh = mMul(th, mTR(0, 74, S)), bt = mMul(sh, mTR(0, 66, -(T + S) * 0.7)); return { th, sh, bt }; };
    const arm = (U, F) => { const up = mMul(torso, mTR(2, -126, U)), fo = mMul(up, mTR(0, 58, F)); return { up, fo }; };
    const nL = leg(P.nT, P.nS), fL = leg(P.fT, P.fS), nA = arm(P.nU, P.nF), fA = arm(P.fU, P.fF);
    const part = (M, k, id, fn) => {
      const o = off(k); if (!o) return;
      c.save(); c.translate(o[0], o[1]); c.transform(M[0], M[1], M[2], M[3], M[4], M[5]);
      c.rotate((hash(step * 7.7 + id * 3.31) - 0.5) * 0.018 + o[2]); fn(); c.restore();
    };
    const PT = { thigh: [[-15, -8], [15, -8], [13, 80], [-12, 80]], shin: [[-12, -6], [12, -6], [11, 70], [-11, 70]], boot: [[-13, -8], [12, -8], [15, 4], [33, 9], [35, 22], [-16, 22]], upper: [[-12, -10], [12, -10], [11, 64], [-10, 64]], fore: [[-11, -6], [11, -6], [10, 54], [-10, 54]] };
    const legD = (L, k, dark, id) => {
      part(L.th, k, id, () => cutPiece(c, PT.thigh, dark ? CU.pantsD : CU.pants, id));
      part(L.sh, k, id + 1, () => cutPiece(c, PT.shin, dark ? CU.pantsD : CU.pants, id + 1));
      part(L.bt, k, id + 2, () => cutPiece(c, PT.boot, CU.boot, id + 2));
    };
    // far arm and far leg sit behind the coat
    part(fA.up, 'fA', 1, () => cutPiece(c, PT.upper, CU.coatD, 11));
    part(fA.fo, 'fA', 2, () => { cutPiece(c, PT.fore, CU.coatD, 12); cutPiece(c, ellP(0, 60, 14, 13, 14, 0.12, 13), CU.capD, 13); });
    legD(fL, 'fL', true, 20);
    part(torso, 'scarf', 30, () => { c.save(); c.translate(-18, -140); c.rotate(P.scarf); cutPiece(c, [[-9, 0], [9, 0], [12, 62], [7, 74], [3, 64], [-1, 76], [-5, 64], [-10, 72]], CU.scarfD, 31); c.restore(); });
    legD(nL, 'nL', false, 40);
    part(torso, 'torso', 50, () => {
      cutPiece(c, [[-42, 44], [-36, -40], [-30, -122], [-20, -146], [22, -146], [34, -124], [40, -40], [50, 44]], CU.coat, 51, { blur: 12 });
      cutPiece(c, [[-42, 30], [50, 30], [50, 44], [-42, 44]], CU.coatD, 52, { blur: 4, sx: 1, sy: 2 });
      [[22, -96], [24, -58], [26, -20]].forEach(([bx, by], i) => cutPiece(c, ellP(bx, by, 5, 5, 10, 0, 53 + i), CU.ink, 53 + i, { blur: 2, sx: 1, sy: 1, edge: false }));
    });
    part(head, 'head', 60, () => {
      cutPiece(c, ellP(6, -46, 50, 50, 30, 0.04, 61), CU.skin, 61, { blur: 10 });
      if (P.face === 'side') {
        cutPiece(c, ellP(30, -48, 6, 6, 10, 0, 62), CU.ink, 62, { blur: 2, sx: 1, sy: 1, edge: false });
        cutPiece(c, [[34, -21], [48, -24], [48, -19], [34, -17]], '#7a2b22', 63, { blur: 2, sx: 1, sy: 1, edge: false });
      } else if (P.face === 'wow') {
        cutPiece(c, ellP(30, -52, 13, 13, 16, 0.1, 64), '#f6efe0', 64, { blur: 3, sx: 1, sy: 2 });
        cutPiece(c, ellP(34, -56, 5.5, 5.5, 10, 0, 65), CU.ink, 65, { blur: 2, sx: 1, sy: 1, edge: false });
        cutPiece(c, ellP(42, -20, 7, 8, 12, 0.1, 66), CU.ink, 66, { blur: 2, sx: 1, sy: 1, edge: false });
      } else {
        cutPiece(c, [...arcP(30, -46, 9, PI * 1.05, PI * 1.95, 8), ...arcP(30, -44, 6, PI * 1.9, PI * 1.1, 6)], CU.ink, 67, { blur: 2, sx: 1, sy: 1, edge: false, amp: 0.3 });
        cutPiece(c, [...arcP(38, -30, 12, PI * 0.15, PI * 0.85, 8), ...arcP(38, -27, 7, PI * 0.8, PI * 0.2, 6)], '#7a2b22', 68, { blur: 2, sx: 1, sy: 1, edge: false, amp: 0.3 });
      }
      cutPiece(c, [[50, -54], [72, -40], [50, -33]], '#e7bf94', 69, { blur: 4, sx: 2, sy: 2, amp: 0.6 });
      c.globalAlpha = 0.8; cutPiece(c, ellP(20, -26, 9, 8, 12, 0.1, 70), CU.cheek, 70, { shadow: false, edge: false }); c.globalAlpha = 1;
    });
    part(head, 'cap', 71, () => {
      cutPiece(c, [...arcP(6, -60, 54, PI, TAU, 14)], CU.cap, 72, { blur: 8 });
      cutPiece(c, [[-52, -68], [64, -68], [64, -50], [-52, -50]], CU.capD, 73, { blur: 5, sx: 2, sy: 3 });
      for (let k = 0; k < 6; k++) { c.strokeStyle = 'rgba(80,50,10,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-40 + k * 18, -68); c.lineTo(-38 + k * 18, -50); c.stroke(); }
      cutPiece(c, ellP(-4, -118, 15, 14, 14, 0.25, 74), CU.cream, 74, { blur: 6 });
    });
    part(torso, 'scarf', 75, () => cutPiece(c, [[-30, -152], [30, -150], [32, -128], [-30, -126]], CU.scarf, 76, { blur: 6, sx: 2, sy: 4 }));
    // near arm with the lantern pole: the hand keeps the pole at one angle in the world
    let tip = null, lamp = null;
    part(nA.up, 'nA', 80, () => cutPiece(c, PT.upper, CU.coat, 81));
    const pole = mMul(nA.fo, mTR(0, 56, -0.55 - (P.lean + P.nU + P.nF)));
    tip = mAp(pole, 124, 0);
    part(pole, 'lamp', 82, () => cutPiece(c, [[0, -3.5], [126, -2.5], [126, 2.5], [0, 3.5]], '#6b4a2c', 83, { blur: 4, amp: 0.4 }));
    part(nA.fo, 'nA', 84, () => { cutPiece(c, PT.fore, CU.coat, 85); cutPiece(c, ellP(0, 58, 14, 13, 14, 0.12, 86), CU.cap, 86, { blur: 5 }); });
    const lo = off('lamp');
    if (lo) {
      const sw = P.swing + lo[2];
      c.save(); c.translate(tip[0] + lo[0], tip[1] + lo[1]); c.rotate(sw);
      c.strokeStyle = CU.iron; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 12); c.stroke();
      cutPiece(c, [[-11, 20], [11, 20], [16, 30], [-16, 30]], CU.iron, 87, { blur: 5 });
      cutPiece(c, R4(-14, 30, 14, 66), CU.lamp, 88, { blur: 6, ec: 'rgba(255,255,230,0.6)' });
      c.fillStyle = CU.iron; c.fillRect(-2, 30, 4, 36); c.fillRect(-14, 46, 28, 3);
      cutPiece(c, [[-17, 66], [17, 66], [12, 74], [-12, 74]], CU.iron, 89, { blur: 5 });
      c.restore();
      lamp = [tip[0] + lo[0] - Math.sin(sw) * 48, tip[1] + lo[1] + Math.cos(sw) * 48];
    }
    // pins pop in at every visible joint
    const pins = [[nA.up, 0, 0], [nA.fo, 0, 0], [nL.sh, 0, 0], [fL.sh, 0, 0], [nL.bt, 0, 0], [fL.bt, 0, 0], [nA.fo, 0, 56]];
    pins.forEach(([M, px, py], i) => { const at = CU_T.pins + i * 0.05, u = seg(tq, at, at + 0.17); if (u <= 0) return; const p = mAp(M, px, py); cuPin(c, p[0], p[1], u < 1 ? 1.6 - 0.6 * u : 1); });
    return lamp;
  }
  function cuOwl(c, tq, ox) {
    if (tq < CU_T.owl) return;
    const step = Math.floor(tq * 12), u = E.outQ(seg(tq, CU_T.owl, CU_T.land));
    const px = lerp(2560, 1630, u) + ox, py = lerp(150, 437, u) - Math.sin(u * PI) * 70;
    const flap = tq < CU_T.land ? 0.95 + 0.75 * Math.sin(step * PI / 2) : lerp(0.95, 0.12, E.outQ(seg(tq, CU_T.land, CU_T.land + 0.34)));
    const hoot = (tq > CU_T.hoot && tq < CU_T.hoot + 0.25) || (tq > CU_T.hoot + 0.34 && tq < CU_T.hoot + 0.8), blink = tq > 8.3 && tq < 8.45;
    c.save(); c.translate(px, py); c.rotate(tq < CU_T.land ? -0.25 : 0); c.scale(0.9, hoot ? 0.94 : 0.9); if (hoot) c.translate(0, 3);
    const wing = (sx, a, seed) => { c.save(); c.translate(sx, -18); c.rotate(a); cutPiece(c, [[-9, -4], [9, -4], [15, 28], [6, 66], [-4, 60], [-12, 30]], CU.owlW, seed, { blur: 6 }); c.restore(); };
    wing(-26, flap, 601); wing(26, -flap, 602);
    cutPiece(c, ellP(0, 0, 34, 46, 26, 0.05, 603), CU.owl, 603, { blur: 8 });
    cutPiece(c, ellP(0, 12, 22, 30, 20, 0.06, 604), CU.owlL, 604, { blur: 3, sx: 1, sy: 2 });
    c.strokeStyle = 'rgba(80,55,30,0.7)'; c.lineWidth = 2;
    for (let k = 0; k < 6; k++) { const vx = (k % 2 ? 8 : -8), vy = 4 + Math.floor(k / 2) * 11; c.beginPath(); c.moveTo(vx - 4, vy); c.lineTo(vx, vy + 4); c.lineTo(vx + 4, vy); c.stroke(); }
    cutPiece(c, [[-30, -32], [-26, -64], [-10, -42]], CU.owl, 605, { blur: 4 });
    cutPiece(c, [[30, -32], [26, -64], [10, -42]], CU.owl, 606, { blur: 4 });
    cutPiece(c, ellP(-13, -24, 16, 15, 16, 0.08, 607), CU.owlF, 607, { blur: 3, sx: 1, sy: 2 });
    cutPiece(c, ellP(13, -24, 16, 15, 16, 0.08, 608), CU.owlF, 608, { blur: 3, sx: 1, sy: 2 });
    [-13, 13].forEach((ex, i) => {
      if (blink) { c.strokeStyle = CU.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(ex - 8, -24); c.lineTo(ex + 8, -24); c.stroke(); return; }
      cutPiece(c, ellP(ex, -25, 8.5, 8.5, 12, 0, 609 + i), '#f2c230', 609 + i, { blur: 2, sx: 1, sy: 1 });
      cutPiece(c, ellP(ex - 2, -23, 4.2, 4.2, 10, 0, 611 + i), CU.ink, 611 + i, { shadow: false, edge: false });
    });
    if (hoot) { cutPiece(c, [[-6, -18], [6, -18], [0, -12]], CU.beak, 613, { blur: 2, sx: 1, sy: 1 }); cutPiece(c, [[-5, -9], [5, -9], [0, -2]], CU.beak, 614, { blur: 2, sx: 1, sy: 1 }); }
    else cutPiece(c, [[-5, -18], [5, -18], [0, -5]], CU.beak, 613, { blur: 2, sx: 1, sy: 1 });
    cutPiece(c, R4(-16, 42, -4, 50), CU.beak, 615, { blur: 2, sx: 1, sy: 1 }); cutPiece(c, R4(4, 42, 16, 50), CU.beak, 616, { blur: 2, sx: 1, sy: 1 });
    c.restore();
  }
  function cuTitle(c, tq) {
    const sp = 128, x0 = 960 - ((CU_TITLE.length - 1) * sp) / 2;
    CU_TITLE.forEach((ch, i) => {
      const at = CU_T.title + i * 0.1, u = seg(tq, at, at + 0.25);
      if (u <= 0) return;
      const e = E.outQ(u), rot = lerp(0.7 * (i % 2 ? 1 : -1), (hash(i * 3.3) - 0.5) * 0.13, e);
      c.save(); c.translate(x0 + i * sp + (hash(i * 9.1) - 0.5) * 10, lerp(-170, 196 + (hash(i * 5.7) - 0.5) * 16, e)); c.rotate(rot);
      if (ch === '-') { cutPiece(c, R4(-34, -12, 34, 14), CU.cream, 900 + i, { amp: 1.6, step: 14, blur: 10, sx: 5, sy: 8 }); c.restore(); return; }
      cutPiece(c, R4(-56, -76, 56, 76), CU_TCOL[i], 900 + i, { amp: 2.2, step: 18, blur: 12, sx: 6, sy: 9 });
      c.save(); c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 4; c.shadowOffsetX = 2; c.shadowOffsetY = 3;
      text(c, ch, 0, 8, { font: CU_F.slab, size: 116, align: 'center', base: 'middle', color: CU.cream });
      c.restore();
      c.restore();
    });
    const u = E.outQ(seg(tq, CU_T.sub, CU_T.sub + 0.33));
    if (u > 0) {
      c.save(); c.translate(lerp(-700, 960, u), 340); c.rotate(-0.012);
      cutPiece(c, R4(-420, -30, 420, 30), CU.cream, 950, { amp: 1.8, step: 20, blur: 10, sx: 5, sy: 7 });
      text(c, 'JOINTED PAPER · PINNED · SHOT ON TWOS', 0, 2, { font: CU_F.type, size: 34, align: 'center', base: 'middle', color: CU.ink, ls: 2 });
      cuPin(c, -396, 0); cuPin(c, 396, 0);
      c.restore();
    }
  }

  MG.film({
    id: 'cutout', dur: 10, poster: 9.4,
    fonts: [['400 116px "Alfa Slab One"', 'CUT-O'], ['400 34px "Special Elite"', 'JOINTED PAPER · PINNED · SHOT ON TWOS']],
    meta: {
      family: 'C', name: 'Cut-out', sub: 'Jointed Paper Under the Camera', era: '1917 —',
      origin: 'Cut-out animation moves flat pieces of paper or card, pinned or hinged at the joints, a frame at a time beneath a downward-looking rostrum camera. Quirino Cristiani made the first animated feature, El Apóstol (1917), this way; Terry Gilliam glued Victorian engravings into hinged absurdities for Monty Python; Yuri Norstein spread his cut-outs over tiers of glass with tracing-paper fog between them; and South Park’s first episode (1997) was shot in real construction paper before the look moved into software.',
      works: 'Monty Python’s Flying Circus animations (Terry Gilliam, BBC, 1969–74) · Fantastic Planet (René Laloux & Roland Topor, 1973) · Hedgehog in the Fog (Yuri Norstein, Soyuzmultfilm, 1975) · Tale of Tales (Yuri Norstein, 1979) · South Park, first episode (Trey Parker & Matt Stone, Comedy Central, 1997)',
      tech: ['Brass-pinned paper joints', 'Multiplane glass, tracing-paper fog', 'Stepped on twos (12 fps)'],
      accent: '#c2452d',
      motionDNA: 'Every move is a piece pushed a few millimetres and shot again: limbs swing on their pins instead of bending, the walk is a crude pendulum cycle on twos, the head tilts as a rigid disc and expressions change by swapping in a replacement face; the planes slide past at their own speeds, and each piece settles a hair off where it lay the frame before.',
      visualDNA: 'Matte construction paper with fibre and slightly ragged scissor-cut edges, soft shadows between pieces and between glass plates, brass split pins at the joints, a dusk palette of slate blue, pine green and earth with a red coat, mustard cap and teal scarf, and tracing-paper fog drifting between the layers.',
      transitions: 'Empty sky → plates slid in one by one → puppet assembled and pinned → walk on twos with a multiplane truck → owl flaps in → replacement face → title tiles set down letter by letter',
      implementation: ['Rostrum camera & multiplane glass', 'Toon Boom Harmony / Moho cut-out rigs', 'Canvas 2D'],
      reproducibility: 'Fully procedural (paper texture, puppets and plates are all generated in code)',
      loopable: false,
    },
    setup: cuSetup,
    draw(c, t, W, H, st) {
      const tq = q12(t), step = Math.floor(t * 12), camX = cuCam(tq);
      const drift = (k, s) => Math.round(vnoise(tq * 0.35 + k, s) * 60);
      c.drawImage(st.sky, 0, 0);
      // the moon hangs on a thread from above the camera
      { const [a, b, , dy] = CU_PL.moon, u = E.outQ(seg(tq, a, b));
        if (tq >= a) { const mx = 1600 - camX * 0.06, my = 190 + dy * (1 - u);
          c.strokeStyle = 'rgba(230,225,200,0.35)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(mx, -10); c.lineTo(mx, my - 70); c.stroke();
          cutPiece(c, ellP(mx, my, 70, 70, 36, 0.035, 5), CU.moon, 5, { blur: 16, sx: 6, sy: 8 });
          c.globalAlpha = 0.5; cutPiece(c, ellP(mx - 20, my - 12, 14, 12, 12, 0.2, 6), '#d8c386', 6, { shadow: false, edge: false }); cutPiece(c, ellP(mx + 22, my + 20, 9, 8, 10, 0.2, 8), '#d8c386', 8, { shadow: false, edge: false }); c.globalAlpha = 1; } }
      cuPlate(c, st.far, tq, camX, CU_PL.far);
      cuPlate(c, st.fog1, tq, camX, CU_PL.fog1, drift(1, 3));
      cuPlate(c, st.mid, tq, camX, CU_PL.mid);
      cuPlate(c, st.trees, tq, camX, CU_PL.trees);
      cuOwl(c, tq, -100 - camX * 0.55 + (hash(step * 1.7 + 0.55 * 31) - 0.5) * 1.6);
      cuPlate(c, st.fog2, tq, camX, CU_PL.fog2, drift(4, 5));
      cuPlate(c, st.ground, tq, camX, CU_PL.ground);
      const lamp = cuChar(c, tq, cuCharX(tq) - camX, 736);
      if (lamp) {
        const k = 0.85 + 0.15 * hash(step * 0.37);
        c.save(); c.globalCompositeOperation = 'screen';
        const g = c.createRadialGradient(lamp[0], lamp[1], 4, lamp[0], lamp[1], 300); g.addColorStop(0, `rgba(255,214,120,${0.42 * k})`); g.addColorStop(0.25, `rgba(255,190,100,${0.16 * k})`); g.addColorStop(1, 'rgba(255,180,90,0)');
        c.fillStyle = g; c.fillRect(lamp[0] - 300, lamp[1] - 300, 600, 600); c.restore();
      }
      cuPlate(c, st.fog3, tq, camX, CU_PL.fog3, drift(7, 8));
      cuPlate(c, st.fg, tq, camX, CU_PL.fg);
      cuTitle(c, tq);
      // the stand's lamps: a slight exposure wobble per frame, then grain and a soft vignette
      c.fillStyle = `rgba(255,240,210,${0.03 * hash(step * 0.71)})`; c.fillRect(0, 0, W, H);
      grain(c, W, H, t, 0.06);
      vignette(c, W, H, 0.5, '10,14,20');
    },
    score(A) {
      A.bus.gain.value = 1.15;
      // 1. the plates: card sliding over glass, a tap as each settles
      Object.values(CU_PL).forEach(([a, b], i) => {
        A.noise(a, { type: 'bandpass', f: 600 + i * 60, f2: 1500, q: 0.9, dur: b - a + 0.05, g: 0.045, swell: 0.5, pan: (i % 2 ? 0.3 : -0.3) });
        A.osc(b, { type: 'triangle', f: 190, f2: 110, dur: 0.07, g: 0.06 });
      });
      // 2. the puppet: paper flicks in, each pin a brass tick
      Object.values(CU_IN).forEach(([at], i) => {
        A.noise(at - 0.36, { type: 'bandpass', f: 1200, f2: 3400, q: 1.2, dur: 0.32, g: 0.035, swell: 0.7, pan: (i % 2 ? 0.25 : -0.25) });
        A.noise(at, { type: 'bandpass', f: 2400, q: 2, dur: 0.03, g: 0.08 });
      });
      for (let i = 0; i < 7; i++) { const tp = CU_T.pins + i * 0.05; A.osc(tp, { type: 'square', f: 3100, dur: 0.02, g: 0.015, lp: 6000 }); A.bell(tp, 2093 + i * 110, { g: 0.022, dur: 0.25, rev: 0.2 }); }
      // 3. a little oom-pah march for the walk: tuba on the beat, pizzicato off it, a bassoon tune
      const B = 0.5, t0 = CU_T.walk;
      const bars = [[36, 43, [64, 67, 72], [67, 72, 76, 72]], [31, 38, [62, 65, 71], [74, 71, 67, 71]], [36, 43, [64, 67, 72], [72, 76, 79, 76]], [41, 36, [65, 69, 72], [77, 76, 74, 72]]];
      bars.forEach(([r0, r1, ch, mel], b) => {
        const tb = t0 + b * 2 * B;
        [r0, r1].forEach((m, k) => { const t = tb + k * B; if (t < CU_T.stop) A.osc(t, { type: 'triangle', f: midi(m), dur: 0.26, g: 0.24, lp: 500, a: 0.01 }); });
        [0, 1].forEach(k => { const t = tb + k * B + B / 2; if (t < CU_T.stop) ch.forEach((m, j) => A.pluck(t + j * 0.006, midi(m), { dur: 0.35, g: 0.07, bright: 0.45, lp: 2600, pan: (j - 1) * 0.3 })); });
        mel.forEach((m, k) => { const t = tb + k * B / 2; if (t < CU_T.stop - 0.05) A.osc(t, { type: 'sawtooth', f: midi(m - 12), dur: 0.2, g: 0.045, lp: 950, q: 2, a: 0.012, hold: true, rel: 0.05, vib: [5, 1.5], rev: 0.15 }); });
      });
      // footfalls, quantised to the twelve-a-second exposures
      for (let k = 0; ; k++) { const t = q12(t0 + 0.2 + k / 2.3); if (t > CU_T.stop) break; A.noise(t, { type: 'lowpass', f: 420, dur: 0.07, g: 0.07, pan: k % 2 ? 0.15 : -0.15 }); }
      // the stop: the march hangs on a held dominant while the owl settles
      A.osc(CU_T.stop, { type: 'triangle', f: midi(31), dur: 0.9, g: 0.16, lp: 450, a: 0.02 });
      [62, 65, 71].forEach((m, j) => A.osc(CU_T.stop, { type: 'sawtooth', f: midi(m - 12), dur: 0.9, g: 0.016, lp: 900, a: 0.05, vib: [5, 1.2], pan: (j - 1) * 0.4, rev: 0.3 }));
      // the owl: wing flaps on the way in, then hoo… hoo-oo
      for (let t = CU_T.owl + 1 / 12; t < CU_T.land; t += 1 / 3) A.whoosh(t, 0.16, { f1: 260, f2: 900, g: 0.05, rev: 0.1 });
      A.osc(CU_T.hoot, { f: 392, f2: 370, dur: 0.28, g: 0.08, a: 0.04, lp: 1200, rev: 0.5 });
      A.osc(CU_T.hoot + 0.34, { f: 392, f2: 340, glide: 0.45, dur: 0.5, g: 0.08, a: 0.05, vib: [5.5, 4], lp: 1200, rev: 0.5 });
      // replacement faces: a paper flick, a small plink for the smile
      A.noise(CU_T.look + 0.08, { type: 'bandpass', f: 2600, q: 2, dur: 0.03, g: 0.07 });
      A.noise(CU_T.smile, { type: 'bandpass', f: 2600, q: 2, dur: 0.03, g: 0.07 });
      A.bell(CU_T.smile, midi(84), { g: 0.04, dur: 0.6 });
      // 4. title tiles: a xylophone climbs a note per letter, then the ta-da
      const sc = [72, 74, 76, 77, 79, 81, 83];
      CU_TITLE.forEach((_, i) => { const t = CU_T.title + i * 0.1 + 0.25; A.osc(t, { type: 'triangle', f: midi(sc[i]), dur: 0.3, g: 0.08 }); A.osc(t, { f: midi(sc[i]) * 3.9, dur: 0.05, g: 0.02 }); A.noise(t, { type: 'bandpass', f: 1800, q: 1.5, dur: 0.02, g: 0.05 }); });
      const ts = CU_T.sub + 0.33;
      A.osc(ts, { type: 'triangle', f: midi(36), dur: 1.2, g: 0.22, lp: 500 });
      [60, 64, 67, 72].forEach((m, j) => A.pluck(ts + j * 0.012, midi(m), { dur: 1.2, g: 0.09, bright: 0.5, lp: 3000, pan: (j - 1.5) * 0.25 }));
      A.osc(ts, { type: 'sawtooth', f: midi(60), dur: 1.0, g: 0.03, lp: 1100, a: 0.03, vib: [5, 1.5], rev: 0.3 });
      A.bell(ts, midi(96), { g: 0.05, dur: 1.6, rev: 0.5 });
    },
  });

  /* =====================================================================
     LO-FI LOOP — the study stream, ten seconds that never end: a student
     in a mustard hoodie and coral headphones writes at a desk by a rainy
     night window, nodding on every beat; the cat sleeps on the sill and
     flicks its tail, steam curls off the mug, rain streaks and beads run
     down the glass over a blurred city, fairy lights twinkle. Every motion
     is a whole number of cycles in ten seconds, so frame 0 is the frame
     after the last; a soft VHS grade sits over all of it
     ===================================================================== */
  const LF = { sky0: '#141a43', sky1: '#2a2f6c', sky2: '#6a568d', bld0: '#2f3168', bld1: '#21225a', bld2: '#16163c', win: '#ffcf7a', win2: '#a4d4ff', wall: '#2a2550', wall2: '#3b3268', frame: '#1b1731', frameL: '#2d2650', sill: '#3f3566', sillF: '#2c2449', curtain: '#5a4d8e', curtainD: '#3f3570', desk: '#6e4859', deskF: '#3f2638', deskE: '#8a5d6e', lamp: '#ffd38a', hood: '#d99b45', hoodD: '#a46d2f', hoodL: '#f4c477', hair: '#1f2142', hairL: '#4a5aa0', skin: '#f3cdb0', skinD: '#d39a86', blush: '#f08c8c', phone: '#ee6a7d', phoneD: '#b9475e', cat: '#22203a', catL: '#7d8fd0', mug: '#e8e0cf', note: '#f1ead8', rim: '#9dbcff', warm: '#ffc27a', ink: '#15132b' };
  const LF_B = 0.625; // 96 bpm: sixteen beats in the ten-second loop
  const LF_N = [700, 522];
  const LF_PANES = [[1070, 110, 1430, 375], [1452, 110, 1810, 375], [1070, 393, 1430, 660], [1452, 393, 1810, 660]];
  const per = (t, k, ph = 0) => Math.sin(TAU * (t * k / 10 + ph)); // a sine that repeats k times per loop

  function lfSetup() {
    const r = rng(2017);
    // the city through wet glass
    const city = offscreen(1920, 1080), g = city.getContext('2d');
    const sg = g.createLinearGradient(0, 100, 0, 660); sg.addColorStop(0, LF.sky0); sg.addColorStop(0.55, LF.sky1); sg.addColorStop(1, LF.sky2);
    g.fillStyle = sg; g.fillRect(1000, 60, 900, 660);
    g.fillStyle = 'rgba(160,150,210,0.08)'; for (let k = 0; k < 7; k++) { g.beginPath(); g.ellipse(1100 + r() * 700, 150 + r() * 200, 200 + r() * 200, 24 + r() * 20, 0, 0, TAU); g.fill(); }
    const blink = [];
    const row = (y0, hMin, hMax, wMin, wMax, col, wa, sz) => {
      for (let x = 1000; x < 1900;) {
        const w = wMin + r() * (wMax - wMin), h = hMin + r() * (hMax - hMin), top = y0 - h;
        g.fillStyle = col; g.fillRect(x, top, w - 4, h + 400);
        if (r() < 0.3) g.fillRect(x + w * 0.3, top - 18, w * 0.2, 18);
        for (let wy = top + 10; wy < 700; wy += sz * 2.2) for (let wx = x + 6; wx < x + w - 10; wx += sz * 1.8) {
          const q = r(); if (q > wa) continue;
          if (q < wa * 0.06 && blink.length < 18) { blink.push([wx, wy, sz, r(), 1 + Math.floor(r() * 3)]); continue; }
          g.fillStyle = r() < 0.8 ? `rgba(255,207,122,${0.5 + r() * 0.5})` : `rgba(164,212,255,${0.5 + r() * 0.4})`; g.fillRect(wx, wy, sz, sz * 1.2);
        }
        x += w;
      }
    };
    row(560, 120, 260, 60, 120, LF.bld0, 0.18, 6);
    g.fillStyle = LF.bld0; g.fillRect(1262, 150, 30, 420); g.fillRect(1274, 90, 6, 60);
    row(610, 80, 220, 90, 160, LF.bld1, 0.24, 8);
    row(660, 40, 140, 120, 220, LF.bld2, 0.3, 11);
    g.save(); g.filter = 'blur(10px)';
    for (let k = 0; k < 26; k++) { g.fillStyle = r() < 0.6 ? 'rgba(255,190,110,0.55)' : 'rgba(255,120,170,0.45)'; g.beginPath(); g.arc(1060 + r() * 780, 610 + r() * 60, 8 + r() * 16, 0, TAU); g.fill(); }
    g.restore();
    const cityB = offscreen(1920, 1080), gb = cityB.getContext('2d'); gb.filter = 'blur(2.5px)'; gb.drawImage(city, 0, 0);
    // static beads on the glass
    const beads = offscreen(1920, 1080), bd = beads.getContext('2d');
    for (let k = 0; k < 160; k++) { const x = 1070 + r() * 740, y = 110 + r() * 550, rr = 1.5 + r() * r() * 5; bd.fillStyle = 'rgba(20,20,50,0.35)'; bd.beginPath(); bd.arc(x, y + 0.6, rr, 0, TAU); bd.fill(); bd.fillStyle = 'rgba(200,215,255,0.5)'; bd.beginPath(); bd.arc(x - rr * 0.3, y - rr * 0.3, rr * 0.45, 0, TAU); bd.fill(); }
    // the back of the room: wall, poster, shelf, curtain, window frame (glass punched out), sill
    const back = offscreen(1920, 1080), b = back.getContext('2d');
    const wg = b.createLinearGradient(0, 0, 0, 760); wg.addColorStop(0, LF.wall); wg.addColorStop(1, LF.wall2); b.fillStyle = wg; b.fillRect(0, 0, 1920, 1080);
    let lg = b.createRadialGradient(330, 560, 20, 330, 560, 700); lg.addColorStop(0, 'rgba(255,190,110,0.45)'); lg.addColorStop(0.4, 'rgba(255,170,100,0.14)'); lg.addColorStop(1, 'rgba(255,170,100,0)'); b.fillStyle = lg; b.fillRect(0, 0, 1100, 1080);
    // poster: a moon over waves
    b.fillStyle = '#1e1a3a'; b.fillRect(392, 112, 196, 256); b.fillStyle = '#e9d6b4'; b.fillRect(402, 122, 176, 236);
    b.fillStyle = '#f08c8c'; b.beginPath(); b.arc(490, 200, 40, 0, TAU); b.fill();
    b.fillStyle = '#3d4f8f'; for (let k = 0; k < 3; k++) { b.beginPath(); b.moveTo(402, 280 + k * 22); for (let x = 402; x <= 578; x += 22) b.quadraticCurveTo(x + 11, 266 + k * 22, x + 22, 280 + k * 22); b.lineTo(578, 358); b.lineTo(402, 358); b.fill(); b.fillStyle = ['#3d4f8f', '#2e3d75', '#24305f'][k + 1 < 3 ? k + 1 : 2]; }
    // shelf and books
    b.fillStyle = '#4b3654'; b.fillRect(60, 420, 300, 14); b.fillStyle = 'rgba(0,0,0,0.25)'; b.fillRect(60, 434, 300, 8);
    let bx = 72; const bc = ['#e06b6b', '#e8b45e', '#6fa3c8', '#9b7fd1', '#5fae9a', '#f0d6a0', '#c85a8a'];
    for (let k = 0; k < 10; k++) { const w = 16 + r() * 14, h = 70 + r() * 40; b.fillStyle = bc[k % bc.length]; if (k === 7) { b.save(); b.translate(bx, 420); b.rotate(-0.3); b.fillRect(0, -h, w, h); b.restore(); bx += 30; continue; } b.fillRect(bx, 420 - h, w, h); b.fillStyle = 'rgba(255,255,255,0.18)'; b.fillRect(bx + 3, 420 - h + 10, w - 6, 4); bx += w + 2; }
    b.fillStyle = '#c98a5e'; b.fillRect(300, 388, 40, 32); b.fillStyle = '#5fae7a'; for (let k = 0; k < 6; k++) { b.beginPath(); b.ellipse(320 + (k - 2.5) * 9, 380 - (k % 2) * 10, 7, 20, (k - 2.5) * 0.35, 0, TAU); b.fill(); }
    // window frame with the panes cut out
    b.fillStyle = LF.frame; b.fillRect(1040, 80, 800, 612);
    b.fillStyle = LF.frameL; b.fillRect(1040, 80, 800, 6); b.fillRect(1430, 110, 22, 550); b.fillRect(1070, 375, 740, 18);
    b.globalCompositeOperation = 'destination-out'; LF_PANES.forEach(([x0, y0, x1, y1]) => b.fillRect(x0, y0, x1 - x0, y1 - y0)); b.globalCompositeOperation = 'source-over';
    // curtain on the left of the window
    b.fillStyle = LF.curtain; b.beginPath(); b.moveTo(960, 60); b.lineTo(1100, 60); b.quadraticCurveTo(1060, 330, 1090, 700); b.lineTo(980, 700); b.quadraticCurveTo(1000, 380, 960, 60); b.fill();
    b.strokeStyle = LF.curtainD; b.lineWidth = 6; [990, 1020, 1050].forEach(x => { b.beginPath(); b.moveTo(x, 70); b.quadraticCurveTo(x + 10, 380, x + 20, 690); b.stroke(); });
    b.strokeStyle = 'rgba(157,188,255,0.35)'; b.lineWidth = 3; b.beginPath(); b.moveTo(1098, 62); b.quadraticCurveTo(1058, 330, 1088, 698); b.stroke();
    b.fillStyle = '#18142c'; b.fillRect(930, 50, 960, 14);
    // sill
    b.fillStyle = LF.sill; b.fillRect(1010, 660, 860, 34); b.fillStyle = LF.sillF; b.fillRect(1010, 694, 860, 46); b.fillStyle = 'rgba(157,188,255,0.25)'; b.fillRect(1010, 660, 860, 3);
    // plant on the sill
    b.fillStyle = '#c47b56'; b.beginPath(); b.moveTo(1092, 620); b.lineTo(1150, 620); b.lineTo(1142, 662); b.lineTo(1100, 662); b.fill();
    b.fillStyle = '#4f9a74'; for (let k = 0; k < 7; k++) { b.beginPath(); b.ellipse(1121 + (k - 3) * 11, 600 - Math.abs(k - 3) * -4, 9, 26, (k - 3) * 0.33, 0, TAU); b.fill(); }
    // the front: desk, lamp, notebook, books, mug
    const front = offscreen(1920, 1080), f = front.getContext('2d');
    f.fillStyle = LF.desk; f.beginPath(); f.moveTo(0, 742); f.lineTo(1920, 742); f.lineTo(1920, 792); f.lineTo(0, 792); f.fill();
    f.fillStyle = LF.deskE; f.fillRect(0, 788, 1920, 8);
    const dg = f.createLinearGradient(0, 796, 0, 1080); dg.addColorStop(0, LF.deskF); dg.addColorStop(1, '#22142a'); f.fillStyle = dg; f.fillRect(0, 796, 1920, 284);
    f.strokeStyle = 'rgba(255,200,220,0.05)'; f.lineWidth = 2; for (let k = 0; k < 14; k++) { const y = 812 + k * 19 + r() * 6; f.beginPath(); f.moveTo(0, y); for (let x = 0; x <= 1920; x += 120) f.lineTo(x, y + Math.sin(x * 0.004 + k) * 3); f.stroke(); }
    [[120, 840, 520, 120], [1300, 840, 520, 120]].forEach(([x, y, w, h]) => {
      f.fillStyle = 'rgba(0,0,0,0.18)'; rrect(f, x, y, w, h, 8); f.fill();
      f.strokeStyle = 'rgba(255,190,210,0.12)'; f.lineWidth = 2; rrect(f, x, y, w, h, 8); f.stroke();
      f.fillStyle = '#c9a0b4'; rrect(f, x + w / 2 - 50, y + h / 2 - 7, 100, 14, 7); f.fill();
      f.fillStyle = 'rgba(255,255,255,0.25)'; rrect(f, x + w / 2 - 46, y + h / 2 - 6, 92, 4, 2); f.fill();
    });
    f.fillStyle = '#f2d06b'; f.save(); f.translate(1640, 880); f.rotate(0.06); f.fillRect(-46, -40, 92, 86); f.fillStyle = 'rgba(0,0,0,0.12)'; f.fillRect(-46, 38, 92, 8); f.restore();
    f.strokeStyle = 'rgba(80,60,120,0.6)'; f.lineWidth = 3; f.save(); f.translate(1640, 880); f.rotate(0.06); [-18, -2, 14].forEach(y => { f.beginPath(); f.moveTo(-30, y); f.lineTo(26 - (y > 10 ? 20 : 0), y); f.stroke(); }); f.restore();
    lg = f.createRadialGradient(470, 770, 10, 470, 770, 520); lg.addColorStop(0, 'rgba(255,200,120,0.55)'); lg.addColorStop(0.5, 'rgba(255,180,110,0.15)'); lg.addColorStop(1, 'rgba(255,180,110,0)'); f.fillStyle = lg; f.fillRect(0, 742, 1100, 54);
    // lamp
    f.fillStyle = '#2b2445'; f.beginPath(); f.ellipse(230, 768, 70, 14, 0, 0, TAU); f.fill();
    f.strokeStyle = '#3a3160'; f.lineWidth = 12; f.lineCap = 'round'; f.beginPath(); f.moveTo(230, 760); f.lineTo(180, 560); f.lineTo(330, 470); f.stroke();
    f.fillStyle = '#3a3160'; f.beginPath(); f.moveTo(300, 440); f.lineTo(410, 470); f.lineTo(440, 560); f.lineTo(330, 520); f.closePath(); f.fill();
    f.fillStyle = 'rgba(255,211,138,0.95)'; f.beginPath(); f.ellipse(388, 542, 58, 18, 0.33, 0, TAU); f.fill();
    f.fillStyle = 'rgba(255,210,140,0.08)'; f.beginPath(); f.moveTo(340, 525); f.lineTo(440, 560); f.lineTo(820, 742); f.lineTo(200, 742); f.fill();
    // notebook pages
    f.fillStyle = '#d8cfbd'; f.beginPath(); f.moveTo(870, 752); f.lineTo(1080, 750); f.lineTo(1094, 782); f.lineTo(858, 786); f.fill();
    f.fillStyle = LF.note; f.beginPath(); f.moveTo(872, 748); f.lineTo(1078, 746); f.lineTo(1090, 777); f.lineTo(862, 781); f.fill();
    f.strokeStyle = 'rgba(110,120,190,0.45)'; f.lineWidth = 1.5; for (let k = 1; k < 5; k++) { const y = 748 + k * 6.5; f.beginPath(); f.moveTo(872 - k * 2, y); f.lineTo(1078 + k * 2.4, y - 1); f.stroke(); }
    f.strokeStyle = 'rgba(40,40,80,0.55)'; f.lineWidth = 1.6; for (let k = 1; k < 4; k++) { const y = 748 + k * 6.5 - 2; f.beginPath(); f.moveTo(890, y); for (let x = 890; x < 1000 - k * 20; x += 6) f.lineTo(x + 6, y + (hash(x * 0.3 + k) - 0.5) * 3); f.stroke(); }
    // books stacked on the right, a mug in front of them
    [[1300, 700, 200, 22, '#6fa3c8'], [1310, 678, 180, 22, '#e8b45e'], [1294, 660, 196, 18, '#c85a8a']].forEach(([x, y, w, h, col]) => { f.fillStyle = col; f.fillRect(x, y, w, h); f.fillStyle = 'rgba(255,255,255,0.75)'; f.fillRect(x + w - 6, y + 3, 4, h - 6); f.fillStyle = 'rgba(0,0,0,0.25)'; f.fillRect(x, y + h - 3, w, 3); });
    f.fillStyle = '#e06b6b'; f.fillRect(1280, 722, 240, 24); f.fillStyle = 'rgba(0,0,0,0.25)'; f.fillRect(1280, 743, 240, 3);
    f.fillStyle = LF.mug; f.fillRect(1104, 690, 66, 62); f.beginPath(); f.ellipse(1137, 752, 33, 8, 0, 0, PI); f.fill();
    f.strokeStyle = LF.mug; f.lineWidth = 9; f.beginPath(); f.arc(1172, 718, 15, -PI / 2, PI / 2); f.stroke();
    f.fillStyle = '#ee6a7d'; f.fillRect(1104, 708, 66, 10);
    f.fillStyle = '#5a3b2e'; f.beginPath(); f.ellipse(1137, 690, 33, 7, 0, 0, TAU); f.fill();
    f.fillStyle = 'rgba(0,0,0,0.18)'; f.fillRect(1148, 690, 22, 62);
    f.fillStyle = 'rgba(255,200,130,0.25)'; f.fillRect(1104, 690, 6, 62);
    return { city: cityB, beads, back, front, blink, buf: offscreen(1920, 1080), scan: scanTile(3, 0.07) };
  }
  function lfRain(c, t) {
    c.save(); c.beginPath(); LF_PANES.forEach(([x0, y0, x1, y1]) => c.rect(x0, y0, x1 - x0, y1 - y0)); c.clip();
    c.lineCap = 'round';
    for (let k = 0; k < 170; k++) {
      const x0 = 1040 + hash(k * 1.31) * 820, ph = hash(k * 7.7), cyc = 9 + Math.floor(hash(k * 3.1) * 5), len = 26 + hash(k * 5.3) * 40;
      const u = (ph + (t * cyc) / 10) % 1, y = 60 + u * 680, x = x0 - u * 50;
      c.strokeStyle = `rgba(190,205,255,${0.12 + 0.2 * hash(k * 2.9)})`; c.lineWidth = 1 + hash(k * 4.1);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + len * 0.07, y - len); c.stroke();
    }
    // beads that grow heavy and run
    for (let k = 0; k < 12; k++) {
      const x0 = 1080 + hash(k * 9.7) * 720, ph = hash(k * 4.4), cyc = 1 + (k % 2), u = (ph + (t * cyc) / 10) % 1;
      const y = 100 + E.inQ(u) * 600, x = x0 + Math.sin(u * 9 + k) * 4;
      c.strokeStyle = 'rgba(190,205,255,0.16)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x0, Math.max(100, y - 140 * u)); c.stroke();
      c.fillStyle = 'rgba(20,20,50,0.45)'; c.beginPath(); c.arc(x, y + 1, 5, 0, TAU); c.fill();
      c.fillStyle = 'rgba(215,225,255,0.65)'; c.beginPath(); c.arc(x - 1.5, y - 1.5, 2.2, 0, TAU); c.fill();
    }
    c.restore();
  }
  function lfCat(c, t) {
    const sw = per(t, 4), tw = Math.max(0, Math.exp(-(((t - 3.3) / 0.09) ** 2)), Math.exp(-(((t - 8.05) / 0.09) ** 2)));
    // tail curls along the front of the sill, the tip flicking
    c.lineCap = 'round'; c.strokeStyle = LF.cat; c.lineWidth = 20;
    c.beginPath(); c.moveTo(1700, 646); c.bezierCurveTo(1760, 660, 1752, 684, 1700, 686); c.quadraticCurveTo(1660, 688, 1640 + sw * 6, 678 - sw * 14 - 6); c.stroke();
    c.fillStyle = LF.cat;
    c.beginPath(); c.ellipse(1628, 630, 98, 44, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(1540, 626, 44, 38, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(1508, 608); c.lineTo(1504, 568); c.lineTo(1534, 594); c.fill();
    c.save(); c.translate(1556, 596); c.rotate(-0.25 * tw); c.beginPath(); c.moveTo(-10, 4); c.lineTo(12, -32); c.lineTo(20, 8); c.fill(); c.restore();
    c.beginPath(); c.ellipse(1560, 664, 22, 9, 0, 0, TAU); c.fill();
    // window rim light along the top of the fur
    c.strokeStyle = LF.catL; c.lineWidth = 3.5; c.globalAlpha = 0.8;
    c.beginPath(); c.ellipse(1628, 630, 98, 44, 0, PI * 1.08, PI * 1.92); c.stroke();
    c.beginPath(); c.ellipse(1540, 626, 44, 38, 0, PI * 1.15, PI * 1.6); c.stroke();
    c.beginPath(); c.moveTo(1506, 600); c.lineTo(1504, 570); c.stroke();
    c.globalAlpha = 1;
    c.fillStyle = 'rgba(240,140,160,0.5)'; c.beginPath(); c.moveTo(1512, 600); c.lineTo(1510, 580); c.lineTo(1526, 596); c.fill();
    c.strokeStyle = '#8f8fc0'; c.lineWidth = 2.5; c.lineCap = 'round';
    [[1522, 628], [1550, 630]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y - 4, 7, PI * 0.2, PI * 0.8); c.stroke(); });
    c.fillStyle = '#f08ca0'; c.beginPath(); c.arc(1530, 642, 3, 0, TAU); c.fill();
  }
  function lfFairy(c, t) {
    const pts = [...Array(19)].map((_, i) => { const u = i / 18; return [lerp(30, 960, u), lerp(46, 66, u) + 80 * 4 * u * (1 - u)]; });
    c.strokeStyle = '#141028'; c.lineWidth = 2; c.beginPath(); sOpen(c, pts); c.stroke();
    const cols = ['255,200,120', '255,150,170', '170,220,255', '255,230,150'];
    c.save(); c.globalCompositeOperation = 'lighter';
    pts.forEach(([x, y], i) => {
      if (i === 0 || i === 18) return;
      const a = 0.55 + 0.45 * per(t, 2 + (i % 4), hash(i * 3.7)), col = cols[i % 4];
      const g = c.createRadialGradient(x, y + 8, 1, x, y + 8, 34); g.addColorStop(0, `rgba(${col},${0.55 * a})`); g.addColorStop(1, `rgba(${col},0)`);
      c.fillStyle = g; c.fillRect(x - 34, y - 26, 68, 68);
      c.fillStyle = `rgba(${col},${0.6 + 0.4 * a})`; c.beginPath(); c.ellipse(x, y + 8, 4, 6, 0, 0, TAU); c.fill();
    });
    c.restore();
  }
  function lfBody(c) {
    c.save();
    c.beginPath(); c.moveTo(520, 1000); c.bezierCurveTo(492, 830, 512, 640, 604, 566); c.quadraticCurveTo(656, 520, 724, 524); c.quadraticCurveTo(806, 540, 852, 624); c.lineTo(884, 800); c.lineTo(540, 1000); c.closePath();
    c.fillStyle = LF.hood; c.fill(); c.clip();
    const g = c.createLinearGradient(560, 0, 880, 0); g.addColorStop(0, 'rgba(255,200,120,0.35)'); g.addColorStop(0.45, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(60,50,140,0.45)');
    c.fillStyle = g; c.fillRect(480, 500, 420, 520);
    c.restore();
    c.strokeStyle = LF.warm; c.lineWidth = 5; c.globalAlpha = 0.8;
    c.beginPath(); c.moveTo(522, 990); c.bezierCurveTo(494, 830, 514, 642, 606, 568); c.stroke(); c.globalAlpha = 1;
    // hood bunched behind the neck
    c.fillStyle = LF.hoodD; c.beginPath(); c.ellipse(628, 548, 74, 36, -0.45, 0, TAU); c.fill();
    c.fillStyle = LF.hood; c.beginPath(); c.ellipse(622, 540, 60, 22, -0.45, PI, TAU); c.fill();
    c.strokeStyle = LF.warm; c.lineWidth = 3; c.globalAlpha = 0.7; c.beginPath(); c.ellipse(628, 548, 74, 36, -0.45, PI * 0.95, PI * 1.45); c.stroke(); c.globalAlpha = 1;
    // drawstrings
    c.strokeStyle = '#f3e6cf'; c.lineWidth = 3; [[772, 566, 786, 650], [790, 572, 808, 640]].forEach(([x0, y0, x1, y1]) => { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + 4, (y0 + y1) / 2, x1, y1); c.stroke(); });
  }
  function lfHead(c, t) {
    const nod = Math.sin((PI * t) / LF_B) ** 2, tilt = 0.2 + 0.045 * nod, br = 2 * per(t, 2);
    c.save(); c.translate(LF_N[0], LF_N[1] + br); c.rotate(tilt);
    // neck
    c.fillStyle = LF.skinD; c.beginPath(); c.moveTo(-14, 10); c.lineTo(-4, -40); c.lineTo(40, -30); c.lineTo(44, 24); c.closePath(); c.fill();
    // face and skull
    const face = [[-30, 5], [-60, -40], [-82, -110], [-62, -190], [5, -212], [70, -192], [94, -152], [97, -124], [101, -108], [114, -88], [106, -79], [101, -73], [105, -65], [100, -58], [102, -52], [95, -40], [86, -29], [62, -19], [40, -16], [20, 0], [10, 28], [-30, 30]];
    c.fillStyle = LF.skin; c.beginPath(); sPath(c, face); c.fill();
    c.save(); c.beginPath(); sPath(c, face); c.clip();
    c.fillStyle = 'rgba(200,120,110,0.25)'; c.beginPath(); c.ellipse(30, -40, 60, 30, 0.3, 0, TAU); c.fill();
    c.restore();
    // cool window rim down the profile
    c.strokeStyle = LF.rim; c.lineWidth = 3; c.globalAlpha = 0.75; c.beginPath(); sOpen(c, face.slice(6, 18)); c.stroke(); c.globalAlpha = 1;
    // eye (downcast, lashes), brow, blush, mouth
    c.strokeStyle = LF.ink; c.lineCap = 'round'; c.lineWidth = 4.5;
    c.beginPath(); c.moveTo(64, -114); c.quadraticCurveTo(78, -104, 92, -112); c.stroke();
    c.lineWidth = 3; c.beginPath(); c.moveTo(92, -112); c.lineTo(100, -118); c.stroke();
    c.beginPath(); c.moveTo(70, -108); c.lineTo(66, -100); c.moveTo(78, -106); c.lineTo(76, -98); c.stroke();
    c.strokeStyle = LF.hair; c.lineWidth = 3.5; c.beginPath(); c.moveTo(68, -140); c.quadraticCurveTo(82, -144, 96, -136); c.stroke();
    c.fillStyle = 'rgba(240,140,140,0.5)'; c.beginPath(); c.ellipse(70, -84, 17, 8, 0.1, 0, TAU); c.fill();
    c.strokeStyle = '#b8645e'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(94, -57); c.lineTo(100, -57); c.stroke();
    // hair: a short bob, bangs to the brow, a lock in front of the ear
    const hair = [[-42, 12], [-88, -40], [-104, -122], [-82, -198], [-20, -236], [52, -228], [98, -192], [112, -150], [106, -126], [94, -142], [92, -122], [78, -146], [60, -152], [30, -150], [18, -132], [28, -64], [12, -88], [-4, -64], [-18, -24]];
    c.fillStyle = LF.hair; c.beginPath(); sPath(c, hair); c.fill();
    c.save(); c.beginPath(); sPath(c, hair); c.clip();
    c.strokeStyle = LF.hairL; c.lineWidth = 12; c.globalAlpha = 0.55; c.beginPath(); c.arc(4, -110, 110, PI * 1.22, PI * 1.62); c.stroke();
    c.lineWidth = 4; c.globalAlpha = 0.4; c.beginPath(); c.arc(4, -110, 96, PI * 1.25, PI * 1.5); c.stroke();
    c.globalAlpha = 1; c.restore();
    c.strokeStyle = LF.warm; c.lineWidth = 4; c.globalAlpha = 0.65; c.beginPath(); sOpen(c, [[-60, -20], [-92, -60], [-104, -122], [-84, -196], [-30, -232]]); c.stroke(); c.globalAlpha = 1;
    // a star clip in the hair
    c.fillStyle = '#ffd46b'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -PI / 2 + (k * PI) / 5, rr = k % 2 ? 6 : 14; c.lineTo(52 + Math.cos(a) * rr, -176 + Math.sin(a) * rr); } c.fill();
    // headphones
    c.strokeStyle = LF.phoneD; c.lineWidth = 17; c.lineCap = 'round'; c.beginPath(); c.moveTo(-6, -150); c.quadraticCurveTo(-10, -204, -22, -220); c.stroke();
    c.strokeStyle = LF.phone; c.lineWidth = 9; c.beginPath(); c.moveTo(-4, -152); c.quadraticCurveTo(-8, -204, -20, -220); c.stroke();
    c.fillStyle = LF.phoneD; c.beginPath(); c.ellipse(-8, -108, 38, 48, -0.1, 0, TAU); c.fill();
    c.fillStyle = LF.phone; c.beginPath(); c.ellipse(-4, -110, 32, 42, -0.1, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(-12, -128, 10, 16, -0.4, 0, TAU); c.fill();
    c.fillStyle = LF.phoneD; c.beginPath(); c.ellipse(2, -106, 14, 20, -0.1, 0, TAU); c.fill();
    c.strokeStyle = LF.warm; c.lineWidth = 3; c.globalAlpha = 0.6; c.beginPath(); c.ellipse(-8, -108, 38, 48, -0.1, PI * 0.7, PI * 1.3); c.stroke(); c.globalAlpha = 1;
    c.restore();
  }
  function lfArm(c, t) {
    const hx = 6 * per(t, 20), hy = 2 * per(t, 40, 0.25);
    c.lineCap = 'round';
    // upper arm from the shoulder to the elbow on the desk, then forearm to the hand
    c.strokeStyle = LF.hoodD; c.lineWidth = 66; c.beginPath(); c.moveTo(744, 600); c.quadraticCurveTo(790, 690, 820, 748); c.stroke();
    c.strokeStyle = LF.hood; c.lineWidth = 58; c.beginPath(); c.moveTo(744, 598); c.quadraticCurveTo(788, 688, 818, 744); c.stroke();
    c.strokeStyle = LF.hood; c.lineWidth = 50; c.beginPath(); c.moveTo(818, 748); c.lineTo(920 + hx * 0.5, 758 + hy); c.stroke();
    c.strokeStyle = 'rgba(80,60,150,0.35)'; c.lineWidth = 10; c.beginPath(); c.moveTo(800, 772); c.lineTo(920 + hx * 0.5, 780 + hy); c.stroke();
    c.strokeStyle = LF.hoodL; c.lineWidth = 4; c.globalAlpha = 0.8; c.beginPath(); c.moveTo(722, 586); c.quadraticCurveTo(770, 660, 800, 722); c.stroke(); c.globalAlpha = 1;
    // cuff, hand and pencil
    c.fillStyle = LF.hoodD; c.beginPath(); c.ellipse(934 + hx * 0.6, 758 + hy, 14, 24, 0, 0, TAU); c.fill();
    const px = 960 + hx, py = 764 + hy;
    c.strokeStyle = '#f1c453'; c.lineWidth = 7; c.beginPath(); c.moveTo(px + 6, py + 12); c.lineTo(px - 22, py - 46); c.stroke();
    c.strokeStyle = '#ee6a7d'; c.lineWidth = 7; c.beginPath(); c.moveTo(px - 20, py - 42); c.lineTo(px - 25, py - 52); c.stroke();
    c.strokeStyle = '#3a3048'; c.lineWidth = 3; c.beginPath(); c.moveTo(px + 6, py + 12); c.lineTo(px + 9, py + 17); c.stroke();
    c.fillStyle = LF.skin; c.beginPath(); c.ellipse(px - 4, py + 2, 22, 16, 0.3, 0, TAU); c.fill();
    c.fillStyle = LF.skinD; c.beginPath(); c.ellipse(px + 8, py + 8, 8, 6, 0.4, 0, TAU); c.fill();
  }
  function lfSteam(c, t) {
    c.save(); c.filter = 'blur(5px)'; c.lineCap = 'round';
    [[1122, 0], [1138, 0.33], [1154, 0.66]].forEach(([x0, ph], i) => {
      const pts = [];
      for (let k = 0; k <= 14; k++) { const u = k / 14, y = 684 - u * 190; pts.push([x0 + (4 + u * 22) * Math.sin(u * 5.5 - TAU * (t * 4 / 10 + ph)) + u * 10 * per(t, 1, ph), y]); }
      const g = c.createLinearGradient(0, 684, 0, 494); g.addColorStop(0, 'rgba(255,245,235,0.0)'); g.addColorStop(0.12, 'rgba(255,245,235,0.5)'); g.addColorStop(1, 'rgba(255,245,235,0)');
      c.strokeStyle = g; c.lineWidth = 9 - i * 1.5; c.beginPath(); sOpen(c, pts); c.stroke();
    });
    c.restore();
  }
  function lfOverlay(c, t) {
    c.fillStyle = 'rgba(12,8,30,0.5)'; rrect(c, 60, 968, 600, 62, 31); c.fill();
    const pulse = 0.65 + 0.35 * per(t, 8);
    c.fillStyle = `rgba(240,80,90,${pulse})`; c.beginPath(); c.arc(96, 999, 9, 0, TAU); c.fill();
    text(c, 'LIVE', 116, 1008, { font: 'Nunito, sans-serif', weight: 800, size: 26, color: '#f4ecff', ls: 2 });
    text(c, 'late-night beats to study & relax to', 192, 1008, { font: 'Nunito, sans-serif', weight: 600, size: 26, color: 'rgba(244,236,255,0.85)' });
    // a tiny level meter riding the beat
    for (let k = 0; k < 5; k++) { const h = 8 + 18 * Math.abs(Math.sin(PI * t / LF_B * (k % 2 ? 1 : 2) + k)); c.fillStyle = 'rgba(244,236,255,0.6)'; c.fillRect(1820 + k * 10, 60 - h, 6, h); }
  }

  MG.film({
    id: 'lofi', dur: 10, poster: 4.7,
    fonts: [['800 26px Nunito', 'LIVE'], ['600 26px Nunito', 'late-night beats to study & relax to']],
    meta: {
      family: 'C', name: 'Lo-fi Loop', sub: 'Beats to Study To', era: '2017 —',
      origin: 'The “lofi hip hop radio – beats to relax/study to” livestreams turned a few seconds of anime-style animation into a round-the-clock seamless loop: a student writing by a window at night while dusty, swung hip-hop plays. ChilledCow (later Lofi Girl) first looped Shizuku from Studio Ghibli’s Whisper of the Heart (1995), then commissioned an original studying girl drawn by Juan Pablo Machado; the sound descends from J Dilla’s Donuts and Nujabes’s work on Samurai Champloo.',
      works: 'lofi hip hop radio – beats to relax/study to (ChilledCow / Lofi Girl, YouTube, 2017–) · Samurai Champloo soundtrack (Nujabes, Fat Jon, Force of Nature, Tsutchie, 2004) · Donuts (J Dilla, 2006) · Whisper of the Heart (Yoshifumi Kondō, Studio Ghibli, 1995)',
      tech: ['Seamless loop, whole-number cycles', 'Lamp & window rim lights on cels', 'VHS-soft blur, lifted blacks, grain'],
      accent: '#ee6a7d',
      motionDNA: 'Almost nothing moves and everything breathes: a nod on every beat, a pencil hand scribbling, steam curling off the mug, rain sliding down the glass, a sleeping cat flicking its tail, city windows blinking — each a whole number of cycles in the loop, so the last frame runs straight into the first.',
      visualDNA: 'An indigo night room split between a warm desk lamp and a cold rainy window, flat anime cel colour with soft gradients, warm and blue rim lights on hair, hoodie and fur, fairy lights and blurred city bokeh, all under a soft VHS grade with purple-lifted blacks, scanlines and grain.',
      transitions: 'None: one endless shot; the last frame cuts back to the first',
      implementation: ['Hand-drawn loop (Photoshop, Clip Studio, TVPaint)', 'After Effects loopOut() expressions', '24/7 YouTube livestream', 'Canvas 2D'],
      reproducibility: 'Fully procedural (an original character; scene, loop and grade generated in code)',
      loopable: true,
    },
    setup: lfSetup,
    draw(c, t, W, H, st) {
      const b = st.buf.getContext('2d');
      b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over'; b.filter = 'none';
      b.fillStyle = LF.sky0; b.fillRect(0, 0, 1920, 1080);
      b.drawImage(st.city, 0, 0);
      // blinking city windows and the tower's aircraft light
      st.blink.forEach(([x, y, sz, ph, k]) => { if (per(t, k, ph) > -0.2) { b.fillStyle = 'rgba(255,207,122,0.85)'; b.fillRect(x, y, sz, sz * 1.2); } });
      const red = Math.max(0, per(t, 8)) ** 3; b.fillStyle = `rgba(255,70,70,${0.25 + 0.75 * red})`; b.beginPath(); b.arc(1277, 88, 4 + 3 * red, 0, TAU); b.fill();
      lfRain(b, t);
      b.drawImage(st.beads, 0, 0);
      b.save(); b.globalCompositeOperation = 'screen';
      const gl = b.createRadialGradient(1160, 470, 10, 1160, 470, 260); gl.addColorStop(0, 'rgba(255,190,120,0.12)'); gl.addColorStop(1, 'rgba(255,190,120,0)'); b.fillStyle = gl; b.fillRect(900, 200, 520, 520);
      b.restore();
      b.drawImage(st.back, 0, 0);
      lfCat(b, t);
      lfFairy(b, t);
      lfBody(b);
      lfHead(b, t);
      b.drawImage(st.front, 0, 0);
      lfArm(b, t);
      lfSteam(b, t);
      // VHS-soft: a little blur, a faint right ghost, purple-lifted blacks, scanlines, grain
      c.save(); c.filter = 'blur(1.2px)'; c.drawImage(st.buf, 0, 0, W, H); c.restore();
      c.save(); c.globalAlpha = 0.1; c.globalCompositeOperation = 'screen'; c.drawImage(st.buf, 5, 0, W, H); c.restore();
      c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = 'rgb(34,20,58)'; c.fillRect(0, 0, W, H); c.restore();
      const tb = ((t / 10) % 1) * 1300 - 110;
      c.fillStyle = 'rgba(255,255,255,0.025)'; c.fillRect(0, tb, W, 30);
      c.fillStyle = patOf(c, st.scan); c.fillRect(0, 0, W, H);
      lfOverlay(c, t);
      grain(c, W, H, t, 0.06);
      vignette(c, W, H, 0.5, '10,6,24');
    },
    score(A) {
      A.bus.gain.value = 0.72;
      const B = LF_B, S = B / 4, sw = 0.035;
      const at = (bar, k) => bar * 4 * B + k * S + (k % 2 ? sw : 0);
      // vinyl: steady hiss, a bed of soft rain and scattered crackle
      A.noise(0, { type: 'bandpass', f: 4200, q: 0.5, dur: 10, g: 0.012, hold: true, a: 0.002 });
      A.noise(0, { type: 'lowpass', f: 1300, q: 0.4, dur: 10, g: 0.022, hold: true, a: 0.002 });
      for (let i = 0; i < 260; i++) { const t = hash(i * 1.913) * 9.95, big = hash(i * 7.1) > 0.93; A.noise(t, { type: 'highpass', f: 2200 + hash(i * 3.3) * 4000, dur: big ? 0.012 : 0.004, g: big ? 0.07 : 0.012 + hash(i * 5.5) * 0.03, pan: (hash(i * 2.2) - 0.5) * 0.8 }); }
      // swung, dusty drums
      for (let bar = 0; bar < 4; bar++) {
        [0, 7, 10].forEach(k => A.kick(at(bar, k), k ? 0.4 : 0.52, { f: 115, f2: 44, dur: 0.36 }));
        [4, 12].forEach(k => { const t = at(bar, k) + 0.014; A.noise(t, { type: 'bandpass', f: 1450, q: 0.8, dur: 0.17, g: 0.15, rev: 0.25 }); A.osc(t, { type: 'triangle', f: 185, f2: 140, dur: 0.09, g: 0.06 }); });
        if (bar % 2) A.noise(at(bar, 15), { type: 'bandpass', f: 1600, q: 0.8, dur: 0.08, g: 0.04 });
        for (let k = 0; k < 16; k += 2) A.hat(at(bar, k), k % 4 ? 0.02 : 0.032, false, { f: 6500, pan: 0.2 });
        [3, 11].forEach(k => A.hat(at(bar, k), 0.012, false, { f: 7500, pan: -0.2 }));
        if (bar === 3) A.hat(at(bar, 14), 0.02, true, { f: 6000 });
      }
      // warm Rhodes: sine body, a short tine, a slow tremolo wobble
      const rhodes = (t, m, d, g) => { const f = midi(m); A.osc(t, { type: 'sine', f, dur: d, g, a: 0.008, vib: [4.2, f * 0.003], rev: 0.28 }); A.osc(t, { type: 'triangle', f: f * 2, dur: Math.min(0.45, d), g: g * 0.16, a: 0.003, lp: 2600 }); A.osc(t, { f: f * 3.01, dur: 0.1, g: g * 0.1 }); };
      const prog = [[41, [53, 57, 60, 64, 67]], [40, [52, 55, 59, 62, 66]], [38, [50, 53, 57, 60, 64]], [43, [53, 57, 59, 64]]];
      prog.forEach(([bs, ch], bar) => {
        const t0 = at(bar, 0);
        ch.forEach((m, j) => rhodes(t0 + 0.02 + j * 0.018, m, 2.2, 0.045));
        ch.slice(-3).forEach((m, j) => rhodes(at(bar, 10) + j * 0.012, m, 0.5, 0.022));
        A.osc(t0, { type: 'triangle', f: midi(bs), dur: 1.3, g: 0.2, lp: 320, a: 0.01 });
        A.osc(at(bar, 10), { type: 'triangle', f: midi(bs), dur: 0.5, g: 0.14, lp: 320, a: 0.01 });
        A.osc(at(bar, 14), { type: 'triangle', f: midi(bs + 7), dur: 0.2, g: 0.09, lp: 320, a: 0.01 });
      });
      // a sparse, breathy lead
      [[1, 6, 76, 0.3], [1, 8, 74, 0.3], [1, 10, 71, 0.7], [3, 4, 72, 0.3], [3, 6, 74, 0.3], [3, 8, 76, 0.5], [3, 12, 79, 0.6]].forEach(([bar, k, m, d]) =>
        A.osc(at(bar, k), { type: 'triangle', f: midi(m), dur: d, g: 0.035, a: 0.03, lp: 1800, vib: [5, 3], rev: 0.45, hold: true, rel: 0.12 }));
    },
  });

  /* =====================================================================
     LIMINAL SPACES — a camcorder drifts down a mono-yellow corridor:
     striped wallpaper with water stains, damp carpet, a drop ceiling of
     buzzing tubes, one of which dims twice. A side passage stands dark;
     the camera turns lazily right and the corridor opens into a vast hall
     of pillars and fluorescent panels receding into haze. Nothing
     happens. The OSD ticks, the camcorder titler types the name
     ===================================================================== */
  const LM_C = { wall: [206, 180, 88], base: [100, 76, 34], floor: [150, 124, 70], ceil: [214, 200, 140], fog: [46, 39, 16], panel: [255, 250, 222] };
  const LM_H = 2.7, LM_FOC = 1000, LM_NEAR = 0.06;
  const LM_FLK = [2.35, 2.62, 5.9, 6.18];
  const lmPillar = (i, j) => i >= 10 && i <= 22 && (i - 10) % 4 === 0 && j >= 12 && j <= 28 && (j - 12) % 4 === 0;
  const lmFloor = (i, j) => (i >= 5 && i <= 6 && j >= 0 && j <= 15) || (j === 3 && i >= 7 && i <= 8) || (j >= 6 && j <= 7 && i >= 1 && i <= 4) || (i >= 1 && i <= 2 && j >= 6 && j <= 14) || (i >= 7 && i <= 26 && j >= 9 && j <= 30 && !lmPillar(i, j));
  const lmFlick = t => LM_FLK.reduce((m, c0) => Math.max(m, Math.exp(-(((t - c0) / 0.045) ** 2))), 0);

  function lmSetup() {
    const L = [];
    [2, 5, 8, 11, 14].forEach(z => L.push({ x: 6, z, on: 1, fl: z === 8, rot: 0 }));
    for (let a = 0; a < 7; a++) for (let b = 0; b < 7; b++) { const x = 8.5 + a * 3, z = 10.5 + b * 3; L.push({ x, z, on: hash(a * 17.3 + b * 5.1) < 0.16 ? 0 : 1, fl: false, rot: 0 }); }
    L.push({ x: 2, z: 10, on: 0, fl: false, rot: 0 }, { x: 3, z: 7, on: 0, fl: false, rot: 1 });
    // light at a point (and, for walls, only from the side the face looks into): static part + the flickering tube's share
    const lit = (x, y, z, nx = 0, nz = 0) => {
      let b0 = 0.1, bf = 0;
      L.forEach(l => { if (!l.on) return; const dx = l.x - x, dy = LM_H - 0.02 - y, dz = l.z - z; if ((nx || nz) && dx * nx + dz * nz < 0.05) return; const v = 1 / (1 + 0.26 * (dx * dx + dy * dy + dz * dz)); if (l.fl) bf += v; else b0 += v; });
      return [b0, bf];
    };
    const F = [], C = [], Wl = [];
    for (let i = 0; i < 29; i++) for (let j = 0; j < 32; j++) {
      if (!lmFloor(i, j)) continue;
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
        const x0 = i + a / 2, z0 = j + b / 2, cx = x0 + 0.25, cz = z0 + 0.25, h = hash(x0 * 13.1 + z0 * 7.7);
        F.push({ p: [[x0, 0, z0], [x0 + 0.5, 0, z0], [x0 + 0.5, 0, z0 + 0.5], [x0, 0, z0 + 0.5]], c: [cx, 0, cz], b: lit(cx, 0, cz), v: (h < 0.05 ? 0.88 : 0.97 + 0.04 * hash(h * 91)) });
        C.push({ p: [[x0, LM_H, z0], [x0, LM_H, z0 + 0.5], [x0 + 0.5, LM_H, z0 + 0.5], [x0 + 0.5, LM_H, z0]], c: [cx, LM_H, cz], b: lit(cx, LM_H - 0.6, cz), v: 0.95 + 0.06 * hash(h * 37) });
      }
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => {
        if (lmFloor(i + dx, j + dz)) return;
        let A, B;
        if (dx === 1) { A = [i + 1, j]; B = [i + 1, j + 1]; } else if (dx === -1) { A = [i, j + 1]; B = [i, j]; } else if (dz === 1) { A = [i + 1, j + 1]; B = [i, j + 1]; } else { A = [i, j]; B = [i + 1, j]; }
        const nx = -dx, nz = -dz, cx = (A[0] + B[0]) / 2, cz = (A[1] + B[1]) / 2, h = hash(cx * 31.7 + cz * 11.3);
        Wl.push({ A, B, n: [nx, nz], c: [cx, LM_H / 2, cz], top: lit(cx + nx * 0.05, 2.3, cz + nz * 0.05, nx, nz), bot: lit(cx + nx * 0.05, 0.3, cz + nz * 0.05, nx, nz), stain: h < 0.2 ? [0.2 + 0.6 * hash(h * 7), hash(h * 9) < 0.6 ? 0.86 + 0.1 * hash(h * 3) : 0.08 + 0.08 * hash(h * 5), 0.12 + 0.16 * hash(h * 11), 0.05 + 0.08 * hash(h * 13)] : null });
      });
    }
    return { L, F, C, Wl, buf: offscreen(1920, 1080), scan: scanTile(4, 0.09) };
  }
  function lmCam(t) {
    const z = t < 7 ? 0.7 + t : 7.7 + (t - 7) - 0.1 * (t - 7) ** 2;
    const x = 6 + 0.9 * E.inQ(seg(t, 7.5, 10)) + 0.035 * vnoise(t * 0.4, 4);
    const yaw = 1.05 * E.ioS(seg(t, 6.0, 9.8)) + 0.022 * vnoise(t * 0.45, 1) + 0.008 * vnoise(t * 1.3, 5);
    const pitch = -0.04 + 0.016 * vnoise(t * 0.5, 2) + 0.005 * Math.sin(TAU * 1.8 * t);
    const roll = 0.014 * vnoise(t * 0.37, 3) + 0.004 * Math.sin(TAU * 0.9 * t);
    const y = 1.6 + 0.014 * Math.sin(TAU * 1.8 * t + 1);
    return { x, y, z, cy: Math.cos(yaw), sy: Math.sin(yaw), cp: Math.cos(pitch), sp: Math.sin(pitch), cr: Math.cos(roll), sr: Math.sin(roll), fx: Math.sin(yaw), fz: Math.cos(yaw) };
  }
  // World → camera space (x right, y up, z forward).
  function lmXf(cm, p) {
    const dx = p[0] - cm.x, dy = p[1] - cm.y, dz = p[2] - cm.z;
    const x1 = dx * cm.cy - dz * cm.sy, z1 = dx * cm.sy + dz * cm.cy;
    const y2 = dy * cm.cp - z1 * cm.sp, z2 = dy * cm.sp + z1 * cm.cp;
    return [x1 * cm.cr - y2 * cm.sr, x1 * cm.sr + y2 * cm.cr, z2];
  }
  const lmScr = p => [960 + (LM_FOC * p[0]) / p[2], 540 - (LM_FOC * p[1]) / p[2]];
  // Clip a world polygon at the near plane and project it; null if nothing is left on screen.
  function lmPoly(cm, pts) {
    const q = pts.map(p => lmXf(cm, p)), o = [];
    for (let i = 0; i < q.length; i++) {
      const A = q[i], B = q[(i + 1) % q.length], ia = A[2] > LM_NEAR, ib = B[2] > LM_NEAR;
      if (ia) o.push(A);
      if (ia !== ib) { const u = (LM_NEAR - A[2]) / (B[2] - A[2]); o.push([lerp(A[0], B[0], u), lerp(A[1], B[1], u), LM_NEAR]); }
    }
    if (o.length < 3) return null;
    const s = o.map(lmScr);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    s.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    return x1 < -20 || x0 > 1940 || y1 < -20 || y0 > 1100 ? null : s;
  }
  function lmSeg(cm, P, Q) {
    let a = lmXf(cm, P), b = lmXf(cm, Q);
    if (a[2] <= LM_NEAR && b[2] <= LM_NEAR) return null;
    if (a[2] <= LM_NEAR) { const u = (LM_NEAR - a[2]) / (b[2] - a[2]); a = [lerp(a[0], b[0], u), lerp(a[1], b[1], u), LM_NEAR]; }
    else if (b[2] <= LM_NEAR) { const u = (LM_NEAR - b[2]) / (a[2] - b[2]); b = [lerp(b[0], a[0], u), lerp(b[1], a[1], u), LM_NEAR]; }
    return [lmScr(a), lmScr(b)];
  }
  const lmFill = (g, s) => { g.beginPath(); s.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
  // Lit colour with a soft shoulder (over-bright light flattens instead of bleaching), then haze by distance.
  const lmCol = (base, k, d) => { const f = 1 - Math.exp(-d / 11), kk = k < 0.9 ? k : 0.9 + (k - 0.9) * 0.3; return [0, 1, 2].map(i => lerp(Math.min(255, base[i] * kk), LM_C.fog[i], f)); };
  function lmScene(g, t, st) {
    const cm = lmCam(t), fl = 1 - 0.6 * lmFlick(t), ex = 1.12 * (1 - 0.05 * lmFlick(t)) * (1 + 0.03 * vnoise(t * 0.6, 9));
    const dist = c0 => Math.hypot(c0[0] - cm.x, c0[1] - cm.y, c0[2] - cm.z);
    const ahead = c0 => (c0[0] - cm.x) * cm.fx + (c0[2] - cm.z) * cm.fz > -1.2;
    g.fillStyle = rgb(LM_C.fog); g.fillRect(0, 0, 1920, 1080);
    // carpet, then ceiling tiles with their grid
    st.F.forEach(q => {
      if (!ahead(q.c)) return; const d = dist(q.c); if (d > 24) return;
      const s = lmPoly(cm, q.p); if (!s) return;
      const col = rgb(lmCol(LM_C.floor, (q.b[0] + q.b[1] * fl) * q.v * ex, d));
      lmFill(g, s); g.fillStyle = col; g.fill(); g.strokeStyle = col; g.lineWidth = 1.2; g.stroke();
    });
    st.C.forEach(q => {
      if (!ahead(q.c)) return; const d = dist(q.c); if (d > 24) return;
      const s = lmPoly(cm, q.p); if (!s) return;
      const cc = lmCol(LM_C.ceil, (q.b[0] + q.b[1] * fl) * 0.62 * q.v * ex, d);
      lmFill(g, s); g.fillStyle = rgb(cc); g.fill(); g.strokeStyle = rgb(cc.map(v => v * 0.72)); g.lineWidth = d < 8 ? 1.6 : 1; g.stroke();
    });
    // fluorescent panels and their bloom on the ceiling
    st.L.forEach(l => {
      const c0 = [l.x, LM_H, l.z]; if (!ahead(c0)) return; const d = dist(c0); if (d > 26) return;
      const hw = l.rot ? 0.6 : 0.3, hd = l.rot ? 0.3 : 0.6;
      const s = lmPoly(cm, [[l.x - hw, LM_H - 0.01, l.z - hd], [l.x - hw, LM_H - 0.01, l.z + hd], [l.x + hw, LM_H - 0.01, l.z + hd], [l.x + hw, LM_H - 0.01, l.z - hd]]); if (!s) return;
      const k = l.on ? (l.fl ? fl : 1) : 0.42;
      lmFill(g, s); g.fillStyle = rgb(lmCol(LM_C.panel, k, d * 0.6)); g.fill();
      if (!l.on) return;
      const p = lmXf(cm, c0); if (p[2] < 0.3) return;
      const [sx, sy] = lmScr(p), r = Math.min(600, 900 / p[2]);
      g.save(); g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(sx, sy, 2, sx, sy, r); gr.addColorStop(0, `rgba(255,248,210,${0.32 * k * Math.exp(-d / 16)})`); gr.addColorStop(1, 'rgba(255,248,210,0)');
      g.fillStyle = gr; g.fillRect(sx - r, sy - r, 2 * r, 2 * r); g.restore();
    });
    // walls, far to near: wallpaper with a top-to-bottom falloff, stripes, stains, a baseboard
    const vis = [];
    st.Wl.forEach(w => {
      if ((cm.x - w.c[0]) * w.n[0] + (cm.z - w.c[2]) * w.n[1] <= 0) return;
      if (!ahead(w.c)) return; const d = dist(w.c); if (d > 24) return;
      vis.push([d, w]);
    });
    vis.sort((a, b) => b[0] - a[0]);
    vis.forEach(([d, w]) => {
      const [ax, az] = w.A, [bx, bz] = w.B, P = (u, y) => [lerp(ax, bx, u), y, lerp(az, bz, u)];
      const s = lmPoly(cm, [P(0, 0), P(1, 0), P(1, LM_H), P(0, LM_H)]); if (!s) return;
      const ct = lmCol(LM_C.wall, (w.top[0] + w.top[1] * fl) * ex, d), cb = lmCol(LM_C.wall, (w.bot[0] + w.bot[1] * fl) * 0.9 * ex, d);
      const sg = lmSeg(cm, P(0.5, LM_H), P(0.5, 0));
      let fs = rgb(ct);
      if (sg) { const gr = g.createLinearGradient(sg[0][0], sg[0][1], sg[1][0], sg[1][1]); gr.addColorStop(0, rgb(ct)); gr.addColorStop(1, rgb(cb)); fs = gr; }
      lmFill(g, s); g.fillStyle = fs; g.fill(); g.strokeStyle = fs; g.lineWidth = 1.2; g.stroke();
      const fogA = Math.exp(-d / 8);
      if (w.stain) {
        const [u0, v0, ru, rv] = w.stain, pts = [...Array(14)].map((_, k) => { const a = (k / 14) * TAU, wob = 1 + 0.25 * Math.sin(a * 3 + u0 * 9); return P(u0 + Math.cos(a) * ru * wob, (v0 + Math.sin(a) * rv * wob) * LM_H); });
        const ss = lmPoly(cm, pts); if (ss) { lmFill(g, ss); g.fillStyle = `rgba(112,84,26,${0.16 * fogA + 0.03})`; g.fill(); }
        const drip = v0 > 0.5 && lmSeg(cm, P(u0, (v0 - rv) * LM_H), P(u0 + 0.01, (v0 - rv - 0.12 - 0.2 * u0) * LM_H)); if (drip) { g.strokeStyle = `rgba(112,84,26,${0.16 * fogA})`; g.lineWidth = 2; g.beginPath(); g.moveTo(drip[0][0], drip[0][1]); g.lineTo(drip[1][0], drip[1][1]); g.stroke(); }
      }
      if (d < 13) {
        g.strokeStyle = `rgba(120,98,40,${0.45 * fogA})`; g.lineWidth = 1.3; g.beginPath();
        for (let k = 1; k <= 5; k++) { const sgm = lmSeg(cm, P(k / 5, 0.12), P(k / 5, LM_H)); if (sgm) { g.moveTo(sgm[0][0], sgm[0][1]); g.lineTo(sgm[1][0], sgm[1][1]); } }
        g.stroke();
      }
      const bs = lmPoly(cm, [P(0, 0), P(1, 0), P(1, 0.12), P(0, 0.12)]);
      if (bs) { const bc = rgb(lmCol(LM_C.base, (w.bot[0] + w.bot[1] * fl) * ex, d)); lmFill(g, bs); g.fillStyle = bc; g.fill(); g.strokeStyle = bc; g.lineWidth = 1; g.stroke(); }
    });
    // haze over the far distance
    const hz = g.createLinearGradient(0, 380, 0, 700); hz.addColorStop(0, 'rgba(70,60,28,0)'); hz.addColorStop(0.5, 'rgba(70,60,28,0.16)'); hz.addColorStop(1, 'rgba(70,60,28,0)');
    g.fillStyle = hz; g.fillRect(0, 0, 1920, 1080);
  }
  function lmOSD(c, t) {
    const sec = 7 + Math.floor(t), o = { font: 'VT323, monospace', size: 64, color: '#f4f1e6', ls: 2 };
    c.save(); c.shadowColor = 'rgba(0,0,0,0.85)'; c.shadowOffsetX = 3; c.shadowOffsetY = 3; c.shadowBlur = 0;
    text(c, 'PLAY', 100, 120, o);
    c.fillStyle = '#f4f1e6'; c.beginPath(); c.moveTo(250, 80); c.lineTo(282, 100); c.lineTo(250, 120); c.closePath(); c.fill();
    text(c, 'SP', 1820, 120, { ...o, align: 'right' });
    text(c, 'JUN. 14 1996', 100, 1000, o);
    text(c, `AM 3:12:${String(sec).padStart(2, '0')}`, 1820, 1000, { ...o, align: 'right' });
    const msg = 'LIMINAL SPACES', n = Math.floor(clamp((t - 8.1) / 0.07, 0, msg.length));
    if (n > 0) {
      const cur = n < msg.length || Math.floor(t * 2) % 2 ? '_' : ' ';
      text(c, msg.slice(0, n) + (n < msg.length ? cur : ''), 960, 830, { ...o, size: 104, align: 'center', ls: 8 });
    }
    c.restore();
  }

  MG.film({
    id: 'liminal', dur: 10, poster: 9.4,
    fonts: [['400 64px VT323', 'PLAY SP JUN. 14 1996 AM 3:12:0123456789 LIMINAL SPACES_']],
    meta: {
      family: 'G', name: 'Liminal Spaces', sub: 'The Backrooms on VHS', era: '2019 —',
      origin: 'Liminal-space imagery finds unease in transitional places emptied of people — corridors, waiting rooms, closed malls, drained pools — lit as if everyone has just left. In 2019 an anonymous 4chan post paired a photo of a yellow, carpeted, fluorescent-lit room with a story about “noclipping” out of reality into the Backrooms; dreamcore image boards and Kane Pixels’ found-footage series made the slow VHS walk through it a genre, and Marc Augé’s “non-places” (1992) supplies the theory.',
      works: 'The Backrooms (anonymous 4chan /x/ post, 2019) · The Backrooms (Found Footage) (Kane Pixels, YouTube, 2022) · Non-Places (Marc Augé, 1992)',
      tech: ['Pseudo-3D grid map, painter-sorted', 'Fluorescent falloff into yellow haze', 'Camcorder drift, VHS OSD & grade'],
      accent: '#d8c46a',
      motionDNA: 'A slow, aimless handheld walk: low-frequency drift in yaw, pitch and roll over a faint step bob, then a lazy turn toward an opening; nothing approaches and nothing moves except one tube that dims twice, and the camera simply keeps going.',
      visualDNA: 'Mono-yellow wallpaper with thin stripes and water stains, damp beige carpet, a drop ceiling of buzzing fluorescent panels, flat over-bright light falling off into murky yellow haze, endless pillars — under VHS softness, ghosting, scanlines and a date-stamped OSD.',
      transitions: 'One continuous take: corridor drift → a dark side passage → a slow turn → the pillar hall opens up → camcorder titler',
      implementation: ['Blender / Unity found-footage scenes', 'Camcorder VHS capture & emulation', 'Canvas 2D'],
      reproducibility: 'Fully procedural (grid map, lighting, camera and VHS grade generated in code)',
      loopable: false,
    },
    setup: lmSetup,
    draw(c, t, W, H, st) {
      const b = st.buf.getContext('2d');
      b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over'; b.filter = 'none';
      lmScene(b, t, st);
      const f = Math.floor(t * 30);
      c.save(); c.filter = 'blur(1.4px) saturate(0.88)'; c.drawImage(st.buf, 0, 0, W, H); c.restore();
      c.save(); c.globalAlpha = 0.13; c.globalCompositeOperation = 'screen'; c.drawImage(st.buf, 7, 0, W, H); c.restore();
      // head-switching noise along the bottom edge, a slow tracking band
      c.drawImage(st.buf, 0, 1046, 1920, 34, 10 + hash(f) * 26, 1046, 1920, 34);
      c.fillStyle = `rgba(230,230,220,${0.05 + 0.05 * hash(f + 3)})`; c.fillRect(0, 1048 + hash(f + 1) * 10, W, 3);
      const tb = ((t * 0.13) % 1) * 1400 - 160; c.fillStyle = 'rgba(255,255,240,0.03)'; c.fillRect(0, tb, W, 46);
      c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = 'rgb(18,16,8)'; c.fillRect(0, 0, W, H); c.restore();
      c.fillStyle = patOf(c, st.scan); c.fillRect(0, 0, W, H);
      grain(c, W, H, t, 0.075);
      vignette(c, W, H, 0.6, '8,6,0');
      lmOSD(c, t);
    },
    score(A) {
      A.bus.gain.value = 0.8;
      // mains hum and the ballast buzz: 60 Hz and its harmonics, never stopping
      A.osc(0, { type: 'sine', f: 60, dur: 10, g: 0.08, hold: true, a: 0.5, rel: 0.4 });
      A.osc(0, { type: 'sawtooth', f: 120, dur: 10, g: 0.02, lp: 700, q: 4, hold: true, a: 0.5, rel: 0.4, vib: [0.3, 0.4] });
      A.osc(0, { type: 'square', f: 180.3, dur: 10, g: 0.006, lp: 1500, hold: true, a: 0.6, rel: 0.4 });
      A.osc(0, { type: 'sine', f: 240.6, dur: 10, g: 0.01, hold: true, a: 0.6, rel: 0.4, vib: [0.17, 0.6], pan: 0.3 });
      // room tone, air handling, tape hiss
      A.noise(0, { type: 'lowpass', f: 300, q: 0.5, dur: 10, g: 0.1, hold: true, a: 0.6, rel: 0.4 });
      A.noise(0, { type: 'bandpass', f: 180, q: 0.8, dur: 10, g: 0.05, hold: true, a: 0.6, rel: 0.4 });
      A.noise(0, { type: 'bandpass', f: 5000, q: 0.6, dur: 10, g: 0.01, hold: true, a: 0.3, rel: 0.3 });
      // the tube dims: a crackle and a lurch in the buzz
      LM_FLK.forEach(t => { A.noise(t - 0.02, { type: 'bandpass', f: 3200, q: 3, dur: 0.06, g: 0.05 }); A.osc(t - 0.02, { type: 'sawtooth', f: 120, dur: 0.12, g: 0.035, lp: 2400 }); });
      // footsteps on damp carpet, slowing as the camera stops
      for (let k = 0; ; k++) { const t = 0.35 + k * 0.56 + (k > 13 ? (k - 13) * 0.08 : 0); if (t > 9.3) break; A.noise(t, { type: 'lowpass', f: 240, dur: 0.15, g: 0.12, pan: k % 2 ? 0.1 : -0.1 }); A.osc(t, { f: 72, f2: 46, dur: 0.12, g: 0.05 }); }
      // somewhere far off, muzak leaking through the walls, detuned and drowned
      [[5.6, [57, 60, 64, 67]], [7.4, [53, 57, 60, 65]], [9.0, [55, 59, 62, 67]]].forEach(([t, ch]) => A.chord(t, ch, { type: 'triangle', dur: 2.2, g: 0.012, a: 0.6, lp: 520, vib: [0.4, 2.5], rev: 0.9, spread: 14, width: 0.6, hold: true, rel: 0.6 }));
      // a single distant thud in the building
      A.osc(4.2, { f: 55, f2: 38, dur: 0.6, g: 0.06, lp: 200, rev: 0.8 });
    },
  });
})();
