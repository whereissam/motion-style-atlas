/* Batch c9 — Family F: Analog, Physical & Stop Motion.
   paintglass (slow-drying oil on backlit glass), directfilm (scratched & painted celluloid),
   cyanotype (Prussian-blue sun print, exposed and washed). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Rock+Salt&family=Courier+Prime:wght@700&family=Pinyon+Script&family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&display=block');

  /* ---------------- shared helpers ---------------- */
  const h2 = (x, y, s = 0) => { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); };
  const vn2 = (x, y, s = 0) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    return lerp(lerp(h2(ix, iy, s), h2(ix + 1, iy, s), ux), lerp(h2(ix, iy + 1, s), h2(ix + 1, iy + 1, s), ux), uy);
  };
  const fbm2 = (x, y, s, o = 3) => { let v = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { v += vn2(x * f, y * f, s + i * 13) * a; n += a; a *= 0.5; f *= 2; } return v / n; };
  const bump = (t, a, up, hold, down) => E.outQ(seg(t, a, a + up)) * (1 - E.ioS(seg(t, a + up + hold, a + up + hold + down)));
  const canvasRW = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d', { willReadFrequently: true }); return [cv, g]; };
  const ang2 = (a, b, w) => { // blend two axial (mod π) directions
    const x = lerp(Math.cos(2 * a), Math.cos(2 * b), w), y = lerp(Math.sin(2 * a), Math.sin(2 * b), w);
    return Math.atan2(y, x) / 2;
  };

  /* =====================================================================
     1. PAINT-ON-GLASS — oil paint on a backlit pane, repainted every frame
     ===================================================================== */
  const PSW = 240, PSH = 135, PK = 1920 / PSW; // source picture resolution (colour + flow are read from it)
  const FISH = { t0: 3.05, t1: 6.45 };
  function fishPose(t) {
    const u = seg(t, FISH.t0, FISH.t1);
    const x = lerp(260, 1700, E.ioS(u) * 0.85 + u * 0.15);
    const y = 1180 - 860 * Math.sin(Math.PI * clamp(u * 1.02 - 0.01));
    const u2 = clamp(u + 0.01);
    const x2 = lerp(260, 1700, E.ioS(u2) * 0.85 + u2 * 0.15), y2 = 1180 - 860 * Math.sin(Math.PI * clamp(u2 * 1.02 - 0.01));
    const a = Math.atan2(y2 - y, x2 - x);
    const flex = Math.sin(t * 9) * 0.12 * (1 - Math.abs(u - 0.5));
    return { x, y, a, flex, u, L: 760 };
  }
  function fishBody(g, F, k = 1) {
    // slim marlin body along the length axis, local coords (nose at +L/2)
    const L = F.L * k, P = [], Q = [];
    for (let i = 0; i <= 28; i++) {
      const u = i / 28, x = L * 0.36 - u * L * 0.74;
      const w = L * 0.105 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.55)), 1.1) * (1 - u * 0.5) + L * 0.008;
      const bend = Math.sin(u * 2.4) * F.flex * L * 0.18 * u;
      P.push([x, -w + bend]); Q.push([x, w * 0.85 + bend]);
    }
    const tb = Math.sin(2.4) * F.flex * L * 0.18, tx = -L * 0.38;
    g.beginPath();
    g.moveTo(L * 0.62, -L * 0.004); // bill
    P.forEach(p => g.lineTo(p[0], p[1]));
    g.quadraticCurveTo(tx - L * 0.06, -L * 0.1 + tb, tx - L * 0.16, -L * 0.22 + tb);
    g.quadraticCurveTo(tx - L * 0.06, tb, tx - L * 0.16, L * 0.22 + tb);
    g.quadraticCurveTo(tx - L * 0.06, L * 0.1 + tb, Q[Q.length - 1][0], Q[Q.length - 1][1]);
    for (let i = Q.length - 1; i >= 0; i--) g.lineTo(Q[i][0], Q[i][1]);
    g.lineTo(L * 0.62, L * 0.004);
    g.closePath();
  }
  function srcSea(g, t, k = 1) {
    const HZ = 390;
    let gr = g.createLinearGradient(0, 0, 0, HZ);
    gr.addColorStop(0, '#d98f55'); gr.addColorStop(0.45, '#f2c27e'); gr.addColorStop(1, '#fde3b4');
    g.fillStyle = gr; g.fillRect(0, 0, 1920, HZ + 4);
    g.fillStyle = 'rgba(176,96,82,0.55)';
    [[380, 120, 360, 30], [1340, 90, 420, 24], [880, 210, 300, 18]].forEach(([x, y, w, h], i) => { g.beginPath(); g.ellipse(x + t * 12 * (i + 1), y, w, h, 0, 0, TAU); g.fill(); });
    const sg = g.createRadialGradient(1220, 300, 10, 1220, 300, 300);
    sg.addColorStop(0, 'rgba(255,250,225,1)'); sg.addColorStop(0.25, 'rgba(255,226,150,0.8)'); sg.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = sg; g.fillRect(800, 0, 900, HZ);
    gr = g.createLinearGradient(0, HZ, 0, 1080);
    gr.addColorStop(0, '#7fb2a8'); gr.addColorStop(0.18, '#3c8494'); gr.addColorStop(0.55, '#1d5274'); gr.addColorStop(1, '#0d2645');
    g.fillStyle = gr; g.fillRect(0, HZ, 1920, 1080 - HZ);
    // rolling swell, rows advance toward camera
    const N = 11;
    for (let k2 = N - 1; k2 >= 0; k2--) {
      const r = ((k2 + t * 0.42 * k) % N) / N, y0 = HZ + Math.pow(r, 1.7) * 760, A = 6 + r * 46, th = 4 + r * 40;
      const ph = k2 * 1.7 - t * (1.1 + r);
      g.beginPath();
      for (let x = -40; x <= 1960; x += 40) g.lineTo(x, y0 + Math.sin(x * 0.006 / (0.3 + r) + ph) * A);
      for (let x = 1960; x >= -40; x -= 40) g.lineTo(x, y0 + th + Math.sin(x * 0.006 / (0.3 + r) + ph + 0.5) * A * 0.8);
      g.closePath();
      g.fillStyle = `rgba(${lerp(150, 120, r) | 0},${lerp(205, 200, r) | 0},${lerp(200, 196, r) | 0},${0.55 + r * 0.3})`; g.fill();
      g.beginPath();
      for (let x = -40; x <= 1960; x += 40) g.lineTo(x, y0 + th + Math.sin(x * 0.006 / (0.3 + r) + ph + 0.5) * A * 0.8);
      for (let x = 1960; x >= -40; x -= 40) g.lineTo(x, y0 + th * 2.4 + Math.sin(x * 0.006 / (0.3 + r) + ph + 0.9) * A);
      g.closePath(); g.fillStyle = `rgba(8,30,60,${0.25 + r * 0.35})`; g.fill();
      // foam on the crests
      g.fillStyle = `rgba(250,248,236,${0.4 + r * 0.5})`;
      for (let j = 0; j < 7; j++) {
        const fx = ((hash(k2 * 13 + j) * 2200 + t * 60 * (j % 2 ? 1 : -1)) % 2100) - 90;
        g.beginPath(); g.ellipse(fx, y0 + Math.sin(fx * 0.006 / (0.3 + r) + ph) * A + 2, 30 + r * 120, 3 + r * 9, 0, 0, TAU); g.fill();
      }
    }
    // glitter path under the sun
    for (let j = 0; j < 40; j++) {
      const y = HZ + 10 + Math.pow(j / 40, 1.4) * 640, w = 20 + (j / 40) * 160;
      const x = 1220 + Math.sin(j * 2.3 + t * 3) * w * 0.8;
      g.fillStyle = `rgba(255,${210 + (hash(j) * 40) | 0},140,${0.5 + 0.4 * Math.sin(j * 1.7 + t * 6)})`;
      g.fillRect(x - w / 2, y, w, 3 + j * 0.25);
    }
  }
  function srcFish(g, t) {
    const HZ = 600;
    let gr = g.createLinearGradient(0, 0, 0, HZ);
    gr.addColorStop(0, '#e9a65c'); gr.addColorStop(0.5, '#ffd88e'); gr.addColorStop(1, '#fff1c8');
    g.fillStyle = gr; g.fillRect(0, 0, 1920, HZ + 4);
    const F = fishPose(t), apex = bump(t, 4.3, 0.6, 0.3, 0.8);
    const sg = g.createRadialGradient(1010, 330, 10, 1010, 330, 520 + apex * 200);
    sg.addColorStop(0, 'rgba(255,253,235,1)'); sg.addColorStop(0.2, 'rgba(255,236,170,0.95)'); sg.addColorStop(1, 'rgba(255,190,110,0)');
    g.fillStyle = sg; g.fillRect(0, 0, 1920, HZ);
    g.fillStyle = 'rgba(205,120,90,0.4)';
    [[300, 160, 380, 26], [1600, 120, 340, 22]].forEach(([x, y, w, h]) => { g.beginPath(); g.ellipse(x, y, w, h, 0, 0, TAU); g.fill(); });
    gr = g.createLinearGradient(0, HZ, 0, 1080);
    gr.addColorStop(0, '#8cc0a8'); gr.addColorStop(0.3, '#2f8a8a'); gr.addColorStop(1, '#0b3352');
    g.fillStyle = gr; g.fillRect(0, HZ, 1920, 480);
    for (let k = 0; k < 7; k++) {
      const y0 = HZ + 20 + Math.pow(k / 7, 1.5) * 470, ph = k * 2 - t * 1.6;
      g.beginPath();
      for (let x = -40; x <= 1960; x += 40) g.lineTo(x, y0 + Math.sin(x * 0.008 + ph) * (5 + k * 4));
      for (let x = 1960; x >= -40; x -= 40) g.lineTo(x, y0 + 8 + k * 6 + Math.sin(x * 0.008 + ph + 0.6) * (5 + k * 4));
      g.closePath(); g.fillStyle = `rgba(190,235,215,${0.35 + k * 0.05})`; g.fill();
    }
    for (let j = 0; j < 26; j++) {
      const y = HZ + 8 + Math.pow(j / 26, 1.3) * 470, w = 40 + j * 9;
      g.fillStyle = `rgba(255,238,170,${0.55 + 0.3 * Math.sin(j * 1.3 + t * 5)})`;
      g.fillRect(1010 + Math.sin(j * 2.1 + t * 2) * w * 0.6 - w / 2, y, w, 4 + j * 0.3);
    }
    // splash where the fish breaks the surface, and where it re-enters
    const spl = (sx, st, n) => {
      const a = seg(t, st, st + 1.1); if (a <= 0 || a >= 1) return;
      for (let j = 0; j < n; j++) {
        const an = -Math.PI / 2 + (hash(j * 3.1 + st) - 0.5) * 2.2, sp = 380 + hash(j * 7.7) * 520;
        const x = sx + Math.cos(an) * sp * a, y = HZ + 60 + Math.sin(an) * sp * a + 900 * a * a;
        g.fillStyle = `rgba(250,252,245,${(1 - a) * 0.9})`; g.beginPath(); g.ellipse(x, y, 16 + hash(j) * 30, 12 + hash(j + 4) * 18, an, 0, TAU); g.fill();
      }
      g.fillStyle = `rgba(245,252,248,${(1 - a) * 0.8})`; g.beginPath(); g.ellipse(sx, HZ + 70, 220 * (0.4 + a), 40, 0, 0, TAU); g.fill();
    };
    spl(420, 3.25, 22); spl(1560, 6.05, 16);
    if (F.u > 0 && F.u < 1) {
      const L = F.L;
      g.save(); g.translate(F.x, F.y); g.rotate(F.a);
      // sail fin first so the body overlaps its root
      g.fillStyle = '#23338a'; g.beginPath(); g.moveTo(L * 0.24, -L * 0.07); g.quadraticCurveTo(L * 0.16, -L * 0.25, -L * 0.0, -L * 0.21); g.quadraticCurveTo(-L * 0.1, -L * 0.14, -L * 0.18, -L * 0.05); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,214,120,0.9)'; g.fillRect(L * 0.02, -L * 0.215, L * 0.16, 8);
      // rim light from the sun behind
      g.save(); g.scale(1.03, 1.18); fishBody(g, F); g.fillStyle = `rgba(255,210,110,${0.8 + apex * 0.2})`; g.fill(); g.restore();
      fishBody(g, F);
      const bg = g.createLinearGradient(0, -L * 0.1, 0, L * 0.09);
      bg.addColorStop(0, '#081646'); bg.addColorStop(0.45, '#1d4596'); bg.addColorStop(0.7, '#5a86b8'); bg.addColorStop(1, '#b9cbd6');
      g.fillStyle = bg; g.fill();
      g.save(); g.clip();
      g.fillStyle = 'rgba(120,200,240,0.6)';
      for (let j = 0; j < 9; j++) { g.beginPath(); g.ellipse(L * 0.24 - j * 56, -L * 0.03, 9, 46, 0.15, 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(255,214,120,0.5)'; g.beginPath(); g.ellipse(L * 0.02, L * 0.0, L * 0.3, 12, 0, 0, TAU); g.fill();
      g.restore();
      g.fillStyle = '#16226a'; g.beginPath(); g.moveTo(L * 0.18, L * 0.04); g.lineTo(L * 0.02, L * 0.17); g.lineTo(L * 0.1, L * 0.05); g.fill();
      g.fillStyle = '#0a0e1e'; g.beginPath(); g.arc(L * 0.3, -L * 0.018, 11, 0, TAU); g.fill();
      g.restore();
    }
  }
  function srcDusk(g, t) {
    const HZ = 640, SX = 1180, SY = 590;
    let gr = g.createLinearGradient(0, 0, 0, HZ);
    gr.addColorStop(0, '#2c2260'); gr.addColorStop(0.32, '#7c3f78'); gr.addColorStop(0.6, '#d8664c'); gr.addColorStop(0.85, '#ffb35a'); gr.addColorStop(1, '#ffd98a');
    g.fillStyle = gr; g.fillRect(0, 0, 1920, HZ + 4);
    const sg = g.createRadialGradient(SX, SY, 20, SX, SY, 520);
    sg.addColorStop(0, 'rgba(255,250,215,1)'); sg.addColorStop(0.18, 'rgba(255,225,140,0.95)'); sg.addColorStop(0.5, 'rgba(255,150,80,0.35)'); sg.addColorStop(1, 'rgba(255,120,60,0)');
    g.fillStyle = sg; g.fillRect(0, 0, 1920, HZ);
    g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(SX, SY, 92, 0, TAU); g.fill();
    [[420, 210, 520, 34, '#5a2f6a'], [1500, 150, 480, 28, '#6a3470'], [900, 330, 640, 22, '#b4506a'], [1650, 420, 380, 18, '#d06a5a'], [300, 470, 420, 16, '#e07a58']].forEach(([x, y, w, h, col], i) => {
      g.fillStyle = col; g.beginPath(); g.ellipse(x + t * (6 + i * 4), y, w, h, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,190,110,0.6)'; g.beginPath(); g.ellipse(x + t * (6 + i * 4) + 40, y + h * 0.6, w * 0.8, h * 0.35, 0, 0, TAU); g.fill();
    });
    gr = g.createLinearGradient(0, HZ, 0, 1080);
    gr.addColorStop(0, '#c86a50'); gr.addColorStop(0.25, '#6a3460'); gr.addColorStop(1, '#1a1238');
    g.fillStyle = gr; g.fillRect(0, HZ, 1920, 440);
    for (let k = 0; k < 9; k++) {
      const y0 = HZ + 14 + Math.pow(k / 9, 1.5) * 430, ph = k * 1.9 - t * 1.2;
      g.beginPath();
      for (let x = -40; x <= 1960; x += 40) g.lineTo(x, y0 + Math.sin(x * 0.007 + ph) * (3 + k * 3));
      for (let x = 1960; x >= -40; x -= 40) g.lineTo(x, y0 + 6 + k * 5 + Math.sin(x * 0.007 + ph + 0.6) * (3 + k * 3));
      g.closePath(); g.fillStyle = `rgba(20,10,40,${0.3 + k * 0.04})`; g.fill();
    }
    for (let j = 0; j < 34; j++) {
      const y = HZ + 6 + Math.pow(j / 34, 1.25) * 440, w = 60 + j * 10;
      g.fillStyle = `rgba(255,${200 + ((hash(j) * 40) | 0)},120,${0.6 + 0.3 * Math.sin(j * 1.9 + t * 5)})`;
      g.fillRect(SX + Math.sin(j * 2.7 + t * 2.2) * w * 0.5 - w / 2, y, w, 4 + j * 0.35);
    }
    // the sailboat crossing the sun path
    const bx = lerp(520, 1035, E.outQ(seg(t, 6.6, 9.3))), by = HZ + 70, rock = Math.sin(t * 2.2) * 0.04;
    g.save(); g.translate(bx, by); g.rotate(rock);
    g.fillStyle = 'rgba(40,16,40,0.55)'; g.fillRect(-150, 30, 300, 70);
    g.fillStyle = '#2a1430'; g.beginPath(); g.moveTo(-160, 0); g.lineTo(170, 0); g.lineTo(120, 44); g.lineTo(-120, 44); g.closePath(); g.fill();
    g.fillStyle = '#3a1a36'; g.fillRect(-6, -330, 10, 332);
    g.fillStyle = '#ffb860'; g.beginPath(); g.moveTo(8, -326); g.quadraticCurveTo(162, -150, 162, -8); g.lineTo(8, -8); g.closePath(); g.fill();
    g.fillStyle = '#4a1c3a'; g.beginPath(); g.moveTo(8, -320); g.quadraticCurveTo(146, -150, 146, -12); g.lineTo(8, -12); g.closePath(); g.fill();
    g.fillStyle = '#5c2440'; g.beginPath(); g.moveTo(-10, -290); g.quadraticCurveTo(-120, -140, -130, -16); g.lineTo(-10, -16); g.closePath(); g.fill();
    g.restore();
  }
  // flow directions per scene (axial angles)
  function flowSea(x, y, t) { return y < 390 ? 0.04 * Math.sin(x * 0.004) : Math.sin(x * 0.006 + y * 0.01 - t) * 0.22; }
  function flowFish(x, y, t) {
    const F = fishPose(t);
    if (F.u > 0 && F.u < 1) {
      const dx = x - F.x, dy = y - F.y, c = Math.cos(F.a), s = Math.sin(F.a);
      const lx = dx * c + dy * s, ly = -dx * s + dy * c;
      const e = (lx / (F.L * 0.62)) ** 2 + (ly / (F.L * 0.22)) ** 2;
      if (e < 1) return F.a + ly * 0.0015;
    }
    if (y < 600) { const dx = x - 1010, dy = y - 330, d = Math.hypot(dx, dy); if (d < 520) return lerp(Math.atan2(dy, dx) + Math.PI / 2, 0, clamp(d / 520) ** 2); return 0.02; }
    return Math.sin(x * 0.008 - t) * 0.15;
  }
  function flowDusk(x, y) {
    const dx = x - 1180, dy = y - 590, d = Math.hypot(dx, dy);
    if (y < 640 && d < 420) return lerp(Math.atan2(dy, dx) + Math.PI / 2, 0, clamp((d - 100) / 320) ** 1.5);
    return y < 640 ? 0.03 * Math.sin(x * 0.003) : Math.sin(x * 0.01 + y * 0.02) * 0.08;
  }
  const PSCENES = [
    { src: srcSea, flow: flowSea },
    { src: srcFish, flow: flowFish },
    { src: srcDusk, flow: flowDusk },
  ];
  const PTRANS = [{ t0: 2.45, t1: 3.55, cx: 380, cy: 980, kind: 'swirl' }, { t0: 6.15, t1: 7.25, kind: 'wipe' }];

  function pgSample(d, x, y, out) {
    let fx = x / PK - 0.5, fy = y / PK - 0.5;
    fx = fx < 0 ? 0 : fx > PSW - 1.001 ? PSW - 1.001 : fx; fy = fy < 0 ? 0 : fy > PSH - 1.001 ? PSH - 1.001 : fy;
    const ix = fx | 0, iy = fy | 0, ux = fx - ix, uy = fy - iy, i = (iy * PSW + ix) * 4, j = i + PSW * 4;
    for (let k = 0; k < 3; k++) out[k] = (d[i + k] * (1 - ux) + d[i + 4 + k] * ux) * (1 - uy) + (d[j + k] * (1 - ux) + d[j + 4 + k] * ux) * uy;
    return out;
  }
  function pgLum(d, x, y) {
    const ix = clamp((x / PK) | 0, 0, PSW - 1), iy = clamp((y / PK) | 0, 0, PSH - 1), i = (iy * PSW + ix) * 4;
    return d[i] * 0.3 + d[i + 1] * 0.55 + d[i + 2] * 0.15;
  }
  let pgMag = 0;
  function pgFlow(sc, d, x, y, t) {
    const base = sc.flow(x, y, t);
    const gx = pgLum(d, x + 14, y) - pgLum(d, x - 14, y), gy = pgLum(d, x, y + 14) - pgLum(d, x, y - 14);
    const m = pgMag = Math.hypot(gx, gy);
    if (m < 6) return base;
    return ang2(base, Math.atan2(gy, gx) + Math.PI / 2, clamp((m - 6) / 50) * 0.7);
  }

  MG.film({
    id: 'paintglass',
    dur: 10,
    poster: 9.4,
    fonts: [],
    meta: {
      family: 'F', name: 'Paint-on-Glass', sub: 'Living Oil Paint', era: '1970s —',
      origin: 'Slow-drying oil paint is pushed around with fingers and brushes on a sheet of backlit glass and photographed one frame at a time; each frame is a repainting of the last, so images flow into each other. Aleksandr Petrov made it famous with The Old Man and the Sea (1999), which won the Academy Award.',
      works: 'The Street (Caroline Leaf, 1976) · The Cow (Aleksandr Petrov, 1989) · The Old Man and the Sea (Aleksandr Petrov, 1999) · My Love (Aleksandr Petrov, 2006) · Two Sisters (Caroline Leaf, 1990)',
      tech: ['Directional oil strokes', 'Smear-morph transitions', 'Backlit glass glow'],
      accent: '#f2a24a',
      motionDNA: 'Nothing cuts: every image is wiped, smeared and repainted into the next, and the brushwork boils from frame to frame.',
      visualDNA: 'Thick directional strokes of luminous colour that follow the form, lit from behind so the thin paint glows like stained glass.',
      transitions: 'Swirl smear, palm wipe, repaint dissolve, stroke boil',
      implementation: ['Physical glass + camera', 'Canvas 2D', 'TVPaint'],
      reproducibility: 'Needs physical capture (this film is a procedural homage)',
      loopable: false,
    },
    setup() {
      const r = rng(4242), strokes = [];
      const layer = (n, gap, len, wid, L) => {
        const cols = Math.ceil(1920 / gap) + 2, rows = Math.ceil(1080 / gap) + 2;
        for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
          if (n && r() > n) continue;
          strokes.push({
            x: (i - 1 + r()) * gap, y: (j - 1 + r()) * gap, len: len[0] + r() * (len[1] - len[0]), w: wid[0] + r() * (wid[1] - wid[0]),
            L, h: r(), h2: r(), h3: r(), curv: (r() - 0.5) * 0.7, jit: (r() - 0.5) * 0.12, z: r(),
          });
        }
      };
      layer(0, 46, [110, 170], [30, 44], 0);
      layer(0, 24, [56, 92], [17, 27], 1);
      layer(0, 11, [22, 40], [6, 10], 2);
      // sort within each layer by a random key so neighbours overlap irregularly
      strokes.sort((a, b) => a.L - b.L || a.z - b.z);
      const srcs = [0, 1, 2].map(() => canvasRW(PSW, PSH));
      const [P, gP] = canvasRW(1920, 1080);
      // bristle texture: streaks run along the stroke
      const B = offscreen(128, 48), gB = B.getContext('2d'), br = rng(9);
      const id = gB.createImageData(128, 48);
      const rowv = []; for (let y = 0; y < 48; y++) rowv.push(br());
      for (let y = 0; y < 48; y++) for (let x = 0; x < 128; x++) {
        const v = 128 + (rowv[y] - 0.5) * 150 * (0.7 + 0.3 * Math.sin(x / 128 * TAU * 2 + rowv[(y + 7) % 48] * 6)) + (br() - 0.5) * 20;
        const k = (y * 128 + x) * 4; id.data[k] = id.data[k + 1] = id.data[k + 2] = clamp(v, 0, 255); id.data[k + 3] = 255;
      }
      gB.putImageData(id, 0, 0);
      const pat = gP.createPattern(B, 'repeat');
      const Bl = offscreen(240, 135);
      return { strokes, srcs, P, gP, pat, Bl, tmp: [0, 0, 0], tmp2: [0, 0, 0] };
    },
    draw(c, t, W, H, st) {
      // which pictures are on the glass
      let A = 0, Bi = -1, U = 0, tr = null;
      if (t >= PTRANS[0].t0) A = 1;
      if (t >= PTRANS[1].t0) A = 2;
      if (t >= PTRANS[0].t0 && t < PTRANS[0].t1) { A = 0; Bi = 1; tr = PTRANS[0]; }
      if (t >= PTRANS[1].t0 && t < PTRANS[1].t1) { A = 1; Bi = 2; tr = PTRANS[1]; }
      if (tr) U = seg(t, tr.t0, tr.t1);
      const paint = (k) => { const [cv, g] = st.srcs[k]; g.setTransform(1 / PK, 0, 0, 1 / PK, 0, 0); g.filter = 'blur(1px)'; PSCENES[k].src(g, t); g.filter = 'none'; return g.getImageData(0, 0, PSW, PSH).data; };
      const dA = paint(A), dB = Bi >= 0 ? paint(Bi) : null;
      const g = st.gP;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      // backlit glass
      const lg = g.createRadialGradient(960, 480, 100, 960, 540, 1150);
      lg.addColorStop(0, '#fff3d6'); lg.addColorStop(0.6, '#f2d4a0'); lg.addColorStop(1, '#a06a3a');
      g.fillStyle = lg; g.fillRect(0, 0, W, H);
      // thin underpainting wash: the gaps between strokes glow with the picture's own colour
      const under = E.outQ(seg(t, 0.02, 0.7));
      if (under > 0) {
        g.globalAlpha = under * 0.92; g.filter = 'blur(6px) saturate(1.2)';
        g.drawImage(st.srcs[A][0], 0, 0, W, H);
        if (Bi >= 0) { g.globalAlpha = under * 0.92 * E.ioS(U); g.drawImage(st.srcs[Bi][0], 0, 0, W, H); }
        g.filter = 'none'; g.globalAlpha = 1;
      }
      const fb = Math.floor(t * 12), boil = 1 - 0.55 * seg(t, 8.9, 9.4);
      const col = st.tmp, colB = st.tmp2, scA = PSCENES[A], scB = Bi >= 0 ? PSCENES[Bi] : null;
      const S = st.strokes, n = S.length;
      for (let i = 0; i < n; i++) {
        const s = S[i];
        // hook: the pane is painted in a rush of strokes
        const app = 0.03 + s.L * 0.16 + s.h * 0.38 + (s.x / 1920) * 0.14;
        const grow = seg(t, app, app + 0.09);
        if (grow <= 0) continue;
        let x = s.x + (h2(i, fb, 1) - 0.5) * 5 * boil, y = s.y + (h2(i, fb, 2) - 0.5) * 5 * boil;
        let len = s.len * (0.85 + 0.3 * h2(i, fb, 3) * boil + 0.15 * (1 - boil)) * (0.3 + 0.7 * E.outQ(grow)), w = s.w;
        let a = pgFlow(scA, dA, x, y, t) + s.jit + (h2(i, fb, 4) - 0.5) * 0.14 * boil;
        if (s.L === 2 && pgMag < 9 && s.h > 0.22 && !tr) continue; // detail strokes go where the form turns
        if (s.L < 2) len /= 1 + pgMag / (s.L ? 70 : 40);
        pgSample(dA, x, y, col);
        if (tr) {
          let d;
          if (tr.kind === 'swirl') d = clamp(Math.hypot(x - tr.cx, y - tr.cy) / 2000 + (s.h2 - 0.5) * 0.3);
          else d = clamp(x / 1920 * 0.85 + s.h2 * 0.15);
          const ui = clamp((U - d * 0.55) / 0.45), m = Math.sin(Math.PI * ui);
          const aB = pgFlow(scB, dB, x, y, t) + s.jit;
          pgSample(dB, x, y, colB);
          const cu = E.ioS(clamp((ui - 0.25) / 0.5));
          for (let k = 0; k < 3; k++) col[k] = lerp(col[k], colB[k], cu);
          let sa;
          if (tr.kind === 'swirl') { sa = Math.atan2(y - tr.cy, x - tr.cx) + Math.PI / 2; x += Math.cos(sa) * m * 90; y += Math.sin(sa) * m * 90; }
          else { sa = 0.08 * Math.sin(y * 0.01); x += m * 120; y += Math.sin(x * 0.01) * m * 14; }
          a = ang2(ang2(a, aB, cu), sa, m * 0.85);
          len *= 1 + m * 1.4; w *= 1 - m * 0.25;
        }
        // per-stroke paint variation: a slightly different mix each time the brush is loaded
        const v = 1 + (s.h3 - 0.5) * 0.3 + (h2(i, fb, 5) - 0.5) * 0.06 * boil, hs = (s.h - 0.5) * 30;
        const R = clamp(col[0] * v + hs, 0, 255) | 0, G = clamp(col[1] * v + (s.z - 0.5) * 10, 0, 255) | 0, Bc = clamp(col[2] * v - hs * 0.8, 0, 255) | 0;
        // ribbon along a slightly curved centre line, blunt where the brush lands, tapering where it lifts
        const ca = Math.cos(a), sa2 = Math.sin(a), k1 = s.curv;
        const hl = len / 2, hw = w / 2;
        g.beginPath();
        const N = 6;
        for (let q = 0; q <= N; q++) {
          const u = q / N, sx = (u - 0.5) * 2, bend = (sx * sx - 0.33) * k1 * hl * 0.5;
          const ww = hw * (0.62 + 0.38 * Math.sin(Math.PI * Math.min(1, u * 1.6 + 0.1))) * (1 - Math.pow(u, 4) * 0.55);
          const px = x + ca * sx * hl - sa2 * (bend - ww), py = y + sa2 * sx * hl + ca * (bend - ww);
          q ? g.lineTo(px, py) : g.moveTo(px, py);
        }
        for (let q = N; q >= 0; q--) {
          const u = q / N, sx = (u - 0.5) * 2, bend = (sx * sx - 0.33) * k1 * hl * 0.5;
          const ww = hw * (0.62 + 0.38 * Math.sin(Math.PI * Math.min(1, u * 1.6 + 0.1))) * (1 - Math.pow(u, 4) * 0.55);
          g.lineTo(x + ca * sx * hl - sa2 * (bend + ww), y + sa2 * sx * hl + ca * (bend + ww));
        }
        g.closePath();
        g.globalAlpha = s.L === 2 ? 0.86 : 0.9;
        g.fillStyle = `rgb(${R},${G},${Bc})`;
        g.fill();
        if (s.L < 2) {
          // bristle ridges dragged through the paint
          st.pat.setTransform(new DOMMatrix().translateSelf(x, y).rotateSelf(a * 57.2958).scaleSelf(len / 128 + 0.4, w / 40));
          g.globalAlpha = 0.8; g.globalCompositeOperation = 'soft-light'; g.fillStyle = st.pat; g.fill();
          g.globalCompositeOperation = 'source-over';
          // impasto ridge catching the light
          g.globalAlpha = 0.22; g.lineWidth = 1.6; g.strokeStyle = `rgb(${Math.min(255, R + 70)},${Math.min(255, G + 60)},${Math.min(255, Bc + 50)})`; g.stroke();
        }
      }
      g.globalAlpha = 1;
      c.drawImage(st.P, 0, 0, W, H);
      // light through the thin paint: bloom
      const bg = st.Bl.getContext('2d');
      bg.filter = 'blur(3px) brightness(0.8) contrast(2.2) saturate(1.4)'; bg.drawImage(st.P, 0, 0, 240, 135); bg.filter = 'none';
      const apex = bump(t, 4.3, 0.6, 0.3, 0.8);
      c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.28 + apex * 0.3; c.drawImage(st.Bl, 0, 0, W, H); c.restore();
      // oil sheen: a soft specular sweep across the wet paint
      c.save(); c.globalCompositeOperation = 'soft-light';
      const sx = 400 + t * 120, sh = c.createLinearGradient(sx - 600, 0, sx + 600, 1080);
      sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,250,235,0.18)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = sh; c.fillRect(0, 0, W, H); c.restore();
      grain(c, W, H, t, 0.08, 'overlay');
      vignette(c, W, H, 0.5, '30,12,4');
    },
    score(A) {
      // the pane is painted: a flurry of brush dabs
      for (let k = 0; k < 26; k++) {
        const t = 0.05 + Math.pow(k / 26, 0.8) * 0.85;
        A.noise(t, { type: 'bandpass', f: 1400 + hash(k) * 2400, q: 1.2, dur: 0.07 + hash(k + 3) * 0.05, g: 0.05 + hash(k + 9) * 0.04, a: 0.012, pan: (hash(k * 2.3) - 0.5) * 1.2 });
      }
      A.bell(0.04, midi(81), { g: 0.05, dur: 3, rev: 0.7 });
      // the sea: slow swells of filtered noise
      [0.6, 2.0, 3.4, 4.9, 6.4, 7.8].forEach((t, i) => A.noise(t, { type: 'lowpass', f: 380 + i * 30, f2: 1300, sweep: 1.2, dur: 2.6, g: 0.12, swell: 0.45, rev: 0.3, pan: i % 2 ? 0.3 : -0.3 }));
      A.noise(0.5, { type: 'lowpass', f: 220, dur: 9.4, g: 0.05, hold: true, rel: 1.2 });
      const pad = (t, ns, d, g = 0.03) => A.chord(t, ns, { type: 'triangle', dur: d, g, a: 0.8, hold: true, rel: 1, lp: 1600, rev: 0.7, width: 1, spread: 7 });
      const cello = (t, m, d, g = 0.07) => A.osc(t, { type: 'sawtooth', f: midi(m), dur: d, g, a: 0.25, hold: true, rel: 0.5, lp: 900, q: 0.8, vib: [5, 3], rev: 0.5 });
      const harp = (t, m, g = 0.16) => A.pluck(t, midi(m), { dur: 2.4, bright: 0.45, decay: 0.997, g, rev: 0.5, pan: (m % 7 - 3) * 0.12 });
      pad(0.9, [47, 54, 59, 62, 66], 1.7); cello(0.95, 59, 1.6);
      harp(1.2, 71); harp(1.6, 74); harp(2.0, 78);
      pad(2.6, [43, 50, 55, 59, 62], 1.0); cello(2.6, 62, 0.9);
      // the wave curls into the fish: swirl
      A.whoosh(2.5, 1.0, { f1: 200, f2: 2600, g: 0.16, pan: -0.4 });
      A.riser(3.0, 1.6, { g: 0.08, f: 98 });
      // the fish breaks the surface
      A.noise(3.28, { type: 'bandpass', f: 1200, f2: 300, sweep: 0.6, dur: 0.8, g: 0.3, rev: 0.4, pan: -0.5 });
      A.noise(3.3, { type: 'highpass', f: 4000, dur: 0.5, g: 0.1, pan: -0.4 });
      [66, 69, 71, 74, 78, 81].forEach((m, i) => harp(3.35 + i * 0.16, m, 0.13 + i * 0.01));
      // apex: the sun behind the fish
      pad(3.6, [43, 50, 57, 59, 62, 66], 1.4, 0.032);
      cello(3.6, 66, 1.2);
      A.chord(4.85, [55, 62, 66, 69, 71, 74], { type: 'sine', dur: 2.4, g: 0.035, a: 0.05, rev: 0.8, width: 1 });
      [86, 90, 93, 98].forEach((m, i) => A.bell(4.85 + i * 0.07, midi(m), { g: 0.05, dur: 2.6, rev: 0.8, pan: (i - 1.5) * 0.3 }));
      A.impact(4.85, 0.22, { rev: 0.7 });
      cello(4.85, 71, 1.3, 0.075);
      pad(5.0, [40, 47, 52, 55, 59, 64], 1.4, 0.03);
      harp(5.6, 76); harp(5.9, 74);
      // dive and re-entry
      A.whoosh(5.7, 0.5, { f1: 2400, f2: 400, g: 0.1, pan: 0.4 });
      A.noise(6.08, { type: 'bandpass', f: 900, f2: 250, sweep: 0.6, dur: 0.9, g: 0.28, rev: 0.4, pan: 0.5 });
      // palm wipe into dusk
      A.whoosh(6.15, 1.1, { f1: 300, f2: 1800, g: 0.14, pan: 0 });
      pad(6.4, [38, 45, 50, 54, 57, 61], 1.6, 0.032); cello(6.4, 66, 1.4); cello(7.6, 64, 0.9);
      harp(7.0, 69); harp(7.3, 73); harp(7.6, 76);
      // sailboat; the picture settles
      pad(8.0, [43, 50, 55, 59, 64], 0.9, 0.03); cello(8.0, 62, 0.8);
      pad(8.85, [38, 45, 50, 54, 57, 62, 66], 1.15, 0.034); cello(8.85, 62, 1.1, 0.07);
      [74, 78, 81, 86].forEach((m, i) => harp(8.85 + i * 0.12, m, 0.12));
      A.bell(8.9, midi(86), { g: 0.04, dur: 2, rev: 0.8 });
    },
  });

  /* =====================================================================
     2. DIRECT-ON-FILM — paint and needle straight onto 35mm celluloid
     ===================================================================== */
  const DP = 1040, DIX = 400, DIW = 1120, DIY = 50, DIH = 940; // pitch and image rect within one frame (strip coords)
  const BPM_B = 0.4, T0 = 2.0, SW8 = BPM_B * 2 / 3;            // 150 bpm, swung eighths
  const bt = p => T0 + p * BPM_B;
  const BASS = [41, 45, 48, 51, 46, 50, 53, 52, 51, 48, 45, 43, 48, 47];
  const SNARE = [2.67, 3.67, 5, 6.67, 7, 7.67, 8.67, 9.67, 10, 10.67, 11, 11.33, 11.67, 12, 12.33, 12.67, 13, 13.33, 13.67];
  const STABS = [0, 1.67, 2.67, 4, 5.67, 6.67, 8, 8.67, 9.67, 10, 11, 11.67, 12, 12.67, 13.33];
  const LEAD = [[4, 72, 0.6], [4.67, 75, 0.3], [5, 77, 0.6], [5.67, 75, 0.3], [6, 72, 0.5], [6.67, 70, 0.3], [7, 68, 0.9],
    [8, 77, 0.3], [8.67, 80, 0.3], [9, 77, 0.3], [9.67, 75, 0.3], [10, 72, 0.6], [11, 77, 0.3], [11.67, 80, 0.3], [12, 84, 0.6], [12.67, 82, 0.3], [13, 80, 0.3], [13.67, 84, 0.5]];
  const RIDE = []; for (let j = 0; j < 14; j++) { RIDE.push(j); if (j % 2) RIDE.push(j + 0.667); }
  const BURN = 7.6, TITLE = 8.5, NFREEZE = Math.floor(BURN * 24);
  const DYES = [[214, 30, 46], [24, 70, 196], [250, 196, 20], [18, 150, 96], [240, 104, 24], [150, 40, 160]];
  const dyeCss = (k, a = 1) => { const d = DYES[((k % DYES.length) + DYES.length) % DYES.length]; return `rgba(${d[0]},${d[1]},${d[2]},${a})`; };
  // strip speed on the light table (frames / s); accelerates into the gate at t = 2
  const dfF = t => 2.5 * t + 21.5 * 0.8 * Math.pow(seg(t, 1.2, 2.0), 4) / 4 + (t > 2 ? 21.5 * (t - 2) : 0);
  const dfCenter = t => 48 + dfF(t) - dfF(2);
  const dfMode = n => n >= TITLE * 24 ? 'T' : n >= NFREEZE ? 'F' : n >= 125 ? 'C' : n >= 86 ? 'B' : 'A';
  // last event at or before film time tf from a list of beat positions
  const lastEv = (list, tf) => { let best = -1; for (const p of list) if (bt(p) <= tf + 1e-6) best = p; return best; };

  function jagLine(g, x0, y0, x1, y1, seed, amp, step = 22) {
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(len / step)), nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
    g.beginPath();
    for (let i = 0; i <= n; i++) {
      const u = i / n, j = (h2(i, seed, 3) - 0.5) * 2 * amp + Math.sin(u * 9 + seed) * amp * 0.6;
      const x = lerp(x0, x1, u) + nx * j, y = lerp(y0, y1, u) + ny * j;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
  }
  // a needle scratch through black emulsion: soft halo, bright core, ragged
  function scratch(g, x0, y0, x1, y1, seed, w, col = '235,242,255', a = 1) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
    jagLine(g, x0, y0, x1, y1, seed, w * 0.6);
    g.strokeStyle = `rgba(${col},${0.16 * a})`; g.lineWidth = w * 3.2; g.stroke();
    g.strokeStyle = `rgba(${col},${0.85 * a})`; g.lineWidth = w; g.stroke();
    jagLine(g, x0, y0, x1, y1, seed + 7, w * 0.4, 13);
    g.strokeStyle = `rgba(255,255,255,${0.9 * a})`; g.lineWidth = Math.max(1, w * 0.35); g.stroke();
    g.restore();
  }
  function dyeBlob(g, cx, cy, r, n, seed, k, a = 0.88) {
    const P = [], N = 30;
    for (let i = 0; i < N; i++) {
      const an = i / N * TAU, rr = r * (1 + 0.16 * (vn2(i * 0.5, seed, 2) - 0.5) * 2 + 0.07 * (h2(i, n, seed) - 0.5) * 2);
      P.push([cx + Math.cos(an) * rr, cy + Math.sin(an) * rr * 0.92]);
    }
    g.beginPath();
    P.forEach((p, i) => { const q = P[(i + 1) % N]; i ? g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2) : g.moveTo((p[0] + q[0]) / 2, (p[1] + q[1]) / 2); });
    g.closePath();
    const d = DYES[((k % DYES.length) + DYES.length) % DYES.length];
    const rg = g.createRadialGradient(cx - r * 0.2, cy - r * 0.2, r * 0.05, cx, cy, r * 1.05);
    rg.addColorStop(0, `rgba(${(d[0] + 255) >> 1},${(d[1] + 255) >> 1},${(d[2] + 255) >> 1},${a})`);
    rg.addColorStop(0.75, `rgba(${d[0]},${d[1]},${d[2]},${a})`);
    rg.addColorStop(1, `rgba(${d[0] * 0.6 | 0},${d[1] * 0.6 | 0},${d[2] * 0.6 | 0},${a})`);
    g.fillStyle = rg; g.fill();
    // dye pools at the rim as it dries
    g.lineWidth = 7; g.strokeStyle = `rgba(${d[0] * 0.45 | 0},${d[1] * 0.45 | 0},${d[2] * 0.45 | 0},${a * 0.7})`; g.stroke();
    // bubbles that did not take the dye
    g.fillStyle = 'rgba(255,250,235,0.55)';
    for (let i = 0; i < 5; i++) { const an = h2(i, n, 9) * TAU, rr = r * 0.7 * Math.sqrt(h2(i, n, 10)); g.beginPath(); g.arc(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr, 2 + h2(i, n, 11) * 7, 0, TAU); g.fill(); }
  }
  // dye painted continuously down the strip with a brush, ignoring frame lines
  function stripBands(g, n, alpha, bands = 4) {
    for (let k = 0; k < bands; k++) {
      const L = [], R = [];
      for (let y = -20; y <= DIH + 20; y += 47) {
        const Y = n * DP + y, cxk = DIW * (0.12 + 0.76 * hash(k * 3.3 + 1)) + 300 * (fbm2(Y / 1500 + k * 3.1, k, 4, 2) - 0.5) * 2;
        const wk = 50 + 170 * vn2(Y / 800 + k * 5, k, 5);
        L.push([cxk - wk / 2 + (h2(y, n, k) - 0.5) * 8, y]); R.push([cxk + wk / 2 + (h2(y, n, k + 9) - 0.5) * 8, y]);
      }
      g.beginPath(); L.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]); g.closePath();
      g.fillStyle = dyeCss(k * 2 + 1, 0.8 * alpha); g.fill();
      const d = DYES[(k * 2 + 1) % DYES.length];
      g.strokeStyle = `rgba(${d[0] * 0.45 | 0},${d[1] * 0.45 | 0},${d[2] * 0.45 | 0},${0.6 * alpha})`; g.lineWidth = 5; g.stroke();
      // brush streaks inside the band
      g.save(); g.clip();
      for (let s = 0; s < 12; s++) {
        const hs = h2(s, k, 3), lite = s % 3 !== 0;
        g.globalCompositeOperation = lite ? 'screen' : 'multiply';
        g.strokeStyle = lite ? `rgba(255,250,230,${(0.05 + 0.16 * hs) * alpha})` : `rgba(${d[0] * 0.5 | 0},${d[1] * 0.5 | 0},${d[2] * 0.5 | 0},${(0.1 + 0.25 * hs) * alpha})`;
        g.lineWidth = 1 + h2(s, k, 4) * 4;
        g.setLineDash([140 + h2(s, k, 5) * 300, 10 + h2(s, k, 6) * 50]); g.lineDashOffset = -(n * DP) % 400;
        const off = h2(s, k, 7);
        g.beginPath(); L.forEach((p, i) => { const x = lerp(p[0], R[i][0], off) + Math.sin(i * 0.7 + s) * 4; i ? g.lineTo(x, p[1]) : g.moveTo(x, p[1]); }); g.stroke();
      }
      g.setLineDash([]); g.restore();
    }
  }
  function dfContent(g, n, st) {
    const W = DIW, Hh = DIH, mode = dfMode(n), tf = n / 24, r = rng(n * 7919 + 13);
    const beat = (tf - T0) / BPM_B, j = Math.floor(beat);
    let black = mode === 'B' || mode === 'T';
    if (mode === 'C') {
      // Len Lye flicker: colour and black alternate on the swung eighths, every two frames in the last beat
      black = beat > 13 ? (n >> 1) % 2 === 0 : Math.floor((beat % 1 < 0.667 ? 0 : 1) + j * 2) % 2 === 1;
    }
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.fillStyle = black ? '#0d0b0a' : '#f6efdf'; g.fillRect(0, 0, W, Hh);
    if (!black) {
      g.globalCompositeOperation = 'multiply';
      // uneven acetate tone
      const bg = g.createRadialGradient(W * (0.3 + 0.4 * h2(n, 1)), Hh * 0.5, 50, W / 2, Hh / 2, W * 0.8);
      bg.addColorStop(0, 'rgba(255,255,255,1)'); bg.addColorStop(1, 'rgba(236,222,196,1)');
      g.fillStyle = bg; g.fillRect(0, 0, W, Hh);
      if (mode === 'C' && beat > 8) { g.fillStyle = dyeCss(j * 2 + (beat % 1 > 0.6 ? 1 : 0) + 2, 0.75); g.fillRect(0, 0, W, Hh); }
      stripBands(g, n, mode === 'C' ? 0.8 : 1, mode === 'C' ? 3 : 4);
      // the bass note: a hand-painted blob that pops on each walk step and boils every frame
      const bj = mode === 'A' && n < 48 ? Math.floor(n / 9.6) : clamp(j, 0, 13), since = mode === 'A' && n < 48 ? (n % 9.6) / 24 : tf - bt(bj);
      const note = BASS[((bj % 14) + 14) % 14], pop = 1 + 0.45 * Math.exp(-since * 24 / 2.2);
      const bx = W * (0.25 + 0.5 * hash(bj * 1.7 + 3)), by = Hh * (0.85 - (note - 40) / 16 * 0.7);
      dyeBlob(g, bx, by, (130 + (note % 5) * 16) * pop, n, bj + 20, bj + 3);
      if (mode === 'C') dyeBlob(g, W - bx, Hh - by, 90 * pop, n, bj + 40, bj + 1, 0.8);
      // piano stab: a flick of paint spatter
      const sp = lastEv(STABS, tf);
      if (sp >= 0 && tf - bt(sp) < 0.13) {
        const sx = W * (0.2 + 0.6 * hash(sp * 5.1)), sy = Hh * (0.2 + 0.6 * hash(sp * 2.7)), k = Math.round(sp * 3);
        g.fillStyle = dyeCss(k + 4, 0.9);
        for (let i = 0; i < 26; i++) { const an = r() * TAU, d = Math.pow(r(), 0.6) * 230, s = (1 - d / 260) * 16 * r() + 2; g.beginPath(); g.ellipse(sx + Math.cos(an) * d, sy + Math.sin(an) * d, s, s * (0.6 + r() * 0.4), an, 0, TAU); g.fill(); }
      }
      // ink pen squiggles on the ride cymbal
      const rd = lastEv(RIDE, tf);
      if (rd >= 0 && tf - bt(rd) < 0.1) {
        g.strokeStyle = 'rgba(20,14,10,0.85)'; g.lineWidth = 4; g.lineCap = 'round';
        const x0 = W * (0.1 + 0.8 * hash(rd * 3.9)), y0 = Hh * (0.1 + 0.6 * hash(rd * 1.3));
        g.beginPath(); for (let i = 0; i < 12; i++) { const x = x0 + i * 16, y = y0 + (i % 2 ? -1 : 1) * (14 + r() * 10); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
      }
    }
    g.globalCompositeOperation = 'source-over';
    if (black && mode !== 'T') {
      // dancing needle lines: each beat they leap to a new chord of positions, springing there by hand
      const jj = Math.max(0, j), since = Math.max(0, tf - bt(jj)), cnt = mode === 'C' ? 8 : 7;
      const rd = lastEv(RIDE, tf), hot = rd >= 0 && tf - bt(rd) < 0.09 ? 1 : 0;
      for (let i = 0; i < cnt; i++) {
        const p0 = 0.08 + 0.84 * hash(i * 7.3 + (jj - 1) * 13.1), p1 = 0.08 + 0.84 * hash(i * 7.3 + jj * 13.1);
        const x = W * lerp(p0, p1, MG.spring(since, 3.2, 0.32)) + (h2(i, n, 4) - 0.5) * 10;
        const tilt = (h2(i, jj, 5) - 0.5) * 160 + (h2(i, n, 6) - 0.5) * 12;
        const w = (3 + 4 * hash(i * 2.2 + jj)) * (1 + hot * 0.8);
        const tint = i % 3 === 0 ? DYES[(i + jj) % DYES.length].join(',') : '235,242,255';
        scratch(g, x - tilt / 2, -10, x + tilt / 2, Hh + 10, n * 31 + i, w, tint);
      }
      // snare: a scratched starburst
      const sn = lastEv(SNARE, tf);
      if (sn >= 0 && tf - bt(sn) < 0.16) {
        const u = (tf - bt(sn)) / 0.16, cx = W * (0.25 + 0.5 * hash(sn * 4.4)), cy = Hh * (0.25 + 0.5 * hash(sn * 8.8)), R = 80 + u * 340;
        for (let i = 0; i < 18; i++) { const an = i / 18 * TAU + h2(i, n, 2) * 0.3, r0 = R * (0.25 + 0.2 * h2(i, n, 3)); scratch(g, cx + Math.cos(an) * r0, cy + Math.sin(an) * r0, cx + Math.cos(an) * R, cy + Math.sin(an) * R, i + n * 5, 3, i % 4 ? '255,236,200' : '255,120,90', 1 - u * 0.5); }
      }
      // the clarinet line: a zigzag scratched at the height of the note
      for (const [p, m, d] of LEAD) {
        const dd = d * BPM_B * 1.5; if (tf < bt(p) || tf > bt(p) + dd) continue;
        const y = Hh * (0.92 - (m - 66) / 20 * 0.85), u = (tf - bt(p)) / dd, x1 = W * (0.05 + 0.9 * E.outQ(clamp(u * 1.6)));
        g.save(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'miter';
        g.beginPath(); for (let x = W * 0.05, i = 0; x <= x1; x += 16 + h2(i, n, 8) * 22, i++) { const yy = y + (i % 2 ? -1 : 1) * (8 + h2(i, n, 9) * 22) + (h2(i, n, 7) - 0.5) * 10; i ? g.lineTo(x, yy) : g.moveTo(x, yy); }
        g.strokeStyle = 'rgba(255,190,90,0.25)'; g.lineWidth = 14; g.stroke(); g.strokeStyle = 'rgba(255,214,140,0.95)'; g.lineWidth = 4; g.stroke();
        g.restore();
      }
      // emulsion chips: white sparkle
      g.fillStyle = 'rgba(255,255,250,0.9)';
      for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(r() * W, r() * Hh, 0.8 + r() * 2.4, 0, TAU); g.fill(); }
    }
    if (mode === 'T') {
      // title scratched by hand into black leader, slightly different on every frame
      const fb = Math.floor(n / 2);
      g.save(); g.translate(W / 2, Hh * 0.47);
      g.font = '400 118px "Rock Salt"'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const words = ['DIRECT', 'ON FILM'];
      words.forEach((wd, wi) => {
        const ch = [...wd], ws = ch.map(c2 => g.measureText(c2).width), tw = ws.reduce((a, b) => a + b, 0);
        let x = -tw / 2;
        ch.forEach((c2, i) => {
          const ox = (h2(i + wi * 9, fb, 1) - 0.5) * 7, oy = (h2(i + wi * 9, fb, 2) - 0.5) * 7, rot = (h2(i + wi * 9, fb, 3) - 0.5) * 0.06;
          g.save(); g.translate(x + ws[i] / 2 + ox, (wi - 0.5) * 190 + oy); g.rotate(rot);
          g.globalCompositeOperation = 'lighter';
          g.fillStyle = 'rgba(200,225,255,0.18)'; g.fillText(c2, 2, 2); g.fillText(c2, -2, -1);
          g.fillStyle = 'rgba(245,248,255,0.95)'; g.fillText(c2, 0, 0);
          g.restore(); x += ws[i];
        });
      });
      g.restore();
      // a painted underline and a dyed spot
      const tu = seg(tf, TITLE, TITLE + 0.5);
      scratch(g, W * 0.18, Hh * 0.8, W * (0.18 + 0.64 * E.outQ(tu)), Hh * 0.8 + 6, fb, 4, '255,214,140');
      g.save(); g.globalCompositeOperation = 'screen'; dyeBlob(g, W * 0.86, Hh * 0.2, 52, fb, 77, 0, 0.9); g.restore();
      g.font = '700 30px "Courier Prime"'; g.textAlign = 'center'; g.fillStyle = 'rgba(230,224,210,0.85)';
      g.letterSpacing = '6px';
      g.fillText('SCRATCHED · PAINTED · PROJECTED', W / 2, Hh * 0.9);
      g.letterSpacing = '0px';
      g.fillStyle = 'rgba(255,255,250,0.9)';
      for (let i = 0; i < 10; i++) { g.beginPath(); g.arc(r() * W, r() * Hh, 0.8 + r() * 2, 0, TAU); g.fill(); }
    }
    // dye density / emulsion mottling, different on every frame
    const mx = -(h2(n, 21) * 300) | 0, my = -(h2(n, 22) * 260) | 0;
    if (!black) { g.globalCompositeOperation = 'multiply'; g.drawImage(st.MOT, mx, my); }
    else { g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.5; g.drawImage(st.EMU, mx, my); g.globalAlpha = 1; }
    // dust and hair riding on this frame
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = black ? 'rgba(250,246,236,0.75)' : 'rgba(25,18,12,0.8)';
    const nd = 4 + (r() * 10 | 0);
    for (let i = 0; i < nd; i++) { const x = r() * W, y = r() * Hh, s = 1 + r() * r() * 7; g.beginPath(); g.ellipse(x, y, s, s * (0.5 + r() * 0.6), r() * 3, 0, TAU); g.fill(); }
    if (r() < 0.22) {
      g.strokeStyle = black ? 'rgba(240,236,226,0.7)' : 'rgba(20,14,10,0.75)'; g.lineWidth = 1.6;
      const x = r() * W, y = r() * Hh; g.beginPath(); g.moveTo(x, y);
      g.bezierCurveTo(x + (r() - 0.5) * 300, y + (r() - 0.5) * 300, x + (r() - 0.5) * 300, y + (r() - 0.5) * 300, x + (r() - 0.5) * 260, y + (r() - 0.5) * 260); g.stroke();
    }
    // the long scratch left by a dirty projector gate
    g.strokeStyle = black ? 'rgba(255,255,255,0.35)' : 'rgba(40,30,20,0.25)'; g.lineWidth = 1.5;
    const lx = W * 0.31 + Math.sin(n * 0.21) * 6; g.beginPath(); g.moveTo(lx, 0); g.lineTo(lx + 3, Hh); g.stroke();
  }
  function dfFrame(st, n) {
    if (st.cache.has(n)) return st.cache.get(n);
    let cv = st.pool.find(p => !p.used);
    if (!cv) { cv = { c: offscreen(DIW, DIH), used: false }; st.pool.push(cv); }
    cv.used = true;
    dfContent(cv.c.getContext('2d'), n, st);
    st.cache.set(n, cv);
    return cv;
  }
  function dfSoundtrack(g, n, x0, y0, w, h) {
    // variable-area optical track: the bass note's wavelength drawn into the film (McLaren drew his sound too)
    g.fillStyle = '#0a0807'; g.fillRect(x0, y0, w, h);
    const tf = n / 24, j = clamp(Math.floor((tf - T0) / BPM_B), 0, 13), live = tf >= T0 && tf < BURN;
    const f = midi(BASS[j]), lam = 24960 / f, lam2 = 24960 / (f * 4), since = tf - bt(j);
    const amp = live ? 0.35 + 0.6 * Math.exp(-since * 4) : 0.04;
    g.fillStyle = 'rgba(250,244,226,0.95)'; g.beginPath();
    for (let y = 0; y <= h; y += 4) { const Y = n * DP + y, v = Math.abs(Math.sin(Y / lam * TAU) * 0.75 + Math.sin(Y / lam2 * TAU) * 0.25) * amp, hw = 3 + v * (w / 2 - 6); g.rect(x0 + w / 2 - hw, y0 + y, hw * 2, 4.5); }
    g.fill();
  }
  function dfStrip(c, st, n0, n1, Y0, edgeTxt = true) {
    // strip coords: x in [-960, 960], y relative to Y0
    for (let n = n0; n <= n1; n++) {
      const y0 = n * DP - Y0, mode = dfMode(n), blackEdge = mode !== 'A';
      c.fillStyle = blackEdge ? '#14100c' : '#e8dcc0'; c.fillRect(-960, y0, 1920, DP + 1);
      // perforations: holes let the raw lamp through
      for (let q = 0; q < 4; q++) {
        const py = y0 + q * DP / 4 + DP / 8 - 46;
        [-960 + 82, 960 - 82 - 136].forEach(px => {
          MG.rrect(c, px, py, 136, 92, 16); c.fillStyle = '#fffaf0'; c.fill();
          c.strokeStyle = blackEdge ? 'rgba(90,70,50,0.8)' : 'rgba(150,120,80,0.6)'; c.lineWidth = 3; c.stroke();
        });
      }
      dfSoundtrack(c, n, -960 + 268, y0 + 30, 88, DP - 60);
      const fr = dfFrame(st, n);
      c.drawImage(fr.c, -960 + DIX, y0 + DIY, DIW, DIH);
      // frame-line rule
      c.fillStyle = blackEdge ? 'rgba(80,64,48,0.6)' : 'rgba(120,96,64,0.35)'; c.fillRect(-960 + DIX - 10, y0 + 4, DIW + 20, 3);
      if (edgeTxt && n % 4 === 0) {
        c.save(); c.translate(-960 + 40, y0 + DP / 2); c.rotate(-Math.PI / 2);
        c.font = '700 24px "Courier Prime"'; c.textAlign = 'center'; c.fillStyle = blackEdge ? 'rgba(255,200,120,0.75)' : 'rgba(120,80,40,0.7)';
        c.fillText(n % 16 === 0 ? `SAFETY FILM  ▸  ${1949 + (n >> 4)}` : `◂ ${n}`, 0, 0); c.restore();
      }
    }
  }
  function dfBurn(st, t) {
    // emulsion blistering under the lamp: per-pixel burn on a quarter-res grid
    const { BW, BH, NZ, BUB, bimg, gB } = st, d = bimg.data;
    const R1 = Math.pow(seg(t, BURN + 0.05, 8.4), 1.6) * 1.9, R2 = Math.pow(seg(t, 7.92, 8.42), 1.5) * 1.6;
    const heat = seg(t, BURN, BURN + 0.5);
    for (let y = 0, i = 0; y < BH; y++) for (let x = 0; x < BW; x++, i++) {
      const nx = x / BW, ny = y / BH, nz = NZ[i];
      const d1 = Math.hypot(nx - 0.44, (ny - 0.42) * 0.8) * 2.2 + (nz - 0.5) * 0.8 - R1;
      const d2 = Math.hypot(nx - 0.72, (ny - 0.68) * 0.8) * 2.4 + (nz - 0.5) * 0.8 - R2;
      const dd = Math.min(d1, R2 > 0 ? d2 : 9);
      let r = 0, gg = 0, b = 0, a = 0;
      if (dd < -0.05) { r = 255; gg = 252; b = 238; a = 255; }
      else if (dd < 0) { const u = (dd + 0.05) / 0.05; r = 255; gg = 236 - u * 120; b = 170 - u * 150; a = 255; }
      else if (dd < 0.05) { const u = dd / 0.05; r = lerp(150, 30, u); gg = lerp(60, 16, u); b = lerp(10, 6, u); a = 245; }
      else if (dd < 0.3) { const u = (dd - 0.05) / 0.25, bb = BUB[i]; r = 120 - u * 40; gg = 60 - u * 30; b = 20; a = (1 - u) * 230 * bb + (1 - u) * 40; }
      else { r = 110; gg = 60; b = 20; a = heat * 60 * (0.6 + nz * 0.8); }
      const j = i * 4; d[j] = r; d[j + 1] = gg; d[j + 2] = b; d[j + 3] = a;
    }
    gB.putImageData(bimg, 0, 0);
    return st.BC;
  }

  MG.film({
    id: 'directfilm',
    dur: 10,
    poster: 9.4,
    fonts: [['400 118px "Rock Salt"', 'DIRECTONFILM'], ['700 30px "Courier Prime"', 'SCRATCHEDPAINTED·']],
    meta: {
      family: 'F', name: 'Direct-on-Film', sub: 'Scratched & Painted Celluloid', era: '1930s —',
      origin: 'Cameraless animation: artists paint, dye, scratch and stick things straight onto film stock, frame by frame or along the strip, and project the result. Len Lye and Norman McLaren turned it into visual music.',
      works: 'A Colour Box (Len Lye, 1935) · Free Radicals (Len Lye, 1958) · Begone Dull Care (Norman McLaren & Evelyn Lambart, 1949) · Blinkity Blank (Norman McLaren, 1955) · Mothlight (Stan Brakhage, 1963)',
      tech: ['Dye painted along the strip', 'Needle scratches on black leader', 'Projector weave & flicker'],
      accent: '#e8402e',
      motionDNA: 'Visual music: every bass step, cymbal and snare lands on the frame as a new blob, a leaping scratch or a starburst, boiling at 24 fps.',
      visualDNA: 'Translucent dye and white needle lines on celluloid, with sprocket holes, dust, hair, gate weave and flicker showing the medium.',
      transitions: 'Frame slip, colour/black flicker, burn-out, white flash',
      implementation: ['Film stock + paint + needle', 'Optical printer', 'Canvas 2D (procedural homage)'],
      reproducibility: 'Needs physical capture (this film is a procedural homage)',
      loopable: false,
    },
    setup() {
      const BW = 280, BH = 235, NZ = new Float32Array(BW * BH), BUB = new Float32Array(BW * BH);
      const pts = []; const r = rng(31);
      for (let gy = 0; gy < 24; gy++) for (let gx = 0; gx < 28; gx++) pts.push([(gx + r()) / 28, (gy + r()) / 24, 0.012 + r() * 0.02]);
      for (let y = 0, i = 0; y < BH; y++) for (let x = 0; x < BW; x++, i++) {
        NZ[i] = fbm2(x / 26, y / 26, 3, 4);
        const nx = x / BW, ny = y / BH; let b = 0;
        const gx = Math.floor(nx * 28), gy = Math.floor(ny * 24);
        for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
          const p = pts[(clamp(gy + oy, 0, 23)) * 28 + clamp(gx + ox, 0, 27)], dd = Math.hypot(nx - p[0], (ny - p[1]) * 0.84);
          if (dd < p[2]) b = Math.max(b, 1 - Math.pow(dd / p[2], 4) * 0.6);
        }
        BUB[i] = b;
      }
      const [BC, gB] = canvasRW(BW, BH);
      const S = offscreen(1920, 1080);
      // mottling textures (drawn at random offsets each frame)
      const mk = (fn) => { const [cv, g] = canvasRW(DIW + 300, DIH + 260), id = g.createImageData(cv.width, cv.height), rr = rng(5);
        for (let y = 0, i = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++, i += 4) { const v = fn(x, y, rr()); id.data[i] = v[0]; id.data[i + 1] = v[1]; id.data[i + 2] = v[2]; id.data[i + 3] = 255; }
        g.putImageData(id, 0, 0); return cv; };
      const MOT = mk((x, y, q) => { const m = fbm2(x / 90, y / 90, 7, 3), gr = fbm2(x / 9, y / 9, 8, 2), v = 255 - Math.pow(m, 2.2) * 70 - gr * 26 - q * 10 - (h2(x >> 2, y >> 2, 3) > 0.995 ? 90 : 0); return [v, v * 0.985, v * 0.96]; });
      const EMU = mk((x, y, q) => { const m = fbm2(x / 120, y / 120, 9, 3), v = Math.pow(m, 3) * 70 + q * 12 + (h2(x >> 1, y >> 1, 4) > 0.997 ? 160 : 0); return [v * 0.9, v * 0.85, v]; });
      return { BW, BH, NZ, BUB, BC, gB, bimg: gB.createImageData(BW, BH), S, MOT, EMU, Bl: offscreen(240, 135), pool: [], cache: new Map() };
    },
    draw(c, t, W, H, st) {
      st.cache.clear(); st.pool.forEach(p => (p.used = false));
      const S = st.S, g = S.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      const intro = t < 2.0;
      let blurPx = 0;
      if (intro) {
        // the strip winding across a light table, then racing into the gate
        g.fillStyle = '#16120f'; g.fillRect(0, 0, W, H);
        const k = kf(t, [[0, 0.5], [1.2, 0.58, E.ioS], [2.0, 1.1, E.inC]]), rot = kf(t, [[0, -0.07], [2.0, 0, E.ioS]]);
        const lg = g.createRadialGradient(960, 540, 80, 960, 540, 900);
        lg.addColorStop(0, 'rgba(255,236,200,0.9)'); lg.addColorStop(1, 'rgba(255,220,170,0.08)');
        g.fillStyle = lg; g.fillRect(0, 0, W, H);
        const nc = dfCenter(t), Y0 = nc * DP + DP / 2;
        const span = (H / k) * 0.75 + DP;
        g.save(); g.translate(960, 540); g.rotate(rot); g.scale(k, k);
        g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-960 + 18, -span, 1920, span * 2);
        dfStrip(g, st, Math.floor((Y0 - span) / DP), Math.floor((Y0 + span) / DP), Y0);
        g.restore();
        const vfs = 2.5 + 21.5 * E.inC(seg(t, 1.2, 2.0));
        blurPx = vfs * DP * k / 30 * 0.5;
      } else {
        // registered in the gate: weave, frame slips at the section changes, freeze for the burn
        const tt = t >= BURN && t < TITLE ? BURN : t;
        const n = Math.floor(tt * 24);
        let slip = 0;
        [3.6, 5.2].forEach(ts => { const u = seg(t, ts - 0.12, ts + 0.12); if (u > 0 && u < 1) slip = (E.ioS(u) - (t >= ts ? 1 : 0)) * DP; });
        const still = t >= BURN && t < TITLE;
        const wx = still ? 0 : vnoise(t * 3.1, 2) * 4 + (h2(n, 1) - 0.5) * 2, wy = still ? 0 : vnoise(t * 2.3, 5) * 3 + (h2(n, 2) - 0.5) * 2;
        const k = t > TITLE ? kf(t, [[TITLE + 0.1, 1.1], [9.6, 0.8, E.ioS]]) : 1.1;
        const Y0 = n * DP + DP / 2 + slip;
        g.fillStyle = '#0c0a08'; g.fillRect(0, 0, W, H);
        g.save(); g.translate(960 + wx, 540 + wy); g.scale(k, k);
        dfStrip(g, st, n - 1, n + 1, Y0);
        if (t >= BURN && t < TITLE) {
          const bc = dfBurn(st, t);
          g.imageSmoothingEnabled = true;
          g.drawImage(bc, -960 + DIX, n * DP - Y0 + DIY, DIW, DIH);
        }
        g.restore();
        if (Math.abs(slip) > 1) blurPx = Math.min(260, Math.abs(Math.sin(Math.PI * seg(Math.abs(slip), 0, DP))) * 260);
      }
      // draw the strip to the screen, smeared when it moves fast
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      if (blurPx > 30) {
        const N = 6;
        for (let i = 0; i < N; i++) { c.globalAlpha = i === 0 ? 1 : 1 / (i + 1); c.drawImage(S, 0, (i / (N - 1) - 0.5) * blurPx); }
        c.globalAlpha = 1;
      } else c.drawImage(S, 0, 0);
      // light spilling around bright film: bloom
      const bl = st.Bl.getContext('2d'); bl.filter = 'blur(4px) brightness(0.9) contrast(1.8)'; bl.drawImage(c.canvas, 0, 0, 240, 135); bl.filter = 'none';
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.32; c.drawImage(st.Bl, 0, 0, c.canvas.width, c.canvas.height); c.restore();
      // projector light: hot centre, flicker
      const f = Math.floor(t * 24), proj = t >= 1.9;
      if (proj) {
        const fl = (h2(f, 3) - 0.5) * (t > 5.2 && t < BURN ? 0.16 : 0.09) + (t >= BURN && t < TITLE ? (h2(f, 4) - 0.5) * 0.2 : 0);
        c.fillStyle = fl > 0 ? `rgba(255,248,230,${fl})` : `rgba(0,0,0,${-fl})`; c.fillRect(0, 0, W, H);
        const hg = c.createRadialGradient(960, 520, 200, 960, 540, 1150);
        hg.addColorStop(0, 'rgba(255,240,210,0.06)'); hg.addColorStop(1, 'rgba(0,0,0,0.55)');
        c.fillStyle = hg; c.fillRect(0, 0, W, H);
        // a hair caught in the gate
        if (t > 4.3 && t < 5.9) {
          c.strokeStyle = 'rgba(10,8,6,0.85)'; c.lineWidth = 2.2; c.beginPath();
          const hx = 1440 + vnoise(t * 6, 8) * 8, hy = 920;
          c.moveTo(hx, hy); c.bezierCurveTo(hx - 60, hy - 80 + vnoise(t * 9, 3) * 10, hx + 40, hy - 160, hx - 30 + vnoise(t * 7, 4) * 14, hy - 260); c.stroke();
        }
      }
      // lamp strikes at the gate; white-out at the end of the burn
      const flash = Math.max(bump(t, 1.86, 0.05, 0.03, 0.18), seg(t, 8.3, 8.42) * (1 - seg(t, TITLE, TITLE + 0.06)));
      if (flash > 0) { c.fillStyle = `rgba(255,252,240,${flash})`; c.fillRect(0, 0, W, H); }
      grain(c, W, H, t, 0.1, 'overlay');
      vignette(c, W, H, intro ? 0.6 : 0.4, '0,0,0');
    },
    score(A) {
      A.bus.gain.value = 0.55; // a busy jazz mix: leave headroom for the transients
      // projector: motor and sprocket clatter that follows the strip speed
      A.osc(0.9, { type: 'sawtooth', f: 48, f2: 60, glide: 1.1, dur: 6.75, g: 0.025, lp: 300, a: 0.6, hold: true, rel: 0.2 });
      A.noise(0.9, { type: 'bandpass', f: 900, q: 0.6, dur: 6.75, g: 0.015, a: 0.5, hold: true, rel: 0.2 });
      let last = Math.floor(dfCenter(0.0));
      for (let k = 1; k < 200; k++) {
        const t = k / 100; if (t >= 2) break;
        const fc = Math.floor(dfCenter(t));
        if (fc !== last) { A.noise(t, { type: 'bandpass', f: 2600, q: 2, dur: 0.02, g: 0.09, pan: 0.2 }); A.osc(t, { f: 180, dur: 0.02, g: 0.04, type: 'square', lp: 900 }); last = fc; }
      }
      for (let f = 48; f < BURN * 24; f++) A.noise(f / 24, { type: 'bandpass', f: 2400 + (f % 2) * 300, q: 2, dur: 0.012, g: 0.022, pan: 0.15 });
      // drummer counts in on the hi-hat
      [0.4, 0.8, 1.2, 1.6].forEach((t, i) => { A.hat(t, 0.14, false, { f: 6000 }); A.noise(t, { type: 'bandpass', f: 3200, q: 3, dur: 0.03, g: 0.08 + i * 0.02 }); });
      // walking bass
      BASS.forEach((m, j) => {
        A.pluck(bt(j), midi(m), { dur: 0.6, bright: 0.5, decay: 0.993, g: 0.28, lp: 1400 });
        A.osc(bt(j), { f: midi(m), dur: 0.35, g: 0.09, type: 'sine' });
      });
      // ride with swung skip notes, hat foot on 2 and 4
      RIDE.forEach(p => { A.noise(bt(p), { type: 'highpass', f: 6500, dur: 0.32, g: p % 1 ? 0.03 : 0.045, pan: 0.35 }); A.osc(bt(p), { f: 5200, dur: 0.18, g: 0.006, type: 'square', lp: 9000 }); });
      for (let j = 1; j < 14; j += 2) A.hat(bt(j), 0.07, false, { f: 7000, pan: -0.3 });
      // brushes swirling under it all
      for (let j = 0; j < 14; j++) A.noise(bt(j), { type: 'bandpass', f: 3000, q: 0.5, dur: BPM_B, g: 0.03, swell: 0.6, pan: -0.2 });
      SNARE.forEach(p => A.snare(bt(p), p > 11 ? 0.22 + (p - 11) * 0.04 : 0.2, { f: 2100, dur: 0.14, rev: 0.12 }));
      [4, 8].forEach(p => A.noise(bt(p), { type: 'highpass', f: 4500, dur: 1.4, g: 0.12, rev: 0.3 }));
      A.kick(bt(4), 0.26); A.kick(bt(8), 0.28); A.kick(bt(12), 0.22); A.kick(bt(13), 0.24);
      // piano comping: Charleston stabs
      const VO = [[51, 55, 57, 62], [50, 53, 56, 60], [51, 55, 57, 62], [52, 55, 58, 62]];
      STABS.forEach(p => {
        const ch = VO[Math.floor(p / 4) % 4];
        ch.forEach((m, i) => { A.pluck(bt(p) + i * 0.006, midi(m), { dur: 0.7, bright: 0.8, decay: 0.99, g: 0.1, pan: 0.25 }); A.osc(bt(p), { f: midi(m), dur: 0.25, g: 0.025, type: 'triangle' }); });
      });
      // clarinet line
      LEAD.forEach(([p, m, d]) => {
        A.osc(bt(p), { type: 'square', f: midi(m), dur: d * BPM_B * 1.5, g: 0.04, a: 0.02, hold: true, rel: 0.06, lp: 1800, q: 1.5, vib: [5.5, 4], rev: 0.25, pan: -0.15 });
        A.osc(bt(p), { type: 'triangle', f: midi(m) * 2, dur: d * BPM_B * 1.5, g: 0.015, a: 0.02, hold: true, rel: 0.06 });
      });
      // the film jams and burns
      A.impact(BURN, 0.4, { rev: 0.4 });
      A.noise(BURN, { type: 'bandpass', f: 600, q: 1, dur: 0.12, g: 0.4 });
      A.osc(BURN, { type: 'sawtooth', f: 64, f2: 18, glide: 0.8, dur: 0.85, g: 0.06, lp: 500 });
      A.chord(BURN, [51, 55, 57, 62], { type: 'triangle', dur: 0.6, g: 0.03, lp: 1200 });
      [53, 57, 62].forEach(m => A.osc(BURN + 0.02, { type: 'square', f: midi(m), f2: midi(m) / 3, glide: 0.7, dur: 0.75, g: 0.025, lp: 1400 }));
      for (let k = 0; k < 70; k++) { const t = BURN + 0.05 + k / 70 * 0.75; A.noise(t, { type: 'highpass', f: 2500 + hash(k) * 5000, dur: 0.006 + hash(k + 1) * 0.01, g: 0.05 + hash(k + 2) * 0.12 * (k / 70), pan: (hash(k + 3) - 0.5) * 1.4 }); }
      A.noise(BURN + 0.1, { type: 'bandpass', f: 1500, f2: 5000, sweep: 0.7, dur: 0.75, g: 0.1, swell: 0.9 });
      A.noise(8.32, { type: 'highpass', f: 1500, dur: 0.2, g: 0.16, rev: 0.6 });
      // title: last chord
      A.pluck(TITLE + 0.02, midi(29), { dur: 2.4, bright: 0.4, decay: 0.997, g: 0.5, lp: 900 });
      A.osc(TITLE + 0.02, { f: midi(29), dur: 1.6, g: 0.12 });
      [53, 57, 62, 65, 67, 69].forEach((m, i) => A.pluck(TITLE + 0.03 + i * 0.03, midi(m), { dur: 2.6, bright: 0.7, decay: 0.997, g: 0.16, pan: (i - 2.5) * 0.15, rev: 0.4 }));
      A.noise(TITLE, { type: 'highpass', f: 5000, dur: 1.6, g: 0.06, rev: 0.5 });
      A.noise(9.2, { type: 'highpass', f: 6500, dur: 0.4, g: 0.03, pan: 0.35 });
    },
  });

  /* =====================================================================
     3. CYANOTYPE — sun print: coat, lay specimens, expose, wash, dry
     ===================================================================== */
  const CW = 750, CH = 480, CN = CW * CH;                 // material grid (half of the 1500×960 sheet)
  const SHX = 960, SHY = 548, SROT = -0.018;               // sheet centre and tilt on the table
  const CY = { coat: [0.1, 0.38, 0.66, 0.94], coatDur: 0.24, sunOn: 1.9, burst: 4.9, sunOff: 6.0, wash: 6.55, dry: 7.75 };
  const cyRate = t => (t < CY.sunOn ? 0 : t < CY.burst ? 0.35 : t < CY.sunOff ? 2.2 : 0);
  const cyLint = t => { // ∫ rate
    const a = clamp(t, CY.sunOn, CY.burst) - CY.sunOn, b = clamp(t, CY.burst, CY.sunOff) - CY.burst;
    return a * 0.35 + b * 2.2;
  };
  // specimens: keyframes [t, x, y, rot] in sheet pixels; motion is stepped at 12 fps like stop-motion
  const SPEC = [
    { kind: 'fern', s: 1.0, keys: [[1.15, -500, 300, -0.9], [1.6, 560, 470, 0.35], [2.6, 560, 470, 0.35], [2.85, 300, 430, -0.55], [3.4, 300, 430, -0.55], [3.65, 470, 400, 0.05], [4.2, 470, 400, 0.05], [4.45, 385, 395, -0.27], [6.1, 385, 395, -0.27], [6.5, -500, 300, -0.6]] },
    { kind: 'dicho', s: 1.0, keys: [[1.25, 1100, -500, 0.6], [1.7, 1150, 330, 0.6], [2.6, 1150, 330, 0.6], [2.85, 860, 360, -0.3], [3.4, 860, 360, -0.3], [3.65, 1060, 320, 0.4], [4.2, 1060, 320, 0.4], [4.45, 985, 345, 0.14], [6.15, 985, 345, 0.14], [6.55, 1100, -500, 0.5]] },
    { kind: 'plume', s: 1.0, keys: [[1.3, 2100, 600, 1.4], [1.75, 1080, 600, 1.1], [2.6, 1080, 600, 1.1], [2.85, 1300, 520, 0.1], [3.4, 1300, 520, 0.1], [3.65, 1180, 600, 0.8], [4.2, 1180, 600, 0.8], [4.45, 1300, 520, 0.5], [6.2, 1300, 520, 0.5], [6.6, 2100, 700, 1.0]] },
    { kind: 'ginkgo', s: 0.8, keys: [[1.4, 700, 1500, 1.8], [1.8, 330, 560, -0.5], [2.6, 330, 560, -0.5], [2.85, 640, 560, 1.0], [3.4, 640, 560, 1.0], [3.65, 760, 470, 0.2], [4.2, 760, 470, 0.2], [4.45, 700, 520, 0.6], [6.15, 700, 520, 0.6], [6.5, 700, 1500, 1.2]] },
    { kind: 'fern', s: 0.48, keys: [[1.35, 1800, -200, -2.2], [1.75, 800, 190, -1.7], [2.6, 800, 190, -1.7], [2.85, 1330, 230, -0.9], [3.4, 1330, 230, -0.9], [3.65, 1180, 170, -1.6], [4.2, 1180, 170, -1.6], [4.45, 1255, 200, -1.28], [6.2, 1255, 200, -1.28], [6.55, 1800, -200, -2]] },
    { kind: 'dicho', s: 0.55, keys: [[1.45, -400, 900, -0.4], [1.85, 260, 640, 0.3], [2.6, 260, 640, 0.3], [2.85, 160, 720, -0.9], [3.4, 160, 720, -0.9], [3.65, 250, 690, -0.2], [4.2, 250, 690, -0.2], [4.45, 195, 700, -0.55], [6.1, 195, 700, -0.55], [6.45, -400, 900, -0.3]] },
  ];
  const LABEL = { x: 790, y: 752, w: 720, h: 166, keys: [[1.5, 790, 1300, 0.08], [1.85, 790, 752, -0.01], [6.25, 790, 752, -0.01], [6.6, 790, 1300, 0.06]] };
  function cyState(keys, t) {
    const tq = Math.floor(t * 12 + 1e-6) / 12;
    if (tq <= keys[0][0]) return { x: keys[0][1], y: keys[0][2], r: keys[0][3], on: false };
    for (let i = 1; i < keys.length; i++) {
      const k = keys[i];
      if (tq <= k[0]) { const p = keys[i - 1], u = E.ioS((tq - p[0]) / (k[0] - p[0])); return { x: lerp(p[1], k[1], u), y: lerp(p[2], k[2], u), r: lerp(p[3], k[3], u), on: true }; }
    }
    const l = keys[keys.length - 1]; return { x: l[1], y: l[2], r: l[3], on: false };
  }
  /* --- specimen drawing (local coords, origin at centre) --- */
  function fernShape(g, sc, col, vein) {
    const N = 24, L = 640 * sc, pts = [];
    for (let i = 0; i <= 40; i++) { const s = i / 40; pts.push([Math.sin(s * 2.2) * 40 * sc, L / 2 - s * L]); }
    const at = s => { const f = s * 40, i = Math.min(39, Math.floor(f)), u = f - i; return [lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)]; };
    g.fillStyle = col;
    for (let k = 0; k < N; k++) {
      const s = 0.08 + k / N * 0.9, [x, y] = at(s), [x2, y2] = at(Math.min(1, s + 0.01));
      const ta = Math.atan2(y2 - y, x2 - x), side = k % 2 ? 1 : -1;
      const len = 170 * sc * Math.sin(Math.PI * (0.12 + 0.88 * s)) * (1 - s * 0.45) + 14 * sc;
      const pa = ta + side * (1.05 - s * 0.35);
      for (let j = 0; j < 9; j++) {
        const u = j / 9, px = x + Math.cos(pa) * len * u, py = y + Math.sin(pa) * len * u, rr = (15 * sc) * (1 - u * 0.75) * (0.7 + 0.3 * Math.sin(Math.PI * (0.1 + u)));
        [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(px + Math.cos(pa + sd * 1.25) * rr * 0.8, py + Math.sin(pa + sd * 1.25) * rr * 0.8, rr, rr * 0.55, pa + sd * 0.7, 0, TAU); g.fill(); });
      }
      g.strokeStyle = col; g.lineWidth = 3.2 * sc + 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(pa) * len * 0.95, y + Math.sin(pa) * len * 0.95); g.stroke();
    }
    g.strokeStyle = vein || col; g.lineWidth = 7 * sc + 1.5; g.lineCap = 'round';
    g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.lineTo(pts[0][0] - 4, L / 2 + 70 * sc); g.stroke();
  }
  function dichoShape(g, sc, col) {
    const r = rng(17 + Math.round(sc * 100));
    g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
    const br = (x, y, a, w, len, d) => {
      const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len, cx = (x + x2) / 2 + Math.cos(a + 1.57) * len * 0.12 * (r() - 0.5);
      g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(cx, (y + y2) / 2, x2, y2); g.stroke();
      if (d <= 0) { g.fillStyle = col; g.beginPath(); g.ellipse(x2, y2, w * 0.9, w * 1.4, a + 1.57, 0, TAU); g.fill(); return; }
      const sp = 0.28 + r() * 0.22;
      br(x2, y2, a - sp, w * 0.84, len * (0.82 + r() * 0.12), d - 1);
      br(x2, y2, a + sp, w * 0.84, len * (0.82 + r() * 0.12), d - 1);
    };
    g.lineWidth = 10 * sc; g.beginPath(); g.moveTo(0, 330 * sc); g.lineTo(0, 250 * sc); g.stroke();
    br(0, 250 * sc, -Math.PI / 2, 15 * sc, 92 * sc, 6);
  }
  function plumeShape(g, sc, col) {
    g.strokeStyle = col; g.lineCap = 'round';
    const axis = (x, y, a, len, w, d, seed) => {
      const n = Math.max(6, Math.round(len / 14)); let px = x, py = y, aa = a;
      for (let i = 0; i < n; i++) {
        const u = i / n, nx = px + Math.cos(aa) * len / n, ny = py + Math.sin(aa) * len / n;
        g.lineWidth = w * (1 - u * 0.7); g.beginPath(); g.moveTo(px, py); g.lineTo(nx, ny); g.stroke();
        if (d > 0 && i > 1) {
          const side = i % 2 ? 1 : -1, bl = len * (d > 1 ? 0.36 : 0.22) * Math.sin(Math.PI * (0.1 + 0.9 * u));
          axis(nx, ny, aa + side * (0.95 + 0.2 * Math.sin(i + seed)), bl, w * 0.55, d - 1, seed + i);
        } else if (d === 0 && i % 2) {
          g.lineWidth = Math.max(1, w * 0.5); g.beginPath(); g.moveTo(nx, ny); g.lineTo(nx + Math.cos(aa + 1.2) * 9 * sc, ny + Math.sin(aa + 1.2) * 9 * sc); g.stroke();
        }
        aa += Math.sin(i * 0.5 + seed) * 0.06; px = nx; py = ny;
      }
    };
    axis(0, 300 * sc, -Math.PI / 2 + 0.1, 600 * sc, 9 * sc, 2, 1);
  }
  function ginkgoShape(g, sc, blade, vein) {
    // fan-shaped leaf: wide wavy outer margin with a shallow central notch, veins radiating from the stalk
    g.save(); g.scale(sc, sc);
    const R = 270, A0 = -Math.PI / 2 - 1.22, A1 = -Math.PI / 2 + 1.22, by = 120;
    g.fillStyle = blade; g.beginPath(); g.moveTo(0, by);
    for (let i = 0; i <= 48; i++) {
      const u = i / 48, a = lerp(A0, A1, u), notch = Math.exp(-Math.pow((u - 0.5) / 0.025, 2)) * 55;
      const rr = R * Math.pow(Math.sin(Math.PI * (0.02 + 0.96 * u)), 0.12) * (1 - 0.1 * Math.cos(u * TAU)) - notch + Math.sin(u * 41) * 4;
      g.lineTo(Math.cos(a) * rr, by + Math.sin(a) * rr);
    }
    g.closePath(); g.fill();
    g.strokeStyle = vein; g.lineWidth = 1.5;
    for (let i = 0; i < 30; i++) { const a = lerp(A0 + 0.08, A1 - 0.08, i / 29), rr = R * 0.9 * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * i / 29)), 0.12); g.beginPath(); g.moveTo(0, by - 6); g.quadraticCurveTo(Math.cos(a) * 60, by + Math.sin(a) * 60, Math.cos(a) * rr, by + Math.sin(a) * rr); g.stroke(); }
    g.lineWidth = 6; g.strokeStyle = blade; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, by - 4); g.quadraticCurveTo(10, by + 55, -12, by + 105); g.stroke();
    g.restore();
  }
  function cyDrawSpec(g, sp, mode) {
    // mode: 'mask' (white = blocks light) or 'look' (pressed specimen colours)
    const sc = sp.s, M = mode === 'mask';
    if (sp.kind === 'fern') fernShape(g, sc, M ? '#fff' : '#5f7434', M ? '#fff' : '#4a5a26');
    else if (sp.kind === 'dicho') dichoShape(g, sc, M ? '#fff' : '#7a3a2c');
    else if (sp.kind === 'plume') plumeShape(g, sc, M ? '#fff' : '#8a2f3c');
    else ginkgoShape(g, sc, M ? 'rgba(255,255,255,0.64)' : '#b4a44a', M ? '#fff' : '#8a7a2e');
  }

  MG.film({
    id: 'cyanotype',
    dur: 10,
    poster: 9.5,
    fonts: [['400 120px "Pinyon Script"', 'Cyanotype'], ['400 30px "IM Fell English SC"', 'Impressions after Anna Atkins 1843·']],
    meta: {
      family: 'F', name: 'Cyanotype Motion', sub: 'Prussian-Blue Sun Prints', era: '1842 —',
      origin: 'Paper brushed with iron salts turns Prussian blue where sunlight reaches it; objects laid on top stay white once the print is washed in water. John Herschel invented the process in 1842 and Anna Atkins used it for the first book illustrated with photographs.',
      works: 'Photographs of British Algae: Cyanotype Impressions (Anna Atkins, 1843–53) · Cyanotypes of British and Foreign Ferns (Anna Atkins & Anne Dixon, 1853) · cyanotype photograms by Bertha Evelyn Jaques (c. 1906)',
      tech: ['Brush-coated emulsion', 'Contact exposure under glass', 'Water-wash development'],
      accent: '#1f4f9a',
      motionDNA: 'Slow stop-motion: specimens are nudged between exposures, the blue builds with the light, and the wash reveals the picture in one sweep.',
      visualDNA: 'White botanical silhouettes on deep Prussian blue, with brushed edges, uneven emulsion, paper fibre and faint ghosts of earlier positions.',
      transitions: 'Brush coat, stepped rearrangement, sun burst, water wash, dry-down',
      implementation: ['Sensitised paper + sunlight', 'Contact frame + water bath', 'Canvas 2D (procedural homage)'],
      reproducibility: 'Needs physical capture (this film is a procedural homage)',
      loopable: false,
    },
    setup() {
      const r = rng(1843);
      // per-pixel material fields on the half-res sheet grid
      const PAP = new Float32Array(CN), DK = new Float32Array(CN), CT = new Float32Array(CN), CD = new Float32Array(CN);
      const WT = new Float32Array(CN), DT = new Float32Array(CN), STR = new Float32Array(CN), CAU = new Float32Array(CN);
      const passes = CY.coat.map((t0, k) => ({ t0, yc: 112 + k * 86 + (r() - 0.5) * 10, w: 112 + r() * 14, x0: 52 + r() * 24, x1: 690 + r() * 26, tilt: (r() - 0.5) * 20 }));
      for (let y = 0, i = 0; y < CH; y++) for (let x = 0; x < CW; x++, i++) {
        const f1 = fbm2(x / 40, y / 40, 1, 4), f2 = fbm2(x / 7, y / 7, 2, 2);
        PAP[i] = 0.9 + f1 * 0.07 + f2 * 0.04 + (h2(x, y, 3) - 0.5) * 0.03;
        // deckled sheet edge
        const ed = Math.min(x, y, CW - 1 - x, CH - 1 - y) + (fbm2(x / 9, y / 9, 4, 2) - 0.5) * 6;
        DK[i] = clamp((ed - 1) / 2.5);
        // brushed sensitiser: four passes, streaky bristles, ragged dry-brush ends
        let ct = 99, cd = 0;
        for (const p of passes) {
          const yc = p.yc + p.tilt * (x / CW - 0.5) + (fbm2(x / 60, p.t0 * 9, 5, 2) - 0.5) * 18;
          const dy = Math.abs(y - yc) - p.w / 2 - (fbm2(x / 14, y / 30 + p.t0 * 7, 6, 2) - 0.5) * 22;
          const xs = p.x0 + (fbm2(y / 12, p.t0 * 5, 7, 2) - 0.5) * 40, xe = p.x1 + (fbm2(y / 6, p.t0 * 3, 8, 2) - 0.5) * 70;
          if (dy > 0 || x < xs || x > xe + 30) continue;
          const bristle = fbm2(x / 160, y / 1.6 + p.t0 * 50, 9, 2);
          const endFade = clamp((xe - x) / 70), dry = endFade < 1 ? (bristle > 1 - endFade * 0.9 ? 0 : 1) : 1;
          if (x > xe) continue;
          let d = (0.62 + bristle * 0.45) * dry * clamp(-dy / 6) + clamp(1 - (-dy) / 10) * 0.18 * dry;
          d *= 0.75 + 0.25 * clamp((x - xs) / 30);
          if (d <= 0.01) continue;
          ct = Math.min(ct, p.t0 + clamp((x - xs) / (p.x1 - p.x0)) * CY.coatDur);
          cd = Math.min(1.15, Math.max(cd, d) + (cd > 0 ? 0.12 : 0));
        }
        CT[i] = ct; CD[i] = cd;
        // wash front sweeps from the top; edges dry first
        WT[i] = CY.wash + (y / CH) * 0.62 + (x / CW - 0.5) * 0.12 + (fbm2(x / 50, y / 50, 10, 3) - 0.5) * 0.3;
        DT[i] = CY.dry + 0.25 * clamp(ed / 200) + (y / CH) * 0.25 + fbm2(x / 70, y / 70, 11, 3) * 0.4;
        STR[i] = fbm2(x / 2.5, y / 60, 12, 2);
        const wx = fbm2(x / 45, y / 45, 16, 2) * 9, wy = fbm2(x / 45 + 7, y / 45, 17, 2) * 9;
        const c1 = vn2(x / 22 + wx, y / 22 + wy, 18) - 0.5;
        CAU[i] = Math.pow(clamp(1 - Math.abs(c1) * 7), 3) * (0.4 + 0.6 * fbm2(x / 80, y / 80, 19, 2));
      }
      // specimen artwork: look (full res) and mask (half res)
      const specs = SPEC.map(sp => {
        const sz = Math.ceil(860 * Math.max(0.5, sp.s)), look = offscreen(sz, sz), gl = look.getContext('2d');
        gl.translate(sz / 2, sz / 2); cyDrawSpec(gl, sp, 'look');
        // pressed-specimen tone variation
        gl.setTransform(1, 0, 0, 1, 0, 0); gl.globalCompositeOperation = 'source-atop';
        const tg = gl.createLinearGradient(0, 0, sz, sz); tg.addColorStop(0, 'rgba(255,240,180,0.18)'); tg.addColorStop(1, 'rgba(40,20,0,0.25)');
        gl.fillStyle = tg; gl.fillRect(0, 0, sz, sz);
        const tmp = offscreen(sz, sz), gt = tmp.getContext('2d'); gt.translate(sz / 2, sz / 2); cyDrawSpec(gt, sp, 'mask');
        gt.setTransform(1, 0, 0, 1, 0, 0); gt.globalCompositeOperation = 'source-in'; gt.fillStyle = 'rgba(30,22,10,1)'; gt.fillRect(0, 0, sz, sz);
        const sh = offscreen(sz, sz), gs = sh.getContext('2d'); gs.filter = 'blur(6px)'; gs.drawImage(tmp, 0, 0); gs.filter = 'none';
        const mk = offscreen(sz / 2, sz / 2), gm = mk.getContext('2d'); gm.translate(sz / 4, sz / 4); gm.scale(0.5, 0.5); cyDrawSpec(gm, sp, 'mask');
        return { look, sh, mk, sz };
      });
      // the handwritten title on tracing paper
      const lab = offscreen(LABEL.w, LABEL.h), gl2 = lab.getContext('2d');
      gl2.fillStyle = 'rgba(250,248,240,0.55)'; MG.roughPoly(gl2, [[2, 4], [LABEL.w - 3, 1], [LABEL.w - 1, LABEL.h - 3], [3, LABEL.h - 1]], 3, 1.8, 30); gl2.fill();
      const ink = (g, col) => {
        g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        g.font = '400 100px "Pinyon Script"'; g.fillText('Cyanotype', LABEL.w / 2, 88);
        g.font = '400 28px "IM Fell English SC"'; if ('letterSpacing' in g) g.letterSpacing = '4px';
        g.fillText('Impressions · after Anna Atkins · 1843', LABEL.w / 2, 152); if ('letterSpacing' in g) g.letterSpacing = '0px';
      };
      ink(gl2, 'rgba(48,30,18,0.92)');
      const labM = offscreen(LABEL.w / 2, LABEL.h / 2), glm = labM.getContext('2d');
      glm.scale(0.5, 0.5); glm.fillStyle = 'rgba(255,255,255,0.3)'; glm.fillRect(0, 0, LABEL.w, LABEL.h); ink(glm, '#fff');
      // exposure poses: every distinct stop-motion configuration while the sun is out
      const [MK, gM] = canvasRW(CW, CH);
      const drawMask = t => {
        gM.setTransform(1, 0, 0, 1, 0, 0); gM.globalCompositeOperation = 'source-over'; gM.fillStyle = '#000'; gM.fillRect(0, 0, CW, CH);
        gM.globalCompositeOperation = 'lighter';
        SPEC.forEach((sp, k) => { const s = cyState(sp.keys, t); if (!s.on) return; gM.setTransform(Math.cos(s.r), Math.sin(s.r), -Math.sin(s.r), Math.cos(s.r), s.x / 2, s.y / 2); gM.drawImage(specs[k].mk, -specs[k].sz / 4, -specs[k].sz / 4); });
        const ls = cyState(LABEL.keys, t); if (ls.on) { gM.setTransform(Math.cos(ls.r), Math.sin(ls.r), -Math.sin(ls.r), Math.cos(ls.r), ls.x / 2, ls.y / 2); gM.drawImage(labM, -LABEL.w / 4, -LABEL.h / 4); }
        const d = gM.getImageData(0, 0, CW, CH).data, m = new Uint8Array(CN);
        for (let i = 0; i < CN; i++) m[i] = d[i * 4];
        return m;
      };
      const key = t => SPEC.map(sp => { const s = cyState(sp.keys, t); return s.on ? `${s.x | 0},${s.y | 0},${(s.r * 100) | 0}` : '-'; }).join('|');
      const poses = [];
      for (let f = Math.round(CY.sunOn * 12); f < Math.round(CY.sunOff * 12); f++) {
        const t = f / 12, kk = key(t);
        if (!poses.length || poses[poses.length - 1].key !== kk) poses.push({ t0: Math.max(t, CY.sunOn), key: kk, m: drawMask(t + 1e-3) });
      }
      for (let p = 0; p < poses.length; p++) poses[p].t1 = p + 1 < poses.length ? poses[p + 1].t0 : 99;
      let acc = new Float32Array(CN);
      poses.forEach(p => {
        p.cum = acc;
        const next = new Float32Array(CN), dl = cyLint(p.t1) - cyLint(p.t0);
        for (let i = 0; i < CN; i++) next[i] = acc[i] + dl * (1 - p.m[i] / 255);
        acc = next;
      });
      // the table: dark walnut, rendered once
      const [TB, gT] = canvasRW(960, 540), tid = gT.createImageData(960, 540);
      for (let y = 0, i = 0; y < 540; y++) for (let x = 0; x < 960; x++, i += 4) {
        const w = fbm2(x / 300, y / 9 + fbm2(x / 200, y / 40, 13, 2) * 4, 14, 3), ring = 0.5 + 0.5 * Math.sin(w * 22);
        const v = 0.55 + ring * 0.25 + fbm2(x / 3, y / 1.5, 15, 1) * 0.15;
        tid.data[i] = 78 * v; tid.data[i + 1] = 50 * v; tid.data[i + 2] = 32 * v; tid.data[i + 3] = 255;
      }
      gT.putImageData(tid, 0, 0);
      // paper fibres
      const FIB = offscreen(1500, 960), gf = FIB.getContext('2d');
      gf.fillStyle = '#808080'; gf.fillRect(0, 0, 1500, 960);
      for (let i = 0; i < 2600; i++) {
        const x = r() * 1500, y = r() * 960, a = r() * TAU, l = 8 + r() * 30, lite = r() > 0.5;
        gf.strokeStyle = lite ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.22)'; gf.lineWidth = 0.6 + r() * 0.8;
        gf.beginPath(); gf.moveTo(x, y); gf.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); gf.stroke();
      }
      const [O, gO] = canvasRW(CW, CH);
      return { PAP, DK, CT, CD, WT, DT, STR, CAU, specs, lab, poses, TB, FIB, O, gO, out: gO.createImageData(CW, CH) };
    },
    draw(c, t, W, H, st) {
      // table under raking light
      c.imageSmoothingEnabled = true;
      c.drawImage(st.TB, 0, 0, W, H);
      const sun = clamp(seg(t, CY.sunOn - 0.1, CY.sunOn + 0.25) * (1 - seg(t, CY.sunOff, CY.sunOff + 0.25))), burst = bump(t, CY.burst - 0.1, 0.35, 0.5, 0.6);
      // find the exposure pose
      const P = st.poses; let pi = -1;
      if (t >= CY.sunOn) { pi = 0; while (pi + 1 < P.length && P[pi + 1].t0 <= t) pi++; }
      const pose = pi >= 0 ? P[pi] : null, dl = pose ? cyLint(Math.min(t, pose.t1)) - cyLint(pose.t0) : 0;
      // per-pixel material
      const { PAP, DK, CT, CD, WT, DT, STR, CAU } = st, o = st.out.data;
      const cauOff = (Math.floor(t * 40) % CH) * CW;
      for (let i = 0, j = 0; i < CN; i++, j += 4) {
        const pap = PAP[i];
        let R = 240 * pap, G = 233 * pap, B = 214 * pap;
        const cd = t >= CT[i] ? CD[i] : 0;
        if (cd > 0) {
          const E2 = pose ? pose.cum[i] + dl * (1 - pose.m[i] / 255) : 0;
          const wet = clamp(1 - (t - CT[i]) / 1.1), lat = 1 - Math.exp(-E2 * 1.5);
          const w = clamp((t - WT[i]) / 0.45);
          // before the wash: yellow-green sensitiser darkening to slate where light reached it
          let sr = lerp(lerp(206, 222, wet), 84, lat), sg = lerp(lerp(198, 212, wet), 98, lat), sb = lerp(lerp(112, 92, wet), 108, lat);
          sr -= lat * lat * 20; sg -= lat * lat * 22; sb -= lat * lat * 10;
          const cc = clamp(cd * 0.92);
          let pr = lerp(R, sr, cc), pg = lerp(G, sg, cc), pb = lerp(B, sb, cc);
          if (w > 0) {
            // after: Prussian blue developed where exposed; yellow residue streams off in streaks
            const x0 = clamp((E2 - 0.9) / 2.1), bl = x0 * x0 * (3 - 2 * x0), dry = clamp((t - DT[i]) / 0.5);
            const dens = clamp(bl * (0.55 + 0.5 * cd)) ;
            const br = lerp(lerp(46, 20, dry), lerp(22, 9, dry), dens * dens), bg = lerp(lerp(118, 58, dry), lerp(66, 32, dry), dens * dens), bb = lerp(lerp(196, 128, dry), lerp(150, 84, dry), dens * dens);
            const wr = 232 * pap, wg = 236 * pap, wb = 232 * pap;
            let qr = lerp(wr, br, dens), qg = lerp(wg, bg, dens), qb = lerp(wb, bb, dens);
            const res = clamp(1 - (t - WT[i]) / (0.25 + 0.9 * STR[i])) * (1 - bl * 0.6);
            qr = lerp(qr, 214, res * 0.55 * cc); qg = lerp(qg, 206, res * 0.55 * cc); qb = lerp(qb, 96, res * 0.55 * cc);
            const wetS = w * (1 - dry);
            const spec = CAU[(i + cauOff) % CN] * wetS * 38;
            qr = qr * (1 - wetS * 0.1) + spec; qg = qg * (1 - wetS * 0.06) + spec; qb = qb + spec * 0.9;
            pr = lerp(pr, qr, w); pg = lerp(pg, qg, w); pb = lerp(pb, qb, w);
            // the water's leading edge
            const fe = Math.exp(-Math.pow((t - WT[i]) / 0.035, 2)) * 70; pr += fe; pg += fe; pb += fe;
          } else if (wet > 0) { const gl = wet * wet * (STR[i] * 22 + CAU[i] * 10); pr += gl; pg += gl; pb += gl * 0.6; }
          R = pr; G = pg; B = pb;
        } else if (t >= WT[i]) {
          const w = clamp((t - WT[i]) / 0.45), wetS = w * (1 - clamp((t - DT[i]) / 0.5));
          R *= 1 - wetS * 0.08; G *= 1 - wetS * 0.06; B *= 1 - wetS * 0.03;
          const fe = Math.exp(-Math.pow((t - WT[i]) / 0.035, 2)) * 50; R += fe; G += fe; B += fe;
        }
        o[j] = R; o[j + 1] = G; o[j + 2] = B; o[j + 3] = DK[i] * 255;
      }
      st.gO.putImageData(st.out, 0, 0);
      // sheet on the table
      c.save();
      c.translate(SHX, SHY); c.rotate(SROT);
      c.fillStyle = 'rgba(10,6,2,0.55)'; c.filter = 'blur(14px)'; c.fillRect(-750 + 14, -480 + 20, 1500, 960); c.filter = 'none';
      c.translate(-750, -480);
      c.drawImage(st.O, 0, 0, 1500, 960);
      c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.55; c.drawImage(st.FIB, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      // the hake brush laying the sensitiser
      CY.coat.forEach((t0, k) => {
        const u = seg(t, t0 - 0.02, t0 + CY.coatDur + 0.02); if (u <= 0 || u >= 1) return;
        const bx = lerp(40, 1460, u) + 30, by = 224 + k * 172;
        c.save(); c.translate(bx, by); c.rotate(0.05 + Math.sin(u * 6) * 0.03);
        c.fillStyle = 'rgba(20,12,4,0.4)'; c.filter = 'blur(12px)';
        c.beginPath(); c.moveTo(10, -120); c.lineTo(80, -120); c.lineTo(80, -40); c.lineTo(470, -20); c.lineTo(470, 40); c.lineTo(80, 60); c.lineTo(80, 130); c.lineTo(10, 130); c.closePath(); c.fill(); c.filter = 'none';
        // bristles: goat hair, wet at the tip
        const bg2 = c.createLinearGradient(-20, 0, 40, 0); bg2.addColorStop(0, '#b8b45a'); bg2.addColorStop(0.35, '#e8dcb4'); bg2.addColorStop(1, '#f2ead2');
        c.fillStyle = bg2; c.beginPath(); c.moveTo(-18, -124); c.quadraticCurveTo(-26, 0, -18, 124); c.lineTo(40, 120); c.lineTo(40, -120); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(120,110,60,0.35)'; c.lineWidth = 1;
        for (let q = -118; q < 120; q += 7) { c.beginPath(); c.moveTo(-16 - Math.abs(q) * 0.03, q); c.lineTo(40, q + (hash(q) - 0.5) * 3); c.stroke(); }
        // brass-stitched wooden stock and tapering handle
        c.fillStyle = '#8a5a34'; MG.rrect(c, 38, -128, 46, 256, 6); c.fill();
        c.fillStyle = '#b8955a'; [-100, -40, 20, 80].forEach(q => { c.beginPath(); c.arc(61, q, 4, 0, TAU); c.fill(); });
        const hg = c.createLinearGradient(0, -60, 0, 60); hg.addColorStop(0, '#9a6a3e'); hg.addColorStop(0.45, '#d29c62'); hg.addColorStop(1, '#6e4626');
        c.fillStyle = hg; c.beginPath(); c.moveTo(82, -46); c.quadraticCurveTo(110, -36, 450, -26); c.quadraticCurveTo(478, 0, 450, 26); c.quadraticCurveTo(110, 36, 82, 46); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(60,34,14,0.35)'; c.lineWidth = 1.2;
        for (let q = -3; q <= 3; q++) { c.beginPath(); c.moveTo(90, q * 12); c.quadraticCurveTo(250, q * 8, 450, q * 6); c.stroke(); }
        c.restore();
      });
      // specimens and title strip lying on the paper (stepped like stop-motion)
      const tq = t;
      const fq = Math.floor(t * 12);
      const drawLaid = (s, img, w2, h2_, shImg, k) => {
        // stop-motion handling: each 12 fps step the specimen sits a hair differently
        c.save(); c.translate(s.x + (h2(k, fq, 1) - 0.5) * 2.4, s.y + (h2(k, fq, 2) - 0.5) * 2.4); c.rotate(s.r + (h2(k, fq, 3) - 0.5) * 0.004);
        if (shImg) { c.globalAlpha = 0.35 + sun * 0.35; c.drawImage(shImg, -w2 / 2 + 6 + sun * 10, -h2_ / 2 + 8 + sun * 12); c.globalAlpha = 1; }
        c.drawImage(img, -w2 / 2, -h2_ / 2);
        c.restore();
      };
      SPEC.forEach((sp, k) => { const s = cyState(sp.keys, tq); if (s.on) drawLaid(s, st.specs[k].look, st.specs[k].sz, st.specs[k].sz, st.specs[k].sh, k); });
      const ls = cyState(LABEL.keys, tq); if (ls.on) drawLaid(ls, st.lab, LABEL.w, LABEL.h, null, 9);
      // contact-printing glass
      const glass = clamp(seg(t, 1.86, 1.92) * (1 - seg(t, 6.0, 6.08)));
      if (glass > 0) {
        c.globalAlpha = glass;
        c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 2; c.strokeRect(-20, -20, 1540, 1000);
        c.strokeStyle = 'rgba(160,200,190,0.14)'; c.lineWidth = 8; c.strokeRect(-25, -25, 1550, 1010);
        const gx = 300 + t * 90, gg = c.createLinearGradient(gx, 0, gx + 500, 960);
        gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.45, `rgba(255,255,250,${0.1 + sun * 0.12})`); gg.addColorStop(0.55, 'rgba(255,255,250,0.03)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = gg; c.fillRect(-20, -20, 1540, 1000);
        c.globalAlpha = 1;
      }
      c.restore();
      // light: cool shade, warm sun, the sun bursting out
      c.save();
      c.globalCompositeOperation = 'soft-light';
      c.fillStyle = `rgba(255,${200 + 30 * sun | 0},${120 + 40 * (1 - sun) | 0},${0.25 + sun * 0.35 + burst * 0.3})`; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'screen';
      const sg = c.createRadialGradient(260, 80, 50, 260, 80, 1400);
      sg.addColorStop(0, `rgba(255,226,160,${sun * 0.28 + burst * 0.35})`); sg.addColorStop(1, 'rgba(255,200,120,0)');
      c.fillStyle = sg; c.fillRect(0, 0, W, H);
      if (sun < 1) { c.globalCompositeOperation = 'multiply'; c.fillStyle = `rgba(150,165,190,${(1 - sun) * (t < CY.sunOn ? 0.35 : 0.22)})`; c.fillRect(0, 0, W, H); }
      c.restore();
      grain(c, W, H, t, 0.06, 'overlay');
      vignette(c, W, H, 0.6, '12,8,4');
    },
    score(A) {
      // coating: four wet strokes of the hake brush
      CY.coat.forEach((t0, k) => {
        A.noise(t0, { type: 'bandpass', f: 1500 + k * 120, f2: 2600, sweep: CY.coatDur, q: 0.8, dur: CY.coatDur + 0.08, g: 0.16, swell: 0.4, pan: -0.5 + k * 0.05, rev: 0.15 });
        A.noise(t0, { type: 'lowpass', f: 600, dur: CY.coatDur, g: 0.06, swell: 0.5 });
      });
      const cel = (t, m, g = 0.07, pan = 0) => A.bell(t, midi(m), { g, dur: 1.6, rev: 0.6, pan, ratios: [1, 3.01, 5.4] });
      const pad = (t, ns, d, g = 0.022) => A.chord(t, ns, { type: 'triangle', dur: d, g, a: 0.6, hold: true, rel: 0.8, lp: 1800, rev: 0.6, width: 1, spread: 6 });
      pad(0.1, [50, 57, 62, 66], 1.8, 0.016);
      // specimens stepped in: a soft tick for every stop-motion step, a celesta note as each settles
      const ticks = new Set();
      [...SPEC, LABEL].forEach((sp, k) => {
        for (let i = 1; i < sp.keys.length; i++) {
          const [ta] = sp.keys[i - 1], [tb] = sp.keys[i];
          const moving = sp.keys[i - 1][1] !== sp.keys[i][1] || sp.keys[i - 1][3] !== sp.keys[i][3];
          if (!moving) continue;
          for (let f = Math.ceil(ta * 12); f <= Math.floor(tb * 12); f++) ticks.add(f);
          if (tb < 6) cel(tb, [74, 76, 78, 81, 83, 86, 88][(k + i) % 7], 0.05, (sp.keys[i][1] / 1500 - 0.5) * 0.8);
        }
      });
      [...ticks].sort((a, b) => a - b).forEach(f => A.noise(f / 12, { type: 'bandpass', f: 3000 + hash(f) * 1500, q: 3, dur: 0.018, g: 0.05, pan: (hash(f + 1) - 0.5) * 0.8 }));
      // glass on; sun out
      A.bell(1.88, midi(96), { g: 0.035, dur: 1.2, rev: 0.5, ratios: [1, 2.7, 5.2] });
      A.osc(1.88, { f: 140, dur: 0.12, g: 0.08, type: 'triangle' });
      pad(1.95, [50, 57, 62, 64, 69], 2.8, 0.024);
      [[2.4, 0.3], [3.1, -0.4], [3.9, 0.5]].forEach(([t, p]) => { for (let i = 0; i < 3; i++) A.osc(t + i * 0.09, { f: 3800 + hash(t + i) * 900, f2: 5200, glide: 0.05, dur: 0.07, g: 0.012, pan: p }); });
      pad(4.7, [43, 50, 55, 59, 62], 0.4, 0.02);
      // the sun bursts through: the blue races in
      A.riser(4.3, 0.6, { g: 0.06, f: 147 });
      A.chord(CY.burst, [50, 57, 62, 66, 69, 74], { type: 'sine', dur: 2.2, g: 0.03, a: 0.08, rev: 0.8, width: 1 });
      [86, 90, 93].forEach((m, i) => A.bell(CY.burst + i * 0.08, midi(m), { g: 0.04, dur: 2, rev: 0.7, pan: (i - 1) * 0.4 }));
      pad(5.2, [47, 54, 59, 62, 66], 0.9, 0.022);
      // sun covered, glass lifted
      A.bell(6.02, midi(93), { g: 0.03, dur: 1, rev: 0.5, ratios: [1, 2.7, 5.2] });
      pad(6.1, [45, 52, 57, 61, 64], 0.5, 0.02);
      // the wash
      A.noise(CY.wash - 0.05, { type: 'lowpass', f: 500, f2: 2200, sweep: 0.5, dur: 1.6, g: 0.22, swell: 0.25, rev: 0.4 });
      A.noise(CY.wash, { type: 'bandpass', f: 900, q: 0.6, dur: 1.2, g: 0.08, swell: 0.3, pan: 0.3 });
      for (let k = 0; k < 22; k++) { const t = CY.wash + 0.1 + hash(k * 3.1) * 1.2; A.osc(t, { f: 600 + hash(k) * 900, f2: 1400 + hash(k + 1) * 1200, glide: 0.04, dur: 0.06, g: 0.025, pan: (hash(k + 2) - 0.5) * 1.2 }); }
      [62, 66, 69, 74, 78, 81].forEach((m, i) => cel(CY.wash + 0.15 + i * 0.13, m, 0.06, (i - 2.5) * 0.2));
      pad(CY.wash + 0.1, [38, 45, 50, 54, 57, 62], 1.3, 0.026);
      // dry-down and title
      pad(CY.dry + 0.1, [43, 50, 55, 59, 62], 0.9, 0.022);
      pad(8.6, [38, 45, 50, 54, 57, 61, 66], 1.4, 0.028);
      [74, 78, 81, 86].forEach((m, i) => cel(8.62 + i * 0.12, m, 0.06, (i - 1.5) * 0.3));
      A.bell(8.62, midi(62), { g: 0.05, dur: 2.2, rev: 0.7 });
    },
  });
})();
