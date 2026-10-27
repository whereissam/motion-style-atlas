/* Batch e2 — Family H, Cinematic & Film Language: Time-lapse, Match-cut Montage, Split-screen Cinema. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=JetBrains+Mono:wght@300;400;700&family=Instrument+Serif:ital@0;1&family=Oswald:wght@300;500;700&display=block');

  const ARC = 'Archivo, "Helvetica Neue", sans-serif';
  const MONO = '"JetBrains Mono", ui-monospace, monospace';
  const SERIF = '"Instrument Serif", Georgia, serif';
  const OSW = 'Oswald, "Arial Narrow", sans-serif';

  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const decay = (t, at, k) => (t >= at ? Math.exp(-(t - at) * k) : 0);
  const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const setLS = (c, v) => { if ('letterSpacing' in c) c.letterSpacing = v + 'px'; };
  const setStretch = (c, v) => { if ('fontStretch' in c) c.fontStretch = v; };
  // colour ramp: keys [[x, [r,g,b]], ...] sorted by x
  const ramp = (keys, x) => {
    if (x <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (x <= keys[i][0]) {
        const u = (x - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
        return mix(keys[i - 1][1], keys[i][1], u * u * (3 - 2 * u));
      }
    }
    return keys[keys.length - 1][1];
  };
  // monotone cubic (Fritsch–Carlson) through [x, y] points: smooth speed ramps without stalls
  const pchip = pts => {
    const n = pts.length, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const d = [], m = [];
    for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (3 * (xs[i + 1] - xs[i - 1])) / ((2 * xs[i + 1] - xs[i] - xs[i - 1]) / d[i - 1] + (xs[i + 1] + xs[i] - 2 * xs[i - 1]) / d[i]);
    return x => {
      if (x <= xs[0]) return ys[0];
      if (x >= xs[n - 1]) return ys[n - 1];
      let i = 0; while (x > xs[i + 1]) i++;
      const h = xs[i + 1] - xs[i], s = (x - xs[i]) / h;
      const h00 = 2 * s * s * s - 3 * s * s + 1, h10 = s * s * s - 2 * s * s + s, h01 = -2 * s * s * s + 3 * s * s, h11 = s * s * s - s * s;
      return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1];
    };
  };

  /* =====================================================================
     TIME-LAPSE — one locked-off motion-control frame over Monument-Valley
     buttes and a desert town. Seventeen hours in ten seconds: the sun arcs
     down, butte shadows sweep the floor, clouds stream and boil, golden
     hour, blue hour, the town flickers on, star trails wheel round the
     pole, and a new dawn rises behind the title.
     ===================================================================== */
  const TL = {};
  TL.hour = pchip([[0, 14.2], [0.45, 14.3], [1.6, 16.4], [2.6, 18.4], [3.5, 19.35], [4.4, 20.6], [7.7, 28.9], [8.75, 30.25], [10, 31.05]]);
  TL.HZ = 742; // horizon / butte base line
  TL.sunElev = h => {
    const hm = ((h % 24) + 24) % 24;
    if (hm >= 6.2 && hm <= 19.2) return Math.sin(Math.PI * (hm - 6.2) / 13);
    const n = hm > 19.2 ? hm - 19.2 : hm + 24 - 19.2;
    return -Math.sin(Math.PI * n / 11) * 0.9;
  };
  TL.sunPos = h => {
    const hm = ((h % 24) + 24) % 24, e = TL.sunElev(h);
    let u;
    if (hm >= 6.2 && hm <= 19.2) u = (hm - 6.2) / 13;
    else u = hm > 19.2 ? 1 + (hm - 19.2) / 22 : -(30.2 - 24 - hm) / 22;
    return [lerp(745, 1760, u), TL.HZ - e * 720];
  };
  TL.ZEN = [[-1, [2, 3, 9]], [-0.3, [3, 5, 15]], [-0.16, [8, 12, 38]], [-0.07, [22, 32, 82]], [-0.02, [40, 56, 116]], [0.03, [62, 92, 152]], [0.12, [66, 116, 186]], [0.3, [44, 104, 184]], [1, [28, 86, 172]]];
  TL.HOR = [[-1, [5, 8, 20]], [-0.3, [10, 14, 34]], [-0.16, [30, 34, 72]], [-0.07, [128, 74, 112]], [-0.02, [236, 124, 92]], [0.03, [255, 156, 76]], [0.12, [255, 204, 140]], [0.3, [184, 210, 232]], [1, [204, 224, 240]]];
  TL.CLIT = [[-0.3, [26, 24, 38]], [-0.14, [70, 48, 80]], [-0.05, [236, 104, 120]], [0.0, [255, 150, 104]], [0.08, [255, 200, 150]], [0.25, [255, 244, 228]], [1, [252, 252, 255]]];
  TL.CSH = [[-0.3, [9, 10, 20]], [-0.12, [36, 30, 56]], [-0.03, [96, 62, 96]], [0.05, [140, 112, 136]], [0.25, [164, 176, 198]], [1, [176, 188, 208]]];
  TL.ROCK = [[-0.3, [10, 10, 18]], [-0.1, [34, 26, 40]], [-0.02, [86, 44, 46]], [0.04, [200, 82, 38]], [0.15, [196, 92, 48]], [0.4, [176, 92, 58]], [1, [170, 96, 66]]];
  TL.ROCKSH = [[-0.3, [6, 6, 12]], [-0.08, [22, 18, 30]], [0.0, [54, 30, 40]], [0.1, [96, 46, 40]], [0.4, [112, 62, 52]], [1, [120, 70, 58]]];
  TL.SAND = [[-0.3, [8, 8, 14]], [-0.1, [30, 24, 34]], [-0.02, [82, 50, 50]], [0.05, [196, 112, 62]], [0.2, [206, 138, 88]], [1, [212, 160, 112]]];

  function tlSetup() {
    const r = rng(1982);
    // buttes: [centre x, half width, height, depth layer, shape seed]
    const buttes = [];
    const mk = (cx, hw, ht, layer, kind) => {
      const pts = [], rr = rng(Math.round(cx * 7 + ht));
      const base = TL.HZ + layer * 10;
      const talus = hw * 0.42;
      pts.push([cx - hw - talus * 1.4, base]);
      // talus slope up to cliff foot
      for (let k = 1; k <= 5; k++) { const u = k / 5; pts.push([cx - hw - talus * 1.4 * (1 - u) + (rr() - 0.5) * 6, base - ht * 0.32 * Math.pow(u, 1.4)]); }
      if (kind === 'spire') {
        pts.push([cx - hw * 0.35, base - ht * 0.42]); pts.push([cx - hw * 0.22, base - ht * 0.98]); pts.push([cx - hw * 0.06, base - ht]); pts.push([cx + hw * 0.16, base - ht * 0.94]); pts.push([cx + hw * 0.3, base - ht * 0.44]);
      } else {
        // vertical cliff with a ledge, flat caprock
        pts.push([cx - hw * 0.98, base - ht * 0.62]); pts.push([cx - hw * 0.94, base - ht * 0.66]); pts.push([cx - hw * 0.92, base - ht * 0.97]);
        pts.push([cx - hw * 0.86, base - ht]);
        for (let k = 1; k < 8; k++) pts.push([cx - hw * 0.86 + (hw * 1.72 * k) / 8, base - ht - (rr() - 0.4) * 5]);
        pts.push([cx + hw * 0.86, base - ht]); pts.push([cx + hw * 0.93, base - ht * 0.95]); pts.push([cx + hw * 0.95, base - ht * 0.68]); pts.push([cx + hw, base - ht * 0.64]);
      }
      for (let k = 0; k <= 5; k++) { const u = k / 5; pts.push([cx + hw + talus * 1.4 * u + (rr() - 0.5) * 6, base - ht * 0.32 * Math.pow(1 - u, 1.4)]); }
      buttes.push({ cx, hw, ht, layer, pts, base, kind });
    };
    // far range (layer 0) then hero buttes (layer 1)
    mk(250, 120, 120, 0, 'mesa'); mk(700, 200, 92, 0, 'mesa'); mk(1500, 160, 110, 0, 'mesa'); mk(1840, 140, 86, 0, 'mesa');
    mk(430, 130, 300, 1, 'mesa'); mk(610, 26, 250, 1, 'spire'); mk(1180, 210, 270, 1, 'mesa'); mk(1430, 34, 205, 1, 'spire');
    // town on the floor between the buttes
    const bld = [];
    let x = 760;
    while (x < 1700) {
      const w = 6 + r() * 16, far = (x - 760) / 940;
      const tall = Math.exp(-Math.pow((x - 1060) / 90, 2)) * 40 + Math.exp(-Math.pow((x - 1330) / 60, 2)) * 16;
      const hgt = 4 + r() * 10 + tall * (0.3 + r() * 0.8) * (r() < 0.6 ? 1 : 0.3);
      bld.push({ x, w, h: hgt, y: TL.HZ + 12 + far * 2 + r() * 5 });
      x += w + r() * 3;
    }
    const wins = [];
    bld.forEach(b => {
      for (let wy = b.y - b.h + 3; wy < b.y - 2; wy += 4) for (let wx = b.x + 1.5; wx < b.x + b.w - 1.5; wx += 3.5) {
        if (r() < 0.5) wins.push({ x: wx, y: wy, on: 18.9 + Math.pow(r(), 1.6) * 2.4, off: r() < 0.35 ? 22.5 + r() * 6 : 29.6 + r() * 1.4, warm: r() < 0.72 });
      }
    });
    // street lamps strung along a grid of the town floor
    const lamps = [];
    for (let k = 0; k < 90; k++) {
      const u = r();
      const lx = lerp(700, 1760, u), ly = TL.HZ + 18 + Math.pow(r(), 2) * 34;
      lamps.push({ x: lx, y: ly, on: 19.3 + (lx - 700) / 1060 * 0.6 + r() * 0.25, s: 0.6 + r() * 0.8 });
    }
    // stars around the celestial pole
    const stars = [];
    for (let k = 0; k < 900; k++) {
      const rad = 20 + Math.sqrt(r()) * 1700, a0 = r() * TAU, m = Math.pow(r(), 3);
      const tint = r();
      stars.push({ rad, a0, m, col: tint < 0.2 ? [255, 214, 170] : tint < 0.45 ? [196, 214, 255] : [244, 246, 255] });
    }
    // clouds: puffs in a band
    const clouds = [];
    for (let k = 0; k < 17; k++) {
      const y = 120 + Math.pow(r(), 0.75) * 440, depth = (y - 110) / 460;
      const s = lerp(1.2, 0.38, depth);
      const puffs = [];
      const n = 26 + ((r() * 16) | 0), wide = 380 + r() * 260, tall = 50 + r() * 80;
      for (let p = 0; p < n; p++) {
        const u = r(), dx = (u - 0.5) * wide;
        const crown = Math.pow(Math.cos((u - 0.5) * Math.PI), 0.8);
        const up = Math.pow(r(), 0.7) * crown;
        puffs.push({ dx, dy: -up * tall, r: 10 + crown * (14 + r() * 30) * (1.1 - up * 0.4), ph: r() * 10 });
      }
      puffs.sort((a, b) => b.dy - a.dy);
      clouds.push({ x0: r() * 2800, y, s, sp: lerp(260, 120, depth) * (0.8 + r() * 0.4), puffs, seed: k * 3.7 });
    }
    // road: from bottom-left foreground to the town
    const road = [];
    for (let k = 0; k <= 60; k++) {
      const u = k / 60;
      const x = lerp(-260, 1060, u) + Math.sin(u * 3.2) * 260 * (1 - u);
      const y = lerp(1120, TL.HZ + 26, Math.pow(u, 0.62));
      road.push([x, y, lerp(46, 1.5, Math.pow(u, 0.5))]);
    }
    const len = [0];
    for (let k = 1; k < road.length; k++) len.push(len[k - 1] + Math.hypot(road[k][0] - road[k - 1][0], road[k][1] - road[k - 1][1]));
    // foreground rocks
    const fg = [];
    for (let k = 0; k <= 48; k++) { const x = -200 + k * 50; fg.push([x, 1010 - Math.max(0, Math.sin(k * 0.37) * 50 + vnoise(k * 0.5, 4) * 30 + (k < 12 ? 70 - k * 5 : 0) + (k > 36 ? (k - 36) * 7 : 0))]); }
    const Q = offscreen(960, 540), Q2 = offscreen(960, 540);
    const scrub = [];
    for (let k = 0; k < 700; k++) { const u = Math.pow(r(), 1.7); scrub.push({ x: r() * 2200 - 140, y: TL.HZ + 8 + u * 330, s: 0.4 + u * 3.2, v: r() }); }
    return { SPS: offscreen(64, 64), SPL: offscreen(64, 64), buttes, bld, wins, lamps, stars, clouds, road, len, fg, scrub, Q, qc: Q.getContext('2d'), Q2, q2: Q2.getContext('2d') };
  }

  function roadPt(st, s) {
    const L = st.len, n = L.length;
    if (s <= 0) return st.road[0];
    if (s >= L[n - 1]) return st.road[n - 1];
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] < s) lo = m; else hi = m; }
    const u = (s - L[lo]) / (L[hi] - L[lo]), a = st.road[lo], b = st.road[hi];
    return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  }

  function tlDraw(c, t, W, H, st) {
    const h = TL.hour(t);
    const e = TL.sunElev(h);
    const [sx, sy] = TL.sunPos(h);
    const morning = ((h % 24) + 24) % 24 < 12 ? 1 : 0;
    const night = 1 - sstep(-0.2, -0.06, e);          // stars visible
    const dark = 1 - sstep(-0.1, 0.02, e);            // artificial lights matter
    const camX = lerp(-40, 70, E.ioS(t / 10));         // motion-control slide
    const push = lerp(1.0, 1.045, E.ioS(t / 10));
    const flick = 1 + (hash(Math.floor(t * 30) * 1.7) - 0.5) * 0.025;
    const HZ = TL.HZ;

    c.save();
    c.translate(W / 2, H * 0.62); c.scale(push, push); c.translate(-W / 2, -H * 0.62);
    const par = k => -camX * k;

    /* --- sky --- */
    const zen = ramp(TL.ZEN, e), hor = ramp(TL.HOR, e);
    const g = c.createLinearGradient(0, -60, 0, HZ + 20);
    g.addColorStop(0, rgba(zen)); g.addColorStop(0.62, rgba(mix(zen, hor, 0.45))); g.addColorStop(1, rgba(hor));
    c.fillStyle = g; c.fillRect(-100, -100, W + 200, HZ + 140);
    // sun-side glow (after sunset it hangs on the horizon where the sun went down)
    const gx = sx + par(0.05), gy = Math.max(sy, HZ - 40);
    const glowK = sstep(-0.16, -0.01, e) * (1 - sstep(0.18, 0.55, e));
    if (glowK > 0) {
      const gc = morning ? [255, 160, 120] : [255, 150, 70];
      const rg = c.createRadialGradient(gx, gy, 0, gx, gy, 1100);
      rg.addColorStop(0, rgba(gc, 0.75 * glowK)); rg.addColorStop(0.25, rgba(gc, 0.32 * glowK)); rg.addColorStop(1, rgba(gc, 0));
      c.fillStyle = rg; c.fillRect(-100, -100, W + 200, HZ + 140);
    }
    // night: stars and trails wheeling round the pole
    if (night > 0.01) {
      const px = 1240 + par(0.02), py = 120;
      const hs = 20.4, sweep = Math.max(0, Math.min(h, 30.0) - hs) * (TAU / 24);
      const trail = sstep(20.5, 21.6, h);
      c.save();
      c.lineCap = 'round';
      const buckets = [[0, 0.25, 0.9], [0.25, 0.55, 1.3], [0.55, 0.85, 1.7], [0.85, 1.01, 2.4]];
      buckets.forEach(([lo, hi, lw]) => {
        ['w', 'b', 'a'].forEach((tk, ti) => {
          c.beginPath();
          let any = false;
          for (const s of st.stars) {
            if (s.m < lo || s.m >= hi) continue;
            const tkey = s.col[0] === 255 ? 'a' : s.col[0] === 196 ? 'b' : 'w';
            if (tkey !== tk) continue;
            const a1 = s.a0 - sweep;                     // counter-clockwise rotation
            const ex = px + Math.cos(a1) * s.rad, ey = py + Math.sin(a1) * s.rad;
            if (ey > HZ + 10 && Math.sin(s.a0) * s.rad + py > HZ + 10 && sweep < 0.4) continue;
            const a2 = s.a0 - sweep * trail - 0.0015 * 900 / s.rad;
            c.moveTo(px + Math.cos(s.a0) * s.rad, py + Math.sin(s.a0) * s.rad);
            c.arc(px, py, s.rad, s.a0, a2, true);
            any = true;
          }
          if (!any) return;
          const col = ti === 0 ? [244, 246, 255] : ti === 1 ? [196, 214, 255] : [255, 214, 170];
          c.strokeStyle = rgba(col, night * lerp(0.35, 0.95, (lo + hi) / 2));
          c.lineWidth = lw;
          c.stroke();
        });
      });
      // pole star
      c.fillStyle = rgba([255, 255, 255], night);
      c.beginPath(); c.arc(px, py, 2.6, 0, TAU); c.fill();
      c.restore();
    }
    /* --- sun --- */
    if (sy < HZ + 60) {
      const sxx = sx + par(0.05);
      const sc = mix([255, 120, 50], [255, 250, 236], sstep(0.0, 0.25, e));
      const halo = c.createRadialGradient(sxx, sy, 0, sxx, sy, 260);
      halo.addColorStop(0, rgba(sc, 0.9)); halo.addColorStop(0.12, rgba(sc, 0.5)); halo.addColorStop(1, rgba(sc, 0));
      c.fillStyle = halo; c.fillRect(sxx - 260, sy - 260, 520, 520);
      c.fillStyle = rgba(mix(sc, [255, 255, 255], 0.5));
      c.beginPath(); c.ellipse(sxx, sy, 30, 30 * lerp(0.86, 1, sstep(0, 0.1, e)), 0, 0, TAU); c.fill();
    }
    /* --- clouds (quarter res, blurred, upscaled) --- */
    const cover = lerp(0.85, 0.15, sstep(19.6, 21.5, h)) * (1 - sstep(26, 27.5, h)) + sstep(26, 27.5, h) * lerp(0.15, 0.6, sstep(26, 29, h)) * (1 - sstep(30.4, 31, h) * 0.3);
    {
      const q = st.qc;
      q.setTransform(1, 0, 0, 1, 0, 0); q.clearRect(0, 0, 960, 540);
      q.setTransform(0.5, 0, 0, 0.5, 0, 0);
      const lit = ramp(TL.CLIT, e), shd = ramp(TL.CSH, e);
      const cityGlow = dark * 0.5;
      const mkSp = (cv, col) => {
        const x2 = cv.getContext('2d'); x2.clearRect(0, 0, 64, 64);
        const rg = x2.createRadialGradient(32, 32, 0, 32, 32, 32);
        rg.addColorStop(0, rgba(col, 1)); rg.addColorStop(0.55, rgba(col, 0.85)); rg.addColorStop(0.8, rgba(col, 0.3)); rg.addColorStop(1, rgba(col, 0));
        x2.fillStyle = rg; x2.fillRect(0, 0, 64, 64);
        return cv;
      };
      const spS = mkSp(st.SPS, mix(shd, [96, 58, 40], cityGlow * 0.4)), spL = mkSp(st.SPL, lit);
      st.clouds.forEach((cl, i) => {
        const life = clamp(0.5 + vnoise(h * 0.55 + cl.seed, 2) * 0.9 + (cover - 0.5) * 1.4);
        if (life < 0.03) return;
        const span = 2900;
        const x = ((cl.x0 + (h - 12) * cl.sp) % span + span) % span - 500 + par(0.1);
        const s = cl.s * (0.75 + life * 0.35);
        const dirx = clamp((sx - x) / 900, -1, 1), diry = sy < cl.y ? -1 : 1;
        // soft sprite puffs: shadowed body, then sun-facing lit faces; flat cumulus base
        q.save();
        q.beginPath(); q.rect(x - 700 * s, cl.y - 500 * s, 1400 * s, 500 * s + 10 * s); q.clip();
        q.globalAlpha = 0.95 * life;
        cl.puffs.forEach(p => { const rr = p.r * s * (0.85 + 0.3 * vnoise(h * 1.6 + p.ph, 5)) * (0.75 + 0.25 * life) * 1.5; q.drawImage(spS, x + p.dx * s - rr, cl.y + p.dy * s - rr, rr * 2, rr * 2); });
        q.globalAlpha = 0.9 * life;
        cl.puffs.forEach(p => {
          const rr = p.r * s * (0.85 + 0.3 * vnoise(h * 1.6 + p.ph, 5)) * (0.75 + 0.25 * life) * 1.2;
          const ox = dirx * rr * 0.3, oy = (e < 0 ? 0.4 : -0.32 * diry) * rr;
          q.drawImage(spL, x + p.dx * s + ox - rr, cl.y + p.dy * s + oy - rr, rr * 2, rr * 2);
        });
        q.restore();
      });
      const q2 = st.q2;
      q2.setTransform(1, 0, 0, 1, 0, 0); q2.clearRect(0, 0, 960, 540);
      q2.filter = 'blur(1px)'; q2.drawImage(st.Q, 0, 0); q2.filter = 'none';
      c.drawImage(st.Q2, 0, 0, 1920, 1080);
    }
    /* --- crepuscular rays round the low sun --- */
    const rayK = sstep(-0.04, 0.0, e) * (1 - sstep(0.1, 0.25, e)) * (morning ? 1 : 0.55);
    if (rayK > 0.01) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const rx = sx + par(0.05), ry = Math.max(sy, HZ - 30);
      for (let k = 0; k < 28; k++) {
        const an = -Math.PI + (k + 0.5) / 28 * Math.PI + vnoise(k * 1.3 + h * 0.8, 9) * 0.05;
        const wd = 0.012 + hash(k * 7.7) * 0.03, ln = 1500;
        const a = rayK * (0.05 + hash(k * 3.1) * 0.08) * (0.6 + 0.4 * vnoise(h * 2 + k, 3));
        const rg = c.createRadialGradient(rx, ry, 0, rx, ry, ln);
        rg.addColorStop(0, `rgba(255,200,140,${a})`); rg.addColorStop(1, 'rgba(255,170,110,0)');
        c.fillStyle = rg;
        c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + Math.cos(an - wd) * ln, ry + Math.sin(an - wd) * ln); c.lineTo(rx + Math.cos(an + wd) * ln, ry + Math.sin(an + wd) * ln); c.closePath(); c.fill();
      }
      c.restore();
    }
    /* --- buttes --- */
    const rock = ramp(TL.ROCK, e), rockS = ramp(TL.ROCKSH, e), haze = mix(hor, zen, 0.25);
    const sunBack = sy > HZ ? 0 : 1;
    st.buttes.forEach(b => {
      const ox = par(b.layer ? 0.32 : 0.18);
      c.save(); c.translate(ox, 0);
      c.beginPath(); b.pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
      const hz = b.layer ? 0.14 : 0.5;
      const lit = mix(rock, haze, hz), sh = mix(rockS, haze, hz * 0.8);
      // face lit on the side towards the sun
      const side = clamp((sx - b.cx) / 600, -1, 1);
      const lg = c.createLinearGradient(b.cx - b.hw, 0, b.cx + b.hw, 0);
      const k = sstep(-0.02, 0.06, e) * sunBack * (morning ? 0.55 : 1);
      const L = mix(sh, lit, k * clamp(0.5 - side * 0.5 + 0.25)), R = mix(sh, lit, k * clamp(0.5 + side * 0.5 + 0.25));
      lg.addColorStop(0, rgba(L)); lg.addColorStop(0.5, rgba(mix(L, R, 0.5))); lg.addColorStop(1, rgba(R));
      c.fillStyle = lg; c.fill();
      if (b.layer) {
        c.save(); c.clip();
        // sediment strata and vertical erosion streaks
        c.globalAlpha = 0.16 * (0.3 + 0.7 * sstep(-0.05, 0.1, e));
        c.fillStyle = rgba(mul(sh, 0.6));
        for (let y = b.base - b.ht; y < b.base; y += 9 + (y % 7)) c.fillRect(b.cx - b.hw - 200, y, b.hw * 2 + 400, 2);
        c.globalAlpha = 0.12 * (0.3 + 0.7 * sstep(-0.05, 0.1, e));
        for (let k2 = 0; k2 < 26; k2++) { const xx = b.cx - b.hw + hash(k2 + b.cx) * b.hw * 2; c.fillRect(xx, b.base - b.ht, 2 + hash(k2 * 3 + b.cx) * 4, b.ht * (0.4 + hash(k2 * 5) * 0.5)); }
        // rim light on the caprock at golden hour
        c.globalAlpha = sstep(-0.01, 0.04, e) * (1 - sstep(0.12, 0.3, e)) * 0.7;
        c.fillStyle = rgba([255, 190, 110]);
        c.fillRect(b.cx - b.hw - 40, b.base - b.ht - 4, b.hw * 2 + 80, 7);
        c.restore();
      }
      c.restore();
    });
    /* --- desert floor --- */
    const sand = ramp(TL.SAND, e);
    const fg2 = c.createLinearGradient(0, HZ, 0, H);
    fg2.addColorStop(0, rgba(mix(sand, haze, 0.35))); fg2.addColorStop(1, rgba(mul(sand, 0.62)));
    c.fillStyle = fg2; c.fillRect(-100, HZ + 4, W + 200, H - HZ + 100);
    // re-draw butte bases so floor meets them cleanly (talus over floor)
    c.save();
    c.beginPath(); c.rect(-100, HZ + 4, W + 200, H); c.clip();
    // butte shadows sweeping the floor
    const shK = sstep(0.005, 0.06, e) * 0.5;
    if (shK > 0) {
      c.fillStyle = rgba(mul(sand, 0.28), shK);
      st.buttes.forEach(b => {
        if (!b.layer) return;
        const ox = par(0.32);
        const len = 0.16 / Math.max(0.05, Math.tan(e * 1.2));
        const kx = clamp((b.cx + ox - sx) / 700, -1.6, 1.6) * len * 0.9, ky = len * 0.42;
        c.beginPath();
        b.pts.forEach((p, i) => {
          const hh = b.base - p[1];
          const X = p[0] + ox + kx * hh, Y = b.base + ky * hh * 0.9;
          i ? c.lineTo(X, Y) : c.moveTo(X, Y);
        });
        c.closePath(); c.fill();
      });
    }
    // cloud shadows racing over the floor
    const csK = sstep(0.02, 0.15, e) * 0.22 * cover;
    if (csK > 0.005) {
      c.fillStyle = rgba(mul(sand, 0.3), csK);
      for (let k = 0; k < 6; k++) {
        const span = 3200, x = ((hash(k) * span + (h - 12) * (300 + k * 40)) % span + span) % span - 600;
        const y = HZ + 30 + hash(k + 9) * 300;
        const pers = (y - HZ) / 340;
        c.beginPath(); c.ellipse(x + par(0.5), y, 260 * (0.4 + pers), 26 * (0.4 + pers * 2), 0, 0, TAU); c.fill();
      }
    }
    // scrub and stones dotting the floor
    {
      const ox = par(0.55);
      const lit = sstep(0.0, 0.1, e);
      c.fillStyle = rgba(mul(sand, 0.45));
      c.beginPath();
      st.scrub.forEach(p => { c.moveTo(p.x + ox * (0.6 + p.s * 0.2) + p.s * 2, p.y); c.ellipse(p.x + ox * (0.6 + p.s * 0.2), p.y, p.s * 2, p.s * 0.9, 0, 0, TAU); });
      c.fill();
      if (lit > 0) {
        c.fillStyle = rgba(mix(sand, [255, 220, 170], 0.4), 0.5 * lit);
        c.beginPath();
        st.scrub.forEach(p => { if (p.v < 0.5) return; const X = p.x + ox * (0.6 + p.s * 0.2) + (sx > p.x ? 1 : -1) * p.s * 0.6; c.moveTo(X + p.s, p.y - p.s * 0.3); c.ellipse(X, p.y - p.s * 0.3, p.s, p.s * 0.45, 0, 0, TAU); });
        c.fill();
      }
    }
    c.restore();
    /* --- town --- */
    {
      const ox = par(0.42);
      c.save(); c.translate(ox, 0);
      const bc = mix(mix(mul(rockS, 0.85), mul(sand, 0.7), 0.5 * sstep(0.02, 0.2, e)), haze, 0.25);
      const litC = mix(bc, mix(sand, [255, 240, 220], 0.4), 0.6 * sstep(0.0, 0.12, e));
      st.bld.forEach(b => {
        c.fillStyle = rgba(bc); c.fillRect(b.x, b.y - b.h, b.w, b.h);
        if (e > 0) { c.fillStyle = rgba(litC); const sideW = b.w * 0.35; sx > b.x ? c.fillRect(b.x + b.w - sideW, b.y - b.h, sideW, b.h) : c.fillRect(b.x, b.y - b.h, sideW, b.h); }
      });
      // city glow dome
      if (dark > 0.02) {
        const dg = c.createRadialGradient(1180, HZ + 10, 0, 1180, HZ + 10, 620);
        dg.addColorStop(0, `rgba(255,150,70,${0.28 * dark})`); dg.addColorStop(1, 'rgba(255,150,70,0)');
        c.fillStyle = dg; c.fillRect(500, HZ - 620, 1400, 760);
        c.globalCompositeOperation = 'lighter';
        // windows switching on, each with its own little flicker
        st.wins.forEach((w, i) => {
          const on = sstep(w.on, w.on + 0.05, h) * (1 - sstep(w.off, w.off + 0.05, h));
          if (on <= 0) return;
          const fl = h < w.on + 0.25 ? (hash(i + Math.floor(h * 40)) > 0.35 ? 1 : 0.2) : 1;
          c.fillStyle = w.warm ? `rgba(255,196,120,${on * fl * dark})` : `rgba(190,226,255,${on * fl * dark * 0.9})`;
          c.fillRect(w.x, w.y, 1.7, 1.9);
        });
        st.lamps.forEach((l, i) => {
          const on = sstep(l.on, l.on + 0.15, h) * (1 - sstep(30.0 + hash(i) * 0.4, 30.3 + hash(i) * 0.4, h));
          if (on <= 0) return;
          const a = on * dark;
          c.fillStyle = `rgba(255,150,60,${0.1 * a})`; c.beginPath(); c.arc(l.x, l.y, 4 * l.s, 0, TAU); c.fill();
          c.fillStyle = `rgba(255,214,150,${0.95 * a})`; c.fillRect(l.x - 1, l.y - 1, 2.2, 2.2);
        });
        c.globalCompositeOperation = 'source-over';
      }
      c.restore();
    }
    /* --- highway with long-exposure light trails --- */
    {
      const ox = par(0.7);
      c.save(); c.translate(ox, 0);
      c.lineJoin = 'round'; c.lineCap = 'round';
      c.strokeStyle = rgba(mix(mul(sand, 0.45), [40, 40, 46], 0.4));
      for (let k = 1; k < st.road.length; k++) {
        const a = st.road[k - 1], b = st.road[k];
        c.lineWidth = a[2] * 2.4; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      }
      const total = st.len[st.len.length - 1];
      const trailK = 0.1 + 0.9 * dark;
      c.globalCompositeOperation = 'lighter';
      [[1, [255, 236, 200], -0.32], [-1, [255, 40, 30], 0.32]].forEach(([dir, col, off]) => {
        for (let k = 0; k < 22; k++) {
          const ph = hash(k * 13.1 + dir * 3);
          const s = (((ph + dir * h * 0.9) % 1) + 1) % 1 * total;
          const ln = total * (0.06 + 0.12 * dark);
          c.strokeStyle = rgba(col, (dark > 0.05 ? 0.75 : 0.35) * trailK);
          c.beginPath();
          for (let j = 0; j <= 10; j++) {
            const p = roadPt(st, s - (dir > 0 ? ln : 0) + (ln * j) / 10);
            const X = p[0] + off * p[2], Y = p[1];
            j ? c.lineTo(X, Y) : c.moveTo(X, Y);
          }
          const pm = roadPt(st, s);
          c.lineWidth = Math.max(1.1, pm[2] * 0.14);
          c.stroke();
        }
      });
      c.globalCompositeOperation = 'source-over';
      c.restore();
    }
    /* --- foreground ridge --- */
    {
      const ox = par(1.15);
      const fcol = mix(mul(rockS, 0.5), [6, 6, 10], 0.4);
      c.fillStyle = rgba(fcol);
      c.beginPath(); c.moveTo(-300 + ox, H + 100);
      st.fg.forEach(p => c.lineTo(p[0] + ox, p[1]));
      c.lineTo(W + 300 + ox, H + 100); c.closePath(); c.fill();
      // rim light on the ridge top at low sun
      const rimK = sstep(-0.02, 0.03, e) * (1 - sstep(0.15, 0.35, e));
      if (rimK > 0) {
        c.strokeStyle = rgba([255, 170, 90], 0.55 * rimK); c.lineWidth = 2;
        c.beginPath(); st.fg.forEach((p, i) => (i ? c.lineTo(p[0] + ox, p[1]) : c.moveTo(p[0] + ox, p[1]))); c.stroke();
      }
      // a few desert shrubs/joshua tree silhouettes
      c.fillStyle = rgba(mul(fcol, 0.8));
      c.strokeStyle = rgba(mul(fcol, 0.8));
      const jt = (x, y, s) => {
        c.lineWidth = 7 * s; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + 4 * s, y - 120 * s);
        c.moveTo(x + 3 * s, y - 80 * s); c.quadraticCurveTo(x - 30 * s, y - 95 * s, x - 34 * s, y - 140 * s);
        c.moveTo(x + 4 * s, y - 110 * s); c.quadraticCurveTo(x + 40 * s, y - 118 * s, x + 46 * s, y - 160 * s);
        c.stroke();
        [[x - 34 * s, y - 140 * s], [x + 46 * s, y - 160 * s], [x + 4 * s, y - 124 * s]].forEach(([a, b2]) => {
          c.beginPath();
          for (let k = 0; k < 9; k++) { const an = -Math.PI / 2 + (k - 4) * 0.32; c.moveTo(a, b2); c.lineTo(a + Math.cos(an) * 22 * s, b2 + Math.sin(an) * 22 * s); }
          c.lineWidth = 3 * s; c.stroke();
        });
      };

    }
    c.restore();

    /* --- lens & grade --- */
    // anamorphic streak when the sun touches the horizon
    const streak = sstep(-0.03, 0.02, e) * (1 - sstep(0.06, 0.18, e)) * (sy < HZ + 20 ? 1 : 0);
    if (streak > 0) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const sxx = (sx - camX * 0.05 - W / 2) * push + W / 2, syy = (sy - H * 0.62) * push + H * 0.62;
      const lg = c.createLinearGradient(sxx - 900, 0, sxx + 900, 0);
      lg.addColorStop(0, 'rgba(255,140,60,0)'); lg.addColorStop(0.5, `rgba(255,190,120,${0.45 * streak})`); lg.addColorStop(1, 'rgba(255,140,60,0)');
      c.fillStyle = lg; c.fillRect(sxx - 900, syy - 3, 1800, 6);
      c.restore();
    }
    // exposure flicker (classic un-deflickered interval shooting)
    if (flick !== 1) { c.fillStyle = flick > 1 ? `rgba(255,255,255,${(flick - 1) * 0.8})` : `rgba(0,0,0,${(1 - flick) * 0.8})`; c.fillRect(0, 0, W, H); }
    vignette(c, W, H, 0.5);
    grain(c, W, H, t, 0.05);

    /* --- clock HUD --- */
    const hudA = 1 - sstep(8.6, 9.0, t);
    if (hudA > 0) {
      const hm = ((h % 24) + 24) % 24;
      const hh = Math.floor(hm), mm = Math.floor((hm - hh) * 60);
      c.save(); c.globalAlpha = hudA * 0.92 * sstep(0.1, 0.5, t);
      c.fillStyle = '#fff';
      c.font = `300 54px ${MONO}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.fillText(`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, 84, 990);
      c.font = `400 17px ${MONO}`; setLS(c, 3);
      c.globalAlpha *= 0.75;
      c.fillText('MONUMENT VALLEY  36°59′N 110°06′W', 86, 1024);
      c.fillText(`FRAME ${String(Math.floor(t * 30) + 1).padStart(3, '0')} / 300   INTERVAL 3m22s`, 86, 940);
      setLS(c, 0);
      // 24h dial
      const dx = W - 130, dy = 980;
      c.globalAlpha = hudA * 0.8 * sstep(0.1, 0.5, t);
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
      c.beginPath(); c.arc(dx, dy, 44, 0, TAU); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 3;
      c.beginPath(); c.arc(dx, dy, 44, -Math.PI / 2 + (14.2 / 24) * TAU, -Math.PI / 2 + (h / 24) * TAU); c.stroke();
      const an = -Math.PI / 2 + (h / 24) * TAU;
      c.fillStyle = '#fff'; c.beginPath(); c.arc(dx + Math.cos(an) * 44, dy + Math.sin(an) * 44, 5, 0, TAU); c.fill();
      c.restore();
    }
    /* --- title over the new dawn --- */
    const ta = sstep(8.85, 9.35, t);
    if (ta > 0) {
      c.save();
      c.fillStyle = 'rgba(0,0,0,' + 0.18 * ta + ')'; c.fillRect(0, 0, W, H);
      c.globalAlpha = ta;
      c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      setStretch(c, 'expanded');
      c.font = `200 112px ${ARC}`;
      setLS(c, lerp(70, 34, E.outC(seg(t, 8.85, 10))));
      c.fillStyle = '#fff8ee';
      c.shadowColor = 'rgba(80,30,10,0.35)'; c.shadowBlur = 30;
      c.fillText('TIME-LAPSE', W / 2 + 17, 410);
      c.shadowBlur = 0;
      setStretch(c, 'normal');
      c.font = `400 22px ${MONO}`; setLS(c, 7);
      c.globalAlpha = sstep(9.15, 9.6, t);
      c.fillText('17 HOURS  ·  300 FRAMES  ·  10 SECONDS', W / 2 + 4, 470);
      setLS(c, 0);
      c.fillRect(W / 2 - 60 * sstep(9.1, 9.6, t), 438, 120 * sstep(9.1, 9.6, t), 1.5);
      c.restore();
    }
  }

  function tlScore(A) {
    A.bus.gain.value = 0.8;
    // Glass-like rolling arpeggios: an organ figure that repeats and accretes.
    const N8 = 0.125;
    const chords = [
      [0, [57, 60, 64]],    // Am — afternoon
      [2, [53, 57, 60]],    // F  — golden hour
      [3.25, [50, 53, 57]], // Dm — sunset / blue hour
      [4.5, [52, 56, 59]],  // E  — night falls
      [6, [53, 57, 60]],    // F  — deep night, stars
      [7.25, [52, 56, 59]], // E  — pre-dawn
      [8.75, [57, 61, 64]], // A  — dawn
    ];
    const chordAt = t => { let c = chords[0][1]; chords.forEach(([a, ch]) => { if (t >= a - 1e-6) c = ch; }); return c; };
    const fig = [0, 1, 2, 1, 0, 1, 2, 1];
    for (let i = 0; i < 80; i++) {
      const t = i * N8;
      if (t > 9.9) break;
      const ch = chordAt(t), m = ch[fig[i % 8]];
      const build = 0.6 + 0.4 * sstep(0, 3, t);
      const g = (t > 8.75 ? 0.055 : 0.05) * build * (i % 4 === 0 ? 1.15 : 1);
      A.osc(t, { type: 'square', f: midi(m), dur: N8 * 0.95, g, lp: 1500 + 1200 * sstep(2, 5, t), hold: true, rel: 0.03, a: 0.006, rev: 0.25, pan: -0.25 });
      A.osc(t, { type: 'sine', f: midi(m + 12), dur: N8 * 0.9, g: g * 0.5, hold: true, rel: 0.03, a: 0.006 });
    }
    // second voice in triplets against the eighths (3 against 2), from golden hour
    const T3 = 1 / 6;
    for (let i = 0; i * T3 < 9.9; i++) {
      const t = 2 + i * T3;
      if (t > 9.9) break;
      const ch = chordAt(t), m = ch[[2, 1, 0][i % 3]] + 12;
      const g = 0.03 * sstep(2, 3.3, t) * (t > 8.75 ? 1.2 : 1);
      A.osc(t, { type: 'triangle', f: midi(m), dur: T3 * 0.9, g, hold: true, rel: 0.03, a: 0.005, rev: 0.35, pan: 0.3 });
    }
    // organ pedal on each chord change
    chords.forEach(([t, ch], i) => {
      const end = i < chords.length - 1 ? chords[i + 1][0] : 10;
      A.osc(t, { type: 'sawtooth', f: midi(ch[0] - 24), dur: end - t + 0.1, g: 0.075, a: 0.08, hold: true, rel: 0.12, lp: 420 });
      A.osc(t, { type: 'sine', f: midi(ch[0] - 12), dur: end - t + 0.1, g: 0.08, a: 0.08, hold: true, rel: 0.12 });
    });
    // choir pad through the night (breathy formant sawtooth)
    [[4.5, 1.5, [64, 68, 71]], [6, 1.25, [65, 69, 72]], [7.25, 1.5, [64, 68, 71]]].forEach(([t, d, ns]) => {
      A.chord(t, ns, { type: 'sawtooth', dur: d + 0.15, g: 0.022, a: 0.35, hold: true, rel: 0.3, lp: 1100, q: 3, spread: 9, rev: 0.6, width: 1.2, vib: [5, 2] });
    });
    // town lights popping on: tiny high glints
    for (let k = 0; k < 14; k++) {
      const t = 3.9 + k * 0.09 + hash(k) * 0.05;
      A.bell(t, midi(88 + [0, 3, 7, 10, 12][k % 5]), { g: 0.018, dur: 0.6, rev: 0.6, pan: (hash(k + 3) - 0.5) * 1.2 });
    }
    // wind sweeping through the time compression
    A.noise(0, { type: 'bandpass', f: 500, f2: 1600, sweep: 4, q: 0.6, dur: 4.5, g: 0.04, swell: 0.6, rev: 0.4 });
    A.noise(4.3, { type: 'bandpass', f: 300, f2: 900, sweep: 4, q: 0.8, dur: 4.4, g: 0.03, swell: 0.5, rev: 0.4 });
    // dawn: swell and resolution
    A.riser(7.6, 1.15, { g: 0.12, f: 110 });
    A.noise(8.75, { type: 'highpass', f: 5000, dur: 1.4, g: 0.05, rev: 0.6 });
    A.chord(8.75, [45, 57, 61, 64, 69], { type: 'triangle', dur: 1.3, g: 0.04, a: 0.04, hold: true, rel: 0.5, spread: 6, rev: 0.6, width: 1.2 });
    A.bell(8.76, midi(81), { g: 0.08, dur: 2.2 });
    A.bell(9.0, midi(76), { g: 0.05, dur: 1.8, pan: 0.3 });
  }

  MG.film({
    id: 'timelapse', dur: 10, poster: 9.5,
    fonts: [['200 112px Archivo', 'TIMELAPSE-'], ['300 54px "JetBrains Mono"', '0123456789:'], ['400 22px "JetBrains Mono"', 'HOURS·FRAMES']],
    meta: {
      family: 'H', name: 'Time-lapse', sub: 'Hours in Seconds', era: '1982 —',
      origin: 'Time-lapse began as a science tool, but Ron Fricke\'s cinematography for Godfrey Reggio\'s Koyaanisqatsi (1982) made it a film language of its own: an intervalometer exposes one frame every few seconds or minutes, often on a motion-control dolly, so clouds race, shadows sweep and a city\'s day plays out in seconds over a Philip Glass score. Fricke\'s Baraka (1992) and the BBC\'s Planet Earth (2006) carried the grammar to a global audience.',
      works: 'Koyaanisqatsi (Godfrey Reggio, cinematography Ron Fricke, 1982) · Powaqqatsi (Godfrey Reggio, 1988) · Chronos (Ron Fricke, 1985) · Baraka (Ron Fricke, 1992) · Samsara (Ron Fricke, 2011) · Planet Earth (BBC, 2006)',
      tech: ['Monotone-cubic hour curve: real-time open that ramps into 17 hours without stalls', 'Sky gradient model driven by solar elevation, with afterglow', 'Butte shadows projected along the sun vector; racing cloud shadows', 'Star trails as accumulated arcs around the pole; window-by-window town lights', 'Quarter-res blurred cloud layer, long-exposure headlight trails'],
      accent: '#ff9a4c',
      motionDNA: 'A locked-off frame on a slow motion-control slide while time itself accelerates: clouds stream and boil, shadows wheel across the desert floor, lights blink on window by window and the sky rotates.',
      visualDNA: 'Monument Valley buttes and a desert town under a sky that cycles from hard noon blue through golden hour, magenta afterglow and blue hour to a black field of star trails and a rose dawn.',
      transitions: 'None inside the shot: time is the transition; day-to-night "holy grail" exposure ramp, dawn swell into the title.',
      implementation: ['Camera + intervalometer', 'Motion-control slider', 'LRTimelapse / After Effects', 'Canvas 2D'],
      reproducibility: 'Needs live action (this film is a procedural homage)', loopable: true,
    },
    setup: tlSetup,
    draw: tlDraw,
    score: tlScore,
  });
  /* =====================================================================
     MATCH CUT — a montage where the shape never moves. A circle passes
     from eye to planet to coffee to vinyl to wheel to sun to a station
     clock; the clock's hands at noon become a vertical line that passes
     from pen to tower to rocket, and the rocket's trail draws the lockup.
     Hard cuts on the beat; a hairline guide flashes the held geometry.
     ===================================================================== */
  const MC = { BAR: 132, CX: 960, CY: 540, LT: 196, LB: 884, LW: 40 };
  MC.R = t => 238 + 5 * Math.min(t, 6.2);   // slow continuous push held across every cut
  MC.SHOTS = [
    ['eye', 0, 1.5, 'EYE'], ['planet', 1.5, 2.5, 'PLANET'], ['coffee', 2.5, 3.5, 'COFFEE'], ['vinyl', 3.5, 4.25, 'VINYL'],
    ['wheel', 4.25, 5.0, 'WHEEL'], ['sun', 5.0, 5.5, 'SUN'],
    ['eye', 5.5, 5.625, 'EYE'], ['planet', 5.625, 5.75, 'PLANET'], ['vinyl', 5.75, 5.875, 'VINYL'], ['wheel', 5.875, 6.0, 'WHEEL'],
    ['clock', 6.0, 6.75, 'CLOCK'], ['pen', 6.75, 7.5, 'PEN'], ['tower', 7.5, 8.0, 'TOWER'], ['rocket', 8.0, 8.875, 'ROCKET'], ['lockup', 8.875, 10.01, 'MATCH CUT'],
  ];
  MC.spin = t => t * 2.6;                     // shared clockwise rotation carried through the round shots

  function mcSetup() {
    const r = rng(2001);
    const stars = []; for (let k = 0; k < 420; k++) stars.push([r() * 1920, r() * 1080, Math.pow(r(), 4) * 2.2 + 0.4, r()]);
    const chips = []; for (let k = 0; k < 520; k++) chips.push([r() * 1920, r() * 1080, 3 + Math.pow(r(), 2) * 16, r() * TAU, (r() * 4) | 0, r()]);
    const fibers = []; for (let k = 0; k < 140; k++) fibers.push([r() * 2400, r() * 1080, 20 + r() * 80, r()]);
    const fib = []; for (let k = 0; k < 420; k++) fib.push([k / 420 * TAU + (r() - 0.5) * 0.02, 0.9 + r() * 0.1, r(), 1 + r() * 2.2]);
    const crypts = []; for (let k = 0; k < 26; k++) crypts.push([r() * TAU, 0.45 + r() * 0.35, 0.03 + r() * 0.05, r()]);
    const lashes = []; for (let k = 0; k < 150; k++) lashes.push([r(), 0.6 + r() * 0.6, (r() - 0.5) * 0.25]);
    const bands = []; for (let k = 0; k < 26; k++) bands.push([r(), r(), r()]);
    const city = []; let x = -200; while (x < 2600) { const w = 40 + r() * 120; city.push([x, w, 60 + r() * 220, r()]); x += w + 4; }
    const twr = []; x = -100; while (x < 2100) { const w = 50 + r() * 110; twr.push([x, w, 80 + Math.pow(r(), 1.5) * 380, r()]); x += w + 10 + r() * 30; }
    const smoke = []; for (let k = 0; k < 60; k++) smoke.push([r() * 2 - 1, r(), 30 + r() * 70, r()]);
    return { stars, chips, fibers, fib, crypts, lashes, bands, city, twr, smoke };
  }

  /* ---- the round shots ---- */
  function mcIris(c, cx, cy, R, pupil, st, t) {
    const ig = c.createRadialGradient(cx, cy, pupil * 0.9, cx, cy, R);
    ig.addColorStop(0, '#3a2408'); ig.addColorStop(0.12, '#b8761e'); ig.addColorStop(0.34, '#8a7a2a'); ig.addColorStop(0.6, '#3f7c62'); ig.addColorStop(0.88, '#2a5546'); ig.addColorStop(1, '#0c1612');
    c.fillStyle = ig; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip();
    c.lineCap = 'round';
    st.fib.forEach(([a, l, v, w]) => {
      const r0 = pupil * 1.04, r1 = R * l;
      c.strokeStyle = v < 0.5 ? `rgba(236,200,120,${0.1 + v * 0.22})` : `rgba(8,26,18,${0.12 + (v - 0.5) * 0.4})`;
      c.lineWidth = w;
      const bend = Math.sin(a * 7) * 0.05;
      c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      c.quadraticCurveTo(cx + Math.cos(a + bend) * (r0 + r1) / 2, cy + Math.sin(a + bend) * (r0 + r1) / 2, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      c.stroke();
    });
    st.crypts.forEach(([a, rr, sz]) => { c.fillStyle = 'rgba(10,20,12,0.35)'; c.beginPath(); c.ellipse(cx + Math.cos(a) * R * rr, cy + Math.sin(a) * R * rr, R * sz * 1.6, R * sz * 0.7, a, 0, TAU); c.fill(); });
    // collarette
    c.strokeStyle = 'rgba(230,170,80,0.45)'; c.lineWidth = 5;
    c.beginPath();
    for (let k = 0; k <= 90; k++) { const a = k / 90 * TAU, rr = pupil * 1.75 + Math.sin(a * 13) * 6 + Math.sin(a * 5) * 5; k ? c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : c.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    c.stroke();
    // limbal ring
    c.strokeStyle = 'rgba(4,10,8,0.7)'; c.lineWidth = R * 0.07; c.beginPath(); c.arc(cx, cy, R - R * 0.035, 0, TAU); c.stroke();
    // pupil
    const pg = c.createRadialGradient(cx, cy, pupil * 0.8, cx, cy, pupil * 1.08);
    pg.addColorStop(0, '#020202'); pg.addColorStop(1, 'rgba(2,2,2,0)');
    c.fillStyle = pg; c.beginPath(); c.arc(cx, cy, pupil * 1.08, 0, TAU); c.fill();
    // corneal dome shading + window catchlight
    const dg = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, 0, cx, cy, R * 1.1);
    dg.addColorStop(0, 'rgba(255,255,255,0.12)'); dg.addColorStop(0.6, 'rgba(0,0,0,0)'); dg.addColorStop(1, 'rgba(0,0,0,0.45)');
    c.fillStyle = dg; c.fillRect(cx - R, cy - R, R * 2, R * 2);
    c.restore();
    c.save(); c.translate(cx - R * 0.36, cy - R * 0.4); c.rotate(-0.35);
    const hl = c.createLinearGradient(0, -R * 0.12, 0, R * 0.12); hl.addColorStop(0, 'rgba(255,253,248,0.95)'); hl.addColorStop(1, 'rgba(255,253,248,0.55)');
    c.fillStyle = hl; c.beginPath(); c.ellipse(0, 0, R * 0.17, R * 0.1, 0, 0, TAU); c.fill();
    c.restore();
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(cx + R * 0.3, cy + R * 0.34, R * 0.035, 0, TAU); c.fill();
  }

  function mcEye(c, t, lt, R, st) {
    const W = 1920, H = 1080, cx = MC.CX, cy = MC.CY;
    const sk = c.createRadialGradient(cx, cy + 40, 100, cx, cy + 40, 1100);
    sk.addColorStop(0, '#c98c68'); sk.addColorStop(0.5, '#9a5e42'); sk.addColorStop(1, '#3a2018');
    c.fillStyle = sk; c.fillRect(0, 0, W, H);
    // skin pores
    c.fillStyle = 'rgba(70,30,20,0.12)';
    for (let k = 0; k < 260; k++) { const x = hash(k * 1.3) * W, y = hash(k * 2.7) * H; c.fillRect(x, y, 2, 2); }
    const open = t < 5 ? E.outQt(seg(lt, 0.18, 0.62)) : 1;
    const ey = cy + 22, hw = 780, up = 372 * open, dn = 300 * open;
    const lidPath = () => { c.beginPath(); c.moveTo(cx - hw, ey); c.bezierCurveTo(cx - hw * 0.5, ey - up * 1.33, cx + hw * 0.42, ey - up * 1.33, cx + hw, ey - 20); c.bezierCurveTo(cx + hw * 0.4, ey + dn * 1.33, cx - hw * 0.45, ey + dn * 1.33, cx - hw, ey); c.closePath(); };
    // crease
    c.strokeStyle = 'rgba(60,24,16,0.45)'; c.lineWidth = 10;
    c.beginPath(); c.moveTo(cx - hw * 0.9, ey - 30); c.bezierCurveTo(cx - hw * 0.5, ey - up * 1.33 - 110 * open - 60, cx + hw * 0.42, ey - up * 1.33 - 110 * open - 60, cx + hw * 0.95, ey - 60); c.stroke();
    if (open > 0.01) {
      c.save(); lidPath(); c.clip();
      const sc = c.createRadialGradient(cx, cy, R * 0.8, cx, cy, hw);
      sc.addColorStop(0, '#f3ebe2'); sc.addColorStop(0.55, '#e2cfc2'); sc.addColorStop(1, '#b0786a');
      c.fillStyle = sc; c.fillRect(0, 0, W, H);
      // veins
      c.strokeStyle = 'rgba(190,60,60,0.25)'; c.lineWidth = 1.5;
      for (let k = 0; k < 14; k++) { const side = k % 2 ? 1 : -1, y0 = cy + (hash(k) - 0.5) * 220; c.beginPath(); c.moveTo(cx + side * hw * 0.85, y0); c.quadraticCurveTo(cx + side * (R + 160), y0 + (hash(k + 4) - 0.5) * 120, cx + side * (R + 30 + hash(k + 8) * 60), cy + (hash(k + 2) - 0.5) * 200); c.stroke(); }
      const pupil = R * (0.36 - 0.1 * E.outC(seg(lt, 0.95, 1.25)) + 0.04 * seg(lt, 1.25, 1.5));
      mcIris(c, cx, cy, R, pupil, st, t);
      // lid occlusion shadow
      c.strokeStyle = 'rgba(40,14,10,0.42)'; c.lineWidth = 70; c.filter = 'blur(18px)';
      c.beginPath(); c.moveTo(cx - hw, ey); c.bezierCurveTo(cx - hw * 0.5, ey - up * 1.33, cx + hw * 0.42, ey - up * 1.33, cx + hw, ey - 20); c.stroke();
      c.filter = 'none';
      c.restore();
    }
    // lid margins and lashes
    c.strokeStyle = '#2a120c'; c.lineWidth = 12; c.lineCap = 'round';
    c.beginPath(); c.moveTo(cx - hw, ey); c.bezierCurveTo(cx - hw * 0.5, ey - up * 1.33, cx + hw * 0.42, ey - up * 1.33, cx + hw, ey - 20); c.stroke();
    c.strokeStyle = 'rgba(200,110,100,0.7)'; c.lineWidth = 7;
    c.beginPath(); c.moveTo(cx - hw, ey); c.bezierCurveTo(cx - hw * 0.45, ey + dn * 1.33, cx + hw * 0.4, ey + dn * 1.33, cx + hw, ey - 20); c.stroke();
    const bz = (u, p0, p1, p2, p3) => { const v = 1 - u; return v * v * v * p0 + 3 * v * v * u * p1 + 3 * v * u * u * p2 + u * u * u * p3; };
    c.strokeStyle = '#140806';
    st.lashes.forEach(([u, l, j]) => {
      const uu = 0.06 + u * 0.9;
      const x = bz(uu, cx - hw, cx - hw * 0.5, cx + hw * 0.42, cx + hw), y = bz(uu, ey, ey - up * 1.33, ey - up * 1.33, ey - 20);
      const ang = -Math.PI / 2 + (uu - 0.5) * 1.6 + j;
      const L = (30 + 50 * Math.sin(uu * Math.PI)) * l * (0.4 + 0.6 * open);
      c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(ang) * L * 0.6, y + Math.sin(ang) * L * 0.6 - 4, x + Math.cos(ang + 0.5 * Math.sign(uu - 0.5)) * L, y + Math.sin(ang + 0.5 * Math.sign(uu - 0.5)) * L - 10); c.stroke();
    });
  }

  function mcPlanet(c, t, lt, R, st) {
    const cx = MC.CX, cy = MC.CY;
    c.fillStyle = '#03050c'; c.fillRect(0, 0, 1920, 1080);
    const nb = c.createRadialGradient(1500, 300, 0, 1500, 300, 900);
    nb.addColorStop(0, 'rgba(70,40,120,0.35)'); nb.addColorStop(1, 'rgba(70,40,120,0)');
    c.fillStyle = nb; c.fillRect(0, 0, 1920, 1080);
    const nb2 = c.createRadialGradient(300, 800, 0, 300, 800, 700);
    nb2.addColorStop(0, 'rgba(20,90,110,0.3)'); nb2.addColorStop(1, 'rgba(20,90,110,0)');
    c.fillStyle = nb2; c.fillRect(0, 0, 1920, 1080);
    st.stars.forEach(([x, y, s, v]) => { c.fillStyle = `rgba(230,236,255,${0.3 + v * 0.7})`; c.fillRect(x, y, s, s); });
    // halo
    const hg = c.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.35);
    hg.addColorStop(0, 'rgba(120,190,255,0.35)'); hg.addColorStop(1, 'rgba(120,190,255,0)');
    c.fillStyle = hg; c.beginPath(); c.arc(cx, cy, R * 1.35, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip();
    const pal = [[232, 214, 180], [198, 150, 104], [168, 102, 70], [222, 196, 160], [140, 90, 66], [236, 226, 204], [186, 132, 92], [120, 140, 150]];
    const spin = MC.spin(t);
    const nB = st.bands.length;
    for (let k = 0; k < nB; k++) {
      const b = st.bands[k];
      const y0 = cy - R + (k / nB) * 2 * R, hgt = 2 * R / nB + 2;
      c.fillStyle = rgba(pal[(k * 3 + (b[0] * 3 | 0)) % pal.length]);
      c.beginPath();
      c.moveTo(cx - R, y0);
      for (let x = -R; x <= R; x += 24) c.lineTo(cx + x, y0 + Math.sin(x * 0.02 + spin * (1 + b[1]) + k) * 6 * b[2]);
      c.lineTo(cx + R, y0 + hgt + 8); c.lineTo(cx - R, y0 + hgt + 8); c.closePath(); c.fill();
    }
    // storms riding the bands on a sphere
    for (let k = 0; k < 18; k++) {
      const lat = (hash(k * 3.3) - 0.5) * 1.6, lon = hash(k * 7.1) * TAU + spin * 0.6;
      const sl = Math.sin(lon); if (Math.cos(lon) < 0) continue;
      const x = cx + R * Math.cos(lat) * sl, y = cy + R * Math.sin(lat);
      c.fillStyle = k === 0 ? 'rgba(196,84,52,0.9)' : `rgba(250,236,214,${0.35})`;
      const rw = (k === 0 ? 46 : 12 + hash(k) * 16) * Math.cos(lon) * Math.cos(lat);
      c.beginPath(); c.ellipse(x, y, Math.max(1, rw * 1.6), (k === 0 ? 26 : 6) * Math.cos(lat), 0, 0, TAU); c.fill();
    }
    // terminator and limb darkening
    const tg = c.createRadialGradient(cx - R * 0.45, cy - R * 0.4, R * 0.1, cx - R * 0.2, cy - R * 0.2, R * 1.45);
    tg.addColorStop(0, 'rgba(255,250,240,0.12)'); tg.addColorStop(0.55, 'rgba(0,0,0,0.05)'); tg.addColorStop(0.8, 'rgba(2,4,12,0.75)'); tg.addColorStop(1, 'rgba(2,4,12,0.97)');
    c.fillStyle = tg; c.fillRect(cx - R, cy - R, R * 2, R * 2);
    c.restore();
    c.strokeStyle = 'rgba(160,210,255,0.55)'; c.lineWidth = 3;
    c.beginPath(); c.arc(cx, cy, R, Math.PI * 0.85, Math.PI * 1.75); c.stroke();
    // moon in transit
    const mx = cx + R * 1.55 - lt * 40, my = cy - R * 0.7;
    c.fillStyle = '#bdb6aa'; c.beginPath(); c.arc(mx, my, 20, 0, TAU); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.6)'; c.beginPath(); c.arc(mx + 7, my + 6, 19, 0, TAU); c.fill();
  }

  function mcCoffee(c, t, lt, R, st) {
    const cx = MC.CX, cy = MC.CY;
    c.fillStyle = '#9ccfbe'; c.fillRect(0, 0, 1920, 1080);
    const chipCols = ['#f2b8a8', '#f6efe0', '#4e8f86', '#e9c46a'];
    st.chips.forEach(([x, y, s, a, k]) => {
      c.fillStyle = chipCols[k]; c.beginPath();
      for (let j = 0; j < 5; j++) { const an = a + j / 5 * TAU, rr = s * (0.6 + hash(x + j) * 0.5); j ? c.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr) : c.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); }
      c.closePath(); c.fill();
    });
    // window light across the table
    c.fillStyle = 'rgba(255,250,230,0.12)';
    c.beginPath(); c.moveTo(0, 120); c.lineTo(900, 0); c.lineTo(1300, 0); c.lineTo(0, 560); c.closePath(); c.fill();
    const shadow = (r, ox, oy, a) => { const g = c.createRadialGradient(cx + ox, cy + oy, r * 0.85, cx + ox, cy + oy, r * 1.12); g.addColorStop(0, `rgba(20,60,50,${a})`); g.addColorStop(1, 'rgba(20,60,50,0)'); c.fillStyle = g; c.beginPath(); c.arc(cx + ox, cy + oy, r * 1.12, 0, TAU); c.fill(); };
    shadow(R * 1.65, 26, 34, 0.45);
    // saucer
    const sg = c.createRadialGradient(cx - R * 0.5, cy - R * 0.5, R * 0.2, cx, cy, R * 1.65);
    sg.addColorStop(0, '#fffdf8'); sg.addColorStop(0.8, '#efe9df'); sg.addColorStop(1, '#d9d0c2');
    c.fillStyle = sg; c.beginPath(); c.arc(cx, cy, R * 1.65, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(160,140,120,0.35)'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R * 1.3, 0, TAU); c.stroke();
    c.strokeStyle = '#2f6f68'; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, R * 1.58, 0, TAU); c.stroke();
    // spoon resting on the saucer
    c.save(); c.translate(cx + R * 1.05, cy + R * 1.0); c.rotate(-0.75);
    c.fillStyle = 'rgba(30,60,50,0.25)'; c.beginPath(); c.ellipse(12, 14, 34, 22, 0, 0, TAU); c.fill(); c.fillRect(30, 4, 220, 16);
    const spg = c.createLinearGradient(0, -20, 0, 20); spg.addColorStop(0, '#f4f4f2'); spg.addColorStop(0.5, '#9a9a98'); spg.addColorStop(1, '#e4e4e2');
    c.fillStyle = spg; c.beginPath(); c.ellipse(0, 0, 34, 22, 0, 0, TAU); c.fill(); c.fillRect(24, -6, 230, 12);
    c.restore();
    // cup
    shadow(R * 1.22, 18, 24, 0.5);
    c.save(); c.translate(cx, cy); c.rotate(0.35);
    c.fillStyle = '#f6f2ea'; c.beginPath(); c.roundRect ? c.roundRect(R * 1.1, -R * 0.2, R * 0.55, R * 0.4, R * 0.2) : c.rect(R * 1.1, -R * 0.2, R * 0.55, R * 0.4); c.fill();
    c.fillStyle = '#9ccfbe'; c.beginPath(); c.roundRect ? c.roundRect(R * 1.24, -R * 0.08, R * 0.3, R * 0.16, R * 0.08) : c.rect(R * 1.24, -R * 0.08, R * 0.3, R * 0.16); c.fill();
    c.restore();
    const cg = c.createRadialGradient(cx - R * 0.4, cy - R * 0.4, R * 0.3, cx, cy, R * 1.22);
    cg.addColorStop(0, '#ffffff'); cg.addColorStop(1, '#e2dacd');
    c.fillStyle = cg; c.beginPath(); c.arc(cx, cy, R * 1.2, 0, TAU); c.fill();
    const ig = c.createRadialGradient(cx + R * 0.3, cy + R * 0.3, R * 0.9, cx, cy, R * 1.12);
    ig.addColorStop(0, '#bdb2a2'); ig.addColorStop(1, '#f4efe6');
    c.fillStyle = ig; c.beginPath(); c.arc(cx, cy, R * 1.1, 0, TAU); c.fill();
    // coffee surface: the matched circle
    const fg = c.createRadialGradient(cx, cy, 0, cx, cy, R);
    fg.addColorStop(0, '#7a4524'); fg.addColorStop(0.75, '#5b3017'); fg.addColorStop(0.93, '#a26a3c'); fg.addColorStop(1, '#4a250f');
    c.fillStyle = fg; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip();
    c.translate(cx, cy); c.rotate(MC.spin(t) * 0.55);
    // poured tulip: three stacked crescents and a heart, pulled through
    const foam = '#f3e5cc';
    c.fillStyle = foam;
    const cres = (y, w, hgt) => { c.beginPath(); c.moveTo(-w, y); c.bezierCurveTo(-w, y - hgt * 1.3, w, y - hgt * 1.3, w, y); c.bezierCurveTo(w * 0.7, y - hgt * 0.45, -w * 0.7, y - hgt * 0.45, -w, y); c.fill(); };
    cres(R * 0.62, R * 0.62, R * 0.42);
    cres(R * 0.36, R * 0.54, R * 0.36);
    cres(R * 0.12, R * 0.44, R * 0.3);
    c.beginPath(); c.moveTo(0, -R * 0.02);
    c.bezierCurveTo(R * 0.5, -R * 0.2, R * 0.42, -R * 0.66, 0, -R * 0.46); c.bezierCurveTo(-R * 0.42, -R * 0.66, -R * 0.5, -R * 0.2, 0, -R * 0.02); c.fill();
    c.strokeStyle = foam; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, -R * 0.5); c.quadraticCurveTo(R * 0.02, R * 0.2, 0, R * 0.7); c.stroke();
    c.strokeStyle = 'rgba(200,150,100,0.5)'; c.lineWidth = 3;
    [R * 0.62, R * 0.36, R * 0.12].forEach(y => { c.beginPath(); c.moveTo(-R * 0.3, y - R * 0.05); c.quadraticCurveTo(0, y - R * 0.22, R * 0.3, y - R * 0.05); c.stroke(); });
    // stir swirl
    c.strokeStyle = 'rgba(160,100,60,0.35)'; c.lineWidth = 3;
    for (let a = 0; a < 3; a++) { c.beginPath(); for (let k = 0; k < 60; k++) { const u = k / 59, an = a * TAU / 3 + u * 4.2, rr = R * (0.2 + u * 0.75); k ? c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : c.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); } c.stroke(); }
    c.restore();
    // surface reflection of the window
    c.fillStyle = 'rgba(255,255,255,0.14)';
    c.beginPath(); c.ellipse(cx - R * 0.42, cy - R * 0.45, R * 0.28, R * 0.1, -0.6, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.65)'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R * 1.19, Math.PI * 1.05, Math.PI * 1.6); c.stroke();
  }

  function mcVinyl(c, t, lt, R, st) {
    const cx = MC.CX, cy = MC.CY;
    // walnut plinth
    const wg = c.createLinearGradient(0, 0, 0, 1080); wg.addColorStop(0, '#3a2014'); wg.addColorStop(1, '#1e0f08');
    c.fillStyle = wg; c.fillRect(0, 0, 1920, 1080);
    c.strokeStyle = 'rgba(120,70,40,0.22)'; c.lineWidth = 2;
    for (let k = 0; k < 60; k++) { const y = k * 19; c.beginPath(); for (let x = 0; x <= 1920; x += 60) c.lineTo(x, y + Math.sin(x * 0.004 + k) * 10 + vnoise(x * 0.01 + k, 2) * 6); c.stroke(); }
    // platter with strobe dots
    const pr = R * 1.13;
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.arc(cx + 14, cy + 18, pr, 0, TAU); c.fill();
    const cgr = c.createConicGradient ? c.createConicGradient(0, cx, cy) : null;
    if (cgr) { [[0, '#8e8e8a'], [0.12, '#e6e6e2'], [0.25, '#7a7a76'], [0.5, '#9a9a96'], [0.62, '#e0e0dc'], [0.75, '#7a7a76'], [1, '#8e8e8a']].forEach(([o, col]) => cgr.addColorStop(o, col)); c.fillStyle = cgr; }
    else c.fillStyle = '#aaa';
    c.beginPath(); c.arc(cx, cy, pr, 0, TAU); c.fill();
    const sp = MC.spin(t) * 1.4;
    c.fillStyle = '#2a2a28';
    for (let k = 0; k < 90; k++) { const a = sp * 0.02 + k / 90 * TAU; c.fillRect(cx + Math.cos(a) * (pr - 9) - 2, cy + Math.sin(a) * (pr - 9) - 2, 4, 4); }
    // record — the matched circle
    c.fillStyle = '#0b0b0c'; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill();
    for (let rr = R * 0.38; rr < R * 0.985; rr += 2.6) { c.strokeStyle = `rgba(255,255,255,${0.025 + hash(rr) * 0.035})`; c.lineWidth = 1; c.beginPath(); c.arc(cx, cy, rr, 0, TAU); c.stroke(); }
    [0.55, 0.68, 0.8].forEach(f => { c.strokeStyle = 'rgba(0,0,0,0.9)'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, R * f, 0, TAU); c.stroke(); });
    if (c.createConicGradient) {
      const sh = c.createConicGradient(-Math.PI / 4, cx, cy);
      [[0, 'rgba(255,255,255,0)'], [0.06, 'rgba(255,240,220,0.2)'], [0.12, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,0)'], [0.56, 'rgba(200,220,255,0.14)'], [0.62, 'rgba(255,255,255,0)'], [1, 'rgba(255,255,255,0)']].forEach(([o, col]) => sh.addColorStop(o, col));
      c.fillStyle = sh; c.beginPath(); c.arc(cx, cy, R * 0.99, 0, TAU); c.arc(cx, cy, R * 0.37, 0, TAU, true); c.fill();
    }
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, R - 1, 0, TAU); c.stroke();
    // spinning label
    c.save(); c.translate(cx, cy); c.rotate(sp);
    c.fillStyle = '#e8521e'; c.beginPath(); c.arc(0, 0, R * 0.35, 0, TAU); c.fill();
    c.fillStyle = '#f6efe0'; c.beginPath(); c.arc(0, 0, R * 0.35, -Math.PI * 0.5, Math.PI * 0.5); c.arc(0, 0, R * 0.2, Math.PI * 0.5, -Math.PI * 0.5, true); c.fill();
    c.fillStyle = '#111';
    c.font = `700 ${Math.round(R * 0.07)}px ${OSW}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('SIDE A', 0, -R * 0.26); c.font = `400 ${Math.round(R * 0.05)}px ${MONO}`; c.fillText('33⅓ RPM', 0, R * 0.26);
    c.restore();
    c.fillStyle = '#d9d9d4'; c.beginPath(); c.arc(cx, cy, R * 0.025, 0, TAU); c.fill();
    // tonearm
    const px = cx + R * 1.5, py = cy - R * 1.05;
    const drop = E.outC(seg(lt, 0, 0.3));
    const nx = cx + R * 0.62 + (1 - drop) * 60, ny = cy - R * 0.5;
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 16; c.beginPath(); c.moveTo(px + 20, py + 26); c.quadraticCurveTo(px - R * 0.1 + 20, py + R * 0.7 + 26, nx + 20, ny + 26); c.stroke();
    const ag = c.createLinearGradient(px, py, nx, ny); ag.addColorStop(0, '#f0f0ec'); ag.addColorStop(1, '#a0a09c');
    c.strokeStyle = ag; c.lineWidth = 13; c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px - R * 0.1, py + R * 0.7, nx, ny); c.stroke();
    c.fillStyle = '#222'; c.save(); c.translate(nx, ny); c.rotate(-0.9); c.fillRect(-18, -12, 50, 24); c.restore();
    c.fillStyle = '#c8c8c4'; c.beginPath(); c.arc(px, py, 34, 0, TAU); c.fill(); c.fillStyle = '#555'; c.beginPath(); c.arc(px, py, 12, 0, TAU); c.fill();
  }

  function mcWheel(c, t, lt, R, st) {
    const cx = MC.CX, cy = MC.CY, gy = cy + R;
    const sg = c.createLinearGradient(0, 0, 0, gy);
    sg.addColorStop(0, '#191536'); sg.addColorStop(0.55, '#7a2a5e'); sg.addColorStop(1, '#ff7a3a');
    c.fillStyle = sg; c.fillRect(0, 0, 1920, gy);
    const travel = t * 2400;
    // two parallax rows of city
    [[0.12, '#3a1a44', 1], [0.35, '#1e0f28', 1.4]].forEach(([k, col, sc]) => {
      c.fillStyle = col;
      st.city.forEach(([x, w, h]) => { const xx = (((x - travel * k) % 2800) + 2800) % 2800 - 200; c.fillRect(xx, gy - h * sc * 0.8, w, h * sc * 0.8); });
    });
    c.fillStyle = '#16141c'; c.fillRect(0, gy, 1920, 1080 - gy);
    // road markings and speed streaks
    c.fillStyle = '#f2d24a';
    for (let k = -1; k < 8; k++) { const x = (((k * 320 - travel) % 320) + 320) % 320 + k * 0 - 320 + (k + 1) * 320; c.fillRect(x - 320, gy + 70, 170, 10); }
    c.strokeStyle = 'rgba(255,220,200,0.18)'; c.lineWidth = 2;
    for (let k = 0; k < 26; k++) { const y = hash(k * 2.1) * 1080, L = 200 + hash(k) * 500; const x = ((hash(k * 5.3) * 2600 - travel * (1.5 + hash(k))) % 2600 + 2600) % 2600 - 300; if (Math.abs(y - cy) < R * 1.05 && Math.abs(x - cx) < R) continue; c.beginPath(); c.moveTo(x, y); c.lineTo(x + L, y); c.stroke(); }
    // frame tubes leaving the wheel
    // chainring and stays of a track bike, half out of frame
    c.save();
    c.translate(cx + R * 2.25, cy + R * 0.12); c.rotate(MC.spin(t) * 1.1);
    c.fillStyle = '#1b1b20'; c.beginPath(); c.arc(0, 0, R * 0.62, 0, TAU); c.fill();
    c.strokeStyle = '#d8d8dc'; c.lineWidth = 8; c.setLineDash([6, 6]); c.beginPath(); c.arc(0, 0, R * 0.6, 0, TAU); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#16141c'; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(Math.cos(k / 5 * TAU) * R * 0.33, Math.sin(k / 5 * TAU) * R * 0.33, R * 0.14, 0, TAU); c.fill(); }
    c.restore();
    c.lineCap = 'round';
    const tube = (x0, y0, x1, y1, w) => { c.strokeStyle = '#0c0b10'; c.lineWidth = w + 6; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = '#e8313a'; c.lineWidth = w; c.stroke(); c.strokeStyle = 'rgba(255,220,200,0.55)'; c.lineWidth = 4; c.beginPath(); c.moveTo(x0, y0 - w * 0.25); c.lineTo(x1, y1 - w * 0.25); c.stroke(); };
    tube(cx, cy, cx + R * 2.25, cy + R * 0.12, 22);
    tube(cx, cy, cx + R * 1.75, cy - R * 2.6, 18);
    // wheel shadow
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.ellipse(cx, gy + 6, R * 0.9, 14, 0, 0, TAU); c.fill();
    const rot = MC.spin(t) * 2.2;
    // tyre — the matched circle
    c.strokeStyle = '#121214'; c.lineWidth = R * 0.12; c.beginPath(); c.arc(cx, cy, R * 0.94, 0, TAU); c.stroke();
    c.save(); c.translate(cx, cy); c.rotate(rot);
    c.strokeStyle = 'rgba(80,80,90,0.9)'; c.lineWidth = 6; c.setLineDash([14, 18]); c.beginPath(); c.arc(0, 0, R * 0.99, 0, TAU); c.stroke(); c.setLineDash([]);
    c.restore();
    const rg = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R); rg.addColorStop(0, '#f6f6f8'); rg.addColorStop(0.5, '#8e9096'); rg.addColorStop(1, '#e6e6ea');
    c.strokeStyle = rg; c.lineWidth = R * 0.07; c.beginPath(); c.arc(cx, cy, R * 0.84, 0, TAU); c.stroke();
    // spokes with smear
    for (let g = 0; g < 3; g++) {
      c.save(); c.translate(cx, cy); c.rotate(rot - g * 0.05);
      c.strokeStyle = `rgba(220,222,228,${g ? 0.22 : 0.9})`; c.lineWidth = 2.4;
      c.beginPath();
      for (let k = 0; k < 32; k++) { const a = k / 32 * TAU, off = (k % 2 ? 1 : -1) * 0.18; c.moveTo(Math.cos(a + off) * R * 0.07, Math.sin(a + off) * R * 0.07); c.lineTo(Math.cos(a) * R * 0.81, Math.sin(a) * R * 0.81); }
      c.stroke(); c.restore();
    }
    c.fillStyle = '#c8cad0'; c.beginPath(); c.arc(cx, cy, R * 0.09, 0, TAU); c.fill();
    c.fillStyle = '#444'; c.beginPath(); c.arc(cx, cy, R * 0.035, 0, TAU); c.fill();
  }

  function mcSun(c, t, lt, R, st) {
    const cx = MC.CX, cy = MC.CY;
    const sg = c.createLinearGradient(0, 0, 0, 1080);
    sg.addColorStop(0, '#2a050a'); sg.addColorStop(0.45, '#9c1b0e'); sg.addColorStop(0.75, '#ee5a1c'); sg.addColorStop(1, '#ffb050');
    c.fillStyle = sg; c.fillRect(0, 0, 1920, 1080);
    const glow = c.createRadialGradient(cx, cy, R, cx, cy, R * 2.6);
    glow.addColorStop(0, 'rgba(255,190,90,0.55)'); glow.addColorStop(1, 'rgba(255,120,40,0)');
    c.fillStyle = glow; c.fillRect(0, 0, 1920, 1080);
    // heat-shimmered disc drawn in slices
    const sd = c.createRadialGradient(cx, cy, 0, cx, cy, R);
    sd.addColorStop(0, '#fff6d8'); sd.addColorStop(0.75, '#ffe1a0'); sd.addColorStop(1, '#ffb862');
    c.fillStyle = sd;
    for (let y = -R; y < R; y += 3) {
      const w = Math.sqrt(Math.max(0, R * R - (y + 1.5) * (y + 1.5)));
      const amp = sstep(0.45, 1, (y + R) / (2 * R)) * 5;
      const ox = Math.sin(y * 0.11 + t * 26) * amp;
      c.fillRect(cx - w + ox, cy + y, w * 2, 3.6);
    }
    // haze bands
    c.fillStyle = 'rgba(150,26,10,0.28)';
    [[0.32, 5, 0.3], [0.58, 9, 1.7]].forEach(([u, hh, ph]) => { c.beginPath(); c.moveTo(-10, cy + R * u); for (let x = -10; x <= 1930; x += 40) c.lineTo(x, cy + R * u + Math.sin(x * 0.004 + ph + t) * 6); for (let x = 1930; x >= -10; x -= 40) c.lineTo(x, cy + R * u + hh * (0.6 + 0.4 * Math.sin(x * 0.01 + ph)) + Math.sin(x * 0.004 + ph + t) * 6); c.fill(); });
    // dunes
    const dune = (base, amp, f, ph, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(-10, 1080); for (let x = -10; x <= 1930; x += 20) c.lineTo(x, base + Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.3 + ph * 2) * amp * 0.3); c.lineTo(1930, 1080); c.closePath(); c.fill(); };
    dune(cy + R * 0.92, 26, 0.0021, 1.2, '#5e120a');
    dune(cy + R * 1.08, 34, 0.0016, 4.0, '#1c0503');
    // a rider crossing the crest
    const rx = 520 + lt * 60, ry = cy + R * 1.08 + Math.sin(rx * 0.0016 + 4) * 34 + Math.sin(rx * 0.0016 * 2.3 + 8) * 10;
    c.fillStyle = '#1c0503';
    c.save(); c.translate(rx, ry - 2);
    c.beginPath(); c.ellipse(0, -46, 34, 16, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(-4, -58, 14, 12, 0, 0, TAU); c.fill();
    c.lineWidth = 7; c.strokeStyle = '#1c0503'; c.lineCap = 'round';
    c.beginPath(); c.moveTo(28, -50); c.quadraticCurveTo(44, -60, 46, -78); c.stroke();
    c.beginPath(); c.ellipse(52, -80, 9, 6, 0.3, 0, TAU); c.fill();
    const lg = Math.sin(lt * 14) * 6;
    [[-24, lg], [-14, -lg], [18, -lg], [26, lg]].forEach(([x, o]) => { c.beginPath(); c.moveTo(x, -40); c.lineTo(x + o, 0); c.stroke(); });
    c.fillRect(-8, -86, 9, 28); c.beginPath(); c.arc(-3, -92, 7, 0, TAU); c.fill();
    c.restore();
  }

  function mcClock(c, t, lt, R, st) {
    const cx = MC.CX, cy = MC.CY;
    // zoom onto the noon hands: they become the vertical line
    const zk = E.inC(seg(lt, 0.36, 0.75));
    const Rh = R;                                   // clock face radius
    const tipY = cy - Rh * 0.92, tailY = cy + Rh * 0.14;
    const Z = lerp(1, (MC.LB - MC.LT) / (tailY - tipY), zk);
    const fy = lerp(cy, (tipY + tailY) / 2, zk);
    c.fillStyle = '#20272e'; c.fillRect(0, 0, 1920, 1080);
    c.save();
    c.translate(960, 540); c.scale(Z, Z); c.translate(-cx, -fy);
    // wall tiles
    c.strokeStyle = 'rgba(255,255,255,0.04)'; c.lineWidth = 2;
    for (let x = -400; x < 2400; x += 120) { c.beginPath(); c.moveTo(x, -400); c.lineTo(x, 1500); c.stroke(); }
    for (let y = -400; y < 1500; y += 60) { c.beginPath(); c.moveTo(-400, y); c.lineTo(2400, y); c.stroke(); }
    const lg = c.createRadialGradient(cx - 300, cy - 400, 0, cx, cy, 1200);
    lg.addColorStop(0, 'rgba(255,230,190,0.18)'); lg.addColorStop(1, 'rgba(0,0,0,0.3)');
    c.fillStyle = lg; c.fillRect(-400, -400, 2800, 1900);
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.arc(cx + 16, cy + 22, Rh * 1.08, 0, TAU); c.fill();
    c.fillStyle = '#111316'; c.beginPath(); c.arc(cx, cy, Rh * 1.08, 0, TAU); c.fill();
    const fg = c.createRadialGradient(cx - Rh * 0.3, cy - Rh * 0.4, 0, cx, cy, Rh);
    fg.addColorStop(0, '#ffffff'); fg.addColorStop(1, '#e6e6e0');
    c.fillStyle = fg; c.beginPath(); c.arc(cx, cy, Rh, 0, TAU); c.fill();
    c.fillStyle = '#121212';
    for (let k = 0; k < 60; k++) {
      c.save(); c.translate(cx, cy); c.rotate(k / 60 * TAU);
      if (k % 5 === 0) c.fillRect(-Rh * 0.03, -Rh * 0.92, Rh * 0.06, Rh * 0.24); else c.fillRect(-Rh * 0.011, -Rh * 0.92, Rh * 0.022, Rh * 0.07);
      c.restore();
    }
    // hands: 11:59 → noon. Minute hand snaps on the beat, second hand sweeps through.
    const snap = E.outB(seg(lt, 0.25, 0.33), 3);
    const minA = lerp(-TAU / 60, 0, snap), hrA = lerp(-TAU / 720, 0, snap);
    const secA = lerp(-TAU * 0.3, TAU * 0.16, E.outC(seg(lt, 0, 0.75))) ;
    const hand = (a, len, tail, w, col) => { c.save(); c.translate(cx, cy); c.rotate(a); c.fillStyle = col; c.fillRect(-w / 2, -len, w, len + tail); c.restore(); };
    c.save(); c.shadowColor = 'rgba(0,0,0,0.25)'; c.shadowOffsetX = 6; c.shadowOffsetY = 8; c.shadowBlur = 10;
    hand(hrA, Rh * 0.64, Rh * 0.14, Rh * 0.075, '#121212');
    hand(minA, Rh * 0.92, Rh * 0.14, Rh * 0.065, '#121212');
    c.save(); c.translate(cx, cy); c.rotate(secA); c.fillStyle = '#d22a1e'; c.fillRect(-Rh * 0.012, -Rh * 0.62, Rh * 0.024, Rh * 0.92); c.beginPath(); c.arc(0, -Rh * 0.62, Rh * 0.07, 0, TAU); c.fill(); c.restore();
    c.restore();
    c.fillStyle = '#121212'; c.beginPath(); c.arc(cx, cy, Rh * 0.04, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.ellipse(cx - Rh * 0.3, cy - Rh * 0.45, Rh * 0.55, Rh * 0.25, -0.5, 0, TAU); c.fill();
    c.restore();
  }

  /* ---- the vertical shots ---- */
  function mcPen(c, t, lt, R, st) {
    const scroll = lt * 760;
    c.fillStyle = '#f1e8d6'; c.fillRect(0, 0, 1920, 1080);
    c.strokeStyle = 'rgba(80,110,160,0.35)'; c.lineWidth = 2;
    for (let y = 120; y < 1080; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(1920, y); c.stroke(); }
    c.strokeStyle = 'rgba(200,60,60,0.45)'; const mx = 240 - scroll; c.beginPath(); c.moveTo(mx, 0); c.lineTo(mx, 1080); c.stroke();
    c.strokeStyle = 'rgba(150,120,80,0.12)'; c.lineWidth = 1;
    st.fibers.forEach(([x, y, l, v]) => { const xx = ((x - scroll) % 2400 + 2400) % 2400 - 200; c.beginPath(); c.moveTo(xx, y); c.lineTo(xx + l, y + (v - 0.5) * 8); c.stroke(); });
    // ink: looping cursive written up to the nib (paper slides left under a still pen)
    const w = 0.055, A = 26;
    const nib = s => [960 - A * Math.sin(w * s) * 0.7, MC.LB - 6 - 18 * (1 - Math.cos(w * s))];
    const s1 = scroll;
    c.strokeStyle = '#1a2a6a'; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath();
    for (let s = Math.max(0, s1 - 1100); s <= s1; s += 4) {
      const p = nib(s), x = p[0] - (s1 - s);
      s <= Math.max(0, s1 - 1100) + 0.1 ? c.moveTo(x, p[1]) : c.lineTo(x, p[1]);
    }
    c.lineWidth = 6; c.stroke();
    const [nx, ny] = nib(s1);
    // pen shadow cast to lower-right on the paper
    c.fillStyle = 'rgba(60,40,20,0.18)';
    c.beginPath(); c.moveTo(nx + 4, ny); c.lineTo(nx + 330, MC.LT + 140); c.lineTo(nx + 370, MC.LT + 150); c.lineTo(nx + 12, ny); c.closePath(); c.fill();
    // pen — the matched line, nib down
    const top = MC.LT, bx = nx - MC.LW / 2;
    const barrel = (y0, y1, base, hi) => { const g = c.createLinearGradient(bx, 0, bx + MC.LW, 0); g.addColorStop(0, base); g.addColorStop(0.3, hi); g.addColorStop(0.55, base); g.addColorStop(1, '#050806'); c.fillStyle = g; c.fillRect(bx, y0, MC.LW, y1 - y0); };
    const nibTop = ny - 120;
    barrel(top, nibTop - 90, '#0f3a2c', '#3f8a70');
    c.fillStyle = '#c9a24a'; c.fillRect(bx - 1, top + 120, MC.LW + 2, 10); c.fillRect(bx - 1, nibTop - 104, MC.LW + 2, 14);
    c.fillStyle = '#d8d8d4'; c.fillRect(bx + MC.LW - 10, top + 10, 8, 240); c.beginPath(); c.arc(bx + MC.LW - 6, top + 250, 6, 0, TAU); c.fill();
    barrel(nibTop - 90, nibTop, '#141414', '#555');
    const ng = c.createLinearGradient(bx, 0, bx + MC.LW, 0); ng.addColorStop(0, '#9a7428'); ng.addColorStop(0.4, '#f2d88a'); ng.addColorStop(1, '#7a5a1c');
    c.fillStyle = ng; c.beginPath(); c.moveTo(bx + 2, nibTop); c.lineTo(bx + MC.LW - 2, nibTop); c.lineTo(nx + 3, ny); c.lineTo(nx - 3, ny); c.closePath(); c.fill();
    c.strokeStyle = '#3a2a10'; c.lineWidth = 2; c.beginPath(); c.moveTo(nx, nibTop + 40); c.lineTo(nx, ny); c.stroke();
    c.fillStyle = '#3a2a10'; c.beginPath(); c.arc(nx, nibTop + 38, 3, 0, TAU); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(bx, top, MC.LW, 6);
    const lamp = c.createRadialGradient(700, 300, 0, 900, 500, 1300);
    lamp.addColorStop(0, 'rgba(255,220,160,0.12)'); lamp.addColorStop(1, 'rgba(40,20,0,0.35)');
    c.fillStyle = lamp; c.fillRect(0, 0, 1920, 1080);
  }

  function mcTower(c, t, lt, R, st) {
    const tilt = lt * 120;
    const sg = c.createLinearGradient(0, 0, 0, 1080);
    sg.addColorStop(0, '#081232'); sg.addColorStop(0.55, '#26306a'); sg.addColorStop(0.85, '#c25a5e'); sg.addColorStop(1, '#f39a5c');
    c.fillStyle = sg; c.fillRect(0, 0, 1920, 1080);
    c.fillStyle = 'rgba(255,170,140,0.18)';
    for (let k = 0; k < 5; k++) c.fillRect(0, 300 + k * 70 + tilt * 0.2, 1920, 4 + k);
    c.save(); c.translate(0, tilt);
    [[0.5, '#1a1e46', 0.6], [1, '#0c0f26', 1]].forEach(([dep, col, sc]) => {
      st.twr.forEach(([x, w, h, v], i) => {
        if (Math.abs(x + w / 2 - 960) < 120 && dep === 1) return;
        const hh = h * sc, yy = 980 - hh;
        c.fillStyle = col; c.fillRect(x, yy, w, hh + 200);
        if (dep === 1) { c.fillStyle = 'rgba(255,210,140,0.55)'; for (let wy = yy + 10; wy < 1080; wy += 16) for (let wx = x + 6; wx < x + w - 6; wx += 12) if (hash(wx * 0.37 + wy * 1.7 + i) > 0.62) c.fillRect(wx, wy, 5, 7); }
      });
    });
    // the tower — the matched line
    const top = MC.LT, bx = 960 - MC.LW / 2;
    const tg = c.createLinearGradient(bx, 0, bx + MC.LW, 0);
    tg.addColorStop(0, '#f6a070'); tg.addColorStop(0.45, '#5a4c78'); tg.addColorStop(1, '#141634');
    c.fillStyle = tg; c.fillRect(bx, top, MC.LW, 1000 - top);
    c.fillStyle = 'rgba(255,230,190,0.75)';
    for (let y = top + 14; y < 1000; y += 9) { if (hash(y * 0.7) > 0.45) c.fillRect(bx + 5, y, 6, 3); if (hash(y * 1.3) > 0.55) c.fillRect(bx + 17, y, 6, 3); if (hash(y * 2.9) > 0.7) c.fillRect(bx + 29, y, 6, 3); }
    c.fillStyle = '#141634'; c.fillRect(958, top - 70, 4, 70);
    const blink = Math.floor(t * 4) % 2 === 0 ? 1 : 0.15;
    const bg = c.createRadialGradient(960, top - 72, 0, 960, top - 72, 30); bg.addColorStop(0, `rgba(255,40,40,${blink})`); bg.addColorStop(1, 'rgba(255,40,40,0)');
    c.fillStyle = bg; c.fillRect(920, top - 112, 80, 80);
    c.restore();
  }

  function mcRocket(c, t, lt, R, st) {
    const lift = E.inQ(seg(lt, 0.32, 0.875));
    const rise = lift * 1150;
    const cam = lift * 380;                         // camera tilts up after it, then lets it go
    const sg = c.createLinearGradient(0, 0, 0, 1080);
    sg.addColorStop(0, '#4f7fb4'); sg.addColorStop(0.6, '#a9c4dc'); sg.addColorStop(1, '#f6d6a8');
    c.fillStyle = sg; c.fillRect(0, 0, 1920, 1080);
    c.save(); c.translate(0, cam);
    c.fillStyle = '#6c8cab'; c.fillRect(0, 900, 1920, 20);
    c.fillStyle = '#c8b89a'; c.fillRect(0, 918, 1920, 400);
    c.fillStyle = '#8a7e6a'; c.fillRect(760, 900, 400, 30);
    // gantry
    c.strokeStyle = '#c4462a'; c.lineWidth = 6;
    const gx = 840, gw = 60;
    c.beginPath(); c.moveTo(gx, 180); c.lineTo(gx, 905); c.moveTo(gx + gw, 180); c.lineTo(gx + gw, 905); c.stroke();
    c.lineWidth = 3; c.beginPath();
    for (let y = 180; y < 900; y += 50) { c.moveTo(gx, y); c.lineTo(gx + gw, y + 50); c.moveTo(gx + gw, y); c.lineTo(gx, y + 50); c.moveTo(gx, y); c.lineTo(gx + gw, y); }
    c.stroke();
    const arm = 1 - E.outC(seg(lt, 0.05, 0.3));
    c.lineWidth = 8; c.beginPath(); c.moveTo(gx + gw, 300); c.lineTo(gx + gw + 40 * arm + 2, 300); c.stroke();
    c.restore();
    // exhaust and smoke
    const ign = seg(lt, 0, 0.12);
    const baseY = MC.LB - 20 - rise + cam;
    if (ign > 0) {
      c.save();
      st.smoke.forEach(([sx, sy, sr, v], i) => {
        const age = Math.max(0, lt - v * 0.3);
        const x = 960 + sx * (60 + age * 900) * (0.4 + v), y = 905 + cam - sy * 40 - age * 60 * v;
        const r2 = sr * (0.4 + age * 2.2);
        c.fillStyle = `rgba(${236 - v * 30},${230 - v * 30},${222 - v * 30},${0.85 * ign})`;
        c.beginPath(); c.arc(x, y, r2, 0, TAU); c.fill();
      });
      const trailTop = baseY + 10, trailBot = 905 + cam;
      if (trailBot > trailTop) {
        const tg2 = c.createLinearGradient(0, trailTop, 0, trailBot);
        tg2.addColorStop(0, 'rgba(255,250,230,0.95)'); tg2.addColorStop(0.3, 'rgba(255,190,90,0.8)'); tg2.addColorStop(1, 'rgba(240,236,228,0.9)');
        c.fillStyle = tg2;
        c.beginPath(); c.moveTo(960 - 14, trailTop); c.lineTo(960 + 14, trailTop); c.lineTo(960 + 60, trailBot); c.lineTo(960 - 60, trailBot); c.closePath(); c.fill();
      }
      c.globalCompositeOperation = 'lighter';
      const fl = 0.85 + 0.15 * Math.sin(lt * 90);
      const fg = c.createRadialGradient(960, baseY + 40, 0, 960, baseY + 60, 180 * fl);
      fg.addColorStop(0, 'rgba(255,255,230,1)'); fg.addColorStop(0.25, 'rgba(255,200,90,0.85)'); fg.addColorStop(1, 'rgba(255,90,20,0)');
      c.fillStyle = fg; c.beginPath(); c.ellipse(960, baseY + 80, 60 * fl, 200 * fl * ign, 0, 0, TAU); c.fill();
      c.restore();
    }
    // the rocket — the matched line
    const top = MC.LT - rise + cam, bx = 960 - MC.LW / 2, bot = MC.LB - 20 - rise + cam;
    const rg = c.createLinearGradient(bx, 0, bx + MC.LW, 0);
    rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.5, '#e8e6e0'); rg.addColorStop(1, '#8e8c88');
    c.fillStyle = rg; c.fillRect(bx, top + 40, MC.LW, bot - top - 40);
    c.beginPath(); c.moveTo(bx, top + 40); c.lineTo(960, top - 10); c.lineTo(bx + MC.LW, top + 40); c.closePath(); c.fill();
    c.fillStyle = '#141414';
    [[0.18, 0.04], [0.42, 0.06], [0.7, 0.05]].forEach(([u, hh]) => c.fillRect(bx, top + (bot - top) * u, MC.LW, (bot - top) * hh));
    for (let k = 0; k < 4; k++) c.fillRect(bx + (k % 2 ? MC.LW / 2 : 0), top + (bot - top) * (0.8 + Math.floor(k / 2) * 0.06), MC.LW / 2, (bot - top) * 0.06);
    c.beginPath(); c.moveTo(bx, bot - 70); c.lineTo(bx - 24, bot); c.lineTo(bx, bot); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(bx + MC.LW, bot - 70); c.lineTo(bx + MC.LW + 24, bot); c.lineTo(bx + MC.LW, bot); c.closePath(); c.fill();
    c.fillStyle = '#444'; c.fillRect(bx + 6, bot, MC.LW - 12, 16);
  }

  function mcLockup(c, t, lt, R, st) {
    c.fillStyle = '#0d0c0b'; c.fillRect(0, 0, 1920, 1080);
    const cx = 960, cy = 470, r = 150;
    // the rocket trail collapses into the bar; the circle redraws itself round it
    const k = E.ioX(seg(lt, 0.0, 0.5));
    const top = lerp(0, cy - r - 70, k), bot = lerp(1080, cy + r + 70, k), w = lerp(MC.LW, 8, k);
    c.fillStyle = k < 0.15 ? '#fff4dc' : '#e8432a';
    c.fillRect(cx - w / 2, top, w, bot - top);
    const draw = E.outC(seg(lt, 0.18, 0.75));
    if (draw > 0) {
      c.strokeStyle = '#f2ece0'; c.lineWidth = 8; c.lineCap = 'butt';
      c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * draw); c.stroke();
    }
    const ta = seg(lt, 0.4, 0.8);
    c.globalAlpha = ta;
    c.fillStyle = '#f2ece0'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.font = `400 112px ${SERIF}`; setLS(c, lerp(30, 6, E.outC(ta)));
    c.fillText('Match Cut', cx + 3, 790);
    setLS(c, 8); c.font = `400 19px ${MONO}`;
    c.globalAlpha = seg(lt, 0.55, 0.95) * 0.8;
    c.fillText('SHAPE  ·  POSITION  ·  MOTION', cx + 4, 850);
    setLS(c, 0); c.globalAlpha = 1;
  }

  const MC_DRAW = { eye: mcEye, planet: mcPlanet, coffee: mcCoffee, vinyl: mcVinyl, wheel: mcWheel, sun: mcSun, clock: mcClock, pen: mcPen, tower: mcTower, rocket: mcRocket, lockup: mcLockup };

  function mcDraw(c, t, W, H, st) {
    let idx = 0;
    MC.SHOTS.forEach((s, i) => { if (t >= s[1]) idx = i; });
    const [kind, t0, t1, label] = MC.SHOTS[idx];
    const lt = t - t0;
    // flurry shots show their own moment, as if cut from the earlier takes
    const R = MC.R(t);
    MC_DRAW[kind](c, t, lt + (idx >= 6 && idx <= 9 ? 0.7 : 0), R, st);
    grain(c, W, H, t, 0.06);
    if (kind !== 'lockup') vignette(c, W, H, 0.4);
    // match guide: hairline of the held geometry flashes over each cut
    const sinceCut = lt;
    if (idx > 0 && sinceCut < 0.12 && kind !== 'lockup') {
      const a = 1 - sinceCut / 0.12;
      c.save();
      c.strokeStyle = `rgba(255,255,255,${0.85 * a})`; c.lineWidth = 2;
      if (idx <= 10) { c.beginPath(); c.arc(MC.CX, MC.CY, R, 0, TAU); c.stroke(); }
      else { c.strokeRect(MC.CX - MC.LW / 2, MC.LT, MC.LW, MC.LB - MC.LT); }
      c.beginPath(); c.moveTo(MC.CX - 30, MC.CY); c.lineTo(MC.CX + 30, MC.CY); c.moveTo(MC.CX, MC.CY - 30); c.lineTo(MC.CX, MC.CY + 30); c.stroke();
      c.fillStyle = `rgba(255,255,255,${0.12 * a})`; c.fillRect(0, 0, W, H);
      c.restore();
    }
    // 2.39 letterbox with an edit-decision readout
    const bar = kind === 'lockup' ? MC.BAR * (1 - E.ioC(seg(lt, 0.3, 0.9))) : MC.BAR;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
    if (bar > 20) {
      const ba = bar / MC.BAR;
      c.save(); c.globalAlpha = ba;
      c.font = `400 17px ${MONO}`; setLS(c, 4); c.textBaseline = 'middle';
      c.fillStyle = 'rgba(255,255,255,0.75)'; c.textAlign = 'left';
      c.fillText(`${String(idx + 1).padStart(2, '0')}  ${label}`, 72, H - bar / 2);
      const f = Math.floor(t * 24);
      c.textAlign = 'right';
      c.fillText(`00:00:${String(Math.floor(t)).padStart(2, '0')}:${String(f % 24).padStart(2, '0')}`, W - 72, H - bar / 2);
      c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,0.45)';
      c.fillText(idx <= 10 ? 'HOLD  ○' : 'HOLD  │', W / 2, bar / 2);
      // cut ticks along the bottom bar
      const x0 = 520, x1 = 1400;
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x0, H - bar / 2, x1 - x0, 1);
      MC.SHOTS.forEach(s => { c.fillStyle = s[1] <= t ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)'; c.fillRect(x0 + (x1 - x0) * s[1] / 10 - 1, H - bar / 2 - 8, 2, 16); });
      c.fillStyle = '#e8432a'; c.fillRect(x0 + (x1 - x0) * t / 10 - 1.5, H - bar / 2 - 12, 3, 24);
      setLS(c, 0);
      c.restore();
    }
  }

  function mcScore(A) {
    A.bus.gain.value = 0.7;
    const B = 0.5;
    // eye: a held breath, heartbeat, lid opening
    A.noise(0.0, { type: 'lowpass', f: 300, dur: 1.4, g: 0.06, swell: 0.7 });
    [0.1, 0.36, 0.9, 1.16].forEach((t, i) => A.kick(t, i % 2 ? 0.35 : 0.5, { f: 70, f2: 38, dur: 0.3 }));
    A.whoosh(0.16, 0.45, { f1: 200, f2: 1800, g: 0.12 });
    A.osc(0.95, { f: 2400, f2: 1800, dur: 0.12, g: 0.05, type: 'sine' });
    A.riser(0.7, 0.8, { g: 0.14, f: 80 });
    // groove from the planet onwards
    for (let b = 3; b < 18; b++) {
      const t = b * B;
      if (t >= 8.875) break;
      A.kick(t, 0.75);
      if (b % 2 === 0 && t >= 3.5) A.clap(t, 0.22);
      if (t >= 2.5) { A.hat(t + B / 2, 0.07); A.hat(t + B / 4, 0.03); A.hat(t + 3 * B / 4, 0.03); }
      const bass = [33, 33, 36, 31][Math.floor(b / 2) % 4];
      A.osc(t, { type: 'sawtooth', f: midi(bass), dur: B * 0.8, g: 0.09, lp: 420, a: 0.004 });
      A.osc(t + B * 0.75, { type: 'sawtooth', f: midi(bass + 12), dur: B * 0.2, g: 0.05, lp: 700 });
    }
    // a signature hit on every cut
    const cut = {
      planet: t => { A.impact(t, 0.7); A.chord(t, [45, 52, 57], { type: 'sawtooth', dur: 1.0, g: 0.03, lp: 900, a: 0.01, spread: 8, rev: 0.5 }); },
      coffee: t => { A.bell(t, 1960, { ratios: [1, 2.32, 4.25, 6.63], g: 0.12, dur: 1.2 }); A.noise(t + 0.05, { type: 'bandpass', f: 3000, f2: 1200, dur: 0.8, g: 0.04, q: 3, swell: 0.4 }); },
      vinyl: t => { A.noise(t, { type: 'bandpass', f: 1200, f2: 300, dur: 0.18, g: 0.2, q: 2 }); A.osc(t, { type: 'sawtooth', f: 300, f2: 90, glide: 0.15, dur: 0.18, g: 0.08, lp: 1500 }); for (let k = 0; k < 10; k++) A.noise(t + hash(k) * 0.7, { type: 'highpass', f: 5000, dur: 0.008, g: 0.06 }); },
      wheel: t => { A.whoosh(t - 0.15, 0.5, { f1: 400, f2: 3000, g: 0.2, pan: -0.4 }); for (let k = 0; k < 12; k++) A.noise(t + k * 0.055, { type: 'highpass', f: 6000, dur: 0.01, g: 0.05, pan: 0.3 }); },
      sun: t => { A.impact(t, 0.9); A.bell(t, 98, { ratios: [1, 1.47, 2.09, 2.56, 3.3], g: 0.12, dur: 2.2, rev: 0.7 }); A.chord(t, [38, 45, 50, 57], { type: 'sawtooth', dur: 0.6, g: 0.035, lp: 1400, a: 0.02, spread: 10 }); },
      eye: t => A.snare(t, 0.3, { dur: 0.08 }),
      clock: t => { A.osc(t, { f: 660, dur: 0.05, g: 0.1, type: 'square', lp: 2500 }); for (let k = 1; k < 6; k++) A.noise(t + k * 0.04, { type: 'bandpass', f: k % 2 ? 4200 : 3000, q: 6, dur: 0.02, g: 0.12 }); A.bell(t + 0.25, midi(76), { g: 0.12, dur: 1.4 }); A.bell(t + 0.25, midi(83), { g: 0.06, dur: 1.2 }); A.kick(t + 0.25, 0.5, { f: 120, f2: 60 }); },
      pen: t => { A.noise(t, { type: 'bandpass', f: 5200, q: 4, dur: 0.75, g: 0.07, hold: true, rel: 0.1 }); A.pluck(t, midi(57), { g: 0.25, dur: 1.2 }); },
      tower: t => { A.chord(t, [50, 57, 62, 66], { type: 'sawtooth', dur: 0.45, g: 0.04, lp: 2600, a: 0.005, spread: 10, rev: 0.3 }); },
      rocket: t => { A.noise(t, { type: 'lowpass', f: 180, f2: 900, sweep: 0.9, dur: 1.1, g: 0.3, hold: true, rel: 0.2 }); A.osc(t, { f: 50, f2: 34, dur: 1.0, g: 0.2, hold: true }); A.riser(t + 0.1, 0.78, { g: 0.2, f: 90 }); },
      lockup: t => { A.impact(t, 1.0); A.chord(t, [45, 52, 57, 61, 64], { type: 'triangle', dur: 1.2, g: 0.05, a: 0.004, hold: true, rel: 0.6, spread: 6, rev: 0.5, width: 1 }); A.bell(t + 0.02, midi(81), { g: 0.08, dur: 1.2 }); },
    };
    MC.SHOTS.forEach(([kind, t0], i) => { if (i === 0) return; (cut[kind] || cut.eye)(t0); if (i >= 6 && i <= 9) A.snare(t0, 0.35, { dur: 0.06 }); });
  }

  MG.film({
    id: 'matchcut', dur: 10, poster: 9.6,
    fonts: [['400 112px "Instrument Serif"', 'Match Cut'], ['400 19px "JetBrains Mono"', 'SHAPEPOSITIONMOTION0123456789:○│'], ['700 20px Oswald', 'SIDE A']],
    meta: {
      family: 'H', name: 'Match-cut Montage', sub: 'The Shape Holds, the World Changes', era: '1968 —',
      origin: 'A graphic match cut joins two shots through a shared shape, position or movement so the eye glides across the edit. Kubrick\'s bone-to-satellite cut in 2001: A Space Odyssey (1968) and David Lean\'s match from a blown-out match flame to a desert sunrise in Lawrence of Arabia (1962) made it famous; Edgar Wright and countless title sequences turned it into rapid rhythmic montage.',
      works: 'Lawrence of Arabia (David Lean, 1962) · 2001: A Space Odyssey (Stanley Kubrick, 1968) · Psycho (Alfred Hitchcock, 1960; drain to eye) · Requiem for a Dream (Darren Aronofsky, 2000) · Shaun of the Dead (Edgar Wright, 2004) · Hot Fuzz (Edgar Wright, 2007)',
      tech: ['Every shot drawn round one shared circle (R) or vertical bar (L)', 'Slow push held across cuts so the shape never jumps', 'Clock-hand zoom that converts the circle chain into the line chain', 'Hairline match guide and flash on each cut', 'Letterbox edit readout: shot, timecode, cut ticks'],
      accent: '#e8432a',
      motionDNA: 'Hard cuts on the beat while one shape stays nailed to the frame: rotation carries through iris, planet, coffee swirl, record and wheel; a station clock snaps to noon and pushes in until its hands become a pen, a tower and a rising rocket.',
      visualDNA: 'Every shot a different world and palette (macro skin and iris, deep space, a mint terrazzo café table, walnut hi-fi, a magenta street, a Lean-red desert, a station clock) unified by one locked circle and one locked line inside a 2.39 letterbox.',
      transitions: 'Graphic match cuts, motion match cuts, a stutter flurry of quarter-beat cuts, a push-in that converts circle to line, trail-to-lockup.',
      implementation: ['Live action + editorial', 'After Effects / Premiere', 'Canvas 2D'],
      reproducibility: 'Needs live action (this film is a procedural homage)', loopable: false,
    },
    setup: mcSetup,
    draw: mcDraw,
    score: mcScore,
  });
  /* =====================================================================
     SPLIT SCREEN — one ringing phone becomes 2, 4, 9, 16 simultaneous
     shots: clock, headlights, a runner, a door, a timer, a map, a CCTV
     feed, vitals, a vault dial... all converging on one countdown. Panels
     slide and resize on the beat, squeeze toward the phone booth and slam
     into one full frame at zero; the ringing stops.
     ===================================================================== */
  const SS = { T0: 8.5, VW: 1600, VH: 900 };
  SS.RINGS = [[0.04, 0.94], [2.0, 2.8], [3.5, 4.2], [5.0, 5.6], [6.0, 6.5], [6.75, 7.15], [7.3, 7.65], [7.8, 8.1], [8.2, 8.48]];
  SS.ring = t => SS.RINGS.some(([a, b]) => t >= a && t < b) ? 1 : 0;
  SS.rem = t => Math.max(0, SS.T0 - t);
  const rows4 = r => [r.slice(), r.slice(), r.slice(), r.slice()];
  // layouts: ry = row boundaries, cx[j] = column boundaries for row j (rows slide independently)
  SS.KEYS = [
    [0, 0.01, { ry: [0, 1, 1, 1, 1], cx: rows4([0, 1, 1, 1, 1]) }],
    [1.0, 0.42, { ry: [0, 1, 1, 1, 1], cx: rows4([0, 0.5, 1, 1, 1]) }],
    [2.0, 0.42, { ry: [0, 0.52, 1, 1, 1], cx: [[0, 0.44, 1, 1, 1], [0, 0.57, 1, 1, 1], [0, 0.57, 1, 1, 1], [0, 0.57, 1, 1, 1]] }],
    [3.5, 0.42, { ry: [0, 0.34, 0.68, 1, 1], cx: [[0, 0.3, 0.64, 1, 1], [0, 0.37, 0.7, 1, 1], [0, 0.32, 0.6, 1, 1], [0, 0.32, 0.6, 1, 1]] }],
    [5.0, 0.42, { ry: [0, 0.25, 0.5, 0.75, 1], cx: [[0, 0.25, 0.5, 0.75, 1], [0, 0.22, 0.5, 0.78, 1], [0, 0.27, 0.52, 0.76, 1], [0, 0.24, 0.48, 0.74, 1]] }],
    [5.5, 0.34, { ry: [0, 0.4, 0.6, 0.8, 1], cx: [[0, 0.18, 0.36, 0.8, 1], [0, 0.22, 0.5, 0.78, 1], [0, 0.27, 0.52, 0.76, 1], [0, 0.24, 0.48, 0.74, 1]] }],
    [6.0, 0.34, { ry: [0, 0.2, 0.6, 0.8, 1], cx: [[0, 0.25, 0.5, 0.75, 1], [0, 0.2, 0.4, 0.82, 1], [0, 0.27, 0.52, 0.76, 1], [0, 0.24, 0.48, 0.74, 1]] }],
    [6.5, 0.34, { ry: [0, 0.2, 0.4, 0.82, 1], cx: [[0, 0.25, 0.5, 0.75, 1], [0, 0.22, 0.5, 0.78, 1], [0, 0.42, 0.62, 0.82, 1], [0, 0.24, 0.48, 0.74, 1]] }],
    [7.0, 0.4, { ry: [0, 0.22, 0.74, 0.88, 1], cx: [[0, 0.25, 0.5, 0.75, 1], [0, 0.22, 0.74, 0.88, 1], [0, 0.25, 0.5, 0.75, 1], [0, 0.25, 0.5, 0.75, 1]] }],
    [7.5, 0.4, { ry: [0, 0.14, 0.84, 0.93, 1], cx: [[0, 0.25, 0.5, 0.75, 1], [0, 0.14, 0.84, 0.93, 1], [0, 0.25, 0.5, 0.75, 1], [0, 0.25, 0.5, 0.75, 1]] }],
    [8.0, 0.36, { ry: [0, 0.08, 0.91, 0.96, 1], cx: [[0, 0.25, 0.5, 0.75, 1], [0, 0.08, 0.91, 0.96, 1], [0, 0.25, 0.5, 0.75, 1], [0, 0.25, 0.5, 0.75, 1]] }],
    [8.38, 0.12, { ry: [0, 0, 1, 1, 1], cx: [[0, 0.25, 0.5, 0.75, 1], [0, 0, 1, 1, 1], [0, 0.25, 0.5, 0.75, 1], [0, 0.25, 0.5, 0.75, 1]] }, 'in'],
  ];
  SS.layout = t => {
    let k = 0;
    SS.KEYS.forEach((key, i) => { if (t >= key[0]) k = i; });
    const A = SS.KEYS[Math.max(0, k - 1)][2], key = SS.KEYS[k], B = key[2];
    const ez = key[3] === 'in' ? E.inC : E.outQn;
    const pr = j => ez(seg(t, key[0] + j * 0.04, key[0] + key[1] + j * 0.04));
    const ry = A.ry.map((v, i) => lerp(v, B.ry[i], pr(0)));
    const cx = A.cx.map((row, j) => row.map((v, i) => lerp(v, B.cx[j][i], pr(j))));
    // breathing drift while the full grid is up
    const br = sstep(5.0, 5.4, t) * (1 - sstep(6.9, 7.0, t)) * 0.012;
    if (br > 0) { for (let i = 1; i < 4; i++) ry[i] += Math.sin(t * 2.1 + i * 1.7) * br; cx.forEach((row, j) => { for (let i = 1; i < 4; i++) row[i] += Math.sin(t * 2.6 + i * 2.3 + j) * br; }); }
    return { ry, cx, k, since: t - key[0] };
  };
  SS.SLOT = {
    '0,0': ['phone', 0, 'LINE 1'], '1,0': ['clock', 0, 'CLOCK'], '0,1': ['car', 0, 'UNIT 2'], '1,1': ['booth', 0, 'BOOTH'],
    '2,0': ['timer', 0, 'T-MINUS'], '2,1': ['feet', 0, 'RUNNER'], '0,2': ['door', 0, 'CORRIDOR'], '1,2': ['eyes', 0, 'WITNESS'], '2,2': ['radar', 0, 'TRACK'],
    '3,0': ['cctv', 0, 'CAM 04'], '3,1': ['ecg', 0, 'VITALS'], '3,2': ['vault', 0, 'VAULT'],
    '0,3': ['phone', 1, 'DIAL'], '1,3': ['car', 1, 'SPEED'], '2,3': ['feet', 1, 'SHADOW'], '3,3': ['clock', 1, 'WATCH'],
  };

  function ssSetup() {
    const r = rng(1968);
    const rain = []; for (let k = 0; k < 160; k++) rain.push([r() * 1600, r() * 900, 20 + r() * 40, 0.4 + r() * 0.6]);
    const wins = []; for (let fy = 0; fy < 4; fy++) for (let fx = 0; fx < 12; fx++) wins.push([30 + fx * 136, 40 + fy * 140, r()]);
    const grid = []; for (let k = 0; k < 18; k++) grid.push([r(), r() < 0.5, r()]);
    const bricks = []; for (let k = 0; k < 260; k++) bricks.push(r());
    return { rain, wins, grid, bricks };
  }

  // shared run cycle: returns [knee, ankle, toe] for a leg with phase φ, hip at (hx, hy), scale s
  function ssLeg(hx, hy, ph, s, dir = 1) {
    const a1 = 0.62 * Math.sin(ph);
    const bend = 0.25 + 0.95 * Math.max(0, Math.sin(ph - 1.4));
    const L1 = 230 * s, L2 = 230 * s;
    const kx = hx + Math.sin(a1) * L1 * dir, ky = hy + Math.cos(a1) * L1;
    const a2 = a1 - bend;
    const ax = kx + Math.sin(a2) * L2 * dir, ay = ky + Math.cos(a2) * L2;
    return [[kx, ky], [ax, ay], [ax + 70 * s * dir * Math.cos(a2 * 0.6), ay + 10 * s]];
  }
  function ssRunner(c, x, y, s, ph, col, full) {
    c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
    const legs = [ph, ph + Math.PI];
    legs.forEach((p, i) => {
      const [k, a, toe] = ssLeg(x, y, p, s);
      c.lineWidth = 64 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(k[0], k[1]); c.stroke();
      c.lineWidth = 52 * s; c.beginPath(); c.moveTo(k[0], k[1]); c.lineTo(a[0], a[1]); c.stroke();
      c.lineWidth = 36 * s; c.beginPath(); c.moveTo(a[0] - 16 * s, a[1]); c.lineTo(toe[0], toe[1]); c.stroke();
    });
    if (full) {
      c.lineWidth = 90 * s; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 40 * s, y - 300 * s); c.stroke();
      c.beginPath(); c.arc(x + 58 * s, y - 380 * s, 52 * s, 0, TAU); c.fill();
      [ph + Math.PI, ph].forEach(p => {
        const a = 0.9 * Math.sin(p), ex = x + 30 * s + Math.sin(a) * 150 * s, ey = y - 270 * s + Math.cos(a) * 150 * s;
        c.lineWidth = 40 * s; c.beginPath(); c.moveTo(x + 36 * s, y - 270 * s); c.lineTo(ex, ey); c.lineTo(ex + 90 * s * Math.cos(a - 0.9), ey - 90 * s * Math.sin(a + 0.6)); c.stroke();
      });
    }
  }
  function seg7(c, s, x, y, h, on, off) {
    const SEGS = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
    const w = h * 0.52, t2 = h * 0.11;
    const P = { a: [0, 0, 1], b: [1, 0, 0], c: [1, 0.5, 0], d: [0, 1, 1], e: [0, 0.5, 0], f: [0, 0, 0], g: [0, 0.5, 1] };
    let cx = x;
    for (const ch of s) {
      if (ch === ':' || ch === '.') {
        c.fillStyle = on;
        if (ch === ':') { c.fillRect(cx + 4, y + h * 0.28, t2, t2); c.fillRect(cx + 4, y + h * 0.68, t2, t2); }
        else c.fillRect(cx + 4, y + h - t2, t2, t2);
        cx += t2 + 22; continue;
      }
      const lit = SEGS[ch] || '';
      'abcdefg'.split('').forEach(k => {
        const [px, py, horiz] = P[k];
        c.fillStyle = lit.includes(k) ? on : off;
        const X = cx + px * w, Y = y + py * h;
        c.beginPath();
        if (horiz) { c.moveTo(X + t2 * 0.6, Y); c.lineTo(X + t2 * 1.1, Y - t2 / 2); c.lineTo(X + w - t2 * 1.1, Y - t2 / 2); c.lineTo(X + w - t2 * 0.6, Y); c.lineTo(X + w - t2 * 1.1, Y + t2 / 2); c.lineTo(X + t2 * 1.1, Y + t2 / 2); }
        else { c.moveTo(X, Y + t2 * 0.6); c.lineTo(X + t2 / 2, Y + t2 * 1.1); c.lineTo(X + t2 / 2, Y + h / 2 - t2 * 1.1); c.lineTo(X, Y + h / 2 - t2 * 0.6); c.lineTo(X - t2 / 2, Y + h / 2 - t2 * 1.1); c.lineTo(X - t2 / 2, Y + t2 * 1.1); }
        c.closePath(); c.fill();
      });
      cx += w + t2 * 2.6;
    }
  }
  const fmtRem = r => { const s = Math.floor(r), cs = Math.floor((r - s) * 100); return `00:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`; };

  /* ---- the shots (drawn in a 1600×900 virtual frame) ---- */
  const SHOT = {};
  SHOT.phone = (c, t, v, st) => {
    const rg = SS.ring(t), shake = rg ? Math.sin(t * 160) * 4 : 0;
    if (v === 0) {
      const wg = c.createLinearGradient(0, 0, 0, 600); wg.addColorStop(0, '#0d1a17'); wg.addColorStop(1, '#16271f');
      c.fillStyle = wg; c.fillRect(0, 0, 1600, 900);
      c.fillStyle = '#26140b'; c.fillRect(0, 600, 1600, 300);
      c.strokeStyle = 'rgba(120,70,40,0.25)'; c.lineWidth = 2;
      for (let k = 0; k < 12; k++) { c.beginPath(); c.moveTo(0, 620 + k * 24); c.bezierCurveTo(500, 610 + k * 26, 1000, 640 + k * 22, 1600, 625 + k * 24); c.stroke(); }
      const lp = c.createRadialGradient(560, 520, 0, 700, 560, 900); lp.addColorStop(0, 'rgba(255,200,120,0.38)'); lp.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = lp; c.fillRect(0, 0, 1600, 900);
      c.fillStyle = 'rgba(0,0,0,0.55)'; c.beginPath(); c.ellipse(830, 720, 330, 50, 0, 0, TAU); c.fill();
      c.save(); c.translate(800, 0);
      const bg = c.createLinearGradient(-260, 0, 260, 0); bg.addColorStop(0, '#5a0507'); bg.addColorStop(0.35, '#d4232a'); bg.addColorStop(0.6, '#a5121a'); bg.addColorStop(1, '#3a0204');
      c.fillStyle = bg; c.beginPath(); c.moveTo(-270, 715); c.lineTo(270, 715); c.quadraticCurveTo(250, 520, 180, 430); c.lineTo(-180, 430); c.quadraticCurveTo(-250, 520, -270, 715); c.fill();
      c.fillStyle = 'rgba(255,220,220,0.25)'; c.beginPath(); c.ellipse(-120, 520, 30, 90, -0.3, 0, TAU); c.fill();
      // dial
      c.fillStyle = '#efe6d2'; c.beginPath(); c.ellipse(0, 600, 135, 92, 0, 0, TAU); c.fill();
      c.fillStyle = '#2a0a0a';
      for (let k = 0; k < 10; k++) { const a = -2.2 + k * 0.42; c.beginPath(); c.ellipse(Math.cos(a) * 98, 600 + Math.sin(a) * 66, 16, 12, 0, 0, TAU); c.fill(); }
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, 600, 46, 31, 0, 0, TAU); c.fill();
      c.fillStyle = '#d4232a'; c.font = `500 20px ${OSW}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TR-7', 0, 601);
      // cradle + handset (shakes when ringing)
      c.fillStyle = '#7a080c'; c.fillRect(-170, 405, 40, 36); c.fillRect(130, 405, 40, 36);
      const hy = rg ? -Math.abs(Math.sin(t * 80)) * 7 : 0;
      for (let g = rg ? 1 : 0; g >= 0; g--) {
        c.save(); c.translate(shake * (g ? -1.6 : 1), hy); c.globalAlpha = g ? 0.3 : 1;
        c.strokeStyle = '#b71820'; c.lineWidth = 58; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-200, 380); c.quadraticCurveTo(0, 330, 200, 380); c.stroke();
        c.fillStyle = '#c21d24';
        c.beginPath(); c.ellipse(-215, 395, 70, 52, 0.2, 0, TAU); c.fill(); c.beginPath(); c.ellipse(215, 395, 70, 52, -0.2, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(255,200,200,0.4)'; c.lineWidth = 8; c.beginPath(); c.moveTo(-150, 360); c.quadraticCurveTo(0, 320, 150, 360); c.stroke();
        c.restore();
      }
      // coiled cord
      c.strokeStyle = '#8a0a10'; c.lineWidth = 6; c.beginPath();
      for (let k = 0; k <= 80; k++) { const u = k / 80, x = -270 - 60 * Math.sin(u * Math.PI) + Math.cos(u * 60) * 12, y = 420 + u * 280 + Math.sin(u * 60) * 10; k ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
      c.restore();
    } else {
      c.fillStyle = '#9c0f16'; c.fillRect(0, 0, 1600, 900);
      const sh = c.createRadialGradient(600, 300, 0, 800, 450, 1000); sh.addColorStop(0, 'rgba(255,160,150,0.35)'); sh.addColorStop(1, 'rgba(30,0,0,0.6)');
      c.fillStyle = sh; c.fillRect(0, 0, 1600, 900);
      c.fillStyle = '#efe6d2'; c.beginPath(); c.arc(800, 450, 380, 0, TAU); c.fill();
      c.fillStyle = '#1a0606'; c.font = `500 52px ${OSW}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let k = 0; k < 10; k++) { const a = -2.4 + k * 0.5; c.fillText(String((k + 1) % 10), 800 + Math.cos(a) * 290, 450 + Math.sin(a) * 290); }
      // the finger wheel winds back after each digit
      const cyc = ((t + 0.3) % 1.5) / 1.5, wind = cyc < 0.4 ? E.ioC(cyc / 0.4) : 1 - E.outC((cyc - 0.4) / 0.6);
      const dig = Math.floor((t + 0.3) / 1.5) % 10;
      c.save(); c.translate(800, 450); c.rotate(wind * (0.9 + dig * 0.35));
      c.fillStyle = 'rgba(30,30,34,0.92)'; c.beginPath(); c.arc(0, 0, 360, 0, TAU);
      for (let k = 0; k < 10; k++) { const a = -2.4 + k * 0.5; c.moveTo(Math.cos(a) * 290 + 62, Math.sin(a) * 290); c.arc(Math.cos(a) * 290, Math.sin(a) * 290, 62, 0, TAU, true); }
      c.fill('evenodd');
      c.restore();
      c.fillStyle = '#efe6d2'; c.beginPath(); c.arc(800, 450, 150, 0, TAU); c.fill();
      c.fillStyle = '#1a0606'; c.font = `400 34px ${MONO}`; c.fillText('KLONDIKE 5', 800, 440); c.font = `400 24px ${MONO}`; c.fillText('- 0168 -', 800, 488);
      c.fillStyle = '#c8c8c8'; c.beginPath(); c.moveTo(1120, 640); c.lineTo(1180, 600); c.lineTo(1200, 630); c.closePath(); c.fill();
    }
  };
  SHOT.clock = (c, t, v, st) => {
    const rem = SS.rem(t);
    const secTick = Math.ceil(rem - 1e-6), frac = Math.ceil(rem - 1e-6) - rem;
    const bounce = Math.exp(-(1 - frac) * 30) * Math.sin((1 - frac) * 60) * 0.03;
    if (v === 0) {
      c.fillStyle = '#16120f'; c.fillRect(0, 0, 1600, 900);
      const lg = c.createLinearGradient(0, 0, 1600, 900); lg.addColorStop(0, 'rgba(255,190,120,0.2)'); lg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = lg; c.fillRect(0, 0, 1600, 900);
      c.fillStyle = 'rgba(0,0,0,0.6)'; c.beginPath(); c.arc(830, 480, 410, 0, TAU); c.fill();
      c.fillStyle = '#3a2416'; c.beginPath(); c.arc(800, 450, 410, 0, TAU); c.fill();
      const fg = c.createRadialGradient(700, 330, 0, 800, 450, 380); fg.addColorStop(0, '#f6eedc'); fg.addColorStop(1, '#d6c8a8');
      c.fillStyle = fg; c.beginPath(); c.arc(800, 450, 375, 0, TAU); c.fill();
      c.fillStyle = '#1a140e'; c.font = `400 78px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let k = 1; k <= 12; k++) { const a = k / 12 * TAU - Math.PI / 2; c.fillText(String(k), 800 + Math.cos(a) * 300, 455 + Math.sin(a) * 300); }
      for (let k = 0; k < 60; k++) { c.save(); c.translate(800, 450); c.rotate(k / 60 * TAU); c.fillRect(-1.5, -362, 3, k % 5 ? 12 : 22); c.restore(); }
      const sa = -secTick / 60 * TAU + bounce, ma = rem > 0 ? -(rem / 3600) * TAU - TAU / 60 * (rem > 0 ? 1 : 0) * 0 - TAU / 60 : 0, ha = -(rem / 43200) * TAU - TAU / 720;
      const hand = (a, len, w) => { c.save(); c.translate(800, 450); c.rotate(a); c.beginPath(); c.moveTo(-w, 30); c.lineTo(-w * 0.5, -len); c.lineTo(0, -len - 20); c.lineTo(w * 0.5, -len); c.lineTo(w, 30); c.closePath(); c.fill(); c.restore(); };
      c.fillStyle = '#120c08'; hand(rem > 0 ? ha : 0, 190, 14); hand(rem > 0 ? ma : 0, 290, 10);
      c.save(); c.translate(800, 450); c.rotate(sa); c.fillStyle = '#c0201a'; c.fillRect(-3, -330, 6, 400); c.restore();
      c.fillStyle = '#120c08'; c.beginPath(); c.arc(800, 450, 16, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.ellipse(680, 300, 260, 110, -0.6, 0, TAU); c.fill();
    } else {
      c.fillStyle = '#0c0f14'; c.fillRect(0, 0, 1600, 900);
      c.fillStyle = '#1c2230'; c.fillRect(0, 0, 1600, 900);
      c.fillStyle = 'rgba(255,255,255,0.05)'; for (let k = 0; k < 30; k++) c.fillRect(0, k * 30, 1600, 2);
      c.fillStyle = '#2a1a10'; c.fillRect(640, 0, 320, 900);
      c.strokeStyle = 'rgba(255,200,150,0.18)'; c.lineWidth = 2; for (let y = 20; y < 900; y += 24) { c.beginPath(); c.moveTo(650, y); c.lineTo(950, y); c.stroke(); }
      const cg = c.createLinearGradient(500, 200, 1100, 700); cg.addColorStop(0, '#f0f0f0'); cg.addColorStop(0.5, '#7a7e86'); cg.addColorStop(1, '#d8dade');
      c.fillStyle = cg; c.beginPath(); c.arc(800, 450, 300, 0, TAU); c.fill();
      c.fillStyle = '#0b0d10'; c.beginPath(); c.arc(800, 450, 262, 0, TAU); c.fill();
      c.fillStyle = '#d8f0d0';
      for (let k = 0; k < 12; k++) { c.save(); c.translate(800, 450); c.rotate(k / 12 * TAU); c.fillRect(-8, -245, 16, k % 3 ? 40 : 60); c.restore(); }
      const hand = (a, len, w, col) => { c.save(); c.translate(800, 450); c.rotate(a); c.fillStyle = col; c.fillRect(-w / 2, -len, w, len + 30); c.restore(); };
      hand(rem > 0 ? -(rem / 43200) * TAU - TAU / 720 : 0, 150, 18, '#d8f0d0');
      hand(rem > 0 ? -TAU / 60 - (rem / 3600) * TAU : 0, 220, 12, '#d8f0d0');
      hand(-rem / 60 * TAU, 240, 4, '#ff5a1a');
      c.fillStyle = '#ff5a1a'; c.beginPath(); c.arc(800, 450, 12, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.beginPath(); c.ellipse(720, 350, 180, 70, -0.6, 0, TAU); c.fill();
    }
  };
  SHOT.car = (c, t, v, st) => {
    const rem = SS.rem(t);
    if (v === 0) {
      c.fillStyle = '#04060b'; c.fillRect(0, 0, 1600, 900);
      const VPx = 800, VPy = 420;
      c.fillStyle = '#0b0e14'; c.beginPath(); c.moveTo(-400, 900); c.lineTo(VPx - 10, VPy); c.lineTo(VPx + 10, VPy); c.lineTo(2000, 900); c.fill();
      // dashes rushing at camera
      c.fillStyle = 'rgba(230,220,180,0.7)';
      for (let k = 0; k < 14; k++) {
        const z = ((k * 0.6 - t * 3.2) % 8.4 + 8.4) % 8.4 + 0.3, z2 = z + 0.25;
        const y1 = VPy + 480 / z, y2 = VPy + 480 / z2, w1 = 14 / z, w2 = 14 / z2;
        if (y1 > 900) continue;
        c.beginPath(); c.moveTo(VPx - w1, y1); c.lineTo(VPx + w1, y1); c.lineTo(VPx + w2, y2); c.lineTo(VPx - w2, y2); c.fill();
      }
      // roadside poles
      c.fillStyle = '#1a1e26';
      for (let k = 0; k < 6; k++) { const z = ((k * 1.4 - t * 3.2) % 8.4 + 8.4) % 8.4 + 0.3; const x = VPx - 1300 / z, y = VPy + 480 / z; c.fillRect(x - 10 / z, y - 900 / z, 20 / z, 900 / z); }
      // approaching headlights
      const z = 0.6 + rem * 1.1;
      c.save(); c.globalCompositeOperation = 'lighter';
      [-1, 1].forEach(sd => {
        const x = VPx + sd * 260 / z + 120 / z, y = VPy + 150 / z, rr = 30 + 700 / z;
        const g = c.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(0.1, 'rgba(255,240,200,0.7)'); g.addColorStop(1, 'rgba(255,220,160,0)');
        c.fillStyle = g; c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
        const rf = c.createLinearGradient(0, y, 0, 900); rf.addColorStop(0, 'rgba(255,230,180,0.5)'); rf.addColorStop(1, 'rgba(255,230,180,0)');
        c.fillStyle = rf; c.fillRect(x - 18 - 30 / z, y, 36 + 60 / z, 900 - y);
      });
      const fl = c.createLinearGradient(0, 0, 1600, 0); fl.addColorStop(0, 'rgba(80,140,255,0)'); fl.addColorStop(0.5, `rgba(120,170,255,${clamp(0.9 / z)})`); fl.addColorStop(1, 'rgba(80,140,255,0)');
      c.fillStyle = fl; c.fillRect(0, VPy + 150 / z - 3, 1600, 6);
      c.restore();
    } else {
      c.fillStyle = '#07070a'; c.fillRect(0, 0, 1600, 900);
      const spd = lerp(40, 148, sstep(1, 8.5, t)) + Math.sin(t * 13) * 1.5;
      const amb = c.createRadialGradient(800, 470, 0, 800, 470, 520); amb.addColorStop(0, 'rgba(255,150,40,0.25)'); amb.addColorStop(1, 'rgba(255,150,40,0)');
      c.fillStyle = amb; c.fillRect(0, 0, 1600, 900);
      c.strokeStyle = '#ffb040'; c.fillStyle = '#ffb040'; c.lineWidth = 4;
      c.beginPath(); c.arc(800, 500, 360, Math.PI * 0.75, Math.PI * 2.25); c.stroke();
      c.font = `500 40px ${OSW}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let k = 0; k <= 16; k++) { const a = Math.PI * 0.75 + k / 16 * Math.PI * 1.5; c.save(); c.translate(800, 500); c.rotate(a); c.fillRect(310, -2, k % 2 ? 22 : 44, k % 2 ? 3 : 6); c.restore(); if (k % 2 === 0) c.fillText(String(k * 10), 800 + Math.cos(a) * 250, 500 + Math.sin(a) * 250); }
      const na = Math.PI * 0.75 + spd / 160 * Math.PI * 1.5;
      c.save(); c.translate(800, 500); c.rotate(na); c.fillStyle = '#ff3a1a'; c.beginPath(); c.moveTo(-30, -8); c.lineTo(330, -2); c.lineTo(330, 2); c.lineTo(-30, 8); c.fill(); c.restore();
      c.fillStyle = '#1a1a1e'; c.beginPath(); c.arc(800, 500, 40, 0, TAU); c.fill();
      c.fillStyle = '#ffb040'; c.font = `400 30px ${MONO}`; c.fillText(`${Math.round(spd)} MPH`, 800, 680);
    }
  };
  SHOT.timer = (c, t, v, st) => {
    c.fillStyle = '#060404'; c.fillRect(0, 0, 1600, 900);
    const rem = SS.rem(t);
    const s = fmtRem(rem);
    const urgent = rem < 3 && Math.floor(t * 4) % 2 === 0;
    c.save(); c.globalAlpha = 0.35; c.filter = 'blur(14px)'; seg7(c, s, 150, 330, 240, '#ff2a14', 'rgba(0,0,0,0)'); c.restore();
    seg7(c, s, 150, 330, 240, urgent ? '#ff6a4a' : '#ff2a14', '#1c0705');
    c.fillStyle = '#ff2a14'; c.font = `400 34px ${MONO}`; c.textAlign = 'right'; c.textBaseline = 'alphabetic';
    if ('letterSpacing' in c) c.letterSpacing = '10px';
    c.fillText('SEC', 1450, 650);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
  };
  SHOT.feet = (c, t, v, st) => {
    const pace = 2.4 + 1.2 * sstep(4, 8.5, t), ph = t * pace * TAU * 0.5 * 2;
    const travel = t * 1500 * (pace / 2.4);
    if (v === 0) {
      c.fillStyle = '#1a1f26'; c.fillRect(0, 0, 1600, 900);
      // wall panels streaming past
      for (let k = 0; k < 8; k++) { const x = ((k * 400 - travel * 0.8) % 3200 + 3200) % 3200 - 400; c.fillStyle = k % 3 === 0 ? '#3a2a20' : '#232a33'; c.fillRect(x, 0, 380, 640); if (k % 3 === 0) { c.fillStyle = '#c8b090'; c.fillRect(x + 60, 120, 200, 280); c.fillStyle = '#c0201a'; c.fillRect(x + 60, 120, 200, 60); } }
      c.fillStyle = 'rgba(255,255,255,0.06)';
      for (let k = 0; k < 20; k++) c.fillRect(((hash(k) * 1600 - travel * 2) % 1600 + 1600) % 1600, hash(k + 3) * 640, 300, 2);
      c.fillStyle = '#0d1014'; c.fillRect(0, 640, 1600, 260);
      c.fillStyle = 'rgba(120,150,190,0.14)'; for (let k = 0; k < 6; k++) { const x = ((k * 330 - travel) % 1980 + 1980) % 1980 - 200; c.fillRect(x, 700 + k % 3 * 40, 160, 6); }
      // reflection
      c.save(); c.translate(0, 1452); c.scale(1, -1); c.globalAlpha = 0.25; ssRunner(c, 760, 70, 1.25, ph, '#05070a', false); c.restore();
      ssRunner(c, 760, 70, 1.25, ph, '#090b10', false);
      // splashes on footfall
      [ph, ph + Math.PI].forEach((p, i) => {
        const contact = Math.sin(p - 1.4);
        if (contact < -0.85) { const [, a] = ssLeg(760, 70, p, 1.25); for (let k = 0; k < 7; k++) { const an = -Math.PI / 2 + (k - 3) * 0.35, d = 30 + hash(k + i * 9 + Math.floor(t * 6)) * 50; c.fillStyle = 'rgba(180,200,230,0.6)'; c.beginPath(); c.arc(a[0] + Math.cos(an) * d, 640 + Math.sin(an) * d * 0.6, 4, 0, TAU); c.fill(); } }
      });
    } else {
      c.fillStyle = '#5a2a12'; c.fillRect(0, 0, 1600, 900);
      for (let row = 0; row < 18; row++) for (let k = 0; k < 14; k++) { const x = k * 120 + (row % 2) * 60, y = row * 50; c.fillStyle = `rgb(${150 + st.bricks[(row * 14 + k) % 260] * 50},${70 + st.bricks[(row * 14 + k) % 260] * 25},${30})`; c.fillRect(x + 3, y + 3, 114, 44); }
      const sl = c.createRadialGradient(1300, 200, 0, 1300, 200, 1400); sl.addColorStop(0, 'rgba(255,170,70,0.35)'); sl.addColorStop(1, 'rgba(20,5,0,0.65)');
      c.fillStyle = sl; c.fillRect(0, 0, 1600, 900);
      const x = lerp(-250, 1150, seg(t, 4.8, 8.6));
      c.save(); c.transform(1, 0, -0.45, 1, 0, 0); c.globalAlpha = 0.78;
      ssRunner(c, x + 450, 560, 0.95, ph, '#120604', true);
      c.restore();
    }
  };
  SHOT.door = (c, t, v, st) => {
    const VPx = 800, VPy = 430;
    c.fillStyle = '#0c120f'; c.fillRect(0, 0, 1600, 900);
    const fx0 = 700, fx1 = 900, fy0 = 290, fy1 = 600;
    c.fillStyle = '#18221d'; c.beginPath(); c.moveTo(0, 0); c.lineTo(fx0, fy0); c.lineTo(fx0, fy1); c.lineTo(0, 900); c.fill();
    c.fillStyle = '#141c18'; c.beginPath(); c.moveTo(1600, 0); c.lineTo(fx1, fy0); c.lineTo(fx1, fy1); c.lineTo(1600, 900); c.fill();
    c.fillStyle = '#0e1411'; c.beginPath(); c.moveTo(0, 0); c.lineTo(1600, 0); c.lineTo(fx1, fy0); c.lineTo(fx0, fy0); c.fill();
    c.fillStyle = '#1e2520'; c.beginPath(); c.moveTo(0, 900); c.lineTo(1600, 900); c.lineTo(fx1, fy1); c.lineTo(fx0, fy1); c.fill();
    // ceiling fluorescents, one flickering
    for (let k = 0; k < 4; k++) {
      const z = 1 + k * 0.9, x0 = VPx - 120 / z, x1 = VPx + 120 / z, y = VPy - 420 / z * 0.95;
      const on = k === 1 ? (hash(Math.floor(t * 14)) > 0.3 ? 1 : 0.15) : 1;
      c.fillStyle = `rgba(210,255,230,${0.85 * on})`; c.fillRect(x0, y, x1 - x0, 12 / z);
      const g = c.createRadialGradient(VPx, y, 0, VPx, y, 500 / z); g.addColorStop(0, `rgba(160,220,190,${0.18 * on})`); g.addColorStop(1, 'rgba(160,220,190,0)');
      c.fillStyle = g; c.fillRect(VPx - 500 / z, y - 500 / z, 1000 / z, 1000 / z);
    }
    const open = 0.04 + 1.35 * E.ioS(sstep(3.2, 8.5, t));
    c.fillStyle = '#fff4dc'; c.fillRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
    const ex = fx1 - (fx1 - fx0) * (1 - Math.cos(open));
    // light wedge on floor
    const wg = c.createLinearGradient(0, fy1, 0, 900); wg.addColorStop(0, 'rgba(255,240,210,0.55)'); wg.addColorStop(1, 'rgba(255,240,210,0)');
    c.fillStyle = wg; c.beginPath(); c.moveTo(ex, fy1); c.lineTo(fx1, fy1); c.lineTo(fx1 + (fx1 - VPx) * 2.4, 900); c.lineTo(ex + (ex - VPx) * 2.4, 900); c.fill();
    // door leaf hinged on the left, swinging away
    c.fillStyle = '#3a2a1c';
    c.beginPath(); c.moveTo(fx0, fy0); c.lineTo(fx0 + (ex - fx0) * 1, fy0 + 26 * Math.sin(open)); c.lineTo(fx0 + (ex - fx0), fy1 - 26 * Math.sin(open)); c.lineTo(fx0, fy1); c.fill();
    c.fillStyle = '#c8a050'; c.beginPath(); c.arc(fx0 + (ex - fx0) * 0.88, (fy0 + fy1) / 2, 6, 0, TAU); c.fill();
    c.strokeStyle = '#090c0a'; c.lineWidth = 10; c.strokeRect(fx0, fy0, fx1 - fx0, fy1 - fy0);
  };
  SHOT.eyes = (c, t, v, st) => {
    c.fillStyle = '#2a120c'; c.fillRect(0, 0, 1600, 900);
    const sk = c.createLinearGradient(0, 0, 1600, 0); sk.addColorStop(0, '#5a2016'); sk.addColorStop(0.5, '#8a3a26'); sk.addColorStop(1, '#2a0c08');
    c.fillStyle = sk; c.fillRect(0, 200, 1600, 500);
    c.fillStyle = '#000'; c.fillRect(0, 0, 1600, 200); c.fillRect(0, 700, 1600, 200);
    const beat = Math.floor(t * 2), dart = [0, -1, 1, -0.6, 0.8, -1, 0.3, 1, -0.8, 0, 1, -1, 0.6, -0.4, 1, -1, 0, 0][beat % 18];
    const prev = [0, -1, 1, -0.6, 0.8, -1, 0.3, 1, -0.8, 0, 1, -1, 0.6, -0.4, 1, -1, 0, 0][(beat + 17) % 18];
    const look = lerp(prev, dart, E.outQt(clamp((t * 2 - beat) / 0.12)));
    const blink = Math.max(1 - Math.abs(t - 6.25) / 0.08, 1 - Math.abs(t - 3.1) / 0.08, 0);
    [520, 1080].forEach(ex => {
      const ey = 460;
      c.save(); c.beginPath(); c.moveTo(ex - 190, ey); c.quadraticCurveTo(ex, ey - 150 * (1 - blink), ex + 190, ey); c.quadraticCurveTo(ex, ey + 110 * (1 - blink), ex - 190, ey); c.clip();
      c.fillStyle = '#e8d6c8'; c.fillRect(ex - 200, ey - 160, 400, 320);
      const ix = ex + look * 80;
      c.fillStyle = '#3a2010'; c.beginPath(); c.arc(ix, ey, 72, 0, TAU); c.fill();
      c.fillStyle = '#050302'; c.beginPath(); c.arc(ix, ey, 30, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(ix - 22, ey - 24, 10, 0, TAU); c.fill();
      c.fillStyle = 'rgba(40,10,6,0.45)'; c.fillRect(ex - 200, ey - 160, 400, 70);
      c.restore();
      c.strokeStyle = '#1a0804'; c.lineWidth = 8; c.beginPath(); c.moveTo(ex - 190, ey); c.quadraticCurveTo(ex, ey - 150 * (1 - blink), ex + 190, ey); c.stroke();
      c.fillStyle = '#1a0804'; c.beginPath(); c.moveTo(ex - 220, ey - 150); c.quadraticCurveTo(ex, ey - 230 + (ex < 800 ? 20 : -10), ex + 220, ey - 170 + (ex < 800 ? 30 : 0)); c.lineTo(ex + 220, ey - 150 + (ex < 800 ? 30 : 0)); c.quadraticCurveTo(ex, ey - 200, ex - 220, ey - 130); c.fill();
    });
    // sweat bead sliding down the temple
    const sy = 300 + ((t * 60) % 300);
    c.fillStyle = 'rgba(255,220,200,0.55)'; c.beginPath(); c.ellipse(1400, sy, 10, 14, 0, 0, TAU); c.fill();
  };
  SHOT.radar = (c, t, v, st) => {
    c.fillStyle = '#03121a'; c.fillRect(0, 0, 1600, 900);
    c.strokeStyle = 'rgba(60,200,220,0.22)'; c.lineWidth = 3;
    st.grid.forEach(([u, vert, w]) => { c.lineWidth = 2 + w * 6; c.beginPath(); if (vert) { c.moveTo(u * 1600, 0); c.lineTo(u * 1600 + 60, 900); } else { c.moveTo(0, u * 900); c.lineTo(1600, u * 900 - 40); } c.stroke(); });
    c.strokeStyle = 'rgba(40,120,200,0.35)'; c.lineWidth = 40; c.beginPath(); c.moveTo(0, 720); c.bezierCurveTo(500, 600, 900, 860, 1600, 640); c.stroke();
    const p = sstep(1.0, 8.5, t);
    const path = [[1600, 120], [1180, 120], [1180, 380], [960, 380], [960, 450], [800, 450]];
    const along = (pts, u) => { const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; } let s = u * tot; for (let i = 1; i < pts.length; i++) { if (s <= L[i - 1]) { const k = s / L[i - 1]; return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]; } s -= L[i - 1]; } return pts[pts.length - 1]; };
    const car = along(path, p), run = along([[0, 820], [340, 820], [340, 560], [620, 560], [620, 450], [800, 450]], sstep(2.0, 8.5, t));
    c.setLineDash([8, 10]); c.lineWidth = 4;
    c.strokeStyle = 'rgba(255,60,50,0.6)'; c.beginPath(); c.moveTo(1600, 120); for (let u = 0; u <= p; u += 0.02) { const q = along(path, u); c.lineTo(q[0], q[1]); } c.stroke();
    c.setLineDash([]);
    const sw = t * 2.4;
    if (c.createConicGradient) { const cg = c.createConicGradient(sw - 0.6, 800, 450); cg.addColorStop(0, 'rgba(60,220,200,0)'); cg.addColorStop(0.095, 'rgba(60,220,200,0.28)'); cg.addColorStop(0.1, 'rgba(60,220,200,0)'); cg.addColorStop(1, 'rgba(60,220,200,0)'); c.fillStyle = cg; c.beginPath(); c.arc(800, 450, 700, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(60,220,200,0.3)'; c.lineWidth = 2; [150, 300, 450].forEach(rr => { c.beginPath(); c.arc(800, 450, rr, 0, TAU); c.stroke(); });
    const pulse = 1 + 0.25 * Math.sin(t * 12);
    c.strokeStyle = '#f2f2f2'; c.lineWidth = 4; c.beginPath(); c.arc(800, 450, 34 * pulse, 0, TAU); c.moveTo(740, 450); c.lineTo(860, 450); c.moveTo(800, 390); c.lineTo(800, 510); c.stroke();
    c.fillStyle = '#ff3a2a'; c.beginPath(); c.arc(car[0], car[1], 16, 0, TAU); c.fill();
    c.fillStyle = '#4ab0ff'; c.beginPath(); c.arc(run[0], run[1], 14, 0, TAU); c.fill();
    c.fillStyle = '#7ae0d8'; c.font = `400 34px ${MONO}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.fillText(`TGT ${(Math.hypot(car[0] - 800, car[1] - 450) / 1000).toFixed(2)} KM`, 60, 90);
    c.fillText(`ETA ${fmtRem(SS.rem(t))}`, 60, 140);
  };
  SHOT.cctv = (c, t, v, st) => {
    c.fillStyle = '#5a5e58'; c.fillRect(0, 0, 1600, 900);
    c.fillStyle = '#3a3e3a'; c.beginPath(); c.moveTo(0, 300); c.lineTo(1600, 180); c.lineTo(1600, 560); c.lineTo(0, 700); c.fill();
    c.strokeStyle = 'rgba(220,220,200,0.5)'; c.lineWidth = 6; c.setLineDash([60, 50]); c.beginPath(); c.moveTo(0, 500); c.lineTo(1600, 370); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#7a7e76'; c.fillRect(0, 700, 1600, 200);
    c.fillStyle = '#9a9e96'; c.fillRect(760, 600, 120, 120); c.fillStyle = '#d8dcd0'; c.fillRect(775, 615, 90, 90);
    const p = sstep(2.5, 8.5, t);
    const cx2 = lerp(1700, 980, p), cy2 = lerp(260, 560, p) - (cx2 - 1700) * 0.0;
    c.save(); c.translate(cx2, lerp(300, 520, p)); c.rotate(-0.075); c.fillStyle = '#20221e'; c.fillRect(-120, -55, 240, 110); c.fillStyle = 'rgba(255,255,230,0.75)'; c.beginPath(); c.moveTo(-120, -40); c.lineTo(-420, -110); c.lineTo(-420, 110); c.lineTo(-120, 40); c.fill(); c.restore();
    const fx = lerp(-40, 730, sstep(2.0, 8.5, t)), fy = 760 + Math.sin(t * 18) * 4;
    c.fillStyle = '#121410'; c.beginPath(); c.arc(fx, fy, 26, 0, TAU); c.fill(); c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(fx + 30, fy + 20, 40, 14, 0.3, 0, TAU); c.fill();
    // monochrome grade, scanlines, timestamp
    c.save(); c.globalCompositeOperation = 'saturation'; c.fillStyle = '#000'; c.fillRect(0, 0, 1600, 900); c.restore();
    c.fillStyle = 'rgba(120,255,140,0.08)'; c.fillRect(0, 0, 1600, 900);
    c.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < 900; y += 6) c.fillRect(0, y, 1600, 2);
    c.fillStyle = '#e8f0e0'; c.font = `400 40px ${MONO}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    const secs = Math.min(59, 60 - Math.ceil(SS.rem(t)));
    c.fillText(`CAM 04  23:59:${String(Math.max(0, secs)).padStart(2, '0')}`, 50, 860);
    if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = '#ff3a2a'; c.beginPath(); c.arc(1440, 70, 16, 0, TAU); c.fill(); c.fillStyle = '#e8f0e0'; c.fillText('REC', 1470, 84); }
  };
  SHOT.ecg = (c, t, v, st) => {
    c.fillStyle = '#020806'; c.fillRect(0, 0, 1600, 900);
    c.strokeStyle = 'rgba(60,255,140,0.08)'; c.lineWidth = 2;
    for (let x = 0; x < 1600; x += 80) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 900); c.stroke(); }
    for (let y = 0; y < 900; y += 80) { c.beginPath(); c.moveTo(0, y); c.lineTo(1600, y); c.stroke(); }
    const bpm = lerp(84, 156, sstep(1, 8.5, t));
    const period = 60 / bpm, span = 3.0;
    const wave = tt => { const ph = (((tt % period) + period) % period) / period; if (ph < 0.04) return Math.sin(ph / 0.04 * Math.PI) * 30; if (ph < 0.1) return 0; if (ph < 0.12) return -40; if (ph < 0.15) return 260 * (1 - Math.abs(ph - 0.135) / 0.015); if (ph < 0.17) return -70; if (ph < 0.32) return 0; if (ph < 0.42) return Math.sin((ph - 0.32) / 0.1 * Math.PI) * 50; return 0; };
    const head = (t % span) / span * 1600;
    c.strokeStyle = '#3cff8a'; c.lineWidth = 5; c.lineJoin = 'round';
    c.beginPath();
    for (let x = 0; x <= 1600; x += 4) {
      if (x > head && x < head + 80) { c.stroke(); c.beginPath(); continue; }
      const tt = t - (head - x) / 1600 * span - (x > head ? span : 0);
      const y = 470 - wave(tt);
      x === 0 || (x >= head + 80 && x < head + 84) ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.stroke();
    c.fillStyle = '#3cff8a'; c.font = `300 120px ${MONO}`; c.textAlign = 'right'; c.textBaseline = 'alphabetic';
    c.fillText(String(Math.round(bpm)), 1530, 180);
    c.font = `400 30px ${MONO}`; c.fillText('BPM ♥', 1530, 230);
  };
  SHOT.vault = (c, t, v, st) => {
    const sg = c.createLinearGradient(0, 0, 1600, 900); sg.addColorStop(0, '#5a5e64'); sg.addColorStop(0.5, '#8a8e94'); sg.addColorStop(1, '#3a3e44');
    c.fillStyle = sg; c.fillRect(0, 0, 1600, 900);
    c.strokeStyle = 'rgba(255,255,255,0.05)'; c.lineWidth = 1; for (let y = 0; y < 900; y += 3) { c.beginPath(); c.moveTo(0, y); c.lineTo(1600, y + Math.sin(y) * 2); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.arc(820, 470, 340, 0, TAU); c.fill();
    const rg = c.createRadialGradient(700, 330, 0, 800, 450, 340); rg.addColorStop(0, '#d0c8b0'); rg.addColorStop(1, '#6a604a');
    c.fillStyle = rg; c.beginPath(); c.arc(800, 450, 330, 0, TAU); c.fill();
    const ang = kf(t, [[0, 0], [1.2, 2.1], [1.6, 2.1], [2.8, -1.0], [3.3, -1.0], [4.6, 1.6], [5.0, 1.6], [6.0, 0.2], [6.3, 0.2], [7.4, 2.9], [7.7, 2.9], [8.5, 2.2]]);
    c.save(); c.translate(800, 450); c.rotate(ang);
    c.fillStyle = '#121212'; c.beginPath(); c.arc(0, 0, 290, 0, TAU); c.fill();
    c.fillStyle = '#e8e2d0'; c.font = `500 30px ${OSW}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let k = 0; k < 100; k++) { c.save(); c.rotate(k / 100 * TAU); c.fillRect(-1.5, -285, 3, k % 5 ? 14 : 30); if (k % 10 === 0) c.fillText(String(k), 0, -230); c.restore(); }
    const kg = c.createRadialGradient(-30, -30, 0, 0, 0, 150); kg.addColorStop(0, '#5a5a5a'); kg.addColorStop(1, '#141414');
    c.fillStyle = kg; c.beginPath(); c.arc(0, 0, 150, 0, TAU); c.fill();
    for (let k = 0; k < 24; k++) { c.save(); c.rotate(k / 24 * TAU); c.fillStyle = '#2a2a2a'; c.fillRect(-6, -150, 12, 16); c.restore(); }
    c.restore();
    c.fillStyle = '#d42a1e'; c.beginPath(); c.moveTo(800, 128); c.lineTo(782, 96); c.lineTo(818, 96); c.closePath(); c.fill();
  };
  SHOT.booth = (c, t, v, st) => {
    const lightK = sstep(6.0, 8.5, t), arrived = t >= SS.T0;
    c.fillStyle = '#06090d'; c.fillRect(0, 0, 1600, 900);
    // facade
    c.fillStyle = '#0d1219'; c.fillRect(0, 0, 1600, 640);
    st.wins.forEach(([x, y, v2]) => { if (x > 860 && x < 1160) return; c.fillStyle = v2 > 0.8 ? 'rgba(255,190,110,0.5)' : 'rgba(30,44,60,0.6)'; c.fillRect(x, y, 56, 84); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(x, y + 84, 56, 6); });
    c.fillStyle = '#05070a'; c.fillRect(0, 600, 1600, 40);
    // wet street
    const sg = c.createLinearGradient(0, 640, 0, 900); sg.addColorStop(0, '#11161d'); sg.addColorStop(1, '#07090c');
    c.fillStyle = sg; c.fillRect(0, 640, 1600, 260);
    // headlights from the right growing
    c.save(); c.globalCompositeOperation = 'lighter';
    const hx = lerp(2200, 1500, lightK), hk = lightK * lightK;
    const hg = c.createRadialGradient(hx, 640, 0, hx, 640, 1400); hg.addColorStop(0, `rgba(255,245,220,${0.9 * hk})`); hg.addColorStop(0.3, `rgba(255,230,190,${0.25 * hk})`); hg.addColorStop(1, 'rgba(255,230,190,0)');
    c.fillStyle = hg; c.fillRect(0, 0, 1600, 900);
    c.restore();
    // street lamp cone with rain
    c.fillStyle = '#1a1e24'; c.fillRect(296, 120, 10, 520); c.fillRect(296, 120, 80, 10);
    const cone = c.createLinearGradient(0, 130, 0, 640); cone.addColorStop(0, 'rgba(255,200,120,0.35)'); cone.addColorStop(1, 'rgba(255,200,120,0.04)');
    c.fillStyle = cone; c.beginPath(); c.moveTo(356, 130); c.lineTo(390, 130); c.lineTo(560, 640); c.lineTo(180, 640); c.fill();
    c.strokeStyle = 'rgba(200,220,255,0.35)'; c.lineWidth = 2;
    st.rain.forEach(([x, y, l, s]) => { const yy = ((y + t * 1400 * s) % 900); const xx = x - yy * 0.08; c.beginPath(); c.moveTo(xx, yy); c.lineTo(xx - l * 0.08, yy + l); c.stroke(); });
    // booth
    const bx = 900, bw = 230, by = 230, bh = 420;
    const inner = c.createLinearGradient(bx, by, bx + bw, by + bh); inner.addColorStop(0, 'rgba(210,255,240,0.95)'); inner.addColorStop(1, 'rgba(140,200,190,0.85)');
    const glow = c.createRadialGradient(bx + bw / 2, by + bh / 2, 0, bx + bw / 2, by + bh / 2, 520); glow.addColorStop(0, 'rgba(160,255,230,0.3)'); glow.addColorStop(1, 'rgba(160,255,230,0)');
    c.fillStyle = glow; c.fillRect(bx - 520, by - 300, bw + 1040, bh + 600);
    c.fillStyle = inner; c.fillRect(bx, by, bw, bh);
    c.fillStyle = '#c21d24'; c.fillRect(bx + 140, by + 140, 46, 70);
    const rg = SS.ring(t) && !arrived;
    if (!arrived) { c.fillStyle = '#7a080c'; c.fillRect(bx + 146 + (rg ? Math.sin(t * 160) * 3 : 0), by + 126, 34, 16); }
    else {
      // inside at last: a silhouette against the glass, receiver to the ear
      const sway = Math.sin((t - SS.T0) * 2) * 2;
      c.fillStyle = '#030405'; c.strokeStyle = '#030405'; c.lineCap = 'round';
      c.lineWidth = 30; c.beginPath(); c.moveTo(bx + 100, by + bh - 16); c.lineTo(bx + 104, by + 280); c.moveTo(bx + 130, by + bh - 16); c.lineTo(bx + 124, by + 280); c.stroke();
      c.lineWidth = 58; c.beginPath(); c.moveTo(bx + 114, by + 280); c.lineTo(bx + 118 + sway, by + 160); c.stroke();
      c.beginPath(); c.arc(bx + 124 + sway, by + 108, 26, 0, TAU); c.fill();
      c.lineWidth = 18; c.beginPath(); c.moveTo(bx + 136 + sway, by + 150); c.lineTo(bx + 170, by + 160); c.lineTo(bx + 148 + sway, by + 112); c.stroke();
      c.fillStyle = '#7a080c'; c.fillRect(bx + 140 + sway, by + 92, 14, 40);
      c.strokeStyle = '#2a0204'; c.lineWidth = 3; c.beginPath(); c.moveTo(bx + 147 + sway, by + 132); c.quadraticCurveTo(bx + 175, by + 200, bx + 163, by + 210); c.stroke();
    }
    c.strokeStyle = '#1c2026'; c.lineWidth = 14; c.strokeRect(bx, by, bw, bh);
    c.lineWidth = 6; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(bx, by + k * bh / 4); c.lineTo(bx + bw, by + k * bh / 4); c.stroke(); }
    c.fillStyle = '#1c2026'; c.fillRect(bx - 10, by - 40, bw + 20, 44);
    c.fillStyle = 'rgba(230,255,250,0.9)'; c.font = `500 26px ${OSW}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = '8px';
    c.fillText('TELEPHONE', bx + bw / 2 + 4, by - 18);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    // reflection on the wet street
    const rf = c.createLinearGradient(0, 650, 0, 900); rf.addColorStop(0, 'rgba(170,255,230,0.35)'); rf.addColorStop(1, 'rgba(170,255,230,0)');
    c.fillStyle = rf; c.fillRect(bx + 10, 650, bw - 20, 250);
    // the runner converging on the door
    const px = lerp(-140, 820, sstep(2.0, SS.T0, t)), run = t < SS.T0;
    const ph = t * 3.4 * TAU * 0.5;
    if (run) { c.save(); c.translate(px, 480); ssRunner(c, 0, 0, 0.36, ph, '#030405', true); c.restore(); }
  };

  function ssDraw(c, t, W, H, st) {
    const Lay = SS.layout(t);
    const kick = decay(t, SS.KEYS[Lay.k][0], 6) * (Lay.k > 0 ? 1 : 0);
    let g = 10 + 22 * kick + 6 * sstep(6.9, 7.1, t);
    g *= 1 - sstep(8.3, 8.5, t);
    // gutter colour flashes red on each split
    const flash = decay(t, SS.KEYS[Lay.k][0], 14) * (Lay.k > 0 && Lay.k < SS.KEYS.length - 1 ? 1 : 0);
    c.fillStyle = flash > 0.02 ? `rgb(${lerp(6, 232, flash) | 0},${lerp(6, 50, flash) | 0},${lerp(6, 40, flash) | 0})` : '#060606';
    c.fillRect(0, 0, W, H);
    const m = g / 2;
    const X = u => m + u * (W - 2 * m), Y = u => m + u * (H - 2 * m);
    for (let j = 0; j < 4; j++) {
      const y0 = Y(Lay.ry[j]) + g / 2, y1 = Y(Lay.ry[j + 1]) - g / 2;
      if (y1 - y0 < 2) continue;
      for (let i = 0; i < 4; i++) {
        const x0 = X(Lay.cx[j][i]) + g / 2, x1 = X(Lay.cx[j][i + 1]) - g / 2;
        if (x1 - x0 < 2) continue;
        const slot = SS.SLOT[`${i},${j}`];
        const pw = x1 - x0, ph = y1 - y0;
        c.save();
        c.beginPath(); c.rect(x0, y0, pw, ph); c.clip();
        c.translate(x0 + pw / 2, y0 + ph / 2);
        const s = Math.max(pw / SS.VW, ph / SS.VH);
        c.scale(s, s);
        // handheld micro drift per panel
        c.translate(-SS.VW / 2 + Math.sin(t * 1.3 + i * 2 + j) * 6, -SS.VH / 2 + Math.cos(t * 1.1 + i + j * 3) * 5);
        SHOT[slot[0]](c, t, slot[1], st);
        c.restore();
        // panel chrome
        if (pw > 150 && ph > 90 && t < SS.T0) {
          c.save();
          c.strokeStyle = 'rgba(255,255,255,0.1)'; c.lineWidth = 1; c.strokeRect(x0 + 0.5, y0 + 0.5, pw - 1, ph - 1);
          const fs = clamp(Math.min(pw, ph) * 0.05, 11, 17);
          c.font = `400 ${fs}px ${MONO}`; c.textAlign = 'left'; c.textBaseline = 'top';
          if ('letterSpacing' in c) c.letterSpacing = '2px';
          c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(x0 + 10, y0 + 10, c.measureText(slot[2]).width + 16, fs + 10);
          c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillText(slot[2], x0 + 18, y0 + 15);
          if ('letterSpacing' in c) c.letterSpacing = '0px';
          c.restore();
        }
      }
    }
    // zero: white-out from the arriving headlights, then the frame settles
    const wo = decay(t, SS.T0, 3.2) * (t >= SS.T0 ? 1 : 0);
    if (wo > 0.01) { c.fillStyle = `rgba(255,250,236,${wo})`; c.fillRect(0, 0, W, H); }
    vignette(c, W, H, 0.45);
    grain(c, W, H, t, 0.07);
    // title
    const ta = sstep(8.95, 9.35, t);
    if (ta > 0) {
      c.save();
      const tg = c.createLinearGradient(0, 0, W, 0); tg.addColorStop(0, `rgba(0,0,0,${0.75 * ta})`); tg.addColorStop(0.6, `rgba(0,0,0,${0.3 * ta})`); tg.addColorStop(1, `rgba(0,0,0,${0.1 * ta})`); c.fillStyle = tg; c.fillRect(0, 0, W, H);
      // the title arrives as two halves of a split, sliding in from opposite edges
      c.font = `700 150px ${OSW}`; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      if ('letterSpacing' in c) c.letterSpacing = '20px';
      c.globalAlpha = ta;
      const u1 = E.outQn(seg(t, 8.95, 9.5)), u2 = E.outQn(seg(t, 9.05, 9.6));
      c.save(); c.beginPath(); c.rect(0, 330, W, 170); c.clip(); c.fillStyle = '#f4f1ea'; c.fillText('SPLIT', lerp(-700, 150, u1), 480); c.restore();
      c.save(); c.beginPath(); c.rect(0, 500, W, 170); c.clip(); c.fillStyle = '#f4f1ea'; c.fillText('SCREEN', lerp(W + 100, 150, u2), 650); c.restore();
      c.fillStyle = '#e8322a'; c.fillRect(150, 496, 860 * E.outQn(seg(t, 9.1, 9.6)), 5);
      if ('letterSpacing' in c) c.letterSpacing = '0px';
      c.globalAlpha = sstep(9.3, 9.6, t);
      seg7(c, '00:00.00', 160, 700, 46, '#ff2a14', 'rgba(60,10,8,0.6)');
      c.restore();
    }
  }

  function ssScore(A) {
    A.bus.gain.value = 0.66;
    const T0 = SS.T0;
    // ticking clock throughout the countdown
    for (let k = 0; k * 0.5 < T0 - 0.01; k++) {
      const t = k * 0.5, tick = k % 2 === 0;
      A.noise(t, { type: 'bandpass', f: tick ? 4200 : 2900, q: 6, dur: 0.035, g: 0.3 + 0.15 * (t / T0), pan: tick ? -0.2 : 0.2 });
      A.osc(t, { f: tick ? 1800 : 1350, dur: 0.025, g: 0.07 });
    }
    // double-time ticks in the final squeeze
    for (let t = 7.0 + 0.25; t < T0; t += 0.5) A.noise(t, { type: 'bandpass', f: 3500, q: 8, dur: 0.02, g: 0.1 });
    // phone bell: a clapper striking two gongs ~20 times a second
    SS.RINGS.forEach(([a, b]) => {
      for (let t = a; t < b; t += 0.05) {
        const odd = Math.round((t - a) / 0.05) % 2;
        A.osc(t, { f: odd ? 1180 : 1410, dur: 0.09, g: 0.15, type: 'triangle', pan: odd ? -0.15 : 0.15 });
        A.osc(t, { f: (odd ? 1180 : 1410) * 2.76, dur: 0.05, g: 0.04 });
        A.noise(t, { type: 'bandpass', f: 2600, q: 5, dur: 0.03, g: 0.05 });
      }
    });
    // low ostinato (Schifrin-like 8ths), entering at the first split
    const pat = [45, 45, 52, 45, 48, 45, 50, 47];
    for (let k = 0; k * 0.25 < T0 - 1.0 - 0.01; k++) {
      const t = 1.0 + k * 0.25, m = pat[k % 8] - 12 + (t >= 5 ? 1 : 0) * 0;
      const intensity = sstep(1, T0, t);
      A.osc(t, { type: 'sawtooth', f: midi(m), dur: 0.2, g: 0.13 + 0.05 * intensity, lp: 520 + 1800 * intensity, a: 0.004 });
      A.osc(t, { type: 'sine', f: midi(m), dur: 0.2, g: 0.1, a: 0.004 });
      if (t >= 3.5) A.osc(t, { type: 'square', f: midi(m + 12), dur: 0.08, g: 0.02 + 0.015 * intensity, lp: 1800 });
    }
    // string tremolo cluster creeping upward
    const cl = [[2.0, [57, 58]], [3.5, [57, 60, 61]], [5.0, [58, 61, 62, 64]], [7.0, [60, 63, 64, 67]]];
    cl.forEach(([t0, notes], i) => {
      const t1 = i < cl.length - 1 ? cl[i + 1][0] : T0;
      for (let t = t0; t < t1 - 0.01; t += 0.0625) notes.forEach((m, j) => A.osc(t, { type: 'sawtooth', f: midi(m + 12), dur: 0.07, g: 0.012 + 0.008 * (t / T0), lp: 2600, pan: (j / (notes.length - 1 || 1) - 0.5) * 0.8 }));
    });
    // each split slams
    SS.KEYS.forEach(([t], i) => {
      if (i === 0 || t > 8.2) return;
      A.impact(t, i < 5 ? 0.45 : 0.3);
      A.whoosh(t - 0.18, 0.22, { f1: 3000, f2: 400, g: 0.12, swell: 0.7 });
      if (i < 5) A.noise(t, { type: 'highpass', f: 3500, dur: 0.12, g: 0.08 });
    });
    // ECG beeps once the vitals panel is up
    for (let t = 5.0, bpm = 120; t < T0; t += 60 / bpm, bpm += 3.5) A.osc(t, { f: 1046, dur: 0.07, g: 0.025, type: 'sine', pan: 0.5 });
    A.riser(6.6, T0 - 6.6, { g: 0.22, f: 70 });
    // zero: hit, then the ring is gone; handset lifted; silence and a single tone under the title
    A.impact(T0, 1.0, { rev: 0.7 });
    A.noise(T0, { type: 'lowpass', f: 6000, f2: 300, dur: 1.2, g: 0.2, rev: 0.6 });
    A.chord(T0, [33, 40, 45], { type: 'sawtooth', dur: 1.4, g: 0.05, lp: 500, a: 0.01, spread: 8 });
    A.noise(T0 + 0.32, { type: 'bandpass', f: 1800, q: 3, dur: 0.04, g: 0.18 });
    A.osc(T0 + 0.34, { f: 220, f2: 140, dur: 0.06, g: 0.08, type: 'square', lp: 1200 });
    A.kick(8.95, 0.7, { f: 90, f2: 30, dur: 0.9 });
    A.bell(8.96, midi(69), { g: 0.08, dur: 1.4 });
    A.osc(8.95, { type: 'sine', f: midi(33), dur: 1.05, g: 0.12, a: 0.02, hold: true, rel: 0.4 });
  }

  MG.film({
    id: 'splitscreen', dur: 10, poster: 7.2,
    fonts: [['700 150px Oswald', 'SPLIT SCREEN'], ['500 26px Oswald', 'TELEPHONE0123456789'], ['400 17px "JetBrains Mono"', 'LINE1CLOCKUNITBOOTHT-MINUSRUNNERCORRIDORWITNESSTRACKCAM04VITALSVAULTDIALSPEEDSHADOWWATCH'], ['400 78px "Instrument Serif"', '0123456789']],
    meta: {
      family: 'H', name: 'Split-screen Cinema', sub: 'Everything at Once', era: '1968 —',
      origin: 'Split screen divides one frame into simultaneous shots. Abel Gance used multi-screen in Napoléon (1927); designer-director Pablo Ferro\'s multi-panel montages for Norman Jewison\'s The Thomas Crown Affair (1968) made it a thriller grammar, Brian De Palma used it for suspense, the TV series 24 (2001) built its clock-driven identity on it, and Mike Figgis\'s Timecode (2000) told a whole film in four continuous quadrants.',
      works: 'The Thomas Crown Affair (Norman Jewison, montage by Pablo Ferro, 1968) · Grand Prix (John Frankenheimer, titles by Saul Bass, 1966) · Carrie (Brian De Palma, 1976) · Timecode (Mike Figgis, 2000) · 24 (Fox, 2001–2010) · (500) Days of Summer (Marc Webb, 2009)',
      tech: ['Grid as per-row column boundaries: panels split, slide and resize by interpolating edges', 'Sixteen procedural shots in a cover-fit virtual frame', 'All shots slaved to one countdown clock', 'Red gutter flash and slam on each split; staggered row slides', 'Squeeze-to-hero merge into one full frame at zero'],
      accent: '#e8322a',
      motionDNA: 'The frame divides on the beat — 1, 2, 4, 9, 16 — with panels sliding and resizing like a tightening vice; every panel ticks to the same countdown until all converge on one shot and merge into a single full frame at zero.',
      visualDNA: 'Black gutters that flash red, a red telephone, a station clock, rain-wet streets, headlights, a CCTV feed, LED digits, a vault dial and a lit phone booth: noir teal and amber with signal-red accents, panel labels in mono.',
      transitions: 'Split, slide, resize, squeeze-to-hero, merge-to-full-frame white-out, title split by a sliding gutter.',
      implementation: ['Optical printer / multi-camera', 'After Effects', 'Canvas 2D'],
      reproducibility: 'Needs live action (this film is a procedural homage)', loopable: false,
    },
    setup: ssSetup,
    draw: ssDraw,
    score: ssScore,
  });
})();
