/* Batch c4 — Family F: Analog, Physical & Stop Motion.
   claymation (12 fps plasticine), sand (backlit density field), xerox (1-bit photocopy at 8 fps). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, offscreen, roughPoly, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Sacramento&family=Special+Elite&family=UnifrakturCook:wght@700&family=Abril+Fatface&family=Rubik+Mono+One&family=Anton&family=Archivo:wght@400;900&family=Playfair+Display:wght@900&family=JetBrains+Mono:wght@800&display=block');

  /* ---------------- shared helpers ---------------- */
  const h2 = (x, y, s = 0) => { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); };
  const vn2 = (x, y, s = 0) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    return lerp(lerp(h2(ix, iy, s), h2(ix + 1, iy, s), ux), lerp(h2(ix, iy + 1, s), h2(ix + 1, iy + 1, s), ux), uy);
  };
  const fbm2 = (x, y, s, o = 3) => { let v = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { v += vn2(x * f, y * f, s + i * 13) * a; n += a; a *= 0.5; f *= 2; } return v / n; };
  const bump = (t, a, up, hold, down) => E.outQ(seg(t, a, a + up)) * (1 - E.ioS(seg(t, a + up + hold, a + up + hold + down)));
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const shade = (h, k, a = 1) => {
    const f = v => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k));
    const [r, g, b] = hex(h);
    return `rgba(${f(r)},${f(g)},${f(b)},${a})`;
  };
  const dscale = c => { const m = c.getTransform(); return Math.hypot(m.a, m.b); };
  const canvasRW = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d', { willReadFrequently: true }); return [cv, g]; };
  // closed curve through edge midpoints (soft, clay-like)
  function addSmooth(c, P) {
    const n = P.length;
    c.moveTo((P[0][0] + P[1][0]) / 2, (P[0][1] + P[1][1]) / 2);
    for (let i = 1; i <= n; i++) {
      const p = P[i % n], q = P[(i + 1) % n];
      c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    c.closePath();
  }
  // Catmull-Rom through the points (keeps profiles sharp where points are dense)
  function crPath(c, P, closed) {
    const n = P.length, get = i => closed ? P[(i + n) % n] : P[clamp(i, 0, n - 1)];
    c.moveTo(P[0][0], P[0][1]);
    const m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    if (closed) c.closePath();
  }
  // dense polyline sampled along a Catmull-Rom spline, with cumulative length
  function crSample(P, per = 12) {
    const n = P.length, get = i => P[clamp(i, 0, n - 1)], out = [];
    for (let i = 0; i < n - 1; i++) {
      const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      for (let k = 0; k < per; k++) {
        const t = k / per, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c2, d) => 0.5 * ((2 * b) + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(P[n - 1].slice());
    let L = 0; out[0][2] = 0;
    for (let i = 1; i < out.length; i++) { L += Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]); out[i][2] = L; }
    out.L = L;
    return out;
  }
  // draw the first fraction u of a sampled polyline; returns the pen point
  function partial(c, S, u) {
    const lim = S.L * clamp(u);
    c.moveTo(S[0][0], S[0][1]);
    let end = S[0];
    for (let i = 1; i < S.length; i++) {
      if (S[i][2] <= lim) { c.lineTo(S[i][0], S[i][1]); end = S[i]; continue; }
      const a = S[i - 1], b = S[i], k = (lim - a[2]) / ((b[2] - a[2]) || 1);
      end = [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
      c.lineTo(end[0], end[1]);
      break;
    }
    return end;
  }
  const at = (S, u) => {
    const lim = S.L * clamp(u);
    for (let i = 1; i < S.length; i++) if (S[i][2] >= lim) { const a = S[i - 1], b = S[i], k = (lim - a[2]) / ((b[2] - a[2]) || 1); return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; }
    return S[S.length - 1];
  };

  /* ======================================================================
     01  CLAY STOP MOTION — plasticine on a miniature set, shot on twos
     ====================================================================== */
  const GND = 812;
  const CL = { body: '#df5a2c', beak: '#f2a83a', eye: '#f7f3e9', pupil: '#1d1816', brow: '#5a2c1c', thumb: '#e9b08c', nail: '#f1c7b2', cream: '#efe2c4' };
  const LET = [['C', '#d6392c'], ['L', '#f0a92c'], ['A', '#2f6ebd'], ['Y', '#3f9a55']];
  const LET_X = [1000, 1232, 1468, 1700];
  const LET_T = [7.17, 7.42, 7.67, 7.92];
  const PLQ_T = 8.33;

  function bbox(P) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    P.forEach(p => { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; });
    return { x0, y0, x1, y1 };
  }
  function ellPts(x, y, rx, ry, n = 32, rot = 0, f = 0, amt = 0, sd = 0) {
    const P = [], cr = Math.cos(rot), sr = Math.sin(rot);
    for (let i = 0; i < n; i++) {
      const th = i / n * TAU, b = 1 + vnoise(i * 0.55 + f * 5.71 + sd * 13.3, sd + 3) * amt;
      const px = Math.cos(th) * rx * b, py = Math.sin(th) * ry * b;
      P.push([x + px * cr - py * sr, y + px * sr + py * cr]);
    }
    return P;
  }
  // a plasticine volume: base fill, form shading, inner occlusion, rim light, sheen, thumb texture
  function clay(c, P, col, o = {}) {
    const k = dscale(c), b = bbox(P), w = b.x1 - b.x0, h = b.y1 - b.y0, R = Math.max(w, h) + 40, r = Math.min(w, h);
    c.save();
    c.beginPath(); addSmooth(c, P);
    c.fillStyle = col; c.fill();
    c.clip();
    const lg = c.createLinearGradient(b.x0, b.y0, b.x0 + w * 0.6, b.y1);
    lg.addColorStop(0, shade(col, 0.2, 0.85)); lg.addColorStop(0.5, shade(col, 0, 0)); lg.addColorStop(1, shade(col, -0.3, 0.8));
    c.fillStyle = lg; c.fillRect(b.x0, b.y0, w, h);
    c.beginPath(); c.rect(b.x0 - R, b.y0 - R, w + 2 * R, h + 2 * R); addSmooth(c, P);
    c.fillStyle = '#000';
    c.shadowColor = shade(col, -0.62, o.core ?? 0.85); c.shadowBlur = r * 0.34 * k; c.shadowOffsetX = -r * 0.12 * k; c.shadowOffsetY = -r * 0.16 * k;
    c.fill('evenodd');
    c.shadowColor = shade(col, 0.55, o.rim ?? 0.75); c.shadowBlur = r * 0.1 * k; c.shadowOffsetX = r * 0.045 * k; c.shadowOffsetY = r * 0.055 * k;
    c.fill('evenodd');
    c.shadowColor = `rgba(214,244,238,${o.back ?? 0.6})`; c.shadowBlur = r * 0.035 * k; c.shadowOffsetX = -r * 0.03 * k; c.shadowOffsetY = r * 0.012 * k;
    c.fill('evenodd');
    c.shadowColor = 'transparent';
    const sx = b.x0 + w * 0.33, sy = b.y0 + h * 0.25, rg = c.createRadialGradient(sx, sy, 0, sx, sy, r * 0.45);
    rg.addColorStop(0, `rgba(255,250,238,${o.sheen ?? 0.32})`); rg.addColorStop(1, 'rgba(255,250,238,0)');
    c.fillStyle = rg; c.fillRect(b.x0, b.y0, w, h);
    if (o.tex) {
      c.globalCompositeOperation = 'overlay'; c.globalAlpha = o.texA ?? 0.95;
      c.drawImage(o.tex, b.x0 - 60 + (o.tx || 0), b.y0 - 60 + (o.ty || 0));
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    if (o.ground) {
      const ag = c.createLinearGradient(0, o.ground - Math.min(h * 0.4, 90), 0, o.ground);
      ag.addColorStop(0, 'rgba(25,10,5,0)'); ag.addColorStop(1, 'rgba(25,10,5,0.4)');
      c.fillStyle = ag; c.fillRect(b.x0, b.y0, w, h + 10);
    }
    if (o.inner) o.inner(c, b);
    c.restore();
  }
  // soft occlusion where one lump of clay presses into another
  function ao(c, x, y, rx, ry, a = 0.45) {
    c.save(); c.translate(x, y); c.scale(1, ry / rx);
    const g = c.createRadialGradient(0, 0, rx * 0.5, 0, 0, rx);
    g.addColorStop(0, `rgba(60,14,2,${a})`); g.addColorStop(1, 'rgba(60,14,2,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore();
  }
  // rolled clay snake (arms, brows)
  function tube(c, pts, lw, col, f = 0) {
    const k = dscale(c);
    const path = (dx, dy) => { c.beginPath(); c.moveTo(pts[0][0] + dx, pts[0][1] + dy); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0] + dx, pts[i][1] + dy); };
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    path(0, 0); c.strokeStyle = shade(col, -0.45); c.lineWidth = lw; c.stroke();
    c.filter = `blur(${(lw * 0.07 * k).toFixed(2)}px)`;
    path(-lw * 0.07, -lw * 0.09); c.strokeStyle = col; c.lineWidth = lw * 0.74; c.stroke();
    path(-lw * 0.15, -lw * 0.19); c.strokeStyle = shade(col, 0.32, 0.75); c.lineWidth = lw * 0.3; c.stroke();
    c.filter = 'none';
    path(-lw * 0.2, -lw * 0.24); c.strokeStyle = 'rgba(255,250,240,0.3)'; c.lineWidth = lw * 0.08; c.stroke();
    c.restore();
  }
  function clayTex(seed) {
    const S = 760, cv = offscreen(S, S), g = cv.getContext('2d'), r = rng(seed);
    g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 46; i++) {
      const x = r() * S, y = r() * S, rad = 30 + r() * 110, v = r() > 0.5 ? 255 : 0, gg = g.createRadialGradient(x, y, 0, x, y, rad);
      gg.addColorStop(0, `rgba(${v},${v},${v},0.11)`); gg.addColorStop(1, `rgba(${v},${v},${v},0)`);
      g.fillStyle = gg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    g.lineCap = 'round';
    for (let i = 0; i < 90; i++) {
      const x = r() * S, y = r() * S, a = r() * TAU, L = 20 + r() * 90, v = r() > 0.5 ? 255 : 0;
      g.strokeStyle = `rgba(${v},${v},${v},${0.07 + r() * 0.08})`; g.lineWidth = 2 + r() * 8;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * L * 0.6, y + Math.sin(a + 0.6) * L * 0.6, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
    }
    for (let p = 0; p < 11; p++) {
      const cx = r() * S, cy = r() * S, rot = r() * TAU, asp = 0.62 + r() * 0.25, Rm = 38 + r() * 52, span = TAU * (0.45 + r() * 0.55), a0 = r() * TAU, sd = r() * 100;
      for (let rr = 4; rr < Rm; rr += 3.3) {
        const ring = (dx, dy) => {
          g.beginPath();
          for (let s = 0; s <= 44; s++) {
            const a = a0 + span * s / 44, q = rr * (1 + 0.13 * vnoise(a * 2.2 + rr * 0.11, sd));
            const x = Math.cos(a) * q, y = Math.sin(a) * q * asp;
            const X = cx + x * Math.cos(rot) - y * Math.sin(rot) + dx, Y = cy + x * Math.sin(rot) + y * Math.cos(rot) + dy;
            s ? g.lineTo(X, Y) : g.moveTo(X, Y);
          }
        };
        const fade = 1 - rr / Rm;
        g.lineWidth = 1.3;
        ring(0, 0); g.strokeStyle = `rgba(0,0,0,${0.24 * fade + 0.05})`; g.stroke();
        ring(0.9, 1.1); g.strokeStyle = `rgba(255,255,255,${0.21 * fade + 0.04})`; g.stroke();
      }
    }
    for (let i = 0; i < 320; i++) {
      const x = r() * S, y = r() * S, s = 0.6 + r() * 1.9;
      g.fillStyle = 'rgba(0,0,0,0.32)'; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.26)'; g.beginPath(); g.arc(x + 0.9, y + 1, s * 0.8, 0, TAU); g.fill();
    }
    return cv;
  }
  function clSet(tex) {
    const cv = offscreen(1920, 1080), g = cv.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, 1080);
    bg.addColorStop(0, '#2f6266'); bg.addColorStop(0.42, '#6d9f9b'); bg.addColorStop(0.6, '#b3ccbb'); bg.addColorStop(0.7, '#d2dac6'); bg.addColorStop(1, '#a3ad97');
    g.fillStyle = bg; g.fillRect(0, 0, 1920, 1080);
    const sp = g.createRadialGradient(880, 700, 40, 880, 700, 1150);
    sp.addColorStop(0, 'rgba(255,232,190,0.42)'); sp.addColorStop(0.5, 'rgba(255,225,180,0.12)'); sp.addColorStop(1, 'rgba(255,220,170,0)');
    g.fillStyle = sp; g.fillRect(0, 0, 1920, 1080);
    const r = rng(31);
    for (let i = 0; i < 60; i++) {
      const x = r() * 1920, y = r() * 1080, rad = 60 + r() * 220, v = r() > 0.5 ? 255 : 0, gg = g.createRadialGradient(x, y, 0, x, y, rad);
      gg.addColorStop(0, `rgba(${v},${v},${v},0.035)`); gg.addColorStop(1, `rgba(${v},${v},${v},0)`);
      g.fillStyle = gg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    // out-of-focus clay clouds pinned to the backdrop
    g.filter = 'blur(5px)';
    [[400, 230, 1], [1490, 170, 0.8], [1050, 330, 0.45]].forEach(([x, y, s], j) => {
      const lumps = [[-90, 18, 62], [-30, -14, 80], [50, -4, 70], [110, 22, 52], [10, 30, 64]];
      g.fillStyle = 'rgba(30,70,72,0.25)';
      lumps.forEach(([dx, dy, rr]) => { g.beginPath(); g.arc(x + (dx + 10) * s, y + (dy + 16) * s, rr * s, 0, TAU); g.fill(); });
      lumps.forEach(([dx, dy, rr], i) => {
        const gg = g.createRadialGradient(x + (dx - rr * 0.3) * s, y + (dy - rr * 0.35) * s, 0, x + dx * s, y + dy * s, rr * s);
        gg.addColorStop(0, '#f7f6ee'); gg.addColorStop(1, '#c9d6cf');
        g.fillStyle = gg; g.beginPath(); g.arc(x + dx * s, y + dy * s, rr * s, 0, TAU); g.fill();
      });
    });
    g.filter = 'none';
    // soft-focus clay hills on the backdrop
    const hill = (y0, amp, col, blur, seed) => {
      g.filter = `blur(${blur}px)`;
      g.beginPath(); g.moveTo(-40, 760);
      for (let x = -40; x <= 1960; x += 20) g.lineTo(x, y0 - (vnoise(x * 0.0025, seed) * 0.5 + 0.5) * amp - Math.sin(x * 0.004 + seed) * amp * 0.3);
      g.lineTo(1960, 760); g.closePath();
      const hg = g.createLinearGradient(0, y0 - amp, 0, 760);
      hg.addColorStop(0, shade(col, 0.12)); hg.addColorStop(1, shade(col, -0.12));
      g.fillStyle = hg; g.fill();
      g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.6; g.save(); g.clip(); g.drawImage(tex, 0, y0 - amp - 40, 1920, 400); g.restore();
      g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    };
    hill(650, 190, '#7ea597', 7, 2);
    hill(700, 120, '#9fbd92', 4, 5);
    const fg = g.createLinearGradient(0, 640, 0, 780);
    fg.addColorStop(0, 'rgba(210,218,198,0)'); fg.addColorStop(0.75, 'rgba(210,218,198,0.6)'); fg.addColorStop(1, 'rgba(210,218,198,0.9)');
    g.filter = 'none'; g.fillStyle = fg; g.fillRect(0, 660, 1920, 120);
    // pebbles on the floor (soft, slightly out of focus)
    g.filter = 'blur(1.5px)';
    [[170, 905, 26, '#8d8a7c'], [228, 922, 14, '#b0705a'], [1840, 960, 30, '#7f8e86'], [1780, 990, 13, '#c7a24d']].forEach(([x, y, s, col]) => {
      g.fillStyle = 'rgba(30,40,35,0.35)'; g.beginPath(); g.ellipse(x + 8, y + s * 0.5, s * 1.3, s * 0.32, 0, 0, TAU); g.fill();
      const gg = g.createRadialGradient(x - s * 0.35, y - s * 0.45, 1, x, y, s * 1.1);
      gg.addColorStop(0, shade(col, 0.35)); gg.addColorStop(1, shade(col, -0.35));
      g.fillStyle = gg; g.beginPath(); g.ellipse(x, y, s, s * 0.72, 0, 0, TAU); g.fill();
    });
    g.filter = 'none';
    const id = g.getImageData(0, 0, 1920, 1080), d = id.data, rr = rng(5);
    for (let i = 0; i < d.length; i += 4) { const n = (rr() - 0.5) * 9; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    g.putImageData(id, 0, 0);
    return cv;
  }
  const LETTER_STROKES = {
    C: () => { const p = []; for (let i = 0; i <= 44; i++) { const a = Math.PI * 0.26 + i / 44 * Math.PI * 1.48; p.push([Math.cos(a) * 104, -150 + Math.sin(a) * 108]); } return [p]; },
    L: () => [[[-62, -262], [-62, -150], [-62, -40], [20, -40], [88, -40]]],
    A: () => [[[-98, -40], [-48, -152], [0, -262], [48, -152], [98, -40]], [[-50, -118], [0, -118], [50, -118]]],
    Y: () => [[[-96, -262], [-48, -204], [0, -146]], [[96, -262], [48, -204], [0, -146], [0, -92], [0, -40]]],
  };
  function densify(pl, step = 10) {
    const out = [];
    for (let i = 0; i < pl.length - 1; i++) {
      const [x0, y0] = pl[i], [x1, y1] = pl[i + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
      for (let k = 0; k < n; k++) out.push([lerp(x0, x1, k / n), lerp(y0, y1, k / n)]);
    }
    out.push(pl[pl.length - 1]);
    return out;
  }
  function clayLetter(ch, col, v, tex) {
    const cv = offscreen(380, 390), g = cv.getContext('2d');
    g.translate(190, 352);
    const sd = v * 17 + ch.charCodeAt(0);
    const strokes = LETTER_STROKES[ch]().map((pl, j) => densify(pl).map(([x, y], i) => [x + vnoise(i * 0.22 + sd + j * 5, 1) * 4, y + vnoise(i * 0.22 + sd + j * 5, 2) * 4]));
    const lw = 64 + vnoise(sd, 4) * 2;
    const path = (dx, dy) => { g.beginPath(); strokes.forEach(pl => { g.moveTo(pl[0][0] + dx, pl[0][1] + dy); pl.forEach(p => g.lineTo(p[0] + dx, p[1] + dy)); }); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    path(0, 0); g.strokeStyle = shade(col, -0.5); g.lineWidth = lw; g.stroke();
    g.globalCompositeOperation = 'source-atop';
    g.filter = 'blur(8px)'; path(-6, -8); g.strokeStyle = col; g.lineWidth = lw * 0.78; g.stroke();
    g.filter = 'blur(6px)'; path(-11, -14); g.strokeStyle = shade(col, 0.34); g.lineWidth = lw * 0.3; g.stroke();
    g.filter = 'blur(2.5px)'; path(-15, -18); g.strokeStyle = 'rgba(255,252,244,0.5)'; g.lineWidth = lw * 0.09; g.stroke();
    g.filter = 'none';
    g.globalCompositeOperation = 'source-over';
    const t2 = offscreen(380, 390), tg = t2.getContext('2d');
    tg.drawImage(tex, -60 - v * 90 - ch.charCodeAt(0) % 5 * 40, -40 - v * 70);
    tg.globalCompositeOperation = 'destination-in'; tg.drawImage(cv, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.85; g.drawImage(t2, 0, 0);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    return cv;
  }
  const thumbTip = tq => kf(tq, [[3.98, -470], [4.25, GND - 348, E.inQ], [4.58, GND - 66, E.outQ], [4.83, GND - 60], [5.08, -470, E.inC]]);
  // the character's full pose as a pure function of stepped time
  function clChar(tq) {
    const s = { x: 960, by: GND, pear: 0, lean: 0, eyeL: 0, eyeR: 0, beak: 0, feet: 0, mouth: 0, smile: 0.85, px: 0, py: 0, lid: 0.24, tilt: 0, brow: 0, arm: 0, armA: -0.5, print: 0, dent: 0, shadeT: 0, vis: tq >= 0.08, ball: tq < 1.0 };
    s.by = kf(tq, [[0.08, -10], [0.42, GND, E.inQ], [0.58, GND], [0.67, GND - 74, E.outQ], [0.75, GND, E.inQ]]);
    const rxN = kf(tq, [[0.42, 104], [0.5, 172, E.outQ], [0.58, 150], [0.67, 94], [0.75, 102], [0.83, 144], [0.92, 110], [1.0, 118], [1.25, 127], [1.5, 115], [1.83, 137], [2.08, 125], [2.33, 132], [2.5, 130]]);
    const ryN = kf(tq, [[0.42, 104], [0.5, 54, E.outQ], [0.58, 66], [0.67, 124], [0.75, 112], [0.83, 76], [0.92, 106], [1.0, 98], [1.25, 118], [1.5, 152], [1.83, 184], [2.08, 163], [2.33, 173], [2.5, 170]]);
    s.pear = kf(tq, [[1.0, 0], [1.83, 0.17], [2.5, 0.14]]);
    s.lean = tq > 1 && tq < 2.5 ? Math.sin(tq * 9.5) * 0.07 : 0;
    const tip = thumbTip(tq);
    let ry = ryN, rx = rxN;
    if (tq >= 4.25 && tq < 4.83) ry = Math.min(ryN, (GND - tip) / 2);
    else if (tq >= 4.83 && tq < 5.33) ry = kf(tq, [[4.83, 31], [5.0, 38], [5.17, 33], [5.33, 34]]);
    else if (tq >= 5.33) ry = 34 + (170 - 34) * spring(tq - 5.33, 2.3, 0.3);
    if (tq >= 4.25) rx = 130 * Math.pow(170 / ry, 0.5);
    s.shadeT = tq < 4.6 ? seg(tq, 3.85, 4.25) : 0;
    // hops to the left
    if (tq >= 6.5) {
      s.x = kf(tq, [[6.5, 960], [6.83, 712, E.ioS], [7.17, 466, E.ioS]]);
      const hop = (a, b) => { const u = seg(tq, a, b); return u > 0 && u < 1 ? Math.sin(u * Math.PI) : 0; };
      const hh = hop(6.5, 6.83) + hop(6.83, 7.17);
      s.by = GND - hh * 78;
      ry *= 1 + hh * 0.09; rx *= 1 - hh * 0.05;
      if ((tq >= 6.83 && tq < 6.92) || (tq >= 7.17 && tq < 7.26) || (tq >= 6.5 && tq < 6.55)) { ry *= 0.84; rx *= 1.1; }
    }
    s.rx = rx; s.ry = ry;
    if (tq >= 1.75) s.eyeL = spring(tq - 1.75, 2.8, 0.33);
    if (tq >= 1.92) s.eyeR = spring(tq - 1.92, 2.8, 0.33);
    if (tq >= 1.5) s.feet = spring(tq - 1.5, 3, 0.4);
    if (tq >= 2.08) s.beak = spring(tq - 2.08, 3, 0.35);
    if (tq >= 2.25) s.mouth = 1;
    // gaze
    const look = (keys) => { s.px = kf(tq, keys.map(k => [k[0], k[1]])); s.py = kf(tq, keys.map(k => [k[0], k[2]])); };
    if (tq < 4.6) look([[2.42, 0, 0], [2.5, -1, 0.1], [2.83, -1, 0.1], [2.92, 1, 0.1], [3.17, 1, 0.1], [3.25, 0, 0], [3.8, 0, 0], [3.92, 0.1, -1]]);
    else if (tq < 5.58) { const a = tq * 22; s.px = Math.cos(a) * 0.8; s.py = Math.sin(a) * 0.8; }
    else if (tq < 6.5) { s.px = 0; s.py = 0.15; }
    else if (tq < 7.1) { s.px = -0.7; s.py = 0.2; }
    else if (tq < 8.5) {
      let py = 0.3;
      LET_T.forEach(t0 => { if (tq >= t0 - 0.1 && tq < t0 + 0.25) py = -0.8; });
      s.px = 1; s.py = py;
    } else look([[8.5, 1, 0.2], [8.67, 0, 0]]);
    // lids
    if ((tq >= 3.33 && tq < 3.5) || (tq >= 9.17 && tq < 9.34)) s.lid = 1;
    if (tq >= 4.6 && tq < 5.58) s.lid = 0.5;
    if (tq >= 5.58 && tq < 6.5) { s.lid = 0.42; s.tilt = 0.42; s.brow = 1; s.smile = -0.6; }
    if (tq >= 4.25 && tq < 5.58) s.smile = -0.15;
    if (tq >= 8.5) s.smile = 1.1;
    // arm: wave, shake a fist, present the title
    if (tq >= 3.42 && tq < 4.08) {
      s.arm = Math.min(1, spring(tq - 3.42, 3, 0.4));
      s.armA = tq < 3.5 ? -0.6 : (Math.floor((tq - 3.5) * 6) % 2 ? -1.45 : -0.85);
    }
    if (tq >= 5.83 && tq < 6.42) { s.arm = 1; s.armA = -1.25 + (Math.floor(tq * 12) % 2 ? 0.22 : -0.12); }
    if (tq >= 8.5) { s.arm = Math.min(1, spring(tq - 8.5, 3, 0.4)); s.armA = -0.42; }
    if (tq >= 4.83) { s.print = 1; s.dent = 1; }
    return s;
  }
  function clDrawChar(c, s, f, st) {
    if (!s.vis) return;
    const { x, by, rx, ry } = s, cy = by - ry, air = clamp((GND - by) / 260);
    // contact + cast shadow
    c.save(); c.translate(x + 26, GND + 6); c.scale(1, 0.17);
    let sg = c.createRadialGradient(0, 0, 0, 0, 0, rx * 1.35 * (1 + air * 0.4));
    sg.addColorStop(0, `rgba(18,34,32,${0.55 * (1 - air * 0.7)})`); sg.addColorStop(1, 'rgba(18,34,32,0)');
    c.fillStyle = sg; c.fillRect(-rx * 3, -rx * 3, rx * 6, rx * 6); c.restore();
    c.save(); c.translate(x + rx * 0.95, GND - 2); c.scale(1.7, 0.16);
    sg = c.createRadialGradient(0, 0, 0, 0, 0, rx * 1.1);
    sg.addColorStop(0, `rgba(18,34,32,${0.22 * (1 - air)})`); sg.addColorStop(1, 'rgba(18,34,32,0)');
    c.fillStyle = sg; c.fillRect(-rx * 3, -rx * 3, rx * 6, rx * 6); c.restore();
    // body
    const P = [], n = 60;
    for (let i = 0; i < n; i++) {
      const th = i / n * TAU, sn = Math.sin(th), cs = Math.cos(th);
      const bo = 1 + vnoise(i * 0.42 + f * 7.31, 11) * 0.016 + vnoise(i * 1.6 + f * 3.3, 12) * 0.005 + vnoise(i * 0.3, 13) * 0.03;
      let px = x + cs * rx * (1 + s.pear * sn) * bo + s.lean * ry * (1 - sn) * 0.5;
      let py = cy + sn * ry * bo;
      if (s.dent && sn < -0.55) py += 10 * Math.pow((-sn - 0.55) / 0.45, 1.5) * Math.min(1, ry / 120);
      if (py > by) py = by + (py - by) * 0.12;
      P.push([px, py]);
    }
    const ex0 = x + s.lean * ry * 0.7, eyY = cy - ry * 0.4, sq = clamp(ry / 170, 0.3, 1.25);
    clay(c, P, CL.body, {
      tex: st.tex, tx: (f % 3) * 3, ty: (f % 2) * 3, ground: by,
      inner: (g, b) => {
        if (s.mouth) {
          const my = cy + ry * 0.2, mw = rx * 0.3, cv = s.smile * 26 * sq;
          const mp = dy => { g.beginPath(); g.moveTo(ex0 - mw, my + dy - cv * 0.3); g.quadraticCurveTo(ex0, my + dy + cv, ex0 + mw, my + dy - cv * 0.3); };
          g.lineCap = 'round';
          mp(0); g.strokeStyle = 'rgba(92,22,6,0.85)'; g.lineWidth = 8; g.stroke();
          mp(5); g.strokeStyle = shade(CL.body, 0.35, 0.5); g.lineWidth = 3.5; g.stroke();
        }
        if (s.print) {
          const px = x + rx * 0.08, py = cy - ry * 0.66;
          g.save(); g.translate(px, py); g.rotate(-0.18); g.scale(1, 0.52);
          const dg = g.createRadialGradient(0, -10, 10, 0, 0, 92);
          dg.addColorStop(0, 'rgba(90,25,5,0.0)'); dg.addColorStop(0.75, 'rgba(90,25,5,0.18)'); dg.addColorStop(1, 'rgba(90,25,5,0)');
          g.fillStyle = dg; g.beginPath(); g.arc(0, 0, 95, 0, TAU); g.fill();
          for (let rr = 6; rr < 78; rr += 5.2) {
            const ring = dy => { g.beginPath(); for (let k = 0; k <= 48; k++) { const a = k / 48 * TAU * 0.92 + rr * 0.05, q = rr * (1 + 0.1 * vnoise(a * 2 + rr * 0.2, 9)); k ? g.lineTo(Math.cos(a) * q, Math.sin(a) * q + dy) : g.moveTo(Math.cos(a) * q, Math.sin(a) * q + dy); } };
            const fa = 1 - rr / 80;
            ring(0); g.strokeStyle = `rgba(80,20,4,${0.35 * fa + 0.08})`; g.lineWidth = 2.6; g.stroke();
            ring(3); g.strokeStyle = `rgba(255,205,170,${0.3 * fa + 0.06})`; g.lineWidth = 2; g.stroke();
          }
          g.restore();
        }
        if (s.shadeT > 0) {
          const tg = g.createRadialGradient(x, cy - ry, 0, x, cy - ry, rx * 1.6);
          tg.addColorStop(0, `rgba(20,10,10,${0.45 * s.shadeT})`); tg.addColorStop(1, 'rgba(20,10,10,0)');
          g.fillStyle = tg; g.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
        }
      },
    });
    if (s.ball) return;
    // feet
    if (s.feet > 0.02) [-1, 1].forEach(sd => ao(c, x + sd * rx * 0.44 + 6, by - 4, 62 * s.feet, 22 * s.feet, 0.5));
    if (s.feet > 0.02) [-1, 1].forEach(sd => clay(c, ellPts(x + sd * rx * 0.46, by - 9, 48 * s.feet, 20 * s.feet, 22, sd * 0.08, f, 0.03, sd + 20), CL.beak, { tex: st.tex, texA: 0.5, rim: 0.5, sheen: 0.22 }));
    // eyes
    const er = 46;
    const eye = (sd, sc) => {
      if (sc <= 0.03) return;
      const ex = ex0 + sd * rx * 0.37 * Math.min(1.3, 130 / Math.min(rx, 130) * (rx / 130)), ey = eyY, R = er * sc, sy = sq;
      ao(c, ex + R * 0.16, ey + R * 0.2 * sy, R * 1.6, R * 1.6 * sy, 0.55);
      clay(c, ellPts(ex, ey, R, R * sy, 30, 0, f, 0.02, sd * 5 + 40), CL.eye, { tex: st.tex, texA: 0.35, sheen: 0.45, core: 0.5, back: 0.3 });
      const pr = R * 0.44, ppx = ex + s.px * R * 0.42, ppy = ey + s.py * R * 0.42 * sy;
      clay(c, ellPts(ppx, ppy, pr, pr * sy, 20, 0, f, 0.02, sd * 7 + 50), CL.pupil, { sheen: 0.15, rim: 0.4 });
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.ellipse(ppx - pr * 0.36, ppy - pr * 0.38 * sy, pr * 0.22, pr * 0.2 * sy, 0, 0, TAU); c.fill();
      // eyelid cap
      c.save(); c.beginPath(); c.ellipse(ex, ey, R * 1.03, R * sy * 1.03, 0, 0, TAU); c.clip();
      const lidY = ey - R * sy + s.lid * 2.05 * R * sy, ang = s.tilt * (sd < 0 ? 1 : -1);
      c.translate(ex, lidY); c.rotate(ang);
      const lg = c.createLinearGradient(0, -R * 2, 0, 0);
      lg.addColorStop(0, shade(CL.body, 0.25)); lg.addColorStop(1, shade(CL.body, -0.05));
      c.fillStyle = lg; c.fillRect(-R * 2, -R * 3, R * 4, R * 3);
      c.filter = `blur(${(3 * dscale(c)).toFixed(1)}px)`;
      c.fillStyle = 'rgba(70,20,6,0.45)'; c.fillRect(-R * 2, 0, R * 4, R * 0.16);
      c.filter = 'none';
      c.fillStyle = shade(CL.body, 0.45, 0.6); c.fillRect(-R * 2, -R * 0.07, R * 4, R * 0.05);
      c.restore();
      if (s.brow > 0) {
        const bl = ey - R * sy * 1.02, inner = sd < 0 ? 1 : -1;
        tube(c, [[ex - inner * R * 0.85, bl - 12], [ex, bl - 4], [ex + inner * R * 0.75, bl + 12]], 15, CL.brow, f);
      }
    };
    eye(-1, s.eyeL); eye(1, s.eyeR);
    if (s.beak > 0.02) {
      const bx = ex0 + 4, byy = cy - ry * 0.08, k = s.beak;
      ao(c, bx + 8, byy + 14 * k, 60 * k, 44 * k, 0.5);
      clay(c, [[bx - 34 * k, byy - 14 * k], [bx + 34 * k, byy - 14 * k], [bx + 10 * k, byy + 32 * k], [bx - 8 * k, byy + 30 * k]], CL.beak, { tex: st.tex, texA: 0.5, sheen: 0.3 });
    }
    if (s.arm > 0.02) {
      const sx = x + rx * 0.86, sy0 = cy + ry * 0.1, L = 100 * s.arm, a = s.armA;
      const mid = [sx + Math.cos(a + 0.35) * L * 0.5, sy0 + Math.sin(a + 0.35) * L * 0.5], end = [sx + Math.cos(a) * L, sy0 + Math.sin(a) * L];
      ao(c, sx + 4, sy0 + 10, 34, 30, 0.4);
      tube(c, [[sx - 10, sy0 + 4], mid, end], 34, CL.body, f);
      clay(c, ellPts(end[0], end[1], 21, 19, 18, 0, f, 0.04, 60), CL.body, { tex: st.tex, texA: 0.5 });
    }
  }
  function clDrawThumb(c, tip, x, st, f) {
    if (tip < -400) return;
    const w = 132, top = tip - 1100, P = [];
    for (let i = 0; i <= 10; i++) P.push([x - w * 1.12 + i * 0.012 * w, lerp(top, tip - 150, i / 10)]);
    for (let i = 0; i <= 16; i++) { const a = Math.PI - i / 16 * Math.PI; P.push([x + Math.cos(a) * w, tip - 150 + Math.sin(a) * 152]); }
    for (let i = 10; i >= 0; i--) P.push([x + w * 1.1 - i * 0.01 * w, lerp(top, tip - 150, i / 10)]);
    clay(c, P, CL.thumb, { tex: st.tex, texA: 0.9, tx: 200, ty: 100, sheen: 0.22, rim: 0.5 });
    // nail: the front of a fingertip pressing down
    const ny = tip - 104, nP = [];
    for (let i = 0; i < 28; i++) { const a = i / 28 * TAU, cs = Math.cos(a), sn = Math.sin(a); nP.push([x + 6 + Math.sign(cs) * Math.pow(Math.abs(cs), 0.7) * 66, ny + Math.sign(sn) * Math.pow(Math.abs(sn), 1.1) * (sn > 0 ? 62 : 74)]); }
    c.save();
    c.beginPath(); addSmooth(c, nP);
    const ng = c.createLinearGradient(x - 60, ny - 70, x + 60, ny + 70);
    ng.addColorStop(0, '#f6d2c4'); ng.addColorStop(1, '#dfa18c');
    c.fillStyle = ng; c.fill();
    c.strokeStyle = 'rgba(150,70,50,0.35)'; c.lineWidth = 3; c.stroke();
    c.restore();
    c.save();
    c.fillStyle = 'rgba(250,236,222,0.8)'; c.beginPath(); c.ellipse(x + 6, ny + 52, 60, 14, 0, 0, Math.PI); c.fill();
    c.fillStyle = 'rgba(255,226,214,0.4)'; c.beginPath(); c.ellipse(x + 6, ny - 52, 40, 12, 0, Math.PI, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 30, ny - 36); c.quadraticCurveTo(x - 40, ny, x - 30, ny + 32); c.stroke();
    const rg = c.createRadialGradient(x, tip - 40, 10, x, tip - 40, 150); rg.addColorStop(0, 'rgba(210,90,70,0.22)'); rg.addColorStop(1, 'rgba(210,90,70,0)');
    c.fillStyle = rg; c.fillRect(x - 160, tip - 200, 320, 200);
    c.strokeStyle = 'rgba(110,55,35,0.28)'; c.lineWidth = 4;
    [tip - 330, tip - 362].forEach((y, i) => { c.beginPath(); c.moveTo(x - 90 + i * 10, y); c.quadraticCurveTo(x, y + 18, x + 86 - i * 8, y - 4); c.stroke(); });
    c.restore();
  }
  function clDrawPlaque(c, tq, f, st) {
    if (tq < PLQ_T) return;
    const u = tq - PLQ_T, fall = seg(u, 0, 0.17);
    const y = lerp(-500, 0, E.inQ(fall)), sy = kf(u, [[0.17, 1], [0.25, 0.7], [0.33, 1.1], [0.42, 0.97], [0.5, 1]]);
    const cx = 1352, cy = 950 + y, w = 640, h = 96 * sy;
    c.save(); c.translate(cx + 20, 1000); c.scale(1, 0.12);
    const sg = c.createRadialGradient(0, 0, 0, 0, 0, 380); sg.addColorStop(0, `rgba(20,35,30,${0.5 * fall})`); sg.addColorStop(1, 'rgba(20,35,30,0)');
    c.fillStyle = sg; c.fillRect(-500, -500, 1000, 1000); c.restore();
    const P = [];
    const pts = [[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]];
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % 4];
      for (let k = 0; k < 8; k++) { const t = k / 8; P.push([lerp(p[0], q[0], t) + vnoise(i * 8 + k + f * 3.1, 70) * 3, lerp(p[1], q[1], t) + vnoise(i * 8 + k + f * 2.7, 71) * 3]); }
    });
    clay(c, P, CL.cream, { tex: st.tex, texA: 0.8, sheen: 0.25, rim: 0.8, ground: cy + h / 2 });
    c.save();
    c.translate(cx, cy + 4); c.scale(1.04 - sy * 0.04, sy);
    c.font = '700 54px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = '14px';
    c.fillStyle = 'rgba(255,250,235,0.7)'; c.fillText('STOP · MOTION', 2, 3);
    c.fillStyle = 'rgba(120,85,45,0.75)'; c.fillText('STOP · MOTION', -1, -1);
    c.fillStyle = 'rgba(165,125,75,0.85)'; c.fillText('STOP · MOTION', 0, 0.5);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.restore();
  }

  MG.film({
    id: 'claymation',
    dur: 10,
    poster: 9.4,
    fonts: [['700 54px Fredoka', 'STOP·MOTION']],
    meta: {
      family: 'F', name: 'Clay Stop Motion', sub: 'Claymation', era: '1955 —',
      origin: 'Plasticine figures are re-sculpted by hand and photographed one frame at a time. Art Clokey\'s Gumby made it a TV staple in 1955; Will Vinton\'s studio coined "Claymation" in the late 1970s and Aardman refined it.',
      works: 'Gumby (Art Clokey, 1955) · Closed Mondays (Will Vinton & Bob Gardiner, 1974) · A Grand Day Out (Nick Park, 1989) · Creature Comforts (Aardman, 1989) · Chicken Run (2000)',
      tech: ['Shot on twos · 12 fps', 'Thumbprints & shape boil', 'Plasticine squash & stretch'],
      accent: '#df5a2c',
      motionDNA: 'Stepped 12 fps poses with broad squash and stretch, plus a faint boil as the clay is touched between frames.',
      visualDNA: 'Soft, matte plasticine with fingerprints and tool marks, lit like a miniature set whose exposure flickers slightly from frame to frame.',
      transitions: 'Morph, squash, clay smear, pop-in replacement',
      implementation: ['Dragonframe', 'Stop-motion rig', 'Canvas 2D (procedural homage)'],
      reproducibility: 'Needs physical capture (this film is a procedural homage)',
      loopable: false,
    },
    setup() {
      const tex = clayTex(17);
      const letters = LET.map(([ch, col]) => [0, 1, 2].map(v => clayLetter(ch, col, v, tex)));
      return { tex, set: clSet(tex), letters };
    },
    draw(c, t, W, H, st) {
      const f = Math.floor(t * 12), tq = f / 12;
      c.save();
      c.translate((hash(f * 1.7) - 0.5) * 2.2, (hash(f * 2.3) - 0.5) * 2.2);
      c.drawImage(st.set, -4, -4, W + 8, H + 8);
      // title letters
      LET.forEach(([ch], i) => {
        const t0 = LET_T[i];
        if (tq < t0) return;
        const u = tq - t0, fall = seg(u, 0, 0.25);
        const y = lerp(-900, 0, E.inQ(fall));
        const sy = kf(u, [[0.25, 1], [0.33, 0.7], [0.42, 1.13], [0.5, 0.95], [0.58, 1]]), sx = 1 / Math.sqrt(sy);
        const lx = LET_X[i], base = GND - 6;
        c.save(); c.translate(lx + 30, base + 6); c.scale(1, 0.15);
        const sg = c.createRadialGradient(0, 0, 0, 0, 0, 170);
        sg.addColorStop(0, `rgba(18,34,32,${0.55 * E.inQ(fall)})`); sg.addColorStop(1, 'rgba(18,34,32,0)');
        c.fillStyle = sg; c.fillRect(-400, -400, 800, 800); c.restore();
        const v = Math.floor(hash(f * 3.1 + i * 7) * 3);
        c.save(); c.translate(lx, base + y); c.rotate((hash(i * 5.3) - 0.5) * 0.06 + (hash(f + i) - 0.5) * 0.006); c.scale(sx, sy);
        c.drawImage(st.letters[i][v], -190, -352 + 9);
        c.restore();
      });
      clDrawPlaque(c, tq, f, st);
      const s = clChar(tq);
      clDrawChar(c, s, f, st);
      clDrawThumb(c, thumbTip(tq), 972, st, f);
      c.restore();
      // the set light breathes a little from frame to frame
      const fl = (hash(f * 4.7 + 1) - 0.5) * 0.07;
      c.fillStyle = fl > 0 ? `rgba(255,236,205,${fl * 0.6})` : `rgba(10,14,20,${-fl * 0.7})`;
      c.fillRect(0, 0, W, H);
      grain(c, W, H, tq, 0.05);
      vignette(c, W, H, 0.42, '10,18,20');
    },
    score(A) {
      const sq = (t, g = 0.3, p = 1) => {
        A.noise(t, { type: 'lowpass', f: 1500 * p, f2: 200 * p, q: 7, dur: 0.22, g });
        A.osc(t, { f: 250 * p, f2: 80 * p, dur: 0.16, g: g * 0.55 });
        A.noise(t + 0.015, { type: 'bandpass', f: 2400 * p, f2: 650 * p, q: 3, dur: 0.12, g: g * 0.3 });
      };
      const pop = (t, f = 700, g = 0.16) => { A.osc(t, { f, f2: f * 2.2, glide: 0.05, dur: 0.08, g }); A.noise(t, { type: 'bandpass', f: 3200, q: 2, dur: 0.02, g: g * 0.5 }); };
      const bass = (t, m, d = 0.22, g = 0.2) => A.osc(t, { type: 'triangle', f: midi(m), dur: d, g, a: 0.01, lp: 900 });
      const pz = (t, m, g = 0.22) => A.pluck(t, midi(m), { dur: 0.5, bright: 0.55, decay: 0.985, g });
      // drop and splat
      A.osc(0.1, { f: 1200, f2: 380, glide: 0.32, dur: 0.33, g: 0.05 });
      sq(0.42, 0.5, 0.8); sq(0.75, 0.28, 1.15);
      [1.25, 1.5, 1.83].forEach((t, i) => A.noise(t, { type: 'bandpass', f: 400 + i * 220, f2: 1500 + i * 300, q: 6, dur: 0.24, g: 0.14 }));
      sq(1.5, 0.12, 1.6);
      pop(1.75, 640); pop(1.92, 760); pop(2.08, 980, 0.12);
      // bouncy little tune while it looks around
      const tune = [[2.33, 48, 64], [2.58, 55, 67], [2.83, 48, 72], [3.08, 55, 67], [3.33, 53, 69], [3.58, 55, 71], [3.83, 48, 72]];
      tune.forEach(([t, b, m]) => { bass(t, b); pz(t + 0.125, m); pz(t + 0.125, m - 5, 0.12); });
      A.osc(3.36, { f: 2400, f2: 1800, dur: 0.04, g: 0.05 });
      [3.5, 3.67, 3.83].forEach(t => A.whoosh(t, 0.12, { f1: 900, f2: 2400, g: 0.05 }));
      // the animator's thumb
      A.osc(3.9, { f: 520, f2: 480, dur: 0.18, g: 0.06, type: 'triangle' });
      A.whoosh(3.98, 0.3, { f1: 150, f2: 700, g: 0.22, rev: 0.1 });
      A.noise(4.25, { type: 'lowpass', f: 1000, f2: 110, q: 6, dur: 0.5, g: 0.5 });
      A.osc(4.25, { f: 170, f2: 46, glide: 0.4, dur: 0.5, g: 0.38 });
      A.noise(4.6, { type: 'bandpass', f: 650, f2: 320, q: 9, dur: 0.24, g: 0.12 });
      A.osc(4.92, { f: 280, f2: 1300, glide: 0.07, dur: 0.11, g: 0.22 });
      A.noise(4.92, { type: 'bandpass', f: 1800, q: 3, dur: 0.05, g: 0.15 });
      [5.0, 5.12, 5.24].forEach((t, i) => A.osc(t, { f: 2900 + i * 200, f2: 3500, dur: 0.06, g: 0.04, rev: 0.3 }));
      A.osc(5.33, { type: 'triangle', f: 150, f2: 470, glide: 0.18, dur: 0.6, g: 0.24, vib: [15, 36] });
      sq(5.33, 0.18, 1.3);
      // hmph
      A.osc(5.62, { type: 'sawtooth', f: 160, f2: 128, dur: 0.15, g: 0.11, lp: 700 });
      A.osc(5.82, { type: 'sawtooth', f: 138, f2: 98, dur: 0.22, g: 0.11, lp: 600 });
      for (let k = 0; k < 6; k++) A.noise(5.86 + k * 0.083, { type: 'bandpass', f: 900, q: 3, dur: 0.04, g: 0.06 });
      // hops
      A.osc(6.5, { f: 300, f2: 620, dur: 0.12, g: 0.07, type: 'triangle' }); sq(6.83, 0.2, 1.2);
      A.osc(6.85, { f: 300, f2: 620, dur: 0.12, g: 0.07, type: 'triangle' }); sq(7.17, 0.2, 1.1);
      // letters land, each a note of the chord
      LET_T.forEach((t0, i) => { A.whoosh(t0, 0.25, { f1: 300, f2: 1800, g: 0.06 }); sq(t0 + 0.25, 0.32, 0.75); pz(t0 + 0.25, [60, 64, 67, 72][i], 0.3); bass(t0 + 0.25, [36, 40, 43, 48][i], 0.3, 0.22); });
      sq(PLQ_T + 0.17, 0.26, 0.6);
      // ta-da
      A.chord(8.55, [48, 55, 60, 64, 67, 72], { type: 'triangle', dur: 1.3, g: 0.045, a: 0.01, lp: 2400, lp2: 900, lpT: 1.2, rev: 0.35, width: 0.8 });
      [72, 76, 79, 84].forEach((m, i) => pz(8.55 + i * 0.06, m, 0.2));
      A.bell(8.75, midi(84), { g: 0.05, dur: 1.6 });
      A.osc(9.18, { f: 2400, f2: 1800, dur: 0.04, g: 0.05 });
    },
  });

  /* ======================================================================
     02  SAND ANIMATION — grains on a backlit light table
     ====================================================================== */
  const SW2 = 960, SH2 = 540, SN = SW2 * SH2;
  const SUN = [1250, 330, 112];
  const gray = (v, a = 1) => { const q = Math.round(clamp(v) * 255); return `rgba(${q},${q},${q},${a})`; };
  const SWEEPS = [
    { t0: 0.3, t1: 1.82, type: 'wiper', piv: [2150, 1350], a0: -1.82, a1: -2.98, rH: [1300, 1180], seed: 3 },
    { t0: 2.85, t1: 4.2, type: 'wiper', piv: [-380, 1420], a0: -0.02, a1: -1.68, rH: [1350, 1150], seed: 7 },
    { t0: 4.3, t1: 5.6, type: 'linear', dir: [0.995, 0.1], s0: -160, s1: 2150, seed: 11 },
    { t0: 5.7, t1: 6.6, type: 'spiral', seed: 13 },
  ];
  // finger-drawn lines per scene: [t0, t1, sampled path, width]
  const SPIRAL = (() => { const P = []; for (let i = 0; i <= 120; i++) { const u = i / 120, r = SUN[2] * Math.sqrt(u) * 0.96, a = -1.2 + u * 3.3 * TAU; P.push([SUN[0] + Math.cos(a) * r, SUN[1] + Math.sin(a) * r]); } return crSample(P, 3); })();
  const SLINES = {
    1: [
      [1.95, 2.08, crSample([[868, 382], [898, 368], [936, 370]], 8), 9],
      [2.1, 2.26, crSample([[872, 414], [892, 402], [914, 399], [932, 405]], 8), 8],
      [2.28, 2.38, crSample([[878, 420], [900, 428], [928, 414]], 8), 7],
      [2.4, 2.46, crSample([[922, 402], [936, 389]], 4), 5],
      [2.46, 2.52, crSample([[910, 400], [917, 386]], 4), 5],
      [2.54, 2.8, crSample([[770, 200], [620, 215], [500, 290], [400, 330], [260, 320], [120, 360]], 10), 8],
    ],
    4: (() => {
      const L = [];
      for (let k = 0; k < 12; k++) {
        const a = -Math.PI / 2 + k / 12 * TAU, t0 = 6.65 + k * 0.055;
        const a2 = a + (hash(k * 3.1) - 0.5) * 0.12, r0 = 150 + hash(k * 5.7) * 12, r1 = 205 + (k % 2) * 38 + hash(k * 9.1) * 20, bend = (hash(k * 2.3) - 0.5) * 0.1;
        L.push([t0, t0 + 0.05, crSample([[SUN[0] + Math.cos(a2) * r0, SUN[1] + Math.sin(a2) * r0], [SUN[0] + Math.cos(a2 + bend) * (r0 + r1) / 2, SUN[1] + Math.sin(a2 + bend) * (r0 + r1) / 2], [SUN[0] + Math.cos(a2) * r1, SUN[1] + Math.sin(a2) * r1]], 4), 7 + hash(k) * 4]);
      }
      for (let j = 0; j < 8; j++) {
        const y = 628 + j * 30 + j * j * 1.5, w = 40 + j * 22 + hash(j * 4.4) * 20, x = SUN[0] + (hash(j * 7.7) - 0.5) * 40, t0 = 7.36 + j * 0.06;
        L.push([t0, t0 + 0.055, crSample([[x - w, y + (hash(j) - 0.5) * 6], [x, y - 3], [x + w, y + (hash(j + 9) - 0.5) * 6]], 5), 6 + j * 0.9]);
      }
      return L;
    })(),
  };
  const TITLE = { t0: 7.92, t1: 8.85, x: 960, y: 958, size: 156, str: 'Sand Animation' };
  // where is the hand, which pose, is it touching the glass
  function sandHand(t) {
    const segs = [];
    SWEEPS.forEach((sw, i) => segs.push({ t0: sw.t0, t1: sw.t1, pose: sw.type === 'spiral' ? 'point' : 'flat', fn: u => sweepHand(sw, u) }));
    [1, 4].forEach(k => SLINES[k].forEach(([t0, t1, S]) => segs.push({ t0, t1, pose: 'point', fn: u => { const p = at(S, u); return [p[0], p[1], 1.05]; } })));
    segs.push({ t0: TITLE.t0, t1: TITLE.t1, pose: 'point', fn: u => [TITLE.x - 560 + 1120 * u, TITLE.y - 40 + Math.sin(u * 62) * 34, 1.15] });
    segs.sort((a, b) => a.t0 - b.t0);
    const enter = { t1: 0, pose: 'flat', end: [1900, 1250, -1.82 + Math.PI] }, exit = { t0: 9.3, pose: 'point', start: [2350, 1500, 1.15] };
    for (let i = 0; i < segs.length; i++) {
      const sg = segs[i];
      if (t >= sg.t0 && t <= sg.t1) { const [x, y, ang] = sg.fn(E.ioS(seg(t, sg.t0, sg.t1))); return { x, y, ang, pose: sg.pose, contact: 1 }; }
      if (t < sg.t0) {
        const prev = i ? segs[i - 1] : null;
        const pt0 = prev ? prev.t1 : 0, P0 = prev ? prev.fn(1) : enter.end, P1 = sg.fn(0);
        const u = E.ioS(seg(t, pt0, sg.t0));
        const lift = Math.sin(u * Math.PI);
        return { x: lerp(P0[0], P1[0], u), y: lerp(P0[1], P1[1], u) - lift * 20, ang: lerp(P0[2], P1[2], u), pose: u < 0.5 && prev ? prev.pose : sg.pose, contact: 0, lift };
      }
    }
    const last = segs[segs.length - 1], P0 = last.fn(1), u = E.ioS(seg(t, last.t1, exit.t0));
    return { x: lerp(P0[0], exit.start[0], u), y: lerp(P0[1], exit.start[1], u), ang: lerp(P0[2], exit.start[2], u), pose: 'point', contact: 0 };
  }
  function sweepHand(sw, u) {
    if (sw.type === 'wiper') {
      const a = lerp(sw.a0, sw.a1, u), r = lerp(sw.rH[0], sw.rH[1], u);
      return [sw.piv[0] + Math.cos(a) * r, sw.piv[1] + Math.sin(a) * r, a + Math.PI];
    }
    if (sw.type === 'linear') {
      const s = lerp(sw.s0, sw.s1, u), y = 640 + Math.sin(u * TAU * 1.5) * 150;
      return [s - (y - 540) * sw.dir[1] / sw.dir[0] - 40, y, 1.05];
    }
    const p = at(SPIRAL, u);
    return [p[0], p[1], 1.05];
  }
  function maskPoly(g, sw, u) {
    g.beginPath();
    const pts = [];
    if (sw.type === 'wiper') {
      const a = lerp(sw.a0, sw.a1, u), [px, py] = sw.piv, ds = Math.sign(sw.a1 - sw.a0), ah = [-Math.sin(a) * ds, Math.cos(a) * ds];
      for (let r = 0; r <= 3400; r += 30) {
        const nn = vnoise(r * 0.006 + sw.seed * 3.1, sw.seed) * 55 + vnoise(r * 0.025 + sw.seed * 5, sw.seed + 1) * 16 + vnoise(r * 0.09, sw.seed + 2) * 6;
        pts.push([px + Math.cos(a) * r + ah[0] * nn, py + Math.sin(a) * r + ah[1] * nn]);
      }
      g.moveTo(px, py); pts.forEach(p => g.lineTo(p[0], p[1]));
      for (let k = 0; k <= 30; k++) { const aa = lerp(a, sw.a0 - ds * 0.3, k / 30); g.lineTo(px + Math.cos(aa) * 3400, py + Math.sin(aa) * 3400); }
      g.closePath();
      return { pts, ah };
    }
    const [dx, dy] = sw.dir, s = lerp(sw.s0, sw.s1, u), p = [-dy, dx];
    for (let q = -600; q <= 1800; q += 30) {
      const nn = vnoise(q * 0.006 + sw.seed, sw.seed) * 60 + vnoise(q * 0.03, sw.seed + 2) * 16 + vnoise(q * 0.09, sw.seed + 3) * 6;
      pts.push([dx * (s + nn) + p[0] * q, dy * (s + nn) + p[1] * q]);
    }
    pts.forEach((pt, i) => i ? g.lineTo(pt[0], pt[1]) : g.moveTo(pt[0], pt[1]));
    g.lineTo(dx * (s - 4000) + p[0] * 1800, dy * (s - 4000) + p[1] * 1800);
    g.lineTo(dx * (s - 4000) + p[0] * -600, dy * (s - 4000) + p[1] * -600);
    g.closePath();
    return { pts, ah: [dx, dy] };
  }
  function sandScenes(FB) {
    const mk = () => canvasRW(SW2, SH2);
    const finish = (cv, g, sh, amt = 0.36) => {
      const id = g.getImageData(0, 0, SW2, SH2), d = id.data;
      for (let y = 0; y < SH2; y++) for (let x = 0; x < SW2; x++) {
        const i = y * SW2 + x, j = ((y + sh * 37) % SH2) * SW2 + ((x + sh * 91) % SW2), k = i * 4;
        const v = d[k] / 255 * (1 - amt / 2 + amt * FB[j]) + (h2(x >> 1, y >> 1, sh) - 0.5) * 0.06;
        d[k] = d[k + 1] = d[k + 2] = clamp(v) * 255;
      }
      g.putImageData(id, 0, 0);
      return cv;
    };
    const streaks = (g, piv, r0, r1, n, seed, a = 0.06) => {
      const r = rng(seed); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const R = lerp(r0, r1, r()), a0 = -Math.PI + r() * Math.PI * 0.9 - 0.4, span = 0.1 + r() * 0.5;
        g.strokeStyle = gray(a * (0.4 + r()), 1); g.lineWidth = 2 + r() * 7;
        g.beginPath(); g.arc(piv[0], piv[1], R, a0, a0 + span); g.stroke();
      }
      g.globalCompositeOperation = 'source-over';
    };
    const out = [];
    // 0 — even layer
    let [cv, g] = mk(); g.scale(0.5, 0.5);
    g.fillStyle = gray(0.43); g.fillRect(0, 0, 1920, 1080);
    out.push(finish(cv, g, 1, 0.75));
    // 1 — profile of a woman, hair streaming back
    [cv, g] = mk(); g.scale(0.5, 0.5);
    g.fillStyle = gray(0.07); g.fillRect(0, 0, 1920, 1080);
    streaks(g, [2150, 1350], 700, 2600, 70, 21);
    g.filter = 'blur(1.2px)';
    const prof = [[650, 1090], [655, 900], [640, 760], [560, 640], [480, 520], [470, 360], [540, 220], [680, 140], [800, 150], [868, 205], [918, 270], [940, 330], [946, 376], [933, 400], [948, 432], [978, 470], [1004, 500], [984, 514], [958, 521], [962, 548], [979, 566], [958, 581], [973, 600], [952, 622], [956, 668], [940, 704], [892, 722], [862, 760], [850, 860], [868, 1090]];
    g.fillStyle = gray(0.78); g.beginPath(); crPath(g, prof, true); g.fill();
    // soft cheek and temple: thinner sand catches the light
    g.filter = 'blur(26px)'; g.fillStyle = gray(0.5);
    g.beginPath(); g.ellipse(872, 560, 46, 70, 0.2, 0, TAU); g.fill();
    g.fillStyle = gray(0.6); g.beginPath(); g.ellipse(905, 300, 28, 50, 0.4, 0, TAU); g.fill();
    g.filter = 'blur(1.2px)';
    const hair = [[868, 205], [800, 150], [680, 140], [560, 190], [480, 280], [440, 400], [470, 520], [540, 620], [610, 720], [650, 820], [700, 760], [700, 600], [730, 470], [790, 360], [850, 270]];
    g.fillStyle = gray(0.9); g.beginPath(); crPath(g, hair, true); g.fill();
    // locks streaming left, tapered
    const lock = (P, w0, dens = 0.9) => {
      const S = crSample(P, 10);
      for (let i = 1; i < S.length; i++) {
        const u = S[i][2] / S.L, w = w0 * Math.pow(1 - u, 0.8) + 2;
        g.strokeStyle = gray(dens); g.lineWidth = w; g.lineCap = 'round';
        g.beginPath(); g.moveTo(S[i - 1][0], S[i - 1][1]); g.lineTo(S[i][0], S[i][1]); g.stroke();
      }
    };
    lock([[600, 170], [430, 150], [300, 200], [170, 170], [40, 220]], 90);
    lock([[520, 250], [380, 290], [250, 260], [130, 320], [10, 300]], 100);
    lock([[480, 360], [340, 400], [230, 450], [120, 430], [20, 500]], 96);
    lock([[490, 470], [360, 540], [270, 600], [150, 610], [60, 690]], 86);
    lock([[540, 580], [430, 660], [360, 740], [250, 780], [170, 870]], 72);
    lock([[610, 690], [540, 800], [470, 880], [380, 930], [330, 1020]], 60);
    lock([[700, 160], [620, 90], [500, 70], [390, 40]], 40, 0.85);
    g.strokeStyle = gray(0.52); g.lineCap = 'round';
    [[[760, 175], [600, 180], [470, 230], [330, 240], [180, 210]], [[700, 230], [560, 280], [420, 340], [290, 350], [150, 390]], [[680, 320], [560, 400], [430, 460], [300, 500], [180, 520]], [[690, 430], [600, 520], [480, 610], [380, 660], [250, 720]], [[700, 540], [630, 640], [560, 740], [470, 830]]].forEach((P, i) => {
      g.lineWidth = 5 - (i % 3); g.beginPath(); crPath(g, P, false); g.stroke();
    });
    g.filter = 'none';
    out.push(finish(cv, g, 2));
    // 2 — goose in flight
    [cv, g] = mk(); g.scale(0.5, 0.5);
    g.fillStyle = gray(0.07); g.fillRect(0, 0, 1920, 1080);
    streaks(g, [-380, 1420], 800, 2700, 70, 22);
    g.filter = 'blur(10px)'; g.fillStyle = gray(0.26);
    [[300, 900, 260, 40], [1560, 860, 300, 46], [1700, 240, 200, 30]].forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); });
    g.filter = 'blur(1.2px)';
    const taper = (P, w0, dens) => {
      const S = crSample(P, 10);
      g.strokeStyle = gray(dens); g.lineCap = 'round';
      for (let i = 1; i < S.length; i++) { const u = S[i][2] / S.L; g.lineWidth = w0 * (1 - u * 0.75); g.beginPath(); g.moveTo(S[i - 1][0], S[i - 1][1]); g.lineTo(S[i][0], S[i][1]); g.stroke(); }
    };
    const wing = (root, tip, back, dens) => {
      const P = [root, [lerp(root[0], tip[0], 0.5) + (tip[0] > root[0] ? 40 : -10), lerp(root[1], tip[1], 0.5) - 20], tip];
      const ex = back[0] - tip[0], ey = back[1] - tip[1], el = Math.hypot(ex, ey), nx = -ey / el, ny = ex / el;
      const out = (nx * (root[0] - tip[0]) + ny * (root[1] - tip[1])) > 0 ? -1 : 1;
      for (let k = 1; k <= 9; k++) {
        const u = k / 10, a = k % 2 ? 26 : 2;
        P.push([tip[0] + ex * u + nx * a * out * (1 - u * 0.6), tip[1] + ey * u + ny * a * out * (1 - u * 0.6)]);
      }
      P.push(back);
      g.fillStyle = gray(dens); g.beginPath(); crPath(g, P, true); g.fill();
      const ta = Math.atan2(tip[1] - root[1], tip[0] - root[0]);
      [-0.22, -0.08, 0.06].forEach((da, k) => taper([[tip[0] - Math.cos(ta) * 40, tip[1] - Math.sin(ta) * 40], [tip[0] + Math.cos(ta + da) * (40 - k * 8), tip[1] + Math.sin(ta + da) * (40 - k * 8)]], 22, dens));
    };
    wing([1010, 560], [1170, 110], [880, 560], 0.74);
    g.fillStyle = gray(0.92);
    g.beginPath(); g.ellipse(905, 612, 250, 88, -0.12, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(690, 590); g.lineTo(590, 545); g.lineTo(585, 640); g.lineTo(700, 652); g.closePath(); g.fill();
    g.strokeStyle = gray(0.92); g.lineCap = 'round';
    g.lineWidth = 64; g.beginPath(); g.moveTo(1060, 590); g.quadraticCurveTo(1230, 560, 1330, 440); g.stroke();
    g.lineWidth = 42; g.beginPath(); g.moveTo(1200, 545); g.quadraticCurveTo(1290, 500, 1350, 425); g.stroke();
    g.beginPath(); g.ellipse(1372, 418, 46, 34, -0.35, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(1398, 398); g.lineTo(1482, 420); g.lineTo(1402, 446); g.closePath(); g.fill();
    wing([880, 575], [560, 95], [760, 600], 0.96);
    g.fillStyle = gray(0.0); g.beginPath(); g.arc(1380, 410, 7, 0, TAU); g.fill();
    g.strokeStyle = gray(0.5); g.lineWidth = 4;
    [[[860, 560], [760, 380], [640, 170]], [[900, 560], [820, 400], [740, 260]], [[1000, 560], [1060, 380], [1130, 200]]].forEach(P => { g.beginPath(); crPath(g, P, false); g.stroke(); });
    g.strokeStyle = gray(0.9); g.lineWidth = 7;
    [[1560, 250, 1], [1660, 310, 0.7]].forEach(([x, y, s]) => { g.beginPath(); g.moveTo(x - 40 * s, y); g.quadraticCurveTo(x - 20 * s, y - 22 * s, x, y); g.quadraticCurveTo(x + 20 * s, y - 22 * s, x + 40 * s, y); g.stroke(); });
    g.filter = 'none';
    out.push(finish(cv, g, 3));
    // 3 — dusk sea
    [cv, g] = mk(); g.scale(0.5, 0.5);
    let sky = g.createLinearGradient(0, 0, 0, 600);
    sky.addColorStop(0, gray(0.5)); sky.addColorStop(0.6, gray(0.32)); sky.addColorStop(0.9, gray(0.16)); sky.addColorStop(1, gray(0.08));
    g.fillStyle = sky; g.fillRect(0, 0, 1920, 600);
    g.globalCompositeOperation = 'lighter';
    let r = rng(41);
    for (let i = 0; i < 90; i++) { const y = r() * 600, x = r() * 1920, L = 120 + r() * 600; g.strokeStyle = gray(0.03 + r() * 0.05); g.lineWidth = 2 + r() * 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y + (r() - 0.5) * 6); g.stroke(); }
    g.globalCompositeOperation = 'source-over';
    g.filter = 'blur(9px)'; g.fillStyle = gray(0.62);
    [[380, 210, 330, 34], [620, 260, 220, 20], [1620, 170, 280, 30], [1500, 220, 200, 18]].forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); });
    g.filter = 'blur(1px)';
    g.fillStyle = gray(0.68); g.fillRect(0, 600, 1920, 480);
    for (let j = 0; j < 11; j++) {
      const y = 612 + Math.pow(j, 1.45) * 14, amp = 3 + j * 1.6, wl = 50 + j * 22, ph = j * 1.7;
      g.strokeStyle = gray(0.88); g.lineWidth = 5 + j * 2.2;
      g.beginPath(); for (let x = -40; x <= 1960; x += 10) { const yy = y + 6 + Math.sin(x / wl + ph) * amp; x > -40 ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke();
      g.strokeStyle = gray(0.2); g.lineWidth = 2 + j * 0.7;
      g.beginPath();
      for (let x = -40; x <= 1960; x += 8) { const s = Math.sin(x / wl + ph); const yy = y + s * amp - Math.max(0, s) * amp * 0.6; x > -40 ? g.lineTo(x, yy) : g.moveTo(x, yy); }
      g.stroke();
    }
    g.fillStyle = gray(0.86); g.fillRect(0, 885, 1920, 195);
    g.strokeStyle = gray(0.85); g.lineWidth = 6;
    g.beginPath(); g.moveTo(1520, 262); g.quadraticCurveTo(1532, 250, 1544, 262); g.quadraticCurveTo(1556, 250, 1568, 262); g.stroke();
    g.filter = 'none';
    out.push(finish(cv, g, 4, 0.3));
    // 4 — the sea with the sun carved out
    [cv, g] = mk();
    g.drawImage(out[3], 0, 0); g.scale(0.5, 0.5);
    g.filter = 'blur(2px)'; g.fillStyle = gray(0.0); g.beginPath(); g.arc(SUN[0], SUN[1], SUN[2], 0, TAU); g.fill(); g.filter = 'none';
    out.push(cv);
    return out;
  }
  function sandLines(g, k, t) {
    const L = SLINES[k];
    if (!L) return;
    g.lineCap = 'round'; g.lineJoin = 'round';
    L.forEach(([t0, t1, S, w]) => {
      if (t < t0) return;
      const u = E.ioS(seg(t, t0, t1));
      g.globalCompositeOperation = 'lighter'; g.filter = 'blur(3px)';
      g.beginPath(); partial(g, S, u); g.strokeStyle = gray(0.16); g.lineWidth = w * 2.6; g.stroke();
      g.globalCompositeOperation = 'source-over'; g.filter = 'blur(0.8px)';
      g.beginPath(); partial(g, S, u); g.strokeStyle = gray(0.08); g.lineWidth = w; g.stroke();
      g.filter = 'none';
    });
  }
  // a right hand seen from above, in local (a = back from the fingertip, b = across) coordinates
  function handShapes(g, h, grow, ws = 1) {
    const ux = Math.cos(h.ang), uy = Math.sin(h.ang), vx = -uy, vy = ux, b0 = h.pose === 'flat' ? 66 : 0;
    const P = (a, b) => [h.x + ux * a + vx * (b - b0), h.y + uy * a + vy * (b - b0)];
    const cap = (a0, b0_, a1, b1, w) => { const p = P(a0, b0_), q = P(a1, b1); g.lineWidth = w * ws + grow; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); };
    const poly = pts => { if (ws < 1) { const ca = pts.reduce((s, p) => s + p[0], 0) / pts.length, cb = pts.reduce((s, p) => s + p[1], 0) / pts.length; pts = pts.map(([a, b]) => [ca + (a - ca) * ws, cb + (b - cb) * ws]); } g.beginPath(); crPath(g, pts.map(([a, b]) => P(a, b)), true); g.fill(); if (grow) { g.lineWidth = grow; g.stroke(); } };
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (h.pose === 'point') {
      cap(10, 0, 175, 2, 40);
      poly([[165, -26], [182, 40], [186, 96], [176, 152], [215, 172], [330, 150], [400, 118], [410, 20], [350, -34], [230, -38]]);
      [[196, 58], [200, 104], [190, 146]].forEach(([a, b]) => cap(a, b, a - 38, b + 2, 40));
      cap(330, -26, 222, -52, 44);
      cap(400, 62, 1500, 70, 132 + 0);
      cap(700, 66, 1500, 76, 168);
    } else if (h.pose === 'edge') {
      cap(0, 0, 165, 4, 60);
      cap(150, 6, 330, 10, 88);
      cap(250, -34, 175, -46, 40);
      cap(330, 10, 1500, 20, 116);
      cap(700, 14, 1500, 24, 156);
    } else {
      [[0, 10, 160], [46, -5, 176], [92, 5, 166], [136, 40, 130]].forEach(([b, tipA, L]) => cap(tipA + L, b, tipA, b, 44));
      poly([[160, -24], [170, 70], [168, 160], [220, 178], [390, 150], [410, 20], [330, -28]]);
      cap(320, -18, 225, -92, 48);
      cap(395, 70, 1500, 78, 134);
      cap(700, 74, 1500, 84, 170);
    }
  }
  function drawHand(g, h) {
    g.save();
    // light wraps around the skin edges: a warm translucent halo behind the hand
    g.filter = 'blur(9px)'; g.fillStyle = g.strokeStyle = 'rgba(255,132,56,0.4)';
    handShapes(g, h, 14);
    g.filter = 'blur(2.5px)'; g.fillStyle = g.strokeStyle = '#2a160d';
    handShapes(g, h, 0);
    g.globalCompositeOperation = 'source-atop';
    // dim room light on the back of the hand: rounded fingers, knuckles and forearm
    g.filter = 'blur(7px)'; g.fillStyle = g.strokeStyle = 'rgba(110,72,52,0.75)';
    handShapes(g, h, 0, 0.42);
    g.filter = 'blur(3px)'; g.fillStyle = g.strokeStyle = 'rgba(150,104,80,0.35)';
    handShapes(g, h, 0, 0.16);
    g.filter = 'none';
    const ux = Math.cos(h.ang), uy = Math.sin(h.ang);
    const kn = [h.x + ux * 200, h.y + uy * 200], rg = g.createRadialGradient(kn[0], kn[1], 0, kn[0], kn[1], 320);
    rg.addColorStop(0, 'rgba(96,58,38,0.6)'); rg.addColorStop(1, 'rgba(96,58,38,0)');
    g.fillStyle = rg; g.fillRect(kn[0] - 340, kn[1] - 340, 680, 680);
    const vx = -uy, vy = ux, b0 = h.pose === 'flat' ? 66 : 0;
    const L = (a, b) => [h.x + ux * a + vx * (b - b0), h.y + uy * a + vy * (b - b0)];
    const nails = h.pose === 'point' ? [[16, 0]] : h.pose === 'flat' ? [[18, 0], [3, 46], [13, 92], [48, 136]] : [[16, 0]];
    g.filter = 'blur(2px)'; g.fillStyle = 'rgba(140,96,74,0.35)';
    nails.forEach(([a, b]) => { const p = L(a + 14, b); g.beginPath(); g.ellipse(p[0], p[1], 15, 12, h.ang, 0, TAU); g.fill(); });
    g.filter = 'none';
    if (h.pose === 'point') {
      const tg = g.createRadialGradient(h.x, h.y, 0, h.x, h.y, 70);
      tg.addColorStop(0, 'rgba(190,86,40,0.4)'); tg.addColorStop(1, 'rgba(190,86,40,0)');
      g.fillStyle = tg; g.fillRect(h.x - 80, h.y - 80, 160, 160);
    }
    g.restore();
  }
  function sandLamp(t) {
    if (t < 0.06) return 0.04;
    if (t < 0.1) return 0.85;
    if (t < 0.15) return 0.12;
    if (t < 0.2) return 1;
    if (t < 0.24) return 0.55;
    return 1 + (hash(Math.floor(t * 24) * 1.3) - 0.5) * 0.025;
  }

  MG.film({
    id: 'sand',
    dur: 10,
    poster: 9.5,
    fonts: [['400 156px Sacramento', 'Sand Animation']],
    meta: {
      family: 'F', name: 'Sand Animation', sub: 'Sand on a Light Table', era: '1969 —',
      origin: 'Sand is pushed around on a backlit glass table and filmed frame by frame (or performed live), so every picture is wiped away to make the next. Caroline Leaf pioneered it at Harvard and the National Film Board of Canada.',
      works: 'Sand, or Peter and the Wolf (Caroline Leaf, 1969) · The Owl Who Married a Goose (Caroline Leaf, 1974) · Sandman (Eliot Noyes Jr., 1973) · Ab Ovo (Ferenc Cakó, 1987)',
      tech: ['Backlit density: thin sand glows', 'Finger and palm sweeps', 'Metamorphosis without cuts'],
      accent: '#f0a040',
      motionDNA: 'Continuous metamorphosis: one picture is swept, smeared and redrawn into the next without a single cut.',
      visualDNA: 'Grainy silhouettes on a warm glowing table, dark where sand is thick and luminous where fingers clear it.',
      transitions: 'Palm sweep, finger wipe, smear morph, carve-out reveal',
      implementation: ['Light table + overhead camera', 'Dragonframe', 'Canvas 2D (procedural homage)'],
      reproducibility: 'Needs physical capture (this film is a procedural homage)',
      loopable: false,
    },
    setup() {
      const FB = new Float32Array(SN), G = new Float32Array(SN), LAMP = new Float32Array(SN), r = rng(77);
      for (let y = 0; y < SH2; y++) for (let x = 0; x < SW2; x++) {
        const i = y * SW2 + x;
        FB[i] = fbm2(x / 64, y / 64, 3, 3);
        G[i] = 0.46 * r() + 0.34 * h2(x >> 1, y >> 1, 9) + 0.2 * h2(x >> 2, y >> 2, 10);
        const dx = (x - 470) / 560, dy = (y - 280) / 380;
        LAMP[i] = 1.07 - 0.3 * (dx * dx + dy * dy) + (FB[i] - 0.5) * 0.06;
      }
      const EXP = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) EXP[i] = Math.exp(-3.7 * i / 511);
      const stops = [[0, [10, 4, 2]], [0.05, [34, 13, 4]], [0.16, [88, 36, 9]], [0.33, [165, 76, 20]], [0.52, [224, 132, 46]], [0.72, [250, 188, 102]], [0.9, [255, 226, 168]], [1.05, [255, 246, 226]], [1.25, [255, 252, 240]]];
      const LUT = new Uint8ClampedArray(1024 * 3);
      for (let i = 0; i < 1024; i++) {
        const v = i / 1023 * 1.25;
        let k = 0; while (k < stops.length - 2 && v > stops[k + 1][0]) k++;
        const [a, ca] = stops[k], [b, cb] = stops[k + 1], u = clamp((v - a) / (b - a));
        for (let ch = 0; ch < 3; ch++) LUT[i * 3 + ch] = lerp(ca[ch], cb[ch], u);
      }
      const [D, gD] = canvasRW(SW2, SH2), [M, gM] = canvasRW(SW2, SH2), [T, gT] = canvasRW(SW2, SH2), [O, gO] = canvasRW(SW2, SH2);
      const Bl = offscreen(240, 135), Hc = offscreen(960, 540);
      return { FB, G, LAMP, EXP, LUT, D, gD, M, gM, T, gT, O, gO, out: gO.createImageData(SW2, SH2), Bl, Hc, scenes: sandScenes(FB) };
    },
    draw(c, t, W, H, st) {
      const f = Math.floor(t * 24);
      const g = st.gD;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.globalAlpha = 1;
      // which picture is on the table, and is a sweep turning it into the next one
      let cur = 0, active = null;
      SWEEPS.forEach((sw, i) => { if (t >= sw.t1) cur = i + 1; else if (t >= sw.t0) active = i; });
      g.drawImage(st.scenes[cur], 0, 0);
      g.setTransform(0.5, 0, 0, 0.5, 0, 0);
      sandLines(g, cur, t);
      if (cur === 4 || active === 3) {
        // ring of sand pushed out by the spiralling finger
        const u = active === 3 ? E.ioS(seg(t, SWEEPS[3].t0, SWEEPS[3].t1)) : 1;
        g.globalCompositeOperation = 'lighter'; g.filter = 'blur(4px)';
        g.strokeStyle = gray(0.42); g.lineWidth = 22;
        g.beginPath(); g.arc(SUN[0], SUN[1], SUN[2] * Math.sqrt(u) + 18, 0, TAU); g.stroke();
        g.filter = 'none'; g.globalCompositeOperation = 'source-over';
      }
      if (cur === 4 && t >= TITLE.t0) {
        const u = E.ioS(seg(t, TITLE.t0, TITLE.t1));
        g.save();
        g.font = `400 ${TITLE.size}px Sacramento, cursive`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        const tw = g.measureText(TITLE.str).width;
        g.beginPath(); g.rect(TITLE.x - tw / 2 - 40, TITLE.y - 200, (tw + 80) * u, 300); g.clip();
        g.lineJoin = 'round'; g.textAlign = 'left';
        const chars = [...TITLE.str], ws = chars.map(ch => g.measureText(ch).width);
        const each = (fn) => { let x = TITLE.x - tw / 2; chars.forEach((ch, i) => { g.save(); g.translate(x + ws[i] / 2, TITLE.y + (hash(i * 3.7) - 0.5) * 10); g.rotate((hash(i * 1.9) - 0.5) * 0.07); fn(ch, -ws[i] / 2); g.restore(); x += ws[i]; }); };
        g.globalCompositeOperation = 'lighter'; g.filter = 'blur(3px)'; g.strokeStyle = gray(0.14); g.lineWidth = 22; each((ch, x) => g.strokeText(ch, x, 0));
        g.globalCompositeOperation = 'source-over'; g.filter = 'blur(0.7px)'; g.fillStyle = gray(0.1); g.strokeStyle = gray(0.1); g.lineWidth = 6;
        each((ch, x) => { g.fillText(ch, x, 0); g.strokeText(ch, x, 0); });
        g.restore();
      }
      if (active !== null) {
        const sw = SWEEPS[active], u = E.ioS(seg(t, sw.t0, sw.t1)), gm = st.gM, gt = st.gT;
        gm.setTransform(1, 0, 0, 1, 0, 0); gm.clearRect(0, 0, SW2, SH2); gm.setTransform(0.5, 0, 0, 0.5, 0, 0);
        gm.fillStyle = '#fff'; gm.strokeStyle = '#fff'; gm.filter = 'blur(7px)';
        let front = null;
        if (sw.type === 'spiral') { gm.lineCap = 'round'; gm.lineWidth = 56; gm.beginPath(); partial(gm, SPIRAL, u); gm.stroke(); gm.beginPath(); gm.arc(SUN[0], SUN[1], SUN[2] * Math.sqrt(u) * 0.9, 0, TAU); gm.fill(); }
        else { front = maskPoly(gm, sw, u); gm.fill(); }
        gm.filter = 'none';
        gt.setTransform(1, 0, 0, 1, 0, 0); gt.globalCompositeOperation = 'source-over'; gt.clearRect(0, 0, SW2, SH2);
        gt.drawImage(st.scenes[active + 1], 0, 0);
        gt.save(); gt.setTransform(0.5, 0, 0, 0.5, 0, 0); sandLines(gt, active + 1, t); gt.restore();
        gt.globalCompositeOperation = 'destination-in'; gt.drawImage(st.M, 0, 0); gt.globalCompositeOperation = 'source-over';
        g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(st.T, 0, 0); g.setTransform(0.5, 0, 0, 0.5, 0, 0);
        if (front) {
          // sand heaped up ahead of the moving hand
          const amt = seg(u, 0, 0.08) * (1 - seg(u, 0.85, 1));
          g.globalCompositeOperation = 'lighter'; g.filter = 'blur(5px)'; g.lineJoin = 'round';
          [[14, 34, 0.5], [44, 18, 0.2]].forEach(([off, lw, v]) => {
            g.beginPath(); front.pts.forEach((p, i) => { const x = p[0] + front.ah[0] * off, y = p[1] + front.ah[1] * off; i ? g.lineTo(x, y) : g.moveTo(x, y); });
            g.strokeStyle = gray(v * amt); g.lineWidth = lw; g.stroke();
          });
          g.filter = 'none'; g.globalCompositeOperation = 'source-over';
          // sand dragged along behind the hand
          gt.setTransform(1, 0, 0, 1, 0, 0); gt.clearRect(0, 0, SW2, SH2); gt.drawImage(st.D, 0, 0);
          g.save(); g.beginPath();
          front.pts.forEach((p, i) => { const x = p[0] - front.ah[0] * 10, y = p[1] - front.ah[1] * 10; i ? g.lineTo(x, y) : g.moveTo(x, y); });
          for (let i = front.pts.length - 1; i >= 0; i--) { const p = front.pts[i]; g.lineTo(p[0] - front.ah[0] * 170, p[1] - front.ah[1] * 170); }
          g.closePath(); g.clip();
          g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'blur(2px)';
          for (let k = 1; k <= 4; k++) { g.globalAlpha = 0.22 * amt; g.drawImage(st.T, front.ah[0] * k * 9, front.ah[1] * k * 9); }
          g.restore(); g.globalAlpha = 1; g.filter = 'none'; g.setTransform(0.5, 0, 0, 0.5, 0, 0);
        }
      }
      // light transmitted through the grains
      const d = g.getImageData(0, 0, SW2, SH2).data, o = st.out.data, G = st.G, LAMP = st.LAMP, EXP = st.EXP, LUT = st.LUT;
      const lamp = sandLamp(t) * 818;
      for (let i = 0, j = 0; i < SN; i++, j += 4) {
        const dd = d[j] * (0.0027 + 0.005 * G[i]);
        let L = EXP[dd * 511 > 1023 ? 1023 : (dd * 511) | 0] * LAMP[i] * lamp;
        const ci = (L > 1023 ? 1023 : L | 0) * 3;
        o[j] = LUT[ci]; o[j + 1] = LUT[ci + 1]; o[j + 2] = LUT[ci + 2]; o[j + 3] = 255;
      }
      st.gO.putImageData(st.out, 0, 0);
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      c.imageSmoothingEnabled = true;
      c.drawImage(st.O, 0, 0, W, H);
      if (cur === 4 || active === 3) {
        const u = active === 3 ? seg(t, SWEEPS[3].t0, SWEEPS[3].t1) : 1, s = sandLamp(t);
        c.save(); c.globalCompositeOperation = 'lighter';
        const rg = c.createRadialGradient(SUN[0], SUN[1], SUN[2] * 0.6, SUN[0], SUN[1], SUN[2] * 4.2);
        rg.addColorStop(0, `rgba(255,190,110,${0.32 * u * s})`); rg.addColorStop(1, 'rgba(255,150,60,0)');
        c.fillStyle = rg; c.fillRect(0, 0, W, H); c.restore();
      }
      // bloom
      const bg = st.Bl.getContext('2d');
      bg.drawImage(st.O, 0, 0, 240, 135);
      c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.42; c.drawImage(st.Bl, 0, 0, W, H); c.restore();
      // the hand, out of focus above the glass
      const hd = sandHand(t);
      if (hd.x > -400 && hd.x < 2400 && hd.y < 1700) {
        const hg = st.Hc.getContext('2d');
        hg.setTransform(1, 0, 0, 1, 0, 0); hg.clearRect(0, 0, 960, 540); hg.setTransform(0.5, 0, 0, 0.5, 0, 0);
        drawHand(hg, hd);
        hg.filter = 'none';
        c.save(); c.globalAlpha = clamp(0.25 + sandLamp(t)); c.drawImage(st.Hc, 0, 0, W, H); c.restore();
        if (hd.contact && hd.pose === 'point') {
          const tx = hd.x + Math.cos(hd.ang) * (hd.pose === 'point' ? 0 : 30), ty = hd.y + Math.sin(hd.ang) * (hd.pose === 'point' ? 0 : 30);
          c.save(); c.globalCompositeOperation = 'lighter';
          const rg = c.createRadialGradient(tx, ty, 0, tx, ty, hd.pose === 'point' ? 40 : 130);
          rg.addColorStop(0, 'rgba(255,120,50,0.42)'); rg.addColorStop(1, 'rgba(255,90,30,0)');
          c.fillStyle = rg; c.fillRect(tx - 130, ty - 130, 260, 260); c.restore();
        }
      }
      grain(c, W, H, t, 0.07, 'soft-light');
      vignette(c, W, H, 0.62, '18,6,0');
    },
    score(A) {
      // lamp
      A.noise(0.06, { type: 'bandpass', f: 3500, q: 2, dur: 0.02, g: 0.25 });
      A.osc(0.06, { f: 100, dur: 0.05, g: 0.08, type: 'square', lp: 400 });
      A.noise(0.16, { type: 'bandpass', f: 3000, q: 2, dur: 0.015, g: 0.14 });
      A.osc(0.2, { f: 100, dur: 9.8, g: 0.012, type: 'sawtooth', lp: 260, hold: true, rel: 0.6 });
      A.osc(0.2, { f: 120, dur: 9.8, g: 0.01, type: 'square', lp: 300, hold: true, rel: 0.6 });
      // sand hiss follows the hand: louder when it moves fast, broader for a flat palm
      let prev = sandHand(0);
      for (let k = 1; k < 222; k++) {
        const t = k / 24, h = sandHand(t), sp = Math.hypot(h.x - prev.x, h.y - prev.y) * 24;
        if (h.contact && sp > 30) {
          const flat = h.pose !== 'point';
          A.noise(t, { type: 'bandpass', f: flat ? 1700 + hash(k) * 600 : 4200 + hash(k) * 1500, q: flat ? 0.7 : 1.4, dur: 0.12, g: clamp(sp / (flat ? 2600 : 1400)) * (flat ? 0.16 : 0.1), a: 0.03, pan: (h.x / 1920 - 0.5) * 0.8 });
          if (flat && hash(k * 3.3) > 0.5) A.noise(t + 0.02, { type: 'highpass', f: 6500, dur: 0.06, g: 0.03, pan: (h.x / 1920 - 0.5) });
        }
        prev = h;
      }
      // warm pad and kalimba
      const pad = (t, notes, d, g = 0.022) => A.chord(t, notes, { type: 'triangle', dur: d, g, a: 0.9, hold: true, rel: 0.9, lp: 1500, rev: 0.6, width: 0.9, spread: 6 });
      const kal = (t, m, g = 0.2) => { A.pluck(t, midi(m), { dur: 1.8, bright: 0.35, decay: 0.996, g, rev: 0.4 }); A.osc(t, { f: midi(m) * 4.02, dur: 0.25, g: g * 0.08 }); };
      pad(0.4, [45, 52, 59, 64], 2.6);
      [[0.6, 69], [1.2, 72], [1.8, 76], [2.1, 74], [2.4, 72]].forEach(([t, m]) => kal(t, m, 0.16));
      pad(2.8, [41, 48, 57, 64], 1.6);
      [[2.9, 69], [3.35, 72], [3.8, 77]].forEach(([t, m]) => kal(t, m, 0.16));
      pad(4.25, [38, 50, 57, 62, 65], 1.6);
      [[4.4, 74], [4.9, 69], [5.4, 67]].forEach(([t, m]) => kal(t, m, 0.15));
      pad(5.7, [36, 48, 55, 62, 64], 1.2, 0.024);
      A.riser(5.7, 0.95, { g: 0.06, f: 130 });
      A.chord(6.62, [36, 48, 55, 59, 64, 67, 71], { type: 'triangle', dur: 3.3, g: 0.022, a: 0.05, hold: true, rel: 1.6, lp: 2400, rev: 0.7, width: 1, spread: 7 });
      A.bell(6.62, midi(79), { g: 0.06, dur: 3 }); A.bell(6.7, midi(84), { g: 0.035, dur: 2.6, pan: 0.3 });
      for (let k = 0; k < 12; k++) A.osc(6.65 + k * 0.055, { f: midi(84 + [0, 4, 7, 11][k % 4]), dur: 0.3, g: 0.025, rev: 0.6, pan: (k % 2 ? 0.4 : -0.4) });
      [[7.95, 72], [8.15, 76], [8.35, 79], [8.55, 83], [8.75, 84]].forEach(([t, m]) => kal(t, m, 0.17));
      A.bell(9.0, midi(72), { g: 0.04, dur: 1.2 });
    },
  });

  /* ======================================================================
     03  XEROX MOTION — photocopied punk zine, 8 fps
     ====================================================================== */
  const XP = { W: [238, 234, 222], PINK: [250, 156, 196], YEL: [246, 226, 66] };
  const RED = [228, 40, 70];
  const RF = [s => `900 ${s}px Archivo`, s => `400 ${s}px Anton`, s => `900 ${s}px "Playfair Display"`, s => `700 ${s}px UnifrakturCook`, s => `400 ${s}px "Special Elite"`, s => `400 ${s}px "Abril Fatface"`, s => `400 ${s}px "Rubik Mono One"`, s => `800 ${s}px "JetBrains Mono"`];
  const NL = SN + 9973;
  function xEye() {
    const cv = offscreen(1400, 800), g = cv.getContext('2d');
    g.translate(700, 400); g.scale(1300, 1300);
    let gr = g.createRadialGradient(0, 0.04, 0.05, 0, 0.04, 0.75);
    gr.addColorStop(0, '#d0d0d0'); gr.addColorStop(0.6, '#a2a2a2'); gr.addColorStop(1, '#5c5c5c');
    g.fillStyle = gr; g.fillRect(-0.6, -0.35, 1.2, 0.7);
    gr = g.createRadialGradient(0, -0.1, 0.05, 0, -0.1, 0.5);
    gr.addColorStop(0, 'rgba(60,60,60,0.45)'); gr.addColorStop(1, 'rgba(60,60,60,0)');
    g.fillStyle = gr; g.fillRect(-0.6, -0.35, 1.2, 0.7);
    const r = rng(8);
    g.lineCap = 'round';
    for (let k = 0; k < 260; k++) {
      const x = -0.5 + r() * 0.98, yb = -0.27 - 0.07 * (1 - Math.pow(x / 0.5, 2)), a = -0.35 - r() * 0.35 + x * 0.6;
      const v = 20 + r() * 70; g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 0.003 + r() * 0.004;
      g.beginPath(); g.moveTo(x, yb + r() * 0.04); g.lineTo(x + Math.cos(a) * 0.05, yb + Math.sin(a) * 0.05); g.stroke();
    }
    g.strokeStyle = '#4a4a4a'; g.lineWidth = 0.012;
    g.beginPath(); g.moveTo(-0.44, -0.09); g.quadraticCurveTo(0, -0.31, 0.46, -0.11); g.stroke();
    g.strokeStyle = '#e4e4e4'; g.lineWidth = 0.008;
    g.beginPath(); g.moveTo(-0.42, -0.07); g.quadraticCurveTo(0, -0.28, 0.44, -0.09); g.stroke();
    const almond = () => { g.beginPath(); g.moveTo(-0.45, 0.02); g.bezierCurveTo(-0.2, -0.22, 0.2, -0.22, 0.45, 0); g.bezierCurveTo(0.2, 0.15, -0.2, 0.17, -0.45, 0.02); g.closePath(); };
    g.save(); almond(); g.clip();
    gr = g.createRadialGradient(0, -0.02, 0.05, 0, -0.02, 0.46);
    gr.addColorStop(0, '#f4f4f4'); gr.addColorStop(1, '#8a8a8a');
    g.fillStyle = gr; g.fillRect(-0.5, -0.3, 1, 0.5);
    const ix = 0.02, iy = -0.03;
    gr = g.createRadialGradient(ix, iy, 0.02, ix, iy, 0.17);
    gr.addColorStop(0, '#a4a4a4'); gr.addColorStop(0.6, '#7c7c7c'); gr.addColorStop(1, '#4c4c4c');
    g.fillStyle = gr; g.beginPath(); g.arc(ix, iy, 0.17, 0, TAU); g.fill();
    for (let k = 0; k < 140; k++) {
      const a = r() * TAU, v = r() > 0.5 ? 230 : 30;
      g.strokeStyle = `rgba(${v},${v},${v},0.55)`; g.lineWidth = 0.003 + r() * 0.004;
      g.beginPath(); g.moveTo(ix + Math.cos(a) * 0.065, iy + Math.sin(a) * 0.065); g.lineTo(ix + Math.cos(a) * (0.12 + r() * 0.05), iy + Math.sin(a) * (0.12 + r() * 0.05)); g.stroke();
    }
    g.strokeStyle = '#121212'; g.lineWidth = 0.02; g.beginPath(); g.arc(ix, iy, 0.165, 0, TAU); g.stroke();
    g.fillStyle = '#040404'; g.beginPath(); g.arc(ix, iy, 0.066, 0, TAU); g.fill();
    g.fillStyle = '#ffffff'; g.fillRect(ix - 0.085, iy - 0.085, 0.05, 0.04);
    g.beginPath(); g.arc(ix + 0.07, iy + 0.05, 0.012, 0, TAU); g.fill();
    gr = g.createLinearGradient(0, -0.2, 0, -0.04);
    gr.addColorStop(0, 'rgba(0,0,0,0.65)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(-0.5, -0.25, 1, 0.22);
    g.restore();
    g.strokeStyle = '#0b0b0b'; g.lineWidth = 0.022;
    g.beginPath(); g.moveTo(-0.45, 0.02); g.bezierCurveTo(-0.2, -0.22, 0.2, -0.22, 0.45, 0); g.stroke();
    for (let k = 0; k < 46; k++) {
      const u = k / 45, bx = Math.pow(1 - u, 3) * -0.45 + 3 * Math.pow(1 - u, 2) * u * -0.2 + 3 * (1 - u) * u * u * 0.2 + u * u * u * 0.45;
      const by = Math.pow(1 - u, 3) * 0.02 + 3 * Math.pow(1 - u, 2) * u * -0.22 + 3 * (1 - u) * u * u * -0.22;
      if (r() < 0.18) continue;
      const L = 0.03 + Math.sin(u * Math.PI) * 0.06 + r() * 0.04, a = -Math.PI / 2 + (u - 0.5) * 1.6 + 0.3 + (r() - 0.5) * 0.4;
      g.lineWidth = 0.003 + r() * 0.006; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + Math.cos(a) * L * 0.5, by + Math.sin(a) * L * 0.5 - 0.01, bx + Math.cos(a + 0.4) * L, by + Math.sin(a + 0.4) * L); g.stroke();
    }
    g.strokeStyle = '#333'; g.lineWidth = 0.004;
    for (let k = 0; k < 26; k++) { const x = -0.38 + k * 0.03 + r() * 0.01, y = 0.1 - 0.05 * (1 - Math.pow(x / 0.45, 2)) + 0.05; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 0.004 + r() * 0.01, y + 0.02 + r() * 0.02); g.stroke(); }
    photoNoise(cv, 21, 46);
    return cv;
  }
  // film-grain / skin mottling baked into a grayscale source, so a hard threshold breaks it up like a real photo
  function photoNoise(cv, seed, amt) {
    const g = cv.getContext('2d', { willReadFrequently: true }), id = g.getImageData(0, 0, cv.width, cv.height), d = id.data;
    for (let y = 0, i = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++, i += 4) {
      const n = (vn2(x / 9, y / 9, seed) - 0.5) * amt + (vn2(x / 2.5, y / 2.5, seed + 5) - 0.5) * amt * 0.6;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    g.putImageData(id, 0, 0);
  }
  function xMouth() {
    const cv = offscreen(1100, 900), g = cv.getContext('2d');
    g.translate(550, 470); g.scale(1000, 1000);
    let gr = g.createRadialGradient(0, 0, 0.1, 0, 0, 0.7);
    gr.addColorStop(0, '#d2d2d2'); gr.addColorStop(1, '#6e6e6e');
    g.fillStyle = gr; g.fillRect(-0.55, -0.47, 1.1, 0.9);
    g.filter = 'blur(6px)'; g.fillStyle = '#222';
    g.beginPath(); g.ellipse(-0.12, -0.4, 0.06, 0.03, 0.2, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(0.12, -0.4, 0.06, 0.03, -0.2, 0, TAU); g.fill();
    g.filter = 'none';
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 0.012;
    g.beginPath(); g.moveTo(-0.04, -0.36); g.lineTo(-0.05, -0.24); g.moveTo(0.04, -0.36); g.lineTo(0.05, -0.24); g.stroke();
    g.beginPath(); g.moveTo(-0.4, 0); g.bezierCurveTo(-0.3, -0.12, -0.12, -0.26, 0, -0.2); g.bezierCurveTo(0.12, -0.26, 0.3, -0.12, 0.4, 0); g.bezierCurveTo(0.32, 0.44, -0.32, 0.44, -0.4, 0); g.closePath();
    gr = g.createLinearGradient(0, -0.24, 0, 0.36);
    gr.addColorStop(0, '#5c5c5c'); gr.addColorStop(0.5, '#7a7a7a'); gr.addColorStop(1, '#a8a8a8');
    g.fillStyle = gr; g.fill();
    g.save();
    g.beginPath(); g.moveTo(-0.31, 0.0); g.bezierCurveTo(-0.2, -0.14, 0.2, -0.14, 0.31, 0.0); g.bezierCurveTo(0.26, 0.31, -0.26, 0.31, -0.31, 0.0); g.closePath();
    g.fillStyle = '#060606'; g.fill(); g.clip();
    for (let k = 0; k < 6; k++) {
      const x = -0.2 + k * 0.068, top = -0.14 + Math.abs(x) * 0.25;
      gr = g.createLinearGradient(0, top, 0, top + 0.1); gr.addColorStop(0, '#f2f2f2'); gr.addColorStop(1, '#a5a5a5');
      g.fillStyle = gr; g.beginPath(); g.roundRect ? g.roundRect(x - 0.03, top - 0.05, 0.062, 0.14, 0.018) : g.rect(x - 0.03, top - 0.05, 0.062, 0.14); g.fill();
    }
    for (let k = 0; k < 5; k++) { const x = -0.14 + k * 0.07; g.fillStyle = '#9a9a9a'; g.fillRect(x - 0.028, 0.2, 0.056, 0.08); }
    gr = g.createRadialGradient(0, 0.2, 0.02, 0, 0.22, 0.2); gr.addColorStop(0, '#6c6c6c'); gr.addColorStop(1, '#2a2a2a');
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0.22, 0.17, 0.07, 0, 0, TAU); g.fill();
    g.restore();
    g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.ellipse(0.06, 0.33, 0.09, 0.025, -0.1, 0, TAU); g.fill();
    gr = g.createLinearGradient(0, 0.36, 0, 0.45); gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(-0.4, 0.36, 0.8, 0.1);
    photoNoise(cv, 22, 40);
    return cv;
  }
  function xPin() {
    const cv = offscreen(1300, 560), g = cv.getContext('2d');
    g.fillStyle = '#e4e4e4'; g.fillRect(0, 0, 1300, 560);
    g.translate(650, 280); g.scale(1000, 1000);
    g.lineCap = 'round';
    g.filter = 'blur(10px)'; g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 0.04;
    g.beginPath(); g.moveTo(-0.5, 0.12); g.lineTo(0.5, 0.1); g.moveTo(-0.5, -0.0); g.lineTo(0.45, -0.02); g.stroke();
    g.filter = 'none';
    const wire = (pathFn) => {
      pathFn(); g.strokeStyle = '#141414'; g.lineWidth = 0.038; g.stroke();
      pathFn(); g.strokeStyle = '#4c4c4c'; g.lineWidth = 0.022; g.stroke();
      g.save(); g.translate(-0.004, -0.007); pathFn(); g.strokeStyle = '#fafafa'; g.lineWidth = 0.007; g.stroke(); g.restore();
    };
    wire(() => { g.beginPath(); g.moveTo(0.5, 0.075); g.lineTo(-0.5, 0.075); g.arc(-0.5, 0.0, 0.075, Math.PI / 2, Math.PI * 1.5); g.lineTo(0.47, -0.055); });
    g.fillStyle = '#111'; g.beginPath(); g.moveTo(0.47, -0.07); g.lineTo(0.55, -0.055); g.lineTo(0.47, -0.04); g.fill();
    g.save(); g.beginPath(); g.arc(-0.5, 0.0, 0.03, 0, TAU); g.strokeStyle = '#222'; g.lineWidth = 0.02; g.stroke(); g.restore();
    const gr = g.createLinearGradient(0, -0.11, 0, 0.12);
    gr.addColorStop(0, '#d8d8d8'); gr.addColorStop(0.35, '#5a5a5a'); gr.addColorStop(1, '#1e1e1e');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0.43, -0.1); g.lineTo(0.6, -0.1); g.quadraticCurveTo(0.66, -0.1, 0.66, -0.04); g.lineTo(0.66, 0.07); g.quadraticCurveTo(0.66, 0.12, 0.6, 0.12); g.lineTo(0.43, 0.12); g.closePath(); g.fill();
    g.strokeStyle = '#111'; g.lineWidth = 0.008; g.stroke();
    g.strokeStyle = '#fff'; g.lineWidth = 0.008; g.beginPath(); g.moveTo(0.46, -0.08); g.lineTo(0.62, -0.08); g.stroke();
    g.setTransform(1, 0, 0, 1, 0, 0);
    photoNoise(cv, 23, 60);
    return cv;
  }
  function xHalftone(eye) {
    const sm = offscreen(96, 60), sg = sm.getContext('2d', { willReadFrequently: true });
    sg.drawImage(eye, 160, 90, 1080, 640, 0, 0, 96, 60);
    const d = sg.getImageData(0, 0, 96, 60).data;
    const cv = offscreen(864, 540), g = cv.getContext('2d');
    g.fillStyle = '#fff'; g.fillRect(0, 0, 864, 540);
    g.fillStyle = '#000';
    for (let y = 0; y < 60; y++) for (let x = 0; x < 96; x++) {
      const v = d[(y * 96 + x) * 4] / 255, r = Math.sqrt(1 - v) * 5.6;
      if (r > 0.4) { g.beginPath(); g.arc(x * 9 + 4.5 + (y % 2) * 4.5, y * 9 + 4.5, r, 0, TAU); g.fill(); }
    }
    return cv;
  }
  // cut-out ransom letters; n = how many are already pasted, slap = index of the letter landing this frame
  function ransom(g, word, x, y, size, seed, n = 99, slap = -1, fonts = null) {
    let cx = x;
    for (let i = 0; i < word.length; i++) {
      const ch0 = word[i];
      if (ch0 === ' ') { cx += size * 0.4; continue; }
      const hh = k => hash(seed * 31.7 + i * 7.31 + k * 1.93);
      const fi = Math.floor(hh(1) * RF.length), sz = size * (0.8 + hh(2) * 0.42);
      let fi2 = fonts ? fonts[i % fonts.length] : fi; if (ch0 === 'I' && fi2 === 4) fi2 = 1;
      const ch = fi2 === 3 || ((fi2 === 2 || fi2 === 5) && hh(6) < 0.45) ? ch0.toLowerCase() : ch0;
      g.font = RF[fi2](sz);
      const tw = g.measureText(ch).width, pw = tw + sz * (0.14 + hh(7) * 0.12), ph = sz * (1.0 + hh(8) * 0.2);
      if (i < n) {
        const kind = hh(3), rot = (hh(4) - 0.5) * 0.2, dy = (hh(5) - 0.5) * size * 0.16;
        g.save(); g.translate(cx + pw / 2, y + dy);
        g.rotate(rot);
        if (i === slap) g.scale(1.14, 1.14);
        const pts = [[-pw / 2, -ph * 0.78], [pw / 2, -ph * 0.8], [pw / 2 + 3, ph * 0.24], [-pw / 2 - 2, ph * 0.22]];
        roughPoly(g, pts, Math.round(seed * 13 + i * 7), 3.5, 22);
        g.fillStyle = 'rgba(0,0,0,0.6)'; g.save(); g.translate(5, 6); g.fill(); g.restore();
        roughPoly(g, pts, Math.round(seed * 13 + i * 7), 3.5, 22);
        const bgc = kind < 0.52 ? '#fafafa' : kind < 0.84 ? '#0a0a0a' : '#a8a8a8';
        g.fillStyle = bgc; g.fill();
        g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        g.fillStyle = kind < 0.52 || kind >= 0.84 ? '#050505' : '#f5f5f5';
        g.fillText(ch, 0, ph * 0.02);
        g.restore();
      }
      cx += pw + size * 0.035;
    }
    return cx;
  }
  // --- the edit decision list: what is on the glass at time t
  const XT = { scan1: [0, 0.5], scan2: [3.5, 3.875], cover: 6.875, coverScan: [6.875, 7.5], red: 7.75, sticker: 8.125, staples: 8.5 };
  const RANSOM_LINES = [['NOW', 120, 330, 2.0], ['FORM', 120, 590, 2.375], ['A BAND', 120, 860, 2.75]];
  const ransomCount = (tq, t0, word) => { if (tq < t0) return 0; const k = Math.floor((tq - t0) * 8 + 1e-6) * 2 + 2; return Math.min(word.length, k); };
  function paperOriginal(g, rot, dx = 0, dy = 0) {
    g.fillStyle = '#000'; g.fillRect(-50, -50, 2020, 1180);
    g.save(); g.translate(960 + dx, 540 + dy); g.rotate(rot);
    g.fillStyle = '#fff'; g.fillRect(-990, -560, 1970, 1100);
    g.restore();
  }
  function xSpec(t) {
    const tq = Math.floor(t * 8 + 1e-6) / 8, f = Math.round(tq * 8);
    const s = { paper: XP.W, gen: 1, neg: false, cut: 0.5, nz: 0.32, red: null, rOff: [0, 0], bar: null, ahead: null, smear: null, flash: 0, jit: 1.2, f, tq };
    if (t < 1.875) {
      let z = 1, gen = 1;
      if (tq >= 1.0) { z = 1.28; gen = 2; }
      if (tq >= 1.25) { z = 1.6; gen = 3; }
      if (tq >= 1.5) { z = 2.05; gen = 4; }
      s.gen = gen;
      if (tq === 1.0 || tq === 1.25 || tq === 1.5 || tq === 1.625 || tq === 1.75) s.flash = 0.6;
      if (tq >= 1.625) {
        const n = tq >= 1.75 ? 3 : 2;
        s.gen = 1;
        s.draw = (g, st) => {
          g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
          const cw = 1920 / n, ch = 1080 / n;
          for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
            const k = j * n + i;
            g.save(); g.translate(i * cw + cw / 2 + (hash(k + f) - 0.5) * 16, j * ch + ch / 2 + (hash(k * 3 + f) - 0.5) * 12); g.rotate((hash(k * 7) - 0.5) * 0.06);
            g.fillStyle = '#fff'; g.fillRect(-cw / 2 + 8, -ch / 2 + 8, cw - 16, ch - 16);
            g.beginPath(); g.rect(-cw / 2 + 8, -ch / 2 + 8, cw - 16, ch - 16); g.clip();
            g.filter = `contrast(${1 + k * 0.45}) blur(${(k * 0.35).toFixed(2)}px)`;
            const zz = (1 + k * 0.12) * cw / 1100;
            g.drawImage(st.eye, -700 * zz, -400 * zz, 1400 * zz, 800 * zz);
            g.filter = 'none'; g.restore();
          }
        };
      } else {
        s.draw = (g, st) => {
          paperOriginal(g, -0.012 + gen * 0.006, 0, 0);
          g.save(); g.translate(960, 560); g.scale(z * 1.3, z * 1.3); g.rotate((gen - 1) * 0.015);
          g.drawImage(st.eye, -700, -400); g.restore();
        };
      }
      if (t < XT.scan1[1]) { s.bar = lerp(-80, 2000, seg(t, XT.scan1[0], XT.scan1[1])); s.ahead = 'black'; }
      s.jit = tq < 1.0 ? 0.6 : 2.5;
      return s;
    }
    if (t < 4.375) {
      s.paper = XP.PINK;
      s.draw = (g, st) => {
        paperOriginal(g, 0.014, 10, 0);
        g.save(); g.translate(1390, 560); g.rotate(-0.06); g.drawImage(st.mouth, -560, -470, 1120, 920); g.restore();
        RANSOM_LINES.forEach(([w, x, y, t0], li) => {
          const n = ransomCount(tq, t0, w.replace(' ', '')) + (w.includes(' ') && tq >= t0 ? 1 : 0);
          const fresh = tq >= t0 ? Math.floor((tq - t0) * 8 + 1e-6) : -1;
          ransom(g, w, x, y, li === 2 ? 230 : 210, li + 2, n, n < w.length + 1 ? n - 1 : (fresh === 0 ? n - 1 : -1));
        });
        if (tq >= 3.375) { g.strokeStyle = '#000'; g.lineWidth = 16; g.lineCap = 'round'; g.beginPath(); g.moveTo(140, 905); g.bezierCurveTo(400, 880, 640, 935, 900, 890); g.stroke(); }
      };
      s.red = (g, st) => {
        g.fillStyle = '#fff'; g.fillRect(0, 0, 1920, 1080);
        g.save(); g.translate(1390, 560); g.rotate(-0.06); g.filter = 'contrast(2.2) brightness(1.15)'; g.drawImage(st.mouth, -560, -470, 1120, 920); g.filter = 'none'; g.restore();
        if (tq >= 3.375) { g.fillStyle = '#000'; g.beginPath(); g.arc(1660, 210, 120, 0, TAU); g.fill(); }
      };
      s.rOff = [18, -11];
      s.gen = tq >= 4.125 ? 3 : 1;
      if (t >= XT.scan2[0] && t < XT.scan2[1]) { s.bar = lerp(-80, 2000, seg(t, XT.scan2[0], XT.scan2[1])); s.ahead = 'gen'; s.gen = 2; }
      else if (t >= XT.scan2[1] && tq < 4.125) s.gen = 2;
      return s;
    }
    if (t < XT.cover) {
      const cut = Math.floor((tq - 4.375) / 0.25 + 1e-6);
      s.jit = 6;
      s.flash = (tq - 4.375) % 0.25 < 0.01 ? 0.35 : 0;
      const eyeAt = (g, st, z, x = 960, y = 560, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(z, z); g.drawImage(st.eye, -700, -400); g.restore(); };
      const pinAt = (g, st, z, rot, x = 960, y = 540) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(z, z); g.drawImage(st.pin, -650, -280); g.restore(); };
      const mouthAt = (g, st, z, x = 960, y = 540, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(z, z); g.drawImage(st.mouth, -550, -470); g.restore(); };
      switch (cut) {
        case 0: s.paper = XP.YEL; s.draw = (g, st) => { paperOriginal(g, 0.02); pinAt(g, st, 1.35, -0.32); }; break;
        case 1: s.neg = true; s.draw = (g, st) => { paperOriginal(g, -0.01); eyeAt(g, st, 1.8, 900, 560, 0.04); }; break;
        case 2: s.paper = XP.PINK; s.smear = { x: 1240 }; s.draw = (g, st) => { paperOriginal(g, 0.01); mouthAt(g, st, 1.15, 820, 560, 0.05); };
          s.red = (g, st) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 1920, 1080); g.filter = 'contrast(2.5) brightness(1.2)'; mouthAt(g, st, 1.15, 820, 560, 0.05); g.filter = 'none'; }; s.rOff = [-24, 14]; break;
        case 3: s.draw = (g) => {
          g.fillStyle = '#fff'; g.fillRect(0, 0, 1920, 1080);
          for (let j = 0; j < 6; j++) { const inv = j % 2; g.fillStyle = inv ? '#000' : '#fff'; g.fillRect(0, j * 180, 1920, 180); g.fillStyle = inv ? '#fff' : '#000'; g.font = '400 190px Anton'; g.textBaseline = 'middle'; g.fillText('COPY COPY COPY COPY COPY', -((j * 170 + f * 40) % 420), j * 180 + 96); }
        };
          s.red = (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 1920, 1080); g.fillStyle = '#000'; for (let j = 0; j < 6; j += 2) g.fillRect(0, j * 180 + 40, 1920, 100); }; s.rOff = [0, 22]; break;
        case 4: s.paper = XP.PINK; s.gen = 3; s.draw = (g, st) => { paperOriginal(g, -0.03); pinAt(g, st, 2.3, 0.5, 1000, 520); }; break;
        case 5: s.paper = XP.YEL; s.smear = { y: 640 }; s.draw = (g, st) => { paperOriginal(g, 0.0); eyeAt(g, st, 1.25, 960, 520, -0.03); }; break;
        case 6: s.draw = (g, st) => {
          g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
          for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) {
            const k = i + j * 4; g.save(); g.translate(240 + i * 480, 180 + j * 360); g.rotate((hash(k * 3) - 0.5) * 0.08);
            g.beginPath(); g.rect(-226, -168, 452, 336); g.clip(); g.fillStyle = '#fff'; g.fillRect(-226, -168, 452, 336);
            if (k % 2) g.filter = 'invert(1)';
            g.drawImage(st.mouth, -260, -215, 520, 425); g.filter = 'none'; g.restore();
          }
        }; break;
        case 7: s.paper = XP.YEL; s.draw = (g) => { paperOriginal(g, 0.01); ransom(g, 'DIY', 150, 860, 720, 41, 99, -1, [1, 6, 2]); };
          s.red = (g) => { g.fillStyle = '#fff'; g.fillRect(0, 0, 1920, 1080); g.fillStyle = '#000'; g.beginPath(); g.arc(1500, 420, 330, 0, TAU); g.fill(); }; s.rOff = [12, 8]; break;
        case 8: s.paper = XP.PINK; s.gen = 4; s.draw = (g, st) => { paperOriginal(g, -0.02); eyeAt(g, st, 1.4, 960, 520); g.globalCompositeOperation = 'multiply'; pinAt(g, st, 1.6, -0.2, 980, 600); g.globalCompositeOperation = 'source-over'; }; break;
        default: s.paper = XP.PINK; s.gen = 7; s.flash = tq >= 6.75 ? 0.9 : 0.3; s.draw = (g, st) => { paperOriginal(g, -0.02); eyeAt(g, st, 1.4, 960, 520); g.globalCompositeOperation = 'multiply'; pinAt(g, st, 1.6, -0.2, 980, 600); g.globalCompositeOperation = 'source-over'; };
      }
      return s;
    }
    // the cover
    s.paper = XP.YEL; s.jit = 0.8; s.nz = 0.26;
    s.draw = (g, st) => {
      paperOriginal(g, 0.006, 6, 2);
      g.fillStyle = '#000';
      g.font = '400 36px "Special Elite"'; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
      g.fillText('ISSUE No. 7  ·  SPRING 1979  ·  50¢', 96, 104);
      g.fillRect(96, 124, 1730, 5);
      ransom(g, 'GENERATION', 96, 345, 156, 3);
      ransom(g, 'LOSS', 96, 700, 330, 9);
      g.font = '400 42px "Special Elite"';
      g.fillText('a zine about copies of copies', 104, 800);
      g.fillText('— printed on a borrowed machine —', 104, 856);
      g.fillRect(96, 905, 790, 112);
      g.fillStyle = '#fff'; g.font = '400 84px Anton'; g.fillText('XEROX MOTION', 128, 994);
      g.save(); g.translate(1460, 690); g.rotate(0.035);
      g.fillStyle = '#000'; g.fillRect(-372, -292, 744, 584);
      g.drawImage(st.half, -360, -280, 720, 560);
      g.fillStyle = 'rgba(170,170,170,0.75)'; g.save(); g.translate(-300, -280); g.rotate(-0.5); g.fillRect(-90, -26, 180, 52); g.restore();
      g.restore();
      g.strokeStyle = '#000'; g.lineWidth = 10; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(860, 760); g.bezierCurveTo(930, 800, 1000, 790, 1062, 752); g.stroke();
      g.beginPath(); g.moveTo(1026, 734); g.lineTo(1066, 750); g.lineTo(1040, 786); g.stroke();
    };
    if (t >= XT.red) {
      s.red = (g) => {
        g.fillStyle = '#fff'; g.fillRect(0, 0, 1920, 1080);
        g.save(); g.translate(6, 2); g.rotate(0.006);
        ransom(g, 'LOSS', 96, 700, 330, 9);
        g.restore();
        g.fillStyle = '#000'; g.fillRect(1100, 380, 760, 34);
        if (t >= XT.sticker) {
          const sc = Math.floor(t * 8 + 1e-6) / 8 === XT.sticker ? 1.15 : 1;
          g.save(); g.translate(1765, 255); g.rotate(-0.2); g.scale(sc, sc);
          g.beginPath(); for (let k = 0; k < 28; k++) { const a = k / 28 * TAU, r = k % 2 ? 128 : 150; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fillStyle = '#000'; g.fill();
          g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '400 64px "Rubik Mono One"'; g.fillText('No7', 0, 8); g.font = '400 30px "Special Elite"'; g.fillText('PUNK · ART', 0, 56);
          g.restore();
        }
      };
      s.rOff = [11, 7];
    }
    if (t >= XT.coverScan[0] && t < XT.coverScan[1]) { s.bar = lerp(-80, 2000, seg(t, XT.coverScan[0], XT.coverScan[1])); s.ahead = 'black'; }
    return s;
  }
  function xThreshold(st, d, mask, cut, nz, off) {
    const NZ = st.NZ, LF = st.LF;
    for (let i = 0, j = 0; i < SN; i++, j += 4) {
      const v = d[j] * 0.00392 + (NZ[(i + off) % NL] - 0.5) * nz + (LF[i] - 0.5) * 0.14;
      mask[i] = v < cut ? 1 : 0;
    }
  }
  function xRegen(st, mask, k, f) {
    const td = st.tImg.data;
    for (let i = 0, j = 0; i < SN; i++, j += 4) { const v = mask[i] ? 0 : 255; td[j] = td[j + 1] = td[j + 2] = v; td[j + 3] = 255; }
    st.gT.putImageData(st.tImg, 0, 0);
    const g = st.gX2;
    g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.fillStyle = '#fff'; g.fillRect(0, 0, SW2, SH2);
    g.filter = `blur(${(0.75 + k * 0.12).toFixed(2)}px)`;
    g.translate(480, 270); g.rotate((hash(f * 3 + k) - 0.5) * 0.008); g.scale(1.008, 1.008); g.translate(-480 + (hash(k * 7 + f) - 0.5) * 3, -270 + (hash(k * 5 + f) - 0.5) * 3);
    g.drawImage(st.T, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none';
    xThreshold(st, g.getImageData(0, 0, SW2, SH2).data, mask, 0.55, 0.2, (f * 7919 + k * 104729) % 9973);
  }
  function xSmear(d, sm) {
    if (sm.x) {
      const xs = Math.round(sm.x / 2);
      for (let y = 0; y < SH2; y++) { const yy = clamp(y + Math.round(vnoise(y * 0.05, 4) * 3), 0, SH2 - 1); for (let x = xs; x < SW2; x++) { const sx = xs + Math.floor((x - xs) * 0.03), j = (y * SW2 + x) * 4, k = (yy * SW2 + sx) * 4; d[j] = d[j + 1] = d[j + 2] = d[k]; } }
    } else {
      const ys = Math.round(sm.y / 2);
      for (let y = ys; y < SH2; y++) { const sy = ys + Math.floor((y - ys) * 0.05); for (let x = 0; x < SW2; x++) { const xx = clamp(x + Math.round(vnoise(x * 0.04, 6) * 2), 0, SW2 - 1), j = (y * SW2 + x) * 4, k = (sy * SW2 + xx) * 4; d[j] = d[j + 1] = d[j + 2] = d[k]; } }
    }
  }

  MG.film({
    id: 'xerox',
    dur: 10,
    poster: 9.4,
    fonts: [['400 40px "Special Elite"', 'ISSUE No.7 SPRING 1979 50¢ azine'], ['700 40px UnifrakturCook', 'GENRATOLSBDNWFMIYlook'], ['400 40px "Abril Fatface"', 'GENRATOLSBDNWFMIY'], ['400 40px "Rubik Mono One"', 'GENRATOLSBDNWFMIYNo7'], ['400 40px Anton', 'XEROX MOTIONCPY'], ['900 40px "Playfair Display"', 'GENRATOLSBDNWFMIY'], ['900 40px Archivo', 'GENRATOLSBDNWFMIY'], ['800 40px "JetBrains Mono"', 'GENRATOLSBDNWFMIY']],
    meta: {
      family: 'F', name: 'Xerox Motion', sub: 'Photocopy Zine', era: '1976 —',
      origin: 'Punk flyers and fanzines were cut, pasted and run through office photocopiers. Designers later animated the copier\'s own defects: toner noise, light-bar streaks, misregistration and generation loss.',
      works: 'Sniffin\' Glue (Mark Perry, 1976) · Sex Pistols graphics (Jamie Reid, 1977) · Search & Destroy (V. Vale, 1977) · Black Flag flyers (Raymond Pettibon, late 1970s)',
      tech: ['1-bit threshold + toner noise', 'Copy-of-a-copy generation loss', 'Ransom-note cut-and-paste type'],
      accent: '#f5d90a',
      motionDNA: 'Choppy 8 fps cuts, copier light-bar sweeps and images that degrade a little more with every copy.',
      visualDNA: 'Black toner on coloured paper, misregistered spot colour, speckle, streaks and crooked paste-ups.',
      transitions: 'Light-bar scan, generation-loss cut, scan smear, negative flip',
      implementation: ['Photocopier + scanner', 'After Effects', 'Canvas 2D (procedural homage)'],
      reproducibility: 'Needs physical capture (this film is a procedural homage)',
      loopable: false,
    },
    setup() {
      const NZ = new Float32Array(NL), LF = new Float32Array(SN), r = rng(1979);
      for (let i = 0; i < NL; i++) { const x = i % SW2, y = (i / SW2) | 0; NZ[i] = 0.6 * r() + 0.4 * h2(x >> 1, y >> 1, 4); }
      for (let y = 0; y < SH2; y++) for (let x = 0; x < SW2; x++) LF[y * SW2 + x] = fbm2(x / 90, y / 90, 8, 3);
      const [X, gX] = canvasRW(SW2, SH2), [R, gR] = canvasRW(SW2, SH2), [T, gT] = canvasRW(SW2, SH2), [X2, gX2] = canvasRW(SW2, SH2), [O, gO] = canvasRW(SW2, SH2);
      const eye = xEye();
      return {
        NZ, LF, X, gX, R, gR, T, gT, X2, gX2, O, gO, tImg: gT.createImageData(SW2, SH2), out: gO.createImageData(SW2, SH2),
        km: new Uint8Array(SN), ka: new Uint8Array(SN), rm: new Uint8Array(SN),
        eye, mouth: xMouth(), pin: xPin(), half: xHalftone(eye),
      };
    },
    draw(c, t, W, H, st) {
      const s = xSpec(t), f = s.f;
      const prep = (g, fn) => {
        g.setTransform(1, 0, 0, 1, 0, 0); g.filter = 'none'; g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
        g.fillStyle = '#fff'; g.fillRect(0, 0, SW2, SH2);
        g.setTransform(0.5, 0, 0, 0.5, 0, 0);
        g.translate(960, 540); g.rotate((hash(f * 1.3) - 0.5) * 0.006 * s.jit); g.translate(-960 + (hash(f * 2.1) - 0.5) * s.jit * 4, -540 + (hash(f * 3.7) - 0.5) * s.jit * 4);
        fn(g, st);
        g.setTransform(1, 0, 0, 1, 0, 0);
      };
      prep(st.gX, s.draw);
      const d = st.gX.getImageData(0, 0, SW2, SH2).data;
      if (s.smear) xSmear(d, s.smear);
      xThreshold(st, d, st.km, s.cut, s.nz, (f * 7919) % 9973);
      if (s.ahead === 'gen') st.ka.set(st.km);
      for (let k = 1; k < s.gen; k++) xRegen(st, st.km, k, f);
      let hasRed = false;
      if (s.red) {
        prep(st.gR, s.red);
        xThreshold(st, st.gR.getImageData(0, 0, SW2, SH2).data, st.rm, 0.5, 0.3, (f * 3571 + 5000) % 9973);
        hasRed = true;
      }
      // compose toner + spot colour on paper
      const o = st.out.data, km = st.km, ka = st.ka, rm = st.rm, NZ = st.NZ, LF = st.LF;
      const bx = s.bar === null ? 99999 : s.bar / 2, [pr, pg, pb] = s.paper;
      const rox = Math.round(s.rOff[0] / 2), roy = Math.round(s.rOff[1] / 2), neg = s.neg;
      const nOff = (f * 131) % 9973;
      for (let y = 0, i = 0; y < SH2; y++) {
        for (let x = 0; x < SW2; x++, i++) {
          const j = i * 4;
          let k;
          if (x > bx) { if (s.ahead === 'black') { o[j] = o[j + 1] = o[j + 2] = 8; o[j + 3] = 255; continue; } k = ka[i]; } else k = km[i];
          if (neg) k = 1 - k;
          if ((x === 123 || x === 124 || x === 611) && NZ[(i + nOff) % NL] > 0.3) k = 1;
          const pp = 0.93 + 0.07 * LF[i];
          let r = pr * pp, g = pg * pp, b = pb * pp;
          if (hasRed) {
            const xx = x - rox, yy = y - roy;
            if (xx >= 0 && yy >= 0 && xx < SW2 && yy < SH2 && rm[yy * SW2 + xx]) { r = r * RED[0] / 255; g = g * RED[1] / 255; b = b * RED[2] / 255; }
          }
          if (k) { const tv = 16 + NZ[(i * 3 + nOff) % NL] * 22; r = tv; g = tv * 0.96; b = tv * 1.02; }
          o[j] = r; o[j + 1] = g; o[j + 2] = b; o[j + 3] = 255;
        }
      }
      st.gO.putImageData(st.out, 0, 0);
      c.imageSmoothingEnabled = false;
      c.drawImage(st.O, 0, 0, W, H);
      c.imageSmoothingEnabled = true;
      // real staples on the finished zine
      if (t >= XT.staples) {
        [300, 760].forEach((y, i) => {
          const fresh = Math.floor(t * 8 + 1e-6) / 8 === XT.staples + (i ? 0.125 : 0);
          if (t < XT.staples + i * 0.125) return;
          c.save(); c.translate(54, y);
          c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(-7, -58 + 5, 18, 122);
          const gr = c.createLinearGradient(-8, 0, 10, 0); gr.addColorStop(0, '#7d7f84'); gr.addColorStop(0.4, '#f2f3f5'); gr.addColorStop(1, '#5e6066');
          c.fillStyle = gr; c.fillRect(-8, -60, 14, 120);
          c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(-8, -60, 14, 6); c.fillRect(-8, 54, 14, 6);
          if (fresh) { c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(-30, -90, 60, 180); }
          c.restore();
        });
      }
      // copier light bar
      const bar = (x, a) => {
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
        const gr = c.createLinearGradient(x - 300, 0, x + 300, 0);
        gr.addColorStop(0, 'rgba(40,255,170,0)'); gr.addColorStop(0.38, 'rgba(70,255,190,0.16)'); gr.addColorStop(0.5, 'rgba(225,255,240,0.95)'); gr.addColorStop(0.62, 'rgba(70,255,190,0.16)'); gr.addColorStop(1, 'rgba(40,255,170,0)');
        c.fillStyle = gr; c.fillRect(x - 300, 0, 600, H);
        c.fillStyle = 'rgba(255,255,255,0.95)'; c.fillRect(x - 7, 0, 14, H);
        c.restore();
      };
      if (s.bar !== null) bar(s.bar, 1);
      if (s.flash > 0) {
        bar(200 + hash(f * 5.1) * 1500, s.flash);
        c.fillStyle = `rgba(220,255,235,${s.flash * 0.35})`; c.fillRect(0, 0, W, H);
      }
      grain(c, W, H, t, 0.06);
      vignette(c, W, H, 0.22, '20,10,10');
    },
    score(A) {
      const motor = (t, d, g = 0.05) => { A.osc(t, { type: 'sawtooth', f: 58, dur: d, g, lp: 320, hold: true, rel: 0.1 }); A.noise(t, { type: 'bandpass', f: 900, q: 3, dur: d, g: g * 0.8, hold: true, rel: 0.1 }); };
      const clunk = (t, g = 0.5) => { A.osc(t, { f: 120, f2: 50, glide: 0.08, dur: 0.16, g }); A.noise(t, { type: 'bandpass', f: 2200, q: 1.5, dur: 0.035, g: g * 0.5 }); A.noise(t + 0.03, { type: 'lowpass', f: 600, dur: 0.1, g: g * 0.4 }); };
      const scan = (t, d, g = 0.14) => { A.noise(t, { type: 'bandpass', f: 500, f2: 2600, sweep: d, q: 2.5, dur: d, g, hold: true, rel: 0.06 }); A.osc(t, { type: 'triangle', f: 1300, f2: 1750, glide: d, dur: d, g: g * 0.22, hold: true, rel: 0.05 }); };
      const slap = (t, g = 0.3) => { A.noise(t, { type: 'bandpass', f: 2600, q: 0.9, dur: 0.05, g }); A.noise(t, { type: 'lowpass', f: 400, dur: 0.05, g: g * 0.6 }); };
      const snip = (t) => { A.noise(t, { type: 'highpass', f: 5000, dur: 0.02, g: 0.12 }); A.noise(t + 0.05, { type: 'highpass', f: 4200, dur: 0.025, g: 0.12 }); };
      // copy 1 — the eye
      clunk(0.0, 0.45); motor(0.0, 1.9, 0.045); scan(0.02, 0.48, 0.16);
      [1.0, 1.25, 1.5, 1.625, 1.75].forEach((t, i) => { clunk(t, 0.32 + i * 0.03); A.noise(t + 0.01, { type: 'bandpass', f: 1400 + i * 300, f2: 3500, q: 2, dur: 0.1, g: 0.1 }); });
      // paste-up
      motor(1.9, 2.4, 0.03);
      clunk(1.875, 0.4);
      RANSOM_LINES.forEach(([w, , , t0]) => { const n = w.replace(' ', '').length; for (let k = 0; k < Math.ceil(n / 2); k++) { snip(t0 + k * 0.125 - 0.06); slap(t0 + k * 0.125, 0.3); } });
      A.noise(3.375, { type: 'bandpass', f: 1200, f2: 3000, q: 1.5, dur: 0.18, g: 0.12 });
      clunk(3.5, 0.4); scan(3.5, 0.375, 0.14);
      clunk(4.125, 0.3);
      // climax — a 240 bpm punk thrash locked to the 8 fps grid
      const chords = [[40, 47, 52], [40, 47, 52], [45, 52, 57], [43, 50, 55], [40, 47, 52], [45, 52, 57], [47, 54, 59], [45, 52, 57], [40, 47, 52], [40, 47, 52]];
      for (let k = 0; k < 20; k++) {
        const t = 4.375 + k * 0.125;
        if (k % 2 === 0) A.kick(t, 0.5); else A.snare(t, 0.32, { f: 1800, gated: true, dur: 0.1 });
        A.hat(t + 0.0625, 0.05);
        A.chord(t, chords[Math.floor(k / 2)], { type: 'sawtooth', dur: 0.12, g: 0.03, lp: 2600, crush: true, a: 0.003, spread: 12 });
        A.osc(t, { type: 'square', f: midi(chords[Math.floor(k / 2)][0] - 12), dur: 0.11, g: 0.05, lp: 500 });
      }
      for (let k = 0; k < 10; k++) clunk(4.375 + k * 0.25, 0.18);
      A.riser(6.0, 0.85, { g: 0.08, f: 220 });
      A.noise(6.75, { type: 'highpass', f: 3000, dur: 0.15, g: 0.12 });
      // the cover prints
      clunk(6.875, 0.55); motor(6.875, 3.0, 0.04); scan(6.875, 0.625, 0.17);
      A.impact(7.75, 0.42, { rev: 0.3 }); slap(7.75, 0.35);
      slap(8.125, 0.3); A.osc(8.125, { f: 180, f2: 90, dur: 0.1, g: 0.15 });
      [8.5, 8.625].forEach(t => { A.osc(t, { f: 3200, f2: 2400, dur: 0.05, g: 0.08 }); A.noise(t, { type: 'bandpass', f: 4000, q: 2, dur: 0.04, g: 0.2 }); A.osc(t, { f: 160, f2: 70, dur: 0.08, g: 0.3 }); });
      A.whoosh(8.9, 0.4, { f1: 800, f2: 2400, g: 0.06 });
      [9.15, 9.35].forEach(t => A.osc(t, { type: 'square', f: 1975, dur: 0.11, g: 0.035, lp: 4000, hold: true, rel: 0.01 }));
    },
  });
})();
