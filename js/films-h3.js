/* batch h3 — Experimental & Generative · Analog & Stop Motion: Noise Motion · Shader Art · Puppet Animation.
   noisemotion (Perlin / curl-noise flow fields, Fidenza-style packed ribbons) · shaderart (Shadertoy fragment-shader live coding) · puppet (felt-and-armature stop-motion puppet on a miniature set). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, rrect, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;600&family=Fira+Code:wght@400;600&family=Space+Grotesk:wght@500;700&family=Jost:wght@400;500;700&family=Permanent+Marker&family=Rye&display=block');
  const PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  // Ken Perlin's improved gradient noise (2002 revision of the 1985 function), permutation seeded from MG.rng.
  function mkPerlin(seed) {
    const r = rng(seed), a = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const s = a[i]; a[i] = a[j]; a[j] = s; }
    const p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) p[i] = a[i & 255];
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const grad = (h, x, y, z) => { h &= 15; const u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z; return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); };
    const n = (x, y, z) => {
      const fx = Math.floor(x), fy = Math.floor(y), fz = Math.floor(z);
      const X = fx & 255, Y = fy & 255, Z = fz & 255;
      x -= fx; y -= fy; z -= fz;
      const u = fade(x), v = fade(y), w = fade(z);
      const A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z, B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
      return lerp(lerp(lerp(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u), lerp(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u), v),
        lerp(lerp(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u), lerp(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u), v), w);
    };
    // the xy part of the gradient picked at a lattice point (for the didactic arrows)
    n.g = (i, j, k = 0) => { const h = p[p[p[i & 255] + (j & 255)] + (k & 255)]; return [grad(h, 1, 0, 0), grad(h, 0, 1, 0)]; };
    return n;
  }
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  // Paper tile: warm mottling and fine tooth (for prints and set dressing).
  function paperTile(base, seed, size = 512, dark = '80,60,40', lite = '255,252,244', amt = 1) {
    const c = offscreen(size, size), g = c.getContext('2d'), r = rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, size, size);
    for (let k = 0; k < 70; k++) {
      const x = r() * size, y = r() * size, rr = 30 + r() * 110, d = r() < 0.5;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, d ? `rgba(${dark},${(0.02 + r() * 0.03) * amt})` : `rgba(${lite},${(0.03 + r() * 0.04) * amt})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { g.save(); g.translate(ox, oy); g.fillRect(x - rr, y - rr, rr * 2, rr * 2); g.restore(); }
    }
    for (let k = 0; k < 9000; k++) { g.fillStyle = r() < 0.5 ? `rgba(${dark},${0.05 * amt})` : `rgba(${lite},${0.07 * amt})`; g.fillRect(r() * size, r() * size, 1 + r() * 1.4, 1 + r() * 1.4); }
    return c;
  }

  /* =====================================================================
     NOISE MOTION — a generative print is made in front of us: a Perlin
     potential is shown as an ink contour map with its lattice of random
     gradients; short ticks turn to follow the curl of that field, then
     release into thousands of pen-plotter particles streaming along the
     contours as the field drifts through z; the flow freezes and wide
     Fidenza-style ribbons pack themselves along it without touching, in
     vermilion, ochre and ultramarine; the camera pulls back to the
     finished print with its margin and gallery label
     ===================================================================== */
  const NM = {
    paper: '#f1e9d8', ink: '#1e1b19', inkS: 'rgba(30,27,25,', ver: '#d2462b', och: '#e8a23a', ult: '#25477c', blush: '#f2c4b2',
    sage: '#6f9483', cream: '#e8dcc2', wall: '#2a2724', wallL: '#3a3531', mat: '#f7f2e7',
  };
  const NM_T = { contour: [0.0, 2.3], ticks: [1.15, 2.55], flow: [2.2, 5.3], freeze: 4.9, relax: [4.3, 5.3], rib: [4.9, 7.6], pull: [7.55, 8.6], label: 8.4 };
  const NM_S = 1 / 340;                       // noise scale (px → lattice units): one lattice cell = 340 px
  const NM_G = 8, NM_GW = 1920 / NM_G + 1, NM_GH = 1080 / NM_G + 1;   // per-frame field grid
  const NM_N = 3200, NM_LIFE = 54, NM_TRAIL = 22, NM_SPS = 46;        // particles, steps per life, trail steps, steps per second
  const nmZ = t => 0.9 + Math.min(t, NM_T.freeze) * 0.085;           // the field drifts through z until it freezes for the ribbons
  // stream function: two octaves of Perlin, with a slow domain offset
  const nmPsi = (pn, x, y, z) => pn(x * NM_S, y * NM_S, z) + 0.42 * pn(x * NM_S * 2.1 + 5.2, y * NM_S * 2.1 - 1.7, z * 1.6 + 3);

  function nmField(st, t, rib = false) {
    // ψ on the grid, then v = (∂ψ/∂y, −∂ψ/∂x): divergence-free curl noise, so streamlines follow ψ's contours.
    // The ribbon field is the same noise relaxed: low octave only, plus a gentle tilted drift (a linear term in ψ)
    const z = nmZ(t), P = st.psi, VX = st.vx, VY = st.vy, pn = st.pn, m = rib ? 1 : E.ioS(seg(t, NM_T.relax[0], NM_T.relax[1]));
    for (let j = 0; j < NM_GH; j++) for (let i = 0; i < NM_GW; i++) {
      const x = i * NM_G, y = j * NM_G;
      const pr = m > 0 ? pn(x * NM_S * 0.75, y * NM_S * 0.75, z) * 0.8 + (y * 0.94 - x * 0.34) * 0.0021 : 0;
      P[j * NM_GW + i] = m >= 1 ? pr : m > 0 ? lerp(nmPsi(pn, x, y, z), pr, m) : nmPsi(pn, x, y, z);
    }
    for (let j = 0; j < NM_GH; j++) for (let i = 0; i < NM_GW; i++) {
      const i0 = Math.max(0, i - 1), i1 = Math.min(NM_GW - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(NM_GH - 1, j + 1);
      const k = j * NM_GW + i;
      VX[k] = (P[j1 * NM_GW + i] - P[j0 * NM_GW + i]) / ((j1 - j0) * NM_G) * 340;
      VY[k] = -(P[j * NM_GW + i1] - P[j * NM_GW + i0]) / ((i1 - i0) * NM_G) * 340;
    }
  }
  // bilinear sample of the field grid
  function nmV(st, x, y, out) {
    let gx = x / NM_G, gy = y / NM_G;
    gx = clamp(gx, 0, NM_GW - 1.001); gy = clamp(gy, 0, NM_GH - 1.001);
    const i = gx | 0, j = gy | 0, u = gx - i, v = gy - j, k = j * NM_GW + i;
    const VX = st.vx, VY = st.vy;
    out[0] = (VX[k] * (1 - u) + VX[k + 1] * u) * (1 - v) + (VX[k + NM_GW] * (1 - u) + VX[k + NM_GW + 1] * u) * v;
    out[1] = (VY[k] * (1 - u) + VY[k + 1] * u) * (1 - v) + (VY[k + NM_GW] * (1 - u) + VY[k + NM_GW + 1] * u) * v;
  }

  // fig. 1: the potential as an ink contour map, rendered per pixel on a half-res buffer
  function nmContours(c, st, t, a) {
    const g = st.cg, img = st.cimg, d = img.data, CW = st.cw.width, CH = st.cw.height, z = nmZ(t), pn = st.pn;
    const inkR = 30, inkG = 27, inkB = 25;
    for (let j = 0; j < CH; j++) for (let i = 0; i < CW; i++) {
      const x = i * 3, y = j * 3;
      const v = nmPsi(pn, x, y, z), vv = (v + 1.2) * 9;
      // distance to nearest iso-line in screen px, via the local gradient estimated from the field grid
      const f = Math.abs(vv - Math.round(vv));
      const gi = Math.min(NM_GW - 1, (x / NM_G) | 0), gj = Math.min(NM_GH - 1, (y / NM_G) | 0), k = gj * NM_GW + gi;
      const gm = Math.hypot(st.vx[k], st.vy[k]) / 340 * 9 * 3 + 1e-4;
      const line = clamp(1.2 - f / gm);
      const major = Math.round(vv) % 5 === 0 ? 1 : 0.5;
      const tone = clamp(0.5 + v * 0.6) * 0.13;         // a faint hill-shade between lines
      const o = (j * CW + i) * 4, al = clamp(line * major * 0.85 + tone);
      d[o] = inkR; d[o + 1] = inkG; d[o + 2] = v > 0 ? inkB + 60 * clamp(v) : inkB; d[o + 3] = al * 255;
    }
    g.putImageData(img, 0, 0);
    c.save(); c.globalAlpha = a; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(st.cw, 0, 0, 1920, 1080); c.restore();
  }
  // the lattice: one random gradient per integer point, as in Perlin (1985)
  function nmLattice(c, st, t, a) {
    if (a <= 0) return;
    const z = nmZ(t), k0 = Math.floor(z);
    c.save(); c.globalAlpha = a;
    for (let j = 0; j * 340 <= 1080 + 340; j++) for (let i = 0; i * 340 <= 1920 + 340; i++) {
      const x = i * 340, y = j * 340, u = E.outB(seg(t, 0.25 + (i + j) * 0.05, 0.65 + (i + j) * 0.05));
      if (u <= 0) continue;
      const [gx, gy] = st.pn.g(i, j, k0), L = Math.hypot(gx, gy) || 1, len = 70 * u;
      c.strokeStyle = NM.ver; c.fillStyle = NM.ver; c.lineWidth = 3;
      const ex = x + gx / L * len, ey = y + gy / L * len;
      c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke();
      const an = Math.atan2(gy, gx);
      c.beginPath(); c.moveTo(ex + Math.cos(an) * 10, ey + Math.sin(an) * 10); c.lineTo(ex + Math.cos(an + 2.5) * 12, ey + Math.sin(an + 2.5) * 12); c.lineTo(ex + Math.cos(an - 2.5) * 12, ey + Math.sin(an - 2.5) * 12); c.closePath(); c.fill();
      c.beginPath(); c.arc(x, y, 7 * u, 0, TAU); c.fillStyle = NM.paper; c.fill(); c.lineWidth = 2.5; c.stroke();
    }
    // dashed cell lines
    c.strokeStyle = 'rgba(210,70,43,0.35)'; c.lineWidth = 1.2; c.setLineDash([6, 10]);
    const gu = E.outC(seg(t, 0.1, 0.9));
    for (let x = 340; x < 1920; x += 340) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 1080 * gu); c.stroke(); }
    for (let y = 340; y < 1080; y += 340) { c.beginPath(); c.moveTo(0, y); c.lineTo(1920 * gu, y); c.stroke(); }
    c.setLineDash([]); c.restore();
  }
  // fig. 2a: a grid of direction ticks that swing round to the curl field
  function nmTicks(c, st, t, a) {
    const v = [0, 0], grow = E.outC(seg(t, NM_T.ticks[0], NM_T.ticks[0] + 0.7));
    if (a <= 0 || grow <= 0) return;
    c.save(); c.globalAlpha = a; c.strokeStyle = NM.ink; c.lineCap = 'round'; c.lineWidth = 2;
    c.beginPath();
    for (let y = 24; y < 1080; y += 36) for (let x = 24 + ((y / 36) % 2) * 18; x < 1920; x += 36) {
      nmV(st, x, y, v);
      const sp = Math.hypot(v[0], v[1]) || 1, an0 = hash(x * 0.37 + y * 1.13) * TAU, an1 = Math.atan2(v[1], v[0]);
      const turn = E.ioC(seg(t, NM_T.ticks[0] + 0.15 + hash(x + y * 7) * 0.4, NM_T.ticks[0] + 0.85 + hash(x + y * 7) * 0.4));
      let d = an1 - an0; d = Math.atan2(Math.sin(d), Math.cos(d));
      const an = an0 + d * turn, L = (6 + 11 * Math.min(1.6, sp)) * grow;
      c.moveTo(x - Math.cos(an) * L, y - Math.sin(an) * L); c.lineTo(x + Math.cos(an) * L, y + Math.sin(an) * L);
    }
    c.stroke(); c.restore();
  }
  // fig. 2b: particles born at seeded points, each integrated forward from its birth so any frame is exact
  function nmParticles(c, st, t, a) {
    if (a <= 0) return;
    const v = [0, 0], dens = E.outC(seg(t, NM_T.flow[0], NM_T.flow[0] + 0.9));
    const paths = [[], []];
    for (let i = 0; i < NM_N; i++) {
      const hi = st.ph[i];
      if (hi > dens) continue;
      const u = (t - NM_T.flow[0]) * NM_SPS / NM_LIFE + hi * 3.7, k = Math.floor(u), life = u - k;
      let x = hash(i * 12.9898 + k * 78.233) * 2040 - 60, y = hash(i * 39.346 + k * 11.135 + 0.5) * 1180 - 50;
      const n = life * NM_LIFE, nI = Math.floor(n), from = Math.max(0, nI - NM_TRAIL);
      const pts = [];
      for (let s = 0; s <= nI; s++) {
        if (s >= from) pts.push(x, y);
        nmV(st, x, y, v);
        const sp = Math.hypot(v[0], v[1]) + 1e-6, step = 3.2 + 3.4 * Math.min(1.5, sp);
        x += v[0] / sp * step; y += v[1] / sp * step;
      }
      pts.push(x, y);
      paths[st.tint[i] ? 1 : 0].push(pts);
    }
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    [[NM.ink, 1.25, 0.62], [NM.ver, 1.6, 0.8]].forEach(([col, lw, al], pi) => {
      c.strokeStyle = col; c.lineWidth = lw; c.globalAlpha = al * a;
      c.beginPath();
      paths[pi].forEach(p => { c.moveTo(p[0], p[1]); for (let q = 2; q < p.length; q += 2) c.lineTo(p[q], p[q + 1]); });
      c.stroke();
    });
    c.restore();
  }
  // fig. 3: collision-packed ribbons grown along the frozen field
  function nmRibbons(c, st, t) {
    const T0 = NM_T.rib[0];
    if (t < T0) return;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    st.ribs.forEach(rb => {
      const u = E.outC(seg(t, T0 + rb.at, T0 + rb.at + rb.dur));
      if (u <= 0) return;
      const p = rb.pts, mid = rb.mid, n = p.length / 2;
      // ribbons grow outward from their seed point in both directions, like Hobbs' bidirectional curves
      const a = Math.max(0, Math.round(mid - mid * u)), b = Math.min(n - 1, Math.round(mid + (n - 1 - mid) * u));
      if (b - a < 1) return;
      c.beginPath(); c.moveTo(p[a * 2], p[a * 2 + 1]);
      for (let q = a + 1; q <= b; q++) c.lineTo(p[q * 2], p[q * 2 + 1]);
      c.strokeStyle = rb.col; c.lineWidth = rb.w; c.stroke();
    });
    c.restore();
  }

  MG.film({
    id: 'noisemotion', dur: 10, poster: 9.4,
    fonts: [['400 120px "Instrument Serif"', 'Noise Fields'], ['italic 400 40px "Instrument Serif"', 'fig. 1234 — gradient lattice flow ribbons print'], ['400 20px "IBM Plex Mono"', 'ψ ∇ × = ( ) · , z N 0123456789 seed'], ['600 20px "IBM Plex Mono"', 'NOISE CURL']],
    meta: {
      family: 'E', name: 'Noise Motion', sub: 'Perlin & curl-noise flow fields', era: '1985 —',
      origin: 'Ken Perlin invented gradient noise for Tron and published it as "An Image Synthesizer" at SIGGRAPH 1985: a smooth, band-limited random function that became the default source of organic motion in computer graphics, earning him a Technical Achievement Academy Award in 1997. Generative artists turned it into motion by steering particles with it — angle-from-noise flow fields, and from 2007 Bridson\'s divergence-free curl noise — and Tyler Hobbs\' Fidenza (2021) made packed, non-colliding flow-field curves a signature of long-form generative art.',
      works: 'Ken Perlin — "An Image Synthesizer", SIGGRAPH 1985 · Robert Bridson, Jim Hourihan & Marcus Nordenstam — "Curl-Noise for Procedural Fluid Flow", SIGGRAPH 2007 · Robert Hodgin — Magnetosphere (iTunes visualizer, 2008) · Tyler Hobbs — Fidenza (Art Blocks, 2021)',
      tech: ['Perlin gradient noise', 'Curl-noise advection', 'Collision-packed ribbons'],
      accent: '#d2462b',
      motionDNA: 'Everything moves because a smooth random field says so: ticks swing into alignment, particles are born, stream along the field and die, the whole flow slowly morphs as the noise is sampled through time, then freezes while wide ribbons grow along it from their seed points.',
      visualDNA: 'A warm cream print with pen-plotter ink hairlines and topographic contours, then flat Fidenza-like ribbons of varied width in vermilion, ochre, ultramarine, blush and sage that never touch, finished with a mat margin and a gallery label.',
      transitions: 'Contour map to tick field, ticks release into particles, flow freezes, ribbons grow, pull back to the framed print',
      implementation: ['Processing / p5.js', 'openFrameworks / Cinder', 'TouchDesigner / Houdini', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const st = {};
      st.pn = mkPerlin(1985);
      st.psi = new Float32Array(NM_GW * NM_GH); st.vx = new Float32Array(NM_GW * NM_GH); st.vy = new Float32Array(NM_GW * NM_GH);
      st.cw = offscreen(640, 360); st.cg = st.cw.getContext('2d'); st.cimg = st.cg.createImageData(640, 360);
      const r = rng(2021);
      st.ph = Float32Array.from({ length: NM_N }, () => r());
      st.tint = Uint8Array.from({ length: NM_N }, () => (r() < 0.07 ? 1 : 0));
      st.paper = paperTile(NM.paper, 41, 512, '90,70,40', '255,252,244', 0.9);
      st.wall = paperTile(NM.wall, 43, 512, '0,0,0', '120,110,100', 1.2);
      // ---- ribbons: packed once on the frozen field ----
      nmField(st, NM_T.freeze + 0.01, true);
      const C = 5, GX = Math.ceil(1920 / C), GY = Math.ceil(1080 / C), occ = new Int32Array(GX * GY).fill(-1);
      const pal = [[NM.ver, 0.2], [NM.och, 0.17], [NM.ult, 0.2], [NM.ink, 0.1], [NM.blush, 0.14], [NM.sage, 0.1], [NM.cream, 0.09]];
      const pick = () => { let x = r(); for (const [col, w] of pal) { if ((x -= w) <= 0) return col; } return NM.ver; };
      const free = (x, y, hw, id) => {
        if (x < 30 || y < 30 || x > 1890 || y > 1050) return false;
        const R = Math.ceil((hw + 5) / C), ci = (x / C) | 0, cj = (y / C) | 0;
        for (let j = cj - R; j <= cj + R; j++) { if (j < 0 || j >= GY) continue; for (let i = ci - R; i <= ci + R; i++) { if (i < 0 || i >= GX) continue; const o = occ[j * GX + i]; if (o >= 0 && o !== id) { const dx = (i - ci) * C, dy = (j - cj) * C; if (dx * dx + dy * dy < (hw + 5) * (hw + 5)) return false; } } }
        return true;
      };
      const mark = (x, y, hw, id) => { const R = Math.ceil(hw / C), ci = (x / C) | 0, cj = (y / C) | 0; for (let j = cj - R; j <= cj + R; j++) for (let i = ci - R; i <= ci + R; i++) if (i >= 0 && j >= 0 && i < GX && j < GY && (i - ci) ** 2 + (j - cj) ** 2 <= R * R) occ[j * GX + i] = id; };
      const v = [0, 0], ribs = [];
      // candidate seeds: a shuffled jittered grid; widest ribbons are tried first so they get room
      const seeds = [];
      for (let y = 20; y < 1080; y += 26) for (let x = 20; x < 1920; x += 26) seeds.push([x + r() * 20, y + r() * 20, r()]);
      seeds.sort((a, b) => a[2] - b[2]);
      let id = 0;
      for (const [sx, sy] of seeds) {
        const q = ribs.length, wR = r();
        const w = q < 7 ? 50 + wR * 22 : q < 45 ? 22 + wR * 12 : q < 170 ? 10 + wR * 6 : 4 + wR * 4;
        const hw = w / 2, step = 5;
        if (!free(sx, sy, hw, id)) continue;
        const grow = dir => { const out = []; let x = sx, y = sy; for (let s = 0; s < 260; s++) { nmV(st, x, y, v); const sp = Math.hypot(v[0], v[1]) + 1e-6; x += v[0] / sp * step * dir; y += v[1] / sp * step * dir; if (!free(x, y, hw, id)) break; out.push(x, y); } return out; };
        const fw = grow(1), bw = grow(-1);
        const n = (fw.length + bw.length) / 2 + 1;
        if (n * step < Math.max(70, w * 6)) continue;
        const pts = [];
        for (let k = bw.length - 2; k >= 0; k -= 2) pts.push(bw[k], bw[k + 1]);
        const mid = pts.length / 2;
        pts.push(sx, sy); for (let k = 0; k < fw.length; k++) pts.push(fw[k]);
        for (let k = 0; k < pts.length; k += 2) mark(pts[k], pts[k + 1], hw, id);
        ribs.push({ pts, mid, w, col: pick(), at: 0, dur: 0 });
        id++;
        if (ribs.length > 1100) break;
      }
      // growth order: widest first, then the rest sweep in by seed position (left → right)
      ribs.forEach((rb, i) => { const sx = rb.pts[rb.mid * 2]; rb.at = i < 7 ? i * 0.12 : i < 45 ? 0.5 + hash(i) * 0.6 : 0.9 + (sx / 1920) * 1.0 + hash(i) * 0.4; rb.dur = rb.w > 40 ? 1.1 : 0.7; });
      st.ribs = ribs;
      return st;
    },
    draw(c, t, W, H, st) {
      nmField(st, t);
      // camera: a slow drift in, then a pull back to the framed print on the wall
      const pull = E.ioC(seg(t, NM_T.pull[0], NM_T.pull[1]));
      const sc = lerp(1.06 - 0.06 * seg(t, 0, NM_T.pull[0]), 0.6, pull), cy = lerp(540, 452, pull);
      c.fillStyle = NM.wall; c.fillRect(0, 0, W, H);
      if (pull > 0) {
        c.save(); c.fillStyle = c.createPattern(st.wall, 'repeat'); c.fillRect(0, 0, W, H); c.restore();
        const lg = c.createRadialGradient(960, 380, 100, 960, 480, 1200); lg.addColorStop(0, 'rgba(255,235,200,0.16)'); lg.addColorStop(1, 'rgba(0,0,0,0.35)');
        c.fillStyle = lg; c.fillRect(0, 0, W, H);
      }
      c.save(); c.translate(960, cy); c.scale(sc, sc); c.translate(-960, -540);
      // frame, mat and shadow (only visible once we pull back)
      if (pull > 0) {
        c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(-150 + 30, -150 + 40, 2220, 1380);
        c.fillStyle = '#141210'; c.fillRect(-170, -170, 2260, 1420);
        c.fillStyle = NM.mat; c.fillRect(-150, -150, 2220, 1380);
        c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(-6, -6, 1932, 6); c.fillRect(-6, -6, 6, 1092);
      }
      c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip();
      c.fillStyle = NM.paper; c.fillRect(0, 0, W, H);
      c.fillStyle = c.createPattern(st.paper, 'repeat'); c.fillRect(0, 0, W, H);
      // fig. 1 → 2 → 3
      const ca = 1 - E.inQ(seg(t, NM_T.contour[1] - 0.6, NM_T.contour[1]));
      if (ca > 0) nmContours(c, st, t, ca * E.outQ(seg(t, 0, 0.5)));
      nmLattice(c, st, t, (1 - seg(t, 1.2, 1.7)) * E.outQ(seg(t, 0.15, 0.5)));
      nmTicks(c, st, t, 1 - E.inQ(seg(t, NM_T.ticks[1] - 0.35, NM_T.ticks[1])));
      const pa = E.outQ(seg(t, NM_T.flow[0], NM_T.flow[0] + 0.5)) * (1 - E.inQ(seg(t, NM_T.rib[0] + 0.3, NM_T.flow[1] + 0.6)));
      nmParticles(c, st, t, pa);
      nmRibbons(c, st, t);
      c.restore();
      c.restore();

      // ---- annotation: a plotter's notebook in the margin ----
      const ui = 1 - E.inQ(seg(t, NM_T.pull[0], NM_T.pull[0] + 0.4));
      if (ui > 0) {
        const figs = [[0, 'fig. 1 — a Perlin potential ψ and its gradient lattice'], [1.6, 'fig. 2 — v = ∇ × ψ : particles follow the contours'], [4.4, 'fig. 3 — the field relaxes and freezes; ribbons pack']];
        let fi = 0; figs.forEach((f, i) => { if (t >= f[0]) fi = i; });
        const fa = E.outC(seg(t, figs[fi][0], figs[fi][0] + 0.35));
        c.save(); c.globalAlpha = ui;
        c.fillStyle = 'rgba(241,233,216,0.9)'; rrect(c, 56, 52, 820, 96, 6); c.fill();
        c.globalAlpha = ui * fa;
        text(c, figs[fi][1], 80, 98, { font: '"Instrument Serif", serif', style: 'italic', size: 40, color: NM.ink });
        c.globalAlpha = ui;
        text(c, fi === 0 ? 'PERLIN 1985 · GRADIENT NOISE' : fi === 1 ? 'CURL NOISE · DIVERGENCE-FREE' : 'NON-COLLIDING FLOW CURVES', 80, 132, { font: '"IBM Plex Mono", monospace', weight: 600, size: 18, color: NM.ver, ls: 3 });
        // readout
        const z = nmZ(t), nAct = Math.round(NM_N * E.outC(seg(t, NM_T.flow[0], NM_T.flow[0] + 0.9)) * (t < NM_T.rib[0] + 1 ? 1 : 0));
        const rows = [`seed  1985`, `z     ${z.toFixed(3)}${t >= NM_T.freeze ? '  frozen' : ''}`, `N     ${t < NM_T.flow[0] ? '—' : nAct}`, `curves ${t < NM_T.rib[0] ? '—' : st.ribs.filter(rb => t > NM_T.rib[0] + rb.at).length}`];
        c.fillStyle = 'rgba(241,233,216,0.9)'; rrect(c, 1560, 52, 304, 146, 6); c.fill();
        rows.forEach((s, i) => text(c, s, 1584, 88 + i * 30, { font: '"IBM Plex Mono", monospace', size: 20, color: NM.ink }));
        c.restore();
      }
      // ---- gallery label ----
      const la = E.outC(seg(t, NM_T.label, NM_T.label + 0.6));
      if (la > 0) {
        c.save(); c.globalAlpha = la;
        const y0 = 940 + (1 - la) * 16;
        text(c, 'Noise Fields', 960, y0 + 20, { font: '"Instrument Serif", serif', size: 76, align: 'center', color: '#f3ecdd' });
        text(c, 'PERLIN NOISE · CURL ADVECTION · PACKED FLOW CURVES', 960, y0 + 64, { font: '"IBM Plex Mono", monospace', weight: 600, size: 18, align: 'center', color: '#e8a23a', ls: 4 });
        text(c, 'after Ken Perlin (1985) and Tyler Hobbs, Fidenza (2021)', 960, y0 + 100, { font: '"Instrument Serif", serif', style: 'italic', size: 30, align: 'center', color: 'rgba(243,236,221,0.75)' });
        c.restore();
      }
      grain(c, W, H, t, 0.045, 'overlay');
      vignette(c, W, H, pull > 0 ? 0.5 : 0.22, '40,30,20');
    },
    score(A) {
      A.bus.gain.value = 1.45;
      // a slowly breathing drone in D, filtered by the "field"
      A.chord(0.0, [38, 45, 50], { type: 'triangle', dur: 10, g: 0.05, a: 2.0, hold: true, rel: 1.2, lp: 500, lp2: 1400, lpT: 8, spread: 6, width: 0.6, rev: 0.5 });
      A.noise(0.0, { type: 'lowpass', f: 300, f2: 1200, sweep: 5, dur: 5.2, g: 0.05, swell: 0.7, rev: 0.4 });
      // fig. 1: lattice arrows tick in, each a soft wooden click
      for (let k = 0; k < 9; k++) A.noise(0.3 + k * 0.1, { type: 'bandpass', f: 2400 + k * 150, q: 8, dur: 0.03, g: 0.08, pan: (k / 8 - 0.5) * 0.8 });
      // ticks swing: a pentatonic glass shimmer, positions chosen by hash so it is stable
      const pent = [62, 64, 66, 69, 71, 74, 76, 78, 81];
      for (let k = 0; k < 14; k++) A.osc(1.3 + k * 0.08, { type: 'sine', f: midi(pent[Math.floor(hash(k * 3.1) * pent.length)] + 12), dur: 0.5, g: 0.022, pan: hash(k) - 0.5, rev: 0.6 });
      // fig. 2: the flow — a wide wind swell and a generative arpeggio drifting like particles
      A.noise(2.2, { type: 'bandpass', f: 500, f2: 2200, sweep: 2.6, q: 0.8, dur: 3.2, g: 0.09, swell: 0.5, rev: 0.5, pan: -0.2 });
      A.noise(2.6, { type: 'bandpass', f: 1800, f2: 700, sweep: 2.4, q: 1.2, dur: 2.8, g: 0.05, swell: 0.4, rev: 0.5, pan: 0.3 });
      for (let k = 0; k < 22; k++) {
        const tt = 2.25 + k * 0.125 + hash(k * 7.7) * 0.05;
        A.pluck(tt, midi(pent[Math.floor(hash(k * 1.37 + 4) * pent.length)]), { g: 0.12, dur: 1.4, bright: 0.45, decay: 0.994, pan: Math.sin(k * 0.9) * 0.6, rev: 0.45 });
      }
      // freeze: a held breath, then each wide ribbon lands as a low marimba-like note
      A.osc(4.85, { type: 'sine', f: midi(86), dur: 0.9, g: 0.03, rev: 0.7 });
      [50, 57, 62, 55, 59, 64, 52, 57, 62, 66, 57, 62, 69, 54].forEach((m, i) => A.pluck(4.95 + i * 0.09, midi(m), { g: 0.16, dur: 1.6, bright: 0.35, decay: 0.993, lp: 2400, pan: (i % 5) / 4 - 0.5, rev: 0.4 }));
      A.chord(5.9, [50, 57, 62, 66, 69], { type: 'triangle', dur: 2.4, g: 0.035, a: 0.6, lp: 1800, width: 0.9, rev: 0.6 });
      for (let k = 0; k < 16; k++) A.pluck(5.85 + k * 0.11, midi(pent[(k * 3) % pent.length] + 12), { g: 0.06, dur: 0.9, bright: 0.5, pan: k / 15 - 0.5, rev: 0.5 });
      // pull back and label
      A.whoosh(7.5, 1.1, { f1: 200, f2: 1400, g: 0.07, rev: 0.4 });
      A.chord(8.35, [38, 50, 57, 62, 66, 69], { type: 'sine', dur: 1.65, g: 0.05, a: 0.05, width: 0.8, rev: 0.7 });
      A.bell(8.4, midi(81), { g: 0.05, dur: 1.5, rev: 0.6 });
    },
  });

  /* =====================================================================
     SHADER ART — a live-coding session in the demoscene "shader showdown"
     manner: GLSL is typed straight over the output, and every compile
     wipes a new fragment shader down the screen. The default new-shader
     cosine gradient gives way to smooth-min SDF metaballs shown in Inigo
     Quilez's distance-field colours, then to his fbm domain warping, and
     finally the plane is folded into an eight-way kaleidoscope cycling a
     cosine palette, before the code clears for the title
     ===================================================================== */
  const SA = { bg: '#07060a', code: '#e9e6f2', dim: 'rgba(233,230,242,0.42)', kw: '#ff79c6', ty: '#8be9fd', num: '#ffb86c', fn: '#50fa7b', com: 'rgba(160,160,190,0.75)', ok: '#50fa7b', line: 'rgba(4,3,8,0.74)' };
  const SA_BW = 480, SA_BH = 270;                     // the "framebuffer": every pixel shaded in JS, then scaled ×4
  const SA_B = 0.5;                                   // 120 bpm
  // shader programs: [typing start, compile time]
  const SA_P = [[0.05, 0.85], [1.55, 2.5], [4.0, 5.0], [6.55, 7.5]];
  const SA_T = { wipe: 0.34, codeOut: 8.3, title: 8.55 };
  const SA_CODE = [
    ['void mainImage(out vec4 fragColor, in vec2 fragCoord) {',
      '    vec2 uv = fragCoord / iResolution.xy;',
      '    vec3 col = 0.5 + 0.5*cos(iTime + uv.xyx + vec3(0,2,4));',
      '    fragColor = vec4(col, 1.0);',
      '}'],
    ['float smin(float a, float b, float k) {',
      '    float h = max(k - abs(a - b), 0.0) / k;',
      '    return min(a, b) - h*h*k*0.25;',
      '}',
      'float map(vec2 p) {',
      '    float d = 1e9;',
      '    for (int i = 0; i < 5; i++)',
      '        d = smin(d, length(p - ball(i)) - 0.17, 0.4);',
      '    return d;',
      '}',
      '// col = d > 0.0 ? vec3(0.9,0.6,0.3) : vec3(0.65,0.85,1.0);',
      '// col *= 0.8 + 0.2*cos(150.0*d);'],
    ['float pattern(vec2 p, out vec2 q, out vec2 r) {',
      '    q = vec2(fbm(p), fbm(p + vec2(5.2, 1.3)));',
      '    r = vec2(fbm(p + 4.0*q + vec2(1.7, 9.2)),',
      '             fbm(p + 4.0*q + vec2(8.3, 2.8)));',
      '    return fbm(p + 4.0*r);',
      '}',
      '// col = mix(teal, sand, f*f*4.0) ... after iq, "domain warping"'],
    ['vec3 pal(float t) {',
      '    return 0.5 + 0.5*cos(6.28318*(t + vec3(0.0, 0.1, 0.2)));',
      '}',
      'vec2 kale(vec2 p, float n) {',
      '    float a = mod(atan(p.y, p.x), 6.28318/n) - 3.14159/n;',
      '    return abs(vec2(cos(a), sin(a))) * length(p);',
      '}',
      '    p = kale(rot(iTime*0.2) * p, 8.0);',
      '    col = pal(pattern(p*1.6) + length(p) - iTime*0.3);'],
  ];
  const SA_KW = /\b(void|float|vec2|vec3|vec4|out|in|for|int|return)\b/g;

  // value noise on a seeded 256² lattice, and IQ-style fbm with a rotating octave matrix
  const SA_N = (() => { const r = rng(2002), a = new Float32Array(256 * 256); for (let i = 0; i < a.length; i++) a[i] = r(); return a; })();
  function saNoise(x, y) {
    const fx = Math.floor(x), fy = Math.floor(y), u = x - fx, v = y - fy;
    const i = fx & 255, j = fy & 255, i1 = (i + 1) & 255, j1 = (j + 1) & 255;
    const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
    const a = SA_N[j * 256 + i], b = SA_N[j * 256 + i1], c = SA_N[j1 * 256 + i], d = SA_N[j1 * 256 + i1];
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  }
  function saFbm(x, y) {
    let f = 0, amp = 0.5;
    for (let o = 0; o < 4; o++) { f += amp * saNoise(x, y); const nx = 1.6 * x + 1.2 * y, ny = -1.2 * x + 1.6 * y; x = nx + 0.13; y = ny - 0.21; amp *= 0.5; }
    return f / 0.9375;
  }
  const saBall = (i, t) => [Math.sin(t * (0.7 + i * 0.23) + i * 1.9) * (0.55 + 0.25 * Math.sin(i * 2.1)), Math.cos(t * (0.9 + i * 0.17) + i * 1.3) * 0.42];
  const sMin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  const mixv = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];

  // the four programs: (uv x, uv y, centred p.x, p.y, iTime, beat, out) → rgb in 0..1
  function saProg0(ux, uy, px, py, t, bt, o) {
    o[0] = 0.5 + 0.5 * Math.cos(t + ux); o[1] = 0.5 + 0.5 * Math.cos(t + uy + 2); o[2] = 0.5 + 0.5 * Math.cos(t + ux + 4);
  }
  function saProg1(ux, uy, px, py, t, bt, o, balls) {
    let d = 1e9;
    for (let i = 0; i < 5; i++) { const b = balls[i]; d = sMin(d, Math.hypot(px - b[0], py - b[1]) - 0.17, 0.4); }
    // IQ's distance-field visualisation: orange outside, blue inside, contour stripes and a white zero line
    let r, g, b;
    if (d > 0) { r = 0.9; g = 0.6; b = 0.3; } else { r = 0.65; g = 0.85; b = 1.0; }
    const e = 1 - Math.exp(-6 * Math.abs(d)), s = 0.8 + 0.2 * Math.cos(150 * d - t * 4);
    r *= e * s; g *= e * s; b *= e * s;
    const z = 1 - clamp((Math.abs(d) - 0.004) / 0.012);
    o[0] = lerp(r, 1, z); o[1] = lerp(g, 1, z); o[2] = lerp(b, 1, z);
    // the beat brightens the blobs' rims a touch
    const rim = Math.exp(-Math.abs(d) * 40) * bt * 0.4; o[0] += rim; o[1] += rim; o[2] += rim;
  }
  const SA_C1 = [0.101961, 0.619608, 0.666667], SA_C2 = [0.666667, 0.666667, 0.498039], SA_C3 = [0, 0, 0.164706], SA_C4 = [0.666667, 1, 1];
  function saWarp(x, y, t, out) {
    const qx = saFbm(x + 0.0 + t * 0.06, y), qy = saFbm(x + 5.2, y + 1.3 - t * 0.05);
    const rx = saFbm(x + 4 * qx + 1.7 - t * 0.15, y + 4 * qy + 9.2), ry = saFbm(x + 4 * qx + 8.3, y + 4 * qy + 2.8 + t * 0.126);
    out[0] = saFbm(x + 4 * rx, y + 4 * ry); out[1] = Math.hypot(qx, qy); out[2] = rx;
    return out;
  }
  function saProg2(ux, uy, px, py, t, bt, o, w) {
    saWarp(px * 0.95 + 3, py * 0.95 + 1, t, w);
    const f = w[0];
    let c = mixv(SA_C1, SA_C2, clamp(f * f * 4));
    c = mixv(c, SA_C3, clamp(w[1] * 0.55));
    c = mixv(c, SA_C4, clamp(Math.abs(w[2] * 1.2 - 0.5) * 0.7));
    const k = (f * f * f + 0.6 * f * f + 0.5 * f) * 2.3;
    o[0] = c[0] * k; o[1] = c[1] * k; o[2] = c[2] * k;
  }
  function saProg3(ux, uy, px, py, t, bt, o) {
    // rotate, fold into 8 mirrored wedges, then a one-level warp and a cosine palette
    const ca = Math.cos(t * 0.2), sa = Math.sin(t * 0.2);
    let x = ca * px - sa * py, y = sa * px + ca * py;
    const n = 8, r = Math.hypot(x, y);
    let a = Math.atan2(y, x); a = ((a % (TAU / n)) + TAU / n) % (TAU / n) - PI / n;
    x = Math.abs(Math.cos(a)) * r; y = Math.abs(Math.sin(a)) * r;
    const zx = x * 1.6, zy = y * 1.6;
    const qx = saFbm(zx + t * 0.1, zy), qy = saFbm(zx + 5.2, zy + 1.3);
    const f = saFbm(zx + 3 * qx, zy + 3 * qy - t * 0.12);
    const v = f * 1.6 + r - t * 0.3;
    // IQ cosine palette a + b·cos(2π(c·t + d)), d = (0, 0.1, 0.2): ember, rose and ink blue
    const pr = 0.5 + 0.5 * Math.cos(TAU * v), pg = 0.5 + 0.5 * Math.cos(TAU * (v + 0.1)), pb = 0.5 + 0.5 * Math.cos(TAU * (v + 0.2));
    // crisp dark iso-lines every half palette cycle, a falloff to the rim and a glow at the centre on each beat
    const fv = v * 2 - Math.floor(v * 2), edge = Math.min(fv, 1 - fv), line = 0.18 + 0.82 * clamp(edge / 0.07);
    const fall = 1.05 - 0.45 * clamp(r / 1.9), glow = Math.exp(-r * 3) * (0.15 + bt * 0.3);
    o[0] = pr * pr * line * fall + glow; o[1] = pg * pg * line * fall + glow * 0.85; o[2] = pb * pb * line * fall + glow;
  }

  // shade the buffer: rows above the compile wipe use the new program, rows below the old one
  function saShade(st, t) {
    const d = st.img.data, o = [0, 0, 0], w = [0, 0, 0], bt = Math.exp(-((t % SA_B) / SA_B) * 5);
    const balls = Array.from({ length: 5 }, (_, i) => saBall(i, t));
    let cur = -1; SA_P.forEach((p, i) => { if (t >= p[1]) cur = i; });
    const wipe = cur >= 0 ? seg(t, SA_P[cur][1], SA_P[cur][1] + SA_T.wipe) : 0;
    const progs = [saProg0, saProg1, saProg2, saProg3];
    const iT = t;
    for (let j = 0; j < SA_BH; j++) {
      const k = j / SA_BH < wipe ? cur : cur - 1;
      const pr = progs[k];
      const uy = 1 - (j + 0.5) / SA_BH, py = (SA_BH - 2 * (j + 0.5)) / SA_BH;
      for (let i = 0; i < SA_BW; i++) {
        const q = (j * SA_BW + i) * 4;
        if (k < 0) { d[q] = 7; d[q + 1] = 6; d[q + 2] = 10; d[q + 3] = 255; continue; }
        const ux = (i + 0.5) / SA_BW, px = (2 * (i + 0.5) - SA_BW) / SA_BH;
        pr(ux, uy, px, py, iT, bt, o, k === 1 ? balls : w);
        // gentle filmic curve + ordered dither so the ×4 upscale stays smooth
        const dz = ((i & 1) * 2 + (j & 1) * 3 - 2) * 0.6;
        d[q] = clamp(o[0]) * 255 + dz; d[q + 1] = clamp(o[1]) * 255 + dz; d[q + 2] = clamp(o[2]) * 255 + dz; d[q + 3] = 255;
      }
    }
    st.g.putImageData(st.img, 0, 0);
    return { cur, wipe };
  }
  // one GLSL line with Bonzomatic-style backing and a little syntax colouring
  function saLine(c, s, x, y, alpha) {
    const F = '"Fira Code", monospace', SZ = 25, CW = 15.0;
    c.save(); c.globalAlpha = alpha;
    c.font = `400 ${SZ}px ${F}`;
    const w = c.measureText(s).width;
    if (s.length) { c.fillStyle = SA.line; c.fillRect(x - 8, y - 26, w + 16, 35); }
    if (s.trim().startsWith('//')) { text(c, s, x, y, { font: F, size: SZ, color: SA.com }); c.restore(); return; }
    // tokens: keywords, numbers, function calls, the rest
    const toks = s.split(/(\b(?:void|float|vec2|vec3|vec4|out|in|for|int|return)\b|\b\d+\.?\d*(?:e\d+)?\b|\b[a-zA-Z_]\w*(?=\()|\s+)/).filter(Boolean);
    let cx = x;
    toks.forEach(tk => {
      let col = SA.code;
      if (/^(void|float|vec2|vec3|vec4|int)$/.test(tk)) col = SA.ty;
      else if (/^(out|in|for|return)$/.test(tk)) col = SA.kw;
      else if (/^\d/.test(tk)) col = SA.num;
      else if (/^[a-zA-Z_]\w*$/.test(tk) && s.indexOf(tk + '(') >= 0 && !/^(void|float|vec2|vec3|vec4)$/.test(tk)) col = SA.fn;
      text(c, tk, cx, y, { font: F, size: SZ, color: col });
      c.font = `400 ${SZ}px ${F}`; cx += c.measureText(tk).width;
    });
    c.restore();
  }

  MG.film({
    id: 'shaderart', dur: 10, poster: 9.2,
    fonts: [['700 180px "Space Grotesk"', 'SHADER ART'], ['500 30px "Space Grotesk"', 'one function, every pixel, every frame'], ['400 25px "Fira Code"', 'void mainImage(out vec4 fragColor) { } 0123456789 .,;*+-/=<>()[]'], ['600 20px "Fira Code"', 'COMPILED OK iTime fps ms']],
    meta: {
      family: 'E', name: 'Shader Art', sub: 'Fragment shaders & live coding', era: '2000s —',
      origin: 'Shader art paints every pixel with one small GPU program — a fragment shader that maps a pixel coordinate and the time to a colour — so images are built from maths rather than geometry: signed distance fields, noise, domain warping and folded space. It grew from the demoscene\'s size-limited intros and was codified by Inigo Quilez, whose articles on SDFs, fbm warping and cosine palettes became the standard references, and whose Shadertoy (2013, with Pol Jeremias) made it a browser-based community; live "shader showdown" battles in Bonzomatic put the coding itself on screen.',
      works: 'Inigo Quilez — articles on domain warping, 2D distance functions and cosine palettes (iquilezles.org) · Shadertoy (Inigo Quilez & Pol Jeremias, 2013) · Bonzomatic live-coding tool (Gargaj / Conspiracy) used for Revision\'s Shader Showdown · The Book of Shaders (Patricio Gonzalez Vivo & Jen Lowe)',
      tech: ['Per-pixel shading', 'SDF smooth-min metaballs', 'fbm domain warping'],
      accent: '#50fa7b',
      motionDNA: 'The image is a pure function of time, so motion is continuous and endless: gradients cycle, blobs melt into each other through smooth-min, warped noise churns like smoke, the kaleidoscope rotates and its palette scrolls outward; each recompile wipes a new program down the screen on the beat.',
      visualDNA: 'Full-bleed per-pixel colour fields — the default cosine rainbow, orange-and-blue distance-field stripes with a white zero line, teal-and-sand marbled fbm, an eight-fold mirrored mandala in a cosine palette — under monospace GLSL with dark backing boxes and a status bar.',
      transitions: 'Typed code, compile, top-to-bottom scan wipe to the new program; code clears for the title',
      implementation: ['GLSL fragment shaders (Shadertoy, Bonzomatic, KodeLife)', 'TouchDesigner GLSL TOP', 'Canvas 2D ImageData emulation'],
      reproducibility: 'Fully procedural',
      loopable: true,
    },
    setup() {
      const st = {};
      st.buf = offscreen(SA_BW, SA_BH); st.g = st.buf.getContext('2d'); st.img = st.g.createImageData(SA_BW, SA_BH);
      return st;
    },
    draw(c, t, W, H, st) {
      const { cur, wipe } = saShade(st, t);
      c.fillStyle = SA.bg; c.fillRect(0, 0, W, H);
      c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      // a slow push in during the last program
      const z = 1 + 0.05 * E.ioS(seg(t, SA_P[3][1], 10));
      c.translate(960, 540); c.scale(z, z); c.translate(-960, -540);
      c.drawImage(st.buf, 0, 0, W, H); c.restore();
      // scan line at the compile wipe front
      if (wipe > 0 && wipe < 1) {
        const y = wipe * H;
        const g = c.createLinearGradient(0, y - 40, 0, y + 4); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.55)');
        c.fillStyle = g; c.fillRect(0, y - 40, W, 44);
        c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(0, y, W, 2);
      }

      // ---- the code: typed over the picture, one program at a time ----
      const ca = 1 - E.inQ(seg(t, SA_T.codeOut, SA_T.codeOut + 0.35));
      if (ca > 0) {
        let pi = 0; SA_P.forEach((p, i) => { if (t >= p[0]) pi = i; });
        const lines = SA_CODE[pi], total = lines.reduce((a, l) => a + l.length + 1, 0);
        const [t0, t1] = SA_P[pi], typeEnd = t1 - 0.12;
        const typed = Math.floor(total * clamp((t - t0) / (typeEnd - t0)));
        let left = typed, x0 = 70, y0 = 150;
        // previous program's lines slide up and fade as the new one is typed
        if (pi > 0) {
          const pu = E.outC(seg(t, t0, t0 + 0.35));
          SA_CODE[pi - 1].forEach((l, i) => { if (pu < 1) saLine(c, l, x0, y0 + i * 40 - pu * 60, ca * (1 - pu) * 0.6); });
        }
        let cx = x0, cy = y0;
        lines.forEach((l, i) => {
          if (left <= 0) return;
          const n = Math.min(l.length, left);
          saLine(c, l.slice(0, n), x0, y0 + i * 40, ca * (t >= t1 ? 0.92 : 1));
          c.font = '400 25px "Fira Code", monospace';
          cx = x0 + c.measureText(l.slice(0, n)).width; cy = y0 + i * 40;
          left -= l.length + 1;
        });
        // caret
        if (Math.floor(t * 3) % 2 === 0 || t < SA_P[pi][1]) { c.globalAlpha = ca; c.fillStyle = SA.ok; c.fillRect(cx + 2, cy - 24, 3, 32); c.globalAlpha = 1; }
        // header: file name and uniforms
        c.save(); c.globalAlpha = ca;
        c.fillStyle = SA.line; c.fillRect(62, 56, 600, 44);
        text(c, `fragment.glsl  ·  program ${pi + 1} / 4`, 76, 86, { font: '"Fira Code", monospace', weight: 600, size: 20, color: SA.code });
        c.fillStyle = SA.line; c.fillRect(1440, 56, 420, 118);
        [`iTime       ${t.toFixed(2)}`, `iResolution ${SA_BW}×${SA_BH}`, `frame       ${Math.floor(t * 30)}`].forEach((s, i) => text(c, s, 1460, 88 + i * 32, { font: '"Fira Code", monospace', size: 21, color: SA.code }));
        // status bar: compiling / compiled
        const compiling = t > typeEnd && t < t1, okA = cur >= 0 ? 1 - seg(t, SA_P[cur][1] + 1.4, SA_P[cur][1] + 1.8) : 0;
        c.fillStyle = SA.line; c.fillRect(62, 990, 760, 44);
        let st1 = 'waiting for input', col = SA.dim;
        if (compiling) { st1 = 'compiling…'; col = SA.num; }
        else if (cur >= 0 && t < SA_P[cur][1] + 1.8 && t >= SA_P[cur][1]) { st1 = `COMPILED OK  ·  program ${cur + 1}  ·  ${(0.4 + cur * 0.6).toFixed(1)} ms / frame`; col = SA.ok; c.globalAlpha = ca * (0.5 + 0.5 * okA); }
        else if (cur >= 0) { st1 = `running  ·  ${(0.4 + cur * 0.6).toFixed(1)} ms / frame  ·  60 fps`; col = SA.dim; }
        text(c, st1, 80, 1020, { font: '"Fira Code", monospace', weight: 600, size: 20, color: col });
        c.restore();
      }

      // ---- title ----
      const ta = E.outC(seg(t, SA_T.title, SA_T.title + 0.6));
      if (ta > 0) {
        c.save(); c.globalAlpha = ta;
        const y = 560 + (1 - ta) * 30;
        c.fillStyle = 'rgba(4,3,8,0.72)'; rrect(c, 960 - 560, y - 170, 1120, 290, 18); c.fill();
        text(c, 'SHADER ART', 960, y, { font: '"Space Grotesk", sans-serif', weight: 700, size: 150, align: 'center', color: '#fff', ls: 4 });
        text(c, 'one function, every pixel, every frame', 960, y + 62, { font: '"Space Grotesk", sans-serif', weight: 500, size: 34, align: 'center', color: 'rgba(240,238,250,0.85)' });
        text(c, 'fragColor = f(fragCoord, iTime)', 960, y + 102, { font: '"Fira Code", monospace', weight: 600, size: 22, align: 'center', color: SA.ok });
        c.restore();
      }
      vignette(c, W, H, 0.35);
    },
    score(A) {
      A.bus.gain.value = 0.85;
      const B = SA_B, at = k => SA_P[1][1] + k * B;     // beat grid anchored on the second compile
      // keyboard: soft clicks while each program is typed
      SA_P.forEach(([t0, t1], pi) => { for (let x = t0 + 0.02; x < t1 - 0.14; x += 0.055 + hash(x * 9 + pi) * 0.03) A.noise(x, { type: 'bandpass', f: 3200 + hash(x * 13) * 1800, q: 3, dur: 0.018, g: 0.05, pan: (hash(x * 5) - 0.5) * 0.5 }); });
      // compile: an up-arpeggio blip, then a short noise sweep for the wipe
      SA_P.forEach(([, t1], i) => {
        [72, 76, 79, 84].forEach((m, k) => A.osc(t1 + k * 0.035, { type: 'square', f: midi(m + (i % 2) * 2), dur: 0.06, g: 0.04 }));
        A.whoosh(t1, SA_T.wipe + 0.1, { f1: 3000, f2: 600, g: 0.05, q: 2 });
      });
      // program 1: a warm pad cycling like the gradient
      A.chord(SA_P[0][1], [57, 64, 69, 72], { type: 'triangle', dur: SA_P[1][1] - SA_P[0][1] + 0.3, g: 0.04, a: 0.5, hold: true, rel: 0.3, lp: 1600, width: 0.8, rev: 0.5 });
      // from program 2: four-on-the-floor and an offbeat saw bass (A minor, i–VI–III–VII)
      const roots = [45, 41, 48, 43];
      for (let k = 0; k < 15; k++) {
        const tt = at(k); if (tt > 9.6) break;
        A.kick(tt, 0.7);
        const m = roots[Math.floor(k / 4) % 4];
        A.osc(tt + B / 2, { type: 'sawtooth', f: midi(m), dur: B * 0.45, g: 0.1, lp: 1100, lp2: 300, lpT: B * 0.4, q: 5 });
        if (tt >= SA_P[2][1]) { A.hat(tt + B / 2, 0.07, false, { pan: 0.25 }); A.hat(tt + B / 4, 0.03, false, { pan: -0.25 }); A.hat(tt + 3 * B / 4, 0.03, false, { pan: -0.25 }); if (k % 2) A.snare(tt, 0.22, { dur: 0.12 }); }
      }
      // chip arpeggio, sixteenths, from program 2 to the end
      const chords = [[69, 72, 76], [65, 69, 72], [72, 76, 79], [67, 71, 74]];
      for (let k = 0; k < 56; k++) {
        const tt = at(0) + k * B / 4; if (tt > 9.5) break;
        const ch = chords[Math.floor(k / 16) % 4];
        A.osc(tt, { type: 'square', f: midi(ch[k % 3] + 12), dur: B * 0.2, g: tt > SA_P[2][1] ? 0.03 : 0.022, lp: 3500, pan: k % 2 ? 0.35 : -0.35, rev: 0.2 });
      }
      // program 3: a vibrato lead in long notes
      [[0, 81, 1.0], [1, 79, 0.5], [1.5, 76, 0.5], [2, 77, 1.0], [3, 76, 0.5], [3.5, 72, 0.5], [4, 74, 1.0]].forEach(([b, m, d]) => A.osc(SA_P[2][1] + b * B * 1.25, { type: 'square', f: midi(m), dur: d * B * 1.25, g: 0.035, a: 0.02, hold: true, rel: 0.05, vib: [6, 4], lp: 2500, rev: 0.35 }));
      // program 4 & title: a wide supersaw chord and a bell on the title
      A.chord(SA_P[3][1], [57, 64, 69, 72, 76], { type: 'sawtooth', dur: 2.4, g: 0.03, a: 0.3, spread: 12, lp: 2600, lp2: 900, lpT: 2.4, width: 1, rev: 0.5 });
      A.impact(SA_T.title, 0.45);
      A.chord(SA_T.title, [45, 57, 64, 69, 76], { type: 'triangle', dur: 1.4, g: 0.05, a: 0.02, width: 0.9, rev: 0.7 });
      A.bell(SA_T.title + 0.05, midi(88), { g: 0.04, dur: 1.3, rev: 0.6 });
    },
  });

  /* =====================================================================
     PUPPET ANIMATION — a stop-motion take on a tabletop miniature set,
     everything stepped at 12 fps under a faintly flickering key: the
     slate claps, a felt fox puppet in a knitted jumper and corduroys
     walks along a flat, symmetrical autumn lane and turns to camera,
     blinks with replacement eyelids and speaks through a tray of
     replacement mouths; an x-ray pass shows his steel ball-and-socket
     armature and tie-down bolt, he hops on a rig arm marked for paint-out,
     and the camera pulls back to the set, the studio and the title
     ===================================================================== */
  const FX = {
    sky0: '#24435a', sky1: '#8e7f86', sky2: '#e9b383', cloud: '#f3d8bd', moon: '#f6ead0',
    hillB: '#56614f', hillM: '#6f6a3e', hillF: '#8c7a40', card: '#cdb48a',
    fox: '#cf6429', foxD: '#9c4519', foxL: '#e88a49', cream: '#f2e5cc', creamD: '#d9c6a6', ink: '#1b1311',
    knit: '#d6a13b', knitD: '#a87a26', cord: '#6c4b33', cordD: '#4a3222', scarf: '#b3302a', scarfD: '#82211d', shoe: '#33251d',
    felt: '#61793b', feltD: '#47602b', path: '#c7a676', wood: '#b58553', woodD: '#7c5634', roof: '#7f3a2a', win: '#ffcd77',
    iron: '#221d1a', steel: '#9aa3ad', xray: 'rgba(18,40,78,0.82)', studio: '#0c0a09', ply: '#c29a6a', tape: '#e8e1cf',
  };
  const FX_FPS = 12;
  const FX_T = { clap: 0.62, slateOut: [0.85, 1.25], walk: [1.05, 3.3], turn: 3.3, blink: [3.58, 3.75], talk: [3.85, 5.45], tray: [3.6, 5.85], xray: [5.85, 7.05], hop: [7.05, 8.0], pull: [8.0, 8.85], title: 8.55 };
  const FX_X0 = -240, FX_X1 = 930, FX_Y = 772;          // fox hip: start x, stop x, standing height
  // mouth shapes swapped per 12 fps frame: 0 rest, 1 A/I, 2 E, 3 O/U, 4 M/B/P, 5 F/V
  const FX_LIP = [2, 2, 5, 2, 0, 2, 0, 0, 1, 5, 2, 0, 2, 1, 1, 2, 0, 4, 3, 1, 0, 0];
  const FX_SAY = 'Evening. Lovely night for a stroll.';
  const FX_MN = ['rest', 'A · I', 'E', 'O · U', 'M B P', 'F · V'];
  const fxQ = t => Math.floor(t * FX_FPS) / FX_FPS;     // every motion is quantised to 12 fps

  // pose of the puppet at (quantised) time t: hip position and joint angles (0 = hanging straight down)
  function fxPose(t) {
    const P = { x: FX_X1, y: FX_Y, lean: 0, thL: 0, thR: 0, knL: 0, knR: 0, shL: -0.12, shR: 0.12, elL: 0.15, elR: 0.15, tilt: 0, look: 1, blink: 0, mouth: 0, tail: 0, scarf: 0, squash: 1, air: 0, wave: 0 };
    const w = seg(t, FX_T.walk[0], FX_T.walk[1]);
    // walk: constant pace then a two-frame settle, one stride per 0.5 s
    const dist = (FX_X1 - FX_X0) * (w < 0.85 ? w / 0.85 * 0.93 : 0.93 + 0.07 * E.outQ((w - 0.85) / 0.15));
    P.x = FX_X0 + dist;
    if (w > 0 && w < 1) {
      const ph = (dist / 200) * PI, amp = w < 0.9 ? 1 : 1 - (w - 0.9) / 0.1;
      P.thL = Math.sin(ph) * 0.42 * amp; P.thR = -P.thL;
      P.knL = Math.max(0, Math.sin(ph - 1.3)) * 0.75 * amp; P.knR = Math.max(0, Math.sin(ph - 1.3 + PI)) * 0.75 * amp;
      P.shL = Math.sin(ph) * 0.4 * amp - 0.1; P.shR = Math.sin(ph) * 0.4 * amp + 0.1;
      P.y = FX_Y - Math.abs(Math.cos(ph)) * 7 * amp; P.lean = 0.05 * amp;
      P.tail = Math.sin(ph * 0.5) * 0.18; P.scarf = Math.sin(ph) * 0.5 + 0.6; P.look = 0.35;
    }
    // head turns to camera, then blinks
    P.look = t < FX_T.walk[1] ? 0.35 : lerp(0.35, 1, clamp((t - FX_T.turn) / 0.25));
    P.tilt = t > FX_T.turn && t < FX_T.talk[1] ? Math.sin((t - FX_T.turn) * 2.4) * 0.06 : 0;
    if (t >= FX_T.blink[0] && t < FX_T.blink[1]) P.blink = 1;
    if (t >= 6.55 && t < 6.66) P.blink = 1;
    // talk: replacement mouths frame by frame, a little gesture with the near arm
    if (t >= FX_T.talk[0] && t < FX_T.talk[1]) {
      const f = Math.floor((t - FX_T.talk[0]) * FX_FPS);
      P.mouth = FX_LIP[Math.min(FX_LIP.length - 1, Math.floor(f * FX_LIP.length / ((FX_T.talk[1] - FX_T.talk[0]) * FX_FPS)))];
      const g = Math.sin(seg(t, FX_T.talk[0], FX_T.talk[1]) * PI);
      P.shR = 0.12 + g * 0.8; P.elR = 0.15 + g * 1.3; P.tilt += Math.sin(t * 5) * 0.03;
    }
    // hop on the rig: anticipation squash, airborne, land and settle
    if (t >= FX_T.hop[0] && t < FX_T.hop[1]) {
      const u = (t - FX_T.hop[0]) / (FX_T.hop[1] - FX_T.hop[0]);
      if (u < 0.15) { P.squash = 1 - 0.12 * (u / 0.15); P.knL = P.knR = 0.5 * (u / 0.15); }
      else if (u < 0.72) { const a = (u - 0.15) / 0.57; P.air = Math.sin(a * PI) * 120; P.squash = 1.06; P.thL = 0.35; P.thR = -0.2; P.knL = 0.8; P.knR = 0.5; P.shL = -2.0; P.shR = 2.0; P.elL = P.elR = 0.35; P.tail = 0.4; P.scarf = 1.2; }
      else { const a = (u - 0.72) / 0.28; P.squash = 1 - 0.1 * Math.sin(a * PI); P.knL = P.knR = 0.45 * Math.sin(a * PI); }
    }
    // final wave
    if (t >= FX_T.title - 0.2) { const a = clamp((t - FX_T.title + 0.2) / 0.3); P.shR = lerp(0.12, 2.2, a); P.elR = lerp(0.15, 0.55 + Math.sin(t * 9) * 0.5, a); P.wave = a; }
    if (t > FX_T.walk[1]) P.tail = Math.sin(t * 2.2) * 0.12;
    return P;
  }
  // joint positions (hip-local) from a pose; shared by the puppet and its x-ray armature
  function fxJoints(P) {
    const leg = (hx, th, kn) => { const k = [hx + Math.sin(th) * 72, Math.cos(th) * 72]; const a = th - kn; return [[hx, 0], k, [k[0] + Math.sin(a) * 72, k[1] + Math.cos(a) * 72]]; };
    const arm = (sx, sh, el) => { const sy = -138, e = [sx + Math.sin(sh) * 58, sy + Math.cos(sh) * 58]; const a = sh + el * Math.sign(sx); return [[sx, sy], e, [e[0] + Math.sin(a) * 54, e[1] + Math.cos(a) * 54]]; };
    return { L: leg(-18, P.thL, P.knL), R: leg(18, P.thR, P.knR), AL: arm(-50, P.shL, P.elL), AR: arm(50, P.shR, P.elR), neck: [0, -168], head: [0, -238] };
  }
  const fxTube = (g, pts, w, col, cap = 'round') => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = cap; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); };

  // replacement mouth piece, centred at origin, about 44 px wide
  function fxMouth(g, k) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    const dark = '#3b1512';
    if (k === 0) { g.strokeStyle = FX.ink; g.lineWidth = 3.2; g.beginPath(); g.moveTo(-15, -2); g.quadraticCurveTo(-7, 6, 0, -1); g.quadraticCurveTo(7, 6, 15, -2); g.stroke(); return; }
    if (k === 4) { g.fillStyle = '#7a3020'; rrect(g, -15, -4, 30, 8, 4); g.fill(); g.strokeStyle = FX.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(-15, 0); g.lineTo(15, 0); g.stroke(); return; }
    g.fillStyle = dark; g.beginPath();
    if (k === 1) g.ellipse(0, 4, 16, 13, 0, 0, TAU);
    else if (k === 2) { g.moveTo(-20, -2); g.quadraticCurveTo(0, -6, 20, -2); g.quadraticCurveTo(0, 14, -20, -2); }
    else if (k === 3) g.ellipse(0, 3, 9, 10, 0, 0, TAU);
    else g.ellipse(0, 2, 15, 7, 0, 0, TAU);
    g.fill();
    if (k === 1) { g.fillStyle = '#d0656a'; g.beginPath(); g.ellipse(0, 11, 9, 5, 0, 0, TAU); g.fill(); }
    if (k === 2 || k === 5) { g.fillStyle = '#fbf6ec'; g.beginPath(); g.rect(k === 2 ? -15 : -10, -3, k === 2 ? 30 : 20, k === 2 ? 5 : 6); g.fill(); }
    if (k === 5) { g.strokeStyle = '#7a3020'; g.lineWidth = 3; g.beginPath(); g.moveTo(-13, 6); g.quadraticCurveTo(0, 10, 13, 6); g.stroke(); }
    g.strokeStyle = FX.ink; g.lineWidth = 1.6; g.stroke();
  }
  // the fox's head, centre at origin; look 0.35 = three-quarter, 1 = to camera
  function fxHead(g, P, f) {
    const sx = (P.look - 1) * 26;                       // facial features slide toward the walking direction
    // ears, with dark felt tips
    [-1, 1].forEach(s => {
      g.fillStyle = FX.fox; g.beginPath(); g.moveTo(s * 30, -52); g.quadraticCurveTo(s * 78, -110, s * 66, -150); g.quadraticCurveTo(s * 36, -112, s * 8, -64); g.closePath(); g.fill();
      g.fillStyle = FX.ink; g.beginPath(); g.moveTo(s * 66, -150); g.quadraticCurveTo(s * 60, -130, s * 52, -122); g.lineTo(s * 70, -124); g.closePath(); g.fill();
      g.fillStyle = FX.creamD; g.beginPath(); g.moveTo(s * 30, -62); g.quadraticCurveTo(s * 60, -104, s * 60, -128); g.quadraticCurveTo(s * 40, -100, s * 18, -66); g.closePath(); g.fill();
    });
    // skull: broad brow, fluffed cheeks, tapering muzzle
    const head = () => { g.beginPath(); g.moveTo(-64, -30); g.bezierCurveTo(-60, -74, 60, -74, 64, -30); g.bezierCurveTo(80, -10, 96, 14, 84, 22); g.bezierCurveTo(60, 46, 34 + sx * 0.4, 74, sx, 86); g.bezierCurveTo(-34 + sx * 0.4, 74, -60, 46, -84, 22); g.bezierCurveTo(-96, 14, -80, -10, -64, -30); g.closePath(); };
    head(); g.fillStyle = FX.fox; g.fill();
    // shading: a warm key from the right
    g.save(); head(); g.clip();
    const sh = g.createLinearGradient(-90, 0, 90, 0); sh.addColorStop(0, 'rgba(70,25,5,0.32)'); sh.addColorStop(0.55, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(255,200,140,0.18)');
    g.fillStyle = sh; g.fillRect(-100, -80, 200, 180);
    // white cheeks and muzzle
    g.fillStyle = FX.cream; g.beginPath(); g.moveTo(-86, 18); g.bezierCurveTo(-50, 4, -26 + sx, 18, sx, 30); g.bezierCurveTo(26 + sx, 18, 50, 4, 86, 18); g.bezierCurveTo(60, 50, 30 + sx * 0.4, 80, sx, 90); g.bezierCurveTo(-30 + sx * 0.4, 80, -60, 50, -86, 18); g.fill();
    g.restore();
    // cheek fur tufts: re-teased by hand between frames, so they "boil"
    g.fillStyle = FX.cream;
    [-1, 1].forEach(s => { for (let k = 0; k < 4; k++) { const j = (hash(f * 3.1 + k + s * 9) - 0.5) * 6, y = 6 + k * 9; g.beginPath(); g.moveTo(s * (78 - k * 3), y - 6); g.lineTo(s * (98 - k * 4) + j, y + 2 + j * 0.5); g.lineTo(s * (74 - k * 4), y + 6); g.closePath(); g.fill(); } });
    g.fillStyle = FX.fox;
    for (let k = 0; k < 5; k++) { const j = (hash(f * 7.7 + k) - 0.5) * 5, x = -30 + k * 15; g.beginPath(); g.moveTo(x - 7, -60); g.lineTo(x + j, -76 - hash(k + f) * 4); g.lineTo(x + 7, -60); g.closePath(); g.fill(); }
    // eyes: glass beads with replacement lids
    [-1, 1].forEach(s => {
      const ex = s * 30 + sx * (s > 0 ? 0.8 : 1.1), ey = -12;
      g.fillStyle = '#f7efe0'; g.beginPath(); g.ellipse(ex, ey, 13, 12, 0, 0, TAU); g.fill();
      g.fillStyle = '#2a170e'; g.beginPath(); g.arc(ex + sx * 0.12 + 1, ey + 1, 8.5, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(ex + 4, ey - 3, 2.6, 0, TAU); g.fill();
      if (P.blink) { g.fillStyle = FX.foxD; g.beginPath(); g.ellipse(ex, ey, 14, 13, 0, 0, TAU); g.fill(); g.strokeStyle = FX.ink; g.lineWidth = 2.5; g.beginPath(); g.moveTo(ex - 12, ey + 3); g.quadraticCurveTo(ex, ey + 8, ex + 12, ey + 3); g.stroke(); }
      else { g.fillStyle = FX.fox; g.beginPath(); g.ellipse(ex, ey - 9, 15, 6, 0, PI, TAU); g.fill(); }
      // brows: two felt strips
      g.strokeStyle = FX.foxD; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(ex - 12 * s, ey - 22 - (P.mouth ? 3 : 0)); g.lineTo(ex + 10 * s, ey - 26 - (P.mouth ? 4 : 0)); g.stroke();
    });
    // nose bead and replacement mouth
    g.fillStyle = FX.ink; g.beginPath(); g.ellipse(sx * 1.1, 44, 13, 9.5, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(sx * 1.1 + 4, 40, 4, 2.4, -0.3, 0, TAU); g.fill();
    g.save(); g.translate(sx * 0.9, 64); g.scale(0.85, 0.85); fxMouth(g, P.mouth); g.restore();
  }
  // the whole puppet into its own canvas: hip at (350, 520)
  function fxPuppet(g, P, f, tex) {
    const J = fxJoints(P);
    g.save(); g.clearRect(0, 0, 700, 760); g.translate(350, 520); g.scale(1 / Math.sqrt(P.squash), P.squash); g.rotate(P.lean);
    // tail: bushy, wired so it holds a curve
    g.save(); g.translate(-30, -20); g.rotate(-0.4 + P.tail);
    g.fillStyle = FX.fox; g.beginPath(); g.moveTo(0, -12); g.bezierCurveTo(-70, -60, -150, -40, -190, 10); g.bezierCurveTo(-150, 40, -60, 40, 0, 14); g.closePath(); g.fill();
    g.fillStyle = FX.cream; g.beginPath(); g.moveTo(-150, -26); g.bezierCurveTo(-170, -20, -186, -4, -190, 10); g.bezierCurveTo(-176, 22, -160, 24, -140, 20); g.quadraticCurveTo(-158, 0, -150, -26); g.fill();
    g.fillStyle = FX.foxD; for (let k = 0; k < 4; k++) { const j = (hash(f + k * 3) - 0.5) * 8; g.beginPath(); g.moveTo(-40 - k * 28, -34 + k * 2); g.lineTo(-52 - k * 28 + j, -46 + k * 2 + j); g.lineTo(-60 - k * 28, -30 + k * 2); g.fill(); }
    g.restore();
    // far limbs first (a shade darker), then torso, then near limbs
    const legDraw = (Lg, col, shoe) => {
      fxTube(g, Lg, 34, col);
      g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1.5;
      for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(Lg[0][0] + k * 6, Lg[0][1]); g.lineTo(Lg[1][0] + k * 6, Lg[1][1]); g.lineTo(Lg[2][0] + k * 5, Lg[2][1] - 10); g.stroke(); }
      const a = Lg[2];
      g.fillStyle = shoe; g.beginPath(); g.ellipse(a[0] + 14, a[1] + 8, 30, 13, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.beginPath(); g.ellipse(a[0] + 20, a[1] + 3, 14, 4, 0, 0, TAU); g.fill();
    };
    const armDraw = (Ar, col) => {
      fxTube(g, Ar.slice(0, 2).concat([[lerp(Ar[1][0], Ar[2][0], 0.82), lerp(Ar[1][1], Ar[2][1], 0.82)]]), 28, col);
      g.fillStyle = FX.foxD; g.beginPath(); g.arc(Ar[2][0], Ar[2][1], 14, 0, TAU); g.fill();
      g.fillStyle = FX.knitD; const c = [lerp(Ar[1][0], Ar[2][0], 0.8), lerp(Ar[1][1], Ar[2][1], 0.8)]; g.beginPath(); g.arc(c[0], c[1], 15, 0, TAU); g.fill();
    };
    legDraw(J.L, FX.cordD, '#2a1d16'); armDraw(J.AL, FX.knitD);
    legDraw(J.R, FX.cord, FX.shoe);
    // jumper: knitted, with ribbed hem and a cable down the front
    const body = () => { g.beginPath(); g.moveTo(-52, -150); g.bezierCurveTo(-62, -90, -66, -30, -56, 10); g.quadraticCurveTo(0, 22, 56, 10); g.bezierCurveTo(66, -30, 62, -90, 52, -150); g.quadraticCurveTo(0, -166, -52, -150); g.closePath(); };
    body(); g.fillStyle = FX.knit; g.fill();
    g.save(); body(); g.clip();
    const bs = g.createLinearGradient(-60, 0, 60, 0); bs.addColorStop(0, 'rgba(60,30,0,0.35)'); bs.addColorStop(0.6, 'rgba(0,0,0,0)'); bs.addColorStop(1, 'rgba(255,220,150,0.18)');
    g.fillStyle = bs; g.fillRect(-70, -170, 140, 200);
    g.strokeStyle = 'rgba(110,70,10,0.45)'; g.lineWidth = 2;
    for (let y = -140; y < 0; y += 9) [-14, 14].forEach(x => { g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x, y + 5); g.lineTo(x + 6, y); g.stroke(); });
    for (let x = -60; x < 60; x += 6) { g.beginPath(); g.moveTo(x, -8); g.lineTo(x, 16); g.stroke(); }
    g.restore();
    // scarf: red knit, the loose end lifts as he moves
    g.fillStyle = FX.scarf; rrect(g, -50, -172, 100, 30, 14); g.fill();
    g.save(); g.translate(26, -150); g.rotate(-0.15 - P.scarf * 0.5);
    g.fillStyle = FX.scarfD; rrect(g, -12, 0, 24, 92, 6); g.fill();
    g.strokeStyle = FX.cream; g.lineWidth = 3; [30, 44].forEach(y => { g.beginPath(); g.moveTo(-12, y); g.lineTo(12, y); g.stroke(); });
    for (let k = 0; k < 5; k++) { g.strokeStyle = FX.scarfD; g.lineWidth = 3; g.beginPath(); g.moveTo(-10 + k * 5, 92); g.lineTo(-10 + k * 5 + (hash(f + k) - 0.5) * 4, 104); g.stroke(); }
    g.restore();
    g.strokeStyle = 'rgba(80,10,10,0.4)'; g.lineWidth = 2; for (let x = -44; x < 48; x += 8) { g.beginPath(); g.moveTo(x, -168); g.lineTo(x + 3, -146); g.stroke(); }
    // head
    g.save(); g.translate(J.head[0], J.head[1]); g.rotate(P.tilt); fxHead(g, P, f); g.restore();
    armDraw(J.AR, FX.knit);
    g.restore();
    // felt and wool texture over everything, re-laid each frame (the boil of handled fabric)
    g.save(); g.globalCompositeOperation = 'source-atop'; g.globalAlpha = 0.55;
    g.translate(-((hash(f) * 128) | 0), -((hash(f + 3) * 128) | 0)); g.fillStyle = tex; g.fillRect(0, 0, 900, 900); g.restore();
    return J;
  }
  // steel ball-and-socket armature, drawn in world space over the x-ray silhouette
  function fxArmature(c, J, P, ox, oy) {
    c.save(); c.translate(ox, oy); c.scale(1 / Math.sqrt(P.squash), P.squash); c.rotate(P.lean);
    const rod = pts => { fxTube(c, pts, 9, '#5d6670'); fxTube(c, pts, 3, '#d5dce3'); };
    const ball = (p, r = 10) => { const gr = c.createRadialGradient(p[0] - r * 0.3, p[1] - r * 0.4, 1, p[0], p[1], r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.4, FX.steel); gr.addColorStop(1, '#3d444c'); c.fillStyle = gr; c.beginPath(); c.arc(p[0], p[1], r, 0, TAU); c.fill(); };
    rod([[0, 0], J.neck]); rod([J.AL[0], J.AR[0]]); rod([[-18, 0], [18, 0]]);
    [J.L, J.R, J.AL, J.AR].forEach(l => rod(l));
    rod([J.neck, J.head]);
    // skull plate and jaw hinge
    c.strokeStyle = '#c9d1d9'; c.lineWidth = 3; c.beginPath(); c.ellipse(J.head[0], J.head[1], 52, 44, 0, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(200,210,220,0.18)'; c.fill();
    // tail wire
    c.strokeStyle = '#b9a36a'; c.lineWidth = 3; c.beginPath(); c.moveTo(-30, -20); c.quadraticCurveTo(-110, -40 + P.tail * 60, -180, -10 + P.tail * 90); c.stroke();
    [[0, 0], J.neck, J.head, ...[J.L, J.R, J.AL, J.AR].flat()].forEach(p => ball(p, 9));
    // feet plates with tie-down bolts running down through the set floor
    [J.L[2], J.R[2]].forEach(a => {
      c.fillStyle = '#7d868f'; rrect(c, a[0] - 8, a[1] + 8, 46, 9, 3); c.fill();
      if (P.air < 1) { c.fillStyle = '#c4ccd4'; c.fillRect(a[0] + 10, a[1] + 16, 6, 46); for (let y = a[1] + 20; y < a[1] + 60; y += 5) { c.fillStyle = '#5d6670'; c.fillRect(a[0] + 9, y, 8, 1.6); } c.fillStyle = '#9aa3ad'; c.beginPath(); c.moveTo(a[0] - 4, a[1] + 62); c.lineTo(a[0] + 30, a[1] + 62); c.lineTo(a[0] + 22, a[1] + 70); c.lineTo(a[0] + 4, a[1] + 70); c.closePath(); c.fill(); }
    });
    c.restore();
  }

  // the static miniature set, pre-rendered once: world coordinates offset by FX_O inside a larger canvas
  const FX_O = [220, 160], FX_SW = 1920 + 440, FX_SH = 1080 + 360;
  function fxBuildSet(st) {
    const cv = offscreen(FX_SW, FX_SH), g = cv.getContext('2d'), r = rng(2009);
    g.translate(FX_O[0], FX_O[1]);
    // painted backdrop on a curved flat: dusk gradient, brushy clouds, paper moon (rendered soft: it's far behind)
    const bd = offscreen(FX_SW, FX_SH), b = bd.getContext('2d'); b.translate(FX_O[0], FX_O[1]);
    const sky = b.createLinearGradient(0, -60, 0, 700); sky.addColorStop(0, FX.sky0); sky.addColorStop(0.55, FX.sky1); sky.addColorStop(1, FX.sky2);
    b.fillStyle = sky; b.fillRect(-90, -70, 2100, 860);
    for (let k = 0; k < 900; k++) { const x = -90 + r() * 2100, y = -60 + r() * 760; b.strokeStyle = `rgba(${r() < 0.5 ? '255,235,210' : '30,40,60'},${0.04 + r() * 0.05})`; b.lineWidth = 3 + r() * 6; b.beginPath(); b.moveTo(x, y); b.lineTo(x + 20 + r() * 40, y + (r() - 0.5) * 8); b.stroke(); }
    [[300, 150, 1.2], [760, 90, 0.9], [1500, 170, 1.4], [1820, 80, 0.8]].forEach(([x, y, s]) => { b.fillStyle = 'rgba(243,216,189,0.55)'; for (let k = 0; k < 7; k++) { b.beginPath(); b.ellipse(x + (k - 3) * 38 * s, y + Math.sin(k * 1.7) * 10 * s, 50 * s, 22 * s, 0, 0, TAU); b.fill(); } });
    b.fillStyle = FX.moon; b.beginPath(); b.arc(1240, 170, 62, 0, TAU); b.fill();
    b.fillStyle = 'rgba(190,170,140,0.35)'; [[1222, 158, 12], [1262, 186, 9], [1236, 196, 6]].forEach(([x, y, rr]) => { b.beginPath(); b.arc(x, y, rr, 0, TAU); b.fill(); });
    // far cardboard hills with felt pompom trees
    const hill = (y0, col, seed, amp) => { const rr = rng(seed); b.beginPath(); b.moveTo(-90, 800); for (let x = -90; x <= 2010; x += 30) b.lineTo(x, y0 - amp * (0.5 + 0.5 * Math.sin(x * 0.004 + seed)) - rr() * 4); b.lineTo(2010, 800); b.closePath(); b.fillStyle = col; b.fill(); b.strokeStyle = FX.card; b.lineWidth = 3; b.stroke(); };
    hill(560, FX.hillB, 3, 120);
    for (let k = 0; k < 26; k++) { const x = -60 + k * 80 + r() * 40, y = 520 + r() * 60, rr = 16 + r() * 14; b.fillStyle = FX.woodD; b.fillRect(x - 2, y, 4, 40); b.fillStyle = ['#a8552a', '#c47a2c', '#8a3f22', '#b8932f'][k % 4]; b.beginPath(); b.arc(x, y, rr, 0, TAU); b.fill(); }
    hill(650, FX.hillM, 7, 70);
    g.save(); g.filter = 'blur(3px)'; g.drawImage(bd, -FX_O[0], -FX_O[1]); g.restore();
    // midground: hill, trees, house — crisp, with cardboard edges
    g.beginPath(); g.moveTo(-90, 820); for (let x = -90; x <= 2010; x += 30) g.lineTo(x, 700 - 40 * Math.sin(x * 0.003 + 1.4)); g.lineTo(2010, 820); g.closePath(); g.fillStyle = FX.hillF; g.fill(); g.strokeStyle = FX.card; g.lineWidth = 3; g.stroke();
    // big felt trees on dowels, left and right (symmetrical framing)
    [[120, 470, 120, '#b4562a'], [330, 540, 80, '#c98a2e'], [1790, 470, 120, '#9a4423'], [1590, 550, 74, '#c47a2c']].forEach(([x, y, rr, col]) => {
      g.fillStyle = FX.woodD; g.fillRect(x - 7, y, 14, 330); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x + 2, y, 5, 330);
      for (let k = 0; k < 9; k++) { const a = k / 9 * TAU, d = k ? rr * 0.55 : 0; g.fillStyle = k % 3 ? col : FX.foxD; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8 - 10, rr * (k ? 0.55 : 0.7), 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(255,220,160,0.16)'; g.beginPath(); g.arc(x + rr * 0.3, y - rr * 0.35, rr * 0.5, 0, TAU); g.fill();
    });
    // the balsa house: clapboard, shingles, round window, door, chimney
    const HX = 1160, HY = 470, HW = 330, HH = 300;
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(HX + 12, HY + 12, HW, HH);
    g.fillStyle = FX.wood; g.fillRect(HX, HY, HW, HH);
    for (let y = HY + 18; y < HY + HH; y += 18) { g.fillStyle = 'rgba(80,45,20,0.35)'; g.fillRect(HX, y, HW, 2); g.fillStyle = 'rgba(255,230,190,0.16)'; g.fillRect(HX, y + 2, HW, 2); }
    g.fillStyle = FX.roof; g.beginPath(); g.moveTo(HX - 30, HY + 6); g.lineTo(HX + HW / 2, HY - 150); g.lineTo(HX + HW + 30, HY + 6); g.closePath(); g.fill();
    g.save(); g.clip();
    for (let row = 0; row < 9; row++) for (let k = -1; k < 20; k++) { const y = HY - 150 + row * 18, x = HX - 30 + k * 22 + (row % 2) * 11; g.fillStyle = `rgba(${row % 2 ? '60,20,10' : '150,70,45'},0.4)`; g.fillRect(x, y, 20, 16); }
    g.restore();
    g.fillStyle = '#5a2a1c'; g.fillRect(HX + 230, HY - 150, 40, 90); g.fillStyle = '#3a1c12'; g.fillRect(HX + 224, HY - 158, 52, 12);
    g.fillStyle = FX.woodD; g.fillRect(HX + 40, HY + 140, 76, 160); g.fillStyle = '#5c3b22'; g.fillRect(HX + 46, HY + 146, 64, 154);
    g.fillStyle = '#e4b24c'; g.beginPath(); g.arc(HX + 100, HY + 226, 5, 0, TAU); g.fill();
    // fence of wooden pickets across the lane, broken for the path
    for (let x = -40; x < 1960; x += 46) {
      if (x > 560 && x < 1120) continue;
      g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x + 6, 712, 24, 108);
      g.fillStyle = '#d9c7a4'; g.beginPath(); g.moveTo(x, 820); g.lineTo(x, 716); g.lineTo(x + 12, 702); g.lineTo(x + 24, 716); g.lineTo(x + 24, 820); g.closePath(); g.fill();
      g.fillStyle = 'rgba(120,90,50,0.25)'; g.fillRect(x + 16, 716, 8, 104);
    }
    g.fillStyle = '#cbb894'; g.fillRect(-40, 740, 600, 12); g.fillRect(1120, 740, 840, 12); g.fillRect(-40, 790, 600, 12); g.fillRect(1120, 790, 840, 12);
    // lamp post (iron), the glow is drawn live
    g.save(); g.translate(-406, 0);
    g.fillStyle = FX.iron; g.fillRect(1040, 470, 12, 400); g.fillRect(1026, 860, 40, 14);
    g.beginPath(); g.moveTo(1022, 470); g.lineTo(1070, 470); g.lineTo(1060, 420); g.lineTo(1032, 420); g.closePath(); g.fill();
    g.fillStyle = '#ffd98a'; g.fillRect(1034, 428, 24, 38);
    g.fillStyle = FX.iron; g.beginPath(); g.moveTo(1026, 422); g.lineTo(1046, 400); g.lineTo(1066, 422); g.closePath(); g.fill();
    g.restore();
    // ground: felt flock, sand path, pebbles; the set's front edge
    const gr = g.createLinearGradient(0, 800, 0, 1000); gr.addColorStop(0, FX.feltD); gr.addColorStop(1, FX.felt);
    g.fillStyle = gr; g.fillRect(-90, 800, 2100, 300);
    g.fillStyle = FX.path; g.beginPath(); g.moveTo(-90, 860); g.bezierCurveTo(600, 830, 1300, 830, 2010, 860); g.lineTo(2010, 930); g.bezierCurveTo(1300, 905, 600, 905, -90, 930); g.closePath(); g.fill();
    for (let k = 0; k < 3600; k++) { const x = -90 + r() * 2100, y = 800 + r() * 300; g.fillStyle = r() < 0.5 ? 'rgba(30,45,15,0.25)' : 'rgba(190,210,120,0.18)'; g.fillRect(x, y, 2, 2 + r() * 3); }
    for (let k = 0; k < 40; k++) { const x = -60 + r() * 2040, y = 850 + r() * 70; g.fillStyle = ['#8d8476', '#a89d8c', '#6e665c'][k % 3]; g.beginPath(); g.ellipse(x, y, 5 + r() * 6, 3 + r() * 3, 0, 0, TAU); g.fill(); }
    // plywood platform edge and gaffer-tape label (seen only when the camera pulls back)
    g.fillStyle = FX.ply; g.fillRect(-90, 1100, 2100, 46);
    g.fillStyle = 'rgba(90,60,30,0.4)'; for (let x = -90; x < 2010; x += 7) g.fillRect(x, 1100 + (hash(x) * 40) | 0, 6, 1.5);
    g.fillStyle = '#2b2622'; g.fillRect(-90, 1146, 2100, 14);
    g.fillStyle = FX.tape; g.save(); g.translate(240, 1112); g.rotate(-0.02); g.fillRect(0, 0, 230, 26); g.restore();
    text(g, 'SET 4 · LANE', 256, 1132, { font: '"Permanent Marker", cursive', size: 20, color: '#2a2520' });
    st.set = cv;
  }
  // a felt / wool fibre tile used over the puppet
  function fxFeltTile() {
    const c = offscreen(256, 256), g = c.getContext('2d'), r = rng(77);
    g.lineCap = 'round';
    for (let k = 0; k < 2200; k++) { const x = r() * 256, y = r() * 256, a = r() * TAU, l = 3 + r() * 9; g.strokeStyle = r() < 0.55 ? `rgba(40,20,5,${0.1 + r() * 0.15})` : `rgba(255,240,215,${0.08 + r() * 0.14})`; g.lineWidth = 0.6 + r() * 0.9; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    return c;
  }

  MG.film({
    id: 'puppet', dur: 10, poster: 4.3,
    fonts: [['700 60px Jost', 'PUPPET ANIMATION'], ['500 30px Jost', 'Evening. Lovely night for a stroll. felt wood steel armature 12 fps on twos'], ['400 30px Jost', 'FRAME 0123456789 / · REPLACEMENT MOUTHS'], ['400 40px "Permanent Marker"', 'PUPPET ANIMATION SCENE TAKE FPS SET 4 LANE PAINT OUT'], ['400 40px Rye', 'SC 4']],
    meta: {
      family: 'F', name: 'Puppet Animation', sub: 'Stop-motion puppets on a miniature set', era: '1910s —',
      origin: 'Puppet animation poses jointed figures on a miniature set and shoots them one frame at a time, so a body built of wood, wire, felt and silicone appears to live. Władysław Starewicz pioneered it in the 1910s, Jiří Trnka made Czech puppet film an art form from the late 1940s with carved wooden figures whose fixed faces act through light and posture, and studios such as Laika and Wes Anderson\'s crews later combined steel ball-and-socket armatures, furred and knitted costumes and libraries of replacement faces.',
      works: 'Władysław Starewicz — The Cameraman\'s Revenge (1912) · Jiří Trnka — The Emperor\'s Nightingale (1949), A Midsummer Night\'s Dream (1959), The Hand (1965) · Henry Selick / Laika — Coraline (2009) · Wes Anderson — Fantastic Mr. Fox (2009) · Laika — Kubo and the Two Strings (2016)',
      tech: ['12 fps stepped posing', 'Replacement mouths & eyelids', 'Ball-and-socket armature'],
      accent: '#cf6429',
      motionDNA: 'Everything moves in held steps at 12 frames a second: a walk clicks from pose to pose, the head snaps between angles, mouths and eyelids swap whole pieces from a tray, fur and felt boil slightly where hands touched them, a hop is held up by a rig arm, and the key light flickers by a percent from frame to frame.',
      visualDNA: 'A planimetric, symmetrical tabletop set in autumn oranges and mustards — painted dusk backdrop, cardboard hills, pompom felt trees on dowels, a balsa house with a lit window, a sand lane on green flock — and a felt fox puppet in a knitted jumper, scarf and corduroys with glass-bead eyes, then its steel armature in an x-ray pass.',
      transitions: 'Slate clap, stepped walk-in, head turn, mouth-tray insert, x-ray wipe to the armature, rig-arm hop, pull back to the set edge and studio',
      implementation: ['Dragonframe stop-motion capture', 'Ball-and-socket armatures, 3D-printed replacement faces', 'Nuke rig removal', 'Canvas 2D'],
      reproducibility: 'Needs a built puppet and set (this film is a procedural homage)',
      loopable: false,
    },
    setup() {
      const st = {};
      fxBuildSet(st);
      st.pc = offscreen(700, 760); st.pg = st.pc.getContext('2d');
      st.sc = offscreen(700, 760); st.sg = st.sc.getContext('2d');
      st.tex = st.pg.createPattern(fxFeltTile(), 'repeat');
      const r = rng(1949);
      st.leaves = Array.from({ length: 9 }, () => ({ x: 100 + r() * 1700, t0: r() * 6, sp: 60 + r() * 50, col: ['#b4562a', '#c98a2e', '#8a3f22'][Math.floor(r() * 3)], rot: r() * TAU }));
      return st;
    },
    draw(c, t, W, H, st) {
      const tq = fxQ(t), f = Math.floor(t * FX_FPS);
      const P = fxPose(tq);
      // camera: locked off, then a stepped pull back to show the set and the studio
      const pu = E.ioS(clamp((tq - FX_T.pull[0]) / (FX_T.pull[1] - FX_T.pull[0])));
      const z = lerp(1, 0.68, pu), cy = lerp(540, 490, pu);
      c.fillStyle = FX.studio; c.fillRect(0, 0, W, H);
      c.save(); c.translate(960, cy); c.scale(z, z); c.translate(-960, -540);
      if (pu > 0) {
        // studio: light stands, a hanging fresnel, black drape
        c.fillStyle = '#1a1614'; c.fillRect(-1400, -600, 4720, 650);
        [[-170, 1], [2090, -1]].forEach(([x, s]) => { c.fillStyle = '#2b2522'; c.fillRect(x - 5, 80, 10, 980); c.beginPath(); c.moveTo(x, 1040); c.lineTo(x - 90, 1120); c.lineTo(x + 90, 1120); c.closePath(); c.strokeStyle = '#2b2522'; c.lineWidth = 8; c.stroke(); c.fillStyle = '#3a332e'; rrect(c, x - 60 * s - 40, 40, 80, 60, 8); c.fill(); c.fillStyle = 'rgba(255,220,170,0.75)'; c.beginPath(); c.ellipse(x + 20 * s, 70, 8, 22, 0, 0, TAU); c.fill(); });
        c.fillStyle = '#2b2522'; c.fillRect(940, -400, 10, 330); c.fillStyle = '#3a332e'; rrect(c, 900, -90, 90, 50, 8); c.fill();
      }
      c.drawImage(st.set, -FX_O[0], -FX_O[1]);
      // live set dressing: the window glows (a candle inside), lamp pool, chimney smoke of cotton wool
      const win = 0.85 + 0.15 * hash(f * 1.7);
      c.save(); c.globalCompositeOperation = 'lighter';
      let gl = c.createRadialGradient(640, 446, 4, 640, 446, 220); gl.addColorStop(0, `rgba(255,210,130,${0.4 * win})`); gl.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = gl; c.fillRect(390, 220, 500, 500);
      gl = c.createRadialGradient(640, 870, 10, 640, 870, 260); gl.addColorStop(0, 'rgba(255,200,120,0.22)'); gl.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = gl; c.save(); c.translate(0, 870); c.scale(1, 0.3); c.translate(0, -870); c.fillRect(370, 600, 540, 540); c.restore();
      c.restore();
      c.fillStyle = `rgba(255,${190 + 20 * win | 0},110,1)`; c.beginPath(); c.arc(1380, 560, 44, 0, TAU); c.fill();
      c.strokeStyle = FX.woodD; c.lineWidth = 8; c.beginPath(); c.arc(1380, 560, 46, 0, TAU); c.moveTo(1334, 560); c.lineTo(1426, 560); c.moveTo(1380, 514); c.lineTo(1380, 606); c.stroke();
      for (let k = 0; k < 5; k++) {
        const age = ((tq * 0.5 + k / 5) % 1), x = 1410 + age * 70 + Math.sin(k * 2.3 + age * 4) * 10, y = 300 - age * 260, rr = 18 + age * 30;
        c.fillStyle = `rgba(240,236,228,${0.85 * (1 - age)})`;
        for (let q = 0; q < 4; q++) { c.beginPath(); c.arc(x + Math.cos(q * 1.7 + k) * rr * 0.5, y + Math.sin(q * 2.1 + k) * rr * 0.35, rr * 0.6, 0, TAU); c.fill(); }
      }
      // paper leaves hung on fine wire, drifting down one step at a time
      st.leaves.forEach((l, i) => {
        const a = ((tq + l.t0) % 6) / 6, y = -40 + a * 900, x = l.x + Math.sin(a * 9 + i) * 40;
        c.save(); c.translate(x, y); c.rotate(l.rot + a * 5); c.fillStyle = l.col; c.beginPath(); c.moveTo(0, -12); c.quadraticCurveTo(10, 0, 0, 12); c.quadraticCurveTo(-10, 0, 0, -12); c.fill(); c.restore();
      });

      // ---- the puppet ----
      const J = fxPuppet(st.pg, P, f, st.tex);
      const hx = P.x, hy = P.y - P.air;
      // contact shadow on the flock, shrinking when airborne
      const shA = 1 - P.air / 200;
      c.fillStyle = `rgba(20,15,5,${0.38 * shA})`; c.beginPath(); c.ellipse(hx + 14, FX_Y + 162, 110 * shA + 20, 18 * shA + 4, 0, 0, TAU); c.fill();
      // rig arm (behind the puppet), clamped to its back during the hop
      const rigA = tq >= FX_T.hop[0] - 0.1 && tq < FX_T.hop[1] - 0.05;
      if (rigA) {
        const ax = hx - 6, ay = hy - 100;
        c.strokeStyle = '#151311'; c.lineCap = 'round'; c.lineWidth = 14; c.beginPath(); c.moveTo(hx + 520, -80); c.lineTo(hx + 300, ay - 210); c.lineTo(ax + 20, ay); c.stroke();
        c.fillStyle = '#3a3632'; c.beginPath(); c.arc(hx + 300, ay - 210, 16, 0, TAU); c.fill();
        c.fillStyle = '#6b6560'; rrect(c, ax - 2, ay - 16, 40, 32, 6); c.fill();
      }
      c.drawImage(st.pc, hx - 350, hy - 520);
      // x-ray pass: a lightbox band sweeps across and shows the armature inside
      const xr0 = hx - 300, xr1 = hx + 300;
      const R = lerp(xr0, xr1, E.ioS(clamp((tq - FX_T.xray[0]) / 0.5))), L = lerp(xr0, xr1, E.ioS(clamp((tq - FX_T.xray[1] + 0.5) / 0.5)));
      if (tq >= FX_T.xray[0] && R > L) {
        const sg = st.sg; sg.clearRect(0, 0, 700, 760); sg.globalCompositeOperation = 'source-over'; sg.drawImage(st.pc, 0, 0);
        sg.globalCompositeOperation = 'source-in'; sg.fillStyle = FX.xray; sg.fillRect(0, 0, 700, 760); sg.globalCompositeOperation = 'source-over';
        c.save(); c.beginPath(); c.rect(L, 0, R - L, H); c.clip();
        c.fillStyle = 'rgba(10,25,45,0.35)'; c.fillRect(L, 0, R - L, H);
        c.drawImage(st.sc, hx - 350, hy - 520);
        fxArmature(c, J, P, hx, hy);
        c.restore();
        c.fillStyle = 'rgba(160,220,255,0.85)'; if (R < xr1) c.fillRect(R - 2, 0, 3, H); if (L > xr0) c.fillRect(L - 1, 0, 3, H);
      }
      // rig paint-out mask
      if (rigA) {
        // the roto mask a compositor would draw over the rod, to be painted out
        const ax = hx - 6, ay = hy - 100;
        c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
        const rodPath = () => { c.beginPath(); c.moveTo(hx + 520, -80); c.lineTo(hx + 300, ay - 210); c.lineTo(ax + 20, ay); };
        rodPath(); c.strokeStyle = 'rgba(255,79,163,0.3)'; c.lineWidth = 60; c.stroke();
        rodPath(); c.setLineDash([12, 10]); c.strokeStyle = '#ff4fa3'; c.lineWidth = 2.5; c.stroke();
        c.restore();
        c.fillStyle = '#ff4fa3'; rrect(c, hx + 330, hy - 300, 250, 40, 6); c.fill();
        text(c, 'RIG · PAINT OUT', hx + 455, hy - 272, { font: 'Jost, sans-serif', weight: 700, size: 22, align: 'center', color: '#fff', ls: 2 });
      }
      c.restore();

      // ---- the slate, clapped in front of the lens, then pulled out ----
      const so = E.inQ(clamp((tq - FX_T.slateOut[0]) / (FX_T.slateOut[1] - FX_T.slateOut[0])));
      if (so < 1) {
        c.save(); c.translate(960 - so * 200, 600 - so * 1100); c.rotate(-0.04 - so * 0.2);
        c.fillStyle = 'rgba(0,0,0,0.4)'; rrect(c, -500, -260, 1000, 600, 18); c.fill();
        c.fillStyle = '#1c1c1d'; rrect(c, -520, -280, 1040, 580, 16); c.fill();
        c.strokeStyle = 'rgba(240,240,235,0.85)'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(-490, -110); c.lineTo(490, -110); c.moveTo(-490, 40); c.lineTo(490, 40); c.moveTo(0, -110); c.lineTo(0, 40); c.moveTo(-490, 180); c.lineTo(490, 180); c.stroke();
        const ch = (s, x, y, sz, al = 'left') => text(c, s, x, y, { font: '"Permanent Marker", cursive', size: sz, align: al, color: 'rgba(245,244,238,0.92)' });
        ch('PUPPET ANIMATION', 0, -160, 64, 'center');
        text(c, 'SCENE', -470, -76, { font: 'Jost, sans-serif', weight: 500, size: 22, color: 'rgba(245,244,238,0.6)', ls: 3 });
        text(c, 'TAKE', 30, -76, { font: 'Jost, sans-serif', weight: 500, size: 22, color: 'rgba(245,244,238,0.6)', ls: 3 });
        ch('4', -250, 16, 96, 'center'); ch('2', 250, 16, 96, 'center');
        text(c, 'FPS', -470, 80, { font: 'Jost, sans-serif', weight: 500, size: 22, color: 'rgba(245,244,238,0.6)', ls: 3 });
        ch('12 · on twos', -380, 150, 52); ch('SET 4 · LANE', 470, 150, 40, 'right');
        text(c, 'stop motion · one frame at a time', 0, 250, { font: 'Jost, sans-serif', weight: 500, size: 26, align: 'center', color: 'rgba(245,244,238,0.55)', ls: 2 });
        // clapper sticks: open, then snap shut on the clap
        const open = tq < FX_T.clap ? 0.32 - 0.1 * Math.sin(tq * 8) * (tq > 0.3 ? 1 : 0) : 0;
        [[-280, 0], [-360, open]].forEach(([y, a], i) => {
          c.save(); c.translate(-520, y); c.rotate(-a);
          c.fillStyle = '#f4f2ec'; c.fillRect(0, 0, 1040, 70);
          c.fillStyle = '#1c1c1d'; for (let k = 0; k < 9; k++) { c.beginPath(); c.moveTo(k * 130 + 20, 0); c.lineTo(k * 130 + 85, 0); c.lineTo(k * 130 + 45, 70); c.lineTo(k * 130 - 20, 70); c.closePath(); c.fill(); }
          c.restore();
        });
        c.fillStyle = '#9aa3ad'; c.beginPath(); c.arc(-500, -290, 14, 0, TAU); c.fill();
        c.restore();
      }

      // ---- inserts and captions ----
      // replacement-mouth tray (top right)
      const ta = clamp((tq - FX_T.tray[0]) / 0.17) * (1 - clamp((tq - FX_T.tray[1] + 0.17) / 0.17));
      if (ta > 0) {
        c.save(); c.globalAlpha = ta;
        const X = 1404, Y = 58;
        c.fillStyle = 'rgba(0,0,0,0.35)'; rrect(c, X + 8, Y + 10, 460, 310, 14); c.fill();
        c.fillStyle = '#c9a878'; rrect(c, X, Y, 460, 310, 14); c.fill();
        c.fillStyle = 'rgba(80,50,20,0.25)'; for (let k = 0; k < 30; k++) c.fillRect(X + 10, Y + 14 + k * 10, 440, 1.5);
        text(c, 'REPLACEMENT MOUTHS', X + 230, Y + 40, { font: 'Jost, sans-serif', weight: 700, size: 22, align: 'center', color: '#3a2716', ls: 3 });
        FX_MN.forEach((nm, i) => {
          const cx = X + 82 + (i % 3) * 148, cy = Y + 112 + Math.floor(i / 3) * 112, on = P.mouth === i && tq >= FX_T.talk[0] && tq < FX_T.talk[1];
          c.fillStyle = '#e8d6b4'; rrect(c, cx - 62, cy - 44, 124, 90, 10); c.fill();
          c.fillStyle = FX.cream; c.beginPath(); c.ellipse(cx, cy - 4, 46, 30, 0, 0, TAU); c.fill();
          c.save(); c.translate(cx, cy - 6); c.scale(1.15, 1.15); fxMouth(c, i); c.restore();
          text(c, nm, cx, cy + 38, { font: 'Jost, sans-serif', weight: 500, size: 17, align: 'center', color: '#5a4026', ls: 1 });
          if (on) { c.strokeStyle = '#b3302a'; c.lineWidth = 5; rrect(c, cx - 64, cy - 46, 128, 94, 12); c.stroke(); }
          else if (i === 0 && !(tq >= FX_T.talk[0] && tq < FX_T.talk[1])) { c.strokeStyle = 'rgba(179,48,42,0.5)'; c.lineWidth = 3; rrect(c, cx - 64, cy - 46, 128, 94, 12); c.stroke(); }
        });
        c.restore();
      }
      // subtitle for the line
      if (tq >= FX_T.talk[0] && tq < FX_T.talk[1] + 0.3) {
        c.save(); c.font = '500 40px Jost, sans-serif'; const tw = c.measureText(FX_SAY).width;
        c.fillStyle = 'rgba(12,9,6,0.6)'; rrect(c, 960 - tw / 2 - 24, 968, tw + 48, 62, 8); c.fill();
        text(c, FX_SAY, 960 - tw / 2, 1012, { font: 'Jost, sans-serif', weight: 500, size: 40, color: '#f6efe2' });
        c.restore();
      }
      // production notes (lower left), one per beat of the film
      const notes = [[1.3, 3.25, 'WALK CYCLE', 'posed and shot one frame at a time · held for 2 frames'], [5.9, 7.0, 'BALL-AND-SOCKET ARMATURE', 'steel joints hold every pose · feet bolted to the set'], [7.05, 7.95, 'RIG ARM', 'supports the jump · removed frame by frame in post']];
      notes.forEach(([a, b, h1, h2]) => {
        const u = clamp((tq - a) / 0.17) * (1 - clamp((tq - b + 0.17) / 0.17)); if (u <= 0) return;
        c.save(); c.globalAlpha = u;
        c.fillStyle = 'rgba(14,10,7,0.72)'; rrect(c, 60, 936, 760, 96, 8); c.fill();
        c.fillStyle = FX.fox; c.fillRect(60, 936, 6, 96);
        text(c, h1, 88, 974, { font: 'Jost, sans-serif', weight: 700, size: 24, color: '#f6efe2', ls: 3 });
        text(c, h2, 88, 1010, { font: 'Jost, sans-serif', weight: 400, size: 24, color: 'rgba(246,239,226,0.8)' });
        c.restore();
      });
      // title, under the set once the camera has pulled back
      const tt = clamp((tq - FX_T.title) / 0.34);
      if (tt > 0) {
        c.save(); c.globalAlpha = tt;
        text(c, 'PUPPET ANIMATION', 960, 1008, { font: 'Jost, sans-serif', weight: 700, size: 58, align: 'center', color: '#f3e6cf', ls: 14 });
        text(c, 'felt, wood & a steel armature · twelve frames a second', 960, 1050, { font: 'Jost, sans-serif', weight: 400, size: 26, align: 'center', color: 'rgba(243,230,207,0.7)', ls: 2 });
        c.restore();
      }
      // frame counter: the animator's exposure count
      if (so >= 1 && tt <= 0) {
        c.fillStyle = 'rgba(12,9,6,0.55)'; rrect(c, 56, 52, 300, 44, 6); c.fill();
        c.fillStyle = '#e8443a'; c.beginPath(); c.arc(80, 74, 7, 0, TAU); c.fill();
        text(c, `12 FPS · FRAME ${String(f).padStart(3, '0')}`, 98, 82, { font: 'Jost, sans-serif', weight: 500, size: 22, color: '#f6efe2', ls: 2 });
      }
      // per-frame exposure flicker of the practical lights, never more than a few percent
      const fl = (hash(f * 3.7) - 0.5) * 0.06;
      c.fillStyle = fl > 0 ? `rgba(255,236,210,${fl})` : `rgba(0,0,0,${-fl})`; c.fillRect(0, 0, W, H);
      grain(c, W, H, tq, 0.04, 'overlay');
      vignette(c, W, H, 0.5, '20,10,0');
    },
    score(A) {
      A.bus.gain.value = 1.45;
      const B = 0.5;
      // slate: chalky clack and room tone
      A.noise(0.0, { type: 'lowpass', f: 500, dur: 10, g: 0.018, hold: true, rel: 0.5 });
      A.noise(FX_T.clap, { type: 'bandpass', f: 2200, q: 1.5, dur: 0.06, g: 0.4 });
      A.osc(FX_T.clap, { type: 'triangle', f: 320, f2: 180, dur: 0.08, g: 0.2 });
      // footsteps on the flock, one per stride, and a woodblock pulse
      for (let k = 0; k < 5; k++) { const tt = FX_T.walk[0] + 0.25 + k * 0.45; A.noise(tt, { type: 'lowpass', f: 700, dur: 0.07, g: 0.16 }); A.osc(tt, { type: 'sine', f: 110, f2: 70, dur: 0.08, g: 0.12 }); }
      // a jaunty banjo-and-pizzicato tune in G (plucked strings), whistled melody on top
      const mel = [[1.0, 67], [1.25, 71], [1.5, 74], [2.0, 72], [2.25, 71], [2.5, 69], [3.0, 71], [3.25, 67]];
      mel.forEach(([tt, m]) => A.pluck(tt, midi(m), { g: 0.2, dur: 1.0, bright: 0.85, decay: 0.993, pan: 0.25, rev: 0.25 }));
      const bass = [[1.0, 43], [1.5, 50], [2.0, 45], [2.5, 52], [3.0, 43], [3.5, 50], [4.0, 48], [4.5, 50], [5.0, 43], [5.5, 47], [6.0, 45], [6.5, 50], [7.0, 43]];
      bass.forEach(([tt, m]) => A.pluck(tt, midi(m), { g: 0.26, dur: 0.6, bright: 0.4, decay: 0.985, lp: 900, pan: -0.15 }));
      for (let k = 2; k < 14; k++) A.noise(k * B + 0.25, { type: 'bandpass', f: 1250, q: 9, dur: 0.05, g: 0.08, pan: 0.3 });
      // blink: a tiny wooden click; the line is "spoken" by a muted clarinet-like voice
      A.noise(FX_T.blink[0], { type: 'bandpass', f: 4000, q: 6, dur: 0.02, g: 0.08 });
      [[3.85, 76, 0.25], [4.1, 74, 0.2], [4.3, 72, 0.25], [4.6, 74, 0.2], [4.8, 79, 0.35], [5.15, 76, 0.3]].forEach(([tt, m, d]) => A.osc(tt, { type: 'triangle', f: midi(m), dur: d, g: 0.06, a: 0.03, hold: true, rel: 0.05, vib: [5, 3], lp: 2000, rev: 0.3 }));
      // x-ray: a soft electric hum and a glassy shimmer
      A.osc(FX_T.xray[0], { type: 'sawtooth', f: 60, dur: 1.2, g: 0.03, a: 0.2, hold: true, rel: 0.2, lp: 400 });
      A.whoosh(FX_T.xray[0], 0.6, { f1: 600, f2: 4000, g: 0.06 });
      A.whoosh(FX_T.xray[1] - 0.5, 0.6, { f1: 4000, f2: 600, g: 0.05 });
      [83, 86, 90].forEach((m, i) => A.bell(FX_T.xray[0] + 0.3 + i * 0.12, midi(m), { g: 0.025, dur: 0.9, rev: 0.6 }));
      // hop: springy rise, wooden landing
      A.osc(FX_T.hop[0] + 0.15, { type: 'sine', f: 220, f2: 660, glide: 0.25, dur: 0.3, g: 0.08 });
      A.noise(FX_T.hop[0] + 0.68, { type: 'lowpass', f: 900, dur: 0.1, g: 0.22 }); A.osc(FX_T.hop[0] + 0.68, { type: 'sine', f: 120, f2: 60, dur: 0.15, g: 0.18 });
      // pull back: the tune returns with a full chord and a little bell
      [[8.0, 67], [8.25, 71], [8.5, 74], [8.75, 79]].forEach(([tt, m]) => A.pluck(tt, midi(m), { g: 0.2, dur: 1.4, bright: 0.8, decay: 0.994, pan: 0.2, rev: 0.35 }));
      A.chord(8.6, [55, 59, 62, 67, 71], { type: 'triangle', dur: 1.4, g: 0.04, a: 0.05, width: 0.8, rev: 0.6 });
      A.pluck(8.6, midi(43), { g: 0.3, dur: 1.4, bright: 0.4, lp: 900 });
      A.bell(8.65, midi(91), { g: 0.04, dur: 1.3, rev: 0.6 });
    },
  });
})();
