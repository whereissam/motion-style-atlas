/* Rendering Looks kit — the shared scene, camera, tracer and caption for family L.
   Every look film renders the same 3D still life with the same 10 s camera move, so the only
   thing that changes from film to film is the look: material, light, shading or image treatment.

   The scene (world units, y up, floor at y = 0):
     id 1  the Token — the orange rounded tile with its off-centre hole, 2 × 2 × 0.44, hovering
           and turning slowly at the centre
     id 2  a sphere, radius 0.75, front left
     id 3  a rounded cube, side 1, back right
     id 0  an infinite studio floor
     id 255 no hit (sky / backdrop)

   A look film calls LK.render(c, t, W, H, shade, opts). The kit traces one primary ray per pixel
   at reduced resolution (default 800 × 450, silhouettes antialiased), hands each pixel's surface sample to shade(g, S),
   which returns [r, g, b] in 0..1, optionally runs opts.post over the finished buffer, and draws
   the result scaled to the full frame. Secondary rays (shadows, reflections, refraction, AO) are
   available as LK.shadow, LK.trace, LK.traceInside and LK.ao. Everything is a pure function of t. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, E } = MG;

  /* ---------------- vector helpers (plain arrays) ---------------- */
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => Math.hypot(a[0], a[1], a[2]);
  const norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const reflect = (d, n) => sub(d, mul(n, 2 * dot(d, n)));
  function refract(d, n, eta) {   // eta = n1 / n2; returns null on total internal reflection
    const c = -dot(n, d), k = 1 - eta * eta * (1 - c * c);
    return k < 0 ? null : add(mul(d, eta), mul(n, eta * c - Math.sqrt(k)));
  }
  const V = { add, sub, mul, dot, cross, len, norm, reflect, refract };

  /* ---------------- palette, fonts ---------------- */
  const P = {
    paper: '#ece8df', ink: '#17181c', mute: '#8f8a80',
    accent: '#ff5a1f', blue: '#2f5bff',
    // linear-ish 0..1 albedos for the shaders
    tok: [1.0, 0.353, 0.122], sph: [0.86, 0.85, 0.82], cube: [0.184, 0.357, 1.0], floor: [0.925, 0.91, 0.875],
  };
  const fonts = MG.TK ? MG.TK.fonts : [];

  /* ---------------- scene geometry ---------------- */
  const TOK = { half: 1, corner: 0.44, depth: 0.22, edge: 0.07, hole: [0.4, 0.4], holeR: 0.34, bound: 1.55 };
  const SPH = { c: [-2.35, 0.75, 0.7], r: 0.75 };
  const CUBE = { c: [2.75, 0.5, -0.55], half: 0.5, round: 0.07, yaw: 0.55, bound: 0.95 };
  const TARGET = [0, 1.05, 0];

  function rotY(a) { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; }
  function rotX(a) { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; }
  function mm(A, B) {
    const R = new Array(9);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) R[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j];
    return R;
  }
  // world → local (multiply by transpose of the rotation)
  const toLocal = (M, p) => [M[0] * p[0] + M[3] * p[1] + M[6] * p[2], M[1] * p[0] + M[4] * p[1] + M[7] * p[2], M[2] * p[0] + M[5] * p[1] + M[8] * p[2]];
  const toWorld = (M, p) => [M[0] * p[0] + M[1] * p[1] + M[2] * p[2], M[3] * p[0] + M[4] * p[1] + M[5] * p[2], M[6] * p[0] + M[7] * p[1] + M[8] * p[2]];

  /* The frame state for time t: camera and the Token's pose. The camera orbits 50° around the
     still life on a slow in-out ease and drifts down a little; the Token turns 140° and bobs. */
  function scene(t) {
    const u = E.ioS(clamp(t / 10)), a = lerp(-0.42, 0.45, u), R = lerp(7.6, 6.9, u), h = lerp(2.9, 2.35, u);
    const pos = [TARGET[0] + Math.sin(a) * R, h, TARGET[2] + Math.cos(a) * R];
    const fw = norm(sub(TARGET, pos)), right = norm(cross(fw, [0, 1, 0])), up = cross(right, fw);
    // the Token keeps roughly facing the camera, turning ±35° either side of it so its hole always reads
    const yaw = a + 0.62 * Math.sin((t - 1.2) * TAU / 10), tilt = -0.12 + 0.06 * Math.sin(t * 0.9);
    const M = mm(rotY(yaw), rotX(tilt));
    const tc = [0, 1.62 + 0.09 * Math.sin(t * TAU / 4), 0];
    const cubeM = rotY(CUBE.yaw);
    return { t, cam: { pos, fw, right, up, fov: 38 * Math.PI / 180 }, tok: { M, c: tc, yaw, tilt }, cubeM };
  }

  /* ---------------- signed distances ---------------- */
  function sdTokenLocal(q) {
    const T = TOK, e = T.edge;
    // 2D: rounded square minus the hole, shrunk by the edge radius, then extruded and rounded
    const ax = Math.abs(q[0]) - (T.half - T.corner), ay = Math.abs(q[1]) - (T.half - T.corner);
    let d2 = Math.hypot(Math.max(ax, 0), Math.max(ay, 0)) + Math.min(Math.max(ax, ay), 0) - T.corner;
    d2 = Math.max(d2, T.holeR - Math.hypot(q[0] - T.hole[0], q[1] - T.hole[1]));
    const wx = d2 + e, wy = Math.abs(q[2]) - (T.depth - e);
    return Math.min(Math.max(wx, wy), 0) + Math.hypot(Math.max(wx, 0), Math.max(wy, 0)) - e;
  }
  const sdToken = (p, S) => sdTokenLocal(toLocal(S.tok.M, sub(p, S.tok.c)));
  function sdCube(p, S) {
    const q = toLocal(S.cubeM, sub(p, CUBE.c)), b = CUBE.half - CUBE.round;
    const x = Math.abs(q[0]) - b, y = Math.abs(q[1]) - b, z = Math.abs(q[2]) - b;
    return Math.hypot(Math.max(x, 0), Math.max(y, 0), Math.max(z, 0)) + Math.min(Math.max(x, y, z), 0) - CUBE.round;
  }
  const sdSphere = p => len(sub(p, SPH.c)) - SPH.r;

  /* Full scene distance (used for AO and by looks that want it): returns the distance; map2 also the id. */
  function map(p, S) { return Math.min(p[1], sdToken(p, S), sdCube(p, S), sdSphere(p)); }
  function map2(p, S) {
    let d = p[1], id = 0, k;
    if ((k = sdToken(p, S)) < d) { d = k; id = 1; }
    if ((k = sdSphere(p)) < d) { d = k; id = 2; }
    if ((k = sdCube(p, S)) < d) { d = k; id = 3; }
    return [d, id];
  }
  const sdOf = (id, p, S) => (id === 1 ? sdToken(p, S) : id === 2 ? sdSphere(p) : id === 3 ? sdCube(p, S) : p[1]);

  /* ---------------- intersection ---------------- */
  // ray vs bounding sphere: returns [t0, t1] or null
  function hitSphere(ro, rd, c, r) {
    const oc = sub(ro, c), b = dot(oc, rd), cc = dot(oc, oc) - r * r, h = b * b - cc;
    if (h < 0) return null;
    const s = Math.sqrt(h);
    return [-b - s, -b + s];
  }
  function marchObj(id, ro, rd, t0, t1, S) {
    let t = Math.max(t0, 0);
    for (let i = 0; i < 72 && t < t1; i++) {
      const d = sdOf(id, add(ro, mul(rd, t)), S);
      if (d < 0.0015 * (1 + t * 0.15)) return t;
      t += d * 0.95;
    }
    return -1;
  }
  /* Nearest hit along a ray: { hit, id, t, p }. skip: an id to ignore (e.g. the surface a
     secondary ray leaves from is handled by the epsilon offset instead, but glass may skip itself). */
  function trace(ro, rd, S, o = {}) {
    let best = o.maxT || 60, id = 255;
    if (rd[1] < -1e-6) { const tf = -ro[1] / rd[1]; if (tf > 1e-4 && tf < best) { best = tf; id = 0; } }
    if (o.skip !== 2) { const h = hitSphere(ro, rd, SPH.c, SPH.r); if (h && h[0] > 1e-4 && h[0] < best) { best = h[0]; id = 2; } }
    if (o.skip !== 1) { const b = hitSphere(ro, rd, S.tok.c, TOK.bound); if (b && b[1] > 0 && b[0] < best) { const t = marchObj(1, ro, rd, b[0], Math.min(b[1], best), S); if (t > 0 && t < best) { best = t; id = 1; } } }
    if (o.skip !== 3) { const b = hitSphere(ro, rd, CUBE.c, CUBE.bound); if (b && b[1] > 0 && b[0] < best) { const t = marchObj(3, ro, rd, b[0], Math.min(b[1], best), S); if (t > 0 && t < best) { best = t; id = 3; } } }
    return id === 255 ? { hit: false, id, t: Infinity, p: null } : { hit: true, id, t: best, p: add(ro, mul(rd, best)) };
  }
  /* From a point inside object id, march to where the ray leaves it. Returns { t, p, n } (n points outward). */
  function traceInside(id, ro, rd, S) {
    if (id === 2) {
      const h = hitSphere(ro, rd, SPH.c, SPH.r), t = h ? Math.max(h[1], 0) : 0, p = add(ro, mul(rd, t));
      return { t, p, n: norm(sub(p, SPH.c)) };
    }
    let t = 0.004;
    for (let i = 0; i < 64; i++) {
      const d = -sdOf(id, add(ro, mul(rd, t)), S);
      if (d < 0.0015) break;
      t += Math.max(d * 0.95, 0.002);
    }
    const p = add(ro, mul(rd, t));
    return { t, p, n: normal(p, id, S) };
  }
  function normal(p, id, S) {
    if (id === 0) return [0, 1, 0];
    if (id === 2) return norm(sub(p, SPH.c));
    const e = 0.0012, f = q => sdOf(id, q, S);
    const a = f([p[0] + e, p[1] - e, p[2] - e]), b = f([p[0] - e, p[1] - e, p[2] + e]), c = f([p[0] - e, p[1] + e, p[2] - e]), d = f([p[0] + e, p[1] + e, p[2] + e]);
    return norm([a - b - c + d, -a - b + c + d, -a + b - c + d]);
  }

  /* Soft shadow toward a direction l (unit) from p: 1 = lit, 0 = fully shadowed. k = softness
     (higher = harder). Objects whose bounds the ray never comes near are skipped, so open floor is cheap. */
  function shadow(p, l, S, k = 10) {
    let res = 1;
    // sphere: analytic soft shadow
    {
      const oc = sub(p, SPH.c), b = dot(oc, l), c = dot(oc, oc) - SPH.r * SPH.r, h = b * b - c;
      const d = Math.sqrt(Math.max(0, SPH.r * SPH.r - h)) - SPH.r, tt = -b - Math.sqrt(Math.max(h, 0));
      if (tt > 0) { const x = clamp(0.25 * k * d / tt); res = Math.min(res, x * x * (3 - 2 * x)); }
    }
    const objs = [[1, S.tok.c, TOK.bound], [3, CUBE.c, CUBE.bound]];
    for (const [id, c, r] of objs) {
      const oc = sub(c, p), along = dot(oc, l);
      if (along < -r) continue;
      const miss = len(sub(oc, mul(l, along))) - r;
      if (miss > r * 0.6) continue;
      let t = Math.max(0.02, along - r - 0.05), tEnd = along + r;
      if (t < 0.02) t = 0.02;
      for (let i = 0; i < 40 && t < tEnd; i++) {
        const h = sdOf(id, add(p, mul(l, t)), S);
        res = Math.min(res, k * h / t);
        if (res < 0.002) return 0;
        t += clamp(h, 0.02, 0.4);
      }
    }
    return clamp(res);
  }

  /* Ambient occlusion: 1 = open, lower = occluded. */
  function ao(p, n, S, steps = 5, spread = 0.22) {
    let occ = 0, sc = 1;
    for (let i = 1; i <= steps; i++) {
      const h = 0.02 + spread * i / steps;
      occ += (h - map(add(p, mul(n, h)), S)) * sc;
      sc *= 0.7;
    }
    return clamp(1 - 2.2 * occ);
  }

  /* ---------------- camera ---------------- */
  function rayDir(S, sx, sy, aspect) {   // sx, sy in -1..1 (y up)
    const c = S.cam, f = 1 / Math.tan(c.fov / 2);
    return norm(add(add(mul(c.fw, f), mul(c.right, sx * aspect)), mul(c.up, sy)));
  }
  /* World point → full-frame screen coordinates (W × H). Returns [x, y, depth] or null behind camera. */
  function project(S, p, W = 1920, H = 1080) {
    const c = S.cam, d = sub(p, c.pos), z = dot(d, c.fw);
    if (z <= 0.01) return null;
    const f = 1 / Math.tan(c.fov / 2), aspect = W / H;
    const x = dot(d, c.right) / z * f / aspect, y = dot(d, c.up) / z * f;
    return [(x + 1) / 2 * W, (1 - y) / 2 * H, z];
  }

  /* ---------------- G-buffer + shading ---------------- */
  let gcache = null;
  /* Primary rays for time t at w × h. Cached for the last (t, w, h), so a film can shade the
     same frame twice (split screens) for the price of one trace. */
  function gbuffer(t, w = 800, h = 450) {
    if (gcache && gcache.t === t && gcache.w === w && gcache.h === h) return gcache;
    const S = scene(t), n = w * h, aspect = w / h;
    const id = new Uint8Array(n), depth = new Float32Array(n);
    const P3 = new Float32Array(n * 3), N3 = new Float32Array(n * 3), D3 = new Float32Array(n * 3);
    const ro = S.cam.pos;
    for (let y = 0; y < h; y++) {
      const sy = 1 - (y + 0.5) / h * 2;
      for (let x = 0; x < w; x++) {
        const i = y * w + x, sx = (x + 0.5) / w * 2 - 1, rd = rayDir(S, sx, sy, aspect);
        D3[i * 3] = rd[0]; D3[i * 3 + 1] = rd[1]; D3[i * 3 + 2] = rd[2];
        const r = trace(ro, rd, S);
        id[i] = r.id;
        if (r.hit) {
          depth[i] = r.t;
          const nn = normal(r.p, r.id, S);
          P3[i * 3] = r.p[0]; P3[i * 3 + 1] = r.p[1]; P3[i * 3 + 2] = r.p[2];
          N3[i * 3] = nn[0]; N3[i * 3 + 1] = nn[1]; N3[i * 3 + 2] = nn[2];
        } else depth[i] = Infinity;
      }
    }
    gcache = { t, w, h, S, id, depth, P3, N3, D3 };
    return gcache;
  }

  /* Edge antialiasing: pixels where the hit object changes (silhouettes) are re-traced with four
     rotated-grid sub-samples, each shaded by the look, and averaged. About 3% of a frame. */
  const AA = [[-0.125, -0.375], [0.375, -0.125], [0.125, 0.375], [-0.375, 0.125]];
  function edgeAA(G, shade, rgb, g) {
    const { w, h, S } = G, ids = G.id, aspect = w / h, ro = S.cam.pos;
    const edge = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, a = ids[i];
      if ((x + 1 < w && ids[i + 1] !== a) || (y + 1 < h && ids[i + w] !== a)) { edge[i] = 1; if (x + 1 < w) edge[i + 1] = 1; if (y + 1 < h) edge[i + w] = 1; }
    }
    for (let i = 0; i < w * h; i++) {
      if (!edge[i]) continue;
      const x = i % w, y = (i / w) | 0;
      let r = 0, gg = 0, b = 0;
      for (const [ox, oy] of AA) {
        const sx = (x + 0.5 + ox) / w * 2 - 1, sy = 1 - (y + 0.5 + oy) / h * 2, rd = rayDir(S, sx, sy, aspect), hit = trace(ro, rd, S);
        g.i = i; g.x = x; g.y = y; g.u = (x + 0.5 + ox) / w; g.v = (y + 0.5 + oy) / h; g.d = rd;
        g.id = hit.id; g.hit = hit.hit; g.depth = hit.t; g.p = hit.p; g.n = hit.hit ? normal(hit.p, hit.id, S) : null;
        const c = shade(g, S); r += c[0]; gg += c[1]; b += c[2];
      }
      rgb[i * 3] = r / 4; rgb[i * 3 + 1] = gg / 4; rgb[i * 3 + 2] = b / 4;
    }
  }

  const cvCache = {};
  function surface(w, h) {
    const k = w + 'x' + h;
    if (!cvCache[k]) { const cv = MG.offscreen(w, h); cvCache[k] = { cv, cx: cv.getContext('2d'), img: null }; cvCache[k].img = cvCache[k].cx.createImageData(w, h); }
    return cvCache[k];
  }

  /* Shade a G-buffer into an offscreen canvas. shade(g, S) gets one sample object per pixel:
       g.hit, g.id, g.p, g.n, g.d (view ray), g.depth, g.x, g.y (pixel), g.u, g.v (0..1 screen), g.i (index)
     and returns [r, g, b] in 0..1 (values above 1 are clipped). post(rgb, G) may then edit the
     Float32Array rgb (3 per pixel) in place before it is written out. Returns the canvas. */
  function shadeBuffer(G, shade, post) {
    const { w, h, S } = G, n = w * h, rgb = new Float32Array(n * 3);
    const g = { hit: false, id: 255, p: null, n: null, d: null, depth: 0, x: 0, y: 0, u: 0, v: 0, i: 0 };
    for (let i = 0; i < n; i++) {
      const id = G.id[i];
      g.i = i; g.x = i % w; g.y = (i / w) | 0; g.u = (g.x + 0.5) / w; g.v = (g.y + 0.5) / h;
      g.id = id; g.hit = id !== 255; g.depth = G.depth[i];
      g.d = [G.D3[i * 3], G.D3[i * 3 + 1], G.D3[i * 3 + 2]];
      if (g.hit) { g.p = [G.P3[i * 3], G.P3[i * 3 + 1], G.P3[i * 3 + 2]]; g.n = [G.N3[i * 3], G.N3[i * 3 + 1], G.N3[i * 3 + 2]]; }
      else { g.p = null; g.n = null; }
      const c = shade(g, S);
      rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2];
    }
    if (G.aa !== false) edgeAA(G, shade, rgb, g);
    if (post) post(rgb, G);
    const sf = surface(w, h), d = sf.img.data;
    for (let i = 0; i < n; i++) {
      d[i * 4] = clamp(rgb[i * 3]) * 255; d[i * 4 + 1] = clamp(rgb[i * 3 + 1]) * 255; d[i * 4 + 2] = clamp(rgb[i * 3 + 2]) * 255; d[i * 4 + 3] = 255;
    }
    sf.cx.putImageData(sf.img, 0, 0);
    return sf.cv;
  }

  /* Render the look for time t to the full frame (or to opts.rect = [x, y, w, h]).
     opts: res [w, h] (default [800, 450]), post, rect, aa (false skips edge antialiasing). Returns { G, S }. */
  function render(c, t, W, H, shade, opts = {}) {
    const [w, h] = opts.res || [800, 450];
    const G = gbuffer(t, w, h); G.aa = opts.aa; const cv = shadeBuffer(G, shade, opts.post);
    const [rx, ry, rw, rh] = opts.rect || [0, 0, W, H];
    c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(cv, rx, ry, rw, rh); c.restore();
    return { G, S: G.S };
  }

  /* ---------------- colour helpers ---------------- */
  const mix3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const aces = x => clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14));
  const tone = (c, exp = 1) => [aces(c[0] * exp), aces(c[1] * exp), aces(c[2] * exp)];
  const luma = c => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const albedo = id => (id === 1 ? P.tok : id === 2 ? P.sph : id === 3 ? P.cube : P.floor);
  /* A neutral reference shading — key light with soft shadow, sky fill, AO — so every film can
     show its look against the same plain render. Floor fades into the backdrop with distance. */
  const KEY = norm([-0.55, 0.85, 0.5]), FILL = norm([0.8, 0.25, 0.55]);
  /* Backdrop colour (display space) and the floor's fade into it, so the floor meets the
     backdrop without a visible horizon, like a studio cyclorama. Looks can reuse both. */
  const BG = [0.925, 0.906, 0.871];
  function floorFade(c, g, bg = BG) {
    const far = clamp((g.depth - 6) / 24), low = 1 - clamp(-g.d[1] / 0.16);   // distance, and closeness to the horizon
    const u = Math.max(far, low * low);
    return mix3(c, bg, u * u * (3 - 2 * u));
  }
  function plain(g, S) {
    if (!g.hit) return BG;
    const a = albedo(g.id), n = g.n;
    const dif = Math.max(0, dot(n, KEY)) * shadow(add(g.p, mul(n, 0.01)), KEY, S, 12);
    const occ = ao(g.p, n, S), sky = 0.55 + 0.45 * n[1], fill = Math.max(0, dot(n, FILL)) * 0.35;
    const k = 1.05 * dif + (0.42 * sky + fill) * occ;
    const c = tone([a[0] * k, a[1] * k, a[2] * k], 1.3);
    return g.id === 0 ? floorFade(c, g) : c;
  }

  /* ---------------- caption + bed ---------------- */
  /* Caption, identical in every look film: same layout as the Technique Atlas caption with the
     RENDERING LOOKS series label. o: name, cat, plus the optional curve options of TK.caption.
     o.dark: light text for dark frames. */
  function caption(c, t, W, H, o) {
    const TK = MG.TK;
    if (o.dark) {
      c.save();
      const gr = c.createLinearGradient(0, H - 260, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)');
      c.fillStyle = gr; c.fillRect(0, H - 260, W, 260); c.restore();
    }
    TK.caption(c, t, W, H, { ...o, series: 'RENDERING LOOKS' });
  }

  /* Shared score bed: 84 BPM, a slow breathing pad over a low pulse — calmer than the
     Technique Atlas bed, since nothing in these films moves except the camera. */
  const BPM = 84, BEAT = 60 / BPM;
  function bed(A, o = {}) {
    const g = o.g ?? 1, until = o.until ?? 10;
    for (let b = 0; b * BEAT < until; b++) {
      const t = b * BEAT;
      if (b % 2 === 0) A.kick(t, 0.22 * g, { f: 90, f2: 38, dur: 0.5 });
      A.hat(t + BEAT / 2, 0.02 * g);
    }
    const prog = [[45, 52, 60, 64], [41, 48, 57, 60], [48, 55, 64, 67], [43, 50, 59, 62]];
    for (let i = 0; i * 2.5 < until; i++) A.chord(i * 2.5, prog[i % 4], { type: 'triangle', dur: 2.7, g: 0.03 * g, a: 0.8, lp: 1100, rev: 0.6, width: 0.8 });
  }

  /* Small mono label helper with the family's look. */
  function label(c, s, x, y, o = {}) {
    MG.text(c, s, x, y, { font: MG.TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
  }

  MG.LK = {
    V, P, fonts, TOK, SPH, CUBE, TARGET, KEY, BPM, BEAT,
    scene, map, map2, sdToken, sdCube, sdSphere, trace, traceInside, normal, shadow, ao,
    rayDir, project, gbuffer, shadeBuffer, render,
    mix3, tone, aces, luma, albedo, plain, BG, FILL, floorFade, caption, bed, label,
  };
})();
