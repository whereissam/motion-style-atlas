/* batch c1 — Family E: Experimental & Generative.
   Reaction–diffusion (Gray-Scott), strange attractors (Lorenz / Clifford / De Jong), Conway's Game of Life.
   All three are real simulations run deterministically; draw(t) only ever reads cached or recomputed state for t. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;500;700&display=block');
  const MONO = '"JetBrains Mono", monospace';
  const GROT = '"Space Grotesk", Archivo, sans-serif';
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mix3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const fmtN = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const h32 = i => { let n = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  // integrate a rate curve (units per second) into a lookup table: cumulative count at t
  function integrate(keys, dur, res = 600) {
    const n = Math.round(dur * res), cum = new Float64Array(n + 2);
    for (let j = 1; j <= n + 1; j++) cum[j] = cum[j - 1] + kf((j - 0.5) / res, keys) / res;
    return t => { const x = clamp(t, 0, dur) * res, j = Math.floor(x); return lerp(cum[j], cum[Math.min(j + 1, n + 1)], x - j); };
  }

  /* ================= E1 Reaction–Diffusion — Gray-Scott ================= */
  const RW = 320, RH = 180, RN = RW * RH, RFPS = 30, RFR = 300;
  const RD_REG = { coral: [0.038, 0.0605], spots: [0.035, 0.0625], maze: [0.029, 0.057], kill: [0.02, 0.08] };
  const RD_T = { spots0: 3.15, spots1: 5.0, word0: 6.0, word1: 7.0, hold: 8.4 };
  const RD_SPS = [[0, 420], [1.5, 650], [3.4, 700], [6.0, 700], [7.9, 650], [8.5, 70], [10, 40]];
  const rdSteps = integrate(RD_SPS, 10);
  const RD_SEEDS = (() => {
    const r = rng(1952), out = [{ t: 0.08, x: 148, y: 96 }], cand = [];
    for (let gy = 0; gy < 3; gy++) for (let gx = 0; gx < 5; gx++) {
      const x = (gx + 0.2 + r() * 0.6) * 64, y = (gy + 0.2 + r() * 0.6) * 60, d = Math.hypot(x - 148, y - 96);
      if (d > 42) cand.push({ x, y, d });
    }
    cand.sort((a, b) => a.d - b.d);
    cand.forEach((c, k) => out.push({ t: 0.6 + k * 0.085 + r() * 0.03, x: c.x, y: c.y }));
    return out;
  })();
  const rdCam = t => {
    const z = Math.exp(kf(t, [[0, Math.log(2.6)], [0.9, Math.log(2.25)], [3.3, 0, E.ioC], [5.8, Math.log(1.07), E.ioS], [7.4, 0, E.ioC]]));
    const k = E.ioC(seg(t, 0.6, 3.3));
    return { z, cx: lerp(148, RW / 2, k) + 3 * Math.sin(t * 0.4), cy: lerp(96, RH / 2, k) };
  };
  const rdWordAmt = t => E.ioS(seg(t, RD_T.word0, RD_T.word1));

  function rdSimulate() {
    let U = new Float32Array(RN).fill(1), V = new Float32Array(RN), U2 = new Float32Array(RN), V2 = new Float32Array(RN);
    const F = new Float32Array(RN), K = new Float32Array(RN);
    const XM = new Int32Array(RW), XP = new Int32Array(RW);
    for (let x = 0; x < RW; x++) { XM[x] = (x - 1 + RW) % RW; XP[x] = (x + 1) % RW; }
    // word mask, softened
    const mc = offscreen(RW, RH), mg = mc.getContext('2d');
    mg.fillStyle = '#fff'; mg.textAlign = 'center'; mg.textBaseline = 'middle';
    let fs = 150; mg.font = `900 ${fs}px Archivo, sans-serif`;
    const wd = mg.measureText('TURING').width; if (wd > 296) { fs *= 296 / wd; mg.font = `900 ${fs}px Archivo, sans-serif`; }
    if (mg.letterSpacing !== undefined) mg.letterSpacing = '0px';
    mg.filter = 'blur(1px)'; mg.translate(RW / 2, RH / 2 - 4); mg.scale(1, 1.4); mg.fillText('TURING', 0, 0);
    const md = mg.getImageData(0, 0, RW, RH).data, M = new Float32Array(RN);
    for (let i = 0; i < RN; i++) M[i] = md[i * 4 + 3] / 255;
    // dissolve travels from the frame edge inwards; regime front wobbles
    const DR = new Float32Array(RN), NOFF = new Float32Array(RH);
    for (let y = 0; y < RH; y++) NOFF[y] = 20 * vnoise(y * 0.055, 3) + 9 * vnoise(y * 0.17, 9);
    for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
      const dx = (x - RW / 2) / (RW / 2), dy = (y - RH / 2) / (RH / 2);
      DR[y * RW + x] = clamp(Math.hypot(dx, dy * 0.8) / 1.25) + 0.08 * vnoise(x * 0.07 + y * 0.05, 4);
    }
    const r = rng(1972);
    for (let i = 0; i < RN; i++) { V[i] = 0; U[i] = 1 - r() * 0.02; }
    const frames = [];
    let step = 0, si = 0;
    const seedSteps = RD_SEEDS.map(s => Math.round(rdSteps(s.t)));
    const setParams = t => {
      const fpos = lerp(-70, RW + 70, E.ioS(seg(t, RD_T.spots0, RD_T.spots1)));
      for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
        const i = y * RW + x;
        const ws = sstep(fpos + 18, fpos - 18, x + NOFF[y]);
        let f = lerp(RD_REG.coral[0], RD_REG.spots[0], ws), k = lerp(RD_REG.coral[1], RD_REG.spots[1], ws);
        const ww = E.ioS(seg(t, RD_T.word0 + (1 - DR[i]) * 0.55, RD_T.word0 + (1 - DR[i]) * 0.55 + 0.5));
        if (ww > 0) {
          const m = M[i];
          const tf = lerp(RD_REG.kill[0], RD_REG.maze[0], m), tk = lerp(RD_REG.kill[1], RD_REG.maze[1], m);
          const wm = m > 0.5 ? E.ioS(seg(t, RD_T.word0 - 0.3, RD_T.word0 + 0.3)) : ww;
          f = lerp(f, tf, wm); k = lerp(k, tk, wm);
        }
        F[i] = f; K[i] = k;
      }
    };
    let inoc = false;
    for (let fr = 0; fr <= RFR; fr++) {
      const t = fr / RFPS, target = Math.round(rdSteps(t));
      setParams(t);
      if (!inoc && t >= RD_T.word0 - 0.2) {
        // inoculate the letters so the labyrinth always has nuclei to grow from
        inoc = true;
        for (let i = 0; i < RN; i++) if (M[i] > 0.6 && r() < 0.06) { V[i] = Math.max(V[i], 0.3 + r() * 0.2); U[i] = Math.min(U[i], 0.4); }
      }
      while (step < target) {
        while (si < RD_SEEDS.length && seedSteps[si] <= step) {
          const s = RD_SEEDS[si++], R = si === 1 ? 8 : 6;
          for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
            if (dx * dx + dy * dy > R * R * (0.5 + r())) continue;
            const x = ((Math.round(s.x) + dx) % RW + RW) % RW, y = ((Math.round(s.y) + dy) % RH + RH) % RH, i = y * RW + x;
            U[i] = 0.3; V[i] = 0.6 * r();
          }
        }
        for (let y = 0; y < RH; y++) {
          const y0 = y * RW, ym = ((y - 1 + RH) % RH) * RW, yp = ((y + 1) % RH) * RW;
          for (let x = 0; x < RW; x++) {
            const xm = XM[x], xp = XP[x], i = y0 + x, u = U[i], v = V[i];
            const lu = 0.2 * (U[y0 + xm] + U[y0 + xp] + U[ym + x] + U[yp + x]) + 0.05 * (U[ym + xm] + U[ym + xp] + U[yp + xm] + U[yp + xp]) - u;
            const lv = 0.2 * (V[y0 + xm] + V[y0 + xp] + V[ym + x] + V[yp + x]) + 0.05 * (V[ym + xm] + V[ym + xp] + V[yp + xm] + V[yp + xp]) - v;
            const uvv = u * v * v;
            U2[i] = u + (lu - uvv + F[i] * (1 - u));
            V2[i] = v + (0.5 * lv + uvv - (F[i] + K[i]) * v);
          }
        }
        let tmp = U; U = U2; U2 = tmp; tmp = V; V = V2; V2 = tmp;
        step++;
      }
      const q = new Uint8Array(RN);
      for (let i = 0; i < RN; i++) q[i] = Math.min(255, V[i] * 560);
      frames.push(q);
    }
    return { frames, M };
  }

  // palettes: bg, base, highlight, rim
  const RD_PAL = {
    coral: [[14, 6, 16], [255, 86, 62], [255, 226, 196], [255, 150, 92]],
    spots: [[3, 12, 20], [34, 206, 196], [214, 255, 246], [90, 150, 255]],
    word: [[7, 6, 9], [214, 178, 128], [255, 244, 222], [255, 128, 48]],
  };

  function rdRender(st, t) {
    const { frames } = st.rd, OW = 960, OH = 540;
    const fr = clamp(t * RFPS, 0, RFR), f0 = Math.floor(fr), f1 = Math.min(RFR, f0 + 1), fa = fr - f0;
    const A = frames[f0], B = frames[f1], Vf = st.Vf, GX = st.GX, GY = st.GY, WS = st.WS;
    for (let i = 0; i < RN; i++) Vf[i] = (A[i] + (B[i] - A[i]) * fa) * (1 / 560);
    for (let y = 0; y < RH; y++) {
      const y0 = y * RW, ym = ((y - 1 + RH) % RH) * RW, yp = ((y + 1) % RH) * RW;
      for (let x = 0; x < RW; x++) {
        const xm = (x - 1 + RW) % RW, xp = (x + 1) % RW;
        GX[y0 + x] = (Vf[y0 + xp] - Vf[y0 + xm]) * 0.5;
        GY[y0 + x] = (Vf[yp + x] - Vf[ym + x]) * 0.5;
      }
    }
    const fpos = lerp(-70, RW + 70, E.ioS(seg(t, RD_T.spots0, RD_T.spots1)));
    for (let y = 0; y < RH; y++) {
      const nf = 20 * vnoise(y * 0.055, 3) + 9 * vnoise(y * 0.17, 9);
      for (let x = 0; x < RW; x++) WS[y * RW + x] = sstep(fpos + 18, fpos - 18, x + nf);
    }
    // palette LUT over the spots weight, then blended to the word palette by time
    const ww = rdWordAmt(t), LUT = st.LUT;
    for (let l = 0; l <= 32; l++) {
      const k = l / 32;
      for (let p = 0; p < 4; p++) for (let ch = 0; ch < 3; ch++) {
        const v = lerp(RD_PAL.coral[p][ch], RD_PAL.spots[p][ch], k);
        LUT[l * 12 + p * 3 + ch] = lerp(v, RD_PAL.word[p][ch], ww);
      }
    }
    const cam = rdCam(t), ppc = (OW / RW) * cam.z;
    const X0 = st.X0, X1 = st.X1, FX = st.FX, Y0 = st.Y0, Y1 = st.Y1, FY = st.FY;
    for (let px = 0; px < OW; px++) {
      const g = cam.cx + (px + 0.5 - OW / 2) / ppc - 0.5, ix = Math.floor(g);
      X0[px] = ((ix % RW) + RW) % RW; X1[px] = (X0[px] + 1) % RW; FX[px] = g - ix;
    }
    for (let py = 0; py < OH; py++) {
      const g = cam.cy + (py + 0.5 - OH / 2) / ppc - 0.5, iy = Math.floor(g);
      const a = ((iy % RH) + RH) % RH; Y0[py] = a * RW; Y1[py] = ((a + 1) % RH) * RW; FY[py] = g - iy;
    }
    const data = st.img.data, LO = 0.11, HI = 0.27, KN = 13;
    const Lx = -0.48, Ly = -0.58, Lz = 0.66, Hx = Lx * 0.6, Hy = Ly * 0.6, Hz0 = (Lz + 1);
    const hn = 1 / Math.hypot(Hx, Hy, Hz0), HX = Hx * hn, HY = Hy * hn, HZ = Hz0 * hn;
    let o = 0;
    for (let py = 0; py < OH; py++) {
      const ra = Y0[py], rb = Y1[py], fy = FY[py], gy1 = 1 - fy;
      const vgy = (py / OH - 0.5);
      for (let px = 0; px < OW; px++) {
        const xa = X0[px], xb = X1[px], fx = FX[px], gx1 = 1 - fx;
        const i00 = ra + xa, i01 = ra + xb, i10 = rb + xa, i11 = rb + xb;
        const w00 = gx1 * gy1, w01 = fx * gy1, w10 = gx1 * fy, w11 = fx * fy;
        const v = Vf[i00] * w00 + Vf[i01] * w01 + Vf[i10] * w10 + Vf[i11] * w11;
        let s = (v - LO) / (HI - LO); s = s < 0 ? 0 : s > 1 ? 1 : s * s * (3 - 2 * s);
        const gx = GX[i00] * w00 + GX[i01] * w01 + GX[i10] * w10 + GX[i11] * w11;
        const gy = GY[i00] * w00 + GY[i01] * w01 + GY[i10] * w10 + GY[i11] * w11;
        const nx = -gx * KN, ny = -gy * KN, inv = 1 / Math.sqrt(nx * nx + ny * ny + 1);
        let dif = (nx * Lx + ny * Ly + Lz) * inv; if (dif < 0) dif = 0;
        let hd = (nx * HX + ny * HY + HZ) * inv; if (hd < 0) hd = 0;
        hd *= hd; hd *= hd; hd *= hd; hd *= hd; hd *= hd;
        const l = ((WS[i00] * 32) | 0) * 12;
        const rim = 4 * s * (1 - s), sh = s * (0.22 + 0.82 * dif), sp = hd * s * 0.8, bgk = (1 - s) * (1 - 0.35 * (vgy * vgy * 4));
        data[o] = LUT[l] * bgk + LUT[l + 3] * sh + LUT[l + 6] * sp + LUT[l + 9] * rim * 0.55;
        data[o + 1] = LUT[l + 1] * bgk + LUT[l + 4] * sh + LUT[l + 7] * sp + LUT[l + 10] * rim * 0.55;
        data[o + 2] = LUT[l + 2] * bgk + LUT[l + 5] * sh + LUT[l + 8] * sp + LUT[l + 11] * rim * 0.55;
        data[o + 3] = 255;
        o += 4;
      }
    }
    st.ig.putImageData(st.img, 0, 0);
  }

  // Gray-Scott map inset: k on x, F on y, saddle-node boundary k = √F/2 − F
  function fkInset(c, x0, y0, w, h, cur, trail, a) {
    if (a <= 0) return;
    const kx = k => x0 + (k - 0.05) / (0.07 - 0.05) * w, fy = F => y0 + h - (F - 0.01) / 0.05 * h;
    c.save();
    c.globalAlpha = a;
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 1;
    c.strokeRect(x0 + 0.5, y0 + 0.5, w, h);
    c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
    c.beginPath();
    for (let j = 0; j <= 80; j++) { const F = 0.01 + j / 80 * 0.05, k = Math.sqrt(F) / 2 - F; j ? c.lineTo(kx(k), fy(F)) : c.moveTo(kx(k), fy(F)); }
    c.strokeStyle = 'rgba(255,255,255,0.42)'; c.setLineDash([3, 4]); c.stroke(); c.setLineDash([]);
    c.restore();
    [['CORAL', RD_REG.coral, 1, -4], ['SPOTS', RD_REG.spots, 1, 12], ['MAZE', RD_REG.maze, -1, -6]].forEach(([nm, [F, k], side, dy]) => {
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(kx(k), fy(F), 2.2, 0, TAU); c.fill();
      text(c, nm, kx(k) + 7 * side, fy(F) + dy, { font: MONO, size: 10, ls: 1.5, align: side > 0 ? 'left' : 'right', color: 'rgba(255,255,255,0.5)' });
    });
    c.beginPath();
    trail.forEach(([F, k], j) => (j ? c.lineTo(kx(k), fy(F)) : c.moveTo(kx(k), fy(F))));
    c.strokeStyle = 'rgba(255,200,150,0.7)'; c.lineWidth = 1.5; c.stroke();
    const px = kx(cur[1]), py = fy(cur[0]);
    const g = c.createRadialGradient(px, py, 0, px, py, 14);
    g.addColorStop(0, 'rgba(255,240,220,0.9)'); g.addColorStop(1, 'rgba(255,160,90,0)');
    c.fillStyle = g; c.fillRect(px - 14, py - 14, 28, 28);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(px, py, 3, 0, TAU); c.fill();
    text(c, 'k →', x0 + w - 2, y0 + h + 16, { font: MONO, size: 10, align: 'right', color: 'rgba(255,255,255,0.45)' });
    text(c, 'F', x0 - 12, y0 + 10, { font: MONO, size: 10, color: 'rgba(255,255,255,0.45)' });
    c.restore();
  }
  const rdGlobal = t => {
    const ws = E.ioS(seg(t, RD_T.spots0, RD_T.spots1)), ww = rdWordAmt(t);
    let F = lerp(RD_REG.coral[0], RD_REG.spots[0], ws), k = lerp(RD_REG.coral[1], RD_REG.spots[1], ws);
    F = lerp(F, RD_REG.maze[0], ww); k = lerp(k, RD_REG.maze[1], ww);
    return [F, k];
  };

  MG.film({
    id: 'reactiondiffusion', dur: 10, poster: 9.4,
    fonts: [['900 150px Archivo', 'TURING'], ['500 34px "Space Grotesk"', 'REACTION–DIFFUSION'], ['400 14px "JetBrains Mono"', 'Aa1∂∇²−·→']],
    meta: {
      family: 'E', name: 'Reaction–Diffusion', sub: 'Gray-Scott Patterns', era: '1952 —',
      origin: 'Alan Turing\'s 1952 paper "The Chemical Basis of Morphogenesis" proposed that two diffusing, reacting chemicals could self-organise into spots and stripes; the Gray-Scott model (1983–84) and John Pearson\'s 1993 "Complex Patterns in a Simple System" map made it a staple of generative art.',
      works: 'A. M. Turing, The Chemical Basis of Morphogenesis (1952) · J. E. Pearson, Complex Patterns in a Simple System (Science, 1993) · Karl Sims, Reaction-Diffusion Tutorial & exhibits · Nervous System, Reaction lamps and jewellery · Greg Turk, Generating Textures on Arbitrary Surfaces Using Reaction-Diffusion (SIGGRAPH 1991)',
      tech: ['Gray-Scott PDE on a grid', 'Feed/kill parameter fields', 'Height-field lighting'],
      accent: '#ff5a3c',
      motionDNA: 'Nothing is animated directly: two chemicals react and diffuse each step, so fronts grow, branch, split and settle as the feed and kill rates drift through regimes.',
      visualDNA: 'Organic coral, mitosis spots and labyrinths with crisp iso-contours, rendered as an embossed, specular height field in coral, teal and ivory on near-black.',
      transitions: 'Regime fronts sweeping across the field, pattern dissolve into a mask, mitosis splits, labyrinth infill',
      implementation: ['Canvas 2D', 'WebGL', 'TouchDesigner', 'Houdini'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const OW = 960, OH = 540, cv = offscreen(OW, OH), ig = cv.getContext('2d');
      const bl = offscreen(240, 135);
      return {
        rd: null, cv, ig, img: ig.createImageData(OW, OH), bl, bg: bl.getContext('2d'),
        Vf: new Float32Array(RN), GX: new Float32Array(RN), GY: new Float32Array(RN), WS: new Float32Array(RN), LUT: new Float32Array(33 * 12),
        X0: new Int32Array(OW), X1: new Int32Array(OW), FX: new Float32Array(OW), Y0: new Int32Array(OH), Y1: new Int32Array(OH), FY: new Float32Array(OH),
      };
    },
    draw(c, t, W, H, st) {
      if (!st.rd) st.rd = rdSimulate();
      rdRender(st, t);
      c.fillStyle = '#06050a'; c.fillRect(0, 0, W, H);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(st.cv, 0, 0, W, H);
      // bloom
      st.bg.globalCompositeOperation = 'source-over';
      st.bg.drawImage(st.cv, 0, 0, 240, 135);
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.filter = 'blur(14px)'; c.globalAlpha = 0.34; c.drawImage(st.bl, 0, 0, W, H);
      c.filter = 'blur(40px)'; c.globalAlpha = 0.24; c.drawImage(st.bl, 0, 0, W, H);
      c.filter = 'none';
      // seed flashes
      const cam = rdCam(t), ppc = (W / RW) * cam.z;
      RD_SEEDS.forEach((s, k) => {
        const dt = t - s.t; if (dt < 0 || dt > 0.9) return;
        let sx = (s.x - cam.cx) * ppc + W / 2, sy = (s.y - cam.cy) * ppc + H / 2;
        const a = Math.exp(-dt * 5) * (k ? 0.8 : 1), rr = 10 + E.outC(seg(dt, 0, 0.9)) * (k ? 120 : 260);
        const g = c.createRadialGradient(sx, sy, 0, sx, sy, 60);
        g.addColorStop(0, `rgba(255,240,220,${a})`); g.addColorStop(1, 'rgba(255,120,80,0)');
        c.fillStyle = g; c.fillRect(sx - 60, sy - 60, 120, 120);
        c.strokeStyle = `rgba(255,190,150,${a * 0.5})`; c.lineWidth = 1.5;
        c.beginPath(); c.arc(sx, sy, rr, 0, TAU); c.stroke();
      });
      // word sheen
      const sw = seg(t, 7.1, 8.1);
      if (sw > 0 && sw < 1) {
        const sx = lerp(-300, W + 300, E.ioS(sw));
        const g = c.createLinearGradient(sx - 220, 0, sx + 220, 0);
        g.addColorStop(0, 'rgba(255,220,170,0)'); g.addColorStop(0.5, 'rgba(255,220,170,0.16)'); g.addColorStop(1, 'rgba(255,220,170,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      }
      c.restore();
      vignette(c, W, H, 0.62);

      // instrumentation
      const ov = seg(t, 0.35, 0.9) * (1 - seg(t, 8.1, 8.6)) * 0.62;
      if (ov > 0) {
        const col = `rgba(255,236,222,${ov})`, dim = `rgba(255,236,222,${ov * 0.6})`;
        text(c, '∂u/∂t = Dᵤ∇²u − uv² + F(1 − u)', 80, 84, { font: MONO, size: 15, ls: 0.5, color: col });
        text(c, '∂v/∂t = Dᵥ∇²v + uv² − (F + k)v', 80, 108, { font: MONO, size: 15, ls: 0.5, color: col });
        const [F, k] = rdGlobal(t);
        text(c, `F ${F.toFixed(4)}   k ${k.toFixed(4)}`, W - 80, 84, { font: MONO, size: 15, ls: 1, align: 'right', color: col });
        text(c, `step ${String(Math.round(rdSteps(t))).padStart(5, '0')}   ${RW}×${RH}`, W - 80, 108, { font: MONO, size: 13, ls: 1, align: 'right', color: dim });
        const ph = t < RD_T.spots0 ? 'GROWTH · CORAL' : t < RD_T.word0 ? 'REGIME SHIFT · DIVIDING SPOTS' : 'MASKED FEED · LABYRINTH';
        text(c, ph, 80, H - 80, { font: MONO, size: 13, ls: 4, color: col });
      }
      const ia = seg(t, 1.0, 1.6) * 0.9;
      const trail = [];
      for (let u = 0; u <= t; u += 0.1) trail.push(rdGlobal(u));
      fkInset(c, W - 80 - 230, H - 80 - 150, 230, 150, rdGlobal(t), trail, ia * (1 - 0.6 * seg(t, 8.2, 8.8)));
      // title
      const ta = E.outC(seg(t, 8.25, 9.0));
      if (ta > 0) {
        text(c, 'REACTION–DIFFUSION', 80, H - 112 + (1 - ta) * 14, { font: GROT, weight: 500, size: 34, ls: 9, color: `rgba(250,238,220,${ta})` });
        const sa = E.outC(seg(t, 8.5, 9.2));
        text(c, 'GRAY–SCOTT MODEL  ·  AFTER A. M. TURING, 1952', 82, H - 78, { font: MONO, size: 14, ls: 3, color: `rgba(255,200,160,${sa * 0.75})` });
      }
      grain(c, W, H, t, 0.045, 'overlay');
    },
    score(A) {
      // drone that ripens with the pattern
      A.osc(0, { f: midi(33), dur: 8.6, g: 0.1, a: 1.6, hold: true, rel: 1.2, lp: 300, lp2: 900, lpT: 6 });
      A.osc(0.1, { f: midi(45) * 1.003, dur: 8.4, g: 0.035, a: 2.5, hold: true, rel: 1.0, type: 'triangle', lp: 600 });
      // droplets: one per seed, pitch rises as the colony spreads
      const scale = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24, 27, 29, 31, 34];
      RD_SEEDS.forEach((s, k) => {
        const f = midi(69 + scale[k % scale.length] - (k ? 0 : 12));
        A.osc(s.t, { f: f * 2, f2: f, glide: 0.05, dur: 0.5, g: k ? 0.06 : 0.12, pan: (s.x / RW - 0.5) * 1.4, rev: 0.5 });
        A.pluck(s.t + 0.01, f, { g: k ? 0.09 : 0.16, dur: 1.4, bright: 0.45, pan: (s.x / RW - 0.5) * 1.4, rev: 0.4 });
      });
      // growth fizz — granular ticks thickening
      for (let k = 0; k < 120; k++) {
        const t = 0.9 + Math.pow(hash(k * 2.3), 0.7) * 2.6;
        A.noise(t, { type: 'bandpass', f: 2500 + hash(k * 5.1) * 5000, q: 6, dur: 0.025, g: 0.022, pan: hash(k * 7.7) * 2 - 1 });
      }
      A.chord(1.2, [45, 52, 57, 60, 64], { type: 'sine', dur: 2.6, g: 0.022, a: 0.9, hold: true, rel: 1.0, width: 1.4, rev: 0.6 });
      // regime front sweeps left→right
      A.whoosh(RD_T.spots0 - 0.1, 1.3, { f1: 300, f2: 2600, g: 0.1, pan: -0.6 });
      A.whoosh(RD_T.spots0 + 1.0, 1.4, { f1: 2600, f2: 500, g: 0.08, pan: 0.6 });
      A.chord(RD_T.spots0, [41, 48, 53, 57, 60, 65], { type: 'sine', dur: 2.7, g: 0.024, a: 0.8, hold: true, rel: 1.0, width: 1.4, rev: 0.6 });
      // mitosis: bubbly pops as spots divide
      for (let k = 0; k < 42; k++) {
        const t = RD_T.spots0 + 0.3 + hash(k * 3.7) * 2.5, f = midi(72 + [0, 2, 5, 7, 9, 12][k % 6]);
        A.osc(t, { f: f * 0.5, f2: f * 1.5, glide: 0.06, dur: 0.09, g: 0.03, pan: hash(k * 1.9) * 2 - 1, rev: 0.4 });
      }
      // dissolve into the word
      A.riser(5.4, 1.4, { g: 0.1, f: 55 });
      A.noise(RD_T.word0, { type: 'lowpass', f: 6000, f2: 300, dur: 1.4, g: 0.07, rev: 0.6 });
      A.impact(6.8, 0.55);
      A.chord(6.8, [38, 45, 50, 57, 62, 66, 69], { type: 'triangle', dur: 3.0, g: 0.026, a: 0.02, rev: 0.7, width: 1.5 });
      A.bell(6.82, midi(86), { g: 0.08, dur: 2.6 });
      [74, 78, 81, 85].forEach((m, k) => A.bell(7.2 + k * 0.16, midi(m), { g: 0.035, dur: 1.4, pan: (k / 3 - 0.5), rev: 0.6 }));
      // resolve
      A.chord(8.3, [38, 50, 57, 62, 66, 69, 74], { type: 'sine', dur: 1.7, g: 0.03, a: 0.4, hold: true, rel: 1.0, width: 1.4, rev: 0.7 });
      A.bell(8.6, midi(93), { g: 0.03, dur: 1.4 });
    },
  });

  /* ================= E2 Strange Attractors ================= */
  const AN = 1200000, AW = 1920, AH = 1080;
  const AT = { morph1: 3.3, morph1e: 4.4, morph2: 5.6, morph2e: 6.3, morph3: 7.3, morph3e: 8.25 };
  const aCount = t => Math.round(kf(t, [[0.12, 2], [1.35, 4200, E.lin], [2.2, 60000, E.inQ], [3.2, AN, E.inC]]));
  let _lor = null;
  function lorenzPts() {
    if (_lor) return _lor;
    const P = new Float32Array(AN * 3), s = 10, r = 28, b = 8 / 3, h = 0.0016;
    let x = 1, y = 1, z = 1;
    const d = (x, y, z) => [s * (y - x), x * (r - z) - y, x * y - b * z];
    for (let i = 0; i < AN; i++) {
      P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z;
      const k1 = d(x, y, z), k2 = d(x + k1[0] * h / 2, y + k1[1] * h / 2, z + k1[2] * h / 2);
      const k3 = d(x + k2[0] * h / 2, y + k2[1] * h / 2, z + k2[2] * h / 2), k4 = d(x + k3[0] * h, y + k3[1] * h, z + k3[2] * h);
      x += (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) * h / 6;
      y += (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) * h / 6;
      z += (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]) * h / 6;
    }
    return (_lor = P);
  }
  const CL0 = [-1.4, 1.6, 1.0, 0.7], CL1 = [-2.24, 2.41, 0.55, 1.24];
  const DJ0 = [1.4, -2.3, 2.4, -2.1], DJ1 = [2.27, -1.49, 3.18, -2.91];
  const lerp4 = (a, b, k) => a.map((v, i) => lerp(v, b[i], k));
  const clP = t => lerp4(CL0, CL1, E.ioS(seg(t, AT.morph1e - 0.1, AT.morph2)));
  const djP = t => lerp4(DJ0, DJ1, E.ioS(seg(t, AT.morph2e, AT.morph3 + 0.1)));
  const aCam = t => {
    const hero = E.ioC(seg(t, AT.morph3, AT.morph3e + 0.5));
    return {
      yaw: 0.35 + t * 0.62 + hero * 0.0 - E.ioC(seg(t, AT.morph3, AT.morph3e)) * 0.4,
      pitch: lerp(0.22, 0.12, hero), S: lerp(lerp(17.5, 19, seg(t, 0, 3.3)), 17.2, hero),
      cx: 960, cy: lerp(560, 500, hero), D: 120,
    };
  };
  const MAG = [1.0, 0.24, 0.56], CYA = [0.18, 0.62, 1.0], VIO = [0.5, 0.3, 1.0], AMB = [1.0, 0.66, 0.26];
  function attrFrame(st, t) {
    const L = lorenzPts(), R = st.R, G = st.G, B = st.B;
    R.fill(0); G.fill(0); B.fill(0);
    // which sources and morph amount
    let ta = 0, tb = -1, m = 0, pa = null, pb = null, n = AN;
    if (t < AT.morph1) { ta = 0; n = aCount(t); }
    else if (t < AT.morph1e) { ta = 0; tb = 1; pb = clP(t); m = seg(t, AT.morph1, AT.morph1e); }
    else if (t < AT.morph2) { ta = 1; pa = clP(t); }
    else if (t < AT.morph2e) { ta = 1; pa = clP(t); tb = 2; pb = djP(t); m = seg(t, AT.morph2, AT.morph2e); }
    else if (t < AT.morph3) { ta = 2; pa = djP(t); }
    else if (t < AT.morph3e) { ta = 2; pa = djP(t); tb = 0; m = seg(t, AT.morph3, AT.morph3e); }
    else ta = 0;
    const cam = aCam(t), cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    const scl = p => (p ? (ta === 1 && p === pa) || (tb === 1 && p === pb) ? Math.min(1500 / (2 * (1 + Math.abs(p[2]))), 860 / (2 * (1 + Math.abs(p[3])))) : 218 : 0);
    const sA = scl(pa), sB = scl(pb);
    let ax = 0.1, ay = 0.1, bx = 0.1, by = 0.1;
    // warm up iterated maps so the orbit is on the attractor
    const it = (type, p, x, y) => type === 1
      ? [Math.sin(p[0] * y) + p[2] * Math.cos(p[0] * x), Math.sin(p[1] * x) + p[3] * Math.cos(p[1] * y)]
      : [Math.sin(p[0] * y) - Math.cos(p[1] * x), Math.sin(p[2] * x) - Math.cos(p[3] * y)];
    for (let k = 0; k < 60; k++) { if (ta > 0) [ax, ay] = it(ta, pa, ax, ay); if (tb > 0) [bx, by] = it(tb, pb, bx, by); }
    const me = E.ioS(m), wB = me, wA = 1 - me, kA = 2.4 * E.inQ(m) * (tb >= 0 ? 1 : 0), kB = 2.4 * E.inQ(1 - m);
    const A0 = pa ? pa[0] : 0, A1 = pa ? pa[1] : 0, A2 = pa ? pa[2] : 0, A3 = pa ? pa[3] : 0;
    const B0 = pb ? pb[0] : 0, B1 = pb ? pb[1] : 0, B2 = pb ? pb[2] : 0, B3 = pb ? pb[3] : 0;
    const out = [0, 0, 0, 0, 0];
    const lor = (i) => {
      const x = L[i * 3], y = L[i * 3 + 1], z = L[i * 3 + 2] - 26;
      const x1 = x * cy - y * sy, y1 = x * sy + y * cy;
      const up = z * cp - y1 * sp, dep = z * sp + y1 * cp, pr = cam.D / (cam.D + dep) * cam.S;
      out[0] = cam.cx + x1 * pr; out[1] = cam.cy - up * pr;
      const kc = clamp(0.5 + x / 26), lit = 0.75 + 0.5 * clamp(-dep / 40 + 0.5);
      out[2] = lerp(MAG[0], CYA[0], kc) * lit; out[3] = lerp(MAG[1], CYA[1], kc) * lit; out[4] = lerp(MAG[2], CYA[2], kc) * lit;
    };
    const col2 = (dx, dy, o) => {
      const s2 = dx * dx + dy * dy, u = s2 / (s2 + 0.9);
      if (u < 0.5) { const k = u * 2; o[2] = lerp(VIO[0], MAG[0], k); o[3] = lerp(VIO[1], MAG[1], k); o[4] = lerp(VIO[2], MAG[2], k); }
      else { const k = u * 2 - 1; o[2] = lerp(MAG[0], AMB[0], k); o[3] = lerp(MAG[1], AMB[1], k); o[4] = lerp(MAG[2], AMB[2], k); }
    };
    for (let i = 0; i < n; i++) {
      let x, y, r, g, b;
      if (ta === 0) { lor(i); x = out[0]; y = out[1]; r = out[2]; g = out[3]; b = out[4]; }
      else {
        let nx, ny;
        if (ta === 1) { nx = Math.sin(A0 * ay) + A2 * Math.cos(A0 * ax); ny = Math.sin(A1 * ax) + A3 * Math.cos(A1 * ay); }
        else { nx = Math.sin(A0 * ay) - Math.cos(A1 * ax); ny = Math.sin(A2 * ax) - Math.cos(A3 * ay); }
        col2(nx - ax, ny - ay, out);
        ax = nx; ay = ny; x = 960 + ax * sA; y = 540 + ay * sA; r = out[2]; g = out[3]; b = out[4];
      }
      if (tb >= 0) {
        let x2, y2;
        if (tb === 0) { lor(i); x2 = out[0]; y2 = out[1]; }
        else {
          let nx, ny;
          if (tb === 1) { nx = Math.sin(B0 * by) + B2 * Math.cos(B0 * bx); ny = Math.sin(B1 * bx) + B3 * Math.cos(B1 * by); }
          else { nx = Math.sin(B0 * by) - Math.cos(B1 * bx); ny = Math.sin(B2 * bx) - Math.cos(B3 * by); }
          col2(nx - bx, ny - by, out);
          bx = nx; by = ny; x2 = 960 + bx * sB; y2 = 540 + by * sB;
        }
        // vortex crossfade: the old attractor twists out and expands, the new one twists in and contracts
        let dx = x - 960, dy = y - 540, rr = Math.sqrt(dx * dx + dy * dy);
        let th = kA * (0.6 + rr / 700), cs = Math.cos(th), sn = Math.sin(th), sc = 1 + 0.18 * kA;
        if (wA > 0.004) {
          const px = 960 + (dx * cs - dy * sn) * sc, py = 540 + (dx * sn + dy * cs) * sc;
          if (px >= 0 && py >= 0 && px < AW && py < AH) { const idx = (py | 0) * AW + (px | 0); R[idx] += r * wA; G[idx] += g * wA; B[idx] += b * wA; }
        }
        if (wB > 0.004) {
          dx = x2 - 960; dy = y2 - 540; rr = Math.sqrt(dx * dx + dy * dy);
          th = -kB * (0.6 + rr / 700); cs = Math.cos(th); sn = Math.sin(th); sc = 1 - 0.15 * kB;
          const px = 960 + (dx * cs - dy * sn) * sc, py = 540 + (dx * sn + dy * cs) * sc;
          if (px >= 0 && py >= 0 && px < AW && py < AH) { const idx = (py | 0) * AW + (px | 0); R[idx] += out[2] * wB; G[idx] += out[3] * wB; B[idx] += out[4] * wB; }
        }
        continue;
      }
      if (x < 0 || y < 0 || x >= AW || y >= AH) continue;
      const idx = (y | 0) * AW + (x | 0);
      R[idx] += r; G[idx] += g; B[idx] += b;
    }
    // log tone map against a high percentile of the (sampled) density, flame-style
    const hist = st.HIST; hist.fill(0);
    let cnt = 0;
    for (let i = 0; i < AW * AH; i += 5) { const v = R[i] + G[i] + B[i]; if (v > 0) { hist[Math.min(1023, (Math.log2(v) * 32 + 320) | 0)]++; cnt++; } }
    let acc = 0, hb = 1023; const want = cnt * (1 - st.PCT);
    for (; hb > 0; hb--) { acc += hist[hb]; if (acc >= want) break; }
    const Dref = Math.max(Math.pow(2, (hb - 320) / 32), 1.5), qs = 1024 / Dref, TONE = st.TONE, data = st.img.data;
    for (let i = 0, o = 0; i < AW * AH; i++, o += 4) {
      const D = R[i] + G[i] + B[i];
      if (D <= 0) { data[o] = data[o + 1] = data[o + 2] = 0; continue; }
      let q = (D * qs) | 0; if (q > 4095) q = 4095;
      const br = TONE[q], k = br / D, wh = br > 200 ? (br - 200) * 1.2 : 0;
      data[o] = Math.min(255, R[i] * k * 1.25 + wh); data[o + 1] = Math.min(255, G[i] * k * 1.25 + wh); data[o + 2] = Math.min(255, B[i] * k * 1.25 + wh);
    }
    st.ig.putImageData(st.img, 0, 0);
    return { n, cam };
  }
  // Lorenz lobe switches during the lone-trail opening (shared by picture and score)
  let _lobes = null;
  function lobeEvents() {
    if (_lobes) return _lobes;
    const L = lorenzPts(), ev = [];
    let side = Math.sign(L[0]), t = 0.12;
    for (let i = 1; i < 26000; i++) {
      const s = Math.sign(L[i * 3]);
      if (s !== side && Math.abs(L[i * 3]) > 0.5) {
        side = s;
        while (t < 2.4 && aCount(t) < i) t += 0.002;
        if (t >= 2.2) break;
        ev.push({ t, side: s });
      }
    }
    return (_lobes = ev);
  }

  MG.film({
    id: 'attractor', dur: 10, poster: 9.4,
    fonts: [['300 40px "Space Grotesk"', 'STRANGE ATTRACTORS'], ['400 14px "JetBrains Mono"', 'Aa1σρβ·−ₙ₊']],
    meta: {
      family: 'E', name: 'Strange Attractors', sub: 'Lorenz · Clifford · De Jong', era: '1963 —',
      origin: 'Edward Lorenz\'s 1963 paper "Deterministic Nonperiodic Flow" found the butterfly-shaped attractor in a three-equation weather model; Peter de Jong\'s and Clifford Pickover\'s 2D maps, popularised by Paul Bourke and A. K. Dewdney, turned iterated chaos into density images.',
      works: 'E. N. Lorenz, Deterministic Nonperiodic Flow (1963) · Clifford A. Pickover, Chaos in Wonderland (1994) · A. K. Dewdney, Computer Recreations, Scientific American (1987) · Paul Bourke, Strange Attractors gallery · Jos Leys, Étienne Ghys & Aurélien Alvarez, Chaos: A Mathematical Adventure (2013)',
      tech: ['RK4 ODE integration', 'Million-point density buffers', 'Index-matched attractor morphs'],
      accent: '#ff3d8f',
      motionDNA: 'A single orbit never repeats: one bright point traces the flow, the camera orbits as millions of samples accumulate, and the parameters drift so the whole cloud morphs between attractors.',
      visualDNA: 'Filaments of light on black built from log-tone-mapped point density, chromatic wings in magenta and cyan, fine mono equations and live parameter readouts.',
      transitions: 'Lone-trail reveal, 3D-to-2D particle morph, parameter sweep, attractor crossfade, hero settle',
      implementation: ['Canvas 2D', 'WebGL', 'TouchDesigner', 'Houdini'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const cv = offscreen(AW, AH), ig = cv.getContext('2d'), img = ig.createImageData(AW, AH);
      for (let i = 3; i < img.data.length; i += 4) img.data[i] = 255;
      const TONE = new Float32Array(4096);
      for (let i = 0; i < 4096; i++) TONE[i] = 255 * Math.pow(Math.log(1 + (i / 1024) * 24) / Math.log(25), 1.35);
      const bl = offscreen(480, 270);
      return { cv, ig, img, TONE, HIST: new Float64Array(1024), PCT: 0.995, bl, bg: bl.getContext('2d'), R: new Float32Array(AW * AH), G: new Float32Array(AW * AH), B: new Float32Array(AW * AH) };
    },
    draw(c, t, W, H, st) {
      lorenzPts();
      c.fillStyle = '#030208'; c.fillRect(0, 0, W, H);
      const bgg = c.createRadialGradient(W / 2, H * 0.5, 0, W / 2, H * 0.5, 1000);
      bgg.addColorStop(0, 'rgba(60,20,90,0.35)'); bgg.addColorStop(1, 'rgba(10,5,30,0)');
      c.fillStyle = bgg; c.fillRect(0, 0, W, H);
      const { n, cam } = attrFrame(st, t);
      // faint 3D axes while we are in Lorenz space
      const ax3 = (seg(t, 0.2, 0.8) * (1 - seg(t, AT.morph1, AT.morph1 + 0.5)) + seg(t, AT.morph3e - 0.3, AT.morph3e + 0.4) * 0.6 * (1 - seg(t, 8.3, 8.9))) * 0.32;
      if (ax3 > 0) {
        const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
        const P = (x, y, z) => { z -= 26; const x1 = x * cy - y * sy, y1 = x * sy + y * cy, up = z * cp - y1 * sp, dep = z * sp + y1 * cp, pr = cam.D / (cam.D + dep) * cam.S; return [cam.cx + x1 * pr, cam.cy - up * pr]; };
        c.save(); c.lineWidth = 1;
        [[[-26, 0, 0], [26, 0, 0], 'x'], [[0, -26, 0], [0, 26, 0], 'y'], [[0, 0, 0], [0, 0, 52], 'z']].forEach(([a, b, nm]) => {
          const p = P(...a), q = P(...b);
          c.strokeStyle = `rgba(200,190,255,${ax3})`; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke();
          text(c, nm, q[0] + 6, q[1] - 6, { font: MONO, size: 13, color: `rgba(200,190,255,${ax3 * 1.6})` });
        });
        for (let k = -2; k <= 2; k++) {
          const a = P(-26, k * 13, 0), b = P(26, k * 13, 0), e = P(k * 13, -26, 0), f = P(k * 13, 26, 0);
          c.strokeStyle = `rgba(200,190,255,${ax3 * 0.35})`; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.moveTo(e[0], e[1]); c.lineTo(f[0], f[1]); c.stroke();
        }
        c.restore();
      }
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.drawImage(st.cv, 0, 0);
      st.bg.clearRect(0, 0, 480, 270); st.bg.drawImage(st.cv, 0, 0, 480, 270);
      c.filter = 'blur(6px)'; c.globalAlpha = 0.45; c.drawImage(st.bl, 0, 0, W, H);
      c.filter = 'blur(28px)'; c.globalAlpha = 0.3; c.drawImage(st.bl, 0, 0, W, H);
      c.filter = 'none'; c.globalAlpha = 1;
      // the lone point: comet tail + head while the trail is still young
      const L = lorenzPts();
      if (t < AT.morph1) {
        const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
        const P = i => { const x = L[i * 3], y = L[i * 3 + 1], z = L[i * 3 + 2] - 26, x1 = x * cy - y * sy, y1 = x * sy + y * cy, up = z * cp - y1 * sp, dep = z * sp + y1 * cp, pr = cam.D / (cam.D + dep) * cam.S; return [cam.cx + x1 * pr, cam.cy - up * pr]; };
        const head = Math.max(1, n - 1), tail = Math.min(head, 420), fade = 1 - seg(t, 2.0, 2.9);
        c.lineCap = 'round';
        for (let sgm = 0; sgm < 12; sgm++) {
          const a0 = head - tail + Math.floor(tail * sgm / 12), a1 = head - tail + Math.floor(tail * (sgm + 1) / 12);
          c.strokeStyle = `rgba(255,236,250,${(0.08 + 0.85 * Math.pow((sgm + 1) / 12, 2)) * fade})`; c.lineWidth = 1 + 2.2 * (sgm + 1) / 12;
          c.beginPath(); let p = P(a0); c.moveTo(p[0], p[1]);
          for (let i = a0 + 1; i <= a1; i++) { p = P(i); c.lineTo(p[0], p[1]); }
          c.stroke();
        }
        const hp = P(head), hr = 34 + 8 * Math.sin(t * 30);
        const g = c.createRadialGradient(hp[0], hp[1], 0, hp[0], hp[1], hr);
        g.addColorStop(0, `rgba(255,255,255,${fade})`); g.addColorStop(0.2, `rgba(255,140,210,${0.6 * fade})`); g.addColorStop(1, 'rgba(255,60,160,0)');
        c.fillStyle = g; c.fillRect(hp[0] - hr, hp[1] - hr, hr * 2, hr * 2);
      }
      // morph flashes
      [[AT.morph1e - 0.05, 0.12], [AT.morph3e - 0.05, 0.14]].forEach(([tt, k]) => {
        const d = t - tt; if (d < 0 || d > 0.8) return;
        const g = c.createRadialGradient(960, 540, 0, 960, 540, 900);
        g.addColorStop(0, `rgba(255,220,255,${k * Math.exp(-d * 6)})`); g.addColorStop(1, 'rgba(255,220,255,0)');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      });
      c.restore();
      vignette(c, W, H, 0.7);

      // equations + parameters
      const ov = seg(t, 0.3, 0.9) * (1 - seg(t, 8.2, 8.7)) * 0.66;
      if (ov > 0) {
        const col = `rgba(236,226,255,${ov})`, dim = `rgba(236,226,255,${ov * 0.6})`;
        let eq, nm, pr;
        if (t < AT.morph1 + 0.55 || t >= AT.morph3e - 0.3) {
          eq = ['ẋ = σ(y − x)', 'ẏ = x(ρ − z) − y', 'ż = xy − βz']; nm = 'LORENZ · 1963'; pr = 'σ 10.000   ρ 28.000   β 2.667';
        } else if (t < AT.morph2 + 0.35) {
          const p = clP(t); eq = ['xₙ₊₁ = sin(a yₙ) + c cos(a xₙ)', 'yₙ₊₁ = sin(b xₙ) + d cos(b yₙ)']; nm = 'CLIFFORD'; pr = p.map((v, i) => 'abcd'[i] + ' ' + (v < 0 ? '−' : ' ') + Math.abs(v).toFixed(3)).join('   ');
        } else {
          const p = djP(t); eq = ['xₙ₊₁ = sin(a yₙ) − cos(b xₙ)', 'yₙ₊₁ = sin(c xₙ) − cos(d yₙ)']; nm = 'DE JONG'; pr = p.map((v, i) => 'abcd'[i] + ' ' + (v < 0 ? '−' : ' ') + Math.abs(v).toFixed(3)).join('   ');
        }
        eq.forEach((s, k) => text(c, s, 80, 84 + k * 24, { font: MONO, size: 15, ls: 0.5, color: col }));
        text(c, pr, W - 80, 84, { font: MONO, size: 15, ls: 1, align: 'right', color: col });
        text(c, `N ${fmtN(t < AT.morph1 ? n : AN)} pts`, W - 80, 108, { font: MONO, size: 13, ls: 1, align: 'right', color: dim });
        text(c, nm, 80, H - 80, { font: MONO, size: 13, ls: 5, color: col });
        text(c, `t = ${t.toFixed(2)}`, W - 80, H - 80, { font: MONO, size: 13, ls: 1, align: 'right', color: dim });
      }
      const ta = E.outC(seg(t, 8.35, 9.1));
      if (ta > 0) {
        text(c, 'STRANGE ATTRACTORS', W / 2 + 12, 968 + (1 - ta) * 12, { font: GROT, weight: 300, size: 38, ls: 24, align: 'center', color: `rgba(246,240,255,${ta})` });
        const sa = E.outC(seg(t, 8.6, 9.3));
        text(c, 'LORENZ 1963   ·   σ = 10   ρ = 28   β = 8/3   ·   1,200,000 SAMPLES', W / 2, 1006, { font: MONO, size: 13, ls: 3, align: 'center', color: `rgba(255,170,215,${sa * 0.7})` });
      }
      grain(c, W, H, t, 0.04, 'screen');
    },
    score(A) {
      // sub drone with slow beating
      A.osc(0, { f: midi(26), dur: 9.8, g: 0.09, a: 1.2, hold: true, rel: 1.2 });
      A.osc(0, { f: midi(38) * 1.004, dur: 9.6, g: 0.03, a: 2.2, hold: true, rel: 1.0, type: 'triangle', lp: 500, lp2: 1400, lpT: 7 });
      // the lone point: a bright sine whose every wing-flip plucks a note left or right
      A.osc(0.12, { f: midi(81), f2: midi(93), glide: 2.0, dur: 2.2, g: 0.018, a: 0.3, vib: [6, 4], rev: 0.5 });
      const notes = [62, 65, 69, 72, 74, 77, 81, 84];
      lobeEvents().forEach((e, k) => {
        const g = 0.11 * (1 - k / 60);
        if (g > 0.02) A.pluck(e.t, midi(notes[k % notes.length] - (e.side > 0 ? 0 : 12)), { g, dur: 1.2, bright: 0.6, pan: e.side * 0.65, rev: 0.45 });
      });
      // densification swell
      A.noise(1.4, { type: 'bandpass', f: 600, f2: 7000, sweep: 1.9, q: 1.5, dur: 2.0, g: 0.07, swell: 0.9, rev: 0.5 });
      A.chord(2.0, [50, 57, 62, 65, 69], { type: 'sine', dur: 1.6, g: 0.024, a: 0.7, hold: true, rel: 0.6, width: 1.4, rev: 0.6 });
      // 3D → 2D morph
      A.whoosh(AT.morph1 - 0.1, 1.2, { f1: 4000, f2: 300, g: 0.11 });
      A.osc(AT.morph1e - 0.05, { f: 70, f2: 38, glide: 0.5, dur: 0.9, g: 0.22 });
      A.bell(AT.morph1e - 0.05, midi(79), { g: 0.07, dur: 2.0 });
      A.chord(AT.morph1e, [46, 53, 58, 62, 65], { type: 'triangle', dur: 2.0, g: 0.02, a: 0.4, hold: true, rel: 0.7, width: 1.4, rev: 0.6, lp: 1800 });
      // parameter sweep shimmer
      for (let k = 0; k < 40; k++) A.osc(AT.morph1e + 0.1 + k * 0.075, { f: midi(84 + [0, 3, 7, 10, 12, 15, 19][(k * 3) % 7]), dur: 0.22, g: 0.012, pan: Math.sin(k * 0.7) * 0.8, rev: 0.7 });
      // Clifford → De Jong
      A.whoosh(AT.morph2 - 0.05, 0.8, { f1: 500, f2: 5000, g: 0.08, pan: 0.3 });
      A.bell(AT.morph2e - 0.05, midi(77), { g: 0.06, dur: 1.8 });
      A.chord(AT.morph2e, [44, 51, 56, 60, 63], { type: 'triangle', dur: 1.3, g: 0.02, a: 0.3, hold: true, rel: 0.5, width: 1.4, rev: 0.6, lp: 2200 });
      // climax: back to the hero butterfly
      A.riser(6.4, 1.6, { g: 0.11, f: 49 });
      A.impact(AT.morph3e - 0.05, 0.6);
      A.chord(AT.morph3e - 0.05, [38, 45, 50, 57, 62, 65, 69, 74], { type: 'sine', dur: 2.0, g: 0.032, a: 0.03, rev: 0.7, width: 1.5 });
      A.bell(AT.morph3e - 0.04, midi(86), { g: 0.08, dur: 2.4 });
      [74, 77, 81, 86].forEach((m, k) => A.pluck(8.45 + k * 0.14, midi(m), { g: 0.08, dur: 1.4, bright: 0.5, pan: (k / 3 - 0.5) * 1.2, rev: 0.5 }));
      A.chord(8.6, [38, 50, 57, 62, 69], { type: 'sine', dur: 1.4, g: 0.024, a: 0.3, hold: true, rel: 0.9, width: 1.4, rev: 0.7 });
    },
  });

  /* ================= E3 Cellular Automata — Conway's Game of Life ================= */
  const LW = 480, LH = 270, LPAD = 60, LSW = LW + LPAD * 2, LSH = LH + LPAD * 2, LPRE = 52, LBACK = 8;
  const L_RATE = [[0, 9], [2.0, 9], [3.2, 22], [4.6, 60], [6.0, 96], [6.6, 40], [7.0, 26], [7.7, 20], [8.1, 4], [10, 4]];
  const lifeG = integrate(L_RATE, 10);
  const L_SWEEP = [6.9, 7.75];
  const L_GUN = [
    '........................O...........', '......................O.O...........', '............OO......OO............OO',
    '...........O...O....OO............OO', 'OO........O.....O...OO..............', 'OO........O...O.OO....O.O...........',
    '..........O.....O.......O...........', '...........O...O....................', '............OO......................'];
  const L_PULSAR = ['..OOO...OOO..', '.............', 'O....O.O....O', 'O....O.O....O', 'O....O.O....O', '..OOO...OOO..', '.............',
    '..OOO...OOO..', 'O....O.O....O', 'O....O.O....O', 'O....O.O....O', '.............', '..OOO...OOO..'];
  const L_PENTA = ['..O....O..', 'OO.OOOO.OO', '..O....O..'];
  const L_LWSS = ['.O..O', 'O....', 'O...O', '.OOOO'];
  const L_GUNS = [{ x: 186, y: 100, flip: false }, { x: 262, y: 100, flip: true }];
  const L_LABELS = [
    { x: 204, y: 98, s: 'GOSPER GLIDER GUN · p30', a: [0.3, 2.6] },
    { x: 220, y: 119, s: 'GLIDER · c/4', a: [1.0, 2.9], off: [80, 40] },
    { x: 102, y: 46, s: 'PULSAR · p3', a: [2.9, 4.6], off: [60, 40] },
    { x: 155, y: 56, s: 'PENTADECATHLON · p15', a: [3.0, 4.7] },
    { x: 300, y: 200, s: 'RANDOM SOUP · 35%', a: [3.6, 5.6] },
  ];
  const lCam = t => {
    const ls = kf(t, [[0, Math.log(46)], [1.9, Math.log(38)], [5.4, Math.log(4.0), E.ioC], [6.9, Math.log(4.0)], [8.3, Math.log(5.6), E.ioC], [10, Math.log(5.95), E.lin]]);
    const k = E.ioC(seg(t, 1.9, 5.4)), k2 = E.ioC(seg(t, 6.9, 8.3));
    return { s: Math.exp(ls), cx: lerp(lerp(204, 240, k), 240, k2), cy: lerp(lerp(106, 135, k), 136, k2) };
  };

  let _life = null;
  function lifeSim() {
    if (_life) return _life;
    let a = new Uint8Array(LSW * LSH), b = new Uint8Array(LSW * LSH);
    const set = (x, y) => { x += LPAD; y += LPAD; if (x > 1 && y > 1 && x < LSW - 2 && y < LSH - 2) a[y * LSW + x] = 1; };
    const place = (pat, x, y, flip) => pat.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'O') set(x + (flip ? row.length - 1 - i : i), y + j); }));
    L_GUNS.forEach(g => place(L_GUN, g.x, g.y, g.flip));
    place(L_GUN, 14, 14, false); place(L_GUN, 430, 14, true);
    place(L_PULSAR, 96, 34); place(L_PULSAR, 371, 34); place(L_PULSAR, 233, 20);
    place(L_PENTA, 150, 58); place(L_PENTA, 320, 58);
    [[170, 14], [186, 14], [290, 14], [306, 14], [200, 44], [276, 44]].forEach(([x, y]) => place(['OOO'], x, y));
    [[120, 16], [350, 16]].forEach(([x, y]) => place(['OO..', 'OO..', '..OO', '..OO'], x, y));
    for (let k = 0; k < 4; k++) place(L_LWSS, 24 + k * 14, 76 + (k % 2) * 7, true);
    for (let k = 0; k < 4; k++) place(L_LWSS, 440 - k * 14, 124 + (k % 2) * 7, false);
    // soups: noisy blobs
    const r = rng(1970);
    [[240, 222, 200, 0.42, 0.35], [70, 170, 50, 1, 0.36], [410, 170, 50, 1, 0.36]].forEach(([cx, cy, rad, ey, d]) => {
      for (let y = cy - rad - 10; y <= cy + rad + 10; y++) for (let x = cx - rad - 10; x <= cx + rad + 10; x++) {
        const ang = Math.atan2((y - cy) / ey, x - cx), rr = rad * (0.8 + 0.25 * vnoise(ang * 2.2 + cx, 5));
        if (Math.hypot(x - cx, (y - cy) / ey) < rr && r() < d) set(x, y);
      }
    });
    // target: LIFE in still-life blocks (pitch 3) + a row of blinkers
    const T = new Uint8Array(LSW * LSH);
    const mc = offscreen(80, 40), mg = mc.getContext('2d');
    mg.fillStyle = '#fff'; mg.textAlign = 'center'; mg.textBaseline = 'middle';
    let fs = 44; mg.font = `900 ${fs}px Archivo, sans-serif`;
    const tw = mg.measureText('LIFE').width; if (tw > 74) { fs *= 74 / tw; mg.font = `900 ${fs}px Archivo, sans-serif`; }
    mg.fillText('LIFE', 40, 21);
    const md = mg.getImageData(0, 0, 80, 40).data;
    let minX = 99, maxX = 0, minY = 99, maxY = 0;
    for (let y = 0; y < 40; y++) for (let x = 0; x < 80; x++) if (md[(y * 80 + x) * 4 + 3] > 128) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
    const bw = maxX - minX + 1, bh = maxY - minY + 1, ox = Math.round(240 - bw * 1.5), oy = Math.round(128 - bh * 1.5);
    const tset = (x, y) => { x += LPAD; y += LPAD; T[y * LSW + x] = 1; };
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) if (md[(y * 80 + x) * 4 + 3] > 128) {
      const X = ox + (x - minX) * 3, Y = oy + (y - minY) * 3;
      tset(X, Y); tset(X + 1, Y); tset(X, Y + 1); tset(X + 1, Y + 1);
    }
    const blY = oy + bh * 3 + 9;
    for (let x = ox + 2; x <= ox + bw * 3 - 4; x += 6) { tset(x, blY); tset(x + 1, blY); tset(x + 2, blY); }
    const wordBox = { x: ox, y: oy, w: bw * 3, h: bh * 3, blY };
    const DIST = new Float32Array(LSW * LSH);
    for (let y = 0; y < LSH; y++) for (let x = 0; x < LSW; x++) DIST[y * LSW + x] = Math.hypot(x - LPAD - 240, (y - LPAD - 136) * 1.15);
    const gA = lifeG(L_SWEEP[0]), gB = lifeG(L_SWEEP[1]);
    const GT = Math.ceil(lifeG(10)) + 2, total = LPRE + GT, gens = [], pops = [], emits = [];
    const VB = Math.ceil(LW * LH / 8), boxes = L_GUNS.map(g => ({ x0: g.x + (g.flip ? 7 : 24), y0: g.y + 11, prev: 0 }));
    for (let g = 0; g <= total; g++) {
      if (g >= LPRE - LBACK) {
        const bits = new Uint8Array(VB); let pop = 0;
        for (let y = 0; y < LH; y++) {
          const row = (y + LPAD) * LSW + LPAD;
          for (let x = 0; x < LW; x++) if (a[row + x]) { const i = y * LW + x; bits[i >> 3] |= 1 << (i & 7); pop++; }
        }
        gens.push(bits); pops.push(pop);
        if (g >= LPRE) boxes.forEach((bx, k) => {
          let n = 0;
          for (let y = bx.y0; y < bx.y0 + 4; y++) for (let x = bx.x0; x < bx.x0 + 5; x++) n += a[(y + LPAD) * LSW + x + LPAD];
          if (n > 0 && bx.prev === 0) emits.push({ g: g - LPRE, k });
          bx.prev = n;
        });
      }
      // step
      for (let y = 1; y < LSH - 1; y++) {
        const r0 = y * LSW;
        for (let x = 1; x < LSW - 1; x++) {
          const i = r0 + x;
          const n = a[i - LSW - 1] + a[i - LSW] + a[i - LSW + 1] + a[i - 1] + a[i + 1] + a[i + LSW - 1] + a[i + LSW] + a[i + LSW + 1];
          b[i] = n === 3 || (n === 2 && a[i]) ? 1 : 0;
        }
      }
      for (let x = 0; x < LSW; x++) { b[x] = b[LSW + x] = b[(LSH - 1) * LSW + x] = b[(LSH - 2) * LSW + x] = 0; }
      for (let y = 0; y < LSH; y++) { b[y * LSW] = b[y * LSW + 1] = b[y * LSW + LSW - 1] = b[y * LSW + LSW - 2] = 0; }
      const tmp = a; a = b; b = tmp;
      // the settling sweep: behind the front the field becomes the target configuration
      const gf = g + 1 - LPRE;
      if (gf >= gA) {
        const R = 14 + 390 * E.ioS(clamp((gf - gA) / (gB - gA)));
        for (let i = 0; i < LSW * LSH; i++) if (DIST[i] < R) a[i] = T[i];
      }
    }
    return (_life = { gens, pops, emits, wordBox, gA, gB });
  }
  const HOT = [255, 204, 132], MINT = [130, 255, 200], DEEP = [84, 236, 196], TRAIL = [26, 110, 150];

  MG.film({
    id: 'lifegame', dur: 10, poster: 9.4,
    fonts: [['900 44px Archivo', 'LIFE'], ['500 30px "Space Grotesk"', 'THE GAME OF LIFE'], ['400 14px "JetBrains Mono"', 'Aa1·/×']],
    meta: {
      family: 'E', name: 'Cellular Automata', sub: 'Conway\'s Game of Life', era: '1970 —',
      origin: 'John Horton Conway devised the Game of Life in 1970 and Martin Gardner published it in his October 1970 "Mathematical Games" column in Scientific American; one rule, B3/S23 on a square grid, produces gliders, guns and self-sustaining machines.',
      works: 'Martin Gardner, Mathematical Games: The fantastic combinations of John Conway\'s new solitaire game "life" (Scientific American, Oct 1970) · Bill Gosper, Gosper glider gun (1970) · Golly (open-source Life simulator) · Stephen Wolfram, A New Kind of Science (2002) · Paul Rendell, Turing machine in Life (2000)',
      tech: ['B3/S23 rule on a bit grid', 'Soft birth/death interpolation', 'Exponential zoom-out'],
      accent: '#76ffc4',
      motionDNA: 'Time is quantised into generations: each tick every cell is born, survives or dies by counting neighbours, and cells ease in and out between ticks while the camera pulls back to show the machines at scale.',
      visualDNA: 'A dark lab grid of square cells glowing like phosphor, hot amber newborns cooling to mint, with mono annotations naming each pattern.',
      transitions: 'Generation tick, exponential zoom-out, chaos burst, settling sweep, block-letter crystallisation',
      implementation: ['Canvas 2D', 'WebGL', 'Golly', 'TouchDesigner'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const cc = offscreen(LW, LH), cg = cc.getContext('2d');
      const bl = offscreen(480, 270);
      return { cc, cg, img: cg.createImageData(LW, LH), bl, bg: bl.getContext('2d') };
    },
    draw(c, t, W, H, st) {
      const sim = lifeSim(), { gens, pops } = sim;
      const gfl = lifeG(t), gi = Math.floor(gfl), fr = gfl - gi;
      const at = k => gens[clamp(gi + LBACK + k, 0, gens.length - 1)];
      const g0 = at(0), g1 = at(1), back = [1, 2, 3, 4, 5, 6].map(k => at(-k));
      const sf = sstep(0, 0.6, fr);
      const data = st.img.data;
      const dimT = 1 - 0.5 * seg(t, 7.6, 8.4), fin = E.ioS(seg(t, 7.7, 8.6)), shx = lerp(-80, LW + 80, E.ioS(seg(t, 8.0, 9.2)));
      for (let i = 0, o = 0; i < LW * LH; i++, o += 4) {
        const B = i >> 3, m = 1 << (i & 7);
        const a0 = (g0[B] & m) ? 1 : 0, a1 = (g1[B] & m) ? 1 : 0;
        if (!a0 && !a1 && !(back[0][B] & m) && !(back[1][B] & m) && !(back[2][B] & m) && !(back[3][B] & m)) { data[o + 3] = 0; continue; }
        const al = a0 + (a1 - a0) * sf;
        let age = 0; if (a0) { age = 1; for (let k = 0; k < 5 && (back[k][B] & m); k++) age++; }
        let tr = 0; for (let k = 0; k < 6; k++) if (back[k][B] & m) { tr = Math.pow(0.6, k + (a0 ? 0 : fr)); break; }
        if (!a0 && a1) tr = 0;
        tr *= 1 - al;
        const ak = Math.min(age, 5) / 5;
        const cr = ak < 0.5 ? lerp(HOT[0], MINT[0], ak * 2) : lerp(MINT[0], DEEP[0], ak * 2 - 1);
        const cg2 = ak < 0.5 ? lerp(HOT[1], MINT[1], ak * 2) : lerp(MINT[1], DEEP[1], ak * 2 - 1);
        const cb = ak < 0.5 ? lerp(HOT[2], MINT[2], ak * 2) : lerp(MINT[2], DEEP[2], ak * 2 - 1);
        let fr2 = cr, fg2 = cg2, fb2 = cb;
        if (fin > 0) {
          const x = i % LW, y = (i / LW) | 0, sh = Math.exp(-Math.pow((x + y * 0.5 - shx) / 16, 2)) * 0.8;
          fr2 = lerp(cr, 168 + 87 * sh, fin); fg2 = lerp(cg2, 255, fin); fb2 = lerp(cb, 220 + 35 * sh, fin);
        }
        const ta = tr * 0.38 * dimT, tot = al + ta;
        if (tot < 0.01) { data[o + 3] = 0; continue; }
        const w = al / tot;
        data[o] = fr2 * w + TRAIL[0] * (1 - w); data[o + 1] = fg2 * w + TRAIL[1] * (1 - w); data[o + 2] = fb2 * w + TRAIL[2] * (1 - w);
        data[o + 3] = Math.min(255, tot * 255);
      }
      st.cg.putImageData(st.img, 0, 0);

      const cam = lCam(t), s = cam.s, ox = W / 2 - cam.cx * s, oy = H / 2 - cam.cy * s;
      c.fillStyle = '#04070b'; c.fillRect(0, 0, W, H);
      const bgg = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 1100);
      bgg.addColorStop(0, 'rgba(20,60,70,0.35)'); bgg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = bgg; c.fillRect(0, 0, W, H);
      // world border
      c.strokeStyle = 'rgba(118,255,196,0.18)'; c.lineWidth = 1;
      c.strokeRect(ox - 0.5, oy - 0.5, LW * s + 1, LH * s + 1);
      const x0 = Math.max(0, Math.floor(-ox / s)), x1 = Math.min(LW, Math.ceil((W - ox) / s)), y0 = Math.max(0, Math.floor(-oy / s)), y1 = Math.min(LH, Math.ceil((H - oy) / s));
      // lab grid
      const ga = clamp((s - 3) / 10) * 0.07;
      if (ga > 0.003) {
        c.strokeStyle = `rgba(140,220,255,${ga})`; c.beginPath();
        for (let x = x0; x <= x1; x++) { c.moveTo(ox + x * s, oy + y0 * s); c.lineTo(ox + x * s, oy + y1 * s); }
        for (let y = y0; y <= y1; y++) { c.moveTo(ox + x0 * s, oy + y * s); c.lineTo(ox + x1 * s, oy + y * s); }
        c.stroke();
      }
      if (s >= 12) {
        // soft cells: born cells grow from the centre, dying cells shrink
        const gap = s * 0.12, d = st.img.data;
        for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
          const i = y * LW + x, o = i * 4, a = d[o + 3];
          if (a < 4) continue;
          const B = i >> 3, m = 1 << (i & 7), a0 = (g0[B] & m) ? 1 : 0, a1 = (g1[B] & m) ? 1 : 0;
          const al = a0 + (a1 - a0) * sf;
          const sz = (s - gap) * (al > 0.02 ? 0.3 + 0.7 * Math.sqrt(al) : 1), px = ox + x * s + s / 2, py = oy + y * s + s / 2;
          c.fillStyle = `rgba(${d[o]},${d[o + 1]},${d[o + 2]},${al > 0.02 ? Math.min(1, 0.25 + al) : a / 255})`;
          c.fillRect(px - sz / 2, py - sz / 2, sz, sz);
        }
      } else {
        c.imageSmoothingEnabled = false;
        c.drawImage(st.cc, ox, oy, LW * s, LH * s);
        c.imageSmoothingEnabled = true;
        const la = clamp((s - 2.6) / 4);
        if (la > 0) {
          c.strokeStyle = `rgba(4,7,11,${la * 0.85})`; c.lineWidth = Math.max(0.6, s * 0.12); c.beginPath();
          for (let x = x0; x <= x1; x++) { c.moveTo(ox + x * s, oy + y0 * s); c.lineTo(ox + x * s, oy + y1 * s); }
          for (let y = y0; y <= y1; y++) { c.moveTo(ox + x0 * s, oy + y * s); c.lineTo(ox + x1 * s, oy + y * s); }
          c.stroke();
        }
      }
      // glow
      const bg = st.bg;
      bg.setTransform(1, 0, 0, 1, 0, 0); bg.clearRect(0, 0, 480, 270);
      bg.imageSmoothingEnabled = true;
      bg.drawImage(st.cc, ox / 4, oy / 4, LW * s / 4, LH * s / 4);
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.filter = 'blur(5px)'; c.globalAlpha = 0.75; c.drawImage(st.bl, 0, 0, W, H);
      c.filter = 'blur(26px)'; c.globalAlpha = 0.5; c.drawImage(st.bl, 0, 0, W, H);
      c.filter = 'none'; c.globalAlpha = 1;
      // settling sweep front
      const sw = seg(t, L_SWEEP[0], L_SWEEP[1]);
      if (sw > 0 && sw < 1) {
        const R = (14 + 390 * E.ioS(sw)) * s, px = ox + 240 * s, py = oy + 136 * s;
        const g = c.createRadialGradient(0, 0, Math.max(0, R - 80), 0, 0, R + 30);
        g.addColorStop(0, 'rgba(118,255,196,0)'); g.addColorStop(0.75, `rgba(200,255,230,${0.3 * (1 - sw)})`); g.addColorStop(1, 'rgba(118,255,196,0)');
        c.save(); c.translate(px, py); c.scale(1, 1 / 1.15);
        c.fillStyle = g; c.fillRect(-px, -py * 1.15, W, H * 1.15);
        c.restore();
      }
      c.restore();
      // annotations in world space
      L_LABELS.forEach(lb => {
        const a = seg(t, lb.a[0], lb.a[0] + 0.3) * (1 - seg(t, lb.a[1] - 0.3, lb.a[1]));
        if (a <= 0) return;
        const gx = lb.x + (lb.move ? lifeG(t) * lb.move : 0);
        const px = ox + gx * s, py = oy + lb.y * s, offx = lb.off ? lb.off[0] : 40, offy = lb.off ? lb.off[1] : -46;
        c.strokeStyle = `rgba(200,255,230,${a * 0.6})`; c.lineWidth = 1;
        c.beginPath(); c.moveTo(px, py); c.lineTo(px + offx * 0.6, py + offy); c.lineTo(px + offx * 0.6 + 14, py + offy); c.stroke();
        c.fillStyle = `rgba(200,255,230,${a})`; c.beginPath(); c.arc(px, py, 2.5, 0, TAU); c.fill();
        text(c, lb.s, px + offx * 0.6 + 20, py + offy + 5, { font: MONO, size: 14, ls: 2, color: `rgba(220,255,238,${a * 0.9})` });
      });
      vignette(c, W, H, 0.62);
      // HUD
      const ov = seg(t, 0.2, 0.7) * (1 - seg(t, 8.0, 8.5)) * 0.7;
      if (ov > 0) {
        const col = `rgba(220,255,238,${ov})`, dim = `rgba(220,255,238,${ov * 0.55})`;
        const gNow = gi + LBACK, pop = pops[clamp(gNow, 0, pops.length - 1)];
        text(c, 'B3/S23', 80, 86, { font: MONO, size: 22, weight: 800, ls: 2, color: col });
        text(c, 'BIRTH ON 3 · SURVIVAL ON 2 OR 3', 80, 112, { font: MONO, size: 12, ls: 2, color: dim });
        text(c, `GEN ${String(gi + LPRE).padStart(4, '0')}`, W - 80, 86, { font: MONO, size: 18, ls: 2, align: 'right', color: col });
        text(c, `POP ${fmtN(pop)}   ·   ${LW}×${LH} = ${fmtN(LW * LH)} CELLS`, W - 80, 112, { font: MONO, size: 12, ls: 2, align: 'right', color: dim });
        // population sparkline
        const px0 = 80, py0 = H - 70, pw = 300, ph = 46, gmax = pops.length - 1;
        let pm = 1; for (const p of pops) pm = Math.max(pm, p);
        c.strokeStyle = `rgba(118,255,196,${ov * 0.9})`; c.lineWidth = 1.5; c.beginPath();
        for (let k = 0; k <= gNow && k <= gmax; k++) { const x = px0 + k / gmax * pw, y = py0 - pops[k] / pm * ph; k ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.stroke();
        c.strokeStyle = `rgba(220,255,238,${ov * 0.25})`; c.beginPath(); c.moveTo(px0, py0 + 0.5); c.lineTo(px0 + pw, py0 + 0.5); c.stroke();
        text(c, 'POPULATION', px0, py0 + 20, { font: MONO, size: 11, ls: 3, color: dim });
        const ph2 = t < 1.9 ? 'CLOSE-UP · GUN FIRING' : t < 5.2 ? 'ZOOM OUT · ×10' : t < L_SWEEP[0] ? 'CHAOS · SETTLING' : 'CRYSTALLISE · STILL LIFES';
        text(c, ph2, W - 80, H - 70, { font: MONO, size: 13, ls: 4, align: 'right', color: col });
      }
      const ta = E.outC(seg(t, 8.25, 9.0));
      if (ta > 0) {
        text(c, 'THE GAME OF LIFE', W / 2 + 10, 958 + (1 - ta) * 12, { font: GROT, weight: 500, size: 30, ls: 20, align: 'center', color: `rgba(230,255,244,${ta})` });
        const sa = E.outC(seg(t, 8.5, 9.2));
        text(c, 'JOHN HORTON CONWAY · 1970 · B3/S23 · BLOCKS AND BLINKERS', W / 2, 994, { font: MONO, size: 13, ls: 3, align: 'center', color: `rgba(118,255,196,${sa * 0.7})` });
      }
      grain(c, W, H, t, 0.04, 'overlay');
    },
    score(A) {
      const sim = lifeSim();
      // generation clock: a tick per generation while the clock is slow enough to hear
      let last = 0;
      for (let t = 0; t < 9.95; t += 0.002) {
        const g = Math.floor(lifeG(t));
        if (g !== last) {
          last = g;
          const rate = kf(t, L_RATE);
          if (rate < 30) {
            const blink = t > 8.1;
            if (blink) A.bell(t, midi(g % 2 ? 81 : 76), { g: 0.035, dur: 1.0, rev: 0.5, pan: g % 2 ? 0.3 : -0.3 });
            else { A.noise(t, { type: 'bandpass', f: 3400, q: 5, dur: 0.025, g: 0.05, pan: -0.1 }); A.osc(t, { f: 1800, dur: 0.03, g: 0.012 }); }
          }
        }
      }
      // glider emissions: plucks, gun A left, gun B right
      const sc = [0, 3, 5, 7, 10, 12, 15];
      sim.emits.forEach((e, k) => {
        let t = 0; while (t < 10 && lifeG(t) < e.g) t += 0.004;
        if (t < 6.8) A.pluck(t, midi(57 + sc[k % 7] + (e.k ? 7 : 0)), { g: 0.13, dur: 1.4, bright: 0.6, pan: e.k ? 0.5 : -0.5, rev: 0.35 });
      });
      A.osc(0, { f: midi(33), dur: 9.8, g: 0.08, a: 1.5, hold: true, rel: 1.0, lp: 260, lp2: 800, lpT: 6 });
      A.chord(0.2, [57, 64, 69], { type: 'sine', dur: 2.2, g: 0.018, a: 0.8, hold: true, rel: 0.6, width: 1.2, rev: 0.6 });
      // zoom out
      A.whoosh(1.9, 3.4, { f1: 200, f2: 3200, g: 0.08, swell: 0.7 });
      A.chord(2.2, [45, 52, 57, 64, 67], { type: 'triangle', dur: 3.0, g: 0.018, a: 1.2, hold: true, rel: 0.8, width: 1.4, rev: 0.6, lp: 1600 });
      // chaos: granular storm following population churn
      for (let k = 0; k < 220; k++) {
        const t = 4.2 + Math.pow(hash(k * 1.37), 0.9) * 2.6;
        A.noise(t, { type: 'bandpass', f: 600 + hash(k * 3.1) * 6000, q: 8, dur: 0.02 + hash(k) * 0.03, g: 0.03, pan: hash(k * 9.3) * 2 - 1 });
      }
      A.noise(4.4, { type: 'lowpass', f: 200, f2: 1200, dur: 2.5, g: 0.09, swell: 0.6 });
      A.osc(4.6, { type: 'sawtooth', f: midi(33), dur: 2.2, g: 0.03, a: 0.8, lp: 300, lp2: 1200, lpT: 1.8 });
      // settle + crystallise
      A.riser(5.9, 1.0, { g: 0.1, f: 55 });
      A.impact(L_SWEEP[0], 0.55);
      A.whoosh(L_SWEEP[0], 0.9, { f1: 5000, f2: 400, g: 0.1, swell: 0.15 });
      A.chord(L_SWEEP[1] - 0.05, [45, 52, 57, 61, 64, 69, 73], { type: 'sine', dur: 2.2, g: 0.03, a: 0.05, rev: 0.7, width: 1.5 });
      A.bell(L_SWEEP[1] - 0.05, midi(88), { g: 0.07, dur: 2.2 });
      A.chord(8.3, [45, 57, 64, 69, 73], { type: 'sine', dur: 1.6, g: 0.024, a: 0.3, hold: true, rel: 0.9, width: 1.4, rev: 0.7 });
    },
  });
})();
