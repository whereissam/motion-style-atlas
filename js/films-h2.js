/* batch h2 — Family D: 3D & CGI Motion. Product Visualization · Architectural Motion · 3D Character Animation. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, spring, rng, hash, vnoise, midi, text, rrect, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Condensed:wght@300;500;600&family=Fredoka:wght@500;600;700&family=Nunito:wght@700;800&display=block');
  const PI = Math.PI;
  const INTER = 'Inter, sans-serif', MONO = '"IBM Plex Mono", monospace', PLEX = '"IBM Plex Sans Condensed", sans-serif', FRED = 'Fredoka, sans-serif', NUN = 'Nunito, sans-serif';

  /* ---------- a small shared 3D kit: vectors, rotations, a look-at pinhole camera ---------- */
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const vmul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vnorm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vlerp = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  // row-major 3×3 rotations
  const mmul = (A, B) => { const o = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o.push(A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]); return o; };
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
  const mv = (R, p) => [R[0] * p[0] + R[1] * p[1] + R[2] * p[2], R[3] * p[0] + R[4] * p[1] + R[5] * p[2], R[6] * p[0] + R[7] * p[1] + R[8] * p[2]];
  const hex = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
  const mixc = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const css = (c, a) => {
    const r = Math.round(clamp(c[0]) * 255), g = Math.round(clamp(c[1]) * 255), b = Math.round(clamp(c[2]) * 255);
    return a === undefined ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${clamp(a)})`;
  };
  // Look-at camera: eye, target, focal length in px, principal point at the frame centre.
  function cam(e, ta, f, cx = 960, cy = 540) {
    const w = vnorm(vsub(ta, e)), u = vnorm(vcross(w, [0, 1, 0])), v = vcross(u, w);
    return { e, u, v, w, f, cx, cy };
  }
  // Orbit camera: azimuth about +y (0 = looking from +z), elevation, radius.
  const camOrbit = (az, el, r, ta, f) => cam([ta[0] + r * Math.cos(el) * Math.sin(az), ta[1] + r * Math.sin(el), ta[2] + r * Math.cos(el) * Math.cos(az)], ta, f);
  // The same camera seen in a horizontal mirror plane y = h (floor or water reflections).
  const camMirror = (C, h) => ({ ...C, e: [C.e[0], 2 * h - C.e[1], C.e[2]], u: [C.u[0], -C.u[1], C.u[2]], v: [C.v[0], -C.v[1], C.v[2]], w: [C.w[0], -C.w[1], C.w[2]] });
  const toCam = (C, p) => { const d = vsub(p, C.e); return [vdot(d, C.u), vdot(d, C.v), vdot(d, C.w)]; };
  function proj(C, p, o = [0, 0, 0]) {
    const dx = p[0] - C.e[0], dy = p[1] - C.e[1], dz = p[2] - C.e[2];
    const X = dx * C.u[0] + dy * C.u[1] + dz * C.u[2], Y = dx * C.v[0] + dy * C.v[1] + dz * C.v[2], Z = dx * C.w[0] + dy * C.w[1] + dz * C.w[2];
    o[0] = C.cx + C.f * X / Z; o[1] = C.cy - C.f * Y / Z; o[2] = Z;
    return o;
  }
  // Clip a world polygon against the near plane, then project it.
  function projPoly(C, pts, near = 0.15) {
    const cs = pts.map(p => toCam(C, p)), out = [];
    for (let i = 0; i < cs.length; i++) {
      const a = cs[i], b = cs[(i + 1) % cs.length];
      if (a[2] >= near) out.push(a);
      if ((a[2] >= near) !== (b[2] >= near)) { const k = (near - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k), near]); }
    }
    return out.map(q => [C.cx + C.f * q[0] / q[2], C.cy - C.f * q[1] / q[2], q[2]]);
  }
  const pathPts = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); };
  // Affine stand-in for a planar decal: local (x, y-down) units map to world o + x·ax + y·ay, fitted over a span.
  function planeXf(c, C, o, ax, ay, span = 300) {
    const p0 = proj(C, o), px = proj(C, vadd(o, vmul(ax, span))), py = proj(C, vadd(o, vmul(ay, span)));
    c.transform((px[0] - p0[0]) / span, (px[1] - p0[1]) / span, (py[0] - p0[0]) / span, (py[1] - p0[1]) / span, p0[0], p0[1]);
  }

  /* =====================================================================
     PRODUCT VISUALIZATION — a phone hangs in a black studio; a single
     strip light sweeps its edge out of the dark, then the softboxes come
     up and it turns on a slow turntable over a glossy sweep, showing the
     camera plateau; it explodes into five layers with callouts, snaps
     shut on a rim-light flare, wakes its screen and settles in hero 3/4
     ===================================================================== */
  const PV = { bg: '#060708', ink: '#f2f0ec', dim: '#8d929b', back: '#d8612a', frame: [0.86, 0.45, 0.24], accent: '#ff7a3d' };
  const PV_T = { key: 1.6, line: 2.2, exp0: 4.25, exp1: 5.35, call: 5.0, col0: 6.75, snap: 7.3, screen: 7.75, title: 8.2, sub: 8.65 };
  const PV_FY = -1.02;   // floor of the sweep
  // Rounded-rectangle outline with outward normals: [x, y, nx, ny], counter-clockwise from the top-right corner.
  function pvPerim(hw, hh, r, nc = 8, step = 0.07) {
    const out = [], cs = [[hw - r, hh - r, 0], [-(hw - r), hh - r, PI / 2], [-(hw - r), -(hh - r), PI], [hw - r, -(hh - r), 1.5 * PI]];
    cs.forEach(([cx, cy, a0], k) => {
      for (let i = 0; i <= nc; i++) { const a = a0 + (i / nc) * PI / 2; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a), Math.cos(a), Math.sin(a)]); }
      const [nx, ny] = cs[(k + 1) % 4], a = a0 + PI / 2, p0 = [cx + r * Math.cos(a), cy + r * Math.sin(a)], p1 = [nx + r * Math.cos(a), ny + r * Math.sin(a)];
      const ns = Math.max(2, Math.round(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / step));
      for (let i = 1; i < ns; i++) { const u = i / ns; out.push([lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u), Math.cos(a), Math.sin(a)]); }
    });
    return out;
  }
  // A rounded slab: the perimeter swept through an elliptical edge profile, plus its two flat caps.
  function pvSlab(hw, hh, hz, cr, re, oy = 0) {
    const per = pvPerim(hw, hh, cr), NJ = 6, ring = [];
    for (let j = 0; j <= NJ; j++) {
      const ph = -PI / 2 + PI * j / NJ, ins = re * (1 - Math.cos(ph)), z = hz * Math.sin(ph), a = Math.cos(ph) / re, b = Math.sin(ph) / hz, l = Math.hypot(a, b);
      ring.push(per.map(([x, y, nx, ny]) => ({ p: [x - nx * ins, y + oy - ny * ins, z], n: [nx * a / l, ny * a / l, b / l] })));
    }
    return { per, ring, capF: ring[NJ].map(v => v.p), capB: ring[0].map(v => v.p), hw, hh, hz, oy };
  }
  // Studio lights: rectangular softboxes / strips in world space, aimed at the product.
  function pvLight(c, sa, sb, col, k, up = [0, 1, 0]) {
    const n = vnorm(vmul(c, -1)), a = vnorm(vcross(n, up)), b = vcross(a, n);
    return { c, n, a, b, sa, sb, col, k };
  }
  function pvLights(t, P, C) {
    const on = E.ioS(seg(t, PV_T.key - 0.1, PV_T.key + 0.8)), sw = seg(t, 0.15, 2.0);
    // the sweep sits wherever the front glass mirrors the camera, and slides through it
    const Nf = mv(P.R, [0, 0, 1]), Vf = vnorm(vsub(P.T, C.e)), sr = vsub(Vf, vmul(Nf, 2 * vdot(Vf, Nf)));
    const flare = t > PV_T.snap ? Math.exp(-(t - PV_T.snap) * 3.5) : 0, wake = E.ioS(seg(t, PV_T.screen, PV_T.screen + 1));
    return [
      pvLight([-2.4, 2.4, 2.7], 1.25, 0.8, [1, 0.97, 0.93], 1.25 * on),                       // key softbox, front-left
      pvLight([2.9, 0.5, -1.4], 0.4, 2.6, [0.85, 0.92, 1.0], 0.35 + 1.5 * on + 2.2 * flare),    // cool rim strip, right
      pvLight([-2.8, 0.3, -1.7], 0.36, 2.6, [1.0, 0.84, 0.7], 0.25 + 1.3 * on + 2.2 * flare),   // warm rim strip, left
      pvLight([0.2, 3.4, 0.5], 1.6, 0.45, [1, 1, 1], 0.55 * on, [0, 0, -1]),                    // overhead scrim
      pvLight(vadd(vadd(P.T, vmul(sr, 4)), [0, lerp(2.2, -2.2, E.ioS(sw)), 0]), 4.0, 0.2, [1, 1, 1], 2.4 * Math.sin(PI * sw) * (1 - 0.6 * on)), // the reveal sweep, aimed into the glass
      pvLight([1.9, 1.2, 3.3], 0.7, 0.5, [1, 0.9, 0.82], 0.5 * wake),                          // hero fill
    ];
  }
  // Reflected radiance of the light rig along ray P + s·r (exact area-light hit test).
  function pvEnv(P, r, Ls) {
    const dome = 0.03 + 0.16 * Math.pow(clamp(r[1] * 0.5 + 0.5), 3) * (0.3 + 0.7 * Ls[0].k / 1.25);
    let R = dome, G = dome, B = dome * 1.08;
    for (const L of Ls) {
      if (L.k <= 0) continue;
      const den = vdot(r, L.n); if (den > -1e-4) continue;
      const s = vdot(vsub(L.c, P), L.n) / den; if (s <= 0) continue;
      const h = vsub(vadd(P, vmul(r, s)), L.c), x = vdot(h, L.a) / L.sa, y = vdot(h, L.b) / L.sb;
      const w = clamp((1 - Math.abs(x)) * 2.6) * clamp((1 - Math.abs(y)) * 2.6) * (1 - 0.25 * x * x) * L.k;
      if (w > 0) { R += w * L.col[0]; G += w * L.col[1]; B += w * L.col[2]; }
    }
    return [R, G, B];
  }
  // Planar mirror image of every softbox in a cap (exact for a flat glass face), soft across its width.
  function pvCapRefl(c, C, P0, N, Ls, alpha) {
    const q = [0, 0, 0];
    for (const L of Ls) {
      if (L.k <= 0 || vdot(vsub(L.c, P0), N) <= 0) continue;
      const mir = p => vsub(p, vmul(N, 2 * vdot(vsub(p, P0), N)));
      const A = vmul(L.a, L.sa), B = vmul(L.b, L.sb);
      const cs = [vsub(vsub(L.c, A), B), vsub(vadd(L.c, A), B), vadd(vadd(L.c, A), B), vadd(vsub(L.c, A), B)].map(mir);
      const sp = cs.map(p => proj(C, p, [0, 0, 0]));
      if (sp.some(p => p[2] < 0.05)) continue;
      const X = L.sb < L.sa ? B : A, g0 = proj(C, mir(vsub(L.c, X)), q).slice(), g1 = proj(C, mir(vadd(L.c, X)), q);
      const gr = c.createLinearGradient(g0[0], g0[1], g1[0], g1[1]), k = clamp(alpha * Math.min(1.4, L.k));
      gr.addColorStop(0, css(L.col, 0)); gr.addColorStop(0.28, css(L.col, k)); gr.addColorStop(0.72, css(L.col, k)); gr.addColorStop(1, css(L.col, 0));
      c.fillStyle = gr; pathPts(c, sp); c.fill();
    }
  }
  // Metal / glass edge band: per-quad reflection of the light rig. side: 1 front-facing, -1 the far inside wall of a ring.
  function pvBand(c, C, G, R, T, z0, Ls, tint, side = 1, alpha = 1, kd = [-0.6, 0.6, 0.5]) {
    const NJ = G.ring.length - 1, NI = G.per.length, WP = [], WN = [], SP = [];
    for (let j = 0; j <= NJ; j++) for (let i = 0; i < NI; i++) {
      const v = G.ring[j][i], w = vadd(mv(R, [v.p[0], v.p[1], v.p[2] + z0]), T);
      WP.push(w); WN.push(mv(R, v.n)); SP.push(proj(C, w, [0, 0, 0]));
    }
    c.globalAlpha = alpha; c.lineWidth = 1; c.lineJoin = 'round';
    for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) {
      const a = j * NI + i, b = j * NI + (i + 1) % NI, cc = (j + 1) * NI + (i + 1) % NI, d = (j + 1) * NI + i;
      const P = vmul(vadd(vadd(WP[a], WP[b]), vadd(WP[cc], WP[d])), 0.25), N = vnorm(vadd(vadd(WN[a], WN[b]), vadd(WN[cc], WN[d])));
      const V = vnorm(vsub(P, C.e)), facing = vdot(N, V) < 0;
      if (facing !== (side > 0)) continue;
      if (SP[a][2] < 0.05 || SP[cc][2] < 0.05) continue;
      let col;
      if (side > 0) {
        const r = vsub(V, vmul(N, 2 * vdot(V, N))), ev = pvEnv(P, r, Ls), dif = Math.max(0, vdot(N, vnorm(kd))) * Ls[0].k * 0.16;
        col = [0, 1, 2].map(k => tint[k] * (0.035 + dif) + ev[k] * (0.45 + 0.55 * tint[k]) + Math.max(0, ev[k] - 0.8) * 0.3);
      } else col = tint.map(x => x * 0.07);
      const s = css(col);
      c.fillStyle = s; c.strokeStyle = s;
      c.beginPath(); c.moveTo(SP[a][0], SP[a][1]); c.lineTo(SP[b][0], SP[b][1]); c.lineTo(SP[cc][0], SP[cc][1]); c.lineTo(SP[d][0], SP[d][1]); c.closePath();
      c.fill(); c.stroke();
    }
    c.globalAlpha = 1;
  }
  // The five layers of the phone, assembled z → exploded z.
  const PV_LAYERS = [
    { id: 'cover', z0: 0.036, z1: 0.66, label: 'Cover Glass', spec: 'ION-STRENGTHENED · 0.6 MM' },
    { id: 'display', z0: 0.022, z1: 0.36, label: 'OLED Panel', spec: '6.1 IN · 120 HZ · 2000 NITS' },
    { id: 'frame', z0: 0, z1: 0, label: 'Aluminium Frame', spec: 'LOGIC BOARD · 3 NM SOC' },
    { id: 'battery', z0: -0.014, z1: -0.33, label: 'Li-ion Cell', spec: '3.87 V · STACKED' },
    { id: 'back', z0: -0.036, z1: -0.68, label: 'Frosted Back Glass', spec: 'COIL · CAMERA PLATEAU' },
  ];
  function pvPose(t) {
    const yaw = kf(t, [[0, 0.62], [1.8, 1.55, E.ioS], [4.25, 3.62, E.ioS], [5.35, 4.05, E.ioS], [6.75, 4.2, E.lin], [7.3, 4.5, E.inQ], [9.9, 5.74, E.outC]]);
    const pitch = kf(t, [[0, 0], [1.8, -0.1], [4.25, -0.13], [5.35, 0.3], [6.75, 0.32], [7.3, 0.02], [9.9, -0.05]]);
    const roll = kf(t, [[0, 0.02], [1.8, 0.05], [4.25, 0.06], [5.35, -0.48], [6.75, -0.5], [7.3, 0.0], [9.9, 0.03]]);
    const x = kf(t, [[0, 0], [4.25, 0], [5.35, -0.05], [6.75, -0.05], [7.3, -0.2], [9.4, -0.82, E.ioS]]);
    const e = kf(t, [[PV_T.exp0, 0], [PV_T.exp1, 1, E.outQt], [PV_T.col0, 1.03, E.lin], [PV_T.snap, 0, E.inC]]);
    const pop = t > PV_T.snap ? 0.04 * Math.exp(-(t - PV_T.snap) * 6) * Math.sin((t - PV_T.snap) * 40) : 0;
    const R = mmul(rotY(yaw), mmul(rotX(pitch + pop), rotZ(roll)));
    return { R, T: [x, 0.04 * Math.sin(t * 1.3), 0], e, yaw };
  }
  // Caps: each layer paints whichever face looks at the camera.
  function pvCap(c, C, G, R, T, z0, front, Ls, kind, t, st) {
    const N = mv(R, [0, 0, front ? 1 : -1]), P0 = vadd(mv(R, [0, G.oy, (front ? G.hz : -G.hz) + z0]), T);
    if (vdot(N, vsub(P0, C.e)) >= 0) return;
    const W = p => vadd(mv(R, [p[0], p[1], p[2] + z0]), T);
    const sp = (front ? G.capF : G.capB).map(p => proj(C, W(p), [0, 0, 0]));
    const top = proj(C, W([0, G.hh + G.oy, front ? G.hz : -G.hz]), [0, 0, 0]), bot = proj(C, W([0, -G.hh + G.oy, front ? G.hz : -G.hz]), [0, 0, 0]);
    const kd = Math.max(0, vdot(N, vnorm([-0.6, 0.6, 0.5]))) * Ls[0].k, Vd = vnorm(vsub(P0, C.e)), fres = 0.3 + 0.7 * Math.pow(1 - Math.abs(vdot(Vd, N)), 3);
    const lin = (c0, c1) => { const g = c.createLinearGradient(top[0], top[1], bot[0], bot[1]); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
    // decals are mirrored on back faces so print always reads the right way round
    const decal = (z, fn, span = 300) => { c.save(); planeXf(c, C, W([0, G.oy, z]), mv(R, [front ? 0.001 : -0.001, 0, 0]), mv(R, [0, -0.001, 0]), span); fn(); c.restore(); };
    c.save(); pathPts(c, sp); c.clip();
    const zc = front ? G.hz : -G.hz;
    if (kind === 'back' && !front) {
      // frosted colour glass: diffuse falloff + broad, soft mirror of the softboxes
      const base = hex(PV.back);
      c.fillStyle = lin(css(base.map(v => v * (0.3 + 0.65 * kd))), css(base.map(v => v * (0.17 + 0.42 * kd)))); c.fillRect(0, 0, 1920, 1080);
      pvCapRefl(c, C, P0, N, Ls, 0.3 * fres + 0.08);
      pvSheen(c, top, bot, R, C, Vd, 0.16 * Ls[0].k);
      c.restore();
      pvBump(c, C, R, T, z0, G, Ls, kd);
      return;
    }
    if (kind === 'back' && front) {
      // inside of the back glass: a copper charging coil
      c.fillStyle = '#2a2b2f'; c.fillRect(0, 0, 1920, 1080);
      decal(zc, () => {
        c.strokeStyle = '#b8743c'; c.lineWidth = 6;
        for (let k = 0; k < 9; k++) { c.beginPath(); c.arc(0, 60, 80 + k * 13, 0, TAU); c.stroke(); }
        c.fillStyle = '#1b1c1f'; c.fillRect(-30, -560, 60, 520);
      });
      c.restore(); return;
    }
    if (kind === 'screen' || kind === 'display') {
      c.fillStyle = '#060709'; c.fillRect(0, 0, 1920, 1080);
      if (front) {
        const on = kind === 'screen' ? E.ioS(seg(t, PV_T.screen, PV_T.screen + 0.9)) : 0;
        const ds = pvPerim(G.hw - 0.022, G.hh - 0.022, 0.09, 6).map(p => proj(C, W([p[0], p[1] + G.oy, zc + 0.0005]), [0, 0, 0]));
        pathPts(c, ds); c.fillStyle = '#020203'; c.fill();
        if (on > 0) {
          c.save(); pathPts(c, ds); c.clip(); c.globalAlpha = on;
          c.fillStyle = lin('#ffb36b', '#2a1d6b'); c.fillRect(0, 0, 1920, 1080);
          const g1 = proj(C, W([0.3, 0.2, zc]), [0, 0, 0]), g2 = proj(C, W([-0.25, -0.35, zc]), [0, 0, 0]), rr = Math.abs(top[1] - bot[1]) * 0.55;
          let rg = c.createRadialGradient(g1[0], g1[1], 0, g1[0], g1[1], rr); rg.addColorStop(0, 'rgba(255,92,60,0.95)'); rg.addColorStop(1, 'rgba(255,92,60,0)'); c.fillStyle = rg; c.fillRect(0, 0, 1920, 1080);
          rg = c.createRadialGradient(g2[0], g2[1], 0, g2[0], g2[1], rr); rg.addColorStop(0, 'rgba(120,70,255,0.9)'); rg.addColorStop(1, 'rgba(120,70,255,0)'); c.fillStyle = rg; c.fillRect(0, 0, 1920, 1080);
          decal(zc, () => {
            text(c, '10:09', 0, -400, { font: INTER, weight: 600, size: 150, color: 'rgba(255,255,255,0.92)', align: 'center', ls: -4 });
            text(c, 'Tuesday 28', 0, -580, { font: INTER, weight: 500, size: 44, color: 'rgba(255,255,255,0.75)', align: 'center' });
          });
          c.restore();
        }
        if (kind === 'screen') {
          const isl = pvPerim(0.065, 0.019, 0.019, 4).map(p => proj(C, W([p[0], p[1] + G.hh - 0.075 + G.oy, zc + 0.001]), [0, 0, 0]));
          pathPts(c, isl); c.fillStyle = '#000'; c.fill();
        } else {
          decal(zc, () => { c.fillStyle = 'rgba(120,130,150,0.09)'; for (let y = -680; y < 690; y += 40) c.fillRect(-330, y, 660, 2); });
        }
      } else {
        decal(zc, () => { c.fillStyle = '#2b2d33'; c.fillRect(-320, -700, 640, 1400); c.fillStyle = '#b8862f'; c.fillRect(-60, 560, 120, 150); });
      }
      pvCapRefl(c, C, P0, N, Ls, kind === 'screen' ? 0.55 * fres + 0.12 : 0.3 * fres);
      pvSheen(c, top, bot, R, C, Vd, (kind === 'screen' ? 0.12 : 0.1) * (0.4 + 0.6 * Ls[0].k));
      c.restore(); return;
    }
    if (kind === 'cover') {
      c.fillStyle = 'rgba(160,190,220,0.06)'; c.fillRect(0, 0, 1920, 1080);
      pvCapRefl(c, C, P0, N, Ls, 0.65 * fres + 0.1);
      pvSheen(c, top, bot, R, C, Vd, 0.22);
      c.restore(); return;
    }
    if (kind === 'battery') {
      c.fillStyle = lin('#34373d', '#1d1f23'); c.fillRect(0, 0, 1920, 1080);
      decal(zc, () => {
        c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(-230, -330, 460, 660);
        text(c, 'Li-ion', 0, -120, { font: INTER, weight: 600, size: 72, color: 'rgba(235,236,240,0.85)', align: 'center' });
        text(c, '3.87 V  ·  RECHARGEABLE', 0, -40, { font: MONO, weight: 400, size: 28, color: 'rgba(235,236,240,0.6)', align: 'center' });
        c.fillStyle = '#c99a3d'; c.fillRect(-50, 300, 100, 60);
      });
      pvCapRefl(c, C, P0, N, Ls, 0.18 * fres);
      c.restore(); return;
    }
    c.restore();
  }
  // A diagonal glass sheen that slides across a cap as the object turns (the studio's big bounce card).
  function pvSheen(c, top, bot, R, C, Vd, k) {
    const s = vdot(Vd, mv(R, [1, 0, 0])), u = 0.5 + 1.6 * s, mx = lerp(top[0], bot[0], 0.5), my = lerp(top[1], bot[1], 0.5), L = Math.hypot(bot[0] - top[0], bot[1] - top[1]) * 0.7;
    const g = c.createLinearGradient(mx - L, my - L * 0.6, mx + L, my + L * 0.6);
    const a = clamp(u - 0.14, 0, 1), b = clamp(u, 0, 1), d = clamp(u + 0.14, 0, 1);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(a, 'rgba(255,255,255,0)'); g.addColorStop(b, `rgba(255,255,255,${k})`); g.addColorStop(d, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
  }
  // The camera plateau on the back glass: a raised glossy square, three lenses, a flash.
  function pvBump(c, C, R, T, z0, G, Ls, kd) {
    const W = p => vadd(mv(R, [p[0], p[1], p[2] + z0]), T), zb = -G.hz - 0.013, bx = -0.17, by = 0.53;
    const pl = pvPerim(0.15, 0.15, 0.065, 6);
    const lo = pl.map(p => proj(C, W([bx + p[0], by + p[1], -G.hz]), [0, 0, 0])), hi = pl.map(p => proj(C, W([bx + p[0], by + p[1], zb]), [0, 0, 0]));
    const base = hex(PV.back);
    pathPts(c, lo); c.fillStyle = css(base.map(v => v * 0.25)); c.fill();
    c.strokeStyle = css(base.map(v => v * 0.25)); c.lineWidth = 3;
    for (let i = 0; i < lo.length; i += 2) { c.beginPath(); c.moveTo(lo[i][0], lo[i][1]); c.lineTo(hi[i][0], hi[i][1]); c.stroke(); }
    c.save(); pathPts(c, hi); c.fillStyle = css(base.map(v => v * (0.22 + 0.8 * kd))); c.fill(); c.clip();
    const N = mv(R, [0, 0, -1]);
    pvCapRefl(c, C, W([bx, by, zb]), N, Ls, 0.5);
    c.restore();
    const ring = (x, y, r, z) => { const o = []; for (let k = 0; k < 28; k++) { const a = k / 28 * TAU; o.push(proj(C, W([bx + x + r * Math.cos(a), by + y + r * Math.sin(a), z]), [0, 0, 0])); } return o; };
    [[-0.068, 0.068], [-0.068, -0.068], [0.07, 0]].forEach(([x, y], i) => {
      pathPts(c, ring(x, y, 0.062, zb - 0.004)); c.fillStyle = '#1a1b1e'; c.fill();
      const o = ring(x, y, 0.057, zb - 0.01); pathPts(c, o);
      const ev = pvEnv(W([bx + x, by + y, zb]), N, Ls);
      c.fillStyle = css([0.25 + ev[0] * 0.5, 0.24 + ev[1] * 0.5, 0.24 + ev[2] * 0.5]); c.fill();
      const g = ring(x, y, 0.044, zb - 0.012), cen = proj(C, W([bx + x, by + y, zb - 0.012]), [0, 0, 0]), rad = Math.abs(g[0][0] - cen[0]) + Math.abs(g[7][1] - cen[1]);
      const rg = c.createRadialGradient(cen[0], cen[1], 0, cen[0], cen[1], rad + 1);
      rg.addColorStop(0, '#2b3a66'); rg.addColorStop(0.45, '#0e1426'); rg.addColorStop(1, '#030407');
      pathPts(c, g); c.fillStyle = rg; c.fill();
      pathPts(c, ring(x, y, 0.028, zb - 0.012)); c.strokeStyle = 'rgba(110,130,200,0.35)'; c.lineWidth = 1.5; c.stroke();
      const gl = proj(C, W([bx + x - 0.014, by + y + 0.016, zb - 0.013]), [0, 0, 0]);
      c.fillStyle = `rgba(255,255,255,${0.35 + 0.4 * Ls[0].k / 1.25})`; c.beginPath(); c.arc(gl[0], gl[1], 2.6 + rad * 0.08, 0, TAU); c.fill();
    });
    pathPts(c, ring(0.075, 0.095, 0.02, zb - 0.002)); c.fillStyle = '#f3e9cf'; c.fill();
    pathPts(c, ring(0.075, -0.095, 0.008, zb - 0.002)); c.fillStyle = '#121214'; c.fill();
  }
  // One layer of the exploded stack (or the whole assembled phone).
  function pvLayer(c, C, Ls, P, L, t, st) {
    const G = st.geo[L.id], z0 = lerp(L.z0, L.z1, P.e), R = P.R, T = P.T;
    if (L.id === 'phone') {
      pvBand(c, C, G, R, T, 0, Ls, PV.frame);
      pvCap(c, C, G, R, T, 0, true, Ls, 'screen', t, st);
      pvCap(c, C, G, R, T, 0, false, Ls, 'back', t, st);
      return;
    }
    if (L.id === 'frame') {
      // a hollow ring: far inside wall, then the logic board, then the near outer wall
      pvBand(c, C, G, R, T, z0, Ls, PV.frame, -1);
      const B = st.geo.board, Nf = mv(R, [0, 0, 1]), front = vdot(Nf, vsub(vadd(mv(R, [0, 0, z0]), T), C.e)) < 0, zb = front ? 0.004 : -0.004;
      const W = p => vadd(mv(R, [p[0], p[1], p[2] + z0]), T);
      pathPts(c, B.capF.map(p => proj(C, W([p[0], p[1], 0]), [0, 0, 0]))); c.fillStyle = '#0f1a16'; c.fill();
      c.save(); pathPts(c, B.capF.map(p => proj(C, W([p[0], p[1], 0]), [0, 0, 0]))); c.clip();
      planeXf(c, C, W([0, 0, zb]), mv(R, [front ? 0.001 : -0.001, 0, 0]), mv(R, [0, -0.001, 0]));
      const r = rng(41);
      c.strokeStyle = 'rgba(200,160,80,0.22)'; c.lineWidth = 3;
      for (let k = 0; k < 26; k++) { const x = -300 + r() * 600, y = -650 + r() * 1300; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 260, y); c.lineTo(x + (r() - 0.5) * 260, y + (r() - 0.5) * 300); c.stroke(); }
      c.fillStyle = '#1e2024'; c.fillRect(-120, -520, 240, 240);
      const sg = c.createLinearGradient(-100, -500, 100, -300); sg.addColorStop(0, '#c9ced6'); sg.addColorStop(1, '#6f747d');
      c.fillStyle = sg; c.fillRect(-100, -500, 200, 200);
      text(c, 'SOC', 0, -385, { font: MONO, weight: 500, size: 40, color: 'rgba(30,32,36,0.8)', align: 'center' });
      [[-250, -520, 90, 150], [160, -520, 110, 90], [160, -400, 110, 70], [-250, -330, 90, 80], [-80, -230, 160, 60]].forEach(([x, y, w, h]) => { c.fillStyle = '#25272c'; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x, y, w, 6); });
      for (let k = 0; k < 40; k++) { c.fillStyle = r() < 0.5 ? '#8a7a5a' : '#5d6168'; c.fillRect(-300 + r() * 600, -650 + r() * 500, 14, 8); }
      c.fillStyle = '#c99a3d'; c.fillRect(-180, 520, 360, 90); c.fillRect(220, -120, 70, 300);
      c.restore();
      pvBand(c, C, G, R, T, z0, Ls, PV.frame, 1);
      return;
    }
    const tint = L.id === 'cover' ? [0.7, 0.8, 0.9] : L.id === 'battery' ? [0.3, 0.31, 0.34] : L.id === 'display' ? [0.12, 0.12, 0.14] : hex(PV.back);
    const front = vdot(mv(R, [0, 0, 1]), vsub(vadd(mv(R, [0, G.oy, z0]), T), C.e)) < 0;
    pvBand(c, C, G, R, T, z0, Ls, tint, 1, L.id === 'cover' ? 0.55 : 1);
    pvCap(c, C, G, R, T, z0, front, Ls, L.id, t, st);
  }
  function pvScene(c, C, t, st, P, Ls) {
    if (P.e <= 0.001) { pvLayer(c, C, Ls, P, { id: 'phone', z0: 0, z1: 0 }, t, st); return; }
    const order = PV_LAYERS.map(L => ({ L, z: toCam(C, vadd(mv(P.R, [0, 0, lerp(L.z0, L.z1, P.e)]), P.T))[2] })).sort((a, b) => b.z - a.z);
    order.forEach(o => pvLayer(c, C, Ls, P, o.L, t, st));
  }
  function pvCamera(t) {
    const f = kf(t, [[0, 1300], [4.25, 1420, E.ioS], [5.35, 1260], [6.75, 1300, E.lin], [7.3, 1320], [9.9, 1360]]);
    return cam([0.2 * Math.sin(t * 0.25), 0.28, 4.3], [kf(t, [[0, 0], [4.25, 0], [5.35, 0.02], [6.75, 0.02], [9.4, -0.08]]), -0.02, 0], f);
  }

  MG.film({
    id: 'productviz', dur: 10, poster: 9.5,
    fonts: [['600 110px Inter', 'Product Visualization'], ['300 64px Inter', 'Shaped by light.'], ['500 30px Inter', 'CoverGlsOLEDPanAuminFrLi-oBkt'], ['400 18px "IBM Plex Mono"', 'ION-STRENGTHD·0.6M12HZNIBSOCV']],
    meta: {
      family: 'D', name: 'Product Visualization', sub: 'Hero Renders on a Seamless Sweep', era: '2000s —',
      origin: 'The CG product film: a manufacturer’s CAD model is lit like a studio photograph — softboxes, strip lights and a seamless sweep — and turned slowly in front of the camera, so every edge reads as a line of light. It grew out of industrial-design rendering (Alias, later KeyShot and Octane) and was set as a genre by Apple’s product films from the 2000s on, then by the launch reels every phone, watch, headphone and sneaker brand now commissions.',
      works: 'Mac Pro reveal film (Apple, WWDC 2013) · Introducing Apple Watch (Apple, 2014) · Introducing iPhone X (Apple, 2017) · KeyShot renderer (Luxion, 2010)',
      tech: ['Area-light reflections on metal', 'Planar softbox mirrors in glass', 'Turntable orbit + exploded layers'],
      accent: '#ff7a3d',
      motionDNA: 'Slow, weightless turntable rotation with long eases, light sweeping across edges rather than the object moving fast; a precise exploded-view separation that decelerates into place, holds for callouts, and snaps back together with a tiny settle.',
      visualDNA: 'A single hero object floating over a black-to-charcoal seamless sweep with a soft mirror floor; rim strips draw the silhouette in thin lines of light, big softboxes slide across glass as clean gradients, anodised colour, minimal thin sans type and hairline callouts.',
      transitions: 'Light-sweep reveal, turntable orbit, explode and collapse, screen wake, push to hero 3/4',
      implementation: ['KeyShot / Octane / Redshift turntables', 'Cinema 4D or Blender with HDRI softbox rigs', 'CAD data (STEP) retopologised for render', 'Canvas 2D: CPU projection, area-light hit tests per band quad, mirrored softbox quads on caps, mirrored-camera floor pass'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const geo = {
        phone: pvSlab(0.36, 0.74, 0.041, 0.115, 0.014),
        cover: pvSlab(0.355, 0.735, 0.005, 0.112, 0.004),
        display: pvSlab(0.345, 0.725, 0.005, 0.105, 0.004),
        frame: pvSlab(0.36, 0.74, 0.03, 0.115, 0.012),
        board: pvSlab(0.33, 0.71, 0.002, 0.09, 0.001),
        battery: pvSlab(0.25, 0.36, 0.012, 0.04, 0.008, -0.2),
        back: pvSlab(0.355, 0.735, 0.006, 0.112, 0.004),
      };
      return { geo, rf: offscreen(1920, 1080) };
    },
    draw(c, t, W, H, st) {
      const P = pvPose(t), C = pvCamera(t), Ls = pvLights(t, P, C), on = E.ioS(seg(t, PV_T.key - 0.1, PV_T.key + 0.8));
      // ---- the studio sweep ----
      c.fillStyle = PV.bg; c.fillRect(0, 0, W, H);
      const sx = proj(C, [P.T[0], 0, 0])[0], fy = proj(C, [P.T[0], PV_FY, 0])[1];
      let g = c.createRadialGradient(sx, 470, 40, sx, 520, 1050);
      g.addColorStop(0, `rgba(58,62,70,${0.95 * on})`); g.addColorStop(0.45, `rgba(30,32,37,${0.9 * on})`); g.addColorStop(1, 'rgba(6,7,8,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // the floor: a soft pool of light where the sweep bends
      c.save(); c.translate(sx, fy + 30); c.scale(1, 0.16);
      g = c.createRadialGradient(0, 0, 0, 0, 0, 900); g.addColorStop(0, `rgba(120,124,132,${0.22 * on})`); g.addColorStop(1, 'rgba(120,124,132,0)');
      c.fillStyle = g; c.fillRect(-900, -900, 1800, 1800); c.restore();
      // ---- mirror floor: the same scene from a camera reflected in the floor plane ----
      const rc = st.rf.getContext('2d');
      rc.setTransform(1, 0, 0, 1, 0, 0); rc.clearRect(0, 0, W, H);
      pvScene(rc, camMirror(C, PV_FY), t, st, P, Ls);
      rc.globalCompositeOperation = 'destination-in';
      const mg = rc.createLinearGradient(0, fy, 0, fy + 380); mg.addColorStop(0, 'rgba(0,0,0,0.42)'); mg.addColorStop(1, 'rgba(0,0,0,0)');
      rc.fillStyle = mg; rc.fillRect(0, 0, W, H); rc.globalCompositeOperation = 'source-over';
      c.drawImage(st.rf, 0, 0);
      // contact shadow
      c.save(); c.translate(sx, fy + 6); c.scale(1, 0.12);
      g = c.createRadialGradient(0, 0, 0, 0, 0, 380); g.addColorStop(0, `rgba(0,0,0,${0.55 * on})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(-400, -400, 800, 800); c.restore();
      // ---- the product ----
      pvScene(c, C, t, st, P, Ls);

      // ---- type ----
      const la = seg(t, PV_T.line, PV_T.line + 0.7) * (1 - seg(t, 3.9, 4.3));
      if (la > 0) {
        c.save(); c.globalAlpha = E.outC(la);
        const dy = (1 - E.outC(seg(t, PV_T.line, PV_T.line + 0.9))) * 18;
        text(c, 'Shaped', 150, 500 + dy, { font: INTER, weight: 300, size: 72, color: PV.ink, ls: -1 });
        text(c, 'by light.', 150, 585 + dy, { font: INTER, weight: 300, size: 72, color: PV.ink, ls: -1 });
        text(c, 'KEY  ·  RIM  ·  SWEEP', 152, 650 + dy, { font: MONO, size: 18, color: PV.dim, ls: 4 });
        c.restore();
      }
      // callouts while exploded
      const ca = seg(t, PV_T.call, PV_T.call + 0.3) * (1 - seg(t, PV_T.col0 - 0.15, PV_T.col0 + 0.1));
      if (ca > 0 && P.e > 0.3) {
        // layers left of centre are labelled on the left, the rest on the right; slots follow anchor height
        const cen = PV_LAYERS.map(L => ({ L, x: proj(C, vadd(mv(P.R, [0, 0, lerp(L.z0, L.z1, P.e)]), P.T))[0] })).sort((p, q) => p.x - q.x);
        const items = cen.map((o, i) => {
          const L = o.L, G = st.geo[L.id], z = lerp(L.z0, L.z1, P.e), left = i < 2;
          const a = proj(C, vadd(mv(P.R, left ? [-G.hw * 0.8, -G.hh * 0.55 + G.oy, z] : [G.hw * 0.75, G.hh * 0.7 + G.oy, z]), P.T));
          return { L, a, left };
        });
        [true, false].forEach(side => {
          const grp = items.filter(it => it.left === side).sort((p, q) => p.a[1] - q.a[1]);
          grp.forEach((it, k) => {
            const ord = side ? k : k + 2, u = E.outC(seg(t, PV_T.call + ord * 0.12, PV_T.call + ord * 0.12 + 0.35)) * ca;
            if (u <= 0) return;
            const ly = side ? 640 + k * 150 : 260 + k * 150, lx = side ? 560 : 1390, ex = side ? 600 : 1350;
            c.save(); c.globalAlpha = u;
            c.strokeStyle = 'rgba(242,240,236,0.55)'; c.lineWidth = 1.5;
            c.beginPath(); c.moveTo(it.a[0], it.a[1]); c.lineTo(lerp(it.a[0], ex, u), lerp(it.a[1], ly, u)); if (u > 0.98) c.lineTo(side ? lx + 14 : lx - 14, ly); c.stroke();
            c.fillStyle = PV.accent; c.beginPath(); c.arc(it.a[0], it.a[1], 5, 0, TAU); c.fill();
            c.strokeStyle = 'rgba(255,122,61,0.5)'; c.beginPath(); c.arc(it.a[0], it.a[1], 11, 0, TAU); c.stroke();
            const al = side ? 'right' : 'left';
            text(c, it.L.label, lx, ly + 8, { font: INTER, weight: 500, size: 32, color: PV.ink, align: al });
            text(c, it.L.spec, lx, ly + 40, { font: MONO, size: 18, color: PV.dim, ls: 2, align: al });
            text(c, '0' + (ord + 1), side ? lx : lx, ly - 30, { font: MONO, size: 18, color: PV.accent, ls: 2, align: al });
            c.restore();
          });
        });
      }
      // title
      if (t > PV_T.title) {
        const u = E.outC(seg(t, PV_T.title, PV_T.title + 0.9)), u2 = E.outC(seg(t, PV_T.sub, PV_T.sub + 0.8));
        c.save(); c.globalAlpha = u;
        text(c, 'Product', 1010, 470 + (1 - u) * 24, { font: INTER, weight: 300, size: 110, color: PV.ink, ls: -3 });
        text(c, 'Visualization', 1010, 590 + (1 - u) * 24, { font: INTER, weight: 600, size: 110, color: PV.ink, ls: -3 });
        c.globalAlpha = u2;
        c.fillStyle = PV.accent; c.fillRect(1014, 640, 70 * u2, 3);
        text(c, 'HERO RENDERS ON A SEAMLESS SWEEP', 1014, 690, { font: MONO, size: 20, color: PV.dim, ls: 4 });
        text(c, 'SOFTBOX  ·  RIM STRIP  ·  TURNTABLE', 1014, 724, { font: MONO, size: 20, color: 'rgba(242,240,236,0.5)', ls: 4 });
        c.restore();
      }
      vignette(c, W, H, 0.5);
      grain(c, W, H, t, 0.035, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.8;
      const T = PV_T;
      // room tone and a sub drone under everything
      A.noise(0, { type: 'lowpass', f: 300, dur: 10, g: 0.03, swell: 0.3, rev: 0.4 });
      A.osc(0, { f: midi(26), dur: 9.8, g: 0.07, a: 2.5, hold: true, rel: 1.5, lp: 200 });
      // the light sweep: a long breath of air
      A.whoosh(0.2, 1.8, { f1: 200, f2: 2600, g: 0.07, swell: 0.55, rev: 0.6 });
      A.osc(0.3, { type: 'sine', f: midi(86), dur: 1.6, g: 0.02, a: 0.8, rev: 0.7, vib: [5, 3] });
      // key lights on: a felt thump and a soft pad
      A.kick(T.key, 0.4, { f: 80, f2: 34, dur: 0.8 });
      A.chord(T.key, [50, 57, 62, 64, 69], { type: 'triangle', dur: 4.5, g: 0.025, a: 1.2, hold: true, rel: 1.2, lp: 1800, spread: 6, width: 0.8, rev: 0.6 });
      // turntable: a slow, sparse piano-like arpeggio
      [[2.0, 74], [2.5, 76], [3.0, 81], [3.5, 79], [3.9, 76]].forEach(([tt, m], i) => A.pluck(tt, midi(m), { g: 0.16, dur: 2.2, bright: 0.35, decay: 0.997, lp: 3000, rev: 0.5, pan: (i % 2 ? 0.3 : -0.3) }));
      // explode: riser, one air push per layer, ticks for each callout
      A.riser(T.exp0 - 0.7, 0.75, { g: 0.06, f: 98 });
      A.whoosh(T.exp0, 0.9, { f1: 900, f2: 300, g: 0.1, swell: 0.2, rev: 0.4 });
      for (let k = 0; k < 5; k++) A.whoosh(T.exp0 + 0.05 + k * 0.07, 0.5, { f1: 1500 + k * 300, f2: 500, g: 0.03, swell: 0.2, pan: (k - 2) * 0.3 });
      A.chord(T.exp0 + 0.2, [45, 52, 57, 61, 64], { type: 'sawtooth', dur: 2.6, g: 0.012, a: 0.8, hold: true, rel: 0.9, lp: 1200, spread: 8, width: 0.9, rev: 0.5 });
      for (let k = 0; k < 5; k++) {
        const tt = T.call + k * 0.12;
        A.osc(tt, { type: 'square', f: 2400 + k * 160, dur: 0.03, g: 0.025, lp: 5000, pan: 0.5 });
        A.pluck(tt + 0.02, midi([81, 83, 85, 88, 90][k]), { g: 0.07, dur: 1.2, bright: 0.4, rev: 0.4, pan: 0.4 });
      }
      // collapse into the snap
      A.noise(T.col0, { type: 'bandpass', f: 400, f2: 3000, q: 1.2, dur: T.snap - T.col0, g: 0.08, swell: 0.95, rev: 0.2 });
      A.impact(T.snap, 0.55, { rev: 0.5 });
      A.osc(T.snap, { type: 'square', f: 3200, dur: 0.02, g: 0.06, lp: 6000 });
      A.bell(T.snap + 0.01, midi(74), { g: 0.06, dur: 2.5, rev: 0.6, ratios: [1, 2.0, 3.01, 5.4] });
      // screen wake + title
      A.bell(T.screen, midi(86), { g: 0.06, dur: 1.8, rev: 0.6 });
      A.bell(T.screen + 0.12, midi(93), { g: 0.04, dur: 1.6, rev: 0.6, pan: 0.3 });
      A.chord(T.title, [38, 50, 57, 62, 66, 69, 74], { type: 'triangle', dur: 1.9, g: 0.03, a: 0.3, hold: true, rel: 0.9, lp: 2600, spread: 5, width: 0.9, rev: 0.7 });
      [74, 78, 81, 86].forEach((m, i) => A.pluck(T.title + 0.1 + i * 0.16, midi(m), { g: 0.12, dur: 1.8, bright: 0.35, lp: 3500, rev: 0.6, pan: (i - 1.5) * 0.25 }));
    },
  });

  /* =====================================================================
     ARCHITECTURAL MOTION — a house is drawn as a blueprint plan, line by
     line; the camera tilts off the sheet as the plan extrudes into white
     wireframe volumes, which fill into a clay massing model; materials
     wipe across it (travertine, board-formed concrete, timber, glass) and
     a sun study sweeps the shadows from morning to evening; the camera
     drops to eye level for a walkthrough past the pool as the lights come
     on, and settles on a dusk establishing shot
     ===================================================================== */
  const AR = { bp: '#103b70', line: 'rgba(226,238,255,0.92)', ink: '#f4f1ea', accent: '#e2b26b' };
  const AR_T = { tilt0: 1.85, tilt1: 3.9, solid0: 3.25, solid1: 4.2, mat0: 4.3, sun0: 4.6, sun1: 6.6, walk0: 6.6, walk1: 8.6, title: 8.7, sub: 9.1 };
  const AR_MAT = { stone: hex('#ddd1ba'), conc: hex('#d0cbc2'), glass: hex('#4a5e6d'), wood: hex('#8e5c38'), metal: hex('#8f8c86') };
  const AR_CLAY = hex('#ebe8e2'), AR_GROUND = hex('#8b9468'), AR_POOL = [0.5, 10, 2.8, 5.6], AR_WY = 0.41;
  // volumes: [x0, x1, y0, y1, z0, z1], material, growth start
  const AR_B = [
    { b: [-11, 11, 0, 0.45, -7, 6], m: 'stone', at: 2.25, id: 'plinth' },
    { b: [-6, 3.5, 0.45, 3.65, -4.5, 2.2], m: 'glass', at: 2.45 },
    { b: [3.5, 6.5, 0.45, 3.65, -5, -1.5], m: 'wood', at: 2.58 },
    { b: [-7.4, -6.6, 0.45, 7.8, -6.2, 4.4], m: 'stone', at: 2.7 },
    { b: [-4.5, 9.5, 3.65, 7.0, -5.5, 1.8], m: 'conc', at: 2.9, id: 'upper' },
    { b: [-4.65, 9.65, 7.0, 7.18, -5.65, 1.95], m: 'metal', at: 3.15 },
    { b: [-2.2, -0.6, 7.18, 8.4, -4.2, -2.6], m: 'stone', at: 3.25 },
  ];
  const AR_TREES = [[-14.6, 3.2, 3.3, 2.3], [13.9, -3.6, 3.6, 2.5], [14.8, 3.9, 3.0, 2.1], [-13.4, -4.8, 3.8, 2.6], [4.5, -10.5, 4.0, 2.8], [-5, -10.8, 3.4, 2.4]];
  const AR_GX = [[-11, 'A'], [-6, 'B'], [0.5, 'C'], [3.5, 'D'], [9.5, 'E']], AR_GZ = [[-7, '1'], [-4.5, '2'], [2.2, '3'], [6, '4']];
  function arHull(P) {
    P = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    up.pop(); lo.pop(); return lo.concat(up);
  }
  // Shadow of an axis-aligned box on an axis-aligned face plane (axis k, side s, at q): clip the box to
  // the face's front half-space, cast its corners along the sun onto the plane, take the hull.
  function arShadow(k, s, q, b, sun) {
    const lo = [b[0], b[2], b[4]], hi = [b[1], b[3], b[5]];
    if (s > 0) lo[k] = Math.max(lo[k], q); else hi[k] = Math.min(hi[k], q);
    if (hi[k] - lo[k] < 1e-4) return null;
    const i = (k + 1) % 3, j = (k + 2) % 3, pts = [];
    for (let m = 0; m < 8; m++) {
      const v = [m & 1 ? hi[0] : lo[0], m & 2 ? hi[1] : lo[1], m & 4 ? hi[2] : lo[2]], tt = (v[k] - q) / sun[k];
      pts.push([v[i] - sun[i] * tt, v[j] - sun[j] * tt]);
    }
    return arHull(pts).map(p => { const o = [0, 0, 0]; o[k] = q; o[i] = p[0]; o[j] = p[1]; return o; });
  }
  // Painter's order for disjoint boxes: across any separating plane, the side holding the eye is drawn last.
  function arBefore(A, B, e) {
    for (let k = 0; k < 3; k++) {
      if (A[k * 2 + 1] <= B[k * 2] + 1e-6) return e[k] > B[k * 2];
      if (B[k * 2 + 1] <= A[k * 2] + 1e-6) return !(e[k] > A[k * 2]);
    }
    return false;
  }
  function arOrder(items, e) {
    const rest = items.slice(), out = [];
    while (rest.length) {
      let pick = rest.findIndex(X => !rest.some(Y => Y !== X && arBefore(Y.b, X.b, e)));
      if (pick < 0) pick = 0;
      out.push(rest.splice(pick, 1)[0]);
    }
    return out;
  }
  const arGrow = (t, at) => E.outB(seg(t, at, at + 0.75), 1.1);
  function arBoxes(t) {
    return AR_B.map((B, n) => {
      const h = arGrow(t, B.at), b = B.b.slice();
      b[2] *= h; b[3] *= h;
      const cx = (B.b[0] + B.b[1]) / 2, m = E.ioS(seg(t, AR_T.mat0 + (cx + 11) / 22 * 0.7, AR_T.mat0 + (cx + 11) / 22 * 0.7 + 0.55));
      return { ...B, b, h, mix: m, n };
    });
  }
  function arEnv(t) {
    const h = kf(t, [[0, 10], [AR_T.sun0, 10], [AR_T.sun1, 17.4, E.ioS], [AR_T.walk1, 19.35, E.ioS], [10, 19.7, E.lin]]);
    const tt = (h - 6) / 13, az = lerp(-1.0, 2.3, tt), el = 1.05 * Math.sin(PI * clamp(tt, 0, 1.2)) - 0.05;
    const sun = vnorm([Math.sin(az) * Math.cos(el), Math.max(0.03, Math.sin(el)), Math.cos(az) * Math.cos(el)]);
    const sunK = clamp(el / 0.12), day = clamp(el / 0.45), dusk = clamp(-el / 0.13);
    const sunCol = mixc([1, 0.56, 0.32], [1, 0.95, 0.88], clamp(el / 0.55));
    let top = mixc([0.42, 0.5, 0.7], [0.33, 0.54, 0.8], day), hz = mixc([0.99, 0.76, 0.55], [0.8, 0.86, 0.9], day);
    top = mixc(top, [0.07, 0.1, 0.22], dusk); hz = mixc(hz, [0.62, 0.38, 0.4], dusk);
    const mg = E.ioS(seg(t, AR_T.mat0 - 0.1, AR_T.mat0 + 0.9));
    top = mixc([0.86, 0.87, 0.88], top, mg); hz = mixc([0.95, 0.95, 0.94], hz, mg);
    return { h, sun, sunK, sunCol, top, hz, ambC: mixc(mixc(top, hz, 0.5), [1, 1, 1], 0.45), amb: lerp(0.62, 0.5, dusk), glow: clamp((h - 18.3) / 0.9), mg };
  }
  function arCamera(t) {
    const K = [[0, 0, 1.553, 70, 0.4, 0, -0.4, 2650], [AR_T.tilt0, 0, 1.553, 70, 0.4, 0, -0.4, 2800], [AR_T.tilt1, 0.62, 0.56, 40, 0.8, 2.2, -0.5, 1500],
      [AR_T.sun1, 0.98, 0.42, 36, 1.2, 2.6, -0.5, 1460], [AR_T.walk1, -0.38, 0.0, 19.5, 1.6, 2.3, 0, 1120], [10, -0.5, 0.05, 31, 1.4, 5.6, 0, 1300]];
    let i = 1; while (i < K.length - 1 && t > K[i][0]) i++;
    const a = K[i - 1], b = K[i], u = E.ioS(seg(t, a[0], b[0])), L = j => lerp(a[j], b[j], u);
    const el = i === 2 ? lerp(a[2], b[2], E.ioC(seg(t, a[0], b[0]))) : L(2);
    return camOrbit(L(1), el, L(3), [L(4), L(5), L(6)], L(7));
  }
  const arLine = (c, C, a, b) => { const p = proj(C, a, [0, 0, 0]), q = proj(C, b, [0, 0, 0]); if (p[2] < 0.2 || q[2] < 0.2) return; c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); };
  function arCorners(b, k, s) {
    const q = s > 0 ? b[k * 2 + 1] : b[k * 2], [x0, x1, y0, y1, z0, z1] = b;
    if (k === 0) return [[q, y0, z0], [q, y1, z0], [q, y1, z1], [q, y0, z1]];
    if (k === 1) return [[x0, q, z0], [x1, q, z0], [x1, q, z1], [x0, q, z1]];
    return [[x0, y0, q], [x1, y0, q], [x1, y1, q], [x0, y1, q]];
  }
  // Material decals drawn in 3D on a face: mullions, coursing, slats, ribbon windows, interior glow.
  function arDecal(c, C, B, k, s, b, env, mix) {
    if (mix <= 0.01) return;
    const q = s > 0 ? b[k * 2 + 1] : b[k * 2], ax = k === 0 ? 2 : 0, lw = d => Math.max(1, C.f * d / Math.max(1, toCam(C, [(b[0] + b[1]) / 2, (b[2] + b[3]) / 2, (b[4] + b[5]) / 2])[2]));
    const P = (u, y) => { const o = [0, y, 0]; o[k] = q; o[ax] = u; return o; };
    const u0 = b[ax * 2], u1 = b[ax * 2 + 1], y0 = b[2], y1 = b[3];
    c.save(); c.globalAlpha = mix;
    const glass = (ua, ub, ya, yb, step) => {
      const tp = proj(C, P((ua + ub) / 2, yb)), bt = proj(C, P((ua + ub) / 2, ya));
      const g = c.createLinearGradient(tp[0], tp[1], bt[0], bt[1]);
      g.addColorStop(0, css(mixc(env.hz, [1, 1, 1], 0.2))); g.addColorStop(0.45, css(mixc(env.top, [0.2, 0.25, 0.3], 0.45))); g.addColorStop(1, css([0.13, 0.16, 0.19]));
      pathPts(c, projPoly(C, [P(ua, ya), P(ub, ya), P(ub, yb), P(ua, yb)])); c.fillStyle = g; c.fill();
      if (env.glow > 0) {
        const gg = c.createLinearGradient(tp[0], tp[1], bt[0], bt[1]);
        gg.addColorStop(0, `rgba(255,214,150,${0.95 * env.glow})`); gg.addColorStop(0.6, `rgba(255,170,95,${0.85 * env.glow})`); gg.addColorStop(1, `rgba(120,70,40,${0.9 * env.glow})`);
        c.fillStyle = gg; c.fill();
        c.fillStyle = `rgba(255,244,215,${env.glow})`;
        for (let u = ua + step / 2; u < ub; u += step) { const p = proj(C, P(u, yb - 0.22)); c.beginPath(); c.arc(p[0], p[1], Math.max(1.5, lw(0.08)), 0, TAU); c.fill(); }
      }
      c.strokeStyle = '#26282b'; c.lineWidth = lw(0.07); c.beginPath();
      for (let u = ua; u <= ub + 1e-6; u += step) arLine(c, C, P(Math.min(u, ub), ya), P(Math.min(u, ub), yb));
      arLine(c, C, P(ua, ya), P(ub, ya)); arLine(c, C, P(ua, yb), P(ub, yb)); c.stroke();
    };
    if (B.m === 'glass' && k !== 1) glass(u0, u1, y0, y1, 1.6);
    if (B.m === 'stone' && k !== 1) {
      c.strokeStyle = 'rgba(90,70,45,0.18)'; c.lineWidth = 1; c.beginPath();
      for (let y = y0 + 0.6; y < y1; y += 0.6) arLine(c, C, P(u0, y), P(u1, y));
      c.stroke();
    }
    if (B.m === 'wood' && k !== 1) {
      c.strokeStyle = 'rgba(40,20,8,0.35)'; c.lineWidth = 1; c.beginPath();
      for (let u = u0 + 0.25; u < u1; u += 0.25) arLine(c, C, P(u, y0), P(u, y1));
      c.stroke();
    }
    if (B.m === 'conc' && k !== 1) {
      c.strokeStyle = 'rgba(60,55,50,0.12)'; c.lineWidth = 1; c.beginPath();
      for (let u = u0 + 2.4; u < u1; u += 2.4) arLine(c, C, P(u, y0), P(u, y1));
      for (let y = y0 + 1.2; y < y1; y += 1.2) arLine(c, C, P(u0, y), P(u1, y));
      c.stroke();
      if (k === 2 && s > 0) glass(u0 + 0.7, u1 - 0.6, y0 + 0.8, y0 + 2.6, 1.8);
      if (k === 0 && s > 0) glass(u0 + 0.6, u1 - 0.6, y0 + 0.8, y0 + 2.6, 1.8);
    }
    c.restore();
  }
  // One box face: lit colour, material, cast shadows from every other volume, contact AO.
  function arFace(c, C, B, k, s, env, all, simple) {
    const b = B.b, q = s > 0 ? b[k * 2 + 1] : b[k * 2];
    if ((C.e[k] - q) * s <= 0) return;
    const n = [0, 0, 0]; n[k] = s;
    const sp = projPoly(C, arCorners(b, k, s)); if (sp.length < 3) return;
    const base = mixc(AR_CLAY, AR_MAT[B.m], B.mix), lit = Math.max(0, vdot(n, env.sun)) * env.sunK;
    const amb = env.amb * (0.62 + 0.3 * n[1]) + (n[1] < 0 ? 0.12 : 0);
    const shade = l => [0, 1, 2].map(i => base[i] * (amb * env.ambC[i] + l * env.sunCol[i] * 0.78));
    c.save(); pathPts(c, sp); c.fillStyle = css(shade(lit)); c.fill(); c.clip();
    if (lit > 0 && !simple) {
      const sc = css(shade(0));
      c.fillStyle = sc;
      all.forEach(O => {
        if (O === B || O.h <= 0.01) return;
        const sh = arShadow(k, s, q, O.b, env.sun); if (!sh || sh.length < 3) return;
        const pp = projPoly(C, sh); if (pp.length < 3) return;
        pathPts(c, pp); c.fill();
      });
    }
    arDecal(c, C, B, k, s, b, env, B.mix);
    if (!simple && k !== 1 && b[3] - b[2] > 1) {
      // contact occlusion at the foot of every wall
      const p0 = proj(C, arCorners(b, k, s)[0]), p1 = proj(C, vadd(arCorners(b, k, s)[0], [0, 0.9, 0]));
      const g = c.createLinearGradient(p0[0], p0[1], p1[0], p1[1]); g.addColorStop(0, 'rgba(20,16,12,0.28)'); g.addColorStop(1, 'rgba(20,16,12,0)');
      c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
    }
    c.restore();
    c.strokeStyle = `rgba(30,26,20,${simple ? 0.05 : 0.14})`; c.lineWidth = 1; pathPts(c, sp); c.stroke();
  }
  function arTree(c, C, T, env, mix, grow) {
    const [x, z, h, R] = T, Rr = R * grow;
    if (Rr < 0.05) return;
    const b = proj(C, [x, 0, z]), tp = proj(C, [x, h, z]), cc = proj(C, [x, h + Rr * 0.7, z]); if (cc[2] < 0.5) return;
    const rpx = C.f * Rr / cc[2];
    c.strokeStyle = css(mixc([0.88, 0.86, 0.82], [0.3, 0.24, 0.18], mix)); c.lineWidth = Math.max(1.5, C.f * 0.22 / cc[2]);
    c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(tp[0], tp[1]); c.stroke();
    const sd = proj(C, vadd([x, h + Rr * 0.7, z], vmul(env.sun, Rr)));
    const lx = clamp((sd[0] - cc[0]) / rpx, -0.6, 0.6), ly = clamp((sd[1] - cc[1]) / rpx, -0.6, 0.6);
    const lit = mixc([0.97, 0.96, 0.93], mixc([0.62, 0.7, 0.4], [0.95, 0.7, 0.4], 1 - clamp(env.sun[1] * 3)), mix), dark = mixc([0.72, 0.71, 0.68], [0.18, 0.25, 0.15], mix);
    const r = rng(Math.round(x * 13 + z * 7));
    const blob = (ox, oy, rr) => {
      const g = c.createRadialGradient(cc[0] + ox + lx * rr * 0.6, cc[1] + oy + ly * rr * 0.6, rr * 0.05, cc[0] + ox, cc[1] + oy, rr);
      g.addColorStop(0, css(mixc(lit, dark, 0.15 * (1 - env.sunK)))); g.addColorStop(1, css(mixc(dark, [0.1, 0.12, 0.2], 0.3 * (1 - env.sunK))));
      c.fillStyle = g; c.beginPath(); c.arc(cc[0] + ox, cc[1] + oy, rr, 0, TAU); c.fill();
    };
    blob(0, 0, rpx);
    if (mix > 0.2) for (let i = 0; i < 7; i++) { const a = r() * TAU, d = rpx * (0.35 + r() * 0.35); blob(Math.cos(a) * d, Math.sin(a) * d * 0.8, rpx * (0.38 + r() * 0.2)); }
  }
  // Everything that sits on the ground plane: grass, plinth halo, cast shadows of volumes and trees.
  function arGround(c, C, env, boxes, tg) {
    const gp = projPoly(C, [[-400, 0, -400], [400, 0, -400], [400, 0, 400], [-400, 0, 400]]);
    const gc = mixc(AR_CLAY, AR_GROUND, env.mg), amb = env.amb * 0.9, lit = env.sun[1] * env.sunK;
    const shade = l => [0, 1, 2].map(i => gc[i] * (amb * env.ambC[i] + l * env.sunCol[i] * 0.78));
    pathPts(c, gp); c.fillStyle = css(shade(lit)); c.fill();
    c.save(); pathPts(c, gp); c.clip();
    // paths and lawn edge: a pale gravel apron around the plinth
    const ap = projPoly(C, [[-12.5, 0, -8.5], [12.5, 0, -8.5], [12.5, 0, 9.5], [-12.5, 0, 9.5]]);
    if (ap.length > 2) { pathPts(c, ap); c.fillStyle = css(shade(lit).map((v, i) => lerp(v, [0.86, 0.83, 0.77][i] * (amb + lit * 0.8), env.mg))); c.fill(); }
    if (env.sunK > 0) {
      c.fillStyle = css(shade(0).map((v, i) => lerp(v, [0.86, 0.83, 0.77][i] * amb, 0.6 * env.mg)));
      boxes.forEach(O => { if (O.h <= 0.01) return; const sh = arShadow(1, 1, 0, O.b, env.sun); if (sh && sh.length > 2) { const pp = projPoly(C, sh); if (pp.length > 2) { pathPts(c, pp); c.fill(); } } });
      AR_TREES.forEach(([x, z, h, R]) => {
        const Rr = R * tg; if (Rr < 0.05) return;
        const s = env.sun, e1 = vnorm(vcross(s, [0, 1, 0])), e2 = vcross(e1, s), ctr = [x, h + Rr * 0.7, z], pts = [];
        for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, p = vadd(ctr, vadd(vmul(e1, Math.cos(a) * Rr), vmul(e2, Math.sin(a) * Rr))); pts.push(vsub(p, vmul(s, p[1] / s[1]))); }
        const pp = projPoly(C, pts); if (pp.length > 2) { pathPts(c, pp); c.fill(); }
      });
    }
    c.restore();
  }
  function arPool(c, C, env, boxes, t) {
    const [x0, x1, z0, z1] = AR_POOL, pts = [[x0, AR_WY, z0], [x1, AR_WY, z0], [x1, AR_WY, z1], [x0, AR_WY, z1]], sp = projPoly(C, pts);
    if (sp.length < 3) return;
    const m = boxes[0].mix;
    c.save(); pathPts(c, sp); c.clip();
    const tp = proj(C, [(x0 + x1) / 2, AR_WY, z0]), bt = proj(C, [(x0 + x1) / 2, AR_WY, z1]);
    const g = c.createLinearGradient(tp[0], tp[1], bt[0], bt[1]);
    g.addColorStop(0, css(mixc(AR_CLAY, mixc(env.hz, [0.25, 0.55, 0.62], 0.5), m))); g.addColorStop(1, css(mixc(AR_CLAY, mixc(env.top, [0.1, 0.32, 0.4], 0.5), m)));
    c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
    if (m > 0.05) {
      // the house mirrored in the water
      const M = camMirror(C, AR_WY);
      c.globalAlpha = 0.42 * m;
      arOrder(boxes.slice(1), M.e).forEach(B => { for (let k = 0; k < 3; k++) for (const s of [-1, 1]) arFace(c, M, B, k, s, env, boxes, true); });
      c.globalAlpha = 1;
      c.fillStyle = `rgba(30,110,130,${0.28 * m})`; c.fillRect(0, 0, 1920, 1080);
      if (env.glow > 0) { c.fillStyle = `rgba(60,210,230,${0.35 * env.glow})`; c.fillRect(0, 0, 1920, 1080); }
      // ripples
      c.strokeStyle = `rgba(255,255,255,${0.12 * m})`; c.lineWidth = 1.2; c.beginPath();
      for (let i = 0; i < 26; i++) {
        const z = lerp(z0 + 0.2, z1 - 0.2, hash(i * 3.7)), x = lerp(x0 + 0.5, x1 - 0.5, hash(i * 9.1)) + Math.sin(t * 0.8 + i) * 0.3;
        arLine(c, C, [x - 0.4, AR_WY, z], [x + 0.4, AR_WY, z]);
      }
      c.stroke();
    }
    c.restore();
    c.strokeStyle = 'rgba(40,35,30,0.25)'; c.lineWidth = 1.5; pathPts(c, sp); c.stroke();
  }
  function arSolid(c, C, t, env, boxes) {
    // sky with a low sun glow
    const hz = proj(C, vadd(C.e, [C.w[0] * 3000, -C.e[1], C.w[2] * 3000]))[1];
    const sk = c.createLinearGradient(0, hz - 900, 0, hz);
    sk.addColorStop(0, css(env.top)); sk.addColorStop(1, css(env.hz));
    c.fillStyle = sk; c.fillRect(0, 0, 1920, 1080);
    const sp = proj(C, vadd(C.e, vmul(env.sun, 1000)));
    if (sp[2] > 0 && env.mg > 0) {
      const g = c.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], 520);
      g.addColorStop(0, css(env.sunCol, 0.55 * env.mg * (0.3 + 0.7 * clamp(1 - env.sun[1] * 2)))); g.addColorStop(1, css(env.sunCol, 0));
      c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
    }
    const tg = E.outB(seg(t, AR_T.solid0 - 0.2, AR_T.solid0 + 0.5), 1.4);
    arGround(c, C, env, boxes, tg);
    // horizon haze
    const hg = c.createLinearGradient(0, hz - 10, 0, hz + 260); hg.addColorStop(0, css(env.hz, 0.85)); hg.addColorStop(1, css(env.hz, 0));
    c.fillStyle = hg; c.fillRect(0, hz - 10, 1920, 270);
    const items = boxes.map(B => ({ B, b: B.b })).concat(AR_TREES.map(T => ({ T, b: [T[0] - T[3], T[0] + T[3], 0, T[2] + T[3] * 1.7, T[1] - T[3], T[1] + T[3]] })));
    const tm = E.ioS(seg(t, AR_T.mat0 + 0.3, AR_T.mat0 + 1.0));
    arOrder(items, C.e).forEach(it => {
      if (it.T) { arTree(c, C, it.T, env, tm, tg); return; }
      const B = it.B; if (B.h <= 0.01) return;
      for (let k = 0; k < 3; k++) for (const s of [-1, 1]) arFace(c, C, B, k, s, env, boxes, false);
      if (B.id === 'plinth') arPool(c, C, env, boxes, t);
    });
  }
  // The blueprint: grid, poché walls, glazing lines, overhead dashes, dimensions, drawn on over time.
  function arPlan(c, C, t, alpha) {
    if (alpha <= 0) return;
    const L = (pts, t0, d, o = {}) => {
      const u = seg(t, t0, t0 + d); if (u <= 0) return;
      const sp = pts.map(p => proj(C, [p[0], o.y || 0.02, p[1]], [0, 0, 0])); if (sp.some(p => p[2] < 0.3)) return;
      let tot = 0; const seglen = []; for (let i = 1; i < sp.length; i++) { const l = Math.hypot(sp[i][0] - sp[i - 1][0], sp[i][1] - sp[i - 1][1]); seglen.push(l); tot += l; }
      let left = tot * u;
      c.lineWidth = o.w || 1.5; c.setLineDash(o.dash || []); c.strokeStyle = o.col || AR.line;
      c.beginPath(); c.moveTo(sp[0][0], sp[0][1]);
      for (let i = 1; i < sp.length && left > 0; i++) { const f = Math.min(1, left / seglen[i - 1]); c.lineTo(lerp(sp[i - 1][0], sp[i][0], f), lerp(sp[i - 1][1], sp[i][1], f)); left -= seglen[i - 1]; }
      c.stroke(); c.setLineDash([]);
    };
    const rect = (x0, x1, z0, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]];
    const lbl = (s, x, z, t0, o = {}) => { const a = seg(t, t0, t0 + 0.3); if (a <= 0) return; const p = proj(C, [x, 0.02, z]); if (p[2] < 0.3) return; c.globalAlpha = alpha * a; text(c, s, p[0], p[1], { font: MONO, size: o.size || 16, color: o.col || AR.line, align: 'center', base: 'middle', ls: 1 }); c.globalAlpha = alpha; };
    c.save(); c.globalAlpha = alpha;
    // structural grid with bubbles
    AR_GX.forEach(([x, s], i) => { L([[x, -9.2], [x, 8.6]], 0.1 + i * 0.05, 0.5, { w: 1, dash: [14, 5, 3, 5], col: 'rgba(226,238,255,0.45)' }); L(Array.from({ length: 17 }, (_, k) => [x + 0.6 * Math.cos(k / 16 * TAU), -9.8 + 0.6 * Math.sin(k / 16 * TAU)]), 0.45 + i * 0.05, 0.3, { w: 1.2 }); lbl(s, x, -9.8, 0.6 + i * 0.05); });
    AR_GZ.forEach(([z, s], i) => { L([[-13.1, z], [13, z]], 0.2 + i * 0.05, 0.5, { w: 1, dash: [14, 5, 3, 5], col: 'rgba(226,238,255,0.45)' }); L(Array.from({ length: 17 }, (_, k) => [-13.7 + 0.6 * Math.cos(k / 16 * TAU), z + 0.6 * Math.sin(k / 16 * TAU)]), 0.5 + i * 0.05, 0.3, { w: 1.2 }); lbl(s, -13.7, z, 0.65 + i * 0.05); });
    L(rect(-11, 11, -7, 6), 0.35, 0.6, { w: 1.6 });
    L(rect(-6, 3.5, -4.5, 2.2), 0.55, 0.6, { w: 3 }); L(rect(-5.85, 3.35, -4.35, 2.05), 0.6, 0.6, { w: 1 });
    L(rect(3.5, 6.5, -5, -1.5), 0.7, 0.45, { w: 3 });
    // poché: the cut stone fin wall
    const pu = seg(t, 0.8, 1.1);
    if (pu > 0) { const pp = projPoly(C, [[-7.4, 0.02, -6.2], [-6.6, 0.02, -6.2], [-6.6, 0.02, lerp(-6.2, 4.4, pu)], [-7.4, 0.02, lerp(-6.2, 4.4, pu)]]); if (pp.length > 2) { pathPts(c, pp); c.fillStyle = AR.line; c.fill(); } }
    // stair treads and a kitchen island inside the pavilion
    L(rect(-5.4, -3.8, -4.2, -1.2), 1.0, 0.3, { w: 1.2 });
    for (let k = 1; k < 11; k++) L([[-5.4, -4.2 + k * 0.27], [-3.8, -4.2 + k * 0.27]], 1.02 + k * 0.012, 0.12, { w: 0.8 });
    L(rect(-1.6, 1.4, -2.2, -1.3), 1.08, 0.3, { w: 1.2 });
    // the upper volume above, dashed
    L(rect(-4.5, 9.5, -5.5, 1.8), 1.05, 0.7, { w: 1.4, dash: [10, 7] });
    L(rect(AR_POOL[0], AR_POOL[1], AR_POOL[2], AR_POOL[3]), 1.15, 0.5, { w: 2 }); L(rect(AR_POOL[0] + 0.3, AR_POOL[1] - 0.3, AR_POOL[2] + 0.3, AR_POOL[3] - 0.3), 1.2, 0.5, { w: 0.8 });
    AR_TREES.forEach(([x, z, , R], i) => { L(Array.from({ length: 25 }, (_, k) => [x + R * Math.cos(k / 24 * TAU), z + R * Math.sin(k / 24 * TAU)]), 1.25 + i * 0.04, 0.35, { w: 1, col: 'rgba(226,238,255,0.6)' }); L([[x - 0.3, z], [x + 0.3, z]], 1.3, 0.1, { w: 1 }); L([[x, z - 0.3], [x, z + 0.3]], 1.3, 0.1, { w: 1 }); });
    // door swings
    [[3.5, 0.2, -1], [-6, -0.6, 1]].forEach(([x, z, sg], i) => L(Array.from({ length: 10 }, (_, k) => [x + sg * 0.9 * Math.sin(k / 9 * PI / 2) * -1, z + 0.9 * Math.cos(k / 9 * PI / 2)]), 1.3 + i * 0.05, 0.25, { w: 1 }));
    // dimension string
    L([[-11, 8.1], [11, 8.1]], 1.35, 0.5, { w: 1 });
    [-11, -6, 0.5, 3.5, 9.5, 11].forEach((x, i) => L([[x - 0.25, 8.35], [x + 0.25, 7.85]], 1.4 + i * 0.03, 0.1, { w: 1.6 }));
    [[-8.5, '5 000'], [-2.75, '6 500'], [2, '3 000'], [6.5, '6 000'], [10.25, '1 500']].forEach(([x, s], i) => lbl(s, x, 8.75, 1.5 + i * 0.05, { size: 15 }));
    // section mark
    L([[-1.5, -8.2], [-1.5, 7.2]], 1.55, 0.4, { w: 1.2, dash: [22, 6, 4, 6] });
    lbl('A', -1.5, -8.6, 1.8, { size: 18 }); lbl('A', -1.5, 7.6, 1.8, { size: 18 });
    lbl('LIVING', -2.3, 0.4, 1.6, { size: 14 }); lbl('STUDY', 5, -3.25, 1.65, { size: 14 }); lbl('POOL', 5.25, 4.2, 1.7, { size: 14 }); lbl('TERRACE', 8, 0.2, 1.75, { size: 14 });
    c.restore();
  }
  function arWire(c, C, boxes, alpha) {
    if (alpha <= 0) return;
    c.save(); c.globalAlpha = alpha; c.strokeStyle = AR.line; c.lineWidth = 1.6; c.fillStyle = 'rgba(226,238,255,0.06)';
    boxes.forEach(B => {
      if (B.h <= 0.01) return;
      const [x0, x1, y0, y1, z0, z1] = B.b;
      for (let k = 0; k < 3; k++) for (const s of [-1, 1]) { const pp = projPoly(C, arCorners(B.b, k, s)); if (pp.length > 2) { pathPts(c, pp); c.fill(); } }
      c.beginPath();
      [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].forEach(([x, z], i, A) => { const [x2, z2] = A[(i + 1) % 4]; arLine(c, C, [x, y0, z], [x2, y0, z2]); arLine(c, C, [x, y1, z], [x2, y1, z2]); arLine(c, C, [x, y0, z], [x, y1, z]); });
      c.stroke();
    });
    c.restore();
  }
  function arChip(c, s, x, y, a, dark) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    c.font = `500 20px ${MONO}`; const w = c.measureText(s).width + s.length * 3 + 36;
    c.fillStyle = dark ? 'rgba(8,16,30,0.55)' : 'rgba(226,238,255,0.12)'; rrect(c, x, y - 30, w, 44, 4); c.fill();
    text(c, s, x + 18, y, { font: MONO, weight: 500, size: 20, color: '#f4f1ea', ls: 3 });
    c.restore();
  }

  MG.film({
    id: 'architectural', dur: 10, poster: 9.5,
    fonts: [['600 110px "IBM Plex Sans Condensed"', 'Architectural Motion'], ['300 40px "IBM Plex Sans Condensed"', 'PlanMasingFcdThrougho·'], ['500 20px "IBM Plex Mono"', '01—PLANMSIGTERLAUWKHOY:0123456789ABCDE'], ['400 16px "IBM Plex Mono"', 'LIVNGSTUDYPOERAC1:0 5']],
    meta: {
      family: 'D', name: 'Architectural Motion', sub: 'Plan, Massing and Flythrough', era: '1990s —',
      origin: 'Archviz animation turns an unbuilt design into a camera journey: drawings become volumes, volumes take on materials and daylight, and a dolly or drone path walks the client through spaces that do not exist yet. It grew from 1990s 3ds Max and V-Ray walkthroughs for competitions and real-estate marketing; Alex Roman’s The Third & The Seventh (2009) showed it could be cinema, and real-time engines (Lumion, Twinmotion, Unreal) later made sun studies and flythroughs part of everyday design review.',
      works: 'The Third & The Seventh (Alex Roman, 2009) · Lumion (Act-3D, 2010) · Twinmotion (Abvent, later Epic Games) · Unreal Engine archviz walkthroughs',
      tech: ['Blueprint plan extruded to massing', 'Exact cast shadows on box faces', 'Sun study sweep + dusk glow'],
      accent: '#e2b26b',
      motionDNA: 'Slow, steady, physically plausible camera: a top-down plan that tilts into perspective, a measured orbit while the sun arcs overhead, then a gimbal-smooth drop to eye level and a lateral dolly — no shake, no snap, every move eased like a crane or drone.',
      visualDNA: 'Blueprint blue with white hairlines, dash-dot grids and poché walls; a white clay massing model with soft contact shadows; then honest materials — travertine, board-formed concrete, timber and glass — under a sky that moves from crisp noon to warm dusk with glowing interiors mirrored in a pool.',
      transitions: 'Line draw-on, plan-to-perspective tilt, extrusion, wireframe-to-solid crossfade, material wipe, sun sweep, eye-level dolly',
      implementation: ['3ds Max + V-Ray / Corona', 'Lumion, Twinmotion, Unreal Engine', 'Revit / Rhino / SketchUp source models', 'Canvas 2D: AABB painter sort, cast-shadow hulls per face plane, mirrored-camera pool reflection'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { solid: offscreen(1920, 1080) }; },
    draw(c, t, W, H, st) {
      const C = arCamera(t), env = arEnv(t), boxes = arBoxes(t);
      const sol = E.ioS(seg(t, AR_T.solid0, AR_T.solid1));
      if (sol < 1) {
        // the blueprint sheet: graph grid on the ground plane, the plan, then the extruding wireframe
        c.fillStyle = AR.bp; c.fillRect(0, 0, W, H);
        const gp = projPoly(C, [[-60, 0, -60], [60, 0, -60], [60, 0, 60], [-60, 0, 60]]);
        if (gp.length > 2) {
          c.save(); pathPts(c, gp); c.clip();
          const g = c.createRadialGradient(960, 540, 100, 960, 540, 1200); g.addColorStop(0, '#1a4f8f'); g.addColorStop(1, '#0c2f5c'); c.fillStyle = g; c.fillRect(0, 0, W, H);
          c.beginPath(); c.lineWidth = 1; c.strokeStyle = 'rgba(200,220,255,0.08)';
          for (let x = -40; x <= 40; x++) arLine(c, C, [x, 0, -40], [x, 0, 40]);
          for (let z = -40; z <= 40; z++) arLine(c, C, [-40, 0, z], [40, 0, z]);
          c.stroke();
          c.beginPath(); c.strokeStyle = 'rgba(200,220,255,0.15)';
          for (let x = -40; x <= 40; x += 5) arLine(c, C, [x, 0, -40], [x, 0, 40]);
          for (let z = -40; z <= 40; z += 5) arLine(c, C, [-40, 0, z], [40, 0, z]);
          c.stroke(); c.restore();
        }
        arPlan(c, C, t, 1);
        arWire(c, C, boxes, seg(t, 2.2, 2.4));
        // sheet furniture: title block, north arrow and scale bar, fading as the camera leaves the paper
        const fa = seg(t, 0.4, 0.9) * (1 - seg(t, AR_T.tilt0, AR_T.tilt0 + 0.6));
        if (fa > 0) {
          c.save(); c.globalAlpha = fa; c.strokeStyle = AR.line; c.lineWidth = 1.5;
          c.strokeRect(1450, 850, 400, 160); c.beginPath(); c.moveTo(1450, 905); c.lineTo(1850, 905); c.moveTo(1700, 905); c.lineTo(1700, 1010); c.stroke();
          text(c, 'HOUSE ON A PLINTH', 1470, 888, { font: MONO, weight: 500, size: 20, color: AR.line, ls: 3 });
          text(c, 'GROUND FLOOR PLAN', 1470, 945, { font: MONO, size: 16, color: AR.line, ls: 2 });
          text(c, 'DWG A-101', 1470, 980, { font: MONO, size: 16, color: 'rgba(226,238,255,0.6)', ls: 2 });
          text(c, '1:100', 1775, 965, { font: MONO, weight: 500, size: 22, color: AR.line, align: 'center' });
          c.beginPath(); c.arc(1780, 110, 34, 0, TAU); c.stroke();
          c.beginPath(); c.moveTo(1780, 66); c.lineTo(1795, 122); c.lineTo(1780, 112); c.lineTo(1765, 122); c.closePath(); c.fillStyle = AR.line; c.fill();
          text(c, 'N', 1780, 52, { font: MONO, weight: 500, size: 18, color: AR.line, align: 'center' });
          [0, 1, 2, 5, 10].forEach((m, i) => { const x = 90 + m * 36; c.fillStyle = i % 2 ? 'rgba(226,238,255,0.2)' : AR.line; if (i < 4) c.fillRect(x, 1000, ([1, 1, 3, 5][i]) * 36, 8); text(c, String(m), x, 990, { font: MONO, size: 14, color: AR.line, align: 'center' }); });
          text(c, 'M', 90 + 10 * 36 + 22, 1008, { font: MONO, size: 14, color: AR.line });
          c.restore();
        }
      }
      if (sol > 0) {
        if (sol < 1) {
          const s2 = st.solid.getContext('2d'); s2.setTransform(1, 0, 0, 1, 0, 0);
          arSolid(s2, C, t, env, boxes);
          c.save(); c.globalAlpha = sol; c.drawImage(st.solid, 0, 0); c.restore();
          arWire(c, C, boxes, 1 - sol);
        } else arSolid(c, C, t, env, boxes);
      }
      // ---- HUD ----
      const dark = t > AR_T.solid0;
      const ph = [['01 — PLAN', 0.3, AR_T.tilt0 + 0.3], ['02 — MASSING', AR_T.tilt0 + 0.5, AR_T.mat0], ['03 — MATERIAL + SUN STUDY', AR_T.mat0 + 0.1, AR_T.walk0], ['04 — WALKTHROUGH', AR_T.walk0 + 0.1, AR_T.title - 0.1]];
      ph.forEach(([s, a, b]) => arChip(c, s, 80, 110, seg(t, a, a + 0.3) * (1 - seg(t, b - 0.25, b)), dark));
      const sa = seg(t, AR_T.sun0 - 0.3, AR_T.sun0) * (1 - seg(t, AR_T.title - 0.4, AR_T.title));
      if (sa > 0) {
        // sun study dial: compass, the day's arc, the sun and the clock
        c.save(); c.globalAlpha = sa; const X = 1720, Y = 150, R = 72;
        c.fillStyle = 'rgba(8,16,30,0.5)'; rrect(c, X - 120, Y - 110, 240, 250, 6); c.fill();
        c.strokeStyle = 'rgba(244,241,234,0.5)'; c.lineWidth = 1.2; c.beginPath(); c.arc(X, Y, R, 0, TAU); c.stroke();
        c.setLineDash([3, 4]); c.beginPath(); c.ellipse(X, Y + 12, R * 0.92, R * 0.55, 0, PI, TAU); c.stroke(); c.setLineDash([]);
        const tt = clamp((env.h - 6) / 13), sx = X - Math.cos(tt * PI) * R * 0.92, sy = Y + 12 - Math.sin(tt * PI) * R * 0.55;
        c.fillStyle = AR.accent; c.beginPath(); c.arc(sx, sy, 7, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(226,178,107,0.5)'; c.beginPath(); c.arc(sx, sy, 13, 0, TAU); c.stroke();
        text(c, 'N', X, Y - R - 8, { font: MONO, size: 14, color: '#f4f1ea', align: 'center' });
        const hh = Math.floor(env.h), mm = Math.floor((env.h - hh) * 60 / 5) * 5;
        text(c, `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, X, Y + 70, { font: MONO, weight: 500, size: 28, color: '#f4f1ea', align: 'center', ls: 2 });
        text(c, 'SUN STUDY · 21 JUN', X, Y + 108, { font: MONO, size: 13, color: 'rgba(244,241,234,0.7)', align: 'center', ls: 2 });
        c.restore();
      }
      if (t > AR_T.title) {
        const u = E.outC(seg(t, AR_T.title, AR_T.title + 0.9)), u2 = E.outC(seg(t, AR_T.sub, AR_T.sub + 0.7));
        c.save(); c.globalAlpha = u;
        const tg = c.createLinearGradient(0, 0, 0, 420); tg.addColorStop(0, 'rgba(6,10,24,0.45)'); tg.addColorStop(1, 'rgba(6,10,24,0)'); c.fillStyle = tg; c.fillRect(0, 0, W, 420);
        text(c, 'Architectural Motion', 96, 210 + (1 - u) * 20, { font: PLEX, weight: 600, size: 110, color: AR.ink, ls: -1 });
        c.globalAlpha = u2; c.fillStyle = AR.accent; c.fillRect(100, 250, 1060 * u2, 2);
        text(c, 'PLAN  ·  MASSING  ·  FACADE  ·  FLYTHROUGH', 100, 300, { font: MONO, weight: 500, size: 22, color: 'rgba(244,241,234,0.85)', ls: 5 });
        c.restore();
      }
      if (t > AR_T.solid0) vignette(c, W, H, 0.32);
      grain(c, W, H, t, 0.03, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 1.45;
      const T = AR_T;
      // pencil and pen on drafting film
      for (let k = 0; k < 22; k++) { const tt = 0.12 + k * 0.08 + hash(k) * 0.04; A.noise(tt, { type: 'bandpass', f: 3500 + hash(k * 3) * 2500, q: 2, dur: 0.05 + hash(k * 7) * 0.08, g: 0.035, pan: (hash(k * 5) - 0.5) * 0.8 }); }
      // a calm piano line in D (add9), pluck through a soft lowpass
      const mel = [[0.2, 62], [0.7, 69], [1.2, 66], [1.7, 74], [2.4, 71], [2.9, 69], [3.6, 66], [4.3, 64], [5.0, 69], [5.6, 71], [6.2, 74], [7.0, 76], [7.6, 73], [8.2, 69]];
      mel.forEach(([tt, m], i) => A.pluck(tt, midi(m), { g: 0.15, dur: 2.4, bright: 0.3, decay: 0.997, lp: 2600, rev: 0.55, pan: (i % 3 - 1) * 0.3 }));
      [[0, [50, 57, 62, 64]], [2.4, [47, 54, 62, 66]], [4.8, [43, 50, 59, 62, 66]], [7.0, [45, 52, 61, 64, 69]]].forEach(([tt, ch]) => A.chord(tt, ch, { type: 'triangle', dur: 2.6, g: 0.022, a: 0.9, hold: true, rel: 1.1, lp: 1500, spread: 5, width: 0.8, rev: 0.6 }));
      // tilt off the paper, volumes extruding with soft wooden knocks
      A.whoosh(T.tilt0, 2.0, { f1: 200, f2: 1800, g: 0.07, swell: 0.6, rev: 0.5 });
      [2.25, 2.45, 2.58, 2.7, 2.9, 3.15, 3.25].forEach((tt, i) => { A.osc(tt, { type: 'triangle', f: 330 + i * 40, f2: 180, glide: 0.08, dur: 0.12, g: 0.06, rev: 0.3 }); A.noise(tt, { type: 'bandpass', f: 1200, q: 3, dur: 0.04, g: 0.03 }); });
      // solid + materials: a shimmer sweeping left to right
      A.noise(T.solid0, { type: 'bandpass', f: 2000, f2: 7000, q: 3, dur: 1.4, g: 0.04, swell: 0.6, rev: 0.6 });
      for (let k = 0; k < 7; k++) A.bell(T.mat0 + k * 0.1, midi([81, 83, 86, 88, 90, 93, 95][k]), { g: 0.025, dur: 1.2, rev: 0.6, pan: (k / 6 - 0.5) * 1.2 });
      // sun study: a slow pad swell over the arc of the day
      A.chord(T.sun0, [38, 45, 52, 57, 62], { type: 'sawtooth', dur: 2.4, g: 0.012, a: 1.4, hold: true, rel: 0.8, lp: 900, spread: 7, width: 0.9, rev: 0.6 });
      // walkthrough: wind and birds
      A.noise(T.walk0, { type: 'lowpass', f: 700, dur: 3.5, g: 0.05, swell: 0.5, rev: 0.3 });
      [6.9, 7.05, 7.5, 7.62, 8.1].forEach((tt, i) => A.osc(tt, { f: 3200 + hash(i) * 900, f2: 2400, glide: 0.08, dur: 0.1, g: 0.02, vib: [30, 120], pan: (hash(i * 3) - 0.5) * 1.4, rev: 0.4 }));
      // dusk: lights on and the title
      A.chord(T.title, [38, 50, 57, 62, 66, 69, 76], { type: 'triangle', dur: 1.3, g: 0.03, a: 0.4, hold: true, rel: 0.6, lp: 2400, spread: 6, width: 0.9, rev: 0.7 });
      A.bell(T.title, midi(78), { g: 0.05, dur: 1.3, rev: 0.6 });
      A.pluck(T.sub, midi(74), { g: 0.12, dur: 0.9, bright: 0.3, lp: 2600, rev: 0.6 });
    },
  });

  /* =====================================================================
     3D CHARACTER ANIMATION — a gumdrop blob with a bobble antenna idles
     and blinks; a ball drops in and it does a take (anticipation squash,
     stretch, wide eyes), hops over and nudges the ball up onto a plinth,
     narrows its brows, winds up into a deep crouch and leaps on a clean
     arc (spacing ghosted on screen); it lands in a big squash with the
     antenna whipping through, the ball pops and bonks it on the head,
     and it ends delighted, balancing it — soft key, rim and contact AO
     ===================================================================== */
  const CH = { ink: '#3b2a1e', cream: '#fff6ea', accent: '#ffb53b' };
  const CH_T = { drop: 1.0, take: 1.45, hop1: 2.2, hop2: 2.85, nudge: 3.62, crouch: 4.55, jump: 5.15, land: 5.88, pop: 5.9, bonk: 6.75, happy: 7.4, title: 8.35, sub: 8.85 };
  const CH_BW = 960, CH_BH = 540;
  const CH_PED = { x: 2.05, z: -0.15, r: 0.74, h: 1.0 };
  const lin2 = h => hex(h).map(v => v * v);   // sRGB → linear with gamma 2 (cheap sqrt on the way out)
  const CH_COL = { body: lin2('#ffb53b'), belly: lin2('#ffd27a'), cheek: lin2('#ff7f86'), brow: lin2('#8a4313'), foot: lin2('#f39a2a'), tip: lin2('#ff4f5e'), stalk: lin2('#e48a24'), ball: lin2('#2f86e8'), stripe: lin2('#fff1d6'), ped: lin2('#d9cdf2'), floor: lin2('#f4e4cf'), bg: lin2('#e7cdb4'), top: lin2('#b88f78'), mouth: lin2('#5a1a12'), tongue: lin2('#ff6f7a'), sclera: lin2('#fbf7f1'), iris: lin2('#4a8a5c'), pupil: lin2('#120a06') };
  const CH_X = [[0, -1.5], [CH_T.hop1, -1.5], [2.55, -1.05, E.lin], [CH_T.hop2, -1.05], [3.2, -0.62, E.lin], [CH_T.crouch, -0.62], [5.1, -0.7], [CH_T.jump, -0.7], [CH_T.land, 1.95, E.lin]];
  const CH_HOPS = [[CH_T.hop1, 2.55, 0.42, 0, 0], [CH_T.hop2, 3.2, 0.42, 0, 0], [CH_T.jump, CH_T.land, 1.0, 0, CH_PED.h]];
  const CH_S = [[0, 1], [1.45, 1], [1.58, 0.82, E.outQ], [1.74, 1.22, E.outQ], [1.95, 0.97], [2.06, 1.0],
    [2.2, 0.8], [2.27, 1.2, E.outQ], [2.4, 1.0], [2.52, 1.1], [2.6, 0.78, E.outQ], [2.75, 1.0], [2.85, 0.82], [2.92, 1.2, E.outQ], [3.05, 1.0], [3.17, 1.1], [3.25, 0.78, E.outQ], [3.42, 1.0],
    [3.5, 1.0], [3.56, 0.88], [3.67, 1.1], [3.86, 1.0], [4.3, 1.03], [CH_T.crouch, 1.0], [5.08, 0.62], [CH_T.jump, 0.6],
    [5.25, 1.4, E.outQ], [5.5, 1.04], [5.76, 1.18], [5.88, 1.2], [5.95, 0.6, E.outQ], [6.12, 1.1], [6.28, 0.96], [6.4, 1.0],
    [CH_T.bonk, 1.0], [6.82, 0.84, E.outQ], [6.97, 1.06], [7.12, 1.0], [7.4, 1.0], [7.52, 0.9], [7.66, 1.1], [7.8, 0.97], [7.94, 0.92], [8.08, 1.07], [8.25, 1.0]];
  const CH_L = [[0, 0], [1.45, 0], [1.58, 0.06], [1.74, -0.05], [1.95, 0], [2.1, 0.06], [2.25, -0.2], [2.45, -0.05], [2.6, -0.16], [2.8, 0.02], [2.92, -0.2], [3.1, -0.05], [3.25, -0.16], [3.42, 0],
    [3.52, 0.1], [3.63, -0.42, E.outQ], [3.9, 0.05], [4.05, 0], [CH_T.crouch, 0], [5.1, 0.14], [5.22, -0.42, E.outQ], [5.55, -0.12], [5.85, 0.14], [5.95, -0.2], [6.15, 0.06], [6.35, 0],
    [CH_T.bonk, 0], [6.82, 0.06], [7.0, -0.04], [7.15, 0], [7.5, 0], [7.65, 0.08], [7.8, -0.08], [7.95, 0.08], [8.1, -0.05], [8.3, 0]];
  const CH_YAW = [[0, 0.12], [1.1, 0.12], [1.4, 0.3], [2.1, 0.45], [3.4, 0.45], [3.6, 0.3], [4.2, 0.4], [5.1, 0.45], [CH_T.land, 0.3], [6.4, 0.0], [8.4, -0.12], [10, -0.18]];
  const CH_LT = [[0, 0.75], [1.45, 0.75], [1.62, 1.08], [2.1, 0.8], [4.3, 0.75], [4.6, 0.36], [5.3, 0.4], [5.6, 0.95], [6.75, 0.85], [6.8, 0.15], [7.25, 0.7], [7.4, 0.7], [7.56, 0.9], [8.3, 0.9], [8.5, 0.8]];
  const CH_LB = [[0, -1.2], [7.38, -1.2], [7.56, 0.42], [8.3, 0.42], [8.5, -1.2]];
  const CH_SMILE = [[0, 0.35], [1.45, 0.2], [1.6, 0], [2.2, 0.3], [3.4, 0.45], [3.7, 0.65], [4.3, 0.1], [4.6, -0.2], [5.15, -0.15], [5.3, 0.2], [5.85, 0.1], [6.0, 0.35], [6.75, 0.2], [6.85, -0.15], [7.3, 0.2], [7.5, 0.95], [10, 0.9]];
  const CH_OPEN = [[0, 0], [1.55, 0], [1.66, 0.55], [2.0, 0.2], [2.2, 0.05], [3.6, 0.25], [3.9, 0.05], [CH_T.jump, 0], [5.25, 0.4], [5.6, 0.2], [5.9, 0.5], [6.2, 0.1], [6.8, 0.35], [7.1, 0.05], [7.5, 0.6], [8.3, 0.45], [10, 0.42]];
  const CH_BY = [[0, 0], [1.6, 0.13], [2.1, 0.03], [4.4, 0], [4.6, -0.08], [5.3, -0.06], [5.5, 0.07], [6.75, 0.03], [6.85, -0.05], [7.3, 0.08], [7.5, 0.1], [10, 0.06]];
  const CH_BT = [[0, 0.05], [1.6, 0.28], [2.1, 0.1], [4.4, 0.05], [4.6, -0.38], [5.3, -0.32], [5.5, 0.12], [6.75, 0.1], [6.85, 0.32], [7.3, 0.15], [7.5, 0.22]];
  const CH_BLINK = [0.8, 2.12, 3.95, 9.15];
  const CH_WOB = [[2.6, 0.06], [3.25, 0.06], [5.95, 0.1], [6.82, 0.05], [7.52, 0.03], [7.94, 0.03]];
  function chHopY(t) {
    for (const [a, b, h, y0, y1] of CH_HOPS) if (t >= a && t < b) { const u = (t - a) / (b - a); return lerp(y0, y1, u) + 4 * h * u * (1 - u); }
    return t >= CH_T.land ? CH_PED.h : 0;
  }
  // The body pose: root on the ground, volume-preserving squash, lean about the contact point.
  function chBody(t) {
    const x = kf(t, CH_X), y = chHopY(t), air = CH_HOPS.some(([a, b]) => t >= a && t < b);
    let s = kf(t, CH_S) + (air ? 0 : 0.012 * Math.sin(t * 2.8));
    CH_WOB.forEach(([te, A]) => { if (t > te) s += A * Math.exp(-(t - te) * 7) * Math.sin((t - te) * TAU * 3.2); });
    s = Math.max(0.5, s);
    const lean = kf(t, CH_L) + (t > 8.4 ? 0.035 * Math.sin((t - 8.4) * 3.6) : 0), yaw = kf(t, CH_YAW);
    const rx = 0.58 / Math.sqrt(s), ry = 0.62 * s, rz = 0.54 / Math.sqrt(s), Rb = mmul(rotY(yaw), rotZ(lean));
    const base = [x, y, 0], up = mv(Rb, [0, 1, 0]), c = vadd(base, vmul(up, ry)), top = vadd(c, vmul(up, ry));
    return { x, y, s, lean, yaw, rx, ry, rz, Rb, c, up, top, air };
  }
  function chBall(t) {
    const r = 0.22;
    if (t < CH_T.drop) return { p: [0.95, 5, 0.25], r };
    if (t < 2.06) {
      // dropped in: bounces with restitution 0.5 under cartoon gravity
      const g = 46; let tt = t - CH_T.drop, y0 = 3.9 - r, v = 0, x = lerp(0.95, 0.32, E.outQ(seg(t, CH_T.drop, 2.06)));
      let T0 = Math.sqrt(2 * y0 / g);
      if (tt < T0) return { p: [x, r + y0 - 0.5 * g * tt * tt, 0.25], r };
      tt -= T0; v = g * T0 * 0.5;
      for (let k = 0; k < 4; k++) { const T = 2 * v / g; if (tt < T) return { p: [x, r + v * tt - 0.5 * g * tt * tt, 0.25], r }; tt -= T; v *= 0.5; }
      return { p: [x, r, 0.25], r };
    }
    const rest = [0.32, r, 0.25], ped = [2.5, CH_PED.h + r, -0.35];
    if (t < CH_T.nudge) return { p: rest, r };
    const arc = (a, b, t0, t1, h) => { const u = seg(t, t0, t1); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u) + 4 * h * u * (1 - u), lerp(a[2], b[2], u)]; };
    if (t < 4.15) return { p: arc(rest, [2.4, ped[1], -0.3], CH_T.nudge, 4.15, 1.6), r };
    if (t < 4.42) return { p: arc([2.4, ped[1], -0.3], ped, 4.15, 4.42, 0.2), r };
    if (t < CH_T.pop) return { p: ped, r };
    const head = B => vadd(B.top, vmul(B.up, r - 0.015));
    if (t < CH_T.bonk) return { p: arc(ped, head(chBody(CH_T.bonk)), CH_T.pop, CH_T.bonk, 1.9), r };
    // riding on the head, lagging a touch behind it
    const B = chBody(t), Bl = chBody(t - 0.08), p = head(B);
    return { p: [p[0] + (Bl.top[0] - B.top[0]) * 0.6 + 0.07, p[1] - 0.01, p[2] - 0.04], r };
  }
  const chGazeAt = (t, B, ball) => [[0, [0.45, 1.6, 7.6]], [1.15, ball.p], [6.75, vadd(B.c, mv(B.Rb, [0, 0.1, 0.9]))], [7.25, ball.p], [7.45, vadd(B.c, [0, 2.4, 3])], [8.3, [0.45, 1.75, 7.6]]];
  // Everything the tracer needs this frame: ellipsoids (M = diag(1/r)·Rᵀ), pedestal, lights, camera.
  function chScene(t) {
    const B = chBody(t), ball = chBall(t), objs = [];
    const ell = (c, R, r, mat, extra) => {
      const M = [R[0] / r[0], R[3] / r[0], R[6] / r[0], R[1] / r[1], R[4] / r[1], R[7] / r[1], R[2] / r[2], R[5] / r[2], R[8] / r[2]];
      objs.push({ c, M, br: Math.max(r[0], r[1], r[2]), mat, ...extra });
    };
    const I = [1, 0, 0, 0, 1, 0, 0, 0, 1], rr = [B.rx, B.ry, B.rz];
    ell(B.c, B.Rb, rr, 1);
    // eyes ride the squashed surface
    const es = kf(t, [[0, 1], [1.55, 1], [1.66, 1.14], [2.05, 1]]), re = 0.165 * es;
    let lid = kf(t, CH_LT);
    CH_BLINK.forEach(tb => { const u = seg(t, tb, tb + 0.16); if (u > 0 && u < 1) lid = lerp(lid, -1.15, 1 - Math.abs(u * 2 - 1)); });
    const lidB = kf(t, CH_LB);
    const G = chGazeAt(t, B, ball);
    let gz = G[0][1]; for (let i = 1; i < G.length; i++) gz = vlerp(gz, G[i][1], E.ioS(seg(t, G[i][0], G[i][0] + 0.18)));
    const by = kf(t, CH_BY), bt = kf(t, CH_BT);
    [-1, 1].forEach(sd => {
      const q = vnorm([sd * 0.34, 0.28, 0.9]), ec = vadd(B.c, mv(B.Rb, [rr[0] * q[0] * 0.9, rr[1] * q[1] * 0.9, rr[2] * q[2] * 0.9]));
      ell(ec, I, [re, re, re], 2, { gaze: vnorm(vsub(gz, ec)), lid, lidB, up: B.up, rt: mv(B.Rb, [1, 0, 0]), r: re });
      const qb = vnorm([sd * 0.36, 0.64 + by, 0.68]), bc = vadd(B.c, mv(B.Rb, [rr[0] * qb[0] * 1.0, rr[1] * qb[1] * 1.0, rr[2] * qb[2] * 1.0]));
      ell(bc, mmul(B.Rb, rotZ(sd > 0 ? -bt : bt)), [0.13, 0.034, 0.055], 3);
    });
    // feet stay planted on whatever is below
    const gy = B.x > 1.1 && t > CH_T.jump + 0.5 ? CH_PED.h : 0;
    [-1, 1].forEach(sd => {
      const fp = vadd(B.c, mv(B.Rb, [rr[0] * sd * 0.42, -rr[1] * 0.9, rr[2] * 0.36]));
      if (!B.air) fp[1] = Math.max(fp[1], gy + 0.07);
      ell(fp, rotY(B.yaw), [0.17, 0.08, 0.22], 4);
    });
    ell(ball.p, rotZ(-ball.p[0] / ball.r), [ball.r, ball.r, ball.r], 7, { spinR: rotZ(-ball.p[0] / ball.r) });
    // the antenna: a stalk of small spheres along a lagging curve, a bobble on the end
    const B1 = chBody(t - 0.07), B2 = chBody(t - 0.15);
    let lag = vadd(vmul(vsub(B1.top, B.top), 1.0), vmul(vsub(B2.top, B1.top), 0.7));
    CH_WOB.forEach(([te, A]) => { if (t > te) lag = vadd(lag, [A * 2.2 * Math.exp(-(t - te) * 5) * Math.sin((t - te) * TAU * 2.4), 0, 0]); });
    // once the ball is riding on the head, it pins the antenna over to one side
    const pin = E.outB(seg(t, CH_T.bonk - 0.16, CH_T.bonk + 0.06), 2);
    lag = vadd(lag, vmul([-0.42, -0.2, 0.22], pin));
    const P0 = vsub(B.top, vmul(B.up, 0.03));
    let tip = vadd(vadd(B.top, vmul(B.up, 0.44)), lag);
    tip = vadd(B.top, vmul(vnorm(vsub(tip, B.top)), 0.44));
    const P1 = vadd(vadd(B.top, vmul(B.up, 0.24)), vmul(lag, 0.35));
    for (let k = 0; k < 18; k++) {
      const u = k / 18, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), cc = u * u;
      ell([a * P0[0] + b * P1[0] + cc * tip[0], a * P0[1] + b * P1[1] + cc * tip[1], a * P0[2] + b * P1[2] + cc * tip[2]], I, [0.03, 0.03, 0.03], 5);
    }
    ell(tip, I, [0.085, 0.085, 0.085], 6);
    const push = E.ioS(seg(t, 7.6, 10));
    const C = cam([lerp(0.45, 0.85, push), lerp(1.75, 1.85, push), lerp(7.6, 6.9, push)], [lerp(0.55, 1.05, push), lerp(1.12, 1.3, push), 0], 930, CH_BW / 2, CH_BH / 2);
    return { B, ball, objs, C, mouth: { smile: kf(t, CH_SMILE), open: kf(t, CH_OPEN) } };
  }
  const CH_LK = vnorm([-0.55, 0.78, 0.5]), CH_LF = vnorm([0.85, 0.25, 0.45]), CH_LR = vnorm([0.45, 0.55, -0.75]);
  const ss = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  // Soft shadow of an ellipsoid along the key light: closest approach of the ray in unit-sphere space.
  function chEllShadow(o, px, py, pz) {
    const M = o.M, ox = px - o.c[0], oy = py - o.c[1], oz = pz - o.c[2];
    const qx = M[0] * ox + M[1] * oy + M[2] * oz, qy = M[3] * ox + M[4] * oy + M[5] * oz, qz = M[6] * ox + M[7] * oy + M[8] * oz;
    const L = CH_LK, dx = M[0] * L[0] + M[1] * L[1] + M[2] * L[2], dy = M[3] * L[0] + M[4] * L[1] + M[5] * L[2], dz = M[6] * L[0] + M[7] * L[1] + M[8] * L[2];
    const dd = dx * dx + dy * dy + dz * dz, tc = -(qx * dx + qy * dy + qz * dz) / dd;
    if (tc <= 0) return 1;
    const cx = qx + dx * tc, cy = qy + dy * tc, cz = qz + dz * tc, dist = Math.sqrt(cx * cx + cy * cy + cz * cz), pen = 0.06 + 0.28 * tc * Math.sqrt(dd);
    return ss(1 - pen, 1 + pen, dist);
  }
  function chPedShadow(px, py, pz) {
    const P = CH_PED, L = CH_LK; if (py >= P.h - 1e-3) return 1;
    const s1 = (P.h - py) / L[1], dx = px - P.x, dz = pz - P.z, hh = L[0] * L[0] + L[2] * L[2];
    const s = clamp(-(dx * L[0] + dz * L[2]) / hh, 0, s1), mx = dx + L[0] * s, mz = dz + L[2] * s, d = Math.sqrt(mx * mx + mz * mz), pen = 0.02 + 0.08 * s;
    return ss(P.r - pen, P.r + pen, d);
  }
  function chEllAO(o, px, py, pz, nx, ny, nz) {
    const vx = o.c[0] - px, vy = o.c[1] - py, vz = o.c[2] - pz, l = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1, M = o.M;
    const qx = -(M[0] * vx + M[1] * vy + M[2] * vz), qy = -(M[3] * vx + M[4] * vy + M[5] * vz), qz = -(M[6] * vx + M[7] * vy + M[8] * vz), lu2 = qx * qx + qy * qy + qz * qz;
    const cs = (nx * vx + ny * vy + nz * vz) / l;
    return cs > 0 ? clamp(cs / Math.max(1, lu2) * 0.95) : 0;
  }
  // The tracer: primary rays against ellipsoids / cylinder / floor, then soft key + fill + rim + hemispheric AO.
  function chTrace(st, S) {
    const { objs, C, mouth } = S, data = st.img.data, W = CH_BW, H = CH_BH, e = C.e, q = [0, 0, 0];
    const n = objs.length, bx0 = new Int32Array(n), bx1 = new Int32Array(n), by0 = new Int32Array(n), by1 = new Int32Array(n);
    const OX = new Float64Array(n * 3), CC = new Float64Array(n);
    objs.forEach((o, i) => {
      proj(C, o.c, q); const rp = C.f * o.br / Math.max(0.1, q[2]) * 1.1 + 2;
      bx0[i] = Math.floor(q[0] - rp); bx1[i] = Math.ceil(q[0] + rp); by0[i] = Math.floor(q[1] - rp); by1[i] = Math.ceil(q[1] + rp);
      const M = o.M, ox = e[0] - o.c[0], oy = e[1] - o.c[1], oz = e[2] - o.c[2];
      const a = M[0] * ox + M[1] * oy + M[2] * oz, b = M[3] * ox + M[4] * oy + M[5] * oz, c2 = M[6] * ox + M[7] * oy + M[8] * oz;
      OX[i * 3] = a; OX[i * 3 + 1] = b; OX[i * 3 + 2] = c2; CC[i] = a * a + b * b + c2 * c2 - 1;
    });
    const body = objs[0], ballO = objs.find(o => o.mat === 7), feet = objs.filter(o => o.mat === 4), eyes = objs.filter(o => o.mat === 2);
    const P = CH_PED, K = [2.3, 2.05, 1.8], F = [0.32, 0.4, 0.6], Rm = [1.3, 1.2, 1.1], SKY = [0.42, 0.44, 0.52], BNC = [0.32, 0.24, 0.17];
    const u = C.u, v = C.v, w = C.w, f = C.f;
    let idx = 0;
    for (let py = 0; py < H; py++) {
      const sy = H / 2 - py - 0.5;
      for (let px = 0; px < W; px++, idx += 4) {
        const sx = px + 0.5 - W / 2;
        let dx = u[0] * sx + v[0] * sy + w[0] * f, dy = u[1] * sx + v[1] * sy + w[1] * f, dz = u[2] * sx + v[2] * sy + w[2] * f;
        const dl = 1 / Math.sqrt(dx * dx + dy * dy + dz * dz); dx *= dl; dy *= dl; dz *= dl;
        let tmin = 1e9, hit = -1, hq0 = 0, hq1 = 0, hq2 = 0, kind = 0;   // kind: 0 none, 1 ellipsoid, 2 ped side, 3 ped top, 4 floor
        for (let i = 0; i < n; i++) {
          if (px < bx0[i] || px > bx1[i] || py < by0[i] || py > by1[i]) continue;
          const M = objs[i].M, ddx = M[0] * dx + M[1] * dy + M[2] * dz, ddy = M[3] * dx + M[4] * dy + M[5] * dz, ddz = M[6] * dx + M[7] * dy + M[8] * dz;
          const ox = OX[i * 3], oy = OX[i * 3 + 1], oz = OX[i * 3 + 2], a = ddx * ddx + ddy * ddy + ddz * ddz, b = ox * ddx + oy * ddy + oz * ddz, disc = b * b - a * CC[i];
          if (disc <= 0) continue;
          const tt = (-b - Math.sqrt(disc)) / a;
          if (tt > 1e-3 && tt < tmin) { tmin = tt; hit = i; kind = 1; hq0 = ox + tt * ddx; hq1 = oy + tt * ddy; hq2 = oz + tt * ddz; }
        }
        // pedestal: capped vertical cylinder
        {
          const ox = e[0] - P.x, oz = e[2] - P.z, a = dx * dx + dz * dz, b = ox * dx + oz * dz, c2 = ox * ox + oz * oz - P.r * P.r, disc = b * b - a * c2;
          if (disc > 0) {
            const tt = (-b - Math.sqrt(disc)) / a, yy = e[1] + dy * tt;
            if (tt > 0 && tt < tmin && yy >= 0 && yy <= P.h) { tmin = tt; kind = 2; hit = -1; }
            else if (dy < 0) { const t2 = (P.h - e[1]) / dy, X = ox + dx * t2, Z = oz + dz * t2; if (t2 > 0 && t2 < tmin && X * X + Z * Z <= P.r * P.r) { tmin = t2; kind = 3; hit = -1; } }
          }
        }
        if (dy < 0) { const tf = -e[1] / dy; if (tf < tmin) { tmin = tf; kind = 4; hit = -1; } }
        let R, G, Bc;
        if (kind === 0) {
          // backdrop above the horizon: warm cyc fading up
          const h = clamp(dy * 3);
          R = lerp(CH_COL.bg[0], CH_COL.top[0], h); G = lerp(CH_COL.bg[1], CH_COL.top[1], h); Bc = lerp(CH_COL.bg[2], CH_COL.top[2], h);
        } else {
          const X = e[0] + dx * tmin, Y = e[1] + dy * tmin, Z = e[2] + dz * tmin;
          let nx = 0, ny = 1, nz = 0, alb = CH_COL.floor, spec = 0, shin = 40, wrap = 0, rimK = 0.15, mat = 0, o = null;
          if (kind === 1) {
            o = objs[hit]; mat = o.mat; const M = o.M;
            nx = M[0] * hq0 + M[3] * hq1 + M[6] * hq2; ny = M[1] * hq0 + M[4] * hq1 + M[7] * hq2; nz = M[2] * hq0 + M[5] * hq1 + M[8] * hq2;
            const nl = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz); nx *= nl; ny *= nl; nz *= nl;
            if (mat === 1) {
              // body: belly gradient, blush cheeks, the mouth painted on the unit sphere
              alb = CH_COL.body; wrap = 0.45; spec = 0.35; shin = 36; rimK = 0.55;
              const by = clamp(-hq1 * 1.4 + 0.1) * clamp(hq2 * 2);
              alb = [lerp(alb[0], CH_COL.belly[0], by * 0.6), lerp(alb[1], CH_COL.belly[1], by * 0.6), lerp(alb[2], CH_COL.belly[2], by * 0.6)];
              if (hq2 > 0.4) {
                const ch = Math.max(0, 1 - (((Math.abs(hq0) - 0.5) ** 2 + (hq1 + 0.08) ** 2) / 0.012));
                if (ch > 0) alb = [lerp(alb[0], CH_COL.cheek[0], ch * 0.5), lerp(alb[1], CH_COL.cheek[1], ch * 0.5), lerp(alb[2], CH_COL.cheek[2], ch * 0.5)];
                const mw = 0.24 + 0.06 * mouth.smile, xx = hq0 / mw;
                if (xx > -1 && xx < 1) {
                  const yU = -0.17 + 0.1 * mouth.smile * xx * xx, th = (0.024 + mouth.open * 0.17 * (1 - xx * xx)) * (1 - xx ** 6 * 0.6), yL = yU - th;
                  if (hq1 < yU && hq1 > yL) { const tg = mouth.open > 0.15 && hq1 < yL + th * 0.42; alb = tg ? CH_COL.tongue : CH_COL.mouth; spec = 0.1; rimK = 0; }
                }
              }
            } else if (mat === 2) {
              // eye: sclera, iris and pupil around the gaze, lids from the body's frame
              const cx = (X - o.c[0]) / o.r, cy = (Y - o.c[1]) / o.r, cz = (Z - o.c[2]) / o.r, up = o.up, hy = cx * up[0] + cy * up[1] + cz * up[2];
              const g = o.gaze, dg = cx * g[0] + cy * g[1] + cz * g[2];
              alb = CH_COL.sclera; spec = 1.4; shin = 260; rimK = 0.1;
              if (dg > 0.8) alb = dg > 0.925 ? CH_COL.pupil : [CH_COL.iris[0] * (0.6 + 1.6 * (dg - 0.8)), CH_COL.iris[1] * (0.6 + 1.6 * (dg - 0.8)), CH_COL.iris[2] * (0.6 + 1.6 * (dg - 0.8))];
              // the lower lid arches (a happy squint reads as an upturned crescent)
              const hx = cx * o.rt[0] + cy * o.rt[1] + cz * o.rt[2], lb = o.lidB - 0.9 * hx * hx * clamp(o.lidB + 1);
              if (hy > o.lid || hy < lb) { alb = CH_COL.body; spec = 0.3; shin = 30; wrap = 0.4; }
              else if (hy > o.lid - 0.07 || hy < lb + 0.07) alb = [0.08, 0.04, 0.02];
            } else if (mat === 3) { alb = CH_COL.brow; spec = 0.1; wrap = 0.3; }
            else if (mat === 4) { alb = CH_COL.foot; wrap = 0.4; spec = 0.2; rimK = 0.3; }
            else if (mat === 5) { alb = CH_COL.stalk; wrap = 0.3; spec = 0.2; }
            else if (mat === 6) { alb = CH_COL.tip; spec = 0.8; shin = 60; wrap = 0.3; rimK = 0.4; }
            else if (mat === 7) {
              const Rr = o.spinR, lx = (X - o.c[0]), ly = (Y - o.c[1]), lz = (Z - o.c[2]);
              const yl = (Rr[1] * lx + Rr[4] * ly + Rr[7] * lz) / 0.22;
              alb = Math.abs(yl) < 0.26 ? CH_COL.stripe : CH_COL.ball; spec = 0.9; shin = 90; rimK = 0.3;
            }
          } else if (kind === 2) {
            const ax = X - P.x, az = Z - P.z, l = Math.sqrt(ax * ax + az * az) || 1; nx = ax / l; ny = 0; nz = az / l;
            const bev = clamp((Y - (P.h - 0.05)) / 0.05); nx *= 1 - bev * 0.6; nz *= 1 - bev * 0.6; ny = bev * 0.8;
            const nl = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz); nx *= nl; ny *= nl; nz *= nl;
            alb = CH_COL.ped; spec = 0.25; shin = 30; rimK = 0.25; mat = 8;
          } else if (kind === 3) {
            const ax = X - P.x, az = Z - P.z, rr = Math.sqrt(ax * ax + az * az), bev = clamp((rr - (P.r - 0.05)) / 0.05);
            nx = ax / (rr || 1) * bev * 0.6; nz = az / (rr || 1) * bev * 0.6; ny = 1; const nl = 1 / Math.sqrt(nx * nx + ny * ny + nz * nz); nx *= nl; ny *= nl; nz *= nl;
            alb = CH_COL.ped; spec = 0.25; shin = 30; mat = 8;
          }
          // ---- lighting ----
          const ndl = nx * CH_LK[0] + ny * CH_LK[1] + nz * CH_LK[2];
          let sh = 1;
          if (ndl > -wrap) {
            const ox = X + nx * 0.004, oy = Y + ny * 0.004, oz = Z + nz * 0.004;
            if (mat !== 1 && mat !== 2 && mat !== 3) sh *= chEllShadow(body, ox, oy, oz);
            if (mat !== 7 && sh > 0.01) sh *= chEllShadow(ballO, ox, oy, oz);
            if (mat !== 8 && sh > 0.01) sh *= chPedShadow(ox, oy, oz);
          }
          let ao = 1;
          if (mat !== 1 && mat !== 2) ao *= 1 - chEllAO(body, X, Y, Z, nx, ny, nz);
          if (mat !== 7) ao *= 1 - chEllAO(ballO, X, Y, Z, nx, ny, nz);
          if (mat !== 4) { ao *= 1 - 0.8 * chEllAO(feet[0], X, Y, Z, nx, ny, nz); ao *= 1 - 0.8 * chEllAO(feet[1], X, Y, Z, nx, ny, nz); }
          if (mat === 1) { ao *= 1 - 0.9 * chEllAO(eyes[0], X, Y, Z, nx, ny, nz); ao *= 1 - 0.9 * chEllAO(eyes[1], X, Y, Z, nx, ny, nz); }
          if (kind === 4) { const dr = Math.sqrt((X - P.x) ** 2 + (Z - P.z) ** 2) - P.r; ao *= 1 - 0.5 * Math.exp(-Math.max(0, dr) * 5); }
          if (mat === 8 && kind === 2) ao *= 1 - 0.45 * Math.exp(-Y * 7);
          if (kind === 1) { const gy = (X > P.x - P.r - 0.3 && X < P.x + P.r + 0.3 && Y > P.h - 0.2) ? P.h : 0; ao *= 1 - 0.5 * clamp(-ny) * Math.exp(-(Y - gy) * 4); }
          ao = Math.max(0.12, ao);
          const dif = wrap > 0 ? clamp((ndl + wrap) / (1 + wrap)) : Math.max(0, ndl);
          const sss = wrap > 0 ? clamp(1 - Math.abs(ndl + 0.1) * 2.5) * 0.28 : 0;
          const fd = Math.max(0, nx * CH_LF[0] + ny * CH_LF[1] + nz * CH_LF[2]) * 0.55;
          const hemi = 0.5 + 0.5 * ny, ndv = Math.max(0, -(nx * dx + ny * dy + nz * dz)), fres = Math.pow(1 - ndv, 3);
          const rim = fres * rimK * (0.35 + Math.max(0, nx * CH_LR[0] + ny * CH_LR[1] + nz * CH_LR[2])) * sh;
          const hx = CH_LK[0] - dx, hy2 = CH_LK[1] - dy, hz = CH_LK[2] - dz, hl = 1 / Math.sqrt(hx * hx + hy2 * hy2 + hz * hz);
          const sp = spec > 0 && ndl > 0 ? spec * Math.pow(Math.max(0, (nx * hx + ny * hy2 + nz * hz) * hl), shin) * sh * (0.4 + fres) : 0;
          const lit = k => alb[k] * (K[k] * dif * sh + F[k] * fd * ao + (SKY[k] * hemi + BNC[k] * (1 - hemi)) * ao * 0.9) + alb[k] * [1, 0.3, 0.15][k] * sss * sh + sp * K[k] * 0.5 + rim * Rm[k];
          R = lit(0); G = lit(1); Bc = lit(2);
          if (kind === 4) {
            // spotlight pool on the floor, fogging into the cyc
            const d2 = (X - 0.6) ** 2 + (Z - 0.1) ** 2, pool = 0.55 + 0.6 * Math.exp(-d2 / 12), fog = ss(6, 18, tmin);
            R = lerp(R * pool, CH_COL.bg[0], fog); G = lerp(G * pool, CH_COL.bg[1], fog); Bc = lerp(Bc * pool, CH_COL.bg[2], fog);
          }
        }
        // filmic-ish rolloff, gamma 2
        data[idx] = Math.sqrt(1 - Math.exp(-R * 1.05)) * 255; data[idx + 1] = Math.sqrt(1 - Math.exp(-G * 1.05)) * 255; data[idx + 2] = Math.sqrt(1 - Math.exp(-Bc * 1.05)) * 255; data[idx + 3] = 255;
      }
    }
    st.buf.getContext('2d').putImageData(st.img, 0, 0);
  }
  function chChip(c, s, t, a, b) {
    const u = seg(t, a, a + 0.2) * (1 - seg(t, b - 0.2, b)); if (u <= 0) return;
    c.save(); c.globalAlpha = u;
    c.font = `800 26px ${NUN}`; const w = c.measureText(s).width + s.length * 2.5 + 70;
    c.fillStyle = 'rgba(59,42,30,0.82)'; rrect(c, 80, 950, w, 56, 28); c.fill();
    c.fillStyle = CH.accent; c.beginPath(); c.arc(106, 978, 7, 0, TAU); c.fill();
    text(c, s, 124, 987, { font: NUN, weight: 800, size: 26, color: CH.cream, ls: 2.5 });
    c.restore();
  }

  MG.film({
    id: 'character3d', dur: 10, poster: 9.4,
    fonts: [['600 120px Fredoka', '3D Character Animation'], ['800 26px Nunito', 'ANTICIPATON·SQUASH&STRETCHFOLLOW-THROUGHARCSECNDYAP'], ['700 30px Nunito', 'Squash, Stretch and Performance']],
    meta: {
      family: 'D', name: '3D Character Animation', sub: 'Squash, Stretch and Performance', era: '1986 —',
      origin: 'Keyframed CG characters that act: the hand-drawn principles of the Disney animators — squash and stretch, anticipation, arcs, follow-through, appeal — applied to 3D models, which John Lasseter set out in his 1987 SIGGRAPH paper after Pixar’s Luxo Jr. (1986) proved two desk lamps could carry a story. Pixar’s Toy Story (1995) made it a feature-film medium, and the soft-lit, rounded, expressive house style it set is now the default language of studio animation, game cinematics and mascot spots.',
      works: 'Luxo Jr. (John Lasseter, Pixar, 1986) · Toy Story (John Lasseter, Pixar, 1995) · Geri’s Game (Jan Pinkava, Pixar, 1997) · For the Birds (Ralph Eggleston, Pixar, 2000) · WALL·E (Andrew Stanton, Pixar, 2008) · The Illusion of Life (Frank Thomas & Ollie Johnston, 1981)',
      tech: ['Volume-kept squash and stretch', 'Lagged antenna follow-through', 'Ray-traced soft shadows + AO'],
      accent: '#ffb53b',
      motionDNA: 'Acting in poses and timing: every action is announced by an anticipation in the opposite direction, travels on a clean parabolic arc with stretch along the velocity, lands in a squash that springs back through overshoot, while appendages lag and whip through after the body stops; eyes and brows lead the thought a few frames before the body moves.',
      visualDNA: 'A simple, rounded, saturated character with huge eyes and readable brows on a warm seamless cyc; soft key light with wrapped, subsurface-warm terminators, a cool fill, a bright rim, gentle contact shadows and ambient occlusion, glossy catchlights in the eyes.',
      transitions: 'Held shot with a slow push-in; staging and acting carry the cut points; breakdown captions name each principle',
      implementation: ['Maya / Presto rigs, keyframed in the graph editor', 'RenderMan / Arnold / Cycles with area lights + AO', 'Blender Grease-Pencil blocking, then splined', 'Canvas 2D: per-pixel ray tracer over ellipsoids (960×540, upscaled), analytic soft shadows and AO'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { const buf = offscreen(CH_BW, CH_BH); return { buf, img: buf.getContext('2d').createImageData(CH_BW, CH_BH) }; },
    draw(c, t, W, H, st) {
      const S = chScene(t);
      chTrace(st, S);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(st.buf, 0, 0, W, H);
      const CF = { ...S.C, f: S.C.f * 2, cx: 960, cy: 540 };
      // animator's arc: the jump's spacing, ghosted
      const aa = seg(t, CH_T.crouch + 0.2, CH_T.jump) * (1 - seg(t, 6.3, 6.7));
      if (aa > 0) {
        c.save();
        for (let k = 0; k <= 22; k++) {
          const tt = CH_T.jump + (CH_T.land - CH_T.jump) * k / 22, B = chBody(tt), p = proj(CF, B.c);
          const past = tt <= t;
          c.globalAlpha = aa * (past ? 0.9 : 0.45);
          c.fillStyle = past ? '#ffffff' : 'rgba(255,255,255,0.6)'; c.beginPath(); c.arc(p[0], p[1], past ? 6 : 4, 0, TAU); c.fill();
          if (k % 4 === 0) { c.strokeStyle = 'rgba(59,42,30,0.5)'; c.lineWidth = 2; c.beginPath(); c.arc(p[0], p[1], 10, 0, TAU); c.stroke(); }
        }
        c.restore();
      }
      chChip(c, 'ANTICIPATION · TAKE', t, CH_T.take - 0.05, 2.15);
      chChip(c, 'SQUASH & STRETCH', t, 2.2, 3.4);
      chChip(c, 'STAGING', t, 3.45, 4.45);
      chChip(c, 'ANTICIPATION', t, CH_T.crouch, CH_T.jump);
      chChip(c, 'ARCS', t, CH_T.jump, CH_T.land);
      chChip(c, 'FOLLOW-THROUGH', t, CH_T.land, 6.7);
      chChip(c, 'SECONDARY ACTION', t, CH_T.bonk, 7.4);
      chChip(c, 'APPEAL', t, 7.45, CH_T.title);
      // frame counter, animator style
      c.save(); c.globalAlpha = 0.7 * (1 - seg(t, CH_T.title - 0.3, CH_T.title));
      text(c, 'F ' + String(Math.floor(t * 24) + 1).padStart(3, '0'), 1840, 990, { font: NUN, weight: 800, size: 24, color: 'rgba(59,42,30,0.7)', align: 'right', ls: 2 });
      c.restore();
      if (t > CH_T.title) {
        const ws = ['3D', 'Character', 'Animation'];
        ws.forEach((wd, i) => {
          const t0 = CH_T.title + i * 0.12, p = t <= t0 ? 0 : spring(t - t0, 2.2, 0.45);
          if (p <= 0.01) return;
          const x = [110, 110, 110][i], y = [190, 300, 410][i];
          c.save(); c.translate(x, y); c.scale(clamp(p, 0, 1.3), clamp(p, 0, 1.3));
          text(c, wd, 6, 8, { font: FRED, weight: 600, size: 112, color: 'rgba(120,70,30,0.25)' });
          text(c, wd, 0, 0, { font: FRED, weight: 600, size: 112, color: i === 1 ? '#ff8f2b' : CH.ink });
          c.restore();
        });
        const u = E.outC(seg(t, CH_T.sub, CH_T.sub + 0.6));
        c.save(); c.globalAlpha = u;
        text(c, 'Squash, Stretch and Performance', 116, 480 + (1 - u) * 12, { font: NUN, weight: 700, size: 34, color: 'rgba(59,42,30,0.8)' });
        c.restore();
      }
      vignette(c, W, H, 0.22, '60,30,10');
      grain(c, W, H, t, 0.025, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 1.05;
      const T = CH_T, B = 0.5;
      // idle: a tiptoeing pizzicato in C, bass on the beat
      const idle = [[0.0, 60], [0.25, 64], [0.5, 67], [0.75, 64], [1.0, 72]];
      idle.forEach(([tt, m], i) => A.pluck(tt, midi(m), { g: 0.16, dur: 0.6, bright: 0.6, decay: 0.99, rev: 0.25, pan: (i % 2 ? 0.25 : -0.25) }));
      A.pluck(0, midi(36), { g: 0.22, dur: 0.8, bright: 0.4, decay: 0.993 }); A.pluck(0.5, midi(43), { g: 0.18, dur: 0.8, bright: 0.4, decay: 0.993 });
      A.bell(0.8, midi(91), { g: 0.03, dur: 0.4, ratios: [1, 3.9, 9.2] });
      // the ball: woody bounces
      [1.37, 1.69, 1.85, 1.93, 1.97].forEach((tt, i) => { const g = 0.16 * Math.pow(0.65, i); A.osc(tt, { type: 'triangle', f: 700 - i * 30, f2: 420, glide: 0.04, dur: 0.08, g, rev: 0.2 }); A.noise(tt, { type: 'bandpass', f: 1800, q: 4, dur: 0.03, g: g * 0.5 }); });
      // the take: slide whistle up
      A.osc(T.take + 0.12, { f: 600, f2: 1500, glide: 0.18, dur: 0.3, g: 0.07, vib: [7, 14], rev: 0.3 });
      // hops: boing up, soft squish down
      [[T.hop1, 2.6], [T.hop2, 3.25]].forEach(([a, l]) => { A.osc(a, { f: 260, f2: 520, glide: 0.15, dur: 0.22, g: 0.08, vib: [18, 25] }); A.noise(l, { type: 'lowpass', f: 600, dur: 0.12, g: 0.1 }); A.osc(l, { f: 160, f2: 90, glide: 0.08, dur: 0.12, g: 0.1 }); });
      // walk-and-think bassoon line
      [[2.3, 48], [2.55, 52], [2.95, 55], [3.2, 53]].forEach(([tt, m]) => A.osc(tt, { type: 'sawtooth', f: midi(m), dur: 0.22, g: 0.05, lp: 700, a: 0.02, rev: 0.2 }));
      // nudge, flight, two taps on the plinth
      A.osc(T.nudge, { type: 'triangle', f: 330, f2: 200, glide: 0.06, dur: 0.12, g: 0.12 });
      A.osc(T.nudge + 0.02, { f: 900, f2: 1700, glide: 0.25, dur: 0.5, g: 0.04, vib: [6, 20] });
      [4.15, 4.42].forEach((tt, i) => A.osc(tt, { type: 'triangle', f: 760, f2: 460, glide: 0.04, dur: 0.08, g: 0.12 - i * 0.04, rev: 0.2 }));
      // the wind-up: rising tremolo strings and chromatic bassoon steps
      A.osc(T.crouch, { type: 'sawtooth', f: midi(55), f2: midi(62), glide: 0.6, dur: 0.62, g: 0.035, lp: 1400, vib: [9, 8], rev: 0.3 });
      [[4.55, 43], [4.75, 44], [4.95, 45]].forEach(([tt, m]) => A.osc(tt, { type: 'sawtooth', f: midi(m), dur: 0.16, g: 0.06, lp: 600 }));
      // the leap
      A.osc(T.jump, { f: 200, f2: 700, glide: 0.25, dur: 0.35, g: 0.1, vib: [16, 30] });
      A.whoosh(T.jump, 0.7, { f1: 400, f2: 2400, g: 0.08, swell: 0.4 });
      A.osc(T.jump + 0.05, { f: 700, f2: 1600, glide: 0.3, dur: 0.33, g: 0.04, vib: [7, 15] }); A.osc(T.jump + 0.38, { f: 1600, f2: 500, glide: 0.33, dur: 0.36, g: 0.04, vib: [7, 15] });
      // landing thud + squish, the ball pops
      A.kick(T.land, 0.55, { f: 110, f2: 40, dur: 0.4 }); A.noise(T.land, { type: 'lowpass', f: 900, dur: 0.18, g: 0.12 });
      A.osc(T.pop + 0.02, { f: 500, f2: 1400, glide: 0.4, dur: 0.45, g: 0.04, vib: [6, 18] });
      // bonk + dizzy trill
      A.osc(T.bonk, { type: 'triangle', f: 980, f2: 520, glide: 0.05, dur: 0.12, g: 0.16, rev: 0.25 }); A.noise(T.bonk, { type: 'bandpass', f: 2400, q: 5, dur: 0.04, g: 0.08 });
      for (let k = 0; k < 6; k++) A.bell(T.bonk + 0.1 + k * 0.07, midi(k % 2 ? 88 : 91), { g: 0.02, dur: 0.3, ratios: [1, 3.9], pan: k % 2 ? 0.4 : -0.4 });
      // delight: glockenspiel arpeggio over a pizz chord, then the title cadence
      [72, 76, 79, 84, 88].forEach((m, i) => A.bell(T.happy + 0.1 + i * 0.08, midi(m), { g: 0.04, dur: 1.0, rev: 0.4, pan: (i - 2) * 0.2 }));
      [48, 55, 64, 67].forEach((m, i) => A.pluck(T.happy + 0.12 + i * 0.02, midi(m), { g: 0.14, dur: 0.9, bright: 0.55, rev: 0.3 }));
      for (let k = 0; k < 4; k++) { const tt = 7.9 + k * B / 2; A.pluck(tt, midi([67, 69, 71, 72][k]), { g: 0.13, dur: 0.5, bright: 0.6, rev: 0.25 }); }
      A.pluck(T.title, midi(36), { g: 0.25, dur: 1.6, bright: 0.4, decay: 0.995 });
      A.chord(T.title, [48, 55, 60, 64, 67, 72], { type: 'triangle', dur: 1.5, g: 0.035, a: 0.04, hold: true, rel: 0.6, lp: 3000, spread: 4, width: 0.8, rev: 0.4 });
      [84, 88, 91, 96].forEach((m, i) => A.bell(T.title + 0.05 + i * 0.1, midi(m), { g: 0.035, dur: 1.4, rev: 0.5, pan: (i - 1.5) * 0.3 }));
      A.osc(T.sub, { f: 700, f2: 1400, glide: 0.12, dur: 0.18, g: 0.03, vib: [12, 20] });
    },
  });
})();
