/* batch l7 — Rendering Looks · Material, Light: lookbrushed · lookneon · lookovercast.
   lookbrushed (brushed metal: a Ward anisotropic specular with a tangent field per object —
   circular brushing round the Token's centre, latitude grooves on a spun-steel sphere, linear
   grain on the cube — so highlights stretch across the grooves; the reflection is blurred along
   the bitangent in screen space, the anisotropy ratio steps on the beat, and a split sets it
   against an isotropic metal of the same mean roughness; the tangent field is an inset) ·
   lookneon (a night still life lit only by three neon tubes: analytic line-light irradiance with
   inverse-square falloff per element, a soft shadow toward each tube, representative-point
   highlights, coloured spill, and a wet asphalt floor whose traced reflections are stretched
   vertically; tubes solo on the beat beside a falloff plot) ·
   lookovercast (soft skylight from a cloudy dome: a CIE overcast sky integrated with cosine-
   weighted shadow rays, so there is no key and only soft contact shadows; the ray count builds
   up on the beat, a fisheye inset shows what the sky looks like from a probe point, and a split
   against the hard-sun version reads out the measured contrast ratio of each side). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, hash, midi, text } = MG;
  const LK = MG.LK, V = LK.V, P = LK.P, KEY = LK.KEY, BEAT = LK.BEAT, PI = Math.PI;
  const { add, sub, mul, dot, cross, len, norm, reflect } = V;
  const mix3 = LK.mix3;

  /* ---------------- shared helpers ---------------- */
  const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const box = (x, half, e) => smooth(-half - e, -half + e, x) * (1 - smooth(half - e, half + e, x));
  const HALO = 'rgba(236,232,223,0.88)', HALO_D = 'rgba(8,9,12,0.82)';
  const DIM = '#5d5a54', DIM_D = 'rgba(236,232,223,0.66)';
  const label = (c, s, x, y, o = {}) => text(c, s, x, y, { font: MG.TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || (o.dark ? DIM_D : P.mute), align: o.align || 'left', weight: o.weight || 400, base: o.base, stroke: o.halo === false ? undefined : (o.dark ? HALO_D : HALO), lw: 5 });
  const ink = dark => (dark ? P.paper : P.ink);
  function tag(c, s, x, y, on = 1, dark = false, accent = P.accent) {
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: ink(dark), weight: 700, size: 20, dark });
    c.restore();
  }
  /* Leader-line label pointing at a world point: dot on the object, elbow line, title + note. */
  function callout(c, S, W, H, p, dx, dy, title, sub, on, dark = false) {
    if (on <= 0.001) return;
    const q = LK.project(S, p, W, H); if (!q) return;
    const x1 = q[0] + dx, y1 = q[1] + dy, dir = dx >= 0 ? 1 : -1, x2 = x1 + dir * 26;
    c.save(); c.globalAlpha *= on; c.lineCap = 'round';
    const path = () => { c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(x1, y1); c.lineTo(x2, y1); c.stroke(); };
    c.strokeStyle = dark ? HALO_D : HALO; c.lineWidth = 5; path();
    c.strokeStyle = ink(dark); c.lineWidth = 1.6; path();
    c.fillStyle = dark ? P.ink : P.paper; c.beginPath(); c.arc(q[0], q[1], 8, 0, TAU); c.fill();
    c.fillStyle = P.accent; c.beginPath(); c.arc(q[0], q[1], 5, 0, TAU); c.fill();
    const al = dir > 0 ? 'left' : 'right';
    label(c, title, x2 + dir * 10, y1 + 6, { align: al, color: ink(dark), weight: 700, size: 18, ls: 2, dark });
    if (sub) label(c, sub, x2 + dir * 10, y1 + 30, { align: al, size: 14, ls: 1.5, color: dark ? DIM_D : DIM, dark });
    c.restore();
  }
  /* The split line between two versions of the frame. */
  function wipeLine(c, sx, W, H, left, right, on = 1, dark = false, ly = 330) {
    if (on <= 0.001 || sx <= 0.0005 || sx >= 0.9995) return;
    const x = sx * W;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = dark ? HALO_D : HALO; c.fillRect(x - 3, 0, 6, H);
    c.fillStyle = P.accent; c.fillRect(x - 1.5, 0, 3, H);
    if (x > 300) label(c, left + '  ◀', x - 16, ly, { align: 'right', color: ink(dark), weight: 700, size: 16, dark });
    if (x < W - 300) label(c, '▶  ' + right, x + 16, ly, { color: ink(dark), weight: 700, size: 16, dark });
    c.restore();
  }
  function frameBox(c, x, y, w, h, title, dark = false) {
    c.fillStyle = dark ? 'rgba(0,0,0,0.35)' : 'rgba(23,24,28,0.18)'; c.fillRect(x + 6, y + 6, w, h);
    return () => {
      c.strokeStyle = dark ? 'rgba(236,232,223,0.7)' : P.ink; c.lineWidth = 1.5; c.strokeRect(x - 0.75, y - 0.75, w + 1.5, h + 1.5);
      label(c, title, x, y - 12, { size: 14, ls: 2, color: ink(dark), weight: 700, dark });
    };
  }
  function inset(c, t, W, H, rect, title, shade, on, dark = false, res = [192, 108]) {
    if (on <= 0.001) return;
    const [x, y, w, h] = rect;
    c.save(); c.globalAlpha *= on;
    const fin = frameBox(c, x, y, w, h, title, dark);
    LK.render(c, t, W, H, shade, { res, rect: [x, y, w, h], aa: false });
    fin();
    c.restore();
  }
  const pulse = (t, t0, t1, f = 0.35) => seg(t, t0, t0 + f) * (1 - seg(t, t1 - f, t1));
  const rgbs = (col, a = 1) => `rgba(${Math.round(clamp(col[0]) * 255)},${Math.round(clamp(col[1]) * 255)},${Math.round(clamp(col[2]) * 255)},${a})`;
  const toLocal = (M, p) => [M[0] * p[0] + M[3] * p[1] + M[6] * p[2], M[1] * p[0] + M[4] * p[1] + M[7] * p[2], M[2] * p[0] + M[5] * p[1] + M[8] * p[2]];
  const toWorld = (M, p) => [M[0] * p[0] + M[1] * p[1] + M[2] * p[2], M[3] * p[0] + M[4] * p[1] + M[5] * p[2], M[6] * p[0] + M[7] * p[1] + M[8] * p[2]];
  const tokPt = (S, x, y, z) => add(S.tok.c, toWorld(S.tok.M, [x, y, z]));
  const cubePt = (x, y, z) => add(LK.CUBE.c, toWorld(MG.LK.scene(0).cubeM, [x, y, z]));
  const vnoise = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i * 1.37 + 0.11), hash(i * 1.37 + 1.48), u); };
  function vnoise2(x, y) {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const h = (a, b) => hash(a * 157.31 + b * 113.97);
    return lerp(lerp(h(i, j), h(i + 1, j), ux), lerp(h(i, j + 1), h(i + 1, j + 1), ux), uy);
  }
  /* Edge-aware directional blur in place: each flagged pixel averages taps along its own screen
     direction (dx, dy) over ±L pixels, only from neighbours with the same id that are flagged too. */
  function dirBlur(rgb, G, DX, DY, L) {
    const { w, h } = G, ids = G.id, src = rgb.slice();
    for (let i = 0; i < w * h; i++) {
      const l = L[i]; if (l < 0.75) continue;
      const x = i % w, y = (i / w) | 0, id = ids[i];
      if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1 || ids[i - 1] !== id || ids[i + 1] !== id || ids[i - w] !== id || ids[i + w] !== id) continue;   // keep antialiased silhouettes
      const dx = DX[i], dy = DY[i], n = Math.min(24, Math.ceil(l));
      let r = 0, g = 0, b = 0, ws = 0;
      for (let k = -n; k <= n; k++) {
        const xx = Math.round(x + dx * k * l / n), yy = Math.round(y + dy * k * l / n);
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const j = yy * w + xx; if (ids[j] !== id || L[j] < 0.75) continue;
        const wt = 1 - Math.abs(k) / (n + 1);
        r += src[j * 3] * wt; g += src[j * 3 + 1] * wt; b += src[j * 3 + 2] * wt; ws += wt;
      }
      if (ws > 0) { rgb[i * 3] = r / ws; rgb[i * 3 + 1] = g / ws; rgb[i * 3 + 2] = b / ws; }
    }
  }
  const bufs = {};
  function buf(name, n) { if (!bufs[name] || bufs[name].length !== n) bufs[name] = new Float32Array(n); return bufs[name]; }
  const softClip = c => c.map(v => (v < 0.82 ? v : 0.82 + 0.18 * (1 - Math.exp(-(v - 0.82) / 0.18))));

  /* =====================================================================
     BRUSHED METAL — the grooves left by brushing or spinning a metal
     surface scatter light across them but not along them, so a highlight
     becomes a streak perpendicular to the grain. Each object gets a
     tangent field T along its grooves: circular round the Token's centre
     (spun / turned metal), latitude rings on the sphere (a spun steel
     ball), straight grain on the cube. Ward's anisotropic BRDF uses two
     roughnesses, αT along the grooves and αB across them (B = N × T):
       f = exp(−((H·T/αT)² + (H·B/αB)²) / (H·N)²) / (4π αT αB √(N·L N·V))
     evaluated for the studio's softboxes, plus a reflection traced once
     and blurred along the screen-space bitangent. The ratio αB:αT steps
     on the beat at constant mean roughness, then a split sets it against
     isotropic metal (αT = αB) with the same mean.
     ===================================================================== */
  const BR = { r: 0.16, W1: [1.0, 2.6], W2: [6.8, 7.9] };
  const KSTEP = [[0, 8], [4.4, 2], [4.4 + BEAT, 5], [4.4 + 2 * BEAT, 12], [4.4 + 3 * BEAT, 28], [6.8, 10]];
  function kAt(t) {
    let lk = Math.log(KSTEP[0][1]);
    for (let i = 1; i < KSTEP.length; i++) { const [t0, v] = KSTEP[i]; if (t >= t0) lk = lerp(Math.log(KSTEP[i - 1][1]), Math.log(v), E.outC(seg(t, t0, t0 + 0.25))); }
    return Math.exp(lk);
  }
  const BR_F0 = { 1: [0.97, 0.5, 0.24], 2: [0.67, 0.67, 0.69], 3: [0.36, 0.52, 0.95] };
  const azel = (az, el) => [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
  // [direction, irradiance, angular half-size] of the studio's lights, as seen by the Ward lobe
  const BR_L = [[KEY, 2.3, 0.14], [azel(-0.95, 0.36), 1.4, 0.06], [azel(1.05, 0.32), 1.1, 0.05], [azel(0, 0.3), 0.6, 0.1]];
  /* Studio environment for the blurred reflection: paper backdrop at the horizon, a dark ceiling
     and the light boxes softened (their sharp cores come from the Ward lobe instead). */
  const KR = norm(cross(KEY, [0, 1, 0])), KU = cross(KR, KEY);
  function envBase(d) {
    const y = d[1], az = Math.atan2(d[0], d[2]), el = Math.asin(clamp(y, -1, 1));
    const DK = [0.08, 0.085, 0.1], back = smooth(-0.35, 0.35, d[2]);
    const c = y >= 0 ? mix3(mix3(LK.BG, DK, smooth(0.04, 0.62, y)), mix3(LK.BG, DK, smooth(0, 0.16, y)), back) : mix3(LK.BG, [0.5, 0.48, 0.45], smooth(0, 0.35, -y));
    let L = 0;
    if (dot(d, KEY) > 0.4) L += 0.9 * box(dot(d, KR), 0.24, 0.12) * box(dot(d, KU), 0.17, 0.12);
    L += 0.6 * box(az + 0.95, 0.075, 0.08) * box(el - 0.36, 0.36, 0.1) + 0.45 * box(az - 1.05, 0.06, 0.08) * box(el - 0.32, 0.28, 0.1);
    return [c[0] + L, c[1] + L, c[2] + L * 1.02];
  }
  // what a reflection ray sees when it hits a non-mirror surface (the floor; key + sky, floor shadow)
  function secShade(h, rd, S, d0) {
    const n = LK.normal(h.p, h.id, S), a = LK.albedo(h.id);
    const dif = Math.max(0, dot(n, KEY)) * (h.id === 0 ? LK.shadow(add(h.p, mul(n, 0.01)), KEY, S, 12) : 1);
    const k = 1.05 * dif + 0.42 * (0.55 + 0.45 * n[1]) + Math.max(0, dot(n, LK.FILL)) * 0.35;
    const c = LK.tone([a[0] * k, a[1] * k, a[2] * k], 1.3);
    return h.id === 0 ? LK.floorFade(c, { depth: d0 + h.t, d: rd }) : c;
  }
  /* Tangent (groove direction) and the across-groove coordinate s for the groove texture. */
  function brFrame(id, p, n, S) {
    let T, s;
    if (id === 1) {
      const q = toLocal(S.tok.M, sub(p, S.tok.c)), nl = toLocal(S.tok.M, n);
      if (Math.abs(nl[2]) > 0.55) { T = toWorld(S.tok.M, [-q[1], q[0], 0]); s = Math.hypot(q[0], q[1]); }   // the faces: turned round the centre
      else { T = cross(n, toWorld(S.tok.M, [0, 0, 1])); s = q[2] * 1.6; }   // the walls: brushed along the outline
    } else if (id === 2) {
      const d = sub(p, LK.SPH.c); T = [-d[2], 0, d[0]]; s = Math.asin(clamp(d[1] / LK.SPH.r, -1, 1)) * LK.SPH.r;
    } else {
      const q = toLocal(S.cubeM, sub(p, LK.CUBE.c)), nl = toLocal(S.cubeM, n), side = Math.abs(nl[0]) > 0.7;
      T = toWorld(S.cubeM, side ? [0, 0, 1] : [1, 0, 0]); s = side ? q[1] + q[0] : q[1] + q[2];
    }
    T = sub(T, mul(n, dot(T, n)));
    if (len(T) < 0.08) T = cross(n, Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]);
    return { T: norm(T), s };
  }
  const groove = (s, a = 0.44) => 1 - a / 2 + a * (0.5 * vnoise(s * 150) + 0.3 * vnoise(s * 61 + 3.1) + 0.2 * vnoise(s * 23 + 9.7));
  /* Shade one metal pixel. iso: αT = αB = r (and no grooves). bk (blur sink) gets the
     screen-space bitangent and blur lengths for the post pass. pass 1: tangent-field view. */
  function brushed(g, S, k, iso, bk, pass = 0) {
    const id = g.id, n = g.n, v = mul(g.d, -1), ndv = Math.max(1e-3, dot(n, v));
    const { T, s } = brFrame(id, g.p, n, S), Bv = cross(n, T);
    if (pass === 1) {
      const q0 = LK.project(S, g.p, 800, 450), q1 = LK.project(S, add(g.p, mul(T, 0.05)), 800, 450);
      const ang = ((Math.atan2(q1[1] - q0[1], q1[0] - q0[0]) % PI) + PI) % PI / PI, sh = 0.45 + 0.55 * ndv;
      const hue = [0.5 + 0.5 * Math.cos(TAU * ang), 0.5 + 0.5 * Math.cos(TAU * (ang - 1 / 3)), 0.5 + 0.5 * Math.cos(TAU * (ang - 2 / 3))];
      return hue.map(x => (0.25 + 0.6 * x) * sh);
    }
    const sk = Math.sqrt(k), at = iso ? BR.r : BR.r / sk, ab = iso ? BR.r : BR.r * sk;
    const F0 = BR_F0[id], fr = Math.pow(1 - ndv, 5), F = [F0[0] + (1 - F0[0]) * fr, F0[1] + (1 - F0[1]) * fr, F0[2] + (1 - F0[2]) * fr];
    // reflection: blurred environment along B, plus one traced ray for the scene
    const R = reflect(g.d, n);
    let er = 0, eg = 0, eb = 0;
    for (const o of [-0.85, 0, 0.85]) {
      let dir = norm(add(R, add(mul(Bv, ab * o), mul(T, at * o * 0.3))));
      if (dot(dir, n) < 0.02) dir = R;
      const e = envBase(dir); er += e[0]; eg += e[1]; eb += e[2];
    }
    let refl = [er / 3, eg / 3, eb / 3];
    const h = LK.trace(add(g.p, mul(n, 0.004)), R, S);
    if (h.hit) {
      let col;
      if (h.id === 0) col = secShade(h, R, S, g.depth);
      else { const n2 = LK.normal(h.p, h.id, S), e2 = envBase(reflect(R, n2)), f2 = BR_F0[h.id]; col = [e2[0] * f2[0], e2[1] * f2[1], e2[2] * f2[2]]; }
      refl = mix3(refl, col, 0.8);
    }
    // Ward anisotropic lobe for each light box
    let sp = 0;
    for (const [L, Ei, sz] of BR_L) {
      const ndl = dot(n, L); if (ndl <= 0) continue;
      const hv = norm(add(L, v)), hn = dot(hv, n); if (hn <= 0) continue;
      const ax = Math.hypot(at, sz), ay = Math.hypot(ab, sz), x = dot(hv, T) / ax, y = dot(hv, Bv) / ay;
      sp += Ei * ndl * Math.exp(-(x * x + y * y) / (hn * hn)) / (4 * PI * ax * ay * Math.sqrt(ndl * ndv));
    }
    const sh = LK.shadow(add(g.p, mul(n, 0.01)), KEY, S, 14), spk = sp * (0.35 + 0.65 * sh);
    if (bk) {
      const q0 = LK.project(S, g.p, bk.w, bk.h), q1 = LK.project(S, add(g.p, mul(Bv, 0.05)), bk.w, bk.h);
      let dx = q1[0] - q0[0], dy = q1[1] - q0[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const sc = bk.w / 800;
      bk.DX[g.i] = dx; bk.DY[g.i] = dy; bk.L[g.i] = Math.min(22, ab * 26 * sc); bk.L2[g.i] = at * 26 * sc;
      bk.M[g.i] = iso ? 1 : groove(s, id === 3 ? 0.2 : id === 2 ? 0.32 : 0.44);
    }
    return softClip([F[0] * (refl[0] + spk), F[1] * (refl[1] + spk), F[2] * (refl[2] + spk)]);
  }
  // tangent glyphs over the tangent-field inset: short strokes along T sampled from the main G-buffer
  function tangentGlyphs(c, G, S, x0, y0, w, h, W, H) {
    const step = 22;
    c.save(); c.lineCap = 'round';
    for (let y = step / 2; y < G.h; y += step) for (let x = step / 2; x < G.w; x += step) {
      const i = (y | 0) * G.w + (x | 0), id = G.id[i];
      if (id < 1 || id > 3) continue;
      const p = [G.P3[i * 3], G.P3[i * 3 + 1], G.P3[i * 3 + 2]], n = [G.N3[i * 3], G.N3[i * 3 + 1], G.N3[i * 3 + 2]];
      const { T } = brFrame(id, p, n, S), a = LK.project(S, sub(p, mul(T, 0.09)), W, H), b = LK.project(S, add(p, mul(T, 0.09)), W, H);
      if (!a || !b) continue;
      const X = q => x0 + q[0] / W * w, Y = q => y0 + q[1] / H * h;
      c.strokeStyle = 'rgba(12,12,14,0.85)'; c.lineWidth = 3; c.beginPath(); c.moveTo(X(a), Y(a)); c.lineTo(X(b), Y(b)); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(X(a), Y(a)); c.lineTo(X(b), Y(b)); c.stroke();
    }
    c.restore();
  }
  const BR_INS = [1920 - 72 - 400, 96, 400, 225];

  MG.film({
    id: 'lookbrushed', dur: 10, poster: 8.6,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Brushed Metal', sub: 'Anisotropic highlights, stretched across the grain', era: '1992 —',
      origin: 'Brushed, spun and turned metal reflects light anisotropically: the fine grooves scatter it across their direction and hardly at all along it, so highlights become streaks at right angles to the grain. James Kajiya treated anisotropic surfaces in 1985, and Gregory Ward’s 1992 SIGGRAPH paper “Measuring and Modeling Anisotropic Reflection” gave rendering the compact elliptical-Gaussian lobe with two roughnesses that is still the textbook model; Michael Ashikhmin and Peter Shirley’s anisotropic Phong model (2000) followed. Modern physically based shaders (Disney’s principled BRDF, 2012, and its descendants) expose the same idea as an “anisotropic” slider and a tangent direction.',
      works: 'Measuring and Modeling Anisotropic Reflection (Gregory Ward, SIGGRAPH 1992) · An Anisotropic Phong BRDF Model (Michael Ashikhmin & Peter Shirley, 2000) · Physically Based Shading at Disney (Brent Burley, SIGGRAPH 2012; the anisotropic parameter of the principled BRDF)',
      tech: ['Ward anisotropic lobe, αT ≠ αB', 'Per-object tangent field', 'Reflection blurred along the bitangent'],
      accent: '#9fb0c2',
      motionDNA: 'The shared 10 s orbit drags the streaks across the metal: on the Token they swing round its centre like a spun disc, on the sphere they run pole to pole, on the cube across the grain. A wipe turns the plain materials to brushed metal; callouts and the tangent-field inset explain the grooves; the anisotropy ratio αB:αT then steps 2 → 5 → 12 → 28 on the beat at constant mean roughness, and a split slides in from the right to compare against isotropic metal of the same mean roughness.',
      visualDNA: 'Brushed aluminium in three anodised tints — orange Token, bare steel sphere, blue cube — in the paper studio with a dark ceiling: long soft streaks of softbox light, fine concentric rings and straight grain in the metal, blurred reflections of the floor. An orange split line, leader-line labels, a ratio readout with a log ruler, and a hue-coded tangent-field inset with white groove strokes.',
      transitions: 'Wipe from plain to brushed metal; stepped anisotropy ratio; split to isotropic metal',
      implementation: ['Ward (1992) anisotropic BRDF with per-surface tangent frames', 'Tangent / anisotropy maps as in Disney principled and Arnold standard surface', 'Canvas 2D + SDF tracer (js/look-kit.js): analytic Ward lobes for four softboxes, one LK.trace reflection, an edge-aware blur along the projected bitangent, groove noise in the across-grain coordinate'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const s1 = E.ioC(seg(t, BR.W1[0], BR.W1[1])), s2 = 1 - 0.48 * E.ioC(seg(t, BR.W2[0], BR.W2[1])), k = kAt(t);
      const res = [800, 450], n = res[0] * res[1];
      const bk = { w: res[0], h: res[1], DX: buf('bdx', n), DY: buf('bdy', n), L: buf('bl', n), L2: buf('bl2', n), M: buf('bm', n) };
      bk.L.fill(0); bk.L2.fill(0); bk.M.fill(1);
      const shade = (g, S) => {
        if (g.u >= s1 || !g.hit || g.id === 0) return LK.plain(g, S);
        return brushed(g, S, k, g.u >= s2, bk);
      };
      const post = (rgb, G) => {
        dirBlur(rgb, G, bk.DX, bk.DY, bk.L);
        const PX = buf('bpx', n), PY = buf('bpy', n);
        for (let i = 0; i < n; i++) { PX[i] = -bk.DY[i]; PY[i] = bk.DX[i]; }
        dirBlur(rgb, G, PX, PY, bk.L2);
        for (let i = 0; i < n; i++) { const m = bk.M[i]; if (m !== 1) { rgb[i * 3] *= m; rgb[i * 3 + 1] *= m; rgb[i * 3 + 2] *= m; } }
      };
      const { S, G } = LK.render(c, t, W, H, shade, { res, post });
      wipeLine(c, s1, W, H, 'BRUSHED', 'PLAIN');
      wipeLine(c, s2, W, H, 'ANISOTROPIC', 'ISOTROPIC', seg(t, BR.W2[0], BR.W2[0] + 0.2), false, 150);
      // what the grooves do
      const on1 = pulse(t, 2.7, 6.6, 0.4);
      callout(c, S, W, H, tokPt(S, -0.5, -0.5, 0.23), -300, -150, 'CIRCULAR BRUSHING', 'grooves round the centre → radial streaks', on1 * seg(t, 2.7, 3.1));
      callout(c, S, W, H, add(LK.SPH.c, [0.45, -0.2, 0.5]), 150, 190, 'SPUN STEEL', 'latitude grooves · streak runs pole to pole', on1 * seg(t, 3.2, 3.6));
      callout(c, S, W, H, cubePt(0.15, -0.1, 0.5), -170, 200, 'LINEAR GRAIN', 'highlight stretches across it, not along', on1 * seg(t, 3.7, 4.1));
      // tangent field inset
      const iOn = pulse(t, 2.9, 6.6, 0.35);
      if (iOn > 0) {
        const [x, y, w, h] = BR_INS;
        inset(c, t, W, H, BR_INS, 'TANGENT FIELD  T  ·  GROOVE DIRECTION', (g, S2) => (g.hit && g.id > 0 ? brushed(g, S2, k, false, null, 1) : [0.13, 0.13, 0.14]), iOn);
        c.save(); c.globalAlpha *= iOn; tangentGlyphs(c, G, S, x, y, w, h, W, H); c.restore();
        label(c, 'hue = screen angle of T  ·  B = N × T', x, y + h + 26, { size: 13, ls: 1.5, color: DIM, });
      }
      // top-left: stage + ratio readout
      if (t < BR.W1[0] + 0.2) tag(c, 'REFERENCE  ·  PLAIN MATERIALS', 72, 80, seg(t, 0.1, 0.5));
      else if (t < 4.3) tag(c, 'ANISOTROPIC METAL  ·  WARD LOBE, αT ≠ αB', 72, 80);
      else if (t < BR.W2[0]) tag(c, 'ANISOTROPY RATIO  ·  SAME MEAN ROUGHNESS', 72, 80);
      else tag(c, 'ANISOTROPIC  vs  ISOTROPIC  ·  r = 0.16', 72, 80);
      const rOn = seg(t, 1.8, 2.2);
      if (rOn > 0) {
        c.save(); c.globalAlpha *= rOn;
        const x = 98, y = 136, sk = Math.sqrt(k);
        label(c, 'ANISOTROPY  αB : αT', x, y, { size: 15, ls: 3, color: DIM, weight: 700 });
        text(c, `${k < 9.95 ? k.toFixed(1) : Math.round(k)} : 1`, x - 2, y + 50, { font: MG.TK.MONO, size: 46, weight: 700, color: P.ink, stroke: HALO, lw: 6 });
        const rw = 420, ry = y + 78, X = v => x + Math.log2(v) / 5 * rw;
        c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(x, ry, rw, 2);
        for (const [v, s] of [[1, 'ISO'], [4, '4'], [16, '16'], [32, '32']]) {
          c.fillStyle = 'rgba(23,24,28,0.45)'; c.fillRect(X(v) - 0.75, ry - 6, 1.5, 14);
          label(c, s, X(v), ry + 26, { size: 12, ls: 1, align: 'center', color: DIM });
        }
        c.fillStyle = P.accent; c.fillRect(x, ry, X(k) - x, 2); c.beginPath(); c.arc(X(k), ry + 1, 7, 0, TAU); c.fill();
        label(c, `αT ${(BR.r / sk).toFixed(3)}  ·  αB ${(BR.r * sk).toFixed(3)}  ·  √(αT αB) = ${BR.r.toFixed(2)}`, x, ry + 58, { size: 14, ls: 1.5, color: P.ink, weight: 700 });
        c.restore();
      }
      if (t > BR.W2[1] - 0.3) {
        const on = seg(t, BR.W2[1] - 0.3, BR.W2[1] + 0.2), xs = s2 * W;
        c.save(); c.globalAlpha *= on;
        label(c, 'streaks ⟂ grooves', xs - 30, 980 - 60, { align: 'right', size: 15, ls: 1.5, color: P.ink, weight: 700 });
        label(c, 'round highlights, same r', xs + 30, 980 - 60, { size: 15, ls: 1.5, color: P.ink, weight: 700 });
        c.restore();
      }
      LK.caption(c, t, W, H, { name: 'Brushed Metal', cat: 'Material', curve: u => Math.log2(kAt(u * 10)) / 5, span: [0, 10], lo: -0.1, hi: 1.1, curveLabel: 'LOG₂ αB:αT / TIME' });
    },
    score(A) {
      LK.bed(A);
      // the wipe: a long brushed hiss
      A.whoosh(BR.W1[0], BR.W1[1] - BR.W1[0], { f1: 2500, f2: 9000, q: 4, g: 0.08, swell: 0.5, rev: 0.4, pan: -0.3 });
      A.noise(BR.W1[0] + 0.2, { type: 'bandpass', f: 5200, q: 8, dur: 1.2, g: 0.04 });
      A.bell(BR.W1[1], midi(76), { g: 0.08, dur: 2.2, ratios: [1, 2.76, 5.4, 8.9], rev: 0.6 });
      [2.7, 3.2, 3.7].forEach((t, i) => A.osc(t, { f: midi(88 + [0, 3, 7][i]), dur: 0.22, g: 0.035, rev: 0.4, pan: (i - 1) * 0.4 }));
      // ratio steps: a bowed metal tone that widens with each step
      KSTEP.slice(1, 5).forEach(([t], i) => {
        A.noise(t, { type: 'bandpass', f: 3000 + i * 1400, q: 6 - i, dur: 0.3 + i * 0.12, g: 0.06 });
        A.bell(t, midi(69 + [0, 5, 7, 12][i]), { g: 0.05, dur: 1.2, ratios: [1, 2.0, 3.0], rev: 0.5, pan: -0.3 + i * 0.2 });
      });
      A.whoosh(BR.W2[0], BR.W2[1] - BR.W2[0], { f1: 6000, f2: 900, q: 1.5, g: 0.08, swell: 0.6, rev: 0.4, pan: 0.4 });
      A.chord(BR.W2[1], [52, 59, 64, 71], { type: 'triangle', dur: 2.0, g: 0.035, a: 0.05, lp: 2400, rev: 0.6, width: 0.8 });
      A.bell(BR.W2[1] + 0.02, midi(83), { g: 0.06, dur: 1.8, ratios: [1, 2.76, 5.4], rev: 0.7 });
    },
  });

  /* =====================================================================
     NEON NIGHT — the studio at night, lit only by three neon tubes placed
     around the still life. Each tube is a line light: its irradiance at a
     point is the integral of I·(N·l)/d² along the segment, evaluated in
     closed form and clipped to the point's hemisphere, so every element
     falls off with the inverse square of distance. One soft shadow ray
     per tube toward its nearest point; highlights use the tube point
     nearest the reflected ray (Karis's representative point). The floor
     is wet asphalt: a traced reflection per pixel, roughened by the
     surface and stretched vertically in post, puddles mirror-sharp. The
     tubes are drawn analytically (ray vs capsule) with a halo, in the
     primary and the reflected rays. Tubes stutter on, then solo on the
     beat so each one's coloured spill reads on its own.
     ===================================================================== */
  const NE = { W: [0.8, 2.4], SOLO: 5.0 };
  const TUBES = [
    { name: 'PINK', a: [-1.3, 0.3, 1.75], b: [1.2, 0.3, 1.75], col: [1.0, 0.13, 0.5], hex: '#ff2a80', I: 2.2, ign: 0.9 },
    { name: 'CYAN', a: [-3.7, 0.15, 0.0], b: [-3.7, 2.95, 0.0], col: [0.1, 0.78, 1.0], hex: '#1ac6ff', I: 3.2, ign: 1.3 },
    { name: 'AMBER', a: [4.05, 0.15, 1.25], b: [4.05, 2.55, 1.25], col: [1.0, 0.5, 0.1], hex: '#ff8a1a', I: 3.0, ign: 1.7 },
  ];
  TUBES.forEach(T => { T.e = sub(T.b, T.a); T.len = len(T.e); });
  const TUBE_R = 0.05;
  // tube level at time t: stuttered ignition, then solo on the beat
  function tubeLevel(k, t) {
    const T = TUBES[k];
    let on = t < T.ign ? 0 : t < T.ign + 0.55 ? (hash(Math.floor(t * 24) * 3.1 + k * 17.3) > 0.42 ? 1 : 0.08) : 1;
    const s0 = NE.SOLO, s = Math.floor((t - s0) / BEAT);
    if (t >= s0 && s < 3) {
      const st = s0 + s * BEAT, prev = s === 0 ? 1 : (s - 1 === k ? 1 : 0.04), cur = s === k ? 1 : 0.04;
      on *= lerp(prev, cur, E.outC(seg(t, st, st + 0.08)));
    } else if (t >= s0 && s === 3) {
      const st = s0 + 3 * BEAT; on *= lerp(k === 2 ? 1 : 0.04, 1, E.outC(seg(t, st, st + 0.08)));
    }
    return on * (1 + 0.025 * Math.sin(t * TAU * 50 + k));   // a faint mains shimmer
  }
  // closed-form Lambertian irradiance from segment A + s·e (unit intensity per unit length), clipped to N·l ≥ 0
  function lineIrr(p, n, T) {
    const a = sub(T.a, p), e = T.e, na = dot(n, a), ne = dot(n, e);
    let s0 = 0, s1 = 1;
    if (Math.abs(ne) < 1e-9) { if (na <= 0) return 0; } else { const sz = -na / ne; if (ne > 0) s0 = Math.max(s0, sz); else s1 = Math.min(s1, sz); if (s0 >= s1) return 0; }
    const qa = dot(e, e), qb = 2 * dot(a, e), qc = dot(a, a), D = Math.max(4 * qa * qc - qb * qb, 1e-6);
    const F = s => { const q = Math.max(qa * s * s + qb * s + qc, 1e-6), sq = Math.sqrt(q); return (na * 2 * (2 * qa * s + qb) - ne * 2 * (2 * qc + qb * s)) / (D * sq); };
    return Math.max(0, T.len * (F(s1) - F(s0)));
  }
  // closest approach of ray (o, d) to the segment: { t (along ray), s (along segment), dist }
  function raySeg(o, d, T) {
    const w0 = sub(o, T.a), b = dot(d, T.e), c = dot(T.e, T.e), dd = dot(d, w0), ee = dot(T.e, w0), den = c - b * b;
    let s = den > 1e-9 ? (ee - b * dd) / den : 0; s = clamp(s / 1, 0, 1);
    // with |d| = 1: minimise over t for this s, then re-solve s for that t
    let tt = Math.max(0, b * s - dd); s = clamp((dot(T.e, add(o, mul(d, tt))) - dot(T.e, T.a)) / c, 0, 1);
    tt = Math.max(0, dot(sub(add(T.a, mul(T.e, s)), o), d));
    const q = add(T.a, mul(T.e, s)), pr = add(o, mul(d, tt));
    return { t: tt, s, dist: len(sub(q, pr)), q };
  }
  const nearestOnTube = (p, T) => { const s = clamp(dot(sub(p, T.a), T.e) / (T.len * T.len)); return add(T.a, mul(T.e, s)); };
  const NE_BG = [0.012, 0.013, 0.022];
  const neBG = d => mix3([0.03, 0.028, 0.05], NE_BG, smooth(0, 0.35, d[1]));
  const NE_BGT = LK.tone(neBG([0, 0.02, 1]), 1.25);
  /* Tubes along a ray up to distance tMax: returns [r, g, b, alpha] — the tube core (alpha =
     coverage) over a two-scale halo that is added to whatever is behind it. */
  function tubesOnRay(o, d, tMax, lev, d0 = 0) {
    let r = 0, g = 0, b = 0, alpha = 0, cr = 0, cg = 0, cb = 0;
    for (let k = 0; k < 3; k++) {
      if (lev[k] < 0.01) continue;
      const T = TUBES[k], h = raySeg(o, d, T);
      if (h.t <= 0 || h.t > tMax + 0.2) continue;
      const ang = h.dist / Math.max(h.t + d0, 0.1), I = lev[k] * T.I;
      const halo = I * (0.2 * Math.exp(-ang / 0.006) + 0.06 * Math.exp(-ang / 0.03) + 0.014 * Math.exp(-ang / 0.12));
      r += T.col[0] * halo; g += T.col[1] * halo; b += T.col[2] * halo;
      if (h.t < tMax) {
        const pix = (h.t + d0) * 0.0019 + d0 * 0.0012, cov = clamp((TUBE_R + pix - h.dist) / (2 * pix));
        if (cov > alpha) {
          alpha = cov; const core = clamp(1 - h.dist / TUBE_R);
          const hot = mix3(T.col, [1, 1, 1], 0.35 + 0.5 * core);
          cr = hot[0] * 2.4 * lev[k]; cg = hot[1] * 2.4 * lev[k]; cb = hot[2] * 2.4 * lev[k];
          if (lev[k] < 0.1) { cr = 0.06 + T.col[0] * 0.05; cg = 0.06 + T.col[1] * 0.05; cb = 0.06 + T.col[2] * 0.05; }   // an unlit tube: dull glass
        }
      }
    }
    return [r, g, b, alpha, cr, cg, cb];
  }
  const NE_ALB = { 0: [0.085, 0.085, 0.09], 1: LK.P.tok, 2: [0.8, 0.8, 0.8], 3: LK.P.cube };
  const NE_SPEC = { 0: [0, 1], 1: [0.12, 30], 2: [0.5, 160], 3: [0.3, 90] };
  /* Direct neon light at a surface point. o.white: white albedo (the light pass); o.noShadow. */
  function neonLight(p, n, v, id, lev, S, o = {}) {
    const alb = o.white ? [0.8, 0.8, 0.8] : NE_ALB[id], [ks, shin] = NE_SPEC[id];
    const amb = 0.012, R = reflect(mul(v, -1), n);
    let r = alb[0] * amb * 0.8, g = alb[1] * amb * 0.85, b = alb[2] * amb * 1.3;
    for (let k = 0; k < 3; k++) {
      if (lev[k] < 0.01) continue;
      const T = TUBES[k], Ik = lev[k] * T.I, Ed = lineIrr(p, n, T);
      if (Ed <= 1e-4) continue;
      const q = nearestOnTube(p, T), tl = sub(q, p), dl = len(tl), l = mul(tl, 1 / dl);
      const sh = o.noShadow ? 1 : LK.shadow(add(p, mul(n, 0.01)), l, S, 5);
      let spec = 0;
      if (ks > 0 && !o.white) {
        const rq = raySeg(p, R, T).q, lr = norm(sub(rq, p)), dr = len(sub(rq, p)), hv = norm(add(lr, v));
        spec = ks * Math.pow(Math.max(0, dot(n, hv)), shin) * (shin + 8) / (8 * PI) * Math.max(0, dot(n, lr)) * T.len * 0.25 / (dr * dr + 0.05);
      }
      const e = Ik * sh;
      r += e * (alb[0] * Ed / PI + spec) * T.col[0]; g += e * (alb[1] * Ed / PI + spec) * T.col[1]; b += e * (alb[2] * Ed / PI + spec) * T.col[2];
    }
    return [r, g, b];
  }
  // wet asphalt: puddles (mirror) and damp patches (rough)
  const puddle = p => smooth(0.5, 0.64, vnoise2(p[0] * 0.55 + 3.1, p[2] * 0.55 + 7.7) * 0.75 + vnoise2(p[0] * 1.7, p[2] * 1.7) * 0.25);
  function neon(g, S, lev, sink, o = {}) {
    const ro = S.cam.pos, d = g.d;
    let base;
    if (!g.hit) base = neBG(d);
    else {
      const v = mul(d, -1);
      const c = neonLight(g.p, g.n, v, g.id, lev, S, o);
      if (g.id === 0) {
        const pd = puddle(g.p), ndv = clamp(dot(g.n, v));
        // reflection off the wet floor, slightly bumped where the asphalt is only damp
        const j = (1 - pd) * 0.05, nb = norm([j * (vnoise2(g.p[0] * 9, g.p[2] * 9) - 0.5), 1, j * (vnoise2(g.p[0] * 9 + 5, g.p[2] * 9 + 2) - 0.5)]);
        const R = reflect(d, nb), h = LK.trace(add(g.p, [0, 0.003, 0]), R, S, { maxT: 30 });
        let rc = h.hit ? (() => { const n2 = LK.normal(h.p, h.id, S); return neonLight(h.p, n2, mul(R, -1), h.id, lev, S, { noShadow: true, white: o.white }); })() : neBG(R);
        const tb = tubesOnRay(g.p, R, h.hit ? h.t : 1e9, lev, g.depth);
        rc = [rc[0] * (1 - tb[3]) + tb[4] * tb[3] + tb[0], rc[1] * (1 - tb[3]) + tb[5] * tb[3] + tb[1], rc[2] * (1 - tb[3]) + tb[6] * tb[3] + tb[2]];
        const fr = Math.pow(1 - ndv, 5), kr = (0.22 + 0.55 * pd + 0.5 * fr) * (o.white ? 0.5 : 1);
        if (sink) { sink.R[g.i * 3] = rc[0] * kr; sink.R[g.i * 3 + 1] = rc[1] * kr; sink.R[g.i * 3 + 2] = rc[2] * kr; sink.L[g.i] = 2 + (1 - pd) * 7; }
        else { c[0] += rc[0] * kr; c[1] += rc[1] * kr; c[2] += rc[2] * kr; }
      }
      base = c;
    }
    // tubes and their halo in front of whatever the primary ray hit
    const tb = tubesOnRay(ro, d, g.hit ? g.depth : 1e9, lev);
    const out = [base[0] * (1 - tb[3]) + tb[4] * tb[3] + tb[0], base[1] * (1 - tb[3]) + tb[5] * tb[3] + tb[1], base[2] * (1 - tb[3]) + tb[6] * tb[3] + tb[2]];
    if (sink) sink.H[g.i] = 1;
    return out;
  }
  // post: vertical stretch of the floor reflection, then add it, then tone map the whole night side
  function nePost(rgb, G, sink, split) {
    const { w, h } = G, ids = G.id, R = sink.R, L = sink.L;
    for (let i = 0; i < w * h; i++) {
      if (!sink.H[i]) continue;
      let r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
      if (ids[i] === 0 && L[i] > 0) {
        const x = i % w, y = (i / w) | 0, n = Math.ceil(L[i]);
        let ar = 0, ag = 0, ab = 0, ws = 0;
        for (let k = -n; k <= Math.ceil(n * 0.4); k++) {   // stretched mostly toward the viewer, like streaks on wet tarmac
          const yy = y - k; if (yy < 0 || yy >= h) continue;
          const j = yy * w + x; if (ids[j] !== 0 || !sink.H[j]) continue;
          const wt = 1 - Math.abs(k) / (n + 1);
          ar += R[j * 3] * wt; ag += R[j * 3 + 1] * wt; ab += R[j * 3 + 2] * wt; ws += wt;
        }
        if (ws > 0) { r += ar / ws; g += ag / ws; b += ab / ws; }
      }
      let c = LK.tone([r, g, b], 1.25);
      if (ids[i] === 0) c = LK.floorFade(c, { depth: G.depth[i], d: [G.D3[i * 3], G.D3[i * 3 + 1], G.D3[i * 3 + 2]] }, NE_BGT);
      rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2];
    }
  }
  function falloffPlot(c, S, x, y, w, h, lev) {
    c.save();
    c.fillStyle = 'rgba(8,9,12,0.72)'; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(236,232,223,0.25)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    label(c, 'FALLOFF  ·  E ∝ I / d²  PER ELEMENT', x + 16, y + 28, { size: 13, ls: 2, color: P.paper, weight: 700, dark: true });
    const gx = x + 44, gy = y + 50, gw = w - 64, gh = 100, d0 = 0.5, d1 = 5, X = d => gx + (d - d0) / (d1 - d0) * gw, Y = e => gy + gh - clamp(e) * gh;
    c.strokeStyle = 'rgba(236,232,223,0.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx, gy + gh); c.lineTo(gx + gw, gy + gh); c.stroke();
    c.strokeStyle = P.paper; c.lineWidth = 2; c.beginPath();
    for (let i = 0; i <= 80; i++) { const d = lerp(d0, d1, i / 80), px = X(d), py = Y(1 / (d * d)); i ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke();
    for (let m = 1; m <= 5; m++) label(c, `${m}`, X(m), gy + gh + 18, { size: 11, ls: 1, align: 'center', dark: true });
    label(c, 'd (m)', gx + gw, gy - 6, { size: 11, ls: 1, align: 'right', dark: true });
    const pairs = [['TOKEN', S.tok.c, 0], ['SPHERE', LK.SPH.c, 1], ['CUBE', LK.CUBE.c, 2]];
    pairs.forEach(([nm, pc, k], i) => {
      const T = TUBES[k], d = len(sub(nearestOnTube(pc, T), pc)), e = 1 / (d * d), on = clamp(lev[k] * 1.2);
      c.globalAlpha = 0.3 + 0.7 * on;
      c.fillStyle = T.hex; c.beginPath(); c.arc(X(d), Y(e), 6, 0, TAU); c.fill();
      const ly = gy + gh + 44 + i * 22;
      c.beginPath(); c.arc(gx + 4, ly - 5, 5, 0, TAU); c.fill();
      label(c, `${nm} ← ${T.name}`, gx + 18, ly, { size: 12, ls: 1, color: P.paper, dark: true });
      label(c, `${d.toFixed(2)} m  ·  1/d² ${e.toFixed(2)}`, x + w - 16, ly, { size: 12, ls: 1, color: P.paper, align: 'right', dark: true });
      c.globalAlpha = 1;
    });
    c.restore();
  }

  MG.film({
    id: 'lookneon', dur: 10, poster: 8.8,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Neon Night', sub: 'Coloured practical lights, a wet floor, inverse-square spill', era: '1910s — (on screen from the 1980s)',
      origin: 'Georges Claude showed the first neon tube lights in Paris in 1910, and neon signs spread through American cities in the 1920s and 1930s. The night street lit only by coloured practicals, with the light pooling and smearing on wet tarmac, became a cinematic look through films such as Blade Runner (Ridley Scott, cinematography Jordan Cronenweth, 1982), and later the neon-noir of Wong Kar-wai with Christopher Doyle and Nicolas Winding Refn’s Drive (2011). In rendering, a neon tube is a line or tube area light: shading from linear light sources was treated by Tomoyuki Nishita, Isao Okamura and Eihachiro Nakamae in 1985, and real-time engines adopted the “representative point” trick for their specular, described by Brian Karis for Unreal Engine 4 in 2013.',
      works: 'Blade Runner (Ridley Scott, cinematography Jordan Cronenweth, 1982) · Fallen Angels (Wong Kar-wai, cinematography Christopher Doyle, 1995) · Drive (Nicolas Winding Refn, cinematography Newton Thomas Sigel, 2011)',
      tech: ['Analytic line lights, 1/d² per element', 'Wet floor: traced, stretched reflection', 'Coloured spill, per-tube soft shadows'],
      accent: '#ff2a80',
      motionDNA: 'The shared camera orbit carries the tubes’ reflections across the wet floor and the highlights round the sphere. A wipe opens the night against the plain day reference while the tubes stutter on one by one; callouts name the spill, the line light and the wet reflection; from beat 7 each tube plays solo for a beat (pink, cyan, amber), so its own colour spill and falloff read alone, then all three return.',
      visualDNA: 'Near-black night, three glowing tubes — hot pink, cyan, amber — with soft halos; the white sphere goes magenta with a cyan rim, the orange Token turns hot red under the pink underlight, the blue cube’s front glows gold from the amber tube; dark asphalt with mirror puddles and long vertical streaks of reflected neon. Paper-coloured mono labels on dark halos, a light-only pass inset, a falloff plot with each object’s distance to its tube, and a three-channel tube mixer.',
      transitions: 'Wipe from plain day to the neon night; tubes stutter on; tube solos on the beat',
      implementation: ['Line / tube area lights with representative-point specular (Karis, 2013)', 'Screen-space or traced wet-surface reflections stretched along the view-vertical', 'Canvas 2D + SDF tracer (js/look-kit.js): closed-form line-light irradiance clipped to the hemisphere, one LK.shadow per tube, one LK.trace floor reflection, analytic ray–capsule tubes with halo'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const s1 = E.ioC(seg(t, NE.W[0], NE.W[1])), lev = [0, 1, 2].map(k => tubeLevel(k, t));
      const res = [704, 396], n = res[0] * res[1];
      const sink = { R: buf('nr', n * 3), L: buf('nl', n), H: buf('nh', n) };
      sink.L.fill(0); sink.H.fill(0);
      const shade = (g, S) => {
        if (g.u >= s1) return LK.plain(g, S);
        return neon(g, S, lev, sink);
      };
      const { S } = LK.render(c, t, W, H, shade, { res, post: (rgb, G) => nePost(rgb, G, sink, s1) });
      const dark = s1 > 0.5;
      wipeLine(c, s1, W, H, 'NEON NIGHT', 'PLAIN DAY', 1, true);
      // callouts
      const on1 = pulse(t, 2.6, NE.SOLO - 0.05, 0.35);
      callout(c, S, W, H, add(LK.SPH.c, [-0.45, 0.35, 0.25]), -40, -260, 'COLOUR SPILL', 'white sphere, painted by every tube', on1 * seg(t, 2.6, 3.0), true);
      callout(c, S, W, H, [-3.7, 2.2, 0.0], 90, -10, 'NEON TUBE  ·  LINE LIGHT', '∫ I (N·l) / d² along the segment', on1 * seg(t, 3.0, 3.4), true);
      callout(c, S, W, H, tokPt(S, 0.3, -0.9, 0.22), 120, -440, 'PINK UNDERLIGHT', 'front tube, from below', on1 * seg(t, 3.4, 3.8), true);
      callout(c, S, W, H, [1.9, 0, 1.4], -120, 150, 'WET FLOOR', 'traced reflection · stretched vertically', on1 * seg(t, 3.8, 4.2), true);
      // light-only pass + falloff plot, right side
      const ix = W - 72 - 400, iOn = pulse(t, 3.0, 10.2, 0.35);
      inset(c, t, W, H, [ix, 96, 400, 225], 'PASS  ·  LIGHT ONLY  (WHITE ALBEDO)', (g, S2) => { const r = neon(g, S2, lev, null, { white: true }); return LK.tone(r, 1.6); }, iOn, true, [160, 90]);
      const pOn = pulse(t, 3.6, 10.2, 0.35);
      if (pOn > 0) { c.save(); c.globalAlpha *= pOn; falloffPlot(c, S, ix, 360, 400, 252, lev); c.restore(); }
      // top-left: stage + tube mixer
      if (t < NE.W[0] + 0.2) tag(c, 'REFERENCE  ·  PLAIN DAY', 72, 80, seg(t, 0.1, 0.5));
      else if (t < NE.SOLO) tag(c, 'NIGHT  ·  THREE NEON TUBES, NOTHING ELSE', 72, 80, 1, dark, '#ff2a80');
      else {
        const s = Math.floor((t - NE.SOLO) / BEAT);
        tag(c, s < 3 ? `SOLO  ·  ${TUBES[s].name} TUBE ONLY` : 'ALL THREE  ·  THE SPILL ADDS UP', 72, 80, 1, true, s < 3 ? TUBES[s].hex : '#ff2a80');
      }
      const mOn = seg(t, 1.2, 1.7);
      if (mOn > 0) {
        c.save(); c.globalAlpha *= mOn;
        TUBES.forEach((T, k) => {
          const y = 132 + k * 40, lv = clamp(lev[k]);
          label(c, T.name, 98, y + 15, { size: 14, ls: 2, color: P.paper, weight: 700, dark: true });
          c.fillStyle = 'rgba(236,232,223,0.15)'; c.fillRect(190, y, 260, 18);
          c.fillStyle = T.hex; c.fillRect(190, y, 260 * lv, 18);
          label(c, `${Math.round(lv * 100)}%`, 466, y + 15, { size: 14, ls: 1, color: P.paper, dark: true });
        });
        label(c, 'ambient: moonlight 1%  ·  no key, no fill', 98, 270, { size: 13, ls: 1.5, dark: true });
        c.restore();
      }
      LK.caption(c, t, W, H, { name: 'Neon Night', cat: 'Light', dark: true });
    },
    score(A) {
      LK.bed(A, { g: 0.8 });
      // ignition: a click, a stuttering buzz, then the hum settles
      TUBES.forEach((T, k) => {
        const t0 = T.ign, pan = [-0.6, 0, 0.6][k];
        A.noise(t0, { type: 'highpass', f: 3000, dur: 0.03, g: 0.12, pan });
        for (let i = 0; i < 13; i++) { const tt = t0 + i / 24; if (hash(i * 3.1 + k * 17.3) > 0.42) A.osc(tt, { type: 'sawtooth', f: 120, dur: 1 / 28, g: 0.03, lp: 1800, pan }); }
        A.osc(t0 + 0.55, { type: 'sawtooth', f: 120 * [1, 1.5, 1.335][k], dur: 3.6, g: 0.012, a: 0.1, lp: 900, rev: 0.3, pan });
        A.bell(t0 + 0.55, midi([79, 83, 86][k]), { g: 0.05, dur: 1.6, rev: 0.7, pan });
      });
      A.whoosh(NE.W[0], NE.W[1] - NE.W[0], { f1: 200, f2: 2400, q: 0.9, g: 0.08, swell: 0.6, rev: 0.5 });
      [2.6, 3.0, 3.4, 3.8].forEach((t, i) => A.osc(t, { type: 'triangle', f: midi(74 + [0, 3, 7, 10][i]), dur: 0.3, g: 0.04, rev: 0.5, pan: (i - 1.5) * 0.3 }));
      // solos: a relay clack and the solo tube's note
      for (let s = 0; s < 4; s++) {
        const t = NE.SOLO + s * BEAT;
        A.noise(t, { type: 'bandpass', f: 1400, q: 2, dur: 0.04, g: 0.1 });
        A.kick(t, 0.2, { f: 140, f2: 60, dur: 0.15 });
        if (s < 3) A.osc(t, { type: 'sawtooth', f: midi([67, 71, 74][s]), dur: BEAT * 0.9, g: 0.022, lp: 1500, rev: 0.4, pan: [-0.6, 0, 0.6][s] });
        else A.chord(t, [55, 62, 67, 71, 74], { type: 'sawtooth', dur: 2.6, g: 0.018, a: 0.05, lp: 1600, rev: 0.6, width: 0.9 });
      }
      A.riser(8.2, 1.3, { g: 0.04, f: 300 });
    },
  });

  /* =====================================================================
     OVERCAST — the sun behind a full cloud deck. The whole sky dome is
     the light: a CIE standard overcast sky, L(θ) = Lz (1 + 2 cos θ) / 3,
     three times brighter at the zenith than at the horizon. Irradiance is
     integrated with N cosine-weighted rays from every point (a fixed
     spiral of directions), each a soft shadow test against the scene, so
     there is no key light, no cast shadow — only soft contact darkening
     where the sky is hidden. Low contrast, cool neutral colour. The film
     opens on the same scene in hard sun, wipes to overcast, builds the
     ray count up on the beat (1 → 3 → 6 → 12), probes what the sky looks
     like from four points in a fisheye, and splits against the sun with
     the measured contrast ratio of each half.
     ===================================================================== */
  const OV = { W1: [1.0, 2.8], W2: [6.8, 7.9], NST: [[0, 12], [4.8, 1], [4.8 + BEAT, 3], [4.8 + 2 * BEAT, 6], [4.8 + 3 * BEAT, 12]] };
  const nRays = t => { let n = 12; for (const [t0, v] of OV.NST) if (t >= t0) n = v; return n; };
  const SKY_OV = [0.86, 0.9, 0.95], GROUND = [0.36, 0.355, 0.34];
  const cie = cz => (1 + 2 * Math.max(0, cz)) / 3;
  const ovBG = d => mix3([0.8, 0.82, 0.845], [0.9, 0.915, 0.94], smooth(0, 0.5, d[1]));
  function hemiDirs(n, N) {
    const t1 = norm(cross(n, Math.abs(n[1]) < 0.99 ? [0, 1, 0] : [1, 0, 0])), t2 = cross(n, t1), out = [];
    for (let i = 0; i < N; i++) {
      const r = N === 1 ? 0 : Math.sqrt((i + 0.5) / N), ph = i * 2.39996 + 0.6, z = Math.sqrt(1 - r * r);
      out.push(norm([t1[0] * r * Math.cos(ph) + t2[0] * r * Math.sin(ph) + n[0] * z, t1[1] * r * Math.cos(ph) + t2[1] * r * Math.sin(ph) + n[1] * z, t1[2] * r * Math.cos(ph) + t2[2] * r * Math.sin(ph) + n[2] * z]));
    }
    return out;
  }
  const SKY_NORM = (1 + 4 / 3) / 3;   // cosine-weighted mean of the CIE sky over an open upward hemisphere
  function skyVis(p, n, S, N) {
    let e = 0, gr = 0;
    for (const d of hemiDirs(n, N)) {
      if (d[1] < 0) { gr += 1; continue; }
      e += cie(d[1]) * LK.shadow(add(p, mul(n, 0.015)), d, S, 4);
    }
    return { sky: e / N / SKY_NORM, ground: gr / N };
  }
  function overcast(g, S, N, pass = 0) {
    if (!g.hit) return pass ? [1, 1, 1] : ovBG(g.d);
    const a = LK.albedo(g.id), n = g.n, v = mul(g.d, -1);
    const vis = skyVis(g.p, n, S, N), occ = LK.ao(g.p, n, S);
    const sky = vis.sky * (0.55 + 0.45 * occ), grd = vis.ground * (0.5 + 0.5 * occ);
    if (pass === 1) { const x = clamp(sky * 1.0); return [x, x, x]; }
    const fr = Math.pow(1 - clamp(dot(n, v)), 5), R = reflect(g.d, n), ks = g.id === 2 ? 0.06 : g.id === 0 ? 0.02 : 0.04;
    const sh = (ks + (1 - ks) * fr) * 0.5 * cie(R[1]) * (0.4 + 0.6 * occ) * (R[1] > 0 ? 1 : 0.4);
    const out = [0, 0, 0];
    for (let k = 0; k < 3; k++) out[k] = a[k] * (SKY_OV[k] * 1.12 * sky + GROUND[k] * grd * 0.7) + SKY_OV[k] * sh;
    const c = LK.tone(out, 1.55);
    return g.id === 0 ? LK.floorFade(c, g, ovBG([0, 0.02, 1])) : c;
  }
  const SUN = KEY, SUN_C = [1.0, 0.94, 0.84], SKY_B = [0.24, 0.31, 0.46];
  const sunBG = d => mix3([0.72, 0.82, 0.93], [0.42, 0.6, 0.88], smooth(0, 0.6, d[1]));
  function sunny(g, S) {
    if (!g.hit) return sunBG(g.d);
    const a = LK.albedo(g.id), n = g.n, ndl = dot(n, SUN);
    const sh = ndl > 0 ? LK.shadow(add(g.p, mul(n, 0.01)), SUN, S, 48) : 0, occ = LK.ao(g.p, n, S);
    const dif = Math.max(0, ndl) * sh * 2.1, sky = (0.55 + 0.45 * n[1]) * occ;
    const hv = norm(sub(SUN, g.d)), sp = Math.pow(Math.max(0, dot(n, hv)), 80) * sh * (g.id === 0 ? 0.05 : 0.4);
    const out = [0, 0, 0];
    const bnc = Math.max(0, -n[1]) * 0.18 * occ;   // a little sunlight bounced off the floor
    for (let k = 0; k < 3; k++) out[k] = a[k] * (SUN_C[k] * dif + SKY_B[k] * sky + SUN_C[k] * bnc) + SUN_C[k] * sp;
    const c = LK.tone(out, 1.15);
    return g.id === 0 ? LK.floorFade(c, g, sunBG([0, 0.02, 1])) : c;
  }
  /* Contrast of a region of the finished buffer: the 97th over the 3rd percentile of linear
     luminance, from a log histogram over the lit scene (backdrop and far floor excluded). */
  function contrast(rgb, G, u0, u1) {
    const { w, h } = G, hist = new Uint32Array(256), x0 = Math.floor(u0 * w), x1 = Math.ceil(u1 * w);
    let tot = 0;
    for (let y = 0; y < h; y++) for (let x = x0; x < x1; x++) {
      const i = y * w + x; if (G.id[i] === 255 || G.depth[i] > 11) continue;
      const L = 0.2126 * Math.pow(rgb[i * 3], 2.2) + 0.7152 * Math.pow(rgb[i * 3 + 1], 2.2) + 0.0722 * Math.pow(rgb[i * 3 + 2], 2.2);
      const b = clamp(Math.round((Math.log2(Math.max(L, 1e-4)) + 12) / 12 * 255), 0, 255); hist[b]++; tot++;
    }
    if (tot < 200) return null;
    const pct = q => { let acc = 0; for (let b = 0; b < 256; b++) { acc += hist[b]; if (acc >= q * tot) return Math.pow(2, b / 255 * 12 - 12); } return 1; };
    return pct(0.97) / pct(0.03);
  }
  // fisheye of the sky as seen from probe point p (normal up), equal-area, zenith at the centre
  const FE = 72;
  function fisheye(S, p, N) {
    const cv = MG.offscreen(FE, FE), cx = cv.getContext('2d'), img = cx.createImageData(FE, FE);
    let vw = 0, tw = 0;
    for (let y = 0; y < FE; y++) for (let x = 0; x < FE; x++) {
      const u = (x + 0.5) / FE * 2 - 1, v = (y + 0.5) / FE * 2 - 1, r = Math.hypot(u, v), j = (y * FE + x) * 4;
      if (r > 1) { img.data[j + 3] = 0; continue; }
      const th = 2 * Math.asin(r * Math.SQRT1_2), ph = Math.atan2(v, u), d = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
      const h = LK.trace(add(p, [0, 0.02, 0]), d, S, { maxT: 14 }), wgt = d[1] * cie(d[1]);
      tw += wgt;
      let col;
      if (h.hit && h.id !== 0) { const a = LK.albedo(h.id); col = [a[0] * 0.32, a[1] * 0.32, a[2] * 0.32]; }
      else { vw += wgt; const s = 0.62 + 0.38 * cie(d[1]); col = [0.9 * s, 0.93 * s, 0.97 * s]; }
      img.data[j] = col[0] * 255; img.data[j + 1] = col[1] * 255; img.data[j + 2] = col[2] * 255; img.data[j + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    // the N cosine-weighted ray directions, marked open or blocked
    const dots = hemiDirs([0, 1, 0], N).map(d => {
      const th = Math.acos(clamp(d[1])), r = Math.sin(th / 2) / Math.SQRT1_2, ph = Math.atan2(d[2], d[0]);
      return [r * Math.cos(ph), r * Math.sin(ph), LK.trace(add(p, [0, 0.02, 0]), d, S, { maxT: 14 }).hit];
    });
    return { cv, V: vw / tw, dots };
  }
  const PROBES = [
    { t: 3.0, name: 'FLOOR BESIDE THE SPHERE', p: S => [LK.SPH.c[0] + 0.5, 0, LK.SPH.c[2] + 0.35] },
    { t: 3.9, name: 'FLOOR UNDER THE TOKEN', p: S => [S.tok.c[0] + 0.15, 0, S.tok.c[2] + 0.1] },
    { t: 4.8, name: 'FLOOR AT THE CUBE’S FOOT', p: S => cubePt(-0.75, -0.5, 0.2) },
    { t: 5.7, name: 'TOP OF THE CUBE', p: S => cubePt(0, 0.51, 0) },
  ];

  MG.film({
    id: 'lookovercast', dur: 10, poster: 8.8,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Overcast', sub: 'The whole cloudy sky as one soft light', era: '1942 — (sky model)',
      origin: 'Under a full cloud deck the sun disappears and the whole sky becomes one huge, dim, even source: there is no key, shadows shrink to soft darkening where surfaces meet, and contrast drops. Parry Moon and Domina Spencer measured overcast skies in 1942 and found them about three times brighter at the zenith than at the horizon, L(θ) = Lz(1 + 2 cos θ)/3, which the CIE adopted as its standard overcast sky (1955). Photographers prize the light for portraits and product work, and its film equivalent is the large overhead diffusion frame. In rendering it is sky-dome lighting: integrate the sky over the visible hemisphere, by cosine-weighted visibility rays or by ambient occlusion as the cheap stand-in (Zhukov, Iones and Kronin, 1998; Landis at ILM, 2002).',
      works: 'CIE standard overcast sky (after Moon & Spencer, 1942) · Bernd and Hilla Becher’s typologies of industrial structures (from 1959; photographed under overcast skies for shadowless, even light) · Fargo (Joel and Ethan Coen, cinematography Roger Deakins, 1996; flat white winter overcast)',
      tech: ['CIE overcast sky dome', 'Cosine-weighted soft shadow rays', 'Measured contrast ratio'],
      accent: '#a9b6c4',
      motionDNA: 'The shared camera orbit. The film opens on the scene in hard clear-sky sun; a wipe from left to right covers it with the overcast dome, the cast shadows dissolving into soft contact darkening. Callouts and a fisheye probe step across four points on the beat while a visibility pass sits beside it; the sky-ray count then builds 1 → 3 → 6 → 12 on the beat, single soft shadows multiplying into one soft occlusion; finally a split slides in to compare overcast and sun side by side with their measured contrast ratios.',
      visualDNA: 'Pale cool grey-white sky with no visible sun; the paper floor and the orange, white and blue objects in soft, even, slightly blue light, tops brighter than sides, dark only where they meet the floor. Against it the hard-sun half: blue sky, crisp black shadows, bright highlights. Ink mono labels, a circular sky fisheye with ray dots, a visibility pass, a ray-count readout and two contrast-ratio readouts.',
      transitions: 'Wipe from hard sun to overcast; stepped ray count; split to the sunny version',
      implementation: ['Sky-dome / environment lighting with the CIE overcast luminance distribution', 'Cosine-weighted hemisphere visibility (the full-strength version of ambient occlusion)', 'Canvas 2D + SDF tracer (js/look-kit.js): 12 fixed spiral directions per pixel, each a soft LK.shadow, times LK.ao for small-scale contact; contrast measured from a luminance histogram of the frame'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const s1 = E.ioC(seg(t, OV.W1[0], OV.W1[1])), s2 = 1 - 0.5 * E.ioC(seg(t, OV.W2[0], OV.W2[1])), N = nRays(t);
      const stats = {};
      const shade = (g, S) => (g.u < s1 && g.u < s2 ? overcast(g, S, N) : sunny(g, S));
      const split = Math.min(s1, s2);
      const post = (rgb, G) => { stats.ov = split > 0.15 ? contrast(rgb, G, 0, split) : null; stats.sun = split < 0.85 ? contrast(rgb, G, split, 1) : null; };
      const { S } = LK.render(c, t, W, H, shade, { res: [640, 360], post });
      wipeLine(c, s1, W, H, 'OVERCAST', 'HARD SUN');
      wipeLine(c, s2, W, H, 'OVERCAST', 'HARD SUN', seg(t, OV.W2[0], OV.W2[0] + 0.2), false, 330);
      // callouts
      const on1 = pulse(t, 3.0, 6.6, 0.4);
      callout(c, S, W, H, add(LK.CUBE.c, [0.1, 0.5, 0.15]), -60, 260, 'TOPS BRIGHTEST', 'zenith 3× the horizon (CIE)', on1 * seg(t, 3.0, 3.4));
      callout(c, S, W, H, add(LK.SPH.c, [0.25, -0.72, 0.3]), 200, 110, 'CONTACT SHADOW ONLY', 'no cast shadow, no direction', on1 * seg(t, 3.4, 3.8));
      callout(c, S, W, H, tokPt(S, -0.2, 0.8, 0.23), 120, -150, 'NO HARD KEY', 'the whole dome is the light', on1 * seg(t, 3.8, 4.2));
      // probe + fisheye
      const fOn = pulse(t, 3.0, 6.6, 0.35);
      if (fOn > 0) {
        let k = 0; for (let i = 0; i < PROBES.length; i++) if (t >= PROBES[i].t) k = i;
        const pr = PROBES[k], pp = pr.p(S), fe = fisheye(S, pp, Math.max(N, 1));
        const q = LK.project(S, pp, W, H), x = W - 72 - 260, y = 96, D = 220;
        c.save(); c.globalAlpha *= fOn;
        // probe marker on the floor
        if (q) {
          c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.ellipse(q[0], q[1], 22, 9, 0, 0, TAU); c.stroke();
          c.fillStyle = P.accent; c.beginPath(); c.arc(q[0], q[1], 6, 0, TAU); c.fill();
          label(c, 'PROBE', q[0] + 28, q[1] + 6, { size: 14, ls: 2, color: P.ink, weight: 700 });
        }
        c.fillStyle = 'rgba(236,232,223,0.9)'; c.fillRect(x - 20, y - 4, D + 40, D + 120);
        c.strokeStyle = 'rgba(23,24,28,0.25)'; c.lineWidth = 1; c.strokeRect(x - 19.5, y - 3.5, D + 39, D + 119);
        label(c, 'SKY SEEN FROM THE PROBE', x, y + 22, { size: 13, ls: 2, color: P.ink, weight: 700 });
        const cx0 = x + D / 2, cy0 = y + 40 + D / 2 - 6, R = D / 2 - 6;
        c.save(); c.beginPath(); c.arc(cx0, cy0, R, 0, TAU); c.clip(); c.imageSmoothingEnabled = true; c.drawImage(fe.cv, cx0 - R, cy0 - R, 2 * R, 2 * R); c.restore();
        c.strokeStyle = P.ink; c.lineWidth = 1.5; c.beginPath(); c.arc(cx0, cy0, R, 0, TAU); c.stroke();
        c.strokeStyle = 'rgba(23,24,28,0.25)'; c.beginPath(); c.arc(cx0, cy0, R * Math.sin(PI / 8) / Math.SQRT1_2, 0, TAU); c.stroke();
        fe.dots.forEach(([u, v, hit]) => {
          const px = cx0 + u * R, py = cy0 + v * R;
          c.fillStyle = hit ? P.ink : P.accent; c.beginPath(); c.arc(px, py, 4.5, 0, TAU); c.fill();
          c.strokeStyle = P.paper; c.lineWidth = 1.2; c.stroke();
        });
        label(c, pr.name, x, cy0 + R + 30, { size: 12, ls: 1.5, color: DIM, weight: 700 });
        label(c, `SKY VISIBLE  ${Math.round(fe.V * 100)}%`, x, cy0 + R + 56, { size: 17, ls: 2, color: P.ink, weight: 700 });
        c.restore();
      }
      inset(c, t, W, H, [98, 340, 320, 180], `PASS  ·  SKY VISIBILITY  (${N} RAY${N > 1 ? 'S' : ''})`, (g, S2) => overcast(g, S2, N, 1), pulse(t, 3.4, 6.6, 0.35), false, [160, 90]);
      // top-left: stage + readouts
      if (t < OV.W1[0] + 0.2) tag(c, 'REFERENCE  ·  HARD SUN, CLEAR SKY', 72, 80, seg(t, 0.1, 0.5));
      else if (t < OV.NST[1][0]) tag(c, 'OVERCAST  ·  CIE SKY DOME, NO SUN', 72, 80);
      else if (t < OV.W2[0]) tag(c, `SOFT SHADOW  ·  ${N} COSINE-WEIGHTED SKY RAY${N > 1 ? 'S' : ''}`, 72, 80);
      else tag(c, 'OVERCAST  vs  HARD SUN', 72, 80);
      const fmt = r => (r == null ? '—' : `${r < 10 ? r.toFixed(1) : Math.round(r)} : 1`);
      const st = (r) => (r == null ? '' : `${Math.log2(r).toFixed(1)} STOPS`);
      const rOn = seg(t, 0.4, 0.8);
      if (rOn > 0) {
        c.save(); c.globalAlpha *= rOn;
        label(c, 'CONTRAST  ·  97th / 3rd PERCENTILE LUMINANCE', 98, 132, { size: 13, ls: 2, color: DIM, weight: 700 });
        const rows = [];
        if (stats.ov != null) rows.push(['OVERCAST', stats.ov, '#7d8da0']);
        if (stats.sun != null) rows.push(['HARD SUN', stats.sun, '#e0a43a']);
        rows.forEach(([nm, r, col], i) => {
          const y = 176 + i * 54;
          c.fillStyle = col; c.fillRect(98, y - 22, 6, 30);
          label(c, nm, 118, y, { size: 14, ls: 2, color: P.ink, weight: 700 });
          text(c, fmt(r), 260, y + 4, { font: MG.TK.MONO, size: 34, weight: 700, color: P.ink, stroke: HALO, lw: 6 });
          label(c, st(r), 420, y, { size: 14, ls: 2, color: DIM });
        });
        if (t >= OV.NST[1][0] && t < OV.W2[0]) label(c, `N = ${N}  ·  each ray a soft shadow test, k = 4`, 98, 176 + rows.length * 54, { size: 14, ls: 1.5, color: P.ink, weight: 700 });
        c.restore();
      }
      LK.caption(c, t, W, H, { name: 'Overcast', cat: 'Light', curve: u => cie(Math.sin(u * PI / 2)), span: [0, 10], lo: 0, hi: 1.15, curveLabel: 'SKY L / ELEVATION (CIE)' });
    },
    score(A) {
      LK.bed(A, { g: 0.9 });
      A.whoosh(OV.W1[0], OV.W1[1] - OV.W1[0], { f1: 1400, f2: 250, q: 0.6, g: 0.09, swell: 0.7, rev: 0.6 });
      A.chord(OV.W1[1], [50, 57, 62, 65], { type: 'sine', dur: 3.0, g: 0.04, a: 0.6, lp: 900, rev: 0.7, width: 0.9 });
      [3.0, 3.4, 3.8].forEach((t, i) => A.osc(t, { type: 'triangle', f: midi(72 + [0, 2, 5][i]), dur: 0.3, g: 0.035, lp: 1600, rev: 0.5 }));
      PROBES.forEach((p, i) => A.pluck(p.t, midi([62, 65, 69, 72][i]), { g: 0.08, bright: 0.2, dur: 0.9, lp: 1500 }));
      // ray-count steps: soft rain-like ticks, more of them each step
      OV.NST.slice(1).forEach(([t, n], i) => {
        for (let j = 0; j < Math.min(n, 8); j++) A.noise(t + j * 0.035, { type: 'bandpass', f: 2400 + hash(j * 7.7 + i) * 2400, q: 3, dur: 0.025, g: 0.04, pan: (hash(j * 3.3 + i) - 0.5) * 1.2 });
        A.osc(t, { type: 'sine', f: midi(57 + i * 2), dur: 0.6, g: 0.04, rev: 0.6 });
      });
      A.whoosh(OV.W2[0], OV.W2[1] - OV.W2[0], { f1: 300, f2: 3000, q: 0.8, g: 0.08, swell: 0.6, rev: 0.4, pan: 0.4 });
      A.bell(OV.W2[1], midi(79), { g: 0.06, dur: 2.0, rev: 0.7 });
      A.chord(OV.W2[1], [45, 52, 57, 60, 64], { type: 'triangle', dur: 2.0, g: 0.03, a: 0.1, lp: 1500, rev: 0.6, width: 0.8 });
    },
  });
})();
