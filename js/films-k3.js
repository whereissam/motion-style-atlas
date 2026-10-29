/* batch k3 — Technique Atlas · Camera: techorbit · techparallax · techcrashzoom.
   The same Token and the same word MOTION in every film; only the camera technique changes.
   techorbit (a look-at camera circling an extruded 3D Token, with a top-view mini-map) ·
   techparallax (four depth layers trucked past at speeds of 1 / depth, plus a flattened comparison) ·
   techcrashzoom (snap zooms with zoom blur onto the Token, its hole and a letter, on the beat). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, vnoise, midi, text, offscreen } = MG;
  const TK = MG.TK, P = TK.P, BEAT = TK.BEAT;
  const PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, u) => { const A = hex(a), B = hex(b); u = clamp(u); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
  const rgba = (h, a) => `rgba(${hex(h).join(',')},${a})`;
  const poly = (g, pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
  const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const norm3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // Look-at pinhole camera (y up). P(world) → [sx, sy, depth], or null behind the near plane.
  function lookAt(C, T, F, cx = 960, cy = 540) {
    const f = norm3(sub3(T, C)), r = norm3([-f[2], 0, f[0]]);
    const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    const cam = { C, f, r, u, F, cx, cy };
    cam.depth = p => (p[0] - C[0]) * f[0] + (p[1] - C[1]) * f[1] + (p[2] - C[2]) * f[2];
    cam.P = p => {
      const dx = p[0] - C[0], dy = p[1] - C[1], dz = p[2] - C[2], z = dx * f[0] + dy * f[1] + dz * f[2];
      if (z < 0.04) return null;
      return [cx + F * (dx * r[0] + dy * r[1] + dz * r[2]) / z, cy - F * (dx * u[0] + dy * u[1] + dz * u[2]) / z, z];
    };
    return cam;
  }
  // Polygon clipped against the near plane, then projected (null if nothing is left).
  function clipProj(cam, pts, near = 0.06) {
    const out = [], n = pts.length, d = pts.map(cam.depth);
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n], da = d[i], db = d[(i + 1) % n];
      if (da >= near) out.push(a);
      if ((da >= near) !== (db >= near)) { const u = (near - da) / (db - da); out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]); }
    }
    if (out.length < 3) return null;
    return out.map(p => cam.P(p) || cam.P([p[0] + cam.f[0] * 0.02, p[1] + cam.f[1] * 0.02, p[2] + cam.f[2] * 0.02]));
  }
  function line3(c, cam, a, b, near = 0.06) {
    let da = cam.depth(a), db = cam.depth(b);
    if (da < near && db < near) return;
    if (da < near) { const u = (near - da) / (db - da); a = [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; }
    else if (db < near) { const u = (near - db) / (da - db); b = [lerp(b[0], a[0], u), lerp(b[1], a[1], u), lerp(b[2], a[2], u)]; }
    const p = cam.P(a), q = cam.P(b); if (!p || !q) return;
    c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]);
  }
  const MONO = TK.MONO, FONT = TK.FONT;
  const tag = (c, s, x, y, o = {}) => text(c, s, x, y, { font: MONO, size: o.size || 16, ls: 2, color: o.color || P.mute, align: o.align || 'left', base: o.base || 'alphabetic', weight: o.weight || 400 });

  /* =====================================================================
     ORBIT — the Token rebuilt as a 3D slab: the rounded-square outline
     (corner 0.22) with the round hole, extruded with thickness, standing
     on the kit floor, with MOTION lettered on the floor in front of it.
     A look-at pinhole camera circles it: hold on the front, a full 360°
     orbit at eye height, a crane down, a faster low orbit looking up, and
     a rise into a three-quarter hero hold. A top-view mini-map shows the
     camera on its path; the path is also dashed on the floor.
     ===================================================================== */
  const OB = { S: 2, TH: 0.42, F: 1250, G: 2 / 3, LZ: 1.75, LH: 0.62 };
  const OB_L = norm3([-0.5, 0.78, 0.55]);
  const OB_TH = [[0, 0], [1, 0], [5, TAU, E.ioS], [5.4, TAU], [9.1, 2 * TAU + 0.6, E.ioS], [10, 2 * TAU + 0.6]];
  const OB_H = [[0, 2.4], [5.2, 2.4], [6.4, 0.42, E.ioC], [8.2, 0.42], [9.3, 1.6, E.ioC]];
  const OB_R = [[0, 8.4], [1, 7.6, E.outC], [5.2, 7.6], [6.4, 5.7, E.ioC], [8.2, 5.7], [9.3, 6.6, E.ioC]];
  function obPose(t) {
    const th = kf(t, OB_TH), h = kf(t, OB_H), R = kf(t, OB_R);
    return { th, h, R, C: [R * Math.sin(th), h, R * Math.cos(th)] };
  }
  function obGeometry() {
    const { S, TH } = OB, hs = S / 2, r = S * TK.CORNER, cy = S / 2, out = [], hole = [], N = 8;
    [[hs - r, hs - r, 0], [-hs + r, hs - r, PI / 2], [-hs + r, -hs + r, PI], [hs - r, -hs + r, 1.5 * PI]].forEach(([x, y, a0]) => {
      for (let i = 0; i <= N; i++) { const a = a0 + (i / N) * PI / 2; out.push([x + r * Math.cos(a), cy + y + r * Math.sin(a)]); }
    });
    const hx = TK.HOLE.x * S, hy = cy - TK.HOLE.y * S, hr = TK.HOLE.r * S;
    for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU; hole.push([hx + hr * Math.cos(a), hy + hr * Math.sin(a)]); }
    const zf = TH / 2, zb = -TH / 2, walls = [], inner = [];
    for (let i = 0; i < out.length; i++) {
      const p = out[i], q = out[(i + 1) % out.length], dx = q[0] - p[0], dy = q[1] - p[1];
      walls.push({ pts: [[p[0], p[1], zf], [q[0], q[1], zf], [q[0], q[1], zb], [p[0], p[1], zb]], n: norm3([dy, -dx, 0]) });
    }
    for (let i = 0; i < hole.length; i++) {
      const p = hole[i], q = hole[(i + 1) % hole.length], dx = q[0] - p[0], dy = q[1] - p[1];
      inner.push({ pts: [[p[0], p[1], zf], [q[0], q[1], zf], [q[0], q[1], zb], [p[0], p[1], zb]], n: norm3([-dy, dx, 0]) });
    }
    return { out, hole, walls, inner, zf, zb };
  }
  const obVis = (cam, f) => { const m = f.pts[0]; return dot3(f.n, sub3(cam.C, m)) > 0; };
  const obShade = n => clamp(dot3(n, OB_L) * 0.5 + 0.5);
  function obFace(c, cam, pts, col) {
    const q = clipProj(cam, pts); if (!q) return;
    poly(c, q); c.fillStyle = col; c.fill(); c.strokeStyle = col; c.lineWidth = 1; c.stroke();
  }
  function obFloor(c, cam, W, H, t, pose) {
    c.fillStyle = P.ground; c.fillRect(0, 0, W, H);
    // horizon: a point straight ahead at camera height, far away
    const fh = norm3([cam.f[0], 0, cam.f[2]]), hz = cam.P([cam.C[0] + fh[0] * 4000, cam.C[1], cam.C[2] + fh[2] * 4000]);
    const hy = hz ? hz[1] : -100;
    const G = OB.G, N = 22;
    c.strokeStyle = 'rgba(23,24,28,0.09)'; c.lineWidth = 1.2; c.beginPath();
    for (let k = -N; k <= N; k++) { line3(c, cam, [k * G, 0, -N * G], [k * G, 0, N * G]); line3(c, cam, [-N * G, 0, k * G], [N * G, 0, k * G]); }
    c.stroke();
    // fade the grid into the paper at the horizon
    const fg = c.createLinearGradient(0, hy - 2, 0, hy + 260);
    fg.addColorStop(0, rgba(P.ground, 1)); fg.addColorStop(1, rgba(P.ground, 0));
    c.fillStyle = fg; c.fillRect(0, hy - 2, W, 262);
    c.fillStyle = P.ground; c.fillRect(0, 0, W, Math.max(0, hy - 1));
    // the orbit path, dashed on the floor
    c.strokeStyle = rgba(P.accent, 0.45); c.lineWidth = 2.5; c.beginPath();
    for (let i = 0; i < 120; i += 2) {
      const a0 = (i / 120) * TAU, a1 = ((i + 1) / 120) * TAU, R = pose.R;
      const A = [R * Math.sin(a0), 0.003, R * Math.cos(a0)], B = [R * Math.sin(a1), 0.003, R * Math.cos(a1)];
      if (cam.depth(A) > 1.6 && cam.depth(B) > 1.6) line3(c, cam, A, B);
    }
    c.stroke();
    // soft shadows: a wide penumbra cast away from the light, then a tight contact shadow
    const ell = (cx, cz, rx, rz) => Array.from({ length: 28 }, (_, i) => { const a = (i / 28) * TAU; return [cx + rx * Math.cos(a), 0.002, cz + rz * Math.sin(a)]; });
    [[0.35, -0.35, 1.55, 0.62, 0.07], [0.22, -0.22, 1.25, 0.42, 0.08], [0.05, -0.04, 1.06, 0.28, 0.13]].forEach(([x, z, rx, rz, a]) => {
      const q = clipProj(cam, ell(x, z, rx, rz)); if (!q) return; poly(c, q); c.fillStyle = `rgba(23,24,28,${a})`; c.fill();
    });
    // MOTION lettered on the floor in front of the Token (per-letter affine from the local projection)
    c.font = `900 100px ${FONT}`;
    const ws = [...TK.WORD].map(ch => c.measureText(ch).width), ls = 6, tot = ws.reduce((a, b) => a + b, 0) + ls * 5, k = OB.LH / 72;
    let x = -tot / 2;
    for (let i = 0; i < 6; i++) {
      const cxw = (x + ws[i] / 2) * k, O = [cxw, 0.004, OB.LZ], e = 0.05;
      x += ws[i] + ls;
      if (cam.depth(O) < 0.8) continue;
      const o = cam.P(O), px = cam.P([cxw + e, 0.004, OB.LZ]), pz = cam.P([cxw, 0.004, OB.LZ + e]);
      if (!o || !px || !pz) continue;
      const a = (px[0] - o[0]) / e * k, b = (px[1] - o[1]) / e * k, cc = (pz[0] - o[0]) / e * k, d = (pz[1] - o[1]) / e * k;
      c.save(); c.transform(a, b, cc, d, o[0], o[1]);
      text(c, TK.WORD[i], 0, 0, { font: FONT, weight: 900, size: 100, color: P.ink, align: 'center', base: 'middle' });
      c.restore();
    }
  }
  function obToken(c, cam, geo) {
    const { out, hole, walls, inner, zf, zb } = geo;
    inner.forEach(f => { if (obVis(cam, f)) obFace(c, cam, f.pts, mixc('#6e2104', '#b0400f', obShade(f.n))); });
    walls.forEach(f => { if (obVis(cam, f)) obFace(c, cam, f.pts, mixc('#7c2605', P.accentD, obShade(f.n) * 1.15)); });
    const front = cam.C[2] > zf, z = front ? zf : zb, n = [0, 0, front ? 1 : -1];
    const q = clipProj(cam, out.map(p => [p[0], p[1], z])), qh = clipProj(cam, hole.map(p => [p[0], p[1], z]));
    if (!q) return;
    c.beginPath();
    q.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    if (qh) { qh.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); }
    const col = mixc(P.accentD, P.accent, 0.55 + 0.45 * obShade(n) * 1.3);
    c.fillStyle = col; c.fill('evenodd');
    c.strokeStyle = 'rgba(120,36,4,0.35)'; c.lineWidth = 1.5; c.stroke();
  }
  function obMap(c, W, t, pose) {
    const s = 280, x0 = W - 72 - s, y0 = 64, cx = x0 + s / 2, cy = y0 + s / 2 + 6, k = 15.5;
    c.fillStyle = 'rgba(236,232,223,0.92)'; c.fillRect(x0, y0, s, s + 52);
    c.strokeStyle = 'rgba(23,24,28,0.22)'; c.lineWidth = 1; c.strokeRect(x0 + 0.5, y0 + 0.5, s, s + 52);
    tag(c, 'TOP VIEW', x0 + 14, y0 + 24, { size: 14 });
    // the two orbit paths
    c.setLineDash([4, 5]);
    [[7.6, 'rgba(23,24,28,0.3)'], [5.7, rgba(P.accent, 0.55)]].forEach(([R, col]) => { c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, R * k, 0, TAU); c.stroke(); });
    c.setLineDash([]);
    // floor lettering and the Token from above (front face toward the bottom = start camera)
    c.fillStyle = 'rgba(23,24,28,0.35)'; c.fillRect(cx - 2.3 * k, cy + (OB.LZ - 0.3) * k, 4.6 * k, 0.6 * k);
    c.fillStyle = P.accentD; c.fillRect(cx - k, cy - OB.TH / 2 * k, 2 * k, OB.TH * k);
    c.fillStyle = P.accent; c.fillRect(cx - k, cy + OB.TH / 2 * k - 2, 2 * k, 3);
    // trail over the last second and a half
    c.strokeStyle = P.ink; c.lineWidth = 2.5; c.beginPath();
    for (let i = 0; i <= 30; i++) { const q = obPose(Math.max(0, t - 1.5 + i * 0.05)); const px = cx + q.C[0] * k, py = cy + q.C[2] * k; i ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke();
    // camera with its view cone toward the Token
    const px = cx + pose.C[0] * k, py = cy + pose.C[2] * k, a = Math.atan2(cy - py, cx - px);
    c.fillStyle = rgba(P.accent, 0.2); c.beginPath(); c.moveTo(px, py);
    c.lineTo(px + Math.cos(a - 0.38) * 70, py + Math.sin(a - 0.38) * 70); c.lineTo(px + Math.cos(a + 0.38) * 70, py + Math.sin(a + 0.38) * 70); c.closePath(); c.fill();
    c.save(); c.translate(px, py); c.rotate(a);
    c.fillStyle = P.ink; c.fillRect(-11, -8, 16, 16); c.beginPath(); c.moveTo(4, -5); c.lineTo(12, -9); c.lineTo(12, 9); c.lineTo(4, 5); c.closePath(); c.fill();
    c.restore();
    const deg = Math.round(((pose.th % TAU) + TAU) % TAU * 180 / PI);
    tag(c, `ANGLE ${String(deg).padStart(3, '0')}°`, x0 + 14, y0 + s + 22, { size: 14, color: P.ink });
    tag(c, `HEIGHT ${pose.h.toFixed(1)}`, x0 + 14, y0 + s + 42, { size: 14 });
    tag(c, `RADIUS ${pose.R.toFixed(1)}`, x0 + 150, y0 + s + 42, { size: 14 });
  }
  const OB_ANG = u => kf(u * 10, OB_TH) / (2 * TAU + 0.6);

  MG.film({
    id: 'techorbit', dur: 10, poster: 6.0,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Orbit', sub: 'The camera circles the subject', era: '1950s —',
      origin: 'An orbit moves the camera around a subject on a circular dolly track, a crane or, later, a virtual path, keeping it centred while the background wheels past behind it. Hitchcock’s 360° kiss in Vertigo (1958) and Brian De Palma’s circling shots made it a signature move, Michael Bay turned the low-angle spin into a blockbuster cliché, and in 3D software the turntable orbit is the default way to show an object.',
      works: 'Vertigo (Alfred Hitchcock, 1958) · Obsession (Brian De Palma, 1976) · Bad Boys II (Michael Bay, 2003) · The Avengers (Joss Whedon, 2012)',
      tech: ['Look-at camera on a circular path', 'Radius and height varied per orbit', 'Top-view map of the camera path'],
      accent: '#ff5a1f',
      motionDNA: 'The subject never leaves frame centre; everything else turns. A held front view, one smooth eased 360° at eye height, a crane down to the floor, a quicker low orbit looking up so the Token looms, then a rise into a still three-quarter view. The floor grid and lettering wheel past and the parallax of near and far floor gives the rotation its weight.',
      visualDNA: 'The kit stage as a perspective floor: warm paper with the faint grid fading into the horizon, an extruded orange Token with darker side walls and a punched hole, MOTION lettered on the floor in ink, a dashed orange orbit path, soft contact shadows, and a top-view map with the camera, its view cone and trail.',
      transitions: 'One continuous camera move: hold, orbit, crane down, low orbit, rise to a held three-quarter view',
      implementation: ['Circular dolly track, crane or motion-control rig; a turntable path in 3D software', 'Look-at pinhole projection in Canvas 2D with back-face culling and flat shading', 'Camera angle, radius and height keyframed on the beat grid'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { geo: obGeometry() }; },
    draw(c, t, W, H, st) {
      const pose = obPose(t), T = [0, lerp(1.0, 1.25, clamp((2.4 - pose.h) / 2)), 0];
      const cam = lookAt(pose.C, T, OB.F);
      obFloor(c, cam, W, H, t, pose);
      obToken(c, cam, st.geo);
      obMap(c, W, t, pose);
      TK.caption(c, t, W, H, { name: 'Orbit', cat: 'Camera', curve: OB_ANG, span: [0, 10], lo: -0.1, hi: 1.12, curveLabel: 'ANGLE / TIME' });
    },
    score(A) {
      TK.bed(A);
      // the orbit as a travelling whoosh, panned with the camera's side of the subject
      const sweep = (t0, t1, n, g) => {
        for (let i = 0; i < n; i++) {
          const a = lerp(t0, t1, i / n), d = (t1 - t0) / n, th = kf(a + d / 2, OB_TH), sp = Math.abs(kf(a + d / 2 + 0.05, OB_TH) - kf(a + d / 2 - 0.05, OB_TH)) * 10;
          A.noise(a, { type: 'bandpass', f: 300 + sp * 260, q: 1.1, dur: d * 1.6, g: g * clamp(sp / 2.6, 0.15, 1), swell: 0.5, pan: Math.sin(th) * 0.7, rev: 0.25 });
        }
      };
      sweep(1, 5, 16, 0.07); sweep(5.4, 9.1, 16, 0.08);
      // a soft tick every quarter turn
      for (let q = 1; q <= 9; q++) {
        const target = q * PI / 2; let lo = 0, hi = 9.1;
        if (target > 2 * TAU + 0.6) break;
        for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; kf(m, OB_TH) < target ? (lo = m) : (hi = m); }
        A.pluck(lo, midi([72, 76, 79, 84][(q - 1) % 4]), { g: 0.16, dur: 0.9, bright: 0.5, rev: 0.3, pan: Math.sin(target) * 0.5 });
      }
      // crane down: a low swell; rise: a riser into the hold
      A.osc(5.2, { type: 'triangle', f: 220, f2: 82, glide: 1.2, dur: 1.4, g: 0.05, a: 0.4, lp: 900 });
      A.riser(8.2, 1.0, { g: 0.08, f: 110 });
      A.kick(9.3, 0.3, { f: 100, f2: 40 });
      A.chord(9.3, [60, 64, 67, 72], { type: 'triangle', dur: 0.7, g: 0.04, a: 0.02, lp: 2400, width: 0.8, rev: 0.5 });
      A.bell(9.3, midi(84), { g: 0.05, dur: 1.2, rev: 0.5 });
    },
  });

  /* =====================================================================
     PARALLAX — four flat layers at four depths: FAR (the grid and a giant
     MOTION, z 4), BACK (a row of pale Token copies, z 2), MID (the Token,
     z 1) and NEAR (big Token copies cropping the top, z 0.5). A sideways
     truck moves each layer by camera-offset / depth, so near moves twice
     as fast as mid and far a quarter as fast. A plan-view inset shows the
     camera on its track and each layer's speed; mid-film the frame splits
     into a flattened version (everything at one speed) and the parallax
     version, side by side, before trucking home to a held centre frame.
     ===================================================================== */
  const PX_X = [[0, 0], [1, 0], [4, 760, E.ioS], [5.75, -760, E.ioS], [7.5, 760, E.ioS], [9.2, 0, E.ioC]];
  const PX_LAYERS = [{ id: 'NEAR', z: 0.5 }, { id: 'MID', z: 1 }, { id: 'BACK', z: 2 }, { id: 'FAR', z: 4 }];
  const pxSplit = t => E.ioC(seg(t, 4.0, 4.5)) * (1 - E.ioC(seg(t, 7.5, 8.0)));
  function pxScene(c, W, H, t, camX, flat) {
    const off = z => -camX * (flat ? 1 : 1 / z);
    const lab = clamp(seg(t, 0.4, 0.9)) * (1 - seg(t, 3.6, 4.0));
    // FAR: grid and a giant pale MOTION
    const of = off(4);
    TK.stage(c, W, H, { ox: of });
    TK.word(c, 960 + of, 470, { size: 430, color: P.ground2, ls: 24 });
    if (lab > 0) tag(c, 'FAR · z 4 · ×0.25', 240 + of, 640, { size: 18, color: rgba(P.ink, 0.75 * lab) });
    // BACK: a row of pale Token copies
    const ob = off(2);
    for (let k = -8; k <= 10; k++) {
      const x = k * 250 + 85 + ob; if (x < -120 || x > W + 120) continue;
      TK.token(c, x, 700, 120, { color: '#f2b79f', rot: (k % 3) * 0.22 });
    }
    if (lab > 0) tag(c, 'BACK · z 2 · ×0.5', 335 + ob, 800, { size: 18, color: rgba(P.ink, 0.75 * lab), align: 'center' });
    // MID: the Token
    const om = off(1);
    TK.token(c, 960 + om, 560, 330);
    if (lab > 0) tag(c, 'MID · z 1 · ×1', 960 + om, 370, { size: 18, color: rgba(P.ink, 0.85 * lab), align: 'center' });
    // NEAR: big Token copies cropping the top of frame
    const on = off(0.5);
    for (let k = -6; k <= 8; k++) {
      const x = k * 760 + 160 + on; if (x < -320 || x > W + 320) continue;
      TK.token(c, x, 40, 400, { color: P.accentL, rot: 0.3 + k * 0.4, alpha: 0.92 });
    }
    if (lab > 0) tag(c, 'NEAR · z 0.5 · ×2', 160 + on, 290, { size: 18, color: rgba(P.ink, 0.85 * lab), align: 'center' });
  }
  function pxPlan(c, W, t, camX, alpha) {
    if (alpha <= 0.01) return;
    const w = 440, h = 270, x0 = W - 72 - w, y0 = 64;
    c.save(); c.globalAlpha *= alpha;
    c.fillStyle = 'rgba(236,232,223,0.94)'; c.fillRect(x0, y0, w, h);
    c.strokeStyle = 'rgba(23,24,28,0.22)'; c.lineWidth = 1; c.strokeRect(x0 + 0.5, y0 + 0.5, w, h);
    tag(c, 'PLAN VIEW · TRUCK', x0 + 14, y0 + 24, { size: 14 });
    const camY = y0 + h - 26, cx0 = x0 + 180, kx = 0.13, dz = 46;
    const vel = (kf(t + 0.05, PX_X) - kf(t - 0.05, PX_X)) * 10;
    const cols = { NEAR: P.accentL, MID: P.accent, BACK: '#e9a487', FAR: P.mute };
    // track
    c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0 + 40, camY + 10); c.lineTo(x0 + 320, camY + 10); c.stroke();
    const camx = cx0 + camX * kx;
    // view cone
    c.fillStyle = 'rgba(23,24,28,0.06)'; c.beginPath(); c.moveTo(camx, camY); c.lineTo(camx - 4.4 * dz * 0.9, camY - 4.4 * dz); c.lineTo(camx + 4.4 * dz * 0.9, camY - 4.4 * dz); c.closePath(); c.fill();
    PX_LAYERS.forEach(L => {
      const y = camY - L.z * dz - (L.z < 1 ? 6 : 0);
      c.strokeStyle = cols[L.id]; c.lineWidth = L.id === 'MID' ? 5 : 3.5;
      c.beginPath(); c.moveTo(x0 + 40, y); c.lineTo(x0 + 320, y); c.stroke();
      tag(c, L.id, x0 + 14, y + 5, { size: 11, color: P.ink });
      // screen speed: arrow length ∝ 1 / depth, pointing against the camera motion
      const sp = 1 / L.z, len = clamp(-vel * sp * 0.05, -90, 90), ax = x0 + 380, ay = y;
      c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(ax, ay); c.lineTo(ax + len, ay); c.stroke();
      if (Math.abs(len) > 4) { const s = Math.sign(len); c.fillStyle = P.ink; c.beginPath(); c.moveTo(ax + len + s * 7, ay); c.lineTo(ax + len - s * 2, ay - 5); c.lineTo(ax + len - s * 2, ay + 5); c.closePath(); c.fill(); }
      tag(c, `×${sp === 0.25 ? '¼' : sp === 0.5 ? '½' : sp}`, ax, ay - 8, { size: 12, align: 'center', color: P.mute });
    });
    c.fillStyle = P.ink; c.fillRect(camx - 10, camY - 4, 20, 14); c.beginPath(); c.moveTo(camx - 6, camY - 4); c.lineTo(camx + 6, camY - 4); c.lineTo(camx + 9, camY - 12); c.lineTo(camx - 9, camY - 12); c.closePath(); c.fill();
    tag(c, 'CAM', camx + 16, camY + 8, { size: 11, color: P.ink });
    c.restore();
  }
  const PX_CURVE = u => kf(u * 10, PX_X) / 760;

  MG.film({
    id: 'techparallax', dur: 10, poster: 2.6,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Parallax', sub: 'Depth from differential speed', era: '1930s —',
      origin: 'When the camera moves sideways, near things cross the frame faster than far ones, and that difference in speed alone reads as depth. Disney’s multiplane camera, first used on The Old Mill (1937) and then Snow White, shot painted layers on glass at different distances; side-scrolling games such as Moon Patrol (1982) scrolled background layers at fractions of the foreground speed, and the same idea drives 2.5D photo animation and parallax web pages.',
      works: 'The Old Mill (Disney, 1937) · Snow White and the Seven Dwarfs (Disney, 1937) · Moon Patrol (Irem, 1982) · The Kid Stays in the Picture (Brett Morgen & Nanette Burstein, 2002)',
      tech: ['Layer offset = camera offset / depth', 'Sideways truck, eased on the beat', 'Flattened vs parallax split'],
      accent: '#ff5a1f',
      motionDNA: 'A held frame, then a long eased truck to one side: the near Token copies race across the top, the Token keeps pace with the camera, the back row lags and the giant far MOTION barely drifts. The frame splits so a single-speed flattened version runs next to the parallax one through two more trucks, then the camera returns home and holds.',
      visualDNA: 'The kit stage seen as four flat cut-out planes: the faint grid and an enormous pale MOTION far back, a row of pale Token copies, the orange Token with its shadow, and big light-orange copies cropping the top edge; mono layer tags, a plan-view inset of track, view cone, layers and speed arrows, and two labelled panels for the comparison.',
      transitions: 'Truck, split into flattened vs parallax panels, truck back to the full frame and hold',
      implementation: ['Multiplane camera stand; layered compositing in After Effects with a 2-node camera', 'Canvas 2D layers offset by camera position / depth', 'Split-screen comparison drawing the same scene twice'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const camX = kf(t, PX_X), f = pxSplit(t);
      if (f < 0.001) {
        pxScene(c, W, H, t, camX, false);
      } else {
        TK.stage(c, W, H);
        const pw = 870, ph = pw * 9 / 16, py = 250, L = [72, py, pw, ph], R = [978, py, pw, ph];
        const panel = (r, flat, a) => {
          c.save(); c.globalAlpha *= a;
          c.beginPath(); c.rect(r[0], r[1], r[2], r[3]); c.clip();
          c.translate(r[0], r[1]); c.scale(r[2] / W, r[3] / H);
          pxScene(c, W, H, t, camX, flat);
          c.restore();
          c.save(); c.globalAlpha *= a; c.strokeStyle = 'rgba(23,24,28,0.3)'; c.lineWidth = 1.5; c.strokeRect(r[0], r[1], r[2], r[3]); c.restore();
        };
        const lr = [lerp(-pw, L[0], f), py, pw, ph];
        const rr = [lerp(0, R[0], f), lerp(0, py, f), lerp(W, pw, f), lerp(H, ph, f)];
        panel(lr, true, f);
        panel(rr, false, 1);
        const la = clamp((f - 0.6) / 0.4);
        if (la > 0) {
          c.save(); c.globalAlpha *= la;
          text(c, 'FLATTENED', L[0], py - 48, { font: FONT, weight: 800, size: 34, color: P.ink });
          tag(c, 'EVERY LAYER AT ONE SPEED', L[0], py - 16, { size: 16 });
          text(c, 'PARALLAX', R[0], py - 48, { font: FONT, weight: 800, size: 34, color: P.accent });
          tag(c, 'SPEED = 1 / DEPTH', R[0], py - 16, { size: 16 });
          c.restore();
        }
      }
      pxPlan(c, W, t, camX, clamp(seg(t, 0.3, 0.8)) * (1 - f));
      TK.caption(c, t, W, H, { name: 'Parallax', cat: 'Camera', curve: PX_CURVE, span: [0, 10], lo: -1.25, hi: 1.25, curveLabel: 'TRUCK / TIME' });
    },
    score(A) {
      TK.bed(A);
      // each layer named with a note, far to near
      [[0.5, 60], [0.625, 64], [0.75, 67], [0.875, 72]].forEach(([s, m], i) => A.pluck(s, midi(m), { g: 0.14, dur: 1.0, bright: 0.45, rev: 0.3, pan: (i - 1.5) * 0.3 }));
      // trucks: an airy pass panned with the direction of travel, plus a low dolly rumble
      [[1, 4, 1], [4, 5.75, -1], [5.75, 7.5, 1], [7.5, 9.2, -1]].forEach(([a, b, d]) => {
        const n = 6;
        for (let i = 0; i < n; i++) {
          const s = lerp(a, b, i / n), dd = (b - a) / n, v = Math.abs(kf(s + dd / 2 + 0.05, PX_X) - kf(s + dd / 2 - 0.05, PX_X)) * 10;
          A.noise(s, { type: 'bandpass', f: 500 + v * 1.6, q: 1.0, dur: dd * 1.7, g: 0.07 * clamp(v / 700, 0.12, 1), swell: 0.5, pan: d * lerp(-0.6, 0.6, i / (n - 1)), rev: 0.2 });
          A.noise(s, { type: 'lowpass', f: 160, dur: dd * 1.5, g: 0.06 * clamp(v / 700, 0.1, 1), swell: 0.5 });
        }
      });
      // direction changes and the split
      [4, 5.75, 7.5].forEach(s => A.pluck(s, midi(79), { g: 0.14, dur: 0.6, bright: 0.6, rev: 0.25 }));
      A.hat(4.0, 0.08); A.clap(4.0, 0.12); A.hat(7.5, 0.08); A.clap(7.5, 0.12);
      // home and hold
      A.kick(9.2, 0.3, { f: 100, f2: 40 });
      A.chord(9.2, [60, 67, 72, 76], { type: 'triangle', dur: 0.8, g: 0.04, lp: 2400, width: 0.8, rev: 0.5 });
      A.bell(9.25, midi(84), { g: 0.05, dur: 1.2, rev: 0.5 });
    },
  });

  /* =====================================================================
     CRASH ZOOM — the kit stage, the Token and MOTION in a calm wide shot.
     On the beat the lens snaps in (a fast eased zoom with zoom blur,
     manga speed lines, a whoosh and a hit) onto the Token; hold; crash
     out; a target bracket blinks on the hole a beat early, then crash into
     the hole; crash out; crash onto the O of MOTION and a double-take
     crash closer still; crash out to the wide and hold. Zoom is a canvas
     transform about the focus point; blur is the frame re-composited along
     the zoom path over a short shutter.
     ===================================================================== */
  const CZ = { tx: 960, ty: 400, ts: 300, wy: 735, ws: 150, dur: 0.14 };
  // [arrival time, zoom, focus target]
  const CZ_SHOTS = [[0, 1, 'wide'], [1.5, 2.8, 'tok'], [3.0, 1, 'wide'], [4.0, 9.5, 'hole'], [5.5, 1, 'wide'], [6.5, 3.4, 'O'], [7.0, 7.2, 'O'], [8.0, 1, 'wide']];
  const CZ_PRE = { 4.0: 'HOLE', 6.5: 'LETTER O' };
  function czLetters() {
    // letter centres of MOTION as drawn by czWord (measured with a shared canvas)
    const g = czLetters.g || (czLetters.g = offscreen(8, 8).getContext('2d'));
    g.font = `900 ${CZ.ws}px ${FONT}`;
    const ws = [...TK.WORD].map(ch => g.measureText(ch).width);
    if (!(ws[0] > 0)) return null;
    const ls = 6, tot = ws.reduce((a, b) => a + b, 0) + ls * 5, xs = [];
    let x = 960 - tot / 2;
    ws.forEach(w => { xs.push([x, x + w / 2]); x += w + ls; });
    return { xs, ws };
  }
  function czFocus(name) {
    if (name === 'tok') return [CZ.tx, CZ.ty];
    if (name === 'hole') return [CZ.tx + TK.HOLE.x * CZ.ts, CZ.ty + TK.HOLE.y * CZ.ts];
    if (name === 'O') { const L = czLetters(); return [L ? L.xs[1][1] : 860, CZ.wy]; }
    return [960, 540];
  }
  // camera state at time t: zoom, focus, screen shake
  function czState(t) {
    let i = 0;
    while (i + 1 < CZ_SHOTS.length && t >= CZ_SHOTS[i + 1][0] - CZ.dur) i++;
    const cur = CZ_SHOTS[i], prev = CZ_SHOTS[Math.max(0, i - 1)];
    const ta = cur[0], u = i === 0 ? 1 : clamp((t - (ta - CZ.dur)) / CZ.dur);
    const p = E.ioS(u);
    const l0 = Math.log(prev[1]), l1 = Math.log(cur[1]), f0 = czFocus(prev[2]), f1 = czFocus(cur[2]);
    let lz = lerp(l0, l1, p);
    // focus moves so that the zoom pivots smoothly: interpolate in the zoomed frame
    const z = Math.exp(lz), z0 = prev[1], z1 = cur[1];
    const w = z1 === z0 ? p : clamp((1 / z0 - 1 / z) / (1 / z0 - 1 / z1));
    let fx = lerp(f0[0], f1[0], w), fy = lerp(f0[1], f1[1], w);
    // after arrival: a small bounce in zoom and a decaying shake
    const dt = t - ta, dir = Math.sign(l1 - l0);
    let sx = 0, sy = 0;
    if (i > 0 && dt > 0) {
      lz += dir * 0.06 * Math.exp(-dt * 11) * Math.sin(dt * 34);
      const a = 16 * Math.exp(-dt * 9) * (cur[1] > 1 ? 1 : 0.7);
      sx = a * Math.sin(dt * 61 + i); sy = a * Math.cos(dt * 47 + i * 2);
    }
    if (cur[2] === 'wide' && (i === 0 || dt > 0)) { sx += vnoise(t * 0.7, 3) * 4; sy += vnoise(t * 0.6, 5) * 3; lz += (i === 0 ? t * 0.012 : 0); }
    if (cur[2] === 'wide') lz = Math.max(lz, 0.004);
    return { z: Math.exp(lz), fx, fy, sx, sy, i, u, ta, cur };
  }
  function czWorld(g, z) {
    const L = czLetters();
    g.fillStyle = P.ground; g.fillRect(-200, -200, 2320, 1480);
    g.strokeStyle = P.line; g.lineWidth = 1.2 / Math.sqrt(z); g.beginPath();
    for (let x = -160; x <= 2080; x += 80) { g.moveTo(x, -200); g.lineTo(x, 1280); }
    for (let y = -160; y <= 1240; y += 80) { g.moveTo(-200, y); g.lineTo(2120, y); }
    g.stroke();
    TK.token(g, CZ.tx, CZ.ty, CZ.ts);
    if (L) L.xs.forEach(([x], k) => text(g, TK.WORD[k], x, CZ.wy, { font: FONT, weight: 900, size: CZ.ws, color: P.ink, base: 'middle' }));
  }
  function czStreaks(c, W, H, k, col) {
    if (k <= 0.01) return;
    c.save(); c.fillStyle = col;
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * TAU + hash(i * 3.1) * 0.08, r0 = 470 + hash(i * 7.7) * 260, w = 2 + hash(i * 1.3) * 5;
      const ca = Math.cos(a), sa = Math.sin(a), r1 = 1300;
      c.globalAlpha = k * (0.35 + 0.3 * hash(i * 9.1));
      c.beginPath();
      c.moveTo(960 + ca * r0, 540 + sa * r0);
      c.lineTo(960 + ca * r1 - sa * w * 3, 540 + sa * r1 + ca * w * 3);
      c.lineTo(960 + ca * r1 + sa * w * 3, 540 + sa * r1 - ca * w * 3);
      c.closePath(); c.fill();
    }
    c.restore();
  }
  function czHud(c, W, H, t, s) {
    // viewfinder corners and zoom readout
    c.strokeStyle = 'rgba(23,24,28,0.45)'; c.lineWidth = 2;
    const m = 44, l = 44;
    [[m, m, 1, 1], [W - m, m, -1, 1], [W - m, H - m, -1, -1], [m, H - m, 1, -1]].forEach(([x, y, dx, dy], i) => {
      if (i >= 2) return; // caption and curve live along the bottom
      c.beginPath(); c.moveTo(x, y + dy * l); c.lineTo(x, y); c.lineTo(x + dx * l, y); c.stroke();
    });
    const zt = s.z < 1.01 ? 1 : s.z;
    text(c, `ZOOM ×${zt.toFixed(1)}`, W - 100, 118, { font: MONO, weight: 700, size: 30, color: P.ink, align: 'right' });
    const nm = { wide: 'WIDE', tok: 'TOKEN', hole: 'HOLE', O: 'LETTER O' }[s.cur[2]];
    tag(c, nm, W - 100, 148, { size: 16, align: 'right' });
  }
  function czBracket(c, t, s) {
    // anticipation: one beat before a crash onto a detail, bracket the target and blink it
    for (const ta of [4.0, 6.5]) {
      const d = ta - CZ.dur - t;
      if (d < 0 || d > BEAT + 0.1) continue;
      if (Math.floor((BEAT + 0.1 - d) / 0.12) % 2 === 1 && d > 0.12) continue;
      const shot = CZ_SHOTS.find(q => q[0] === ta), f = czFocus(shot[2]);
      const sx = (f[0] - s.fx) * s.z + 960 + s.sx, sy = (f[1] - s.fy) * s.z + 540 + s.sy;
      const r = (shot[2] === 'hole' ? TK.HOLE.r * CZ.ts * 1.35 : 70) * s.z, l = r * 0.45;
      c.strokeStyle = P.accent; c.lineWidth = 4;
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([dx, dy]) => { const x = sx + dx * r, y = sy + dy * r; c.beginPath(); c.moveTo(x, y - dy * l); c.lineTo(x, y); c.lineTo(x - dx * l, y); c.stroke(); });
      tag(c, CZ_PRE[ta], sx, sy - r - 14, { size: 16, color: P.accentD, align: 'center', weight: 700 });
    }
  }
  const CZ_CURVE = u => Math.log(czState(u * 10).z) / Math.log(9.5);

  MG.film({
    id: 'techcrashzoom', dur: 10, poster: 1.55,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Crash Zoom', sub: 'A sudden snap of the zoom lens', era: '1960s —',
      origin: 'A crash zoom (or snap zoom) racks a zoom lens from wide to tight, or back, in a fraction of a second, so the frame lunges at a detail for shock or comedy. Once zoom lenses became practical it became a staple of 1960s–70s Italian westerns and Hong Kong kung-fu cinema, was revived in homage by Quentin Tarantino, and Edgar Wright made the whip-fast, sound-effected crash zoom a comic signature.',
      works: 'Shaw Brothers kung-fu films (1970s) · Kill Bill: Volume 1 (Quentin Tarantino, 2003) · Shaun of the Dead (Edgar Wright, 2004) · Hot Fuzz (Edgar Wright, 2007)',
      tech: ['Log-space zoom snapped in ~0.14 s', 'Zoom blur along the zoom path', 'Hit, hold and shake on the beat'],
      accent: '#ff5a1f',
      motionDNA: 'Stillness, then violence, then stillness: a calm wide, a snap in that lands exactly on the beat with a jolt of shake, a held close-up, a snap back out. A target bracket blinks a beat before the next crash, telegraphing the joke; the hole fills the frame; a double-take crashes onto a letter twice; the last crash out settles on a held wide.',
      visualDNA: 'The kit stage — warm paper, faint grid, orange Token, ink MOTION — seen through viewfinder corners with a mono zoom readout; zoom-blurred smears and radial manga speed lines during each snap, an orange anticipation bracket on the next target.',
      transitions: 'Hard snap zooms in and out on the beat, each landing with a short shake and settling into a hold',
      implementation: ['Zoom lens racked by hand or motor; a scale keyframe with motion blur in After Effects', 'Canvas transform about the focus point; zoom interpolated in log space', 'Offscreen frame re-composited along the zoom path for blur'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { buf: offscreen(1920, 1080) }; },
    draw(c, t, W, H, st) {
      const s = czState(t), g = st.buf.getContext('2d');
      const render = (q, ctx) => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(960 + q.sx, 540 + q.sy); ctx.scale(q.z, q.z); ctx.translate(-q.fx, -q.fy);
        czWorld(ctx, q.z);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      };
      const back = czState(t - 0.05), moving = Math.abs(Math.log(s.z) - Math.log(back.z)) > 0.03 || Math.hypot(s.fx - back.fx, s.fy - back.fy) * s.z > 20;
      if (!moving) {
        c.save(); c.translate(960 + s.sx, 540 + s.sy); c.scale(s.z, s.z); c.translate(-s.fx, -s.fy);
        czWorld(c, s.z); c.restore();
      } else {
        render(s, g);
        c.drawImage(st.buf, 0, 0);
        const N = 16;
        for (let k = 1; k <= N; k++) {
          const q = czState(t - (k / N) * 0.05), r = q.z / s.z;
          // screen of now → screen at time t - k·dt
          const ox = -(960 + s.sx) * r + (s.fx - q.fx) * q.z + 960 + q.sx, oy = -(540 + s.sy) * r + (s.fy - q.fy) * q.z + 540 + q.sy;
          c.save(); c.globalAlpha = 1 / (k + 1);
          c.translate(ox, oy); c.scale(r, r); c.drawImage(st.buf, 0, 0);
          c.restore();
        }
      }
      // speed lines: strongest through the snap, fading over a beat after landing
      if (s.i > 0) {
        const dt = t - s.ta, into = s.cur[1] > CZ_SHOTS[s.i - 1][1];
        const k = dt < 0 ? E.inQ(s.u) : Math.exp(-dt * 7);
        czStreaks(c, W, H, k * (into ? 1 : 0.6), into ? P.ink : P.mute);
      }
      czBracket(c, t, s);
      // when the frame is filled with Token or ink, a paper scrim keeps the readouts legible
      const sk = clamp((s.z - 4) / 2) * 0.86;
      if (sk > 0.01) {
        c.save(); c.globalAlpha = sk; c.fillStyle = P.ground;
        MG.rrect(c, 50, H - 196, 620, 168, 14); c.fill();
        MG.rrect(c, W - 72 - 240 - 18, H - 52 - 120 - 40, 276, 178, 14); c.fill();
        MG.rrect(c, W - 340, 80, 262, 84, 14); c.fill();
        c.restore();
      }
      czHud(c, W, H, t, s);
      TK.caption(c, t, W, H, { name: 'Crash Zoom', cat: 'Camera', curve: CZ_CURVE, span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'ZOOM / TIME' });
    },
    score(A) {
      TK.bed(A);
      CZ_SHOTS.slice(1).forEach(([ta, z], i) => {
        const pz = CZ_SHOTS[i][1], into = z > pz;
        if (into) {
          A.whoosh(ta - 0.24, 0.27, { f1: 500, f2: 6500, q: 1.2, g: 0.32, swell: 0.9, rev: 0.15 });
          A.osc(ta - 0.2, { type: 'sawtooth', f: 180, f2: 900, glide: 0.2, dur: 0.21, g: 0.04, lp: 2500 });
          A.kick(ta, 0.42, { f: 140, f2: 42 });
          A.snare(ta, 0.22, { f: 1600, dur: 0.18, rev: 0.25 });
          A.impact(ta, z > 5 ? 0.22 : 0.14, { rev: 0.4 });
        } else {
          A.whoosh(ta - 0.24, 0.3, { f1: 5500, f2: 350, q: 1.2, g: 0.26, swell: 0.75, rev: 0.2 });
          A.kick(ta, 0.3, { f: 95, f2: 38 });
          A.hat(ta, 0.06, true);
        }
      });
      // anticipation blips under the blinking bracket
      [4.0, 6.5].forEach(ta => { [0, 0.24].forEach(d => A.osc(ta - CZ.dur - BEAT + 0.1 + d, { type: 'square', f: 1760, dur: 0.06, g: 0.025, lp: 4000 })); });
      // the double-take gets a comic boing
      A.osc(7.0, { type: 'triangle', f: 300, f2: 620, glide: 0.18, dur: 0.4, g: 0.06, vib: [16, 30] });
      // settle on the wide
      A.chord(8.0, [60, 64, 67, 72], { type: 'triangle', dur: 1.6, g: 0.04, a: 0.05, lp: 2400, width: 0.8, rev: 0.5 });
      A.bell(8.5, midi(84), { g: 0.05, dur: 1.4, rev: 0.5 });
    },
  });
})();
