/* batch k8 — Technique Atlas · Simulation, Procedural: techfluid · techsoftbody · technoise.
   techfluid (a 1,100-particle SPH liquid — double-density relaxation — in a glass tank; the
   Token, two-way coupled, drops in, splashes, bobs up to float, is shoved through the water and
   settles, with a speed-coloured debug view of every particle) ·
   techsoftbody (the Token embedded in a 9 × 9 mass-spring lattice, two stiffnesses side by side:
   dropped, pressed by the same force, released, recovering their rest shape, with the springs
   drawn coloured by strain) ·
   technoise (white random jitter against coherent Perlin noise, octaves added one by one into
   fBm, then a field of Tokens each sampling the same noise at its own offset).
   The two simulations run once in setup (cached at module level so score() hears the same
   events); draw(t) only looks up and interpolates precomputed frames. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, rng, hash, midi, text, offscreen } = MG;
  const TK = MG.TK, P = TK.P, FL = TK.FLOOR, PI = Math.PI;
  const FPS = 30, NF = 300;
  const fonts = TK.fonts.concat([[`700 20px ${TK.MONO}`, 'SPH PARTICLES SOFT FIRM OCTAVE NOISE 0123456789 ·ρΣ|/=']]);

  /* ---------------- shared helpers ---------------- */
  const label = (c, s, x, y, o = {}) => text(c, s, x, y, { font: TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
  const tag = (c, s, x, y, on = 1) => {   // small accent dot + mono label
    if (on <= 0.01) return;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: P.ink, weight: 700, size: 20 });
    c.restore();
  };
  const win = (t, a, b, f = 0.3) => seg(t, a - f, a) * (1 - seg(t, b, b + f));
  function arrow(c, x0, y0, x1, y1, hw = 5) {
    const a = Math.atan2(y1 - y0, x1 - x0);
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1);
    c.moveTo(x1 - Math.cos(a - 0.5) * hw * 1.6, y1 - Math.sin(a - 0.5) * hw * 1.6); c.lineTo(x1, y1);
    c.lineTo(x1 - Math.cos(a + 0.5) * hw * 1.6, y1 - Math.sin(a + 0.5) * hw * 1.6);
    c.stroke();
  }
  // speed ramp blue → accent, in 8 bins
  const RAMP = Array.from({ length: 8 }, (_, i) => {
    const u = i / 7, A = [47, 91, 255], B = [255, 90, 31], M = [140, 120, 170];
    const v = u < 0.5 ? A.map((a, k) => lerp(a, M[k], u * 2)) : M.map((m, k) => lerp(m, B[k], u * 2 - 1));
    return `rgb(${v.map(Math.round).join(',')})`;
  });

  /* =====================================================================
     FLUID — smoothed-particle hydrodynamics in the Clavet, Beaudoin and
     Poulin style (double-density relaxation): 1,100 particles in a glass
     tank, each pushed apart by a pressure from the density of its
     neighbours within h. The Token is a rigid body coupled both ways —
     every push it gives a particle comes back to it as an impulse — so
     it splashes in, sinks, rises on its own buoyancy and floats. At 5 s a
     spring drags it through the water and back, raising a bow wave.
     ===================================================================== */
  const FD = { L: 600, R: 1320, top: 330, n: 1100, sp: 12, h: 24, sub: 4, g: 2000, k: 0.5, kn: 1.6, visc: 0.08, pr: 5, S: 180, rel: 0.94, hold: [960, 210], tilt: 0.16, ratio: 0.7, pre: 1.5 };
  const FD_PUSH = t => (E.ioS(seg(t, 4.9, 5.6)) - E.ioS(seg(t, 6.4, 7.2)));
  const FD_PW = t => seg(t, 4.8, 5.0);   // the mooring spring stays on once hooked
  let FLUID = null;
  function fluidSim() {
    if (FLUID) return FLUID;
    const N = FD.n, h = FD.h, h2 = h * h, sub = FD.sub, dts = 1 / (FPS * sub), g = FD.g * dts * dts, pr = FD.pr;
    const X = new Float64Array(N), Y = new Float64Array(N), PX = new Float64Array(N), PY = new Float64Array(N), VX = new Float64Array(N), VY = new Float64Array(N);
    const r = rng(1337), cols = Math.floor((FD.R - FD.L - FD.sp) / FD.sp);
    for (let p = 0; p < N; p++) {
      const i = p % cols, j = (p / cols) | 0;
      X[p] = FD.L + FD.sp * (0.6 + i + (j % 2) * 0.5) + (r() - 0.5); Y[p] = FL - pr - FD.sp * j * 0.88 + (r() - 0.5);
    }
    // uniform grid, cell = h
    const G0x = FD.L - 2 * h, G0y = -1600, GW = Math.ceil((FD.R - FD.L + 4 * h) / h), GH = Math.ceil((FL + 2 * h - G0y) / h), NC = GW * GH;
    const start = new Int32Array(NC + 1), cur = new Int32Array(NC), cell = new Int32Array(N), sorted = new Int32Array(N);
    function build() {
      start.fill(0);
      for (let p = 0; p < N; p++) {
        const cx = clamp(Math.floor((X[p] - G0x) / h), 0, GW - 1), cy = clamp(Math.floor((Y[p] - G0y) / h), 0, GH - 1);
        cell[p] = cy * GW + cx; start[cell[p] + 1]++;
      }
      for (let q = 0; q < NC; q++) start[q + 1] += start[q];
      for (let q = 0; q < NC; q++) cur[q] = start[q];
      for (let p = 0; p < N; p++) sorted[cur[cell[p]]++] = p;
    }
    const nbJ = new Int32Array(256), nbQ = new Float64Array(256), nbX = new Float64Array(256), nbY = new Float64Array(256);
    function neigh(i) {
      let m = 0;
      const cc = cell[i], cx = cc % GW, cy = (cc / GW) | 0, xi = X[i], yi = Y[i];
      for (let oy = -1; oy <= 1; oy++) {
        const yy = cy + oy; if (yy < 0 || yy >= GH) continue;
        for (let ox = -1; ox <= 1; ox++) {
          const xx = cx + ox; if (xx < 0 || xx >= GW) continue;
          const q0 = yy * GW + xx;
          for (let s = start[q0]; s < start[q0 + 1]; s++) {
            const j = sorted[s]; if (j === i) continue;
            const dx = X[j] - xi, dy = Y[j] - yi, d2 = dx * dx + dy * dy;
            if (d2 >= h2 || d2 < 1e-12 || m >= 256) continue;
            const d = Math.sqrt(d2);
            nbJ[m] = j; nbQ[m] = 1 - d / h; nbX[m] = dx / d; nbY[m] = dy / d; m++;
          }
        }
      }
      return m;
    }
    // the Token: rounded square with the hole, as a signed distance in its own frame
    const S = FD.S, rr = TK.CORNER * S, bh = S / 2 - rr, hx = TK.HOLE.x * S, hy = TK.HOLE.y * S, hr = TK.HOLE.r * S;
    const sdf = (lx, ly) => {
      const qx = Math.abs(lx) - bh, qy = Math.abs(ly) - bh;
      const box = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rr;
      return Math.max(box, -(Math.hypot(lx - hx, ly - hy) - hr));
    };
    const tk = { x: FD.hold[0], y: FD.hold[1], a: FD.tilt, vx: 0, vy: 0, w: 0, M: 1, I: 1 };
    let rho0 = 0;
    let imp = 0;   // |impulse| exchanged with the Token this step
    function step(t, settle) {
      const live = t >= FD.rel;
      if (live) {
        tk.vy += g;
        const pw = FD_PW(t);
        if (pw > 0) {
          const tx = 960 + 175 * FD_PUSH(t), om = TAU * 1.4 * dts;
          tk.vx += pw * (om * om * (tx - tk.x) - 2 * 0.7 * om * tk.vx);
        }
        if (t > FD.rel + 0.8) tk.w += -0.00025 * tk.a - 0.004 * tk.w;   // a light keel keeps it face-up
        tk.x += tk.vx; tk.y += tk.vy; tk.a += tk.w;
      }
      for (let p = 0; p < N; p++) {
        VY[p] += g;
        PX[p] = X[p]; PY[p] = Y[p]; X[p] += VX[p]; Y[p] += VY[p];
      }
      build();
      for (let i = 0; i < N; i++) {
        const m = neigh(i);
        let rho = 0, rn = 0;
        for (let n = 0; n < m; n++) { const q = nbQ[n]; rho += q * q; rn += q * q * q; }
        const Pp = FD.k * (rho - rho0), Pn = FD.kn * rn;
        let ax = 0, ay = 0;
        for (let n = 0; n < m; n++) {
          const q = nbQ[n], j = nbJ[n];
          let D = 0.5 * (Pp * q + Pn * q * q);
          if (D > 3) D = 3; else if (D < -3) D = -3;
          const ux = nbX[n] * D, uy = nbY[n] * D;
          X[j] += ux; Y[j] += uy; ax -= ux; ay -= uy;
        }
        X[i] += ax; Y[i] += ay;
      }
      // boundaries: tank walls (open top, walls run on upward), floor, then the Token
      const c0 = Math.cos(tk.a), s0 = Math.sin(tk.a);
      let jx = 0, jy = 0, jt = 0; imp = 0;
      const reach = S * 0.75 + pr;
      for (let p = 0; p < N; p++) {
        if (X[p] < FD.L + pr) X[p] = FD.L + pr + 0.01 * hash(p);
        if (X[p] > FD.R - pr) X[p] = FD.R - pr - 0.01 * hash(p);
        if (Y[p] > FL - pr) { Y[p] = FL - pr; PX[p] = lerp(PX[p], X[p], 0.2); }
        const dx = X[p] - tk.x, dy = Y[p] - tk.y;
        if (Math.abs(dx) > reach || Math.abs(dy) > reach) continue;
        const lx = c0 * dx + s0 * dy, ly = -s0 * dx + c0 * dy, d = sdf(lx, ly);
        if (d >= pr) continue;
        const e = 0.5, gx = sdf(lx + e, ly) - sdf(lx - e, ly), gy = sdf(lx, ly + e) - sdf(lx, ly - e), gl = Math.hypot(gx, gy) || 1;
        const nx = gx / gl, ny = gy / gl, wx = c0 * nx - s0 * ny, wy = s0 * nx + c0 * ny, push = pr - d;
        X[p] += wx * push; Y[p] += wy * push;
        if (live) { jx -= wx * push; jy -= wy * push; jt -= dx * wy * push - dy * wx * push; imp += push; }
      }
      if (live) {
        tk.vx += jx / tk.M; tk.vy += jy / tk.M; tk.w += jt / tk.I; tk.w *= 0.997;
        // the Token against the tank
        const ex = S / 2 * (Math.abs(Math.cos(tk.a)) + Math.abs(Math.sin(tk.a))) * 0.94;
        if (tk.x - ex < FD.L) { tk.x = FD.L + ex; tk.vx = Math.abs(tk.vx) * 0.3; }
        if (tk.x + ex > FD.R) { tk.x = FD.R - ex; tk.vx = -Math.abs(tk.vx) * 0.3; }
        if (tk.y + ex > FL) { tk.y = FL - ex; tk.vy = Math.min(0, tk.vy) * -0.2; }
      } else { tk.x = FD.hold[0]; tk.y = FD.hold[1]; tk.a = FD.tilt; }
      // velocities from positions, then a little XSPH-style viscosity
      for (let p = 0; p < N; p++) { VX[p] = X[p] - PX[p]; VY[p] = Y[p] - PY[p]; }
      for (let i = 0; i < N; i++) {
        const m = neigh(i);
        let sx = 0, sy = 0, sw = 0;
        for (let n = 0; n < m; n++) { const j = nbJ[n], q = nbQ[n]; sx += (VX[j] - VX[i]) * q; sy += (VY[j] - VY[i]) * q; sw += q; }
        if (sw > 0) { VX[i] += FD.visc * sx / Math.max(1, sw); VY[i] += FD.visc * sy / Math.max(1, sw); }
        const sp = Math.hypot(VX[i], VY[i]), cap = h * 0.4;
        if (sp > cap) { VX[i] *= cap / sp; VY[i] *= cap / sp; }
        if (settle) { VX[i] *= 0.9; VY[i] *= 0.9; }
      }
    }
    // rest density from the initial packing
    build();
    { let acc = 0, n0 = 0; for (let i = 0; i < N; i += 7) { const m = neigh(i); if (m < 8) continue; let rho = 0; for (let n = 0; n < m; n++) rho += nbQ[n] * nbQ[n]; acc += rho; n0++; } rho0 = acc / n0 * 0.96; }
    const pre = Math.round(FD.pre * FPS * sub);
    for (let s = 0; s < pre; s++) step(-FD.pre + s / (FPS * sub), true);
    // Token mass from the settled water: area per particle × ratio
    const ys = Array.from(Y).sort((a, b) => a - b), surf = ys.slice(0, cols).reduce((a, b) => a + b, 0) / cols;
    const ap = (FD.R - FD.L) * (FL - surf) / N, at = S * S - (4 - PI) * rr * rr - PI * hr * hr;
    tk.M = FD.ratio * at / ap; tk.I = tk.M * S * S / 6;
    const fr = new Float32Array((NF + 1) * N * 2), tp = new Float32Array((NF + 1) * 3), ke = new Float32Array(NF + 1), im = new Float32Array(NF + 1);
    const save = k => { const o = k * N * 2; for (let p = 0; p < N; p++) { fr[o + p * 2] = X[p]; fr[o + p * 2 + 1] = Y[p]; } tp[k * 3] = tk.x; tp[k * 3 + 1] = tk.y; tp[k * 3 + 2] = tk.a; };
    save(0);
    for (let k = 1; k <= NF; k++) {
      let ii = 0;
      for (let s = 0; s < sub; s++) { step((k - 1) / FPS + s * dts, false); ii += imp; }
      save(k); im[k] = ii;
      let e = 0; for (let p = 0; p < N; p++) e += VX[p] * VX[p] + VY[p] * VY[p];
      ke[k] = e;
    }
    const kmax = Math.max(...ke) || 1; for (let k = 0; k <= NF; k++) ke[k] /= kmax;
    // splash = first big impulse exchange; slosh events = later local peaks
    let splash = 2; for (let k = 1; k <= NF; k++) if (im[k] > 40) { splash = k / FPS; break; }
    const ev = []; let last = -20;
    for (let k = 2; k < NF; k++) if (k / FPS > splash + 0.4 && im[k] > 60 && im[k] >= im[k - 1] && im[k] >= im[k + 1] && k - last > 8) { ev.push([k / FPS, im[k]]); last = k; }
    // a probe particle mid-water for the neighbourhood diagram
    let probe = 0, bd = 1e9; for (let p = 0; p < N; p++) { const d = Math.hypot(fr[p * 2] - 820, fr[p * 2 + 1] - (FL - 110)); if (d < bd) { bd = d; probe = p; } }
    FLUID = { fr, tp, ke, im, splash, ev, probe, surf, M: tk.M };
    return FLUID;
  }
  const fdKE = u => { const S = fluidSim(), f = clamp(u * NF, 0, NF), k = Math.min(NF - 1, Math.floor(f)); return lerp(S.ke[k], S.ke[k + 1], f - k); };
  const FD_PH = [[0, 'REST'], [0.94, 'DROP'], [1.5, 'SPLASH'], [2.4, 'BUOYANCY'], [4.9, 'PUSH'], [7.6, 'SETTLE']];
  const FD_BOX = { x0: 560, y0: 150, w: 800, h: 660 }, FD_RS = 1;   // liquid render region (full-res px)

  MG.film({
    id: 'techfluid', dur: 10, poster: 1.9,
    fonts,
    meta: {
      family: 'K', name: 'Fluid', sub: 'Particles that push their neighbours apart', era: '1977 —',
      origin: 'Smoothed-particle hydrodynamics was devised in 1977 by Robert Gingold and Joe Monaghan, and independently by Leon Lucy, to simulate stars. Matthias Müller, David Charypar and Markus Gross brought it to interactive graphics in Particle-Based Fluid Simulation for Interactive Applications (2003), and Simon Clavet, Philippe Beaudoin and Pierre Poulin’s double-density relaxation (2005) made splashy, stable particle liquids cheap; grid solvers in the line of Jos Stam’s Stable Fluids (1999) and FLIP hybrids carry the film work.',
      works: 'Antz (DreamWorks / PDI, 1998; water simulation) · Ratatouille (Pixar, 2007) · Moana (Walt Disney Animation Studios, 2016)',
      tech: ['SPH density from neighbours within h', 'Double-density relaxation (pressure + near-pressure)', 'Two-way rigid-body coupling'],
      accent: '#ff5a1f',
      motionDNA: 'Still water first, shown as bare particles; the Token drops on the beat and the surface tears into a crown splash that rains back, the body sinks, slows, rises on its own buoyancy and bobs to a float. A spring then drags it through the water and back, piling a bow wave against the glass, and the sloshing decays to a level surface.',
      visualDNA: 'The Technique Atlas stage with a glass tank on the floor; the liquid drawn as blue metaballs over the half-submerged orange Token, droplets as dots; mono labels for the method, parameters and phase; a neighbourhood diagram with the smoothing radius h; velocity arrows in the action; a debug inset with every particle coloured by speed.',
      transitions: 'Particles → liquid surface; still, splash, float, push, settle; the energy curve rises and decays',
      implementation: ['SPH with double-density relaxation precomputed in setup (4 substeps)', 'Uniform-grid neighbour search, XSPH-style viscosity', 'Canvas 2D: half-res metaball threshold of additive particle sprites'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      fluidSim();
      const N = FD.n, B = FD_BOX, R = 24 * FD_RS, lo = offscreen(B.w * FD_RS, B.h * FD_RS), spr = offscreen(R * 2, R * 2), g = spr.getContext('2d');
      const gr = g.createRadialGradient(R, R, 0, R, R, R);
      gr.addColorStop(0, 'rgba(255,255,255,0.3)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, R * 2, R * 2);
      return { lo, lx: lo.getContext('2d', { willReadFrequently: true }), spr, px: new Float32Array(N), py: new Float32Array(N), vx: new Float32Array(N), vy: new Float32Array(N) };
    },
    draw(c, t, W, H, st) {
      const S = fluidSim(), N = FD.n, f = clamp(t * FPS, 0, NF), k = Math.min(NF - 1, Math.floor(f)), u = f - k, A = S.fr, o0 = k * N * 2, o1 = (k + 1) * N * 2;
      const px = st.px, py = st.py, vx = st.vx, vy = st.vy;
      for (let p = 0; p < N; p++) {
        const x0 = A[o0 + p * 2], y0 = A[o0 + p * 2 + 1], x1 = A[o1 + p * 2], y1 = A[o1 + p * 2 + 1];
        px[p] = lerp(x0, x1, u); py[p] = lerp(y0, y1, u); vx[p] = (x1 - x0) * FPS; vy[p] = (y1 - y0) * FPS;
      }
      const T = S.tp, tx = lerp(T[k * 3], T[k * 3 + 3], u), ty = lerp(T[k * 3 + 1], T[k * 3 + 4], u), ta = lerp(T[k * 3 + 2], T[k * 3 + 5], u);
      TK.stage(c, W, H, { floor: FL });
      // tank: back pane
      c.fillStyle = 'rgba(255,255,255,0.32)'; c.fillRect(FD.L - 8, FD.top, FD.R - FD.L + 16, FL - FD.top);
      // the liquid, then the Token (a 2D cross-section: it displaces the water around it)
      TK.shadow(c, tx, FL, FD.S, Math.max(0, FL - ty - FD.S / 2));
      const dm = 1 - E.ioS(seg(t, 0.75, 1.25)), lq = 1 - dm;
      if (lq > 0.01) {
        const B = FD_BOX, lx = st.lx, rs = FD_RS, w = B.w * rs, h = B.h * rs, R = 24 * rs;
        lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, w, h);
        lx.globalCompositeOperation = 'lighter';
        for (let p = 0; p < N; p++) lx.drawImage(st.spr, (px[p] - B.x0) * rs - R, (py[p] - B.y0) * rs - R);
        const im = lx.getImageData(0, 0, w, h), d = im.data;
        for (let i = 0; i < d.length; i += 4) {
          const a = d[i + 3] / 255;
          if (a < 0.2) { d[i + 3] = 0; continue; }
          const v = clamp((a - 0.2) / 0.03), deep = clamp((a - 0.3) / 0.5);
          d[i] = lerp(120, 38, deep); d[i + 1] = lerp(152, 78, deep); d[i + 2] = 255; d[i + 3] = 205 * v;
        }
        lx.putImageData(im, 0, 0);
        c.save(); c.globalAlpha = lq; c.drawImage(st.lo, B.x0, B.y0, B.w, B.h);
        // fast droplets as dots
        c.fillStyle = 'rgba(47,91,255,0.85)';
        for (let p = 0; p < N; p++) if (vx[p] * vx[p] + vy[p] * vy[p] > 300 * 300) { c.beginPath(); c.arc(px[p], py[p], 4.5, 0, TAU); c.fill(); }
        c.restore();
      }
      if (dm > 0.01) {
        c.save(); c.globalAlpha = dm; c.fillStyle = P.blue;
        for (let p = 0; p < N; p++) { c.beginPath(); c.arc(px[p], py[p], 4.2, 0, TAU); c.fill(); }
        c.restore();
      }
      TK.token(c, tx, ty, FD.S, { rot: ta });
      // tank walls
      c.strokeStyle = 'rgba(23,24,28,0.6)'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(FD.L - 6, FD.top); c.lineTo(FD.L - 6, FL); c.moveTo(FD.R + 6, FD.top); c.lineTo(FD.R + 6, FL); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(FD.L + 4, FD.top + 20); c.lineTo(FD.L + 4, FL - 30); c.stroke();
      // neighbourhood probe (while the particles are bare)
      const pa = win(t, 0.15, 1.05, 0.25);
      if (pa > 0.01) {
        const q = S.probe, x = px[q], y = py[q];
        c.save(); c.globalAlpha = pa;
        c.strokeStyle = P.ink; c.lineWidth = 1.2;
        let nn = 0;
        c.beginPath();
        for (let p = 0; p < N; p++) { if (p === q) continue; const d = Math.hypot(px[p] - x, py[p] - y); if (d < FD.h) { c.moveTo(x, y); c.lineTo(px[p], py[p]); nn++; } }
        c.stroke();
        c.setLineDash([5, 5]); c.lineWidth = 2; c.beginPath(); c.arc(x, y, FD.h, 0, TAU); c.stroke(); c.setLineDash([]);
        c.fillStyle = P.accent; c.beginPath(); c.arc(x, y, 6, 0, TAU); c.fill();
        c.strokeStyle = P.ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + FD.h * 0.7, y - FD.h * 0.7); c.lineTo(x + 70, y - 100); c.lineTo(x + 90, y - 100); c.stroke();
        label(c, `h = ${FD.h} px  ·  ${nn} NEIGHBOURS`, x + 98, y - 112, { color: P.ink, weight: 700, size: 16, ls: 2 });
        label(c, 'ρ = Σ (1 − r/h)²  →  PRESSURE  →  PUSH APART', x + 98, y - 88, { size: 14, ls: 2 });
        c.restore();
      }
      // velocity arrows in the action
      const va = Math.max(win(t, 1.55, 3.0, 0.25), win(t, 5.0, 7.3, 0.3));
      if (va > 0.01) {
        c.save(); c.globalAlpha = va * 0.75; c.strokeStyle = P.ink; c.lineWidth = 1.6;
        for (let p = 0; p < N; p += 9) {
          const sp = Math.hypot(vx[p], vy[p]); if (sp < 60) continue;
          const L = Math.min(70, sp * 0.06);
          arrow(c, px[p], py[p], px[p] + vx[p] / sp * L, py[p] + vy[p] / sp * L, 3);
        }
        c.restore();
      }
      // drag spring during the push
      const pw = seg(t, 4.8, 5.0) * (1 - seg(t, 7.5, 8.0));
      if (pw > 0.01) {
        const gx = 960 + 175 * FD_PUSH(t), ax = tx, ay = ty - 20, bx = gx, by = FD.top - 40, ln = Math.hypot(bx - ax, by - ay) || 1, nx = -(by - ay) / ln, ny = (bx - ax) / ln;
        c.save(); c.globalAlpha = pw;
        c.strokeStyle = P.ink; c.lineWidth = 2; c.setLineDash([6, 6]);
        c.beginPath(); c.moveTo(gx, FD.top - 40); c.lineTo(gx, FL); c.stroke(); c.setLineDash([]);
        c.beginPath();
        for (let i = 0; i <= 30; i++) { const s = i / 30, z = (i % 2 ? -9 : 9) * (i > 3 && i < 27), x = lerp(ax, bx, s) + nx * z, y = lerp(ay, by, s) + ny * z; i ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.stroke();
        c.fillStyle = P.ink; c.beginPath(); c.arc(gx, FD.top - 40, 7, 0, TAU); c.fill();
        label(c, 'SPRING TARGET', gx, FD.top - 58, { align: 'center', size: 14, color: P.ink, weight: 700, ls: 2 });
        c.restore();
      }
      // debug inset: every particle coloured by speed
      const ix = 1444, iy = 104, sc = 0.5, B = FD_BOX;
      c.fillStyle = 'rgba(248,246,240,0.95)'; c.fillRect(ix, iy, B.w * sc, (FL + 10 - 290) * sc);
      c.strokeStyle = 'rgba(23,24,28,0.25)'; c.lineWidth = 1; c.strokeRect(ix + 0.5, iy + 0.5, B.w * sc, (FL + 10 - 290) * sc);
      c.save(); c.beginPath(); c.rect(ix, iy, B.w * sc, (FL + 10 - 290) * sc); c.clip();
      const IX = x => ix + (x - B.x0) * sc, IY = y => iy + (y - 290) * sc;
      for (let b = 0; b < 8; b++) {
        c.fillStyle = RAMP[b];
        for (let p = 0; p < N; p++) {
          const sp = Math.hypot(vx[p], vy[p]), bin = Math.min(7, Math.floor(sp / 90));
          if (bin === b) c.fillRect(IX(px[p]) - 1.5, IY(py[p]) - 1.5, 3, 3);
        }
      }
      c.translate(IX(tx), IY(ty)); c.rotate(ta); TK.tokenPath(c, FD.S * sc); c.strokeStyle = P.ink; c.lineWidth = 1.5; c.stroke();
      c.restore();
      c.strokeStyle = 'rgba(23,24,28,0.5)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(IX(FD.L), IY(FD.top)); c.lineTo(IX(FD.L), IY(FL)); c.lineTo(IX(FD.R), IY(FL)); c.lineTo(IX(FD.R), IY(FD.top)); c.stroke();
      label(c, 'DEBUG VIEW  ·  SPEED |v| PER PARTICLE', ix, iy - 14, { size: 14, ls: 2, color: P.ink, weight: 700 });
      const by = iy + (FL + 10 - 290) * sc + 18;
      RAMP.forEach((col, b) => { c.fillStyle = col; c.fillRect(ix + b * 30, by, 30, 8); });
      label(c, '0', ix, by + 28, { size: 13, ls: 1 });
      label(c, '630+ px/s', ix + 240, by + 28, { size: 13, ls: 1, align: 'right' });
      // left column: method, parameters, phase
      tag(c, 'SPH  ·  PARTICLE FLUID', 72, 112, seg(t, 0.1, 0.4));
      const pl = seg(t, 0.2, 0.6);
      if (pl > 0) {
        c.save(); c.globalAlpha = pl;
        [['PARTICLES', `${N.toLocaleString('en-US')}`], ['SMOOTHING h', `${FD.h} px`], ['SUBSTEPS', `${FD.sub} / FRAME`], ['TOKEN', `2-WAY · ρ ${FD.ratio}`]].forEach(([a, b], i) => {
          label(c, a, 98, 160 + i * 30, { size: 15, ls: 2 }); label(c, b, 330, 160 + i * 30, { size: 15, ls: 2, color: P.ink, weight: 700 });
        });
        let ph = 0; FD_PH.forEach(([t0], i) => { if (t >= t0) ph = i; });
        FD_PH.forEach(([t0, nm], i) => {
          const y = 340 + i * 34, on = i === ph;
          if (on) { c.fillStyle = P.accent; c.fillRect(98, y - 16, 4, 20); }
          label(c, `0${i + 1}  ${nm}`, 114, y, { size: 16, ls: 2, color: on ? P.ink : P.mute, weight: on ? 700 : 400 });
          label(c, `${t0.toFixed(1)} s`, 330, y, { size: 14, ls: 1, color: on ? P.ink : P.mute });
        });
        c.restore();
      }
      const wa = E.outC(seg(t, 8.0, 8.7));
      if (wa > 0) TK.word(c, 960, 236 + 20 * (1 - wa), { size: 110, alpha: wa, ls: 6 });
      TK.caption(c, t, W, H, { name: 'Fluid', cat: 'Simulation', curve: fdKE, span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'FLUID KINETIC ENERGY' });
    },
    score(A) {
      TK.bed(A);
      const S = fluidSim(), ts = S.splash, r = rng(77);
      A.osc(FD.rel, { type: 'sine', f: 1400, f2: 700, dur: 0.4, g: 0.04, rev: 0.3 });   // release
      // the splash: a plop, a wash of spray, then droplets raining back
      A.osc(ts, { f: 520, f2: 140, glide: 0.18, dur: 0.3, g: 0.22, a: 0.003 });
      A.noise(ts, { type: 'lowpass', f: 2600, f2: 500, dur: 0.7, g: 0.2, rev: 0.4 });
      A.noise(ts + 0.02, { type: 'bandpass', f: 3500, q: 0.8, dur: 0.9, g: 0.09, swell: 0.15, rev: 0.4 });
      for (let i = 0; i < 26; i++) {
        const t = ts + 0.25 + Math.pow(r(), 1.4) * 1.3, f = 700 + 1300 * r();
        A.osc(t, { f, f2: f * 1.7, glide: 0.05, dur: 0.07, g: 0.035 + 0.03 * r(), pan: (r() - 0.5) * 1.2 });
      }
      // bubbles rising as the Token sinks
      for (let i = 0; i < 10; i++) { const t = ts + 0.3 + i * 0.09 + 0.05 * r(), f = 300 + 80 * i; A.osc(t, { f, f2: f * 2.2, glide: 0.06, dur: 0.09, g: 0.04, rev: 0.3 }); }
      // the push through the water and back
      A.noise(4.95, { type: 'lowpass', f: 300, f2: 1100, dur: 1.0, g: 0.13, swell: 0.5, rev: 0.3, pan: 0.3 });
      A.noise(6.4, { type: 'lowpass', f: 300, f2: 1000, dur: 1.0, g: 0.12, swell: 0.5, rev: 0.3, pan: -0.2 });
      S.ev.forEach(([t, v]) => { const g = clamp(v / 300, 0.2, 1); A.noise(t, { type: 'bandpass', f: 600 + 400 * g, q: 0.9, dur: 0.3, g: 0.07 * g, rev: 0.4, pan: 0.2 * Math.sin(t * 3) }); });
      A.chord(8.0, [60, 64, 67, 72], { type: 'sine', dur: 2.0, g: 0.035, a: 0.1, rev: 0.6, width: 0.6 });
      A.bell(8.0, midi(84), { g: 0.05, dur: 1.6 });
    },
  });

  /* =====================================================================
     SOFT BODY — the Token embedded in a 9 × 9 lattice of point masses
     joined by structural, shear and bend springs, plus area springs that
     keep every lattice triangle from inverting; its picture rides on the
     lattice cells as texture. Two bodies, identical but for spring
     stiffness k, are dropped on the beat, then pressed by plates driven
     with the same force, released so their stored energy throws them up,
     and left to recover the rest shape. Springs are drawn coloured by
     strain (blue compressed, orange stretched).
     ===================================================================== */
  const SB = { n: 9, S: 230, sub: 24, g: 2400, drop: 0.5, bot0: FL - 300, kc: 60000, F: 1800000, Mp: 60, ka: 3, park: FL - 242, press: [2.6, 5.0],
    B: [{ x: 600, k: 5000, c: 25, name: 'SOFT' }, { x: 1320, k: 30000, c: 50, name: 'FIRM' }] };
  const SB_SP = SB.S / (SB.n - 1);
  let SOFT = null;
  function softSim() {
    if (SOFT) return SOFT;
    const n = SB.n, NN = n * n, sub = SB.sub, dt = 1 / (FPS * sub);
    const out = SB.B.map(b => {
      const X = new Float64Array(NN), Y = new Float64Array(NN), VX = new Float64Array(NN), VY = new Float64Array(NN), RX = new Float64Array(NN), RY = new Float64Array(NN);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const p = j * n + i; RX[p] = (i - (n - 1) / 2) * SB_SP; RY[p] = (j - (n - 1)) * SB_SP; }
      const sp = [];
      const add = (a, b2, kk, kind) => sp.push([a, b2, Math.hypot(RX[b2] - RX[a], RY[b2] - RY[a]), kk, kind]);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const p = j * n + i;
        if (i < n - 1) add(p, p + 1, 1, 0);
        if (j < n - 1) add(p, p + n, 1, 0);
        if (i < n - 1 && j < n - 1) { add(p, p + n + 1, 0.7, 1); add(p + 1, p + n, 0.7, 1); }
        if (i < n - 2) add(p, p + 2, 0.3, 2);
        if (j < n - 2) add(p, p + 2 * n, 0.3, 2);
      }
      const tris = [], ka = SB.ka * b.k / (SB_SP * SB_SP);
      const triA = (a, b2, c3) => 0.5 * ((RX[b2] - RX[a]) * (RY[c3] - RY[a]) - (RX[c3] - RX[a]) * (RY[b2] - RY[a]));
      for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
        const a = j * n + i, b2 = a + 1, c3 = a + n, d = c3 + 1;
        [[a, b2, d], [a, d, c3], [a, b2, c3], [b2, d, c3]].forEach(([p, q, r2]) => tris.push([p, q, r2, triA(p, q, r2)]));
      }
      const place = () => { for (let p = 0; p < NN; p++) { X[p] = b.x + RX[p]; Y[p] = SB.bot0 + RY[p]; VX[p] = VY[p] = 0; } };
      place();
      const pl = { y: -80, v: 0, rel: 0 };
      const fr = new Float32Array((NF + 1) * NN * 2), py = new Float32Array(NF + 1), ht = new Float32Array(NF + 1), lands = [];
      let wasAir = true;
      const save = k => {
        const o = k * NN * 2; for (let p = 0; p < NN; p++) { fr[o + p * 2] = X[p]; fr[o + p * 2 + 1] = Y[p]; } py[k] = pl.y;
        let top = 0, bot = 0; for (let i = 0; i < n; i++) { top += Y[i]; bot += Y[(n - 1) * n + i]; } ht[k] = (bot - top) / n / SB.S;
      };
      function step(t) {
        if (t < SB.drop) { place(); }
        else {
          const FX = new Float64Array(NN), FY = new Float64Array(NN).fill(SB.g);
          for (const [a, b2, L, kk, kind] of sp) {
            const dx = X[b2] - X[a], dy = Y[b2] - Y[a], d = Math.hypot(dx, dy) || 1e-6, ux = dx / d, uy = dy / d;
            const rv = (VX[b2] - VX[a]) * ux + (VY[b2] - VY[a]) * uy, f = b.k * kk * (d - L) + b.c * (kind === 2 ? 0.5 : 1) * rv;
            FX[a] += f * ux; FY[a] += f * uy; FX[b2] -= f * ux; FY[b2] -= f * uy;
          }
          // area springs: each lattice triangle pushes back toward its rest area, so cells cannot invert
          for (const [a, b2, c3, A0] of tris) {
            const A = 0.5 * ((X[b2] - X[a]) * (Y[c3] - Y[a]) - (X[c3] - X[a]) * (Y[b2] - Y[a])), m = ka * (A0 - A);
            FX[a] += m * 0.5 * (Y[b2] - Y[c3]); FY[a] += m * 0.5 * (X[c3] - X[b2]);
            FX[b2] += m * 0.5 * (Y[c3] - Y[a]); FY[b2] += m * 0.5 * (X[a] - X[c3]);
            FX[c3] += m * 0.5 * (Y[a] - Y[b2]); FY[c3] += m * 0.5 * (X[b2] - X[a]);
          }
          // the press plate: parked above, then driven down by a force, then lifted away
          let pf = 0;
          if (t >= SB.press[0] && t < SB.press[1]) {
            for (let p = 0; p < NN; p++) {
              const pen = pl.y - Y[p];
              if (pen > 0) { const f = Math.max(0, SB.kc * pen + 300 * (pl.v - VY[p])); FY[p] += f; pf += f; VX[p] *= 0.995; }
            }
          }
          for (let p = 0; p < NN; p++) {
            VX[p] += FX[p] * dt; VY[p] += FY[p] * dt; VX[p] *= 0.9997; VY[p] *= 0.9997;
            X[p] += VX[p] * dt; Y[p] += VY[p] * dt;
            if (Y[p] > FL) { Y[p] = FL; if (VY[p] > 0) VY[p] = 0; VX[p] *= 0.96; VY[p] *= 0.9; }
          }
          if (t >= SB.press[0] && t < SB.press[1]) {
            const F = SB.F * E.ioS(seg(t, SB.press[0], SB.press[0] + 1.0));
            pl.v += (F - pf) / SB.Mp * dt; pl.v *= 0.997; pl.y += pl.v * dt; pl.rel = pl.y;
          } else if (t >= SB.press[1]) pl.y = lerp(pl.rel, -80, E.inQ(seg(t, SB.press[1], SB.press[1] + 0.3)));
          else pl.y = lerp(-80, SB.park, E.outC(seg(t, 2.0, 2.5)));
        }
      }
      save(0);
      for (let k = 1; k <= NF; k++) {
        for (let s = 0; s < sub; s++) step((k - 1) / FPS + s * dt);
        save(k);
        let yb = 0; for (let i = 0; i < n; i++) yb += Y[(n - 1) * n + i]; yb /= n;
        const air = yb < FL - 3;
        if (wasAir && !air && k > 2) { const o1 = (k - 1) * NN * 2, o0 = k * NN * 2; let v = 0; for (let i = 0; i < n; i++) { const p = (n - 1) * n + i; v += (fr[o0 + p * 2 + 1] - fr[o1 + p * 2 + 1]) * FPS; } lands.push([k / FPS, Math.max(0, v / n)]); }
        wasAir = air;
      }
      return { fr, py, ht, sp, lands };
    });
    SOFT = out;
    return SOFT;
  }
  const sbHt = u => { const S = softSim()[0], f = clamp(u * NF, 0, NF), k = Math.min(NF - 1, Math.floor(f)); return lerp(S.ht[k], S.ht[k + 1], f - k); };

  function sbTri(c, img, x0, y0, x1, y1, x2, y2, u0, v0, u1, v1, u2, v2) {
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
    c.restore();
  }
  const SB_PH = [[0, 'HELD AT REST'], [0.5, 'DROP · GRAVITY'], [2.0, 'PRESS · SAME FORCE F'], [5.0, 'RELEASE · STORED ENERGY'], [7.0, 'RECOVER REST SHAPE']];

  MG.film({
    id: 'techsoftbody', dur: 10, poster: 4.2,
    fonts,
    meta: {
      family: 'K', name: 'Soft Body', sub: 'A lattice of masses and springs', era: '1987 —',
      origin: 'Soft bodies are simulated as point masses joined by damped springs (or by constraints and pressure) and the picture is carried along by the deforming lattice. Demetri Terzopoulos, John Platt, Alan Barr and Kurt Fleischer’s Elastically Deformable Models (SIGGRAPH 1987) introduced physically based deformation to graphics, Gavin Miller animated snakes and worms with mass-spring segments the following year, and Matthias Müller and colleagues’ shape matching (2005) and position-based dynamics (2006) made stable, art-directable jelly routine in games and tools.',
      works: 'The Motion of Snakes and Worms (Gavin Miller, SIGGRAPH 1988) · LocoRoco (Sony, 2006) · World of Goo (2D Boy, 2008)',
      tech: ['Mass-spring lattice: structural, shear, bend', 'Per-triangle area springs against collapse', 'Texture embedded in the lattice cells'],
      accent: '#ff5a1f',
      motionDNA: 'Two identical Tokens differ only in spring stiffness. Dropped on the beat, the soft one splats and wobbles for a second while the firm one gives a short shiver; plates press both with the same force — the soft one squashes to under two-thirds of its height and bulges, the firm one gives a few per cent — then lift away so the stored energy throws them up, and both ring down to their rest shape.',
      visualDNA: 'The Technique Atlas stage and floor; two orange Tokens carried on lattices of ink dots, springs tinted blue where compressed and orange where stretched; dashed rest-shape ghosts, height callouts h / h₀, two ink press plates on rods with force arrows, mono stiffness labels under each body.',
      transitions: 'Held, dropped, pressed, released, recovered — the soft body’s height graph traces the story',
      implementation: ['Mass-spring lattice with area springs precomputed in setup (24 substeps, semi-implicit Euler)', 'Penalty contact for the force-driven plates, projected floor with friction', 'Canvas 2D: affine texture-mapped lattice triangles, strain-coloured spring overlay'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      softSim();
      const tex = offscreen(SB.S, SB.S), g = tex.getContext('2d');
      g.translate(SB.S / 2, SB.S / 2); TK.tokenPath(g, SB.S - 2); g.fillStyle = P.accent; g.fill('evenodd');
      return { tex };
    },
    draw(c, t, W, H, st) {
      const SS = softSim(), n = SB.n, NN = n * n, f = clamp(t * FPS, 0, NF), k = Math.min(NF - 1, Math.floor(f)), u = f - k;
      TK.stage(c, W, H, { floor: FL });
      const ov = Math.max(0.3, win(t, 0, 0.75, 0.3), win(t, 1.3, 5.9, 0.3), win(t, 8.6, 10.3, 0.4));
      SS.forEach((S, bi) => {
        const b = SB.B[bi], o0 = k * NN * 2, o1 = (k + 1) * NN * 2, X = new Float32Array(NN), Y = new Float32Array(NN);
        for (let p = 0; p < NN; p++) { X[p] = lerp(S.fr[o0 + p * 2], S.fr[o1 + p * 2], u); Y[p] = lerp(S.fr[o0 + p * 2 + 1], S.fr[o1 + p * 2 + 1], u); }
        let top = 0, bot = 0, cx = 0, mnY = 1e9, mxY = -1e9;
        for (let i = 0; i < n; i++) { top += Y[i]; bot += Y[(n - 1) * n + i]; }
        for (let p = 0; p < NN; p++) { cx += X[p]; mnY = Math.min(mnY, Y[p]); mxY = Math.max(mxY, Y[p]); }
        top /= n; bot /= n; cx /= NN;
        TK.shadow(c, cx, FL, SB.S * (1 + 0.6 * clamp(1 - (bot - top) / SB.S)), Math.max(0, FL - mxY));
        // dashed rest-shape ghost on the floor
        const ga = seg(t, 1.2, 1.6) * 0.8;
        if (ga > 0) {
          c.save(); c.globalAlpha = ga; c.translate(cx, FL - SB.S / 2); TK.tokenPath(c, SB.S);
          c.setLineDash([7, 7]); c.strokeStyle = 'rgba(23,24,28,0.45)'; c.lineWidth = 2; c.stroke(); c.restore();
        }
        // the Token, carried on the lattice
        for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
          const a = j * n + i, b2 = a + 1, cc = a + n, d = cc + 1, u0 = i * SB_SP, v0 = j * SB_SP, u1 = u0 + SB_SP, v1 = v0 + SB_SP;
          sbTri(c, st.tex, X[a], Y[a], X[b2], Y[b2], X[d], Y[d], u0, v0, u1, v0, u1, v1);
          sbTri(c, st.tex, X[a], Y[a], X[d], Y[d], X[cc], Y[cc], u0, v0, u1, v1, u0, v1);
        }
        // spring overlay, coloured by strain
        c.save(); c.globalAlpha = ov;
        for (const [a, b2, L, , kind] of S.sp) {
          if (kind === 2) continue;
          const e = (Math.hypot(X[b2] - X[a], Y[b2] - Y[a]) - L) / L, m = clamp(Math.abs(e) * 5);
          c.strokeStyle = e < 0 ? `rgba(47,91,255,${0.25 + 0.75 * m})` : `rgba(198,62,12,${0.25 + 0.75 * m})`;
          c.lineWidth = kind ? 1 : 1.5 + 2 * m;
          c.beginPath(); c.moveTo(X[a], Y[a]); c.lineTo(X[b2], Y[b2]); c.stroke();
        }
        c.fillStyle = P.ink;
        for (let p = 0; p < NN; p++) { c.beginPath(); c.arc(X[p], Y[p], 3.2, 0, TAU); c.fill(); }
        c.restore();
        // press plate
        const py = lerp(S.py[k], S.py[k + 1], u);
        if (py > -70) {
          c.fillStyle = P.ink; c.fillRect(b.x - 7, 0, 14, py - 24);
          c.fillRect(b.x - 170, py - 26, 340, 26);
          const fa = win(t, 2.6, 5.0, 0.2);
          if (fa > 0.01) {
            c.save(); c.globalAlpha = fa; c.strokeStyle = P.accent; c.lineWidth = 4; c.lineCap = 'round';
            arrow(c, b.x + 120, py - 110, b.x + 120, py - 40, 7);
            label(c, 'F', b.x + 140, py - 72, { color: P.accentD, weight: 700, size: 24, ls: 0 });
            c.restore();
          }
        }
        // height callout
        const ha = seg(t, 1.1, 1.5);
        if (ha > 0) {
          const lx = b.x + SB.S / 2 + 90, r = (bot - top) / SB.S;
          c.save(); c.globalAlpha = ha; c.strokeStyle = P.ink; c.lineWidth = 1.5;
          c.beginPath(); c.moveTo(lx, top); c.lineTo(lx, bot); c.moveTo(lx - 8, top); c.lineTo(lx + 8, top); c.moveTo(lx - 8, bot); c.lineTo(lx + 8, bot); c.stroke();
          c.setLineDash([3, 5]); c.strokeStyle = 'rgba(23,24,28,0.3)'; c.beginPath(); c.moveTo(lx - 40, FL - SB.S); c.lineTo(lx + 14, FL - SB.S); c.stroke(); c.setLineDash([]);
          label(c, 'h / h0', lx + 16, (top + bot) / 2 - 6, { size: 14, ls: 1 });
          label(c, r.toFixed(2), lx + 16, (top + bot) / 2 + 18, { size: 22, ls: 1, color: P.ink, weight: 700 });
          c.restore();
        }
        // stiffness label under the floor
        label(c, b.name, b.x, FL + 52, { align: 'center', size: 20, color: P.ink, weight: 700 });
        label(c, `k = ${b.k.toLocaleString('en-US')}  ·  c = ${b.c}`, b.x, FL + 82, { align: 'center', size: 16, ls: 2 });
      });
      tag(c, `MASS-SPRING  ·  ${NN} MASSES  ·  ${SS[0].sp.length} SPRINGS`, 72, 96, seg(t, 0.1, 0.4));
      let ph = 0; SB_PH.forEach(([t0], i) => { if (t >= t0) ph = i; });
      label(c, `0${ph + 1}  ${SB_PH[ph][1]}`, 98, 128, { size: 16, ls: 2, color: P.ink });
      // strain legend
      const lgx = 1530, lgy = 96;
      c.lineWidth = 4; c.strokeStyle = P.blue; c.beginPath(); c.moveTo(lgx, lgy - 6); c.lineTo(lgx + 40, lgy - 6); c.stroke();
      label(c, 'COMPRESSED', lgx + 54, lgy, { size: 14, ls: 2 });
      c.strokeStyle = P.accentD; c.beginPath(); c.moveTo(lgx, lgy + 22); c.lineTo(lgx + 40, lgy + 22); c.stroke();
      label(c, 'STRETCHED', lgx + 54, lgy + 28, { size: 14, ls: 2 });
      const wa = E.outC(seg(t, 8.0, 8.7));
      if (wa > 0) TK.word(c, 960, 300 + 20 * (1 - wa), { size: 110, alpha: wa, ls: 6 });
      TK.caption(c, t, W, H, { name: 'Soft Body', cat: 'Simulation', curve: sbHt, span: [0, 10], lo: -0.1, hi: 1.3, curveLabel: 'SOFT  ·  HEIGHT h / h0' });
    },
    score(A) {
      TK.bed(A);
      const SS = softSim();
      SS.forEach((S, bi) => S.lands.filter(([t]) => t < SB.press[0] || t > SB.press[1] + 0.2).forEach(([t, v]) => {
        const g = clamp(v / 900, 0.15, 1), pan = bi ? 0.45 : -0.45;
        if (bi === 0) {   // soft: a low, wobbling boing
          A.osc(t, { f: 210, f2: 95, glide: 0.25, dur: 0.75, g: 0.2 * g, vib: [7, 18], pan, rev: 0.2 });
          A.noise(t, { type: 'lowpass', f: 500, dur: 0.12, g: 0.1 * g, pan });
        } else {          // firm: a short, bright knock
          A.osc(t, { type: 'triangle', f: 520, f2: 360, glide: 0.05, dur: 0.22, g: 0.14 * g, pan });
          A.noise(t, { type: 'bandpass', f: 2200, q: 2, dur: 0.04, g: 0.08 * g, pan });
        }
      }));
      // the press: plates come in, a straining low tone while they bear down
      A.whoosh(2.0, 0.5, { f1: 500, f2: 200, g: 0.08, swell: 0.7 });
      A.osc(2.7, { type: 'sawtooth', f: 55, f2: 62, glide: 2.2, dur: 2.3, g: 0.06, lp: 260, a: 0.3, hold: true, rel: 0.1 });
      A.noise(2.7, { type: 'bandpass', f: 220, q: 4, dur: 2.3, g: 0.04, swell: 0.6 });
      // release: the plates lift, the bodies spring up
      A.whoosh(5.0, 0.4, { f1: 300, f2: 2400, g: 0.1, swell: 0.3 });
      A.osc(5.02, { f: 180, f2: 520, glide: 0.18, dur: 0.3, g: 0.12, vib: [9, 14], pan: -0.4 });
      A.chord(8.0, [60, 67, 72, 76], { type: 'sine', dur: 2.0, g: 0.035, a: 0.08, rev: 0.6, width: 0.6 });
    },
  });

  /* =====================================================================
     NOISE — coherent noise as a motion driver. First white random jitter:
     a fresh random value every frame, so the Token strobes and its trail
     is a scribble. Then 1D Perlin gradient noise drives x, y, rotation and
     scale: one smooth octave, and on each bar one more at double the
     frequency and half the amplitude (fractal Brownian motion), each
     octave plotted on its own. Finally one 2D noise field drives a grid
     of Tokens, each sampling it at its own offset — neighbours move
     alike, and three tracked Tokens play the same curve, shifted.
     ===================================================================== */
  const NZ = (() => {
    const r = rng(9091), perm = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
    const p = new Uint16Array(512); for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
    const g1 = new Float64Array(256); for (let i = 0; i < 256; i++) g1[i] = (r() < 0.5 ? -1 : 1) * (0.5 + 0.5 * r());
    return { p, g1 };
  })();
  const NG2 = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071]];
  const fade = x => x * x * x * (x * (x * 6 - 15) + 10);
  function perlin1(x) {
    const i = Math.floor(x), f = x - i, a = NZ.g1[NZ.p[i & 255]] * f, b = NZ.g1[NZ.p[(i + 1) & 255]] * (f - 1);
    return 2.8 * lerp(a, b, fade(f));
  }
  function perlin2(x, y) {
    const X = Math.floor(x), Y = Math.floor(y), fx = x - X, fy = y - Y, u = fade(fx), v = fade(fy);
    const gd = (ix, iy, dx, dy) => { const g = NG2[NZ.p[(NZ.p[ix & 255] + iy) & 255] & 7]; return g[0] * dx + g[1] * dy; };
    return 1.5 * lerp(lerp(gd(X, Y, fx, fy), gd(X + 1, Y, fx - 1, fy), u), lerp(gd(X, Y + 1, fx, fy - 1), gd(X + 1, Y + 1, fx - 1, fy - 1), u), v);
  }
  // octaves: entry time, frequency (Hz), amplitude
  const NO = [[2.0, 0.5, 1], [3.0, 1, 0.5], [4.0, 2, 0.25], [5.0, 4, 0.125]];
  const octW = (k, s) => (k === 0 ? (s >= 2 ? 1 : 0) : E.outC(seg(s, NO[k][0], NO[k][0] + 0.3)));
  const comp = (k, s, ch) => NO[k][2] * perlin1(s * NO[k][1] + 17.3 * k + 41.7 * ch + 3.1);
  const fbm = (s, ch) => { let v = 0; for (let k = 0; k < 4; k++) { const w = octW(k, s); if (w > 0) v += w * comp(k, s, ch); } return v; };
  const white = (s, ch) => (hash(Math.floor(s * FPS) * 1.731 + ch * 91.3 + 0.37) * 2 - 1) * 0.8;
  const sig = (s, ch) => (s < 2 ? white(s, ch) : fbm(s, ch));
  const hero = s => ({ x: 960 + 280 * sig(s, 0), y: 590 + 95 * sig(s, 1), rot: 0.6 * sig(s, 2), sc: 1 + 0.14 * sig(s, 3) });
  // the field: 11 × 5 Tokens sampling one 2D noise at (t·0.45 + col·0.22, row·0.22)
  const NFc = 11, NFr = 5, NFsp = [130, 100], NFc0 = [960, 590], NF_T = 0.45, NF_O = 0.22;
  const fv = (cf, rf, s, ch) => { const x = s * NF_T + cf * NF_O + ch * 13.1, y = rf * NF_O + ch * 7.7; return perlin2(x, y) + 0.5 * perlin2(2 * x + 5.2, 2 * y + 1.3); };
  const HL = [[3, 2, P.ink], [5, 2, P.blue], [7, 2, P.accentD]];
  const nzCurve = u => { const s = u * 10; return s < 6 ? sig(s, 0) : 1.8 * fv(5, 2, s, 0); };

  function strip(c, x, y, w, h, t, fns, lo, hi) {
    const Y = v => y + h - (clamp(v, lo, hi) - lo) / (hi - lo) * h;
    c.strokeStyle = 'rgba(23,24,28,0.2)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w, h);
    c.setLineDash([3, 4]); c.beginPath(); c.moveTo(x, Y(0)); c.lineTo(x + w, Y(0)); c.stroke(); c.setLineDash([]);
    for (let sec = Math.ceil(t - 4); sec <= t; sec++) { const px = x + w * (1 - (t - sec) / 4); c.fillStyle = 'rgba(23,24,28,0.3)'; c.fillRect(px, y + h, 1, 6); label(c, `${sec}s`, px, y + h + 22, { size: 12, ls: 1, align: 'center' }); }
    fns.forEach(({ f, col, lw, a }) => {
      c.save(); c.globalAlpha *= a ?? 1; c.strokeStyle = col; c.lineWidth = lw || 2.5; c.lineJoin = 'round'; c.beginPath();
      for (let i = 0; i <= 240; i++) { const s = t - 4 + i / 60, px = x + w * i / 240, py = Y(f(s)); i ? c.lineTo(px, py) : c.moveTo(px, py); }
      c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(x + w, Y(f(t)), 6, 0, TAU); c.fill();
      c.restore();
    });
  }

  MG.film({
    id: 'technoise', dur: 10, poster: 5.6,
    fonts,
    meta: {
      family: 'K', name: 'Noise', sub: 'Smooth random, octave by octave', era: '1983 —',
      origin: 'Ken Perlin invented gradient noise while working on the computer imagery for Tron (1982) and published it as An Image Synthesizer (SIGGRAPH 1985); it earned him a Technical Achievement Academy Award in 1997, and he refined it as Improved Noise (2002). Summing octaves of noise at doubling frequency and halving amplitude — fractal Brownian motion, after Mandelbrot and Van Ness — became the standard way to drive organic motion, from camera shake to the Wiggle expression in After Effects.',
      works: 'Tron (Disney, 1982) · An Image Synthesizer (Ken Perlin, SIGGRAPH 1985) · After Effects wiggle() expression (Adobe)',
      tech: ['1D Perlin gradient noise', 'fBm: octaves at 2× frequency, ½ amplitude', 'Per-instance offsets into a 2D noise field'],
      accent: '#ff5a1f',
      motionDNA: 'Two seconds of white random jitter — a new value every frame, so the Token strobes and its trail scribbles. Then it glides on one slow octave of noise; on each bar a further octave arrives at twice the frequency and half the amplitude, adding tremble on top of drift. Finally a grid of Tokens turns, swells and lifts together as one noise field scrolls through them, neighbours in step, distant ones out of phase.',
      visualDNA: 'The Technique Atlas stage; the orange Token with a fading trail of ghosts and its centre path; a scrolling signal graph along the top; on the left a stack of four octave plots, each lighting up as it enters; for the field, a faint warm-and-blue noise map behind an 11 × 5 grid of Tokens, three of them ringed in ink, blue and dark orange to match their curves.',
      transitions: 'Cut from random to coherent on the beat; octaves fade in on each bar; the hero Token shrinks into the centre of the field',
      implementation: ['Seeded permutation and gradient tables', 'fBm sum with per-octave weights faded in', 'Canvas 2D: per-frame low-res noise map scaled up, trails resampled from t'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const hm = offscreen(96, 54);
      return { hm, hx: hm.getContext('2d', { willReadFrequently: true }) };
    },
    draw(c, t, W, H, st) {
      TK.stage(c, W, H);
      const fa = E.ioC(seg(t, 5.95, 6.6));     // field arrival
      const pa = 1 - seg(t, 5.8, 6.2);         // octave panel
      // the noise field map behind the grid
      if (fa > 0.01) {
        const hx = st.hx, im = hx.createImageData(96, 54), d = im.data;
        for (let j = 0; j < 54; j++) for (let i = 0; i < 96; i++) {
          const sx = (i + 0.5) * 20, sy = (j + 0.5) * 20, v = clamp(fv((sx - NFc0[0]) / NFsp[0] + 5, (sy - NFc0[1]) / NFsp[1] + 2, t, 0) / 1.2, -1, 1), o = (j * 96 + i) * 4;
          if (v > 0) { d[o] = 255; d[o + 1] = 138; d[o + 2] = 92; } else { d[o] = 47; d[o + 1] = 91; d[o + 2] = 255; }
          d[o + 3] = Math.abs(v) * 120;
        }
        hx.putImageData(im, 0, 0);
        c.save(); c.globalAlpha = fa * 0.4; c.imageSmoothingEnabled = true; c.drawImage(st.hm, 0, 0, W, H); c.restore();
      }
      // left: the octave stack
      if (pa > 0.01) {
        c.save(); c.globalAlpha = pa;
        const ox = 72, ow = 340;
        label(c, t < 2 ? 'OCTAVES  ·  NONE YET' : 'OCTAVES  ·  SUMMED INTO x(t)', ox, 196, { size: 14, ls: 2, color: P.ink, weight: 700 });
        NO.forEach(([t0, fq, am], k) => {
          const y = 230 + k * 112, on = octW(k, t), gh = 56;
          c.strokeStyle = `rgba(23,24,28,${0.12 + 0.18 * on})`; c.lineWidth = 1; c.strokeRect(ox + 0.5, y + 0.5, ow, gh);
          c.setLineDash([2, 4]); c.beginPath(); c.moveTo(ox, y + gh / 2); c.lineTo(ox + ow, y + gh / 2); c.stroke(); c.setLineDash([]);
          c.strokeStyle = on > 0.5 ? P.ink : 'rgba(23,24,28,0.25)'; c.lineWidth = 2; c.beginPath();
          for (let i = 0; i <= 160; i++) { const s = t - 4 + i * 4 / 160, v = comp(k, s, 0) * octW(k, s), px = ox + ow * i / 160, py = y + gh / 2 - clamp(v, -1.15, 1.15) * gh * 0.42; i ? c.lineTo(px, py) : c.moveTo(px, py); }
          c.stroke();
          label(c, `OCT ${k + 1}   ${fq} Hz   × ${am}`, ox, y - 10, { size: 14, ls: 2, color: on > 0.5 ? P.ink : P.mute, weight: on > 0.5 ? 700 : 400 });
          label(c, on > 0.5 ? 'ON' : `AT ${t0.toFixed(0)} s`, ox + ow, y - 10, { size: 13, ls: 2, align: 'right', color: on > 0.5 ? P.accentD : P.mute, weight: 700 });
          if (on > 0.01 && on < 1) { c.fillStyle = P.accent; c.fillRect(ox, y + gh + 4, ow * on, 3); }
        });
        label(c, '+ each octave: 2× frequency, ½ amplitude', ox, 686, { size: 13, ls: 1 });
        c.restore();
      }
      // the hero Token: trail path, ghosts, body
      const ha = 1 - fa;
      const hp = hero(t), gc = [NFc0[0], NFc0[1]], hs = lerp(190, 66, fa);
      const hx = lerp(hp.x, gc[0], fa), hy = lerp(hp.y, gc[1], fa), hr = lerp(hp.rot, 1.8 * fv(5, 2, t, 0), fa), hsc = lerp(hp.sc, 1 + 0.45 * fv(5, 2, t, 1), fa);
      if (ha > 0.01) {
        c.save(); c.globalAlpha = ha;
        c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 2; c.beginPath();
        for (let i = 0; i <= 72; i++) { const s = t - 1.2 + i / 60, q = hero(s); i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y); }
        c.stroke();
        for (let g = 8; g >= 1; g--) { const q = hero(t - g * 0.07); TK.token(c, q.x, q.y, 190 * q.sc, { rot: q.rot, alpha: 0.16 * (1 - g / 9), color: P.accentL }); }
        c.restore();
      }
      // the field of Tokens
      if (fa > 0.01) {
        for (let r = 0; r < NFr; r++) for (let cI = 0; cI < NFc; cI++) {
          if (cI === 5 && r === 2) continue;
          const dd = Math.hypot(cI - 5, (r - 2) * 1.3), pop = E.outB(seg(t, 6.1 + dd * 0.07, 6.45 + dd * 0.07));
          if (pop <= 0) continue;
          const x = NFc0[0] + (cI - 5) * NFsp[0], y = NFc0[1] + (r - 2) * NFsp[1] - 16 * fv(cI, r, t, 2);
          TK.token(c, x, y, 66 * pop * (1 + 0.45 * fv(cI, r, t, 1)), { rot: 1.8 * fv(cI, r, t, 0) });
        }
      }
      TK.token(c, hx, hy - 16 * fv(5, 2, t, 2) * fa, hs * hsc, { rot: hr });
      // tracked Tokens
      const ta = seg(t, 6.6, 7.0);
      if (ta > 0) {
        c.save(); c.globalAlpha = ta;
        HL.forEach(([cI, r, col]) => {
          const x = NFc0[0] + (cI - 5) * NFsp[0], y = NFc0[1] + (r - 2) * NFsp[1] - 16 * fv(cI, r, t, 2);
          c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 56, 0, TAU); c.stroke();
        });
        c.globalAlpha = ta * (1 - seg(t, 8.9, 9.3));
        HL.forEach(([cI, r, col], i) => {
          const lx = 1420, ly = 150 + i * 30;
          c.fillStyle = col; c.fillRect(lx, ly - 7, 30, 4);
          label(c, `COL ${cI} · ROW ${r}`, lx + 42, ly, { size: 14, ls: 2, color: col, weight: 700 });
        });
        c.restore();
      }
      // the top signal graph
      const sa = 1 - seg(t, 8.9, 9.3);
      if (sa > 0.01) {
        c.save(); c.globalAlpha = sa;
        const sx = 620, sy = 120, sw = 760, sh = 140;
        const a1 = 1 - seg(t, 5.9, 6.4), a2 = seg(t, 6.4, 6.9);
        const fns = [];
        if (a1 > 0) fns.push({ f: s => sig(s, 0), col: P.accent, lw: 3, a: a1 });
        if (a2 > 0) HL.forEach(([cI, r, col]) => fns.push({ f: s => 1.8 * fv(cI, r, s, 0), col, lw: 2.5, a: a2 }));
        strip(c, sx, sy, sw, sh, t, fns, -1.6, 1.6);
        const lt = t < 2 ? 'x(t)  ·  rand() EVERY FRAME' : t < 6.2 ? 'x(t) = Σ  ½ᵏ · noise(2ᵏ · f · t)' : 'rot(t) = noise(0.45·t + 0.22·col, 0.22·row)';
        label(c, lt, sx, sy - 14, { size: 15, ls: 2, color: P.ink, weight: 700 });
        label(c, 'LAST 4 s', sx + sw, sy - 14, { size: 13, ls: 2, align: 'right' });
        c.restore();
      }
      const tg = t < 2 ? ['WHITE RANDOM  ·  NO MEMORY', seg(t, 0.1, 0.4)] : t < 6 ? ['COHERENT NOISE  ·  fBm', seg(t, 2.0, 2.3)] : ['NOISE FIELD  ·  ONE FIELD, MANY OFFSETS', seg(t, 6.0, 6.3)];
      tag(c, tg[0], 72, 80, tg[1]);
      if (t < 2) label(c, 'neighbouring frames are unrelated', 98, 110, { size: 14, ls: 2 });
      else if (t < 6) label(c, 'neighbouring samples are similar → smooth', 98, 110, { size: 14, ls: 2 });
      else label(c, 'same curve, shifted by each Token’s offset', 98, 110, { size: 14, ls: 2 });
      const wa = E.outC(seg(t, 9.1, 9.7));
      if (wa > 0) TK.word(c, 960, 200 + 18 * (1 - wa), { size: 120, alpha: wa, ls: 6 });
      TK.caption(c, t, W, H, { name: 'Noise', cat: 'Procedural', curve: nzCurve, span: [0, 10], lo: -1.6, hi: 1.6, curveLabel: 'NOISE SIGNAL / TIME' });
    },
    score(A) {
      TK.bed(A);
      // white random: a pitch-scattered blip every other frame, over hiss
      A.noise(0, { type: 'highpass', f: 5000, dur: 2.0, g: 0.035, hold: true, rel: 0.05 });
      for (let i = 0; i < 30; i++) { const s = i / 15, v = white(s, 0); A.osc(s, { type: 'square', f: 900 + 700 * v, dur: 0.035, g: 0.03, lp: 4000, pan: white(s, 1) * 0.6 }); }
      // coherent: the noise played as a melody on a pentatonic scale, denser as octaves arrive
      const PENT = [0, 2, 4, 7, 9];
      const note = v => { const idx = Math.round(clamp((v + 1.4) / 2.8) * 11); return 60 + 12 * Math.floor(idx / 5) + PENT[idx % 5]; };
      for (let s = 2; s < 6; s += 0.125) {
        const nOn = NO.filter(([t0]) => s >= t0).length, step = nOn >= 4 ? 0.125 : nOn >= 2 ? 0.25 : 0.5;
        if (Math.abs(s / step - Math.round(s / step)) > 1e-6) continue;
        A.pluck(s, midi(note(sig(s, 0))), { g: 0.12, bright: 0.5, dur: 0.6, pan: clamp(sig(s, 0) * 0.4, -0.6, 0.6), rev: 0.25 });
      }
      NO.slice(1).forEach(([t0], k) => A.bell(t0, midi(79 + k * 5), { g: 0.05, dur: 1.2 }));
      A.whoosh(5.95, 0.6, { f1: 2000, f2: 400, g: 0.08, swell: 0.5 });
      // the field: three tracked Tokens play the same curve, shifted — a canon
      HL.forEach(([cI, r], i) => {
        for (let s = 6.5; s < 9.75; s += 0.25) A.pluck(s, midi(note(fv(cI, r, s, 0) * 2.4) - 12 + i * 5), { g: 0.08, bright: 0.45, dur: 0.5, pan: (i - 1) * 0.6, rev: 0.3 });
      });
      A.chord(6.0, [48, 55, 64], { type: 'triangle', dur: 3.5, g: 0.025, a: 0.5, lp: 1200, rev: 0.5, width: 0.6 });
      A.chord(9.0, [60, 64, 67, 72], { type: 'sine', dur: 1.0, g: 0.035, a: 0.05, rev: 0.6, width: 0.6 });
    },
  });
})();
