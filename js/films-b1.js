/* Batch b1 — Isometric, Monoline line-art, Bauhaus geometry. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, font, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Jost:wght@500;800&display=block');

  const hexRGB = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixRGB = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const css = (a, al = 1) => `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${al})`;
  const poly = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
  const after = (t, a) => (t >= a ? 1 : 0);

  /* ================================================================
     ISOMETRIC — a city on an 8×8 lot assembles itself, day into dusk
     ================================================================ */
  const IS = 80, OX = 960, OY = 600, C30 = Math.cos(Math.PI / 6), FH = 0.42;
  const P = (x, y, z = 0) => [OX + (x - y) * C30 * IS, OY + (x + y - 8) * 0.5 * IS - z * IS];
  const ICOL = { coral: '#f07a5f', cream: '#f6e8d2', teal: '#2f9a92', mustard: '#f3b847', navy: '#3a4a82', pink: '#f2a7a1' };
  const IRGB = {}; Object.keys(ICOL).forEach(k => (IRGB[k] = hexRGB(ICOL[k])));
  const GRASS = [hexRGB('#a9cf90'), hexRGB('#9dc685')], PAVE = hexRGB('#ebe0cc'), ROAD = hexRGB('#3c3f5c');
  const EARTH = hexRGB('#c78c63'), LEAF = hexRGB('#5d9c58'), LEAF2 = hexRGB('#86c06c'), PINE = hexRGB('#3f8a63'), WATER = hexRGB('#6cc2d4');
  const LIT = [255, 210, 120], GLASS = [40, 48, 88];
  let NK = 0; // dusk amount for the frame being drawn
  const NT = [0.54, 0.52, 0.8];
  const tint = (rgb, k = 1) => [rgb[0] * k * lerp(1, NT[0], NK), rgb[1] * k * lerp(1, NT[1], NK), rgb[2] * k * lerp(1, NT[2], NK)];
  const sc = (rgb, k = 1, a = 1) => css(tint(rgb, k), a);

  const BLD_RAW = [
    [3, 0, 1, 1, 3, 'teal'], [5, 0, 1, 1, 4, 'navy'], [6, 0, 2, 1, 2, 'coral'],
    [0, 1, 1, 1, 2, 'mustard'], [6, 1, 1, 1, 5, 'cream'],
    [0, 2, 1, 1, 3, 'pink'], [2, 2, 1, 1, 2, 'coral'], [3, 2, 1, 1, 1, 'cream'], [5, 2, 1, 1, 2, 'teal'], [7, 2, 1, 1, 3, 'mustard'],
    [1, 4, 1, 1, 3, 'teal'], [2, 4, 1, 1, 2, 'coral'],
    [0, 5, 1, 1, 2, 'cream'], [2, 5, 2, 1, 4, 'navy'], [7, 5, 1, 1, 2, 'coral'],
    [0, 6, 1, 1, 4, 'mustard'], [1, 6, 1, 1, 1, 'teal'], [3, 6, 1, 1, 2, 'pink'], [6, 6, 1, 1, 3, 'teal'],
    [1, 7, 1, 1, 2, 'coral'], [2, 7, 1, 1, 1, 'cream'], [5, 7, 1, 1, 2, 'mustard'], [7, 7, 1, 1, 1, 'navy'],
  ];
  const idist = (x, y) => Math.hypot(x - 2.5, y - 4.5);
  const BLD = BLD_RAW.map(([x, y, w, d, f, col], i) => ({
    cx: x, cy: y, w, d, x0: x + 0.13, y0: y + 0.13, x1: x + w - 0.13, y1: y + d - 0.13, f, rgb: IRGB[col],
    hero: x === 2 && y === 4, dist: idist(x + w / 2, y + d / 2), seed: i * 7.31 + 1, roof: hash(i * 3.7 + 2),
  }));
  {
    const rest = BLD.filter(b => !b.hero).sort((a, b) => a.dist - b.dist);
    rest.forEach((b, i) => { const s = 2.12 + i * 0.11; b.land = Array.from({ length: b.f }, (_, k) => s + k * 0.075); });
    const h = BLD.find(b => b.hero); h.land = [0.35, 2.0];
  }
  const BLD_LANDS = BLD.map(b => b.land[b.land.length - 1]).sort((a, b) => a - b);
  const TREES = [[0, 0], [3, 1], [5, 1], [7, 1], [1, 2], [6, 2], [0, 4], [3, 4], [7, 4], [1, 5], [2, 6], [5, 6], [7, 6], [0, 7], [3, 7], [6, 7]]
    .map(([x, y], i) => ({ x: x + 0.5, y: y + 0.5, h: 0.5 + hash(i * 3.1) * 0.3, r: 0.25 + hash(i * 5.7) * 0.07, pine: hash(i * 9.2) > 0.62, dist: idist(x + 0.5, y + 0.5) }))
    .sort((a, b) => a.dist - b.dist);
  TREES.forEach((tr, j) => (tr.t0 = 3.25 + j * 0.09));
  const TW_N = 9, TW_FH = 0.36;
  const twInset = k => (k < 5 ? 0.14 : k < 7 ? 0.32 : 0.5);
  const twLand = k => 5.15 + 1.3 * Math.pow(k / (TW_N - 1), 0.62);
  const CARS = [
    { ax: 0, lane: 3.7, dir: 1, sp: 1.5, t0: 4.55, col: hexRGB('#f3b847') },
    { ax: 1, lane: 4.3, dir: 1, sp: 1.35, t0: 4.75, col: hexRGB('#f07a5f') },
    { ax: 0, lane: 3.3, dir: -1, sp: 1.25, t0: 4.95, col: hexRGB('#f6efe2') },
    { ax: 1, lane: 4.7, dir: -1, sp: 1.55, t0: 5.3, col: hexRGB('#2f9a92') },
    { ax: 0, lane: 3.7, dir: 1, sp: 1.5, t0: 6.6, col: hexRGB('#f2a7a1') },
    { ax: 1, lane: 4.3, dir: 1, sp: 1.35, t0: 7.3, col: hexRGB('#f6efe2') },
  ];
  function carPos(car, t) {
    if (t < car.t0) return null;
    const s = ((t - car.t0) * car.sp) % 9.4;
    const a = car.dir > 0 ? -0.7 + s : 8.7 - s;
    const vis = clamp(Math.min(a + 0.2, 8.2 - a) * 2.5);
    if (vis <= 0) return null;
    return { a, vis };
  }
  function hull(pts) {
    pts = pts.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function castShadow(s, x0, y0, x1, y1, h, L) {
    if (h <= 0.001) return;
    const b = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    const pts = hull(b.concat(b.map(p => [p[0] + L[0] * h, p[1] + L[1] * h])));
    poly(s, pts.map(p => P(p[0], p[1], 0)));
    s.fill();
  }
  // a box with optional windows; faces: left (y=y1, lit), right (x=x1, shade), top
  function isoBox(c, x0, y0, x1, y1, z0, z1, rgb, o = {}) {
    const A = P(x0, y1, z0), B = P(x1, y1, z0), Cc = P(x1, y0, z0), A2 = P(x0, y1, z1), B2 = P(x1, y1, z1), C2 = P(x1, y0, z1), D2 = P(x0, y0, z1);
    poly(c, [A, B, B2, A2]); c.fillStyle = sc(rgb, 0.87); c.fill();
    poly(c, [B, Cc, C2, B2]); c.fillStyle = sc(rgb, 0.67); c.fill();
    if (o.win) o.win(x0, y0, x1, y1, z0, z1);
    if (o.seam) { c.strokeStyle = `rgba(30,20,50,${0.14})`; c.lineWidth = 1; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineTo(Cc[0], Cc[1]); c.stroke(); }
    poly(c, [D2, C2, B2, A2]); c.fillStyle = sc(rgb, o.topK || 1); c.fill();
    if (o.roof) {
      const i = 0.08, zr = z1;
      poly(c, [P(x0 + i, y0 + i, zr), P(x1 - i, y0 + i, zr), P(x1 - i, y1 - i, zr), P(x0 + i, y1 - i, zr)]);
      c.fillStyle = sc(rgb, 0.9); c.fill();
    }
    c.strokeStyle = `rgba(255,250,240,${0.42 * (1 - NK * 0.75)})`; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(A2[0], A2[1]); c.lineTo(B2[0], B2[1]); c.lineTo(C2[0], C2[1]); c.stroke();
  }
  function winQuad(c, face, x0, y0, x1, y1, ua, ub, za, zb, col) {
    const pt = face === 'L' ? (u, z) => P(lerp(x0, x1, u), y1, z) : (u, z) => P(x1, lerp(y1, y0, u), z);
    poly(c, [pt(ua, za), pt(ub, za), pt(ub, zb), pt(ua, zb)]);
    c.fillStyle = col; c.fill();
  }
  const winCol = (rgb, k, L) => css(mixRGB(tint(mixRGB(rgb.map(v => v * k), GLASS, 0.55)), LIT, L));
  function litAmt(t, s) {
    if (NK <= 0 || hash(s) > 0.74) return 0;
    const on = 6.55 + hash(s * 1.9 + 3) * 1.15;
    return seg(t, on, on + 0.08) * (0.75 + 0.25 * hash(s * 3.3));
  }
  function floorState(t, L) {
    const T0 = L - 0.26;
    if (t < T0) return null;
    if (t < L) { const p = (t - T0) / 0.26; return { dz: 5.2 * (1 - p * p), hs: 1, a: clamp(p * 3.5), land: false }; }
    const d = t - L;
    return { dz: 0, hs: 1 - 0.3 * Math.exp(-d * 14) * Math.cos(d * 32), a: 1, land: true };
  }
  function drawBuilding(c, b, t) {
    let z = 0;
    for (let k = 0; k < b.f; k++) {
      const s = floorState(t, b.land[k]);
      if (!s) break;
      const h = FH * s.hs, z0 = z + s.dz, top = k === b.f - 1;
      c.globalAlpha = s.a;
      const nL = Math.max(1, Math.round((b.x1 - b.x0) * 2.4)), nR = Math.max(1, Math.round((b.y1 - b.y0) * 2.4));
      isoBox(c, b.x0, b.y0, b.x1, b.y1, z0, z0 + h, b.rgb, {
        seam: k > 0, roof: top,
        win: (x0, y0, x1, y1, za, zb) => {
          const wa = lerp(za, zb, 0.3), wb = lerp(za, zb, 0.78);
          for (let i = 0; i < nL; i++) winQuad(c, 'L', x0, y0, x1, y1, (i + 0.24) / nL, (i + 0.76) / nL, wa, wb, winCol(b.rgb, 0.87, litAmt(t, b.seed + k * 3.3 + i * 7.1)));
          for (let i = 0; i < nR; i++) winQuad(c, 'R', x0, y0, x1, y1, (i + 0.24) / nR, (i + 0.76) / nR, wa, wb, winCol(b.rgb, 0.67, litAmt(t, b.seed + k * 3.3 + i * 5.3 + 40)));
        },
      });
      if (top && s.land && b.roof > 0.45) {
        const mx = (b.x0 + b.x1) / 2 + 0.08, my = (b.y0 + b.y1) / 2 - 0.05, zz = z0 + h;
        isoBox(c, mx - 0.13, my - 0.11, mx + 0.13, my + 0.11, zz, zz + 0.13 * seg(t, b.land[k] + 0.05, b.land[k] + 0.2), IRGB.cream, {});
      }
      c.globalAlpha = 1;
      if (!s.land) break;
      z += h;
    }
  }
  function stackHeight(b, t) {
    let z = 0;
    for (let k = 0; k < b.f; k++) { const s = floorState(t, b.land[k]); if (!s || !s.land) break; z += FH * s.hs; }
    return z;
  }
  function drawTower(c, t) {
    let z = 0;
    for (let k = 0; k < TW_N; k++) {
      const s = floorState(t, twLand(k));
      if (!s) break;
      const i = twInset(k), h = TW_FH * s.hs, z0 = z + s.dz;
      const x0 = 1 + i, x1 = 3 - i, y0 = 0 + i, y1 = 2 - i, top = k === TW_N - 1 || twInset(k + 1) !== i;
      c.globalAlpha = s.a;
      isoBox(c, x0, y0, x1, y1, z0, z0 + h, IRGB.cream, {
        seam: true, roof: top,
        win: (a0, b0, a1, b1, za, zb) => {
          const wa = lerp(za, zb, 0.22), wb = lerp(za, zb, 0.8), n = Math.round((a1 - a0) * 3);
          for (let j = 0; j < n; j++) {
            winQuad(c, 'L', a0, b0, a1, b1, (j + 0.12) / n, (j + 0.88) / n, wa, wb, css(mixRGB(tint(mixRGB(IRGB.teal, [20, 60, 70], 0.2)), LIT, litAmt(t, 900 + k * 9.1 + j * 1.7))));
            winQuad(c, 'R', a0, b0, a1, b1, (j + 0.12) / n, (j + 0.88) / n, wa, wb, css(mixRGB(tint(mixRGB(IRGB.teal, [10, 40, 60], 0.45)), LIT, litAmt(t, 700 + k * 9.1 + j * 2.3))));
          }
        },
      });
      c.globalAlpha = 1;
      if (!s.land) return;
      z += h;
    }
    // antenna + beacon
    const ant = E.outB(seg(t, 6.45, 6.75), 2);
    if (ant > 0) {
      const b0 = P(2, 1, z), b1 = P(2, 1, z + 0.75 * ant);
      c.strokeStyle = sc([60, 60, 80]); c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.moveTo(b0[0], b0[1]); c.lineTo(b1[0], b1[1]); c.stroke();
      const blink = 0.5 + 0.5 * Math.cos((t - 6.75) * TAU * 1.1);
      if (t > 6.75) {
        const g = c.createRadialGradient(b1[0], b1[1], 0, b1[0], b1[1], 26);
        g.addColorStop(0, `rgba(255,80,60,${0.75 * blink})`); g.addColorStop(1, 'rgba(255,80,60,0)');
        c.fillStyle = g; c.fillRect(b1[0] - 26, b1[1] - 26, 52, 52);
      }
      c.fillStyle = '#ff5a48'; c.beginPath(); c.arc(b1[0], b1[1], 4, 0, TAU); c.fill();
    }
  }
  function towerHeight(t) {
    let z = 0;
    for (let k = 0; k < TW_N; k++) { const s = floorState(t, twLand(k)); if (!s || !s.land) break; z += TW_FH * s.hs; }
    return z;
  }
  function drawTree(c, tr, t) {
    const s = spring(t - tr.t0, 3, 0.42);
    if (s <= 0.001) return;
    const base = P(tr.x, tr.y, 0), hh = tr.h * s;
    c.strokeStyle = sc([120, 84, 60]); c.lineWidth = 4; c.lineCap = 'round';
    const top = P(tr.x, tr.y, hh * 0.55);
    c.beginPath(); c.moveTo(base[0], base[1]); c.lineTo(top[0], top[1]); c.stroke();
    const r = tr.r * IS * s;
    if (tr.pine) {
      const ap = P(tr.x, tr.y, hh + 0.35 * s), bl = P(tr.x, tr.y, hh * 0.3);
      c.beginPath(); c.moveTo(ap[0], ap[1]); c.lineTo(bl[0] - r, bl[1]); c.quadraticCurveTo(bl[0], bl[1] + r * 0.6, bl[0] + r, bl[1]); c.closePath();
      c.fillStyle = sc(PINE, 0.82); c.fill();
      c.beginPath(); c.moveTo(ap[0], ap[1]); c.lineTo(bl[0] - r, bl[1]); c.quadraticCurveTo(bl[0] - r * 0.4, bl[1] + r * 0.5, bl[0], bl[1] + r * 0.58); c.closePath();
      c.fillStyle = sc(PINE, 1.12); c.fill();
    } else {
      const ce = P(tr.x, tr.y, hh);
      c.fillStyle = sc(LEAF, 0.85); c.beginPath(); c.arc(ce[0], ce[1], r, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.arc(ce[0], ce[1], r, 0, TAU); c.clip();
      c.fillStyle = sc(LEAF2, 1); c.beginPath(); c.arc(ce[0] - r * 0.32, ce[1] - r * 0.3, r * 0.92, 0, TAU); c.fill();
      c.restore();
    }
  }
  function drawCar(c, car, t, p) {
    const s = p.vis, L = 0.25 * s, Wd = 0.13 * s;
    const [x0, y0, x1, y1] = car.ax === 0 ? [p.a - L, car.lane - Wd, p.a + L, car.lane + Wd] : [car.lane - Wd, p.a - L, car.lane + Wd, p.a + L];
    isoBox(c, x0, y0, x1, y1, 0.03, 0.03 + 0.14 * s, car.col, {});
    const back = -car.dir * 0.05, cl = 0.13 * s, cw = 0.105 * s;
    const [u0, v0, u1, v1] = car.ax === 0 ? [p.a + back - cl, car.lane - cw, p.a + back + cl, car.lane + cw] : [car.lane - cw, p.a + back - cl, car.lane + cw, p.a + back + cl];
    isoBox(c, u0, v0, u1, v1, 0.03 + 0.14 * s, 0.03 + 0.25 * s, mixRGB(car.col, GLASS, 0.5), {});
    if (NK > 0.05) {
      const f = car.dir * (L + 0.01), hx = car.ax === 0 ? [p.a + f, car.lane] : [car.lane, p.a + f];
      const q = P(hx[0], hx[1], 0.1);
      c.fillStyle = `rgba(255,236,180,${NK})`; c.beginPath(); c.arc(q[0], q[1], 3.2, 0, TAU); c.fill();
    }
  }
  function headBeam(c, car, p) {
    const f = car.dir, a = p.a + f * 0.25, len = 1.0, w0 = 0.09, w1 = 0.3;
    const pts = car.ax === 0
      ? [[a, car.lane - w0], [a + f * len, car.lane - w1], [a + f * len, car.lane + w1], [a, car.lane + w0]]
      : [[car.lane - w0, a], [car.lane - w1, a + f * len], [car.lane + w1, a + f * len], [car.lane + w0, a]];
    poly(c, pts.map(q => P(q[0], q[1], 0.01)));
    c.fillStyle = `rgba(255,222,150,${0.24 * NK * p.vis})`; c.fill();
  }
  function groundQuad(c, x0, y0, x1, y1, z, fill) { poly(c, [P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)]); c.fillStyle = fill; c.fill(); }

  MG.film({
    id: 'isometric',
    dur: 10,
    poster: 9.4,
    fonts: [['900 62px Archivo', 'ISOMETRIC'], ['900 62px "Noto Sans SC"', '等距'], ['400 17px "JetBrains Mono"', 'BLOCKS 0123456789/·°×AXONOMETRIC LOT']],
    meta: {
      cn: '等距', en: 'Isometric', era: '1980s —',
      origin: '源自工程制图的等轴测投影，经 1982 年世嘉街机《Zaxxon》进入电子游戏，2010 年代成为解释型动画与信息图的通用语言',
      works: '代表作：世嘉《Zaxxon》(1982)、ustwo《纪念碑谷 Monument Valley》(2014)、eBoy 等距像素城市海报系列',
      tech: ['30° 等轴测投影（2:1 菱形网格）', '方块按节拍落下、挤压回弹', '三面明暗 + 长投影', '无透视的摄像机拉远'],
      accent: '#f07a5f',
    },
    setup() { const sh = offscreen(1920, 1080); return { sh, sx: sh.getContext('2d') }; },
    draw(c, t, W, H, st) {
      NK = E.ioS(seg(t, 6.45, 7.7));
      // sky
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, css(mixRGB([245, 234, 217], [44, 44, 92], NK)));
      g.addColorStop(0.55, css(mixRGB([240, 225, 204], [139, 102, 150], NK)));
      g.addColorStop(1, css(mixRGB([234, 214, 190], [232, 152, 128], NK)));
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      if (NK > 0) {
        const r = rng(5);
        for (let i = 0; i < 60; i++) {
          const x = r() * W, y = r() * H * 0.5, tw = 0.6 + 0.4 * Math.sin(t * 3 + i);
          c.fillStyle = `rgba(255,246,230,${NK * tw * (0.25 + r() * 0.6) * (1 - y / (H * 0.5))})`;
          c.fillRect(x, y, 2, 2);
        }
      }
      // sun sinking into dusk
      {
        const sx = lerp(1560, 1640, NK), sy = lerp(250, 700, NK), sr = 130;
        const sg = c.createRadialGradient(sx, sy, sr * 0.6, sx, sy, sr * 3);
        sg.addColorStop(0, css(mixRGB([255, 247, 228], [255, 160, 100], NK), 0.55));
        sg.addColorStop(1, css(mixRGB([255, 247, 228], [255, 160, 100], NK), 0));
        c.fillStyle = sg; c.fillRect(0, 0, W, H);
        c.fillStyle = css(mixRGB([255, 249, 236], [255, 150, 98], NK), 0.95);
        c.beginPath(); c.arc(sx, sy, sr, 0, TAU); c.fill();
      }
      // camera: tight on the first block, pull out to the whole lot
      const fp = E.ioC(seg(t, 0.55, 3.3));
      const hero = P(2.5, 4.5, 0.3);
      const hit = t > 6.5 ? Math.exp(-(t - 6.5) * 6) : 0;
      const cs = kf(t, [[0, 2.4], [0.55, 2.4], [3.3, 1, E.ioC]]) * (1 + 0.035 * E.ioS(seg(t, 6.5, 10)) + 0.02 * hit);
      const fx = lerp(hero[0], 905, fp), fy = lerp(hero[1], 540, fp);
      const cam = x => { x.translate(W / 2, H / 2); x.scale(cs, cs); x.translate(-fx, -fy); };

      c.save(); cam(c);
      // faint iso guide grid
      c.strokeStyle = css(mixRGB([60, 50, 80], [255, 240, 220], NK), 0.07 * seg(t, 0, 0.5));
      c.lineWidth = 1 / cs;
      c.beginPath();
      for (let i = -14; i <= 22; i++) {
        let a = P(i, -14), b = P(i, 22); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
        a = P(-14, i); b = P(22, i); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
      }
      c.stroke();
      // island body
      const stk = 0.62 * E.outC(seg(t, 1.0, 1.45));
      if (stk > 0) {
        c.save();
        const bc = P(8, 8, 0);
        c.translate(P(4, 4)[0] + 60, bc[1] + 90); c.scale(1, 0.22);
        const ug = c.createRadialGradient(0, 0, 0, 0, 0, 640);
        ug.addColorStop(0, `rgba(50,30,70,${0.2 * seg(stk, 0, 0.62)})`); ug.addColorStop(1, 'rgba(50,30,70,0)');
        c.fillStyle = ug; c.beginPath(); c.arc(0, 0, 640, 0, TAU); c.fill();
        c.restore();
        poly(c, [P(0, 8, 0), P(8, 8, 0), P(8, 8, -stk), P(0, 8, -stk)]); c.fillStyle = sc(EARTH, 1); c.fill();
        poly(c, [P(8, 8, 0), P(8, 0, 0), P(8, 0, -stk), P(8, 8, -stk)]); c.fillStyle = sc(EARTH, 0.78); c.fill();
        poly(c, [P(0, 8, 0), P(8, 8, 0), P(8, 8, -0.1), P(0, 8, -0.1)]); c.fillStyle = sc(GRASS[1], 0.86); c.fill();
        poly(c, [P(8, 8, 0), P(8, 0, 0), P(8, 0, -0.1), P(8, 8, -0.1)]); c.fillStyle = sc(GRASS[1], 0.68); c.fill();
        c.strokeStyle = sc(EARTH, 0.7, 0.5); c.lineWidth = 1.5;
        [0.3, 0.46].forEach(z => {
          if (z > stk) return;
          let a = P(0, 8, -z), b = P(8, 8, -z), d = P(8, 0, -z);
          c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.stroke();
        });
      }
      // tiles ripple out from the first block
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
        const d = Math.hypot(i - 2, j - 4), a0 = 0.5 + d * 0.055;
        const p = E.outB(seg(t, a0, a0 + 0.32), 1.6);
        if (p <= 0) continue;
        const h = 0.5 * Math.min(p, 1.08), cx = i + 0.5, cy = j + 0.5, z = (1 - Math.min(1, p)) * 0.4;
        groundQuad(c, cx - h, cy - h, cx + h, cy + h, z, sc(GRASS[(i + j) % 2]));
      }
      if (t > 1.0) {
        c.strokeStyle = `rgba(255,255,240,${0.16 * (1 - NK * 0.6)})`; c.lineWidth = 1;
        c.beginPath();
        for (let i = 1; i < 8; i++) { let a = P(i, 0), b = P(i, 8); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); a = P(0, i); b = P(8, i); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); }
        c.stroke();
      }
      // plots under buildings
      BLD.forEach(b => {
        const a = seg(t, b.land[0] - 0.4, b.land[0] - 0.2);
        if (a > 0) groundQuad(c, b.cx + 0.05, b.cy + 0.05, b.cx + b.w - 0.05, b.cy + b.d - 0.05, 0.004, sc(PAVE, 1, a));
      });
      { const a = seg(t, twLand(0) - 0.45, twLand(0) - 0.25); if (a > 0) groundQuad(c, 1.05, 0.05, 2.95, 1.95, 0.004, sc(PAVE, 1, a)); }
      // roads draw on
      const ph = E.ioC(seg(t, 1.45, 2.25)), pv = E.ioC(seg(t, 1.65, 2.45));
      if (ph > 0) { groundQuad(c, 0, 2.97, 8 * ph, 4.03, 0.006, sc(PAVE)); groundQuad(c, 0, 3.07, 8 * ph, 3.93, 0.008, sc(ROAD)); }
      if (pv > 0) { groundQuad(c, 3.97, 0, 5.03, 8 * pv, 0.006, sc(PAVE)); groundQuad(c, 4.07, 0, 4.93, 8 * pv, 0.008, sc(ROAD)); }
      if (ph > 0 && pv > 0) groundQuad(c, 4.07, 3.07, 4.93, 3.93, 0.009, sc(ROAD));
      const dp = seg(t, 2.1, 2.75) * 8.4;
      for (let x = 0.15; x < 8; x += 0.5) {
        if (x > 3.85 && x < 5.05) continue;
        if (x + 0.25 < dp) { groundQuad(c, x, 3.475, x + 0.25, 3.525, 0.01, sc([247, 240, 226])); groundQuad(c, 4.475, x, 4.525, x + 0.25, 0.01, sc([247, 240, 226])); }
      }
      const zb = seg(t, 2.55, 2.8);
      if (zb > 0) {
        const zc = sc([247, 240, 226], 1, zb);
        for (let s = 0; s < 5; s++) {
          const u = 3.13 + s * 0.16;
          groundQuad(c, 3.66, u, 3.95, u + 0.09, 0.011, zc); groundQuad(c, 5.05, u, 5.34, u + 0.09, 0.011, zc);
          const v = 4.13 + s * 0.16;
          groundQuad(c, v, 2.66, v + 0.09, 2.95, 0.011, zc); groundQuad(c, v, 4.05, v + 0.09, 4.34, 0.011, zc);
        }
      }
      // pond
      const pp = E.outB(seg(t, 2.85, 3.25), 1.4);
      if (pp > 0) {
        const m = 1 - 0.9 * Math.min(1, pp), x0 = 5.12 + m, y0 = 4.12 + m, x1 = 6.88 - m, y1 = 5.88 - m;
        groundQuad(c, x0 - 0.06, y0 - 0.06, x1 + 0.06, y1 + 0.06, 0.006, sc(PAVE));
        poly(c, [P(x0, y0, 0.006), P(x1, y0, 0.006), P(x1, y0, -0.1), P(x0, y0, -0.1)]); c.fillStyle = sc(EARTH, 0.8); c.fill();
        poly(c, [P(x0, y0, 0.006), P(x0, y1, 0.006), P(x0, y1, -0.1), P(x0, y0, -0.1)]); c.fillStyle = sc(EARTH, 0.95); c.fill();
        groundQuad(c, x0, y0, x1, y1, -0.1, sc(WATER));
        c.save(); poly(c, [P(x0, y0, -0.1), P(x1, y0, -0.1), P(x1, y1, -0.1), P(x0, y1, -0.1)]); c.clip();
        for (let k = 0; k < 3; k++) {
          const ph2 = ((t * 0.45 + k / 3) % 1), cc = P(6, 5, -0.1);
          c.strokeStyle = `rgba(255,255,255,${0.5 * (1 - ph2) * pp})`; c.lineWidth = 2;
          c.beginPath(); c.ellipse(cc[0], cc[1], ph2 * 1.25 * IS * 0.9, ph2 * 0.72 * IS * 0.9, 0, 0, TAU); c.stroke();
        }
        [[5.5, 4.6], [6.4, 5.5]].forEach(([lx, ly]) => { const q = P(lx, ly, -0.09); c.fillStyle = sc(LEAF2, 0.95); c.beginPath(); c.ellipse(q[0], q[1], 12, 7, 0, 0.4, TAU - 0.2); c.lineTo(q[0], q[1]); c.fill(); });
        c.restore();
      }
      // dust rings where blocks touch down
      BLD.forEach(b => {
        const L0 = b.land[0], d = t - L0, dur = b.hero ? 0.6 : 0.4;
        if (d < 0 || d > dur) return;
        const k = d / dur, q = P(b.cx + b.w / 2, b.cy + b.d / 2, 0.01), r = (b.hero ? 0.6 : 0.5) + E.outC(k) * (b.hero ? 0.9 : 0.45);
        c.strokeStyle = `rgba(255,252,240,${(1 - k) * 0.85})`; c.lineWidth = (b.hero ? 4 : 2.5) * (1 - k * 0.6);
        c.beginPath(); c.ellipse(q[0], q[1], r * 1.2247 * IS * Math.max(b.w, 1), r * 0.7071 * IS * Math.max(b.w, 1), 0, 0, TAU); c.stroke();
      });
      // headlight beams lie on the road
      CARS.forEach(car => { const p = carPos(car, t); if (p && NK > 0.05) headBeam(c, car, p); });
      c.restore();

      // long soft shadows (rendered offscreen, blurred, clipped to the lot)
      if (t > 0.2) {
        const s = st.sx;
        s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, W, H);
        s.save(); cam(s);
        if (t > 1.0) { poly(s, [P(0, 0), P(8, 0), P(8, 8), P(0, 8)]); s.clip(); }
        s.fillStyle = '#000';
        const L = [lerp(1.05, 1.95, NK), lerp(-0.45, -0.8, NK)];
        BLD.forEach(b => castShadow(s, b.x0, b.y0, b.x1, b.y1, stackHeight(b, t), L));
        castShadow(s, 1.14, 0.14, 2.86, 1.86, Math.min(towerHeight(t), 5 * TW_FH), L);
        const th = towerHeight(t);
        if (th > 5 * TW_FH) castShadow(s, 1.32, 0.32, 2.68, 1.68, Math.min(th, 7 * TW_FH), L);
        if (th > 7 * TW_FH) castShadow(s, 1.5, 0.5, 2.5, 1.5, th, L);
        s.lineCap = 'round';
        TREES.forEach(tr => {
          const k = clamp(spring(t - tr.t0, 3, 0.42)); if (k <= 0) return;
          const hh = (tr.h + 0.15) * k, a = P(tr.x, tr.y), b = P(tr.x + L[0] * hh, tr.y + L[1] * hh);
          s.lineWidth = tr.r * IS * 1.5 * k; s.beginPath(); s.moveTo(a[0], a[1]); s.lineTo(b[0], b[1]); s.stroke();
        });
        CARS.forEach(car => { const p = carPos(car, t); if (!p) return; const q = car.ax === 0 ? [p.a, car.lane] : [car.lane, p.a]; castShadow(s, q[0] - 0.2, q[1] - 0.12, q[0] + 0.2, q[1] + 0.12, 0.25, L); });
        s.restore();
        c.save();
        c.globalAlpha = lerp(0.2, 0.32, NK);
        c.filter = 'blur(3px)';
        c.globalCompositeOperation = 'multiply';
        c.drawImage(st.sh, 0, 0, W, H);
        c.restore();
        // tint the shadow layer cool: multiply pass already darkens; add a violet wash inside the shadows
      }

      // objects, back to front
      c.save(); cam(c);
      const items = [];
      BLD.forEach(b => items.push([b.cx + b.w / 2 + b.cy + b.d / 2, () => drawBuilding(c, b, t)]));
      items.push([2.9, () => drawTower(c, t)]);
      TREES.forEach(tr => items.push([tr.x + tr.y, () => drawTree(c, tr, t)]));
      CARS.forEach(car => { const p = carPos(car, t); if (p) items.push([(car.ax === 0 ? p.a + car.lane : car.lane + p.a) + 0.05, () => drawCar(c, car, t, p)]); });
      items.sort((a, b) => a[0] - b[0]).forEach(it => it[1]());
      c.restore();

      // HUD + title
      const ink = css(mixRGB([42, 34, 64], [250, 238, 220], NK));
      const hud = seg(t, 1.9, 2.2) * (1 - seg(t, 8.3, 8.6));
      if (hud > 0) {
        const n = BLD_LANDS.filter(x => t >= x).length + (t >= twLand(TW_N - 1) ? 1 : 0);
        c.globalAlpha = hud * 0.8;
        text(c, `LOT 08×08 · BLOCKS ${String(n).padStart(2, '0')}/24`, 96, 104, { font: '"JetBrains Mono", monospace', size: 17, ls: 2, color: ink });
        text(c, '30° · 2:1 · NO PERSPECTIVE', W - 96, 104, { font: '"JetBrains Mono", monospace', size: 17, ls: 2, align: 'right', color: ink });
        c.globalAlpha = 1;
      }
      const ta = E.outC(seg(t, 8.45, 9.0));
      if (ta > 0) {
        const tc = css([38, 30, 58], ta), y = 958 + (1 - ta) * 16;
        text(c, '等距', 96, y, { font: '"Noto Sans SC", sans-serif', weight: 900, size: 60, color: tc });
        text(c, 'ISOMETRIC', 236, y, { font: 'Archivo, sans-serif', weight: 900, size: 60, ls: 6, color: tc });
        const sa = E.outC(seg(t, 8.7, 9.2));
        c.fillStyle = css([38, 30, 58], sa); c.fillRect(98, 984, 150 * sa, 3);
        text(c, '30° AXONOMETRIC CITY · 1 LOT · 24 BLOCKS', 98, 1018, { font: '"JetBrains Mono", monospace', size: 16, ls: 2, color: css([38, 30, 58], sa * 0.8) });
      }
      grain(c, W, H, t, 0.045);
      vignette(c, W, H, 0.22, '40,24,50');
    },
    score(A) {
      const pent = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81];
      // hook: the first block lands
      A.osc(0.35, { f: 200, f2: 55, glide: 0.12, dur: 0.35, g: 0.5 });
      A.noise(0.35, { type: 'bandpass', f: 1800, q: 2, dur: 0.05, g: 0.25 });
      A.bell(0.36, midi(84), { g: 0.08, dur: 1.8 });
      A.whoosh(0.1, 0.26, { f1: 2500, f2: 500, g: 0.08, swell: 0.7 });
      // tile ripple — a run of wood ticks
      for (let d = 0; d < 7; d++) A.osc(0.5 + d * 0.055 + 0.12, { type: 'triangle', f: midi(72 + d * 2), dur: 0.06, g: 0.06, pan: (d % 2 ? 0.3 : -0.3) });
      A.osc(1.0, { f: 70, f2: 45, dur: 0.6, g: 0.25, a: 0.08 });
      A.noise(1.45, { type: 'bandpass', f: 500, f2: 2500, q: 1.5, dur: 1.0, g: 0.06, swell: 0.5, pan: -0.3 });
      // groove
      for (let k = 0; k < 13; k++) {
        const t = 2.0 + k * 0.5;
        if (t > 6.4) break;
        A.kick(t, 0.38);
        A.hat(t + 0.25, 0.04, false, { pan: 0.3 });
        if (k % 2) A.clap(t, 0.12);
        const bass = [48, 48, 45, 43][Math.floor(k / 2) % 4];
        A.pluck(t, midi(bass - 12), { dur: 0.45, g: 0.3, bright: 0.35, lp: 700 });
      }
      // every block landing: floor ticks + a pentatonic pluck when a building completes
      BLD.forEach((b, i) => {
        b.land.forEach((L, k) => { if (!(b.hero && k === 0)) A.noise(L, { type: 'bandpass', f: 2600 + k * 300, q: 4, dur: 0.03, g: 0.05, pan: (b.cx / 8 - 0.5) * 0.8 }); });
        {
          const L = b.land[b.land.length - 1];
          if (L > 1) A.pluck(L, midi(pent[(i * 3) % pent.length]), { dur: 0.7, g: 0.16, bright: 0.55, decay: 0.994, pan: (b.cx / 8 - 0.5) * 0.9, rev: 0.15 });
        }
      });
      TREES.forEach((tr, j) => A.osc(tr.t0 + 0.04, { f: 700 + (j % 5) * 120, f2: 1400 + (j % 5) * 200, glide: 0.05, dur: 0.07, g: 0.03, pan: (tr.x / 8 - 0.5) }));
      // cars
      CARS.forEach(car => A.noise(car.t0 + 0.6, { type: 'lowpass', f: 600, dur: 1.6, g: 0.03, swell: 0.5, pan: car.dir * 0.4 }));
      // tower rises
      A.riser(5.1, 1.4, { g: 0.12, f: 98 });
      for (let k = 0; k < TW_N; k++) A.osc(twLand(k), { type: 'triangle', f: midi(60 + k * 2), dur: 0.08, g: 0.07 });
      // dusk hit
      A.impact(6.5, 0.45);
      A.chord(6.5, [48, 55, 60, 64, 67, 71], { type: 'sine', dur: 3.45, g: 0.035, a: 0.6, hold: true, rel: 1.2, rev: 0.6, width: 1.2 });
      A.chord(6.5, [36, 43], { type: 'triangle', dur: 3.4, g: 0.05, a: 0.05, hold: true, rel: 1.2, lp: 600 });
      A.bell(6.52, midi(79), { g: 0.08, dur: 2.5 });
      for (let i = 0; i < 9; i++) A.bell(6.6 + hash(i * 3) * 1.1, midi(pent[5 + (i % 5)] + 12), { g: 0.025, dur: 0.9, pan: (hash(i) - 0.5) });
      // title
      A.bell(8.5, midi(72), { g: 0.07, dur: 1.4 });
      A.bell(8.5, midi(79), { g: 0.05, dur: 1.4 });
      A.pluck(8.72, midi(84), { dur: 1.2, g: 0.12, bright: 0.6, rev: 0.3 });
    },
  });

  /* ================================================================
     MONOLINE — one continuous stroke: face → cup → city → word
     ================================================================ */
  function PB(tf) {
    const pts = [], marks = {};
    let x = 0, y = 0;
    const push = (a, b) => { const q = tf ? tf(a, b) : [a, b]; pts.push(q); x = a; y = b; };
    const api = {
      m(a, b) { push(a, b); return api; },
      l(a, b) { const n = Math.max(2, Math.ceil(Math.hypot(a - x, b - y) / 3)); const x0 = x, y0 = y; for (let i = 1; i <= n; i++) push(lerp(x0, a, i / n), lerp(y0, b, i / n)); return api; },
      c(x1, y1, x2, y2, a, b) {
        const x0 = x, y0 = y, n = 60;
        for (let i = 1; i <= n; i++) {
          const u = i / n, v = 1 - u;
          push(v * v * v * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * a, v * v * v * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * b);
        }
        return api;
      },
      e(cx, cy, rx, ry, a0, a1) {
        const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) / 3));
        for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); push(cx + rx * Math.cos(a), cy + ry * Math.sin(a)); }
        return api;
      },
      mark(k) { marks[k] = pts.length - 1; return api; },
      done(N) {
        const L = [0];
        for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        const tot = L[L.length - 1], out = new Float32Array(N * 2);
        let j = 0;
        for (let k = 0; k < N; k++) {
          const d = (tot * k) / (N - 1);
          while (j < pts.length - 2 && L[j + 1] < d) j++;
          const u = clamp((d - L[j]) / (L[j + 1] - L[j] || 1));
          out[k * 2] = lerp(pts[j][0], pts[j + 1][0], u); out[k * 2 + 1] = lerp(pts[j][1], pts[j + 1][1], u);
        }
        const fr = {}; Object.keys(marks).forEach(k => (fr[k] = L[marks[k]] / tot));
        return { pts: out, fr };
      },
    };
    return api;
  }
  const LN = 1400;
  const LA = { pap: '#f3ede1', ink: '#1536b0' };
  const FACE = PB()
    .m(-80, 900).l(600, 900)
    .c(700, 900, 790, 880, 818, 800)
    .c(832, 760, 838, 722, 828, 684)
    .c(792, 640, 772, 560, 785, 470)
    .e(760, 410, 65, 65, 1.176, 1.176 - TAU)
    .c(800, 360, 910, 298, 1010, 318)
    .c(1080, 334, 1120, 390, 1125, 440)
    .c(1127, 455, 1130, 463, 1128, 470)
    .c(1112, 476, 1096, 480, 1080, 476)
    .c(1096, 480, 1112, 476, 1128, 470)
    .c(1136, 500, 1160, 540, 1182, 566)
    .c(1172, 579, 1156, 581, 1142, 578)
    .c(1152, 590, 1160, 600, 1151, 608)
    .c(1141, 612, 1141, 617, 1152, 623)
    .c(1162, 632, 1152, 646, 1136, 648)
    .c(1152, 666, 1146, 702, 1110, 712)
    .c(1080, 720, 1060, 726, 1050, 742)
    .c(1045, 772, 1050, 802, 1072, 832)
    .c(1112, 880, 1200, 900, 1320, 900).l(2000, 900)
    .done(LN);
  const CUP = PB()
    .m(-80, 820).l(640, 820)
    .c(680, 820, 700, 792, 760, 792).l(850, 792)
    .c(818, 700, 800, 560, 800, 470)
    .e(950, 470, 150, 34, Math.PI, Math.PI * 1.5)
    .c(930, 400, 990, 360, 958, 300).c(930, 252, 985, 215, 966, 160)
    .c(985, 215, 930, 252, 958, 300).c(990, 360, 930, 400, 950, 436)
    .e(950, 470, 150, 34, Math.PI * 1.5, Math.PI * 4)
    .l(1098, 520)
    .c(1230, 492, 1240, 690, 1082, 680)
    .c(1074, 730, 1062, 770, 1050, 792)
    .l(1160, 792).c(1220, 792, 1240, 820, 1280, 820).l(2000, 820)
    .done(LN);
  const CITY = (() => {
    const p = PB().m(-80, 820).l(260, 820).l(260, 650).l(360, 650).l(360, 560).l(450, 560).l(450, 690).l(520, 690).l(520, 420)
      .l(570, 420).l(570, 300).l(570, 420).l(620, 420).l(620, 600)
      .e(690, 600, 70, 70, Math.PI, TAU).l(760, 700).l(830, 700).l(830, 520).l(880, 520).l(880, 400).l(925, 270).l(970, 400).l(970, 520)
      .l(1020, 520).l(1020, 640).l(1080, 640).l(1135, 575).l(1190, 640).l(1190, 700).l(1240, 700).l(1240, 470).l(1300, 470)
      .e(1300, 340, 130, 130, Math.PI / 2, Math.PI / 2 - TAU).l(1360, 470).l(1360, 610)
      .l(1430, 610).l(1430, 540).l(1500, 540).l(1500, 680).l(1580, 680).l(1580, 600).l(1640, 600).l(1640, 820).l(2000, 820);
    return p.done(LN);
  })();
  const WORD = (() => {
    const tf = (x, y) => [960 + (x - 905) * 1.85, 540 + (y - 520) * 1.85];
    const p = PB(tf).m(320, 600).l(600, 600).mark('s')
      .c(660, 595, 735, 520, 765, 420).c(780, 368, 770, 348, 752, 352).c(734, 356, 728, 430, 735, 520).c(740, 580, 760, 604, 790, 600)
      .c(808, 592, 830, 552, 840, 512).c(838, 560, 846, 598, 872, 600)
      .c(892, 592, 900, 552, 902, 512).c(903, 545, 903, 580, 903, 600)
      .c(914, 545, 936, 506, 960, 510).c(985, 515, 988, 560, 990, 600).c(995, 606, 1015, 602, 1030, 596)
      .c(1062, 585, 1102, 560, 1100, 532).c(1098, 506, 1072, 506, 1058, 518).c(1036, 536, 1038, 602, 1092, 604)
      .c(1132, 605, 1168, 590, 1205, 572).mark('e')
      .c(1240, 556, 1280, 640, 1330, 640).l(1700, 640);
    return p.done(LN);
  })();
  const DOT = [960 + (841 - 905) * 1.85, 540 + (468 - 520) * 1.85];
  const LSHAPES = [FACE.pts, CUP.pts, CITY.pts, WORD.pts];
  const MORPHS = [[2.95, 4.0], [5.15, 6.2], [7.0, 8.05]];
  const LABELS = ['FACE', 'COFFEE', 'CITY', 'LINE'];

  MG.film({
    id: 'lineart',
    dur: 10,
    poster: 9.4,
    fonts: ['300 34px Jost', ['400 17px "JetBrains Mono"', '0123456789/ —FACECOFFEITYLN·TRIMPATHS'], ['600 34px "Noto Serif SC"', '单线']],
    meta: {
      cn: '单线', en: 'Monoline Line-art', era: '1970s —',
      origin: '源自毕加索等人的一笔画与 Osvaldo Cavandoli 的动画《La Linea》(1971)；After Effects 形状图层的 Trim Paths 让"一根线画完一切"成为品牌动效的经典手法',
      works: '代表作：Osvaldo Cavandoli《La Linea》(1971)、Gjon Mili 为《LIFE》拍摄的毕加索光绘 (1949)、Saul Steinberg 的单线插画',
      tech: ['Trim Paths 描边生长', '等宽线 + 圆头端点', '路径逐点插值形变'],
      accent: '#1536b0',
    },
    setup() { return { buf: new Float32Array(LN * 2) }; },
    draw(c, t, W, H, st) {
      c.fillStyle = LA.pap; c.fillRect(0, 0, W, H);
      const pts = st.buf;
      // which shape / morph is active
      let A = 0, B = 0, m = 0;
      if (t < MORPHS[0][0]) { A = B = 0; }
      else {
        A = 3; B = 3;
        for (let i = 0; i < MORPHS.length; i++) {
          const [a, b] = MORPHS[i];
          if (t < a) { A = B = i; break; }
          if (t < b) { A = i; B = i + 1; m = seg(t, a, b); break; }
        }
      }
      const SA = LSHAPES[A], SB = LSHAPES[B], wv = 0.55;
      const breathe = 1 + 0.006 * Math.sin(t * 2.2);
      for (let i = 0; i < LN; i++) {
        const u = i / (LN - 1);
        const p = A === B ? 0 : E.ioC(clamp(m * (1 + wv) - u * wv));
        let x = lerp(SA[i * 2], SB[i * 2], p), y = lerp(SA[i * 2 + 1], SB[i * 2 + 1], p);
        y -= Math.sin(Math.PI * p) * 70 * Math.sin(u * Math.PI);
        if (A === B) { x = 960 + (x - 960) * breathe; y = 540 + (y - 540) * breathe; }
        pts[i * 2] = x; pts[i * 2 + 1] = y;
      }
      // steam wiggle while the cup holds
      const steamK = seg(t, 3.8, 4.2) * (1 - seg(t, 5.15, 5.6));
      if (steamK > 0) {
        for (let i = 0; i < LN; i++) {
          const x = pts[i * 2], y = pts[i * 2 + 1];
          if (y < 436 && x > 880 && x < 1060) { const w = seg(440 - y, 0, 70); pts[i * 2] += Math.sin(y * 0.035 - t * 5) * 9 * w * steamK; }
        }
      }
      // trim window
      let tail = 0, head = 1;
      if (t < 2.95) { const q = seg(t, 0.12, 2.75); head = 0.45 * E.outQ(q) + 0.55 * E.ioS(q); }
      const ret = E.ioC(seg(t, 8.15, 8.85));
      if (ret > 0) { tail = lerp(0, WORD.fr.s, ret); head = lerp(1, WORD.fr.e, ret); }
      const i0 = tail * (LN - 1), i1 = head * (LN - 1);
      c.strokeStyle = LA.ink; c.lineWidth = 8; c.lineCap = 'round'; c.lineJoin = 'round';
      if (i1 > i0 + 0.5) {
        c.beginPath();
        const s0 = Math.floor(i0), fr0 = i0 - s0;
        c.moveTo(lerp(pts[s0 * 2], pts[Math.min(LN - 1, s0 + 1) * 2], fr0), lerp(pts[s0 * 2 + 1], pts[Math.min(LN - 1, s0 + 1) * 2 + 1], fr0));
        const e0 = Math.floor(i1);
        for (let i = s0 + 1; i <= e0; i++) c.lineTo(pts[i * 2], pts[i * 2 + 1]);
        const fr1 = i1 - e0;
        let hx = pts[e0 * 2], hy = pts[e0 * 2 + 1];
        if (e0 < LN - 1) { hx = lerp(hx, pts[(e0 + 1) * 2], fr1); hy = lerp(hy, pts[(e0 + 1) * 2 + 1], fr1); c.lineTo(hx, hy); }
        c.stroke();
        if (t > 0.18 && t < 2.95) {
          const pr = 1 + 0.5 * Math.exp(-(t - 0.18) * 6);
          c.fillStyle = LA.ink; c.beginPath(); c.arc(hx, hy, 8 * pr, 0, TAU); c.fill();
        }
      }
      // i dot
      const dot = spring(t - 8.2, 3.2, 0.38);
      if (dot > 0) { c.fillStyle = LA.ink; c.beginPath(); c.arc(DOT[0], DOT[1] - (1 - Math.min(1, dot)) * 40, 13 * Math.max(0, dot), 0, TAU); c.fill(); }
      // editorial labels
      const idx = t < 3.5 ? 0 : t < 5.7 ? 1 : t < 7.55 ? 2 : 3;
      const lblA = seg(t, 0.3, 0.7) * (1 - seg(t, 8.3, 8.6));
      if (lblA > 0) {
        const sw = (B !== A && m > 0.35 && m < 0.65) ? 0.3 : 1;
        c.globalAlpha = lblA * 0.75 * sw;
        text(c, `0${idx + 1} / 04`, 96, 104, { font: '"JetBrains Mono", monospace', size: 17, ls: 3, color: LA.ink });
        text(c, `— ${LABELS[idx]}`, 200, 104, { font: '"JetBrains Mono", monospace', size: 17, ls: 3, color: LA.ink });
        text(c, 'ONE STROKE · 8 PX · ROUND CAP', W - 96, 104, { font: '"JetBrains Mono", monospace', size: 17, ls: 3, align: 'right', color: LA.ink });
        c.globalAlpha = 1;
        c.fillStyle = LA.ink; c.globalAlpha = lblA * 0.5;
        c.fillRect(96, 1000, (W - 192), 1);
        c.globalAlpha = lblA; c.fillRect(96, 998, (W - 192) * clamp(t / 8.3), 5);
        c.globalAlpha = 1;
      }
      const ta = E.outC(seg(t, 8.55, 9.15));
      if (ta > 0) {
        text(c, '单线', W / 2 - 150, 905 + (1 - ta) * 12, { font: '"Noto Serif SC", serif', weight: 600, size: 34, ls: 10, align: 'center', color: `rgba(21,54,176,${ta})` });
        c.fillStyle = `rgba(21,54,176,${ta})`; c.fillRect(W / 2 - 80, 893 + (1 - ta) * 12, 4, 4);
        text(c, 'ONE LINE', W / 2 + 80, 905 + (1 - ta) * 12, { font: 'Jost, sans-serif', weight: 300, size: 34, ls: 14, align: 'center', color: `rgba(21,54,176,${ta})` });
        text(c, 'A SINGLE CONTINUOUS STROKE', W / 2, 952, { font: '"JetBrains Mono", monospace', size: 15, ls: 5, align: 'center', color: `rgba(21,54,176,${seg(t, 8.85, 9.3) * 0.6})` });
      }
      grain(c, W, H, t, 0.05, 'multiply');
      vignette(c, W, H, 0.12, '60,40,20');
    },
    score(A) {
      A.osc(0.18, { type: 'triangle', f: 2400, f2: 1200, dur: 0.04, g: 0.152 });
      A.chord(0.2, [50, 57, 62, 66, 69], { type: 'sine', dur: 2.9, g: 0.0418, a: 0.8, hold: true, rel: 0.6, rev: 0.6, width: 1 });
      // pencil on paper while the line draws
      for (let k = 0; k < 50; k++) {
        const t = 0.25 + k * 0.05, sp = Math.sin(Math.PI * seg(t, 0.25, 2.75));
        A.noise(t, { type: 'bandpass', f: 3800 + hash(k) * 2400, q: 0.9, dur: 0.07, g: 0.0266 + 0.02 * sp, pan: lerp(-0.6, 0.6, k / 50) });
      }
      const pk = (t, m, g = 0.2, pan = 0) => { A.pluck(t, midi(m), { dur: 1.6, g: g * 1.9, bright: 0.35, decay: 0.996, lp: 2600, rev: 0.35, pan }); A.osc(t, { f: midi(m), dur: 1.2, g: g * 0.28, rev: 0.3 }); };
      [[0.45, 74], [0.85, 78], [1.2, 81], [1.5, 83], [1.8, 81], [2.1, 78], [2.45, 76], [2.75, 74]].forEach(([t, m], i) => pk(t, m, 0.17, i % 2 ? 0.3 : -0.3));
      // morphs
      const morph = (a, b, chord, up) => {
        A.whoosh(a, b - a, { f1: 400, f2: 3200, g: 0.114, swell: 0.55, rev: 0.4 });
        A.chord(a + 0.1, chord, { type: 'sine', dur: 2.4, g: 0.038, a: 0.7, hold: true, rel: 0.7, rev: 0.6, width: 1 });
        up.forEach((m, i) => pk(b - 0.05 + i * 0.18, m, 0.15, i % 2 ? 0.35 : -0.35));
      };
      morph(2.95, 4.0, [47, 54, 59, 62, 66], [71, 74, 78]);
      morph(5.15, 6.2, [43, 55, 59, 62, 67], [74, 79, 83]);
      morph(7.0, 8.05, [45, 57, 61, 64, 69], [76, 81]);
      A.noise(4.0, { type: 'bandpass', f: 1200, f2: 2600, q: 0.7, dur: 1.2, g: 0.0475, swell: 0.5, rev: 0.4 });
      A.bell(6.45, midi(93), { g: 0.076, dur: 1.6 });
      // logo lock
      A.chord(8.05, [38, 50, 57, 62, 66, 69, 74], { type: 'sine', dur: 1.95, g: 0.0532, a: 0.05, hold: true, rel: 1, rev: 0.6, width: 1.2 });
      pk(8.05, 86, 0.18);
      A.pluck(8.22, midi(98), { dur: 1, g: 0.304, bright: 0.8, rev: 0.4 });
      A.osc(8.22, { f: midi(98), dur: 0.5, g: 0.076, rev: 0.4 });
      A.noise(8.15, { type: 'bandpass', f: 2600, f2: 900, q: 1.2, dur: 0.6, g: 0.057, swell: 0.4 });
      A.bell(8.6, midi(81), { g: 0.114, dur: 1.4 });
    },
  });

  /* ================================================================
     BAUHAUS — primaries snap, rotate and slide on a grid into a poster
     ================================================================ */
  const BH = { pap: '#ede6d5', red: '#d6262c', yel: '#f2b416', blu: '#1f4c9c', blk: '#161616' };
  const JOST = 'Jost, "Futura", sans-serif';
  function bshape(c, type, x, y, s, rot, col, o = {}) {
    if (s <= 0.0001) return;
    c.save(); c.translate(x, y); c.rotate(rot || 0);
    c.fillStyle = col; c.strokeStyle = col;
    c.beginPath();
    if (type === 'circle') c.arc(0, 0, s / 2, 0, TAU);
    else if (type === 'square') c.rect(-s / 2, -s / 2, s, s);
    else if (type === 'tri') { c.moveTo(0, -s / 2); c.lineTo(s / 2, s / 2); c.lineTo(-s / 2, s / 2); c.closePath(); }
    else if (type === 'quarter') { c.moveTo(0, 0); c.arc(0, 0, s, 0, Math.PI / 2); c.closePath(); }
    else if (type === 'semi') { c.arc(0, 0, s / 2, Math.PI, TAU); c.closePath(); }
    if (type === 'ring') { c.lineWidth = o.lw || 8; c.arc(0, 0, s / 2, -Math.PI / 2, -Math.PI / 2 + TAU * (o.trim ?? 1)); c.stroke(); }
    else c.fill();
    c.restore();
  }
  const BPAL = [BH.red, BH.yel, BH.blu, BH.blk, BH.pap];
  const TS = 240;
  const TILES = [];
  for (let j = 0; j < 5; j++) for (let i = 0; i < 8; i++) {
    const r = rng(i * 31 + j * 17 + 5);
    const bg = Math.floor(r() * 5); let fg = Math.floor(r() * 4); if (fg === bg) fg = (fg + 1) % 4;
    const types = ['quarter', 'quarter', 'semi', 'circle', 'tri', 'twoq'];
    TILES.push({ i, j, bg, fg, type: types[Math.floor(r() * types.length)], rot0: Math.floor(r() * 4) });
  }
  function drawTile(c, tl, x, y, rot, swap) {
    const bg = BPAL[swap ? tl.fg : tl.bg], fg = BPAL[swap ? tl.bg : tl.fg], h = TS / 2;
    c.save(); c.translate(x, y);
    c.fillStyle = bg; c.fillRect(-h - 0.5, -h - 0.5, TS + 1, TS + 1);
    c.beginPath(); c.rect(-h, -h, TS, TS); c.clip();
    c.rotate(rot);
    c.fillStyle = fg; c.beginPath();
    if (tl.type === 'quarter') { c.moveTo(-h, -h); c.arc(-h, -h, TS, 0, Math.PI / 2); c.closePath(); }
    else if (tl.type === 'twoq') { c.moveTo(-h, -h); c.arc(-h, -h, h, 0, Math.PI / 2); c.closePath(); c.moveTo(h, h); c.arc(h, h, h, Math.PI, Math.PI * 1.5); c.closePath(); }
    else if (tl.type === 'semi') { c.arc(0, -h, h, 0, Math.PI); c.closePath(); }
    else if (tl.type === 'circle') c.arc(0, 0, h * 0.62, 0, TAU);
    else if (tl.type === 'tri') { c.moveTo(-h, -h); c.lineTo(h, -h); c.lineTo(-h, h); c.closePath(); }
    c.fill();
    c.restore();
  }
  const TILE_BEATS = Array.from({ length: 10 }, (_, k) => 2.75 + k * 0.25);
  function tileRot(tl, t) {
    let r = tl.rot0 * Math.PI / 2;
    TILE_BEATS.forEach((T, k) => { if ((tl.i + tl.j + k) % 4 === 0) r += (Math.PI / 2) * E.outB(seg(t, T, T + 0.2), 1.8); });
    return r;
  }
  const PO = { R: [690, 450, 580], B: [300, 780, 300], Y: [970, 720, 420], Q: [150, 150, 230], O: [1060, 230, 120], S: [240, 560, 70] };
  const HITS = [7.0, 7.25, 7.5, 7.75, 7.8125, 7.875, 7.9375];
  function tilesLayer(c, t, alpha) {
    TILES.forEach(tl => {
      const x = 120 + tl.i * TS, y = 60 + tl.j * TS;
      drawTile(c, tl, x, y, tileRot(tl, t), (t >= 3.75 && t < 4.75 && (tl.i + tl.j) % 2 === 0) || (t >= 4.75 && (tl.i + tl.j) % 2 === 1));
    });
  }

  MG.film({
    id: 'bauhaus',
    dur: 10,
    poster: 9.4,
    fonts: [['800 180px Jost', 'BAUHS19'], ['500 24px Jost', 'STAATLICHES BAUHAUS WEIMAR·DESSAU·BERLIN 1919—1933'], ['900 56px "Noto Sans SC"', '包豪斯']],
    meta: {
      cn: '包豪斯几何', en: 'Bauhaus Geometry', era: '1919 —',
      origin: '1919 年格罗皮乌斯在魏玛创立国立包豪斯；康定斯基 1923 年的问卷把黄—三角、红—方、蓝—圆一一对应，三原色几何延续为现代品牌识别动效的语言',
      works: '代表作：康定斯基《构成第八号》(1923)、Joost Schmidt《1923 年包豪斯展览海报》、Oskar Schlemmer《三元芭蕾》(1922)',
      tech: ['三原色 + 黑白的严格色板', '网格吸附与 90° 旋转节奏', '形状滑移 / 推拉转场', '叠印（正片叠底）'],
      accent: '#d6262c',
    },
    draw(c, t, W, H) {
      c.fillStyle = BH.pap; c.fillRect(0, 0, W, H);
      // module grid
      const gp = E.outC(seg(t, 0, 0.45));
      c.strokeStyle = 'rgba(22,22,22,0.07)'; c.lineWidth = 1;
      c.beginPath();
      for (let x = 120; x < W; x += 120) { c.moveTo(x, 0); c.lineTo(x, H * gp); }
      for (let y = 120; y < H; y += 120) { c.moveTo(0, y); c.lineTo(W * gp, y); }
      c.stroke();

      /* ---- C/D: poster actors ---- */
      if (t >= 5.0) {
        const nh = HITS.filter(h => t >= h).length, cyc = t < 8.0 ? nh % 3 : 0;
        const perm = [[BH.red, BH.yel, BH.blu], [BH.blu, BH.red, BH.yel], [BH.yel, BH.blu, BH.red]][cyc];
        const lastHit = HITS.filter(h => t >= h).pop();
        const punch = t < 8.0 && lastHit ? Math.exp(-(t - lastHit) * 14) * 0.018 : 0;
        const lock = t >= 8.0 ? Math.exp(-(t - 8.0) * 9) * 0.025 : 0;
        c.save();
        c.translate(W / 2, H / 2); c.scale(1 + punch + lock, 1 + punch + lock); c.translate(-W / 2, -H / 2);
        c.globalCompositeOperation = 'multiply';
        // red circle rolls in
        const rp = E.outQt(seg(t, 5.2, 5.75));
        if (rp > 0) {
          const [x, y, d] = PO.R, land = Math.max(0, t - 5.75);
          const sq = 1 + 0.07 * Math.exp(-land * 10) * Math.sin(land * 40) * after(t, 5.75);
          c.save(); c.translate(lerp(-420, x, rp), y); c.scale(1 / sq, sq);
          bshape(c, 'circle', 0, 0, d, 0, perm[0]);
          if (t >= 7.0 && t < 8.0) {
            c.save(); c.beginPath(); c.arc(0, 0, d / 2, 0, TAU); c.clip();
            c.globalCompositeOperation = 'source-over';
            c.translate(-TS * 1.5 + ((t - 7) * 240) % TS, -TS * 1.5);
            for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) { const tl = TILES[(a + b * 8 + 9) % TILES.length]; drawTile(c, tl, a * TS, b * TS, tileRot(tl, t + 0.5) + (nh % 2) * Math.PI / 2, nh % 2); }
            c.restore();
          }
          c.restore();
        }
        // blue square drops
        const bp = seg(t, 5.45, 5.75);
        if (bp > 0) { const [x, y, s] = PO.B; bshape(c, 'square', x, lerp(-250, y, E.outB(bp, 1.3)), s, lerp(Math.PI / 2, 0, E.outC(bp)), perm[2]); }
        // yellow triangle spins up
        const yp = seg(t, 5.72, 6.02);
        if (yp > 0) { const [x, y, s] = PO.Y; bshape(c, 'tri', x, y, s * E.outB(yp, 1.8), lerp(-TAU * 2 / 3, 0, E.outC(yp)), perm[1]); }
        // vertical bar grows
        const vp = E.outX(seg(t, 6.0, 6.24));
        if (vp > 0) { c.fillStyle = BH.blk; c.fillRect(1227, 930 - 780 * vp, 26, 780 * vp); }
        // baseline draws
        const gpp = E.outX(seg(t, 6.24, 6.5));
        if (gpp > 0) { c.fillStyle = BH.blk; c.fillRect(150, 930, (1253 - 150) * gpp, 14); }
        // black quarter swings in about its corner
        const qp = seg(t, 6.48, 6.76);
        if (qp > 0) { const [x, y, r] = PO.Q; bshape(c, 'quarter', x, y, r * Math.min(1, qp * 3), lerp(-Math.PI / 2, 0, E.outB(qp, 1.6)), BH.blk); }
        // ring + dot
        const op = E.outC(seg(t, 6.72, 7.0));
        if (op > 0) { const [x, y, d] = PO.O; bshape(c, 'ring', x, y, d, t * 0.5, BH.blk, { lw: 10, trim: op }); }
        const dp = E.outB(seg(t, 6.86, 7.02), 2.2);
        if (dp > 0) bshape(c, 'circle', PO.O[0], PO.O[1], 32 * dp, 0, perm[0]);
        // diagonal
        const lp = E.ioX(seg(t, 6.75, 7.05));
        if (lp > 0) { c.strokeStyle = BH.blk; c.lineWidth = 5; c.lineCap = 'butt'; c.beginPath(); c.moveTo(360, 60); c.lineTo(lerp(360, 1200, lp), lerp(60, 1020, lp)); c.stroke(); }
        // small red square
        const sp = E.outX(seg(t, 7.0, 7.18));
        if (sp > 0) { const [x, y, s] = PO.S; bshape(c, 'square', lerp(-100, x, sp), y, s, 0, perm[0]); }
        // small semicircle on the baseline
        const hp = E.outB(seg(t, 7.25, 7.45), 1.6);
        if (hp > 0) bshape(c, 'semi', 590, 930, 120 * hp, 0, perm[2]);
        c.restore();

        // typography column
        if (t >= 8.0) {
          c.globalCompositeOperation = 'source-over';
          const line = (s, y, size, t0, col, wgt = 800, ls = 0) => {
            const p = E.outX(seg(t, t0, t0 + 0.32));
            if (p <= 0) return;
            c.save(); c.beginPath(); c.rect(1310, y - size * 0.8, 560, size * 0.86); c.clip();
            text(c, s, 1312, y + (1 - p) * size, { font: JOST, weight: wgt, size, ls, color: col });
            c.restore();
          };
          line('BAU', 360, 180, 8.0, BH.blk, 800, -4);
          line('HAUS', 540, 180, 8.125, BH.blk, 800, -4);
          const rb = E.outX(seg(t, 8.25, 8.5));
          c.fillStyle = BH.red; c.fillRect(1316, 584, 480 * rb, 16);
          line('1919', 730, 110, 8.375, BH.red, 800, 0);
          const sa = E.outC(seg(t, 8.5, 8.8));
          text(c, 'STAATLICHES BAUHAUS', 1316, 800, { font: JOST, weight: 500, size: 24, ls: 6, color: `rgba(22,22,22,${sa})` });
          text(c, 'WEIMAR · DESSAU · BERLIN', 1316, 838, { font: JOST, weight: 500, size: 24, ls: 6, color: `rgba(22,22,22,${sa * 0.75})` });
          text(c, '1919—1933', 1316, 876, { font: JOST, weight: 500, size: 24, ls: 6, color: `rgba(22,22,22,${sa * 0.75})` });
          const ca = E.outC(seg(t, 8.65, 9.0));
          text(c, '包豪斯', 1312, 944 + (1 - ca) * 10, { font: '"Noto Sans SC", sans-serif', weight: 900, size: 56, ls: 8, color: `rgba(22,22,22,${ca})` });
        }
      }

      /* ---- B: Truchet tile wall ---- */
      if (t >= 2.5 && t < 5.7) {
        TILES.forEach(tl => {
          const dir = tl.j % 2 ? 1 : -1, ex = E.inX(seg(t, 5.0 + tl.j * 0.05, 5.42 + tl.j * 0.05)) * 2100 * dir;
          const x = 120 + tl.i * TS + ex, y = 60 + tl.j * TS;
          const swap = (t >= 3.75 && t < 4.75 && (tl.i + tl.j) % 2 === 0) || (t >= 4.75 && (tl.i + tl.j) % 2 === 1);
          drawTile(c, tl, x, y, tileRot(tl, t), swap);
        });
        // grid hairlines over the wall
        c.strokeStyle = 'rgba(22,22,22,0.9)'; c.lineWidth = 3;
        if (t < 5.0) {
          c.beginPath();
          for (let i = 0; i <= 8; i++) { c.moveTo(i * TS, 0); c.lineTo(i * TS, H); }
          for (let j = 0; j <= 5; j++) { c.moveTo(0, j * TS - 60); c.lineTo(W, j * TS - 60); }
          c.stroke();
        }
      }

      /* ---- A: opening assembly ---- */
      if (t < 2.5) {
        const beatA = (T, d = 0.16) => E.outB(seg(t, T, T + d), 1.8);
        // thin ring sweep around the circle
        const rs = E.outC(seg(t, 1.45, 1.85));
        if (rs > 0) bshape(c, 'ring', 960, 520, 600, 0, BH.blk, { lw: 4, trim: rs });
        const pulse = 1 + 0.07 * (Math.exp(-Math.max(0, t - 2.0) * 10) * after(t, 2.0) + Math.exp(-Math.max(0, t - 2.25) * 10) * after(t, 2.25));
        const cp = E.outB(seg(t, 0.25, 0.43), 2.2);
        bshape(c, 'circle', 960, 520, 440 * cp * pulse, 0, BH.red);
        const bx = lerp(-700, 960, E.outX(seg(t, 0.5, 0.72)));
        c.fillStyle = BH.blk; c.fillRect(bx - 540, 800, 1080, 34);
        const sq = seg(t, 0.75, 0.98);
        if (sq > 0) bshape(c, 'square', 520, lerp(-300, 400, E.outB(sq, 1.3)), 240, lerp(Math.PI / 2, 0, E.outC(sq)) + (Math.PI / 4) * (beatA(2.0) - beatA(2.25)), BH.blu);
        const tr = seg(t, 1.0, 1.22);
        if (tr > 0) bshape(c, 'tri', lerp(2300, 1400, E.outX(tr)), 410, 300, lerp(-TAU / 3, 0, E.outC(tr)) + Math.PI * (beatA(2.0) + beatA(2.25)), BH.yel);
        const qp = seg(t, 1.25, 1.45);
        if (qp > 0) bshape(c, 'quarter', 1300, 800, 220 * Math.min(1, qp * 3), lerp(-Math.PI * 1.5, -Math.PI / 2, E.outB(qp, 1.6)) - (Math.PI / 2) * (beatA(2.0) - beatA(2.25)), BH.blk);
        [1.5, 1.625, 1.75].forEach((T, i) => { const p = E.outB(seg(t, T, T + 0.14), 2.4); if (p > 0) bshape(c, 'circle', 690 + i * 64, 250, 34 * p, 0, i === 1 ? BH.red : BH.blk); });
        const hl = E.outX(seg(t, 1.75, 2.0));
        if (hl > 0) { c.fillStyle = BH.blk; c.fillRect(240, 930, 1440 * hl, 4); }
        if (t > 1.85) text(c, '1 · 2 · 3', 1680, 980, { font: JOST, weight: 800, size: 30, ls: 6, align: 'right', color: `rgba(22,22,22,${seg(t, 1.85, 2.0)})` });
      }
      /* ---- wipe train ---- */
      if (t > 2.28 && t < 2.76) {
        const x0 = lerp(W, -2.2 * W, E.ioC(seg(t, 2.3, 2.74)));
        [BH.red, BH.yel, BH.blu, BH.blk].forEach((col, i) => { c.fillStyle = col; c.fillRect(x0 + i * W * 0.55, 0, W * 0.55 + 2, H); });
      }
      grain(c, W, H, t, 0.07, 'multiply');
      vignette(c, W, H, 0.14, '40,30,20');
    },
    score(A) {
      // 120 bpm, events on the 8th grid from 0.25
      for (let k = 0; k < 16; k++) {
        const t = 0.25 + k * 0.5;
        if (t >= 8.0) break;
        A.kick(t, k === 0 ? 0.6 : 0.45);
        if (k % 2 === 1) A.clap(t, 0.16);
        if (k >= 1) A.hat(t + 0.25, 0.05, false, { pan: 0.25 });
        if (k >= 4) A.hat(t + 0.125, 0.025, false, { pan: -0.25 });
        const bass = [45, 45, 48, 43][Math.floor(k / 2) % 4];
        if (k >= 1) { A.osc(t, { type: 'sawtooth', f: midi(bass - 12), dur: 0.2, g: 0.08, lp: 600 }); A.osc(t + 0.25, { type: 'sawtooth', f: midi(bass), dur: 0.12, g: 0.05, lp: 900 }); }
      }
      // A: shape sounds
      A.osc(0.25, { f: 160, f2: 70, glide: 0.15, dur: 0.3, g: 0.3 });
      A.whoosh(0.42, 0.3, { f1: 600, f2: 3000, g: 0.08, swell: 0.6 });
      A.osc(0.98, { type: 'triangle', f: 900, f2: 600, dur: 0.06, g: 0.12 });
      A.bell(1.1, midi(88), { g: 0.06, dur: 1, ratios: [1, 2.4, 4.1] });
      A.noise(1.3, { type: 'bandpass', f: 1500, f2: 4000, q: 2, dur: 0.15, g: 0.08 });
      [1.5, 1.625, 1.75].forEach((t, i) => A.pluck(t, midi([81, 84, 88][i]), { dur: 0.4, g: 0.16, bright: 0.8 }));
      A.noise(1.45, { type: 'highpass', f: 5000, dur: 0.4, g: 0.04, swell: 0.6 });
      [2.0, 2.25].forEach(t => A.osc(t, { type: 'square', f: 1320, dur: 0.05, g: 0.04, lp: 3000 }));
      A.whoosh(2.3, 0.45, { f1: 300, f2: 5000, g: 0.14, swell: 0.5 });
      // B: tile rotations — marimba pattern
      const mel = [69, 72, 76, 74, 69, 79, 76, 72, 74, 81];
      TILE_BEATS.forEach((T, k) => { A.pluck(T, midi(mel[k]), { dur: 0.45, g: 0.14, bright: 0.7, decay: 0.99, pan: (k % 2 ? 0.4 : -0.4) }); A.noise(T, { type: 'bandpass', f: 3000, q: 3, dur: 0.03, g: 0.06 }); });
      A.chord(3.75, [57, 60, 64, 67], { type: 'square', dur: 0.18, g: 0.025, lp: 2000 });
      A.chord(4.75, [55, 59, 62, 67], { type: 'square', dur: 0.18, g: 0.025, lp: 2000 });
      // C: slide out + entries
      A.whoosh(4.95, 0.5, { f1: 3000, f2: 300, g: 0.12, swell: 0.4 });
      A.osc(5.72, { f: 140, f2: 55, glide: 0.2, dur: 0.4, g: 0.3 });
      A.noise(5.2, { type: 'lowpass', f: 300, f2: 900, dur: 0.55, g: 0.08, swell: 0.6 });
      A.osc(5.75, { type: 'triangle', f: 700, f2: 400, dur: 0.07, g: 0.12 });
      A.bell(5.95, midi(84), { g: 0.06, dur: 1, ratios: [1, 2.4, 4.1] });
      A.noise(6.0, { type: 'bandpass', f: 800, f2: 5000, q: 2, dur: 0.24, g: 0.07 });
      A.noise(6.24, { type: 'bandpass', f: 1200, f2: 6000, q: 2, dur: 0.26, g: 0.06, pan: -0.3 });
      A.noise(6.48, { type: 'bandpass', f: 1500, f2: 400, q: 2, dur: 0.25, g: 0.07, pan: -0.5 });
      A.pluck(6.75, midi(88), { dur: 0.6, g: 0.14, bright: 0.8 });
      A.pluck(6.88, midi(93), { dur: 0.6, g: 0.12, bright: 0.8 });
      // D: colour hits + riser
      A.riser(6.6, 1.4, { g: 0.14, f: 110 });
      const stabs = [[57, 64, 69, 72], [60, 64, 67, 72], [55, 62, 67, 71], [57, 64, 69, 76], [59, 64, 71], [60, 67, 72], [62, 69, 74]];
      HITS.forEach((t, i) => A.chord(t, stabs[i], { type: 'sawtooth', dur: i < 4 ? 0.2 : 0.06, g: 0.03, lp: 3500, lp2: 600, lpT: 0.2, a: 0.004, spread: 8, width: 1 }));
      // lock
      A.impact(8.0, 0.55);
      A.chord(8.0, [45, 52, 57, 60, 64, 69], { type: 'sawtooth', dur: 1.95, g: 0.03, a: 0.01, hold: true, rel: 1.2, lp: 2200, lp2: 700, lpT: 1.6, spread: 10, rev: 0.5, width: 1.2 });
      [8.0, 8.125, 8.25, 8.375].forEach((t, i) => A.osc(t, { type: 'triangle', f: [440, 554, 659, 880][i], f2: 220, dur: 0.08, g: 0.1 }));
      A.bell(8.65, midi(81), { g: 0.06, dur: 1.3 });
    },
  });
})();
