/* batch l6 — Rendering Looks · Material: looksss · lookiridescent · lookclearcoat.
   looksss (subsurface scattering: wax and jade lit through — per-channel wrap lighting and a
   red-bleeding shadow edge, then the light swings behind the still life and a traced thickness
   toward the light (LK.traceInside) sets how much leaks through, so the Token's edges and the
   rim round its hole glow; scatter radius stepped on the beat, against plain Lambert diffuse) ·
   lookiridescent (thin-film interference on a dark set: a soap-bubble sphere and a beetle-shell
   Token whose colour is an Airy two-beam reflectance integrated over the visible spectrum per
   film thickness and view angle, with thickness noise, draining and swirling across the bubble;
   a film-thickness readout over the interference colour chart and a hue-vs-angle strip) ·
   lookclearcoat (a layered material: candy-orange metallic flake paint and lacquered ceramic
   under a separate clear coat — a traced, Fresnel-weighted studio reflection on top of the base
   lobe; the coat switched off, faded back in, roughened on the beat, then split coat on / off). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, midi, text } = MG;
  const LK = MG.LK, V = LK.V, P = LK.P, KEY = LK.KEY, BEAT = LK.BEAT;
  const { add, sub, mul, dot, norm, reflect } = V;
  const mix3 = LK.mix3;
  const beat = b => b * BEAT;

  /* ---------------- shared helpers ---------------- */
  const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const box = (x, half, e) => smooth(-half - e, -half + e, x) * (1 - smooth(half - e, half + e, x));
  const HALO = 'rgba(236,232,223,0.88)', HALO_D = 'rgba(12,13,16,0.8)';
  const INK = dk => (dk ? P.paper : P.ink), SUBC = dk => (dk ? 'rgba(236,232,223,0.7)' : '#5d5a54');
  const label = (c, s, x, y, o = {}) => text(c, s, x, y, { font: MG.TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base, stroke: o.halo === false ? undefined : (o.dk ? HALO_D : HALO), lw: 5 });
  const tag = (c, s, x, y, on = 1, dk = false) => {   // accent dot + mono label, top-left of frame
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: INK(dk), weight: 700, size: 20, dk });
    c.restore();
  };
  /* Leader-line label pointing at a world point: dot on the object, elbow line, title + note. */
  function callout(c, S, W, H, p, dx, dy, title, note, on, dk = false) {
    if (on <= 0.001) return;
    const q = LK.project(S, p, W, H); if (!q) return;
    const x1 = q[0] + dx, y1 = q[1] + dy, dir = dx >= 0 ? 1 : -1, x2 = x1 + dir * 26;
    c.save(); c.globalAlpha *= on; c.lineCap = 'round';
    const path = () => { c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(x1, y1); c.lineTo(x2, y1); c.stroke(); };
    c.strokeStyle = dk ? HALO_D : HALO; c.lineWidth = 5; path();
    c.strokeStyle = INK(dk); c.lineWidth = 1.6; path();
    c.fillStyle = dk ? '#16171b' : P.paper; c.beginPath(); c.arc(q[0], q[1], 8, 0, TAU); c.fill();
    c.fillStyle = P.accent; c.beginPath(); c.arc(q[0], q[1], 5, 0, TAU); c.fill();
    const al = dir > 0 ? 'left' : 'right';
    label(c, title, x2 + dir * 10, y1 + 6, { align: al, color: INK(dk), weight: 700, size: 18, ls: 2, dk });
    if (note) label(c, note, x2 + dir * 10, y1 + 30, { align: al, size: 14, ls: 1.5, color: SUBC(dk), dk });
    c.restore();
  }
  /* The moving split between the look (left) and a reference (right). */
  function wipeLine(c, sx, W, H, left, right, on = 1, dk = false, ly = 330) {
    if (on <= 0.001 || sx <= 0.0005 || sx >= 0.9995) return;
    const x = sx * W;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = dk ? HALO_D : HALO; c.fillRect(x - 3, 0, 6, H);
    c.fillStyle = P.accent; c.fillRect(x - 1.5, 0, 3, H);
    label(c, left + '  ◀', x - 16, ly, { align: 'right', color: INK(dk), weight: 700, size: 16, dk });
    label(c, '▶  ' + right, x + 16, ly, { color: INK(dk), weight: 700, size: 16, dk });
    c.restore();
  }
  /* A pass inset, top right: the frame's G-buffer sampled at 320 × 180 (nearest pixel) and shaded
     with fn(g, S) — much cheaper than a second render, so passes can run every frame. */
  const INS = { w: 320, h: 180 };
  let pcv = null;
  function inset(c, G, W, k, title, fn, on, dk = false) {
    if (on <= 0.001) return;
    const w = INS.w, h = INS.h, x = W - 72 - w, y = 92 + k * (h + 58);
    if (!pcv) { const cv = MG.offscreen(w, h), cx = cv.getContext('2d'); pcv = { cv, cx, img: cx.createImageData(w, h) }; }
    const d = pcv.img.data, S = G.S, g = { hit: false, id: 255, x: 0, y: 0, i: 0 };
    for (let j = 0; j < h; j++) {
      const gy = Math.min(G.h - 1, ((j + 0.5) / h * G.h) | 0);
      for (let i = 0; i < w; i++) {
        const gx = Math.min(G.w - 1, ((i + 0.5) / w * G.w) | 0), q = gy * G.w + gx, id = G.id[q];
        g.id = id; g.hit = id !== 255; g.depth = G.depth[q]; g.u = (i + 0.5) / w; g.v = (j + 0.5) / h; g.x = gx; g.y = gy; g.i = -1;
        g.d = [G.D3[q * 3], G.D3[q * 3 + 1], G.D3[q * 3 + 2]];
        g.n = g.hit ? [G.N3[q * 3], G.N3[q * 3 + 1], G.N3[q * 3 + 2]] : null;
        g.p = g.hit ? [G.P3[q * 3], G.P3[q * 3 + 1], G.P3[q * 3 + 2]] : null;
        const col = fn(g, S), b = (j * w + i) * 4;
        d[b] = clamp(col[0]) * 255; d[b + 1] = clamp(col[1]) * 255; d[b + 2] = clamp(col[2]) * 255; d[b + 3] = 255;
      }
    }
    pcv.cx.putImageData(pcv.img, 0, 0);
    c.save(); c.globalAlpha *= on;
    c.fillStyle = 'rgba(10,11,14,0.22)'; c.fillRect(x + 6, y + 6, w, h);
    c.drawImage(pcv.cv, x, y, w, h);
    c.strokeStyle = INK(dk); c.lineWidth = 1.5; c.strokeRect(x - 0.75, y - 0.75, w + 1.5, h + 1.5);
    label(c, title, x, y - 12, { size: 14, ls: 2, color: INK(dk), weight: 700, dk });
    c.restore();
  }
  /* A big parameter readout with a ruler under it. frac: 0..1 position; marks [[frac, name]];
     bar(c, x, y, w): optional painter for the ruler itself (e.g. a colour chart). */
  function readout(c, x, y, name, val, frac, marks, on = 1, dk = false, bar) {
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    label(c, name, x, y, { size: 15, ls: 3, color: SUBC(dk), weight: 700, dk });
    text(c, val, x - 2, y + 50, { font: MG.TK.MONO, size: 46, weight: 700, color: INK(dk), stroke: dk ? HALO_D : HALO, lw: 6 });
    const rw = 420, ry = y + 78, X = v => x + clamp(v) * rw;
    if (bar) bar(c, x, ry - 7, rw);
    else { c.fillStyle = dk ? 'rgba(236,232,223,0.3)' : 'rgba(23,24,28,0.25)'; c.fillRect(x, ry, rw, 2); }
    for (const [v, s] of marks) {
      c.fillStyle = dk ? 'rgba(236,232,223,0.55)' : 'rgba(23,24,28,0.45)'; c.fillRect(X(v) - 0.75, ry - 6, 1.5, 14);
      label(c, s, X(v), ry + 26, { size: 12, ls: 1, align: 'center', color: SUBC(dk), dk });
    }
    if (!bar) { c.fillStyle = P.accent; c.fillRect(x, ry, X(frac) - x, 2); }
    c.fillStyle = dk ? '#16171b' : P.paper; c.beginPath(); c.arc(X(frac), ry + 1, 10, 0, TAU); c.fill();
    c.fillStyle = P.accent; c.beginPath(); c.arc(X(frac), ry + 1, 7, 0, TAU); c.fill();
    c.restore();
  }
  const pulse = (t, t0, t1, f = 0.35) => seg(t, t0, t0 + f) * (1 - seg(t, t1 - f, t1));
  const softClip = c => c.map(v => (v < 0.82 ? v : 0.82 + 0.18 * (1 - Math.exp(-(v - 0.82) / 0.18))));
  const tokFace = S => add(S.tok.c, mul(norm(sub(S.cam.pos, S.tok.c)), 0.24));
  // Token frame ⇄ world (x, y across the face, z through it)
  const tokPt = (S, x, y, z) => { const M = S.tok.M; return add(S.tok.c, [M[0] * x + M[1] * y + M[2] * z, M[3] * x + M[4] * y + M[5] * z, M[6] * x + M[7] * y + M[8] * z]); };
  const tokLocal = (S, p) => { const M = S.tok.M, q = sub(p, S.tok.c); return [M[0] * q[0] + M[3] * q[1] + M[6] * q[2], M[1] * q[0] + M[4] * q[1] + M[7] * q[2], M[2] * q[0] + M[5] * q[1] + M[8] * q[2]]; };
  const cubeLocal = (S, p) => { const M = S.cubeM, q = sub(p, LK.CUBE.c); return [M[0] * q[0] + M[3] * q[1] + M[6] * q[2], M[1] * q[0] + M[4] * q[1] + M[7] * q[2], M[2] * q[0] + M[5] * q[1] + M[8] * q[2]]; };
  const objLocal = (S, id, p) => (id === 1 ? tokLocal(S, p) : id === 3 ? cubeLocal(S, p) : sub(p, LK.SPH.c));
  const rgbStr = v => `rgb(${Math.round(clamp(v[0]) * 255)},${Math.round(clamp(v[1]) * 255)},${Math.round(clamp(v[2]) * 255)})`;
  const satur = (c, s) => { const l = LK.luma(c); return [Math.max(0, l + (c[0] - l) * s), Math.max(0, l + (c[1] - l) * s), Math.max(0, l + (c[2] - l) * s)]; };

  /* 3D value noise (seeded lattice hash), and a two-octave sum. */
  const h3 = (i, j, k) => hash(i * 157.31 + j * 113.97 + k * 271.13);
  function vn3(x, y, z) {
    const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z);
    let fx = x - i, fy = y - j, fz = z - k;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
    const a = lerp(lerp(h3(i, j, k), h3(i + 1, j, k), fx), lerp(h3(i, j + 1, k), h3(i + 1, j + 1, k), fx), fy);
    const b = lerp(lerp(h3(i, j, k + 1), h3(i + 1, j, k + 1), fx), lerp(h3(i, j + 1, k + 1), h3(i + 1, j + 1, k + 1), fx), fy);
    return lerp(a, b, fz);
  }
  const fbm3 = (x, y, z) => 0.65 * vn3(x, y, z) + 0.35 * vn3(x * 2.03 + 5.1, y * 2.03 + 1.7, z * 2.03 + 3.3);

  /* Studio environment for rays that leave the scene (as in Chrome, l1): backdrop at the horizon
     rising into a dark ceiling, a big key softbox, two strip lights and a low band behind the camera.
     r softens every edge like a prefiltered map. bg/low: the horizon and ground colours (a dark set
     passes its own). Values above 1 are lights. */
  const KR = norm(V.cross(KEY, [0, 1, 0])), KU = V.cross(KR, KEY);
  function env(d, r = 0, bg = LK.BG, low = [0.52, 0.5, 0.47], gain = 1) {
    const y = d[1], az = Math.atan2(d[0], d[2]), el = Math.asin(clamp(y, -1, 1)), e = 0.012 + r * 0.7;
    const DK = [0.1, 0.105, 0.12], back = smooth(-0.35, 0.35, d[2]);
    const c = y >= 0 ? mix3(mix3(bg, DK, smooth(0.04, 0.62, y)), mix3(bg, DK, smooth(0, 0.16, y)), back) : mix3(bg, low, smooth(0, 0.35, -y));
    let L = 0;
    if (dot(d, KEY) > 0.5) L += 3.4 * box(dot(d, KR), 0.24, e) * box(dot(d, KU), 0.17, e);
    L += 2.6 * box(az + 0.95, 0.075, e) * box(el - 0.36, 0.36, e);
    const LB = 2.2 * box(az - 1.05, 0.06, e) * box(el - 0.32, 0.28, e);
    const LC = 1.5 * box(az, 0.42, e) * box(el - 0.3, 0.055, e);
    L *= gain;
    return [c[0] + L + (LB * 0.92 + LC * 1.06) * gain, c[1] + L + (LB * 0.97 + LC * 0.98) * gain, c[2] + L + (LB * 1.08 + LC * 0.86) * gain];
  }
  /* Cheap shading for a secondary hit (key + sky, no AO; only the floor gets its shadow).
     over(h, rd, depth): optional override per hit (return null to fall through). */
  function secShade(h, rd, S, d0, over) {
    if (!h.hit) return null;
    if (over) { const o = over(h, rd, d0 + h.t); if (o) return o; }
    const n = LK.normal(h.p, h.id, S), a = LK.albedo(h.id);
    const dif = Math.max(0, dot(n, KEY)) * (h.id === 0 ? LK.shadow(add(h.p, mul(n, 0.01)), KEY, S, 12) : 1);
    const k = 1.05 * dif + 0.42 * (0.55 + 0.45 * n[1]) + Math.max(0, dot(n, LK.FILL)) * 0.35;
    const c = LK.tone([a[0] * k, a[1] * k, a[2] * k], 1.3);
    return h.id === 0 ? LK.floorFade(c, { depth: d0 + h.t, d: rd }) : c;
  }
  /* Soft shadow from one object only (glass-like looks need the occluders apart). */
  function shadowOf(id, p, l, S, k = 10) {
    if (id === 2) {
      const C = LK.SPH.c, r = LK.SPH.r, oc = sub(p, C), b = dot(oc, l), cc = dot(oc, oc) - r * r, h = b * b - cc;
      const dd = Math.sqrt(Math.max(0, r * r - h)) - r, tt = -b - Math.sqrt(Math.max(h, 0));
      if (tt <= 0) return 1;
      const x = clamp(0.25 * k * dd / tt); return x * x * (3 - 2 * x);
    }
    const C = id === 1 ? S.tok.c : LK.CUBE.c, r = id === 1 ? LK.TOK.bound : LK.CUBE.bound, sd = id === 1 ? LK.sdToken : LK.sdCube;
    const oc = sub(C, p), along = dot(oc, l);
    if (along < -r || V.len(sub(oc, mul(l, along))) - r > r * 0.6) return 1;
    let res = 1, t = Math.max(0.02, along - r - 0.05);
    for (let i = 0; i < 40 && t < along + r; i++) {
      const h = sd(add(p, mul(l, t)), S);
      res = Math.min(res, k * h / t);
      if (res < 0.002) return 0;
      t += clamp(h, 0.02, 0.4);
    }
    return clamp(res);
  }

  /* =====================================================================
     SUBSURFACE — light that enters a translucent solid, scatters and
     leaves somewhere else. The Token becomes orange wax and the sphere
     jade; the blue cube stays opaque as a control. Three cheap parts:
     wrap lighting, the N·L terminator pushed round the form further in
     red than in blue (red travels furthest in wax and skin), so the
     shadow edge bleeds warm; the soft shadow raised to a smaller power
     in red; and transmission: from every surface point that faces away
     from the light, LK.traceInside marches toward the light to find how
     much material is in the way, and exp(−thickness / mean free path)
     per channel — with a forward-scatter lobe toward the eye — lets the
     back light through where the solid is thin. Then the light swings
     behind the still life and the Token's edges and the rim of its hole
     light up. Against the split: the same light on plain Lambert diffuse.
     ===================================================================== */
  const SS = {
    alb: { 1: [1.0, 0.43, 0.15], 2: [0.46, 0.8, 0.56] },
    mfp: { 1: [0.85, 0.34, 0.14], 2: [0.45, 0.9, 0.55] },   // mean free path per channel, × radius
    sht: { 1: [0.4, 0.75, 1.0], 2: [0.6, 0.45, 0.8] },   // shadow exponent per channel (red bleeds)
    LI: [1.3, 1.22, 1.1], DIM: [0.27, 0.255, 0.25],
  };
  const KAZ = Math.atan2(KEY[0], KEY[2]), KEL = Math.asin(KEY[1]);
  const SW = [1.0, 2.4], SWING = [beat(6), beat(8.4)], SEND = [8.6, 9.5];
  const RADK = [[0, 0.34], [beat(10), 0.34], [beat(10) + 0.25, 0.16, E.outC], [beat(11), 0.16], [beat(11) + 0.25, 0.62, E.outC], [beat(12), 0.62], [beat(12) + 0.25, 0.4, E.outC], [10, 0.4]];
  const radAt = t => kf(t, RADK);
  const behindAt = t => E.ioC(seg(t, SWING[0], SWING[1]));
  function lightAt(t) {
    const u = behindAt(t), az = lerp(KAZ, 2.95, u), el = lerp(KEL, 0.3, u);
    return [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
  }
  // the reference: plain Lambert diffuse under the same moving light (also the opaque cube)
  function diffuseL(g, S, L, amb, bg, bh = 0) {
    if (!g.hit) return bg;
    const a = g.id === 1 || g.id === 2 ? SS.alb[g.id] : LK.albedo(g.id), n = g.n, ndl = dot(n, L);
    let sh = ndl > 0 ? LK.shadow(add(g.p, mul(n, 0.01)), L, S, 12) : 0;
    const occ = LK.ao(g.p, n, S);
    if (g.id === 0) sh *= lerp(1, Math.exp(-(g.p[0] * g.p[0] + g.p[2] * g.p[2]) / 7), bh);   // the back light is a spot on the still life
    const sky = amb * (0.55 + 0.45 * n[1]) * occ;
    const c = LK.tone([0, 1, 2].map(i => a[i] * (SS.LI[i] * 1.05 * Math.max(0, ndl) * sh + sky)), 1.3);
    return g.id === 0 ? LK.floorFade(c, g, bg) : c;
  }
  /* Light carried along one ray from a point just inside a translucent object toward the light:
     [r, g, b] transmission and the (expected) distance to where the ray leaves the solid.
     The Token is marched in small steps with a soft inside / outside test, and the ray leaves
     gradually: each step's share of air removes part of what is still inside, carrying
     exp(−material so far / mfp) out with it, times how squarely that spot faces the light
     (N·L from the SDF's slope along L, taken wide, so it is blurred). Every term is continuous in the start point,
     so a ray that just grazes the hole or a rounded edge and one that just misses it give nearly
     the same answer. (A hard exit test switches surface there — exit distance and exit normal
     jump — and with seven fanned rays that drew faint straight seams across the face.) The
     sphere is convex and analytic: its exact exit is already smooth. */
  const TR_DT = 0.03, TR_RAMP = 0.03, TR_AIR = 0.03, TR_MAX = 2.2;
  function carry(id, ro, rd, S, L, mfp) {
    const entryAt = ndl => clamp(ndl * 1.4 + 0.15);
    if (id === 2) {
      const ins = LK.traceInside(2, ro, rd, S), e = entryAt(dot(ins.n, L));
      return { t: ins.t, tr: mfp.map(m => Math.exp(-ins.t / m) * e) };
    }
    const sd = LK.sdToken, tr = [0, 0, 0];
    const mEnd = 4.6 * Math.max(mfp[0], mfp[1], mfp[2]);   // past this much material < 1% of any channel gets through
    let m = 0, surv = 1, tex = 0, s = 0.02;
    for (let step; s < TR_MAX && surv > 0.01 && m < mEnd; s += step) {
      /* Deep inside, the SDF bounds how far the ray can go and still be fully inside, so it
         strides; the stride grows continuously out of the fixed step, which keeps it seamless. */
      const q = add(ro, mul(rd, s)), d = sd(q, S), occ = clamp(0.5 - d / TR_RAMP);
      step = Math.max(TR_DT, -d - TR_RAMP / 2);
      m += occ * step;
      if (occ < 1) {
        const w = surv * (1 - Math.exp(-(1 - occ) * step / TR_AIR));
        if (w > 0.004) {
          // light enters with N·L at the exit: the SDF's slope along L there, taken wide (blurred)
          const e = 0.02, ndl = (sd([q[0] + L[0] * e, q[1] + L[1] * e, q[2] + L[2] * e], S) - sd([q[0] - L[0] * e, q[1] - L[1] * e, q[2] - L[2] * e], S)) / (2 * e);
          const k = w * entryAt(ndl);
          for (let i = 0; i < 3; i++) tr[i] += k * Math.exp(-m / mfp[i]);
        }
        tex += w * s; surv -= w;
      }
    }
    return { t: tex + surv * s, tr };
  }
  function translucent(g, S, L, R, amb, pass = 0) {
    const id = g.id, n = g.n, p = g.p, a = SS.alb[id], ndl = dot(n, L);
    const mfp = SS.mfp[id].map(v => v * R);
    // transmission through the solid
    let tr = [0, 0, 0], thick = Infinity;
    const gate = smooth(0.25, -0.15, ndl);
    if (gate > 0) {
      /* Seven rays: one straight toward the light, six fanned 55° round it. Through the middle of
         a slab the fanned rays travel far; near an edge or the hole they reach a lit side face
         quickly — so light diffusing in sideways makes the thin parts glow. */
      const T1 = norm(V.cross(L, Math.abs(L[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), T2 = V.cross(L, T1);
      const ro = add(p, mul(n, -0.004)), H = norm(add(L, mul(n, 0.35)));
      const lobe = 0.25 + 2.2 * Math.pow(clamp(dot(g.d, H)), 4);
      for (let k = 0; k < 7; k++) {
        const dir = k === 0 ? L : norm(add(mul(L, 0.574), mul(add(mul(T1, Math.cos(k * 1.0472)), mul(T2, Math.sin(k * 1.0472))), 0.819)));
        const ray = carry(id, ro, dir, S, L, mfp), wk = k === 0 ? 0.4 : 0.1;
        if (ray.t < thick) thick = ray.t;
        for (let i = 0; i < 3; i++) tr[i] += wk * ray.tr[i];
      }
      tr = tr.map((v, i) => v * lobe * gate * Math.sqrt(a[i]) * 2.0);
    }
    if (pass === 1) {   // thickness toward the light: thin = hot, lit face = dim blue
      if (!isFinite(thick)) return [0.1, 0.13, 0.2];
      const v = Math.exp(-thick / 0.45);
      return [clamp(v * 1.6), clamp(v * v * 1.3), clamp(v * v * v * 1.2)];
    }
    if (pass === 2) return tr.map(v => v * 1.6);
    // wrapped diffuse, softer and further round in the channels that scatter furthest
    const sh = ndl > -0.35 ? LK.shadow(add(p, mul(n, 0.012)), L, S, 6) : 0, self = smooth(-0.05, 0.35, ndl);
    const occ = Math.pow(LK.ao(p, n, S), 0.6), sky = amb * (0.55 + 0.45 * n[1]) * occ;
    const Hs = norm(sub(L, g.d)), spec = Math.pow(clamp(dot(n, Hs)), 60) * 0.32 * sh * smooth(0, 0.2, ndl);
    const out = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      const w = clamp(mfp[i] * 1.25, 0, 0.85), dif = clamp((ndl + w) / (1 + w)) * lerp(1, Math.pow(sh, SS.sht[id][i]), self);
      out[i] = a[i] * SS.LI[i] * 1.05 * dif + Math.sqrt(a[i]) * a[i] * sky * 1.15 + SS.LI[i] * tr[i] * 1.3 + spec;
    }
    return LK.tone(out, 1.3);
  }
  // top-down light plot: the still life, the camera and the light around it
  function lightPlot(c, x, y, r, S, L, on, dk) {
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    const ink = INK(dk);
    c.strokeStyle = dk ? 'rgba(236,232,223,0.35)' : 'rgba(23,24,28,0.3)'; c.lineWidth = 1.2; c.setLineDash([3, 4]);
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); c.setLineDash([]);
    c.fillStyle = ink; c.fillRect(x - 10, y - 3, 20, 6);   // the Token, seen from above
    const cp = S.cam.pos, ca = Math.atan2(cp[0], cp[2]), cx = x + Math.sin(ca) * r, cy = y + Math.cos(ca) * r;
    c.save(); c.translate(cx, cy); c.rotate(-ca); c.fillStyle = ink; c.fillRect(-9, -6, 18, 12); c.beginPath(); c.moveTo(-6, -6); c.lineTo(6, -6); c.lineTo(0, -15); c.fill(); c.restore();
    const la = Math.atan2(L[0], L[2]), lx = x + Math.sin(la) * r, ly = y + Math.cos(la) * r;
    c.strokeStyle = P.accent; c.lineWidth = 1.6; c.beginPath(); c.moveTo(lx, ly); c.lineTo(x + Math.sin(la) * 16, y + Math.cos(la) * 16); c.stroke();
    c.fillStyle = '#ffd27a'; c.beginPath(); c.arc(lx, ly, 9, 0, TAU); c.fill();
    c.strokeStyle = P.accent; c.lineWidth = 2; c.stroke();
    label(c, 'CAMERA', cx, cy + 32, { size: 11, ls: 1.5, align: 'center', color: SUBC(dk), dk });
    label(c, 'LIGHT', lx, ly - 16, { size: 11, ls: 1.5, align: 'center', color: SUBC(dk), dk });
    c.restore();
  }
  // diffusion profile: exp(−r / mfp) for each channel
  function profile(c, x, y, w, h, R, on, dk) {
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    label(c, 'SCATTER PROFILE  e^(−r / mfp)  ·  WAX', x, y - 10, { size: 13, ls: 2, color: SUBC(dk), weight: 700, dk });
    c.fillStyle = dk ? 'rgba(12,13,16,0.45)' : 'rgba(236,232,223,0.6)'; c.fillRect(x, y, w, h);
    c.strokeStyle = dk ? 'rgba(236,232,223,0.3)' : 'rgba(23,24,28,0.25)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const cols = ['#e8402a', '#3fae5a', '#3f6cf0'];
    for (let ch = 0; ch < 3; ch++) {
      const m = SS.mfp[1][ch] * R;
      c.strokeStyle = cols[ch]; c.lineWidth = 2.4; c.beginPath();
      for (let i = 0; i <= 60; i++) { const r = i / 60 * 1.2, px = x + i / 60 * w, py = y + h - 6 - Math.exp(-r / m) * (h - 14); i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.stroke();
    }
    label(c, 'R', x + w - 60, y + 22, { size: 12, color: cols[0], weight: 700, dk });
    label(c, 'G', x + w - 40, y + 22, { size: 12, color: cols[1], weight: 700, dk });
    label(c, 'B', x + w - 20, y + 22, { size: 12, color: cols[2], weight: 700, dk });
    label(c, '0', x, y + h + 18, { size: 11, ls: 1, color: SUBC(dk), dk });
    label(c, 'DEPTH INTO THE WAX  →  1.2', x + w, y + h + 18, { size: 11, ls: 1, align: 'right', color: SUBC(dk), dk });
    c.restore();
  }

  MG.film({
    id: 'looksss', dur: 10, poster: 7.0,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Subsurface', sub: 'Light that goes in, scatters and comes out somewhere else', era: '2001 —',
      origin: 'Henrik Wann Jensen, Steve Marschner, Marc Levoy and Pat Hanrahan’s “A Practical Model for Subsurface Light Transport” (SIGGRAPH 2001) made translucent materials — marble, milk, skin — practical to render with a dipole diffusion approximation, work later recognised with a Scientific and Technical Academy Award; translucent skin of this kind went into Gollum in The Lord of the Rings. Real-time engines then approximated it cheaply: texture-space diffusion for skin (NVIDIA’s Human Head demo, 2007), screen-space subsurface scattering (Jorge Jimenez and colleagues, 2009), and the thickness-based translucency Colin Barré-Brisebois and Marc Bouchard presented at GDC 2011 for back-lit thin parts. This look uses wrap lighting plus a traced thickness in that real-time spirit.',
      works: 'The Lord of the Rings: The Two Towers (Weta Digital, 2002; Gollum’s translucent skin) · NVIDIA Human Head demo (2007; texture-space diffusion) · “Approximating Translucency for a Fast, Cheap and Convincing Subsurface Scattering Look” (Barré-Brisebois & Bouchard, GDC 2011)',
      tech: ['Per-channel wrap lighting', 'Traced thickness toward the light', 'exp(−d / mfp) transmission, red-shifted'],
      accent: '#ff8a3d',
      motionDNA: 'The shared 10 s camera orbit with the Token bobbing and turning, which keeps changing how much wax lies between the light and each edge. A wipe turns plain Lambert diffuse into wax and jade under the front key; the light then swings round behind the still life over about two seconds while the studio dims, and the thin parts begin to glow. The scatter radius steps on the beat (0.34 → 0.16 → 0.62 → 0.40), the glow tightening and flooding with it, and a last split brings the plain diffuse back over the right half under the same back light.',
      visualDNA: 'Honey-orange wax and pale jade on the paper studio: soft terminators that bleed red, warm-edged shadows on the forms, a waxy highlight; then a dim, back-lit studio where the Token’s rim and the ring round its hole burn orange and the jade sphere glows green at its edge, while the opaque blue cube stays dark. A scatter-radius ruler, RGB diffusion profiles, a top-down light plot and thickness and transmission passes.',
      transitions: 'Wipe from diffuse to subsurface; the light swings behind; stepped scatter radius; split back to diffuse',
      implementation: ['Dipole diffusion BSSRDF (Jensen et al., 2001) and its descendants in offline renderers (random-walk SSS in Arnold, RenderMan, Cycles)', 'Real-time approximations: wrap lighting, screen-space diffusion, thickness-map translucency', 'Canvas 2D + SDF tracer (js/look-kit.js): per-channel wrap and shadow exponents, LK.traceInside toward the light for thickness, exp(−d / mfp) per channel with a forward-scatter lobe'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const s1 = E.ioC(seg(t, SW[0], SW[1])), s2 = lerp(1, 0.5, E.ioC(seg(t, SEND[0], SEND[1])));
      const split = Math.min(s1, s2), L = lightAt(t), R = radAt(t), bh = behindAt(t);
      const amb = lerp(0.42, 0.2, bh), bg = mix3(LK.BG, SS.DIM, bh), dk = bh > 0.55;
      const shade = (g, S) => {
        if (g.u >= split || !(g.id === 1 || g.id === 2)) return diffuseL(g, S, L, amb, bg, bh);
        return translucent(g, S, L, R, amb);
      };
      const { G, S } = LK.render(c, t, W, H, shade);
      wipeLine(c, s1, W, H, 'SUBSURFACE', 'LAMBERT DIFFUSE', 1, dk);
      wipeLine(c, s2, W, H, 'SUBSURFACE', 'LAMBERT DIFFUSE', 1, dk, 560);
      // front-lit: what the wrap does
      const on1 = pulse(t, 2.6, 4.3, 0.35);
      callout(c, S, W, H, add(LK.SPH.c, [0.62, 0.05, 0.3]), 60, -250, 'WRAP LIGHTING', 'N·L pushed past the terminator', on1 * seg(t, 2.6, 3.0));
      callout(c, S, W, H, tokPt(S, -0.75, -0.6, 0.23), -120, 180, 'RED BLEEDS FURTHEST', 'shadow edge warms, blue cuts off first', on1 * seg(t, 3.0, 3.4));
      callout(c, S, W, H, add(LK.CUBE.c, [-0.3, 0.3, 0.5]), 60, -230, 'OPAQUE CONTROL', 'plain diffuse cube', on1 * seg(t, 3.4, 3.8));
      // back-lit: where it glows
      const on2 = pulse(t, 6.1, 8.6, 0.35);
      callout(c, S, W, H, tokPt(S, 0.4, 0.4 + LK.TOK.holeR + 0.03, 0.15), 110, -110, 'THIN RIM ROUND THE HOLE', 'light leaks in from the hole wall', on2 * seg(t, 6.1, 6.5), true);
      callout(c, S, W, H, tokPt(S, -0.99, -0.2, 0.1), -150, 200, 'EDGES GLOW', 'short path → exp(−d / mfp) ≈ 1', on2 * seg(t, 6.5, 6.9), true);
      callout(c, S, W, H, add(LK.SPH.c, [0.45, -0.35, 0.5]), 130, 170, 'JADE', 'green travels furthest', on2 * seg(t, 6.9, 7.3), true);
      inset(c, G, W, 0, 'PASS · THICKNESS TOWARD THE LIGHT', (g, S) => (g.id === 1 || g.id === 2 ? translucent(g, S, L, R, amb, 1) : [0.05, 0.05, 0.06]), pulse(t, 2.8, 9.6, 0.35), dk);
      inset(c, G, W, 1, 'PASS · TRANSMISSION  e^(−d / mfp)', (g, S) => (g.id === 1 || g.id === 2 ? translucent(g, S, L, R, amb, 2) : [0.05, 0.05, 0.06]), pulse(t, 3.6, 9.6, 0.35), dk);
      // top-left
      if (t < SW[0] + 0.2) tag(c, 'REFERENCE  ·  LAMBERT DIFFUSE, SAME LIGHT', 72, 80, seg(t, 0.1, 0.5));
      else if (t < SWING[0]) tag(c, 'FRONT LIGHT  ·  WRAP  (N·L + w) / (1 + w)', 72, 80);
      else if (t < SWING[1] - 0.3) tag(c, 'THE LIGHT MOVES BEHIND', 72, 80, 1, dk);
      else tag(c, 'BACK LIGHT  ·  TRANSMISSION THROUGH THIN WAX', 72, 80, 1, dk);
      const rOn = seg(t, 1.6, 2.0);
      readout(c, 98, 136, 'SCATTER RADIUS  (MEAN FREE PATH, RED)', R.toFixed(2), R / 0.8, [[0, '0'], [0.2, 'SKIN'], [0.5, 'WAX'], [0.8, 'MILK']].map(([v, s]) => [v / 0.8, s]), rOn, dk);
      profile(c, 98, 300, 420, 96, R, rOn, dk);
      lightPlot(c, 190, 540, 62, S, L, rOn, dk);
      if (rOn > 0) label(c, `LIGHT  ${bh < 0.5 ? 'IN FRONT' : 'BEHIND'}`, 290, 546, { size: 14, ls: 2, color: INK(dk), weight: 700, dk });
      LK.caption(c, t, W, H, { name: 'Subsurface', cat: 'Material', dark: dk, curve: u => radAt(u * 10) / 0.7, span: [0, 10], lo: -0.1, hi: 1.1, curveLabel: 'SCATTER RADIUS / TIME' });
    },
    score(A) {
      LK.bed(A);
      // warm, soft: a felt-like low pluck and a breathy swell
      A.whoosh(SW[0], SW[1] - SW[0], { f1: 160, f2: 1100, q: 0.9, g: 0.09, swell: 0.6, rev: 0.5, pan: -0.3 });
      A.pluck(SW[1], midi(57), { g: 0.16, bright: 0.2, dur: 1.8, lp: 1500 });
      [2.6, 3.0, 3.4].forEach((t, i) => A.osc(t, { type: 'triangle', f: midi(69 + [0, 4, 7][i]), dur: 0.4, g: 0.05, lp: 1600, rev: 0.4 }));
      // the light swings behind: a slow rising glow
      A.osc(SWING[0], { type: 'sawtooth', f: midi(45), f2: midi(52), glide: SWING[1] - SWING[0], dur: SWING[1] - SWING[0] + 0.6, g: 0.035, a: 1.2, lp: 500, lp2: 2200, lpT: SWING[1] - SWING[0], rev: 0.6 });
      A.chord(SWING[1], [52, 59, 64, 68], { type: 'triangle', dur: 2.6, g: 0.035, a: 0.4, lp: 1600, rev: 0.7, width: 0.8 });
      [6.1, 6.5, 6.9].forEach((t, i) => A.bell(t, midi([76, 80, 83][i]), { g: 0.04, dur: 1.2, rev: 0.6, pan: (i - 1) * 0.4 }));
      // scatter radius steps: the filter on a soft tone opens and closes with the radius
      [[beat(10), 0.16], [beat(11), 0.62], [beat(12), 0.4]].forEach(([t, r]) => {
        A.osc(t, { type: 'sawtooth', f: midi(52), dur: 0.6, g: 0.04, lp: 400 + r * 3600, rev: 0.5 });
        A.noise(t, { type: 'lowpass', f: 300 + r * 1500, dur: 0.12, g: 0.05 });
      });
      A.whoosh(SEND[0], SEND[1] - SEND[0], { f1: 200, f2: 1400, q: 0.9, g: 0.07, swell: 0.6, rev: 0.5, pan: 0.3 });
      A.pluck(SEND[1], midi(64), { g: 0.12, bright: 0.25, dur: 1.6, lp: 1800 });
    },
  });

  /* =====================================================================
     IRIDESCENCE — thin-film interference. Light reflected from the top
     and the bottom of a film a few hundred nanometres thick interferes:
     the bottom ray travels an extra optical path 2·n·d·cos θt, so each
     wavelength is reinforced or cancelled by cos(4π·n·d·cos θt / λ).
     Reflectance is summed over 35 wavelengths with the Airy two-surface
     formula and converted to RGB through analytic CIE colour-matching
     fits, into a lookup table of thickness × view angle. On a dark set
     the sphere becomes a soap bubble (both walls reflect, light passes
     straight through; the film drains thinner at the top and swirls),
     and the Token a beetle-shell lacquer: a film over a dark reflective
     base. Thickness steps on the beat, then its noise grows.
     ===================================================================== */
  const XYZ2RGB = [3.2406, -1.5372, -0.4986, -0.9689, 1.8758, 0.0415, 0.0557, -0.204, 1.057];
  function cmf(l) {
    const g = (mu, s1, s2) => { const x = (l - mu) / (l < mu ? s1 : s2); return Math.exp(-0.5 * x * x); };
    return [1.056 * g(599.8, 37.9, 31.0) + 0.362 * g(442.0, 16.0, 26.7) - 0.065 * g(501.1, 20.4, 26.2),
      0.821 * g(568.8, 46.9, 40.5) + 0.286 * g(530.9, 16.3, 31.1),
      1.217 * g(437.0, 11.8, 36.0) + 0.681 * g(459.0, 26.0, 13.8)];
  }
  const SPEC = [];
  for (let l = 380; l <= 720; l += 10) {
    const x = cmf(l), M = XYZ2RGB;
    SPEC.push([l, M[0] * x[0] + M[1] * x[1] + M[2] * x[2], M[3] * x[0] + M[4] * x[1] + M[5] * x[2], M[6] * x[0] + M[7] * x[1] + M[8] * x[2]]);
  }
  const WHITE = [0, 1, 2].map(i => SPEC.reduce((s, q) => s + q[i + 1], 0));
  const ND = 241, DMAX = 1200, NC = 33;   // 5 nm steps to 1200 nm, cos θ in 32 steps
  function buildLUT(nf, r1, r2) {
    const T = new Float32Array(ND * NC * 3);
    for (let di = 0; di < ND; di++) {
      const d = di / (ND - 1) * DMAX;
      for (let ci = 0; ci < NC; ci++) {
        const ci2 = ci / (NC - 1), cosT = Math.sqrt(1 - (1 - ci2 * ci2) / (nf * nf));
        let r = 0, g = 0, b = 0;
        for (const [l, sr, sg, sb] of SPEC) {
          const cd = Math.cos(4 * Math.PI * nf * d * cosT / l), q = 2 * r1 * r2 * cd;
          const R = (r1 * r1 + r2 * r2 + q) / (1 + r1 * r1 * r2 * r2 + q);
          r += R * sr; g += R * sg; b += R * sb;
        }
        const k = (di * NC + ci) * 3;
        T[k] = Math.max(0, r / WHITE[0]); T[k + 1] = Math.max(0, g / WHITE[1]); T[k + 2] = Math.max(0, b / WHITE[2]);
      }
    }
    return T;
  }
  const FILM = {
    bub: { nf: 1.33, r1: (1 - 1.33) / 2.33, r2: (1.33 - 1) / 2.33, T: null },
    tok: { nf: 1.56, r1: (1 - 1.56) / 2.56, r2: 0.45, T: null },
  };
  function film(f, d, cosI) {
    if (!f.T) f.T = buildLUT(f.nf, f.r1, f.r2);
    const x = clamp(d / DMAX) * (ND - 1), y = clamp(cosI) * (NC - 1);
    const x0 = Math.min(ND - 2, x | 0), y0 = Math.min(NC - 2, y | 0), fx = x - x0, fy = y - y0, T = f.T, out = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      const a = T[(x0 * NC + y0) * 3 + i], b = T[((x0 + 1) * NC + y0) * 3 + i], c = T[(x0 * NC + y0 + 1) * 3 + i], e = T[((x0 + 1) * NC + y0 + 1) * 3 + i];
      out[i] = lerp(lerp(a, b, fx), lerp(c, e, fx), fy);
    }
    return out;
  }
  const IW = [1.0, 2.4];
  const D0K = [[0, 420], [beat(5), 420], [beat(5) + 0.3, 250, E.outC], [beat(6), 250], [beat(6) + 0.3, 560, E.outC], [beat(7), 560], [beat(7) + 0.3, 780, E.outC], [beat(8), 780], [beat(8) + 0.3, 430, E.outC], [10, 430]];
  const d0At = t => kf(t, D0K);
  const ampAt = t => lerp(70, 170, E.ioC(seg(t, 6.4, 8.2)));
  const flowAt = t => 0.12 * t + 0.5 * E.ioC(seg(t, 6.4, 10));
  const DBG = [0.035, 0.038, 0.048], DLOW = [0.05, 0.05, 0.055];
  const denv = (d, r = 0) => {   // the dark set's environment: the l1 studio, dimmed, plus a faint overhead dome
    const e = env(d, r, [0.12, 0.12, 0.135], DLOW, 1.1), az = Math.atan2(d[0], d[2]), el = Math.asin(clamp(d[1], -1, 1));
    // + a faint overhead dome and a big soft panel behind the camera, the bubble photographer's light
    const k = 0.3 * smooth(0.2, 0.9, d[1]) + 2.4 * box(az, 0.75, 0.35) * box(el - 0.3, 0.38, 0.2);
    return [e[0] + k, e[1] + k, e[2] + k * 1.05];
  };
  /* What the bubble reflects: the dark set plus the big overhead softbox a bubble photographer
     hangs above it. Without it the upper half of the bubble mirrors the black ceiling and its film
     has nothing to colour; with it the drained, thinner top shows its first-order golds and
     magentas instead of going dark. Only the bubble sees it, so the shell's lacquer is unchanged. */
  const benv = (d, r = 0) => {
    const e = denv(d, r), k = 1.7 * smooth(0.15, 0.75, d[1]) * (0.8 + 0.2 * smooth(-0.6, 0.6, d[2]));
    return [e[0] + k, e[1] + k, e[2] + k * 1.04];
  };
  function darkBg(g) {   // dark set: a soft pool of light behind the still life
    const x = g.u - 0.5, y = g.v - 0.42, k = Math.exp(-(x * x * 2.2 + y * y * 5));
    return [DBG[0] + 0.07 * k, DBG[1] + 0.072 * k, DBG[2] + 0.085 * k];
  }
  // film thickness at a surface point, in nm
  function thickAt(id, p, S, t, d0, amp) {
    if (id === 1) {
      const q = tokLocal(S, p);
      return Math.max(0, d0 + amp * 1.8 * (fbm3(q[0] * 1.3 + 3.1, q[1] * 1.3, q[2] * 1.3 + flowAt(t) * 0.4) - 0.5));
    }
    const q = sub(p, LK.SPH.c), r = LK.SPH.r, f = (1 - q[1] / r) / 2;   // 0 at the top, 1 at the bottom
    const a = Math.atan2(q[2], q[0]) + flowAt(t) * 1.4 + f * 2.2, s = Math.sqrt(Math.max(0, 1 - (q[1] / r) ** 2));
    const nz = fbm3(Math.cos(a) * s * 1.8 + 7, q[1] / r * 2.2 - flowAt(t) * 0.8, Math.sin(a) * s * 1.8);
    return Math.max(0, d0 * (0.3 + 1.15 * f) + amp * 2 * (nz - 0.5));
  }
  // dark-set floor and cube (also what reflections see); the bubble casts almost no shadow
  function darkFloor(p, rd, depth, S, g) {
    const sh = Math.min(shadowOf(1, p, KEY, S, 10), shadowOf(3, p, KEY, S, 10)) * lerp(1, shadowOf(2, p, KEY, S, 10), 0.12);
    const pool = Math.exp(-(p[0] * p[0] + (p[2] - 0.2) * (p[2] - 0.2)) / 18), occ = LK.ao(p, [0, 1, 0], S, 4, 0.3);
    const k = (0.55 * KEY[1] * sh + 0.07) * pool * (0.4 + 0.6 * occ), a = 0.22;
    const c = LK.tone([a * k, a * k * 1.02, a * k * 1.1], 1.3);
    const bg = g ? darkBg(g) : DBG;
    return LK.floorFade(c, { depth, d: rd }, bg);
  }
  function darkSolid(id, p, n, S) {
    const a = LK.albedo(id), ndl = Math.max(0, dot(n, KEY));
    const k = 0.95 * ndl + 0.12 * (0.55 + 0.45 * n[1]);
    return LK.tone([a[0] * k, a[1] * k, a[2] * k], 1.2);
  }
  function irSec(S, t, d0, amp) {   // what a reflection or the bubble's see-through ray finds
    return (h, rd, depth) => {
      if (h.id === 0) return darkFloor(h.p, rd, depth, S, null);
      const n = LK.normal(h.p, h.id, S);
      if (h.id === 3) return darkSolid(3, h.p, n, S);
      if (h.id === 1) { const f = film(FILM.tok, thickAt(1, h.p, S, t, d0, amp), clamp(-dot(rd, n))), e = denv(reflect(rd, n), 0.15); return f.map((v, i) => v * (e[i] + 0.4)); }
      return denv(rd);   // the bubble: see straight through
    };
  }
  function iridescent(g, S, t, d0, amp, pass = 0) {
    const id = g.id, d = g.d, n = g.n, cosI = clamp(-dot(d, n)), th = thickAt(id, g.p, S, t, d0, amp);
    if (pass === 1) { const v = clamp(th / 1000); return [v * 0.95 + 0.05, v * 0.9 + 0.05, v * 0.8 + 0.08]; }
    if (pass === 2) return [cosI, cosI * 0.85 + 0.1, 0.35 + 0.65 * cosI * cosI];
    const sec = irSec(S, t, d0, amp), Rd = reflect(d, n), graze = Math.pow(1 - cosI, 5);
    if (id === 1) {   // beetle shell: film over a dark reflective base (reflects the environment only)
      const refl = denv(Rd, 0.14);   // a little rough, so thin bevel highlights don't alias
      const f = satur(film(FILM.tok, th, cosI), 1.15).map(v => v * (1 + 1.6 * graze));
      const ndl = dot(n, KEY), sh = ndl > 0 ? LK.shadow(add(g.p, mul(n, 0.01)), KEY, S, 12) : 0;
      const Hk = norm(sub(KEY, d)), sp = Math.pow(clamp(dot(n, Hk)), 16) * 1.4 * sh;
      const irr = 0.3 * (0.55 + 0.45 * n[1]) + 0.85 * Math.max(0, ndl) * sh;
      return softClip([0, 1, 2].map(i => 0.012 * irr + f[i] * (refl[i] * 0.5 + irr * 0.6 + sp)));
    }
    // soap bubble: front wall reflects, back wall reflects, the rest goes straight through
    const hr = LK.trace(add(g.p, mul(n, 0.004)), Rd, S, { skip: id });
    const refl = hr.hit ? sec(hr, Rd, g.depth) : benv(Rd);
    const fr = satur(film(FILM.bub, th, cosI), 1.3).map(v => clamp(v * (1 + 22 * graze) * 3, 0, 0.95));
    const C = LK.SPH.c, oc = sub(g.p, C), b = dot(oc, d), tt = -2 * b, ex = add(g.p, mul(d, Math.max(0, tt)));
    const n2 = norm(sub(ex, C)), c2 = clamp(dot(d, n2)), th2 = thickAt(2, ex, S, t, d0, amp);
    const fb = satur(film(FILM.bub, th2, c2), 1.3).map(v => clamp(v * (1 + 22 * Math.pow(1 - c2, 5)) * 1.6, 0, 0.9));
    const backR = benv(reflect(d, mul(n2, -1)), 0.05);
    const ht = LK.trace(add(ex, mul(d, 0.01)), d, S, { skip: 2 });
    const through = ht.hit ? sec(ht, d, g.depth + tt) : darkBg(g);
    return softClip([0, 1, 2].map(i => (1 - fr[i]) * ((1 - fb[i]) * through[i] + fb[i] * backR[i]) + fr[i] * refl[i]));
  }
  // colour of the film at thickness d seen face-on (for the ruler), and across angles (the strip)
  const chart = (f, d, cosI, gain) => satur(film(f, d, cosI), 1.35).map(v => clamp(v * gain));

  MG.film({
    id: 'lookiridescent', dur: 10, poster: 7.0,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Iridescence', sub: 'Thin-film interference: colour from thickness and angle', era: '1704 / 1990s —',
      origin: 'Robert Hooke described the colours of thin plates in Micrographia (1665), and Isaac Newton measured them in Opticks (1704) — Newton’s rings, where colour follows the thickness of a film of air. Thomas Young explained them by interference around 1801: light reflected from the top and the bottom of a film recombines in or out of phase depending on the extra path 2·n·d·cos θ and the wavelength. Spectral and wave-optics renderers simulate it directly; production shaders approximate it, and Laurent Belcour and Pascal Barla’s “A Practical Extension to Microfacet Theory for the Modeling of Varying Iridescence” (SIGGRAPH 2017) made thin-film colour a standard layer of physically based materials.',
      works: 'Newton’s rings (Isaac Newton, Opticks, 1704) · Favrile glass (Louis Comfort Tiffany, 1890s; iridescent art glass) · Belcour & Barla, “A Practical Extension to Microfacet Theory for the Modeling of Varying Iridescence” (SIGGRAPH 2017)',
      tech: ['Two-beam Airy reflectance per λ', 'Spectral → RGB via CIE fits, LUT d × θ', 'Thickness noise, draining, swirl'],
      accent: '#7a5cff',
      motionDNA: 'The shared camera orbit sweeps the view angle across every surface, so bands of colour slide over the bevels of the Token and round the bubble as the camera moves. A wipe turns the plain paper studio into a dark set with a soap-bubble sphere and a beetle-shell Token; the film thickness then steps on the beat (420 → 250 → 560 → 780 → 430 nm), recolouring both at once, and the thickness noise grows from ±70 to ±170 nm while the bubble’s film drains and swirls faster.',
      visualDNA: 'A near-black studio with softbox reflections: a nearly invisible bubble drawn only by its reflections — magenta, gold, green and blue bands, darker at the thin top, the softboxes doubled on the front and back walls — and a dark Token whose lacquer glows through gold, violet and teal with angle. An interference-colour chart as the thickness ruler, a hue-vs-angle strip, thickness and view-angle passes.',
      transitions: 'Wipe from the plain studio to the dark set; beat-stepped film thickness; thickness noise ramp',
      implementation: ['Thin-film interference layers in production shaders (e.g. Arnold and RenderMan thin-film parameters, Belcour & Barla 2017)', 'Spectral rendering and CIE colour-matching functions (analytic fits by Wyman, Sloan and Shirley, 2013)', 'Canvas 2D + SDF tracer (js/look-kit.js): Airy two-beam reflectance over 35 wavelengths into a thickness × cos θ LUT, traced reflection, straight-through bubble with front- and back-wall films'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const s1 = E.ioC(seg(t, IW[0], IW[1])), d0 = d0At(t), amp = ampAt(t), dk = true;
      const shade = (g, S) => {
        if (g.u >= s1) return LK.plain(g, S);
        if (!g.hit) return darkBg(g);
        if (g.id === 1 || g.id === 2) return iridescent(g, S, t, d0, amp);
        if (g.id === 0) return darkFloor(g.p, g.d, g.depth, S, g);
        return darkSolid(3, g.p, g.n, S);
      };
      const { G, S } = LK.render(c, t, W, H, shade);
      wipeLine(c, s1, W, H, 'THIN FILM', 'PLAIN', 1, dk);
      const on1 = pulse(t, 2.6, 6.2, 0.35), on2 = pulse(t, 6.6, 9.6, 0.35);
      callout(c, S, W, H, tokPt(S, 0.2, -0.99, 0.12), 260, 170, 'HUE SHIFTS WITH ANGLE', 'grazing → shorter path → bluer', on1 * seg(t, 2.6, 3.0), dk);
      callout(c, S, W, H, add(LK.SPH.c, [0.25, 0.68, 0.2]), 150, -40, 'THIN AT THE TOP', 'the film drains downward', on1 * seg(t, 3.0, 3.4), dk);
      callout(c, S, W, H, add(LK.SPH.c, [0.35, -0.1, 0.66]), 170, 170, 'TWO REFLECTIONS', 'front wall + back wall of the bubble', on1 * seg(t, 3.4, 3.8), dk);
      callout(c, S, W, H, tokFace(S), -250, 320, 'THICKNESS NOISE', `±${amp.toFixed(0)} nm across the surface`, on2 * seg(t, 6.6, 7.0), dk);
      inset(c, G, W, 0, 'PASS · FILM THICKNESS  0–1000 nm', (g, S) => (g.id === 1 || g.id === 2 ? iridescent(g, S, t, d0, amp, 1) : [0.02, 0.02, 0.025]), pulse(t, 2.9, 9.6, 0.35), dk);
      inset(c, G, W, 1, 'PASS · VIEW ANGLE  cos θ', (g, S) => (g.id === 1 || g.id === 2 ? iridescent(g, S, t, d0, amp, 2) : [0.02, 0.02, 0.025]), pulse(t, 3.3, 9.6, 0.35), dk);
      // top-left
      if (t < IW[0] + 0.2) tag(c, 'REFERENCE  ·  PLAIN MATERIALS', 72, 80, seg(t, 0.1, 0.5));
      else if (t < beat(5)) tag(c, 'THIN FILM  ·  PATH DIFFERENCE 2·n·d·cos θt', 72, 80, 1, dk);
      else if (t < 6.4) tag(c, 'FILM THICKNESS  ·  STEPPED ON THE BEAT', 72, 80, 1, dk);
      else tag(c, 'THICKNESS NOISE  ·  DRAINING + SWIRLING', 72, 80, 1, dk);
      const rOn = seg(t, 1.6, 2.0);
      readout(c, 98, 136, 'FILM THICKNESS  d', `${d0.toFixed(0)} nm`, d0 / 1000, [[0, '0'], [0.25, '250'], [0.5, '500'], [0.75, '750'], [1, '1000']], rOn, dk, (c2, x, y, w) => {
        for (let i = 0; i < w; i += 2) { c2.fillStyle = rgbStr(chart(FILM.bub, i / w * 1000, 1, 11)); c2.fillRect(x + i, y, 2, 14); }
        c2.strokeStyle = 'rgba(236,232,223,0.4)'; c2.lineWidth = 1; c2.strokeRect(x - 0.5, y - 0.5, w + 1, 15);
      });
      if (rOn > 0) {
        c.save(); c.globalAlpha *= rOn;
        label(c, 'INTERFERENCE COLOURS  ·  SOAP FILM n = 1.33', 98, 268, { size: 12, ls: 1.5, color: SUBC(dk), dk });
        // hue vs view angle at the current thickness
        const x = 98, y = 316, w = 420;
        label(c, `HUE vs VIEW ANGLE  ·  d = ${d0.toFixed(0)} nm`, x, y - 12, { size: 13, ls: 2, color: SUBC(dk), weight: 700, dk });
        for (const [k, f, gain, nm] of [[0, FILM.bub, 11, 'BUBBLE'], [1, FILM.tok, 2.2, 'SHELL']]) {
          for (let i = 0; i < w; i += 2) {
            const ang = i / w * 85 * Math.PI / 180;
            c.fillStyle = rgbStr(chart(f, d0, Math.cos(ang), gain)); c.fillRect(x + i, y + k * 34, 2, 26);
          }
          c.strokeStyle = 'rgba(236,232,223,0.4)'; c.strokeRect(x - 0.5, y + k * 34 - 0.5, w + 1, 27);
          label(c, nm, x + w + 12, y + k * 34 + 19, { size: 12, ls: 1.5, color: SUBC(dk), dk });
        }
        [0, 30, 60, 85].forEach(a => label(c, a + '°', x + a / 85 * w, y + 86, { size: 11, ls: 1, align: 'center', color: SUBC(dk), dk }));
        c.restore();
      }
      LK.caption(c, t, W, H, { name: 'Iridescence', cat: 'Material', dark: true, curve: u => d0At(u * 10) / 1000, span: [0, 10], lo: 0, hi: 1, curveLabel: 'FILM THICKNESS / TIME' });
    },
    score(A) {
      LK.bed(A);
      // glassy, shimmering: detuned sine pairs whose beating reads as interference
      const shimmer = (t, m, g = 0.05, pan = 0, dur = 1.6) => { A.osc(t, { f: midi(m), dur, g, a: 0.02, rev: 0.7, pan }); A.osc(t, { f: midi(m) * 1.006, dur, g: g * 0.8, a: 0.02, rev: 0.7, pan: -pan }); };
      A.whoosh(IW[0], IW[1] - IW[0], { f1: 800, f2: 5200, q: 2.2, g: 0.08, swell: 0.6, rev: 0.5 });
      shimmer(IW[1], 79, 0.06);
      [2.6, 3.0, 3.4].forEach((t, i) => A.osc(t, { f: midi(88 + [0, 3, 7][i]), dur: 0.3, g: 0.03, rev: 0.5, pan: (i - 1) * 0.4 }));
      // thickness steps: a new chord colour for each film order
      [[beat(5), 74], [beat(6), 79], [beat(7), 83], [beat(8), 76]].forEach(([t, m], i) => { shimmer(t, m, 0.05, (i % 2 ? 0.3 : -0.3), 1.2); A.noise(t, { type: 'bandpass', f: 3000 + i * 900, q: 4, dur: 0.12, g: 0.04 }); });
      // noise growing: a slow swirl of partials
      for (let k = 0; k < 8; k++) A.osc(6.5 + k * 0.38, { f: midi(84 + [0, 5, 2, 9, 7, 12, 4, 14][k]), dur: 0.9, g: 0.022, a: 0.1, rev: 0.7, pan: Math.sin(k * 1.7) * 0.6 });
      A.chord(beat(12), [50, 57, 62, 66, 69], { type: 'triangle', dur: 1.8, g: 0.028, a: 0.3, lp: 2400, rev: 0.7, width: 0.9 });
    },
  });

  /* =====================================================================
     CLEAR COAT — a layered material: a coloured base under a separate,
     perfectly smooth dielectric layer. The base lobe is what a paint or
     glaze does on its own: diffuse colour, a broad tinted metallic sheen
     and, on the Token's candy-orange car paint, metallic flakes — tiny
     tilted mirrors in a 3D cell grid that glint when they line up with
     the key. On top, the coat lobe: one traced reflection of the studio
     weighted by Schlick Fresnel with F0 = 0.04, so it is faint face-on
     and strong at grazing angles; the base receives what the coat does
     not reflect. The coat is kept in its own buffer so its roughness can
     blur it alone (an edge-aware box blur) without softening the flakes.
     The coat goes off, fades back in, roughens on the beat, then a split
     shows coat on against coat off. Unlike Chrome, the base stays.
     ===================================================================== */
  const CC = {
    alb: { 1: [0.95, 0.24, 0.035], 2: [0.035, 0.27, 0.3], 3: [0.08, 0.2, 0.75] },
    metal: { 1: 1, 2: 0, 3: 0 },
    FS: 0.013,   // flake cell size
  };
  const CW = [1.0, 2.4], COFF = beat(6), CON = [beat(7.5), beat(8.4)], CEND = [8.7, 9.5];
  const CRK = [[0, 0.0], [beat(9), 0.0], [beat(9) + 0.25, 0.1, E.outC], [beat(10), 0.1], [beat(10) + 0.25, 0.22, E.outC], [beat(11), 0.22], [beat(11) + 0.25, 0.38, E.outC], [beat(12) - 0.2, 0.38], [beat(12) + 0.1, 0.0, E.ioC], [10, 0.0]];
  const coatRough = t => kf(t, CRK);
  const coatStr = t => (t < COFF ? 1 : t < CON[0] ? 0 : E.ioC(seg(t, CON[0], CON[1])));
  const strCurve = t => (t < COFF ? 1 : t < COFF + 0.05 ? 1 - (t - COFF) / 0.05 : t < CON[0] ? 0 : E.ioC(seg(t, CON[0], CON[1])));
  let CB = null, CBN = null;   // the coat lobe, per pixel of the main render (summed over AA samples)
  function baseLobe(g, S, pass = 0) {
    const id = g.id, n = g.n, p = g.p, d = g.d, a = CC.alb[id], m = CC.metal[id];
    const ndl = dot(n, KEY), sh = ndl > 0 ? LK.shadow(add(p, mul(n, 0.01)), KEY, S, 12) : 0, occ = LK.ao(p, n, S);
    const sky = 0.42 * (0.55 + 0.45 * n[1]) + Math.max(0, dot(n, LK.FILL)) * 0.3;
    const dk = (1 - 0.55 * m);
    let col = a.map(v => v * dk * (1.05 * Math.max(0, ndl) * sh + sky * occ));
    // broad base gloss (rough, tinted for metal, faint and white for the glaze)
    const Rb = reflect(d, n), eb = env(Rb, 0.5), Hk = norm(sub(KEY, d)), nh = clamp(dot(n, Hk));
    const gl = m ? 0.42 : 0.06;
    col = col.map((v, i) => v + (m ? a[i] : 1) * gl * (eb[i] * 0.5 * occ + Math.pow(nh, 18) * 1.6 * sh));
    if (m) {   // metallic flakes: each cell a tilted mirror, a third of them reflective
      const q = tokLocal(S, p), fx = Math.floor(q[0] / CC.FS), fy = Math.floor(q[1] / CC.FS), fz = Math.floor(q[2] / CC.FS);
      const hh = h3(fx, fy, fz);
      if (hh < 0.55) {
        const j = [h3(fx + 17, fy, fz) - 0.5, h3(fx, fy + 29, fz) - 0.5, h3(fx, fy, fz + 41) - 0.5];
        const nf = norm(add(n, mul(j, 0.55)));
        const gl2 = Math.pow(clamp(dot(nf, Hk)), 70) * 1.5 * sh + Math.pow(clamp(dot(reflect(d, nf), [0, 1, 0]) * 0.5 + 0.5), 6) * 0.3 * occ;
        const fc = mix3(a, [1, 0.85, 0.7], 0.25);
        col = col.map((v, i) => v + fc[i] * gl2 * (0.3 + hh));
      }
    }
    if (pass === 1) return LK.tone(col, 1.3);
    return col;
  }
  /* The product-shot studio: Chrome's environment plus two tall strip lights behind the camera and a long horizon strip,
     so the coat on the faces turned toward the lens has something sharp to reflect. */
  function ccEnv(d, r) {
    const e = env(d, r), az = Math.atan2(d[0], d[2]), el = Math.asin(clamp(d[1], -1, 1)), w = 0.012 + r * 0.7;
    const s = 2.4 * (box(az - 0.42, 0.05, w) + box(az + 0.5, 0.035, w)) * box(el - 0.25, 0.42, w)
      + 5.5 * box(el - 0.1, 0.035, w) * box(az + 0.1, 1.3, w * 3);   // a long horizon strip at eye level
    return [e[0] + s, e[1] + s, e[2] + s * 1.04];
  }
  function coatLobe(g, S, rough) {
    const n = g.n, d = g.d, cs = clamp(-dot(d, n)), F = 0.04 + 0.96 * Math.pow(1 - cs, 5);
    const R = reflect(d, n), h = LK.trace(add(g.p, mul(n, 0.004)), R, S);
    let e;
    if (!h.hit) e = ccEnv(R, rough);
    else if (h.id === 0) e = secShade(h, R, S, g.depth);
    else { const nn = LK.normal(h.p, h.id, S), ndl = Math.max(0, dot(nn, KEY)), a = CC.alb[h.id] || LK.albedo(h.id); e = LK.tone(a.map(v => v * (1.05 * ndl + 0.42 * (0.55 + 0.45 * nn[1]))), 1.3); }
    return [e[0] * F, e[1] * F, e[2] * F, F];
  }
  // edge-aware separable box blur of the coat buffer, then composite it over the base
  function coatPost(rgb, G, rough) {
    const { w, h } = G, n = w * h, ids = G.id, src = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const k = CBN[i] || 1; src[i * 3] = CB[i * 3] / k; src[i * 3 + 1] = CB[i * 3 + 1] / k; src[i * 3 + 2] = CB[i * 3 + 2] / k; }
    const rad = Math.round(rough * 13);
    if (rad > 0) {
      const tmp = new Float32Array(n * 3);
      for (let pass = 0; pass < 4; pass++) {   // two separable box passes ≈ a gaussian
        const A = pass % 2 ? tmp : src, B = pass % 2 ? src : tmp;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = y * w + x, id = ids[i];
          if (id === 0 || id === 255) { B[i * 3] = A[i * 3]; B[i * 3 + 1] = A[i * 3 + 1]; B[i * 3 + 2] = A[i * 3 + 2]; continue; }
          let r = 0, gg = 0, b = 0, cnt = 0;
          for (let k = -rad; k <= rad; k++) {
            const xx = pass % 2 ? x : x + k, yy = pass % 2 ? y + k : y;
            if (xx < 0 || xx >= w || yy < 0 || yy >= h) continue;
            const j = yy * w + xx; if (ids[j] !== id) continue;
            r += A[j * 3]; gg += A[j * 3 + 1]; b += A[j * 3 + 2]; cnt++;
          }
          B[i * 3] = r / cnt; B[i * 3 + 1] = gg / cnt; B[i * 3 + 2] = b / cnt;
        }
      }
    }
    for (let i = 0; i < n; i++) {
      if (!(src[i * 3] || src[i * 3 + 1] || src[i * 3 + 2])) continue;
      const c = softClip([rgb[i * 3] + src[i * 3], rgb[i * 3 + 1] + src[i * 3 + 1], rgb[i * 3 + 2] + src[i * 3 + 2]]);
      rgb[i * 3] = c[0]; rgb[i * 3 + 1] = c[1]; rgb[i * 3 + 2] = c[2];
    }
  }

  MG.film({
    id: 'lookclearcoat', dur: 10, poster: 3.7,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Clear Coat', sub: 'A glossy clear layer over a coloured base: two lobes', era: '2000s —',
      origin: 'Automotive paint is built in layers — primer, a coloured basecoat often loaded with aluminium or mica flakes, and a transparent clearcoat — and car-paint shaders in visualisation tools copied that stack. Physically based layered materials made it general: Disney’s principled BRDF (Brent Burley, 2012) included a separate clearcoat lobe with its own gloss over the base, and the coat layer became a standard parameter in production and real-time materials, from Autodesk Standard Surface’s coat to the KHR_materials_clearcoat glTF extension and the clear-coat shading models of Unreal Engine and Filament.',
      works: 'Cars (Pixar, 2006; ray-traced reflections on lacquered car paint) · Disney principled BRDF, “Physically Based Shading at Disney” (Brent Burley, SIGGRAPH 2012 course; clearcoat lobe) · Autodesk Standard Surface coat layer / glTF KHR_materials_clearcoat',
      tech: ['Base lobe: diffuse + metallic flakes', 'Coat lobe: traced reflection, Schlick F0 0.04', 'Coat on / off, strength, roughness'],
      accent: '#d2361b',
      motionDNA: 'The shared camera orbit drags the coat’s reflections across the forms: softbox strips and the floor’s horizon slide over the Token’s face and wrap the sphere, while the flakes glint and go out as their angles pass the key. A wipe lacquers the plain materials; on beat 6 the coat switches off and only the base lobe is left, flat and satin; from beat 7.5 its strength fades back in; roughness then steps on the beat (0 → 0.10 → 0.22 → 0.38) and snaps back to glass-smooth, and a last split shows coat on beside coat off.',
      visualDNA: 'Product-shot paper studio: a candy-orange metallic flake Token, a deep teal and a cobalt lacquered-ceramic sphere and cube, each with a crisp white studio reflection floating on top of its colour, brightest at the silhouettes. Strength and roughness rulers, the base and coat lobes as separate insets, leader-line labels, an orange split line.',
      transitions: 'Wipe from plain to clear coat; coat off (cut) and back on (fade); stepped coat roughness; split coat on / off',
      implementation: ['Layered BRDFs: clearcoat lobe over base (Disney principled BRDF 2012, Autodesk Standard Surface, glTF KHR_materials_clearcoat)', 'Car-paint shaders: metallic flake normals in a cell grid under a dielectric coat', 'Canvas 2D + SDF tracer (js/look-kit.js): base lobe with hashed flake normals, one LK.trace coat bounce with Schlick F0 0.04 kept in its own buffer, edge-aware blur for coat roughness'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const s1 = E.ioC(seg(t, CW[0], CW[1])), s2 = lerp(1, 0.5, E.ioC(seg(t, CEND[0], CEND[1]))), rough = coatRough(t), str = coatStr(t);
      const n = 800 * 450;
      if (!CB) { CB = new Float32Array(n * 3); CBN = new Uint8Array(n); }
      CB.fill(0); CBN.fill(0);
      const shade = (g, S) => {
        if (g.i >= 0) CBN[g.i]++;   // every sample counts, so silhouettes get their share of coat
        if (g.u >= s1 || g.id === 0 || !g.hit) return LK.plain(g, S);
        const base = baseLobe(g, S), k = g.u < s2 ? str : 0;
        if (k <= 0) return softClip(LK.tone(base, 1.3));
        const cl = coatLobe(g, S, rough), F = cl[3] * k;
        if (g.i >= 0) { CB[g.i * 3] += cl[0] * k; CB[g.i * 3 + 1] += cl[1] * k; CB[g.i * 3 + 2] += cl[2] * k; }
        return LK.tone(base.map(v => v * (1 - F)), 1.3);
      };
      const { G, S } = LK.render(c, t, W, H, shade, { post: (rgb, G) => coatPost(rgb, G, rough) });
      wipeLine(c, s1, W, H, 'CLEAR COAT', 'PLAIN');
      wipeLine(c, s2, W, H, 'COAT ON', 'COAT OFF', 1, false, 560);
      const on1 = pulse(t, 2.6, COFF, 0.3);
      callout(c, S, W, H, tokPt(S, -0.45, 0.72, 0.23), -120, -120, 'COAT REFLECTION', 'the studio, sharp, on top', on1 * seg(t, 2.6, 3.0));
      callout(c, S, W, H, tokPt(S, -0.35, -0.5, 0.23), -160, 190, 'METALLIC FLAKES', 'tilted mirrors in the base', on1 * seg(t, 3.0, 3.4));
      callout(c, S, W, H, add(LK.SPH.c, [0.55, 0.45, 0.25]), 60, -230, 'FRESNEL', '4% face-on → ~100% at grazing', on1 * seg(t, 3.4, 3.8));
      callout(c, S, W, H, add(LK.CUBE.c, [-0.2, -0.2, 0.5]), -80, 200, 'LACQUERED CERAMIC', 'no flakes, same coat', on1 * seg(t, 3.8, 4.2));
      const on2 = pulse(t, COFF, CON[0] + 0.2, 0.15);
      callout(c, S, W, H, tokFace(S), 120, 300, 'BASE LOBE ONLY', 'satin, no mirror', on2, false);
      const inOn = pulse(t, 2.8, 8.6, 0.35);
      inset(c, G, W, 0, 'LOBE 1 · BASE  (DIFFUSE + FLAKES)', (g, S) => (g.id >= 1 && g.id <= 3 ? baseLobe(g, S, 1) : [0.07, 0.07, 0.08]), inOn);
      inset(c, G, W, 1, 'LOBE 2 · COAT  (FRESNEL × REFLECTION)', (g, S) => {
        if (!(g.id >= 1 && g.id <= 3)) return [0.03, 0.03, 0.035];
        const cl = coatLobe(g, S, 0); return softClip([cl[0] * 1.6, cl[1] * 1.6, cl[2] * 1.6]);
      }, inOn);
      // top-left
      if (t < CW[0] + 0.2) tag(c, 'REFERENCE  ·  PLAIN MATERIALS', 72, 80, seg(t, 0.1, 0.5));
      else if (t < COFF) tag(c, 'LAYERED  ·  BASE × (1 − F) + COAT × F', 72, 80);
      else if (t < CON[0]) tag(c, 'COAT OFF  ·  BASE LOBE ONLY', 72, 80);
      else if (t < beat(9)) tag(c, 'COAT STRENGTH  ·  FADING BACK IN', 72, 80);
      else if (t < CEND[0]) tag(c, 'COAT ROUGHNESS  ·  BLURRED IN ITS OWN BUFFER', 72, 80);
      else tag(c, 'SAME BASE  ·  WITH AND WITHOUT THE COAT', 72, 80);
      const rOn = seg(t, 1.6, 2.0);
      readout(c, 98, 136, 'COAT STRENGTH', str.toFixed(2), str, [[0, 'OFF'], [0.5, 'HALF'], [1, 'FULL']], rOn);
      readout(c, 98, 296, 'COAT ROUGHNESS', rough.toFixed(2), rough / 0.5, [[0, 'GLASS'], [0.24, 'SATIN'], [0.76, 'FROSTED']], rOn);
      if (rOn > 0) label(c, 'COAT F0 0.04  ·  IOR 1.5', 98, 434, { size: 15, ls: 2, color: P.ink, weight: 700 });
      LK.caption(c, t, W, H, { name: 'Clear Coat', cat: 'Material', curve: u => strCurve(u * 10), span: [0, 10], lo: -0.1, hi: 1.1, curveLabel: 'COAT STRENGTH / TIME' });
    },
    score(A) {
      LK.bed(A);
      // lacquer: a bright, polished ping over a smooth swell
      A.whoosh(CW[0], CW[1] - CW[0], { f1: 600, f2: 6000, q: 1.8, g: 0.09, swell: 0.6, rev: 0.4, pan: -0.3 });
      A.bell(CW[1], midi(84), { g: 0.09, dur: 2.0, ratios: [1, 2.0, 3.0, 4.1], rev: 0.6 });
      [2.6, 3.0, 3.4, 3.8].forEach((t, i) => A.osc(t, { f: midi(91 + [0, 2, 5, 7][i]), dur: 0.22, g: 0.03, rev: 0.4, pan: (i - 1.5) * 0.3 }));
      // coat off: a dry cut; back on: a rising shine
      A.noise(COFF, { type: 'lowpass', f: 900, dur: 0.08, g: 0.12 });
      A.osc(COFF, { type: 'triangle', f: midi(57), dur: 0.4, g: 0.07, lp: 900 });
      A.osc(CON[0], { f: midi(76), f2: midi(88), glide: CON[1] - CON[0], dur: CON[1] - CON[0] + 0.5, g: 0.04, a: 0.4, rev: 0.6 });
      A.bell(CON[1], midi(88), { g: 0.07, dur: 1.6, rev: 0.6, pan: 0.3 });
      // roughness steps: the sheen dulls a step at a time
      [[beat(9), 0.1], [beat(10), 0.22], [beat(11), 0.38]].forEach(([t, r], i) => {
        A.noise(t, { type: 'bandpass', f: 6500 - i * 1600, q: 3 - i * 0.7, dur: 0.16, g: 0.07 });
        A.osc(t, { type: 'triangle', f: midi(79 - i * 3), dur: 0.5, g: 0.05, lp: 4200 - r * 7000, rev: 0.4 });
      });
      A.bell(beat(12) + 0.1, midi(91), { g: 0.06, dur: 1.4, rev: 0.6 });
      A.whoosh(CEND[0], CEND[1] - CEND[0], { f1: 500, f2: 4000, q: 1.4, g: 0.07, swell: 0.6, rev: 0.4, pan: 0.3 });
      A.chord(CEND[1], [45, 52, 57, 61, 64], { type: 'triangle', dur: 1.6, g: 0.03, a: 0.1, lp: 2400, rev: 0.7, width: 0.8 });
    },
  });
})();
