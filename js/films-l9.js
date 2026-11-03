/* batch l9 — Rendering Looks · Shading, Image: looknormals · lookpixel · lookchromatic.
   looknormals (the normal pass as a look: world-space normals encoded as rgb = n·0.5 + 0.5, then
   view-space normals, a colour-to-direction legend sphere, tangent-space normal-map detail on the
   floor and the cube, and finally the scene relit by a moving point light from the passes alone) ·
   lookpixel (pixel art from a 3D render: the internal resolution steps down on the beat with a
   nearest-neighbour upscale, then a 16-colour palette without and with Bayer ordered dithering,
   a one-pixel outline pass and a swap to four Game Boy greens) ·
   lookchromatic (lens colour fringing in post: lateral CA scales R, G and B differently from the
   frame centre, longitudinal CA defocuses R and B on every edge, strength rising on the beat, then
   an achromatic doublet corrects it; a loupe with an RGB edge profile and a focus diagram). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, hash, midi, text } = MG;
  const LK = MG.LK, V = LK.V, P = LK.P, B = LK.BEAT;
  const { add, sub, mul, dot, norm } = V;
  const mix3 = LK.mix3;

  /* ---------------- shared helpers ---------------- */
  const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const HALO = 'rgba(236,232,223,0.88)';
  /* DK: the film draws on a dark frame, so free-standing labels turn light with a dark halo
     (labels on paper panels pass halo: false and keep their ink). */
  let DK = false;
  const SUB = '#4a4741', SUBD = 'rgba(236,232,223,0.74)', HALOD = 'rgba(8,9,12,0.82)';
  const label = (c, s, x, y, o = {}) => {
    const dk = DK && o.halo !== false, col = o.color || P.mute;
    const color = dk ? (col === P.ink ? P.paper : col === SUB || col === P.mute ? SUBD : col) : col;
    text(c, s, x, y, { font: MG.TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color, align: o.align || 'left', weight: o.weight || 400, base: o.base, stroke: o.halo === false ? undefined : dk ? HALOD : HALO, lw: 5 });
  };
  const tag = (c, s, x, y, on = 1) => {   // accent dot + mono label, top-left of frame
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: P.ink, weight: 700, size: 20 });
    c.restore();
  };
  const note = (c, s, x, y, on = 1) => { if (on > 0.001) { c.save(); c.globalAlpha *= on; label(c, s, x, y, { size: 15, ls: 1.5, color: SUB }); c.restore(); } };
  /* Leader-line label pointing at a world point: dot on the object, elbow line, title + note. */
  function callout(c, S, W, H, p, dx, dy, title, sub, on) {
    if (on <= 0.001) return;
    const q = LK.project(S, p, W, H); if (!q) return;
    const x1 = q[0] + dx, y1 = q[1] + dy, dir = dx >= 0 ? 1 : -1, x2 = x1 + dir * 26;
    c.save(); c.globalAlpha *= on; c.lineCap = 'round';
    const path = () => { c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(x1, y1); c.lineTo(x2, y1); c.stroke(); };
    c.strokeStyle = DK ? HALOD : HALO; c.lineWidth = 5; path();
    c.strokeStyle = DK ? P.paper : P.ink; c.lineWidth = 1.6; path();
    c.fillStyle = P.paper; c.beginPath(); c.arc(q[0], q[1], 8, 0, TAU); c.fill();
    c.fillStyle = P.accent; c.beginPath(); c.arc(q[0], q[1], 5, 0, TAU); c.fill();
    const al = dir > 0 ? 'left' : 'right';
    label(c, title, x2 + dir * 10, y1 + 6, { align: al, color: P.ink, weight: 700, size: 18, ls: 2 });
    if (sub) label(c, sub, x2 + dir * 10, y1 + 30, { align: al, size: 14, ls: 1.5, color: SUB });
    c.restore();
  }
  /* The moving split between the new look (left) and the previous state (right). */
  function wipeLine(c, sx, W, H, left, right, on = 1, ly = 330) {
    if (on <= 0.001 || sx <= 0.0005 || sx >= 0.9995) return;
    const x = sx * W;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = HALO; c.fillRect(x - 3, 0, 6, H);
    c.fillStyle = P.accent; c.fillRect(x - 1.5, 0, 3, H);
    label(c, left + '  ◀', x - 16, ly, { align: 'right', color: P.ink, weight: 700, size: 16 });
    label(c, '▶  ' + right, x + 16, ly, { color: P.ink, weight: 700, size: 16 });
    c.restore();
  }
  /* Small pass inset on the right: a second, low-resolution render of the same frame. */
  const INS = { w: 320, h: 180, res: [192, 108] };
  function inset(c, t, W, H, x, y, title, shade, on) {
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x + 6, y + 6, INS.w, INS.h);
    LK.render(c, t, W, H, shade, { res: INS.res, rect: [x, y, INS.w, INS.h], aa: false });
    c.strokeStyle = P.paper; c.lineWidth = 1.5; c.strokeRect(x - 0.75, y - 0.75, INS.w + 1.5, INS.h + 1.5);
    label(c, title, x, y - 12, { size: 14, ls: 2, color: P.ink, weight: 700 });
    c.restore();
  }
  const panel = (c, x, y, w, h, a = 0.9) => { c.save(); c.fillStyle = `rgba(236,232,223,${a})`; MG.rrect(c, x, y, w, h, 10); c.fill(); c.restore(); };
  const pulse = (t, t0, t1, f = 0.35) => seg(t, t0, t0 + f) * (1 - seg(t, t1 - f, t1));
  const toHex = c => '#' + c.map(v => Math.round(clamp(v) * 255).toString(16).padStart(2, '0')).join('');
  const hex3 = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
  // a point given in the Token's own frame (x, y across the face, z through it), in world space
  const tokPt = (S, x, y, z) => { const M = S.tok.M; return add(S.tok.c, [M[0] * x + M[1] * y + M[2] * z, M[3] * x + M[4] * y + M[5] * z, M[6] * x + M[7] * y + M[8] * z]); };
  const sgn = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2);

  /* =====================================================================
     NORMALS — the normal pass is drawn as the picture: each surface
     normal n (a unit vector, −1..1 per axis) is stored as a colour,
     rgb = n·0.5 + 0.5. In world space the colours belong to the scene
     (up = green, +x = red, +z = blue) and stay put while the camera
     orbits; in view space they belong to the camera, so whatever faces
     it is the familiar lavender (0.5, 0.5, 1). A legend sphere maps
     colour back to direction. Then a tangent-space normal map adds
     bevelled tiles to the floor and dimples to the cube with no new
     geometry, and finally a point light circles the still life and the
     frame is relit from the G-buffer alone (normal, position, albedo),
     no ray re-traced: N·L shading, a specular lobe, no shadows.
     ===================================================================== */
  const NW1 = [0.8, 2.0], NW2 = [3.3, 4.3], NDET = [4.5, 5.3], NW3 = [6.1, 7.2];
  const NBG = [0.03, 0.032, 0.04], RBG = [0.04, 0.042, 0.05];
  const enc = n => [n[0] * 0.5 + 0.5, n[1] * 0.5 + 0.5, n[2] * 0.5 + 0.5];
  const toView = (S, n) => [dot(n, S.cam.right), dot(n, S.cam.up), -dot(n, S.cam.fw)];
  const cubeLocal = (S, p) => { const M = S.cubeM, q = sub(p, LK.CUBE.c); return [M[0] * q[0] + M[3] * q[1] + M[6] * q[2], M[1] * q[0] + M[4] * q[1] + M[7] * q[2], M[2] * q[0] + M[5] * q[1] + M[8] * q[2]]; };
  const cubeWorld = (S, v) => { const M = S.cubeM; return [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]]; };

  /* Floor normal map: a height field of bevelled square tiles with a low dome on every other
     tile. Only its slope is used: tangent-space normal = norm(−∂h/∂x, −∂h/∂z, 1). */
  const TILE = 0.9, BEV = 0.06, DOME = 0.26, TAMP = 0.045;
  function tileH(x, z) {
    const ix = Math.floor(x / TILE), iz = Math.floor(z / TILE), fx = x / TILE - ix, fz = z / TILE - iz;
    let h = smooth(0, BEV, Math.min(fx, 1 - fx, fz, 1 - fz));
    if ((ix + iz) & 1) { const r = Math.hypot(fx - 0.5, fz - 0.5) / DOME; if (r < 1) h += 0.85 * (1 - r * r) * (1 - r * r); }
    return h;
  }
  function tileSlope(x, z) {
    const e = 0.0035;
    return [(tileH(x + e, z) - tileH(x - e, z)) / (2 * e) * TAMP, (tileH(x, z + e) - tileH(x, z - e)) / (2 * e) * TAMP];
  }
  /* Cube normal map: a 3 × 3 grid of shallow round dimples on every face's flat part. */
  const DIM = { g: 0.27, r: 0.1, a: 0.03 };
  function cubeDetail(S, p, n, k) {
    const q = cubeLocal(S, p), aq = [Math.abs(q[0]), Math.abs(q[1]), Math.abs(q[2])];
    const ax = aq[0] > aq[1] ? (aq[0] > aq[2] ? 0 : 2) : (aq[1] > aq[2] ? 1 : 2);
    if (aq[ax] < 0.49) return n;
    const a = (ax + 1) % 3, b = (ax + 2) % 3;
    if (aq[a] > 0.42 || aq[b] > 0.42) return n;
    const ca = clamp(Math.round(q[a] / DIM.g), -1, 1) * DIM.g, cb = clamp(Math.round(q[b] / DIM.g), -1, 1) * DIM.g;
    const da = q[a] - ca, db = q[b] - cb, d2 = (da * da + db * db) / (DIM.r * DIM.r);
    if (d2 >= 1) return n;
    const f = 4 * DIM.a * (1 - d2) / (DIM.r * DIM.r) * k, nl = [0, 0, 0];
    nl[ax] = Math.sign(q[ax]); nl[a] = -f * da; nl[b] = -f * db;
    return norm(cubeWorld(S, nl));
  }
  /* The surface normal with the normal-map detail blended in by k. */
  function nrmD(g, S, k) {
    if (k <= 0.001) return g.n;
    if (g.id === 0) {
      const kk = k * (1 - smooth(7, 16, g.depth)); if (kk <= 0.001) return g.n;
      const s = tileSlope(g.p[0], g.p[2]);
      return norm([-s[0] * kk, 1, -s[1] * kk]);
    }
    if (g.id === 3) return cubeDetail(S, g.p, g.n, k);
    return g.n;
  }
  /* The point light that circles the still life in the relight. */
  function lightPos(t) {
    const u = t - NW3[0], a = -1.05 + u * 0.6;
    return [Math.sin(a) * 3.2, 1.85 + 0.45 * Math.sin(u * 1.6), 0.5 + Math.cos(a) * 3.0];
  }
  const WARM = [1.0, 0.84, 0.64], COOL = [0.35, 0.55, 1.0], RIMD = norm([-0.5, 0.45, -0.75]);
  /* Deferred relight: everything comes from the G-buffer — normal, position, albedo, view ray. */
  function relit(g, S, k, L0) {
    if (!g.hit) return RBG;
    const n = nrmD(g, S, k), a = LK.albedo(g.id), lv = sub(L0, g.p), dl = V.len(lv), l = mul(lv, 1 / dl);
    const att = 6.2 / (1 + 0.42 * dl * dl), ndl = Math.max(0, dot(n, l));
    const hv = norm(sub(l, g.d)), sp = ndl > 0 ? Math.pow(Math.max(0, dot(n, hv)), g.id === 0 ? 46 : 80) * (g.id === 0 ? 0.35 : 0.9) : 0;
    const rim = Math.max(0, dot(n, RIMD)) * 0.42, amb = 0.035 + 0.04 * n[1];
    const col = [0, 1, 2].map(i => a[i] * (WARM[i] * ndl * att + COOL[i] * rim + amb) + sp * att * WARM[i]);
    const o = LK.tone(col, 1.15);
    return g.id === 0 ? LK.floorFade(o, g, RBG) : o;
  }
  /* Legend sphere: a sphere as the camera sees it, coloured by the active pass. mode 0 world,
     1 view, 2 lit by the light direction ld (world). */
  let legSf = null;
  function legend(c, S, x, y, R, mode, ld, on) {
    if (on <= 0.001) return;
    const s = R * 2;
    if (!legSf) { const cv = MG.offscreen(s, s), cx = cv.getContext('2d'); legSf = { cv, cx, img: cx.createImageData(s, s) }; }
    const d = legSf.img.data, cam = S.cam;
    for (let py = 0; py < s; py++) for (let px = 0; px < s; px++) {
      const sx = (px + 0.5) / R - 1, sy = 1 - (py + 0.5) / R, r2 = sx * sx + sy * sy, i = (py * s + px) * 4;
      const al = clamp((1 - Math.sqrt(r2)) * R);
      if (al <= 0) { d[i + 3] = 0; continue; }
      const sz = Math.sqrt(Math.max(0, 1 - r2));
      const nw = [cam.right[0] * sx + cam.up[0] * sy - cam.fw[0] * sz, cam.right[1] * sx + cam.up[1] * sy - cam.fw[1] * sz, cam.right[2] * sx + cam.up[2] * sy - cam.fw[2] * sz];
      let col;
      if (mode === 0) col = enc(nw);
      else if (mode === 1) col = enc([sx, sy, sz]);
      else { const v = Math.max(0, dot(nw, ld)), hv = Math.pow(Math.max(0, dot(nw, norm(add(ld, mul(cam.fw, -1))))), 60); col = [0.07 + 0.85 * v + hv, 0.07 + 0.72 * v + hv * 0.9, 0.09 + 0.55 * v + hv * 0.8]; }
      d[i] = clamp(col[0]) * 255; d[i + 1] = clamp(col[1]) * 255; d[i + 2] = clamp(col[2]) * 255; d[i + 3] = al * 255;
    }
    legSf.cx.putImageData(legSf.img, 0, 0);
    c.save(); c.globalAlpha *= on;
    panel(c, x - R - 22, y - R - 50, s + 44, s + 92, 0.92);
    c.drawImage(legSf.cv, x - R, y - R);
    const ax = mode === 2 ? [] : [['+X', [1, 0, 0], '#c2332b'], ['+Y', [0, 1, 0], '#178a3a'], ['+Z', [0, 0, 1], '#2f5bff']];
    for (const [nm, e, col] of ax) {
      let vx, vy;
      if (mode === 0) { vx = dot(e, cam.right); vy = -dot(e, cam.up); } else { vx = e[0]; vy = -e[1]; }
      const L = Math.hypot(vx, vy);
      c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 2.2;
      if (L < 0.25) {   // axis points at the viewer
        c.beginPath(); c.arc(x, y, 9, 0, TAU); c.stroke(); c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill();
        label(c, nm, x + 14, y - 10, { size: 13, ls: 1, color: col, weight: 700, halo: false });
        continue;
      }
      const ex = x + vx * R * 0.95, ey = y + vy * R * 0.95;
      c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke();
      c.beginPath(); c.arc(ex, ey, 3.5, 0, TAU); c.fill();
      label(c, nm, x + vx * (R + 4) / L * Math.min(1, L) + (vx >= 0 ? 4 : -4), y + vy * (R + 4) + 5, { size: 13, ls: 1, color: col, weight: 700, align: vx >= 0 ? 'left' : 'right', halo: false });
    }
    if (mode === 2) {
      const lv = [dot(ld, cam.right), dot(ld, cam.up), -dot(ld, cam.fw)];
      if (lv[2] > 0) { c.fillStyle = P.accent; c.beginPath(); c.arc(x + lv[0] * R, y - lv[1] * R, 6, 0, TAU); c.fill(); }
    }
    label(c, ['LEGEND · WORLD SPACE', 'LEGEND · VIEW SPACE', 'LIGHT DIRECTION'][mode], x - R - 4, y - R - 22, { size: 13, ls: 2, color: P.ink, weight: 700, halo: false });
    label(c, mode === 2 ? 'N·L on a sphere' : 'colour → direction', x - R - 4, y + R + 30, { size: 13, ls: 1.5, color: SUB, halo: false });
    c.restore();
  }

  MG.film({
    id: 'looknormals', dur: 10, poster: 5.7,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Normals', sub: 'Surface direction stored as colour, then relit', era: '1978 —',
      origin: 'Storing a surface direction per pixel goes back to James Blinn’s bump mapping (“Simulation of Wrinkled Surfaces”, SIGGRAPH 1978), which perturbs the normal used for lighting without changing the geometry. Normal maps — the perturbed normal itself, written as rgb = n·0.5 + 0.5 — followed in the late 1990s, baked from detailed models onto simple ones, and tangent space made them reusable on any surface; Doom 3 (2004) put them in front of millions of players. Deferred shading (Deering et al., 1988; the “G-buffer” of Saito and Takahashi, 1990) writes normals, position and albedo to buffers first and lights them afterwards, which is also how compositors relight a render from its normal pass.',
      works: 'Doom 3 (id Software, 2004; normal-mapped characters and walls) · Half-Life 2 (Valve, 2004; radiosity normal mapping) · Killzone 2 (Guerrilla Games, 2009; deferred shading from a G-buffer)',
      tech: ['rgb = n·0.5 + 0.5, world vs view space', 'Tangent-space normal map', 'Deferred relight from N, P and albedo'],
      accent: '#8f86ff',
      motionDNA: 'The shared 10 s camera move: a 50° orbit with a slight drift down while the Token bobs and turns. A wipe replaces the plain render with world-space normals, whose colours stay fixed to the scene as the camera moves; a second wipe switches to view-space normals, which follow the camera; normal-map detail fades in on the floor and cube; a last wipe relights the frame from the passes while a point light circles the still life.',
      visualDNA: 'Pastel red-green-blue surfaces on black: a green floor, a sphere carrying every direction, the lavender of camera-facing faces; bevelled tiles and dimples appear in the colours only. Then a dark studio lit by one warm moving light and a cool rim, the tile bevels and dimples catching it. Legend sphere with axis arrows, a live probe on the Token, ink leader labels, small G-buffer insets.',
      transitions: 'Wipe from plain to world normals, to view normals, to the deferred relight; normal-map detail cross-fades in',
      implementation: ['Normal AOVs (world or camera space) in Arnold, V-Ray, Blender; the Relight node in Nuke', 'Tangent-space normal maps baked from high-poly sculpts', 'Canvas 2D + SDF tracer (js/look-kit.js): G-buffer normals encoded per pixel, procedural height-field slopes as the normal map, N·L + Blinn relight from the stored position and albedo'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      // the floor's tangent-space normal map: two tiles by two, as an image
      const s = 168, cv = MG.offscreen(s, s), cx = cv.getContext('2d'), img = cx.createImageData(s, s);
      for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
        const sl = tileSlope((x + 0.5) / s * 2 * TILE, (y + 0.5) / s * 2 * TILE), n = norm([-sl[0], -sl[1], 1]), i = (y * s + x) * 4;
        img.data[i] = (n[0] * 0.5 + 0.5) * 255; img.data[i + 1] = (n[1] * 0.5 + 0.5) * 255; img.data[i + 2] = (n[2] * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
      }
      cx.putImageData(img, 0, 0);
      return { nmap: cv };
    },
    draw(c, t, W, H, st) {
      DK = true;
      const w1 = E.ioC(seg(t, NW1[0], NW1[1])), w2 = E.ioC(seg(t, NW2[0], NW2[1])), w3 = E.ioC(seg(t, NW3[0], NW3[1]));
      const det = E.ioC(seg(t, NDET[0], NDET[1])), L0 = lightPos(t);
      const shade = (g, S) => {
        if (g.u >= w1) return LK.plain(g, S);
        if (g.u < w3) return relit(g, S, det, L0);
        if (!g.hit) return NBG;
        return g.u < w2 ? enc(toView(S, nrmD(g, S, det))) : enc(nrmD(g, S, det));
      };
      const { G, S } = LK.render(c, t, W, H, shade);
      const phase = t < NW1[0] ? 0 : t < NW2[0] + 0.5 ? 1 : t < NW3[0] + 0.55 ? 2 : 3;

      // probe: a point on the Token's face, read back from the G-buffer
      const pp = tokPt(S, -0.42, -0.38, 0.22), q = LK.project(S, pp, W, H), pon = seg(t, 1.6, 2.0) * (1 - seg(t, 9.4, 9.7));
      if (q && pon > 0.01) {
        const gx = clamp(Math.floor(q[0] / W * G.w), 0, G.w - 1), gy = clamp(Math.floor(q[1] / H * G.h), 0, G.h - 1), gi = gy * G.w + gx;
        if (G.id[gi] === 1) {
          const nw = [G.N3[gi * 3], G.N3[gi * 3 + 1], G.N3[gi * 3 + 2]], nv = toView(S, nw), n = phase === 1 ? nw : nv, col = enc(n);
          const bx = q[0] - 470, by = q[1] + 70;
          c.save(); c.globalAlpha *= pon;
          c.strokeStyle = P.paper; c.lineWidth = 2; c.beginPath(); c.arc(q[0], q[1], 14, 0, TAU); c.stroke();
          c.beginPath(); c.moveTo(q[0] - 22, q[1]); c.lineTo(q[0] - 8, q[1]); c.moveTo(q[0] + 8, q[1]); c.lineTo(q[0] + 22, q[1]); c.moveTo(q[0], q[1] - 22); c.lineTo(q[0], q[1] - 8); c.moveTo(q[0], q[1] + 8); c.lineTo(q[0], q[1] + 22); c.stroke();
          c.beginPath(); c.moveTo(q[0] - 14, q[1] + 10); c.lineTo(bx + 400, by + 10); c.stroke();
          panel(c, bx, by - 22, 400, 104, 0.92);
          label(c, phase === 3 ? 'PROBE · TOKEN FACE · RELIT' : `PROBE · TOKEN FACE · ${phase === 1 ? 'WORLD' : 'VIEW'}`, bx + 16, by + 4, { size: 13, ls: 2, color: P.ink, weight: 700, halo: false });
          label(c, `n = (${sgn(n[0])}, ${sgn(n[1])}, ${sgn(n[2])})`, bx + 16, by + 34, { size: 17, ls: 1, color: P.ink, halo: false });
          if (phase === 3) {
            const lv = norm(sub(L0, pp)), nl = Math.max(0, dot(nw, lv));
            label(c, `N·L = ${nl.toFixed(2)}   L = (${sgn(lv[0])}, ${sgn(lv[1])}, ${sgn(lv[2])})`, bx + 16, by + 64, { size: 14, ls: 0.5, color: SUB, halo: false });
          } else {
            c.fillStyle = toHex(col); c.fillRect(bx + 16, by + 48, 22, 22);
            label(c, `rgb = n·0.5 + 0.5 = ${col.map(v => v.toFixed(2)).join(' ')}`, bx + 50, by + 65, { size: 14, ls: 0.5, color: SUB, halo: false });
          }
          c.restore();
        }
      }

      // the point light gizmo
      if (w3 > 0.02) {
        const lq = LK.project(S, L0, W, H);
        if (lq) {
          c.save(); c.globalAlpha *= seg(t, NW3[0] + 0.2, NW3[0] + 0.7);
          const gr = c.createRadialGradient(lq[0], lq[1], 0, lq[0], lq[1], 70); gr.addColorStop(0, 'rgba(255,226,180,0.85)'); gr.addColorStop(0.25, 'rgba(255,200,140,0.3)'); gr.addColorStop(1, 'rgba(255,190,120,0)');
          c.fillStyle = gr; c.beginPath(); c.arc(lq[0], lq[1], 70, 0, TAU); c.fill();
          c.fillStyle = '#fff6e6'; c.beginPath(); c.arc(lq[0], lq[1], 7, 0, TAU); c.fill();
          c.strokeStyle = P.paper; c.lineWidth = 1.5; c.beginPath(); c.arc(lq[0], lq[1], 16, 0, TAU); c.stroke();
          label(c, 'POINT LIGHT', lq[0] + 26, lq[1] + 6, { size: 14, ls: 2, color: P.ink, weight: 700 });
          c.restore();
        }
      }

      // wipes
      wipeLine(c, w1, W, H, 'WORLD NORMALS', 'PLAIN');
      wipeLine(c, w2, W, H, 'VIEW NORMALS', 'WORLD NORMALS');
      wipeLine(c, w3, W, H, 'RELIT', 'VIEW NORMALS');

      // callouts per phase
      const c1 = pulse(t, 2.1, 3.4, 0.35), c2 = pulse(t, 4.3, 5.1, 0.3), c3 = pulse(t, 5.3, 6.1, 0.3), c4 = pulse(t, 7.4, 9.3, 0.4);
      callout(c, S, W, H, [-0.4, 0, 2.0], 140, 120, 'FLOOR  n = (0, 1, 0)', 'stored as (0.5, 1.0, 0.5): up is green', c1 * seg(t, 2.1, 2.45));
      callout(c, S, W, H, add(LK.SPH.c, [-0.3, 0.45, 0.45]), -40, -200, 'THE SPHERE HAS EVERY DIRECTION', 'one of each colour, like the legend', c1 * seg(t, 2.4, 2.75));
      callout(c, S, W, H, add(LK.CUBE.c, [0.45, 0.1, 0.25]), 40, 210, 'FACES TOWARD +X → RED', 'colours stay put as the camera orbits', c1 * seg(t, 2.7, 3.05));
      callout(c, S, W, H, [-0.4, 0, 2.0], 140, 120, 'FLOOR TILTS AWAY FROM THE LENS', 'view space: colour follows the camera', c2 * seg(t, 4.3, 4.6));
      callout(c, S, W, H, [0.3, 0, 1.3], -200, -40, 'NORMAL MAP · BEVELS AND DOMES', 'tangent-space detail, floor still flat', c3 * seg(t, 5.3, 5.6));
      callout(c, S, W, H, add(LK.CUBE.c, [0.1, 0.5, 0.0]), -60, -190, 'DIMPLES IN THE NORMALS ONLY', 'the silhouette stays straight', c3 * seg(t, 5.55, 5.85));
      callout(c, S, W, H, [0.3, 0, 1.3], -200, -40, 'BEVELS CATCH THE LIGHT', 'lit from the mapped normals', c4 * seg(t, 7.4, 7.8));
      callout(c, S, W, H, [0.2, 0, -0.3], -150, -80, 'NO SHADOWS', 'normals know facing, not occlusion', c4 * seg(t, 7.8, 8.2));

      // insets: the normal map, then the two G-buffer inputs of the relight
      const nmOn = pulse(t, NDET[0], NW3[0] + 0.4, 0.35);
      if (nmOn > 0.01) {
        const x = W - 72 - 168, y = 92;
        c.save(); c.globalAlpha *= nmOn;
        panel(c, x - 250, y - 36, 432, 236, 0.92);
        c.drawImage(st.nmap, x, y);
        c.strokeStyle = P.paper; c.lineWidth = 1.5; c.strokeRect(x - 0.75, y - 0.75, 169.5, 169.5);
        label(c, 'NORMAL MAP · TANGENT SPACE', x + 168, y - 12, { size: 14, ls: 2, color: P.ink, weight: 700, align: 'right', halo: false });
        label(c, 'flat = (0.5, 0.5, 1.0)', x - 230, y + 40, { size: 13, ls: 1.5, color: P.ink, halo: false });
        label(c, 'slopes tilt it: x → red', x - 230, y + 70, { size: 13, ls: 1.5, color: SUB, halo: false });
        label(c, 'and y → green', x - 230, y + 92, { size: 13, ls: 1.5, color: SUB, halo: false });
        label(c, '2 × 2 tiles shown', x - 230, y + 160, { size: 13, ls: 1.5, color: SUB, halo: false });
        c.restore();
      }
      const insOn = seg(t, 7.3, 7.7);
      inset(c, t, W, H, 72, 176, 'INPUT · NORMAL PASS', (g, S) => (g.hit ? enc(toView(S, nrmD(g, S, 1))) : NBG), insOn);
      inset(c, t, W, H, 72 + INS.w + 36, 176, 'INPUT · ALBEDO PASS', g => (g.hit ? LK.albedo(g.id) : NBG), insOn * seg(t, 7.5, 7.9));

      // legend sphere, bottom right
      const lmode = phase === 1 ? 0 : phase === 3 ? 2 : 1, ld = norm(sub(L0, LK.TARGET));
      legend(c, S, W - 72 - 22 - 86, H - 80 - 86 - 42, 86, lmode, ld, seg(t, 1.5, 1.9) * (lmode === 2 ? seg(t, 7.6, 8.0) : 1) * (1 - seg(t, NW3[0] - 0.1, NW3[0] + 0.2) * (1 - seg(t, 7.6, 8.0))));

      // top-left: stage of the look
      if (phase === 0) tag(c, 'REFERENCE  ·  PLAIN RENDER', 72, 80, seg(t, 0.1, 0.5));
      else if (phase === 1) {
        tag(c, 'WORLD-SPACE NORMALS  ·  rgb = n · 0.5 + 0.5', 72, 80);
        note(c, 'colours belong to the scene: they stay put as the camera orbits', 98, 116, seg(t, 1.4, 1.8));
      } else if (phase === 2) {
        tag(c, det > 0.05 ? 'VIEW NORMALS + TANGENT-SPACE NORMAL MAP' : 'VIEW-SPACE NORMALS  ·  n in camera axes', 72, 80);
        note(c, det > 0.05 ? 'detail baked into normals: floor tiles, cube dimples, no new geometry' : 'colours belong to the camera: facing = blue, up = green, right = red', 98, 116);
      } else {
        tag(c, 'DEFERRED RELIGHT  ·  FROM THE PASSES, NO RAY RE-TRACED', 72, 80);
        note(c, 'c = albedo · (N·L) · falloff  +  Blinn specular  +  cool rim', 98, 116, seg(t, 6.8, 7.2));
      }
      LK.caption(c, t, W, H, { name: 'Normals', cat: 'Shading', dark: true });
    },
    score(A) {
      LK.bed(A);
      // wipes: a soft brush of noise and a settling pluck
      [NW1, NW2, NW3].forEach(([a, b], i) => {
        A.whoosh(a, b - a, { f1: 220, f2: 1800, q: 0.8, g: 0.08, swell: 0.6, rev: 0.4, pan: -0.4 + i * 0.4 });
        A.pluck(b, midi([57, 60, 64][i]), { g: 0.13, bright: 0.3, dur: 1.6, lp: 2000 });
      });
      // the legend: one bell per axis, x · y · z
      [1.6, 1.75, 1.9].forEach((t, i) => A.bell(t, midi([76, 79, 83][i]), { g: 0.045, dur: 1.2, rev: 0.5, pan: [-0.5, 0, 0.5][i] }));
      // callouts: soft taps
      [2.1, 2.4, 2.7, 4.3, 5.3, 5.55, 7.4, 7.8].forEach((t, i) => A.osc(t, { type: 'triangle', f: midi(72 + [0, 3, 7, 5, 10, 12, 7, 3][i]), dur: 0.3, g: 0.05, lp: 1600, rev: 0.3 }));
      // normal map arriving: a scatter of tiny ticks, like tiles laid down
      for (let i = 0; i < 10; i++) A.hat(NDET[0] + i * 0.08, 0.035, false, { f: 6000 + hash(i) * 4000, pan: hash(i + 9) - 0.5 });
      // the moving light: a slow glide that follows it round
      A.osc(NW3[0], { type: 'sine', f: midi(64), f2: midi(71), glide: 3.9, dur: 3.9, g: 0.05, a: 0.8, rev: 0.6 });
      A.chord(NW3[1], [52, 59, 64, 68, 71], { type: 'triangle', dur: 2.6, g: 0.028, a: 0.4, lp: 1600, rev: 0.7, width: 0.8 });
    },
  });

  /* =====================================================================
     PIXEL ART — the scene is rendered small and shown big: the internal
     resolution steps down on the beat, 480 × 270 → 160 × 90, and each
     step is upscaled by an integer factor with nearest-neighbour
     filtering (image smoothing off), so every render pixel becomes a hard
     square. Then the colours are snapped to a 16-colour palette (the
     PICO-8 palette), first by nearest colour — hard bands on the sphere
     — then with a 4 × 4 Bayer ordered dither, which adds a fixed
     threshold pattern before the snap so two palette colours interleave
     into the tones between them. An outline pass inks one pixel where
     the object id changes on the nearer side, and the film ends on a
     palette swap to the four greens of the original Game Boy.
     ===================================================================== */
  const PICO = ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa'];
  const DMG = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'];
  const PICO3 = PICO.map(hex3), DMG3 = DMG.map(hex3);
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const PRES = [[800, 450], [480, 270], [320, 180], [240, 135], [160, 90]];
  const PT = { res: [2 * B, 3 * B, 4 * B, 5 * B], quant: [6 * B, 7 * B], dith: [8 * B, 9 * B], line: 10 * B, swap: [12 * B, 13 * B] };
  const resIdx = t => (t < PT.res[0] ? 0 : t < PT.res[1] ? 1 : t < PT.res[2] ? 2 : t < PT.res[3] ? 3 : 4);
  let pixUsed = new Uint8Array(16);
  /* Palette snap by hue ramps, the way pixel artists use a fixed palette: each object owns a
     ramp of palette colours ordered dark → light (all from the 16), and a pixel's luminance
     picks its place on the ramp. Without dither it rounds to the nearer step (hard bands); with
     the ordered dither the Bayer threshold th decides between the two steps either side, in
     proportion to where the pixel falls between them. A small dead zone at each end keeps flat
     areas solid. Ramp entry 0 is also the object's outline colour. */
  const lumaOf = p => 0.3 * p[0] + 0.59 * p[1] + 0.11 * p[2];
  const RAMP = { 0: [1, 5, 13, 6, 7], 1: [2, 4, 9, 10], 2: [1, 5, 13, 6, 7], 3: [1, 12, 6] };
  RAMP[255] = RAMP[0];
  const RLUM = {}; for (const k in RAMP) RLUM[k] = RAMP[k].map(j => lumaOf(PICO3[j]));
  const RSCALE = { 0: 1.04, 255: 1, 1: 1.0, 2: 0.93, 3: 1.05 };
  const DMGL = [0.12, 0.4, 0.68, 0.93];
  const LGAIN = lumaOf(PICO3[7]) / lumaOf(LK.BG);   // the backdrop lands exactly on the palette's warm white
  function rampPick(L, l, th) {
    const n = L.length; if (l <= L[0]) return 0; if (l >= L[n - 1]) return n - 1;
    let j = 0; while (l >= L[j + 1]) j++;
    const f = (l - L[j]) / (L[j + 1] - L[j]);
    if (th < 0) return f < 0.5 ? j : j + 1;
    return th < (f - 0.1) / 0.8 ? j + 1 : j;
  }
  /* Palette snap, dither and outline over the small buffer. o.qs / o.ds / o.ps: how far across
     (0..1) the palette, the dither and the Game Boy palette have wiped; o.ol: outline on. */
  function pixPost(rgb, G, o) {
    const { w, h } = G, ids = G.id, dep = G.depth;
    pixUsed = new Uint8Array(16);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const u = (x + 0.5) / w; if (u >= o.qs) continue;
      const i = y * w + x, id = ids[i];
      let edge = false;
      if (o.ol && id !== 0 && id !== 255) {
        const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
        for (const j of nb) if (j >= 0 && ids[j] !== id && (ids[j] === 255 || ids[j] === 0 || dep[j] > dep[i] + 0.25)) { edge = true; break; }
      }
      const l = lumaOf([rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]]) * LGAIN;
      const th = !edge && u < o.ds ? (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 : -1;
      let pc;
      if (u < o.ps) pc = DMG3[edge ? 0 : rampPick(DMGL, l, th)];
      else {
        const k = RAMP[id][edge ? 0 : rampPick(RLUM[id], l * RSCALE[id], th)];
        pixUsed[k] = 1; pc = PICO3[k];
      }
      rgb[i * 3] = pc[0]; rgb[i * 3 + 1] = pc[1]; rgb[i * 3 + 2] = pc[2];
    }
  }
  function swatches(c, x, y, pal, used, on, title) {
    if (on <= 0.001) return;
    const n = pal.length, sz = 30, cols = Math.min(n, 8);
    c.save(); c.globalAlpha *= on;
    panel(c, x - 14, y - 34, Math.max(cols * (sz + 6) + 22, 330), Math.ceil(n / 8) * (sz + 6) + 66, 0.92);
    label(c, title, x, y - 10, { size: 13, ls: 2, color: P.ink, weight: 700, halo: false });
    pal.forEach((h, k) => {
      const sx = x + (k % 8) * (sz + 6), sy = y + Math.floor(k / 8) * (sz + 6);
      c.fillStyle = h; c.fillRect(sx, sy, sz, sz);
      if (used && used[k]) { c.fillStyle = P.accent; c.fillRect(sx + 9, sy + sz + 1, sz - 18, 3); }
      c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 1; c.strokeRect(sx + 0.5, sy + 0.5, sz - 1, sz - 1);
    });
    c.globalAlpha = on;
    if (used) { let u = 0; for (const v of used) u += v; label(c, `▬ IN USE THIS FRAME  ${u} / ${n}`, x, y + Math.ceil(n / 8) * (sz + 6) + 16, { size: 12, ls: 1.5, color: SUB, halo: false }); }
    else label(c, 'one ramp, light to dark, dithered', x, y + Math.ceil(n / 8) * (sz + 6) + 16, { size: 12, ls: 1.5, color: SUB, halo: false });
    c.restore();
  }
  function bayerInset(c, x, y, on, hl) {
    if (on <= 0.001) return;
    const cs = 46;
    c.save(); c.globalAlpha *= on;
    panel(c, x - 18, y - 40, 300, cs * 4 + 118, 0.92);
    label(c, 'BAYER 4 × 4 · THRESHOLDS', x, y - 14, { size: 13, ls: 2, color: P.ink, weight: 700, halo: false });
    for (let k = 0; k < 16; k++) {
      const cx = x + (k % 4) * cs, cy = y + Math.floor(k / 4) * cs, v = BAYER[k] / 15;
      const gv = Math.round(30 + v * 200);
      c.fillStyle = `rgb(${gv},${gv},${gv})`; c.fillRect(cx, cy, cs - 2, cs - 2);
      if (k === hl) { c.strokeStyle = P.accent; c.lineWidth = 3; c.strokeRect(cx + 1.5, cy + 1.5, cs - 5, cs - 5); }
      text(c, String(BAYER[k]), cx + cs / 2 - 1, cy + cs / 2 + 6, { font: MG.TK.MONO, size: 16, weight: 700, color: v > 0.5 ? P.ink : P.paper, align: 'center' });
    }
    label(c, 'lighter step where (M + ½)/16 < f', x, y + cs * 4 + 26, { size: 13, ls: 0.5, color: P.ink, halo: false });
    label(c, 'f = place between two ramp steps', x, y + cs * 4 + 50, { size: 12, ls: 1, color: SUB, halo: false });
    c.restore();
  }

  MG.film({
    id: 'lookpixel', dur: 10, poster: 8.1,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Pixel Art', sub: 'Low resolution, a fixed palette, ordered dither', era: '1970s —',
      origin: 'Pixel art grew out of the hard limits of early computer and console graphics: low resolutions shown on large screens and a handful of colours fixed by the hardware, which artists placed pixel by pixel. The term is usually traced to Adele Goldberg and Robert Flegal at Xerox PARC (1982). Ordered dithering, which fakes extra tones by comparing each pixel against a tiled threshold matrix, was formalised by Bryce Bayer at Kodak in 1973; Nintendo’s Game Boy (1989) showed four shades of green. Rendering 3D scenes small and snapping them to a palette, as here, is a later way of getting the look; Lucas Pope’s Return of the Obra Dinn renders its 3D world into dithered 1-bit.',
      works: 'The Secret of Monkey Island (Lucasfilm Games, 1990) · The Legend of Zelda: Link’s Awakening (Nintendo, 1993; Game Boy, four shades) · Return of the Obra Dinn (Lucas Pope, 2018; dithered 3D)',
      tech: ['Low internal res, integer nearest-neighbour upscale', '16-colour palette, Bayer 4 × 4 ordered dither', 'One-pixel outline from the object-id buffer'],
      accent: '#29adff',
      motionDNA: 'The shared 10 s camera move: a 50° orbit with a slight drift down while the Token bobs and turns. On each beat the render resolution halves its way down from 800 × 450 to 160 × 90; the palette wipes in without dither, a second wipe adds Bayer dithering, the outline pass snaps on with the beat, and a last wipe swaps to the four Game Boy greens. Because the scene is re-rendered small every frame, the pixels crawl along edges as the camera moves.',
      visualDNA: 'Hard square pixels twelve screen pixels wide; PICO-8 colours — orange and brown on the Token, sky blue and navy on the cube, warm white and grey on the floor — with checkered Bayer patterns in every gradient and dark one-pixel outlines; at the end olive-to-pale-green Game Boy tones. Palette swatches marking the colours in use, the 4 × 4 threshold matrix, a resolution readout.',
      transitions: 'Hard resolution steps on the beat; wipes to the palette, to dithering and to the Game Boy palette; the outline snaps on',
      implementation: ['Low-res render target with point (nearest) sampling on upscale', 'Ordered dithering against a Bayer index matrix into a fixed palette (shader or post)', 'Canvas 2D + SDF tracer (js/look-kit.js): LK.gbuffer at the small size, LK.plain shaded, palette snap + Bayer + id-buffer outline in post, drawn with imageSmoothingEnabled = false'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      DK = false;
      const ri = resIdx(t), [w, h] = PRES[ri];
      const qs = E.ioC(seg(t, PT.quant[0], PT.quant[1])), ds = E.ioC(seg(t, PT.dith[0], PT.dith[1])), ps = E.ioC(seg(t, PT.swap[0], PT.swap[1])), ol = t >= PT.line;
      let S;
      if (ri === 0) S = LK.render(c, t, W, H, LK.plain).S;
      else {
        const G = LK.gbuffer(t, w, h); G.aa = false;
        const cv = LK.shadeBuffer(G, LK.plain, qs > 0 ? (rgb, GG) => pixPost(rgb, GG, { qs, ds, ps, ol }) : null);
        c.save(); c.imageSmoothingEnabled = false; c.drawImage(cv, 0, 0, W, H); c.restore();
        S = G.S;
      }
      const snapU = u => Math.round(u * w) / w;
      // the pixel grid, briefly, when the last step lands
      const gon = pulse(t, PT.res[3], PT.quant[0], 0.2);
      if (gon > 0.01) {
        const s = W / w;
        c.save(); c.globalAlpha = gon * 0.28; c.strokeStyle = '#17181c'; c.lineWidth = 1; c.beginPath();
        for (let x = s; x < W; x += s) { c.moveTo(Math.round(x) + 0.5, 0); c.lineTo(Math.round(x) + 0.5, H); }
        for (let y = s; y < H; y += s) { c.moveTo(0, Math.round(y) + 0.5); c.lineTo(W, Math.round(y) + 0.5); }
        c.stroke(); c.restore();
      }
      wipeLine(c, snapU(qs), W, H, '16 COLOURS', 'TRUE COLOUR', 1, 540);
      wipeLine(c, snapU(ds), W, H, 'BAYER DITHER', 'NO DITHER', 1, 540);
      wipeLine(c, snapU(ps), W, H, 'GAME BOY', 'PICO-8', 1, 540);

      // resolution readout, top left
      const rx = 72, ry = 120;
      c.save();
      panel(c, rx - 14, ry - 8, 480, 136, 0.92);
      label(c, 'RENDER RESOLUTION', rx, ry + 18, { size: 13, ls: 2, color: P.ink, weight: 700, halo: false });
      text(c, `${w} × ${h}`, rx - 2, ry + 66, { font: MG.TK.MONO, size: 44, weight: 700, color: P.ink });
      label(c, ri === 0 ? 'smooth upscale ×2.4' : `×${1920 / w} nearest  ·  ${(w * h).toLocaleString('en-US')} px`, rx + 256, ry + 62, { size: 13, ls: 1, color: SUB, halo: false, align: 'left' });
      PRES.forEach(([pw], k) => {
        const bx = rx + k * 84;
        c.fillStyle = k === ri ? P.accent : k < ri ? 'rgba(23,24,28,0.45)' : 'rgba(23,24,28,0.15)'; c.fillRect(bx, ry + 88, 76, 6);
        label(c, String(pw), bx, ry + 114, { size: 12, ls: 1, color: k === ri ? P.ink : '#8f8a80', weight: k === ri ? 700 : 400, halo: false });
      });
      c.restore();
      // palette swatches, then the Bayer matrix
      const palOn = seg(t, PT.quant[0], PT.quant[0] + 0.3);
      if (ps < 0.5) swatches(c, 86, 330, PICO, qs > 0 ? pixUsed : null, palOn, 'PALETTE · PICO-8 · 16 COLOURS');
      else swatches(c, 86, 330, DMG, null, 1, 'PALETTE · GAME BOY · 4 GREENS');
      bayerInset(c, W - 56 - 282, 132, seg(t, PT.dith[0], PT.dith[0] + 0.3), Math.floor(t * 8) % 16);

      // callouts
      const sp = add(LK.SPH.c, [0.25, -0.05, 0.68]);
      callout(c, S, W, H, add(LK.CUBE.c, [0.3, 0.52, 0.3]), -60, -170, 'EVERY RENDER PIXEL = 12 × 12', 'nearest neighbour: no blending', pulse(t, PT.res[3] + 0.1, PT.quant[0] + 0.1, 0.25));
      callout(c, S, W, H, sp, 260, 240, 'BANDING', 'nearest colour only: hard steps', pulse(t, PT.quant[1], PT.dith[0] + 0.1, 0.25));
      callout(c, S, W, H, sp, 260, 240, 'DITHER BLENDS TWO COLOURS', 'pattern density = the tone between', pulse(t, PT.dith[1], PT.line + 0.05, 0.25));
      callout(c, S, W, H, tokPt(S, 0.1, -0.97, 0.22), -150, 230, '1-PX OUTLINE', 'where the id changes, nearer side', pulse(t, PT.line + 0.05, PT.swap[0], 0.25));

      // top-left stage tag
      const stage = t < PT.res[0] ? 'REFERENCE  ·  FULL RESOLUTION, SMOOTH UPSCALE'
        : t < PT.quant[0] ? 'RENDER SMALL  ·  NEAREST-NEIGHBOUR UPSCALE'
        : t < PT.dith[0] ? 'PALETTE  ·  SNAP TO THE NEAREST OF 16 COLOURS'
        : t < PT.line ? 'ORDERED DITHER  ·  BAYER 4 × 4 BEFORE THE SNAP'
        : t < PT.swap[0] ? 'OUTLINE PASS  ·  1 PX FROM THE OBJECT-ID BUFFER'
        : 'PALETTE SWAP  ·  FOUR GAME BOY GREENS';
      tag(c, stage, 72, 80);
      LK.caption(c, t, W, H, { name: 'Pixel Art', cat: 'Shading' });
    },
    score(A) {
      LK.bed(A);
      // resolution steps: square-wave blips stepping down
      PT.res.forEach((t, i) => {
        A.osc(t, { type: 'square', f: midi([84, 79, 76, 72][i]), dur: 0.11, g: 0.05, lp: 3200 });
        A.osc(t + 0.06, { type: 'square', f: midi([72, 67, 64, 60][i]), dur: 0.14, g: 0.04, lp: 2400 });
      });
      // the palette arrives: a quick arpeggio
      [72, 76, 79, 84, 88, 91].forEach((m, i) => A.osc(PT.quant[0] + i * 0.055, { type: 'square', f: midi(m), dur: 0.08, g: 0.04, lp: 4000 }));
      // dither wipe: a crushed noise sweep
      A.noise(PT.dith[0], { type: 'bandpass', f: 900, f2: 5000, q: 1.2, dur: PT.dith[1] - PT.dith[0], g: 0.05, swell: 0.6, crush: true });
      [0, 1, 2, 3].forEach(k => A.osc(PT.dith[1] + k * 0.09, { type: 'square', f: midi([79, 74, 79, 74][k]), dur: 0.07, g: 0.035, lp: 3000 }));
      // outline: a low thunk
      A.osc(PT.line, { type: 'square', f: midi(43), f2: midi(36), glide: 0.12, dur: 0.22, g: 0.08, lp: 900 });
      // Game Boy: the two-note power-on chime
      A.osc(PT.swap[0], { type: 'square', f: 1046.5, dur: 0.09, g: 0.04, lp: 5000 });
      A.osc(PT.swap[0] + 0.1, { type: 'square', f: 2093, dur: 0.7, g: 0.035, lp: 6000, rev: 0.3 });
    },
  });

  /* =====================================================================
     CHROMATIC ABERRATION — a glass lens bends short wavelengths more
     than long ones, so red, green and blue do not land in the same
     place. Lateral CA: each colour is imaged at a slightly different
     magnification, so in post the R channel is scaled out from the frame
     centre and B scaled in, a shift that is zero at the centre and grows
     toward the edges. Longitudinal (axial) CA: each colour focuses at a
     different distance, so with green in focus R and B are blurred,
     which edges every high-contrast boundary with purple and green.
     Strength rises on the beat; then an achromatic doublet (a crown-
     glass lens cemented to a flint-glass one) brings the colours back to
     one focus. A loupe and its RGB profile show the fringe on the cube's
     edge, and a diagram shows where each wavelength focuses.
     ===================================================================== */
  const KMAX = 0.0185;
  const latK = t => (t < 2 * B ? 0.006 * E.ioC(seg(t, 1.0, 2.0))
    : t < 3 * B ? lerp(0.006, 0.010, E.outC(seg(t, 2 * B, 2 * B + 0.25)))
    : t < 4 * B ? lerp(0.010, 0.014, E.outC(seg(t, 3 * B, 3 * B + 0.25)))
    : lerp(0.014, KMAX, E.outC(seg(t, 4 * B, 4 * B + 0.25))));
  const axAt = t => E.ioC(seg(t, 6 * B, 7 * B));
  const CORR = [10 * B, 10 * B + 1.15], CRES = { k: 0.0006, ax: 0.05 };
  const RB = { r: 1, b: 2 };   // defocus box radii (render pixels, two passes) at full longitudinal strength
  let caProbe = null;
  function boxBlur(src, w, h, r) {
    const tmp = new Float32Array(w * h), out = new Float32Array(w * h), n = 2 * r + 1;
    for (let y = 0; y < h; y++) {
      const o = y * w; let s = 0;
      for (let k = -r; k <= r; k++) s += src[o + clamp(k, 0, w - 1)];
      for (let x = 0; x < w; x++) { tmp[o + x] = s / n; s += src[o + Math.min(x + r + 1, w - 1)] - src[o + Math.max(x - r, 0)]; }
    }
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let k = -r; k <= r; k++) s += tmp[clamp(k, 0, h - 1) * w + x];
      for (let y = 0; y < h; y++) { out[y * w + x] = s / n; s += tmp[Math.min(y + r + 1, h - 1) * w + x] - tmp[Math.max(y - r, 0) * w + x]; }
    }
    return out;
  }
  function bil(a, w, h, x, y) {
    x = clamp(x, 0, w - 1.001); y = clamp(y, 0, h - 1.001);
    const x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0, i = y0 * w + x0;
    return (a[i] * (1 - fx) + a[i + 1] * fx) * (1 - fy) + (a[i + w] * (1 - fx) + a[i + w + 1] * fx) * fy;
  }
  /* Post: o.caX — lens applied left of this (0..1); o.corrX — corrected right of this. */
  function caPost(rgb, G, o) {
    const { w, h } = G, n = w * h, R = new Float32Array(n), Gc = new Float32Array(n), Bc = new Float32Array(n);
    for (let i = 0; i < n; i++) { R[i] = rgb[i * 3]; Gc[i] = rgb[i * 3 + 1]; Bc[i] = rgb[i * 3 + 2]; }
    const axMax = Math.max(o.ax, o.corrX < 1 ? CRES.ax : 0);
    const Rb = axMax > 0 ? boxBlur(boxBlur(R, w, h, RB.r), w, h, RB.r) : null, Bb = axMax > 0 ? boxBlur(boxBlur(Bc, w, h, RB.b), w, h, RB.b) : null;
    const cx = w / 2, cy = h / 2, xA = o.caX * w, xC = o.corrX * w;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const corr = x >= xC; if (!corr && x >= xA) continue;
      const k = corr ? CRES.k : o.k, ax = corr ? CRES.ax : o.ax, i = y * w + x, dx = x + 0.5 - cx, dy = y + 0.5 - cy;
      const sr = 1 / (1 + k), sb = 1 / (1 - k), xr = cx + dx * sr - 0.5, yr = cy + dy * sr - 0.5, xb = cx + dx * sb - 0.5, yb = cy + dy * sb - 0.5;
      let r = bil(R, w, h, xr, yr), b = bil(Bc, w, h, xb, yb);
      if (ax > 0) { r = lerp(r, bil(Rb, w, h, xr, yr), ax); b = lerp(b, bil(Bb, w, h, xb, yb), ax); }
      rgb[i * 3] = r; rgb[i * 3 + 2] = b;
    }
    // loupe target: the cube's outer (right) silhouette on the row through its centre
    caProbe = null;
    const cq = LK.project(G.S, LK.CUBE.c, w, h);
    if (cq) {
      const yc = clamp(Math.round(cq[1]), 1, h - 2);
      let xe = -1; for (let x = w - 2; x > 0; x--) if (G.id[yc * w + x] === 3) { xe = x; break; }
      if (xe > 0) {
        const N = 24, x0 = xe - N / 2 + 2, prof = [];
        for (let k = 0; k < N; k++) { const j = (yc * w + clamp(x0 + k, 0, w - 1)) * 3; prof.push([rgb[j], rgb[j + 1], rgb[j + 2]]); }
        caProbe = { x0, y0: yc - N / 2, N, prof };
      }
    }
  }
  /* Focus diagram: a lens on the optical axis, parallel rays in, R, G, B focusing apart (s ≥ 0). */
  function focusDiagram(c, x, y, s, doublet, on) {
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    const ax = y + 100, lx = x + 150, fG = x + 400, top = 62;
    c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 1; c.setLineDash([4, 5]);
    c.beginPath(); c.moveTo(x + 20, ax); c.lineTo(x + 560, ax); c.stroke();
    c.beginPath(); c.moveTo(fG, ax - 80); c.lineTo(fG, ax + 80); c.stroke(); c.setLineDash([]);
    label(c, 'SENSOR', fG, ax - 88, { size: 11, ls: 1.5, color: SUB, align: 'center', halo: false });
    // the lens (crown) and, when corrected, the flint element cemented behind it
    c.fillStyle = 'rgba(120,170,220,0.35)'; c.strokeStyle = 'rgba(23,24,28,0.6)'; c.lineWidth = 1.4;
    c.beginPath(); c.ellipse(lx, ax, 13, 80, 0, 0, TAU); c.fill(); c.stroke();
    if (doublet > 0.01) {
      c.globalAlpha = on * doublet;
      c.fillStyle = 'rgba(70,90,150,0.45)';
      c.beginPath(); c.moveTo(lx + 3, ax - 78); c.lineTo(lx + 24, ax - 80); c.lineTo(lx + 24, ax + 80); c.lineTo(lx + 3, ax + 78);
      c.quadraticCurveTo(lx + 26, ax, lx + 3, ax - 78); c.fill(); c.stroke();
      label(c, 'CROWN + FLINT', lx + 12, ax + 104, { size: 11, ls: 1.5, color: P.ink, align: 'center', halo: false });
      c.globalAlpha = on;
    } else label(c, 'SINGLE LENS', lx, ax + 104, { size: 11, ls: 1.5, color: P.ink, align: 'center', halo: false });
    // rays: white in, coloured out
    c.strokeStyle = 'rgba(23,24,28,0.7)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(x + 24, ax - top); c.lineTo(lx, ax - top); c.moveTo(x + 24, ax + top); c.lineTo(lx, ax + top); c.stroke();
    const cols = [['#2f5bff', -1, '450 nm'], ['#1f9e4a', 0, '550'], ['#e0362c', 1, '650 nm']];
    c.globalCompositeOperation = 'multiply';
    for (const [col, k] of cols) {
      const f = fG + k * s, x2 = x + 560;
      c.strokeStyle = col; c.lineWidth = 2;
      for (const sgnY of [-1, 1]) {
        const y0 = ax + sgnY * top, y2 = y0 + (ax - y0) * (x2 - lx) / (f - lx);
        c.beginPath(); c.moveTo(lx + 4, y0); c.lineTo(x2, y2); c.stroke();
      }
    }
    c.globalCompositeOperation = 'source-over';
    if (s > 14) for (const [col, k, nm] of cols) {
      c.fillStyle = col; c.beginPath(); c.arc(fG + k * s, ax, 4, 0, TAU); c.fill();
      label(c, nm, fG + k * s + k * 6, ax + 24 + (k === 0 ? 16 : 0), { size: 11, ls: 1, color: col, align: k < 0 ? 'right' : k > 0 ? 'left' : 'center', halo: false, weight: 700 });
    } else { c.fillStyle = P.ink; c.beginPath(); c.arc(fG, ax, 4, 0, TAU); c.fill(); label(c, 'ONE FOCUS', fG + 10, ax + 26, { size: 11, ls: 1.5, color: P.ink, halo: false, weight: 700 }); }
    c.restore();
  }

  MG.film({
    id: 'lookchromatic', dur: 10, poster: 6.3,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Chromatic Aberration', sub: 'Colours that refuse to meet: lens fringing in post', era: '1700s optics · 2000s — as a look',
      origin: 'Glass bends short wavelengths more than long ones (dispersion), so a simple lens brings blue to a focus closer than red. Isaac Newton concluded in Opticks (1704) that this colour error could not be removed from lenses, one reason he built a reflecting telescope. It was corrected in the 18th century by the achromatic doublet, a converging crown-glass lens paired with a diverging flint-glass one: Chester Moor Hall made the first ones in the 1730s and John Dollond patented and sold them from 1758. Real-time renderers later added the fringe back on purpose as a post effect that imitates imperfect camera lenses, often next to grain and vignetting.',
      works: 'Isaac Newton, Opticks (1704) · John Dollond’s achromatic doublet (patented 1758) · Alien: Isolation (Creative Assembly, 2014; lens fringing with grain for a 1970s-film look)',
      tech: ['Lateral CA: per-channel radial scale', 'Longitudinal CA: R and B defocused', 'Achromatic doublet as the correction'],
      accent: '#e0362c',
      motionDNA: 'The shared 10 s camera move: a 50° orbit with a slight drift down while the Token bobs and turns. A wipe brings in the uncorrected lens; on each beat the lateral scale steps up (R ×1.006 → ×1.0185 with B scaled down the same) so the fringes widen toward the frame edges; then longitudinal blur grows on R and B; finally a wipe from the right corrects the lens with a doublet and holds as a split, uncorrected on the left.',
      visualDNA: 'The plain still life with red and cyan-blue fringes along every silhouette, near zero at the centre and widest at the cube and sphere, then soft purple-green halos on all edges; on the corrected side, clean edges. A loupe with the edge’s pixels and its R, G, B profile, concentric rings giving the fringe width at each radius, and a ray diagram of three wavelengths focusing apart.',
      transitions: 'Wipe from the ideal lens to the aberrated one; stepped strength on the beat; a wipe to the corrected lens holding as a split',
      implementation: ['Lens-distortion / chromatic-aberration post nodes (Nuke, After Effects, game post stacks)', 'Per-channel radial scale about the optical centre plus per-channel defocus', 'Canvas 2D + SDF tracer (js/look-kit.js): LK.plain shaded, then opts-style post on the float buffer: R and B resampled bilinearly at 1 ± k scale, mixed with box-blurred copies for axial CA'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      DK = false;
      const k = latK(t), ax = axAt(t), caX = E.ioC(seg(t, 1.0, 2.0)), corr = E.ioC(seg(t, CORR[0], CORR[1])), corrX = 1 - 0.5 * corr;
      const G = LK.gbuffer(t, 800, 450); G.aa = true;
      const cv = LK.shadeBuffer(G, LK.plain, (rgb, GG) => caPost(rgb, GG, { k, ax, caX, corrX }));
      c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; c.drawImage(cv, 0, 0, W, H); c.restore();
      const S = G.S, sx = W / G.w;

      // radial guide: optical centre and rings labelled with the R–B separation at that radius
      const rOn = pulse(t, 2.0, 4.6, 0.35);
      if (rOn > 0.01) {
        c.save(); c.globalAlpha = rOn;
        c.strokeStyle = 'rgba(23,24,28,0.3)'; c.lineWidth = 1.2; c.setLineDash([5, 7]);
        [300, 600, 900].forEach(r => { c.beginPath(); c.arc(W / 2, H / 2, r, 0, TAU); c.stroke(); });
        c.setLineDash([]);
        c.strokeStyle = P.ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(W / 2 - 16, H / 2); c.lineTo(W / 2 + 16, H / 2); c.moveTo(W / 2, H / 2 - 16); c.lineTo(W / 2, H / 2 + 16); c.stroke();
        label(c, 'OPTICAL CENTRE · NO SHIFT', W / 2 + 22, H / 2 - 12, { size: 13, ls: 1.5, color: P.ink, weight: 700 });
        [300, 600, 900].forEach(r => label(c, `R–B ${(2 * k * r).toFixed(1)} px`, W / 2 + r * 0.7071 + 8, H / 2 + r * 0.7071 - 4, { size: 13, ls: 1, color: P.ink }));
        c.restore();
      }

      // loupe on the cube's edge, with the R, G, B profile across it
      const lOn = seg(t, 2.3, 2.7) * (1 - seg(t, 9.5, 9.8));
      if (caProbe && lOn > 0.01) {
        const pr = caProbe, Ls = 288, lx = W - 72 - Ls, ly = 120, z = Ls / pr.N;
        c.save(); c.globalAlpha = lOn;
        // source box on the frame and the leader to the loupe
        const bx = pr.x0 * sx, by = pr.y0 * sx, bs = pr.N * sx;
        c.strokeStyle = P.ink; c.lineWidth = 1.5; c.strokeRect(bx, by, bs, bs);
        c.strokeStyle = 'rgba(23,24,28,0.5)'; c.beginPath(); c.moveTo(bx + bs / 2, by); c.lineTo(lx + Ls / 2, ly + Ls + 132); c.stroke();
        panel(c, lx - 12, ly - 36, Ls + 24, Ls + 168, 0.94);
        c.imageSmoothingEnabled = false;
        c.drawImage(cv, pr.x0, pr.y0, pr.N, pr.N, lx, ly, Ls, Ls);
        c.imageSmoothingEnabled = true;
        c.strokeStyle = P.ink; c.lineWidth = 1.5; c.strokeRect(lx - 0.75, ly - 0.75, Ls + 1.5, Ls + 1.5);
        c.strokeStyle = 'rgba(236,232,223,0.6)'; c.setLineDash([3, 4]); c.beginPath(); c.moveTo(lx, ly + Ls / 2 + z / 2); c.lineTo(lx + Ls, ly + Ls / 2 + z / 2); c.stroke(); c.setLineDash([]);
        label(c, 'LOUPE · CUBE EDGE · ×' + Math.round(z), lx, ly - 12, { size: 13, ls: 2, color: P.ink, weight: 700, halo: false });
        // profile
        const py = ly + Ls + 14, ph = 96;
        c.fillStyle = 'rgba(23,24,28,0.06)'; c.fillRect(lx, py, Ls, ph);
        c.globalCompositeOperation = 'multiply';
        [['#e0362c', 0], ['#1f9e4a', 1], ['#2f5bff', 2]].forEach(([col, ch]) => {
          c.strokeStyle = col; c.lineWidth = 2.2; c.beginPath();
          pr.prof.forEach((v, i) => { const X = lx + (i + 0.5) * z, Y = py + ph - 6 - clamp(v[ch]) * (ph - 12); i ? c.lineTo(X, Y) : c.moveTo(X, Y); });
          c.stroke();
        });
        c.globalCompositeOperation = 'source-over';
        label(c, 'R · G · B ACROSS THE EDGE', lx, py + ph + 22, { size: 12, ls: 1.5, color: SUB, halo: false });
        c.restore();
      }

      // top-left panel: focus diagram + readouts
      const dOn = seg(t, 1.2, 1.6);
      if (dOn > 0.01) {
        const useC = corr > 0.5, kk = useC ? CRES.k : k, aa = useC ? CRES.ax : ax;
        const sep = useC ? lerp(30, 4, seg(t, CORR[0] + 0.4, CORR[1])) : 6 + 26 * (k / KMAX) + 22 * ax;
        c.save(); c.globalAlpha = dOn;
        panel(c, 56, 104, 600, 330, 0.92);
        focusDiagram(c, 60, 112, corr > 0 ? lerp(6 + 26 + 22, 4, corr) : sep, corr, 1);
        label(c, `RADIAL SCALE   R ×${(1 + kk).toFixed(4)}   G ×1.0000   B ×${(1 - kk).toFixed(4)}`, 78, 372, { size: 14, ls: 1, color: P.ink, weight: 700, halo: false });
        label(c, `DEFOCUS BLUR   R ${(aa * 2 * RB.r * sx).toFixed(1)} px   G 0.0 px   B ${(aa * 2 * RB.b * sx).toFixed(1)} px`, 78, 400, { size: 14, ls: 1, color: P.ink, halo: false });
        label(c, useC ? 'corrected side' : 'lens side', 78, 424, { size: 12, ls: 1.5, color: SUB, halo: false });
        c.restore();
      }

      // wipes
      wipeLine(c, caX, W, H, 'REAL LENS', 'IDEAL LENS', 1, 560);
      if (corr > 0.001) {
        const x = corrX * W;
        c.save(); c.fillStyle = HALO; c.fillRect(x - 3, 0, 6, H); c.fillStyle = P.accent; c.fillRect(x - 1.5, 0, 3, H);
        label(c, 'SINGLET  ◀', x - 16, 560, { align: 'right', color: P.ink, weight: 700, size: 16 });
        label(c, '▶  ACHROMAT', x + 16, 560, { color: P.ink, weight: 700, size: 16 });
        c.restore();
      }

      // callouts
      callout(c, S, W, H, add(LK.CUBE.c, mul(S.cam.right, 0.6)), -40, 230, 'LATERAL: GROWS WITH RADIUS', 'R scaled out, B scaled in', pulse(t, 2.5, 4.4, 0.3));
      callout(c, S, W, H, tokPt(S, 0.1, 0.98, 0.0), 120, -60, 'NEAR THE CENTRE: ALMOST NONE', 'shift = k · distance', pulse(t, 2.9, 4.4, 0.3));
      callout(c, S, W, H, tokPt(S, -0.98, -0.2, 0.1), -150, 150, 'LONGITUDINAL: EVERY EDGE', 'R, B out of focus → purple / green', pulse(t, 5.0, 7.0, 0.3));
      callout(c, S, W, H, add(LK.CUBE.c, [-0.3, -0.2, 0.5]), -200, 140, 'ACHROMAT: ONE FOCUS AGAIN', 'crown + flint cancel the dispersion', pulse(t, 8.2, 9.6, 0.3));

      const stage = t < 1.0 ? 'IDEAL LENS  ·  ALL WAVELENGTHS MEET'
        : t < 6 * B ? 'LATERAL CA  ·  R, G, B SCALED FROM THE CENTRE'
        : t < CORR[0] ? '+ LONGITUDINAL CA  ·  R AND B OUT OF FOCUS'
        : 'CORRECTED  ·  ACHROMATIC DOUBLET';
      tag(c, stage, 72, 80);
      const cur = u => { const tt = u * 10; return (tt < CORR[0] ? latK(tt) / KMAX * 0.6 + axAt(tt) * 0.4 : lerp(1, 0.04, E.ioC(seg(tt, CORR[0], CORR[1])))); };
      LK.caption(c, t, W, H, { name: 'Chromatic Aberration', cat: 'Image', curve: cur, span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'ABERRATION / TIME' });
    },
    score(A) {
      LK.bed(A);
      A.whoosh(1.0, 1.0, { f1: 300, f2: 2600, q: 0.9, g: 0.08, swell: 0.6, rev: 0.4, pan: -0.3 });
      // each strength step: three voices (R, G, B) pulling further apart in pitch
      [2 * B, 3 * B, 4 * B, 5 * B].forEach((t, i) => {
        const d = [6, 10, 14, 19][i], f = midi(69);
        A.osc(t, { type: 'triangle', f: f * Math.pow(2, -d / 1200 * 3), dur: 0.5, g: 0.045, lp: 2200, rev: 0.4, pan: -0.6 });
        A.osc(t, { type: 'triangle', f, dur: 0.5, g: 0.045, lp: 2200, rev: 0.4 });
        A.osc(t, { type: 'triangle', f: f * Math.pow(2, d / 1200 * 3), dur: 0.5, g: 0.045, lp: 2200, rev: 0.4, pan: 0.6 });
      });
      // longitudinal: a smeared, filtered swell
      A.osc(6 * B, { type: 'sawtooth', f: midi(45), dur: 2.6, g: 0.035, a: 0.6, lp: 400, lp2: 1400, lpT: 1.2, rev: 0.6, detune: 18 });
      A.osc(6 * B, { type: 'sawtooth', f: midi(45), dur: 2.6, g: 0.03, a: 0.6, lp: 400, lp2: 1400, lpT: 1.2, rev: 0.6, detune: -22 });
      // correction: the detuned pair glides into unison, a bell confirms
      A.whoosh(CORR[0], CORR[1] - CORR[0], { f1: 2400, f2: 400, q: 0.9, g: 0.07, swell: 0.5, rev: 0.4, pan: 0.3 });
      A.osc(CORR[0], { type: 'triangle', f: midi(64) * 1.03, f2: midi(64), glide: 1.0, dur: 1.8, g: 0.05, rev: 0.5, pan: -0.4 });
      A.osc(CORR[0], { type: 'triangle', f: midi(64) * 0.97, f2: midi(64), glide: 1.0, dur: 1.8, g: 0.05, rev: 0.5, pan: 0.4 });
      A.bell(CORR[1], midi(76), { g: 0.06, dur: 1.8, rev: 0.6 });
      A.chord(CORR[1], [52, 59, 64, 68], { type: 'triangle', dur: 2.0, g: 0.028, a: 0.3, lp: 1600, rev: 0.7, width: 0.8 });
    },
  });
})();
