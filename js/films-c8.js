/* batch c8 — Family D: 3D & CGI Motion. Soft Body, Wireframe 3D, Exploded View.
   Each film carries its own tiny Canvas-2D 3D pipeline: look-at cameras, perspective projection,
   back-face culling, painter's depth sort, analytic shading (Lambert / Blinn / fresnel / env maps). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, midi, text, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Manrope:wght@400;500;700;800&family=JetBrains+Mono:wght@400;700&display=block');
  const MONO = '"JetBrains Mono", monospace';
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const ss = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const norm = v => { const m = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / m, v[1] / m, v[2] / m]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const bump = (t, a, up, hold, down) => E.outX(seg(t, a, a + up)) * (1 - E.ioC(seg(t, a + up + hold, a + up + hold + down)));
  // damped oscillator impulse response (0 at s=0), f in Hz, z damping ratio
  const ring = (s, f, z) => (s <= 0 ? 0 : Math.exp(-z * TAU * f * s) * Math.sin(TAU * f * Math.sqrt(1 - z * z) * s));

  // right-handed look-at camera: screen x = right, screen y = up
  function lookCam(eye, tgt, F, W, H, ox = 0, oy = 0) {
    const f = norm([tgt[0] - eye[0], tgt[1] - eye[1], tgt[2] - eye[2]]);
    const r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
    const cx = W / 2 + ox, cy = H / 2 + oy;
    return {
      eye, f, r, u, F,
      proj(x, y, z) {
        const dx = x - eye[0], dy = y - eye[1], dz = z - eye[2];
        const zc = dx * f[0] + dy * f[1] + dz * f[2];
        return [cx + F * (dx * r[0] + dy * r[1] + dz * r[2]) / zc, cy - F * (dx * u[0] + dy * u[1] + dz * u[2]) / zc, zc];
      },
    };
  }

  /* ================= D · SOFT BODY — jelly on the stairs ================= */
  const SB_G = 5200, SB_Z = 330;
  const SB_L = norm([-0.5, 0.82, 0.55]);
  const SB_STEPS = [[-820, -360, 360], [-360, -100, 240], [-100, 160, 120]];
  const sbGround = x => (x < -360 ? 360 : x < -100 ? 240 : x < 160 ? 120 : 0);
  const SB_PAL = {
    pink: [255, 86, 156], teal: [20, 206, 196], yellow: [255, 194, 40], lilac: [140, 108, 255],
    mint: [70, 222, 140], orange: [255, 128, 50], blue: [64, 146, 255], coral: [255, 74, 70],
  };
  const SB_HERO_T = 7.0, SB_HOP_T = 8.95;
  const SB_OBJ = [
    { kind: 'cube', R: 68, col: 'pink', z: -130, yaw: 0.38, lands: [[0.55, -480], [1.05, -225, 100], [1.55, 20, 100]] },
    { kind: 'ball', R: 62, col: 'teal', z: 120, lands: [[1.05, -490], [1.55, -235, 100], [2.05, 10, 100], [2.55, 260, 120], [2.8, 305, 42], [2.97, 330, 14]] },
    { kind: 'cube', R: 52, col: 'yellow', z: -150, yaw: -0.3, lands: [[2.05, -500], [2.55, -250, 90]] },
    { kind: 'ball', R: 56, col: 'lilac', z: -175, lands: [[3.05, -520]] },
    { kind: 'cube', R: 58, col: 'mint', z: -260, yaw: 0.72, lands: [[3.55, 280]] },
    { kind: 'ball', R: 34, col: 'orange', z: 30, lands: [[4.05, -490], [4.3, -230, 90, 0.19], [4.55, 20, 90, 0.19], [4.8, 245, 105, 0.19], [4.97, 280, 26]] },
    { kind: 'ball', R: 34, col: 'blue', z: 135, lands: [[4.3, -490], [4.55, -230, 90, 0.19], [4.8, 20, 90, 0.19], [5.05, 190, 105, 0.19], [5.22, 210, 22]] },
    { kind: 'ball', R: 34, col: 'mint', z: 235, lands: [[4.55, -490], [4.8, -230, 90, 0.19], [5.05, 20, 90, 0.19], [5.3, 250, 105, 0.19], [5.47, 270, 22]] },
    { kind: 'ball', R: 30, col: 'lilac', z: 175, lands: [[5.55, -490], [5.8, -230, 90, 0.19], [6.05, 60, 90, 0.19]] },
    { kind: 'ball', R: 30, col: 'orange', z: -30, lands: [[5.8, -490], [6.05, -240, 90, 0.19]] },
    { kind: 'cube', R: 150, col: 'coral', z: 10, yaw: 0.5, hero: true, drop: 2600, lands: [[SB_HERO_T, 640], [SB_HOP_T, 640, 90, 0.42]] },
  ];

  function sbMesh(round, N) {
    const verts = [], quads = [];
    const AX = [[0, 1, 2], [1, 2, 0], [2, 0, 1]];
    const r0 = 1 - round;
    for (const [a, b, cc] of AX) for (const s of [-1, 1]) {
      const base = verts.length / 3;
      for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) {
        const p = [0, 0, 0];
        p[a] = s; p[b] = Math.tan((-1 + 2 * i / N) * Math.PI / 4); p[cc] = Math.tan((-1 + 2 * j / N) * Math.PI / 4);
        const inner = p.map(v => clamp(v, -r0, r0));
        const d = norm([p[0] - inner[0], p[1] - inner[1], p[2] - inner[2]]);
        verts.push(inner[0] + d[0] * round, inner[1] + d[1] * round, inner[2] + d[2] * round);
      }
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const k = base + j * (N + 1) + i;
        quads.push(k, k + 1, k + N + 2, k + N + 1);
      }
    }
    // normalise so the shape spans exactly [-1, 1]
    let m = 0; for (const v of verts) m = Math.max(m, Math.abs(v));
    return { v: new Float32Array(verts.map(x => x / m)), q: new Int32Array(quads) };
  }

  function sbSetup() {
    const objs = SB_OBJ.map((o, i) => {
      const f = 3.3 * Math.sqrt(60 / o.R);
      const imp = [];
      const L = o.lands;
      for (let k = 0; k < L.length; k++) {
        let vy, vx = 0;
        if (k === 0) vy = -Math.sqrt(2 * SB_G * (o.drop || 900));
        else {
          const n = L[k], p = L[k - 1], T = n[3] || (n[0] - p[0]) * 0.76;
          vy = ((sbGround(n[1]) - sbGround(p[1])) - 4 * n[2]) / T; vx = (n[1] - p[1]) / T;
        }
        imp.push({ t: L[k][0], q: clamp(-vy / 2600, 0, 1.25) * (o.hero ? 0.4 : 0.44), sx: clamp(vx * 0.0003, -0.3, 0.3), sz: (hash(i * 7 + k) - 0.5) * 0.12, f });
      }
      if (!o.hero) {
        const H = SB_OBJ[SB_OBJ.length - 1];
        const dx = L[L.length - 1][1] - H.lands[0][1], dz = o.z - H.z, d = Math.hypot(dx, dz);
        imp.push({ t: SB_HERO_T + d / 1800, q: 0.22 * Math.exp(-d / 700), sx: dx / d * 0.16 * Math.exp(-d / 700), sz: dz / d * 0.16 * Math.exp(-d / 700), f });
        imp.push({ t: SB_HOP_T + d / 1800, q: 0.09 * Math.exp(-d / 800), sx: dx / d * 0.06, sz: dz / d * 0.06, f });
      }
      const mesh = sbMesh(o.kind === 'ball' ? 1 : 0.34, o.hero ? 13 : o.kind === 'ball' ? (o.R < 40 ? 11 : 15) : 10);
      return { ...o, c: SB_PAL[o.col], f, imp, mesh, sx: new Float32Array(mesh.v.length / 3), sy: new Float32Array(mesh.v.length / 3), sz: new Float32Array(mesh.v.length / 3), wx: new Float32Array(mesh.v.length / 3), wy: new Float32Array(mesh.v.length / 3), wz: new Float32Array(mesh.v.length / 3) };
    });
    return { objs };
  }

  function sbState(o, t) {
    const L = o.lands;
    let x, by, vy = 0, flying = false;
    if (t < L[0][0]) {
      const d = L[0][0] - t; x = L[0][1]; by = sbGround(x) + 0.5 * SB_G * d * d; vy = -SB_G * d; flying = true;
    } else {
      let k = 0; while (k + 1 < L.length && t >= L[k + 1][0]) k++;
      x = L[k][1]; by = sbGround(x);
      if (k + 1 < L.length) {
        const n = L[k + 1], T = n[3] || (n[0] - L[k][0]) * 0.76, t0 = n[0] - T;
        if (t > t0) {
          const u = (t - t0) / T, g0 = sbGround(L[k][1]), g1 = sbGround(n[1]);
          x = lerp(L[k][1], n[1], u); by = g0 + (g1 - g0) * u + 4 * n[2] * u * (1 - u);
          vy = ((g1 - g0) + 4 * n[2] * (1 - 2 * u)) / T; flying = true;
        }
      }
    }
    let q = 0, shx = 0, shz = 0, rip = 0, ph = 0;
    for (const m of o.imp) {
      const s = t - m.t; if (s <= 0) continue;
      q += m.q * ring(s, m.f, 0.15);
      shx += m.sx * ring(s, m.f * 0.82, 0.11);
      shz += m.sz * ring(s, m.f * 0.71, 0.11);
      const r = m.q * 0.1 * Math.exp(-s * 5); if (r > rip) { rip = r; ph = s * 26; }
    }
    if (flying) q -= clamp(Math.abs(vy) / 5200, 0, 0.26);
    // the hero's final jiggle: a held poke that wobbles out
    return { x, by, q: clamp(q, -0.45, 0.62), shx, shz, rip, ph, flying };
  }

  function sbObject(c, cam, o, S, t) {
    const { v, q: Q } = o.mesh, n = v.length / 3, R = o.R;
    const sy = 1 - S.q, sxz = 1 / Math.sqrt(sy);
    const yaw = (o.yaw || 0) + (S.flying ? 0.0 : 0), cyw = Math.cos(yaw), syw = Math.sin(yaw);
    const { sx, sy: py, sz, wx, wy, wz } = o;
    for (let k = 0; k < n; k++) {
      const ux = v[k * 3], uy = v[k * 3 + 1], uz = v[k * 3 + 2], h = (uy + 1) / 2;
      const bul = 1 + Math.max(0, S.q) * (1.6 * h * (1 - h) * 0.5 + (1 - h) * (1 - h) * 0.35);
      const rr = 1 + S.rip * Math.sin(h * 9 - S.ph) * h;
      let X = ux * R * sxz * bul * rr, Z = uz * R * sxz * bul * rr;
      const Y = (uy + 1) * R * sy;
      X += S.shx * R * h * h; Z += S.shz * R * h * h;
      const xr = X * cyw - Z * syw, zr = X * syw + Z * cyw;
      wx[k] = S.x + xr; wy[k] = S.by + Y; wz[k] = o.z + zr;
      const p = cam.proj(wx[k], wy[k], wz[k]); sx[k] = p[0]; py[k] = p[1]; sz[k] = p[2];
    }
    const ccx = S.x, ccy = S.by + R * sy, ccz = o.z;
    const vis = [];
    for (let i = 0; i < Q.length; i += 4) {
      const a = Q[i], b = Q[i + 1], d = Q[i + 2], e = Q[i + 3];
      const e1 = [wx[d] - wx[a], wy[d] - wy[a], wz[d] - wz[a]], e2 = [wx[e] - wx[b], wy[e] - wy[b], wz[e] - wz[b]];
      let nn = norm(cross(e1, e2));
      const mx = (wx[a] + wx[b] + wx[d] + wx[e]) / 4, my = (wy[a] + wy[b] + wy[d] + wy[e]) / 4, mz = (wz[a] + wz[b] + wz[d] + wz[e]) / 4;
      if (nn[0] * (mx - ccx) + nn[1] * (my - ccy) + nn[2] * (mz - ccz) < 0) nn = [-nn[0], -nn[1], -nn[2]];
      const V = norm([cam.eye[0] - mx, cam.eye[1] - my, cam.eye[2] - mz]);
      const nv = dot(nn, V);
      if (nv <= 0.0) continue;
      vis.push({ i, z: (sz[a] + sz[b] + sz[d] + sz[e]) / 4, nn, V, nv, h: (my - S.by) / (2 * R * sy) });
    }
    vis.sort((p, q2) => q2.z - p.z);
    const base = o.c, deep = mix3(mul3(base, 0.5), [60, 0, 60], 0.18), lite = mix3(base, [255, 250, 245], 0.38);
    const ball = o.kind === 'ball';
    const Hk = norm([SB_L[0], SB_L[1], SB_L[2]]);
    let best = null, bestS = -1;
    c.lineJoin = 'round';
    for (const f of vis) {
      const { nn, V, nv } = f;
      const lam = dot(nn, SB_L), wrap = clamp((lam + 0.45) / 1.45);
      let col = mix3(deep, base, Math.pow(wrap, 0.8));
      col = mul3(col, 0.86 + 0.2 * clamp(f.h));
      const fres = Math.pow(1 - nv, 2.2);
      col = mix3(col, lite, fres * 0.62);
      // translucency: light passing through to the shadow side
      const thru = clamp(-lam) * (1 - nv * 0.4);
      col = mix3(col, mix3(base, [255, 255, 220], 0.15), thru * 0.35);
      if (nn[1] < -0.2) col = mix3(col, mix3(base, [255, 255, 255], 0.2), -nn[1] * 0.25);
      const Hh = norm([Hk[0] + V[0], Hk[1] + V[1], Hk[2] + V[2]]);
      const sp = Math.pow(Math.max(0, dot(nn, Hh)), 28);
      // softbox reflection (window strip)
      const rf = [2 * nv * nn[0] - V[0], 2 * nv * nn[1] - V[1], 2 * nv * nn[2] - V[2]];
      const box = ss(0.62, 0.7, rf[1]) * ss(-0.75, -0.45, rf[0]) * (1 - ss(0.05, 0.3, rf[0]));
      if (!ball) col = mix3(col, [255, 255, 255], clamp(sp * 0.45 + box * 0.38));
      if (sp > bestS) { bestS = sp; best = f; }
      const a = Q[f.i], b = Q[f.i + 1], d = Q[f.i + 2], e = Q[f.i + 3];
      c.beginPath(); c.moveTo(sx[a], py[a]); c.lineTo(sx[b], py[b]); c.lineTo(sx[d], py[d]); c.lineTo(sx[e], py[e]); c.closePath();
      const s = rgb(col); c.fillStyle = s; c.strokeStyle = s; c.lineWidth = 1.1; c.fill(); c.stroke();
    }
    // silhouette clip for smooth overlays: inner glow + hotspot
    c.save();
    c.beginPath();
    for (const f of vis) { const a = Q[f.i], b = Q[f.i + 1], d = Q[f.i + 2], e = Q[f.i + 3]; c.moveTo(sx[a], py[a]); c.lineTo(sx[b], py[b]); c.lineTo(sx[d], py[d]); c.lineTo(sx[e], py[e]); c.closePath(); }
    c.clip();
    const pc = cam.proj(ccx, S.by + R * sy * 0.55, ccz), pr = cam.F * R / pc[2];
    let g = c.createRadialGradient(pc[0] + pr * 0.25, pc[1] + pr * 0.35, 0, pc[0] + pr * 0.25, pc[1] + pr * 0.35, pr * 1.3);
    g.addColorStop(0, rgb(mix3(base, [255, 255, 230], 0.35), 0.5)); g.addColorStop(1, rgb(base, 0));
    c.globalCompositeOperation = 'screen'; c.fillStyle = g; c.fillRect(pc[0] - pr * 2, pc[1] - pr * 2, pr * 4, pr * 4);
    c.globalCompositeOperation = 'source-over';
    if (best) {
      const a = Q[best.i], d = Q[best.i + 2];
      const hx = (sx[a] + sx[d]) / 2, hy = (py[a] + py[d]) / 2, hr = pr * 0.32;
      g = c.createRadialGradient(hx, hy, 0, hx, hy, hr);
      g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.25, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.beginPath(); c.ellipse(hx, hy, hr * sxz, hr * sy, 0, 0, TAU); c.fill();
    }
    if (ball) {
      // curved softbox window reflection
      const top = cam.proj(ccx, S.by + R * sy * 1.55, ccz);
      const wx0 = pc[0] - pr * 0.42 * sxz, wy0 = lerp(top[1], pc[1], 0.18);
      c.save(); c.translate(wx0, wy0); c.rotate(-0.55); c.scale(sxz, sy);
      g = c.createLinearGradient(0, -pr * 0.2, 0, pr * 0.25);
      g.addColorStop(0, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0.05)');
      c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, pr * 0.42, pr * 0.2, 0, 0, TAU); c.fill(); c.restore();
      // rim kick from the back light
      c.lineWidth = pr * 0.16; c.strokeStyle = rgb(mix3(base, [255, 255, 255], 0.55), 0.35);
      c.beginPath(); c.ellipse(pc[0], cam.proj(ccx, S.by + R * sy, ccz)[1], pr * sxz * 1.02, pr * sy * 1.02, 0, -0.2, 1.5); c.stroke();
    }
    c.restore();
  }

  function sbShadow(c, cam, o, S) {
    const g0 = sbGround(S.x), hgt = Math.max(0, S.by - g0), R = o.R * (1 / Math.sqrt(1 - S.q));
    const fade = Math.exp(-hgt / (o.hero ? 900 : 380));
    if (fade < 0.02) return;
    // clip to the tread the object stands over
    c.save();
    if (g0 > 0) {
      const st = SB_STEPS.find(s => S.x >= s[0] && S.x < s[1]);
      const P = [[st[0], g0, -SB_Z], [st[1], g0, -SB_Z], [st[1], g0, SB_Z], [st[0], g0, SB_Z]].map(p => cam.proj(...p));
      c.beginPath(); P.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip();
    }
    const blob = (ox, oz, rad, stops) => {
      const C = cam.proj(S.x + ox, g0 + 0.5, o.z + oz), A = cam.proj(S.x + ox + rad, g0 + 0.5, o.z + oz), B = cam.proj(S.x + ox, g0 + 0.5, o.z + oz + rad);
      c.save(); c.transform(A[0] - C[0], A[1] - C[1], B[0] - C[0], B[1] - C[1], C[0], C[1]);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
      stops.forEach(s => g.addColorStop(s[0], s[1]));
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 1, 0, TAU); c.fill(); c.restore();
    };
    const spread = 1 + hgt / 500;
    blob(R * 0.25, -R * 0.2, R * 2.1 * spread, [[0, `rgba(96,52,86,${0.22 * fade})`], [1, 'rgba(96,52,86,0)']]);
    blob(R * 0.08, -R * 0.06, R * 1.12 * spread, [[0, `rgba(70,30,66,${0.42 * fade * fade})`], [0.6, `rgba(70,30,66,${0.2 * fade * fade})`], [1, 'rgba(70,30,66,0)']]);
    // transmitted colour caustic, pushed away from the key light
    blob(R * 0.75, -R * 0.65, R * 1.0, [[0, rgb(mix3(o.c, [255, 255, 255], 0.25), 0.34 * fade)], [1, rgb(o.c, 0)]]);
    c.restore();
  }

  function sbQuad(c, P, fill) { c.beginPath(); P.forEach((p, k) => (k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fillStyle = fill; c.fill(); }
  function sbStairs(c, cam) {
    const pr = (x, y, z) => cam.proj(x, y, z);
    for (let i = 0; i < SB_STEPS.length; i++) {
      const [x0, x1, y] = SB_STEPS[i], yLow = i + 1 < SB_STEPS.length ? SB_STEPS[i + 1][2] : 0;
      // +z side
      if (cam.eye[2] > SB_Z) {
      const side = [pr(x0, 0, SB_Z), pr(x1, 0, SB_Z), pr(x1, y, SB_Z), pr(x0, y, SB_Z)];
      const g = c.createLinearGradient(side[3][0], side[3][1], side[0][0], side[0][1]);
      g.addColorStop(0, '#f6eaea'); g.addColorStop(0.75, '#ead6dc'); g.addColorStop(1, '#d4b8c6');
      sbQuad(c, side, g);
      }
      // riser (+x)
      const ris = [pr(x1, yLow, -SB_Z), pr(x1, yLow, SB_Z), pr(x1, y, SB_Z), pr(x1, y, -SB_Z)];
      let g = c.createLinearGradient(...pr(x1, y, 0).slice(0, 2), ...pr(x1, yLow, 0).slice(0, 2));
      g.addColorStop(0, '#d9bccb'); g.addColorStop(0.7, '#cbaabd'); g.addColorStop(1, '#b391a8');
      sbQuad(c, ris, g);
      // tread
      const top = [pr(x0, y, -SB_Z), pr(x1, y, -SB_Z), pr(x1, y, SB_Z), pr(x0, y, SB_Z)];
      g = c.createLinearGradient(...pr(x0, y, -SB_Z).slice(0, 2), ...pr(x1, y, SB_Z).slice(0, 2));
      g.addColorStop(0, '#f6eceb'); g.addColorStop(1, '#fbf3f0');
      sbQuad(c, top, g);
      // AO where the tread meets the riser above it
      if (i > 0) {
        const a = pr(x0, y, 0), b = pr(x0 + 70, y, 0);
        g = c.createLinearGradient(a[0], a[1], b[0], b[1]);
        g.addColorStop(0, 'rgba(120,70,100,0.28)'); g.addColorStop(1, 'rgba(120,70,100,0)');
        sbQuad(c, [pr(x0, y, -SB_Z), pr(x0 + 70, y, -SB_Z), pr(x0 + 70, y, SB_Z), pr(x0, y, SB_Z)], g);
      }
      // bevelled nosing highlights
      c.lineCap = 'round';
      const n0 = pr(x1, y, -SB_Z), n1 = pr(x1, y, SB_Z), n2 = pr(x0, y, SB_Z);
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(n0[0], n0[1]); c.lineTo(n1[0], n1[1]); c.lineTo(n2[0], n2[1]); c.stroke();
      const v0 = pr(x1, yLow, SB_Z);
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(n1[0], n1[1]); c.lineTo(v0[0], v0[1]); c.stroke();
    }
  }
  function sbFloorShade(c, cam) {
    const pr = (x, y, z) => cam.proj(x, y, z);
    // soft cast shadow of the staircase, thrown away from the key light
    c.save(); c.filter = 'blur(26px)';
    const sh = [];
    const k = 1 / SB_L[1];
    [[-820, 360], [-360, 360], [-360, 240], [-100, 240], [-100, 120], [160, 120], [160, 0]].forEach(([x, y]) => sh.push([x - SB_L[0] * y * k * 0.9, -SB_Z - SB_L[2] * y * k * 0.9]));
    const P = [pr(-820, 0, -SB_Z), ...sh.map(p => pr(p[0], 0, p[1])), pr(160 - SB_L[0] * 120 * k * 0.9, 0, SB_Z - SB_L[2] * 120 * k * 0.9), pr(160, 0, SB_Z), pr(-820, 0, SB_Z)];
    c.beginPath(); P.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    c.fillStyle = 'rgba(120,70,110,0.16)'; c.fill();
    c.restore();
    // floor AO along the stair base
    const a = pr(160, 0, 0), b = pr(260, 0, 0);
    let g = c.createLinearGradient(a[0], a[1], b[0], b[1]);
    g.addColorStop(0, 'rgba(110,60,96,0.26)'); g.addColorStop(1, 'rgba(110,60,96,0)');
    sbQuad(c, [pr(160, 0, -SB_Z), pr(260, 0, -SB_Z), pr(260, 0, SB_Z), pr(160, 0, SB_Z)], g);
    const s0 = pr(-400, 0, SB_Z), s1 = pr(-400, 0, SB_Z + 60);
    g = c.createLinearGradient(s0[0], s0[1], s1[0], s1[1]);
    g.addColorStop(0, 'rgba(110,60,96,0.2)'); g.addColorStop(1, 'rgba(110,60,96,0)');
    sbQuad(c, [pr(-820, 0, SB_Z), pr(160, 0, SB_Z), pr(200, 0, SB_Z + 60), pr(-820, 0, SB_Z + 60)], g);
  }

  function sbCamera(t, W, H) {
    const ex = kf(t, [[0, 640], [3.6, 1050, E.ioS], [6.6, 1350, E.ioS], [10, 1400, E.ioS]]);
    const ey = kf(t, [[0, 820], [3.6, 900, E.ioS], [6.6, 1000, E.ioS], [10, 860, E.ioS]]);
    const ez = kf(t, [[0, 980], [3.6, 1300, E.ioS], [6.6, 1550, E.ioS], [10, 1450, E.ioS]]);
    const tx = kf(t, [[0, -430], [3.6, -170, E.ioS], [6.6, 60, E.ioS], [10, 150, E.ioS]]);
    const ty = kf(t, [[0, 330], [3.6, 220, E.ioS], [6.6, 150, E.ioS], [10, 230, E.ioS]]);
    const F = kf(t, [[0, 1700], [6.6, 1750], [10, 1950]]);
    const shk = Math.exp(-Math.max(0, t - SB_HERO_T) * 7) * (t > SB_HERO_T ? 1 : 0);
    const ox = shk * Math.sin(t * 95) * 10, oy = shk * Math.cos(t * 77) * 14;
    return lookCam([ex, ey, ez], [tx, ty, 0], F, W, H, ox, oy);
  }

  function sbTitle(c, t) {
    const word = 'SOFT BODY', cols = ['pink', 'teal', 'yellow', 'lilac', null, 'orange', 'blue', 'mint', 'coral'];
    c.save();
    c.font = '700 168px Fredoka, sans-serif';
    const widths = [...word].map(ch => c.measureText(ch).width);
    const tot = widths.reduce((a, b) => a + b, 0);
    let x = 1240 - tot / 2;
    const BY = 300;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i], w = widths[i];
      if (ch === ' ') { x += w; continue; }
      const tl = 7.75 + i * 0.075;
      let y = BY, q = 0;
      if (t < tl) { const d = tl - t; y = BY - 0.5 * 9000 * d * d; q = -clamp(9000 * d / 9000, 0, 0.3); }
      q += 0.42 * ring(t - tl, 3.2, 0.17) + 0.16 * ring(t - SB_HOP_T - 0.05 - i * 0.025, 3.6, 0.15);
      if (y < -120) { x += w; continue; }
      const col = SB_PAL[cols[i]], cx = x + w / 2;
      const syy = 1 - q, sxx = 1 / Math.sqrt(Math.max(0.3, syy));
      // shadow on the backdrop
      const land = clamp(1 - (BY - y) / 500);
      c.save(); c.translate(cx, BY + 14); c.scale(sxx, 1);
      const sg = c.createRadialGradient(0, 0, 0, 0, 0, w * 0.6);
      sg.addColorStop(0, `rgba(90,40,80,${0.3 * land})`); sg.addColorStop(1, 'rgba(90,40,80,0)');
      c.fillStyle = sg; c.scale(1, 0.16); c.beginPath(); c.arc(0, 0, w * 0.6, 0, TAU); c.fill(); c.restore();
      c.save(); c.translate(cx, y); c.scale(sxx, syy);
      c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      const g = c.createLinearGradient(0, -130, 0, 0);
      g.addColorStop(0, rgb(mix3(col, [255, 255, 255], 0.45))); g.addColorStop(0.45, rgb(col)); g.addColorStop(1, rgb(mix3(mul3(col, 0.62), [80, 0, 70], 0.2)));
      c.fillStyle = g; c.fillText(ch, 0, 0);
      c.save(); c.globalCompositeOperation = 'source-atop';
      c.restore();
      c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.save(); c.beginPath(); c.rect(-w, -170, w * 2, 60); c.clip(); c.strokeText(ch, 0, 0); c.restore();
      c.restore();
      x += w;
    }
    c.restore();
    const sa = E.outC(seg(t, 8.5, 9.1));
    if (sa > 0) {
      text(c, 'JELLY PHYSICS  ·  SOFT-BODY SIMULATION  ·  2010s —', 1240, 372, { font: MONO, size: 18, ls: 4, align: 'center', color: `rgba(120,60,104,${0.85 * sa})` });
      c.fillStyle = `rgba(255,86,156,${sa})`;
      const lw = 90 * E.outQt(sa);
      c.fillRect(1240 - lw, 392, lw * 2, 3);
    }
  }

  MG.film({
    id: 'softbody', dur: 10, poster: 9.5,
    fonts: [['700 80px Fredoka', 'SOFT BODY'], ['400 16px "JetBrains Mono"', 'Aa1·—']],
    meta: {
      family: 'D', name: 'Soft Body Motion', sub: 'Jelly Physics', era: '2010s —',
      origin: 'Grew out of cloth and soft-body solvers (Houdini Vellum, Cinema 4D Soft Body dynamics, Blender soft body) once they became fast enough for artists to loop; the squishy, glossy "oddly satisfying" jelly loop became a staple of Instagram and Behance motion reels in the late 2010s.',
      works: 'Andreas Wannerstedt — Oddly Satisfying loops (2017–) · SideFX Houdini Vellum launch demos (2018) · Tendril / ManvsMachine C4D soft-body reels · Cinema 4D R21 Soft Body showcases',
      tech: ['Analytic damped-spring squash, stretch and shear', 'Volume-preserving vertex deformation of rounded-box meshes', 'Wrap lighting + fresnel + transmitted colour shadows'],
      accent: '#ff569c',
      motionDNA: 'Objects drop and hop on the beat, squash on contact, overshoot into stretch and wobble out on low-damped springs, so every landing reads as a satisfying rhythmic hit.',
      visualDNA: 'Glossy translucent candy colours, rounded bevels, soft studio key with coloured contact shadows on a seamless pastel set.',
      transitions: 'Drop-in, squash-and-stretch hits, sympathetic jiggle, letters landing as jelly.',
      implementation: ['Houdini Vellum', 'Cinema 4D Soft Body', 'Blender', 'Canvas 2D'],
      reproducibility: 'Fully procedural', loopable: false,
    },
    setup() { return sbSetup(); },
    draw(c, t, W, H, st) {
      const cam = sbCamera(t, W, H);
      // seamless pastel set
      const bg = c.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#d9c0dc'); bg.addColorStop(0.55, '#ead0d8'); bg.addColorStop(1, '#f3dbd6');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      const lp = cam.proj(500, 0, 0);
      const pool = c.createRadialGradient(lp[0], lp[1], 0, lp[0], lp[1], 900);
      pool.addColorStop(0, 'rgba(255,248,240,0.75)'); pool.addColorStop(1, 'rgba(255,248,240,0)');
      c.fillStyle = pool; c.fillRect(0, 0, W, H);
      sbFloorShade(c, cam);
      sbStairs(c, cam);
      const S = st.objs.map(o => sbState(o, t));
      st.objs.forEach((o, i) => sbShadow(c, cam, o, S[i]));
      const order = st.objs.map((o, i) => i).filter(i => S[i].by < 2400)
        .map(i => ({ i, z: cam.proj(S[i].x, S[i].by + st.objs[i].R, st.objs[i].z)[2] })).sort((a, b) => b.z - a.z);
      for (const { i } of order) sbObject(c, cam, st.objs[i], S[i], t);
      // hero impact: soft shockwave ring on the floor
      const sw = seg(t, SB_HERO_T, SB_HERO_T + 0.7);
      if (sw > 0 && sw < 1) {
        const C = cam.proj(640, 1, 10), A = cam.proj(640 + 1, 1, 10), B = cam.proj(640, 1, 11);
        c.save(); c.transform(A[0] - C[0], A[1] - C[1], B[0] - C[0], B[1] - C[1], C[0], C[1]);
        c.strokeStyle = `rgba(255,255,255,${0.6 * (1 - sw)})`; c.lineWidth = 14 * (1 - sw) + 2;
        c.beginPath(); c.arc(0, 0, 220 + 700 * E.outC(sw), 0, TAU); c.stroke(); c.restore();
      }
      if (t > 7.6) sbTitle(c, t);
      if (t < 0.45) { c.fillStyle = `rgba(250,236,236,${1 - E.outC(seg(t, 0, 0.45))})`; c.fillRect(0, 0, W, H); }
      grain(c, W, H, t, 0.035);
      vignette(c, W, H, 0.22, '120,60,110');
    },
    score(A) {
      // pad + soft groove
      A.chord(0.3, [53, 60, 64, 67, 72], { type: 'triangle', dur: 6.6, g: 0.022, a: 1.4, hold: true, rel: 0.8, lp: 900, lp2: 2200, lpT: 5, spread: 6, width: 1.2, rev: 0.5 });
      for (let b = 0; b < 12; b++) A.kick(0.55 + b * 0.5, 0.22, { f: 110, f2: 45, dur: 0.25 });
      for (let k = 0; k < 24; k++) A.hat(0.8 + k * 0.25, k % 2 ? 0.035 : 0.05, false, { pan: k % 2 ? 0.3 : -0.3 });
      // every landing: a pitched jelly "bloop" + squelch
      const scale = [72, 74, 76, 79, 81, 84, 86];
      SB_OBJ.forEach((o, i) => o.lands.forEach((L, k) => {
        if (o.hero) return;
        const big = o.R / 60, m = scale[(i * 2 + k) % 7] - Math.round((big - 1) * 7) - (k === 0 ? 0 : 0);
        const f = midi(m), g = (k === 0 ? 0.16 : 0.11) * (o.R < 40 ? 0.8 : 1);
        A.osc(L[0], { f: f * 0.6, f2: f, glide: 0.05, dur: 0.22, g, a: 0.003, pan: clamp(L[1] / 900, -0.7, 0.7) });
        A.osc(L[0] + 0.04, { f, f2: f * 0.8, glide: 0.18, dur: 0.24, g: g * 0.5, vib: [11, 18], pan: clamp(L[1] / 900, -0.7, 0.7), rev: 0.2 });
        A.noise(L[0], { type: 'bandpass', f: 1300, f2: 380, sweep: 0.1, q: 2.5, dur: 0.12, g: 0.05 });
      }));
      // hero incoming
      A.riser(5.95, 1.05, { g: 0.12, f: 87.3 });
      A.osc(6.2, { f: 500, f2: 140, glide: 0.8, dur: 0.82, g: 0.04, type: 'triangle', lp: 1800 });
      // HERO lands: big wobbling jelly "wub"
      A.impact(SB_HERO_T, 0.55, { rev: 0.4 });
      A.osc(SB_HERO_T, { f: 70, f2: 48, glide: 0.5, dur: 1.4, g: 0.32, vib: [2.2, 8] });
      A.osc(SB_HERO_T + 0.02, { f: 220, f2: 160, glide: 0.9, dur: 1.1, g: 0.07, type: 'triangle', vib: [4.4, 22], lp: 1200, rev: 0.3 });
      A.noise(SB_HERO_T, { type: 'bandpass', f: 900, f2: 200, sweep: 0.3, q: 2, dur: 0.35, g: 0.12 });
      A.chord(SB_HERO_T + 0.05, [41, 48, 53, 57, 60, 64], { type: 'triangle', dur: 2.8, g: 0.026, a: 0.04, rev: 0.6, width: 1.3, lp: 2400 });
      // letters land one by one
      [76, 79, 81, 84, 86, 88, 91, 93].forEach((m, i) => {
        const tl = 7.75 + [0, 1, 2, 3, 5, 6, 7, 8][i] * 0.075;
        A.osc(tl, { f: midi(m) * 0.55, f2: midi(m), glide: 0.04, dur: 0.2, g: 0.08, pan: (i / 7 - 0.5) * 1.2 });
      });
      // final hero jiggle: the boing
      A.osc(SB_HOP_T - 0.42, { f: 180, f2: 520, glide: 0.3, dur: 0.36, g: 0.07, type: 'triangle', lp: 2000 });
      A.osc(SB_HOP_T, { f: 90, f2: 60, glide: 0.4, dur: 0.9, g: 0.26, vib: [2.4, 6] });
      A.osc(SB_HOP_T, { f: 392, f2: 330, glide: 0.6, dur: 0.8, g: 0.06, vib: [7, 28], rev: 0.3 });
      A.chord(SB_HOP_T, [53, 60, 65, 69, 72, 76], { type: 'sine', dur: 1.1, g: 0.03, a: 0.01, rev: 0.7, width: 1.4 });
      A.bell(SB_HOP_T + 0.05, midi(88), { g: 0.04, dur: 1.0 });
    },
  });
  /* ================= D · WIREFRAME 3D — vector CRT ================= */
  const WF_P = [40, 255, 120], WF_W = [210, 255, 225], WF_A = [255, 168, 56];
  function wfHash(i, j) {
    let n = (Math.imul(i, 374761393) + Math.imul(j, 668265263)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16;
    return (n >>> 0) / 4294967296;
  }
  function wfNoise(x, y) {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return lerp(lerp(wfHash(i, j), wfHash(i + 1, j), u), lerp(wfHash(i, j + 1), wfHash(i + 1, j + 1), u), v);
  }
  const WF_CELL = 120;
  const wfAmp = t => kf(t, [[0, 1], [6.6, 0.8], [8.2, 0, E.ioC]]);
  function wfHeight(x, z, amp) {
    const v = ss(200, 1500, Math.abs(x));
    const ridge = 1 - Math.abs(wfNoise(x / 700 + 3, z / 700) * 2 - 1);
    return amp * (v * (0.25 + 0.75 * ridge) * 900 + 40 * wfNoise(x / 230, z / 230 + 7));
  }
  const wfCamZ = t => 1300 * t - 50 * Math.max(0, t - 5) ** 2;

  function wfPolyhedra() {
    const ph = (1 + Math.sqrt(5)) / 2;
    const icoV = [[-1, ph, 0], [1, ph, 0], [-1, -ph, 0], [1, -ph, 0], [0, -1, ph], [0, 1, ph], [0, -1, -ph], [0, 1, -ph], [ph, 0, -1], [ph, 0, 1], [-ph, 0, -1], [-ph, 0, 1]].map(norm);
    const icoF = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    // dodecahedron = dual of the icosahedron
    const dodV = icoF.map(f => norm([0, 1, 2].map(k => icoV[f[0]][k] + icoV[f[1]][k] + icoV[f[2]][k])));
    const dodF = icoV.map((v, vi) => {
      const fs = icoF.map((f, i) => i).filter(i => icoF[i].includes(vi));
      const ref = norm(cross(v, Math.abs(v[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0])), ref2 = cross(v, ref);
      return fs.sort((a, b) => Math.atan2(dot(dodV[a], ref2), dot(dodV[a], ref)) - Math.atan2(dot(dodV[b], ref2), dot(dodV[b], ref)));
    });
    const octV = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    const octF = [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]];
    // geodesic: icosahedron subdivided twice
    let V = icoV.map(v => v.slice()), F = icoF.map(f => f.slice());
    for (let it = 0; it < 2; it++) {
      const mid = new Map(), F2 = [];
      const m = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (!mid.has(k)) { mid.set(k, V.length); V.push(norm([0, 1, 2].map(i => (V[a][i] + V[b][i]) / 2))); } return mid.get(k); };
      for (const [a, b, c2] of F) { const ab = m(a, b), bc = m(b, c2), ca = m(c2, a); F2.push([a, ab, ca], [b, bc, ab], [c2, ca, bc], [ab, bc, ca]); }
      F = F2;
    }
    return { ico: wfMesh(icoV, icoF), dod: wfMesh(dodV, dodF), oct: wfMesh(octV, octF), geo: wfMesh(V, F) };
  }
  function wfMesh(V, F) {
    const em = new Map(), E2 = [];
    F.forEach((f, fi) => f.forEach((a, k) => {
      const b = f[(k + 1) % f.length], key = a < b ? a + '_' + b : b + '_' + a;
      if (em.has(key)) E2[em.get(key)][3] = fi; else { em.set(key, E2.length); E2.push([a, b, fi, -1]); }
    }));
    return { V, F, E: E2 };
  }
  function wfRot(yaw, pitch, roll = 0) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    return v => {
      let x = v[0] * cr - v[1] * sr, y = v[0] * sr + v[1] * cr, z = v[2];
      const x1 = x * cy + z * sy, z1 = -x * sy + z * cy;
      return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
    };
  }
  // project a mesh placed at screen centre (cx, cy) with radius s; returns screen verts, cam verts and face visibility
  function wfPlace(mesh, rot, s, cx, cy, D = 1000, F = 1000) {
    const P = mesh.V.map(v => { const r = rot(v); return [r[0] * s, r[1] * s, r[2] * s + D]; });
    const S = P.map(p => [cx + F * p[0] / p[2], cy - F * p[1] / p[2], p[2]]);
    const vis = mesh.F.map(f => {
      const a = P[f[0]], b = P[f[1]], c2 = P[f[2]];
      let n = cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c2[0] - a[0], c2[1] - a[1], c2[2] - a[2]]);
      const ctr = [0, 1, 2].map(k => f.reduce((acc, i) => acc + P[i][k], 0) / f.length);
      if (dot(n, [ctr[0], ctr[1], ctr[2] - D]) < 0) n = n.map(x => -x);
      return dot(n, ctr) < 0;
    });
    return { P, S, vis };
  }

  const WF_FONT = {
    W: [[[0, 6], [1, 0], [2, 4], [3, 0], [4, 6]]],
    I: [[[2, 0], [2, 6]], [[1, 0], [3, 0]], [[1, 6], [3, 6]]],
    R: [[[0, 0], [0, 6], [3, 6], [4, 5], [4, 4], [3, 3], [0, 3]], [[2, 3], [4, 0]]],
    E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
    F: [[[0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
    A: [[[0, 0], [0, 4], [2, 6], [4, 4], [4, 0]], [[0, 2], [4, 2]]],
    M: [[[0, 0], [0, 6], [2, 4], [4, 6], [4, 0]]],
  };
  function wfLogo() {
    const word = 'WIREFRAME', D = 1.0, out = [];
    [...word].forEach((ch, li) => {
      const ox = li * 5.6 - 24.4;
      const verts = new Map();
      WF_FONT[ch].forEach(pl => {
        for (let k = 0; k + 1 < pl.length; k++) {
          const a = pl[k], b = pl[k + 1];
          out.push({ a: [ox + a[0], a[1] - 3, D], b: [ox + b[0], b[1] - 3, D], kind: 0, li });
          out.push({ a: [ox + a[0], a[1] - 3, -D], b: [ox + b[0], b[1] - 3, -D], kind: 1, li });
        }
        pl.forEach(p => verts.set(p[0] + ',' + p[1], p));
      });
      verts.forEach(p => out.push({ a: [ox + p[0], p[1] - 3, D], b: [ox + p[0], p[1] - 3, -D], kind: 2, li }));
    });
    return out;
  }

  function wfSetup() {
    const R = rng(808);
    const mtn = [];
    for (let k = 0; k <= 90; k++) {
      const peak = (k % 13 === 4) ? 1 : (k % 7 === 2 ? 0.6 : 0);
      mtn.push(18 + R() * 40 + peak * (70 + R() * 60));
    }
    const S = offscreen(1920, 1080), B1 = offscreen(480, 270), B2 = offscreen(240, 135);
    const sl = offscreen(4, 4), g = sl.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 2, 4, 2);
    const geoOrder = null;
    return { mtn, S, B1, B2, sl, polys: wfPolyhedra(), logo: wfLogo(), geoOrder };
  }

  // line batch: segments bucketed by intensity, stroked with a white-hot core
  function wfLines(c, segs, col, lw, hot = 0.35) {
    const B = 7, bk = Array.from({ length: B }, () => []);
    for (let i = 0; i < segs.length; i += 5) { const a = segs[i + 4]; if (a > 0.015) bk[Math.min(B - 1, (a * B) | 0)].push(i); }
    c.lineCap = 'round';
    for (let b = 0; b < B; b++) {
      if (!bk[b].length) continue;
      const lv = (b + 0.7) / B;
      c.strokeStyle = rgb(mix3(col, WF_W, hot * lv), Math.min(1, lv * 1.1)); c.lineWidth = lw;
      c.beginPath();
      for (const i of bk[b]) { c.moveTo(segs[i], segs[i + 1]); c.lineTo(segs[i + 2], segs[i + 3]); }
      c.stroke();
    }
  }
  function wfDots(c, pts, col, r) {
    c.fillStyle = rgb(mix3(col, WF_W, 0.6));
    c.beginPath();
    for (let i = 0; i < pts.length; i += 3) { if (pts[i + 2] <= 0.05) continue; c.moveTo(pts[i] + r, pts[i + 1]); c.arc(pts[i], pts[i + 1], r * (0.6 + 0.4 * pts[i + 2]), 0, TAU); }
    c.fill();
  }

  function wfTerrain(c, t, W, H, st, dim) {
    const zc = wfCamZ(t), amp = wfAmp(t);
    const ex = 70 * Math.sin(t * 0.45);
    const ey = kf(t, [[0, 150], [2.6, 240], [5, 330], [7.4, 260], [8.4, 230], [10, 210]]) + wfHeight(ex, zc, amp) * 0.4;
    const look = kf(t, [[0, 90], [2.6, 30], [5, -80], [7.4, -100], [8.4, -150], [10, -160]]);
    const cam = lookCam([ex, ey, zc], [ex * 0.6, ey - look, zc + 1000], 1100, W, H);
    // horizon features
    const hz = cam.proj(ex, ey, zc + 1e6)[1];
    const off = (t * 9 + ex * 0.08) % 52;
    const seg2 = [];
    const ma = 0.55 * dim;
    for (let k = 0; k < 44; k++) {
      const x0 = k * 52 - off - 52, x1 = x0 + 52, i = (k + Math.floor((t * 9 + ex * 0.08) / 52)) % 90;
      seg2.push(x0, hz - st.mtn[i], x1, hz - st.mtn[(i + 1) % 90], ma);
    }
    wfLines(c, seg2, WF_P, 1.6, 0.2);
    // crescent moon
    c.strokeStyle = rgb(WF_P, 0.7 * dim * (1 - seg(t, 7.2, 7.6))); c.lineWidth = 1.8;
    c.beginPath(); c.arc(1500, hz - 400, 46, -2.2, 2.2, false); c.arc(1480, hz - 405, 40, 1.95, -1.95, true); c.stroke();
    // terrain grid with hidden-line removal: rows painted back to front, each filled black then stroked
    const j0 = Math.floor(zc / WF_CELL) + 1, NZ = 46, NX = 22;
    const row = [];
    c.lineJoin = 'round';
    for (let j = j0 + NZ; j >= j0; j--) {
      const z = j * WF_CELL;
      const pts = [];
      for (let i = -NX; i <= NX; i++) {
        const x = i * WF_CELL;
        pts.push(cam.proj(x, wfHeight(x, z, amp), z));
      }
      if (row.length) {
        const prev = row[0];
        const dz = z - zc, fade = (1 - ss(1500, 5400, dz)) * dim;
        c.beginPath();
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1], p2 = prev[i + 1], p1 = prev[i];
          if (a[2] < 5 || p1[2] < 5 || b[2] < 5 || p2[2] < 5) continue;
          c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(p2[0], p2[1]); c.lineTo(p1[0], p1[1]); c.closePath();
        }
        c.fillStyle = '#000'; c.fill();
        c.strokeStyle = rgb(mix3(WF_P, WF_W, 0.15 * fade), fade * 0.9); c.lineWidth = 1.3 + (1 - ss(300, 2500, dz)) * 1.2; c.stroke();
      }
      row[0] = pts;
    }
    // Battlezone-style obstacles along the valley: faces filled black (hidden-line), edges stroked
    const obs = [];
    const k0 = Math.floor(zc / 650);
    for (let k = k0 + 9; k >= k0 + 1; k--) {
      const side = wfHash(k, 3) > 0.5 ? 1 : -1, x = side * (260 + wfHash(k, 4) * 520), z = k * 650 + wfHash(k, 5) * 200;
      const sz = 70 + wfHash(k, 6) * 90, y0 = wfHeight(x, z, amp), rot = wfHash(k, 7) * 3 + t * 0.2 * side;
      const pyr = wfHash(k, 8) > 0.45;
      const cr = Math.cos(rot), sr = Math.sin(rot);
      const P = (dx, dy, dz) => cam.proj(x + dx * cr - dz * sr, y0 + dy, z + dx * sr + dz * cr);
      const b = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [u * sz, v * sz]);
      let faces;
      if (pyr) { const ap = P(0, sz * 1.9, 0), bs = b.map(q => P(q[0], 0, q[1])); faces = [0, 1, 2, 3].map(i => [bs[i], bs[(i + 1) % 4], ap]); }
      else { const lo = b.map(q => P(q[0], 0, q[1])), hi = b.map(q => P(q[0], sz * 1.6, q[1])); faces = [hi, ...[0, 1, 2, 3].map(i => [lo[i], lo[(i + 1) % 4], hi[(i + 1) % 4], hi[i]])]; }
      if (faces.some(f => f.some(p => p[2] < 30))) continue;
      const dz = z - zc, fade = (1 - ss(1500, 5400, dz)) * dim;
      c.beginPath();
      faces.forEach(f => { f.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); });
      c.fillStyle = '#000'; c.fill();
      c.strokeStyle = rgb(mix3(WF_P, WF_W, 0.3), fade); c.lineWidth = 2; c.stroke();
    }
    return cam;
  }

  function wfPolyLayer(c, t, st) {
    const defs = [
      { m: st.polys.ico, x: 470, y: 330, s: 135, t0: 2.45, sp: [0.7, 0.45] },
      { m: st.polys.dod, x: 960, y: 250, s: 150, t0: 2.75, sp: [-0.5, 0.6] },
      { m: st.polys.oct, x: 1450, y: 330, s: 145, t0: 3.05, sp: [0.9, -0.35] },
    ];
    const segs = [], dots = [];
    for (const d of defs) {
      if (t < d.t0) continue;
      const conv = E.inC(seg(t, 4.55, 5.0));
      const x = lerp(d.x, 960, conv), y = lerp(d.y, 470, conv), s = d.s * (1 - conv) * (0.6 + 0.4 * E.outB(seg(t, d.t0, d.t0 + 0.5)));
      if (s < 1) continue;
      const rot = wfRot(t * d.sp[0] + d.t0, 0.35 + t * d.sp[1] * 0.5, 0.2);
      const pl = wfPlace(d.m, rot, s, x, y + Math.sin(t * 1.3 + d.t0) * 8);
      d.m.E.forEach((e, k) => {
        const p = E.outC(seg(t, d.t0 + k * 0.012, d.t0 + k * 0.012 + 0.22));
        if (p <= 0) return;
        const vis = pl.vis[e[2]] || (e[3] >= 0 && pl.vis[e[3]]);
        const A = pl.S[e[0]], B = pl.S[e[1]];
        segs.push(A[0], A[1], lerp(A[0], B[0], p), lerp(A[1], B[1], p), vis ? 1 : 0.2);
      });
      pl.S.forEach((p, k) => { if (t > d.t0 + 0.3) dots.push(p[0], p[1], 1); });
    }
    wfLines(c, segs, WF_P, 2.2, 0.5);
    wfDots(c, dots, WF_P, 2.6);
  }

  function wfGeoLayer(c, t, st, logoMix) {
    const m = st.polys.geo, NE = m.E.length;
    if (!st.geoOrder) {
      const key = m.E.map(e => { const a = m.V[e[0]], b = m.V[e[1]], my = (a[1] + b[1]) / 2, ang = Math.atan2((a[2] + b[2]) / 2, (a[0] + b[0]) / 2); return (1 - my) * 0.5 + (ang / TAU + 0.5) * 0.06; });
      const ord = key.map((k, i) => i).sort((a, b) => key[a] - key[b]);
      st.geoOrder = new Float32Array(NE); ord.forEach((ei, r) => { st.geoOrder[ei] = r / NE; });
    }
    const ex = 1 + 0.9 * E.outC(seg(t, 7.35, 7.9));
    const s = 330 * E.outB(seg(t, 5.0, 5.45), 1.4) * ex;
    const rot = wfRot(t * 0.55, 0.38 + 0.1 * Math.sin(t * 0.7), 0.15);
    const pl = wfPlace(m, rot, s, 960, 470);
    const scanY = lerp(1.15, -1.15, E.ioS(seg(t, 6.35, 7.3)));
    const scanning = t > 6.3 && t < 7.4;
    const segs = [], hot = [], dots = [], scanned = [];
    const fadeOut = 1 - seg(t, 7.35, 7.85);
    for (let k = 0; k < NE; k++) {
      const e = m.E[k];
      const st0 = 5.05 + st.geoOrder[k] * 1.2, p = seg(t, st0, st0 + 0.1);
      if (p <= 0) continue;
      const vis = pl.vis[e[2]] || (e[3] >= 0 && pl.vis[e[3]]);
      const A = pl.S[e[0]], B = pl.S[e[1]];
      const bx = lerp(A[0], B[0], p), by = lerp(A[1], B[1], p);
      const wy = (pl.P[e[0]][1] + pl.P[e[1]][1]) / 2 / (s || 1);
      let a = vis ? 0.85 : 0.16;
      if (scanning || t >= 7.3) {
        const dd = Math.abs(wy - scanY);
        if (dd < 0.07 && scanning) { hot.push(A[0], A[1], bx, by, 1); continue; }
        if (wy > scanY || t >= 7.3) { scanned.push(A[0], A[1], bx, by, (vis ? 1 : 0.28) * fadeOut); continue; }
      }
      if (p < 1) dots.push(bx, by, 1);
      segs.push(A[0], A[1], bx, by, a * fadeOut);
    }
    wfLines(c, segs, WF_P, 2.0, 0.4);
    wfLines(c, scanned, mix3(WF_P, WF_W, 0.55), 2.2, 0.7);
    wfLines(c, hot, WF_A, 3, 0.5);
    wfDots(c, dots, WF_W, 3.2);
    if (t > 6.3 && t < 7.4) {
      // vertices light up as the scan passes
      const vd = [];
      pl.P.forEach((P, i) => { if (P[1] / s > scanY && pl.S[i]) vd.push(pl.S[i][0], pl.S[i][1], 0.7); });
      wfDots(c, vd, WF_P, 2.2);
    }
    if (scanning) {
      // scan ring + plane
      const rr = Math.sqrt(Math.max(0, 1 - scanY * scanY));
      const ring2 = [], plane = [];
      for (let k = 0; k < 64; k++) {
        const a0 = k / 64 * TAU, a1 = (k + 1) / 64 * TAU;
        const P0 = [Math.cos(a0) * rr * s, scanY * s, Math.sin(a0) * rr * s + 1000], P1 = [Math.cos(a1) * rr * s, scanY * s, Math.sin(a1) * rr * s + 1000];
        ring2.push(960 + 1000 * P0[0] / P0[2], 470 - 1000 * P0[1] / P0[2], 960 + 1000 * P1[0] / P1[2], 470 - 1000 * P1[1] / P1[2], 1);
        const Q0 = [Math.cos(a0) * 1.55 * s, scanY * s, Math.sin(a0) * 1.55 * s + 1000], Q1 = [Math.cos(a1) * 1.55 * s, scanY * s, Math.sin(a1) * 1.55 * s + 1000];
        if (k % 2 === 0) plane.push(960 + 1000 * Q0[0] / Q0[2], 470 - 1000 * Q0[1] / Q0[2], 960 + 1000 * Q1[0] / Q1[2], 470 - 1000 * Q1[1] / Q1[2], 0.55);
      }
      const yS = 470 - scanY * s;
      plane.push(960 - 1.55 * s - 120, yS, 960 - 1.55 * s - 20, yS, 0.8, 960 + 1.55 * s + 20, yS, 960 + 1.55 * s + 120, yS, 0.8);
      wfLines(c, ring2, WF_A, 2.6, 0.6);
      wfLines(c, plane, WF_A, 1.4, 0.3);
      text(c, `Y ${(scanY * 100).toFixed(1).padStart(6, ' ')}`, 960 + 1.55 * s + 130, yS + 6, { font: MONO, size: 17, color: rgb(WF_A, 0.9) });
    }
    return pl;
  }

  function wfHud(c, t) {
    const a = seg(t, 5.1, 5.4) * (1 - seg(t, 7.3, 7.5));
    if (a <= 0) return;
    const col = rgb(mix3(WF_P, WF_W, 0.3), 0.95 * a), dim = rgb(WF_P, 0.6 * a);
    const built = Math.round(480 * seg(t, 5.05, 6.35));
    const sc = seg(t, 6.35, 7.3);
    const L = [['OBJ', 'GEOSPHERE  ·  ICO F4'], ['EDGES', String(built).padStart(3, '0') + ' / 480'], ['VERTS', String(Math.round(162 * seg(t, 5.05, 6.35))).padStart(3, '0') + ' / 162'], ['FACES', '320'], ['SCAN', sc > 0 ? (sc * 100).toFixed(0).padStart(3, ' ') + ' %' : 'STANDBY']];
    L.forEach(([k, v], i) => {
      text(c, k, 120, 760 + i * 30, { font: MONO, size: 19, ls: 3, color: dim });
      text(c, v, 230, 760 + i * 30, { font: MONO, size: 19, ls: 2, color: i === 4 && sc > 0 ? rgb(WF_A, 0.95 * a) : col });
    });
    c.fillStyle = dim; c.fillRect(120, 735, 300, 1.5);
    c.fillStyle = rgb(WF_A, 0.8 * a); c.fillRect(120, 912, 300 * sc, 4);
    c.strokeStyle = dim; c.lineWidth = 1.5; c.strokeRect(120, 911, 300, 6);
    const R = [['RX', (t * 31.5 % 360).toFixed(1)], ['RY', (t * 0.55 * 57.3 % 360).toFixed(1)], ['FOV', '54.0'], ['MODE', 'HIDDEN-LINE']];
    R.forEach(([k, v], i) => {
      text(c, k, 1540, 760 + i * 30, { font: MONO, size: 19, ls: 3, color: dim });
      text(c, v, 1800, 760 + i * 30, { font: MONO, size: 19, ls: 2, align: 'right', color: col });
    });
    // corner brackets around the object
    const b = 40, x0 = 560, y0 = 90, x1 = 1360, y1 = 850;
    c.strokeStyle = rgb(WF_P, 0.6 * a); c.lineWidth = 2;
    c.beginPath();
    [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, sx, sy]) => { c.moveTo(x + sx * b, y); c.lineTo(x, y); c.lineTo(x, y + sy * b); });
    c.stroke();
  }

  function wfLogoLayer(c, t, st, geo) {
    if (t < 7.4) return;
    const L = st.logo, NL = L.length, m = st.polys.geo;
    const yaw = kf(t, [[7.4, -0.75], [8.45, 0.2, E.outC], [10, 0.12, E.ioS]]);
    const pitch = kf(t, [[7.4, 0.5], [8.45, 0.2, E.outC], [10, 0.24]]);
    const rot = wfRot(yaw, pitch, 0);
    const sc = 27, D = 1500, F = 1500, cx = 960, cy = 380;
    const pj = p => { const r = rot(p); const z = r[2] * sc + D; return [cx + F * r[0] * sc / z, cy - F * r[1] * sc / z]; };
    const segs = [[], [], []], dots = [];
    const glint = seg(t, 9.0, 9.7);
    for (let i = 0; i < NL; i++) {
      const e = L[i];
      const d0 = 7.5 + (e.li / 9) * 0.35 + hash(i * 1.7) * 0.12;
      const p = E.ioC(seg(t, d0, d0 + 0.55));
      const A = pj(e.a), B = pj(e.b);
      let a0 = A, b0 = B;
      if (p < 1) {
        const ge = m.E[(i * 53) % m.E.length], GA = geo.S[ge[0]], GB = geo.S[ge[1]];
        a0 = [lerp(GA[0], A[0], p), lerp(GA[1], A[1], p)]; b0 = [lerp(GB[0], B[0], p), lerp(GB[1], B[1], p)];
      }
      let inten = e.kind === 0 ? 1 : e.kind === 1 ? 0.32 : 0.5;
      const arrive = bump(t, d0 + 0.5, 0.05, 0.05, 0.4) + bump(t, 8.48, 0.04, 0.06, 0.6) * 0.7;
      const gx = lerp(300, 1650, glint);
      if (glint > 0 && glint < 1) inten = Math.min(1, inten + Math.exp(-(((A[0] - gx) / 60) ** 2)) * 0.8);
      segs[e.kind === 0 ? 0 : 1].push(a0[0], a0[1], b0[0], b0[1], Math.min(1, inten + arrive * 0.6));
      if (e.kind === 0 && p >= 1) dots.push(A[0], A[1], 0.9, B[0], B[1], 0.9);
    }
    wfLines(c, segs[1], WF_P, 1.8, 0.3);
    wfLines(c, segs[0], WF_P, 3.4, 0.7);
    wfDots(c, dots, WF_P, 2.8);
    // tagline + rule
    const ta = E.outC(seg(t, 8.6, 9.1));
    if (ta > 0) {
      const w = 560 * E.outQt(ta);
      c.fillStyle = rgb(WF_P, 0.7 * ta);
      c.fillRect(960 - w, 590, w * 2, 2);
      for (let k = -10; k <= 10; k++) { if (Math.abs(k * 56) < w) c.fillRect(960 + k * 56 - 1, 584, 2, k % 5 === 0 ? 14 : 7); }
      const msg = 'VECTOR CRT  ·  WIREFRAME 3D  ·  1980 —';
      const n = Math.floor(msg.length * seg(t, 8.7, 9.25));
      text(c, msg.slice(0, n) + (n < msg.length && Math.floor(t * 12) % 2 ? '█' : ''), 960, 642, { font: MONO, size: 24, ls: 6, align: 'center', color: rgb(mix3(WF_P, WF_W, 0.4), 0.95 * ta) });
    }
  }

  MG.film({
    id: 'wireframe', dur: 10, poster: 9.4,
    fonts: [['400 16px "JetBrains Mono"', 'Aa1·—█']],
    meta: {
      family: 'D', name: 'Wireframe 3D', sub: 'Vector CRT', era: '1979 —',
      origin: 'Born on vector (XY) displays that drew glowing lines directly with the electron beam: Atari’s Battlezone (1980) and Tempest (1981) turned hidden-line wireframes into an aesthetic, which Tron (1982) and later technical CAD and Houdini/Blender wireframe renders carried forward.',
      works: 'Battlezone (Atari, 1980) · Tempest (Atari, 1981) · Tron (Disney, 1982) · Star Wars arcade (Atari, 1983) · Elite (Acornsoft, 1984) · Blade Runner 2049 UI wireframes (Territory Studio, 2017)',
      tech: ['Hidden-line terrain: rows filled black back-to-front', 'Face-visibility edge culling + depth-dimmed back edges', 'Phosphor bloom from downsampled blurred passes'],
      accent: '#46ff96',
      motionDNA: 'A low flight over a vector landscape, polyhedra drawing themselves edge by edge, a geodesic scanned by a moving plane, then every edge flies into a logo.',
      visualDNA: 'Pure glowing lines on black, green phosphor with white-hot cores and bright vertex dots, amber scan accents, CRT scanlines and bloom.',
      transitions: 'CRT power-on, edge-by-edge draw-on, scan sweep, edge morph into logo, glint sweep.',
      implementation: ['Vector display hardware', 'Blender Wireframe modifier', 'Houdini', 'Canvas 2D'],
      reproducibility: 'Fully procedural', loopable: false,
    },
    setup() { return wfSetup(); },
    draw(c, t, W, H, st) {
      const S = st.S, sc = S.getContext('2d');
      sc.setTransform(1, 0, 0, 1, 0, 0); sc.globalCompositeOperation = 'source-over'; sc.globalAlpha = 1;
      sc.fillStyle = '#000'; sc.fillRect(0, 0, W, H);
      const dim = t < 5 ? 1 : t < 7.4 ? lerp(1, 0.45, seg(t, 5, 5.5)) : lerp(0.45, 0.7, seg(t, 7.4, 8.4));
      const roll = 0.07 * Math.sin(t * 0.9) * (1 - seg(t, 4.6, 5.4));
      sc.save(); sc.translate(W / 2, H / 2); sc.rotate(roll); sc.scale(1.06, 1.06); sc.translate(-W / 2, -H / 2);
      wfTerrain(sc, t, W, H, st, dim);
      sc.restore();
      sc.globalCompositeOperation = 'lighter';
      if (t > 2.4 && t < 5.1) wfPolyLayer(sc, t, st);
      let geo = null;
      if (t > 4.95) geo = wfGeoLayer(sc, t, st);
      wfHud(sc, t);
      if (geo) wfLogoLayer(sc, t, st, geo);
      // flash at the converge point and logo lock
      const fl = bump(t, 4.98, 0.04, 0.02, 0.22);
      if (fl > 0) { const g = sc.createRadialGradient(960, 470, 0, 960, 470, 200); g.addColorStop(0, rgb(WF_W, fl * 0.55)); g.addColorStop(1, rgb(WF_P, 0)); sc.fillStyle = g; sc.fillRect(0, 0, W, H); }
      sc.globalCompositeOperation = 'source-over';
      // composite + phosphor bloom
      c.fillStyle = '#010503'; c.fillRect(0, 0, W, H);
      c.save();
      if (t < 0.5) {
        const hh = Math.max(3, H * E.outX(seg(t, 0.12, 0.48))), ww = W * E.outC(seg(t, 0, 0.14));
        c.beginPath(); c.rect(W / 2 - ww / 2, H / 2 - hh / 2, ww, hh); c.clip();
      }
      c.drawImage(S, 0, 0, W, H);
      const b1 = st.B1.getContext('2d'), b2 = st.B2.getContext('2d');
      b1.clearRect(0, 0, 480, 270); b1.filter = 'blur(3px)'; b1.drawImage(S, 0, 0, 480, 270); b1.filter = 'none';
      b2.clearRect(0, 0, 240, 135); b2.filter = 'blur(5px)'; b2.drawImage(S, 0, 0, 240, 135); b2.filter = 'none';
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 1; c.drawImage(st.B1, 0, 0, W, H);
      c.globalAlpha = 0.9; c.drawImage(st.B2, 0, 0, W, H); c.drawImage(st.B2, 0, 0, W, H);
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      if (t < 0.5) {
        const ln = 1 - seg(t, 0.1, 0.5);
        c.fillStyle = rgb(WF_W, ln * 0.9); c.fillRect(0, H / 2 - 2, W, 4);
      }
      c.restore();
      // CRT: scanlines, flicker, vignette
      c.save(); c.globalAlpha = 0.35; c.fillStyle = c.createPattern(st.sl, 'repeat'); c.fillRect(0, 0, W, H); c.restore();
      const fk = 0.03 + 0.03 * Math.sin(t * 61) * Math.sin(t * 13);
      c.fillStyle = `rgba(0,0,0,${fk})`; c.fillRect(0, 0, W, H);
      grain(c, W, H, t, 0.05, 'screen');
      vignette(c, W, H, 0.7, '0,0,0');
    },
    score(A) {
      // CRT power-on
      A.osc(0.02, { f: 55, f2: 30, glide: 0.3, dur: 0.4, g: 0.35 });
      A.noise(0.02, { type: 'highpass', f: 2000, dur: 0.05, g: 0.15 });
      A.osc(0.1, { f: 7900, dur: 1.6, g: 0.006, a: 0.05 });
      // engine rumble bed
      A.noise(0.2, { type: 'lowpass', f: 180, q: 2, dur: 7.2, g: 0.13, hold: true, rel: 0.6, a: 0.6 });
      // driving bass + square arpeggio (A minor)
      const bass = [45, 45, 57, 45, 43, 43, 55, 43, 41, 41, 53, 41, 40, 40, 52, 47];
      for (let k = 0; k < 28; k++) A.osc(0.5 + k * 0.25, { type: 'sawtooth', f: midi(bass[k % 16]), dur: 0.22, g: 0.09, lp: 700, lp2: 200, lpT: 0.2 });
      const arp = [69, 72, 76, 81, 76, 72, 69, 64];
      for (let k = 0; k < 40; k++) { const tt = 1.5 + k * 0.125; if (tt > 6.3) break; A.osc(tt, { type: 'square', f: midi(arp[k % 8] + (k >= 16 && k < 32 ? -2 : 0)), dur: 0.1, g: 0.022, lp: 2600, pan: k % 2 ? 0.35 : -0.35 }); }
      for (let k = 0; k < 14; k++) A.hat(1.5 + k * 0.5 + 0.25, 0.04);
      // polyhedra draw on
      [2.45, 2.75, 3.05].forEach((tt, i) => {
        A.osc(tt, { type: 'square', f: midi(76 + i * 5), f2: midi(88 + i * 5), glide: 0.18, dur: 0.24, g: 0.05, lp: 3000, pan: i - 1, rev: 0.3 });
        A.osc(tt + 0.2, { type: 'triangle', f: midi(64 + i * 5), dur: 0.6, g: 0.06, pan: i - 1, rev: 0.3 });
      });
      // converge
      A.whoosh(4.4, 0.6, { f1: 400, f2: 5000, g: 0.12 });
      A.osc(4.98, { f: midi(93), dur: 0.5, g: 0.06, rev: 0.5 });
      A.osc(4.98, { f: 110, f2: 40, glide: 0.3, dur: 0.5, g: 0.25 });
      // geodesic assembly: rapid rising ticks
      for (let k = 0; k < 40; k++) A.osc(5.05 + k * 0.031, { type: 'square', f: midi(60 + Math.floor(k * 0.6)), dur: 0.025, g: 0.03, lp: 3500, pan: Math.sin(k * 1.7) * 0.6 });
      A.noise(5.05, { type: 'bandpass', f: 800, f2: 5000, q: 3, dur: 1.25, g: 0.04, swell: 0.9 });
      A.chord(5.05, [45, 52, 57, 60, 64], { type: 'sawtooth', dur: 2.3, g: 0.016, a: 0.6, hold: true, rel: 0.4, lp: 500, lp2: 1800, lpT: 2, spread: 8, width: 1.2, rev: 0.4 });
      // scan sweep
      A.osc(6.35, { type: 'sine', f: 1400, f2: 300, glide: 0.95, dur: 0.95, g: 0.05, vib: [24, 30], rev: 0.3 });
      A.noise(6.35, { type: 'bandpass', f: 4000, f2: 600, q: 5, dur: 0.95, g: 0.06, sweep: 0.95 });
      for (let k = 0; k < 8; k++) A.osc(6.4 + k * 0.12, { f: midi(88 - k), dur: 0.08, g: 0.03, pan: (k % 2 ? 0.5 : -0.5) });
      // explode + morph into logo
      A.noise(7.35, { type: 'bandpass', f: 300, f2: 6000, q: 1, dur: 0.7, g: 0.12, swell: 0.3 });
      A.riser(7.4, 1.08, { g: 0.12, f: 110 });
      for (let k = 0; k < 9; k++) A.osc(7.95 + k * 0.06, { type: 'square', f: midi(69 + [0, 3, 7, 12, 15, 19, 24, 27, 31][k]), dur: 0.06, g: 0.025, lp: 3000, pan: (k / 8 - 0.5) * 1.4 });
      // lock
      A.impact(8.48, 0.5, { rev: 0.6 });
      A.chord(8.48, [33, 45, 52, 57, 60, 64, 69], { type: 'sawtooth', dur: 1.9, g: 0.03, a: 0.01, lp: 3000, lp2: 600, lpT: 1.8, spread: 9, width: 1.4, rev: 0.6 });
      A.bell(8.48, midi(81), { g: 0.06, dur: 1.5 });
      for (let k = 0; k < 12; k++) { const tt = 8.72 + k * 0.045; A.osc(tt, { type: 'square', f: 1800 + (k % 3) * 300, dur: 0.012, g: 0.02, lp: 4000 }); }
      A.osc(9.0, { f: midi(88), f2: midi(93), glide: 0.6, dur: 0.8, g: 0.03, rev: 0.5 });
    },
  });
  /* ================= D · EXPLODED VIEW — 50 mm lens ================= */
  const EX_CLICK = 8.1;
  const EX_L = norm([-0.45, 0.75, 0.65]);
  const exGlassCap = (r0, zf, zb, Rf, Rb, edge = 1.6) => {
    // biconvex-ish element: front surface sag r²/2Rf (positive bulges forward), back sag r²/2Rb (positive bulges backward)
    const pts = [], n = 7;
    for (let i = 0; i <= n; i++) { const r = r0 * i / n; pts.push([r, zf - r * r / (2 * Rf), 'glass']); }
    pts.push([r0, zb + r0 * r0 / (2 * Rb), 'glassEdge']);
    for (let i = n; i >= 0; i--) { const r = r0 * i / n; pts.push([r, zb + r * r / (2 * Rb), 'glass']); }
    // drop duplicate rim points
    return pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 0.01);
  };
  const EX_PARTS = [
    { id: 'mount', name: 'BAYONET MOUNT', spec: 'BRASS · HARD CHROME', profiles: [[[22, 0, 'chrome'], [31, 0, 'chrome'], [31, 6, 'chrome'], [38.5, 6, 'chrome'], [38.5, 10, 'chrome'], [22, 10, 'chromeIn']]], N: 96, tabs: true, len: 10, A: 5 },
    { id: 'rear', name: 'REAR ELEMENT', spec: 'HIGH-INDEX ASPHERE', profiles: [exGlassCap(19, 16, 8, 60, 90)], N: 48, len: 8, A: 12 },
    { id: 'motor', name: 'STEPPING MOTOR', spec: 'LINEAR AF · 0.08 s', profiles: [[[27, 18, 'copper'], [33, 18, 'copper'], [33, 30, 'copper'], [27, 30, 'copperIn']]], N: 72, coil: true, len: 12, A: 24 },
    { id: 'barrel', name: 'MAIN BARREL', spec: 'MAGNESIUM ALLOY', profiles: [[[34, 10, 'black'], [38, 10, 'black'], [39.5, 12, 'black'], [39.5, 62, 'accent'], [39.5, 65, 'black'], [39.5, 69, 'black'], [38.5, 70, 'black'], [34, 70, 'blackIn']]], N: 72, ticks: true, len: 60, A: 40 },
    { id: 'group', name: 'ED ELEMENT GROUP', spec: '2 × ED GLASS · FLOATING', profiles: [exGlassCap(27, 54, 46, 80, 70), exGlassCap(26, 44, 37, -140, 60), [[27, 44, 'black'], [29, 44, 'black'], [29, 46, 'black'], [27, 46, 'black']]], N: 60, len: 18, A: 45.5 },
    { id: 'iris', name: 'IRIS DIAPHRAGM', spec: '11 ROUNDED BLADES', profiles: [[[30.5, 58, 'grey'], [33.5, 58, 'grey'], [33.5, 66, 'grey'], [30.5, 66, 'greyIn']]], N: 72, blades: true, len: 8, A: 62 },
    { id: 'focus', name: 'FOCUS RING', spec: 'KNURLED · 270° THROW', profiles: [[[36, 71, 'black'], [41, 71, 'black'], [42.5, 73, 'rubber'], [42.5, 98, 'black'], [41, 100, 'black'], [36, 100, 'blackIn']]], N: 120, len: 30, A: 85.5 },
    { id: 'filter', name: 'FILTER RING', spec: 'Ø 77 MM · AL 6061', profiles: [[[34.5, 101, 'black'], [40.5, 101, 'black'], [40.5, 117, 'black'], [39.5, 120, 'black'], [35.5, 120, 'black'], [34.5, 118, 'blackIn']]], N: 72, len: 19, A: 110.5 },
    { id: 'front', name: 'FRONT ELEMENT', spec: 'NANO-CRYSTAL COAT', profiles: [exGlassCap(33.5, 119, 107, 75, 220)], N: 60, len: 13, A: 113 },
  ];

  function exSetup() {
    const GAP = 26;
    let pos = 0;
    EX_PARTS.forEach(p => { pos += p.len / 2; p.Ex = pos; pos += p.len / 2 + GAP; });
    const mid = (EX_PARTS[0].Ex + EX_PARTS[EX_PARTS.length - 1].Ex) / 2;
    EX_PARTS.forEach(p => { p.Ex += 62 - mid; });
    const parts = EX_PARTS.map((P, pi) => {
      const N = P.N, verts = [], quads = [];
      P.profiles.forEach(prof => {
        // orient each profile counter-clockwise in the (r, z) plane so the derived normals point outward
        let area = 0;
        for (let i = 0; i < prof.length; i++) { const a = prof[i], b = prof[(i + 1) % prof.length]; area += a[0] * b[1] - b[0] * a[1]; }
        let pr = prof;
        if (area < 0) { pr = prof.slice().reverse(); pr = pr.map((p2, i) => [p2[0], p2[1], pr[(i + 1) % pr.length][2]]); }
        const base = verts.length;
        pr.forEach(p2 => verts.push([p2[0], p2[1]]));
        for (let i = 0; i < pr.length; i++) {
          const a = pr[i], b = pr[(i + 1) % pr.length];
          if (a[0] < 0.01 && b[0] < 0.01) continue;
          const dr = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dr, dz) || 1;
          quads.push({ i0: base + i, i1: base + (i + 1) % pr.length, nr: dz / L, nz: -dr / L, mat: a[2] });
        }
      });
      return { P, N, verts, quads, pi };
    });
    return { parts };
  }

  function exEnv(R) {
    const top = ss(0.45, 0.8, R[1]);
    const left = ss(-0.62, -0.85, R[0]) * (1 - ss(0.35, 0.6, Math.abs(R[1])));
    const rim = ss(0.7, 0.92, R[0]) * (1 - ss(0.3, 0.55, Math.abs(R[1]))) * 0.7;
    const floor = ss(-0.15, -0.5, R[1]) * 0.22;
    return Math.min(1, 0.03 + top + left * 0.85 + rim + floor);
  }
  function exShade(mat, n, V, j, ang) {
    const nv = dot(n, V);
    const R = [2 * nv * n[0] - V[0], 2 * nv * n[1] - V[1], 2 * nv * n[2] - V[2]];
    const env = exEnv(R), lam = Math.max(0, dot(n, EX_L));
    const H = norm([EX_L[0] + V[0], EX_L[1] + V[1], EX_L[2] + V[2]]), sp = Math.pow(Math.max(0, dot(n, H)), 40);
    let v;
    switch (mat) {
      case 'chrome': case 'chromeIn': {
        const hz = 1 - ss(0.0, 0.18, Math.abs(R[1] + 0.05));
        v = 0.1 + 0.9 * env - hz * 0.25; const k = clamp(v + sp * 0.4) * 255; return [k * 0.98, k, k * 1.02, 1];
      }
      case 'copper': case 'copperIn': {
        const wind = 0.82 + 0.18 * Math.sin(ang * 60);
        const k = (0.22 + 0.8 * env + 0.25 * lam) * wind; return [235 * k, 140 * k, 92 * k, 1].map((x, i) => (i < 3 ? Math.min(255, x + sp * 120) : x));
      }
      case 'grey': case 'greyIn': { const k = (0.2 + 0.35 * env + 0.25 * lam + sp * 0.3) * 255; return [k, k, k * 1.03, 1]; }
      case 'accent': { const k = 0.55 + 0.45 * lam; return [Math.min(255, 238 * k + env * 60), Math.min(255, 96 * k + env * 60), Math.min(255, 40 * k + env * 60), 1]; }
      case 'rubber': {
        const kn = (j % 2) ? 0.5 : 1;
        const k = (0.05 + 0.1 * env + 0.07 * lam) * kn * 255 + sp * 18; return [k, k, k * 1.05, 1];
      }
      case 'glass': {
        const fr = Math.pow(1 - Math.abs(nv), 3);
        const tint = 0.5 + 0.5 * Math.sin(ang * 2 + nv * 6);
        const coat = mix3([150, 90, 220], [90, 220, 160], tint);
        const k = env;
        const col = mix3(mix3([30, 44, 60], coat, 0.35 + fr * 0.4), [255, 255, 255], clamp(k * 0.85 + sp * 0.8));
        return [col[0], col[1], col[2], clamp(0.16 + fr * 0.55 + k * 0.55)];
      }
      case 'glassEdge': { const k = 40 + env * 80; return [k * 0.7, k, k * 0.85, 0.85]; }
      default: { // black anodised
        const k = (0.055 + 0.26 * env + 0.07 * lam) * 255 + sp * 40; return [k * 0.96, k * 0.98, k * 1.04, 1];
      }
    }
  }

  function exTimeline(t) {
    const n = EX_PARTS.length, ex = [];
    for (let i = 0; i < n; i++) {
      const o = (4 - Math.abs(i - 4)) * 0.075;
      const out = E.outQn(seg(t, 1.55 + o, 2.65 + o)) - 0.03 * Math.sin(Math.PI * seg(t, 1.35 + o, 1.6 + o));
      const back = E.inC(seg(t, 7.15 + (Math.abs(i - 4)) * 0.075 * 0, 7.15 + 0.62 + (Math.abs(i - 4)) * 0.07));
      const breathe = 0.035 * Math.sin(seg(t, 3.2, 6.9) * Math.PI);
      ex.push((out + breathe) * (1 - back));
    }
    return ex;
  }

  function exCam(t) {
    const yaw = kf(t, [[0, 0.12], [1.5, 0.62, E.outC], [3.0, 1.38, E.ioC], [6.9, 2.0, E.ioS], [8.15, 0.66, E.ioC], [10, 0.6, E.ioS]]);
    const pitch = kf(t, [[0, 0.32], [3.0, 0.2, E.ioC], [6.9, 0.3, E.ioS], [8.15, 0.3, E.ioC], [10, 0.28]]);
    const scale = kf(t, [[0, 5.0], [1.5, 6.2, E.outC], [3.0, 3.55, E.ioC], [6.9, 3.65], [8.15, 6.0, E.ioC], [10, 6.25, E.ioS]]) * (1 + 0.025 * bump(t, EX_CLICK, 0.04, 0.0, 0.35));
    const cy = kf(t, [[0, 520], [3.0, 540], [6.9, 540], [8.15, 470, E.ioC], [10, 455]]);
    return { yaw, pitch, scale, cx: 960, cy };
  }

  function exDraw(c, t, W, H, st) {
    const cam = exCam(t), exs = exTimeline(t);
    const Dist = 1400, F = cam.scale * Dist;
    const cyw = Math.cos(cam.yaw), syw = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    let zMid = 0; EX_PARTS.forEach((P, i) => { zMid += P.A + (P.Ex - P.A) * exs[i]; }); zMid /= EX_PARTS.length;
    // local (x, y, z-axis) → world (x right, y up, z toward camera)
    const toW = (x, y, z) => {
      const zz = z - zMid;
      const x1 = x * cyw + zz * syw, z1 = -x * syw + zz * cyw;
      return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
    };
    const rotN = (x, y, z) => { const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw; return [x1, y * cp - z1 * sp, y * sp + z1 * cp]; };
    const proj = w => { const d = Dist - w[2]; return [cam.cx + F * w[0] / d, cam.cy - F * w[1] / d, d]; };
    const items = [];
    let minX = 1e9, maxX = -1e9, maxY = -1e9;
    const irisOpen = kf(t, [[0, 1], [5.35, 1], [5.95, 0.18, E.ioC], [6.45, 0.18], [6.95, 1, E.ioC]]);
    const focusSpin = kf(t, [[0, 0], [4.9, 0], [6.2, 1.2, E.ioS]]);
    for (const part of st.parts) {
      const P = part.P, off = (P.Ex - P.A) * exs[part.pi], N = part.N;
      const spin = P.id === 'focus' ? focusSpin : 0;
      const nv = part.verts.length, WV = new Array(nv * N), SV = new Array(nv * N);
      for (let k = 0; k < nv; k++) {
        const [r, z] = part.verts[k];
        for (let j = 0; j < N; j++) {
          const a = j / N * TAU + spin;
          let rr = r;
          if (P.tabs && Math.abs(r - 31) < 0.01 && z <= 6) {
            const tab = [0.3, 2.4, 4.5].some(c0 => { const d = Math.abs(((a - c0) % TAU + TAU) % TAU); return d < 0.62 || TAU - d < 0.0; });
            if (tab) rr = 35.5;
          }
          const w = toW(rr * Math.cos(a), rr * Math.sin(a), z + off);
          WV[k * N + j] = w; const s2 = proj(w); SV[k * N + j] = s2;
          if (s2[0] < minX) minX = s2[0]; if (s2[0] > maxX) maxX = s2[0]; if (s2[1] > maxY) maxY = s2[1];
        }
      }
      for (const q of part.quads) {
        const glass = q.mat === 'glass';
        for (let j = 0; j < N; j++) {
          const j1 = (j + 1) % N;
          const A0 = WV[q.i0 * N + j], A1 = WV[q.i0 * N + j1], B1 = WV[q.i1 * N + j1], B0 = WV[q.i1 * N + j];
          const am = (j + 0.5) / N * TAU + spin;
          const n = rotN(q.nr * Math.cos(am), q.nr * Math.sin(am), q.nz);
          const mx = (A0[0] + A1[0] + B1[0] + B0[0]) / 4, my = (A0[1] + A1[1] + B1[1] + B0[1]) / 4, mz = (A0[2] + A1[2] + B1[2] + B0[2]) / 4;
          const V = norm([-mx, -my, Dist - mz]);
          const nd = dot(n, V);
          if (nd <= 0 && !glass) continue;
          if (glass && nd <= 0) continue;
          const col = exShade(q.mat, n, V, j, am);
          const s0 = SV[q.i0 * N + j], s1 = SV[q.i0 * N + j1], s2 = SV[q.i1 * N + j1], s3 = SV[q.i1 * N + j];
          items.push({ z: (s0[2] + s1[2] + s2[2] + s3[2]) / 4, pts: [s0, s1, s2, s3], col, glass });
        }
      }
      if (P.tabs) {
        // gold electronic contacts on the rear face
        for (let k = 0; k < 8; k++) {
          const a0 = 4.05 + k * 0.075, a1 = a0 + 0.045;
          const pts = [[24.5, a0], [27.5, a0], [27.5, a1], [24.5, a1]].map(([r, a]) => proj(toW(r * Math.cos(a), r * Math.sin(a), -0.3 + off)));
          const n = rotN(0, 0, -1), V = [0, 0, 1];
          if (dot(n, V) <= 0) continue;
          const k2 = 0.5 + 0.5 * exEnv([2 * n[2] * n[0], 2 * n[2] * n[1], 2 * n[2] * n[2] - 1]);
          items.push({ z: pts[0][2] - 0.5, pts, col: [255 * k2, 200 * k2, 90 * k2, 1] });
        }
      }
      if (P.ticks) {
        // engraved white distance scale on the barrel
        for (let k = -9; k <= 9; k++) {
          const a = Math.PI / 2 + k * 0.07, len = k % 3 === 0 ? 5 : 2.6;
          const n = rotN(Math.cos(a), Math.sin(a), 0), w0 = toW(39.7 * Math.cos(a), 39.7 * Math.sin(a), 57 + off), w1 = toW(39.7 * Math.cos(a), 39.7 * Math.sin(a), 57 - len + off);
          const V = norm([-w0[0], -w0[1], Dist - w0[2]]);
          if (dot(n, V) < 0.15) continue;
          items.push({ z: proj(w0)[2] - 0.6, line: [proj(w0), proj(w1)], col: [240, 240, 240, 0.9] });
        }
        const a = Math.PI / 2, n = rotN(0, 1, 0), w = toW(0, 39.7, 50 + off);
        if (dot(n, norm([-w[0], -w[1], Dist - w[2]])) > 0.2) items.push({ z: proj(w)[2] - 0.6, dot: proj(w), col: [255, 120, 50, 1] });
      }
      if (P.blades) {
        const nb = 11, rIn = lerp(7, 27, irisOpen), z = 62 + off;
        for (let b = 0; b < nb; b++) {
          const th = b / nb * TAU + (1 - irisOpen) * 0.5;
          const pts = [];
          const tx = -Math.sin(th), ty = Math.cos(th), bx = Math.cos(th) * rIn, by = Math.sin(th) * rIn;
          const L = Math.sqrt(Math.max(1, 30.6 * 30.6 - rIn * rIn)), u0 = -Math.min(5, L * 0.3);
          for (let k = 0; k <= 5; k++) { const u = u0 + (L - u0) * k / 5; pts.push([bx + tx * u, by + ty * u]); }
          const aS = Math.atan2(pts[0][1], pts[0][0]), aE = Math.atan2(pts[5][1], pts[5][0]);
          let dA = aS - aE; while (dA > 0) dA -= TAU; while (dA < -TAU) dA += TAU;
          for (let k = 0; k <= 6; k++) { const a = aE + dA * k / 6; pts.push([31 * Math.cos(a), 31 * Math.sin(a)]); }
          const S2 = pts.map(([x, y]) => proj(toW(x, y, z + b * 0.02)));
          const n = rotN(0, 0, 1), V = [0, 0, 1], face = dot(n, V);
          const k2 = (0.13 + 0.12 * (b % 2) + 0.15 * Math.abs(face)) * 255;
          items.push({ z: S2[0][2] + 0.01 * b, pts: S2, col: [k2, k2, k2 * 1.05, 1], stroke: 'rgba(160,165,175,0.5)' });
        }
      }
    }
    // soft floor shadow
    const sx0 = minX, sx1 = maxX, scx = (sx0 + sx1) / 2, sw = (sx1 - sx0) / 2;
    c.save(); c.translate(scx, Math.min(H - 60, maxY + 70)); c.scale(1, 0.09);
    let g = c.createRadialGradient(0, 0, 0, 0, 0, sw * 1.05);
    g.addColorStop(0, 'rgba(40,44,52,0.38)'); g.addColorStop(0.6, 'rgba(40,44,52,0.16)'); g.addColorStop(1, 'rgba(40,44,52,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, sw * 1.05, 0, TAU); c.fill(); c.restore();
    items.sort((a, b) => b.z - a.z);
    c.lineJoin = 'round';
    for (const it of items) {
      const col = it.col;
      if (it.line) { c.strokeStyle = rgb(col, col[3]); c.lineWidth = 1.4; c.beginPath(); c.moveTo(it.line[0][0], it.line[0][1]); c.lineTo(it.line[1][0], it.line[1][1]); c.stroke(); continue; }
      if (it.dot) { c.fillStyle = rgb(col); c.beginPath(); c.arc(it.dot[0], it.dot[1], 3, 0, TAU); c.fill(); continue; }
      const p = it.pts;
      c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let k = 1; k < p.length; k++) c.lineTo(p[k][0], p[k][1]); c.closePath();
      const s2 = rgb(col, col[3]);
      c.fillStyle = s2; c.fill();
      if (!it.glass) { c.strokeStyle = it.stroke || s2; c.lineWidth = it.stroke ? 0.8 : 0.9; c.stroke(); }
    }
    return { toW, proj, exs, zMid };
  }

  function exLabels(c, t, geo) {
    const show = seg(t, 3.0, 3.3) * (1 - seg(t, 6.75, 7.05));
    if (show <= 0) return;
    EX_PARTS.forEach((P, i) => {
      const d0 = 3.05 + i * 0.11;
      const p = seg(t, d0, d0 + 0.35);
      if (p <= 0) return;
      const above = i % 2 === 0, rOut = P.id === 'rear' ? 19 : P.id === 'front' ? 33 : P.id === 'group' ? 29 : 40;
      const z = P.A + (P.Ex - P.A) * geo.exs[i];
      const anc = geo.proj(geo.toW(0, above ? rOut : -rOut, z));
      const rowY = above ? 170 : 905;
      const ly = lerp(anc[1], rowY, E.outQt(p));
      const a = show;
      c.strokeStyle = `rgba(30,34,42,${0.55 * a})`; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(anc[0], anc[1]); c.lineTo(anc[0], ly);
      const flip = anc[0] > 1700 ? -1 : 1;
      const hx = 28 * E.outC(seg(t, d0 + 0.25, d0 + 0.45)) * flip;
      if (hx !== 0) c.lineTo(anc[0] + hx, ly);
      c.stroke();
      c.fillStyle = `rgba(255,255,255,${a})`; c.strokeStyle = `rgba(30,34,42,${0.8 * a})`; c.lineWidth = 1.5;
      c.beginPath(); c.arc(anc[0], anc[1], 3.6, 0, TAU); c.fill(); c.stroke();
      const tp = seg(t, d0 + 0.3, d0 + 0.75);
      if (tp <= 0) return;
      const tx = anc[0] + 36 * flip, ty = ly + (above ? -2 : 8), al = flip > 0 ? 'left' : 'right';
      const name = P.name.slice(0, Math.ceil(P.name.length * tp));
      text(c, String(i + 1).padStart(2, '0'), tx, ty - (above ? 28 : -0), { font: MONO, size: 14, weight: 700, align: al, color: `rgba(232,90,36,${a})`, ls: 1 });
      text(c, name, tx, ty + (above ? 0 : 26), { font: 'Manrope, sans-serif', weight: 800, size: 19, ls: 1.5, align: al, color: `rgba(22,24,30,${a})` });
      text(c, P.spec, tx, ty + (above ? 22 : 48), { font: MONO, size: 13, ls: 1, align: al, color: `rgba(70,76,88,${a * E.outC(seg(t, d0 + 0.5, d0 + 0.9))})` });
    });
    // dimension line along the exploded axis
    const da = seg(t, 3.9, 4.4) * show;
    if (da > 0) {
      const a = geo.proj(geo.toW(0, -52, EX_PARTS[0].Ex - 5)), b = geo.proj(geo.toW(0, -52, EX_PARTS[8].Ex + 7));
      const m = E.outC(da);
      const bx = lerp(a[0], b[0], m), by = lerp(a[1], b[1], m);
      c.strokeStyle = `rgba(232,90,36,${0.8 * da})`; c.lineWidth = 1.2; c.setLineDash([6, 5]);
      c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(bx, by); c.stroke(); c.setLineDash([]);
      c.fillStyle = `rgba(232,90,36,${0.9 * da})`;
      c.fillRect(a[0] - 1, a[1] - 7, 2, 14); if (m > 0.98) c.fillRect(b[0] - 1, b[1] - 7, 2, 14);
      const tm = seg(t, 4.2, 4.6) * show;
      if (tm > 0) text(c, 'OPTICAL AXIS  ·  L 120 MM ASSEMBLED', (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 44, { font: MONO, size: 13, ls: 3, align: 'center', color: `rgba(232,90,36,${0.9 * tm})` });
    }
  }

  MG.film({
    id: 'exploded', dur: 10, poster: 9.5,
    fonts: [['800 80px Manrope', 'EXPLODED VIEW'], ['700 16px "JetBrains Mono"', 'Aa1·—Ø×']],
    meta: {
      family: 'D', name: 'Exploded-view Animation', sub: 'Product Visualisation', era: '1500s / 1990s —',
      origin: 'The exploded view comes from technical illustration (Leonardo’s machine studies, Agostino Ramelli, later engineering manuals); CAD and 3D product rendering in the 1990s–2000s turned it into motion, and Apple’s product films made the slow, precise disassembly a signature of premium launches.',
      works: 'Leonardo da Vinci, Codex Atlanticus (c. 1478–1519) · Apple “Designed by Apple in California” product films (2013) · Apple Watch launch film (2014) · Leica SL / Sony G Master lens cutaway animations · Teenage Engineering OP-1 exploded renders',
      tech: ['Surfaces of revolution from closed (r, z) profiles', 'Global painter’s sort of ~4k shaded quads', 'Studio environment-map shading: chrome, anodised, copper, coated glass'],
      accent: '#e85a24',
      motionDNA: 'A product holds, then its parts separate along the optical axis in a precise staggered cascade, labels draw on with leader lines, the assembly orbits, and everything snaps home with one satisfying click.',
      visualDNA: 'Seamless light studio, black anodised metal against chrome and copper, coated glass reflections, hairline leader lines and small engineering type.',
      transitions: 'Axial explode, leader-line draw-on, orbit, staggered re-assembly snap, light flash on the click.',
      implementation: ['Cinema 4D / Redshift', 'KeyShot', 'SolidWorks Visualize', 'Canvas 2D'],
      reproducibility: 'Fully procedural', loopable: false,
    },
    setup() { return exSetup(); },
    draw(c, t, W, H, st) {
      const bg = c.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, W * 0.7);
      bg.addColorStop(0, '#f5f6f8'); bg.addColorStop(0.6, '#e2e5e9'); bg.addColorStop(1, '#c4c8ce');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      // faint engineering grid during the diagram phase
      const ga = seg(t, 2.6, 3.2) * (1 - seg(t, 6.8, 7.3));
      if (ga > 0) {
        c.strokeStyle = `rgba(60,70,90,${0.07 * ga})`; c.lineWidth = 1;
        c.beginPath();
        for (let x = 0; x <= W; x += 60) { c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, H); }
        for (let y = 0; y <= H; y += 60) { c.moveTo(0, y + 0.5); c.lineTo(W, y + 0.5); }
        c.stroke();
      }
      const geo = exDraw(c, t, W, H, st);
      exLabels(c, t, geo);
      // light sweep on the hook
      const sw = seg(t, 0.35, 1.5);
      if (sw > 0 && sw < 1) {
        c.save(); c.globalCompositeOperation = 'soft-light';
        const x = lerp(-300, W + 300, E.ioS(sw));
        const g = c.createLinearGradient(x - 260, 0, x + 260, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
      }
      // the click: ring of light from the front element
      const ck = seg(t, EX_CLICK, EX_CLICK + 0.6);
      if (ck > 0 && ck < 1) {
        const p = geo.proj(geo.toW(0, 0, 120));
        c.strokeStyle = `rgba(255,255,255,${0.9 * (1 - ck)})`; c.lineWidth = 3 * (1 - ck) + 0.5;
        c.beginPath(); c.arc(p[0], p[1], 120 + 480 * E.outC(ck), 0, TAU); c.stroke();
        c.fillStyle = `rgba(255,255,255,${0.16 * (1 - E.outC(ck))})`; c.fillRect(0, 0, W, H);
      }
      // caption chips (phase markers)
      const chip = (label, a0, a1, x) => {
        const a = seg(t, a0, a0 + 0.3) * (1 - seg(t, a1, a1 + 0.3));
        if (a <= 0) return;
        text(c, label, x, 66, { font: MONO, size: 14, ls: 3, color: `rgba(60,66,78,${0.85 * a})` });
      };
      chip('FIG. 01 — ASSEMBLY', 0.3, 1.5, 80);
      chip('FIG. 02 — EXPLODED VIEW  ·  OPTICAL AXIS', 1.6, 6.8, 80);
      chip('FIG. 03 — RE-ASSEMBLY', 7.0, 8.2, 80);
      const pa = seg(t, 1.6, 1.9) * (1 - seg(t, 6.8, 7.1));
      if (pa > 0) text(c, 'SCALE 1 : 1   ·   UNITS MM', W - 80, 66, { font: MONO, size: 14, ls: 3, align: 'right', color: `rgba(60,66,78,${0.85 * pa})` });
      // title
      const ta = seg(t, 8.35, 9.0);
      if (ta > 0) {
        const p = E.outQt(ta);
        c.save(); c.beginPath(); c.rect(0, 800, W, 110); c.clip();
        text(c, 'EXPLODED VIEW', W / 2, 890 + (1 - p) * 100, { font: 'Manrope, sans-serif', weight: 800, size: 84, ls: 14, align: 'center', color: '#15171c' });
        c.restore();
        const sa = E.outC(seg(t, 8.65, 9.2));
        text(c, '50 MM  ƒ/1.2   ·   9 COMPONENTS   ·   PRODUCT VISUALISATION', W / 2, 950, { font: MONO, size: 17, ls: 4, align: 'center', color: `rgba(70,76,88,${sa})` });
        c.fillStyle = `rgba(232,90,36,${sa})`; c.fillRect(W / 2 - 40 * E.outQt(sa), 978, 80 * E.outQt(sa), 3);
      }
      if (t < 0.4) { c.fillStyle = `rgba(245,246,248,${1 - E.outC(seg(t, 0, 0.4))})`; c.fillRect(0, 0, W, H); }
      grain(c, W, H, t, 0.025);
      vignette(c, W, H, 0.18, '30,34,44');
    },
    score(A) {
      // calm studio bed
      A.chord(0.2, [50, 57, 62, 64, 69], { type: 'sine', dur: 7.0, g: 0.024, a: 1.5, hold: true, rel: 1.0, spread: 5, width: 1.2, rev: 0.6 });
      A.noise(0.35, { type: 'bandpass', f: 800, f2: 5000, q: 0.8, dur: 1.15, g: 0.04, swell: 0.6, rev: 0.4 });
      // anticipation + explode: one airy whoosh per part, panned by its position along the axis
      A.osc(1.35, { f: 70, f2: 50, glide: 0.2, dur: 0.3, g: 0.12 });
      EX_PARTS.forEach((P, i) => {
        const o = (4 - Math.abs(i - 4)) * 0.075;
        A.whoosh(1.55 + o, 0.55, { f1: 500 + i * 120, f2: 3500 + i * 300, g: 0.06, pan: (i / 8 - 0.5) * 1.6, rev: 0.25 });
        A.noise(1.57 + o, { type: 'bandpass', f: 3000 + i * 200, q: 4, dur: 0.03, g: 0.04, pan: (i / 8 - 0.5) * 1.6 });
      });
      A.osc(1.6, { f: 110, f2: 55, glide: 0.5, dur: 0.8, g: 0.14 });
      // labels: crisp data blips
      EX_PARTS.forEach((P, i) => {
        const d0 = 3.05 + i * 0.11;
        A.osc(d0, { f: midi(86 + (i % 3) * 2), dur: 0.05, g: 0.035, pan: (i / 8 - 0.5) * 1.4 });
        for (let k = 0; k < 4; k++) A.noise(d0 + 0.32 + k * 0.06, { type: 'highpass', f: 6000, dur: 0.012, g: 0.025 });
      });
      for (let k = 0; k < 8; k++) A.pluck(3.2 + k * 0.38, midi([62, 69, 74, 76, 74, 69, 66, 69][k]), { g: 0.08, dur: 1.4, bright: 0.6, pan: k % 2 ? 0.4 : -0.4, rev: 0.35 });
      // iris closes / opens: ratchet clicks
      for (let k = 0; k < 11; k++) A.noise(5.35 + k * 0.055, { type: 'bandpass', f: 4200, q: 6, dur: 0.015, g: 0.05 });
      for (let k = 0; k < 11; k++) A.noise(6.45 + k * 0.045, { type: 'bandpass', f: 3600, q: 6, dur: 0.015, g: 0.04 });
      // focus ring turn: soft detents
      for (let k = 0; k < 16; k++) A.noise(4.95 + k * 0.08, { type: 'bandpass', f: 1800, q: 3, dur: 0.02, g: 0.025, pan: 0.3 });
      // orbit swell
      A.noise(6.0, { type: 'bandpass', f: 300, f2: 1400, q: 0.8, dur: 1.2, g: 0.04, swell: 0.7, rev: 0.4 });
      // re-assembly: reversed air, then a cascade of seating thunks
      A.noise(7.15, { type: 'bandpass', f: 4000, f2: 600, q: 1.2, dur: 0.7, g: 0.08, swell: 0.95, rev: 0.2 });
      for (let i = 0; i < 9; i++) { const tt = 7.77 + Math.abs(i - 4) * 0.07 * 0 + i * 0.012; if (i % 2 === 0) A.osc(tt, { f: 160 - i * 6, f2: 70, glide: 0.06, dur: 0.1, g: 0.05 }); }
      // THE CLICK
      A.noise(EX_CLICK, { type: 'highpass', f: 3500, dur: 0.025, g: 0.3 });
      A.noise(EX_CLICK + 0.035, { type: 'bandpass', f: 2400, q: 3, dur: 0.04, g: 0.2 });
      A.osc(EX_CLICK, { f: 130, f2: 48, glide: 0.18, dur: 0.5, g: 0.42 });
      A.bell(EX_CLICK + 0.01, midi(93), { g: 0.04, dur: 1.2, ratios: [1, 2.4, 5.1] });
      A.chord(EX_CLICK + 0.02, [38, 50, 57, 62, 66, 69, 74], { type: 'triangle', dur: 1.9, g: 0.028, a: 0.01, rev: 0.7, width: 1.4, lp: 2600 });
      // title
      A.bell(8.4, midi(86), { g: 0.035, dur: 1.4, pan: -0.2 });
      A.bell(8.7, midi(81), { g: 0.03, dur: 1.2, pan: 0.2 });
    },
  });
})();
