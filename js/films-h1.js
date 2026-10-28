/* batch h1 — Family C: 2D Animation & Illustration. Rotoscope · Frame by Frame · Anime MG.
   rotoscope (Fleischer's projector to Rotoshop) · framebyframe (straight-ahead pencil on twos) · animemg (anime OP / title-card motion graphics).
   All three share one side-view figure rig so the same body can be traced, boiled, onion-skinned and cel-shaded. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, rrect, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;900&family=Caveat:wght@500;700&family=Courier+Prime:wght@400;700&family=Kalam:wght@400;700&family=Dela+Gothic+One&family=Anton&family=Barlow+Condensed:ital,wght@0,600;1,700&display=block');
  const PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const LP = (A, B, u) => [lerp(A[0], B[0], u), lerp(A[1], B[1], u)];
  const wrapA = a => a - TAU * Math.floor((a + PI) / TAU);
  const bump = (x, c0, w) => Math.exp(-((wrapA(x - c0) / w) ** 2));
  const hex = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16));
  const mixC = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
  // Layers are full 1920×1080 stage canvases; clr() resets one for a fresh frame.
  const clr = L => { const g = L.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none'; g.setLineDash([]); g.clearRect(0, 0, 1920, 1080); return g; };
  const camT = (g, cm) => { g.translate(960, 540); g.scale(cm.z, cm.z); g.translate(-cm.x, -cm.y); };
  const toScr = (cm, p) => [(p[0] - cm.x) * cm.z + 960, (p[1] - cm.y) * cm.z + 540];
  const patCache = new WeakMap();
  const patOf = (g, tile) => { let m = patCache.get(g); if (!m) patCache.set(g, (m = new Map())); if (!m.has(tile)) m.set(tile, g.createPattern(tile, 'repeat')); return m.get(tile); };
  // Closed smooth outline through points (quadratics through midpoints), optional per-point jitter.
  function sPath(c, pts, J) {
    const n = pts.length, q = J ? pts.map(J) : pts;
    c.moveTo((q[n - 1][0] + q[0][0]) / 2, (q[n - 1][1] + q[0][1]) / 2);
    for (let i = 0; i < n; i++) { const a = q[i], b = q[(i + 1) % n]; c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    c.closePath();
  }
  const polyP = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
  function subdiv(pts, step = 24) {
    const o = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
      for (let k = 0; k < n; k++) o.push([lerp(x0, x1, k / n), lerp(y0, y1, k / n)]);
    }
    o.push(pts[pts.length - 1]);
    return o;
  }
  // A graphite line: two jittered passes (k = drawing number, so it boils when k changes); v reveals it.
  function pencil(c, pts, k, amp, lw, col, a = 1, v = 1, passes = 2) {
    if (v <= 0) return;
    const n = Math.max(2, Math.ceil(pts.length * v));
    c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let ps = 0; ps < passes; ps++) {
      c.globalAlpha = a * (ps ? 0.4 : 0.88); c.lineWidth = lw * (ps ? 0.62 : 1);
      c.beginPath();
      for (let i = 0; i < n && i < pts.length; i++) {
        const p = pts[i], s = i * 1.37 + p[0] * 0.0123 + p[1] * 0.0071;
        const x = p[0] + (hash(k * 5.13 + s + ps * 31.7) - 0.5) * 2 * amp, y = p[1] + (hash(k * 2.71 + s * 1.9 + ps * 17.3) - 0.5) * 2 * amp;
        i ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    }
    c.globalAlpha = 1;
  }
  // Seamless pencil hatching tile (x+y = d lines, optional x−y = d cross-hatch), periodic in 240 px.
  function hatchTile(seed, col, cross = false, gap = 10) {
    const N = 240, T = offscreen(N, N), g = T.getContext('2d'), r = rng(seed), m = N / gap;
    const P = [...Array(m)].map(() => [0.3 + r() * 0.55, 0.8 + r() * 1.2, (r() - 0.5) * 3]);
    g.strokeStyle = col; g.lineCap = 'round';
    const fam = dir => {
      for (let j = -m; j < 3 * m; j++) {
        const [a, w, o] = P[((j % m) + m) % m], d = j * gap + o;
        g.globalAlpha = a; g.lineWidth = w; g.beginPath();
        if (dir > 0) { g.moveTo(d + N, -N); g.lineTo(d - 2 * N, 2 * N); } else { g.moveTo(d - N, -N); g.lineTo(d + 2 * N, 2 * N); }
        g.stroke();
      }
    };
    fam(1); if (cross) fam(-1);
    return T;
  }
  function toothTile(w, h, seed, base, dark = 'rgba(90,80,60,', n = 26000) {
    const T = offscreen(w, h), g = T.getContext('2d'), r = rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let k = 0; k < n; k++) { g.fillStyle = r() < 0.55 ? `${dark}${0.03 + r() * 0.05})` : 'rgba(255,255,250,0.35)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 1.4); }
    // long paper fibres
    for (let k = 0; k < 260; k++) { const x = r() * w, y = r() * h, a = r() * TAU, l = 8 + r() * 26; g.strokeStyle = `${dark}0.05)`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    return T;
  }
  // Jitter factories: boil re-rolls per drawing number; swim drifts smoothly (Rotoshop interpolation).
  const boilJ = (k, amp) => (pid, pass) => (p, i) => [p[0] + (hash(k * 7.31 + pid * 13.7 + i * 1.91 + pass * 91.3) - 0.5) * 2 * amp, p[1] + (hash(k * 3.17 + pid * 5.3 + i * 2.71 + pass * 47.9) - 0.5) * 2 * amp];
  const swimJ = (t, amp) => (pid, pass) => (p, i) => [p[0] + vnoise(t * 1.4 + i * 0.83 + pid * 3.1, 11 + pass) * amp, p[1] + vnoise(t * 1.4 + i * 0.71 + pid * 2.3, 29 + pass) * amp];
  // Pencil sprite: tip at (x, y), body up and to the right.
  function pencilSprite(c, x, y, a = -0.72, s = 1) {
    const body = () => {
      c.beginPath(); c.moveTo(0, 0); c.lineTo(64, -15); c.lineTo(64, 15); c.closePath();
    };
    c.save(); c.translate(x + 14 * s, y + 20 * s); c.rotate(a); c.scale(s, s);
    c.fillStyle = 'rgba(20,16,10,0.16)'; body(); c.fill(); c.fillRect(64, -15, 380, 30);
    c.restore();
    c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s);
    c.fillStyle = '#e3c296'; body(); c.fill();
    c.fillStyle = '#2d2d30'; c.beginPath(); c.moveTo(0, 0); c.lineTo(20, -4.7); c.lineTo(20, 4.7); c.closePath(); c.fill();
    c.fillStyle = '#e5b02e'; c.fillRect(64, -15, 320, 30);
    c.fillStyle = '#c48f1c'; c.fillRect(64, 5, 320, 10);
    c.fillStyle = '#f2cb5a'; c.fillRect(64, -11, 320, 5);
    c.fillStyle = '#b9b6ae'; c.fillRect(384, -16, 34, 32);
    c.fillStyle = '#8e8b84'; c.fillRect(392, -16, 4, 32); c.fillRect(404, -16, 4, 32);
    c.fillStyle = '#e48a86'; rrect(c, 418, -15, 34, 30, 6); c.fill();
    c.restore();
  }

  /* ---------------- shared figure rig ----------------
     A side-view body measured in fractions of its height S. Every angle is taken from straight
     down and swings positive toward the way the figure faces (F = ±1), so one pose table drives a
     walk, a grand jeté or an anime sprint. Parts come back as groups — far leg, far arm, body,
     near leg, near arm — each a list of closed outlines that a film can ink, fill, boil or mask. */
  const PK = ['x', 'air', 'lean', 'neck', 'head', 'sN', 'eN', 'wN', 'sF', 'eF', 'wF', 'hN', 'kN', 'fN', 'hF', 'kF', 'fF', 'open', 'spin'];
  const mixPose = (A, B, u) => { const o = { ...A }; PK.forEach(k => { o[k] = lerp(A[k] || 0, B[k] || 0, u); }); return o; };
  const poseKF = (t, keys) => { const o = {}; PK.forEach(k => { o[k] = kf(t, keys.map(K => [K[0], K[1][k] || 0, K[2]])); }); return o; };
  function rig(p, S) {
    const F = p.face || 1, hs = p.hs || 1;
    const D = (A, a, l) => [A[0] + Math.sin(a) * F * l * S, A[1] + Math.cos(a) * l * S];
    const P = [p.x, p.y], aT = PI - (p.lean || 0), C = D(P, aT, 0.29);
    // the neck carries the head forward of the chest; the head itself stays upright
    const aN = aT - 0.3 - (p.neck || 0), N = D(C, aN, 0.055), aH = aN + 0.3 - (p.head || 0), Hd = D(N, aH, 0.062 * hs);
    const Sh = D(C, aT, -0.004);
    const arm = (s, e, w) => { const El = D(Sh, s, 0.165), Wr = D(El, s + e, 0.145), aw = s + e + w; return { El, Wr, aw, Tp: D(Wr, aw, 0.075) }; };
    const leg = (h, k, f) => { const Kn = D(P, h, 0.245), An = D(Kn, h - k, 0.245), af = PI / 2 + (f || 0); return { Kn, An, Toe: D(An, af, 0.1), Heel: D(An, af, -0.035) }; };
    return { F, S, hs, P, C, N, Hd, Sh, aT, aH, D, open: p.open || 0, t: p.t || 0,
      nA: arm(p.sN || 0, p.eN || 0, p.wN || 0), fA: arm(p.sF || 0, p.eF || 0, p.wF || 0), nL: leg(p.hN || 0, p.kN || 0, p.fN), fL: leg(p.hF || 0, p.kF || 0, p.fF) };
  }
  // Stand the pose on the floor: the lowest sole touches gy, then lift by `air`.
  function plant(p, S, gy) {
    const R0 = rig({ ...p, y: 0 }, S);
    const low = Math.max(...[R0.nL, R0.fL].flatMap(L => [L.An[1], L.Toe[1], L.Heel[1], L.Kn[1] - 0.01 * S]));
    return rig({ ...p, y: gy - low - 0.024 * S - (p.air || 0) * S }, S);
  }
  function capsule(A, ra, B, rb, n = 6) {
    const a0 = Math.atan2(B[1] - A[1], B[0] - A[0]), pts = [];
    for (let i = 0; i <= n; i++) { const a = a0 - PI / 2 + (i / n) * PI; pts.push([B[0] + Math.cos(a) * rb, B[1] + Math.sin(a) * rb]); }
    for (let i = 0; i <= n; i++) { const a = a0 + PI / 2 + (i / n) * PI; pts.push([A[0] + Math.cos(a) * ra, A[1] + Math.sin(a) * ra]); }
    return pts;
  }
  function ribbon(cl, w0, w1) {
    const L = [], Rr = [];
    cl.forEach((p, i) => {
      const q = cl[Math.min(i + 1, cl.length - 1)], o = cl[Math.max(i - 1, 0)], dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1, w = lerp(w0, w1, i / (cl.length - 1));
      L.push([p[0] - (dy / d) * w, p[1] + (dx / d) * w]); Rr.push([p[0] + (dy / d) * w, p[1] - (dx / d) * w]);
    });
    return [...L, ...Rr.reverse()];
  }
  // Profile head in head units; W maps local (x forward, y down) to stage space.
  function headGeo(R, o = {}) {
    const S = R.S * R.hs, F = R.F, th = Math.atan2(F * Math.sin(R.aH), -Math.cos(R.aH)), cs = Math.cos(th), sn = Math.sin(th);
    const W = (x, y) => [R.Hd[0] + (F * x * cs - y * sn) * S, R.Hd[1] + (F * x * sn + y * cs) * S];
    const nose = o.nose ?? 1, pts = [], hair = [];
    for (let i = 0; i < 40; i++) {
      const a = (i / 40) * TAU;
      let x = Math.cos(a) * 0.05, y = Math.sin(a) * 0.064;
      if (x < 0) x *= 1.12;
      x += nose * 0.014 * bump(a, 0.06, 0.13) + 0.006 * bump(a, 1.0, 0.3);
      y += 0.009 * bump(a, 1.15, 0.4);
      pts.push(W(x, y));
    }
    const n = 22;
    for (let i = 0; i <= n; i++) {
      const a = -0.3 - (i / n) * (PI + 0.75), sp = o.spiky ? (i % 2 ? 1.32 : 1.06) : 1.1;
      let x = Math.cos(a) * 0.05 * sp, y = Math.sin(a) * 0.064 * sp;
      if (x < 0) x *= 1.12;
      hair.push(W(x, y));
    }
    const inner = o.spiky ? [[-0.034, 0.034], [-0.014, -0.004], [0.006, -0.008], [0.016, -0.034], [0.03, -0.004], [0.04, -0.03], [0.05, -0.02]] : [[-0.035, 0.035], [-0.016, 0.0], [0.012, -0.03], [0.04, -0.04]];
    inner.forEach(([x, y]) => hair.push(W(x, y)));
    return { pts, hair, W };
  }
  function figParts(R, o = {}) {
    const S = R.S, D = R.D;
    const armG = A => {
      const Pm = LP(A.Wr, A.Tp, 0.45), op = R.open, b = LP(A.Wr, Pm, 0.3), ps = [
        { pts: capsule(R.Sh, 0.036 * S, A.El, 0.027 * S), mat: 'shirt' },
        { pts: capsule(A.El, 0.027 * S, A.Wr, 0.02 * S), mat: o.sleeve || 'shirt' },
        { pts: capsule(A.Wr, 0.019 * S, Pm, 0.022 * S, 4), mat: 'skin' },
        { pts: capsule(b, 0.009 * S, D(b, A.aw + 0.55 + 0.35 * op, 0.04), 0.007 * S, 3), mat: 'skin' },
      ];
      [0.046, 0.05, 0.047, 0.04].forEach((l, j) => ps.push({ pts: capsule(Pm, 0.008 * S, D(Pm, A.aw + (j - 1.5) * 0.16 * op, l), 0.0065 * S, 3), mat: 'skin' }));
      return ps;
    };
    const legG = Lg => [
      { pts: capsule(R.P, 0.058 * S, Lg.Kn, 0.041 * S), mat: 'pants' },
      { pts: capsule(Lg.Kn, 0.04 * S, Lg.An, 0.027 * S), mat: o.legs || 'pants' },
      { pts: capsule(Lg.An, 0.026 * S, LP(Lg.Heel, Lg.Toe, 0.55), 0.024 * S, 4), mat: 'shoe' },
      { pts: capsule(Lg.Heel, 0.022 * S, Lg.Toe, 0.017 * S, 4), mat: 'shoe' },
    ];
    const ux0 = R.C[0] - R.P[0], uy0 = R.C[1] - R.P[1], Lt = Math.hypot(ux0, uy0), ux = ux0 / Lt, uy = uy0 / Lt, fx = -uy * R.F, fy = ux * R.F;
    const T = ([s, w]) => [R.P[0] + ux * s * Lt + fx * w * S, R.P[1] + uy * s * Lt + fy * w * S];
    const torso = [[-0.1, 0.07], [0.15, 0.064], [0.45, 0.06], [0.75, 0.082], [1.0, 0.07], [1.13, 0.028], [1.15, -0.03], [1.08, -0.07], [0.8, -0.072], [0.5, -0.062], [0.22, -0.06], [-0.05, -0.075], [-0.2, -0.04], [-0.22, 0.03]].map(T);
    const hips = [[-0.22, 0.03], [-0.1, 0.072], [0.2, 0.066], [0.2, -0.062], [-0.05, -0.076], [-0.2, -0.04]].map(T);
    const H = headGeo(R, o.head || {});
    const body = [
      ...(o.back ? o.back(R, H) : []),
      { pts: torso, mat: 'shirt' }, { pts: hips, mat: 'pants' },
      { pts: capsule(T([1.0, 0]), 0.027 * S, R.Hd, 0.024 * S, 4), mat: 'skin' },
      { pts: H.pts, mat: 'skin' }, { pts: H.hair, mat: 'hair' },
      ...(o.front ? o.front(R, H) : []),
    ];
    return [
      { k: 'fL', far: 1, parts: legG(R.fL) }, { k: 'fA', far: 1, parts: armG(R.fA) },
      { k: 'body', parts: body, H }, { k: 'nL', parts: legG(R.nL) }, { k: 'nA', parts: armG(R.nA) },
    ];
  }
  // Ink each group as a union (stroke twice the width, then fill over the inside), back to front.
  // fill(mat, group) returns a colour, a pattern, 'erase' (line-only: punch the inside out) or null.
  function drawFig(c, G, o) {
    let pid = 0;
    G.forEach(g => {
      const ids = g.parts.map(() => pid++);
      if (o.lw) (o.passes || [[0, 1, 1]]).forEach(([sd, a, m]) => {
        c.beginPath(); g.parts.forEach((p, i) => sPath(c, p.pts, o.J && o.J(ids[i], sd)));
        c.globalAlpha = a; c.strokeStyle = o.ink; c.lineWidth = o.lw * 2 * m; c.lineJoin = 'round'; c.stroke();
      });
      c.globalAlpha = 1;
      g.parts.forEach((p, i) => {
        const f = o.fill(p.mat, g);
        if (!f) return;
        c.beginPath(); sPath(c, p.pts, o.J && o.J(ids[i], 0));
        if (f === 'erase') { c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.fill(); c.globalCompositeOperation = 'source-over'; }
        else { c.fillStyle = f; c.fill(); }
      });
      if (o.after) o.after(c, g);
    });
  }
  function maskFig(c, G, J) {
    let pid = 0;
    G.forEach(g => g.parts.forEach(p => { c.beginPath(); sPath(c, p.pts, J && J(pid++, 0)); c.fill(); }));
  }
  // Shadow (or rim) band: the figure minus itself nudged toward the light, filled with `fs`.
  function bandLayer(L, G, dx, dy, J, fs, cam) {
    const m = clr(L);
    cam(m); m.fillStyle = '#000'; maskFig(m, G, J);
    m.globalCompositeOperation = 'destination-out'; m.translate(dx, dy); maskFig(m, G, J);
    m.setTransform(1, 0, 0, 1, 0, 0); m.globalCompositeOperation = 'source-in'; m.fillStyle = typeof fs === 'function' ? fs(m) : fs; m.fillRect(0, 0, 1920, 1080);
    m.globalCompositeOperation = 'source-over';
    return L;
  }
  // Trace the outlines part by part up to u (head first, as an animator would); returns the pencil tip.
  function traceFig(c, G, u, J) {
    const all = []; let pid = 0;
    G.forEach(g => g.parts.forEach(p => all.push([p, pid++, g.k])));
    const ord = ['body', 'nA', 'fA', 'nL', 'fL'], list = all.sort((a, b) => ord.indexOf(a[2]) - ord.indexOf(b[2]));
    let tip = null; const n = list.length;
    list.forEach(([p, id], i) => {
      const v = clamp(u * n - i); if (v <= 0) return;
      const q = J ? p.pts.map(J(id, 0)) : p.pts;
      let len = 0; for (let j = 0; j < q.length; j++) { const a = q[j], b = q[(j + 1) % q.length]; len += Math.hypot(b[0] - a[0], b[1] - a[1]); }
      c.setLineDash([len * v, len * 2]); c.beginPath(); sPath(c, q, null); c.stroke();
      if (v < 1) tip = q[Math.min(q.length - 1, Math.floor(v * q.length))];
    });
    c.setLineDash([]);
    return tip;
  }
  // The animator's construction: line of action, head and ribcage ovals, joint circles, limb sticks.
  function consLines(R) {
    const S = R.S, circ = (P, r, n = 14) => [...Array(n + 1)].map((_, i) => [P[0] + Math.cos((i / n) * TAU) * r, P[1] + Math.sin((i / n) * TAU) * r]);
    const stL = R.nL.An[1] > R.fL.An[1] ? R.nL : R.fL, ctl = [2 * R.P[0] - (R.Hd[0] + stL.An[0]) / 2, 2 * R.P[1] - (R.Hd[1] + stL.An[1]) / 2];
    const loa = [...Array(17)].map((_, i) => { const u = i / 16, a = (1 - u) ** 2, b = 2 * u * (1 - u), d = u * u; return [a * R.Hd[0] + b * ctl[0] + d * stL.An[0], a * R.Hd[1] + b * ctl[1] + d * stL.An[1]]; });
    return [loa, circ(R.Hd, 0.066 * S * R.hs, 18), circ(LP(R.C, R.P, 0.28), 0.085 * S, 18), circ(R.P, 0.055 * S),
      [R.Sh, R.nA.El, R.nA.Wr, R.nA.Tp], [R.Sh, R.fA.El, R.fA.Wr, R.fA.Tp], [R.P, R.nL.Kn, R.nL.An, R.nL.Toe], [R.P, R.fL.Kn, R.fL.An, R.fL.Toe],
      ...[R.nA.El, R.nA.Wr, R.nL.Kn, R.fL.Kn, R.fA.El].map(P => circ(P, 0.016 * S, 8))];
  }
  function drawCons(c, R, u, k, amp, col, lw, a) {
    const L = consLines(R), n = L.length; let tip = null;
    L.forEach((pl, i) => { const v = clamp(u * n - i); if (v <= 0) return; const sp = subdiv(pl, 16); pencil(c, sp, k + i, amp, lw, col, a, v, 1); if (v < 1) tip = sp[Math.floor(v * (sp.length - 1))]; });
    return tip;
  }
  function faceLines(c, H, S, o) {
    const W = H.W; c.strokeStyle = o.ink; c.lineCap = 'round'; c.lineWidth = o.lw;
    const ln = (...ps) => { c.beginPath(); ps.forEach((p, i) => { const q = W(p[0], p[1]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke(); };
    ln([0.024, -0.025], [0.036, -0.03], [0.047, -0.027]);
    ln([0.03, -0.009], [0.037, -0.012], [0.044, -0.008]);
    ln([0.043, 0.032], [0.056, 0.03]);
    const e = W(-0.012, 0.004); c.beginPath(); c.arc(e[0], e[1], 0.011 * S, -1.2, 1.9); c.stroke();
  }

  /* =====================================================================
     ROTOSCOPE — a scratchy sepia plate: a man walks into a bare room,
     filmed at 24 fps in Fleischer's projector gate. The frame freezes, a
     sheet of animation bond drops onto the pegs and a pencil traces him —
     blue line of action first, then graphite contours part by part. The
     light table clicks off and the tracing plays: a-ha's pencil world,
     boiling on twos with offset hatching, as he reaches toward the lens
     and his hand turns back into live action. Colour floods out of the
     hand into Rotoshop flats; lines swim, the room breathes, the speaker
     drifts off the floor mid-thought, and the title is traced in.
     ===================================================================== */
  const RS = { paper: '#f1eee6', lead: '#2a2a2e', blue: '#4a78c2', sepia: '#9a7a55', table: '#36332e', cream: '#fbefd9' };
  const RS_PN = { pants: '#2d2c2f', shirt: '#cbc5b9', skin: '#a08672', hair: '#1e1b18', shoe: '#151413' };
  const RS_PF = { pants: '#201f22', shirt: '#9a948a', skin: '#7c6757', hair: '#1a1715', shoe: '#101010' };
  const WL = { pants: '#3d3566', shirt: '#2f9b8f', skin: '#eaa57c', hair: '#3b2216', shoe: '#1f1a2c', line: '#21142c' };
  const WL_F = { pants: '#2c264d', shirt: '#237468', skin: '#c9845f', hair: '#2b180f', shoe: '#17131f' };
  const RS_T = { freeze: 2.4, sheet: 2.45, blue: 2.82, trace: 3.08, off: 3.86, sketch: 4.0, zoom: 5.0, real: 5.5, wake: 6.5, title: 8.35 };
  const RS_S = 700, RS_GY = 980;
  // Footage time: the plate runs, holds on the traced frame, then the drawings pick up from it.
  const rsTau = t => (t < RS_T.freeze ? t : t < RS_T.sketch ? RS_T.freeze : t - (RS_T.sketch - RS_T.freeze));
  function rsPose(tau) {
    // a natural walk that decelerates into a stop: phase is the integral of a smoothstep-falling speed
    const d = 0.8, u = seg(tau, 2.1, 2.1 + d), eff = tau < 2.1 ? tau : 2.1 + d * (u - u ** 3 + 0.5 * u ** 4);
    const ph = (TAU * eff) / 1.1, wa = 1 - E.ioS(seg(tau, 2.15, 2.95)), sp = Math.sin(ph);
    const kn = q => 0.06 + wa * (0.62 * Math.pow(Math.max(0, Math.cos(q + 0.4)), 2) + 0.1 * bump(q, 1.9, 0.5));
    const ft = q => wa * (0.25 * bump(q, 1.45, 0.4) - 0.65 * bump(q, -1.75, 0.45) - 0.15 * bump(q, -0.6, 0.6));
    const walk = {
      x: -90 + 340 * eff, air: 0, lean: 0.05 * wa + 0.015 * Math.cos(2 * ph) * wa, neck: -0.04, head: 0.02 * Math.sin(ph * 2) * wa,
      hN: 0.28 * wa * sp, kN: kn(ph), fN: ft(ph), hF: -0.28 * wa * sp, kF: kn(ph + PI), fF: ft(ph + PI),
      sN: 0.04 - 0.3 * wa * sp, eN: 0.16 + 0.28 * wa * Math.max(0, -sp), wN: 0.1,
      sF: 0.04 + 0.3 * wa * sp, eF: 0.16 + 0.28 * wa * Math.max(0, sp), wF: 0.1, open: 0.15,
    };
    const reach = { ...walk, lean: 0.14, neck: -0.05, head: -0.12, sN: 1.5, eN: 0.12, wN: 0.62, open: 1, sF: 0.3, eF: 0.45, wF: 0.1, hN: 0.24, kN: 0.26, fN: 0, hF: -0.16, kF: 0.04, fF: 0 };
    const talk = {
      ...walk, lean: 0.03 + 0.025 * Math.sin(tau * 1.3), neck: -0.04, head: 0.1 * Math.sin(tau * 2.9) * Math.sin(tau * 0.9) + 0.05 * vnoise(tau * 2, 4),
      sN: 0.5 + 0.22 * Math.sin(tau * 2.3), eN: 1.25 + 0.4 * Math.sin(tau * 3.1 + 1), wN: 0.25 * Math.sin(tau * 2.7), open: 0.6 + 0.4 * Math.sin(tau * 1.9),
      sF: 0.22 + 0.12 * Math.sin(tau * 1.7 + 2), eF: 0.9 + 0.35 * Math.sin(tau * 2.2), wF: 0.1,
      hN: 0.07, kN: 0.05 + 0.03 * Math.sin(tau * 1.3), fN: 0, hF: -0.05, kF: 0.03, fF: 0,
    };
    let p = mixPose(walk, reach, E.ioC(seg(tau, 3.15, 4.3)));
    p = mixPose(p, talk, E.ioC(seg(tau, 4.95, 5.8)));
    // Waking Life: mid-sentence the speaker lifts gently off the floor
    const fl = E.ioS(seg(tau, 6.5, 8.4));
    p.air = fl * 0.08 + fl * 0.008 * Math.sin(tau * 2.4); p.fN = lerp(p.fN, -0.45, fl); p.fF = lerp(p.fF, -0.55, fl); p.kF += 0.16 * fl;
    return p;
  }
  const rsRig = tau => plant(rsPose(tau), RS_S, RS_GY);
  const rsHand = R => LP(R.nA.Wr, R.nA.Tp, 0.35);
  function rsCam(t) {
    const tau = rsTau(t), h = rsHand(rsRig(tau));
    const k1 = E.ioC(seg(t, RS_T.zoom, 6.2)), k2 = E.ioC(seg(t, 6.55, 7.45)), dr = Math.max(0, t - 7.45);
    let x = lerp(960, h[0] - 110, k1), y = lerp(540, h[1] + 20, k1), z = lerp(1, 2.5, k1);
    x = lerp(x, 405 + dr * 9, k2); y = lerp(y, 612, k2); z = lerp(z, 1.1 + dr * 0.012, k2);
    return { x, y, z };
  }
  // The bare room, three ways: photographed, pencilled, and as Rotoshop flats.
  const RS_ROOM = [
    [[-100, 980], [2020, 980]], [[-100, 944], [2020, 944]],
    [[140, 980], [140, 230], [420, 230], [420, 980]], [[162, 980], [162, 252], [398, 252], [398, 980]], [[162, 252], [300, 270], [300, 962], [162, 980]],
    [[1250, 640], [1250, 170], [1640, 170], [1640, 640], [1250, 640]], [[1445, 170], [1445, 640]], [[1250, 404], [1640, 404]], [[1230, 640], [1660, 640], [1660, 656], [1230, 656]],
    [[1440, 770], [1720, 770], [1720, 788], [1440, 788]], [[1465, 788], [1465, 980]], [[1695, 788], [1695, 980]],
    [[1520, 650], [1640, 650], [1612, 575], [1548, 575], [1520, 650]], [[1580, 650], [1580, 768]], [[1548, 768], [1612, 768]],
    ...[-200, 60, 320, 580, 840, 1100, 1360, 1620, 1880, 2140].map(x => [[x, 980], [960 + (x - 960) * 1.6, 1090]]),
  ];
  function rsRoomPlate(c, R) {
    const gy = RS_GY;
    let g = c.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, '#6a645a'); g.addColorStop(1, '#878073');
    c.fillStyle = g; c.fillRect(-200, -200, 2320, gy + 200);
    g = c.createRadialGradient(1445, 420, 60, 1445, 420, 760); g.addColorStop(0, 'rgba(255,250,235,0.34)'); g.addColorStop(1, 'rgba(255,250,235,0)');
    c.fillStyle = g; c.fillRect(500, -200, 1700, 1400);
    c.fillStyle = '#ece7db'; c.fillRect(1250, 170, 390, 470);
    c.fillStyle = 'rgba(190,184,170,0.5)'; c.fillRect(1250, 470, 195, 170);
    c.fillStyle = '#5a554c'; c.fillRect(1438, 170, 14, 470); c.fillRect(1250, 398, 390, 12);
    c.strokeStyle = '#4b463e'; c.lineWidth = 16; c.strokeRect(1250, 170, 390, 470);
    c.fillStyle = '#6e685d'; c.fillRect(1230, 640, 430, 16);
    c.fillStyle = '#3e3a34'; c.fillRect(140, 230, 280, 750);
    c.fillStyle = '#262320'; c.fillRect(162, 252, 236, 728);
    c.fillStyle = '#4a453e'; polyP(c, [[162, 252], [300, 270], [300, 962], [162, 980]]); c.fill();
    c.fillStyle = '#7d766a'; c.beginPath(); c.arc(282, 610, 7, 0, TAU); c.fill();
    c.fillStyle = '#4b463f'; c.fillRect(-200, gy - 36, 2320, 36);
    g = c.createLinearGradient(0, gy, 0, 1100); g.addColorStop(0, '#59534b'); g.addColorStop(1, '#2a2723');
    c.fillStyle = g; c.fillRect(-200, gy, 2320, 300);
    c.fillStyle = 'rgba(255,248,230,0.14)'; polyP(c, [[1250, gy], [1640, gy], [1520, 1180], [800, 1180]]); c.fill();
    // table and lamp
    c.fillStyle = '#27241f'; c.fillRect(1440, 770, 280, 18); c.fillRect(1458, 788, 14, 192); c.fillRect(1688, 788, 14, 192);
    c.fillStyle = '#1e1c19'; c.fillRect(1576, 650, 8, 118); c.fillRect(1548, 762, 64, 8);
    c.fillStyle = '#ddd3bd'; polyP(c, [[1520, 650], [1640, 650], [1612, 575], [1548, 575]]); c.fill();
    // soft cast shadow, thrown left by the window
    const sx = R.P[0] - 70; g = c.createRadialGradient(sx, gy + 10, 10, sx, gy + 10, 230);
    g.addColorStop(0, 'rgba(10,8,6,0.55)'); g.addColorStop(1, 'rgba(10,8,6,0)');
    c.save(); c.translate(sx, gy + 10); c.scale(1, 0.14); c.translate(-sx, -(gy + 10)); c.fillStyle = g; c.fillRect(sx - 240, gy - 230, 480, 480); c.restore();
  }
  // The photographed man: tonal fills, a shadow side away from the window and a sheen toward it.
  function rsPlateFig(st, R, cm) {
    const G = figParts(R), g = clr(st.L1);
    g.save(); camT(g, cm);
    drawFig(g, G, { fill: (m, gr) => (gr.far ? RS_PF : RS_PN)[m], after: (g2, gr) => {
      if (gr.k !== 'body') return;
      const W = gr.H.W, e = W(0.036, -0.012), s = R.S;
      g2.fillStyle = 'rgba(40,30,24,0.6)'; g2.beginPath(); g2.ellipse(e[0], e[1], 0.012 * s, 0.007 * s, 0, 0, TAU); g2.fill();
      const ear = W(-0.012, 0.004); g2.fillStyle = 'rgba(60,44,36,0.5)'; g2.beginPath(); g2.arc(ear[0], ear[1], 0.011 * s, 0, TAU); g2.fill();
    } });
    g.restore();
    bandLayer(st.L2, G, 0.045 * RS_S, -0.015 * RS_S, null, 'rgba(16,12,8,0.6)', m => camT(m, cm));
    g.globalCompositeOperation = 'source-atop'; g.drawImage(st.L2, 0, 0);
    bandLayer(st.L2, G, -0.02 * RS_S, 0.01 * RS_S, null, 'rgba(255,248,232,0.3)', m => camT(m, cm));
    g.drawImage(st.L2, 0, 0); g.globalCompositeOperation = 'source-over';
    return st.L1;
  }
  // A sheet of animation bond on the pegs (stage space); a < 1 lets the light table show through.
  function rsSheet(c, st, a) {
    c.save(); c.globalAlpha = a;
    c.drawImage(st.tooth, 0, 0, 1920, 1080);
    c.restore();
    c.fillStyle = 'rgba(40,38,34,0.75)';
    c.beginPath(); c.arc(960, 60, 18, 0, TAU); c.fill();
    rrect(c, 620, 49, 84, 24, 12); c.fill(); rrect(c, 1216, 49, 84, 24, 12); c.fill();
  }
  function rsPlate(c, t, W, H, st) {
    const frozen = t >= RS_T.freeze, tau = Math.floor(rsTau(t) * 24) / 24, fr = Math.round(tau * 24), R = rsRig(tau);
    const wx = frozen ? 0 : vnoise(t * 9, 2) * 2.5, wy = frozen ? 0 : vnoise(t * 9, 5) * 3;
    const cm = { x: 960 - wx, y: 540 - wy, z: 1 };
    c.save(); camT(c, cm); rsRoomPlate(c, R); c.restore();
    c.save(); c.filter = 'blur(1.3px)'; c.drawImage(rsPlateFig(st, R, cm), 0, 0, W, H); c.restore();
    // silver print: sepia, flicker, dust and scratches
    c.save(); c.globalCompositeOperation = 'color'; c.globalAlpha = 0.6; c.fillStyle = RS.sepia; c.fillRect(0, 0, W, H); c.restore();
    if (!frozen) {
      c.fillStyle = `rgba(0,0,0,${0.03 + 0.07 * hash(fr * 1.31)})`; c.fillRect(0, 0, W, H);
      for (let k = 0; k < 3; k++) if (hash(fr * 3.1 + k) > 0.55) {
        const x = hash(fr * 7.7 + k) * W; c.strokeStyle = `rgba(245,235,215,${0.12 + hash(fr + k) * 0.2})`; c.lineWidth = 1 + hash(fr * 2 + k) * 1.5;
        c.beginPath(); c.moveTo(x, 0); c.lineTo(x + (hash(k + fr) - 0.5) * 30, H); c.stroke();
      }
      for (let k = 0; k < 6; k++) { const q = hash(fr * 11.3 + k * 5.1); if (q < 0.6) continue; c.fillStyle = q > 0.85 ? 'rgba(245,235,215,0.5)' : 'rgba(20,14,8,0.55)'; c.beginPath(); c.arc(hash(fr + k * 3.3) * W, hash(fr * 2.2 + k) * H, 1.5 + hash(k * fr) * 4, 0, TAU); c.fill(); }
    }
    vignette(c, W, H, 0.7);
    grain(c, W, H, frozen ? 2.4 : t, 0.14);
    // projector gate: perforations either side and the frame counter
    c.fillStyle = '#0d0b09'; c.fillRect(0, 0, 76, H); c.fillRect(W - 76, 0, 76, H);
    const off = frozen ? 0 : (t * 24) % 1 > 0.5 ? 2 : 0;
    c.fillStyle = '#3a3226';
    for (let y = -40; y < H + 60; y += 64) { rrect(c, 22, y + off, 32, 24, 5); c.fill(); rrect(c, W - 54, y + off, 32, 24, 5); c.fill(); }
    text(c, frozen ? `HOLD  ·  FRAME ${String(fr).padStart(4, '0')}` : `PLATE 1A  ·  FRAME ${String(fr).padStart(4, '0')}`, 112, 80, { font: '"Courier Prime", monospace', weight: 700, size: 26, ls: 3, color: 'rgba(240,228,205,0.85)' });
    text(c, '24 FPS', W - 112, 80, { font: '"Courier Prime", monospace', weight: 700, size: 26, ls: 3, align: 'right', color: 'rgba(240,228,205,0.85)' });
    if (frozen) rsTrace(c, t, W, H, st, R, cm);
  }
  // The sheet drops onto the pegs and the frozen frame is traced through it.
  function rsTrace(c, t, W, H, st, R, cm) {
    const sh = E.outQt(seg(t, RS_T.sheet, RS_T.sheet + 0.34)), lt = seg(t, RS_T.off, RS_T.off + 0.12);
    c.save(); c.translate(0, lerp(-H - 60, 0, sh));
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, H, W, 18);
    rsSheet(c, st, lerp(0.8, 1, lt));
    c.restore();
    if (sh < 1) return;
    const G = figParts(R);
    c.save(); camT(c, cm);
    const tipB = drawCons(c, R, seg(t, RS_T.blue, RS_T.trace + 0.1), 3, 0.8, RS.blue, 2.2, 0.75);
    c.strokeStyle = RS.lead; c.lineWidth = 2.6; c.lineJoin = 'round'; c.lineCap = 'round';
    const tip = traceFig(c, G, seg(t, RS_T.trace, RS_T.off - 0.04), null);
    if (t > RS_T.off - 0.06) faceLines(c, G[2].H, R.S, { ink: RS.lead, lw: 2.2 });
    c.restore();
    const tp = tip || tipB;
    if (tp && t < RS_T.off) { const s = toScr(cm, tp); pencilSprite(c, s[0], s[1], -0.72, 0.9); }
    const na = seg(t, RS_T.sheet + 0.3, RS_T.sheet + 0.5);
    if (na > 0) {
      c.globalAlpha = na;
      text(c, 'tracing frame 57', 120, 160, { font: 'Caveat, cursive', weight: 700, size: 52, color: RS.lead });
      text(c, 'blue: line of action, joints', 124, 210, { font: 'Caveat, cursive', weight: 500, size: 38, color: RS.blue });
      text(c, 'graphite: the contour', 124, 252, { font: 'Caveat, cursive', weight: 500, size: 38, color: RS.lead });
      c.globalAlpha = 1;
    }
    grain(c, W, H, 3, 0.05);
  }
  function rsSketch(c, t, W, H, st, cm, k1) {
    const k = Math.floor(t * 12), tau = Math.floor(rsTau(t) * 12) / 12, R = rsRig(tau), G = figParts(R), J = boilJ(k, 1.7 / cm.z);
    c.fillStyle = RS.table; c.fillRect(0, 0, W, H);
    c.save(); camT(c, cm);
    rsSheet(c, st, 1);
    // the room, pencilled in fast behind him
    RS_ROOM.forEach((pl, i) => pencil(c, subdiv(pl, 30), k + i * 7, 1.4 / cm.z, 2.2, RS.lead, 0.55, E.outQ(seg(t, 4.0 + i * 0.03, 4.3 + i * 0.03))));
    for (let j = 0; j < 9; j++) { const x = 176 + j * 22; pencil(c, [[x, 300], [x + 46, 262]], k + j, 1.2, 1.6, RS.lead, 0.4 * seg(t, 4.3, 4.5)); }
    c.restore();
    // hatching on the side away from the window
    const L2g = st.L2.getContext('2d');
    bandLayer(st.L2, G, 0.042 * RS_S, -0.016 * RS_S, J, patOf(L2g, st.hatch[k % 3]), m => camT(m, cm));
    c.globalAlpha = 0.85; c.drawImage(st.L2, 0, 0, W, H); c.globalAlpha = 1;
    // the live-action hand breaks back through the drawing
    const ur = E.ioC(seg(t, RS_T.real, RS_T.wake + 0.2));
    if (ur > 0) {
      const L = rsPlateFig(st, R, cm), g = L.getContext('2d'), hp = toScr(cm, rsHand(R)), rad = lerp(20, 620, ur);
      const gr = g.createRadialGradient(hp[0], hp[1], rad * 0.3, hp[0], hp[1], rad);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(160,124,82,0.28)'; g.fillRect(0, 0, 1920, 1080);
      g.globalCompositeOperation = 'destination-in'; g.fillStyle = gr; g.fillRect(0, 0, 1920, 1080); g.globalCompositeOperation = 'source-over';
      c.drawImage(L, 0, 0, W, H);
    }
    const g = clr(st.L1); camT(g, cm);
    drawFig(g, G, {
      lw: 2.5, ink: RS.lead, passes: [[0, 0.92, 1], [1, 0.45, 0.6]], J,
      fill: m => (m === 'hair' ? patOf(g, st.xhatch) : 'erase'),
      after: (g2, gr) => gr.k === 'body' && faceLines(g2, gr.H, R.S, { ink: RS.lead, lw: 2.3 }),
    });
    c.drawImage(st.L1, 0, 0, W, H);
    // margin notes and the drawing number, until the camera pushes in
    const na = 1 - k1;
    if (na > 0) {
      c.globalAlpha = na;
      text(c, `dwg ${String(k - 47).padStart(2, '0')}  —  on twos`, 120, 160, { font: 'Caveat, cursive', weight: 700, size: 52, color: RS.lead });
      text(c, 'the traced frames play back', 124, 210, { font: 'Caveat, cursive', weight: 500, size: 38, color: RS.blue });
      c.globalAlpha = 1;
    }
    grain(c, W, H, t, 0.05);
  }
  // Rotoshop flats in world space; every vertex drifts on its own slow noise.
  const RS_WL = [
    { col: ['#de7c3d', '#e9a04d'], pts: [[-800, -300], [1000, -300], [1000, 990], [-800, 990]] },
    { col: ['#3c7c8c', '#4f96a0'], pts: [[1000, -300], [2200, -300], [2200, 990], [1000, 990]] },
    { col: ['#4a2e62', '#5c3a74'], pts: [[-800, 978], [2200, 978], [2200, 1400], [-800, 1400]] },
    { col: ['#7a3c3c', '#8c4a3e'], pts: [[-800, 940], [2200, 940], [2200, 980], [-800, 980]] },
    { col: ['#2a1f3c', '#35274b'], pts: [[130, 220], [430, 220], [430, 982], [130, 982]], line: 1 },
    { col: ['#a4473c', '#b9593f'], pts: [[155, 245], [326, 264], [326, 962], [155, 982]], line: 1 },
    { col: ['#2b2238', '#352a46'], pts: [[1236, 156], [1654, 156], [1654, 654], [1236, 654]], line: 1 },
    { col: ['#f6c56a', '#f9d98c'], pts: [[1262, 182], [1628, 182], [1628, 628], [1262, 628]], sky: 1 },
    { col: ['#f2d05e', '#f7dc7c'], pts: [[316, 248], [444, 248], [474, 324], [286, 324]], line: 1 },
  ];
  function rsWake(c, t, W, H, st, cm) {
    const tau = rsTau(t), R = rsRig(tau), J = swimJ(t, 2.6), G = figParts(R);
    c.save(); camT(c, cm);
    RS_WL.forEach((s, i) => {
      const pts = s.pts.map((p, j) => [p[0] + vnoise(t * 0.8 + j * 1.7 + i * 3.1, 7) * 9, p[1] + vnoise(t * 0.8 + j * 2.3 + i * 1.9, 13) * 9]);
      if (s.sky) { const g = c.createLinearGradient(0, 182, 0, 628); g.addColorStop(0, mixC('#7fc6cf', '#9ad3d0', 0.5 + 0.5 * Math.sin(t))); g.addColorStop(1, mixC(s.col[0], s.col[1], 0.5 + 0.5 * Math.sin(t * 0.7))); c.fillStyle = g; }
      else c.fillStyle = mixC(s.col[0], s.col[1], 0.5 + 0.5 * Math.sin(t * 0.9 + i * 1.3));
      polyP(c, pts); c.fill();
      if (s.line) { c.strokeStyle = WL.line; c.lineWidth = 2.4; c.lineJoin = 'round'; c.stroke(); }
    });
    // the lamp cord and its swimming halo
    c.strokeStyle = WL.line; c.lineWidth = 3; c.beginPath(); c.moveTo(380, -300); c.lineTo(380 + vnoise(t, 3) * 6, 248); c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter';
    const hg = c.createRadialGradient(380, 330, 10, 380, 330, 340 + vnoise(t * 1.3, 5) * 30); hg.addColorStop(0, 'rgba(255,220,140,0.42)'); hg.addColorStop(1, 'rgba(255,200,120,0)');
    c.fillStyle = hg; c.fillRect(0, 0, 760, 700); c.restore();
    // window: rooftops outside, mullions
    c.fillStyle = mixC('#c46a54', '#b85b58', 0.5 + 0.5 * Math.sin(t * 0.6));
    polyP(c, [[1262, 628], [1262, 520], [1330, 520 + vnoise(t, 2) * 5], [1330, 470], [1420, 470], [1420, 540], [1520, 540 + vnoise(t * 0.9, 6) * 5], [1520, 500], [1628, 500], [1628, 628]]); c.fill();
    c.fillStyle = '#2b2238'; c.fillRect(1438, 182, 14, 446); c.fillRect(1262, 398, 366, 12);
    // floor boards
    c.strokeStyle = 'rgba(30,18,44,0.55)'; c.lineWidth = 2;
    for (let j = 0; j < 9; j++) { const x = -500 + j * 260; c.beginPath(); c.moveTo(x + vnoise(t + j, 4) * 8, 980); c.lineTo(960 + (x - 960) * 1.7 + vnoise(t * 0.7 + j, 9) * 14, 1400); c.stroke(); }
    // flat cast shadow, shrinking as he floats
    const fl = 1 - clamp(((RS_GY - R.nL.An[1]) - 30) / 120) * 0.45;
    c.fillStyle = 'rgba(40,20,56,0.55)'; c.beginPath(); c.ellipse(R.P[0] + 60, 990, 190 * fl, 22 * fl, 0, 0, TAU); c.fill();
    c.restore();
    const g = clr(st.L1); camT(g, cm);
    drawFig(g, G, { lw: 2.2, ink: WL.line, J, fill: (m, gr) => (gr.far ? WL_F : WL)[m], after: (g2, gr) => gr.k === 'body' && faceLines(g2, gr.H, R.S, { ink: WL.line, lw: 2.2 }) });
    g.setTransform(1, 0, 0, 1, 0, 0);
    bandLayer(st.L2, G, -0.045 * RS_S, -0.02 * RS_S, J, 'rgba(84,34,120,0.46)', m => camT(m, cm));
    g.globalCompositeOperation = 'source-atop'; g.drawImage(st.L2, 0, 0);
    bandLayer(st.L2, G, 0.012 * RS_S, 0.004 * RS_S, J, 'rgba(255,226,150,0.3)', m => camT(m, cm));
    g.drawImage(st.L2, 0, 0); g.globalCompositeOperation = 'source-over';
    c.drawImage(st.L1, 0, 0, W, H);
  }
  function rsTitle(c, t, W, H) {
    if (t < RS_T.title) return;
    const F0 = '"Big Shoulders Display", sans-serif', s = 'Rotoscope', size = 214, y0 = 572;
    c.font = `900 ${size}px ${F0}`;
    let x = 128;
    [...s].forEach((ch, i) => {
      const w = c.measureText(ch).width, at = RS_T.title + i * 0.055, a = seg(t, at, at + 0.22), f = seg(t, at + 0.16, at + 0.42);
      if (a > 0) {
        const dx = vnoise(t * 1.5 + i * 2.1, 3) * 3, dy = vnoise(t * 1.5 + i * 1.3, 9) * 3 - (1 - E.outQt(a)) * 26;
        c.save(); c.translate(x + dx, y0 + dy); c.globalAlpha = a;
        text(c, ch, 9, 9, { font: F0, weight: 900, size, color: `rgba(84,34,110,${0.7 * f})` });
        text(c, ch, 0, 0, { font: F0, weight: 900, size, color: null, stroke: WL.line, lw: 9 });
        c.globalAlpha = f; text(c, ch, 0, 0, { font: F0, weight: 900, size, color: RS.cream });
        c.restore();
      }
      x += w + 6;
    });
    const su = E.outQt(seg(t, 8.85, 9.25));
    if (su > 0) {
      c.globalAlpha = su;
      text(c, 'traced over live action', 136 + (1 - su) * -30, 664, { font: 'Caveat, cursive', weight: 700, size: 66, color: RS.cream, stroke: WL.line, lw: 6 });
      c.globalAlpha = 1;
    }
    const cu = E.outQt(seg(t, 9.05, 9.45));
    if (cu > 0) {
      const s2 = 'FLEISCHER 1915  ·  BAKSHI 1978  ·  A-HA 1985  ·  LINKLATER 2001';
      c.font = '700 25px "Courier Prime"';
      const w = c.measureText(s2).width + s2.length * 2 + 48;
      c.fillStyle = 'rgba(251,239,217,0.92)';
      polyP(c, [[128, 700], [128 + w * cu, 702 + vnoise(t, 3) * 3], [126 + w * cu, 750], [130, 748]]); c.fill();
      c.save(); c.beginPath(); c.rect(128, 690, w * cu, 70); c.clip();
      text(c, s2, 152, 734, { font: '"Courier Prime", monospace', weight: 700, size: 25, ls: 2, color: WL.line });
      c.restore();
    }
    const lu = seg(t, 8.6, 8.9);
    if (lu > 0) {
      c.fillStyle = `rgba(33,20,44,${0.85 * lu})`; polyP(c, [[128, 308], [128 + 560 * E.outQt(lu), 306], [128 + 560 * E.outQt(lu), 352], [130, 354]]); c.fill();
      text(c, 'THE MOTION STYLE ATLAS  ·  FAMILY C', 150, 340, { font: '"Courier Prime", monospace', weight: 700, size: 22, ls: 3, color: `rgba(251,239,217,${lu})` });
    }
  }

  MG.film({
    id: 'rotoscope', dur: 10, poster: 9.5,
    fonts: [['900 214px "Big Shoulders Display"', 'Rotoscope'], ['700 66px Caveat', 'traced over live action frame 57 dwg on twos'], ['500 38px Caveat', 'blue: line of action, joints graphite contour the traced frames play back'], ['700 26px "Courier Prime"', 'PLATE 1A HOLD FRAME 0123456789 24 FPS FLEISCHER BAKSHI A-HA LINKLATER THE MOTION STYLE ATLAS FAMILY C ·']],
    meta: {
      family: 'C', name: 'Rotoscope', sub: 'Traced Over Live Action', era: '1915 —',
      origin: 'Max Fleischer patented the rotoscope in 1915: live-action film projected one frame at a time onto glass so an animator could trace real motion. Disney used traced footage as reference for Snow White, Ralph Bakshi built whole features on it, a-ha’s “Take On Me” turned it into a living pencil sketch, and Bob Sabiston’s Rotoshop gave Richard Linklater’s Waking Life and A Scanner Darkly their interpolated, swimming flats.',
      works: 'Out of the Inkwell (Max & Dave Fleischer, 1918–29) · Minnie the Moocher (Fleischer, with Cab Calloway, 1932) · Snow White and the Seven Dwarfs (Disney, 1937) · The Lord of the Rings (Ralph Bakshi, 1978) · Take On Me (a-ha, dir. Steve Barron, 1985) · Waking Life (Richard Linklater, 2001) · A Scanner Darkly (Linklater, 2006)',
      tech: ['Frozen plate traced on pegs', 'Pencil boil with offset hatching', 'Rotoshop-style swimming flats'],
      accent: '#e2843f',
      motionDNA: 'Real human timing that no animator would invent — the heel-strike, the decelerating last step, the weight settling, overlapping arm swing — carried straight into drawing; in pencil the line boils on twos, in Rotoshop the same contours swim smoothly between keyed traces.',
      visualDNA: 'A sepia live-action plate in a projector gate, translucent animation bond on pegs, blue line-of-action construction under graphite contours and diagonal hatching; then flat posterised colour fields, thin wobbling ink lines and backgrounds that breathe.',
      transitions: 'Freeze frame, sheet drop onto pegs, light-table switch-off, push-in to the hand, live-action breakthrough, colour flood from the hand, traced title',
      implementation: ['Rotoscope projector and glass easel', 'Rotoshop vector interpolation', 'After Effects / TVPaint rotoscoping', 'Canvas 2D'],
      reproducibility: 'Fully procedural (the live-action plate is synthesised from the same rig)',
      loopable: false,
    },
    setup() {
      return {
        L1: offscreen(1920, 1080), L2: offscreen(1920, 1080),
        tooth: toothTile(1920, 1080, 41, RS.paper),
        hatch: [0, 1, 2].map(i => hatchTile(70 + i, '#2a2a2e')),
        xhatch: hatchTile(80, '#2a2a2e', true, 8),
      };
    },
    draw(c, t, W, H, st) {
      if (t < RS_T.sketch) { rsPlate(c, t, W, H, st); return; }
      const cm = rsCam(t), k1 = E.ioC(seg(t, RS_T.zoom, 5.5));
      if (t < RS_T.wake + 0.45) rsSketch(c, t, W, H, st, cm, k1);
      if (t >= RS_T.wake) {
        // colour floods out of the hand in a swimming blob
        const u = E.inQ(seg(t, RS_T.wake, RS_T.wake + 0.42)), hp = toScr(cm, rsHand(rsRig(rsTau(t))));
        c.save();
        if (u < 1) {
          const r = lerp(30, 2300, u), n = 40, pts = [];
          for (let i = 0; i < n; i++) { const a = (i / n) * TAU, rr = r * (1 + 0.16 * vnoise(i * 0.7 + t * 3, 4)); pts.push([hp[0] + Math.cos(a) * rr, hp[1] + Math.sin(a) * rr]); }
          c.beginPath(); sPath(c, pts); c.clip();
        }
        rsWake(c, t, W, H, st, cm);
        rsTitle(c, t, W, H);
        c.restore();
        if (u < 1) {
          const r = lerp(30, 2300, u); c.strokeStyle = WL.line; c.lineWidth = 4;
          c.beginPath(); const n = 40, pts = [];
          for (let i = 0; i < n; i++) { const a = (i / n) * TAU, rr = r * (1 + 0.16 * vnoise(i * 0.7 + t * 3, 4)); pts.push([hp[0] + Math.cos(a) * rr, hp[1] + Math.sin(a) * rr]); }
          sPath(c, pts); c.stroke();
        }
        grain(c, W, H, t, 0.045);
      }
    },
    score(A) {
      A.bus.gain.value = 0.85;
      // 1. the plate: projector motor, the shutter at 24 fps, a muffled 78 of hot jazz
      A.osc(0, { type: 'triangle', f: 58, dur: 2.45, g: 0.05, lp: 320, hold: true, rel: 0.1, vib: [24, 1.5] });
      A.osc(2.36, { type: 'triangle', f: 58, f2: 26, glide: 0.35, dur: 0.4, g: 0.05, lp: 320 });
      for (let k = 0; k < 57; k++) A.noise(k / 24, { type: 'bandpass', f: 1700 + hash(k) * 500, q: 3, dur: 0.012, g: 0.03 });
      for (let k = 0; k < 46; k++) A.noise(hash(k * 3.7) * 2.4, { type: 'highpass', f: 3500, dur: 0.005, g: 0.02 + 0.05 * hash(k) });
      const bass = [45, 48, 50, 51, 52, 50, 48, 45, 43, 40];
      bass.forEach((m, i) => { if (i * 0.25 < 2.4) A.pluck(0.05 + i * 0.25, midi(m), { dur: 0.4, bright: 0.4, g: 0.26, lp: 700 }); });
      for (let i = 0; i < 9; i++) A.noise(0.18 + i * 0.25, { type: 'bandpass', f: 2600, q: 0.6, dur: 0.16, g: 0.035, rev: 0.1 });
      const horn = [[0.05, 69, 0.4], [0.55, 72, 0.2], [0.8, 74, 0.2], [1.05, 75, 0.45], [1.55, 74, 0.2], [1.8, 72, 0.2], [2.05, 69, 0.32]];
      horn.forEach(([t, m, d]) => A.osc(t, { type: 'sawtooth', f: midi(m), dur: d, g: 0.035, lp: 1200, q: 3, vib: [5.5, 5], hold: true, rel: 0.05, a: 0.03, rev: 0.15 }));
      A.osc(2.3, { type: 'sawtooth', f: midi(67), f2: midi(55), glide: 0.4, dur: 0.45, g: 0.03, lp: 1000, q: 2, a: 0.02 });
      // 2. the sheet drops on the pegs; blue pencil, then graphite, scratch along each part
      A.whoosh(RS_T.sheet, 0.32, { f1: 300, f2: 1400, g: 0.08 });
      A.osc(RS_T.sheet + 0.34, { f: 140, f2: 60, glide: 0.08, dur: 0.12, g: 0.12 });
      A.noise(RS_T.sheet + 0.34, { type: 'bandpass', f: 900, q: 1, dur: 0.06, g: 0.08 });
      for (let i = 0; i < 12; i++) A.noise(RS_T.blue + i * 0.028, { type: 'bandpass', f: 2300 + hash(i) * 600, q: 1.6, dur: 0.05, g: 0.03 });
      for (let i = 0; i < 26; i++) A.noise(RS_T.trace + i * 0.03, { type: 'bandpass', f: 3300 + hash(i * 5) * 1600, q: 2, dur: 0.035, g: 0.04 + 0.02 * hash(i) });
      A.noise(RS_T.off, { type: 'bandpass', f: 1500, q: 5, dur: 0.02, g: 0.12 });
      A.osc(RS_T.off, { type: 'square', f: 2400, dur: 0.015, g: 0.03 });
      // 3. the pencil world: 120 bpm synth-pop, drum machine and a bright arpeggio
      const B = 0.5, t0 = RS_T.sketch;
      for (let i = 0; i < 5; i++) { A.kick(t0 + i * B, 0.55); if (i % 2) A.snare(t0 + i * B, 0.22, { rev: 0.5 }); }
      for (let i = 0; i < 20; i++) A.hat(t0 + i * 0.125, i % 2 ? 0.03 : 0.05, false, { pan: i % 2 ? 0.3 : -0.3 });
      const ch = [[t0, [57, 61, 64]], [t0 + 1.0, [56, 59, 64]], [t0 + 1.75, [54, 57, 61]], [t0 + 2.25, [50, 54, 57]]];
      ch.forEach(([t, n], i) => {
        const end = i < ch.length - 1 ? ch[i + 1][0] : t0 + 2.5;
        A.chord(t, n, { type: 'sawtooth', dur: end - t, g: 0.03, lp: 1600, a: 0.02, hold: true, rel: 0.05, spread: 8 });
        A.pluck(t, midi(n[0] - 24), { dur: end - t, g: 0.3, bright: 0.5, lp: 600 });
        for (let s = 0; s * 0.125 < end - t - 0.01; s++) A.osc(t + s * 0.125, { type: 'square', f: midi(n[s % 3] + 12 * (1 + ((s >> 2) % 2))), dur: 0.1, g: 0.026, lp: 3200, pan: s % 2 ? 0.25 : -0.25 });
      });
      A.riser(5.3, 1.2, { g: 0.12, f: 220 });
      // 4. colour floods: a tango-waltz in D minor, pizzicato and a sighing violin
      const w0 = RS_T.wake;
      A.impact(w0, 0.35, { rev: 0.5 });
      A.noise(w0, { type: 'highpass', f: 5000, dur: 1.2, g: 0.05, rev: 0.5 });
      const wz = [[w0, 38, [62, 65, 69]], [w0 + 1.5, 43, [62, 67, 70]], [w0 + 2.25, 45, [61, 64, 67]]];
      wz.forEach(([t, b, n], i) => {
        A.pluck(t, midi(b), { dur: 0.9, bright: 0.6, g: 0.3 });
        const beats = i === 2 ? 1 : 2;
        for (let s = 1; s <= beats; s++) n.forEach(m => A.pluck(t + s * B, midi(m), { dur: 0.35, bright: 0.75, decay: 0.99, g: 0.09, pan: (m % 3 - 1) * 0.3 }));
        A.chord(t, n, { type: 'sawtooth', dur: i === 2 ? 0.75 : 1.5, g: 0.016, lp: 900, a: 0.12, hold: true, rel: 0.15, vib: [5, 4], spread: 9 });
      });
      const vl = [[w0, 74, 0.95], [w0 + 1.0, 77, 0.45], [w0 + 1.5, 76, 0.7], [w0 + 2.25, 73, 0.6]];
      vl.forEach(([t, m, d]) => A.osc(t, { type: 'sawtooth', f: midi(m), dur: d, g: 0.04, lp: 2400, q: 1.5, a: 0.12, hold: true, rel: 0.12, vib: [5.5, 6], rev: 0.4 }));
      // floating: shimmer; the title is traced in and the waltz lands home
      for (let i = 0; i < 6; i++) A.bell(8.1 + i * 0.12, midi(86 + [0, 3, 7, 10, 7, 3][i]), { g: 0.03, dur: 1.0, rev: 0.6, pan: (i % 2 ? 0.4 : -0.4) });
      A.pluck(9.25, midi(38), { dur: 0.75, bright: 0.6, g: 0.32 });
      A.chord(9.25, [62, 65, 69, 74], { type: 'sawtooth', dur: 0.75, g: 0.018, lp: 1100, a: 0.05, vib: [5, 4], spread: 9, rev: 0.5 });
      A.osc(9.25, { type: 'sawtooth', f: midi(74), dur: 0.72, g: 0.04, lp: 2400, a: 0.05, hold: true, rel: 0.3, vib: [5.5, 6], rev: 0.5 });
      for (let i = 0; i < 9; i++) A.noise(RS_T.title + i * 0.055, { type: 'bandpass', f: 3800, q: 2, dur: 0.04, g: 0.025 });
    },
  });
  /* =====================================================================
     FRAME BY FRAME — a pencil test shot on twos. A sheet of bond drops on
     the pegs; blue pencil plans a ground line, an arc and the spacing
     chart, then the classic bouncing ball runs straight-ahead with its
     onion skins (red behind, blue ahead), squashing on every contact while
     the X-sheet fills in. The ball comes to rest, stretches up and becomes
     a dancer's head; construction circles and a line of action grow a body
     beneath it. She crouches, leaps a grand jeté, lands, turns a
     pirouette and holds an arabesque — every drawing boiling. The whole
     run is laid over itself like a chronophotograph and the title is
     lettered one stroke per drawing.
     ===================================================================== */
  const FB = { paper: '#f3eee0', table: '#2e2c28', lead: '#2b2b2f', blue: '#3e72c6', red: '#cf4a3c', mark: 'rgba(255,214,64,0.5)' };
  const FB_T = { plan: 0.3, ball: 0.6, rest: 3.25, cons: 3.45, clean: 3.75, dance: 4.4, chrono: 7.2, title: 8.3 };
  const FB_GY = 900, FB_S = 520, FB_R = 56, CP = '"Courier Prime", monospace', KA = 'Kalam, cursive';
  // every contact lands on a drawing (on twos, a contact between drawings would never be seen)
  const FB_IMP = [12, 20, 26, 31, 35, 38].map(n => n / 12), FB_HT = [560, 400, 250, 140, 70, 30];
  // Height of the ball above the floor: a drop, then parabolas that lose energy every bounce.
  const fbH = t => {
    if (t < FB_IMP[0]) { const u = seg(t, FB_T.ball, FB_IMP[0]); return FB_HT[0] * (1 - u * u); }
    for (let i = 1; i < FB_IMP.length; i++) if (t < FB_IMP[i]) { const u = (t - FB_IMP[i - 1]) / (FB_IMP[i] - FB_IMP[i - 1]); return FB_HT[i] * 4 * u * (1 - u); }
    return 0;
  };
  function fbBall(t) {
    const u = seg(t, FB_T.ball, 3.25), x = 250 + 510 * E.outQ(u), h = fbH(t);
    const vy = (fbH(t + 0.008) - fbH(t - 0.008)) / 0.016, vx = (510 * 2 * (1 - u)) / 2.65;
    let q = 0;
    FB_IMP.forEach((ti, i) => { const d = Math.abs(t - ti); if (d < 0.05) q = Math.max(q, (1 - d / 0.05) * Math.sqrt(FB_HT[i] / 560)); });
    if (q > 0) return { x, y: FB_GY - FB_R * (1 - 0.38 * q) - h, sx: 1 + 0.42 * q, sy: 1 - 0.38 * q, a: 0 };
    const sp = clamp(Math.abs(vy) / 2600);
    return { x, y: FB_GY - FB_R - h, sx: 1 + 0.35 * sp, sy: 1 - 0.18 * sp, a: sp > 0.02 ? Math.atan2(-vy, vx) : 0 };
  }
  function fbBallDraw(c, B, k, col, a, full) {
    c.save(); c.translate(B.x, B.y); c.rotate(B.a);
    const rx = FB_R * B.sx, ry = FB_R * B.sy;
    const pts = [...Array(24)].map((_, i) => { const th = (i / 24) * TAU; return [Math.cos(th) * rx, Math.sin(th) * ry]; });
    pencil(c, [...pts, pts[0], pts[1]], k, 1.3, full ? 2.7 : 2.1, col, a, 1, full ? 2 : 1);
    if (full) {
      c.save(); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.clip();
      c.beginPath(); c.rect(-300, -300, 600, 600); c.ellipse(-rx * 0.22, -ry * 0.26, rx * 0.95, ry * 0.95, 0, 0, TAU); c.clip('evenodd');
      c.rotate(-B.a);
      for (let j = -9; j <= 9; j++) pencil(c, [[j * 9 - 70, 70], [j * 9 + 70, -70]], k + j, 0.8, 1.4, FB.lead, 0.55, 1, 1);
      c.restore();
      pencil(c, [[-12, 0], [12, 0]], k + 3, 0.6, 1.6, FB.blue, 0.7, 1, 1);
      pencil(c, [[0, -12], [0, 12]], k + 5, 0.6, 1.6, FB.blue, 0.7, 1, 1);
    }
    c.restore();
  }
  // The dancer: one pose table, keyed like an animator's extremes (crouch, take-off, jeté, land, passé, arabesque).
  const FBP = { x: 760, air: 0, lean: 0, neck: 0, head: 0, sN: 0.1, eN: 0.2, wN: 0, sF: 0.1, eF: 0.2, wF: 0, hN: 0, kN: 0, fN: 0, hF: 0, kF: 0, fF: 0, open: 0.6, spin: 0 };
  const P_ = o => ({ ...FBP, ...o });
  const FB_CROUCH = P_({ lean: 0.6, neck: -0.2, head: -0.2, sN: -0.55, eN: 0.5, sF: -0.7, eF: 0.4, hN: 1.25, kN: 2.15, hF: 1.05, kF: 2.0 });
  const FB_PASSE = P_({ x: 1272, lean: 0.02, head: -0.05, sN: 2.85, eN: 0.45, wN: 0.2, sF: 2.65, eF: 0.55, hN: 0.04, kN: 0.03, fN: 0, hF: 1.05, kF: 2.25, fF: -0.6, open: 0.8 });
  const FB_ARAB = P_({ x: 1262, lean: 0.85, neck: -0.25, head: -0.5, sN: 1.62, eN: 0.08, wN: 0.15, sF: -1.85, eF: 0.12, hN: 0.06, kN: 0.0, fN: 0, hF: -1.7, kF: 0.06, fF: -0.4, open: 1 });
  const FB_KEYS = [
    [FB_T.rest, FB_CROUCH], [FB_T.dance, FB_CROUCH],
    [4.62, P_({ x: 748, lean: 0.72, neck: -0.25, head: -0.25, sN: -1.05, eN: 0.35, sF: -1.15, eF: 0.3, hN: 1.4, kN: 2.45, hF: 1.2, kF: 2.3 }), E.ioC],
    [4.8, P_({ x: 830, air: 0.04, lean: 0.25, neck: -0.1, head: -0.15, sN: 2.3, eN: 0.25, sF: 1.9, eF: 0.3, hN: 0.25, kN: 0.15, fN: -0.6, hF: -0.35, kF: 0.25, fF: -0.9 }), E.outQ],
    [5.08, P_({ x: 1040, air: 0.32, lean: 0.12, neck: -0.05, head: -0.2, sN: 2.05, eN: 0.12, wN: 0.2, sF: -1.75, eF: 0.1, hN: 1.5, kN: 0.05, fN: -0.45, hF: -1.25, kF: 0.12, fF: -0.6, open: 1 }), E.outQ],
    [5.34, P_({ x: 1215, air: 0.06, lean: 0.25, sN: 1.5, eN: 0.25, sF: -1.1, eF: 0.2, hN: 0.6, kN: 0.25, fN: -0.2, hF: -0.55, kF: 0.6, fF: -0.6 }), E.inQ],
    [5.5, P_({ x: 1262, lean: 0.5, neck: -0.15, sN: 0.8, eN: 0.7, sF: -0.4, eF: 0.5, hN: 0.95, kN: 1.6, hF: 0.25, kF: 0.9, fF: -0.2 }), E.outQ],
    [5.8, FB_PASSE, E.ioC], [6.5, { ...FB_PASSE, spin: TAU }, E.ioS],
    [7.05, FB_ARAB, E.ioC], [10, { ...FB_ARAB, lean: 0.88, sN: 1.68, hF: -1.75 }, E.lin],
  ];
  // her ponytail swings behind the head
  const fbTail = (R, H) => {
    const S = R.S, b = H.W(-0.055, -0.03), cl = [];
    for (let i = 0; i <= 9; i++) { const s = i / 9; cl.push([b[0] - R.F * s * 0.1 * S, b[1] + s * 0.2 * S + Math.sin(R.t * 7 - s * 3) * 0.025 * S * s]); }
    return [{ pts: ribbon(cl, 0.026 * S, 0.005 * S), mat: 'hair' }];
  };
  const fbParts = R => figParts(R, { back: fbTail });
  function fbRig(t) {
    const p = poseKF(t, FB_KEYS), R = plant(p, FB_S, FB_GY);
    R.spin = p.spin; R.t = t;
    return R;
  }
  // A 2D turn: squash the drawing about the hips, mirroring as it passes edge-on.
  function fbSpin(g, R) {
    const s = Math.cos(R.spin || 0);
    if (s > 0.999) return;
    const sx = Math.sign(s || 1) * Math.max(0.22, Math.abs(s));
    g.translate(R.P[0], 0); g.scale(sx, 1); g.translate(-R.P[0], 0);
  }
  function fbFigLayer(L, R, k, ink, lw) {
    const g = clr(L); fbSpin(g, R);
    drawFig(g, fbParts(R), {
      lw, ink, passes: [[0, 0.9, 1], [1, 0.4, 0.6]], J: boilJ(k, 1.5), fill: () => 'erase',
      after: (g2, gr) => gr.k === 'body' && faceLines(g2, gr.H, R.S, { ink, lw: lw * 0.75 }),
    });
    return L;
  }
  function fbSheet(c, W, H, st, k) {
    c.fillStyle = FB.table; c.fillRect(0, 0, W, H);
    const nx = (hash(k * 1.7) - 0.5) * 1.6, ny = (hash(k * 2.9) - 0.5) * 1.2;
    c.save(); c.translate(nx, ny);
    c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(72, 44, 1800, 1020);
    c.drawImage(st.tooth, (hash(k * 3.3) * 120) | 0, (hash(k * 4.1) * 100) | 0, 1800, 1020, 60, 30, 1800, 1020);
    const lg = c.createRadialGradient(960, 560, 300, 960, 560, 1150); lg.addColorStop(0, 'rgba(255,252,240,0.25)'); lg.addColorStop(1, 'rgba(120,100,70,0.12)');
    c.fillStyle = lg; c.fillRect(60, 30, 1800, 1020);
    // the pegs through the punched holes
    c.fillStyle = '#3d3a34'; c.beginPath(); c.arc(960, 72, 17, 0, TAU); c.fill(); rrect(c, 580, 61, 84, 22, 11); c.fill(); rrect(c, 1256, 61, 84, 22, 11); c.fill();
    c.fillStyle = '#a9a69d'; c.beginPath(); c.arc(960, 72, 12, 0, TAU); c.fill(); rrect(c, 586, 65, 72, 14, 7); c.fill(); rrect(c, 1262, 65, 72, 14, 7); c.fill();
    c.restore();
  }
  function fbXsheet(c, t) {
    const x0 = 1652, y0 = 180, rh = 24, rows = 32, fr = Math.floor(t * 24) + 1, first = Math.max(1, fr - 22);
    c.save();
    c.strokeStyle = 'rgba(62,114,198,0.45)'; c.lineWidth = 1.2;
    c.strokeRect(x0, y0 - 34, 170, rows * rh + 34);
    c.beginPath(); c.moveTo(x0 + 70, y0 - 34); c.lineTo(x0 + 70, y0 + rows * rh); c.moveTo(x0, y0); c.lineTo(x0 + 170, y0); c.stroke();
    text(c, 'X-SHEET', x0, y0 - 50, { font: CP, weight: 700, size: 22, ls: 4, color: FB.lead });
    text(c, 'FR', x0 + 14, y0 - 10, { font: CP, weight: 700, size: 18, ls: 2, color: FB.blue });
    text(c, 'DWG', x0 + 88, y0 - 10, { font: CP, weight: 700, size: 18, ls: 2, color: FB.blue });
    c.strokeStyle = 'rgba(62,114,198,0.18)';
    for (let r = 0; r < rows; r++) {
      const n = first + r, y = y0 + r * rh;
      c.beginPath(); c.moveTo(x0, y + rh); c.lineTo(x0 + 170, y + rh); c.stroke();
      if (n === fr) { c.fillStyle = FB.mark; c.fillRect(x0 + 1, y + 1, 168, rh - 2); }
      text(c, String(n), x0 + 56, y + 18, { font: CP, size: 17, align: 'right', color: 'rgba(43,43,47,0.6)' });
      if (n > fr) continue;
      if (n % 2) text(c, String((n + 1) / 2), x0 + 92, y + 19, { font: KA, weight: 700, size: 20, color: FB.lead });
      else pencil(c, [[x0 + 104, y + 1], [x0 + 104, y + rh - 1]], n, 0.5, 1.6, FB.lead, 0.8, 1, 1);
    }
    c.restore();
  }
  function fbChart(c, a, k) {
    if (a <= 0) return;
    const x = 1420, y0 = 190, h = 250;
    c.save(); c.globalAlpha = a;
    text(c, 'spacing', x - 66, y0 - 26, { font: KA, weight: 700, size: 30, color: FB.blue });
    pencil(c, [[x, y0], [x, y0 + h]], k, 0.6, 2, FB.blue, 0.9, 1, 1);
    for (let i = 0; i <= 8; i++) {
      const y = y0 + E.outQ(i / 8) * h, w = i % 4 === 0 ? 30 : 15;
      pencil(c, [[x - w, y], [x + w, y]], k + i, 0.5, 2, FB.blue, 0.9, 1, 1);
      if (i % 4 === 0) text(c, String(i + 1), x + 44, y + 9, { font: KA, weight: 700, size: 24, color: FB.blue });
    }
    text(c, 'ease out', x - 150, y0 + h + 4, { font: KA, weight: 400, size: 26, color: FB.blue });
    c.restore();
  }
  function fbTitle(c, t, k) {
    if (t < FB_T.title) return;
    const s = 'Frame by Frame', n = Math.floor((t - FB_T.title) * 12) + 1, cx = 860, y = 250;
    c.font = `700 150px ${KA}`;
    const tw = c.measureText(s).width;
    let x = cx - tw / 2;
    [...s].forEach((ch, i) => {
      c.font = `700 150px ${KA}`;
      const w = c.measureText(ch).width;
      if (i < n && ch !== ' ') {
        const kk = k * 3 + i * 7, dx = (hash(kk * 1.3) - 0.5) * 3.2, dy = (hash(kk * 2.1) - 0.5) * 3.2, r = (hash(kk * 0.7) - 0.5) * 0.04;
        c.save(); c.translate(x + w / 2 + dx, y + dy); c.rotate(r);
        text(c, ch, 0, 0, { font: KA, weight: 700, size: 150, align: 'center', color: 'rgba(43,43,47,0.92)' });
        c.globalAlpha = 0.3; text(c, ch, 2, -1.5, { font: KA, weight: 700, size: 150, align: 'center', color: FB.lead });
        c.restore();
      }
      x += w;
    });
    const ul = seg(t, 9.25, 9.55);
    if (ul > 0) pencil(c, subdiv([[cx - tw / 2, y + 42], [cx, y + 30], [cx + tw / 2 + 20, y + 22]], 20), k, 1.2, 4, FB.red, 0.85, E.outQ(ul));
    const su = E.outQ(seg(t, 8.95, 9.4));
    if (su > 0) {
      c.save(); c.beginPath(); c.rect(0, 280, 420 + 1000 * su, 100); c.clip();
      text(c, 'straight-ahead animation, drawn on twos', cx, 350, { font: KA, weight: 400, size: 46, align: 'center', color: FB.blue });
      c.restore();
    }
    const sa = seg(t, 9.3, 9.5);
    if (sa > 0) text(c, 'SC 01  ·  24 FPS  ·  ON TWOS  ·  120 DRAWINGS', 112, 1006, { font: CP, weight: 700, size: 22, ls: 3, color: `rgba(43,43,47,${0.75 * sa})` });
  }

  MG.film({
    id: 'framebyframe', dur: 10, poster: 9.6,
    fonts: [['700 150px Kalam', 'Frame by Frame spacing ease out 0123456789'], ['400 46px Kalam', 'straight-ahead animation, drawn on twos pencil test squash!'], ['700 22px "Courier Prime"', 'X-SHEET FR DWG SC 01 · 24 FPS ON TWOS 120 DRAWINGS 0123456789']],
    meta: {
      family: 'C', name: 'Frame by Frame', sub: 'Straight-ahead on Twos', era: '1908 —',
      origin: 'Every frame drawn by hand: since Émile Cohl’s Fantasmagorie and Winsor McCay’s Gertie, animators have drawn on punched paper over a light table and flipped the pages to feel the motion. Pencil tests check timing before anything is cleaned up; Richard Williams codified the craft in The Animator’s Survival Kit, while Bill Plympton’s boiling pencil and Ryan Woodward’s Thought of You leave the rough line on screen.',
      works: 'Fantasmagorie (Émile Cohl, 1908) · Gertie the Dinosaur (Winsor McCay, 1914) · Your Face (Bill Plympton, 1987) · The Man Who Planted Trees (Frédéric Back, 1987) · The Animator’s Survival Kit (Richard Williams, 2001) · Thought of You (Ryan Woodward, 2010)',
      tech: ['Bouncing-ball arcs and spacing', 'Onion skins either side', 'Boiling line on twos'],
      accent: '#3e72c6',
      motionDNA: 'Twelve drawings a second, each held for two frames: a straight-ahead flow from one drawing to the next, squash on contact and stretch on the fall, spacing that eases out of every arc, and a line that never sits still because no two drawings are traced exactly alike.',
      visualDNA: 'Warm animation bond on brass pegs over a light table, blue construction pencil under graphite, red and blue onion skins of the neighbouring drawings, an exposure sheet filling in down the side and hand-lettered notes in the margins.',
      transitions: 'Sheet drop onto pegs, ball-to-character metamorphosis, 2D squash turn, chronophotographic overlay, letter-by-letter title',
      implementation: ['Pencil on punched paper, light table and line tester', 'TVPaint / Toon Boom Harmony / Procreate Dreams', 'Canvas 2D'],
      reproducibility: 'Fully procedural (boil and registration jitter are seeded per drawing)',
      loopable: false,
    },
    setup() {
      return { L1: offscreen(1920, 1080), L2: offscreen(1920, 1080), tooth: toothTile(1920, 1140, 52, FB.paper, 'rgba(110,90,60,', 30000) };
    },
    draw(c, t, W, H, st) {
      const k = Math.floor(t * 12), tq = k / 12;
      fbSheet(c, W, H, st, k);
      // registration nudge carries the drawing with its sheet
      c.save(); c.translate((hash(k * 1.7) - 0.5) * 1.6, (hash(k * 2.9) - 0.5) * 1.2);
      const plan = seg(t, FB_T.plan, FB_T.ball), fade = 1 - seg(t, FB_T.dance - 0.4, FB_T.dance + 0.3);
      const na = seg(t, 0.2, 0.4) * (1 - seg(t, FB_T.title - 0.3, FB_T.title));
      if (na > 0) {
        c.globalAlpha = na;
        text(c, 'pencil test  ·  sc 01', 112, 150, { font: KA, weight: 700, size: 40, color: FB.lead });
        c.globalAlpha = 1;
      }
      // blue planning: the floor, the arc of the bounces, the spacing chart
      pencil(c, subdiv([[110, FB_GY], [1600, FB_GY]], 40), k, 0.9, 2, FB.blue, 0.7 * Math.max(fade, 0.5), E.outQ(plan), 1);
      if (fade > 0) {
        const arc = [];
        for (let n = 8; n <= 39; n++) { const B = fbBall(n / 12); arc.push([B.x, B.y]); }
        pencil(c, arc, k, 0.8, 1.4, FB.blue, 0.35 * fade, E.outQ(plan), 1);
        arc.forEach((p, i) => { if (i / arc.length > plan) return; c.fillStyle = `rgba(62,114,198,${0.5 * fade})`; c.beginPath(); c.arc(p[0], p[1], 3.5, 0, TAU); c.fill(); });
        fbChart(c, fade * seg(t, FB_T.plan + 0.1, FB_T.ball + 0.1), k);
        const sq = seg(t, 1.0, 1.2) * (1 - seg(t, 2.6, 2.9));
        if (sq > 0) { const B = fbBall(FB_IMP[0]); c.globalAlpha = sq; text(c, 'squash!', B.x - 50, FB_GY + 62, { font: KA, weight: 700, size: 36, color: FB.red }); pencil(c, [[B.x - 10, FB_GY + 24], [B.x, FB_GY + 8]], k, 0.6, 2, FB.red, sq); c.globalAlpha = 1; }
      }
      // the bouncing ball, onion-skinned
      if (tq < FB_T.rest) {
        const tb = Math.max(tq, FB_T.ball);
        if (t > 0.45) {
          [[-3, FB.red, 0.14], [-2, FB.red, 0.26], [-1, FB.red, 0.42], [1, FB.blue, 0.3]].forEach(([d, col, a]) => {
            const tt = tq + d / 12; if (tt < FB_T.ball || tt > FB_T.rest) return;
            fbBallDraw(c, fbBall(tt), k + d, col, a, false);
          });
          const B = fbBall(tb), sh = 1 - fbH(tb) / 700;
          c.fillStyle = `rgba(43,43,47,${0.16 * sh})`; c.beginPath(); c.ellipse(B.x, FB_GY + 4, FB_R * (0.6 + 0.6 * sh), 9 * sh, 0, 0, TAU); c.fill();
          fbBallDraw(c, B, k, FB.lead, 1, true);
        }
      } else if (tq < FB_T.dance) {
        // metamorphosis: the ball rises into a head and a body is constructed under it
        const R = fbRig(FB_T.rest), um = E.ioC(seg(tq, FB_T.rest, FB_T.rest + 0.33)), b0 = fbBall(FB_T.rest), sc = lerp(1, (0.064 * FB_S) / FB_R, um), st2 = Math.sin(um * PI);
        if (tq < FB_T.clean + 0.1) fbBallDraw(c, { x: lerp(b0.x, R.Hd[0], um), y: lerp(b0.y, R.Hd[1], um), sx: sc * (1 - 0.25 * st2), sy: sc * (1 + 0.5 * st2), a: 0 }, k, FB.lead, 1, um < 0.5);
        drawCons(c, R, seg(tq, FB_T.cons, FB_T.cons + 0.4), k, 1.3, FB.blue, 2, 0.75);
        c.strokeStyle = FB.lead; c.lineWidth = 2.6; c.lineJoin = 'round'; c.lineCap = 'round';
        const tip = traceFig(c, fbParts(R), seg(tq, FB_T.clean, FB_T.dance - 0.02), boilJ(k, 1.3));
        if (tip) pencilSprite(c, tip[0], tip[1], -0.8, 0.8);
      } else {
        const R = fbRig(tq);
        c.save(); fbSpin(c, R); drawCons(c, R, 1, k, 1.6, FB.blue, 1.8, 0.36 * (1 - seg(t, FB_T.chrono, FB_T.chrono + 0.5) * 0.6)); c.restore();
        // chronophotograph: every other drawing of the run laid over itself
        if (t >= FB_T.chrono) {
          const n = 18, dim = lerp(1, 0.5, seg(t, FB_T.title, FB_T.title + 0.6));
          for (let j = 0; j < n; j++) {
            const a = seg(t, FB_T.chrono + j * 0.04, FB_T.chrono + 0.15 + j * 0.04) * dim;
            if (a <= 0) continue;
            const Rj = fbRig(4.4 + (j * 2.75) / (n - 1));
            c.save(); fbSpin(c, Rj); c.globalAlpha = 0.24 * a; c.strokeStyle = FB.blue; c.lineWidth = 1.5; c.lineJoin = 'round';
            c.beginPath(); fbParts(Rj).forEach(g => g.parts.forEach(p => sPath(c, p.pts, null))); c.stroke(); c.restore();
          }
        }
        if (tq < 7.1) [[-2, FB.red, 0.22], [-1, FB.red, 0.4], [1, FB.blue, 0.3]].forEach(([d, col, a]) => {
          const tt = tq + d / 12; if (tt < FB_T.dance) return;
          fbFigLayer(st.L2, fbRig(tt), k + d, col, 2.1);
          c.globalAlpha = a; c.drawImage(st.L2, 0, 0, W, H); c.globalAlpha = 1;
        });
        c.drawImage(fbFigLayer(st.L1, R, k, FB.lead, 2.6), 0, 0, W, H);
      }
      fbTitle(c, t, k);
      c.restore();
      fbXsheet(c, t);
      // the drawing number, circled in the corner of each sheet
      const cx = 1784, cy = 1004;
      pencil(c, [...Array(14)].map((_, i) => [cx + Math.cos(i / 12 * TAU) * 34, cy - 10 + Math.sin(i / 12 * TAU) * 26]), k, 1.2, 2, FB.lead, 0.8, 1, 1);
      text(c, String(k + 1), cx, cy, { font: KA, weight: 700, size: 30, align: 'center', color: FB.lead });
      // line-tester exposure flicker, never a flash
      c.fillStyle = `rgba(255,250,235,${0.025 * hash(k * 9.1)})`; c.fillRect(0, 0, W, H);
      vignette(c, W, H, 0.3);
      grain(c, W, H, t, 0.05);
    },
    score(A) {
      A.bus.gain.value = 1.0;
      const pno = (t, m, g = 0.12, dur = 1.6, pan = 0) => {
        A.pluck(t, midi(m), { dur, g: g * 1.1, bright: 0.55, decay: 0.996, lp: 3400, rev: 0.35, pan });
        A.osc(t, { f: midi(m), dur: dur * 0.8, g: g * 0.35, a: 0.004, rev: 0.35, pan });
      };
      const scr = (t, g = 0.03) => A.noise(t, { type: 'bandpass', f: 2600 + hash(t * 13) * 1400, q: 1.6, dur: 0.05, g });
      // the sheet onto the pegs; the light table hums
      A.whoosh(0, 0.3, { f1: 400, f2: 1600, g: 0.06 });
      A.noise(0.26, { type: 'bandpass', f: 1200, q: 3, dur: 0.03, g: 0.1 }); A.osc(0.26, { f: 220, f2: 140, dur: 0.06, g: 0.05 });
      A.osc(0, { f: 120, dur: 9.9, g: 0.01, hold: true, rel: 0.4 });
      for (let i = 0; i < 7; i++) scr(FB_T.plan + i * 0.045, 0.025);
      // flipping on twos: a faint paper tick per drawing
      for (let k = 7; k < 86; k++) A.noise(k / 12, { type: 'highpass', f: 5000, dur: 0.01, g: 0.012 });
      // bounces: a marimba that falls in pitch and loudness
      const bp = [76, 72, 69, 67, 64, 62];
      FB_IMP.forEach((ti, i) => {
        const g = 0.2 * Math.pow(0.8, i);
        A.bell(ti, midi(bp[i]), { g, dur: 0.9, ratios: [1, 3.93, 9.2], rev: 0.25 });
        A.osc(ti, { f: midi(bp[i] - 24), f2: midi(bp[i] - 26), glide: 0.1, dur: 0.18, g: g * 0.9 });
      });
      // metamorphosis: a rising run, then the pencil builds her
      [60, 64, 67, 72, 76].forEach((m, i) => A.pluck(FB_T.rest + i * 0.07, midi(m), { dur: 0.8, g: 0.11, bright: 0.6, rev: 0.3 }));
      for (let i = 0; i < 16; i++) scr(FB_T.cons + i * 0.058, 0.03);
      // the dance, scored to her extremes
      A.chord(FB_T.dance, [53, 57, 60], { type: 'triangle', dur: 1.1, g: 0.03, lp: 900, a: 0.2, hold: true, rel: 0.3 });
      pno(4.6, 41, 0.14, 1.2); pno(4.6, 48, 0.08, 1.2);
      [65, 69, 72, 77, 81, 84].forEach((m, i) => pno(4.78 + i * 0.045, m, 0.08, 1.2, (i / 5 - 0.5) * 0.6));
      A.bell(5.08, midi(89), { g: 0.06, dur: 1.4, rev: 0.5 });
      A.whoosh(4.75, 0.6, { f1: 500, f2: 3000, g: 0.05 });
      pno(5.5, 38, 0.16, 1.4); [50, 57, 62, 65].forEach(m => pno(5.5, m, 0.06, 1.2));
      A.chord(5.5, [50, 57, 62], { type: 'triangle', dur: 1.3, g: 0.03, lp: 900, a: 0.15, hold: true, rel: 0.3 });
      [58, 62, 65].forEach(m => pno(5.8, m, 0.06, 1.4));
      [77, 79, 81, 84, 86, 89, 91, 93].forEach((m, i) => A.bell(5.82 + i * 0.085, midi(m), { g: 0.035, dur: 0.8, rev: 0.45, pan: Math.sin(i * 1.3) * 0.5 }));
      A.chord(5.8, [46, 53, 58], { type: 'triangle', dur: 1.2, g: 0.03, lp: 900, a: 0.15, hold: true, rel: 0.3 });
      pno(7.05, 41, 0.15, 2.2); [53, 60, 65, 69, 72].forEach((m, i) => pno(7.05 + i * 0.03, m, 0.06, 2.0));
      A.chord(7.05, [53, 60, 64, 69], { type: 'triangle', dur: 1.5, g: 0.03, lp: 1000, a: 0.2, hold: true, rel: 0.5 });
      // chronophotograph: the stack riffled like a flip book, faster and faster
      let tt = FB_T.chrono, dt = 0.085;
      while (tt < 8.2) { A.noise(tt, { type: 'bandpass', f: 2200 + hash(tt * 10) * 1500, q: 1.2, dur: 0.018, g: 0.045 }); tt += dt; dt = Math.max(0.026, dt * 0.9); }
      // the title, a pencil stroke per drawing, and a final chord
      for (let i = 0; i < 14; i++) scr(FB_T.title + i / 12, 0.03);
      pno(9.0, 41, 0.15, 1.0); [57, 60, 65, 67, 72].forEach((m, i) => pno(9.0 + i * 0.04, m, 0.07, 1.0, (i / 4 - 0.5) * 0.5));
      A.bell(9.5, midi(84), { g: 0.05, dur: 0.5, rev: 0.5 });
    },
  });
  /* =====================================================================
     ANIME MG — an OP in ten seconds at 150 bpm. Black; an anamorphic
     streak splits the frame open onto a cel sky with a sweeping flare and
     an OPENING super. Smash cut: the heroine sprints on twos against
     horizontal speed lines, her arms smeared into multiples. Typographic
     cards slam in on the beat — a red ANIME card over giant katakana, a
     yellow MOTION GRAPHICS card, three skewed panels naming the tricks —
     then slide away to a rooftop that tilts up into cumulus. She leaps in
     slow motion across the sun, backlit, with a lens flare, petals and a
     light leak. Impact: focus lines, one inverted frame; an eye opens in
     letterbox with a glint; a white slash wipes to the logo, which slams
     in over a starburst and gets its shine.
     ===================================================================== */
  const AM = { red: '#ff2b4e', red2: '#e3163f', yel: '#ffd60a', cyan: '#19c3ff', ink: '#16111f', white: '#fffaf2', navy: '#1b1f50', pink: '#ff9fcf', sky0: '#1452d0', sky1: '#4f9df2', sky2: '#c8edff' };
  const AM_FIG = { skin: '#ffe0cf', shirt: '#f4f5ff', pants: '#272b5c', shoe: '#e8304a', hair: '#2f3c94', scarf: '#ff2b4e' };
  const AM_FIGF = { skin: '#efc2b0', shirt: '#c9cde9', pants: '#1c1f45', shoe: '#b51f38', hair: '#25307a', scarf: '#cf1a3c' };
  const AM_T = { open: 0.3, run: 1.2, cards: 2.8, c2: 3.25, c3: 3.7, sky: 4.4, jump: 4.75, hit: 6.4, eye: 6.85, wipe: 7.6, slam: 7.85, banner: 8.15, shine: 8.75 };
  const DG = '"Dela Gothic One", sans-serif', AN = 'Anton, sans-serif', BC = '"Barlow Condensed", sans-serif';
  // ponytail and scarf tails stream with the wind (R.wind is a stage-space direction)
  function amBack(R, H) {
    const S = R.S, w = R.wind || [-1, -0.1], b = H.W(-0.05, -0.04), n = LP(R.N, R.C, 0.35), tail = [], s1 = [], s2 = [];
    for (let i = 0; i <= 10; i++) {
      const s = i / 10;
      tail.push([b[0] + w[0] * s * 0.36 * S, b[1] + w[1] * s * 0.36 * S + 0.05 * S * s + Math.sin(R.t * 13 - s * 5) * 0.03 * S * s]);
      s1.push([n[0] + w[0] * s * 0.46 * S, n[1] + w[1] * s * 0.46 * S + Math.sin(R.t * 15 - s * 6) * 0.04 * S * s]);
      s2.push([n[0] + w[0] * s * 0.34 * S, n[1] + w[1] * s * 0.34 * S + 0.03 * S * s + Math.sin(R.t * 15 - s * 6 + 1.7) * 0.035 * S * s]);
    }
    return [{ pts: ribbon(tail, 0.034 * S, 0.006 * S), mat: 'hair' }, { pts: ribbon(s1, 0.024 * S, 0.018 * S), mat: 'scarf' }, { pts: ribbon(s2, 0.02 * S, 0.014 * S), mat: 'scarf' }];
  }
  const amFront = R => [{ pts: capsule(LP(R.N, R.C, 0.05), 0.034 * R.S, LP(R.N, R.C, 0.75), 0.04 * R.S), mat: 'scarf' }];
  const amParts = R => figParts(R, { head: { nose: 0.25, spiky: true }, back: amBack, front: amFront });
  function amFace(c, H, S) {
    const e = H.W(0.03, 0.004), hl = H.W(0.026, -0.005), ln = (a, b, lw) => { const p = H.W(...a), q = H.W(...b); c.lineWidth = lw; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); };
    c.fillStyle = AM.ink; c.beginPath(); c.ellipse(e[0], e[1], 0.011 * S, 0.02 * S, 0, 0, TAU); c.fill();
    c.fillStyle = '#4fb8ff'; c.beginPath(); c.ellipse(e[0], e[1] + 0.008 * S, 0.007 * S, 0.009 * S, 0, 0, TAU); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(hl[0], hl[1], 0.005 * S, 0, TAU); c.fill();
    c.strokeStyle = AM.ink; c.lineCap = 'round';
    ln([0.016, -0.017], [0.046, -0.022], 0.007 * S);
    ln([0.02, -0.034], [0.044, -0.038], 0.004 * S);
    ln([0.04, 0.042], [0.049, 0.041], 0.003 * S);
    c.strokeStyle = '#ff7f9b';
    [0, 1, 2].forEach(i => ln([0.008 + i * 0.008, 0.03], [0.014 + i * 0.008, 0.022], 0.003 * S));
  }
  // Cel-shaded figure: ink union lines, flat fills, one hard shadow band and an optional rim.
  function amFig(st, R, cm, o = {}) {
    const G = amParts(R), g = clr(st.L1);
    g.save(); camT(g, cm);
    if (o.smear) o.smear(g);
    drawFig(g, G, { lw: o.lw || 3.4, ink: o.sil ? o.sil : AM.ink, fill: (m, gr) => o.sil || (gr.far ? AM_FIGF : AM_FIG)[m], after: (g2, gr) => !o.sil && gr.k === 'body' && amFace(g2, gr.H, R.S * R.hs) });
    g.restore();
    const atop = (dx, dy, fs) => { bandLayer(st.L2, G, dx * R.S, dy * R.S, null, fs, m => camT(m, cm)); g.globalCompositeOperation = 'source-atop'; g.drawImage(st.L2, 0, 0); g.globalCompositeOperation = 'source-over'; };
    if (!o.sil) atop(o.ldx ?? 0.03, o.ldy ?? -0.025, 'rgba(112,72,178,0.42)');
    if (o.rim) atop(o.rim[0], o.rim[1], o.rim[2]);
    return st.L1;
  }
  function amRunPose(t) {
    const ph = (TAU * t) / 0.5, s = Math.sin(ph), kn = q => 0.35 + 1.3 * Math.pow(Math.max(0, Math.cos(q + 0.5)), 1.4);
    return { x: 860, air: 0.03 + 0.03 * Math.cos(2 * ph), lean: 0.34, neck: -0.05, head: -0.2, hs: 1.22,
      hN: 0.8 * s, kN: kn(ph), fN: -0.35 + 0.35 * s, hF: -0.8 * s, kF: kn(ph + PI), fF: -0.35 - 0.35 * s,
      sN: -0.95 * s + 0.1, eN: 1.55, wN: 0.1, sF: 0.95 * s + 0.1, eF: 1.55, wF: 0.1, open: 0 };
  }
  const AMB = { x: 0, air: 0, lean: 0.2, neck: 0, head: -0.1, sN: 0.3, eN: 0.6, wN: 0, sF: 0.3, eF: 0.6, wF: 0, hN: 0.2, kN: 0.3, fN: -0.3, hF: -0.2, kF: 0.3, fF: -0.3, open: 0.8, spin: 0 };
  const A_ = o => ({ ...AMB, ...o });
  const AM_JK = [
    [AM_T.jump, A_({ lean: 0.35, sN: -0.8, eN: 0.4, sF: -0.9, eF: 0.3, hN: 0.9, kN: 1.5, hF: -0.2, kF: 1.2, fF: -0.9 })],
    [5.2, A_({ lean: 0.1, head: -0.35, sN: 2.7, eN: 0.25, sF: 2.3, eF: 0.4, hN: 1.6, kN: 2.3, fN: -0.6, hF: 0.5, kF: 1.8, fF: -0.8 })],
    [5.9, A_({ lean: -0.18, head: -0.45, sN: 2.2, eN: 0.1, sF: -2.4, eF: 0.1, hN: 0.8, kN: 0.3, fN: -0.6, hF: -0.9, kF: 1.1, fF: -0.9, open: 1 })],
    [6.4, A_({ lean: 0.0, head: -0.3, sN: 1.8, eN: 0.3, sF: -1.6, eF: 0.4, hN: 0.5, kN: 0.6, hF: -0.5, kF: 1.0 })],
  ];
  const AM_HERO = A_({ lean: 0.62, neck: -0.25, head: -0.35, sN: 0.12, eN: -0.1, wN: 0.9, open: 1, sF: -2.0, eF: 0.35, wF: 0.2, hN: 1.35, kN: 2.25, fN: 0, hF: -0.15, kF: 1.75, fF: -1.3 });
  function amCloud(seed) {
    const w = 1000, h = 460, T = offscreen(w, h), g = T.getContext('2d'), r = rng(seed), blobs = [];
    for (let i = 0; i < 17; i++) {
      const x = 130 + r() * 740, hill = Math.sin((PI * (x - 100)) / 800), rad = 55 + r() * 80 * (0.6 + hill);
      blobs.push([x, 400 - rad * 0.5 - hill * 180 * (0.5 + r() * 0.5), rad]);
    }
    const fillB = (dx, dy) => { g.beginPath(); blobs.forEach(([x, y, rr]) => { g.moveTo(x + dx + rr, y + dy); g.arc(x + dx, y + dy, rr, 0, TAU); }); g.fill(); };
    g.fillStyle = '#bfcaf2'; fillB(0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = '#ffffff'; fillB(-20, -30);
    g.fillStyle = '#a3b0e8'; g.beginPath(); g.moveTo(0, 366); for (let x = 0; x <= w; x += 40) g.lineTo(x, 366 + Math.sin(x * 0.03) * 9); g.lineTo(w, h); g.lineTo(0, h); g.closePath(); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.fillRect(0, 404, w, 100);
    return T;
  }
  const AM_CL = [[0, -260, 600, 1.7, 1], [1, 860, 640, 1.9, 1], [2, 520, 140, 0.8, 0.55], [1, 1460, 70, 0.6, 0.35], [2, -140, 300, 0.62, 0.45], [0, 1240, 380, 0.9, 0.7]];
  function amSky(c, t, W, H, st, ty, sx, sy) {
    const g = c.createLinearGradient(0, -500 + ty * 0.3, 0, H + ty * 0.3);
    g.addColorStop(0, AM.sky0); g.addColorStop(0.55, AM.sky1); g.addColorStop(1, AM.sky2);
    c.fillStyle = g; c.fillRect(-200, -200, W + 400, H + 400);
    const sg = c.createRadialGradient(sx, sy, 40, sx, sy, 560); sg.addColorStop(0, 'rgba(255,250,225,0.9)'); sg.addColorStop(0.3, 'rgba(255,240,200,0.35)'); sg.addColorStop(1, 'rgba(255,240,200,0)');
    c.fillStyle = sg; c.fillRect(sx - 560, sy - 560, 1120, 1120);
    c.fillStyle = '#fffdf2'; c.beginPath(); c.arc(sx, sy, 92, 0, TAU); c.fill();
    AM_CL.forEach(([i, x, y, s, par]) => c.drawImage(st.cloud[i], x - t * 22 * par, y + ty * par, 1000 * s, 460 * s));
  }
  function amFlare(c, sx, sy, W, H, I = 1) {
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(sx - 1100, 0, sx + 1100, 0);
    g.addColorStop(0, 'rgba(60,170,255,0)'); g.addColorStop(0.5, `rgba(180,235,255,${0.6 * I})`); g.addColorStop(1, 'rgba(60,170,255,0)');
    c.fillStyle = g; c.fillRect(sx - 1100, sy - 3, 2200, 6);
    const dx = W / 2 - sx, dy = H / 2 - sy;
    [[0.2, 34, '255,200,120', 0.22, 0], [0.38, 18, '140,255,210', 0.28, 1], [0.62, 70, '120,160,255', 0.12, 1], [0.8, 26, '255,140,210', 0.24, 1], [1.05, 120, '255,220,140', 0.08, 0], [1.25, 12, '255,255,255', 0.4, 0]].forEach(([m, r, col, a, hx]) => {
      const x = sx + dx * 2 * m, y = sy + dy * 2 * m;
      c.fillStyle = `rgba(${col},${a * I})`;
      if (hx) { polyP(c, [...Array(6)].map((_, i) => [x + Math.cos((i / 6) * TAU + 0.3) * r, y + Math.sin((i / 6) * TAU + 0.3) * r])); c.fill(); }
      else { const rg = c.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, `rgba(${col},${a * I})`); rg.addColorStop(1, `rgba(${col},0)`); c.fillStyle = rg; c.fillRect(x - r, y - r, 2 * r, 2 * r); }
    });
    c.restore();
  }
  function amLeak(c, t, W, H, a) {
    c.save(); c.globalCompositeOperation = 'screen';
    const x = -120 + Math.sin(t * 0.9) * 160, g = c.createRadialGradient(x, 120, 30, x, 120, 900);
    g.addColorStop(0, `rgba(255,150,80,${0.55 * a})`); g.addColorStop(0.5, `rgba(255,90,140,${0.2 * a})`); g.addColorStop(1, 'rgba(255,90,140,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.restore();
  }
  function star4(c, x, y, r, col) {
    c.fillStyle = col; c.beginPath();
    c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r * 0.22, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r * 0.22, y); c.quadraticCurveTo(x, y, x, y - r);
    c.moveTo(x - r * 0.7, y); c.quadraticCurveTo(x, y, x, y - r * 0.15); c.quadraticCurveTo(x, y, x + r * 0.7, y); c.quadraticCurveTo(x, y, x, y + r * 0.15); c.quadraticCurveTo(x, y, x - r * 0.7, y);
    c.fill();
  }
  // English super with a small katakana reading above it, in a skewed ink tab.
  function amSuper(c, x, y, en, jp, u, size = 56) {
    if (u <= 0) return;
    c.font = `400 ${size}px ${AN}`;
    const w = c.measureText(en).width + en.length * 3 + 60;
    c.save(); c.translate(x, y);
    c.beginPath(); c.rect(0, -size - 70, w * E.outX(u) + 30, size + 110); c.clip();
    c.fillStyle = AM.ink; polyP(c, [[14, -size - 8], [w + 14, -size - 8], [w, 16], [0, 16]]); c.fill();
    c.fillStyle = AM.red; c.fillRect(0, -size - 8, 8, size + 24);
    text(c, en, 30, 0, { font: AN, size, ls: 3, color: AM.white });
    c.fillStyle = AM.ink; c.fillRect(14, -size - 58, jp.length * 38 + 30, 44);
    text(c, jp, 30, -size - 24, { font: DG, size: 30, ls: 6, color: AM.white });
    c.restore();
  }
  function focusLines(c, cx, cy, n, seed, col, r0 = 300) {
    const r = rng(seed); c.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + (r() - 0.5) * 0.06, w = 0.004 + r() * 0.014, ri = r0 + r() * 260;
      c.beginPath(); c.moveTo(cx + Math.cos(a) * ri, cy + Math.sin(a) * ri);
      c.lineTo(cx + Math.cos(a - w) * 1600, cy + Math.sin(a - w) * 1600); c.lineTo(cx + Math.cos(a + w) * 1600, cy + Math.sin(a + w) * 1600); c.closePath(); c.fill();
    }
  }
  // Wipe-in text through a moving mask (the typographic slam).
  function amWipe(c, s, x, y, o, u, align = 'center') {
    if (u <= 0) return;
    c.font = `${o.weight || 400} ${o.size}px ${o.font}`;
    const w = c.measureText(s).width + (o.ls || 0) * s.length, x0 = align === 'center' ? x - w / 2 : x;
    c.save(); c.beginPath(); c.rect(x0 - 40, y - o.size * 1.2, (w + 80) * E.outX(u), o.size * 1.6); c.clip();
    if (o.shadow) text(c, s, x + o.shadow, y + o.shadow, { ...o, align, color: o.shadowCol || AM.ink });
    text(c, s, x, y, { ...o, align });
    c.restore();
  }
  function amCards(c, t, W, H) {
    // card 1: red slams in from the right over giant katakana
    const u1 = E.outQn(seg(t, AM_T.cards, AM_T.cards + 0.2)), x1 = lerp(W + 500, -400, u1);
    c.save();
    polyP(c, [[x1, -60], [W + 700, -60], [W + 700, H + 60], [x1 - 300, H + 60]]); c.fillStyle = AM.red; c.fill(); c.clip();
    text(c, 'アニメ', 960 - (t - AM_T.cards) * 120, 560, { font: DG, size: 520, align: 'center', base: 'middle', color: AM.red2 });
    c.fillStyle = AM.ink; c.fillRect(0, 150, W, 10); c.fillRect(0, 930, W, 10);
    amWipe(c, 'TV ANIME OPENING', 960, 250, { font: BC, weight: 700, style: 'italic', size: 48, ls: 12, color: AM.white }, seg(t, AM_T.cards + 0.12, AM_T.cards + 0.3));
    amWipe(c, 'ANIME', 960, 720, { font: AN, size: 380, ls: 18, color: AM.white, shadow: 18 }, seg(t, AM_T.cards + 0.1, AM_T.cards + 0.24));
    c.restore();
    // card 2: yellow tilts up from the bottom-left
    const u2 = E.outQn(seg(t, AM_T.c2, AM_T.c2 + 0.22));
    if (u2 > 0) {
      c.save(); c.translate(lerp(-1500, 0, u2), lerp(1100, 0, u2)); c.rotate(lerp(-0.4, -0.06, u2));
      c.fillStyle = AM.yel; c.fillRect(-600, -500, 3200, 2200);
      c.fillStyle = AM.red; c.fillRect(-600, 520, 3200, 46);
      c.fillStyle = AM.ink; c.fillRect(-600, 590, 3200, 12);
      c.restore();
      c.save(); c.translate(960, 540); c.rotate(-0.06); c.translate(-960, -540);
      amWipe(c, 'モーショングラフィックス', 960, 270, { font: DG, size: 52, ls: 10, color: AM.ink }, seg(t, AM_T.c2 + 0.1, AM_T.c2 + 0.26));
      amWipe(c, 'MOTION', 960, 500, { font: AN, size: 230, ls: 14, color: AM.ink }, seg(t, AM_T.c2 + 0.12, AM_T.c2 + 0.24));
      amWipe(c, 'GRAPHICS', 960, 790, { font: AN, size: 230, ls: 14, color: AM.ink, shadow: 10, shadowCol: AM.red }, seg(t, AM_T.c2 + 0.2, AM_T.c2 + 0.32));
      c.restore();
    }
    // card 3: three skewed panels name the tricks
    const P3 = [[AM.cyan, AM.ink, 'スピード線', 'SPEED LINES'], [AM.ink, AM.white, 'オバケ', 'SMEAR FRAMES'], [AM.white, AM.ink, 'セル画', 'CEL FLATS']];
    P3.forEach(([bg, fg, jp, en], i) => {
      const u = E.outQn(seg(t, AM_T.c3 + i * 0.07, AM_T.c3 + i * 0.07 + 0.22));
      if (u <= 0) return;
      const x0 = i * 640 - 70, x1 = (i + 1) * 640 + 70, y = lerp(-H - 300, 0, u) * (i % 2 ? -1 : 1);
      c.save(); c.translate(0, y);
      polyP(c, [[x0 + 130, -40], [x1 + 130, -40], [x1 - 130, H + 40], [x0 - 130, H + 40]]); c.fillStyle = bg; c.fill(); c.clip();
      // centre of the visible strip at height y (the panels are skewed and overlap their neighbours)
      const vis = y2 => { const s2 = 130 - (260 * (y2 + 40)) / (H + 80); return (Math.max(0, i * 640 - 70 + s2) + (i < 2 ? (i + 1) * 640 - 70 + s2 : W)) / 2; };
      const cx = vis(420), cy = 420;
      if (i === 0) for (let j = 0; j < 14; j++) { const yy = 260 + j * 24, len = 160 + hash(j) * 200, xx = cx + 200 - (((t * 1800 + hash(j * 3) * 900) % 700)); c.fillStyle = j % 3 ? AM.white : AM.ink; c.fillRect(xx, yy, len, 4 + hash(j * 5) * 6); }
      if (i === 1) {
        const sw = Math.sin(t * 9) * 140;
        [0.25, 0.5, 0.75].forEach(f => { c.fillStyle = `rgba(255,250,242,${0.28 + f * 0.3})`; c.beginPath(); c.ellipse(cx + sw * f - 80, cy, 60 + (1 - f) * 70, 52, 0, 0, TAU); c.fill(); });
        c.fillStyle = AM.yel; c.beginPath(); c.arc(cx + sw - 80, cy, 58, 0, TAU); c.fill();
      }
      if (i === 2) {
        c.fillStyle = '#ffb3c4'; c.beginPath(); c.arc(cx, cy, 120, 0, TAU); c.fill();
        c.save(); c.beginPath(); c.arc(cx, cy, 120, 0, TAU); c.clip(); c.fillStyle = '#d9607e'; c.beginPath(); c.arc(cx + 50, cy + 46, 132, 0, TAU); c.arc(cx - 30, cy - 30, 118, 0, TAU, true); c.fill('evenodd'); c.restore();
        c.fillStyle = '#fff'; c.beginPath(); c.ellipse(cx - 46, cy - 52, 30, 18, -0.6, 0, TAU); c.fill();
        c.strokeStyle = AM.ink; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, 120, 0, TAU); c.stroke();
      }
      amWipe(c, jp, vis(705), 720, { font: DG, size: 40, ls: 6, color: fg }, seg(t, AM_T.c3 + 0.1 + i * 0.07, AM_T.c3 + 0.3 + i * 0.07));
      amWipe(c, en, vis(795), 820, { font: AN, size: 68, ls: 5, color: fg }, seg(t, AM_T.c3 + 0.12 + i * 0.07, AM_T.c3 + 0.3 + i * 0.07));
      c.restore();
    });
  }
  function amEye(c, x, y, s, open, t) {
    c.save(); c.translate(x, y); c.scale(s, s);
    const up = u => [lerp(-0.62, 0.6, u), lerp(0.08, -0.04, u) - open * 0.46 * Math.pow(Math.sin(u * PI), 0.75)];
    const lo = u => [lerp(-0.62, 0.6, u), lerp(0.08, -0.04, u) + (0.04 + open * 0.15) * Math.sin(u * PI)];
    const shape = () => { c.beginPath(); for (let i = 0; i <= 28; i++) { const p = up(i / 28); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } for (let i = 28; i >= 0; i--) { const p = lo(i / 28); c.lineTo(p[0], p[1]); } c.closePath(); };
    shape(); c.fillStyle = '#fffaf6'; c.fill();
    c.save(); shape(); c.clip();
    const ix = 0.04, iy = 0.0, g = c.createLinearGradient(0, iy - 0.38, 0, iy + 0.38);
    g.addColorStop(0, '#17153c'); g.addColorStop(0.45, '#3a3aa0'); g.addColorStop(0.8, '#36b4ff'); g.addColorStop(1, '#b3f4ff');
    c.fillStyle = g; c.beginPath(); c.ellipse(ix, iy, 0.27, 0.37, 0, 0, TAU); c.fill();
    c.strokeStyle = '#120f2e'; c.lineWidth = 0.018; c.stroke();
    const pd = 1 - 0.3 * seg(t, 7.1, 7.4);
    c.fillStyle = '#0c0a22'; c.beginPath(); c.ellipse(ix, iy - 0.02, 0.1 * pd, 0.16 * pd, 0, 0, TAU); c.fill();
    c.strokeStyle = '#8fe0ff'; c.lineWidth = 0.014; c.beginPath(); c.ellipse(ix, iy + 0.04, 0.19, 0.26, 0, 0.15 * PI, 0.85 * PI); c.stroke();
    c.fillStyle = 'rgba(110,100,200,0.45)'; c.beginPath();
    for (let i = 0; i <= 28; i++) { const p = up(i / 28); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
    for (let i = 28; i >= 0; i--) { const p = up(i / 28); c.lineTo(p[0], p[1] + 0.1); }
    c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(ix - 0.1, iy - 0.13, 0.075, 0.1, -0.3, 0, TAU); c.fill();
    c.beginPath(); c.arc(ix + 0.11, iy + 0.13, 0.035, 0, TAU); c.fill();
    star4(c, ix + 0.14, iy - 0.18, 0.05 + 0.02 * Math.sin(t * 20), '#ffffff');
    const gl = seg(t, 7.2, 7.45);
    if (gl > 0 && gl < 1) { const gx = lerp(-0.7, 0.8, gl), gg = c.createLinearGradient(gx - 0.1, 0, gx + 0.1, 0); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,255,255,0.7)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gg; c.fillRect(-1, -1, 2, 2); }
    c.restore();
    // lashes: a heavy upper lid with a flicked wing, a thin lower line, the brow
    c.strokeStyle = AM.ink; c.lineCap = 'round'; c.lineJoin = 'round';
    c.lineWidth = 0.045 + 0.02 * open; c.beginPath(); for (let i = 0; i <= 28; i++) { const p = up(i / 28); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
    const e1 = up(1), e0 = up(0.86);
    c.fillStyle = AM.ink; polyP(c, [[e0[0], e0[1] - 0.02], [e1[0] + 0.16, e1[1] - 0.12 - 0.08 * open], [e1[0] + 0.02, e1[1] + 0.03]]); c.fill();
    c.lineWidth = 0.016; c.beginPath(); for (let i = 10; i <= 28; i++) { const p = lo(i / 28); i > 10 ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
    c.lineWidth = 0.035; c.beginPath(); c.moveTo(-0.5, -0.56 - 0.06 * open); c.quadraticCurveTo(0.05, -0.74 - 0.08 * open, 0.58, -0.6 - 0.05 * open); c.stroke();
    c.restore();
  }
  function amLogo(c, t, W, H, st) {
    c.fillStyle = AM.white; c.fillRect(0, 0, W, H);
    // starburst, halftone corners, giant outline katakana
    const bu = E.outQt(seg(t, AM_T.slam, AM_T.slam + 0.4)), cx = 960, cy = 470;
    if (bu > 0) {
      c.save(); c.translate(cx, cy); c.rotate(t * 0.25); c.scale(bu, bu); c.fillStyle = '#ffe99c';
      for (let i = 0; i < 24; i += 2) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 1500, (i / 24) * TAU, ((i + 1) / 24) * TAU); c.closePath(); c.fill(); }
      c.restore();
    }
    c.drawImage(st.dots, 0, 0, W, H);
    text(c, 'アニメ', 960 - (t - AM_T.wipe) * 50, 560, { font: DG, size: 560, align: 'center', base: 'middle', color: null, stroke: 'rgba(255,43,78,0.22)', lw: 5 });
    amLeak(c, t, W, H, 0.6);
    // the logo slams in with a spring
    if (t >= AM_T.slam) {
      const s = lerp(2.4, 1, spring(t - AM_T.slam, 3.0, 0.42)), sh = Math.exp(-(t - AM_T.slam) * 9) * 22;
      const ox = vnoise(t * 40, 2) * sh, oy = vnoise(t * 40, 7) * sh;
      const lt = (g) => { g.translate(cx + ox, 560 + oy); g.scale(s, s); g.transform(1, 0, -0.2, 1, 0, 0); };
      const o = { font: AN, size: 330, ls: 14, align: 'center', base: 'alphabetic' };
      c.save(); lt(c);
      text(c, 'ANIME', 16, 18, { ...o, color: null, stroke: AM.ink, lw: 52 });
      text(c, 'ANIME', 0, 0, { ...o, color: null, stroke: AM.ink, lw: 48 });
      text(c, 'ANIME', 0, 0, { ...o, color: null, stroke: AM.red, lw: 24 });
      c.restore();
      const g = clr(st.L1); lt(g);
      const fg = g.createLinearGradient(0, -260, 0, 0); fg.addColorStop(0, '#fffbe8'); fg.addColorStop(0.55, '#ffd23f'); fg.addColorStop(1, '#ff8a1f');
      text(g, 'ANIME', 0, 0, { ...o, color: fg });
      g.setTransform(1, 0, 0, 1, 0, 0);
      const su = seg(t, AM_T.shine, AM_T.shine + 0.4);
      if (su > 0 && su < 1) {
        g.globalCompositeOperation = 'source-atop';
        const x = lerp(300, 1700, E.ioC(su)), sg = g.createLinearGradient(x - 160, 0, x + 160, 0);
        sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.95)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
        g.save(); g.translate(x, 400); g.transform(1, 0, -0.5, 1, 0, 0); g.translate(-x, -400); g.fillStyle = sg; g.fillRect(x - 200, 0, 400, 1080); g.restore();
        g.globalCompositeOperation = 'source-over';
      }
      c.drawImage(st.L1, 0, 0, W, H);
      const sp = E.outB(seg(t, 9.1, 9.35), 2.5);
      if (sp > 0) { star4(c, 1460, 300, 110 * sp, '#ffffff'); star4(c, 1460, 300, 70 * sp, AM.yel); }
    }
    // banner and supers
    const bn = E.outQn(seg(t, AM_T.banner, AM_T.banner + 0.25));
    if (bn > 0) {
      c.save(); c.translate(lerp(-1400, 0, bn), 0);
      c.fillStyle = AM.ink; polyP(c, [[470, 640], [1470, 640], [1440, 742], [440, 742]]); c.fill();
      c.fillStyle = AM.red; polyP(c, [[1470, 640], [1500, 640], [1470, 742], [1440, 742]]); c.fill();
      text(c, 'MOTION GRAPHICS', 955, 722, { font: AN, size: 84, ls: 14, align: 'center', color: AM.white });
      c.restore();
    }
    amWipe(c, 'モーショングラフィックス', 960, 820, { font: DG, size: 40, ls: 12, color: AM.red }, seg(t, AM_T.banner + 0.2, AM_T.banner + 0.45));
    const la = seg(t, 8.4, 8.6);
    if (la > 0) {
      c.globalAlpha = la;
      text(c, 'OPENING TITLE SEQUENCE', 120, 140, { font: BC, weight: 700, style: 'italic', size: 40, ls: 6, color: AM.ink });
      c.fillStyle = AM.red; c.fillRect(120, 158, 420 * E.outQt(la), 6);
      text(c, 'THE MOTION STYLE ATLAS  ·  FAMILY C', 960, 1010, { font: BC, weight: 600, size: 28, ls: 6, align: 'center', color: 'rgba(22,17,31,0.7)' });
      c.globalAlpha = 1;
    }
    const ep = E.outB(seg(t, 8.45, 8.7), 2.2);
    if (ep > 0) {
      c.save(); c.translate(1710, 170); c.rotate(-0.16); c.scale(ep, ep);
      c.fillStyle = AM.ink; c.beginPath(); c.arc(8, 8, 96, 0, TAU); c.fill();
      c.fillStyle = AM.red; c.beginPath(); c.arc(0, 0, 96, 0, TAU); c.fill();
      text(c, 'EP.01', 0, 24, { font: AN, size: 66, ls: 2, align: 'center', color: AM.white });
      c.restore();
    }
    // the slam's single flash
    if (t >= AM_T.slam && t < AM_T.slam + 0.16) { c.fillStyle = `rgba(255,255,255,${1 - seg(t, AM_T.slam, AM_T.slam + 0.16)})`; c.fillRect(0, 0, W, H); }
  }

  MG.film({
    id: 'animemg', dur: 10, poster: 9.4,
    fonts: [['400 120px "Dela Gothic One"', 'アニメモーショングラフィックススピード線オバケセル画レンズフレアオープニング集中線'], ['400 300px Anton', 'ANIME MOTION GRAPHICS SPEED LINES SMEAR FRAMES CEL FLATS LENS FLARE LIGHT LEAK FOCUS EP.01'], ['italic 700 48px "Barlow Condensed"', 'TV ANIME OPENING TITLE SEQUENCE'], ['600 28px "Barlow Condensed"', 'THE MOTION STYLE ATLAS · FAMILY C']],
    meta: {
      family: 'C', name: 'Anime MG', sub: 'OP & Title-card Motion Graphics', era: '1995 —',
      origin: 'Japanese TV anime compresses a whole show into a 90-second opening cut hard to its theme song: speed lines, smear frames, cel-flat colour, lens flares and huge type. Evangelion’s stark kanji title cards, Production I.G’s layered digital compositing, Shaft’s typographic interruptions and TRIGGER’s slammed katakana logos made the title card itself a motion-graphics form.',
      works: 'Neon Genesis Evangelion (Gainax, 1995) · Ghost in the Shell: Stand Alone Complex (Production I.G, 2002) · The Melancholy of Haruhi Suzumiya (Kyoto Animation, 2006) · Bakemonogatari (Shaft, 2009) · Kill la Kill (Trigger, 2013) · Promare (Trigger, 2019)',
      tech: ['Speed lines and smear multiples', 'Beat-synced type-card slams', 'Cel shadow bands, flares, leaks'],
      accent: '#ff2b4e',
      motionDNA: 'Cut to the beat: holds and slams on the downbeat, characters on twos against backgrounds panning on ones, smear multiples on fast limbs, slow-motion leaps across the sun, a single impact frame with decaying shake, springy logo slams and a closing shine.',
      visualDNA: 'Flat cel colour with one hard shadow tone, ink outlines, saturated red/yellow/cyan cards, heavy condensed English type paired with katakana, cel-shaded cumulus on gradient skies, hexagonal lens ghosts, warm light leaks, sparkles and halftone starbursts.',
      transitions: 'Anamorphic slit open, smash cut, panel slams and slides, tilt-up reveal, impact inversion, letterbox snap, white slash wipe, logo slam',
      implementation: ['Hand-drawn cels and digital ink & paint', 'After Effects compositing (flares, leaks, type)', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const dots = offscreen(1920, 1080), d = dots.getContext('2d');
      for (let y = 0; y < 1080; y += 22) for (let x = 0; x < 1920; x += 22) {
        const ox = (y / 22) % 2 ? 11 : 0, q = Math.max(clamp(1 - Math.hypot(x / 1920, y / 1080) * 1.6), clamp(1 - Math.hypot(1 - x / 1920, 1 - y / 1080) * 1.6));
        if (q > 0.02) { d.fillStyle = 'rgba(255,120,170,0.55)'; d.beginPath(); d.arc(x + ox, y, 9 * q, 0, TAU); d.fill(); }
      }
      return { L1: offscreen(1920, 1080), L2: offscreen(1920, 1080), cloud: [11, 23, 37].map(amCloud), dots };
    },
    draw(c, t, W, H, st) {
      const k = Math.floor(t * 12), tq = k / 12;
      if (t < AM_T.run) {
        // ---------- cold open: an anamorphic slit opens onto the sky ----------
        const sx = lerp(260, 1560, E.ioS(t / AM_T.run)), sy = 330;
        amSky(c, t, W, H, st, 120, sx, sy);
        amFlare(c, sx, sy, W, H, 1);
        const ap = E.ioX(seg(t, AM_T.open, 0.95)), bar = lerp(H / 2 + 4, 0, ap);
        c.fillStyle = '#000'; c.fillRect(0, 0, W, bar); c.fillRect(0, H - bar, W, bar);
        const sl = E.outQt(seg(t, 0.06, 0.32)), fa = 1 - seg(t, 0.8, 1.0);
        if (sl > 0 && fa > 0) {
          const g = c.createLinearGradient(W / 2 - 1100 * sl, 0, W / 2 + 1100 * sl, 0);
          g.addColorStop(0, 'rgba(90,200,255,0)'); g.addColorStop(0.5, `rgba(220,245,255,${fa})`); g.addColorStop(1, 'rgba(90,200,255,0)');
          c.fillStyle = g; c.fillRect(0, bar - 3, W, 6); c.fillRect(0, H - bar - 3, W, 6);
        }
        const ta = E.outQt(seg(t, 0.55, 0.85));
        if (ta > 0) {
          c.globalAlpha = ta;
          text(c, 'オープニング', 960, 500, { font: DG, size: 34, ls: 16, align: 'center', color: AM.white, stroke: 'rgba(20,40,120,0.5)', lw: 6 });
          text(c, 'OPENING', 960 + (1 - ta) * 60, 610, { font: BC, weight: 700, style: 'italic', size: 110, ls: 30, align: 'center', color: AM.white, stroke: 'rgba(20,40,120,0.45)', lw: 8 });
          c.globalAlpha = 1;
        }
      } else if (t < AM_T.cards + 0.22) {
        // ---------- the sprint: speed-line BG on ones, heroine on twos ----------
        c.save(); c.translate(960, 540); c.rotate(-0.05); c.translate(-960, -540);
        const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1e46d8'); g.addColorStop(1, '#6fc2ff');
        c.fillStyle = g; c.fillRect(-200, -200, W + 400, H + 400);
        for (let i = 0; i < 70; i++) {
          const y = hash(i * 1.3) * (H + 300) - 150, len = 200 + hash(i * 2.1) * 900, sp = 2600 + hash(i * 3.7) * 3200, w = 2 + hash(i * 5.3) * 10;
          const x = W + 300 - ((t * sp + hash(i * 7.1) * 5000) % (W + len + 600));
          c.fillStyle = i % 4 === 0 ? 'rgba(25,195,255,0.9)' : i % 3 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.9)';
          rrect(c, x, y, len, w, w / 2); c.fill();
        }
        const p = amRunPose(tq), R = plant(p, 600, 960); R.t = tq; R.wind = [-1, -0.12];
        const cm = { x: 960 + vnoise(t * 30, 3) * 4, y: 540 + vnoise(t * 30, 6) * 4, z: 1 };
        const smear = g2 => {
          [1 / 24, 1 / 48].forEach((d, j) => {
            const Rs = plant(amRunPose(tq - d), 600, 960); Rs.t = tq; Rs.wind = R.wind;
            const G2 = amParts(Rs);
            [G2[4], G2[3]].forEach(gr => gr.parts.forEach(pp => { g2.globalAlpha = 0.55 + j * 0.25; g2.fillStyle = AM_FIG[pp.mat]; g2.beginPath(); sPath(g2, pp.pts); g2.fill(); }));
          });
          g2.globalAlpha = 1;
        };
        c.drawImage(amFig(st, R, cm, { smear, ldx: 0.03, ldy: -0.025 }), 0, 0, W, H);
        c.restore();
        amSuper(c, 110, 1000, 'SPEED LINES', 'スピード線', seg(t, 1.55, 1.8) * (1 - seg(t, 2.6, 2.75)));
        if (t >= AM_T.cards) amCards(c, t, W, H);
      } else if (t < AM_T.sky + 0.24) {
        if (t >= AM_T.sky) amSky(c, t, W, H, st, 0, 1150, 175);
        c.save(); c.translate(0, -E.inQ(seg(t, AM_T.sky, AM_T.sky + 0.24)) * (H + 400));
        amCards(c, t, W, H);
        c.restore();
      } else if (t < AM_T.hit) {
        // ---------- the sky: tilt up from the roof, slow-motion leap across the sun ----------
        const ty = 620 * E.ioC(seg(t, AM_T.sky, 5.1)), sx = 1150, sy = 175 + ty * 0.25;
        amSky(c, t, W, H, st, ty, sx, sy);
        // rooftop railing, falling away as we tilt
        c.fillStyle = AM.navy; c.fillRect(-10, 900 + ty, W + 20, 400);
        c.fillRect(-10, 760 + ty, W + 20, 14); c.fillRect(-10, 830 + ty, W + 20, 10);
        for (let x = 20; x < W; x += 120) c.fillRect(x, 760 + ty, 10, 140);
        // petals
        for (let i = 0; i < 26; i++) {
          const x = ((hash(i) * 2400 - t * 140 * (0.5 + hash(i * 2))) % 2400 + 2400) % 2400 - 240, y = ((hash(i * 3) * 1300 + t * 110 * (0.6 + hash(i * 5))) % 1300) - 110;
          c.save(); c.translate(x, y); c.rotate(t * 2 + i); c.scale(1, 0.5 + 0.5 * Math.sin(t * 5 + i));
          c.fillStyle = i % 3 ? '#ffc3dc' : '#ff9fcf'; c.beginPath(); c.ellipse(0, 0, 12, 7, 0, 0, TAU); c.fill(); c.restore();
        }
        const u = seg(t, AM_T.jump, 6.45), p = poseKF(t, AM_JK);
        p.x = lerp(330, 1640, u); p.y = 770 - 430 * Math.sin(u * PI); p.hs = 1.22; p.face = 1;
        const R = rig(p, 440); R.t = t * 0.4; R.wind = [-0.9, 0.22];
        const dx = sx - R.P[0], dy = sy - R.P[1], dl = Math.hypot(dx, dy) || 1;
        if (t >= AM_T.jump) c.drawImage(amFig(st, R, { x: 960, y: 540, z: 1 }, { sil: AM.navy, lw: 2, rim: [(-dx / dl) * 0.018, (-dy / dl) * 0.018, 'rgba(255,226,170,0.95)'] }), 0, 0, W, H);
        amFlare(c, sx, sy, W, H, 0.9 + 0.3 * Math.sin(t * 3));
        amLeak(c, t, W, H, 0.9);
        for (let i = 0; i < 9; i++) { const tw = Math.max(0, Math.sin(t * 6 + i * 2.3)); if (tw > 0.2) star4(c, 200 + hash(i * 4.4) * 1500, 120 + hash(i * 9.1) * 600, 26 * tw, 'rgba(255,255,255,0.9)'); }
        amSuper(c, 110, 1000, 'LENS FLARE  ·  LIGHT LEAK', 'レンズフレア', seg(t, 5.3, 5.55) * (1 - seg(t, 6.2, 6.35)), 52);
      } else if (t < AM_T.eye) {
        // ---------- impact: focus lines, one inverted frame, decaying shake ----------
        const sh = Math.exp(-(t - AM_T.hit) * 7) * 26;
        c.save(); c.translate(vnoise(t * 40, 1) * sh, vnoise(t * 40, 4) * sh);
        const g = c.createRadialGradient(880, 470, 100, 880, 470, 1300); g.addColorStop(0, '#ff5a6e'); g.addColorStop(1, '#b8102e');
        c.fillStyle = g; c.fillRect(-100, -100, W + 200, H + 200);
        focusLines(c, 880, 470, 110, 500 + (k >> 0), 'rgba(255,248,240,0.85)', 330);
        const R = plant({ ...AM_HERO, x: 880, hs: 1.22, face: 1 }, 740, 1040); R.t = t; R.wind = [-0.95, -0.45];
        const z = 1 + 0.14 * (1 - E.outX(seg(t, AM_T.hit, AM_T.hit + 0.3)));
        c.drawImage(amFig(st, R, { x: 960, y: 540, z }, { lw: 4.2, ldx: 0.03, ldy: -0.025 }), 0, 0, W, H);
        amWipe(c, 'FOCUS LINES', 1470, 420, { font: AN, size: 120, ls: 6, color: AM.white, shadow: 10 }, seg(t, AM_T.hit + 0.08, AM_T.hit + 0.2));
        amWipe(c, '集中線', 1470, 250, { font: DG, size: 64, ls: 14, color: AM.yel, stroke: AM.ink, lw: 8 }, seg(t, AM_T.hit + 0.12, AM_T.hit + 0.24));
        c.restore();
        if (t < AM_T.hit + 0.067) { c.save(); c.globalCompositeOperation = 'difference'; c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H); c.restore(); }
      } else {
        if (t < AM_T.wipe + 0.26) {
          // ---------- the eye opens in letterbox ----------
          const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffe8da'); g.addColorStop(1, '#ffd3c2');
          c.fillStyle = g; c.fillRect(0, 0, W, H);
          c.strokeStyle = 'rgba(255,110,140,0.6)'; c.lineWidth = 7; c.lineCap = 'round';
          for (let i = 0; i < 6; i++) { const x = 1480 + i * 34; c.beginPath(); c.moveTo(x, 830); c.lineTo(x + 30, 780); c.stroke(); }
          const op = t < 6.97 ? 0.03 : clamp(E.outB(seg(t, 6.97, 7.12), 1.6), 0, 1.08);
          amEye(c, 900, 600, 760, op, t);
          c.fillStyle = AM_FIG.hair;
          // bangs: tapered locks with a hard highlight band, swaying a little
          for (let i = 0; i < 8; i++) {
            const x = -160 + i * 290 + hash(i * 3) * 60, w = 270 + hash(i) * 90, L = 300 + hash(i * 7) * 140, sw = Math.sin(t * 2.2 + i) * 16, tx = x + w * 0.62 + sw;
            c.fillStyle = i % 2 ? AM_FIG.hair : AM_FIGF.hair;
            c.beginPath(); c.moveTo(x, -10); c.quadraticCurveTo(x + w * 0.2, L * 0.6, tx, L); c.quadraticCurveTo(x + w * 0.8, L * 0.45, x + w, -10); c.closePath(); c.fill();
            c.strokeStyle = AM.ink; c.lineWidth = 4; c.stroke();
            c.fillStyle = 'rgba(150,170,255,0.55)'; c.beginPath(); c.moveTo(x + w * 0.35, 60); c.quadraticCurveTo(x + w * 0.45, L * 0.45, tx - 10, L * 0.72); c.quadraticCurveTo(x + w * 0.55, L * 0.35, x + w * 0.5, 60); c.closePath(); c.fill();
          }
          const lb = 150 * E.outX(seg(t, AM_T.eye, AM_T.eye + 0.12));
          c.fillStyle = '#000'; c.fillRect(0, 0, W, lb); c.fillRect(0, H - lb, W, lb);
          amFlare(c, 1500, 260, W, H, 0.6 * seg(t, 7.0, 7.3));
        }
        if (t >= AM_T.wipe) {
          // ---------- white slash wipe to the logo ----------
          const wu = E.ioC(seg(t, AM_T.wipe, AM_T.wipe + 0.26)), ex = lerp(-700, W + 900, wu);
          c.save();
          if (wu < 1) { polyP(c, [[-400, -40], [ex, -40], [ex - 500, H + 40], [-400, H + 40]]); c.clip(); }
          amLogo(c, t, W, H, st);
          c.restore();
          if (wu > 0 && wu < 1) { c.fillStyle = AM.white; polyP(c, [[ex, -40], [ex + 160, -40], [ex - 340, H + 40], [ex - 500, H + 40]]); c.fill(); c.fillStyle = AM.red; polyP(c, [[ex + 160, -40], [ex + 200, -40], [ex - 300, H + 40], [ex - 340, H + 40]]); c.fill(); }
        }
      }
      grain(c, W, H, t, 0.035);
    },
    score(A) {
      A.bus.gain.value = 0.8;
      const B = 0.4;
      const stab = (t, n, g = 0.04, d = 0.22) => A.chord(t, n, { type: 'sawtooth', dur: d, g, lp: 3800, a: 0.004, spread: 10, width: 0.6 });
      const bassN = (t, m, d = 0.18) => A.osc(t, { type: 'sawtooth', f: midi(m), dur: d, g: 0.12, lp: 700, q: 2, a: 0.004 });
      const lead = (t, m, d) => { A.osc(t, { type: 'square', f: midi(m), dur: d, g: 0.035, lp: 4200, a: 0.006, hold: true, rel: 0.04, vib: [6, 4], rev: 0.25, pan: 0.15 }); A.osc(t, { type: 'sawtooth', f: midi(m + 12), dur: d, g: 0.012, lp: 5000, a: 0.006, hold: true, rel: 0.04, pan: -0.15 }); };
      const crash = (t, g = 0.12) => A.noise(t, { type: 'highpass', f: 4200, dur: 1.6, g, rev: 0.4 });
      // cold open: glittering arpeggio, reverse swell, flare whoosh
      A.noise(0.05, { type: 'highpass', f: 5000, dur: 1.15, g: 0.1, swell: 0.95 });
      A.riser(0.2, 1.0, { g: 0.1, f: 220 });
      [74, 78, 81, 86, 90, 93, 98, 93].forEach((m, i) => A.bell(0.25 + i * 0.1, midi(m), { g: 0.035, dur: 0.9, rev: 0.6, pan: (i % 2 ? 0.5 : -0.5) }));
      A.whoosh(0.1, 1.0, { f1: 600, f2: 5000, g: 0.06 });
      // the run and the cards: four-on-the-floor and the royal-road progression IV–V–iii–vi in D
      const prog = [[43, [55, 59, 62, 67]], [45, [57, 61, 64, 69]], [42, [54, 57, 61, 66]], [47, [59, 62, 66, 71]]];
      for (let i = 0; i < 8; i++) {
        const t = AM_T.run + i * B, [bs, ch] = prog[i >> 1];
        A.kick(t, 0.7);
        if (i % 2) A.snare(t, 0.32, { rev: 0.25 });
        A.hat(t + B / 2, 0.07, true, { pan: 0.2 });
        A.hat(t + B / 4, 0.03, false, { pan: -0.3 }); A.hat(t + (3 * B) / 4, 0.03, false, { pan: 0.3 });
        bassN(t, bs); bassN(t + B / 2, bs + 12, 0.14);
        stab(t + (i % 2 ? B / 2 : 0), ch);
      }
      crash(AM_T.run, 0.12);
      [[1.2, 78, 0.38], [1.6, 81, 0.18], [1.8, 83, 0.18], [2.0, 81, 0.38], [2.4, 78, 0.38], [2.8, 76, 0.18], [3.0, 78, 0.18], [3.2, 81, 0.38], [3.6, 85, 0.38], [4.0, 86, 0.38]].forEach(([t, m, d]) => lead(t, m, d));
      A.whoosh(1.2, 0.3, { f1: 2000, f2: 400, g: 0.06 });
      [AM_T.cards, AM_T.c2, AM_T.c3].forEach((t, i) => { A.whoosh(t - 0.12, 0.2, { f1: 500, f2: 4000, g: 0.08 }); A.impact(t + 0.08, 0.3, { rev: 0.3 }); A.clap(t + 0.08, 0.12); });
      // the sky: crash, half-time, wide pads and a bell hook
      crash(AM_T.sky, 0.14); A.impact(AM_T.sky, 0.35);
      A.whoosh(AM_T.sky - 0.1, 0.4, { f1: 300, f2: 2500, g: 0.08 });
      [[4.4, [55, 62, 67, 71]], [5.2, [57, 64, 69, 73]], [6.0, [59, 62, 66, 71]]].forEach(([t, n], i) => {
        A.chord(t, n, { type: 'sawtooth', dur: 0.8, g: 0.022, lp: 2200, a: 0.08, hold: true, rel: 0.2, spread: 12, width: 0.8, rev: 0.4 });
        A.kick(t, 0.6); A.snare(t + B, 0.26, { rev: 0.45 });
        bassN(t, [43, 45, 47][i], 0.7);
      });
      [[4.6, 90], [4.8, 88], [5.0, 86], [5.4, 85], [5.6, 86], [5.8, 88], [6.0, 90]].forEach(([t, m]) => A.bell(t, midi(m), { g: 0.04, dur: 1.0, rev: 0.5, pan: 0.2 }));
      A.riser(5.6, 0.8, { g: 0.12, f: 180 });
      // impact, then a held breath while the eye opens
      A.impact(AM_T.hit, 0.8, { rev: 0.5 }); crash(AM_T.hit, 0.14); A.kick(AM_T.hit, 0.8);
      A.noise(AM_T.eye, { type: 'bandpass', f: 1200, q: 4, dur: 0.05, g: 0.1 });
      [86, 90, 93, 98].forEach((m, i) => A.bell(6.97 + i * 0.05, midi(m), { g: 0.04, dur: 1.2, rev: 0.6 }));
      A.osc(7.2, { f: 2400, f2: 4800, glide: 0.25, dur: 0.3, g: 0.02 });
      A.riser(7.05, 0.8, { g: 0.13, f: 150 });
      for (let i = 0; i < 12; i++) A.snare(7.37 + i * (i < 6 ? 0.05 : 0.033), 0.05 + i * 0.012, { rev: 0.1 });
      // the logo: slam, the tonic in full, a stinger and the shine
      A.whoosh(AM_T.wipe, 0.26, { f1: 600, f2: 6000, g: 0.1 });
      A.impact(AM_T.slam, 0.9, { rev: 0.5 }); crash(AM_T.slam, 0.16); A.kick(AM_T.slam, 0.9);
      A.chord(AM_T.slam, [50, 57, 62, 66, 69, 74], { type: 'sawtooth', dur: 1.5, g: 0.03, lp: 1500, lp2: 5000, lpT: 0.5, a: 0.005, spread: 12, width: 0.8, rev: 0.4 });
      bassN(AM_T.slam, 38, 1.2);
      [[8.15, 81], [8.35, 86], [8.55, 90]].forEach(([t, m]) => { lead(t, m, 0.16); A.kick(t, 0.4); });
      A.chord(8.75, [62, 66, 69, 74, 78], { type: 'sawtooth', dur: 1.1, g: 0.024, lp: 3000, a: 0.01, spread: 12, width: 0.8, rev: 0.5 });
      A.kick(8.75, 0.7); crash(8.75, 0.1); bassN(8.75, 38, 1.0);
      [98, 102, 105].forEach((m, i) => A.bell(8.75 + i * 0.07, midi(m), { g: 0.035, dur: 1.4, rev: 0.6 }));
      A.bell(9.1, midi(93), { g: 0.05, dur: 1.0, rev: 0.6 }); A.bell(9.18, midi(98), { g: 0.04, dur: 0.9, rev: 0.6 });
    },
  });
})();
