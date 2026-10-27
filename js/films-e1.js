/* Batch e1 — Family H: Cinematic & Film Language.
   Long Exposure · Double Exposure · Tilt-shift Miniature.
   Photographic looks rebuilt procedurally: additive persistence, luminance blending, blur pyramids. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, font, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Unbounded:wght@200;300;500&family=IBM+Plex+Mono:wght@400;500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,500&family=DM+Sans:wght@500;700&display=block');
  const UNB = 'Unbounded, sans-serif';
  const PLEX = '"IBM Plex Mono", monospace';
  const CORM = '"Cormorant Garamond", Georgia, serif';
  const FRAU = 'Fraunces, Georgia, serif';
  const DMS = '"DM Sans", sans-serif';

  // Halving blur pyramid: src (1920×1080) → 960 → 480 → 240 → 120, each step a true 2×2 average,
  // with a light extra blur on the small levels so upscaling stays round instead of boxy.
  function makePyr() {
    const sizes = [[960, 540], [480, 270], [240, 135], [120, 68]];
    return sizes.map(([w, h]) => { const cv = offscreen(w, h); const g = cv.getContext('2d'); g.imageSmoothingQuality = 'high'; return { cv, g, w, h }; });
  }
  function buildPyr(pyr, src, extra = [0, 0, 1, 1.2]) {
    let prev = src;
    pyr.forEach((L, i) => {
      L.g.globalCompositeOperation = 'copy';
      L.g.filter = extra[i] ? `blur(${extra[i]}px)` : 'none';
      L.g.drawImage(prev, 0, 0, L.w, L.h);
      L.g.filter = 'none';
      L.g.globalCompositeOperation = 'source-over';
      prev = L.cv;
    });
    return pyr;
  }

  /* ======================================================================
     LONG EXPOSURE — night overlook. Tripod, bulb mode: the shutter opens and
     every moving light writes itself into the frame. Trails are computed from
     t, never from previous frames: a car's ribbon is simply the stretch of road
     it has covered since the shutter opened.
     ====================================================================== */
  const LX_OPEN = 0.82, LX_CLOSE = 8.55;
  const LX_HOR = 600;
  // simulated seconds: real time early, accelerating so the exposure feels like it runs for hours
  const lxSim = t => t + 15 * Math.pow(seg(t, 1.3, LX_CLOSE), 2.3);
  const LX_S0 = lxSim(LX_OPEN), LX_S1 = lxSim(LX_CLOSE);
  const lxXn = t => clamp((lxSim(Math.min(t, LX_CLOSE)) - LX_S0) / (LX_S1 - LX_S0));
  const LX_POLE = [1490, 165];
  const LX_SWEEP = 0.62; // radians of star rotation over the whole exposure (~2 h 22 m)
  // road: cubic bezier in screen space, from the near shoulder (bottom right) to the city
  const LX_ROAD = [[2080, 1130], [1180, 945], [1560, 705], [1120, 612]];
  const LX_N = 200;
  const bez = (P, u) => {
    const v = 1 - u;
    return [
      v * v * v * P[0][0] + 3 * v * v * u * P[1][0] + 3 * v * u * u * P[2][0] + u * u * u * P[3][0],
      v * v * v * P[0][1] + 3 * v * v * u * P[1][1] + 3 * v * u * u * P[2][1] + u * u * u * P[3][1],
    ];
  };
  // signature "light" in script, unit = one x-height-ish; Catmull-Rom smoothed
  const LX_WORD = [
    [-0.45, 0.2], [-0.05, 0.06], [0.35, -0.5], [0.62, -1.4], [0.72, -2.1], [0.62, -2.42], [0.45, -2.3], [0.38, -1.8], [0.42, -1.0], [0.5, -0.3], [0.64, 0.0], [0.84, -0.02],
    [1.0, -0.42], [1.12, -0.92], [1.12, -0.5], [1.15, -0.12], [1.28, 0.0], [1.45, -0.14],
    [1.62, -0.56], [1.86, -0.9], [1.7, -1.02], [1.5, -0.86], [1.44, -0.5], [1.55, -0.28], [1.76, -0.34], [1.9, -0.66], [1.98, -0.96], [1.97, -0.4], [1.92, 0.4], [1.8, 1.05], [1.6, 1.22], [1.45, 1.02], [1.6, 0.6], [1.95, 0.24], [2.25, -0.1],
    [2.5, -0.8], [2.68, -1.7], [2.7, -2.25], [2.58, -2.44], [2.42, -2.2], [2.38, -1.5], [2.38, -0.7], [2.36, 0.0], [2.46, -0.46], [2.66, -0.88], [2.86, -0.9], [2.96, -0.6], [2.96, -0.2], [3.03, 0.0], [3.2, -0.08],
    [3.4, -0.6], [3.55, -1.62], [3.58, -1.15], [3.6, -0.4], [3.68, -0.05], [3.88, 0.0], [4.15, -0.24], [4.42, -0.52],
  ];
  const LX_DOT = [[1.1, -1.42], [1.2, -1.52], [1.26, -1.4], [1.16, -1.32], [1.1, -1.42]];
  const LX_CROSS = [[3.18, -1.12], [3.5, -1.2], [3.98, -1.28]];
  const LX_FLOUR = [[-0.55, 0.62], [0.6, 0.5], [1.8, 0.46], [3.0, 0.44], [4.0, 0.3], [4.6, 0.0], [4.85, -0.4]];
  const LX_WO = [205, 790], LX_WS = 122;
  function catmull(pts, per = 10) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < per; k++) {
        const s = k / per, s2 = s * s, s3 = s2 * s;
        const f = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * s + (2 * a - 5 * b + 4 * c2 - d) * s2 + (-a + 3 * b - 3 * c2 + d) * s3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out.map(([x, y]) => [LX_WO[0] + x * LX_WS, LX_WO[1] + y * LX_WS]);
  }
  // cumulative arc length so the pen moves at a steady hand speed
  function arcTable(pts) {
    const L = [0];
    for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return L;
  }
  const LX_STROKES = [
    { pts: catmull(LX_WORD, 9), t0: 2.1, t1: 7.15 },
    { pts: catmull(LX_DOT, 6), t0: 7.32, t1: 7.5 },
    { pts: catmull(LX_CROSS, 8), t0: 7.62, t1: 7.86 },
    { pts: catmull(LX_FLOUR, 10), t0: 7.98, t1: 8.36 },
  ];
  LX_STROKES.forEach(s => { s.L = arcTable(s.pts); s.len = s.L[s.L.length - 1]; });
  const penEase = u => (u < 0.06 ? E.inQ(u / 0.06) * 0.03 : 0.03 + (u - 0.06) / 0.94 * 0.97);
  function penAt(t) {
    for (const s of LX_STROKES) if (t >= s.t0 - 0.3 && t <= s.t1 + 0.05) {
      const u = penEase(seg(t, s.t0, s.t1)), d = u * s.len;
      let i = 1; while (i < s.L.length - 1 && s.L[i] < d) i++;
      const f = (d - s.L[i - 1]) / ((s.L[i] - s.L[i - 1]) || 1);
      return { x: lerp(s.pts[i - 1][0], s.pts[i][0], f), y: lerp(s.pts[i - 1][1], s.pts[i][1], f), on: t >= s.t0 && t <= s.t1 };
    }
    return null;
  }

  function lxCity(g) {
    const rb = rng(31);
    for (let x = 840; x < 1760;) {
      const w = 14 + rb() * 34, dc = 1 - Math.abs(x - 1290) / 470, h = 10 + rb() * 50 * dc + (rb() < 0.18 ? 90 * dc * rb() : 0);
      g.fillRect(x, LX_HOR - h, w + 1, h + 12); x += w;
    }
    g.fillRect(1268, LX_HOR - 190, 10, 190); g.fillRect(1264, LX_HOR - 120, 18, 120); g.fillRect(1271, LX_HOR - 235, 4, 50);
  }
  function lxSetup() {
    const W = 1920, H = 1080;
    // road samples with perspective: world depth z from 1 (near) to 13 (far)
    const road = [];
    for (let i = 0; i <= LX_N; i++) {
      const d = i / LX_N, z = 1 + 12 * d, u = (1 - 1 / z) / (1 - 1 / 13);
      const [x, y] = bez(LX_ROAD, u), [x2, y2] = bez(LX_ROAD, Math.min(1, u + 0.002)), [x0, y0] = bez(LX_ROAD, Math.max(0, u - 0.002));
      const tx = x2 - x0, ty = y2 - y0, tl = Math.hypot(tx, ty) || 1;
      // ground-plane normal squashed vertically as the road recedes
      road.push({ x, y, nx: -ty / tl, ny: (tx / tl) * lerp(0.42, 0.16, d), s: 1 / z });
    }
    // cars: two directions, three lanes each, deterministic spawn tables in sim seconds
    const cars = [];
    const r = rng(1949);
    for (let dir = 0; dir < 2; dir++) for (let lane = 0; lane < 3; lane++) {
      let s = -8 + r() * 0.8;
      while (s < LX_S1 + 1) {
        const truck = r() < 0.12;
        cars.push({ dir, lane, s0: s, T: (truck ? 7.5 : 5.2) + r() * 1.4 - lane * 0.5, lat: (dir ? 1 : -1) * (0.75 + lane * 1.05) + (r() - 0.5) * 0.55, truck, w: 0.7 + r() * 0.5, br: 0.75 + r() * 0.5, lc: r() < 0.28 ? (r() < 0.5 ? -1.05 : 1.05) * (lane === 0 ? (dir ? 1 : -1) : r() < 0.5 ? 1 : -1) : 0, lcd: 0.08 + r() * 0.5 });
        s += 0.42 + r() * 0.8 + lane * 0.08;
      }
    }
    // stars around the pole
    const stars = [];
    const rs = rng(77);
    for (let k = 0; k < 1700; k++) {
      const rad = 30 + Math.sqrt(rs()) * 2100, a0 = rs() * TAU;
      const px = LX_POLE[0] + Math.cos(a0) * rad, py = LX_POLE[1] + Math.sin(a0) * rad;
      if (py > LX_HOR + 40 && Math.sin(a0) > 0.2 && rad * 0.9 + LX_POLE[1] > LX_HOR + 200) { if (rs() < 0.8) continue; }
      const m = rs();
      const mag = m < 0.72 ? 0 : m < 0.94 ? 1 : 2;
      const col = rs() < 0.22 ? 1 : rs() < 0.18 ? 2 : 0;
      stars.push({ rad, a0, mag, col, tw: rs() * 10 });
    }
    // backdrops: dark (live view) and lifted (exposed for hours)
    const mk = lit => {
      const cv = offscreen(W, H), g = cv.getContext('2d');
      const sky = g.createLinearGradient(0, 0, 0, LX_HOR + 40);
      if (lit) { sky.addColorStop(0, '#040814'); sky.addColorStop(0.45, '#0a1630'); sky.addColorStop(0.8, '#1c2340'); sky.addColorStop(1, '#4a3330'); }
      else { sky.addColorStop(0, '#010205'); sky.addColorStop(0.7, '#03060d'); sky.addColorStop(1, '#0b0a10'); }
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      if (lit) {
        // sodium skyglow and long-smeared clouds
        const gl = g.createRadialGradient(1300, LX_HOR + 30, 20, 1300, LX_HOR + 30, 900);
        gl.addColorStop(0, 'rgba(255,140,70,0.35)'); gl.addColorStop(0.4, 'rgba(160,80,70,0.12)'); gl.addColorStop(1, 'rgba(60,40,70,0)');
        g.fillStyle = gl; g.fillRect(0, 0, W, H);
        g.save(); g.filter = 'blur(22px)';
        const rc = rng(12);
        for (let k = 0; k < 16; k++) {
          const y = 380 + rc() * 190, x = rc() * 2200 - 200, w = 500 + rc() * 900;
          g.fillStyle = `rgba(${200 + rc() * 50},${120 + rc() * 40},${100 + rc() * 30},${0.04 + rc() * 0.07})`;
          g.beginPath(); g.ellipse(x, y, w / 2, 8 + rc() * 18, -0.03, 0, TAU); g.fill();
        }
        g.restore();
      }
      // far ridge
      g.fillStyle = lit ? '#121a2c' : '#04060a';
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) g.lineTo(x, LX_HOR - 40 - 55 * (0.5 + 0.5 * Math.sin(x * 0.0021 + 1.2)) - 30 * vnoise(x * 0.01, 3) - 14 * vnoise(x * 0.05, 4) + (x > 900 ? 25 : 0) * seg(x, 900, 1100));
      g.lineTo(W, H); g.fill();
      // city block silhouette
      g.fillStyle = lit ? '#0c111d' : '#030407';
      lxCity(g);
      // mid hill (left) with tree line
      g.fillStyle = lit ? '#0a0f18' : '#020304';
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= 1300; x += 4) {
        const base = LX_HOR + 10 + Math.pow(x / 1300, 1.6) * 130 - 40 * Math.sin(x * 0.003);
        const tree = Math.max(0, vnoise(x * 0.08, 9)) * 14 + Math.max(0, vnoise(x * 0.31, 10)) * 6;
        g.lineTo(x, base - tree);
      }
      g.lineTo(1300, H); g.fill();
      // valley floor towards the road
      const vf = g.createLinearGradient(0, LX_HOR, 0, H);
      vf.addColorStop(0, lit ? '#111624' : '#030407'); vf.addColorStop(0.3, lit ? '#0a0d15' : '#020304'); vf.addColorStop(1, lit ? '#06080c' : '#010102');
      g.fillStyle = vf;
      g.beginPath(); g.moveTo(0, LX_HOR + 30); g.lineTo(700, LX_HOR + 18); g.lineTo(1920, LX_HOR + 4); g.lineTo(1920, H); g.lineTo(0, H); g.fill();
      // mid hill again on top of the valley so its edge stays readable
      g.fillStyle = lit ? '#0a0f18' : '#020304';
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= 1100; x += 4) {
        const base = LX_HOR + 10 + Math.pow(x / 1300, 1.6) * 130 - 40 * Math.sin(x * 0.003);
        g.lineTo(x, base - Math.max(0, vnoise(x * 0.08, 9)) * 14 - Math.max(0, vnoise(x * 0.31, 10)) * 6);
      }
      g.lineTo(1100, LX_HOR + 220); g.quadraticCurveTo(1000, 800, 900, H); g.fill();
      // road surface: lit asphalt picks up hours of headlight spill
      g.beginPath();
      for (let i = 0; i <= LX_N; i++) { const p = road[i], w = 4.2 * 125 * p.s; g.lineTo(p.x - p.nx * w, p.y - p.ny * w); }
      for (let i = LX_N; i >= 0; i--) { const p = road[i], w = 4.2 * 125 * p.s; g.lineTo(p.x + p.nx * w, p.y + p.ny * w); }
      g.closePath();
      g.fillStyle = lit ? '#1b1a20' : '#040406'; g.fill();
      if (lit) {
        g.save(); g.clip(); g.filter = 'blur(30px)';
        g.strokeStyle = 'rgba(255,170,120,0.18)'; g.lineWidth = 220; g.beginPath();
        road.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke();
        g.restore();
      }
      // guard rails
      g.strokeStyle = lit ? 'rgba(150,140,140,0.35)' : 'rgba(40,40,45,0.4)'; g.lineWidth = 2;
      [-1, 1].forEach(sd => { g.beginPath(); road.forEach((p, i) => { const w = 4.5 * 125 * p.s; const x = p.x + sd * p.nx * w, y = p.y + sd * p.ny * w - 22 * p.s; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); });
      // foreground ledge (left) with grass tufts
      g.fillStyle = lit ? '#07090d' : '#010101';
      g.beginPath(); g.moveTo(0, H);
      for (let x = 0; x <= 1180; x += 6) {
        const y = 895 + Math.pow(x / 1180, 2.2) * 200 + 12 * vnoise(x * 0.012, 5) + 4 * vnoise(x * 0.09, 6);
        g.lineTo(x, y - Math.max(0, vnoise(x * 0.7, 7)) * 9);
      }
      g.lineTo(1180, H); g.fill();
      if (lit) {
        // rim of the ledge catches the city glow
        g.strokeStyle = 'rgba(160,120,110,0.18)'; g.lineWidth = 1.5; g.beginPath();
        for (let x = 0; x <= 1000; x += 6) { const y = 895 + Math.pow(x / 1180, 2.2) * 200 + 12 * vnoise(x * 0.012, 5) + 4 * vnoise(x * 0.09, 6); x ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke();
      }
      return cv;
    };
    // land mask (everything that should occlude stars)
    const mask = offscreen(W, H), mg = mask.getContext('2d');
    mg.fillStyle = '#000';
    mg.beginPath(); mg.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) mg.lineTo(x, LX_HOR - 40 - 55 * (0.5 + 0.5 * Math.sin(x * 0.0021 + 1.2)) - 30 * vnoise(x * 0.01, 3) - 14 * vnoise(x * 0.05, 4) + (x > 900 ? 25 : 0) * seg(x, 900, 1100));
    mg.lineTo(W, H); mg.fill();
    lxCity(mg);
    // city windows + street lamps (static point lights)
    const lights = offscreen(W, H), lg = lights.getContext('2d');
    const rw = rng(8);
    for (let k = 0; k < 900; k++) {
      const x = 850 + rw() * 900, dc = 1 - Math.abs(x - 1290) / 470;
      const y = LX_HOR + 6 - rw() * (14 + 70 * Math.max(0, dc) * rw());
      const warm = rw() < 0.7;
      lg.fillStyle = warm ? `rgba(255,${170 + rw() * 60},${90 + rw() * 60},${0.3 + rw() * 0.6})` : `rgba(${170 + rw() * 60},${210 + rw() * 40},255,${0.3 + rw() * 0.5})`;
      lg.fillRect(x, y, 1.6 + rw() * 1.6, 1.4 + rw());
    }
    // scattered houses and farm lights across the valley and hillside
    for (let k = 0; k < 140; k++) {
      const x = rw() * 1150, y = LX_HOR + 30 + rw() * 240 * (0.4 + x / 1150);
      if (y > 895 + Math.pow(x / 1180, 2.2) * 200 - 30) continue;
      lg.fillStyle = `rgba(255,${160 + rw() * 70},${80 + rw() * 60},${0.25 + rw() * 0.5})`;
      lg.fillRect(x, y, 1.5 + rw() * 1.5, 1.5);
    }
    lg.fillStyle = 'rgba(255,230,200,0.8)';
    for (let k = 0; k < 26; k++) lg.fillRect(1269 + (k % 2) * 3, LX_HOR - 180 + k * 6, 1.5, 2);
    const lamps = [];
    for (let i = 8; i < LX_N; i += 9) { const p = road[i]; [-1, 1].forEach(sd => { const w = 4.6 * 125 * p.s; lamps.push([p.x + sd * p.nx * w, p.y + sd * p.ny * w - 150 * p.s, p.s]); }); }
    return {
      road, cars, stars, lamps,
      dark: mk(false), lit: mk(true), mask, lights,
      L: offscreen(W, H), pyr: makePyr(),
    };
  }

  function lxTrail(g, road, lat, hgt, d0, d1, lw, lc = 0, lcd = 0) {
    // polyline along the road between world depths d0..d1 (0 near, 1 far)
    if (d1 - d0 < 1e-4) return;
    const i0 = Math.floor(d0 * LX_N), i1 = Math.ceil(d1 * LX_N);
    const pt = d => {
      const f = d * LX_N, i = Math.min(LX_N - 1, Math.floor(f)), u = f - i, a = road[i], b = road[i + 1];
      const s = lerp(a.s, b.s, u), x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u), nx = lerp(a.nx, b.nx, u), ny = lerp(a.ny, b.ny, u);
      const la = lat + lc * E.ioS(clamp((d - lcd) / 0.14 + 0.5));
      return [x + nx * la * 125 * s, y + ny * la * 125 * s - hgt * 125 * s, s];
    };
    // chunk by depth so near trails are fat and far ones hair-thin
    const CH = 16;
    for (let c0 = i0; c0 < i1; c0 += CH) {
      const da = Math.max(d0, c0 / LX_N), db = Math.min(d1, (c0 + CH) / LX_N);
      if (db <= da) continue;
      const p0 = pt(da);
      g.lineWidth = Math.max(0.9, lw * p0[2] * 9);
      g.beginPath(); g.moveTo(p0[0], p0[1]);
      for (let i = Math.ceil(da * LX_N); i < db * LX_N; i++) { const p = pt(i / LX_N); g.lineTo(p[0], p[1]); }
      const p1 = pt(db); g.lineTo(p1[0], p1[1]);
      g.stroke();
    }
  }

  function lxDraw(c, t, W, H, st) {
    const open = t >= LX_OPEN, closed = t >= LX_CLOSE;
    const tt = Math.min(t, LX_CLOSE);
    const xn = lxXn(t);
    const sim = lxSim(tt);
    const lift = open ? E.outQ(xn) : 0;
    // backdrop: exposure lifts the ambient scene over "hours"
    c.drawImage(st.dark, 0, 0);
    if (lift > 0) { c.globalAlpha = lift; c.drawImage(st.lit, 0, 0); c.globalAlpha = 1; }

    const L = st.L, g = L.getContext('2d');
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    g.lineCap = 'round'; g.lineJoin = 'round';

    // ---- star trails ----
    const sweep = LX_SWEEP * xn;
    const SC = [[205, 222, 255], [255, 226, 190], [180, 205, 255]];
    for (let mag = 0; mag < 3; mag++) for (let col = 0; col < 3; col++) {
      const [R, G, B] = SC[col];
      const a = [0.32, 0.6, 0.95][mag] * (open ? 1 : 0.8);
      g.strokeStyle = `rgba(${R},${G},${B},${a})`;
      g.lineWidth = [1.1, 1.7, 2.6][mag];
      g.beginPath();
      for (const s of st.stars) {
        if (s.mag !== mag || s.col !== col) continue;
        // live view: stars twinkle as points; once open, each draws its arc
        const a0 = s.a0 - sweep, a1 = s.a0;
        g.moveTo(LX_POLE[0] + Math.cos(a0) * s.rad, LX_POLE[1] + Math.sin(a0) * s.rad);
        if (sweep > 0.0005) g.arc(LX_POLE[0], LX_POLE[1], s.rad, a0, a1);
        else g.lineTo(LX_POLE[0] + Math.cos(a0) * s.rad + 0.01, LX_POLE[1] + Math.sin(a0) * s.rad);
      }
      g.stroke();
    }
    // Polaris sits on the pole
    g.fillStyle = 'rgba(230,240,255,0.95)'; g.beginPath(); g.arc(LX_POLE[0], LX_POLE[1], 2.4, 0, TAU); g.fill();

    // ---- aircraft crossing: steady nav lights, strobe dashes ----
    const P0 = [1990, 120], P1 = [-60, 215], pa = 1.3, pb = 8.2;
    const pu = seg(tt, pa, pb), pu0 = open ? seg(LX_OPEN, pa, pb) : pu;
    if (pu > 0 && pu < 1 || (open && pu >= 1)) {
      const at = u => [lerp(P0[0], P1[0], u), lerp(P0[1], P1[1], u) - 40 * Math.sin(u * Math.PI)];
      if (open && pu > pu0) {
        [[-3, 'rgba(255,60,50,0.55)'], [3, 'rgba(60,255,120,0.5)']].forEach(([o, col]) => {
          g.strokeStyle = col; g.lineWidth = 1.2; g.beginPath();
          for (let u = pu0; u <= pu; u += 0.004) { const p = at(u); u === pu0 ? g.moveTo(p[0], p[1] + o) : g.lineTo(p[0], p[1] + o); }
          g.stroke();
        });
        g.fillStyle = 'rgba(255,255,255,0.95)';
        for (let k = 0; k < 60; k++) { const u = pu0 + k * 0.02 - (pu0 % 0.02); if (u > pu || u < pu0) continue; const p = at(u); g.beginPath(); g.arc(p[0], p[1], 2.2, 0, TAU); g.fill(); }
      }
      if (pu < 1) { const p = at(pu); const bl = (t * 1.6) % 1 < 0.12; g.fillStyle = bl ? '#fff' : 'rgba(255,90,80,0.9)'; g.beginPath(); g.arc(p[0], p[1], bl ? 3 : 1.8, 0, TAU); g.fill(); }
    }
    // land occludes the sky lights
    g.globalCompositeOperation = 'destination-out';
    g.drawImage(st.mask, 0, 0);
    g.globalCompositeOperation = 'lighter';

    // ---- city windows, beacon, sodium lamps with diffraction stars ----
    g.globalAlpha = 0.75 + 0.25 * lift; g.drawImage(st.lights, 0, 0); g.globalAlpha = 1;
    const beacon = open ? 0.8 : ((t * 1.1) % 1 < 0.5 ? 1 : 0.15);
    g.fillStyle = `rgba(255,40,30,${beacon})`; g.beginPath(); g.arc(1273, LX_HOR - 236, 2.6, 0, TAU); g.fill();
    const spike = 0.3 + 0.7 * lift;
    for (const [x, y, s] of st.lamps) {
      const R = 3 + 7 * s;
      const gr = g.createRadialGradient(x, y, 0, x, y, R * 4);
      gr.addColorStop(0, 'rgba(255,200,130,0.95)'); gr.addColorStop(0.25, 'rgba(255,140,60,0.35)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
      g.fillStyle = gr; g.fillRect(x - R * 4, y - R * 4, R * 8, R * 8);
      // 6-blade aperture → 6-point star
      g.strokeStyle = `rgba(255,190,120,${0.35 * spike})`; g.lineWidth = 1;
      const len = (14 + 70 * s) * spike;
      g.beginPath();
      for (let k = 0; k < 3; k++) { const a = 0.35 + k * Math.PI / 3; g.moveTo(x - Math.cos(a) * len, y - Math.sin(a) * len); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); }
      g.stroke();
    }

    // ---- traffic ----
    const road = st.road;
    const s0 = LX_S0;
    // trails for every car: from where it was when the shutter opened to where it is now
    const pass = (lw, alphaK) => {
      for (const car of st.cars) {
        const ua = (Math.max(s0, car.s0) - car.s0) / car.T, ub = (sim - car.s0) / car.T;
        if (ub <= 0 || ua >= 1) continue;
        const a = clamp(ua), b = clamp(ub);
        if (!open) continue;
        let d0 = a, d1 = b;
        if (car.dir) { d0 = 1 - b; d1 = 1 - a; } // oncoming: drives from far to near
        const lat = car.lat;
        if (car.dir) {
          // headlights: warm white pair
          g.strokeStyle = `rgba(255,236,205,${0.13 * car.br * alphaK})`;
          lxTrail(g, road, lat - 0.28, 0.55, d0, d1, lw, car.lc, car.lcd);
          lxTrail(g, road, lat + 0.28, 0.55, d0, d1, lw, car.lc, car.lcd);
        } else {
          g.strokeStyle = `rgba(255,${car.truck ? 70 : 38},${car.truck ? 30 : 26},${0.26 * car.br * alphaK})`;
          lxTrail(g, road, lat - 0.3, 0.7, d0, d1, lw, car.lc, car.lcd);
          lxTrail(g, road, lat + 0.3, 0.7, d0, d1, lw, car.lc, car.lcd);
        }
        if (car.truck) {
          g.strokeStyle = `rgba(255,160,40,${0.2 * alphaK})`;
          lxTrail(g, road, lat, 2.6, d0, d1, lw * 0.7, car.lc, car.lcd);
        }
      }
    };
    pass(0.5, 1 / (1 + 1.5 * xn));
    // live car points (the cars themselves) — what the eye sees, faint once the shutter is open
    if (!closed) {
      for (const car of st.cars) {
        const u = (sim - car.s0) / car.T;
        if (u <= 0 || u >= 1) continue;
        const d = car.dir ? 1 - u : u;
        const f = d * LX_N, i = Math.min(LX_N - 1, Math.floor(f)), p = road[i];
        const sz = 1.5 + 5 * p.s;
        g.fillStyle = car.dir ? `rgba(255,240,215,${open ? 0.5 : 0.95})` : `rgba(255,40,30,${open ? 0.45 : 0.9})`;
        const la = car.lat + car.lc * E.ioS(clamp((d - car.lcd) / 0.14 + 0.5));
        [-0.28, 0.28].forEach(o => { g.beginPath(); g.arc(p.x + p.nx * (la + o) * 125 * p.s, p.y + p.ny * (la + o) * 125 * p.s - (car.dir ? 0.55 : 0.7) * 125 * p.s, sz, 0, TAU); g.fill(); });
      }
    }

    // ---- the light painter ----
    const pen = penAt(tt);
    const COLS = ['rgba(60,170,255,', 'rgba(140,220,255,', 'rgba(240,250,255,'];
    for (const s of LX_STROKES) {
      if (tt < s.t0) continue;
      const u = penEase(seg(tt, s.t0, s.t1)), dmax = u * s.len;
      const n = s.pts.length;
      [[16, 0.07, 0], [6.5, 0.22, 1], [2.4, 0.85, 2]].forEach(([lw, al, ci]) => {
        g.strokeStyle = COLS[ci] + al + ')';
        g.lineWidth = lw;
        g.beginPath(); g.moveTo(s.pts[0][0], s.pts[0][1]);
        for (let k = 1; k < n; k++) {
          if (s.L[k] > dmax) {
            const f = (dmax - s.L[k - 1]) / ((s.L[k] - s.L[k - 1]) || 1);
            g.lineTo(lerp(s.pts[k - 1][0], s.pts[k][0], f), lerp(s.pts[k - 1][1], s.pts[k][1], f));
            break;
          }
          g.lineTo(s.pts[k][0], s.pts[k][1]);
        }
        g.stroke();
      });
    }
    if (pen && pen.on && !closed) {
      const flick = 0.8 + 0.2 * hash(Math.floor(t * 30));
      const gr = g.createRadialGradient(pen.x, pen.y, 0, pen.x, pen.y, 40);
      gr.addColorStop(0, `rgba(255,255,255,${flick})`); gr.addColorStop(0.15, 'rgba(150,220,255,0.6)'); gr.addColorStop(1, 'rgba(60,140,255,0)');
      g.fillStyle = gr; g.fillRect(pen.x - 40, pen.y - 40, 80, 80);
    }

    // ---- title, written in light so it blooms with everything else ----
    const ti = seg(t, 8.75, 9.5);
    if (ti > 0) {
      const a = E.outC(ti);
      g.save();
      g.shadowColor = 'rgba(160,210,255,0.9)'; g.shadowBlur = 18;
      text(g, 'LONG EXPOSURE', 960, 318, { font: UNB, weight: 200, size: 78, align: 'center', ls: 26 * (1.4 - 0.4 * E.outQ(ti)), color: `rgba(235,244,255,${a * 0.95})` });
      g.restore();
      text(g, 'B  ·  2 H 22 MIN  ·  ƒ/8  ·  ISO 100', 960, 372, { font: PLEX, weight: 400, size: 19, align: 'center', ls: 6, color: `rgba(180,200,230,${seg(t, 9.05, 9.6) * 0.75})` });
    }

    // composite light + bloom
    c.globalCompositeOperation = 'lighter';
    const pyr = buildPyr(st.pyr, L, [0, 0, 1, 1.5]);
    // live view opens defocused: point lights are soft discs until autofocus locks
    const fz = 1 - E.ioC(seg(t, 0.32, 0.7));
    if (fz > 0) { c.globalAlpha = 1 - fz; c.drawImage(L, 0, 0); c.globalAlpha = fz; c.drawImage(pyr[2].cv, 0, 0, W, H); c.drawImage(pyr[2].cv, 0, 0, W, H); c.drawImage(pyr[2].cv, 0, 0, W, H); c.drawImage(pyr[3].cv, 0, 0, W, H); c.globalAlpha = 1; }
    else c.drawImage(L, 0, 0);
    c.globalAlpha = 0.55; c.drawImage(pyr[1].cv, 0, 0, W, H);
    c.globalAlpha = 0.6; c.drawImage(pyr[2].cv, 0, 0, W, H);
    c.globalAlpha = 0.75; c.drawImage(pyr[3].cv, 0, 0, W, H);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';

    // ghost of the painter: barely registers on the plate (moving bodies don't expose)
    if (pen || (t > LX_STROKES[0].t0 - 0.3 && !closed)) {
      const p = pen || { x: 760, y: 760 };
      const fx = 300 + 0.55 * (p.x - 260), fy = 905;
      const vis = closed ? 0 : (open ? 0.22 : 0.9) * seg(t, 1.6, 2.0);
      if (vis > 0) {
        c.save();
        c.globalAlpha = vis;
        c.filter = open ? 'blur(3px)' : 'none';
        const fc = open ? '#7d93b8' : '#0d1018';
        if (open) c.globalAlpha = vis * 0.5;
        c.fillStyle = fc;
        c.strokeStyle = fc;
        const hy = fy - 250;
        c.beginPath(); c.ellipse(fx, hy, 15, 18, 0, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(fx - 26, hy + 30); c.lineTo(fx + 26, hy + 30); c.lineTo(fx + 20, fy - 110); c.lineTo(fx + 16, fy); c.lineTo(fx + 2, fy); c.lineTo(fx, fy - 100); c.lineTo(fx - 4, fy); c.lineTo(fx - 18, fy); c.lineTo(fx - 22, fy - 110); c.closePath(); c.fill();
        c.lineWidth = 13; c.lineCap = 'round';
        c.beginPath(); c.moveTo(fx + 18, hy + 38); c.quadraticCurveTo((fx + p.x) / 2 + 10, (hy + 40 + p.y) / 2 + 30, p.x, p.y); c.stroke();
        // pen light spills onto the figure's edge
        if (pen && pen.on) { c.globalAlpha = vis * 0.6; c.strokeStyle = 'rgba(120,200,255,0.5)'; c.lineWidth = 2; c.beginPath(); c.ellipse(fx, hy, 15, 18, 0, -1.2, 0.6); c.stroke(); }
        c.restore();
      }
    }

    // camera readout (bottom right)
    const ra = seg(t, 0.15, 0.5) * (1 - seg(t, 8.7, 9.1));
    if (ra > 0) {
      const ex = open ? Math.round(xn * (2 * 3600 + 22 * 60)) : 0;
      const hh = Math.floor(ex / 3600), mm = Math.floor((ex % 3600) / 60), ss = ex % 60;
      const tc = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
      const recOn = open && !closed && (t * 1.2) % 1 < 0.6;
      c.fillStyle = `rgba(255,70,60,${ra * (recOn ? 0.9 : 0.25)})`; c.beginPath(); c.arc(1600, 1003, 5, 0, TAU); c.fill();
      text(c, open ? 'BULB' : 'LIVE', 1616, 1010, { font: PLEX, weight: 500, size: 17, ls: 3, color: `rgba(230,235,245,${ra * 0.7})` });
      text(c, tc, 1840, 1010, { font: PLEX, weight: 400, size: 17, ls: 2, align: 'right', color: `rgba(230,235,245,${ra * 0.85})` });
    }
    // mirror slap: brief viewfinder blackout as the shutter opens / closes
    const bo = Math.max(1 - Math.abs(t - LX_OPEN - 0.03) / 0.06, 1 - Math.abs(t - LX_CLOSE - 0.03) / 0.06, 0);
    if (bo > 0) { c.fillStyle = `rgba(0,0,0,${clamp(bo * 1.2)})`; c.fillRect(0, 0, W, H); }
    // final frame "develops": a breath of extra contrast and warmth
    const dv = seg(t, LX_CLOSE + 0.06, LX_CLOSE + 0.5);
    if (dv > 0 && dv < 1) { c.fillStyle = `rgba(255,240,220,${0.06 * (1 - dv)})`; c.globalCompositeOperation = 'lighter'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
    vignette(c, W, H, 0.6);
    grain(c, W, H, t, 0.07);
    const fin = 1 - seg(t, 0, 0.4);
    if (fin > 0) { c.fillStyle = `rgba(0,0,0,${fin})`; c.fillRect(0, 0, W, H); }
  }

  MG.film({
    id: 'longexposure', dur: 10, poster: 9.5,
    fonts: [['200 78px Unbounded', 'LONG EXPOSURE'], ['400 19px "IBM Plex Mono"', 'B·2H22MINƒ/8ISO100'], ['500 17px "IBM Plex Mono"', 'BULBLIVE0123456789:']],
    meta: {
      family: 'H', name: 'Long Exposure', sub: 'Light Trails', era: '1949 —',
      origin: 'Holding a camera shutter open turns moving light into drawn lines. Gjon Mili made it famous in 1949 when he photographed Pablo Picasso drawing centaurs and bulls in the air with a small flashlight for LIFE magazine, and night-traffic and star-trail photography made the streaking ribbon a fixed image of the modern city.',
      works: 'Picasso Draws with Light (Gjon Mili, LIFE, 1949) · Man Ray, Space Writing (1935) · Frank and Lillian Gilbreth, light-motion studies (1914) · Michael Wesely, open-shutter architecture (1997 —) · Lucas Zimmermann, Traffic Lights (2013) · Ken Russell / Koyaanisqatsi freeway time-lapses (Godfrey Reggio, 1982)',
      tech: ['Additive persistence computed from t (trail = road covered since shutter open)', 'Perspective road samples with depth-scaled ribbon width', 'Star arcs around the celestial pole', 'Halving blur pyramid bloom + 6-blade diffraction stars'],
      accent: '#7cc8ff',
      motionDNA: 'A locked-off tripod frame where nothing moves but light: the shutter clicks open, ribbons of head- and tail-lights pile up, the stars wheel, a figure signs the air, and the click of the shutter closing freezes it all.',
      visualDNA: 'Deep blue night lifted by hours of exposure, red and white highway ribbons, concentric star arcs, sodium lamps with diffraction spikes, a ghostly painter and a cyan light-written signature.',
      transitions: 'Mirror-slap blackout, shutter open, accumulation build, shutter close freeze, title written in light.',
      implementation: ['Camera', 'After Effects', 'Canvas 2D'],
      reproducibility: 'Needs live action (this film is a procedural homage)', loopable: false,
    },
    setup: lxSetup,
    draw: lxDraw,
    score(A) {
      A.bus.gain.value = 1.3;
      // night air + distant freeway bed
      A.noise(0, { type: 'lowpass', f: 420, dur: 10, g: 0.05, hold: true, a: 0.6, rel: 1.2 });
      A.noise(0.3, { type: 'bandpass', f: 900, q: 0.4, dur: 8.4, g: 0.018, hold: true, a: 2, rel: 0.6, rate: 0.7 });
      // ambient pad: D major add9, opens up as the exposure builds, shifts to G/D for the climax
      const pad = (t0, d, ns, g, lp, lp2) => ns.forEach((m, i) => A.osc(t0, { type: 'sawtooth', f: midi(m), dur: d, g: g, a: d * 0.35, hold: true, rel: 1.2, lp, lp2, lpT: d, detune: (i % 2 ? 7 : -7), rev: 0.6, pan: (i / (ns.length - 1) - 0.5) * 0.8 }));
      pad(0.0, 4.6, [38, 45, 52, 57, 64], 0.022, 300, 900);
      pad(4.3, 4.4, [43, 50, 55, 59, 66], 0.022, 600, 1500);
      pad(8.5, 1.5, [38, 45, 54, 57, 64, 69], 0.024, 1400, 900);
      // sub pulses, heartbeat-slow, quickening a little as the exposure accelerates
      let tp = 1.3, k = 0;
      while (tp < 8.4) { A.osc(tp, { f: 58, f2: 38, glide: 0.35, dur: 0.9, g: 0.16 + 0.12 * (tp / 8.4), a: 0.01 }); tp += lerp(0.95, 0.55, tp / 8.4); k++; }
      // autofocus confirm
      A.osc(0.62, { type: 'square', f: 2900, dur: 0.05, g: 0.018, hold: true, rel: 0.01 });
      A.osc(0.7, { type: 'square', f: 2900, dur: 0.05, g: 0.018, hold: true, rel: 0.01 });
      // shutter open: mirror slap + first curtain
      A.noise(LX_OPEN - 0.02, { type: 'bandpass', f: 2600, q: 1.2, dur: 0.035, g: 0.32 });
      A.osc(LX_OPEN - 0.02, { f: 160, f2: 70, glide: 0.05, dur: 0.09, g: 0.25 });
      A.noise(LX_OPEN + 0.05, { type: 'highpass', f: 4200, dur: 0.02, g: 0.2 });
      A.bell(LX_OPEN + 0.1, midi(81), { g: 0.035, dur: 3, rev: 0.7 });
      // cars passing close (near lane hiss with pan sweeps)
      [[1.6, 0.8], [2.9, -0.6], [3.9, 0.7], [5.0, -0.5], [5.8, 0.8], [6.5, -0.7], [7.1, 0.6], [7.6, -0.6], [8.0, 0.7]].forEach(([t0, p], i) => A.noise(t0, { type: 'bandpass', f: 700 + (i % 3) * 300, f2: 300, q: 0.8, dur: 0.9 - i * 0.05, g: 0.045 + i * 0.004, swell: 0.55, pan: p }));
      // aircraft overhead, right to left
      A.noise(1.4, { type: 'lowpass', f: 260, f2: 160, dur: 6.6, g: 0.06, swell: 0.5, pan: 0.6 });
      A.noise(4.4, { type: 'lowpass', f: 200, f2: 120, dur: 3.6, g: 0.04, swell: 0.4, pan: -0.6 });
      // the light pen: a thin shimmering tone that follows the hand
      LX_STROKES.forEach((s, i) => {
        const d = s.t1 - s.t0;
        A.osc(s.t0, { type: 'sine', f: midi(i ? 93 : 86), dur: d + 0.25, g: i ? 0.02 : 0.016, a: 0.12, hold: true, rel: 0.2, vib: [6.5, 9], rev: 0.6, pan: -0.4 });
        A.osc(s.t0, { type: 'triangle', f: midi(i ? 81 : 74), dur: d + 0.25, g: 0.012, a: 0.2, hold: true, rel: 0.2, vib: [0.7, 4], rev: 0.5, pan: -0.3 });
        A.noise(s.t0, { type: 'highpass', f: 9000, dur: 0.05, g: 0.05, pan: -0.4 });
      });
      // pen sparkles on letter turns
      [3.1, 3.7, 4.45, 5.2, 5.9, 6.6].forEach((t0, i) => A.bell(t0, midi([86, 90, 93, 88, 95, 91][i]), { g: 0.02, dur: 1.4, rev: 0.6, pan: -0.35 }));
      A.bell(7.4, midi(98), { g: 0.04, dur: 1.4, rev: 0.6, pan: -0.3 });
      A.bell(7.86, midi(93), { g: 0.035, dur: 1.4, rev: 0.6, pan: -0.2 });
      // build into the close
      A.riser(6.7, 1.85, { g: 0.08, f: 73 });
      // shutter close + title
      A.noise(LX_CLOSE - 0.01, { type: 'highpass', f: 3800, dur: 0.02, g: 0.25 });
      A.noise(LX_CLOSE + 0.03, { type: 'bandpass', f: 2200, q: 1.2, dur: 0.04, g: 0.3 });
      A.osc(LX_CLOSE + 0.03, { f: 150, f2: 60, glide: 0.06, dur: 0.1, g: 0.25 });
      A.osc(LX_CLOSE + 0.05, { f: 52, f2: 36, glide: 0.8, dur: 1.4, g: 0.35 });
      [74, 78, 81, 86].forEach((m, i) => A.bell(8.8 + i * 0.09, midi(m), { g: 0.035, dur: 2.2, rev: 0.7, pan: (i - 1.5) * 0.3 }));
    },
  });

  /* ======================================================================
     DOUBLE EXPOSURE — two frames on one negative. A profile shot against a
     bright sky is screened over a landscape: where the portrait is dark the
     landscape prints, where it is bright the frame stays paper-pale. Forest,
     birds, then a city at dusk dissolve through smoke inside the same head.
     ====================================================================== */
  const DX_PAPER = [226, 222, 213];
  const DX_WARM = '#e0773a';
  const DX_SUN = [902, 498];
  // 2D value noise for smoke / fog fields
  const h2 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const n2 = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(h2(xi, yi), h2(xi + 1, yi), u), lerp(h2(xi, yi + 1), h2(xi + 1, yi + 1), u), v);
  };
  const fbm = (x, y) => n2(x, y) * 0.5 + n2(x * 2.03, y * 2.03) * 0.25 + n2(x * 4.1, y * 4.1) * 0.15 + n2(x * 8.3, y * 8.3) * 0.1;
  function dxHead(g) {
    g.beginPath();
    g.moveTo(1640, 1080);
    g.bezierCurveTo(1560, 1000, 1420, 975, 1330, 930);
    g.bezierCurveTo(1296, 880, 1294, 820, 1306, 770);
    g.bezierCurveTo(1345, 690, 1362, 560, 1345, 440);
    g.bezierCurveTo(1325, 290, 1230, 165, 1080, 140);
    g.bezierCurveTo(955, 126, 858, 186, 815, 290);
    g.bezierCurveTo(795, 340, 790, 390, 795, 425);
    g.bezierCurveTo(798, 445, 790, 458, 780, 466);
    g.bezierCurveTo(772, 474, 774, 486, 772, 496);
    g.bezierCurveTo(760, 535, 735, 568, 718, 598);
    g.bezierCurveTo(711, 610, 716, 622, 735, 626);
    g.bezierCurveTo(750, 629, 760, 632, 765, 640);
    g.bezierCurveTo(763, 652, 755, 662, 752, 672);
    g.bezierCurveTo(760, 678, 763, 684, 757, 690);
    g.bezierCurveTo(750, 697, 752, 708, 760, 715);
    g.bezierCurveTo(768, 724, 772, 737, 765, 750);
    g.bezierCurveTo(760, 772, 770, 798, 805, 808);
    g.bezierCurveTo(870, 822, 935, 826, 975, 850);
    g.bezierCurveTo(990, 885, 985, 955, 970, 1005);
    g.bezierCurveTo(960, 1040, 880, 1065, 800, 1080);
    g.closePath();
  }
  // spruce silhouette: ragged drooping tiers, never a clean triangle
  function dxPine(g, x, by, h, w, seed) {
    // fine serrated tufts with the odd longer bough, drooping slightly
    const r = rng(seed), n = Math.max(14, Math.floor(h / 7));
    const R = [], L = [];
    for (let k = 1; k <= n; k++) {
      const u = k / n, y = by - h + u * h * 0.96;
      const env = w * (0.05 + 0.95 * Math.pow(u, 0.8)) * (0.9 + 0.2 * Math.sin(u * 23 + seed));
      const tuft = k % 2 ? 1 : 0.84;
      const boughR = r() < 0.08 ? 1.25 : 1, boughL = r() < 0.08 ? 1.25 : 1;
      R.push([x + env * tuft * boughR * (0.92 + r() * 0.16), y + (k % 2 ? h / n * 0.35 : 0)]);
      L.push([x - env * tuft * boughL * (0.92 + r() * 0.16), y + (k % 2 ? h / n * 0.35 : 0)]);
    }
    g.beginPath(); g.moveTo(x, by - h - 8);
    R.forEach(p => g.lineTo(p[0], p[1]));
    g.lineTo(x + 4, by + 40); g.lineTo(x - 4, by + 40);
    for (let i = L.length - 1; i >= 0; i--) g.lineTo(L[i][0], L[i][1]);
    g.closePath(); g.fill();
  }
  // a mist band: transparent → peak → transparent, so no hard horizontal edges
  function dxMist(g, y, hh, a, col = '226,227,223') {
    const mg = g.createLinearGradient(0, y - hh, 0, y + hh);
    mg.addColorStop(0, `rgba(${col},0)`); mg.addColorStop(0.55, `rgba(${col},${a})`); mg.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = mg; g.fillRect(-1500, y - hh, 5000, hh * 2);
  }
  function dxSetup() {
    const W = 1920, H = 1080;
    const r = rng(2014);
    // mountain ridges (far → near) as precomputed profiles
    const ridge = (y0, amp, f, seed) => { const pts = []; for (let x = -400; x <= 2400; x += 10) pts.push([x, y0 - amp * (0.55 * fbm(x * f, seed) + 0.45 * Math.pow(Math.abs(Math.sin(x * f * 2.2 + seed)), 1.6))]); return pts; };
    const ridges = [ridge(470, 230, 0.0026, 1.3), ridge(560, 190, 0.0034, 4.1), ridge(660, 150, 0.0045, 7.7)];
    // pines: back rows small, front rows tall; a few giants punch through the crown
    const pines = [];
    for (let row = 0; row < 3; row++) {
      const n = [70, 48, 26][row];
      for (let k = 0; k < n; k++) {
        const x = -300 + r() * 2500;
        const giant = row === 2 && x > 1190 && x < 1330 && r() < 0.6;
        const h = giant ? 700 + r() * 260 : [130, 230, 420][row] * (0.7 + r() * 0.6);
        pines.push({ row, x, by: [700, 790, 1100][row] + r() * 40, h, w: h * (0.16 + r() * 0.05), seed: 100 + k * 7 + row * 1000 });
      }
    }
    // birds roosting on the treetops inside the head
    const birds = [];
    for (let k = 0; k < 52; k++) {
      const x = 860 + r() * 420, y = 360 + r() * 260;
      birds.push({ x, y, t0: 2.25 + r() * 1.0 + (k % 7 === 0 ? 0.6 : 0), vx: -(260 + r() * 260), vy: -(120 + r() * 200), curl: (r() - 0.5) * 120, s: 9 + r() * 12, f: 7 + r() * 4, ph: r() * TAU });
    }
    // city at dusk: three depth layers, a gap kept open for the sun
    const towers = [];
    for (let layer = 0; layer < 3; layer++) {
      let x = -260;
      while (x < 2300) {
        const w = [54, 74, 120][layer] * (0.6 + r() * 0.8);
        const cx = x + w / 2, centre = 1 - Math.min(1, Math.abs(cx - 1080) / 760);
        const base = [760, 860, 1090][layer];
        let h = [300, 360, 300][layer] * (0.5 + r() * 0.6) * (0.55 + 0.75 * centre);
        if (layer === 2 && r() < 0.15) h += 90;
        // keep the sun clear between towers
        if (layer > 0 && Math.abs(cx - DX_SUN[0]) < 120 + w / 2) h = Math.min(h, base - 548);
        else if (layer === 0 && Math.abs(cx - DX_SUN[0]) < 90) h = Math.min(h, base - 560);
        const wins = [];
        const rw = rng(layer * 999 + Math.round(x * 3));
        const fy = [9, 11, 15][layer], fx = [8, 10, 13][layer];
        for (let wy = 12; wy < h - 8; wy += fy) { const floorLit = rw(); for (let wx = 5; wx < w - 6; wx += fx) if (rw() < 0.25 + 0.4 * (floorLit > 0.8)) wins.push([wx, wy, rw()]); }
        towers.push({ layer, x, w, h, base, wins, spire: r() < 0.12, set: r() < 0.3 ? 20 + r() * 50 : 0, crown: r() < 0.12 ? 1 : 0 });
        x += w + [3, 8, 18][layer] * r();
      }
    }
    // smoke field
    const NW = 320, NH = 180, field = new Float32Array(NW * NH);
    for (let y = 0; y < NH; y++) for (let x = 0; x < NW; x++) field[y * NW + x] = fbm(x * 0.03, y * 0.03 + 9);
    const fogTex = offscreen(480, 270), fg = fogTex.getContext('2d'), fd = fg.createImageData(480, 270);
    for (let y = 0; y < 270; y++) for (let x = 0; x < 480; x++) {
      const v = fbm(x * 0.012, y * 0.02 + 30), a = clamp((v - 0.42) * 2.6);
      const i = (y * 480 + x) * 4; fd.data[i] = 240; fd.data[i + 1] = 238; fd.data[i + 2] = 232; fd.data[i + 3] = a * 255;
    }
    fg.putImageData(fd, 0, 0);
    // print mottle: low-frequency tonal unevenness of a real enlargement
    const mott = offscreen(480, 270), mo = mott.getContext('2d'), md = mo.createImageData(480, 270);
    for (let y = 0; y < 270; y++) for (let x = 0; x < 480; x++) {
      const v = 255 - 46 * clamp(fbm(x * 0.02 + 50, y * 0.03) * 1.6 - 0.5) - 10 * h2(x, y);
      const i = (y * 480 + x) * 4; md.data[i] = v; md.data[i + 1] = v; md.data[i + 2] = v - 3; md.data[i + 3] = 255;
    }
    mo.putImageData(md, 0, 0);
    const M = offscreen(240, 135);
    return {
      ridges, pines, birds, towers, field, NW, NH, fogTex, mott, F: offscreen(W / 2, H / 2), PP: dxPortraitPlate(),
      S: offscreen(W, H), B: offscreen(W, H), P: offscreen(W, H), T: offscreen(W, H),
      M, Mg: M.getContext('2d'), Md: M.getContext('2d').createImageData(240, 135),
      R: offscreen(240, 135), Rd: M.getContext('2d').createImageData(240, 135),
    };
  }
  // camera: start deep inside the forest, pull back to reveal the head, then a slow push
  function dxCam(t) {
    const pull = E.ioC(seg(t, 0.6, 3.4));
    const pe = Math.pow(pull, 0.8);
    const s = Math.exp(lerp(Math.log(3.8), 0, pe)) * (1 + 0.045 * E.ioS(seg(t, 3.4, 10)));
    const drift = 1 - pull;
    const cx = lerp(1135, 960, pull) + 30 * E.ioS(seg(t, 3.4, 10)) - 25 * seg(t, 0, 1.2) * drift, cy = lerp(500, 540, pull);
    return { s, cx, cy };
  }
  function dxApply(g, cam, W, H, k = 1) { g.setTransform(k, 0, 0, k, 0, 0); g.translate(W / 2, H / 2); g.scale(cam.s, cam.s); g.translate(-cam.cx, -cam.cy); }
  function dxForest(g, t, st, W, H, cam) {
    const sky = g.createLinearGradient(0, -200, 0, 800);
    sky.addColorStop(0, '#dcdedb'); sky.addColorStop(0.55, '#bcc3c3'); sky.addColorStop(1, '#939ea0');
    g.fillStyle = sky; g.fillRect(-1500, -1000, 5000, 3500);
    // far layers go to a scratch canvas so they can be defocused as one
    const F = st.F, fg = F.getContext('2d');
    fg.setTransform(1, 0, 0, 1, 0, 0); fg.clearRect(0, 0, W, H);
    dxApply(fg, cam, W, H, 0.5);
    const cols = ['#8b9699', '#6a767c', '#4e5a5f'];
    st.ridges.forEach((pts, i) => {
      const dx = -t * [5, 11, 18][i];
      fg.fillStyle = cols[i];
      fg.beginPath(); fg.moveTo(pts[0][0] + dx, 1600);
      pts.forEach(p => fg.lineTo(p[0] + dx, p[1]));
      fg.lineTo(pts[pts.length - 1][0] + dx, 1600); fg.fill();
      dxMist(fg, [470, 560, 660][i] - 10, 90, 0.7);
    });
    fg.fillStyle = '#3c484d';
    for (const p of st.pines) if (p.row === 0) dxPine(fg, p.x - t * 24, p.by, p.h, p.w, p.seed);
    dxMist(fg, 700, 110, 0.65);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.filter = `blur(${(0.8 * cam.s).toFixed(1)}px)`;
    g.drawImage(F, 0, 0, W, H);
    g.filter = 'none';
    dxApply(g, cam, W, H);
    g.fillStyle = '#29343a';
    for (const p of st.pines) if (p.row === 1) dxPine(g, p.x - t * 38, p.by, p.h, p.w, p.seed);
    dxMist(g, 800, 120, 0.55);
    g.fillStyle = '#141a1d';
    for (const p of st.pines) if (p.row === 2) dxPine(g, p.x - t * 60, p.by, p.h, p.w, p.seed);
    // low ground fog drifting through the trunks
    dxMist(g, 1020, 140, 0.35);
  }
  function dxCity(g, t, st, W, H, lit, cam) {
    const sky = g.createLinearGradient(0, -200, 0, 900);
    sky.addColorStop(0, '#cdd0ce'); sky.addColorStop(0.5, '#aeb2b2'); sky.addColorStop(0.8, '#bba898'); sky.addColorStop(1, '#8d7f78');
    g.fillStyle = sky; g.fillRect(-1500, -1000, 5000, 3500);
    // the setting sun — the film's one warm note — sits behind the eye
    const sx = DX_SUN[0], sy = DX_SUN[1] + 26 * (1 - lit), sr = 58;
    const halo = g.createRadialGradient(sx, sy, sr * 0.6, sx, sy, sr * (5 + 2 * lit));
    halo.addColorStop(0, `rgba(240,150,90,${0.5 + 0.35 * lit})`); halo.addColorStop(0.35, `rgba(220,140,100,${0.15 + 0.1 * lit})`); halo.addColorStop(1, 'rgba(200,150,120,0)');
    g.fillStyle = halo; g.fillRect(sx - sr * 8, sy - sr * 8, sr * 16, sr * 16);
    const sun = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
    sun.addColorStop(0, `rgba(255,226,186,${0.85 + 0.15 * lit})`); sun.addColorStop(0.7, 'rgba(246,170,112,0.95)'); sun.addColorStop(0.93, 'rgba(226,122,70,0.9)'); sun.addColorStop(1, 'rgba(226,122,70,0)');
    g.fillStyle = sun; g.beginPath(); g.arc(sx, sy, sr, 0, TAU); g.fill();
    const tc = ['#8a9092', '#555d61', '#1b2124'];
    const F = st.F, fg = F.getContext('2d');
    fg.setTransform(1, 0, 0, 1, 0, 0); fg.clearRect(0, 0, W, H);
    for (let layer = 0; layer < 3; layer++) {
      const tg = layer === 0 ? fg : g;
      dxApply(tg, cam, W, H, layer === 0 ? 0.5 : 1);
      const dx = -t * [8, 16, 30][layer] + 80;
      for (const tw of st.towers) {
        if (tw.layer !== layer) continue;
        const x = tw.x + dx, y = tw.base - tw.h;
        tg.fillStyle = tc[layer];
        tg.fillRect(x, y, tw.w, tw.h + 500);
        if (tw.set) tg.fillRect(x + tw.w * 0.18, y - tw.set, tw.w * 0.64, tw.set + 2);
        if (tw.crown === 1) { tg.beginPath(); tg.moveTo(x, y + 1); tg.lineTo(x + tw.w, y - tw.w * 0.45); tg.lineTo(x + tw.w, y + 1); tg.fill(); }
        if (tw.spire) tg.fillRect(x + tw.w / 2 - 1.5, y - (tw.set || 0) - 80, 3, 80);
        // windows switch on in a wave from the sun outward
        const wave = lit * 1.7 - Math.abs(x + tw.w / 2 - sx) / 1300;
        if (wave > 0 && layer > 0) {
          const ww = [3, 3, 5][layer], wh = [3, 4, 6][layer];
          for (const [wx, wy, rr] of tw.wins) {
            if (rr > wave * 0.8) continue;
            tg.fillStyle = rr < 0.25 ? 'rgba(255,184,112,0.95)' : rr < 0.55 ? 'rgba(236,160,104,0.7)' : 'rgba(214,196,176,0.55)';
            tg.fillRect(x + wx, y + wy, ww, wh);
          }
        }
      }
      if (layer === 0) {
        dxMist(fg, 760, 160, 0.7, '214,208,200');
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.filter = `blur(${(0.7 * cam.s).toFixed(1)}px)`; g.drawImage(F, 0, 0, W, H); g.filter = 'none';
      } else if (layer === 1) dxMist(g, 860, 150, 0.6, '210,204,196');
    }
    dxMist(g, 1060, 160, 0.3, '210,204,196');
  }
  // short textured hair: an offset of the skull contour with a ragged, strand-scale edge
  const DX_HAIR = (() => {
    const pts = [];
    const r = rng(77);
    // sample a hand-placed skull arc from the hairline over the crown to the nape
    const arc = [[808, 318], [830, 236], [890, 168], [980, 124], [1090, 112], [1200, 136], [1290, 196], [1350, 290], [1378, 400], [1372, 520], [1350, 640], [1322, 760], [1300, 820]];
    const sm = catmullRaw(arc, 14);
    for (let i = 0; i < sm.length; i++) {
      const [x, y] = sm[i], [x2, y2] = sm[Math.min(sm.length - 1, i + 1)], [x0, y0] = sm[Math.max(0, i - 1)];
      const tx = x2 - x0, ty = y2 - y0, tl = Math.hypot(tx, ty) || 1;
      const nx = ty / tl, ny = -tx / tl; // outward
      const u = i / (sm.length - 1);
      const thick = 10 + 26 * Math.sin(Math.min(1, u * 1.3) * Math.PI) ;
      const jag = (r() - 0.5) * 4 + vnoise(i * 0.35, 3) * 9 + vnoise(i * 1.3, 5) * 3;
      pts.push([x + nx * (thick + jag), y + ny * (thick + jag)]);
    }
    return { outer: pts, inner: sm };
  })();
  function catmullRaw(pts, per) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < per; k++) {
        const s = k / per, s2 = s * s, s3 = s2 * s;
        const f = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * s + (2 * a - 5 * b + 4 * c2 - d) * s2 + (-a + 3 * b - 3 * c2 + d) * s3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function dxHair(g) {
    const { outer, inner } = DX_HAIR;
    g.beginPath();
    outer.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    void inner;
    g.lineTo(1150, 760); g.lineTo(900, 430);
    g.closePath();
  }
  // the portrait plate is static: render it once at 1.5× so the pull-back stays clean
  function dxPortraitPlate() {
    const K = 1.5, cv = offscreen(Math.round(2320 * K), Math.round(1280 * K)), g = cv.getContext('2d');
    g.setTransform(K, 0, 0, K, 200 * K, 100 * K);
    dxPortrait(g, 0);
    return cv;
  }
  function dxPortrait(g, t) {
    const [R, G, B] = DX_PAPER;
    const bg = g.createRadialGradient(1060, 470, 150, 960, 540, 1300);
    bg.addColorStop(0, `rgb(${R + 18},${G + 18},${B + 18})`); bg.addColorStop(0.6, `rgb(${R + 4},${G + 4},${B + 4})`); bg.addColorStop(1, `rgb(${R - 34},${G - 34},${B - 32})`);
    g.fillStyle = bg; g.fillRect(-1500, -1000, 5000, 3500);
    g.save();
    g.filter = 'blur(2px)';
    const hg = g.createLinearGradient(760, 0, 1400, 0);
    hg.addColorStop(0, '#2e2e2e'); hg.addColorStop(0.22, '#151515'); hg.addColorStop(1, '#0b0b0b');
    g.fillStyle = hg;
    dxHead(g); g.fill();
    dxHair(g); g.fill();
    g.filter = 'none';
    g.save(); dxHead(g); g.clip();
    // portrait modelling that ghosts through the landscape: rim light, brow, closed eye, cheek
    g.save(); g.beginPath(); g.rect(600, 420, 420, 660); g.clip();
    g.filter = 'blur(14px)';
    g.strokeStyle = 'rgba(125,125,122,0.55)'; g.lineWidth = 26; dxHead(g); g.stroke();
    g.restore();
    g.filter = 'blur(5px)';
    g.strokeStyle = 'rgba(92,92,90,0.6)'; g.lineWidth = 7;
    g.beginPath(); g.moveTo(800, 452); g.quadraticCurveTo(845, 438, 902, 452); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(812, 491); g.quadraticCurveTo(842, 502, 870, 489); g.stroke();
    g.filter = 'blur(24px)';
    g.fillStyle = 'rgba(72,72,72,0.5)'; g.beginPath(); g.ellipse(880, 570, 90, 70, 0, 0, TAU); g.fill();
    g.filter = 'none';
    g.restore();
    // crown dissolves into the sky
    const cr = g.createLinearGradient(0, 90, 0, 380);
    cr.addColorStop(0, `rgba(${R + 14},${G + 14},${B + 14},0.95)`); cr.addColorStop(0.45, `rgba(${R + 8},${G + 8},${B + 8},0.4)`); cr.addColorStop(1, `rgba(${R},${G},${B},0)`);
    g.fillStyle = cr; g.fillRect(700, 60, 900, 330);
    g.restore();
  }
  function dxBird(g, x, y, s, ph) {
    const fl = Math.sin(ph);
    g.beginPath();
    g.moveTo(x - s, y - s * 0.5 * fl);
    g.quadraticCurveTo(x - s * 0.45, y - s * 0.55 * fl - s * 0.1, x, y + s * 0.08);
    g.quadraticCurveTo(x + s * 0.45, y - s * 0.55 * fl - s * 0.1, x + s, y - s * 0.5 * fl);
    g.quadraticCurveTo(x + s * 0.4, y - s * 0.2 * fl + s * 0.15, x, y + s * 0.3);
    g.quadraticCurveTo(x - s * 0.4, y - s * 0.2 * fl + s * 0.15, x - s, y - s * 0.5 * fl);
    g.fill();
  }
  function dxSmoke(st, p, t, rim) {
    // threshold the drifting fbm field: alpha = smoothstep around the advancing front
    const { field, NW, Md, Rd } = st;
    const ox = Math.floor(t * 6) % 60, oy = Math.floor(t * 3) % 30;
    const d = Md.data, rd = Rd.data;
    for (let y = 0; y < 135; y++) for (let x = 0; x < 240; x++) {
      // bias so the smoke rolls in from the right
      const n = field[(y + oy) * NW + x + ox] * 0.75 + (1 - x / 240) * 0.25 + (y / 135) * 0.08;
      const v = (p - n) / 0.07;
      const a = v <= -1 ? 0 : v >= 1 ? 1 : 0.5 + 0.5 * Math.sin(v * Math.PI / 2);
      const i = (y * 240 + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = a * 255;
      if (rim) { const e = Math.exp(-v * v * 1.5) * rim; rd[i] = 245; rd[i + 1] = 242; rd[i + 2] = 236; rd[i + 3] = e * 255; }
    }
    st.Mg.putImageData(Md, 0, 0);
    if (rim) st.R.getContext('2d').putImageData(Rd, 0, 0);
  }
  function dxDraw(c, t, W, H, st) {
    const cam = dxCam(t);
    // ---- landscape plate ----
    const S = st.S, g = S.getContext('2d');
    dxApply(g, cam, W, H);
    const cityP = seg(t, 4.75, 6.7);
    if (cityP < 1) dxForest(g, t, st, W, H, cam);
    if (cityP > 0) {
      const lit = E.ioS(seg(t, 6.1, 8.3));
      const B = st.B, bg = B.getContext('2d');
      dxApply(bg, cam, W, H);
      dxCity(bg, t, st, W, H, lit, cam);
      bg.setTransform(1, 0, 0, 1, 0, 0);
      if (cityP < 1) {
        dxSmoke(st, lerp(-0.12, 1.12, E.ioS(cityP)), t, 1);
        bg.globalCompositeOperation = 'destination-in';
        bg.imageSmoothingQuality = 'high';
        bg.drawImage(st.M, 0, 0, W, H);
        bg.globalCompositeOperation = 'source-over';
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(B, 0, 0);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'multiply';
    g.drawImage(st.mott, -40 - t * 12, -20, W + 200, H + 60);
    g.globalCompositeOperation = 'source-over';
    // ---- portrait plate, screened on top ----
    const P = st.P, pg = P.getContext('2d');
    pg.setTransform(1, 0, 0, 1, 0, 0);
    pg.fillStyle = `rgb(${DX_PAPER.map(v => v - 34).join(',')})`; pg.fillRect(0, 0, W, H);
    dxApply(pg, cam, W, H);
    pg.drawImage(st.PP, -200, -100, 2320, 1280);
    pg.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(S, 0, 0);
    c.globalCompositeOperation = 'screen';
    c.drawImage(P, 0, 0);
    c.globalCompositeOperation = 'source-over';
    // smoke rim during the dissolve
    if (cityP > 0 && cityP < 1) {
      c.globalCompositeOperation = 'screen';
      c.globalAlpha = 0.85 * Math.sin(cityP * Math.PI);
      c.drawImage(st.R, 0, 0, W, H);
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    // ---- birds lift from the treetops and fly out of the head ----
    c.save();
    dxApply(c, cam, W, H);
    c.fillStyle = 'rgba(24,27,29,0.92)';
    for (const b of st.birds) {
      const dt = t - b.t0;
      let x = b.x - t * 60 * (cityP < 1 ? 1 : 0), y = b.y, s = b.s * 0.55, ph = 0.6;
      if (dt > 0) {
        const k = 1 - Math.exp(-dt * 1.8);
        x += b.vx * (dt - (1 - Math.exp(-dt * 1.8)) / 1.8) * 1.0 + b.curl * Math.sin(dt * 1.4);
        y += b.vy * dt * 0.7 * k - 40 * dt * k;
        s = b.s * (1 - 0.25 * seg(dt, 0, 4));
        ph = b.ph + dt * b.f * TAU * (1.4 - 0.5 * k);
      } else if (cityP > 0.3) continue;
      if (dt < 0 && t < 1.2) continue; // roosting birds appear as the camera settles
      if (x < -300 || y < -300) continue;
      c.globalAlpha = dt > 0 ? 1 : 0.6 * seg(t, 1.2, 2);
      dxBird(c, x, y, s, ph);
    }
    c.globalAlpha = 1;
    c.restore();
    // ---- drifting fog wisps over everything ----
    c.globalCompositeOperation = 'screen';
    const fx = (t * 38) % 1920;
    c.globalAlpha = 0.32;
    c.drawImage(st.fogTex, -fx, -60, W * 1.0 + 4, H * 1.1);
    c.drawImage(st.fogTex, W - fx, -60, W * 1.0 + 4, H * 1.1);
    c.globalAlpha = 0.18;
    const fx2 = (t * 70 + 600) % 2400;
    c.drawImage(st.fogTex, -fx2, 200, 2400, 1000);
    c.drawImage(st.fogTex, 2400 - fx2, 200, 2400, 1000);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    // ---- title lockup ----
    const tl = seg(t, 8.0, 9.2);
    if (tl > 0) {
      const T = st.T, tg = T.getContext('2d');
      tg.setTransform(1, 0, 0, 1, 0, 0);
      tg.clearRect(0, 0, W, H);
      text(tg, 'TWO FRAMES  ·  ONE NEGATIVE', 170, 418, { font: CORM, weight: 500, size: 22, ls: 7, color: '#5a5f60' });
      text(tg, 'Double', 160, 535, { font: CORM, weight: 300, size: 150, ls: 2, color: '#24292b' });
      text(tg, 'Exposure', 160, 665, { font: CORM, weight: 300, style: 'italic', size: 150, ls: 1, color: '#24292b' });
      tg.fillStyle = DX_WARM; tg.fillRect(170, 712, 64, 3);
      text(tg, 'IN-CAMERA  ·  1860s —', 254, 720, { font: CORM, weight: 500, size: 20, ls: 6, color: '#5a5f60' });
      // smoke-reveal the type with the same field
      dxSmoke(st, lerp(-0.1, 1.15, E.outQ(tl)), t + 3, 0);
      tg.globalCompositeOperation = 'destination-in';
      tg.drawImage(st.M, 0, 0, W, H);
      tg.globalCompositeOperation = 'source-over';
      c.globalCompositeOperation = 'multiply';
      c.drawImage(T, 0, 0);
      c.globalCompositeOperation = 'source-over';
    }
    // ---- grade: cool shadows, warm paper, gate weave, grain ----
    c.globalCompositeOperation = 'soft-light';
    c.fillStyle = 'rgba(120,140,150,0.35)'; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
    vignette(c, W, H, 0.42, '30,32,34');
    grain(c, W, H, t, 0.09);
    // breathing pulse: the plate swells very slightly with the heartbeat
    const beat = Math.max(0, Math.sin((t - 0.2) * Math.PI * 1.1)) ** 12;
    if (beat > 0.01) { c.fillStyle = `rgba(20,22,24,${0.05 * beat})`; c.fillRect(0, 0, W, H); }
    const fin = 1 - seg(t, 0, 0.7);
    if (fin > 0) { c.fillStyle = `rgba(${DX_PAPER.join(',')},${fin})`; c.fillRect(0, 0, W, H); }
  }
  MG.film({
    id: 'doubleexposure', dur: 10, poster: 9.5,
    fonts: [['300 150px "Cormorant Garamond"', 'Double'], ['italic 300 150px "Cormorant Garamond"', 'Exposure'], ['500 22px "Cormorant Garamond"', 'TWO FRAMES ONE NEGATIVE IN-CAMERA SCREEN & MULTIPLY']],
    meta: {
      family: 'H', name: 'Double Exposure', sub: 'Two Frames, One Image', era: '1860s —',
      origin: 'Exposing the same frame twice was first a darkroom accident, then a spirit-photography trick in the 1860s and a staple of silent-film dream sequences. The modern portrait-plus-landscape look, a silhouette filled with forest or city, came through album covers and posters and was fixed in motion by Elastic\'s 2014 title sequence for True Detective.',
      works: 'True Detective season 1 titles (Elastic, Patrick Clair, 2014) · The Man with the Rubber Head (Georges Méliès, 1901) · Vertigo title sequence (Saul Bass, 1958) · Christoffer Relander, We Are Nature (2012) · Dan Mountford, double-exposure portraits (2011) · Andreas Lie, Wilderness portraits (2013)',
      tech: ['Screen blend: dark portrait prints the landscape, bright sky stays paper', 'Parallax landscape layers drawn under a shared camera', 'fbm noise threshold as a smoke dissolve (with glowing rim)', 'Multiply-blended type revealed through the same smoke'],
      accent: DX_WARM,
      motionDNA: 'Slow and breathing: a drift through misty pines pulls back to reveal a head, birds burst out past its edge, smoke rolls the forest into a city at dusk, and a heartbeat pulse carries it to a quiet type lockup.',
      visualDNA: 'A pale paper ground, a profile silhouette filled with layered pines, mountains and towers, desaturated slate and fog tones with a single warm sun set behind the eye, film grain and soft vignette.',
      transitions: 'Pull-back reveal, bird scatter, smoke dissolve between landscapes, smoke-revealed title.',
      implementation: ['Camera', 'Photoshop', 'After Effects', 'Canvas 2D'],
      reproducibility: 'Needs live action (this film is a procedural homage)', loopable: false,
    },
    setup: dxSetup,
    draw: dxDraw,
    score(A) {
      A.bus.gain.value = 1.25;
      // wind through pines, then distant city air
      A.noise(0, { type: 'bandpass', f: 500, q: 0.5, dur: 5.6, g: 0.05, hold: true, a: 1.2, rel: 1.4 });
      A.noise(0, { type: 'highpass', f: 5000, dur: 5.2, g: 0.012, hold: true, a: 1.5, rel: 1.2 });
      A.noise(5.0, { type: 'lowpass', f: 300, dur: 5.0, g: 0.06, hold: true, a: 1.4, rel: 1.0 });
      // drone: low open fifths, minor colour, slowly shifting
      const drone = (t0, d, ns, g) => ns.forEach((m, i) => {
        A.osc(t0, { type: 'triangle', f: midi(m), dur: d, g, a: d * 0.3, hold: true, rel: 1.4, rev: 0.7, pan: (i % 2 ? 0.3 : -0.3), vib: [0.2 + i * 0.07, 2] });
        A.osc(t0, { type: 'sawtooth', f: midi(m), dur: d, g: g * 0.35, a: d * 0.4, hold: true, rel: 1.4, lp: 500, detune: 9, rev: 0.6 });
      });
      drone(0, 5.4, [33, 40, 45, 48], 0.04);
      drone(5.0, 3.6, [29, 36, 45, 48, 52], 0.04);
      drone(8.1, 1.9, [33, 40, 45, 49, 52], 0.04);
      // heartbeat pulse
      for (let k = 0; k < 11; k++) {
        const tt = 0.2 + k * 0.91;
        if (tt > 9.6) break;
        const gg = 0.18 + 0.12 * Math.sin(Math.min(1, tt / 8) * Math.PI * 0.5);
        A.osc(tt, { f: 62, f2: 40, glide: 0.25, dur: 0.6, g: gg });
        A.osc(tt + 0.2, { f: 55, f2: 38, glide: 0.2, dur: 0.45, g: gg * 0.6 });
      }
      // sparse piano-like notes (soft bells, low partial ratios)
      [[1.0, 69], [2.0, 72], [3.6, 76], [4.4, 74], [6.0, 72], [6.9, 77], [7.6, 76]].forEach(([tt, m], i) => A.bell(tt, midi(m), { ratios: [1, 2, 3.01, 4.1], g: 0.05, dur: 3.2, rev: 0.75, pan: (i % 2 ? 0.25 : -0.25) }));
      // the reveal: a long breath of air
      A.noise(0.6, { type: 'bandpass', f: 300, f2: 1400, q: 0.7, dur: 2.9, g: 0.05, swell: 0.7, rev: 0.4 });
      // birds take off: wing flutter bursts and a few distant calls
      for (let k = 0; k < 30; k++) {
        const tt = 2.25 + hash(k * 3.3) * 1.3;
        A.noise(tt, { type: 'bandpass', f: 900 + hash(k) * 900, q: 1.2, dur: 0.07, g: 0.06 + hash(k * 1.7) * 0.05, pan: -0.6 + hash(k * 5.1) * 0.8 });
      }
      A.noise(2.3, { type: 'bandpass', f: 1200, q: 0.6, dur: 1.4, g: 0.05, swell: 0.3, pan: -0.3 });
      [[2.6, 2200, 1700], [3.05, 2500, 1900], [3.5, 2000, 1500]].forEach(([tt, f1, f2], i) => A.osc(tt, { f: f1, f2, glide: 0.18, dur: 0.22, g: 0.02, rev: 0.7, pan: -0.5 + i * 0.2 }));
      // smoke dissolve
      A.noise(4.8, { type: 'bandpass', f: 220, f2: 2400, q: 0.8, dur: 2.0, g: 0.08, swell: 0.6, rev: 0.6 });
      A.noise(5.2, { type: 'highpass', f: 3000, f2: 7000, dur: 1.6, g: 0.025, swell: 0.6, rev: 0.6 });
      // the sun warms: a rising swell into the climax
      A.osc(6.2, { type: 'sawtooth', f: midi(57), dur: 2.2, g: 0.025, a: 1.8, hold: true, rel: 0.4, lp: 400, lp2: 2200, lpT: 2.0, rev: 0.6 });
      A.osc(6.2, { type: 'sawtooth', f: midi(64), dur: 2.2, g: 0.02, a: 1.8, hold: true, rel: 0.4, lp: 400, lp2: 2200, lpT: 2.0, rev: 0.6, detune: 8 });
      // title: low soft hit and a held minor-ninth chord
      A.osc(8.05, { f: 55, f2: 34, glide: 1.0, dur: 1.9, g: 0.4 });
      A.noise(8.05, { type: 'lowpass', f: 1200, f2: 200, dur: 1.2, g: 0.07, rev: 0.7 });
      [69, 72, 76, 83].forEach((m, i) => A.bell(8.1 + i * 0.12, midi(m), { ratios: [1, 2, 3.01], g: 0.04, dur: 2.0, rev: 0.8, pan: (i - 1.5) * 0.3 }));
    },
  });

  /* ======================================================================
     TILT-SHIFT MINIATURE — a real-scale harbour town seen from a rooftop, faked
     into a toy. Scene drawn in true perspective, then a blur pyramid is composited
     by vertical distance from a sliding focus band; motion is stepped like a
     time-lapse and colours pushed to model-railway saturation.
     ====================================================================== */
  const TS_YAW = 0.6, TS_PITCH = 0.72, TS_D = 205, TS_F = 1500;
  const TS_STEP = 12; // time-lapse frame rate of the motion
  const TS_WALL = ['#fbf3df', '#f6e7c8', '#f2d0a9', '#eef0f2', '#ffd8a8', '#d8e8dc', '#f4c2c2', '#fff8ec', '#bfdbe8'];
  const TS_ROOF = ['#d0573c', '#c44b30', '#d0573c', '#b84a32', '#4f5d75', '#5f6b80', '#d0573c', '#2a9d8f', '#f3a712', '#3f88c5', '#e63946', '#c44b30'];
  const TS_CAR = ['#e63946', '#f4a300', '#1d7fe0', '#ffffff', '#2bb673', '#ffcf00', '#ff6fa8', '#222831'];
  const TS_AMB = 0.5, TS_DIF = 0.62;
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const shade = (c, k) => `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`;
  // road grid: TS_RX are roads of constant x, TS_RZ roads of constant z
  const TS_RX = [-180, -150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150, 180], TS_RZ = [-30, 0, 30, 60, 90, 120, 150, 180, 210];
  function tsCam(t) {
    const u = E.ioS(seg(t, 0, 10));
    return { cx: 6 - 12 * u, cz: 12 + 8 * u, yaw: TS_YAW + 0.08 * u, d: TS_D + 38 - 70 * u };
  }
  function tsProj(cam) {
    const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(TS_PITCH), sp = Math.sin(TS_PITCH);
    return (x, y, z) => {
      const dx = x - cam.cx, dz = z - cam.cz;
      const xr = dx * cy - dz * sy, zr = dx * sy + dz * cy;
      const Yc = y * cp + zr * sp, Zc = cam.d - y * sp + zr * cp;
      return [960 + TS_F * xr / Zc, 540 - TS_F * Yc / Zc, Zc];
    };
  }
  function tsSetup() {
    const r = rng(2008);
    const objs = []; // static scenery
    const roadsX = TS_RZ, roadsZ = TS_RX;
    // blocks between roads; z<-40 is harbour water
    for (let i = 0; i < roadsZ.length - 1; i++) for (let j = 0; j < roadsX.length - 1; j++) {
      const x0 = roadsZ[i] + 4, x1 = roadsZ[i + 1] - 4, z0 = roadsX[j] + 4, z1 = roadsX[j + 1] - 4;
      const bx = (x0 + x1) / 2, bz = (z0 + z1) / 2;
      if (Math.abs(bx + 45) < 5 && Math.abs(bz - 45) < 5) { objs.push({ kind: 'fair', x0, x1, z0, z1 }); continue; }
      if (Math.abs(bx - 15) < 5 && Math.abs(bz - 15) < 5) { objs.push({ kind: 'park', x0, x1, z0, z1 }); continue; }
      if (Math.abs(bx + 15) < 5 && Math.abs(bz - 15) < 5) { objs.push({ kind: 'plaza', x0, x1, z0, z1 }); continue; }
      objs.push({ kind: 'block', x0, x1, z0, z1 });
    }
    const boxes = [], trees = [], people = [], lots = [], parked = [];
    const centre = (x, z) => Math.max(0, 1 - Math.hypot(x - 10, z - 20) / 85);
    objs.forEach(b => {
      if (b.kind === 'block') {
        // irregular lots: split the block into uneven strips, then fill each lot
        const cuts = (a0, a1, n) => { const w = []; let tot = 0; for (let i = 0; i < n; i++) { const v = 0.6 + r() * 0.8; w.push(v); tot += v; } let acc = a0; return w.map(v => { const s0 = acc; acc += (a1 - a0) * v / tot; return [s0, acc]; }); };
        const k0 = centre((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2);
        cuts(b.x0, b.x1, 2 + Math.floor(r() * 3)).forEach(([x0, x1]) => cuts(b.z0, b.z1, 2 + Math.floor(r() * 2)).forEach(([z0, z1]) => {
          x0 += 0.5; x1 -= 0.5; z0 += 0.5; z1 -= 0.5;
          const roll = r();
          const tall = roll < k0 * 0.42, mid = !tall && roll < 0.06 + k0 * 0.32;
          if (!tall && !mid && r() < 0.14) {
            // garden or car park
            if (r() < 0.5) { for (let q = 0; q < 2; q++) trees.push({ x: lerp(x0 + 1.5, x1 - 1.5, r()), z: lerp(z0 + 1.5, z1 - 1.5, r()), rr: 1.2 + r() * 0.8, c: hex(['#3f9d3a', '#5cb84a', '#2f8a46'][Math.floor(r() * 3)]) }); lots.push({ x0, x1, z0, z1, c: '#7dbb57' }); }
            else { lots.push({ x0, x1, z0, z1, c: '#9ea3a8' }); for (let q = 0; q < 5; q++) parked.push({ x: lerp(x0 + 1.2, x1 - 1.2, (q + 0.5) / 5), z: lerp(z0, z1, r() < 0.5 ? 0.3 : 0.7), c: hex(TS_CAR[Math.floor(r() * TS_CAR.length)]) }); }
            return;
          }
          const h = tall ? 14 + r() * 26 * k0 : mid ? 6 + r() * 7 : 3 + r() * 2.4;
          const wall = hex(tall ? ['#eef1f4', '#cfe3f3', '#f3efe2', '#bfe1d9', '#ffd9e2'][Math.floor(r() * 5)] : TS_WALL[Math.floor(r() * TS_WALL.length)]);
          const roof = hex(tall || mid ? ['#c9c5bd', '#b7bcc2', '#d8d2c6', '#9aa7b3'][Math.floor(r() * 4)] : TS_ROOF[Math.floor(r() * TS_ROOF.length)]);
          boxes.push({ x0, x1, z0, z1, h, wall, roof, gable: !tall && !mid ? ((x1 - x0) > (z1 - z0) ? 'x' : 'z') : null, rh: 1.4 + r() * 1.2, floors: tall || mid ? Math.floor(h / 2.8) : 0, ac: (tall || mid) && r() < 0.7, lit: r() });
        }));
      } else if (b.kind === 'park') {
        for (let k = 0; k < 26; k++) trees.push({ x: lerp(b.x0 + 2, b.x1 - 2, r()), z: lerp(b.z0 + 2, b.z1 - 2, r()), rr: 1.6 + r() * 1.4, c: hex(['#3f9d3a', '#5cb84a', '#2f8a46', '#7cc35a'][Math.floor(r() * 4)]) });
        for (let k = 0; k < 30; k++) people.push({ x: lerp(b.x0, b.x1, r()), z: lerp(b.z0, b.z1, r()), vx: (r() - 0.5) * 1.2, vz: (r() - 0.5) * 1.2, c: TS_CAR[Math.floor(r() * 7)], area: b });
      } else if (b.kind === 'plaza') {
        for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; trees.push({ x: (b.x0 + b.x1) / 2 + Math.cos(a) * 8, z: (b.z0 + b.z1) / 2 + Math.sin(a) * 8, rr: 1.4, c: hex('#4fae47') }); }
        for (let k = 0; k < 45; k++) people.push({ x: lerp(b.x0, b.x1, r()), z: lerp(b.z0, b.z1, r()), vx: (r() - 0.5) * 1.6, vz: (r() - 0.5) * 1.6, c: TS_CAR[Math.floor(r() * 7)], area: b });
      } else if (b.kind === 'fair') {
        for (let k = 0; k < 90; k++) people.push({ x: lerp(b.x0, b.x1, r()), z: lerp(b.z0, b.z1, r()), vx: (r() - 0.5) * 1.4, vz: (r() - 0.5) * 1.4, c: TS_CAR[Math.floor(r() * 7)], area: b });
      }
    });
    // street trees along the avenues
    for (let x = -176; x < 180; x += 7) [0, 30, 60, 90, 120, 150].forEach(z => { if (r() < 0.55 && !(x < -40 && z > 40)) trees.push({ x, z: z + (r() < 0.5 ? 4.6 : -4.6), rr: 1.1 + r() * 0.5, c: hex(['#3f9d3a', '#5cb84a', '#2f8a46'][Math.floor(r() * 3)]) }); });
    // cars on lanes: along x (roads at z = const) and along z (roads at x = const)
    const cars = [];
    for (let k = 0; k < 150; k++) {
      const alongX = r() < 0.55;
      const road = alongX ? [-30, 0, 30, 60, 90, 120][Math.floor(r() * 6)] : [-90, -60, -30, 0, 30, 60, 90, 120][Math.floor(r() * 8)];
      const dir = r() < 0.5 ? 1 : -1;
      const bus = r() < 0.08;
      cars.push({ alongX, road, dir, off: r() * 200, v: (6 + r() * 4) * (bus ? 0.7 : 1), c: hex(bus ? '#ffcf00' : TS_CAR[Math.floor(r() * TS_CAR.length)]), len: bus ? 7 : 3.6, wid: bus ? 2 : 1.7, hgt: bus ? 2.4 : 1.3 });
    }
    // harbour boats
    const boats = [
      { x: -70, z: -66, v: 3.2, len: 16, wid: 5, c: hex('#ffffff'), cab: hex('#d1263b'), ferry: true },
      { x: 30, z: -82, v: -4.5, len: 7, wid: 2.6, c: hex('#e4572e'), cab: hex('#ffffff') },
      { x: -20, z: -95, v: 2.4, len: 9, wid: 3, c: hex('#2f4b8f'), cab: hex('#fbf3df'), sail: true },
    ];
    const moored = [];
    [-55, -5, 45].forEach(px => { for (let k = 0; k < 4; k++) moored.push({ x: px + (k % 2 ? 4.2 : -4.2), z: -48 - Math.floor(k / 2) * 9 - r() * 2, len: 5 + r() * 3, wid: 1.8 + r() * 0.6, c: hex(TS_CAR[Math.floor(r() * 7)]), ph: r() * TAU }); });
    const containers = [];
    for (let a = 0; a < 6; a++) for (let c = 0; c < 2; c++) for (let lvl = 0; lvl < 1 + Math.floor(r() * 3); lvl++) containers.push({ x: 66 + a * 3.4, z: -37 + c * 6.5, y: lvl * 2.6, c: hex(['#e63946', '#1d7fe0', '#2bb673', '#f4a300', '#ff6fa8', '#ffffff'][Math.floor(r() * 6)]) });
    // window lights on the two camera-facing walls (x0 and z0), for dusk
    boxes.forEach(bx => {
      const w = [], rw = rng(Math.round(bx.x0 * 13 + bx.z0 * 7));
      const rows = bx.floors ? bx.floors : 1;
      for (let f = 0; f < rows; f++) {
        const y = bx.floors ? (f + 0.5) * bx.h / rows : bx.h * 0.5;
        const nx = Math.max(1, Math.floor((bx.z1 - bx.z0) / 2.2)), nz = Math.max(1, Math.floor((bx.x1 - bx.x0) / 2.2));
        for (let i = 0; i < nx; i++) if (rw() < 0.45) w.push([bx.x0 - 0.05, y, lerp(bx.z0, bx.z1, (i + 0.5) / nx), rw()]);
        for (let i = 0; i < nz; i++) if (rw() < 0.45) w.push([lerp(bx.x0, bx.x1, (i + 0.5) / nz), y, bx.z0 - 0.05, rw()]);
      }
      bx.wins = w;
    });
    const woods = [];
    for (let k = 0; k < 260; k++) { const z = 215 + r() * 80, x = (r() - 0.5) * 2 * (230 + (z - 215) * 2.5); woods.push([x, z, 2.5 + r() * 3, ['#3f8f3a', '#4fa246', '#357f3a', '#5cae4b'][Math.floor(r() * 4)]]); }
    for (let k = 0; k < 160; k++) { const side = r() < 0.5 ? -1 : 1, x = side * (190 + r() * 120), z = -20 + r() * 240; woods.push([x, z, 2 + r() * 2.5, ['#3f8f3a', '#4fa246', '#357f3a'][Math.floor(r() * 3)]]); }
    woods.sort((a, b2) => b2[1] - a[1]);
    // street lamps for the dusk sequence
    const lamps = [];
    TS_RZ.forEach(z => { for (let x = -175; x < 180; x += 9) lamps.push([x, z + 4.2]); });
    TS_RX.forEach(x => { for (let z = -34; z < 215; z += 9) lamps.push([x + 4.2, z]); });
    return { woods, lamps, objs, boxes, trees, people, cars, lots, parked, boats, moored, containers, S: offscreen(1920, 1080), T: offscreen(1920, 1080), pyr: makePyr() };
  }
  // painter's list item helpers
  function tsQuad(g, P, pts, fill) {
    const q = pts.map(p => P(p[0], p[1], p[2]));
    // back-face cull by screen winding (counter-clockwise in world → visible)
    let a = 0; for (let i = 0; i < q.length; i++) { const p0 = q[i], p1 = q[(i + 1) % q.length]; a += p0[0] * p1[1] - p1[0] * p0[1]; }
    if (a <= 0) return false;
    g.fillStyle = fill; g.beginPath(); g.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) g.lineTo(q[i][0], q[i][1]); g.closePath(); g.fill();
    return q;
  }
  function tsBox(g, P, x0, x1, z0, z1, y0, y1, col, sun, top = col, o = {}) {
    // faces wound counter-clockwise as seen from outside
    const lit = n => TS_AMB + TS_DIF * Math.max(0, n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2]);
    const faces = [
      [[[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1]],
      [[[x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1]], [0, 0, 1]],
      [[[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]], [-1, 0, 0]],
      [[[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], [1, 0, 0]],
    ];
    faces.forEach(([pts, n]) => {
      const q = tsQuad(g, P, pts, shade(col, lit(n)));
      if (q && o.floors) {
        // window bands: the scale cue that makes a model read as a real building
        g.strokeStyle = 'rgba(40,60,90,0.35)'; g.lineWidth = 1;
        g.beginPath();
        for (let f = 1; f < o.floors; f++) {
          const u = f / o.floors;
          const a = [lerp(q[0][0], q[3][0], u), lerp(q[0][1], q[3][1], u)], b = [lerp(q[1][0], q[2][0], u), lerp(q[1][1], q[2][1], u)];
          g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]);
        }
        g.stroke();
      }
    });
    if (y1 > y0 && top) tsQuad(g, P, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]].reverse(), shade(top, 1.04));
  }
  function tsFill(g, P, pts, fill) {
    const q = pts.map(p => P(p[0], p[1], p[2]));
    g.fillStyle = fill; g.beginPath(); g.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) g.lineTo(q[i][0], q[i][1]); g.closePath(); g.fill();
  }
  function tsGable(g, P, b, sun) {
    // the camera sits towards −x/−z, so the +x/+z roof plane is drawn first and the near plane over it
    const { x0, x1, z0, z1, h, rh } = b;
    const lit = n => TS_AMB + TS_DIF * Math.max(0, n[0] * sun[0] + n[1] * sun[1] + n[2] * sun[2]);
    tsBox(g, P, x0, x1, z0, z1, 0, h, b.wall, sun, null);
    const yt = h + rh, ov = 0.35;
    if (b.gable === 'x') {
      const zm = (z0 + z1) / 2;
      tsFill(g, P, [[x0 - ov, h - 0.2, z1 + ov], [x1 + ov, h - 0.2, z1 + ov], [x1 + ov, yt, zm], [x0 - ov, yt, zm]], shade(b.roof, lit([0, 0.7, 0.7])));
      tsFill(g, P, [[x0, h, z0], [x0, h, z1], [x0, yt, zm]], shade(b.wall, lit([-1, 0, 0])));
      tsFill(g, P, [[x0 - ov, h - 0.2, z0 - ov], [x1 + ov, h - 0.2, z0 - ov], [x1 + ov, yt, zm], [x0 - ov, yt, zm]], shade(b.roof, lit([0, 0.7, -0.7])));
    } else {
      const xm = (x0 + x1) / 2;
      tsFill(g, P, [[x1 + ov, h - 0.2, z0 - ov], [x1 + ov, h - 0.2, z1 + ov], [xm, yt, z1 + ov], [xm, yt, z0 - ov]], shade(b.roof, lit([0.7, 0.7, 0])));
      tsFill(g, P, [[x0, h, z0], [x1, h, z0], [xm, yt, z0]], shade(b.wall, lit([0, 0, -1])));
      tsFill(g, P, [[x0 - ov, h - 0.2, z0 - ov], [x0 - ov, h - 0.2, z1 + ov], [xm, yt, z1 + ov], [xm, yt, z0 - ov]], shade(b.roof, lit([-0.7, 0.7, 0])));
    }
    // ridge highlight
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1;
    const ra = b.gable === 'x' ? P(x0 - ov, yt, (z0 + z1) / 2) : P((x0 + x1) / 2, yt, z0 - ov), rb = b.gable === 'x' ? P(x1 + ov, yt, (z0 + z1) / 2) : P((x0 + x1) / 2, yt, z1 + ov);
    g.beginPath(); g.moveTo(ra[0], ra[1]); g.lineTo(rb[0], rb[1]); g.stroke();
  }
  function tsPoly(g, P, pts) { const q = pts.map(p => P(p[0], 0, p[1])); g.beginPath(); g.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) g.lineTo(q[i][0], q[i][1]); g.closePath(); }
  function hull(pts) {
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function tsScene(g, t, st) {
    const cam = tsCam(t), P = tsProj(cam);
    // motion clock: stepped like a time-lapse, and racing faster in the climax
    const tq = Math.floor(t * TS_STEP) / TS_STEP;
    const sim = tq * 3 + 9 * Math.pow(seg(tq, 6.6, 8.6), 2) * 2.2 + Math.max(0, tq - 8.6) * 3;
    // sun swings across the sky with the time-lapse
    const sa = -0.9 + sim * 0.018;
    const sun = [Math.cos(sa) * 0.62, 0.55, Math.sin(sa) * 0.62 - 0.25];
    const sl = Math.hypot(...sun); sun[0] /= sl; sun[1] /= sl; sun[2] /= sl;
    const shx = -sun[0] / sun[1], shz = -sun[2] / sun[1];
    // ground
    g.fillStyle = '#2f86b5'; g.fillRect(0, 0, 1920, 1080);
    // land: everything north of the quay
    g.fillStyle = '#86b85c'; tsPoly(g, P, [[-230, -41], [230, -41], [520, 300], [-520, 300]]); g.fill();
    // shimmer bands on the water (stepped)
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1.2;
    for (let k = 0; k < 40; k++) {
      const z = -44 - k * 2.6, x = -160 + hash(k * 3.1) * 300 + ((sim * 1.5 + k * 7) % 30);
      const a = P(x, 0, z), b = P(x + 6 + hash(k) * 8, 0, z);
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
    }
    // quay edge
    g.fillStyle = '#c9c1b0'; tsPoly(g, P, [[-230, -41], [230, -41], [230, -38], [-230, -38]]); g.fill();
    // piers
    [-55, -5, 45].forEach(px => { g.fillStyle = '#b89a72'; tsPoly(g, P, [[px - 1.6, -41], [px + 1.6, -41], [px + 1.6, -76], [px - 1.6, -76]]); g.fill(); });
    // blocks: pavement, park grass, plaza tiles, fairground sand
    for (const b of st.objs) {
      const col = b.kind === 'park' ? '#69b04a' : b.kind === 'plaza' ? '#e9dcc3' : b.kind === 'fair' ? '#e8c98f' : '#d8d1c2';
      g.fillStyle = col; tsPoly(g, P, [[b.x0 - 1.5, b.z0 - 1.5], [b.x1 + 1.5, b.z0 - 1.5], [b.x1 + 1.5, b.z1 + 1.5], [b.x0 - 1.5, b.z1 + 1.5]]); g.fill();
      if (b.kind === 'park') {
        g.strokeStyle = '#efe3c4'; g.lineWidth = 2.2; const c0 = P(b.x0, 0, b.z0), c1 = P(b.x1, 0, b.z1), c2 = P(b.x0, 0, b.z1), c3 = P(b.x1, 0, b.z0);
        g.beginPath(); g.moveTo(c0[0], c0[1]); g.lineTo(c1[0], c1[1]); g.moveTo(c2[0], c2[1]); g.lineTo(c3[0], c3[1]); g.stroke();
        // pond
        g.fillStyle = '#4aa3c9'; g.beginPath();
        for (let k = 0; k <= 24; k++) { const a = k / 24 * TAU, p = P(b.x0 + 15 + Math.cos(a) * 4.5, 0, b.z0 + 7 + Math.sin(a) * 3); k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
        g.fill();
      }
      if (b.kind === 'plaza') {
        g.fillStyle = '#7fc4e0'; g.beginPath();
        for (let k = 0; k <= 24; k++) { const a = k / 24 * TAU, p = P((b.x0 + b.x1) / 2 + Math.cos(a) * 3.2, 0, (b.z0 + b.z1) / 2 + Math.sin(a) * 3.2); k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
        g.fill();
      }
    }
    st.lots.forEach(l => { g.fillStyle = l.c; tsPoly(g, P, [[l.x0, l.z0], [l.x1, l.z0], [l.x1, l.z1], [l.x0, l.z1]]); g.fill(); });
    // distant woods beyond the town
    st.woods.forEach(w => { const p = P(w[0], 2, w[1]), q = P(w[0] + w[2], 2, w[1]); const rr = Math.abs(q[0] - p[0]) + 1; g.fillStyle = w[3]; g.beginPath(); g.arc(p[0], p[1], rr, 0, TAU); g.fill(); });
    // roads with dashed centre lines and zebra crossings
    g.fillStyle = '#5d636b';
    TS_RZ.forEach(z => { tsPoly(g, P, [[-200, z - 3.4], [200, z - 3.4], [200, z + 3.4], [-200, z + 3.4]]); g.fill(); });
    TS_RX.forEach(x => { tsPoly(g, P, [[x - 3.4, -38], [x + 3.4, -38], [x + 3.4, 240], [x - 3.4, 240]]); g.fill(); });
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.3; g.setLineDash([6, 7]);
    g.beginPath();
    TS_RZ.forEach(z => { const a = P(-200, 0, z), b = P(200, 0, z); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); });
    TS_RX.forEach(x => { const a = P(x, 0, -38), b = P(x, 0, 240); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); });
    g.stroke(); g.setLineDash([]);
    g.fillStyle = 'rgba(255,255,255,0.9)';
    TS_RZ.forEach(z => TS_RX.forEach(x => {
      for (let k = -3; k <= 3; k++) { tsPoly(g, P, [[x + 4.2, z + k - 0.3], [x + 6.2, z + k - 0.3], [x + 6.2, z + k + 0.3], [x + 4.2, z + k + 0.3]]); g.fill(); }
    }));
    // ---- shadows (one path so overlaps don't double-darken) ----
    g.fillStyle = 'rgba(28,36,80,0.4)';
    g.beginPath();
    const addShadow = (x0, x1, z0, z1, h) => {
      const pts = [[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0 + shx * h, z0 + shz * h], [x1 + shx * h, z0 + shz * h], [x1 + shx * h, z1 + shz * h], [x0 + shx * h, z1 + shz * h]];
      const hp = hull(pts).map(p => P(p[0], 0.02, p[1]));
      g.moveTo(hp[0][0], hp[0][1]); for (let i = 1; i < hp.length; i++) g.lineTo(hp[i][0], hp[i][1]); g.closePath();
    };
    st.boxes.forEach(b => addShadow(b.x0, b.x1, b.z0, b.z1, b.h + (b.gable ? b.rh * 0.6 : 0)));
    st.containers.forEach(c => addShadow(c.x - 1.5, c.x + 1.5, c.z - 3, c.z + 3, c.y + 2.6));
    g.fill();
    g.beginPath();
    st.trees.forEach(tr => { const p = P(tr.x + shx * 3, 0.02, tr.z + shz * 3), q = P(tr.x + shx * 3 + tr.rr, 0.02, tr.z + shz * 3); const rr = Math.abs(q[0] - p[0]) + 1; g.moveTo(p[0] + rr, p[1]); g.ellipse(p[0], p[1], rr, rr * 0.75, 0, 0, TAU); });
    g.fill();

    // ---- painter's list of 3D objects ----
    const items = [];
    const off = p => p[0] < -120 || p[0] > 2040 || p[1] < -260 || p[1] > 1200;
    st.boxes.forEach(b => { const pc = P((b.x0 + b.x1) / 2, 0, (b.z0 + b.z1) / 2); if (off(pc)) return; items.push([pc[2] - b.h * 0.3, () => {
      if (b.gable) tsGable(g, P, b, sun);
      else {
        tsBox(g, P, b.x0, b.x1, b.z0, b.z1, 0, b.h, b.wall, sun, b.roof, { floors: b.floors });
        if (b.ac) tsBox(g, P, b.x0 + 1, b.x0 + 3, b.z0 + 1, b.z0 + 2.6, b.h, b.h + 1.2, hex('#d9dde2'), sun);
      }
    }]); });
    st.parked.forEach(pc => { const p0 = P(pc.x, 0, pc.z); if (off(p0)) return; items.push([p0[2], () => tsBox(g, P, pc.x - 0.8, pc.x + 0.8, pc.z - 1.7, pc.z + 1.7, 0.1, 1.2, pc.c, sun)]); });
    st.containers.forEach(c => items.push([P(c.x, 0, c.z)[2] - c.y * 0.3, () => tsBox(g, P, c.x - 1.5, c.x + 1.5, c.z - 3, c.z + 3, c.y, c.y + 2.5, c.c, sun)]));
    st.trees.forEach(tr => { const pc = P(tr.x, 0, tr.z); if (off(pc)) return; items.push([pc[2] - 1, () => {
      const base = P(tr.x, 0, tr.z), top = P(tr.x, 2.2 + tr.rr, tr.z), edge = P(tr.x + tr.rr, 2.2 + tr.rr, tr.z);
      const rr = Math.abs(edge[0] - top[0]) + 0.8;
      g.strokeStyle = '#6b4a2b'; g.lineWidth = Math.max(1, rr * 0.25); g.beginPath(); g.moveTo(base[0], base[1]); g.lineTo(top[0], top[1]); g.stroke();
      const gr = g.createRadialGradient(top[0] - rr * 0.35, top[1] - rr * 0.4, rr * 0.1, top[0], top[1], rr);
      gr.addColorStop(0, shade(tr.c, 1.35)); gr.addColorStop(1, shade(tr.c, 0.72));
      g.fillStyle = gr; g.beginPath(); g.arc(top[0], top[1], rr, 0, TAU); g.fill();
    }]); });
    // cars: wrap around their road
    const carL = [];
    st.cars.forEach(cr => {
      const L = 400, pos = ((cr.off + cr.dir * cr.v * sim) % L + L) % L - 200;
      const lane = cr.dir * 1.6;
      let x, z;
      if (cr.alongX) { x = pos; z = cr.road + lane; } else { x = cr.road - lane; z = pos; if (z < -36) return; }
      const hl = cr.len / 2, hw = cr.wid / 2;
      const [x0, x1, z0, z1] = cr.alongX ? [x - hl, x + hl, z - hw, z + hw] : [x - hw, x + hw, z - hl, z + hl];
      const fx = cr.alongX ? x + cr.dir * hl : x, fz = cr.alongX ? z : z + cr.dir * hl, bx2 = cr.alongX ? x - cr.dir * hl : x, bz2 = cr.alongX ? z : z - cr.dir * hl;
      carL.push([fx, fz, bx2, bz2]);
      items.push([P(x, 0, z)[2] - 0.5, () => {
        tsBox(g, P, x0, x1, z0, z1, 0.2, cr.hgt * 0.55, cr.c, sun);
        const ix = cr.alongX ? hl * 0.35 : 0, iz = cr.alongX ? 0 : hl * 0.35;
        tsBox(g, P, x0 + (cr.alongX ? ix : 0.15), x1 - (cr.alongX ? ix * 0.6 : 0.15), z0 + (cr.alongX ? 0.15 : iz), z1 - (cr.alongX ? 0.15 : iz * 0.6), cr.hgt * 0.55, cr.hgt, hex('#cfe8f5'), sun, cr.c);
      }]);
    });
    // moored and moving boats
    const boat = (bx, bz, len, wid, c, cab, dir, extra) => items.push([P(bx, 0, bz)[2], () => {
      const hl = len / 2, hw = wid / 2;
      g.fillStyle = shade(c, 1); tsPoly(g, P, [[bx - hl * dir, bz - hw], [bx + hl * 0.6 * dir, bz - hw], [bx + hl * dir, bz], [bx + hl * 0.6 * dir, bz + hw], [bx - hl * dir, bz + hw]]); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; g.stroke();
      if (cab) tsBox(g, P, bx - hl * 0.45, bx + hl * 0.15, bz - hw * 0.6, bz + hw * 0.6, 0, len > 12 ? 3.2 : 1.6, cab, sun);
      if (extra) extra();
    }]);
    st.moored.forEach(m => boat(m.x, m.z + Math.sin(sim * 0.8 + m.ph) * 0.15, m.wid * 1.6, m.len * 0.45, m.c, hex('#ffffff'), 1, null));
    st.boats.forEach(b => {
      const bx = ((b.x + b.v * sim + 200) % 400 + 400) % 400 - 200;
      const dir = Math.sign(b.v);
      // wake: two white lines spreading behind
      items.push([P(bx, 0, b.z)[2] + 5, () => {
        g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 2;
        const a = P(bx - dir * b.len * 0.5, 0, b.z), l = P(bx - dir * (b.len * 0.5 + 22), 0, b.z - 5), rr = P(bx - dir * (b.len * 0.5 + 22), 0, b.z + 5);
        g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(a[0], a[1]); g.lineTo(rr[0], rr[1]); g.stroke();
      }]);
      boat(bx, b.z, b.len, b.wid, b.c, b.cab, dir, b.sail ? () => {
        const m0 = P(bx, 0, b.z), m1 = P(bx, 9, b.z), m2 = P(bx - dir * 3.5, 1.5, b.z);
        g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(m1[0], m1[1]); g.lineTo(m0[0], m0[1] - 2); g.lineTo(m2[0], m2[1]); g.closePath(); g.fill();
      } : null);
    });
    // container crane on the quay
    items.push([P(78, 0, -32)[2] - 8, () => {
      const col = hex('#e4572e');
      tsBox(g, P, 70, 71.2, -40, -38.8, 0, 16, col, sun);
      tsBox(g, P, 70, 71.2, -27, -25.8, 0, 16, col, sun);
      tsBox(g, P, 84, 85.2, -40, -38.8, 0, 16, col, sun);
      tsBox(g, P, 84, 85.2, -27, -25.8, 0, 16, col, sun);
      const tr = 70 + ((sim * 0.9) % 14);
      tsBox(g, P, 69, 86.2, -52, -50.8, 16, 17.4, col, sun);
      tsBox(g, P, 69, 70.2, -52, -25.8, 16, 17.4, col, sun);
      tsBox(g, P, 85, 86.2, -52, -25.8, 16, 17.4, col, sun);
      tsBox(g, P, tr, tr + 2.4, -46 + Math.sin(sim * 0.5) * 8, -44 + Math.sin(sim * 0.5) * 8, 14, 16, hex('#ffcf00'), sun);
    }]);
    // ---- fairground: ferris wheel, carousel, tents ----
    const fair = st.objs.find(o => o.kind === 'fair');
    const fwx = fair.x0 + 11, fwz = fair.z1 - 7, R = 17, fwy = R + 2.5;
    const ang = sim * 0.35;
    items.push([P(fwx, 0, fwz)[2] - 6, () => {
      const pt = (a, rr = R) => P(fwx + Math.cos(a) * rr, fwy + Math.sin(a) * rr, fwz);
      // A-frame legs
      g.strokeStyle = '#f2f2f2'; g.lineWidth = 3;
      const hub = P(fwx, fwy, fwz);
      [[-6, -2.5], [6, -2.5], [-6, 2.5], [6, 2.5]].forEach(([dx, dz]) => { const f = P(fwx + dx, 0, fwz + dz); g.beginPath(); g.moveTo(f[0], f[1]); g.lineTo(hub[0], hub[1]); g.stroke(); });
      // rim + spokes
      g.strokeStyle = '#ffffff'; g.lineWidth = 2.2;
      g.beginPath(); for (let k = 0; k <= 48; k++) { const p = pt(k / 48 * TAU); k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke();
      g.lineWidth = 1;
      g.beginPath(); for (let k = 0; k < 16; k++) { const p = pt(ang + k / 16 * TAU); g.moveTo(hub[0], hub[1]); g.lineTo(p[0], p[1]); } g.stroke();
      // gondolas hang plumb below rim points
      const GC = ['#e63946', '#ffcf00', '#1d7fe0', '#2bb673', '#ff6fa8', '#f4a300'];
      for (let k = 0; k < 16; k++) {
        const a = ang + k / 16 * TAU, p = pt(a), q = P(fwx + Math.cos(a) * R, fwy + Math.sin(a) * R - 1.6, fwz);
        const sz = Math.abs(P(fwx + 1, fwy, fwz)[0] - hub[0]) * 1.3;
        g.fillStyle = GC[k % 6]; g.fillRect(q[0] - sz / 2, q[1] - sz * 0.4, sz, sz * 0.8);
        g.strokeStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1] - sz * 0.4); g.stroke();
      }
      g.fillStyle = '#ffcf00'; g.beginPath(); g.arc(hub[0], hub[1], 3, 0, TAU); g.fill();
    }]);
    // carousel: striped canopy, rotating stripes
    const cx = fair.x1 - 8, cz = fair.z0 + 8;
    items.push([P(cx, 0, cz)[2] - 2, () => {
      const N = 16, ca = sim * 0.9;
      tsBox(g, P, cx - 4.5, cx + 4.5, cz - 4.5, cz + 4.5, 0, 0.6, hex('#f6e7c8'), sun);
      const apex = P(cx, 6.5, cz);
      for (let k = 0; k < N; k++) {
        const a0 = ca + k / N * TAU, a1 = ca + (k + 1) / N * TAU;
        const p0 = P(cx + Math.cos(a0) * 5, 3.6, cz + Math.sin(a0) * 5), p1 = P(cx + Math.cos(a1) * 5, 3.6, cz + Math.sin(a1) * 5);
        g.fillStyle = k % 2 ? '#e63946' : '#ffffff';
        g.beginPath(); g.moveTo(apex[0], apex[1]); g.lineTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.closePath(); g.fill();
      }
      for (let k = 0; k < 8; k++) { const a = -ca * 0.5 + k / 8 * TAU, f = P(cx + Math.cos(a) * 3.6, 0.6, cz + Math.sin(a) * 3.6), h = P(cx + Math.cos(a) * 3.6, 1.6 + 0.4 * Math.sin(sim * 3 + k), cz + Math.sin(a) * 3.6); g.fillStyle = TS_CAR[k % 7]; g.beginPath(); g.arc(h[0], h[1], 2.2, 0, TAU); g.fill(); void f; }
    }]);
    // tents
    [[fair.x0 + 5, fair.z0 + 5, '#1d7fe0'], [fair.x0 + 13, fair.z0 + 4, '#2bb673'], [fair.x1 - 4, fair.z1 - 5, '#7a4fb5'], [fair.x0 + 25, fair.z1 - 4, '#f4a300']].forEach(([x, z, c]) => items.push([P(x, 0, z)[2], () => {
      const ap = P(x, 4.2, z);
      for (let k = 0; k < 8; k++) {
        const a0 = k / 8 * TAU + 0.3, a1 = (k + 1) / 8 * TAU + 0.3;
        const p0 = P(x + Math.cos(a0) * 3, 1.6, z + Math.sin(a0) * 3), p1 = P(x + Math.cos(a1) * 3, 1.6, z + Math.sin(a1) * 3);
        const f0 = P(x + Math.cos(a0) * 3, 0, z + Math.sin(a0) * 3), f1 = P(x + Math.cos(a1) * 3, 0, z + Math.sin(a1) * 3);
        g.fillStyle = k % 2 ? c : '#ffffff';
        g.beginPath(); g.moveTo(f0[0], f0[1]); g.lineTo(f1[0], f1[1]); g.lineTo(p1[0], p1[1]); g.lineTo(p0[0], p0[1]); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(ap[0], ap[1]); g.lineTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.closePath(); g.fill();
      }
    }]));
    items.sort((a, b) => b[0] - a[0]);
    items.forEach(it => it[1]());
    // ---- people: tiny dots with shadows, wandering in stepped hops ----
    for (const pp of st.people) {
      const A = pp.area, w = A.x1 - A.x0, d = A.z1 - A.z0;
      const x = A.x0 + ((((pp.x - A.x0) + pp.vx * sim) % w) + w) % w, z = A.z0 + ((((pp.z - A.z0) + pp.vz * sim) % d) + d) % d;
      const p = P(x, 0.9, z), f = P(x + shx * 0.8, 0, z + shz * 0.8);
      g.fillStyle = 'rgba(30,40,80,0.35)'; g.fillRect(f[0] - 1, f[1] - 0.5, 2.4, 1.2);
      g.fillStyle = pp.c; g.fillRect(p[0] - 1, p[1] - 2, 2.2, 3.2);
    }
    // pedestrians along sidewalks
    for (let k = 0; k < 120; k++) {
      const alongX = k % 2, road = [-30, 0, 30][k % 3], side = hash(k * 1.7) < 0.5 ? -4.8 : 4.8, dir = hash(k * 2.3) < 0.5 ? -1 : 1;
      const pos = ((hash(k * 5.1) * 300 + dir * 1.2 * sim) % 300 + 300) % 300 - 150;
      const x = alongX ? pos : [-60, 0, 30, 60][k % 4] + side, z = alongX ? road + side : pos;
      if (z < -37 || (x < -40 && z > 40 && x > -80)) continue;
      const p = P(x, 0.9, z);
      g.fillStyle = TS_CAR[k % 8 === 7 ? 0 : k % 8]; g.fillRect(p[0] - 1, p[1] - 2, 2, 3);
    }
    // cloud shadows racing across (time-lapse)
    g.save(); g.globalCompositeOperation = 'multiply';
    for (let k = 0; k < 3; k++) {
      const x = ((k * 140 + sim * 6) % 420) - 210, z = -60 + k * 55;
      const p = P(x, 0, z), q = P(x + 34, 0, z);
      const rr = Math.abs(q[0] - p[0]);
      const gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], rr);
      gr.addColorStop(0, 'rgba(120,130,170,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.save(); g.translate(p[0], p[1]); g.scale(1, 0.6); g.translate(-p[0], -p[1]); g.fillRect(p[0] - rr, p[1] - rr, rr * 2, rr * 2); g.restore();
    }
    g.restore();
    // ---- time-lapse dusk: golden hour, blue hour, the town switches on ----
    const dk = tsDusk(t);
    if (dk > 0) {
      const col = dk < 0.35 ? [255, lerp(255, 205, dk / 0.35), lerp(255, 150, dk / 0.35)] : [lerp(255, 44, (dk - 0.35) / 0.65), lerp(205, 62, (dk - 0.35) / 0.65), lerp(150, 132, (dk - 0.35) / 0.65)];
      g.save();
      g.globalCompositeOperation = 'multiply';
      g.fillStyle = `rgb(${col.map(v => v | 0).join(',')})`; g.fillRect(0, 0, 1920, 1080);
      g.globalCompositeOperation = 'lighter';
      const on = clamp((dk - 0.3) / 0.6);
      if (on > 0) {
        g.fillStyle = 'rgba(255,206,120,0.95)';
        for (const b of st.boxes) {
          const pc = P((b.x0 + b.x1) / 2, 0, (b.z0 + b.z1) / 2); if (off(pc)) continue;
          for (const w of b.wins) { if (w[3] > on) continue; const p = P(w[0], w[1], w[2]); const sz = 900 / p[2]; g.fillRect(p[0] - sz * 0.5, p[1] - sz * 0.6, sz, sz * 1.2); }
        }
        // street lamps with a soft pool
        for (const [x, z] of st.lamps) {
          if (hash(x * 3.1 + z) > on * 1.2) continue;
          const p = P(x, 3, z); if (off(p)) continue;
          const rr = 2400 / p[2];
          const gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], rr);
          gr.addColorStop(0, 'rgba(255,220,150,0.9)'); gr.addColorStop(0.2, 'rgba(255,170,80,0.3)'); gr.addColorStop(1, 'rgba(255,150,60,0)');
          g.fillStyle = gr; g.fillRect(p[0] - rr, p[1] - rr, rr * 2, rr * 2);
        }
        // headlights and tail lights
        for (const [fx, fz, bx, bz] of carL) {
          const a = P(fx, 0.7, fz), b = P(bx, 0.7, bz);
          if (off(a)) continue;
          g.fillStyle = `rgba(255,250,225,${on})`; g.beginPath(); g.arc(a[0], a[1], 2.2, 0, TAU); g.fill();
          g.fillStyle = `rgba(255,40,40,${on})`; g.beginPath(); g.arc(b[0], b[1], 1.6, 0, TAU); g.fill();
        }
        // ferris wheel bulbs
        const GC = ['rgba(255,80,80,', 'rgba(255,220,90,', 'rgba(110,190,255,', 'rgba(120,255,150,'];
        for (let k = 0; k < 48; k++) {
          const a = ang * (k % 2 ? 1 : 1) + k / 48 * TAU, p = P(fwx + Math.cos(a) * R, fwy + Math.sin(a) * R, fwz);
          g.fillStyle = GC[(k + Math.floor(sim * 2)) % 4] + on + ')'; g.beginPath(); g.arc(p[0], p[1], 2.4, 0, TAU); g.fill();
        }
        for (let k = 0; k < 16; k++) { const a = ang + k / 16 * TAU; for (let q = 1; q < 6; q++) { const p = P(fwx + Math.cos(a) * R * q / 6, fwy + Math.sin(a) * R * q / 6, fwz); g.fillStyle = `rgba(255,240,200,${on * 0.8})`; g.fillRect(p[0] - 1, p[1] - 1, 2, 2); } }
      }
      g.restore();
    }
  }
  const tsDusk = t => E.ioS(seg(t, 6.7, 8.6));
  // focus band centre and half-height over time
  const tsFocusK = t => kf(t, [[0, 0], [2.5, 0], [3.3, 1, E.ioC], [4.7, 1], [5.6, 2, E.ioC], [6.9, 2], [7.8, 3, E.ioC], [10, 3]]);
  const tsBand = t => kf(t, [[0, 0], [0.35, 0], [1.0, 70, E.outB], [7.8, 70], [8.4, 95, E.ioC], [10, 95]]);
  function tsDraw(c, t, W, H, st) {
    const S = st.S, g = S.getContext('2d');
    tsScene(g, t, st);
    // gentle toy grade on the sharp plate
    g.save(); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(255,200,140,0.35)'; g.fillRect(0, 0, W, H); g.restore();
    const pyr = buildPyr(st.pyr, S, [0, 0.6, 1, 1.4]);
    c.filter = 'saturate(1.3) contrast(1.06)';
    c.drawImage(S, 0, 0);
    // composite blur levels by vertical distance from the focus band
    // focus follows points of interest, re-projected each frame so it tracks the camera push
    const P = tsProj(tsCam(t));
    const pois = [P(-15, 0, 18)[1], P(-45, 19, 49)[1], P(-5, 0, -56)[1], P(-2, 4, 8)[1]];
    const kk = tsFocusK(t), k0 = Math.floor(kk), k1 = Math.min(3, k0 + 1);
    const fy = lerp(pois[k0], pois[k1], kk - k0), hb = window.E1SHARP ? 3000 : tsBand(t);
    const T = st.T, tg = T.getContext('2d');
    const ramps = [[0, 60], [50, 170], [150, 330], [300, 520]];
    pyr.forEach((L, i) => {
      const [a, b] = ramps[i];
      const d0 = hb + a, d1 = hb + b;
      tg.globalCompositeOperation = 'copy';
      tg.drawImage(L.cv, 0, 0, W, H);
      tg.globalCompositeOperation = 'destination-in';
      const gr = tg.createLinearGradient(0, 0, 0, H);
      const stop = (y, al) => { const u = clamp(y / H); gr.addColorStop(u, `rgba(0,0,0,${al})`); };
      // symmetric mask: 1 far from the band, 0 inside it
      const pts = [[fy - d1, 1], [fy - d0, 0], [fy + d0, 0], [fy + d1, 1]].filter(([y]) => y > -2000);
      gr.addColorStop(0, `rgba(0,0,0,${fy - d1 > 0 ? 1 : clamp((fy - d0) / Math.max(1, d1 - d0))})`);
      pts.forEach(([y, al]) => { if (y > 0 && y < H) stop(y, al); });
      gr.addColorStop(1, `rgba(0,0,0,${fy + d1 < H ? 1 : clamp((H - fy - d0) / Math.max(1, d1 - d0))})`);
      tg.fillStyle = gr; tg.fillRect(0, 0, W, H);
      tg.globalCompositeOperation = 'source-over';
      c.drawImage(T, 0, 0);
    });
    c.filter = 'none';
    // opening: whole frame out of focus until the lens is racked in
    const rack = 1 - E.outC(seg(t, 0.3, 1.0));
    if (rack > 0 && !window.E1SHARP) { c.globalAlpha = rack; c.drawImage(pyr[2].cv, 0, 0, W, H); c.globalAlpha = 1; }
    // title in the focus band
    const ti = seg(t, 8.2, 8.9);
    if (ti > 0) {
      const a = E.outC(ti), y = fy + 8;
      c.save();
      c.shadowColor = 'rgba(20,30,60,0.45)'; c.shadowBlur = 14; c.shadowOffsetY = 4;
      text(c, 'Tilt-Shift', 960, y + 20 + 26 * (1 - a), { font: FRAU, weight: 900, size: 150, align: 'center', ls: -2, color: `rgba(255,255,255,${a})` });
      c.restore();
      const sa = seg(t, 8.6, 9.2);
      text(c, 'A  MINIATURE  WORLD  ·  1:87', 960, y + 74, { font: DMS, weight: 700, size: 22, align: 'center', ls: 9, color: `rgba(255,255,255,${sa * 0.95})` });
    }
    vignette(c, W, H, 0.3, '20,30,50');
    grain(c, W, H, t, 0.04);
    const fin = 1 - seg(t, 0, 0.3);
    if (fin > 0) { c.fillStyle = `rgba(255,255,255,${fin})`; c.fillRect(0, 0, W, H); }
  }
  MG.film({
    id: 'tiltshift', dur: 10, poster: 9.5,
    fonts: [['900 150px Fraunces', 'Tilt-Shift'], ['700 22px "DM Sans"', 'A MINIATURE WORLD · 1:87']],
    meta: {
      family: 'H', name: 'Tilt-shift Miniature', sub: 'Miniature Faking', era: '2000s —',
      origin: 'Tilting a lens against the film plane (the Scheimpflug principle) lets photographers squeeze the plane of focus into a thin band. Shot from high above, that shallow focus mimics a macro lens over a model, so real cities read as toys; Olivo Barbieri\'s site specific series and Keith Loutit\'s stepped time-lapses made it a recognised genre in the 2000s.',
      works: 'Olivo Barbieri, site specific_ (2003 —) · Vincent Laforet, Tilt & Shift series (2006) · Keith Loutit, Bathtub series (2008 —) · Sam O\'Hare, The Sandpit (2010) · Little Big Berlin (Christopher Häusler, 2012) · Joel Meyerowitz / Ben Thomas, Tiny Tokyo (2011)',
      tech: ['True perspective town with painter-sorted boxes, gable roofs and cast shadows', 'Halving blur pyramid composited by distance from a focus band', 'Stepped 12 fps motion on a time-lapse clock that races at the climax', 'Saturated toy palette, tiny people, ferris wheel and harbour'],
      accent: '#f3a712',
      motionDNA: 'A high locked-off view where everything below hops along in stepped time-lapse: cars, crowds, a turning ferris wheel and a ferry, while the band of focus racks in and slides across the town to pick out details.',
      visualDNA: 'Model-railway colours, a thin razor-sharp band through the middle of the frame with heavy graduated blur above and below, crisp miniature shadows, tiny dot people and a warm toy grade.',
      transitions: 'Rack focus in, focus-band slides (up, down, centre), time-lapse acceleration, title set into the focus band.',
      implementation: ['Tilt-shift lens', 'After Effects', 'Canvas 2D'],
      reproducibility: 'Needs live action (this film is a procedural homage)', loopable: false,
    },
    setup: tsSetup,
    draw: tsDraw,
    score(A) {
      A.bus.gain.value = 1.2;
      const B = 0.5, bt = b => 0.6 + b * B; // 120 bpm
      // ukulele strums: C – Am – F – G, re-entrant voicing, down-up pattern
      const CH = { C: [67, 60, 64, 72], Am: [69, 60, 64, 69], F: [69, 65, 69, 72], G: [67, 62, 67, 71], C2: [67, 64, 67, 72] };
      const prog = ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G', 'C2'];
      const strum = (t0, notes, up, g) => notes.forEach((m, i) => A.pluck(t0 + (up ? 3 - i : i) * 0.014, midi(m), { dur: 0.9, bright: 0.55, decay: 0.993, g, lp: 3200, pan: (i - 1.5) * 0.12 }));
      for (let bar = 0; bar < 8; bar++) {
        const ch = CH[prog[bar]];
        [0, 1, 1.5, 2.5, 3].forEach((b, k) => { const tt = bt(bar * 4 + b) * 0.5 + 0.3; if (tt < 8.1) strum(tt, ch, k % 2 === 1, k === 0 ? 0.16 : 0.1); });
      }
      // music box melody on top
      const mel = [[0.9, 79], [1.15, 76], [1.4, 72], [1.9, 76], [2.15, 79], [2.4, 84], [3.4, 81], [3.65, 77], [3.9, 74], [4.4, 77], [4.65, 81], [4.9, 83],
        [5.4, 79], [5.65, 76], [5.9, 72], [6.4, 76], [6.65, 79], [6.9, 84], [7.2, 86], [7.45, 88], [7.7, 91]];
      mel.forEach(([tt, m], i) => {
        A.osc(tt, { f: midi(m), dur: 1.4, g: 0.07, a: 0.002, rev: 0.45, pan: 0.2 });
        A.osc(tt, { f: midi(m) * 3.98, dur: 0.35, g: 0.025, a: 0.001, rev: 0.4, pan: 0.2 });
        A.noise(tt, { type: 'highpass', f: 7000, dur: 0.01, g: 0.03 });
        void i;
      });
      // soft bass pluck
      ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G'].forEach((c, k) => { const root = { C: 48, Am: 45, F: 41, G: 43 }[c]; const tt = 0.8 + k; if (tt < 8.1) A.pluck(tt, midi(root), { dur: 0.9, bright: 0.25, decay: 0.994, g: 0.32, lp: 600 }); });
      // lens: rack-focus ring and band slides
      A.noise(0.3, { type: 'bandpass', f: 3000, q: 4, dur: 0.6, g: 0.025, swell: 0.6 });
      A.noise(0.98, { type: 'highpass', f: 5000, dur: 0.02, g: 0.12 });
      A.osc(0.98, { f: 1200, dur: 0.06, g: 0.04 });
      [[2.5, 3.3], [4.7, 5.6], [6.9, 7.8]].forEach(([a, b]) => {
        A.whoosh(a, b - a + 0.1, { f1: 600, f2: 2400, g: 0.05, q: 2 });
        A.noise(b - 0.02, { type: 'highpass', f: 5000, dur: 0.02, g: 0.08 });
      });
      // time-lapse rush in the climax: ticking clockwork speeding up
      let tk = 6.6, gap = 0.18;
      while (tk < 8.2) { A.noise(tk, { type: 'bandpass', f: 4500, q: 3, dur: 0.012, g: 0.06, pan: 0.3 }); tk += gap; gap = Math.max(0.05, gap * 0.9); }
      A.riser(6.9, 1.3, { g: 0.05, f: 220 });
      // title: music box flourish and a final strum
      [84, 88, 91, 96].forEach((m, i) => { A.osc(8.2 + i * 0.08, { f: midi(m), dur: 1.6, g: 0.06, rev: 0.6, pan: (i - 1.5) * 0.3 }); A.osc(8.2 + i * 0.08, { f: midi(m) * 3.98, dur: 0.3, g: 0.02, rev: 0.4 }); });
      strum(8.22, CH.C2, false, 0.2);
      A.pluck(8.22, midi(36), { dur: 1.6, bright: 0.25, decay: 0.996, g: 0.4, lp: 500 });
      A.osc(8.9, { f: midi(96), dur: 1.0, g: 0.035, rev: 0.7 });
    },
  });
})();
