/* batch c6 — Family E: Experimental & Generative.
   Fractal zoom (Mandelbrot → Julia), L-systems (rewriting + turtle graphics), Boids (Reynolds flocking).
   Every frame is a pure function of t: fractals are iterated per frame, plants are re-interpreted per frame
   from cached strings, and the flock is simulated once in fixed steps from t = 0 and cached. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500&family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=IBM+Plex+Mono:wght@400;500&display=block');
  const MONO = '"JetBrains Mono", monospace';
  const PLEX = '"IBM Plex Mono", "JetBrains Mono", monospace';
  const GROT = '"Space Grotesk", Archivo, sans-serif';
  const SERIF = '"Cormorant Garamond", "Playfair Display", serif';
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const fmtN = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const h32 = i => { let n = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };

  /* ================= E · Fractal Motion — Mandelbrot zoom → Julia morph ================= */
  const FW = 768, FH = 432;
  // a double spiral deep in seahorse valley, given to full float64 precision
  const FT = [-0.7746806106269039, -0.1374168856037867];
  const FC0 = [-0.55, 0.0], FJC = [0.0, 0.3];
  const F_W0 = 3.1, F_WEND = 4e-11, F_WJ = 4.3;
  const FZ = { reveal: 1.25, z0: 1.3, z1: 6.55, p0: 6.62, p1: 7.42, m0: 7.38, m1: 8.3, title: 8.6 };
  const fRotDive = t => 2.4 * E.inQ(seg(t, FZ.z0, FZ.z1 + 2.2));
  const fLogW = t => {
    if (t < FZ.z0) return Math.log(lerp(3.7, F_W0, E.outC(seg(t, 0, FZ.z0))));
    if (t < FZ.p0) {
      // ease-in, constant cruise, soft arrival
      const u = seg(t, FZ.z0, FZ.z1), a = 0.2, b = 0.86, vmax = 1 / (a / 2 + (b - a) + (1 - b) / 2);
      let k;
      if (u < a) k = vmax * u * u / (2 * a);
      else if (u < b) k = vmax * (a / 2 + (u - a));
      else k = vmax * (a / 2 + (b - a) + ((1 - b) / 2) * (1 - Math.pow((1 - u) / (1 - b), 2)));
      return lerp(Math.log(F_W0), Math.log(F_WEND), clamp(k));
    }
    // slingshot back out to the whole set
    return lerp(Math.log(F_WEND), Math.log(F_W0), E.ioC(seg(t, FZ.p0, FZ.p1)));
  };
  const fMorph = t => E.ioC(seg(t, FZ.m0, FZ.m1));
  const fView = t => {
    const lw = fLogW(t), w0 = Math.exp(lw);
    let cx, cy, rot, w = w0;
    const k = fMorph(t);
    if (t < FZ.z0) { cx = FC0[0]; cy = FC0[1]; rot = 0; }
    else {
      const s = w0 / F_W0;                       // the target is the fixed point of the zoom
      cx = FT[0] + (FC0[0] - FT[0]) * s; cy = FT[1] + (FC0[1] - FT[1]) * s;
      rot = t < FZ.p0 ? fRotDive(t) : fRotDive(FZ.p0) * (1 - E.ioC(seg(t, FZ.p0, FZ.p1)));
      if (t > FZ.m0) {
        const q = E.ioC(seg(t, FZ.m0, FZ.m1 + 0.2));
        cx = lerp(cx, FJC[0], q); cy = lerp(cy, FJC[1], q); w = lerp(w0, F_WJ, q);
        rot = lerp(rot, -0.22 + 0.05 * (t - FZ.m1), q);
      }
    }
    // Julia parameter: the very point we dived into, drifting slightly so the set breathes
    const jb = Math.max(0, t - FZ.m1);
    const jc = [FT[0] - 0.006 * Math.sin(jb * 1.1), FT[1] + 0.004 * (1 - Math.cos(jb * 1.1))];
    const zoom = F_W0 / w;
    const lz = Math.log10(Math.max(1, zoom));
    const iters = t < FZ.reveal
      ? Math.round(1 + Math.pow(seg(t, 0.08, FZ.reveal), 2.2) * 220)
      : Math.round(lerp(Math.min(3000, 300 + 190 * lz + 5 * Math.pow(lz, 2.4)), 900, k));
    return { w, cx, cy, rot, k, jc, iters, zoom };
  };
  // palette: the classic blue–white–gold escape palette, plus a dusk palette for the Julia set
  const F_STOPS_A = [[0, [0, 7, 100]], [0.16, [32, 107, 203]], [0.42, [237, 255, 255]], [0.6425, [255, 170, 0]], [0.8575, [10, 2, 18]], [1, [0, 7, 100]]];
  const F_STOPS_B = [[0, [40, 6, 64]], [0.18, [168, 40, 120]], [0.4, [255, 214, 170]], [0.6, [255, 120, 40]], [0.85, [8, 4, 20]], [1, [40, 6, 64]]];
  function fLUT(stops) {
    const L = new Float32Array(1024 * 3);
    for (let i = 0; i < 1024; i++) {
      const u = i / 1024;
      let j = 1; while (stops[j][0] < u) j++;
      const [a, ca] = stops[j - 1], [b, cb] = stops[j], k = E.ioS((u - a) / (b - a));
      for (let ch = 0; ch < 3; ch++) L[i * 3 + ch] = lerp(ca[ch], cb[ch], k);
    }
    return L;
  }

  function fracRender(st, t) {
    const v = fView(t), data = st.img.data, LA = st.LA, LB = st.LB, MU = st.MU, SH = st.SH, ED = st.ED;
    const pix = v.w / FW, cr = Math.cos(v.rot), sr = Math.sin(v.rot);
    const k = v.k, omk = 1 - k, jr = v.jc[0], ji = v.jc[1];
    const maxI = v.iters, B2 = 1e6, ln2 = Math.LN2, eps = 1e-13;
    // light direction rotates slowly — moving speculars sell the relief
    const la = 0.9 + t * 0.35, lx = Math.cos(la), ly = Math.sin(la), h2 = 1.35;
    let o = 0, sumI = 0, nIn = 0;
    {
    const isM = k === 0;
    for (let py = 0; py < FH; py++) {
      const vy = (py + 0.5 - FH / 2) * pix;
      for (let px = 0; px < FW; px++, o++) {
        const ux = (px + 0.5 - FW / 2) * pix;
        const pr = v.cx + ux * cr - vy * sr, pi = v.cy + ux * sr + vy * cr;
        let zr = k * pr, zi = k * pi, dr = k, di = 0;
        const ccr = omk * pr + k * jr, cci = omk * pi + k * ji;
        let n = 0, zr2 = zr * zr, zi2 = zi * zi, inside = false;
        if (isM) {
          const q = (pr - 0.25) * (pr - 0.25) + pi * pi;
          if (q * (q + (pr - 0.25)) <= 0.25 * pi * pi || (pr + 1) * (pr + 1) + pi * pi <= 0.0625) inside = true;
        }
        if (!inside) {
          let sr2 = zr, si2 = zi, per = 0, plim = 8;
          for (; n < maxI; n++) {
            if (zr2 + zi2 > B2) break;
            const ndr = 2 * (zr * dr - zi * di) + omk;
            di = 2 * (zr * di + zi * dr); dr = ndr;
            zi = 2 * zr * zi + cci; zr = zr2 - zi2 + ccr;
            zr2 = zr * zr; zi2 = zi * zi;
            const ex = zr - sr2, ey = zi - si2;
            if (ex < eps && ex > -eps && ey < eps && ey > -eps) { n = maxI; break; }
            if (++per === plim) { per = 0; plim += plim >> 1; sr2 = zr; si2 = zi; }
          }
          if (n >= maxI) inside = true;
        }
        if (inside) { MU[o] = -1; nIn++; continue; }
        sumI += n;
        const m2 = zr2 + zi2, lz = 0.5 * Math.log(m2);
        MU[o] = n + 1 - Math.log(lz / ln2) / ln2;
        // relief: surface normal = z / dz
        const ur = zr * dr + zi * di, ui = zi * dr - zr * di, ul = Math.sqrt(ur * ur + ui * ui) || 1;
        const sh = ((ur * lx + ui * ly) / ul + h2) / (1 + h2);
        SH[o] = sh < 0 ? 0 : sh;
        // distance estimate in pixels: crisp filaments at low internal resolution
        const dl = Math.sqrt(dr * dr + di * di) || 1e-300, de = (Math.sqrt(m2) * lz * 2) / dl / pix;
        ED[o] = de < 2.4 ? 1 - de / 2.4 : 0;
      }
    }
    }
    // per-frame band normalisation from robust percentiles of the escape counts
    const smp = st.SMP; let ns = 0;
    for (let i = 0; i < FW * FH; i += 53) if (MU[i] >= 0) smp[ns++] = MU[i];
    let lo = 1, md = 2, hi = 3;
    if (ns > 8) {
      const a = smp.subarray(0, ns).sort();
      lo = a[Math.floor(ns * 0.015)]; md = a[Math.floor(ns * 0.5)]; hi = a[Math.floor(ns * 0.97)];
    }
    // blend towards fixed scaling for the wide shots so their bands stay put
    const spread = Math.max(0.5, md - lo);
    const cyc = lerp(3.0, 2.4, k);
    const phase = t * 0.11;
    const pb = sstep(FZ.m0 + 0.2, FZ.m1, t);
    const fadeW = Math.max(0.8, (md - lo) * lerp(1.5, 3.4, k));
    o = 0;
    for (let i = 0; i < FW * FH; i++, o += 4) {
      const mu = MU[i];
      if (mu < 0) { data[o] = 2; data[o + 1] = 1; data[o + 2] = 7; data[o + 3] = 255; continue; }
      let u = Math.log(1 + (mu - lo) / spread) * cyc + mu * 0.0025 - phase;
      u -= Math.floor(u);
      const li = ((u * 1024) | 0) * 3;
      let r = LA[li], g = LA[li + 1], b = LA[li + 2];
      if (pb > 0) { r = lerp(r, LB[li], pb); g = lerp(g, LB[li + 1], pb); b = lerp(b, LB[li + 2], pb); }
      const sh = SH[i], lit = 0.26 + 0.95 * sh, spec = Math.pow(sh, 18) * 120;
      let fd = (mu - lo) / fadeW; fd = fd < 0 ? 0 : fd > 1 ? 1 : fd * fd * (3 - 2 * fd);
      fd = 0.05 + 0.95 * fd;
      r = (r * lit + spec) * fd; g = (g * lit + spec) * fd; b = (b * lit + spec * 0.9) * fd;
      const ek = ED[i] * ED[i] * 0.6;
      r = r + (255 - r) * ek * 0.9; g = g + (236 - g) * ek * 0.8; b = b + (200 - b) * ek * 0.6;
      data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = 255;
    }
    st.fg.putImageData(st.img, 0, 0);
    st.avgI = sumI / Math.max(1, FW * FH - nIn); st.dbg = [nIn, v.iters];
    return v;
  }

  const fSci = z => {
    const e = Math.floor(Math.log10(z)), m = z / Math.pow(10, e);
    return [m.toFixed(2), e];
  };

  MG.film({
    id: 'fractal', dur: 10, poster: 9.4,
    fonts: [['300 64px "Space Grotesk"', 'FRACTAL MOTION'], ['400 14px "JetBrains Mono"', 'Aa1×·↦²−+i'], ['500 15px "IBM Plex Mono"', 'Aa1']],
    meta: {
      family: 'E', name: 'Fractal Motion', sub: 'Infinite Zoom', era: '1980 —',
      origin: 'Benoit Mandelbrot imaged the set z ↦ z² + c at IBM in 1980 and made fractals a visual language with "The Fractal Geometry of Nature" (1982); smooth colouring and ever-deeper zooms turned its self-similar boundary into a genre of motion.',
      works: 'Benoit Mandelbrot, The Fractal Geometry of Nature (1982) · Peitgen & Richter, The Beauty of Fractals (1986) · Loren Carpenter, Vol Libre (1980) · Arthur C. Clarke, Fractals: The Colors of Infinity (1995) · Ultra Fractal (Frederik Slijkerman, 1999 —)',
      tech: ['Escape-time iteration in float64', 'Smooth iteration count + palette cycling', 'Distance-estimate relief lighting'],
      accent: '#ffaa00',
      motionDNA: 'An exponential dolly: the camera divides its width by a constant factor every frame toward a fixed boundary point, so detail streams out of the centre forever while the palette flows through the bands.',
      visualDNA: 'Self-similar spirals and seahorse filaments in blue, white and molten gold, embossed by a raking light, with crisp black interior lakes.',
      transitions: 'Iteration-count reveal, infinite zoom, Mandelbrot-to-Julia parameter morph, exponential pull-back',
      implementation: ['GLSL', 'Canvas 2D', 'Ultra Fractal', 'TouchDesigner'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const fc = offscreen(FW, FH), fg = fc.getContext('2d');
      const bl = offscreen(320, 180);
      return { fc, fg, img: fg.createImageData(FW, FH), bl, bg: bl.getContext('2d'), LA: fLUT(F_STOPS_A), LB: fLUT(F_STOPS_B), avgI: 0,
        MU: new Float32Array(FW * FH), SH: new Float32Array(FW * FH), ED: new Float32Array(FW * FH), SMP: new Float32Array(Math.ceil(FW * FH / 53) + 1) };
    },
    draw(c, t, W, H, st) {
      const v = fracRender(st, t);
      c.fillStyle = '#020106'; c.fillRect(0, 0, W, H);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      // a hint of zoom blur during the fastest dive
      c.drawImage(st.fc, 0, 0, W, H);
      st.bg.clearRect(0, 0, 320, 180);
      st.bg.drawImage(st.fc, 0, 0, 320, 180);
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.filter = 'blur(10px)'; c.globalAlpha = 0.28; c.drawImage(st.bl, 0, 0, W, H);
      c.filter = 'blur(42px)'; c.globalAlpha = 0.22; c.drawImage(st.bl, 0, 0, W, H);
      c.filter = 'none'; c.globalAlpha = 1;
      // morph flash
      const fl = Math.exp(-Math.pow((t - (FZ.p0 + 0.03)) / 0.06, 2)) * 0.35 + Math.exp(-Math.pow((t - FZ.m1) / 0.14, 2)) * 0.12;
      if (fl > 0.01) { c.fillStyle = `rgba(255,236,210,${fl})`; c.fillRect(0, 0, W, H); }
      c.restore();
      vignette(c, W, H, 0.7);

      // instrumentation
      const ov = seg(t, 0.25, 0.8) * (1 - seg(t, FZ.title - 0.4, FZ.title)) * 0.85;
      if (ov > 0) {
        const col = `rgba(236,244,255,${ov})`, dim = `rgba(236,244,255,${ov * 0.55})`, acc = `rgba(255,190,90,${ov})`;
        const formula = v.k < 0.5 ? 'z ↦ z² + c      z₀ = 0' : 'z ↦ z² + c      c fixed';
        text(c, formula, 80, 92, { font: MONO, size: 20, ls: 1, color: col });
        text(c, v.k < 0.02 ? 'MANDELBROT SET' : v.k > 0.98 ? 'JULIA SET' : `MORPH  M → J   ${(v.k * 100).toFixed(0).padStart(3, ' ')}%`, 80, 120, { font: MONO, size: 13, ls: 4, color: acc });
        const re = v.k > 0.5 ? v.jc[0] : v.cx, im = v.k > 0.5 ? v.jc[1] : v.cy;
        text(c, `${v.k > 0.5 ? 'c' : 'centre'}  ${re.toFixed(15)}`, W - 80, 92, { font: MONO, size: 15, ls: 0.5, align: 'right', color: col });
        text(c, `${im >= 0 ? '+' : '−'}${Math.abs(im).toFixed(15)} i`, W - 80, 116, { font: MONO, size: 15, ls: 0.5, align: 'right', color: col });
        text(c, `MAX ITER ${fmtN(v.iters)}    ·    MEAN ${fmtN(st.avgI)}    ·    ${FW}×${FH} FLOAT64`, W - 80, 142, { font: MONO, size: 11, ls: 2, align: 'right', color: dim });
        // magnification readout
        const [m, e] = fSci(Math.max(1, v.zoom));
        c.save();
        text(c, '×', 80, H - 84, { font: GROT, weight: 300, size: 40, color: col });
        text(c, m, 112, H - 84, { font: GROT, weight: 300, size: 56, ls: 1, color: col });
        c.font = `300 56px ${GROT}`;
        const mw = c.measureText(m).width;
        text(c, '× 10', 124 + mw, H - 84, { font: GROT, weight: 300, size: 40, color: dim });
        text(c, String(e), 124 + mw + 84, H - 112, { font: GROT, weight: 400, size: 28, color: acc });
        text(c, 'MAGNIFICATION', 82, H - 150, { font: MONO, size: 11, ls: 4, color: dim });
        c.restore();
        // depth gauge
        const gx = W - 92, gy0 = 210, gy1 = H - 150, decs = 11;
        c.strokeStyle = `rgba(236,244,255,${ov * 0.35})`; c.lineWidth = 1;
        c.beginPath(); c.moveTo(gx, gy0); c.lineTo(gx, gy1); c.stroke();
        for (let d = 0; d <= decs; d++) {
          const y = lerp(gy0, gy1, d / decs), on = Math.log10(Math.max(1, v.zoom)) >= d - 0.01;
          c.strokeStyle = on ? `rgba(255,190,90,${ov})` : `rgba(236,244,255,${ov * 0.35})`;
          c.beginPath(); c.moveTo(gx - (d % 5 ? 6 : 12), y); c.lineTo(gx, y); c.stroke();
          if (d % 2 === 0) text(c, `10${['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹', '¹⁰', '¹¹'][d]}`, gx - 22, y + 4, { font: MONO, size: 11, align: 'right', color: on ? acc : dim });
        }
        const gd = clamp(Math.log10(Math.max(1, v.zoom)) / decs), gyy = lerp(gy0, gy1, gd);
        c.fillStyle = acc; c.beginPath(); c.moveTo(gx + 4, gyy); c.lineTo(gx + 14, gyy - 6); c.lineTo(gx + 14, gyy + 6); c.closePath(); c.fill();
        // centre reticle during the dive
        const ra = ov * seg(t, FZ.z0, FZ.z0 + 0.4) * (1 - seg(t, FZ.p0 - 0.2, FZ.p0)) * 0.55;
        if (ra > 0) {
          c.strokeStyle = `rgba(255,240,220,${ra})`; c.lineWidth = 1;
          const cx = W / 2, cy = H / 2, R = 26;
          c.beginPath();
          [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([a, b]) => { c.moveTo(cx + a * R, cy + b * (R - 9)); c.lineTo(cx + a * R, cy + b * R); c.lineTo(cx + a * (R - 9), cy + b * R); });
          c.stroke();
        }
      }
      // title
      const ta = E.outC(seg(t, FZ.title, FZ.title + 0.7));
      if (ta > 0) {
        const bg = c.createLinearGradient(0, H - 330, 0, H);
        bg.addColorStop(0, 'rgba(2,1,6,0)'); bg.addColorStop(0.55, `rgba(2,1,6,${0.72 * ta})`); bg.addColorStop(1, `rgba(2,1,6,${0.9 * ta})`);
        c.fillStyle = bg; c.fillRect(0, H - 330, W, 330);
        c.save();
        c.shadowColor = 'rgba(0,0,0,0.8)'; c.shadowBlur = 24;
        text(c, 'FRACTAL MOTION', W / 2 + 14, H - 150 + (1 - ta) * 16, { font: GROT, weight: 300, size: 66, ls: 28, align: 'center', color: `rgba(255,248,236,${ta})` });
        c.restore();
        const sa = E.outC(seg(t, FZ.title + 0.3, FZ.title + 1.0));
        c.strokeStyle = `rgba(255,190,90,${sa * 0.8})`; c.lineWidth = 1;
        c.beginPath(); c.moveTo(W / 2 - 180 * sa, H - 116); c.lineTo(W / 2 + 180 * sa, H - 116); c.stroke();
        text(c, 'MANDELBROT 1980  ·  JULIA SET  c ≈ −0.7747 − 0.1374 i', W / 2, H - 82, { font: MONO, size: 14, ls: 3, align: 'center', color: `rgba(255,214,160,${sa * 0.85})` });
      }
      grain(c, W, H, t, 0.04, 'overlay');
    },
    score(A) {
      // the set crystallising: a rising stack of partials, one per iteration band
      for (let k = 0; k < 14; k++) {
        const tt = 0.1 + Math.pow(k / 14, 0.75) * 1.05;
        A.osc(tt, { f: midi(45 + [0, 7, 12, 16, 19, 24, 26, 28, 31, 33, 35, 36, 38, 40][k]), dur: 1.6 - k * 0.05, g: 0.035, a: 0.005, rev: 0.6, pan: (k % 2 ? 1 : -1) * 0.4 * (k / 14) });
      }
      A.osc(0, { f: midi(33), dur: 6.9, g: 0.12, a: 1.2, hold: true, rel: 0.4, lp: 200, lp2: 900, lpT: 6.5 });
      A.osc(0, { f: midi(40) * 1.004, dur: 6.9, g: 0.04, a: 2.5, hold: true, rel: 0.4, type: 'triangle', lp: 500, lp2: 2000, lpT: 6.5 });
      A.bell(FZ.reveal - 0.02, midi(81), { g: 0.08, dur: 2.4 });
      A.chord(FZ.reveal, [45, 52, 57, 64, 69], { type: 'sine', dur: 5.6, g: 0.02, a: 1.4, hold: true, rel: 0.8, width: 1.4, rev: 0.6, vib: [0.2, 1.2] });
      // the dive: a bell each time the magnification passes another power of ten
      const scale = [0, 3, 7, 10, 12, 15, 19, 22, 24, 27, 31];
      let last = 0;
      for (let tt = FZ.z0; tt < FZ.p0; tt += 0.004) {
        const d = Math.floor(Math.log10(Math.max(1, fView(tt).zoom)));
        if (d > last) {
          last = d;
          A.bell(tt, midi(69 + scale[(d - 1) % scale.length]), { g: 0.04 + d * 0.003, dur: 1.6, pan: d % 2 ? 0.35 : -0.35, rev: 0.6 });
          A.noise(tt, { type: 'highpass', f: 6000, dur: 0.05, g: 0.02 });
        }
      }
      A.noise(FZ.z0, { type: 'bandpass', f: 200, f2: 2600, sweep: 5.2, q: 1.2, dur: 5.3, g: 0.06, swell: 0.85, rev: 0.4 });
      A.osc(FZ.z0, { type: 'sawtooth', f: midi(33), f2: midi(45), glide: 5.2, dur: 5.3, g: 0.02, a: 4.4, lp: 300, lp2: 2400, lpT: 5.2 });
      // the floor of the dive: a breath, then the slingshot back out
      A.riser(FZ.p0 - 0.9, 0.92, { g: 0.1, f: 55 });
      A.impact(FZ.p0, 0.55);
      A.whoosh(FZ.p0, 0.85, { f1: 6000, f2: 160, g: 0.15, swell: 0.12 });
      A.osc(FZ.p0, { f: 2400, f2: 70, glide: 0.8, dur: 0.85, g: 0.035, type: 'triangle', rev: 0.5 });
      // the morph: shimmering partials converging
      for (let i = 0; i < 18; i++) {
        const tt = FZ.m0 + i * 0.048;
        A.osc(tt, { f: midi(76 + [0, 3, 7, 10, 12, 15][i % 6]) * (1 + 0.003 * (i % 3)), dur: 0.5, g: 0.022, a: 0.01, pan: (hash(i * 3.1) - 0.5) * 1.4, rev: 0.6 });
      }
      A.noise(FZ.m0, { type: 'bandpass', f: 3000, f2: 900, sweep: 0.9, q: 3, dur: 0.95, g: 0.05, swell: 0.6, rev: 0.6 });
      A.chord(FZ.m1 - 0.05, [38, 45, 50, 57, 62, 66, 69, 74], { type: 'triangle', dur: 2.0, g: 0.022, a: 0.02, rev: 0.7, width: 1.6 });
      A.osc(FZ.m1 - 0.05, { f: midi(26), dur: 1.9, g: 0.09, a: 0.02, rev: 0.3 });
      A.bell(FZ.m1 - 0.05, midi(86), { g: 0.07, dur: 2.6 });
      A.chord(FZ.title, [38, 50, 57, 62, 66, 69, 74], { type: 'sine', dur: 1.4, g: 0.026, a: 0.3, hold: true, rel: 0.9, width: 1.4, rev: 0.7 });
      [74, 78, 81, 85, 90].forEach((m, i) => A.bell(FZ.title + 0.1 + i * 0.12, midi(m), { g: 0.026, dur: 1.3, pan: (i / 4 - 0.5) * 1.2, rev: 0.6 }));
    },
  });

  /* ================= E · L-systems — parallel rewriting + turtle graphics ================= */
  // Every symbol carries the generation that created it. Rewriting a segment into copies of itself
  // (F → FF, F → F[+F]F[−F]F) keeps the parent's generation, so drawing only symbols born ≤ n
  // reproduces generation n exactly — new growth sprouts in parallel at every bud.
  const C_F = 70, C_P = 43, C_M = 45, C_O = 91, C_C = 93, C_X = 88;
  function lsBuild(axiom, rules, n) {
    let s = [...axiom].map(ch => ch.charCodeAt(0)), g = s.map(() => 0);
    const strs = [axiom], lens = [s.length];
    for (let k = 1; k <= n; k++) {
      const ns = [], ng = [];
      for (let i = 0; i < s.length; i++) {
        const ch = String.fromCharCode(s[i]), r = rules[ch];
        if (r === undefined) { ns.push(s[i]); ng.push(g[i]); continue; }
        let dep = 0;
        for (const c2 of r) {
          if (c2 === '[') dep++; else if (c2 === ']') dep--;
          ns.push(c2.charCodeAt(0)); ng.push(dep === 0 && c2 === ch ? g[i] : k);
        }
      }
      s = ns; g = ng;
      strs.push(String.fromCharCode(...s.slice(0, 120))); lens.push(s.length);
    }
    const N = s.length, S = Uint8Array.from(s), Gn = Uint8Array.from(g);
    // bracket matching and the end of the scope each symbol lives in
    const match = new Int32Array(N).fill(-1), SE = new Int32Array(N), st = [];
    for (let i = 0; i < N; i++) { if (S[i] === C_O) st.push(i); else if (S[i] === C_C) match[st.pop()] = i; }
    const scope = [N];
    for (let i = 0; i < N; i++) {
      SE[i] = scope[scope.length - 1];
      if (S[i] === C_O) scope.push(match[i]); else if (S[i] === C_C) scope.pop();
    }
    // F prefix count → descendants (pipe-model thickness)
    const pre = new Int32Array(N + 1);
    for (let i = 0; i < N; i++) pre[i + 1] = pre[i] + (S[i] === C_F ? 1 : 0);
    const DESC = new Float32Array(N);
    for (let i = 0; i < N; i++) if (S[i] === C_F) DESC[i] = pre[SE[i]] - pre[i];
    // distance along the path through segments born ≥ g (growth clock within a generation)
    const DL = new Float32Array(N), Lm = new Float32Array(n + 2), dg = new Float64Array(n + 2), stk = [];
    for (let i = 0; i < N; i++) {
      const c = S[i];
      if (c === C_F || c === C_X) {
        const gi = Gn[i]; let d = 0;
        for (let q = gi; q <= n; q++) d += dg[q];
        DL[i] = d;
        if (c === C_F) { dg[gi] += 1; Lm[gi] = Math.max(Lm[gi], d + 1); }
      } else if (c === C_O) stk.push(Float64Array.from(dg));
      else if (c === C_C) dg.set(stk.pop());
    }
    return { S, Gn, SE, DESC, DL, Lm, n, strs, lens, descMax: Math.max(1, DESC[S.indexOf(C_F)] + 1) };
  }
  // static extents with unit segments
  function lsExtent(P, delta) {
    let x = 0, y = 0, h = -Math.PI / 2, minX = 0, maxX = 0, minY = 0;
    const stk = [];
    for (let i = 0; i < P.S.length; i++) {
      const c = P.S[i];
      if (c === C_F) { x += Math.cos(h); y += Math.sin(h); minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); }
      else if (c === C_P) h += delta; else if (c === C_M) h -= delta;
      else if (c === C_O) stk.push(x, y, h); else if (c === C_C) { h = stk.pop(); y = stk.pop(); x = stk.pop(); }
    }
    return { minX, maxX, h: -minY };
  }

  const LS_PAPER = '#efe6d1', LS_INK = [44, 36, 24], LS_RED = [176, 64, 44], LS_BARK = [58, 42, 28];
  const LS_LEAF = ['rgba(104,140,70,0.78)', 'rgba(78,118,58,0.78)', 'rgba(140,166,86,0.75)', 'rgba(58,94,52,0.8)'];
  const LS_PETAL = ['rgba(232,128,136,0.92)', 'rgba(244,170,160,0.92)', 'rgba(214,84,106,0.92)'];
  const lsc = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  // templates
  const LT = {};
  function lsTemplates() {
    if (LT.tree) return LT;
    LT.tree = lsBuild('X', { X: 'F[-X][+X]F[+X]-X', F: 'FF' }, 6);
    LT.tree4 = lsBuild('X', { X: 'F[-X][+X]F[+X]-X', F: 'FF' }, 4);
    LT.fern4 = lsBuild('X', { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, 4);
    LT.fern = lsBuild('X', { X: 'F+[[X]-X]-F[-FX]+X', F: 'FF' }, 6);
    LT.shrub = lsBuild('X', { X: 'F[+X][-X]FX', F: 'FF' }, 5);
    LT.weed = lsBuild('F', { F: 'F[+F]F[-F]F' }, 4);
    LT.bush = lsBuild('F', { F: 'FF-[-F+F+F]+[+F-F-F]' }, 3);
    LT.small = lsBuild('X', { X: 'F[+X][-X]FX', F: 'FF' }, 4);
    return LT;
  }
  // one planted instance of a template
  function lsPlant(T, o) {
    const delta = o.delta * Math.PI / 180, ex = lsExtent(T, delta), L = o.height / ex.h;
    return { T, delta, L, x0: o.x, y0: 0, baseW: o.w || 18, kind: o.kind, ink: o.ink || LS_INK, alpha: o.alpha ?? 1,
      t0: o.t0, dt: o.dt, flip: o.flip ? -1 : 1, leaf: o.leaf || 0, leafS: o.leafS || 1, seed: o.seed || 1, lean: o.lean || 0, grow: o.grow || null, tipDots: !!o.tipDots };
  }
  // generation clock: each generation's growth eases in over its slot
  const lsG = (P, t) => {
    if (P.grow) return P.grow(t);
    const u = (t - P.t0) / P.dt;
    if (u <= 0) return 0;
    if (u >= P.T.n) return P.T.n;
    const k = Math.floor(u), f = u - k;
    return k + E.ioS(Math.min(1, f / 0.78));
  };

  function lsDraw(c, P, t, cam, W, H, out) {
    const G = lsG(P, t);
    if (G <= 0) return G;
    const { S, Gn, SE, DESC, DL, Lm, n } = P.T, len = S.length;
    const z = cam.z, ox = W / 2 - cam.cx * z, oy = H / 2 - cam.cy * z;
    const delta = P.delta * P.flip, segL = P.L;
    // cull
    const sx0 = ox + P.x0 * z;
    if (sx0 < -P.L * 600 * z - 400 || sx0 > W + P.L * 600 * z + 400) return G;
    const NB = 22, paths = out.paths;
    for (let b = 0; b < NB; b++) paths[b] = null;
    const fresh = P.tipDots ? new Path2D() : null; let freshA = 0, fcont = false;
    if (P.tipDots && !out.fork) out.fork = null;
    const leaves = out.leaves, tips = out.tips;
    let x = P.x0, y = P.y0, h = -Math.PI / 2 + P.lean, d = 0, cont = -1;
    const stk = out.stk; let sp = 0;
    const wind = 0.016 * Math.sin(t * 1.3 + P.x0 * 0.002) + 0.008 * Math.sin(t * 2.9 + 1.7 + P.seed);
    const grownK = 0.4 + 0.6 * sstep(0, n, G);
    for (let i = 0; i < len; i++) {
      const ch = S[i];
      if (ch === C_F) {
        const g = Gn[i];
        let p = 1;
        if (g > 0) {
          const fr = G - (g - 1);
          p = fr <= 0 ? 0 : fr >= 1 ? 1 : clamp(fr * Lm[g] - DL[i]);
        }
        if (p <= 0) { if (SE[i] >= len) break; i = SE[i] - 1; cont = -1; continue; }
        h += wind * (0.15 + d * 0.5) * 0.12;
        const L = segL * p, nx = x + Math.cos(h) * L, ny = y + Math.sin(h) * L;
        let b = Math.round(Math.log2(DESC[i] + 1) * 1.6); if (b >= NB) b = NB - 1;
        let pa = paths[b];
        if (!pa) { pa = paths[b] = new Path2D(); cont = -1; }
        if (cont !== b) pa.moveTo(ox + x * z, oy + y * z);
        pa.lineTo(ox + nx * z, oy + ny * z);
        if (fresh && g > 0) {
          const fa = 1 - clamp((G - g) / 0.7);
          if (fa > 0.02) { if (!fcont) fresh.moveTo(ox + x * z, oy + y * z); fresh.lineTo(ox + nx * z, oy + ny * z); fcont = true; freshA = Math.max(freshA, fa); } else fcont = false;
        }
        cont = b; x = nx; y = ny;
        if (p < 1 && P.tipDots && tips.n < 900) { tips.a[tips.n * 2] = ox + x * z; tips.a[tips.n * 2 + 1] = oy + y * z; tips.n++; }
      } else if (ch === C_P) h += delta;
      else if (ch === C_M) h -= delta;
      else if (ch === C_O) {
        stk[sp++] = x; stk[sp++] = y; stk[sp++] = h; stk[sp++] = d;
        if (P.tipDots && P === out.forkOf && !out.fork) out.fork = [ox + x * z, oy + y * z, h];
        d++; cont = -1; fcont = false;
        h += (0.03 + 0.012 * d) * Math.sin(t * (1.6 + 0.07 * (i % 7)) + i * 0.37) * (0.4 + 0.6 * grownK);
      } else if (ch === C_C) {
        d = stk[--sp]; h = stk[--sp]; y = stk[--sp]; x = stk[--sp]; cont = -1; fcont = false;
      } else if (ch === C_X && P.leaf && G > n - 1) {
        const q = (G - (n - 1)) * (Lm[n] + 1) - DL[i] - 0.6;
        if (q > 0 && leaves.n < 6000) {
          const k = leaves.n * 5;
          leaves.a[k] = ox + x * z; leaves.a[k + 1] = oy + y * z; leaves.a[k + 2] = h; leaves.a[k + 3] = q; leaves.a[k + 4] = i;
          leaves.n++;
        }
      }
    }
    // branches: thickest first
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (let b = NB - 1; b >= 0; b--) {
      const pa = paths[b]; if (!pa) continue;
      const w = Math.max(0.75, P.baseW * z * Math.pow(Math.pow(2, b / 1.6) / P.T.descMax, 0.5) * grownK);
      c.lineWidth = w;
      c.strokeStyle = lsc(P.ink, P.alpha);
      c.stroke(pa);
    }
    if (fresh && freshA > 0) {
      c.strokeStyle = lsc(LS_RED, 0.9 * freshA * P.alpha); c.lineWidth = Math.max(1.3, 2.2 * z);
      c.stroke(fresh);
    }
    return G;
  }

  function lsLeaves(c, P, L, z, t) {
    if (!L.n) return;
    const kind = P.leaf, A = L.a;
    if (kind === 1 || kind === 3) {
      // leaves (1) or fern pinnae (3), batched by colour
      const ps = LS_LEAF.map(() => new Path2D());
      const sz = (kind === 1 ? 5.2 : 3.4) * z * (P.leafS || 1);
      for (let j = 0; j < L.n; j++) {
        const x = A[j * 5], y = A[j * 5 + 1], h = A[j * 5 + 2], q = A[j * 5 + 3], id = A[j * 5 + 4];
        const s = E.outB(clamp(q / 2.2)) * sz * (0.7 + 0.6 * h32(id + P.seed));
        if (s <= 0.2) continue;
        const ci = (h32(id * 3 + P.seed) * 4) | 0;
        for (let k = 0; k < (kind === 1 ? 2 : 1); k++) {
          const a = h + (k ? 0.7 : -0.5) + 0.25 * Math.sin(t * 2 + id);
          const lx = x + Math.cos(a) * s * 0.9, ly = y + Math.sin(a) * s * 0.9;
          ps[(ci + k) % 4].moveTo(lx + Math.cos(a) * s, ly + Math.sin(a) * s);
          ps[(ci + k) % 4].ellipse(lx, ly, s, s * 0.42, a, 0, TAU);
        }
      }
      c.save(); c.globalAlpha = P.alpha;
      ps.forEach((p, i) => { c.fillStyle = LS_LEAF[i]; c.fill(p); });
      c.restore();
    } else if (kind === 2) {
      // blossoms: five petals and a golden heart
      const ps = LS_PETAL.map(() => new Path2D()), hearts = new Path2D(), lv = new Path2D();
      const sz = 6.5 * z * (P.leafS || 1);
      for (let j = 0; j < L.n; j++) {
        const x = A[j * 5], y = A[j * 5 + 1], h = A[j * 5 + 2], q = A[j * 5 + 3], id = A[j * 5 + 4];
        const s = E.outB(clamp(q / 2.6), 2.4) * sz * (0.75 + 0.5 * h32(id + 9));
        if (s <= 0.3) continue;
        const roll = h32(id * 7);
        if (roll > 0.82) continue;
        if (roll < 0.42) {
          const a = h + 0.9;
          lv.moveTo(x, y); lv.ellipse(x + Math.cos(a) * s * 0.9, y + Math.sin(a) * s * 0.9, s * 0.95, s * 0.38, a, 0, TAU);
          continue;
        }
        const ci = (h32(id * 5) * 3) | 0, r0 = h32(id) * TAU + t * 0.2;
        for (let k = 0; k < 5; k++) {
          const a = r0 + k * TAU / 5, px = x + Math.cos(a) * s * 0.62, py = y + Math.sin(a) * s * 0.62;
          ps[ci].moveTo(px + Math.cos(a) * s * 0.55, py + Math.sin(a) * s * 0.55);
          ps[ci].ellipse(px, py, s * 0.58, s * 0.36, a, 0, TAU);
        }
        hearts.moveTo(x + s * 0.24, y); hearts.arc(x, y, s * 0.24, 0, TAU);
      }
      c.save(); c.globalAlpha = P.alpha;
      c.fillStyle = LS_LEAF[1]; c.fill(lv);
      ps.forEach((p, i) => { c.fillStyle = LS_PETAL[i]; c.fill(p); });
      c.fillStyle = 'rgba(228,176,64,0.95)'; c.fill(hearts);
      c.restore();
    }
  }

  /* dragon curve by paper folding: generation k appends a copy of the curve rotated about its end */
  const DR_N = 11;
  const DR_T = (() => { const out = []; let t = 6.2; for (let k = 1; k <= DR_N; k++) { const d = 0.27 * Math.pow(0.872, k - 1); out.push([t, t + d * 0.82]); t += d; } return out; })();
  function dragonPts(t, P) {
    P[0] = 0; P[1] = 0; P[2] = 1; P[3] = 0;
    let cnt = 2, kk = 0, th = 0;
    for (let k = 0; k < DR_N; k++) {
      const [a, b] = DR_T[k];
      if (t < a) break;
      const f = E.ioC(clamp((t - a) / (b - a)));
      kk = k + 1; th = f;
      const ang = f * Math.PI / 2, ca = Math.cos(ang), sa = Math.sin(ang);
      const px = P[(cnt - 1) * 2], py = P[(cnt - 1) * 2 + 1];
      for (let j = cnt - 2; j >= 0; j--) {
        const dx = P[j * 2] - px, dy = P[j * 2 + 1] - py;
        P[cnt * 2] = px + dx * ca - dy * sa; P[cnt * 2 + 1] = py + dx * sa + dy * ca; cnt++;
      }
    }
    return { cnt, k: kk, f: th };
  }
  const DRAGON = (() => {
    let s = 'FX'; const strs = [s];
    for (let k = 1; k <= DR_N; k++) {
      let o = '';
      for (const ch of s) o += ch === 'X' ? 'X+YF+' : ch === 'Y' ? '-FX-Y' : ch;
      s = o; strs.push(s.slice(0, 120));
    }
    return strs;
  })();

  // camera path over the plate
  const LS_CAM = [
    [0, -1170, -250, 1.85], [0.3, -1170, -260, 1.8], [2.1, -1250, -470, 1.02], [3.05, -1240, -490, 0.96],
    [4.05, -520, -400, 1.16], [4.55, -520, -400, 1.18],
    [5.25, 610, -290, 1.36], [5.75, 610, -300, 1.36],
    [6.35, 680, -880, 1.02], [7.5, 680, -880, 1.07],
    [8.55, -40, -420, 0.68], [10, -40, -420, 0.67],
  ];
  const lsCam = t => {
    let i = 1; while (i < LS_CAM.length - 1 && LS_CAM[i][0] < t) i++;
    const a = LS_CAM[i - 1], b = LS_CAM[i], u = E.ioC(seg(t, a[0], b[0]));
    // interpolate zoom in log space so pull-backs feel continuous
    return { cx: lerp(a[1], b[1], u), cy: lerp(a[2], b[2], u), z: Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), u)) };
  };

  function lsGarden() {
    const T = lsTemplates(), P = [];
    const r = rng(1968);
    // two back rows along the horizon: pale washes, dense and overlapping
    const kinds = ['small', 'tree4', 'fern4', 'bush', 'weed', 'small', 'tree4', 'shrub'];
    [[44, 0.15, 0.08, 0.9, 82], [30, 0.3, 0.14, 1.2, 118]].forEach(([cnt, a0, a1, hs, step], row) => {
      for (let i = 0; i < cnt; i++) {
        const x = -1820 + i * step + (r() - 0.5) * step * 0.8, k = kinds[(i * 5 + row * 3 + (r() * 3 | 0)) % kinds.length];
        const hgt = hs * (k === 'tree4' ? 360 : k === 'weed' ? 200 : k === 'shrub' ? 300 : 250) * (0.6 + r() * 0.6);
        const near = Math.abs(x + 40) / 1900;
        P.push(lsPlant(T[k], { x, height: hgt, delta: 20 + r() * 8, t0: 7.2 + near * 0.75 + r() * 0.15 + row * 0.05, dt: k === 'shrub' ? 0.08 : 0.1, w: 4 + row * 2, alpha: a0 + r() * a1,
          ink: row ? [70, 92, 62] : [96, 116, 90], flip: r() < 0.5, leaf: k === 'small' || k === 'tree4' ? 1 : k === 'fern4' ? 3 : k === 'shrub' ? 2 : 0, leafS: 0.75 + row * 0.15, seed: 10 + i + row * 50, lean: (r() - 0.5) * 0.25 }));
      }
    });
    // mid row: flowering and leafy shrubs between the heroes
    const mids = [[-1600, 'small', 1], [-1420, 'shrub', 2], [-900, 'small', 2], [-760, 'tree4', 1], [-40, 'small', 2], [140, 'fern4', 3], [290, 'shrub', 2], [1180, 'shrub', 2], [1380, 'tree4', 1], [1560, 'small', 2], [-1820, 'tree4', 1]];
    mids.forEach(([x, k, lf], i) => {
      P.push(lsPlant(T[k], { x, height: (k === 'tree4' ? 480 : 310) * (0.8 + r() * 0.4), delta: 22 + r() * 5, t0: 7.3 + Math.abs(x) / 1900 * 0.6, dt: k === 'shrub' ? 0.09 : 0.12, w: 7, alpha: 0.78,
        ink: [74, 64, 42], flip: i % 2 === 0, leaf: lf, leafS: 0.95, seed: 40 + i, lean: (r() - 0.5) * 0.2 }));
    });
    const hero = lsPlant(T.tree, { x: -1150, height: 880, delta: 22, t0: 0.22, dt: 0.46, w: 30, ink: LS_BARK, leaf: 1, leafS: 1.15, seed: 1, lean: -0.03, tipDots: true });
    const fern = lsPlant(T.fern, { x: -330, height: 700, delta: 22.5, t0: 3.3, dt: 0.17, w: 7, ink: [56, 92, 48], leaf: 3, seed: 2, lean: 0.1, tipDots: true });
    const sh = [
      lsPlant(T.shrub, { x: 470, height: 460, delta: 25.7, t0: 4.45, dt: 0.13, w: 9, ink: [70, 62, 40], leaf: 2, seed: 3, lean: -0.08, tipDots: true }),
      lsPlant(T.shrub, { x: 760, height: 380, delta: 23, t0: 4.6, dt: 0.12, w: 8, ink: [70, 62, 40], leaf: 2, seed: 4, lean: 0.12, flip: true, tipDots: true }),
      lsPlant(T.small, { x: 990, height: 300, delta: 27, t0: 4.75, dt: 0.13, w: 7, ink: [70, 62, 40], leaf: 2, seed: 5, lean: 0.05, tipDots: true }),
    ];
    P.push(hero, fern, ...sh);
    // foreground grass tufts along the ground line
    for (let i = 0; i < 70; i++) {
      const x = -1800 + i * 52 + (r() - 0.5) * 40;
      P.push(lsPlant(T.weed, { x, height: 40 + r() * 70, delta: 16 + r() * 12, t0: 7.4 + Math.abs(x + 40) / 1900 * 0.7, dt: 0.07, w: 1.6, alpha: 0.7, ink: [78, 104, 56], flip: r() < 0.5, seed: 90 + i, lean: (r() - 0.5) * 0.5 }));
    }
    return { P, hero, fern, sh };
  }

  function lsPaper(W, H) {
    const cv = offscreen(W, H), g = cv.getContext('2d');
    g.fillStyle = LS_PAPER; g.fillRect(0, 0, W, H);
    const im = g.getImageData(0, 0, W, H), d = im.data, r = rng(1990);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, n = (r() - 0.5) * 9 + 6 * vnoise(x * 0.004 + y * 0.0013, 2) + 1.4 * vnoise(y * 0.31 + x * 0.002, 5);
      d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9;
    }
    g.putImageData(im, 0, 0);
    // foxing and warm edges
    const vg = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
    vg.addColorStop(0, 'rgba(160,120,60,0)'); vg.addColorStop(1, 'rgba(150,110,50,0.22)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 26; k++) {
      const x = r() * W, y = r() * H, R = 3 + r() * 16;
      const fg = g.createRadialGradient(x, y, 0, x, y, R);
      fg.addColorStop(0, 'rgba(160,110,50,0.08)'); fg.addColorStop(1, 'rgba(160,110,50,0)');
      g.fillStyle = fg; g.fillRect(x - R, y - R, 2 * R, 2 * R);
    }
    // plate frame
    g.strokeStyle = 'rgba(44,36,24,0.55)'; g.lineWidth = 1.5; g.strokeRect(46, 46, W - 92, H - 92);
    g.lineWidth = 0.75; g.strokeRect(54, 54, W - 108, H - 108);
    return cv;
  }

  // label sets per figure
  const LS_FIG = [
    { t: [0, 3.25], fig: 'Fig. 1', name: 'Tree — bracketed OL-system', rules: ['ω : X', 'p₁ : X → F[−X][+X]F[+X]−X', 'p₂ : F → FF'], delta: 'δ = 22°', key: 'hero' },
    { t: [3.25, 4.45], fig: 'Fig. 2', name: 'Fern — after ABOP fig. 1.24 f', rules: ['ω : X', 'p₁ : X → F+[[X]−X]−F[−FX]+X', 'p₂ : F → FF'], delta: 'δ = 22.5°', key: 'fern' },
    { t: [4.45, 5.9], fig: 'Fig. 3', name: 'Flowering shrubs — apices bear blossoms', rules: ['ω : X', 'p₁ : X → F[+X][−X]FX', 'p₂ : F → FF'], delta: 'δ = 25.7°', key: 'sh' },
    { t: [5.9, 7.55], fig: 'Fig. 4', name: 'Heighway dragon — edge rewriting', rules: ['ω : FX', 'p₁ : X → X+YF+', 'p₂ : Y → −FX−Y'], delta: 'δ = 90°', key: 'dragon' },
  ];

  MG.film({
    id: 'lsystem', dur: 10, poster: 9.4,
    fonts: [['600 92px "Cormorant Garamond"', 'L-SYSTEMS'], ['italic 500 30px "Cormorant Garamond"', 'Fig. Tree — bracketed'], ['400 15px "IBM Plex Mono"', 'ωpδ→[]+−₁₂·=|n'], ['500 15px "IBM Plex Mono"', 'Aa1']],
    meta: {
      family: 'E', name: 'L-systems', sub: 'Algorithmic Botany', era: '1968 —',
      origin: 'The biologist Aristid Lindenmayer introduced parallel string-rewriting systems in 1968 to model the growth of algae; read by a turtle that draws, turns and branches, they became the grammar of computer-generated plants in Prusinkiewicz and Lindenmayer\'s "The Algorithmic Beauty of Plants" (1990).',
      works: 'A. Lindenmayer, Mathematical Models for Cellular Interaction in Development (J. Theor. Biology, 1968) · P. Prusinkiewicz & A. Lindenmayer, The Algorithmic Beauty of Plants (1990) · Alvy Ray Smith, Plants, Fractals and Formal Languages (SIGGRAPH 1984) · SpeedTree (IDV) · Houdini L-system SOP',
      tech: ['Parallel string rewriting (OL-systems)', 'Turtle interpretation with a branch stack', 'Generation-tagged growth + wind sway'],
      accent: '#b0402c',
      motionDNA: 'Growth happens in generations: every bud rewrites at once, so new branches sprout simultaneously across the whole plant while older limbs thicken, sway and burst into leaf and blossom.',
      visualDNA: 'A botanical plate on warm laid paper: sepia ink branches with pipe-model taper, watercolour leaves and blossoms, a gilt dragon curve, and red-rubric figure captions with the rewriting rules set in mono.',
      transitions: 'Generation steps, camera pans across the plate, blossom pops, paper-fold unfolding, pull-back to a full garden',
      implementation: ['Canvas 2D', 'Houdini', 'Processing', 'SpeedTree'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      return { paper: null, garden: null, out: { paths: new Array(22), leaves: { a: new Float32Array(6000 * 5), n: 0 }, tips: { a: new Float32Array(1800), n: 0 }, stk: new Float64Array(4096) }, DP: new Float64Array((1 << DR_N) * 2 + 8) };
    },
    draw(c, t, W, H, st) {
      if (!st.paper) st.paper = lsPaper(W, H);
      if (!st.garden) st.garden = lsGarden();
      const cam = lsCam(t), z = cam.z, ox = W / 2 - cam.cx * z, oy = H / 2 - cam.cy * z;
      c.drawImage(st.paper, 0, 0);
      c.save();
      c.beginPath(); c.rect(56, 56, W - 112, H - 112); c.clip();
      // ground: an ink horizon with soft hatching
      const gy = oy;
      c.strokeStyle = lsc(LS_INK, 0.55); c.lineWidth = Math.max(1, 1.6 * z);
      c.beginPath();
      for (let x = -40; x <= W + 40; x += 24) {
        const wx = (x - ox) / z, yy = gy + 2.2 * z * vnoise(wx * 0.01, 3);
        x === -40 ? c.moveTo(x, yy) : c.lineTo(x, yy);
      }
      c.stroke();
      c.strokeStyle = lsc(LS_INK, 0.22); c.lineWidth = Math.max(0.6, 0.9 * z);
      c.beginPath();
      const wx0 = Math.floor(((-40 - ox) / z) / 14) * 14;
      for (let wx = wx0; wx < (W + 40 - ox) / z; wx += 14) {
        const hh = 6 + 10 * hash(wx * 0.37), sx = ox + wx * z;
        c.moveTo(sx, gy + 4 * z); c.lineTo(sx - 6 * z, gy + (4 + hh) * z);
      }
      c.stroke();
      // plants
      const out = st.out, G = st.garden;
      out.tips.n = 0; out.fork = null; out.forkOf = G.hero;
      G.P.forEach(P => {
        out.leaves.n = 0;
        const g = lsDraw(c, P, t, cam, W, H, out);
        if (g > 0 && P.leaf) lsLeaves(c, P, out.leaves, z, t);
      });
      // the axiom: ω = X waits at the root, then rewrites into the first segment
      const xa = 1 - seg(t, 0.12, 0.5);
      if (xa > 0) {
        const rx = ox + G.hero.x0 * z, ry = oy - 40 * z;
        text(c, 'X', rx, ry + (1 - xa) * -30 * z, { font: SERIF, style: 'italic', weight: 600, size: 96 * z * (1 + (1 - xa) * 0.3), align: 'center', color: lsc(LS_RED, 0.9 * xa) });
        text(c, 'ω', rx - 80 * z, ry - 40 * z, { font: SERIF, style: 'italic', weight: 500, size: 40 * z, align: 'center', color: lsc(LS_INK, 0.6 * xa) });
      }
      // δ: the branching angle, annotated at the first fork of the hero
      const da = seg(t, 0.9, 1.2) * (1 - seg(t, 2.6, 2.95));
      if (da > 0 && out.fork) {
        const [fx, fy, fh] = out.fork, R = 92 * z, dd = G.hero.delta;
        c.strokeStyle = lsc(LS_RED, 0.8 * da); c.lineWidth = 1.2;
        c.setLineDash([4, 4]);
        c.beginPath(); c.moveTo(fx, fy); c.lineTo(fx + Math.cos(fh) * R * 1.25, fy + Math.sin(fh) * R * 1.25); c.stroke();
        c.setLineDash([]);
        c.beginPath(); c.arc(fx, fy, R, fh, fh + dd); c.stroke();
        c.beginPath(); c.arc(fx, fy, R, fh - dd, fh); c.stroke();
        text(c, 'δ', fx + Math.cos(fh + dd * 1.6) * (R + 18), fy + Math.sin(fh + dd * 1.6) * (R + 18) + 6, { font: SERIF, style: 'italic', weight: 600, size: 26, align: 'center', color: lsc(LS_RED, 0.9 * da) });
        text(c, '−δ', fx + Math.cos(fh - dd * 1.6) * (R + 22), fy + Math.sin(fh - dd * 1.6) * (R + 22) + 6, { font: SERIF, style: 'italic', weight: 600, size: 26, align: 'center', color: lsc(LS_RED, 0.9 * da) });
      }
      // turtle heads at the growing tips
      if (out.tips.n) {
        c.fillStyle = lsc(LS_RED, 0.85);
        c.beginPath();
        for (let j = 0; j < out.tips.n; j++) { const x = out.tips.a[j * 2], y = out.tips.a[j * 2 + 1]; c.moveTo(x + 2.6, y); c.arc(x, y, 2.6, 0, TAU); }
        c.fill();
      }
      // dragon curve in the sky
      if (t > DR_T[0][0] - 0.25) {
        const D = dragonPts(t, st.DP), P = st.DP, cnt = D.cnt;
        let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
        const rot = -(D.k - 1 + D.f) * Math.PI / 4 + 0.0, cr = Math.cos(rot), sr = Math.sin(rot);
        for (let j = 0; j < cnt; j++) {
          const x = P[j * 2] * cr - P[j * 2 + 1] * sr, y = P[j * 2] * sr + P[j * 2 + 1] * cr;
          P[j * 2] = x; P[j * 2 + 1] = y;
          if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
        const ext = Math.max(maxX - minX, (maxY - minY) * 1.25, 1), S = 640 * lerp(1, 0.72, E.ioC(seg(t, 7.4, 8.5))) / ext;
        const mx = (minX + maxX) / 2, my = (minY + maxY) / 2, wcx = 680, wcy = -880;
        const a0 = seg(t, DR_T[0][0] - 0.25, DR_T[0][0] + 0.1);
        const half = cnt >> 1, moving = D.f < 1 && D.k > 0;
        const CH = 48;
        c.lineCap = 'round'; c.lineJoin = 'round';
        c.lineWidth = Math.max(1.1, Math.min(6, S * lerp(0.26, 0.5, seg(t, DR_T[DR_N - 1][1], DR_T[DR_N - 1][1] + 0.4))) * z);
        for (let ch = 0; ch < CH; ch++) {
          const j0 = Math.floor(ch * (cnt - 1) / CH), j1 = Math.floor((ch + 1) * (cnt - 1) / CH);
          if (j1 <= j0) continue;
          const u = ch / (CH - 1);
          const isMov = moving && j0 >= half - 1;
          const col = isMov ? [190, 62, 40] : [lerp(184, 150, u), lerp(136, 66, u), lerp(38, 34, u)];
          c.strokeStyle = lsc(col.map(v => v | 0), 0.95 * a0);
          c.beginPath();
          for (let j = j0; j <= j1; j++) {
            const X = ox + (wcx + (P[j * 2] - mx) * S) * z, Y = oy + (wcy + (P[j * 2 + 1] - my) * S) * z;
            j === j0 ? c.moveTo(X, Y) : c.lineTo(X, Y);
          }
          c.stroke();
        }
        // the fold hinge
        if (moving) {
          const j = half - 1, X = ox + (wcx + (P[j * 2] - mx) * S) * z, Y = oy + (wcy + (P[j * 2 + 1] - my) * S) * z;
          c.fillStyle = lsc(LS_RED, 0.9); c.beginPath(); c.arc(X, Y, 5, 0, TAU); c.fill();
          c.strokeStyle = lsc(LS_RED, 0.5); c.lineWidth = 1; c.beginPath(); c.arc(X, Y, 12 + 10 * D.f, 0, TAU); c.stroke();
        }
        st.drag = D;
      }
      c.restore();

      // captions — a red-rubric figure label and the live grammar
      const fa = 1 - seg(t, 7.6, 8.0);
      LS_FIG.forEach((F, fi) => {
        const a = seg(t, F.t[0] + (fi ? 0.05 : 0.15), F.t[0] + 0.4) * (1 - seg(t, F.t[1] - 0.2, F.t[1])) * (fi === 3 ? fa : 1);
        if (a <= 0) return;
        let gen, str, lenS;
        if (F.key === 'dragon') { const D = st.drag || { k: 0, f: 0 }; gen = D.k - (D.f < 1 && D.k > 0 ? 1 - D.f : 0); str = DRAGON[Math.max(0, Math.round(gen))]; lenS = null; }
        else {
          const P = F.key === 'hero' ? G.hero : F.key === 'fern' ? G.fern : G.sh[0];
          gen = lsG(P, t); const gi = Math.min(P.T.n, Math.floor(gen + 0.02)); str = P.T.strs[gi]; lenS = P.T.lens[gi];
        }
        const x0 = 104, y0 = 118, ink = lsc(LS_INK, 0.86 * a), red = lsc(LS_RED, 0.95 * a);
        text(c, F.fig, x0, y0, { font: SERIF, weight: 600, style: 'italic', size: 30, color: red });
        text(c, F.name, x0 + 86, y0, { font: SERIF, weight: 500, style: 'italic', size: 30, color: ink });
        c.fillStyle = lsc(LS_INK, 0.35 * a); c.fillRect(x0, y0 + 16, 430, 1);
        F.rules.forEach((rl, k) => text(c, rl, x0, y0 + 50 + k * 26, { font: PLEX, size: 17, color: ink }));
        text(c, F.delta, x0, y0 + 50 + 3 * 26 + 8, { font: PLEX, size: 17, color: ink });
        const gshow = Math.max(0, Math.floor(gen + 0.02));
        text(c, `n = ${gshow}`, x0 + 150, y0 + 50 + 3 * 26 + 8, { font: PLEX, weight: 500, size: 17, color: red });
        if (lenS) text(c, `|ω${['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇'][gshow] || ''}| = ${fmtN(lenS)}`, x0 + 250, y0 + 50 + 3 * 26 + 8, { font: PLEX, size: 15, color: lsc(LS_INK, 0.6 * a) });
        // the current word, as the turtle reads it
        const s = (str || '').slice(0, 64), cw = 10.2;
        c.font = `400 15px ${PLEX}`;
        const yS = H - 104;
        text(c, 'TURTLE READS', x0, yS - 26, { font: PLEX, size: 11, ls: 3, color: lsc(LS_INK, 0.5 * a) });
        const cur = Math.floor(t * 22) % Math.max(1, s.length);
        for (let k = 0; k < s.length; k++) {
          const chs = s[k], isBr = chs === '[' || chs === ']', isF = chs === 'F';
          const col = k === cur ? red : isBr ? lsc(LS_RED, 0.65 * a) : isF ? ink : lsc(LS_INK, 0.55 * a);
          text(c, chs === '-' ? '−' : chs, x0 + k * cw, yS, { font: PLEX, size: 15, color: col });
        }
        if ((str || '').length > 64) text(c, '…', x0 + 64 * cw, yS, { font: PLEX, size: 15, color: lsc(LS_INK, 0.5 * a) });
      });
      // plate number
      const pa = 1 - seg(t, 7.8, 8.3);
      if (pa > 0) {
        text(c, 'PL. XIV', W - 104, 112, { font: PLEX, size: 13, ls: 4, align: 'right', color: lsc(LS_INK, 0.6 * pa) });
        text(c, 'TURTLE  ·  F draw  + − turn  [ ] branch', W - 104, 136, { font: PLEX, size: 12, ls: 1, align: 'right', color: lsc(LS_INK, 0.45 * pa) });
      }
      // title
      const ta = E.outC(seg(t, 8.45, 9.15));
      if (ta > 0) {
        text(c, 'L-SYSTEMS', W / 2 + 12, H - 168 + (1 - ta) * 14, { font: SERIF, weight: 600, size: 92, ls: 24, align: 'center', color: lsc(LS_INK, 0.92 * ta) });
        const sa = E.outC(seg(t, 8.75, 9.4));
        c.fillStyle = lsc(LS_RED, 0.8 * sa); c.fillRect(W / 2 - 150 * sa, H - 138, 300 * sa, 1.5);
        text(c, 'The Algorithmic Beauty of Plants', W / 2, H - 100, { font: SERIF, weight: 500, style: 'italic', size: 30, align: 'center', color: lsc(LS_INK, 0.85 * sa) });
        text(c, 'ARISTID LINDENMAYER · 1968', W / 2, H - 70, { font: PLEX, size: 13, ls: 5, align: 'center', color: lsc(LS_RED, 0.85 * sa) });
      }
      grain(c, W, H, t, 0.05, 'multiply');
    },
    score(A) {
      const G = lsGarden();
      // generation steps: a plucked arpeggio climbing with each rewrite
      const pent = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
      const steps = (P, base, g0) => { for (let k = 0; k < P.T.n; k++) { const tt = P.t0 + k * P.dt; A.pluck(tt, midi(base + pent[(k + g0) % pent.length]), { g: 0.2, dur: 1.6, bright: 0.55, pan: (P.x0 / 2000), rev: 0.35 }); A.pluck(tt + 0.008, midi(base + 12 + pent[(k + g0) % pent.length]), { g: 0.07, dur: 1.0, bright: 0.8, rev: 0.4 }); } };
      steps(G.hero, 50, 0);
      steps(G.fern, 57, 2);
      G.sh.forEach((P, i) => steps(P, 62 + i * 2, i));
      // growth rustle — dense where many segments are sprouting
      for (let k = 0; k < 150; k++) {
        const tt = 0.4 + Math.pow(hash(k * 1.91), 1.0) * 5.1;
        A.noise(tt, { type: 'bandpass', f: 2200 + hash(k * 3.3) * 4000, q: 5, dur: 0.03, g: 0.018, pan: hash(k * 7.1) * 2 - 1 });
      }
      // leaves pop on the hero tree, blossoms on the shrubs
      for (let k = 0; k < 22; k++) A.pluck(2.75 + hash(k * 2.7) * 0.5, midi(74 + pent[k % 7]), { g: 0.06, dur: 0.6, bright: 0.9, decay: 0.99, pan: (hash(k) - 0.5) * 1.2, rev: 0.3 });
      for (let k = 0; k < 16; k++) A.bell(5.1 + k * 0.045 + hash(k * 5) * 0.05, midi(79 + pent[k % 8]), { g: 0.026, dur: 1.1, pan: (hash(k * 3.3) - 0.5) * 1.4, rev: 0.5 });
      // pads
      A.chord(0.1, [50, 57, 62, 66], { type: 'sine', dur: 3.2, g: 0.02, a: 1.0, hold: true, rel: 0.8, width: 1.2, rev: 0.6 });
      A.chord(3.2, [52, 59, 64, 67], { type: 'sine', dur: 2.6, g: 0.018, a: 0.6, hold: true, rel: 0.8, width: 1.2, rev: 0.6 });
      A.whoosh(3.0, 1.0, { f1: 400, f2: 1600, g: 0.05 });
      A.whoosh(4.4, 0.9, { f1: 500, f2: 1800, g: 0.05 });
      A.whoosh(5.8, 0.6, { f1: 300, f2: 2200, g: 0.06 });
      // dragon folds: an accelerating cascade of paper flicks and rising tones
      DR_T.forEach(([a, b], k) => {
        A.noise(a, { type: 'bandpass', f: 1800 + k * 300, q: 2, dur: 0.06, g: 0.06, pan: k % 2 ? 0.4 : -0.4 });
        A.osc(a, { f: midi(62 + pent[k % pent.length]), dur: 0.5, g: 0.05, type: 'triangle', rev: 0.5, pan: k % 2 ? 0.3 : -0.3 });
        A.pluck(b, midi(74 + pent[k % pent.length]), { g: 0.08, dur: 0.8, bright: 0.7, rev: 0.4 });
      });
      A.riser(6.6, 1.1, { g: 0.07, f: 110 });
      // pull-back: the garden fills in, then the title
      A.whoosh(7.45, 1.2, { f1: 2400, f2: 300, g: 0.08, swell: 0.4 });
      for (let k = 0; k < 12; k++) A.pluck(7.5 + k * 0.035 + hash(k * 9) * 0.05, midi(62 + pent[(k * 3) % 9]), { g: 0.06, dur: 0.9, bright: 0.6, pan: (k / 11 - 0.5) * 1.6, rev: 0.4 });
      A.chord(7.5, [43, 50, 55, 59, 62, 66, 71], { type: 'sine', dur: 2.4, g: 0.024, a: 0.5, hold: true, rel: 0.9, width: 1.5, rev: 0.7 });
      A.bell(8.45, midi(83), { g: 0.06, dur: 2.2 });
      A.chord(8.45, [43, 55, 62, 66, 71, 74], { type: 'triangle', dur: 1.5, g: 0.018, a: 0.05, rev: 0.7, width: 1.4 });
      A.osc(8.45, { f: midi(31), dur: 1.5, g: 0.08, a: 0.05, hold: true, rel: 0.9 });
    },
  });

  /* ================= E · Boids — Reynolds flocking ================= */
  const bumpB = (t, a, b) => Math.sin(clamp((t - a) / (b - a)) * Math.PI);
  const BN = 3000, BFPS = 30, BSUB = 2, BFR = 300, BDT = 1 / (BFPS * BSUB);
  const BT = { pred0: 2.3, pred1: 4.5, vort0: 4.3, vort1: 6.2, form0: 6.05, formL: 6.9, rel: 8.0, title: 8.65 };
  const B_R = 34, B_GX0 = -700, B_GY0 = -600, B_GW = 100, B_GH = 72;
  // predator: a falcon stooping through the flock (Catmull-Rom through keys)
  const B_PK = [[2.0, -240, 20], [2.55, 380, 200], [3.05, 920, 360], [3.3, 1170, 420], [3.62, 1450, 470], [4.05, 1820, 420], [4.6, 2350, 300]];
  function bPred(t) {
    const K = B_PK; let i = 1; while (i < K.length - 1 && K[i][0] < t) i++;
    const p0 = K[Math.max(0, i - 2)], p1 = K[i - 1], p2 = K[i], p3 = K[Math.min(K.length - 1, i + 1)];
    const u = clamp((t - p1[0]) / (p2[0] - p1[0])), u2 = u * u, u3 = u2 * u;
    const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
    return [cr(p0[1], p1[1], p2[1], p3[1]), cr(p0[2], p1[2], p2[2], p3[2])];
  }
  const bRoost = t => t < BT.rel
    ? [960 + 220 * Math.sin(t * 0.55 + 0.3), 440 + 60 * Math.sin(t * 0.83 + 1.1), 330 + 70 * Math.sin(t * 0.9), 195 + 45 * Math.sin(t * 1.3 + 2)]
    : [lerp(1180, 1540, E.ioS(seg(t, BT.rel, 9.6))), lerp(380, 270, E.ioS(seg(t, BT.rel, 9.6))), 240, 110];

  let _boids = null;
  function bSimulate() {
    if (_boids) return _boids;
    const X = new Float32Array(BN), Y = new Float32Array(BN), VX = new Float32Array(BN), VY = new Float32Array(BN);
    const AX = new Float32Array(BN), AY = new Float32Array(BN);
    const r = rng(1987);
    for (let i = 0; i < BN; i++) {
      const a = r() * TAU, rr = Math.sqrt(r());
      X[i] = 900 + Math.cos(a) * rr * 520; Y[i] = 470 + Math.sin(a) * rr * 220;
      const va = -0.2 + (r() - 0.5) * 0.8; VX[i] = Math.cos(va) * 150; VY[i] = Math.sin(va) * 150;
    }
    // word targets
    const mc = offscreen(1920, 1080), mg = mc.getContext('2d');
    mg.fillStyle = '#fff'; mg.textAlign = 'center'; mg.textBaseline = 'middle';
    mg.font = '900 360px Archivo, sans-serif';
    if (mg.letterSpacing !== undefined) mg.letterSpacing = '24px';
    mg.fillText('BOIDS', 960, 470);
    const md = mg.getImageData(0, 0, 1920, 1080).data, tp = [];
    for (let y = 0; y < 1080; y += 3) for (let x = 0; x < 1920; x += 3) if (md[(y * 1920 + x) * 4 + 3] > 140) tp.push(x + (h32(x * 7 + y) - 0.5) * 3, y + (h32(x + y * 13) - 0.5) * 3);
    const TX = new Float32Array(BN), TY = new Float32Array(BN);
    const nT = tp.length / 2;
    const tIdx = []; for (let k = 0; k < BN; k++) tIdx.push(Math.floor((k + 0.5) / BN * nT));
    let assigned = false;
    // spatial hash
    const NC = B_GW * B_GH, cs = new Int32Array(NC + 1), cnt = new Int32Array(NC), cellOf = new Int32Array(BN), order = new Int32Array(BN);
    const hist = new Float32Array(BN * 2 * (BFR + 1));
    const PRE = 200, total = PRE + BFR * BSUB;
    for (let step = 0; step <= total; step++) {
      const t = (step - PRE) * BDT;
      if (step >= PRE && (step - PRE) % BSUB === 0) {
        const f = (step - PRE) / BSUB, o = f * BN * 2;
        for (let i = 0; i < BN; i++) { hist[o + i * 2] = X[i]; hist[o + i * 2 + 1] = Y[i]; }
      }
      if (step === total) break;
      // phase weights
      const wPred = t > BT.pred0 && t < BT.pred1 ? 1 : 0;
      const wV = E.ioS(seg(t, BT.vort0, BT.vort0 + 0.7)) * (1 - E.ioS(seg(t, BT.vort1 - 0.3, BT.vort1 + 0.2)));
      const wF = E.ioS(seg(t, BT.form0, BT.formL)) * (1 - seg(t, BT.rel, BT.rel + 0.08));
      if (!assigned && t >= BT.form0) {
        assigned = true;
        const bi = Array.from({ length: BN }, (_, i) => i).sort((a, b) => (X[a] + Y[a] * 0.35) - (X[b] + Y[b] * 0.35));
        const ti = tIdx.slice().sort((a, b) => (tp[a * 2] + tp[a * 2 + 1] * 0.35) - (tp[b * 2] + tp[b * 2 + 1] * 0.35));
        for (let k = 0; k < BN; k++) { TX[bi[k]] = tp[ti[k] * 2]; TY[bi[k]] = tp[ti[k] * 2 + 1]; }
      }
      if (t >= BT.rel && t < BT.rel + BDT * 1.01) {
        for (let i = 0; i < BN; i++) {
          const dx = X[i] - 960, dy = Y[i] - 470, m = Math.hypot(dx, dy) || 1;
          VX[i] += dx / m * 120 + 170 + (h32(i) - 0.5) * 80; VY[i] += dy / m * 120 - 110 + (h32(i + 7) - 0.5) * 80;
        }
      }
      // grid build
      cnt.fill(0);
      for (let i = 0; i < BN; i++) {
        let gx = Math.floor((X[i] - B_GX0) / B_R), gy = Math.floor((Y[i] - B_GY0) / B_R);
        gx = gx < 0 ? 0 : gx >= B_GW ? B_GW - 1 : gx; gy = gy < 0 ? 0 : gy >= B_GH ? B_GH - 1 : gy;
        const c = gy * B_GW + gx; cellOf[i] = c; cnt[c]++;
      }
      cs[0] = 0; for (let c = 0; c < NC; c++) cs[c + 1] = cs[c] + cnt[c];
      cnt.fill(0);
      for (let i = 0; i < BN; i++) { const c = cellOf[i]; order[cs[c] + cnt[c]++] = i; }
      const [rcx, rcy, rrx, rry] = bRoost(Math.max(0, t));
      const [px, py] = bPred(t);
      const sepR = lerp(13, 5.5, wF), sepR2 = sepR * sepR, R2 = B_R * B_R;
      const vmax = lerp(lerp(230, 520, wV), 460, wF), vmin = lerp(110, 0, wF);
      for (let i = 0; i < BN; i++) {
        const xi = X[i], yi = Y[i], c = cellOf[i], gx = c % B_GW, gy = (c / B_GW) | 0;
        let sx = 0, sy = 0, avx = 0, avy = 0, cx = 0, cy = 0, n = 0;
        for (let oy = -1; oy <= 1 && n < 18; oy++) {
          const yy = gy + oy; if (yy < 0 || yy >= B_GH) continue;
          for (let ox = -1; ox <= 1 && n < 18; ox++) {
            const xx = gx + ox; if (xx < 0 || xx >= B_GW) continue;
            const cc = yy * B_GW + xx;
            for (let q = cs[cc]; q < cs[cc + 1]; q++) {
              const j = order[q]; if (j === i) continue;
              const dx = X[j] - xi, dy = Y[j] - yi, d2 = dx * dx + dy * dy;
              if (d2 > R2) continue;
              if (d2 < sepR2 && d2 > 1e-6) { sx -= dx / d2; sy -= dy / d2; }
              avx += VX[j]; avy += VY[j]; cx += dx; cy += dy; n++;
              if (n >= 18) break;
            }
          }
        }
        let ax = 0, ay = 0;
        const flock = (1 - wF * 0.85) * (1 - wV * 0.6);
        ax += sx * 2600; ay += sy * 2600;
        if (n) {
          ax += (avx / n - VX[i]) * 2.2 * flock; ay += (avy / n - VY[i]) * 2.2 * flock;
          ax += (cx / n) * 2.6 * flock; ay += (cy / n) * 2.6 * flock;
        }
        // roost envelope
        const ex = (xi - rcx) / rrx, ey = (yi - rcy) / rry, ed = Math.sqrt(ex * ex + ey * ey);
        const wR = (1 - wF) * (1 - wV * 0.8);
        if (ed > 0.6) { const k = (ed - 0.6) * 520 * wR * (t > BT.rel ? 1.6 : 1); ax -= ex / ed * k; ay -= ey / ed * k * 0.8; }
        ax += (rcx - xi) * 0.35 * wR; ay += (rcy - yi) * 0.35 * wR;
        // travelling density wave
        ay += 70 * Math.sin(xi * 0.0062 + yi * 0.002 - t * 3.1) * (1 - wF);
        // predator
        if (wPred) {
          const dx = xi - px, dy = yi - py, d = Math.hypot(dx, dy);
          if (d < 260 && d > 0.1) { const k = Math.pow(1 - d / 260, 1.3) * 7000; ax += dx / d * k - dy / d * k * 0.25; ay += dy / d * k + dx / d * k * 0.25; }
        }
        // vortex mill
        if (wV > 0) {
          const dx = xi - 960, dy = (yi - 470) / 0.58, rr = Math.hypot(dx, dy) || 1;
          const R0 = (190 + 170 * h32(i)) * lerp(1, 0.78, seg(t, BT.vort0 + 0.8, BT.vort1)), tx = -dy / rr, ty = dx / rr * 0.58;
          const vt = 420 * Math.pow(190 / R0, 1.3) * (0.85 + 0.3 * h32(i * 5));
          const dvx = tx * vt + (dx / rr) * (R0 - rr) * 2.4, dvy = ty * vt + (dy / rr) * 0.58 * (R0 - rr) * 2.4;
          ax += (dvx - VX[i]) * 5 * wV; ay += (dvy - VY[i]) * 5 * wV;
        }
        // formation: a critically damped spring to a letter point, with a living wobble
        if (wF > 0) {
          const ph = h32(i * 3) * TAU, tx = TX[i] + 4 * Math.sin(t * 2.3 + ph), ty = TY[i] + 4 * Math.cos(t * 1.9 + ph);
          ax += ((tx - xi) * 30 - VX[i] * 10) * wF; ay += ((ty - yi) * 30 - VY[i] * 10) * wF;
        }
        AX[i] = ax; AY[i] = ay;
      }
      for (let i = 0; i < BN; i++) {
        let vx = VX[i] + AX[i] * BDT, vy = VY[i] + AY[i] * BDT;
        const sp = Math.hypot(vx, vy) || 1;
        if (sp > vmax) { vx *= vmax / sp; vy *= vmax / sp; } else if (sp < vmin) { vx *= vmin / sp; vy *= vmin / sp; }
        VX[i] = vx; VY[i] = vy; X[i] += vx * BDT; Y[i] += vy * BDT;
      }
    }
    // per-boid depth (size / haze) and flap rate
    const Z = new Float32Array(BN), FL = new Float32Array(BN);
    for (let i = 0; i < BN; i++) { Z[i] = 0.55 + 0.8 * Math.pow(h32(i * 11 + 5), 1.3); FL[i] = 15 + 9 * h32(i * 17); }
    return (_boids = { hist, Z, FL });
  }

  function bSky(W, H) {
    const cv = offscreen(W, H), g = cv.getContext('2d');
    const HY = 870;
    const sk = g.createLinearGradient(0, 0, 0, HY);
    sk.addColorStop(0, '#141631'); sk.addColorStop(0.32, '#2c2a52'); sk.addColorStop(0.6, '#6b4467'); sk.addColorStop(0.82, '#c56b62'); sk.addColorStop(1, '#f2a35e');
    g.fillStyle = sk; g.fillRect(0, 0, W, HY);
    // sun glow on the horizon
    const sg = g.createRadialGradient(1380, HY, 0, 1380, HY, 700);
    sg.addColorStop(0, 'rgba(255,214,150,0.85)'); sg.addColorStop(0.12, 'rgba(255,170,110,0.45)'); sg.addColorStop(1, 'rgba(255,140,100,0)');
    g.fillStyle = sg; g.fillRect(0, 0, W, HY);
    // cloud streaks
    const r = rng(77);
    for (let k = 0; k < 16; k++) {
      const y = 300 + r() * 520, x = r() * W, w = 300 + r() * 900, h = 6 + r() * 16;
      const cg = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      const warm = y / HY;
      cg.addColorStop(0, 'rgba(255,170,150,0)'); cg.addColorStop(0.5, `rgba(${lerp(120, 255, warm) | 0},${lerp(90, 160, warm) | 0},${lerp(130, 130, warm) | 0},${0.12 + 0.12 * warm})`); cg.addColorStop(1, 'rgba(255,170,150,0)');
      g.fillStyle = cg; g.beginPath(); g.ellipse(x, y, w / 2, h, 0, 0, TAU); g.fill();
    }
    // far hills and a treeline
    g.fillStyle = '#3a2a40';
    g.beginPath(); g.moveTo(0, HY);
    for (let x = 0; x <= W; x += 8) g.lineTo(x, HY - 18 - 22 * (0.5 + 0.5 * vnoise(x * 0.004, 3)) - 6 * vnoise(x * 0.02, 4));
    g.lineTo(W, HY); g.closePath(); g.fill();
    // water
    const wg = g.createLinearGradient(0, HY, 0, H);
    wg.addColorStop(0, '#d98a62'); wg.addColorStop(0.35, '#6a4462'); wg.addColorStop(1, '#1a1830');
    g.fillStyle = wg; g.fillRect(0, HY, W, H - HY);
    for (let k = 0; k < 140; k++) {
      const y = HY + 4 + Math.pow(r(), 1.6) * (H - HY), x = r() * W, w = 20 + r() * 160 * (1 + (y - HY) / 100);
      const near = Math.abs(x - 1380) < 260 ? 1 : 0.35;
      g.fillStyle = `rgba(255,${190 + r() * 40 | 0},150,${(0.08 + 0.14 * r()) * near})`;
      g.fillRect(x - w / 2, y, w, 1.5 + (y - HY) / 140);
    }
    // foreground reeds
    g.strokeStyle = '#0d0a14'; g.lineCap = 'round';
    for (let k = 0; k < 220; k++) {
      const side = k % 2 ? 1 : 0, x = side ? W - Math.pow(r(), 1.8) * 520 : Math.pow(r(), 1.8) * 520;
      const hgt = 80 + r() * 240 * (1 - Math.abs(x - (side ? W : 0)) / 640), lean = (r() - 0.5) * 50 + (side ? -12 : 12);
      g.lineWidth = 1.5 + r() * 2.5;
      g.beginPath(); g.moveTo(x, H + 10); g.quadraticCurveTo(x + lean * 0.3, H - hgt * 0.5, x + lean, H - hgt); g.stroke();
      if (r() < 0.22) { g.fillStyle = '#0d0a14'; g.beginPath(); g.ellipse(x + lean, H - hgt - 14, 4, 18, Math.atan2(lean, hgt), 0, TAU); g.fill(); }
    }
    return cv;
  }

  // camera: open tight on one boid, pull back to the whole murmuration
  const B_FOCUS = 1234;
  const bCam = (t, hist) => {
    const zk = E.ioC(seg(t, 0.55, 2.35));
    const z = Math.exp(lerp(Math.log(4.6), 0, zk));
    const f = clamp(Math.round(t * BFPS), 0, BFR), o = f * BN * 2;
    const fx = hist[o + B_FOCUS * 2], fy = hist[o + B_FOCUS * 2 + 1];
    return { z, cx: lerp(fx, 960, zk), cy: lerp(fy, 540, zk) };
  };

  MG.film({
    id: 'boids', dur: 10, poster: 9.4,
    fonts: [['900 360px Archivo', 'BOIDS'], ['300 64px "Space Grotesk"', 'FLOCKING'], ['400 14px "JetBrains Mono"', 'Aa1·=×→']],
    meta: {
      family: 'E', name: 'Boids', sub: 'Flocking Simulation', era: '1987 —',
      origin: 'Craig Reynolds\' SIGGRAPH 1987 paper "Flocks, Herds, and Schools: A Distributed Behavioral Model" showed that lifelike flocks emerge when every agent steers by three local rules (separation, alignment and cohesion), with no leader and no choreography.',
      works: 'Craig Reynolds, Stanley and Stella in "Breaking the Ice" (1987) · Batman Returns, bat swarms and penguin army (1992) · The Lion King, wildebeest stampede (1994) · Robert Hodgin, Flocking studies (2007 —) · Cabbibo / three.js GPGPU birds',
      tech: ['Separation · alignment · cohesion steering', 'Spatial-hash neighbour search', 'Fixed-step deterministic cache'],
      accent: '#f2a35e',
      motionDNA: 'No bird is animated: thousands of agents each steer from their neighbours at a fixed time step, so density waves ripple, the mass tears open around a predator, mills into a vortex and condenses into form.',
      visualDNA: 'Ink-black starling silhouettes with flickering wings against a dusk gradient of indigo, rose and amber over still water and reeds, with faint motion trails.',
      transitions: 'Pull-back from a single agent, flash expansion around a predator, vortex mill, condensation into a word, release',
      implementation: ['Canvas 2D', 'Houdini', 'Processing', 'Unity DOTS'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      return { sky: null, sim: null };
    },
    draw(c, t, W, H, st) {
      if (!st.sim) st.sim = bSimulate();
      if (!st.sky) st.sky = bSky(W, H);
      const { hist, Z, FL } = st.sim;
      const cam = bCam(t, hist), z = cam.z, ox = W / 2 - cam.cx * z, oy = H / 2 - cam.cy * z;
      // backplate (parallax-lite: the sky zooms far less than the flock)
      const sz = 1 + (z - 1) * 0.08;
      c.drawImage(st.sky, W / 2 - W * sz / 2 + (960 - cam.cx) * 0.04, H / 2 - H * sz / 2 + (540 - cam.cy) * 0.04, W * sz, H * sz);
      // frame interpolation
      const fr = clamp(t * BFPS, 0, BFR), f0 = Math.floor(fr), f1 = Math.min(BFR, f0 + 1), fa = fr - f0;
      const o0 = f0 * BN * 2, o1 = f1 * BN * 2, fb = Math.max(0, f0 - 1), ob = fb * BN * 2;
      const far = lerp(1, 0.5, E.ioS(seg(t, BT.rel + 0.2, 9.8)));
      // motion trails
      const tr = Math.max(0.06, 0.32 * E.ioS(seg(t, BT.vort0, BT.vort0 + 0.6)) * (1 - seg(t, BT.formL - 0.3, BT.formL)) + 0.24 * bumpB(t, BT.pred0 + 0.6, BT.pred1 - 0.3) + 0.3 * seg(t, BT.rel, BT.rel + 0.2) * (1 - seg(t, 9.0, 9.8)));
      const TL = 7;
      if (tr > 0.02) {
        c.strokeStyle = `rgba(20,14,26,${tr * 0.5})`; c.lineWidth = Math.max(0.8, 1.1 * z);
        c.beginPath();
        for (let i = 0; i < BN; i += 1) {
          let px = ox + (hist[o0 + i * 2] + (hist[o1 + i * 2] - hist[o0 + i * 2]) * fa) * z, py = oy + (hist[o0 + i * 2 + 1] + (hist[o1 + i * 2 + 1] - hist[o0 + i * 2 + 1]) * fa) * z;
          c.moveTo(px, py);
          for (let k = 1; k <= TL; k++) {
            const ok = Math.max(0, f0 - k) * BN * 2;
            const qx = ox + hist[ok + i * 2] * z, qy = oy + hist[ok + i * 2 + 1] * z;
            if (Math.abs(qx - px) > 120 * z) break;
            c.lineTo(qx, qy); px = qx; py = qy;
          }
        }
        c.stroke();
      }
      // birds: three depth layers, far ones hazier
      const layers = [[0.55, 0.85, 'rgba(58,40,66,0.75)'], [0.85, 1.1, 'rgba(30,20,38,0.88)'], [1.1, 1.4, 'rgba(12,8,18,0.96)']];
      const sizeK = Math.pow(z, 0.82) * far;
      layers.forEach(([za, zb, col]) => {
        c.fillStyle = col;
        c.beginPath();
        for (let i = 0; i < BN; i++) {
          const zi = Z[i]; if (zi < za || zi >= zb) continue;
          const x0 = hist[o0 + i * 2], y0 = hist[o0 + i * 2 + 1];
          const x = x0 + (hist[o1 + i * 2] - x0) * fa, y = y0 + (hist[o1 + i * 2 + 1] - y0) * fa;
          const sx = ox + x * z, sy = oy + y * z;
          if (sx < -40 || sx > W + 40 || sy < -40 || sy > H + 40) continue;
          let hx = hist[o1 + i * 2] - hist[ob + i * 2], hy = hist[o1 + i * 2 + 1] - hist[ob + i * 2 + 1];
          const hm = Math.hypot(hx, hy) || 1; hx /= hm; hy /= hm;
          const s = 4.3 * zi * sizeK * (1 + 0.15 * E.ioS(seg(t, BT.form0, BT.formL)) * (1 - seg(t, BT.rel, BT.rel + 0.5))), fl = Math.sin(t * FL[i] + i * 1.7);
          const span = s * (0.55 + 0.6 * Math.abs(fl)), back = s * (0.25 + 0.45 * fl);
          const nx = -hy, ny = hx;
          // body
          c.moveTo(sx + hx * s * 0.9, sy + hy * s * 0.9);
          c.lineTo(sx - hx * back + nx * span, sy - hy * back + ny * span);
          c.lineTo(sx - hx * s * 0.25, sy - hy * s * 0.25);
          c.lineTo(sx - hx * back - nx * span, sy - hy * back - ny * span);
          c.closePath();
          c.moveTo(sx - hx * s * 0.2, sy - hy * s * 0.2);
          c.lineTo(sx - hx * s * 0.95 + nx * s * 0.22, sy - hy * s * 0.95 + ny * s * 0.22);
          c.lineTo(sx - hx * s * 0.95 - nx * s * 0.22, sy - hy * s * 0.95 - ny * s * 0.22);
          c.closePath();
        }
        c.fill();
      });
      // predator
      if (t > B_PK[0][0] && t < B_PK[B_PK.length - 1][0]) {
        const [px, py] = bPred(t), [qx, qy] = bPred(t - 0.03);
        let hx = px - qx, hy = py - qy; const hm = Math.hypot(hx, hy) || 1; hx /= hm; hy /= hm;
        const sx = ox + px * z, sy = oy + py * z, s = 21 * z, nx = -hy, ny = hx, fl = Math.sin(t * 9);
        const span = s * (1.1 + 0.35 * fl), sw = s * (0.45 + 0.3 * fl);
        c.fillStyle = 'rgba(8,5,12,0.98)';
        c.beginPath();
        c.moveTo(sx + hx * s * 1.1, sy + hy * s * 1.1);
        c.quadraticCurveTo(sx + nx * span * 0.4, sy + ny * span * 0.4, sx - hx * sw + nx * span, sy - hy * sw + ny * span);
        c.lineTo(sx - hx * s * 0.3, sy - hy * s * 0.3);
        c.lineTo(sx - hx * sw - nx * span, sy - hy * sw - ny * span);
        c.quadraticCurveTo(sx - nx * span * 0.4, sy - ny * span * 0.4, sx + hx * s * 1.1, sy + hy * s * 1.1);
        c.moveTo(sx - hx * s * 0.2, sy - hy * s * 0.2);
        c.lineTo(sx - hx * s * 1.2 + nx * s * 0.3, sy - hy * s * 1.2 + ny * s * 0.3);
        c.lineTo(sx - hx * s * 1.2 - nx * s * 0.3, sy - hy * s * 1.2 - ny * s * 0.3);
        c.closePath(); c.fill();
        // threat radius
        const pa = 0.35 * bumpB(t, 2.6, 4.0);
        if (pa > 0.01) {
          c.strokeStyle = `rgba(255,190,140,${pa})`; c.lineWidth = 1; c.setLineDash([3, 6]);
          c.beginPath(); c.arc(sx, sy, 260 * z, 0, TAU); c.stroke(); c.setLineDash([]);
          text(c, 'PREDATOR · FLEE r = 260', sx + 270 * z * 0.72 + 8, sy - 270 * z * 0.72, { font: MONO, size: 12, ls: 2, color: `rgba(255,214,180,${pa * 2})` });
        }
      }
      // the three rules, drawn on one boid while we are close
      const ra = 1 - seg(t, 1.25, 1.8);
      if (ra > 0) {
        const i0 = B_FOCUS, fx = hist[o0 + i0 * 2] + (hist[o1 + i0 * 2] - hist[o0 + i0 * 2]) * fa, fy = hist[o0 + i0 * 2 + 1] + (hist[o1 + i0 * 2 + 1] - hist[o0 + i0 * 2 + 1]) * fa;
        let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, n = 0;
        const nb = [];
        for (let j = 0; j < BN; j++) {
          if (j === i0) continue;
          const x = hist[o0 + j * 2], y = hist[o0 + j * 2 + 1], dx = x - fx, dy = y - fy, d2 = dx * dx + dy * dy;
          if (d2 > B_R * B_R) continue;
          if (d2 < 169) { sx -= dx / Math.sqrt(d2 + 1); sy -= dy / Math.sqrt(d2 + 1); }
          ax += hist[o1 + j * 2] - hist[ob + j * 2]; ay += hist[o1 + j * 2 + 1] - hist[ob + j * 2 + 1];
          cx += dx; cy += dy; n++; nb.push(x, y);
        }
        const X = ox + fx * z, Y = oy + fy * z;
        const a1 = ra * seg(t, 0.12, 0.45);
        c.save();
        const hg = c.createRadialGradient(X, Y, 0, X, Y, 40);
        hg.addColorStop(0, `rgba(255,236,200,${0.3 * a1})`); hg.addColorStop(1, 'rgba(255,236,200,0)');
        c.fillStyle = hg; c.fillRect(X - 40, Y - 40, 80, 80);
        c.strokeStyle = `rgba(255,236,210,${0.55 * a1})`; c.lineWidth = 1.2; c.setLineDash([5, 6]);
        c.beginPath(); c.arc(X, Y, B_R * z, 0, TAU); c.stroke();
        c.strokeStyle = `rgba(255,140,110,${0.6 * a1})`;
        c.beginPath(); c.arc(X, Y, 13 * z, 0, TAU); c.stroke(); c.setLineDash([]);
        c.strokeStyle = `rgba(255,236,210,${0.16 * a1})`; c.lineWidth = 0.8;
        c.beginPath();
        for (let k = 0; k < nb.length; k += 2) { c.moveTo(X, Y); c.lineTo(ox + nb[k] * z, oy + nb[k + 1] * z); }
        c.stroke();
        const arrow = (dx, dy, len, col, label, a, lo) => {
          const m = Math.hypot(dx, dy) || 1, ux = dx / m, uy = dy / m, ex = X + ux * len, ey = Y + uy * len;
          c.strokeStyle = col.replace('A', a); c.fillStyle = col.replace('A', a); c.lineWidth = 2.5;
          c.beginPath(); c.moveTo(X, Y); c.lineTo(ex, ey); c.stroke();
          c.beginPath(); c.moveTo(ex + ux * 10, ey + uy * 10); c.lineTo(ex - uy * 6, ey + ux * 6); c.lineTo(ex + uy * 6, ey - ux * 6); c.closePath(); c.fill();
          text(c, label, ex + ux * 22 + (lo || 0), ey + uy * 22 + 5, { font: MONO, size: 15, ls: 2, align: ux < -0.2 ? 'right' : ux > 0.2 ? 'left' : 'center', color: col.replace('A', a) });
        };
        const s1 = ra * seg(t, 0.25, 0.5), s2 = ra * seg(t, 0.45, 0.7), s3 = ra * seg(t, 0.65, 0.9);
        if (n) {
          arrow(sx || 0.01, sy || -1, 120 * s1 + 1, 'rgba(255,128,104,A)', 'SEPARATION', s1);
          arrow(ax / n, ay / n, 150 * s2 + 1, 'rgba(255,206,120,A)', 'ALIGNMENT', s2);
          arrow(cx / n, cy / n, 120 * s3 + 1, 'rgba(150,214,255,A)', 'COHESION', s3);
        }
        text(c, `${n} NEIGHBOURS WITHIN r`, X, Y + B_R * z + 30, { font: MONO, size: 13, ls: 3, align: 'center', color: `rgba(255,236,210,${0.7 * a1})` });
        c.restore();
      }
      vignette(c, W, H, 0.5, '10,6,20');
      // HUD
      const hv = seg(t, 1.6, 2.1) * (1 - seg(t, BT.title - 0.4, BT.title)) * 0.75;
      if (hv > 0) {
        const col = `rgba(255,240,226,${hv})`, dim = `rgba(255,240,226,${hv * 0.55})`;
        text(c, 'BOIDS', 80, 92, { font: MONO, size: 20, weight: 800, ls: 6, color: col });
        text(c, 'SEPARATION · ALIGNMENT · COHESION', 80, 118, { font: MONO, size: 12, ls: 3, color: dim });
        text(c, `N = ${fmtN(BN)}   ·   r = ${B_R} px   ·   dt = 1/${BFPS * BSUB}`, W - 80, 92, { font: MONO, size: 14, ls: 1, align: 'right', color: col });
        text(c, `STEP ${String(Math.round(t * BFPS * BSUB)).padStart(4, '0')}`, W - 80, 118, { font: MONO, size: 12, ls: 3, align: 'right', color: dim });
        const PH = [['MURMURATION', 0], ['PREDATOR', BT.pred0 + 0.3], ['VORTEX', BT.vort0 + 0.2], ['FORMATION', BT.form0], ['RELEASE', BT.rel]];
        let x = 80;
        PH.forEach(([nm, a], k) => {
          const on = t >= a && (k === PH.length - 1 || t < PH[k + 1][1]);
          text(c, nm, x, H - 70, { font: MONO, size: 13, ls: 3, color: on ? `rgba(255,214,170,${Math.min(1, hv * 1.4)})` : dim });
          x += nm.length * 10.6 + 56;
        });
      }
      // title
      const ta = E.outC(seg(t, BT.title, BT.title + 0.7));
      if (ta > 0) {
        c.save();
        c.shadowColor = 'rgba(20,10,30,0.5)'; c.shadowBlur = 20;
        text(c, 'FLOCKING', 160, 640 + (1 - ta) * 14, { font: GROT, weight: 300, size: 88, ls: 26, color: `rgba(255,244,232,${ta})` });
        c.restore();
        const sa = E.outC(seg(t, BT.title + 0.3, BT.title + 1.0));
        c.fillStyle = `rgba(255,190,130,${0.8 * sa})`; c.fillRect(164, 672, 280 * sa, 1.5);
        text(c, 'CRAIG REYNOLDS  ·  BOIDS  ·  SIGGRAPH 1987', 164, 708, { font: MONO, size: 14, ls: 4, color: `rgba(255,226,200,${0.85 * sa})` });
      }
      grain(c, W, H, t, 0.05, 'overlay');
    },
    score(A) {
      // dusk air
      A.noise(0, { type: 'lowpass', f: 500, dur: 10, g: 0.05, a: 1.2, hold: true, rel: 1.0 });
      A.noise(0, { type: 'bandpass', f: 900, f2: 1600, sweep: 9, q: 0.7, dur: 9.8, g: 0.025, swell: 0.5, pan: -0.3 });
      A.chord(0.0, [50, 57, 62, 64, 69], { type: 'sine', dur: 4.4, g: 0.016, a: 1.6, hold: true, rel: 1.0, width: 1.4, rev: 0.6, vib: [0.25, 1.4] });
      // the three rules arrive one by one
      [[0.27, 76], [0.47, 79], [0.67, 83]].forEach(([tt, m], i) => { A.bell(tt, midi(m), { g: 0.05, dur: 1.4, pan: (i - 1) * 0.4, rev: 0.5 }); });
      A.whoosh(0.6, 1.8, { f1: 200, f2: 1400, g: 0.07, swell: 0.7 });
      // wings: a granular flutter whose density follows the action
      const dens = t => 18 + 40 * bumpB(t, BT.pred0 + 0.7, BT.pred0 + 1.9) + 30 * bumpB(t, BT.vort0, BT.vort1) + 55 * bumpB(t, BT.rel, BT.rel + 0.9);
      let k = 0;
      for (let tt = 0.3; tt < 9.6; k++) {
        tt += 1 / dens(tt) * (0.5 + hash(k * 1.3));
        A.noise(tt, { type: 'bandpass', f: 1400 + hash(k * 2.1) * 2600, q: 3, dur: 0.018 + hash(k * 3.9) * 0.02, g: 0.012 + 0.012 * hash(k * 5.7), pan: hash(k * 7.3) * 2 - 1 });
      }
      // murmuration swells
      [1.0, 2.0].forEach((tt, i) => A.noise(tt, { type: 'bandpass', f: 500, f2: 1800, sweep: 1.2, q: 1.2, dur: 1.4, g: 0.045, swell: 0.55, pan: i ? 0.4 : -0.4, rev: 0.3 }));
      // predator: stoop, call, flash expansion
      A.noise(2.45, { type: 'bandpass', f: 600, f2: 4200, sweep: 0.75, q: 2, dur: 0.85, g: 0.11, swell: 0.85, pan: -0.5, rev: 0.3 });
      A.osc(2.5, { type: 'triangle', f: 1900, f2: 1500, glide: 0.12, dur: 0.14, g: 0.03, rev: 0.4, pan: -0.4 });
      A.osc(2.68, { type: 'triangle', f: 2000, f2: 1550, glide: 0.12, dur: 0.14, g: 0.026, rev: 0.4, pan: -0.3 });
      A.impact(3.22, 0.42);
      A.noise(3.2, { type: 'highpass', f: 1800, dur: 1.0, g: 0.08, rev: 0.5 });
      A.osc(3.2, { f: midi(38), dur: 1.4, g: 0.08, a: 0.01 });
      A.chord(3.22, [49, 56, 61, 63, 68], { type: 'triangle', dur: 1.3, g: 0.016, a: 0.01, rev: 0.6, width: 1.3 });
      A.whoosh(3.4, 0.9, { f1: 3500, f2: 400, g: 0.08, pan: 0.6 });
      // vortex: a rotating wash circling the stereo field
      for (let i = 0; i < 10; i++) A.whoosh(BT.vort0 + 0.2 + i * 0.18, 0.5, { f1: 400 + i * 80, f2: 1600 + i * 120, g: 0.04 + i * 0.003, pan: Math.sin(i * 1.3) * 0.8, swell: 0.5 });
      A.riser(BT.vort0 + 0.3, 1.6, { g: 0.08, f: 55 });
      A.osc(BT.vort0, { type: 'sawtooth', f: midi(38), dur: 2.0, g: 0.025, a: 0.8, lp: 200, lp2: 1200, lpT: 1.8, hold: true, rel: 0.3 });
      A.chord(BT.vort0 + 0.2, [45, 52, 57, 60, 64], { type: 'sine', dur: 1.9, g: 0.018, a: 0.6, hold: true, rel: 0.4, width: 1.4, rev: 0.6 });
      // formation locks
      A.whoosh(BT.form0, 0.75, { f1: 2400, f2: 300, g: 0.08, swell: 0.4 });
      A.impact(BT.formL, 0.5);
      A.chord(BT.formL, [38, 45, 50, 57, 62, 66, 69], { type: 'triangle', dur: 1.4, g: 0.022, a: 0.02, rev: 0.7, width: 1.5 });
      A.bell(BT.formL, midi(86), { g: 0.06, dur: 2.0 });
      [74, 78, 81, 85].forEach((m, i) => A.bell(BT.formL + 0.25 + i * 0.14, midi(m), { g: 0.026, dur: 1.2, pan: (i / 3 - 0.5), rev: 0.6 }));
      // release
      A.noise(BT.rel, { type: 'bandpass', f: 800, f2: 3000, sweep: 0.5, q: 1, dur: 1.2, g: 0.1, swell: 0.12, rev: 0.4 });
      A.whoosh(BT.rel, 1.2, { f1: 300, f2: 2600, g: 0.1, swell: 0.25, pan: 0.5 });
      A.chord(BT.title - 0.1, [38, 50, 57, 62, 64, 69], { type: 'sine', dur: 1.45, g: 0.026, a: 0.4, hold: true, rel: 0.9, width: 1.5, rev: 0.7 });
      A.osc(BT.title - 0.1, { f: midi(26), dur: 1.4, g: 0.07, a: 0.3, hold: true, rel: 0.9 });
      A.bell(BT.title, midi(81), { g: 0.04, dur: 1.4 });
    },
  });
})();
