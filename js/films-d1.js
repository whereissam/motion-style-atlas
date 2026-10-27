/* Batch d1 — Family A, Graphic Design & Historical: Art Deco Motion, Constructivism, Psychedelic 60s. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, roughPoly, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Limelight&family=Poiret+One&family=Rubik+Mono+One&family=Oswald:wght@500;700&family=Titan+One&family=Righteous&display=block');

  const mixRGB = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const css = (a, al = 1) => `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${al})`;
  const hexRGB = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const decay = (t, at, k) => (t >= at ? Math.exp(-(t - at) * k) : 0);
  const setLS = (c, v) => { if ('letterSpacing' in c) c.letterSpacing = v + 'px'; };
  const poly = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); };
  const polyLen = pts => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
  // stroke the first p (0..1) of a polyline's length
  // simultaneous noise hits share the engine's buffer offset (hashed from t) and sum coherently into
  // spikes; nudging each call by a sub-millisecond decorrelates them
  function decorrelate(A) {
    const n0 = A.noise.bind(A);
    let k = 0;
    A.noise = (t, o) => n0(t + (k++ % 9) * 0.00083, o);
  }
  function strokePart(c, pts, p, L = polyLen(pts)) {
    if (p <= 0) return;
    let rem = L * Math.min(1, p);
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], d = Math.hypot(x1 - x0, y1 - y0);
      if (rem >= d) { c.lineTo(x1, y1); rem -= d; } else { const k = rem / d; c.lineTo(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k); break; }
    }
    c.stroke();
  }

  /* ================================================================
     ART DECO — one plumb line falls; a sunburst, a Chrysler crown, a
     setback skyline, chevrons, fans and streamlines bloom in mirror
     symmetry into a gold-on-black crest. Big band, 150 bpm swing.
     ================================================================ */
  const DCX = 960, HZ = 655;
  const DB = k => 0.9 + 0.4 * k;           // beat grid
  const GOLD = [[0, [92, 62, 20]], [0.13, [178, 130, 54]], [0.25, [246, 222, 150]], [0.34, [214, 168, 76]], [0.48, [118, 82, 30]],
    [0.6, [222, 182, 96]], [0.71, [255, 241, 192]], [0.83, [198, 150, 62]], [1, [108, 74, 26]]];
  const goldAt = u => {
    u = clamp(u);
    for (let i = 1; i < GOLD.length; i++) if (u <= GOLD[i][0]) return mixRGB(GOLD[i - 1][1], GOLD[i][1], (u - GOLD[i - 1][0]) / (GOLD[i][0] - GOLD[i - 1][0]));
    return GOLD[GOLD.length - 1][1];
  };
  function goldGrad(c, x0, y0, x1, y1, sp = -1, sa = 0) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    for (let i = 0; i <= 48; i++) {
      const u = i / 48;
      let col = goldAt(u);
      if (sa > 0) col = mixRGB(col, [255, 253, 238], sa * Math.exp(-Math.pow((u - sp) / 0.045, 2)));
      g.addColorStop(u, css(col));
    }
    return g;
  }
  const IVORY = [244, 232, 200], DINK = '#0b0906';
  // right-hand towers of the setback skyline: dx from axis, then [width, top above horizon] per setback
  const TOWERS = [
    { dx: 330, tiers: [[124, 292], [94, 332], [62, 364], [28, 394]], spire: 446, t0: DB(4) },
    { dx: 482, tiers: [[150, 214], [114, 250], [76, 280]], spire: 0, t0: DB(4.5) },
    { dx: 628, tiers: [[128, 150], [94, 178], [58, 200]], spire: 236, t0: DB(5) },
    { dx: 756, tiers: [[94, 96], [62, 118]], spire: 0, t0: DB(5.5) },
  ];
  const CROWN = Array.from({ length: 6 }, (_, k) => ({ y: HZ - k * 68, r: 236 - k * 37, t0: DB(2 + k) }));
  const NEEDLE_TOP = 104;
  function frameHalf(ins, sx) {
    const X0 = DCX, X1 = 1864 - ins, Y0 = 46 + ins, Y1 = 1034 - ins, n = 3, s = 17;
    const pts = [[X0, Y0], [X1 - n * s, Y0]];
    for (let i = 0; i < n; i++) { pts.push([X1 - (n - i) * s, Y0 + (i + 1) * s]); pts.push([X1 - (n - i - 1) * s, Y0 + (i + 1) * s]); }
    pts.push([X1, Y1 - n * s]);
    for (let i = n - 1; i >= 0; i--) { pts.push([X1 - (n - i - 1) * s, Y1 - i * s]); pts.push([X1 - (n - i) * s, Y1 - i * s]); }
    pts.push([X0, Y1]);
    return pts.map(([x, y]) => [DCX + (x - DCX) * sx, y]);
  }
  // inline display letter: gold fill with an engraved black line running inside the stems
  function decoGlyph(ch, size) {
    const pad = 40, f = `400 ${size}px Limelight`;
    const m0 = offscreen(4, 4).getContext('2d'); m0.font = f;
    const mm = m0.measureText(ch), w = Math.ceil(mm.width) + pad * 2, h = Math.ceil(size * 1.3) + pad;
    const mk = (erode) => {
      const cv = offscreen(w, h), g = cv.getContext('2d');
      g.font = f; g.textBaseline = 'alphabetic'; g.fillStyle = '#fff'; g.fillText(ch, pad, size + pad * 0.5);
      if (erode > 0) { g.globalCompositeOperation = 'destination-out'; g.lineJoin = 'round'; g.lineWidth = erode * 2; g.strokeStyle = '#000'; g.strokeText(ch, pad, size + pad * 0.5); }
      return cv;
    };
    const A = mk(0), B = mk(5.5), C = mk(8.5);
    const out = offscreen(w, h), g = out.getContext('2d');
    g.drawImage(A, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = goldGrad(g, 0, pad * 0.5, w * 0.3, size + pad * 0.5); g.fillRect(0, 0, w, h);
    const R = offscreen(w, h), rg = R.getContext('2d');
    rg.drawImage(B, 0, 0); rg.globalCompositeOperation = 'destination-out'; rg.drawImage(C, 0, 0);
    rg.globalCompositeOperation = 'source-in'; rg.fillStyle = '#120d06'; rg.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'source-over'; g.drawImage(R, 0, 0);
    return { cv: out, w, h, adv: mm.width, ox: pad, oy: size + pad * 0.5 };
  }
  function star4(c, x, y, r, a) {
    if (a <= 0.01 || r <= 0) return;
    c.save(); c.globalAlpha = a;
    const g = c.createRadialGradient(x, y, 0, x, y, r * 1.6);
    g.addColorStop(0, 'rgba(255,246,214,0.9)'); g.addColorStop(0.25, 'rgba(255,220,140,0.35)'); g.addColorStop(1, 'rgba(255,200,100,0)');
    c.fillStyle = g; c.fillRect(x - r * 1.6, y - r * 1.6, r * 3.2, r * 3.2);
    c.fillStyle = '#fffaf0';
    c.beginPath();
    c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r * 0.16, y); c.quadraticCurveTo(x, y, x, y + r);
    c.quadraticCurveTo(x, y, x - r * 0.16, y); c.quadraticCurveTo(x, y, x, y - r);
    c.moveTo(x - r * 0.7, y); c.quadraticCurveTo(x, y, x, y - r * 0.1); c.quadraticCurveTo(x, y, x + r * 0.7, y);
    c.quadraticCurveTo(x, y, x, y + r * 0.1); c.quadraticCurveTo(x, y, x - r * 0.7, y);
    c.fill();
    c.restore();
  }

  function decoDraw(c, t, W, H, st) {
    if (!st.L) {
      st.L = offscreen(W, H);
      setLS(c, 0);
      st.glyphs = 'ART DECO'.split('').map(ch => (ch === ' ' ? null : decoGlyph(ch, 168)));
      const sp = 20, adv = st.glyphs.map(g => (g ? g.adv : 52) + sp);
      const tot = adv.reduce((a, b) => a + b, 0) - sp;
      let x = DCX - tot / 2;
      st.gx = adv.map(a => { const v = x; x += a; return v; });
      st.titleHW = tot / 2;
      st.frameR = [frameHalf(0, 1), frameHalf(14, 1)];
      st.frameL = [frameHalf(0, -1), frameHalf(14, -1)];
      st.frameLen = polyLen(st.frameR[0]);
    }
    // background: warm black with a faint projector bloom behind the crown
    const bg = c.createRadialGradient(DCX, 560, 40, DCX, 560, 1150);
    bg.addColorStop(0, '#1d160b'); bg.addColorStop(0.5, '#0d0a06'); bg.addColorStop(1, '#040302');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);

    const L = st.L, g = L.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    // camera: starts close on the plumb line, eases out to the full crest
    const s = kf(t, [[0, 1.62], [0.9, 1.5, E.outQ], [7.4, 1.0, E.ioS]]) * (1 + 0.012 * decay(t, 7.3, 5) + 0.006 * decay(t, 0.9, 6));
    const fy = kf(t, [[0, 430], [0.9, 450], [7.4, 540, E.ioS]]);
    const Yh = H / 2 + (HZ - fy) * s;
    g.setTransform(s, 0, 0, s, W / 2 - DCX * s, H / 2 - fy * s);

    const sweep = kf(t, [[5.6, -0.2], [6.6, 1.2, E.ioS]]);
    const sweep2 = kf(t, [[8.0, -0.2], [9.1, 1.2, E.ioS]]);
    const gold = goldGrad(g, 0, 0, W, H * 1.4, t < 7 ? sweep : sweep2, t < 7 ? (sweep > -0.1 && sweep < 1.1 ? 0.9 : 0) : (sweep2 > -0.1 && sweep2 < 1.1 ? 0.8 : 0));
    g.lineCap = 'butt'; g.lineJoin = 'miter';

    /* pinstripes behind everything */
    const pin = E.outC(seg(t, DB(4), DB(7)));
    if (pin > 0) {
      g.strokeStyle = 'rgba(214,168,76,0.07)'; g.lineWidth = 1.2;
      g.beginPath();
      for (let x = 92; x < 1830; x += 22) { const d = Math.abs(x - DCX) / 870, h = clamp((pin - d * 0.5) * 2); if (h > 0) { g.moveTo(x, 64); g.lineTo(x, 64 + (HZ - 64) * h); } }
      g.stroke();
    }

    /* sunburst */
    const N = 44;
    for (let i = 0; i <= N; i++) {
      const a = Math.PI + (Math.PI * i) / N, d = Math.abs(i - N / 2) / (N / 2);
      const t0 = 0.95 + d * 0.8, p = E.outQt(seg(t, t0, t0 + 0.6));
      if (p <= 0) continue;
      const R = 1150 * p;
      if (i % 2 === 0) {
        const hw = 0.0175;
        g.fillStyle = gold; g.globalAlpha = 0.9;
        g.beginPath(); g.moveTo(DCX, HZ); g.lineTo(DCX + Math.cos(a - hw) * R, HZ + Math.sin(a - hw) * R); g.lineTo(DCX + Math.cos(a + hw) * R, HZ + Math.sin(a + hw) * R); g.closePath(); g.fill();
      } else {
        g.strokeStyle = gold; g.globalAlpha = 0.75; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(DCX + Math.cos(a) * 60, HZ + Math.sin(a) * 60); g.lineTo(DCX + Math.cos(a) * R, HZ + Math.sin(a) * R); g.stroke();
      }
    }
    g.globalAlpha = 1;
    // fade the rays toward the frame
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.restore();
    {
      g.globalCompositeOperation = 'destination-out';
      const rf = g.createRadialGradient(DCX, HZ, 200, DCX, HZ, 1000);
      rf.addColorStop(0, 'rgba(0,0,0,0)'); rf.addColorStop(0.55, 'rgba(0,0,0,0.55)'); rf.addColorStop(1, 'rgba(0,0,0,0.97)');
      g.fillStyle = rf; g.fillRect(-200, -200, W + 400, H + 400);
      g.globalCompositeOperation = 'source-over';
    }
    /* halo arcs + pearl string */
    g.strokeStyle = gold; g.lineWidth = 2;
    [[300, 1.9], [318, 2.05], [640, 2.6]].forEach(([r, a0]) => {
      const p = E.ioC(seg(t, a0, a0 + 0.9));
      if (p <= 0) return;
      g.beginPath(); g.arc(DCX, HZ, r, 1.5 * Math.PI - p * Math.PI / 2, 1.5 * Math.PI + p * Math.PI / 2); g.stroke();
    });
    for (let i = 0; i <= 30; i++) {
      const a = Math.PI + (Math.PI * i) / 30, d = Math.abs(i - 15) / 15, p = E.outB(seg(t, 2.1 + d * 0.6, 2.35 + d * 0.6), 3);
      if (p <= 0) continue;
      g.fillStyle = gold; g.beginPath(); g.arc(DCX + Math.cos(a) * 340, HZ + Math.sin(a) * 340, 5.5 * p, 0, TAU); g.fill();
    }

    /* setback skyline (mirrored) */
    for (const T of TOWERS) {
      const rise = E.outQt(seg(t, T.t0, T.t0 + 0.7));
      if (rise <= 0) continue;
      for (const sx of [1, -1]) {
        const cx = DCX + sx * T.dx, dy = (1 - rise) * (T.tiers[T.tiers.length - 1][1] + 40);
        g.save();
        g.beginPath(); g.rect(0, -400, W, HZ + 400); g.clip();
        g.translate(0, dy);
        // silhouette
        const sil = [];
        T.tiers.forEach(([w, h], k) => { const y0 = k ? HZ - T.tiers[k - 1][1] : HZ; sil.push([cx - w / 2, y0], [cx - w / 2, HZ - h]); });
        const right = [];
        T.tiers.forEach(([w, h], k) => { const y0 = k ? HZ - T.tiers[k - 1][1] : HZ; right.push([cx + w / 2, y0], [cx + w / 2, HZ - h]); });
        const outline = sil.concat(right.reverse());
        g.fillStyle = DINK; poly(g, outline); g.closePath(); g.fill();
        // window pinstripes
        g.strokeStyle = 'rgba(232,190,104,0.30)'; g.lineWidth = 1.4;
        T.tiers.forEach(([w, h], k) => {
          const y0 = k ? HZ - T.tiers[k - 1][1] : HZ, n = Math.floor((w - 16) / 11);
          g.beginPath();
          for (let j = 0; j <= n; j++) { const x = cx - (n * 11) / 2 + j * 11; g.moveTo(x, y0 - 6); g.lineTo(x, HZ - h + 10); }
          g.stroke();
        });
        g.strokeStyle = gold; g.lineWidth = 2.6; poly(g, outline); g.stroke();
        // chevron crowns
        const base = T.tiers[0], top0 = HZ - base[1];
        for (let k = 0; k < 3; k++) {
          const j = TOWERS.indexOf(T) * 3 + k, tc = DB(8) + j * 0.133, p = E.outB(seg(t, tc, tc + 0.22), 2.4);
          if (p <= 0) continue;
          const hw = (base[0] / 2 - 12) * p, yy = top0 + 22 + k * 15;
          g.strokeStyle = gold; g.lineWidth = 3.2;
          g.beginPath(); g.moveTo(cx - hw, yy + hw * 0.42); g.lineTo(cx, yy); g.lineTo(cx + hw, yy + hw * 0.42); g.stroke();
        }
        if (T.spire) {
          const top = HZ - T.tiers[T.tiers.length - 1][1], sp = E.outC(seg(t, T.t0 + 0.4, T.t0 + 0.8));
          g.fillStyle = gold; g.beginPath(); g.moveTo(cx - 4, top); g.lineTo(cx, top - (T.spire - (HZ - top)) * sp - 2); g.lineTo(cx + 4, top); g.fill();
        }
        g.restore();
      }
    }

    /* Chrysler crown — six sunburst arches stepping up */
    for (const [k, T] of CROWN.entries()) {
      const p = seg(t, T.t0 - 0.1, T.t0 + 0.3);
      if (p <= 0) continue;
      const sc = E.outB(p, 2.2), oy = (1 - E.outC(p)) * 46;
      g.save();
      g.translate(DCX, T.y + oy); g.scale(sc, sc);
      const r = T.r, ri = r - 30;
      g.fillStyle = DINK;
      g.beginPath(); g.arc(0, 0, r + 2, Math.PI, TAU); g.closePath(); g.fill();
      g.fillStyle = gold; g.globalAlpha = 0.16;
      g.beginPath(); g.arc(0, 0, r, Math.PI, TAU); g.arc(0, 0, ri, TAU, Math.PI, true); g.closePath(); g.fill(); g.globalAlpha = 1;
      // triangular windows between stainless spokes
      const nS = 12;
      for (let j = 0; j < nS; j++) {
        const a0 = Math.PI + (Math.PI * j) / nS, a1 = Math.PI + (Math.PI * (j + 1)) / nS, am = (a0 + a1) / 2, w = (a1 - a0) * 0.36;
        const lit = clamp(seg(t, T.t0 + 0.12 + hash(k * 13 + j) * 0.3, T.t0 + 0.2 + hash(k * 13 + j) * 0.3)) * (0.85 + 0.15 * Math.sin(t * 9 + j * 2 + k));
        if (lit > 0) {
          g.fillStyle = css(mixRGB([255, 214, 140], [255, 250, 230], 0.5), lit);
          g.beginPath();
          g.moveTo(Math.cos(am - w) * (ri + 4), Math.sin(am - w) * (ri + 4));
          g.lineTo(Math.cos(am) * (r - 5), Math.sin(am) * (r - 5));
          g.lineTo(Math.cos(am + w) * (ri + 4), Math.sin(am + w) * (ri + 4));
          g.closePath(); g.fill();
        }
      }
      g.strokeStyle = gold; g.lineWidth = 2.4 / sc;
      g.beginPath(); g.arc(0, 0, r, Math.PI, TAU); g.stroke();
      g.lineWidth = 1.6 / sc;
      g.beginPath(); g.arc(0, 0, ri, Math.PI, TAU); g.stroke();
      g.beginPath();
      for (let j = 0; j <= nS; j++) { const a = Math.PI + (Math.PI * j) / nS; g.moveTo(Math.cos(a) * ri, Math.sin(a) * ri); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.stroke();
      // inner sunburst etching
      g.globalAlpha = 0.35; g.lineWidth = 1;
      g.beginPath();
      for (let j = 1; j < 24; j++) { const a = Math.PI + (Math.PI * j) / 24; g.moveTo(Math.cos(a) * 18, Math.sin(a) * 18); g.lineTo(Math.cos(a) * (ri - 6), Math.sin(a) * (ri - 6)); }
      g.stroke(); g.globalAlpha = 1;
      g.restore();
    }
    /* polished-floor reflection of everything above the horizon */
    {
      if (!st.R) st.R = offscreen(W, H);
      const rg = st.R.getContext('2d');
      rg.clearRect(0, 0, W, H); rg.drawImage(L, 0, 0);
      g.save(); g.setTransform(1, 0, 0, -1, 0, 2 * Yh);
      g.globalAlpha = 0.3 - 0.12 * seg(t, DB(15.5), DB(17)); g.drawImage(st.R, 0, 0, W, Yh, 0, 0, W, Yh);
      g.restore();
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'destination-out';
      const fg = g.createLinearGradient(0, Yh, 0, Yh + 260 * s);
      fg.addColorStop(0, 'rgba(0,0,0,0.25)'); fg.addColorStop(1, 'rgba(0,0,0,1)');
      g.fillStyle = fg; g.fillRect(0, Yh, W, H - Yh);
      g.restore();
    }
    /* plumb line → needle */
    {
      const drop = E.inQ(seg(t, 0.15, 0.85));
      const needle = E.outC(seg(t, DB(7.6), DB(8.4)));
      if (drop > 0 && t < DB(2.5)) {
        g.strokeStyle = gold; g.lineWidth = 2.4;
        g.beginPath(); g.moveTo(DCX, NEEDLE_TOP); g.lineTo(DCX, NEEDLE_TOP + (HZ - NEEDLE_TOP) * drop); g.stroke();
      }
      const ntop = CROWN[5].y - CROWN[5].r;
      if (t >= CROWN[5].t0) {
        g.fillStyle = gold;
        g.beginPath(); g.moveTo(DCX - 8, ntop + 2); g.lineTo(DCX, lerp(ntop, NEEDLE_TOP, Math.max(needle, 0.35))); g.lineTo(DCX + 8, ntop + 2); g.closePath(); g.fill();
        g.beginPath(); g.arc(DCX, ntop - 18, 6, 0, TAU); g.fill();
      }
    }
    /* horizon: a double rule shooting out from the axis */
    {
      const p = E.outQn(seg(t, 0.9, 1.35)), hw = 840 * p;
      if (p > 0) {
        g.fillStyle = gold;
        g.fillRect(DCX - hw, HZ, hw * 2, 4);
        g.fillRect(DCX - hw * 0.97, HZ + 10, hw * 1.94, 1.6);
      }
    }
    /* frame */
    {
      const p = E.ioC(seg(t, DB(4), DB(8)));
      if (p > 0) {
        g.strokeStyle = gold;
        [0, 1].forEach(k => { g.lineWidth = k ? 1.4 : 3; strokePart(g, st.frameR[k], p, st.frameLen); strokePart(g, st.frameL[k], p, st.frameLen); });
        const cp = E.outB(seg(t, DB(7.5), DB(8.3)), 2);
        if (cp > 0) for (const [x, y, a] of [[78, 68, 0], [1842, 68, Math.PI / 2], [1842, 1012, Math.PI], [78, 1012, -Math.PI / 2]]) {
          g.save(); g.translate(x, y); g.rotate(a); g.scale(cp, cp);
          g.lineWidth = 1.6;
          for (const r of [26, 40, 54]) { g.beginPath(); g.arc(0, 0, r, 0, Math.PI / 2); g.stroke(); }
          g.restore();
        }
      }
    }
    /* fans in the lower corners */
    for (const sx of [1, -1]) {
      const o = E.outB(seg(t, DB(10.2), DB(12.2)), 1.3);
      if (o <= 0) continue;
      const fx = DCX + sx * 690, fy = 1008, R = 164, nB = 10;
      g.save(); g.translate(fx, fy);
      const ang = j => 1.5 * Math.PI + ((Math.PI * j) / nB - Math.PI / 2) * o;
      g.fillStyle = DINK; g.strokeStyle = gold;
      g.beginPath(); g.moveTo(0, 0);
      for (let j = 0; j < nB; j++) { const a0 = ang(j), a1 = ang(j + 1), am = (a0 + a1) / 2; g.lineTo(Math.cos(a0) * R, Math.sin(a0) * R); g.quadraticCurveTo(Math.cos(am) * R * 1.16, Math.sin(am) * R * 1.16, Math.cos(a1) * R, Math.sin(a1) * R); }
      g.closePath(); g.fill(); g.lineWidth = 2.4; g.stroke();
      g.lineWidth = 1.4;
      g.beginPath();
      for (let j = 1; j < nB; j++) { const a = ang(j); g.moveTo(Math.cos(a) * 26, Math.sin(a) * 26); g.lineTo(Math.cos(a) * R, Math.sin(a) * R); }
      for (const rr of [0.38, 0.64]) { g.moveTo(Math.cos(ang(0)) * R * rr, Math.sin(ang(0)) * R * rr); g.arc(0, 0, R * rr, ang(0), ang(nB)); }
      g.stroke();
      g.globalAlpha = 0.55;
      for (let j = 0; j < nB; j++) { const am = (ang(j) + ang(j + 1)) / 2; g.beginPath(); g.moveTo(Math.cos(am) * R * 0.7, Math.sin(am) * R * 0.7); g.lineTo(Math.cos(am) * R * 0.98, Math.sin(am) * R * 0.98); g.stroke(); }
      g.globalAlpha = 1;
      g.fillStyle = gold; g.beginPath(); g.arc(0, 0, 14, Math.PI, TAU); g.fill();
      g.restore();
    }
    /* streamlines flanking the title */
    {
      const p = E.outQn(seg(t, DB(12), DB(13.2)));
      if (p > 0) {
        const x0 = st.titleHW + 46, x1 = 846;
        [-18, 0, 18].forEach((dy, k) => {
          const y = 792 + dy, len = (x1 - x0) * clamp(p * 1.15 - k * 0.07);
          g.fillStyle = gold;
          for (const sx of [1, -1]) {
            const a = DCX + sx * x0, b = DCX + sx * (x0 + len);
            g.fillRect(Math.min(a, b), y - (k === 1 ? 2 : 1), Math.abs(b - a), k === 1 ? 4 : 2);
            if (len > (x1 - x0) * 0.98) { g.beginPath(); g.arc(b, y, k === 1 ? 6 : 3.5, 0, TAU); g.fill(); }
          }
        });
        // light racing along the lines
        const run = seg(t, DB(12), DB(13.6));
        if (run > 0 && run < 1) {
          for (const sx of [1, -1]) {
            const hx = DCX + sx * lerp(x0, x1, E.outC(run)), lg = g.createLinearGradient(hx - sx * 260, 0, hx, 0);
            lg.addColorStop(0, 'rgba(255,240,200,0)'); lg.addColorStop(1, 'rgba(255,250,235,0.95)');
            g.fillStyle = lg; [-18, 0, 18].forEach((dy, k) => g.fillRect(Math.min(hx, hx - sx * 260), 792 + dy - (k === 1 ? 3 : 2), 260, k === 1 ? 6 : 4));
          }
        }
      }
    }
    /* title */
    {
      g.save();
      g.beginPath(); g.rect(0, HZ + 16, W, 400); g.clip();
      const order = [3, 2, 1, 0, 0, 1, 2, 3];
      st.glyphs.forEach((gl, i) => {
        if (!gl) return;
        const t0 = DB(16) - 0.25 + order[i] * 0.07, p = seg(t, t0, t0 + 0.55);
        if (p <= 0) return;
        const y = 862 + (1 - E.outQt(p)) * 230;
        g.globalAlpha = clamp(p * 3);
        g.drawImage(gl.cv, st.gx[i] - gl.ox, y - gl.oy);
      });
      g.globalAlpha = 1;
      g.restore();
      // sheen across the title after it lands
      const sh = seg(t, DB(17.5), DB(19.5));
      if (sh > 0 && sh < 1) {
        g.save();
        g.globalCompositeOperation = 'source-atop';
        const hx = lerp(DCX - st.titleHW - 200, DCX + st.titleHW + 200, E.ioS(sh));
        const lg = g.createLinearGradient(hx - 90, 700, hx + 90, 880);
        lg.addColorStop(0, 'rgba(255,255,240,0)'); lg.addColorStop(0.5, 'rgba(255,255,244,0.85)'); lg.addColorStop(1, 'rgba(255,255,240,0)');
        g.fillStyle = lg; g.fillRect(hx - 200, 690, 400, 200);
        g.restore();
      }
      // subtitle
      const sp = E.outC(seg(t, DB(18), DB(20)));
      if (sp > 0) {
        g.globalAlpha = sp;
        text(g, 'EXPOSITION  INTERNATIONALE  ·  PARIS  ·  MCMXXV', DCX, 948, { font: '"Poiret One"', size: 30, ls: 6 + (1 - sp) * 14, align: 'center', color: '#e9cf8e' });
        g.globalAlpha = 1;
      }
    }
    /* glints */
    const glints = [[DCX, NEEDLE_TOP, DB(8.4), 46], [DCX, NEEDLE_TOP, 8.15, 70], [DCX + 330, HZ - 446, 8.35, 30], [DCX - 330, HZ - 446, 8.5, 30],
      [DCX + 628, HZ - 236, 8.7, 24], [DCX - 628, HZ - 236, 8.9, 24], [DCX - st.titleHW + 10, 744, 8.6, 34], [DCX + st.titleHW - 30, 860, 9.05, 28]];
    for (const [x, y, t0, r] of glints) {
      const a = Math.sin(Math.PI * seg(t, t0, t0 + 0.7));
      star4(g, x, y, r * (0.6 + 0.4 * a), a);
    }
    {
      const a = Math.sin(Math.PI * seg(t, 0.0, 0.5)) + (t > 0.5 && t < 0.95 ? 0.4 * (1 - seg(t, 0.5, 0.95)) : 0);
      star4(g, DCX, NEEDLE_TOP, 40, a);
      if (t > 9.0) star4(g, DCX, NEEDLE_TOP, 30, 0.55 + 0.25 * Math.sin(t * 5));
    }

    // composite + gold bloom
    c.save();
    c.drawImage(L, 0, 0);
    c.globalCompositeOperation = 'lighter';
    c.filter = 'blur(14px)'; c.globalAlpha = 0.42; c.drawImage(L, 0, 0);
    c.filter = 'blur(3px)'; c.globalAlpha = 0.22; c.drawImage(L, 0, 0);
    c.restore();
    c.filter = 'none';
    // the hit at the downbeats flashes the whole crest
    const fl = 0.18 * decay(t, 0.9, 7) + 0.22 * decay(t, DB(16), 5);
    if (fl > 0.003) { c.fillStyle = `rgba(255,226,160,${fl})`; c.globalCompositeOperation = 'lighter'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
    vignette(c, W, H, 0.6);
    grain(c, W, H, t, 0.07);
  }

  function decoScore(A) {
    decorrelate(A);
    A.bus.gain.value = 0.85; A.send.gain.value = 0.85;   // headroom: keep peaks under -1 dBFS
    const b = DB, sw = 0.4 * 2 / 3;
    const brass = (t, notes, o = {}) => notes.forEach((m, i) => {
      A.osc(t, { type: 'sawtooth', f: midi(m), dur: o.dur ?? 0.32, g: (o.g ?? 0.03), a: 0.012, lp: 700, lp2: o.bright ?? 3600, lpT: 0.06, q: 1.2, detune: (i % 2 ? 7 : -7), vib: o.vib ? [5.5, o.vib] : null, rev: o.rev ?? 0.2, pan: ((i / Math.max(1, notes.length - 1)) - 0.5) * 0.7, hold: o.hold, rel: o.rel });
    });
    const sax = (t, notes, dur, g = 0.016) => notes.forEach((m, i) => A.osc(t, { type: 'sawtooth', f: midi(m), dur, g, a: 0.12, lp: 1300, q: 0.7, hold: true, rel: 0.2, vib: [5, 2.5], detune: i % 2 ? 5 : -5, rev: 0.3, pan: i % 2 ? 0.35 : -0.35 }));
    const crash = (t, g = 0.12, d = 1.8) => { A.noise(t, { type: 'highpass', f: 5200, dur: d, g: g * 0.6, a: 0.01, rev: 0.4 }); A.noise(t + 0.004, { type: 'bandpass', f: 3200, q: 0.6, dur: d * 0.5, g: g * 0.35, a: 0.01 }); };
    // intro: cymbal swell + clarinet glissando climbing to the downbeat
    A.noise(0.0, { type: 'highpass', f: 6000, dur: 0.92, g: 0.07, swell: 0.95, rev: 0.3 });
    A.osc(0.18, { type: 'square', f: midi(58), f2: midi(84), glide: 0.68, dur: 0.72, g: 0.035, a: 0.05, lp: 2600, vib: [6, 6], rev: 0.35, hold: true, rel: 0.05 });
    A.osc(0.18, { type: 'triangle', f: midi(58), f2: midi(84), glide: 0.68, dur: 0.72, g: 0.04, a: 0.05, hold: true, rel: 0.05 });
    // downbeat — the horizon
    brass(0.9, [48, 60, 64, 67, 69, 74, 76], { g: 0.034, dur: 0.5 });
    A.kick(0.9, 0.6); crash(0.9, 0.14, 2.2);
    A.osc(0.9, { f: midi(36), dur: 1.2, g: 0.16, a: 0.004 });
    // rhythm section: walking bass, ride, brushes
    const bass = [36, 40, 43, 45, 45, 49, 52, 55, 38, 41, 43, 47, 36, 40, 43, 44, 41, 45, 44, 43];
    for (let k = 0; k < 18; k++) {
      const t = b(k);
      const m = bass[k] ?? 36;
      A.pluck(t, midi(m), { dur: 0.6, g: 0.42, bright: 0.45, decay: 0.993, lp: 900 });
      A.osc(t, { f: midi(m), dur: 0.36, g: 0.11, a: 0.01 });
      A.hat(t, 0.045, false, { f: 7000, pan: 0.25 });
      if (k % 2 === 1) { A.hat(t - 0.4 + sw, 0.03, false, { f: 7500, pan: 0.25 }); A.noise(t, { type: 'bandpass', f: 2600, q: 0.5, dur: 0.16, g: 0.04, rev: 0.15 }); }
      if (k % 2 === 0) A.osc(t, { f: 110, f2: 50, dur: 0.18, g: 0.12 });
    }
    // crown tiers: stabs climbing with the arches
    const lead = [67, 69, 72, 74, 76, 79];
    CROWN.forEach((T, k) => {
      const ch = k < 2 ? [60, 64, 67, 69] : k < 4 ? [57, 61, 64, 67] : [62, 65, 69, 72];
      brass(T.t0, ch.map(m => m + (k % 2 ? 0 : 0)), { g: 0.02, dur: 0.18, bright: 3000 });
      A.osc(T.t0, { type: 'square', f: midi(lead[k]), dur: 0.26, g: 0.03, a: 0.01, lp: 2800, vib: [6, 4], rev: 0.3 });
      A.bell(T.t0 + 0.05, midi(lead[k] + 12), { g: 0.025, dur: 0.8 });
    });
    // frame draws: sax section pads
    sax(b(4), [57, 61, 64, 67], 1.6);
    sax(b(8), [53, 57, 60, 64], 0.8);
    sax(b(10), [55, 59, 62, 65], 0.8);
    // towers rise: muted trumpet doits
    TOWERS.forEach((T, k) => A.osc(T.t0, { type: 'square', f: midi(72 + k * 2), f2: midi(76 + k * 2), glide: 0.18, dur: 0.22, g: 0.018, lp: 1800, rev: 0.3, pan: k % 2 ? 0.4 : -0.4 }));
    // chevrons: vibraphone ladder
    for (let j = 0; j < 12; j++) {
      const t = b(8) + j * 0.133, m = [64, 67, 69, 72][j % 4] + Math.floor(j / 4) * 12 - 12;
      A.bell(t, midi(m), { g: 0.035, dur: 0.9, ratios: [1, 4, 10.2], pan: j % 2 ? 0.45 : -0.45, rev: 0.35 });
    }
    // fans unfurl: harp gliss
    for (let j = 0; j < 10; j++) A.pluck(b(10.2) + j * 0.045, midi([60, 64, 67, 69, 72, 76, 79, 81, 84, 88][j]), { dur: 1.0, g: 0.13, bright: 0.6, rev: 0.45, pan: (j / 9 - 0.5) });
    // streamlines: trombone glissando + whoosh + crash
    A.osc(b(12) - 0.1, { type: 'sawtooth', f: midi(41), f2: midi(53), glide: 0.42, dur: 0.6, g: 0.05, a: 0.04, lp: 900, lp2: 2600, lpT: 0.4, vib: [5, 3], rev: 0.3 });
    brass(b(12) + 0.33, [48, 59, 64, 67, 71], { g: 0.028, dur: 0.6 });
    A.whoosh(b(12), 0.9, { f1: 600, f2: 5000, g: 0.12, pan: 0 });
    crash(b(12), 0.09, 1.6);
    // drum fill into the title
    for (let k = 0; k < 6; k++) A.snare(b(14) + k * sw * 0.75, 0.06 + k * 0.03, { rev: 0.1 });
    brass(b(14), [55, 59, 62, 65], { g: 0.022, dur: 0.75, hold: true, rel: 0.1, vib: 4 });
    // title: tutti hit
    brass(b(16), [41, 53, 57, 60, 62, 65, 69], { g: 0.026, dur: 0.38 });
    brass(b(17), [41, 53, 56, 60, 62, 65, 68], { g: 0.03, dur: 0.3 });
    A.kick(b(16), 0.55); crash(b(16), 0.12, 2.0); A.osc(b(16), { f: midi(29), dur: 1, g: 0.14 });
    // final chord: C6/9, held with a shake and a ride roll
    brass(b(18), [36, 48, 55, 60, 64, 67, 69, 74, 76], { g: 0.028, dur: 1.85, hold: true, rel: 0.9, vib: 7, bright: 3200, rev: 0.45 });
    A.osc(b(18), { type: 'square', f: midi(84), dur: 1.8, g: 0.022, a: 0.05, lp: 3000, vib: [6.5, 10], hold: true, rel: 0.8, rev: 0.5 });
    A.kick(b(18), 0.55); crash(b(18), 0.13, 2.0);
    A.osc(b(18), { f: midi(36), dur: 1.8, g: 0.18, a: 0.004 });
    for (let k = 0; k < 14; k++) A.hat(b(18) + k * 0.05, 0.03 * (1 - k / 14), false, { f: 6500 });
    A.bell(8.15, midi(96), { g: 0.03, dur: 1.4 }); A.bell(8.6, midi(91), { g: 0.025, dur: 1.2, pan: 0.4 }); A.bell(8.9, midi(88), { g: 0.02, dur: 1, pan: -0.4 });
  }

  MG.film({
    id: 'artdeco', dur: 10, poster: 9.4,
    fonts: [['400 168px Limelight', 'ART DECO'], ['400 30px "Poiret One"', 'EXPOSITION INTERNATIONALE · PARIS · MCMXXV']],
    meta: {
      family: 'A', name: 'Art Deco Motion', sub: 'Machine-age Glamour', era: '1925 —',
      origin: 'Named after the 1925 Exposition Internationale des Arts Décoratifs in Paris, Art Deco fused Cubist geometry, Egyptian and Aztec motifs and machine-age streamlining; Cassandre\'s posters and New York\'s setback skyscrapers made it the look of luxury and speed.',
      works: 'Chrysler Building crown (William Van Alen, 1930) · "Normandie" poster (A. M. Cassandre, 1935) · "Étoile du Nord" poster (Cassandre, 1927) · Radio City Music Hall (1932) · The Great Gatsby titles (2013)',
      tech: ['Mirror-symmetric draw-on of every ornament', 'Metallic gold gradients with a travelling sheen', 'Inline display type rising through a horizon mask', 'Additive bloom on gold line-work'],
      accent: '#d9a84a',
      motionDNA: 'Everything grows from one axis in mirrored pairs: a plumb line falls, rays fan out on the beat, arches stack like a fanfare, lines streak outward, and a sheen sweeps the gold.',
      visualDNA: 'Gold on black: sunbursts, stepped ziggurats, chevrons, scallop fans and streamlines in strict bilateral symmetry, with high-contrast inline capitals.',
      transitions: 'Line draw-on from the axis, symmetrical bloom, mask-rise reveals, specular sweeps, slow camera pull-out.',
      implementation: ['After Effects', 'SVG', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw: decoDraw,
    score: decoScore,
  });

  /* ================================================================
     CONSTRUCTIVISM — the red wedge strikes the white circle; slogans
     slam on the diagonal, a halftone Kino-Eye opens behind radiating
     lines, a loudspeaker shouts, and the camera pulls back to reveal
     one agit-prop poster. Iron-foundry march, 120 bpm.
     ================================================================ */
  const KP = { pap: [234, 222, 194], red: [204, 34, 28], blk: [22, 19, 18], wht: [243, 235, 214] };
  const OSW = 'Oswald, "Arial Narrow", sans-serif', RMO = '"Rubik Mono One", sans-serif';
  const KC = [1330, 430], KR = 250;                         // the white circle / Kino-Eye
  const W_TIP = [1118, 452], W_BASE = [-150, 765], W_HALF = 182;
  const W_DIR = [W_TIP[0] - W_BASE[0], W_TIP[1] - W_BASE[1]], W_LEN = Math.hypot(W_DIR[0], W_DIR[1]);
  const W_U = [W_DIR[0] / W_LEN, W_DIR[1] / W_LEN], W_N = [-W_U[1], W_U[0]];
  const W_ANG = Math.atan2(W_U[1], W_U[0]);
  const FIELD = [[1115, -600], [2700, -600], [2700, 1700], [659, 1700]];
  const MEG = { x: 1372, y: 818, a: -0.16 };                 // loudspeaker mouth, axis angle (mouth faces -x)
  const SHOUT = [['Б', 5.0, 690, 236], ['Е', 5.25, 492, 196], ['Й', 5.5, 318, 160], ['!', 5.75, 172, 124]];
  // shards thrown off by the strike that settle as the poster's floating blocks
  const SHARDS = Array.from({ length: 13 }, (_, i) => {
    const r = rng(500 + i * 7);
    const ang = -2.6 + r() * 3.4, dist = 240 + r() * 520;
    return {
      x: W_TIP[0] + Math.cos(ang) * dist * 1.1, y: W_TIP[1] + Math.sin(ang) * dist * 0.8, w: 30 + r() * 60, h: 14 + r() * 24,
      rot: (r() - 0.5) * 1.6, spin: (r() - 0.5) * 9, red: r() > 0.55, tri: r() > 0.7, fly: 0.45 + r() * 0.5,
    };
  }).filter(s => !(s.x > 1060 && s.x < 1600 && s.y > 160 && s.y < 700) && s.x > 60 && s.x < 1860 && s.y > 60 && s.y < 1020);
  const KCAM = [
    [0, 1330, 430, 1.95, 0.04], [0.48, 1330, 430, 2.08, 0.06, E.inQ],
    [0.95, 760, 600, 1.22, -0.07, E.outX], [1.9, 700, 620, 1.18, -0.09, E.lin],
    [2.1, 1640, 640, 1.5, 0.12, E.ioX], [2.45, 1660, 660, 1.46, 0.13, E.lin],
    [2.7, 1330, 432, 2.15, 0.18, E.ioX], [4.45, 1330, 432, 2.45, 0.22, E.lin],
    [4.75, 1120, 860, 1.5, -0.13, E.ioX], [6.45, 1080, 870, 1.42, -0.16, E.lin],
    [7.0, 960, 540, 1.0, 0, E.ioX],
  ];
  function kCam(t) {
    const K = KCAM;
    if (t <= K[0][0]) return K[0].slice(1, 5);
    for (let i = 1; i < K.length; i++) if (t <= K[i][0]) {
      const a = K[i - 1], b = K[i], e = (b[5] || E.ioC)((t - a[0]) / (b[0] - a[0]));
      return [lerp(a[1], b[1], e), lerp(a[2], b[2], e), lerp(a[3], b[3], e), lerp(a[4], b[4], e)];
    }
    return K[K.length - 1].slice(1, 5);
  }
  // the halftone eye: darkness 0..1 at eye coords (u,v), eye width = 2 units
  function eyeDark(u, v, o, pupil) {
    const q = Math.max(0, 1 - u * u);
    const top = -(0.5 * o + 0.012) * Math.pow(q, 0.75) + 0.03, bot = (0.32 * o + 0.012) * Math.pow(q, 0.9) + 0.03;
    let d;
    if (Math.abs(u) < 1 && v > top && v < bot) {
      const r = Math.hypot(u - 0.03, v - 0.01);
      if (r < 0.4) {
        const a = Math.atan2(v, u);
        d = 0.5 + 0.2 * Math.sin(a * 29 + Math.sin(a * 6) * 2.5) * (r / 0.4) + 0.4 * seg(r, 0.31, 0.4);
        if (r < pupil) d = 1;
        if (Math.hypot(u + 0.1, v + 0.13) < 0.075) d = 0;
      } else d = 0.05 + 0.4 * Math.pow(Math.abs(u), 3) + 0.15 * clamp(1 - (bot - v) / 0.08);
      d = Math.max(d, 0.95 * clamp(1 - (v - top) / 0.09));
    } else {
      d = 0.16;
      const crease = -0.78 * Math.pow(q, 0.6) - 0.02;
      if (Math.abs(u) < 1.15) d += 0.5 * Math.exp(-Math.pow((v - crease) / 0.05, 2));
      d += 0.3 * clamp(1 - Math.hypot(u * 0.75, (v + 0.15) * 1.25));
      const brow = -1.12 + 0.22 * u * u - 0.08 * u;
      d += 0.75 * Math.exp(-Math.pow((v - brow) / 0.11, 2)) * clamp(1.4 - Math.abs(u)) * (0.8 + 0.2 * Math.sin(u * 40 + v * 13));
      if (v < top && v > top - 0.16 && Math.abs(u) < 0.98) {
        const k = clamp(1 - (top - v) / 0.16);
        d = Math.max(d, (Math.sin(u * 52 - (top - v) * 20 * u) > 0.1 ? 0.95 : 0.4) * k);
      }
      if (v > bot && v < bot + 0.05 && Math.abs(u) < 0.95) d = Math.max(d, 0.55);
      d += 0.18 * clamp((Math.hypot(u, v) - 0.9) / 0.5);
    }
    return clamp(d);
  }
  const h2 = (i, j, s) => hash(i * 157.31 + j * 311.7 + s * 71.3);
  function n2(x, y, s = 0) {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return lerp(lerp(h2(i, j, s), h2(i + 1, j, s), u), lerp(h2(i, j + 1, s), h2(i + 1, j + 1, s), u), v) * 2 - 1;
  }
  function megaphone(c, recoil) {
    c.save();
    c.translate(MEG.x, MEG.y); c.rotate(MEG.a); c.translate(recoil, 0);
    const blk = css(KP.blk), red = css(KP.red), wht = css(KP.wht);
    // handle
    c.fillStyle = blk; c.beginPath(); c.moveTo(286, 40); c.lineTo(318, 40); c.lineTo(352, 168); c.lineTo(318, 172); c.closePath(); c.fill();
    // cone
    c.fillStyle = red; c.beginPath(); c.moveTo(0, -128); c.lineTo(262, -36); c.lineTo(262, 36); c.lineTo(0, 128); c.closePath(); c.fill();
    c.fillStyle = wht;
    for (const [a, b] of [[64, 104], [150, 178]]) {
      const ha = lerp(128, 36, a / 262), hb = lerp(128, 36, b / 262);
      c.beginPath(); c.moveTo(a, -ha); c.lineTo(b, -hb); c.lineTo(b, hb); c.lineTo(a, ha); c.closePath(); c.fill();
    }
    // driver + cap
    c.fillStyle = blk; c.fillRect(256, -56, 74, 112);
    c.fillStyle = red; c.fillRect(330, -40, 26, 80);
    // mouth rim
    c.fillStyle = blk; c.beginPath(); c.ellipse(0, 0, 26, 130, 0, 0, TAU); c.fill();
    c.fillStyle = css(mixRGB(KP.blk, KP.red, 0.25)); c.beginPath(); c.ellipse(4, 0, 15, 112, 0, 0, TAU); c.fill();
    c.restore();
  }

  function kDraw(c, t, W, H, st) {
    if (!st.L) {
      st.L = offscreen(W, H);
      // mottled ink texture
      const tx = offscreen(480, 270), tg = tx.getContext('2d'), id = tg.createImageData(480, 270);
      for (let y = 0; y < 270; y++) for (let x = 0; x < 480; x++) {
        const n = n2(x * 0.03, y * 0.03, 1) * 0.5 + n2(x * 0.09, y * 0.09, 2) * 0.3 + n2(x * 0.35, y * 0.35, 3) * 0.2;
        const v = 128 + n * 110, i = (y * 480 + x) * 4;
        id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255;
      }
      tg.putImageData(id, 0, 0);
      st.tex = tx;
    }
    const L = st.L, g = L.getContext('2d');
    const cam = t => {
      let [fx, fy, s, r] = kCam(t);
      // punch-zooms and strikes
      const hits = [[0.5, 0.09, 9], [1.0, 0.05, 8], [1.5, 0.05, 8], [2.1, 0.04, 8], [3.0, 0.03, 6], [4.75, 0.03, 8], [5.0, 0.02, 9], [5.5, 0.025, 9], [7.0, 0.07, 6]];
      hits.forEach(([a, k, d]) => (s *= 1 + k * decay(t, a, d)));
      return [fx, fy, s, r];
    };
    const [fx, fy, s, rot] = cam(t);
    const shake = 16 * decay(t, 0.5, 7) + 12 * decay(t, 7.0, 6) + 5 * decay(t, 1.0, 10) + 5 * decay(t, 1.5, 10) + 6 * decay(t, 2.1, 10) + 4 * decay(t, 5.5, 10) + 3 * decay(t, 7.6, 12) + 3 * decay(t, 7.85, 12);
    const shx = shake * vnoise(t * 40, 11), shy = shake * vnoise(t * 40, 12);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = css(KP.pap); g.fillRect(0, 0, W, H);
    g.translate(W / 2 + shx, H / 2 + shy); g.rotate(rot); g.scale(s, s); g.translate(-fx, -fy);
    const BLK = css(KP.blk), RED = css(KP.red), WHT = css(KP.wht);

    /* black field */
    roughPoly(g, FIELD, 3, 2.5, 34); g.fillStyle = BLK; g.fill();

    /* radiating lines from the eye */
    {
      const n = 60;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU - Math.PI / 2, ord = ((i * 37) % n) / n;
        const t0 = 2.95 + ord * 0.35, p = E.outQt(seg(t, t0, t0 + 0.32));
        if (p <= 0) continue;
        const R0 = KR + 14, R1 = R0 + 1700 * p, hw = (i % 3 === 0 ? 0.016 : 0.006);
        if (i % 3 !== 0 && Math.cos(a) < -0.15) continue;
        g.fillStyle = RED;
        g.beginPath();
        g.moveTo(KC[0] + Math.cos(a - hw * 0.4) * R0, KC[1] + Math.sin(a - hw * 0.4) * R0);
        g.lineTo(KC[0] + Math.cos(a - hw) * R1, KC[1] + Math.sin(a - hw) * R1);
        g.lineTo(KC[0] + Math.cos(a + hw) * R1, KC[1] + Math.sin(a + hw) * R1);
        g.lineTo(KC[0] + Math.cos(a + hw * 0.4) * R0, KC[1] + Math.sin(a + hw * 0.4) * R0);
        g.closePath(); g.fill();
      }
    }

    /* the white circle + halftone Kino-Eye */
    {
      const cs = t < 0.02 ? 0 : 1;
      if (cs) {
        g.fillStyle = WHT; g.beginPath(); g.arc(KC[0], KC[1], KR, 0, TAU); g.fill();
        const reveal = seg(t, 2.55, 3.05), open = E.outB(seg(t, 2.85, 3.35), 1.4);
        if (reveal > 0) {
          const pupil = 0.17 + 0.05 * decay(t, 3.0, 4) - 0.04 * seg(t, 3.3, 4.2) + 0.03 * Math.sin(Math.max(0, t - 3.4) * 5) * seg(t, 3.4, 4.4) * (1 - seg(t, 7, 7.5));
          const sp = 10.5, A = Math.PI / 4, ca = Math.cos(A), sa = Math.sin(A), EA = 196;
          g.save(); g.beginPath(); g.arc(KC[0], KC[1], KR - 2, 0, TAU); g.clip();
          g.fillStyle = BLK; g.beginPath();
          const N = Math.ceil(KR / sp) + 2;
          for (let i = -N; i <= N; i++) for (let j = -N; j <= N; j++) {
            const lx = i * sp, ly = j * sp, x = lx * ca - ly * sa, y = lx * sa + ly * ca, rr = Math.hypot(x, y);
            if (rr > KR + 4) continue;
            const rv = clamp((reveal * 1.25 - rr / KR * 0.25 - (1 - reveal)) * 2.5);
            if (rv <= 0) continue;
            let d = eyeDark(x / EA, (y + 6) / EA, open, pupil);
            d = clamp(d + 0.15 * clamp((rr - KR * 0.8) / (KR * 0.2)));
            const rad = sp * 0.66 * Math.sqrt(d) * rv;
            if (rad < 0.35) continue;
            g.moveTo(KC[0] + x + rad, KC[1] + y); g.arc(KC[0] + x, KC[1] + y, rad, 0, TAU);
          }
          g.fill();
          g.restore();
          // the lens ring around the iris
          const lr = E.outQt(seg(t, 3.25, 3.75));
          if (lr > 0) {
            const ix = KC[0] + 0.03 * EA, iy = KC[1] + 6 + 0.01 * EA, R = 0.43 * EA;
            g.strokeStyle = RED; g.lineWidth = 6;
            g.beginPath(); g.arc(ix, iy, R, -Math.PI / 2, -Math.PI / 2 + TAU * lr); g.stroke();
            g.lineWidth = 3;
            const rr2 = (t - 3.25) * 0.6;
            g.beginPath();
            for (let k = 0; k < 12; k++) { const a = rr2 + (k / 12) * TAU; g.moveTo(ix + Math.cos(a) * (R + 6), iy + Math.sin(a) * (R + 6)); g.lineTo(ix + Math.cos(a) * (R + (k % 3 ? 16 : 30) * lr), iy + Math.sin(a) * (R + (k % 3 ? 16 : 30) * lr)); }
            g.moveTo(ix - R * 1.9 * lr, iy); g.lineTo(ix - R - 34, iy); g.moveTo(ix + R + 34, iy); g.lineTo(ix + R * 1.9 * lr, iy);
            g.stroke();
          }
        }
        // red ring around the whole circle
        const ring = E.outC(seg(t, 3.0, 3.5));
        if (ring > 0) { g.strokeStyle = RED; g.lineWidth = 12; g.beginPath(); g.arc(KC[0], KC[1], KR + 8, Math.PI * 0.75, Math.PI * 0.75 + TAU * ring); g.stroke(); }
      }
    }

    /* the red wedge */
    {
      const p = t < 0.5 ? E.inC(seg(t, 0.22, 0.5)) : 1 + 0.02 * Math.sin((t - 0.5) * 40) * decay(t, 0.5, 9);
      const off = (1 - p) * 1700;
      if (p > 0) {
        const tip = [W_TIP[0] - W_U[0] * off, W_TIP[1] - W_U[1] * off];
        const b1 = [W_BASE[0] - W_U[0] * off + W_N[0] * W_HALF, W_BASE[1] - W_U[1] * off + W_N[1] * W_HALF];
        const b2 = [W_BASE[0] - W_U[0] * off - W_N[0] * W_HALF, W_BASE[1] - W_U[1] * off - W_N[1] * W_HALF];
        roughPoly(g, [tip, b1, b2], 9, 2, 40); g.fillStyle = RED; g.fill();
        // speed streaks behind the strike
        if (t < 0.75 && t > 0.25) {
          const a = 1 - seg(t, 0.5, 0.75);
          g.fillStyle = `rgba(204,34,28,${0.5 * a})`;
          for (let k = 0; k < 5; k++) {
            const o = (k - 2) * 60, L0 = 300 + k * 90;
            const x0 = tip[0] - W_U[0] * (W_HALF * 2 + L0) + W_N[0] * o * 1.6, y0 = tip[1] - W_U[1] * (W_HALF * 2 + L0) + W_N[1] * o * 1.6;
            g.save(); g.translate(x0, y0); g.rotate(W_ANG); g.fillRect(-L0 - 600, -3, L0 + 300, 6); g.restore();
          }
        }
      }
    }
    /* shards */
    for (const sh of SHARDS) {
      const p = seg(t, 0.5, 0.5 + sh.fly);
      if (p <= 0) continue;
      const e = E.outQt(p), x = lerp(W_TIP[0], sh.x, e), y = lerp(W_TIP[1], sh.y, e), r = sh.rot + sh.spin * (1 - e) * 0.4;
      g.save(); g.translate(x, y); g.rotate(r); g.fillStyle = sh.red ? RED : BLK;
      if (sh.x > 1004 - (sh.y / 1080) * 230) g.fillStyle = sh.red ? RED : WHT;
      if (sh.tri) { g.beginPath(); g.moveTo(-sh.w / 2, sh.h / 2); g.lineTo(sh.w / 2, sh.h / 2); g.lineTo(0, -sh.h); g.closePath(); g.fill(); }
      else g.fillRect(-sh.w / 2, -sh.h / 2, sh.w, sh.h);
      g.restore();
    }

    /* slogans */
    const slam = (str, x, y, ang, size, col, t0, o = {}) => {
      const p = seg(t, t0 - 0.08, t0 + 0.02);
      if (p <= 0) return;
      const sc = lerp(o.from ?? 2.6, 1, E.inQ(p)) * (1 + 0.04 * decay(t, t0 + 0.02, 14) * Math.sin((t - t0) * 50));
      g.save(); g.translate(x, y); g.rotate(ang); g.scale(sc, sc);
      g.globalAlpha = clamp(p * 4);
      if (o.knock) text(g, str, 0, 0, { font: o.font || OSW, weight: o.weight ?? 700, size, ls: o.ls ?? 2, color: null, stroke: o.knock, lw: 14, align: o.align || 'left', base: o.base || 'alphabetic' });
      text(g, str, 0, 0, { font: o.font || OSW, weight: o.weight ?? 700, size, ls: o.ls ?? 2, color: col, align: o.align || 'left', base: o.base || 'alphabetic' });
      g.restore();
    };
    slam('КЛИНОМ', 486, 522, W_ANG, 118, BLK, 1.0, { knock: css(KP.pap) });
    slam('КРАСНЫМ', 300, 912, Math.atan2(W_TIP[1] - (W_BASE[1] + W_N[1] * W_HALF), W_TIP[0] - (W_BASE[0] + W_N[0] * W_HALF)), 128, BLK, 1.5, { knock: css(KP.pap) });
    slam('БЕЛЫХ', 1846, 1010, -Math.PI / 2, 150, WHT, 2.1, { ls: 6, knock: css(KP.blk) });

    /* loudspeaker + the shout */
    {
      const inP = seg(t, 4.5, 4.85);
      if (inP > 0) {
        const recoil = SHOUT.reduce((a, [, t0]) => a + 26 * decay(t, t0, 12) * (t >= t0 ? 1 : 0), 0) + 10 * decay(t, 6.0, 12) * (t > 6 ? 1 : 0);
        g.save();
        g.translate((1 - E.outB(inP, 1.2)) * 900, (1 - E.outB(inP, 1.2)) * 260);
        megaphone(g, recoil);
        g.restore();
        // sound waves
        const ux = -Math.cos(MEG.a), uy = -Math.sin(MEG.a);
        for (let k = 0; k < 10; k++) {
          const t0 = 5.0 + k * 0.125, p = seg(t, t0, t0 + 0.55);
          if (p <= 0 || p >= 1) continue;
          const R = 60 + p * 520;
          g.strokeStyle = `rgba(243,235,214,${(1 - p) * 0.9})`; g.lineWidth = 7 * (1 - p) + 2;
          g.beginPath(); g.arc(MEG.x + ux * 10, MEG.y + uy * 10, R, Math.PI + MEG.a - 0.42, Math.PI + MEG.a + 0.42); g.stroke();
        }
        for (const [ch, t0, d, size] of SHOUT) {
          const p = seg(t, t0, t0 + 0.2);
          if (p <= 0) continue;
          const e = E.outB(p, 2.2), dd = lerp(30, d, E.outQt(p));
          const x = MEG.x + ux * dd, y = MEG.y + uy * dd;
          g.save(); g.translate(x, y); g.rotate(MEG.a); g.scale(e * (1 + 0.1 * decay(t, 6.0, 10) * (t > 6 ? 1 : 0)), e);
          text(g, ch, 0, size * 0.36, { font: OSW, weight: 700, size, color: RED, align: 'center' });
          g.restore();
        }
      }
    }

    /* title + stamps */
    {
      const ta = W_ANG, tx = 62, ty = 372, TS = 122;
      const word = 'CONSTRUCTIVISM';
      g.save(); g.translate(tx, ty); g.rotate(ta);
      g.font = `700 ${TS}px ${OSW}`; setLS(g, 0);
      const ws = [...word].map(ch => g.measureText(ch).width);
      const tot = ws.reduce((a, b) => a + b + 3, -3);
      let x = 0;
      for (const pass of [0, 1]) {
        x = 0;
        for (let i = 0; i < word.length; i++) {
          const ch = word[i], w = ws[i], t0 = 7.0 + i * 0.022, p = seg(t, t0 - 0.07, t0);
          if (p > 0) {
            const sc = lerp(3.2, 1, E.inQ(p));
            g.save(); g.translate(x + w / 2, -TS * 0.36); g.scale(sc, sc); g.globalAlpha = clamp(p * 3);
            if (pass === 0) text(g, ch, 0, TS * 0.36, { font: OSW, weight: 700, size: TS, color: null, stroke: css(KP.pap), lw: 14, align: 'center' });
            else text(g, ch, 0, TS * 0.36, { font: OSW, weight: 700, size: TS, color: BLK, align: 'center' });
            g.restore();
          }
          x += w + 3;
        }
      }
      const bar = E.outQn(seg(t, 7.3, 7.6));
      if (bar > 0) { g.fillStyle = RED; g.fillRect(0, 14, tot * bar, 22); }
      const sub = seg(t, 7.55, 7.75);
      if (sub > 0) {
        g.globalAlpha = clamp(sub * 3);
        g.fillStyle = css(KP.pap); g.fillRect(-6, 44, tot + 12, 46);
        text(g, 'КОНСТРУКТИВИЗМ', 0, 82, { font: RMO, size: 32, color: BLK, ls: 1 });
        text(g, '1919—1934', tot, 84, { font: OSW, weight: 700, size: 44, color: RED, align: 'right' });
        g.globalAlpha = 1;
      }
      g.restore();
      // stamps
      const st1 = seg(t, 7.78, 7.86), st2 = seg(t, 8.0, 8.08);
      if (st1 > 0) {
        g.save(); g.translate(150, 1000); g.rotate(-Math.PI / 2 + 0.0); g.globalAlpha = clamp(st1 * 3);
        g.restore();
        g.save(); g.translate(64, 990); g.rotate(W_ANG); g.scale(lerp(1.8, 1, st1), lerp(1.8, 1, st1)); g.globalAlpha = clamp(st1 * 3);
        g.fillStyle = BLK; g.fillRect(0, -60, 70, 70);
        g.fillStyle = RED; g.fillRect(84, -60, 18, 70);
        g.restore();
      }
      if (st2 > 0) {
        g.save(); g.translate(1460, 70); g.rotate(0.0); g.globalAlpha = clamp(st2 * 3);
        const sc = lerp(1.8, 1, st2); g.scale(sc, sc);
        text(g, '№ 1', 0, 0, { font: RMO, size: 42, color: RED, base: 'top' });
        g.restore();
      }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    // print texture
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.22; g.drawImage(st.tex, 0, 0, W, H); g.restore();
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.07; g.drawImage(st.tex, 0, 0, W, H); g.restore();

    // whip motion blur from camera velocity
    const [fx2, fy2, s2, r2] = cam(t - 1 / 60);
    const vx = (fx - fx2) * s, vy = (fy - fy2) * s, vr = Math.abs(rot - r2) * 900 + Math.abs(s - s2) * 900;
    const v = Math.hypot(vx, vy) + vr;
    if (v > 6) {
      c.drawImage(L, 0, 0);
      const n = 5, ux = -vx / (v || 1), uy = -vy / (v || 1), len = Math.min(v * 1.6, 220);
      for (let k = 1; k <= n; k++) { c.globalAlpha = 0.5 / k * 1.2; c.drawImage(L, ux * len * k / n, uy * len * k / n); }
      c.globalAlpha = 1;
    } else c.drawImage(L, 0, 0);
    // strike flash
    const fl = decay(t, 0.5, 14);
    if (fl > 0.01) { c.fillStyle = `rgba(204,34,28,${0.55 * fl})`; c.fillRect(0, 0, W, H); }
    vignette(c, W, H, 0.32, '40,20,10');
    grain(c, W, H, t, 0.1);
  }

  function kScore(A) {
    decorrelate(A);
    A.bus.gain.value = 0.8; A.send.gain.value = 0.8;   // headroom: keep peaks under -1 dBFS
    const B = 0.5;
    const ost = [38, 38, 41, 38, 40, 38, 36, 38, 38, 38, 43, 38, 41, 40, 38, 36];
    const metal = (t, f, g = 0.05, pan = 0) => { A.bell(t, f, { g, dur: 0.5, ratios: [1, 2.13, 3.71, 5.29, 7.1], rev: 0.15, pan }); A.noise(t, { type: 'bandpass', f: 5200, q: 3, dur: 0.05, g: g * 0.8, pan }); };
    const brassStab = (t, notes, g = 0.05, dur = 0.3) => notes.forEach((m, i) => A.osc(t, { type: 'sawtooth', f: midi(m), dur, g, a: 0.008, lp: 500, lp2: 2400, lpT: 0.05, detune: i % 2 ? 9 : -9, rev: 0.25 }));
    // tension roll into the strike
    for (let k = 0; k < 16; k++) A.noise(k * 0.03, { type: 'bandpass', f: 2600, q: 0.8, dur: 0.05, g: 0.02 + k * 0.006 });
    A.osc(0.0, { type: 'sawtooth', f: midi(26), f2: midi(38), glide: 0.5, dur: 0.5, g: 0.06, a: 0.4, lp: 300, lp2: 1200, lpT: 0.5 });
    // STRIKE
    A.impact(0.5, 0.75); A.kick(0.5, 0.9, { f: 120, f2: 35, dur: 0.6 }); metal(0.5, 210, 0.12); metal(0.52, 330, 0.06, 0.4);
    A.noise(0.5, { type: 'highpass', f: 3500, dur: 1.4, g: 0.12, rev: 0.4 });
    brassStab(0.5, [26, 38, 45, 50], 0.06, 0.6);
    // the foundry: ostinato, march drum, anvils, steam
    for (let k = 0; k < 26; k++) {
      const t = 0.5 + B + k * 0.25;
      if (t > 6.95) break;
      const m = ost[k % 16];
      A.osc(t, { type: 'sawtooth', f: midi(m), dur: 0.2, g: 0.075, a: 0.004, lp: 1100, lp2: 300, lpT: 0.15 });
      A.osc(t, { type: 'square', f: midi(m - 12), dur: 0.18, g: 0.04, lp: 400 });
      if (k % 2 === 0) A.kick(t, 0.45, { f: 95, f2: 40, dur: 0.35 });
      if (k % 4 === 2) A.snare(t, 0.17, { f: 2400, rev: 0.12 });
      if (k % 4 === 3) { A.noise(t + 0.125, { type: 'bandpass', f: 2400, q: 0.9, dur: 0.06, g: 0.05 }); }
      if (k % 2 === 1) metal(t, k % 4 === 1 ? 880 : 1170, 0.025, k % 4 === 1 ? 0.5 : -0.5);
      if (k % 8 === 4) A.noise(t, { type: 'highpass', f: 2500, f2: 7000, dur: 0.35, g: 0.04, swell: 0.2, pan: -0.6 });
    }
    // slogan slams
    [[1.0, [26, 38, 45]], [1.5, [29, 41, 48]], [2.1, [31, 43, 50]]].forEach(([t, ch]) => {
      brassStab(t, ch, 0.055, 0.35); A.kick(t, 0.6, { f: 130, f2: 40 }); metal(t, 260, 0.05); A.noise(t, { type: 'lowpass', f: 3000, f2: 300, dur: 0.4, g: 0.12 });
    });
    A.whoosh(1.95, 0.2, { f1: 500, f2: 4000, g: 0.12 });
    // whip to the eye; shutter whirr; horn call
    A.whoosh(2.5, 0.25, { f1: 4000, f2: 400, g: 0.14 });
    for (let k = 0; k < 10; k++) A.noise(2.8 + k * 0.045, { type: 'bandpass', f: 3500 + k * 120, q: 6, dur: 0.02, g: 0.06 });
    A.noise(2.8, { type: 'bandpass', f: 900, f2: 3000, q: 2, dur: 0.5, g: 0.05 });
    A.noise(3.33, { type: 'bandpass', f: 4000, q: 2, dur: 0.03, g: 0.12 });
    [[3.0, 50, 0.45], [3.5, 57, 0.25], [3.75, 58, 0.25], [4.0, 57, 0.45]].forEach(([t, m, d]) => {
      A.osc(t, { type: 'sawtooth', f: midi(m), dur: d, g: 0.04, a: 0.03, lp: 1400, vib: [5.5, 4], rev: 0.35, hold: true, rel: 0.08 });
      A.osc(t, { type: 'sawtooth', f: midi(m - 12), dur: d, g: 0.03, a: 0.03, lp: 900, hold: true, rel: 0.08 });
    });
    metal(3.0, 160, 0.09); A.noise(3.0, { type: 'highpass', f: 4500, dur: 1.2, g: 0.07, rev: 0.4 });
    // whip to the loudspeaker; it lands
    A.whoosh(4.45, 0.3, { f1: 300, f2: 3000, g: 0.14 });
    A.kick(4.82, 0.7, { f: 90, f2: 30, dur: 0.5 }); metal(4.82, 140, 0.06);
    // the shout: megaphone voice — crushed saw formants
    SHOUT.forEach(([, t0], i) => {
      const f0 = [150, 160, 175, 200][i];
      A.osc(t0, { type: 'sawtooth', f: f0, f2: f0 * 0.8, glide: 0.22, dur: 0.24, g: 0.05, crush: true, lp: 2200, q: 4, a: 0.01 });
      A.noise(t0, { type: 'bandpass', f: 1300, q: 4, dur: 0.2, g: 0.1, crush: true });
      A.noise(t0, { type: 'bandpass', f: 2700, q: 5, dur: 0.12, g: 0.05 });
      brassStab(t0, [38 + i * 2, 45 + i * 2], 0.04, 0.2);
    });
    // build to the reveal
    for (let k = 0; k < 16; k++) A.noise(6.0 + k * 0.03, { type: 'bandpass', f: 2500, q: 0.8, dur: 0.04, g: 0.02 + k * 0.004 });
    for (let k = 0; k < 8; k++) A.snare(6.5 + k * 0.0625, 0.05 + k * 0.025, { rev: 0.05 });
    A.riser(5.9, 1.1, { g: 0.12, f: 73 });
    A.whoosh(6.5, 0.5, { f1: 3000, f2: 300, g: 0.14 });
    // TITLE
    A.impact(7.0, 0.85); A.kick(7.0, 0.9, { f: 120, f2: 32, dur: 0.7 });
    brassStab(7.0, [26, 38, 45, 50, 53, 57], 0.045, 1.4);
    metal(7.0, 196, 0.1); metal(7.02, 294, 0.06, -0.4);
    A.noise(7.0, { type: 'highpass', f: 3000, dur: 1.8, g: 0.12, rev: 0.5 });
    for (let i = 0; i < 14; i++) A.noise(7.0 + i * 0.022, { type: 'bandpass', f: 1800 + (i % 3) * 400, q: 2, dur: 0.025, g: 0.05 });
    A.noise(7.3, { type: 'bandpass', f: 600, f2: 3000, q: 1, dur: 0.25, g: 0.06 });
    [7.55, 7.78, 8.0].forEach((t, i) => { A.kick(t, 0.5, { f: 110, f2: 45, dur: 0.3 }); A.noise(t, { type: 'bandpass', f: 900, q: 1.2, dur: 0.08, g: 0.12 }); metal(t, 300 + i * 90, 0.035); });
    // final sustain: low brass chord and ringing iron
    [26, 38, 45, 50].forEach((m, i) => A.osc(8.0, { type: 'sawtooth', f: midi(m), dur: 1.95, g: 0.035, a: 0.02, lp: 1600, lp2: 500, lpT: 1.8, detune: i % 2 ? 6 : -6, rev: 0.4, hold: true, rel: 1.0 }));
    A.bell(8.0, 98, { g: 0.08, dur: 2.0, ratios: [1, 2.13, 3.71, 5.29], rev: 0.5 });
    A.kick(8.0, 0.75, { f: 80, f2: 30, dur: 1.0 });
  }

  MG.film({
    id: 'constructivism', dur: 10, poster: 9.4,
    fonts: [['700 128px Oswald', 'КЛИНОМ КРАСНЫМ БЕЛЫХ БЕЙ! CONSTRUCTIVISM 1919—1934'], ['400 40px "Rubik Mono One"', 'КОНСТРУКТИВИЗМ № 1']],
    meta: {
      family: 'A', name: 'Constructivism', sub: 'Art into Life, Type as a Weapon', era: '1919 —',
      origin: 'Born in revolutionary Russia, Constructivism rejected easel art for agit-prop, posters and film; El Lissitzky, Alexander Rodchenko and the Stenberg brothers built images from diagonals, flat red and black, sans-serif type and photomontage.',
      works: '"Beat the Whites with the Red Wedge" (El Lissitzky, 1919) · Lengiz "Books" poster (Rodchenko, 1924) · "Kino-Eye" poster (Rodchenko, 1924) · "Man with a Movie Camera" poster (Stenberg brothers, 1929) · "Iron Foundry" (Mosolov, 1926–28)',
      tech: ['Steep diagonal camera with whip-pan blur', 'Procedural halftone photomontage', 'Hard slams with overshoot and shake', 'Hand-cut edges and print mottling'],
      accent: '#cc221c',
      motionDNA: 'Nothing drifts: a wedge strikes, words slam on steep angles, rays burst, the loudspeaker recoils with each shout, and the camera whips and rolls between blocks before pulling back to the poster.',
      visualDNA: 'Red, black and raw cream; wedge, circle and bar; condensed sans set on diagonals; halftone eye and radiating lines on letterpress paper.',
      transitions: 'Whip pans with motion blur, camera rolls, red flash on impact, slam-in scale stamps, final pull-back reveal.',
      implementation: ['After Effects', 'Canvas 2D', 'Web Audio'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw: kDraw,
    score: kScore,
  });

  /* ================================================================
     PSYCHEDELIC 60s — a liquid light show: dye drops bloom on the
     projector, fold into a kaleidoscope, an op-art spiral vibrates,
     flowers pop on the beat, and the gig poster melts into being,
     its letters flowing to fill a balloon the Wes Wilson way.
     ================================================================ */
  const PS = {
    ink: [36, 8, 62], red: [255, 38, 70], org: [255, 132, 0], yel: [255, 226, 64], pink: [255, 70, 170],
    grn: [18, 178, 98], blu: [22, 70, 214], vio: [104, 26, 200], lime: [176, 255, 40],
  };
  const PAIRS = [[[255, 40, 150], [30, 220, 110]], [[255, 110, 0], [30, 90, 255]], [[150, 30, 230], [255, 230, 40]], [[255, 40, 50], [20, 210, 200]]];
  const OILPAL = [[255, 40, 120], [255, 120, 0], [255, 225, 40], [120, 235, 40], [20, 200, 190], [40, 90, 255], [150, 40, 230]];
  const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const BW = 640, BH = 360, BS = 3;
  // dye drops: layer (0 cyan, 1 magenta, 2 yellow), drop time, orbit radius, phase, size
  const DROPS = Array.from({ length: 20 }, (_, j) => {
    const r = rng(900 + j * 13);
    return [[1, 0, 2][j % 3], 0.25 + j * 0.115, 60 + r() * 420, r() * TAU, j < 3 ? 250 - j * 30 : 50 + r() * 170];
  });
  const PSY_FLOWERS = [
    [330, 260, 120, 8, 4.0], [1600, 780, 140, 10, 4.15], [1580, 250, 110, 7, 4.3], [330, 820, 130, 9, 4.45], [760, 150, 80, 6, 4.6], [1180, 940, 90, 8, 4.75],
    [140, 540, 90, 7, 4.85], [1790, 520, 95, 8, 4.95], [960, 540, 330, 12, 5.0], [600, 900, 70, 6, 5.25], [1330, 130, 75, 7, 5.35], [1100, 160, 60, 6, 5.5], [820, 960, 60, 6, 5.6],
  ];
  const POSTER_FLOWERS = [[130, 130, 118, 9, 7.75], [1790, 130, 118, 9, 7.85], [130, 950, 118, 9, 7.95], [1790, 950, 118, 9, 8.05], [330, 60, 52, 7, 8.2], [1590, 60, 52, 7, 8.25], [72, 540, 52, 7, 8.3], [1848, 540, 52, 7, 8.35]];
  const FCOLS = [[PS.pink, PS.org, PS.yel], [PS.yel, PS.org, PS.vio], [PS.org, PS.pink, PS.lime], [PS.lime, PS.yel, PS.pink], [PS.vio, PS.pink, PS.yel]];
  function flower(c, x, y, R, n, cols, open, rot) {
    if (open <= 0.01) return;
    c.save(); c.translate(x, y); c.rotate(rot);
    const lw = Math.max(3, R * 0.075);
    c.lineJoin = 'round'; c.strokeStyle = css(PS.ink); c.lineWidth = lw;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU, pk = clamp(open * 1.4 - (k / n) * 0.4), L = R * E.outB(pk, 2.2);
      if (L <= 1) continue;
      const wd = R * Math.sin(Math.PI / n) * 1.25;
      c.save(); c.rotate(a);
      c.beginPath(); c.moveTo(R * 0.18, 0);
      c.bezierCurveTo(R * 0.3, -wd, L * 0.95, -wd * 1.05, L, 0);
      c.bezierCurveTo(L * 0.95, wd * 1.05, R * 0.3, wd, R * 0.18, 0);
      c.fillStyle = css(cols[k % 2]); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(R * 0.4, 0); c.lineTo(L * 0.78, 0); c.lineWidth = lw * 0.55; c.stroke(); c.lineWidth = lw;
      c.restore();
    }
    const cr = R * 0.3 * E.outB(clamp(open * 1.3), 2.5);
    c.fillStyle = css(cols[2]); c.beginPath(); c.arc(0, 0, cr, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = css(PS.ink);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; c.beginPath(); c.arc(Math.cos(a) * cr * 0.58, Math.sin(a) * cr * 0.58, cr * 0.12, 0, TAU); c.fill(); }
    c.restore();
  }
  // render text lines, each stretched to fill its slot of the box, into alpha masks at several stroke widths and blur levels
  function meltMasks(lines, font, SW, SH, P, strokes, blurs) {
    const cv = offscreen(SW, SH), g = cv.getContext('2d');
    const out = strokes.map(() => []);
    const n = lines.length, gap = 26, lh = (SH - 2 * P - gap * (n - 1)) / n;
    strokes.forEach((sw, si) => blurs.forEach(bl => {
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, SW, SH);
      g.filter = `blur(${bl}px)`;
      lines.forEach((str, i) => {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.font = font; setLS(g, 0);
        const m = g.measureText(str), tw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, th = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
        const sx = (SW - 2 * P) / tw, sy = lh / th, y0 = P + i * (lh + gap);
        g.setTransform(sx, 0, 0, sy, P + m.actualBoundingBoxLeft * sx, y0 + m.actualBoundingBoxAscent * sy);
        g.fillStyle = '#fff'; g.fillText(str, 0, 0);
        if (sw > 0) { g.lineJoin = 'round'; g.lineWidth = sw / Math.sqrt(sx * sy); g.strokeStyle = '#fff'; g.strokeText(str, 0, 0); }
      });
      g.filter = 'none';
      const d = g.getImageData(0, 0, SW, SH).data, a = new Uint8Array(SW * SH);
      for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3];
      out[si].push(a);
    }));
    return out;
  }
  function makeBlock(o) {
    o.masks = meltMasks(o.lines, o.font, o.SW, o.SH, o.P, [0, o.mid, o.outer], [1.2, 7, 18]);
    o.cv = offscreen(o.w, o.h); o.cg = o.cv.getContext('2d'); o.img = o.cg.createImageData(o.w, o.h);
    o.rowA = new Float32Array(o.h); o.colA = new Float32Array(o.w); o.colB = new Float32Array(o.w); o.drip = new Float32Array(o.w);
    return o;
  }
  function samp(a, SW, SH, x, y) {
    if (x < 0 || y < 0 || x >= SW - 1 || y >= SH - 1) return 0;
    const ix = x | 0, iy = y | 0, fx = x - ix, fy = y - iy, i = iy * SW + ix;
    return ((a[i] * (1 - fx) + a[i + 1] * fx) * (1 - fy) + (a[i + SW] * (1 - fx) + a[i + SW + 1] * fx) * fy) / 255;
  }
  // per-pixel melt: flow warp → shape map → gooey threshold of the blurred masks → three-tone lettering
  function meltDraw(c, B, amp, goo, ph, dripAmt, fillA, fillB, midCol, outCol, alpha) {
    if (alpha <= 0) return;
    const { w, h, SW, SH } = B, d = B.img.data;
    for (let y = 0; y < h; y++) B.rowA[y] = Math.sin((B.y + y) * 0.011 + ph * 2.1);
    for (let x = 0; x < w; x++) {
      B.colA[x] = Math.sin((B.x + x) * 0.0085 - ph * 1.7); B.colB[x] = Math.sin((B.x + x) * 0.021 + ph * 1.3);
      B.drip[x] = dripAmt * Math.pow(Math.max(0, Math.sin((B.x + x) * 0.037 + 1.3) * Math.sin((B.x + x) * 0.011 + 0.4)), 3);
    }
    const lv = goo * 2, l0 = Math.min(1, Math.floor(lv)), lf = lv - l0;
    const M = B.masks, m0 = [M[0][l0], M[1][l0], M[2][l0]], m1 = [M[0][l0 + 1], M[1][l0 + 1], M[2][l0 + 1]];
    const ew = 0.1 + goo * 0.06;
    const fr = [], fg = [], fb = [];
    for (let k = 0; k <= 32; k++) { const cc = mixRGB(fillA, fillB, k / 32); fr.push(cc[0]); fg.push(cc[1]); fb.push(cc[2]); }
    const uv = [0, 0];
    for (let y = 0; y < h; y++) {
      const Y = B.y + y, ra = B.rowA[y];
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4, X = B.x + x;
        const wx = X + amp * (ra + 0.35 * B.colB[x] * ra), wy = Y + amp * 0.6 * B.colA[x] - B.drip[x];
        if (!B.map(wx, wy, ph, uv)) { d[i + 3] = 0; continue; }
        const u = uv[0], v = uv[1];
        let mo = samp(m0[2], SW, SH, u, v);
        if (lf > 0) mo = lerp(mo, samp(m1[2], SW, SH, u, v), lf);
        const ao = sstep(0.5 - ew, 0.5 + ew, mo);
        if (ao <= 0) { d[i + 3] = 0; continue; }
        let mm = samp(m0[1], SW, SH, u, v), mf = samp(m0[0], SW, SH, u, v);
        if (lf > 0) { mm = lerp(mm, samp(m1[1], SW, SH, u, v), lf); mf = lerp(mf, samp(m1[0], SW, SH, u, v), lf); }
        const am = sstep(0.5 - ew, 0.5 + ew, mm), af = sstep(0.5 - ew, 0.5 + ew, mf);
        const k = clamp(v / SH) * 32 | 0;
        let r = outCol[0], g = outCol[1], b = outCol[2];
        r += (midCol[0] - r) * am; g += (midCol[1] - g) * am; b += (midCol[2] - b) * am;
        r += (fr[k] - r) * af; g += (fg[k] - g) * af; b += (fb[k] - b) * af;
        d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = ao * 255 * alpha;
      }
    }
    B.cg.putImageData(B.img, 0, 0);
    c.drawImage(B.cv, B.x, B.y);
  }
  const hueRot = (rgb, k) => { // cycle a colour through the poster palette
    const P = [PS.red, PS.org, PS.yel, PS.lime, PS.grn, PS.blu, PS.vio, PS.pink];
    const f = ((k % 8) + 8) % 8, i = Math.floor(f);
    return mixRGB(rgb, mixRGB(P[i], P[(i + 1) % 8], f - i), 0.85);
  };

  function psyBG(st, t) {
    const d = st.bgImg.data;
    const lamp = sstep(0.1, 0.22, t), flick = 1 - 0.25 * decay(t, 0.16, 30);
    // blobs
    const blobs = [];
    const wheel = t * 0.32;
    DROPS.forEach(([layer, t0, orb, ph, size], j) => {
      const g = E.outC(seg(t, t0, t0 + 1.1));
      if (g <= 0) return;
      const a = ph + wheel * (j % 2 ? 1 : -0.7) + 0.4 * Math.sin(t * 0.7 + j);
      const rr = orb * (0.6 + 0.4 * Math.sin(t * 0.5 + j * 1.7)) + 40;
      const s0 = size * g * (1 + 0.15 * Math.sin(t * 1.3 + j));
      blobs.push([960 + Math.cos(a) * rr, 540 + Math.sin(a) * rr * 0.75, s0 * s0]);
    });
    const kR = t < 2.1 ? -100 : 1400 * E.inQ(seg(t, 2.1, 2.9));
    const fold = sstep(2.1, 2.9, t), nK = 8, S = TAU / nK, krot = t * 0.4;
    const stripeR = t < 2.9 ? -100 : 1500 * E.inQ(seg(t, 2.9, 3.7)) + 120 * seg(t, 2.9, 3.0);
    const beat = Math.max(0, (t - 3) / 0.5);
    const pi = Math.floor(beat) % 4, pf = sstep(0.75, 1, beat - Math.floor(beat));
    const pA = mixRGB(PAIRS[pi][0], PAIRS[(pi + 1) % 4][0], pf), pB = mixRGB(PAIRS[pi][1], PAIRS[(pi + 1) % 4][1], pf);
    const spd = 7 + 22 * E.inQ(seg(t, 5.2, 6.1));
    const sph = t * 7 + 22 * Math.pow(seg(t, 5.2, 6.1), 2) * 6;
    const posterR = t < 5.85 ? -1 : 2400 * E.inQ(seg(t, 5.85, 6.3));
    const pt = t < 8.4 ? t : 8.4 + (t - 8.4) * 0.25;
    const oilA = 1 - seg(t, 6.3, 6.4);
    const oilK = (x, y) => {
      const rr0 = Math.hypot(x - 960, y - 540), L = lamp * flick * clamp(1.15 - Math.pow(rr0 / 1000, 2.4));
      const wx = x + 64 * Math.sin(y * 0.005 + t * 0.9) + 30 * Math.sin((x + y) * 0.011 - t * 1.3);
      const wy = y + 64 * Math.sin(x * 0.0045 - t * 0.7) + 30 * Math.cos((x - y) * 0.009 + t * 1.1);
      let F = 0;
      for (let q = 0; q < blobs.length; q++) { const dx = wx - blobs[q][0], dy = wy - blobs[q][1]; F += blobs[q][2] / (dx * dx + dy * dy + 1); }
      let R, G, Bc;
      if (F < 0.55) {
        const k = sstep(0.15, 0.55, F);
        R = lerp(70, 120, k); G = lerp(12, 20, k); Bc = lerp(110, 150, k);
      } else {
        const v = 7.5 * (1 - 1 / Math.sqrt(F)) - t * 1.6, idx = Math.floor(v), f = v - idx;
        const n = OILPAL.length, ca = OILPAL[((idx % n) + n) % n], cb = OILPAL[(((idx + 1) % n) + n) % n];
        const e = sstep(0.55, 0.95, f);
        R = ca[0] + (cb[0] - ca[0]) * e * 0.35; G = ca[1] + (cb[1] - ca[1]) * e * 0.35; Bc = ca[2] + (cb[2] - ca[2]) * e * 0.35;
        const line = Math.min(sstep(0.0, 0.05, f), 1 - sstep(0.93, 1.0, f)) * sstep(0.55, 0.62, F);
        const ink = 1 - 0.75 * (1 - line) * sstep(0.55, 0.62, F);
        R *= ink; G *= ink; Bc *= ink;
        const sh = 1 - 0.25 * e;
        R *= sh; G *= sh; Bc *= sh;
      }
      return [R * L, G * L, Bc * L];
    };
    let i = 0;
    for (let py = 0; py < BH; py++) {
      const y = (py + 0.5) * BS;
      for (let px = 0; px < BW; px++, i += 4) {
        const x = (px + 0.5) * BS, dx = x - 960, dy = y - 540, r = Math.hypot(dx, dy), th = Math.atan2(dy, dx);
        let R = 0, G = 0, Bc = 0;
        const inPoster = r < posterR + 60 * Math.sin(th * 7 + t * 4) ? 1 : 0;
        if (!inPoster || posterR < 0) {
          if (oilA > 0) {
            let c1;
            if (r < kR + 50 * Math.sin(th * 8 - t * 5)) {
              let a = (((th + krot) % S) + S) % S; if (a > S / 2) a = S - a;
              c1 = oilK(1060 + r * 0.9 * Math.cos(a - 0.3), 520 + r * 0.9 * Math.sin(a - 0.3));
            } else c1 = oilK(x, y);
            R = c1[0]; G = c1[1]; Bc = c1[2];
          }
          if (r < stripeR + 70 * Math.sin(th * 6 + t * 3)) {
            const sv = Math.sin(19 * Math.log(r + 24) + 8 * th - sph) + 0.25 * Math.sin(r * 0.02 + t * 3);
            const k = clamp(0.5 + sv * 2.2);
            const sr = pA[0] + (pB[0] - pA[0]) * k, sg = pA[1] + (pB[1] - pA[1]) * k, sb = pA[2] + (pB[2] - pA[2]) * k;
            const m = 0.9 * sstep(0, 60, r);
            R += (sr - R) * m; G += (sg - G) * m; Bc += (sb - Bc) * m;
          }
        } else {
          const th2 = th + 0.16 * Math.sin(r * 0.006 - pt * 1.4) + 0.05 * Math.sin(r * 0.02 + pt);
          const idx = Math.floor(((th2 + Math.PI) / TAU) * 40 + pt * 0.15);
          const cA = idx % 2 ? PS.grn : [12, 130, 176];
          const ring = 0.5 + 0.5 * Math.sin(r * 0.05 - pt * 3);
          const vig = clamp(1.1 - r / 1500);
          R = cA[0] * vig + ring * 6; G = cA[1] * vig + ring * 10; Bc = cA[2] * vig;
        }
        d[i] = R; d[i + 1] = G; d[i + 2] = Bc; d[i + 3] = 255;
      }
    }
    st.bgG.putImageData(st.bgImg, 0, 0);
  }

  function psyDraw(c, t, W, H, st) {
    if (!st.bg) {
      st.bg = offscreen(BW, BH); st.bgG = st.bg.getContext('2d'); st.bgImg = st.bgG.createImageData(BW, BH);
      st.main = makeBlock({
        lines: ['PSYCHE', 'DELIC'], font: '400 300px "Titan One"', SW: 1400, SH: 720, P: 40, mid: 14, outer: 34,
        x: 110, y: 140, w: 1700, h: 860,
        map(wx, wy, ph, uv) {
          const Xn = (wx - 960) / 700, Yn = (wy - 560) / 325;
          if (Yn <= -1.12 || Yn >= 1.12) return false;
          const hw = Math.pow(Math.max(0.03, 1 - Math.min(Yn * Yn, 0.93)), 0.33) * (1 + 0.04 * Math.sin(Yn * 6 + ph));
          const u = Xn / hw;
          uv[0] = 700 + u * 660; uv[1] = 360 + Yn * 320 * (1 + 0.08 * (1 - Math.abs(u)));
          return Math.abs(u) < 1.07;
        },
      });
      st.arch = makeBlock({
        lines: ['DANCE · CONCERT'], font: '400 160px Righteous', SW: 1100, SH: 200, P: 22, mid: 8, outer: 20,
        x: 400, y: 8, w: 1120, h: 262,
        map(wx, wy, ph, uv) {
          const dx = wx - 960, dy = wy - 1560, rr = Math.hypot(dx, dy), ph2 = Math.atan2(dy, dx) + Math.PI / 2;
          const u = ph2 / 0.62 + 0.5, v = (1500 - rr) / 120;
          uv[0] = 22 + u * 1056; uv[1] = 22 + v * 156;
          return u > -0.05 && u < 1.05 && v > -0.3 && v < 1.3;
        },
      });
      st.wave = makeBlock({
        lines: ['LIGHT SHOW · SAN FRANCISCO · 1967'], font: '400 120px Righteous', SW: 1500, SH: 140, P: 18, mid: 6, outer: 16,
        x: 330, y: 880, w: 1260, h: 196,
        map(wx, wy, ph, uv) {
          const u = (wx - 420) / 1080, yc = 975 + 16 * Math.sin(wx * 0.009 + ph * 0.6), v = (wy - yc + 42) / 84;
          uv[0] = 18 + u * 1464; uv[1] = 18 + v * 104;
          return u > -0.03 && u < 1.03 && v > -0.4 && v < 1.4;
        },
      });
    }
    psyBG(st, t);
    c.imageSmoothingEnabled = true;
    c.drawImage(st.bg, 0, 0, W, H);

    /* flowers blooming on the beat, then swallowed by the tunnel */
    if (t > 3.9 && t < 6.05) {
      const zoom = E.inC(seg(t, 5.7, 6.05));
      PSY_FLOWERS.forEach(([x, y, R, n, t0], j) => {
        const open = seg(t, t0, t0 + 0.45);
        if (open <= 0) return;
        const k = 1 + zoom * (j === 8 ? 9 : 4);
        const fx = 960 + (x - 960) * k, fy = 540 + (y - 540) * k;
        const pulse = 1 + 0.06 * Math.sin((t - 3) * Math.PI * 4) * (j === 8 ? 1 : 0.5);
        c.globalAlpha = 1 - seg(t, 5.9, 6.05);
        flower(c, fx, fy, R * k * pulse, n, FCOLS[j % FCOLS.length], open, (t - t0) * (j % 2 ? 0.6 : -0.6) + j);
        c.globalAlpha = 1;
      });
    }

    /* the gig poster */
    if (t >= 6.0) {
      const ph = t < 8.4 ? t : 8.4 + (t - 8.4) * 0.25;
      const cyc = (t - 6) * 2.2;
      const settle = (a, b) => E.outC(seg(t, a, b));
      // main balloon lettering
      {
        const s = settle(6.05, 7.9);
        const cool = clamp(1 - s);
        const fA = hueRot(PS.red, cyc * cool + 0), fB = hueRot(PS.org, cyc * cool + 1);
        meltDraw(c, st.main, lerp(90, 12, s), lerp(1, 0, s), ph, lerp(110, 0, s), mixRGB(fA, PS.red, s), mixRGB(fB, [255, 150, 20], s), PS.yel, PS.ink, clamp(seg(t, 6.0, 6.25) * 1.2));
      }
      {
        const s = settle(6.6, 8.0);
        meltDraw(c, st.arch, lerp(90, 6, s), lerp(1, 0, s), ph + 1, lerp(60, 0, s), PS.yel, [255, 196, 40], PS.pink, PS.ink, seg(t, 6.6, 6.85));
      }
      {
        const s = settle(7.0, 8.1);
        meltDraw(c, st.wave, lerp(70, 5, s), lerp(1, 0, s), ph + 2, lerp(40, 0, s), PS.yel, [255, 196, 40], PS.pink, PS.ink, seg(t, 7.0, 7.25));
      }
      POSTER_FLOWERS.forEach(([x, y, R, n, t0], j) => flower(c, x, y, R, n, FCOLS[(j + 1) % FCOLS.length], seg(t, t0, t0 + 0.4), (t - t0) * (t < 8.4 ? 0.5 : 0.12) * (j % 2 ? 1 : -1) + j));
    }
    // projector flash on the downbeats + poster hit
    const fl = 0.5 * decay(t, 0.16, 18) + 0.35 * decay(t, 3.0, 8) + 0.3 * decay(t, 6.0, 9) + 0.2 * decay(t, 8.0, 6);
    if (fl > 0.01) { c.globalCompositeOperation = 'screen'; c.fillStyle = `rgba(255,240,210,${fl})`; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over'; }
    vignette(c, W, H, 0.45, '20,0,30');
    grain(c, W, H, t, 0.08);
  }

  function psyScore(A) {
    decorrelate(A);
    A.bus.gain.value = 0.8; A.send.gain.value = 0.8;   // headroom: keep peaks under -1 dBFS
    const organ = (t, notes, dur, g = 0.022, o = {}) => notes.forEach((m, i) => {
      const f = midi(m), pan = ((i / Math.max(1, notes.length - 1)) - 0.5) * 0.8;
      A.osc(t, { type: 'square', f, dur, g, a: o.a ?? 0.03, lp: o.lp ?? 2200, vib: [6.2, 3.5], hold: true, rel: o.rel ?? 0.15, rev: 0.35, pan });
      A.osc(t, { type: 'sine', f: f * 2, dur, g: g * 0.8, a: o.a ?? 0.03, vib: [6.2, 6], hold: true, rel: o.rel ?? 0.15, pan: -pan });
      A.osc(t, { type: 'sine', f: f * 0.5, dur, g: g * 0.7, a: o.a ?? 0.03, hold: true, rel: o.rel ?? 0.15 });
    });
    const fuzz = (t, m, dur, o = {}) => {
      A.osc(t, { type: 'sawtooth', f: midi(m), f2: o.bend ? midi(m + o.bend) : undefined, glide: o.glide ?? dur, dur, g: o.g ?? 0.035, a: 0.006, crush: true, lp: 2600, q: 1.5, vib: o.vib ? [5.5, o.vib] : null, rev: 0.25, hold: true, rel: 0.06, pan: -0.25 });
      A.osc(t, { type: 'square', f: midi(m - 12), f2: o.bend ? midi(m - 12 + o.bend) : undefined, glide: o.glide ?? dur, dur, g: (o.g ?? 0.035) * 0.6, a: 0.006, crush: true, lp: 1500, hold: true, rel: 0.06, pan: 0.25 });
    };
    const sitar = (t, m, o = {}) => { A.pluck(t, midi(m), { dur: o.dur ?? 1.2, g: o.g ?? 0.28, bright: 0.95, decay: 0.997, bend: o.bend, bendAt: o.bendAt ?? 0.12, bendT: o.bendT ?? 0.2, rev: 0.4, pan: o.pan ?? 0.2 }); A.osc(t, { type: 'sawtooth', f: midi(m) * 2, dur: 0.3, g: 0.006, lp: 5000 }); };
    // lamp on + hum
    A.noise(0.15, { type: 'bandpass', f: 1800, q: 2, dur: 0.03, g: 0.18 });
    A.osc(0.15, { f: 60, dur: 2.8, g: 0.03, a: 0.2, hold: true, rel: 0.6 });
    // drone + organ swell
    A.osc(0.2, { type: 'sawtooth', f: midi(28), dur: 3.0, g: 0.03, a: 1.0, lp: 500, hold: true, rel: 0.3, vib: [0.3, 1] });
    A.osc(0.2, { type: 'sawtooth', f: midi(35), dur: 3.0, g: 0.022, a: 1.2, lp: 700, hold: true, rel: 0.3 });
    organ(0.3, [52, 59, 62, 66, 71], 2.75, 0.014, { a: 1.2, lp: 1600, rel: 0.25 });
    // dye drops
    DROPS.forEach(([, t0], j) => { A.osc(t0, { f: 1200 - j * 60, f2: 300, glide: 0.12, dur: 0.18, g: 0.07, rev: 0.6, pan: (hash(j) - 0.5) }); A.osc(t0 + 0.05, { f: 600, f2: 900, glide: 0.08, dur: 0.1, g: 0.03, rev: 0.6 }); });
    // sitar phrases
    [[0.9, 64, 2 ** (2 / 12)], [1.35, 67], [1.6, 69, 2 ** (-2 / 12)], [2.0, 71, 2 ** (1 / 12)], [2.35, 69], [2.55, 67], [2.7, 64, 2 ** (2 / 12)]].forEach(([t, m, b], i) => sitar(t, m, { bend: b, pan: i % 2 ? 0.3 : -0.1 }));
    // kaleidoscope fold: phaser sweep + reverse cymbal
    A.noise(2.0, { type: 'bandpass', f: 300, f2: 5000, q: 5, dur: 1.0, g: 0.05, swell: 0.8, rev: 0.4 });
    A.noise(2.0, { type: 'highpass', f: 5000, dur: 1.0, g: 0.08, swell: 0.97 });
    // the band enters at 3.0
    const riff = [40, 40, 43, 45, 47, 45, 43, 38];
    for (let k = 0; k < 20; k++) {
      const t = 3.0 + k * 0.25;
      if (t > 7.99) break;
      const beatPos = k % 8;
      if (beatPos === 0 || beatPos === 3 || beatPos === 4) A.kick(t, 0.55);
      if (beatPos === 2 || beatPos === 6) A.snare(t, 0.22, { rev: 0.35 });
      A.noise(t, { type: 'bandpass', f: 7000, q: 1.5, dur: 0.07, g: k % 2 ? 0.03 : 0.05, pan: 0.4 });
      A.pluck(t, midi(riff[k % 8] - 12), { dur: 0.3, g: 0.4, bright: 0.4, lp: 900 });
    }
    for (let k = 0; k < 8; k++) {
      const t = 6.0 + k * 0.25;
      const beatPos = k % 8;
      if (beatPos === 0 || beatPos === 3 || beatPos === 4) A.kick(t, 0.55);
      if (beatPos === 2 || beatPos === 6) A.snare(t, 0.22, { rev: 0.35 });
      A.noise(t, { type: 'bandpass', f: 7000, q: 1.5, dur: 0.07, g: k % 2 ? 0.03 : 0.05, pan: 0.4 });
      A.pluck(t, midi(riff[k % 8] - 12), { dur: 0.3, g: 0.4, bright: 0.4, lp: 900 });
    }
    A.noise(3.0, { type: 'highpass', f: 4500, dur: 1.4, g: 0.1, rev: 0.4 }); A.kick(3.0, 0.7);
    // fuzz riff
    [[3.0, 52, 0.22], [3.25, 52, 0.22], [3.5, 55, 0.22], [3.75, 57, 0.4, 2], [4.25, 59, 0.22], [4.5, 57, 0.22], [4.75, 55, 0.22], [5.0, 52, 0.45, -1],
      [5.5, 64, 0.22], [5.75, 62, 0.22]].forEach(([t, m, d, b]) => fuzz(t, m, d, { bend: b, glide: 0.18 }));
    organ(3.0, [52, 56, 59, 62], 0.2, 0.012); organ(3.5, [52, 56, 59, 62], 0.2, 0.012); organ(4.0, [55, 59, 62, 66], 0.2, 0.012); organ(4.5, [57, 61, 64, 67], 0.2, 0.012);
    organ(5.0, [52, 56, 59, 62], 0.2, 0.012); organ(5.5, [50, 54, 57, 62], 0.2, 0.012);
    // flower pops
    PSY_FLOWERS.forEach(([, , R, , t0], j) => A.osc(t0, { type: 'sine', f: midi(72 + (j * 5) % 12), f2: midi(84 + (j * 5) % 12), glide: 0.06, dur: 0.16, g: j === 8 ? 0.08 : 0.045, rev: 0.4, pan: (hash(j * 3) - 0.5) * 0.9 }));
    A.bell(5.0, midi(76), { g: 0.06, dur: 1.4 });
    // tunnel: reverse cymbal + riser
    A.noise(5.2, { type: 'highpass', f: 4000, dur: 0.85, g: 0.11, swell: 0.97 });
    A.riser(5.0, 1.0, { g: 0.1, f: 82 });
    // POSTER: hit, organ chord, melting fuzz glissando
    A.kick(6.0, 0.5); A.impact(6.0, 0.16);
    A.noise(6.0, { type: 'highpass', f: 4000, dur: 1.8, g: 0.12, rev: 0.5 });
    organ(6.0, [40, 52, 56, 59, 62, 66], 1.9, 0.016, { lp: 2800 });
    fuzz(6.05, 76, 0.9, { bend: -12, glide: 0.9, vib: 8, g: 0.03 });
    fuzz(7.0, 71, 0.8, { bend: -5, glide: 0.7, vib: 10, g: 0.028 });
    [6.6, 7.0, 7.75].forEach((t, i) => A.bell(t, midi([83, 86, 88][i]), { g: 0.035, dur: 0.9, pan: i % 2 ? 0.4 : -0.4 }));
    // final: E9 swell with a Leslie wobble, gong, last fuzz bend
    A.kick(8.0, 0.7);
    organ(8.0, [40, 52, 56, 59, 62, 66], 1.95, 0.02, { lp: 3000, rel: 1.0 });
    fuzz(8.0, 64, 1.4, { bend: 2, glide: 0.25, vib: 12, g: 0.03 });
    A.bell(8.0, 82, { g: 0.12, dur: 2.0, ratios: [1, 1.52, 2.47, 3.1, 4.2], rev: 0.6 });
    A.noise(8.0, { type: 'highpass', f: 5000, dur: 1.9, g: 0.08, rev: 0.6 });
    for (const [t0, m] of [[8.15, 83], [8.3, 86], [8.45, 88], [8.6, 91]]) A.bell(t0, midi(m), { g: 0.025, dur: 0.8, pan: hash(m) - 0.5 });
  }

  MG.film({
    id: 'psychedelic', dur: 10, poster: 9.4,
    fonts: [['400 300px "Titan One"', 'PSYCHEDELIC'], ['400 160px Righteous', 'DANCE · CONCERT LIGHT SHOW SAN FRANCISCO 1967']],
    meta: {
      family: 'A', name: 'Psychedelic 60s', sub: 'Liquid Light and Melting Letters', era: '1966 —',
      origin: 'In San Francisco\'s 1966–68 dance-hall scene, Wes Wilson, Victor Moscoso and others made concert posters whose letters swelled to fill shapes and whose complementary colours vibrated; liquid light shows of dyed oil on overhead projectors played behind the bands, and Peter Max and "Yellow Submarine" took the look to pop.',
      works: 'Fillmore Auditorium posters (Wes Wilson, 1966–67) · "Neon Rose" series (Victor Moscoso, 1967) · "Yellow Submarine" (Heinz Edelmann, 1968) · Peter Max posters (late 1960s) · Joshua Light Show at the Fillmore East (1968 —)',
      tech: ['Subtractive dye metaballs on a projector hotspot', 'Kaleidoscope fold and log-spiral op-art', 'Per-pixel shape-filling text warp', 'Blur-threshold "goo" lettering'],
      accent: '#ff2646',
      motionDNA: 'Nothing is rigid: colour pools, folds, spirals and cycles on the beat, flowers spring open, and letters flow like hot wax until they settle into a swollen, legible shape.',
      visualDNA: 'Same-value complementary colours that vibrate, liquid dye blobs, op-art spirals, outlined flowers and hand-lettering stretched to fill a balloon.',
      transitions: 'Kaleidoscope fold, spiral iris, liquid-edged radial wipes, zoom-through tunnel, melt-in with drips.',
      implementation: ['Canvas 2D', 'Liquid light show', 'GLSL'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw: psyDraw,
    score: psyScore,
  });
})();
