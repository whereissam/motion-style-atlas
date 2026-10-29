/* batch h15 — Cinematic film language and a regional style: Bullet Time · Dolly Zoom · Byzantine Mosaic.
   bullettime (Gondry's camera arrays, The Matrix: a frozen moment the camera can walk around) ·
   dollyzoom (Vertigo, Jaws, Goodfellas: track one way, zoom the other) ·
   mosaic (Ravenna and Constantinople: tesserae set in flowing rows over glinting gold glass). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;800&family=Share+Tech+Mono&family=Bebas+Neue&family=IBM+Plex+Mono:wght@500&family=Cinzel:wght@500;700&display=block');
  const PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
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
  const fillPoly3 = (c, cam, pts, col) => { const q = clipProj(cam, pts); if (!q) return null; poly(c, q); c.fillStyle = col; c.fill(); return q; };
  function line3(c, cam, a, b, near = 0.06) {
    let da = cam.depth(a), db = cam.depth(b);
    if (da < near && db < near) return;
    if (da < near) { const u = (near - da) / (db - da); a = [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; }
    else if (db < near) { const u = (near - db) / (da - db); b = [lerp(b[0], a[0], u), lerp(b[1], a[1], u), lerp(b[2], a[2], u)]; }
    const p = cam.P(a), q = cam.P(b); if (!p || !q) return;
    c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]);
  }

  /* =====================================================================
     BULLET TIME — a rooftop under a green overcast sky, rain falling. A
     figure in a long coat throws himself backward as three bullets come in
     from off-screen; the world decelerates to a crawl just as he reaches
     the bottom of the lean. Time all but stops: raindrops hang as beads,
     a puddle's splash crown and concrete chips from an earlier hit float,
     and each bullet drags rings of displaced air behind it. Only the camera
     is free — it sweeps more than 180° around him (the HUD counts the still
     cameras of the array as it goes). Then time snaps back to speed: the
     bullets whip past into the pillar, rain streaks again, he drops onto
     his hand, and the title holds in the letterbox.
     ===================================================================== */
  const BT = {
    skyT: '#71887b', skyM: '#adbfac', skyH: '#d9e2cf', sun: '#f2f0d6', haze: '#97a996', far: '#86998a', city: '#6d8072', cityD: '#4d5f53',
    roof: '#57635b', roofL: '#6c796f', roofD: '#2b342e', puddle: '#9fb3a3', conc: '#8c9489', concL: '#a7aea1', concD: '#5c645b', box: '#66726a', boxD: '#434d46',
    coat: '#0a0e0d', coatH: '#25302b', pants: '#121715', skin: '#c0a48a', hair: '#15110e', lens: '#030605',
    lead: '#d9b65e', leadD: '#6f511b', ring: '#eef7ee', chip: '#b1b8ab', rain: '#eef6ee',
    hud: '#9df5b6', bar: '#040605',
  };
  const BT_T = { slow: [0.7, 1.7], orbit: [1.45, 7.2], snap: [7.25, 7.55], flash: 7.55, title: 8.3 };
  const BT_SLOW = 0.022, BT_V = 9, BT_REF = 1.03, BT_BAR = 132;   // crawl speed, bullet speed (m per action second), reference action time, letterbox
  const BT_COL = [-3.15, -2.45, 0, 3.4, -0.35, 0.35];                // the concrete pillar behind him: x0 x1 y0 y1 z0 z1
  const BT_BUL = [[1.5, 1.12, 0.12], [0.4, 1.26, -0.1], [-0.5, 1.06, 0.2]];   // x at the reference time, height, depth
  function btSpeed(t) {
    if (t < BT_T.slow[0]) return 1;
    if (t < BT_T.slow[1]) return lerp(1, BT_SLOW, E.outC(seg(t, BT_T.slow[0], BT_T.slow[1])));
    if (t < BT_T.snap[0]) return BT_SLOW;
    return lerp(BT_SLOW, 1, E.inQ(seg(t, BT_T.snap[0], BT_T.snap[1])));
  }
  // action clock = the integral of the speed ramp, recomputed from zero so any frame stands alone
  function btTau(t) {
    const n = Math.max(1, Math.ceil(t * 120)), dt = t / n;
    let s = 0; for (let i = 0; i < n; i++) s += btSpeed((i + 0.5) * dt) * dt;
    return s;
  }
  const btOrbit = t => E.ioS(seg(t, BT_T.orbit[0], BT_T.orbit[1]));
  function btCam(t, tau) {
    const th = kf(t, [[0, -0.62], [1.45, -0.42, E.lin], [7.2, 3.1, E.ioS], [10, 3.45, E.outC]]);
    const R = kf(t, [[0, 5.3], [1.45, 4.3, E.outQ], [4.3, 3.25], [7.2, 3.8], [10, 4.5, E.outC]]);
    const h = kf(t, [[0, 1.45], [1.45, 1.2], [4.3, 1.5], [7.2, 0.85], [10, 1.3]]);
    const ty = kf(t, [[0, 1.0], [1.6, 0.76], [7.4, 0.72], [8.6, 0.42]]);
    const sp = btSpeed(t), hit = Math.exp(-Math.pow((t - 7.62) / 0.12, 2));
    const sh = 0.035 * sp * (t < 2 ? 1 : 1.6) + 0.06 * hit;
    const T = [-0.32 + sh * vnoise(t * 8, 1), ty + sh * vnoise(t * 9, 2), sh * vnoise(t * 7, 3)];
    const C = [T[0] + R * Math.sin(th), h + sh * vnoise(t * 6, 4), R * Math.cos(th)];
    return lookAt(C, T, kf(t, [[0, 1100], [1.6, 1200], [4.3, 1080], [7.2, 1180], [10, 1120]]));
  }
  // two-bone IK in the sagittal plane: knee bends forward (+x)
  function btIK(A, H, l) {
    const dx = H[0] - A[0], dy = H[1] - A[1], d = Math.min(Math.hypot(dx, dy), 2 * l - 1e-3), h = Math.sqrt(Math.max(0, l * l - d * d / 4));
    const ux = dx / (Math.hypot(dx, dy) || 1), uy = dy / (Math.hypot(dx, dy) || 1);
    const mx = A[0] + ux * d / 2, my = A[1] + uy * d / 2;
    const k1 = [mx + uy * h, my - ux * h], k2 = [mx - uy * h, my + ux * h];
    return k1[0] > k2[0] ? k1 : k2;
  }
  // the figure's joints at action time tau (feet on the roof, body arching back, then dropping onto one hand)
  function btPose(tau) {
    const L = E.ioS(seg(tau, 0.22, 0.95)) + 0.06 * seg(tau, 0.95, 1.12), D = E.ioS(seg(tau, 1.2, 1.62));
    const at = (o, a, l) => [o[0] + Math.sin(a) * l, o[1] + Math.cos(a) * l];
    const A1 = [0.02 - 0.06 * D, 0.07], A2 = [0.3 + 0.05 * L, 0.07];
    const K1 = at(A1, lerp(0.06, 0.6, L) + 0.4 * D, 0.47);
    const H = at(K1, lerp(-0.04, -0.98, L) - 0.5 * D, 0.47);
    const K2 = btIK(A2, H, 0.47);
    const ta = lerp(-0.08, -1.3, L) - 0.22 * D;
    const S = at(H, ta, 0.56), N = at(S, ta * 1.04, 0.09), Hd = at(S, ta * 1.07, 0.21);
    const fd = [Math.cos(ta * 1.07), -Math.sin(ta * 1.07)];
    const arms = [[0.2, lerp(-2.7, -1.75, L) + 0.22 * Math.sin(tau * 4.3) * L - 0.85 * D, lerp(0.15, 0.45, L) - 0.3 * D], [-0.2, lerp(2.8, 0.25, L) + 0.3 * Math.sin(tau * 3.1 + 1) * L, lerp(-0.1, 0.7, L)]].map(([z, ua, b]) => {
      const El = at(S, ua, 0.3), Hn = at(El, ua + b, 0.28); Hn[1] = Math.max(0.035, Hn[1]);
      return { z, El, Hn };
    });
    return { L, D, A1, A2, K1, K2, H, S, N, Hd, fd, arms };
  }

  function btBox(c, cam, b, cols) {
    const [x0, x1, y0, y1, z0, z1] = b, C = cam.C;
    const faces = [
      [[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], C[0] > x1, cols[0]], [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], C[0] < x0, cols[1]],
      [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], C[2] > z1, cols[2]], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], C[2] < z0, cols[3]],
      [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], C[1] > y1, cols[4]],
    ];
    faces.forEach(f => { if (f[4]) fillPoly3(c, cam, f.slice(0, 4), f[5]); });
  }

  function btWorld(c, t, cam, st) {
    const C = cam.C, fh = norm3([cam.f[0], 0, cam.f[2]]);
    const hz = cam.P([C[0] + fh[0] * 2000, C[1], C[2] + fh[2] * 2000]), hy = hz ? hz[1] : 540;
    const sg = c.createLinearGradient(0, hy - 900, 0, hy + 40);
    sg.addColorStop(0, BT.skyT); sg.addColorStop(0.7, BT.skyM); sg.addColorStop(1, BT.skyH);
    c.fillStyle = sg; c.fillRect(-300, -300, 2520, 1680);
    // the sun burning through the overcast, and torn clouds fixed on the sky dome
    const sun = cam.P([C[0] + Math.cos(2.3) * 900, C[1] + 260, C[2] + Math.sin(2.3) * 900]);
    if (sun) { const g = c.createRadialGradient(sun[0], sun[1], 0, sun[0], sun[1], 620); g.addColorStop(0, 'rgba(246,244,220,0.85)'); g.addColorStop(0.15, 'rgba(240,240,214,0.35)'); g.addColorStop(1, 'rgba(240,240,214,0)'); c.fillStyle = g; c.fillRect(-300, -300, 2520, 1680); }
    st.clouds.forEach(([a, el, w, h, al]) => {
      const p = cam.P([C[0] + Math.cos(a) * 800, C[1] + el * 800, C[2] + Math.sin(a) * 800]); if (!p) return;
      const s = cam.F / p[2] * 800 / 1000;
      c.save(); c.translate(p[0], p[1]); c.scale(w * s, h * s);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, `rgba(226,232,216,${al})`); g.addColorStop(1, 'rgba(226,232,216,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, TAU); c.fill(); c.restore();
    });
    // the street far below in haze, then the skyline ring
    fillPoly3(c, cam, [[-600, -28, -600], [600, -28, -600], [600, -28, 600], [-600, -28, 600]], BT.haze);
    st.city.slice().sort((a, b) => Math.hypot(b.x - C[0], b.z - C[2]) - Math.hypot(a.x - C[0], a.z - C[2])).forEach(b => {
      const pts = []; let ok = true;
      for (const x of [b.x - b.w, b.x + b.w]) for (const y of [-28, b.h]) for (const z of [b.z - b.d, b.z + b.d]) { const p = cam.P([x, y, z]); if (!p || p[2] < 1) { ok = false; break; } pts.push(p); }
      if (!ok) return;
      const hl = hull(pts), fog = clamp((Math.hypot(b.x - C[0], b.z - C[2]) - 18) / 50);
      poly(c, hl); c.fillStyle = mixc(b.dark ? BT.cityD : BT.city, BT.haze, fog * 0.8); c.fill();
      // window bands
      c.save(); c.clip(); c.fillStyle = `rgba(210,226,205,${0.12 * (1 - fog)})`;
      for (let y = -24; y < b.h; y += 2.4) { const p = cam.P([b.x, y, b.z]); if (p) c.fillRect(p[0] - 400, p[1], 800, Math.max(1, cam.F / p[2] * 0.5)); }
      c.restore();
    });
    // roof deck, wet: tiles, the puddle, a parapet, a stair housing and AC units
    fillPoly3(c, cam, [[-9, 0, -9], [9, 0, -9], [9, 0, 9], [-9, 0, 9]], BT.roof);
    c.beginPath();
    for (let k = -9; k <= 9; k++) { line3(c, cam, [k, 0.001, -9], [k, 0.001, 9]); line3(c, cam, [-9, 0.001, k], [9, 0.001, k]); }
    c.strokeStyle = 'rgba(25,34,29,0.45)'; c.lineWidth = 1.6; c.stroke();
    const pud = []; for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; pud.push([0.05 + Math.cos(a) * (1.25 + 0.12 * Math.sin(a * 3)), 0.002, 0.1 + Math.sin(a) * (0.85 + 0.08 * Math.cos(a * 5))]); }
    const pq = fillPoly3(c, cam, pud, BT.puddle);
    if (pq) { c.save(); c.clip(); c.fillStyle = 'rgba(230,238,222,0.25)'; c.fillRect(-300, hy - 40, 2520, 120); c.restore(); }
    [[8.7, 9, -9, 9], [-9, -8.7, -9, 9], [-9, 9, 8.7, 9], [-9, 9, -9, -8.7]].forEach(([x0, x1, z0, z1]) => btBox(c, cam, [x0, x1, 0, 0.95, z0, z1], [BT.concD, BT.concD, BT.conc, BT.conc, BT.concL]));
    st.props.forEach(b => btBox(c, cam, b, [BT.box, BT.boxD, BT.box, BT.boxD, mixc(BT.box, BT.concL, 0.4)]));
    btBox(c, cam, BT_COL, [BT.conc, BT.concD, BT.concL, BT.concD, BT.concL]);
    return hy;
  }
  function hull(pts) {
    const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    p.forEach(q => { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); });
    p.slice().reverse().forEach(q => { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); });
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }

  // everything that moves on action time, depth-sorted together: the figure, bullets, air rings, chips, droplets
  function btAction(c, t, tau, cam, st) {
    const sp = btSpeed(t), F = cam.F, items = [], J = btPose(tau);
    const P3 = (p, z) => [p[0], p[1], z];
    // limbs are round-capped strokes; cloth gets a cool sheen along its upper edge from the overcast sky
    const stroke = (a, b, w, col, sheen = 0) => {
      const pa = cam.P(a), pb = cam.P(b); if (!pa || !pb) return;
      items.push([(pa[2] + pb[2]) / 2, () => {
        const lw = w * F / ((pa[2] + pb[2]) / 2);
        c.lineWidth = lw; c.strokeStyle = col; c.beginPath(); c.moveTo(pa[0], pa[1]); c.lineTo(pb[0], pb[1]); c.stroke();
        if (sheen) { c.lineWidth = lw * 0.28; c.strokeStyle = `rgba(150,184,160,${sheen})`; c.beginPath(); c.moveTo(pa[0], pa[1] - lw * 0.3); c.lineTo(pb[0], pb[1] - lw * 0.3); c.stroke(); }
      }]);
    };
    const face = (pts, col) => {
      const q = pts.map(p => cam.P(p)); if (q.some(p => !p)) return;
      items.push([q.reduce((s, p) => s + p[2], 0) / q.length + 0.05, () => { poly(c, q); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(120,150,130,0.35)'; c.lineWidth = 1.5; c.stroke(); }]);
    };
    // shadow pooled under him
    const shp = []; for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; shp.push([lerp(-0.3, -0.45, J.L) + Math.cos(a) * lerp(0.35, 0.9, J.L), 0.004, Math.sin(a) * 0.42]); }
    const sq = clipProj(cam, shp); if (sq) { poly(c, sq); c.fillStyle = 'rgba(15,22,18,0.32)'; c.fill(); }
    // long coat: two side panels and a back panel, hem fluttering on action time
    const fl = k => 0.07 * vnoise(tau * 2.6 + k, 7);
    const hemB = [J.S[0] - 0.22 * J.L - 0.08 + fl(1), Math.max(0.04, J.S[1] - 1.12 + fl(2))], hemF = [J.H[0] + 0.22 - 0.06 * J.L + fl(3), Math.max(0.04, J.H[1] - 0.66 + fl(4))];
    const hemM = [lerp(hemB[0], hemF[0], 0.5) + fl(5), Math.max(0.04, lerp(hemB[1], hemF[1], 0.5) + 0.06 + fl(6))];
    [1, -1].forEach(sd => face([P3(J.S, 0.17 * sd), P3(J.H, 0.18 * sd), P3(hemF, 0.27 * sd), P3(hemM, 0.29 * sd), P3(hemB, 0.27 * sd)], sd > 0 ? BT.coatH : BT.coat));
    face([P3(J.S, 0.17), P3(hemB, 0.27), P3(hemB, -0.27), P3(J.S, -0.17)], mixc(BT.coat, BT.coatH, 0.45));
    // legs, torso, arms
    [[J.A1, J.K1, 0.11], [J.A2, J.K2, -0.11]].forEach(([A, K, z]) => {
      stroke(P3(J.H, z * 0.9), P3(K, z), 0.15, BT.pants, 0.3); stroke(P3(K, z), P3(A, z), 0.12, BT.pants, 0.3);
      stroke(P3(A, z), [A[0] + 0.2, 0.04, z], 0.08, '#050706');
    });
    stroke(P3(J.H, 0), P3(J.S, 0), 0.34, BT.coat, 0.35);
    stroke(P3(J.S, 0), P3(J.N, 0), 0.1, BT.skin);
    J.arms.forEach(a => {
      stroke(P3(J.S, a.z), P3(a.El, a.z * 1.35), 0.11, BT.coat, 0.35); stroke(P3(a.El, a.z * 1.35), P3(a.Hn, a.z * 1.6), 0.09, BT.coat, 0.35);
      const dx = a.Hn[0] - a.El[0], dy = a.Hn[1] - a.El[1], l = Math.hypot(dx, dy) || 1;
      stroke(P3(a.Hn, a.z * 1.6), [a.Hn[0] + dx / l * 0.07, Math.max(0.03, a.Hn[1] + dy / l * 0.07), a.z * 1.65], 0.075, BT.skin);
    });
    // head: hair to the back of the skull, dark glasses only while the face turns toward the lens
    const hd = [J.Hd[0], J.Hd[1], 0], ph = cam.P(hd);
    if (ph) items.push([ph[2] - 0.05, () => {
      const r = 0.115 * F / ph[2], fd = [J.fd[0], J.fd[1], 0], pb = cam.P([hd[0] - fd[0] * 0.06, hd[1] - fd[1] * 0.06, 0]);
      c.fillStyle = BT.skin; c.beginPath(); c.arc(ph[0], ph[1], r, 0, TAU); c.fill();
      if (pb) { c.save(); c.beginPath(); c.arc(ph[0], ph[1], r, 0, TAU); c.clip(); c.fillStyle = BT.hair; c.beginPath(); c.arc(lerp(ph[0], pb[0], 0.9), lerp(ph[1], pb[1], 0.9), r * 0.98, 0, TAU); c.fill(); c.restore(); }
      const toC = norm3(sub3(cam.C, hd)), fc = dot3(fd, toC);
      if (fc > -0.15) {
        c.fillStyle = BT.lens; c.globalAlpha = clamp((fc + 0.15) * 3);
        [-1, 1].forEach(s => { const q = cam.P([hd[0] + fd[0] * 0.105, hd[1] + fd[1] * 0.105, s * 0.042]); if (q) { c.beginPath(); c.ellipse(q[0], q[1], r * 0.28, r * 0.2, 0, 0, TAU); c.fill(); } });
        const q = cam.P([hd[0] + fd[0] * 0.11, hd[1] + fd[1] * 0.11, 0.01]); if (q) { c.fillStyle = 'rgba(220,240,226,0.5)'; c.beginPath(); c.arc(q[0] - r * 0.1, q[1] - r * 0.05, r * 0.06, 0, TAU); c.fill(); }
        c.globalAlpha = 1;
      }
    }]);
    // bullets: slug, heat streak and rings of displaced air left in the world behind it
    BT_BUL.forEach(([a, y, z], bi) => {
      const xb = a - BT_V * (tau - BT_REF);
      if (xb < BT_COL[1] || xb > 14) return;
      const nose = cam.P([xb - 0.03, y, z]), tail = cam.P([xb + 0.03, y, z]); if (!nose || !tail) return;
      const blur = BT_V * sp * 0.035;
      const st0 = cam.P([xb + 0.03 + blur + 1.3, y, z]);
      if (st0) items.push([tail[2] + 0.01, () => {
        const g = c.createLinearGradient(tail[0], tail[1], st0[0], st0[1]); g.addColorStop(0, 'rgba(240,248,238,0.5)'); g.addColorStop(1, 'rgba(240,248,238,0)');
        c.strokeStyle = g; c.lineWidth = Math.max(1, 0.01 * F / tail[2]); c.beginPath(); c.moveTo(tail[0], tail[1]); c.lineTo(st0[0], st0[1]); c.stroke();
      }]);
      items.push([nose[2], () => {
        const w = Math.max(2.5, 0.017 * F / nose[2]), tb = cam.P([xb + 0.03 + blur, y, z]) || tail;
        c.lineCap = 'round'; c.strokeStyle = BT.leadD; c.lineWidth = w; c.beginPath(); c.moveTo(nose[0], nose[1]); c.lineTo(tb[0], tb[1]); c.stroke();
        c.strokeStyle = BT.lead; c.lineWidth = w * 0.55; c.beginPath(); c.moveTo(nose[0], nose[1] - w * 0.12); c.lineTo(tb[0], tb[1] - w * 0.12); c.stroke();
      }]);
      for (let k = Math.ceil(xb / 0.11) + 1; k * 0.11 < xb + 1.6; k++) {
        const xr = k * 0.11, age = (xr - xb) / BT_V, rr = 0.02 + 0.8 * Math.sqrt(age) * 0.2 + age * 0.3, al = (1 - (xr - xb) / 1.6) * 0.55;
        const pts = []; let bad = false;
        for (let i = 0; i < 18; i++) { const an = i / 18 * TAU, q = cam.P([xr, y + Math.cos(an) * rr, z + Math.sin(an) * rr]); if (!q) { bad = true; break; } pts.push(q); }
        if (bad) continue;
        const zc = pts.reduce((s, p) => s + p[2], 0) / pts.length;
        items.push([zc, () => { poly(c, pts); c.strokeStyle = `rgba(238,247,238,${al * clamp(1.3 - sp)})`; c.lineWidth = Math.max(1, 0.007 * F / zc); c.stroke(); c.fillStyle = `rgba(238,247,238,${al * 0.08})`; c.fill(); }]);
      }
    });
    // concrete chips and dust from earlier hits and the new ones
    st.chips.forEach(ch => {
      const dt = tau - ch.t0; if (dt < 0) return;
      const tg = (ch.v[1] + Math.sqrt(ch.v[1] * ch.v[1] + 2 * 9.8 * (ch.p[1] - 0.02))) / 9.8, de = Math.min(dt, tg);
      const p = [ch.p[0] + ch.v[0] * de, Math.max(0.02, ch.p[1] + ch.v[1] * de - 4.9 * de * de), ch.p[2] + ch.v[2] * de], q = cam.P(p); if (!q) return;
      items.push([q[2], () => {
        const s = ch.s * F / q[2], an = ch.w * de;
        c.save(); c.translate(q[0], q[1]); c.rotate(an); c.scale(s, s * (0.55 + 0.45 * Math.abs(Math.cos(an * 1.3))));
        poly(c, ch.shape); c.fillStyle = ch.dark ? BT.concD : BT.chip; c.fill(); c.restore();
      }]);
    });
    st.puffs.forEach(([x, y, z, t0]) => {
      const dt = tau - t0; if (dt < 0 || dt > 2.5) return;
      const q = cam.P([x + dt * 0.5, y + dt * 0.1, z]); if (!q) return;
      items.push([q[2] + 0.2, () => {
        const r = (0.12 + 0.55 * Math.sqrt(dt)) * F / q[2], g = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], r);
        g.addColorStop(0, `rgba(196,202,190,${0.55 * (1 - dt / 2.5)})`); g.addColorStop(1, 'rgba(196,202,190,0)');
        c.fillStyle = g; c.beginPath(); c.arc(q[0], q[1], r, 0, TAU); c.fill();
      }]);
    });
    // the splash crown kicked up from the puddle by his back foot
    st.splash.forEach(d => {
      const dt = tau - 0.8; if (dt < 0) return;
      const y = d.p[1] + d.v[1] * dt - 4.9 * dt * dt; if (y < 0.005) return;
      const p = [d.p[0] + d.v[0] * dt, y, d.p[2] + d.v[2] * dt], q = cam.P(p); if (!q) return;
      items.push([q[2], () => btDrop(c, q, d.r * F / q[2], BT_V * 0 + sp * d.v[1] * 0.035 * F / q[2])]);
    });
    items.sort((a, b) => b[0] - a[0]);
    c.lineCap = 'round';
    items.forEach(it => it[1]());
    c.lineCap = 'butt';
  }
  // a water bead: dark rim, bright core, a speck of sky; becomes a streak when time runs
  function btDrop(c, q, r, streak) {
    r = Math.max(1.1, r);
    if (streak > 3) { c.strokeStyle = 'rgba(232,242,232,0.55)'; c.lineWidth = r * 1.1; c.beginPath(); c.moveTo(q[0], q[1] - streak); c.lineTo(q[0], q[1]); c.stroke(); return; }
    c.fillStyle = 'rgba(60,78,66,0.55)'; c.beginPath(); c.arc(q[0], q[1], r, 0, TAU); c.fill();
    c.fillStyle = 'rgba(236,244,234,0.85)'; c.beginPath(); c.arc(q[0], q[1], r * 0.72, 0, TAU); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(q[0] - r * 0.3, q[1] - r * 0.3, r * 0.28, 0, TAU); c.fill();
  }
  function btRain(c, t, tau, cam, st, near) {
    const sp = btSpeed(t), zf = cam.depth([-0.3, 0.7, 0]);
    c.lineCap = 'round';
    st.rain.forEach(([x, y0, z]) => {
      const y = ((y0 - 6.8 * tau) % 4.8 + 4.8) % 4.8, p = [x + 0.12 * y, y, z], q = cam.P(p);
      if (!q || q[2] < 0.35 || (q[2] < zf) !== near) return;
      const len = 6.8 * sp * 0.04, q2 = cam.P([p[0] + 0.12 * len, y + len, z]);
      const sl = q2 ? Math.hypot(q2[0] - q[0], q2[1] - q[1]) : 0, r = 0.0075 * cam.F / q[2];
      if (sl > 3) { c.strokeStyle = `rgba(232,242,232,${clamp(0.5 / Math.sqrt(q[2]) + 0.1)})`; c.lineWidth = Math.max(1, r); c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q2[0], q2[1]); c.stroke(); }
      else btDrop(c, q, r, 0);
    });
    c.lineCap = 'butt';
  }

  MG.film({
    id: 'bullettime', dur: 10, poster: 3.4,
    fonts: [['800 150px "Barlow Condensed"', 'BULLET TIME'], ['500 34px "Barlow Condensed"', 'Time frozen, camera free'], ['400 26px "Share Tech Mono"', 'CAM 0123456789 / SPEED × ACTION s ARRAY']],
    meta: {
      family: 'H', name: 'Bullet Time', sub: 'Frozen time, moving camera', era: '1995 —',
      origin: 'Bullet time stops or nearly stops a moment of action while the camera keeps moving through it, so the audience can circle a bullet in flight. Michel Gondry staged camera-array shots in the Rolling Stones’ “Like a Rolling Stone” video (1995) and a Smirnoff commercial (1996), after Tim Macmillan’s time-slice experiments; The Matrix (1999), with John Gaeta as visual effects supervisor, fired an arc of still cameras in sequence, filled the gaps with interpolated frames and virtual backgrounds, and made the term famous.',
      works: 'Like a Rolling Stone, The Rolling Stones (music video, Michel Gondry, 1995) · Smirnoff commercial (Michel Gondry, 1996) · The Matrix (Lana & Lilly Wachowski, 1999; visual effects supervisor John Gaeta) · Max Payne (Remedy Entertainment, 2001, game) · The Matrix Reloaded (Wachowskis, 2003)',
      tech: ['Camera orbit, clock stopped', 'Ripple-ring bullet wakes', 'Speed ramp and snap-back'],
      accent: '#6fe39a',
      motionDNA: 'Real-time action ramps down to a crawl in a second; then nothing moves but the camera, which sweeps more than half a circle around the frozen subject on one smooth eased arc. Bullets creep forward a few centimetres, rain hangs as beads. Time snaps back to full speed with a jolt and everything that was suspended completes its motion at once.',
      visualDNA: 'A green-tinted overcast rooftop, a figure in a long black coat and dark glasses bent backward almost flat, brass slugs dragging rings of rippled air, suspended raindrops, a splash crown and concrete chips, a skyline that wheels past behind; a 2.39:1 letterbox carrying a camera-array counter and a speed readout.',
      transitions: 'Speed ramp into a freeze, a continuous virtual-camera orbit, snap back to real time with a single light flash',
      implementation: ['An arc of still cameras triggered in sequence, plus interpolated frames and virtual backgrounds', 'Pseudo-3D projection in Canvas 2D with a depth-sorted scene', 'Action clock integrated from a speed curve'],
      reproducibility: 'Fully procedural homage',
      loopable: false,
    },
    setup() {
      const r = rng(1999), st = {};
      st.rain = Array.from({ length: 460 }, () => { const a = r() * TAU, d = 0.6 + Math.sqrt(r()) * 5.5; return [Math.cos(a) * d - 0.3, r() * 4.8, Math.sin(a) * d]; });
      st.clouds = Array.from({ length: 22 }, () => [r() * TAU, 0.08 + r() * 0.45, 140 + r() * 260, 40 + r() * 60, 0.35 + r() * 0.4]);
      st.city = Array.from({ length: 44 }, (_, i) => { const a = i / 44 * TAU + r() * 0.1, d = 24 + r() * 40; return { x: Math.cos(a) * d, z: Math.sin(a) * d, w: 2 + r() * 4, d: 2 + r() * 4, h: -6 + r() * 26 + (r() < 0.15 ? 18 : 0), dark: r() < 0.4 }; });
      st.props = [[-7.4, -5.2, 0, 2.6, -7.6, -5.6], [3.8, 5.4, 0, 1.1, -6.2, -5.0], [5.6, 6.6, 0, 0.9, 3.0, 4.4], [-6.6, -5.4, 0, 1.2, 4.6, 5.8]];
      const shape = () => { const n = 5 + (r() * 3 | 0), p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU + r() * 0.5; p.push([Math.cos(a) * (0.6 + r() * 0.5), Math.sin(a) * (0.6 + r() * 0.5)]); } return p; };
      st.chips = []; st.puffs = [];
      // an earlier bullet already hit the pillar: its debris hangs in the air
      const burst = (p, t0, n, sp) => {
        st.puffs.push([p[0] + 0.05, p[1], p[2], t0]);
        for (let i = 0; i < n; i++) st.chips.push({ p: p.slice(), t0, v: [0.8 + r() * sp, -0.8 + r() * 3.4, (r() - 0.5) * 3.2], w: (r() - 0.5) * 24, s: 0.012 + r() * 0.03, dark: r() < 0.3, shape: shape() });
      };
      burst([BT_COL[1] + 0.01, 1.4, 0.06], 0.72, 34, 4.2);
      BT_BUL.forEach(([a, y, z]) => burst([BT_COL[1] + 0.01, y, z], BT_REF + (a - BT_COL[1]) / BT_V, 16, 5));
      st.splash = Array.from({ length: 30 }, (_, i) => { const a = i / 30 * TAU + r() * 0.2, s = 0.5 + r() * 0.9; return { p: [0.32 + Math.cos(a) * 0.12, 0.02, -0.12 + Math.sin(a) * 0.12], v: [Math.cos(a) * s + 0.3, 1.6 + r() * 1.8, Math.sin(a) * s], r: 0.006 + r() * 0.01 }; });
      return st;
    },
    draw(c, t, W, H, st) {
      const tau = btTau(t), sp = btSpeed(t), cam = btCam(t, tau);
      c.save(); c.translate(960, 540); c.rotate(kf(t, [[0, 0.02], [4.3, -0.04], [7.2, 0.03], [10, 0.0]])); c.translate(-960, -540);
      btWorld(c, t, cam, st);
      btRain(c, t, tau, cam, st, false);
      btAction(c, t, tau, cam, st);
      btRain(c, t, tau, cam, st, true);
      c.restore();
      // green grade, and the camera-array stutter: each still camera exposes a hair differently
      c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(178,214,184,0.55)'; c.fillRect(0, 0, W, H); c.restore();
      const o = btOrbit(t), camN = 1 + Math.round(o * 119);
      if (o > 0 && o < 1) { c.fillStyle = `rgba(0,0,0,${0.025 * hash(camN * 3.7)})`; c.fillRect(0, 0, W, H); }
      vignette(c, W, H, 0.5, '8,14,10');
      grain(c, W, H, t, 0.05);
      // time resumes: one flash
      const fl = seg(t, BT_T.flash, BT_T.flash + 0.16);
      if (fl > 0 && fl < 1) { c.fillStyle = `rgba(240,255,240,${0.32 * (1 - fl)})`; c.fillRect(0, 0, W, H); }
      // title over the landed figure
      const tt = E.outC(seg(t, BT_T.title, BT_T.title + 0.7));
      if (tt > 0) {
        const g = c.createLinearGradient(0, 140, 0, 440); g.addColorStop(0, 'rgba(4,8,6,0)'); g.addColorStop(0.5, `rgba(4,8,6,${0.5 * tt})`); g.addColorStop(1, 'rgba(4,8,6,0)');
        c.fillStyle = g; c.fillRect(0, 140, W, 300);
        c.save(); c.globalAlpha = tt;
        text(c, 'BULLET TIME', 960 + (1 - tt) * 60, 335, { font: '"Barlow Condensed"', weight: 800, size: 150, align: 'center', color: '#eef6ee', ls: 26 });
        text(c, 'Time frozen, camera free', 960, 393, { font: '"Barlow Condensed"', weight: 500, size: 34, align: 'center', color: BT.hud, ls: 8 });
        c.restore();
      }
      // letterbox and the array HUD
      c.fillStyle = BT.bar; c.fillRect(0, 0, W, BT_BAR); c.fillRect(0, H - BT_BAR, W, BT_BAR);
      const mono = { font: '"Share Tech Mono"', size: 26, color: BT.hud, base: 'middle' };
      text(c, `CAM ${String(camN).padStart(3, '0')} / 120`, 80, 66, mono);
      text(c, `SPEED ×${sp.toFixed(3)}`, 1840, 66, { ...mono, align: 'right' });
      text(c, `ACTION  ${tau.toFixed(3)} s`, 1840, H - 66, { ...mono, align: 'right', color: 'rgba(157,245,182,0.7)' });
      // speed meter
      c.fillStyle = 'rgba(157,245,182,0.18)'; c.fillRect(1290, 60, 300, 12); c.fillStyle = BT.hud; c.fillRect(1290, 60, 300 * clamp(Math.pow(sp, 0.35)), 12);
      // top view of the camera array: the arc of stills around the subject, the bullets' line
      const cx = 150, cy = H - 66, R = 46, th0 = -0.42, th1 = 3.1;
      c.strokeStyle = 'rgba(157,245,182,0.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx + 60, cy - 6); c.lineTo(cx - 60, cy - 6); c.stroke();
      c.fillStyle = BT.hud; c.beginPath(); c.moveTo(cx - 60, cy - 6); c.lineTo(cx - 50, cy - 11); c.lineTo(cx - 50, cy - 1); c.fill();
      for (let k = 0; k < 40; k++) { const a = lerp(th0, th1, k / 39), on = k / 39 <= o + 1e-3; c.fillStyle = on ? BT.hud : 'rgba(157,245,182,0.25)'; c.fillRect(cx + Math.sin(a) * R - 1.5, cy + Math.cos(a) * R * 0.55 - 1.5, 3, 3); }
      const ac = lerp(th0, th1, o); c.fillStyle = '#ffffff'; c.beginPath(); c.arc(cx + Math.sin(ac) * R, cy + Math.cos(ac) * R * 0.55, 5, 0, TAU); c.fill();
      c.fillStyle = BT.hud; c.beginPath(); c.arc(cx, cy, 4, 0, TAU); c.fill();
      text(c, 'ARRAY', cx + 80, cy, { ...mono, size: 20, color: 'rgba(157,245,182,0.7)' });
      if (sp < 0.2) { const bl = 0.5 + 0.5 * Math.sin(t * 6); c.fillStyle = `rgba(157,245,182,${0.4 + 0.5 * bl})`; c.beginPath(); c.arc(700, 66, 7, 0, TAU); c.fill(); text(c, 'TIME HELD', 718, 66, { ...mono, size: 22 }); }
    },
    score(A) {
      A.bus.gain.value = 0.85;
      const T = BT_T;
      // rain on the roof, real time, then pulled down to a low rumble as time slows
      A.noise(0, { type: 'highpass', f: 5200, dur: 1.9, g: 0.05, hold: true, rel: 0.6, pan: -0.2 });
      A.noise(0.6, { type: 'bandpass', f: 4200, f2: 260, sweep: 1.2, q: 0.6, dur: 1.4, g: 0.06, hold: true, rel: 0.4 });
      // three shots from off-screen, and the bullets' whine falling with the clock
      [0.08, 0.3, 0.52].forEach((s, i) => { A.noise(s, { type: 'lowpass', f: 3200, f2: 300, dur: 0.35, g: 0.32, rev: 0.4, pan: 0.6 }); A.kick(s, 0.28, { f: 120, f2: 40 }); A.osc(s + 0.05, { f: 2600 - i * 300, f2: 180, glide: 1.6, dur: 1.6, g: 0.025, pan: 0.4 - i * 0.3 }); });
      A.osc(T.slow[0], { type: 'sawtooth', f: 330, f2: 42, glide: 1.0, dur: 1.2, g: 0.04, lp: 1800, lp2: 200, lpT: 1.0 });
      A.whoosh(T.slow[0] - 0.05, 1.0, { f1: 3000, f2: 200, g: 0.16 });
      // frozen: a sub drone, a slowed heartbeat, the air around each bullet ringing
      A.osc(1.5, { f: 41, dur: 5.9, g: 0.12, a: 0.6, hold: true, rel: 0.2 });
      A.osc(1.5, { type: 'sawtooth', f: 55, dur: 5.9, g: 0.03, a: 1.0, hold: true, rel: 0.2, lp: 160, lp2: 420, lpT: 5.5, detune: 8 });
      A.chord(1.7, [57, 64, 67, 71], { type: 'triangle', dur: 5.6, g: 0.018, a: 1.6, hold: true, rel: 0.3, lp: 1500, width: 0.9, rev: 0.7 });
      [2.0, 3.3, 4.6, 5.9].forEach(s => { A.kick(s, 0.32, { f: 70, f2: 35, dur: 0.5 }); A.kick(s + 0.22, 0.2, { f: 64, f2: 32, dur: 0.45 }); });
      for (let k = 0; k < 9; k++) A.osc(1.9 + k * 0.6, { f: midi(88 + (k % 3) * 3), dur: 1.2, g: 0.01, a: 0.3, vib: [0.7, 9], rev: 0.8, pan: (k % 3 - 1) * 0.5 });
      [[2.2, -0.6], [3.8, 0], [5.4, 0.6]].forEach(([s, p]) => A.whoosh(s, 1.8, { f1: 200, f2: 900, q: 0.8, g: 0.07, swell: 0.5, rev: 0.6, pan: p }));
      // reverse rush into the snap, then everything at once
      A.noise(6.2, { type: 'bandpass', f: 300, f2: 5000, sweep: 1.35, q: 1.2, dur: 1.36, g: 0.18, swell: 0.97, rev: 0.3 });
      A.osc(6.4, { type: 'sawtooth', f: 45, f2: 180, glide: 1.15, dur: 1.16, g: 0.05, lp: 300, lp2: 3000, lpT: 1.1, a: 1.0 });
      A.impact(T.flash, 0.6);
      A.noise(T.flash, { type: 'highpass', f: 5000, dur: 2.4, g: 0.05, hold: true, rel: 0.8, pan: 0.2 });
      [7.5, 7.6, 7.75].forEach((s, i) => { A.whoosh(s - 0.08, 0.12, { f1: 1500, f2: 7000, g: 0.14, swell: 0.8, rev: 0.1, pan: 0.5 - i * 0.5 }); A.snare(s + 0.04, 0.22, { f: 900, dur: 0.25, rev: 0.4 }); A.noise(s + 0.05, { type: 'bandpass', f: 600, dur: 0.5, g: 0.1, rev: 0.4 }); });
      A.kick(7.95, 0.5, { f: 90, f2: 38 });
      // title: a low stab and a sustained minor chord
      A.kick(T.title, 0.6);
      A.chord(T.title, [45, 52, 57, 60, 64], { type: 'sawtooth', dur: 1.7, g: 0.03, a: 0.02, lp: 2200, lp2: 500, lpT: 1.6, spread: 7, width: 0.9, rev: 0.6, hold: true, rel: 0.6 });
      A.bell(T.title + 0.05, midi(76), { g: 0.04, dur: 1.6, rev: 0.6 });
    },
  });

  /* =====================================================================
     DOLLY ZOOM — a hotel corridor in true perspective: green walls, a red
     runner with gold diamonds, doors and sconces receding to a window of
     green neon. A man stands in the middle. The camera tracks back while
     the lens zooms in (50 → 180 mm): he stays exactly the same size but
     the corridor flattens and the far window looms up behind him. A beat,
     he realises; then the move reverses hard — the camera rushes in as the
     lens widens to 17 mm and the corridor stretches away into a tunnel
     behind his unchanged figure. A viewfinder HUD reads focal length,
     distance and field of view, with a plan view of the track and the
     lens wedge; the title settles on the stretched corridor.
     ===================================================================== */
  const DZ = {
    wall: '#2a6a50', wains: '#1b4a37', trim: '#d6c69a', ceil: '#e2d8bd', carpet: '#8a2024', carpetD: '#5c1216', dia: '#d1a84e', board: '#6a4528', boardD: '#3e2715',
    door: '#4a2c18', doorL: '#6c4426', frame: '#e6d9b2', brass: '#e4bf62', lamp: '#fff1c8', neon: '#7dffaa', win: '#d4ffe2', end: '#24563f',
    suit: '#6b6f74', suitD: '#44474c', shirt: '#ece7da', tie: '#7a1c1f', skin: '#d8ae8c', skinD: '#b88d6d', hair: '#3a2a1c',
    hud: '#f4ead0', hudA: '#ff6a48', ink: '#080b0a',
  };
  const DZ_K = 6.25, DZ_EYE = 1.3, DZ_HW = 1.55, DZ_CH = 3.0, DZ_Z0 = -46, DZ_Z1 = 26;   // mm of focal length per metre of distance, eye height, half width, ceiling, ends
  const DZ_T = { out: [1.0, 4.2], hold: 4.2, in: [4.9, 8.0], title: 8.35 };
  const dzFocal = t => Math.exp(kf(t, [[0, Math.log(50)], [DZ_T.out[0], Math.log(50)], [DZ_T.out[1], Math.log(180), E.ioC], [DZ_T.in[0], Math.log(180)], [DZ_T.in[1], Math.log(17), E.ioC]]));
  const dzFov = f => 2 * Math.atan(18 / f) * 180 / PI;
  // light along the corridor: pools under each ceiling lamp, green spill from the window at the end
  function dzLight(z) {
    const k = Math.round((z + 43) / 4), dz = z - (-43 + 4 * k), l = 0.3 + 0.7 * Math.exp(-dz * dz / (2 * 1.25 * 1.25)), g = Math.exp(-(DZ_Z1 - z) / 3.2);
    const w = [255, 240, 212], gr = [150, 255, 190], dk = [34, 38, 44], u = clamp(l * (1 - 0.5 * g));
    return `rgb(${[0, 1, 2].map(i => Math.round(lerp(dk[i], w[i], u) * (1 - g * 0.6) + gr[i] * g * 0.6)).join(',')})`;
  }
  function dzCam(t) {
    const f = dzFocal(t), d = f / DZ_K, bump = 0.012 * Math.exp(-Math.pow((t - DZ_T.in[0]) / 0.15, 2));
    const C = [0.006 * vnoise(t * 1.3, 2), DZ_EYE + bump * Math.sin(t * 40), -d];
    const cam = lookAt(C, [C[0], DZ_EYE, 60], f / 36 * 1920);
    cam.fmm = f; cam.d = d;
    return cam;
  }
  // light a plane: a gradient in screen space whose stops are sampled from depth (floor and ceiling vary in y, walls in x)
  function dzShade(c, cam, pts, axis, h) {
    const q = clipProj(cam, pts); if (!q) return;
    const F = cam.F, d = cam.d, zcMax = DZ_Z1 + d;
    const ends = axis === 'y' ? [cam.cy + F * h / zcMax, h > 0 ? 1080 : 0] : [cam.cx + F * h / zcMax, h > 0 ? 1920 : 0];
    const g = axis === 'y' ? c.createLinearGradient(0, ends[0], 0, ends[1]) : c.createLinearGradient(ends[0], 0, ends[1], 0);
    for (let i = 0; i <= 36; i++) {
      const u = i / 36, s = lerp(ends[0], ends[1], u), off = Math.abs(s - (axis === 'y' ? cam.cy : cam.cx));
      const zc = off > 0.5 ? F * Math.abs(h) / off : zcMax;
      g.addColorStop(u, dzLight(Math.min(DZ_Z1, zc - d)));
    }
    poly(c, q); c.fillStyle = g; c.fill();
  }
  function dzCorridor(c, t, cam) {
    const P = p => cam.P(p), hw = DZ_HW, Z0 = DZ_Z0, Z1 = DZ_Z1, Hc = DZ_CH;
    c.fillStyle = '#0c0f0e'; c.fillRect(0, 0, 1920, 1080);
    // base surfaces
    fillPoly3(c, cam, [[-hw, Hc, Z0], [hw, Hc, Z0], [hw, Hc, Z1], [-hw, Hc, Z1]], DZ.ceil);
    fillPoly3(c, cam, [[-hw, 0, Z0], [hw, 0, Z0], [hw, 0, Z1], [-hw, 0, Z1]], DZ.board);
    [-1, 1].forEach(s => {
      fillPoly3(c, cam, [[s * hw, 0, Z0], [s * hw, Hc, Z0], [s * hw, Hc, Z1], [s * hw, 0, Z1]], DZ.wall);
      fillPoly3(c, cam, [[s * hw, 0, Z0], [s * hw, 0.95, Z0], [s * hw, 0.95, Z1], [s * hw, 0, Z1]], DZ.wains);
    });
    // floor boards, the runner and its diamonds
    c.beginPath(); [-1.35, -1.15, 1.15, 1.35].forEach(x => line3(c, cam, [x, 0.001, Z0], [x, 0.001, Z1])); c.strokeStyle = DZ.boardD; c.lineWidth = 1.5; c.stroke();
    fillPoly3(c, cam, [[-0.95, 0.002, Z0], [0.95, 0.002, Z0], [0.95, 0.002, Z1], [-0.95, 0.002, Z1]], DZ.carpet);
    [-0.82, 0.78].forEach(x => fillPoly3(c, cam, [[x, 0.003, Z0], [x + 0.04, 0.003, Z0], [x + 0.04, 0.003, Z1], [x, 0.003, Z1]], DZ.dia));
    for (let z = Z0; z < Z1 - 1; z += 1.2) {
      fillPoly3(c, cam, [[0, 0.003, z], [0.5, 0.003, z + 0.6], [0, 0.003, z + 1.2], [-0.5, 0.003, z + 0.6]], DZ.dia);
      fillPoly3(c, cam, [[0, 0.004, z + 0.25], [0.29, 0.004, z + 0.6], [0, 0.004, z + 0.95], [-0.29, 0.004, z + 0.6]], DZ.carpetD);
    }
    // doors, frames and numbers along both walls; mouldings
    for (let k = 0; k < 18; k++) [[-1, Z0 + 2 + k * 4], [1, Z0 + 4 + k * 4]].forEach(([s, z]) => {
      if (z + 1.2 > Z1) return;
      const x = s * hw, xi = s * (hw - 0.001), xd = s * (hw - 0.002);
      fillPoly3(c, cam, [[xi, 0, z - 0.12], [xi, 2.32, z - 0.12], [xi, 2.32, z + 1.12], [xi, 0, z + 1.12]], DZ.frame);
      fillPoly3(c, cam, [[xd, 0, z], [xd, 2.2, z], [xd, 2.2, z + 1], [xd, 0, z + 1]], DZ.door);
      [[0.25, 1.05], [1.25, 2.0]].forEach(([y0, y1]) => fillPoly3(c, cam, [[s * (hw - 0.003), y0, z + 0.15], [s * (hw - 0.003), y1, z + 0.15], [s * (hw - 0.003), y1, z + 0.85], [s * (hw - 0.003), y0, z + 0.85]], DZ.doorL));
      fillPoly3(c, cam, [[s * (hw - 0.004), 1.02, z + 0.82], [s * (hw - 0.004), 1.1, z + 0.82], [s * (hw - 0.004), 1.1, z + 0.9], [s * (hw - 0.004), 1.02, z + 0.9]], DZ.brass);
      void x;
    });
    c.beginPath(); [-1, 1].forEach(s => { [0.95, 2.85, 0.08].forEach(y => line3(c, cam, [s * hw * 0.999, y, Z0], [s * hw * 0.999, y, Z1])); });
    c.strokeStyle = DZ.trim; c.lineWidth = 2.5; c.stroke();
    // the far wall with the neon window
    fillPoly3(c, cam, [[-hw, 0, Z1], [hw, 0, Z1], [hw, Hc, Z1], [-hw, Hc, Z1]], DZ.end);
    // multiply the lighting over every plane
    c.save(); c.globalCompositeOperation = 'multiply';
    dzShade(c, cam, [[-hw, 0, Z0], [hw, 0, Z0], [hw, 0, Z1], [-hw, 0, Z1]], 'y', DZ_EYE);
    dzShade(c, cam, [[-hw, Hc, Z0], [hw, Hc, Z0], [hw, Hc, Z1], [-hw, Hc, Z1]], 'y', DZ_EYE - Hc);
    dzShade(c, cam, [[-hw, 0, Z0], [-hw, Hc, Z0], [-hw, Hc, Z1], [-hw, 0, Z1]], 'x', -hw);
    dzShade(c, cam, [[hw, 0, Z0], [hw, Hc, Z0], [hw, Hc, Z1], [hw, 0, Z1]], 'x', hw);
    c.restore();
    const wq = fillPoly3(c, cam, [[-0.8, 0.55, Z1 - 0.01], [0.8, 0.55, Z1 - 0.01], [0.8, 2.6, Z1 - 0.01], [-0.8, 2.6, Z1 - 0.01]], DZ.win);
    if (wq) {
      c.beginPath(); line3(c, cam, [0, 0.55, Z1 - 0.02], [0, 2.6, Z1 - 0.02]); line3(c, cam, [-0.8, 1.6, Z1 - 0.02], [0.8, 1.6, Z1 - 0.02]);
      c.strokeStyle = '#1b3a2b'; c.lineWidth = Math.max(2, 0.06 * cam.F / (Z1 + cam.d)); c.stroke();
      // the neon sign outside, flickering
      const fl = 0.75 + 0.25 * (vnoise(t * 7, 4) > -0.6 ? 1 : 0.3);
      const pc = P([0.25, 2.0, Z1 + 3]); if (pc) { const r = 1.6 * cam.F / pc[2]; c.save(); poly(c, wq); c.clip(); const g = c.createRadialGradient(pc[0], pc[1], 0, pc[0], pc[1], r); g.addColorStop(0, `rgba(120,255,170,${fl})`); g.addColorStop(1, 'rgba(120,255,170,0)'); c.fillStyle = g; c.fillRect(0, 0, 1920, 1080); c.restore(); }
    }
    // emissive: ceiling lamps and sconces with their glow
    c.save(); c.globalCompositeOperation = 'screen';
    for (let z = -43; z < Z1; z += 4) {
      const q = fillPoly3(c, cam, [[-0.3, Hc - 0.01, z - 0.45], [0.3, Hc - 0.01, z - 0.45], [0.3, Hc - 0.01, z + 0.45], [-0.3, Hc - 0.01, z + 0.45]], DZ.lamp);
      const p = P([0, Hc - 0.2, z]); if (!q || !p) continue;
      const r = 1.4 * cam.F / p[2], g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, 'rgba(255,226,160,0.35)'); g.addColorStop(1, 'rgba(255,226,160,0)');
      c.fillStyle = g; c.fillRect(p[0] - r, p[1] - r, 2 * r, 2 * r);
    }
    for (let k = 0; k < 18; k++) [[-1, Z0 + 4 + k * 4], [1, Z0 + 2 + k * 4]].forEach(([s, z]) => {
      if (z > Z1 - 0.5) return;
      const p = P([s * (hw - 0.05), 1.9, z]); if (!p) return;
      const r = 0.55 * cam.F / p[2], g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, 'rgba(255,214,140,0.7)'); g.addColorStop(0.12, 'rgba(255,214,140,0.35)'); g.addColorStop(1, 'rgba(255,214,140,0)');
      c.fillStyle = g; c.fillRect(p[0] - r, p[1] - r, 2 * r, 2 * r);
    });
    const pw = P([0, 1.6, Z1]); if (pw) { const r = 3.2 * cam.F / pw[2], g = c.createRadialGradient(pw[0], pw[1], 0, pw[0], pw[1], r); g.addColorStop(0, 'rgba(120,255,170,0.32)'); g.addColorStop(1, 'rgba(120,255,170,0)'); c.fillStyle = g; c.fillRect(pw[0] - r, pw[1] - r, 2 * r, 2 * r); }
    c.restore();
  }
  // the man: a billboard at z = 0, drawn at k px per metre (k never changes — that is the whole trick)
  function dzMan(c, t, cam) {
    const k = cam.F / cam.d, fx = 960 + (cam.P([0, 0, 0]) || [960])[0] - 960, fy = 540 + k * DZ_EYE;
    const fear = E.ioS(seg(t, 4.3, 5.1)), sway = 0.006 * Math.sin(t * 1.7) + 0.01 * fear * Math.sin(t * 11);
    c.save(); c.translate(fx, fy); c.scale(k, k); c.rotate(sway);
    // shadow from the lamp above
    c.fillStyle = 'rgba(10,8,8,0.45)'; c.beginPath(); c.ellipse(0, 0, 0.42, 0.08, 0, 0, TAU); c.fill();
    c.fillStyle = '#0d0d0f'; [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * 0.095, -0.03, 0.08, 0.04, 0, 0, TAU); c.fill(); });
    c.fillStyle = DZ.suitD; [-1, 1].forEach(s => { poly(c, [[s * 0.02, -0.9], [s * 0.19, -0.9], [s * 0.15, -0.05], [s * 0.04, -0.05]]); c.fill(); });
    // jacket
    const jk = c.createLinearGradient(-0.25, 0, 0.25, 0); jk.addColorStop(0, DZ.suitD); jk.addColorStop(0.5, DZ.suit); jk.addColorStop(1, DZ.suitD);
    c.fillStyle = jk; c.beginPath(); c.moveTo(-0.08, -1.47); c.lineTo(0.08, -1.47); c.quadraticCurveTo(0.25, -1.46, 0.265, -1.33); c.lineTo(0.22, -0.78); c.lineTo(-0.22, -0.78); c.lineTo(-0.265, -1.33); c.quadraticCurveTo(-0.25, -1.46, -0.08, -1.47); c.fill();
    c.fillStyle = DZ.shirt; poly(c, [[-0.075, -1.45], [0.075, -1.45], [0, -1.12]]); c.fill();
    c.fillStyle = DZ.tie; poly(c, [[-0.018, -1.42], [0.018, -1.42], [0.03, -1.17], [0, -1.12], [-0.03, -1.17]]); c.fill();
    c.strokeStyle = 'rgba(20,20,24,0.6)'; c.lineWidth = 0.012; c.beginPath(); c.moveTo(-0.09, -1.45); c.lineTo(0, -1.1); c.lineTo(0.09, -1.45); c.moveTo(0, -1.1); c.lineTo(0, -0.8); c.stroke();
    // arms hang, hands half-clenched
    [-1, 1].forEach(s => {
      c.fillStyle = DZ.suitD; poly(c, [[s * 0.22, -1.42], [s * 0.3, -1.33], [s * (0.3 + 0.02 * fear), -0.84], [s * (0.22 + 0.02 * fear), -0.84], [s * 0.2, -1.25]]); c.fill();
      c.fillStyle = DZ.skin; c.beginPath(); c.ellipse(s * (0.26 + 0.02 * fear), -0.79, 0.045, 0.06, 0, 0, TAU); c.fill();
    });
    // neck and head
    c.fillStyle = DZ.skinD; c.fillRect(-0.05, -1.53, 0.1, 0.1);
    c.fillStyle = DZ.skin; c.beginPath(); c.ellipse(0, -1.63, 0.095, 0.12, 0, 0, TAU); c.fill();
    [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * 0.095, -1.63, 0.018, 0.03, 0, 0, TAU); c.fill(); });
    c.fillStyle = DZ.hair; c.beginPath(); c.ellipse(0, -1.7, 0.1, 0.065, 0, PI, TAU); c.fill(); c.fillRect(-0.1, -1.71, 0.025, 0.06); c.fillRect(0.075, -1.71, 0.025, 0.06);
    // the face: brows lift, eyes widen, mouth opens
    const ew = 0.022, eh = lerp(0.008, 0.016, fear);
    [-1, 1].forEach(s => {
      c.fillStyle = '#f4efe6'; c.beginPath(); c.ellipse(s * 0.038, -1.645, ew, eh, 0, 0, TAU); c.fill();
      c.fillStyle = '#1c140f'; c.beginPath(); c.arc(s * 0.038, -1.645, lerp(0.008, 0.005, fear), 0, TAU); c.fill();
      c.strokeStyle = DZ.hair; c.lineWidth = 0.009; c.beginPath(); c.moveTo(s * 0.06, -1.668 - 0.012 * fear); c.lineTo(s * 0.018, -1.672 - 0.022 * fear * (s > 0 ? 1 : 0.8)); c.stroke();
    });
    c.strokeStyle = DZ.skinD; c.lineWidth = 0.008; c.beginPath(); c.moveTo(0, -1.64); c.lineTo(-0.008, -1.6); c.lineTo(0.006, -1.596); c.stroke();
    c.fillStyle = '#5a2a22'; c.beginPath(); c.ellipse(0, -1.565, 0.022, lerp(0.003, 0.012, fear), 0, 0, TAU); c.fill();
    // green rim light from the window behind him
    c.strokeStyle = 'rgba(140,255,180,0.28)'; c.lineWidth = 0.008; c.beginPath(); c.ellipse(0, -1.63, 0.097, 0.122, 0, -PI * 0.85, -PI * 0.15); c.stroke();
    c.restore();
    return { k, fx, fy };
  }
  // plan view: corridor, track, the camera and its lens wedge
  function dzPlan(c, cam, x0, y0) {
    const w = 400, h = 150, s = w / (DZ_Z1 - DZ_Z0 + 4), zx = z => x0 + (z - DZ_Z0) * s, wy = DZ_HW * s * 3;
    c.fillStyle = 'rgba(8,11,10,0.6)'; c.fillRect(x0 - 16, y0 - 20, w + 32, h + 40);
    c.save(); c.beginPath(); c.rect(x0 - 16, y0 - 20, w + 32, h + 40); c.clip();
    c.strokeStyle = 'rgba(244,234,208,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(zx(DZ_Z0), y0 + h / 2 - wy); c.lineTo(zx(DZ_Z1), y0 + h / 2 - wy); c.lineTo(zx(DZ_Z1), y0 + h / 2 + wy); c.lineTo(zx(DZ_Z0), y0 + h / 2 + wy); c.stroke();
    c.setLineDash([4, 5]); c.beginPath(); c.moveTo(zx(-32), y0 + h / 2); c.lineTo(zx(0), y0 + h / 2); c.stroke(); c.setLineDash([]);
    const cz = zx(-cam.d), cy = y0 + h / 2, half = Math.atan(18 / cam.fmm), L = (cam.d + 6) * s;
    c.fillStyle = 'rgba(255,106,72,0.22)'; c.beginPath(); c.moveTo(cz, cy); c.lineTo(cz + L, cy - Math.tan(half) * L * 3); c.lineTo(cz + L, cy + Math.tan(half) * L * 3); c.closePath(); c.fill();
    c.strokeStyle = DZ.hudA; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = DZ.hudA; c.fillRect(cz - 9, cy - 6, 12, 12);
    c.fillStyle = DZ.hud; c.beginPath(); c.arc(zx(0), cy, 5, 0, TAU); c.fill();
    c.restore();
    text(c, 'PLAN', x0, y0 - 2, { font: '"IBM Plex Mono"', weight: 500, size: 16, color: 'rgba(244,234,208,0.7)', ls: 3 });
  }

  MG.film({
    id: 'dollyzoom', dur: 10, poster: 7.4,
    fonts: [['400 170px "Bebas Neue"', 'DOLLY ZOOM'], ['500 26px "IBM Plex Mono"', 'The Vertigo effect FOCAL DIST FOV mm m ° TRACK ZOOM IN OUT SUBJECT LOCKED PLAN 0123456789.']],
    meta: {
      family: 'H', name: 'Dolly Zoom', sub: 'The Vertigo effect', era: '1958 —',
      origin: 'A dolly zoom moves the camera toward or away from the subject while the zoom lens changes focal length the opposite way, so the subject holds its size while everything behind it stretches away or flattens and looms. Camera operator Irmin Roberts devised it for Alfred Hitchcock’s Vertigo (1958) to put the hero’s fear of heights on screen; Steven Spielberg turned it on Chief Brody at the beach in Jaws (1975), and Martin Scorsese used it slowly through the diner scene of Goodfellas (1990).',
      works: 'Vertigo (Alfred Hitchcock, 1958; effect devised by Irmin Roberts) · Jaws (Steven Spielberg, 1975) · Goodfellas (Martin Scorsese, 1990) · La Haine (Mathieu Kassovitz, 1995) · The Lord of the Rings: The Fellowship of the Ring (Peter Jackson, 2001)',
      tech: ['Focal length ∝ distance, locked', 'True-perspective corridor', 'Lens HUD with plan view'],
      accent: '#5fe08f',
      motionDNA: 'Two motions that cancel on the subject and nowhere else: the camera tracks while the zoom runs the other way at a rate tied to distance, so he never changes size while the background breathes. First a slow track-out and zoom-in that compresses the corridor, a held beat, then a fast reverse that stretches it into a tunnel.',
      visualDNA: 'A symmetrical hotel corridor in deep green with cream mouldings, a red runner with gold diamonds, rows of doors and sconces, pools of lamplight and a window of green neon at the far end; a man in a grey suit dead centre; viewfinder corner marks, mono lens readouts and a plan view of track and lens wedge.',
      transitions: 'Hold, compress, hold, stretch; the title settles on the stretched frame',
      implementation: ['Camera dolly on track plus a zoom lens pulled in sync', 'Pinhole projection in Canvas 2D: focal length and distance driven together (f / d constant)', 'Screen-space lighting gradients sampled from depth'],
      reproducibility: 'Fully procedural homage',
      loopable: false,
    },
    setup() { return { buf: offscreen(1920, 1080) }; },
    draw(c, t, W, H, st) {
      const cam = dzCam(t), b = st.buf.getContext('2d');
      dzCorridor(b, t, cam);
      // long lens, shallow focus: the corridor softens behind him as the focal length climbs
      const bl = clamp((cam.fmm - 70) / 110) * 3.2;
      if (bl > 0.15) { c.filter = `blur(${bl.toFixed(2)}px)`; c.drawImage(st.buf, 0, 0); c.filter = 'none'; }
      else c.drawImage(st.buf, 0, 0);
      const m = dzMan(c, t, cam);
      // wide lens: heavier vignette
      vignette(c, W, H, lerp(0.35, 0.7, clamp((40 - cam.fmm) / 23)), '4,8,6');
      grain(c, W, H, t, 0.045);
      // title on the stretched corridor
      const tt = E.outC(seg(t, DZ_T.title, DZ_T.title + 0.8));
      if (tt > 0) {
        const g = c.createLinearGradient(0, 0, 0, 380); g.addColorStop(0, `rgba(6,10,8,${0.75 * tt})`); g.addColorStop(1, 'rgba(6,10,8,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, 380);
        c.save(); c.globalAlpha = tt;
        text(c, 'DOLLY ZOOM', 960, 250, { font: '"Bebas Neue"', size: 170, align: 'center', color: '#f6eedb', ls: lerp(60, 22, tt) });
        text(c, 'The Vertigo effect', 960, 305, { font: '"IBM Plex Mono"', weight: 500, size: 28, align: 'center', color: DZ.neon, ls: 6 });
        c.restore();
      }
      // viewfinder
      c.strokeStyle = 'rgba(244,234,208,0.75)'; c.lineWidth = 3;
      [[70, 60, 1, 1], [1850, 60, -1, 1], [70, 1020, 1, -1], [1850, 1020, -1, -1]].forEach(([x, y, sx, sy]) => { c.beginPath(); c.moveTo(x, y + sy * 50); c.lineTo(x, y); c.lineTo(x + sx * 50, y); c.stroke(); });
      c.lineWidth = 1.5; c.beginPath(); c.moveTo(945, 540); c.lineTo(975, 540); c.moveTo(960, 525); c.lineTo(960, 555); c.stroke();
      // subject lock brackets: the same pixels every frame
      const bx0 = m.fx - 0.36 * m.k, bx1 = m.fx + 0.36 * m.k, by0 = m.fy - 1.8 * m.k, by1 = m.fy - 0.7 * m.k;
      c.strokeStyle = 'rgba(255,106,72,0.85)'; c.lineWidth = 2;
      [[bx0, by0, 1, 1], [bx1, by0, -1, 1], [bx0, by1, 1, -1], [bx1, by1, -1, -1]].forEach(([x, y, sx, sy]) => { c.beginPath(); c.moveTo(x, y + sy * 22); c.lineTo(x, y); c.lineTo(x + sx * 22, y); c.stroke(); });
      const mono = { font: '"IBM Plex Mono"', weight: 500, size: 20, color: DZ.hudA, ls: 2 };
      text(c, 'SUBJECT LOCKED 1:1', bx1 + 14, by0 + 16, mono);
      // lens readouts
      const hud = { font: '"IBM Plex Mono"', weight: 500, size: 26, color: DZ.hud, ls: 2 };
      c.fillStyle = 'rgba(8,11,10,0.6)'; c.fillRect(90, 846, 420, 146);
      text(c, `FOCAL  ${String(Math.round(cam.fmm)).padStart(3, '0')} mm`, 112, 888, hud);
      text(c, `DIST   ${cam.d.toFixed(1).padStart(4, '0')} m`, 112, 928, hud);
      text(c, `FOV    ${dzFov(cam.fmm).toFixed(1)}°`, 112, 968, hud);
      const dir = t > DZ_T.out[0] && t < DZ_T.out[1] ? ['TRACK OUT', 'ZOOM IN'] : t > DZ_T.in[0] && t < DZ_T.in[1] ? ['TRACK IN', 'ZOOM OUT'] : null;
      if (dir) {
        const bl2 = 0.6 + 0.4 * Math.sin(t * 8);
        c.fillStyle = 'rgba(8,11,10,0.6)'; c.fillRect(90, 66, 330, 86);
        text(c, `◀ ${dir[0]}`, 112, 102, { ...hud, color: `rgba(244,234,208,${bl2})` });
        text(c, `${dir[1]} ▶`, 112, 138, { ...hud, color: DZ.hudA });
      }
      dzPlan(c, cam, 1420, 850);
    },
    score(A) {
      A.bus.gain.value = 0.85;
      // pedal and the obsessive arpeggio (an E-flat minor chord with a major seventh), quickening as the move reverses
      A.osc(0, { type: 'sawtooth', f: midi(27), dur: 10, g: 0.05, a: 1.5, hold: true, rel: 0.8, lp: 160, lp2: 500, lpT: 8, q: 2 });
      A.osc(0, { f: midi(39), dur: 10, g: 0.05, a: 2, hold: true, rel: 0.8 });
      const arp = [51, 54, 58, 62, 58, 54];
      for (let tt = 0.15, k = 0; tt < 8.3; k++) {
        const up = tt > DZ_T.in[0] ? 12 : tt > 2.6 ? 1 : 0, m = arp[k % 6] + up;
        A.pluck(tt, midi(m), { g: 0.11, bright: 0.45, dur: 1.0, rev: 0.4, pan: (k % 6 - 2.5) * 0.12 });
        A.osc(tt, { type: 'triangle', f: midi(m + 12), dur: 0.3, g: 0.012, rev: 0.4 });
        tt += kf(tt, [[0, 0.22], [DZ_T.out[1], 0.16], [DZ_T.in[0], 0.22], [DZ_T.in[1], 0.1]]);
      }
      // the zoom motor
      A.noise(DZ_T.out[0], { type: 'bandpass', f: 700, f2: 1100, sweep: 3.2, q: 9, dur: 3.2, g: 0.03, hold: true, rel: 0.2 });
      A.noise(DZ_T.in[0], { type: 'bandpass', f: 1300, f2: 600, sweep: 3.1, q: 9, dur: 3.1, g: 0.035, hold: true, rel: 0.2 });
      // compression: strings swelling in
      A.chord(DZ_T.out[0], [39, 46, 51, 54, 58], { type: 'sawtooth', dur: 3.6, g: 0.022, a: 3.0, hold: true, rel: 0.5, lp: 500, lp2: 2200, lpT: 3.2, spread: 6, width: 0.8, rev: 0.5 });
      // realisation: timpani and a brass stab
      A.impact(DZ_T.in[0], 0.45);
      A.chord(DZ_T.in[0], [39, 51, 54, 58, 62], { type: 'sawtooth', dur: 0.9, g: 0.03, a: 0.01, lp: 2400, lp2: 600, lpT: 0.8, spread: 5, width: 0.6, rev: 0.5 });
      // stretch: two lines gliding apart in contrary motion, like track and zoom
      A.osc(DZ_T.in[0] + 0.1, { type: 'triangle', f: midi(74), f2: midi(86), glide: 3.0, dur: 3.2, g: 0.035, a: 0.4, hold: true, rel: 0.3, vib: [5, 6], rev: 0.6, pan: 0.4 });
      A.osc(DZ_T.in[0] + 0.1, { type: 'triangle', f: midi(62), f2: midi(46), glide: 3.0, dur: 3.2, g: 0.04, a: 0.4, hold: true, rel: 0.3, vib: [5, 6], rev: 0.6, pan: -0.4 });
      A.riser(DZ_T.in[0] + 0.5, 2.6, { g: 0.1, f: 70 });
      // landing and title: the unresolved chord left hanging
      A.impact(DZ_T.in[1] + 0.02, 0.4);
      A.chord(DZ_T.in[1], [39, 51, 54, 58, 62, 66], { type: 'triangle', dur: 2.0, g: 0.03, a: 0.3, hold: true, rel: 0.7, width: 1, rev: 0.7 });
      A.bell(DZ_T.title, midi(74), { g: 0.04, dur: 1.6, rev: 0.6 });
      A.bell(DZ_T.title + 0.45, midi(70), { g: 0.03, dur: 1.2, rev: 0.6 });
    },
  });

  /* =====================================================================
     BYZANTINE MOSAIC — we open close on a sinopia (the red-ochre
     underdrawing) on fresh plaster and watch tesserae pressed in one by
     one at a peacock's eye. The pace quickens and the camera pulls back as
     rows of glass spread in andamento — outlines first, then fills that
     follow every contour, gold background rows haloing the bird, vines
     and grapes, a deep blue vault of gold stars under a red arch, and a
     cross-free border of diamonds and pearls. When the last tile is set a
     lamp passes across and the tilted gold smalti glint one after another;
     the title is set in gold over the vault.
     ===================================================================== */
  const MO = { plaster: '#d8c8a8', sinopia: '#a3492c', grout: '#2a2119', lamp: '#ffe6b0', ink: '#130d07' };
  const MO_T = { set: [0.35, 6.3], sweep: [6.3, 8.7], title: 8.5 };
  // labels: tile spacing (px), palette, outline colour for the first row inside the region, sheen of the glass
  const MO_L = [
    ['gold', 16, ['#c9962f', '#d8a83a', '#e3b94c', '#b9862a', '#efca62', '#a97b2b'], null, 1],
    ['border', 14, ['#9a2a22', '#a8352a', '#8a231d', '#b0402e'], null, 0.2],
    ['bdia', 12, ['#e9e1cf', '#ddd3bd', '#f2ecdf'], null, 0.2],
    ['bline', 10, ['#1c2a5c', '#22336b', '#162250'], null, 0.3],
    ['pearl', 9, ['#f1ecdf', '#e2dccb'], null, 0.3],
    ['vault', 14, ['#152a6a', '#1b3580', '#10215a', '#203c8c', '#18306f'], null, 0.4],
    ['arch', 12, ['#a3302a', '#b23c2c', '#8f2722'], null, 0.2],
    ['archw', 9, ['#ece5d4', '#dcd3bf'], null, 0.2],
    ['star', 8, ['#e9c25a', '#f3d77a', '#d9ad45'], null, 1],
    ['ground', 14, ['#2f6a3c', '#3a7a45', '#285a33', '#43864d'], null, 0.2],
    ['vine', 8, ['#3c6b2c', '#4a7d34', '#335c26'], null, 0.2],
    ['leaf', 9, ['#4f8a3a', '#5d9a44', '#3f7630', '#6aa84e'], '#21401a', 0.25],
    ['grape', 8, ['#5b2c6e', '#6b3a80', '#4a2259'], '#2a1233', 0.3],
    ['tail', 11, ['#2e7a52', '#3a8c5c', '#276645', '#47996a'], '#163a26', 0.35],
    ['eyeG', 8, ['#e0b648', '#eccb63'], null, 1],
    ['eyeB', 8, ['#1f6fb8', '#2a83c8'], null, 0.4],
    ['eyeK', 7, ['#121a3a', '#1a2448'], null, 0.3],
    ['body', 10, ['#1f5fae', '#2a72c0', '#1a52a0', '#3384cc'], '#0c1a3c', 0.45],
    ['wing', 9, ['#2f7f7a', '#3a918a', '#276b68', '#46a097'], '#123b39', 0.4],
    ['wingS', 7, ['#c99a3a', '#b5862e', '#d8ad4c'], null, 0.9],
    ['crest', 7, ['#e3b84c', '#2a72c0'], null, 0.8],
    ['beak', 7, ['#c9b48a', '#b8a074'], null, 0.2],
    ['eye', 6, ['#f3efe4'], null, 0.2],
    ['eyeP', 6, ['#0d0d14'], null, 0.2],
    ['legs', 7, ['#8a6f55', '#7a604a'], null, 0.2],
  ];
  const MO_ID = Object.fromEntries(MO_L.map((l, i) => [l[0], i]));
  const MO_HEAD = [680, 455];
  // the design, drawn as flat masks per label (layer order = MO_L order, later wins)
  function moDesign(r) {
    const D = { stars: [], vines: [], eyes: [] };
    const inVault = (x, y) => y < 560 && Math.pow((x - 960) / 760, 2) + Math.pow((y - 560) / 460, 2) < 0.86;
    for (let i = 0; i < 400 && D.stars.length < 46; i++) {
      const x = 200 + r() * 1520, y = 110 + r() * 430, R = r() < 0.25 ? 6 : 17 + r() * 10;
      if (!inVault(x, y) || Math.hypot(x - 690, y - 430) < 120 || D.stars.some(s => Math.hypot(s[0] - x, s[1] - y) < s[2] + R + 34)) continue;
      D.stars.push([x, y, R, r() * PI]);
    }
    // tail eyes along the train, growing toward its end
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      const u = 0.22 + i * 0.22 + (j % 2) * 0.08, top = lerp(645, 705, u), bot = lerp(765, 925, u), v = 0.22 + j * 0.28;
      D.eyes.push([lerp(1000, 1690, u), lerp(top, bot, v), 22 + u * 18, Math.atan2(160, 690) * 0.6]);
    }
    return D;
  }
  function moSpiral(g, x, y, r0, turns, dir, a0) {
    g.beginPath();
    for (let i = 0; i <= 60; i++) { const u = i / 60, a = a0 + dir * u * turns * TAU, rr = r0 * (1 - u * 0.85); i ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    g.stroke();
  }
  function moLeaf(g, x, y, a, l) {
    g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(l * 0.5, -l * 0.42, l, 0); g.quadraticCurveTo(l * 0.5, l * 0.42, 0, 0); g.fill(); g.restore();
  }
  const MO_VINES = [
    // [x, y, r0, turns, dir, a0] scrolls hung off the main stems
    [210, 770, 78, 1.25, 1, PI], [440, 650, 66, 1.2, -1, 0], [250, 600, 50, 1.1, 1, -PI / 2], [470, 860, 52, 1.1, -1, PI / 2],
    [150, 230, 50, 1.2, 1, 0], [1770, 230, 50, 1.2, -1, PI],
  ];
  const MO_GRAPES = [[205, 840], [500, 560], [120, 330], [1800, 330], [400, 745]];
  function moMask(name, g, D) {
    const W = 1920, H = 1080, B = 64;
    const stem = () => { g.beginPath(); g.moveTo(330, 940); g.bezierCurveTo(170, 840, 470, 760, 330, 640); g.bezierCurveTo(250, 570, 330, 520, 360, 470); };
    switch (name) {
      case 'gold': g.fillRect(0, 0, W, H); break;
      case 'border': g.fillRect(0, 0, W, H); g.clearRect(B, B, W - 2 * B, H - 2 * B); break;
      case 'bdia': for (let x = 45; x < W; x += 90) [[x, B / 2], [x, H - B / 2]].forEach(([cx, cy]) => { poly(g, [[cx - 26, cy], [cx, cy - 20], [cx + 26, cy], [cx, cy + 20]]); g.fill(); });
        for (let y = 45 + 90; y < H - 90; y += 90) [[B / 2, y], [W - B / 2, y]].forEach(([cx, cy]) => { poly(g, [[cx - 20, cy], [cx, cy - 26], [cx + 20, cy], [cx, cy + 26]]); g.fill(); }); break;
      case 'bline': g.fillRect(B - 12, B - 12, W - 2 * B + 24, H - 2 * B + 24); g.clearRect(B + 8, B + 8, W - 2 * B - 16, H - 2 * B - 16); break;
      case 'pearl': for (let x = B + 4; x < W - B; x += 22) { g.beginPath(); g.arc(x, B - 2, 4.5, 0, TAU); g.arc(x, H - B + 2, 4.5, 0, TAU); g.fill(); } break;
      case 'vault': g.beginPath(); g.ellipse(960, 560, 760, 460, 0, PI, TAU); g.fill(); break;
      case 'arch': g.beginPath(); g.ellipse(960, 560, 800, 500, 0, PI, TAU); g.ellipse(960, 560, 760, 460, 0, TAU, PI, true); g.fill(); break;
      case 'archw': g.beginPath(); g.ellipse(960, 560, 772, 472, 0, PI, TAU); g.ellipse(960, 560, 762, 462, 0, TAU, PI, true); g.fill(); break;
      case 'star': D.stars.forEach(([x, y, R, a]) => {
        if (R < 8) { g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill(); return; }
        g.beginPath(); for (let i = 0; i < 16; i++) { const rr = i % 2 ? R * 0.42 : R, an = a + i / 16 * TAU; i ? g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr) : g.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } g.closePath(); g.fill();
      }); break;
      case 'ground': g.fillRect(B, 945, W - 2 * B, H - B - 945); break;
      case 'vine': g.lineCap = 'round'; g.lineWidth = 15; stem(); g.stroke();
        g.beginPath(); g.moveTo(330, 640); g.quadraticCurveTo(420, 600, 440, 650); g.moveTo(300, 800); g.quadraticCurveTo(250, 790, 210, 770); g.moveTo(360, 870); g.quadraticCurveTo(440, 880, 470, 860); g.moveTo(330, 600); g.lineTo(250, 600); g.stroke();
        g.lineWidth = 11; MO_VINES.forEach(v => moSpiral(g, ...v)); break;
      case 'leaf': MO_VINES.forEach(([x, y, r0, , dir, a0], i) => { for (let k = 0; k < 3; k++) { const a = a0 + dir * (k * 1.9 + 0.8); moLeaf(g, x + Math.cos(a) * r0, y + Math.sin(a) * r0, a + dir * 0.9 + (i % 2) * 0.4, 46 - k * 6); } });
        [[330, 700, -0.6], [300, 900, 0.5 + PI], [360, 520, -1.0]].forEach(([x, y, a]) => moLeaf(g, x, y, a, 50)); break;
      case 'grape': MO_GRAPES.forEach(([x, y]) => { [[0, 0], [-18, 0], [18, 0], [-9, 15], [9, 15], [0, 30], [-27, -14], [27, -14], [-9, -14], [9, -14]].forEach(([dx, dy]) => { g.beginPath(); g.arc(x + dx, y + dy, 10, 0, TAU); g.fill(); }); }); break;
      case 'tail': g.beginPath(); g.moveTo(950, 640); g.bezierCurveTo(1200, 610, 1500, 640, 1720, 700); g.quadraticCurveTo(1770, 820, 1720, 935); g.bezierCurveTo(1450, 925, 1150, 850, 960, 770); g.closePath(); g.fill(); break;
      case 'eyeG': D.eyes.forEach(([x, y, R, a]) => { g.beginPath(); g.ellipse(x, y, R, R * 0.72, a, 0, TAU); g.fill(); }); break;
      case 'eyeB': D.eyes.forEach(([x, y, R, a]) => { g.beginPath(); g.ellipse(x - R * 0.12, y, R * 0.62, R * 0.46, a, 0, TAU); g.fill(); }); break;
      case 'eyeK': D.eyes.forEach(([x, y, R, a]) => { g.beginPath(); g.ellipse(x - R * 0.2, y, R * 0.28, R * 0.22, a, 0, TAU); g.fill(); }); break;
      case 'body': g.beginPath(); g.ellipse(865, 695, 158, 108, -0.22, 0, TAU); g.fill();
        g.lineCap = 'round'; g.lineWidth = 64; g.beginPath(); g.moveTo(790, 640); g.quadraticCurveTo(700, 600, 690, 480); g.stroke();
        g.beginPath(); g.arc(682, 458, 42, 0, TAU); g.fill(); break;
      case 'wing': g.beginPath(); g.ellipse(905, 688, 112, 66, -0.18, 0, TAU); g.fill(); break;
      case 'wingS': g.save(); g.beginPath(); g.ellipse(905, 688, 98, 54, -0.18, 0, TAU); g.clip(); g.lineWidth = 7;
        for (let j = 0; j < 4; j++) for (let i = -1; i < 7; i++) { const x = 820 + i * 34 + (j % 2) * 17, y = 640 + j * 30 - i * 6; g.beginPath(); g.arc(x, y, 17, 0.1, PI - 0.1); g.stroke(); }
        g.restore(); break;
      case 'crest': g.lineWidth = 4; g.lineCap = 'round'; for (let i = 0; i < 5; i++) { const x = 650 + i * 14, y = 360 - Math.sin(i / 4 * PI) * 12; g.beginPath(); g.moveTo(675 + i * 3, 418); g.lineTo(x, y); g.stroke(); g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); } break;
      case 'beak': poly(g, [[645, 446], [598, 462], [646, 476]]); g.fill(); break;
      case 'eye': g.beginPath(); g.arc(670, 450, 11, 0, TAU); g.fill(); break;
      case 'eyeP': g.beginPath(); g.arc(667, 450, 5, 0, TAU); g.fill(); break;
      case 'legs': g.lineWidth = 11; g.lineCap = 'round'; g.beginPath(); g.moveTo(845, 790); g.lineTo(838, 940); g.moveTo(895, 790); g.lineTo(905, 940); g.moveTo(838, 940); g.lineTo(808, 948); g.moveTo(905, 940); g.lineTo(935, 948); g.stroke(); break;
    }
  }
  // Tile the design: label map at half resolution, a chamfer distance field to each region's edge, rows laid along its
  // iso-lines (andamento), greedy packing in scan order, then a pass of filler tiles for the gaps.
  function moBuild() {
    const r = rng(547), D = moDesign(r), MW = 960, MH = 540, N = MW * MH;
    const lab = new Uint8Array(N), cv = offscreen(MW, MH), g = cv.getContext('2d');
    MO_L.forEach((l, id) => {
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, MW, MH); g.setTransform(0.5, 0, 0, 0.5, 0, 0); g.fillStyle = '#fff'; g.strokeStyle = '#fff';
      moMask(l[0], g, D);
      const a = g.getImageData(0, 0, MW, MH).data;
      for (let i = 0; i < N; i++) if (a[i * 4 + 3] > 127) lab[i] = id;
    });
    const dist = new Float32Array(N);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const i = y * MW + x, L = lab[i];
      dist[i] = (x === 0 || y === 0 || x === MW - 1 || y === MH - 1 || lab[i - 1] !== L || lab[i + 1] !== L || lab[i - MW] !== L || lab[i + MW] !== L) ? 0.5 : 1e9;
    }
    const S2 = Math.SQRT2;
    for (let y = 1; y < MH; y++) for (let x = 1; x < MW - 1; x++) { const i = y * MW + x; let d = dist[i]; d = Math.min(d, dist[i - 1] + 1, dist[i - MW] + 1, dist[i - MW - 1] + S2, dist[i - MW + 1] + S2); dist[i] = d; }
    for (let y = MH - 2; y >= 0; y--) for (let x = MW - 2; x > 0; x--) { const i = y * MW + x; let d = dist[i]; d = Math.min(d, dist[i + 1] + 1, dist[i + MW] + 1, dist[i + MW + 1] + S2, dist[i + MW - 1] + S2); dist[i] = d; }
    // spatial hash of accepted centres
    const CS = 20, GW = Math.ceil(1920 / CS), GH = Math.ceil(1080 / CS), grid = Array.from({ length: GW * GH }, () => []);
    const tiles = [];
    const free = (x, y, s, k) => {
      const gx = (x / CS) | 0, gy = (y / CS) | 0;
      for (let j = gy - 1; j <= gy + 1; j++) for (let i = gx - 1; i <= gx + 1; i++) {
        if (i < 0 || j < 0 || i >= GW || j >= GH) continue;
        for (const ti of grid[j * GW + i]) { const o = tiles[ti]; if (Math.hypot(o.x - x, o.y - y) < k * (s + o.s) / 2) return false; }
      }
      return true;
    };
    const add = (mx, my, L, row, fill) => {
      const i = my * MW + mx, s = MO_L[L][1], x = mx * 2 + 1, y = my * 2 + 1;
      let gx = dist[i + 1] - dist[i - 1], gy = dist[i + MW] - dist[i - MW], gl = Math.hypot(gx, gy);
      if (gl < 1e-3) { const a = r() * TAU; gx = Math.cos(a); gy = Math.sin(a); gl = 1; }
      const nx = gx / gl, ny = gy / gl, tx = -ny, ty = nx, jr = (r() - 0.5) * 0.14, cj = Math.cos(jr), sj = Math.sin(jr);
      const ax = tx * cj - ty * sj, ay = tx * sj + ty * cj, bx = -ay, by = ax;
      const l = s * (fill ? 0.7 : 0.86) * (0.88 + r() * 0.2) / 2, w = s * (fill ? 0.7 : 0.84) * (0.9 + r() * 0.14) / 2, q = new Float32Array(8);
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([u, v], k) => { q[k * 2] = x + ax * l * u + bx * w * v + (r() - 0.5) * s * 0.1; q[k * 2 + 1] = y + ay * l * u + by * w * v + (r() - 0.5) * s * 0.1; });
      const pal = MO_L[L][2], outl = MO_L[L][3] && row === 0;
      tiles.push({ x, y, s, L, q, col: outl ? MO_L[L][3] : pal[(r() * pal.length) | 0], m: MO_L[L][4], gx: (r() + r() + r() - 1.5) * 1.6, gy: (r() + r() + r() - 1.5) * 1.6, ph: r() });
      grid[((y / CS) | 0) * GW + ((x / CS) | 0)].push(tiles.length - 1);
    };
    for (let my = 1; my < MH - 1; my++) for (let mx = 1; mx < MW - 1; mx++) {
      const i = my * MW + mx, L = lab[i], s = MO_L[L][1], rr = dist[i] * 2 / s, f = rr - Math.floor(rr);
      if (f < 0.32 || f > 0.68) continue;
      const x = mx * 2 + 1, y = my * 2 + 1;
      if (free(x, y, s, 0.93)) add(mx, my, L, Math.floor(rr), false);
    }
    const holes = [];
    for (let my = 2; my < MH - 2; my += 2) for (let mx = 2; mx < MW - 2; mx += 2) holes.push(my * MW + mx);
    for (let i = holes.length - 1; i > 0; i--) { const j = (r() * (i + 1)) | 0, tmp = holes[i]; holes[i] = holes[j]; holes[j] = tmp; }
    holes.forEach(i => { const mx = i % MW, my = (i / MW) | 0, L = lab[i], s = MO_L[L][1]; if (free(mx * 2 + 1, my * 2 + 1, s, 0.74)) add(mx, my, L, 9, true); });
    // setting order: the peacock's head outward, figure before ground, border last; slow at first, then faster
    const bias = { gold: 420, vault: 820, star: 820, arch: 980, archw: 980, ground: 640, vine: 240, leaf: 240, grape: 240, border: 1300, bdia: 1300, bline: 1300, pearl: 1300 };
    tiles.forEach(o => { const b = bias[MO_L[o.L][0]]; o.key = Math.hypot(o.x - MO_HEAD[0], o.y - MO_HEAD[1]) * (0.85 + 0.3 * r()) * (b === undefined ? 0.5 : 1) + (b || 0); });
    const ord = tiles.slice().sort((a, b) => a.key - b.key);
    ord.forEach((o, k) => { const u = k / ord.length; o.ts = MO_T.set[0] + (MO_T.set[1] - MO_T.set[0]) * Math.pow(u, 0.38); o.dur = o.ts < 1.6 ? 0.4 : 0.2; });
    // buckets by colour for batched fills
    const groups = {}; tiles.forEach(o => (groups[o.col] = groups[o.col] || []).push(o));
    // the sinopia: red-ochre lines on plaster where the regions meet
    const sin = offscreen(1920, 1080), sg = sin.getContext('2d');
    sg.fillStyle = MO.plaster; sg.fillRect(0, 0, 1920, 1080);
    for (let k = 0; k < 2600; k++) { sg.fillStyle = `rgba(${r() < 0.5 ? '120,100,70' : '250,240,220'},${0.05 + r() * 0.08})`; sg.beginPath(); sg.arc(r() * 1920, r() * 1080, 2 + r() * 14, 0, TAU); sg.fill(); }
    const ed = offscreen(1920, 1080), eg = ed.getContext('2d');
    eg.fillStyle = 'rgba(163,73,44,0.8)';
    for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) { const i = y * MW + x; if (lab[i] !== lab[i + 1] || lab[i] !== lab[i + MW]) eg.fillRect(x * 2, y * 2, 2.6, 2.6); }
    sg.filter = 'blur(1.3px)'; sg.drawImage(ed, 0, 0); sg.filter = 'none';
    const glow = offscreen(64, 64), gg = glow.getContext('2d'), gr = gg.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,250,230,0.55)'); gr.addColorStop(1, 'rgba(255,250,230,0)'); gg.fillStyle = gr; gg.fillRect(0, 0, 64, 64);
    return { tiles, groups: Object.entries(groups), sin, glow, n: tiles.length, tEnd: Math.max(...tiles.map(o => o.ts + o.dur)) + 0.01 };
  }
  // sinopia, the setting bed darkening under each laid tile (the grout), then the tiles, one fill per colour
  function moLaid(c, st, t, vis) {
    c.drawImage(st.sin, 0, 0);
    // (filled in chunks: one path of thousands of overlapping contours rasterises very slowly)
    c.fillStyle = '#35291f'; c.beginPath(); let n = 0;
    st.tiles.forEach(o => { if (t >= o.ts + o.dur * 0.5 && vis(o)) { moQuad(c, o.q, 1.3, o.x, o.y); if (++n % 150 === 0) { c.fill(); c.beginPath(); } } });
    c.fill();
    const moving = [];
    st.groups.forEach(([col, list]) => {
      c.beginPath(); let any = false;
      for (const o of list) { if (t < o.ts || !vis(o)) continue; if (t < o.ts + o.dur) { moving.push(o); continue; } moQuad(c, o.q); any = true; }
      if (any) { c.fillStyle = col; c.fill(); }
    });
    return moving;
  }
  const moQuad = (c, q, s = 1, cx = 0, cy = 0) => {
    if (s === 1) { c.moveTo(q[0], q[1]); c.lineTo(q[2], q[3]); c.lineTo(q[4], q[5]); c.lineTo(q[6], q[7]); c.closePath(); return; }
    c.moveTo(cx + (q[0] - cx) * s, cy + (q[1] - cy) * s); for (let k = 1; k < 4; k++) c.lineTo(cx + (q[k * 2] - cx) * s, cy + (q[k * 2 + 1] - cy) * s); c.closePath();
  };
  function moView(t) {
    const u = E.ioC(seg(t, 0.9, 6.4)), z = Math.exp(lerp(Math.log(3.4), 0, u)) * (1 + 0.012 * Math.sin(t * 0.6) * seg(t, 6.4, 7.5));
    const hw = 960 / z, hh = 540 / z;
    return { z, x: clamp(lerp(MO_HEAD[0] + 20, 960, u), hw, 1920 - hw), y: clamp(lerp(MO_HEAD[1] + 10, 540, u), hh, 1080 - hh) };
  }
  function moLamp(t, v) {
    const x = kf(t, [[0, v.x + 90], [MO_T.sweep[0], v.x + 150], [MO_T.sweep[1], 1760, E.ioS], [10, 1650]]), y = kf(t, [[0, v.y - 60], [MO_T.sweep[0], 300], [(MO_T.sweep[0] + MO_T.sweep[1]) / 2, 620], [MO_T.sweep[1], 280], [10, 330]]);
    return [x + 14 * vnoise(t * 2.3, 3), y + 10 * vnoise(t * 2.9, 5)];
  }

  MG.film({
    id: 'mosaic', dur: 10, poster: 9.4,
    fonts: [['700 96px Cinzel', 'BYZANTINE MOSAIC'], ['500 30px Cinzel', 'Gold glass and stone, set by hand']],
    meta: {
      family: 'I', name: 'Byzantine Mosaic', sub: 'Gold glass and tesserae', era: '5th–15th c.',
      origin: 'Byzantine mosaic builds images from tesserae, small cubes of stone and coloured glass, set in rows that follow the forms they describe (andamento) over grounds of gold-leaf glass that glint as the light or the viewer moves. In Ravenna the Mausoleum of Galla Placidia (c. 425–450) has a deep blue vault strewn with gold stars and San Vitale (c. 547) shows the court of Justinian and Theodora; the Deësis panel in Hagia Sophia (c. 1261) reached a painterly softness with very small tesserae.',
      works: 'Mausoleum of Galla Placidia, Ravenna (c. 425–450) · San Vitale, Justinian and Theodora panels, Ravenna (c. 547) · Hagia Sophia, Deësis panel, Constantinople (c. 1261) · Chora Church (Kariye), Constantinople (c. 1315–1321)',
      tech: ['Rows follow the forms (andamento)', 'Tilted gold smalti glint', 'Tesserae set one by one'],
      accent: '#d9aa3c',
      motionDNA: 'Accumulation, then light. Tiles are pressed in singly at first and then faster and faster in waves that run along their rows, outward from the figure; when the surface is whole nothing moves but a lamp, and the gold answers it tile by tile with glints that flicker on and off as the angle passes.',
      visualDNA: 'Small irregular squares with dark grout between; gold-glass ground laid in rows that halo the figure; a blue and green peacock with a dark outline row and eyed tail, vine scrolls with leaves and grapes, a deep lapis vault with eight-pointed gold stars under a red and white arch, a border of red with white diamonds and pearl beading; red-ochre sinopia on plaster where nothing is set yet.',
      transitions: 'Close-up pulls back as the surface fills; a lamp sweep; the title set in gold on the vault',
      implementation: ['Stone and gold- or colour-backed glass tesserae pressed into lime mortar over a painted sinopia', 'Canvas 2D: label masks, a distance field per region, greedy tile packing along its iso-lines', 'Per-tile tilt vectors for specular glints'],
      reproducibility: 'Fully procedural homage',
      loopable: false,
    },
    setup() { return moBuild(); },
    draw(c, t, W, H, st) {
      const v = moView(t), L = moLamp(t, v), vx0 = v.x - 960 / v.z - 20, vx1 = v.x + 960 / v.z + 20, vy0 = v.y - 540 / v.z - 20, vy1 = v.y + 540 / v.z + 20;
      c.fillStyle = MO.grout; c.fillRect(0, 0, W, H);
      c.save(); c.translate(960, 540); c.scale(v.z, v.z); c.translate(-v.x, -v.y);
      const vis = o => o.x > vx0 && o.x < vx1 && o.y > vy0 && o.y < vy1;
      let moving = [];
      if (t < st.tEnd) moving = moLaid(c, st, t, vis);
      else {
        // once the last tile is in, the surface is static: lay it once into a cached plate
        if (!st.full) { st.full = offscreen(1920, 1080); moLaid(st.full.getContext('2d'), st, 99, () => true); }
        c.drawImage(st.full, 0, 0);
      }
      // tiles in the act of being pressed in: lifted, larger, casting a shadow
      moving.forEach(o => {
        const u = (t - o.ts) / o.dur, e = E.outC(u), s = lerp(1.7, 1, e), off = (1 - e) * o.s * 0.6;
        c.globalAlpha = clamp(u * 4);
        c.fillStyle = 'rgba(20,12,6,0.45)'; c.beginPath(); moQuad(c, o.q, s * 1.05, o.x, o.y); c.save(); c.translate(off, off * 1.4); c.fill(); c.restore();
        c.fillStyle = o.col; c.beginPath(); moQuad(c, o.q, s, o.x, o.y); c.fill();
        c.globalAlpha = 1;
      });
      // glints: each tile's tilt decides where the lamp must be for it to flare
      c.save(); c.globalCompositeOperation = 'screen';
      const lev = [[], [], [], [], [], []], K = 300, sig2 = 2 * 140 * 140;
      st.tiles.forEach(o => {
        if (o.m < 0.3 || t < o.ts + o.dur || !vis(o)) return;
        const dx = o.x + o.gx * K - L[0], dy = o.y + o.gy * K - L[1], I = o.m * Math.exp(-(dx * dx + dy * dy) / sig2) * (0.75 + 0.25 * Math.sin(t * 5 + o.ph * TAU));
        const q = Math.floor(I * 6); if (q > 0) lev[Math.min(5, q)].push(o);
      });
      lev.forEach((list, q) => { if (!list.length) return; c.beginPath(); list.forEach(o => moQuad(c, o.q, 0.95, o.x, o.y)); c.fillStyle = `rgba(255,246,220,${0.17 * q + 0.1})`; c.fill(); });
      // the brightest few bloom
      lev[5].concat(lev[4]).forEach(o => { const r0 = o.s * 1.6; c.drawImage(st.glow, o.x - r0, o.y - r0, r0 * 2, r0 * 2); });
      c.restore();
      // lamplight falloff over the wall
      const lg = c.createRadialGradient(L[0], L[1], 60, L[0], L[1], 1500);
      lg.addColorStop(0, 'rgba(255,214,150,0.2)'); lg.addColorStop(0.3, 'rgba(20,10,4,0)'); lg.addColorStop(1, 'rgba(10,5,2,0.5)');
      c.fillStyle = lg; c.fillRect(0, 0, 1920, 1080);
      c.restore();
      vignette(c, W, H, 0.45, '12,6,2');
      grain(c, W, H, t, 0.04);
      // the title, laid in gold over the vault
      const tt = E.outC(seg(t, MO_T.title, MO_T.title + 0.9));
      if (tt > 0) {
        c.save(); c.globalAlpha = tt;
        c.save(); c.translate(960, 250); c.scale(1, 0.16);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, 760); g.addColorStop(0, 'rgba(8,14,40,0.8)'); g.addColorStop(0.7, 'rgba(8,14,40,0.55)'); g.addColorStop(1, 'rgba(8,14,40,0)');
        c.fillStyle = g; c.beginPath(); c.arc(0, 0, 760, 0, TAU); c.fill(); c.restore();
        const gg = c.createLinearGradient(0, 200, 0, 270); gg.addColorStop(0, '#fff0b8'); gg.addColorStop(0.5, '#e7bd52'); gg.addColorStop(1, '#a6782a');
        text(c, 'BYZANTINE MOSAIC', 960, 268, { font: 'Cinzel', weight: 700, size: 96, align: 'center', color: gg, ls: lerp(30, 12, tt), stroke: 'rgba(20,12,4,0.6)', lw: 6 });
        text(c, 'Gold glass and stone, set by hand', 960, 318, { font: 'Cinzel', weight: 500, size: 30, align: 'center', color: '#efe3c4', ls: 4 });
        c.restore();
      }
    },
    score(A) {
      A.bus.gain.value = 1.35;
      // the ison: a held drone under a slow modal chant
      A.osc(0, { type: 'sawtooth', f: midi(38), dur: 10, g: 0.04, a: 1.5, hold: true, rel: 1.0, lp: 260, lp2: 700, lpT: 8, rev: 0.4 });
      A.osc(0, { f: midi(50), dur: 10, g: 0.05, a: 2, hold: true, rel: 1.0, vib: [0.3, 1], rev: 0.5 });
      A.osc(1.0, { f: midi(57), dur: 9, g: 0.02, a: 3, hold: true, rel: 1.0, rev: 0.6 });
      [[0.8, 62, 1.0], [1.8, 64, 0.6], [2.4, 65, 1.2], [3.6, 64, 0.6], [4.2, 62, 0.8], [5.0, 61, 0.5], [5.5, 62, 1.4], [7.0, 69, 0.8], [7.8, 67, 0.6], [8.4, 65, 0.6], [9.0, 62, 0.95]].forEach(([s, m, d]) => {
        A.osc(s, { type: 'triangle', f: midi(m), dur: d, g: 0.045, a: 0.12, hold: true, rel: 0.2, vib: [5, 5], lp: 1600, rev: 0.7 });
        A.osc(s, { f: midi(m + 12), dur: d, g: 0.01, a: 0.15, hold: true, rel: 0.2, rev: 0.7 });
      });
      // tesserae pressed in: first a few, then a patter
      for (let k = 0; k < 110; k++) {
        const u = Math.pow(k / 110, 2.6), s = MO_T.set[0] + 0.2 + (MO_T.set[1] - MO_T.set[0]) * Math.pow(u, 0.38), g = lerp(0.09, 0.03, k / 110);
        A.noise(s, { type: 'bandpass', f: 2600 + hash(k) * 2400, q: 4, dur: 0.025, g, pan: (hash(k + 9) - 0.5) * 0.8 });
        if (k < 14) A.osc(s, { f: 3200 + hash(k * 3) * 1500, dur: 0.06, g: 0.015, rev: 0.3 });
      }
      A.noise(2.5, { type: 'bandpass', f: 5000, q: 1.2, dur: 3.9, g: 0.03, swell: 0.7, rev: 0.4 });
      // the lamp passes: glass chimes as the gold catches
      [74, 81, 76, 86, 79, 84, 88, 81, 86].forEach((m, i) => A.bell(MO_T.sweep[0] + 0.1 + i * 0.26, midi(m), { g: 0.035, dur: 1.4, rev: 0.7, pan: lerp(-0.7, 0.7, i / 8) }));
      A.chord(MO_T.title, [50, 57, 62, 65, 69], { type: 'triangle', dur: 1.5, g: 0.025, a: 0.6, hold: true, rel: 0.6, width: 0.9, rev: 0.7 });
      A.bell(MO_T.title + 0.1, midi(74), { g: 0.05, dur: 1.5, rev: 0.7 });
    },
  });
})();
