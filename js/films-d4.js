/* batch d4 — Family I: Cultural & Regional. Ukiyo-e · Ink Wash 水墨 · Islamic Geometry. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, offscreen, roughPoly, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@700;900&family=Yuji+Syuku&family=Zhi+Mang+Xing&family=Noto+Serif+SC:wght@900&display=block');
  const PI = Math.PI;

  /* =====================================================================
     UKIYO-E — a woodblock print pulled block by block, then the wave breaks
     ===================================================================== */
  const UK = {
    paper: '#ece0c3', margin: '#f1e8d2', foam: '#f9f3e3', key: '#1d1b22',
    pru: '#1f3d6c', pruD: '#162c50', pru2: '#3a64a0', pale: '#86a7c6', pale2: '#c3d3dc',
    sky: '#dccaa0', fuji: '#7f97b0', fujiD: '#4f6a8c', ochre: '#c99f62', ochreD: '#8d6a3c', red: '#b5382a', cloud: '#f0e6cd',
  };
  const IMG = { x: 44, y: 38, w: 1920 - 88, h: 1080 - 96 };

  // Spine of a curling wave: a rising bezier wall that becomes a log spiral. Returns [x,y,w,nx,ny] samples.
  function waveSpine(o) {
    const pts = [];
    const S = [o.cx - o.R, o.cy];
    const tl = Math.hypot(o.k, 1), dS = [o.k / tl, -1 / tl];
    const L = o.ay - S[1];
    const c1 = [o.ax + 0.6 * (S[0] - o.ax), o.ay - 0.06 * L], c2 = [S[0] - dS[0] * 0.5 * L, S[1] - dS[1] * 0.5 * L];
    const N1 = 26;
    for (let i = 0; i < N1; i++) {
      const u = i / N1, v = 1 - u;
      const x = v * v * v * o.ax + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * S[0];
      const y = v * v * v * o.ay + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * S[1];
      pts.push([x, y, lerp(o.wB, o.wC, E.ioS(u))]);
    }
    const N2 = 70;
    for (let i = 0; i <= N2; i++) {
      const u = i / N2, th = PI + (o.curl - PI) * u, r = o.R * Math.exp(-o.k * (th - PI));
      pts.push([o.cx + Math.cos(th) * r, o.cy + Math.sin(th) * r, o.wC * Math.pow(1 - u, 0.85) * (1 + 0.15 * Math.sin(u * PI))]);
    }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      pts[i].push(dy / l, -dx / l); // outward (left of travel)
    }
    pts.n1 = N1;
    return pts;
  }
  const off = (p, f) => [p[0] + p[3] * p[2] * f, p[1] + p[4] * p[2] * f];

  // One wave: body, stripes, foam, claws. mode: 'blue' | 'light' | 'key'
  function drawWave(c, o, mode, t, seed) {
    const sp = waveSpine(o), n = sp.length;
    const out = sp.map(p => off(p, 0.5)), inn = sp.map(p => off(p, -0.5));
    const body = () => {
      c.beginPath();
      c.moveTo(out[0][0], out[0][1]);
      for (let i = 1; i < n; i++) c.lineTo(out[i][0], out[i][1]);
      for (let i = n - 1; i >= 0; i--) c.lineTo(inn[i][0], inn[i][1]);
      c.lineTo(inn[0][0], o.floor); c.lineTo(o.backX, o.floor); c.lineTo(o.backX, o.backY);
      c.quadraticCurveTo(lerp(o.backX, out[0][0], 0.6), o.backY - 10, out[0][0], out[0][1]);
      c.closePath();
    };
    // foam band along the outer lip, lobed inner edge
    const f0 = Math.floor(sp.n1 + (n - sp.n1) * 0.08);
    const foamPath = () => {
      c.beginPath();
      for (let i = f0; i < n; i++) i === f0 ? c.moveTo(out[i][0], out[i][1]) : c.lineTo(out[i][0], out[i][1]);
      for (let i = n - 1; i >= f0; i--) {
        const u = (i - f0) / (n - f0), ph = i * 0.62 + seed, lob = 0.62 + 0.38 * Math.sqrt(Math.abs(Math.sin(ph)));
        const fw = sp[i][2] * (0.1 + 0.3 * Math.sin(Math.min(1, u * 1.3) * PI * 0.5)) * lob;
        c.lineTo(out[i][0] - sp[i][3] * fw, out[i][1] - sp[i][4] * fw);
      }
      c.closePath();
    };
    if (mode === 'blue') {
      body();
      const g = c.createLinearGradient(0, o.cy - o.R, 0, o.floor);
      g.addColorStop(0, UK.pru2); g.addColorStop(0.35, UK.pru); g.addColorStop(1, UK.pruD);
      c.fillStyle = g; c.fill();
    }
    if (mode === 'light') {
      // pale streaks that follow the body (the "fingers" of the wave)
      c.save(); body(); c.clip();
      const r = rng(seed * 31 + 5);
      for (let s = 0; s < 9; s++) {
        const f = 0.42 - s * 0.1 + (r() - 0.5) * 0.04, a = Math.floor(r() * n * 0.35), b = Math.min(n - 2, a + Math.floor(n * (0.45 + r() * 0.4)));
        const maxw = o.wC * (0.03 + r() * 0.035);
        c.beginPath();
        for (let i = a; i <= b; i++) { const u = (i - a) / (b - a), q = off(sp[i], f), w = maxw * Math.sin(u * PI); i === a ? c.moveTo(q[0] + sp[i][3] * w, q[1] + sp[i][4] * w) : c.lineTo(q[0] + sp[i][3] * w, q[1] + sp[i][4] * w); }
        for (let i = b; i >= a; i--) { const u = (i - a) / (b - a), q = off(sp[i], f), w = maxw * Math.sin(u * PI); c.lineTo(q[0] - sp[i][3] * w, q[1] - sp[i][4] * w); }
        c.closePath();
        c.fillStyle = s % 3 === 0 ? UK.pale2 : UK.pale; c.fill();
      }
      c.restore();
      foamPath(); c.fillStyle = UK.foam; c.fill();
    }
    if (mode === 'key') {
      c.strokeStyle = UK.key; c.lineJoin = 'round'; c.lineCap = 'round';
      c.lineWidth = 3.4 * o.s; body(); c.stroke();
      c.lineWidth = 2.4 * o.s; foamPath(); c.stroke();
    }
    // claws: hooked foam fingers along the lip, reaching forward along the curl (bare paper = keyblock pass)
    const cg = o.claw;
    if (mode === 'key') {
      const r = rng(seed * 7 + 1);
      const tal = (i, h) => {
        const P = out[i];
        const dx = sp[Math.min(n - 1, i + 1)][0] - sp[i][0], dy = sp[Math.min(n - 1, i + 1)][1] - sp[i][1], l = Math.hypot(dx, dy) || 1, d = [dx / l, dy / l], nn = [sp[i][3], sp[i][4]];
        talon(c, P, d, nn, h, o.s, r);
      };
      // small crests riding the back of the wave
      if (o.backCrests) [0.42, 0.74].forEach(f => { const i1 = Math.floor(sp.n1 * f); for (let i = 0; i < 3; i++) tal(i1 + i, (12 + i * 6) * o.s); });
      if (cg > 0.01) {
        const i0 = Math.floor(sp.n1 + (n - sp.n1) * 0.3);
        let acc = 1e9;
        for (let i = i0; i < n - 1; i++) {
          const u = (i - i0) / (n - i0);
          const h = (22 + 66 * Math.pow(u, 0.7)) * (0.8 + r() * 0.4) * o.s * cg * (1 + 0.05 * Math.sin(t * 5 + i));
          acc += Math.hypot(sp[i + 1][0] - sp[i][0], sp[i + 1][1] - sp[i][1]);
          if (acc < h * 0.5) continue;
          acc = 0;
          tal(i, h);
        }
        // the breaking tip: a cluster of talons fanning down
        const P = out[n - 1], tp = sp[n - 1];
        for (let k = 0; k < 3; k++) {
          const a = Math.atan2(tp[4], tp[3]) + 0.5 - k * 0.55 + 0.06 * Math.sin(t * 4 + k);
          const nn = [Math.cos(a), Math.sin(a)], d = [-nn[1], nn[0]];
          talon(c, [P[0] + nn[0] * 4, P[1] + nn[1] * 4], d, nn, (64 + 18 * (k % 2)) * o.s * cg, o.s, r);
        }
      }
    }
    return { sp, out, inn };
  }
  // one finger of foam: a hooked claw that splits into smaller talons at its tip
  function claw(c, P, d, n, h, s) {
    // a thorn of foam: bulges outward, then hooks forward to a sharp point
    const b = h * 0.26, ca = Math.cos(0.95), sa = Math.sin(0.95);
    const td = [n[0] * ca + d[0] * sa, n[1] * ca + d[1] * sa];
    const tip = [P[0] + td[0] * h, P[1] + td[1] * h];
    c.beginPath();
    c.moveTo(P[0] - d[0] * b, P[1] - d[1] * b);
    c.bezierCurveTo(P[0] + n[0] * h * 0.75 - d[0] * h * 0.3, P[1] + n[1] * h * 0.75 - d[1] * h * 0.3, tip[0] + n[0] * h * 0.25, tip[1] + n[1] * h * 0.25, tip[0], tip[1]);
    c.bezierCurveTo(tip[0] - n[0] * h * 0.05 - d[0] * h * 0.25, tip[1] - n[1] * h * 0.05 - d[1] * h * 0.25, P[0] + n[0] * h * 0.3 + d[0] * h * 0.3, P[1] + n[1] * h * 0.3 + d[1] * h * 0.3, P[0] + d[0] * b, P[1] + d[1] * b);
    c.closePath();
    c.fillStyle = UK.foam; c.fill();
    c.strokeStyle = UK.key; c.lineWidth = Math.max(1.3, Math.min(2.4, h * 0.06)) * Math.max(0.7, s); c.stroke();
  }
  function talon(c, P, d, n, h, s, r) {
    const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
    if (h >= 18) {
      // smaller thorns fanning ahead of the finger, like a hand of talons (behind it)
      [[0.55, 0.55, 0.55], [0.8, 0.38, 1.0]].forEach(([at, k, a]) => {
        const Q = [P[0] + n[0] * h * 0.5 * at + d[0] * h * 0.3 * at, P[1] + n[1] * h * 0.5 * at + d[1] * h * 0.3 * at];
        claw(c, Q, rot(d, a), rot(n, a), h * k * (0.85 + r() * 0.3), s);
      });
    }
    claw(c, P, d, n, h, s);
  }
  // oshiokuri-bune: long slender fast boat, rowers hunched low over their oars
  function boat(c, x, y, ang, len, mode, rowers) {
    c.save(); c.translate(x, y); c.rotate(ang);
    const hull = () => {
      c.beginPath();
      c.moveTo(-len / 2, -12);
      c.quadraticCurveTo(0, -2, len / 2 + 22, -24);
      c.quadraticCurveTo(len / 2 - 6, 8, len * 0.32, 13);
      c.lineTo(-len * 0.43, 12);
      c.quadraticCurveTo(-len / 2 - 4, 4, -len / 2, -12);
      c.closePath();
    };
    const rx = k => -len * 0.38 + k * (len * 0.72 / (rowers - 1)), ry = k => -7 - (rx(k) / len) * 5;
    const rw = () => {
      c.beginPath();
      for (let k = 0; k < rowers; k++) {
        const X = rx(k), Y = ry(k);
        c.moveTo(X - 12, Y); c.quadraticCurveTo(X - 9, Y - 15, X + 1, Y - 15); c.quadraticCurveTo(X + 11, Y - 14, X + 12, Y); c.closePath();
      }
    };
    if (mode === 'blue') { rw(); c.fillStyle = UK.pru2; c.fill(); }
    if (mode === 'light') {
      hull(); c.fillStyle = UK.ochre; c.fill();
      c.fillStyle = UK.ochreD; c.beginPath(); c.moveTo(-len * 0.44, 2); c.quadraticCurveTo(0, 6, len * 0.42, -6); c.lineTo(len * 0.4, -1); c.quadraticCurveTo(0, 11, -len * 0.43, 7); c.fill();
    }
    if (mode === 'key') {
      c.strokeStyle = UK.key; c.lineJoin = 'round'; c.lineCap = 'round';
      c.lineWidth = 1.6;
      c.beginPath();
      for (let k = 0; k < rowers; k++) { const X = rx(k) + 6, Y = ry(k) - 8; c.moveTo(X, Y); c.lineTo(X + 34, Y + 46); }
      c.stroke();
      c.lineWidth = 2.4; rw(); c.stroke(); hull(); c.stroke();
      for (let k = 0; k < rowers; k++) { c.fillStyle = UK.foam; c.beginPath(); c.arc(rx(k) + 9, ry(k) - 12, 3.6, 0, TAU); c.fill(); c.lineWidth = 1.4; c.stroke(); }
    }
    c.restore();
  }
  function fuji(c, x, y, mode) {
    const w = 250, h = 184;
    const mtn = () => {
      c.beginPath(); c.moveTo(x - w, y);
      c.quadraticCurveTo(x - w * 0.35, y - h * 0.45, x - 18, y - h);
      c.lineTo(x + 18, y - h);
      c.quadraticCurveTo(x + w * 0.35, y - h * 0.45, x + w, y);
      c.closePath();
    };
    const cap = () => {
      c.beginPath(); c.moveTo(x - 18, y - h); c.lineTo(x + 18, y - h);
      const pts = [[0.42, 0.5], [0.33, 0.62], [0.24, 0.44], [0.15, 0.6], [0.06, 0.4], [-0.04, 0.58], [-0.14, 0.42], [-0.23, 0.6], [-0.32, 0.46], [-0.42, 0.52]];
      c.lineTo(x + w * 0.2, y - h * 0.72);
      pts.forEach(([u, v]) => c.lineTo(x + w * u * (1 - v * 0.5), y - h * (1 - v * 0.62)));
      c.lineTo(x - w * 0.2, y - h * 0.72);
      c.closePath();
    };
    if (mode === 'blue') { mtn(); const g = c.createLinearGradient(0, y - h, 0, y); g.addColorStop(0, UK.fujiD); g.addColorStop(1, UK.pru); c.fillStyle = g; c.fill(); }
    if (mode === 'light') { cap(); c.fillStyle = UK.foam; c.fill(); }
    if (mode === 'key') {
      c.strokeStyle = UK.key; c.lineWidth = 2.6;
      c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w * 0.35, y - h * 0.45, x - 18, y - h); c.lineTo(x + 18, y - h); c.quadraticCurveTo(x + w * 0.35, y - h * 0.45, x + w, y); c.stroke();
      cap(); c.stroke();
    }
  }
  function cloudBand(c, x, y, len, mode) {
    const lob = () => {
      c.beginPath();
      c.moveTo(x, y);
      const k = Math.round(len / 70);
      for (let i = 0; i < k; i++) { const x0 = x + i * len / k, x1 = x + (i + 1) * len / k; c.quadraticCurveTo((x0 + x1) / 2, y - 26 - 10 * (i % 2), x1, y); }
      for (let i = k; i > 0; i--) { const x0 = x + i * len / k, x1 = x + (i - 1) * len / k; c.quadraticCurveTo((x0 + x1) / 2, y + 14, x1, y + 6); }
      c.closePath();
    };
    if (mode === 'light') { lob(); c.fillStyle = UK.cloud; c.fill(); }
    if (mode === 'key') { lob(); c.strokeStyle = UK.key; c.lineWidth = 2; c.stroke(); }
  }

  function ukScene(c, t, st, L) {
    const grow = kf(t, [[1.0, 0.28], [3.2, 0.62, E.ioS], [4.6, 0.7, E.lin], [5.55, 1, E.inQ]]);
    const breathe = Math.sin(t * 1.6) * 0.01 * seg(t, 5.6, 6.5);
    const curl = lerp(1.25 * PI, 2.36 * PI, grow) + breathe * PI;
    const clawG = E.outB(seg(t, 4.5, 5.7), 2.0);
    const W = 1920, H = 1080;
    // sky: Prussian bokashi wiped down from the top, warm band at the horizon
    L(mode => {
      if (mode === 'blue') {
        const g = c.createLinearGradient(0, IMG.y, 0, 330);
        g.addColorStop(0, '#1d4686'); g.addColorStop(0.35, 'rgba(36,80,150,0.55)'); g.addColorStop(1, 'rgba(36,80,150,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, 340);
      }
      if (mode === 'light') {
        const g = c.createLinearGradient(0, 560, 0, 860);
        g.addColorStop(0, 'rgba(220,202,160,0)'); g.addColorStop(0.75, UK.sky); g.addColorStop(1, '#cfb98b');
        c.fillStyle = g; c.fillRect(0, 560, W, 300);
      }
    });
    L(m => { cloudBand(c, 1380, 772, 380, m); cloudBand(c, 930, 792, 260, m); });
    L(m => fuji(c, 1250, 880, m));
    const tr = (x) => 850 + 12 * Math.sin(x * 0.012 + t * 1.3) + 9 * Math.sin(x * 0.031 - t * 2);
    // background wave (right)
    const back = { cx: 1600, cy: 712, R: 80, k: 0.26, curl: lerp(1.3 * PI, 2.25 * PI, kf(t, [[2.0, 0], [3.6, 1, E.inQ]])), ax: 1360, ay: 900, wB: 130, wC: 62, s: 0.5, claw: E.outB(seg(t, 3.3, 3.8), 2) * 0.8, floor: H + 40, backX: 1300, backY: 900 };
    L(m => { const g2 = drawWave(c, back, m, t, 3); st.lip2 = g2.out; });
    // trough sea
    const sea = () => { c.beginPath(); c.moveTo(300, H + 40); for (let x = 300; x <= W + 20; x += 20) c.lineTo(x, tr(x)); c.lineTo(W + 20, H + 40); c.closePath(); };
    L(mode => {
      if (mode === 'blue') { const g = c.createLinearGradient(0, 830, 0, H); g.addColorStop(0, UK.pru2); g.addColorStop(1, UK.pruD); sea(); c.fillStyle = g; c.fill(); }
      if (mode === 'light') {
        c.save(); sea(); c.clip(); c.lineCap = 'round';
        const r = rng(91);
        for (let k = 0; k < 34; k++) {
          const y0 = 870 + r() * 200, x0 = 300 + r() * 1700, len = 120 + r() * 260, amp = 6 + r() * 10, ph = r() * 6;
          c.strokeStyle = r() < 0.3 ? UK.pale2 : UK.pale; c.lineWidth = 2 + r() * 2.5;
          c.beginPath();
          for (let x = 0; x <= len; x += 12) { const y = y0 - amp * Math.sin(x / len * PI) + 3 * Math.sin(x * 0.05 + t * 1.5 + ph); x ? c.lineTo(x0 + x, y) : c.moveTo(x0 + x, y); }
          c.stroke();
        }
        c.restore();
      }
      if (mode === 'key') {
        c.strokeStyle = UK.key; c.lineWidth = 3; c.beginPath(); for (let x = 500; x <= W + 20; x += 20) x === 500 ? c.moveTo(x, tr(x)) : c.lineTo(x, tr(x)); c.stroke();
        const r = rng(77);
        for (let x = 640; x < W; x += 95 + r() * 60) {
          const y = tr(x), sl = (tr(x + 4) - tr(x - 4)) / 8, a = Math.atan(sl), d = [-Math.cos(a), -Math.sin(a)], nn = [d[1], -d[0]];
          for (let k = 0; k < 3; k++) claw(c, [x - k * 10 * d[0] * -1, y + k * 2], d, [-nn[0], -nn[1]], 12 - k * 2.5, 0.6);
        }
      }
    });
    const rk = (p, a) => a * Math.sin(t * 1.9 + p);
    L(m => boat(c, 1480, tr(1480) + 8 + rk(1, 6), -0.12 + rk(2, 0.07), 290, m, 7));
    L(m => boat(c, 1060 + rk(0.5, 8), tr(1060) + 40 + rk(0.2, 6), 0.3 + rk(0.7, 0.06), 330, m, 8));
    // the great wave
    const big = { cx: lerp(820, 905, grow), cy: lerp(580, 440, grow), R: lerp(170, 238, grow), k: 0.15, curl, ax: -80, ay: 1000, wB: lerp(440, 600, grow), wC: lerp(180, 265, grow), s: 1, claw: clawG, backCrests: true, floor: H + 40, backX: -40, backY: lerp(820, 760, grow) };
    let g;
    L(m => { g = drawWave(c, big, m, t, 1); });
    // foreground small wave, left, shaped like Fuji
    const fg = { cx: 520, cy: 930, R: 64, k: 0.24, curl: lerp(1.35 * PI, 2.3 * PI, E.ioS(seg(t, 1.8, 5.4))), ax: 290, ay: 1070, wB: 120, wC: 54, s: 0.55, claw: clawG * 0.9, floor: H + 40, backX: 200, backY: 1070 };
    L(m => drawWave(c, fg, m, t, 5));
    L(m => boat(c, 300 + rk(1.4, 6), 1005 + rk(2.2, 5), -0.2 + rk(1.1, 0.06), 300, m, 7));
    st.lip = g && g.out;
  }

  MG.film({
    id: 'ukiyoe', dur: 10, poster: 9.4,
    fonts: [['900 80px "Noto Serif JP"', '冨嶽三十六景浮世'], ['700 40px "Noto Serif JP"', '神奈川沖浪裏'], ['400 40px "Yuji Syuku"', '北斎改為一筆']],
    meta: {
      family: 'I', name: 'Ukiyo-e Motion', sub: 'Woodblock Prints', era: '1670s —',
      origin: 'Edo-period Japan’s “pictures of the floating world”: a keyblock of black outlines is carved, then one block per colour is inked and rubbed onto damp washi with a baren, so every print is a stack of flat, registered colour layers. Hokusai and Hiroshige made imported Prussian blue and the graded bokashi wipe the look of the 1830s landscape print.',
      works: 'Under the Wave off Kanagawa (Hokusai, c.1831) · Thirty-six Views of Mount Fuji (Hokusai, 1830–32) · Sudden Shower over Shin-Ōhashi Bridge and Atake (Hiroshige, 1857) · One Hundred Famous Views of Edo (Hiroshige, 1856–58)',
      tech: ['Keyblock + colour-block layers', 'Prussian-blue bokashi', 'Woodgrain & washi texture'],
      accent: '#1f3d6c',
      motionDNA: 'The image is pulled block by block like a real print, then moves only in held, graphic poses: the wave curls into its claw-foam peak, boats rock, Hiroshige rain slashes across and the seal lands.',
      visualDNA: 'Flat registered colour inside confident black keyblock lines, Prussian blue graded into bare paper, with woodgrain and fibre showing through the ink.',
      transitions: 'Block-by-block print pull, registration settle, rain veil, seal stamp',
      implementation: ['After Effects', 'Canvas 2D', 'Procreate'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      // washi + woodgrain multiply map (half res)
      const TW = 960, TH = 540, tex = offscreen(TW, TH), g = tex.getContext('2d'), id = g.createImageData(TW, TH), d = id.data, r = rng(41);
      for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
        const yy = y + 34 * vnoise(x * 0.0022, 2) + 5 * vnoise(x * 0.013, 3);
        const sp = 7 + 4 * (vnoise(yy * 0.03, 8) * 0.5 + 0.5), ph = yy / sp, fr = ph - Math.floor(ph);
        const ring = Math.pow(Math.max(0, 1 - Math.abs(fr - 0.5) * 4), 2) * (0.35 + 0.65 * (vnoise(Math.floor(ph) * 1.7 + x * 0.004, 9) * 0.5 + 0.5));
        const mott = 0.045 * (vnoise(x * 0.012 + vnoise(y * 0.015, 6) * 3, 7) * 0.5 + 0.5);
        const v = 255 * (1 - ring * 0.07 - mott - r() * 0.03);
        const i = (y * TW + x) * 4; d[i] = v; d[i + 1] = v * 0.985; d[i + 2] = v * 0.96; d[i + 3] = 255;
      }
      g.putImageData(id, 0, 0);
      const fib = offscreen(1920, 1080), gf = fib.getContext('2d');
      for (let k = 0; k < 420; k++) {
        const x = r() * 1920, y = r() * 1080, a = r() * TAU, l = 6 + r() * 26;
        gf.strokeStyle = r() < 0.5 ? 'rgba(255,250,235,0.16)' : 'rgba(110,85,50,0.08)'; gf.lineWidth = 0.6 + r() * 0.8;
        gf.beginPath(); gf.moveTo(x, y); gf.quadraticCurveTo(x + Math.cos(a) * l / 2 + 3, y + Math.sin(a) * l / 2, x + Math.cos(a) * l, y + Math.sin(a) * l); gf.stroke();
      }
      const rain = Array.from({ length: 260 }, (_, i) => ({ x: r() * 2600 - 300, y: r() * 1400, l: 120 + r() * 420, set: i % 3 === 0 ? 1 : 0, w: 1 + r() * 1.3 }));
      const spray = Array.from({ length: 190 }, () => ({ u: r(), tb: 5.3 + r() * 1.1, vx: 30 + r() * 220, vy: -60 - r() * 240, r: 2 + r() * r() * 7 }));
      return { tex, fib, rain, spray };
    },
    draw(c, t, W, H, st) {
      c.fillStyle = UK.margin; c.fillRect(0, 0, W, H);
      // camera: slow push towards the crest, a jolt on the break
      const push = 1 + 0.045 * E.ioS(seg(t, 1.8, 6.4));
      const jolt = t > 5.55 ? 7 * Math.exp(-(t - 5.55) * 9) * Math.sin((t - 5.55) * 70) : 0;
      // print reveal: each block is "pulled" with a slanted sweep (keyblock first)
      const pull = [E.ioC(seg(t, 0.0, 0.9)), E.ioC(seg(t, 0.95, 1.75)), E.ioC(seg(t, 1.65, 2.45))];
      const reg = k => 6 * (1 - spring(t - (0.95 + k * 0.7) - 0.4, 2.5, 0.5));
      const clipPull = p => { const X = p * (W + 600) - 300; c.beginPath(); c.moveTo(-10, -10); c.lineTo(X + 160, -10); c.lineTo(X - 160, H + 10); c.lineTo(-10, H + 10); c.closePath(); c.clip(); };
      c.save();
      c.beginPath(); c.rect(IMG.x, IMG.y, IMG.w, IMG.h); c.clip();
      c.fillStyle = UK.paper; c.fillRect(0, 0, W, H);
      c.translate(W / 2 + jolt * 0.4, H / 2 + jolt); c.scale(push, push); c.translate(-W / 2 - 40 * (push - 1) * 20, -H / 2 - 30 * (push - 1) * 20);
      const order = { blue: 1, light: 2, key: 0 };
      const L = fn => ['blue', 'light', 'key'].forEach(m => {
        const k = order[m]; if (pull[k] <= 0) return;
        c.save(); if (pull[k] < 1) clipPull(pull[k]); if (k) c.translate(reg(k - 1), reg(k - 1) * 0.5);
        fn(m); c.restore();
      });
      ukScene(c, t, st, L);
      if (t > 3.55 && t < 6 && st.lip2) {
        const lip = st.lip2, i0 = Math.floor(lip.length * 0.6);
        for (let k = 0; k < 40; k++) {
          const a = t - 3.55 - hash(k) * 0.3; if (a < 0 || a > 1.8) continue;
          const q = lip[i0 + Math.floor(hash(k * 3.3) * (lip.length - i0 - 1))];
          const x = q[0] + (20 + hash(k * 5.1) * 110) * a, y = q[1] - (40 + hash(k * 7.7) * 140) * a + 200 * a * a;
          c.globalAlpha = 1 - seg(a, 1.2, 1.8); c.fillStyle = UK.foam; c.beginPath(); c.arc(x, y, 1.5 + hash(k * 9.1) * 3.5, 0, TAU); c.fill(); c.globalAlpha = 1;
        }
      }
      // spray off the crest — falls like snow over Fuji
      if (t > 5.2 && st.lip) {
        const lip = st.lip, i0 = Math.floor(lip.length * 0.62);
        st.spray.forEach(p => {
          const a = t - p.tb; if (a < 0 || a > 3.2) return;
          const q = lip[i0 + Math.floor(p.u * (lip.length - i0 - 1))];
          const x = q[0] + p.vx * a, y = q[1] + p.vy * a + 260 * a * a;
          const al = 1 - seg(a, 2.4, 3.2);
          c.globalAlpha = al; c.fillStyle = UK.foam; c.beginPath(); c.arc(x, y, p.r, 0, TAU); c.fill(); c.globalAlpha = 1;
        });
      }
      c.restore();
      // Hiroshige rain + ink bokashi at the top of the sky
      const rainA = seg(t, 6.0, 6.7) * (1 - 0.55 * seg(t, 8.2, 9.2));
      c.save(); c.beginPath(); c.rect(IMG.x, IMG.y, IMG.w, IMG.h); c.clip();
      if (rainA > 0) {
        const g = c.createLinearGradient(0, IMG.y, 0, 380);
        g.addColorStop(0, `rgba(22,24,32,${0.72 * rainA})`); g.addColorStop(1, 'rgba(22,24,32,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, 400);
        c.lineCap = 'butt';
        st.rain.forEach((d, i) => {
          if (hash(i * 3.1) > rainA) return;
          const ang = d.set ? 1.25 : 1.36, dx = Math.cos(ang), dy = Math.sin(ang), v = d.set ? 1500 : 1900;
          const sft = (t * v + d.y) % 1700;
          const x = d.x + dx * sft - 300 * dx, y = -300 + dy * sft;
          c.strokeStyle = d.set ? 'rgba(40,44,58,0.55)' : 'rgba(25,26,34,0.7)'; c.lineWidth = d.w;
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + dx * d.l, y + dy * d.l); c.stroke();
        });
      }
      c.restore();
      // paper: woodgrain/mottle multiply + fibres, then the print border & kento marks
      c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.9; c.drawImage(st.tex, 0, 0, W, H); c.restore();
      c.drawImage(st.fib, 0, 0);
      // paper-lift shadow at the pull edge
      pull.forEach(p => {
        if (p <= 0 || p >= 1) return;
        const X = p * (W + 600) - 300;
        c.save(); c.translate(X, H / 2); c.transform(1, 0, -320 / H, 1, 0, 0);
        const g = c.createLinearGradient(0, 0, 60, 0); g.addColorStop(0, 'rgba(60,40,20,0.28)'); g.addColorStop(1, 'rgba(60,40,20,0)');
        c.fillStyle = g; c.fillRect(0, -H, 60, H * 2);
        c.fillStyle = 'rgba(255,250,235,0.6)'; c.fillRect(-3, -H, 3, H * 2);
        c.restore();
      });
      if (pull[0] > 0) {
        c.save(); clipPull(pull[0]);
        c.strokeStyle = UK.key; c.lineWidth = 3; c.strokeRect(IMG.x, IMG.y, IMG.w, IMG.h);
        c.lineWidth = 2; c.beginPath();
        c.moveTo(W - 120, H - 26); c.lineTo(W - 44, H - 26); c.lineTo(W - 44, H - 50);  // kagi kentō
        c.moveTo(150, H - 26); c.lineTo(330, H - 26);                                // hikitsuke
        c.stroke();
        c.restore();
      }
      // cartouche + signature + seal
      const ca = seg(t, 7.95, 8.15);
      if (ca > 0) {
        const s = lerp(1.06, 1, E.outQt(ca));
        c.save(); c.translate(150, 300); c.scale(s, s); c.globalAlpha = ca;
        c.fillStyle = '#e9dcb6'; c.fillRect(-46, -230, 92, 470);
        c.fillStyle = 'rgba(181,56,42,0.0)';
        c.strokeStyle = UK.key; c.lineWidth = 3; c.strokeRect(-46, -230, 92, 470); c.lineWidth = 1.5; c.strokeRect(-39, -223, 78, 456);
        [...'冨嶽三十六景'].forEach((ch, i) => text(c, ch, 0, -186 + i * 60, { font: '"Noto Serif JP", serif', weight: 900, size: 50, align: 'center', base: 'middle', color: UK.key }));
        c.fillStyle = UK.pale2; c.fillRect(-36, 160, 72, 72); c.strokeRect(-36, 160, 72, 72);
        text(c, '神奈川', 0, 182, { font: '"Noto Serif JP", serif', weight: 700, size: 20, align: 'center', base: 'middle', color: UK.key });
        text(c, '沖浪裏', 0, 210, { font: '"Noto Serif JP", serif', weight: 700, size: 20, align: 'center', base: 'middle', color: UK.key });
        c.restore();
      }
      const sa = seg(t, 8.25, 8.5);
      if (sa > 0) {
        c.save(); c.globalAlpha = sa;
        [...'北斎改為一筆'].forEach((ch, i) => text(c, ch, 236, 108 + i * 40, { font: '"Yuji Syuku", serif', size: 34, align: 'center', base: 'middle', color: UK.key }));
        c.restore();
      }
      if (t >= 8.7) {
        const s = lerp(1.6, 1, E.outQt(seg(t, 8.7, 8.82)));
        c.save(); c.translate(236, 386); c.scale(s, s); c.rotate(0.02);
        roughPoly(c, [[-26, -40], [26, -40], [26, 40], [-26, 40]], 9, 1.6, 10); c.fillStyle = UK.red; c.globalAlpha = 0.92; c.fill();
        c.globalAlpha = 1;
        text(c, '浮', 0, -17, { font: '"Noto Serif JP", serif', weight: 900, size: 30, align: 'center', base: 'middle', color: '#f4e7cf' });
        text(c, '世', 0, 18, { font: '"Noto Serif JP", serif', weight: 900, size: 30, align: 'center', base: 'middle', color: '#f4e7cf' });
        c.restore();
      }
      grain(c, W, H, t, 0.05, 'multiply');
      vignette(c, W, H, 0.22, '70,50,20');
    },
    score(A) {
      const KO = [50, 51, 55, 57, 58, 62, 63, 67, 69, 70, 74, 75];   // miyako-bushi on D
      const koto = (t, m, o = {}) => A.pluck(t, midi(m), { dur: 2.2, g: 0.3, bright: 0.9, decay: 0.9965, rev: 0.35, ...o });
      const thock = (t, g = 0.4) => { A.osc(t, { f: 560, dur: 0.06, g: g * 0.5, type: 'triangle' }); A.noise(t, { type: 'bandpass', f: 1300, q: 3, dur: 0.05, g: g * 0.6 }); A.osc(t, { f: 95, f2: 60, glide: 0.12, dur: 0.22, g }); };
      const taiko = (t, g = 0.6) => { A.osc(t, { f: 105, f2: 52, glide: 0.35, dur: 1.3, g, a: 0.003 }); A.noise(t, { type: 'lowpass', f: 380, dur: 0.18, g: g * 0.5 }); A.osc(t, { f: 210, f2: 140, dur: 0.08, g: g * 0.25, type: 'triangle' }); };
      const shaku = (t, m, dur, o = {}) => {
        const f = midi(m);
        A.osc(t, { f: f * (o.from || 0.97), f2: f, glide: o.glide ?? 0.28, dur, g: o.g ?? 0.11, a: o.a ?? 0.12, hold: true, rel: o.rel ?? 0.5, vib: [5.2, f * 0.006], rev: 0.5, pan: -0.15 });
        A.osc(t, { f: f * 2, dur, g: (o.g ?? 0.11) * 0.12, a: 0.2, hold: true, rel: 0.4, vib: [5.2, f * 0.012], rev: 0.5 });
        A.noise(t, { type: 'bandpass', f: f * 2.2, q: 2.2, dur, g: (o.g ?? 0.11) * 0.45, a: 0.06, hold: true, rel: 0.4, rev: 0.4 });
        A.noise(t, { type: 'bandpass', f: 1800, q: 0.8, dur: 0.18, g: 0.05 });       // muraiki breath attack
      };
      // three blocks pulled: thock + baren rub
      [0.15, 0.95, 1.65].forEach((t, i) => {
        thock(t, 0.42 - i * 0.05);
        for (let k = 0; k < 9; k++) A.noise(t + 0.1 + k * 0.085, { type: 'bandpass', f: 900 + hash(k + i * 9) * 700, q: 1.2, dur: 0.09, g: 0.035, pan: (k / 9 - 0.5) * 0.8 });
      });
      koto(0.2, 50, { g: 0.32 }); koto(1.0, 57); koto(1.7, 62);
      // sukui glissando as the colour lands
      for (let k = 0; k < 9; k++) koto(2.35 + k * 0.045, KO[k + 2], { g: 0.18, dur: 1.6, pan: (k / 9 - 0.5) * 0.9 });
      shaku(2.7, 62, 1.5, { from: 0.94 }); shaku(4.1, 63, 0.7); shaku(4.75, 67, 0.95, { from: 0.95, g: 0.12 });
      A.osc(1.2, { f: midi(38), dur: 4.6, g: 0.07, a: 1.6, hold: true, rel: 0.6, type: 'triangle', lp: 400 });
      // the swell builds, taiko roll accelerates into the break
      A.noise(3.4, { type: 'lowpass', f: 180, f2: 1400, sweep: 2.2, dur: 2.3, g: 0.22, swell: 0.95, rev: 0.3 });
      [3.6, 4.2, 4.65, 4.95, 5.15, 5.28, 5.38, 5.46].forEach((t, i) => taiko(t, 0.22 + i * 0.04));
      A.noise(3.58, { type: 'lowpass', f: 3000, f2: 400, sweep: 1, dur: 1.2, g: 0.12, rev: 0.5, pan: 0.5 }); koto(3.6, 74, { g: 0.18, pan: 0.5 });
      taiko(5.55, 0.85); A.impact(5.55, 0.5);
      A.noise(5.55, { type: 'lowpass', f: 5000, f2: 300, sweep: 2.2, dur: 2.4, g: 0.3, rev: 0.6 });
      A.noise(5.6, { type: 'highpass', f: 3000, dur: 1.2, g: 0.06, rev: 0.5 });
      for (let k = 0; k < 6; k++) koto(5.58 + k * 0.03, [50, 57, 62, 63, 69, 74][k], { g: 0.2, dur: 2.6 });
      // rain veil + koto melody
      A.noise(6.0, { type: 'highpass', f: 2800, dur: 3.3, g: 0.07, a: 0.6, hold: true, rel: 1.2, rev: 0.2 });
      A.noise(6.0, { type: 'bandpass', f: 6500, q: 0.7, dur: 3.3, g: 0.035, a: 0.6, hold: true, rel: 1.2 });
      for (let k = 0; k < 22; k++) A.noise(6.1 + hash(k * 2.3) * 2.8, { type: 'bandpass', f: 3000 + hash(k) * 3000, q: 6, dur: 0.02, g: 0.04, pan: hash(k + 4) - 0.5 });
      [[6.3, 69], [6.75, 67], [7.05, 63], [7.4, 62, 1.06], [7.95, 58], [8.25, 57]].forEach(([t, m, b]) => koto(t, m, b ? { bend: b, bendAt: 0.2, bendT: 0.18 } : {}));
      shaku(6.5, 74, 1.4, { g: 0.08, from: 0.96 });
      // hyōshigi clap for the cartouche, taiko + koto chord for the seal
      [7.95, 8.1].forEach(t => { A.osc(t, { f: 1900, dur: 0.035, g: 0.18, type: 'triangle' }); A.noise(t, { type: 'bandpass', f: 2500, q: 5, dur: 0.05, g: 0.22, rev: 0.6 }); });
      taiko(8.7, 0.6); A.noise(8.7, { type: 'lowpass', f: 900, dur: 0.12, g: 0.15 });
      [50, 57, 62, 69, 74].forEach((m, k) => koto(8.72 + k * 0.06, m, { g: 0.2, dur: 2.2, pan: (k / 4 - 0.5) * 0.6 }));
      shaku(8.8, 62, 1.15, { g: 0.09, from: 0.95, rel: 0.8 });
    },
  });

  /* =====================================================================
     INK WASH 水墨 — one drop on wet xuan paper becomes tadpoles, then a
     whole shan shui landscape rises out of the mist as the camera pulls out
     ===================================================================== */
  const INK = { paper: '#f1ece0', ink: '20,19,16', red: '#b02a20' };
  const ink = a => `rgba(${INK.ink},${a})`;
  const ID = [960, 962];            // where the drop lands (world = final framing)
  // ridge profile y(x) for a peak/range
  function ridgeFn(o) {
    return x => {
      const u = (x - o.x0) / (o.x1 - o.x0);
      if (u <= 0 || u >= 1) return o.base + 40;
      const env = o.flat ? Math.pow(1 - Math.pow(Math.abs(2 * u - 1), o.flat), 0.5) : Math.pow(Math.sin(PI * u), o.p || 1.2);
      return o.base - o.h * env * (0.8 + 0.2 * vnoise(x * (o.f1 || 0.008), o.seed)) - o.h * 0.05 * vnoise(x * 0.045, o.seed + 3) * env;
    };
  }
  // dry brush: a stroke made of separate bristles that skip where the brush runs dry (飞白)
  function bristle(g, pts, w, a, r, dry = 0.35, nb = 9) {
    g.lineCap = 'round';
    for (let b = 0; b < nb; b++) {
      const o = (b / (nb - 1) - 0.5) * w, seed = r() * 100, ba = a * (0.45 + r() * 0.55);
      g.strokeStyle = ink(ba); g.lineWidth = Math.max(0.6, w / nb * (0.8 + r() * 0.9));
      g.beginPath(); let on = false;
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], pp = pts[Math.max(0, i - 1)];
        const dx = q[0] - pp[0], dy = q[1] - pp[1], l = Math.hypot(dx, dy) || 1;
        const u = i / (pts.length - 1), taper = Math.sin(Math.min(1, u * 1.2 + 0.08) * PI * 0.5 + 0.0) * (1 - u * 0.3);
        const x = p[0] - dy / l * o * taper, y = p[1] + dx / l * o * taper;
        const skip = vnoise(i * 0.35 + seed, seed) > 1 - dry * 2 * (0.3 + u);
        if (skip) { on = false; continue; }
        on ? g.lineTo(x, y) : g.moveTo(x, y); on = true;
      }
      g.stroke();
    }
  }
  // paint one mountain mass into g: bleed halo, graded wash, texture strokes (cun), ridge line, moss dots
  function paintPeak(g0, o, r) {
    // paint on a scratch canvas, then feather the left/right edges so no straight side ever shows
    const tmp = offscreen(g0.canvas.width, g0.canvas.height), g = tmp.getContext('2d');
    const R = paintPeakRaw(g, o, r);
    const span = o.x1 - o.x0, fw = span * 0.22;
    const hg = g.createLinearGradient(o.x0, 0, o.x1, 0);
    hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(fw / span, 'rgba(0,0,0,1)'); hg.addColorStop(1 - fw / span, 'rgba(0,0,0,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalCompositeOperation = 'destination-in'; g.fillStyle = hg; g.fillRect(0, 0, tmp.width, tmp.height);
    g0.drawImage(tmp, 0, 0);
    return R;
  }
  function paintPeakRaw(g, o, r) {
    const R = ridgeFn(o), fade = o.fade || 260;
    const path = () => { g.beginPath(); g.moveTo(o.x0, o.base + fade); for (let x = o.x0; x <= o.x1; x += 4) g.lineTo(x, R(x)); g.lineTo(o.x1, o.base + fade); g.closePath(); };
    const top = o.base - o.h;
    const grad = (a) => { const gr = g.createLinearGradient(0, top, 0, o.base + fade * 0.6); gr.addColorStop(0, ink(a)); gr.addColorStop(0.45, ink(a * 0.55)); gr.addColorStop(1, ink(0)); return gr; };
    g.save(); g.filter = `blur(${o.halo || 10}px)`; path(); g.fillStyle = grad(o.a * 0.35); g.fill(); g.restore();
    g.save(); g.filter = 'blur(1.6px)'; path(); g.fillStyle = grad(o.a * 0.6); g.fill(); g.restore();
    // inner faces: offset sub-ridges give the stacked, monumental structure
    for (let k = 0; k < (o.faces || 0); k++) {
      const fx0 = lerp(o.x0, o.x1, 0.08 + r() * 0.5), fx1 = fx0 + (o.x1 - o.x0) * (0.25 + r() * 0.3);
      const fo = { x0: fx0, x1: Math.min(o.x1, fx1), base: o.base, h: o.h * (0.4 + r() * 0.35), seed: o.seed + 10 + k, flat: 1.3 + r() * 0.8, f1: 0.02 };
      const FR = ridgeFn(fo);
      g.save(); path(); g.clip(); g.filter = 'blur(2.5px)';
      g.beginPath(); g.moveTo(fo.x0, o.base + fade); for (let x = fo.x0; x <= fo.x1; x += 4) g.lineTo(x, FR(x)); g.lineTo(fo.x1, o.base + fade); g.closePath();
      const gr = g.createLinearGradient(0, o.base - fo.h, 0, o.base + fade * 0.4); gr.addColorStop(0, ink(o.a * 0.4)); gr.addColorStop(1, ink(0)); g.fillStyle = gr; g.fill();
      g.filter = 'blur(0.8px)';
      const fp = []; for (let x = fo.x0 + (fo.x1 - fo.x0) * 0.2; x <= fo.x1 - (fo.x1 - fo.x0) * 0.25; x += 6) fp.push([x, FR(x)]);
      if (fp.length > 3) bristle(g, fp, 3, o.a * 0.35, r, 0.45, 4);
      g.restore();
    }
    // tonal wash dabs: the "five colours" of ink inside one mass
    g.save(); path(); g.clip(); g.filter = 'blur(7px)';
    for (let k = 0; k < (o.dabs || 0); k++) {
      const x = o.x0 + r() * (o.x1 - o.x0), y = R(x) + r() * (o.base - R(x)) * 0.8;
      g.fillStyle = ink(o.a * (0.06 + r() * 0.14)); g.beginPath(); g.ellipse(x, y, 20 + r() * 50, 30 + r() * 80, 0, 0, TAU); g.fill();
    }
    g.restore();
    // cun: raindrop dabs (Fan Kuan) or hemp-fibre strokes, densest under the ridge
    g.save(); path(); g.clip();
    g.lineCap = 'round'; g.filter = 'blur(0.7px)';
    for (let k = 0; k < (o.cun || 0); k++) {
      const x = o.x0 + r() * (o.x1 - o.x0), ry = R(x), span = o.base + fade * 0.3 - ry, depth = Math.pow(r(), 1.9) * span, y = ry + depth;
      const df = depth / (span + 1);
      const a = o.a * (0.6 - df * 0.6) * (0.3 + r() * 0.7) * (0.6 + 0.4 * (vnoise(x * 0.02 + y * 0.01, o.seed + 40) * 0.5 + 0.5));
      if (a <= 0.02) continue;
      g.strokeStyle = ink(a); g.fillStyle = ink(a);
      if (o.hemp) {
        const l = 10 + r() * 22, sl = (R(x + 6) - R(x - 6)) / 12;
        g.lineWidth = 0.7 + r() * 1.1; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l * 0.3, y + l * 0.3 + sl * l * 0.3, x + l * 0.2 * Math.sign(sl || 1), y + l); g.stroke();
      } else { g.beginPath(); g.ellipse(x, y, 0.9 + r() * 1.3, 1.6 + r() * 2.6, (r() - 0.5) * 0.3, 0, TAU); g.fill(); }
    }
    g.filter = 'none';
    // vertical crevices
    for (let k = 0; k < (o.crev || 0); k++) {
      let x = o.x0 + (0.12 + r() * 0.76) * (o.x1 - o.x0), y = R(x) + 20 + r() * 120;
      const len = (o.base - y) * (0.25 + r() * 0.45), pts = [];
      for (let s2 = 0; s2 < len; s2 += 8) { x += (r() - 0.5) * 4; pts.push([x, y + s2]); }
      if (pts.length > 3) bristle(g, pts, 3 + r() * 4, o.a * (0.35 + r() * 0.3), r, 0.4, 5);
    }
    g.restore();
    // ridge line, dry brush: several thin offset passes
    for (let pass = 0; pass < 3; pass++) {
      g.strokeStyle = ink(o.a * (0.5 - pass * 0.12)); g.lineWidth = 2.6 - pass * 0.6;
      g.beginPath();
      let on = false;
      for (let x = o.x0 + 6; x <= o.x1 - 6; x += 3) {
        const gap = vnoise(x * 0.03 + pass * 7, o.seed + 20) > 0.55;
        const y = R(x) + pass * 1.6 + vnoise(x * 0.1, pass + o.seed) * 1.2;
        if (gap) { on = false; continue; }
        on ? g.lineTo(x, y) : g.moveTo(x, y); on = true;
      }
      g.stroke();
    }
    // moss dots and summit trees
    for (let k = 0; k < (o.moss || 0); k++) {
      const x = o.x0 + (0.04 + r() * 0.92) * (o.x1 - o.x0), y = R(x) + r() * r() * 40;
      g.fillStyle = ink(o.a * (0.5 + r() * 0.45));
      g.beginPath(); g.ellipse(x, y, 1.6 + r() * 3, 1.2 + r() * 2.2, r() * PI, 0, TAU); g.fill();
    }
    for (let k = 0; k < (o.trees || 0); k++) {
      const x = o.x0 + (0.06 + r() * 0.88) * (o.x1 - o.x0), y = R(x) + 3, h = 8 + r() * 14;
      g.strokeStyle = ink(o.a * 0.7); g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(x, y + 2); g.lineTo(x + (r() - 0.5) * 3, y - h); g.stroke();
      for (let d = 0; d < 9; d++) { g.fillStyle = ink(o.a * (0.35 + r() * 0.55)); g.beginPath(); g.ellipse(x + (r() - 0.5) * 12, y - h * (0.4 + r() * 0.7), 1.5 + r() * 2.6, 1.2 + r() * 1.8, r() * PI, 0, TAU); g.fill(); }
    }
    return R;
  }
  function paintPine(g, x, y, h, lean, a, r) {
    const pts = [];
    for (let k = 0; k <= 24; k++) { const u = k / 24; pts.push([x + lean * h * u * u + Math.sin(u * 4 + 1) * 10, y - h * u]); }
    g.save(); g.filter = 'blur(0.6px)';
    bristle(g, pts, 13, a * 0.9, r, 0.18, 8);
    g.lineWidth = 1.2;
    for (let k = 0; k < 18; k++) { const q = pts[Math.floor(r() * 20)]; g.strokeStyle = ink(a * 0.55); g.beginPath(); g.ellipse(q[0] + (r() - 0.5) * 7, q[1], 3.5, 2.2, r(), 0, TAU); g.stroke(); }
    g.restore();
    // branches end in dense needle wheels over a soft foliage wash
    const clusters = [];
    for (let b = 0; b < 5; b++) {
      const q = pts[10 + b * 3], side = b % 2 ? 1 : -1, len = 34 + r() * 40;
      const ex = q[0] + side * len, ey = q[1] - 8 - r() * 16;
      g.strokeStyle = ink(a * 0.85); g.lineWidth = 3.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(q[0], q[1]); g.quadraticCurveTo((q[0] + ex) / 2, q[1] + 6, ex, ey); g.stroke();
      clusters.push([ex, ey], [lerp(q[0], ex, 0.5), lerp(q[1], ey, 0.5) - 6]);
    }
    clusters.push([pts[24][0], pts[24][1] - 4]);
    g.save(); g.filter = 'blur(6px)';
    clusters.forEach(([cx, cy]) => { g.fillStyle = ink(a * 0.22); g.beginPath(); g.ellipse(cx, cy - 4, 34, 15, 0, 0, TAU); g.fill(); });
    g.restore();
    clusters.forEach(([cx, cy]) => {
      for (let w = 0; w < 3; w++) {
        const ox = cx + (w - 1) * 16 + (r() - 0.5) * 6, oy = cy - (w === 1 ? 7 : 0);
        g.strokeStyle = ink(a * (0.6 + r() * 0.3)); g.lineWidth = 1.2;
        g.beginPath();
        for (let n = 0; n < 15; n++) { const ang = -PI - 0.15 + n * (PI + 0.3) / 14; g.moveTo(ox, oy + 3); g.lineTo(ox + Math.cos(ang) * 17, oy + 3 + Math.sin(ang) * 11); }
        g.stroke();
      }
    });
  }
  function paintRock(g, pts, a, r, seed) {
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), top = Math.min(...ys), bot = Math.max(...ys);
    const shape = () => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); };
    g.save();
    g.filter = 'blur(6px)'; shape(); g.fillStyle = ink(a * 0.16); g.fill();
    shape(); g.clip();
    const gr = g.createLinearGradient(0, top, 0, bot); gr.addColorStop(0, ink(a * 0.6)); gr.addColorStop(0.35, ink(a * 0.3)); gr.addColorStop(1, ink(a * 0.06));
    g.filter = 'blur(2px)'; g.fillStyle = gr; g.fillRect(x0 - 20, top - 20, x1 - x0 + 40, bot - top + 40);
    // big wet axe-cut dabs, then dry bristle sweeps
    g.filter = 'blur(3px)';
    for (let k = 0; k < 16; k++) {
      const x = lerp(x0, x1, r()), y = lerp(top, bot, Math.pow(r(), 1.5));
      g.fillStyle = ink(a * (0.1 + r() * 0.2)); g.save(); g.translate(x, y); g.rotate(0.9 + (r() - 0.5) * 0.4);
      g.beginPath(); g.ellipse(0, 0, 40 + r() * 70, 9 + r() * 14, 0, 0, TAU); g.fill(); g.restore();
    }
    g.filter = 'none';
    for (let k = 0; k < 34; k++) {
      const x = lerp(x0, x1, r()), y = lerp(top, bot, Math.pow(r(), 2)), l = 22 + r() * 46, ang = 0.7 + r() * 0.9, bend = (r() - 0.5) * 0.8;
      const sp = []; for (let q = 0; q <= 8; q++) { const u = q / 8, aa = ang + bend * u; sp.push([x - Math.cos(aa) * l * u, y + Math.sin(aa) * l * u]); }
      bristle(g, sp, 6 + r() * 10, a * (0.2 + r() * 0.3), r, 0.5, 7);
    }
    g.restore();
    // contour: wet, heavy, bristled
    const ct = [];
    for (let i = 0; i < pts.length - 1; i++) for (let q = 0; q < 6; q++) ct.push([lerp(pts[i][0], pts[i + 1][0], q / 6), lerp(pts[i][1], pts[i + 1][1], q / 6) + vnoise((i * 6 + q) * 0.4, seed) * 3]);
    g.save(); g.filter = 'blur(1.2px)'; bristle(g, ct, 9, a * 0.9, r, 0.22, 7); g.restore();
  }

  MG.film({
    id: 'inkwash', dur: 10, poster: 9.5,
    fonts: [['400 80px "Zhi Mang Xing"', '山静似太古'], ['900 40px "Noto Serif SC"', '水墨']],
    meta: {
      family: 'I', name: 'Ink Wash 水墨', sub: 'Shan Shui Animation', era: '1960 —',
      origin: 'Chinese shan shui (“mountain-water”) painting builds a landscape from graded ink on absorbent xuan paper, leaving empty paper as mist and water. In 1960 the Shanghai Animation Film Studio found a way to animate it, layering ink-wash cels so tadpoles, fish and mountains bleed and breathe on screen.',
      works: 'Travellers among Mountains and Streams (Fan Kuan, c.1000) · Where Is Mama (Shanghai Animation Film Studio, 1960) · The Cowherd’s Flute (Te Wei, 1963) · Feelings of Mountains and Waters (Te Wei, 1988)',
      tech: ['Wet-paper ink bleed', 'Graded ink & dry-brush cun', 'Negative space as mist'],
      accent: '#2b2a26',
      motionDNA: 'Slow and breathing: ink blooms and settles, tadpoles flick, and the landscape condenses out of mist as the camera drifts back; nothing cuts.',
      visualDNA: 'Monochrome ink from charcoal to the palest grey, soft bleeding edges on fibrous paper, half the frame left empty, with one red seal.',
      transitions: 'Ink bloom, mist dissolve, pull-back reveal, brush-written inscription',
      implementation: ['Layered ink-wash cels', 'Canvas 2D', 'TVPaint / After Effects'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const r = rng(1960), W = 1920, H = 1080;
      // xuan paper: warm off-white, cloudy pulp and long fibres
      const paper = offscreen(W, H), gp = paper.getContext('2d');
      gp.fillStyle = INK.paper; gp.fillRect(0, 0, W, H);
      const cl = offscreen(240, 135), gc = cl.getContext('2d'), cd = gc.createImageData(240, 135);
      for (let y = 0; y < 135; y++) for (let x = 0; x < 240; x++) {
        const v = vnoise(x * 0.05 + vnoise(y * 0.04, 3) * 2, 1) * 0.5 + vnoise(x * 0.17 + y * 0.13, 2) * 0.3;
        const i = (y * 240 + x) * 4; cd.data[i] = 150; cd.data[i + 1] = 135; cd.data[i + 2] = 105; cd.data[i + 3] = Math.max(0, v) * 40;
      }
      gc.putImageData(cd, 0, 0);
      gp.globalAlpha = 0.5; gp.drawImage(cl, 0, 0, W, H); gp.globalAlpha = 1;
      for (let k = 0; k < 1500; k++) {
        const x = r() * W, y = r() * H, a = r() * TAU, l = 10 + r() * 50;
        gp.strokeStyle = r() < 0.55 ? 'rgba(255,253,246,0.5)' : 'rgba(150,130,95,0.1)'; gp.lineWidth = 0.5 + r() * 0.8;
        gp.beginPath(); gp.moveTo(x, y); gp.bezierCurveTo(x + Math.cos(a) * l * 0.3 + 4, y + Math.sin(a) * l * 0.3, x + Math.cos(a) * l * 0.7 - 4, y + Math.sin(a) * l * 0.7 + 3, x + Math.cos(a) * l, y + Math.sin(a) * l); gp.stroke();
      }
      const L = () => { const cv = offscreen(W, H); return [cv, cv.getContext('2d')]; };
      // far ranges
      const [far, gf] = L();
      paintPeak(gf, { x0: -40, x1: 700, base: 600, h: 260, seed: 1, a: 0.22, halo: 14, cun: 260, hemp: true, moss: 30, dabs: 8, f1: 0.01 }, r);
      paintPeak(gf, { x0: 1380, x1: 1990, base: 620, h: 170, seed: 2, a: 0.15, halo: 16, cun: 200, hemp: true, moss: 20, f1: 0.011 }, r);
      // the monumental central massif (after Fan Kuan)
      const [mas, gm] = L();
      const MR = paintPeak(gm, { x0: 610, x1: 1310, base: 700, h: 610, flat: 1.9, seed: 5, a: 0.9, halo: 12, faces: 3, dabs: 34, cun: 3400, crev: 9, moss: 240, trees: 70, fade: 220, f1: 0.006 }, r);
      // waterfall: a thread of untouched paper
      gm.save(); gm.globalCompositeOperation = 'destination-out'; gm.filter = 'blur(1.6px)'; gm.lineCap = 'round';
      gm.strokeStyle = 'rgba(0,0,0,0.9)'; gm.lineWidth = 7;
      gm.beginPath(); gm.moveTo(1090, MR(1090) + 80); for (let y = MR(1090) + 80; y < 610; y += 8) gm.lineTo(1090 + Math.sin(y * 0.02) * 3, y); gm.stroke();
      gm.restore();
      // flanking peaks
      const [fl, gfl] = L();
      paintPeak(gfl, { x0: 250, x1: 780, base: 720, h: 400, seed: 7, a: 0.62, halo: 10, faces: 2, dabs: 12, cun: 900, hemp: true, crev: 5, moss: 90, trees: 18, fade: 200 }, r);
      paintPeak(gfl, { x0: 1240, x1: 1580, base: 730, h: 230, seed: 8, a: 0.45, halo: 10, faces: 1, dabs: 8, cun: 500, hemp: true, crev: 3, moss: 60, trees: 10, fade: 200 }, r);
      // mid hills with dotted trees
      const [mid, gmi] = L();
      const H1 = paintPeak(gmi, { x0: -60, x1: 760, base: 880, h: 190, seed: 11, a: 0.75, halo: 8, dabs: 14, cun: 420, hemp: true, moss: 140, fade: 120, p: 0.9 }, r);
      const H2 = paintPeak(gmi, { x0: 1220, x1: 1990, base: 900, h: 110, seed: 12, a: 0.6, halo: 8, dabs: 10, cun: 300, hemp: true, moss: 90, fade: 120, p: 0.9 }, r);
      const dotTree = (x, y, s) => {
        gmi.strokeStyle = ink(0.75); gmi.lineWidth = 2; gmi.beginPath(); gmi.moveTo(x, y); gmi.lineTo(x + 2, y - s * 1.4); gmi.stroke();
        for (let k = 0; k < 26; k++) { const a = r() * TAU, d = r() * s; gmi.fillStyle = ink(0.25 + r() * 0.5); gmi.beginPath(); gmi.ellipse(x + Math.cos(a) * d, y - s * 1.3 + Math.sin(a) * d * 0.7, 2 + r() * 3.5, 1.5 + r() * 2.5, r() * PI, 0, TAU); gmi.fill(); }
      };
      for (let k = 0; k < 9; k++) { const x = 80 + k * 70 + r() * 30; dotTree(x, H1(x) + 14, 14 + r() * 10); }
      for (let k = 0; k < 5; k++) { const x = 1320 + k * 90 + r() * 30; dotTree(x, H2(x) + 14, 11 + r() * 8); }
      // foreground rocks and pines framing the stream
      const [fore, gfo] = L();
      paintRock(gfo, [[-40, 1100], [-40, 880], [60, 840], [170, 860], [250, 830], [360, 880], [450, 940], [560, 1010], [610, 1100]], 1.0, r, 3);
      paintRock(gfo, [[1440, 1100], [1500, 1010], [1600, 975], [1720, 985], [1830, 945], [1980, 970], [1980, 1100]], 0.85, r, 4);
      paintPine(gfo, 230, 850, 330, 0.55, 0.9, r);
      paintPine(gfo, 330, 900, 230, 0.9, 0.75, r);
      paintPine(gfo, 1820, 955, 170, -0.6, 0.6, r);
      // water lines in the stream
      gfo.lineCap = 'round';
      for (let k = 0; k < 26; k++) { const x = 560 + r() * 840, y = 900 + r() * 180, l = 30 + r() * 90; gfo.strokeStyle = ink(0.07 + r() * 0.08); gfo.lineWidth = 1 + r(); gfo.beginPath(); gfo.moveTo(x, y); gfo.quadraticCurveTo(x + l / 2, y - 3, x + l, y); gfo.stroke(); }
      // tadpole paths, integrated once (deterministic)
      const tads = [];
      for (let i = 0; i < 6; i++) {
        const path = [];
        let x = ID[0], y = ID[1], a = -PI / 2 + (i - 2.5) * 0.95 + (r() - 0.5) * 0.3, born = 1.3 + i * 0.07;
        const ph = r() * 6, home = [640 + (i / 5) * 640 + (r() - 0.5) * 80, 930 + r() * 120];
        for (let f = 0; f <= 600; f++) {
          const t = f / 60;
          if (t > born) {
            const age = t - born, sp = 30 + 120 * Math.exp(-age * 2.2);
            const want = Math.atan2(home[1] - y, home[0] - x);
            let da = want - a; while (da > PI) da -= TAU; while (da < -PI) da += TAU;
            a += da * 0.012 * Math.min(1, age) + Math.sin(t * 2.3 + ph) * 0.02;
            x += Math.cos(a) * sp / 60; y += Math.sin(a) * sp / 60;
          }
          path.push([x, y, a]);
        }
        tads.push({ path, born, ph, s: 0.85 + r() * 0.3 });
      }
      const mist = Array.from({ length: 12 }, (_, k) => ({ x: r() * 2200 - 140, y: 540 + r() * 260 + (k % 3) * 20, w: 260 + r() * 380, h: 34 + r() * 40, v: 6 + r() * 12, a: 0.55 + r() * 0.35 }));
      return { paper, layers: { far, mas, fl, mid, fore }, tads, mist, scratch: offscreen(W, H) };
    },
    draw(c, t, W, H, st) {
      c.drawImage(st.paper, 0, 0);
      // camera: hold close on the drop, then pull back to the full landscape
      const zp = E.ioC(seg(t, 2.3, 6.2));
      const Z = Math.exp(lerp(Math.log(2.9), Math.log(1), zp)) * (1 + 0.012 * seg(t, 6.2, 10));
      const scx = lerp(960, ID[0], zp), scy = lerp(560, ID[1], zp) - 8 * seg(t, 6.6, 10);
      const toScreen = () => { c.translate(scx, scy); c.scale(Z, Z); c.translate(-ID[0], -ID[1]); };
      // landscape layers condense out of the mist (blur → crisp, revealed top-down)
      const lay = [['far', 3.0, 5.4, 70], ['mas', 3.3, 6.0, 90], ['fl', 3.7, 6.2, 330], ['mid', 4.3, 6.6, 690], ['fore', 4.8, 6.9, 830]];
      const sg = st.scratch.getContext('2d');
      const drawLay = ([k, a, b, top]) => {
        const p = seg(t, a, b); if (p <= 0) return;
        const e = E.ioS(p), blur = (1 - e) * 9;
        sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, W, H);
        if (blur > 0.3) sg.filter = `blur(${blur.toFixed(1)}px)`;
        sg.drawImage(st.layers[k], 0, 0); sg.filter = 'none';
        if (e < 1) {
          const yr = lerp(top - 120, 1180, E.outQ(p));
          const gr = sg.createLinearGradient(0, yr - 260, 0, yr);
          gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
          sg.globalCompositeOperation = 'destination-in'; sg.fillStyle = gr; sg.fillRect(0, 0, W, H); sg.globalCompositeOperation = 'source-over';
        }
        c.save(); toScreen(); c.globalAlpha = Math.min(1, e * 1.3); c.drawImage(st.scratch, 0, 0); c.restore();
      };
      lay.slice(0, 4).forEach(drawLay);

      // mist bands drifting across the middle distance (paper showing through = 留白)
      const mA = seg(t, 3.2, 5.5);
      if (mA > 0) {
        c.save(); toScreen();
        st.mist.forEach(m => {
          const x = ((m.x + t * m.v) % 2300) - 160;
          c.save(); c.translate(x, m.y); c.scale(m.w, m.h);
          const gr = c.createRadialGradient(0, 0, 0, 0, 0, 1);
          gr.addColorStop(0, `rgba(241,236,224,${m.a * mA})`); gr.addColorStop(0.6, `rgba(241,236,224,${m.a * mA * 0.6})`); gr.addColorStop(1, 'rgba(241,236,224,0)');
          c.fillStyle = gr; c.beginPath(); c.arc(0, 0, 1, 0, TAU); c.fill(); c.restore();
        });
        c.restore();
      }
      drawLay(lay[4]);
      // the drop and its bloom on wet paper
      c.save(); toScreen();
      const t0 = 0.28, bt = t - t0;
      if (t < t0) {
        const k = seg(t, 0.05, t0);
        c.fillStyle = ink(0.12 * k); c.beginPath(); c.arc(ID[0], ID[1], 26 * (1.3 - k * 0.3), 0, TAU); c.fill();   // shadow of the falling drop
      } else {
        const R = 118 * (1 - Math.exp(-bt * 2.4)), fadeB = 1 - E.ioS(seg(t, 1.3, 5.8));
        const mf = (a, amp, seed) => 1 + amp * (vnoise(a * 3 + seed, seed) * 0.6 + vnoise(a * 9 + seed, seed + 1) * 0.3 + vnoise(a * 23, seed + 2) * 0.1);
        const blob = (rr, amp, seed, ox = 0, oy = 0) => {
          c.beginPath();
          for (let k = 0; k <= 120; k++) { const a = k / 120 * TAU, m = mf(a, amp, seed), x = ID[0] + ox + Math.cos(a) * rr * m, y = ID[1] + oy + Math.sin(a) * rr * m; k ? c.lineTo(x, y) : c.moveTo(x, y); }
          c.closePath();
        };
        if (fadeB > 0.01) {
          // wet halo: water runs ahead of the pigment
          c.filter = 'blur(16px)'; blob(R * 1.4, 0.4, 3, R * 0.05, -R * 0.03); c.fillStyle = ink(0.09 * fadeB); c.fill();
          // overlapping pools of different density — never a clean circle
          c.filter = 'blur(7px)';
          [[0, 0, 1, 0.3, 5, 0.2], [0.2, -0.12, 0.7, 0.35, 11, 0.16], [-0.22, 0.14, 0.62, 0.4, 17, 0.2], [0.04, 0.2, 0.48, 0.3, 23, 0.18], [-0.08, -0.18, 0.4, 0.3, 29, 0.22]]
            .forEach(([dx, dy, k, amp, sd, al]) => { blob(R * k, amp, sd, dx * R, dy * R); c.fillStyle = ink(al * fadeB); c.fill(); });
          // a broken tide-line where the wet edge dried first
          c.filter = 'blur(1.4px)'; c.strokeStyle = ink(0.16 * fadeB); c.lineWidth = 2.2;
          c.beginPath();
          for (let k = 0; k <= 120; k++) { const a = k / 120 * TAU, m = mf(a, 0.3, 5); if (vnoise(a * 4, 31) > 0.25) { c.moveTo(ID[0] + Math.cos(a) * R * m, ID[1] + Math.sin(a) * R * m); continue; } c.lineTo(ID[0] + Math.cos(a) * R * m, ID[1] + Math.sin(a) * R * m); }
          c.stroke();
          // capillary threads: ink wicking out along the paper fibres
          c.filter = 'blur(0.8px)'; c.lineWidth = 1;
          for (let grp = 0; grp < 3; grp++) {
            c.strokeStyle = ink((0.05 + grp * 0.035) * fadeB);
            c.beginPath();
            for (let k = grp; k < 54; k += 3) {
              const a = hash(k * 1.7) * TAU, m = mf(a, 0.3, 5), r0 = R * m * (0.92 + hash(k * 3.1) * 0.1), l = (4 + hash(k * 5.3) * 14) * (R / 118);
              const wob = (hash(k * 7.7) - 0.5) * 0.5;
              c.moveTo(ID[0] + Math.cos(a) * r0, ID[1] + Math.sin(a) * r0);
              c.quadraticCurveTo(ID[0] + Math.cos(a + wob * 0.05) * (r0 + l * 0.5), ID[1] + Math.sin(a + wob * 0.05) * (r0 + l * 0.5), ID[0] + Math.cos(a + wob * 0.1) * (r0 + l), ID[1] + Math.sin(a + wob * 0.1) * (r0 + l));
            }
            c.stroke();
          }
        }
        // the dense core gathers, then splits into tadpoles
        c.filter = 'blur(4px)';
        const core = R * 0.36 * (1 - E.inQ(seg(t, 1.0, 1.6)));
        if (core > 1) { blob(core, 0.3, 9, -R * 0.03, R * 0.02); c.fillStyle = ink(0.88); c.fill(); blob(core * 0.6, 0.2, 13); c.fillStyle = ink(0.6); c.fill(); }
        c.filter = 'none';
      }
      // tadpoles condense from the core and swim off (Where Is Mama)
      const fi = Math.min(600, Math.round(t * 60));
      st.tads.forEach((td, i) => {
        if (t < td.born - 0.1) return;
        const [x, y, a] = td.path[fi], g = E.outB(seg(t, td.born - 0.1, td.born + 0.35), 1.6) * td.s;
        c.save(); c.translate(x, y); c.rotate(a); c.scale(g, g);
        const wig = t * 14 + td.ph;
        // tail: tapered, wiggling, drier and paler toward the tip
        c.beginPath();
        const N = 12, pts = [];
        for (let k = 0; k <= N; k++) { const u = k / N; pts.push([-8 - u * 30, Math.sin(wig - u * 4) * u * 6]); }
        pts.forEach(([px, py], k) => { const w = lerp(3.4, 0.4, k / N); k ? c.lineTo(px, py - w) : c.moveTo(px, py - w); });
        for (let k = N; k >= 0; k--) { const w = lerp(3.4, 0.4, k / N); c.lineTo(pts[k][0], pts[k][1] + w); }
        c.closePath(); c.fillStyle = ink(0.6); c.fill();
        // head: dense ink with a soft bled halo
        c.shadowColor = ink(0.55); c.shadowBlur = 7 * Z;
        c.fillStyle = ink(0.93); c.beginPath(); c.ellipse(0, 0, 10, 7.5, 0, 0, TAU); c.fill();
        c.shadowBlur = 0;
        c.fillStyle = 'rgba(255,255,255,0.06)'; c.beginPath(); c.ellipse(2, -2, 4, 2.4, 0, 0, TAU); c.fill();
        c.restore();
      });
      // a skein of wild geese crossing the empty sky
      if (t > 6.2) {
        for (let k = 0; k < 5; k++) {
          const p = t - 6.2, x = 300 + p * 46 - k * 26, y = 250 + k * 13 + Math.sin(p * 1.5 + k) * 3, f = Math.sin(t * 7 + k * 1.3);
          c.strokeStyle = ink(0.7 * seg(t, 6.2, 7)); c.lineWidth = 2; c.lineCap = 'round';
          c.beginPath(); c.moveTo(x - 8, y - 3 * f); c.quadraticCurveTo(x - 3, y - 1, x, y + 1); c.quadraticCurveTo(x + 3, y - 1, x + 8, y - 3 * f); c.stroke();
        }
      }
      c.restore();
      // inscription, written top-down in running script, then the seal
      const chars = [...'山静似太古'];
      chars.forEach((ch, i) => {
        const a = 7.0 + i * 0.24, p = seg(t, a, a + 0.32);
        if (p <= 0) return;
        const cx = 1660, cy = 150 + i * 74;
        c.save();
        c.beginPath(); c.moveTo(cx - 60, cy - 44);
        c.lineTo(cx + 60, cy - 44);
        for (let x = cx + 60; x >= cx - 60; x -= 12) c.lineTo(x, cy - 44 + 92 * E.outQ(p) + vnoise(x * 0.08, i) * 8);
        c.closePath(); c.clip();
        c.shadowColor = ink(0.4); c.shadowBlur = 2.5;
        text(c, ch, cx, cy, { font: '"Zhi Mang Xing", cursive', size: 78, align: 'center', base: 'middle', color: ink(0.9) });
        c.restore();
      });
      if (t >= 8.5) {
        const s = lerp(1.5, 1, E.outQt(seg(t, 8.5, 8.62))), al = 0.88;
        c.save(); c.translate(1662, 560); c.scale(s, s); c.rotate(-0.015);
        roughPoly(c, [[-27, -27], [27, -27], [27, 27], [-27, 27]], 13, 1.4, 9);
        c.fillStyle = `rgba(176,42,32,${al})`; c.fill();
        text(c, '水', 0, -12, { font: '"Noto Serif SC", serif', weight: 900, size: 23, align: 'center', base: 'middle', color: '#f3e9da' });
        text(c, '墨', 0, 13, { font: '"Noto Serif SC", serif', weight: 900, size: 23, align: 'center', base: 'middle', color: '#f3e9da' });
        const rr = rng(8); c.fillStyle = 'rgba(241,236,224,0.7)';
        for (let k = 0; k < 18; k++) c.fillRect(-25 + rr() * 50, -25 + rr() * 50, 1 + rr() * 3, 1 + rr() * 2);
        c.restore();
      }
      grain(c, W, H, t, 0.045, 'multiply');
      vignette(c, W, H, 0.18, '90,75,50');
    },
    score(A) {
      const qin = (t, m, o = {}) => A.pluck(t, midi(m), { dur: 3.6, g: 0.34, bright: 0.45, decay: 0.998, rev: 0.45, lp: 2400, ...o });
      const fan = (t, m, g = 0.07, pan = 0) => A.bell(t, midi(m), { ratios: [1, 2, 3.01], g, dur: 2.4, rev: 0.6, pan });   // 泛音 harmonics
      const dizi = (t, m, dur, o = {}) => {
        const f = midi(m);
        if (o.grace) A.osc(t - 0.07, { f: midi(m + o.grace), dur: 0.09, g: 0.05, a: 0.01, hold: true, rel: 0.03, rev: 0.4 });
        A.osc(t, { f: f * (o.from || 1), f2: f, glide: 0.12, dur, g: o.g ?? 0.085, a: 0.08, hold: true, rel: 0.35, vib: [5.6, f * 0.007], rev: 0.55, pan: 0.15 });
        A.osc(t, { type: 'triangle', f: f * 2, dur, g: (o.g ?? 0.085) * 0.12, a: 0.1, hold: true, rel: 0.3, vib: [5.6, f * 0.014], rev: 0.5 });
        A.noise(t, { type: 'bandpass', f: f * 3, q: 4, dur, g: (o.g ?? 0.085) * 0.35, a: 0.08, hold: true, rel: 0.3, rev: 0.4 });   // membrane buzz + breath
      };
      // the drop
      A.osc(0.28, { f: 1700, f2: 520, glide: 0.07, dur: 0.14, g: 0.16, rev: 0.6 });
      A.osc(0.28, { f: 140, f2: 70, glide: 0.2, dur: 0.4, g: 0.25 });
      A.noise(0.3, { type: 'lowpass', f: 300, f2: 1000, sweep: 1.2, dur: 1.4, g: 0.06, swell: 0.3, rev: 0.5 });
      fan(0.32, 86, 0.06);
      // tadpoles flick to life
      [79, 83, 86, 88, 91, 86].forEach((m, i) => fan(1.3 + i * 0.07, m, 0.05, (i / 5 - 0.5) * 0.8));
      qin(2.3, 43, { bend: 1.06, bendAt: 0.5, bendT: 0.6, g: 0.4 });
      qin(2.32, 50, { g: 0.2 });
      // pull back: wind in the valley, dizi line, mountains rise on low qin notes
      A.noise(2.6, { type: 'bandpass', f: 500, f2: 900, sweep: 4, dur: 4.4, q: 0.6, g: 0.05, swell: 0.6, rev: 0.4 });
      A.osc(2.8, { f: midi(31), dur: 6.6, g: 0.07, a: 2, hold: true, rel: 2, type: 'triangle', lp: 300 });
      dizi(3.2, 74, 0.95, { from: 0.96 }); dizi(4.2, 76, 0.45, { grace: 3 }); dizi(4.7, 79, 1.25, { from: 0.97 });
      dizi(6.05, 76, 0.4, { grace: 2 }); dizi(6.5, 74, 0.35); dizi(6.9, 71, 1.4, { from: 0.98 });
      qin(3.35, 38, { g: 0.32 }); qin(4.35, 45, { bend: 0.94, bendAt: 0.6, bendT: 0.5 }); qin(5.4, 43, { g: 0.3 }); qin(6.4, 50, { g: 0.24 });
      // brush on paper for each character
      for (let i = 0; i < 5; i++) A.noise(7.0 + i * 0.24, { type: 'bandpass', f: 500, f2: 1600, sweep: 0.28, q: 1.2, dur: 0.3, g: 0.05, swell: 0.4 });
      // the seal: soft press, harmonics, last low string
      A.osc(8.5, { f: 120, f2: 60, glide: 0.2, dur: 0.35, g: 0.32 });
      A.noise(8.5, { type: 'lowpass', f: 700, dur: 0.08, g: 0.12 });
      fan(8.55, 79, 0.07, -0.3); fan(8.62, 86, 0.06, 0.3); fan(8.7, 91, 0.045);
      qin(8.6, 43, { g: 0.36, dur: 3 }); dizi(8.8, 74, 1.15, { g: 0.06, from: 0.97 });
    },
  });

  /* =====================================================================
     ISLAMIC GEOMETRY — compass and straightedge build a 4.8.8 grid, Hankin
     rays trace an 8-fold star pattern, zellige colour floods outward, the
     strapwork interlaces, and a Droste zoom proves the pattern never ends
     ===================================================================== */
  const IS = {
    night: '#0b1430', night2: '#14224a', gold: '#d9b35c', goldB: '#f4dd9c', goldD: '#9c7630',
    cream: '#efe5cc', lapis: '#1f4a9e', turq: '#178f95', green: '#1f6a4c', ochre: '#c98a2b', strap: '#231a1f',
  };
  const ISA = 64, ISS = ISA * (1 + Math.SQRT2), ISRo = ISA / (2 * Math.sin(PI / 8)), ISTH = 67.5 * PI / 180;
  function isTile(type, cx, cy, i, j) {
    const V = [];
    if (type === 8) for (let k = 0; k < 8; k++) { const a = PI / 8 + k * PI / 4; V.push([cx + Math.cos(a) * ISRo, cy + Math.sin(a) * ISRo]); }
    else for (let k = 0; k < 4; k++) { const a = k * PI / 2; V.push([cx + Math.cos(a) * ISA / Math.SQRT2, cy + Math.sin(a) * ISA / Math.SQRT2]); }
    const n = V.length, M = [], P = [], D = [];
    const unit = (x, y) => { const l = Math.hypot(x, y); return [x / l, y / l]; };
    for (let k = 0; k < n; k++) { const a = V[k], b = V[(k + 1) % n]; M.push([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); }
    const e = k => { const a = V[k % n], b = V[(k + 1) % n]; return unit(b[0] - a[0], b[1] - a[1]); };
    const nn = k => unit(cx - M[k % n][0], cy - M[k % n][1]);
    const c0 = Math.cos(ISTH), s0 = Math.sin(ISTH);
    for (let k = 0; k < n; k++) {
      const e1 = e(k), n1 = nn(k), e2 = e(k + 1), n2 = nn(k + 1);
      const d1 = [c0 * e1[0] + s0 * n1[0], c0 * e1[1] + s0 * n1[1]], d2 = [-c0 * e2[0] + s0 * n2[0], -c0 * e2[1] + s0 * n2[1]];
      const A = M[k], B = M[(k + 1) % n];
      const det = d1[0] * -d2[1] - d1[1] * -d2[0];
      const sx = B[0] - A[0], sy = B[1] - A[1];
      const u = (sx * -d2[1] - sy * -d2[0]) / det;
      P.push([A[0] + d1[0] * u, A[1] + d1[1] * u]); D.push(d1);
    }
    const star = []; for (let k = 0; k < n; k++) star.push(M[k], P[k]);
    return { type, cx, cy, i, j, V, M, P, D, star, d: Math.hypot(cx, cy) / ISS, hue: (i + j) & 1 };
  }
  function isBuild() {
    const tiles = [];
    for (let i = -21; i <= 21; i++) for (let j = -21; j <= 21; j++) {
      tiles.push(isTile(8, i * ISS, j * ISS, i, j));
      tiles.push(isTile(4, (i + 0.5) * ISS, (j + 0.5) * ISS, i, j));
    }
    tiles.sort((a, b) => a.d - b.d);
    return tiles;
  }
  const poly = (c, pts) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); };

  MG.film({
    id: 'islamic', dur: 10, poster: 9.5,
    fonts: [],
    meta: {
      family: 'I', name: 'Islamic Geometry', sub: 'Girih & Zellige', era: '9th c. —',
      origin: 'Across the Islamic world, craftsmen generated star-and-polygon patterns with nothing but compass and straightedge, then cut them in tile (zellige), wood and stucco as interlacing strapwork (girih). Working scrolls such as the Topkapı Scroll record the construction lines behind the finished surfaces.',
      works: 'Alhambra zellige, Granada (14th c.) · Darb-i Imam shrine girih, Isfahan (1453) · Topkapı Scroll (15th–16th c.) · Ben Youssef Madrasa, Marrakesh (1560s) · Sheikh Lotfollah Mosque, Isfahan (1619)',
      tech: ['Compass-and-straightedge build', 'Polygons-in-contact star pattern', 'Over-under strapwork & Droste zoom'],
      accent: '#1f4a9e',
      motionDNA: 'Everything is constructed before it is decorated: arcs and ruled lines draw a grid, the star lines trace over it, colour floods out ring by ring, and an endless zoom shows the same rosette nested inside itself.',
      visualDNA: 'Eight-fold stars and rosettes in lapis, turquoise, green and ochre glaze on cream, bound by dark interlacing straps edged in gold, with no figures at all.',
      transitions: 'Compass sweep, ripple trace, tile flood, Droste zoom, medallion iris',
      implementation: ['Compass & straightedge', 'Canvas 2D', 'Illustrator / Houdini'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const r = rng(1453);
      const tiles = isBuild();
      tiles.forEach(T => { T.v = (r() - 0.5) * 0.12; });
      // plaster/glaze grain
      const gr = offscreen(512, 512), g = gr.getContext('2d'), id = g.createImageData(512, 512);
      for (let k = 0; k < id.data.length; k += 4) { const v = 128 + (r() - 0.5) * 60; id.data[k] = id.data[k + 1] = id.data[k + 2] = v; id.data[k + 3] = 255; }
      g.putImageData(id, 0, 0);
      return { tiles, grain: gr };
    },
    draw(c, t, W, H, st) {
      const tiles = st.tiles;
      c.fillStyle = IS.night; c.fillRect(0, 0, W, H);
      const bgG = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1100);
      bgG.addColorStop(0, IS.night2); bgG.addColorStop(1, '#070d20');
      c.fillStyle = bgG; c.fillRect(0, 0, W, H);
      // scribed dot lattice on the drafting ground, fading as the tiles arrive
      const dotA = 0.12 * (1 - seg(t, 4.5, 6));
      if (dotA > 0) { c.fillStyle = `rgba(217,179,92,${dotA})`; for (let y = 30; y < H; y += 48) for (let x = 30 + ((y / 48) % 2) * 24; x < W; x += 48) c.fillRect(x - 1, y - 1, 2, 2); }
      // camera: start close on the first circle, pull out as the grid spreads; then the Droste zoom
      const pull = lerp(3.1, 1, E.ioC(seg(t, 1.5, 4.6)));
      const r0 = ISS * 0.2071;                       // inner radius of the 8-star (where the next level lives)
      const K = 1180 / (r0 * 1.0);                  // nest scale: the inner star must cover the frame after zooming
      const zp = E.ioS(seg(t, 5.9, 7.75));
      const Z = pull * Math.pow(K, zp) * lerp(1, 0.94, E.ioC(seg(t, 7.8, 9.0)));
      const rot = 0.06 * (1 - E.ioC(seg(t, 0, 4.6))) + 0.0;
      // timings
      const trace = T => seg(t, 2.1 + T.d * 0.33, 2.1 + T.d * 0.33 + 0.55);
      const fill = T => E.outB(seg(t, 3.9 + T.d * 0.26, 3.9 + T.d * 0.26 + 0.45), 1.8);
      const groundR = Math.max(0, (t - 3.85) / 0.26) * ISS;
      const bandW = lerp(1.6, 9, E.ioC(seg(t, 5.0, 5.8)));
      const consA = 1 - E.ioS(seg(t, 4.4, 5.6));
      const nestA = E.ioS(seg(t, 5.3, 5.9));
      const sheen = seg(t, 8.6, 9.8);

      // draws one level of the finished pattern in its own coords; clipR culls to a radius
      const drawLevel = (L, scale, depth) => {
        const vis = T => { const sx = T.cx * scale, sy = T.cy * scale, rr = ISRo * scale; return Math.abs(sx) < W / 2 + rr + 40 && Math.abs(sy) < H / 2 + rr + 40 && (L.clip === undefined || Math.hypot(sx, sy) < L.clip + rr); };
        const list = tiles.filter(vis);
        const px = 1 / scale, tpx = ISS * scale, detail = depth === 0 || tpx > 12, sAl = depth ? clamp((tpx - 7) / 10) : 1;
        // glazed ground floods out from the centre
        c.save();
        if (depth === 0 && groundR < 4000) { c.beginPath(); c.arc(0, 0, groundR, 0, TAU); c.clip(); }
        c.fillStyle = IS.cream; c.fillRect(-W / 2 * px - 50, -H / 2 * px - 50, W * px + 100, H * px + 100);
        c.restore();
        if (depth === 0 && groundR > 0 && groundR < 2400) { c.strokeStyle = IS.goldB; c.lineWidth = 3 / scale; c.beginPath(); c.arc(0, 0, groundR, 0, TAU); c.stroke(); }
        list.forEach(T => {
          const f = depth ? 1 : fill(T); if (f <= 0) return;
          c.save(); c.translate(T.cx, T.cy); c.scale(f, f); c.translate(-T.cx, -T.cy);
          const lv = T.v, col = T.type === 8 ? (T.hue ? IS.turq : IS.lapis) : IS.green;
          poly(c, T.star); c.fillStyle = col; c.fill();
          if (!detail) { c.restore(); return; }
          // glaze: per-tile shade variance and a soft highlight
          c.fillStyle = lv > 0 ? `rgba(255,255,255,${lv})` : `rgba(0,0,0,${-lv})`; c.fill();
          if (tpx > 60) { const hg = c.createLinearGradient(T.cx - ISS * 0.3, T.cy - ISS * 0.3, T.cx + ISS * 0.2, T.cy + ISS * 0.2); hg.addColorStop(0, 'rgba(255,255,255,0.2)'); hg.addColorStop(0.5, 'rgba(255,255,255,0)'); c.fillStyle = hg; c.fill(); }
          if (T.type === 8) {
            const inner = T.star.map(([x, y]) => [T.cx + (x - T.cx) * 0.42, T.cy + (y - T.cy) * 0.42]);
            poly(c, inner); c.fillStyle = IS.ochre; c.fill();
            c.beginPath(); c.arc(T.cx, T.cy, ISS * 0.045, 0, TAU); c.fillStyle = IS.cream; c.fill();
          }
          c.restore();
        });
        // strapwork: dark bands edged in gold, over-under at every crossing
        const w = depth ? 9 : bandW;
        c.lineJoin = 'miter'; c.miterLimit = 6; c.lineCap = 'butt';
        const strapAll = (lw, col) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); list.forEach(T => { if (depth || trace(T) >= 1) { T.star.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); } }); c.stroke(); };
        if (w > 2.5 && sAl > 0) {
          c.globalAlpha *= sAl;
          const cl = Math.max(0.6, w * 0.12), cc = 'rgba(244,221,156,0.5)';
          strapAll(w + 3.2, IS.gold); strapAll(w, IS.strap); strapAll(cl, cc);
          // over-crossings: re-lay the over strand across each edge midpoint
          const ov = (lw, col) => {
            c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
            list.forEach(T => { if (!depth && trace(T) < 1) return; T.M.forEach((m, k) => { const d = T.D[k], L2 = w * 1.7; c.moveTo(m[0] - d[0] * L2, m[1] - d[1] * L2); c.lineTo(m[0] + d[0] * L2, m[1] + d[1] * L2); }); });
            c.stroke();
          };
          ov(w + 3.2, IS.gold); ov(w, IS.strap); ov(cl, cc);
          c.globalAlpha /= sAl;
        }
        return list;
      };

      c.save();
      c.translate(W / 2, H / 2); c.rotate(rot);
      // ---- Droste: level 0 then nested levels inside each central star ----
      const showPattern = t > 2.0;
      const levels = [];
      if (showPattern) {
        c.save(); c.scale(Z, Z);
        // level 0 (with construction-time behaviours)
        const list0 = drawLevel({}, Z, 0);
        // traced lines (before they become bands)
        c.strokeStyle = IS.goldB; c.lineWidth = 2.2 / Z; c.lineCap = 'round';
        list0.forEach(T => {
          const p = trace(T); if (p <= 0 || bandW > 2.5 && p >= 1) return;
          // the star outline is ruled continuously from one tip around the figure
          const pts = T.star, n = pts.length, run = E.ioS(p) * n;
          c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
          for (let k = 0; k < Math.ceil(run); k++) { const A2 = pts[k % n], B2 = pts[(k + 1) % n], u = Math.min(1, run - k); c.lineTo(lerp(A2[0], B2[0], u), lerp(A2[1], B2[1], u)); }
          c.stroke();
          if (p < 1) { const k = Math.floor(run) % n, A2 = pts[k], B2 = pts[(k + 1) % n], u = run - Math.floor(run); c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(lerp(A2[0], B2[0], u), lerp(A2[1], B2[1], u), 3 / Z, 0, TAU); c.fill(); }
        });
        // nested levels
        if (nestA > 0) {
          let sc = 1;
          for (let lev = 1; lev <= 2; lev++) {
            const T0 = tiles[0];
            poly(c, T0.star.map(([x, y]) => [x * sc, y * sc]));
            c.clip();
            sc /= K;
            if (Z * sc * ISS < 3) break;
            c.save(); c.globalAlpha = nestA; c.scale(sc, sc);
            drawLevel({ clip: ISS * 0.5 * Z * sc * K }, Z * sc, lev);
            c.restore();
          }
        }
        c.restore();
      }
      // ---- construction (compass & straightedge), gold hairlines on lapis ----
      if (consA > 0) {
        c.save(); c.scale(Z, Z);
        c.globalAlpha = consA;
        const hl = 1.7 / Z;
        c.lineWidth = hl; c.lineCap = 'round';
        // compass circle
        const cp = E.ioS(seg(t, 0.15, 0.85));
        if (cp > 0) {
          c.save(); c.shadowColor = 'rgba(244,205,120,0.9)'; c.shadowBlur = 14;
          c.strokeStyle = IS.goldB; c.lineWidth = 2.2 / Z; c.beginPath(); c.arc(0, 0, ISRo, -PI / 2, -PI / 2 + TAU * cp); c.stroke();
          c.restore();
          if (cp < 1 || t < 1.0) {
            const a = -PI / 2 + TAU * cp, pen = [Math.cos(a) * ISRo, Math.sin(a) * ISRo];
            const hinge = [pen[0] / 2 - Math.sin(a) * ISRo * 0.55 * -1, pen[1] / 2 + Math.cos(a) * ISRo * 0.55 * -1];
            const fa = 1 - seg(t, 0.85, 1.05);
            // brass compass: two tapered legs, hinge knob, handle; a hot point where graphite meets paper
            c.fillStyle = `rgba(232,196,118,${0.9 * fa})`;
            const leg = (a1, b1, w1) => { const dx = b1[0] - a1[0], dy = b1[1] - a1[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l; c.beginPath(); c.moveTo(a1[0] + nx * w1, a1[1] + ny * w1); c.lineTo(a1[0] - nx * w1, a1[1] - ny * w1); c.lineTo(b1[0], b1[1]); c.closePath(); c.fill(); };
            leg(hinge, [0, 0], 5 / Z); leg(hinge, pen, 5 / Z);
            c.beginPath(); c.arc(hinge[0], hinge[1], 7 / Z, 0, TAU); c.fill();
            const hd = [hinge[0] - pen[0] / 2, hinge[1] - pen[1] / 2], hl2 = Math.hypot(hd[0], hd[1]) || 1;
            c.fillRect(hinge[0] + hd[0] / hl2 * 6 / Z - 2.5 / Z, hinge[1] + hd[1] / hl2 * 6 / Z - 2.5 / Z, 5 / Z, 5 / Z);
            c.strokeStyle = `rgba(232,196,118,${0.9 * fa})`; c.lineWidth = 3 / Z; c.beginPath(); c.moveTo(hinge[0], hinge[1]); c.lineTo(hinge[0] + hd[0] / hl2 * 26 / Z, hinge[1] + hd[1] / hl2 * 26 / Z); c.stroke();
            c.save(); c.shadowColor = 'rgba(255,220,140,1)'; c.shadowBlur = 18; c.fillStyle = `rgba(255,246,216,${fa})`; c.beginPath(); c.arc(pen[0], pen[1], 3.5 / Z, 0, TAU); c.fill(); c.restore();
            c.lineWidth = hl;
          }
        }
        // needle point
        const np = seg(t, 0, 0.2);
        if (np > 0) { c.fillStyle = IS.goldB; c.beginPath(); c.arc(0, 0, (3 + 6 * (1 - np)) / Z, 0, TAU); c.fill(); }
        // ruled axes and diagonals
        const ax = (a, p) => { if (p <= 0) return; const L = ISS * 12 * E.outQ(p); c.beginPath(); c.moveTo(-Math.cos(a) * L, -Math.sin(a) * L); c.lineTo(Math.cos(a) * L, Math.sin(a) * L); c.stroke(); };
        c.strokeStyle = 'rgba(217,179,92,0.7)';
        ax(0, seg(t, 0.8, 1.6)); ax(PI / 2, seg(t, 0.9, 1.7)); ax(PI / 4, seg(t, 1.05, 1.85)); ax(-PI / 4, seg(t, 1.1, 1.9));
        // the grid spreads: circles, octagons and squares, ring by ring
        c.strokeStyle = IS.gold;
        tiles.forEach(T => {
          const a = 1.15 + T.d * 0.3, p = seg(t, a, a + 0.45);
          if (p <= 0) return;
          if (Math.abs(T.cx * Z) > W / 2 + 300 || Math.abs(T.cy * Z) > H / 2 + 300) return;
          const n = T.V.length, edges = p * n;
          c.beginPath();
          for (let k = 0; k < Math.ceil(edges); k++) {
            const A = T.V[k], B = T.V[(k + 1) % n], u = Math.min(1, edges - k);
            c.moveTo(A[0], A[1]); c.lineTo(lerp(A[0], B[0], u), lerp(A[1], B[1], u));
          }
          c.stroke();
          if (T.type === 8) {
            c.save(); c.strokeStyle = 'rgba(217,179,92,0.35)'; c.setLineDash([6 / Z, 6 / Z]);
            c.beginPath(); c.arc(T.cx, T.cy, ISS / 2, 0, TAU * p); c.stroke(); c.restore();
          }
          // construction points
          if (p > 0.6) { c.fillStyle = `rgba(244,221,156,${(1 - seg(t, a + 0.6, a + 1.4)) * 0.9 + 0.1})`; T.M.forEach(m => { c.beginPath(); c.arc(m[0], m[1], 2.6 / Z, 0, TAU); c.fill(); }); }
        });
        c.restore();
      }
      c.restore();
      // ---- medallion: iris closes to a framed rosette ----
      const ir = E.ioC(seg(t, 7.8, 8.7));
      if (ir > 0) {
        const R = lerp(1300, 380, ir), cx = W / 2, cy = H / 2;
        c.save();
        c.beginPath(); c.rect(0, 0, W, H); c.arc(cx, cy, R, 0, TAU, true); c.clip();
        c.fillStyle = `rgba(9,16,38,${0.9 * ir})`; c.fillRect(0, 0, W, H);
        // dim lattice of the same pattern outside the medallion
        c.strokeStyle = `rgba(217,179,92,${0.26 * ir})`; c.lineWidth = 1.4;
        c.save(); c.translate(cx, cy); const sc = 0.55; c.scale(sc, sc);
        c.beginPath(); tiles.forEach(T => { if (Math.abs(T.cx * sc) > W / 2 + 120 || Math.abs(T.cy * sc) > H / 2 + 120) return; T.star.forEach((p, k) => k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); }); c.stroke();
        c.restore();
        c.restore();
        // ornate ring
        c.save(); c.translate(cx, cy);
        c.globalAlpha = ir;
        c.lineWidth = 26; c.strokeStyle = IS.strap; c.beginPath(); c.arc(0, 0, R + 15, 0, TAU); c.stroke();
        c.lineWidth = 3; c.strokeStyle = IS.gold;
        [R + 1.5, R + 28.5].forEach(rr => { c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.stroke(); });
        c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, R + 36, 0, TAU); c.stroke();
        const nst = 32;
        for (let k = 0; k < nst; k++) {
          const a = k / nst * TAU + 0.2 * (1 - ir), x = Math.cos(a) * (R + 15), y = Math.sin(a) * (R + 15);
          c.save(); c.translate(x, y); c.rotate(a);
          c.beginPath(); for (let q = 0; q < 16; q++) { const rr = q % 2 ? 3.4 : 8, aa = q * PI / 8; c.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } c.closePath();
          c.fillStyle = IS.goldB; c.fill(); c.restore();
        }
        c.restore();
        // rectangular panel frame with corner quarter-rosettes
        const fa = E.ioC(seg(t, 8.2, 8.9));
        if (fa > 0) {
          c.save(); c.globalAlpha = fa;
          c.strokeStyle = IS.gold; c.lineWidth = 3; c.strokeRect(70, 60, W - 140, H - 120);
          c.lineWidth = 1.2; c.strokeRect(84, 74, W - 168, H - 148);
          [[84, 74, 0], [W - 84, 74, 1], [W - 84, H - 74, 2], [84, H - 74, 3]].forEach(([x, y, q]) => {
            c.save(); c.translate(x, y); c.rotate(q * PI / 2);
            c.beginPath(); c.arc(0, 0, 120, 0, PI / 2); c.lineWidth = 2; c.stroke();
            c.beginPath(); c.arc(0, 0, 100, 0, PI / 2); c.lineWidth = 1; c.stroke();
            for (let k = 0; k < 5; k++) { const a = (k + 0.5) / 5 * PI / 2; c.save(); c.translate(Math.cos(a) * 110, Math.sin(a) * 110); c.rotate(a);
              c.beginPath(); for (let q2 = 0; q2 < 16; q2++) { const rr = q2 % 2 ? 2.4 : 5.6, aa = q2 * PI / 8; c.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } c.closePath(); c.fillStyle = IS.gold; c.fill(); c.restore(); }
            c.restore();
          });
          c.restore();
        }
      }
      // gold glint sweeping the finished medallion
      if (sheen > 0 && sheen < 1) {
        c.save(); c.globalCompositeOperation = 'lighter';
        const x = lerp(-400, W + 400, E.ioS(sheen));
        const g = c.createLinearGradient(x - 160, 0, x + 160, 0);
        g.addColorStop(0, 'rgba(255,220,140,0)'); g.addColorStop(0.5, 'rgba(255,220,140,0.16)'); g.addColorStop(1, 'rgba(255,220,140,0)');
        c.fillStyle = g; c.beginPath(); c.arc(W / 2, H / 2, 380, 0, TAU); c.fill();
        c.restore();
      }
      // plaster/glaze grain + vignette
      c.save(); c.globalAlpha = 0.07; c.globalCompositeOperation = 'overlay';
      const pat = c.createPattern(st.grain, 'repeat'); c.fillStyle = pat; c.fillRect(0, 0, W, H); c.restore();
      vignette(c, W, H, 0.4, '4,8,22');
    },
    score(A) {
      const HJ = [50, 51, 54, 55, 57, 58, 60, 62, 63, 66, 67, 69, 70, 72, 74];   // maqam Hijaz on D
      const oud = (t, m, o = {}) => { A.pluck(t, midi(m), { dur: 1.8, g: 0.28, bright: 0.62, decay: 0.994, lp: 2600, rev: 0.3, ...o }); A.pluck(t + 0.004, midi(m) * 1.003, { dur: 1.6, g: (o.g ?? 0.28) * 0.5, bright: 0.55, decay: 0.993, lp: 2200, rev: 0.3, pan: (o.pan || 0) + 0.15 }); };
      const ney = (t, m, dur, o = {}) => {
        const f = midi(m);
        A.osc(t, { f: f * 0.985, f2: f, glide: 0.25, dur, g: o.g ?? 0.08, a: 0.25, hold: true, rel: 0.5, vib: [4.8, f * 0.008], rev: 0.6 });
        A.noise(t, { type: 'bandpass', f: f * 1.5, q: 1.6, dur, g: (o.g ?? 0.08) * 0.8, a: 0.2, hold: true, rel: 0.5, rev: 0.5 });
        A.noise(t, { type: 'bandpass', f: 2600, q: 0.6, dur: dur * 0.9, g: (o.g ?? 0.08) * 0.25, a: 0.3, hold: true, rel: 0.4 });
      };
      const dum = (t, g = 0.5) => { A.osc(t, { f: 95, f2: 52, glide: 0.18, dur: 0.6, g }); A.noise(t, { type: 'lowpass', f: 500, dur: 0.06, g: g * 0.4 }); };
      const tek = (t, g = 0.18) => { A.noise(t, { type: 'bandpass', f: 3200, q: 2, dur: 0.05, g }); A.osc(t, { f: 520, dur: 0.04, g: g * 0.5, type: 'triangle' }); };
      const zil = (t, g = 0.05) => A.noise(t, { type: 'highpass', f: 7000, dur: 0.25, g, rev: 0.3 });
      // needle, compass breath, ruled lines
      A.osc(0.0, { f: 2600, dur: 0.03, g: 0.1, type: 'triangle', rev: 0.5 });
      ney(0.12, 62, 1.6, { g: 0.09 });
      A.noise(0.15, { type: 'bandpass', f: 3800, q: 3, dur: 0.7, g: 0.025, hold: true, rel: 0.2 });       // graphite on paper
      [[0.8, 50], [0.9, 57], [1.05, 62], [1.1, 62]].forEach(([t, m]) => oud(t, m, { g: 0.24 }));
      for (let k = 0; k < 8; k++) oud(1.15 + k * 0.05, HJ[7 + k], { g: 0.13, dur: 1.2, pan: (k / 7 - 0.5) * 0.7 });
      A.bell(1.5, midi(74), { g: 0.05, dur: 2.2, rev: 0.6 });
      // taqsim over the spreading grid, then the drum enters
      [[1.9, 62], [2.15, 63], [2.35, 66], [2.6, 67], [2.8, 69], [3.05, 67], [3.2, 66], [3.4, 63], [3.6, 62], [3.75, 63], [3.85, 66], [3.95, 67], [4.05, 69], [4.15, 70], [4.3, 69]].forEach(([t, m], i) => oud(t, m, { g: 0.22, pan: (i % 2 ? 0.2 : -0.2) }));
      ney(2.4, 69, 1.4, { g: 0.06 });
      const B = 60 / 104;
      for (let b = 0; b < 8; b++) {            // maqsum: D T - T D - T -
        const t = 3.0 + b * B * 2;
        if (t > 7.6) break;
        dum(t, 0.4); tek(t + B * 0.5); tek(t + B * 1.0, 0.14); dum(t + B * 1.5, 0.32); tek(t + B * 2 * 0.875, 0.12);
        if (b >= 2) zil(t + B, 0.04);
      }
      // colour floods: glassy ticks ring by ring
      for (let k = 0; k < 9; k++) A.bell(3.95 + k * 0.17, midi(HJ[7 + (k % 8)] + 12), { g: 0.035, dur: 1.2, rev: 0.5, pan: (k % 3 - 1) * 0.5 });
      // bands interlace
      A.whoosh(5.0, 0.8, { f1: 400, f2: 2400, g: 0.08 });
      [[4.95, 69], [5.15, 70], [5.3, 69], [5.45, 67], [5.6, 66], [5.75, 63]].forEach(([t, m], i) => oud(t, m, { g: 0.2, pan: i % 2 ? 0.25 : -0.25 }));
      // the endless zoom
      A.riser(5.9, 1.85, { g: 0.12, f: 73.4 });
      ney(5.9, 74, 1.8, { g: 0.07 });
      for (let k = 0; k < 12; k++) tek(6.6 + k * (0.09 - k * 0.004), 0.08 + k * 0.008);
      dum(7.75, 0.7); A.impact(7.75, 0.35);
      [50, 57, 62, 66].forEach((m, i) => oud(7.77 + i * 0.03, m, { g: 0.22, dur: 2 }));
      // medallion closes; final cadence
      A.whoosh(7.85, 0.85, { f1: 2400, f2: 300, g: 0.07 });
      dum(8.7, 0.55); zil(8.7, 0.06);
      for (let k = 0; k < 10; k++) oud(8.72 + k * 0.06, 62, { g: 0.15 * (1 - k / 12), dur: 1.4 });   // tremolo (rishe)
      A.bell(8.75, midi(62), { g: 0.08, dur: 3, rev: 0.7 }); A.bell(8.8, midi(69), { g: 0.05, dur: 2.6, rev: 0.7 });
      ney(8.9, 62, 1.1, { g: 0.07 });
      A.osc(8.7, { f: midi(38), dur: 1.3, g: 0.08, a: 0.05, hold: true, rel: 0.8, type: 'triangle', lp: 500 });
    },
  });
})();
