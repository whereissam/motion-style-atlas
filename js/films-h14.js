/* batch h14 — Experimental & Generative · Analog & Physical: Physarum · Harmonograph · Light Painting.
   physarum (Jones-style agent slime mould growing a transport network between oat flakes on a map of Greater Tokyo) ·
   harmonograph (a twin-elliptic pendulum drawing a damped rosette in ink on card) ·
   lightpainting (one long exposure: an LED wand, a steel-wool spin and a word written in the air). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, rng, hash, vnoise, midi, text, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;600&family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&family=Archivo:wght@300;500;700&display=block');
  const PI = Math.PI;
  const DMS = '"DM Serif Display", Georgia, serif', JBM = '"JetBrains Mono", monospace';
  const FELL = '"IM Fell English", Georgia, serif', FELLSC = '"IM Fell English SC", Georgia, serif', ARC = 'Archivo, sans-serif';

  /* ---------------- shared helpers ---------------- */
  // Paper tile: warm mottling and fine tooth (card stock).
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
     PHYSARUM — Tero et al.'s Tokyo experiment, re-run with Jeff Jones's
     agent model: oat flakes are laid on dark agar at the positions of the
     cities around Tokyo, the mould is inoculated at Tokyo itself, and a
     population of agents that sense, turn, step and deposit grows outward
     as a fan-shaped foraging front; the trail map diffuses and decays, the
     weak paths starve, and what survives is a veined network of tubes
     linking the flakes, pulsing with shuttle streaming; a minimum spanning
     tree is laid over it for comparison
     ===================================================================== */
  const PH = { agar: '#16120a', agarE: '#0a0806', sea: '#05080b', coast: 'rgba(150,178,196,', gold: '#f4c431', flake: '#dcc79b', flakeD: '#8c7448', ink: '#efe6cc', cyan: '#7fd8ec' };
  const PH_T = { flakes: [0.05, 0.85], sim: [0.65, 8.35], pulse: [5.4, 6.4], mst: [7.9, 8.8], title: 8.55 };
  const PH_GW = 480, PH_GH = 270, PH_SC = 4;                   // trail map: 480×270, shown ×4
  const PH_STEPS = 600, PH_KS = 4, PH_NK = PH_STEPS / PH_KS + 1; // sim steps, one keyframe every 4 steps
  const PH_NA = 30000, PH_NS = 1800, PH_TONE = 24, PH_HOURS = 26;
  const PH_GROW = 300, PH_EDGE = 4, PH_PRUNE = [300, 380, 0.02, 12], PH_FLOOR = 6000;   // growth steps, edge bias, [start, full, rate, trail threshold], population floor
  // [name, u, v, labelled] — a schematic Kantō: Tokyo first (the inoculum)
  const PH_FOOD = [
    ['TOKYO', 0.555, 0.56, 1], ['YOKOHAMA', 0.512, 0.69, 1], ['KAWASAKI', 0.532, 0.625, 0], ['CHIBA', 0.648, 0.648, 1], ['FUNABASHI', 0.617, 0.575, 0],
    ['OMIYA', 0.52, 0.40, 1], ['KAWAGOE', 0.43, 0.41, 0], ['TOKOROZAWA', 0.445, 0.485, 0], ['TACHIKAWA', 0.385, 0.545, 0], ['HACHIOJI', 0.315, 0.565, 1],
    ['MACHIDA', 0.42, 0.635, 0], ['FUJISAWA', 0.435, 0.765, 0], ['HIRATSUKA', 0.345, 0.775, 0], ['ODAWARA', 0.282, 0.79, 1], ['YOKOSUKA', 0.522, 0.845, 0],
    ['KISARAZU', 0.675, 0.79, 0], ['MOBARA', 0.758, 0.705, 0], ['SAKURA', 0.728, 0.565, 0], ['NARITA', 0.785, 0.47, 1], ['KASHIWA', 0.622, 0.445, 0],
    ['KASUKABE', 0.578, 0.34, 0], ['TSUKUBA', 0.665, 0.25, 1], ['KUMAGAYA', 0.385, 0.235, 0], ['OME', 0.292, 0.455, 0], ['ATSUGI', 0.355, 0.68, 0],
  ];
  // simulation step shown at film time t (slightly front-loaded so the early growth reads)
  const phStep = t => { const u = seg(t, PH_T.sim[0], PH_T.sim[1]); return PH_STEPS * lerp(u, E.outQ(u), 0.35); };
  // the coast: Tokyo Bay, Sagami Bay and the Pacific are "illuminated" — agents cannot enter
  function phSea(u, v) {
    const n = vnoise(u * 26 + v * 9, 3) * 0.009 + vnoise(v * 33 - u * 4, 8) * 0.006;
    if (u > 0.95 - 0.13 * clamp((v - 0.25) / 0.6) + n) return true;
    if (v > 0.955 + n) return true;
    if (v > 0.845 + 1.2 * (u - 0.33) * (u - 0.33) + n) return true;          // Sagami Bay
    if (v > 0.585) {
      const cx = 0.572 + (v - 0.6) * 0.09, w = 0.018 + 0.036 * seg(v, 0.6, 0.78) - 0.032 * seg(v, 0.8, 0.87) + 0.07 * seg(v, 0.9, 1);
      if (Math.abs(u - cx) < w + n) return true;
    }
    return false;
  }

  // Jones (2010): each agent senses the trail ahead-left, ahead and ahead-right, turns toward the strongest,
  // steps forward if the cell is free and deposits; the map is then diffused (3×3 mean) and decayed.
  function phSim(st) {
    const GW = PH_GW, GH = PH_GH, N = GW * GH, r = rng(2010);
    const land = new Uint8Array(N);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) land[j * GW + i] = phSea((i + 0.5) / GW, (j + 0.5) / GH) ? 0 : 1;
    const T = new Float32Array(N), tmp = new Float32Array(N), occ = new Uint8Array(N);
    const food = PH_FOOD.map(([name, u, v, lab]) => ({ name, lab, x: u * GW, y: v * GH }));
    const fcells = [];
    food.forEach(f => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 5) fcells.push(((f.y | 0) + dy) * GW + (f.x | 0) + dx); });
    const NA = PH_NA, ax = new Float32Array(NA), ay = new Float32Array(NA), ah = new Uint8Array(NA), alive = new Uint8Array(NA);
    let n = 0;
    const add = (x, y) => {
      if (n >= NA || x < 1 || y < 1 || x >= GW - 1 || y >= GH - 1) return false;
      const k = (y | 0) * GW + (x | 0);
      if (!land[k] || occ[k]) return false;
      ax[n] = x; ay[n] = y; ah[n] = (r() * 64) | 0; alive[n] = 1; occ[k] = 1; n++;
      return true;
    };
    const tk = food[0];
    for (let q = 0; q < 6000 && n < 500; q++) { const a = r() * TAU, d = Math.sqrt(r()) * 9; add(tk.x + Math.cos(a) * d, tk.y + Math.sin(a) * d); }
    // headings are quantised to 64 directions so the trig is a table lookup; sensor and turn angles are 45°
    const CO = new Float32Array(64), SI = new Float32Array(64);
    for (let i = 0; i < 64; i++) { CO[i] = Math.cos(i / 64 * TAU); SI[i] = Math.sin(i / 64 * TAU); }
    const SA = 8, RA = 8, SD = 9, DEP = 5, DEC = 0.9, FD = 7;
    const sense = (x, y) => { const i = x | 0, j = y | 0; if (i < 0 || j < 0 || i >= GW || j >= GH) return -10; const k = j * GW + i; return land[k] ? T[k] : -10; };
    const keys = [], samp = [], pop = [];
    const tone = new Uint8Array(4096);
    for (let i = 0; i < 4096; i++) tone[i] = Math.round(255 * (1 - Math.exp(-(i / 16) / PH_TONE)));
    const store = () => {
      const a = new Uint8Array(N);
      for (let k = 0; k < N; k++) { const v = T[k] * 16; a[k] = tone[v > 4095 ? 4095 : v | 0]; }
      keys.push(a);
      const sp = new Int16Array(PH_NS * 2).fill(-1);
      for (let q = 0; q < PH_NS; q++) { const a = q * 16; if (a < n && alive[a]) { sp[q * 2] = Math.round(ax[a] * 8); sp[q * 2 + 1] = Math.round(ay[a] * 8); } }
      samp.push(sp);
      let c = 0; for (let q = 0; q < n; q++) c += alive[q];
      pop.push(c);
      // a flake counts as reached once the colony occupies cells next to it
      food.forEach(f => { if (f.reach !== undefined) return; const k = (f.y | 0) * GW + (f.x | 0); for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (occ[k + dy * GW + dx]) { f.reach = keys.length - 1; return; } });
    };
    const ring = []; for (let a = 0; a < 12; a++) ring.push(Math.round(Math.sin(a / 12 * TAU) * 4) * GW + Math.round(Math.cos(a / 12 * TAU) * 4));
    let live = n;
    for (let s = 0; s <= PH_STEPS; s++) {
      if (s % PH_KS === 0) store();
      live = 0; for (let q = 0; q < n; q++) live += alive[q];
      if (s === PH_STEPS) break;
      // growth: new agents bud from random members of the colony
      // (budding favours the colony's edge: of a few random members, the one with the emptiest surroundings)
      const target = s < PH_GROW ? 300 + (NA - 300) * E.ioS(s / PH_GROW) : 0;
      for (let tries = 0; n < target && tries < 4000; tries++) {
        let j = -1, dj = 99;
        for (let m = 0; m < PH_EDGE; m++) {
          const q = (r() * n) | 0; if (!alive[q]) continue;
          const k = (ay[q] | 0) * GW + (ax[q] | 0); let d = 0;
          for (const o of ring) d += occ[k + o] || !land[k + o] ? 1 : 0;
          if (d < dj) { dj = d; j = q; }
        }
        if (j < 0) continue;
        const a = r() * TAU; add(ax[j] + Math.cos(a) * 1.5, ay[j] + Math.sin(a) * 1.5);
      }
      // shrinkage: agents stranded on weak trail die back, so the foam thins to tubes
      if (s > PH_PRUNE[0] && live > PH_FLOOR) {
        const p = PH_PRUNE[2] * seg(s, PH_PRUNE[0], PH_PRUNE[1]);
        for (let q = 0; q < n; q++) if (alive[q]) { const k = (ay[q] | 0) * GW + (ax[q] | 0); if (T[k] < PH_PRUNE[3] && r() < p) { alive[q] = 0; occ[k] = 0; live--; } }
      }
      // motor + sensory stage
      for (let q = 0; q < n; q++) {
        if (!alive[q]) continue;
        let h = ah[q]; const x = ax[q], y = ay[q], hl = (h - SA) & 63, hr = (h + SA) & 63;
        const F = sense(x + CO[h] * SD, y + SI[h] * SD);
        const FL = sense(x + CO[hl] * SD, y + SI[hl] * SD);
        const FR = sense(x + CO[hr] * SD, y + SI[hr] * SD);
        if (F > FL && F > FR) { /* keep heading */ } else if (F < FL && F < FR) h = (h + (r() < 0.5 ? -RA : RA)) & 63;
        else if (FL > FR) h = (h - RA) & 63; else if (FR > FL) h = (h + RA) & 63;
        const nx = x + CO[h], ny = y + SI[h];
        const k0 = (y | 0) * GW + (x | 0), k1 = (ny | 0) * GW + (nx | 0);
        if (nx < 1 || ny < 1 || nx >= GW - 1 || ny >= GH - 1 || !land[k1] || (k1 !== k0 && occ[k1])) { ah[q] = (r() * 64) | 0; continue; }
        occ[k0] = 0; occ[k1] = 1; ax[q] = nx; ay[q] = ny; ah[q] = h; T[k1] += DEP;
      }
      // diffuse (separable 3×3 mean) and decay; the sea stays empty
      for (let j = 0; j < GH; j++) {
        const o = j * GW;
        tmp[o] = (T[o] * 2 + T[o + 1]) / 3; tmp[o + GW - 1] = (T[o + GW - 1] * 2 + T[o + GW - 2]) / 3;
        for (let i = 1; i < GW - 1; i++) tmp[o + i] = (T[o + i - 1] + T[o + i] + T[o + i + 1]) / 3;
      }
      for (let j = 0; j < GH; j++) {
        const o = j * GW, up = j > 0 ? o - GW : o, dn = j < GH - 1 ? o + GW : o;
        for (let i = 0; i < GW; i++) T[o + i] = land[o + i] ? (tmp[up + i] + tmp[o + i] + tmp[dn + i]) / 3 * DEC : 0;
      }
      // the oat flakes keep projecting nutrient into the map
      for (const k of fcells) if (land[k]) T[k] += FD;
    }
    st.land = land; st.keys = keys; st.samp = samp; st.pop = pop; st.food = food;
  }

  function phFlake(c, x, y, sc, pts, a) {
    c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(sc, sc);
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px + 2, py + 3) : c.moveTo(px + 2, py + 3))); c.closePath(); c.fill();
    c.fillStyle = PH.flake; c.strokeStyle = PH.flakeD; c.lineWidth = 1.5;
    c.beginPath(); pts.forEach(([px, py], i) => (i ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(140,116,72,0.55)'; c.lineWidth = 1; c.beginPath(); c.moveTo(pts[0][0] * 0.5, pts[0][1] * 0.5); c.lineTo(pts[4][0] * 0.5, pts[4][1] * 0.5); c.stroke();
    c.restore();
  }

  MG.film({
    id: 'physarum', dur: 10, poster: 8.9,
    fonts: [['400 112px "DM Serif Display"', 'Physarum'], ['italic 400 30px "DM Serif Display"', 'a slime mould grows a rail network after Tero et al. Science 2010 Tokyo Bay Sagami Pacific'], ['400 16px "JetBrains Mono"', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 ·/—.h'], ['600 16px "JetBrains Mono"', 'PHYSARUM POLYCEPHALUM']],
    meta: {
      family: 'E', name: 'Physarum', sub: 'Slime-mould transport networks', era: '2010 —',
      origin: 'In 2010 Atsushi Tero and colleagues placed oat flakes on agar at the positions of the cities around Tokyo, inoculated Physarum polycephalum at Tokyo, and watched the mould grow a network of tubes as efficient and fault-tolerant as the real rail system. The same year Jeff Jones published a minimal agent model of it: thousands of particles that sense a chemical trail ahead of them, turn toward it, step and deposit, while the trail map diffuses and decays. Generative artists such as Sage Jenson took that model up as a drawing machine, and its veined, self-pruning networks became a recognisable generative look.',
      works: 'Toshiyuki Nakagaki, Hiroyasu Yamada & Ágota Tóth — "Maze-solving by an amoeboid organism", Nature 2000 · Jeff Jones — "Characteristics of Pattern Formation and Evolution in Approximations of Physarum Transport Networks", Artificial Life 2010 · Atsushi Tero et al. — "Rules for Biologically Inspired Adaptive Network Design", Science 2010 · Sage Jenson — 36 Points (2019)',
      tech: ['Sense–turn–deposit agents', 'Diffuse & decay trail map', 'Precomputed keyframes'],
      accent: '#f4c431',
      motionDNA: 'Growth, not animation: a dense fan-shaped front spreads from the inoculum, finds the food, then the foam of paths coarsens and starves until only a few thick tubes remain, pulsing with slow waves of shuttle streaming.',
      visualDNA: 'Chrome-yellow plasmodium glowing on dark agar, soft diffused veins with brighter cores, pale oat flakes as nodes, a schematic coastline, lab-notebook mono labels and a thin cyan comparison graph.',
      transitions: 'Flakes laid, inoculation, foraging front, network pruning, streaming pulse, comparison overlay and title',
      implementation: ['Compute shaders (GLSL / WebGPU)', 'Processing / openFrameworks', 'TouchDesigner', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const st = {};
      phSim(st);
      const GW = PH_GW, GH = PH_GH, N = GW * GH;
      st.tc = offscreen(GW, GH); st.tg = st.tc.getContext('2d');
      st.timg = st.tg.createImageData(GW, GH); st.u32 = new Uint32Array(st.timg.data.buffer);
      st.gc = offscreen(160, 90); st.gg = st.gc.getContext('2d');
      // colour ramp: dim ochre → chrome yellow → pale cream core
      const ramp = [[0, [0, 0, 0]], [0.1, [30, 17, 3]], [0.3, [120, 70, 8]], [0.55, [226, 160, 30]], [0.75, [250, 206, 70]], [0.9, [255, 238, 170]], [1, [255, 252, 236]]];
      st.lut = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = i / 255; let k = 1; while (k < ramp.length - 1 && ramp[k][0] < x) k++;
        const [x0, c0] = ramp[k - 1], [x1, c1] = ramp[k], u = clamp((x - x0) / (x1 - x0));
        const R = lerp(c0[0], c1[0], u) | 0, G = lerp(c0[1], c1[1], u) | 0, B = lerp(c0[2], c1[2], u) | 0;
        st.lut[i] = (255 << 24) | (B << 16) | (G << 8) | R;
      }
      const tk = st.food[0];
      st.dist = new Float32Array(N);
      for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) st.dist[j * GW + i] = Math.hypot(i - tk.x, j - tk.y) * 0.1;
      // agar plate: land mask with a soft coast, upscaled
      const mc = offscreen(GW, GH), mg = mc.getContext('2d'), mi = mg.createImageData(GW, GH);
      for (let k = 0; k < N; k++) {
        const L = st.land[k], i = k % GW, j = (k / GW) | 0;
        const edge = L && ((i > 0 && !st.land[k - 1]) || (i < GW - 1 && !st.land[k + 1]) || (j > 0 && !st.land[k - GW]) || (j < GH - 1 && !st.land[k + GW]));
        const o = k * 4;
        if (edge) { mi.data[o] = 64; mi.data[o + 1] = 70; mi.data[o + 2] = 66; }
        else if (L) { mi.data[o] = 24; mi.data[o + 1] = 19; mi.data[o + 2] = 11; }
        else { mi.data[o] = 6; mi.data[o + 1] = 9; mi.data[o + 2] = 13; }
        mi.data[o + 3] = 255;
      }
      mg.putImageData(mi, 0, 0);
      const bg = offscreen(1920, 1080), b = bg.getContext('2d'), r = rng(77);
      b.imageSmoothingEnabled = true; b.imageSmoothingQuality = 'high';
      b.filter = 'blur(3px)'; b.drawImage(mc, 0, 0, 1920, 1080); b.filter = 'none';
      const lg = b.createRadialGradient(1060, 560, 120, 960, 540, 1150);
      lg.addColorStop(0, 'rgba(70,52,20,0.22)'); lg.addColorStop(1, 'rgba(0,0,0,0.5)');
      b.fillStyle = lg; b.fillRect(0, 0, 1920, 1080);
      // agar texture: micro-specks and a few trapped bubbles
      for (let k = 0; k < 14000; k++) { b.fillStyle = r() < 0.5 ? 'rgba(255,230,180,0.035)' : 'rgba(0,0,0,0.12)'; b.fillRect(r() * 1920, r() * 1080, 1 + r() * 2, 1 + r() * 2); }
      for (let k = 0; k < 26; k++) { const x = r() * 1920, y = r() * 1080, rr = 3 + r() * 9; b.strokeStyle = 'rgba(220,210,180,0.08)'; b.lineWidth = 1.2; b.beginPath(); b.arc(x, y, rr, 0, TAU); b.stroke(); b.fillStyle = 'rgba(255,250,230,0.08)'; b.beginPath(); b.arc(x - rr * 0.35, y - rr * 0.35, rr * 0.25, 0, TAU); b.fill(); }
      // faint survey grid
      b.strokeStyle = 'rgba(150,178,196,0.05)'; b.lineWidth = 1;
      for (let x = 0; x <= 1920; x += 120) { b.beginPath(); b.moveTo(x, 0); b.lineTo(x, 1080); b.stroke(); }
      for (let y = 0; y <= 1080; y += 120) { b.beginPath(); b.moveTo(0, y); b.lineTo(1920, y); b.stroke(); }
      st.bg = bg;
      // oat flakes: irregular ovals, each with its own seeded outline
      st.food.forEach((f, i) => {
        const rr = rng(300 + i), a0 = rr() * TAU, el = 0.65 + rr() * 0.2, R = 11 + rr() * 4;
        f.pts = Array.from({ length: 9 }, (_, q) => { const a = q / 9 * TAU, R2 = R * (0.85 + rr() * 0.3); const x = Math.cos(a) * R2, y = Math.sin(a) * R2 * el; return [x * Math.cos(a0) - y * Math.sin(a0), x * Math.sin(a0) + y * Math.cos(a0)]; });
        f.at = PH_T.flakes[0] + (i === 0 ? 0 : 0.08 + hash(i * 3.7) * 0.7);
        f.k = (f.y | 0) * PH_GW + (f.x | 0);
      });
      // Prim's minimum spanning tree over the flakes (for the comparison overlay)
      const F = st.food, inT = F.map((_, i) => i === 0), edges = [];
      for (let e = 1; e < F.length; e++) {
        let best = 1e9, bi = -1, bj = -1;
        for (let i = 0; i < F.length; i++) if (inT[i]) for (let j = 0; j < F.length; j++) if (!inT[j]) { const d = Math.hypot(F[i].x - F[j].x, F[i].y - F[j].y); if (d < best) { best = d; bi = i; bj = j; } }
        inT[bj] = true; edges.push([bi, bj]);
      }
      st.mst = edges;
      return st;
    },
    draw(c, t, W, H, st) {
      c.drawImage(st.bg, 0, 0);
      const s = phStep(t), kx = s / PH_KS, i0 = Math.min(PH_NK - 2, Math.floor(kx)), f = clamp(kx - i0);
      const A0 = st.keys[i0], A1 = st.keys[i0 + 1], U = st.u32, L = st.lut, D = st.dist;
      // shuttle streaming: once the network settles, a slow peristaltic wave runs outward from Tokyo
      const pa = 0.3 * E.ioS(seg(t, PH_T.pulse[0], PH_T.pulse[1])), ph = t * 6.5;
      for (let k = 0; k < A0.length; k++) {
        let v = A0[k] + (A1[k] - A0[k]) * f;
        if (pa > 0 && v > 8) v *= 1 + pa * Math.sin(ph - D[k]);
        U[k] = L[v > 255 ? 255 : v | 0];
      }
      st.tg.putImageData(st.timg, 0, 0);
      c.save();
      c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(st.tc, 0, 0, W, H);
      st.gg.globalCompositeOperation = 'copy'; st.gg.filter = 'blur(1.5px)'; st.gg.drawImage(st.tc, 0, 0, 160, 90); st.gg.filter = 'none';
      c.globalAlpha = 0.4; c.drawImage(st.gc, 0, 0, W, H);
      // a sample of the agents themselves, as fine motes riding the veins
      const S0 = st.samp[i0], S1 = st.samp[i0 + 1];
      c.globalAlpha = 0.5 * seg(t, PH_T.sim[0], PH_T.sim[0] + 0.4) * (1 - 0.6 * seg(t, PH_T.mst[0], PH_T.mst[1]));
      c.fillStyle = '#fff3c8'; c.beginPath();
      for (let q = 0; q < PH_NS; q++) {
        const x0 = S0[q * 2]; if (x0 < 0) continue;
        let x1 = S1[q * 2], y1 = S1[q * 2 + 1];
        if (x1 < 0 || Math.abs(x1 - x0) > 40) { x1 = x0; y1 = S0[q * 2 + 1]; }
        const x = lerp(x0, x1, f) * 0.5, y = lerp(S0[q * 2 + 1], y1, f) * 0.5;
        c.rect(x - 1, y - 1, 2, 2);
      }
      c.fill();
      c.restore();

      // inoculum: a yellow smear at Tokyo before the colony takes over
      const tk = st.food[0], tx = tk.x * PH_SC, ty = tk.y * PH_SC;
      const ia = E.outQ(seg(t, 0.25, 0.55)) * (1 - seg(t, PH_T.sim[0] + 0.2, PH_T.sim[0] + 0.9));
      if (ia > 0) {
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = ia;
        const g = c.createRadialGradient(tx, ty, 0, tx, ty, 46); g.addColorStop(0, 'rgba(255,224,110,0.95)'); g.addColorStop(0.5, 'rgba(230,160,20,0.5)'); g.addColorStop(1, 'rgba(230,160,20,0)');
        c.fillStyle = g; c.beginPath(); c.arc(tx, ty, 46, 0, TAU); c.fill(); c.restore();
      }
      // oat flakes, with a halo once the plasmodium engulfs them
      let reached = 0;
      st.food.forEach((fd, i) => {
        const x = fd.x * PH_SC, y = fd.y * PH_SC, u = seg(t, fd.at, fd.at + 0.3);
        if (u <= 0) return;
        const got = fd.reach === undefined ? 0 : clamp((kx - fd.reach) / 3);
        if (got > 0.5 && i > 0) reached++;
        if (got > 0) {
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = got * 0.5;
          const g = c.createRadialGradient(x, y, 4, x, y, 40); g.addColorStop(0, 'rgba(255,220,120,0.8)'); g.addColorStop(1, 'rgba(255,200,60,0)');
          c.fillStyle = g; c.fillRect(x - 40, y - 40, 80, 80); c.restore();
        }
        phFlake(c, x, y, E.outB(u), fd.pts, 0.92 - got * 0.25);
        if (fd.lab) {
          const la = seg(t, fd.at + 0.15, fd.at + 0.5) * (1 - 0.5 * seg(t, PH_T.title - 0.2, PH_T.title + 0.3));
          c.save(); c.globalAlpha = la;
          c.strokeStyle = 'rgba(239,230,204,0.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 12, y - 8); c.lineTo(x + 26, y - 20); c.stroke();
          text(c, fd.name, x + 30, y - 22, { font: JBM, weight: 600, size: 15, color: got > 0.5 ? '#ffe9a8' : 'rgba(239,230,204,0.7)', ls: 2, stroke: 'rgba(10,8,4,0.85)', lw: 5 });
          c.restore();
        }
      });
      // sea names
      c.save(); c.globalAlpha = 0.5 * seg(t, 0.2, 0.8);
      text(c, 'Tokyo Bay', 0.598 * W, 0.86 * H, { font: DMS, style: 'italic', size: 22, align: 'center', color: 'rgba(150,178,196,0.8)' });
      text(c, 'Sagami Bay', 0.36 * W, 0.955 * H, { font: DMS, style: 'italic', size: 24, align: 'center', color: 'rgba(150,178,196,0.8)' });
      text(c, 'Pacific Ocean', 0.905 * W, 0.84 * H, { font: DMS, style: 'italic', size: 24, align: 'center', color: 'rgba(150,178,196,0.8)' });
      c.restore();

      // comparison: the minimum spanning tree over the same flakes
      const ma = E.outC(seg(t, PH_T.mst[0], PH_T.mst[1]));
      if (ma > 0) {
        c.save(); c.strokeStyle = PH.cyan; c.lineWidth = 2; c.setLineDash([10, 8]); c.globalAlpha = 0.85;
        st.mst.forEach(([a, b2], i) => {
          const u = clamp(ma * st.mst.length * 0.25 - i * 0.2);
          if (u <= 0) return;
          const A = st.food[a], B = st.food[b2];
          c.beginPath(); c.moveTo(A.x * PH_SC, A.y * PH_SC); c.lineTo(lerp(A.x, B.x, u) * PH_SC, lerp(A.y, B.y, u) * PH_SC); c.stroke();
        });
        c.restore();
      }

      // ---- lab notebook ----
      const ui = E.outQ(seg(t, 0.15, 0.6));
      c.save(); c.globalAlpha = ui;
      c.fillStyle = 'rgba(8,7,5,0.72)'; c.fillRect(56, 50, 560, 104);
      text(c, 'PHYSARUM POLYCEPHALUM', 80, 92, { font: JBM, weight: 600, size: 20, color: PH.gold, ls: 4 });
      text(c, `${PH_FOOD.length} oat flakes · inoculated at Tokyo`, 80, 130, { font: JBM, size: 17, color: 'rgba(239,230,204,0.75)' });
      const pop = Math.round(lerp(st.pop[i0], st.pop[i0 + 1], f)), hrs = PH_HOURS * s / PH_STEPS;
      const rows = [['elapsed', `${hrs.toFixed(1).padStart(4, ' ')} h`], ['agents', s <= 0 ? '—' : pop.toLocaleString('en-US')], ['flakes', `${reached} / ${PH_FOOD.length - 1}`]];
      c.fillStyle = 'rgba(8,7,5,0.72)'; c.fillRect(1530, 50, 334, 132);
      rows.forEach(([k, v], i) => { text(c, k, 1554, 90 + i * 34, { font: JBM, size: 17, color: 'rgba(239,230,204,0.6)' }); text(c, v, 1840, 90 + i * 34, { font: JBM, weight: 600, size: 17, align: 'right', color: PH.ink }); });
      c.restore();
      if (ma > 0) {
        c.save(); c.globalAlpha = ma * (1 - seg(t, PH_T.title, PH_T.title + 0.3));
        c.strokeStyle = PH.cyan; c.lineWidth = 2; c.setLineDash([10, 8]); c.beginPath(); c.moveTo(1530, 226); c.lineTo(1580, 226); c.stroke(); c.setLineDash([]);
        text(c, 'minimum spanning tree', 1594, 232, { font: JBM, size: 16, color: PH.cyan });
        c.restore();
      }
      // ---- title ----
      const ta = E.outC(seg(t, PH_T.title, PH_T.title + 0.6));
      if (ta > 0) {
        c.save();
        const g = c.createLinearGradient(0, 760, 0, 1080); g.addColorStop(0, 'rgba(5,4,3,0)'); g.addColorStop(1, `rgba(5,4,3,${0.8 * ta})`);
        c.fillStyle = g; c.fillRect(0, 760, W, 320);
        c.globalAlpha = ta;
        const y0 = 980 + (1 - ta) * 18;
        text(c, 'Physarum', 96, y0, { font: DMS, size: 118, color: PH.ink });
        text(c, 'a slime mould grows a rail network · Tero et al., 2010', 100, y0 + 52, { font: DMS, style: 'italic', size: 30, color: 'rgba(244,196,49,0.9)' });
        c.restore();
      }
      grain(c, W, H, t, 0.05, 'overlay');
      vignette(c, W, H, 0.4);
    },
    score(A) {
      A.bus.gain.value = 1.3;
      const pent = [57, 60, 62, 64, 67, 69, 72, 74, 76, 79];
      // the agar room: a low, slowly opening drone
      A.chord(0.0, [33, 40, 45], { type: 'triangle', dur: 10, g: 0.05, a: 2.2, hold: true, rel: 1.4, lp: 280, lp2: 1100, lpT: 7, spread: 5, width: 0.6, rev: 0.5 });
      // flakes laid: small dry taps
      PH_FOOD.forEach((_, i) => A.noise(PH_T.flakes[0] + (i === 0 ? 0 : 0.08 + hash(i * 3.7) * 0.7), { type: 'bandpass', f: 900 + hash(i) * 900, q: 6, dur: 0.035, g: 0.07, pan: hash(i * 2.3) - 0.5 }));
      // inoculation: a wet, low bloom
      A.osc(0.3, { f: 110, f2: 82, glide: 0.5, dur: 0.9, g: 0.12, a: 0.03, lp: 600 });
      A.noise(0.32, { type: 'lowpass', f: 900, f2: 300, dur: 0.6, g: 0.05, rev: 0.4 });
      // growth: a granular bubbling of tiny plucks that thickens as the colony multiplies
      for (let k = 0; k < 90; k++) {
        const tt = 0.8 + Math.pow(k / 90, 0.8) * 5.0 + hash(k * 7.7) * 0.06;
        A.pluck(tt, midi(pent[Math.floor(hash(k * 1.37) * pent.length)] - 12), { g: 0.035 + 0.04 * hash(k * 3.1), dur: 0.5, bright: 0.25, decay: 0.99, lp: 1600, pan: hash(k * 9.1) * 1.4 - 0.7, rev: 0.35 });
      }
      A.noise(0.9, { type: 'bandpass', f: 300, f2: 1200, sweep: 4, q: 0.8, dur: 4.6, g: 0.05, swell: 0.6, rev: 0.4 });
      // flakes engulfed, near to far: soft bells climbing the scale
      for (let k = 0; k < 14; k++) A.bell(1.9 + k * 0.3 + hash(k * 5.3) * 0.12, midi(pent[k % pent.length] + 12), { g: 0.035, dur: 1.6, ratios: [1, 2.76, 5.4], rev: 0.5, pan: hash(k * 4.1) - 0.5 });
      // shuttle streaming: a slow heartbeat throb
      for (let k = 0; k < 8; k++) {
        const tt = PH_T.pulse[0] + k * 0.48;
        A.osc(tt, { f: 62, f2: 52, glide: 0.4, dur: 0.55, g: 0.16 * Math.min(1, (k + 1) / 3), a: 0.08, lp: 300 });
        A.noise(tt, { type: 'lowpass', f: 500, dur: 0.4, g: 0.03, swell: 0.5 });
      }
      // comparison graph drawn: a dry ticking of segments
      for (let k = 0; k < 12; k++) A.noise(PH_T.mst[0] + k * 0.06, { type: 'bandpass', f: 3200, q: 5, dur: 0.02, g: 0.04, pan: k / 11 - 0.5 });
      // title
      A.chord(8.45, [45, 52, 57, 61, 64, 69], { type: 'sine', dur: 1.55, g: 0.035, a: 0.25, width: 0.8, rev: 0.7 });
      A.bell(8.55, midi(76), { g: 0.04, dur: 1.4, rev: 0.6 });
    },
  });

  /* =====================================================================
     HARMONOGRAPH — Goold's twin-elliptic pendulum at work: two pendulums
     hang through a walnut table, one carrying the pen arm, the other the
     card. They are drawn back and released; the pen drops and the first
     loops are traced in real time, then the clock speeds up, the bobs blur
     into ellipses and a rosette of 2 : 3 loops builds and precesses as the
     swings decay towards the centre. The pen lifts, the machine slides away
     and the finished card is shown as a plate
     ===================================================================== */
  const HG = { wall: '#1a130d', wood: '#6e4527', woodL: '#94623a', woodD: '#3c2513', brass: '#c79a4c', brassL: '#f4d892', brassD: '#6c4e1d', card: '#f1e8d2', ink: '#1f2747', red: '#8e2a20', cream: '#eadfc3' };
  const HG_T = { hold: [0.05, 0.55], penDown: [0.7, 0.95], fast: [1.9, 2.9], slow: [6.5, 7.4], penUp: [7.7, 7.95], move: [7.8, 8.8], cap: 8.55 };
  const HG_R = 34;                                   // peak time-lapse factor
  const HG_W1 = TAU * 0.6, HG_W2 = HG_W1 * 1.5 * 1.008;   // pen and card pendulums, a fifth apart and slightly mistuned so the figure precesses
  const HG_DTAU = 0.008;                             // ink sampling step in machine seconds
  // machine time τ(t): held, released, real time, then a time-lapse that eases back to real time
  const hgRate = t => (t < HG_T.hold[1] ? 0 : 1 + (HG_R - 1) * (E.ioS(seg(t, HG_T.fast[0], HG_T.fast[1])) - E.ioS(seg(t, HG_T.slow[0], HG_T.slow[1]))));
  const HG_TAB = (() => { const a = new Float32Array(1002); for (let i = 1; i < 1002; i++) a[i] = a[i - 1] + hgRate((i - 0.5) * 0.01) * 0.01; return a; })();
  const hgTau = t => { const x = clamp(t, 0, 10) * 100, i = Math.min(999, x | 0); return lerp(HG_TAB[i], HG_TAB[i + 1], x - i); };
  // each pendulum on a gimbal swings in an ellipse that slowly decays; displacements in cm at the top of the rod
  function hgPen(tau, o) { const e = Math.exp(-0.0125 * tau); o[0] = 5.4 * Math.sin(HG_W1 * tau + 1.1) * e; o[1] = 4.6 * Math.sin(HG_W1 * 1.0013 * tau + 2.5) * e; }
  function hgCard(tau, o) { const e = Math.exp(-0.0135 * tau); o[0] = 5.0 * Math.sin(HG_W2 * tau + 0.35) * e; o[1] = 5.2 * Math.sin(HG_W2 * 0.9987 * tau - 1.25) * e; }
  function hgDisp(t, tau, pen, card) {
    hgPen(tau, pen); hgCard(tau, card);
    if (t < HG_T.hold[1]) { const k = E.ioS(seg(t, HG_T.hold[0], HG_T.hold[1] - 0.05)); pen[0] *= k; pen[1] *= k; card[0] *= k; card[1] *= k; }
  }
  // oblique (cabinet-like) projection of the machine: X right, Y away, Z up, in cm
  const HG_M = { ox: 470, oy: 470, s: 5.6, kx: 0.46, ky: 0.3 };
  const hp = (X, Y, Z, dx = 0) => [HG_M.ox + dx + HG_M.s * (X + HG_M.kx * Y), HG_M.oy - HG_M.s * (Z + HG_M.ky * Y)];
  const HG_P1 = -22, HG_P2 = 14, HG_TOP = 18;        // pendulum X positions and rod-top height

  function hgQuad(c, pts, fill, stroke) {
    c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.stroke(); }
  }
  function hgLeg(c, X, Y, dx) {
    const w = 2.2;
    const a = hp(X - w, Y - w, -3, dx), b = hp(X + w, Y - w, -3, dx), b2 = hp(X + w, Y - w, -88, dx), a2 = hp(X - w, Y - w, -88, dx);
    const s1 = hp(X + w, Y + w, -3, dx), s2 = hp(X + w, Y + w, -88, dx);
    hgQuad(c, [a, b, b2, a2], HG.wood); hgQuad(c, [b, s1, s2, b2], HG.woodD);
    c.fillStyle = 'rgba(255,220,170,0.08)'; c.fillRect(a[0] + 2, a[1], 3, a2[1] - a[1]);
  }
  // the swinging parts below the table: rods and brass bobs
  function hgBelow(c, pen, card, dx) {
    [[HG_P1, pen], [HG_P2, card]].forEach(([X, d]) => {
      const k = -60 / HG_TOP, bx = X + d[0] * k, by = -d[1] * k;
      const p0 = hp(X, 0, -3, dx), p1 = hp(bx, by, -60, dx);
      c.strokeStyle = '#2a2622'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke();
      c.strokeStyle = 'rgba(255,240,210,0.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(p0[0] - 2, p0[1]); c.lineTo(p1[0] - 2, p1[1]); c.stroke();
      // bob: a brass drum
      const tp = hp(bx, by, -56, dx), bt = hp(bx, by, -70, dx), rw = 7.5 * HG_M.s, rh = rw * 0.32;
      const g = c.createLinearGradient(tp[0] - rw, 0, tp[0] + rw, 0);
      g.addColorStop(0, HG.brassD); g.addColorStop(0.35, HG.brassL); g.addColorStop(0.6, HG.brass); g.addColorStop(1, HG.brassD);
      c.fillStyle = g; c.beginPath(); c.ellipse(bt[0], bt[1], rw, rh, 0, 0, PI); c.lineTo(tp[0] - rw, tp[1]); c.ellipse(tp[0], tp[1], rw, rh, 0, PI, 0, true); c.closePath(); c.fill();
      c.fillStyle = '#e2bd72'; c.beginPath(); c.ellipse(tp[0], tp[1], rw, rh, 0, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(80,55,20,0.6)'; c.lineWidth = 1.5; c.stroke();
    });
  }
  // the parts above the table: rod tops, the card platform and the pen arm
  function hgAbove(c, st, pen, card, dx, inkN, penLift) {
    const p2 = hp(HG_P2 + card[0], -card[1], HG_TOP, dx), b2 = hp(HG_P2, 0, 0, dx);
    c.strokeStyle = '#2a2622'; c.lineWidth = 6; c.beginPath(); c.moveTo(b2[0], b2[1]); c.lineTo(p2[0], p2[1]); c.stroke();
    // platform and card
    const cx = HG_P2 + card[0], cy = -card[1], P = 17, Cc = 14;
    const plat = [hp(cx - P, cy - P, HG_TOP, dx), hp(cx + P, cy - P, HG_TOP, dx), hp(cx + P, cy + P, HG_TOP, dx), hp(cx - P, cy + P, HG_TOP, dx)];
    hgQuad(c, [plat[0], plat[1], hp(cx + P, cy - P, HG_TOP - 1.6, dx), hp(cx - P, cy - P, HG_TOP - 1.6, dx)], HG.woodD);
    hgQuad(c, [plat[1], plat[2], hp(cx + P, cy + P, HG_TOP - 1.6, dx), hp(cx + P, cy - P, HG_TOP - 1.6, dx)], '#2c1a0d');
    hgQuad(c, plat, HG.woodL);
    hgQuad(c, [hp(cx - Cc, cy - Cc, HG_TOP + 0.1, dx), hp(cx + Cc, cy - Cc, HG_TOP + 0.1, dx), hp(cx + Cc, cy + Cc, HG_TOP + 0.1, dx), hp(cx - Cc, cy + Cc, HG_TOP + 0.1, dx)], HG.card);
    if (inkN > 1) {
      // the same drawing, mapped onto the card plane (card y runs toward the viewer)
      const o = hp(cx, cy, HG_TOP + 0.1, dx), s = HG_M.s;
      c.save(); c.transform(s, 0, -HG_M.kx * s, HG_M.ky * s, o[0], o[1]);
      c.strokeStyle = 'rgba(31,39,71,0.55)'; c.lineWidth = 0.09; c.beginPath();
      const p = st.path, step = Math.max(1, Math.floor(inkN / 2500));
      c.moveTo(p[0], p[1]); for (let i = step; i < inkN; i += step) c.lineTo(p[i * 2], p[i * 2 + 1]);
      c.stroke(); c.restore();
    }
    // pen arm: rigid on top of pendulum 1, its glass pen over the card
    const ax0 = hp(HG_P1 - 9 + pen[0], -pen[1], HG_TOP + 3, dx), ax1 = hp(HG_P2 + pen[0], -pen[1], HG_TOP + 3 + penLift, dx);
    const b1 = hp(HG_P1, 0, 0, dx), t1 = hp(HG_P1 + pen[0], -pen[1], HG_TOP + 3, dx);
    c.strokeStyle = '#2a2622'; c.lineWidth = 6; c.beginPath(); c.moveTo(b1[0], b1[1]); c.lineTo(t1[0], t1[1]); c.stroke();
    c.strokeStyle = HG.woodD; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(ax0[0], ax0[1]); c.lineTo(ax1[0], ax1[1]); c.stroke();
    c.strokeStyle = HG.woodL; c.lineWidth = 2.5; c.beginPath(); c.moveTo(ax0[0], ax0[1] - 2); c.lineTo(ax1[0], ax1[1] - 2); c.stroke();
    c.fillStyle = HG.brass; c.beginPath(); c.arc(ax0[0], ax0[1], 8, 0, TAU); c.fill();
    const tip = hp(HG_P2 + pen[0], -pen[1], HG_TOP + 0.2 + penLift, dx);
    c.strokeStyle = 'rgba(200,220,235,0.9)'; c.lineWidth = 3; c.beginPath(); c.moveTo(ax1[0], ax1[1]); c.lineTo(tip[0], tip[1]); c.stroke();
    c.fillStyle = HG.brassL; c.beginPath(); c.arc(ax1[0], ax1[1], 4, 0, TAU); c.fill();
  }

  MG.film({
    id: 'harmonograph', dur: 10, poster: 9.3,
    fonts: [['400 100px "IM Fell English"', 'Harmonograph'], ['italic 400 30px "IM Fell English"', 'two pendulums a fifth apart, damped to rest after Joseph Goold 1909 ratio machine time min s ×0123456789'], ['400 30px "IM Fell English SC"', 'FIG. 1. — THE TWIN-ELLIPTIC PENDULUM']],
    meta: {
      family: 'E', name: 'Harmonograph', sub: 'Damped pendulum drawings', era: '1844 —',
      origin: 'The harmonograph is a Victorian drawing machine: two or three pendulums, coupled to a pen and a drawing table, trace damped Lissajous figures that spiral slowly to the centre as the swings die away. Hugh Blackburn\'s pendulum of 1844 and Jules Lissajous\'s optical figures of 1857 led to parlour and lecture-hall instruments, and in 1909 Joseph Goold and his co-authors published Harmonic Vibrations and Vibration Figures, an album of rosettes drawn by twin-elliptic pendulums tuned to musical intervals. It is an ancestor of plotter and generative art: a simple physical rule, run for long enough, makes intricate drawings.',
      works: 'Hugh Blackburn — Blackburn pendulum (1844) · Jules Antoine Lissajous — vibration figures (1857) · Joseph Goold, Charles E. Benham, Richard Kerr & L. R. Wilberforce — Harmonic Vibrations and Vibration Figures (1909)',
      tech: ['Damped sinusoids', 'Analytic time-lapse', 'Ink on card'],
      accent: '#8e2a20',
      motionDNA: 'Two pendulums released from rest swing in slow ellipses; the pen loops in real time, then time-lapses into a blur while a rosette builds layer on layer, rotates by its slight mistuning and shrinks inward as damping takes the energy out.',
      visualDNA: 'Walnut and brass machinery in warm lamplight, a cream card with fine indigo ink lines that darken where they overlap, and a Victorian plate caption in Fell type.',
      transitions: 'Draw back and release, pen drop, real time to time-lapse, pen lift, machine slides out, card becomes the plate',
      implementation: ['Physical harmonograph', 'Processing / p5.js', 'Pen plotter (AxiDraw)', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const st = {};
      st.tau0 = hgTau(HG_T.penDown[1]); st.tau1 = hgTau(HG_T.penUp[0]);
      const n = Math.ceil((st.tau1 - st.tau0) / HG_DTAU) + 2, p = new Float32Array(n * 2), a = [0, 0], b = [0, 0];
      for (let i = 0; i < n; i++) { hgPen(st.tau0 + i * HG_DTAU, a); hgCard(st.tau0 + i * HG_DTAU, b); p[i * 2] = a[0] - b[0]; p[i * 2 + 1] = a[1] - b[1]; }
      st.path = p; st.n = n;
      st.paper = paperTile(HG.card, 1909, 512, '110,85,50', '255,252,240', 0.9);
      st.wall = paperTile(HG.wall, 1844, 512, '0,0,0', '120,90,60', 1.4);
      return st;
    },
    draw(c, t, W, H, st) {
      const tau = hgTau(t), rate = hgRate(t);
      const pen = [0, 0], card = [0, 0];
      // ---- room ----
      c.fillStyle = HG.wall; c.fillRect(0, 0, W, H);
      c.save(); c.fillStyle = c.createPattern(st.wall, 'repeat'); c.globalAlpha = 0.9; c.fillRect(0, 0, W, H); c.restore();
      const lamp = c.createRadialGradient(900, 300, 50, 900, 420, 1300); lamp.addColorStop(0, 'rgba(255,200,130,0.2)'); lamp.addColorStop(1, 'rgba(0,0,0,0.5)');
      c.fillStyle = lamp; c.fillRect(0, 0, W, H);

      // ---- the machine ----
      const mv = E.ioC(seg(t, HG_T.move[0], HG_T.move[1]));
      const ma = 1 - E.inQ(seg(t, HG_T.move[0], HG_T.move[1] - 0.2)), dx = -mv * 760;
      const tInk = Math.min(tau, st.tau1), inkN = tInk > st.tau0 ? Math.min(st.n, Math.floor((tInk - st.tau0) / HG_DTAU) + 1) : 0;
      const lift = t < HG_T.penDown[0] ? 2.4 : t < HG_T.penDown[1] ? 2.4 * (1 - E.ioS(seg(t, HG_T.penDown[0], HG_T.penDown[1]))) : 2.4 * E.ioS(seg(t, HG_T.penUp[0], HG_T.penUp[1]));
      // motion blur when time-lapsed: several samples across the frame's span of machine time
      const span = Math.min(rate / 30, 2.6), ns = rate > 2 ? 16 : 1;
      if (ma > 0) {
        c.save(); c.globalAlpha = ma;
        // floor shadow
        const fs = hp(0, 0, -88, dx); c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(fs[0], fs[1] + 6, 330, 60, 0, 0, TAU); c.fill();
        hgLeg(c, -36, 21, dx); hgLeg(c, 36, 21, dx);
        hgQuad(c, [hp(-36, 21, -76, dx), hp(36, 21, -76, dx), hp(36, 21, -80, dx), hp(-36, 21, -80, dx)], HG.woodD);
        for (let k = 0; k < ns; k++) {
          const tt = tau - span * (1 - (k + 1) / ns);
          hgDisp(t, tt, pen, card);
          c.globalAlpha = ma * (ns > 1 ? (0.08 + 0.4 * ((k + 1) / ns) ** 3) : 1);
          hgBelow(c, pen, card, dx);
        }
        c.globalAlpha = ma;
        hgQuad(c, [hp(-36, -21, -76, dx), hp(36, -21, -76, dx), hp(36, -21, -80, dx), hp(-36, -21, -80, dx)], HG.wood);
        hgLeg(c, -36, -21, dx); hgLeg(c, 36, -21, dx);
        // table top with front and side faces
        const tA = hp(-40, -25, 0, dx), tB = hp(40, -25, 0, dx), tC = hp(40, 25, 0, dx), tD = hp(-40, 25, 0, dx);
        hgQuad(c, [tA, tB, hp(40, -25, -4, dx), hp(-40, -25, -4, dx)], HG.woodD);
        hgQuad(c, [tB, tC, hp(40, 25, -4, dx), hp(40, -25, -4, dx)], '#2a190c');
        const tg = c.createLinearGradient(tA[0], tA[1], tC[0], tC[1]); tg.addColorStop(0, HG.woodL); tg.addColorStop(1, HG.wood);
        hgQuad(c, [tA, tB, tC, tD], tg);
        c.strokeStyle = 'rgba(40,22,10,0.35)'; c.lineWidth = 1;
        for (let k = 1; k < 9; k++) { const a = hp(-40, -25 + k * 5.5, 0, dx), b = hp(40, -25 + k * 5.5 + Math.sin(k) * 0.8, 0, dx); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
        [HG_P1, HG_P2].forEach(X => { const h = hp(X, 0, 0, dx); c.fillStyle = '#120a05'; c.beginPath(); c.ellipse(h[0], h[1], 26, 9, 0, 0, TAU); c.fill(); c.fillStyle = HG.brass; c.beginPath(); c.ellipse(h[0], h[1], 9, 3.5, 0, 0, TAU); c.fill(); });
        for (let k = 0; k < ns; k++) {
          const tt = tau - span * (1 - (k + 1) / ns);
          hgDisp(t, tt, pen, card);
          c.globalAlpha = ma * (ns > 1 ? (0.12 + 0.5 * ((k + 1) / ns) ** 3) : 1);
          hgAbove(c, st, pen, card, dx, ns > 1 ? 0 : inkN, lift);
        }
        c.restore();
        // plate heading
        c.save(); c.globalAlpha = ma * E.outQ(seg(t, 0.1, 0.6));
        text(c, 'FIG. 1. — THE TWIN-ELLIPTIC PENDULUM', 90 + dx, 120, { font: FELLSC, size: 34, color: HG.cream, ls: 2 });
        text(c, 'after Goold, Harmonic Vibrations and Vibration Figures, 1909', 92 + dx, 162, { font: FELL, style: 'italic', size: 26, color: 'rgba(234,223,195,0.65)' });
        c.restore();
      }

      // ---- the card, seen from above (the camera rides on the card platform) ----
      const cu = E.ioC(seg(t, HG_T.move[0], HG_T.move[1]));
      const CX = lerp(1390, 960, cu), CY = lerp(505, 470, cu), SZ = lerp(740, 700, cu), K = SZ / 26;
      const ca = E.outQ(seg(t, 0.0, 0.5));
      c.save(); c.globalAlpha = ca;
      c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(CX - SZ / 2 + 16, CY - SZ / 2 + 22, SZ, SZ);
      c.save(); c.translate(CX - SZ / 2, CY - SZ / 2); c.fillStyle = c.createPattern(st.paper, 'repeat'); c.fillRect(0, 0, SZ, SZ); c.restore();
      c.strokeStyle = 'rgba(120,95,60,0.35)'; c.lineWidth = 1; c.strokeRect(CX - SZ / 2 + 0.5, CY - SZ / 2 + 0.5, SZ - 1, SZ - 1);
      // a ruled plate border
      c.strokeStyle = 'rgba(120,40,30,0.35)'; c.lineWidth = 1.2; c.strokeRect(CX - SZ / 2 + 26, CY - SZ / 2 + 26, SZ - 52, SZ - 52);
      if (inkN > 1) {
        c.save(); c.translate(CX, CY); c.scale(K, K);
        c.lineWidth = 1.25 / K; c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = HG.ink; c.globalAlpha = ca * 0.72;
        const p = st.path, CH = 220;
        for (let i0 = 0; i0 < inkN - 1; i0 += CH) {
          const i1 = Math.min(inkN - 1, i0 + CH);
          c.beginPath(); c.moveTo(p[i0 * 2], p[i0 * 2 + 1]);
          for (let i = i0 + 1; i <= i1; i++) c.lineTo(p[i * 2], p[i * 2 + 1]);
          c.stroke();
        }
        // the first touch leaves a small blot
        c.fillStyle = HG.ink; c.globalAlpha = ca * 0.8; c.beginPath(); c.arc(p[0], p[1], 2.2 / K, 0, TAU); c.fill();
        c.restore();
      }
      // pen and arm over the card (arm comes in from the pen pendulum, off to the left)
      const pa = 1 - E.inQ(seg(t, HG_T.penUp[1], HG_T.move[0] + 0.5));
      if (pa > 0) {
        c.save(); c.beginPath(); c.rect(CX - SZ / 2, CY - SZ / 2, SZ + 40, SZ + 40); c.clip();
        // when time-lapsed, the pen collar smears along its recent path; the arm is drawn once, at the latest position
        const nps = rate > 2 ? 10 : 1;
        for (let k = 0; k < nps - 1; k++) {
          hgDisp(t, tau - span * (1 - (k + 1) / nps), pen, card);
          c.globalAlpha = ca * pa * (0.08 + 0.3 * ((k + 1) / nps) ** 2);
          c.fillStyle = HG.brass; c.beginPath(); c.arc(CX + (pen[0] - card[0]) * K, CY + (pen[1] - card[1]) * K - lift * 12, 15, 0, TAU); c.fill();
        }
        {
          hgDisp(t, tau, pen, card);
          const px = CX + (pen[0] - card[0]) * K, py = CY + (pen[1] - card[1]) * K, L = lift * 12;
          c.globalAlpha = ca * pa;
          // shadow
          c.strokeStyle = 'rgba(40,25,10,0.28)'; c.lineWidth = 16; c.lineCap = 'round';
          c.beginPath(); c.moveTo(px - 900 + 10 + L, py - 260 + 16 + L); c.lineTo(px + 10 + L, py + 16 + L); c.stroke();
          // arm
          const ag = c.createLinearGradient(0, py - 12, 0, py + 12); ag.addColorStop(0, HG.woodL); ag.addColorStop(1, HG.woodD);
          c.strokeStyle = HG.woodD; c.lineWidth = 15; c.beginPath(); c.moveTo(px - 900, py - 260 - L); c.lineTo(px - 18, py - 5 - L); c.stroke();
          c.strokeStyle = HG.woodL; c.lineWidth = 4; c.beginPath(); c.moveTo(px - 900, py - 264 - L); c.lineTo(px - 18, py - 9 - L); c.stroke();
          // brass collar and glass pen
          c.fillStyle = HG.brass; c.beginPath(); c.arc(px, py - L, 15, 0, TAU); c.fill();
          c.fillStyle = HG.brassL; c.beginPath(); c.arc(px - 4, py - 4 - L, 6, 0, TAU); c.fill();
          c.fillStyle = 'rgba(31,39,71,0.9)'; c.beginPath(); c.arc(px, py - L, 5, 0, TAU); c.fill();
        }
        c.restore();
      }
      c.restore();
      // readout
      const ra = ca * (1 - seg(t, HG_T.move[0], HG_T.move[0] + 0.4));
      if (ra > 0) {
        const mt = Math.max(0, tau), mm = Math.floor(mt / 60), ss = Math.floor(mt % 60);
        c.save(); c.globalAlpha = ra;
        text(c, `ratio 2 : 3   ·   machine time ${mm} min ${String(ss).padStart(2, '0')} s   ·   ×${Math.max(1, Math.round(rate))}`, 1390, 945, { font: FELL, style: 'italic', size: 28, align: 'center', color: HG.cream });
        c.restore();
      }
      // ---- plate caption ----
      const ta = E.outC(seg(t, HG_T.cap, HG_T.cap + 0.7));
      if (ta > 0) {
        c.save(); c.globalAlpha = ta;
        const y0 = 920 + (1 - ta) * 14;
        text(c, 'Harmonograph', 960, y0, { font: FELL, size: 92, align: 'center', color: HG.cream });
        text(c, 'two pendulums a fifth apart, damped to rest  ·  after Joseph Goold, 1909', 960, y0 + 54, { font: FELL, style: 'italic', size: 30, align: 'center', color: 'rgba(214,150,120,0.95)' });
        c.restore();
      }
      grain(c, W, H, t, 0.05, 'overlay');
      vignette(c, W, H, 0.55, '10,6,2');
    },
    score(A) {
      A.bus.gain.value = 1.2;
      // drawn back: a wooden creak
      A.noise(0.1, { type: 'bandpass', f: 380, f2: 240, sweep: 0.4, q: 6, dur: 0.45, g: 0.07, swell: 0.6 });
      // released: a low pluck, then the two pendulums sound their interval — A and E, a fifth, slightly mistuned
      A.pluck(0.56, midi(45), { g: 0.25, dur: 2.4, bright: 0.4, decay: 0.997, lp: 1800, rev: 0.4 });
      A.osc(0.6, { f: 220, dur: 7.6, g: 0.07, a: 1.2, hold: true, rel: 1.4, pan: -0.45, lp: 1400, lp2: 500, lpT: 7.5, rev: 0.5 });
      A.osc(0.6, { f: 330 * 1.0035, dur: 7.6, g: 0.05, a: 1.4, hold: true, rel: 1.4, pan: 0.45, lp: 1600, lp2: 500, lpT: 7.5, rev: 0.5 });
      A.osc(0.6, { type: 'triangle', f: 110, dur: 7.6, g: 0.04, a: 1.5, hold: true, rel: 1.4, lp: 400 });
      // pen touches the card
      A.noise(0.95, { type: 'bandpass', f: 4200, q: 4, dur: 0.02, g: 0.08 });
      A.osc(0.95, { f: 1760, dur: 0.15, g: 0.02 });
      // time-lapse: a music-box arpeggio on the harmonics of the fifth, its pace following the clock, quieter as the swings decay
      const arp = [57, 64, 69, 73, 76, 81, 76, 73, 69, 64];
      let tt = 1.2, k = 0;
      while (tt < 7.6) {
        const rate = hgRate(tt), amp = Math.exp(-0.014 * hgTau(tt));
        A.bell(tt, midi(arp[k % arp.length] + 12), { g: 0.05 * (0.35 + 0.65 * amp), dur: 0.9, ratios: [1, 3.0, 5.1], rev: 0.4, pan: k % 2 ? 0.4 : -0.4 });
        tt += clamp(0.62 / Math.sqrt(rate), 0.1, 0.62); k++;
      }
      A.noise(1.9, { type: 'bandpass', f: 600, f2: 2400, sweep: 1.2, q: 1.2, dur: 1.4, g: 0.05, swell: 0.7, rev: 0.4 });
      A.noise(6.5, { type: 'bandpass', f: 2400, f2: 500, sweep: 1.0, q: 1.2, dur: 1.1, g: 0.04, swell: 0.3, rev: 0.4 });
      // pen lifts
      A.noise(7.72, { type: 'bandpass', f: 3000, q: 5, dur: 0.02, g: 0.06 });
      // the plate: a harmonium chord in A
      A.chord(8.0, [45, 52, 57, 61, 64], { type: 'triangle', dur: 2.0, g: 0.04, a: 0.5, lp: 1500, width: 0.8, rev: 0.6, spread: 4 });
      A.bell(8.6, midi(81), { g: 0.05, dur: 1.4, rev: 0.6 });
      A.bell(8.75, midi(88), { g: 0.035, dur: 1.2, rev: 0.6 });
    },
  });

  /* =====================================================================
     LIGHT PAINTING — one long exposure on a wet quay at night. The shutter
     opens on bulb; a dark figure loops an RGB LED tube around themself
     while walking, leaving a coiled ribbon whose brightness follows how
     long the light dwelt; then they spin a burning steel-wool whisk on a
     cable, an orange ring flinging thousands of parabolic sparks that
     bounce off the ground; last they write a word in the air with a
     warm-white pen light. The figure only registers where it was lit,
     as translucent ghosts; the shutter closes on the finished photograph
     ===================================================================== */
  const LP = { sky0: '#020309', sky1: '#081022', hor: '#14203a', ground: '#04060a', led: [255, 238, 214], wool: [255, 150, 50], hud: 'rgba(225,232,245,0.8)', rec: '#ff4a3d' };
  const LP_T = { open: 0.35, wand: [0.55, 2.85], walk1: [2.85, 3.5], wool: [3.55, 5.85], burn: [3.6, 3.95, 5.2, 5.85], walk2: [5.85, 6.15], write: [6.15, 8.0], close: 8.75, title: 8.95 };
  const LP_GY = 830, LP_FH = 440;                       // ground line at the figure's feet, figure height
  const LP_WOOL = { x: 330, y: 560, R: 160, w: TAU * 2.5 };
  const LP_WORD = { x0: 0, base: 520, xh: 125 };       // x0 set in setup so the word is centred
  // cursive "glow" as one continuous stroke (x-height 1, y up)
  const LP_GLOW = [
    [0.9, 0.82], [0.62, 1.0], [0.28, 0.88], [0.1, 0.52], [0.22, 0.12], [0.52, 0.03], [0.8, 0.3], [0.93, 0.78], [0.97, 1.0],
    [0.93, 0.2], [0.86, -0.55], [0.62, -1.02], [0.32, -0.95], [0.34, -0.6], [0.75, -0.25], [1.2, 0.12],
    [1.58, 0.75], [1.82, 1.55], [1.86, 2.12], [1.68, 2.26], [1.52, 2.0], [1.5, 1.2], [1.55, 0.4], [1.72, 0.04], [2.02, 0.12],
    [2.35, 0.62], [2.64, 0.98], [2.36, 0.88], [2.2, 0.48], [2.34, 0.06], [2.68, 0.06], [2.86, 0.5], [2.72, 0.95], [2.6, 0.9], [2.92, 0.96], [3.18, 0.85],
    [3.22, 0.5], [3.32, 0.08], [3.52, 0.0], [3.7, 0.35], [3.8, 0.78], [3.86, 0.32], [4.02, 0.0], [4.26, 0.18], [4.42, 0.72], [4.46, 0.98], [4.36, 0.9], [4.58, 0.84], [4.95, 1.0],
  ];
  const lpBurn = t => E.outQ(seg(t, LP_T.burn[0], LP_T.burn[1])) * (1 - E.inQ(seg(t, LP_T.burn[2], LP_T.burn[3])));
  // the coil: the hand circles while the walker moves right to left
  const lpCoil = (t, o) => { const s = seg(t, LP_T.wand[0], LP_T.wand[1]), X = lerp(1610, 900, s), th = s * TAU * 4.25; o[0] = X + 92 * Math.sin(th); o[1] = 700 - 84 * Math.cos(th); return s; };
  const lpWool = (t, o) => { const th = LP_WOOL.w * (t - LP_T.wool[0]) - PI / 2; o[0] = LP_WOOL.x + LP_WOOL.R * Math.cos(th); o[1] = LP_WOOL.y + LP_WOOL.R * Math.sin(th); };
  const lpHue = s => { const h = (s * 2.2 + 0.55) % 1; return `hsl(${Math.round(h * 360)},100%,62%)`; };

  MG.film({
    id: 'lightpainting', dur: 10, poster: 9.4,
    fonts: [['300 64px Archivo', 'Light Painting'], ['500 18px Archivo', 'I · II · III LED WAND STEEL WOOL WRITING IN THE AIR'], ['400 18px "JetBrains Mono"', 'BULB ƒ/8 ISO 100 0123456789.s ●'], ['italic 400 28px "DM Serif Display"', "after Gjon Mili's photographs of Picasso, LIFE 1949"]],
    meta: {
      family: 'F', name: 'Light Painting', sub: 'Drawing with light on a long exposure', era: '1914 —',
      origin: 'Light painting is drawing in the air with a moving light while the camera\'s shutter stays open, so every path the light takes is written into a single photograph and the dimly lit performer barely registers. Frank and Lillian Gilbreth traced workers\' motions with small lights in the 1910s, Man Ray signed his name in light in Space Writings (1935), and Gjon Mili\'s 1949 photographs for LIFE of Pablo Picasso drawing centaurs and bulls with a penlight made it famous. Today it is a performance genre of LED wands, pixel sticks and spinning steel wool.',
      works: 'Frank & Lillian Gilbreth — light motion studies (1910s) · Man Ray — Space Writings (1935) · Gjon Mili & Pablo Picasso — light drawings for LIFE (1949)',
      tech: ['Additive exposure buffer', 'Parabolic spark streaks', 'Dwell-weighted ribbons'],
      accent: '#ff9a3c',
      motionDNA: 'Nothing on screen moves except the light and the person carrying it; every path persists, so the image only ever accumulates: a coil grows across the frame, a ring spins up and sprays sparks, and a word is written stroke by stroke until the shutter closes.',
      visualDNA: 'Near-black blue-hour scene with a wet ground that mirrors the light, saturated RGB ribbon bands, orange spark parabolas with white-hot cores, a warm-white handwritten word, translucent ghosts of the performer, and minimal camera HUD type.',
      transitions: 'Shutter opens, wand coil, walk, steel-wool spin, walk, written word, shutter closes on the finished frame',
      implementation: ['Camera on tripod, bulb mode', 'LED wand / pixel stick', 'Steel wool on a cable', 'Canvas 2D (additive buffer)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const st = {}, r = rng(1949);
      // ---- the scene: sky, far shore, wet ground ----
      const bg = offscreen(1920, 1080), b = bg.getContext('2d');
      const sky = b.createLinearGradient(0, 0, 0, 470); sky.addColorStop(0, LP.sky0); sky.addColorStop(0.75, LP.sky1); sky.addColorStop(1, LP.hor);
      b.fillStyle = sky; b.fillRect(0, 0, 1920, 470);
      for (let k = 0; k < 160; k++) { const x = r() * 1920, y = r() * 420, a = 0.15 + r() * 0.5; b.fillStyle = `rgba(220,230,255,${a * (1 - y / 520)})`; b.fillRect(x, y, r() < 0.15 ? 2 : 1.2, r() < 0.15 ? 2 : 1.2); }
      // far shore: low silhouettes with a few sodium lights
      b.fillStyle = '#05070d'; b.beginPath(); b.moveTo(0, 470);
      for (let x = 0; x <= 1920; x += 16) b.lineTo(x, 470 - 8 - Math.max(0, vnoise(x * 0.006, 4)) * 30 - (x > 1180 && x < 1420 ? 26 + 18 * (Math.floor(x / 40) % 3) : 0));
      b.lineTo(1920, 480); b.lineTo(0, 480); b.closePath(); b.fill();
      const gr = b.createLinearGradient(0, 470, 0, 1080); gr.addColorStop(0, '#0b111d'); gr.addColorStop(0.3, '#06080e'); gr.addColorStop(1, LP.ground);
      b.fillStyle = gr; b.fillRect(0, 470, 1920, 610);
      for (let k = 0; k < 14; k++) {
        const x = 60 + r() * 1800, y = 452 + r() * 12, warm = r() < 0.7;
        b.fillStyle = warm ? 'rgba(255,180,90,0.75)' : 'rgba(200,220,255,0.6)'; b.fillRect(x, y, 2.2, 2.2);
        const rg = b.createLinearGradient(0, 474, 0, 474 + 60 + r() * 60); rg.addColorStop(0, warm ? 'rgba(255,170,80,0.18)' : 'rgba(180,200,255,0.14)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
        b.fillStyle = rg; b.fillRect(x - 1, 474, 4, 120);
      }
      // wet tarmac: faint horizontal sheen and puddle edges
      for (let k = 0; k < 900; k++) { const y = 480 + Math.pow(r(), 0.7) * 600, w = 10 + r() * 90 * (y / 600); b.fillStyle = `rgba(150,170,210,${0.012 + r() * 0.02})`; b.fillRect(r() * 1920, y, w, 1 + (y / 600)); }
      st.bg = bg;
      // ---- buffers: exposure, its glow pyramid ----
      st.L = offscreen(1920, 1080); st.lg = st.L.getContext('2d');
      st.gh = offscreen(480, 270); st.ghg = st.gh.getContext('2d');
      st.g1 = offscreen(480, 270); st.g1g = st.g1.getContext('2d');
      st.g2 = offscreen(240, 135); st.g2g = st.g2.getContext('2d');
      // ---- sparks: emitted from the whisk while it burns, ballistic, bouncing once on the wet ground ----
      const sp = [], G = 1500, NS = 1150, o = [0, 0];
      while (sp.length < NS) {
        const te = lerp(LP_T.burn[0], LP_T.burn[3], r());
        if (r() > lpBurn(te)) continue;
        lpWool(te, o);
        const th = LP_WOOL.w * (te - LP_T.wool[0]) - PI / 2, tx = -Math.sin(th), ty = Math.cos(th);
        const spd = 240 + r() * r() * 850, dev = (r() - 0.5) * 1.1, out = 0.15 + r() * 0.4;
        let vx = (tx * Math.cos(dev) - ty * Math.sin(dev)) * spd + Math.cos(th) * spd * out, vy = (tx * Math.sin(dev) + ty * Math.cos(dev)) * spd + Math.sin(th) * spd * out;
        const x0 = o[0] + (r() - 0.5) * 10, y0 = o[1] + (r() - 0.5) * 10, life = 0.2 + r() * r() * 0.85, gy = LP_GY + r() * 110;
        // time to reach the ground: y0 + vy τ + ½Gτ² = gy
        const disc = vy * vy + 2 * G * (gy - y0), tb = disc > 0 ? (-vy + Math.sqrt(disc)) / G : 1e9;
        const s = { te, x0, y0, vx, vy, life, tb, hot: r() };
        if (tb < life) { s.bx = x0 + vx * tb; s.by = gy; s.bvx = vx * (0.35 + r() * 0.3); s.bvy = -(vy + G * tb) * (0.18 + r() * 0.2); }
        sp.push(s);
      }
      st.sparks = sp;
      // ---- the word: Catmull–Rom through the control points, resampled by arc length ----
      const P = LP_GLOW, dense = [];
      for (let i = 0; i < P.length - 1; i++) {
        const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
        for (let k = 0; k < 16; k++) {
          const u = k / 16, u2 = u * u, u3 = u2 * u;
          dense.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3),
            0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]);
        }
      }
      dense.push(P[P.length - 1]);
      let minX = 1e9, maxX = -1e9; dense.forEach(([x]) => { minX = Math.min(minX, x); maxX = Math.max(maxX, x); });
      const x0 = 960 - (maxX + minX) / 2 * LP_WORD.xh;
      const wp = dense.map(([x, y]) => [x0 + x * LP_WORD.xh, LP_WORD.base - y * LP_WORD.xh]);
      const cum = [0]; for (let i = 1; i < wp.length; i++) cum.push(cum[i - 1] + Math.hypot(wp[i][0] - wp[i - 1][0], wp[i][1] - wp[i - 1][1]));
      st.word = wp; st.wcum = cum; st.wlen = cum[cum.length - 1];
      return st;
    },
    draw(c, t, W, H, st) {
      const te = Math.min(t, LP_T.close);                // the exposure stops accumulating at the shutter close
      const open = t >= LP_T.open;
      const o = [0, 0];
      // ---- where the word's pen is at time t ----
      const wordAt = tt => {
        const u = seg(tt, LP_T.write[0], LP_T.write[1]), d = lerp(u, E.ioS(u), 0.35) * st.wlen, cum = st.wcum;
        let lo = 0, hi = cum.length - 1;
        while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] < d) lo = m; else hi = m; }
        const f = clamp((d - cum[lo]) / (cum[hi] - cum[lo] || 1));
        return { i: lo, x: lerp(st.word[lo][0], st.word[hi][0], f), y: lerp(st.word[lo][1], st.word[hi][1], f) };
      };
      // ---- the performer: body x, the light's position, its colour ----
      const pose = tt => {
        let bx, hx = null, hy = null, col = null;
        if (tt < LP_T.wand[0]) { bx = lerp(1760, 1610, E.outQ(seg(tt, 0, LP_T.wand[0]))); }
        else if (tt < LP_T.wand[1]) { const s = lpCoil(tt, o); bx = lerp(1610, 900, s) - 30; hx = o[0]; hy = o[1]; const h = (s * 2.2 + 0.55) % 1; col = `hsl(${Math.round(h * 360)},100%,62%)`; }
        else if (tt < LP_T.walk1[1]) bx = lerp(870, LP_WOOL.x, E.ioS(seg(tt, LP_T.walk1[0], LP_T.walk1[1])));
        else if (tt < LP_T.wool[1]) { bx = LP_WOOL.x; hx = LP_WOOL.x + 10; hy = LP_WOOL.y; const b = lpBurn(tt); if (b > 0.02) col = `rgba(255,150,50,${b})`; }
        else if (tt < LP_T.write[0]) bx = lerp(LP_WOOL.x, st.word[0][0] - 60, E.ioS(seg(tt, LP_T.walk2[0], LP_T.walk2[1])));
        else if (tt < LP_T.write[1] + 0.02) { const w = wordAt(tt), wl = wordAt(tt - 0.45); bx = Math.min(w.x, wl.x + 40) - 70; hx = w.x; hy = w.y; col = 'rgb(255,238,214)'; }
        else bx = st.word[st.word.length - 1][0] - 70;
        return { bx, hx, hy, col, walk: bx / 70 };
      };
      // the body: round-capped limbs, two-bone arm reaching for the light
      const figure = (g, P, style) => {
        const bx = P.bx, fy = LP_GY, hip = fy - LP_FH * 0.48, sh = fy - LP_FH * 0.8, head = fy - LP_FH * 0.9;
        const sw = Math.sin(P.walk) * 26, sx = bx + 10, sy = sh + 6;
        let hx = P.hx, hy = P.hy;
        if (hx === null) { hx = bx + 22 - sw * 0.4; hy = hip + 92; }
        // two-bone IK (upper 112, lower 112)
        const L1 = 112, L2 = 112, dx = hx - sx, dy = hy - sy, d = Math.min(L1 + L2 - 1, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
        const ca = clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1), ex = sx + Math.cos(a + Math.acos(ca)) * L1, ey = sy + Math.sin(a + Math.acos(ca)) * L1;
        const rx = sx + Math.cos(a) * d, ry = sy + Math.sin(a) * d;
        g.strokeStyle = style; g.fillStyle = style; g.lineCap = 'round'; g.lineJoin = 'round';
        const kn = fy - LP_FH * 0.24;
        g.lineWidth = 30; g.beginPath();
        g.moveTo(bx - 9, hip); g.lineTo(bx - 10 + sw * 0.6, kn); g.lineTo(bx - 14 + sw, fy - 6);
        g.moveTo(bx + 9, hip); g.lineTo(bx + 10 - sw * 0.6, kn); g.lineTo(bx + 14 - sw, fy - 6); g.stroke();
        // torso: shoulders wider than hips, a coat flaring a little
        g.beginPath(); g.moveTo(bx - 30, sh + 4); g.lineTo(bx + 30, sh + 4); g.lineTo(bx + 24, hip + 14); g.lineTo(bx - 24, hip + 14); g.closePath(); g.fill();
        g.lineWidth = 16; g.beginPath(); g.moveTo(bx - 22, sy); g.lineTo(bx - 30 - sw * 0.4, hip + 6); g.lineTo(bx - 26 - sw * 0.5, hip + 52); g.stroke();
        g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.lineTo(rx, ry); g.stroke();
        g.lineWidth = 14; g.beginPath(); g.moveTo(bx + 2, sh + 4); g.lineTo(bx + 3, head + 16); g.stroke();
        g.beginPath(); g.ellipse(bx + 3, head, 24, 28, 0, 0, TAU); g.fill();
      };
      const lit = (g, P, a) => {
        if (!P.col || P.hx === null) return;
        const gr = g.createRadialGradient(P.hx, P.hy, 10, P.hx, P.hy, 330);
        const rgb = P.col.startsWith('hsl') ? P.col.replace('hsl', 'hsla').replace(')', `,${a})`) : P.col.startsWith('rgba') ? P.col.replace(/,([\d.]+)\)$/, (m, x) => `,${x * a})`) : P.col.replace('rgb', 'rgba').replace(')', `,${a})`);
        gr.addColorStop(0, rgb); gr.addColorStop(1, 'rgba(0,0,0,0)');
        figure(g, P, gr);
      };

      // ---- the exposure buffer: everything the light has written so far ----
      const L = st.lg;
      L.globalCompositeOperation = 'source-over'; L.fillStyle = '#000'; L.fillRect(0, 0, W, H);
      L.globalCompositeOperation = 'lighter'; L.lineCap = 'round'; L.lineJoin = 'round';
      if (open) {
        // the coil and the steel wool stop changing once they are finished: those exposures are rendered once and cached
        const drawCoil = (L, te) => {
          // I. the LED tube: a three-band ribbon; each slice's brightness ∝ dwell time (1 / distance moved)
          const t0 = Math.max(LP_T.wand[0], LP_T.open), t1 = Math.min(te, LP_T.wand[1]);
          if (t1 > t0) {
            const DT = 1 / 300, a = [0, 0], bb = [0, 0];
            const bands = [[-26, -10, 0], [-9, 9, 0.33], [10, 26, 0.66]];
            for (let tt = t0; tt < t1; tt += DT) {
              const s = lpCoil(tt, a); lpCoil(Math.min(t1, tt + DT), bb);
              const len = Math.hypot(bb[0] - a[0], bb[1] - a[1]) + 0.5, al = clamp(5.5 / len, 0.05, 0.9) * E.outQ(seg(tt, LP_T.wand[0], LP_T.wand[0] + 0.15));
              bands.forEach(([y0, y1, off]) => {
                const h = (s * 2.2 + 0.55 + off) % 1;
                L.fillStyle = `hsla(${Math.round(h * 360)},100%,58%,${al})`;
                L.beginPath(); L.moveTo(a[0], a[1] + y0); L.lineTo(bb[0], bb[1] + y0); L.lineTo(bb[0] + 0.6, bb[1] + y1); L.lineTo(a[0] + 0.6, a[1] + y1); L.closePath(); L.fill();
              });
            }
          }
        };
        const drawWool = (L, te) => {
          // II. steel wool: the burning ring, one path per revolution so passes add up, then the sparks
          const w0 = LP_T.burn[0], w1 = Math.min(te, LP_T.burn[3]);
          if (w1 > w0) {
            const rev = TAU / LP_WOOL.w, DT = 1 / 600;
            for (let r0 = w0; r0 < w1; r0 += rev) {
              const r1 = Math.min(w1, r0 + rev), b = lpBurn((r0 + r1) / 2);
              L.beginPath(); lpWool(r0, o); L.moveTo(o[0], o[1]);
              for (let tt = r0 + DT; tt <= r1; tt += DT) { lpWool(tt, o); L.lineTo(o[0], o[1]); }
              lpWool(r1, o); L.lineTo(o[0], o[1]);
              L.strokeStyle = `rgba(255,120,30,${0.2 * b})`; L.lineWidth = 9; L.stroke();
              L.strokeStyle = `rgba(255,214,150,${0.35 * b})`; L.lineWidth = 2.2; L.stroke();
            }
            const Gv = 1500, paths = [new Path2D(), new Path2D(), new Path2D()];
            const piece = (p, x0, y0, vx, vy, a, b) => {
              const xa = x0 + vx * a, ya = y0 + vy * a + 0.5 * Gv * a * a, vya = vy + Gv * a, T = b - a;
              p.moveTo(xa, ya); p.quadraticCurveTo(xa + vx * T / 2, ya + vya * T / 2, x0 + vx * b, y0 + vy * b + 0.5 * Gv * b * b);
            };
            for (const s of st.sparks) {
              if (s.te > te) continue;
              const age = Math.min(te - s.te, s.life), p = paths[s.hot < 0.25 ? 0 : 1];
              const fly = Math.min(age, s.tb);
              if (fly > 0.002) piece(p, s.x0, s.y0, s.vx, s.vy, 0, fly);
              if (age > s.tb && s.bx !== undefined) piece(paths[2], s.bx, s.by, s.bvx, s.bvy, 0, age - s.tb);
            }
            L.lineWidth = 1.6; L.strokeStyle = 'rgba(255,236,190,0.6)'; L.stroke(paths[0]);
            L.lineWidth = 1.2; L.strokeStyle = 'rgba(255,160,60,0.4)'; L.stroke(paths[1]);
            L.lineWidth = 1.1; L.strokeStyle = 'rgba(255,110,40,0.35)'; L.stroke(paths[2]);
            // a white-hot core at the whisk while it burns
            const b = lpBurn(te);
            if (b > 0.01 && te < LP_T.burn[3]) { lpWool(te, o); const g = L.createRadialGradient(o[0], o[1], 0, o[0], o[1], 30); g.addColorStop(0, `rgba(255,240,200,${b})`); g.addColorStop(1, 'rgba(255,120,30,0)'); L.fillStyle = g; L.fillRect(o[0] - 30, o[1] - 30, 60, 60); }
          }
        };
        const cached = (key, done, fn) => {
          if (!done) { fn(L, te); return; }
          if (!st[key]) { const cv = offscreen(1920, 1080), g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round'; fn(g, LP_T.close); st[key] = cv; }
          L.drawImage(st[key], 0, 0);
        };
        cached('coilCache', te >= LP_T.wand[1], drawCoil);
        cached('woolCache', te >= LP_T.burn[3] + 1.2, drawWool);
        // III. the written word: a warm-white pen light
        if (te > LP_T.write[0]) {
          const w = wordAt(te), wp = st.word;
          L.beginPath(); L.moveTo(wp[0][0], wp[0][1]);
          for (let i = 1; i <= w.i; i++) L.lineTo(wp[i][0], wp[i][1]);
          L.lineTo(w.x, w.y);
          L.strokeStyle = 'rgba(255,200,140,0.32)'; L.lineWidth = 15; L.stroke();
          L.strokeStyle = 'rgba(255,238,214,0.95)'; L.lineWidth = 4.5; L.stroke();
          // the light was switched on and off at rest: brighter dots at both ends
          const dot = (x, y, a) => { const g = L.createRadialGradient(x, y, 0, x, y, 16); g.addColorStop(0, `rgba(255,245,225,${a})`); g.addColorStop(1, 'rgba(255,200,140,0)'); L.fillStyle = g; L.fillRect(x - 16, y - 16, 32, 32); };
          dot(wp[0][0], wp[0][1], 0.8);
          if (te >= LP_T.write[1]) dot(wp[wp.length - 1][0], wp[wp.length - 1][1], 0.8);
        }
        // the performer's ghosts: only the light that fell on them was recorded (soft, at quarter resolution)
        const gh = st.ghg; gh.setTransform(1, 0, 0, 1, 0, 0); gh.globalCompositeOperation = 'source-over'; gh.fillStyle = '#000'; gh.fillRect(0, 0, 480, 270);
        gh.globalCompositeOperation = 'lighter'; gh.setTransform(0.25, 0, 0, 0.25, 0, 0);
        for (let tt = LP_T.open; tt <= te; tt += 0.12) lit(gh, pose(tt), 0.022);
        gh.setTransform(1, 0, 0, 1, 0, 0); gh.globalCompositeOperation = 'copy'; gh.filter = 'blur(1.5px)'; gh.drawImage(st.gh, 0, 0); gh.filter = 'none';
        L.globalCompositeOperation = 'lighter'; L.drawImage(st.gh, 0, 0, W, H);
      }
      // glow pyramid
      const g1 = st.g1g, g2 = st.g2g;
      g1.globalCompositeOperation = 'copy'; g1.filter = 'blur(2px)'; g1.drawImage(st.L, 0, 0, 480, 270); g1.filter = 'none';
      g2.globalCompositeOperation = 'copy'; g2.filter = 'blur(3px)'; g2.drawImage(st.g1, 0, 0, 240, 135); g2.filter = 'none';

      // ---- composite ----
      c.drawImage(st.bg, 0, 0);
      // the steel wool lit the quay: an accumulated warm pool on the ground
      const burned = open ? clamp((te - LP_T.burn[0]) / (LP_T.burn[3] - LP_T.burn[0])) : 0;
      if (burned > 0) {
        c.save(); c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(LP_WOOL.x, LP_GY + 30, 10, LP_WOOL.x, LP_GY + 30, 520);
        g.addColorStop(0, `rgba(255,130,40,${0.22 * burned})`); g.addColorStop(1, 'rgba(255,100,30,0)');
        c.fillStyle = g; c.fillRect(0, 470, W, 610); c.restore();
      }
      // the live performer: a dark silhouette against the faint sky
      if (t < LP_T.close + 0.4) {
        const P = pose(te), fa = t < LP_T.close ? 0.85 : 0.85 * (1 - seg(t, LP_T.close, LP_T.close + 0.35));
        c.save(); c.globalAlpha = fa; figure(c, P, '#020307'); c.restore();
        if (P.col && t < LP_T.close && (t < LP_T.wool[0] || t > LP_T.wool[1])) { c.save(); c.globalCompositeOperation = 'lighter'; lit(c, P, 0.16); c.restore(); }
      }
      c.save(); c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(st.L, 0, 0);
      c.globalAlpha = 0.7; c.drawImage(st.g1, 0, 0, W, H);
      c.globalAlpha = 0.75; c.drawImage(st.g2, 0, 0, W, H);
      // wet ground: a soft mirror of the light about the feet line
      c.beginPath(); c.rect(0, LP_GY, W, H - LP_GY); c.clip();
      c.translate(0, LP_GY * 2); c.scale(1, -1);
      c.globalAlpha = 0.32; c.drawImage(st.g1, 0, 0, W, H);
      c.globalAlpha = 0.4; c.drawImage(st.g2, 0, 0, W, H);
      c.restore();

      // ---- camera HUD ----
      const hud = 1 - seg(t, LP_T.close + 0.1, LP_T.close + 0.5);
      if (hud > 0) {
        c.save(); c.globalAlpha = hud * E.outQ(seg(t, 0.05, 0.3));
        const el = open ? Math.min(t, LP_T.close) - LP_T.open : 0;
        text(c, 'BULB   ƒ/8   ISO 100', 72, 1020, { font: JBM, size: 19, color: LP.hud, ls: 2 });
        text(c, `${el.toFixed(1).padStart(4, '0')} s`, 1848, 1020, { font: JBM, size: 19, align: 'right', color: LP.hud, ls: 2 });
        if (open) { c.fillStyle = LP.rec; c.globalAlpha = hud * (0.55 + 0.45 * (Math.floor(t * 2) % 2)); c.beginPath(); c.arc(1748, 1013, 7, 0, TAU); c.fill(); }
        c.restore();
        // chapter marks
        const ch = [[LP_T.wand[0], 'I  ·  LED WAND'], [LP_T.wool[0], 'II  ·  STEEL WOOL'], [LP_T.write[0], 'III  ·  WRITING IN THE AIR']];
        ch.forEach(([t0, s], i) => {
          const nxt = i < 2 ? ch[i + 1][0] : LP_T.close;
          const a = E.outQ(seg(t, t0, t0 + 0.3)) * (1 - seg(t, nxt - 0.3, nxt));
          if (a > 0) text(c, s, 72, 92, { font: ARC, weight: 500, size: 18, color: `rgba(225,232,245,${0.75 * a * hud})`, ls: 5 });
        });
      }
      // shutter blades: a brief iris at open and close (dark, never a flash)
      const sh = Math.max(1 - seg(t, LP_T.open - 0.12, LP_T.open + 0.1), seg(t, LP_T.close - 0.05, LP_T.close + 0.08) * (1 - seg(t, LP_T.close + 0.14, LP_T.close + 0.32)));
      if (sh > 0.001) { c.fillStyle = `rgba(0,0,0,${0.85 * sh})`; c.fillRect(0, 0, W, H); }
      // ---- the finished frame ----
      const ta = E.outC(seg(t, LP_T.title, LP_T.title + 0.6));
      if (ta > 0) {
        c.save(); c.globalAlpha = ta;
        const y0 = 990 + (1 - ta) * 14;
        text(c, 'Light Painting', 960, y0, { font: ARC, weight: 300, size: 64, align: 'center', color: '#eef2fa', ls: 10 });
        text(c, "after Gjon Mili's photographs of Picasso, LIFE 1949", 960, y0 + 44, { font: DMS, style: 'italic', size: 26, align: 'center', color: 'rgba(255,190,120,0.85)' });
        c.restore();
      }
      grain(c, W, H, t, 0.06, 'overlay');
      vignette(c, W, H, 0.45);
    },
    score(A) {
      A.bus.gain.value = 1.2;
      // night air on the quay
      A.noise(0.0, { type: 'lowpass', f: 420, dur: 10, g: 0.05, hold: true, a: 1.0, rel: 1.0, rev: 0.3 });
      A.osc(0.0, { type: 'sine', f: 55, dur: 10, g: 0.04, a: 1.5, hold: true, rel: 1.0 });
      // shutter opens on bulb: mirror slap and curtain
      const shutter = (t, g = 1) => {
        A.noise(t, { type: 'highpass', f: 2500, dur: 0.015, g: 0.2 * g });
        A.noise(t + 0.004, { type: 'bandpass', f: 1200, q: 3, dur: 0.05, g: 0.12 * g });
        A.osc(t, { f: 160, f2: 70, glide: 0.06, dur: 0.1, g: 0.12 * g });
      };
      shutter(LP_T.open - 0.03);
      // I. the wand: a glassy tone whose vibrato follows the loops, and a whoosh per loop panning right to left
      const loopHz = 4.25 / (LP_T.wand[1] - LP_T.wand[0]);
      A.osc(LP_T.wand[0], { f: midi(69), dur: 2.5, g: 0.05, a: 0.25, hold: true, rel: 0.4, vib: [loopHz, 18], rev: 0.5, pan: 0.3 });
      A.osc(LP_T.wand[0], { f: midi(76), dur: 2.5, g: 0.03, a: 0.3, hold: true, rel: 0.4, vib: [loopHz, 26], rev: 0.5, pan: -0.3 });
      A.osc(LP_T.wand[0], { type: 'triangle', f: midi(45), dur: 2.6, g: 0.05, a: 0.4, hold: true, rel: 0.5, lp: 600 });
      for (let k = 0; k < 4; k++) A.whoosh(LP_T.wand[0] + k / loopHz + 0.05, 0.5, { f1: 400, f2: 2600, g: 0.06, pan: 0.6 - k * 0.35, rev: 0.3 });
      [69, 72, 76, 79, 81, 84].forEach((m, i) => A.bell(LP_T.wand[0] + 0.2 + i * 0.4, midi(m + 12), { g: 0.025, dur: 1.0, ratios: [1, 2.0, 3.01], pan: 0.5 - i * 0.2, rev: 0.6 }));
      // footsteps on wet ground
      [3.05, 3.27, 3.48, 5.9, 6.08].forEach((t, i) => A.noise(t, { type: 'bandpass', f: 700, q: 1.5, dur: 0.08, g: 0.05, pan: i < 3 ? -0.2 : -0.4 }));
      // II. steel wool: ignition, a whirling roar once per revolution, and a dense crackle of sparks
      A.noise(LP_T.burn[0] - 0.05, { type: 'bandpass', f: 2000, f2: 5000, sweep: 0.3, q: 1, dur: 0.4, g: 0.08 });
      const rev = TAU / LP_WOOL.w;
      for (let k = 0; k * rev < LP_T.burn[3] - LP_T.burn[0]; k++) {
        const tt = LP_T.burn[0] + k * rev, b = lpBurn(tt + rev / 2);
        A.noise(tt, { type: 'bandpass', f: 500, f2: 1400, sweep: rev, q: 1.4, dur: rev * 1.05, g: 0.12 * b, swell: 0.5, pan: -0.55 + 0.25 * Math.sin(k * 1.7) });
      }
      A.noise(LP_T.burn[0], { type: 'lowpass', f: 300, dur: 2.25, g: 0.07, hold: true, a: 0.3, rel: 0.6 });
      for (let k = 0; k < 280; k++) {
        const tt = lerp(LP_T.burn[0], LP_T.burn[3], hash(k * 3.17));
        if (hash(k * 9.71) > lpBurn(tt)) continue;
        A.noise(tt, { type: 'bandpass', f: 2500 + hash(k * 5.3) * 5000, q: 3, dur: 0.008 + hash(k) * 0.012, g: 0.05 + 0.06 * hash(k * 1.9), pan: -0.8 + hash(k * 2.7) * 0.9 });
      }
      // III. writing: a soft sine pen whose pitch follows the hand's height
      const segs = 14, wd = (LP_T.write[1] - LP_T.write[0]) / segs;
      for (let k = 0; k < segs; k++) {
        const y0 = LP_GLOW[Math.floor(k / segs * LP_GLOW.length)][1], y1 = LP_GLOW[Math.min(LP_GLOW.length - 1, Math.floor((k + 1) / segs * LP_GLOW.length))][1];
        A.osc(LP_T.write[0] + k * wd, { f: midi(64 + y0 * 6), f2: midi(64 + y1 * 6), glide: wd, dur: wd + 0.06, g: 0.04, a: 0.03, hold: true, rel: 0.04, rev: 0.6, pan: -0.4 + k / segs * 0.8 });
      }
      A.chord(LP_T.write[0], [52, 59, 64], { type: 'triangle', dur: 2.2, g: 0.025, a: 0.6, hold: true, rel: 0.5, lp: 900, width: 0.6, rev: 0.5 });
      // shutter closes on the frame
      shutter(LP_T.close, 0.9);
      A.chord(LP_T.close + 0.1, [40, 52, 59, 64, 68, 71], { type: 'sine', dur: 1.2, g: 0.04, a: 0.15, width: 0.8, rev: 0.7 });
      A.bell(LP_T.title, midi(88), { g: 0.04, dur: 1.0, rev: 0.6 });
    },
  });
})();
