/* batch h8 — Experimental & Generative · Analog & Physical: Data Art · Infinite Zoom · Paper Craft.
   datagen (one synthetic city-year of hourly readings re-formed four times) · infinitezoom (a seamless loop of drawn scenes, each inside the last) · papercraft (a layered pop-up book diorama shot in stop motion). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, rrect, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Space+Grotesk:wght@400;700&family=Jost:ital,wght@0,400;0,500;0,700;1,400&family=DM+Mono:wght@400;500&family=Fraunces:ital,wght@0,600;0,800;1,600&display=block');
  const PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  // n css colours interpolated through a list of hex stops
  function ramp(stops, n) {
    const C = stops.map(hex), out = [];
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * (C.length - 1), k = Math.min(C.length - 2, Math.floor(x)), u = x - k;
      out.push(`rgb(${Math.round(lerp(C[k][0], C[k + 1][0], u))},${Math.round(lerp(C[k][1], C[k + 1][1], u))},${Math.round(lerp(C[k][2], C[k + 1][2], u))})`);
    }
    return out;
  }
  // a hex colour scaled by a light factor (cached; factor quantised so the cache stays small)
  const shadeCache = new Map();
  function shade(h, k) {
    const q = Math.round(k * 50) / 50, key = h + q;
    let s = shadeCache.get(key);
    if (!s) { const [r, g, b] = hex(h); s = `rgb(${clamp(r * q, 0, 255) | 0},${clamp(g * q, 0, 255) | 0},${clamp(b * q, 0, 255) | 0})`; shadeCache.set(key, s); }
    return s;
  }
  // Paper tile: warm mottling and fine fibres, tileable.
  function paperTile(base, seed, size = 512, dark = '80,60,40', lite = '255,252,244', amt = 1) {
    const c = offscreen(size, size), g = c.getContext('2d'), r = rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, size, size);
    for (let k = 0; k < 60; k++) {
      const x = r() * size, y = r() * size, rr = 30 + r() * 110, d = r() < 0.5;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, d ? `rgba(${dark},${(0.02 + r() * 0.03) * amt})` : `rgba(${lite},${(0.03 + r() * 0.04) * amt})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { g.save(); g.translate(ox, oy); g.fillRect(x - rr, y - rr, rr * 2, rr * 2); g.restore(); }
    }
    g.lineCap = 'round';
    for (let k = 0; k < 420; k++) {
      const x = r() * size, y = r() * size, a = r() * TAU, L = 4 + r() * 14;
      g.strokeStyle = r() < 0.5 ? `rgba(${dark},${0.06 * amt})` : `rgba(${lite},${0.1 * amt})`; g.lineWidth = 0.6 + r() * 0.6;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * L * 0.5, y + Math.sin(a + 0.6) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
    }
    for (let k = 0; k < 7000; k++) { g.fillStyle = r() < 0.5 ? `rgba(${dark},${0.05 * amt})` : `rgba(${lite},${0.07 * amt})`; g.fillRect(r() * size, r() * size, 1 + r() * 1.2, 1 + r() * 1.2); }
    return c;
  }

  /* =====================================================================
     DATA ART — one dataset, four forms. A synthetic city-year of hourly
     sensor readings (8,760 rows of temperature and electricity demand)
     first streams through a black-and-white raw matrix in the manner of
     Ryoji Ikeda's datamatics; every reading then flies on its own arc,
     like Koblin's flight tracks, into a day × hour calendar that shows the
     seasons and the daily cycle; folds into a Felton-style annual ring of
     demand with midnight at the centre; and finally rises into a rotating,
     fluid point-cloud sculpture — temperature as height, demand as colour
     — in the saturated pigment of Anadol's data paintings
     ===================================================================== */
  const DG = { bg: '#030304', ink: '#f4f4f2', dim: 'rgba(244,244,242,0.5)', faint: 'rgba(244,244,242,0.22)', hair: 'rgba(244,244,242,0.1)', acc: '#ff3d7f', cyan: '#62e7ff' };
  const DG_T = { scan: [0.1, 1.15], settle: 1.9, ab: 2.0, bc: 4.2, cd: 6.15, mv: 0.95, title: 8.45 };
  const DG_N = 8760, DG_AC = 146, DG_AR = 60, DG_AP = 12.3;            // the raw matrix: 146 × 60 cells, 12.3 px pitch
  const DG_BX = 110, DG_BY = 300, DG_BP = 1740 / 365, DG_BH = 22;      // calendar: day columns × hour rows
  const DG_CX = 960, DG_CY = 548;                                      // ring centre
  const DG_SW = [9, 4.1, 3.4, 2.6], DG_SH = [9, 19, 3.4, 2.6];          // point size per form
  const DG_MON = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const DG_ML = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const DG_FORMS = [
    ['RAW MATRIX', 'one cell per hour · demand above median = 1'],
    ['CALENDAR', 'temperature · 365 days × 24 hours'],
    ['ANNUAL RING', 'demand · midnight at the centre, 23:00 at the rim'],
    ['SCULPTURE', 'temperature as height · demand as colour'],
  ];
  // the dataset: deterministic, synthetic, physically plausible
  const DG_DATA = (() => {
    const N = DG_N, temp = new Float32Array(N), load = new Float32Array(N);
    for (let d = 0; d < 365; d++) {
      const season = -Math.cos(TAU * (d - 20) / 365);                       // coldest late January
      const front = vnoise(d / 3.1, 11) * 3.4 + vnoise(d / 9.7, 12) * 2.6;  // passing weather systems
      const wd = (d + 2) % 7, off = wd >= 5 || d === 0 || d >= 357;         // 1 Jan 2025 was a Wednesday
      for (let h = 0; h < 24; h++) {
        const i = d * 24 + h;
        const di = Math.sin(TAU * (h - 9) / 24) * (4.2 + 1.6 * season) + Math.sin(TAU * (h - 3) / 12) * 0.6;
        const T = 12 + 10.5 * season + di + front + vnoise(i / 4.3, 13) * 0.7;
        const am = Math.exp(-(((h - 8.3) / 1.5) ** 2)), pm = Math.exp(-(((h - 19) / 2.1) ** 2));
        const work = off ? 0.45 * Math.exp(-(((h - 13) / 3.5) ** 2)) + 0.3 * pm : 0.75 * am + 0.95 * pm + (h >= 9 && h <= 17 ? 0.35 : 0);
        const hvac = Math.max(0, 15 - T) * 0.045 + Math.max(0, T - 22) * 0.075;
        temp[i] = T; load[i] = 0.62 + work * 0.55 + hvac + (h < 5 ? -0.18 : 0) + vnoise(i / 2.7, 14) * 0.05;
      }
    }
    let tMin = 1e9, tMax = -1e9, lMin = 1e9, lMax = -1e9, peak = 0;
    for (let i = 0; i < N; i++) { tMin = Math.min(tMin, temp[i]); tMax = Math.max(tMax, temp[i]); lMin = Math.min(lMin, load[i]); if (load[i] > lMax) { lMax = load[i]; peak = i; } }
    const tN = temp.map(v => (v - tMin) / (tMax - tMin)), lN = load.map(v => (v - lMin) / (lMax - lMin));
    let tot = 0; for (let i = 0; i < N; i++) tot += load[i];
    return { temp, load, tN, lN, tMin, tMax, lMin, lMax, peak, twh: tot / 1000 };
  })();
  const dgDate = i => {
    let d = (i / 24) | 0, m = 0;
    while (d >= DG_MON[m]) d -= DG_MON[m++];
    return `2025-${String(m + 1).padStart(2, '0')}-${String(d + 1).padStart(2, '0')} ${String(i % 24).padStart(2, '0')}:00`;
  };

  MG.film({
    id: 'datagen', dur: 10, poster: 9.3,
    fonts: [['700 120px "Space Grotesk"', '8,760 Hours'], ['400 30px "Space Grotesk"', 'one synthetic city-year'], ['400 18px "IBM Plex Mono"', 'CITY_07 ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 #·:°→×—'], ['600 18px "IBM Plex Mono"', 'FORM RAW MATRIX']],
    meta: {
      family: 'E', name: 'Data Art', sub: 'A dataset as raw material for form', era: '2005 —',
      origin: 'Data art treats a dataset as material rather than evidence: the same numbers are re-mapped until their structure becomes something to look at, not a point to be argued. Aaron Koblin\'s Flight Patterns (2005) drew a day of FAA flight tracks as glowing arcs; Ryoji Ikeda\'s datamatics (from 2006) pushed raw data into stark black-and-white matrices and barcodes at the edge of perception; Nicholas Felton\'s annual reports set a year of one life as typographic charts; and Refik Anadol\'s Machine Hallucinations (from 2019) turn huge image archives into fluid, pigment-like data sculptures.',
      works: 'Aaron Koblin — Flight Patterns (2005) · Ryoji Ikeda — datamatics (2006–) and test pattern (2008–) · Nicholas Felton — The Feltron Annual Reports (2005–2014) · Refik Anadol — Machine Hallucinations (2019–)',
      tech: ['Synthetic hourly dataset', 'Per-point form morphing', 'Point-cloud data sculpture'],
      accent: '#ff3d7f',
      motionDNA: 'Nothing is keyframed by hand: every one of 8,760 readings is a point that travels its own arc between layouts the data defines — a scrolling matrix, a calendar, a ring, a rotating sculpture — so the structure of the year (seasons, weekends, rush hours) appears, dissolves and reappears in each form.',
      visualDNA: 'Absolute black, white hairlines and tiny monospaced readouts in Ikeda\'s manner; a diverging blue-to-red temperature calendar; a mint demand ring; and an additive magenta, violet and gold point cloud that glows where the data is dense.',
      transitions: 'Matrix stops scrolling, readings fly to the calendar, fold into the ring, then rise into the sculpture as the title lands',
      implementation: ['Processing / openFrameworks', 'TouchDesigner / Houdini point clouds', 'D3 + WebGL', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const st = {}, D = DG_DATA, N = DG_N, r = rng(8760);
      const F = n => new Float32Array(n);
      st.ax = F(N); st.ay = F(N); st.bx = F(N); st.by = F(N); st.ca = F(N); st.cr = F(N); st.X = F(N); st.Y = F(N); st.Z = F(N);
      st.dl1 = F(N); st.dl2 = F(N); st.dl3 = F(N); st.arc = F(N);
      st.bin = [new Uint8Array(N), new Uint8Array(N), new Uint8Array(N), new Uint8Array(N)];
      for (let i = 0; i < N; i++) {
        const d = (i / 24) | 0, h = i % 24;
        st.ax[i] = 960 - (DG_AC * DG_AP) / 2 + ((i % DG_AC) + 0.5) * DG_AP;
        st.ay[i] = 560 - (DG_AR * DG_AP) / 2 + (((i / DG_AC) | 0) + 0.5) * DG_AP;
        st.bx[i] = DG_BX + (d + 0.5) * DG_BP; st.by[i] = DG_BY + (h + 0.5) * DG_BH;
        st.ca[i] = -PI / 2 + (TAU * (d + 0.5)) / 365; st.cr[i] = 140 + h * 13 + D.lN[i] * 10;
        st.X[i] = (d / 364 - 0.5) * 1480; st.Z[i] = (h / 23 - 0.5) * 640; st.Y[i] = -((D.tN[i] - 0.5) * 380 + D.lN[i] * 110);
        st.dl1[i] = (d / 365) * 0.55 + r() * 0.18; st.dl2[i] = (h / 24) * 0.35 + r() * 0.3; st.dl3[i] = r() * 0.45 + (1 - h / 24) * 0.15;
        st.arc[i] = (r() - 0.5) * 0.75;
        st.bin[1][i] = Math.round(D.tN[i] * 23); st.bin[2][i] = Math.round(D.lN[i] * 23); st.bin[3][i] = Math.round(clamp(D.lN[i] * 0.75 + D.tN[i] * 0.25) * 23);
      }
      st.pal = [
        ramp(['#1a1a1a', '#6a6a6a', '#ffffff'], 24),
        ramp(['#173a8a', '#3f86d6', '#dfe9ef', '#f4a64a', '#d8352a'], 24),
        ramp(['#0b302f', '#18806f', '#6fdcb8', '#f2fff0'], 24),
        ramp(['#2a0d6e', '#7a1fd0', '#ff2f8f', '#ff8a3d', '#ffd66b', '#9ff4ff'], 24),
      ];
      st.px = F(N); st.py = F(N); st.pw = F(N); st.ph = F(N); st.key = new Uint8Array(N); st.ord = new Uint32Array(N); st.cnt = new Int32Array(98);
      st.trail = F(N * 4);
      // monthly means for the score
      return st;
    },
    draw(c, t, W, H, st) {
      const D = DG_DATA, N = DG_N;
      c.fillStyle = DG.bg; c.fillRect(0, 0, W, H);
      // measurement hairlines (Ikeda's test-pattern frame)
      c.fillStyle = DG.hair;
      for (let x = 62; x <= 1860; x += 150) c.fillRect(x, 120, 1, 860);
      c.fillRect(62, 120, 1798, 1); c.fillRect(62, 980, 1798, 1);

      const off = Math.floor(Math.max(0, DG_T.settle - t) * 30) * DG_AC;   // the matrix scrolls by whole rows until it settles
      const rotC = 0.06 * Math.max(0, t - 4.6);
      const yaw = -0.62 + (t - DG_T.cd) * 0.2, pit = 0.42 + 0.05 * Math.sin(t * 0.7);
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cpt = Math.cos(pit), spt = Math.sin(pit);
      const scY = 470 - 30 * E.ioC(seg(t, DG_T.title - 0.3, DG_T.title + 0.6));
      const pos = (f, i, o) => {
        if (f === 0) { o[0] = st.ax[i]; o[1] = st.ay[i]; o[2] = 1; }
        else if (f === 1) { o[0] = st.bx[i]; o[1] = st.by[i]; o[2] = 1; }
        else if (f === 2) { const a = st.ca[i] + rotC; o[0] = DG_CX + Math.cos(a) * st.cr[i]; o[1] = DG_CY + Math.sin(a) * st.cr[i]; o[2] = 1; }
        else {
          // the sculpture: a terrain of the year, rotated and put in perspective, with a slow fluid wobble
          const X = st.X[i], Z = st.Z[i];
          const Y = st.Y[i] + Math.sin(X * 0.009 + t * 1.6) * 16 + Math.cos(Z * 0.012 - t * 1.2) * 12;
          const x1 = X * cyw - Z * syw, z1 = X * syw + Z * cyw;
          const y1 = Y * cpt - z1 * spt, z2 = Y * spt + z1 * cpt, p = 1500 / (1500 + z2);
          o[0] = 960 + x1 * p + Math.sin(Y * 0.02 + t * 2.1 + i * 0.001) * 6; o[1] = scY + y1 * p; o[2] = p;
        }
      };
      const A = [0, 0, 1], B = [0, 0, 1], Q = [0, 0, 1];
      const cnt = st.cnt; cnt.fill(0);
      let nt = 0;
      const cur = Math.min(N - 1, Math.floor(seg(t, 0.2, 9.8) * (N - 1)));
      let curX = 0, curY = 0;
      for (let i = 0; i < N; i++) {
        const u1 = seg(t, DG_T.ab + st.dl1[i], DG_T.ab + st.dl1[i] + DG_T.mv);
        const u2 = seg(t, DG_T.bc + st.dl2[i], DG_T.bc + st.dl2[i] + DG_T.mv);
        const u3 = seg(t, DG_T.cd + st.dl3[i], DG_T.cd + st.dl3[i] + DG_T.mv * 1.15);
        let f0 = 0, f1 = 0, u = 0;
        if (u3 > 0) { f0 = 2; f1 = 3; u = u3; } else if (u2 > 0) { f0 = 1; f1 = 2; u = u2; } else if (u1 > 0) { f0 = 0; f1 = 1; u = u1; }
        const e = E.ioC(u), form = e < 0.5 ? f0 : f1;
        let bin;
        if (form === 0) {
          const row = (i / DG_AC) | 0, tr = DG_T.scan[0] + (row / DG_AR) * (DG_T.scan[1] - DG_T.scan[0]);
          if (t < tr && u === 0) { st.key[i] = 255; continue; }
          const lv = D.lN[(i + off) % N];
          bin = t - tr < 0.05 && u === 0 ? 23 : lv > 0.6 ? 23 : lv > 0.42 ? 12 : 3;
        } else bin = st.bin[form][i];
        pos(f0, i, A);
        let x = A[0], y = A[1], p = A[2];
        if (u > 0) {
          pos(f1, i, B);
          const dx = B[0] - A[0], dy = B[1] - A[1], k = st.arc[i] * Math.sin(PI * e);
          x = A[0] + dx * e - dy * k; y = A[1] + dy * e + dx * k; p = lerp(A[2], B[2], e);
          if (u < 1) {
            // a short flight trail behind each moving reading (Koblin)
            const e2 = E.ioC(clamp(u - 0.1)), k2 = st.arc[i] * Math.sin(PI * e2);
            const tb = nt * 4; st.trail[tb] = A[0] + dx * e2 - dy * k2; st.trail[tb + 1] = A[1] + dy * e2 + dx * k2; st.trail[tb + 2] = x; st.trail[tb + 3] = y; nt++;
          }
        }
        st.px[i] = x; st.py[i] = y;
        st.pw[i] = lerp(DG_SW[f0], DG_SW[f1], e) * (form === 3 ? p : 1) * (form === 0 && bin === 23 && t < DG_T.settle + 0.1 ? 1.06 : 1);
        st.ph[i] = lerp(DG_SH[f0], DG_SH[f1], e) * (form === 3 ? p : 1);
        const key = form * 24 + bin; st.key[i] = key; cnt[key + 1]++;
        if (i === cur) { curX = x; curY = y; }
      }
      for (let k = 1; k < 98; k++) cnt[k] += cnt[k - 1];
      const fill = cnt.slice();
      for (let i = 0; i < N; i++) { const k = st.key[i]; if (k !== 255) st.ord[fill[k]++] = i; }
      // trails under the points
      if (nt > 0) {
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(200,220,255,0.16)'; c.lineWidth = 1.2; c.beginPath();
        for (let q = 0; q < nt; q++) { const b = q * 4; c.moveTo(st.trail[b], st.trail[b + 1]); c.lineTo(st.trail[b + 2], st.trail[b + 3]); }
        c.stroke(); c.restore();
      }
      for (let k = 0; k < 96; k++) {
        const a = cnt[k], b = cnt[k + 1];
        if (b <= a) continue;
        const form = (k / 24) | 0;
        c.save();
        if (form === 3) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85; }
        c.fillStyle = st.pal[form][k % 24]; c.beginPath();
        for (let q = a; q < b; q++) { const i = st.ord[q], w = st.pw[i], h = st.ph[i]; c.rect(st.px[i] - w / 2, st.py[i] - h / 2, w, h); }
        c.fill(); c.restore();
      }

      const mono = '"IBM Plex Mono", monospace';
      // ---- form-specific annotation ----
      const aA = 1 - seg(t, 1.9, 2.3);
      if (aA > 0) {
        // Ikeda barcode: the data stream itself, one bar per reading, racing past
        c.save(); c.globalAlpha = aA; c.fillStyle = DG.ink; c.beginPath();
        const sh = Math.floor(t * 420);
        for (let x = 62; x < 1860; x += 3) { const i = (((x - 62) / 3) | 0) + sh; if (D.lN[i % N] > 0.5) c.rect(x, 944, 2, 26); }
        c.fill();
        c.beginPath();
        for (let x = 62; x < 1860; x += 2) { const i = (((x - 62) / 2) | 0) * 7 + sh * 3; if (D.tN[i % N] > 0.55) c.rect(x, 98, 1, 12); }
        c.fill();
        c.restore();
      }
      const aB = E.outC(seg(t, 2.9, 3.4)) * (1 - seg(t, 4.2, 4.5));
      if (aB > 0) {
        c.save(); c.globalAlpha = aB;
        let d0 = 0;
        DG_ML.forEach((m, k) => {
          const x = DG_BX + d0 * DG_BP; c.fillStyle = DG.faint; c.fillRect(x, DG_BY - 22, 1, 14);
          text(c, m, x + 6, DG_BY - 10, { font: mono, size: 15, color: DG.dim, ls: 2 }); d0 += DG_MON[k];
        });
        ['00', '06', '12', '18', '23'].forEach(s => text(c, s, DG_BX - 14, DG_BY + (parseInt(s, 10) + 0.5) * DG_BH + 5, { font: mono, size: 15, color: DG.dim, align: 'right' }));
        // legend
        const lx = 1490, ly = 878;
        for (let k = 0; k < 24; k++) { c.fillStyle = st.pal[1][k]; c.fillRect(lx + k * 12, ly, 12, 10); }
        text(c, `${D.tMin.toFixed(0)} °C`, lx - 10, ly + 10, { font: mono, size: 15, color: DG.dim, align: 'right' });
        text(c, `${D.tMax.toFixed(0)} °C`, lx + 298, ly + 10, { font: mono, size: 15, color: DG.dim });
        text(c, 'SUMMER AFTERNOONS', DG_BX + 196 * DG_BP, DG_BY + 24 * DG_BH + 34, { font: mono, size: 15, color: DG.ink, ls: 2, align: 'center' });
        text(c, 'WINTER NIGHTS', DG_BX + 18 * DG_BP, DG_BY + 24 * DG_BH + 34, { font: mono, size: 15, color: DG.ink, ls: 2 });
        c.restore();
      }
      const aC = E.outC(seg(t, 5.1, 5.6)) * (1 - seg(t, 6.15, 6.5));
      if (aC > 0) {
        c.save(); c.globalAlpha = aC;
        let d0 = 0;
        DG_ML.forEach((m, k) => {
          const a = -PI / 2 + (TAU * d0) / 365 + rotC, a2 = a + (TAU * DG_MON[k] / 2) / 365;
          c.strokeStyle = DG.faint; c.lineWidth = 1; c.beginPath(); c.moveTo(DG_CX + Math.cos(a) * 128, DG_CY + Math.sin(a) * 128); c.lineTo(DG_CX + Math.cos(a) * 462, DG_CY + Math.sin(a) * 462); c.stroke();
          text(c, m, DG_CX + Math.cos(a2) * 482, DG_CY + Math.sin(a2) * 482 + 5, { font: mono, size: 15, color: DG.dim, align: 'center', ls: 2 }); d0 += DG_MON[k];
        });
        text(c, 'DEMAND', DG_CX, DG_CY - 26, { font: mono, weight: 600, size: 16, color: DG.dim, align: 'center', ls: 4 });
        text(c, `${D.twh.toFixed(2)} TWh`, DG_CX, DG_CY + 14, { font: '"Space Grotesk", sans-serif', weight: 700, size: 40, color: DG.ink, align: 'center' });
        text(c, `peak ${D.lMax.toFixed(2)} GW`, DG_CX, DG_CY + 44, { font: mono, size: 15, color: DG.dim, align: 'center' });
        c.restore();
      }
      // ---- reading head: the cursor hour, wherever its point currently is ----
      const ha = E.outC(seg(t, 0.4, 0.8)) * (1 - seg(t, DG_T.title - 0.2, DG_T.title + 0.3));
      if (ha > 0) {
        c.save(); c.globalAlpha = ha; c.strokeStyle = DG.acc; c.lineWidth = 2;
        c.beginPath(); c.arc(curX, curY, 14, 0, TAU); c.stroke();
        c.globalAlpha = ha * 0.5; c.lineWidth = 1;
        c.beginPath(); c.moveTo(curX + 14, curY); c.lineTo(curX + 60, curY - 34); c.lineTo(curX + 160, curY - 34); c.stroke();
        c.globalAlpha = ha;
        text(c, `#${String(cur).padStart(4, '0')}`, curX + 64, curY - 42, { font: mono, weight: 600, size: 15, color: DG.acc });
        c.restore();
      }
      // ---- HUD ----
      const fi = t < 2.75 ? 0 : t < 4.95 ? 1 : t < 6.9 ? 2 : 3, ft = [0, 2.75, 4.95, 6.9][fi];
      const hud = 1 - E.inQ(seg(t, DG_T.title - 0.3, DG_T.title + 0.2));
      c.save();
      c.globalAlpha = E.outC(seg(t, 0.05, 0.4));
      text(c, 'CITY_07 · SYNTHETIC SENSOR YEAR', 64, 62, { font: mono, weight: 600, size: 18, color: DG.ink, ls: 3 });
      text(c, '2025-01-01 00:00 → 2025-12-31 23:00 · Δt 1 h · N 8760', 64, 86, { font: mono, size: 15, color: DG.dim });
      text(c, `${dgDate(cur)}   ${D.temp[cur].toFixed(1).padStart(5, ' ')} °C   ${D.load[cur].toFixed(2)} GW`, 1856, 62, { font: mono, size: 18, color: DG.ink, align: 'right' });
      text(c, 'temperature · demand', 1856, 86, { font: mono, size: 15, color: DG.dim, align: 'right' });
      c.globalAlpha = hud * E.outC(seg(t, ft, ft + 0.35));
      text(c, `FORM 0${fi + 1} / 04 — ${DG_FORMS[fi][0]}`, 64, 1022, { font: mono, weight: 600, size: 18, color: DG.ink, ls: 3 });
      text(c, DG_FORMS[fi][1], 64, 1048, { font: mono, size: 15, color: DG.dim });
      c.globalAlpha = hud;
      for (let k = 0; k < 4; k++) { c.fillStyle = k === fi ? DG.acc : DG.faint; c.fillRect(1784 + k * 20, 1032, 12, 12); }
      c.restore();
      // ---- title ----
      const ta = E.outC(seg(t, DG_T.title, DG_T.title + 0.7));
      if (ta > 0) {
        c.save(); c.globalAlpha = ta;
        const y = 948 + (1 - ta) * 18;
        text(c, '8,760 Hours', 64, y, { font: '"Space Grotesk", sans-serif', weight: 700, size: 120, color: DG.ink, ls: -3 });
        text(c, 'one synthetic city-year, four forms', 70, y + 50, { font: '"Space Grotesk", sans-serif', size: 30, color: DG.dim });
        text(c, 'AFTER IKEDA · KOBLIN · FELTON · ANADOL', 1856, y + 50, { font: mono, weight: 600, size: 16, color: DG.acc, align: 'right', ls: 3 });
        c.restore();
      }
      grain(c, W, H, t, 0.035, 'screen');
    },
    score(A) {
      A.bus.gain.value = 1.2;
      const D = DG_DATA, s16 = 60 / 150 / 4;
      // raw matrix: the data clicks — a hi-hat tick per set bit, a pure-sine blip quantised from temperature, a sub pulse per beat
      for (let k = 0; k * s16 < 1.95; k++) {
        const tt = 0.1 + k * s16, i = (k * 97 + 13) % DG_N;
        if (D.lN[i] > 0.55) A.noise(tt, { type: 'highpass', f: 7500, dur: 0.012, g: 0.07, pan: (hash(k) - 0.5) * 0.9 });
        if (k % 3 === 0) A.osc(tt, { type: 'sine', f: 1500 + Math.round(D.tN[i] * 7) * 500, dur: 0.035, g: 0.03, pan: (hash(k * 3.3) - 0.5) * 0.8 });
        if (k % 4 === 0) A.osc(tt, { type: 'sine', f: 55, dur: 0.16, g: 0.2 });
      }
      A.osc(0.1, { type: 'sine', f: 880, dur: 1.85, g: 0.012, hold: true, rel: 0.1 });
      A.osc(1.85, { type: 'sine', f: 55, dur: 0.6, g: 0.25 });
      // to the calendar: readings take flight
      A.whoosh(1.95, 1.4, { f1: 300, f2: 5200, g: 0.11, rev: 0.4 });
      // calendar: twelve plucks, one per month, pitched from that month's mean temperature
      const pent = [50, 52, 55, 57, 59, 62, 64, 67, 69, 71, 74, 76];
      let d0 = 0;
      DG_MON.forEach((n, m) => {
        let s = 0; for (let i = d0 * 24; i < (d0 + n) * 24; i++) s += D.tN[i];
        d0 += n;
        A.pluck(3.05 + m * 0.095, midi(pent[Math.min(11, Math.floor((s / (n * 24)) * 12))] + 12), { g: 0.16, dur: 1.3, bright: 0.5, pan: m / 11 - 0.5, rev: 0.4 });
      });
      A.chord(3.0, [38, 50, 57], { type: 'triangle', dur: 1.4, g: 0.035, a: 0.2, lp: 900, rev: 0.4 });
      // to the ring
      A.whoosh(4.2, 1.2, { f1: 4000, f2: 400, g: 0.09, rev: 0.4 });
      // ring: a slow rotating bell figure in fifths
      [62, 69, 74, 69, 66, 73, 78, 73].forEach((m, i) => A.bell(5.05 + i * 0.14, midi(m), { g: 0.035, dur: 1.2, pan: Math.sin(i * 0.8) * 0.6, rev: 0.5 }));
      A.osc(5.0, { type: 'sine', f: 73.4, dur: 1.4, g: 0.12, a: 0.3, rev: 0.3 });
      // sculpture: the data rises, a wide detuned pad and a glittering cloud of plucks
      A.riser(5.75, 0.6, { g: 0.12, f: 147 });
      A.chord(6.2, [50, 57, 62, 64, 69], { type: 'sawtooth', dur: 3.8, g: 0.022, a: 1.0, hold: true, rel: 0.8, lp: 500, lp2: 2600, lpT: 2.6, spread: 9, width: 0.9, rev: 0.6 });
      A.osc(6.2, { type: 'sine', f: 36.7, dur: 3.8, g: 0.12, a: 0.6, hold: true, rel: 0.8 });
      for (let k = 0; k < 24; k++) {
        const i = (k * 353 + 41) % DG_N;
        A.pluck(6.3 + k * 0.088, midi(pent[Math.floor(D.lN[i] * 11.99)] + 12), { g: 0.07, dur: 0.9, bright: 0.6, pan: hash(k * 2.1) - 0.5, rev: 0.6 });
      }
      // title
      A.impact(8.45, 0.35, { rev: 0.5 });
      A.bell(8.45, midi(86), { g: 0.05, dur: 1.5, rev: 0.6 });
      A.chord(8.45, [38, 50, 57, 62, 66, 69], { type: 'sine', dur: 1.55, g: 0.035, a: 0.03, width: 0.8, rev: 0.7 });
    },
  });

  /* =====================================================================
     INFINITE ZOOM — Powers of Ten's picnic, reached from inside itself.
     Five drawn scenes are nested like a zoom quilt: a park seen from
     above holds a magazine on a picnic blanket; the magazine's photo holds
     a cabin whose window looks into a room; the painting on the room's
     wall shows a city whose billboard is a computer desktop; and the
     photo open on that desktop is the park again. The camera divides its
     field by five every two seconds about each portal's fixed point, so
     the zoom never speeds up, slows down or ends — the film loops
     ===================================================================== */
  const IZ = { hud: '#fbfaf5', dim: 'rgba(251,250,245,0.66)', acc: '#ffcf3a' };
  const IZ_K = 5, IZ_NS = 5, IZ_RATE = IZ_NS / 10;
  // each scene's portal: centre in scene px, and the portal's rotation (its contents are the next scene at 1/K)
  const IZ_C = [[1010, 590, 0.16], [1240, 556, -0.06], [905, 430, 0], [1000, 382, 0.08], [760, 520, -0.05]];
  // the fixed point of each portal map x → C + R(r)(x − mid)/K, solved once
  const IZ_P = IZ_C.map(([cx, cy, r]) => {
    const co = Math.cos(r) / IZ_K, si = Math.sin(r) / IZ_K;
    const bx = cx - (co * 960 - si * 540), by = cy - (si * 960 + co * 540), a = 1 - co, det = a * a + si * si;
    return [(a * bx - si * by) / det, (si * bx + a * by) / det];
  });
  const IZ_CAP = ['A picnic, seen from above', 'A magazine on the blanket', 'Through the cabin window', 'A painting on the cabin wall', 'A screen in the painted city'];
  const izChild = (c, k) => { const [cx, cy, r] = IZ_C[k]; c.translate(cx, cy); c.rotate(r); c.scale(1 / IZ_K, 1 / IZ_K); c.translate(-960, -540); };
  // portal-map a point of scene k's child into scene k
  const izMap = (k, x, y) => { const [cx, cy, r] = IZ_C[k], co = Math.cos(r) / IZ_K, si = Math.sin(r) / IZ_K, dx = x - 960, dy = y - 540; return [cx + co * dx - si * dy, cy + si * dx + co * dy]; };
  const izLoop = (t, n, ph = 0) => Math.sin(TAU * (t / 10) * n + ph);   // periodic in the 10 s loop

  // ---- scene 0: the park from above ----
  function izPark(c, t, px, st) {
    c.fillStyle = '#76a34f'; c.fillRect(0, 0, 1920, 1080);
    c.save(); c.translate(960, 540); c.rotate(-0.5); c.fillStyle = 'rgba(255,255,230,0.07)';
    for (let x = -1500; x < 1500; x += 170) c.fillRect(x, -1400, 85, 2800);
    c.restore();
    c.lineCap = 'round';
    c.beginPath(); c.moveTo(-120, 990); c.bezierCurveTo(480, 780, 560, 120, 2040, 170);
    c.strokeStyle = '#bba877'; c.lineWidth = 98; c.stroke(); c.strokeStyle = '#ddcd9f'; c.lineWidth = 80; c.stroke();
    // pond with ripples and ducks
    c.save(); c.translate(1580, 860); c.beginPath(); c.ellipse(0, 0, 270, 165, -0.12, 0, TAU); c.fillStyle = '#5b8f4a'; c.fill();
    c.beginPath(); c.ellipse(0, 0, 250, 148, -0.12, 0, TAU); c.fillStyle = '#4a8db3'; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 3;
    for (let k = 0; k < 3; k++) { const u = (t / 10 * 5 + k / 3) % 1; c.globalAlpha = 1 - u; c.beginPath(); c.ellipse(-60, 10, 20 + u * 120, 12 + u * 70, -0.12, 0, TAU); c.stroke(); }
    c.globalAlpha = 1;
    for (let k = 0; k < 3; k++) { const a = TAU * (t / 10) + k * 2.1; const x = Math.cos(a) * 150, y = Math.sin(a) * 80; c.fillStyle = '#f5f1e6'; c.beginPath(); c.ellipse(x, y, 16, 10, a + PI / 2, 0, TAU); c.fill(); c.fillStyle = '#2f6a3a'; c.beginPath(); c.arc(x + Math.cos(a + PI / 2) * 11, y + Math.sin(a + PI / 2) * 11, 6, 0, TAU); c.fill(); }
    c.restore();
    // walkers on the path (top-down: shadow, shoulders, head)
    for (let k = 0; k < 5; k++) {
      const u = (t / 10 + k / 5) % 1, v = 1 - u;
      const x = v * v * v * -120 + 3 * v * v * u * 480 + 3 * v * u * u * 560 + u * u * u * 2040, y = v * v * v * 990 + 3 * v * v * u * 780 + 3 * v * u * u * 120 + u * u * u * 170;
      c.fillStyle = 'rgba(0,0,0,0.22)'; c.beginPath(); c.ellipse(x + 14, y + 10, 18, 13, 0, 0, TAU); c.fill();
      c.fillStyle = ['#e8604f', '#3d6fb5', '#f2c14e', '#8a5ab8', '#f0f0ea'][k]; c.beginPath(); c.ellipse(x, y, 19, 12, 0.5, 0, TAU); c.fill();
      c.fillStyle = ['#3b2a20', '#e8c39e', '#5a3a2a', '#1c1c1c', '#b07a4a'][k]; c.beginPath(); c.arc(x, y, 8, 0, TAU); c.fill();
    }
    // trees: shadow, lumpy canopy, highlight
    st.trees.forEach(([x, y, r, s]) => {
      c.fillStyle = 'rgba(20,40,10,0.3)'; c.beginPath(); c.arc(x + r * 0.35, y + r * 0.3, r, 0, TAU); c.fill();
      c.fillStyle = s ? '#2f5f2c' : '#3b7034'; c.beginPath();
      for (let k = 0; k < 7; k++) { const a = k * 0.9 + x; c.moveTo(x + Math.cos(a) * r * 0.45 + r * 0.55, y + Math.sin(a) * r * 0.45); c.arc(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, r * 0.55, 0, TAU); }
      c.fill();
      if (px > 500) { c.fillStyle = 'rgba(190,230,120,0.25)'; c.beginPath(); c.arc(x - r * 0.25, y - r * 0.25, r * 0.4, 0, TAU); c.fill(); }
    });
    // the blanket, the picnic and the magazine, all in the portal's rotation
    c.save(); c.translate(1010, 590); c.rotate(0.16);
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(-372, -252, 780, 540);
    c.fillStyle = '#f4efe6'; c.fillRect(-390, -270, 780, 540);
    c.fillStyle = 'rgba(214,58,52,0.85)';
    for (let i = 0; i < 12; i++) c.fillRect(-390 + i * 65, -270, 32, 540);
    for (let j = 0; j < 9; j++) c.fillRect(-390, -270 + j * 60, 780, 30);
    // basket and apples
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(214, -238, 130, 92);
    c.fillStyle = '#a8743f'; c.fillRect(200, -250, 130, 92); c.strokeStyle = '#7b5229'; c.lineWidth = 4;
    for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(200 + k * 26, -250); c.lineTo(200 + k * 26, -158); c.stroke(); }
    c.fillStyle = '#c93b2e'; [[-300, -200], [-262, -178], [-320, -160]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 17, 0, TAU); c.fill(); });
    // a reader lying beside the magazine
    c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(-30, 205, 260, 50, 0, 0, TAU); c.fill();
    c.strokeStyle = '#2d4f86'; c.lineWidth = 34;
    c.beginPath(); c.moveTo(60, 182); c.lineTo(250, 160); c.moveTo(60, 196); c.lineTo(250, 214); c.stroke();
    c.fillStyle = '#f2b23c'; rrect(c, -210, 160, 280, 64, 30); c.fill();
    c.strokeStyle = '#e9b98f'; c.lineWidth = 20; c.beginPath(); c.moveTo(-150, 166); c.lineTo(-110, 120); c.moveTo(-60, 168); c.lineTo(-20, 124); c.stroke();
    c.fillStyle = '#e9b98f'; c.beginPath(); c.arc(-246, 192, 30, 0, TAU); c.fill();
    c.fillStyle = '#4a2f22'; c.beginPath(); c.arc(-256, 192, 28, PI * 0.55, PI * 1.45); c.fill();
    // magazine: shadow, then the portal
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(-186, -100, 392, 224);
    c.restore();
  }
  // ---- scene 1: the magazine spread ----
  function izMag(c, t, px, st) {
    c.fillStyle = '#f3efe4'; c.fillRect(0, 0, 1920, 1080);
    c.save(); c.beginPath(); c.rect(70, 70, 1780, 720); c.clip();
    let g = c.createLinearGradient(0, 70, 0, 600);
    g.addColorStop(0, '#5f4f8a'); g.addColorStop(0.45, '#d9786b'); g.addColorStop(0.8, '#f6c58a'); g.addColorStop(1, '#fbe2b0');
    c.fillStyle = g; c.fillRect(70, 70, 1780, 560);
    c.fillStyle = 'rgba(255,240,200,0.9)'; c.beginPath(); c.arc(540, 470, 64, 0, TAU); c.fill();
    st.ridges.forEach((rd, k) => {
      c.fillStyle = ['#8c5f86', '#6b4a72', '#4a3858'][k]; c.beginPath(); c.moveTo(70, 620);
      rd.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(1850, 620); c.closePath(); c.fill();
    });
    g = c.createLinearGradient(0, 590, 0, 790); g.addColorStop(0, '#e8a07a'); g.addColorStop(0.35, '#7c5a7c'); g.addColorStop(1, '#2d2a48');
    c.fillStyle = g; c.fillRect(70, 590, 1780, 200);
    c.fillStyle = 'rgba(255,225,170,0.55)';
    for (let k = 0; k < 9; k++) { const w = 120 - k * 10 + izLoop(t, 5, k) * 14; c.fillRect(540 - w / 2, 600 + k * 16, w, 3); }
    // shoreline pines
    c.fillStyle = '#2a2238'; c.beginPath();
    for (let x = 70; x < 1850; x += 34) { const h = 30 + hash(x * 0.37) * 50; c.moveTo(x - 16, 596); c.lineTo(x, 596 - h); c.lineTo(x + 16, 596); }
    c.fill();
    // the cabin, with its lit picture window as the portal
    c.fillStyle = '#7d4b30'; c.fillRect(990, 372, 500, 430);
    c.strokeStyle = 'rgba(40,20,10,0.45)'; c.lineWidth = 4;
    for (let y = 392; y < 790; y += 26) { c.beginPath(); c.moveTo(990, y); c.lineTo(1490, y); c.stroke(); }
    c.fillStyle = '#4a261b'; c.beginPath(); c.moveTo(944, 384); c.lineTo(1240, 200); c.lineTo(1536, 384); c.closePath(); c.fill();
    c.fillStyle = '#3a1c14'; c.fillRect(1380, 230, 46, 90);
    c.save(); izChild(c, 1);
    c.shadowColor = 'rgba(255,190,110,0.85)'; c.shadowBlur = 40;
    c.fillStyle = '#2c160f'; c.fillRect(-70, -70, 2060, 1220);
    c.restore();
    c.restore();
    // page furniture
    if (px > 420) {
      text(c, 'Lake Days', 110, 900, { font: 'Jost, sans-serif', weight: 700, size: 82, color: '#1d1b20' });
      text(c, 'Five cabins worth the long drive', 112, 950, { font: 'Jost, sans-serif', style: 'italic', size: 32, color: '#6a5a50' });
      c.fillStyle = 'rgba(40,36,34,0.28)';
      for (let k = 0; k < 4; k++) c.fillRect(112, 984 + k * 16, k === 3 ? 300 : 760, 6);
      for (let col = 0; col < 2; col++) for (let k = 0; k < 12; k++) c.fillRect(1010 + col * 430, 826 + k * 17, k === 11 ? 180 : 390, 6);
      text(c, 'SUMMER ISSUE · 42', 110, 1060, { font: 'Jost, sans-serif', weight: 500, size: 18, color: '#8a7a70', ls: 3 });
      text(c, '43', 1810, 1060, { font: 'Jost, sans-serif', weight: 500, size: 18, color: '#8a7a70', align: 'right' });
    }
    const gg = c.createLinearGradient(900, 0, 1020, 0);
    gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(0.5, 'rgba(0,0,0,0.22)'); gg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gg; c.fillRect(900, 0, 120, 1080);
  }
  // ---- scene 2: the room inside the cabin ----
  function izRoom(c, t, px, st) {
    let g = c.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, '#9c5f36'); g.addColorStop(1, '#c58a57');
    c.fillStyle = g; c.fillRect(0, 0, 1920, 900);
    st.planks.forEach((k, i) => { c.fillStyle = `rgba(${k > 0.5 ? '255,220,170' : '60,30,10'},${0.06 + Math.abs(k - 0.5) * 0.1})`; c.fillRect(i * 96, 0, 96, 900); c.fillStyle = 'rgba(50,25,10,0.35)'; c.fillRect(i * 96, 0, 3, 900); });
    c.fillStyle = '#5e3822'; c.fillRect(0, 900, 1920, 180);
    c.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 930; y < 1080; y += 40) c.fillRect(0, y, 1920, 3);
    c.fillStyle = '#3d2416'; c.fillRect(0, 890, 1920, 16);
    // lamp light pooled on the wall
    g = c.createRadialGradient(330, 330, 20, 330, 330, 700); g.addColorStop(0, 'rgba(255,220,150,0.5)'); g.addColorStop(1, 'rgba(255,220,150,0)');
    c.fillStyle = g; c.fillRect(0, 0, 1100, 1080);
    c.fillStyle = '#2b2420'; c.fillRect(322, 360, 14, 540); c.beginPath(); c.ellipse(329, 900, 70, 14, 0, 0, TAU); c.fill();
    c.fillStyle = '#f4e3c0'; c.beginPath(); c.moveTo(250, 240); c.lineTo(410, 240); c.lineTo(450, 362); c.lineTo(210, 362); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,240,200,0.9)'; c.beginPath(); c.ellipse(330, 362, 120, 14, 0, 0, TAU); c.fill();
    // sofa
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(960, 975, 470, 30, 0, 0, TAU); c.fill();
    c.fillStyle = '#c98f2e'; rrect(c, 560, 690, 800, 190, 40); c.fill();
    c.fillStyle = '#dda43c'; rrect(c, 530, 810, 860, 140, 36); c.fill();
    c.fillStyle = '#b77f24'; rrect(c, 500, 760, 110, 200, 40); c.fill(); rrect(c, 1310, 760, 110, 200, 40); c.fill();
    c.fillStyle = '#3f7d8c'; rrect(c, 640, 720, 200, 140, 30); c.fill(); c.fillStyle = '#d4553f'; rrect(c, 1080, 720, 200, 140, 30); c.fill();
    // shelf with books and a clock whose hands loop with the film
    c.fillStyle = '#4d2c19'; c.fillRect(1460, 300, 360, 22); c.fillRect(1460, 540, 360, 22);
    st.books.forEach(([x, w, h, col, row]) => { c.fillStyle = col; c.fillRect(x, (row ? 540 : 300) - h, w, h); });
    c.fillStyle = '#efe6d2'; c.beginPath(); c.arc(1640, 160, 64, 0, TAU); c.fill(); c.strokeStyle = '#4d2c19'; c.lineWidth = 8; c.stroke();
    c.strokeStyle = '#2b2420'; c.lineCap = 'round';
    const hm = TAU * (t / 10) - PI / 2, hh = TAU * (t / 10) / 12 * 2 - PI / 3;
    c.lineWidth = 5; c.beginPath(); c.moveTo(1640, 160); c.lineTo(1640 + Math.cos(hm) * 48, 160 + Math.sin(hm) * 48); c.stroke();
    c.lineWidth = 7; c.beginPath(); c.moveTo(1640, 160); c.lineTo(1640 + Math.cos(hh) * 30, 160 + Math.sin(hh) * 30); c.stroke();
    // plant
    c.fillStyle = '#b5552f'; c.beginPath(); c.moveTo(1560, 800); c.lineTo(1700, 800); c.lineTo(1680, 905); c.lineTo(1580, 905); c.closePath(); c.fill();
    c.fillStyle = '#4e8a45';
    for (let k = 0; k < 7; k++) { const a = -PI / 2 + (k - 3) * 0.38 + izLoop(t, 2, k) * 0.03; c.beginPath(); c.ellipse(1630 + Math.cos(a) * 90, 800 + Math.sin(a) * 90, 80, 24, a, 0, TAU); c.fill(); }
    // gilt frame around the painting portal
    c.save(); izChild(c, 2);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(-60, -40, 2160, 1300);
    c.fillStyle = '#b8892f'; c.fillRect(-120, -120, 2160, 1320);
    c.strokeStyle = '#e8c86a'; c.lineWidth = 18; c.strokeRect(-90, -90, 2100, 1260);
    c.strokeStyle = '#7a5a1c'; c.lineWidth = 12; c.strokeRect(-24, -24, 1968, 1128);
    c.restore();
  }
  // ---- scene 3: the painting — a city at dusk ----
  function izCity(c, t, px, st) {
    let g = c.createLinearGradient(0, 0, 0, 900);
    g.addColorStop(0, '#0d1638'); g.addColorStop(0.5, '#2c3a78'); g.addColorStop(0.82, '#b4607a'); g.addColorStop(1, '#f0a070');
    c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
    // painterly dabs over the sky
    st.dabs.forEach(([x, y, L, a, col]) => { c.strokeStyle = col; c.lineWidth = 14; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke(); });
    st.stars.forEach(([x, y, r, ph, n]) => { c.globalAlpha = 0.55 + 0.45 * izLoop(t, n, ph); c.fillStyle = '#fff6d8'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); });
    c.globalAlpha = 1;
    c.fillStyle = '#fbeab8'; c.beginPath(); c.arc(1650, 170, 62, 0, TAU); c.fill();
    c.fillStyle = '#18234f'; c.beginPath(); c.arc(1676, 152, 56, 0, TAU); c.fill();
    st.city.forEach(([x, w, h, col, layer]) => {
      c.fillStyle = col; c.fillRect(x, 1080 - h, w, h);
      if (layer && px > 300) {
        for (let wy = 1080 - h + 24; wy < 1060; wy += 36) for (let wx = x + 14; wx < x + w - 14; wx += 28) {
          const on = hash(wx * 0.13 + wy * 0.71) > 0.45, bl = on && hash(wx + wy) > 0.93 ? 0.5 + 0.5 * izLoop(t, 3, wx) : 1;
          if (on) { c.fillStyle = `rgba(255,214,120,${0.85 * bl})`; c.fillRect(wx, wy, 12, 16); }
        }
      }
    });
    // the billboard tower; its screen is the portal
    c.fillStyle = '#141a38'; c.fillRect(870, 520, 260, 560);
    if (px > 300) for (let wy = 548; wy < 1060; wy += 34) for (let wx = 890; wx < 1110; wx += 30) if (hash(wx * 0.3 + wy) > 0.4) { c.fillStyle = 'rgba(255,214,120,0.85)'; c.fillRect(wx, wy, 12, 16); }
    c.fillStyle = '#0b0e1f'; c.fillRect(920, 480, 16, 50); c.fillRect(1064, 480, 16, 50);
    c.save(); izChild(c, 3);
    c.shadowColor = 'rgba(120,200,255,0.7)'; c.shadowBlur = 50;
    c.fillStyle = '#0b0e1f'; c.fillRect(-80, -80, 2080, 1240);
    c.shadowBlur = 0; c.fillStyle = '#ffd36b';
    for (let k = 0; k < 9; k++) { c.beginPath(); c.arc(80 + k * 220, 1130, 22, 0, TAU); c.fill(); }
    c.restore();
    // headlights streaming along the street
    for (let k = 0; k < 8; k++) { const u = ((t / 10) * (k % 2 ? 2 : 3) + k / 8) % 1, x = k % 2 ? 1920 - u * 2100 : u * 2100 - 180; c.fillStyle = k % 2 ? 'rgba(255,90,80,0.8)' : 'rgba(255,240,200,0.9)'; c.fillRect(x, 1052 + (k % 2) * 12, 90, 5); }
  }
  // ---- scene 4: a desktop on the billboard ----
  function izDesk(c, t, px, st) {
    const g = c.createRadialGradient(960, 540, 100, 960, 540, 1200); g.addColorStop(0, '#3a9aa0'); g.addColorStop(1, '#1d5f68');
    c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
    c.fillStyle = '#f4f1ea'; c.fillRect(0, 0, 1920, 48); c.fillStyle = '#1c1c1c'; c.fillRect(0, 48, 1920, 3);
    if (px > 300) {
      ['File', 'Edit', 'View', 'Special'].forEach((s, i) => text(c, s, 90 + i * 120, 33, { font: 'Jost, sans-serif', weight: 500, size: 24, color: '#1c1c1c' }));
      text(c, '10:08', 1880, 33, { font: '"DM Mono", monospace', size: 22, color: '#1c1c1c', align: 'right' });
    }
    c.fillStyle = '#1c1c1c'; c.beginPath(); c.arc(44, 24, 12, 0, TAU); c.fill();
    // icons
    [['Photos', 150], ['Notes', 320], ['Trash', 490]].forEach(([s, y]) => {
      c.fillStyle = s === 'Trash' ? '#d9d9d2' : '#f2c14e'; rrect(c, 1752, y, 96, 76, 8); c.fill(); c.fillRect(1752, y - 10, 40, 16);
      if (px > 300) { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(1740, y + 88, 120, 30); text(c, s, 1800, y + 111, { font: 'Jost, sans-serif', weight: 500, size: 22, color: '#fff', align: 'center' }); }
    });
    // a notes window behind
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(1182, 602, 560, 400);
    c.fillStyle = '#fdfbf4'; c.fillRect(1170, 590, 560, 400); c.fillStyle = '#e4e0d5'; c.fillRect(1170, 590, 560, 40);
    if (px > 300) {
      text(c, 'notes.txt', 1450, 618, { font: '"DM Mono", monospace', size: 20, color: '#333', align: 'center' });
      ['look closer', 'and closer', 'every picture', 'holds the next'].forEach((s, i) => text(c, s, 1200, 680 + i * 44, { font: '"DM Mono", monospace', size: 26, color: '#333' }));
    }
    // photo viewer: chrome around the portal
    c.save(); izChild(c, 4);
    c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(30, -100, 2000, 1280);
    c.fillStyle = '#ece9e1'; c.fillRect(-40, -170, 2000, 1290);
    c.fillStyle = '#c8c4b8'; for (let k = 0; k < 6; k++) c.fillRect(-10, -150 + k * 18, 1940, 6);
    c.fillStyle = '#ece9e1'; c.fillRect(760, -160, 400, 110);
    c.strokeStyle = '#1c1c1c'; c.lineWidth = 6; c.strokeRect(30, -142, 70, 70);
    text(c, 'picnic.jpg', 960, -82, { font: '"DM Mono", monospace', size: 60, color: '#1c1c1c', align: 'center' });
    c.restore();
    // cursor wanders on a loop
    const cx = 1420 + izLoop(t, 1) * 260, cy = 300 + izLoop(t, 2, 1) * 140;
    c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy + 46); c.lineTo(cx + 12, cy + 35); c.lineTo(cx + 22, cy + 56); c.lineTo(cx + 30, cy + 52); c.lineTo(cx + 20, cy + 32); c.lineTo(cx + 36, cy + 32); c.closePath(); c.fill(); c.stroke();
  }
  const IZ_SC = [izPark, izMag, izRoom, izCity, izDesk];
  function izScene(c, t, k, depth, px, st) {
    IZ_SC[k % IZ_NS](c, t, px, st);
    if (depth < 3 && px / IZ_K > 10) {
      c.save(); izChild(c, k % IZ_NS); c.beginPath(); c.rect(0, 0, 1920, 1080); c.clip();
      izScene(c, t, k + 1, depth + 1, px / IZ_K, st);
      c.restore();
    }
  }

  MG.film({
    id: 'infinitezoom', dur: 10, poster: 9.4,
    fonts: [['500 120px Jost', 'Infinite Zoom'], ['italic 400 40px Jost', 'A picnic, seen from above magazine blanket cabin window painting wall screen city'], ['500 22px Jost', 'File Edit View Special Lake Days Photos Notes Trash'], ['400 22px "DM Mono"', 'LEVEL ×0123456789.^ / ∞ picnic.jpg notes.txt'], ['700 82px Jost', 'Lake Days']],
    meta: {
      family: 'E', name: 'Infinite Zoom', sub: 'Every picture holds the next', era: '1968 —',
      origin: 'The infinite zoom is a single unbroken push into an image in which every scene turns out to contain the next, so the camera can travel forever at a constant exponential rate. Charles and Ray Eames fixed its grammar in Powers of Ten (1977, after a 1968 sketch), pulling away from a Chicago picnic by a factor of ten every ten seconds; the Droste effect and Escher\'s Print Gallery (1956) supplied the recursion, fractal explorers the endless dive, and the online Zoom Quilt (2004) made it a collaborative loop of hand-painted scenes.',
      works: 'Charles and Ray Eames — Powers of Ten (1977) · M. C. Escher — Print Gallery (1956) · Istvan Banyai — Zoom (picture book, 1995) · Nikolaus Hafermaas et al. — The Zoom Quilt (2004)',
      tech: ['Nested scene recursion', 'Exponential camera scale', 'Fixed-point portal maps'],
      accent: '#ffcf3a',
      motionDNA: 'One continuous push at constant log speed: the field shrinks by a factor of five every two seconds about each portal\'s fixed point, with a slight roll as each tilted portal straightens, and after five scenes the picture is back where it began — the film loops without a cut.',
      visualDNA: 'Warm, legible illustration in five idioms — aerial park map, glossy magazine photo, lamplit cabin interior, painterly night city, retro desktop UI — linked by the Powers-of-Ten target square and a white HUD of level and magnification.',
      transitions: 'None: each portal grows to fill the frame and becomes the next scene; the last scene\'s photo is the first scene',
      implementation: ['After Effects nested comps / Photoshop zoom layers', 'Stable Diffusion outpainting zooms', 'Shaders (log-polar Droste)', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: true,
    },
    setup() {
      const st = {}, r = rng(1977);
      // park trees, kept off the blanket and the pond
      st.trees = [];
      for (let k = 0; k < 400 && st.trees.length < 34; k++) {
        const x = r() * 2000 - 40, y = r() * 1160 - 40, rr = 46 + r() * 50;
        if (Math.hypot((x - 1010) / 560, (y - 590) / 420) < 1) continue;
        if (Math.hypot((x - 1580) / 360, (y - 860) / 260) < 1) continue;
        if (st.trees.some(([a, b, c]) => Math.hypot(a - x, b - y) < (c + rr) * 0.8)) continue;
        st.trees.push([x, y, rr, r() < 0.4]);
      }
      // magazine mountain ridges
      st.ridges = [0, 1, 2].map(k => { const out = []; for (let x = 70; x <= 1850; x += 20) out.push([x, 360 + k * 70 + vnoise(x / (260 - k * 60), 21 + k) * (110 - k * 20) + vnoise(x / 60, 31 + k) * 14]); return out; });
      st.planks = Array.from({ length: 21 }, () => r());
      st.books = [];
      [0, 1].forEach(row => { let x = 1475; while (x < 1790) { const w = 18 + r() * 22, h = 90 + r() * 70; if (r() > 0.85) { x += 30; continue; } st.books.push([x, w, h, ['#c94f3d', '#3f6f8a', '#e0b04a', '#5b8a4e', '#efe6d2', '#7a4a7a'][(r() * 6) | 0], row]); x += w + 3; } });
      st.stars = Array.from({ length: 70 }, () => [r() * 1920, r() * 520, 1.5 + r() * 2.5, r() * TAU, 1 + ((r() * 4) | 0)]);
      st.dabs = Array.from({ length: 160 }, () => { const y = r() * 760; return [r() * 1920, y, 30 + r() * 60, -0.3 + r() * 0.6, `rgba(${y > 560 ? '255,190,150' : '150,170,255'},${0.05 + r() * 0.06})`]; });
      st.city = [];
      // two rows: far silhouettes, near lit blocks (kept below the billboard)
      for (let layer = 0; layer < 2; layer++) {
        let x = -20;
        while (x < 1940) {
          const w = layer ? 90 + r() * 110 : 60 + r() * 90;
          let h = layer ? 240 + r() * 330 : 380 + r() * 260;
          if (x + w > 780 && x < 1220) h = Math.min(h, layer ? 300 : 520);
          st.city.push([x, w, h, layer ? ['#1b2148', '#232a58', '#1e1f40'][(r() * 3) | 0] : '#3a3a72', layer]);
          x += w + (layer ? 6 : -10);
        }
      }
      return st;
    },
    draw(c, t, W, H, st) {
      const z = (t * IZ_RATE) % IZ_NS, k = Math.floor(z), f = z - k;
      const [Px, Py] = IZ_P[k], rr = IZ_C[k][2], s = Math.pow(IZ_K, f);
      c.save();
      c.translate(Px, Py); c.rotate(-rr * f); c.scale(s, s); c.translate(-Px, -Py);
      izScene(c, t, k, 0, 1920 * s, st);
      c.restore();
      // scene k coordinates → screen
      const cs = Math.cos(-rr * f) * s, sn = Math.sin(-rr * f) * s;
      const toScr = (x, y) => [Px + cs * (x - Px) - sn * (y - Py), Py + sn * (x - Px) + cs * (y - Py)];
      // ---- Powers of Ten target square on the next portal (and the one after, as it comes into view) ----
      const square = (pts, a, lab) => {
        if (a <= 0.01) return;
        c.save(); c.globalAlpha = a; c.strokeStyle = IZ.hud; c.lineWidth = 2;
        c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 6;
        c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.stroke();
        c.lineWidth = 5;
        pts.forEach((p, i) => {
          const q0 = pts[(i + 3) % 4], q1 = pts[(i + 1) % 4], L0 = Math.hypot(q0[0] - p[0], q0[1] - p[1]) || 1, L1 = Math.hypot(q1[0] - p[0], q1[1] - p[1]) || 1, m = Math.min(30, L0 * 0.2);
          c.beginPath(); c.moveTo(p[0] + (q0[0] - p[0]) / L0 * m, p[1] + (q0[1] - p[1]) / L0 * m); c.lineTo(p[0], p[1]); c.lineTo(p[0] + (q1[0] - p[0]) / L1 * m, p[1] + (q1[1] - p[1]) / L1 * m); c.stroke();
        });
        c.shadowBlur = 0;
        text(c, lab, pts[1][0] + 10, pts[1][1] - 10, { font: '"DM Mono", monospace', weight: 500, size: 22, color: IZ.acc });
        c.restore();
      };
      const corners = [[0, 0], [1920, 0], [1920, 1080], [0, 1080]];
      square(corners.map(([x, y]) => toScr(...izMap(k, x, y))), 1 - E.inQ(seg(f, 0.45, 0.82)), '×5');
      const k1 = (k + 1) % IZ_NS;
      square(corners.map(([x, y]) => toScr(...izMap(k, ...izMap(k1, x, y)))), E.outQ(seg(f, 0.55, 0.95)), '×5');
      // ---- HUD ----
      const sg = c.createLinearGradient(0, 0, 0, 1080);
      sg.addColorStop(0, 'rgba(0,0,0,0.6)'); sg.addColorStop(0.16, 'rgba(0,0,0,0)'); sg.addColorStop(0.72, 'rgba(0,0,0,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.55)');
      c.fillStyle = sg; c.fillRect(0, 0, W, H);
      const mono = '"DM Mono", monospace', zz = t * IZ_RATE, mag = Math.pow(IZ_K, zz);
      c.save(); c.shadowColor = 'rgba(0,0,0,0.75)'; c.shadowBlur = 10; c.shadowOffsetY = 1;
      text(c, `LEVEL ${String(k + 1).padStart(2, '0')} / 05 · LOOPS ∞`, 64, 70, { font: mono, weight: 500, size: 22, color: IZ.hud, ls: 2 });
      text(c, `×${mag < 100 ? mag.toFixed(2) : Math.round(mag).toLocaleString('en-US')}`, 1856, 74, { font: mono, weight: 500, size: 30, color: IZ.acc, align: 'right' });
      text(c, `= 5^${zz.toFixed(2)}`, 1856, 104, { font: mono, size: 20, color: IZ.dim, align: 'right' });
      // a log-scale depth ruler on the right: one tick per level
      c.fillStyle = IZ.dim;
      for (let q = 0; q <= 5; q++) { const y = 980 - q * 64; c.fillRect(1836, y, q % 5 ? 14 : 20, 2); }
      c.fillRect(1849, 660, 2, 322);
      c.fillStyle = IZ.acc; c.beginPath(); const yy = 981 - zz * 64; c.moveTo(1830, yy); c.lineTo(1814, yy - 9); c.lineTo(1814, yy + 9); c.closePath(); c.fill();
      // captions and the title (title spans the loop point: in at the end, still up at the start)
      const ta = Math.max(E.outC(seg(t, 8.4, 9.1)), 1 - E.inQ(seg(t, 0.9, 1.5)));
      const ca = (1 - ta) * E.outC(seg(f, 0.04, 0.22)) * (1 - E.inQ(seg(f, 0.8, 0.97)));
      if (ca > 0) {
        c.save(); c.globalAlpha = ca;
        text(c, IZ_CAP[k], 64, 1000, { font: 'Jost, sans-serif', style: 'italic', size: 44, color: IZ.hud });
        text(c, `SCENE ${k + 1} — INSIDE SCENE ${k ? k : 5}`, 66, 1040, { font: mono, size: 18, color: IZ.dim, ls: 2 });
        c.restore();
      }
      if (ta > 0) {
        c.save(); c.globalAlpha = ta;
        text(c, 'Infinite Zoom', 60, 990, { font: 'Jost, sans-serif', weight: 500, size: 120, color: IZ.hud, ls: -2 });
        text(c, 'EVERY PICTURE HOLDS THE NEXT · AFTER POWERS OF TEN (1977)', 66, 1040, { font: mono, weight: 500, size: 20, color: IZ.acc, ls: 2 });
        c.restore();
      }
      c.restore();
      vignette(c, W, H, 0.3);
      grain(c, W, H, t, 0.03, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 1.3;
      // Shepard–Risset glissando: five voices an octave apart rise forever, one octave per scene (2 s),
      // each fading in at the bottom and out at the top, so the pitch climbs without ever arriving
      const L = 10, F0 = 55, oct = 5;
      const fq = ph => F0 * Math.pow(2, oct * ph), amp = ph => Math.pow(Math.sin(PI * ph), 2);
      const voice = (t0, ph0, ph1) => {
        const dur = (ph1 - ph0) * L, pk = 0.055;
        if (dur <= 0.05) return;
        if (ph0 < 0.5) A.osc(t0, { type: 'triangle', f: fq(ph0), f2: fq(ph1), glide: dur, dur, a: Math.min(dur - 0.05, (0.5 - ph0) * L), g: pk, lp: 2400, rev: 0.35 });
        else A.osc(t0, { type: 'triangle', f: fq(ph0), f2: fq(ph1), glide: dur, dur, a: 0.4, g: Math.max(0.004, pk * amp(ph0)), lp: 2400, rev: 0.35 });
      };
      for (let j = 0; j < 5; j++) {
        const ph0 = j / 5;
        voice(0, ph0, 1);
        if (j > 0) voice(L - j * 2, 0, ph0);
      }
      // a soft chime each time a portal fills the frame
      [2, 4, 6, 8].forEach((tt, i) => { A.bell(tt, midi(81 + [0, 2, 4, 7][i]), { g: 0.04, dur: 1.6, pan: i % 2 ? 0.3 : -0.3, rev: 0.6 }); A.whoosh(tt - 0.5, 0.7, { f1: 600, f2: 3000, g: 0.05, rev: 0.3 }); });
      // scene foley: birds over the park, a page, the cabin clock, the city, the desktop
      for (let k = 0; k < 6; k++) A.osc(0.2 + k * 0.27 + hash(k) * 0.1, { type: 'sine', f: 3200 + hash(k * 3) * 900, f2: 4300 + hash(k * 5) * 900, glide: 0.07, dur: 0.09, g: 0.02, pan: hash(k * 7) - 0.5, rev: 0.4 });
      A.noise(2.05, { type: 'bandpass', f: 2500, f2: 5500, q: 0.8, dur: 0.35, g: 0.05, swell: 0.4 });
      for (let k = 0; k < 4; k++) A.noise(4.1 + k * 0.5, { type: 'bandpass', f: 3200, q: 6, dur: 0.03, g: 0.05 });
      A.osc(6.2, { type: 'sine', f: 740, f2: 880, glide: 0.8, dur: 1.4, g: 0.012, vib: [5, 8], rev: 0.6, pan: 0.4 });
      [8.1, 8.24].forEach(tt => A.noise(tt, { type: 'bandpass', f: 1800, q: 4, dur: 0.02, g: 0.06 }));
      A.chord(8.45, [57, 64, 69, 71, 76], { type: 'sine', dur: 1.55, g: 0.03, a: 0.4, width: 0.8, rev: 0.7 });
    },
  });

  /* =====================================================================
     PAPER CRAFT — a pop-up book shot in stop motion on a tabletop. The
     closed cloth-bound book lies on the table; its cover lifts and, as
     the spread opens to a right angle, six parallel-fold layers of cut
     card rise with it — hills, a town, trees with a windmill, a meadow, a
     grass fringe — each casting a soft shadow on the layer behind. A pull
     tab slides out and the sun climbs from behind the hills; the windmill
     turns, a hot-air balloon slides up on its strip, and an accordion
     banner unfolds across the front to spell the title. Everything moves
     on twelve exposures a second, with a slight hand-placed jitter
     ===================================================================== */
  const PC = {
    wallT: '#f6dccd', wallB: '#e9c3a7', board: '#2c6e7f', boardE: '#1d4a56', page: '#f7efe0', skyB: '#d6eef2', skyT: '#9ccfe2',
    floor: '#f4ead4', river: '#8cc9e2', hill: '#a6d8b8', base: '#7cc29a', tree: ['#3f8f6b', '#2f7a5e', '#58a377'], trunk: '#8a5a3a',
    meadow: '#cfe38a', fringe: '#76c27a', cloud: '#fdfbf6', sun: '#f7b733', coral: '#e8665a', cream: '#fbf3e4', ink: '#5a3a30',
  };
  const PC_T = { open: [0.9, 2.75], sun: [3.1, 5.0], mill: 3.3, balloon: [5.3, 6.3], banner: [6.85, 8.25], title: 8.35 };
  const PC_FPS = 12;
  const PC_EYE = [0, 860, 1820], PC_TGT = [0, 250, 230], PC_F = 1400, PC_CX = 960, PC_CY = 478;
  const PC_PIT = Math.atan2(PC_EYE[1] - PC_TGT[1], PC_EYE[2] - PC_TGT[2]), PC_PC = Math.cos(PC_PIT), PC_PS = Math.sin(PC_PIT);
  // world (x right, y up, z toward the viewer; gutter at z = 0) → screen
  function pcP(x, y, z) {
    const dy = y - PC_EYE[1], dz = z - PC_EYE[2], depth = -dy * PC_PS - dz * PC_PC, cy = dy * PC_PC - dz * PC_PS, k = PC_F / depth;
    return [PC_CX + x * k, PC_CY - cy * k];
  }
  // a parallel-fold plane: base on the floor at depth d, tilted up by angle b (rad); point (u, v) in its own coordinates
  const pcPl = (d, b, du = 0, dv = 0) => ({ d, s: Math.sin(b), c: Math.cos(b), du, dv, b });
  const pcQ = (pl, u, v) => pcP(u + pl.du, (v + pl.dv) * pl.s, pl.d + (v + pl.dv) * pl.c);
  function pcPath(c, pl, polys) {
    c.beginPath();
    polys.forEach(pts => { pts.forEach(([u, v], i) => { const q = pcQ(pl, u, v); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath(); });
  }
  // the front face of a plane is visible once it has turned toward the camera
  const pcFront = pl => -pl.c * PC_EYE[1] + pl.s * (PC_EYE[2] - pl.d) > 0;
  // light on a plane: brighter as it faces the key light (upper front left)
  const pcLit = pl => 0.84 + 0.16 * clamp(pl.s * 0.66 + pl.c * -0.75 + 0.75);
  const pcCirc = (cx, cy, r, n = 22, sx = 1) => Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * TAU) * r * sx, cy + Math.sin((i / n) * TAU) * r]);
  // a cut-card piece: soft drop shadow on what is behind, flat colour, a fine darker cut edge
  function pcCard(c, pl, polys, col, sh = 1, edge = true) {
    pcPath(c, pl, polys);
    const k = pcLit(pl);
    c.save();
    if (sh > 0) { c.shadowColor = `rgba(70,35,30,${0.3 * sh})`; c.shadowBlur = 20; c.shadowOffsetX = 11; c.shadowOffsetY = 8; }
    c.fillStyle = shade(col, k); c.fill();
    c.restore();
    if (edge) { c.strokeStyle = shade(col, k * 0.8); c.lineWidth = 1.6; c.stroke(); }
  }
  // the scored fold tab where a layer meets the floor
  function pcTab(c, u0, u1, d) {
    const a = pcP(u0, 0.5, d), b = pcP(u1, 0.5, d), e = pcP(u1, 0.5, d + 22), f = pcP(u0, 0.5, d + 22);
    c.fillStyle = 'rgba(120,80,60,0.12)'; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(e[0], e[1]); c.lineTo(f[0], f[1]); c.closePath(); c.fill();
    c.save(); c.setLineDash([7, 6]); c.strokeStyle = 'rgba(90,58,48,0.45)'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.restore();
  }
  // an affine stand-in for a small plane patch (for text): local x right from u0, y down from v1
  function pcTx(c, pl, u0, v0, u1, v1) {
    const TL = pcQ(pl, u0, v1), TR = pcQ(pl, u1, v1), BL = pcQ(pl, u0, v0);
    c.transform((TR[0] - TL[0]) / (u1 - u0), (TR[1] - TL[1]) / (u1 - u0), (BL[0] - TL[0]) / (v1 - v0), (BL[1] - TL[1]) / (v1 - v0), TL[0], TL[1]);
  }

  MG.film({
    id: 'papercraft', dur: 10, poster: 9.4,
    fonts: [['800 96px Fraunces', 'PAPER CRAFT'], ['italic 600 90px Fraunces', 'Paper Town'], ['500 26px Jost', 'A POP-UP BOOK FOLD SCORE CUT PULL ·']],
    meta: {
      family: 'F', name: 'Paper Craft', sub: 'Pop-up books and layered cut paper', era: '1760s —',
      origin: 'Paper craft turns flat card into depth: layers cut with a blade are stacked a few millimetres apart so each casts a soft shadow on the next, and scored creases let a spread fold flat and spring up again. Movable books go back to Lothar Meggendorfer\'s pull-tab books of the 1880s and earlier flap books; paper engineers such as Robert Sabuda and Matthew Reinhart made the pop-up a showpiece, and the layered-diorama look became a staple of 2010s advertising and motion design, often shot frame by frame.',
      works: 'Lothar Meggendorfer — movable books (1880s–1900s) · Robert Sabuda — The Wonderful Wizard of Oz: A Commemorative Pop-up (2000) · Robert Sabuda & Matthew Reinhart — Encyclopedia Prehistorica: Dinosaurs (2005) · Masahiro Chatani — origamic architecture (1980s)',
      tech: ['Parallel-fold pop-up', 'Layered drop shadows', 'Stop-motion 12 fps step'],
      accent: '#e8665a',
      motionDNA: 'Mechanical, not animated: every movement is something paper can do — a cover lifts, layers rise together on parallel folds, a pull tab drives the sun along a slot, a strip slides a balloon up, an accordion unfolds — all stepped at twelve exposures a second with a little hand-placed jitter and a springy settle.',
      visualDNA: 'Matte pastel card on a warm tabletop: mint hills, sugared-almond houses, deep green trees, a coral banner; crisp cut edges, dashed score lines, soft shadows between layers and visible paper fibre.',
      transitions: 'Closed cover → book opens and the scene pops up → mechanisms play in turn → banner unfolds with the title',
      implementation: ['Hand-cut card, glue and a stop-motion camera', 'Cinema 4D / Blender paper rigs', 'After Effects 3D layers', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const st = {}, r = rng(1880);
      st.paper = paperTile('#f2ece2', 51, 512, '110,80,60', '255,255,250', 1.2);
      const wave = (u0, u1, f, step = 20) => { const out = [[u0, 0]]; for (let u = u0; u <= u1; u += step) out.push([u, f(u)]); out.push([u1, f(u1)], [u1, 0]); return out; };
      st.hills = [wave(-690, 690, u => 240 + 70 * Math.sin(u * 0.0052 + 0.8) + 38 * Math.sin(u * 0.013 + 2))];
      st.townBase = [wave(-680, 680, u => 70 + 16 * Math.sin(u * 0.011 + 1))];
      st.houses = [];
      const hc = ['#f7c59f', '#f4a7a0', '#fbe3b0', '#9ccfd8', '#f6f1e6', '#cbb8e6'], rc = ['#e0655a', '#5a7fb5', '#7a5a8c', '#e8a23a', '#c2584d'];
      let u = -640;
      while (u < 600) {
        const w = 70 + r() * 56, wh = 100 + r() * 80, rh = 40 + r() * 36, x0 = u, x1 = u + w, xm = (x0 + x1) / 2;
        const church = u > -60 && u < 60 && !st.houses.some(h => h.church);
        const top = church ? wh + 150 : wh + rh;
        const wins = [];
        for (let wy = 70; wy < wh - 26; wy += 44) for (let wx = x0 + 16; wx < x1 - 26; wx += 30) wins.push([wx, wy, 16, 22]);
        st.houses.push({ body: [[x0, 30], [x1, 30], [x1, wh], [x0, wh]], roof: church ? [[x0 + 8, wh], [xm, top], [x1 - 8, wh]] : [[x0 - 10, wh], [xm, wh + rh], [x1 + 10, wh]], col: hc[(r() * hc.length) | 0], rcol: rc[(r() * rc.length) | 0], wins, door: [xm - 12, 30, 24, 40], church });
        u += w - 6 + r() * 14;
      }
      st.trees = [];
      u = -660;
      while (u < 660) {
        if (u > -500 && u < -360) { u = -360; continue; }
        const pine = r() < 0.5, h = 130 + r() * 100, w = 50 + r() * 30;
        st.trees.push(pine
          ? { polys: [[[u - w, 40 + h * 0.15], [u, h + 40], [u + w, 40 + h * 0.15]], [[u - w * 0.8, 40 + h * 0.45], [u, h + 60], [u + w * 0.8, 40 + h * 0.45]]], col: PC.tree[(r() * 3) | 0], trunk: [[u - 8, 0], [u + 8, 0], [u + 8, 50], [u - 8, 50]] }
          : { polys: [pcCirc(u, h - w * 0.4 + 30, w * 0.95)], col: PC.tree[(r() * 3) | 0], trunk: [[u - 9, 0], [u + 9, 0], [u + 9, h - w], [u - 9, h - w]] });
        u += w * 1.2 + r() * 30;
      }
      st.treeBase = [wave(-680, 680, u => 34 + 8 * Math.sin(u * 0.02))];
      st.meadow = [wave(-690, 690, u => 112 + 34 * Math.sin(u * 0.006 - 1) + 15 * Math.sin(u * 0.019))];
      st.flowers = Array.from({ length: 46 }, () => { const fu = -660 + r() * 1320, top = 112 + 34 * Math.sin(fu * 0.006 - 1) + 15 * Math.sin(fu * 0.019); return [fu, 20 + r() * (top - 40), 7 + r() * 4, ['#f6a5b8', '#fdfbf6', '#ffd166'][(r() * 3) | 0]]; });
      st.fringe = [(() => { const out = [[-700, 0]]; for (let fu = -700; fu <= 700; fu += 22) out.push([fu, 20 + 8 * r()], [fu + 11, 55 + r() * 32]); out.push([700, 20], [700, 0]); return out; })()];
      st.clouds = [[-470, 520, 1.0, 44], [140, 572, 0.8, 52], [470, 470, 0.9, 60]].map(([cu, cv, s, d]) => ({ cu, cv, d, polys: [pcCirc(0, 0, 46 * s), pcCirc(-50 * s, -14 * s, 34 * s), pcCirc(52 * s, -12 * s, 38 * s), pcCirc(20 * s, 22 * s, 36 * s), [[-84 * s, -40 * s], [90 * s, -40 * s], [90 * s, -18 * s], [-84 * s, -18 * s]]] }));
      st.river = (() => { const L = [], R = []; for (let z = 600; z >= 330; z -= 15) { const cu = 150 + 90 * Math.sin(z * 0.013), w = 40 + (z - 330) * 0.12; L.push([cu - w, z]); R.unshift([cu + w, z]); } return L.concat(R); })();
      return st;
    },
    draw(c, t, W, H, st) {
      const fr = Math.floor(t * PC_FPS), tq = fr / PC_FPS;
      const jit = (k, a = 1) => (hash(fr * 13.1 + k * 7.7) - 0.5) * 2 * a;   // hand-placed boil, new each exposure
      const openDeg = x => kf(x, [[PC_T.open[0], 0], [PC_T.open[1], 94, E.ioS], [PC_T.open[1] + 0.35, 88.5, E.ioS], [PC_T.open[1] + 0.65, 90, E.ioS]]);
      const al = openDeg(tq) * PI / 180;
      const moving = t > PC_T.open[0] && t < PC_T.open[1] + 0.7 ? 1 : 0.4;
      // ---- tabletop ----
      let g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, PC.wallT); g.addColorStop(0.55, '#f0d0bb'); g.addColorStop(1, PC.wallB);
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.save(); c.translate(jit(90, 0.8), jit(91, 0.8));
      // book shadow and bottom board
      const bb = [pcP(-725, -16, -12), pcP(725, -16, -12), pcP(725, -16, 640), pcP(-725, -16, 640)];
      c.save(); c.shadowColor = 'rgba(90,50,40,0.45)'; c.shadowBlur = 50; c.shadowOffsetX = 18; c.shadowOffsetY = 26;
      c.fillStyle = PC.boardE; c.beginPath(); bb.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); c.restore();
      const fe = [pcP(-725, -16, 640), pcP(725, -16, 640), pcP(725, 0, 640), pcP(-725, 0, 640)];
      c.fillStyle = PC.board; c.beginPath(); fe.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill();
      const pe = [pcP(-705, -10, 626), pcP(705, -10, 626), pcP(705, 0, 626), pcP(-705, 0, 626)];
      c.fillStyle = '#efe4cf'; c.beginPath(); pe.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill();
      // floor page with a printed river
      const fl = pcPl(0, 0); fl.s = 0; fl.c = 1;
      const fp = [[-705, 0], [705, 0], [705, 625], [-705, 625]].map(([x, zz]) => pcP(x, 0, zz));
      c.fillStyle = PC.floor; c.beginPath(); fp.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill();
      c.fillStyle = PC.river; c.beginPath(); st.river.forEach(([x, zz], i) => { const p = pcP(x, 0.3, zz); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }); c.closePath(); c.fill();
      c.save(); c.setLineDash([9, 7]); c.strokeStyle = 'rgba(90,58,48,0.35)'; c.lineWidth = 1.5; const g0 = pcP(-705, 0.4, 2), g1 = pcP(705, 0.4, 2); c.beginPath(); c.moveTo(g0[0], g0[1]); c.lineTo(g1[0], g1[1]); c.stroke(); c.restore();

      const back = pcPl(-4, al, 0, 0); back.dv = 0;
      const inner = pcFront(back);
      // cover lift: a closed board rests on the page block, so lift it a touch while near flat
      const lift = 12 * Math.cos(al);
      const boardPoly = (u0, u1, v0, v1, pl) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]].map(([x, v]) => { const q = pcP(x, v * pl.s + lift, pl.d + v * pl.c); return q; });
      const fillQ = (q, col) => { c.fillStyle = col; c.beginPath(); q.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); };
      const pop = (i, lag) => openDeg(tq - lag * i) * PI / 180;   // each layer trails the cover a little (flutter)
      if (inner) {
        // ---- the back board and the sky page ----
        fillQ(boardPoly(-725, 725, -6, 646, back), PC.boardE);
        const sp = boardPoly(-705, 705, 4, 626, back);
        g = c.createLinearGradient(sp[0][0], sp[0][1], sp[3][0], sp[3][1]); g.addColorStop(0, PC.skyB); g.addColorStop(1, PC.skyT);
        fillQ(sp, g);
        // sun on a slot, driven by the pull tab
        const su = E.ioC(seg(tq, PC_T.sun[0], PC_T.sun[1]));
        const sunPl = pcPl(26, pop(0.5, 0.04), lerp(-140, -330, su) + jit(1), lerp(40, 450, su) + Math.sin(su * PI) * 30);
        c.save();
        pcPath(c, pcPl(26, sunPl.b), [[[-705, 0], [705, 0], [705, 640], [-705, 640]]]); c.clip();
        const rays = [];
        for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU + tq * 0.5; rays.push([[Math.cos(a - 0.12) * 78, Math.sin(a - 0.12) * 78], [Math.cos(a) * 112, Math.sin(a) * 112], [Math.cos(a + 0.12) * 78, Math.sin(a + 0.12) * 78]]); }
        pcCard(c, sunPl, rays, '#f9cf5a', 0.7);
        pcCard(c, sunPl, [pcCirc(0, 0, 70, 28)], PC.sun, 0.7);
        c.restore();
        // clouds on stand-off tabs, sliding in their slots
        st.clouds.forEach((cl, i) => {
          const pl = pcPl(cl.d, pop(1, 0.04), cl.cu + 46 * Math.sin(tq * 0.8 + i * 2) + jit(10 + i), cl.cv);
          if (pcFront(pl)) pcCard(c, pl, cl.polys, PC.cloud, 0.8, false);
        });
        // ---- the layers, back to front ----
        const L = [];
        L.push({ d: 70, draw: pl => pcCard(c, pl, st.hills, PC.hill), u: [-690, 690] });
        L.push({
          d: 150, u: [-680, 680], draw: pl => {
            pcCard(c, pl, st.townBase, PC.base, 0.6);
            st.houses.forEach(h => {
              pcCard(c, pl, [h.body], h.col, 0.6); pcCard(c, pl, [h.roof], h.rcol, 0.4);
              if (pcFront(pl)) {
                c.fillStyle = shade('#45597a', pcLit(pl)); pcPath(c, pl, h.wins.map(([x, y, w, hh]) => [[x, y], [x + w, y], [x + w, y + hh], [x, y + hh]])); c.fill();
                c.fillStyle = shade('#8a5a3a', pcLit(pl)); const [x, y, w, hh] = h.door; pcPath(c, pl, [[[x, y], [x + w, y], [x + w, y + hh], [x, y + hh]]]); c.fill();
              }
            });
          },
        });
        // balloon, slid up on its strip from behind the trees
        const bu = kf(tq, [[PC_T.balloon[0], -360], [PC_T.balloon[1], 24, E.outQ], [PC_T.balloon[1] + 0.25, -10], [PC_T.balloon[1] + 0.5, 0]]) + (t > PC_T.balloon[1] + 0.5 ? 9 * Math.sin((tq - PC_T.balloon[1]) * 2.6) : 0);
        L.push({
          d: 205, u: null, draw: pl => {
            const bp = pcPl(pl.d, pl.b, 360 + jit(30, 1.5), bu);
            c.save(); pcPath(c, pcPl(pl.d, pl.b), [[[-705, 0], [705, 0], [705, 900], [-705, 900]]]); c.clip();
            pcCard(c, bp, [[[-6, 0], [6, 0], [6, 300], [-6, 300]]], '#e9dcc4', 0.4);
            c.strokeStyle = PC.ink; c.lineWidth = 1.5; pcPath(c, bp, [[[-26, 330], [-62, 400]], [[26, 330], [62, 400]]]); c.stroke();
            pcCard(c, bp, [[[-28, 300], [28, 300], [24, 336], [-24, 336]]], '#b9824f', 0.6);
            const env = Array.from({ length: 30 }, (_, i) => { const a = (i / 30) * TAU, rr = 100 * (1 - 0.25 * Math.max(0, -Math.sin(a))); return [Math.cos(a) * rr * 0.92, 470 + Math.sin(a) * rr - (Math.sin(a) < 0 ? 20 * -Math.sin(a) : 0)]; });
            pcCard(c, bp, [env], PC.coral, 0.9);
            pcCard(c, bp, [pcCirc(0, 470, 96, 24, 0.36)], PC.cream, 0);
            pcCard(c, bp, [pcCirc(0, 470, 98, 24, 0.12)], PC.coral, 0);
            c.restore();
          },
        });
        L.push({
          d: 250, u: [-680, 680], draw: pl => {
            pcCard(c, pl, st.treeBase, PC.base, 0.6);
            st.trees.forEach(tr => { pcCard(c, pl, [tr.trunk], PC.trunk, 0.4); pcCard(c, pl, tr.polys, tr.col, 0.7); });
            // windmill: tower, cap, and sails turning in whole exposures
            pcCard(c, pl, [[[-472, 0], [-388, 0], [-410, 212], [-450, 212]]], PC.cream, 0.7);
            pcCard(c, pl, [[[-458, 210], [-402, 210], [-430, 246]]], PC.coral, 0.5);
            const th = 0.3 + Math.max(0, tq - PC_T.mill) * 1.7, bl = [];
            for (let k = 0; k < 4; k++) { const a = th + (k * PI) / 2, ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca; bl.push([[-430 + ca * 18 + px * 4, 222 + sa * 18 + py * 4], [-430 + ca * 150 + px * 4, 222 + sa * 150 + py * 4], [-430 + ca * 150 + px * 34, 222 + sa * 150 + py * 34], [-430 + ca * 40 + px * 34, 222 + sa * 40 + py * 34]]); }
            pcCard(c, pcPl(pl.d + 6, pl.b, pl.du), bl, '#fdfbf6', 0.8);
            pcCard(c, pcPl(pl.d + 7, pl.b, pl.du), [pcCirc(-430, 222, 12, 12)], PC.ink, 0);
          },
        });
        L.push({
          d: 360, u: [-690, 690], draw: pl => {
            pcCard(c, pl, st.meadow, PC.meadow);
            if (pcFront(pl)) st.flowers.forEach(([fu, fv, rr, col]) => { c.fillStyle = shade(col, pcLit(pl)); pcPath(c, pl, [pcCirc(fu, fv, rr, 8)]); c.fill(); c.fillStyle = shade('#e8a23a', pcLit(pl)); pcPath(c, pl, [pcCirc(fu, fv, rr * 0.35, 6)]); c.fill(); });
          },
        });
        L.push({ d: 470, draw: pl => pcCard(c, pl, st.fringe, PC.fringe), u: [-700, 700] });
        L.forEach((ly, i) => {
          const pl = pcPl(ly.d, pop(i + 1, 0.04), jit(20 + i, moving));
          if (!pcFront(pl)) {
            // still folded: only the plain back of the card shows
            if (pl.b > 0.05 && ly.u) pcCard(c, pl, [[[ly.u[0], 0], [ly.u[1], 0], [ly.u[1], 60], [ly.u[0], 60]]], '#f1e7d6', 0.3);
            return;
          }
          ly.draw(pl);
          if (ly.u) pcTab(c, ly.u[0] * 0.5, ly.u[1] * 0.5, ly.d);
        });
        // ---- accordion banner ----
        const ub = E.ioC(seg(tq, PC_T.banner[0], PC_T.banner[1]));
        const phi = lerp(1.36, 0.06, ub), BW = 240, BH = 136, BZ = 552, bpl = pop(7, 0.04);
        const ed = [];
        for (let e = 0; e <= 4; e++) ed.push([(e - 2) * BW * Math.cos(phi) + jit(40 + e, moving * 0.6), BZ + (e % 2 ? -1 : 1) * BW * Math.sin(phi) * 0.5]);
        const bs = Math.sin(bpl), bc = Math.cos(bpl);
        const BP = (x, zz, v) => pcP(x, v * bs, zz + v * bc);
        const order = [0, 1, 2, 3].sort((a, b) => (ed[a][1] + ed[a + 1][1]) - (ed[b][1] + ed[b + 1][1]));
        if (-bc * PC_EYE[1] + bs * (PC_EYE[2] - BZ) > 0) order.forEach(i => {
          const [x0, z0] = ed[i], [x1, z1] = ed[i + 1];
          const TL = BP(x0, z0, BH), TR = BP(x1, z1, BH), BL = BP(x0, z0, 0);
          const nx = -(z1 - z0), nz = x1 - x0, nl = Math.hypot(nx, nz) || 1, lit = 0.8 + 0.2 * clamp(((nz > 0 ? 1 : -1) * (-0.5 * nx + 0.86 * nz)) / nl);
          c.save();
          c.transform((TR[0] - TL[0]) / BW, (TR[1] - TL[1]) / BW, (BL[0] - TL[0]) / BH, (BL[1] - TL[1]) / BH, TL[0] - ((TR[0] - TL[0]) / BW) * i * BW, TL[1] - ((TR[1] - TL[1]) / BW) * i * BW);
          c.beginPath(); c.rect(i * BW, 0, BW, BH);
          c.shadowColor = 'rgba(70,35,30,0.3)'; c.shadowBlur = 18; c.shadowOffsetX = 10; c.shadowOffsetY = 9;
          c.fillStyle = shade(PC.coral, lit); c.fill();
          c.shadowColor = 'rgba(0,0,0,0)'; c.clip();
          c.fillStyle = shade('#c94f45', lit); c.fillRect(0, BH - 14, BW * 4, 14); c.fillRect(0, 0, BW * 4, 8);
          text(c, 'PAPER CRAFT', BW * 2, BH * 0.7, { font: 'Fraunces, serif', weight: 800, size: 86, color: shade(PC.cream, lit), align: 'center', ls: 4 });
          c.setLineDash([6, 6]); c.strokeStyle = 'rgba(90,40,35,0.45)'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(i * BW + 1, 0); c.lineTo(i * BW + 1, BH); c.stroke();
          c.restore();
        });
        // ---- pull tab at the front edge ----
        const tabOut = 26 + su * 120, tp = pcPl(0, 0); tp.s = 0; tp.c = 1;
        const tq4 = [[-340, 590], [-262, 590], [-262, 600 + tabOut], [-340, 600 + tabOut]].map(([x, zz]) => pcP(x, 1.5, zz));
        c.save(); c.shadowColor = 'rgba(70,35,30,0.3)'; c.shadowBlur = 8; c.shadowOffsetY = 5; fillQ(tq4, '#ffd166'); c.restore();
        c.save(); const a0 = pcP(-301, 2, 618 + tabOut * 0.4), a1 = pcP(-301, 2, 600 + tabOut);
        c.strokeStyle = PC.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(a0[0], a0[1]); c.lineTo(a1[0], a1[1]); c.lineTo(a1[0] - 8, a1[1] - 9); c.moveTo(a1[0], a1[1]); c.lineTo(a1[0] + 8, a1[1] - 9); c.stroke();
        const lab = pcP(-301, 2, 596 + tabOut * 0.55);
        text(c, 'PULL', lab[0], lab[1], { font: 'Jost, sans-serif', weight: 500, size: 16, color: PC.ink, align: 'center', ls: 2 });
        c.restore();
      } else {
        // ---- closed (or nearly): the cloth cover with its title label ----
        fillQ(boardPoly(-725, 725, -6, 646, back), PC.board);
        const ed1 = boardPoly(-725, 725, 640, 646, back);
        fillQ([ed1[0], ed1[1], pcP(725, lift - 14, back.d + 646 * back.c), pcP(-725, lift - 14, back.d + 646 * back.c)], PC.boardE);
        c.save();
        const cv = pcPl(-4, al); const TL = pcP(-460, 160 * cv.s + lift, -4 + 160 * cv.c), TR = pcP(460, 160 * cv.s + lift, -4 + 160 * cv.c), BL = pcP(-460, 520 * cv.s + lift, -4 + 520 * cv.c);
        c.transform((TR[0] - TL[0]) / 920, (TR[1] - TL[1]) / 920, (BL[0] - TL[0]) / 360, (BL[1] - TL[1]) / 360, TL[0], TL[1]);
        c.strokeStyle = 'rgba(253,243,228,0.6)'; c.lineWidth = 4; c.setLineDash([10, 8]); c.strokeRect(-200, -120, 1320, 600); c.setLineDash([]);
        c.fillStyle = PC.cream; rrect(c, 60, 30, 800, 300, 24); c.fill();
        text(c, 'Paper Town', 460, 190, { font: 'Fraunces, serif', style: 'italic', weight: 600, size: 130, color: PC.board, align: 'center' });
        text(c, 'A POP-UP BOOK', 460, 280, { font: 'Jost, sans-serif', weight: 500, size: 44, color: PC.coral, align: 'center', ls: 12 });
        c.restore();
      }
      c.restore();
      // ---- subtitle on the table ----
      const ta = E.outC(seg(tq, PC_T.title, PC_T.title + 0.5));
      if (ta > 0) {
        c.save(); c.globalAlpha = ta;
        text(c, 'FOLD · SCORE · CUT · POP', 960, 1050 + (1 - ta) * 10, { font: 'Jost, sans-serif', weight: 500, size: 26, color: '#8a5444', align: 'center', ls: 10 });
        c.restore();
      }
      // paper fibre over everything, a breath of exposure flicker, grain
      c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.55; c.fillStyle = c.createPattern(st.paper, 'repeat'); c.fillRect(0, 0, W, H); c.restore();
      c.fillStyle = `rgba(255,240,220,${0.02 * hash(fr * 3.3)})`; c.fillRect(0, 0, W, H);
      vignette(c, W, H, 0.28, '80,40,30');
      grain(c, W, H, tq, 0.04, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 1.3;
      const b = 0.6;   // 100 bpm
      // cover: a cloth creak and a long paper rustle as the spread opens
      A.noise(0.85, { type: 'bandpass', f: 900, q: 3, dur: 0.25, g: 0.06 });
      A.noise(0.95, { type: 'bandpass', f: 2600, f2: 4800, q: 0.9, dur: 1.8, g: 0.07, swell: 0.6, rev: 0.25 });
      // each layer pops up: a soft paper snap and a little wooden "tock"
      for (let i = 0; i < 7; i++) {
        const tt = 2.55 + i * 0.07;
        A.noise(tt, { type: 'bandpass', f: 3000 + i * 300, q: 2, dur: 0.04, g: 0.08, pan: (i / 6 - 0.5) * 0.8 });
        A.osc(tt, { type: 'sine', f: 520 + i * 40, f2: 200, glide: 0.06, dur: 0.1, g: 0.08, pan: (i / 6 - 0.5) * 0.8 });
      }
      A.chord(2.75, [60, 64, 67, 72], { type: 'triangle', dur: 1.2, g: 0.03, a: 0.01, width: 0.7, rev: 0.4 });
      // music-box tune over plucked bass, from the moment the book is open
      const mel = [72, 76, 79, 76, 77, 74, 71, 74, 72, 76, 79, 84, 83, 79, 77, 74];
      mel.forEach((m, i) => A.bell(3.0 + i * b / 2, midi(m), { g: 0.035, dur: 0.9, ratios: [1, 3.01, 5.2], pan: 0.2, rev: 0.3 }));
      [48, 55, 53, 55, 48, 55, 53, 50].forEach((m, i) => A.pluck(3.0 + i * b, midi(m), { g: 0.2, dur: 0.9, bright: 0.4, decay: 0.993, lp: 1600, pan: -0.15 }));
      // pull tab: a sliding scrape while the sun climbs, with a rising glockenspiel
      A.noise(3.1, { type: 'bandpass', f: 1400, f2: 2400, q: 4, dur: 1.9, g: 0.025, swell: 0.5 });
      [84, 86, 88, 91, 93, 96].forEach((m, i) => A.bell(3.2 + i * 0.3, midi(m), { g: 0.02, dur: 0.8, pan: -0.3, rev: 0.5 }));
      // windmill sails: a soft wooden ratchet on each exposure step
      for (let k = 0; k < 14; k++) A.noise(3.4 + k * 0.17, { type: 'bandpass', f: 1800, q: 8, dur: 0.018, g: 0.03, pan: -0.5 });
      // balloon slides up and boings
      A.whoosh(5.3, 0.9, { f1: 400, f2: 2000, g: 0.06, rev: 0.3, pan: 0.35 });
      A.osc(6.3, { type: 'sine', f: 330, f2: 660, glide: 0.12, dur: 0.5, g: 0.06, vib: [9, 14], pan: 0.35, rev: 0.4 });
      [60, 64, 67, 72, 76].forEach((m, i) => A.pluck(5.4 + i * 0.12, midi(m), { g: 0.1, dur: 1.0, bright: 0.6, pan: 0.3, rev: 0.4 }));
      // banner: four paper snaps as the accordion unfolds, then the cadence
      for (let k = 0; k < 4; k++) { const tt = 6.95 + k * 0.33; A.noise(tt, { type: 'bandpass', f: 2200 + k * 400, q: 1.5, dur: 0.06, g: 0.09 }); A.pluck(tt, midi([67, 69, 71, 72][k]), { g: 0.14, dur: 0.8, bright: 0.55, rev: 0.3 }); }
      A.chord(8.3, [48, 55, 60, 64, 67, 72], { type: 'triangle', dur: 1.7, g: 0.035, a: 0.02, width: 0.8, rev: 0.5 });
      A.bell(8.3, midi(84), { g: 0.05, dur: 1.6, rev: 0.5 });
      A.bell(8.6, midi(88), { g: 0.035, dur: 1.4, rev: 0.5 });
      A.bell(8.9, midi(91), { g: 0.03, dur: 1.1, rev: 0.5 });
    },
  });
})();
