/* batch k4 — Technique Atlas · Simulation: techcloth · techrigidbody · techdestruction.
   techcloth (a Verlet mass-spring sheet printed with the Token, pinned, gusted, released) ·
   techrigidbody (sequential-impulse rounded boxes: Tokens drop, tumble, stack beside MOTION) ·
   techdestruction (seeded Voronoi fracture on a beat, shards bounce, then the tape rewinds).
   Every simulation runs once in setup (cached at module level so score() hears the same
   collisions); draw(t) only looks up and interpolates precomputed frames. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, rng, hash, vnoise, midi, text, offscreen } = MG;
  const TK = MG.TK, P = TK.P, FL = TK.FLOOR;
  const FPS = 30, NF = 300;

  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

  /* =====================================================================
     CLOTH — a 37 × 31 particle sheet, Verlet-integrated with structural,
     shear and bend constraints, hangs from two pins in front of the solid
     Token. Wind gusts on the beat push on every quad along its normal, so
     the sheet billows; the right pin lets go at 5 s, the left at 7 s, and
     the cloth slides off to the floor, revealing the Token behind it.
     ===================================================================== */
  const CL = { nx: 37, ny: 31, sp: 18, top: 206, z0: -120, gap: 0.92, sub: 6, it: 3, g: 1900, cw: 4, rel: [5.0, 7.0], S: 300, hz: 560, F: 1700, pre: 1.4, TW: 972, TH: 810 };
  const CL_GUST = [[0.9, 0.55], [1.9, 0.85], [2.9, 0.7], [3.9, 1.15], [4.95, 0.8], [5.95, 0.75], [6.95, 0.7]];
  const clGust = t => { let G = 0; for (const [t0, s] of CL_GUST) G += s * E.outQ(seg(t, t0, t0 + 0.3)) * (1 - E.ioS(seg(t, t0 + 0.3, t0 + 1.15))); return G; };
  const clCalm = t => 1 - E.ioS(seg(t, 7.8, 8.8));
  function clWind(t) {
    const G = (clGust(t) + 0.14 * seg(t, 0.2, 1.2)) * clCalm(t), side = lerp(0.3, 1, E.ioS(seg(t, 4.4, 5.4)));
    return [-760 * side * G, -260 * G, -900 * (1 - 0.92 * side) * G];
  }
  let CLOTH = null;
  function clothSim() {
    if (CLOTH) return CLOTH;
    const { nx, ny, sp } = CL, N = nx * ny, sub = CL.sub, dt = 1 / (FPS * sub), dt2 = dt * dt, damp = 0.994;
    const X = new Float64Array(N), Y = new Float64Array(N), Z = new Float64Array(N);
    const PX = new Float64Array(N), PY = new Float64Array(N), PZ = new Float64Array(N);
    const AX = new Float64Array(N), AY = new Float64Array(N), AZ = new Float64Array(N), IM = new Float64Array(N).fill(1);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const p = j * nx + i;
      X[p] = 960 + (i - (nx - 1) / 2) * sp * CL.gap; Y[p] = CL.top + j * sp * 0.985;
      Z[p] = CL.z0 + 6 * vnoise(i * 0.31 + j * 0.17, 3) + 3 * Math.sin(i * 0.9);
      PX[p] = X[p]; PY[p] = Y[p]; PZ[p] = Z[p];
    }
    const pins = [0, nx - 1], pinXY = pins.map(p => [X[p], Y[p], Z[p]]);
    IM[0] = IM[nx - 1] = 0;
    // constraints: structural, shear, bend
    const cs = [];
    const add = (a, b, k) => cs.push(a, b, Math.hypot(((b % nx) - (a % nx)) * sp, (((b / nx) | 0) - ((a / nx) | 0)) * sp), k);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const p = j * nx + i;
      if (i < nx - 1) add(p, p + 1, 1);
      if (j < ny - 1) add(p, p + nx, 1);
      if (i < nx - 1 && j < ny - 1) { add(p, p + nx + 1, 0.9); add(p + 1, p + nx, 0.9); }
      if (i < nx - 2) add(p, p + 2, 0.5);
      if (j < ny - 2) add(p, p + 2 * nx, 0.5);
    }
    const NC = cs.length / 4, CA = new Int32Array(NC), CB = new Int32Array(NC), CR = new Float64Array(NC), CK = new Float64Array(NC);
    for (let c = 0; c < NC; c++) { CA[c] = cs[c * 4]; CB[c] = cs[c * 4 + 1]; CR[c] = cs[c * 4 + 2]; CK[c] = cs[c * 4 + 3]; }
    const tx0 = 960 - CL.S / 2 - 8, tx1 = 960 + CL.S / 2 + 8, ty0 = FL - CL.S - 8, TZ = 26, FLC = FL - 1.5;
    const onFloor = new Uint8Array(N);
    let hits = 0;
    function step(t) {
      if (t >= CL.rel[0]) IM[nx - 1] = 1;
      if (t >= CL.rel[1]) IM[0] = 1;
      const w = clWind(t), ws = Math.abs(w[0]) + Math.abs(w[2]) > 1;
      AX.fill(0); AY.fill(CL.g); AZ.fill(0);
      if (ws) {
        for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
          const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
          const e1x = X[d] - X[a], e1y = Y[d] - Y[a], e1z = Z[d] - Z[a], e2x = X[b] - X[c], e2y = Y[b] - Y[c], e2z = Z[b] - Z[c];
          let nX = e1y * e2z - e1z * e2y, nY = e1z * e2x - e1x * e2z, nZ = e1x * e2y - e1y * e2x;
          const nl = Math.hypot(nX, nY, nZ) || 1; nX /= nl; nY /= nl; nZ /= nl;
          const m = 1 + 0.4 * vnoise(t * 1.9 + i * 0.13 + j * 0.07, 5);
          const vx = (X[a] + X[b] + X[c] + X[d] - PX[a] - PX[b] - PX[c] - PX[d]) / (4 * dt);
          const vy = (Y[a] + Y[b] + Y[c] + Y[d] - PY[a] - PY[b] - PY[c] - PY[d]) / (4 * dt);
          const vz = (Z[a] + Z[b] + Z[c] + Z[d] - PZ[a] - PZ[b] - PZ[c] - PZ[d]) / (4 * dt);
          const f = CL.cw * 0.25 * ((w[0] * m - vx) * nX + (w[1] * m - vy) * nY + (w[2] * m - vz) * nZ);
          const fx = f * nX, fy = f * nY, fz = f * nZ;
          AX[a] += fx; AY[a] += fy; AZ[a] += fz; AX[b] += fx; AY[b] += fy; AZ[b] += fz;
          AX[c] += fx; AY[c] += fy; AZ[c] += fz; AX[d] += fx; AY[d] += fy; AZ[d] += fz;
        }
      }
      for (let p = 0; p < N; p++) {
        if (!IM[p]) continue;
        const vx = (X[p] - PX[p]) * damp, vy = (Y[p] - PY[p]) * damp, vz = (Z[p] - PZ[p]) * damp;
        PX[p] = X[p]; PY[p] = Y[p]; PZ[p] = Z[p];
        X[p] += vx + AX[p] * dt2; Y[p] += vy + AY[p] * dt2; Z[p] += vz + AZ[p] * dt2;
      }
      for (let it = 0; it < CL.it; it++) {
        for (let c = 0; c < NC; c++) {
          const a = CA[c], b = CB[c], wa = IM[a], wb = IM[b], wsum = wa + wb;
          if (!wsum) continue;
          const dx = X[b] - X[a], dy = Y[b] - Y[a], dz = Z[b] - Z[a], d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (d < 1e-6) continue;
          const k = (d - CR[c]) / (d * wsum) * CK[c];
          X[a] += dx * k * wa; Y[a] += dy * k * wa; Z[a] += dz * k * wa;
          X[b] -= dx * k * wb; Y[b] -= dy * k * wb; Z[b] -= dz * k * wb;
        }
        for (let p = 0; p < N; p++) {
          if (Y[p] > FLC) {
            Y[p] = FLC; PX[p] = lerp(PX[p], X[p], 0.5); PZ[p] = lerp(PZ[p], Z[p], 0.5);
            if (!onFloor[p]) { onFloor[p] = 1; hits++; }
          }
          if (X[p] > tx0 && X[p] < tx1 && Y[p] > ty0 && Z[p] > -TZ && Z[p] < TZ) Z[p] = Z[p] < 0 ? -TZ : TZ;
        }
      }
      pins.forEach((p, k) => { if (!IM[p]) { X[p] = pinXY[k][0]; Y[p] = pinXY[k][1]; Z[p] = pinXY[k][2]; } });
    }
    const pre = Math.round(CL.pre * FPS * sub);
    for (let s = 0; s < pre; s++) step(-CL.pre + s * dt);
    const fr = new Float32Array((NF + 1) * N * 3), flap = new Float32Array(NF + 1), land = new Float32Array(NF + 1);
    const save = k => { const o = k * N * 3; for (let p = 0; p < N; p++) { fr[o + p * 3] = X[p]; fr[o + p * 3 + 1] = Y[p]; fr[o + p * 3 + 2] = Z[p]; } };
    hits = 0; onFloor.fill(0);
    for (let p = 0; p < N; p++) if (Y[p] >= FLC - 0.01) onFloor[p] = 1;
    save(0);
    for (let k = 1; k <= NF; k++) {
      hits = 0;
      for (let s = 0; s < sub; s++) step((k - 1) / FPS + s * dt);
      save(k);
      land[k] = hits;
      if (k >= 2) {   // mean change of velocity between frames → how hard the sheet snaps
        const o0 = (k - 2) * N * 3, o1 = (k - 1) * N * 3, o2 = k * N * 3; let acc = 0;
        for (let p = 0; p < N; p += 3) for (let q = 0; q < 3; q++) acc += Math.abs(fr[o2 + p * 3 + q] - 2 * fr[o1 + p * 3 + q] + fr[o0 + p * 3 + q]);
        flap[k] = acc / (N / 3);
      }
    }
    // flap events: local maxima of the snap metric above a threshold, at least 0.18 s apart
    const ev = []; let last = -1;
    for (let k = 3; k < NF; k++) if (flap[k] > 1.0 && flap[k] >= flap[k - 1] && flap[k] >= flap[k + 1] && k - last > 5) { ev.push([k / FPS, flap[k]]); last = k; }
    const lands = []; let lastL = -10;
    for (let k = 1; k <= NF; k++) if (land[k] > 20 && k - lastL > 6) { lands.push([k / FPS, land[k]]); lastL = k; }
    CLOTH = { fr, N, flap, ev, lands, pins: pinXY };
    return CLOTH;
  }
  const clProj = (x, y, z) => { const s = CL.F / (CL.F + z); return [960 + (x - 960) * s, CL.hz + (y - CL.hz) * s]; };

  function clTexture() {
    const { TW, TH } = CL, cv = offscreen(TW, TH), g = cv.getContext('2d');
    g.fillStyle = '#f8f5ee'; g.fillRect(0, 0, TW, TH);
    // a woven hem
    g.strokeStyle = 'rgba(23,24,28,0.28)'; g.lineWidth = 3; g.setLineDash([14, 10]);
    g.strokeRect(26, 26, TW - 52, TH - 52); g.setLineDash([]);
    g.save(); g.translate(TW / 2, TH * 0.4); TK.tokenPath(g, TH * 0.48); g.fillStyle = P.accent; g.fill('evenodd'); g.restore();
    text(g, 'MOTION', TW / 2, TH * 0.83, { font: TK.FONT, weight: 900, size: TH * 0.135, color: P.ink, align: 'center', base: 'middle', ls: 4 });
    return cv;
  }
  const CL_BACK = hex('#e6dfd0');
  const LGT = (() => { const l = Math.hypot(-0.35, -0.55, -0.76); return [-0.35 / l, -0.55 / l, -0.76 / l]; })();

  function texTri(c, img, sh, x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2) {
    const mx = (x0 + x1 + x2) / 3, my = (y0 + y1 + y2) / 3, ex = (x, y) => { const d = Math.hypot(x - mx, y - my) || 1; return [x + (x - mx) / d * 0.7, y + (y - my) / d * 0.7]; };
    const A = ex(x0, y0), B = ex(x1, y1), C = ex(x2, y2);
    const du1 = u1 - u0, dv1 = v1 - v0, du2 = u2 - u0, dv2 = v2 - v0, det = du1 * dv2 - du2 * dv1;
    if (Math.abs(det) < 1e-9) return;
    const dx1 = x1 - x0, dy1 = y1 - y0, dx2 = x2 - x0, dy2 = y2 - y0;
    const a = (dx1 * dv2 - dx2 * dv1) / det, b = (dy1 * dv2 - dy2 * dv1) / det, cc = (dx2 * du1 - dx1 * du2) / det, d = (dy2 * du1 - dy1 * du2) / det;
    c.save();
    c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineTo(C[0], C[1]); c.closePath(); c.clip();
    c.transform(a, b, cc, d, x0 - a * u0 - cc * v0, y0 - b * u0 - d * v0);
    c.drawImage(img, 0, 0);
    const du = CL.TW / (CL.nx - 1), dv = CL.TH / (CL.ny - 1);
    c.drawImage(sh, 0, 0, CL.nx, CL.ny, -du / 2, -dv / 2, CL.nx * du, CL.ny * dv);
    c.restore();
  }

  function drawCloth(c, t, st) {
    const S = clothSim(), { nx, ny, TW, TH } = CL, N = S.N, nq = (nx - 1) * (ny - 1);
    if (!st.tex || (!st.texOK && document.fonts.check(`900 100px ${TK.FONT}`))) {
      st.tex = clTexture(); st.texOK = document.fonts.check(`900 100px ${TK.FONT}`);
      st.texB = offscreen(TW, TH); const g = st.texB.getContext('2d');
      g.fillStyle = `rgb(${CL_BACK.join(',')})`; g.fillRect(0, 0, TW, TH); g.globalAlpha = 0.1; g.drawImage(st.tex, 0, 0);
      st.cF = offscreen(nx, ny); st.cB = offscreen(nx, ny);
      st.shF = st.cF.getContext('2d').createImageData(nx, ny); st.shB = st.cB.getContext('2d').createImageData(nx, ny);
    }
    const f = clamp(t * FPS, 0, NF), k = Math.min(NF - 1, Math.floor(f)), u = f - k, A = S.fr, o0 = k * N * 3, o1 = (k + 1) * N * 3;
    const wx = st.wx, wy = st.wy, wz = st.wz, sx = st.sx, sy = st.sy;
    for (let p = 0; p < N; p++) {
      const x = lerp(A[o0 + p * 3], A[o1 + p * 3], u), y = lerp(A[o0 + p * 3 + 1], A[o1 + p * 3 + 1], u), z = lerp(A[o0 + p * 3 + 2], A[o1 + p * 3 + 2], u);
      wx[p] = x; wy[p] = y; wz[p] = z;
      const s = CL.F / (CL.F + z); sx[p] = 960 + (x - 960) * s; sy[p] = CL.hz + (y - CL.hz) * s;
    }
    // soft shadow of cloth lying near the floor
    let mn = 1e9, mx = -1e9, cnt = 0;
    for (let p = 0; p < N; p += 2) if (wy[p] > FL - 70) { mn = Math.min(mn, sx[p]); mx = Math.max(mx, sx[p]); cnt++; }
    if (cnt > 4) {
      c.save(); c.globalAlpha = clamp(cnt / 160) * 0.8; c.fillStyle = P.shadow; c.beginPath();
      c.ellipse((mn + mx) / 2, FL + 14, (mx - mn) / 2 + 30, 22, 0, 0, TAU); c.fill(); c.restore();
    }
    const order = st.order, depth = st.depth;
    for (let q = 0; q < nq; q++) { const i = q % (nx - 1), j = (q / (nx - 1)) | 0, a = j * nx + i; depth[q] = wz[a] + wz[a + 1] + wz[a + nx] + wz[a + nx + 1]; }
    order.sort((p, q) => depth[q] - depth[p]);
    const du = TW / (nx - 1), dv = TH / (ny - 1);
    // smooth shading: per-vertex normals from the adjacent quads
    const vnx = st.vnx, vny = st.vny, vnz = st.vnz;
    vnx.fill(0); vny.fill(0); vnz.fill(0);
    for (let q = 0; q < nq; q++) {
      const i = q % (nx - 1), j = (q / (nx - 1)) | 0, a = j * nx + i, b = a + 1, cc = a + nx, d = cc + 1;
      const e1x = wx[d] - wx[a], e1y = wy[d] - wy[a], e1z = wz[d] - wz[a], e2x = wx[b] - wx[cc], e2y = wy[b] - wy[cc], e2z = wz[b] - wz[cc];
      const nX = e1y * e2z - e1z * e2y, nY = e1z * e2x - e1x * e2z, nZ = e1x * e2y - e1y * e2x;
      for (const p of [a, b, cc, d]) { vnx[p] += nX; vny[p] += nY; vnz[p] += nZ; }
    }
    // shade maps in texture space (one texel per particle, front and back), bilinear-stretched over the sheet
    const dF = st.shF.data, dB = st.shB.data;
    const put = (D, p, dif) => {
      const k = clamp(0.5 + 0.62 * dif, 0.35, 1.08), o = p * 4;
      if (k < 1) { D[o] = 23; D[o + 1] = 20; D[o + 2] = 16; D[o + 3] = Math.round((1 - k) * 255); }
      else { D[o] = D[o + 1] = D[o + 2] = 255; D[o + 3] = Math.round((k - 1) * 1.5 * 255); }
    };
    for (let p = 0; p < N; p++) {
      const l = Math.hypot(vnx[p], vny[p], vnz[p]) || 1, v = (vnx[p] * LGT[0] + vny[p] * LGT[1] + vnz[p] * LGT[2]) / l;
      put(dF, p, Math.max(0, v)); put(dB, p, Math.max(0, -v));
    }
    st.cF.getContext('2d').putImageData(st.shF, 0, 0); st.cB.getContext('2d').putImageData(st.shB, 0, 0);
    for (let n = 0; n < nq; n++) {
      const q = order[n], i = q % (nx - 1), j = (q / (nx - 1)) | 0, a = j * nx + i, b = a + 1, cc = a + nx, d = cc + 1;
      const cr = (sx[d] - sx[a]) * (sy[b] - sy[cc]) - (sy[d] - sy[a]) * (sx[b] - sx[cc]), back = cr > 0;
      const img = back ? st.texB : st.tex, sh = back ? st.cB : st.cF;
      const u0 = i * du, v0 = j * dv, u1 = u0 + du, v1 = v0 + dv;
      texTri(c, img, sh, sx[a], sy[a], sx[b], sy[b], sx[d], sy[d], u0, v0, u1, v0, u1, v1);
      texTri(c, img, sh, sx[a], sy[a], sx[d], sy[d], sx[cc], sy[cc], u0, v0, u1, v1, u0, v1);
    }
    return { wx, wy, sx, sy };
  }

  MG.film({
    id: 'techcloth', dur: 10, poster: 4.3,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Cloth', sub: 'Mass-spring sheet in the wind', era: '1986 —',
      origin: 'Cloth simulation treats fabric as a grid of point masses joined by springs or distance constraints for stretch, shear and bending. Jerry Weil hung cloth from fixed points in 1986, Terzopoulos, Platt, Barr and Fleischer’s Elastically Deformable Models (1987) put physically based deformation into graphics, Baraff and Witkin’s Large Steps in Cloth Simulation (1998) made stiff cloth stable with implicit integration, and Thomas Jakobsen’s Verlet-and-constraints scheme (GDC 2001, from IO Interactive’s Hitman) made it cheap enough for real time.',
      works: 'Geri’s Game (Pixar, 1997) · Monsters, Inc. (Pixar, 2001) · Hitman: Codename 47 (IO Interactive, 2000)',
      tech: ['Verlet particles + distance constraints', 'Wind force along each quad normal', 'Pin release, floor and body collision'],
      accent: '#ff5a1f',
      motionDNA: 'A sheet hangs slack from two pins and breathes; wind gusts land on the beat and roll through it as travelling billows, the print stretching and folding with the fabric. The right pin lets go and the cloth swings down hanging from one corner, flapping; the left pin lets go and it slumps to the floor in folds, settling with friction.',
      visualDNA: 'Warm paper studio with a grid and floor line; an off-white sheet with a stitched hem printed with the orange Token and MOTION, shaded per quad from a single soft key light, its darker reverse side showing where it folds; two thin cords to the ceiling; the solid orange Token standing behind it.',
      transitions: 'Hidden behind the sheet, glimpsed through gusts, revealed when the pins release; the word rises over the uncovered Token',
      implementation: ['Position-based Verlet cloth precomputed in setup (6 substeps, 3 constraint passes)', 'Affine texture-mapped triangles in Canvas 2D, depth-sorted', 'Wind as normal-projected drag with value-noise turbulence'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const sim = clothSim(), N = CL.nx * CL.ny, nq = (CL.nx - 1) * (CL.ny - 1);
      return {
        sim, vnx: new Float32Array(N), vny: new Float32Array(N), vnz: new Float32Array(N), wx: new Float32Array(N), wy: new Float32Array(N), wz: new Float32Array(N), sx: new Float32Array(N), sy: new Float32Array(N),
        depth: new Float32Array(nq), order: Array.from({ length: nq }, (_, i) => i),
      };
    },
    draw(c, t, W, H, st) {
      TK.stage(c, W, H, { floor: FL });
      const G = clGust(t) * clCalm(t);
      // wind streaks behind the cloth
      c.strokeStyle = P.ink; c.lineCap = 'round';
      for (let i = 0; i < 18; i++) {
        const sp = 1500 * (0.7 + 0.6 * hash(i + 9)), L = 2600, x = W + 300 - ((t * sp + hash(i + 3) * L) % L), y = 130 + hash(i * 1.7) * 600, len = 90 + 160 * hash(i + 21);
        const a = 0.22 * clamp(G * 1.2) * (0.4 + 0.6 * hash(i + 5));
        if (a < 0.01) continue;
        c.globalAlpha = a; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + len, y + 6 * vnoise(i + t, 2)); c.stroke();
      }
      c.globalAlpha = 1;
      // the solid Token behind the sheet
      TK.shadow(c, 960, FL, CL.S, 0);
      TK.token(c, 960, FL - CL.S / 2, CL.S);
      // the word rises over the uncovered Token at the end
      const wa = E.outC(seg(t, 7.9, 8.7));
      if (wa > 0) TK.word(c, 960, 330 + 24 * (1 - wa), { alpha: wa, size: 150 });
      // cords to the ceiling and the pins
      const S = clothSim();
      S.pins.forEach((pp, k) => {
        const tr = CL.rel[1 - k], [px, py] = clProj(pp[0], pp[1], pp[2]);
        const up = t > tr ? 46 * (1 - Math.exp(-(t - tr) * 9) * Math.cos((t - tr) * 26)) : 0;
        c.strokeStyle = 'rgba(23,24,28,0.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(px, 0); c.lineTo(px, py - up); c.stroke();
      });
      drawCloth(c, t, st);
      S.pins.forEach((pp, k) => {
        const tr = CL.rel[1 - k], [px, py] = clProj(pp[0], pp[1], pp[2]);
        const up = t > tr ? 46 * (1 - Math.exp(-(t - tr) * 9) * Math.cos((t - tr) * 26)) : 0;
        c.fillStyle = P.ink; c.beginPath(); c.arc(px, py - up, 7, 0, TAU); c.fill();
        c.fillStyle = P.accent; c.beginPath(); c.arc(px, py - up, 3, 0, TAU); c.fill();
      });
      TK.caption(c, t, W, H, { name: 'Cloth', cat: 'Simulation', curve: u => clGust(u * 10) * clCalm(u * 10), span: [0, 10], curveLabel: 'WIND / TIME' });
    },
    score(A) {
      TK.bed(A);
      const S = clothSim();
      A.noise(0.3, { type: 'lowpass', f: 420, dur: 8.4, g: 0.035, swell: 0.4 });
      CL_GUST.forEach(([t0, s], i) => A.noise(t0, { type: 'bandpass', f: 260, f2: 1100, q: 0.7, dur: 1.2, g: 0.075 * s, swell: 0.3, rev: 0.2, pan: -0.3 + 0.12 * i }));
      S.ev.forEach(([t, m]) => {
        const g = clamp((m - 1.2) / 5, 0.15, 1);
        A.noise(t, { type: 'bandpass', f: 700 + 500 * g, q: 1.1, dur: 0.08, g: 0.11 * g, pan: 0.2 * vnoise(t * 3, 4) });
        A.noise(t + 0.012, { type: 'lowpass', f: 380, dur: 0.12, g: 0.09 * g });
      });
      CL.rel.forEach(t => { A.osc(t, { type: 'square', f: 2600, f2: 1700, dur: 0.04, g: 0.05, lp: 5000 }); A.bell(t + 0.01, midi(84), { g: 0.05, dur: 0.9, rev: 0.4 }); });
      S.lands.forEach(([t, n]) => { const g = clamp(n / 200, 0.2, 1); A.noise(t, { type: 'lowpass', f: 300, dur: 0.22, g: 0.14 * g }); A.osc(t, { f: 90, f2: 50, dur: 0.2, g: 0.08 * g }); });
      A.chord(8.0, [60, 67, 76], { type: 'sine', dur: 2.0, g: 0.03, a: 0.04, rev: 0.5, width: 0.5 });
    },
  });

  /* =====================================================================
     RIGID BODY — Tokens of different sizes are dropped on the beat into a
     2D sequential-impulse solver (Box2D-lite style: SAT + edge clipping,
     rounded-box radius, warm-started accumulated impulses, friction and
     restitution). They clatter, tumble and stack into a settled pile
     beside MOTION; the last one lands squarely on top of the word.
     ===================================================================== */
  const RB = { sub: 6, it: 16, g: 2600, mu: 0.55, e: 0.25, wx: 1490, wsize: 150, whx: 345, why: 54 };
  let RIGID = null;
  function rbBody(o) {
    const b = Object.assign({ x: 0, y: 0, a: 0, vx: 0, vy: 0, w: 0, hx: 10, hy: 10, r: 0, im: 0, iI: 0, on: true, V: new Float64Array(8), N: new Float64Array(8) }, o);
    if (o.s) { b.r = TK.CORNER * o.s; b.hx = b.hy = o.s / 2 - b.r; const m = Math.pow(o.s, 1.5) * 1e-3; b.im = 1 / m; b.iI = 1 / (m * (o.s * o.s * 2) / 12); }
    b.br = Math.hypot(b.hx, b.hy) + b.r;
    return b;
  }
  function rbVerts(b) {
    const c = Math.cos(b.a), s = Math.sin(b.a), L = [[-b.hx, -b.hy], [b.hx, -b.hy], [b.hx, b.hy], [-b.hx, b.hy]], Nn = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (let i = 0; i < 4; i++) {
      b.V[i * 2] = b.x + c * L[i][0] - s * L[i][1]; b.V[i * 2 + 1] = b.y + s * L[i][0] + c * L[i][1];
      b.N[i * 2] = c * Nn[i][0] - s * Nn[i][1]; b.N[i * 2 + 1] = s * Nn[i][0] + c * Nn[i][1];
    }
  }
  function rbMaxSep(A, B) {
    let best = -Infinity, idx = 0;
    for (let i = 0; i < 4; i++) {
      const nx = A.N[i * 2], ny = A.N[i * 2 + 1], vx = A.V[i * 2], vy = A.V[i * 2 + 1];
      let mn = Infinity;
      for (let j = 0; j < 4; j++) { const d = nx * (B.V[j * 2] - vx) + ny * (B.V[j * 2 + 1] - vy); if (d < mn) mn = d; }
      if (mn > best) { best = mn; idx = i; }
    }
    return [best, idx];
  }
  const RB_MARGIN = 2;
  function rbCollide(A, B) {
    const R = A.r + B.r;
    const [sa, ea] = rbMaxSep(A, B); if (sa > R + RB_MARGIN) return null;
    const [sb, eb] = rbMaxSep(B, A); if (sb > R + RB_MARGIN) return null;
    let ref = A, inc = B, re = ea, flip = 0;
    if (sb > sa + 0.1) { ref = B; inc = A; re = eb; flip = 1; }
    const nx = ref.N[re * 2], ny = ref.N[re * 2 + 1], i2 = (re + 1) % 4;
    const v1x = ref.V[re * 2], v1y = ref.V[re * 2 + 1], v2x = ref.V[i2 * 2], v2y = ref.V[i2 * 2 + 1];
    let ie = 0, md = Infinity;
    for (let k = 0; k < 4; k++) { const d = inc.N[k * 2] * nx + inc.N[k * 2 + 1] * ny; if (d < md) { md = d; ie = k; } }
    const ie2 = (ie + 1) % 4;
    let pts = [[inc.V[ie * 2], inc.V[ie * 2 + 1], 10], [inc.V[ie2 * 2], inc.V[ie2 * 2 + 1], 11]];
    const tl = Math.hypot(v2x - v1x, v2y - v1y) || 1, tx = (v2x - v1x) / tl, ty = (v2y - v1y) / tl;
    const clip = (ps, px, py, off, id) => {
      const out = [], d0 = px * ps[0][0] + py * ps[0][1] - off, d1 = px * ps[1][0] + py * ps[1][1] - off;
      if (d0 <= 0) out.push(ps[0]); if (d1 <= 0) out.push(ps[1]);
      if (d0 * d1 < 0) { const u = d0 / (d0 - d1); out.push([lerp(ps[0][0], ps[1][0], u), lerp(ps[0][1], ps[1][1], u), id]); }
      return out;
    };
    pts = clip(pts, -tx, -ty, -(tx * v1x + ty * v1y) + R, 20); if (pts.length < 2) return null;
    pts = clip(pts, tx, ty, tx * v2x + ty * v2y + R, 21); if (pts.length < 2) return null;
    const out = [];
    for (const p of pts) {
      const sep = nx * (p[0] - v1x) + ny * (p[1] - v1y) - R;
      if (sep > RB_MARGIN) continue;
      const qx = p[0] - nx * (inc.r + sep / 2), qy = p[1] - ny * (inc.r + sep / 2);
      out.push({ px: qx, py: qy, nx: flip ? -nx : nx, ny: flip ? -ny : ny, sep, id: flip * 10000 + re * 1000 + ie * 100 + p[2], Pn: 0, Pt: 0 });
    }
    return out.length ? out : null;
  }
  function rigidSim() {
    if (RIGID) return RIGID;
    const r = rng(7041), bodies = [];
    // statics: floor, walls, the word block
    bodies.push(rbBody({ x: 960, y: FL + 400, hx: 3000, hy: 400, stat: 1 }));
    bodies.push(rbBody({ x: 30 - 400, y: 0, hx: 400, hy: 3000, stat: 1 }));
    bodies.push(rbBody({ x: 1890 + 400, y: 0, hx: 400, hy: 3000, stat: 1 }));
    bodies.push(rbBody({ x: RB.wx, y: FL - RB.why, hx: RB.whx, hy: RB.why, stat: 1 }));
    const nStat = bodies.length;
    // drops, planned by landing time on the 8th-note grid
    const T = 0.62, drops = [];
    const land = [1.0, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 3.25, 3.5, 3.75, 4.0, 4.25, 4.5, 4.75, 5.0, 5.25];
    const cols = [P.accent, P.accent, P.accentL, P.accent, P.ink, P.accent, P.accentD, P.accent, P.accentL];
    land.forEach((tl, i) => {
      const s = i === 0 ? 210 : 70 + Math.pow(r(), 1.6) * 115;
      drops.push({ tl, s, x: i === 0 ? 520 : 150 + s / 2 + r() * (930 - s), a: r() * TAU, w: (r() - 0.5) * 9, vx: (r() - 0.5) * 260, col: i === 0 ? P.accent : cols[i % cols.length] });
    });
    drops.push({ tl: 6.0, s: 150, x: RB.wx + 18, a: 0.02, w: 0, vx: 0, col: P.accent, crown: 1 });
    drops.forEach(d => {
      const y0 = -d.s * 0.75, dist = FL - d.s / 2 - y0, vy = (dist - 0.5 * RB.g * T * T) / T;
      const b = rbBody({ s: d.s, x: d.x, y: y0, a: d.a, vx: d.vx, vy, w: d.w, col: d.col, on: false, t0: d.tl - T });
      bodies.push(b);
    });
    const nb = bodies.length, sub = RB.sub, dt = 1 / (FPS * sub);
    const fr = new Float32Array((NF + 1) * nb * 3), ke = new Float32Array(NF + 1), events = [];
    let arbs = new Map();
    const lastEv = new Map();
    const save = k => { const o = k * nb * 3; bodies.forEach((b, i) => { fr[o + i * 3] = b.x; fr[o + i * 3 + 1] = b.on ? b.y : -9999; fr[o + i * 3 + 2] = b.a; }); };
    bodies.forEach(b => { if (!b.stat) b.on = false; });
    function step(t) {
      for (let i = nStat; i < nb; i++) { const b = bodies[i]; if (!b.on && t >= b.t0) b.on = true; }
      for (let i = nStat; i < nb; i++) { const b = bodies[i]; if (!b.on || b.stat) continue; b.vy += RB.g * dt; b.w *= 0.999; b.vx *= 0.9995; }
      for (let i = 0; i < nb; i++) if (bodies[i].on) rbVerts(bodies[i]);
      const next = new Map();
      for (let i = 0; i < nb; i++) {
        const A = bodies[i]; if (!A.on) continue;
        for (let j = Math.max(i + 1, nStat); j < nb; j++) {
          const B = bodies[j]; if (!B.on || (!A.im && !B.im)) continue;
          if (!A.stat && Math.hypot(B.x - A.x, B.y - A.y) > A.br + B.br + 4) continue;
          const cs = rbCollide(A, B); if (!cs) continue;
          const key = i * 100 + j, old = arbs.get(key);
          if (old) cs.forEach(c => { const o = old.find(q => q.id === c.id); if (o) { c.Pn = o.Pn; c.Pt = o.Pt; c.warm = 1; } });
          next.set(key, cs);
        }
      }
      arbs = next;
      // prestep
      for (const [key, cs] of arbs) {
        const A = bodies[(key / 100) | 0], B = bodies[key % 100];
        for (const c of cs) {
          c.rax = c.px - A.x; c.ray = c.py - A.y; c.rbx = c.px - B.x; c.rby = c.py - B.y;
          const tx = -c.ny, ty = c.nx;
          const rnA = c.rax * c.ny - c.ray * c.nx, rnB = c.rbx * c.ny - c.rby * c.nx, rtA = c.rax * ty - c.ray * tx, rtB = c.rbx * ty - c.rby * tx;
          c.mn = 1 / (A.im + B.im + A.iI * rnA * rnA + B.iI * rnB * rnB);
          c.mt = 1 / (A.im + B.im + A.iI * rtA * rtA + B.iI * rtB * rtB);
          const dvx = B.vx - B.w * c.rby - A.vx + A.w * c.ray, dvy = B.vy + B.w * c.rbx - A.vy - A.w * c.rax, vn = dvx * c.nx + dvy * c.ny;
          c.bias = c.sep < 0 ? Math.min(240, 0.2 / dt * Math.max(0, -c.sep - 0.5)) : -c.sep / dt;
          if (vn < -120) c.bias = Math.max(c.bias, -RB.e * vn);
          if (vn < -170) {
            const last = lastEv.get(key) ?? -1;
            if (t - last > 0.12) { events.push([t, -vn, c.px, Math.min(A.stat ? 999 : A.s, B.s), A.stat ? 0 : 1]); lastEv.set(key, t); }
                      }
          const Px = c.Pn * c.nx + c.Pt * tx, Py = c.Pn * c.ny + c.Pt * ty;
          A.vx -= A.im * Px; A.vy -= A.im * Py; A.w -= A.iI * (c.rax * Py - c.ray * Px);
          B.vx += B.im * Px; B.vy += B.im * Py; B.w += B.iI * (c.rbx * Py - c.rby * Px);
        }
      }
      for (let it = 0; it < RB.it; it++) {
        for (const [key, cs] of arbs) {
          const A = bodies[(key / 100) | 0], B = bodies[key % 100];
          for (const c of cs) {
            const tx = -c.ny, ty = c.nx;
            let dvx = B.vx - B.w * c.rby - A.vx + A.w * c.ray, dvy = B.vy + B.w * c.rbx - A.vy - A.w * c.rax;
            const vn = dvx * c.nx + dvy * c.ny;
            let dP = c.mn * (c.bias - vn); const P0 = c.Pn; c.Pn = Math.max(P0 + dP, 0); dP = c.Pn - P0;
            let Px = dP * c.nx, Py = dP * c.ny;
            A.vx -= A.im * Px; A.vy -= A.im * Py; A.w -= A.iI * (c.rax * Py - c.ray * Px);
            B.vx += B.im * Px; B.vy += B.im * Py; B.w += B.iI * (c.rbx * Py - c.rby * Px);
            dvx = B.vx - B.w * c.rby - A.vx + A.w * c.ray; dvy = B.vy + B.w * c.rbx - A.vy - A.w * c.rax;
            const vt = dvx * tx + dvy * ty, mx = RB.mu * c.Pn;
            let dT = c.mt * -vt; const T0 = c.Pt; c.Pt = clamp(T0 + dT, -mx, mx); dT = c.Pt - T0;
            Px = dT * tx; Py = dT * ty;
            A.vx -= A.im * Px; A.vy -= A.im * Py; A.w -= A.iI * (c.rax * Py - c.ray * Px);
            B.vx += B.im * Px; B.vy += B.im * Py; B.w += B.iI * (c.rbx * Py - c.rby * Px);
          }
        }
      }
      // settling: after the last drop, damping ramps up and resting bodies freeze, so the pile holds still
      const dmp = 1 - 5 * dt * seg(t, 6.6, 7.8);
      for (let i = nStat; i < nb; i++) {
        const b = bodies[i]; if (!b.on || b.stat) continue;
        b.vx *= dmp; b.vy = b.vy * dmp; b.w *= dmp;
        b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.w * dt;
        const lim = t > 8.4 ? 70 : 12; if (t > 7.4 && Math.hypot(b.vx, b.vy) < lim && Math.abs(b.w) < lim / 70) { b.vx = b.vy = b.w = 0; b.im = b.iI = 0; b.stat = 2; }
      }
    }
    save(0);
    for (let k = 1; k <= NF; k++) {
      for (let s = 0; s < sub; s++) step((k - 1) / FPS + s * dt);
      save(k);
      let e = 0;
      for (let i = nStat; i < nb; i++) { const b = bodies[i]; if (b.on && b.im) e += 0.5 * (b.vx * b.vx + b.vy * b.vy) / b.im + 0.5 * b.w * b.w / b.iI; }
      ke[k] = e;
    }
    let kmax = 0; for (let k = 0; k <= NF; k++) kmax = Math.max(kmax, ke[k]);
    for (let k = 0; k <= NF; k++) ke[k] = Math.sqrt(ke[k] / kmax);
    RIGID = { fr, nb, nStat, ke, events, bodies: bodies.map(b => ({ s: b.s, col: b.col })) };
    return RIGID;
  }
  const rbKE = u => { const S = rigidSim(), f = clamp(u, 0, 1) * NF, k = Math.min(NF - 1, Math.floor(f)); return lerp(S.ke[k], S.ke[k + 1], f - k); };

  MG.film({
    id: 'techrigidbody', dur: 10, poster: 9.0,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Rigid Body', sub: 'Impulses, friction, stacking', era: '1988 —',
      origin: 'Rigid-body dynamics moves solid objects by integrating linear and angular momentum and resolving every contact so nothing interpenetrates. James Hahn’s Realistic Animation of Rigid Bodies and Moore and Wilhelms’ collision response (both SIGGRAPH 1988) brought it to animation, David Baraff’s analytical contact methods (1989 onward) made resting contact solvable, Mirtich and Canny popularised impulse-based simulation (1995), and Erin Catto’s sequential impulses in Box2D (2006–07) became the standard game solver.',
      works: 'Half-Life 2 (Valve, 2004; Havok physics) · Garry’s Mod (Facepunch, 2006) · Angry Birds (Rovio, 2009; Box2D)',
      tech: ['SAT + clipping contacts on rounded boxes', 'Warm-started sequential impulses', 'Coulomb friction and restitution'],
      accent: '#ff5a1f',
      motionDNA: 'Tokens fall in on the eighth-note grid, hit the floor and each other with a short restitution bounce, then tumble, slide and lock against friction; the pile grows and shuffles under each new arrival until kinetic energy bleeds away. A last Token lands flat on top of the word with a thud, and everything comes to rest for a still hold.',
      visualDNA: 'Warm paper studio with a grid and floor line; orange, light-orange, dark-orange and ink Tokens in many sizes, the hole in each showing its rotation, soft contact shadows on the floor; MOTION set heavy and black on the floor at right, acting as a solid; a kinetic-energy graph traced in the corner.',
      transitions: 'Empty stage, cascade, settle, still hold — the energy curve falls to zero',
      implementation: ['2D sequential-impulse solver (Box2D-lite style) precomputed in setup', 'Rounded-box contacts from SAT, edge clipping and radius', 'Audio thuds from the recorded contact events'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { sim: rigidSim() }; },
    draw(c, t, W, H) {
      const S = rigidSim(), nb = S.nb, f = clamp(t * FPS, 0, NF), k = Math.min(NF - 1, Math.floor(f)), u = f - k, A = S.fr, o0 = k * nb * 3, o1 = (k + 1) * nb * 3;
      TK.stage(c, W, H, { floor: FL });
      const list = [];
      for (let i = S.nStat; i < nb; i++) {
        const y0 = A[o0 + i * 3 + 1], y1 = A[o1 + i * 3 + 1];
        if (y1 < -9000) continue;
        const x = y0 < -9000 ? A[o1 + i * 3] : lerp(A[o0 + i * 3], A[o1 + i * 3], u), y = y0 < -9000 ? y1 : lerp(y0, y1, u), a = y0 < -9000 ? A[o1 + i * 3 + 2] : lerp(A[o0 + i * 3 + 2], A[o1 + i * 3 + 2], u);
        list.push({ x, y, a, s: S.bodies[i].s, col: S.bodies[i].col });
      }
      list.forEach(b => {
        const ext = b.s / 2 * (Math.abs(Math.cos(b.a)) + Math.abs(Math.sin(b.a))) * 0.8, lift = FL - (b.y + ext);
        if (lift < 500 && b.y < FL) TK.shadow(c, b.x, FL, b.s, Math.max(0, lift));
      });
      text(c, TK.WORD, RB.wx, FL, { font: TK.FONT, weight: 900, size: RB.wsize, color: P.ink, align: 'center', base: 'alphabetic', ls: 4 });
      list.forEach(b => TK.token(c, b.x, b.y, b.s, { rot: b.a, color: b.col }));
      TK.caption(c, t, W, H, { name: 'Rigid Body', cat: 'Simulation', curve: rbKE, span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'KINETIC ENERGY' });
    },
    score(A) {
      TK.bed(A);
      const S = rigidSim();
      // loudest events first, at most ~70 voices, never more than 3 per 1/30 s
      const ev = S.events.slice().sort((a, b) => b[1] - a[1]).slice(0, 90), slots = new Map(); let n = 0;
      ev.sort((a, b) => a[0] - b[0]).forEach(([t, v, x, s, tok]) => {
        const sl = Math.round(t * 30); if ((slots.get(sl) || 0) >= 3 || n >= 70) return; slots.set(sl, (slots.get(sl) || 0) + 1); n++;
        const m = clamp((v - 150) / 1300, 0.08, 1), sz = clamp(s / 220, 0.3, 1), pan = clamp((x - 960) / 1100, -0.8, 0.8), f = 70 + 9000 / Math.max(60, s);
        A.osc(t, { f: f * 1.7, f2: f, glide: 0.07, dur: 0.12 + 0.25 * sz, g: 0.16 * m * (0.5 + 0.5 * sz), a: 0.002, pan });
        A.noise(t, { type: 'lowpass', f: 900 + 1600 * m, dur: 0.05, g: 0.1 * m, pan });
        if (tok) A.noise(t, { type: 'bandpass', f: 1800 + 1400 * (1 - sz), q: 2.5, dur: 0.035, g: 0.07 * m, pan });
      });
      A.impact(6.0, 0.18, { rev: 0.35 });
      A.chord(7.0, [55, 62, 71], { type: 'sine', dur: 3.0, g: 0.03, a: 0.05, rev: 0.5, width: 0.5 });
    },
  });

  /* =====================================================================
     DESTRUCTION — a heavy ink ball arcs in and strikes the Token on the
     downbeat. The Token is pre-fractured into seeded Voronoi cells (denser
     near the strike); the shards inherit an impulse, fly with gravity and
     spin, bounce on the floor with restitution and friction, and come to
     rest. Then the tape rewinds: the same precomputed simulation plays
     backwards, eased, until the shards snap together on the beat.
     ===================================================================== */
  const DS = { S: 340, n: 46, dt: 1 / 240, T: 3.3, sr: 60, e: 0.34, mu: 0.6, R: 76, bvx: 1500, bvy: 650, g: 2600 };
  const DS_C = [960, FL - DS.S / 2], DS_HIT = [DS_C[0] - DS.S / 2 - DS.R + 4, DS_C[1] - 30];
  const DS_IMP = [-DS.S / 2, -30];   // strike point in Token-local coordinates
  // sim-time remap: slow-motion at the strike, forward, then an eased rewind landing on the beat at 7.5 s
  const DS_TAB = (() => {
    const n = 3500, tab = new Float64Array(n + 1); let s = 0;
    for (let i = 1; i <= n; i++) { const t = 2 + (i - 0.5) / 1000; s += (0.26 + 0.74 * E.ioS(seg(t, 2.2, 2.95))) / 1000; tab[i] = s; }
    return tab;
  })();
  const DS_T55 = DS_TAB[3500];
  function dsTau(t) {
    if (t < 2) return Math.max(-0.75, t - 2);
    if (t <= 5.5) { const f = (t - 2) * 1000, i = Math.floor(f); return lerp(DS_TAB[i], DS_TAB[Math.min(3500, i + 1)], f - i); }
    if (t <= 7.5) return DS_T55 * (1 - E.ioC(seg(t, 5.5, 7.5)));
    return -0.75 * E.ioC(seg(t, 7.5, 8.5));
  }
  function inTok(x, y) {
    const S = DS.S, h = S / 2, rr = TK.CORNER * S;
    if (Math.abs(x) > h || Math.abs(y) > h) return false;
    const ax = Math.abs(x) - (h - rr), ay = Math.abs(y) - (h - rr);
    if (ax > 0 && ay > 0 && ax * ax + ay * ay > rr * rr) return false;
    return Math.hypot(x - TK.HOLE.x * S, y - TK.HOLE.y * S) > TK.HOLE.r * S;
  }
  function clipHalf(poly, nx, ny, off) {   // keep nx*x + ny*y <= off
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length], da = nx * a[0] + ny * a[1] - off, db = nx * b[0] + ny * b[1] - off;
      if (da <= 0) out.push(a);
      if (da * db < 0) { const u = da / (da - db); out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u)]); }
    }
    return out;
  }
  let DEST = null;
  function destSim() {
    if (DEST) return DEST;
    const r = rng(5150), S = DS.S, h = S / 2, seeds = [];
    while (seeds.length < DS.n) {
      const x = (r() - 0.5) * S, y = (r() - 0.5) * S;
      if (!inTok(x, y)) continue;
      if (r() > 0.3 + 0.7 * Math.exp(-Math.hypot(x - DS_IMP[0], y - DS_IMP[1]) / 170)) continue;
      if (seeds.some(s => Math.hypot(s[0] - x, s[1] - y) < 16)) continue;
      seeds.push([x, y]);
    }
    const shards = [];
    seeds.forEach((s, i) => {
      let poly = [[-h, -h], [h, -h], [h, h], [-h, h]];
      seeds.forEach((q, j) => {
        if (i === j || poly.length < 3) return;
        const dx = q[0] - s[0], dy = q[1] - s[1];
        poly = clipHalf(poly, dx, dy, dx * (s[0] + q[0]) / 2 + dy * (s[1] + q[1]) / 2);
      });
      if (poly.length < 3) return;
      let A = 0, cx = 0, cy = 0;
      for (let k = 0; k < poly.length; k++) { const a = poly[k], b = poly[(k + 1) % poly.length], cr = a[0] * b[1] - b[0] * a[1]; A += cr; cx += (a[0] + b[0]) * cr; cy += (a[1] + b[1]) * cr; }
      A /= 2; cx /= 6 * A; cy /= 6 * A;
      const loc = poly.map(p => [p[0] - cx, p[1] - cy]);
      let i2 = 0; loc.forEach(p => { i2 += p[0] * p[0] + p[1] * p[1]; }); i2 /= loc.length;
      const m = Math.abs(A) * 1e-4;
      shards.push({ poly, loc, cx, cy, area: Math.abs(A), im: 1 / m, iI: 1 / (m * i2 * 0.5) });
    });
    // initial impulse from the strike
    const ns = shards.length, st = shards.map(sh => {
      const dx = sh.cx - DS_IMP[0], dy = sh.cy - DS_IMP[1], d = Math.hypot(dx, dy) || 1, fall = 0.3 + 0.7 * Math.exp(-d / 240);
      const sp = 1650 * fall * (0.75 + 0.5 * r());
      return { x: DS_C[0] + sh.cx, y: DS_C[1] + sh.cy, a: 0, vx: sp * (0.5 * dx / d + 0.62), vy: sp * (0.55 * dy / d - 0.5) - 160 * r(), w: (r() - 0.5) * 18 * (0.4 + fall), sleep: 0, still: 0 };
    });
    const ball = { x: DS_HIT[0], y: DS_HIT[1], vx: 240, vy: -260, a: 0 };
    const nS = Math.round(DS.T * DS.sr), fr = new Float32Array((nS + 1) * ns * 3), bf = new Float32Array((nS + 1) * 3), events = [];
    const per = Math.round(1 / (DS.dt * DS.sr));
    const save = k => { st.forEach((s, i) => { fr[(k * ns + i) * 3] = s.x; fr[(k * ns + i) * 3 + 1] = s.y; fr[(k * ns + i) * 3 + 2] = s.a; }); bf[k * 3] = ball.x; bf[k * 3 + 1] = ball.y; bf[k * 3 + 2] = ball.a; };
    save(0);
    const dt = DS.dt;
    for (let k = 1; k <= nS; k++) {
      for (let q = 0; q < per; q++) {
        const tm = ((k - 1) * per + q) * dt;
        st.forEach((s, i) => {
          if (s.sleep) return;
          const sh = shards[i];
          s.vy += DS.g * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.a += s.w * dt;
          const c = Math.cos(s.a), sn = Math.sin(s.a);
          let touch = false;
          for (let pass = 0; pass < 2; pass++) {
            let my = -1e9, mx = 0, mi = -1, minx = 1e9, maxx = -1e9;
            sh.loc.forEach((p, j) => { const wx = c * p[0] - sn * p[1], wy = sn * p[0] + c * p[1]; if (wy > my) { my = wy; mx = wx; mi = j; } minx = Math.min(minx, wx); maxx = Math.max(maxx, wx); });
            if (pass === 0) { if (s.x + minx < 24) { s.x = 24 - minx; s.vx = Math.abs(s.vx) * 0.4; } if (s.x + maxx > 1896) { s.x = 1896 - maxx; s.vx = -Math.abs(s.vx) * 0.4; } }
            if (s.y + my <= FL) break;
            touch = true; s.y = FL - my;
            const rx = mx, ry = my, vn = s.vy + s.w * rx;
            if (vn > 0) {
              if (vn > 140 && pass === 0) events.push([tm, vn, s.x, Math.sqrt(sh.area)]);
              const J = -(1 + (vn > 90 ? DS.e : 0)) * vn / (sh.im + sh.iI * rx * rx);
              s.vy += J * sh.im; s.w += sh.iI * rx * J;
              const vt = s.vx - s.w * ry, Jt = clamp(-vt / (sh.im + sh.iI * ry * ry), -DS.mu * Math.abs(J), DS.mu * Math.abs(J));
              s.vx += Jt * sh.im; s.w -= sh.iI * ry * Jt;
            }
          }
          if (touch) { s.w *= 0.985; s.vx *= 0.992; }
          if (touch && Math.hypot(s.vx, s.vy) < 22 && Math.abs(s.w) < 0.5) { if (++s.still > 30) { s.sleep = 1; s.vx = s.vy = s.w = 0; } } else s.still = 0;
        });
        ball.vy += DS.g * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.a += ball.vx / DS.R * dt;
        if (ball.y > FL - DS.R) { ball.y = FL - DS.R; if (ball.vy > 120) events.push([tm, ball.vy, ball.x, 200, 1]); ball.vy = -ball.vy * 0.42; if (Math.abs(ball.vy) < 60) ball.vy = 0; ball.vx *= 0.985; }
      }
      save(k);
    }
    const dust = Array.from({ length: 44 }, () => { const a = -1.5 + r() * 2.6, v = 300 + r() * 900; return [Math.cos(a) * v, Math.sin(a) * v - 200, 2 + r() * 5, r()]; });
    DEST = { shards, fr, bf, ns, nS, events, dust };
    return DEST;
  }
  function dsBall(tau) {
    if (tau <= 0) return [DS_HIT[0] + DS.bvx * tau, DS_HIT[1] + DS.bvy * tau + 0.5 * DS.g * tau * tau, DS.bvx * tau / DS.R];
    const D = destSim(), f = clamp(tau * DS.sr, 0, D.nS), k = Math.min(D.nS - 1, Math.floor(f)), u = f - k, b = D.bf;
    return [lerp(b[k * 3], b[k * 3 + 3], u), lerp(b[k * 3 + 1], b[k * 3 + 4], u), lerp(b[k * 3 + 2], b[k * 3 + 5], u)];
  }
  // real times at which sim time `s` is shown going forward and in rewind
  function dsTimes(s) {
    const out = []; let prev = dsTau(2);
    for (let t = 2.001; t < 8.5; t += 0.001) { const v = dsTau(t); if ((prev - s) * (v - s) <= 0 && prev !== v) out.push(t); prev = v; }
    return out;
  }

  MG.film({
    id: 'techdestruction', dur: 10, poster: 2.75,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Destruction', sub: 'Voronoi fracture and rewind', era: '1999 —',
      origin: 'Destruction effects break a solid into pieces and hand them to a rigid-body solver. James O’Brien and Jessica Hodgins simulated brittle fracture from stress in 1999 (ductile fracture followed in 2002); production and games mostly pre-fracture instead, cutting the model into Voronoi cells around scattered points, as in Houdini’s Voronoi Fracture, 3ds Max RayFire and Blender’s Cell Fracture, while Pixelux’s Digital Molecular Matter and Volition’s GeoMod brought dynamic breakage to consoles.',
      works: 'Star Wars: The Force Unleashed (LucasArts, 2008; Pixelux DMM) · Red Faction: Guerrilla (Volition, 2009; GeoMod 2.0) · Teardown (Tuxedo Labs, 2020)',
      tech: ['Seeded Voronoi pre-fracture', 'Shard impulses, spin, floor bounce', 'Time remap: slow-mo and rewind'],
      accent: '#ff5a1f',
      motionDNA: 'A beat of stillness, a heavy ball arcs in and connects on the downbeat; time drops to a quarter speed as the cracks open, then catches up while shards spray, spin and rain down, bouncing and skidding to rest. After a held beat the clock runs backwards, slow, then fast, then easing, until every shard drops back into its cell and the Token clicks whole.',
      visualDNA: 'Warm paper studio with a grid and floor line; the orange Token cut into angular Voronoi shards with darker fracture faces, small dust specks, a matte black ball, soft contact shadows; a mono simulation clock top right that reads SLOW and REWIND; a sim-time graph in the corner showing the remap.',
      transitions: 'Strike, scatter, settle; a rewind reassembles the subject and the word appears over it',
      implementation: ['Voronoi cells by half-plane clipping, drawn as clipped windows onto the Token path', 'Per-shard rigid integration with vertex–floor impulses, precomputed in setup', 'Eased playback remap of the cached simulation'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { sim: destSim() }; },
    draw(c, t, W, H) {
      const D = destSim(), tau = dsTau(t), S = DS.S;
      TK.stage(c, W, H, { floor: FL });
      const sh = t > 2 && t < 2.7 ? 9 * Math.exp(-(t - 2) * 7) : 0;
      c.save(); c.translate(sh * vnoise(t * 40, 1), sh * vnoise(t * 40, 2));
      const ball = dsBall(tau);
      if (tau <= 0) {
        TK.shadow(c, DS_C[0], FL, S, 0);
        TK.token(c, DS_C[0], DS_C[1], S);
        const ca = t > 7.5 ? 1 - seg(t, 7.5, 8.3) : 0;
        if (ca > 0) {   // fracture seams fade out after reassembly
          c.save(); c.translate(DS_C[0], DS_C[1]); TK.tokenPath(c, S); c.clip('evenodd');
          c.strokeStyle = `rgba(110,30,4,${0.7 * ca})`; c.lineWidth = 2;
          D.shards.forEach(s => { c.beginPath(); s.poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.stroke(); });
          c.restore();
        }
      } else {
        const f = clamp(tau * DS.sr, 0, D.nS), k = Math.min(D.nS - 1, Math.floor(f)), u = f - k, A = D.fr, ns = D.ns;
        const pos = D.shards.map((s, i) => { const o0 = (k * ns + i) * 3, o1 = o0 + ns * 3; return [lerp(A[o0], A[o1], u), lerp(A[o0 + 1], A[o1 + 1], u), lerp(A[o0 + 2], A[o1 + 2], u)]; });
        pos.forEach(([x, y], i) => { const sz = Math.sqrt(D.shards[i].area), lift = FL - y - sz * 0.4; if (lift < 300) TK.shadow(c, x, FL, sz * 0.9, Math.max(0, lift)); });
        // dust from the strike
        const dl = 1 - seg(tau, 0, 0.9);
        if (dl > 0) {
          c.fillStyle = P.ink;
          D.dust.forEach(([vx, vy, s, h]) => {
            const kk = 3.2, e = (1 - Math.exp(-kk * tau)) / kk;
            const x = DS_C[0] + DS_IMP[0] + vx * e, y = DS_C[1] + DS_IMP[1] + vy * e + 0.5 * 1400 * tau * tau;
            c.globalAlpha = 0.5 * dl * (0.5 + 0.5 * h); c.beginPath(); c.arc(x, Math.min(y, FL - 2), s * (1 - 0.5 * h), 0, TAU); c.fill();
          });
          c.globalAlpha = 1;
        }
        D.shards.forEach((s, i) => {
          const [x, y, a] = pos[i];
          c.save(); c.translate(x, y); c.rotate(a);
          c.beginPath(); s.loc.forEach((p, j) => (j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.clip();
          c.translate(-s.cx, -s.cy);
          TK.tokenPath(c, S); c.fillStyle = P.accent; c.fill('evenodd'); c.clip('evenodd');
          c.translate(s.cx, s.cy);
          c.beginPath(); s.loc.forEach((p, j) => (j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
          c.strokeStyle = P.accentD; c.lineWidth = 5; c.stroke();
          c.restore();
        });
        // strike ring
        const ra = 1 - seg(tau, 0, 0.12);
        if (ra > 0 && t < 4) {
          c.strokeStyle = `rgba(23,24,28,${0.5 * ra})`; c.lineWidth = 3;
          c.beginPath(); c.arc(DS_C[0] + DS_IMP[0], DS_C[1] + DS_IMP[1], 30 + 900 * tau, 0, TAU); c.stroke();
        }
      }
      // the ball
      if (ball[0] > -DS.R - 10) {
        const bl = FL - ball[1] - DS.R;
        TK.shadow(c, ball[0], FL, DS.R * 1.6, Math.max(0, bl));
        c.save(); c.translate(ball[0], ball[1]); c.rotate(ball[2]);
        c.fillStyle = P.ink; c.beginPath(); c.arc(0, 0, DS.R, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(236,232,223,0.35)'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, DS.R * 0.62, -0.6, 0.9); c.stroke();
        c.restore();
      }
      c.restore();
      // simulation clock HUD
      const wa = E.outC(seg(t, 8.0, 8.8));
      if (wa > 0) TK.word(c, 960, 300 + 24 * (1 - wa), { alpha: wa, size: 150 });
      if (t > 1.0 && t < 9.2) {
        const al = Math.min(seg(t, 1.0, 1.4), 1 - seg(t, 8.6, 9.2)), rew = t > 5.5 && t < 7.5, slow = t >= 2 && t < 2.9;
        c.save(); c.globalAlpha = al;
        text(c, `SIM  ${Math.max(0, tau).toFixed(2)} s`, W - 72, 96, { font: TK.MONO, size: 22, ls: 2, color: P.ink, align: 'right' });
        const lab = rew ? 'REWIND' : slow ? 'SLOW  ×' + (0.26 + 0.74 * E.ioS(seg(t, 2.2, 2.95))).toFixed(2) : t >= 7.5 ? 'REASSEMBLED' : 'PLAY';
        text(c, lab, W - 72, 130, { font: TK.MONO, size: 16, ls: 3, color: rew || slow ? P.accentD : P.mute, align: 'right' });
        const ix = W - 72 - lab.length * 12.6 - 34;
        c.fillStyle = rew || slow ? P.accentD : P.mute; c.beginPath();
        if (rew) { c.moveTo(ix + 12, 116); c.lineTo(ix, 123); c.lineTo(ix + 12, 130); c.moveTo(ix + 24, 116); c.lineTo(ix + 12, 123); c.lineTo(ix + 24, 130); }
        else { c.moveTo(ix + 10, 116); c.lineTo(ix + 22, 123); c.lineTo(ix + 10, 130); }
        c.fill();
        c.restore();
      }
      TK.caption(c, t, W, H, { name: 'Destruction', cat: 'Simulation', curve: v => clamp((dsTau(v * 10) + 0.75) / (DS_T55 + 0.75)), span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'SIM TIME / TIME' });
    },
    score(A) {
      TK.bed(A);
      const D = destSim();
      A.whoosh(1.4, 0.62, { f1: 250, f2: 2600, g: 0.12, swell: 0.85, pan: -0.4 });
      A.impact(2.0, 0.34, { rev: 0.45 });
      A.noise(2.0, { type: 'highpass', f: 2400, dur: 0.4, g: 0.22, rev: 0.3 });
      for (let i = 0; i < 9; i++) A.noise(2.0 + i * 0.022 + 0.01 * hash(i), { type: 'bandpass', f: 2600 + 3200 * hash(i + 4), q: 3, dur: 0.03, g: 0.07 });
      const ev = D.events.slice().sort((a, b) => b[1] - a[1]).slice(0, 36);
      ev.forEach(([s, v, x, sz, isBall]) => {
        const m = clamp((v - 120) / 1400, 0.1, 1), pan = clamp((x - 960) / 1100, -0.8, 0.8);
        dsTimes(s).forEach(t => {
          const rev = t > 5.5, g = rev ? 0.55 : 1;
          if (isBall) { A.osc(t, { f: 110, f2: 55, dur: 0.3, g: 0.2 * m * g, pan }); A.noise(t, { type: 'lowpass', f: 600, dur: 0.08, g: 0.1 * m * g, pan }); return; }
          const f = 1400 + 260000 / Math.max(40, sz * sz) * 10;
          A.osc(t, { type: 'triangle', f: Math.min(5200, f), dur: 0.06 + sz / 1400, g: 0.05 * m * g, pan });
          A.noise(t, { type: 'bandpass', f: 3500, q: 2.5, dur: 0.03, g: 0.07 * m * g, pan });
        });
      });
      // rewind: a reversed tape sweep that lands on the reassembly beat
      A.noise(5.5, { type: 'bandpass', f: 5200, f2: 500, q: 1.5, dur: 2.02, g: 0.1, swell: 0.75, rev: 0.25 });
      A.osc(5.5, { type: 'sawtooth', f: 160, f2: 900, glide: 2.0, dur: 2.0, g: 0.035, lp: 1200, lp2: 3500, lpT: 2.0, a: 1.6 });
      A.kick(7.5, 0.3, { f: 220, f2: 70 });
      A.noise(7.5, { type: 'highpass', f: 3500, dur: 0.05, g: 0.16 });
      A.bell(7.5, midi(76), { g: 0.06, dur: 1.4 });
      A.chord(8.0, [60, 67, 76], { type: 'sine', dur: 2.0, g: 0.03, a: 0.04, rev: 0.5, width: 0.5 });
    },
  });
})();
