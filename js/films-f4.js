/* batch f4 — Analog & Cinematic: VHS · Film Burn · One-shot. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=VT323&family=Abril+Fatface&family=Bebas+Neue&family=IBM+Plex+Mono:wght@500;600&family=Special+Elite&display=block');
  const PI = Math.PI;

  /* =====================================================================
     VHS ANALOG VIDEO — a home tape is pushed into the deck: blue-back,
     PLAY, a birthday party wobbles in with chroma smear and the camcorder
     date stamp; the candles go out, tracking slips, colour drops away,
     the tape rewinds (candles relight in reverse) and the deck pauses
     on the first frame for the title
     ===================================================================== */
  const VW = 640, VH = 360;           // working raster: roughly VHS luma resolution
  const VS = VW / 1920;
  const VT = { play: 0.62, blow: 3.0, trk: 4.15, trkEnd: 5.3, drop: 5.45, rew: 6.35, rewEnd: 7.75, play2: 7.9, pause: 8.3, title: 8.55 };
  const OSDF = 'VT323, "Courier New", monospace';
  // Tape time: what part of the recording is under the heads at film time t.
  function vhsTape(t) {
    if (t < VT.rew) return Math.max(0, t - VT.play);
    if (t < VT.rewEnd) { const p = (t - VT.rew) / (VT.rewEnd - VT.rew); return lerp(VT.rew - VT.play, 0.25, E.ioS(p)); }
    if (t < VT.play2) return 0.25;
    return 0.25 + Math.min(t, VT.pause) - VT.play2;
  }

  // The recording itself: a living room, a cake, a seven-year-old, a handheld camcorder.
  function vhsScene(g, tau, t) {
    const fq = Math.floor(t * 30);
    // handheld camera: drift + tremor, and the slow camcorder zoom rocker
    const zoom = kf(tau, [[0, 1.0], [1.2, 1.02], [2.2, 1.55, E.ioS], [3.7, 1.55], [4.8, 1.12, E.ioS], [6, 1.08]]);
    const zx = kf(tau, [[0, 960], [1.2, 960], [2.2, 960], [3.7, 980], [4.8, 900]]), zy = kf(tau, [[0, 560], [2.2, 610], [3.7, 600], [4.8, 560]]);
    const hx = vnoise(tau * 0.7, 1) * 30 + vnoise(tau * 6, 2) * 6, hy = vnoise(tau * 0.6, 3) * 22 + vnoise(tau * 7, 4) * 5, rot = vnoise(tau * 0.5, 5) * 0.025;
    g.save();
    g.translate(960 + hx, 540 + hy); g.rotate(rot); g.scale(zoom, zoom); g.translate(-zx, -zy);
    // wall: warm wallpaper under tungsten light
    g.fillStyle = '#c9a275'; g.fillRect(-400, -400, 2720, 1900);
    for (let x = -400; x < 2400; x += 64) { g.fillStyle = 'rgba(150,104,70,0.35)'; g.fillRect(x, -400, 20, 1900); g.fillStyle = 'rgba(255,230,180,0.18)'; g.fillRect(x + 30, -400, 6, 1900); }
    // doorway to a dark hall on the left, a framed picture on the right
    g.fillStyle = '#3a2a22'; g.fillRect(-120, 60, 360, 900); g.fillStyle = '#1a120f'; g.fillRect(-90, 90, 300, 900);
    g.fillStyle = '#e8d8b0'; g.fillRect(1500, 170, 250, 190); g.fillStyle = '#6a8a6a'; g.fillRect(1520, 190, 210, 150);
    g.fillStyle = '#4a6a90'; g.fillRect(1520, 190, 210, 70); g.fillStyle = '#d8b040'; g.beginPath(); g.arc(1660, 230, 18, 0, TAU); g.fill();
    g.strokeStyle = '#5a3a20'; g.lineWidth = 12; g.strokeRect(1500, 170, 250, 190);
    // bunting: HAPPY BIRTHDAY on pennants
    const word = 'HAPPY BIRTHDAY', cols = ['#d83a3a', '#2a6ad0', '#e8c030', '#3aa860'];
    g.strokeStyle = '#f0e0c0'; g.lineWidth = 4; g.beginPath();
    for (let k = 0; k <= 30; k++) { const x = 180 + k * 52, y = 150 + Math.sin(k / 30 * PI) * 90; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    [...word].forEach((ch, i) => {
      const u = (i + 0.5) / word.length, x = 180 + u * 1560, y = 150 + Math.sin(u * PI) * 90, sw = Math.sin(tau * 1.3 + i) * 0.06;
      g.save(); g.translate(x, y); g.rotate(sw);
      if (ch !== ' ') {
        g.fillStyle = cols[i % 4]; g.beginPath(); g.moveTo(-50, 0); g.lineTo(50, 0); g.lineTo(0, 120); g.closePath(); g.fill();
        text(g, ch, 0, 58, { font: 'Arial Black, Impact, sans-serif', weight: 900, size: 58, align: 'center', base: 'middle', color: '#fff6e0' });
      }
      g.restore();
    });
    // balloons bobbing on their strings
    [[300, 330, '#e03838'], [430, 260, '#2c78e0'], [360, 470, '#f0c838'], [1560, 300, '#e04890'], [1690, 410, '#38b060'], [1450, 460, '#e86a28']].forEach(([bx, by, col], i) => {
      const x = bx + Math.sin(tau * 1.1 + i * 2) * 14, y = by + Math.sin(tau * 1.6 + i) * 10;
      g.strokeStyle = 'rgba(240,240,230,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y + 100); g.quadraticCurveTo(x + 20, y + 260, bx + (i < 3 ? 120 : -120), 720); g.stroke();
      g.fillStyle = col; g.beginPath(); g.ellipse(x, y, 76, 92, 0, 0, TAU); g.fill();
      g.beginPath(); g.moveTo(x - 10, y + 96); g.lineTo(x + 10, y + 96); g.lineTo(x, y + 84); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(x - 26, y - 34, 14, 24, -0.5, 0, TAU); g.fill();
    });
    // the birthday kid, leaning in to blow
    const blow = E.ioS(seg(tau, VT.blow - VT.play - 0.25, VT.blow - VT.play + 0.15)) * (1 - E.ioS(seg(tau, VT.blow - VT.play + 0.6, VT.blow - VT.play + 1.1)));
    const kx = 960, ky = 372 + blow * 30;
    const sy0 = 476 + blow * 26;
    g.fillStyle = '#2f8f9a'; g.beginPath(); g.moveTo(kx - 200, 780); g.lineTo(kx - 190, sy0 + 60); g.quadraticCurveTo(kx - 180, sy0, kx - 100, sy0 - 6); g.lineTo(kx + 100, sy0 - 6); g.quadraticCurveTo(kx + 180, sy0, kx + 190, sy0 + 60); g.lineTo(kx + 200, 780); g.closePath(); g.fill();
    // arms resting on the table either side of the cake
    g.strokeStyle = '#2f8f9a'; g.lineWidth = 64; g.lineCap = 'round';
    [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(kx + sd * 160, sy0 + 50); g.quadraticCurveTo(kx + sd * 260, sy0 + 150, kx + sd * 290, 700); g.stroke(); });
    g.fillStyle = '#f0c8a0'; [-1, 1].forEach(sd => { g.beginPath(); g.ellipse(kx + sd * 292, 712, 36, 26, 0, 0, TAU); g.fill(); });
    g.fillStyle = '#f6e27a'; g.beginPath(); g.moveTo(kx - 60, sy0 - 6); g.quadraticCurveTo(kx, sy0 + 60, kx + 60, sy0 - 6); g.closePath(); g.fill();
    g.fillStyle = '#f0c8a0'; g.fillRect(kx - 30, ky + 60, 60, sy0 - ky - 50);
    g.fillStyle = '#f0c8a0'; g.beginPath(); g.ellipse(kx, ky, 80 + blow * 8, 92, 0, 0, TAU); g.fill();
    g.fillStyle = '#5a3420'; g.beginPath(); g.ellipse(kx, ky - 44, 86, 56, 0, PI, TAU); g.fill(); g.fillRect(kx - 86, ky - 46, 26, 60); g.fillRect(kx + 60, ky - 46, 26, 60);
    g.fillStyle = '#2a1a14'; [[-30, 0], [30, 0]].forEach(([ex]) => { g.beginPath(); g.ellipse(kx + ex, ky - 4 + blow * 4, 8, blow > 0.5 ? 3 : 9, 0, 0, TAU); g.fill(); });
    g.fillStyle = '#e88a80'; [[-50, 26], [50, 26]].forEach(([ex, ey]) => { g.beginPath(); g.arc(kx + ex, ky + ey, 14 + blow * 6, 0, TAU); g.fill(); });
    if (blow > 0.4) { g.fillStyle = '#9a3a3a'; g.beginPath(); g.arc(kx, ky + 44, 12, 0, TAU); g.fill(); }
    else { g.strokeStyle = '#9a3a3a'; g.lineWidth = 6; g.beginPath(); g.arc(kx, ky + 30, 26, 0.2, PI - 0.2); g.stroke(); }
    // party hat
    g.save(); g.translate(kx + 20, ky - 92); g.rotate(0.18);
    g.fillStyle = '#e83a8a'; g.beginPath(); g.moveTo(-46, 0); g.lineTo(46, 0); g.lineTo(0, -130); g.closePath(); g.fill();
    g.fillStyle = '#f8e040'; for (let k = 0; k < 3; k++) { const y = -24 - k * 36, w = 40 - k * 12; g.fillRect(-w, y, w * 2, 10); }
    g.fillStyle = '#f8f0e0'; g.beginPath(); g.arc(0, -132, 16, 0, TAU); g.fill();
    g.restore();
    // table and cloth
    g.fillStyle = '#f2ece0'; g.fillRect(-400, 720, 2720, 700);
    for (let x = -400; x < 2400; x += 80) { g.fillStyle = 'rgba(210,60,60,0.55)'; g.fillRect(x, 720, 40, 700); }
    for (let y = 740; y < 1400; y += 80) { g.fillStyle = 'rgba(210,60,60,0.35)'; g.fillRect(-400, y, 2720, 40); }
    // presents
    [[420, 690, 180, 130, '#3a8ad8', '#f8e040'], [1520, 680, 200, 150, '#f8e040', '#e83a3a'], [1700, 720, 140, 100, '#38b060', '#f0f0f0']].forEach(([x, y, w, h, c1, c2]) => {
      g.fillStyle = c1; g.fillRect(x - w / 2, y - h + 60, w, h); g.fillStyle = c2; g.fillRect(x - 12, y - h + 60, 24, h); g.fillRect(x - w / 2, y - h / 2 + 50, w, 20);
      g.beginPath(); g.ellipse(x - 26, y - h + 50, 30, 16, -0.4, 0, TAU); g.ellipse(x + 26, y - h + 50, 30, 16, 0.4, 0, TAU); g.fill();
    });
    // the cake
    const cx = 960, cy = 780;
    g.fillStyle = '#d8d8e0'; g.beginPath(); g.ellipse(cx, cy + 40, 300, 50, 0, 0, TAU); g.fill();
    g.fillStyle = '#fbf3ea'; g.fillRect(cx - 240, cy - 130, 480, 160); g.beginPath(); g.ellipse(cx, cy + 30, 240, 40, 0, 0, PI); g.fill();
    g.beginPath(); g.ellipse(cx, cy - 130, 240, 40, 0, 0, TAU); g.fill();
    g.fillStyle = '#f08ab0'; for (let k = 0; k < 13; k++) { const a = PI * (k / 12), x = cx - Math.cos(a) * 236, y = cy - 120 + Math.sin(a) * 38; g.beginPath(); g.arc(x, y, 18, 0, TAU); g.fill(); }
    g.fillStyle = '#7ac0e8'; for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(cx - 200 + k * 50, cy - 40 + (k % 2) * 12, 9, 0, TAU); g.fill(); }
    // candles: lit, blown out (smoke), and relit when the tape runs backwards
    const out = tau > VT.blow - VT.play + 0.12;
    const lean = blow;
    for (let k = 0; k < 7; k++) {
      const x = cx - 150 + k * 50, y = cy - 140 + Math.sin(k / 6 * PI) * 18;
      g.fillStyle = cols[k % 4]; g.fillRect(x - 7, y - 90, 14, 90);
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x - 7, y - 90, 4, 90);
      if (!out) {
        const fl = 1 + 0.25 * hash(fq * 3 + k), lx = lean * 26;
        const gr = g.createRadialGradient(x + lx * 0.6, y - 120, 4, x + lx * 0.6, y - 120, 90);
        gr.addColorStop(0, 'rgba(255,200,120,0.22)'); gr.addColorStop(1, 'rgba(255,160,80,0)');
        g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - 100, y - 220, 200, 200); g.restore();
        g.fillStyle = '#ffc040'; g.beginPath(); g.moveTo(x - 9, y - 100); g.quadraticCurveTo(x - 16 + lx, y - 128 * fl, x + lx * 1.6, y - 100 - 62 * fl * (1 - lean * 0.5)); g.quadraticCurveTo(x + 16 + lx, y - 128 * fl, x + 9, y - 100); g.fill();
        g.fillStyle = '#fffbe8'; g.beginPath(); g.ellipse(x + lx * 0.5, y - 112, 4, 10, 0, 0, TAU); g.fill();
      } else {
        const st = tau - (VT.blow - VT.play + 0.12);
        g.strokeStyle = `rgba(230,230,235,${0.5 * Math.exp(-st * 0.8)})`; g.lineWidth = 6; g.lineCap = 'round';
        g.beginPath();
        for (let j = 0; j <= 10; j++) { const yy = y - 96 - j * 22 * Math.min(1, st * 1.4 + 0.2), xx = x + Math.sin(j * 0.8 + st * 3 + k) * j * 3; j ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
        g.stroke();
      }
    }
    // somebody walks right through the shot
    const wk = seg(tau, 4.0, 5.0);
    if (wk > 0 && wk < 1) { const x = lerp(-500, 2500, wk); g.fillStyle = 'rgba(36,26,30,0.92)'; g.beginPath(); g.ellipse(x, 700, 360, 900, 0.1, 0, TAU); g.fill(); }
    g.restore();
    // on-camera light: hot centre, falling off at the corners
    const lg = g.createRadialGradient(960, 560, 120, 960, 560, 1150);
    lg.addColorStop(0, 'rgba(255,240,210,0.16)'); lg.addColorStop(0.6, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(10,5,0,0.6)');
    g.fillStyle = lg; g.fillRect(0, 0, 1920, 1080);
    // camcorder date stamp, recorded into the picture
    const pm = 'PM 7:' + String(42 + Math.floor((tau + 3) / 60)).padStart(2, '0');
    text(g, pm, 1680, 920, { font: OSDF, size: 76, align: 'right', color: '#f6f0d8', stroke: 'rgba(0,0,0,0.6)', lw: 6, ls: 4 });
    text(g, 'JUL.14 1989', 1680, 990, { font: OSDF, size: 76, align: 'right', color: '#f6f0d8', stroke: 'rgba(0,0,0,0.6)', lw: 6, ls: 4 });
  }

  // Composite-video decode on the working raster: YIQ split, smeared and delayed chroma,
  // luma ringing, timebase wobble, tracking band, head-switching, dropouts and search bars.
  function vhsDecode(st, t, P) {
    const { sg, id, Y, I, Q, pI, pQ, NZ } = st;
    const src = sg.getImageData(0, 0, VW, VH).data, d = id.data;
    const f = Math.floor(t * 30), NM = NZ.length - 1;
    let nz = (f * 7919) & NM;
    const rnd = () => (nz = (nz + 1) & NM, NZ[nz]);
    // per-frame dropouts: short white streaks with a comet tail
    const R = rng(f * 131 + 17), drops = [];
    const nd = P.drop * (2 + R() * 6) | 0;
    for (let k = 0; k < nd; k++) drops.push([R() * VH | 0, R() * VW | 0, 10 + R() * 90 | 0]);
    pI.fill(0); pQ.fill(0);
    for (let y = 0; y < VH; y++) {
      // vertical roll: rows inside the blanking bar are black
      let sy = y + P.roll;
      sy = ((sy % (VH + 24)) + VH + 24) % (VH + 24);
      const o = y * VW * 4;
      if (sy >= VH) { for (let x = 0; x < VW; x++) { d[o + x * 4] = d[o + x * 4 + 1] = d[o + x * 4 + 2] = 6; d[o + x * 4 + 3] = 255; } continue; }
      // horizontal timebase error
      let off = vnoise(y * 0.045 + f * 0.31, 3) * P.wob + vnoise(f * 0.5, 9) * P.wob * 0.6;
      // head-switching: the last lines of the field tear sideways
      const hs = VH - y;
      if (hs < 9) off += (9 - hs) * 2.6 + rnd() * 6;
      // flagging at the top of the frame
      if (y < 14) off += (14 - y) * (14 - y) * 0.035 * P.flag;
      // tracking band(s)
      let band = 0;
      for (let b = 0; b < P.bands.length; b++) {
        const [by, bh, bs] = P.bands[b], dd = Math.abs(y - by);
        if (dd < bh) band = Math.max(band, bs * (1 - dd / bh));
      }
      if (band > 0) off += (vnoise(y * 0.7 + f, 4) * 26 + rnd() * 8) * band;
      const io = Math.round(off), sro = sy * VW * 4;
      // luma / chroma split
      for (let x = 0; x < VW; x++) {
        let sx = x - io; sx = sx < 0 ? 0 : sx >= VW ? VW - 1 : sx;
        const s = sro + sx * 4, r = src[s], g = src[s + 1], b = src[s + 2];
        Y[x] = 0.299 * r + 0.587 * g + 0.114 * b;
        I[x] = 0.596 * r - 0.274 * g - 0.322 * b;
        Q[x] = 0.211 * r - 0.523 * g + 0.312 * b;
      }
      // chroma: wide box blur (≈0.5 MHz bandwidth), delayed to the right, comb-averaged with the line above
      const CR = 9, sh = P.cshift;
      let aI = 0, aQ = 0;
      for (let x = -CR; x <= CR; x++) { const xx = x < 0 ? 0 : x; aI += I[xx]; aQ += Q[xx]; }
      // per-line chroma phase noise: horizontal colour streaks
      const cn = vnoise(y * 0.11 + f * 0.7, 7) * 14 * P.cnoise, csat = P.sat;
      for (let x = 0; x < VW; x++) {
        pI[x] = pI[x] * 0.5 + aI / (2 * CR + 1) * 0.5; pQ[x] = pQ[x] * 0.5 + aQ / (2 * CR + 1) * 0.5;
        const xa = Math.min(VW - 1, x + CR + 1), xr = Math.max(0, x - CR);
        aI += I[xa] - I[xr]; aQ += Q[xa] - Q[xr];
      }
      // luma: soften, then the edge-enhancement halo VCRs add back
      const nA = P.noise, white = band > 0.35;
      for (let x = 0; x < VW; x++) {
        const ys = (Y[Math.max(0, x - 2)] + Y[Math.max(0, x - 1)] * 2 + Y[x] * 2 + Y[Math.min(VW - 1, x + 1)] * 2 + Y[Math.min(VW - 1, x + 2)]) * 0.125;
        const yw = (Y[Math.max(0, x - 6)] + Y[Math.max(0, x - 3)] + Y[x] + Y[Math.min(VW - 1, x + 3)] + Y[Math.min(VW - 1, x + 6)]) * 0.2;
        let L = ys + (ys - yw) * P.sharp;
        L += (rnd() - 0.5) * nA;
        if (band > 0) { const sn = rnd(); L = lerp(L, sn < 0.5 ? 20 : sn * 255, band * 0.85); }
        if (white && rnd() < 0.02 * band) L = 255;
        // read chroma shifted right
        const cx = x - sh < 0 ? 0 : x - sh;
        const ci2 = (pI[cx] + cn) * csat, cq = pQ[cx] * csat;
        let r = L + 0.956 * ci2 + 0.621 * cq, g = L - 0.272 * ci2 - 0.647 * cq, b = L - 1.106 * ci2 + 1.703 * cq;
        // brightness / lift
        r = r * P.gain + P.lift; g = g * P.gain + P.lift; b = b * P.gain + P.lift * 1.3;
        const p = o + x * 4;
        d[p] = r < 0 ? 0 : r > 255 ? 255 : r; d[p + 1] = g < 0 ? 0 : g > 255 ? 255 : g; d[p + 2] = b < 0 ? 0 : b > 255 ? 255 : b; d[p + 3] = 255;
      }
    }
    // dropouts
    drops.forEach(([y, x0, len]) => {
      for (let k = 0; k < len && x0 + k < VW; k++) {
        const p = (y * VW + x0 + k) * 4, a = k < 3 ? 1 : Math.exp(-(k - 3) / (len * 0.35));
        for (let ch = 0; ch < 3; ch++) d[p + ch] = lerp(d[p + ch], 250, a);
      }
    });
    st.pg.putImageData(id, 0, 0);
  }

  function osd(c, s, x, y, size, o = {}) {
    text(c, s, x + 4, y + 4, { font: OSDF, size, align: o.align, color: 'rgba(0,0,0,0.7)', ls: o.ls ?? 4 });
    text(c, s, x, y, { font: OSDF, size, align: o.align, color: o.color || '#f4f4f4', stroke: '#101010', lw: 5, ls: o.ls ?? 4 });
  }

  MG.film({
    id: 'vhs', dur: 10, poster: 9.4,
    fonts: [['400 80px VT323', 'PLAY▶ JUL.14 1989']],
    meta: {
      family: 'F', name: 'VHS Analog Video', sub: 'Home Video on Tape', era: '1976 —',
      origin: 'JVC launched the VHS cassette in Japan in 1976, and by the mid-1980s VHS-C and full-size camcorders had put a video camera in millions of homes. Its colour-under recording keeps luma at roughly 240 lines and squeezes chroma into a narrow band, so colours smear and lag; helical-scan heads leave tracking bands and switching noise. Analog-horror and retro music videos later rebuilt these faults on purpose.',
      works: 'JVC HR-3300 "Vidstar" (first VHS deck, 1976) · Videodrome (David Cronenberg, 1983) · America\'s Funniest Home Videos (ABC, 1989 —) · V/H/S (2012) · Too Many Cooks (Casper Kelly, Adult Swim, 2014) · Local 58 (Kris Straub, 2015)',
      tech: ['YIQ chroma bleed & delay', 'Tracking error & head-switching noise', 'Timebase wobble & dropouts', 'Crisp VCR on-screen display'],
      accent: '#2f4bd8',
      motionDNA: 'Handheld drift and a slow camcorder zoom, interrupted by the machine: picture rolls in after PLAY, tracking bands crawl through, the tape searches backwards with noise bars, and PAUSE freezes a jittering frame.',
      visualDNA: 'Soft, haloed luma with colours smeared to the right of their objects, warm tungsten light and an on-camera hotspot, a burned-in camcorder date stamp, torn bottom lines, white dropout streaks, and a razor-sharp VCR OSD floating on top.',
      transitions: 'Blue-back to PLAY roll, tracking slip, chroma loss, rewind search, pause freeze',
      implementation: ['Camcorder + VCR (dub generations)', 'After Effects (VHS presets, ntscQT)', 'Canvas 2D (per-line YIQ decode)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const src = offscreen(VW, VH), proc = offscreen(VW, VH);
      const sg = src.getContext('2d', { willReadFrequently: true }), pg = proc.getContext('2d');
      const r = rng(1976), NZ = new Float32Array(1 << 17);
      for (let i = 0; i < NZ.length; i++) NZ[i] = r();
      // scanline mask at full res
      const scan = offscreen(1920, 1080), s2 = scan.getContext('2d');
      for (let y = 0; y < 1080; y += 3) { s2.fillStyle = 'rgba(0,0,0,0.22)'; s2.fillRect(0, y, 1920, 1); }
      return { src, proc, sg, pg, id: pg.createImageData(VW, VH), Y: new Float32Array(VW), I: new Float32Array(VW), Q: new Float32Array(VW), pI: new Float32Array(VW), pQ: new Float32Array(VW), NZ, scan };
    },
    draw(c, t, W, H, st) {
      const f = Math.floor(t * 30);
      const blue = t < VT.play || (t >= VT.rewEnd && t < VT.play2);
      if (blue) {
        // the deck's blue-back screen
        c.fillStyle = '#1d2fc4'; c.fillRect(0, 0, W, H);
        const gr = c.createRadialGradient(960, 540, 200, 960, 540, 1200); gr.addColorStop(0, 'rgba(60,90,255,0.25)'); gr.addColorStop(1, 'rgba(0,0,40,0.4)');
        c.fillStyle = gr; c.fillRect(0, 0, W, H);
      } else {
        const tau = vhsTape(t);
        // the recording
        const sg = st.sg;
        sg.setTransform(VS, 0, 0, VS, 0, 0);
        vhsScene(sg, tau, t >= VT.pause ? VT.pause : t);
        // what the deck is doing to it
        const P = { roll: 0, wob: 1.4, flag: 1, bands: [], drop: 0.6, cshift: 4, cnoise: 0.4, sat: 1.25, sharp: 1.1, noise: 14, gain: 1, lift: 4 };
        // picture rolls in after PLAY and settles
        if (t < VT.play + 0.55) { const u = seg(t, VT.play, VT.play + 0.55); P.roll = Math.round((1 - E.outQ(u)) * (VH + 24) * 1.6); P.noise = 60 * (1 - u) + 14; P.bands.push([VH * (0.3 + 0.5 * u), 30, 1 - u]); P.sat = 1.25 * u; }
        if (t >= VT.play2 && t < VT.play2 + 0.35) { const u = seg(t, VT.play2, VT.play2 + 0.35); P.roll = Math.round((1 - E.outQ(u)) * (VH + 24)); P.noise = 40; }
        // tracking slips: a band crawls up the frame, then the user rides the tracking knob back
        if (t >= VT.trk && t < VT.trkEnd) {
          const u = seg(t, VT.trk, VT.trkEnd), s = Math.sin(u * PI);
          P.bands.push([lerp(VH + 20, 0.62 * VH, E.outQ(u)) - u * 60, 26 + 30 * s, Math.min(1, s * 1.6)]);
          P.bands.push([VH - 12, 16, s * 0.8]);
          P.wob = 1.4 + 7 * s; P.drop = 3 * s + 0.6; P.flag = 1 + 6 * s;
        }
        // dropout burst and colour killer: chroma falls out, then comes back
        if (t >= VT.drop && t < VT.rew) {
          const u = seg(t, VT.drop, VT.rew);
          P.drop = 6 * (1 - u) + 1; if (t < VT.drop + 0.6) P.sat = Math.floor(t * 15) % 4 === 0 ? 0.6 : 0.02;
          P.cnoise = 1.5;
        }
        // rewind search: three noise bars crawling, picture racing backwards, unstable sync
        if (t >= VT.rew && t < VT.rewEnd) {
          const ph = (t - VT.rew) * 0.6;
          for (let k = 0; k < 3; k++) P.bands.push([((k / 3 + ph) % 1) * (VH + 40) - 20, 14, 1]);
          P.wob = 5; P.flag = 6; P.noise = 30; P.sat = 0.9; P.roll = Math.round(vnoise(t * 8, 3) * 3);
        }
        // pause: a frozen field with one noise bar and vertical jitter
        if (t >= VT.pause) {
          P.bands.push([VH * 0.78 + vnoise(t * 3, 5) * 3, 9, 0.95]);
          P.roll = (f % 2) ? 1 : 0; P.drop = 0.3; P.wob = 2;
        }
        vhsDecode(st, t, P);
        c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
        c.drawImage(st.proc, 0, 0, W, H);
        c.restore();
        c.save(); c.globalCompositeOperation = 'multiply'; c.drawImage(st.scan, 0, 0); c.restore();
      }
      // a soft CRT bloom and edge fall-off
      vignette(c, W, H, 0.45, '0,0,10');
      // ---- the VCR's on-screen display: crisp, generated after the tape ----
      const cnt = (s => `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(Math.floor(s) % 60).padStart(2, '0')}`)(Math.max(0, 754 + vhsTape(t)));
      if (t > 0.15 && t < 2.6 && Math.floor(t * 2) % 4 !== 3 || (t > 0.15 && t < 0.9)) osd(c, 'PLAY ▶', 110, 140, 96);
      if (t > 0.15 && t < 2.6) osd(c, 'SP  ' + cnt, 1810, 140, 72, { align: 'right' });
      if (t >= VT.trk + 0.25 && t < VT.trkEnd + 0.5) {
        osd(c, 'TRACKING', 960, 760, 84, { align: 'center' });
        const lvl = Math.round(kf(t, [[VT.trk + 0.25, 7], [VT.trk + 0.6, 2], [VT.trk + 0.9, 9], [VT.trkEnd - 0.1, 5]]));
        let bar = '-'; for (let k = 0; k < 12; k++) bar += k === lvl ? '█' : '▪'; bar += '+';
        osd(c, bar, 960, 850, 72, { align: 'center', ls: 2 });
      }
      if (t >= VT.rew && t < VT.rewEnd) { osd(c, '◀◀ REW', 110, 140, 96); osd(c, 'SP  ' + cnt, 1810, 140, 72, { align: 'right' }); }
      if (t >= VT.rewEnd && t < VT.play2) osd(c, 'STOP ■', 110, 140, 96);
      if (t >= VT.play2 && t < VT.pause) osd(c, 'PLAY ▶', 110, 140, 96);
      if (t >= VT.pause) {
        if (Math.floor((t - VT.pause) * 2) % 2 === 0 || t > VT.title + 0.5) osd(c, 'PAUSE ❚❚', 110, 140, 96);
        osd(c, 'SP  ' + cnt, 1810, 140, 72, { align: 'right' });
      }
      // ---- title, typed by the deck's character generator ----
      if (t >= VT.title) {
        const n = Math.floor((t - VT.title) * 60);
        const L1 = 'VHS', L2 = 'ANALOG VIDEO', L3 = 'HOME VIDEO ON TAPE · 1976—';
        c.save();
        c.fillStyle = `rgba(10,14,60,${0.5 * seg(t, VT.title, VT.title + 0.2)})`; c.fillRect(0, 330, W, 420);
        c.restore();
        osd(c, L1.slice(0, n), 960, 520, 230, { align: 'center', ls: 30 });
        osd(c, L2.slice(0, Math.max(0, n - 3)), 960, 640, 120, { align: 'center', ls: 16 });
        if (n > 15) osd(c, L3.slice(0, n - 15), 960, 715, 54, { align: 'center', color: '#c8d0ff', ls: 6 });
      }
      // slight phosphor glow on blue-back
      if (blue) grain(c, W, H, t, 0.05, 'overlay');
      void hash; void midi;
    },
    score(A) {
      A.bus.gain.value = 0.9;
      // deck: cassette pushed in, the mechanism threads the tape
      A.noise(0.0, { type: 'lowpass', f: 900, dur: 0.12, g: 0.35 });
      A.osc(0.02, { type: 'triangle', f: 120, f2: 60, dur: 0.15, g: 0.35 });
      A.osc(0.12, { type: 'square', f: 70, f2: 110, glide: 0.4, dur: 0.45, g: 0.05, lp: 500 });
      A.noise(0.5, { type: 'bandpass', f: 2600, q: 3, dur: 0.03, g: 0.18 });
      // tape bed: hiss and mains hum for the whole recording
      A.noise(VT.play, { type: 'highpass', f: 4200, dur: 10 - VT.play, g: 0.035, hold: true, rel: 0.2 });
      A.osc(VT.play, { f: 60, dur: 10 - VT.play, g: 0.035, hold: true, rel: 0.2 });
      A.osc(VT.play, { f: 180, dur: 10 - VT.play, g: 0.008, hold: true, rel: 0.2 });
      // party room tone
      A.noise(VT.play + 0.1, { type: 'bandpass', f: 700, q: 0.6, dur: VT.rew - VT.play - 0.1, g: 0.05, hold: true, rel: 0.1 });
      // "Happy Birthday" on a toy keyboard, with tape wow & flutter
      const HB = [[67, 0.75], [67, 0.25], [69, 1], [67, 1], [72, 1], [71, 2], [67, 0.75], [67, 0.25], [69, 1], [67, 1], [74, 1], [72, 1.5]];
      let tb = VT.play + 0.15;
      const beat = 0.185;
      HB.forEach(([m, d]) => {
        A.osc(tb, { type: 'square', f: midi(m), dur: d * beat * 0.95, g: 0.05, lp: 1700, vib: [0.9, 3.5], hold: true, rel: 0.03 });
        A.osc(tb, { type: 'triangle', f: midi(m - 12), dur: d * beat * 0.95, g: 0.07, vib: [0.9, 1.8], hold: true, rel: 0.03 });
        tb += d * beat;
      });
      [60, 64, 67].forEach(m => A.osc(VT.play + 0.15, { type: 'triangle', f: midi(m - 12), dur: 1.1, g: 0.03, vib: [0.9, 1.2], hold: true, rel: 0.2 }));
      [65, 69, 72].forEach(m => A.osc(VT.play + 1.25, { type: 'triangle', f: midi(m - 12), dur: 1.1, g: 0.03, vib: [0.9, 1.2], hold: true, rel: 0.2 }));
      // the blow, then clapping and cheering
      A.noise(VT.blow - 0.2, { type: 'lowpass', f: 1400, dur: 0.5, g: 0.18, swell: 0.4 });
      for (let k = 0; k < 34; k++) A.clap(VT.blow + 0.3 + hash(k * 3.1) * 1.0, 0.04 + hash(k) * 0.05, { rev: 0.05 });
      A.noise(VT.blow + 0.25, { type: 'bandpass', f: 1500, q: 0.8, dur: 1.2, g: 0.08, swell: 0.3 });
      // tracking slip: crackle, warble and a buzz as the band crosses the sync
      for (let k = 0; k < 18; k++) A.noise(VT.trk + hash(k * 1.7) * 1.1, { type: 'bandpass', f: 1500 + hash(k) * 4000, q: 2, dur: 0.03, g: 0.08 });
      A.osc(VT.trk, { type: 'sawtooth', f: 60, dur: 1.1, g: 0.03, lp: 1200, a: 0.2, hold: true, rel: 0.2 });
      A.noise(VT.trk, { type: 'bandpass', f: 3000, q: 0.5, dur: 1.1, g: 0.05, swell: 0.5 });
      // dropout pops
      for (let k = 0; k < 8; k++) A.noise(VT.drop + k * 0.11, { type: 'highpass', f: 2000, dur: 0.02, g: 0.12 });
      // rewind: clunk, motor spinning up, search chatter
      A.osc(VT.rew, { type: 'triangle', f: 140, f2: 70, dur: 0.12, g: 0.3 });
      A.osc(VT.rew + 0.05, { type: 'sawtooth', f: 180, f2: 620, glide: 0.8, dur: VT.rewEnd - VT.rew, g: 0.03, lp: 1400, hold: true, rel: 0.15 });
      A.noise(VT.rew + 0.05, { type: 'bandpass', f: 1800, f2: 3200, q: 1.5, dur: VT.rewEnd - VT.rew, g: 0.06, hold: true, rel: 0.1 });
      for (let k = 0; k < 26; k++) A.noise(VT.rew + 0.1 + k * 0.05, { type: 'bandpass', f: 5000, q: 4, dur: 0.012, g: 0.05 });
      // stop, play, pause clunks
      [VT.rewEnd, VT.play2, VT.pause].forEach(tt => { A.osc(tt, { type: 'triangle', f: 160, f2: 80, dur: 0.1, g: 0.3 }); A.noise(tt, { type: 'lowpass', f: 1200, dur: 0.05, g: 0.2 }); });
      // a few notes of the tape again before PAUSE
      A.osc(VT.play2 + 0.1, { type: 'square', f: midi(67), dur: 0.2, g: 0.04, lp: 1600, vib: [0.9, 4], hold: true });
      // title: soft character-generator blips and a warm synth pad
      for (let k = 0; k < 14; k++) A.osc(VT.title + k / 30 * 1.6, { type: 'square', f: 1200, dur: 0.02, g: 0.02, lp: 3000 });
      A.chord(VT.title + 0.1, [60, 64, 67, 71], { type: 'sawtooth', dur: 1.4, g: 0.025, lp: 1400, a: 0.3, hold: true, rel: 0.4, spread: 8, vib: [0.8, 2], rev: 0.5, width: 0.7 });
      A.osc(VT.title + 0.1, { type: 'triangle', f: midi(36), dur: 1.4, g: 0.12, a: 0.05, hold: true, rel: 0.4 });
    },
  });
  /* =====================================================================
     FILM BURN — a 35mm print on a desert highway at dusk: light leaks
     breathe at the gate, the framing slips, then the film jams, the lamp
     blisters the emulsion and melts a hole through the frame; the strip
     loses its loop into flash frames, and the reel runs out on the title
     ===================================================================== */
  const FB = { slip: 2.95, slipEnd: 3.55, jam: 4.0, burn: 4.2, white: 6.55, loop: 6.95, title: 7.75, cue1: 8.2, cue2: 9.22 };
  const FBT = 'Abril Fatface, Georgia, serif', FBS = '"Special Elite", "Courier New", monospace';
  // Projected frame time: 24 fps, stops when the film jams.
  const fbFrame = t => (t < FB.jam ? Math.floor(t * 24) : t < FB.title ? Math.floor(FB.jam * 24) : Math.floor(t * 24));
  // The shot: camera on the blacktop behind a grey car, telephone poles ticking past.
  function fbScene(g, tau) {
    const HZ = 560, F = 900, CH = 1.4, sp = 14, z0 = tau * sp;
    const sky = g.createLinearGradient(0, 0, 0, HZ);
    sky.addColorStop(0, '#24405a'); sky.addColorStop(0.45, '#7a6a72'); sky.addColorStop(0.8, '#e08048'); sky.addColorStop(1, '#ffc070');
    g.fillStyle = sky; g.fillRect(0, 0, 1920, HZ + 2);
    // sun and its bloom
    const sg = g.createRadialGradient(1300, 470, 20, 1300, 470, 520);
    sg.addColorStop(0, 'rgba(255,240,200,1)'); sg.addColorStop(0.12, 'rgba(255,214,140,0.9)'); sg.addColorStop(0.4, 'rgba(255,150,70,0.35)'); sg.addColorStop(1, 'rgba(255,120,60,0)');
    g.fillStyle = sg; g.fillRect(700, 0, 1220, HZ);
    g.fillStyle = '#fff4dc'; g.beginPath(); g.arc(1300, 470, 54, 0, TAU); g.fill();
    // streaked clouds
    g.fillStyle = 'rgba(120,70,90,0.45)';
    [[300, 170, 520, 16], [900, 120, 700, 10], [1500, 220, 600, 14], [600, 300, 420, 8]].forEach(([x, y, w, h]) => { g.beginPath(); g.ellipse(x - tau * 4, y, w / 2, h, 0, 0, TAU); g.fill(); });
    // mesas
    const mesa = (pts, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, HZ + 2); pts.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(1920, HZ + 2); g.closePath(); g.fill(); };
    mesa([[0, 520], [180, 515], [220, 470], [470, 466], [520, 520], [800, 530], [1050, 528], [1100, 492], [1260, 488], [1300, 530], [1600, 520], [1660, 480], [1920, 476]], '#7a4a5a');
    mesa([[0, 548], [340, 540], [380, 512], [560, 510], [600, 548], [1500, 552], [1540, 526], [1760, 522], [1800, 552], [1920, 552]], '#5a3040');
    // desert floor
    const gr = g.createLinearGradient(0, HZ, 0, 1080);
    gr.addColorStop(0, '#c07848'); gr.addColorStop(0.3, '#9a5232'); gr.addColorStop(1, '#4a2014');
    g.fillStyle = gr; g.fillRect(0, HZ, 1920, 1080 - HZ);
    // scrub, streaming past
    for (let k = 0; k < 90; k++) {
      const wz = ((hash(k * 1.3) * 200 - z0) % 200 + 200) % 200 + 4, wx = (hash(k * 7.7) - 0.5) * 120;
      if (Math.abs(wx) < 6) continue;
      const x = 960 + wx * F / wz, y = HZ + CH * F / wz, s = 0.9 * F / wz;
      g.fillStyle = 'rgba(60,40,24,0.75)'; g.beginPath(); g.ellipse(x, y - s * 0.3, s, s * 0.45, 0, 0, TAU); g.fill();
    }
    // the road
    g.fillStyle = '#3a2c2c'; g.beginPath(); g.moveTo(960 - 3.6 * F / 1.6, HZ + CH * F / 1.6); g.lineTo(958, HZ); g.lineTo(962, HZ); g.lineTo(960 + 3.6 * F / 1.6, HZ + CH * F / 1.6); g.closePath(); g.fill();
    const rg = g.createLinearGradient(0, HZ, 0, 1080); rg.addColorStop(0, 'rgba(255,190,120,0.55)'); rg.addColorStop(0.25, 'rgba(255,170,110,0.1)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fill();
    // centre dashes rushing toward the lens
    g.fillStyle = '#e8c860';
    for (let k = 0; k < 16; k++) {
      const za = ((k * 9 - z0) % 144 + 144) % 144 + 1.2, zb = za + 3.5;
      const ya = HZ + CH * F / za, yb = HZ + CH * F / zb, wa = 0.08 * F / za, wb = 0.08 * F / zb;
      g.beginPath(); g.moveTo(960 - wa, ya); g.lineTo(960 - wb, yb); g.lineTo(960 + wb, yb); g.lineTo(960 + wa, ya); g.closePath(); g.fill();
    }
    // telephone poles and their sagging wires
    const poles = [];
    for (let k = 0; k < 10; k++) { const z = ((k * 22 - z0) % 220 + 220) % 220 + 2; poles.push(z); }
    poles.sort((a, b) => b - a);
    g.strokeStyle = 'rgba(30,18,20,0.8)'; g.lineWidth = 1.6;
    const top = z => [960 + 7.5 * F / z, HZ - (8 - CH) * F / z];
    for (let i = 0; i < poles.length - 1; i++) {
      if (poles[i + 1] > poles[i]) continue;
      const [x0, y0] = top(poles[i]), [x1, y1] = top(poles[i + 1]);
      for (let w = 0; w < 2; w++) { g.beginPath(); g.moveTo(x0, y0 + w * 14 * F / poles[i] / 30); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 40, x1, y1 + w * 14 * F / poles[i + 1] / 30); g.stroke(); }
    }
    poles.forEach(z => {
      const [x, y] = top(z), yb = HZ + CH * F / z, w = Math.max(1.5, 0.22 * F / z);
      g.fillStyle = '#2a1a18'; g.fillRect(x - w / 2, y, w, yb - y);
      g.fillRect(x - w * 4, y + w * 1.5, w * 8, w * 0.8);
    });
    // the car ahead, drifting in its lane
    const cz = 24 + Math.sin(tau * 0.7) * 2, cxw = -0.9 + Math.sin(tau * 0.5) * 0.3;
    const cx = 960 + cxw * F / cz, cyb = HZ + CH * F / cz, cw = 1.9 * F / cz, chh = 1.25 * F / cz;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(cx, cyb, cw * 0.62, chh * 0.12, 0, 0, TAU); g.fill();
    g.fillStyle = '#4a4648'; g.beginPath(); g.moveTo(cx - cw / 2, cyb - chh * 0.1); g.lineTo(cx - cw / 2, cyb - chh * 0.55); g.lineTo(cx - cw * 0.34, cyb - chh * 0.62); g.lineTo(cx - cw * 0.26, cyb - chh); g.lineTo(cx + cw * 0.26, cyb - chh); g.lineTo(cx + cw * 0.34, cyb - chh * 0.62); g.lineTo(cx + cw / 2, cyb - chh * 0.55); g.lineTo(cx + cw / 2, cyb - chh * 0.1); g.closePath(); g.fill();
    g.fillStyle = '#e8a070'; g.fillRect(cx - cw * 0.22, cyb - chh * 0.94, cw * 0.44, chh * 0.26);
    g.fillStyle = '#1a1414'; g.fillRect(cx - cw * 0.46, cyb - chh * 0.12, cw * 0.18, chh * 0.14); g.fillRect(cx + cw * 0.28, cyb - chh * 0.12, cw * 0.18, chh * 0.14);
    [-1, 1].forEach(s => {
      const lx = cx + s * cw * 0.4, ly = cyb - chh * 0.42;
      const lg = g.createRadialGradient(lx, ly, 1, lx, ly, cw * 0.4); lg.addColorStop(0, 'rgba(255,60,40,0.9)'); lg.addColorStop(1, 'rgba(255,40,30,0)');
      g.fillStyle = lg; g.fillRect(lx - cw * 0.4, ly - cw * 0.4, cw * 0.8, cw * 0.8);
      g.fillStyle = '#ff5a40'; g.fillRect(lx - cw * 0.06, ly - chh * 0.05, cw * 0.12, chh * 0.1);
    });
    // print stock: warm lifted blacks
    g.fillStyle = 'rgba(70,30,10,0.12)'; g.fillRect(0, 0, 1920, 1080);
  }
  // Light leaks: fogged edges where light got to the raw stock — hot yellow cores bleeding to red.
  // Drawn additively into a quarter-res buffer (leaks are soft anyway), then screened over the frame once.
  function fbLeaks(c0, t, I, st, sweep) {
    if (I <= 0 && sweep === undefined) return;
    const f = Math.floor(t * 24), c = st.lg;
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.fillStyle = '#000'; c.fillRect(0, 0, 480, 270);
    c.setTransform(0.25, 0, 0, 0.25, 0, 0);
    c.save(); c.globalCompositeOperation = 'lighter';
    // edge bands, as when a camera door was opened a crack
    const bandL = c.createLinearGradient(0, 0, 760, 0), aL = Math.min(1, I * (0.85 + 0.3 * vnoise(t * 1.7, 4)));
    bandL.addColorStop(0, `rgba(255,120,40,${aL})`); bandL.addColorStop(0.35, `rgba(230,40,10,${aL * 0.6})`); bandL.addColorStop(1, 'rgba(160,0,0,0)');
    c.fillStyle = bandL; c.fillRect(0, 0, 760, 1080);
    const bandR = c.createLinearGradient(1920, 0, 1260, 0), aR = Math.min(1, I * (0.7 + 0.35 * vnoise(t * 1.3, 8)));
    bandR.addColorStop(0, `rgba(255,170,60,${aR})`); bandR.addColorStop(0.4, `rgba(240,60,20,${aR * 0.55})`); bandR.addColorStop(1, 'rgba(160,0,0,0)');
    c.fillStyle = bandR; c.fillRect(1260, 0, 660, 1080);
    // blooms that drift along the gate
    const L = [[-60, 320 + vnoise(t * 0.7, 1) * 320, 820, 0], [1990, 700 + vnoise(t * 0.6, 2) * 300, 760, 1], [120, 980, 560, 2], [1880, 140 + vnoise(t * 0.5, 3) * 220, 620, 3]];
    L.forEach(([x, y, r, i]) => {
      const a = Math.min(1, I * (0.75 + 0.35 * hash(f * 3 + i)));
      const rr = r * (0.85 + 0.3 * vnoise(t * 1.3, i + 5));
      const g = c.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, `rgba(255,236,170,${a})`); g.addColorStop(0.18, `rgba(255,160,50,${a * 0.95})`); g.addColorStop(0.5, `rgba(235,60,20,${a * 0.6})`); g.addColorStop(1, 'rgba(120,0,0,0)');
      c.fillStyle = g; c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      // hot core
      const g2 = c.createRadialGradient(x, y, 0, x, y, rr * 0.55);
      g2.addColorStop(0, `rgba(255,200,120,${a * 0.5})`); g2.addColorStop(1, 'rgba(255,60,0,0)');
      c.fillStyle = g2; c.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    });
    // a leak sweeping across the frame
    if (sweep !== undefined) {
      const g = c.createLinearGradient(sweep - 500, 0, sweep + 500, 0);
      g.addColorStop(0, 'rgba(255,60,0,0)'); g.addColorStop(0.4, 'rgba(255,90,20,0.55)'); g.addColorStop(0.5, 'rgba(255,200,120,0.7)'); g.addColorStop(0.6, 'rgba(255,90,20,0.55)'); g.addColorStop(1, 'rgba(255,60,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
    }
    c.restore();
    c0.save(); c0.globalCompositeOperation = 'screen'; c0.drawImage(st.lc, 0, 0, 1920, 1080); c0.restore();
  }
  // Dust, hair and scratches that belong to one frame of print (or persist down the reel).
  function fbDirt(c, t, f, amt) {
    const r = rng(f * 977 + 3);
    c.save();
    const n = (6 + r() * 16) * amt | 0;
    for (let k = 0; k < n; k++) {
      const x = r() * 1920, y = r() * 1080, s = 1.5 + r() * r() * 9, white = r() < 0.3;
      c.fillStyle = white ? 'rgba(255,250,235,0.8)' : 'rgba(10,6,4,0.85)';
      c.beginPath(); c.ellipse(x, y, s, s * (0.5 + r() * 0.6), r() * 3, 0, TAU); c.fill();
    }
    if (r() < 0.35 * amt) {
      // a hair across the frame
      let x = r() * 1920, y = r() * 1080, a = r() * TAU;
      c.strokeStyle = 'rgba(12,8,6,0.8)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y);
      for (let k = 0; k < 14; k++) { a += (r() - 0.5) * 0.9; x += Math.cos(a) * 14; y += Math.sin(a) * 14; c.lineTo(x, y); }
      c.stroke();
    }
    // running emulsion scratches
    [[420, 1], [1310, 2], [1530, 3]].forEach(([x0, i]) => {
      const on = vnoise(t * 0.8, i * 7) > -0.2;
      if (!on) return;
      const x = x0 + vnoise(t * 2, i) * 30 + (hash(f + i) - 0.5) * 4;
      c.strokeStyle = `rgba(235,245,230,${0.25 + 0.3 * hash(f * 5 + i)})`; c.lineWidth = 1.2 + hash(i) * 1.5;
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x + vnoise(f * 0.1, i) * 6, 1080); c.stroke();
    });
    c.restore();
  }
  const FB_NUC = [{ x: 1130, y: 470, t0: FB.burn, k: 1 }, { x: 740, y: 650, t0: 4.95, k: 0.75 }, { x: 1440, y: 790, t0: 5.35, k: 0.6 }];
  const BW = 640, BH = 360, BK = 1920 / BW;
  // Ignition-time field for the burn: each texel knows when the lamp reaches it. Distance from the
  // nuclei (accelerating front), warped by fbm and by the blister cells, so the hole is ragged.
  function fbBurnField(r) {
    const G = 64, lat = new Float32Array(G * G); for (let i = 0; i < lat.length; i++) lat[i] = r();
    const n2 = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      const a = lat[((yi & 63) << 6) | (xi & 63)], b = lat[((yi & 63) << 6) | ((xi + 1) & 63)], c = lat[(((yi + 1) & 63) << 6) | (xi & 63)], d = lat[(((yi + 1) & 63) << 6) | ((xi + 1) & 63)];
      return lerp(lerp(a, b, u), lerp(c, d, u), v);
    };
    const fbm = (x, y) => n2(x, y) * 0.5 + n2(x * 2.1, y * 2.1) * 0.25 + n2(x * 4.3, y * 4.3) * 0.15 + n2(x * 8.7, y * 8.7) * 0.1;
    // blister cells (Worley): seed points jittered on a grid
    const CS = 15, CX = Math.ceil(BW / CS) + 1, CY = Math.ceil(BH / CS) + 1, px = new Float32Array(CX * CY), py = new Float32Array(CX * CY);
    for (let j = 0; j < CY; j++) for (let i = 0; i < CX; i++) { px[j * CX + i] = (i + 0.15 + r() * 0.7) * CS; py[j * CX + i] = (j + 0.15 + r() * 0.7) * CS; }
    const T = new Float32Array(BW * BH), F1 = new Float32Array(BW * BH), ED = new Float32Array(BW * BH);
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      const ci = Math.floor(x / CS), cj = Math.floor(y / CS);
      let d1 = 1e9, id = 0;
      for (let j = cj - 1; j <= cj + 1; j++) for (let i = ci - 1; i <= ci + 1; i++) {
        if (i < 0 || j < 0 || i >= CX || j >= CY) continue;
        const d = Math.hypot(x - px[j * CX + i], y - py[j * CX + i]);
        if (d < d1) { d1 = d; id = j * CX + i; }
      }
      const k = y * BW + x;
      F1[k] = d1 / CS; ED[k] = hash(id * 1.37 + 0.5);
      const w = fbm(x * 0.022, y * 0.022), X = x * BK, Y = y * BK;
      let tm = 1e9;
      FB_NUC.forEach(n => {
        const d = Math.hypot(X - n.x, (Y - n.y) * 1.1) / n.k * (0.6 + 0.9 * w) + 26 * F1[k];
        tm = Math.min(tm, n.t0 + 0.2 + Math.pow(d / 240, 1 / 1.9));
      });
      T[k] = tm;
    }
    return { T, F1, ED };
  }
  // Burn-through: scorch browning ahead of the front, blisters, a glowing melt edge, the white hole.
  function fbBurn(c, t, st) {
    const { T, F1, ED } = st.bf, d = st.bid.data, gd = st.gid.data;
    for (let k = 0; k < BW * BH; k++) {
      const s = t - T[k], o = k * 4;
      let r = 0, g = 0, b = 0, a = 0;
      if (s > -0.95) {
        if (s < 0) {
          // scorch and blistering emulsion
          const u = 1 + s / 0.95, f1 = F1[k], uu = Math.pow(u, 1.25);
          r = lerp(200, 64, uu); g = lerp(110, 22, uu); b = lerp(40, 4, uu); a = Math.min(0.94, uu * 1.1);
          // blisters swell in the softened emulsion, then pop into pinholes just ahead of the front
          const h = ED[k], rb = (0.08 + 0.5 * clamp((u - 0.62) / 0.38)) * (0.25 + 1.3 * h * h);
          if (u > 0.62 && h > 0.15) {
            if (f1 < rb) {
              if (s > -0.07) { r = 255; g = 236; b = 190; a = 1; }
              else { const q = f1 / rb; r = lerp(250, 150, q); g = lerp(170, 70, q); b = lerp(80, 16, q); a = Math.max(a, 0.6); }
            } else if (f1 < rb + 0.07) { r = 46; g = 14; b = 2; a = Math.max(a, 0.85); }
          }
        } else if (s < 0.07) {
          // melt front: the emulsion is boiling
          const u = s / 0.07; r = 255; g = lerp(110, 210, u); b = lerp(20, 120, u); a = 1;
        } else { r = 255; g = 248; b = 230; a = 1; }
      }
      d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = a * 255;
    }
    st.bg.putImageData(st.bid, 0, 0);
    // a low-res glow map around the front, bloomed by upscaling
    for (let y = 0; y < 68; y++) for (let x = 0; x < 120; x++) {
      const s = t - T[Math.floor(y * BH / 68) * BW + Math.floor(x * BW / 120)], o = (y * 120 + x) * 4, e = Math.exp(-Math.abs(s - 0.02) * 9);
      gd[o] = 255; gd[o + 1] = 120 + 80 * e; gd[o + 2] = 30; gd[o + 3] = 255 * e * 0.8 * (s > -0.6 ? 1 : 0);
    }
    st.gg.putImageData(st.gid, 0, 0);
    c.save(); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'low';
    c.drawImage(st.bc, 0, 0, 1920, 1080);
    c.globalCompositeOperation = 'screen'; c.drawImage(st.gc, 0, 0, 1920, 1080);
    c.restore();
  }
  // One frame of print stock with the perforations visible (when the strip loses its loop).
  function fbStrip(c, t, st) {
    const u = t - FB.loop, off = u * 5200 + 260 * E.inQ(seg(u, 0, 0.2)), FH = 1080 + 70, sx = 230 * E.outQ(seg(u, 0, 0.15));
    c.fillStyle = '#c88a3a'; c.fillRect(0, 0, 1920, 1080);
    const kinds = ['red', 'white', 'scene', 'orange', 'black', 'white', 'red', 'scene', 'orange', 'white'];
    const i0 = Math.floor(off / FH);
    for (let i = i0 - 1; i <= i0 + 1; i++) {
      const y = i * FH - off + 540 - 540, kind = kinds[((i % kinds.length) + kinds.length) % kinds.length];
      const x = sx;
      if (kind === 'scene') { c.save(); c.filter = 'sepia(0.4) saturate(1.6) brightness(1.4)'; c.drawImage(st.fr, x, y, 1920, 1080); c.restore(); }
      else { c.fillStyle = { red: '#e8341c', white: '#fff6e4', orange: '#ff8a1e', black: '#120806' }[kind]; c.fillRect(x, y, 1920, 1080); }
      c.fillStyle = '#060302'; c.fillRect(x, y + 1080, 1920, 70);
    }
    // the perforation margin of the strip
    if (sx > 1) {
      c.fillStyle = '#d8a050'; c.fillRect(0, 0, sx, 1080);
      c.fillStyle = '#060302';
      for (let k = -1; k < 8; k++) { const y = k * (FH / 4) - (off % (FH / 4)); MG.rrect(c, sx - 150, y + 40, 96, 140, 18); c.fill(); }
      c.fillStyle = 'rgba(60,20,0,0.6)'; c.fillRect(sx - 20, 0, 20, 1080);
    }
  }
  MG.film({
    id: 'filmburn', dur: 10, poster: 9.3,
    fonts: [['400 200px "Abril Fatface"', 'FILM BURN'], ['400 40px "Special Elite"', 'Celluloid 1966—']],
    meta: {
      family: 'F', name: 'Film Burn', sub: 'Light Leaks & Burn-through', era: '1966 —',
      origin: 'Celluloid is fragile: light leaking into a camera or a can fogs the raw stock orange and red at the ends of each roll, and a print that jams in front of a projector lamp blisters and melts in seconds. Ingmar Bergman staged that burn-through on purpose in Persona (1966), Monte Hellman ended Two-Lane Blacktop (1971) with its last frame burning in the gate, and editors have used scanned light leaks and burn transitions ever since.',
      works: 'Persona (Ingmar Bergman, 1966) · Two-Lane Blacktop (Monte Hellman, 1971) · Fight Club (David Fincher, 1999; changeover "cigarette burns") · Decasia (Bill Morrison, 2002) · Grindhouse: Planet Terror (Robert Rodriguez, 2007)',
      tech: ['Light-leak fogging (screen blend)', 'Projector burn-through & blistering', 'Gate weave, frame-line slip, flicker', 'Dust, hair, scratches, cue dots'],
      accent: '#ff6a1e',
      motionDNA: 'A steady 24 fps print breathing with weave and flicker, interrupted by the projector: the framing slips to show the frame line, the strip stops dead, a hole bubbles and melts outward, and the reel flaps through flash frames.',
      visualDNA: 'Warm Kodachrome dusk, orange and red fogging blooming from the gate edges, brown scorched emulsion with blisters around a white-hot hole, black frame lines and perforations, dust, hairs and green-white scratches.',
      transitions: 'Light-leak flare, frame-line slip, burn-through to white, flash frames, run-out',
      implementation: ['35mm projector + leader', 'Scanned light-leak / burn overlays (screen blend)', 'Canvas 2D (procedural burn)'],
      reproducibility: 'Procedural homage (the real effect destroys the print)',
      loopable: false,
    },
    setup() {
      const r = rng(1966);
      const fr = offscreen(960, 540);
      const bc = offscreen(BW, BH), bg = bc.getContext('2d'), gc = offscreen(120, 68), gg = gc.getContext('2d');
      const lc = offscreen(480, 270);
      return { fr, fg: fr.getContext('2d'), lc, lg: lc.getContext('2d'), lastTau: -1, bf: fbBurnField(r), bc, bg, bid: bg.createImageData(BW, BH), gc, gg, gid: gg.createImageData(120, 68) };
    },
    draw(c, t, W, H, st) {
      const f = fbFrame(t), tq = f / 24;
      // ---- loop lost: the strip races through the gate ----
      if (t >= FB.loop && t < FB.title) {
        if (st.lastTau !== 3.2) { st.fg.setTransform(0.5, 0, 0, 0.5, 0, 0); fbScene(st.fg, 3.2); st.lastTau = 3.2; }
        const b = 1 - seg(t, FB.loop, FB.loop + 0.12);
        fbStrip(c, t, st);
        fbDirt(c, t, Math.floor(t * 24), 2);
        if (b > 0) { c.fillStyle = `rgba(255,248,230,${b})`; c.fillRect(0, 0, W, H); }
        grain(c, W, H, t, 0.12, 'overlay');
        vignette(c, W, H, 0.5, '30,10,0');
        return;
      }
      // ---- the projected frame ----
      const titleSec = t >= FB.title;
      const tau = titleSec ? 7.2 + (tq - FB.title) * 0.5 : Math.min(tq, FB.jam);
      if (st.lastTau !== tau) { st.fg.setTransform(0.5, 0, 0, 0.5, 0, 0); fbScene(st.fg, tau); st.lastTau = tau; }
      c.fillStyle = '#070403'; c.fillRect(0, 0, W, H);
      const jammed = t >= FB.jam && !titleSec;
      const wx = jammed ? 0 : vnoise(f * 0.31, 1) * 4 + (hash(f) - 0.5) * 2, wy = jammed ? 0 : vnoise(f * 0.27, 2) * 5 + (hash(f + 9) - 0.5) * 2;
      // frame-line slip: the image rides up and the projectionist re-frames
      let slip = 0;
      if (t >= FB.slip && t < FB.slipEnd) slip = 330 * E.outQ(seg(t, FB.slip, FB.slip + 0.32)) * (1 - E.inQ(seg(t, FB.slipEnd - 0.12, FB.slipEnd)));
      c.save(); c.translate(wx, wy - slip);
      c.drawImage(st.fr, 0, 0, W, H);
      if (slip > 0) { c.fillStyle = '#060302'; c.fillRect(-10, H, W + 20, 70); c.drawImage(st.fr, 0, H + 70, W, H); }
      // the lamp's heat bulges and warms the stopped frame
      if (jammed) {
        const h = seg(t, FB.jam, FB.burn + 0.8), n = FB_NUC[0];
        c.save(); c.beginPath(); c.arc(n.x, n.y, 380, 0, TAU); c.clip();
        const s = 1 + 0.07 * h;
        c.globalAlpha = 0.85; c.translate(n.x, n.y); c.scale(s, s); c.translate(-n.x, -n.y); c.drawImage(st.fr, 0, 0, W, H);
        c.restore();
        const hg = c.createRadialGradient(n.x, n.y, 0, n.x, n.y, 700);
        hg.addColorStop(0, `rgba(255,200,120,${0.35 * h})`); hg.addColorStop(1, 'rgba(255,120,40,0)');
        c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = hg; c.fillRect(0, 0, W, H); c.restore();
        fbBurn(c, t, st);
      }
      if (titleSec) {
        // run-out: the last frames under the title, darkened
        c.fillStyle = 'rgba(16,6,2,0.6)'; c.fillRect(0, 0, W, H);
      }
      c.restore();
      // white-out as the hole swallows the frame
      if (t >= FB.white - 0.15 && !titleSec) { c.fillStyle = `rgba(255,248,232,${seg(t, FB.white - 0.15, FB.white + 0.2)})`; c.fillRect(0, 0, W, H); }
      // ---- title ----
      if (titleSec) {
        const u = t - FB.title, a = E.outQ(seg(u, 0.1, 0.6));
        c.save(); c.translate(wx, wy);
        c.globalAlpha = a;
        text(c, 'FILM BURN', 960, 590, { font: FBT, size: 236, align: 'center', color: '#f6e6c8', ls: 14 });
        c.globalAlpha = E.outQ(seg(u, 0.45, 0.9));
        text(c, 'CELLULOID LIGHT LEAKS  ·  PROJECTOR BURN-THROUGH', 960, 690, { font: FBS, size: 38, align: 'center', color: '#e8b070', ls: 4 });
        text(c, '1966 —', 960, 770, { font: FBS, size: 34, align: 'center', color: '#c08050', ls: 6 });
        c.restore();
        // changeover cue dots, top right, four frames each
        if ((t >= FB.cue1 && t < FB.cue1 + 4 / 24) || (t >= FB.cue2 && t < FB.cue2 + 4 / 24)) {
          c.save(); c.translate(1730 + wx, 150 + wy);
          c.fillStyle = 'rgba(250,246,236,0.95)'; c.beginPath(); c.arc(0, 0, 38, 0, TAU); c.fill();
          c.strokeStyle = 'rgba(30,10,0,0.6)'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 38, 0, TAU); c.stroke();
          c.restore();
        }
      }
      vignette(c, W, H, 0.6, '20,6,0');
      // ---- light leaks ----
      let I = 0.42 + 0.3 * Math.max(0, Math.sin(t * 2.1 + 1));
      I = Math.max(I, 1.4 * (1 - E.outQ(seg(t, 0, 0.9))));       // head of the roll: fogged
      if (t > FB.slip - 0.2 && t < FB.slipEnd + 0.2) I = Math.max(I, 0.7 * Math.sin(PI * seg(t, FB.slip - 0.2, FB.slipEnd + 0.2)));
      if (jammed) I = lerp(0.3, 0.9, seg(t, FB.burn, FB.white));
      if (titleSec) { const u = t - FB.title; I = 1.2 * (1 - E.outQ(seg(u, 0, 0.7))) + 0.35 + 0.55 * Math.max(0, Math.sin(PI * seg(u, 0.9, 2.1))); }
      fbLeaks(c, t, I, st, titleSec ? lerp(-600, 2600, E.ioS(seg(t - FB.title, 0.3, 2.4))) : undefined);
      // head of the roll: two black frames, then fogged stock flaring into the picture
      if (t < 0.75) {
        c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = `rgba(255,120,40,${0.95 * (1 - E.outQ(seg(t, 0.08, 0.75)))})`; c.fillRect(0, 0, W, H); c.restore();
        if (t < 2 / 24) { c.fillStyle = '#050302'; c.fillRect(0, 0, W, H); }
      }
      // ---- the medium ----
      fbDirt(c, t, f, jammed ? 0.6 : 1);
      if (!jammed) { c.fillStyle = `rgba(0,0,0,${0.08 * hash(f * 1.7)})`; c.fillRect(0, 0, W, H); }
      grain(c, W, H, tq, 0.12, 'overlay');
      vignette(c, W, H, 0.25, '20,6,0');
    },
    score(A) {
      A.bus.gain.value = 0.9;
      // projector: claw and shutter clatter at 24 fps over a motor hum
      const clatter = (t0, t1, g = 0.05) => { for (let t = t0; t < t1; t += 1 / 24) A.noise(t, { type: 'bandpass', f: 1800 + (Math.round(t * 24) % 2) * 600, q: 2.2, dur: 0.018, g }); };
      clatter(0.05, FB.jam, 0.045);
      A.osc(0.0, { type: 'sawtooth', f: 48, dur: FB.jam, g: 0.04, lp: 220, a: 0.3, hold: true, rel: 0.1 });
      A.osc(0.0, { type: 'triangle', f: 96, f2: 120, glide: 0.6, dur: 0.6, g: 0.05 });
      // the fogged head of the roll: a soft flare
      A.noise(0.0, { type: 'bandpass', f: 600, f2: 2400, q: 0.8, dur: 0.9, g: 0.08, swell: 0.3, rev: 0.5 });
      // the road: a lonely twang guitar and an organ
      const gt = (t, m, o = {}) => A.pluck(t, midi(m), { dur: 2.2, g: o.g ?? 0.24, bright: 0.75, decay: 0.997, rev: 0.45, lp: 3400, bend: o.bend, bendAt: o.bendAt, bendT: o.bendT, pan: o.pan || 0 });
      const org = (t, notes, dur, g = 0.018) => A.chord(t, notes, { type: 'triangle', dur, g, a: 0.25, hold: true, rel: 0.4, spread: 5, vib: [5.5, 1.5], rev: 0.5, width: 0.6 });
      org(0.4, [52, 59, 64, 67], 2.4); org(2.8, [50, 57, 62, 66], 1.4);
      [[0.55, 64], [0.95, 67], [1.3, 69], [1.7, 71, 1.06], [2.6, 69], [2.95, 67], [3.3, 64, 0.94], [3.7, 62]].forEach(([t, m, b]) => gt(t, m, b ? { bend: b, bendAt: 0.12, bendT: 0.18 } : {}));
      gt(0.55, 40, { g: 0.2 }); gt(2.8, 38, { g: 0.2 });
      // frame-line slip: the shutter stutters
      for (let k = 0; k < 9; k++) A.noise(FB.slip + k * 0.035, { type: 'bandpass', f: 1200, q: 1.5, dur: 0.02, g: 0.06 });
      A.whoosh(FB.slip, 0.4, { f1: 2000, f2: 400, g: 0.06 });
      // jam: a hard clunk, the motor straining, then only the lamp fan
      A.osc(FB.jam, { type: 'triangle', f: 150, f2: 50, glide: 0.15, dur: 0.25, g: 0.4 });
      A.noise(FB.jam, { type: 'lowpass', f: 1500, dur: 0.12, g: 0.3 });
      A.osc(FB.jam, { type: 'sawtooth', f: 48, f2: 22, glide: 0.8, dur: 0.9, g: 0.05, lp: 300 });
      A.noise(FB.jam + 0.1, { type: 'lowpass', f: 500, dur: FB.loop - FB.jam, g: 0.04, hold: true, rel: 0.2 });
      // the burn: sizzle and accelerating crackle, a rising drone
      A.noise(FB.burn, { type: 'highpass', f: 3500, dur: FB.white - FB.burn + 0.3, g: 0.07, swell: 0.85 });
      for (let k = 0; k < 70; k++) { const u = Math.pow(hash(k * 2.7), 0.6), t = FB.burn + u * (FB.white - FB.burn); A.noise(t, { type: 'bandpass', f: 1500 + hash(k) * 5000, q: 3, dur: 0.015 + hash(k * 3) * 0.02, g: 0.05 + hash(k * 5) * 0.08, pan: (hash(k * 7) - 0.5) * 0.8 }); }
      A.osc(FB.burn, { type: 'sawtooth', f: 55, f2: 110, glide: FB.white - FB.burn, dur: FB.white - FB.burn + 0.2, g: 0.05, lp: 500, lp2: 3000, lpT: FB.white - FB.burn, a: 1.2, hold: true, rel: 0.1 });
      A.chord(FB.burn + 0.3, [64, 65, 71], { type: 'sine', dur: FB.white - FB.burn, g: 0.02, a: 1.5, hold: true, rel: 0.2, vib: [3, 4], rev: 0.6 });
      // white-out
      A.impact(FB.white, 0.6);
      A.noise(FB.white, { type: 'highpass', f: 1500, dur: 0.5, g: 0.18, rev: 0.6 });
      // loop lost: the tail flaps through the gate, a thump for each flash frame
      for (let k = 0; k < 40; k++) A.noise(FB.loop + k * 0.02, { type: 'bandpass', f: 900 + (k % 3) * 400, q: 1.2, dur: 0.012, g: 0.08 });
      [0, 0.22, 0.44, 0.66].forEach((d, i) => A.kick(FB.loop + d, 0.4 - i * 0.05, { f: 100, f2: 40 }));
      // run-out on the title: the projector settles, the guitar resolves
      clatter(FB.title, 10, 0.03);
      A.osc(FB.title, { type: 'sawtooth', f: 48, dur: 10 - FB.title, g: 0.03, lp: 220, a: 0.2, hold: true, rel: 0.2 });
      gt(FB.title + 0.1, 40, { g: 0.26 }); gt(FB.title + 0.1, 52, { g: 0.18 });
      [[FB.title + 0.35, 59], [FB.title + 0.55, 64], [FB.title + 0.75, 67], [FB.title + 0.95, 71], [FB.title + 1.3, 74, 0.94]].forEach(([t, m, b]) => gt(t, m, b ? { bend: b, bendAt: 0.25, bendT: 0.3, pan: 0.2 } : { pan: -0.1 }));
      org(FB.title + 0.1, [52, 59, 64, 66, 71], 2.2, 0.016);
      // cue dots: the changeover bell
      A.bell(FB.cue1, midi(81), { g: 0.03, dur: 0.8 }); A.bell(FB.cue2, midi(81), { g: 0.03, dur: 0.8 });
    },
  });
  /* =====================================================================
     ONE-SHOT CAMERA MOTION — the slate claps and the camera never cuts:
     a crane down a night street to a club's side door, a Steadicam behind
     a couple through the red corridor, the kitchen and its cooks, out into
     the room as the band plays, settling on the stage marquee
     ===================================================================== */
  const OS_F = 1100, OS_BAR = 138;
  const OSB = '"Bebas Neue", Impact, sans-serif', OSM = '"IBM Plex Mono", monospace';
  // Rooms are convex boxes chained by doorways: street → corridor → kitchen → club.
  const OS_ROOMS = [
    { name: 'STREET', in: p => p[2] < 10, fog: [10, 14, 34], fd: 26 },
    { name: 'CORRIDOR', in: p => p[2] >= 10 && p[0] < 1, fog: [30, 6, 6], fd: 9 },
    { name: 'KITCHEN', in: p => p[0] >= 1 && p[0] < 9, fog: [30, 40, 36], fd: 14 },
    { name: 'CLUB', in: p => p[0] >= 9, fog: [24, 8, 10], fd: 16 },
  ];
  // Steadicam path: [t, x, y, z, yaw, pitch]; yaw 0 looks down +z, π/2 down +x.
  const OS_CAM = [
    [-0.6, 0, 8.2, -9.6, 0, -0.2], [0, 0, 7.8, -8.4, 0, -0.2], [1.2, 0, 4.2, -0.6, 0, -0.16], [2.1, 0, 1.75, 6.6, 0, -0.04], [2.65, 0, 1.6, 10.4, 0, 0],
    [3.45, 0, 1.6, 13.6, 0.05, 0], [4.05, 0.5, 1.6, 15.7, 0.95, 0], [4.55, 2.2, 1.6, 16.05, 1.55, -0.02], [5.5, 5.4, 1.6, 16.0, 1.57, -0.04],
    [6.3, 8.2, 1.62, 16.0, 1.57, 0], [6.85, 10.5, 1.7, 16.0, 1.52, 0.02], [7.8, 12.9, 1.9, 15.5, 1.42, 0.03], [8.75, 14.4, 2.25, 15.8, 1.53, 0.03],
    [9.6, 14.95, 2.42, 16.0, 1.57, 0.03], [10, 15.0, 2.43, 16.0, 1.57, 0.03], [10.6, 15.05, 2.44, 16.0, 1.57, 0.03],
  ];
  function osCam(t) {
    const K = OS_CAM; let i = 1;
    while (i < K.length - 2 && t > K[i + 1][0]) i++;
    const a = K[i - 1], b = K[i], c2 = K[i + 1], d = K[Math.min(K.length - 1, i + 2)], u = clamp((t - b[0]) / (c2[0] - b[0])), u2 = u * u, u3 = u2 * u;
    const out = [];
    for (let j = 1; j < 6; j++) out.push(0.5 * (2 * b[j] + (-a[j] + c2[j]) * u + (2 * a[j] - 5 * b[j] + 4 * c2[j] - d[j]) * u2 + (-a[j] + 3 * b[j] - 3 * c2[j] + d[j]) * u3));
    return out;
  }
  // The couple the camera follows: always a few steps ahead, then they peel off to their table.
  function osCouple(t) {
    const lead = 0.8, tt = Math.min(t + lead, 8.0), p = osCam(tt);
    let x = p[0] + Math.sin(p[3]) * 1.2, z = p[2] + Math.cos(p[3]) * 1.2, yaw = p[3];
    const u = E.ioS(seg(t, 7.0, 8.6));
    x = lerp(x, 19.6, u); z = lerp(z, 13.2, u);
    if (u > 0 && u < 1) yaw = lerp(yaw, 2.3, u);
    const walk = t < 8.6 ? 1 : 0;
    return { x, z, yaw, walk, sit: E.ioS(seg(t, 8.6, 9.1)) };
  }
  function osGeometry() {
    const R = [[], [], [], []], S = [[], [], [], []], r = rng(1958);
    const lightsOf = [
      [[5, 4.6, 7.6, [255, 200, 130], 26], [-5, 4.6, 7.6, [255, 200, 130], 26], [0, 3.4, 9.6, [255, 80, 170], 3], [-12, 4.6, 7.6, [255, 190, 120], 22]],
      [[0, 2.6, 11.6, [255, 170, 110], 6], [0, 2.6, 14.6, [255, 170, 110], 6], [0, 2.6, 17, [255, 170, 110], 4]],
      [[3.5, 2.8, 16, [215, 255, 230], 7], [7, 2.8, 16, [215, 255, 230], 7]],
      [[22, 4.5, 16, [255, 210, 140], 40], [14, 3, 10, [255, 90, 70], 10], [14, 3, 22, [255, 90, 70], 10], [18, 3, 10, [255, 90, 70], 10], [18, 3, 22, [255, 90, 70], 10]],
    ];
    const amb = [0.3, 0.25, 0.4, 0.22];
    const lit = (room, p, col) => {
      let L = [amb[room], amb[room], amb[room]];
      lightsOf[room].forEach(([x, y, z, lc, k]) => { const d2 = (p[0] - x) ** 2 + (p[1] - y) ** 2 + (p[2] - z) ** 2, w = k / (k + d2 * 1.6); L[0] += w * lc[0] / 255; L[1] += w * lc[1] / 255; L[2] += w * lc[2] / 255; });
      return col.map((v, i) => Math.min(255, v * L[i]));
    };
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    // A rectangle P0 + u·U + v·V split into panels; U×V points at the side that sees it. holes: [u0,u1,v0,v1] in metres.
    function rect(room, P0, U, V, su, sv, colf, o = {}) {
      const lu = Math.hypot(...U), lv = Math.hypot(...V), nu = Math.max(1, Math.round(lu / su)), nv = Math.max(1, Math.round(lv / sv));
      const N = cross(U, V);
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        const cu = (i + 0.5) / nu * lu, cv = (j + 0.5) / nv * lv;
        if ((o.holes || []).some(([a, b, c2, d]) => cu > a && cu < b && cv > c2 && cv < d)) continue;
        const pt = (a, b) => [0, 1, 2].map(k => P0[k] + U[k] * a + V[k] * b);
        const pts = [pt(i / nu, j / nv), pt((i + 1) / nu, j / nv), pt((i + 1) / nu, (j + 1) / nv), pt(i / nu, (j + 1) / nv)];
        const cen = pt((i + 0.5) / nu, (j + 0.5) / nv), base = colf(i, j, cen, cu, cv);
        if (!base) continue;
        R[room].push({ pts, N, c: base.em ? base.c : lit(room, cen, base.c), em: !!base.em, obj: !!o.obj, cen });
      }
    }
    // Axis-aligned box (no bottom), faces looking outward.
    function box(room, x0, y0, z0, x1, y1, z1, col, top) {
      const o = { obj: true };
      rect(room, [x0, y1, z0], [0, 0, z1 - z0], [x1 - x0, 0, 0], 9, 9, () => ({ c: top || col }), o);
      rect(room, [x0, y0, z0], [x1 - x0, 0, 0], [0, y1 - y0, 0], 1.2, 9, () => ({ c: col }), o);
      rect(room, [x1, y0, z1], [x0 - x1, 0, 0], [0, y1 - y0, 0], 1.2, 9, () => ({ c: col }), o);
      rect(room, [x0, y0, z1], [0, 0, z0 - z1], [0, y1 - y0, 0], 1.2, 9, () => ({ c: col.map(v => v * 0.8) }), o);
      rect(room, [x1, y0, z0], [0, 0, z1 - z0], [0, y1 - y0, 0], 1.2, 9, () => ({ c: col.map(v => v * 0.8) }), o);
    }
    const jit = (c, a = 12) => c.map(v => v + (r() - 0.5) * a);
    /* ---- street ---- */
    rect(0, [-18, 0, -14], [0, 0, 24], [36, 0, 0], 2, 2, (i, j, p) => ({ c: jit(p[2] > 7.6 ? [92, 90, 96] : p[2] > 7.2 ? [120, 116, 120] : [40, 42, 52], 8) }));
    rect(0, [18, 0, 10], [-36, 0, 0], [0, 9.5, 0], 1, 0.5, (i, j, p, u, v) => {
      if (v > 2.6 && v < 3.0 && u > 16 && u < 20) return { c: [40, 20, 30] };
      const iu = Math.floor(u), iv = Math.floor(v);
      if (v > 9) return { c: [120, 100, 86] };
      if (v > 3 && v % 3 < 0.5) return { c: [104, 70, 58] };
      if (v > 3.5 && iu % 3 === 1) return hash(Math.floor(u / 3) * 7 + Math.floor(v / 3) * 13) > 0.45 ? { c: [255, 196, 120], em: true } : { c: [26, 30, 46] };
      return { c: jit(j % 2 ? [92, 52, 44] : [86, 48, 42], 5) };
    }, { holes: [[17, 19, 0, 2.5]] });
    // awning over the door, cars at the kerb
    rect(0, [-1.8, 2.9, 8.4], [3.6, 0, 0], [0, 0, 1.6], 0.6, 0.4, () => ({ c: [120, 20, 60] }), { obj: true });
    rect(0, [-1.8, 2.6, 8.4], [3.6, 0, 0], [0, 0.3, 0], 0.6, 0.3, () => ({ c: [170, 30, 80] }), { obj: true });
    box(0, -9.5, 0, 5.4, -5.2, 1.3, 7.1, [60, 70, 90], [80, 90, 110]);
    box(0, -8.6, 1.3, 5.6, -6.2, 1.9, 6.9, [40, 46, 60], [70, 80, 100]);
    box(0, 4.6, 0, 5.6, 9.2, 1.25, 7.2, [110, 40, 40], [130, 50, 50]);
    box(0, 5.6, 1.25, 5.8, 8, 1.8, 7.0, [70, 26, 30], [100, 40, 40]);
    S[0].push({ k: 'doorman', p: [1.5, 0, 9.5] }, { k: 'lamp', p: [5, 0, 7.6] }, { k: 'lamp', p: [-5, 0, 7.6] }, { k: 'lamp', p: [-12, 0, 7.6] }, { k: 'neon', p: [0, 3.5, 9.9] });
    /* ---- corridor ---- */
    rect(1, [-1, 0, 10], [0, 0, 7.5], [2, 0, 0], 0.5, 0.5, (i, j) => ({ c: (i + j) % 2 ? [120, 24, 30] : [96, 18, 24] }));
    rect(1, [1, 2.75, 10], [0, 0, 7.5], [-2, 0, 0], 1.5, 2, () => ({ c: [50, 30, 26] }));
    rect(1, [-1, 0, 17.5], [0, 0, -7.5], [0, 2.75, 0], 0.5, 0.25, (i, j, p) => ({ c: p[1] < 1 ? [70, 30, 20] : p[1] < 1.1 ? [190, 150, 80] : jit([150, 30, 34], 10) }));
    rect(1, [1, 0, 10], [0, 0, 7.5], [0, 2.75, 0], 0.5, 0.25, (i, j, p) => ({ c: p[1] < 1 ? [70, 30, 20] : p[1] < 1.1 ? [190, 150, 80] : jit([150, 30, 34], 10) }), { holes: [[5, 7, 0, 2.5]] });
    rect(1, [1, 0, 17.5], [-2, 0, 0], [0, 2.75, 0], 0.5, 0.25, (i, j, p) => ({ c: p[1] < 1 ? [70, 30, 20] : jit([150, 30, 34], 10) }));
    S[1].push({ k: 'bulb', p: [0, 2.6, 11.6] }, { k: 'bulb', p: [0, 2.6, 14.6] });
    /* ---- kitchen ---- */
    rect(2, [1, 0, 11.5], [0, 0, 9], [8, 0, 0], 0.5, 0.5, (i, j) => ({ c: (i + j) % 2 ? [230, 230, 222] : [40, 44, 46] }));
    rect(2, [9, 3, 11.5], [0, 0, 9], [-8, 0, 0], 1, 1, () => ({ c: [150, 160, 150] }));
    const tile = (i, j, p) => ({ c: p[1] < 0.2 ? [60, 70, 66] : jit((i + j) % 2 ? [226, 236, 230] : [208, 222, 214], 6) });
    rect(2, [1, 0, 20.5], [0, 0, -9], [0, 3, 0], 0.5, 0.5, tile, { holes: [[3.5, 5.5, 0, 2.5]] });
    rect(2, [9, 0, 11.5], [0, 0, 9], [0, 3, 0], 0.5, 0.5, tile, { holes: [[3.5, 5.5, 0, 2.5]] });
    rect(2, [1, 0, 11.5], [8, 0, 0], [0, 3, 0], 0.5, 0.5, tile);
    rect(2, [9, 0, 20.5], [-8, 0, 0], [0, 3, 0], 0.5, 0.5, tile);
    const steel = [150, 160, 170];
    box(2, 2.2, 0, 11.5, 8.2, 0.95, 12.6, steel, [200, 210, 215]);
    box(2, 2.2, 0, 19.4, 8.2, 0.95, 20.5, steel, [200, 210, 215]);
    box(2, 2.8, 0, 13.6, 7.6, 0.95, 14.5, steel, [205, 214, 220]);
    box(2, 2.8, 0, 17.5, 7.6, 0.95, 18.4, steel, [205, 214, 220]);
    // shelves of pots over the islands
    box(2, 3.2, 1.9, 13.9, 7.2, 1.98, 14.2, [90, 90, 96]);
    box(2, 3.2, 1.9, 17.8, 7.2, 1.98, 18.1, [90, 90, 96]);
    for (let k = 0; k < 7; k++) { S[2].push({ k: 'pot', p: [3.5 + k * 0.6, 1.85, 14.05], c: k % 2 }); S[2].push({ k: 'pot', p: [3.4 + k * 0.6, 1.85, 17.95], c: (k + 1) % 2 }); }
    S[2].push({ k: 'tube', p: [3.5, 2.95, 16] }, { k: 'tube', p: [7, 2.95, 16] });
    [[3.4, 13.1, 0.3], [5.6, 19.0, 1.4], [6.9, 13.1, 2.2], [4.1, 19.0, 3.1]].forEach(([x, z, ph]) => S[2].push({ k: 'cook', p: [x, 0, z], ph }));
    S[2].push({ k: 'steam', p: [4.6, 1, 14.05] }, { k: 'steam', p: [6.2, 1, 17.95] });
    /* ---- club ---- */
    rect(3, [9, 0, 7], [0, 0, 18], [15, 0, 0], 1, 1, (i, j) => ({ c: jit((i % 2) ? [96, 56, 34] : [84, 48, 30], 10) }));
    rect(3, [24, 5, 7], [0, 0, 18], [-15, 0, 0], 3, 3, () => ({ c: [26, 14, 18] }));
    const wall = (i, j, p) => ({ c: p[1] > 4.4 ? [170, 130, 60] : (Math.round(p[2] * 2 + p[0] * 2) % 6 === 0 ? [140, 100, 50] : jit([110, 22, 34], 8)) });
    rect(3, [9, 0, 25], [0, 0, -18], [0, 5, 0], 0.5, 0.5, wall, { holes: [[8, 10, 0, 2.5]] });
    rect(3, [9, 0, 7], [15, 0, 0], [0, 5, 0], 0.5, 0.5, wall);
    rect(3, [24, 0, 25], [-15, 0, 0], [0, 5, 0], 0.5, 0.5, wall);
    // stage wall: pleated curtain
    rect(3, [24, 0, 7], [0, 0, 18], [0, 5, 0], 0.4, 1, (i, j, p) => ({ c: p[2] > 9.6 && p[2] < 22.4 ? (i % 2 ? [150, 16, 30] : [110, 8, 22]) : [60, 14, 20] }));
    box(3, 20.6, 0, 9.6, 24, 0.75, 22.4, [60, 30, 22], [120, 70, 40]);
    const tables = [[12, 10], [12, 12.6], [12, 19.4], [12, 22], [14.8, 9.4], [14.8, 12.4], [14.8, 19.6], [14.8, 22.4], [17.6, 10.4], [17.6, 21.6], [19.6, 13.2], [19.6, 18.6]];
    tables.forEach(([x, z], i) => {
      box(3, x - 0.55, 0, z - 0.55, x + 0.55, 0.76, z + 0.55, [235, 228, 214], [250, 246, 236]);
      S[3].push({ k: 'tlamp', p: [x, 0.76, z] });
      if (!(x === 19.6 && z === 13.2)) S[3].push({ k: 'patron', p: [x + (i % 2 ? 0.6 : -0.6), 0, z + 0.3], ph: i * 1.3, c: i % 3 }, { k: 'patron', p: [x, 0, z + (i % 2 ? -0.75 : 0.75)], ph: i * 2.1 + 1, c: (i + 1) % 3 });
    });
    S[3].push({ k: 'marquee', p: [23.95, 3.55, 16] });
    [[22.4, 12.6, 'bass'], [22.0, 16.9, 'sax'], [22.8, 19.4, 'drums'], [22.2, 14.6, 'trumpet']].forEach(([x, z, inst], i) => S[3].push({ k: 'player', p: [x, 0.75, z], inst, ph: i }));
    S[3].push({ k: 'spot', p: [22, 4.8, 16] });
    return { R, S };
  }
  // Silhouette of a standing / walking / seated person at a projected foot point.
  function osPerson(c, x, y, h, o) {
    const w = h * 0.26, ph = o.ph || 0, sw = Math.sin(ph) * (o.walk ? 1 : 0), sit = o.sit || 0;
    c.save(); c.translate(x, y);
    const legH = h * 0.47 * (1 - sit * 0.55), bodyTop = -h * 0.84 * (1 - sit * 0.3);
    c.fillStyle = o.leg || o.col;
    if (!sit) { c.beginPath(); c.moveTo(-w * 0.28, -legH); c.lineTo(-w * 0.32 + sw * w * 0.5, 0); c.lineTo(-w * 0.08 + sw * w * 0.5, 0); c.lineTo(0, -legH); c.closePath(); c.fill(); c.beginPath(); c.moveTo(w * 0.28, -legH); c.lineTo(w * 0.32 - sw * w * 0.5, 0); c.lineTo(w * 0.08 - sw * w * 0.5, 0); c.lineTo(0, -legH); c.closePath(); c.fill(); }
    c.fillStyle = o.col;
    if (o.dress) { c.beginPath(); c.moveTo(-w * 0.32, bodyTop); c.lineTo(w * 0.32, bodyTop); c.lineTo(w * 0.62, -legH * 0.55); c.lineTo(-w * 0.62, -legH * 0.55); c.closePath(); c.fill(); }
    else { c.beginPath(); c.moveTo(-w * 0.5, bodyTop); c.lineTo(w * 0.5, bodyTop); c.lineTo(w * 0.42, -legH); c.lineTo(-w * 0.42, -legH); c.closePath(); c.fill(); }
    c.fillStyle = o.skin || '#c89a7a'; c.beginPath(); c.ellipse(0, bodyTop - h * 0.07, w * 0.22, h * 0.07, 0, 0, TAU); c.fill();
    if (o.hair) { c.fillStyle = o.hair; c.beginPath(); c.ellipse(0, bodyTop - h * 0.1, w * 0.25, h * 0.055, 0, PI, TAU); c.fill(); }
    if (o.hat) { c.fillStyle = '#f4f4f0'; c.fillRect(-w * 0.2, bodyTop - h * 0.22, w * 0.4, h * 0.1); }
    c.restore();
  }
  // Project the world, room by room: far rooms first, the camera's room painted last on top.
  function osRender(c, st, cam, t, W, H) {
    const [cx, cy, cz, yaw, pitch] = cam, cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const view = p => { const dx = p[0] - cx, dy = p[1] - cy, dz = p[2] - cz; const x = dx * cyw - dz * syw, z1 = dx * syw + dz * cyw; return [x, dy * cp - z1 * sp, dy * sp + z1 * cp]; };
    const proj = v => [W / 2 + v[0] * OS_F / v[2], H / 2 - v[1] * OS_F / v[2]];
    const cur = OS_ROOMS.findIndex(R => R.in([cx, cy, cz]));
    const order = [0, 1, 2, 3].filter(i => Math.abs(i - cur) <= 2).sort((a, b) => Math.abs(b - cur) - Math.abs(a - cur));
    const NEAR = 0.06;
    order.forEach(ri => {
      const fog = OS_ROOMS[ri].fog, fd = OS_ROOMS[ri].fd;
      const items = [];
      st.geo.R[ri].forEach(f => {
        const p0 = f.pts[0];
        if (f.N[0] * (cx - p0[0]) + f.N[1] * (cy - p0[1]) + f.N[2] * (cz - p0[2]) <= 0) return;
        let vs = f.pts.map(view);
        if (vs.every(v => v[2] < NEAR)) return;
        if (vs.some(v => v[2] < NEAR)) {
          const out = [];
          for (let i = 0; i < vs.length; i++) {
            const a = vs[i], b = vs[(i + 1) % vs.length];
            if (a[2] >= NEAR) out.push(a);
            if ((a[2] >= NEAR) !== (b[2] >= NEAR)) { const u = (NEAR - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u), NEAR]); }
          }
          vs = out;
        }
        const sp2 = vs.map(proj);
        if (sp2.every(p => p[0] < -50) || sp2.every(p => p[0] > W + 50) || sp2.every(p => p[1] < -50) || sp2.every(p => p[1] > H + 50)) return;
        const dz = view(f.cen)[2];
        items.push({ d: dz, s: sp2, f, o: f.obj });
      });
      // walls and floors of a convex room never occlude each other: draw them first, then sort the contents
      const shell = items.filter(i => !i.o), stuff = items.filter(i => i.o);
      const drawFace = it => {
        const k = it.f.em ? 0.3 * (1 - Math.exp(-Math.max(0, it.d) / fd)) : 1 - Math.exp(-Math.max(0, it.d) / fd);
        const col = it.f.c.map((v, i) => Math.round(lerp(v, fog[i], k)));
        c.fillStyle = c.strokeStyle = `rgb(${col[0]},${col[1]},${col[2]})`;
        c.beginPath(); it.s.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.fill(); c.stroke();
      };
      c.lineWidth = 1.2; c.lineJoin = 'round';
      shell.forEach(drawFace);
      st.geo.S[ri].forEach(s => { const v = view(s.p); if (v[2] > NEAR * 4) stuff.push({ d: v[2], sprite: s, v }); });
      stuff.sort((a, b) => b.d - a.d);
      stuff.forEach(it => { if (it.sprite) osSprite(c, it.sprite, it.v, proj, view, t, fog, fd); else drawFace(it); });
      // the couple belongs to whichever room they are in
      const cp2 = osCouple(t), rc = OS_ROOMS.findIndex(R => R.in([cp2.x, 0, cp2.z]));
      if (rc === ri) {
        const px = Math.cos(cp2.yaw) * 0.32, pz = -Math.sin(cp2.yaw) * 0.32;
        [[1, '#16161e', null], [-1, '#d8c8a8', 1]].map(([s, col, dress]) => ({ s, col, dress, v: view([cp2.x + px * s, 0, cp2.z + pz * s]) })).sort((a, b) => b.v[2] - a.v[2]).forEach(({ s, col, dress, v }) => {
          if (v[2] < 0.3) return;
          const head = view([cp2.x + px * s, 1.75 - (dress ? 0.1 : 0), cp2.z + pz * s]), a = proj(v), b = proj(head);
          osPerson(c, a[0], a[1], a[1] - b[1], { col, leg: dress ? '#c8a888' : '#101016', dress, walk: cp2.walk, ph: t * 9 + (s > 0 ? 0 : PI), sit: cp2.sit, hair: dress ? '#3a2416' : '#141010' });
        });
      }
    });
  }
  function osSprite(c, s, v, proj, view, t, fog, fd) {
    const [x, y] = proj(v), sc = OS_F / v[2], fk = 1 - Math.exp(-v[2] / fd);
    const glow = (r, col, a) => { const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); };
    switch (s.k) {
      case 'lamp': {
        const top = proj(view([s.p[0], 4.6, s.p[2]]));
        c.strokeStyle = '#141418'; c.lineWidth = Math.max(1, 0.12 * sc); c.beginPath(); c.moveTo(x, y); c.lineTo(top[0], top[1]); c.stroke();
        c.fillStyle = '#ffe8c0'; c.beginPath(); c.arc(top[0], top[1], Math.max(2, 0.18 * sc), 0, TAU); c.fill();
        const g = c.createRadialGradient(top[0], top[1], 0, top[0], top[1], 2.2 * sc); g.addColorStop(0, 'rgba(255,200,130,0.55)'); g.addColorStop(1, 'rgba(255,200,130,0)');
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(top[0] - 2.2 * sc, top[1] - 2.2 * sc, 4.4 * sc, 4.4 * sc); c.restore();
        break;
      }
      case 'neon': {
        const on = hash(Math.floor(t * 12)) > 0.06;
        glow(2.4 * sc, '255,60,170', on ? 0.5 : 0.2);
        c.save(); c.translate(x, y); c.shadowColor = '#ff3aa8'; c.shadowBlur = 0.25 * sc;
        text(c, 'THE ORCHID ROOM', 0, 0, { font: OSB, size: 0.62 * sc, align: 'center', base: 'middle', color: on ? '#ffd6f0' : '#a04080', ls: 0.05 * sc });
        c.restore();
        break;
      }
      case 'bulb': glow(1.6 * sc, '255,180,110', 0.45); c.fillStyle = '#fff2d0'; c.beginPath(); c.arc(x, y, Math.max(2, 0.08 * sc), 0, TAU); c.fill(); break;
      case 'tube': glow(2.5 * sc, '200,255,225', 0.35); c.fillStyle = '#f0fff6'; c.fillRect(x - 0.6 * sc, y - 0.04 * sc, 1.2 * sc, 0.08 * sc); break;
      case 'pot': c.strokeStyle = '#3a3a40'; c.lineWidth = Math.max(1, 0.015 * sc); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 0.08 * sc); c.stroke(); c.fillStyle = s.c ? '#a06038' : '#7a828a'; c.beginPath(); c.ellipse(x, y + 0.16 * sc, 0.11 * sc, 0.09 * sc, 0, 0, TAU); c.fill(); break;
      case 'steam': {
        c.save(); c.globalAlpha = 0.08;
        for (let k = 0; k < 4; k++) { const ph = (t * 0.6 + k * 0.25) % 1, yy = y - ph * 1.0 * sc, r = (0.08 + ph * 0.2) * sc; c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x + Math.sin(t * 2 + k) * 0.1 * sc, yy, r, 0, TAU); c.fill(); }
        c.restore();
        break;
      }
      case 'doorman': { const hd = proj(view([s.p[0], 1.85, s.p[2]])); osPerson(c, x, y, y - hd[1], { col: '#3a1a40', leg: '#141016', ph: 0, walk: false, hair: '#101010' }); break; }
      case 'cook': { const hd = proj(view([s.p[0], 1.8, s.p[2]])); osPerson(c, x, y, y - hd[1], { col: '#eef0ec', leg: '#3a3a40', hat: true, ph: t * 3 + s.ph, walk: false }); break; }
      case 'patron': {
        const hd = proj(view([s.p[0], 1.75, s.p[2]])), cols = ['#20202a', '#5a1a2a', '#c8b898'];
        osPerson(c, x, y, y - hd[1], { col: cols[s.c], leg: '#18181e', sit: 1, ph: s.ph, dress: s.c === 2, hair: '#20140c' });
        break;
      }
      case 'tlamp': {
        c.fillStyle = '#3a1010'; c.fillRect(x - 0.03 * sc, y - 0.3 * sc, 0.06 * sc, 0.3 * sc);
        c.fillStyle = '#e8402a'; c.beginPath(); c.moveTo(x - 0.1 * sc, y - 0.3 * sc); c.lineTo(x + 0.1 * sc, y - 0.3 * sc); c.lineTo(x + 0.16 * sc, y - 0.46 * sc + 0.16 * sc); c.lineTo(x - 0.16 * sc, y - 0.46 * sc + 0.16 * sc); c.closePath(); c.fill();
        const yy = y - 0.3 * sc, g = c.createRadialGradient(x, yy, 0, x, yy, 0.9 * sc); g.addColorStop(0, `rgba(255,120,80,${0.5 * (1 - fk)})`); g.addColorStop(1, 'rgba(255,90,60,0)');
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - 0.9 * sc, yy - 0.9 * sc, 1.8 * sc, 1.8 * sc); c.restore();
        break;
      }
      case 'player': {
        const hd = proj(view([s.p[0], s.p[1] + 1.75, s.p[2]])), h = y - hd[1], bob = Math.sin(t * PI * 2.5 + s.ph) * h * 0.012;
        osPerson(c, x, y + bob, h, { col: '#121216', leg: '#0c0c10', ph: 0, walk: false, skin: '#8a6a58' });
        c.fillStyle = '#d8a840';
        if (s.inst === 'sax') { c.save(); c.translate(x + h * 0.06, y - h * 0.62); c.rotate(0.4); c.fillRect(0, 0, h * 0.04, h * 0.3); c.beginPath(); c.arc(h * 0.04, h * 0.3, h * 0.05, 0, PI); c.fill(); c.restore(); }
        if (s.inst === 'trumpet') { c.save(); c.translate(x, y - h * 0.86); c.rotate(-0.25 + Math.sin(t * 2) * 0.05); c.fillRect(0, -h * 0.015, h * 0.28, h * 0.03); c.beginPath(); c.moveTo(h * 0.28, 0); c.lineTo(h * 0.34, -h * 0.05); c.lineTo(h * 0.34, h * 0.05); c.fill(); c.restore(); }
        if (s.inst === 'bass') { c.fillStyle = '#6a3418'; c.beginPath(); c.ellipse(x - h * 0.16, y - h * 0.35, h * 0.12, h * 0.2, 0.1, 0, TAU); c.fill(); c.fillRect(x - h * 0.13, y - h * 1.0, h * 0.025, h * 0.5); }
        if (s.inst === 'drums') { c.fillStyle = '#e8e0d0'; c.beginPath(); c.ellipse(x + h * 0.2, y - h * 0.22, h * 0.17, h * 0.17, 0, 0, TAU); c.fill(); c.fillStyle = '#d8b040'; c.fillRect(x - h * 0.42, y - h * 0.62, h * 0.28, h * 0.02); }
        break;
      }
      case 'spot': glow(5 * sc, '255,220,160', 0.22); break;
      case 'marquee': {
        // bulb lettering on the proscenium, lighting up letter by letter
        const word = 'ONE-SHOT', size = 1.45 * sc;
        c.save(); c.font = `400 ${size}px ${OSB}`; c.textBaseline = 'middle';
        const ws = [...word].map(ch => c.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0) + size * 0.08 * (word.length - 1);
        let xx = x - tot / 2;
        [...word].forEach((ch, i) => {
          const on = seg(t, 8.2 + i * 0.09, 8.26 + i * 0.09), fl = on * (0.85 + 0.15 * hash(Math.floor(t * 20) + i));
          c.fillStyle = `rgb(${lerp(70, 255, fl) | 0},${lerp(40, 230, fl) | 0},${lerp(30, 170, fl) | 0})`;
          if (on > 0) { c.shadowColor = 'rgba(255,190,90,0.9)'; c.shadowBlur = 0.35 * sc * on; }
          c.fillText(ch, xx, y); c.shadowBlur = 0;
          xx += ws[i] + size * 0.08;
        });
        // a row of chaser bulbs above and below
        const n = 26;
        for (let k = 0; k < n; k++) {
          const bx = x - tot * 0.6 + k / (n - 1) * tot * 1.2, chase = (k + Math.floor(t * 8)) % 3 === 0 && t > 8.6;
          [-0.85, 0.85].forEach(dy => { c.fillStyle = chase ? '#fff4c0' : t > 8.6 ? '#e0a040' : '#5a3020'; c.beginPath(); c.arc(bx, y + dy * size, Math.max(1.5, 0.05 * sc), 0, TAU); c.fill(); });
        }
        c.restore();
        break;
      }
    }
  }

  MG.film({
    id: 'oneshot', dur: 10, poster: 9.5,
    fonts: [['400 120px "Bebas Neue"', 'ONE-SHOT THE ORCHID ROOM'], ['600 30px "IBM Plex Mono"', 'TC 01:00:00:00 TAKE']],
    meta: {
      family: 'H', name: 'One-shot Camera Motion', sub: 'The Unbroken Take', era: '1958 —',
      origin: 'A whole scene played as one continuous shot, with the camera craning, tracking and threading through doorways instead of cutting. Orson Welles opened Touch of Evil (1958) with a three-minute crane shot; the Steadicam (Garrett Brown, 1975) made Martin Scorsese\'s Copacabana walk in Goodfellas (1990) possible, and digital stitching let Alfonso Cuarón, Alejandro G. Iñárritu and Sam Mendes extend the illusion to whole sequences and films.',
      works: 'Touch of Evil (Orson Welles, 1958) · Goodfellas — Copacabana shot (Martin Scorsese, DP Michael Ballhaus, 1990) · Children of Men (Alfonso Cuarón, DP Emmanuel Lubezki, 2006) · Birdman (Alejandro G. Iñárritu, 2014) · 1917 (Sam Mendes, DP Roger Deakins, 2019)',
      tech: ['Crane-to-Steadicam move', 'Choreographed blocking ahead of camera', 'Doorway & window passes (hidden stitches)', 'Continuous timecode, zero cuts'],
      accent: '#d8a040',
      motionDNA: 'One spline-smooth camera that never cuts: it cranes down, falls in behind its subjects, turns corners with them, floats through a tight kitchen aisle and finally rises and settles as the action resolves in front of it.',
      visualDNA: 'Anamorphic 2.39:1 frame, deep staging in real perspective, each room with its own light — sodium street, red corridor, green fluorescent kitchen, warm club — and the timecode running without a break.',
      transitions: 'None — doorways, a swinging door and the crane move do the work of cuts',
      implementation: ['Steadicam / crane / gimbal', 'Previs in Unreal or Blender', 'Canvas 2D (portal-ordered 3D projection)'],
      reproducibility: 'Procedural (needs choreography and rehearsal in live action)',
      loopable: false,
    },
    setup() { return { geo: osGeometry() }; },
    draw(c, t, W, H, st) {
      const cam = osCam(t);
      // Steadicam float: slow drift and a hint of roll
      cam[0] += vnoise(t * 0.8, 1) * 0.03; cam[1] += vnoise(t * 0.9, 2) * 0.025; cam[2] += vnoise(t * 0.7, 3) * 0.03;
      const roll = vnoise(t * 0.6, 4) * 0.012;
      const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#04060e'); sky.addColorStop(1, '#141a30');
      c.fillStyle = sky; c.fillRect(0, 0, W, H);
      c.save(); c.translate(W / 2, H / 2); c.rotate(roll); c.translate(-W / 2, -H / 2);
      osRender(c, st, cam, t, W, H);
      c.restore();
      // the slate in front of the lens, clapped and pulled away
      if (t < 0.75) {
        const u = E.inQ(seg(t, 0.3, 0.75)), cl = 1 - E.inQ(seg(t, 0.02, 0.14));
        c.save(); c.translate(960 - u * 900, 600 + u * 700); c.rotate(-0.06 - u * 0.5);
        c.fillStyle = '#18181a'; c.fillRect(-520, -200, 1040, 560);
        c.strokeStyle = '#f4f4f0'; c.lineWidth = 6; c.strokeRect(-490, -150, 980, 480);
        [['PROD.', 'MOTION STYLE ATLAS', -100], ['SCENE', '1', 30], ['TAKE', '1', 30]].forEach(([a, b, y], i) => {
          if (i === 0) { text(c, a, -460, -80, { font: OSM, weight: 600, size: 30, color: '#f4f4f0' }); text(c, b, -300, -80, { font: OSB, size: 64, color: '#f4f4f0', ls: 3 }); }
          else { const x0 = i === 1 ? -460 : 20; text(c, a, x0, 40, { font: OSM, weight: 600, size: 30, color: '#f4f4f0' }); text(c, b, x0 + 130, 120, { font: OSB, size: 150, color: '#f4f4f0' }); }
        });
        c.beginPath(); c.moveTo(-490, -10); c.lineTo(490, -10); c.moveTo(0, -10); c.lineTo(0, 330); c.stroke();
        text(c, 'ONE CONTINUOUS SHOT · NO CUTS', -460, 300, { font: OSM, weight: 600, size: 26, color: '#f4f4f0', ls: 2 });
        // clapper sticks
        const stick = (y, rot) => { c.save(); c.translate(-520, y); c.rotate(rot); c.fillStyle = '#f4f4f0'; c.fillRect(0, -70, 1040, 70); c.fillStyle = '#18181a'; for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(k * 130 + 20, -70); c.lineTo(k * 130 + 85, -70); c.lineTo(k * 130 + 45, 0); c.lineTo(k * 130 - 20, 0); c.closePath(); c.fill(); } c.restore(); };
        stick(-200, 0); stick(-275, -0.32 * cl);
        c.restore();
      }
      grain(c, W, H, t, 0.06, 'overlay');
      vignette(c, W, H, 0.5);
      // anamorphic letterbox and the camera report burned into the bars
      c.fillStyle = '#000'; c.fillRect(0, 0, W, OS_BAR); c.fillRect(0, H - OS_BAR, W, OS_BAR);
      const fr = Math.floor(t * 24), tc = `01:00:${String(Math.floor(fr / 24)).padStart(2, '0')}:${String(fr % 24).padStart(2, '0')}`;
      c.fillStyle = Math.floor(t * 2) % 2 ? '#e8302a' : '#7a1a16'; c.beginPath(); c.arc(70, 69, 11, 0, TAU); c.fill();
      text(c, 'REC   A-CAM   SC 1 / TK 1', 96, 80, { font: OSM, weight: 600, size: 28, color: '#d8d8d0', ls: 2 });
      const rm = OS_ROOMS[OS_ROOMS.findIndex(R => R.in(cam))].name;
      text(c, rm, W - 60, 80, { font: OSM, weight: 600, size: 28, align: 'right', color: '#d8a040', ls: 4 });
      text(c, 'TC ' + tc, 60, H - 56, { font: OSM, weight: 600, size: 34, color: '#f0f0e8', ls: 2 });
      text(c, 'CUTS: 0', 520, H - 56, { font: OSM, weight: 600, size: 34, color: '#d8a040', ls: 2 });
      // floor plan with the camera's path drawn so far
      c.save(); c.translate(W - 440, H - 122);
      const mp = (x, z) => [(z + 10) * 11, 104 - (x + 2) * 4];
      c.strokeStyle = 'rgba(220,220,210,0.35)'; c.lineWidth = 1.5;
      [[-10, -2, 10, 3], [10, -1, 17.5, 1], [11.5, 1, 20.5, 9], [7, 9, 25, 24]].forEach(([z0, x0, z1, x1]) => { const a = mp(x0, z0), b = mp(x1, z1); c.strokeRect(a[0], b[1], b[0] - a[0], a[1] - b[1]); });
      c.strokeStyle = '#d8a040'; c.lineWidth = 3; c.beginPath();
      for (let k = 0; k <= 60; k++) { const tt = k / 60 * t, p = osCam(tt), q = mp(p[0], p[2]); k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }
      c.stroke();
      const q = mp(cam[0], cam[2]); c.fillStyle = '#fff'; c.beginPath(); c.arc(q[0], q[1], 5, 0, TAU); c.fill();
      c.restore();
      // the closing card in the lower bar
      if (t > 8.9) {
        const a = E.outQ(seg(t, 8.9, 9.3));
        c.save(); c.globalAlpha = a; c.fillStyle = '#000'; c.fillRect(0, H - OS_BAR, 1480, OS_BAR);
        text(c, 'ONE-SHOT CAMERA MOTION', 60, H - 52, { font: OSB, size: 76, color: '#f4ecd8', ls: 6 });
        text(c, 'THE UNBROKEN TAKE · 1958—', 880, H - 58, { font: OSM, weight: 600, size: 28, color: '#d8a040', ls: 3 });
        c.restore();
      }
    },
    score(A) {
      A.bus.gain.value = 0.85;
      // slate clap
      A.noise(0.1, { type: 'highpass', f: 1200, dur: 0.06, g: 0.5, rev: 0.25 }); A.osc(0.1, { type: 'triangle', f: 900, f2: 300, dur: 0.05, g: 0.15 });
      // the band: muffled outside, opening up as the doors open
      const lpAt = t => (t < 2.6 ? 500 : t < 4.2 ? 800 : t < 6.6 ? 1300 : 6000), gAt = t => (t < 2.6 ? 0.45 : t < 4.2 ? 0.6 : t < 6.6 ? 0.7 : 1);
      const B = 0.4, prog = [[46, 50, 53, 57], [41, 45, 48, 51], [46, 50, 53, 57], [39, 43, 46, 50], [41, 45, 48, 51], [46, 50, 53, 58]];
      for (let k = 0; k * B < 9.6; k++) {
        const t = 0.3 + k * B, ch = prog[Math.floor(k / 4) % prog.length], lp = lpAt(t), g = gAt(t);
        A.pluck(t, midi(ch[k % 4] - 12), { dur: 0.6, g: 0.34 * g, bright: 0.45, decay: 0.99, lp: Math.min(lp, 900) });
        A.hat(t, 0.05 * g, k % 2 === 1, { f: lp > 1000 ? 7000 : 3000 });
        A.hat(t + B * 0.66, 0.035 * g, false, { f: lp > 1000 ? 7000 : 3000 });
        if (k % 2) A.noise(t, { type: 'bandpass', f: 1800, q: 0.6, dur: 0.12, g: 0.03 * g });
        if (k % 4 === 0) A.chord(t + B * 0.66, ch.map(m => m + 12), { type: 'triangle', dur: B * 1.2, g: 0.012 * g, lp, a: 0.01, rev: 0.3 });
      }
      // horn line in the club
      [[6.9, 70, 0.6], [7.5, 72, 0.4], [7.9, 74, 0.4], [8.3, 77, 0.8], [9.1, 74, 0.8]].forEach(([t, m, d]) => A.osc(t, { type: 'sawtooth', f: midi(m), dur: d, g: 0.04, lp: 2400, vib: [5.5, 4], a: 0.04, hold: true, rel: 0.12, rev: 0.4 }));
      // street: traffic hush, a distant horn, footsteps on the pavement
      A.noise(0.0, { type: 'lowpass', f: 400, dur: 2.8, g: 0.08, hold: true, rel: 0.4 });
      A.osc(0.9, { type: 'square', f: 330, dur: 0.35, g: 0.025, lp: 900, hold: true, rev: 0.5 }); A.osc(0.9, { type: 'square', f: 415, dur: 0.35, g: 0.02, lp: 900, hold: true, rev: 0.5 });
      for (let k = 0; k < 14; k++) A.noise(0.6 + k * 0.29, { type: 'bandpass', f: 900, q: 1.5, dur: 0.04, g: 0.06 });
      // door
      A.whoosh(2.4, 0.5, { f1: 300, f2: 1500, g: 0.08 });
      // kitchen: clatter, a sizzle, a pan
      A.noise(4.3, { type: 'highpass', f: 4000, dur: 2.2, g: 0.04, swell: 0.3 });
      for (let k = 0; k < 12; k++) A.bell(4.4 + hash(k * 3.3) * 1.9, 1200 + hash(k) * 2400, { g: 0.012, dur: 0.4, ratios: [1, 2.4, 3.9], rev: 0.2 });
      A.osc(5.2, { type: 'triangle', f: 600, f2: 200, dur: 0.15, g: 0.05 });
      // swinging door into the club, the crowd swells
      A.whoosh(6.5, 0.45, { f1: 400, f2: 2500, g: 0.1 });
      A.noise(6.6, { type: 'bandpass', f: 900, q: 0.5, dur: 3.4, g: 0.05, hold: true, rel: 0.5 });
      // marquee lights, a drum fill and the final chord as the camera settles
      for (let i = 0; i < 8; i++) A.osc(8.2 + i * 0.09, { type: 'sine', f: 1600 + i * 120, dur: 0.05, g: 0.02 });
      [8.6, 8.7, 8.8, 8.9].forEach((tt, i) => A.snare(tt, 0.12 + i * 0.04, { rev: 0.2 }));
      A.kick(9.0, 0.6);
      A.chord(9.0, [46, 50, 53, 57, 60], { type: 'sawtooth', dur: 1.0, g: 0.022, lp: 3000, a: 0.02, hold: true, rel: 0.5, spread: 8, rev: 0.5, width: 0.8 });
      A.noise(9.0, { type: 'highpass', f: 5000, dur: 1.0, g: 0.06, rev: 0.6 });
      for (let k = 0; k < 30; k++) A.clap(9.15 + hash(k * 2.3) * 0.8, 0.03 + hash(k) * 0.03, { rev: 0.1 });
    },
  });
})();
