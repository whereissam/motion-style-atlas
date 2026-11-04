/* batch k19 — Technique Atlas · Rigging, Procedural: techpuppetpin · techreaction · techlsystem.
   techpuppetpin (the Token cut into a triangle mesh, three pins placed and one dragged: an
   as-rigid-as-possible solve bends the shape while one rigid transform misses the pins and a
   plain linear blend shears it; then a starched region stays stiff, and the word MOTION is
   rigged as one mesh and waved by three pins) ·
   techreaction (Gray–Scott reaction-diffusion: three grids seeded with the same dashed Token
   outline, run with three feed / kill pairs into spots held inside the Token by a raised kill
   rate outside it, stripes laid along the Token's contours by direction-dependent diffusion of V,
   and a free coral maze, each pair plotted on a small F–k map beside the saddle-node line) ·
   techlsystem (a Lindenmayer system: the axiom X rewritten five times by two rules, each string
   read by a turtle that draws the plant generation by generation, buds drawn as Tokens, then
   the branching angle re-set on the beat).
   The ARAP solves and the reaction-diffusion run once in setup; draw(t) looks up and
   interpolates the stored frames. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, midi, text, offscreen } = MG;
  const TK = MG.TK, P = TK.P, PI = Math.PI;
  const FPS = 30, NF = 300;
  const fonts = TK.fonts.concat([[`700 20px ${TK.MONO}`, 'PIN STARCH ARAP F k δ ∂ ∇ ² − → × √ · 0123456789 []+-']]);

  /* ---------------- shared helpers ---------------- */
  const label = (c, s, x, y, o = {}) => text(c, s, x, y, { font: TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
  const tag = (c, s, x, y, on = 1) => {   // small accent dot + mono label
    if (on <= 0.01) return;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: P.ink, weight: 700, size: 20 });
    c.restore();
  };
  const win = (t, a, b, f = 0.3) => seg(t, a - f, a) * (1 - seg(t, b, b + f));
  const fmtN = n => n.toLocaleString('en-US');

  /* =====================================================================
     PUPPET PINS — the Token is cut into a grid of triangles (expanded a few
     pixels past its outline, cells inside the hole dropped) and textured
     with its own picture. Three pins are dropped on the beat; pin 3 is
     dragged. Each frame is solved in setup with Sorkine & Alexa's
     local/global ARAP iteration: fit a best rotation per vertex to its
     one-ring, then solve one sparse-in-spirit (here dense, pre-factored
     Cholesky) Laplacian system for positions, pins held by a stiff
     penalty — 12 warm-started iterations per frame. Two foils run beside
     it: one rigid transform fitted to the pins (misses them) and an
     inverse-distance linear blend of the pin offsets (hits them, shears
     everything). Starch multiplies the edge weights in a region; a
     no-starch solve runs alongside for comparison. Last, the word MOTION
     is one strip mesh and three pins wave it.
     ===================================================================== */
  const PP = { S: 380, cx: 800, cy: 520, nx: 13, ex: 8, lam: 4000, it: 12, sMax: 16 };
  const PP_PIN = [[-0.36, 0.40], [0.36, 0.40], [-0.22, -0.38]];          // Token units
  const PP_DX = [[2.0, 0], [2.6, -210], [3.0, -210], [3.6, 200], [4.0, 200], [4.5, 30], [5.0, 30], [5.6, -210], [6.0, -210], [6.5, 0]];
  const PP_DY = [[2.0, 0], [2.6, 70], [3.0, 70], [3.6, 30], [4.0, 30], [4.5, -80], [5.0, -80], [5.6, 70], [6.0, 70], [6.5, 0]];
  const PP_ST = [4.5, 5.0];                                               // starch ramps in
  const PP_W = { y: 520, size: 210, t0: 6.7, pins: [7.0, 7.1, 7.2] };
  // word pin offsets [L, C, R] as [x keys, y keys]
  const PP_WK = [
    [[[9.0, 0], [9.4, -40]], [[8.0, 0], [8.4, 90], [8.5, 90], [8.9, -90], [9.0, -90], [9.4, -70]]],
    [[[0, 0]], [[7.5, 0], [7.9, -130], [8.0, -130], [8.4, -40], [8.5, -40], [8.9, 40], [9.0, 40], [9.4, 90]]],
    [[[9.0, 0], [9.4, 40]], [[8.0, 0], [8.4, -90], [8.5, -90], [8.9, 90], [9.0, 90], [9.4, -70]]],
  ];
  const PP_PH = [[0, 'TRIANGULATE THE LAYER'], [1.0, 'PLACE PINS'], [2.0, 'DRAG A PIN · THE MESH FOLLOWS'], [4.5, 'STARCH · STIFFEN A REGION'], [6.7, 'ONE MESH, THE WHOLE WORD']];
  const ppHandle = t => [kf(t, PP_DX), kf(t, PP_DY)];
  const ppStarch = t => 1 + (PP.sMax - 1) * E.ioS(seg(t, PP_ST[0], PP_ST[1]));
  const ppWordOff = (t, k) => [kf(t, PP_WK[k][0]), kf(t, PP_WK[k][1])];

  function ppSdf(x, y, s) {   // signed distance to the Token outline (hole cut out), px
    const h = s / 2, r = s * TK.CORNER, qx = Math.abs(x) - (h - r), qy = Math.abs(y) - (h - r);
    const d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
    return Math.max(d, -(Math.hypot(x - s * TK.HOLE.x, y - s * TK.HOLE.y) - s * TK.HOLE.r));
  }
  function gridMesh(nx, ny, x0, y0, cw, ch, keep) {
    const id = new Int32Array((nx + 1) * (ny + 1)).fill(-1), V = [], tri = [];
    const vid = (i, j) => { const k = j * (nx + 1) + i; if (id[k] < 0) { id[k] = V.length / 2; V.push(x0 + i * cw, y0 + j * ch); } return id[k]; };
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      if (!keep(i, j)) continue;
      const a = vid(i, j), b = vid(i + 1, j), cc = vid(i, j + 1), d = vid(i + 1, j + 1);
      if ((i + j) % 2) tri.push([a, b, d], [a, d, cc]); else tri.push([a, b, cc], [b, d, cc]);
    }
    const n = V.length / 2, seen = new Set(), edges = [];
    tri.forEach(T => { for (let k = 0; k < 3; k++) { const a = Math.min(T[k], T[(k + 1) % 3]), b = Math.max(T[k], T[(k + 1) % 3]); if (!seen.has(a * n + b)) { seen.add(a * n + b); edges.push([a, b]); } } });
    return { n, P: Float64Array.from(V), tri, edges };
  }
  const nearest = (M, x, y) => { let b = 0, bd = 1e18; for (let i = 0; i < M.n; i++) { const d = (M.P[2 * i] - x) ** 2 + (M.P[2 * i + 1] - y) ** 2; if (d < bd) { bd = d; b = i; } } return b; };
  // Dense Laplacian + pin penalty, Cholesky-factored in place (lower triangle).
  function arapFactor(M, pins, W) {
    const n = M.n, L = new Float64Array(n * n);
    M.edges.forEach(([a, b], e) => { const w = W[e]; L[a * n + a] += w; L[b * n + b] += w; L[a * n + b] -= w; L[b * n + a] -= w; });
    pins.forEach(k => { L[k * n + k] += PP.lam; });
    for (let j = 0; j < n; j++) {
      let s = L[j * n + j];
      for (let k = 0; k < j; k++) s -= L[j * n + k] * L[j * n + k];
      const d = Math.sqrt(s); L[j * n + j] = d;
      for (let i = j + 1; i < n; i++) {
        let v = L[i * n + j];
        for (let k = 0; k < j; k++) v -= L[i * n + k] * L[j * n + k];
        L[i * n + j] = v / d;
      }
    }
    return L;
  }
  function cholSolve(L, n, b) {
    for (let i = 0; i < n; i++) { let v = b[i]; for (let k = 0; k < i; k++) v -= L[i * n + k] * b[k]; b[i] = v / L[i * n + i]; }
    for (let i = n - 1; i >= 0; i--) { let v = b[i]; for (let k = i + 1; k < n; k++) v -= L[k * n + i] * b[k]; b[i] = v / L[i * n + i]; }
  }
  // One local/global iteration: per-vertex best rotation, then the global solve (X updated in place).
  function arapIter(M, L, W, X, pins, tgt) {
    const n = M.n, R = M.P, sc = new Float64Array(n), ss = new Float64Array(n), bx = new Float64Array(n), by = new Float64Array(n);
    M.edges.forEach(([a, b], e) => {
      const w = W[e], ex = R[2 * a] - R[2 * b], ey = R[2 * a + 1] - R[2 * b + 1], fx = X[2 * a] - X[2 * b], fy = X[2 * a + 1] - X[2 * b + 1];
      const dt = w * (ex * fx + ey * fy), cr = w * (ex * fy - ey * fx);
      sc[a] += dt; ss[a] += cr; sc[b] += dt; ss[b] += cr;
    });
    for (let i = 0; i < n; i++) { const h = Math.hypot(sc[i], ss[i]) || 1; sc[i] /= h; ss[i] /= h; }
    M.edges.forEach(([a, b], e) => {
      const w = W[e] / 2, ex = R[2 * a] - R[2 * b], ey = R[2 * a + 1] - R[2 * b + 1], co = sc[a] + sc[b], si = ss[a] + ss[b];
      const rx = w * (co * ex - si * ey), ry = w * (si * ex + co * ey);
      bx[a] += rx; by[a] += ry; bx[b] -= rx; by[b] -= ry;
    });
    pins.forEach((k, i) => { bx[k] += PP.lam * tgt[i][0]; by[k] += PP.lam * tgt[i][1]; });
    cholSolve(L, n, bx); cholSolve(L, n, by);
    for (let i = 0; i < n; i++) { X[2 * i] = bx[i]; X[2 * i + 1] = by[i]; }
  }
  // Run a solve over frames f0..f1, targets(t) → pin targets, weights(t) → { key, W }.
  function arapRun(M, pins, f0, f1, targets, weights) {
    const out = {}, X = Float64Array.from(M.P);
    let key = null, L = null, W = null;
    for (let f = f0; f <= f1; f++) {
      const t = f / FPS, w = weights(t);
      if (w.key !== key) { key = w.key; W = w.W; L = arapFactor(M, pins, W); }
      const tg = targets(t);
      for (let k = 0; k < PP.it; k++) arapIter(M, L, W, X, pins, tg);
      out[f] = Float32Array.from(X);
    }
    return out;
  }
  function ppBuild() {
    const S = PP.S, nx = PP.nx, x0 = -S / 2 - PP.ex, cw = (S + 2 * PP.ex) / nx;
    const hx = S * TK.HOLE.x, hy = S * TK.HOLE.y, hr = S * TK.HOLE.r;
    const tok = gridMesh(nx, nx, x0, x0, cw, cw, (i, j) => {
      const x = x0 + (i + 0.5) * cw, y = x0 + (j + 0.5) * cw;
      if (Math.hypot(x - hx, y - hy) + cw * 0.72 < hr) return false;   // cell entirely inside the hole
      const h = S / 2, r = S * TK.CORNER, qx = Math.abs(x) - (h - r), qy = Math.abs(y) - (h - r);
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r < cw * 0.55;
    });
    const pins = PP_PIN.map(([u, v]) => nearest(tok, u * S, v * S));
    const pinRest = pins.map(k => [tok.P[2 * k], tok.P[2 * k + 1]]);
    const tgt = t => { const [dx, dy] = ppHandle(t); return [pinRest[0], pinRest[1], [pinRest[2][0] + dx, pinRest[2][1] + dy]]; };
    // starch amount per vertex: soft disc around the hole
    const sv = new Float64Array(tok.n);
    for (let i = 0; i < tok.n; i++) sv[i] = clamp((S * 0.33 - Math.hypot(tok.P[2 * i] - hx, tok.P[2 * i + 1] - hy)) / (S * 0.08));
    tok.sv = sv;
    const one = tok.edges.map(() => 1);
    const fS = Math.round(PP_ST[0] * FPS), fE = Math.round(6.9 * FPS);
    const plain = arapRun(tok, pins, 0, fE, tgt, () => ({ key: 1, W: one }));
    const stW = s => tok.edges.map(([a, b]) => 1 + (s - 1) * Math.min(sv[a], sv[b]));
    const starch = arapRun(tok, pins, fS, fE, tgt, t => { const s = ppStarch(t); return { key: s.toFixed(3), W: stW(s) }; });
    // texture
    const TS = S + 2 * 40, tex = offscreen(TS, TS), g = tex.getContext('2d');
    g.translate(TS / 2, TS / 2); TK.tokenPath(g, S); g.fillStyle = P.accent; g.fill('evenodd');
    // the word: texture, ink bounding box, strip mesh
    const WW = 1500, WH = 360, wtex = offscreen(WW, WH), wg = wtex.getContext('2d');
    TK.word(wg, WW / 2, WH / 2, { size: PP_W.size, ls: 6 });
    const px = wg.getImageData(0, 0, WW, WH).data;
    let bx0 = WW, bx1 = 0, by0 = WH, by1 = 0;
    for (let y = 0; y < WH; y += 2) for (let x = 0; x < WW; x += 2) if (px[(y * WW + x) * 4 + 3] > 40) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
    const pad = 12, wcw = 24, wnx = Math.ceil((bx1 - bx0 + 2 * pad) / wcw), wny = Math.ceil((by1 - by0 + 2 * pad) / wcw);
    const wx0 = bx0 - pad - WW / 2 - (wnx * wcw - (bx1 - bx0 + 2 * pad)) / 2, wy0 = by0 - pad - WH / 2 - (wny * wcw - (by1 - by0 + 2 * pad)) / 2;
    const wm = gridMesh(wnx, wny, wx0, wy0, wcw, wcw, () => true);
    const wmid = (by0 + by1) / 2 - WH / 2;
    const wpins = [nearest(wm, bx0 - WW / 2 + 30, wmid), nearest(wm, 0, wmid), nearest(wm, bx1 - WW / 2 - 30, wmid)];
    const wRest = wpins.map(k => [wm.P[2 * k], wm.P[2 * k + 1]]);
    const wtgt = t => wRest.map((p, k) => { const [dx, dy] = ppWordOff(t, k); return [p[0] + dx, p[1] + dy]; });
    const word = arapRun(wm, wpins, Math.round(PP_W.t0 * FPS), NF, wtgt, () => ({ key: 1, W: wm.edges.map(() => 1) }));
    return { tok, pins, pinRest, tgt, plain, starch, tex, TS, wm, wpins, wRest, wtgt, word, wtex, WW, WH };
  }
  function texTri(c, img, x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2) {
    const mx = (x0 + x1 + x2) / 3, my = (y0 + y1 + y2) / 3, ex = (x, y) => { const d = Math.hypot(x - mx, y - my) || 1; return [x + (x - mx) / d * 0.8, y + (y - my) / d * 0.8]; };
    const A = ex(x0, y0), B = ex(x1, y1), C = ex(x2, y2);
    const du1 = u1 - u0, dv1 = v1 - v0, du2 = u2 - u0, dv2 = v2 - v0, det = du1 * dv2 - du2 * dv1;
    if (Math.abs(det) < 1e-9) return;
    const dx1 = x1 - x0, dy1 = y1 - y0, dx2 = x2 - x0, dy2 = y2 - y0;
    const a = (dx1 * dv2 - dx2 * dv1) / det, b = (dy1 * dv2 - dy2 * dv1) / det, cc = (dx2 * du1 - dx1 * du2) / det, d = (dy2 * du1 - dy1 * du2) / det;
    c.save();
    c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineTo(C[0], C[1]); c.closePath(); c.clip();
    c.transform(a, b, cc, d, x0 - a * u0 - cc * v0, y0 - b * u0 - d * v0);
    c.drawImage(img, 0, 0);
    c.restore();
  }
  const frameLerp = (store, t, f0, f1) => {
    const f = clamp(t * FPS, f0, f1), k = Math.min(f1 - 1, Math.floor(f)), u = f - k, A = store[k], B = store[k + 1], X = new Float32Array(A.length);
    for (let i = 0; i < A.length; i++) X[i] = lerp(A[i], B[i], u);
    return X;
  };
  // Draw a textured mesh: X positions (mesh space), placed at ox,oy scaled by s.
  function ppMesh(c, M, X, img, ou, ov, ox, oy, s, o = {}) {
    const sx = i => ox + X[2 * i] * s, sy = i => oy + X[2 * i + 1] * s;
    M.tri.forEach(([a, b, d]) => texTri(c, img, sx(a), sy(a), sx(b), sy(b), sx(d), sy(d),
      M.P[2 * a] + ou, M.P[2 * a + 1] + ov, M.P[2 * b] + ou, M.P[2 * b + 1] + ov, M.P[2 * d] + ou, M.P[2 * d + 1] + ov));
    if (o.starch > 0.01 && M.sv) {
      c.save(); c.globalAlpha *= o.starch; c.fillStyle = 'rgba(47,91,255,0.13)'; c.strokeStyle = P.blue; c.lineWidth = 1.6;
      c.beginPath();
      M.tri.forEach(([a, b, d]) => {
        const v = Math.min(M.sv[a], M.sv[b], M.sv[d]); if (v < 0.5) return;
        c.moveTo(sx(a), sy(a)); c.lineTo(sx(b), sy(b)); c.lineTo(sx(d), sy(d)); c.closePath();
      });
      c.fill(); c.stroke(); c.restore();
    }
    const nw = o.wire ?? M.tri.length;
    if (nw > 0 && (o.wa ?? 1) > 0.01) {
      c.save(); c.globalAlpha *= o.wa ?? 1;
      c.strokeStyle = 'rgba(23,24,28,0.34)'; c.lineWidth = o.lw || 1; c.beginPath();
      for (let k = 0; k < Math.min(nw, M.tri.length); k++) { const [a, b, d] = M.tri[k]; c.moveTo(sx(a), sy(a)); c.lineTo(sx(b), sy(b)); c.lineTo(sx(d), sy(d)); c.closePath(); }
      c.stroke(); c.restore();
    }
  }
  function ppPin(c, x, y, on, o = {}) {
    if (on <= 0.01) return;
    const r = (o.r || 11) * (0.4 + 0.6 * E.outB(on));
    c.save(); c.globalAlpha *= Math.min(1, on * 2);
    if (o.handle) { c.strokeStyle = P.accent; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r + 9, 0, TAU); c.stroke(); }
    c.fillStyle = P.ink; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.fillStyle = o.handle ? P.accent : '#f4d03f'; c.beginPath(); c.arc(x, y, r * 0.52, 0, TAU); c.fill();
    if (o.name) label(c, o.name, x + (o.lx ?? 22), y + (o.ly ?? -16), { size: o.ls || 15, ls: 2, color: P.ink, weight: 700 });
    c.restore();
  }

  MG.film({
    id: 'techpuppetpin', dur: 10, poster: 3.7,
    fonts,
    meta: {
      family: 'K', name: 'Puppet Pins', sub: 'Pins on a triangle mesh; the shape bends as rigidly as it can', era: '2005 —',
      origin: 'Takeo Igarashi, Tomer Moscovich and John F. Hughes introduced As-Rigid-As-Possible Shape Manipulation at SIGGRAPH 2005: a 2D shape is triangulated, the user drags a few handles, and a least-squares solve keeps every triangle as close as possible to a rotated copy of itself, so the figure bends instead of shearing. Adobe brought the idea to motion designers as the Puppet tools of After Effects CS3 (2007) — Puppet Pin, Starch and Overlap — and to still images as Photoshop CS5’s Puppet Warp (2010). Olga Sorkine and Marc Alexa’s local/global ARAP solver (2007), used here, is the iteration most later tools follow.',
      works: 'As-Rigid-As-Possible Shape Manipulation (Igarashi, Moscovich & Hughes, SIGGRAPH 2005) · After Effects CS3 Puppet tool (Adobe, 2007) · Photoshop CS5 Puppet Warp (Adobe, 2010)',
      tech: ['Triangle mesh over the layer, expanded past its outline', 'Local/global ARAP: best rotation per vertex, then one linear solve', 'Starch: heavier edge weights in a painted region'],
      accent: '#ff5a1f',
      motionDNA: 'A mesh is laid over the Token in a second, three pins drop on the beat, and one pin is dragged left, right and up on the following beats: the Token leans and arches like a body while its corners and hole keep their shape. A rigid copy beside it cannot reach the pins; a linear blend reaches them but squeezes the hole. With the area around the hole starched, the same drag bends only the lower half. Finally the word MOTION, rigged as one strip, is arched and waved by three pins.',
      visualDNA: 'The Technique Atlas stage; the orange Token carried on a fine ink wireframe, black pins with yellow centres (the dragged one ringed in orange), dashed drag lines from rest to target, a translucent blue starch patch; two small comparison thumbnails at the right with red pin-error lines; mono phase labels top left.',
      transitions: 'Triangulate, pin, drag, starch, then a cross-fade from the Token mesh to the word mesh',
      implementation: ['After Effects Puppet Pin / Starch tools (mesh expansion, triangle count)', 'Sorkine–Alexa local/global ARAP precomputed in setup: dense Cholesky of the pinned Laplacian, 12 warm-started iterations per frame', 'Canvas 2D: affine texture-mapped triangles, wireframe and pin overlay'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return ppBuild(); },
    draw(c, t, W, H, st) {
      const S = PP.S, cx = PP.cx, cy = PP.cy, M = st.tok, hu = st.TS / 2;
      TK.stage(c, W, H);
      const tokA = 1 - seg(t, 6.5, 6.9), wordA = seg(t, 6.7, 7.1);
      if (tokA > 0.01) {
        c.save(); c.globalAlpha = tokA;
        const useSt = t >= PP_ST[0];
        const X = useSt ? frameLerp(st.starch, t, Math.round(PP_ST[0] * FPS), Math.round(6.9 * FPS)) : frameLerp(st.plain, t, 0, Math.round(6.9 * FPS));
        const wire = Math.floor(M.tri.length * seg(t, 0.15, 0.9));
        const stA = seg(t, PP_ST[0], PP_ST[0] + 0.4);
        ppMesh(c, M, X, st.tex, hu, hu, cx, cy, 1, { wire, starch: stA, lw: 1 });
        if (stA > 0.01) {
          c.save(); c.globalAlpha *= stA;
          const hx = cx + X[2 * nearest(M, S * TK.HOLE.x, S * TK.HOLE.y + S * TK.HOLE.r + 20)], hy = cy + X[2 * nearest(M, S * TK.HOLE.x, S * TK.HOLE.y + S * TK.HOLE.r + 20) + 1];
          c.fillStyle = 'rgba(236,232,223,0.92)'; MG.rrect(c, hx - 82, hy + 18, 164, 30, 6); c.fill();
          label(c, `STARCH  × ${ppStarch(t).toFixed(0)}`, hx, hy + 39, { size: 15, ls: 2, color: P.blue, weight: 700, align: 'center' });
          c.restore();
        }
        // pins
        const tg = st.tgt(t);
        st.pins.forEach((k, i) => {
          const on = seg(t, 1.0 + i * 0.5, 1.2 + i * 0.5), x = cx + X[2 * k], y = cy + X[2 * k + 1];
          if (i === 2 && t > 2.0) {
            const rx = cx + st.pinRest[2][0], ry = cy + st.pinRest[2][1];
            c.save(); c.globalAlpha *= on; c.setLineDash([5, 7]); c.strokeStyle = 'rgba(23,24,28,0.45)'; c.lineWidth = 1.5;
            c.beginPath(); c.moveTo(rx, ry); c.lineTo(x, y); c.stroke(); c.setLineDash([]);
            c.beginPath(); c.arc(rx, ry, 6, 0, TAU); c.stroke(); c.restore();
          }
          ppPin(c, x, y, on, { handle: i === 2, name: `PIN ${i + 1}`, lx: i === 0 ? -86 : 22, ly: i === 2 ? -24 : 34 });
        });
        // comparison thumbnails at the right
        const cA = win(t, 2.2, 4.4, 0.3), nA = win(t, 4.8, 6.4, 0.3), ts = 0.42, tx = 1570;
        const tgs = tg.map(p => [p[0], p[1]]);
        if (cA > 0.01) {
          c.save(); c.globalAlpha *= cA;
          // one rigid transform fitted to the pins (2D Procrustes)
          const R0 = st.pinRest, mx0 = (R0[0][0] + R0[1][0] + R0[2][0]) / 3, my0 = (R0[0][1] + R0[1][1] + R0[2][1]) / 3, mx1 = (tgs[0][0] + tgs[1][0] + tgs[2][0]) / 3, my1 = (tgs[0][1] + tgs[1][1] + tgs[2][1]) / 3;
          let sd = 0, sx = 0;
          for (let i = 0; i < 3; i++) { const ax = R0[i][0] - mx0, ay = R0[i][1] - my0, bx = tgs[i][0] - mx1, by = tgs[i][1] - my1; sd += ax * bx + ay * by; sx += ax * by - ay * bx; }
          const th = Math.atan2(sx, sd), co = Math.cos(th), si = Math.sin(th), rig = p => [mx1 + co * (p[0] - mx0) - si * (p[1] - my0), my1 + si * (p[0] - mx0) + co * (p[1] - my0)];
          const y1 = 330, ctr = rig([0, 0]);
          label(c, 'ONE RIGID TRANSFORM', tx, y1 - 128, { size: 15, ls: 2, color: P.ink, weight: 700, align: 'center' });
          TK.token(c, tx + ctr[0] * ts, y1 + ctr[1] * ts, S * ts, { rot: th });
          let err = 0;
          for (let i = 0; i < 3; i++) {
            const p = rig(R0[i]), q = tgs[i]; err = Math.max(err, Math.hypot(p[0] - q[0], p[1] - q[1]));
            c.strokeStyle = '#d62d2d'; c.lineWidth = 2; c.beginPath(); c.moveTo(tx + p[0] * ts, y1 + p[1] * ts); c.lineTo(tx + q[0] * ts, y1 + q[1] * ts); c.stroke();
            ppPin(c, tx + q[0] * ts, y1 + q[1] * ts, 1, { r: 6, handle: i === 2 });
          }
          label(c, `PINS MISS  ·  ${Math.round(err)} PX`, tx, y1 + 140, { size: 14, ls: 2, align: 'center', color: err > 8 ? '#d62d2d' : P.mute });
          // linear blend of pin offsets, inverse-distance weights
          const y2 = 680, B = new Float32Array(M.n * 2);
          for (let v = 0; v < M.n; v++) {
            let sw = 0, dx = 0, dy = 0;
            for (let i = 0; i < 3; i++) { const w = 1 / ((M.P[2 * v] - R0[i][0]) ** 2 + (M.P[2 * v + 1] - R0[i][1]) ** 2 + 1); sw += w; dx += w * (tgs[i][0] - R0[i][0]); dy += w * (tgs[i][1] - R0[i][1]); }
            B[2 * v] = M.P[2 * v] + dx / sw; B[2 * v + 1] = M.P[2 * v + 1] + dy / sw;
          }
          label(c, 'LINEAR BLEND', tx, y2 - 128, { size: 15, ls: 2, color: P.ink, weight: 700, align: 'center' });
          ppMesh(c, M, B, st.tex, hu, hu, tx, y2, ts, { wa: 0.5, lw: 0.7 });
          st.pins.forEach((k, i) => ppPin(c, tx + B[2 * k] * ts, y2 + B[2 * k + 1] * ts, 1, { r: 6, handle: i === 2 }));
          label(c, 'PINS HIT  ·  SHAPE SHEARS', tx, y2 + 140, { size: 14, ls: 2, align: 'center' });
          c.restore();
        }
        if (nA > 0.01) {
          c.save(); c.globalAlpha *= nA;
          const y1 = 500, Xp = frameLerp(st.plain, t, 0, Math.round(6.9 * FPS));
          label(c, 'SAME DRAG, NO STARCH', tx, y1 - 140, { size: 15, ls: 2, color: P.ink, weight: 700, align: 'center' });
          ppMesh(c, M, Xp, st.tex, hu, hu, tx, y1, ts * 1.1, { wa: 0.5, lw: 0.7 });
          st.pins.forEach((k, i) => ppPin(c, tx + Xp[2 * k] * ts * 1.1, y1 + Xp[2 * k + 1] * ts * 1.1, 1, { r: 6, handle: i === 2 }));
          label(c, 'THE HOLE BENDS WITH IT', tx, y1 + 150, { size: 14, ls: 2, align: 'center' });
          c.restore();
        }
        const mA = win(t, 2.2, 6.4, 0.3);
        if (mA > 0.01) {
          c.save(); c.globalAlpha *= mA;
          label(c, t < PP_ST[0] ? 'AS RIGID AS POSSIBLE' : 'ARAP  ·  STARCHED', cx, 170, { size: 18, ls: 3, color: P.ink, weight: 700, align: 'center' });
          label(c, 'PINS HIT  ·  EACH TRIANGLE STAYS AS RIGID AS IT CAN', cx, 198, { size: 14, ls: 2, align: 'center' });
          c.restore();
        }
        c.restore();
      }
      if (wordA > 0.01) {
        c.save(); c.globalAlpha = wordA;
        const X = frameLerp(st.word, t, Math.round(PP_W.t0 * FPS), NF), wm = st.wm;
        ppMesh(c, wm, X, st.wtex, st.WW / 2, st.WH / 2, 960, PP_W.y, 1, { wa: 0.8 });
        st.wpins.forEach((k, i) => ppPin(c, 960 + X[2 * k], PP_W.y + X[2 * k + 1], seg(t, PP_W.pins[i], PP_W.pins[i] + 0.2), { handle: true }));
        label(c, `${fmtN(wm.n)} VERTICES  ·  ${fmtN(wm.tri.length)} TRIANGLES  ·  3 PINS`, 960, 230, { size: 16, ls: 3, align: 'center', color: P.ink, weight: 700 });
        label(c, 'GAPS BETWEEN LETTERS ARE MESHED TOO, SO THE WORD MOVES AS ONE', 960, 258, { size: 14, ls: 2, align: 'center' });
        c.restore();
      }
      const wordPh = t >= PP_W.t0, mm = wordPh ? st.wm : M;
      tag(c, `PUPPET MESH  ·  ${fmtN(mm.n)} VERTICES  ·  ${fmtN(mm.tri.length)} TRIANGLES`, 72, 96, seg(t, 0.1, 0.4));
      let ph = 0; PP_PH.forEach(([t0], i) => { if (t >= t0) ph = i; });
      label(c, `0${ph + 1}  ${PP_PH[ph][1]}`, 98, 128, { size: 16, ls: 2, color: P.ink });
      TK.caption(c, t, W, H, { name: 'Puppet Pins', cat: 'Rigging', curve: u => kf(u * 10, PP_DX) / 210, span: [0, 10], lo: -1.25, hi: 1.25, curveLabel: 'PIN 3  X OFFSET / TIME' });
    },
    score(A) {
      TK.bed(A);
      for (let k = 0; k < 8; k++) A.osc(0.15 + k * 0.095, { f: midi(76 + k * 2), dur: 0.05, g: 0.03, pan: (k - 3.5) * 0.15 });
      [1.0, 1.5, 2.0, 7.0, 7.1, 7.2].forEach((t, i) => {
        A.osc(t, { type: 'triangle', f: midi(84 + (i % 3) * 3), dur: 0.09, g: 0.09 });
        A.pluck(t, midi(48 + (i % 3) * 7), { g: 0.16, bright: 0.4, dur: 0.6 });
      });
      [[2.0, 0.6, -1], [3.0, 0.6, 1], [4.0, 0.5, 0], [5.0, 0.6, -1], [6.0, 0.5, 0]].forEach(([t, d, dir], i) => {
        A.whoosh(t, d + 0.1, { f1: 300, f2: 1800 + i * 200, q: 2, g: 0.1, swell: 0.5, rev: 0.3, pan: dir * 0.4 });
        A.osc(t, { type: 'triangle', f: midi(55 + i * 2), f2: midi(62 + i * 2), glide: d, dur: d + 0.15, g: 0.06, a: 0.05, lp: 1800, vib: [7, 4] });
        A.pluck(t + d, midi([67, 71, 74, 67, 72][i]), { g: 0.14, bright: 0.6, dur: 1, rev: 0.3 });
      });
      A.noise(PP_ST[0], { type: 'bandpass', f: 900, f2: 2600, q: 1.5, dur: 0.6, g: 0.07, swell: 0.6, rev: 0.3 });
      A.bell(PP_ST[1], midi(79), { g: 0.06, dur: 1.2 });
      A.whoosh(6.6, 0.6, { f1: 600, f2: 4000, g: 0.08 });
      [7.5, 8.0, 8.5, 9.0].forEach((t, i) => {
        A.osc(t, { type: 'triangle', f: midi(60 + i * 2), f2: midi(67 + i * 2), glide: 0.4, dur: 0.5, g: 0.05, lp: 2000 });
        A.pluck(t + 0.4, midi([72, 74, 76, 79][i]), { g: 0.15, bright: 0.65, dur: 1.1, rev: 0.35 });
      });
      A.chord(9.4, [60, 64, 67, 72], { type: 'triangle', dur: 1.2, g: 0.035, a: 0.05, lp: 2400, rev: 0.5, width: 0.8 });
    },
  });

  /* =====================================================================
     REACTION-DIFFUSION — Gray–Scott: chemical U is fed in at rate F, V
     eats U to make more of itself (u·v²) and is removed at rate F + k,
     and both diffuse, V half as fast. Three 160 × 160 grids get the same
     seed — a dashed Token outline of V — and differ in F and k: spots
     that split and fill the Token (k is raised outside its silhouette, so
     V cannot live there and the outline holds), stripes that run parallel
     to the Token's contours (V diffuses 9× faster along the contours of
     the Token's distance field than across them, which aligns the bands
     into concentric outlines instead of a maze), and a free coral maze.
     5,200 steps each run once in setup (9-point Laplacian, Δt 1,
     wrap-around edges), stored at 15 fps as bytes and interpolated; a
     small F–k map shows where each pair sits relative to the saddle-node
     line k = √F / 2 − F that bounds where V can survive.
     ===================================================================== */
  const RD = { N: 160, steps: 5200, t0: 1.0, t1: 8.5, sf: 15, vmax: 0.42, pw: 420, py: 290, xs: [72, 528, 984] };
  const RD_SET = [
    { name: 'SPOTS', F: 0.0367, k: 0.0649, kOut: 0.08, note: 'SPOTS SPLIT · k 0.08 OUTSIDE THE TOKEN' },
    { name: 'STRIPES', F: 0.029, k: 0.057, aniso: 0.8, anisoU: 0, note: 'V DIFFUSES 9× ALONG THE OUTLINE' },
    { name: 'MAZE', F: 0.055, k: 0.062, note: 'CORAL FINGERS BRANCH' },
  ];
  const RD_NFR = Math.round((RD.t1 - RD.t0) * RD.sf) + 1;
  const rdSteps = t => Math.round(RD.steps * Math.pow(clamp((t - RD.t0) / (RD.t1 - RD.t0)), 1.5));
  const rdFocus = t => (t < 2 ? -1 : t < 4 ? 0 : t < 6 ? 1 : t < 8 ? 2 : -1);
  function rdBuild() {
    const N = RD.N, NN = N * N, S = N * 0.6, seedU = new Float32Array(NN).fill(1), seedV = new Float32Array(NN);
    const sdf = new Float32Array(NN), tx = new Float32Array(NN), ty = new Float32Array(NN);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = (i - N / 2 + 0.5) / S, y = (j - N / 2 + 0.5) / S, p = j * N + i, e = 0.5 / S;
      sdf[p] = ppSdf(x, y, 1);
      const gx = ppSdf(x + e, y, 1) - ppSdf(x - e, y, 1), gy = ppSdf(x, y + e, 1) - ppSdf(x, y - e, 1), gl = Math.hypot(gx, gy) || 1;
      tx[p] = -gy / gl; ty[p] = gx / gl;   // unit tangent to the Token's distance contours
      if (Math.abs(sdf[p]) < 0.06 && (Math.floor(i / 12) + Math.floor(j / 12)) % 2 === 0) { seedV[p] = 0.25; seedU[p] = 0.5; }
    }
    // neighbour offsets and base 9-point Laplacian weights: W, E, N, S, NW, NE, SW, SE
    const OFF = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]], BASE = [0.2, 0.2, 0.2, 0.2, 0.05, 0.05, 0.05, 0.05];
    return RD_SET.map(({ F, k, kOut, aniso, anisoU }) => {
      let U = Float32Array.from(seedU), V = Float32Array.from(seedV), U2 = new Float32Array(NN), V2 = new Float32Array(NN);
      // per-cell kill: raised outside the Token when the set is masked, so V only survives inside it
      const K = new Float32Array(NN);
      for (let p = 0; p < NN; p++) K[p] = kOut ? lerp(k, kOut, E.ioS(clamp((sdf[p] + 0.005) / 0.03))) : k;
      // per-cell stencil weights: anisotropic sets diffuse more along the Token's contours than across them
      const weights = an => {
        const Wt = new Float32Array(NN * 8);
        for (let p = 0; p < NN; p++) for (let n = 0; n < 8; n++) {
          const [ox, oy] = OFF[n], dt = (ox * tx[p] + oy * ty[p]) / Math.hypot(ox, oy);
          Wt[p * 8 + n] = BASE[n] * (an ? (1 + an) * dt * dt + (1 - an) * (1 - dt * dt) : 1);
        }
        return Wt;
      };
      const Wu = weights(anisoU ?? aniso), Wv = weights(aniso);
      const fr = new Uint8Array(RD_NFR * NN);
      let s = 0;
      for (let f = 0; f < RD_NFR; f++) {
        const target = rdSteps(RD.t0 + f / RD.sf);
        for (; s < target; s++) {
          for (let j = 0; j < N; j++) {
            const jm = ((j - 1 + N) % N) * N, j0 = j * N, jp = ((j + 1) % N) * N;
            for (let i = 0; i < N; i++) {
              const im = (i - 1 + N) % N, ip = (i + 1) % N, p = j0 + i, u = U[p], v = V[p], w = p * 8;
              const a0 = j0 + im, a1 = j0 + ip, a2 = jm + i, a3 = jp + i, a4 = jm + im, a5 = jm + ip, a6 = jp + im, a7 = jp + ip;
              const lu = Wu[w] * (U[a0] - u) + Wu[w + 1] * (U[a1] - u) + Wu[w + 2] * (U[a2] - u) + Wu[w + 3] * (U[a3] - u) + Wu[w + 4] * (U[a4] - u) + Wu[w + 5] * (U[a5] - u) + Wu[w + 6] * (U[a6] - u) + Wu[w + 7] * (U[a7] - u);
              const lv = Wv[w] * (V[a0] - v) + Wv[w + 1] * (V[a1] - v) + Wv[w + 2] * (V[a2] - v) + Wv[w + 3] * (V[a3] - v) + Wv[w + 4] * (V[a4] - v) + Wv[w + 5] * (V[a5] - v) + Wv[w + 6] * (V[a6] - v) + Wv[w + 7] * (V[a7] - v);
              const r = u * v * v;
              U2[p] = u + lu - r + F * (1 - u);
              V2[p] = v + 0.5 * lv + r - (F + K[p]) * v;
            }
          }
          let tmp = U; U = U2; U2 = tmp; tmp = V; V = V2; V2 = tmp;
        }
        const o = f * NN;
        for (let p = 0; p < NN; p++) fr[o + p] = Math.round(clamp(V[p] / RD.vmax) * 255);
      }
      return fr;
    });
  }
  const RD_LUT = (() => {
    const g = [236, 232, 223], a = [255, 90, 31], d = [150, 40, 6], L = new Uint8Array(256 * 3);
    for (let i = 0; i < 256; i++) {
      const u = i / 255, c = u < 0.55 ? g.map((v, k) => lerp(v, a[k], E.ioS(u / 0.55))) : a.map((v, k) => lerp(v, d[k], (u - 0.55) / 0.45));
      L[i * 3] = c[0]; L[i * 3 + 1] = c[1]; L[i * 3 + 2] = c[2];
    }
    return L;
  })();
  // F–k map: k on x (0.03 … 0.07), F on y (0 … 0.08)
  const RD_MAP = { x: 1480, y: 290, w: 368, h: 300, k0: 0.03, k1: 0.07, F0: 0, F1: 0.08 };
  const mapX = k => RD_MAP.x + (k - RD_MAP.k0) / (RD_MAP.k1 - RD_MAP.k0) * RD_MAP.w;
  const mapY = F => RD_MAP.y + RD_MAP.h - (F - RD_MAP.F0) / (RD_MAP.F1 - RD_MAP.F0) * RD_MAP.h;

  MG.film({
    id: 'techreaction', dur: 10, poster: 7.2,
    fonts,
    meta: {
      family: 'K', name: 'Reaction-Diffusion', sub: 'Two chemicals, feed and kill: Gray–Scott patterns', era: '1952 —',
      origin: 'Alan Turing’s The Chemical Basis of Morphogenesis (1952) showed that two diffusing, reacting chemicals can break a uniform field into spots and stripes. Peter Gray and Stephen K. Scott’s autocatalytic reaction model (1983–84) became the favourite system for it after John E. Pearson’s Complex Patterns in a Simple System (Science, 1993) mapped its feed and kill parameters into a zoo of regimes. Greg Turk and, separately, Andrew Witkin and Michael Kass brought reaction-diffusion textures to computer graphics at SIGGRAPH 1991; GPU shaders later made it a live, seedable motion-graphics effect.',
      works: 'Generating Textures on Arbitrary Surfaces Using Reaction-Diffusion (Greg Turk, SIGGRAPH 1991) · Reaction-Diffusion Textures (Andrew Witkin & Michael Kass, SIGGRAPH 1991) · Complex Patterns in a Simple System (John E. Pearson, Science, 1993)',
      tech: ['Gray–Scott: u·v² reaction, feed F, kill k', 'Diffusion by a 3 × 3 Laplacian, V at half the rate of U', 'Same seed, three (F, k) pairs, three regimes', 'Spots masked by a higher k outside the Token; stripes aligned by anisotropic diffusion of V'],
      accent: '#ff5a1f',
      motionDNA: 'Nothing is animated by hand: a dashed outline of the Token is poured into three dishes on the first downbeat and the equations take over. Slowly at first, then faster as more steps run per frame, the outline swells and breaks — into dots that split and pack the Token’s silhouette, into parallel bands that echo the Token’s outline outward, into a branching coral maze. One dish is spotlit every two bars while its point lights up on the F–k map.',
      visualDNA: 'The Technique Atlas stage; three square dishes of paper-white U and orange V, framed in thin ink; the two equations and a 3 × 3 Laplacian stencil in mono type; a small F–k chart with the saddle-node curve, the three parameter dots and region labels; step counter and mono labels with F and k under each dish.',
      transitions: 'Continuous growth from one seed; a spotlight moves dish to dish on the bar',
      implementation: ['Gray–Scott on three 160 × 160 grids precomputed in setup (5,200 steps, Δt 1, wrap-around), with per-cell k and per-cell stencil weights from the Token’s distance field', 'Byte frames stored at 15 fps and blended per pixel through a paper → orange colour ramp', 'Canvas 2D: per-dish ImageData on small offscreens, scaled up with smoothing'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const fr = rdBuild(), cv = RD_SET.map(() => offscreen(RD.N, RD.N));
      return { fr, cv, img: cv.map(k => k.getContext('2d').createImageData(RD.N, RD.N)) };
    },
    draw(c, t, W, H, st) {
      const N = RD.N, NN = N * N, pw = RD.pw, py = RD.py, foc = rdFocus(t);
      TK.stage(c, W, H);
      const f = clamp((t - RD.t0) * RD.sf, 0, RD_NFR - 1), k0 = Math.min(RD_NFR - 2, Math.floor(f)), u = f - k0, ui = Math.round(u * 256);
      // equations and stencil
      const ea = seg(t, 0.2, 0.6);
      c.save(); c.globalAlpha = ea;
      label(c, '∂u/∂t = Du ∇²u − u·v² + F·(1 − u)', 72, 176, { size: 22, ls: 1, color: P.ink, weight: 700 });
      label(c, '∂v/∂t = Dv ∇²v + u·v² − (F + k)·v', 72, 212, { size: 22, ls: 1, color: P.ink, weight: 700 });
      label(c, 'U  FEED, PAPER   ·   V  ACTIVATOR, ORANGE   ·   Du 1.0  Dv 0.5  Δt 1', 600, 176, { size: 14, ls: 2 });
      label(c, 'F  HOW FAST U IS FED IN   ·   k  HOW FAST V IS KILLED OFF', 600, 212, { size: 14, ls: 2 });
      c.restore();
      RD_SET.forEach((sp, i) => {
        const x = RD.xs[i], fr = st.fr[i], img = st.img[i], d = img.data, oa = k0 * NN, ob = (k0 + 1) * NN;
        for (let p = 0; p < NN; p++) {
          const v = (fr[oa + p] * (256 - ui) + fr[ob + p] * ui) >> 8, q = p * 4;
          d[q] = RD_LUT[v * 3]; d[q + 1] = RD_LUT[v * 3 + 1]; d[q + 2] = RD_LUT[v * 3 + 2]; d[q + 3] = 255;
        }
        st.cv[i].getContext('2d').putImageData(img, 0, 0);
        c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
        c.drawImage(st.cv[i], x, py, pw, pw); c.restore();
        if (sp.kOut) {   // the mask: k is raised outside this outline
          c.save(); c.translate(x + pw / 2, py + pw / 2); c.globalAlpha = 0.45 * seg(t, 1.6, 2.2);
          TK.tokenPath(c, pw * 0.6); c.setLineDash([4, 6]); c.strokeStyle = P.ink; c.lineWidth = 1.5; c.stroke(); c.restore();
        }
        const on = foc === i ? 1 : 0, dim = foc >= 0 && !on;
        c.strokeStyle = on ? P.ink : 'rgba(23,24,28,0.35)'; c.lineWidth = on ? 3 : 1.5; c.strokeRect(x, py, pw, pw);
        label(c, `0${i + 1}  ${sp.name}`, x, py - 16, { size: 18, ls: 3, color: dim ? P.mute : P.ink, weight: 700 });
        label(c, `F ${sp.F}   k ${sp.k}`, x, py + pw + 34, { size: 18, ls: 2, color: dim ? P.mute : P.ink, weight: 700 });
        label(c, sp.note, x, py + pw + 60, { size: 13, ls: 2 });
        if (on) { c.fillStyle = P.accent; c.fillRect(x, py + pw + 72, pw * seg(t, 2 + i * 2, 4 + i * 2), 3); }
      });
      // seed callout
      const sa = win(t, 0.3, 1.6, 0.3);
      if (sa > 0.01) { c.save(); c.globalAlpha = sa; label(c, 'SEED  ·  V = 0.25 IN BLOCKS ALONG THE TOKEN OUTLINE', 72 + (RD.xs[2] + pw - 72) / 2, py + pw + 120, { size: 18, ls: 2, color: P.ink, weight: 700, align: 'center' }); c.restore(); }
      // F–k map
      const mx = RD_MAP.x, my = RD_MAP.y, mw = RD_MAP.w, mh = RD_MAP.h;
      label(c, 'PARAMETER MAP', mx, my - 16, { size: 18, ls: 3, color: P.ink, weight: 700 });
      c.save(); c.beginPath(); c.rect(mx, my, mw, mh); c.clip();
      c.fillStyle = 'rgba(255,90,31,0.07)'; c.beginPath(); c.moveTo(mx, my + mh);
      for (let s = 0; s <= 80; s++) { const F = s / 80 * RD_MAP.F1; c.lineTo(mapX(Math.sqrt(F) / 2 - F), mapY(F)); }
      c.lineTo(mx, my); c.closePath(); c.fill();
      c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath();
      for (let s = 0; s <= 80; s++) { const F = s / 80 * RD_MAP.F1, X = mapX(Math.sqrt(F) / 2 - F), Y = mapY(F); s ? c.lineTo(X, Y) : c.moveTo(X, Y); }
      c.stroke(); c.restore();
      c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 1; c.strokeRect(mx + 0.5, my + 0.5, mw, mh);
      c.strokeStyle = 'rgba(23,24,28,0.08)'; c.beginPath();
      for (let kk = 0.04; kk < 0.07; kk += 0.01) { c.moveTo(mapX(kk), my); c.lineTo(mapX(kk), my + mh); }
      for (let F = 0.02; F < 0.08; F += 0.02) { c.moveTo(mx, mapY(F)); c.lineTo(mx + mw, mapY(F)); }
      c.stroke();
      label(c, 'V SURVIVES', mx + 16, my + 34, { size: 13, ls: 2, color: P.accentD, weight: 700 });
      label(c, 'SEED DIES', mx + mw - 16, my + mh - 18, { size: 13, ls: 2, align: 'right' });
      label(c, 'k = √F / 2 − F', mapX(0.0505), mapY(0.012) + 4, { size: 13, ls: 1, color: P.ink, align: 'left' });
      label(c, 'k  0.03 → 0.07', mx + mw, my + mh + 24, { size: 13, ls: 2, align: 'right' });
      label(c, 'F  0 → 0.08', mx, my + mh + 24, { size: 13, ls: 2 });
      RD_SET.forEach((sp, i) => {
        const X = mapX(sp.k), Y = mapY(sp.F), on = foc === i || foc < 0;
        c.fillStyle = on ? P.accent : P.mute; c.beginPath(); c.arc(X, Y, foc === i ? 9 : 6, 0, TAU); c.fill();
        if (foc === i) { c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.arc(X, Y, 15 + 3 * Math.sin(t * TAU * 2), 0, TAU); c.stroke(); }
        label(c, sp.name, X + [0, -14, 14][i], Y + [30, -12, -12][i], { size: 13, ls: 2, color: on ? P.ink : P.mute, weight: 700, align: ['center', 'right', 'left'][i] });
      });
      // Laplacian stencil
      const lx = mx, ly = my + mh + 64, cs = 46;
      label(c, '∇²  3 × 3 STENCIL', lx, ly - 12, { size: 14, ls: 2, color: P.ink, weight: 700 });
      [[0.05, 0.2, 0.05], [0.2, -1, 0.2], [0.05, 0.2, 0.05]].forEach((row, j) => row.forEach((w, i) => {
        const x = lx + i * cs, y = ly + j * cs;
        c.fillStyle = w < 0 ? P.accent : w > 0.1 ? 'rgba(255,90,31,0.28)' : 'rgba(255,90,31,0.1)'; c.fillRect(x, y, cs - 3, cs - 3);
        label(c, w < 0 ? '−1' : String(w), x + (cs - 3) / 2, y + cs / 2 + 3, { size: 13, ls: 0, color: w < 0 ? P.ground : P.ink, align: 'center', weight: 700 });
      }));
      label(c, 'EACH CELL MOVES TOWARD', lx + 3 * cs + 18, ly + 40, { size: 13, ls: 2 });
      label(c, 'ITS NEIGHBOURS’ AVERAGE', lx + 3 * cs + 18, ly + 62, { size: 13, ls: 2 });
      const ma = seg(t, 8.4, 8.9);
      if (ma > 0) { c.save(); c.globalAlpha = ma; label(c, 'SAME SEED  ·  SAME EQUATIONS  ·  F AND k SET THE PATTERN', 72 + (RD.xs[2] + pw - 72) / 2, py + pw + 120, { size: 18, ls: 3, color: P.ink, weight: 700, align: 'center' }); c.restore(); }
      tag(c, `GRAY–SCOTT  ·  3 × ${N}² CELLS  ·  STEP ${fmtN(rdSteps(t))}`, 72, 96, seg(t, 0.1, 0.4));
      TK.caption(c, t, W, H, { name: 'Reaction-Diffusion', cat: 'Procedural', curve: v => rdSteps(v * 10) / RD.steps, span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'SIMULATION STEPS / TIME' });
    },
    score(A) {
      TK.bed(A);
      A.impact(RD.t0, 0.25, { rev: 0.4 });
      A.noise(RD.t0, { type: 'bandpass', f: 400, f2: 3200, q: 3, dur: RD.t1 - RD.t0, g: 0.05, swell: 0.9, rev: 0.4 });
      const pent = [0, 3, 5, 7, 10];
      for (let b = 0; b * 0.25 + RD.t0 < RD.t1; b++) {
        const t = RD.t0 + b * 0.25, p = (t - RD.t0) / (RD.t1 - RD.t0), n = 60 + pent[Math.floor(hash(b * 3.1) * 5)] + 12 * Math.floor(hash(b * 7.7) * 2);
        if (hash(b * 1.9) < 0.35 + 0.5 * p) A.pluck(t, midi(n), { g: 0.06 + 0.06 * p, bright: 0.3 + 0.5 * p, dur: 0.5, pan: (hash(b * 5.3) - 0.5) * 0.8, rev: 0.35 });
      }
      [[2, 76], [4, 72], [6, 67]].forEach(([t, n]) => { A.bell(t, midi(n), { g: 0.07, dur: 1.6 }); A.whoosh(t - 0.2, 0.4, { f1: 800, f2: 3000, g: 0.05 }); });
      A.chord(8.5, [60, 63, 67, 70, 74], { type: 'triangle', dur: 1.6, g: 0.03, a: 0.1, lp: 2400, rev: 0.6, width: 0.9 });
    },
  });

  /* =====================================================================
     L-SYSTEM — Lindenmayer's parallel rewriting: every symbol of the
     string is replaced at once by its rule, here X → F+[[X]-X]-F[-FX]+X
     and F → FF from the axiom X. A turtle then reads the string: F steps
     forward drawing, + and − turn by δ, [ and ] push and pop its state,
     X draws nothing and is shown as a Token bud. F → FF doubles every
     stem, so each generation is drawn at half the step and lands on the
     last one's skeleton. Five generations on five downbeats, the turtle's
     read head shown in the string, then δ re-set on three beats.
     ===================================================================== */
  const LS = { axiom: 'X', rules: { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, gens: 5, box: [800, 150, 1060, 720] };
  const LS_GT = [[1.0, 0.6], [2.0, 0.7], [3.0, 0.8], [4.0, 0.9], [5.0, 1.3]];   // start, draw time per generation
  const LS_ANG = [[0, 25], [6.5, 25], [6.9, 18, E.outB], [7.5, 18], [7.9, 32, E.outB], [8.5, 32], [8.9, 22.5, E.outB]];
  function lsBuild() {
    const S = [LS.axiom];
    for (let n = 1; n <= LS.gens; n++) S.push([...S[n - 1]].map(ch => LS.rules[ch] ?? ch).join(''));
    return { S };
  }
  // Turtle walk of string s with step len and angle d (rad), from 0,0 heading up. Returns segments and buds.
  function lsWalk(s, len, d) {
    const seg2 = [], buds = [], stack = [];
    let x = 0, y = 0, a = -PI / 2, dep = 0, x0 = 0, x1 = 0, y0 = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === 'F') { const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len; seg2.push([x, y, nx, ny, i, dep]); x = nx; y = ny; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); }
      else if (ch === '+') a -= d;
      else if (ch === '-') a += d;
      else if (ch === '[') { stack.push([x, y, a]); dep++; }
      else if (ch === ']') { [x, y, a] = stack.pop(); dep--; }
      else if (ch === 'X') buds.push([x, y, a, i, dep]);
    }
    return { seg: seg2, buds, bb: [x0, x1, y0] };
  }
  const lsGen = t => { let n = 0; LS_GT.forEach(([t0], i) => { if (t >= t0) n = i + 1; }); return n; };
  const lsLenAt = (S, t) => S[lsGen(t)].length;

  MG.film({
    id: 'techlsystem', dur: 10, poster: 5.6,
    fonts,
    meta: {
      family: 'K', name: 'L-System', sub: 'Rewrite a string, then let a turtle draw it', era: '1968 —',
      origin: 'The biologist Aristid Lindenmayer introduced L-systems in 1968 to describe how cells of simple organisms divide: every symbol of a string is rewritten at once by its rule. Alvy Ray Smith drew plants from them in Plants, Fractals, and Formal Languages (SIGGRAPH 1984), and Przemysław Prusinkiewicz gave them the turtle interpretation — F forward, + and − turn, brackets push and pop a branch — used ever since, collected with Lindenmayer in The Algorithmic Beauty of Plants (1990). Procedural tools such as Houdini’s L-system node grow trees, ivy and growth animations the same way.',
      works: 'Plants, Fractals, and Formal Languages (Alvy Ray Smith, SIGGRAPH 1984) · The Algorithmic Beauty of Plants (Przemysław Prusinkiewicz & Aristid Lindenmayer, Springer, 1990) · L-System node in Houdini (SideFX)',
      tech: ['Parallel rewriting: X → F+[[X]-X]-F[-FX]+X, F → FF', 'Turtle: F draw, ± turn δ, [ ] push / pop', 'Step halves each generation so the skeleton is kept'],
      accent: '#ff5a1f',
      motionDNA: 'Growth by generations on the downbeat: each new string is read left to right by a turtle whose path appears as it goes, so the stem climbs first and every branch flicks out in reading order; the previous generation stays underneath as a ghost the new one traces over. After the fifth generation the branching angle snaps on three beats — narrower, wider, back — and the whole plant re-folds at once, buds and all.',
      visualDNA: 'The Technique Atlas stage; ink stems thinning with branch depth, small orange Tokens as buds at every X and a few larger accent Tokens as flowers; left, the axiom, the two rules and the angle in mono type, a table of generations with string lengths, and a read-head window that highlights the symbol the turtle is on.',
      transitions: 'Each generation grows over the ghost of the last; the angle re-sets with a springy overshoot',
      implementation: ['String rewriting in setup (generations 0–5, up to several thousand symbols)', 'Turtle interpretation every frame with a stack for [ and ], fitted to the stage', 'Canvas 2D: stems as strokes by depth, buds as rotated Tokens, mono string read-out'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return lsBuild(); },
    draw(c, t, W, H, st) {
      const S = st.S, d = kf(t, LS_ANG) * PI / 180, n = lsGen(t), [bxL, byT, bw, bh] = LS.box;
      TK.stage(c, W, H);
      // fit: generation 5 at the current angle fills the box, the base sits on its bottom edge
      const L5 = 1, ref = lsWalk(S[LS.gens], L5, d), [x0, x1, y0] = ref.bb;
      const sc = Math.min(bw / (x1 - x0), bh / -y0), bx = bxL + bw / 2 - (x0 + x1) / 2 * sc, by = byT + bh;
      c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(bxL + bw / 2 - 260, by, 520, 2);
      const drawGen = (g, p, alpha, ghost) => {
        const len = sc * Math.pow(2, LS.gens - g), w = lsWalk(S[g], len, d), head = p * S[g].length;
        c.save(); c.globalAlpha = alpha; c.lineCap = 'round';
        for (let dep = 0; dep <= 8; dep++) {
          c.strokeStyle = ghost ? 'rgba(23,24,28,0.35)' : P.ink; c.lineWidth = Math.max(1.3, (ghost ? 2 : 6) * Math.pow(0.72, dep)) * (g < 3 ? 1.6 : 1); c.beginPath();
          let any = false;
          for (const [ax, ay, ex, ey, i, sd] of w.seg) {
            if (sd !== dep || i >= head) continue;
            const f = clamp(head - i);
            c.moveTo(bx + ax, by + ay); c.lineTo(bx + lerp(ax, ex, f), by + lerp(ay, ey, f)); any = true;
          }
          if (any) c.stroke();
        }
        if (!ghost) {
          const bs = clamp(len * 1.15, 5, 40), str = S[g];
          for (const [x, y, a, i] of w.buds) {
            if (i >= head || (i + 1 < str.length && str[i + 1] !== ']')) continue;   // only buds that end a branch
            const fl = hash(i * 1.37 + g * 11) > 0.9, s = bs * (fl ? 2.2 : 1) * E.outB(clamp((head - i) / 40 + 0.2));
            const ox = Math.cos(a) * s * 0.45, oy = Math.sin(a) * s * 0.45;
            TK.token(c, bx + x + ox, by + y + oy, s, { rot: a + PI / 2, color: fl ? P.accent : P.accentL });
          }
        }
        c.restore();
        // turtle head
        if (!ghost && p < 1 && p > 0) {
          let hx = 0, hy = 0, ha = -PI / 2;
          for (const s2 of w.seg) { if (s2[4] < head) { const f = clamp(head - s2[4]); hx = lerp(s2[0], s2[2], f); hy = lerp(s2[1], s2[3], f); ha = Math.atan2(s2[3] - s2[1], s2[2] - s2[0]); } }
          c.save(); c.translate(bx + hx, by + hy); c.rotate(ha); c.fillStyle = P.blue;
          c.beginPath(); c.moveTo(14, 0); c.lineTo(-8, -8); c.lineTo(-8, 8); c.closePath(); c.fill(); c.restore();
        }
      };
      let p = 1;
      if (n === 0) drawGen(0, 1, 1, false);
      else {
        const [g0, gd] = LS_GT[n - 1]; p = clamp((t - g0) / gd);
        if (p < 1) drawGen(n - 1, 1, 1 - 0.5 * seg(t, g0, g0 + 0.15), true);
        drawGen(n, p, 1, false);
      }
      // left panel: axiom, rules, angle, generations, read head
      const lx = 72, vx = 200;
      label(c, 'AXIOM', lx, 178, { size: 15, ls: 3 });
      label(c, LS.axiom, vx, 180, { size: 24, ls: 2, color: P.ink, weight: 700 });
      label(c, 'RULES', lx, 222, { size: 15, ls: 3 });
      label(c, 'X → F+[[X]-X]-F[-FX]+X', vx, 224, { size: 24, ls: 1, color: P.ink, weight: 700 });
      label(c, 'F → FF', vx, 260, { size: 24, ls: 1, color: P.ink, weight: 700 });
      label(c, 'ANGLE', lx, 304, { size: 15, ls: 3 });
      const angOn = t > 6.4 && t < 9.3;
      label(c, `δ = ${(d * 180 / PI).toFixed(1)}°`, vx, 306, { size: 24, ls: 1, color: angOn ? P.accentD : P.ink, weight: 700 });
      label(c, 'n', lx, 360, { size: 14, ls: 2 }); label(c, 'LENGTH', lx + 40, 360, { size: 14, ls: 2 }); label(c, 'STRING', lx + 160, 360, { size: 14, ls: 2 });
      c.fillStyle = 'rgba(23,24,28,0.2)'; c.fillRect(lx, 370, 610, 1);
      for (let g = 0; g <= LS.gens; g++) {
        const ra = g === 0 ? 1 : seg(t, LS_GT[g - 1][0], LS_GT[g - 1][0] + 0.2);
        if (ra <= 0) continue;
        const y = 400 + g * 34, cur = g === n, col = cur ? P.ink : P.mute;
        c.save(); c.globalAlpha = ra;
        if (cur) { c.fillStyle = P.accent; c.beginPath(); c.arc(lx - 14, y - 6, 5, 0, TAU); c.fill(); }
        label(c, String(g), lx, y, { size: 17, ls: 1, color: col, weight: cur ? 700 : 400 });
        label(c, fmtN(S[g].length), lx + 40, y, { size: 17, ls: 1, color: col, weight: cur ? 700 : 400 });
        const str = S[g].length > 26 ? S[g].slice(0, 26) + '…' : S[g];
        label(c, str, lx + 160, y, { size: 17, ls: 1, color: col, weight: cur ? 700 : 400 });
        c.restore();
      }
      // read head window
      const ra = n > 0 ? win(t, LS_GT[n - 1][0], LS_GT[n - 1][0] + LS_GT[n - 1][1] + 0.1, 0.12) : 0;
      if (ra > 0.01) {
        const s = S[n], head = Math.min(s.length - 1, Math.floor(p * s.length)), K = 15, y = 650;
        c.save(); c.globalAlpha = ra;
        label(c, `TURTLE READS  ·  ${fmtN(head + 1)} / ${fmtN(s.length)}`, lx, y - 36, { size: 14, ls: 2, color: P.ink, weight: 700 });
        c.font = `700 24px ${TK.MONO}`; const cw = c.measureText('M').width + 4;
        for (let k = -K; k <= K; k++) {
          const i = head + k; if (i < 0 || i >= s.length) continue;
          const x = lx + (k + K) * cw;
          if (k === 0) { c.fillStyle = P.blue; c.fillRect(x - 2, y - 24, cw, 32); }
          label(c, s[i], x + cw / 2 - 2, y, { size: 24, ls: 0, align: 'center', weight: 700, color: k === 0 ? P.ground : s[i] === 'X' ? P.accentD : Math.abs(k) > 11 ? 'rgba(23,24,28,0.3)' : P.ink });
        }
        c.restore();
      }
      // legend
      const gy = 728;
      [['F', 'FORWARD, DRAW'], ['+  −', 'TURN ± δ'], ['[  ]', 'PUSH / POP'], ['X', 'BUD → TOKEN']].forEach(([s, m], i) => {
        const x = lx + (i % 2) * 300, y = gy + Math.floor(i / 2) * 32;
        label(c, s, x, y, { size: 18, ls: 1, color: P.ink, weight: 700 });
        label(c, m, x + 64, y, { size: 14, ls: 2 });
      });
      tag(c, `L-SYSTEM  ·  GENERATION ${n}  ·  ${fmtN(S[n].length)} SYMBOLS`, 72, 96, seg(t, 0.1, 0.4));
      const L5n = Math.log(S[LS.gens].length);
      TK.caption(c, t, W, H, { name: 'L-System', cat: 'Procedural', curve: v => Math.log(lsLenAt(S, v * 10)) / L5n, span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'LOG STRING LENGTH / TIME' });
    },
    score(A) {
      TK.bed(A);
      const S = lsBuild().S, scale = [0, 2, 4, 7, 9, 12, 14, 16];
      A.bell(0.3, midi(72), { g: 0.05, dur: 1 });
      LS_GT.forEach(([t0, d], g) => {
        const s = S[g + 1], n = 6 + g * 2;
        A.whoosh(t0 - 0.1, d + 0.2, { f1: 300, f2: 2000 + g * 500, q: 2, g: 0.06, swell: 0.4 });
        for (let k = 0; k < n; k++) {
          const i = Math.floor(k / n * s.length); let dep = 0;
          for (let j = 0; j < i; j++) dep += s[j] === '[' ? 1 : s[j] === ']' ? -1 : 0;
          A.pluck(t0 + k / n * d, midi(55 + scale[Math.min(7, dep + (k % 2))] + g), { g: 0.1, bright: 0.45 + 0.08 * g, dur: 0.7, pan: (k / n - 0.5) * 0.8, rev: 0.3 });
        }
        A.bell(t0 + d, midi([76, 79, 81, 84, 88][g]), { g: 0.06, dur: 1.3 });
      });
      [[6.5, [62, 67, 71]], [7.5, [64, 69, 72]], [8.5, [60, 64, 67, 72]]].forEach(([t, ch], i) => {
        A.whoosh(t - 0.05, 0.45, { f1: 500, f2: 3500, g: 0.08, pan: i - 1 });
        ch.forEach((m, j) => A.pluck(t + 0.4 + j * 0.03, midi(m), { g: 0.12, bright: 0.6, dur: 1.2, rev: 0.4 }));
      });
    },
  });
})();
