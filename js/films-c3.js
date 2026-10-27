/* batch c3 — Family D: 3D & CGI Motion. Low Poly flyover, Voxel diorama, Glassmorphism 3D.
   A tiny Canvas-2D 3D pipeline per film: look-at / orthographic cameras, projection,
   painter's depth sort, Lambert facet shading from a light vector, fake refraction. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, spring, rng, hash, midi, text, rrect, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;800&family=Silkscreen:wght@400;700&display=block');
  const MONO = '"JetBrains Mono", monospace';
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const ss = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const norm = v => { const m = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / m, v[1] / m, v[2] / m]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const bump = (t, a, up, hold, down) => E.outX(seg(t, a, a + up)) * (1 - E.ioC(seg(t, a + up + hold, a + up + hold + down)));

  // integer-hash 2D value noise + fBm (seeded, deterministic)
  function h2(i, j, s) {
    let n = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177); n ^= n >>> 16;
    return (n >>> 0) / 4294967296;
  }
  function vn2(x, y, s) {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
    const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return lerp(lerp(h2(i, j, s), h2(i + 1, j, s), u), lerp(h2(i, j + 1, s), h2(i + 1, j + 1, s), u), v) * 2 - 1;
  }
  function fbm(x, y, s, oct = 5) {
    let a = 0.5, f = 1, sum = 0, n = 0;
    for (let o = 0; o < oct; o++) { sum += a * vn2(x * f, y * f, s + o * 17); n += a; a *= 0.5; f *= 2.03; }
    return sum / n;
  }
  // perspective look-at camera with roll
  function lookCam(eye, tgt, F, W, H, roll = 0) {
    const f = norm([tgt[0] - eye[0], tgt[1] - eye[1], tgt[2] - eye[2]]);
    let r = norm(cross([0, 1, 0], f)), u = cross(f, r);
    if (roll) {
      const cr = Math.cos(roll), sr = Math.sin(roll);
      const r2 = [r[0] * cr + u[0] * sr, r[1] * cr + u[1] * sr, r[2] * cr + u[2] * sr];
      u = [u[0] * cr - r[0] * sr, u[1] * cr - r[1] * sr, u[2] * cr - r[2] * sr]; r = r2;
    }
    return {
      eye, f, r, u, F,
      view(x, y, z) { const dx = x - eye[0], dy = y - eye[1], dz = z - eye[2]; return [dx * r[0] + dy * r[1] + dz * r[2], dx * u[0] + dy * u[1] + dz * u[2], dx * f[0] + dy * f[1] + dz * f[2]]; },
      dirToScreen(d) { const x = dot(d, r), y = dot(d, u), z = dot(d, f); return [W / 2 + F * x / z, H / 2 - F * y / z, z]; },
    };
  }

  /* ================= D1 LOW POLY — faceted flyover ================= */
  const LP_GX = 84, LP_GZ = 92, LP_CELL = 86, LP_X0 = -LP_GX * LP_CELL / 2;
  const LP_L = norm([-0.72, 0.55, 0.22]);           // key light, from the left
  const LP_SUN = norm([-0.14, 0.12, 1]);              // the visible sun, low ahead
  const LP_FOG = [255, 168, 146];
  const lpRiver = z => 300 * Math.sin(z / 1300 + 0.4) - 170;
  function lpHeight(x, z) {
    const v = Math.abs(x - lpRiver(z)) / 1000;
    const V = ss(0.14, 1.15, v);
    const n = fbm(x / 1100, z / 1100, 3);
    const hills = (0.55 + 0.75 * n) * 430 * V;
    const ridge = 1 - Math.abs(fbm(x / 1000 + 9, z / 1000, 11, 4));
    const mt = ss(3000, 5800, z) * (0.4 + 0.6 * ridge * ridge) * 1550 * (0.35 + 0.65 * V);
    return hills + mt - 150 * (1 - V) - 30;
  }
  function lpGround(y, ny, j) {
    let col;
    if (ny < 0.62 && y > 120) col = [128, 108, 124];
    else if (y < 28) col = [236, 200, 146];
    else if (y < 420) col = mix3([142, 186, 96], [84, 146, 86], y / 420);
    else if (y < 900) col = mix3([70, 128, 88], [92, 104, 110], (y - 420) / 480);
    else if (y < 1150) col = [128, 108, 128];
    else col = [246, 240, 250];
    if (y >= 1150 && ny < 0.7) col = [196, 186, 210];
    return mul3(col, 0.94 + j * 0.12);
  }
  function lpSetup() {
    const NX = LP_GX + 1, NZ = LP_GZ + 1, N = NX * NZ;
    const vx = new Float32Array(N), vy = new Float32Array(N), vz = new Float32Array(N), wet = new Uint8Array(N);
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) {
      const k = j * NX + i, edge = i === 0 || j === 0 || i === LP_GX || j === LP_GZ;
      const x = LP_X0 + i * LP_CELL + (edge ? 0 : (h2(i, j, 5) - 0.5) * 0.62 * LP_CELL);
      const z = -600 + j * LP_CELL + (edge ? 0 : (h2(i, j, 6) - 0.5) * 0.62 * LP_CELL);
      const h = lpHeight(x, z);
      vx[k] = x; vz[k] = z; vy[k] = Math.max(0, h); wet[k] = h < 0 ? 1 : 0;
    }
    const tris = [];
    for (let j = 0; j < LP_GZ; j++) for (let i = 0; i < LP_GX; i++) {
      const a = j * NX + i, b = a + 1, c = a + NX, d = c + 1;
      const pair = (i + j) % 2 ? [[a, c, b], [b, c, d]] : [[a, c, d], [a, d, b]];
      pair.forEach(tri => tris.push(tri));
    }
    const T = tris.length, ti = new Int32Array(T * 3), base = new Float32Array(T * 3), water = new Uint8Array(T), nrm = new Float32Array(T * 3);
    tris.forEach((tr, n) => {
      ti[n * 3] = tr[0]; ti[n * 3 + 1] = tr[1]; ti[n * 3 + 2] = tr[2];
      const [p, q, r] = tr;
      const e1 = [vx[q] - vx[p], vy[q] - vy[p], vz[q] - vz[p]], e2 = [vx[r] - vx[p], vy[r] - vy[p], vz[r] - vz[p]];
      let nn = norm(cross(e1, e2)); if (nn[1] < 0) nn = nn.map(x => -x);
      nrm[n * 3] = nn[0]; nrm[n * 3 + 1] = nn[1]; nrm[n * 3 + 2] = nn[2];
      const w = wet[p] + wet[q] + wet[r];
      water[n] = w === 3 ? 1 : 0;
      const y = (vy[p] + vy[q] + vy[r]) / 3;
      const col = w === 3 ? [40, 118, 150] : w > 0 ? [230, 196, 146] : lpGround(y, nn[1], h2(n, 3, 9));
      base[n * 3] = col[0]; base[n * 3 + 1] = col[1]; base[n * 3 + 2] = col[2];
    });
    // end-card mosaic + fox
    const mos = [], CS = 120;
    for (let gy = 0; gy < 9; gy++) for (let gx = 0; gx < 16; gx++) {
      const x0 = gx * CS, y0 = gy * CS, jit = (a, b) => [(h2(a, b, 21) - 0.5) * 50, (h2(a, b, 22) - 0.5) * 50];
      const P = (a, b) => { const e = a === 0 || b === 0 || a === 16 || b === 9; const jj = e ? [0, 0] : jit(a, b); return [a * CS + jj[0], b * CS + jj[1]]; };
      const A = P(gx, gy), B = P(gx + 1, gy), C = P(gx, gy + 1), D = P(gx + 1, gy + 1);
      const ts = (gx + gy) % 2 ? [[A, B, D], [A, D, C]] : [[A, B, C], [B, D, C]];
      ts.forEach((tr, k) => {
        const cx = (tr[0][0] + tr[1][0] + tr[2][0]) / 3, cy = (tr[0][1] + tr[1][1] + tr[2][1]) / 3;
        const dd = Math.hypot(cx - 960, cy - 470) / 1100;
        const col = mul3(mix3([58, 40, 96], [22, 18, 46], ss(0, 1, dd)), 0.86 + h2(gx * 2 + k, gy, 23) * 0.3);
        mos.push({ tr, cx, cy, col, d: 6.5 + ((cx / 1920) * 0.72 + (1 - cy / 1080) * 0.28) * 0.6 + h2(gx, gy * 2 + k, 24) * 0.08 });
      });
    }
    return { NX, vx, vy, vz, wet, ti, base, water, nrm, T, mos, fox: lpFox(), sx: new Float32Array(N), sy: new Float32Array(N), sz: new Float32Array(N), wy: new Float32Array(N), depth: new Float32Array(T), order: new Int32Array(T) };
  }
  function lpFox() {
    const P = { A: [0, -0.42], B: [0.24, -0.5], C: [0.66, -1.04], D: [0.82, -0.28], F: [1.06, 0.15], H: [0.36, -0.1], G: [0.52, 0.2], I: [0, 0.02], J: [0.17, 0.52], L: [0.6, 0.42], K: [0, 0.88] };
    const O = { lt: [250, 166, 86], md: [238, 126, 52], dk: [204, 92, 34], dp: [158, 62, 24], wh: [250, 240, 232], ws: [218, 204, 198], ear: [86, 40, 46], eye: [34, 24, 40] };
    const R = [['B', 'C', 'D', 'md'], ['A', 'B', 'H', 'lt'], ['B', 'D', 'H', 'md'], ['D', 'F', 'H', 'dk'], ['H', 'F', 'G', 'md'], ['A', 'H', 'I', 'lt'], ['I', 'H', 'G', 'dk'],
      ['F', 'L', 'G', 'ws'], ['G', 'L', 'J', 'wh'], ['I', 'G', 'J', 'lt'], ['I', 'J', 'K', 'md'], ['J', 'L', 'K', 'ws']];
    const out = [];
    const push = (pts, col, side) => out.push({ pts, col: mul3(col, side < 0 ? 1.04 : 0.9) });
    [1, -1].forEach(sd => {
      R.forEach(([a, b, c, k]) => push([P[a], P[b], P[c]].map(p => [p[0] * sd, p[1]]), O[k], sd));
      push([[0.34, -0.52], [0.63, -0.9], [0.72, -0.36]].map(p => [p[0] * sd, p[1]]), O.ear, sd);
      push([[0.25, -0.03], [0.46, 0.0], [0.33, 0.09]].map(p => [p[0] * sd, p[1]]), O.eye, 1);
    });
    out.push({ pts: [[-0.11, 0.75], [0.11, 0.75], [0, 0.9]], col: O.eye });
    out.forEach((o, i) => {
      o.cx = (o.pts[0][0] + o.pts[1][0] + o.pts[2][0]) / 3; o.cy = (o.pts[0][1] + o.pts[1][1] + o.pts[2][1]) / 3;
      o.ang = hash(i * 3.1 + 1) * TAU; o.spin = (hash(i * 5.7) - 0.5) * 5;
    });
    const seq = out.map((o, i) => i).sort((a, b) => (out[a].cy - out[b].cy) + (hash(a) - 0.5) * 0.18);
    seq.forEach((i, k) => { out[i].d = 7.15 + k * 0.042; });
    // eyes and nose land last
    out.forEach(o => { if (o.col === O.eye || o.col[0] < 40) o.d = Math.max(o.d, 8.2 + hash(o.cx * 9) * 0.12); });
    return out;
  }

  function lpCamera(t, W, H) {
    const z = -420 + 280 * t + 14 * t * t;
    let y = kf(t, [[0, 60], [0.9, 75], [3.4, 1350, E.ioC], [5.3, 1650, E.ioS], [6.8, 2500, E.inQ]]);
    const x = lpRiver(z) * 0.82;
    let floor = 0;
    for (let k = 0; k <= 4; k++) floor = Math.max(floor, lpHeight(x, z + k * 140));
    y = Math.max(y, floor + 110);
    const drop = kf(t, [[0, 30], [0.9, 40], [3.4, 470], [5.3, 420], [6.8, 170]]);
    const zt = z + 1700;
    const roll = -(lpRiver(z + 400) - lpRiver(z)) / 400 * 0.5 + 0.04 * Math.sin(t * 0.9);
    return lookCam([x, y, z], [lpRiver(zt) * 0.82, y - drop, zt], 1080, W, H, roll);
  }

  function lpLand(c, t, W, H, st) {
    const cam = lpCamera(t, W, H);
    // sky
    const hz = cam.dirToScreen([cam.f[0], 0, cam.f[2]].map((v, i, a) => v / Math.hypot(a[0], a[2])));
    const hy = hz[1];
    const sky = c.createLinearGradient(0, hy - 900, 0, hy + 40);
    sky.addColorStop(0, '#1b1846'); sky.addColorStop(0.42, '#59306f'); sky.addColorStop(0.72, '#c95a7a');
    sky.addColorStop(0.9, '#ff9c84'); sky.addColorStop(1, '#ffc996');
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    // faceted sky panels
    const R = rng(77);
    c.save();
    for (let k = 0; k < 9; k++) {
      const x0 = -200 + k * 260 + R() * 80, y0 = hy - 760 + R() * 140;
      c.fillStyle = `rgba(255,255,255,${0.018 + R() * 0.03})`;
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + 300 + R() * 200, y0 + 120 + R() * 200); c.lineTo(x0 + 60, y0 + 380 + R() * 140); c.fill();
    }
    c.restore();
    // sun
    const sp = cam.dirToScreen(LP_SUN);
    const glow = 1 + bump(t, 5.6, 0.9, 0.1, 0.4) * 0.8;
    if (sp[2] > 0) {
      const g = c.createRadialGradient(sp[0], sp[1], 20, sp[0], sp[1], 700 * glow);
      g.addColorStop(0, 'rgba(255,214,150,0.75)'); g.addColorStop(0.25, 'rgba(255,150,120,0.28)'); g.addColorStop(1, 'rgba(255,120,120,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      const sr = 118, NS = 14;
      for (let k = 0; k < NS; k++) {
        const a0 = k / NS * TAU + 0.2, a1 = (k + 1) / NS * TAU + 0.2;
        const lit = 0.5 + 0.5 * Math.cos((a0 + a1) / 2 - 2.4);
        c.fillStyle = rgb(mix3([255, 176, 112], [255, 240, 196], lit * 0.8 + (k % 2) * 0.12));
        c.beginPath(); c.moveTo(sp[0], sp[1]); c.lineTo(sp[0] + Math.cos(a0) * sr, sp[1] + Math.sin(a0) * sr); c.lineTo(sp[0] + Math.cos(a1) * sr, sp[1] + Math.sin(a1) * sr); c.closePath(); c.fill(); c.strokeStyle = c.fillStyle; c.lineWidth = 1; c.stroke();
      }
    }
    // terrain: transform vertices
    const { NX, vx, vy, vz, wet, ti, base, water, nrm, T, sx, sy, sz, wy, depth, order } = st;
    const N = vx.length, F = cam.F, cxs = W / 2, cys = H / 2;
    const e = cam.eye, r = cam.r, u = cam.u, f = cam.f;
    for (let k = 0; k < N; k++) {
      let y = vy[k];
      if (wet[k]) y = 7 * Math.sin(vx[k] * 0.011 + t * 2.1) * Math.cos(vz[k] * 0.013 - t * 1.7) + 4 * Math.sin((vx[k] + vz[k]) * 0.02 + t * 3);
      wy[k] = y;
      const dx = vx[k] - e[0], dy = y - e[1], dz = vz[k] - e[2];
      const zc = dx * f[0] + dy * f[1] + dz * f[2];
      sz[k] = zc;
      if (zc > 20) { sx[k] = cxs + F * (dx * r[0] + dy * r[1] + dz * r[2]) / zc; sy[k] = cys - F * (dx * u[0] + dy * u[1] + dz * u[2]) / zc; }
    }
    let n = 0;
    for (let k = 0; k < T; k++) {
      const a = ti[k * 3], b = ti[k * 3 + 1], cc = ti[k * 3 + 2];
      if (sz[a] < 25 || sz[b] < 25 || sz[cc] < 25) continue;
      const minx = Math.min(sx[a], sx[b], sx[cc]), maxx = Math.max(sx[a], sx[b], sx[cc]);
      const miny = Math.min(sy[a], sy[b], sy[cc]), maxy = Math.max(sy[a], sy[b], sy[cc]);
      if (maxx < -10 || minx > W + 10 || maxy < -10 || miny > H + 10) continue;
      depth[k] = Math.max(sz[a], sz[b], sz[cc]) + (sz[a] + sz[b] + sz[cc]) * 0.1;
      order[n++] = k;
    }
    const ord = Array.from(order.subarray(0, n)).sort((p, q) => depth[q] - depth[p]);
    const V = [0, 0, 0];
    for (const k of ord) {
      const a = ti[k * 3], b = ti[k * 3 + 1], cc = ti[k * 3 + 2];
      let nx = nrm[k * 3], ny = nrm[k * 3 + 1], nz = nrm[k * 3 + 2];
      let col;
      const dz = (sz[a] + sz[b] + sz[cc]) / 3;
      if (water[k]) {
        const e1x = vx[b] - vx[a], e1y = wy[b] - wy[a], e1z = vz[b] - vz[a], e2x = vx[cc] - vx[a], e2y = wy[cc] - wy[a], e2z = vz[cc] - vz[a];
        nx = e1y * e2z - e1z * e2y; ny = e1z * e2x - e1x * e2z; nz = e1x * e2y - e1y * e2x;
        const m = Math.hypot(nx, ny, nz) || 1; nx /= m; ny /= m; nz /= m; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
        V[0] = e[0] - (vx[a] + vx[b] + vx[cc]) / 3; V[1] = e[1] - (wy[a] + wy[b] + wy[cc]) / 3; V[2] = e[2] - (vz[a] + vz[b] + vz[cc]) / 3;
        const vm = Math.hypot(V[0], V[1], V[2]); V[0] /= vm; V[1] /= vm; V[2] /= vm;
        const hx = LP_SUN[0] + V[0], hy2 = LP_SUN[1] + V[1], hz2 = LP_SUN[2] + V[2], hm = Math.hypot(hx, hy2, hz2);
        const spec = Math.pow(Math.max(0, (nx * hx + ny * hy2 + nz * hz2) / hm), 90);
        const fres = Math.pow(1 - Math.max(0, nx * V[0] + ny * V[1] + nz * V[2]), 4);
        const lam = Math.max(0, nx * LP_L[0] + ny * LP_L[1] + nz * LP_L[2]);
        col = mix3([base[k * 3], base[k * 3 + 1], base[k * 3 + 2]], [255, 150, 150], 0.25 + fres * 0.6);
        col = mul3(col, 0.82 + lam * 0.3);
        col = mix3(col, [255, 236, 200], Math.min(1, spec * 1.6));
      } else {
        const lam = Math.max(0, nx * LP_L[0] + ny * LP_L[1] + nz * LP_L[2]);
        const b0 = [base[k * 3], base[k * 3 + 1], base[k * 3 + 2]];
        col = mul3(b0, 0.36 + 0.82 * lam);
        col = mix3(col, [74, 52, 128], (1 - lam) * 0.32);
        col = mix3(col, [255, 186, 132], lam * lam * 0.2);
      }
      col = mix3(col, LP_FOG, Math.pow(ss(1100, 7600, dz), 0.9) * 0.85);
      const s = `rgb(${col[0] | 0},${col[1] | 0},${col[2] | 0})`;
      c.fillStyle = s; c.strokeStyle = s; c.lineWidth = 0.8;
      c.beginPath(); c.moveTo(sx[a], sy[a]); c.lineTo(sx[b], sy[b]); c.lineTo(sx[cc], sy[cc]); c.closePath(); c.fill(); c.stroke();
    }
    // sun bloom over the ridge
    if (sp[2] > 0) {
      c.save(); c.globalCompositeOperation = 'screen';
      const g = c.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], 420 * glow);
      g.addColorStop(0, `rgba(255,200,150,${0.35 * glow})`); g.addColorStop(1, 'rgba(255,160,120,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // facet flare: hexagon ghosts along the sun→centre axis
      for (let k = 1; k <= 4; k++) {
        const q = k * 0.42, fx = sp[0] + (W / 2 - sp[0]) * q * 2, fy = sp[1] + (H / 2 - sp[1]) * q * 2, rr = 24 + k * 22;
        c.fillStyle = `rgba(255,${180 + k * 12},${160 + k * 10},${0.05 * glow})`;
        c.beginPath(); for (let m = 0; m < 6; m++) { const a = m / 6 * TAU + 0.3; m ? c.lineTo(fx + Math.cos(a) * rr, fy + Math.sin(a) * rr) : c.moveTo(fx + Math.cos(a) * rr, fy + Math.sin(a) * rr); } c.fill();
      }
      c.restore();
    }
  }

  function lpTri(c, p) { c.beginPath(); c.moveTo(p[0][0], p[0][1]); c.lineTo(p[1][0], p[1][1]); c.lineTo(p[2][0], p[2][1]); c.closePath(); }

  MG.film({
    id: 'lowpoly', dur: 10, poster: 9.4,
    fonts: [['900 80px Archivo', 'LOW POLY'], ['400 16px "JetBrains Mono"', 'Aa1·—']],
    meta: {
      family: 'D', name: 'Low Poly', sub: 'Faceted Geometry', era: '1990s —',
      origin: 'Born of the polygon budgets of early real-time 3D (Virtua Fighter, the PlayStation era), low poly returned in the 2010s as a deliberate aesthetic: flat-shaded triangles, visible facets and pastel light.',
      works: 'Virtua Fighter (Sega, 1993) · Monument Valley (ustwo, 2014) · Alto’s Adventure (2015) · Firewatch key art (Olly Moss, 2016)',
      tech: ['Seeded fBm terrain on a jittered grid', 'Per-face Lambert shading + atmospheric fog', 'Painter’s depth sort of ~9k triangles'],
      accent: '#ff8a5c',
      motionDNA: 'A smooth drone flyover that cranes up to reveal the range, then the world shatters into a triangle mosaic and an icon assembles facet by facet.',
      visualDNA: 'Flat-shaded triangles, warm key light against cool shadow sides, pastel sunset haze and a faceted sun.',
      transitions: 'Triangle mosaic wipe, facet-by-facet assembly, crane reveal, sun flare.',
      implementation: ['Blender (Decimate / flat shading)', 'Cinema 4D', 'Three.js flatShading', 'Canvas 2D'],
      reproducibility: 'Fully procedural', loopable: false,
    },
    setup() { return lpSetup(); },
    draw(c, t, W, H, st) {
      if (t < 7.32) lpLand(c, t, W, H, st);
      // mosaic wipe into the end card
      if (t > 6.45) {
        for (const m of st.mos) {
          const p = E.outC(seg(t, m.d, m.d + 0.26));
          if (p <= 0) continue;
          const shim = t > 7.3 ? 1 + 0.05 * Math.sin(t * 1.6 + m.cx * 0.006 - m.cy * 0.004) : 1;
          const col = mix3(mul3(m.col, shim), [255, 190, 150], (1 - p) * 0.9);
          c.save(); c.translate(m.cx, m.cy); c.scale(p, p); c.translate(-m.cx, -m.cy);
          lpTri(c, m.tr); c.fillStyle = c.strokeStyle = rgb(col); c.lineWidth = 1; c.fill(); c.stroke();
          c.restore();
        }
      }
      if (t > 7.0) {
        // drifting shards
        for (let k = 0; k < 16; k++) {
          const a = seg(t, 7.2 + k * 0.04, 7.8 + k * 0.04);
          if (!a) continue;
          const x = 960 + (hash(k * 3.3) - 0.5) * 1500 + Math.sin(t * 0.5 + k) * 20, y = 470 + (hash(k * 7.7) - 0.5) * 760 - (t - 7) * (8 + k);
          const s = 8 + hash(k) * 16, ang = t * (0.3 + hash(k + 4)) + k;
          c.save(); c.translate(x, y); c.rotate(ang); c.globalAlpha = 0.5 * a;
          c.fillStyle = k % 3 ? '#8a6fc6' : '#ffb07a';
          c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.9, s * 0.6); c.lineTo(-s * 0.8, s * 0.5); c.fill(); c.restore();
        }
        // fox head, facet by facet
        const gA = E.outC(seg(t, 7.2, 8.4));
        const fg = c.createRadialGradient(960, 440, 0, 960, 440, 520);
        fg.addColorStop(0, `rgba(255,140,90,${0.22 * gA})`); fg.addColorStop(1, 'rgba(255,140,90,0)');
        c.fillStyle = fg; c.fillRect(0, 0, W, H);
        const S = 250, X0 = 960, Y0 = 440 + Math.sin(t * 1.3) * 4;
        const lit = [];
        for (const o of st.fox) {
          const p = seg(t, o.d, o.d + 0.42);
          if (p <= 0) continue;
          const e1 = E.outQt(p), fl = 1 - E.outB(p, 2.2);
          const off = (1 - e1) * 420;
          const tx = X0 + (o.cx * S) + Math.cos(o.ang) * off, ty = Y0 + (o.cy * S) + Math.sin(o.ang) * off;
          c.save(); c.translate(tx, ty); c.rotate(o.spin * (1 - e1)); c.scale(Math.cos(fl * 2.4) * 0.999 + 0.001, 1);
          c.globalAlpha = clamp(p * 4);
          c.beginPath(); o.pts.forEach((q, i) => { const x = (q[0] - o.cx) * S, y = (q[1] - o.cy) * S; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath();
          c.fillStyle = c.strokeStyle = rgb(o.col); c.lineWidth = 1.2; c.fill(); c.stroke();
          const fla = (1 - seg(t, o.d + 0.28, o.d + 0.62)) * seg(p, 0.6, 0.75);
          if (fla > 0) { c.fillStyle = `rgba(255,246,230,${fla * 0.8})`; c.fill(); }
          c.restore();
          if (p >= 1) lit.push(o);
        }
        // specular sweep across the finished icon
        const sw = seg(t, 8.75, 9.45);
        if (sw > 0 && sw < 1) {
          c.save(); c.beginPath();
          lit.forEach(o => o.pts.forEach((q, i) => { const x = X0 + q[0] * S, y = Y0 + q[1] * S; i ? c.lineTo(x, y) : c.moveTo(x, y); }));
          c.clip();
          const bx = X0 - 400 + sw * 800;
          const g = c.createLinearGradient(bx - 120, Y0 - 300, bx + 120, Y0 + 100);
          g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,250,235,0.42)'); g.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = g; c.fillRect(X0 - 400, Y0 - 300, 800, 600); c.restore();
        }
        // title
        const ta = seg(t, 8.45, 9.0);
        if (ta > 0) {
          const word = 'LOW POLY';
          c.save(); c.font = '900 92px Archivo, sans-serif';
          if ('letterSpacing' in c) c.letterSpacing = '22px';
          const wTot = c.measureText(word).width - 22;
          let x = 960 - wTot / 2;
          for (let i = 0; i < word.length; i++) {
            const ch = word[i], cw = c.measureText(ch).width;
            const p = E.outQt(seg(t, 8.45 + i * 0.045, 8.85 + i * 0.045));
            c.save(); c.beginPath(); c.rect(x - 10, 740, cw + 20, 104); c.clip();
            text(c, ch, x, 838 + (1 - p) * 100, { font: 'Archivo, sans-serif', weight: 900, size: 92, color: '#fff4ea' });
            c.restore();
            x += cw;
          }
          c.restore();
          const sa = E.outC(seg(t, 8.8, 9.25));
          text(c, 'FACETED  GEOMETRY  ·  1990s —', 960, 894, { font: MONO, size: 17, ls: 6, align: 'center', color: `rgba(255,214,190,${0.75 * sa})` });
          c.fillStyle = `rgba(255,170,120,${sa})`;
          const lw = 120 * E.outQt(sa);
          c.fillRect(960 - 330 - lw, 888, lw, 2); c.fillRect(960 + 330, 888, lw, 2);
        }
      }
      // hook flash + climax flash
      const fl = bump(t, 6.38, 0.12, 0.02, 0.35);
      if (fl > 0) { c.fillStyle = `rgba(255,226,196,${fl * 0.55})`; c.fillRect(0, 0, W, H); }
      if (t < 0.5) { c.fillStyle = `rgba(16,12,40,${1 - E.outC(seg(t, 0, 0.5))})`; c.fillRect(0, 0, W, H); }
      grain(c, W, H, t, 0.05);
      vignette(c, W, H, 0.38, '20,10,40');
    },
    score(A) {
      // wind bed + sub
      A.noise(0, { type: 'bandpass', f: 400, f2: 1400, q: 0.6, dur: 6.8, g: 0.05, swell: 0.5, sweep: 6.5 });
      A.osc(0, { f: midi(38), dur: 7.2, g: 0.08, a: 1.2, hold: true, rel: 0.6 });
      // skimming over water: two quick passes
      A.whoosh(0.15, 0.7, { f1: 600, f2: 3000, g: 0.12, pan: -0.4 });
      A.whoosh(0.85, 2.4, { f1: 200, f2: 1600, g: 0.14, swell: 0.4, pan: 0.2 });
      // crane-up reveal: warm pad
      A.chord(1.0, [50, 57, 62, 64, 69, 73], { type: 'triangle', dur: 5.6, g: 0.025, a: 1.6, hold: true, rel: 1.0, lp: 600, lp2: 3200, lpT: 3, spread: 7, width: 1.3, rev: 0.6 });
      // crystalline arpeggio
      const arp = [62, 69, 74, 76, 81, 76, 74, 69];
      for (let k = 0; k < 14; k++) A.pluck(1.2 + k * 0.375, midi(arp[k % 8] + (k >= 8 ? 2 : 0)), { g: 0.13, dur: 1.4, bright: 0.85, pan: k % 2 ? 0.4 : -0.4, rev: 0.35 });
      for (let k = 0; k < 8; k++) A.bell(2.7 + k * 0.75, midi(86 + [0, 7, 4, 9][k % 4]), { g: 0.025, dur: 1.4, pan: (k % 2 ? 0.6 : -0.6) });
      // ridge crest + sun flare
      A.riser(5.2, 1.25, { g: 0.13, f: 73.4 });
      A.noise(6.1, { type: 'highpass', f: 5000, dur: 0.5, g: 0.06, swell: 0.8, rev: 0.6 });
      // mosaic wipe: crisp facet ticks sweeping across
      for (let k = 0; k < 18; k++) A.noise(6.5 + k * 0.034, { type: 'bandpass', f: 2600 + k * 160, q: 3, dur: 0.03, g: 0.05, pan: (k / 17 - 0.5) * 1.4 });
      A.impact(6.95, 0.5, { rev: 0.7 });
      A.chord(6.95, [38, 45, 50, 57], { type: 'sine', dur: 2.4, g: 0.04, a: 0.05, rev: 0.6 });
      // fox: one glassy note per facet, pentatonic climb
      const pent = [62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86];
      for (let k = 0; k < 27; k++) {
        const tt = 7.15 + k * 0.042;
        if (k % 2 === 0) A.pluck(tt + 0.3, midi(pent[Math.min(10, (k / 2.6) | 0)]), { g: 0.09, dur: 0.9, bright: 0.9, pan: hash(k) * 1.2 - 0.6, rev: 0.3 });
      }
      A.noise(7.15, { type: 'bandpass', f: 1200, f2: 6000, q: 1.2, dur: 1.2, g: 0.05, swell: 0.7, rev: 0.4 });
      // eyes open + title
      A.bell(8.3, midi(93), { g: 0.06, dur: 1.6 });
      A.kick(8.5, 0.5);
      A.chord(8.5, [50, 57, 62, 66, 69, 74], { type: 'triangle', dur: 1.5, g: 0.03, a: 0.02, rev: 0.7, width: 1.4 });
      A.bell(8.85, midi(86), { g: 0.05, dur: 1.2, pan: 0.3 });
    },
  });

  /* ================= D2 VOXEL — MagicaVoxel diorama ================= */
  const VX_C = [5.5, 3.2, 5.5];
  const VX_L = norm([-0.45, 1, -0.3]);
  const VX_TNT = [5, 4, 3], VX_BOOM = 6.0;
  const VX_COL = {
    grass: [124, 200, 92], grassS: [104, 168, 76], dirt: [156, 106, 70], stone: [138, 142, 158], deep: [104, 106, 128],
    water: [80, 182, 236], wood: [122, 82, 52], leaf: [72, 170, 84], leaf2: [104, 196, 92], plank: [222, 164, 104],
    roof: [212, 86, 66], door: [96, 60, 40], win: [255, 222, 128], path: [196, 184, 164], cloud: [252, 252, 255],
  };
  function vxBuild() {
    const vox = [];
    const add = (x, y, z, kind, col, phase) => vox.push({ x, y, z, kind, col: mul3(col || VX_COL[kind], 0.93 + h2(x * 7 + y, z * 3 - y, 31) * 0.14), phase });
    const RY = { 3: 6.1, 2: 5.7, 1: 4.9, 0: 4.0, '-1': 3.0, '-2': 1.9, '-3': 1.0 };
    const inPond = (x, z) => ((x - 8.2) ** 2) / 2.6 + ((z - 3) ** 2) / 1.6 < 1;
    const PATH = new Set(['3,5', '4,5', '4,4', '5,4', '6,4', '6,5']);
    for (let y = -3; y <= 3; y++) for (let x = 0; x < 12; x++) for (let z = 0; z < 12; z++) {
      const dx = Math.abs(x - 5.5), dz = Math.abs(z - 5.5), R = RY[y] - (y < 3 ? h2(x, z * 5 + y, 33) * 0.9 : 0);
      if (Math.max(dx, dz) > R || dx + dz > R * 1.6) continue;
      if (y === 3) {
        if (inPond(x, z)) { add(x, 2.5, z, 'water'); continue; }
        add(x, y, z, PATH.has(x + ',' + z) ? 'path' : 'grass');
      } else if (y >= 1) add(x, y, z, y === 2 && inPond(x, z) ? 'dirt' : (h2(x, z, y) > 0.8 ? 'stone' : 'dirt'));
      else add(x, y, z, h2(x, z, y + 9) > 0.5 ? 'stone' : 'deep');
    }
    // fix pond: dirt bed under water sits at y=2 (already), water voxels are y=2.5 half blocks
    // house
    for (let y = 4; y <= 5; y++) for (let x = 1; x <= 4; x++) for (let z = 6; z <= 9; z++) {
      let k = 'plank';
      if ((x === 1 || x === 4) && (z === 6 || z === 9)) k = 'wood';
      if (y === 4 && x === 3 && z === 6) k = 'door';
      if (y === 5 && ((x === 2 && z === 6) || (x === 4 && z === 8) || (x === 1 && z === 7))) k = 'win';
      add(x, y, z, k);
    }
    for (let x = 0; x <= 5; x++) for (let z = 5; z <= 10; z++) add(x, 6, z, 'roof');
    for (let x = 1; x <= 4; x++) for (let z = 6; z <= 9; z++) add(x, 7, z, 'roof', mul3(VX_COL.roof, 0.92));
    for (let x = 2; x <= 3; x++) for (let z = 7; z <= 8; z++) add(x, 8, z, 'roof', mul3(VX_COL.roof, 0.86));
    add(4, 8, 9, 'stone'); add(4, 9, 9, 'stone');
    // tree
    for (let y = 4; y <= 6; y++) add(8, y, 8, 'wood');
    for (let x = 7; x <= 9; x++) for (let z = 7; z <= 9; z++) {
      if (!(x === 8 && z === 8)) add(x, 6, z, (x + z) % 2 ? 'leaf' : 'leaf2');
      add(x, 7, z, (x + z) % 2 ? 'leaf2' : 'leaf');
    }
    [[8, 8], [7, 8], [9, 8], [8, 7], [8, 9]].forEach(([x, z]) => add(x, 8, z, 'leaf2'));
    add(10, 4, 3, 'stone'); add(10, 4, 4, 'stone', VX_COL.deep); add(1, 4, 2, 'stone');
    // build order: island layers, then structures layer by layer
    const LS = { '-3': 0.1, '-2': 0.3, '-1': 0.52, 0: 0.76, 1: 1.0, 2: 1.25, 2.5: 1.5, 3: 1.5, 4: 2.1, 5: 2.45, 6: 2.8, 7: 3.12, 8: 3.38, 9: 3.56 };
    vox.forEach(v => {
      v.tb = LS[v.y] + ((v.x + v.z) / 22) * 0.3 + h2(v.x, v.z, v.y * 3 + 40) * 0.05;
      v.water = v.kind === 'water';
      v.h = v.water ? 0.0 : 0;
      const d = Math.hypot(v.x - VX_TNT[0], (v.y - VX_TNT[1]) * 1.2, v.z - VX_TNT[2]);
      v.dist = d;
      v.blast = (v.y >= 3 && d < 4.8) || (v.y >= 2 && d < 2.4) || (v.y >= 4 && d < 5.6);
      if (v.blast) {
        const dir = norm([v.x - VX_TNT[0] + (h2(v.x, v.y, 51) - 0.5) * 0.6, v.y - VX_TNT[1] + 1.4, v.z - VX_TNT[2] + (h2(v.z, v.y, 52) - 0.5) * 0.6]);
        const sp = (17 - d * 2) * (0.75 + 0.5 * h2(v.x, v.z, v.y + 53));
        v.vel = mul3(dir, Math.max(3, sp));
        v.spin = [(h2(v.x, v.y, 54) - 0.5) * 14, (h2(v.y, v.z, 55) - 0.5) * 14, (h2(v.z, v.x, 56) - 0.5) * 14];
        v.rd = 7.0 + d * 0.07 + h2(v.x, v.z, 57) * 0.14;
      }
    });
    const clouds = [];
    [].forEach(([cx, cy, cz, s]) => {
      const R = rng(80 + s), seen = new Set();
      for (let k = 0; k < 14; k++) { const x = cx + ((R() * 5) | 0), z = cz + ((R() * 3) | 0), y = cy + (k > 9 ? 0.64 : 0), key = x + ',' + y + ',' + z; if (seen.has(key)) continue; seen.add(key); clouds.push({ x, y, z, s }); }
    });
    return { vox, clouds, occ: new Uint8Array(32 * 32 * 32) };
  }
  const vxKey = (x, y, z) => (x + 8) + (Math.round(y) + 8) * 32 + (z + 8) * 1024;

  function vxCam(t, W, H) {
    let shx = 0, shy = 0;
    const sk = Math.exp(-Math.max(0, t - VX_BOOM) * 4) * (t > VX_BOOM ? 1 : 0);
    if (sk > 0.01) { shx = (hash(t * 91) - 0.5) * 34 * sk; shy = (hash(t * 57 + 3) - 0.5) * 34 * sk; }
    const yaw = kf(t, [[0, 0.5], [6, 1.02, E.lin], [10, 1.38, E.outC]]) + 0.1 * Math.sin(t * 0.4);
    const pitch = kf(t, [[0, 0.82], [3.6, 0.6, E.ioC], [10, 0.56]]);
    const S = kf(t, [[0, 58], [3.6, 64, E.ioC], [5.9, 72, E.ioS], [6.05, 64, E.outC], [7.6, 66], [10, 62]]);
    const oy = kf(t, [[0, 70], [3.6, 10], [8.4, 10], [9.2, -50, E.ioC]]);
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const bob = Math.sin(t * 1.4) * 0.08;
    return {
      yaw, cy, sy, cp, sp, S,
      proj(x, y, z) {
        const X = x - VX_C[0], Y = y - VX_C[1] + bob, Z = z - VX_C[2];
        const xr = X * cy - Z * sy, zr = X * sy + Z * cy;
        return [W / 2 + shx + S * xr, H / 2 + oy + shy - S * (Y * cp + zr * sp), zr * cp - Y * sp];
      },
      depth(x, y, z) { const X = x - VX_C[0], Y = y - VX_C[1], Z = z - VX_C[2]; return (X * sy + Z * cy) * cp - Y * sp; },
      facing(n) { return (n[0] * sy + n[2] * cy) * cp - n[1] * sp < 0; },
    };
  }

  const VX_FACES = [[1, 3, 7, 5, [1, 0, 0]], [4, 6, 2, 0, [-1, 0, 0]], [2, 6, 7, 3, [0, 1, 0]], [0, 1, 5, 4, [0, -1, 0]], [4, 5, 7, 6, [0, 0, 1]], [0, 2, 3, 1, [0, 0, -1]]];
  function rotM(rx, ry, rz) {
    const a = Math.cos(rx), b = Math.sin(rx), c = Math.cos(ry), d = Math.sin(ry), e = Math.cos(rz), f = Math.sin(rz);
    return p => { const x1 = p[0] * e - p[1] * f, y1 = p[0] * f + p[1] * e; const y2 = y1 * a - p[2] * b, z2 = y1 * b + p[2] * a; return [x1 * c + z2 * d, y2, -x1 * d + z2 * c]; };
  }
  // draw one box item: {p:[x,y,z], h:[hx,hy,hz], rot:fn|null, col, alpha, vox:{x,y,z}|null, glow, deco}
  function vxBox(c, cam, it, occ) {
    const { p, h, rot } = it;
    const P = [], S = [];
    for (let b = 0; b < 8; b++) {
      let q = [b & 1 ? h[0] : -h[0], b & 2 ? h[1] : -h[1], b & 4 ? h[2] : -h[2]];
      if (rot) q = rot(q);
      const w = [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
      P.push(w); S.push(cam.proj(w[0], w[1], w[2]));
    }
    if (it.alpha !== undefined) c.globalAlpha = it.alpha;
    for (const f of VX_FACES) {
      const n = rot ? rot(f[4]) : f[4];
      if (!cam.facing(n)) continue;
      const v = it.vox;
      if (v && occ) {
        const nk = vxKey(v.x + f[4][0], v.y + f[4][1], v.z + f[4][2]);
        if (occ[nk] && !(v.water && f[4][1] > 0)) continue;
      }
      const lam = Math.max(0, dot(n, VX_L));
      let col = mul3(it.col, 0.58 + 0.5 * lam + (n[1] > 0.5 ? 0.06 : 0));
      if (it.glow) col = mix3(col, [255, 255, 255], it.glow);
      c.beginPath();
      for (let k = 0; k < 4; k++) { const s = S[f[k]]; k ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }
      c.closePath();
      const cs = rgb(col, v && v.water ? 0.82 : 1);
      c.fillStyle = cs; c.fill();
      if (!(v && v.water)) { c.strokeStyle = cs; c.lineWidth = 0.8; c.stroke(); }
      // edge-based ambient occlusion
      if (v && occ && !v.water) {
        const fc = [0, 0, 0];
        for (let k = 0; k < 4; k++) { fc[0] += P[f[k]][0] / 4; fc[1] += P[f[k]][1] / 4; fc[2] += P[f[k]][2] / 4; }
        for (let k = 0; k < 4; k++) {
          const a = P[f[k]], b = P[f[(k + 1) % 4]];
          const dx = Math.round((a[0] + b[0]) - 2 * fc[0]), dy = Math.round((a[1] + b[1]) - 2 * fc[1]), dz = Math.round((a[2] + b[2]) - 2 * fc[2]);
          if (!occ[vxKey(v.x + f[4][0] + dx, v.y + f[4][1] + dy, v.z + f[4][2] + dz)]) continue;
          const sa = S[f[k]], sb = S[f[(k + 1) % 4]], sc2 = S[f[(k + 2) % 4]], sd = S[f[(k + 3) % 4]];
          const m1 = [(sa[0] + sb[0]) / 2, (sa[1] + sb[1]) / 2], m2 = [(sc2[0] + sd[0]) / 2, (sc2[1] + sd[1]) / 2];
          const g = c.createLinearGradient(m1[0], m1[1], m2[0], m2[1]);
          g.addColorStop(0, 'rgba(30,20,50,0.34)'); g.addColorStop(0.55, 'rgba(30,20,50,0)');
          c.fillStyle = g; c.fill();
        }
      }
      // crisp edges
      c.strokeStyle = n[1] > 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(20,16,40,0.16)';
      c.lineWidth = 1; c.stroke();
      if (it.deco) it.deco(c, cam, f, n, P);
    }
    c.globalAlpha = 1;
  }
  function vxQuad(c, cam, pts, col) {
    c.beginPath(); pts.forEach((w, k) => { const s = cam.proj(w[0], w[1], w[2]); k ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); c.closePath();
    c.fillStyle = col; c.fill();
  }
  // character: blocky figure, returns box items
  function vxChar(pos, th, phase, spinR, squash, look) {
    const items = [];
    const ct = Math.cos(th), st2 = Math.sin(th);
    const K = 1.3;
    const toW = q0 => { const q = [q0[0] * K, q0[1] * K, q0[2] * K]; let x = q[0] * ct + q[2] * st2, z = -q[0] * st2 + q[2] * ct, y = q[1]; if (spinR) { const r = spinR([x, y - 0.6, z]); x = r[0]; y = r[1] + 0.6; z = r[2]; } return [pos[0] + x, pos[1] + y * squash, pos[2] + z]; };
    const R = spinR ? (q => spinR([q[0] * ct + q[2] * st2, q[1], -q[0] * st2 + q[2] * ct])) : (q => [q[0] * ct + q[2] * st2, q[1], -q[0] * st2 + q[2] * ct]);
    const sw = Math.sin(phase) * 0.12;
    const part = (cx, cy, cz, hx, hy, hz, col, deco) => items.push({ p: toW([cx, cy, cz]), h: [hx * K, hy * squash * K, hz * K], rot: R, col, deco });
    part(-0.11, 0.2, sw, 0.1, 0.2, 0.1, [58, 74, 150]);
    part(0.11, 0.2, -sw, 0.1, 0.2, 0.1, [58, 74, 150]);
    part(0, 0.62, 0, 0.24, 0.22, 0.15, [66, 196, 206]);
    part(-0.32, 0.62, -sw, 0.08, 0.21, 0.08, [242, 196, 158]);
    part(0.32, 0.62, sw, 0.08, 0.21, 0.08, [242, 196, 158]);
    part(0, 1.1, 0, 0.25, 0.25, 0.25, [246, 206, 168], (c, cam, f, n) => {
      if (f[4][2] !== 1) return;
      const blink = look ? 1 : 1;
      [-0.11, 0.11].forEach(ex => vxQuad(c, cam, [[ex - 0.045, 1.14 + 0.06 * blink, 0.252], [ex + 0.045, 1.14 + 0.06 * blink, 0.252], [ex + 0.045, 1.06, 0.252], [ex - 0.045, 1.06, 0.252]].map(toW), '#2a2238'));
      vxQuad(c, cam, [[-0.2, 0.99, 0.252], [-0.12, 0.99, 0.252], [-0.12, 0.95, 0.252], [-0.2, 0.95, 0.252]].map(toW), 'rgba(255,120,120,0.6)');
      vxQuad(c, cam, [[0.12, 0.99, 0.252], [0.2, 0.99, 0.252], [0.2, 0.95, 0.252], [0.12, 0.95, 0.252]].map(toW), 'rgba(255,120,120,0.6)');
    });
    part(0, 1.33, -0.03, 0.27, 0.06, 0.27, [92, 58, 40]);
    return items;
  }
  function vxCharState(t, cam) {
    const A = [2.4, 4, 4.4], B = [3.9, 4, 3.3], Cc = [8.5, 4, 6.3], FIN = [3.6, 4, 3.6];
    const toCam = cam.yaw + Math.PI;
    if (t < 3.7) return null;
    let pos, th = toCam, phase = 0, squash = 1, spin = null;
    if (t < 4.05) {
      const p = E.inQ(seg(t, 3.7, 4.0));
      pos = [A[0], A[1] + (1 - p) * 7, A[2]]; spin = rotM(0, (1 - p) * 6, 0);
      if (t > 4.0) squash = 1 - 0.25 * Math.sin(seg(t, 4.0, 4.05) * Math.PI);
    } else if (t < 4.8) {
      const p = seg(t, 4.1, 4.75), e = E.ioS(p);
      pos = [lerp(A[0], B[0], e), 4 + 0.22 * Math.abs(Math.sin(p * Math.PI * 4)), lerp(A[2], B[2], e)];
      th = lerp(toCam, Math.atan2(B[0] - A[0], B[2] - A[2]), E.outC(seg(t, 4.05, 4.2)));
      phase = p * 4 * Math.PI;
    } else if (t < 5.05) {
      pos = B.slice(); th = Math.atan2(VX_TNT[0] - B[0], VX_TNT[2] - B[2]);
      squash = 1 - 0.08 * Math.sin(seg(t, 4.85, 5.0) * Math.PI);
    } else if (t < VX_BOOM) {
      const p = seg(t, 5.05, 5.6), e = E.outC(p);
      pos = [lerp(B[0], Cc[0], e), 4 + 0.3 * Math.abs(Math.sin(p * Math.PI * 3)) * (p < 1 ? 1 : 0), lerp(B[2], Cc[2], e)];
      th = p < 1 ? Math.atan2(Cc[0] - B[0], Cc[2] - B[2]) : lerp(Math.atan2(Cc[0] - B[0], Cc[2] - B[2]), Math.atan2(VX_TNT[0] - Cc[0], VX_TNT[2] - Cc[2]) + 0.6, E.outB(seg(t, 5.6, 5.8)));
      phase = p * 6 * Math.PI;
      if (t > 5.8) squash = 1 + 0.05 * Math.sin((t - 5.8) * 40) * (1 - seg(t, 5.8, 6));
    } else {
      const e = vxSlow(t - VX_BOOM);
      const v = [3.5, 9.5, -1.5];
      const ex = [Cc[0] + v[0] * e, 4 + v[1] * e - 10 * e * e, Cc[2] + v[2] * e];
      const r = E.ioC(seg(t, 7.35, 8.05));
      const arc = Math.sin(r * Math.PI) * 1.5;
      pos = [lerp(ex[0], FIN[0], r), lerp(ex[1], FIN[1], r) + arc, lerp(ex[2], FIN[2], r)];
      const sa = (1 - r) * e * 9;
      spin = sa > 0.001 ? rotM(sa * 1.3, sa * 0.6, sa) : null;
      th = lerp(Math.atan2(VX_TNT[0] - Cc[0], VX_TNT[2] - Cc[2]), toCam, r);
      if (t > 8.05) {
        const k = t - 8.05;
        squash = 1 - 0.22 * Math.exp(-k * 9) * Math.cos(k * 30);
        const hop = seg(t, 8.35, 8.75);
        pos[1] += Math.sin(hop * Math.PI) * 0.9;
        if (t > 8.75) squash = 1 - 0.15 * Math.exp(-(t - 8.75) * 10) * Math.cos((t - 8.75) * 30);
      }
    }
    return { pos, th, phase, squash, spin };
  }
  const vxSlow = x => (x <= 0 ? 0 : x < 0.4 ? x : 0.4 + (x - 0.4) * 0.22);

  MG.film({
    id: 'voxel', dur: 10, poster: 9.4,
    fonts: [['700 80px Silkscreen', 'VOXEL MOTION'], ['400 16px "JetBrains Mono"', 'Aa1·—×']],
    meta: {
      family: 'D', name: 'Voxel Motion', sub: 'Volumetric Pixels', era: '2009 —',
      origin: 'Voxels — volumetric pixels — came from medical imaging and 1990s voxel engines (Comanche, Outcast); Minecraft (2009) made the cube a mass aesthetic and MagicaVoxel (2013) gave motion designers a free, toy-like voxel studio with soft AO renders.',
      works: 'Comanche (NovaLogic, 1992) · Minecraft (Mojang, 2009) · MagicaVoxel (ephtracy, 2013) · Crossy Road (Hipster Whale, 2014) · Teardown (Tuxedo Labs, 2022)',
      tech: ['Orthographic camera orbit + painter’s sort', 'Face culling on an occupancy grid', 'Edge-based ambient occlusion per face'],
      accent: '#7cc85c',
      motionDNA: 'Block-by-block construction layer after layer, a tiny character hop-walk, then a blast that freezes in bullet-time and rewinds into place.',
      visualDNA: 'Unit cubes with crisp edges, soft AO in creases, toy-like saturated palette, floating island diorama.',
      transitions: 'Layer build-up, block pop-in, explosion scatter, undo rewind.',
      implementation: ['MagicaVoxel', 'Blender (voxel remesh)', 'Three.js InstancedMesh', 'Canvas 2D'],
      reproducibility: 'Fully procedural', loopable: false,
    },
    setup() { return vxBuild(); },
    draw(c, t, W, H, st) {
      const cam = vxCam(t, W, H);
      // pastel studio
      const bg = c.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#9fd3ea'); bg.addColorStop(0.62, '#e3eef0'); bg.addColorStop(1, '#f6e4cf');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      const hl = c.createRadialGradient(W * 0.5, H * 0.38, 0, W * 0.5, H * 0.38, 900);
      hl.addColorStop(0, 'rgba(255,255,255,0.55)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = hl; c.fillRect(0, 0, W, H);
      // floor shadow far below the floating island
      const gs = cam.proj(5.5, -9, 5.5);
      c.save(); c.translate(gs[0], gs[1]); c.scale(1, cam.sp);
      const sg = c.createRadialGradient(0, 0, 0, 0, 0, 7 * cam.S);
      sg.addColorStop(0, 'rgba(60,70,110,0.28)'); sg.addColorStop(1, 'rgba(60,70,110,0)');
      c.fillStyle = sg; c.beginPath(); c.arc(0, 0, 7 * cam.S, 0, TAU); c.fill(); c.restore();

      const items = [];
      const occ = st.occ; occ.fill(0);
      let placed = 0;
      const ex = t > VX_BOOM ? vxSlow(t - VX_BOOM) : 0;
      for (const v of st.vox) {
        if (t < v.tb) continue;
        placed++;
        let p = [v.x, v.y, v.z], rot = null, rest = true, sq = 1;
        const df = seg(t, v.tb, v.tb + 0.26);
        if (df < 1) { p[1] += (1 - E.inQ(df)) * 2.4; rest = false; }
        else { const k = t - v.tb - 0.26; sq = 1 - 0.18 * Math.exp(-k * 14) * Math.cos(k * 32); }
        if (v.blast && t > VX_BOOM) {
          const r = E.ioC(seg(t, v.rd, v.rd + 0.62));
          if (r < 1) {
            rest = false;
            const ep = [v.x + v.vel[0] * ex, v.y + v.vel[1] * ex - 10 * ex * ex, v.z + v.vel[2] * ex];
            p = [lerp(ep[0], v.x, r), lerp(ep[1], v.y, r), lerp(ep[2], v.z, r)];
            const k = (1 - r) * ex;
            rot = rotM(v.spin[0] * k, v.spin[1] * k, v.spin[2] * k);
          } else { const k = t - v.rd - 0.62; sq = 1 - 0.14 * Math.exp(-k * 14) * Math.cos(k * 32); }
        }
        if (rest && !v.water) occ[vxKey(v.x, v.y, v.z)] = 1;
        const hh = v.water ? 0.4 : 0.5;
        items.push({ p: [p[0], p[1] - (v.water ? 0.1 : 0) - (1 - sq) * 0.5, p[2]], h: [0.5, hh * sq, 0.5], rot, col: v.col, vox: rest ? v : null, d: cam.depth(p[0], p[1], p[2]) });
        if (v.water && rest) {
          const w = items[items.length - 1];
          w.col = mix3(v.col, [210, 246, 255], 0.25 + 0.25 * Math.sin(t * 2.4 + v.x * 1.3 + v.z * 0.9));
          w.alpha = 0.86;
        }
      }
      // water voxels occupy for their neighbours only
      for (const v of st.vox) if (v.water && t >= v.tb + 0.26) occ[vxKey(v.x, 3, v.z)] = 0;
      for (const it of items) if (it.vox && it.vox.water) { /* water culls against solids only */ }
      // clouds
      for (const cl of st.clouds) {
        const a = seg(t, 0.2 + cl.s * 0.3, 1.2 + cl.s * 0.3);
        if (!a) continue;
        const x = cl.x + Math.sin(t * 0.3 + cl.s) * 0.6 + t * 0.12;
        items.push({ p: [x, cl.y + (1 - E.outC(a)) * 2, cl.z], h: [0.5, 0.32, 0.5], rot: null, col: VX_COL.cloud, alpha: 0.75 * a, d: cam.depth(x, cl.y, cl.z) });
      }
      // flowers
      [[5, 9, [255, 96, 120]], [6, 10, [255, 214, 80]], [10, 7, [255, 255, 255]], [2, 3, [255, 140, 190]], [7, 1, [255, 214, 80]]].forEach(([x, z, col], k) => {
        const tb = 1.9 + k * 0.08;
        if (t < tb) return;
        const pop = E.outB(seg(t, tb, tb + 0.3), 3);
        const blasted = Math.hypot(x - VX_TNT[0], z - VX_TNT[2]) < 4.6 && t > VX_BOOM && t < 7.9;
        if (blasted) return;
        items.push({ p: [x, 3.62 + 0.12 * pop, z], h: [0.13 * pop, 0.13 * pop, 0.13 * pop], rot: rotM(0, 0.6, 0), col, d: cam.depth(x, 3.7, z) });
      });
      // TNT
      if (t > 4.82 && t < VX_BOOM) {
        const p = E.inQ(seg(t, 4.82, 5.0));
        const sw = 1 + 0.08 * seg(t, 5.4, 6.0) * Math.abs(Math.sin(t * 30));
        const blink = t > 5.1 ? (Math.sin((t - 5.1) * (8 + (t - 5.1) * 26)) > 0.3 ? 0.75 : 0) : 0;
        const y = VX_TNT[1] + (1 - p) * 6;
        items.push({ p: [VX_TNT[0], y, VX_TNT[2]], h: [0.5 * sw, 0.5 * sw, 0.5 * sw], rot: null, col: [214, 52, 46], glow: blink, d: cam.depth(VX_TNT[0], y, VX_TNT[2]),
          deco(c, cm, f, n) {
            if (Math.abs(f[4][1]) > 0) return;
            const a = f[4][0], b = f[4][2], o = 0.502 * sw;
            const pts = a ? [[o * a, -0.16, -0.5], [o * a, -0.16, 0.5], [o * a, 0.16, 0.5], [o * a, 0.16, -0.5]] : [[-0.5, -0.16, o * b], [0.5, -0.16, o * b], [0.5, 0.16, o * b], [-0.5, 0.16, o * b]];
            vxQuad(c, cm, pts.map(q => [VX_TNT[0] + q[0] * sw, y + q[1] * sw, VX_TNT[2] + q[2] * sw]), blink ? 'rgba(255,255,255,0.95)' : 'rgba(246,238,226,0.95)');
          } });
      }
      // explosion puffs
      if (t > VX_BOOM && t < 7.6) {
        for (let k = 0; k < 34; k++) {
          const life = clamp(ex / (0.35 + hash(k * 3) * 0.3));
          if (life >= 1) continue;
          const dir = norm([hash(k) - 0.5, hash(k + 9) * 0.9 + 0.1, hash(k + 17) - 0.5]);
          const rr = (0.6 + 3.2 * E.outC(life)) * (0.6 + hash(k + 5) * 0.6);
          const p = [VX_TNT[0] + dir[0] * rr, VX_TNT[1] + dir[1] * rr, VX_TNT[2] + dir[2] * rr];
          const s = (0.5 + hash(k + 2) * 0.5) * (1 - life) * 0.9 + 0.05;
          const col = life < 0.3 ? mix3([255, 248, 210], [255, 160, 50], life / 0.3) : mix3([255, 160, 50], [120, 112, 124], (life - 0.3) / 0.7);
          items.push({ p, h: [s, s, s], rot: rotM(k, k * 2, 0), col, alpha: 1 - life * 0.6, glow: life < 0.15 ? 0.6 : 0, d: cam.depth(p[0], p[1], p[2]) });
        }
      }
      // character
      const ch = vxCharState(t, cam);
      if (ch) vxChar(ch.pos, ch.th, ch.phase, ch.spin, ch.squash, true).forEach(it => { it.d = cam.depth(it.p[0], it.p[1], it.p[2]) - 0.15; items.push(it); });

      items.sort((a, b) => b.d - a.d);
      for (const it of items) vxBox(c, cam, it, it.vox ? occ : null);

      // MagicaVoxel-style editing plane during build
      const ga = seg(t, 0.15, 0.4) * (1 - seg(t, 3.5, 3.9));
      if (ga > 0) {
        const ly = kf(t, [[0.2, -3.5], [1.7, 3.5, E.lin], [3.6, 9.5, E.lin]]);
        c.save(); c.strokeStyle = `rgba(255,255,255,${0.32 * ga})`; c.lineWidth = 1;
        c.beginPath();
        for (let k = -1; k <= 13; k++) {
          let a = cam.proj(k - 0.5, ly, -1.5), b = cam.proj(k - 0.5, ly, 12.5); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
          a = cam.proj(-1.5, ly, k - 0.5); b = cam.proj(12.5, ly, k - 0.5); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]);
        }
        c.stroke();
        c.strokeStyle = `rgba(255,96,140,${0.8 * ga})`; c.lineWidth = 2;
        c.beginPath(); [[-1.5, -1.5], [12.5, -1.5], [12.5, 12.5], [-1.5, 12.5]].forEach(([x, z], k) => { const s = cam.proj(x, ly, z); k ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); c.closePath(); c.stroke();
        c.restore();
      }
      // shockwave ring
      if (t > VX_BOOM && t < 6.9) {
        const k = seg(t, VX_BOOM, 6.9), R = 1 + E.outC(k) * 11;
        c.save(); c.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; c.lineWidth = 6 * (1 - k) + 1;
        c.beginPath();
        for (let m = 0; m <= 40; m++) { const a = m / 40 * TAU, s = cam.proj(VX_TNT[0] + Math.cos(a) * R, 3.6, VX_TNT[2] + Math.sin(a) * R); m ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }
        c.stroke(); c.restore();
      }
      const fl = bump(t, VX_BOOM, 0.02, 0.04, 0.3);
      if (fl > 0) { c.fillStyle = `rgba(255,250,236,${fl * 0.85})`; c.fillRect(0, 0, W, H); }

      // HUD
      const ui = seg(t, 0.3, 0.7) * (1 - seg(t, 8.2, 8.6));
      if (ui > 0) {
        text(c, 'VOXEL  /  12 × 12 × 12', 96, 96, { font: MONO, size: 15, ls: 2, color: `rgba(30,40,70,${0.55 * ui})` });
        text(c, 'VOXELS  ' + String(placed).padStart(4, '0'), 96, 124, { font: MONO, size: 15, ls: 2, color: `rgba(30,40,70,${0.8 * ui})` });
        const mode = t < 3.7 ? 'ATTACH  ·  LAYER ' + Math.max(0, Math.min(12, Math.floor(kf(t, [[0.2, 0], [1.7, 7, E.lin], [3.6, 13, E.lin]])))) : t < VX_BOOM ? 'PLAY  ·  CHARACTER' : t < 6.95 ? 'PHYSICS  ·  0.3×' : 'UNDO  ·  ⌘Z';
        c.fillStyle = t >= 6.95 && t < 8.2 ? `rgba(255,96,140,${ui})` : `rgba(124,200,92,${ui})`;
        c.fillRect(96, 140, 10, 10);
        text(c, mode, 116, 150, { font: MONO, size: 15, ls: 2, color: `rgba(30,40,70,${0.75 * ui})` });
        text(c, 'F ' + String(Math.floor(t * 30)).padStart(4, '0'), W - 96, 96, { font: MONO, size: 15, ls: 2, align: 'right', color: `rgba(30,40,70,${0.45 * ui})` });
      }
      // rewind glyph
      const rw = seg(t, 6.95, 7.05) * (1 - seg(t, 7.9, 8.1));
      if (rw > 0) {
        c.save(); c.globalAlpha = rw * (0.75 + 0.25 * Math.sin(t * 20));
        c.fillStyle = '#ff6090';
        const x = W / 2 - 34, y = 150;
        [0, 34].forEach(o => { c.beginPath(); c.moveTo(x + o + 30, y - 22); c.lineTo(x + o, y); c.lineTo(x + o + 30, y + 22); c.fill(); });
        c.restore();
      }
      // title
      const ta = seg(t, 8.45, 8.95);
      if (ta > 0) {
        const word = 'VOXEL MOTION';
        c.save(); c.font = '700 104px Silkscreen, monospace';
        const w0 = c.measureText(word).width; let x = W / 2 - w0 / 2;
        for (let i = 0; i < word.length; i++) {
          const chh = word[i], cw = c.measureText(chh).width;
          const p = seg(t, 8.45 + i * 0.035, 8.6 + i * 0.035);
          if (p > 0 && chh !== ' ') {
            const yy = 948 - E.outB(p, 3) * 10 + 10;
            text(c, chh, x + 6, yy + 7, { font: 'Silkscreen, monospace', weight: 700, size: 104, color: 'rgba(40,60,110,0.25)' });
            text(c, chh, x, yy, { font: 'Silkscreen, monospace', weight: 700, size: 104, color: i < 5 ? '#2c3e66' : '#5bb34a' });
          }
          x += cw;
        }
        c.restore();
        const sa = E.outC(seg(t, 8.8, 9.2));
        text(c, 'VOLUMETRIC PIXELS  ·  2009 —', W / 2, 1012, { font: MONO, size: 16, ls: 6, align: 'center', color: `rgba(40,60,110,${0.6 * sa})` });
      }
      grain(c, W, H, t, 0.035);
      vignette(c, W, H, 0.18, '40,60,90');
    },
    score(A) {
      A.osc(0, { f: midi(36), dur: 6.0, g: 0.06, a: 0.8, hold: true, rel: 0.2 });
      // island layers: thock + a little run of blips per layer
      const LT = [0.1, 0.3, 0.52, 0.76, 1.0, 1.25, 1.5];
      const sc = [60, 62, 64, 67, 69, 72, 74, 76, 79];
      LT.forEach((tt, k) => {
        A.osc(tt + 0.26, { f: 220, f2: 70, glide: 0.06, dur: 0.12, g: 0.22 });
        A.noise(tt + 0.26, { type: 'bandpass', f: 1800, q: 1.5, dur: 0.025, g: 0.06 });
        for (let m = 0; m < 3; m++) A.osc(tt + 0.3 + m * 0.07, { type: 'triangle', f: midi(sc[(k + m) % 9] + 12), dur: 0.09, g: 0.05, pan: (m - 1) * 0.5 });
      });
      // structures: marimba plucks up the scale
      [2.1, 2.45, 2.8, 3.12, 3.38, 3.56].forEach((tt, k) => {
        A.pluck(tt + 0.26, midi(sc[k + 2] + 12), { g: 0.16, dur: 0.7, bright: 0.6, rev: 0.25, pan: k % 2 ? 0.3 : -0.3 });
        A.pluck(tt + 0.33, midi(sc[k + 4] + 12), { g: 0.09, dur: 0.5, bright: 0.6, rev: 0.25 });
        A.osc(tt + 0.26, { f: 180, f2: 60, glide: 0.06, dur: 0.1, g: 0.14 });
      });
      for (let k = 0; k < 14; k++) A.hat(0.3 + k * 0.25, 0.03 + (k % 2) * 0.015, false, { pan: 0.25 });
      // character drop + hops
      A.osc(3.7, { f: 1400, f2: 300, glide: 0.3, dur: 0.32, g: 0.07 });
      A.osc(4.0, { f: 160, f2: 60, glide: 0.08, dur: 0.15, g: 0.25 });
      A.osc(4.02, { type: 'square', f: 520, f2: 880, glide: 0.1, dur: 0.12, g: 0.03, lp: 2400 });
      for (let k = 0; k < 4; k++) A.osc(4.1 + k * 0.1625 + 0.08, { type: 'triangle', f: 700 + k * 60, f2: 400, glide: 0.06, dur: 0.07, g: 0.06 });
      // TNT drops, fuse hiss + accelerating beeps
      A.osc(5.0, { f: 140, f2: 50, glide: 0.1, dur: 0.2, g: 0.3 });
      A.noise(5.0, { type: 'highpass', f: 4000, dur: 1.0, g: 0.05, hold: true });
      for (let k = 0, tt = 5.15; tt < 5.95; k++) { A.osc(tt, { type: 'square', f: 1320, dur: 0.05, g: 0.035, lp: 3000 }); tt += Math.max(0.06, 0.22 - k * 0.025); }
      for (let k = 0; k < 3; k++) A.osc(5.08 + k * 0.1, { type: 'triangle', f: 900 - k * 120, dur: 0.06, g: 0.05 });
      // BOOM, then bullet-time debris
      A.impact(VX_BOOM, 0.5, { rev: 0.6 });
      A.kick(VX_BOOM, 0.4);
      A.noise(VX_BOOM, { type: 'lowpass', f: 2600, f2: 300, dur: 1.2, g: 0.2, crush: true });
      A.noise(VX_BOOM + 0.3, { type: 'lowpass', f: 600, dur: 0.7, g: 0.1, swell: 0.3, rev: 0.8 });
      for (let k = 0; k < 12; k++) A.osc(6.15 + k * 0.065, { type: 'triangle', f: midi(84 + ((hash(k) * 12) | 0)), dur: 0.12, g: 0.03, pan: hash(k + 3) * 1.6 - 0.8, rev: 0.4 });
      // UNDO rewind: tape-reverse swell then snaps
      A.noise(6.92, { type: 'bandpass', f: 300, f2: 4200, q: 1.5, dur: 0.6, g: 0.16, swell: 0.95 });
      A.osc(6.92, { type: 'sawtooth', f: 90, f2: 600, glide: 1.0, dur: 1.0, g: 0.04, lp: 900, lp2: 4000, lpT: 1.0 });
      for (let k = 0; k < 16; k++) { const tt = 7.35 + k * 0.045; A.osc(tt, { f: 600 + k * 70, f2: 220, glide: 0.04, dur: 0.05, g: 0.07, pan: (k % 2 ? 0.4 : -0.4) }); }
      // land, hop, title chord
      A.osc(8.05, { f: 170, f2: 55, glide: 0.08, dur: 0.18, g: 0.3 });
      A.osc(8.35, { type: 'square', f: 440, f2: 1180, glide: 0.18, dur: 0.22, g: 0.035, lp: 2600 });
      A.kick(8.75, 0.45);
      A.chord(8.75, [48, 55, 60, 64, 67, 72], { type: 'triangle', dur: 1.25, g: 0.035, a: 0.01, rev: 0.6, width: 1.2 });
      [72, 76, 79, 84].forEach((m, k) => A.pluck(8.75 + k * 0.06, midi(m), { g: 0.12, dur: 1.2, bright: 0.7, rev: 0.4 }));
    },
  });

  /* ================= D3 GLASSMORPHISM 3D ================= */
  const GL_F = 1000;
  const GL_SH = [
    { id: 'orbA', type: 'sphere', R: 150, te: 0.15, from: [1300, -60, 0], A: [380, -110, 0], C: [60, -20, -80], Fp: [450, 215, -140] },
    { id: 'pillA', type: 'pill', L: 560, R: 74, te: 1.2, from: [-1300, 600, 120], A: [-380, 170, 120], C: [-40, 40, 40], Fp: [-470, -250, 220], rA: -0.6, rF: -0.62 },
    { id: 'ring', type: 'ring', R: 180, r: 116, te: 1.8, from: [-700, -900, 300], A: [-560, -230, 300], C: [-30, -50, 120], Fp: [-500, 210, 180] },
    { id: 'tile', type: 'tile', S: 230, rr: 66, te: 2.3, from: [1300, 800, 220], A: [600, 270, 220], C: [40, 60, 160], Fp: [520, -250, 300], rA: 0.35, rF: 0.32 },
    { id: 'pillB', type: 'pill', L: 330, R: 48, te: 2.6, from: [200, -1000, 420], A: [60, -330, 420], C: [0, -60, 250], Fp: [560, -40, 420], rA: 0.9, rF: 1.25 },
    { id: 'orbB', type: 'sphere', R: 64, te: 3.0, from: [-400, 900, -150], A: [-90, 300, -150], C: [-80, 60, -150], Fp: [-470, 20, -220] },
    { id: 'orbC', type: 'sphere', R: 42, te: 3.25, from: [1200, -700, 60], A: [700, -330, 60], C: [90, 30, -40], Fp: [-180, -330, -260] },
  ];
  function glPose(s, i, t) {
    const pe = spring(t - s.te, 0.9, 0.62);
    const fl = [Math.sin(t * 0.7 + i * 1.7) * 22, Math.cos(t * 0.55 + i * 2.3) * 18, 0];
    let p = [lerp(s.from[0], s.A[0], pe) + fl[0], lerp(s.from[1], s.A[1], pe) + fl[1], lerp(s.from[2], s.A[2], pe)];
    let rot = (s.rA || 0) + Math.sin(t * 0.4 + i) * 0.12 + (1 - pe) * 0.8;
    let tilt = 0.25 + 0.5 * Math.sin(t * 0.8 + i * 0.9) * 0.6;
    const cv = E.inC(seg(t, 5.85, 6.55));
    const out = spring(t - 6.62, 1.1, 0.55);
    if (t > 5.85) {
      const swirl = cv * 1.4;
      const cp = [s.C[0] * Math.cos(swirl) - s.C[1] * Math.sin(swirl), s.C[0] * Math.sin(swirl) + s.C[1] * Math.cos(swirl), s.C[2]];
      p = [lerp(p[0], cp[0], cv), lerp(p[1], cp[1], cv), lerp(p[2], cp[2], cv)];
      rot += cv * 2.2;
    }
    if (t > 6.62) {
      const fl2 = [Math.sin(t * 0.7 + i * 1.7) * 14, Math.cos(t * 0.55 + i * 2.3) * 12, 0];
      const swirl = 1.4;
      const cp = [s.C[0] * Math.cos(swirl) - s.C[1] * Math.sin(swirl), s.C[0] * Math.sin(swirl) + s.C[1] * Math.cos(swirl), s.C[2]];
      p = [lerp(cp[0], s.Fp[0], out) + fl2[0], lerp(cp[1], s.Fp[1], out) + fl2[1], lerp(cp[2], s.Fp[2], out)];
      rot = lerp((s.rA || 0) + 2.2, (s.rF || 0) + Math.sin(t * 0.4 + i) * 0.06, out);
    }
    return { p, rot, tilt, vis: t > s.te };
  }
  function glBlurInit(st) {
    st.b1 = offscreen(480, 270); st.b1g = st.b1.getContext('2d');
    st.b2 = offscreen(120, 68); st.b2g = st.b2.getContext('2d');
    st.b3 = offscreen(48, 27); st.b3g = st.b3.getContext('2d');
    st.u1 = offscreen(480, 270); st.u1g = st.u1.getContext('2d');
    st.u2 = offscreen(480, 270); st.u2g = st.u2.getContext('2d');
    [st.b1g, st.b2g, st.b3g, st.u1g, st.u2g].forEach(g => { g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; });
  }
  // snapshot the canvas, return [medium-blur, heavy-blur] canvases at 480×270
  function glSnap(c, st) {
    const src = c.canvas;
    st.b1g.drawImage(src, 0, 0, src.width, src.height, 0, 0, 480, 270);
    st.b2g.drawImage(st.b1, 0, 0, 120, 68);
    st.b3g.drawImage(st.b2, 0, 0, 48, 27);
    st.u1g.drawImage(st.b2, 0, 0, 480, 270);
    st.u2g.drawImage(st.b3, 0, 0, 480, 270);
    return [st.u1, st.u2];
  }
  function glPath(sh, x, y, sc, rot, tilt) {
    const P = new Path2D();
    if (sh.type === 'sphere') { P.arc(x, y, sh.R * sc, 0, TAU); return P; }
    if (sh.type === 'ring') {
      const ry = Math.max(0.28, Math.abs(Math.cos(tilt * 1.6)));
      P.ellipse(x, y, sh.R * sc, sh.R * sc * ry, rot, 0, TAU);
      P.ellipse(x, y, sh.r * sc, sh.r * sc * ry, rot, TAU, 0, true);
      return P;
    }
    const cr = Math.cos(rot), sr = Math.sin(rot);
    const pt = (a, b) => [x + a * cr - b * sr, y + a * sr + b * cr];
    if (sh.type === 'pill') {
      const hl = (sh.L / 2 - sh.R) * sc * (0.75 + 0.25 * Math.cos(tilt)), r = sh.R * sc;
      const a0 = pt(-hl, 0), a1 = pt(hl, 0);
      P.arc(a1[0], a1[1], r, rot - Math.PI / 2, rot + Math.PI / 2);
      P.arc(a0[0], a0[1], r, rot + Math.PI / 2, rot + Math.PI * 1.5);
      P.closePath();
      return P;
    }
    // rounded tile
    const hs = sh.S / 2 * sc, rr = sh.rr * sc, sx = 0.82 + 0.18 * Math.cos(tilt * 1.3);
    const corners = [[-hs * sx, -hs], [hs * sx, -hs], [hs * sx, hs], [-hs * sx, hs]];
    const k = rr;
    for (let i = 0; i < 4; i++) {
      const p0 = corners[i], p1 = corners[(i + 1) % 4], pm = corners[(i + 3) % 4];
      const inA = [p0[0] + Math.sign(pm[0] - p0[0]) * Math.min(k, Math.abs(pm[0] - p0[0]) / 2), p0[1] + Math.sign(pm[1] - p0[1]) * Math.min(k, Math.abs(pm[1] - p0[1]) / 2)];
      const outB = [p0[0] + Math.sign(p1[0] - p0[0]) * Math.min(k, Math.abs(p1[0] - p0[0]) / 2), p0[1] + Math.sign(p1[1] - p0[1]) * Math.min(k, Math.abs(p1[1] - p0[1]) / 2)];
      const A2 = pt(inA[0], inA[1]), C2 = pt(p0[0], p0[1]), B2 = pt(outB[0], outB[1]);
      i ? P.lineTo(A2[0], A2[1]) : P.moveTo(A2[0], A2[1]);
      P.quadraticCurveTo(C2[0], C2[1], B2[0], B2[1]);
    }
    P.closePath();
    return P;
  }
  function glShadow(c, P, sc, blur, off, alpha) {
    const a = c.getTransform().a;
    c.save();
    c.shadowColor = `rgba(24,6,48,${alpha})`;
    c.shadowBlur = blur * a; c.shadowOffsetX = 9000 * a + off[0] * a; c.shadowOffsetY = off[1] * a;
    c.translate(-9000, 0); c.fillStyle = '#000'; c.fill(P, 'evenodd');
    c.restore();
  }
  function glGlass(c, st, P, o) {
    // o: x,y,R (bounding radius), mag, dx, dy, heavy, sweep, type, sc, W, H
    const [bm, bh] = glSnap(c, st);
    const img = o.heavy ? bh : bm;
    c.save();
    c.clip(P, 'evenodd');
    const m = o.mag;
    c.drawImage(img, 0, 0, 480, 270, o.x - o.x * m + o.dx, o.y - o.y * m + o.dy, o.W * m, o.H * m);
    // frost tint, lit from top-left
    const g = c.createLinearGradient(o.x - o.R, o.y - o.R, o.x + o.R, o.y + o.R);
    g.addColorStop(0, `rgba(255,255,255,${o.tint0 ?? 0.26})`); g.addColorStop(0.5, 'rgba(255,255,255,0.08)'); g.addColorStop(1, `rgba(255,255,255,${o.tint1 ?? 0.04})`);
    c.fillStyle = g; c.fill(P, 'evenodd');
    if (o.type === 'sphere') {
      const r = o.R;
      const sg = c.createRadialGradient(o.x - r * 0.35, o.y - r * 0.4, r * 0.05, o.x, o.y, r);
      sg.addColorStop(0, 'rgba(255,255,255,0.42)'); sg.addColorStop(0.35, 'rgba(255,255,255,0.06)'); sg.addColorStop(0.82, 'rgba(255,255,255,0.0)'); sg.addColorStop(1, 'rgba(255,230,255,0.35)');
      c.fillStyle = sg; c.fill(P);
      const cg = c.createRadialGradient(o.x + r * 0.35, o.y + r * 0.45, 0, o.x + r * 0.35, o.y + r * 0.45, r * 0.6);
      cg.addColorStop(0, 'rgba(255,240,250,0.35)'); cg.addColorStop(1, 'rgba(255,240,250,0)');
      c.fillStyle = cg; c.fill(P);
      // inner edge darkening + sharp specular
      const eg = c.createRadialGradient(o.x, o.y, r * 0.7, o.x, o.y, r);
      eg.addColorStop(0, 'rgba(30,10,60,0)'); eg.addColorStop(1, 'rgba(30,10,60,0.28)');
      c.fillStyle = eg; c.fill(P);
      c.save(); c.translate(o.x - r * 0.4, o.y - r * 0.48); c.rotate(-0.7); c.scale(1, 0.55);
      const hg = c.createRadialGradient(0, 0, 0, 0, 0, r * 0.26);
      hg.addColorStop(0, 'rgba(255,255,255,0.95)'); hg.addColorStop(0.45, 'rgba(255,255,255,0.55)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = hg; c.beginPath(); c.arc(0, 0, r * 0.26, 0, TAU); c.fill(); c.restore();
      c.beginPath(); c.arc(o.x, o.y, r * 0.86, 0.2, 1.5); c.strokeStyle = 'rgba(255,240,255,0.28)'; c.lineWidth = Math.max(1.5, r * 0.03); c.lineCap = 'round'; c.stroke();
    }
    grain(c, o.W, o.H, 0.5, o.type === 'sphere' ? 0.035 : 0.07);
    if (o.sweep !== undefined) {
      const bx = o.sweep;
      const sg = c.createLinearGradient(bx - 260, 0, bx + 260, o.H * 0.4);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.32)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = sg; c.fill(P, 'evenodd');
    }
    c.restore();
    // rim: specular top-left, chromatic edge, dim bottom-right
    c.save();
    const rg = c.createLinearGradient(o.x - o.R, o.y - o.R, o.x + o.R, o.y + o.R);
    rg.addColorStop(0, 'rgba(255,255,255,0.95)'); rg.addColorStop(0.35, 'rgba(255,255,255,0.18)'); rg.addColorStop(0.7, 'rgba(255,255,255,0.08)'); rg.addColorStop(1, 'rgba(255,255,255,0.5)');
    c.translate(1.2, 0.8); c.strokeStyle = 'rgba(255,90,200,0.22)'; c.lineWidth = 2; c.stroke(P);
    c.translate(-2.4, -1.6); c.strokeStyle = 'rgba(90,220,255,0.22)'; c.stroke(P);
    c.translate(1.2, 0.8);
    c.strokeStyle = rg; c.lineWidth = 2.2; c.stroke(P);
    c.restore();
  }

  function glCard(c, st, t, W, H, sweepX) {
    const a = spring(t - 6.55, 1.0, 0.6);
    if (a <= 0.001) return;
    const tilt = (1 - E.outC(seg(t, 6.55, 7.3))) * 0.9;
    const cw = 840, chh = 480, cx = W / 2, cy = H / 2 + 6;
    const sc = 0.55 + 0.45 * a;
    const w = cw * sc, h = chh * sc * Math.cos(tilt);
    const x = cx - w / 2, y = cy - h / 2 + tilt * 60;
    const P = new Path2D();
    const r = 44 * sc;
    P.moveTo(x + r, y); P.arcTo(x + w, y, x + w, y + h, r); P.arcTo(x + w, y + h, x, y + h, r); P.arcTo(x, y + h, x, y, r); P.arcTo(x, y, x + w, y, r); P.closePath();
    glShadow(c, P, sc, 90, [0, 50], 0.45 * clamp(a));
    glGlass(c, st, P, { x: cx, y: cy, R: Math.max(w, h) / 2, mag: 1.04, dx: 0, dy: -8, heavy: true, W, H, tint0: 0.3, tint1: 0.08, sweep: sweepX });
    // content
    const ca = (k, d = 0.4) => E.outC(seg(t, k, k + d));
    if (t < 7.2) return;
    c.save(); c.clip(P);
    const L = x + 64, T = y + 62;
    const a0 = ca(7.35);
    text(c, 'MOTION STYLE ATLAS  —  D · 03', L, T + 8, { font: MONO, size: 14, ls: 3, color: `rgba(255,255,255,${0.62 * a0})` });
    // avatar orb
    const ao = E.outB(seg(t, 7.45, 7.85), 2.4);
    if (ao > 0) {
      const ox = L + 46, oy = T + 98, orr = 46 * ao;
      const og = c.createLinearGradient(ox - orr, oy - orr, ox + orr, oy + orr);
      og.addColorStop(0, '#ff7ab6'); og.addColorStop(0.55, '#ff9d5c'); og.addColorStop(1, '#7b5cff');
      c.fillStyle = og; c.beginPath(); c.arc(ox, oy, orr, 0, TAU); c.fill();
      const hg = c.createRadialGradient(ox - orr * 0.35, oy - orr * 0.45, 0, ox - orr * 0.35, oy - orr * 0.45, orr * 0.8);
      hg.addColorStop(0, 'rgba(255,255,255,0.75)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = hg; c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2; c.stroke();
    }
    const a1 = ca(7.55, 0.5);
    c.save(); c.beginPath(); c.rect(L + 112, T + 40, 600, 84); c.clip();
    text(c, 'Glassmorphism', L + 116, T + 116 - (1 - a1) * 70, { font: 'Manrope, sans-serif', weight: 800, size: 62, ls: -1.5, color: '#ffffff' });
    c.restore();
    const a2 = ca(7.75);
    text(c, 'Frosted glass  ·  depth  ·  light        2020 —', L + 118, T + 150, { font: 'Manrope, sans-serif', weight: 600, size: 21, color: `rgba(255,255,255,${0.72 * a2})` });
    // toggle
    const tg = ca(7.7), on = E.ioC(seg(t, 8.3, 8.5));
    if (tg > 0) {
      const tx = x + w - 64 - 104, ty = T + 70;
      c.globalAlpha = tg;
      rrect(c, tx, ty, 104, 56, 28);
      c.fillStyle = `rgba(${lerp(255, 120, on) | 0},${lerp(255, 236, on) | 0},${lerp(255, 200, on) | 0},${0.18 + on * 0.5})`; c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.5; c.stroke();
      const kx = tx + 28 + on * 48;
      c.shadowColor = 'rgba(30,0,60,0.35)'; c.shadowBlur = 12 * c.getTransform().a; c.shadowOffsetY = 4 * c.getTransform().a;
      c.fillStyle = '#fff'; c.beginPath(); c.arc(kx, ty + 28, 22, 0, TAU); c.fill();
      c.shadowColor = 'transparent';
      c.globalAlpha = 1;
    }
    // slider
    const sa = ca(7.95), sv = E.ioC(seg(t, 8.05, 8.75)) * 0.72;
    if (sa > 0) {
      const sy = T + 238, sw = w - 128;
      c.globalAlpha = sa;
      text(c, 'Blur radius', L, sy - 22, { font: 'Manrope, sans-serif', weight: 600, size: 20, color: 'rgba(255,255,255,0.8)' });
      text(c, Math.round(sv / 0.72 * 24) + ' px', L + sw, sy - 22, { font: MONO, size: 18, align: 'right', color: 'rgba(255,255,255,0.8)' });
      rrect(c, L, sy, sw, 10, 5); c.fillStyle = 'rgba(255,255,255,0.22)'; c.fill();
      const fg = c.createLinearGradient(L, 0, L + sw, 0); fg.addColorStop(0, '#ffd1e8'); fg.addColorStop(1, '#ffffff');
      rrect(c, L, sy, Math.max(10, sw * sv), 10, 5); c.fillStyle = fg; c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(L + sw * sv, sy + 5, 15, 0, TAU); c.fill();
      c.globalAlpha = 1;
    }
    // chips
    ['Refraction', 'Specular', 'Parallax', 'Depth'].forEach((s, k) => {
      const p = E.outB(seg(t, 8.15 + k * 0.09, 8.5 + k * 0.09), 2);
      if (p <= 0) return;
      c.font = '600 19px Manrope, sans-serif';
      const tw = c.measureText(s).width + 44;
      let cxk = L; for (let m = 0; m < k; m++) { c.font = '600 19px Manrope, sans-serif'; cxk += c.measureText(['Refraction', 'Specular', 'Parallax', 'Depth'][m]).width + 44 + 14; }
      const yk = T + 300 + (1 - p) * 24;
      c.globalAlpha = clamp(p);
      rrect(c, cxk, yk, tw, 46, 23); c.fillStyle = 'rgba(255,255,255,0.16)'; c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.3; c.stroke();
      text(c, s, cxk + 22, yk + 30, { font: 'Manrope, sans-serif', weight: 600, size: 19, color: '#fff' });
      c.globalAlpha = 1;
    });
    c.restore();
  }

  MG.film({
    id: 'glass3d', dur: 10, poster: 9.4,
    fonts: [['800 62px Manrope', 'Glassmorphism'], ['600 20px Manrope', 'Aa1·—'], ['900 80px Archivo', 'GLASS'], ['400 14px "JetBrains Mono"', 'Aa1·—']],
    meta: {
      family: 'D', name: 'Glassmorphism 3D', sub: 'Frosted Depth', era: '2020 —',
      origin: 'Frosted translucency runs from Windows Vista Aero (2007) and iOS 7 (2013) to macOS Big Sur (2020), when designer Michal Malewicz named “glassmorphism”; 3D renders of floating glass shapes over gradient blobs became its motion signature.',
      works: 'Windows Vista Aero Glass (2007) · iOS 7 Control Center (2013) · macOS Big Sur (2020) · Windows 11 Mica / Acrylic (2021) · Apple Liquid Glass (2025)',
      tech: ['Background snapshot blurred by downsampling', 'Clipped refraction: magnified + offset copy', 'Specular rim, chromatic edge, offscreen soft shadows'],
      accent: '#ff7ab6',
      motionDNA: 'Weightless shapes drift in parallax on soft springs, converge in a swirl and part to reveal a UI card that assembles element by element.',
      visualDNA: 'Translucent frosted glass with bright rims over vivid blurred gradient blobs, deep soft shadows and gentle grain.',
      transitions: 'Parallax drift, spring pop, converge-and-reveal, light sweep.',
      implementation: ['Blender (Cycles glass + transmission)', 'Spline', 'CSS backdrop-filter', 'Canvas 2D'],
      reproducibility: 'Fully procedural', loopable: false,
    },
    setup() { const st = {}; glBlurInit(st); return st; },
    draw(c, t, W, H, st) {
      const camX = kf(t, [[0, -90], [6, 70, E.ioS], [10, 30, E.ioS]]), camY = kf(t, [[0, 30], [10, -20, E.ioS]]);
      const zoom = kf(t, [[0, 1.06], [5.8, 1.0, E.ioS], [6.6, 1.05, E.ioC], [8, 1.0, E.ioC], [10, 0.985, E.lin]]);
      const bloom = E.outC(seg(t, 0, 1.4));
      // base + gradient blobs
      const base = c.createLinearGradient(0, 0, W, H); base.addColorStop(0, '#1a0f3d'); base.addColorStop(1, '#120a2a');
      c.fillStyle = base; c.fillRect(0, 0, W, H);
      const BL = [
        ['255,61,139', 0.32, 0.36, 640, 0.0], ['255,154,61', 0.72, 0.7, 600, 1.3], ['123,92,255', 0.7, 0.2, 680, 2.1],
        ['34,211,238', 0.18, 0.84, 560, 3.2], ['255,95,109', 0.52, 0.56, 420, 4.4], ['190,80,255', 0.06, 0.1, 480, 5.1],
      ];
      c.save(); c.globalCompositeOperation = 'lighter';
      BL.forEach(([col, bx, by, r, ph], k) => {
        const x = W * bx + Math.sin(t * 0.35 + ph) * 160 - camX * 0.3, y = H * by + Math.cos(t * 0.3 + ph * 1.3) * 110 - camY * 0.3;
        const rr = r * (0.6 + 0.4 * bloom) * (1 + 0.06 * Math.sin(t * 0.8 + k));
        const g = c.createRadialGradient(x, y, 0, x, y, rr);
        g.addColorStop(0, `rgba(${col},${0.85 * bloom})`); g.addColorStop(0.5, `rgba(${col},${0.35 * bloom})`); g.addColorStop(1, `rgba(${col},0)`);
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      });
      c.restore();
      // sharp backdrop details (what the glass blurs)
      c.save();
      c.globalAlpha = 0.9 * bloom;
      c.fillStyle = 'rgba(255,255,255,0.22)';
      const ox = (-camX * 0.15) % 48, oy = (-camY * 0.15) % 48;
      for (let y = -48; y < H + 48; y += 48) for (let x = -48; x < W + 48; x += 48) {
        const dd = Math.hypot(x - W / 2, y - H / 2) / 900;
        if (dd > 1) continue;
        c.globalAlpha = 0.9 * bloom * (1 - dd);
        c.fillRect(x + ox, y + oy, 2.4, 2.4);
      }
      c.globalAlpha = bloom;
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1.5;
      c.beginPath(); c.arc(W / 2 - camX * 0.2, H / 2 - camY * 0.2, 330, 0, TAU); c.stroke();
      c.beginPath(); c.arc(W / 2 - camX * 0.2, H / 2 - camY * 0.2, 470, 0, TAU); c.stroke();
      const ga = 1 - seg(t, 6.3, 6.8);
      if (ga > 0) {
        c.globalAlpha = bloom * ga;
        text(c, 'GLASS', W / 2 - camX * 0.25, H / 2 + 120 - camY * 0.25, { font: 'Archivo, sans-serif', weight: 900, size: 330, ls: 30, align: 'center', color: 'rgba(255,255,255,0.1)', stroke: 'rgba(255,255,255,0.4)', lw: 2 });
      }
      c.restore();

      // light sweeps
      const sw1 = seg(t, 4.4, 5.5), sw2 = seg(t, 8.85, 9.6);
      const sweepX = sw1 > 0 && sw1 < 1 ? -300 + sw1 * (W + 600) : sw2 > 0 && sw2 < 1 ? -300 + sw2 * (W + 600) : undefined;

      // shapes: back to front, card at z = 0
      const list = GL_SH.map((s, i) => ({ s, i, q: glPose(s, i, t) })).filter(o => o.q.vis);
      list.sort((a, b) => b.q.p[2] - a.q.p[2]);
      let cardDone = false;
      const drawCard = () => { if (!cardDone) { cardDone = true; glCard(c, st, t, W, H, sweepX); } };
      for (const o of list) {
        if (o.q.p[2] < 0) drawCard();
        const { s } = o, [x, y, z] = o.q.p;
        const sc = GL_F / (GL_F + z) * zoom;
        const X = W / 2 + (x - camX) * sc, Y = H / 2 + (y - camY) * sc;
        const P = glPath(s, X, Y, sc, o.q.rot, o.q.tilt);
        const R = (s.type === 'pill' ? s.L / 2 : s.type === 'tile' ? s.S * 0.6 : s.R) * sc;
        glShadow(c, P, sc, 70 * sc, [26 * sc, 46 * sc], 0.5);
        const mag = s.type === 'sphere' ? 1.22 : s.type === 'ring' ? 1.1 : 1.08;
        glGlass(c, st, P, { x: X, y: Y, R, mag, dx: s.type === 'sphere' ? -R * 0.08 : 10 * sc, dy: s.type === 'sphere' ? -R * 0.1 : 14 * sc, heavy: s.type !== 'sphere', type: s.type, W, H, sweep: sweepX });
        if (s.type === 'ring') {
          // inner thickness shading
          c.save();
          const ry = Math.max(0.28, Math.abs(Math.cos(o.q.tilt * 1.6)));
          c.beginPath(); c.ellipse(X, Y, s.r * sc + 3, (s.r * sc + 3) * ry, o.q.rot, 0, TAU);
          c.strokeStyle = 'rgba(40,10,80,0.25)'; c.lineWidth = 6; c.stroke();
          c.restore();
        }
      }
      drawCard();
      // converge flash
      const cf = bump(t, 6.5, 0.08, 0.02, 0.5);
      if (cf > 0) {
        c.save(); c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 700);
        g.addColorStop(0, `rgba(255,230,250,${0.38 * cf})`); g.addColorStop(1, 'rgba(255,200,240,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
      }
      grain(c, W, H, t, 0.045);
      vignette(c, W, H, 0.32, '8,4,24');
      if (t < 0.25) { c.fillStyle = `rgba(13,10,36,${1 - t / 0.25})`; c.fillRect(0, 0, W, H); }
    },
    score(A) {
      // dark bloom: sub + airy pad
      A.osc(0, { f: midi(33), dur: 6.4, g: 0.08, a: 1.6, hold: true, rel: 0.4 });
      A.chord(0.1, [57, 64, 69, 71, 76], { type: 'sine', dur: 5.8, g: 0.03, a: 2.2, hold: true, rel: 0.8, spread: 6, width: 1.4, rev: 0.7 });
      A.noise(0, { type: 'bandpass', f: 1200, f2: 5000, q: 0.8, dur: 1.6, g: 0.05, swell: 0.8, rev: 0.5 });
      // glassy entries: tink + whoosh, panned to where the shape enters
      const glassR = [1, 2.32, 4.25, 6.63];
      const ent = [[0.15, 88, 0.7], [1.2, 83, -0.7], [1.8, 86, -0.5], [2.3, 81, 0.7], [2.6, 90, 0.1], [3.0, 93, -0.3], [3.25, 95, 0.7]];
      ent.forEach(([tt, m, pan], k) => {
        A.whoosh(tt, 0.65, { f1: 500, f2: 4200, g: 0.08, pan, rev: 0.3 });
        A.bell(tt + 0.42, midi(m), { ratios: glassR, g: 0.05, dur: 1.8, pan, rev: 0.6 });
      });
      // gentle pulse
      for (let k = 0; k < 8; k++) A.pluck(1.6 + k * 0.5, midi([64, 69, 71, 76][k % 4]), { g: 0.07, dur: 1.2, bright: 0.5, lp: 2400, pan: k % 2 ? 0.3 : -0.3, rev: 0.4 });
      // light sweep shimmer
      A.noise(4.4, { type: 'highpass', f: 6000, dur: 1.1, g: 0.05, swell: 0.5, rev: 0.6, pan: -0.3 });
      [88, 91, 93, 95, 100].forEach((m, k) => A.bell(4.5 + k * 0.17, midi(m), { ratios: glassR, g: 0.03, dur: 1.4, pan: -0.8 + k * 0.4 }));
      // converge: riser + swirl, then the card blooms
      A.riser(5.6, 0.95, { g: 0.13, f: 55 });
      A.whoosh(5.9, 0.65, { f1: 200, f2: 3000, g: 0.12, pan: 0.4 });
      A.impact(6.55, 0.5, { rev: 0.8 });
      A.chord(6.55, [45, 52, 57, 61, 64, 69, 76], { type: 'triangle', dur: 3.3, g: 0.028, a: 0.08, hold: true, rel: 1.2, lp: 1200, lp2: 4000, lpT: 1.2, spread: 8, width: 1.5, rev: 0.8 });
      A.bell(6.6, midi(88), { ratios: glassR, g: 0.07, dur: 2.4 });
      // UI assembly: soft ticks
      [7.35, 7.45, 7.55, 7.7, 7.75, 7.95, 8.15, 8.24, 8.33, 8.42].forEach((tt, k) => {
        A.noise(tt, { type: 'bandpass', f: 4200, q: 2, dur: 0.02, g: 0.06, pan: (k % 3 - 1) * 0.4 });
        A.osc(tt, { f: midi(81 + [0, 4, 7, 12, 7, 9, 12, 14, 16, 19][k]), dur: 0.16, g: 0.035, rev: 0.3 });
      });
      for (let k = 0; k < 8; k++) A.osc(8.05 + k * 0.085, { f: 900 + k * 90, dur: 0.03, g: 0.02 });
      // toggle click
      A.noise(8.3, { type: 'bandpass', f: 2600, q: 3, dur: 0.02, g: 0.1 });
      A.osc(8.32, { f: 1200, f2: 1800, glide: 0.06, dur: 0.1, g: 0.05 });
      A.noise(8.5, { type: 'bandpass', f: 1800, q: 3, dur: 0.03, g: 0.08 });
      // final shimmer
      A.noise(8.85, { type: 'highpass', f: 7000, dur: 0.9, g: 0.04, swell: 0.5, rev: 0.6, pan: 0.3 });
      A.bell(8.9, midi(93), { ratios: glassR, g: 0.05, dur: 1.4, pan: 0.4 });
      A.bell(9.05, midi(100), { ratios: glassR, g: 0.03, dur: 1.0, pan: -0.4 });
    },
  });
})();
