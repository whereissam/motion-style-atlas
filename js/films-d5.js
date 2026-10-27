/* Batch d5 — Film Noir (H), Sports Broadcast (J), Luxury Brand Motion (J). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Special+Elite&family=Barlow+Condensed:ital,wght@0,500;0,600;0,700;0,800;0,900;1,600;1,700;1,800;1,900&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=block');

  const setLS = (c, v) => { if ('letterSpacing' in c) c.letterSpacing = v + 'px'; };
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const decay = (t, at, k) => (t >= at ? Math.exp(-(t - at) * k) : 0);
  const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

  /* =====================================================================
     FILM NOIR — light is the actor. Office at night with a passing car
     sweeping venetian-blind shadows; a door opens on a silhouette; a
     rain-slick street under one lamp, a match, the lamp dies; "NOIR".
     ===================================================================== */
  const NP = '"Playfair Display", Georgia, serif', NT = '"Special Elite", "Courier New", monospace';
  const g8 = (v, a = 1) => { v = clamp(v, 0, 255) | 0; return `rgba(${v},${v},${v},${a})`; };
  const LM = { x: -360, y: -220, w: 2640, h: 1520, s: 0.42 };

  function blinds(ox, oy, w, h, slant, skew, n, open, I) { return { O: [ox, oy], d1: [w, w * slant], d2: [h * skew, h], n, open, I }; }
  function drawBlinds(c, P) {
    const { O, d1, d2, n, open, I } = P;
    if (I <= 0.5) return;
    const p = (a, b) => [O[0] + a * d1[0] + b * d2[0], O[1] + a * d1[1] + b * d2[1]];
    c.fillStyle = g8(I);
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const A = p(0, i / n), B = p(1, i / n), C = p(1, (i + open) / n), D = p(0, (i + open) / n);
      c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineTo(C[0], C[1]); c.lineTo(D[0], D[1]); c.closePath();
    }
    c.fill();
  }
  function blindAt(P, x, y) {
    const { O, d1, d2, n, open, I } = P;
    const dx = x - O[0], dy = y - O[1], det = d1[0] * d2[1] - d1[1] * d2[0];
    const a = (dx * d2[1] - dy * d2[0]) / det, b = (d1[0] * dy - d1[1] * dx) / det;
    if (a < 0 || a > 1 || b < 0 || b > 1) return 0;
    const f = (b * n) % 1;
    return (I / 255) * sstep(0.0, 0.06, f) * (1 - sstep(open - 0.06, open, f));
  }
  function lmBegin(st, amb) {
    const l = st.lc;
    l.setTransform(1, 0, 0, 1, 0, 0); l.filter = 'none'; l.globalAlpha = 1;
    l.globalCompositeOperation = 'source-over';
    l.fillStyle = g8(amb); l.fillRect(0, 0, st.L.width, st.L.height);
    l.setTransform(LM.s, 0, 0, LM.s, -LM.x * LM.s, -LM.y * LM.s);
    l.globalCompositeOperation = 'lighter';
    return l;
  }
  function lmApply(c, st, screen = 0.3) {
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.drawImage(st.L, LM.x, LM.y, LM.w, LM.h);
    if (screen > 0) { c.globalCompositeOperation = 'screen'; c.globalAlpha = screen; c.drawImage(st.L, LM.x, LM.y, LM.w, LM.h); }
    c.restore();
  }
  function camera(c, zoom, rot, fx, fy) { c.translate(960, 540); c.rotate(rot); c.scale(zoom, zoom); c.translate(-fx, -fy); }

  // fedora + trench-coat silhouette, feet at (0,0), height 1 (y up is negative)
  function figurePath(c, ph = 0, o = {}) {
    const sw = Math.sin(ph) * 0.1, hs = sw * 0.25;
    c.beginPath();
    // hat brim + crown
    c.moveTo(-0.15, -0.826); c.quadraticCurveTo(0, -0.848, 0.15, -0.826); c.lineTo(0.142, -0.81); c.quadraticCurveTo(0, -0.826, -0.142, -0.81); c.closePath();
    c.moveTo(-0.074, -0.83); c.lineTo(-0.064, -0.95); c.quadraticCurveTo(-0.032, -0.972, 0, -0.952); c.quadraticCurveTo(0.032, -0.972, 0.064, -0.95); c.lineTo(0.074, -0.83); c.closePath();
    // head, turned-up collar, belted coat
    c.moveTo(-0.056, -0.822); c.lineTo(0.056, -0.822); c.lineTo(0.05, -0.765); c.lineTo(0.092, -0.79); c.lineTo(0.178, -0.722);
    c.quadraticCurveTo(0.212, -0.7, 0.208, -0.64); c.lineTo(0.222, -0.46); c.lineTo(0.205, -0.43); c.lineTo(0.25 + hs, -0.27);
    c.lineTo(-0.25 + hs, -0.27); c.lineTo(-0.205, -0.43); c.lineTo(-0.222, -0.46); c.lineTo(-0.208, -0.64);
    c.quadraticCurveTo(-0.212, -0.7, -0.178, -0.722); c.lineTo(-0.092, -0.79); c.lineTo(-0.05, -0.765); c.closePath();
    // legs + shoes
    const lx = -0.055 + sw, rx = 0.055 - sw;
    c.moveTo(-0.1, -0.3); c.lineTo(-0.012, -0.3); c.lineTo(lx + 0.032, -0.018); c.lineTo(lx - 0.032, -0.018); c.closePath();
    c.moveTo(0.012, -0.3); c.lineTo(0.1, -0.3); c.lineTo(rx + 0.032, -0.018); c.lineTo(rx - 0.032, -0.018); c.closePath();
    c.ellipse(lx + 0.012, -0.012, 0.048, 0.014, 0, 0, TAU);
    c.moveTo(rx + 0.06, -0.012); c.ellipse(rx + 0.012, -0.012, 0.048, 0.014, 0, 0, TAU);
    if (o.arm) { // forearm raised to the face (match / cigarette)
      c.moveTo(0.16, -0.66); c.lineTo(0.215, -0.6); c.lineTo(0.12, -0.74); c.lineTo(0.06, -0.77); c.lineTo(0.05, -0.74); c.lineTo(0.1, -0.71); c.closePath();
    }
  }

  // procedural cigarette smoke: turbulent strands, brighter where light falls
  // procedural cigarette smoke: turbulent ribbons drawn into a side layer, optionally lit by the light map
  function smokeStrands(s, x0, y0, t, o) {
    const h = o.h || 420, amp = o.amp || 60, sc = o.sc || 1, seed = o.seed || 1, al = o.alpha ?? 1;
    if (al <= 0.01) return;
    const N = 40, K = o.k || 6;
    for (let k = 0; k < K; k++) {
      const sd = seed + k * 7.31, tt = t * (0.5 + k * 0.07);
      const P = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        const lean = (o.lean || 0) * u * u * h;
        const x = x0 + lean + amp * Math.pow(u, 1.2) * (vnoise(u * 2.4 - tt, sd) + 0.6 * vnoise(u * 5.7 - tt * 1.6, sd + 3)) +
          Math.sin(u * 8.5 + tt * 2.1 + k * 1.3) * u * u * amp * 0.55 + (k - K / 2) * u * 9 * sc;
        const y = y0 - u * h + vnoise(u * 3.5 + tt, sd + 9) * 18 * u * sc;
        P.push([x, y]);
      }
      // ribbon polygon, alpha fading with height
      const wv = u => (2 + u * (o.spread || 54)) * sc * (0.6 + 0.4 * hash(k + seed));
      const L = [], R = [];
      for (let i = 0; i <= N; i++) {
        const a = P[Math.max(0, i - 1)], b = P[Math.min(N, i + 1)];
        let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
        const w = wv(i / N) / 2;
        L.push([P[i][0] + nx * w, P[i][1] + ny * w]); R.push([P[i][0] - nx * w, P[i][1] - ny * w]);
      }
      const g = s.createLinearGradient(0, y0, 0, y0 - h);
      const A = al * (0.22 + 0.1 * hash(k * 3 + seed));
      g.addColorStop(0, `rgba(255,255,255,0)`); g.addColorStop(0.04, `rgba(255,255,255,${A})`);
      g.addColorStop(0.45, `rgba(255,255,255,${A * 0.55})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      s.fillStyle = g;
      s.beginPath(); L.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])));
      for (let i = N; i >= 0; i--) s.lineTo(R[i][0], R[i][1]);
      s.closePath(); s.fill();
      const g2 = s.createLinearGradient(0, y0, 0, y0 - h * 0.8);
      g2.addColorStop(0, `rgba(255,255,255,${al * 0.7})`); g2.addColorStop(1, 'rgba(255,255,255,0)');
      s.strokeStyle = g2; s.lineWidth = 1.4 * sc;
      s.beginPath(); P.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]))); s.stroke();
    }
  }
  function smokeBegin(c, st) {
    const s = st.sc;
    s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'source-over'; s.globalAlpha = 1;
    s.clearRect(0, 0, st.S.width, st.S.height);
    s.setTransform(c.getTransform());
    return s;
  }
  function smokeEnd(c, st, lm = 0, gain = 1) {
    const s = st.sc;
    if (lm > 0) { s.globalCompositeOperation = 'source-atop'; s.globalAlpha = lm; s.drawImage(st.L, LM.x, LM.y, LM.w, LM.h); s.globalAlpha = 1; }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'screen'; c.globalAlpha = gain; c.filter = 'blur(2px)';
    c.drawImage(st.S, 0, 0);
    c.restore();
  }
  function bloom(c, x, y, r, a, v = 255) {
    if (a <= 0.003) return;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, g8(v, a)); g.addColorStop(0.25, g8(v, a * 0.35)); g.addColorStop(1, g8(v, 0));
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  }
  // silhouette with a rim: draw the path offset in a light tone, then the dark body on top
  function sil(c, path, body, rim, dx, dy) {
    if (rim) { c.save(); c.translate(dx, dy); path(c); c.fillStyle = rim; c.fill(); c.restore(); }
    path(c); c.fillStyle = body; c.fill();
  }

  /* ---- shot A: the office, 0 – 2.6 ---- */
  function nHeadlight(t) {
    const u = seg(t, 0.05, 2.75);
    return blinds(lerp(-1700, 1500, E.ioS(u)), -80, 1150, 980, lerp(0.42, 0.12, u), lerp(0.62, -0.05, u), 12, 0.56, 255 * Math.pow(Math.sin(Math.PI * clamp(u * 1.08)), 0.45));
  }
  const nMoon = blinds(-260, 40, 860, 640, 0.34, 0.4, 10, 0.55, 70);
  const DESK = 862;
  const pLamp = c => {
    c.beginPath(); c.ellipse(300, 935, 96, 22, 0, 0, TAU);
    c.rect(292, 760, 16, 176);
    c.moveTo(150, 782); c.quadraticCurveTo(300, 806, 450, 782); c.lineTo(408, 702); c.quadraticCurveTo(300, 686, 192, 702); c.closePath();
  };
  const pPhone = c => {
    c.beginPath(); c.ellipse(770, 944, 74, 18, 0, 0, TAU);
    c.moveTo(756, 940); c.lineTo(763, 694); c.lineTo(777, 694); c.lineTo(784, 940); c.closePath();
    c.moveTo(770, 704); c.lineTo(812, 672); c.lineTo(822, 716); c.closePath();
    c.ellipse(770, 692, 24, 13, 0, 0, TAU);
    c.rect(700, 770, 22, 118); c.rect(712, 760, 54, 9);
  };
  const pGun = c => {
    c.save(); c.translate(500, 990); c.rotate(-0.08);
    c.beginPath();
    c.rect(-190, -9, 196, 15); c.rect(-186, -16, 8, 8); c.rect(-190, 6, 150, 6);
    c.moveTo(6, -18); c.lineTo(66, -18); c.quadraticCurveTo(72, 0, 66, 16); c.lineTo(6, 16); c.quadraticCurveTo(0, 0, 6, -18); c.closePath();
    c.moveTo(60, -14); c.lineTo(104, -14); c.lineTo(112, -26); c.lineTo(118, -12); c.lineTo(112, 12); c.lineTo(60, 14); c.closePath();
    c.moveTo(100, -8); c.lineTo(132, -6); c.quadraticCurveTo(160, 20, 176, 52); c.quadraticCurveTo(160, 66, 140, 62); c.quadraticCurveTo(122, 30, 98, 12); c.closePath();
    c.moveTo(96, 12); c.arc(80, 12, 16, 0, Math.PI); c.lineTo(70, 12); c.arc(80, 12, 10, Math.PI, 0, true); c.closePath();
    c.restore();
  };
  const pTray = c => { c.beginPath(); c.ellipse(1050, 918, 84, 22, 0, 0, TAU); };
  const pGlass = c => { c.beginPath(); c.moveTo(1252, 842); c.lineTo(1332, 842); c.lineTo(1326, 940); c.lineTo(1258, 940); c.closePath(); };
  const pCoat = c => {
    c.beginPath();
    c.moveTo(1234, 214); c.lineTo(1150, 252); c.quadraticCurveTo(1128, 262, 1126, 300);
    c.lineTo(1112, 560); c.lineTo(1098, 720); c.quadraticCurveTo(1170, 740, 1240, 728); c.quadraticCurveTo(1310, 740, 1372, 720);
    c.lineTo(1356, 560); c.lineTo(1342, 300); c.quadraticCurveTo(1340, 262, 1318, 252); c.closePath();
    c.moveTo(1180, 168); c.lineTo(1190, 98); c.quadraticCurveTo(1234, 76, 1278, 98); c.lineTo(1288, 168); c.closePath();
    c.ellipse(1234, 170, 112, 16, 0, 0, TAU);
  };
  function nRoom(c, t, st) {
    const z = kf(t, [[0, 1.0], [2.7, 1.12, E.ioS]]), r = kf(t, [[0, -0.07], [2.7, -0.092, E.ioS]]);
    const fx = kf(t, [[0, 930], [2.7, 1040, E.ioS]]), fy = kf(t, [[0, 540], [2.7, 560, E.ioS]]);
    c.save();
    camera(c, z, r, fx, fy);
    // albedo: wall, wainscot, picture, door, coat rack, desk surface
    c.fillStyle = g8(150); c.fillRect(-400, -260, 2720, 1600);
    c.fillStyle = g8(126);
    for (let x = -400; x < 2320; x += 46) c.fillRect(x, -260, 3, 1020);
    c.fillStyle = g8(84); c.fillRect(-400, 760, 2720, 120);
    c.fillStyle = g8(180); c.fillRect(-400, 750, 2720, 10);
    c.fillStyle = g8(62); c.fillRect(470, 200, 300, 236);
    c.fillStyle = g8(150); c.fillRect(492, 222, 256, 192);
    c.fillStyle = g8(96); c.beginPath(); c.moveTo(492, 350); c.lineTo(560, 292); c.lineTo(622, 334); c.lineTo(690, 272); c.lineTo(748, 322); c.lineTo(748, 414); c.lineTo(492, 414); c.fill();
    c.fillStyle = g8(70); c.fillRect(1430, 30, 440, 1100);
    c.fillStyle = g8(118); c.fillRect(1460, 62, 380, 1100);
    c.fillStyle = g8(40); c.fillRect(1492, 120, 316, 470);
    c.fillStyle = g8(210); c.beginPath(); c.arc(1500, 650, 13, 0, TAU); c.fill();
    c.fillStyle = g8(34); c.fillRect(1226, 160, 16, 720);
    pCoat(c); c.fillStyle = g8(30); c.fill();
    c.strokeStyle = g8(16); c.lineWidth = 4; c.beginPath(); c.moveTo(1150, 300); c.lineTo(1136, 640); c.moveTo(1318, 300); c.lineTo(1332, 640); c.stroke();
    c.strokeStyle = g8(70); c.lineWidth = 3;
    c.beginPath(); c.moveTo(1234, 214); c.lineTo(1200, 330); c.lineTo(1234, 420); c.lineTo(1268, 330); c.closePath(); c.stroke();
    c.fillStyle = g8(30); c.fillRect(1116, 470, 236, 22);
    c.fillStyle = g8(70); c.fillRect(-400, DESK, 2720, 600);
    c.fillStyle = g8(190); c.fillRect(-400, DESK - 4, 2720, 5);
    c.strokeStyle = g8(56); c.lineWidth = 2;
    for (let k = 0; k < 9; k++) { c.beginPath(); for (let x = -400; x <= 2320; x += 60) { const y = DESK + 18 + k * 28 + vnoise(x * 0.004 + k, k) * 6; x === -400 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke(); }

    // light map
    const HL = nHeadlight(t);
    const l = lmBegin(st, 16);
    l.filter = 'blur(6px)';
    l.save(); l.beginPath(); l.rect(-400, -300, 2800, DESK + 300); l.clip();
    drawBlinds(l, nMoon); drawBlinds(l, HL);
    l.restore();
    // on the desk the same slats fall flatter and stretched
    l.save(); l.beginPath(); l.rect(-400, DESK, 2800, 700); l.clip();
    l.translate(0, DESK); l.scale(1, 0.42); l.translate(-240, -DESK - 1180);
    drawBlinds(l, HL);
    l.restore();
    l.filter = 'none';
    l.save();
    l.beginPath(); l.moveTo(150, 784); l.lineTo(450, 784); l.lineTo(1500, 1400); l.lineTo(-900, 1400); l.closePath(); l.clip();
    let g = l.createRadialGradient(300, 860, 0, 300, 860, 820);
    g.addColorStop(0, g8(235)); g.addColorStop(0.35, g8(110)); g.addColorStop(1, g8(0));
    l.fillStyle = g; l.fillRect(-500, 700, 2000, 800);
    l.restore();
    g = l.createRadialGradient(1650, 360, 40, 1650, 360, 520);
    g.addColorStop(0, g8(70)); g.addColorStop(1, g8(0));
    l.fillStyle = g; l.fillRect(1000, -200, 1300, 1100);
    lmApply(c, st, 0.34);

    // frosted door glass lit from the corridor, a visitor's shadow arriving
    const gl = c.createLinearGradient(1492, 120, 1808, 590);
    gl.addColorStop(0, g8(212)); gl.addColorStop(1, g8(148));
    c.fillStyle = gl; c.fillRect(1492, 120, 316, 470);
    const vis = seg(t, 0.9, 2.6);
    if (vis > 0) {
      c.save();
      c.beginPath(); c.rect(1492, 120, 316, 470); c.clip();
      c.filter = 'blur(12px)';
      c.fillStyle = g8(36, 0.9 * E.outQ(seg(t, 0.9, 1.5)));
      c.translate(lerp(1900, 1660, E.outQ(vis)), 780); const s = lerp(560, 700, vis); c.scale(s, s);
      figurePath(c, 0); c.fill();
      c.restore();
    }
    c.save();
    c.translate(1650, 0); c.scale(-1, 1);
    c.fillStyle = g8(50, 0.85); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.font = `700 34px ${NP}`; setLS(c, 5); c.fillText('VINCENT KANE', 0, 290);
    c.font = `400 17px ${NP}`; setLS(c, 6); c.fillText('PRIVATE INVESTIGATIONS', 0, 326);
    setLS(c, 0); c.restore();
    c.strokeStyle = g8(56); c.lineWidth = 8; c.strokeRect(1492, 120, 316, 470);

    // foreground desk silhouettes with rim light from the lamp and the passing car
    const rim = a => g8(160 + 60 * a, 0.9);
    const carK = clamp(blindAt(HL, 1000, 800) + 0.2);
    sil(c, pGun, g8(10), rim(carK), -2, -3);
    c.strokeStyle = g8(210, 0.7); c.lineWidth = 2; c.beginPath(); c.moveTo(312, 996); c.lineTo(504, 980); c.stroke();
    sil(c, pLamp, g8(12), g8(120), 0, -3);
    sil(c, pPhone, g8(8), rim(0.4), -3, -2);
    sil(c, pTray, g8(14), g8(150), 0, -3);
    c.fillStyle = g8(6); c.beginPath(); c.ellipse(1050, 912, 64, 13, 0, 0, TAU); c.fill();
    c.strokeStyle = g8(228); c.lineWidth = 9; c.lineCap = 'butt'; c.beginPath(); c.moveTo(1004, 900); c.lineTo(1094, 892); c.stroke();
    sil(c, pGlass, g8(36), null);
    c.fillStyle = g8(92); c.fillRect(1258, 886, 68, 52);
    c.fillStyle = g8(150); c.fillRect(1270, 878, 24, 22); c.fillRect(1296, 874, 20, 20);
    c.fillStyle = g8(240); c.fillRect(1258, 848, 4, 88); c.fillRect(1322, 848, 3, 88);
    c.fillStyle = g8(255); c.fillRect(1260, 886, 64, 3);
    // lamp underside + ember
    c.fillStyle = g8(250); c.beginPath(); c.ellipse(300, 784, 132, 9, 0, 0, TAU); c.fill();
    bloom(c, 300, 790, 280, 0.32);
    c.strokeStyle = g8(170); c.lineWidth = 3; c.beginPath(); c.moveTo(192, 702); c.quadraticCurveTo(300, 686, 408, 702); c.stroke();
    const emb = 0.75 + 0.25 * vnoise(t * 5, 4);
    c.fillStyle = g8(255); c.beginPath(); c.arc(1003, 900, 5, 0, TAU); c.fill();
    bloom(c, 1003, 900, 46, 0.55 * emb);
    // smoke from the ashtray, lit by whatever slat it drifts through
    const s = smokeBegin(c, st);
    smokeStrands(s, 1000, 896, t + 2, { h: 640, amp: 120, seed: 3, lean: -0.18, alpha: 1 });
    smokeEnd(c, st, 0.82, 1);
    c.restore();
  }
  /* ---- shot B: corridor, the door opens on a silhouette, 2.6 – 5.45 ---- */
  const NF = { x0: 560, x1: 1360, y0: 170, y1: 960 }, NN = { x0: -700, x1: 2620, y0: -520, y1: 1640 }, ND = { x0: 822, x1: 1098, y0: 352, y1: 960 };
  function nCorridor(c, t, st) {
    const z = kf(t, [[2.6, 1.0], [5.45, 1.12, E.ioS]]), r = kf(t, [[2.6, 0.07], [5.45, 0.085]]);
    c.save();
    camera(c, z, r, 960, kf(t, [[2.6, 600], [5.45, 640]]));
    const ang = kf(t, [[2.95, 0], [3.8, 1.3, (u) => E.ioC(u) * 0.3 + E.outC(u) * 0.7]]);
    const open = 1 - Math.cos(ang), lk = 0.12 + 0.88 * clamp(open);
    const wall = (pts, g) => { c.fillStyle = g; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); };
    c.fillStyle = '#000'; c.fillRect(-800, -700, 3600, 2500);
    // ceiling, walls, floor
    let g = c.createLinearGradient(0, NF.y0, 0, NN.y0); g.addColorStop(0, g8(18 * lk)); g.addColorStop(1, g8(2));
    wall([[NN.x0, NN.y0], [NN.x1, NN.y0], [NF.x1, NF.y0], [NF.x0, NF.y0]], g);
    g = c.createLinearGradient(NF.x0, 0, 160, 0); g.addColorStop(0, g8(52 * lk)); g.addColorStop(0.5, g8(16 * lk)); g.addColorStop(1, g8(3));
    wall([[NN.x0, NN.y0], [NF.x0, NF.y0], [NF.x0, NF.y1], [NN.x0, NN.y1]], g);
    g = c.createLinearGradient(NF.x1, 0, 1760, 0); g.addColorStop(0, g8(46 * lk)); g.addColorStop(0.5, g8(14 * lk)); g.addColorStop(1, g8(3));
    wall([[NN.x1, NN.y0], [NF.x1, NF.y0], [NF.x1, NF.y1], [NN.x1, NN.y1]], g);
    g = c.createLinearGradient(0, NF.y1, 0, NN.y1); g.addColorStop(0, g8(30 * lk)); g.addColorStop(1, g8(4));
    wall([[NN.x0, NN.y1], [NF.x0, NF.y1], [NF.x1, NF.y1], [NN.x1, NN.y1]], g);
    // perspective helpers on the walls
    const wp = (side, w, hf) => {
      const x = lerp(side ? NF.x1 : NF.x0, side ? NN.x1 : NN.x0, w);
      return [x, lerp(lerp(NF.y0, NN.y0, w), lerp(NF.y1, NN.y1, w), hf)];
    };
    const W = [0.08, 0.2, 0.42, 0.75];
    for (const side of [0, 1]) {
      for (let d = 0; d < 2; d++) {
        const w0 = W[d * 2], w1 = W[d * 2 + 1];
        const q = [wp(side, w0, 0.3), wp(side, w1, 0.3), wp(side, w1, 1), wp(side, w0, 1)];
        wall(q, g8(5));
        const gq = [wp(side, lerp(w0, w1, 0.15), 0.36), wp(side, lerp(w0, w1, 0.85), 0.36), wp(side, lerp(w0, w1, 0.85), 0.6), wp(side, lerp(w0, w1, 0.15), 0.6)];
        wall(gq, g8(16 * lk * (1 - w0) + 4));
      }
      // wainscot rail
      c.strokeStyle = g8(80 * lk, 0.6); c.lineWidth = 3;
      c.beginPath(); const a = wp(side, 0, 0.62), b = wp(side, 1, 0.62); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
    // floor boards
    c.strokeStyle = g8(70 * lk, 0.35); c.lineWidth = 2;
    for (let k = 0; k <= 14; k++) { c.beginPath(); c.moveTo(lerp(NF.x0, NF.x1, k / 14), NF.y1); c.lineTo(lerp(NN.x0, NN.x1, k / 14), NN.y1); c.stroke(); }
    // end wall + doorway
    c.fillStyle = g8(14 + 10 * lk); c.fillRect(NF.x0, NF.y0, NF.x1 - NF.x0, NF.y1 - NF.y0);
    c.fillStyle = g8(16); c.fillRect(ND.x0 - 22, ND.y0 - 22, ND.x1 - ND.x0 + 44, ND.y1 - ND.y0 + 22);
    // light beyond the door
    c.fillStyle = g8(250); c.fillRect(ND.x0, ND.y0, ND.x1 - ND.x0, ND.y1 - ND.y0);
    const xe = ND.x0 + (ND.x1 - ND.x0) * Math.cos(ang), pe = Math.sin(ang) * 0.1;
    const ye0 = lerp(ND.y0, 520, pe), ye1 = lerp(ND.y1, 520, pe);
    c.fillStyle = g8(14);
    c.beginPath(); c.moveTo(ND.x0, ND.y0); c.lineTo(xe, ye0); c.lineTo(xe, ye1); c.lineTo(ND.x0, ND.y1); c.closePath(); c.fill();
    if (ang > 0.05) { c.fillStyle = g8(200, 0.8); c.fillRect(xe - 2, ye0, 3, ye1 - ye0); }
    if (ang < 0.02) { // closed: light leaking through the cracks
      const fl = 0.8 + 0.2 * vnoise(t * 9, 2);
      c.fillStyle = g8(240 * fl); c.fillRect(ND.x0, ND.y1 - 5, ND.x1 - ND.x0, 5); c.fillRect(ND.x1 - 3, ND.y0, 3, ND.y1 - ND.y0);
      bloom(c, 960, ND.y1, 160, 0.25 * fl);
    }
    // light wedge spilling across the floor, toward camera
    const S = [968, 640];
    const ext = (p) => { const dx = p[0] - S[0], dy = p[1] - S[1], k = (NN.y1 - p[1]) / dy; return [p[0] + dx * k, NN.y1]; };
    const pa = [xe, ND.y1], pb = [ND.x1, ND.y1], ea = ext(pa), eb = ext(pb);
    c.save();
    c.globalCompositeOperation = 'screen';
    g = c.createLinearGradient(0, ND.y1, 0, NN.y1 - 300);
    g.addColorStop(0, g8(200 * open)); g.addColorStop(0.5, g8(90 * open)); g.addColorStop(1, g8(10 * open));
    c.fillStyle = g; c.beginPath(); c.moveTo(pa[0], pa[1]); c.lineTo(pb[0], pb[1]); c.lineTo(eb[0], eb[1]); c.lineTo(ea[0], ea[1]); c.closePath(); c.fill();
    c.restore();
    // the visitor
    const fi = seg(t, 3.0, 3.25);
    const walk = seg(t, 4.3, 5.48), wk = E.inQ(walk);
    const s = 1 / (1 - 0.94 * wk);
    const H0 = 572, fxp = 976 + vnoise(t * 0.7, 6) * 3, fyp = 958 + (s - 1) * 150;
    const ph = walk > 0 ? (t - 4.3) * 7.5 : 0;
    if (fi > 0) {
      // shadow stretched along the wedge
      c.save();
      const dx = fxp - S[0], dy = fyp - S[1], dl = Math.hypot(dx, dy);
      const ux = dx / dl, uy = dy / dl;
      c.globalCompositeOperation = 'multiply';
      c.beginPath(); c.moveTo(pa[0], pa[1]); c.lineTo(pb[0], pb[1]); c.lineTo(eb[0], eb[1]); c.lineTo(ea[0], ea[1]); c.closePath(); c.clip();
      c.setTransform(c.getTransform().multiply(new DOMMatrix([1.5 * H0 * s, 0, -ux * H0 * 2.3 * s, -uy * H0 * 2.3 * s, fxp, fyp])));
      figurePath(c, ph);
      c.fillStyle = g8(30); c.fill();
      c.restore();
      // volumetric haze through the doorway
      c.save(); c.globalCompositeOperation = 'screen';
      g = c.createRadialGradient(960, 660, 60, 960, 760, 1100);
      g.addColorStop(0, g8(70 * open)); g.addColorStop(0.35, g8(14 * open)); g.addColorStop(1, g8(0));
      c.fillStyle = g; c.fillRect(-800, -700, 3600, 2500);
      c.restore();
      // god rays through the doorway, with dust drifting in them
      c.save(); c.globalCompositeOperation = 'screen';
      for (let k = 0; k < 6; k++) {
        const x0 = lerp(xe, ND.x1, (k + 0.5) / 6), sp = (x0 - 960) * 2.2;
        const gr = c.createLinearGradient(0, ND.y0, 0, 1500);
        gr.addColorStop(0, g8(34 * open)); gr.addColorStop(1, g8(0));
        c.fillStyle = gr; c.beginPath(); c.moveTo(x0 - 14, ND.y0 + 40 + k * 60); c.lineTo(x0 + 14, ND.y0 + 40 + k * 60); c.lineTo(x0 + sp + 140, 1500); c.lineTo(x0 + sp - 140, 1500); c.closePath(); c.fill();
      }
      for (let i = 0; i < 70; i++) {
        const x = 700 + hash(i * 3.1) * 560 + vnoise(t * 0.3 + i, i) * 40, y = 300 + hash(i * 7.7) * 900 - ((t * (8 + hash(i) * 14)) % 60);
        const inB = clamp(1 - Math.abs(x - 960) / (160 + (y - 350) * 0.6));
        c.fillStyle = g8(255, 0.5 * inB * open * (0.4 + 0.6 * hash(i * 1.9)));
        c.beginPath(); c.arc(x, y, 1 + hash(i * 5.1) * 1.8, 0, TAU); c.fill();
      }
      c.restore();
      bloom(c, 960, 640, 520, 0.22 * open);
      // silhouette
      c.save(); c.translate(fxp, fyp); c.scale(H0 * s, H0 * s);
      figurePath(c, ph);
      c.fillStyle = g8(4); c.fill();
      c.restore();
      // backlit cigarette smoke
      if (s < 3) {
        const hx = fxp + 0.23 * H0 * s, hy = fyp - 0.43 * H0 * s;
        c.fillStyle = g8(255); c.beginPath(); c.arc(hx, hy, 3 * s, 0, TAU); c.fill();
        bloom(c, hx, hy, 26 * s, 0.6);
        const sm = smokeBegin(c, st);
        smokeStrands(sm, hx, hy, t, { h: 420 * s, amp: 60 * s, sc: s, seed: 11, lean: 0.08, k: 4, spread: 40, alpha: fi * (1 - seg(s, 1.5, 3)) });
        smokeEnd(c, st, 0, 0.9);
      }
    } else {
      bloom(c, 960, ND.y1, 120, 0.15);
    }
    c.restore();
    // he fills the lens: a shadow wipe
    const blk = seg(t, 5.3, 5.42);
    if (blk > 0) { c.fillStyle = `rgba(0,0,0,${blk})`; c.fillRect(0, 0, 1920, 1080); }
  }

  /* ---- shot C: rain-slick street under one lamp, 5.45 – 8.1 ---- */
  const NLX = 1180, NLY = 236, NGY = 945;
  const N_FLICK = [1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0];
  function nLamp(t) {
    if (t < 7.52) return 1;
    if (t >= 7.95) return 0;
    return N_FLICK[Math.floor((t - 7.52) * 30) % N_FLICK.length] * (0.6 + 0.4 * hash(Math.floor(t * 30)));
  }
  function nStreet(c, t, st) {
    const z = kf(t, [[5.45, 1.04], [8.1, 1.16, E.ioS]]), r = kf(t, [[5.45, -0.085], [8.1, -0.1]]);
    const LI = nLamp(t);
    c.save();
    camera(c, z, r, kf(t, [[5.45, 1120], [8.1, 1090]]), kf(t, [[5.45, 610], [8.1, 600]]));
    c.fillStyle = g8(6); c.fillRect(-800, -700, 3600, 2500);
    // night sky glowing with fog at the horizon, far buildings as silhouettes
    let g = c.createLinearGradient(0, -400, 0, 560); g.addColorStop(0, g8(3)); g.addColorStop(0.7, g8(26)); g.addColorStop(1, g8(52));
    c.fillStyle = g; c.fillRect(-800, -700, 3600, 1260);
    const R = rng(77);
    for (let layer = 0; layer < 2; layer++) {
      for (let i = 0; i < 18; i++) {
        const x = 420 + i * 92 + R() * 50 - layer * 40, w = 60 + R() * 90, h = (layer ? 150 : 90) + R() * (layer ? 200 : 120);
        c.fillStyle = g8(layer ? 9 : 22); c.fillRect(x, 540 - h, w, h + 40);
        if (R() < 0.4) c.fillRect(x + w * 0.4, 540 - h - 40, 4, 40);
        for (let k = 0; k < 5; k++) if (R() < 0.16) { c.fillStyle = g8(110 + R() * 80, 0.75); c.fillRect(x + 8 + R() * (w - 22), 540 - h + 20 + R() * (h - 40), 7, 11); }
      }
    }
    g = c.createLinearGradient(0, 380, 0, 600); g.addColorStop(0, g8(30, 0)); g.addColorStop(1, g8(40, 0.75));
    c.fillStyle = g; c.fillRect(-800, 380, 3600, 220);
    // left facade receding to the vanishing point
    const fp = (w, hf) => [lerp(-700, 640, w), lerp(lerp(-600, 260, w), lerp(1300, 560, w), hf)];
    const poly = (pts, fill) => { c.fillStyle = fill; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); };
    g = c.createLinearGradient(-700, 0, 640, 0); g.addColorStop(0, g8(8)); g.addColorStop(1, g8(30));
    poly([fp(0, 0), fp(1, 0), fp(1, 1), fp(0, 1)], g);
    c.strokeStyle = g8(4, 0.6); c.lineWidth = 2;
    for (let k = 1; k < 30; k++) { const a = fp(0, k / 30), b = fp(1, k / 30); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    const WW = [[0.06, 0.2], [0.34, 0.44], [0.56, 0.63], [0.72, 0.77], [0.84, 0.87]];
    WW.forEach(([a, b], i) => {
      for (const [h0, h1] of [[0.12, 0.3], [0.42, 0.6]]) {
        const lit = i === 1 && h0 < 0.2;
        poly([fp(a - 0.006, h0 - 0.01), fp(b + 0.006, h0 - 0.01), fp(b + 0.006, h1 + 0.012), fp(a - 0.006, h1 + 0.012)], g8(40 * (1 - a * 0.5)));
        poly([fp(a, h0), fp(b, h0), fp(b, h1), fp(a, h1)], lit ? g8(200) : g8(5));
        if (lit) { // a lit window with its own blinds, a figure's shadow behind them
          c.strokeStyle = g8(50); c.lineWidth = 7;
          for (let k = 1; k < 10; k++) { const p0 = fp(a, lerp(h0, h1, k / 10)), p1 = fp(b, lerp(h0, h1, k / 10)); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); }
          const m = fp((a + b) / 2, (h0 + h1) / 2); bloom(c, m[0], m[1], 300, 0.25);
        }
      }
    });
    // right-hand building corner with a recessed doorway
    c.fillStyle = g8(7); c.fillRect(1780, -700, 1000, 1700);
    c.fillStyle = g8(16 + 40 * LI); c.fillRect(1780, -700, 6, 1660);
    c.fillStyle = g8(3); c.fillRect(1860, 560, 220, 400);
    // street + sidewalk
    poly([[-800, 556], [2700, 556], [2700, 1800], [-800, 1800]], g8(12));
    poly([fp(0, 1), fp(1, 1), [700, 575], [-200, 1800]], g8(18));
    c.strokeStyle = g8(90, 0.5); c.lineWidth = 4; c.beginPath(); c.moveTo(700, 575); c.lineTo(-200, 1800); c.stroke();
    // cobble rows in perspective (wet, faint)
    c.strokeStyle = g8(40, 0.35); c.lineWidth = 1.5;
    for (let k = 0; k < 26; k++) { const y = 560 + Math.pow(k / 26, 2.1) * 1000; c.beginPath(); c.moveTo(-800, y); c.lineTo(2700, y); c.stroke(); }
    // lamp pool on the wet cobbles
    c.save(); c.globalCompositeOperation = 'lighter'; c.translate(NLX, NGY); c.scale(1, 0.24);
    g = c.createRadialGradient(0, 0, 0, 0, 0, 700);
    g.addColorStop(0, g8(130 * LI)); g.addColorStop(0.45, g8(46 * LI)); g.addColorStop(1, g8(0));
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 700, 0, TAU); c.fill();
    c.restore();
    // cobble glints
    const CR = rng(9);
    c.fillStyle = '#fff';
    for (let i = 0; i < 520; i++) {
      const u = CR() * 2 - 1, v = CR() * 2 - 1;
      const x = NLX + u * 820, y = NGY + v * 230;
      const d = Math.hypot(u / 0.9, v / 0.85);
      const a = LI * Math.pow(clamp(1 - d), 1.3) * (0.2 + 0.8 * CR()) * 0.6;
      if (a > 0.02) { c.globalAlpha = a; c.beginPath(); c.ellipse(x, y, 7 + 7 * (y - 700) / 300, 2 + (y - 700) / 300, 0, 0, TAU); c.fill(); }
    }
    c.globalAlpha = 1;
    // reflection of the lamp, smeared down the wet street
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let y = NGY - 30; y < 1500; y += 4) {
      const k = (y - NGY + 30) / 560;
      const off = vnoise(y * 0.045 + t * 2.4, 3) * 30 * k + vnoise(y * 0.13 - t * 5, 8) * 7;
      const w = 34 + k * 110 + vnoise(y * 0.07, 2) * 16;
      c.fillStyle = g8(240, LI * 0.32 * Math.pow(1 - clamp(k), 1.3) * (0.6 + 0.4 * hash(Math.floor(y / 4) + Math.floor(t * 12))));
      c.fillRect(NLX - w / 2 + off, y - 3, w, 9); c.fillRect(NLX - w * 0.3 + off, y - 1, w * 0.6, 5);
    }
    const wm = fp(0.39, 0.21);
    for (let y = 1120; y < 1500; y += 5) { const off = vnoise(y * 0.05 + t * 2, 5) * 16; c.fillStyle = g8(170, 0.16 * (1 - (y - 1120) / 380)); c.fillRect(wm[0] - 40 + off, y, 80, 3); }
    c.restore();
    // ripples from rain hits
    c.strokeStyle = '#fff'; c.lineWidth = 1.5;
    for (let i = 0; i < 30; i++) {
      const per = 0.6 + hash(i * 3.3) * 0.5, ph = (t / per + hash(i * 1.7)) % 1, cyc = Math.floor(t / per + hash(i * 1.7));
      const x = NLX + (hash(i * 9.1 + cyc * 3.7) * 2 - 1) * 560, y = NGY + (hash(i * 5.3 + cyc * 1.9) * 2 - 1) * 130;
      const pool = clamp(1 - Math.hypot((x - NLX) / 640, (y - NGY) / 170));
      c.globalAlpha = (1 - ph) * 0.7 * LI * pool;
      if (c.globalAlpha > 0.02) { c.beginPath(); c.ellipse(x, y, 4 + ph * 36, (4 + ph * 36) * 0.22, 0, 0, TAU); c.stroke(); }
    }
    c.globalAlpha = 1;
    // volumetric cone: nested soft layers, brightest along the axis
    c.save(); c.globalCompositeOperation = 'screen'; c.filter = 'blur(22px)';
    for (let k = 0; k < 4; k++) {
      const wf = 0.3 + k * 0.233;
      g = c.createLinearGradient(0, NLY, 0, NGY + 20);
      g.addColorStop(0, g8(56 * LI)); g.addColorStop(0.6, g8(20 * LI)); g.addColorStop(1, g8(10 * LI));
      c.fillStyle = g; c.beginPath(); c.moveTo(NLX - 26 * wf, NLY + 22); c.lineTo(NLX + 26 * wf, NLY + 22); c.lineTo(NLX + 640 * wf, NGY + 20); c.lineTo(NLX - 640 * wf, NGY + 20); c.closePath(); c.fill();
    }
    c.restore();
    // lamp post + lantern (in front of its own glow)
    c.fillStyle = g8(4);
    c.beginPath(); c.moveTo(NLX - 30, NGY + 4); c.lineTo(NLX - 20, NGY - 30); c.lineTo(NLX - 12, NGY - 80); c.lineTo(NLX - 8, NLY + 70); c.lineTo(NLX + 8, NLY + 70); c.lineTo(NLX + 12, NGY - 80); c.lineTo(NLX + 20, NGY - 30); c.lineTo(NLX + 30, NGY + 4); c.closePath(); c.fill();
    c.fillRect(NLX - 18, NLY + 52, 36, 18);
    c.beginPath(); c.moveTo(NLX - 30, NLY + 52); c.lineTo(NLX + 30, NLY + 52); c.lineTo(NLX + 14, NLY + 30); c.lineTo(NLX - 14, NLY + 30); c.closePath(); c.fill();
    // glass panes
    c.fillStyle = g8(40 + 215 * LI);
    c.beginPath(); c.moveTo(NLX - 40, NLY - 34); c.lineTo(NLX + 40, NLY - 34); c.lineTo(NLX + 28, NLY + 30); c.lineTo(NLX - 28, NLY + 30); c.closePath(); c.fill();
    c.fillStyle = g8(4);
    c.fillRect(NLX - 3, NLY - 34, 6, 64);
    c.strokeStyle = g8(4); c.lineWidth = 5; c.beginPath(); c.moveTo(NLX - 42, NLY - 34); c.lineTo(NLX - 28, NLY + 30); c.moveTo(NLX + 42, NLY - 34); c.lineTo(NLX + 28, NLY + 30); c.stroke();
    c.fillStyle = g8(70 * LI); c.fillRect(NLX - 8, NLY + 74, 3, NGY - NLY - 160);
    bloom(c, NLX, NLY, 420, 0.6 * LI);
    bloom(c, NLX, NLY, 110, 0.9 * LI);
    c.fillStyle = g8(4);
    c.beginPath(); c.moveTo(NLX - 58, NLY - 32); c.lineTo(NLX + 58, NLY - 32); c.lineTo(NLX + 9, NLY - 80); c.lineTo(NLX - 9, NLY - 80); c.closePath(); c.fill();
    c.beginPath(); c.arc(NLX, NLY - 86, 9, 0, TAU); c.fill();
    c.fillStyle = g8(255, 0.5 * LI); c.fillRect(NLX - 58, NLY - 33, 116, 2);
    // rain
    c.lineCap = 'round';
    for (let i = 0; i < 520; i++) {
      const sp = 1500 + hash(i * 2.1) * 700, x0 = hash(i * 1.3) * 2600 - 400;
      const yy = ((hash(i * 4.7) * 1700 + t * sp) % 1700) - 500;
      const x = x0 - (yy + 500) * 0.12;
      const cone = clamp(1 - Math.abs(x - NLX) / (30 + 570 * clamp((yy - NLY) / (NGY - NLY)))) * (yy > NLY && yy < NGY + 40 ? 1 : 0);
      const a = 0.05 + 0.7 * cone * LI;
      c.strokeStyle = g8(230, a); c.lineWidth = 1.2 + hash(i) * 1.4;
      c.beginPath(); c.moveTo(x, yy); c.lineTo(x - 5, yy + 38); c.stroke();
    }
    // the man under the lamp
    const wk = seg(t, 5.5, 6.75);
    const fxp = lerp(2080, 1010, 1 - Math.pow(1 - wk, 2.2)), fyp = NGY + 10, H0 = 430;
    const ph = (t - 5.5) * 7.6 * (wk < 1 ? 1 : 0) + (wk >= 1 ? 6.75 * 0 : 0);
    const raise = seg(t, 6.75, 6.95);
    const LIf = LI * clamp(1 - Math.abs(fxp - NLX) / 900);
    // shadow cast toward camera
    c.save();
    c.globalCompositeOperation = 'multiply';
    const dx = fxp - NLX, dl = Math.hypot(dx, 700);
    c.setTransform(c.getTransform().multiply(new DOMMatrix([1.3 * H0, 0, -(dx / dl) * H0 * 1.1, -(700 / dl) * H0 * 0.55, fxp, fyp])));
    figurePath(c, wk < 1 ? ph : 0); c.fillStyle = g8(255 - 200 * LIf); c.fill();
    c.restore();
    // reflection in the wet ground
    c.save(); c.globalAlpha = 0.5 * LIf; c.translate(fxp, fyp + 4); c.scale(H0, -H0 * 0.9);
    figurePath(c, wk < 1 ? ph : 0); c.fillStyle = g8(0); c.fill(); c.restore();
    // rim light on the lamp side, then the silhouette
    c.save(); c.translate(fxp + (dx > 0 ? -3 : 3), fyp - 3); c.scale(H0, H0);
    figurePath(c, wk < 1 ? ph : 0, { arm: raise > 0.5 }); c.fillStyle = g8(170 * LIf); c.fill(); c.restore();
    c.save(); c.translate(fxp, fyp); c.scale(H0, H0);
    figurePath(c, wk < 1 ? ph : 0, { arm: raise > 0.5 }); c.fillStyle = g8(3); c.fill(); c.restore();
    // brim catches the lamp
    c.strokeStyle = g8(220, 0.7 * LIf); c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(fxp - 0.15 * H0, fyp - 0.826 * H0); c.quadraticCurveTo(fxp, fyp - 0.848 * H0, fxp + 0.15 * H0, fyp - 0.826 * H0); c.stroke();
    // the match
    const mt = t - 6.95;
    const mx = fxp + 0.07 * H0, my = fyp - 0.765 * H0;
    if (mt > 0) {
      const flare = mt < 0.08 ? mt / 0.08 : Math.exp(-(mt - 0.08) * 3.2) * 0.75 + 0.25 * (mt < 0.9 ? 1 : Math.exp(-(mt - 0.9) * 6));
      const fl = flare * (0.85 + 0.15 * hash(Math.floor(t * 30)));
      // face lit from below, under the brim
      c.save(); c.filter = 'blur(3px)';
      c.fillStyle = g8(150, clamp(fl * 0.7));
      c.beginPath(); c.moveTo(fxp - 0.02 * H0, fyp - 0.8 * H0); c.lineTo(fxp + 0.05 * H0, fyp - 0.8 * H0); c.lineTo(fxp + 0.04 * H0, fyp - 0.77 * H0); c.lineTo(fxp, fyp - 0.765 * H0); c.closePath(); c.fill();
      c.restore();
      c.fillStyle = g8(255, clamp(fl * 0.8)); c.fillRect(fxp - 0.1 * H0, fyp - 0.812 * H0, 0.22 * H0, 2.5);
      bloom(c, mx, my, 220 * (0.4 + fl), 0.9 * fl);
      bloom(c, mx, my, 40, 1.0 * fl);
      // ember + smoke after
      const ex = fxp + 0.055 * H0, ey = fyp - 0.775 * H0, ember = clamp((mt - 0.5) * 4) * (0.7 + 0.3 * vnoise(t * 4, 1));
      if (ember > 0) {
        c.fillStyle = g8(255); c.beginPath(); c.arc(ex, ey, 2.5, 0, TAU); c.fill();
        bloom(c, ex, ey, 30, 0.6 * ember);
        const sm = smokeBegin(c, st);
        smokeStrands(sm, ex, ey - 4, t - 6.9, { h: 300, amp: 44, sc: 0.7, seed: 21, lean: -0.3, k: 4, alpha: ember * (0.3 + 0.7 * LI) });
        smokeEnd(c, st, 0, 0.8);
      }
    }
    // drifting fog
    c.save(); c.globalCompositeOperation = 'screen';
    for (let k = 0; k < 3; k++) {
      g = c.createLinearGradient(0, 380 + k * 120, 0, 640 + k * 140);
      g.addColorStop(0, g8(0)); g.addColorStop(0.5, g8((26 - k * 6) * (0.35 + 0.65 * LI))); g.addColorStop(1, g8(0));
      c.fillStyle = g; c.fillRect(-800 + ((t * (20 + k * 12)) % 200), 380 + k * 120, 3600, 260 + k * 20);
    }
    c.restore();
    c.restore();
  }

  /* ---- shot D: title, 8.1 – 10 ---- */
  function nTitle(c, t, st) {
    c.fillStyle = '#000'; c.fillRect(0, 0, 1920, 1080);
    const u = seg(t, 8.15, 9.0);
    const z = kf(t, [[8.1, 1.06], [10, 1.0, E.outC]]);
    c.save(); camera(c, z, 0, 960, 540);
    // title plate rendered white, then lit by the blind pattern
    const T = st.T, tc = st.tc;
    tc.setTransform(1, 0, 0, 1, 0, 0); tc.globalCompositeOperation = 'source-over'; tc.filter = 'none';
    tc.fillStyle = '#000'; tc.fillRect(0, 0, 1920, 1080);
    tc.textAlign = 'center'; tc.textBaseline = 'alphabetic';
    tc.font = `900 360px ${NP}`; setLS(tc, 34);
    tc.fillStyle = g8(26); tc.fillText('NOIR', 960 + 17 + 14, 640 + 16); // drop shadow, deco style
    tc.fillStyle = '#fff'; tc.fillText('NOIR', 960 + 17, 640);
    setLS(tc, 0);
    tc.fillStyle = '#fff'; tc.fillRect(560, 700, 800, 3);
    tc.font = `400 30px ${NT}`; setLS(tc, 10);
    tc.fillText('A STUDY IN LIGHT AND SHADOW', 960 + 5, 760);
    tc.font = `400 22px ${NT}`; setLS(tc, 14);
    tc.fillText('MCMXLIV', 960 + 7, 300);
    setLS(tc, 0);
    // light: the blind shadow wipes across, settles, then the slats open a little
    const l = lmBegin(st, 0);
    l.filter = 'blur(5px)';
    const open = lerp(0.52, 0.66, E.ioS(seg(t, 9.0, 9.9)));
    const P = blinds(lerp(-2300, 120, E.outC(u)), -240, 1700, 1500, 0.16, 0.42, 14, open, 255);
    drawBlinds(l, P);
    l.filter = 'none';
    let g = l.createRadialGradient(960, 560, 100, 960, 560, 1100);
    g.addColorStop(0, g8(30 * u)); g.addColorStop(1, g8(0));
    l.fillStyle = g; l.fillRect(-360, -220, 2640, 1520);
    tc.globalCompositeOperation = 'multiply';
    tc.drawImage(st.L, LM.x, LM.y, LM.w, LM.h);
    c.drawImage(T, 0, 0);
    // the light shaft across black (dust in the air)
    c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.16;
    c.drawImage(st.L, LM.x, LM.y, LM.w, LM.h);
    c.restore();
    const sm = smokeBegin(c, st);
    smokeStrands(sm, 1500, 1140, t - 6.5, { h: 820, amp: 150, sc: 1.4, seed: 41, lean: -0.6, alpha: 0.8 * seg(t, 8.3, 9.2) });
    smokeEnd(c, st, 0.9, 0.9);
    c.restore();
  }

  function nPost(c, W, H, t) {
    const f = Math.floor(t * 24);
    c.fillStyle = `rgba(0,0,0,${0.03 + 0.07 * hash(f * 1.31)})`; c.fillRect(0, 0, W, H);
    grain(c, W, H, t, 0.2, 'overlay');
    grain(c, W, H, t + 3.1, 0.05, 'screen');
    // dust, hairs and the odd scratch
    const R = rng(f * 7 + 3);
    for (let i = 0; i < 7; i++) {
      const x = R() * W, y = R() * H, s = 1 + R() * 3.5, w = R() < 0.5;
      c.fillStyle = w ? `rgba(255,255,255,${0.25 + R() * 0.4})` : `rgba(0,0,0,${0.4 + R() * 0.4})`;
      c.beginPath(); c.ellipse(x, y, s, s * (0.5 + R()), R() * 3, 0, TAU); c.fill();
    }
    if (hash(f * 0.37) < 0.18) {
      const x = hash(f * 2.9) * W;
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 6, H * 0.3, x - 4, H * 0.7, x + 3, H); c.stroke();
    }
    if (hash(f * 1.77) < 0.1) {
      const x = hash(f * 4.1) * W, y = hash(f * 5.3) * H;
      c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 30, y + 10, x + 22, y + 46); c.stroke();
    }
    vignette(c, W, H, 0.85);
  }

  MG.film({
    id: 'filmnoir', dur: 10, poster: 9.4,
    fonts: [['900 80px "Playfair Display"', 'NOIR'], ['700 40px "Playfair Display"', 'VINCENT KANE'], ['400 30px "Special Elite"', 'A STUDY MCMXLIV']],
    meta: {
      family: 'H', name: 'Film Noir', sub: 'Light and Shadow', era: '1941 —',
      origin: 'Hollywood crime pictures of the 1940s and 50s, shot by cinematographers such as John Alton and Robert Krasker, borrowed German Expressionist chiaroscuro: hard single-source light, deep shadow and oblique angles. French critic Nino Frank named the cycle "film noir" in 1946, and neo-noir and title designers have quoted its look ever since.',
      works: 'The Maltese Falcon (John Huston, 1941) · Double Indemnity (Billy Wilder, 1944) · Murder, My Sweet (Edward Dmytryk, 1944) · The Big Combo (Joseph H. Lewis, 1955) · The Third Man (Carol Reed, 1949) · Touch of Evil (Orson Welles, 1958) · Sin City (Robert Rodriguez, 2005)',
      tech: ['Light-map compositing: blind patterns multiplied over albedo', 'Procedural turbulent smoke lit by the slats it crosses', 'Silhouette shadows cast by affine projection', 'Film grain, gate flicker, dust and vignette'],
      accent: '#d8d2c4',
      motionDNA: 'Slow push-ins on Dutch angles while the light itself moves: a passing car sweeps blind shadows across the room, a door swings open to throw a wedge of light, and a lamp flickers out.',
      visualDNA: 'Hard chiaroscuro in black and white: venetian-blind slats, silhouettes in doorways, rain lit only inside a lamp cone, wet cobbles, curling smoke, heavy grain and a deco serif title.',
      transitions: 'Hard cut, silhouette wipe (a figure walks into the lens), lamp-out to black, blind-shadow wipe onto the title.',
      implementation: ['Live action', 'Blender', 'Canvas 2D'],
      reproducibility: 'Needs live action (this film is a procedural homage)', loopable: false,
    },
    setup() {
      const L = offscreen(Math.round(LM.w * LM.s), Math.round(LM.h * LM.s));
      const T = offscreen(1920, 1080);
      const S = offscreen(1920, 1080);
      return { L, lc: L.getContext('2d'), T, tc: T.getContext('2d'), S, sc: S.getContext('2d') };
    },
    draw(c, t, W, H, st) {
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      c.save();
      // gate weave
      c.translate(vnoise(t * 7, 1) * 1.6, vnoise(t * 6, 2) * 2.2);
      if (t < 2.62) nRoom(c, t, st);
      else if (t < 5.45) nCorridor(c, t, st);
      else if (t < 8.1) nStreet(c, t, st);
      else nTitle(c, t, st);
      c.restore();
      // fade from black at the head
      const fin = 1 - seg(t, 0, 0.35);
      if (fin > 0) { c.fillStyle = `rgba(0,0,0,${fin})`; c.fillRect(0, 0, W, H); }
      if (t > 7.95 && t < 8.15) { c.fillStyle = `rgba(0,0,0,${0.75})`; c.fillRect(0, 0, W, H); }
      nPost(c, W, H, t);
    },
    score(A) {
      const B = 0.75; // 80 bpm, swung
      const bt = b => 0.3 + b * B;
      // room tone + car passing outside (the headlight sweep)
      A.noise(0, { type: 'lowpass', f: 300, dur: 5.4, g: 0.025, hold: true, a: 0.3, rel: 0.4 });
      [[0.1, -0.8], [0.9, 0], [1.7, 0.8]].forEach(([tt, p], i) => A.noise(tt, { type: 'lowpass', f: 220 + i * 120, f2: 600 - i * 120, dur: 1.2, g: 0.07, swell: 0.55, pan: p }));
      A.osc(0.2, { type: 'sawtooth', f: 52, f2: 44, glide: 2.3, dur: 2.4, g: 0.035, lp: 180, a: 0.9 });
      // upright bass walk (Karplus-Strong)
      const bass = [36, 39, 43, 46, 41, 44, 48, 47, 48, 43, 42, 41];
      bass.forEach((m, b) => { if (bt(b) < 7.5) A.pluck(bt(b), midi(m), { dur: 1.1, bright: 0.32, decay: 0.994, lp: 700, g: 0.55 }); });
      // brushes + ride
      for (let b = 0; b < 10; b++) {
        const tt = bt(b);
        A.noise(tt, { type: 'bandpass', f: 3800, q: 0.6, dur: 0.62, g: 0.03, swell: 0.55, pan: 0.2 });
        if (b % 2) A.noise(tt, { type: 'bandpass', f: 2400, q: 0.8, dur: 0.11, g: 0.07, rev: 0.25 });
        A.noise(tt, { type: 'highpass', f: 7000, dur: 0.42, g: 0.028, pan: -0.25 });
        if (b % 2) A.noise(tt + B * 0.66, { type: 'highpass', f: 7500, dur: 0.18, g: 0.018, pan: -0.25 });
      }
      // piano voicings, soft
      const pv = [[0.3, [48, 51, 55, 58, 62]], [3.3, [53, 56, 60, 63, 67]], [6.3, [44, 48, 51, 55, 62]]];
      pv.forEach(([tt, ns]) => ns.forEach((m, i) => A.osc(tt + i * 0.018, { type: 'triangle', f: midi(m), dur: 2.4, g: 0.028, lp: 1800, rev: 0.4, pan: (i - 2) * 0.15 })));
      // muted trumpet
      const tp = (t0, m, d, o = {}) => {
        A.osc(t0, { type: 'sawtooth', f: midi(m), f2: o.fall ? midi(m - o.fall) : undefined, glide: d, dur: d, g: o.g ?? 0.06, a: 0.05, hold: true, rel: 0.12, lp: 650, lp2: 2200, lpT: Math.min(0.25, d), q: 6, vib: [5.2, o.vib ?? 3], rev: 0.4, pan: 0.15 });
        A.osc(t0, { type: 'square', f: midi(m) * 2, dur: d, g: (o.g ?? 0.06) * 0.12, a: 0.06, hold: true, rel: 0.1, lp: 3000, rev: 0.3 });
      };
      tp(0.85, 67, 0.62); tp(1.5, 68, 0.22); tp(1.74, 67, 0.22); tp(1.98, 63, 0.7, { fall: 1 });
      tp(3.1, 72, 0.95, { vib: 6 }); tp(4.1, 70, 0.26); tp(4.38, 67, 0.26); tp(4.66, 68, 0.6, { fall: 2 });
      tp(5.95, 75, 0.48); tp(6.45, 74, 0.24); tp(6.72, 72, 0.24); tp(7.0, 67, 0.55, { fall: 5 });
      // door: latch + creak, footsteps, the silhouette wipe
      A.noise(2.9, { type: 'highpass', f: 3000, dur: 0.04, g: 0.12 });
      A.osc(2.95, { type: 'sawtooth', f: 170, f2: 260, glide: 0.8, dur: 0.85, g: 0.025, lp: 1300, q: 3, vib: [11, 18], a: 0.1 });
      [4.45, 4.85, 5.18].forEach((tt, i) => { A.osc(tt, { f: 110, f2: 45, glide: 0.12, dur: 0.2, g: 0.14 + i * 0.05 }); A.noise(tt, { type: 'lowpass', f: 900, dur: 0.08, g: 0.06 }); });
      A.whoosh(5.05, 0.42, { f1: 120, f2: 900, g: 0.16 });
      // rain + distant thunder
      A.noise(5.42, { type: 'highpass', f: 3500, dur: 2.7, g: 0.05, hold: true, a: 0.05, rel: 0.2 });
      A.noise(5.42, { type: 'bandpass', f: 1100, q: 0.5, dur: 2.7, g: 0.035, hold: true, a: 0.05, rel: 0.2, rate: 1.3 });
      A.noise(5.5, { type: 'lowpass', f: 140, dur: 2.0, g: 0.12, swell: 0.3 });
      // match strike, lamp buzz and death
      A.noise(6.95, { type: 'bandpass', f: 2600, q: 1.2, dur: 0.12, g: 0.22 });
      A.noise(6.99, { type: 'lowpass', f: 900, f2: 300, dur: 0.7, g: 0.07 });
      for (let k = 0; k < 6; k++) A.noise(7.0 + k * 0.07 + hash(k) * 0.03, { type: 'highpass', f: 5000, dur: 0.01, g: 0.05 });
      for (let k = 0; k < 13; k++) { const tt = 7.52 + k / 30; if (N_FLICK[k]) A.osc(tt, { type: 'sawtooth', f: 120, dur: 0.03, g: 0.035, lp: 1400, hold: true, rel: 0.005 }); }
      A.noise(7.95, { type: 'highpass', f: 2000, dur: 0.03, g: 0.1 });
      // title stinger: brass sforzando, timpani, held trumpet
      A.noise(7.7, { type: 'highpass', f: 5000, dur: 0.45, g: 0.05, swell: 0.95 });
      [36, 43, 48, 51, 55].forEach((m, i) => A.osc(8.12, { type: 'sawtooth', f: midi(m), dur: 1.85, g: 0.05 - i * 0.004, a: 0.02, hold: true, rel: 0.6, lp: 500, lp2: 1500, lpT: 0.4, rev: 0.5, pan: (i - 2) * 0.25, detune: (i - 2) * 5 }));
      A.osc(8.12, { f: 70, f2: 60, glide: 0.4, dur: 1.6, g: 0.45 });
      A.noise(8.12, { type: 'lowpass', f: 600, dur: 0.5, g: 0.12, rev: 0.4 });
      A.pluck(8.12, midi(24), { dur: 1.8, bright: 0.3, decay: 0.997, lp: 500, g: 0.6 });
      tp(8.3, 72, 1.45, { vib: 7, g: 0.055 });
      A.osc(9.25, { type: 'triangle', f: midi(79), dur: 1.0, g: 0.03, rev: 0.6 });
    },
  });
  /* =====================================================================
     SPORTS BROADCAST — an NFL-on-FOX / Sky Sports style package for a
     fictional championship: chrome open, matchup, head-to-head stats,
     replay stinger, player card, live bug + touchdown, flare logo lockup.
     ===================================================================== */
  const SF = '"Barlow Condensed", "Arial Narrow", sans-serif';
  const S_RED = [232, 28, 54], S_RED2 = [120, 6, 22], S_BLU = [24, 120, 255], S_BLU2 = [6, 30, 96], S_GOLD = [255, 196, 44], S_NAVY = [4, 9, 24];
  const S_HITS = [[0.5, 1], [1.75, 0.6], [2.5, 0.8], [3.75, 0.5], [5.25, 0.7], [5.5, 0.6], [8.0, 1.2], [9.0, 0.7]];
  function sShake(t) {
    let x = 0, y = 0;
    S_HITS.forEach(([h, a]) => { const d = decay(t, h, 9) * a; x += Math.sin((t - h) * 83) * 14 * d; y += Math.cos((t - h) * 71) * 10 * d; });
    return [x, y];
  }
  const sFont = (size, w = 900, it = true) => `${it ? 'italic ' : ''}${w} ${size}px ${SF}`;
  function para(c, x, y, w, h, sk) { c.beginPath(); c.moveTo(x + sk, y); c.lineTo(x + w + sk, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); }
  function metalGrad(c, y, h, tint) {
    const g = c.createLinearGradient(0, y, 0, y + h);
    const tt = tint || [40, 46, 60];
    g.addColorStop(0, rgba(mix(tt, [255, 255, 255], 0.75))); g.addColorStop(0.06, rgba(mix(tt, [255, 255, 255], 0.35)));
    g.addColorStop(0.12, rgba(tt)); g.addColorStop(0.55, rgba(mix(tt, [0, 0, 0], 0.6))); g.addColorStop(0.94, rgba(mix(tt, [0, 0, 0], 0.8))); g.addColorStop(1, rgba(mix(tt, [255, 255, 255], 0.3)));
    return g;
  }
  // a 3D-ish slab: metal side extrusion, glass/colour face, bevel light, sweeping gleam
  function slab(c, x, y, w, h, sk, o = {}) {
    const dep = o.depth ?? 14;
    if (dep) {
      c.fillStyle = o.side || '#05070c';
      c.beginPath(); c.moveTo(x + w + sk, y); c.lineTo(x + w + sk + dep * 0.5, y + dep); c.lineTo(x + w + dep * 0.5, y + h + dep); c.lineTo(x + dep * 0.5, y + h + dep); c.lineTo(x, y + h); c.lineTo(x + w, y + h); c.closePath(); c.fill();
      const sg = c.createLinearGradient(0, y + h, 0, y + h + dep); sg.addColorStop(0, '#9aa6b8'); sg.addColorStop(1, '#1b2130');
      c.fillStyle = sg; c.beginPath(); c.moveTo(x, y + h); c.lineTo(x + w, y + h); c.lineTo(x + w + dep * 0.5, y + h + dep); c.lineTo(x + dep * 0.5, y + h + dep); c.closePath(); c.fill();
    }
    para(c, x, y, w, h, sk);
    c.fillStyle = o.face || metalGrad(c, y, h, o.tint); c.fill();
    c.save(); para(c, x, y, w, h, sk); c.clip();
    if (o.stripes) { c.strokeStyle = `rgba(255,255,255,${o.stripes})`; c.lineWidth = 2; for (let k = -h; k < w + h; k += 14) { c.beginPath(); c.moveTo(x + k, y + h); c.lineTo(x + k + h * 0.6, y); c.stroke(); } }
    const gl = c.createLinearGradient(0, y, 0, y + h);
    gl.addColorStop(0, 'rgba(255,255,255,0.28)'); gl.addColorStop(0.48, 'rgba(255,255,255,0.06)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,0,0.25)');
    c.fillStyle = gl; c.fillRect(x - 10, y, w + Math.abs(sk) + 20, h);
    if (o.gleam != null && o.gleam > -0.3 && o.gleam < 1.3) {
      const gx = x + (w + 400) * o.gleam - 200;
      const gg = c.createLinearGradient(gx - 90, 0, gx + 90, 0);
      gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,255,255,0.55)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = gg; c.beginPath(); c.moveTo(gx - 60 + h * 0.5, y); c.lineTo(gx + 60 + h * 0.5, y); c.lineTo(gx + 60 - h * 0.2, y + h); c.lineTo(gx - 60 - h * 0.2, y + h); c.closePath(); c.fill();
      c.globalCompositeOperation = 'source-over';
    }
    c.restore();
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + sk, y + 1); c.lineTo(x + w + sk, y + 1); c.stroke();
    if (o.edge) { c.strokeStyle = o.edge; c.lineWidth = o.edgeW || 3; para(c, x, y, w, h, sk); c.stroke(); }
  }
  function chrome(c, s, x, y, size, o = {}) {
    c.save();
    c.font = sFont(size, o.weight || 900, o.italic !== false);
    c.textAlign = o.align || 'center'; c.textBaseline = 'alphabetic';
    setLS(c, o.ls || 0);
    const top = y - size * 0.72;
    if (o.depth !== 0) {
      const d = o.depth || Math.max(3, size * 0.035);
      c.fillStyle = o.edge || '#060912';
      for (let k = Math.ceil(d); k > 0; k--) c.fillText(s, x + k * 0.5, y + k);
    }
    let g = o.fill;
    if (!g) {
      g = c.createLinearGradient(0, top, 0, y);
      const tn = o.tint || [255, 255, 255];
      g.addColorStop(0, rgba(mix(tn, [255, 255, 255], 0.8))); g.addColorStop(0.44, rgba(mix(tn, [200, 210, 225], 0.5)));
      g.addColorStop(0.5, rgba(mix(tn, [60, 70, 86], 0.6))); g.addColorStop(0.56, rgba(mix(tn, [255, 255, 255], 0.7))); g.addColorStop(1, rgba(mix(tn, [150, 160, 176], 0.5)));
    }
    c.fillStyle = g; c.fillText(s, x, y);
    if (o.gleam != null && o.gleam > -0.3 && o.gleam < 1.3) {
      const w = c.measureText(s).width, x0 = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
      const gx = x0 - 160 + (w + 320) * o.gleam;
      const gg = c.createLinearGradient(gx - 110, top, gx + 110, y);
      gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,255,255,0.95)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
      c.globalCompositeOperation = 'lighter'; c.fillStyle = gg; c.fillText(s, x, y);
    }
    c.restore();
  }
  function txt(c, s, x, y, size, col, o = {}) {
    c.font = sFont(size, o.weight || 700, o.italic !== false); c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic';
    setLS(c, o.ls || 0); c.fillStyle = col; c.fillText(s, x, y); setLS(c, 0);
  }
  function streak(c, x, y, len, th, col, a) {
    if (a <= 0.01) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    let g = c.createLinearGradient(x - len / 2, 0, x + len / 2, 0);
    g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.5, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.fillRect(x - len / 2, y - th / 2, len, th);
    g = c.createLinearGradient(x - len * 0.3, 0, x + len * 0.3, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(x - len * 0.3, y - th * 0.15, len * 0.6, th * 0.3);
    c.restore();
  }
  function flare(c, x, y, s, a, tint = [255, 214, 150]) {
    if (a <= 0.01) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    let g = c.createRadialGradient(x, y, 0, x, y, 300 * s);
    g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.12, rgba(tint, a * 0.6)); g.addColorStop(1, rgba(tint, 0));
    c.fillStyle = g; c.fillRect(x - 300 * s, y - 300 * s, 600 * s, 600 * s);
    c.save(); c.translate(x, y); c.scale(1, 0.016);
    g = c.createRadialGradient(0, 0, 0, 0, 0, 1500 * s);
    g.addColorStop(0, `rgba(200,225,255,${a})`); g.addColorStop(0.4, `rgba(90,150,255,${a * 0.35})`); g.addColorStop(1, 'rgba(60,120,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1500 * s, 0, TAU); c.fill();
    c.restore();
    const dx = 960 - x, dy = 540 - y;
    [[0.5, 40, [120, 200, 255]], [0.8, 18, [255, 180, 90]], [1.25, 70, [140, 255, 200]], [1.6, 30, [255, 120, 200]]].forEach(([k, r, col]) => {
      const gx = x + dx * k * 2, gy = y + dy * k * 2;
      g = c.createRadialGradient(gx, gy, 0, gx, gy, r * s * 1.6);
      g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.7, rgba(col, a * 0.18)); g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g; c.beginPath(); c.arc(gx, gy, r * s * 1.6, 0, TAU); c.fill();
    });
    c.restore();
  }
  // background: deep arena navy, rotating beams, perspective grid floor, bokeh
  function sBg(c, t, W, H, tint) {
    const g = c.createRadialGradient(W / 2, H * 0.42, 50, W / 2, H * 0.5, W * 0.75);
    const tn = tint || [16, 34, 80];
    g.addColorStop(0, rgba(tn)); g.addColorStop(0.55, rgba(mix(tn, S_NAVY, 0.7))); g.addColorStop(1, '#010206');
    c.fillStyle = g; c.fillRect(-60, -60, W + 120, H + 120);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 6; k++) {
      const a = Math.sin(t * 0.6 + k * 1.7) * 0.35 + (k - 2.5) * 0.28, x0 = W * (0.1 + k * 0.16);
      const bg = c.createLinearGradient(x0, -40, x0 + Math.sin(a) * 900, H);
      bg.addColorStop(0, 'rgba(150,190,255,0.10)'); bg.addColorStop(1, 'rgba(150,190,255,0)');
      c.fillStyle = bg; c.beginPath(); c.moveTo(x0 - 10, -40); c.lineTo(x0 + 10, -40); c.lineTo(x0 + Math.sin(a) * 1100 + 160, H + 40); c.lineTo(x0 + Math.sin(a) * 1100 - 160, H + 40); c.closePath(); c.fill();
    }
    for (let i = 0; i < 26; i++) {
      const x = (hash(i * 3.3) * W * 1.2 - W * 0.1 + t * (10 + hash(i) * 30)) % (W * 1.2), y = hash(i * 5.1) * H * 0.5;
      const r = 12 + hash(i * 7.7) * 40;
      const bg = c.createRadialGradient(x, y, 0, x, y, r);
      bg.addColorStop(0, `rgba(190,215,255,${0.04 + hash(i * 2.2) * 0.1})`); bg.addColorStop(1, 'rgba(190,215,255,0)');
      c.fillStyle = bg; c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    c.restore();
    // floor grid
    const hz = H * 0.66;
    c.save();
    c.strokeStyle = 'rgba(120,170,255,0.10)'; c.lineWidth = 1.5;
    for (let k = -18; k <= 18; k++) { c.beginPath(); c.moveTo(W / 2 + k * 30, hz); c.lineTo(W / 2 + k * 260, H + 40); c.stroke(); }
    for (let k = 0; k < 14; k++) { const z = ((k + (t * 1.6) % 1) / 14); const y = hz + Math.pow(z, 2.2) * (H - hz + 60); c.globalAlpha = z; c.beginPath(); c.moveTo(-40, y); c.lineTo(W + 40, y); c.stroke(); }
    c.restore();
    const fg = c.createLinearGradient(0, hz - 60, 0, hz + 40);
    fg.addColorStop(0, 'rgba(80,140,255,0)'); fg.addColorStop(0.6, 'rgba(80,140,255,0.12)'); fg.addColorStop(1, 'rgba(80,140,255,0)');
    c.fillStyle = fg; c.fillRect(0, hz - 60, W, 100);
  }
  // crests (fictional): Titans trident shield, Wolves angular wolf badge. Unit size ~ radius 1.
  function crestTitans(c, x, y, s, flip = 1) {
    c.save(); c.translate(x, y); c.scale(s * flip, s);
    const sh = () => { c.beginPath(); c.moveTo(-0.82, -0.86); c.lineTo(-0.3, -0.98); c.lineTo(0, -0.88); c.lineTo(0.3, -0.98); c.lineTo(0.82, -0.86); c.lineTo(0.8, -0.1); c.quadraticCurveTo(0.72, 0.62, 0, 1.02); c.quadraticCurveTo(-0.72, 0.62, -0.8, -0.1); c.closePath(); };
    sh(); c.fillStyle = metalGrad(c, -1, 2, [190, 150, 60]); c.fill();
    c.scale(0.86, 0.86); sh();
    let g = c.createLinearGradient(0, -1, 0, 1); g.addColorStop(0, '#ff3a52'); g.addColorStop(0.5, '#c4122e'); g.addColorStop(1, '#5c0414');
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 0.035; c.scale(0.9, 0.9); sh(); c.stroke();
    // trident
    c.fillStyle = '#fff6e0';
    c.beginPath(); c.rect(-0.055, -0.3, 0.11, 1.0); c.fill();
    c.lineWidth = 0.11; c.strokeStyle = '#fff6e0'; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(-0.38, -0.42); c.quadraticCurveTo(-0.38, -0.05, 0, -0.05); c.quadraticCurveTo(0.38, -0.05, 0.38, -0.42); c.stroke();
    c.beginPath(); c.moveTo(0, -0.88); c.lineTo(0.13, -0.62); c.lineTo(0.055, -0.62); c.lineTo(0.055, -0.3); c.lineTo(-0.055, -0.3); c.lineTo(-0.055, -0.62); c.lineTo(-0.13, -0.62); c.closePath(); c.fill();
    [-1, 1].forEach(d => { c.beginPath(); c.moveTo(d * 0.38, -0.72); c.lineTo(d * 0.38 + 0.13, -0.44); c.lineTo(d * 0.38 - 0.13, -0.44); c.closePath(); c.fill(); });
    c.fillStyle = '#ffc42c'; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 0.06 : 0.14; c.lineTo(Math.cos(a) * r, 0.5 + Math.sin(a) * r); } c.closePath(); c.fill();
    g = c.createLinearGradient(0, -1, 0, 0.2); g.addColorStop(0, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(-0.8, -0.86); c.lineTo(0.8, -0.86); c.lineTo(0.8, -0.2); c.quadraticCurveTo(0, 0.05, -0.8, -0.2); c.closePath(); c.fill();
    c.restore();
  }
  function crestWolves(c, x, y, s, flip = 1) {
    c.save(); c.translate(x, y); c.scale(s * flip, s);
    const hx = (r) => { c.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 1.05); } c.closePath(); };
    hx(1.02); c.fillStyle = metalGrad(c, -1, 2, [150, 165, 185]); c.fill();
    hx(0.88);
    let g = c.createLinearGradient(0, -1, 0, 1); g.addColorStop(0, '#3a9bff'); g.addColorStop(0.5, '#0f57d6'); g.addColorStop(1, '#041c5e');
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(220,240,255,0.9)'; c.lineWidth = 0.035; hx(0.8); c.stroke();
    const head = [[-0.46, -0.66], [-0.2, -0.34], [0, -0.4], [0.2, -0.34], [0.46, -0.66], [0.52, -0.12], [0.38, 0.2], [0.16, 0.38], [0, 0.66], [-0.16, 0.38], [-0.38, 0.2], [-0.52, -0.12]];
    c.fillStyle = '#eaf4ff'; c.beginPath(); head.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill();
    c.fillStyle = '#9fb6d6';
    c.beginPath(); c.moveTo(0, -0.4); c.lineTo(0.2, -0.34); c.lineTo(0.38, 0.2); c.lineTo(0.16, 0.38); c.lineTo(0, 0.66); c.closePath(); c.fill();
    c.fillStyle = '#0a2a6e';
    c.beginPath(); c.moveTo(-0.34, -0.5); c.lineTo(-0.24, -0.38); c.lineTo(-0.36, -0.2); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(0.34, -0.5); c.lineTo(0.24, -0.38); c.lineTo(0.36, -0.2); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-0.3, -0.06); c.lineTo(-0.1, 0.0); c.lineTo(-0.26, 0.06); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(0.3, -0.06); c.lineTo(0.1, 0.0); c.lineTo(0.26, 0.06); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-0.08, 0.5); c.lineTo(0.08, 0.5); c.lineTo(0, 0.62); c.closePath(); c.fill();
    g = c.createLinearGradient(0, -1, 0, 0.1); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; hx(0.88); c.fill();
    c.restore();
  }
  function chevron(c, x, y, s, a = 1) {
    c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha *= a;
    const P = (o, i) => { c.beginPath(); c.moveTo(-1, 0.62); c.lineTo(0, -0.86); c.lineTo(1, 0.62); c.lineTo(o, 0.62); c.lineTo(0, i); c.lineTo(-o, 0.62); c.closePath(); };
    P(0.56, -0.18); c.fillStyle = metalGrad(c, -0.9, 1.6, [200, 150, 30]); c.fill();
    c.strokeStyle = 'rgba(255,240,200,0.9)'; c.lineWidth = 0.03; c.stroke();
    c.beginPath(); c.moveTo(-0.42, 0.62); c.lineTo(0, 0.02); c.lineTo(0.42, 0.62); c.lineTo(0.22, 0.62); c.lineTo(0, 0.32); c.lineTo(-0.22, 0.62); c.closePath();
    c.fillStyle = metalGrad(c, 0, 0.62, [210, 220, 235]); c.fill();
    c.restore();
  }
  // motion smear: draw fn at trailing offsets with falling alpha
  function smear(c, dx, dy, n, fn) {
    if (Math.abs(dx) + Math.abs(dy) < 2) { fn(); return; }
    for (let k = n; k >= 1; k--) { c.save(); c.globalAlpha *= 0.12; c.translate(-dx * k / n, -dy * k / n); fn(); c.restore(); }
    fn();
  }
  // a 0→1 slam with overshoot, plus its velocity (for smears)
  const slamP = (t, a, d = 0.16) => { const u = seg(t, a, a + d); return u < 1 ? E.inQ(u) : 1 + Math.sin((t - a - d) * 26) * Math.exp(-(t - a - d) * 9) * 0.03; };
  const slamV = (t, a, d = 0.16) => { const u = seg(t, a, a + d); return u > 0 && u < 1 ? 2 * u : 0; };

  /* ---- 0 – 1.55 the open: streaks, plate, "THE FINAL" ---- */
  function sOpen(c, t, W, H) {
    for (let k = 0; k < 7; k++) {
      const st = 0.04 + k * 0.05, u = seg(t, st, st + 0.32);
      if (u > 0 && u < 1) { const dir = k % 2 ? -1 : 1; streak(c, W / 2 + dir * lerp(-1600, 1600, E.inQ(u)), 380 + k * 52, 900, 6 + (k % 3) * 4, k % 3 ? S_GOLD : [120, 190, 255], 0.9 * Math.sin(Math.PI * u)); }
    }
    const ex = E.inC(seg(t, 1.36, 1.56));
    c.save(); c.translate(-ex * 2600, 0);
    const p = slamP(t, 0.36, 0.14), v = slamV(t, 0.36, 0.14);
    if (t > 0.36) {
      smear(c, -v * 260, 0, 6, () => slab(c, lerp(1900, 330, p), 420, 1260, 236, -40, { depth: 18, tint: [34, 40, 54], gleam: seg(t, 0.8, 1.35), edge: 'rgba(255,196,44,0.9)', edgeW: 3 }));
      c.fillStyle = rgba(S_RED); para(c, lerp(1900, 330, p) - 34, 420, 26, 236, -40); c.fill();
    }
    const q = seg(t, 0.44, 0.52);
    if (q > 0) {
      const sc = lerp(1.9, 1, E.outQt(q)) + Math.sin((t - 0.52) * 30) * Math.exp(-(t - 0.52) * 10) * 0.02 * (t > 0.52);
      c.save(); c.translate(W / 2, 600); c.scale(sc, sc); c.globalAlpha = clamp(q * 2);
      chrome(c, 'THE FINAL', 0, 0, 220, { ls: 6, gleam: seg(t, 0.95, 1.4) });
      c.restore();
    }
    const sb = E.outQt(seg(t, 0.72, 0.92));
    if (sb > 0) {
      c.save(); c.beginPath(); c.rect(0, 0, lerp(560, W, sb), H); c.clip();
      slab(c, 640, 676, 640, 54, -14, { depth: 8, face: rgba(S_GOLD), gleam: seg(t, 1.0, 1.4) });
      txt(c, 'CHAMPIONSHIP  ·  LIVE FROM HARBOR CITY', 960, 714, 34, '#0b0f1a', { align: 'center', weight: 800, ls: 4 });
      c.restore();
    }
    const lv = E.outB(seg(t, 0.9, 1.1));
    if (lv > 0) {
      c.save(); c.translate(160, 140); c.scale(lv, lv);
      slab(c, -70, -26, 140, 52, -10, { depth: 6, face: rgba(S_RED) });
      c.fillStyle = '#fff'; c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 12); c.beginPath(); c.arc(-40, 0, 9, 0, TAU); c.fill(); c.globalAlpha = 1;
      txt(c, 'LIVE', 12, 13, 36, '#fff', { align: 'center', weight: 900 });
      c.restore();
    }
    c.restore();
    flare(c, W / 2 + 420, 470, 1.1, decay(t, 0.5, 4) * 1.0);
  }

  /* ---- 1.5 – 3.75 matchup ---- */
  function sMatch(c, t, W, H) {
    const pl = slamP(t, 1.55, 0.2), pr = slamP(t, 1.6, 0.2);
    const ex = E.inC(seg(t, 3.42, 3.72));
    const seamTop = 1060, seamBot = 860;
    // left panel
    const lx = lerp(-1400, 0, pl) - ex * 1500, rx = lerp(1400, 0, pr) + ex * 1500;
    const panel = (dx, side) => {
      c.save(); c.translate(dx, 0);
      c.beginPath();
      if (!side) { c.moveTo(-100, -40); c.lineTo(seamTop, -40); c.lineTo(seamBot, H + 40); c.lineTo(-100, H + 40); }
      else { c.moveTo(seamTop + 14, -40); c.lineTo(W + 100, -40); c.lineTo(W + 100, H + 40); c.lineTo(seamBot + 14, H + 40); }
      c.closePath();
      const a = side ? S_BLU : S_RED, b = side ? S_BLU2 : S_RED2;
      const g = c.createLinearGradient(side ? W : 0, 0, side ? seamBot : seamTop, H);
      g.addColorStop(0, rgba(mix(b, [0, 0, 0], 0.5))); g.addColorStop(0.6, rgba(b)); g.addColorStop(1, rgba(a));
      c.fillStyle = g; c.fill();
      c.save(); c.clip();
      // speed lines + halftone glow
      c.strokeStyle = 'rgba(255,255,255,0.05)'; c.lineWidth = 26;
      for (let k = -10; k < 30; k++) { const o = (k * 90 + t * 240 * (side ? -1 : 1)) % 2700; c.beginPath(); c.moveTo(o - 400, H + 40); c.lineTo(o + 200, -40); c.stroke(); }
      const cx = side ? 1400 : 520;
      const rg = c.createRadialGradient(cx, 470, 20, cx, 470, 520);
      rg.addColorStop(0, rgba(mix(a, [255, 255, 255], 0.35), 0.55)); rg.addColorStop(1, rgba(a, 0));
      c.fillStyle = rg; c.fillRect(cx - 600, -40, 1200, H + 80);
      const gl = c.createLinearGradient(0, 0, 0, H); gl.addColorStop(0, 'rgba(255,255,255,0.12)'); gl.addColorStop(0.45, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(0,0,0,0.5)');
      c.fillStyle = gl; c.fillRect(-100, -40, W + 200, H + 80);
      c.restore();
      c.restore();
    };
    smear(c, (lx - (lerp(-1400, 0, slamP(t - 0.03, 1.55, 0.2)) - ex * 1500)), 0, 5, () => panel(lx, 0));
    smear(c, (rx - (lerp(1400, 0, slamP(t - 0.03, 1.6, 0.2)) + ex * 1500)), 0, 5, () => panel(rx, 1));
    // seam light
    const sl = seg(t, 1.78, 1.9) * (1 - ex);
    if (sl > 0) {
      c.save(); c.globalCompositeOperation = 'lighter';
      c.strokeStyle = `rgba(255,255,255,${0.9 * sl})`; c.lineWidth = 4;
      c.beginPath(); c.moveTo(seamTop + 7, -40); c.lineTo(seamBot + 7, H + 40); c.stroke();
      c.strokeStyle = `rgba(160,200,255,${0.35 * sl})`; c.lineWidth = 26; c.stroke();
      c.restore();
    }
    // crests flip in
    [[0, 520, crestTitans, 1.78], [1, 1400, crestWolves, 1.86]].forEach(([side, cx, fn, t0]) => {
      const u = seg(t, t0, t0 + 0.42); if (u <= 0) return;
      const ang = (1 - E.outQt(u)) * Math.PI * 2.5;
      const sc = lerp(0.4, 1, E.outB(u)) * (1 + Math.sin((t - t0) * 2) * 0.01);
      const dx = side ? ex * 1500 : -ex * 1500;
      c.save(); c.translate(dx, 0);
      c.globalAlpha = clamp(u * 4);
      c.save(); c.globalAlpha *= 0.5; c.filter = 'blur(20px)'; c.fillStyle = 'rgba(0,0,0,0.8)'; c.beginPath(); c.ellipse(cx + 20, 690, 180 * sc, 30 * sc, 0, 0, TAU); c.fill(); c.restore();
      fn(c, cx, 440 + Math.sin(t * 1.6 + side) * 6, 190 * sc, Math.cos(ang) || 0.001);
      if (Math.abs(Math.cos(ang)) < 0.3) flare(c, cx, 440, 0.4, 0.6 * (1 - Math.abs(Math.cos(ang)) / 0.3));
      c.restore();
    });
    // names
    const nm = (side, t0) => {
      const u = seg(t, t0, t0 + 0.14); if (u <= 0) return;
      const cx = side ? 1400 : 520, dx = (side ? 1 : -1) * ((1 - E.outQt(u)) * 260 + ex * 1500);
      c.save(); c.translate(dx, 0); c.globalAlpha = clamp(u * 3);
      txt(c, side ? 'NORTHGATE' : 'HARBOR CITY', cx, 760, 40, rgba(side ? [190, 225, 255] : S_GOLD), { align: 'center', weight: 700, ls: 10 });
      chrome(c, side ? 'WOLVES' : 'TITANS', cx, 900, 156, { ls: 4, gleam: seg(t, t0 + 0.3, t0 + 0.8) });
      txt(c, side ? '11–3  ·  #2 SEED' : '12–2  ·  #1 SEED', cx, 958, 32, 'rgba(255,255,255,0.75)', { align: 'center', weight: 600, ls: 5 });
      c.restore();
    };
    nm(0, 2.0); nm(1, 2.25);
    // VS
    const vs = seg(t, 2.5, 2.62);
    if (vs > 0) {
      const sc = lerp(2.6, 1, E.outQt(vs)) * (1 - ex * 0.6);
      c.save(); c.translate(962, 560); c.scale(sc, sc); c.globalAlpha = clamp(vs * 3) * (1 - ex);
      chrome(c, 'VS', 0, 60, 190, { tint: [255, 230, 170], gleam: seg(t, 2.7, 3.2) });
      c.restore();
      flare(c, 975, 520, 1.3, decay(t, 2.5, 3.5) * (1 - ex));
    }
  }

  /* ---- 3.7 – 5.05 head to head ---- */
  const S_ROWS = [['TOTAL YARDS', 412, 356, '412', '356'], ['PASSING YARDS', 288, 241, '288', '241'], ['RUSHING YARDS', 124, 115, '124', '115'], ['TIME OF POSSESSION', 32.2, 27.8, '32:14', '27:46']];
  function sStats(c, t, W, H) {
    const hd = slamP(t, 3.66, 0.14);
    const ex = (i) => E.inC(seg(t, 4.76 + i * 0.03, 4.96 + i * 0.03));
    c.save(); c.translate(0, lerp(-300, 0, hd) - ex(0) * 900);
    slab(c, 610, 150, 700, 96, -22, { depth: 14, tint: [30, 36, 50], gleam: seg(t, 3.9, 4.5), edge: 'rgba(255,196,44,0.8)' });
    chrome(c, 'HEAD TO HEAD', 950, 222, 72, { ls: 6, depth: 3 });
    crestTitans(c, 520, 198, 58); crestWolves(c, 1400, 198, 58);
    c.restore();
    // wipe band
    const wb = seg(t, 3.8, 4.2);
    S_ROWS.forEach((r, i) => {
      const y = 320 + i * 136, t0 = 3.78 + i * 0.07;
      const u = seg(t, t0, t0 + 0.14); if (u <= 0) return;
      const exi = ex(i + 1);
      c.save(); c.translate(-(1 - E.outQt(u)) * 600 - exi * 2400, 0); c.globalAlpha = clamp(u * 3);
      // label plate
      slab(c, 760, y, 400, 80, -14, { depth: 10, tint: [36, 42, 58] });
      txt(c, r[0], 953, y + 52, 34, '#fff', { align: 'center', weight: 800, ls: 4 });
      // bars
      const g = E.outQt(seg(t, t0 + 0.12, t0 + 0.62));
      const tot = r[1] + r[2], lw = 520 * (r[1] / tot) * 1.6 * g, rw = 520 * (r[2] / tot) * 1.6 * g;
      slab(c, 752 - lw, y + 12, lw, 56, -10, { depth: 8, face: (() => { const gg = c.createLinearGradient(752 - lw, 0, 752, 0); gg.addColorStop(0, rgba(S_RED)); gg.addColorStop(1, rgba(S_RED2)); return gg; })() });
      slab(c, 1168, y + 12, rw, 56, -10, { depth: 8, face: (() => { const gg = c.createLinearGradient(1168, 0, 1168 + rw, 0); gg.addColorStop(0, rgba(S_BLU2)); gg.addColorStop(1, rgba(S_BLU)); return gg; })() });
      const cnt = (v, s) => { if (!s.includes(':')) return String(Math.round(v * g)); const [mm, ss] = s.split(':').map(Number), tot = Math.round((mm * 60 + ss) * g); return `${Math.floor(tot / 60)}:${String(tot % 60).padStart(2, '0')}`; };
      chrome(c, cnt(r[1], r[3]), 730 - lw, y + 62, 64, { align: 'right', depth: 3 });
      chrome(c, cnt(r[2], r[4]), 1192 + rw, y + 62, 64, { align: 'left', depth: 3 });
      c.restore();
    });
    if (wb > 0 && wb < 1) {
      const x = lerp(-300, W + 300, E.ioS(wb));
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createLinearGradient(x - 120, 0, x + 120, 0);
      g.addColorStop(0, 'rgba(255,196,44,0)'); g.addColorStop(0.5, 'rgba(255,220,140,0.55)'); g.addColorStop(1, 'rgba(255,196,44,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(x - 60 + 200, 0); c.lineTo(x + 60 + 200, 0); c.lineTo(x + 60 - 200, H); c.lineTo(x - 60 - 200, H); c.closePath(); c.fill();
      c.restore();
    }
  }

  /* ---- 4.95 – 5.6 replay stinger ---- */
  function sStinger(c, t, W, H) {
    const u = seg(t, 4.92, 5.26);
    if (u <= 0 || t >= 5.3) return;
    // dark iris closes behind the logo
    c.save();
    c.fillStyle = `rgba(2,4,12,${clamp(u * 3) * 0.85})`; c.fillRect(-60, -60, W + 120, H + 120);
    c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 12; k++) {
      const a0 = k * TAU / 12 + u * 6;
      const col = k % 2 ? S_GOLD : [110, 180, 255];
      for (const [lw, al] of [[40 + 60 * u, 0.12], [6 + 8 * u, 0.7]]) {
        c.strokeStyle = rgba(col, al * Math.sin(Math.PI * clamp(u * 1.1)));
        c.lineWidth = lw;
        c.beginPath();
        for (let s2 = 0; s2 <= 1.0001; s2 += 0.05) { const r = (60 + s2 * 1500) * (0.25 + u * 1.2), a = a0 + s2 * 2.4; const x = W / 2 + Math.cos(a) * r, y = H / 2 + Math.sin(a) * r * 0.62; s2 ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.stroke();
      }
    }
    c.restore();
    const sc = 90 * Math.pow(40, E.inQ(u));
    c.save(); c.translate(W / 2, H / 2 + 40 * u); c.rotate((1 - E.outQ(u)) * -3.0);
    chevron(c, 0, 0, sc, 1);
    c.restore();
    flare(c, W / 2, H / 2 - 60, 1.2, 0.8 * Math.sin(Math.PI * u));
    const ru = seg(t, 4.97, 5.05) * (1 - seg(t, 5.17, 5.24));
    if (ru > 0) {
      c.save(); c.translate(W / 2, 560); c.scale(lerp(1.4, 1, E.outQt(seg(t, 4.97, 5.05))), 1); c.translate(-W / 2, -560); c.globalAlpha = ru;
      slab(c, 680, 500, 560, 116, -30, { depth: 14, face: rgba(S_GOLD), gleam: seg(t, 5.0, 5.2) });
      chrome(c, 'REPLAY', 946, 590, 100, { ls: 14, fill: '#0b0f1a', depth: 0 });
      c.restore();
    }
  }

  /* ---- 5.45 – 7.45 player card ---- */
  function sCard(c, t, W, H) {
    const p = slamP(t, 5.48, 0.18);
    const ex = E.inC(seg(t, 7.25, 7.45));
    const ox = lerp(1700, 0, p) - ex * 2400;
    c.save(); c.translate(ox, 0);
    // glass slab
    const face = c.createLinearGradient(260, 170, 1720, 910);
    face.addColorStop(0, 'rgba(120,10,30,0.92)'); face.addColorStop(0.45, 'rgba(40,6,14,0.9)'); face.addColorStop(1, 'rgba(12,16,30,0.95)');
    slab(c, 300, 200, 1340, 680, -70, { depth: 26, face, stripes: 0.025, gleam: seg(t, 6.45, 7.1), edge: 'rgba(255,255,255,0.35)', edgeW: 2 });
    c.save(); para(c, 300, 200, 1340, 680, -70); c.clip();
    c.font = sFont(640, 900); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    const wx = 1400 - (t - 5.5) * 24;
    const ng = c.createLinearGradient(0, 200, 0, 880); ng.addColorStop(0, 'rgba(255,255,255,0.16)'); ng.addColorStop(1, 'rgba(255,255,255,0.02)');
    c.fillStyle = ng; c.fillText('12', wx, 800);
    c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.2)'; c.strokeText('12', wx, 800);
    c.restore();
    // red/gold header strip
    slab(c, 300, 200, 1340, 22, -2, { depth: 0, face: rgba(S_GOLD) });
    crestTitans(c, 470, 340, 84);
    const nu = seg(t, 5.72, 5.86);
    if (nu > 0) {
      c.save(); c.translate((1 - E.outQt(nu)) * 200, 0); c.globalAlpha = clamp(nu * 3);
      txt(c, 'MARCUS', 590, 320, 64, 'rgba(255,255,255,0.9)', { weight: 600, ls: 8 });
      chrome(c, 'ROWE', 584, 470, 190, { align: 'left', ls: 4, gleam: seg(t, 6.0, 6.5) });
      txt(c, 'QUARTERBACK  ·  HARBOR CITY TITANS  ·  #12', 592, 530, 32, rgba(S_GOLD), { weight: 700, ls: 5 });
      c.restore();
    }
    // stat blocks
    const ST = [['PASS YDS', 348, (v) => String(Math.round(v))], ['TOUCHDOWNS', 4, (v) => String(Math.round(v))], ['COMP %', 71.4, (v) => v.toFixed(1)], ['QB RATING', 128.9, (v) => v.toFixed(1)]];
    ST.forEach(([lab, val, f], i) => {
      const t0 = 5.9 + i * 0.12, u = seg(t, t0, t0 + 0.12); if (u <= 0) return;
      const x = 420 + i * 300, y = 600;
      const k = E.outQt(seg(t, t0 + 0.05, t0 + 0.85));
      c.save(); c.translate(0, (1 - E.outQt(u)) * 60); c.globalAlpha = clamp(u * 3);
      slab(c, x, y, 270, 220, -24, { depth: 10, face: 'rgba(255,255,255,0.06)', edge: 'rgba(255,255,255,0.18)', edgeW: 1.5 });
      chrome(c, f(val * k), x + 132, y + 140, 120, { depth: 4, tint: k >= 1 && t - t0 - 0.85 < 0.3 ? [255, 230, 160] : [255, 255, 255] });
      txt(c, lab, x + 132, y + 190, 28, rgba(S_GOLD), { align: 'center', weight: 700, ls: 5 });
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x + 22, y + 204, 220, 5);
      c.fillStyle = rgba(S_RED); c.fillRect(x + 22, y + 204, 220 * k * [0.88, 0.8, 0.714, 0.83][i], 5);
      c.restore();
    });
    c.restore();
    streak(c, lerp(-400, W + 400, E.ioS(seg(t, 6.4, 6.9))), 210, 1200, 8, S_GOLD, 0.9 * Math.sin(Math.PI * seg(t, 6.4, 6.9)));
  }

  /* ---- 7.4 – 8.75 live: field, score bug, lower third, ticker, touchdown ---- */
  function sField(fc, t) {
    const w = fc.canvas.width, h = fc.canvas.height;
    fc.setTransform(1, 0, 0, 1, 0, 0);
    fc.fillStyle = '#0b1408'; fc.fillRect(0, 0, w, h);
    const hz = -60, f = 300, camH = 36, camX = -8 + (t - 7.4) * 6;
    const P = (X, Z) => [w / 2 + (X - camX) * f / Z, hz + camH * f / Z];
    const Z0 = 26, Z1 = 90;
    // stands + crowd behind the far sideline
    fc.fillStyle = '#0d1018'; fc.fillRect(0, 0, w, 64);
    for (let i = 0; i < 900; i++) {
      const x = hash(i * 1.37) * w, y = 4 + hash(i * 2.71) * 54;
      fc.fillStyle = `rgba(${150 + hash(i) * 100},${120 + hash(i * 3) * 100},${120 + hash(i * 5) * 120},${0.25 + 0.3 * hash(i * 7)})`;
      fc.fillRect(x, y, 1.6, 1.6);
    }
    for (let i = 0; i < 6; i++) { const ph = (t * 3 + hash(i)) % 1; if (ph < 0.15) { fc.fillStyle = 'rgba(255,255,255,0.9)'; fc.fillRect(hash(i * 9 + Math.floor(t * 3)) * w, 6 + hash(i * 4 + Math.floor(t * 3)) * 50, 2, 2); } }
    fc.fillStyle = '#1a2a6a'; fc.fillRect(0, 56, w, 6);
    for (let X = -60; X < 60; X += 5) {
      const a = P(X, Z0), b = P(X + 5, Z0), c2 = P(X + 5, Z1), d = P(X, Z1);
      fc.fillStyle = (Math.round(X / 5) % 2 === 0) ? '#2f6b26' : '#285e20';
      if (X < -50 || X >= 50) fc.fillStyle = X < 0 ? '#7a1020' : '#123a8a';
      fc.beginPath(); fc.moveTo(a[0], a[1]); fc.lineTo(b[0], b[1]); fc.lineTo(c2[0], c2[1]); fc.lineTo(d[0], d[1]); fc.closePath(); fc.fill();
      fc.strokeStyle = 'rgba(255,255,255,0.75)'; fc.lineWidth = 1.2;
      fc.beginPath(); fc.moveTo(a[0], a[1]); fc.lineTo(d[0], d[1]); fc.stroke();
    }
    fc.strokeStyle = 'rgba(255,255,255,0.8)'; fc.lineWidth = 2;
    [Z0, Z1].forEach(Z => { const a = P(-60, Z), b = P(60, Z); fc.beginPath(); fc.moveTo(a[0], a[1]); fc.lineTo(b[0], b[1]); fc.stroke(); });
    // players
    for (let i = 0; i < 22; i++) {
      const tm = i < 11, X = (tm ? -4 : 4) + (hash(i * 3.1) - 0.5) * 18 + (t - 7.4) * (tm ? 9 : 7) * (0.6 + hash(i)), Z = 38 + hash(i * 5.7) * 40;
      const p = P(X, Z), s = 600 / Z;
      fc.fillStyle = tm ? '#e81c36' : '#f2f2f2';
      fc.beginPath(); fc.ellipse(p[0], p[1] - s * 0.5, s * 0.22, s * 0.5, 0, 0, TAU); fc.fill();
      fc.fillStyle = 'rgba(0,0,0,0.3)'; fc.beginPath(); fc.ellipse(p[0] + s * 0.2, p[1], s * 0.3, s * 0.08, 0, 0, TAU); fc.fill();
    }
    const g = fc.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(0.3, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
    fc.fillStyle = g; fc.fillRect(0, 0, w, h);
  }
  function sLive(c, t, W, H, st) {
    sField(st.fc, t);
    c.save(); c.imageSmoothingQuality = 'high';
    c.filter = 'blur(3px) saturate(0.85) brightness(0.8)';
    c.drawImage(st.F, -20, -20, W + 40, H + 40);
    c.restore();
    c.fillStyle = 'rgba(2,6,18,0.18)'; c.fillRect(0, 0, W, H);
    // score bug
    const bu = E.outQt(seg(t, 7.45, 7.68));
    if (bu > 0) {
      c.save(); c.beginPath(); c.rect(0, 0, lerp(70, 1100, bu), 200); c.clip();
      const X = 70, Y = 62;
      slab(c, X, Y, 980, 76, -12, { depth: 8, tint: [22, 28, 42] });
      c.fillStyle = rgba(S_GOLD); para(c, X, Y, 100, 76, -12); c.fill();
      chevron(c, X + 44, Y + 40, 26);
      // titans cell
      const td = seg(t, 8.0, 8.12);
      c.fillStyle = rgba(S_RED); para(c, X + 104, Y, 250, 76, -12); c.fill();
      crestTitans(c, X + 140, Y + 38, 26);
      txt(c, 'TTN', X + 176, Y + 54, 40, '#fff', { weight: 800, ls: 2 });
      const sc1 = td < 0.5 ? '21' : '27';
      c.save(); c.beginPath(); c.rect(X + 260, Y, 90, 76); c.clip();
      const fy = td > 0 && td < 1 ? Math.sin(td * Math.PI) * 30 : 0;
      chrome(c, sc1, X + 302, Y + 60 + fy, 62, { depth: 2 });
      c.restore();
      if (t > 8.0) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,255,255,${0.8 * decay(t, 8.0, 5)})`; para(c, X + 104, Y, 250, 76, -12); c.fill(); c.restore(); }
      c.fillStyle = rgba(S_BLU2); para(c, X + 358, Y, 250, 76, -12); c.fill();
      crestWolves(c, X + 394, Y + 38, 26);
      txt(c, 'WLV', X + 430, Y + 54, 40, '#fff', { weight: 800, ls: 2 });
      chrome(c, '17', X + 556, Y + 60, 62, { depth: 2 });
      const clk = Math.max(0, 167 - Math.floor((t - 7.45) * 1));
      txt(c, '4TH', X + 640, Y + 52, 36, rgba(S_GOLD), { weight: 800 });
      txt(c, `${Math.floor(clk / 60)}:${String(clk % 60).padStart(2, '0')}`, X + 700, Y + 52, 36, '#fff', { weight: 700 });
      txt(c, t < 8.0 ? '2ND & 6' : 'TD', X + 820, Y + 52, 32, t < 8.0 ? 'rgba(255,255,255,0.8)' : rgba(S_GOLD), { weight: 800, ls: 2 });
      c.restore();
    }
    // lower third
    const lu = E.outQt(seg(t, 7.6, 7.84));
    if (lu > 0) {
      c.save(); c.beginPath(); c.rect(0, 760, lerp(120, 1300, lu), 200); c.clip();
      slab(c, 130, 806, 110, 104, -16, { depth: 10, face: rgba(S_RED) });
      chrome(c, '12', 180, 882, 74, { depth: 2 });
      slab(c, 246, 806, 760, 64, -10, { depth: 8, face: '#f4f6fa' });
      txt(c, 'MARCUS ROWE', 272, 854, 52, '#0b0f1a', { weight: 900, ls: 2 });
      txt(c, 'QB  ·  HARBOR CITY', 668, 852, 30, 'rgba(11,15,26,0.6)', { weight: 700, ls: 3 });
      slab(c, 240, 870, 640, 40, -6, { depth: 6, tint: [20, 26, 40] });
      txt(c, '3 TD  ·  348 YDS  ·  NO INT TONIGHT', 266, 900, 28, rgba(S_GOLD), { weight: 700, ls: 3 });
      c.restore();
    }
    // ticker
    const tu = E.outQt(seg(t, 7.5, 7.75));
    if (tu > 0) {
      c.save(); c.translate(0, (1 - tu) * 90);
      c.fillStyle = 'rgba(6,10,22,0.92)'; c.fillRect(0, 1000, W, 56);
      c.fillStyle = rgba(S_GOLD); c.fillRect(0, 1000, W, 3);
      c.save(); c.beginPath(); c.rect(250, 1000, W, 56); c.clip();
      const s = 'AROUND THE LEAGUE   ·   RIVERTON HAWKS 24  –  17 BAYSIDE MARINERS  FINAL   ·   SUMMIT KNIGHTS 10  –  13 PORTLAND FORGE  3RD   ·   NEXT: CHAMPIONSHIP POSTGAME LIVE   ·   ';
      txt(c, s + s, 270 - ((t - 7.5) * 260) % 1400, 1040, 30, '#fff', { weight: 600, ls: 3, italic: false });
      c.restore();
      slab(c, 0, 1000, 240, 56, 0, { depth: 0, face: rgba(S_RED) });
      txt(c, 'APEX  NEWS', 120, 1040, 32, '#fff', { align: 'center', weight: 900, ls: 3 });
      c.restore();
    }
    // TOUCHDOWN
    const tdu = seg(t, 8.0, 8.12);
    if (tdu > 0) {
      const sc = lerp(2.2, 1, E.outQt(tdu));
      streak(c, W / 2, 540, 2400 * tdu, 30, S_GOLD, decay(t, 8.0, 2.5));
      c.save(); c.translate(W / 2, 540); c.scale(sc, sc); c.translate(-W / 2, -540);
      const band = E.outQt(seg(t, 8.0, 8.1));
      slab(c, lerp(W / 2, -100, band), 420, lerp(0, W + 200, band), 210, -60, { depth: 18, face: (() => { const g = c.createLinearGradient(0, 420, 0, 630); g.addColorStop(0, '#ff3a52'); g.addColorStop(1, '#7a0616'); return g; })(), stripes: 0.05, gleam: seg(t, 8.15, 8.6), edge: rgba(S_GOLD), edgeW: 4 });
      chrome(c, 'TOUCHDOWN', W / 2, 600, 200, { ls: 10, tint: [255, 236, 190], gleam: seg(t, 8.2, 8.7) });
      c.restore();
      flare(c, 1450, 430, 1.3, decay(t, 8.0, 3) * 1.1);
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,240,210,${0.6 * decay(t, 8.0, 10)})`; c.fillRect(0, 0, W, H); c.restore();
    }
  }

  /* ---- 8.7 – 10 flare whoosh + broadcast lockup ---- */
  function sLogo(c, t, W, H, rev) {
    const u = seg(t, 9.0, 9.35);
    c.save(); c.globalCompositeOperation = 'lighter';
    const lg = c.createRadialGradient(960, 470, 20, 960, 470, 700);
    lg.addColorStop(0, 'rgba(90,140,255,0.32)'); lg.addColorStop(1, 'rgba(90,140,255,0)');
    c.fillStyle = lg; c.fillRect(0, 0, W, H);
    c.restore();
    streak(c, 960, 330, 1800, 10, [150, 200, 255], 0.5 + 0.2 * Math.sin(t * 4));
    chevron(c, 960, 360, lerp(150, 120, E.outQt(u)) , 1);
    const g = seg(t, 9.25, 9.85);
    c.save();
    chrome(c, 'APEX', 960, 600, 200, { ls: 18, gleam: g });
    txt(c, 'S P O R T S', 968, 660, 40, rgba(S_GOLD), { align: 'center', weight: 700, ls: 12, italic: false });
    c.restore();
    // final score lockup
    const lu = E.outQt(seg(t, 9.1, 9.4));
    if (lu > 0) {
      c.save(); c.beginPath(); c.rect(960 - 640 * lu, 700, 1280 * lu, 220); c.clip();
      slab(c, 360, 740, 1200, 120, -20, { depth: 14, tint: [26, 32, 48], edge: 'rgba(255,196,44,0.7)' });
      c.fillStyle = rgba(S_RED); para(c, 360, 740, 470, 120, -20); c.fill();
      c.fillStyle = rgba(S_BLU2); para(c, 1090, 740, 470, 120, -20); c.fill();
      crestTitans(c, 430, 800, 46); crestWolves(c, 1490, 800, 46);
      txt(c, 'TITANS', 490, 822, 56, '#fff', { weight: 900, ls: 3 });
      chrome(c, '27', 760, 832, 92, { depth: 3 });
      txt(c, 'FINAL', 960, 818, 40, rgba(S_GOLD), { align: 'center', weight: 800, ls: 8, italic: false });
      chrome(c, '17', 1160, 832, 92, { depth: 3 });
      txt(c, 'WOLVES', 1430, 822, 56, '#fff', { align: 'right', weight: 900, ls: 3 });
      c.restore();
    }
    flare(c, lerp(1250, 1300, seg(t, 9.0, 10)), 290, 0.8, 0.35 + 0.1 * Math.sin(t * 3));
  }

  MG.film({
    id: 'sports', dur: 10, poster: 9.4,
    fonts: [['italic 900 80px "Barlow Condensed"', 'THE FINAL'], ['900 80px "Barlow Condensed"', 'A'], ['italic 700 40px "Barlow Condensed"', 'A'], ['600 30px "Barlow Condensed"', 'A'], ['700 40px "Barlow Condensed"', 'S']],
    meta: {
      family: 'J', name: 'Sports Broadcast', sub: 'Glass, Chrome and Score Bugs', era: '1994 —',
      origin: 'Network sports packages turned into motion-design showpieces after FOX launched its NFL coverage in 1994 with the persistent score box; ESPN, Sky Sports and Olympic broadcasters then built whole branded systems of chrome type, glass panels, stingers and lower thirds, now usually run live from real-time graphics engines.',
      works: 'NFL on FOX graphics package (1994 –, FoxBox score bug) · ESPN Monday Night Football open · Sky Sports Premier League graphics · NBC Sunday Night Football · Olympic Broadcasting Services graphics (OBS) · Hockey Night in Canada',
      tech: ['Extruded slab panels: metal side face, glass front, bevel light', 'Chrome type: banded gradient fill, extrusion, gleam sweep', 'Slam-in with overshoot, motion smear and camera shake on every hit', 'Anamorphic lens flare and light streaks in additive blend'],
      accent: '#ffc42c',
      motionDNA: 'Everything arrives with violence: panels slam in on the beat with overshoot and motion smears, numbers count up and lock, a spinning logo stinger swallows the frame, and a flare sweeps on the final lockup.',
      visualDNA: 'Deep arena navy with volumetric beams, team-colour glass panels with metal edges, chrome condensed italic type, gold accents, crests, a score bug, lower third and ticker.',
      transitions: 'Slam-ins, diagonal split, whip-outs, logo stinger with flash, wipe bars, lens-flare reveal.',
      implementation: ['Vizrt', 'Chyron / Ross XPression', 'Cinema 4D + After Effects', 'Unreal Engine', 'Canvas 2D'],
      reproducibility: 'Fully procedural', loopable: false,
    },
    setup() { const F = offscreen(480, 270); return { F, fc: F.getContext('2d') }; },
    draw(c, t, W, H, st) {
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      const [sx, sy] = sShake(t);
      c.save(); c.translate(sx, sy);
      const live = t >= 7.42 && t < 8.85;
      if (!live) sBg(c, t, W, H, t > 8.8 ? [14, 30, 74] : t > 5.4 && t < 7.5 ? [70, 12, 26] : null);
      if (t < 1.6) sOpen(c, t, W, H);
      if (t >= 1.5 && t < 3.8) sMatch(c, t, W, H);
      if (t >= 3.7 && t < 5.1) sStats(c, t, W, H);
      if (t >= 5.4 && t < 7.5) sCard(c, t, W, H);
      if (live) sLive(c, t, W, H, st);
      if (t >= 8.85) sLogo(c, t, W, H);
      if (t >= 4.95 && t < 5.6) sStinger(c, t, W, H);
      c.restore();
      // stinger flash
      const fl = Math.max(decay(t, 5.25, 7) * (t >= 5.25 ? 1 : 0), seg(t, 5.15, 5.25) * (t < 5.25 ? 1 : 0));
      if (fl > 0.01) { c.fillStyle = `rgba(255,248,230,${fl})`; c.fillRect(0, 0, W, H); }
      // flare whoosh: a bright flare crosses, the logo scene appears in its wake
      const fw = seg(t, 8.68, 9.05);
      if (fw > 0 && fw < 1) {
        const x = lerp(-300, W + 300, E.ioS(fw));
        flare(c, x, 420, 1.6, Math.sin(Math.PI * fw) * 1.2, [255, 220, 170]);
        streak(c, x, 420, 2400, 60, [140, 190, 255], Math.sin(Math.PI * fw));
      }
      const fin = 1 - seg(t, 0, 0.06);
      if (fin > 0) { c.fillStyle = `rgba(0,0,0,${fin})`; c.fillRect(0, 0, W, H); }
      vignette(c, W, H, 0.45);
      grain(c, W, H, t, 0.035, 'overlay');
    },
    score(A) {
      // whoosh-in, streak zings
      A.noise(0, { type: 'bandpass', f: 300, f2: 5000, q: 1.2, dur: 0.5, g: 0.16, swell: 0.95 });
      for (let k = 0; k < 7; k++) A.noise(0.04 + k * 0.05, { type: 'bandpass', f: 7000, f2: 1600, q: 3, dur: 0.3, g: 0.05, pan: k % 2 ? 0.7 : -0.7 });
      const hit = (t0, g = 1, chord = [38, 45, 50, 53, 57]) => {
        A.impact(t0, 0.4 * g, { rev: 0.4 });
        A.kick(t0, 0.5 * g, { f: 120, f2: 38, dur: 0.6 });
        chord.forEach((m, i) => A.osc(t0, { type: 'sawtooth', f: midi(m), dur: 0.9, g: 0.03 * g, a: 0.006, lp: 1400, lp2: 500, lpT: 0.8, rev: 0.35, detune: (i - 2) * 6, pan: (i - 2) * 0.2 }));
        A.noise(t0, { type: 'highpass', f: 4500, dur: 1.6 * g, g: 0.07 * g, rev: 0.3 });
      };
      hit(0.5, 1);
      // string ostinato, 16ths, D minor progression
      const prog = [[62, 65, 69], [58, 62, 65], [55, 58, 62], [57, 61, 64]];
      for (let k = 0; k < 64; k++) {
        const tt = 0.5 + k * 0.125; if (tt > 8.55 || (tt > 4.95 && tt < 5.5)) continue;
        const ch = prog[Math.floor((tt - 0.5) / 2) % 4], pat = [0, 0, 2, 0, 1, 0, 2, 1];
        A.osc(tt, { type: 'sawtooth', f: midi(ch[pat[k % 8]] - 12), dur: 0.11, g: 0.022, lp: 2200, pan: k % 2 ? 0.35 : -0.35 });
      }
      // low pulse + taiko
      for (let b = 0; b < 16; b++) { const tt = 0.5 + b * 0.5; if (tt > 8.5 || (tt > 4.95 && tt < 5.5)) continue; A.kick(tt, 0.3, { f: 90, f2: 40, dur: 0.3 }); if (b % 2) A.snare(tt, 0.08, { f: 900 }); }
      // matchup slams
      A.whoosh(1.4, 0.2, { f1: 400, f2: 4000, g: 0.14 }); hit(1.75, 0.6, [38, 50, 57]);
      A.whoosh(1.88, 0.14, { g: 0.08 }); A.osc(2.0, { type: 'sawtooth', f: midi(45), dur: 0.35, g: 0.05, lp: 1200 }); A.osc(2.25, { type: 'sawtooth', f: midi(46), dur: 0.35, g: 0.05, lp: 1200 });
      A.kick(2.0, 0.4); A.kick(2.25, 0.4);
      A.riser(2.1, 0.4, { g: 0.08 }); hit(2.5, 0.85, [38, 45, 50, 53, 57, 62]);
      A.bell(2.52, midi(86), { g: 0.04, dur: 1.2 });
      A.whoosh(3.38, 0.34, { f1: 3000, f2: 300, g: 0.14 });
      // stats
      hit(3.75, 0.45, [41, 48, 53]);
      [3.86, 3.93, 4.0, 4.07].forEach((tt, i) => { A.noise(tt, { type: 'bandpass', f: 3200, q: 4, dur: 0.06, g: 0.08, pan: -0.3 + i * 0.2 }); A.osc(tt, { f: 880 + i * 110, dur: 0.12, g: 0.03, type: 'triangle' }); });
      for (let k = 0; k < 18; k++) A.osc(4.0 + k * 0.03, { type: 'square', f: 1600 + k * 40, dur: 0.02, g: 0.008, lp: 4000 });
      A.whoosh(4.82, 0.26, { f1: 2000, f2: 300, g: 0.1 });
      // replay stinger
      A.riser(4.55, 0.7, { g: 0.12, f: 98 });
      A.noise(4.95, { type: 'bandpass', f: 600, f2: 6000, q: 2, dur: 0.3, g: 0.14, swell: 0.9, rev: 0.3 });
      A.osc(4.95, { type: 'sawtooth', f: 200, f2: 1200, glide: 0.3, dur: 0.3, g: 0.03, lp: 3000 });
      hit(5.25, 0.7, [43, 50, 55, 59]);
      A.noise(5.25, { type: 'highpass', f: 6000, dur: 0.6, g: 0.08 });
      // player card
      hit(5.5, 0.6, [38, 45, 50, 53]);
      A.whoosh(5.7, 0.16, { g: 0.08 });
      [5.95, 6.07, 6.19, 6.31].forEach((t0, i) => {
        for (let k = 0; k < 14; k++) A.osc(t0 + k * 0.05, { type: 'square', f: 900 + k * 60 + i * 120, dur: 0.025, g: 0.007, lp: 4000, pan: (i - 1.5) * 0.3 });
        A.bell(t0 + 0.85, midi(81 + i * 2), { g: 0.025, dur: 0.6 });
      });
      A.whoosh(6.38, 0.5, { f1: 800, f2: 7000, g: 0.08 });
      A.whoosh(7.22, 0.24, { f1: 3000, f2: 300, g: 0.12 });
      // live: bug + lower third, roll into touchdown
      A.whoosh(7.42, 0.2, { f1: 500, f2: 5000, g: 0.08, pan: -0.5 }); A.bell(7.6, midi(88), { g: 0.02, dur: 0.5 });
      A.whoosh(7.58, 0.22, { f1: 400, f2: 4000, g: 0.07, pan: -0.3 });
      for (let k = 0; k < 16; k++) A.snare(7.5 + k * 0.03125, 0.03 + k * 0.006, { f: 1800, dur: 0.06, rev: 0.05 });
      A.riser(7.45, 0.55, { g: 0.12, f: 73 });
      hit(8.0, 1.0, [38, 45, 50, 54, 57, 62]);
      [62, 66, 69, 74].forEach((m, i) => A.osc(8.02, { type: 'triangle', f: midi(m), dur: 1.4, g: 0.025, a: 0.08, vib: [5, 4], rev: 0.6, pan: (i - 1.5) * 0.4 }));
      A.noise(8.0, { type: 'bandpass', f: 900, q: 0.5, dur: 1.6, g: 0.12, swell: 0.25, rev: 0.4 });
      // flare whoosh + final lockup
      A.riser(8.45, 0.55, { g: 0.08, f: 110 });
      A.whoosh(8.66, 0.42, { f1: 300, f2: 6000, g: 0.16, pan: -0.4 });
      A.whoosh(8.8, 0.35, { f1: 6000, f2: 500, g: 0.1, pan: 0.5 });
      hit(9.0, 0.9, [38, 50, 54, 57, 62]);
      [38, 50, 57, 62, 66].forEach((m, i) => A.osc(9.02, { type: 'sawtooth', f: midi(m), dur: 0.98, g: 0.02, a: 0.05, hold: true, rel: 0.6, lp: 1500, rev: 0.6, pan: (i - 2) * 0.3 }));
      A.chord(8.1, [50, 57, 62, 66], { type: 'triangle', dur: 0.9, g: 0.02, a: 0.1, hold: true, rel: 0.4, rev: 0.6, width: 1.2 });
      [86, 90, 93, 98].forEach((m, i) => A.bell(9.05 + i * 0.07, midi(m), { g: 0.025, dur: 0.9, pan: (i - 1.5) * 0.4 }));
    },
  });
  /* =====================================================================
     LUXURY BRAND MOTION — Maison Orvelle (fictional), Paris. A gold pour,
     champagne silk, light gliding over a cut-crystal flacon, a blind-
     embossed monogram under raking light, then the wordmark. Every move
     eases slow-in / slow-out; the frame keeps its silence.
     ===================================================================== */
  const BOD = '"Bodoni Moda", Didot, "Times New Roman", serif', COR = '"Cormorant Garamond", Garamond, serif';
  const LX_BG = [9, 8, 7], LX_IV = [239, 231, 216], LX_GOLD = [212, 176, 122];
  const nrm = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };

  /* ---- 0 – 2.7 gold pour ---- */
  function lxPour(c, t, st) {
    c.fillStyle = '#070605'; c.fillRect(0, 0, 1920, 1080);
    const z = lerp(1.0, 1.1, E.ioS(seg(t, 0, 2.9)));
    c.save(); c.translate(980, 690); c.scale(z, z); c.translate(-980, -690);
    let g = c.createRadialGradient(980, 480, 0, 980, 480, 1000);
    g.addColorStop(0, 'rgba(74,50,22,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(-300, -300, 2500, 1700);
    // liquid gold surface: per-pixel ripples reflecting a softbox
    const img = st.gImg, d = img.data, bw = img.width, bh = img.height;
    const top = 668, bot = 1150, hz = 600, f = 1000, camH = 80;
    const ix = 980, iy = 790, Z0 = (f * camH) / (iy - hz), X0 = ((ix - 960) * Z0) / f;
    const age = t - 0.78, amp = clamp(age * 1.2);
    for (let j = 0; j < bh; j++) {
      const sy = top + ((j + 0.5) * (bot - top)) / bh, Z = (f * camH) / (sy - hz), v = (sy - top) / (bot - top);
      const fz = ((f * camH) / ((sy - hz) * (sy - hz))) * ((bot - top) / bh), aa = Math.exp(-Math.pow((0.2 * fz) / 1.4, 2)), aa2 = Math.exp(-Math.pow((0.42 * fz) / 1.4, 2));
      for (let i = 0; i < bw; i++) {
        const sx = ((i + 0.5) * 1920) / bw, X = ((sx - 960) * Z) / f;
        const dx = X - X0, dz = Z - Z0, r = Math.hypot(dx, dz) + 1e-3;
        let sl = 0;
        if (amp > 0 && r < age * 260) { const e = Math.exp(-r * 0.0045) * sstep(age * 260, age * 260 - 40, r); sl = (Math.cos(r * 0.2 - t * 6) * 0.75 * aa + Math.cos(r * 0.42 - t * 9 + 1) * 0.25 * aa2) * e * amp; }
        const sw = 0.5 * Math.sin(X * 0.03 + t * 0.8) + 0.35 * Math.sin(Z * 0.045 - t * 0.6 + X * 0.012);
        const nz = (sl * dz) / r * 0.5 + sw * 0.05, nx = (sl * dx) / r * 0.5;
        const rv = v * 0.9 + nz * 0.9, ru = (sx - 960) / 1100 + nx * 1.1;
        const lat = Math.exp(-Math.pow(ru / 0.7, 6));
        const band = Math.exp(-Math.pow((rv - 0.3) / 0.05, 2)) * lat;
        const band2 = Math.exp(-Math.pow((rv - 0.07) / 0.03, 2)) * 0.75;
        const glow = Math.exp(-r * 0.018) * 0.3 * clamp(age * 2);
        const L = 0.05 + 0.32 * Math.pow(1 - v, 3) * (1 + nz * 2) + band * 1.25 + band2 * (0.4 + 0.6 * lat) + glow;
        const T = 1 - Math.exp(-L * 1.7);
        const k = (j * bw + i) * 4;
        d[k] = 255 * Math.min(1, T * 1.04 + T * T * 0.25);
        d[k + 1] = 255 * Math.min(1, T * 0.78 + T * T * T * 0.4);
        d[k + 2] = 255 * Math.min(1, T * 0.42 + Math.pow(T, 4) * 0.55);
        d[k + 3] = 255;
      }
    }
    st.gc.putImageData(img, 0, 0);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(st.G, 0, top, 1920, bot - top);
    g = c.createLinearGradient(0, top - 2, 0, top + 80);
    g.addColorStop(0, 'rgba(7,6,5,1)'); g.addColorStop(1, 'rgba(7,6,5,0)');
    c.fillStyle = g; c.fillRect(-300, top - 2, 2500, 82);
    // the stream
    const yTop = -80, head = lerp(yTop, iy, E.inQ(seg(t, 0.1, 0.78)));
    if (t > 0.1) {
      const L = [], R = [];
      for (let y = yTop; y <= head; y += 10) {
        const k = (y - yTop) / (iy - yTop);
        const x = ix + Math.sin(y * 0.012 - t * 3) * 3 * k + vnoise(y * 0.004 - t * 1.4, 2) * 5 * k;
        const w = lerp(15, 7.5, Math.sqrt(k)) * (y > head - 30 ? 0.6 + 0.4 * (head - y) / 30 : 1);
        L.push([x - w, y]); R.push([x + w, y]);
      }
      if (L.length > 1) {
        g = c.createLinearGradient(ix - 16, 0, ix + 16, 0);
        g.addColorStop(0, '#2e1904'); g.addColorStop(0.22, '#a8701f'); g.addColorStop(0.38, '#fff2c4'); g.addColorStop(0.5, '#e6b04e'); g.addColorStop(0.78, '#7a4c12'); g.addColorStop(1, '#2a1603');
        c.fillStyle = g;
        c.beginPath(); L.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
        for (let i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
        c.closePath(); c.fill();
        // glints sliding down the stream
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 7; k++) {
          const y = yTop + ((hash(k * 3.1) * 900 + t * 520) % (head - yTop));
          const kk = (y - yTop) / (iy - yTop), x = ix - 3 + Math.sin(y * 0.012 - t * 3) * 3 * kk;
          c.save(); c.translate(x, y); c.scale(0.35, 1.6);
          const gg = c.createRadialGradient(0, 0, 0, 0, 0, 22);
          gg.addColorStop(0, 'rgba(255,248,220,0.45)'); gg.addColorStop(1, 'rgba(255,220,150,0)');
          c.fillStyle = gg; c.fillRect(-22, -22, 44, 44); c.restore();
        }
        c.restore();
      }
    }
    // crown + slow-motion droplets at the impact
    if (age > 0) {
      const tau = age * 0.55;
      const cr = c.createRadialGradient(ix, iy, 0, ix, iy, 120);
      cr.addColorStop(0, `rgba(255,236,190,${0.55 * Math.exp(-age * 0.6)})`); cr.addColorStop(1, 'rgba(255,200,120,0)');
      c.save(); c.globalCompositeOperation = 'lighter'; c.translate(ix, iy); c.scale(1, 0.3); c.fillStyle = cr; c.fillRect(-120, -120, 240, 240); c.restore();
      c.strokeStyle = `rgba(255,230,170,${0.6 * Math.exp(-age * 1.6)})`; c.lineWidth = 2;
      c.beginPath(); c.ellipse(ix, iy, 16 + age * 90, (16 + age * 90) * 0.22, 0, 0, TAU); c.stroke();
      const R2 = rng(5);
      for (let k = 0; k < 18; k++) {
        const a = -Math.PI / 2 + (R2() - 0.5) * 2.2, v0 = 260 + R2() * 420, sz = 2.5 + R2() * 6;
        const x = ix + Math.cos(a) * v0 * tau, y = iy + Math.sin(a) * v0 * tau * 0.8 + 0.5 * 1500 * tau * tau;
        if (y > iy + 6) continue;
        const gg = c.createRadialGradient(x - sz * 0.3, y - sz * 0.3, 0, x, y, sz);
        gg.addColorStop(0, '#fff6d8'); gg.addColorStop(0.4, '#e2ab4a'); gg.addColorStop(1, '#4a2a06');
        c.fillStyle = gg; c.beginPath(); c.arc(x, y, sz, 0, TAU); c.fill();
      }
    }
    c.restore();
  }

  /* ---- 2.3 – 5.0 champagne silk ---- */
  function lxSilk(c, t, st) {
    const img = st.sImg, d = img.data, w = img.width, h = img.height;
    const th = 2.5 + (t - 2.3) * 0.3;
    const [Lx, Ly, Lz] = nrm(Math.cos(th) * 0.8, Math.sin(th) * 0.8 - 0.25, 0.55);
    const [Hx, Hy, Hz] = nrm(Lx, Ly, Lz + 1);
    const tt = t * 0.55;
    const SH = [24, 14, 6], MD = [156, 116, 62], HI = [255, 242, 214];
    const ca = Math.cos(0.42), sa = Math.sin(0.42);
    const hf = (u, v) => {
      const p = u * ca + v * sa, q = -u * sa + v * ca;
      return 0.9 * Math.sin(1.5 * p + 0.45 * Math.sin(0.7 * q + tt * 0.8) + 0.55 * tt) +
        0.42 * Math.sin(2.9 * p + 0.3 * q - 0.75 * tt + 1.0) +
        0.2 * Math.sin(5.6 * p + 0.8 * Math.sin(1.2 * q - tt) + 1.1 * tt + 2.0) +
        0.08 * Math.sin(11 * p + 0.5 * q + 1.7 * tt);
    };
    const ep = 0.01;
    for (let j = 0; j < h; j++) {
      const v = (j / h) * 2.9, yf = j / h;
      for (let i = 0; i < w; i++) {
        const xf = i / w, u = xf * 5.2 + tt * 0.12;
        const h0 = hf(u, v), du = (hf(u + ep, v) - h0) / ep, dv = (hf(u, v + ep) - h0) / ep;
        const nx = -du * 0.42, ny = -dv * 0.42, inv = 1 / Math.sqrt(nx * nx + ny * ny + 1);
        const diff = Math.max(0, (nx * Lx + ny * Ly + Lz) * inv);
        const ndh = Math.max(0, (nx * Hx + ny * Hy + Hz) * inv);
        const spec = Math.pow(ndh, 60), sheen = Math.pow(ndh, 8);
        const e = 0.16 + 0.56 * xf + 0.05 * Math.sin(xf * 6 + tt * 1.3);
        const m = sstep(e - 0.003, e + 0.022, yf);
        const rim = Math.exp(-Math.pow((yf - e - 0.012) / 0.009, 2)) * 0.55;
        const lum = clamp((0.02 + diff * diff * 0.55 + sheen * 0.2 + spec * 0.8 + rim) * m, 0, 1.2);
        let col;
        if (lum < 0.5) col = mix(SH, MD, lum / 0.5); else col = mix(MD, HI, Math.min(1, (lum - 0.5) / 0.55));
        const k = (j * w + i) * 4;
        d[k] = lerp(LX_BG[0], col[0], m); d[k + 1] = lerp(LX_BG[1], col[1], m); d[k + 2] = lerp(LX_BG[2], col[2], m); d[k + 3] = 255;
      }
    }
    st.sc2.putImageData(img, 0, 0);
    const z = lerp(1.06, 1.0, E.ioS(seg(t, 2.3, 5.0)));
    c.save(); c.translate(960, 540); c.scale(z, z); c.translate(-960, -540);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(st.Sk, -20, -20, 1960, 1120);
    c.restore();
    const wa = E.ioS(seg(t, 3.0, 3.7)) * (1 - E.ioS(seg(t, 4.3, 4.8)));
    if (wa > 0) {
      c.save(); c.globalAlpha = wa;
      c.font = `italic 400 64px ${COR}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      setLS(c, 2); c.fillStyle = rgba(LX_IV, 0.92); c.fillText('Lenteur.', 1330, 300 - (t - 3) * 6);
      c.font = `500 15px ${COR}`; setLS(c, 7); c.fillStyle = rgba(LX_GOLD, 0.9); c.fillText('LA SOIE  ·  L’OR  ·  LE TEMPS', 1334, 344 - (t - 3) * 6);
      setLS(c, 0); c.restore();
    }
  }

  /* ---- 4.6 – 7.15 the crystal flacon ---- */
  function lxOct(cx, cy, w, h, ch) { return [[-w + ch, -h], [w - ch, -h], [w, -h + ch], [w, h - ch], [w - ch, h], [-w + ch, h], [-w, h - ch], [-w, -h + ch]].map(p => [cx + p[0], cy + p[1]]); }
  function lxPoly(c, P) { c.beginPath(); P.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }
  function lxFlacon(c, t, cx, cy, refl) {
    const lp = kf(t, [[4.7, -1.9], [6.9, 1.9, E.ioS]]);
    const [Hx, Hy, Hz] = nrm(...(() => { const L = nrm(lp, -0.45, 1.1); return [L[0], L[1], L[2] + 1]; })());
    const W2 = 178, H2 = 226, O = lxOct(cx, cy, W2, H2, 62), I = lxOct(cx, cy, W2 - 44, H2 - 44, 38);
    const yl = cy - 20;
    const specs = [];
    for (let i = 0; i < 8; i++) {
      const a = O[i], b = O[(i + 1) % 8], mx = (a[0] + b[0]) / 2 - cx, my = (a[1] + b[1]) / 2 - cy, ml = Math.hypot(mx, my);
      const [nx, ny, nz] = nrm((mx / ml) * 0.8, (my / ml) * 0.8, 0.6);
      const ndh = Math.max(0, nx * Hx + ny * Hy + nz * Hz);
      const sp = Math.pow(ndh, 60), br = Math.pow(ndh, 5);
      specs.push(sp);
      const fcy = (a[1] + b[1] + I[i][1] + I[(i + 1) % 8][1]) / 4;
      const base = fcy > yl ? [104, 68, 22] : [44, 38, 32];
      const col = mix(base, [255, 250, 238], Math.min(1, sp * 1.1 + br * 0.12));
      const q = [a, b, I[(i + 1) % 8], I[i]];
      const gq = c.createLinearGradient(a[0], a[1], I[i][0], I[i][1]);
      gq.addColorStop(0, rgba(mix(col, [0, 0, 0], 0.25))); gq.addColorStop(1, rgba(col));
      lxPoly(c, q); c.fillStyle = gq; c.fill();
      // the gliding softbox, reflected faster on steeper facets
      c.save(); lxPoly(c, q); c.clip(); c.globalCompositeOperation = 'lighter';
      const fbx = cx + (lp - nx * 1.6) * 300;
      const fg = c.createLinearGradient(fbx - 60, 0, fbx + 60, 0);
      fg.addColorStop(0, 'rgba(255,248,232,0)'); fg.addColorStop(0.5, `rgba(255,248,232,${0.55 + 0.3 * Math.abs(ny)})`); fg.addColorStop(1, 'rgba(255,248,232,0)');
      c.fillStyle = fg; c.fillRect(fbx - 60, cy - H2 - 20, 120, H2 * 2 + 40);
      c.restore();
      c.strokeStyle = `rgba(255,238,205,${0.18 + sp * 0.7})`; c.lineWidth = 1.5; lxPoly(c, q); c.stroke();
    }
    // table: dark glass, gold liquid, refracted back facets
    lxPoly(c, I);
    let g = c.createLinearGradient(cx - W2, cy - H2, cx + W2, cy); g.addColorStop(0, '#2a241c'); g.addColorStop(0.5, '#120f0b'); g.addColorStop(1, '#2a2219');
    c.fillStyle = g; c.fill();
    c.save(); lxPoly(c, I); c.clip();
    g = c.createLinearGradient(0, yl, 0, cy + H2);
    g.addColorStop(0, '#f2c86c'); g.addColorStop(0.12, '#c88d32'); g.addColorStop(0.6, '#7c4a10'); g.addColorStop(1, '#3a1e04');
    c.fillStyle = g; c.fillRect(cx - W2, yl, W2 * 2, H2 * 2);
    g = c.createLinearGradient(cx - W2, 0, cx + W2, 0);
    g.addColorStop(0, 'rgba(20,10,0,0.7)'); g.addColorStop(0.25, 'rgba(20,10,0,0)'); g.addColorStop(0.75, 'rgba(20,10,0,0)'); g.addColorStop(1, 'rgba(20,10,0,0.7)');
    c.fillStyle = g; c.fillRect(cx - W2, yl, W2 * 2, H2 * 2);
    c.strokeStyle = 'rgba(255,226,160,0.22)'; c.lineWidth = 2; lxPoly(c, lxOct(cx + lp * 10, cy + 8, W2 - 96, H2 - 92, 26)); c.stroke();
    c.fillStyle = 'rgba(255,240,200,0.85)'; c.fillRect(cx - W2, yl - 1, W2 * 2, 2.5);
    c.fillStyle = 'rgba(255,245,225,0.22)'; c.fillRect(I[7][0] + 3, I[7][1], 3, I[6][1] - I[7][1]); c.fillRect(I[2][0] - 6, I[2][1], 3, I[3][1] - I[2][1]);
    // softbox reflections gliding across the table
    c.globalCompositeOperation = 'lighter';
    const bx = cx + lp * 240;
    g = c.createLinearGradient(bx - 70, 0, bx + 70, 0);
    g.addColorStop(0, 'rgba(255,250,240,0)'); g.addColorStop(0.5, 'rgba(255,250,240,0.26)'); g.addColorStop(1, 'rgba(255,250,240,0)');
    c.fillStyle = g; c.fillRect(bx - 70, cy - H2, 140, H2 * 2);
    g = c.createLinearGradient(bx + 70, 0, bx + 92, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(bx + 70, cy - H2, 22, H2 * 2);
    c.restore();
    // label
    if (!refl) {
      const lg = c.createLinearGradient(0, cy - 120, 0, cy - 50); lg.addColorStop(0, '#f5efe3'); lg.addColorStop(1, '#ddd3c1');
      c.fillStyle = lg; c.fillRect(cx - 86, cy - 124, 172, 70);
      c.strokeStyle = 'rgba(30,24,16,0.6)'; c.lineWidth = 1; c.strokeRect(cx - 80, cy - 118, 160, 58);
      c.fillStyle = '#16120c'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.font = `500 20px ${BOD}`; setLS(c, 5); c.fillText('ORVELLE', cx + 2.5, cy - 88);
      c.font = `600 9px ${COR}`; setLS(c, 3); c.fillText('EAU DE PARFUM · PARIS', cx + 1.5, cy - 70);
      setLS(c, 0);
    }
    // neck + faceted gold cap
    const gold = (x0, x1, hl) => {
      const gg = c.createLinearGradient(x0, 0, x1, 0);
      gg.addColorStop(0, '#3a2408'); gg.addColorStop(clamp(hl - 0.18), '#9a6a24'); gg.addColorStop(clamp(hl), '#fff0c8'); gg.addColorStop(clamp(hl + 0.16), '#b8843a'); gg.addColorStop(1, '#2e1c06');
      return gg;
    };
    const hl = 0.5 + lp * 0.22;
    c.fillStyle = gold(cx - 46, cx + 46, hl); c.fillRect(cx - 46, cy - H2 - 32, 92, 34);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(cx - 46, cy - H2 - 4, 92, 4);
    const CO = lxOct(cx, cy - H2 - 32 - 72, 112, 72, 26), CI = lxOct(cx, cy - H2 - 32 - 72, 88, 50, 16);
    lxPoly(c, CO); c.fillStyle = gold(cx - 112, cx + 112, hl); c.fill();
    lxPoly(c, CI); c.fillStyle = gold(cx - 88, cx + 88, clamp(hl + 0.06)); c.fill();
    c.strokeStyle = 'rgba(255,236,190,0.5)'; c.lineWidth = 1; lxPoly(c, CI); c.stroke();
    c.font = `400 54px ${BOD}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(255,240,200,0.55)'; c.fillText('O', cx - 13, cy - H2 - 102);
    c.fillStyle = 'rgba(60,36,6,0.7)'; c.fillText('O', cx - 14, cy - H2 - 104);
    c.fillStyle = 'rgba(255,240,200,0.55)'; c.fillText('V', cx + 15, cy - H2 - 102);
    c.fillStyle = 'rgba(60,36,6,0.7)'; c.fillText('V', cx + 14, cy - H2 - 104);
    return { O, specs, lp };
  }
  function twinkle(c, x, y, s, a) {
    if (a <= 0.02) return;
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, y, 0, x, y, s * 0.5);
    g.addColorStop(0, `rgba(255,250,235,${a})`); g.addColorStop(1, 'rgba(255,240,210,0)');
    c.fillStyle = g; c.fillRect(x - s, y - s, s * 2, s * 2);
    [[1, 0], [0, 1]].forEach(([dx, dy]) => {
      const gg = c.createLinearGradient(x - dx * s, y - dy * s, x + dx * s, y + dy * s);
      gg.addColorStop(0, 'rgba(255,248,230,0)'); gg.addColorStop(0.5, `rgba(255,248,230,${a})`); gg.addColorStop(1, 'rgba(255,248,230,0)');
      c.fillStyle = gg; c.fillRect(x - dx * s - dy * 1.2, y - dy * s - dx * 1.2, dx * s * 2 + dy * 2.4, dy * s * 2 + dx * 2.4);
    });
    c.restore();
  }
  function lxBottleShot(c, t) {
    c.fillStyle = '#080706'; c.fillRect(0, 0, 1920, 1080);
    const z = lerp(1.0, 1.09, E.ioS(seg(t, 4.6, 7.2)));
    const cx = 960, cy = 590, floorY = cy + 226;
    c.save(); c.translate(960, 560); c.scale(z, z); c.translate(-960, -560 - lerp(-14, 14, E.ioS(seg(t, 4.6, 7.2))));
    let g = c.createRadialGradient(960, 380, 0, 960, 420, 900);
    g.addColorStop(0, 'rgba(66,52,34,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(-200, -200, 2400, 1500);
    g = c.createLinearGradient(0, floorY, 0, floorY + 300); g.addColorStop(0, 'rgba(40,32,22,0.6)'); g.addColorStop(1, 'rgba(8,7,6,0)');
    c.fillStyle = g; c.fillRect(-200, floorY, 2400, 300);
    c.save(); c.translate(0, floorY * 2); c.scale(1, -1); c.globalAlpha = 0.22; lxFlacon(c, t, cx, cy, true); c.restore();
    g = c.createLinearGradient(0, floorY, 0, floorY + 340); g.addColorStop(0, 'rgba(8,7,6,0.25)'); g.addColorStop(1, 'rgba(8,7,6,1)');
    c.fillStyle = g; c.fillRect(-200, floorY, 2400, 400);
    const R = lxFlacon(c, t, cx, cy, false);
    // caustic glow on the floor
    const ca = 0.2 + 0.25 * Math.max(...R.specs);
    c.save(); c.globalCompositeOperation = 'lighter'; c.translate(cx - R.lp * 70, floorY + 34); c.scale(1, 0.09);
    g = c.createRadialGradient(0, 0, 0, 0, 0, 320); g.addColorStop(0, `rgba(255,200,110,${ca})`); g.addColorStop(1, 'rgba(255,190,90,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 320, 0, TAU); c.fill(); c.restore();
    R.specs.forEach((sp, i) => { if (sp > 0.35) twinkle(c, R.O[i][0], R.O[i][1], 70 * sp, (sp - 0.35) * 1.4); });
    c.restore();
  }

  /* ---- 7.05 – 8.45 the embossed monogram ---- */
  function lxMono(st) {
    if (st.monoOK) return;
    const M = st.M, m = M.getContext('2d');
    m.clearRect(0, 0, 900, 900);
    m.strokeStyle = '#fff'; m.lineWidth = 9; m.beginPath(); m.arc(450, 450, 392, 0, TAU); m.stroke();
    m.lineWidth = 2.5; m.beginPath(); m.arc(450, 450, 366, 0, TAU); m.stroke();
    m.fillStyle = '#fff'; m.textAlign = 'center'; m.textBaseline = 'alphabetic';
    m.font = `400 640px ${BOD}`; m.fillText('O', 450, 680);
    m.font = `400 470px ${BOD}`; m.fillText('V', 452, 640);
    const b = st.Bm.getContext('2d');
    b.clearRect(0, 0, 900, 900); b.filter = 'blur(4px)'; b.drawImage(M, 0, 0); b.filter = 'none';
    st.monoOK = typeof document !== 'undefined' && document.fonts && document.fonts.check(`400 100px ${BOD}`);
  }
  function lxEmboss(c, t, st) {
    lxMono(st);
    const a = lerp(-2.7, -0.8, E.ioS(seg(t, 7.0, 8.5))), dx = Math.cos(a) * 5, dy = Math.sin(a) * 5;
    const mk = (cv, sx, sy, col) => {
      const p = cv.getContext('2d');
      p.globalCompositeOperation = 'source-over'; p.clearRect(0, 0, 900, 900);
      p.drawImage(st.Bm, sx, sy);
      p.globalCompositeOperation = 'destination-out'; p.drawImage(st.Bm, -sx, -sy);
      p.globalCompositeOperation = 'source-in'; p.fillStyle = col; p.fillRect(0, 0, 900, 900);
      p.globalCompositeOperation = 'source-over';
    };
    mk(st.P, -dx, -dy, '#fffdf6');
    mk(st.N, dx, dy, '#4a3a26');
    const z = lerp(1.16, 1.03, E.ioS(seg(t, 7.0, 8.5))), r = lerp(-0.05, 0.01, E.ioS(seg(t, 7.0, 8.5)));
    c.save(); c.translate(960, 540); c.rotate(r); c.scale(z, z);
    // paper under raking light
    const g = c.createLinearGradient(Math.cos(a) * 1200, Math.sin(a) * 1200, -Math.cos(a) * 1200, -Math.sin(a) * 1200);
    g.addColorStop(0, '#f6efe2'); g.addColorStop(0.5, '#e4d9c6'); g.addColorStop(1, '#a89a84');
    c.fillStyle = g; c.fillRect(-1300, -900, 2600, 1800);
    c.globalAlpha = 0.5; c.globalCompositeOperation = 'multiply';
    c.fillStyle = st.paperPat || (st.paperPat = c.createPattern(st.Pp, 'repeat')); c.fillRect(-1300, -900, 2600, 1800);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    const s = 0.86;
    c.save(); c.scale(s, s); c.translate(-450, -450);
    c.globalAlpha = 0.16; c.drawImage(st.M, 2, 3); c.globalAlpha = 1;
    c.globalAlpha = 0.6; c.drawImage(st.N, 0, 0);
    c.globalAlpha = 0.95; c.drawImage(st.P, 0, 0);
    c.globalAlpha = 1;
    c.restore();
    // gold-foil hairline drawing around the ring
    const fp = E.ioS(seg(t, 7.45, 8.2));
    if (fp > 0) {
      const R = 404 * s, a0 = -Math.PI / 2;
      const fg = c.createLinearGradient(-R, -R, R, R);
      fg.addColorStop(0, '#8a6424'); fg.addColorStop(0.45, '#f6dc9c'); fg.addColorStop(0.55, '#c9a058'); fg.addColorStop(1, '#6e4c16');
      c.strokeStyle = fg; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.arc(0, 0, R, a0, a0 + fp * TAU); c.stroke();
      if (fp < 1) twinkle(c, Math.cos(a0 + fp * TAU) * R, Math.sin(a0 + fp * TAU) * R, 46, 0.9);
    }
    c.restore();
  }

  /* ---- 8.35 – 10 the wordmark ---- */
  function lxWordmark(c, t) {
    c.fillStyle = rgba(LX_BG); c.fillRect(0, 0, 1920, 1080);
    const g = c.createRadialGradient(960, 520, 0, 960, 520, 900);
    g.addColorStop(0, 'rgba(46,36,24,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
    const word = 'ORVELLE', size = 132;
    const ls = lerp(64, 40, E.ioS(seg(t, 8.4, 9.5)));
    c.font = `400 ${size}px ${BOD}`; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    const ws = [...word].map(ch => c.measureText(ch).width);
    const total = ws.reduce((a, b) => a + b, 0) + ls * (word.length - 1);
    let x = 960 - total / 2;
    const y = 590;
    [...word].forEach((ch, i) => {
      const d = Math.abs(i - 3);
      const k = E.ioS(seg(t, 8.45 + d * 0.09, 9.15 + d * 0.09));
      if (k > 0) {
        c.save(); c.globalAlpha = k;
        c.filter = k < 0.98 ? `blur(${((1 - k) * 8).toFixed(2)}px)` : 'none';
        c.fillStyle = rgba(LX_IV); c.fillText(ch, x, y + (1 - k) * 10);
        c.restore();
      }
      x += ws[i] + ls;
    });
    // glint gliding across the letters
    const gp = seg(t, 9.2, 9.9);
    if (gp > 0 && gp < 1) {
      c.save(); c.globalCompositeOperation = 'source-atop';
      c.restore();
      c.save(); c.globalCompositeOperation = 'lighter';
      const gx = lerp(960 - total / 2 - 200, 960 + total / 2 + 200, E.ioS(gp));
      const gg = c.createLinearGradient(gx - 120, 0, gx + 120, 0);
      gg.addColorStop(0, 'rgba(255,230,180,0)'); gg.addColorStop(0.5, 'rgba(255,230,180,0.55)'); gg.addColorStop(1, 'rgba(255,230,180,0)');
      c.fillStyle = gg; x = 960 - total / 2;
      [...word].forEach((ch, i) => { c.fillText(ch, x, y); x += ws[i] + ls; });
      c.restore();
    }
    // hairline rule, monogram, tagline
    const rl = E.ioS(seg(t, 8.85, 9.45));
    if (rl > 0) {
      const rg = c.createLinearGradient(960 - 200, 0, 960 + 200, 0);
      rg.addColorStop(0, 'rgba(212,176,122,0)'); rg.addColorStop(0.5, 'rgba(232,200,140,1)'); rg.addColorStop(1, 'rgba(212,176,122,0)');
      c.fillStyle = rg; c.fillRect(960 - 200 * rl, 642, 400 * rl, 1.5);
    }
    const mo = E.ioS(seg(t, 8.6, 9.2));
    if (mo > 0) {
      c.save(); c.globalAlpha = mo;
      c.strokeStyle = rgba(LX_GOLD, 0.9); c.lineWidth = 1.2; c.beginPath(); c.arc(960, 372, 38, 0, TAU); c.stroke();
      c.fillStyle = rgba(LX_GOLD); c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `400 46px ${BOD}`; c.fillText('O', 960, 375); c.font = `400 34px ${BOD}`; c.fillText('V', 961, 373);
      c.restore();
    }
    const tg = E.ioS(seg(t, 9.0, 9.55));
    if (tg > 0) {
      c.save(); c.globalAlpha = tg; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.font = `italic 400 44px ${COR}`; setLS(c, 1); c.fillStyle = rgba(LX_IV, 0.88); c.fillText('L’Or Silencieux', 960, 712 + (1 - tg) * 6);
      c.font = `500 17px ${COR}`; setLS(c, 12); c.fillStyle = rgba(LX_GOLD); c.fillText('PARIS  ·  DEPUIS 1897', 966, 762 + (1 - tg) * 6);
      setLS(c, 0); c.restore();
    }
  }

  MG.film({
    id: 'luxury', dur: 10, poster: 9.4,
    fonts: [['400 132px "Bodoni Moda"', 'ORVELLE'], ['500 20px "Bodoni Moda"', 'ORVELLE'], ['italic 400 44px "Cormorant Garamond"', 'L’Or Silencieux Lenteur.'], ['500 17px "Cormorant Garamond"', 'PARIS DEPUIS 1897']],
    meta: {
      family: 'J', name: 'Luxury Brand Motion', sub: 'Maison Films', era: '1970s —',
      origin: 'Perfume, watch and fashion houses turned the television spot into a short film: Chanel N°5 commercials by Ridley Scott and later Luc Besson, Cartier’s "L’Odyssée" and the Hermès and Rolex idents set the grammar of slow macro product light, precious materials, silence and a single high-contrast serif wordmark.',
      works: 'Chanel N°5 “Share the Fantasy” (Ridley Scott, 1979) · Chanel N°5 “Le Loup” (Luc Besson, 1998) · Cartier “L’Odyssée de Cartier” (Bruno Aveillan, 2012) · Dior J’adore films · Rolex “Perpetual” brand films · Hermès brand films and idents',
      tech: ['Per-pixel liquid-gold surface: radial ripples reflecting a softbox', 'Procedural silk height field with anisotropic sheen', 'Faceted crystal: per-facet normals lit by a gliding light', 'Blind emboss from offset blurred masks under raking light'],
      accent: '#d4b07a',
      motionDNA: 'Everything is slow and precise: a pour in slow motion, light gliding across facets, a raking light turning over an embossed monogram, letters resolving out of blur while their tracking tightens; every move eases in and out.',
      visualDNA: 'Warm black, champagne gold and ivory; macro surfaces of liquid metal, silk and cut crystal; generous negative space; a thin, wide-tracked Didone wordmark with an italic tagline.',
      transitions: 'Slow dissolves, dip to black, light leaving the frame, letters resolving from blur.',
      implementation: ['Live action macro', 'Houdini FLIP', 'Cinema 4D + Redshift', 'Canvas 2D'],
      reproducibility: 'Needs 3D or live action (this film is a procedural homage)', loopable: false,
    },
    setup() {
      const G = offscreen(480, 150), Sk = offscreen(384, 216), M = offscreen(900, 900), Bm = offscreen(900, 900), P = offscreen(900, 900), N = offscreen(900, 900);
      const gc = G.getContext('2d'), sc2 = Sk.getContext('2d');
      const Pp = offscreen(256, 256), pc = Pp.getContext('2d'), pd = pc.createImageData(256, 256), R = rng(31);
      for (let i = 0; i < pd.data.length; i += 4) { const v = 225 + R() * 30; pd.data[i] = v; pd.data[i + 1] = v - 3; pd.data[i + 2] = v - 8; pd.data[i + 3] = 255; }
      pc.putImageData(pd, 0, 0);
      pc.strokeStyle = 'rgba(150,130,100,0.18)'; pc.lineWidth = 0.8;
      for (let k = 0; k < 90; k++) { const x = R() * 256, y = R() * 256, a = R() * TAU, l = 6 + R() * 20; pc.beginPath(); pc.moveTo(x, y); pc.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 3, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); pc.stroke(); }
      return { G, gc, gImg: gc.createImageData(480, 150), Sk, sc2, sImg: sc2.createImageData(384, 216), M, Bm, P, N, Pp, monoOK: false };
    },
    draw(c, t, W, H, st) {
      const layers = [];
      if (t < 2.75) layers.push([lxPour, 1]);
      if (t >= 2.3 && t < 5.0) layers.push([lxSilk, E.ioS(seg(t, 2.3, 2.75))]);
      if (t >= 4.6 && t < 7.15) layers.push([lxBottleShot, E.ioS(seg(t, 4.6, 5.0)) * (1 - E.ioS(seg(t, 6.85, 7.12)))]);
      if (t >= 7.05 && t < 8.45) layers.push([lxEmboss, E.ioS(seg(t, 7.05, 7.4)) * (1 - E.ioS(seg(t, 8.12, 8.42)))]);
      c.fillStyle = rgba(LX_BG); c.fillRect(0, 0, W, H);
      if (t >= 8.3) lxWordmark(c, t);
      layers.forEach(([fn, a]) => { if (a <= 0.001) return; c.save(); c.globalAlpha = a; if (a < 1) { const o = st.O || (st.O = offscreen(1920, 1080)); const oc = o.getContext('2d'); oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalAlpha = 1; fn(oc, t, st); c.setTransform(c.getTransform()); c.drawImage(o, 0, 0, W, H); } else fn(c, t, st); c.restore(); });
      // cinematic letterbox, film grain, vignette
      vignette(c, W, H, 0.5);
      grain(c, W, H, t, 0.045, 'overlay');
      c.fillStyle = '#000'; c.fillRect(0, 0, W, 96); c.fillRect(0, H - 96, W, 96);
      const fin = 1 - E.ioS(seg(t, 0, 0.5));
      if (fin > 0) { c.fillStyle = `rgba(0,0,0,${fin})`; c.fillRect(0, 0, W, H); }
    },
    score(A) {
      const LG = 1.9;
      const piano = (t0, m, g0 = 0.08, dur = 3.2, pan = 0) => {
        const f = midi(m), g = g0 * LG;
        A.osc(t0, { type: 'triangle', f, dur, g: g * 0.6, a: 0.004, lp: 2600, lp2: 500, lpT: dur, rev: 0.55, pan });
        A.osc(t0, { type: 'sine', f: f * 2, dur: dur * 0.55, g: g * 0.22, a: 0.003, rev: 0.55, pan });
        A.osc(t0, { type: 'sine', f: f * 3.005, dur: dur * 0.3, g: g * 0.08, a: 0.003, rev: 0.5, pan });
        A.noise(t0, { type: 'bandpass', f: Math.min(6000, f * 5), q: 2, dur: 0.03, g: g * 0.12, pan });
      };
      const pad = (t0, notes, dur, g = 0.016) => A.chord(t0, notes, { type: 'sawtooth', dur, g: g * LG, a: Math.min(1.4, dur * 0.4), hold: true, rel: Math.min(1.2, dur * 0.4), lp: 850, spread: 7, width: 1.4, rev: 0.7 });
      // Db major world: pour
      pad(0.1, [37, 49, 56, 60, 63], 2.9);
      A.noise(0.12, { type: 'lowpass', f: 900, f2: 500, dur: 2.5, g: 0.05, hold: true, a: 0.6, rel: 0.6 });
      A.noise(0.78, { type: 'bandpass', f: 600, f2: 260, q: 2, dur: 0.6, g: 0.11, rev: 0.4 });
      [0.86, 1.05, 1.3, 1.62].forEach((tt, i) => A.osc(tt, { f: 1400 + i * 260, f2: 2600 + i * 300, glide: 0.06, dur: 0.12, g: 0.035, rev: 0.5, pan: (i - 1.5) * 0.4 }));
      piano(0.8, 68, 0.08); piano(0.8, 49, 0.05, 3.5);
      piano(1.5, 72, 0.07); piano(2.15, 75, 0.06); piano(2.75, 73, 0.07);
      // silk
      A.noise(2.35, { type: 'bandpass', f: 500, f2: 1600, q: 0.7, dur: 1.4, g: 0.06, swell: 0.5, rev: 0.4 });
      pad(2.5, [42, 54, 58, 61, 65], 2.6);
      piano(2.75, 42, 0.05, 3.5); piano(3.3, 77, 0.06); piano(3.95, 75, 0.055); piano(4.55, 72, 0.06);
      // the flacon: glass shimmer as the light crosses
      pad(4.85, [46, 58, 61, 65, 68], 2.5);
      piano(4.85, 46, 0.05, 3.2); piano(5.45, 73, 0.06); piano(6.1, 77, 0.055); piano(6.7, 80, 0.05);
      [5.55, 5.8, 6.05, 6.3].forEach((tt, i) => A.bell(tt, midi(96 + [0, 3, 5, 8][i]), { g: 0.02, dur: 1.4, pan: (i - 1.5) * 0.5, rev: 0.7 }));
      A.noise(5.2, { type: 'highpass', f: 7000, dur: 1.6, g: 0.012, swell: 0.5, rev: 0.6 });
      // monogram: low note, foil drawing as a harp sweep
      pad(7.1, [39, 51, 58, 63, 65], 1.5);
      piano(7.15, 39, 0.06, 3.0);
      [61, 65, 68, 72, 73, 77, 80, 84, 85].forEach((m, i) => A.pluck(7.5 + i * 0.075, midi(m), { dur: 1.6, bright: 0.45, decay: 0.997, g: 0.15, rev: 0.6, pan: (i / 8 - 0.5) * 1.2 }));
      // wordmark: soft chime and the resolved chord
      pad(8.45, [37, 49, 56, 60, 63, 68], 1.55, 0.018);
      A.bell(8.55, midi(85), { g: 0.09, dur: 2.2, rev: 0.7 });
      A.bell(8.56, midi(92), { g: 0.035, dur: 1.6, rev: 0.7 });
      piano(8.6, 49, 0.06, 1.4); piano(8.6, 56, 0.045, 1.4); piano(8.6, 77, 0.06, 1.4);
      A.bell(9.25, midi(89), { g: 0.03, dur: 0.7, rev: 0.7, pan: 0.3 });
    },
  });
})();
