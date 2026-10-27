/* Batch b4 — 手账风 / 知识科普 / 赛博朋克. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, font, rrect, roughPoly, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Long+Cang&display=block');
  const NS = '"Noto Sans SC", "PingFang SC", sans-serif';
  const MONO = '"JetBrains Mono", monospace';
  const bump = (t, a, up, hold, down) => E.outX(seg(t, a, a + up)) * (1 - E.ioC(seg(t, a + up + hold, a + up + hold + down)));

  /* ======================================================================
     手账风 — stop-motion scrapbook spread, 12 fps with per-frame boil
     ====================================================================== */
  const LC = '"Long Cang", "Ma Shan Zheng", cursive';
  const SZ_INK = '#2c2a40', SZ_RED = '#e0523f';
  const SZ_ROT = -0.012;
  const SZT = {
    tape1: 0.2, tape2: 0.5, pol: 0.85, pt1: 1.42, pt2: 1.64, date: 1.85, sun: 2.66, title: 2.8, hl: 4.02,
    star: 4.3, heart: 4.55, todo: 4.78, items: [5.0, 5.42, 5.84], cap: 6.28, arrow: 6.74, ticks: [7.05, 7.4, 7.75],
    stamp: 8.1, clip: 8.55,
  };
  const SZ_LINES = {
    date: ['10.22 周四 晴', 205, 238, 76, SZT.date, 0.1],
    t1: ['今天也要', 1052, 300, 120, SZT.title, 0.15],
    t2: ['好好生活', 1118, 446, 120, SZT.title + 0.6, 0.15],
    cap: ['和秋天见面啦', 300, 912, 58, SZT.cap, 0.075],
  };
  ['散步 30 分钟', '手冲一杯咖啡', '读完第三章'].forEach((s, i) => { SZ_LINES['todo' + i] = [s, 1130, [688, 790, 892][i], 60, SZT.items[i] + 0.1, 0.3 / s.length]; });
  const SZ_TODO = ['散步 30 分钟', '手冲一杯咖啡', '读完第三章'];
  const SZ_TODO_Y = [688, 790, 892];
  const boil = (f, id, a) => (hash(f * 7.13 + id * 31.7) - 0.5) * 2 * a;

  function szDesk() {
    const cv = offscreen(1920, 1080), g = cv.getContext('2d');
    const wg = g.createLinearGradient(0, 0, 1920, 1080);
    wg.addColorStop(0, '#c99c6e'); wg.addColorStop(1, '#a37650');
    g.fillStyle = wg; g.fillRect(0, 0, 1920, 1080);
    for (let p = 0; p < 7; p++) {
      const y0 = p * 175 - 40;
      g.fillStyle = `rgba(90,55,28,${0.03 + hash(p * 3.7) * 0.07})`; g.fillRect(0, y0, 1920, 175);
      g.fillStyle = 'rgba(58,34,16,0.4)'; g.fillRect(0, y0, 1920, 2);
      g.fillStyle = 'rgba(255,230,190,0.15)'; g.fillRect(0, y0 + 2, 1920, 1);
    }
    g.lineWidth = 1.3;
    for (let k = 0; k < 260; k++) {
      const y = hash(k * 3.1) * 1100;
      g.strokeStyle = `rgba(80,46,22,${0.04 + hash(k) * 0.12})`;
      g.beginPath();
      for (let x = 0; x <= 1920; x += 30) { const yy = y + vnoise(x * 0.003 + k * 1.3, k) * 12; x ? g.lineTo(x, yy) : g.moveTo(x, yy); }
      g.stroke();
    }
    // coffee cup, top-down, peeking from the top right
    g.save();
    g.shadowColor = 'rgba(50,30,15,0.4)'; g.shadowBlur = 30; g.shadowOffsetX = 10; g.shadowOffsetY = 16;
    g.fillStyle = '#efe9df'; g.beginPath(); g.arc(1840, 70, 165, 0, TAU); g.fill();
    g.shadowColor = 'transparent';
    g.fillStyle = '#e3dccf'; g.beginPath(); g.arc(1840, 70, 128, 0, TAU); g.fill();
    g.fillStyle = '#fbf8f2'; g.beginPath(); g.arc(1840, 70, 112, 0, TAU); g.fill();
    g.fillStyle = '#fbf8f2'; rrect(g, 1660, 120, 70, 34, 17); g.fill();
    const cg = g.createRadialGradient(1830, 60, 10, 1840, 70, 96);
    cg.addColorStop(0, '#8a5a35'); cg.addColorStop(0.8, '#5e3a20'); cg.addColorStop(1, '#3f2412');
    g.fillStyle = cg; g.beginPath(); g.arc(1840, 70, 96, 0, TAU); g.fill();
    g.fillStyle = 'rgba(236,214,180,0.9)';
    g.beginPath(); g.moveTo(1840, 130); g.bezierCurveTo(1780, 90, 1790, 40, 1822, 46); g.bezierCurveTo(1836, 48, 1840, 62, 1840, 70);
    g.bezierCurveTo(1840, 62, 1846, 48, 1860, 46); g.bezierCurveTo(1892, 40, 1900, 90, 1840, 130); g.fill();
    g.restore();
    // pencil-shavings / dried leaves top left
    const leaf = (x, y, s, a, col) => {
      g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = col;
      g.shadowColor = 'rgba(50,30,15,0.35)'; g.shadowBlur = 10; g.shadowOffsetY = 6;
      g.beginPath(); g.moveTo(0, -s); g.quadraticCurveTo(s * 0.7, -s * 0.2, 0, s); g.quadraticCurveTo(-s * 0.7, -s * 0.2, 0, -s); g.fill();
      g.shadowColor = 'transparent';
      g.strokeStyle = 'rgba(90,40,10,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -s); g.lineTo(0, s * 1.25); g.stroke();
      g.restore();
    };
    leaf(70, 70, 48, 0.8, '#d9772f'); leaf(40, 150, 34, -0.4, '#c2552b'); leaf(1880, 1000, 44, 2.2, '#e0a33a');
    // the notebook spread
    g.save();
    g.translate(960, 540); g.rotate(SZ_ROT); g.translate(-960, -540);
    g.shadowColor = 'rgba(45,25,10,0.5)'; g.shadowBlur = 46; g.shadowOffsetY = 20; g.shadowOffsetX = 8;
    g.fillStyle = '#5a3a2c'; rrect(g, 126, 70, 1668, 952, 24); g.fill();
    g.shadowColor = 'transparent';
    for (let k = 5; k >= 1; k--) {
      g.fillStyle = k % 2 ? '#e0d7c4' : '#efe7d6';
      rrect(g, 146 - k * 1.5, 86 + k * 1.2, 1628 + k * 3, 914, 10); g.fill();
    }
    [[148, 960], [960, 1772]].forEach(([x0, x1], side) => {
      const pg = g.createLinearGradient(x0, 0, x1, 0);
      if (side === 0) { pg.addColorStop(0, '#f6f0e2'); pg.addColorStop(0.85, '#faf6ec'); pg.addColorStop(1, '#e2d9c6'); }
      else { pg.addColorStop(0, '#e2d9c6'); pg.addColorStop(0.15, '#faf6ec'); pg.addColorStop(1, '#f4eddf'); }
      g.fillStyle = pg; g.fillRect(x0, 86, x1 - x0, 912);
    });
    // dot grid
    g.fillStyle = 'rgba(95,82,70,0.32)';
    for (let x = 182; x < 1750; x += 34) for (let y = 120; y < 980; y += 34) {
      if (Math.abs(x - 960) < 26) continue;
      g.beginPath(); g.arc(x, y, 1.7, 0, TAU); g.fill();
    }
    // paper fibre
    const r = rng(5);
    for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(120,100,80,${r() * 0.06})`; g.fillRect(150 + r() * 1620, 88 + r() * 908, 1 + r() * 3, 1); }
    // spine shadow
    const sp = g.createLinearGradient(900, 0, 1020, 0);
    sp.addColorStop(0, 'rgba(70,50,30,0)'); sp.addColorStop(0.5, 'rgba(70,50,30,0.28)'); sp.addColorStop(1, 'rgba(70,50,30,0)');
    g.fillStyle = sp; g.fillRect(900, 86, 120, 912);
    // ribbon bookmark
    g.fillStyle = '#a9493f';
    g.beginPath(); g.moveTo(1004, 86); g.lineTo(1016, 86); g.quadraticCurveTo(1030, 600, 1060, 1064); g.lineTo(1052, 1052); g.lineTo(1046, 1066); g.quadraticCurveTo(1018, 600, 1004, 86); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(1006, 86, 3, 500);
    g.restore();
    // pencil-case corner: a fineliner lying on the desk below the book
    g.save(); g.translate(480, 1046); g.rotate(-0.03);
    g.shadowColor = 'rgba(40,20,10,0.4)'; g.shadowBlur = 12; g.shadowOffsetY = 8;
    g.fillStyle = '#2f3f5c'; rrect(g, -260, -13, 420, 26, 10); g.fill();
    g.shadowColor = 'transparent';
    g.fillStyle = '#d7d2c8'; g.fillRect(160, -10, 50, 20);
    g.fillStyle = '#222'; g.beginPath(); g.moveTo(210, -6); g.lineTo(236, 0); g.lineTo(210, 6); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(-250, -9, 400, 4);
    g.restore();
    return cv;
  }
  function szLeaves() {
    const cv = offscreen(1920, 1080), g = cv.getContext('2d');
    g.filter = 'blur(18px)';
    g.fillStyle = '#000'; g.strokeStyle = '#000';
    const r = rng(31);
    for (let b = 0; b < 4; b++) {
      const x0 = 2000, y0 = -80 + b * 120, x1 = 1250 + b * 90, y1 = 260 + b * 140;
      g.lineWidth = 8; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, y0 + 40, x1, y1); g.stroke();
      for (let k = 0; k < 14; k++) {
        const u = k / 14, x = lerp(x0, x1, u), y = lerp(y0, y1, u) + Math.sin(u * 3) * 30;
        const s = 26 + r() * 30, a = r() * TAU;
        g.save(); g.translate(x + (r() - 0.5) * 60, y + (r() - 0.5) * 60); g.rotate(a);
        g.beginPath(); g.ellipse(0, 0, s * 1.7, s * 0.7, 0, 0, TAU); g.fill(); g.restore();
      }
    }
    return cv;
  }
  function washi(c, w, h, sty, seed) {
    const r = rng(seed), pts = [], n = Math.max(3, Math.round(h / 8));
    pts.push([-w / 2, -h / 2], [w / 2, -h / 2]);
    for (let k = 1; k < n; k++) pts.push([w / 2 + (k % 2 ? -7 : 0) + (r() - 0.5) * 3, -h / 2 + (k * h) / n]);
    pts.push([w / 2, h / 2], [-w / 2, h / 2]);
    for (let k = n - 1; k > 0; k--) pts.push([-w / 2 + (k % 2 ? 7 : 0) + (r() - 0.5) * 3, -h / 2 + (k * h) / n]);
    const path = () => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };
    c.save();
    c.shadowColor = 'rgba(60,40,20,0.22)'; c.shadowBlur = 4; c.shadowOffsetY = 2;
    path(); c.fillStyle = sty.base; c.fill();
    c.restore();
    c.save(); path(); c.clip();
    if (sty.kind === 'stripe') {
      c.fillStyle = sty.ink;
      for (let x = -w; x < w; x += 26) { c.beginPath(); c.moveTo(x, -h / 2); c.lineTo(x + 12, -h / 2); c.lineTo(x + 12 + h * 0.6, h / 2); c.lineTo(x + h * 0.6, h / 2); c.fill(); }
    } else if (sty.kind === 'dot') {
      c.fillStyle = sty.ink;
      for (let x = -w / 2; x < w / 2; x += 18) for (let y = -h / 2 + 8; y < h / 2; y += 16) { c.beginPath(); c.arc(x + ((y / 16) % 2 ? 9 : 0), y, 3.2, 0, TAU); c.fill(); }
    } else if (sty.kind === 'grid') {
      c.strokeStyle = sty.ink; c.lineWidth = 1.5;
      for (let x = -w / 2; x < w / 2; x += 12) { c.beginPath(); c.moveTo(x, -h / 2); c.lineTo(x, h / 2); c.stroke(); }
      for (let y = -h / 2; y < h / 2; y += 12) { c.beginPath(); c.moveTo(-w / 2, y); c.lineTo(w / 2, y); c.stroke(); }
    }
    const sh = c.createLinearGradient(0, -h / 2, 0, h / 2);
    sh.addColorStop(0, 'rgba(255,255,255,0.28)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.06)');
    c.fillStyle = sh; c.fillRect(-w, -h, w * 2, h * 2);
    c.restore();
  }
  const TAPES = {
    pink: { base: 'rgba(246,176,186,0.88)', ink: 'rgba(255,255,255,0.55)', kind: 'stripe' },
    mint: { base: 'rgba(160,214,196,0.88)', ink: 'rgba(255,255,255,0.75)', kind: 'dot' },
    kraft: { base: 'rgba(236,206,120,0.9)', ink: 'rgba(160,110,40,0.25)', kind: 'grid' },
    blue: { base: 'rgba(150,186,230,0.86)', ink: 'rgba(255,255,255,0.5)', kind: 'stripe' },
  };
  // a slap: oversize and lifted on the first frame, slight undershoot on the second, then flat
  function slapK(tq, t0) {
    const fi = Math.round((tq - t0) * 12);
    if (fi < 0) return null;
    return fi === 0 ? { s: 1.22, lift: 1, r: 0.07 } : fi === 1 ? { s: 0.97, lift: 0.3, r: -0.015 } : { s: 1, lift: 0, r: 0 };
  }
  function placeTape(c, tq, f, t0, x, y, w, h, rot, sty, seed) {
    const k = slapK(tq, t0); if (!k) return;
    c.save();
    c.translate(x + boil(f, seed, 0.9), y + boil(f, seed + 0.3, 0.9));
    c.rotate(rot + k.r + boil(f, seed + 0.6, 0.004));
    c.scale(k.s, k.s);
    washi(c, w, h, sty, seed);
    c.restore();
  }
  function polScene(c, S, dev, f) {
    const sky = c.createLinearGradient(0, 0, 0, S);
    sky.addColorStop(0, '#86c4e4'); sky.addColorStop(0.55, '#cfe4e6'); sky.addColorStop(0.75, '#f6dfbb');
    c.fillStyle = sky; c.fillRect(0, 0, S, S);
    c.fillStyle = '#ffd56a'; c.beginPath(); c.arc(S * 0.74, S * 0.24, S * 0.085, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,240,190,0.4)'; c.beginPath(); c.arc(S * 0.74, S * 0.24, S * 0.14, 0, TAU); c.fill();
    c.fillStyle = '#ffffff';
    [[0.22, 0.2, 1], [0.48, 0.12, 0.7]].forEach(([x, y, s]) => {
      [[0, 0, 0.07], [0.06, -0.025, 0.06], [0.12, 0, 0.055], [0.06, 0.02, 0.06]].forEach(([dx, dy, rr]) => { c.beginPath(); c.arc(S * (x + dx * s), S * (y + dy * s), S * rr * s, 0, TAU); c.fill(); });
    });
    const hill = (base, amp, fr, ph, col) => {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, S);
      for (let x = 0; x <= S; x += 6) c.lineTo(x, S * base - Math.sin(x / S * fr + ph) * S * amp);
      c.lineTo(S, S); c.fill();
    };
    hill(0.62, 0.05, 4, 0.6, '#a9c79a');
    hill(0.74, 0.06, 3, 2.1, '#89b676');
    // path
    c.fillStyle = '#f2ddb0';
    c.beginPath(); c.moveTo(S * 0.38, S); c.bezierCurveTo(S * 0.44, S * 0.86, S * 0.66, S * 0.84, S * 0.58, S * 0.7);
    c.lineTo(S * 0.6, S * 0.7); c.bezierCurveTo(S * 0.72, S * 0.86, S * 0.56, S * 0.9, S * 0.62, S); c.fill();
    const tree = (x, y, s, col, col2) => {
      c.fillStyle = '#7a5236'; c.fillRect(x - s * 0.06, y - s * 0.1, s * 0.12, s * 0.5);
      c.fillStyle = col; c.beginPath(); c.arc(x, y - s * 0.3, s * 0.34, 0, TAU); c.fill();
      c.fillStyle = col2; c.beginPath(); c.arc(x + s * 0.12, y - s * 0.38, s * 0.2, 0, TAU); c.fill();
    };
    tree(S * 0.2, S * 0.78, S * 0.42, '#e8873a', '#f3ad47');
    tree(S * 0.84, S * 0.74, S * 0.32, '#d9632f', '#ef9b3e');
    tree(S * 0.7, S * 0.66, S * 0.16, '#e9a23f', '#f5c35a');
    // little walker in a red coat
    const wx = S * 0.555, wy = S * 0.79;
    c.fillStyle = '#cf4436'; c.beginPath(); c.moveTo(wx - 8, wy + 22); c.lineTo(wx, wy - 4); c.lineTo(wx + 8, wy + 22); c.fill();
    c.fillStyle = '#3b2a22'; c.beginPath(); c.arc(wx, wy - 9, 6, 0, TAU); c.fill();
    c.fillStyle = '#3b2a22'; c.fillRect(wx - 5, wy + 22, 3, 8); c.fillRect(wx + 2, wy + 22, 3, 8);
    // falling leaves (boiling)
    for (let k = 0; k < 7; k++) {
      c.fillStyle = k % 2 ? '#e8873a' : '#f3ad47';
      c.save(); c.translate(S * (0.1 + hash(k * 9.1) * 0.8) + boil(f, k + 40, 2), S * (0.35 + hash(k * 4.7) * 0.4) + boil(f, k + 50, 2)); c.rotate(hash(k) * 6 + boil(f, k, 0.3));
      c.beginPath(); c.ellipse(0, 0, 6, 3, 0, 0, TAU); c.fill(); c.restore();
    }
    // develop: milky then contrasty then clean
    if (dev < 1) {
      c.fillStyle = `rgba(232,228,214,${Math.pow(1 - dev, 1.3)})`; c.fillRect(0, 0, S, S);
      c.fillStyle = `rgba(60,40,80,${0.25 * Math.sin(dev * Math.PI)})`; c.globalCompositeOperation = 'multiply'; c.fillRect(0, 0, S, S); c.globalCompositeOperation = 'source-over';
    }
    const gl = c.createLinearGradient(0, 0, S, S);
    gl.addColorStop(0, 'rgba(255,255,255,0.18)'); gl.addColorStop(0.4, 'rgba(255,255,255,0)');
    c.fillStyle = gl; c.fillRect(0, 0, S, S);
  }
  function szPath(c, pts, p, f, sid, amp = 0.8) {
    const n = Math.max(0, Math.floor(pts.length * p));
    if (n < 2) return null;
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const x = pts[i][0] + boil(f, sid + i * 0.13, amp), y = pts[i][1] + boil(f, sid + i * 0.17 + 9, amp);
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.stroke();
    return pts[n - 1];
  }
  const SZ_STAR = (() => {
    const pts = [], cx = 850, cy = 420, R = 40;
    const v = []; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * (4 * Math.PI / 5); v.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
    v.push(v[0]);
    for (let k = 0; k < 5; k++) for (let s = 0; s < 8; s++) { const u = s / 8; pts.push([lerp(v[k][0], v[k + 1][0], u), lerp(v[k][1], v[k + 1][1], u)]); }
    pts.push(v[5]);
    return pts;
  })();
  const SZ_HEART = (() => {
    const pts = [];
    for (let k = 0; k <= 48; k++) {
      const a = Math.PI + (k / 48) * TAU;
      pts.push([1668 + 2.5 * 16 * Math.pow(Math.sin(a), 3), 396 - 2.5 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))]);
    }
    return pts;
  })();
  const SZ_ARROW = (() => {
    const pts = [];
    for (let k = 0; k <= 30; k++) { const u = k / 30; pts.push([lerp(lerp(684, 770, u), lerp(770, 744, u), u), lerp(lerp(900, 902, u), lerp(902, 806, u), u)]); }
    pts.push([728, 832], [742, 806], [762, 828]);
    return pts;
  })();
  const SZ_SUN = (cx, cy) => {
    const pts = [];
    for (let k = 0; k <= 20; k++) { const a = k / 20 * TAU; pts.push([cx + Math.cos(a) * 15, cy + Math.sin(a) * 15]); }
    return pts;
  };
  function szPencil(c, x, y, lift, f) {
    c.save();
    c.translate(x + lift * 26, y + lift * 30);
    c.rotate(0.62 + boil(f, 77, 0.01));
    c.shadowColor = 'rgba(40,25,10,0.35)'; c.shadowBlur = 14 + lift * 10; c.shadowOffsetX = 14 + lift * 22; c.shadowOffsetY = 20 + lift * 24;
    c.fillStyle = '#efc23a'; c.fillRect(46, -15, 560, 30);
    c.shadowColor = 'transparent';
    c.fillStyle = '#d9a524'; c.fillRect(46, 5, 560, 10);
    c.fillStyle = '#fbe08a'; c.fillRect(46, -12, 560, 5);
    c.fillStyle = '#e8cfa6'; c.beginPath(); c.moveTo(46, -15); c.lineTo(46, 15); c.lineTo(8, 3); c.lineTo(8, -3); c.closePath(); c.fill();
    c.fillStyle = '#3a3640'; c.beginPath(); c.moveTo(14, -5); c.lineTo(14, 5); c.lineTo(0, 0); c.closePath(); c.fill();
    c.fillStyle = '#c9c6c0'; c.fillRect(606, -16, 40, 32);
    c.fillStyle = '#a9a59e'; c.fillRect(614, -16, 4, 32); c.fillRect(630, -16, 4, 32);
    c.fillStyle = '#ef9a9a'; rrect(c, 644, -15, 40, 30, 8); c.fill();
    c.restore();
  }
  function szStampInk(g, f) {
    g.clearRect(0, 0, 300, 300);
    g.save(); g.translate(150, 150);
    const col = '#d4483a';
    g.strokeStyle = col; g.fillStyle = col;
    g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 124, 0, TAU); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 92, 0, TAU); g.stroke();
    const ring = 'HAVE A NICE DAY ✦ GOOD LIFE ✦ ';
    g.font = `800 21px Archivo, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    [...ring].forEach((ch, i) => {
      const a = -Math.PI / 2 + (i / ring.length) * TAU;
      g.save(); g.rotate(a + Math.PI / 2); g.translate(0, -108); g.fillText(ch, 0, 0); g.restore();
    });
    g.font = `800 50px ${MONO}`; g.fillText('10.22', 0, -6);
    g.font = `800 22px Archivo, sans-serif`; g.fillText('THU · 2026', 0, 38);
    g.fillRect(-56, -44, 112, 3); g.fillRect(-56, 60, 112, 3);
    g.restore();
    // worn rubber: knock out speckles and a dry patch
    g.save(); g.globalCompositeOperation = 'destination-out';
    const r = rng(404);
    for (let k = 0; k < 520; k++) { const a = r() * TAU, d = Math.sqrt(r()) * 140; g.globalAlpha = 0.4 + r() * 0.6; g.beginPath(); g.arc(150 + Math.cos(a) * d, 150 + Math.sin(a) * d, 0.6 + r() * 2.2, 0, TAU); g.fill(); }
    const dg = g.createRadialGradient(230, 210, 10, 230, 210, 120);
    dg.addColorStop(0, 'rgba(0,0,0,0.55)'); dg.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 1; g.fillStyle = dg; g.fillRect(0, 0, 300, 300);
    g.restore();
  }
  function szClip(c) {
    c.lineCap = 'round'; c.lineJoin = 'round';
    const path = () => {
      c.beginPath();
      c.moveTo(-12, 70); c.lineTo(-12, -96); c.arc(4, -96, 16, Math.PI, 0); c.lineTo(20, 92); c.arc(-1, 92, 21, 0, Math.PI);
      c.lineTo(-22, -118); c.arc(5, -118, 27, Math.PI, 0); c.lineTo(32, 40);
    };
    c.shadowColor = 'rgba(40,25,10,0.35)'; c.shadowBlur = 6; c.shadowOffsetX = 4; c.shadowOffsetY = 6;
    path(); c.strokeStyle = '#8f949c'; c.lineWidth = 8; c.stroke();
    c.shadowColor = 'transparent';
    path(); c.strokeStyle = '#d9dde3'; c.lineWidth = 3.5; c.stroke();
  }

  MG.film({
    id: 'shouzhang',
    dur: 10,
    poster: 9.5,
    fonts: [
      ['400 120px "Long Cang"', '10.22 周四晴今天也要好好生活散步30分钟手冲一杯咖啡读完第三章和秋天见面啦'],
      ['800 50px "JetBrains Mono"', '10.22'],
      ['800 26px Archivo', 'HAVE A NICE DAY GOOD LIFE THU 2026 TO DO ✦'],
    ],
    meta: {
      cn: '手账风', en: 'Scrapbook / Journal', era: '2019 —',
      origin: '一句中文：源自日本「手帳」拼贴文化与定格动画，成为小红书 / B站 vlog 的日常记录语言',
      works: '代表作：ほぼ日手帳 Hobonichi Techo（2001 年发售首版）；MIDORI Traveler’s Notebook（2006）；mt 和纸胶带（2008）',
      tech: ['12 fps 定格 + 逐帧抖动 boil', '和纸胶带撕边 / 拍立得拼贴', '逐字手写、荧光笔与印章'],
      accent: '#e0523f',
    },
    setup() {
      const ink = offscreen(300, 300);
      return { desk: szDesk(), leaves: szLeaves(), ink, inkG: ink.getContext('2d'), inkDone: false };
    },
    draw(c, t, W, H, st) {
      const tq = Math.floor(t * 12) / 12, f = Math.floor(t * 12);
      // stop-motion camera: whole frame nudges every frame
      const shake = tq >= SZT.stamp && tq < SZT.stamp + 0.17 ? 5 : 0;
      c.save();
      c.translate(960 + boil(f, 999, 1.2 + shake), 540 + boil(f, 998, 1.2 + shake));
      c.rotate(boil(f, 997, 0.0012));
      c.translate(-960, -540);
      c.drawImage(st.desk, -20, -20, W + 40, H + 40);
      c.translate(960, 540); c.rotate(SZ_ROT); c.translate(-960, -540);
      const pen = [];
      // --- washi tape on the spread
      placeTape(c, tq, f, SZT.tape1, 872, 132, 230, 56, 0.72, TAPES.pink, 11);
      placeTape(c, tq, f, SZT.tape2, 1372, 132, 260, 54, 0.04, TAPES.mint, 12);
      // --- polaroid
      if (tq >= SZT.pol) {
        const u = seg(tq, SZT.pol, SZT.pol + 0.34);
        const y = lerp(-760, 0, E.outB(u, 1.1)), rot = lerp(0.42, -0.06, E.outC(u)), s = lerp(1.12, 1, E.outC(u));
        const lift = 1 - E.outC(u);
        c.save();
        c.translate(545 + boil(f, 21, 0.9), 545 + y + boil(f, 22, 0.9));
        c.rotate(rot + boil(f, 23, 0.004)); c.scale(s, s);
        c.shadowColor = 'rgba(50,30,15,0.32)'; c.shadowBlur = 16 + lift * 30; c.shadowOffsetX = 6 + lift * 30; c.shadowOffsetY = 10 + lift * 40;
        c.fillStyle = '#fbfaf5'; c.fillRect(-190, -228, 380, 456);
        c.shadowColor = 'transparent';
        c.fillStyle = 'rgba(0,0,0,0.04)'; c.fillRect(-190, 120, 380, 108);
        c.save(); c.translate(-166, -204);
        c.beginPath(); c.rect(0, 0, 332, 332); c.clip();
        polScene(c, 332, E.ioS(seg(tq, SZT.pol + 0.35, SZT.pol + 1.75)), f);
        c.restore();
        c.strokeStyle = 'rgba(0,0,0,0.12)'; c.lineWidth = 1; c.strokeRect(-166, -204, 332, 332);
        placeTape(c, tq, f, SZT.pt1, -168, -214, 150, 44, -0.72, TAPES.kraft, 13);
        placeTape(c, tq, f, SZT.pt2, 168, -214, 150, 44, 0.72, TAPES.kraft, 14);
        c.restore();
      }
      // --- handwriting
      const write = (key, sid, col = SZ_INK) => {
        const [str, x, y, size, t0, per] = SZ_LINES[key];
        font(c, size, LC); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        let cx = x;
        [...str].forEach((ch, i) => {
          const w = c.measureText(ch).width;
          const a = t0 + i * per, p = seg(tq + 1e-4, a, a + per);
          if (p > 0 && ch !== ' ') {
            const jr = rng(sid * 100 + i);
            const dy = (jr() - 0.5) * size * 0.07, rot = (jr() - 0.5) * 0.09;
            c.save();
            c.beginPath(); c.rect(cx - size * 0.3, y - size * 1.2, (w + size * 0.6) * p, size * 1.6); c.clip();
            c.translate(cx + w / 2 + boil(f, sid * 50 + i, 0.8), y + dy + boil(f, sid * 50 + i + 0.5, 0.8)); c.rotate(rot);
            c.fillStyle = col; c.fillText(ch, -w / 2, 0);
            c.restore();
          }
          if (tq >= a) pen.push([a, cx + w * p, y - size * 0.3]);
          cx += w + size * 0.03;
        });
        return cx;
      };
      const dateEnd = write('date', 1);
      // little sun after 晴
      if (tq >= SZT.sun) {
        c.strokeStyle = '#f0a12a'; c.lineWidth = 4; c.lineCap = 'round';
        const sx = dateEnd + 34, sy = 210, p = seg(tq, SZT.sun, SZT.sun + 0.17);
        const e = szPath(c, SZ_SUN(sx, sy), p, f, 300);
        if (p >= 1) for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.beginPath(); c.moveTo(sx + Math.cos(a) * 22, sy + Math.sin(a) * 22); c.lineTo(sx + Math.cos(a) * 31 + boil(f, k + 310, 0.8), sy + Math.sin(a) * 31); c.stroke(); }
        if (e) pen.push([SZT.sun, e[0], e[1]]);
      }
      // highlighter under 好好生活 (drawn first, multiplied, so the ink reads through)
      if (tq >= SZT.hl) {
        const p = E.outQ(seg(tq, SZT.hl, SZT.hl + 0.42));
        font(c, 120, LC);
        const tw = c.measureText('好好生活').width + 12;
        const x0 = 1100, y0 = 446 - 58, hgt = 64;
        c.save(); c.globalCompositeOperation = 'multiply';
        c.fillStyle = 'rgba(255,224,70,0.78)';
        const r = rng(61), x1 = x0 + (tw + 30) * p;
        c.beginPath(); c.moveTo(x0 + boil(f, 400, 1), y0 + 6);
        for (let x = x0; x <= x1; x += 40) c.lineTo(x, y0 + (r() - 0.5) * 5 + boil(f, x, 0.8));
        c.lineTo(x1 + 6, y0 + 8); c.lineTo(x1, y0 + hgt - 4);
        for (let x = x1; x >= x0; x -= 40) c.lineTo(x, y0 + hgt + (r() - 0.5) * 5);
        c.closePath(); c.fill();
        c.restore();
      }
      write('t1', 2);
      const t2End = write('t2', 3);
      // doodles
      c.lineCap = 'round'; c.lineJoin = 'round';
      if (tq >= SZT.star) {
        c.strokeStyle = '#ef9d25'; c.lineWidth = 5;
        const e = szPath(c, SZ_STAR, seg(tq, SZT.star, SZT.star + 0.34), f, 500);
        if (e) pen.push([SZT.star, e[0], e[1]]);
        if (tq >= SZT.star + 0.34) [[905, 372, 918, 360], [912, 400, 928, 398], [895, 350, 900, 336]].forEach(([a, b, cc, d], i) => { c.beginPath(); c.moveTo(a, b); c.lineTo(cc + boil(f, i + 520, 1), d); c.stroke(); });
      }
      if (tq >= SZT.heart) {
        const p = seg(tq, SZT.heart, SZT.heart + 0.34);
        if (p >= 1) { c.fillStyle = 'rgba(244,150,160,0.55)'; c.beginPath(); SZ_HEART.forEach(([x, y], i) => (i ? c.lineTo(x + 3, y + 3) : c.moveTo(x + 3, y + 3))); c.fill(); }
        c.strokeStyle = '#e2566b'; c.lineWidth = 5;
        const e = szPath(c, SZ_HEART, p, f, 600);
        if (e) pen.push([SZT.heart, e[0], e[1]]);
      }
      // to-do header tape
      if (tq >= SZT.todo) {
        const k = slapK(tq, SZT.todo);
        c.save(); c.translate(1150 + boil(f, 700, 0.9), 572 + boil(f, 701, 0.9)); c.rotate(-0.045 + k.r); c.scale(k.s, k.s);
        washi(c, 200, 52, TAPES.blue, 15);
        text(c, 'TO DO', 0, 2, { font: 'Archivo, sans-serif', weight: 800, size: 28, ls: 6, align: 'center', base: 'middle', color: '#24325a' });
        c.restore();
      }
      // to-do rows: hand-drawn box, item, tick
      SZ_TODO.forEach((s, i) => {
        const t0 = SZT.items[i], y = SZ_TODO_Y[i];
        if (tq < t0) return;
        const bx = 1066, by = y - 40;
        c.strokeStyle = SZ_INK; c.lineWidth = 3.2;
        const bp = seg(tq, t0, t0 + 0.12);
        const box = [[bx, by], [bx + 40, by + 1], [bx + 41, by + 40], [bx - 1, by + 41], [bx, by - 2]];
        const bpts = []; for (let k = 0; k < 4; k++) for (let s2 = 0; s2 < 6; s2++) bpts.push([lerp(box[k][0], box[k + 1][0], s2 / 6), lerp(box[k][1], box[k + 1][1], s2 / 6)]);
        bpts.push(box[4]);
        szPath(c, bpts, bp, f, 800 + i * 10, 0.7);
        write('todo' + i, 10 + i);
        const tk = SZT.ticks[i];
        if (tq >= tk) {
          const p = seg(tq, tk, tk + 0.17);
          c.strokeStyle = SZ_RED; c.lineWidth = 6.5;
          const tpts = []; const A = [bx + 6, by + 20], B = [bx + 18, by + 36], C = [bx + 52, by - 14];
          for (let k = 0; k <= 6; k++) tpts.push([lerp(A[0], B[0], k / 6), lerp(A[1], B[1], k / 6)]);
          for (let k = 1; k <= 10; k++) tpts.push([lerp(B[0], C[0], k / 10), lerp(B[1], C[1], k / 10)]);
          const e = szPath(c, tpts, p, f, 900 + i * 10, 0.9);
          if (e) pen.push([tk, e[0], e[1]]);
        }
      });
      // caption + arrow
      write('cap', 20);
      if (tq >= SZT.arrow) {
        c.strokeStyle = SZ_INK; c.lineWidth = 4;
        const e = szPath(c, SZ_ARROW, seg(tq, SZT.arrow, SZT.arrow + 0.26), f, 1000);
        if (e) pen.push([SZT.arrow, e[0], e[1]]);
      }
      // rubber stamp ink
      const SX = 1618, SY = 860, SR = -0.22;
      if (tq >= SZT.stamp) {
        if (!st.inkDone) { szStampInk(st.inkG, f); st.inkDone = true; }
        c.save(); c.translate(SX + boil(f, 1100, 0.5), SY + boil(f, 1101, 0.5)); c.rotate(SR);
        c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.9;
        c.drawImage(st.ink, -150, -150);
        c.restore();
      }
      // paperclip
      if (tq >= SZT.clip) {
        const u = E.outC(seg(tq, SZT.clip, SZT.clip + 0.25));
        c.save(); c.translate(1690 + boil(f, 1200, 0.6), lerp(-260, 112, u) + boil(f, 1201, 0.6)); c.rotate(0.06);
        szClip(c);
        c.restore();
      }
      // the stamp itself, seen from above
      if (tq >= SZT.stamp - 0.17 && tq < SZT.stamp + 0.34) {
        const d = tq - SZT.stamp;
        const s = d < 0 ? lerp(1.0, 1.55, -d / 0.17) : d < 0.09 ? 1 : lerp(1, 1.6, seg(d, 0.09, 0.34));
        const off = d < 0 ? -d * 900 : d < 0.09 ? 0 : (d - 0.09) * 1400;
        c.save(); c.translate(SX + off * 0.6, SY - off * 0.4);
        c.shadowColor = 'rgba(40,20,10,0.45)'; c.shadowBlur = 10 + (s - 1) * 60; c.shadowOffsetX = 6 + (s - 1) * 80; c.shadowOffsetY = 10 + (s - 1) * 90;
        c.scale(s, s);
        const wg = c.createRadialGradient(-30, -30, 10, 0, 0, 134);
        wg.addColorStop(0, '#c99560'); wg.addColorStop(1, '#8a5a32');
        c.fillStyle = wg; c.beginPath(); c.arc(0, 0, 134, 0, TAU); c.fill();
        c.shadowColor = 'transparent';
        c.strokeStyle = 'rgba(80,45,20,0.35)'; c.lineWidth = 2;
        for (let k = 1; k < 6; k++) { c.beginPath(); c.ellipse(8, 4, 20 * k, 17 * k, 0.3, 0, TAU); c.stroke(); }
        c.fillStyle = '#6d4426'; c.beginPath(); c.arc(0, 0, 54, 0, TAU); c.fill();
        c.fillStyle = 'rgba(255,230,190,0.25)'; c.beginPath(); c.arc(-14, -16, 30, 0, TAU); c.fill();
        c.restore();
      }
      // the pencil follows whatever is being written
      if (tq >= SZT.date && tq < 7.95) {
        let last = null;
        pen.forEach(p => { if (!last || p[0] >= last[0]) last = p; });
        if (last) {
          const idle = tq - last[0];
          const lift = clamp((idle - 0.25) / 0.25);
          szPencil(c, last[1], last[2], lift, f);
        }
      }
      c.restore();
      // window light through leaves
      c.save();
      c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.2;
      c.drawImage(st.leaves, vnoise(tq * 0.6, 3) * 14, vnoise(tq * 0.5, 4) * 10);
      c.restore();
      const lg = c.createRadialGradient(300, 120, 50, 300, 120, 1500);
      lg.addColorStop(0, 'rgba(255,226,170,0.16)'); lg.addColorStop(1, 'rgba(255,226,170,0)');
      c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = lg; c.fillRect(0, 0, W, H); c.restore();
      vignette(c, W, H, 0.38, '60,35,15');
      grain(c, W, H, tq, 0.06, 'multiply');
    },
    score(A) {
      // vinyl bed: hiss, rumble, crackle
      A.noise(0, { type: 'bandpass', f: 4200, q: 0.5, dur: 10, g: 0.02, hold: true, a: 0.2, rel: 0.4 });
      A.noise(0, { type: 'lowpass', f: 160, dur: 10, g: 0.03, hold: true, a: 0.2, rel: 0.4 });
      for (let k = 0; k < 160; k++) {
        const t = hash(k * 1.37) * 9.9;
        A.noise(t, { type: 'highpass', f: 1500 + hash(k * 7) * 5000, dur: 0.003 + hash(k * 3) * 0.008, g: 0.03 + hash(k * 5) * 0.09, pan: hash(k * 11) - 0.5 });
      }
      // electric piano: sine body + tine partials, gently detuned
      const ep = (t, notes, dur, g = 0.05) => notes.forEach((m, i) => {
        const f = midi(m), tt = t + i * 0.014;
        A.osc(tt, { f, dur, g, a: 0.006, rev: 0.3, pan: (i / (notes.length - 1) - 0.5) * 0.7, vib: [4.8, 1.4] });
        A.osc(tt, { f: f * 2.001, dur: dur * 0.4, g: g * 0.22, a: 0.003 });
        A.osc(tt, { f: f * 7.02, dur: 0.12, g: g * 0.06, a: 0.001 });
      });
      const prog = [
        [0.2, [53, 57, 60, 64, 67], 41], [1.7, [52, 55, 59, 62], 40], [3.2, [50, 53, 57, 60, 64], 38],
        [4.7, [55, 60, 62, 65], 43], [6.2, [48, 55, 59, 64], 36], [7.15, [57, 60, 64, 67], 45],
      ];
      prog.forEach(([t, n, b], i) => {
        ep(t, n, 2.6);
        A.osc(t, { f: midi(b), dur: 1.5, g: 0.13, a: 0.01, lp: 400 });
        const nx = i + 1 < prog.length ? prog[i + 1][0] : 8.1;
        A.chord(t, n.slice(0, 3), { type: 'triangle', dur: nx - t + 0.1, g: 0.012, a: 0.25, hold: true, rel: 0.2, lp: 1200, rev: 0.4, width: 0.8 });
      });
      ep(8.1, [53, 57, 60, 64, 69], 2.0, 0.06);
      A.chord(8.1, [53, 57, 60, 64], { type: 'triangle', dur: 1.9, g: 0.016, a: 0.1, hold: true, rel: 0.8, lp: 1400, rev: 0.5, width: 1 });
      A.osc(8.1, { f: midi(41), dur: 1.9, g: 0.14, lp: 400 });
      // lazy swung drums
      const B = 0.75;
      for (let b = 0; b < 8; b++) {
        const t = 1.7 + b * B;
        if (t >= 8.0) break;
        if (b % 4 === 0 || b % 4 === 2.5) A.osc(t, { f: 115, f2: 45, glide: 0.1, dur: 0.3, g: 0.32 });
        if (b % 4 === 2) A.osc(t + B * 0.5, { f: 110, f2: 45, glide: 0.1, dur: 0.28, g: 0.24 });
        if (b % 2 === 1) { A.noise(t, { type: 'bandpass', f: 1600, q: 0.7, dur: 0.16, g: 0.09, rev: 0.2 }); A.noise(t, { type: 'lowpass', f: 400, dur: 0.06, g: 0.06 }); }
        A.noise(t, { type: 'highpass', f: 7500, dur: 0.03, g: 0.03 });
        A.noise(t + B * 0.58, { type: 'highpass', f: 7500, dur: 0.025, g: 0.02 });
      }
      // little EP melody over the to-do section
      [[4.7, 72], [5.075, 74], [5.45, 76], [5.825, 79], [6.2, 76], [6.575, 74]].forEach(([t, m]) => A.osc(t, { f: midi(m), dur: 0.5, g: 0.035, rev: 0.4, pan: 0.2 }));
      // foley
      const rip = t => {
        for (let k = 0; k < 11; k++) A.noise(t - 0.13 + k * 0.011, { type: 'bandpass', f: 1800 + hash(k + t * 13) * 3200, q: 1.3, dur: 0.012, g: 0.1 + hash(k * 3 + t) * 0.06, pan: -0.15 });
        A.noise(t, { type: 'lowpass', f: 900, dur: 0.06, g: 0.2 });
        A.osc(t, { f: 190, f2: 90, glide: 0.05, dur: 0.07, g: 0.1 });
      };
      [SZT.tape1, SZT.tape2, SZT.pt1, SZT.pt2, SZT.todo].forEach(rip);
      // shutter
      A.noise(SZT.pol - 0.02, { type: 'highpass', f: 3000, dur: 0.012, g: 0.3 });
      A.noise(SZT.pol + 0.05, { type: 'highpass', f: 2200, dur: 0.018, g: 0.22 });
      A.noise(SZT.pol + 0.08, { type: 'bandpass', f: 900, q: 5, dur: 0.38, g: 0.05, hold: true, rel: 0.05 });
      A.noise(SZT.pol + 0.34, { type: 'lowpass', f: 1200, dur: 0.06, g: 0.15 });
      // pencil scribbles
      const scribble = (t, d, g = 0.045) => {
        for (let k = 0; k * 0.045 < d; k++) A.noise(t + k * 0.045, { type: 'bandpass', f: 3000 + hash(t * 9 + k) * 2500, q: 1.8, dur: 0.035 + hash(k + t) * 0.02, g: g * (0.6 + hash(k * 2 + t) * 0.6), pan: 0.15 });
      };
      Object.values(SZ_LINES).forEach(([s, , , , t0, per]) => [...s].forEach((ch, i) => { if (ch !== ' ') scribble(t0 + i * per, per * 0.9); }));
      SZ_TODO.forEach((s, i) => scribble(SZT.items[i], 0.1));
      [SZT.sun, SZT.star, SZT.heart, SZT.arrow].forEach(t => scribble(t, 0.3, 0.05));
      A.noise(SZT.hl, { type: 'bandpass', f: 1100, q: 2.5, dur: 0.42, g: 0.05, swell: 0.3 });
      SZT.ticks.forEach((t, i) => { scribble(t, 0.15, 0.06); A.pluck(t + 0.12, midi([79, 83, 86][i]), { dur: 0.6, g: 0.16, rev: 0.3 }); });
      // stamp
      A.noise(SZT.stamp - 0.15, { type: 'bandpass', f: 400, f2: 1400, q: 1, dur: 0.14, g: 0.06, swell: 0.8 });
      A.osc(SZT.stamp, { f: 125, f2: 45, glide: 0.12, dur: 0.38, g: 0.6 });
      A.noise(SZT.stamp, { type: 'lowpass', f: 700, dur: 0.12, g: 0.32 });
      A.noise(SZT.stamp + 0.1, { type: 'bandpass', f: 700, q: 2, dur: 0.09, g: 0.05 });
      // paperclip slide + click
      A.noise(SZT.clip, { type: 'highpass', f: 4000, dur: 0.22, g: 0.04, swell: 0.7 });
      A.bell(SZT.clip + 0.24, 2300, { ratios: [1, 2.4, 4.1], g: 0.035, dur: 0.35, rev: 0.2 });
      A.noise(SZT.clip + 0.24, { type: 'highpass', f: 5000, dur: 0.01, g: 0.12 });
      A.bell(8.75, midi(91), { g: 0.03, dur: 1.4, rev: 0.5 });
    },
  });

  /* ======================================================================
     知识科普 — a glass of water, powers of ten, one big number
     ====================================================================== */
  const KP = { bg: '#0a1530', water: '#3cc8ff', deep: '#1b6fd8', amber: '#ffc247', coral: '#ff6a5c', white: '#eef4ff', mute: 'rgba(214,226,255,0.6)', line: 'rgba(214,226,255,0.2)' };
  const KP_Q = '一杯水里，有多少个水分子？';
  const KP_TXT = KP_Q + '地球人口沙粒（估算）一杯水的分子细菌约个水分子对数坐标每一格位';
  const KP_DIG = '8360000000000000000000000';
  const KP_ZOOM = [
    { a: 2.62, b: 3.17, p: [700, 760], z: '×10' },
    { a: 3.5, b: 4.05, p: [1190, 470], z: '×1000' },
    { a: 4.38, b: 4.93, p: [1250, 730], z: '×1000' },
  ];
  const KP_SCALE = [['1 cm', 60], ['1 mm', 120], ['1 μm', 120], ['1 nm', 240]];
  const AX = { x0: 170, x1: 1750, y: 750 };
  const axX = d => AX.x0 + (AX.x1 - AX.x0) * d / 25;
  // text with ^{sup} and _{sub}; n limits how many characters are shown (typing)
  function rich(c, s, x, y, size, fam, weight, col, align = 'left', n = Infinity) {
    const parts = [], re = /([\^_])\{([^}]*)\}/g;
    let last = 0, m;
    while ((m = re.exec(s))) { if (m.index > last) parts.push([s.slice(last, m.index), 0]); parts.push([m[2], m[1] === '^' ? 1 : -1]); last = re.lastIndex; }
    if (last < s.length) parts.push([s.slice(last), 0]);
    const meas = parts.map(([p, k]) => { font(c, k ? size * 0.6 : size, fam, weight); return c.measureText(p).width; });
    const tot = meas.reduce((a, b) => a + b, 0);
    let cx = align === 'center' ? x - tot / 2 : align === 'right' ? x - tot : x, left = n;
    c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = col;
    if (MG.hasLS !== false && 'letterSpacing' in c) c.letterSpacing = '0px';
    parts.forEach(([p, k], i) => {
      if (left <= 0) return;
      const shown = [...p].slice(0, left).join('');
      left -= [...p].length;
      font(c, k ? size * 0.6 : size, fam, weight);
      c.fillText(shown, cx, y + (k === 1 ? -size * 0.42 : k === -1 ? size * 0.2 : 0));
      cx += meas[i];
    });
    return tot;
  }
  const richLen = s => s.replace(/[\^_]\{([^}]*)\}/g, '$1').length;
  function kpBG(c, t, col = KP.bg) {
    c.fillStyle = col; c.fillRect(-3000, -3000, 8000, 7000);
    const g = c.createRadialGradient(960, 480, 100, 960, 540, 1200);
    g.addColorStop(0, 'rgba(40,80,170,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(-3000, -3000, 8000, 7000);
  }
  function kpGlass(c, t) {
    kpBG(c, t);
    c.fillStyle = 'rgba(214,226,255,0.05)';
    for (let k = 0; k < 40; k++) { const x = hash(k * 3.3) * 1920, y = (hash(k * 5.1) * 1080 - t * 12 * (0.5 + hash(k))) % 1080; c.beginPath(); c.arc(x, y < 0 ? y + 1080 : y, 2 + hash(k) * 3, 0, TAU); c.fill(); }
    const app = E.outB(seg(t, 0.45, 0.85), 1.4);
    if (app <= 0) return;
    const GX = 700, TOP = 395, BOT = 935, TW = 210, BW = 172;
    const gx = y => lerp(TW, BW, (y - TOP) / (BOT - TOP));
    c.save();
    c.translate(GX, BOT); c.scale(app, app); c.translate(-GX, -BOT);
    // long flat shadow
    c.fillStyle = 'rgba(0,0,20,0.35)';
    c.beginPath(); c.moveTo(GX - BW, BOT); c.lineTo(GX + BW, BOT); c.lineTo(GX + BW + 420, BOT + 140); c.lineTo(GX - BW + 300, BOT + 140); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(GX, BOT + 4, BW + 30, 14, 0, 0, TAU); c.fill();
    const glassPath = (inset = 0) => {
      c.beginPath();
      c.moveTo(GX - TW + inset, TOP); c.lineTo(GX - BW + inset, BOT - inset); c.lineTo(GX + BW - inset, BOT - inset); c.lineTo(GX + TW - inset, TOP);
    };
    glassPath(); c.closePath(); c.fillStyle = 'rgba(190,225,255,0.07)'; c.fill();
    // water
    const fill = E.ioC(seg(t, 0.95, 2.25));
    const wy = lerp(BOT - 30, 470, fill);
    c.save(); glassPath(12); c.closePath(); c.clip();
    if (fill > 0) {
      const wg = c.createLinearGradient(0, wy, 0, BOT);
      wg.addColorStop(0, '#4fd4ff'); wg.addColorStop(1, '#1559c4');
      c.fillStyle = wg; c.fillRect(GX - 300, wy, 600, BOT - wy);
      const slosh = Math.sin(t * 9) * 6 * (1 - seg(t, 2.2, 3.0));
      c.fillStyle = '#9be9ff';
      c.beginPath(); c.ellipse(GX, wy, gx(wy) - 12, 16, slosh * 0.004, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(GX - gx(wy) + 30, wy + 20, 22, BOT - wy - 50);
      for (let k = 0; k < 22; k++) {
        const ph = hash(k * 2.7), sp = 60 + hash(k * 5.3) * 80, bx = GX + (hash(k * 9.1) - 0.5) * 260;
        const by = BOT - 40 - ((t * sp + ph * 600) % 600);
        if (by > wy + 10) { c.strokeStyle = 'rgba(220,250,255,0.5)'; c.lineWidth = 2; c.beginPath(); c.arc(bx + Math.sin(t * 3 + k) * 6, by, 3 + hash(k) * 6, 0, TAU); c.stroke(); }
      }
    }
    c.restore();
    // glass walls, thick base, rim
    glassPath(); c.strokeStyle = 'rgba(225,240,255,0.85)'; c.lineWidth = 6; c.lineJoin = 'round'; c.stroke();
    c.fillStyle = 'rgba(225,240,255,0.25)'; c.fillRect(GX - BW + 6, BOT - 34, (BW - 6) * 2, 28);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 10; c.lineCap = 'round';
    c.beginPath(); c.moveTo(GX - TW + 40, TOP + 40); c.lineTo(GX - BW + 34, BOT - 80); c.stroke();
    c.strokeStyle = 'rgba(225,240,255,0.85)'; c.lineWidth = 4; c.beginPath(); c.ellipse(GX, TOP, TW, 16, 0, 0, TAU); c.stroke();
    // graduations
    for (let v = 50; v <= 250; v += 50) {
      const y = lerp(BOT - 30, 470, v / 250), xr = GX + gx(y) - 8;
      c.strokeStyle = 'rgba(225,240,255,0.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(xr - 30, y); c.lineTo(xr, y); c.stroke();
      text(c, String(v), xr - 40, y + 8, { font: MONO, weight: 400, size: 20, align: 'right', color: 'rgba(225,240,255,0.65)' });
    }
    c.restore();
    // faucet slides in, pours, slides out
    const fo = (1 - E.outB(seg(t, 0.5, 0.82), 1.3)) * 1300 + E.inB(seg(t, 2.35, 2.65)) * 1300;
    if (fo < 1250) {
      const sx = GX + 30 + fo;
      c.fillStyle = 'rgba(0,0,20,0.3)'; rrect(c, sx - 16, 262, 1400, 38, 19); c.fill();
      c.fillStyle = '#7f94bd'; rrect(c, sx - 24, 250, 1400, 38, 19); c.fill();
      c.fillStyle = '#a9bbdf'; rrect(c, sx - 24, 250, 1400, 12, 6); c.fill();
      c.fillStyle = '#7f94bd'; rrect(c, sx - 24, 250, 48, 66, 14); c.fill();
      c.fillStyle = '#5b6e96'; rrect(c, sx - 28, 304, 56, 16, 6); c.fill();
      c.fillStyle = '#a9bbdf'; rrect(c, sx + 150, 226, 30, 30, 6); c.fill(); rrect(c, sx + 120, 214, 90, 18, 9); c.fill();
    }
    if (t > 0.8 && t < 2.35) {
      const head = lerp(318, wy, E.inQ(seg(t, 0.8, 0.95))), tail = lerp(318, wy, E.inQ(seg(t, 2.05, 2.3)));
      c.fillStyle = '#5ad6ff';
      c.beginPath();
      for (let y = tail; y <= head; y += 12) c.lineTo(GX + 30 + Math.sin(y * 0.05 + t * 20) * 2 - 9, y);
      for (let y = head; y >= tail; y -= 12) c.lineTo(GX + 30 + Math.sin(y * 0.05 + t * 20) * 2 + 9, y);
      c.fill();
      if (head >= wy - 2 && tail < wy) for (let k = 0; k < 8; k++) {
        const a = -Math.PI / 2 + (hash(k + Math.floor(t * 20)) - 0.5) * 2.2, d = 20 + hash(k * 3 + Math.floor(t * 20)) * 40;
        c.beginPath(); c.arc(GX + 30 + Math.cos(a) * d, wy + Math.sin(a) * d * 0.7, 4, 0, TAU); c.fill();
      }
    }
    // label
    const lb = spring(t - 2.1, 2.6, 0.5);
    if (lb > 0) {
      const lx = 1120, ly = 470;
      c.strokeStyle = KP.amber; c.lineWidth = 3;
      c.beginPath(); c.moveTo(GX + gx(470) + 10, 470); c.lineTo(lerp(GX + gx(470) + 10, lx - 20, clamp(lb)), 470); c.stroke();
      c.fillStyle = KP.amber; c.beginPath(); c.arc(GX + gx(470) + 10, 470, 7, 0, TAU); c.fill();
      c.save(); c.translate(lx + 120, ly); c.scale(lb, lb);
      rrect(c, -120, -42, 240, 84, 42); c.fill();
      text(c, '250 mL', 0, 13, { font: MONO, weight: 800, size: 40, align: 'center', color: KP.bg });
      c.restore();
    }
  }
  function kpMM(c, t) {
    const g = c.createLinearGradient(0, 0, 0, 1080);
    g.addColorStop(0, '#2296e6'); g.addColorStop(1, '#0c3f9c');
    c.fillStyle = '#1a73d0'; c.fillRect(-3000, -3000, 8000, 7000);
    c.fillStyle = g; c.fillRect(-200, -200, 2320, 1480);
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(140,220,255,0.10)'; c.lineWidth = 6;
    for (let k = 0; k < 14; k++) {
      c.beginPath();
      for (let x = -200; x <= 2120; x += 40) { const y = k * 90 + vnoise(x * 0.004 + k * 3 + t * 0.6, k) * 70; x > -200 ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    }
    c.restore();
    for (let k = 0; k < 26; k++) {
      const x = hash(k * 4.1) * 1920, y = (hash(k * 2.3) * 1300 - t * (20 + hash(k) * 30)) % 1300, r = 12 + hash(k * 7.7) * 46;
      c.strokeStyle = 'rgba(220,250,255,0.55)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.18, 0, TAU); c.fill();
    }
    c.fillStyle = 'rgba(220,250,255,0.35)';
    for (let k = 0; k < 60; k++) { c.beginPath(); c.arc(hash(k * 1.9) * 1920, hash(k * 8.3) * 1080, 2, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.arc(1190, 470, 3, 0, TAU); c.fill();
  }
  function kpUM(c, t) {
    const g = c.createLinearGradient(0, 0, 0, 1080);
    g.addColorStop(0, '#0f4aa6'); g.addColorStop(1, '#082866');
    c.fillStyle = '#0c3a88'; c.fillRect(-3000, -3000, 8000, 7000);
    c.fillStyle = g; c.fillRect(-200, -200, 2320, 1480);
    c.fillStyle = 'rgba(160,210,255,0.18)';
    for (let k = 0; k < 90; k++) { c.beginPath(); c.arc(hash(k * 2.9) * 1920 + Math.sin(t + k) * 8, hash(k * 6.1) * 1080, 3 + hash(k) * 5, 0, TAU); c.fill(); }
    // bacterium, ~2 μm long at 120 px/μm
    c.save(); c.translate(880 + Math.sin(t * 1.3) * 10, 540); c.rotate(-0.28 + Math.sin(t) * 0.04);
    c.strokeStyle = 'rgba(140,235,160,0.7)'; c.lineWidth = 3;
    for (let k = 0; k < 4; k++) { c.beginPath(); for (let s = 0; s < 40; s++) { const x = 120 + s * 6, y = (k - 1.5) * 18 + Math.sin(s * 0.5 - t * 12 + k) * 9; s ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    c.fillStyle = '#5ccf7a'; rrect(c, -120, -46, 240, 92, 46); c.fill();
    c.fillStyle = '#8be8a2'; rrect(c, -104, -34, 200, 40, 20); c.fill();
    c.fillStyle = 'rgba(30,110,60,0.6)'; [[-40, 12], [10, 20], [50, 6]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 8, 0, TAU); c.fill(); });
    c.restore();
    c.strokeStyle = KP.mute; c.lineWidth = 2; c.beginPath(); c.moveTo(900, 470); c.lineTo(980, 360); c.lineTo(1060, 360); c.stroke();
    text(c, '细菌', 1075, 356, { font: NS, weight: 700, size: 34, color: KP.white, base: 'middle' });
    text(c, '≈ 2 μm', 1152, 356, { font: MONO, weight: 800, size: 30, color: KP.mute, base: 'middle' });
    c.fillStyle = 'rgba(200,230,255,0.4)';
    for (let k = 0; k < 40; k++) { const a = hash(k) * TAU, d = Math.sqrt(hash(k * 3)) * 60; c.beginPath(); c.arc(1250 + Math.cos(a) * d, 730 + Math.sin(a) * d, 2, 0, TAU); c.fill(); }
  }
  function kpMol(c, x, y, th, sc, alpha, ball = 0, detail = true) {
    const oR = lerp(31, 21, ball), hR = lerp(21, 13, ball), hd = lerp(27, 50, ball), half = (104.5 / 2) * Math.PI / 180;
    c.save(); c.translate(x, y); c.rotate(th); c.scale(sc, sc); c.globalAlpha = alpha;
    const hs = [[Math.sin(-half) * hd, Math.cos(half) * hd], [Math.sin(half) * hd, Math.cos(half) * hd]];
    if (ball > 0) {
      c.strokeStyle = `rgba(238,244,255,${ball * 0.9})`; c.lineWidth = 8; c.lineCap = 'round';
      hs.forEach(([hx, hy]) => { c.beginPath(); c.moveTo(0, 0); c.lineTo(hx, hy); c.stroke(); });
    }
    hs.forEach(([hx, hy]) => {
      c.fillStyle = '#c9d6f0'; c.beginPath(); c.arc(hx, hy, hR, 0, TAU); c.fill();
      if (detail) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(hx - hR * 0.25, hy - hR * 0.25, hR * 0.62, 0, TAU); c.fill(); }
    });
    c.fillStyle = '#d9483f'; c.beginPath(); c.arc(0, 0, oR, 0, TAU); c.fill();
    if (detail) { c.fillStyle = KP.coral; c.beginPath(); c.arc(-oR * 0.2, -oR * 0.22, oR * 0.72, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(-oR * 0.38, -oR * 0.4, oR * 0.2, 0, TAU); c.fill(); }
    c.restore();
  }
  function kpCam(t, st) {
    const m = st.mols[st.hi];
    const z = kf(t, [[5.05, 1], [5.6, 2.3], [6.15, 2.3], [6.65, 0.62], [10, 0.5, E.lin]]);
    const w = kf(t, [[5.05, 0], [5.6, 1], [6.15, 1], [6.65, 0]]);
    return { z, cx: lerp(960, m[0], w), cy: lerp(540, m[1], w) };
  }
  function kpNM(c, t, st, fieldA = 1) {
    c.fillStyle = '#0a1a3c'; c.fillRect(-3000, -3000, 8000, 7000);
    const cam = kpCam(t, st);
    const dim = 0.72 * seg(t, 5.1, 5.4) * (1 - seg(t, 6.15, 6.5));
    const ball = E.ioC(seg(t, 5.45, 5.8)) * (1 - seg(t, 6.15, 6.4));
    const tf = () => { c.translate(960, 540); c.scale(cam.z, cam.z); c.translate(-cam.cx, -cam.cy); };
    c.save(); tf();
    const halfW = 1000 / cam.z, halfH = 600 / cam.z, detail = cam.z > 0.8;
    st.mols.forEach((m, i) => {
      if (i === st.hi) return;
      if (Math.abs(m[0] - cam.cx) > halfW + 60 || Math.abs(m[1] - cam.cy) > halfH + 60) return;
      const x = m[0] + vnoise(t * 2.2 + i * 0.37, 1) * 8, y = m[1] + vnoise(t * 2.2 + i * 0.53, 2) * 8;
      kpMol(c, x, y, m[2] + vnoise(t * 1.6 + i * 0.71, 3) * 0.7, 1, 1, 0, detail);
    });
    c.restore();
    if (dim > 0) { c.fillStyle = `rgba(8,18,44,${dim})`; c.fillRect(-3000, -3000, 8000, 7000); }
    c.save(); tf();
    const m = st.mols[st.hi], i = st.hi;
    const w = E.ioC(seg(t, 5.1, 5.5));
    const x = lerp(m[0] + vnoise(t * 2.2 + i * 0.37, 1) * 8, m[0], w), y = lerp(m[1] + vnoise(t * 2.2 + i * 0.53, 2) * 8, m[1], w);
    kpMol(c, x, y, lerp(m[2] + vnoise(t * 1.6 + i * 0.71, 3) * 0.7, 0, w), lerp(1, 1.7, ball), 1, ball, true);
    c.restore();
    if (fieldA < 1) { c.fillStyle = `rgba(10,26,60,${1 - fieldA})`; c.fillRect(-3000, -3000, 8000, 7000); }
  }
  function kpLens(c, x, y, r, label, a = 1) {
    c.save(); c.globalAlpha = a;
    c.strokeStyle = KP.white; c.lineWidth = 7; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(238,244,255,0.35)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r + 16, 0, TAU); c.stroke();
    for (let k = 0; k < 48; k++) { const an = k / 48 * TAU, l = k % 4 ? 6 : 12; c.beginPath(); c.moveTo(x + Math.cos(an) * (r + 16), y + Math.sin(an) * (r + 16)); c.lineTo(x + Math.cos(an) * (r + 16 + l), y + Math.sin(an) * (r + 16 + l)); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.arc(x, y, r - 18, -2.7, -2.0); c.stroke();
    if (label) {
      const lx = x + r * 0.72 + 30, ly = y - r * 0.72 - 24;
      c.fillStyle = KP.amber; rrect(c, lx - 10, ly - 30, 30 + label.length * 20, 44, 22); c.fill();
      text(c, label, lx + 5 + label.length * 10, ly - 7, { font: MONO, weight: 800, size: 28, align: 'center', base: 'middle', color: KP.bg });
    }
    c.restore();
  }
  MG.film({
    id: 'kepu',
    dur: 10,
    poster: 9.4,
    fonts: [
      ['900 72px "Noto Sans SC"', KP_TXT],
      ['700 36px "Noto Sans SC"', KP_TXT],
      ['800 74px "JetBrains Mono"', '0123456789.×≈÷+-=/ gmolLμnc°HO'],
      ['400 40px "JetBrains Mono"', '0123456789.×≈÷+-=/ gmolLμnc°HO'],
    ],
    meta: {
      cn: '知识科普', en: 'Explainer', era: '2013 —',
      origin: '一句中文：Kurzgesagt 式扁平信息动画 + 数量级缩放，在 B站知识区成为主流科普语言',
      works: '代表作：Eames《Powers of Ten》（1977）；Kurzgesagt – In a Nutshell（2013 起）；回形针PaperClip《关于新冠肺炎的一切》（2020）',
      tech: ['Powers of Ten 放大镜转场', '滚动计数器 → 科学计数法', '按比例绘制的对数坐标'],
      accent: '#ffc247',
    },
    setup() {
      const mols = [], r = rng(23), sp = 84;
      for (let j = -10; j < 27; j++) for (let i = -14; i < 39; i++) {
        mols.push([i * sp + (j % 2 ? sp / 2 : 0) + (r() - 0.5) * 18, j * sp * 0.87 + (r() - 0.5) * 18, r() * TAU]);
      }
      let hi = 0, best = 1e9;
      mols.forEach((m, i) => { const d = Math.hypot(m[0] - 960, m[1] - 520); if (d < best) { best = d; hi = i; } });
      return { mols, hi };
    },
    draw(c, t, W, H, st) {
      const LV = [kpGlass, kpMM, kpUM, (cc, tt) => kpNM(cc, tt, st, 1)];
      let k = 0; while (k < 3 && t >= KP_ZOOM[k].b) k++;
      const tr = k < 3 ? KP_ZOOM[k] : null;
      const lvl = (i, s, cx, cy, tx, ty) => { c.save(); c.translate(tx, ty); c.scale(s, s); c.translate(-cx, -cy); LV[i](c, t, st); c.restore(); };
      let zu = 0;
      if (t < 6.15) {
        if (!tr || t < tr.a - 0.45) lvl(k, 1, 0, 0, 0, 0);
        else if (t < tr.a) {
          lvl(k, 1, 0, 0, 0, 0);
          const [px, py] = tr.p, r = 130 * E.outB(seg(t, tr.a - 0.45, tr.a - 0.2), 1.6);
          if (r > 1) {
            c.save(); c.beginPath(); c.arc(px, py, r, 0, TAU); c.clip(); lvl(k + 1, 0.45, 960, 540, px, py); c.restore();
            kpLens(c, px, py, r, tr.z, clamp(r / 130));
          }
        } else {
          const [px, py] = tr.p;
          zu = E.ioC(seg(t, tr.a, tr.b));
          lvl(k, Math.exp(zu * Math.log(14)), px, py, px, py);
          const R = lerp(130, 1250, E.inQ(zu)), lx = lerp(px, 960, zu), ly = lerp(py, 540, zu);
          c.save(); c.beginPath(); c.arc(lx, ly, R, 0, TAU); c.clip(); lvl(k + 1, lerp(0.45, 1, zu), 960, 540, lx, ly); c.restore();
          kpLens(c, lx, ly, R, zu < 0.3 ? tr.z : '', 1 - zu);
        }
      } else {
        kpNM(c, t, st, lerp(1, 0.16, seg(t, 6.15, 6.7)));
        c.fillStyle = `rgba(10,21,48,${0.55 * seg(t, 6.15, 6.7)})`; c.fillRect(0, 0, W, H);
      }
      // question
      if (t < 2.75) {
        const a = 1 - seg(t, 2.45, 2.7);
        const n = Math.floor(seg(t, 0.12, 1.2) * KP_Q.length + 1e-6);
        font(c, 72, NS, 900);
        const full = c.measureText(KP_Q).width;
        let x = 960 - full / 2;
        c.save(); c.globalAlpha = a; c.translate(0, -30 * seg(t, 2.45, 2.7));
        [...KP_Q].slice(0, n).forEach((ch, i) => {
          const col = i >= 9 && i <= 11 ? KP.water : ch === '？' ? KP.amber : KP.white;
          const pop = 1 + 0.25 * (1 - E.outC(seg(t, 0.12 + i * 1.08 / KP_Q.length, 0.12 + i * 1.08 / KP_Q.length + 0.1)));
          const w = c.measureText(ch).width;
          c.save(); c.translate(x + w / 2, 140); c.scale(pop, pop);
          text(c, ch, 0, 0, { font: NS, weight: 900, size: 72, align: 'center', base: 'middle', color: col });
          c.restore();
          x += w;
        });
        if (Math.floor(t * 3) % 2 === 0 || n < KP_Q.length) { c.fillStyle = KP.water; c.fillRect(x + 8, 105, 6, 72); }
        c.restore();
      }
      // scale bar HUD
      if (t > 0.7 && t < 6.4) {
        const a = seg(t, 0.7, 1.0) * (1 - seg(t, 6.1, 6.35));
        const li = k + (zu > 0.5 ? 1 : 0), [lab, len0] = KP_SCALE[Math.min(3, li)];
        const len = (tr && zu > 0 ? lerp(KP_SCALE[k][1], KP_SCALE[k + 1][1], zu) : len0) * (k === 3 ? kpCam(t, st).z : 1);
        c.save(); c.globalAlpha = a;
        c.fillStyle = KP.white; c.fillRect(120, 990, len, 6); c.fillRect(120, 978, 4, 30); c.fillRect(116 + len, 978, 4, 30);
        const pop = 1 + 0.3 * Math.max(0, 1 - Math.abs(zu - 0.5) * 6);
        c.translate(120, 960); c.scale(pop, pop);
        text(c, lab, 0, 0, { font: MONO, weight: 800, size: 34, color: KP.white });
        c.restore();
        text(c, 'SCALE', 120, 1040, { font: MONO, weight: 400, size: 18, ls: 6, color: `rgba(214,226,255,${0.5 * a})` });
      }
      // molecule callouts
      if (t > 5.45 && t < 6.25) {
        const a = seg(t, 5.55, 5.75) * (1 - seg(t, 6.05, 6.2));
        const cam = kpCam(t, st), m = st.mols[st.hi];
        const S = (x, y) => [960 + (x - cam.cx) * cam.z, 540 + (y - cam.cy) * cam.z];
        const [ox, oy] = S(m[0], m[1]);
        const half = (104.5 / 2) * Math.PI / 180, hd = 50 * 1.7 * cam.z;
        c.save(); c.globalAlpha = a;
        const ap = E.outC(seg(t, 5.6, 5.9));
        c.strokeStyle = KP.amber; c.lineWidth = 4;
        c.beginPath(); c.arc(ox, oy, 125, Math.PI / 2 - half, Math.PI / 2 - half + 2 * half * ap); c.stroke();
        c.setLineDash([6, 8]); c.lineWidth = 2;
        [-1, 1].forEach(s => { c.beginPath(); c.moveTo(ox, oy); c.lineTo(ox + Math.sin(s * half) * hd * 1.8, oy + Math.cos(half) * hd * 1.55); c.stroke(); });
        c.setLineDash([]);
        text(c, '104.5°', ox, oy + 285, { font: MONO, weight: 800, size: 40, align: 'center', base: 'middle', color: KP.amber });
        text(c, 'O', ox, oy + 2, { font: MONO, weight: 800, size: 44, align: 'center', base: 'middle', color: '#fff' });
        [-1, 1].forEach(s => text(c, 'H', ox + Math.sin(s * half) * hd, oy + Math.cos(half) * hd + 2, { font: MONO, weight: 800, size: 34, align: 'center', base: 'middle', color: KP.bg }));
        c.strokeStyle = KP.mute; c.lineWidth = 2;
        c.beginPath(); c.moveTo(ox + 70, oy - 70); c.lineTo(ox + 180, oy - 180); c.lineTo(ox + 260, oy - 180); c.stroke();
        rich(c, 'H_{2}O', ox + 275, oy - 168, 56, MONO, 800, KP.white);
        text(c, '1 个水分子', ox + 278, oy - 118, { font: NS, weight: 700, size: 30, color: KP.mute });
        font(c, 30, NS, 700); const cw1 = c.measureText('1 个水分子').width;
        text(c, '≈ 0.28 nm', ox + 292 + cw1, oy - 118, { font: MONO, weight: 400, size: 28, color: KP.mute });
        c.restore();
      }
      // counter → scientific notation → header
      if (t >= 6.1) {
        const ca = seg(t, 6.1, 6.3);
        const up = E.ioC(seg(t, 8.0, 8.4));
        const size = 74;
        font(c, size, MONO, 800);
        const dw = c.measureText('0').width, gap = dw * 0.45;
        const xs = []; let x = 0;
        for (let i = 0; i < 25; i++) { xs.push(x); x += dw; if ((25 - 1 - i) % 3 === 0 && i < 24) x += gap; }
        const tot = x, x0 = 960 - tot / 2, y = 560;
        // final layout of "8.36 × 10^24"
        const fs = 128; font(c, fs, MONO, 800);
        const fw = c.measureText('8.36 × 10').width, fdw = c.measureText('0').width;
        font(c, fs * 0.6, MONO, 800); const ew = c.measureText('24').width;
        font(c, 50, NS, 700); const cnw = c.measureText(' 个水分子').width * up;
        const fx = 960 - (fw + ew) / 2 - cnw / 2;
        const cu = E.ioC(seg(t, 7.3, 7.7));
        c.save();
        c.translate(960, lerp(0, -345, up) + 560); c.scale(lerp(1, 0.78, up), lerp(1, 0.78, up)); c.translate(-960, -560);
        c.globalAlpha = ca;
        const rowH = size * 1.15;
        for (let i = 0; i < 25; i++) {
          const fin = +KP_DIG[i], ts = 6.35 + i * 0.034;
          const p = fin + 10 * (2 + Math.floor(i * 0.2)) * (1 - E.outQt(seg(t, 6.1, ts)));
          const base = Math.floor(p), fr = p - base, settled = t >= ts;
          let dx = x0 + xs[i], dy = y, s = 1, al = 1;
          const keep = i < 3;
          if (cu > 0) {
            if (keep) { const tx = fx + [0, 2, 3][i] * fdw; dx = lerp(dx, tx, cu); s = lerp(1, fs / size, cu); }
            else { const tx = fx + fw + ew * 0.3; dx = lerp(dx, tx, E.inQ(cu)); dy = lerp(y, y - fs * 0.45, cu); s = lerp(1, 0.3, cu); al = 1 - E.inQ(cu); }
          }
          if (al <= 0.01) continue;
          c.save(); c.globalAlpha = ca * al;
          c.translate(dx, dy); c.scale(s, s);
          c.beginPath(); c.rect(-4, -rowH * 0.82, dw + 8, rowH); c.clip();
          for (let q = 0; q < 2; q++) {
            const dig = (base + q) % 10, yy = (fr - q) * rowH * -1 + 0;
            text(c, String(dig), 0, -yy, { font: MONO, weight: 800, size, color: settled ? (keep && cu > 0 ? KP.amber : KP.white) : 'rgba(140,210,255,0.9)' });
            if (settled) break;
          }
          c.restore();
        }
        // brace over the 24 digits after the leading 8
        const bra = bump(t, 7.12, 0.12, 0.12, 0.1);
        if (bra > 0) {
          c.save(); c.globalAlpha = bra; c.strokeStyle = KP.amber; c.lineWidth = 3;
          const bx0 = x0 + xs[1], bx1 = x0 + xs[24] + dw, by = y + 34;
          c.beginPath(); c.moveTo(bx0, by); c.quadraticCurveTo(bx0, by + 18, bx0 + 20, by + 18); c.lineTo((bx0 + bx1) / 2 - 16, by + 18); c.lineTo((bx0 + bx1) / 2, by + 34); c.lineTo((bx0 + bx1) / 2 + 16, by + 18); c.lineTo(bx1 - 20, by + 18); c.quadraticCurveTo(bx1, by + 18, bx1, by); c.stroke();
          text(c, '24', (bx0 + bx1) / 2 - 8, by + 82, { font: MONO, weight: 800, size: 40, align: 'right', color: KP.amber });
          text(c, '位', (bx0 + bx1) / 2 - 2, by + 80, { font: NS, weight: 700, size: 36, color: KP.amber });
          c.restore();
        }
        if (cu > 0) {
          const ea = E.outC(seg(cu, 0.45, 1));
          c.globalAlpha = ca * ea;
          text(c, '.', fx + fdw, y, { font: MONO, weight: 800, size: fs, color: KP.amber });
          text(c, '× 10', fx + 5 * fdw, y, { font: MONO, weight: 800, size: fs, color: KP.amber });
          const sp = 1 + 0.4 * (1 - E.outB(seg(cu, 0.6, 1), 2));
          c.save(); c.translate(fx + fw, y - fs * 0.42); c.scale(sp, sp);
          text(c, '24', 0, 0, { font: MONO, weight: 800, size: fs * 0.6, color: KP.amber });
          c.restore();
          if (up > 0) text(c, ' 个水分子', fx + fw + ew + 10, y, { font: NS, weight: 700, size: 64, color: `rgba(238,244,255,${up})` });
        }
        c.restore();
        // formula
        const F = '250 g ÷ 18 g/mol × 6.022×10^{23}';
        const fn = Math.floor(seg(t, 7.55, 7.95) * richLen(F));
        if (fn > 0) {
          c.save();
          c.translate(960, lerp(0, -345, up) + 560); c.scale(lerp(1, 0.78, up), lerp(1, 0.78, up)); c.translate(-960, -560);
          rich(c, F, 960, 690, 44, MONO, 400, KP.mute, 'center', fn);
          c.restore();
        }
      }
      // log axis, to scale
      if (t >= 8.0) {
        const ap = E.ioC(seg(t, 8.0, 8.5)), xe = lerp(AX.x0, AX.x1, ap);
        c.strokeStyle = KP.white; c.lineWidth = 4; c.lineCap = 'round';
        c.beginPath(); c.moveTo(AX.x0, AX.y); c.lineTo(xe, AX.y); c.stroke();
        for (let d = 0; d <= 25; d++) {
          const x = axX(d); if (x > xe + 1) break;
          const major = d % 5 === 0;
          c.lineWidth = major ? 3 : 2; c.strokeStyle = major ? KP.white : 'rgba(238,244,255,0.6)';
          c.beginPath(); c.moveTo(x, AX.y - (major ? 18 : 11)); c.lineTo(x, AX.y + (major ? 18 : 11)); c.stroke();
          if (d < 25) for (let m = 2; m <= 9; m++) { const mx = axX(d + Math.log10(m)); if (mx > xe) break; c.strokeStyle = 'rgba(238,244,255,0.28)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(mx, AX.y - 5); c.lineTo(mx, AX.y + 5); c.stroke(); }
          if (major) rich(c, `10^{${d}}`, x, AX.y + 66, 34, MONO, 400, KP.mute, 'center');
        }
        text(c, '对数坐标 · 每一格 = ×10', AX.x0, 950, { font: NS, weight: 700, size: 26, color: `rgba(214,226,255,${0.55 * seg(t, 8.4, 8.7)})` });
        const mk = (t0, d, name, val, col, stem, emph) => {
          if (t < t0) return;
          const s = spring(t - t0, 2.6, 0.45), x = axX(d);
          const dy = (1 - Math.min(1, s)) * -240 + (s > 1 ? (s - 1) * 30 : 0);
          const top = AX.y - stem;
          c.strokeStyle = col; c.lineWidth = 3;
          c.beginPath(); c.moveTo(x, AX.y); c.lineTo(x, lerp(AX.y, top + 14, clamp(s))); c.stroke();
          if (emph) {
            const pr = (t - t0) % 1.1 / 1.1;
            c.strokeStyle = `rgba(60,200,255,${0.7 * (1 - pr)})`; c.lineWidth = 3; c.beginPath(); c.arc(x, AX.y, 14 + pr * 50, 0, TAU); c.stroke();
            const gl = c.createRadialGradient(x, AX.y, 0, x, AX.y, 90); gl.addColorStop(0, 'rgba(60,200,255,0.45)'); gl.addColorStop(1, 'rgba(60,200,255,0)');
            c.fillStyle = gl; c.beginPath(); c.arc(x, AX.y, 90, 0, TAU); c.fill();
          }
          c.fillStyle = col; c.beginPath(); c.arc(x, AX.y, emph ? 13 : 10, 0, TAU); c.fill();
          c.fillStyle = KP.bg; c.beginPath(); c.arc(x, AX.y, emph ? 5 : 4, 0, TAU); c.fill();
          c.save(); c.globalAlpha = clamp((t - t0) / 0.2); c.translate(0, dy);
          text(c, name, x, top - 58, { font: NS, weight: 700, size: emph ? 44 : 38, align: 'center', color: emph ? KP.water : KP.white });
          rich(c, val, x, top - 8, emph ? 42 : 36, MONO, 800, col, 'center');
          c.restore();
        };
        mk(8.35, Math.log10(8e9), '地球人口', '≈ 8×10^{9}', KP.white, 175, false);
        mk(8.6, Math.log10(7.5e18), '地球沙粒（估算）', '≈ 7.5×10^{18}', '#f2cf8a', 300, false);
        mk(8.85, Math.log10(8.36e24), '一杯水的分子', '8.36×10^{24}', KP.water, 175, true);
      }
      grain(c, W, H, t, 0.035, 'overlay');
      vignette(c, W, H, 0.45, '2,6,20');
    },
    score(A) {
      const pl = (t, m, g = 0.2, o = {}) => A.pluck(t, midi(m), { dur: 0.5, g, bright: 0.55, decay: 0.985, rev: 0.25, ...o });
      // curious pizzicato line (D lydian), staccato eighths
      const mel = [[0.15, 74], [0.4, 81], [0.65, 80], [0.9, 76], [1.15, 74], [1.4, 81], [1.65, 83], [1.9, 85], [2.15, 86], [2.4, 88]];
      mel.forEach(([t, m], i) => { pl(t, m, 0.18, { pan: i % 2 ? 0.3 : -0.3 }); if (i % 2 === 0) pl(t, m - 24, 0.22, { bright: 0.35, lp: 900 }); });
      // soft pad bed
      A.chord(0.1, [50, 57, 62, 66], { type: 'sine', dur: 2.5, g: 0.014, a: 0.6, hold: true, rel: 0.4, rev: 0.5, width: 1 });
      A.chord(4.9, [47, 54, 59, 62], { type: 'triangle', dur: 2.8, g: 0.012, a: 0.4, hold: true, rel: 0.5, lp: 1200, rev: 0.5, width: 1 });
      A.osc(6.1, { type: 'sine', f: midi(38), dur: 1.6, g: 0.05, a: 0.3, hold: true, rel: 0.3 });
      for (let k = 0; k < 6; k++) A.osc(6.1 + k * 0.18, { type: 'triangle', f: midi([74, 78, 81, 78, 83, 81][k]), dur: 0.15, g: 0.025, pan: k % 2 ? 0.4 : -0.4 });
      // typing ticks
      for (let i = 0; i < KP_Q.length; i++) {
        const t = 0.12 + i * 1.08 / KP_Q.length;
        A.noise(t, { type: 'highpass', f: 5500, dur: 0.018, g: 0.1, pan: (i / 13 - 0.5) * 0.6 });
        A.osc(t, { type: 'square', f: 1900, dur: 0.012, g: 0.02 });
      }
      // glass appears + pour
      A.osc(0.45, { f: 1320, dur: 0.6, g: 0.05, rev: 0.4 });
      A.noise(0.85, { type: 'bandpass', f: 500, f2: 1600, q: 1.5, dur: 1.45, g: 0.06, swell: 0.2, sweep: 1.4 });
      for (let k = 0; k < 18; k++) { const t = 0.95 + hash(k * 3.3) * 1.3; A.osc(t, { f: 500 + hash(k) * 700, f2: 1100 + hash(k * 2) * 1400, glide: 0.04, dur: 0.05, g: 0.035 }); }
      pl(2.1, 81, 0.2); pl(2.18, 86, 0.16);
      // zooms
      KP_ZOOM.forEach((z, i) => {
        A.osc(z.a - 0.42, { f: 1800 + i * 300, dur: 0.12, g: 0.05 });
        A.whoosh(z.a - 0.05, 0.62, { f1: 200, f2: 5000, g: 0.22, swell: 0.75, rev: 0.3 });
        A.osc(z.b - 0.05, { f: 95, f2: 32, glide: 0.5, dur: 0.8, g: 0.4 });
        A.osc(z.a, { type: 'sawtooth', f: midi(38 + i * 5), f2: midi(50 + i * 5), glide: 0.55, dur: 0.6, g: 0.035, lp: 700, lp2: 3000, lpT: 0.55 });
      });
      // molecule world: bubbly plinks
      for (let k = 0; k < 16; k++) A.osc(4.95 + k * 0.07 + hash(k) * 0.04, { f: 900 + hash(k * 5) * 1600, f2: 1600 + hash(k * 7) * 1800, glide: 0.03, dur: 0.06, g: 0.025, pan: hash(k * 9) - 0.5 });
      A.bell(5.1, midi(86), { g: 0.06, dur: 1.2 });
      A.osc(5.6, { f: 600, f2: 1200, glide: 0.3, dur: 0.32, g: 0.04, type: 'triangle' });
      pl(5.75, 81, 0.2); pl(5.87, 85, 0.18); pl(5.99, 88, 0.16);
      A.whoosh(6.1, 0.55, { f1: 4000, f2: 300, g: 0.16, swell: 0.4 });
      // counter: fast roll ticks then per-digit settle blips
      for (let k = 0; k * 0.03 < 1.1; k++) A.noise(6.12 + k * 0.03, { type: 'highpass', f: 4000, dur: 0.008, g: 0.04 + k * 0.0012 });
      for (let i = 0; i < 25; i++) A.osc(6.35 + i * 0.034, { type: 'square', f: 900 + i * 45, dur: 0.035, g: 0.026, lp: 4000, pan: (i / 24 - 0.5) * 0.8 });
      A.osc(7.12, { f: midi(81), dur: 0.3, g: 0.06 });
      A.whoosh(7.28, 0.42, { f1: 5000, f2: 400, g: 0.16, swell: 0.6 });
      A.osc(7.68, { f: 90, f2: 40, glide: 0.3, dur: 0.5, g: 0.45 });
      A.chord(7.68, [62, 66, 69, 73], { type: 'triangle', dur: 1.2, g: 0.035, rev: 0.4, width: 1 });
      pl(7.68, 86, 0.22); pl(7.76, 90, 0.18);
      const F = '250 g ÷ 18 g/mol × 6.022×10^{23}';
      for (let i = 0; i < richLen(F); i++) A.noise(7.55 + i * 0.4 / richLen(F), { type: 'highpass', f: 6000, dur: 0.012, g: 0.06 });
      // axis + markers + final chime
      A.whoosh(8.0, 0.5, { f1: 300, f2: 2500, g: 0.12 });
      for (let d = 0; d <= 25; d++) A.noise(8.0 + 0.5 * (d / 25), { type: 'highpass', f: 3500, dur: 0.01, g: d % 5 ? 0.025 : 0.06 });
      [[8.35, 74], [8.6, 78], [8.85, 81]].forEach(([t, m]) => { pl(t, m, 0.26); A.osc(t, { f: 160, f2: 60, glide: 0.12, dur: 0.2, g: 0.25 }); });
      A.bell(8.88, midi(86), { g: 0.12, dur: 2.6, rev: 0.6 });
      A.bell(8.95, midi(93), { g: 0.06, dur: 2.2, rev: 0.6 });
      A.chord(8.85, [50, 57, 62, 66, 69, 76], { type: 'sine', dur: 1.15, g: 0.035, a: 0.05, hold: true, rel: 0.6, rev: 0.5, width: 1.2 });
    },
  });

  /* ======================================================================
     赛博朋克 — rain, neon, puddle mirror, hologram title
     ====================================================================== */
  const CY = { mag: '#ff2bd1', cyan: '#29f3ff', grn: '#38ffa8', red: '#ff3a4c', amb: '#ffb43a', vio: '#a86bff' };
  const HY = 700;
  const CY_SIGNS = [
    { s: '夜城', x: 330, y: 108, size: 118, col: CY.mag, t0: 0.42, kind: 'v' },
    { s: '霓虹', x: 1640, y: 84, size: 104, col: CY.cyan, t0: 1.05, kind: 'v' },
    { s: '药', x: 1830, y: 380, size: 92, col: CY.grn, t0: 1.6, kind: 'cross' },
    { s: '酒', x: 545, y: 470, size: 78, col: CY.red, t0: 2.0, kind: 'circle' },
    { s: '旅馆', x: 130, y: 330, size: 62, col: CY.vio, t0: 2.4, kind: 'v' },
    { s: '拉面', x: 1060, y: 642, size: 50, col: CY.amb, t0: 2.8, kind: 'h' },
  ];
  const CY_BURSTS = [[0.42, 0.07, 0.35], [1.05, 0.06, 0.25], [3.25, 0.08, 0.3], [5.6, 0.45, 0.9], [6.35, 0.22, 0.6], [6.86, 0.14, 0.8]];
  const camX = t => t * 8;
  function cyLevel(t, t0, seed) {
    if (t < t0) return 0;
    if (t >= 6.86 && t < 7.0) return 0.04;          // power drain before the title ignites
    const d = t - t0;
    if (d < 0.04) return 1;
    if (d < 0.5) { const f = Math.floor(t * 36); return hash(f * 1.7 + seed) < 0.3 + d * 1.4 ? 1 : 0.06; }
    if (t >= 7.0 && t < 7.08) return 1.15;
    const f = Math.floor(t * 24);
    if (hash(f * 3.1 + seed * 7) < 0.025) return 0.3;
    return 0.93 + 0.07 * Math.sin(t * 110 + seed);
  }
  function cyBuildings(w, h, col, winCols, seed, minH, maxH, winP, bwMin, bwMax) {
    const cv = offscreen(w, h), g = cv.getContext('2d'), r = rng(seed);
    let x = -30;
    while (x < w) {
      const bw = bwMin + r() * (bwMax - bwMin), bh = minH + r() * (maxH - minH), top = h - bh;
      g.fillStyle = col; g.fillRect(x, top, bw, bh + 2);
      if (r() < 0.45) g.fillRect(x + bw * 0.2, top - 24 - r() * 40, bw * 0.55, 60);
      if (r() < 0.55) { const ax = x + bw * (0.3 + r() * 0.4), ah = 60 + r() * 140; g.fillRect(ax, top - ah, 3, ah); g.fillStyle = 'rgba(255,40,60,0.9)'; g.fillRect(ax - 2, top - ah - 4, 7, 5); g.fillStyle = col; }
      const wy0 = top + 12, ww = 3 + Math.floor(r() * 3), rowOn = r();
      for (let wy = wy0; wy < h - 8; wy += 11) for (let wx = x + 7; wx < x + bw - 9; wx += ww + 5) {
        if (r() < winP * (0.4 + rowOn)) { const k = r(); g.fillStyle = winCols[k < 0.6 ? 0 : k < 0.8 ? 1 : k < 0.93 ? 2 : 3]; g.globalAlpha = 0.2 + r() * 0.6; g.fillRect(wx, wy, ww, 5); g.globalAlpha = 1; }
      }
      if (r() < 0.3) { g.fillStyle = winCols[0]; g.globalAlpha = 0.5; g.fillRect(x + 4, top + 30, 2, bh - 40); g.globalAlpha = 1; }
      x += bw + r() * 26 - 8;
    }
    return cv;
  }
  function cyNear() {
    const cv = offscreen(2200, HY + 4), g = cv.getContext('2d'), r = rng(91);
    const col = '#07040d';
    g.fillStyle = col;
    // left tower block with ledges
    g.beginPath(); g.moveTo(0, 0); g.lineTo(470, 0); g.lineTo(470, 230); g.lineTo(505, 230); g.lineTo(505, 600); g.lineTo(560, 600); g.lineTo(560, HY + 4); g.lineTo(0, HY + 4); g.fill();
    // right tower block
    g.beginPath(); g.moveTo(1470, 0); g.lineTo(2200, 0); g.lineTo(2200, HY + 4); g.lineTo(1420, HY + 4); g.lineTo(1420, 560); g.lineTo(1470, 560); g.fill();
    // street-level shops between
    g.fillRect(540, 600, 900, HY - 596);
    g.fillRect(760, 585, 520, 20);
    // windows: dim panes with a few lit, blinds
    const win = (x0, x1, y0, y1) => {
      for (let y = y0; y < y1; y += 42) for (let x = x0; x < x1; x += 34) {
        const v = r();
        if (v < 0.5) { g.fillStyle = 'rgba(28,20,48,0.55)'; g.fillRect(x, y, 20, 26); }
        else if (v < 0.565) { g.fillStyle = ['rgba(255,170,90,0.7)', 'rgba(90,220,255,0.5)', 'rgba(255,90,200,0.45)'][Math.floor(r() * 3)]; g.fillRect(x, y, 20, 26); g.fillStyle = 'rgba(0,0,0,0.4)'; for (let b = 0; b < 26; b += 5) g.fillRect(x, y + b, 20, 2); }
      }
    };
    win(30, 440, 20, 580); win(1500, 2180, 20, 540);
    // AC units, pipes, fire escapes
    g.fillStyle = '#120a1e';
    for (let k = 0; k < 18; k++) { const left = k < 8, x = left ? 20 + r() * 400 : 1500 + r() * 650, y = 40 + r() * 520; g.fillRect(x, y, 38, 26); }
    g.strokeStyle = '#140c22'; g.lineWidth = 6;
    [60, 420, 1530, 2050].forEach(x => { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, HY); g.stroke(); });
    g.strokeStyle = '#1a1028'; g.lineWidth = 3;
    for (let y = 120; y < 560; y += 110) { g.strokeRect(1560, y, 170, 70); g.beginPath(); g.moveTo(1560, y + 70); g.lineTo(1730, y); g.stroke(); }
    // shop fronts with warm light
    [[600, 160], [800, 220], [1060, 200], [1290, 120]].forEach(([x, w]) => {
      const sg = g.createLinearGradient(0, 640, 0, HY);
      sg.addColorStop(0, 'rgba(255,170,90,0.55)'); sg.addColorStop(1, 'rgba(255,120,60,0.15)');
      g.fillStyle = sg; g.fillRect(x, 640, w, HY - 640);
      g.fillStyle = 'rgba(0,0,0,0.55)'; for (let k = 0; k < w; k += 18) g.fillRect(x + k, 640, 2, HY - 640);
    });
    // awnings / cables
    g.strokeStyle = 'rgba(10,6,16,1)'; g.lineWidth = 2;
    for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(470, 30 + k * 34); g.quadraticCurveTo(960, 120 + k * 40, 1470, 20 + k * 30); g.stroke(); }
    return cv;
  }
  function tube(g, drawPath, col, lvl, lw) {
    if (lvl < 0.2) { drawPath(); g.strokeStyle = 'rgba(70,50,80,0.9)'; g.lineWidth = lw; g.stroke(); return; }
    g.save();
    g.globalAlpha = Math.min(1, lvl);
    drawPath(); g.strokeStyle = col; g.globalAlpha = 0.35 * Math.min(1, lvl); g.lineWidth = lw * 3.2; g.stroke();
    g.globalAlpha = Math.min(1, lvl);
    drawPath(); g.strokeStyle = col; g.lineWidth = lw * 1.4; g.stroke();
    drawPath(); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = lw * 0.45; g.stroke();
    g.restore();
  }
  function neonText(g, s, x, y, size, col, lvl, align = 'center') {
    g.font = `700 ${size}px ${NS}`; g.textAlign = align; g.textBaseline = 'middle'; g.lineJoin = 'round';
    if (lvl >= 0.2) { g.save(); g.globalAlpha = 0.18 * Math.min(1, lvl); g.fillStyle = col; g.fillText(s, x, y); g.restore(); }
    const lw = Math.max(2, size * 0.035);
    if (lvl < 0.2) { g.strokeStyle = 'rgba(70,50,80,0.9)'; g.lineWidth = lw; g.strokeText(s, x, y); return; }
    g.save();
    g.globalAlpha = 0.35 * Math.min(1, lvl); g.strokeStyle = col; g.lineWidth = lw * 3.2; g.strokeText(s, x, y);
    g.globalAlpha = Math.min(1, lvl); g.lineWidth = lw * 1.4; g.strokeText(s, x, y);
    g.strokeStyle = 'rgba(255,255,255,0.92)'; g.lineWidth = lw * 0.45; g.strokeText(s, x, y);
    g.restore();
  }
  function cySign(g, sg, ox, t, i) {
    const lvl = cyLevel(t, sg.t0, i * 13 + 5), x = sg.x - ox, sz = sg.size, col = sg.col;
    const chars = [...sg.s];
    let bx, by, bw, bh;
    if (sg.kind === 'v' || sg.kind === 'cross') { bw = sz * 1.36; bh = chars.length * sz * 1.12 + sz * 0.44; bx = x - bw / 2; by = sg.y; }
    else if (sg.kind === 'h') { bw = chars.length * sz * 1.15 + sz * 0.7; bh = sz * 1.5; bx = x - bw / 2; by = sg.y - bh / 2; }
    else { bw = bh = sz * 1.7; bx = x - bw / 2; by = sg.y - bh / 2; }
    // spill light on the wall
    if (lvl > 0.2) {
      g.save(); g.globalCompositeOperation = 'lighter';
      const rg = g.createRadialGradient(x, by + bh / 2, 10, x, by + bh / 2, Math.max(bw, bh) * 1.6);
      rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = 0.22 * Math.min(1, lvl); g.fillStyle = rg; g.fillRect(x - 600, by - 400, 1200, bh + 800);
      g.restore();
    }
    // bracket
    g.fillStyle = '#05030a'; g.fillRect(x - 3, by - 30, 6, 30);
    g.fillStyle = 'rgba(6,3,12,0.92)';
    if (sg.kind === 'circle') { g.beginPath(); g.arc(x, sg.y, bw / 2, 0, TAU); g.fill(); }
    else { rrect(g, bx, by, bw, bh, 10); g.fill(); }
    const lw = Math.max(2.5, sz * 0.04);
    if (sg.kind === 'circle') tube(g, () => { g.beginPath(); g.arc(x, sg.y, bw / 2 - 8, 0, TAU); }, col, lvl, lw);
    else tube(g, () => { rrect(g, bx + 8, by + 8, bw - 16, bh - 16, 8); }, col, lvl, lw);
    if (sg.kind === 'h') neonText(g, sg.s, x, sg.y + 2, sz, col, lvl);
    else if (sg.kind === 'circle') neonText(g, sg.s, x, sg.y + 3, sz, col, lvl);
    else chars.forEach((ch, k) => neonText(g, ch, x, by + sz * 0.22 + sz * 1.12 * k + sz * 0.56, sz, col, lvl));
    if (sg.kind === 'cross') {
      const cx = x, cy = by - 70, a = 24, b = 9;
      tube(g, () => { g.beginPath(); g.moveTo(cx - b, cy - a); g.lineTo(cx + b, cy - a); g.lineTo(cx + b, cy - b); g.lineTo(cx + a, cy - b); g.lineTo(cx + a, cy + b); g.lineTo(cx + b, cy + b); g.lineTo(cx + b, cy + a); g.lineTo(cx - b, cy + a); g.lineTo(cx - b, cy + b); g.lineTo(cx - a, cy + b); g.lineTo(cx - a, cy - b); g.lineTo(cx - b, cy - b); g.closePath(); }, col, lvl, 3);
    }
  }
  function cyCar(g, x, y, s, t) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.save(); g.globalCompositeOperation = 'lighter';
    const beam = g.createLinearGradient(-60, 0, -560, 0);
    beam.addColorStop(0, 'rgba(220,240,255,0.35)'); beam.addColorStop(1, 'rgba(220,240,255,0)');
    g.fillStyle = beam; g.beginPath(); g.moveTo(-58, -4); g.lineTo(-560, -70); g.lineTo(-560, 80); g.lineTo(-58, 6); g.fill();
    const ug = g.createRadialGradient(0, 22, 4, 0, 22, 90);
    ug.addColorStop(0, 'rgba(41,243,255,0.6)'); ug.addColorStop(1, 'rgba(41,243,255,0)');
    g.fillStyle = ug; g.beginPath(); g.ellipse(0, 22, 90, 26, 0, 0, TAU); g.fill();
    g.restore();
    g.fillStyle = '#0e0716';
    g.beginPath(); g.moveTo(-70, 2); g.quadraticCurveTo(-60, -12, -30, -16); g.lineTo(-10, -30); g.lineTo(30, -30); g.lineTo(52, -16); g.lineTo(74, -10); g.lineTo(78, 6); g.lineTo(60, 14); g.lineTo(-60, 14); g.closePath(); g.fill();
    g.fillStyle = 'rgba(41,243,255,0.8)'; g.beginPath(); g.moveTo(-26, -16); g.lineTo(-6, -26); g.lineTo(26, -26); g.lineTo(44, -16); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(-4, -25, 14, 3);
    g.fillStyle = '#1b1028'; g.fillRect(-48, 12, 30, 8); g.fillRect(28, 12, 30, 8);
    g.fillStyle = CY.mag; g.fillRect(-60, 6, 136, 2.5);
    g.fillStyle = '#ffffff'; g.fillRect(-72, -2, 9, 5);
    g.fillStyle = '#ff2a4a'; g.fillRect(70, -8, 10, 6);
    g.restore();
  }
  MG.film({
    id: 'cyberpunk',
    dur: 10,
    poster: 9.3,
    fonts: [
      ['900 190px "Noto Sans SC"', '赛博朋克'],
      ['700 120px "Noto Sans SC"', '赛博朋克夜城霓虹药酒旅馆拉面高科技低生活·'],
      ['800 34px "JetBrains Mono"', 'CYBERPUNK 2077 NEON'],
    ],
    meta: {
      cn: '赛博朋克', en: 'Cyberpunk Neon', era: '1982 —',
      origin: '一句中文：《银翼杀手》《攻壳机动队》奠定霓虹雨夜的视觉母题，抖音「赛博重庆」「赛博国风」剪辑让它在中文互联网走红',
      works: '代表作：《银翼杀手》Blade Runner（1982）；《攻壳机动队》（1995）；《赛博朋克 2077》（2020）',
      tech: ['霓虹管辉光 bloom + 电流闪烁', '雨夜积水倒影（镜像 + 波纹位移）', '全息投影 / RGB 故障'],
      accent: '#ff2bd1',
    },
    setup() {
      const mk = (w, h) => { const cv = offscreen(w, h); return { c: cv, g: cv.getContext('2d') }; };
      const r = rng(55);
      const asphalt = mk(1920, 1080 - HY);
      asphalt.g.filter = 'blur(10px)';
      for (let k = 0; k < 32; k++) {
        const y = r() * (1080 - HY), x = r() * 1920, rw = 80 + r() * 260 * (0.4 + y / 380), rh = 10 + r() * 30 * (0.4 + y / 380);
        asphalt.g.fillStyle = `rgba(8,6,14,${0.4 + r() * 0.35})`;
        asphalt.g.beginPath(); asphalt.g.ellipse(x, y, rw, rh, 0, 0, TAU); asphalt.g.fill();
      }
      return {
        far: cyBuildings(2400, HY, '#1a0f33', ['#ffd9a0', '#9fdcff', '#ff8fd8', '#ffffff'], 3, 260, 620, 0.12, 50, 130),
        mid: cyBuildings(2400, HY, '#110922', ['#ffc27a', '#7fe3ff', '#ff7fd0', '#ffffff'], 8, 160, 420, 0.14, 80, 200),
        near: cyNear(),
        S: mk(1920, 1080), F: mk(1920, 1080), T: mk(1920, 1080), U: mk(1920, 1080),
        B: mk(480, 270), B2: mk(480, 270), B3: mk(480, 270),
        asphalt: asphalt.c,
        rain: Array.from({ length: 520 }, (_, i) => ({ x: r() * 2300 - 200, y: r() * 1300, sp: 1500 + r() * 700, len: i < 400 ? 22 + r() * 22 : 60 + r() * 60, near: i >= 400, tint: r() })),
        drops: Array.from({ length: 70 }, () => ({ x: r() * 1920, y: HY + 10 + Math.pow(r(), 0.7) * 370, ph: r(), per: 0.5 + r() * 0.6 })),
      };
    },
    draw(c, t, W, H, st) {
      const { S, F, T, U, B, B2, B3 } = st;
      const g = S.g, ox = camX(t);
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none';
      // sky + smog
      const sky = g.createLinearGradient(0, 0, 0, HY);
      sky.addColorStop(0, '#04020a'); sky.addColorStop(0.55, '#170a2c'); sky.addColorStop(1, '#3d1152');
      g.fillStyle = sky; g.fillRect(0, 0, 1920, HY);
      // searchlights
      g.save(); g.globalCompositeOperation = 'lighter';
      [[640, 0.5, 0.35], [1400, 1.9, 0.28]].forEach(([bx, ph, sp]) => {
        const a = -Math.PI / 2 + Math.sin(t * sp + ph) * 0.45;
        const bg = g.createLinearGradient(bx, HY - 200, bx + Math.cos(a) * 900, HY - 200 + Math.sin(a) * 900);
        bg.addColorStop(0, 'rgba(160,140,255,0.13)'); bg.addColorStop(1, 'rgba(160,140,255,0)');
        g.fillStyle = bg; g.beginPath(); g.moveTo(bx - 8, HY - 200);
        g.lineTo(bx + Math.cos(a - 0.06) * 1100, HY - 200 + Math.sin(a - 0.06) * 1100); g.lineTo(bx + Math.cos(a + 0.06) * 1100, HY - 200 + Math.sin(a + 0.06) * 1100); g.closePath(); g.fill();
      });
      g.restore();
      g.drawImage(st.far, -200 - ox * 0.25, 0);
      // distant car
      const t2 = seg(t, 0.6, 7.0);
      if (t2 > 0 && t2 < 1) {
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 18; k++) { const u = t2 - k * 0.006; if (u < 0) break; const x = lerp(-100, 2050, u), y = 250 - 30 * u; g.fillStyle = `rgba(41,243,255,${0.6 * (1 - k / 18)})`; g.fillRect(x - 3, y, 6, 2.5); }
        g.restore();
      }
      const haze = g.createLinearGradient(0, 200, 0, HY);
      haze.addColorStop(0, 'rgba(60,20,90,0)'); haze.addColorStop(1, 'rgba(120,40,140,0.45)');
      g.fillStyle = haze; g.fillRect(0, 0, 1920, HY);
      g.drawImage(st.mid, -150 - ox * 0.55, 0);
      const haze2 = g.createLinearGradient(0, 380, 0, HY);
      haze2.addColorStop(0, 'rgba(80,20,100,0)'); haze2.addColorStop(1, 'rgba(90,30,120,0.35)');
      g.fillStyle = haze2; g.fillRect(0, 0, 1920, HY);
      // hover car (between mid and near layers)
      const tc = seg(t, 3.3, 5.5);
      if (tc > 0 && tc < 1) {
        const P = u => [lerp(2150, -420, u), 280 + 150 * u + 40 * Math.sin(u * Math.PI), lerp(1.0, 2.2, u)];
        g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
        for (let k = 1; k <= 30; k++) {
          const u0 = Math.max(0, tc - (k - 1) * 0.02), u1 = Math.max(0, tc - k * 0.02);
          const [x0, y0, s0] = P(u0), [x1, y1] = P(u1);
          const a = 1 - k / 30;
          g.strokeStyle = `rgba(255,42,74,${0.75 * a})`; g.lineWidth = 5 * s0;
          g.beginPath(); g.moveTo(x0 + 66 * s0, y0 - 3 * s0); g.lineTo(x1 + 66 * s0, y1 - 3 * s0); g.stroke();
          g.strokeStyle = `rgba(41,243,255,${0.45 * a})`; g.lineWidth = 3 * s0;
          g.beginPath(); g.moveTo(x0, y0 + 20 * s0); g.lineTo(x1, y1 + 20 * s0); g.stroke();
        }
        g.restore();
        const [cx, cy, cs] = P(tc);
        cyCar(g, cx, cy, cs, t);
      }
      // title (projected into the gap so it reflects in the street)
      const TX = 960, TYp = 345, TS = 186;
      if (t >= 5.6) {
        g.font = `900 ${TS}px ${NS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        const r = rng(Math.floor(t * 30) * 7 + 3);
        if (t < 7.0) {
          // hologram: projector cone, scanline slices, RGB ghosts
          const build = E.outC(seg(t, 5.6, 6.3));
          const flick = r() < 0.12 ? 0.4 : 1;
          g.save(); g.globalCompositeOperation = 'lighter';
          const cone = g.createLinearGradient(0, HY, 0, TYp - 150);
          cone.addColorStop(0, 'rgba(41,243,255,0.22)'); cone.addColorStop(1, 'rgba(41,243,255,0)');
          g.fillStyle = cone; g.globalAlpha = flick * build;
          g.beginPath(); g.moveTo(TX - 30, HY - 60); g.lineTo(TX - 430, TYp - 140); g.lineTo(TX + 430, TYp - 140); g.lineTo(TX + 30, HY - 60); g.fill();
          g.fillStyle = '#9ffbff'; g.globalAlpha = 0.9; g.fillRect(TX - 40, HY - 66, 80, 8);
          const top = lerp(TYp + 110, TYp - 110, build);
          let gi = 0; CY_BURSTS.forEach(([a, d, amp]) => { if (t >= a && t < a + d) gi = Math.max(gi, amp); });
          for (let y = TYp - 110; y < TYp + 110; y += 7) {
            if (y < top) continue;
            const dx = (r() < 0.12 + gi * 0.5 ? (r() - 0.5) * (40 + gi * 160) : 0) + Math.sin(y * 0.3 + t * 30) * 1.5;
            g.save(); g.beginPath(); g.rect(0, y, 1920, 5); g.clip();
            g.globalAlpha = 0.55 * flick; g.fillStyle = CY.mag; g.fillText('赛博朋克', TX + dx - 6 - gi * 14, TYp);
            g.globalAlpha = 0.75 * flick; g.fillStyle = 'rgba(80,245,255,1)'; g.fillText('赛博朋克', TX + dx + 3, TYp);
            g.restore();
          }
          g.restore();
        } else {
          // neon tubes, per-character buzz
          const chars = [...'赛博朋克'];
          const tw = g.measureText('赛博朋克').width, cw = tw / 4;
          const lw = TS * 0.032;
          chars.forEach((ch, i) => {
            let lvl = 1;
            const d = t - 7.0;
            if (d < 0.5) lvl = hash(Math.floor(t * 30) * 3.3 + i) < 0.35 + d * 1.3 ? 1 : 0.08;
            if (d < 0.05) lvl = 1;
            if (i === 2 && ((t > 8.3 && t < 8.42) || (t > 9.15 && t < 9.22))) lvl = Math.floor(t * 40) % 2 ? 0.08 : 0.7;
            if (i === 2 && hash(Math.floor(t * 24) + 77) < 0.04) lvl = 0.35;
            const x = TX - tw / 2 + cw * (i + 0.5);
            g.save(); g.lineJoin = 'round';
            if (lvl > 0.2) {
              const L = Math.min(1, lvl);
              g.globalAlpha = 0.85 * L; g.fillStyle = '#0fb8d8'; g.fillText(ch, x + 8, TYp + 8);
              g.globalAlpha = 0.5 * L; g.strokeStyle = CY.mag; g.lineWidth = lw * 3; g.strokeText(ch, x, TYp);
              g.globalAlpha = L; g.fillStyle = '#ffd2f4'; g.fillText(ch, x, TYp);
              g.strokeStyle = CY.mag; g.lineWidth = lw * 0.7; g.strokeText(ch, x, TYp);
            } else { g.globalAlpha = 0.9; g.fillStyle = '#2a1830'; g.fillText(ch, x, TYp); g.strokeStyle = 'rgba(90,60,90,0.9)'; g.lineWidth = 2; g.strokeText(ch, x, TYp); }
            g.restore();
          });
          const sa = cyLevel(t, 7.5, 41);
          g.save();
          g.font = `800 34px ${MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
          if ('letterSpacing' in g) g.letterSpacing = '22px';
          g.globalAlpha = sa > 0.2 ? 1 : 0.35; g.fillStyle = sa > 0.2 ? CY.cyan : '#3a2a4a';
          g.fillText('CYBERPUNK', TX + 11, TYp + 132);
          if ('letterSpacing' in g) g.letterSpacing = '0px';
          g.restore();
          if (t >= 7.8) {
            const ml = cyLevel(t, 7.8, 57);
            g.save(); g.font = `700 40px ${NS}`; g.textAlign = 'center'; g.textBaseline = 'middle';
            if ('letterSpacing' in g) g.letterSpacing = '14px';
            g.fillStyle = ml > 0.2 ? `rgba(235,246,255,${0.9 * Math.min(1, ml)})` : '#2a2036';
            g.fillText('高科技 · 低生活', TX + 7, TYp + 190);
            if ('letterSpacing' in g) g.letterSpacing = '0px';
            g.restore();
          }
        }
      }
      // near layer + signs
      g.drawImage(st.near, -ox, 0);
      CY_SIGNS.forEach((sg, i) => cySign(g, sg, ox, t, i));
      // street: mirror the city with ripples
      g.fillStyle = '#06040b'; g.fillRect(0, HY, 1920, 1080 - HY);
      for (let y = HY; y < 1080; y += 3) {
        const d = y - HY, sy = Math.max(0, HY - d - 3);
        const dx = Math.sin(d * 0.09 - t * 4) * (1.5 + d * 0.014) + vnoise(d * 0.05 + t * 1.7, 3) * (2 + d * 0.03);
        g.drawImage(S.c, 0, sy, 1920, 3, dx, y, 1920, 3);
      }
      const dark = g.createLinearGradient(0, HY, 0, 1080);
      dark.addColorStop(0, 'rgba(6,4,12,0.1)'); dark.addColorStop(1, 'rgba(6,4,12,0.5)');
      g.fillStyle = dark; g.fillRect(0, HY, 1920, 1080 - HY);
      g.drawImage(st.asphalt, 0, HY);
      g.fillStyle = 'rgba(255,120,220,0.25)'; g.fillRect(0, HY, 1920, 2);
      // rain hitting the puddle
      g.save(); g.lineWidth = 1.5;
      st.drops.forEach(dp => {
        const u = ((t / dp.per + dp.ph) % 1), s = (dp.y - HY) / 380;
        g.strokeStyle = `rgba(210,220,255,${0.35 * (1 - u)})`;
        g.beginPath(); g.ellipse(dp.x, dp.y, 4 + u * 40 * (0.4 + s), (1.5 + u * 9) * (0.4 + s), 0, 0, TAU); g.stroke();
      });
      g.restore();
      // bloom: downsample, square for threshold, blur
      B.g.globalCompositeOperation = 'source-over'; B.g.drawImage(S.c, 0, 0, 480, 270);
      B.g.globalCompositeOperation = 'multiply'; B.g.drawImage(B.c, 0, 0); B.g.globalCompositeOperation = 'source-over';
      B2.g.clearRect(0, 0, 480, 270); B2.g.filter = 'blur(3px)'; B2.g.drawImage(B.c, 0, 0); B2.g.filter = 'none';
      B3.g.clearRect(0, 0, 480, 270); B3.g.filter = 'blur(10px)'; B3.g.drawImage(B.c, 0, 0); B3.g.filter = 'none';
      const fg = F.g;
      fg.globalCompositeOperation = 'source-over'; fg.globalAlpha = 1;
      fg.drawImage(S.c, 0, 0);
      fg.globalCompositeOperation = 'lighter';
      fg.globalAlpha = 0.9; fg.drawImage(B2.c, 0, 0, 1920, 1080);
      fg.globalAlpha = 1.0; fg.drawImage(B3.c, 0, 0, 1920, 1080);
      fg.globalAlpha = 1; fg.globalCompositeOperation = 'source-over';
      // rain
      fg.lineCap = 'round';
      st.rain.forEach(d => {
        const y = ((d.y + t * d.sp) % 1300) - 120, x = d.x + y * 0.13;
        if (d.near) { fg.strokeStyle = d.tint < 0.15 ? 'rgba(255,120,230,0.45)' : d.tint < 0.3 ? 'rgba(100,240,255,0.45)' : 'rgba(200,215,255,0.32)'; fg.lineWidth = 2.4; }
        else { fg.strokeStyle = 'rgba(180,195,255,0.22)'; fg.lineWidth = 1.2; }
        fg.beginPath(); fg.moveTo(x, y); fg.lineTo(x - d.len * 0.13, y - d.len); fg.stroke();
      });
      // glitch
      const fr = Math.floor(t * 24), r = rng(fr * 131 + 9);
      let gi = 0; CY_BURSTS.forEach(([a, d, amp]) => { if (t >= a && t < a + d) gi = Math.max(gi, amp * (0.6 + 0.4 * r())); });
      if (t >= 7.0 && t < 7.12) gi = Math.max(gi, 0.7);
      if (gi > 0.05) {
        T.g.globalCompositeOperation = 'source-over'; T.g.drawImage(F.c, 0, 0);
        const sx = gi * 26;
        U.g.globalCompositeOperation = 'source-over'; U.g.drawImage(T.c, 0, 0);
        U.g.globalCompositeOperation = 'multiply'; U.g.fillStyle = '#00ffff'; U.g.fillRect(0, 0, 1920, 1080);
        fg.drawImage(U.c, -sx, 0);
        U.g.globalCompositeOperation = 'source-over'; U.g.drawImage(T.c, 0, 0);
        U.g.globalCompositeOperation = 'multiply'; U.g.fillStyle = '#ff0000'; U.g.fillRect(0, 0, 1920, 1080);
        U.g.globalCompositeOperation = 'source-over';
        fg.globalCompositeOperation = 'lighter'; fg.drawImage(U.c, sx, 0); fg.globalCompositeOperation = 'source-over';
        const n = Math.floor(gi * 16);
        for (let i = 0; i < n; i++) {
          const y = Math.floor(r() * 1080), h = 3 + Math.floor(r() * 50), dx = (r() - 0.5) * 260 * gi;
          fg.drawImage(T.c, 0, y, 1920, h, dx, y, 1920, h);
          if (r() < 0.25) { fg.globalCompositeOperation = 'difference'; fg.fillStyle = r() < 0.5 ? CY.cyan : CY.mag; fg.fillRect(Math.floor(r() * 60) * 32, y, 64 + r() * 300, h); fg.globalCompositeOperation = 'source-over'; }
        }
      }
      // composite with a slow push-in and a kick on ignition
      const z = lerp(1.09, 1, E.outC(seg(t, 0, 6))) + 0.012 * Math.exp(-Math.max(0, t - 7) * 6) * (t >= 7 ? 1 : 0);
      const sh = t >= 7 && t < 7.3 ? (hash(fr) - 0.5) * 14 * Math.exp(-(t - 7) * 12) : 0;
      c.save();
      c.translate(960 + sh, 480); c.scale(z, z); c.translate(-960, -480);
      c.drawImage(F.c, 0, 0, W, H);
      c.restore();
      // scanlines, vignette, grain
      c.fillStyle = 'rgba(0,0,0,0.12)';
      for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1);
      vignette(c, W, H, 0.6, '4,0,10');
      grain(c, W, H, t, 0.05, 'overlay');
      // darkness at the very start
      const fade = 1 - seg(t, 0, 0.35);
      if (fade > 0) { c.fillStyle = `rgba(0,0,0,${fade})`; c.fillRect(0, 0, W, H); }
    },
    score(A) {
      // rain bed
      A.noise(0, { type: 'lowpass', f: 2200, dur: 10, g: 0.09, hold: true, a: 0.5, rel: 0.3 });
      A.noise(0, { type: 'highpass', f: 6500, dur: 10, g: 0.035, hold: true, a: 0.5, rel: 0.3 });
      for (let k = 0; k < 90; k++) A.noise(hash(k * 2.1) * 9.8, { type: 'bandpass', f: 1500 + hash(k * 4.3) * 4000, q: 3, dur: 0.02, g: 0.03 + hash(k) * 0.04, pan: hash(k * 6.7) - 0.5 });
      // drone and dark pads
      A.osc(0, { type: 'sawtooth', f: midi(33), dur: 10, g: 0.05, a: 1.2, hold: true, rel: 0.4, lp: 260, detune: -7 });
      A.osc(0, { type: 'sawtooth', f: midi(33), dur: 10, g: 0.05, a: 1.2, hold: true, rel: 0.4, lp: 260, detune: 7 });
      A.chord(0.42, [45, 52, 57, 60, 64], { type: 'sawtooth', dur: 3.0, g: 0.018, a: 0.6, hold: true, rel: 1, lp: 1100, spread: 14, rev: 0.5, width: 1.2 });
      A.chord(3.3, [41, 48, 53, 57, 64], { type: 'sawtooth', dur: 2.4, g: 0.018, a: 0.4, hold: true, rel: 0.6, lp: 1400, spread: 14, rev: 0.5, width: 1.2 });
      A.chord(5.6, [46, 53, 58, 61, 65], { type: 'sawtooth', dur: 1.3, g: 0.02, a: 0.2, hold: true, rel: 0.1, lp: 1800, spread: 18, rev: 0.5, width: 1.2 });
      // sign ignitions: strike, buzz crackle, sub
      CY_SIGNS.forEach((sg, i) => {
        const t = sg.t0;
        A.noise(t, { type: 'bandpass', f: 2500, q: 0.8, dur: 0.05, g: 0.16, crush: true, pan: (sg.x / 1920 - 0.5) * 1.2 });
        for (let k = 0; k < 9; k++) if (hash(k * 3.1 + i) < 0.6) A.osc(t + k * 0.05, { type: 'sawtooth', f: 120, dur: 0.035, g: 0.05, lp: 1800, crush: true, pan: (sg.x / 1920 - 0.5) * 1.2 });
        A.osc(t + 0.5, { type: 'sawtooth', f: 120 + i * 0.7, dur: 6.36 - t, g: 0.0045, a: 0.2, hold: true, rel: 0.02, lp: 900, pan: (sg.x / 1920 - 0.5) * 1.2 });
        if (i < 2) { A.osc(t, { f: 58, f2: 28, glide: 0.9, dur: 1.4, g: 0.55 }); A.noise(t, { type: 'lowpass', f: 300, dur: 0.4, g: 0.15 }); }
      });
      // arpeggio as the car arrives
      const arp = [57, 60, 64, 67, 69, 67, 64, 60];
      for (let k = 0; k < 18; k++) {
        const t = 3.3 + k * 0.125, m = arp[k % 8] + (k >= 8 ? -4 : 0);
        A.osc(t, { type: 'sawtooth', f: midi(m), dur: 0.11, g: 0.04, lp: 900 + k * 120, q: 4, rev: 0.4, pan: k % 2 ? 0.35 : -0.35 });
      }
      for (let k = 0; k < 9; k++) A.osc(3.3 + k * 0.25, { type: 'sawtooth', f: midi(k < 4 ? 33 : 29), dur: 0.22, g: 0.07, lp: 400 });
      // hover car doppler pass
      A.osc(3.6, { type: 'sawtooth', f: 260, f2: 150, glide: 1.8, dur: 1.9, g: 0.05, lp: 700, lp2: 2400, lpT: 1.0, a: 0.8, pan: 0.4 });
      A.whoosh(3.7, 1.6, { f1: 250, f2: 3000, g: 0.25, swell: 0.62, rev: 0.4 });
      A.osc(4.55, { f: 70, f2: 35, glide: 0.8, dur: 1.0, g: 0.35 });
      // glitch bursts
      CY_BURSTS.forEach(([t, d, amp], j) => {
        A.noise(t, { type: 'bandpass', f: 1000 + j * 600, q: 0.8, dur: d, g: 0.1 * amp + 0.04, crush: true, hold: true, rel: 0.01 });
        for (let k = 0; k * 0.03 < d; k++) A.osc(t + k * 0.03, { type: 'square', f: 300 + hash(j * 17 + k) * 2400, dur: 0.025, g: 0.03, crush: true, hold: true, rel: 0.005 });
      });
      // hologram shimmer
      A.osc(5.6, { type: 'triangle', f: midi(81), dur: 1.3, g: 0.025, vib: [9, 14], a: 0.3, hold: true, rel: 0.1, rev: 0.5 });
      A.riser(5.7, 1.16, { g: 0.2, f: 110 });
      // power drain then ignition
      A.osc(6.86, { type: 'sawtooth', f: 400, f2: 40, glide: 0.14, dur: 0.15, g: 0.08, lp: 1500 });
      A.impact(7.0, 0.85);
      A.kick(7.0, 0.8);
      A.osc(7.0, { f: 55, f2: 27, glide: 1.4, dur: 2.2, g: 0.45 });
      A.chord(7.0, [45, 52, 57, 59, 64, 69], { type: 'sawtooth', dur: 3.0, g: 0.022, a: 0.02, hold: true, rel: 1.2, lp: 2400, spread: 16, rev: 0.6, width: 1.4 });
      A.bell(7.02, midi(81), { g: 0.07, dur: 2.6, rev: 0.6 });
      for (let k = 0; k < 14; k++) if (hash(k * 1.9) < 0.6) A.noise(7.0 + k * 0.033, { type: 'bandpass', f: 3000, q: 1, dur: 0.02, g: 0.09, crush: true });
      A.osc(7.05, { type: 'sawtooth', f: 100, dur: 2.9, g: 0.008, a: 0.1, hold: true, rel: 0.3, lp: 700 });
      [[8.3, 0.12], [9.15, 0.07]].forEach(([t, d]) => { for (let k = 0; k * 0.025 < d; k++) A.noise(t + k * 0.025, { type: 'bandpass', f: 2600, q: 1, dur: 0.012, g: 0.07, crush: true }); });
      [7.0, 7.66, 8.33, 9.0].forEach((t, i) => { if (i) A.kick(t, 0.5, { f2: 38 }); A.hat(t + 0.33, 0.04); if (i % 2) A.snare(t, 0.16, { rev: 0.6 }); });
      A.osc(7.5, { type: 'square', f: 1760, dur: 0.05, g: 0.025, lp: 4000 });
      A.osc(7.8, { type: 'square', f: 2637, dur: 0.06, g: 0.02, lp: 4000 });
    },
  });
})();
