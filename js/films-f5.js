/* batch f5 — Cultural & Commercial: Minhwa · Folk Paper-cut · Podcast Visualizer.
   minhwa (민화 Joseon folk painting) · wycinanki (Polish / Ukrainian scissor-cut paper) · podcast (audiogram clip). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, offscreen, roughPoly, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Song+Myung&family=Noto+Serif+KR:wght@900&family=Cormorant+SC:wght@500;700&family=Cormorant+Garamond:ital,wght@1,500&family=Yeseva+One&family=Plus+Jakarta+Sans:wght@500;700;800&family=JetBrains+Mono:wght@500&display=block');
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
  // Tapered tube around a polyline (for tails, legs, branches).
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
  // Fibrous paper texture tile (hanji / glazed paper / card).
  function paperTile(base, seed, fib = 0.06, size = 512) {
    const c = offscreen(size, size), g = c.getContext('2d'), r = rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, size, size);
    for (let k = 0; k < 90; k++) {
      const x = r() * size, y = r() * size, rr = 20 + r() * 90;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr); const d = r() < 0.5;
      gr.addColorStop(0, d ? `rgba(120,90,50,${0.03 + r() * 0.04})` : `rgba(255,250,235,${0.04 + r() * 0.05})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { g.save(); g.translate(ox, oy); g.fillRect(x - rr, y - rr, rr * 2, rr * 2); g.restore(); }
    }
    g.lineCap = 'round';
    for (let k = 0; k < 1400; k++) {
      const x = r() * size, y = r() * size, a = r() * TAU, l = 6 + r() * 30, d = r() < 0.55;
      g.strokeStyle = d ? `rgba(90,60,30,${fib * (0.4 + r())})` : `rgba(255,252,240,${fib * 1.6 * (0.4 + r())})`;
      g.lineWidth = 0.5 + r() * 1.2;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    for (let k = 0; k < 9000; k++) { g.fillStyle = r() < 0.5 ? 'rgba(80,55,30,0.05)' : 'rgba(255,255,245,0.06)'; g.fillRect(r() * size, r() * size, 1 + r(), 1 + r()); }
    return c;
  }

  /* =====================================================================
     MINHWA 민화 — a Joseon folk painting comes alive: ink lines and flat
     mineral colour appear on hanji, a magpie lands in the pine, the goofy
     tiger pops up grinning, peonies open, and the camera pulls back to a
     folding screen of chaekgeori, sipjangsaeng and peony panels
     ===================================================================== */
  const MH = {
    ink: '#2a1d16', paper: '#ecdcb8', org: '#e39a35', orgD: '#c0702a', cream: '#f7e9c6', red: '#c2362f', redD: '#8e2420',
    pine: '#2e5b3e', pineL: '#6b9a55', bark: '#8a5a3a', rock: '#4c8a86', rockL: '#9cc7b5', blue: '#2f5d8c', blueL: '#7fa6c9',
    yel: '#e8bf45', pink: '#e5848c', green: '#4f8a52', silk: '#5d6f78', silkL: '#8396a0', lac: '#4a2116', wall: '#e6d6b4', floor: '#c49a5c',
  };
  const MH_PW = 800, MH_PH = 1100;              // painting size, in painting units
  const MH_T = { land: 1.75, caws: [2.0, 2.24, 4.02, 4.26], rise: 2.55, grin: 4.35, bloom: 4.85, pull: 5.8, title: 8.0, seal: 8.55 };
  const MH_R = { ink: 1, col: 1 };              // opening reveal state used by fill/stroke helpers
  function mhFill(g, col) { g.globalAlpha = MH_R.col; g.fillStyle = col; g.fill(); g.globalAlpha = 1; }
  function mhInk(g, lw = 3) {
    g.lineWidth = lw; g.strokeStyle = MH.ink; g.lineJoin = 'round'; g.lineCap = 'round';
    if (MH_R.ink < 1) { g.setLineDash([MH_R.ink * 1400 + 0.01, 3000]); g.stroke(); g.setLineDash([]); } else g.stroke();
  }
  const mhFI = (g, col, lw = 3) => { mhFill(g, col); mhInk(g, lw); };
  // A tapered, flame-like stripe: wavy centreline, fat in the middle, pointed at both ends.
  function mhStripe(g, x, y, len, ang, w, wav = 0.12) {
    const ca = Math.cos(ang), sa = Math.sin(ang), L = [], R = [];
    for (let i = 0; i <= 10; i++) {
      const u = i / 10, off = Math.sin(u * TAU) * len * wav, ww = w * Math.pow(Math.sin(PI * Math.min(1, u * 1.15)), 0.8);
      const px = x + ca * len * u - sa * off, py = y + sa * len * u + ca * off;
      L.push([px - sa * ww, py + ca * ww]); R.push([px + sa * ww * 0.5, py - ca * ww * 0.5]);
    }
    g.beginPath(); L.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]); g.closePath();
    g.globalAlpha = MH_R.col; g.fillStyle = MH.ink; g.fill(); g.globalAlpha = 1;
  }

  // Pine needles: a flat dark pad with radiating needle fans.
  function mhPinePad(g, x, y, rx, ry, seed) {
    smooth(g, Array.from({ length: 14 }, (_, i) => { const a = i / 14 * TAU, m = 1 + 0.08 * Math.sin(i * 2.7 + seed); return [x + Math.cos(a) * rx * m, y + Math.sin(a) * ry * m * (Math.sin(a) > 0 ? 0.7 : 1)]; }));
    mhFI(g, MH.pine, 2.4);
    g.globalAlpha = MH_R.col; g.strokeStyle = MH.pineL; g.lineWidth = 1.6; g.lineCap = 'round';
    const n = Math.round(rx / 9);
    for (let k = 0; k < n; k++) {
      const cx = x - rx * 0.8 + (k / (n - 1)) * rx * 1.6, cy = y + ry * 0.2;
      for (let j = 0; j < 7; j++) { const a = -PI + 0.35 + j / 6 * (PI - 0.7), l = ry * 0.85; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * l * 0.55, cy + Math.sin(a) * l); g.stroke(); }
    }
    g.globalAlpha = 1;
  }
  function mhPine(g, t) {
    const trunk = bez([150, 1120], [40, 860], [250, 640], [120, 420]).concat(bez([120, 420], [40, 260], [220, 200], [250, 30]).slice(1));
    const sway = Math.sin(t * 1.3) * 3;
    // branches grow out of the trunk, so they go down first
    const br1 = bez([110, 380], [300, 330], [470, 300], [700, 250 + sway], 12), br2 = bez([180, 220], [300, 140], [420, 130], [540, 105 + sway * 0.7], 10), br3 = bez([150, 570], [60, 540], [40, 520], [0, 500], 6);
    [[br1, 16, 7], [br2, 12, 6], [br3, 12, 7]].forEach(([b, w0, w1]) => { tube(g, b, w0, w1); mhFI(g, MH.bark, 2.6); });
    tube(g, trunk, 46, 22); mhFI(g, MH.bark, 3);
    // bark scales
    g.globalAlpha = MH_R.col; g.strokeStyle = '#5b3622'; g.lineWidth = 2;
    for (let i = 1; i < trunk.length - 1; i++) { const [x, y] = trunk[i], w = lerp(30, 14, i / trunk.length); for (let j = 0; j < 3; j++) { const ox = (hash(i * 7 + j) - 0.5) * w * 1.4, oy = hash(i * 3 + j) * 20; g.beginPath(); g.moveTo(x + ox - 7, y + oy); g.quadraticCurveTo(x + ox, y + oy - 6, x + ox + 7, y + oy); g.stroke(); } }
    g.globalAlpha = 1;
    [[290, 282, 112, 42], [640, 232, 104, 40], [740, 200, 70, 30], [400, 110, 100, 36], [560, 85, 82, 30], [90, 300, 92, 34], [240, 30, 110, 40], [40, 470, 84, 30], [250, 470, 70, 26]].forEach(([x, y, rx, ry], i) => mhPinePad(g, x + (i % 2 ? sway : 0), y, rx, ry, i));
  }
  // The magpie, perched (pose by t) or in flight; origin at its feet, facing left.
  function mhMagpie(g, t) {
    const caw = MH_T.caws.reduce((m, c) => Math.max(m, 1 - Math.abs(t - c - 0.06) / 0.1), 0);
    const beak = clamp(caw) * 0.35, fly = t < MH_T.land, flap = fly ? Math.sin(t * 26) : 0;
    const head = Math.sin(t * 2.2) * 0.06 + (t > 3.2 && t < 4.6 ? 0.25 : 0) * E.ioS(seg(t, 3.2, 3.5)) * (1 - seg(t, 4.4, 4.6));
    // long tail
    tube(g, [[30, -34], [80, -10], [130, 18], [168, 42]], 11, 9); mhFI(g, MH.blue, 2.4);
    g.globalAlpha = MH_R.col; g.strokeStyle = '#1a2f50'; g.lineWidth = 2; g.beginPath(); g.moveTo(40, -28); g.lineTo(160, 40); g.stroke(); g.globalAlpha = 1;
    if (!fly) { g.lineWidth = 3; g.strokeStyle = MH.ink; g.beginPath(); g.moveTo(-10, -18); g.lineTo(-12, 0); g.moveTo(4, -18); g.lineTo(6, 0); g.stroke(); }
    // body: black back, white belly
    g.save(); g.rotate(-0.25);
    g.beginPath(); g.ellipse(0, -40, 52, 28, 0, 0, TAU); mhFill(g, MH.ink);
    g.save(); g.beginPath(); g.ellipse(0, -40, 52, 28, 0, 0, TAU); g.clip(); g.beginPath(); g.ellipse(4, -24, 38, 20, 0, 0, TAU); mhFill(g, '#f6f1e4'); g.restore();
    g.beginPath(); g.ellipse(0, -40, 52, 28, 0, 0, TAU); mhInk(g, 2.6);
    g.restore();
    // wing: folded, or flapping in flight
    g.save(); g.translate(6, -52); g.rotate(fly ? -0.6 + flap * 0.9 : 0.12);
    smooth(g, [[-30, -4], [20, -16], [64, 6], [30, 14], [-20, 12]]); mhFI(g, '#20314f', 2.4);
    smooth(g, [[-22, -2], [6, -10], [20, -2], [0, 6]]); mhFill(g, '#f6f1e4');
    g.globalAlpha = MH_R.col; g.strokeStyle = MH.blueL; g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(26 + k * 9, -4 + k * 3); g.lineTo(40 + k * 7, 8 + k * 2); g.stroke(); } g.globalAlpha = 1;
    g.restore();
    // head
    g.save(); g.translate(-44, -62); g.rotate(head);
    g.beginPath(); g.arc(0, 0, 21, 0, TAU); mhFI(g, MH.ink, 2.4);
    g.save(); g.translate(-18, 2);
    poly(g, [[0, -6], [-26, -2 - beak * 8], [0, 0]]); mhFI(g, '#3b2b22', 1.8);
    poly(g, [[0, 0], [-24, 3 + beak * 14], [0, 6]]); mhFI(g, '#3b2b22', 1.8);
    g.restore();
    g.fillStyle = '#f6f1e4'; g.beginPath(); g.arc(-8, -4, 5, 0, TAU); g.fill();
    g.fillStyle = MH.ink; g.beginPath(); g.arc(-9, -4, 2.5, 0, TAU); g.fill();
    g.restore();
  }
  function mhMagpiePos(t) {
    if (t >= MH_T.land) {
      const hop = t > 3.25 && t < 3.55 ? Math.sin(seg(t, 3.25, 3.55) * PI) * 26 : 0;
      const bob = spring(t - MH_T.land, 3, 0.25);
      return [lerp(500, 460, E.ioS(seg(t, 3.25, 3.55))), lerp(290, 298, E.ioS(seg(t, 3.25, 3.55))) - hop + (1 - bob) * 8, 1];
    }
    const u = seg(t, 0.75, MH_T.land), e = E.outQ(u);
    return [lerp(1080, 500, e), lerp(-60, 290, E.outC(u)) - Math.sin(u * PI) * 70, e];
  }
  // The tiger: head-on face, huge ringed eyes, a grin; origin at the head centre.
  function mhTiger(g, t, look) {
    const tail = Math.sin(t * 2.4) * 0.5, tailP = bez([360, 60], [470, 40 + tail * 20], [520 + tail * 30, -120], [440 + tail * 40, -200], 14);
    // tail, with dark rings
    tube(g, tailP, 22, 14); mhFI(g, MH.org, 3);
    g.save(); tube(g, tailP, 22, 14); g.clip();
    for (let i = 2; i < tailP.length; i += 2) { const [x, y] = tailP[i], [x2, y2] = tailP[i - 1]; const a = Math.atan2(y - y2, x - x2) + PI / 2; mhStripe(g, x - Math.cos(a) * 26, y - Math.sin(a) * 26, 52, a, 6); }
    g.restore();
    tube(g, tailP, 22, 14); mhInk(g, 3);
    // haunch and body
    const bodyP = [[30, -50], [190, -60], [330, -10], [400, 90], [360, 200], [210, 214], [80, 180], [10, 90]];
    const body = () => smooth(g, bodyP);
    g.beginPath(); g.ellipse(300, 210, 46, 24, 0, 0, TAU); mhFI(g, MH.cream, 3);
    g.strokeStyle = MH.ink; g.lineWidth = 2.4; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(286 + k * 13, 222); g.lineTo(286 + k * 13, 233); g.stroke(); }
    body(); mhFill(g, MH.org);
    g.save(); body(); g.clip();
    g.beginPath(); g.ellipse(170, 210, 200, 70, -0.05, 0, TAU); mhFill(g, MH.cream);
    [[90, -70, 110, 1.8], [130, -66, 140, 1.72], [175, -62, 150, 1.66], [220, -54, 150, 1.58], [262, -40, 140, 1.48], [300, -24, 130, 1.36], [338, 0, 120, 1.2], [370, 40, 100, 1.0], [395, 90, 70, 0.75]].forEach(([x, y, l, a], i) => { mhStripe(g, x, y, l, a + 0.04 * Math.sin(i), 11 - (i % 2) * 3, 0.1); if (i % 2) mhStripe(g, x + 4, y + l * 0.55, l * 0.35, a + 0.4, 6, 0.08); });
    // leopard rosettes on the haunch (tiger and leopard often merge in minhwa)
    g.globalAlpha = MH_R.col; g.strokeStyle = MH.ink; g.lineWidth = 3.5;
    [[300, 110], [338, 150], [262, 150], [318, 64], [228, 104]].forEach(([x, y]) => { g.fillStyle = '#c97a2c'; g.beginPath(); g.arc(x, y, 12, 0, TAU); g.fill(); for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(x, y, 13, k / 5 * TAU + 0.2, k / 5 * TAU + 0.95); g.stroke(); } g.fillStyle = MH.ink; g.beginPath(); g.arc(x, y, 3.5, 0, TAU); g.fill(); });
    g.globalAlpha = 1;
    g.restore();
    body(); mhInk(g, 3.2);
    // legs and paws
    [[[40, 110], [30, 190], [26, 262]], [[130, 130], [140, 200], [146, 270]]].forEach(leg => {
      tube(g, leg, 32, 28); mhFill(g, MH.org);
      g.save(); tube(g, leg, 32, 28); g.clip(); for (let k = 0; k < 3; k++) mhStripe(g, leg[0][0] - 36, leg[0][1] + 24 + k * 38, 56, 0.2, 7, 0.06); g.restore();
      tube(g, leg, 32, 28); mhInk(g, 3);
      const [px, py] = leg[2]; g.beginPath(); g.ellipse(px, py + 12, 40, 24, 0, 0, TAU); mhFI(g, MH.cream, 3);
      g.strokeStyle = MH.ink; g.lineWidth = 2.4; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(px + k * 13, py + 22); g.lineTo(px + k * 13, py + 34); g.stroke(); }
    });
    // head: ears, ruffed cheeks
    const tilt = Math.sin(t * 1.6) * 0.05 + (t > MH_T.grin ? 0.06 * Math.sin((t - MH_T.grin) * 9) * Math.exp(-(t - MH_T.grin) * 2) : 0);
    g.save(); g.rotate(tilt);
    [-1, 1].forEach(s => { g.beginPath(); g.arc(s * 96, -96, 38, 0, TAU); mhFI(g, MH.org, 3); g.beginPath(); g.arc(s * 96, -94, 21, 0, TAU); mhFI(g, MH.pink, 2); });
    const headP = [];
    for (let k = 0; k < 40; k++) { const a = k / 40 * TAU, rr = (k % 2 && Math.abs(Math.cos(a)) > 0.45 && Math.sin(a) > -0.3 ? 1.12 : 1); headP.push([Math.cos(a) * 150 * rr, Math.sin(a) * 124 * rr + (Math.sin(a) > 0 ? Math.sin(a) * 14 : 0)]); }
    const head = () => poly(g, headP);
    head(); mhFill(g, MH.org);
    g.save(); head(); g.clip();
    // forehead bars and cheek stripes
    [[-34, -112, 68, 0, 8], [-28, -94, 56, 0, 7], [-20, -78, 40, 0, 6]].forEach(([x, y, l, a, w]) => mhStripe(g, x, y, l, a, w, 0.05));
    [-1, 1].forEach(s => { [[-14, 0.2], [16, 0.08], [46, -0.05], [76, -0.18]].forEach(([y, a]) => mhStripe(g, s * 160, y, 74, s > 0 ? PI + a : -a, 9, 0.1)); mhStripe(g, s * 64, -124, 54, s > 0 ? 2.1 : 1.04, 7, 0.08); });
    g.restore();
    head(); mhInk(g, 3.4);
    // muzzle, nose, grin
    const grin = E.outB(seg(t, MH_T.grin, MH_T.grin + 0.25)) * (1 - 0.3 * seg(t, 5.2, 5.6));
    const mo = 12 + 26 * grin;
    smooth(g, [[-62, 62], [-40, 66 + mo], [0, 74 + mo * 1.3], [40, 66 + mo], [62, 62], [0, 70]]); mhFI(g, MH.redD, 3);
    poly(g, [[-36, 68], [-28, 68 + 12 + mo * 0.4], [-20, 68]]); mhFI(g, '#fffaf0', 1.8);
    poly(g, [[36, 68], [28, 68 + 12 + mo * 0.4], [20, 68]]); mhFI(g, '#fffaf0', 1.8);
    g.beginPath(); g.ellipse(-36, 46, 42, 30, 0.1, 0, TAU); mhFI(g, MH.cream, 2.6);
    g.beginPath(); g.ellipse(36, 46, 42, 30, -0.1, 0, TAU); mhFI(g, MH.cream, 2.6);
    g.globalAlpha = MH_R.col; g.fillStyle = MH.ink;
    [[-50, 40], [-36, 52], [-60, 56], [50, 40], [36, 52], [60, 56]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); });
    g.globalAlpha = 1;
    g.strokeStyle = MH.ink; g.lineWidth = 2;
    [-1, 1].forEach(s => { for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(s * 70, 40 + k * 10); g.quadraticCurveTo(s * 120, 30 + k * 14, s * 170, 26 + k * 22); g.stroke(); } });
    poly(g, [[-20, 16], [20, 16], [0, 36]]); mhFI(g, '#c75b55', 2.6);
    // eyes: huge, ringed, rolling toward the magpie
    const blink = 1 - Math.max(0, 1 - Math.abs(t - 3.95) / 0.07) - Math.max(0, 1 - Math.abs(t - 6.6) / 0.07);
    [-1, 1].forEach(s => {
      const ex = s * 54, ey = -28;
      g.save(); g.translate(ex, ey); g.scale(1, Math.max(0.08, blink));
      g.beginPath(); g.arc(0, 0, 36, 0, TAU); mhFI(g, '#fffaf0', 3.6);
      g.beginPath(); g.arc(look[0] * 8, look[1] * 8, 27, 0, TAU); mhFill(g, MH.yel);
      g.beginPath(); g.arc(look[0] * 13, look[1] * 13, 15, 0, TAU); mhFill(g, MH.ink);
      g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(look[0] * 13 - 5, look[1] * 13 - 6, 5, 0, TAU); g.fill();
      g.restore();
      // brows with a curl
      g.beginPath(); g.moveTo(s * 18, -74); g.quadraticCurveTo(s * 56, -96, s * 96, -70); g.quadraticCurveTo(s * 106, -60, s * 94, -56); mhInk(g, 4);
    });
    g.restore();
  }
  function mhRock(g, pts, seed) {
    smooth(g, pts); mhFI(g, MH.rock, 3);
    g.save(); smooth(g, pts); g.clip();
    const r = rng(seed); g.globalAlpha = MH_R.col;
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    for (let k = 0; k < 6; k++) { const x = lerp(x0, x1, r()), y = lerp(y0, y1, r() * 0.7); g.fillStyle = MH.rockL; g.beginPath(); g.ellipse(x, y, 30 + r() * 40, 12 + r() * 14, -0.3 + r() * 0.6, 0, TAU); g.fill(); }
    g.globalAlpha = 1; g.strokeStyle = MH.ink; g.lineWidth = 2.2;
    for (let k = 0; k < 5; k++) { const x = lerp(x0, x1, 0.15 + r() * 0.7), y = lerp(y0, y1, 0.2 + r() * 0.5); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 20, y + 30, x + 6 + r() * 20, y + 60); g.stroke(); }
    g.restore();
  }
  // Peony: layered scalloped petals around a gold heart; open is 0..1.
  function mhPeony(g, x, y, R, open, cols, seed) {
    if (open <= 0) return;
    g.save(); g.translate(x, y); g.scale(open, open);
    const rings = [[1, 9, cols[0]], [0.74, 8, cols[1]], [0.5, 6, cols[2]]];
    rings.forEach(([rf, n, col], ri) => {
      for (let k = 0; k < n; k++) {
        const a = (k + ri * 0.5) / n * TAU + seed, r0 = R * rf, op = clamp(open * 1.4 - ri * 0.25);
        g.save(); g.rotate(a); g.translate(0, -r0 * 0.45 * op);
        g.beginPath(); g.moveTo(-r0 * 0.36, 0);
        g.bezierCurveTo(-r0 * 0.5, -r0 * 0.5, -r0 * 0.2, -r0 * 0.7, 0, -r0 * 0.6);
        g.bezierCurveTo(r0 * 0.2, -r0 * 0.7, r0 * 0.5, -r0 * 0.5, r0 * 0.36, 0); g.closePath();
        mhFI(g, col, 2.2);
        g.restore();
      }
    });
    g.globalAlpha = MH_R.col; g.fillStyle = MH.yel;
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; g.beginPath(); g.arc(Math.cos(a) * R * 0.14, Math.sin(a) * R * 0.14, R * 0.05, 0, TAU); g.fill(); }
    g.globalAlpha = 1;
    g.restore();
  }
  function mhLeaf(g, x, y, l, a, w = 0.32) {
    const ca = Math.cos(a), sa = Math.sin(a);
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + ca * l * 0.5 - sa * l * w, y + sa * l * 0.5 + ca * l * w, x + ca * l, y + sa * l);
    g.quadraticCurveTo(x + ca * l * 0.5 + sa * l * w, y + sa * l * 0.5 - ca * l * w, x, y);
    mhFI(g, MH.green, 2.2);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + ca * l * 0.85, y + sa * l * 0.85); g.strokeStyle = '#2d5a33'; g.lineWidth = 1.6; g.stroke();
  }

  // The whole kkachi-horangi painting, in painting units (0..800 × 0..1100).
  function mhPainting(g, t, st) {
    g.save();
    g.beginPath(); g.rect(0, 0, MH_PW, MH_PH); g.clip();
    g.fillStyle = st.hanjiPat; g.fillRect(0, 0, MH_PW, MH_PH);
    // a warm age stain from the edges
    const ag = g.createRadialGradient(400, 520, 300, 400, 560, 760); ag.addColorStop(0, 'rgba(160,110,50,0)'); ag.addColorStop(1, 'rgba(150,100,45,0.32)');
    g.fillStyle = ag; g.fillRect(0, 0, MH_PW, MH_PH);
    // ground: a band of ochre with ink grass
    smooth(g, [[-40, 900], [200, 860], [420, 880], [640, 850], [860, 870], [860, 1160], [-40, 1160]]); mhFill(g, '#d9b978');
    mhPine(g, t);
    // the tiger rises from behind the foreground rocks
    const ru = t - MH_T.rise, up = ru <= 0 ? 0 : spring(ru, 2.4, 0.32);
    const [mx, my] = mhMagpiePos(t);
    const look = t < 3.2 ? [0.2, 0.25] : [lerp(0.2, 0.75, E.ioS(seg(t, 3.2, 3.45))), lerp(0.25, -0.7, E.ioS(seg(t, 3.2, 3.45)))];
    if (t > 5.0) { const u = E.ioS(seg(t, 5.0, 5.3)); look[0] = lerp(look[0], 0, u); look[1] = lerp(look[1], 0.1, u); }
    if (up > 0) { g.save(); g.translate(300, 680 + (1 - up) * 420); mhTiger(g, t, look); g.restore(); }
    // foreground: rocks, grass, peonies
    mhRock(g, [[-30, 900], [80, 850], [190, 880], [260, 960], [240, 1040], [-30, 1060]], 11);
    mhRock(g, [[560, 960], [660, 900], [780, 920], [840, 1000], [820, 1080], [560, 1080]], 12);
    smooth(g, [[-40, 1000], [300, 980], [560, 1000], [860, 985], [860, 1160], [-40, 1160]]); mhFI(g, '#c9a463', 2.4);
    g.strokeStyle = MH.ink; g.lineWidth = 2;
    for (let k = 0; k < 26; k++) { const x = 20 + k * 31, y = 1000 + Math.sin(k) * 6; g.beginPath(); g.moveTo(x, y + 10); g.quadraticCurveTo(x + 4, y - 10, x + 10, y - 22); g.moveTo(x + 6, y + 10); g.quadraticCurveTo(x + 14, y - 4, x + 22, y - 14); g.stroke(); }
    const bl = t - MH_T.bloom;
    [[160, 1020, -2.2], [210, 1000, -1.2], [120, 990, -0.6], [640, 1010, -2.0], [690, 990, -0.9], [740, 1020, -0.2], [430, 1040, -1.7], [470, 1030, -1.0]].forEach(([x, y, a], i) => mhLeaf(g, x, y, 70 + (i % 3) * 14, a));
    [[170, 990, 64, 0], [690, 980, 70, 0.18], [440, 1030, 52, 0.32]].forEach(([x, y, R, d], i) => {
      const o = bl <= d ? 0.001 : clamp(E.outB(seg(bl, d, d + 0.55), 2.2), 0, 1.15);
      if (o > 0.01) mhPeony(g, x, y, R, o, i === 1 ? ['#f2d3d0', '#efb6b6', '#e5848c'] : [MH.red, '#d85b5e', MH.pink], i * 0.7);
      else { g.beginPath(); g.ellipse(x, y, 16, 20, 0, 0, TAU); mhFI(g, MH.red, 2.2); }
    });
    // the magpie on its branch (drawn last so it can fly in over the pine)
    g.save(); g.translate(mx, my); const sc = lerp(0.8, 1, seg(t, 0.8, MH_T.land)); g.scale(sc, sc); mhMagpie(g, t); g.restore();
    g.restore();
  }
  // Painting + silk mount + lacquer frame, as one folding-screen panel (centred on the painting).
  function mhMount(g, st, inner) {
    g.fillStyle = MH.lac; g.fillRect(-54, -54, MH_PW + 108, MH_PH + 108);
    g.fillStyle = st.silkPat; g.fillRect(-40, -40, MH_PW + 80, MH_PH + 80);
    g.strokeStyle = '#b48a3c'; g.lineWidth = 3; g.strokeRect(-8, -8, MH_PW + 16, MH_PH + 16);
    g.strokeStyle = MH.redD; g.lineWidth = 4; g.strokeRect(-3, -3, MH_PW + 6, MH_PH + 6);
    inner();
  }
  // Chaekgeori: book-and-scholar's-things shelves in reverse perspective.
  function mhChaek(g, st) {
    g.fillStyle = st.hanjiPat; g.fillRect(0, 0, MH_PW, MH_PH);
    const r = rng(77), X0 = 70, X1 = 730, rows = [60, 300, 540, 780, 1020];
    // shelf carcass with sides seen from both directions at once
    g.fillStyle = '#7a4a2a'; g.fillRect(X0 - 20, rows[0] - 20, X1 - X0 + 40, rows[4] - rows[0] + 40);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      const x0 = j ? 410 : X0, x1 = j ? X1 : 390, y0 = rows[i], y1 = rows[i + 1] - 20;
      g.fillStyle = '#9fc4bd'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      g.fillStyle = '#7fa9a2'; poly(g, [[x0, y0], [x0 + 40, y0 + 30], [x0 + 40, y1], [x0, y1]]); g.fill();
      g.fillStyle = '#d7a86a'; poly(g, [[x0, y1], [x1, y1], [x1 - 30, y1 - 34], [x0 + 40, y1 - 34]]); g.fill();
      g.strokeStyle = MH.ink; g.lineWidth = 2.4; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
      const kind = [0, 1, 3, 2, 2, 3, 1, 0][i * 2 + j];
      if (kind === 0 || kind === 2) {
        // stacked books, each a slanted box with tied covers
        let y = y1 - 34, x = x0 + 70 + r() * 30;
        const n = kind === 0 ? 1 + Math.floor(r() * 2) : 2 + Math.floor(r() * 2);
        for (let b = 0; b < n; b++) {
          const w = 150 + r() * 70, h = 20 + r() * 12, col = [MH.blue, MH.yel, MH.red, MH.green, '#f1e5c8'][Math.floor(r() * 5)];
          // spine-on front (paper edges), cover on top and the side, in a deliberately skewed perspective
          poly(g, [[x, y - h], [x + w, y - h], [x + w, y], [x, y]]); g.fillStyle = '#f4ead2'; g.fill(); g.stroke();
          g.lineWidth = 1; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + 6, y - h + k * h / 4); g.lineTo(x + w - 6, y - h + k * h / 4); g.stroke(); } g.lineWidth = 2.4;
          poly(g, [[x, y - h], [x + w, y - h], [x + w + 30, y - h - 22], [x + 30, y - h - 22]]); g.fillStyle = col; g.fill(); g.stroke();
          poly(g, [[x + w, y - h], [x + w + 30, y - h - 22], [x + w + 30, y - 22], [x + w, y]]); g.fillStyle = col; g.fill(); g.stroke();
          g.fillStyle = MH.ink; g.fillRect(x + w * 0.3, y - h - 1, 4, 3); g.fillRect(x + w * 0.7, y - h - 1, 4, 3);
          y -= 22;
          y -= h + 2; x += (r() - 0.5) * 16;
        }
        // on top: a vase with a peony branch or a fruit bowl
        if (kind === 0) {
          g.beginPath(); g.moveTo(x + 78, y - 70); g.quadraticCurveTo(x + 64, y - 100, x + 40, y - 112); g.moveTo(x + 80, y - 70); g.quadraticCurveTo(x + 104, y - 96, x + 130, y - 100); g.stroke();
          g.fillStyle = MH.green; [[x + 50, y - 92, 2.4], [x + 112, y - 86, 0.6]].forEach(([lx, ly, a]) => { g.beginPath(); g.ellipse(lx, ly, 18, 7, a, 0, TAU); g.fill(); g.stroke(); });
          g.fillStyle = MH.red; [[x + 40, y - 114], [x + 132, y - 102]].forEach(([fx2, fy2]) => { g.beginPath(); g.arc(fx2, fy2, 14, 0, TAU); g.fill(); g.stroke(); });
          g.fillStyle = '#f2efe6'; smooth(g, [[x + 62, y], [x + 40, y - 30], [x + 50, y - 58], [x + 68, y - 66], [x + 68, y - 84], [x + 88, y - 84], [x + 88, y - 66], [x + 106, y - 58], [x + 116, y - 30], [x + 94, y]]); g.fill(); g.stroke();
          g.strokeStyle = MH.blue; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 50, y - 34); g.bezierCurveTo(x + 66, y - 52, x + 90, y - 16, x + 108, y - 36); g.stroke(); g.strokeStyle = MH.ink; g.lineWidth = 2.4;
        }
        else { g.beginPath(); g.ellipse(x + 80, y - 6, 60, 12, 0, 0, TAU); g.fillStyle = '#c9a463'; g.fill(); g.stroke(); [[60, '#e97f6a'], [90, '#f1a35a'], [76, '#d9564a']].forEach(([dx, c], k) => { g.beginPath(); g.arc(x + dx, y - 22 - (k === 2 ? 16 : 0), 16, 0, TAU); g.fillStyle = c; g.fill(); g.stroke(); }); }
      } else if (kind === 1) {
        // blue-and-white jar and a brush holder
        g.fillStyle = '#f4f1e8'; smooth(g, [[x0 + 80, y1 - 34], [x0 + 50, y1 - 120], [x0 + 80, y1 - 170], [x0 + 150, y1 - 170], [x0 + 180, y1 - 120], [x0 + 150, y1 - 34]]); g.fill(); g.stroke();
        g.strokeStyle = MH.blue; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 + 70, y1 - 110); g.bezierCurveTo(x0 + 100, y1 - 140, x0 + 130, y1 - 80, x0 + 160, y1 - 120); g.stroke(); g.strokeStyle = MH.ink; g.lineWidth = 2.4;
        g.fillStyle = '#8c5a34'; g.fillRect(x0 + 220, y1 - 120, 60, 86); g.strokeRect(x0 + 220, y1 - 120, 60, 86);
        for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x0 + 232 + k * 12, y1 - 120); g.lineTo(x0 + 226 + k * 16, y1 - 190); g.stroke(); }
      } else {
        // scrolls in a basket and a pair of spectacles
        for (let k = 0; k < 5; k++) { g.save(); g.translate(x0 + 90 + k * 26, y1 - 40); g.rotate(-0.5 + k * 0.22); g.fillStyle = k % 2 ? '#efe2c2' : '#e2c48c'; g.fillRect(-7, -150, 14, 150); g.strokeRect(-7, -150, 14, 150); g.fillStyle = MH.red; g.fillRect(-9, -156, 18, 10); g.restore(); }
        g.fillStyle = '#b07b40'; poly(g, [[x0 + 60, y1 - 34], [x0 + 220, y1 - 34], [x0 + 230, y1 - 80], [x0 + 50, y1 - 80]]); g.fill(); g.stroke();
        g.lineWidth = 3; g.beginPath(); g.arc(x0 + 270, y1 - 60, 16, 0, TAU); g.moveTo(x0 + 318, y1 - 60); g.arc(x0 + 302, y1 - 60, 16, 0, TAU); g.stroke(); g.lineWidth = 2.4;
      }
    }
  }
  // Sipjangsaeng: sun, clouds, mountains, water, rocks, pine, crane, deer, turtle and the herb of eternal youth.
  function mhLong(g, st) {
    g.fillStyle = st.hanjiPat; g.fillRect(0, 0, MH_PW, MH_PH);
    g.strokeStyle = MH.ink; g.lineWidth = 2.4;
    g.beginPath(); g.arc(560, 160, 70, 0, TAU); g.fillStyle = MH.red; g.fill(); g.stroke();
    const cloud = (x, y, s) => { g.save(); g.translate(x, y); g.scale(s, s); smooth(g, [[-120, 10], [-90, -24], [-40, -30], [-10, -50], [40, -40], [70, -20], [120, -16], [130, 12], [-20, 22]]); g.fillStyle = '#f6f2e8'; g.fill(); g.stroke(); g.beginPath(); g.arc(-50, -12, 14, 0.5, TAU - 0.5); g.arc(10, -24, 12, 0.5, TAU - 0.5); g.stroke(); g.restore(); };
    cloud(220, 140, 1.1); cloud(620, 300, 0.9);
    // mountains: stacked blue-green peaks with white crowns
    [[180, 640, 220, 380, MH.blue], [470, 620, 240, 460, '#3f7f6a'], [680, 660, 180, 300, MH.blue]].forEach(([x, y, w, h, c]) => {
      const m = [[x - w * 1.1, y + 4], [x - w * 0.8, y - h * 0.35], [x - w * 0.45, y - h * 0.62], [x - w * 0.2, y - h * 1.02], [x + w * 0.12, y - h * 1.04], [x + w * 0.38, y - h * 0.66], [x + w * 0.7, y - h * 0.42], [x + w * 1.1, y + 4]];
      smooth(g, m, false); g.closePath(); g.fillStyle = c; g.fill(); g.stroke();
      g.save(); smooth(g, m, false); g.closePath(); g.clip();
      g.fillStyle = '#e9ecdf'; g.beginPath(); g.ellipse(x - w * 0.04, y - h * 0.98, w * 0.42, h * 0.2, 0, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.ellipse(x - w * 0.5, y - h * 0.3, w * 0.25, h * 0.35, 0.3, 0, TAU); g.fill();
      g.restore();
      for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x - w * 0.3 + k * w * 0.2, y - h * 0.7 + Math.abs(k - 1.5) * h * 0.1); g.quadraticCurveTo(x - w * 0.4 + k * w * 0.22, y - h * 0.35, x - w * 0.3 + k * w * 0.26, y - h * 0.05); g.stroke(); }
    });
    // water with fish-scale waves
    g.fillStyle = '#7fa6c9'; g.fillRect(0, 760, MH_PW, 340);
    g.strokeStyle = '#f6f2e8'; g.lineWidth = 3;
    for (let row = 0; row < 8; row++) for (let k = -1; k < 12; k++) { const x = k * 76 + (row % 2) * 38, y = 790 + row * 40; g.beginPath(); g.arc(x, y, 34, PI * 1.05, PI * 1.95); g.stroke(); }
    g.strokeStyle = MH.ink; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 760); g.lineTo(MH_PW, 760); g.stroke();
    // rock islet with the turtle, red bulrocho mushrooms
    smooth(g, [[60, 860], [200, 800], [330, 840], [320, 920], [80, 930]]); g.fillStyle = MH.rock; g.fill(); g.stroke();
    g.beginPath(); g.ellipse(200, 812, 50, 26, 0, PI, TAU); g.fillStyle = '#5d7a4a'; g.fill(); g.stroke();
    g.beginPath(); g.arc(150, 808, 12, 0, TAU); g.fillStyle = '#7d9a5a'; g.fill(); g.stroke();
    for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(198, 790); g.lineTo(198 + Math.cos(-PI / 2 + (k - 1.5) * 0.4) * 80, 790 + Math.sin(-PI / 2 + (k - 1.5) * 0.4) * 80); g.strokeStyle = '#e9d9a8'; g.stroke(); }
    g.strokeStyle = MH.ink;
    [[560, 740], [600, 748], [520, 750]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 20); g.stroke(); g.beginPath(); g.ellipse(x, y - 24, 16, 9, 0, PI, TAU); g.fillStyle = MH.red; g.fill(); g.stroke(); });
    // deer
    const deer = (x, y, s) => {
      g.save(); g.translate(x, y); g.scale(s, 1);
      g.fillStyle = '#b8743e';
      smooth(g, [[-50, -60], [30, -66], [50, -40], [30, -26], [-40, -24], [-58, -40]]); g.fill(); g.stroke();
      [[-40, -26], [-24, -26], [20, -28], [36, -30]].forEach(([lx, ly]) => { g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + 2, ly + 46); g.lineWidth = 5; g.stroke(); }); g.lineWidth = 2.4;
      smooth(g, [[34, -62], [56, -110], [76, -112], [80, -96], [50, -50]]); g.fill(); g.stroke();
      g.fillStyle = '#f6f2e8'; [[-30, -48], [-10, -54], [10, -46], [-20, -38]].forEach(([dx, dy]) => { g.beginPath(); g.arc(dx, dy, 4, 0, TAU); g.fill(); });
      g.beginPath(); g.moveTo(66, -112); g.lineTo(60, -150); g.lineTo(48, -164); g.moveTo(60, -140); g.lineTo(76, -156); g.stroke();
      g.restore();
    };
    deer(260, 760, 1); deer(420, 752, -1);
    // pine on the left and a pair of cranes
    tube(g, bez([60, 760], [20, 600], [110, 520], [60, 420]), 18, 10); g.fillStyle = MH.bark; g.fill(); g.stroke();
    [[90, 440, 80, 26], [40, 520, 60, 22], [130, 560, 60, 22]].forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fillStyle = MH.pine; g.fill(); g.stroke(); });
    const crane = (x, y, s, f) => {
      g.save(); g.translate(x, y); g.scale(s, s);
      smooth(g, [[-40, 0], [0, -12], [40, -4], [10, 12]]); g.fillStyle = '#f6f2e8'; g.fill(); g.stroke();
      poly(g, [[-10, -6], [-70, -60 * f], [-20, -40 * f], [20, -4]]); g.fill(); g.stroke();
      poly(g, [[-60, -54 * f], [-70, -60 * f], [-48, -40 * f]]); g.fillStyle = MH.ink; g.fill();
      g.beginPath(); g.moveTo(-40, 0); g.lineTo(-90, -14); g.lineWidth = 4; g.stroke(); g.lineWidth = 2.4;
      g.fillStyle = MH.red; g.beginPath(); g.arc(-92, -16, 5, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(40, -2); g.lineTo(96, 6); g.stroke();
      g.restore();
    };
    crane(380, 360, 1.1, 1); crane(240, 300, 0.8, -0.6);
  }
  // Moran-do: a peony shrub on a garden rock, emblem of wealth and honour.
  function mhPeonyPanel(g, st, seed) {
    g.fillStyle = st.hanjiPat; g.fillRect(0, 0, MH_PW, MH_PH);
    const r = rng(seed);
    MH_R.ink = 1; MH_R.col = 1;
    mhRock(g, [[200, 1100], [180, 900], [280, 760], [420, 780], [520, 900], [560, 1100]], seed);
    g.strokeStyle = '#5b3622'; g.lineWidth = 6;
    for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(380, 1000); g.quadraticCurveTo(200 + r() * 400, 700, 120 + k * 110, 140 + r() * 400); g.stroke(); }
    for (let k = 0; k < 26; k++) mhLeaf(g, 120 + r() * 560, 200 + r() * 620, 70 + r() * 40, r() * TAU);
    for (let k = 0; k < 7; k++) {
      const c = [[MH.red, '#d85b5e', MH.pink], ['#f2d3d0', '#efb6b6', '#e5848c'], ['#f4d06a', '#f0b84a', '#e39a35']][k % 3];
      mhPeony(g, 140 + r() * 520, 180 + r() * 560, 70 + r() * 30, 1, c, r() * 3);
    }
    // a pair of butterflies
    [[620, 160], [680, 220]].forEach(([x, y], i) => { g.save(); g.translate(x, y); g.rotate(i ? 0.4 : -0.2); [-1, 1].forEach(s => { g.beginPath(); g.ellipse(s * 18, -6, 18, 12, s * 0.5, 0, TAU); g.fillStyle = MH.yel; g.fill(); g.strokeStyle = MH.ink; g.lineWidth = 2; g.stroke(); }); g.restore(); });
  }
  // Camera over the painting, then out to the screen: [focus x, focus y, zoom].
  const MH_CAM = { x: [[0, 470], [2.2, 480], [3.0, 430], [4.6, 420], [5.4, 410], [5.8, 410], [7.3, 400]], y: [[0, 250], [2.2, 280], [3.0, 590], [4.6, 610], [5.4, 690], [5.8, 700], [7.3, 779]], z: [[0, 2.05], [2.2, 1.95], [3.0, 1.34], [4.6, 1.28], [5.4, 1.14], [5.8, 1.12], [7.3, 0.6]] };
  const MH_Z = 0.6, MH_PANW = (MH_PW + 108) * MH_Z;

  MG.film({
    id: 'minhwa', dur: 10, poster: 4.5,
    fonts: [['400 110px "Song Myung"', '민화까치호랑이'], ['900 40px "Noto Serif KR"', '民畫'], ['700 40px "Cormorant SC"', 'MINHWA KOREAN FOLK PAINTING JOSEON'], ['italic 500 30px "Cormorant Garamond"', 'magpie and tiger, 18th–19th century']],
    meta: {
      family: 'I', name: 'Minhwa 민화', sub: 'Korean Folk Painting', era: '18th–19th c. —',
      origin: 'In late Joseon Korea, anonymous itinerant painters made “people’s paintings” for ordinary homes: magpie-and-tiger pictures to ward off evil at New Year, chaekgeori bookshelf screens, peonies for wealth and the ten symbols of longevity. Flat mineral colour, firm ink outlines and a cheerfully foolish tiger set them apart from court painting; Yanagi Muneyoshi championed them, and the 2018 PyeongChang Olympic mascot Soohorang descends from that tiger.',
      works: 'Magpie and Tiger (Kkachi Horangi), 19th c., Leeum Museum of Art · Chaekgeori screens attributed to Yi Eung-rok (19th c.) · Sipjangsaeng ten-longevity screens (Joseon court and folk) · Moran-do peony screens · Soohorang, PyeongChang 2018 mascot',
      tech: ['Ink outline, flat mineral colour', 'Obangsaek five-colour palette', 'Multi-perspective composition', 'Folding-screen (byeongpung) format'],
      accent: '#c2362f',
      motionDNA: 'Paper-cut-out stiffness with comic timing: the tiger pops up on a spring and rolls its huge eyes, the magpie hops and caws, peonies burst open, and screen panels unfold in a zigzag.',
      visualDNA: 'Outlined, flattened forms in vermilion, ochre, malachite and indigo on yellowed hanji: a striped-and-spotted grinning tiger under a pine, a black-and-white magpie, scalloped peonies and stylised rocks.',
      transitions: 'Ink-then-colour reveal, scroll-viewing tilt, pull-back to a folding screen, panels unfolding, red seal stamp',
      implementation: ['Mineral pigment on hanji', 'Illustrator / Procreate + AE puppet', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const st = {};
      const hp = paperTile(MH.paper, 1392, 0.07);
      const sp = offscreen(64, 64), sg = sp.getContext('2d');
      sg.fillStyle = MH.silk; sg.fillRect(0, 0, 64, 64);
      sg.strokeStyle = MH.silkL; sg.lineWidth = 1.5;
      for (let k = 0; k < 2; k++) { sg.beginPath(); sg.arc(16 + k * 32, 16 + k * 32, 9, 0, TAU); sg.stroke(); sg.beginPath(); sg.arc(16 + k * 32, 16 + k * 32, 3, 0, TAU); sg.stroke(); }
      const tmp = offscreen(4, 4).getContext('2d');
      st.hanjiPat = tmp.createPattern(hp, 'repeat'); st.silkPat = tmp.createPattern(sp, 'repeat');
      // side panels pre-rendered once: [kind, seed]
      const K = 0.7;
      st.panels = [['peony', 41], ['chaek', 0], ['long', 0], ['peony', 57]].map(([kind, seed]) => {
        const c = offscreen(Math.round((MH_PW + 108) * K), Math.round((MH_PH + 108) * K)), g = c.getContext('2d');
        g.scale(K, K); g.translate(54, 54);
        mhMount(g, st, () => { g.save(); g.beginPath(); g.rect(0, 0, MH_PW, MH_PH); g.clip(); if (kind === 'chaek') mhChaek(g, st); else if (kind === 'long') mhLong(g, st); else mhPeonyPanel(g, st, seed); g.restore(); });
        const ag = g.createRadialGradient(400, 520, 300, 400, 560, 760); ag.addColorStop(0, 'rgba(160,110,50,0)'); ag.addColorStop(1, 'rgba(150,100,45,0.3)');
        g.fillStyle = ag; g.fillRect(0, 0, MH_PW, MH_PH);
        return c;
      });
      // room: papered wall and oiled-paper floor
      const room = offscreen(1920, 1080), rg = room.getContext('2d');
      rg.fillStyle = rg.createPattern(paperTile(MH.wall, 77, 0.05), 'repeat'); rg.fillRect(0, 0, 1920, 1080);
      const fl = rg.createLinearGradient(0, 640, 0, 1080); fl.addColorStop(0, '#b98a4c'); fl.addColorStop(1, '#d6ab68');
      rg.fillStyle = fl; rg.fillRect(0, 640, 1920, 440);
      rg.strokeStyle = 'rgba(110,70,30,0.35)'; rg.lineWidth = 2;
      for (let k = 0; k < 6; k++) { const y = 640 + Math.pow(k / 6, 1.6) * 440; rg.beginPath(); rg.moveTo(0, y); rg.lineTo(1920, y); rg.stroke(); }
      for (let k = -12; k <= 12; k++) { rg.beginPath(); rg.moveTo(960 + k * 90, 640); rg.lineTo(960 + k * 260, 1080); rg.stroke(); }
      rg.fillStyle = 'rgba(90,50,20,0.55)'; rg.fillRect(0, 630, 1920, 12);
      // window-lattice light on the wall
      rg.fillStyle = 'rgba(255,240,200,0.18)';
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) rg.fillRect(1500 + i * 60 - j * 20, 120 + j * 60, 50, 50);
      st.room = room;
      return st;
    },
    draw(c, t, W, H, st) {
      // opening reveal: ink draws on, then colour washes in
      MH_R.ink = E.outQ(seg(t, 0.05, 1.3)); MH_R.col = E.ioS(seg(t, 0.55, 1.55));
      c.drawImage(st.room, 0, 0);
      const fx = kf(t, MH_CAM.x), fy = kf(t, MH_CAM.y), z = Math.exp(kf(t, MH_CAM.z.map(([a, b]) => [a, Math.log(b)])));
      const P = (px, py) => [(px - fx) * z + 960, (py - fy) * z + 540];
      // side panels unfold out from behind the centre one, zigzag shaded
      const [cx0] = P(-54, 0), [cx1] = P(MH_PW + 54, 0), [, py0] = P(0, -54), [, py1] = P(0, MH_PH + 54);
      const pw = cx1 - cx0, ph = py1 - py0;
      const open = [E.outC(seg(t, 6.25, 7.15)), E.outC(seg(t, 6.6, 7.5))];
      if (t > 6.2) {
        // floor shadow under the screen
        c.save(); c.fillStyle = 'rgba(60,30,10,0.28)'; c.filter = 'blur(14px)';
        const sw = pw * (1 + 2 * open[0] + 2 * open[1]);
        c.fillRect(960 - sw / 2, py1 - 14, sw, 34); c.restore();
      }
      [1, 0].forEach(lv => [-1, 1].forEach(s => {
        const o = open[lv]; if (o <= 0.001) return;
        const img = st.panels[s < 0 ? 1 - lv : 2 + lv];
        const hinge = s < 0 ? cx0 - (lv ? pw * open[0] : 0) : cx1 + (lv ? pw * open[0] : 0);
        const w = pw * o, x = s < 0 ? hinge - w : hinge;
        const dy = (1 - o) * ph * 0.04;
        c.drawImage(img, x, py0 + dy, w, ph - dy * 2);
        const dark = (lv === 0) === (s < 0) ? 0.2 : 0.04;
        const gr = c.createLinearGradient(x, 0, x + w, 0);
        gr.addColorStop(0, `rgba(40,20,10,${dark + (1 - o) * 0.4})`); gr.addColorStop(1, `rgba(40,20,10,${dark * 0.4 + (1 - o) * 0.3})`);
        c.fillStyle = gr; c.fillRect(x, py0 + dy, w, ph - dy * 2);
      }));
      // the live painting (centre panel)
      c.save(); c.translate(960, 540); c.scale(z, z); c.translate(-fx, -fy);
      mhMount(c, st, () => mhPainting(c, t, st));
      c.restore();
      if (t > 6.2) { c.fillStyle = 'rgba(30,15,5,0.5)'; c.fillRect(cx0 - 2, py0, 4, ph); c.fillRect(cx1 - 2, py0, 4, ph); }
      // title: 민화 brushed onto the floor, then the red seal
      if (t > MH_T.title) {
        const u = E.outC(seg(t, MH_T.title, MH_T.title + 0.6));
        c.save(); c.globalAlpha = u;
        text(c, '민화', 960, 905 + (1 - u) * 16, { font: '"Song Myung", serif', size: 120, align: 'center', color: MH.ink, ls: 18 });
        const u2 = E.outC(seg(t, MH_T.title + 0.25, MH_T.title + 0.85));
        c.globalAlpha = u2;
        text(c, 'MINHWA  ·  KOREAN FOLK PAINTING', 960, 975, { font: '"Cormorant SC", serif', weight: 700, size: 36, align: 'center', color: '#3b2716', ls: 7 });
        text(c, 'magpie and tiger · Joseon, 18th–19th century', 960, 1022, { font: '"Cormorant Garamond", serif', style: 'italic', weight: 500, size: 28, align: 'center', color: 'rgba(59,39,22,0.8)' });
        c.restore();
        if (t > MH_T.seal) {
          const ps = E.outB(seg(t, MH_T.seal, MH_T.seal + 0.18), 2.4), sx = 1132, sy = 860;
          c.save(); c.translate(sx, sy); c.scale(1.6 - 0.6 * ps, 1.6 - 0.6 * ps); c.globalAlpha = clamp(ps * 2);
          roughPoly(c, [[-38, -38], [38, -38], [38, 38], [-38, 38]], 9, 1.6, 10); c.fillStyle = '#b8282a'; c.fill();
          text(c, '民', 0, -15, { font: '"Noto Serif KR", serif', weight: 900, size: 34, align: 'center', base: 'middle', color: '#f6e6cf' });
          text(c, '畫', 0, 18, { font: '"Noto Serif KR", serif', weight: 900, size: 34, align: 'center', base: 'middle', color: '#f6e6cf' });
          c.restore();
        }
      }
      grain(c, W, H, t, 0.05, 'multiply');
      vignette(c, W, H, 0.3, '60,35,15');
    },
    score(A) {
      A.bus.gain.value = 1.1;
      // gayageum: plucked silk with a nonghyeon bend; pentatonic on G (sol-la-do-re-mi)
      const gy = (t, m, g = 0.2, o = {}) => A.pluck(t, midi(m), { dur: 2.2, g, bright: 0.45, decay: 0.997, lp: 3200, rev: 0.35, pan: o.pan || 0, bend: o.bend, bendAt: o.at ?? 0.18, bendT: 0.12 });
      [[0.15, 55], [0.45, 62], [0.75, 67, 1.06], [1.3, 69], [1.6, 67], [1.9, 64, 0.94], [2.6, 62], [3.1, 67], [3.35, 69, 1.06], [3.85, 72], [5.55, 69], [5.85, 67, 0.94], [8.9, 67], [9.2, 62], [9.45, 55]].forEach(([t, m, b], i) => gy(t, m, i % 3 ? 0.16 : 0.22, { bend: b, pan: (hash(i) - 0.5) * 0.6 }));
      // daegeum: breathy bamboo flute with wide vibrato
      const dg = (t, m, d, g = 0.06) => { A.osc(t, { f: midi(m), dur: d, g, a: 0.15, hold: true, rel: 0.3, vib: [5.2, midi(m) * 0.012], lp: 2400, rev: 0.5 }); A.noise(t, { type: 'bandpass', f: midi(m) * 2, q: 4, dur: d, g: g * 0.5, a: 0.1, hold: true, rel: 0.3 }); };
      dg(0.1, 79, 1.6, 0.045); dg(5.8, 74, 0.7); dg(6.5, 76, 0.6); dg(7.1, 79, 1.2); dg(8.0, 74, 1.6, 0.05);
      // janggu, a gutgeori-like 12/8 cycle once the tiger shows up
      const u = 1 / 6;
      const kung = (t, g = 0.5) => { A.osc(t, { f: 120, f2: 70, glide: 0.12, dur: 0.35, g }); A.noise(t, { type: 'lowpass', f: 600, dur: 0.12, g: g * 0.3 }); };
      const deok = (t, g = 0.3) => { A.noise(t, { type: 'bandpass', f: 2600, q: 1.4, dur: 0.06, g }); A.osc(t, { f: 520, f2: 380, glide: 0.04, dur: 0.06, g: g * 0.5, type: 'triangle' }); };
      for (let bar = 0; bar < 3; bar++) {
        const b0 = 2.55 + bar * 12 * u;
        [[0, 'D'], [3, 'k'], [5, 'd'], [6, 'k'], [9, 'd'], [10, 'r'], [11, 'r']].forEach(([s, k]) => {
          const t = b0 + s * u; if (t > 6.0) return;
          if (k === 'D') { kung(t, 0.6); deok(t, 0.3); } else if (k === 'k') kung(t, 0.38); else if (k === 'd') deok(t, 0.24); else deok(t, 0.13);
        });
      }
      // the magpie: kkak-kkak
      MH_T.caws.forEach((t, i) => {
        A.noise(t, { type: 'bandpass', f: 1700 + (i % 2) * 150, q: 3, dur: 0.09, g: 0.32, pan: 0.35 });
        A.osc(t, { type: 'square', f: 980, f2: 760, glide: 0.08, dur: 0.09, g: 0.05, lp: 2600, pan: 0.35 });
      });
      A.whoosh(1.0, 0.7, { f1: 600, f2: 2000, g: 0.08, pan: 0.5 });
      [1.05, 1.2, 1.35, 1.5].forEach(t => A.noise(t, { type: 'bandpass', f: 900, q: 1, dur: 0.05, g: 0.06, pan: 0.4 }));
      // the tiger: a springy pop up, then a comic growl with the grin
      A.osc(MH_T.rise, { f: 90, f2: 260, glide: 0.3, dur: 0.4, g: 0.25, type: 'triangle' });
      A.whoosh(MH_T.rise - 0.1, 0.5, { f1: 200, f2: 900, g: 0.12 });
      A.osc(MH_T.grin, { type: 'sawtooth', f: 78, f2: 62, glide: 0.6, dur: 0.75, g: 0.14, lp: 520, vib: [11, 6], a: 0.04 });
      A.osc(MH_T.grin + 0.05, { type: 'sawtooth', f: 117, f2: 92, glide: 0.6, dur: 0.6, g: 0.06, lp: 700, vib: [11, 8], a: 0.04 });
      // peonies open: a glissando up the strings
      [55, 57, 60, 62, 64, 67, 69, 72, 74, 76].forEach((m, i) => gy(MH_T.bloom + i * 0.055, m, 0.12, { pan: (i / 9 - 0.5) * 0.8 }));
      // the screen: whoosh back, panel hinges clack open
      A.whoosh(MH_T.pull, 1.4, { f1: 200, f2: 1400, g: 0.1 });
      [6.3, 6.62, 6.9, 7.2].forEach((t, i) => { A.noise(t, { type: 'bandpass', f: 1400 - i * 120, q: 4, dur: 0.05, g: 0.22, pan: i % 2 ? 0.4 : -0.4 }); A.osc(t, { f: 300 - i * 20, f2: 200, glide: 0.05, dur: 0.08, g: 0.12 }); });
      // title: a jing gong, then the seal
      A.osc(MH_T.title, { f: midi(43), dur: 2.0, g: 0.16, a: 0.01, rev: 0.6, vib: [3, 1.2] });
      A.bell(MH_T.title, midi(55), { g: 0.06, dur: 2.0, ratios: [1, 1.48, 2.02, 2.73], rev: 0.6 });
      A.osc(MH_T.seal, { f: 140, f2: 70, glide: 0.15, dur: 0.3, g: 0.2 });
      A.noise(MH_T.seal, { type: 'lowpass', f: 900, dur: 0.1, g: 0.15 });
    },
  });
  /* =====================================================================
     WYCINANKI — Polish folk paper-cut: a folded sheet is cut freehand with
     shears, unfolds into a symmetric Kurpie leluja (tree of life), then a
     Łowicz star is glued up layer by layer, roosters and all, until the
     rooster crows and the title lands in cut paper
     ===================================================================== */
  const WY = {
    wall: '#e7ecec', back: '#f4f0e6', green: '#1f7a3a', red: '#c8262f', black: '#1a1716', mag: '#d6246e', grn: '#2e9a48',
    yel: '#f5c02a', blue: '#2c5fb8', org: '#f07a22', vio: '#7a3fa0', ink: '#2a2420',
  };
  const WY_LH = 700, WY_LW = 460, WY_K = 1.5;          // leluja size (world units) and its raster scale
  const WY_L = [380, 440], WY_R = [1540, 440], WY_G = [960, 460];
  const WY_BEAT = 1 / 3;
  const WY_T = { cut: [0.35, 2.95], unfold: [3.0, 3.6], layers: [4.33, 4.67, 5.0, 5.33, 5.67, 6.0, 6.33, 6.67], right: [6.7, 7.15], crow: 7.0, frieze: 7.2, title: 7.8 };
  const wyRel = b => lerp(WY_T.cut[0], WY_T.cut[1], (360 - b.y0) / 720);   // when the shears free a band
  const WY_SNIPS = Array.from({ length: 16 }, (_, k) => WY_T.cut[0] + k / 6);

  // Right half of the leluja (x ≥ 0), y from -350 (top) to 350 (bottom).
  function wyLelujaHalf(g) {
    g.fillStyle = '#000'; g.strokeStyle = '#000'; g.lineCap = 'round'; g.lineJoin = 'round';
    g.fillRect(-1, -280, 10, 600);
    poly(g, [[-1, 230], [34, 230], [24, 248], [62, 270], [86, 306], [74, 336], [96, 350], [-1, 350]]); g.fill();
    const leaf = (x, y, l, a, w = 0.34) => { const ca = Math.cos(a), sa = Math.sin(a); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + ca * l * 0.5 - sa * l * w, y + sa * l * 0.5 + ca * l * w, x + ca * l, y + sa * l); g.quadraticCurveTo(x + ca * l * 0.5 + sa * l * w, y + sa * l * 0.5 - ca * l * w, x, y); g.fill(); };
    const tulip = (x, y, s, a) => {
      g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
      g.beginPath(); g.moveTo(-22, 0); g.quadraticCurveTo(-30, -26, -26, -46); g.lineTo(-12, -30); g.lineTo(0, -54); g.lineTo(12, -30); g.lineTo(26, -46); g.quadraticCurveTo(30, -26, 22, 0); g.closePath(); g.fill();
      g.restore();
    };
    const arm = (pts, w0, w1, end) => { tube(g, pts, w0, w1); g.fill(); end(pts[pts.length - 1]); };
    arm(bez([0, 186], [90, 180], [160, 130], [158, 64], 14), 8, 5, ([x, y]) => tulip(x, y + 4, 1.25, 0.05));
    arm(bez([0, 66], [80, 64], [150, 30], [196, -18], 14), 7, 5, ([x, y]) => leaf(x, y, 70, -0.6, 0.4));
    arm(bez([0, -76], [60, -86], [118, -124], [124, -176], 14), 7, 5, ([x, y]) => tulip(x, y + 2, 1.05, 0.1));
    arm(bez([0, -186], [40, -194], [70, -214], [80, -236], 10), 5, 4, ([x, y]) => leaf(x, y, 44, -1.0, 0.4));
    [[6, 140, 70, -0.55], [6, 20, 64, -0.5], [6, -120, 56, -0.6], [6, 240, 60, -0.35], [150, 72, 50, 0.6], [110, -140, 40, 0.9]].forEach(([x, y, l, a]) => leaf(x, y, l, a));
    // a bird on the middle arm, facing the trunk
    g.beginPath(); g.ellipse(112, 22, 36, 18, -0.2, 0, TAU); g.fill();
    g.beginPath(); g.arc(80, 4, 13, 0, TAU); g.fill();
    poly(g, [[70, -2], [54, 4], [70, 8]]); g.fill();
    poly(g, [[136, 14], [186, -26], [176, 2], [194, 10], [140, 30]]); g.fill();
    // crown: a rosette with a tulip above
    g.beginPath(); g.arc(0, -246, 36, 0, TAU); g.fill();
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.beginPath(); g.arc(Math.cos(a) * 40, -246 + Math.sin(a) * 40, 9, 0, TAU); g.fill(); }
    tulip(0, -282, 1.25, 0);
  }
  // Cut-outs inside the shape: slit veins, eyes, diamonds.
  function wyLelujaHoles(g) {
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.strokeStyle = '#000'; g.lineCap = 'round';
    const dia = (x, y, r) => { poly(g, [[x, y - r], [x + r * 0.7, y], [x, y + r], [x - r * 0.7, y]]); g.fill(); };
    [[36, 300, 9], [58, 318, 7], [20, 272, 6]].forEach(([x, y, r]) => dia(x, y, r));
    g.beginPath(); g.arc(78, 2, 3.5, 0, TAU); g.fill();
    g.lineWidth = 2.6;
    [[[22, 128], [52, 106]], [[22, 8], [50, -12]], [[22, -130], [44, -150]], [[100, 18], [130, 22]], [[106, 30], [128, 32]]].forEach(([a, b]) => { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); });
    dia(0, -246, 14); dia(0, 150, 0); dia(158, 40, 7); dia(124, -196, 6);
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU + PI / 8; g.beginPath(); g.arc(Math.cos(a) * 24, -246 + Math.sin(a) * 24, 4, 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'source-over';
  }
  // Tint a mask canvas into a coloured sheet with glazed-paper texture.
  function wyTint(mask, col, pat, alpha = 0.5) {
    const c = offscreen(mask.width, mask.height), g = c.getContext('2d');
    g.drawImage(mask, 0, 0);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = 'source-atop'; g.globalAlpha = alpha; g.fillStyle = pat; g.fillRect(0, 0, c.width, c.height);
    const sh = g.createLinearGradient(0, 0, c.width, c.height); sh.addColorStop(0, 'rgba(255,255,255,0.12)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.08)');
    g.globalAlpha = 1; g.fillStyle = sh; g.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function wyShadow(mask, blur = 5, a = 0.32) {
    const c = offscreen(mask.width + 40, mask.height + 40), g = c.getContext('2d');
    g.filter = `blur(${blur}px)`; g.globalAlpha = a; g.drawImage(mask, 20, 20);
    g.globalCompositeOperation = 'source-in'; g.filter = 'none'; g.globalAlpha = 1; g.fillStyle = '#2a2a30'; g.fillRect(0, 0, c.width, c.height);
    return c;
  }
  // Rooster facing right, origin at the feet. part: 'base' (black, swollen), 'col' (colour layer), 'top' (details).
  function wyRooster(g, part) {
    const body = () => smooth(g, [[-48, -40], [-10, -62], [30, -66], [52, -96], [62, -126], [84, -134], [96, -118], [88, -92], [80, -56], [62, -24], [24, -6], [-30, -10]]);
    const feathers = [[[-30, -40], [-70, -90], [-120, -110], [-150, -80]], [[-34, -34], [-90, -64], [-140, -60], [-160, -20]], [[-30, -26], [-80, -30], [-120, -10], [-130, 30]], [[-26, -48], [-50, -110], [-96, -150], [-130, -140]]];
    if (part === 'base') {
      g.fillStyle = WY.black; g.strokeStyle = WY.black; g.lineJoin = 'round'; g.lineCap = 'round';
      body(); g.lineWidth = 14; g.stroke(); g.fill();
      feathers.forEach(f => { tube(g, bez(...f, 10), 16, 10); g.fill(); });
      [[0, 0], [24, 0]].forEach(([x]) => { g.lineWidth = 9; g.beginPath(); g.moveTo(x + 4, -12); g.lineTo(x, 2); g.lineTo(x + 16, 4); g.stroke(); });
      for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(74 + k * 11, -140 - (k === 1 ? 6 : 0), 11, 0, TAU); g.fill(); }
      poly(g, [[94, -128], [114, -120], [94, -112]]); g.fill();
      g.beginPath(); g.ellipse(94, -100, 9, 14, 0, 0, TAU); g.fill();
    } else if (part === 'col') {
      body(); g.fillStyle = WY.org; g.fill();
      [WY.grn, WY.blue, WY.mag, WY.yel].forEach((c, i) => { tube(g, bez(...feathers[i], 10), 9, 5); g.fillStyle = c; g.fill(); });
      smooth(g, [[-26, -40], [10, -54], [40, -44], [30, -22], [-10, -18]]); g.fillStyle = WY.grn; g.fill();
      for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(74 + k * 11, -140 - (k === 1 ? 6 : 0), 7, 0, TAU); g.fillStyle = WY.red; g.fill(); }
      g.beginPath(); g.ellipse(93, -100, 5, 9, 0, 0, TAU); g.fill();
      poly(g, [[94, -126], [108, -120], [94, -115]]); g.fillStyle = WY.yel; g.fill();
    } else {
      smooth(g, [[-14, -38], [10, -48], [30, -40], [20, -28], [-4, -26]]); g.fillStyle = WY.yel; g.fill();
      g.fillStyle = WY.vio; [[60, -80], [48, -60], [70, -64]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); });
      g.fillStyle = '#fff'; g.beginPath(); g.arc(82, -122, 6, 0, TAU); g.fill();
      g.fillStyle = WY.black; g.beginPath(); g.arc(84, -122, 3, 0, TAU); g.fill();
      g.strokeStyle = WY.mag; g.lineWidth = 3; g.beginPath(); g.moveTo(0, -36); g.quadraticCurveTo(14, -30, 28, -36); g.stroke();
    }
  }
  // Łowicz star (gwiazda) layers, each a function drawing at the origin.
  const WY_STAR = [
    g => { // black base: scalloped disc with 16 pointed rays
      g.fillStyle = WY.black; g.beginPath();
      for (let k = 0; k < 64; k++) { const a = k / 64 * TAU - PI / 2, r = k % 4 === 0 ? 312 : k % 2 ? 268 : 262; k ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.fill();
    },
    g => { // magenta petals
      for (let k = 0; k < 16; k++) { g.save(); g.rotate(k / 16 * TAU); g.beginPath(); g.moveTo(0, -150); g.quadraticCurveTo(46, -230, 0, -298); g.quadraticCurveTo(-46, -230, 0, -150); g.fillStyle = WY.mag; g.fill(); g.restore(); }
    },
    g => { // green leaves between the petals
      for (let k = 0; k < 16; k++) { g.save(); g.rotate((k + 0.5) / 16 * TAU); g.beginPath(); g.moveTo(0, -170); g.quadraticCurveTo(22, -210, 0, -252); g.quadraticCurveTo(-22, -210, 0, -170); g.fillStyle = WY.grn; g.fill(); g.restore(); }
    },
    g => { // yellow scalloped ring
      g.fillStyle = WY.yel; g.beginPath();
      for (let k = 0; k <= 96; k++) { const a = k / 96 * TAU, r = 196 + 9 * Math.abs(Math.sin(a * 12)); k ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.fill();
    },
    g => { // blue inner field with violet scallops
      g.fillStyle = WY.vio; g.beginPath(); g.arc(0, 0, 184, 0, TAU); g.fill();
      g.fillStyle = '#f6efe0'; g.beginPath(); g.arc(0, 0, 170, 0, TAU); g.fill();
      for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; g.fillStyle = k % 2 ? WY.org : WY.blue; g.beginPath(); g.arc(Math.cos(a) * 184, Math.sin(a) * 184, 8, 0, TAU); g.fill(); }
    },
  ];
  // The little tree of life between the roosters, per layer.
  function wyTree(g, part) {
    if (part === 'base') {
      g.fillStyle = WY.black; g.fillRect(-7, -150, 14, 270);
      [[-1], [1]].forEach(([s]) => { g.beginPath(); g.ellipse(s * 26, -60, 28, 12, s * -0.6, 0, TAU); g.fill(); g.beginPath(); g.ellipse(s * 22, 30, 26, 11, s * -0.5, 0, TAU); g.fill(); });
      g.beginPath(); g.arc(0, -160, 30, 0, TAU); g.fill();
      g.fillRect(-60, 112, 120, 18);
    } else if (part === 'col') {
      g.fillStyle = WY.grn; [[-1], [1]].forEach(([s]) => { g.beginPath(); g.ellipse(s * 26, -60, 22, 7, s * -0.6, 0, TAU); g.fill(); g.beginPath(); g.ellipse(s * 22, 30, 20, 6, s * -0.5, 0, TAU); g.fill(); });
      g.fillStyle = WY.mag; g.beginPath(); g.arc(0, -160, 23, 0, TAU); g.fill();
      g.fillStyle = WY.org; g.fillRect(-54, 116, 108, 10);
    } else {
      g.fillStyle = WY.yel; g.beginPath(); g.arc(0, -160, 11, 0, TAU); g.fill();
      for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; g.fillStyle = WY.blue; g.beginPath(); g.arc(Math.cos(a) * 17, -160 + Math.sin(a) * 17, 3.5, 0, TAU); g.fill(); }
    }
  }
  const WY_ROO = [[-112, 104, -1], [112, 104, 1]];     // rooster feet in star space, facing inward
  function wyStarLayer(i) {
    // layers 0..4: rings; 5: roosters base; 6: colour; 7: details
    const S = 680, c = offscreen(S, S), g = c.getContext('2d');
    g.translate(S / 2, S / 2);
    if (i < 5) WY_STAR[i](g);
    else {
      const part = ['base', 'col', 'top'][i - 5];
      wyTree(g, part);
      WY_ROO.forEach(([x, y, s]) => { g.save(); g.translate(x, y); g.scale(-s * 0.74, 0.74); wyRooster(g, part); g.restore(); });
      if (i === 7) for (let k = 0; k < 16; k++) { g.save(); g.rotate(k / 16 * TAU); g.fillStyle = WY.yel; g.beginPath(); g.ellipse(0, -232, 9, 16, 0, 0, TAU); g.fill(); g.fillStyle = WY.black; g.beginPath(); g.arc(0, -232, 3.5, 0, TAU); g.fill(); g.restore(); }
    }
    return c;
  }
  // Shears with the blade tips at (x, y), pointing up the cut; each half pivots on the screw.
  function wyScissors(c, x, y, open, ang) {
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(1.25, 1.25); c.translate(0, 150);
    [-1, 1].forEach(s => {
      c.save(); c.rotate(s * open * 0.2);
      const bl = c.createLinearGradient(-10, 0, 10, 0); bl.addColorStop(0, '#c9ced2'); bl.addColorStop(0.5, '#fbfcfc'); bl.addColorStop(1, '#7e868c');
      c.beginPath(); c.moveTo(0, -150); c.quadraticCurveTo(s * 13, -70, s * 9, 8); c.lineTo(-s * 3, 8); c.quadraticCurveTo(-s * 3, -70, 0, -150); c.closePath();
      c.fillStyle = bl; c.fill(); c.strokeStyle = '#4a4f54'; c.lineWidth = 1.5; c.stroke();
      c.strokeStyle = '#1d1b1e'; c.lineWidth = 13; c.lineCap = 'round';
      c.beginPath(); c.moveTo(-s * 4, 6); c.lineTo(-s * 16, 50); c.stroke();
      c.beginPath(); c.ellipse(-s * 30, 88, 22, 36, s * 0.3, 0, TAU); c.stroke();
      c.restore();
    });
    c.fillStyle = '#5a5f63'; c.beginPath(); c.arc(0, 0, 6, 0, TAU); c.fill();
    c.restore();
  }
  // Closed region between two wavy cut lines (y0 above y1), from the fold (x=0) to x=w.
  const wyWy = (x, y) => y + 9 * Math.sin(x / 23 + y * 0.7) + 5 * Math.sin(x / 9 + y);
  function wyWave(g, y0, y1, w) {
    g.beginPath();
    for (let x = 0; x <= w; x += 5) { const y = y0 <= -360 ? -360 : wyWy(x, y0); x ? g.lineTo(x, y) : g.moveTo(x, y); }
    for (let x = w; x >= 0; x -= 5) g.lineTo(x, y1 >= 360 ? 360 : wyWy(x, y1));
    g.closePath();
  }
  const WY_CAM = { x: [[0, 520], [3.6, 520], [4.4, 960]], y: [[0, 470], [3.6, 470], [4.4, 540]], z: [[0, 1.32], [3.6, 1.32], [4.4, 1.0]] };

  MG.film({
    id: 'wycinanki', dur: 10, poster: 9.4,
    fonts: [['400 150px "Yeseva One"', 'Wycinanki'], ['700 36px "Cormorant SC"', 'POLISH FOLK PAPER-CUT ŁOWICZ KURPIE'], ['italic 500 30px "Cormorant Garamond"', 'scissor-cut glazed paper, vytynanky']],
    meta: {
      family: 'I', name: 'Folk Paper-cut', sub: 'Wycinanki · Vytynanky', era: '19th c. —',
      origin: 'Rural Poland took up paper-cutting in the 19th century, when glazed coloured paper reached village markets: households cut decorations freehand with sheep shears to brighten whitewashed cottage walls and beams for Easter and Christmas. Kurpie cutters fold one sheet to cut symmetric single-colour leluja trees; Łowicz cutters glue many colours in layers into stars and roosters. Ukraine’s vytynanky are a close cousin.',
      works: 'Kurpie leluja and gwiazdy (Kurpie Green Forest region) · Łowicz kodry and gwiazdy, Łowicz Regional Museum · Czesława Kwoka, Kurpie paper-cutter (1932–2021) · Polish Ethnographic Museum collections, Warsaw · Ukrainian vytynanky, Kyiv and Lviv',
      tech: ['Freehand scissor cutting on the fold', 'Mirror symmetry by unfolding', 'Layered glazed paper (Łowicz)', 'Cut-out slits and holes as line'],
      accent: '#d6246e',
      motionDNA: 'Snip-by-snip reveals on the beat: shears trace the fold, scraps drop away, the sheet flips open into symmetry, and coloured layers slap down one on top of another like a mazurka step.',
      visualDNA: 'Matte, flat glazed paper in fuchsia, green, yellow, orange, cobalt and black on a whitewashed wall: mirrored trees of life, birds and roosters, scalloped stars and tiny slit veins, each layer with a crisp edge and soft shadow.',
      transitions: 'Scissor trace, fold-out flip, layer drop, cut-paper title',
      implementation: ['Scissors + glazed paper', 'Illustrator / cut-out AE rigs', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const K = WY_K, LW = Math.round(WY_LW * K), LH = Math.round((WY_LH + 20) * K);
      const pat = offscreen(4, 4).getContext('2d').createPattern(paperTile('#808080', 515, 0.08, 256), 'repeat');
      // leluja: right half, and the full mirrored shape
      const half = offscreen(Math.round(LW / 2), LH), hg = half.getContext('2d');
      hg.scale(K, K); hg.translate(0, LH / 2 / K); wyLelujaHalf(hg); wyLelujaHoles(hg);
      const full = offscreen(LW, LH), fg = full.getContext('2d');
      fg.drawImage(half, LW / 2, 0); fg.save(); fg.translate(LW / 2, 0); fg.scale(-1, 1); fg.drawImage(half, 0, 0); fg.restore();
      // rightmost paper pixel per row, for the scissors to follow
      const d = hg.getImageData(0, 0, half.width, LH).data, env = new Float32Array(LH);
      for (let y = 0; y < LH; y++) { let m = 0; for (let x = half.width - 1; x >= 0; x--) if (d[(y * half.width + x) * 4 + 3] > 100) { m = x; break; } env[y] = m / K; }
      const envS = new Float32Array(LH); for (let y = 0; y < LH; y++) { let s = 0, n = 0; for (let k = -12; k <= 12; k++) { const v = env[clamp(y + k, 0, LH - 1)]; s += v; n++; } envS[y] = s / n; }
      // the folded sheet's offcut, sliced into bands that drop as the shears pass
      const SW = 250, bands = [];
      for (let y0 = -360; y0 < 360; y0 += 60) {
        // band between two wavy scissor lines, padded so the waves fit
        const c = offscreen(Math.round(SW * K), Math.round(100 * K)), g = c.getContext('2d');
        g.scale(K, K); g.translate(0, 20 - y0);
        wyWave(g, y0, y0 + 60, SW); g.fillStyle = WY.back; g.fill();
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalCompositeOperation = 'destination-out'; g.drawImage(half, 0, -(y0 - 20 + LH / 2 / K) * K);
        bands.push({ y0, c });
      }
      const stars = Array.from({ length: 8 }, (_, i) => { return { m: wyStarLayer(i) }; });
      // star layers keep their own colours; add texture + baked shadow
      stars.forEach(s => {
        const c = offscreen(s.m.width, s.m.height), g = c.getContext('2d'); g.drawImage(s.m, 0, 0);
        g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.45; g.fillStyle = pat; g.fillRect(0, 0, c.width, c.height);
        s.img = c; s.sh = wyShadow(s.m, 4, 0.35);
      });
      const wall = offscreen(1920, 1080), wg = wall.getContext('2d');
      wg.fillStyle = wg.createPattern(paperTile(WY.wall, 404, 0.035), 'repeat'); wg.fillRect(0, 0, 1920, 1080);
      const r = rng(9); for (let k = 0; k < 40; k++) { wg.strokeStyle = `rgba(255,255,255,${0.05 + r() * 0.08})`; wg.lineWidth = 30 + r() * 60; wg.beginPath(); const x = r() * 1920, y = r() * 1080; wg.moveTo(x, y); wg.quadraticCurveTo(x + 100, y + (r() - 0.5) * 100, x + 300 + r() * 300, y + (r() - 0.5) * 60); wg.stroke(); }
      const vg = wg.createRadialGradient(960, 520, 300, 960, 540, 1150); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(60,70,80,0.22)');
      wg.fillStyle = vg; wg.fillRect(0, 0, 1920, 1080);
      // frieze tiles along the top: small mirrored tulips, alternating colours
      const tile = (col) => { const m = offscreen(90, 90), g = m.getContext('2d'); g.translate(45, 80); g.fillStyle = '#000'; g.beginPath(); g.moveTo(-30, 0); g.quadraticCurveTo(-40, -36, -32, -60); g.lineTo(-14, -40); g.lineTo(0, -72); g.lineTo(14, -40); g.lineTo(32, -60); g.quadraticCurveTo(40, -36, 30, 0); g.closePath(); g.fill(); g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(0, -26, 7, 0, TAU); g.fill(); return { img: wyTint(m, col, pat), sh: wyShadow(m, 3, 0.3) }; };
      const tiles = [WY.mag, WY.grn, WY.yel, WY.blue, WY.org, WY.red].map(tile);
      return {
        half, full, envS, bands, stars, wall, tiles, LW, LH,
        halfBack: wyTint(half, WY.back, pat, 0.25), halfGreen: wyTint(half, WY.green, pat), fullGreen: wyTint(full, WY.green, pat), fullRed: wyTint(full, WY.red, pat),
        shHalf: wyShadow(half), shFull: wyShadow(full),
      };
    },
    draw(c, t, W, H, st) {
      const K = WY_K, fx = kf(t, WY_CAM.x), fy = kf(t, WY_CAM.y), z = kf(t, WY_CAM.z);
      c.save(); c.translate(960, 540); c.scale(z, z); c.translate(-fx, -fy);
      c.drawImage(st.wall, -400, -300, 2720, 1530);
      const hw = st.half.width / K, hh = st.LH / K;
      const [lx, ly] = WY_L;
      // --- the cut, on the fold (fold line at lx; sheet extends to the right) ---
      const cu = seg(t, WY_T.cut[0], WY_T.cut[1]);
      const ycut = lerp(360, -362, cu);
      const uf = E.ioS(seg(t, WY_T.unfold[0], WY_T.unfold[1]));
      if (t < WY_T.unfold[0]) {
        // shadow + white back of the folded sheet
        c.save(); c.globalAlpha = 0.9; c.drawImage(st.shHalf, lx - 20 / K + 6, ly - hh / 2 - 20 / K + 8, st.shHalf.width / K, st.shHalf.height / K); c.restore();
        // uncut sheet down to the next band still attached
        let ytop = 360; st.bands.forEach(b => { if (t >= wyRel(b)) ytop = Math.min(ytop, b.y0); });
        c.save(); c.translate(lx, ly);
        c.save(); c.fillStyle = 'rgba(40,40,50,0.18)'; c.filter = 'blur(6px)'; c.translate(6, 8); wyWave(c, -360, ytop >= 360 ? 360 : ytop, 250); c.fill(); c.restore();
        c.fillStyle = WY.back; wyWave(c, -360, ytop >= 360 ? 360 : ytop, 250); c.fill();
        c.restore();
        c.drawImage(st.halfBack, lx, ly - hh / 2, hw, hh);
        c.strokeStyle = 'rgba(120,110,95,0.5)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(lx, ly - 360); c.lineTo(lx, ly + 360); c.stroke();
      }
      // offcut bands dropping away
      st.bands.forEach((b, i) => {
        const a = t - wyRel(b);
        if (a < 0 || a > 1.6) return;
        const x = lx + a * (40 + hash(i) * 80), y = ly + b.y0 + 300 * a * a + a * 40, rot = (hash(i * 3) - 0.3) * a * 1.4;
        c.save(); c.globalAlpha = 1 - seg(a, 1.0, 1.6); c.translate(x + 125, y + 30); c.rotate(rot);
        c.shadowColor = 'rgba(30,30,40,0.25)'; c.shadowBlur = 8; c.shadowOffsetY = 6 + a * 20;
        c.drawImage(b.c, -125, -50, 250, 100); c.restore();
      });
      // unfold: the top layer turns over the fold, white back then green face
      if (t >= WY_T.unfold[0]) {
        const lift = Math.sin(uf * PI);
        if (uf < 1) c.drawImage(st.shHalf, lx - 20 / K + 6, ly - hh / 2 - 20 / K + 8, st.shHalf.width / K, st.shHalf.height / K);
        else c.drawImage(st.shFull, lx - st.LW / 2 / K - 20 / K + 6, ly - hh / 2 - 20 / K + 8, st.shFull.width / K, st.shFull.height / K);
        c.drawImage(st.halfGreen, lx, ly - hh / 2, hw, hh);
        if (uf < 1) {
          const sx = Math.cos(uf * PI);
          c.save(); c.globalAlpha = 0.35 * lift; c.drawImage(st.shHalf, lx + sx * 0 - (sx < 0 ? -sx * hw : 0) + 20 + lift * 30, ly - hh / 2 + 20 + lift * 26, Math.abs(sx) * hw, hh); c.restore();
          c.save(); c.translate(lx, ly); c.scale(sx, 1 + lift * 0.03);
          c.drawImage(sx > 0 ? st.halfBack : st.halfGreen, 0, -hh / 2, hw, hh);
          c.fillStyle = `rgba(0,0,0,${0.18 * (1 - Math.abs(sx))})`; c.globalCompositeOperation = 'source-atop'; c.fillRect(0, -hh / 2, hw, hh);
          c.restore();
        } else { c.save(); c.translate(lx, ly); c.scale(-1, 1); c.drawImage(st.halfGreen, 0, -hh / 2, hw, hh); c.restore(); }
      }
      // scissors: ride the right edge of the shape, snipping on every eighth
      if (t > 0.05 && t < WY_T.cut[1] + 0.5) {
        const ph = WY_SNIPS.reduce((m, s) => (t >= s ? s : m), -1), since = ph < 0 ? 1 : t - ph;
        const open = since < 0.06 ? 1 - since / 0.06 : clamp((since - 0.06) / 0.09);
        const row = clamp(Math.round((ycut + hh / 2) * K), 0, st.LH - 1);
        let sx = lx + st.envS[row] + 6, sy = ly + ycut;
        if (t < WY_T.cut[0]) { const u = E.outC(seg(t, 0.05, WY_T.cut[0])); sx = lerp(lx + 700, sx, u); sy = lerp(ly + 600, sy, u); }
        if (t > WY_T.cut[1]) { const u = E.inC(seg(t, WY_T.cut[1], WY_T.cut[1] + 0.5)); sx = lerp(sx, lx + 800, u); sy = lerp(sy, ly - 200, u); }
        c.save(); c.shadowColor = 'rgba(20,20,30,0.3)'; c.shadowBlur = 14; c.shadowOffsetX = 10; c.shadowOffsetY = 14;
        wyScissors(c, sx, sy, cu > 0 && cu < 1 ? open : 0.6, 0.18); c.restore();
      }
      // --- Łowicz star, glued layer by layer on the beat ---
      const [gx, gy] = WY_G;
      st.stars.forEach((s, i) => {
        const t0 = WY_T.layers[i], a = t - (t0 - 0.2); if (a <= 0) return;
        const u = E.outC(clamp(a / 0.2)), sc = lerp(1.25, 1, u), al = clamp(a / 0.12);
        // the whole star jumps when the rooster crows
        const ca = t - WY_T.crow, crow = ca > 0 ? Math.sin(ca * 22) * Math.exp(-ca * 5) * 0.035 : 0;
        c.save(); c.translate(gx, gy); c.scale(1 + crow, 1 + crow); c.rotate(crow * 0.5);
        c.globalAlpha = al * u; c.drawImage(s.sh, -360 + 4 + (1 - u) * 30, -360 + 6 + (1 - u) * 40, 720, 720);
        c.globalAlpha = al; c.scale(sc, sc); c.translate(0, -(1 - u) * 30);
        c.drawImage(s.img, -340, -340, 680, 680); c.restore();
      });
      // the right-hand leluja, in red, flipped open from its fold
      const ru = E.ioS(seg(t, WY_T.right[0], WY_T.right[1]));
      if (ru > 0) {
        const [rx, ry] = WY_R, sx = Math.max(0.02, ru);
        c.save(); c.globalAlpha = ru; c.drawImage(st.shFull, rx - st.LW / 2 / K * sx - 20 / K + 6, ry - hh / 2 - 20 / K + 8, st.shFull.width / K * sx, st.shFull.height / K); c.restore();
        c.save(); c.translate(rx, ry); c.scale(sx, 1); c.drawImage(st.fullRed, -st.LW / 2 / K, -hh / 2, st.LW / K, hh); c.restore();
      }
      // frieze along the top, pasted left to right
      for (let k = 0; k < 22; k++) {
        const t0 = WY_T.frieze + k * 0.025, a = t - t0; if (a <= 0) continue;
        const u = E.outB(clamp(a / 0.18)), x = 4 + k * 88 + 44, y = 70;
        const tl = st.tiles[k % st.tiles.length];
        c.save(); c.translate(x, y); c.scale(u, u);
        c.drawImage(tl.sh, -45 - 20 + 3, -80 - 20 + 4); c.drawImage(tl.img, -45, -80); c.restore();
        c.save(); c.translate(x, 1010); c.rotate(PI); c.scale(u, u); c.drawImage(tl.sh, -45 - 20 - 3, -80 - 20 - 4); c.drawImage(tl.img, -45, -80); c.restore();
      }
      // title: each letter a two-ply paper cut
      if (t > WY_T.title) {
        const s = 'Wycinanki', cols = [WY.mag, WY.grn, WY.org, WY.blue, WY.yel, WY.mag, WY.grn, WY.org, WY.blue];
        c.font = '400 150px "Yeseva One", serif';
        const ws = [...s].map(ch => c.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0) + 6 * (s.length - 1);
        let x = 960 - tot / 2;
        [...s].forEach((ch, i) => {
          const a = t - (WY_T.title + i * WY_BEAT / 3); if (a > 0) {
            const u = E.outC(clamp(a / 0.18)), y = 880 - (1 - u) * 40, rot = (hash(i) - 0.5) * 0.08;
            c.save(); c.translate(x + ws[i] / 2, y); c.rotate(rot); c.scale(lerp(1.3, 1, u), lerp(1.3, 1, u)); c.globalAlpha = clamp(a / 0.1);
            c.shadowColor = 'rgba(30,30,40,0.35)'; c.shadowBlur = 6; c.shadowOffsetX = 3; c.shadowOffsetY = 5;
            text(c, ch, 0, 0, { font: '"Yeseva One", serif', size: 150, align: 'center', color: WY.black, stroke: WY.black, lw: 16 });
            c.shadowColor = 'transparent';
            text(c, ch, 0, 0, { font: '"Yeseva One", serif', size: 150, align: 'center', color: cols[i] });
            c.restore();
          }
          x += ws[i] + 6;
        });
        const u2 = E.outC(seg(t, 8.75, 9.3));
        c.save(); c.globalAlpha = u2;
        text(c, 'POLISH FOLK PAPER-CUT  ·  ŁOWICZ  ·  KURPIE', 960, 950 + (1 - u2) * 10, { font: '"Cormorant SC", serif', weight: 700, size: 34, align: 'center', color: WY.ink, ls: 6 });
        c.restore();
      }
      c.restore();
      grain(c, W, H, t, 0.04, 'multiply');
    },
    score(A) {
      A.bus.gain.value = 1.1;
      const b = WY_BEAT;
      // fiddle: sawtooth with vibrato, a mazurka in G with the raised fourth of highland tunes
      const fid = (t, m, d, g = 0.07) => { A.osc(t, { type: 'sawtooth', f: midi(m), dur: d, g, a: 0.025, hold: true, rel: 0.06, vib: [6, midi(m) * 0.008], lp: 3200, q: 1.5, rev: 0.25 }); };
      const bars = [[74, 76, 78, 74], [79, 78, 76, 74], [76, 78, 73, 74], [71, 71, 74, 79], [74, 76, 78, 79], [81, 79, 78, 76], [78, 79, 81, 83], [81, 79, 78, 76], [79, 78, 76, 73], [74, 79]];
      bars.forEach((ns, bi) => {
        const t0 = bi * 3 * b;
        if (ns.length === 2) { fid(t0, ns[0], b * 2, 0.06); fid(t0 + 2 * b, ns[1], 1.0, 0.07); return; }
        // dotted-eighth, sixteenth, quarter, quarter
        [[0, 0.75], [0.75, 0.25], [1, 1], [2, 1]].forEach(([o, d], k) => fid(t0 + o * b, ns[k], d * b * 0.95, k === 2 ? 0.08 : 0.065));
      });
      // basy (folk cello) and frame drum: heavy one, jingles on two and three
      for (let bi = 0; bi < 10; bi++) {
        const t0 = bi * 3 * b, root = [43, 43, 45, 38, 43, 43, 38, 43, 45, 43][bi];
        A.osc(t0, { type: 'sawtooth', f: midi(root), dur: b * 1.6, g: 0.09, lp: 600, a: 0.02 });
        A.osc(t0 + b, { type: 'sawtooth', f: midi(root + 7), dur: b * 0.8, g: 0.05, lp: 700, a: 0.02 });
        A.osc(t0 + 2 * b, { type: 'sawtooth', f: midi(root + 7), dur: b * 0.8, g: 0.05, lp: 700, a: 0.02 });
        if (bi >= 1) { A.kick(t0, 0.35, { f: 110, f2: 55 }); A.hat(t0 + b, 0.08, true); A.hat(t0 + 2 * b, 0.1, true); }
      }
      // shears: a bright metallic snip on every eighth
      WY_SNIPS.forEach((t, i) => {
        A.noise(t, { type: 'highpass', f: 5500, dur: 0.035, g: 0.22, pan: 0.2 });
        A.noise(t, { type: 'bandpass', f: 3200, q: 6, dur: 0.05, g: 0.12, pan: 0.2 });
        A.osc(t, { f: 2600 + hash(i) * 400, f2: 1800, glide: 0.04, dur: 0.05, g: 0.03, pan: 0.2 });
      });
      // scraps falling, the sheet turning over
      for (let k = 0; k < 12; k++) A.noise(lerp(WY_T.cut[0], WY_T.cut[1], k / 12) + 0.3, { type: 'bandpass', f: 1500 + hash(k) * 1500, q: 1, dur: 0.12, g: 0.03, pan: 0.3 });
      A.noise(WY_T.unfold[0], { type: 'bandpass', f: 900, f2: 3000, sweep: 0.5, q: 0.8, dur: 0.6, g: 0.1, swell: 0.5 });
      A.noise(WY_T.unfold[1], { type: 'lowpass', f: 1800, dur: 0.08, g: 0.2 });
      // each layer glued: a paper slap
      const slap = (t, g = 0.22) => { A.noise(t, { type: 'lowpass', f: 2200, dur: 0.07, g }); A.osc(t, { f: 160, f2: 90, glide: 0.05, dur: 0.08, g: g * 0.5 }); };
      WY_T.layers.forEach(t => slap(t));
      A.noise(WY_T.right[0], { type: 'bandpass', f: 900, f2: 3000, sweep: 0.4, q: 0.8, dur: 0.45, g: 0.08, swell: 0.5 });
      slap(WY_T.right[1], 0.18);
      for (let k = 0; k < 22; k += 3) A.noise(WY_T.frieze + k * 0.025, { type: 'lowpass', f: 2600, dur: 0.04, g: 0.06 });
      // the rooster crows: ku-ku-ry-kuuu
      [[0, 0.11, 640, 820], [0.13, 0.11, 820, 900], [0.27, 0.12, 900, 1080], [0.42, 0.55, 1150, 860]].forEach(([o, d, f1, f2]) => {
        A.osc(WY_T.crow + o, { type: 'sawtooth', f: f1, f2, glide: d, dur: d, g: 0.07, lp: 2600, q: 3, a: 0.015, hold: true, rel: 0.04, vib: o > 0.4 ? [9, 25] : null, pan: -0.2 });
        A.osc(WY_T.crow + o, { type: 'square', f: f1 * 2, f2: f2 * 2, glide: d, dur: d, g: 0.015, lp: 3500, a: 0.015, hold: true, rel: 0.04, pan: -0.2 });
      });
      // title letters: soft slaps and a bell run, then the final chord
      for (let i = 0; i < 9; i++) { const t = WY_T.title + i * b / 3; slap(t, 0.08); A.bell(t, midi([79, 83, 86, 91, 86, 83, 79, 83, 86][i]), { g: 0.04, dur: 1, rev: 0.4 }); }
      A.chord(9.0, [55, 62, 67, 71, 74], { type: 'sawtooth', dur: 1.0, g: 0.025, lp: 2000, a: 0.03, hold: true, rel: 0.4, spread: 6, width: 0.8, rev: 0.4 });
    },
  });
  /* =====================================================================
     PODCAST VISUALIZER — a social audiogram: cover art spins in, two
     voices trade lines while captions type word by word and the waveform
     breathes with every syllable of the score's own formant babble, the
     key quote blows up, and the clip folds into its end card
     ===================================================================== */
  const PC = {
    bg: '#17142e', bg2: '#2a1f4f', org: '#ff6a3d', cream: '#fff3e2', ink: '#14112a', dim: 'rgba(255,243,226,0.45)',
    sp: [{ name: 'Ada Okafor', role: 'HOST', ini: 'AO', col: '#ffb547', f0: 208 }, { name: 'Ruben Lind', role: 'GUEST · ACOUSTICIAN', ini: 'RL', col: '#7ce0c3', f0: 116 }],
  };
  const PCF = '"Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif', PCM = '"JetBrains Mono", Menlo, monospace';
  const PC_FORM = { a: [800, 1250, 2600], e: [480, 1900, 2600], i: [320, 2300, 3000], o: [520, 900, 2500], u: [340, 820, 2350], '@': [520, 1500, 2500] };
  // The script: each line becomes words, each word syllables, each syllable a timed vowel.
  const PC_LINES = [
    { sp: 0, t0: 1.35, text: 'So why do we hum when we’re thinking?', rate: 0.19, q: 1 },
    { sp: 1, t0: 3.5, text: 'Honestly?', rate: 0.17, q: 1 },
    { sp: 1, t0: 4.3, text: 'Humming is your brain’s screensaver.', rate: 0.2, key: 1 },
    { sp: 0, t0: 6.2, text: 'Ha!', rate: 0.13, laugh: 1 },
    { sp: 1, t0: 6.6, text: 'It keeps the lights on.', rate: 0.17 },
  ];
  const PC_SYL = [];
  PC_LINES.forEach((L, li) => {
    let t = L.t0;
    const ws = L.text.split(' ');
    L.words = ws.map((w, wi) => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, '');
      let groups = clean.match(/[aeiouy]+/g) || ['@'];
      if (groups.length > 1 && /e$/.test(clean) && !/[aeiouy]e$/.test(clean)) groups = groups.slice(0, -1);
      if (L.laugh) groups = ['a', 'a'];
      const W = { w, t0: t, syl: [] };
      groups.forEach((gp, si) => {
        const v = gp[0] === 'y' ? 'i' : PC_FORM[gp[0]] ? gp[0] : '@';
        const idx = clean.indexOf(gp), onset = clean.slice(0, idx).replace(/.*[aeiouy]/, '');
        const stress = (L.key && /screen|hum/.test(clean) && si === 0) || (ws.length === 1) ? 1.25 : si === 0 ? 1 : 0.8;
        const d = L.rate * (stress > 1 ? 1.25 : 1) * (0.9 + 0.2 * hash(li * 31 + wi * 7 + si));
        const u = (t - L.t0) / Math.max(0.5, ws.length * L.rate * 1.3);
        const base = PC.sp[L.sp].f0 * (1.12 - 0.18 * clamp(u)) * (stress > 1 ? 1.12 : 1);
        const last = wi === ws.length - 1 && si === groups.length - 1;
        const f0a = base * (L.laugh ? 1.3 - si * 0.1 : 1), f0b = base * (last ? (L.q ? 1.3 : 0.82) : 0.94);
        const s = { t0: t, d, sp: L.sp, v, f0a, f0b, amp: stress * (L.laugh ? 0.9 : 1), cons: onset.slice(0, 2), line: li };
        PC_SYL.push(s); W.syl.push(s);
        t += d + (L.laugh ? 0.06 : 0.012);
      });
      W.t1 = t; t += 0.045;
      return W;
    });
    L.t1 = t;
  });
  // Visual envelope of the voice, from the same syllable table the score plays.
  function pcVoice(t, sp = -1) {
    let e = 0;
    for (let i = 0; i < PC_SYL.length; i++) {
      const s = PC_SYL[i]; if (sp >= 0 && s.sp !== sp) continue;
      const a = t - s.t0; if (a < -0.02 || a > s.d + 0.08) continue;
      const v = a < 0.025 ? a / 0.025 : a < s.d ? 1 - 0.25 * (a / s.d) : 0.75 * (1 - (a - s.d) / 0.08);
      e = Math.max(e, clamp(v) * s.amp);
    }
    return e;
  }
  const PC_BEAT = 0.625;
  const PC_KICKS = [0.05, 0.68, 7.6, 8.225, 8.85, 9.475];
  const PC_SNARES = [7.9125, 8.5375, 9.1625, 9.7875];
  function pcMusic(t) {
    let e = 0;
    PC_KICKS.forEach(k => { const a = t - k; if (a >= 0) e = Math.max(e, Math.exp(-a * 7)); });
    PC_SNARES.forEach(k => { const a = t - k; if (a >= 0) e = Math.max(e, 0.7 * Math.exp(-a * 9)); });
    return e;
  }
  const fmtT = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  MG.film({
    id: 'podcast', dur: 10, poster: 5.5,
    fonts: [['800 80px "Plus Jakarta Sans"', 'Humming is your brain’s screensaver. Podcast Visualizer'], ['700 30px "Plus Jakarta Sans"', 'Ada Okafor Ruben Lind THE TANGENT HOUR'], ['500 24px "Plus Jakarta Sans"', 'HOST GUEST'], ['500 24px "JetBrains Mono"', '12:31 / 58:20']],
    meta: {
      family: 'J', name: 'Podcast Visualizer', sub: 'The Audiogram Clip', era: '2017 —',
      origin: 'Audio does not autoplay in a social feed, so around 2017 podcasters began posting “audiograms”: a short clip turned into video with the cover art, an animated waveform and burned-in captions. WNYC’s open-source Audiogram tool (2016) and services such as Headliner and Wavve made the format a default promo, and word-by-word captions later spread from TikTok-era video podcasts.',
      works: 'WNYC Audiogram generator (open source, 2016) · Headliner audiograms (2017 —) · Wavve (2017 —) · Video-podcast clips on TikTok, Instagram Reels and YouTube Shorts (2020s)',
      tech: ['Waveform / bar visualiser from audio envelope', 'Word-by-word captions', 'Speaker cards & active-speaker highlight', 'Cover art + progress bar template'],
      accent: '#ff6a3d',
      motionDNA: 'Everything is driven by the voice: bars and avatar rings pulse per syllable, captions pop in word by word with the spoken word highlighted, and the layout snaps to whoever is talking.',
      visualDNA: 'A square cover tile, bold sans captions in white with a coloured highlight pill, rounded bars mirrored around a centre line, speaker chips and a thin scrub bar, over a dark gradient tinted by the cover art.',
      transitions: 'Cover spin-in, speaker switch, pull-quote blow-up, end-card fold',
      implementation: ['Headliner / Wavve templates', 'After Effects + audio-to-keyframes', 'Canvas 2D + Web Audio'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const r = rng(47);
      // gradient field tinted by the cover's colours
      const bg = offscreen(480, 270), g = bg.getContext('2d');
      g.fillStyle = PC.bg; g.fillRect(0, 0, 480, 270);
      [[60, 60, 170, '#ff6a3d', 0.7], [430, 240, 200, '#6a48d8', 0.75], [400, 30, 130, '#ffb547', 0.35], [130, 260, 150, '#4a35a8', 0.7], [250, 140, 120, '#c2367a', 0.3]].forEach(([x, y, rr, c, a]) => {
        const gr = g.createRadialGradient(x, y, 0, x, y, rr); gr.addColorStop(0, c); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalAlpha = a; g.fillStyle = gr; g.fillRect(0, 0, 480, 270);
      });
      const bgB = offscreen(1920, 1080), bgg = bgB.getContext('2d'); bgg.filter = 'blur(30px)'; bgg.drawImage(bg, -100, -60, 2120, 1200);
      // cover art: a circle, its tangent, and the show name
      const S = 600, cv = offscreen(S, S), cg = cv.getContext('2d');
      cg.fillStyle = PC.org; cg.fillRect(0, 0, S, S);
      for (let k = 0; k < 9; k++) { cg.strokeStyle = `rgba(255,243,226,${0.06 + k * 0.015})`; cg.lineWidth = 2; cg.beginPath(); cg.arc(380, 250, 80 + k * 26, 0, TAU); cg.stroke(); }
      cg.fillStyle = PC.cream; cg.beginPath(); cg.arc(380, 250, 150, 0, TAU); cg.fill();
      const ta = -2.3, tx = 380 + Math.cos(ta) * 150, ty = 250 + Math.sin(ta) * 150;
      cg.strokeStyle = PC.ink; cg.lineWidth = 12; cg.lineCap = 'round';
      cg.beginPath(); cg.moveTo(tx + Math.cos(ta + PI / 2) * 400, ty + Math.sin(ta + PI / 2) * 400); cg.lineTo(tx - Math.cos(ta + PI / 2) * 400, ty - Math.sin(ta + PI / 2) * 400); cg.stroke();
      cg.fillStyle = PC.ink; cg.beginPath(); cg.arc(tx, ty, 18, 0, TAU); cg.fill();
      text(cg, 'THE', 44, 420, { font: PCF, weight: 800, size: 46, color: PC.ink, ls: 4 });
      text(cg, 'TANGENT', 40, 482, { font: PCF, weight: 800, size: 74, color: PC.ink, ls: -1 });
      text(cg, 'HOUR', 40, 552, { font: PCF, weight: 800, size: 74, color: PC.ink, ls: -1 });
      text(cg, 'EP. 47', 556, 56, { font: PCM, weight: 500, size: 26, color: PC.ink, align: 'right' });
      for (let k = 0; k < 3000; k++) { cg.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'; cg.fillRect(r() * S, r() * S, 2, 2); }
      return { bgB, cover: cv };
    },
    draw(c, t, W, H, st) {
      const ve = pcVoice(t), me = pcMusic(t), lvl = Math.max(ve, me * 0.85);
      const intro = E.outC(seg(t, 0.0, 0.9)), out = E.ioC(seg(t, 7.55, 8.35));
      // background drifts and breathes
      c.save(); const bs = 1.06 + 0.02 * Math.sin(t * 0.6) + lvl * 0.012;
      c.translate(960, 540); c.scale(bs, bs); c.rotate(Math.sin(t * 0.3) * 0.02); c.drawImage(st.bgB, -960, -540); c.restore();
      c.fillStyle = 'rgba(10,8,25,0.1)'; c.fillRect(0, 0, W, H);
      // who is talking right now (sticky until the other speaks)
      let cur = 0, line = -1;
      PC_LINES.forEach((L, i) => { if (t >= L.t0 - 0.05) { cur = L.sp; line = i; } });
      const spe = [pcVoice(t, 0), pcVoice(t, 1)];
      const sw = PC_LINES.reduce((m, L, i) => (i && t >= L.t0 - 0.05 && PC_LINES[i - 1].sp !== L.sp ? L.t0 - 0.05 : m), -9);
      const swU = E.outC(seg(t, sw, sw + 0.3));
      // ---- cover art: spins in, then pulses with the level; at the end it slides into the end card
      const cx = lerp(380, 450, out), cy = lerp(430, 470, out), cs = lerp(460, 520, out) * (0.6 + 0.4 * intro) * (1 + lvl * 0.025 * (1 - out));
      c.save(); c.translate(cx, cy); c.rotate((1 - intro) * -0.5); c.globalAlpha = clamp(t / 0.2);
      c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 50; c.shadowOffsetY = 24;
      c.beginPath(); c.roundRect(-cs / 2, -cs / 2, cs, cs, 26); c.fillStyle = PC.org; c.fill(); c.shadowColor = 'transparent';
      c.save(); c.clip(); c.drawImage(st.cover, -cs / 2, -cs / 2, cs, cs); c.restore();
      c.restore();
      // small show line under the cover
      const sl = E.outC(seg(t, 0.5, 1.0)) * (1 - out);
      if (sl > 0) {
        c.save(); c.globalAlpha = sl; c.translate(0, (1 - sl) * 20);
        text(c, 'THE TANGENT HOUR', 150, 728, { font: PCF, weight: 800, size: 30, color: PC.cream, ls: 3 });
        text(c, 'Ep. 47 · Why do we hum?', 150, 772, { font: PCF, weight: 500, size: 28, color: PC.dim });
        c.restore();
      }
      // ---- right column slides away at the end
      const RX = 720;
      c.save(); c.globalAlpha = 1 - out; c.translate(out * 160, 0);
      // speaker chips
      PC.sp.forEach((s, i) => {
        const a = E.outB(seg(t, 0.35 + i * 0.12, 0.85 + i * 0.12));
        if (a <= 0) return;
        const act = i === cur ? (line >= 0 ? swU : 0) : (line >= 0 ? 1 - swU : 0);
        const on = line < 0 ? 0 : i === cur ? 1 : 0;
        const x = RX + i * 520, y = 160;
        c.save(); c.translate(x, y + (1 - a) * 30); c.globalAlpha *= clamp(a);
        c.beginPath(); c.roundRect(0, 0, 480, 110, 55); c.fillStyle = on ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.06)'; c.fill();
        if (on) { c.lineWidth = 2; c.strokeStyle = s.col; c.globalAlpha *= act; c.stroke(); c.globalAlpha /= act || 1; }
        // avatar with a voice ring
        const e = spe[i];
        for (let k = 0; k < 3; k++) { c.strokeStyle = s.col; c.globalAlpha = clamp(a) * (1 - out) * e * (0.6 - k * 0.18); c.lineWidth = 4; c.beginPath(); c.arc(55, 55, 44 + e * (10 + k * 9), 0, TAU); c.stroke(); }
        c.globalAlpha = clamp(a) * (1 - out);
        c.fillStyle = s.col; c.beginPath(); c.arc(55, 55, 42, 0, TAU); c.fill();
        text(c, s.ini, 55, 57, { font: PCF, weight: 800, size: 30, color: PC.ink, align: 'center', base: 'middle' });
        c.globalAlpha = clamp(a) * (1 - out) * (on || line < 0 ? 1 : 0.55);
        text(c, s.name, 118, 50, { font: PCF, weight: 700, size: 32, color: PC.cream });
        text(c, s.role, 118, 84, { font: PCF, weight: 500, size: 20, color: s.col, ls: 2 });
        if (on && e > 0.05) { // live "speaking" dots
          for (let k = 0; k < 3; k++) { const h = 6 + 16 * e * (0.5 + 0.5 * Math.sin(t * 30 + k * 2)); c.fillStyle = s.col; c.beginPath(); c.roundRect(420 + k * 12, 55 - h / 2, 7, h, 3.5); c.fill(); }
        }
        c.restore();
      });
      // captions: current line, words pop in as spoken, the spoken word on a pill
      if (line >= 0) {
        const L = PC_LINES[line], col = PC.sp[L.sp].col;
        const big = L.key ? E.outB(seg(t, L.t0 - 0.1, L.t0 + 0.25)) : 0;
        const size = 74 + 22 * big, lh = size * 1.18, maxW = 1060;
        c.font = `800 ${size}px ${PCF}`;
        const sp = c.measureText(' ').width;
        let x = 0, row = 0; const pos = [];
        L.words.forEach(w => { const ww = c.measureText(w.w).width; if (x + ww > maxW && x > 0) { x = 0; row++; } pos.push([x, row, ww]); x += ww + sp; });
        const rows = row + 1, y0 = 470 - (rows - 1) * lh / 2 + 10;
        if (L.key && big > 0) {
          c.save(); c.globalAlpha = (1 - out) * big;
          text(c, '“', RX - 50, y0 + 70, { font: PCF, weight: 800, size: 190, color: col });
          c.restore();
        }
        L.words.forEach((w, i) => {
          const a = t - w.t0; if (a < 0) return;
          const [wx, wr, ww] = pos[i], px = RX + 40 + wx, py = y0 + wr * lh;
          const pop = E.outB(clamp(a / 0.14), 2.2), speaking = t >= w.t0 && t < w.t1 + 0.04;
          c.save(); c.translate(px + ww / 2, py - size * 0.35); c.scale(0.75 + 0.25 * pop, 0.75 + 0.25 * pop); c.translate(-ww / 2, size * 0.35);
          c.globalAlpha = (1 - out) * clamp(a / 0.08);
          if (speaking) { c.beginPath(); c.roundRect(-9, -size * 0.82, ww + 18, size * 1.05, 14); c.fillStyle = col; c.fill(); }
          text(c, w.w, 0, 0, { font: PCF, weight: 800, size, color: speaking ? PC.ink : PC.cream });
          c.restore();
        });
      }
      // waveform: mirrored rounded bars, each echoing the voice a beat later as it spreads outward
      const N = 56, bw = 1060 / N, wy = 760, ga = E.outC(seg(t, 0.4, 1.1));
      const wcol = line >= 0 ? PC.sp[cur].col : PC.cream;
      for (let i = 0; i < N; i++) {
        const d = Math.abs(i - (N - 1) / 2) / (N / 2), tt = t - d * 0.12;
        const v = Math.max(pcVoice(tt), pcMusic(tt) * 0.8) * (0.45 + 0.55 * (0.5 + 0.5 * vnoise(i * 0.9 + tt * 14, 3))) * (1 - 0.55 * d);
        const h = 6 + 190 * v * ga;
        c.fillStyle = wcol; c.globalAlpha = (1 - out) * (0.35 + 0.65 * clamp(v * 2)) * ga;
        c.beginPath(); c.roundRect(RX + 40 + i * bw + 2, wy - h / 2, bw - 6, h, (bw - 6) / 2); c.fill();
      }
      c.globalAlpha = 1 - out;
      // scrub bar, play state, timecode
      const pu = E.outC(seg(t, 0.6, 1.2)), prog = (751 + t) / 3500;
      c.fillStyle = 'rgba(255,243,226,0.18)'; c.beginPath(); c.roundRect(RX + 40, 900, 1060 * pu, 8, 4); c.fill();
      c.fillStyle = PC.cream; c.beginPath(); c.roundRect(RX + 40, 900, 1060 * prog * pu, 8, 4); c.fill();
      c.beginPath(); c.arc(RX + 40 + 1060 * prog * pu, 904, 12 * pu, 0, TAU); c.fill();
      c.globalAlpha = (1 - out) * pu;
      text(c, `${fmtT(751 + t)} / 58:20`, RX + 1100, 955, { font: PCM, weight: 500, size: 24, color: PC.dim, align: 'right' });
      c.fillStyle = PC.cream; c.fillRect(RX + 42, 934, 7, 24); c.fillRect(RX + 56, 934, 7, 24);
      c.beginPath(); c.roundRect(RX + 82, 932, 50, 28, 6); c.lineWidth = 2; c.strokeStyle = PC.dim; c.stroke();
      text(c, 'CC', RX + 107, 952, { font: PCF, weight: 800, size: 17, color: PC.cream, align: 'center' });
      c.restore();
      // ---- end card
      if (out > 0) {
        const e1 = E.outC(seg(t, 8.0, 8.6)), e2 = E.outC(seg(t, 8.25, 8.9)), e3 = E.outC(seg(t, 8.5, 9.1));
        const X = 800;
        c.save(); c.globalAlpha = e1; text(c, 'THE TANGENT HOUR  ·  FULL EPISODE OUT NOW', X, 352 + (1 - e1) * 20, { font: PCF, weight: 700, size: 26, color: PC.org, ls: 4 }); c.restore();
        c.save(); c.globalAlpha = e2; text(c, 'Podcast Visualizer', X - 6, 470 + (1 - e2) * 30, { font: PCF, weight: 800, size: 112, color: PC.cream, ls: -3 }); c.restore();
        c.save(); c.globalAlpha = e3; text(c, 'the audiogram  ·  waveform, captions, cover art  ·  2017 —', X, 534, { font: PCF, weight: 500, size: 30, color: PC.dim }); c.restore();
        // the waveform settles into a single line that keeps time with the outro beat
        c.save(); c.globalAlpha = e3; c.strokeStyle = PC.org; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath();
        for (let k = 0; k <= 120; k++) { const x = X + k * 8.5, env = Math.sin(PI * k / 120); const y = 620 + Math.sin(k * 0.55 - t * 9) * env * (6 + 40 * me) * (0.6 + 0.4 * vnoise(k * 0.3 + t * 3, 5)); k ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.stroke(); c.restore();
        c.save(); c.globalAlpha = e3; c.beginPath(); c.roundRect(X, 680, 300, 64, 32); c.fillStyle = PC.cream; c.fill();
        c.fillStyle = PC.ink; c.beginPath(); c.moveTo(X + 34, 696); c.lineTo(X + 58, 712); c.lineTo(X + 34, 728); c.closePath(); c.fill();
        text(c, 'Listen now', X + 74, 722, { font: PCF, weight: 800, size: 28, color: PC.ink });
        text(c, '@tangenthour', X + 330, 722, { font: PCM, weight: 500, size: 24, color: PC.dim });
        c.restore();
      }
      grain(c, W, H, t, 0.05, 'overlay');
      vignette(c, W, H, 0.35);
    },
    score(A) {
      A.bus.gain.value = 1.0;
      // voices: additive harmonics shaped by three vowel formants, gliding with the intonation
      const fg = (f, F) => [1, 0.7, 0.35].reduce((s, g, i) => s + g / (1 + Math.pow((f - F[i]) / [110, 140, 200][i], 2)), 0);
      PC_SYL.forEach((s, i) => {
        const F = PC_FORM[s.v].map(f => f * (s.sp === 0 ? 1.15 : 1)), dur = s.d + 0.03;
        const amps = [];
        for (let k = 1; k * s.f0a < 3800; k++) amps.push([k, fg(k * s.f0a, F) / Math.pow(k, 0.35)]);
        const mx = Math.max(...amps.map(a => a[1]));
        const sum = amps.reduce((q, a) => q + (a[1] > mx * 0.08 ? a[1] : 0), 0);
        amps.forEach(([k, a]) => {
          if (a < mx * 0.08) return;
          A.osc(s.t0, { f: k * s.f0a, f2: k * s.f0b, glide: dur, dur, g: 0.24 * s.amp * a / sum, a: 0.022, hold: true, rel: 0.05, vib: [5.5, k * s.f0a * 0.006], type: 'sine', pan: s.sp ? 0.12 : -0.12, rev: 0.05 });
        });
        A.noise(s.t0, { type: 'bandpass', f: F[1], q: 3, dur, g: 0.012 * s.amp, a: 0.02, hold: true, rel: 0.04 });
        // consonant onsets: hiss for fricatives, a click for stops
        const c0 = s.cons[0];
        if (c0 && /[sz]/.test(c0) || s.cons === 'sh') A.noise(s.t0 - 0.06, { type: 'highpass', f: s.cons === 'sh' ? 2400 : 5200, dur: 0.07, g: 0.05, a: 0.015, hold: true, rel: 0.02 });
        else if (c0 && /[fhtw]/.test(c0) && !/[w]/.test(c0)) A.noise(s.t0 - 0.04, { type: 'bandpass', f: c0 === 'h' ? 1500 : 3500, q: 0.8, dur: 0.05, g: 0.035, a: 0.01, hold: true, rel: 0.02 });
        else if (c0 && /[pbtdkgc]/.test(c0)) A.noise(s.t0 - 0.012, { type: 'bandpass', f: 1800, q: 0.7, dur: 0.02, g: 0.06 });
      });
      // intro sting: kick, a bright chord, the cover's swish
      const ep = (t, notes, g = 0.05, dur = 1.6) => notes.forEach((m, i) => { A.osc(t + i * 0.01, { f: midi(m), dur, g, a: 0.005, rev: 0.3, pan: (i / notes.length - 0.5) * 0.6 }); A.osc(t + i * 0.01, { type: 'triangle', f: midi(m) * 2, dur: dur * 0.3, g: g * 0.25, a: 0.003 }); });
      A.kick(0.05, 0.8); A.kick(0.68, 0.55);
      A.whoosh(0.0, 0.6, { f1: 500, f2: 4000, g: 0.12 });
      ep(0.05, [53, 60, 64, 67, 72], 0.05, 2.2);
      A.bell(0.68, midi(84), { g: 0.04, dur: 1.2 });
      // a low bed under the talk: soft keys and a shaker
      [[1.3, [41, 57, 60, 64]], [3.8, [45, 55, 60, 64]], [6.3, [43, 55, 58, 62]]].forEach(([t, ch]) => ep(t, ch, 0.016, 2.6));
      for (let k = 0; k < 20; k++) A.hat(1.3 + k * PC_BEAT / 2, k % 2 ? 0.018 : 0.03, false, { f: 9000 });
      // the pull-quote gets a riser and a sub drop
      A.riser(3.6, 0.7, { g: 0.06, f: 220 });
      A.osc(4.3, { f: 60, f2: 40, glide: 0.5, dur: 0.9, g: 0.2 });
      // outro: the beat comes in under the end card
      PC_KICKS.slice(2).forEach(t => A.kick(t, 0.8));
      PC_SNARES.forEach(t => A.clap(t, 0.25));
      for (let k = 0; k < 8; k++) A.hat(7.6 + k * PC_BEAT / 2 + PC_BEAT / 4, 0.05, false, { pan: 0.2 });
      [[7.6, [41, 57, 60, 64, 67]], [8.85, [43, 55, 59, 62, 67]]].forEach(([t, ch]) => ep(t, ch, 0.035, 1.6));
      [[7.6, 29], [8.225, 29], [8.85, 31], [9.475, 31]].forEach(([t, m]) => A.osc(t, { type: 'sawtooth', f: midi(m + 12), dur: 0.5, g: 0.08, lp: 500 }));
      A.bell(8.25, midi(79), { g: 0.04, dur: 1.4 }); A.bell(8.5, midi(84), { g: 0.035, dur: 1.4 });
    },
  });
})();
