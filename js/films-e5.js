/* batch e5 — Family C: 2D Animation & Illustration. Comic Book Motion · Chalkboard Animation · Watercolour. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, offscreen, roughPoly, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:ital,wght@0,700;1,700&family=Caveat+Brush&family=Ma+Shan+Zheng&display=block');
  const PI = Math.PI;

  /* =====================================================================
     COMIC BOOK MOTION — a printed page: the camera dives panel to panel,
     colour plates slip out of register under the key line, a hero breaks
     the border and the page detonates into KRAKOOM, then a cover slams in
     ===================================================================== */
  const CB = {
    paper: '#f3e7c9', ink: '#17131a', red: '#d8262f', redD: '#8f1520', blue: '#1f52ad', blueD: '#122f6e', yel: '#f8cb2a', yelD: '#e08a1c',
    skin: '#f6cba4', steel: '#5d8ea3', steelD: '#2c4c60', cap: '#fbe47e', desk: '#15121d',
  };
  const CBP = [{ x: 50, y: 50, w: 1300, h: 700 }, { x: 1374, y: 50, w: 976, h: 330 }, { x: 1374, y: 404, w: 976, h: 896 }, { x: 50, y: 774, w: 1300, h: 526 }];
  const CBF = '"Comic Neue", "Comic Sans MS", sans-serif', CBB = 'Bangers, Impact, sans-serif';
  const CB_T = { p1: 0.6, p2: 2.4, p3: 3.6, p4: 4.8, brk: 5.7, boom: 6.0, turn: 7.5, cover: 7.8 };

  // Rotated Ben-Day grid; rf(x,y) gives the dot radius at each grid point.
  function dots(g, x0, y0, w, h, sp, ang, color, rf) {
    const ca = Math.cos(ang), sa = Math.sin(ang), cx = x0 + w / 2, cy = y0 + h / 2, R = Math.hypot(w, h) / 2 + sp, mx = sp * 0.74;
    g.fillStyle = color; g.beginPath();
    for (let v = -R; v <= R; v += sp) for (let u = -R; u <= R; u += sp) {
      const x = cx + u * ca - v * sa, y = cy + u * sa + v * ca;
      if (x < x0 - sp || x > x0 + w + sp || y < y0 - sp || y > y0 + h + sp) continue;
      const r = Math.min(mx, rf(x, y)); if (r < 0.4) continue;
      g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU);
    }
    g.fill();
  }
  // Tapered limb outline around a polyline, with round caps.
  function tubePath(g, pts, ws) {
    const n = pts.length, L = [], R = [], D = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      D.push([dx, dy]);
      L.push([pts[i][0] - dy * ws[i], pts[i][1] + dx * ws[i]]); R.push([pts[i][0] + dy * ws[i], pts[i][1] - dx * ws[i]]);
    }
    g.beginPath();
    L.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
    const cap = (p, d, w, s) => { for (let k = 1; k < 10; k++) { const f = PI / 2 - (k / 10) * PI; g.lineTo(p[0] + w * (Math.cos(f) * d[0] * s - Math.sin(f) * d[1]), p[1] + w * (Math.cos(f) * d[1] * s + Math.sin(f) * d[0])); } };
    cap(pts[n - 1], D[n - 1], ws[n - 1], 1);
    for (let i = n - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
    // start cap: from R[0] around the back to L[0]
    const d0 = D[0], w0 = ws[0], p0 = pts[0];
    for (let k = 1; k < 10; k++) { const f = -PI / 2 - (k / 10) * PI; g.lineTo(p0[0] + w0 * (Math.cos(f) * d0[0] - Math.sin(f) * d0[1]), p0[1] + w0 * (Math.cos(f) * d0[1] + Math.sin(f) * d0[0])); }
    g.closePath();
  }
  const polyPath = (g, pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
  // Smooth closed path through points (midpoint quadratic).
  function blobPath(g, pts) {
    const n = pts.length; g.beginPath();
    const m = i => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
    const s = m(n - 1); g.moveTo(s[0], s[1]);
    for (let i = 0; i < n; i++) { const e = m(i); g.quadraticCurveTo(pts[i][0], pts[i][1], e[0], e[1]); }
    g.closePath();
  }
  // One element printed in two plates: colour (fill + Ben-Day shading) and key (black line), plus a paper knock-out pass.
  function part(g, pass, path, fill, lw = 6, shade, spot) {
    if (pass === 'c') { path(); g.fillStyle = fill; g.fill(); if (shade) { g.save(); path(); g.clip(); shade(g); g.restore(); } }
    else if (pass === 'k') { if (g._occ) { g.save(); g.globalCompositeOperation = 'destination-out'; path(); g.fill(); g.lineWidth = lw * 0.5; g.stroke(); g.restore(); } if (spot) { g.save(); path(); g.clip(); spot(g); g.restore(); } path(); g.lineWidth = lw; g.strokeStyle = CB.ink; g.lineJoin = 'round'; g.stroke(); }
    else if (pass === 'n') { path(); g.fillStyle = CB.paper; g.fill(); g.lineWidth = lw; g.strokeStyle = CB.paper; g.stroke(); }
  }

  /* ---- the hero, KESTREL: red cowl with swept fins, yellow gloves and boots, blue cape ---- */
  function heroLeap(g, pass, tq, o = {}) {
    const ph = tq * 9 + (o.ph || 0), wv = i => Math.sin(ph - i * 0.95) * 12 * (o.wind ?? 1);
    const lw = o.lw || 6;
    const redShade = g2 => dots(g2, -380, -140, 580, 240, 8, 0.6, CB.redD, (x, y) => 4.6 * clamp((y + 4) / 30));
    const yelShade = g2 => dots(g2, -380, -140, 580, 240, 7, 0.6, CB.yelD, (x, y) => 3.8 * clamp((y + 6) / 24));
    // cape: a full banner streaming back from the shoulders
    const capeP = [[2, -46], [-90, -74 + wv(1)], [-190, -84 + wv(2)], [-290, -70 + wv(3)], [-370, -40 + wv(4)], [-350, 10 + wv(5)], [-268, 2 + wv(5)], [-176, -12 + wv(4)], [-100, -22], [-30, -18]];
    part(g, pass, () => blobPath(g, capeP), CB.blue, lw, g2 => dots(g2, -390, -120, 400, 160, 8, 0.6, CB.blueD, (x, y) => 4.6 * clamp((y + 34) / 46)), g2 => {
      g2.fillStyle = CB.ink;
      blobPath(g2, [[-170, -6 + wv(4)], [-270, 8 + wv(5)], [-352, 18 + wv(5)], [-360, 50], [-170, 30]]); g2.fill();
      g2.lineWidth = 3.5; g2.strokeStyle = CB.ink; g2.lineCap = 'round';
      [[-50, -48, -200, -40 + wv(2)], [-80, -26, -280, -16 + wv(4)], [-130, -60, -320, -50 + wv(3)]].forEach(([a, b, c2, d]) => { g2.beginPath(); g2.moveTo(a, b); g2.quadraticCurveTo((a + c2) / 2, (b + d) / 2 - 10, c2, d); g2.stroke(); });
    });
    // far leg (bent at the knee), far arm — behind the torso
    part(g, pass, () => tubePath(g, [[-106, -12], [-196, -22], [-272, -30]], [21, 15, 11]), CB.red, lw, redShade);
    part(g, pass, () => tubePath(g, [[-244, -28], [-280, -30], [-314, -26]], [14, 12, 11]), CB.yel, lw, yelShade);
    part(g, pass, () => tubePath(g, [[-24, -22], [-72, 2], [-104, 20]], [16, 13, 11]), CB.red, lw, redShade);
    part(g, pass, () => { g.beginPath(); g.ellipse(-116, 24, 16, 14, 0.3, 0, TAU); }, CB.yel, lw);
    // torso: barrel chest tapering to the hips
    const torP = [[18, -40], [-30, -46], [-80, -38], [-118, -26], [-126, 4], [-118, 26], [-80, 36], [-30, 52], [10, 44], [30, 16], [30, -16]];
    part(g, pass, () => blobPath(g, torP), CB.red, lw, g2 => {
      dots(g2, -140, -60, 180, 120, 8, 0.6, CB.redD, (x, y) => 4.8 * clamp((y + 4) / 34));
      g2.fillStyle = CB.yel; polyPath(g2, [[-92, -44], [-82, 40], [-104, 36], [-114, -36]]); g2.fill();
      g2.fillStyle = CB.yel; polyPath(g2, [[-46, -6], [-18, 8], [8, -12], [2, 16], [-18, 30], [-38, 16]]); g2.fill();
    }, g2 => {
      g2.fillStyle = CB.ink; blobPath(g2, [[-120, 22], [-60, 40], [10, 40], [0, 60], [-110, 50]]); g2.fill();
      g2.lineWidth = 3; g2.strokeStyle = CB.ink;
      polyPath(g2, [[-92, -44], [-82, 40], [-104, 36], [-114, -36]]); g2.stroke();
      polyPath(g2, [[-46, -6], [-18, 8], [8, -12], [2, 16], [-18, 30], [-38, 16]]); g2.stroke();
      g2.beginPath(); g2.moveTo(-14, -40); g2.quadraticCurveTo(-30, -16, -64, -12); g2.stroke();
    });
    // near leg
    part(g, pass, () => tubePath(g, [[-110, 4], [-200, 12], [-282, 6]], [25, 17, 12]), CB.red, lw, redShade, g2 => { g2.fillStyle = CB.ink; polyPath(g2, [[-120, 20], [-200, 26], [-280, 18], [-200, 34]]); g2.fill(); });
    part(g, pass, () => tubePath(g, [[-250, 8], [-286, 6], [-322, 10]], [15, 13, 12]), CB.yel, lw, yelShade);
    // head (cowl, fins, skin, lens), raised and looking ahead
    g.save(); g.translate(-6, -22);
    part(g, pass, () => polyPath(g, [[20, -36], [-28, -50], [14, -26]]), CB.red, lw - 1);
    part(g, pass, () => polyPath(g, [[26, -46], [-24, -74], [18, -34]]), CB.red, lw - 1);
    const head = () => { g.beginPath(); g.moveTo(10, 4); g.bezierCurveTo(0, -30, 20, -56, 46, -54); g.bezierCurveTo(66, -52, 74, -38, 72, -24); g.lineTo(80, -12); g.lineTo(71, -7); g.bezierCurveTo(69, 4, 56, 8, 44, 6); g.lineTo(24, 14); g.closePath(); };
    part(g, pass, head, CB.red, lw, g2 => {
      g2.fillStyle = CB.skin; polyPath(g2, [[44, -18], [84, -24], [84, 14], [40, 14]]); g2.fill();
      dots(g2, 40, -24, 48, 40, 5, 0.6, '#e2716a', () => 1.4);
      dots(g2, 0, -60, 50, 76, 7, 0.6, CB.redD, (x, y) => 3.4 * clamp((36 - x) / 26));
    }, g2 => {
      g2.lineWidth = 3; g2.strokeStyle = CB.ink;
      g2.beginPath(); g2.moveTo(44, -18); g2.quadraticCurveTo(60, -16, 78, -22); g2.stroke();
      g2.beginPath(); g2.moveTo(60, 0); g2.lineTo(68, -1); g2.stroke();
    });
    if (pass === 'k') { g.fillStyle = '#fffdf6'; polyPath(g, [[50, -36], [70, -40], [72, -29], [52, -27]]); g.fill(); g.lineWidth = 3.2; g.strokeStyle = CB.ink; g.stroke(); }
    g.restore();
    // near arm, punching forward: heavy deltoid, gauntlet, fist
    part(g, pass, () => tubePath(g, [[-4, -14], [64, -32], [122, -46]], [21, 16, 12]), CB.red, lw, g2 => dots(g2, -30, -80, 180, 90, 8, 0.6, CB.redD, (x, y) => 4.2 * clamp((y + 26) / 22)));
    part(g, pass, () => tubePath(g, [[96, -40], [124, -47], [136, -50]], [17, 14, 14]), CB.yel, lw, yelShade);
    const fist = () => { g.beginPath(); g.ellipse(154, -54, 27, 23, -0.25, 0, TAU); };
    part(g, pass, fist, CB.yel, lw, g2 => dots(g2, 124, -82, 62, 58, 7, 0.6, CB.yelD, (x, y) => 4 * clamp((y + 52) / 20)), g2 => {
      g2.lineWidth = 2.8; g2.strokeStyle = CB.ink;
      [[150, -76, 154, -54], [164, -74, 168, -54], [176, -66, 178, -50]].forEach(([a, b, c2, d]) => { g2.beginPath(); g2.moveTo(a, b); g2.quadraticCurveTo(c2 - 5, (b + d) / 2, c2, d); g2.stroke(); });
    });
  }
  // Crouched silhouette for the establishing shot (key plate only, against the moon).
  function heroCrouch(g, tq) {
    const ph = tq * 8, w = i => Math.sin(ph - i * 1.1) * 11;
    g.fillStyle = CB.ink;
    blobPath(g, [[-4, -170], [-90, -188 + w(1)], [-180, -186 + w(2)], [-262, -166 + w(3)], [-330, -134 + w(4)], [-290, -124 + w(4)], [-318, -96 + w(5)], [-262, -100 + w(5)], [-262, -78 + w(5)], [-190, -100 + w(4)], [-100, -92], [-50, -84]]); g.fill();
    tubePath(g, [[-30, -82], [34, -102], [36, -6]], [21, 15, 10]); g.fill();
    tubePath(g, [[30, -8], [60, -2]], [11, 8]); g.fill();
    tubePath(g, [[-36, -80], [-8, -36], [-62, -6]], [19, 14, 9]); g.fill();
    blobPath(g, [[22, -164], [-28, -176], [-62, -124], [-58, -82], [-20, -66], [16, -112]]); g.fill();
    tubePath(g, [[8, -152], [44, -112], [74, -104]], [15, 11, 9]); g.fill();
    g.beginPath(); g.ellipse(78, -104, 11, 10, 0, 0, TAU); g.fill();
    tubePath(g, [[-8, -148], [6, -84], [14, -8]], [14, 11, 9]); g.fill();
    g.beginPath(); g.ellipse(26, -184, 19, 20, 0, 0, TAU); g.fill();
    polyPath(g, [[18, -198], [-32, -226], [8, -186]]); g.fill();
    polyPath(g, [[12, -190], [-38, -204], [8, -178]]); g.fill();
    g.fillStyle = '#fffdf6'; polyPath(g, [[30, -190], [45, -193], [46, -185], [32, -183]]); g.fill();
  }

  /* ---- the villain: THE LEVIATHAN, a harbour mech ---- */
  function mech(g, pass, tq, eye) {
    const lw = 7;
    const sh = (x0, y0, w, h, f) => g2 => dots(g2, x0, y0, w, h, 11, 0.6, '#1d3a4c', f);
    const shL = () => polyPath(g, [[-460, 120], [-300, 40], [-120, 60], [-110, 330], [-470, 330]]);
    const shR = () => polyPath(g, [[460, 120], [300, 40], [120, 60], [110, 330], [470, 330]]);
    [shL, shR].forEach((p, i) => part(g, pass, p, CB.steel, lw, sh(-480, 30, 960, 310, (x, y) => (i ? 5.5 : 2) * clamp((y - 80) / 160)), g2 => {
      g2.fillStyle = CB.ink; const s = i ? 1 : -1;
      polyPath(g2, [[s * 300, 40], [s * 460, 120], [s * 470, 150], [s * 310, 76]]); g2.fill();
      if (i) { polyPath(g2, [[200, 120], [470, 200], [470, 330], [240, 330]]); g2.fill(); }
      g2.lineWidth = 3; g2.strokeStyle = CB.ink;
      for (let k = 0; k < 3; k++) { g2.beginPath(); g2.moveTo(s * (140 + k * 90), 90 + k * 22); g2.lineTo(s * (140 + k * 90), 330); g2.stroke(); }
      g2.fillStyle = CB.ink; for (let k = 0; k < 6; k++) { g2.beginPath(); g2.arc(s * (160 + k * 50), 104 + k * 10, 5, 0, TAU); g2.fill(); }
    }));
    const neck = () => polyPath(g, [[-120, 0], [120, 0], [130, 120], [-130, 120]]);
    part(g, pass, neck, CB.steelD, lw, null, g2 => { g2.fillStyle = CB.ink; g2.fillRect(-130, 50, 260, 70); g2.fillStyle = CB.steelD; for (let k = -4; k <= 4; k++) g2.fillRect(k * 26 - 6, 60, 12, 50); });
    const head = () => polyPath(g, [[-150, -96], [-124, -250], [-40, -300], [40, -300], [124, -250], [150, -96], [110, 30], [-110, 30]]);
    part(g, pass, head, CB.steel, lw, sh(-160, -310, 320, 350, (x, y) => 1.4 + 5 * clamp((x + 20) / 140) + 2 * clamp((y + 20) / 60)), g2 => {
      g2.fillStyle = CB.ink;
      polyPath(g2, [[40, -300], [124, -250], [150, -96], [110, 30], [70, 30], [100, -110], [80, -250]]); g2.fill();
      // visor band
      polyPath(g2, [[-140, -196], [140, -196], [134, -128], [-134, -128]]); g2.fill();
      // jaw grille
      for (let k = -4; k <= 4; k++) g2.fillRect(k * 20 - 5, -60, 10, 70);
      g2.lineWidth = 3; g2.strokeStyle = CB.ink;
      g2.beginPath(); g2.moveTo(0, -300); g2.lineTo(0, -200); g2.stroke();
      g2.beginPath(); g2.moveTo(-130, -96); g2.lineTo(130, -96); g2.stroke();
    });
    // crest fin
    const crest = () => polyPath(g, [[-24, -296], [0, -380], [24, -296]]);
    part(g, pass, crest, CB.red, lw - 2, null, g2 => { g2.fillStyle = CB.ink; polyPath(g2, [[0, -380], [24, -296], [6, -296]]); g2.fill(); });
    // the eye — a hot cyclops lamp
    if (pass === 'c') {
      g.fillStyle = '#ff3a1c'; g.beginPath(); g.arc(0, -162, 48, 0, TAU); g.fill();
    }
    if (pass === 'k') {
      const pulse = 0.5 + 0.5 * Math.sin(tq * 9);
      g.fillStyle = '#ffd34a'; g.beginPath(); g.arc(0, -162, 30 + 6 * pulse * eye, 0, TAU); g.fill();
      g.fillStyle = '#fffbe6'; g.beginPath(); g.arc(0, -162, 15, 0, TAU); g.fill();
      g.lineWidth = 5; g.strokeStyle = CB.ink; g.beginPath(); g.arc(0, -162, 48, 0, TAU); g.stroke();
      if (eye > 0) {
        g.strokeStyle = '#fff3c4'; g.lineCap = 'round';
        for (let k = 0; k < 16; k++) {
          const a = k / 16 * TAU + 0.1, r0 = 58, r1 = 58 + (22 + 38 * hash(k + Math.floor(tq * 12))) * eye;
          g.lineWidth = 4 + 3 * hash(k * 3); g.beginPath(); g.moveTo(Math.cos(a) * r0, -162 + Math.sin(a) * r0); g.lineTo(Math.cos(a) * r1, -162 + Math.sin(a) * r1); g.stroke();
        }
      }
    }
  }

  /* ---- speech balloons & captions ---- */
  function balloon(g, x, y, w, h, tail, lines, n, o = {}) {
    const s = o.pop ?? 1;
    tail = [tail[0], tail[1] - x, tail[2] - y];
    g.save(); g.translate(x + w / 2, y + h / 2); g.scale(s, s); g.translate(-w / 2, -h / 2);
    const shape = () => {
      if (o.jag) {
        const pts = [], N = 34, r = rng(o.seed || 5);
        for (let k = 0; k < N; k++) { const a = k / N * TAU, rr = k % 2 ? 1 : 0.84 + r() * 0.06; pts.push([w / 2 + Math.cos(a) * w * 0.56 * rr, h / 2 + Math.sin(a) * h * 0.62 * rr]); }
        polyPath(g, pts);
      } else { g.beginPath(); g.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, TAU); }
    };
    const tp = () => { g.beginPath(); g.moveTo(w * tail[0] - 26, h * 0.8); g.quadraticCurveTo(w * tail[0], h * 0.9, tail[1], tail[2]); g.quadraticCurveTo(w * tail[0] + 10, h * 0.95, w * tail[0] + 30, h * 0.78); g.closePath(); };
    g.lineJoin = 'round';
    g.lineWidth = 11; g.strokeStyle = CB.ink; tp(); g.stroke(); shape(); g.stroke();
    g.fillStyle = o.fill || '#fffdf6'; tp(); g.fill(); shape(); g.fill();
    let left = n;
    lines.forEach((ln, i) => {
      const s2 = ln.slice(0, Math.max(0, left)); left -= ln.length;
      if (s2) text(g, s2, w / 2, h / 2 + (i - (lines.length - 1) / 2) * o.lh, { font: CBF, weight: 700, style: o.it ? 'italic' : '', size: o.size, align: 'center', base: 'middle', color: CB.ink, ls: 1 });
    });
    g.restore();
  }
  function caption(g, x, y, w, h, lines, n, size) {
    g.save();
    g.fillStyle = CB.cap; g.fillRect(x, y, w, h);
    g.lineWidth = 5; g.strokeStyle = CB.ink; g.strokeRect(x, y, w, h);
    let left = n;
    lines.forEach((ln, i) => {
      const s2 = ln.slice(0, Math.max(0, left)); left -= ln.length;
      if (s2) text(g, s2, x + 22, y + 22 + size * 0.85 + i * size * 1.18, { font: CBF, weight: 700, size, color: CB.ink, ls: 1 });
    });
    g.restore();
  }
  // Key plate of an overlapping figure on its own layer, each part erasing the lines it covers.
  function keyLayer(c, st, fn, clip) {
    const kg = st.keyc.getContext('2d');
    kg.setTransform(1, 0, 0, 1, 0, 0); kg.globalCompositeOperation = 'source-over'; kg.clearRect(0, 0, st.keyc.width, st.keyc.height);
    kg.setTransform(c.getTransform()); kg.save(); if (clip) { clip(kg); kg.clip(); }
    kg._occ = true; fn(kg); kg._occ = false; kg.restore();
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(st.keyc, 0, 0); c.restore();
  }
  const typed = (t, t0, cps) => Math.max(0, Math.floor((Math.floor(t * 12) / 12 - t0) * cps));

  /* ---- panel scenes, in panel-local coordinates ---- */
  function scene1(g, pass, tq, t) {
    const P = CBP[0], W = P.w, H = P.h;
    if (pass === 'c') {
      const sky = g.createLinearGradient(0, 0, 0, 560);
      sky.addColorStop(0, '#16205a'); sky.addColorStop(0.5, '#3c2a86'); sky.addColorStop(1, '#b7397a');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      dots(g, 0, 200, W, 420, 13, 0.4, '#e2488e', (x, y) => 6.2 * Math.pow(clamp((y - 200) / 360), 1.3));
      dots(g, 0, 0, W, 260, 13, 1.2, '#2b3fa0', (x, y) => 4.5 * clamp((240 - y) / 240));
      // searchlights (painted lighter inside the colour plate)
      [[220, 0.62 + 0.18 * Math.sin(tq * 1.3)], [1180, -0.5 + 0.16 * Math.sin(tq * 1.1 + 2)]].forEach(([bx, a]) => {
        g.save(); g.translate(bx, 640); g.rotate(a);
        const gr = g.createLinearGradient(0, 0, 0, -700); gr.addColorStop(0, 'rgba(255,246,190,0.75)'); gr.addColorStop(1, 'rgba(255,246,190,0.05)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(-10, 0); g.lineTo(-90, -760); g.lineTo(90, -760); g.lineTo(10, 0); g.fill(); g.restore();
      });
      // moon
      g.fillStyle = '#fbe9a6'; g.beginPath(); g.arc(900, 270, 168, 0, TAU); g.fill();
      g.save(); g.beginPath(); g.arc(900, 270, 168, 0, TAU); g.clip();
      dots(g, 730, 100, 340, 340, 10, 0.3, '#f0b23c', (x, y) => 4.6 * clamp((Math.hypot(x - 820, y - 200) - 120) / 110));
      g.fillStyle = 'rgba(226,170,70,0.55)'; [[850, 210, 30], [960, 330, 20], [940, 180, 14], [820, 330, 16], [1000, 240, 10]].forEach(([x, y, rr]) => { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); });
      g.restore();
      // far skyline
      const r = rng(31);
      g.fillStyle = '#2d2b70';
      for (let x = -20; x < W; x += 50 + r() * 40) { const h = 140 + r() * 200, w = 50 + r() * 50; g.fillRect(x, 560 - h, w, h + 200); }
      g.fillStyle = '#f6d24c';
      const r2 = rng(32);
      for (let k = 0; k < 160; k++) { const x = r2() * W, y = 400 + r2() * 220; if ((Math.floor(tq * 3) + k) % 23 === 0) continue; g.fillRect(x, y, 5, 7); }
      // mid buildings
      g.fillStyle = '#433f97';
      [[40, 430, 150], [210, 470, 120], [360, 410, 140], [1030, 450, 130], [1170, 400, 160]].forEach(([x, y, w]) => g.fillRect(x, y, w, H - y));
      g.fillStyle = '#f9d65a';
      [[40, 430, 150], [210, 470, 120], [360, 410, 140], [1030, 450, 130], [1170, 400, 160]].forEach(([x, y, w], i) => {
        for (let yy = y + 20; yy < H; yy += 30) for (let xx = x + 14; xx < x + w - 14; xx += 24) if (hash(xx * 0.3 + yy * 1.7 + i) > 0.45) g.fillRect(xx, yy, 10, 14);
      });
    } else {
      // stars
      g.fillStyle = '#fffbe8';
      const r = rng(33);
      for (let k = 0; k < 60; k++) { const x = r() * W, y = r() * 300, s = 1.5 + r() * 2.5; if (Math.hypot(x - 900, y - 270) < 190) continue; if ((k + Math.floor(tq * 6)) % 9 === 0) continue; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill(); }
      g.lineWidth = 4; g.strokeStyle = CB.ink; g.beginPath(); g.arc(900, 270, 168, 0, TAU); g.stroke();
      g.lineWidth = 3;
      [[40, 430, 150], [210, 470, 120], [360, 410, 140], [1030, 450, 130], [1170, 400, 160]].forEach(([x, y, w]) => { g.strokeRect(x, y, w, H - y + 10); g.fillStyle = CB.ink; g.fillRect(x + w - 26, y, 26, H - y); });
      // foreground rooftop: cornice and ledge, a heavy spot black
      g.fillStyle = CB.ink;
      polyPath(g, [[560, 478], [1300, 478], [1300, 700], [560, 700]]); g.fill();
      g.fillRect(540, 462, 780, 20);
      g.strokeStyle = '#3a4fb0'; g.lineWidth = 3;
      for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(590 + k * 82, 500); g.lineTo(590 + k * 82, 700); g.stroke(); }
      g.strokeStyle = '#d74a8a'; g.lineWidth = 4; g.beginPath(); g.moveTo(540, 462); g.lineTo(1320, 462); g.stroke();
      // water tower
      g.fillStyle = CB.ink; g.fillRect(1120, 330, 120, 100); polyPath(g, [[1110, 330], [1180, 290], [1250, 330]]); g.fill();
      g.lineWidth = 6; g.strokeStyle = CB.ink; [[1130, 430, 1110, 470], [1230, 430, 1250, 470], [1180, 430, 1180, 470]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke(); });
      g.save(); g.translate(905, 464); g.scale(1.05, 1.05); heroCrouch(g, tq); g.restore();
    }
  }
  function scene2(g, pass, tq, t) {
    const P = CBP[1], W = P.w, H = P.h;
    const lid = 26 * E.ioS(seg(t, 2.95, 3.15)) - 16 * seg(t, 2.4, 2.5) + 16;
    const eyeL = (s) => { const cx = 488 + s * 210; return [[cx - s * 130, 168], [cx - s * 40, 128 + lid], [cx + s * 96, 132 + lid], [cx + s * 134, 172], [cx + s * 40, 202], [cx - s * 104, 194]]; };
    if (pass === 'c') {
      g.fillStyle = CB.skin; g.fillRect(0, 0, W, H);
      dots(g, 0, 0, W, H, 11, 0.26, '#e4595a', () => 2.6);
      // cowl band
      g.fillStyle = CB.red;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 262); g.quadraticCurveTo(700, 236, 540, 262); g.lineTo(488, 300); g.lineTo(436, 262); g.quadraticCurveTo(276, 236, 0, 262); g.closePath(); g.fill();
      g.save(); g.clip();
      dots(g, 0, 0, W, H, 12, 0.6, CB.redD, (x, y) => 2 + 3.5 * clamp((y - 150) / 110) + 2.5 * Math.abs(x - 488) / 488);
      g.restore();
      [-1, 1].forEach(s => { polyPath(g, eyeL(s)); g.fillStyle = '#fffdf6'; g.fill(); g.save(); g.clip(); dots(g, 0, 100, W, 120, 8, 0.6, '#7fb7e6', (x, y) => 3.5 * clamp((y - 170) / 30)); g.restore(); });
    } else {
      g.fillStyle = CB.ink;
      // brows: angry wedges pressing down toward the centre
      [-1, 1].forEach(s => { const cx = 488 + s * 210; polyPath(g, [[cx - s * 150, 120 + lid * 0.4], [cx - s * 20, 92 + lid * 0.7], [cx + s * 150, 118], [cx + s * 120, 130 + lid * 0.6], [cx - s * 40, 116 + lid * 0.8]]); g.fill(); });
      [-1, 1].forEach(s => { polyPath(g, eyeL(s)); g.lineWidth = 9; g.strokeStyle = CB.ink; g.stroke(); });
      g.lineWidth = 6;
      g.beginPath(); g.moveTo(0, 262); g.quadraticCurveTo(276, 236, 436, 262); g.lineTo(488, 300); g.lineTo(540, 262); g.quadraticCurveTo(700, 236, W, 262); g.stroke();
      g.lineWidth = 4;
      [[470, 150, 476, 220], [506, 150, 500, 220]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(488, (b + d) / 2, c2, d); g.stroke(); });
      [[60, 60, 200, 30], [780, 30, 920, 60], [40, 210, 160, 230], [820, 230, 940, 210]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo((a + c2) / 2, b - 12, c2, d); g.stroke(); });
      // sweat bead
      g.fillStyle = '#fffdf6'; g.beginPath(); g.moveTo(880, 280); g.quadraticCurveTo(900, 312, 880, 320); g.quadraticCurveTo(860, 312, 880, 280); g.fill(); g.lineWidth = 3; g.stroke();
      // focus lines raking in from the edges
      g.lineWidth = 2.5;
      for (let k = 0; k < 14; k++) { const y = 10 + k * 24 + hash(k + Math.floor(tq * 12)) * 10, l = 40 + hash(k * 3 + Math.floor(tq * 12)) * 70; g.beginPath(); g.moveTo(0, y); g.lineTo(l, y + 2); g.stroke(); g.beginPath(); g.moveTo(W, y); g.lineTo(W - l, y + 2); g.stroke(); }
    }
  }
  function scene3(g, pass, tq, t) {
    const P = CBP[2], W = P.w, H = P.h;
    const rise = E.outQ(seg(tq, 3.3, 4.7)), my = lerp(330, 0, rise);
    if (pass === 'c') {
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#9d1830'); sky.addColorStop(0.55, '#e4492a'); sky.addColorStop(1, '#f8a52a');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      dots(g, 0, 0, W, H, 14, 0.4, '#f9d23a', (x, y) => 6 * clamp((y - 200) / 600));
      dots(g, 0, 0, W, H, 14, 1.1, '#6e0f3a', (x, y) => 5 * clamp((300 - y) / 300));
    }
    if (pass === 'k') {
      // lightning
      if (Math.floor(tq * 12) % 7 < 2 && tq > 3.5) {
        const r = rng(Math.floor(tq * 12) + 3); let x = 120 + r() * 200, y = 0;
        g.beginPath(); g.moveTo(x, y); while (y < 380) { x += (r() - 0.5) * 70; y += 30 + r() * 30; g.lineTo(x, y); }
        g.lineWidth = 12; g.strokeStyle = CB.ink; g.stroke(); g.lineWidth = 5; g.strokeStyle = '#fffbe0'; g.stroke();
      }
    }
    g.save(); g.translate(488, 560 + my); mech(g, pass, tq, seg(tq, 3.75, 4.0)); g.restore();
    // harbour water and foam around the mech
    if (pass === 'c') {
      g.fillStyle = '#1f5fb0'; g.fillRect(0, 790, W, 120);
      dots(g, 0, 790, W, 120, 9, 0.6, '#0f2e6a', (x, y) => 4 * clamp((y - 800) / 80));
    } else {
      g.fillStyle = CB.ink;
      const r = rng(41); for (let x = -10; x < W; x += 30 + r() * 50) { const h = 30 + r() * 110; g.fillRect(x, 790 - h, 26 + r() * 40, h); }
      g.lineWidth = 4; g.strokeStyle = CB.ink;
      for (let k = 0; k < 8; k++) { const y = 815 + k * 11; g.beginPath(); for (let x = 0; x <= W; x += 40) { const yy = y + Math.sin(x * 0.03 + tq * 4 + k) * 4; x ? g.lineTo(x, yy) : g.moveTo(x, yy); } g.stroke(); }
      // foam crown where the shoulders break the surface
      const fr = rng(Math.floor(tq * 12) * 7 + 1);
      g.fillStyle = '#fffdf6'; g.lineWidth = 5;
      const crown = [];
      for (let k = 0; k <= 26; k++) { const x = 20 + k * 36, d = Math.abs(x - 488) / 460, h = (20 + fr() * 50 + 90 * (1 - d) * (fr() < 0.5 ? 1 : 0.4)) * (0.35 + rise * 0.8); crown.push([x, 800 - h], [x + 18, 800 - h * (0.3 + fr() * 0.3)]); }
      g.beginPath(); g.moveTo(10, 812); crown.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(970, 812); g.closePath(); g.fill(); g.stroke();
      for (let k = 0; k < 26; k++) { const x = 60 + fr() * 860, y = 780 - fr() * 160 * (0.4 + rise), rr = 3 + fr() * 7; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); g.lineWidth = 3; g.stroke(); }
      // water sheeting off the shoulders
      g.strokeStyle = '#fffdf6'; g.lineWidth = 4; g.lineCap = 'round';
      for (let k = 0; k < 18; k++) { const x = 60 + k * 50 + (k > 8 ? 0 : 0), y0 = 600 + my + 120 + hash(k) * 60, l = 40 + hash(k + Math.floor(tq * 12)) * 80; if (Math.abs(x - 488) < 140) continue; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, Math.min(790, y0 + l)); g.stroke(); }
    }
  }
  function speedLines(g, cx, cy, W, H, tq, n, col) {
    const r = rng(Math.floor(tq * 12) * 13 + 5);
    g.fillStyle = col;
    for (let k = 0; k < n; k++) {
      const a = r() * TAU, w = 0.006 + r() * 0.016, r0 = 150 + r() * 220, R = 1500;
      g.beginPath(); g.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      g.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R); g.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R); g.closePath(); g.fill();
    }
  }
  const heroP4 = tq => { const u = E.ioS(seg(tq, 4.6, 5.7)); return { x: lerp(330, 760, u), y: lerp(360, 260, u), s: lerp(0.78, 1.0, u) }; };
  function scene4(g, pass, tq, t) {
    const P = CBP[3], W = P.w, H = P.h;
    if (pass === 'c') {
      const gr = g.createRadialGradient(900, 250, 50, 900, 250, 900); gr.addColorStop(0, '#fff3a0'); gr.addColorStop(0.4, '#f8c42a'); gr.addColorStop(1, '#ea6a22');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      dots(g, 0, 0, W, H, 12, 0.5, '#d8262f', (x, y) => 5.4 * clamp((Math.hypot(x - 900, y - 250) - 240) / 600));
      // the mech's lamp flaring at the right edge
      g.fillStyle = '#ff3a1c'; g.beginPath(); g.arc(1260, 150, 110, 0, TAU); g.fill();
    } else {
      speedLines(g, 1180, 200, W, H, tq, 70, CB.ink);
      g.fillStyle = '#fffbe6'; g.beginPath(); g.arc(1260, 150, 54, 0, TAU); g.fill();
      g.lineWidth = 7; g.strokeStyle = CB.ink; g.beginPath(); g.arc(1260, 150, 110, 0, TAU); g.stroke();
      // FWOOSH trailing the leap
      const hp = heroP4(tq);
      if (tq > 4.85) {
        g.save(); g.translate(hp.x - 420, hp.y + 170); g.rotate(-0.2);
        const n = Math.min(7, typed(t, 4.85, 30));
        text(g, 'FWOOSH'.slice(0, n), 0, 0, { font: CBB, size: 92, ls: 4, color: '#fffdf6', stroke: CB.ink, lw: 12 });
        g.restore();
      }
    }
    if (tq < CB_T.brk) {
      const hp = heroP4(tq);
      const dh = g2 => { g2.save(); g2.translate(hp.x, hp.y); g2.scale(hp.s, hp.s); g2.rotate(-0.3); heroLeap(g2, pass, tq, { lw: 7 }); g2.restore(); };
      if (pass === 'k' && CB_ST) keyLayer(g, CB_ST, dh, g2 => { g2.beginPath(); g2.rect(0, 0, W, H); }); else dh(g);
    }
  }
  const SCENES = [scene1, scene2, scene3, scene4];
  let CB_ST = null;

  // Camera over the page: [t, cx, cy, scale]; between keys it pulls back and pushes in (a dive).
  const CB_CAM = [
    [0, 1200, 690, 0.74], [0.22, 1200, 680, 0.775],
    [0.6, 700, 400, 1.39], [2.15, 760, 410, 1.47],
    [2.4, 1862, 215, 1.84], [3.35, 1868, 220, 1.94],
    [3.6, 1862, 985, 1.76], [4.55, 1862, 760, 1.8],
    [4.8, 700, 1037, 1.39], [5.7, 760, 1010, 1.5],
    [6.0, 960, 880, 1.9],
  ];
  function cbCam(t) {
    const K = CB_CAM;
    if (t <= K[0][0]) return K[0].slice(1);
    for (let i = 1; i < K.length; i++) {
      const a = K[i - 1], b = K[i];
      if (t <= b[0]) {
        const u = (t - a[0]) / (b[0] - a[0]), dive = (b[0] - a[0]) < 0.4 && i !== 1 && b[0] !== CB_T.boom;
        const e = dive ? E.ioC(u) : E.ioS(u);
        let s = Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), e));
        if (dive) s *= 1 - 0.22 * Math.sin(PI * u);
        return [lerp(a[1], b[1], e), lerp(a[2], b[2], e), s];
      }
    }
    return K[K.length - 1].slice(1);
  }
  // Print the colour pass as three slipped plates (C, M, Y) multiplied onto the paper, before the key line.
  function cbPrint(c, st, base, mis, colourFn) {
    const col = st.col, g = col.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.fillStyle = '#fff'; g.fillRect(0, 0, 1920, 1080);
    colourFn(g);
    const pg = st.plate.getContext('2d');
    ['#00ffff', '#ff00ff', '#ffff00'].forEach((pc, i) => {
      pg.setTransform(1, 0, 0, 1, 0, 0); pg.globalCompositeOperation = 'copy'; pg.drawImage(col, 0, 0);
      pg.globalCompositeOperation = 'lighter'; pg.fillStyle = pc; pg.fillRect(0, 0, 1920, 1080);
      c.save(); c.setTransform(base); c.globalCompositeOperation = 'multiply'; c.drawImage(st.plate, mis[i][0], mis[i][1]); c.restore();
    });
  }
  function megaText(c, s, x, y, size, o = {}) {
    c.save(); c.font = `400 ${size}px ${CBB}`; c.textAlign = o.align || 'left'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round';
    const depth = o.depth ?? 10;
    for (let d = depth; d > 0; d--) { c.fillStyle = o.ext || CB.red; c.fillText(s, x + d * (o.dx ?? 1), y + d * (o.dy ?? 1)); }
    c.lineWidth = o.lw || 14; c.strokeStyle = CB.ink; c.strokeText(s, x + depth * (o.dx ?? 1), y + depth * (o.dy ?? 1));
    c.strokeText(s, x, y);
    c.fillStyle = o.fill || CB.yel; c.fillText(s, x, y);
    if (o.inner) { c.lineWidth = 3; c.strokeStyle = o.inner; c.strokeText(s, x, y); }
    c.restore();
  }
  function burstPath(g, cx, cy, r0, r1, n, seed) {
    const r = rng(seed), pts = [];
    for (let k = 0; k < n * 2; k++) { const a = k / (n * 2) * TAU, rr = k % 2 ? r0 * (0.85 + r() * 0.3) : r1 * (0.8 + r() * 0.4); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    polyPath(g, pts);
  }

  MG.film({
    id: 'comic', dur: 10, poster: 9.4,
    fonts: [['400 80px Bangers', 'KRAKOOM!'], ['700 40px "Comic Neue"', 'MEANWHILE'], ['italic 700 40px "Comic Neue"', 'COMING']],
    meta: {
      family: 'C', name: 'Comic Book Motion', sub: 'Panels in Motion', era: '1930s —',
      origin: 'Motion comics animate the printed page itself: panels, gutters, captions and balloons stay on screen while the camera travels between them. The look descends from four-colour newsprint — Ben-Day dots, slipping colour plates, onomatopoeia — and was rebuilt for cinema by Sony Pictures Animation in Spider-Man: Into the Spider-Verse (2018).',
      works: 'Batman (ABC TV series, 1966) · Whaam! (Roy Lichtenstein, 1963) · Watchmen Motion Comic (Warner Premiere, 2008) · Spider-Man: Into the Spider-Verse (Sony Pictures Animation, 2018) · Spider-Man: Across the Spider-Verse (2023)',
      tech: ['Ben-Day halftone', 'CMYK misregistration', 'Animation on twos', 'Panel-to-panel camera'],
      accent: '#d8262f',
      motionDNA: 'Characters move on twos while the camera glides on ones, diving panel to panel with a pull-back-push-in, then a figure smashes through the panel border into a full-frame sound effect.',
      visualDNA: 'Four-colour newsprint: heavy black key line, flat CMY fills shaded with Ben-Day dots, plates slipping a few pixels out of register, yellow caption boxes and typed speech balloons.',
      transitions: 'Gutter dive, panel-border break, impact flash, page turn to cover',
      implementation: ['After Effects', 'Clip Studio Paint', 'Canvas 2D'],
      reproducibility: 'Procedural + hand-drawn',
      loopable: false,
    },
    setup() {
      const PW = 2400, PH = 1350, r = rng(1966);
      const paper = offscreen(PW, PH), g = paper.getContext('2d');
      g.fillStyle = CB.paper; g.fillRect(0, 0, PW, PH);
      for (let k = 0; k < 9000; k++) { const x = r() * PW, y = r() * PH; g.fillStyle = r() < 0.5 ? 'rgba(120,90,40,0.08)' : 'rgba(255,255,240,0.25)'; g.fillRect(x, y, 1 + r() * 3, 1 + r() * 2); }
      for (let k = 0; k < 900; k++) { const x = r() * PW, y = r() * PH, a = r() * TAU, l = 8 + r() * 30; g.strokeStyle = 'rgba(110,80,40,0.07)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
      const yg = g.createRadialGradient(PW / 2, PH / 2, PH * 0.4, PW / 2, PH / 2, PW * 0.62);
      yg.addColorStop(0, 'rgba(200,150,60,0)'); yg.addColorStop(1, 'rgba(190,130,50,0.35)'); g.fillStyle = yg; g.fillRect(0, 0, PW, PH);
      // shards for the broken border
      const shards = Array.from({ length: 22 }, (_, k) => {
        const a = -PI * 0.95 + r() * PI * 0.9, sp = 300 + r() * 900, sz = 14 + r() * 40;
        return { a, sp, sz, rot: (r() - 0.5) * 14, pts: Array.from({ length: 4 }, (_, j) => [Math.cos(j / 4 * TAU + r()) * sz, Math.sin(j / 4 * TAU + r()) * sz * (0.4 + r() * 0.6)]), ink: r() < 0.45 };
      });
      return { paper, col: offscreen(1920, 1080), plate: offscreen(1920, 1080), keyc: offscreen(1920, 1080), shards };
    },
    draw(c, t, W, H, st) {
      const base = c.getTransform();
      CB_ST = st;
      const tq = Math.floor(t * 12) / 12;
      const reg = k => [Math.round((vnoise(tq * 3, 11 + k) * 3 + [2, -3, 1][k]) * (1 + 3 * Math.exp(-Math.max(0, t - CB_T.boom) * 3) * (t > CB_T.boom ? 1 : 0))), Math.round(vnoise(tq * 3, 21 + k) * 3 + [-2, 1, 3][k])];
      const mis = [reg(0), reg(1), reg(2)];

      if (t < CB_T.cover) {
        // ----- the page -----
        let [cx, cy, s] = cbCam(Math.min(t, CB_T.boom));
        // punch shake on arrivals
        const hits = [CB_T.p1, CB_T.p2, CB_T.p3, CB_T.p4];
        let sh = 0; hits.forEach(h => { if (t > h) sh += 9 * Math.exp(-(t - h) * 14); });
        if (t > CB_T.p3 && t < CB_T.p4) sh += 3 * seg(t, 3.6, 3.8);
        const ox = vnoise(t * 40, 3) * sh, oy = vnoise(t * 40, 7) * sh;
        const camT = g => g.setTransform(base.a * s, 0, 0, base.d * s, base.e + (960 - cx * s + ox) * base.a, base.f + (540 - cy * s + oy) * base.d);
        const camC = g => g.setTransform(s, 0, 0, s, 960 - cx * s + ox, 540 - cy * s + oy);
        c.fillStyle = CB.desk; c.fillRect(0, 0, W, H);
        c.save(); camT(c);
        c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(14, 22, 2400, 1350);
        c.drawImage(st.paper, 0, 0);
        c.restore();
        const vis = P => { const x0 = (P.x - cx) * s + 960, x1 = (P.x + P.w - cx) * s + 960, y0 = (P.y - cy) * s + 540, y1 = (P.y + P.h - cy) * s + 540; return x1 > -40 && x0 < 1960 && y1 > -40 && y0 < 1120; };
        const breaking = t >= CB_T.brk;
        cbPrint(c, st, base, mis, g => {
          camC(g);
          CBP.forEach((P, i) => { if (!vis(P)) return; g.save(); g.beginPath(); g.rect(P.x, P.y, P.w, P.h); g.clip(); g.translate(P.x, P.y); SCENES[i](g, 'c', tq, t); g.restore(); });
        });
        c.save(); camT(c);
        CBP.forEach((P, i) => { if (!vis(P)) return; c.save(); c.beginPath(); c.rect(P.x, P.y, P.w, P.h); c.clip(); c.translate(P.x, P.y); SCENES[i](c, 'k', tq, t); c.restore(); });
        // panel borders, inked by hand
        c.strokeStyle = CB.ink; c.lineJoin = 'miter';
        CBP.forEach((P, i) => {
          c.lineWidth = 8;
          if (i === 3 && breaking) {
            const bx = 50 + 900, by = 774;
            c.beginPath(); c.moveTo(bx - 150, by); c.lineTo(P.x, by); c.lineTo(P.x, P.y + P.h); c.lineTo(P.x + P.w, P.y + P.h); c.lineTo(P.x + P.w, by); c.lineTo(bx + 170, by); c.stroke();
            // jagged rupture
            c.lineWidth = 4; const r = rng(77);
            c.beginPath(); c.moveTo(bx - 150, by); for (let k = 1; k <= 8; k++) c.lineTo(bx - 150 + k * 40, by + (k % 2 ? 26 + r() * 30 : -6 + r() * 10)); c.stroke();
            for (let k = 0; k < 7; k++) { const a = -PI + k * 0.5 + r() * 0.3, l = 60 + r() * 90; c.beginPath(); c.moveTo(bx, by + 30); c.lineTo(bx + Math.cos(a) * l, by + 30 + Math.sin(a) * l * 0.7); c.stroke(); }
          } else roughPoly(c, [[P.x, P.y], [P.x + P.w, P.y], [P.x + P.w, P.y + P.h], [P.x, P.y + P.h]], 50 + i, 1.2, 60), c.stroke();
        });
        // lettering on top of the art
        if (t > 0.65) caption(c, 80, 80, 600, 128, ['MEANWHILE, HIGH ABOVE', 'PORT HALCYON...'], typed(t, 0.7, 34), 38);
        if (t > 2.45) balloon(c, 1800, 14, 500, 142, [0.66, 2020, 176], ['...SOMETHING BIG', 'IS COMING.'], typed(t, 2.55, 30), { size: 36, lh: 44, it: true, pop: E.outB(seg(t, 2.45, 2.6)) });
        if (t > 3.85) balloon(c, 1396, 500, 380, 200, [0.82, 1740, 740], ['THIS CITY...', 'IS MINE!'], typed(t, 3.95, 22), { size: 46, lh: 54, jag: true, fill: '#dff26a', pop: E.outB(seg(t, 3.85, 4.0)), seed: 9 });
        c.restore();

        // ----- the break: Kestrel smashes out of panel 4 -----
        if (breaking) {
          const u = seg(t, CB_T.brk, CB_T.boom), ue = E.inQ(u);
          const hp = heroP4(CB_T.brk);
          const hx = lerp(50 + hp.x, 1020, ue), hy = lerp(774 + hp.y, 700, ue), hs = lerp(hp.s, 3.0, ue);
          c.save(); camT(c);
          st.shards.forEach(sd => {
            const d = sd.sp * E.outQ(u) * 0.6, x = 950 + Math.cos(sd.a) * d, y = 790 + Math.sin(sd.a) * d + 400 * u * u;
            c.save(); c.translate(x, y); c.rotate(sd.rot * u);
            polyPath(c, sd.pts); c.fillStyle = sd.ink ? CB.ink : CB.paper; c.fill(); c.lineWidth = 3; c.strokeStyle = CB.ink; c.stroke(); c.restore();
          });
          const drawH = (g, pass) => { g.save(); g.translate(hx, hy); g.scale(hs, hs); g.rotate(-0.3 - 0.15 * ue); heroLeap(g, pass, tq, { lw: 7 }); g.restore(); };
          drawH(c, 'n');
          c.restore();
          cbPrint(c, st, base, mis, g => { camC(g); drawH(g, 'c'); });
          c.save(); camT(c); keyLayer(c, st, g => drawH(g, 'k')); c.restore();
        }

        // ----- KRAKOOM -----
        if (t >= CB_T.boom) {
          const b = t - CB_T.boom, bq = tq - CB_T.boom;
          const shk = 26 * Math.exp(-b * 3.5);
          const sx = vnoise(t * 35, 1) * shk, sy = vnoise(t * 35, 2) * shk;
          if (b < 1 / 24) { c.fillStyle = '#fffdf6'; c.fillRect(0, 0, W, H); }
          else if (b < 3 / 24) {
            // inverted impact frame: black field, white linework
            c.fillStyle = CB.ink; c.fillRect(0, 0, W, H);
            speedLines(c, 960, 540, W, H, 7, 90, '#fffdf6');
            c.save(); c.translate(1000, 560); c.scale(2.6, 2.6); c.rotate(-0.4); c.fillStyle = '#fffdf6'; heroLeap(c, 'n', tq, { lw: 7 }); c.restore();
          } else {
            const pop = E.outB(seg(b, 0.1, 0.3), 2.2);
            c.fillStyle = CB.paper; c.fillRect(0, 0, W, H);
            cbPrint(c, st, base, mis, g => {
              g.setTransform(1, 0, 0, 1, sx, sy);
              // rays
              g.save(); g.translate(960, 540); g.rotate(bq * 0.15);
              for (let k = 0; k < 28; k++) { g.fillStyle = k % 2 ? '#f8c42a' : '#ee6a24'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 1400, k / 28 * TAU, (k + 1) / 28 * TAU); g.fill(); }
              g.restore();
              dots(g, -40, -40, 2000, 1160, 18, 0.5, '#d8262f', (x, y) => 9 * clamp((Math.hypot(x - 960, y - 540) - 300) / 700));
              g.save(); g.translate(960, 540); g.scale(pop, pop); g.rotate(-0.05);
              burstPath(g, 0, 0, 380, 820, 15, 12); g.fillStyle = '#ffe14a'; g.fill();
              burstPath(g, 0, 0, 260, 520, 13, 13); g.fillStyle = '#fff6c8'; g.fill();
              g.restore();
            });
            c.save(); c.setTransform(base); c.translate(sx, sy);
            speedLines(c, 960, 540, W, H, tq, 46, CB.ink);
            c.save(); c.translate(960, 540); c.scale(pop, pop); c.rotate(-0.05);
            burstPath(c, 0, 0, 380, 820, 15, 12); c.lineWidth = 9; c.strokeStyle = CB.ink; c.stroke();
            c.restore();
            // smoke puffs: union outline (stroke all, then fill all)
            const puffs = [];
            for (let k = 0; k < 12; k++) {
              const a = k / 12 * TAU + 0.3, d = (380 + 260 * E.outQ(seg(b, 0.1, 1.2))) * (0.9 + hash(k) * 0.3), rr = (50 + hash(k * 3) * 50) * pop;
              const x = 960 + Math.cos(a) * d * 1.5, y = 540 + Math.sin(a) * d;
              puffs.push([x, y, rr], [x + rr * 0.8, y - rr * 0.3, rr * 0.7], [x - rr * 0.7, y + rr * 0.2, rr * 0.6]);
            }
            c.lineWidth = 14; c.strokeStyle = CB.ink;
            puffs.forEach(([x, y, rr]) => { c.beginPath(); c.arc(x, y, rr, 0, TAU); c.stroke(); });
            c.fillStyle = '#fffdf6';
            puffs.forEach(([x, y, rr]) => { c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); });
            puffs.forEach(([x, y, rr], i) => { if (i % 3 === 0) { c.save(); c.beginPath(); c.arc(x, y, rr, 0, TAU); c.clip(); dots(c, x - rr, y - rr, rr * 2, rr * 2, 9, 0.6, '#cfc6b4', (px, py) => 4 * clamp((py - y) / rr + 0.2)); c.restore(); } });
            // KRAKOOM!
            const word = [...'KRAKOOM!'], sizes = [270, 240, 260, 250, 290, 290, 270, 280];
            c.save(); c.translate(960, 600); c.rotate(-0.08);
            const ws = word.map((ch, i) => { c.font = `400 ${sizes[i]}px ${CBB}`; return c.measureText(ch).width; });
            const gap = 4, tot = ws.reduce((a, b2) => a + b2, 0) + gap * (word.length - 1);
            let x = -tot / 2;
            word.forEach((ch, i) => {
              const at = 0.12 + i * 0.045, p = seg(b, at, at + 0.08);
              if (p > 0) {
                const sc = lerp(2.4, 1, E.outQt(p)) * (1 + 0.03 * Math.sin(t * 20 + i));
                c.save(); c.translate(x + ws[i] / 2, (i % 2 ? -16 : 16) + sizes[i] * 0.36); c.rotate((hash(i * 5) - 0.5) * 0.22); c.scale(sc, sc);
                megaText(c, ch, 0, 0, sizes[i], { align: 'center', depth: 18, dx: 0.8, dy: 1.2, ext: '#c21d2a', fill: '#ffe23a', lw: 16 });
                c.restore();
              }
              x += ws[i] + gap;
            });
            c.restore();
            c.restore();
          }
        }
        // page turn into the cover
        if (t >= CB_T.turn) {
          const u = E.inQ(seg(t, CB_T.turn, CB_T.cover)), x = lerp(1920, 0, u);
          const gr = c.createLinearGradient(x - 120, 0, x, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)');
          c.fillStyle = gr; c.fillRect(x - 120, 0, 120, H);
          c.fillStyle = CB.paper; c.fillRect(x, 0, W - x, H);
          const g2 = c.createLinearGradient(x, 0, x + 140, 0); g2.addColorStop(0, 'rgba(255,255,255,0.7)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
          c.fillStyle = g2; c.fillRect(x, 0, 140, H);
        }
      } else {
        // ----- the cover -----
        const ct = t - CB_T.cover;
        const slam = 1 + 0.06 * Math.exp(-ct * 9) * Math.cos(ct * 40);
        c.fillStyle = CB.desk; c.fillRect(0, 0, W, H);
        c.save(); c.translate(960, 540); c.scale(slam, slam); c.translate(-960, -540);
        c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(48, 40, 1840, 1022);
        c.fillStyle = CB.paper; c.fillRect(36, 26, 1848, 1028);
        c.restore();
        const hx = 1250, hy = 600 + Math.sin(tq * 3) * 6;
        const drawHero = (g, pass) => { g.save(); g.translate(hx, hy); g.scale(1.95, 1.95); g.rotate(-0.36); heroLeap(g, pass, tq, { lw: 6, wind: 0.8 }); g.restore(); };
        const clipCover = g => { g.beginPath(); g.rect(60, 50, 1800, 980); g.clip(); };
        cbPrint(c, st, base, mis.map(m => [m[0] * 0.6, m[1] * 0.6]), g => {
          g.setTransform(slam, 0, 0, slam, 960 - 960 * slam, 540 - 540 * slam);
          g.save(); clipCover(g);
          g.save(); g.translate(1180, 560); g.rotate(tq * 0.05);
          for (let k = 0; k < 36; k++) { g.fillStyle = k % 2 ? '#f8c42a' : '#f39a2a'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 1500, k / 36 * TAU, (k + 1) / 36 * TAU); g.fill(); }
          g.restore();
          dots(g, 60, 50, 1800, 980, 15, 0.5, '#d8262f', (x, y) => 7 * clamp((Math.hypot(x - 1180, y - 560) - 260) / 800));
          // city and the toppled mech
          g.fillStyle = '#2a3a8c'; const r = rng(55);
          for (let x = 40; x < 1900; x += 40 + r() * 50) { const h = 60 + r() * 170; g.fillRect(x, 1030 - h, 34 + r() * 40, h); }
          g.restore();
          g.save(); clipCover(g); drawHero(g, 'c'); g.restore();
        });
        c.save(); c.translate(960, 540); c.scale(slam, slam); c.translate(-960, -540);
        c.save(); clipCover(c);
        c.fillStyle = CB.ink; const r = rng(55);
        for (let x = 40; x < 1900; x += 40 + r() * 50) { const h = 60 + r() * 170, w = 34 + r() * 40; c.lineWidth = 4; c.strokeStyle = CB.ink; c.strokeRect(x, 1030 - h, w, h); c.fillRect(x + w * 0.65, 1030 - h, w * 0.35, h); }
        speedLines(c, 1180, 560, W, H, 3, 26, 'rgba(23,19,26,0.85)');
        keyLayer(c, st, g => drawHero(g, 'k'));
        c.restore();
        // trim edge
        c.lineWidth = 6; c.strokeStyle = CB.ink; c.strokeRect(60, 50, 1800, 980);
        // corner box
        const cb = E.outB(seg(ct, 0.55, 0.75));
        if (cb > 0) {
          c.save(); c.translate(160, 160); c.scale(cb, cb);
          c.fillStyle = '#fffdf6'; c.fillRect(-90, -100, 180, 200); c.lineWidth = 6; c.strokeStyle = CB.ink; c.strokeRect(-90, -100, 180, 200);
          c.fillStyle = CB.red; c.fillRect(-90, -100, 180, 56); c.strokeRect(-90, -100, 180, 56);
          text(c, 'No. 1', 0, -58, { font: CBB, size: 44, align: 'center', color: '#fffdf6', ls: 2 });
          text(c, '12¢', 0, 30, { font: CBB, size: 84, align: 'center', color: CB.ink });
          text(c, 'FAMILY C', 0, 80, { font: CBF, weight: 700, size: 22, align: 'center', color: CB.ink, ls: 2 });
          c.restore();
        }
        // masthead: letters drop in on the beat
        const MT = 'COMIC BOOK MOTION';
        c.save(); c.font = `400 172px ${CBB}`;
        let x = 300;
        const wTot = c.measureText(MT).width + MT.length * 6;
        x = 1040 - wTot / 2 + 110;
        [...MT].forEach((ch, i) => {
          const w = c.measureText(ch).width + 6;
          const at = 0.22 + i * 0.022, p = seg(ct, at, at + 0.14);
          if (p > 0 && ch !== ' ') {
            const yy = lerp(-160, 0, E.outB(p, 2.2));
            megaText(c, ch, x, 238 + yy, 172, { depth: 14, dx: 0.9, dy: 1.1, ext: CB.red, fill: CB.yel, lw: 14 });
          }
          x += w;
        });
        c.restore();
        text(c, 'THE MOTION STYLE ATLAS PRESENTS', 1040 + 110, 72 + 18, { font: CBF, weight: 700, size: 26, align: 'center', color: CB.ink, ls: 6 });
        // blurb burst
        const bb = E.outB(seg(ct, 0.8, 1.0), 2);
        if (bb > 0) {
          c.save(); c.translate(320, 610); c.rotate(-0.16 + Math.sin(tq * 6) * 0.015); c.scale(bb * 0.88, bb * 0.88);
          burstPath(c, 0, 0, 160, 215, 14, 31); c.fillStyle = '#fffdf6'; c.fill(); c.lineWidth = 8; c.strokeStyle = CB.ink; c.stroke();
          burstPath(c, 0, 0, 140, 190, 14, 31); c.fillStyle = CB.red; c.fill();
          text(c, 'PANELS', 0, -26, { font: CBB, size: 70, align: 'center', color: '#ffe23a', stroke: CB.ink, lw: 8, ls: 2 });
          text(c, 'IN MOTION!', 0, 44, { font: CBB, size: 60, align: 'center', color: '#fffdf6', stroke: CB.ink, lw: 8, ls: 2 });
          c.restore();
        }
        if (ct > 1.0) caption(c, 110, 896, 760, 100, ['IN THIS ISSUE: KESTREL vs.', 'THE LEVIATHAN!'], typed(t, CB_T.cover + 0.95, 72), 34);
      }
      grain(c, W, H, t, 0.07, 'multiply');
      vignette(c, W, H, 0.3, '20,10,30');
    },
    score(A) {
      A.bus.gain.value = 0.62;
      const B = 0.6;
      const hit = (t, notes, g = 0.05) => {     // orchestral brass stab
        A.chord(t, notes, { type: 'sawtooth', dur: 0.5, g, lp: 3200, lp2: 600, lpT: 0.4, a: 0.008, spread: 9, rev: 0.35 });
        A.osc(t, { f: midi(notes[0] - 12), f2: midi(notes[0] - 12) * 0.98, dur: 0.6, g: 0.32, type: 'triangle' });
        A.noise(t, { type: 'highpass', f: 4000, dur: 0.6, g: 0.05, rev: 0.4 });
      };
      const timp = (t, f, g = 0.5) => { A.osc(t, { f, f2: f * 0.9, glide: 0.4, dur: 0.9, g }); A.noise(t, { type: 'lowpass', f: 400, dur: 0.15, g: g * 0.3 }); };
      // page reveal
      hit(0.0, [50, 57, 62], 0.04); timp(0.0, 73, 0.4);
      A.whoosh(0.22, 0.38, { f1: 300, f2: 3000, g: 0.18 });
      // boom-bap groove under the panels
      for (let k = 1; k < 10; k++) {
        const tb = k * B; if (tb >= CB_T.boom - 0.01) break;
        A.kick(tb, 0.62);
        A.kick(tb + B * 0.75, 0.32, { f: 120 });
        A.snare(tb + B * 0.5, 0.38, { rev: 0.18 });
        [0, 0.25, 0.5, 0.75].forEach((d, j) => A.hat(tb + d * B, j % 2 ? 0.05 : 0.08, false, { pan: j % 2 ? 0.3 : -0.2 }));
        // pizzicato-like string ostinato
        [62, 65, 69, 65].forEach((m, j) => A.pluck(tb + j * B * 0.25, midi(m - 12 + (k > 5 ? 2 : 0)), { dur: 0.4, g: 0.16, bright: 0.6, decay: 0.99, lp: 2600 }));
        // bass
        A.osc(tb, { type: 'sawtooth', f: midi(38 + (k > 5 ? 2 : 0)), dur: B * 0.9, g: 0.12, lp: 300, a: 0.01, hold: true, rel: 0.05 });
      }
      // panel cuts: whoosh into each, brass stab on arrival
      [[CB_T.p2, [53, 57, 60]], [CB_T.p3, [46, 53, 58]], [CB_T.p4, [48, 55, 60]]].forEach(([t, ch]) => { A.whoosh(t - 0.25, 0.3, { f1: 400, f2: 4000, g: 0.16 }); hit(t, ch, 0.05); });
      hit(CB_T.p1, [50, 57, 62], 0.05);
      // caption & balloon typing ticks
      for (let k = 0; k < 20; k++) A.noise(0.7 + k / 34 * 1.6, { type: 'bandpass', f: 3200, q: 3, dur: 0.02, g: 0.025 });
      // eye narrows: tense strings
      A.osc(2.5, { type: 'sawtooth', f: midi(74), dur: 1.1, g: 0.03, lp: 2000, vib: [6, 5], a: 0.2, hold: true, rel: 0.2, rev: 0.4 });
      A.osc(2.5, { type: 'sawtooth', f: midi(75), dur: 1.1, g: 0.02, lp: 2000, vib: [5, 5], a: 0.2, hold: true, rel: 0.2, rev: 0.4 });
      // the mech: sub rumble, servo whine, eye ignition, robot voice
      A.osc(3.6, { type: 'sawtooth', f: 38, dur: 1.2, g: 0.18, lp: 160, a: 0.2, hold: true, rel: 0.3 });
      A.noise(3.6, { type: 'lowpass', f: 300, dur: 1.2, g: 0.18, swell: 0.6 });
      A.osc(3.75, { type: 'square', f: 300, f2: 1400, glide: 0.25, dur: 0.3, g: 0.04, lp: 3000 });
      [0, 0.12, 0.24].forEach((d, i) => A.osc(3.95 + d * 2, { type: 'square', f: [110, 98, 82][i], dur: 0.2, g: 0.05, lp: 900, crush: true }));
      // leap
      A.riser(4.8, 0.9, { g: 0.16, f: 220 });
      A.whoosh(4.9, 0.6, { f1: 600, f2: 4000, g: 0.2, pan: 0.4 });
      // border breaks
      A.noise(CB_T.brk, { type: 'highpass', f: 2500, dur: 0.35, g: 0.24, rev: 0.3 });
      for (let k = 0; k < 8; k++) A.noise(CB_T.brk + 0.03 + k * 0.025, { type: 'bandpass', f: 3000 + hash(k) * 4000, q: 4, dur: 0.05, g: 0.08, pan: (hash(k * 3) - 0.5) });
      A.osc(CB_T.brk, { type: 'sawtooth', f: 80, f2: 400, glide: 0.3, dur: 0.3, g: 0.06, lp: 1500 });
      // KRAKOOM
      A.impact(CB_T.boom, 0.95);
      A.kick(CB_T.boom, 0.9, { f: 120, f2: 30, dur: 0.8 });
      A.noise(CB_T.boom, { type: 'highpass', f: 3000, dur: 1.8, g: 0.16, rev: 0.6 });
      A.noise(CB_T.boom, { type: 'bandpass', f: 600, q: 0.5, dur: 0.7, g: 0.25, crush: true });
      hit(CB_T.boom, [38, 45, 50, 57], 0.06);
      A.chord(CB_T.boom + 0.05, [62, 65, 69, 74], { type: 'sawtooth', dur: 1.4, g: 0.022, lp: 2400, a: 0.1, hold: true, rel: 0.5, spread: 10, rev: 0.6, width: 0.8 });
      // build into the cover
      A.riser(6.9, 0.85, { g: 0.12, f: 110 });
      for (let k = 0; k < 6; k++) A.snare(7.2 + k * 0.1, 0.12 + k * 0.04, { rev: 0.1 });
      A.whoosh(CB_T.turn, 0.3, { f1: 3000, f2: 400, g: 0.14 });
      // cover: fanfare and final bar
      hit(CB_T.cover, [50, 57, 62, 66], 0.06); timp(CB_T.cover, 73, 0.55);
      A.kick(CB_T.cover, 0.7);
      for (let i = 0; i < 17; i++) if (i % 3 === 0) A.noise(CB_T.cover + 0.22 + i * 0.022, { type: 'bandpass', f: 1800, q: 2, dur: 0.04, g: 0.05 });
      const fan = [[8.4, [55, 59, 62]], [8.7, [57, 61, 64]], [9.0, [62, 66, 69, 74]]];
      fan.forEach(([t, ch], i) => { hit(t, ch, i === 2 ? 0.055 : 0.04); A.kick(t, 0.5); });
      A.snare(8.6, 0.3); A.snare(8.85, 0.3);
      A.chord(9.0, [62, 66, 69, 74], { type: 'sawtooth', dur: 1.0, g: 0.02, lp: 2600, a: 0.02, hold: true, rel: 0.6, spread: 9, rev: 0.5, width: 1 });
      A.noise(9.0, { type: 'highpass', f: 5000, dur: 1.0, g: 0.08, rev: 0.6 });
      timp(9.0, 73, 0.5);
    },
  });
  /* =====================================================================
     CHALKBOARD — a stick of chalk writes the pendulum law, draws the
     pendulum, lets it swing; a felt eraser wipes the formula to a ghost,
     coloured chalk traces the motion as a graph, and the title is written
     ===================================================================== */
  const CK = { slate: '#1d2a24', white: [238, 236, 226], yellow: [246, 216, 98], pink: [242, 150, 182], blue: [140, 196, 236] };
  const CK_REL = 4.7, CK_TH0 = 0.5, CK_W = TAU / 1.25, CK_PIV = [1400, 150], CK_LEN = 470, CK_BOB = 40;
  const ckTheta = t => (t < CK_REL ? CK_TH0 : CK_TH0 * Math.exp(-0.11 * (t - CK_REL)) * Math.cos(CK_W * (t - CK_REL)));
  function ckCR(pts, per = 8) {
    if (pts.length < 3) return pts.slice();
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < per; k++) {
        const u = k / per, u2 = u * u, u3 = u2 * u;
        out.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3)));
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  // Single-stroke hand-lettered glyphs: unit cap height, y down.
  const CK_GL = {
    T: { w: 0.75, s: [[[0, 0.02], [0.36, 0], [0.74, 0.03]], [[0.37, 0.03], [0.36, 0.5], [0.38, 1]]] },
    '=': { w: 0.62, s: [[[0, 0.38], [0.56, 0.36]], [[0.02, 0.64], [0.58, 0.62]]] },
    2: { w: 0.7, s: [[[0.04, 0.24], [0.18, 0.04], [0.42, 0], [0.6, 0.16], [0.52, 0.42], [0.22, 0.74], [0, 1], [0.34, 0.97], [0.68, 0.98]]] },
    'π': { w: 0.86, s: [[[0, 0.36], [0.14, 0.24], [0.5, 0.22], [0.84, 0.2]], [[0.26, 0.24], [0.24, 0.62], [0.12, 1]], [[0.6, 0.22], [0.58, 0.8], [0.66, 0.98], [0.8, 0.94]]] },
    L: { w: 0.62, s: [[[0, 0], [0.01, 0.5], [0.02, 1], [0.3, 0.99], [0.6, 0.97]]] },
    g: { w: 0.62, s: [[[0.56, 0.36], [0.32, 0.28], [0.08, 0.42], [0.1, 0.68], [0.34, 0.72], [0.56, 0.56], [0.58, 0.34]], [[0.58, 0.3], [0.57, 0.8], [0.52, 1.14], [0.3, 1.28], [0.06, 1.18]]] },
    C: { w: 0.72, s: [[[0.66, 0.16], [0.46, 0], [0.16, 0.08], [0, 0.5], [0.14, 0.9], [0.44, 1], [0.7, 0.84]]] },
    H: { w: 0.68, s: [[[0, 0], [0.01, 0.5], [0.02, 1]], [[0.64, 0], [0.63, 0.5], [0.65, 1]], [[0.02, 0.52], [0.34, 0.5], [0.64, 0.49]]] },
    A: { w: 0.74, s: [[[0, 1], [0.18, 0.5], [0.36, 0], [0.54, 0.5], [0.72, 1]]], s2: [[[0.15, 0.64], [0.4, 0.62], [0.58, 0.62]]] },
    K: { w: 0.66, s: [[[0, 0], [0.01, 0.5], [0.02, 1]], [[0.62, 0], [0.32, 0.3], [0.04, 0.58]], [[0.22, 0.44], [0.44, 0.7], [0.66, 1]]] },
    'θ': { w: 0.6, s: [[[0.3, 0], [0.08, 0.2], [0, 0.55], [0.12, 0.92], [0.32, 1], [0.5, 0.76], [0.56, 0.4], [0.46, 0.08], [0.3, 0]], [[0.04, 0.5], [0.3, 0.5], [0.54, 0.48]]] },
    t: { w: 0.5, s: [[[0.22, 0], [0.2, 0.5], [0.22, 0.88], [0.34, 1], [0.5, 0.92]], [[0, 0.32], [0.24, 0.31], [0.48, 0.3]]] },
  };
  const CK_STROKES = (() => {
    const S = [], r = rng(2014);
    const jit = (pts, a) => pts.map(([x, y]) => [x + (r() - 0.5) * a, y + (r() - 0.5) * a]);
    const add = (ctrl, t0, t1, o = {}) => {
      const pts = ckCR(jit(ctrl, o.jit ?? 3), o.per || 8);
      const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      S.push({ pts, cum, len: cum[cum.length - 1], t0, t1, col: o.col || CK.white, w: o.w || 8, layer: o.layer || 'B', ghost: o.ghost, lin: o.lin, seed: S.length * 7.3 });
    };
    // writes a glyph; returns strokes spread over [t0,t1]
    const glyph = (ch, x, y, size, t0, t1, o = {}) => {
      const G = CK_GL[ch], strokes = [...G.s, ...(G.s2 || [])], n = strokes.length, gap = 0.025;
      const d = (t1 - t0 - gap * (n - 1)) / n;
      strokes.forEach((st, i) => add(st.map(([u, v]) => [x + u * size, y + v * size]), t0 + i * (d + gap), t0 + i * (d + gap) + d, o));
      return x + G.w * size;
    };
    const A = { layer: 'A', w: 9 };
    // the formula  T = 2π √(L/g)
    glyph('T', 170, 270, 120, 0.3, 0.58, A);
    glyph('=', 300, 270, 120, 0.68, 0.87, A);
    glyph(2, 420, 270, 120, 0.97, 1.18, A);
    glyph('π', 528, 270, 120, 1.22, 1.56, A);
    add([[640, 346], [662, 334], [678, 410], [694, 488], [712, 320], [728, 160], [820, 158], [905, 160]], 1.64, 1.96, { ...A, per: 3 });
    glyph('L', 772, 180, 100, 2.0, 2.12, A);
    add([[744, 330], [815, 329], [886, 327]], 2.15, 2.22, A);
    glyph('g', 782, 344, 100, 2.25, 2.52, A);
    add([[160, 546], [540, 541], [930, 534]], 2.62, 2.78, { ...A, w: 7 });
    // the pendulum
    const P = CK_PIV, B = [P[0] + CK_LEN * Math.sin(CK_TH0), P[1] + CK_LEN * Math.cos(CK_TH0)];
    add([[1170, 150], [1400, 148], [1630, 151]], 2.95, 3.1, { w: 7 });
    for (let k = 0; k < 9; k++) add([[1188 + k * 50, 148], [1212 + k * 50, 118]], 3.12 + k * 0.03, 3.14 + k * 0.03, { w: 5, jit: 1.5 });
    add(Array.from({ length: 13 }, (_, k) => [P[0] + Math.cos(k / 12 * TAU - 1) * 9, P[1] + Math.sin(k / 12 * TAU - 1) * 9]), 3.42, 3.5, { w: 5, jit: 1 });
    add([P, [lerp(P[0], B[0], 0.5), lerp(P[1], B[1], 0.5)], [B[0] - CK_BOB * Math.sin(CK_TH0), B[1] - CK_BOB * Math.cos(CK_TH0)]], 3.52, 3.7, { w: 6, ghost: CK_REL });
    add(Array.from({ length: 21 }, (_, k) => [B[0] + Math.cos(k / 19 * TAU - 2) * CK_BOB, B[1] + Math.sin(k / 19 * TAU - 2) * CK_BOB]), 3.72, 3.92, { w: 8, ghost: CK_REL, jit: 2 });
    for (let k = 0; k < 4; k++) { const o = -24 + k * 16, h = Math.sqrt(Math.max(0, CK_BOB * CK_BOB - o * o)) * 0.8; add([[B[0] + o - h * 0.5, B[1] + h * 0.7], [B[0] + o + h * 0.5, B[1] - h * 0.7]], 3.94 + k * 0.03, 3.96 + k * 0.03, { w: 5, ghost: CK_REL, jit: 1.5 }); }
    for (let k = 0; k < 6; k++) add([[P[0], P[1] + 30 + k * 85], [P[0] + 1, P[1] + 70 + k * 85]], 4.06 + k * 0.025, 4.08 + k * 0.025, { w: 5, jit: 1 });
    add(Array.from({ length: 9 }, (_, k) => { const a = (k / 8) * CK_TH0; return [P[0] + Math.sin(a) * 110, P[1] + Math.cos(a) * 110]; }), 4.24, 4.32, { w: 5, jit: 1 });
    glyph('θ', 1436, 286, 56, 4.34, 4.46, { w: 6, jit: 1.5 });
    glyph('L', 1556, 300, 64, 4.48, 4.56, { w: 6, jit: 1.5 });
    for (let k = 0; k < 9; k++) { const a0 = -CK_TH0 + (k / 9) * 2 * CK_TH0, a1 = a0 + 0.06; add([[P[0] + Math.sin(a0) * (CK_LEN + 70), P[1] + Math.cos(a0) * (CK_LEN + 70)], [P[0] + Math.sin(a1) * (CK_LEN + 70), P[1] + Math.cos(a1) * (CK_LEN + 70)]], 4.58 + k * 0.012, 4.59 + k * 0.012, { w: 4, jit: 0.5 }); }
    // after the eraser: axes in white, the trace in yellow, a pink circle, the title
    add([[180, 236], [181, 420], [180, 604]], 5.86, 5.96, { w: 6 });
    add([[168, 420], [540, 419], [920, 420]], 5.98, 6.1, { w: 6 });
    add([[896, 404], [922, 420], [896, 437]], 6.11, 6.16, { w: 6, jit: 1 });
    glyph('θ', 130, 190, 50, 6.18, 6.27, { w: 5, jit: 1.5, col: CK.yellow });
    glyph('t', 934, 432, 46, 6.28, 6.33, { w: 5, jit: 1.5 });
    const cur = []; for (let k = 0; k <= 180; k++) { const tt = 6.36 + k / 180 * 1.26; cur.push([190 + (tt - 6.36) * 560, 420 - ckTheta(tt) / CK_TH0 * 150]); }
    add(cur, 6.36, 7.62, { w: 7, col: CK.yellow, jit: 0.6, per: 1, lin: true });
    add(Array.from({ length: 16 }, (_, k) => { const a = k / 14 * TAU - 2.4; return [1578 + Math.cos(a) * 56, 332 + Math.sin(a) * 50]; }), 7.66, 7.84, { w: 6, col: CK.pink, jit: 3 });
    add([[1516, 300], [1380, 236], [1180, 236], [985, 296]], 7.86, 7.98, { w: 5, col: CK.pink, jit: 2 });
    add([[1006, 266], [982, 298], [1020, 306]], 7.99, 8.03, { w: 5, col: CK.pink, jit: 1 });
    add([[1400, 712], [1401, 770], [1400, 830]], 8.06, 8.12, { w: 6, col: CK.blue, jit: 1 });
    add([[1382, 806], [1400, 834], [1420, 806]], 8.13, 8.16, { w: 6, col: CK.blue, jit: 1 });
    glyph('g', 1432, 750, 70, 8.17, 8.27, { w: 6, col: CK.blue, jit: 1.5 });
    let x = 176; const T0 = 8.3, seq = [...'CHALK TALK'];
    const per = 0.72 / seq.filter(ch => ch !== ' ').length;
    seq.forEach((ch, i) => { if (ch === ' ') { x += 50; return; } const k = seq.slice(0, i).filter(c2 => c2 !== ' ').length; x = glyph(ch, x, 700, 112, T0 + k * per, T0 + k * per + per * 0.9, { w: 10 }) + 26; });
    add([[170, 856], [600, 850], [1080, 846]], 9.05, 9.14, { w: 7, col: CK.yellow });
    add([[230, 878], [640, 872], [1000, 870]], 9.16, 9.23, { w: 6, col: CK.yellow });
    return S;
  })();
  const CK_ERASE = [[-260, 170], [940, 190], [130, 262], [940, 330], [130, 400], [944, 462], [130, 520], [930, 560], [-300, 640]];
  const CK_ER_T = [4.95, 5.8];
  const ckErasePath = (() => { const cum = [0]; for (let i = 1; i < CK_ERASE.length; i++) cum.push(cum[i - 1] + Math.hypot(CK_ERASE[i][0] - CK_ERASE[i - 1][0], CK_ERASE[i][1] - CK_ERASE[i - 1][1])); return cum; })();
  function ckErasePos(u) {
    const L = ckErasePath[ckErasePath.length - 1] * u;
    for (let i = 1; i < CK_ERASE.length; i++) if (L <= ckErasePath[i]) { const f = (L - ckErasePath[i - 1]) / (ckErasePath[i] - ckErasePath[i - 1]); return [lerp(CK_ERASE[i - 1][0], CK_ERASE[i][0], f), lerp(CK_ERASE[i - 1][1], CK_ERASE[i][1], f), i]; }
    return [...CK_ERASE[CK_ERASE.length - 1], CK_ERASE.length - 1];
  }
  const ckProg = (s, t) => { const u = clamp((t - s.t0) / (s.t1 - s.t0)); return s.lin ? u : E.ioS(u); };
  function ckPointAt(s, p) {
    const L = s.len * p; let i = 1; while (i < s.cum.length - 1 && s.cum[i] < L) i++;
    const f = (L - s.cum[i - 1]) / ((s.cum[i] - s.cum[i - 1]) || 1);
    return [lerp(s.pts[i - 1][0], s.pts[i][0], f), lerp(s.pts[i - 1][1], s.pts[i][1], f)];
  }
  // Where is the chalk tip at time t (and what colour, and is it lifted)?
  function ckTip(t) {
    let prev = null;
    for (const s of CK_STROKES) {
      if (t >= s.t0 && t <= s.t1) return { p: ckPointAt(s, ckProg(s, t)), col: s.col, lift: 0, on: true };
      if (s.t1 < t) prev = s;
      if (s.t0 > t) {
        if (!prev) return { p: [lerp(1700, s.pts[0][0], E.outC(seg(t, 0, s.t0))), lerp(1150, s.pts[0][1], E.outC(seg(t, 0, s.t0)))], col: s.col, lift: 1, on: false };
        const a = prev.pts[prev.pts.length - 1], b = s.pts[0], u = E.ioS(clamp((t - prev.t1) / (s.t0 - prev.t1)));
        return { p: [lerp(a[0], b[0], u), lerp(a[1], b[1], u)], col: u < 0.5 ? prev.col : s.col, lift: Math.sin(PI * u), on: false };
      }
    }
    const last = CK_STROKES[CK_STROKES.length - 1].pts.slice(-1)[0];
    const u = E.inQ(seg(t, 9.36, 9.6));
    return { p: [lerp(last[0], 1560, u), lerp(last[1], 1300, u)], col: CK.yellow, lift: Math.min(1, u * 3), on: false };
  }
  // Paint strokes (solid) into a layer; grain is applied afterwards.
  function ckPaint(g, s, p, alpha) {
    if (p <= 0) return;
    const L = s.len * p, [cr, cg, cb] = s.col;
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 1; i < s.pts.length; i++) {
        if (s.cum[i - 1] > L) break;
        const a = s.pts[i - 1]; let b = s.pts[i];
        if (s.cum[i] > L) { const f = (L - s.cum[i - 1]) / ((s.cum[i] - s.cum[i - 1]) || 1); b = [lerp(a[0], b[0], f), lerp(a[1], b[1], f)]; }
        const pr = 0.75 + 0.35 * (vnoise(s.cum[i] * 0.02, s.seed) * 0.5 + 0.5);
        g.lineWidth = s.w * (pass ? pr : pr * 1.9);
        g.strokeStyle = `rgba(${cr},${cg},${cb},${(pass ? 0.95 : 0.32) * alpha * (0.8 + 0.2 * pr)})`;
        g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
      }
    }
  }
  function ckLine(g, pts, w, col, alpha, seed) {
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    ckPaint(g, { pts, cum, len: cum[cum.length - 1], w, col, seed }, 1, alpha);
  }
  function ckStick(c, x, y, col, lift, t) {
    const ang = -0.95 + 0.06 * Math.sin(t * 2.1), L = 190, R = 14, [cr, cg, cb] = col;
    c.save();
    // shadow on the slate
    c.save(); c.translate(x + 18 + lift * 26, y + 24 + lift * 30); c.rotate(ang); c.filter = 'blur(7px)';
    c.fillStyle = 'rgba(0,0,0,0.45)'; c.beginPath(); c.roundRect(4, -R, L, R * 2, R); c.fill(); c.restore();
    c.translate(x, y - lift * 10); c.rotate(ang);
    const gr = c.createLinearGradient(0, -R, 0, R);
    gr.addColorStop(0, `rgb(${cr * 0.75},${cg * 0.75},${cb * 0.75})`); gr.addColorStop(0.35, `rgb(${Math.min(255, cr + 14)},${Math.min(255, cg + 14)},${Math.min(255, cb + 14)})`);
    gr.addColorStop(0.7, `rgb(${cr},${cg},${cb})`); gr.addColorStop(1, `rgb(${cr * 0.55},${cg * 0.55},${cb * 0.58})`);
    c.fillStyle = gr;
    c.beginPath(); c.moveTo(2, -R * 0.55); c.lineTo(14, -R); c.lineTo(L, -R); c.arc(L, 0, R, -PI / 2, PI / 2); c.lineTo(14, R); c.lineTo(2, R * 0.55); c.closePath(); c.fill();
    // worn, powdery tip and a few grain marks along the stick
    c.fillStyle = `rgba(${cr},${cg},${cb},0.9)`; c.beginPath(); c.ellipse(4, 0, 4, R * 0.55, 0, 0, TAU); c.fill();
    const r = rng(5); c.fillStyle = 'rgba(0,0,0,0.08)';
    for (let k = 0; k < 26; k++) c.fillRect(16 + r() * (L - 20), -R + r() * R * 2, 2 + r() * 6, 1);
    c.restore();
  }
  function ckEraser(c, x, y, ang) {
    c.save();
    c.save(); c.translate(x + 22, y + 30); c.rotate(ang); c.filter = 'blur(10px)'; c.fillStyle = 'rgba(0,0,0,0.5)'; c.beginPath(); c.roundRect(-120, -48, 240, 96, 16); c.fill(); c.restore();
    c.translate(x, y); c.rotate(ang);
    const wd = c.createLinearGradient(0, -46, 0, 30); wd.addColorStop(0, '#c9965c'); wd.addColorStop(0.5, '#a8743f'); wd.addColorStop(1, '#7c5128');
    c.fillStyle = wd; c.beginPath(); c.roundRect(-118, -46, 236, 70, 14); c.fill();
    c.strokeStyle = 'rgba(70,40,15,0.35)'; c.lineWidth = 1.5;
    for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo(-110, -36 + k * 9); c.bezierCurveTo(-40, -40 + k * 9 + 4, 40, -32 + k * 9 - 3, 110, -36 + k * 9); c.stroke(); }
    // felt pad, caked with chalk
    c.fillStyle = '#6b6f73'; c.beginPath(); c.roundRect(-118, 18, 236, 30, 6); c.fill();
    c.fillStyle = 'rgba(235,235,225,0.55)'; c.fillRect(-118, 34, 236, 14);
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.roundRect(-112, -42, 224, 10, 5); c.fill();
    c.restore();
  }

  MG.film({
    id: 'chalkboard', dur: 10, poster: 9.5,
    fonts: [['400 60px "Caveat Brush"', 'F=ma']],
    meta: {
      family: 'C', name: 'Chalkboard Animation', sub: 'The Chalk Talk', era: '1900s —',
      origin: 'Lecture-hall chalk talks became a screen style when explainer makers began filming, or faking, a hand drawing on slate: dusty strokes, an eraser that never quite cleans, and diagrams that start to move. Henry Reich’s MinutePhysics (2011) made the drawn-science explainer a web genre, and Ze Frank’s hand-scrawled lettering set its voice.',
      works: 'MinutePhysics (Henry Reich, 2011 —) · True Facts (Ze Frank, 2012 —) · Feynman Lectures on Physics, Caltech chalk talks (1961–63) · Good Will Hunting hallway blackboard (1997)',
      tech: ['Hand-led chalk strokes', 'Dry-chalk grain coverage', 'Eraser ghosting', 'Diagram comes alive'],
      accent: '#f6d862',
      motionDNA: 'A chalk stick leads every stroke at handwriting speed, taps to punctuate, then a finished diagram suddenly moves on twos; a felt eraser scrubs in fast zigzags.',
      visualDNA: 'Dusty, broken white strokes on a dark green slate, cloudy with the half-erased ghosts of earlier lessons, then accents in yellow and pink chalk.',
      transitions: 'Eraser wipe, write-on, diagram release, colour-chalk highlight',
      implementation: ['After Effects (write-on + texture)', 'Hand-drawn frames', 'Canvas 2D'],
      reproducibility: 'Procedural + hand-drawn',
      loopable: false,
    },
    setup() {
      const W = 1920, H = 1080, r = rng(1961);
      // chalk grain: broken coverage from the slate's tooth
      const grainC = offscreen(W, H), gg = grainC.getContext('2d'), gd = gg.createImageData(W, H), D = gd.data;
      const lat = new Float32Array(642 * 362); for (let i = 0; i < lat.length; i++) lat[i] = r();
      const vn = (x, y) => { const xi = x | 0, yi = y | 0, fx = x - xi, fy = y - yi, i = yi * 642 + xi; const a = lat[i], b = lat[i + 1], c2 = lat[i + 642], d = lat[i + 643]; const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return a + (b - a) * u + (c2 - a) * v + (a - b - c2 + d) * u * v; };
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const n = 0.5 * r() + 0.32 * vn(x / 3, y / 3) + 0.18 * vn(x / 13 + 100, y / 9 + 50);
        const a = clamp((n - 0.3) / 0.32);
        D[(y * W + x) * 4 + 3] = a * 255; D[(y * W + x) * 4] = D[(y * W + x) * 4 + 1] = D[(y * W + x) * 4 + 2] = 255;
      }
      gg.putImageData(gd, 0, 0);
      // the slate, with decades of residue
      const board = offscreen(W, H), g = board.getContext('2d');
      g.fillStyle = CK.slate; g.fillRect(0, 0, W, H);
      const cl = offscreen(240, 135), gc = cl.getContext('2d'), cd = gc.createImageData(240, 135);
      for (let y = 0; y < 135; y++) for (let x = 0; x < 240; x++) {
        const v = vn(x * 0.06 + vn(y * 0.05, 3) * 2, y * 0.07) * 0.6 + vn(x * 0.2 + 300, y * 0.2 + 100) * 0.4;
        const i = (y * 240 + x) * 4; cd.data[i] = 200; cd.data[i + 1] = 214; cd.data[i + 2] = 205; cd.data[i + 3] = Math.max(0, v - 0.35) * 70;
      }
      gc.putImageData(cd, 0, 0);
      g.filter = 'blur(10px)'; g.drawImage(cl, 0, 0, W, H); g.filter = 'none';
      // old eraser arcs
      for (let k = 0; k < 26; k++) {
        const x = r() * W, y = 60 + r() * 900, w = 200 + r() * 500;
        g.strokeStyle = `rgba(210,220,212,${0.018 + r() * 0.03})`; g.lineWidth = 50 + r() * 50; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x - w / 2, y); g.quadraticCurveTo(x, y + (r() - 0.5) * 80, x + w / 2, y + (r() - 0.5) * 30); g.stroke();
      }
      // ghosted lessons: smeared and half wiped
      const gh = offscreen(W, H), ghc = gh.getContext('2d');
      ghc.fillStyle = 'rgba(235,235,225,1)'; ghc.strokeStyle = 'rgba(235,235,225,1)'; ghc.lineWidth = 6; ghc.lineCap = 'round';
      [['F = ma', 1120, 880, 90, -0.04], ['a² + b² = c²', 260, 960, 70, 0.02], ['v = λf', 1560, 760, 80, 0.03], ['E = mc²', 980, 620, 110, -0.02], ['∫ sin x dx', 300, 700, 70, 0.0], ['ΔS ≥ 0', 1640, 990, 64, -0.05]].forEach(([s, x, y, sz, rot]) => {
        ghc.save(); ghc.translate(x, y); ghc.rotate(rot); text(ghc, s, 0, 0, { font: '"Caveat Brush", cursive', size: sz, color: 'rgba(235,235,225,1)' }); ghc.restore();
      });
      ghc.beginPath(); ghc.arc(760, 300, 150, 0, TAU); ghc.stroke();
      ghc.beginPath(); ghc.moveTo(560, 300); ghc.lineTo(960, 300); ghc.stroke();
      ghc.beginPath(); for (let x = 1100; x < 1800; x += 6) { const y = 520 + Math.sin(x / 60) * 50; x === 1100 ? ghc.moveTo(x, y) : ghc.lineTo(x, y); } ghc.stroke();
      ghc.beginPath(); ghc.moveTo(140, 140); ghc.lineTo(420, 380); ghc.lineTo(140, 380); ghc.closePath(); ghc.stroke();
      ghc.globalCompositeOperation = 'destination-in'; ghc.drawImage(grainC, 0, 0);
      // wipe most of it away in swaths
      ghc.globalCompositeOperation = 'destination-out'; ghc.lineCap = 'round';
      for (let k = 0; k < 14; k++) { ghc.strokeStyle = `rgba(0,0,0,${0.6 + r() * 0.35})`; ghc.lineWidth = 70 + r() * 40; const y = r() * H; ghc.beginPath(); ghc.moveTo(-50, y); ghc.bezierCurveTo(600, y + (r() - 0.5) * 200, 1300, y + (r() - 0.5) * 200, 1980, y + (r() - 0.5) * 100); ghc.stroke(); }
      g.globalAlpha = 0.11; g.filter = 'blur(2.5px)'; g.drawImage(gh, 0, 0); g.drawImage(gh, 9, 2); g.filter = 'none'; g.globalAlpha = 1;
      // fine slate grit
      for (let k = 0; k < 24000; k++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.12)'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
      // timber frame top and chalk ledge
      const wood = (y0, h) => {
        const wg = g.createLinearGradient(0, y0, 0, y0 + h); wg.addColorStop(0, '#8a5a30'); wg.addColorStop(0.5, '#6e4421'); wg.addColorStop(1, '#4a2c14');
        g.fillStyle = wg; g.fillRect(0, y0, W, h);
        for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(40,20,5,${0.1 + r() * 0.15})`; g.lineWidth = 1 + r() * 2; const yy = y0 + r() * h; g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(600, yy + (r() - 0.5) * 6, 1300, yy + (r() - 0.5) * 6, W, yy + (r() - 0.5) * 4); g.stroke(); }
      };
      wood(0, 34);
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 34, W, 8);
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 1000, W, 16);
      wood(1012, 68);
      g.fillStyle = 'rgba(240,238,228,0.35)'; for (let k = 0; k < 500; k++) g.fillRect(r() * W, 1016 + r() * 14, 1 + r() * 3, 1 + r() * 2);
      // spare chalk on the ledge
      const spare = (x, col, l) => { const [cr, cg, cb] = col; g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(x + 6, 1028, l, 18); g.fillStyle = `rgb(${cr},${cg},${cb})`; g.beginPath(); g.roundRect(x, 1018, l, 20, 9); g.fill(); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x, 1030, l, 8); };
      spare(1500, CK.pink, 70); spare(1600, CK.blue, 96); spare(1740, CK.white, 54);
      // vignette baked in
      const vg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 1.0); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      // eraser smear texture: horizontal streaks
      const smear = offscreen(W, H), sg = smear.getContext('2d');
      for (let k = 0; k < 900; k++) { const y = r() * H, x = r() * W, l = 80 + r() * 400; sg.strokeStyle = `rgba(230,232,224,${0.1 + r() * 0.3})`; sg.lineWidth = 1 + r() * 4; sg.beginPath(); sg.moveTo(x, y); sg.lineTo(x + l, y + (r() - 0.5) * 10); sg.stroke(); }
      const L = () => offscreen(W, H);
      return { board, grainC, smear, A: L(), B: L(), T1: L(), T2: L(), EM: L() };
    },
    draw(c, t, W, H, st) {
      const tq = Math.floor(t * 12) / 12;
      c.drawImage(st.board, 0, 0);
      const ctxOf = cv => { const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none'; g.clearRect(0, 0, W, H); return g; };
      const gA = ctxOf(st.A), gB = ctxOf(st.B);
      CK_STROKES.forEach(s => {
        const p = ckProg(s, t); if (p <= 0) return;
        const al = s.ghost ? lerp(1, 0.16, seg(t, s.ghost, s.ghost + 0.25)) : 1;
        ckPaint(s.layer === 'A' ? gA : gB, s, p, al);
      });
      // the live pendulum, redrawn on twos
      if (t >= CK_REL) {
        const th = ckTheta(tq), P = CK_PIV, bx = P[0] + Math.sin(th) * CK_LEN, by = P[1] + Math.cos(th) * CK_LEN;
        ckLine(gB, [P, [lerp(P[0], bx, 0.5) + 1.5, lerp(P[1], by, 0.5)], [bx - Math.sin(th) * CK_BOB, by - Math.cos(th) * CK_BOB]], 6, CK.white, 1, 3 + Math.floor(tq * 12) % 3);
        ckLine(gB, Array.from({ length: 22 }, (_, k) => [bx + Math.cos(k / 20 * TAU - 2) * (CK_BOB + (k % 3) * 0.6), by + Math.sin(k / 20 * TAU - 2) * CK_BOB]), 8, CK.white, 1, 9 + Math.floor(tq * 12) % 3);
        for (let k = 0; k < 4; k++) { const o = -24 + k * 16, h = Math.sqrt(Math.max(0, CK_BOB * CK_BOB - o * o)) * 0.8; ckLine(gB, [[bx + o - h * 0.5, by + h * 0.7], [bx + o + h * 0.5, by - h * 0.7]], 5, CK.white, 0.9, k); }
        // speed smudge trailing the bob near the bottom of the swing
        const v = -CK_TH0 * CK_W * Math.sin(CK_W * (tq - CK_REL)) * Math.exp(-0.11 * (tq - CK_REL));
        if (Math.abs(v) > 0.8) for (let k = 1; k <= 3; k++) { const a = th - Math.sign(v) * k * 0.035; ckLine(gB, [[P[0] + Math.sin(a) * (CK_LEN + 44), P[1] + Math.cos(a) * (CK_LEN + 44)], [P[0] + Math.sin(a - Math.sign(v) * 0.05) * (CK_LEN + 44), P[1] + Math.cos(a - Math.sign(v) * 0.05) * (CK_LEN + 44)]], 4, CK.white, 0.5 / k, k + 20); }
      }
      // dry-chalk coverage
      [gA, gB].forEach(g => { g.globalCompositeOperation = 'destination-in'; g.drawImage(st.grainC, 0, 0); g.globalCompositeOperation = 'source-over'; });
      // eraser: a swath that leaves a ghost and a pale smear
      const eu = seg(t, CK_ER_T[0], CK_ER_T[1]);
      const drawA = () => {
        if (eu <= 0) { c.drawImage(st.A, 0, 0); return; }
        const em = ctxOf(st.EM);
        const [ex, ey, ei] = ckErasePos(eu);
        em.lineCap = 'round'; em.lineJoin = 'round';
        const path = () => { em.beginPath(); em.moveTo(CK_ERASE[0][0], CK_ERASE[0][1]); for (let i = 1; i < ei; i++) em.lineTo(CK_ERASE[i][0], CK_ERASE[i][1]); em.lineTo(ex, ey); };
        em.strokeStyle = 'rgba(0,0,0,0.55)'; em.lineWidth = 118; path(); em.stroke();
        em.strokeStyle = 'rgba(0,0,0,1)'; em.lineWidth = 86; path(); em.stroke();
        const k1 = ctxOf(st.T1); k1.drawImage(st.A, 0, 0); k1.globalCompositeOperation = 'destination-out'; k1.drawImage(st.EM, 0, 0);
        c.drawImage(st.T1, 0, 0);
        const k2 = ctxOf(st.T2); k2.drawImage(st.A, 0, 0); k2.globalCompositeOperation = 'destination-in'; k2.drawImage(st.EM, 0, 0);
        c.save(); c.globalAlpha = 0.13; c.filter = 'blur(2px)'; c.drawImage(st.T2, -10, 1); c.drawImage(st.T2, 8, -1); c.restore();
        const k3 = ctxOf(st.T2); k3.drawImage(st.smear, 0, 0); k3.globalCompositeOperation = 'destination-in'; k3.drawImage(st.EM, 0, 0);
        c.save(); c.globalAlpha = 0.12; c.drawImage(st.T2, 0, 0); c.restore();
      };
      drawA();
      c.drawImage(st.B, 0, 0);
      // powder halo around fresh chalk
      c.save(); c.globalAlpha = 0.22; c.filter = 'blur(5px)'; c.globalCompositeOperation = 'screen';
      if (eu <= 0) c.drawImage(st.A, 0, 0); else c.drawImage(st.T1, 0, 0);
      c.drawImage(st.B, 0, 0); c.restore();
      // chalk dust shed from the tip
      const tip = ckTip(t);
      c.fillStyle = 'rgba(236,236,226,0.7)';
      for (let k = 0; k < 40; k++) {
        const ts = Math.floor(t / 0.03) * 0.03 - k * 0.03; if (ts < 0) break;
        const tp = ckTip(ts); if (!tp.on) continue;
        const age = t - ts, hx = hash(ts * 91.7), hy = hash(ts * 37.3);
        const x = tp.p[0] + (hx - 0.5) * 30 * age + 6, y = tp.p[1] + 260 * age * age + 4 + hy * 6;
        const a = 1 - age / 1.2; if (a <= 0) continue;
        c.globalAlpha = a * 0.7; c.fillRect(x, y, 1.6 + hy * 2, 1.6 + hx * 2);
      }
      c.globalAlpha = 1;
      // the felt eraser, or the chalk
      if (t > CK_ER_T[0] - 0.1 && t < CK_ER_T[1] + 0.15) {
        const [ex, ey] = ckErasePos(clamp(seg(t, CK_ER_T[0] - 0.1, CK_ER_T[1] + 0.15) * 1.0));
        const [ex2] = ckErasePos(clamp(seg(t + 0.02, CK_ER_T[0] - 0.1, CK_ER_T[1] + 0.15)));
        ckEraser(c, ex, ey, 0.04 * Math.sign(ex2 - ex) - 0.05);
      }
      const hide = t > 4.95 && t < 5.5;
      if (!hide) {
        let [x, y] = tip.p;
        if (t >= 5.5 && t < 5.86) { const u = E.outC(seg(t, 5.5, 5.86)); x = lerp(1100, x, u); y = lerp(1250, y, u); }
        if (t > 4.7 && t <= 4.95) { const u = E.inC(seg(t, 4.7, 4.95)); x = lerp(x, 1250, u); y = lerp(y, 1300, u); }
        ckStick(c, x, y, tip.col, tip.lift, t);
      }
      grain(c, W, H, t, 0.05, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.9;
      // piano: Karplus-Strong body + sine fundamental with a soft hammer
      const pno = (t, m, g = 0.12, dur = 2.6) => {
        A.pluck(t, midi(m), { dur, g: g * 1.2, bright: 0.32, decay: 0.998, lp: 2600, rev: 0.4 });
        A.osc(t, { f: midi(m), dur: dur * 0.9, g: g * 0.55, a: 0.004, rev: 0.4 });
        A.osc(t, { f: midi(m) * 2, dur: dur * 0.4, g: g * 0.12, a: 0.004, rev: 0.3 });
      };
      const prog = [[0.1, [48, 55, 64, 71]], [2.6, [45, 52, 60, 67]], [5.0, [41, 48, 57, 64]], [7.0, [43, 50, 59, 62]], [8.3, [48, 55, 64, 67, 72]]];
      prog.forEach(([t, ch], i) => {
        pno(t, ch[0], 0.12, 3.2); pno(t + 0.02, ch[0] + 12, 0.06, 3);
        ch.slice(1).forEach((m, j) => pno(t + 0.35 + j * 0.28, m, 0.075, 2.4));
      });
      [[1.3, 76], [1.9, 74], [3.6, 72], [4.2, 71], [4.7, 79], [6.1, 76], [6.6, 77], [7.7, 74], [9.25, 79]].forEach(([t, m]) => pno(t, m, 0.06, 2.2));
      // chalk on slate: a gritty grain cloud per stroke
      CK_STROKES.forEach((s, i) => {
        const d = s.t1 - s.t0, n = Math.max(2, Math.round(d / 0.016));
        const base = s.layer === 'A' || s.w >= 9 ? 1 : 0.75;
        for (let k = 0; k < n; k++) {
          const tt = s.t0 + (k / n) * d, h = hash(i * 13.1 + k * 3.7);
          A.noise(tt, { type: 'bandpass', f: 2400 + h * 3800, q: 2.2, dur: 0.018 + h * 0.012, g: (0.035 + h * 0.05) * base, pan: (s.pts[0][0] / 1920 - 0.5) * 0.5 });
        }
        A.noise(s.t0, { type: 'bandpass', f: 1500, q: 1, dur: d, g: 0.014 * base, a: 0.01 });
      });
      // one squeak on the radical
      A.osc(1.86, { f: 2450, f2: 2650, glide: 0.06, dur: 0.08, g: 0.022, vib: [38, 70], a: 0.01 });
      // taps: punctuation and the pivot
      const tap = (t, g = 0.22) => { A.noise(t, { type: 'highpass', f: 1800, dur: 0.018, g }); A.osc(t, { f: 420, f2: 260, glide: 0.03, dur: 0.06, g: g * 0.6 }); };
      [2.82, 2.94, 3.46, 4.58, 9.27, 9.34].forEach(t => tap(t));
      // release, then a soft wooden tick at each turning point
      A.osc(CK_REL, { f: 880, dur: 0.6, g: 0.03, rev: 0.5 });
      for (let k = 1; k < 12; k++) { const t = CK_REL + k * PI / CK_W; if (t > 9.9) break; A.noise(t, { type: 'bandpass', f: 1200, q: 6, dur: 0.03, g: 0.05 * Math.exp(-0.11 * (t - CK_REL)), pan: k % 2 ? -0.3 : 0.3 }); }
      // felt eraser: a rub per pass
      for (let i = 1; i < CK_ERASE.length; i++) {
        const u0 = ckErasePath[i - 1] / ckErasePath[ckErasePath.length - 1], u1 = ckErasePath[i] / ckErasePath[ckErasePath.length - 1];
        const t0 = lerp(CK_ER_T[0], CK_ER_T[1], u0), t1 = lerp(CK_ER_T[0], CK_ER_T[1], u1);
        A.noise(t0, { type: 'bandpass', f: 700 + (i % 2) * 300, q: 0.7, dur: Math.max(0.06, t1 - t0 + 0.04), g: 0.16, swell: 0.4, pan: i % 2 ? 0.25 : -0.25 });
        A.noise(t0, { type: 'highpass', f: 4000, dur: Math.max(0.05, t1 - t0), g: 0.03, swell: 0.5 });
      }
      A.noise(CK_ER_T[1], { type: 'lowpass', f: 900, dur: 0.6, g: 0.03, rev: 0.4 });
    },
  });
  /* =====================================================================
     WATERCOLOUR — a meadow paints itself on cold-press paper: a wet drop
     blooms into sky, washes dry with dark edges and granulation, a grey
     glaze brings rain, the sky is lifted for a rainbow and a kite rises
     ===================================================================== */
  const WC = { paper: [247, 242, 229], X0: 70, Y0: 60, X1: 1850, Y1: 1020, sepia: [92, 66, 50] };
  const wcFar = x => 548 + 38 * Math.sin(x / 250 + 1) + 22 * Math.sin(x / 93 + 0.4) + 10 * vnoise(x / 40, 3);
  const wcMid = x => 662 + 50 * Math.sin(x / 340 + 2.4) + 16 * Math.sin(x / 130 + 1) - 46 * Math.exp(-Math.pow((x - 1290) / 240, 2));
  const wcMead = x => 772 + 28 * Math.sin(x / 420 + 0.5) + 9 * Math.sin(x / 150);
  const WC_HOUSE = {
    front: [[1180, 700], [1322, 700], [1322, 792], [1180, 792]], gable: [[1174, 703], [1250, 630], [1327, 703]],
    side: [[1322, 702], [1462, 714], [1462, 786], [1322, 792]], roof: [[1250, 627], [1402, 639], [1484, 718], [1328, 705]],
    chim: [[1372, 606], [1396, 606], [1396, 662], [1372, 656]], door: [[1237, 738], [1264, 738], [1264, 792], [1237, 792]],
    win1: [[1350, 728], [1384, 730], [1384, 758], [1350, 758]], win2: [[1410, 732], [1442, 734], [1442, 761], [1410, 761]],
  };
  const WC_CLOUDS = [[470, 230, 230, 62], [380, 262, 150, 44], [600, 258, 170, 48], [540, 200, 120, 50], [1330, 170, 170, 44], [1430, 190, 120, 38], [1250, 196, 110, 32], [1660, 330, 120, 30], [1730, 342, 80, 22]];
  const WC_FOL = [[1095, 560, 66], [1040, 602, 56], [1150, 600, 58], [1070, 650, 52], [1130, 652, 48], [1095, 612, 64], [1012, 640, 38], [1176, 640, 36], [1100, 516, 44], [1052, 548, 40], [1140, 540, 40]];
  const WC_T = { sky: [0.12, 2.0], far: [1.75, 2.6], mid: [2.3, 3.15], mead: [2.85, 3.85], grey: [5.3, 6.0, 6.85, 7.55], rb: [7.05, 7.95], kite: 7.0, title: [8.15, 8.95] };
  const wcPath = (g, pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
  function wcBlob(g, cx, cy, r, seed, amp = 0.18) {
    g.moveTo(cx + r * (1 + amp * vnoise(0, seed)), cy);
    for (let k = 1; k <= 48; k++) { const a = k / 48 * TAU, m = 1 + amp * (vnoise(a * 2.2, seed) * 0.6 + vnoise(a * 7, seed + 1) * 0.4); g.lineTo(cx + Math.cos(a) * r * m, cy + Math.sin(a) * r * m); }
    g.closePath();
  }

  // Build one wash: a dry layer with pigment physics baked in, a soft wet layer, and a reveal-time map.
  function wcWash(F, spec) {
    const [x0, y0, x1, y1] = spec.box, w = x1 - x0, h = y1 - y0;
    const mk = offscreen(w, h), mg = mk.getContext('2d');
    mg.translate(-x0, -y0); mg.fillStyle = '#fff';
    if (spec.soft) mg.filter = `blur(${spec.soft}px)`;
    spec.shape(mg);
    mg.filter = 'none';
    if (spec.cut) { mg.globalCompositeOperation = 'destination-out'; spec.cut(mg); mg.globalCompositeOperation = 'source-over'; }
    mg.globalCompositeOperation = 'destination-in'; mg.fillStyle = '#fff'; mg.fillRect(WC.X0, WC.Y0, WC.X1 - WC.X0, WC.Y1 - WC.Y0);
    const bl = offscreen(w, h), bg = bl.getContext('2d');
    bg.filter = `blur(${spec.eb || 7}px)`; bg.drawImage(mk, 0, 0);
    const M = mg.getImageData(0, 0, w, h).data, B = bg.getImageData(0, 0, w, h).data;
    const dry = offscreen(w, h), dg = dry.getContext('2d'), out = dg.createImageData(w, h), O = out.data;
    const a0 = spec.a, ek = spec.edge ?? 0.35, gr = spec.gran ?? 0.2, mo = spec.mott ?? 0.45, ox = spec.ox || 0, oy = spec.oy || 0;
    const blooms = spec.blooms || [];
    for (let y = 0; y < h; y++) {
      const gy = y + y0;
      for (let x = 0; x < w; x++) {
        const j = (y * w + x) * 4, m = M[j + 3] / 255;
        if (m < 0.004) continue;
        const gx = x + x0, i = gy * 1920 + gx, k = ((gy + oy) % 1080) * 1920 + ((gx + ox) % 1920);
        const b = B[j + 3] / 255;
        let a = (spec.aF ? spec.aF(gx, gy) : a0) * (1 - mo + mo * 2 * F.MOT[k]);
        if (spec.lift) a *= spec.lift(gx, gy);
        let d = a * m + ek * Math.max(0, m - b) * 2.2 * a0 / 0.5 + gr * m * ((0.5 - F.H[i]) * 0.7 + (F.FN[k] - 0.5) * 1.1) * a0 / 0.5;
        for (let q = 0; q < blooms.length; q++) {
          const [bx, by, br, bs] = blooms[q], dx = gx - bx, dy = gy - by, dd = dx * dx + dy * dy;
          if (dd > br * br * 1.8) continue;
          const ang = Math.atan2(dy, dx), rr = br * (1 + 0.22 * vnoise(ang * 5 + bs, bs) + 0.1 * vnoise(ang * 19, bs + 3)), dist = Math.sqrt(dd);
          if (dist < rr) d = d * (0.5 + 0.3 * dist / rr) + (dist > rr - 7 ? 0.22 * a0 : 0);
        }
        d = d < 0 ? 0 : d > 1 ? 1 : d;
        const col = spec.col(gx, gy, F.FN[k], F.MOT[k]);
        O[j] = col[0]; O[j + 1] = col[1]; O[j + 2] = col[2]; O[j + 3] = d * 255;
      }
    }
    dg.putImageData(out, 0, 0);
    // wet layer: half resolution, soft, no edge darkening yet
    const w2 = Math.ceil(w / 2), h2 = Math.ceil(h / 2);
    const wet = offscreen(w2, h2), wg = wet.getContext('2d');
    wg.filter = 'blur(3px)'; wg.drawImage(dry, 0, 0, w2, h2);
    // reveal-time map at half resolution
    const R = new Float32Array(w2 * h2);
    for (let y = 0; y < h2; y++) for (let x = 0; x < w2; x++) { const gx = Math.min(1919, x0 + x * 2), gy = Math.min(1079, y0 + y * 2); R[y * w2 + x] = spec.reveal(gx, gy, F.FN[gy * 1920 + gx], F.MOT[gy * 1920 + gx]); }
    return { x0, y0, w, h, w2, h2, dry, wet, R, t: spec.t, soft: spec.rs || 0.06, dryLen: spec.dryLen ?? 0.35, blend: spec.blend || 'multiply', pf: spec.pf };
  }
  // Composite a wash at time t: dry where dried, wet (darker, softer) at the advancing front.
  function wcDraw(c, st, Wa, t) {
    let p, lifting = false;
    if (Wa.pf) { const r = Wa.pf(t); p = r[0]; lifting = r[1]; }
    else p = (t - Wa.t[0]) / (Wa.t[1] - Wa.t[0]);
    if (p <= 0) return;
    if (p >= 1 + Wa.soft + Wa.dryLen + 0.02 || (lifting && p >= 1 + Wa.soft)) {
      c.save(); c.globalCompositeOperation = Wa.blend; c.drawImage(Wa.dry, Wa.x0, Wa.y0); c.restore(); return;
    }
    const { w2, h2, R, soft, dryLen } = Wa;
    const dm = st.mD, wm = st.mW, dgx = dm.getContext('2d'), wgx = wm.getContext('2d');
    const ID = st.idD && st.idD.width === w2 && st.idD.height === h2 ? st.idD : (st.idD = dgx.createImageData(w2, h2));
    const IW = st.idW && st.idW.width === w2 && st.idW.height === h2 ? st.idW : (st.idW = wgx.createImageData(w2, h2));
    const DD = ID.data, WD = IW.data, pp = p * (1 + soft);
    let anyWet = false;
    for (let i = 0, n = w2 * h2; i < n; i++) {
      const r = R[i], rev = (pp - r) / soft, rv = rev <= 0 ? 0 : rev >= 1 ? 1 : rev;
      let wt = 0;
      if (rv > 0 && !lifting) { const age = (p - r) / dryLen; wt = age >= 1 ? 0 : age <= 0 ? 1 : 1 - age; if (wt > 0) anyWet = true; }
      DD[i * 4 + 3] = rv * (1 - wt) * 255; WD[i * 4 + 3] = rv * wt * 255;
    }
    dgx.putImageData(ID, 0, 0); if (anyWet) wgx.putImageData(IW, 0, 0);
    const sc = st.sc, sg = sc.getContext('2d');
    const put = (src, mask, alpha) => {
      sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = 'copy'; sg.globalAlpha = 1;
      sg.drawImage(src, 0, 0, src.width, src.height, 0, 0, Wa.w, Wa.h);
      sg.globalCompositeOperation = 'destination-in'; sg.drawImage(mask, 0, 0, w2, h2, 0, 0, Wa.w, Wa.h);
      c.save(); c.globalCompositeOperation = Wa.blend; c.globalAlpha = alpha; c.drawImage(sc, 0, 0, Wa.w, Wa.h, Wa.x0, Wa.y0, Wa.w, Wa.h); c.restore();
    };
    put(Wa.dry, dm, 1);
    if (anyWet) { put(Wa.wet, wm, 1); if (Wa.blend === 'multiply') put(Wa.wet, wm, 0.35); }
  }
  // A brush line in sepia (or any colour), drawn progressively, multiplied onto the paper.
  function wcLine(c, pts, p, col, w0, alpha, seed) {
    if (p <= 0) return;
    const n = Math.max(2, Math.ceil((pts.length - 1) * p) + 1);
    c.save(); c.globalCompositeOperation = 'multiply'; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 1; i < n && i < pts.length; i++) {
      const u = i / (pts.length - 1), pr = 0.55 + 0.6 * Math.sin(PI * Math.min(1, u * 1.2)) * (0.8 + 0.4 * vnoise(i * 0.4, seed));
      c.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`; c.lineWidth = w0 * pr;
      c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.stroke();
    }
    c.restore();
  }
  const wcSeg = (a, b, n = 12) => Array.from({ length: n + 1 }, (_, i) => [lerp(a[0], b[0], i / n) + vnoise(i * 0.7, a[0] * 0.01) * 1.2, lerp(a[1], b[1], i / n) + vnoise(i * 0.7 + 9, a[1] * 0.01) * 1.2]);
  const WC_LINES = (() => {
    const L = [], add = (pts, t0, t1, o = {}) => L.push({ pts, t0, t1, col: o.col || WC.sepia, w: o.w || 2.4, a: o.a ?? 0.8, seed: L.length * 3.1 });
    const Hs = WC_HOUSE, T = 4.75;
    [[Hs.gable[0], Hs.gable[1]], [Hs.gable[1], Hs.gable[2]], [Hs.front[0], Hs.front[3]], [Hs.front[3], Hs.side[3]], [Hs.side[3], Hs.side[2]], [Hs.side[2], Hs.side[1]], [Hs.front[1], Hs.front[2]],
      [Hs.roof[0], Hs.roof[1]], [Hs.roof[1], Hs.roof[2]], [Hs.roof[2], Hs.roof[3]], [Hs.chim[0], Hs.chim[3]], [Hs.chim[1], Hs.chim[2]], [Hs.chim[0], Hs.chim[1]]].forEach(([a, b], i) => add(wcSeg(a, b), T + i * 0.022, T + i * 0.022 + 0.05, { w: 2.2 }));
    [Hs.door, Hs.win1, Hs.win2].forEach((q, i) => add(wcSeg(q[0], q[1]).concat(wcSeg(q[1], q[2])).concat(wcSeg(q[2], q[3])).concat(wcSeg(q[3], q[0])), T + 0.3 + i * 0.04, T + 0.34 + i * 0.04, { w: 1.6 }));
    add(wcSeg([1367, 729], [1367, 758], 4), T + 0.42, T + 0.44, { w: 1.4 }); add(wcSeg([1426, 733], [1426, 761], 4), T + 0.44, T + 0.46, { w: 1.4 });
    // fence
    for (let k = 0; k < 8; k++) { const x = 250 + k * 86, y = 858 - k * 6; add(wcSeg([x, y], [x + 2, y - 54], 6), 4.95 + k * 0.02, 4.98 + k * 0.02, { w: 3.2 }); }
    add(wcSeg([240, 830], [860, 790], 24), 5.12, 5.2, { w: 2.2 }); add(wcSeg([240, 848], [860, 808], 24), 5.18, 5.26, { w: 2 });
    // tree limbs
    add([[1104, 700], [1100, 650], [1080, 610], [1060, 585]], 4.5, 4.56, { w: 3 }); add([[1103, 660], [1125, 625], [1150, 600]], 4.55, 4.6, { w: 2.4 });
    // grass tufts along the foreground
    const r = rng(77);
    for (let k = 0; k < 34; k++) {
      const x = 110 + r() * 1700, y = 900 + r() * 110; if (x > 960 && x < 1120 && y > 930) continue;
      for (let b = 0; b < 3; b++) { const lx = x + (b - 1) * 6, h = 18 + r() * 22, lean = (r() - 0.5) * 16, t0 = 5.0 + r() * 0.3; add([[lx, y], [lx + lean * 0.4, y - h * 0.5], [lx + lean, y - h]], t0, t0 + 0.06, { col: [60, 100, 55], w: 2.6, a: 0.7 }); }
    }
    return L;
  })();

  MG.film({
    id: 'watercolor', dur: 10, poster: 9.5,
    fonts: [['400 120px "Caveat Brush"', 'Watercolour'], ['400 60px "Ma Shan Zheng"', '水彩动画']],
    meta: {
      family: 'C', name: 'Watercolour Animation 水彩动画', sub: 'Painted Washes in Motion', era: '1940s —',
      origin: 'Transparent washes on textured paper, where pigment blooms, granulates and dries with dark edges, were first carried into animation as painted backgrounds — Disney’s Snow White (1937) and Bambi (1942), then Kazuo Oga’s Ghibli landscapes. Isao Takahata’s The Tale of the Princess Kaguya (2013) went further and animated the wash itself.',
      works: 'Bambi (Disney, 1942; backgrounds by Tyrus Wong) · My Neighbor Totoro (Studio Ghibli, 1988; art director Kazuo Oga) · The Snowman (Dianne Jackson, 1982) · The Tale of the Princess Kaguya (Isao Takahata, 2013) · Ernest & Celestine (2012)',
      tech: ['Wet-on-wet blooms', 'Edge darkening & backruns', 'Pigment granulation', 'Glazing & lifting'],
      accent: '#5a7fc0',
      motionDNA: 'Nothing cuts: washes spread at the wet front and dry in place, glazes change the light, and only small things — rain, a kite, birds — move across a scene that is still being painted.',
      visualDNA: 'Transparent glazes on rough cold-press paper: soft wet-in-wet skies, darker dried edges, granulating blues, cauliflower backruns and white paper left for clouds and light.',
      transitions: 'Wet bloom, glaze over, lift-out, wash write-on',
      implementation: ['Hand-painted cels + TVPaint', 'Photoshop / After Effects', 'Canvas 2D (per-pixel washes)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const r = rng(2013), W = 1920, H = 1080, N = 512;
      const lat = new Float32Array(N * N); for (let i = 0; i < lat.length; i++) lat[i] = r();
      const vn = (x, y) => {
        const xf = Math.floor(x), yf = Math.floor(y), fx = x - xf, fy = y - yf, xi = xf & 511, yi = yf & 511, xj = (xi + 1) & 511, yj = (yi + 1) & 511;
        const a = lat[(yi << 9) | xi], b = lat[(yi << 9) | xj], c2 = lat[(yj << 9) | xi], d = lat[(yj << 9) | xj];
        const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
        return a + (b - a) * u + (c2 - a) * v + (a - b - c2 + d) * u * v;
      };
      const Hh = new Float32Array(W * H), MOT = new Float32Array(W * H), FN = new Float32Array(W * H);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        Hh[i] = 0.42 * vn((x * 0.8 + y * 0.6) / 6.5, (y * 0.8 - x * 0.6) / 6.5) + 0.36 * vn((x * 0.34 - y * 0.94) / 15 + 77, (y * 0.34 + x * 0.94) / 15 + 31) + 0.22 * vn(x / 46 + 11, y / 46 + 97);
        MOT[i] = 0.6 * vn(x / 140 + 5, y / 100 + 9) + 0.4 * vn(x / 48 + 40, y / 40 + 20);
        FN[i] = 0.65 * vn(x / 2.3 + 300, y / 2.3 + 500) + 0.35 * r();
      }
      const F = { H: Hh, MOT, FN };
      // cold-press paper under a low raking light
      const paper = offscreen(W, H), pg = paper.getContext('2d'), pd = pg.createImageData(W, H), P = pd.data;
      for (let y = 1; y < H; y++) for (let x = 1; x < W; x++) {
        const i = y * W + x, sh = (Hh[i] - Hh[i - W - 1]) * 0.68 + (Hh[i] - 0.5) * 0.06, wv = (MOT[i] - 0.5) * 0.02;
        const k = 1 + sh + wv;
        P[i * 4] = WC.paper[0] * k; P[i * 4 + 1] = WC.paper[1] * k; P[i * 4 + 2] = WC.paper[2] * (k - 0.004); P[i * 4 + 3] = 255;
      }
      pg.putImageData(pd, 0, 0);
      for (let k = 0; k < 300; k++) { pg.strokeStyle = 'rgba(160,140,110,0.06)'; pg.lineWidth = 0.8; const x = r() * W, y = r() * H, a = r() * TAU; pg.beginPath(); pg.moveTo(x, y); pg.quadraticCurveTo(x + 8, y + 5, x + Math.cos(a) * 26, y + Math.sin(a) * 26); pg.stroke(); }
      // tape line: the painted area sits inside a crisp untouched margin
      // cloud field (white paper kept for clouds)
      const cm = offscreen(W, H), cg = cm.getContext('2d');
      cg.filter = 'blur(14px)'; cg.fillStyle = '#fff';
      WC_CLOUDS.forEach(([x, y, rx, ry], i) => {
        cg.beginPath(); cg.ellipse(x, y + ry * 0.15, rx, ry * 0.5, 0, 0, TAU); cg.fill();
        const n = 6;
        for (let k = 0; k < n; k++) { const u = k / (n - 1), sn = Math.sin(PI * u); cg.beginPath(); wcBlob(cg, x + (u - 0.5) * rx * 1.5, y - ry * 0.15 - sn * ry * 0.45, ry * (0.42 + 0.5 * sn) * (0.85 + 0.3 * hash(i * 7 + k)), i * 9 + k, 0.16); cg.fill(); }
      });
      const CD = cg.getImageData(0, 0, W, H).data;
      const cloud = (x, y) => CD[(y * W + x) * 4 + 3] / 255;
      const house = g => { [WC_HOUSE.front, WC_HOUSE.gable, WC_HOUSE.side, WC_HOUSE.roof, WC_HOUSE.chim].forEach(q => { wcPath(g, q); g.fill(); }); };
      const ridgePoly = (g, fn, yb) => { g.beginPath(); for (let x = WC.X0 - 10; x <= WC.X1 + 10; x += 6) g.lineTo(x, fn(x)); for (let x = WC.X1 + 10; x >= WC.X0 - 10; x -= 6) g.lineTo(x, typeof yb === 'function' ? yb(x) : yb); g.closePath(); g.fill(); };
      const under = fn => x => fn(x) + 18 + 16 * vnoise(x / 61, 8) + 6 * vnoise(x / 17, 9);
      const sweep = (dx, dy, x0, y0, len, k = 0.12) => (x, y, fn, mo) => clamp(((x - x0) * dx + (y - y0) * dy) / len) * (1 - k) + k * (fn * 0.4 + mo * 0.6);
      const radial = (cx, cy, R, k = 0.14) => (x, y, fn, mo) => { const a = Math.atan2(y - cy, x - cx); const d = Math.hypot(x - cx, y - cy); return clamp(d / R) * (1 - k) + k * clamp(d / 160) * (0.6 * mo + 0.25 * (0.5 + 0.5 * vnoise(a * 3, 4)) + 0.15 * fn); };
      const mix = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
      const box = [WC.X0, WC.Y0, WC.X1, WC.Y1];
      const washes = {};
      washes.sky = wcWash(F, {
        box: [WC.X0, WC.Y0, WC.X1, 730], t: WC_T.sky, a: 0.58, edge: 0.15, gran: 0.12, mott: 0.5, soft: 0, eb: 9, rs: 0.1, dryLen: 0.45,
        shape: g => ridgePoly(g, () => WC.Y0 - 10, under(wcFar)),
        aF: (x, y) => lerp(0.62, 0.36, clamp((y - 80) / 560)),
        lift: (x, y) => 1 - 0.95 * cloud(x, y),
        col: (x, y, fn, mo) => { const u = clamp((y - 70) / 600); const c0 = u < 0.55 ? mix([70, 118, 192], [130, 178, 222], u / 0.55) : mix([130, 178, 222], [240, 200, 150], (u - 0.55) / 0.45); return mix(c0, [96, 104, 190], clamp((mo - 0.55) * 1.6) * (1 - u)); },
        blooms: [[820, 380, 60, 3], [1560, 250, 70, 7], [260, 430, 50, 11]],
        reveal: radial(960, 300, 1050, 0.2),
      });
      washes.shade = wcWash(F, {
        box: [WC.X0, WC.Y0, WC.X1, 500], t: [1.9, 2.5], a: 0.3, edge: 0.18, gran: 0.15, soft: 8, eb: 8, rs: 0.15,
        shape: g => { g.drawImage(cm, 0, 0); g.globalCompositeOperation = 'destination-out'; g.drawImage(cm, 0, -30); g.globalCompositeOperation = 'source-over'; },
        col: () => [150, 138, 182], reveal: sweep(1, 0, WC.X0, 0, 1780, 0.3),
      });
      washes.far = wcWash(F, {
        box: [WC.X0, 470, WC.X1, 780], t: WC_T.far, a: 0.46, edge: 0.4, gran: 0.42, ox: 300, eb: 6,
        shape: g => ridgePoly(g, wcFar, under(wcMid)),
        col: (x, y, fn, mo) => mix([104, 114, 182], [150, 118, 170], clamp(mo * 1.6 - 0.5)),
        reveal: sweep(1, 0.2, WC.X0, 470, 1900),
      });
      washes.mid = wcWash(F, {
        box: [WC.X0, 540, WC.X1, 850], t: WC_T.mid, a: 0.56, edge: 0.38, gran: 0.25, ox: 700, oy: 300,
        shape: g => ridgePoly(g, wcMid, under(wcMead)), cut: house,
        aF: (x, y) => lerp(0.62, 0.48, clamp((y - wcMid(x)) / 160)),
        col: (x, y, fn, mo) => mix([92, 142, 74], [160, 172, 70], clamp(mo * 1.8 - 0.55)),
        blooms: [[560, 700, 46, 21]],
        reveal: sweep(1, 0, WC.X0, 0, 1780),
      });
      washes.mead = wcWash(F, {
        box: [WC.X0, 720, WC.X1, WC.Y1], t: WC_T.mead, a: 0.5, edge: 0.3, gran: 0.22, ox: 1100, oy: 600,
        shape: g => ridgePoly(g, wcMead, WC.Y1 + 10), cut: house,
        aF: (x, y) => lerp(0.42, 0.62, clamp((y - 770) / 250)),
        col: (x, y, fn, mo) => mix(mix([178, 202, 86], [104, 152, 66], clamp((y - 770) / 250)), [196, 170, 80], clamp(mo * 2 - 1.1)),
        blooms: [[420, 940, 64, 31], [1560, 900, 54, 37]],
        reveal: sweep(0.85, 0.53, WC.X0, 740, 1700, 0.18),
      });
      washes.path = wcWash(F, {
        box: [940, 780, 1300, WC.Y1], t: [3.9, 4.25], a: 0.4, edge: 0.4, gran: 0.35,
        shape: g => { const cl = [[1250, 792], [1236, 840], [1176, 900], [1086, 960], [1012, 1030]]; const L2 = [], R2 = []; cl.forEach(([x, y], i) => { const hw = 13 + i * 15; L2.push([x - hw, y]); R2.push([x + hw, y]); }); wcPath(g, L2.concat(R2.reverse())); g.fill(); },
        col: () => [214, 166, 108], reveal: sweep(0, 1, 0, 780, 240),
      });
      washes.trunk = wcWash(F, {
        box: [1080, 640, 1130, 800], t: [3.55, 3.7], a: 0.7, edge: 0.3, gran: 0.3,
        shape: g => { wcPath(g, [[1094, 796], [1114, 796], [1110, 690], [1120, 650], [1102, 646], [1098, 690]]); g.fill(); },
        col: () => [110, 80, 62], reveal: sweep(0, -1, 0, 800, 160),
      });
      washes.tree = wcWash(F, {
        box: [960, 450, 1240, 720], t: [3.65, 4.4], a: 0.72, edge: 0.42, gran: 0.25, ox: 400, eb: 5,
        shape: g => WC_FOL.forEach(([x, y, rr], i) => { g.beginPath(); wcBlob(g, x, y, rr, i * 5 + 1, 0.22); g.fill(); }), cut: house,
        col: (x, y, fn, mo) => mix([52, 108, 74], [104, 140, 58], clamp((560 - y) / 120 + (mo - 0.5))),
        blooms: [[1080, 560, 26, 41]],
        reveal: radial(1095, 590, 150, 0.25),
      });
      washes.tree2 = wcWash(F, {
        box: [960, 520, 1240, 720], t: [4.3, 4.55], a: 0.5, edge: 0.5, gran: 0.2, soft: 2,
        shape: g => WC_FOL.slice(2, 6).forEach(([x, y, rr], i) => { g.beginPath(); wcBlob(g, x + 8, y + 14, rr * 0.7, i * 7 + 3, 0.25); g.fill(); }), cut: house,
        col: () => [40, 76, 74], reveal: sweep(-1, -1, 1240, 720, 400),
      });
      washes.fore = wcWash(F, {
        box: [WC.X0, 880, WC.X1, WC.Y1], t: [4.85, 5.3], a: 0.36, edge: 0.4, gran: 0.25, ox: 1500, oy: 100, eb: 5,
        shape: g => { g.beginPath(); g.moveTo(WC.X0 - 10, WC.Y1 + 10); for (let x = WC.X0 - 10; x <= WC.X1 + 10; x += 9) { const b = 948 + 22 * Math.sin(x / 300 + 1) + 10 * vnoise(x / 50, 5); g.lineTo(x, b - (Math.floor(x / 9) % 2 ? 18 * hash(x) : 0)); } g.lineTo(WC.X1 + 10, WC.Y1 + 10); g.closePath(); g.fill(); },
        cut: g => { const cl = [[1250, 792], [1236, 840], [1176, 900], [1086, 960], [1012, 1030]]; const L2 = [], R2 = []; cl.forEach(([x, y], i) => { const hw = 13 + i * 15; L2.push([x - hw, y]); R2.push([x + hw, y]); }); wcPath(g, L2.concat(R2.reverse())); g.fill(); },
        col: (x, y, fn, mo) => mix([70, 122, 62], [120, 140, 56], clamp(mo * 2 - 0.8)),
        reveal: sweep(1, 0, WC.X0, 0, 1780, 0.2),
      });
      const part = (q, t, a, col, extra = {}) => wcWash(F, { box: [1160, 590, 1500, 800], t, a, edge: 0.45, gran: 0.3, eb: 4, shape: g => q.forEach(pp => { wcPath(g, pp); g.fill(); }), col: () => col, reveal: sweep(1, 0.4, 1160, 590, 420), ...extra });
      washes.wall = part([WC_HOUSE.front, WC_HOUSE.gable], [4.1, 4.32], 0.36, [236, 204, 150]);
      washes.side = part([WC_HOUSE.side], [4.3, 4.48], 0.46, [168, 150, 186]);
      washes.roof = part([WC_HOUSE.roof], [4.45, 4.68], 0.64, [196, 86, 64], { gran: 0.45 });
      washes.chim = part([WC_HOUSE.chim], [4.6, 4.7], 0.6, [170, 96, 76]);
      washes.door = part([WC_HOUSE.door, WC_HOUSE.win1, WC_HOUSE.win2], [4.68, 4.82], 0.66, [72, 86, 142]);
      washes.glow = part([WC_HOUSE.win1, WC_HOUSE.win2], [5.6, 5.9], 0.75, [250, 196, 80], { edge: 0.2 });
      // the overcast glaze: on and then lifted again
      washes.grey = wcWash(F, {
        box, t: [0, 1], a: 0.4, edge: 0.08, gran: 0.22, soft: 0, eb: 14, rs: 0.18, dryLen: 0.5, ox: 900, oy: 200,
        shape: g => g.fillRect(WC.X0, WC.Y0, WC.X1 - WC.X0, WC.Y1 - WC.Y0),
        aF: (x, y) => lerp(0.46, 0.24, clamp((y - 60) / 900)),
        col: (x, y, fn, mo) => mix([88, 100, 132], [120, 110, 140], mo),
        reveal: (x, y, fn, mo) => clamp((y - 60) / 960) * 0.75 + 0.25 * mo,
        pf: t => { const [a, b, c2, d] = WC_T.grey; if (t < c2) return [(t - a) / (b - a), false]; return [lerp(1.2, -0.05, E.ioS(seg(t, c2, d))), true]; },
      });
      washes.warm = wcWash(F, {
        box, t: [7.3, 8.2], a: 0.3, edge: 0.05, gran: 0.1, eb: 20, rs: 0.2,
        shape: g => g.fillRect(WC.X0, WC.Y0, WC.X1 - WC.X0, WC.Y1 - WC.Y0),
        aF: (x, y) => 0.3 * clamp(1 - Math.hypot(x - 1500, (y - 560) * 1.4) / 900),
        col: () => [248, 190, 112], reveal: radial(1500, 560, 900, 0.2),
      });
      // rainbow: lift the sky with a damp brush, then charge the band with colour
      const RBC = [1450, 1250], RB0 = 830, RB1 = 925;
      const rbShape = g => { g.save(); g.beginPath(); g.moveTo(WC.X0, WC.Y0); for (let x = WC.X0; x <= WC.X1; x += 6) g.lineTo(x, wcFar(x) - 4); g.lineTo(WC.X1, WC.Y0); g.closePath(); g.clip(); g.lineWidth = RB1 - RB0; g.strokeStyle = '#fff'; g.beginPath(); g.arc(RBC[0], RBC[1], (RB0 + RB1) / 2, PI, TAU); g.stroke(); g.restore(); };
      const rbReveal = (x, y, fn, mo) => clamp((Math.atan2(y - RBC[1], x - RBC[0]) + PI * 0.92) / (PI * 0.62)) * 0.9 + 0.1 * mo;
      const fol = g => WC_FOL.forEach(([x, y, rr], i) => { g.beginPath(); wcBlob(g, x, y, rr + 4, i * 5 + 1, 0.22); g.fill(); });
      washes.rbl = wcWash(F, { box: [600, 300, WC.X1, 640], t: WC_T.rb, a: 0.62, edge: 0, gran: 0, mott: 0.2, soft: 6, rs: 0.12, blend: 'source-over', shape: rbShape, cut: fol, col: () => [250, 246, 236], reveal: rbReveal });
      const bands = [[226, 92, 84], [240, 150, 70], [246, 214, 90], [120, 186, 106], [92, 140, 210], [140, 104, 186]];
      washes.rb = wcWash(F, {
        box: [600, 300, WC.X1, 640], t: [WC_T.rb[0] + 0.12, WC_T.rb[1] + 0.12], a: 0.55, edge: 0.12, gran: 0.15, soft: 5, rs: 0.12, shape: rbShape, cut: fol,
        col: (x, y) => { const d = (RB1 - Math.hypot(x - RBC[0], y - RBC[1])) / (RB1 - RB0) * 5.4; const i = clamp(Math.floor(d), 0, 5), f = clamp(d - i); return mix(bands[i], bands[Math.min(5, i + 1)], E.ioS(f)); },
        reveal: rbReveal,
      });
      // hand-lettered title, painted
      const TT = offscreen(10, 10).getContext('2d');
      washes.title = wcWash(F, {
        box: [110, 150, 1000, 420], t: WC_T.title, a: 0.74, edge: 0.6, gran: 0.35, eb: 4, rs: 0.08, dryLen: 0.5, ox: 50,
        shape: g => { g.font = '400 176px "Caveat Brush", cursive'; g.textBaseline = 'alphabetic'; g.fillText('Watercolour', 150, 332); },
        col: (x, y, fn, mo) => mix([52, 70, 168], [168, 66, 120], clamp((x - 200) / 700 + (mo - 0.5) * 0.5)),
        reveal: (x, y, fn, mo) => clamp((x - 140) / 840) * 0.88 + 0.12 * mo,
      });
      // kite sprite: two washes on a diamond
      const kite = offscreen(200, 240), kg = kite.getContext('2d');
      const kq = (pts, col, t0) => wcWash(F, { box: [300, 300, 500, 540], t: [0, 1], a: 0.7, edge: 0.5, gran: 0.3, eb: 4, shape: g => { wcPath(g, pts); g.fill(); }, col: () => col, reveal: () => 0 });
      const KC = [400, 400], kd = [[400, 316], [470, 392], [400, 530], [330, 392]];
      [[kq([kd[0], kd[1], KC], [214, 62, 58]), 0], [kq([kd[1], kd[2], KC], [246, 190, 70]), 0], [kq([kd[2], kd[3], KC], [214, 62, 58]), 0], [kq([kd[3], kd[0], KC], [246, 190, 70]), 0]].forEach(([wa]) => { kg.globalCompositeOperation = 'multiply'; kg.drawImage(wa.dry, 0, 0); });
      const kc = offscreen(200, 240), kcg = kc.getContext('2d'); kcg.drawImage(kite, 0, 0);
      // rain marks that run and stay
      const drips = Array.from({ length: 18 }, (_, k) => {
        let x = 120 + r() * 1700, y = 90 + r() * 420;
        if (x < 980 && y < 440) x += 900;
        return { x: Math.min(1820, x), y, t0: 5.75 + r() * 0.9, L: 70 + r() * 210, w: 4 + r() * 4, wob: r() * 10 };
      });
      return { paper, washes, drips, kite: kc, sc: offscreen(1920, 1080), mD: offscreen(960, 540), mW: offscreen(960, 540) };
    },
    draw(c, t, W, H, st) {
      const s = 1 + 0.035 * E.ioS(t / 10);
      c.save(); c.translate(960, 560); c.scale(s, s); c.translate(-960, -560);
      c.drawImage(st.paper, 0, 0);
      const Wa = st.washes;
      ['sky', 'shade', 'far', 'mid', 'mead', 'path', 'trunk', 'tree', 'tree2', 'wall', 'side', 'roof', 'chim', 'door', 'fore'].forEach(k => wcDraw(c, st, Wa[k], t));
      WC_LINES.forEach(l => wcLine(c, l.pts, clamp((t - l.t0) / (l.t1 - l.t0)), l.col, l.w, l.a, l.seed));
      // flowers: dabs of cadmium and rose
      if (t > 5.05) {
        const r = rng(91); c.save(); c.globalCompositeOperation = 'multiply';
        for (let k = 0; k < 60; k++) {
          const x = 100 + r() * 1720, y = 860 + r() * 150, at = 5.05 + r() * 0.35, cl = [[226, 80, 90], [246, 196, 60], [180, 120, 200]][k % 3];
          if (x > 940 && x < 1140 && y > 930) continue;
          const p = seg(t, at, at + 0.08); if (p <= 0) continue;
          c.fillStyle = `rgba(${cl[0]},${cl[1]},${cl[2]},${0.7 * p})`; c.beginPath(); c.ellipse(x, y, 3.5 + r() * 3, 2.5 + r() * 2, r() * 3, 0, TAU); c.fill();
        }
        c.restore();
      }
      // a child on the meadow, the kite's flyer
      if (t > 4.85) {
        const p = seg(t, 4.85, 5.1), x = 690, y = 912;
        c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = p; c.filter = 'blur(0.5px)';
        c.fillStyle = 'rgba(200,64,64,0.85)'; c.beginPath(); c.moveTo(x - 4, y - 40); c.lineTo(x + 6, y - 40); c.lineTo(x + 13, y - 12); c.lineTo(x - 11, y - 12); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(110,80,62,0.85)'; c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x - 4, y - 12); c.lineTo(x - 5, y); c.moveTo(x + 4, y - 12); c.lineTo(x + 6, y); c.stroke();
        const arm = t > WC_T.kite ? 1 : 0;
        c.beginPath(); c.moveTo(x + 4, y - 36); c.lineTo(x + 14, y - 46 - arm * 6); c.stroke();
        c.fillStyle = 'rgba(240,196,160,0.9)'; c.beginPath(); c.arc(x + 1, y - 47, 7, 0, TAU); c.fill();
        c.fillStyle = 'rgba(80,56,44,0.85)'; c.beginPath(); c.arc(x - 1, y - 50, 6.5, PI * 0.9, PI * 2.1); c.fill();
        c.restore();
      }
      // the light changes: glow in the windows, then the grey glaze rolls in
      wcDraw(c, st, Wa.glow, t);
      wcDraw(c, st, Wa.grey, t);
      // rain: fast diagonal streaks while the glaze is wet, and runs that stay on the paper
      const rainA = seg(t, 5.55, 5.9) * (1 - seg(t, 6.75, 7.15));
      if (rainA > 0) {
        c.save(); c.beginPath(); c.rect(WC.X0, WC.Y0, WC.X1 - WC.X0, WC.Y1 - WC.Y0); c.clip(); c.globalCompositeOperation = 'multiply'; c.lineCap = 'round';
        for (let k = 0; k < 150; k++) {
          const sp = 1500 + hash(k) * 700, ph = hash(k * 3.7), y = ((t * sp + ph * 1100) % 1100) - 40, x = (hash(k * 7.1) * 2100 + y * 0.18) % 1900;
          const l = 40 + hash(k * 2.3) * 70;
          c.strokeStyle = `rgba(86,98,134,${0.5 * rainA})`; c.lineWidth = 1.6 + hash(k * 5) * 2;
          c.beginPath(); c.moveTo(x, y); c.lineTo(x + l * 0.18, y + l); c.stroke();
        }
        c.restore();
      }
      c.save(); c.globalCompositeOperation = 'multiply';
      st.drips.forEach(d => {
        const p = E.outQ(seg(t, d.t0, d.t0 + 0.9)); if (p <= 0) return;
        const fade = 1 - 0.55 * seg(t, 7.0, 7.8), L = d.L * p;
        c.lineCap = 'round';
        const run = () => { c.beginPath(); for (let k = 0; k <= 8; k++) { const y = d.y + L * k / 8; k ? c.lineTo(d.x + Math.sin(y * 0.03 + d.wob) * 2, y) : c.moveTo(d.x + Math.sin(y * 0.03 + d.wob) * 2, y); } };
        c.strokeStyle = `rgba(96,108,140,${0.1 * fade})`; c.lineWidth = d.w * 1.8; run(); c.stroke();
        c.strokeStyle = `rgba(96,108,140,${0.16 * fade})`; c.lineWidth = d.w * 0.8; run(); c.stroke();
        c.fillStyle = `rgba(80,92,128,${0.3 * fade})`; c.beginPath(); c.ellipse(d.x + Math.sin((d.y + L) * 0.03 + d.wob) * 2, d.y + L, d.w * 0.95, d.w * 1.25, 0, 0, TAU); c.fill();
      });
      c.restore();
      // sun returns: warm glaze, lifted band, rainbow
      wcDraw(c, st, Wa.warm, t);
      wcDraw(c, st, Wa.rbl, t);
      wcDraw(c, st, Wa.rb, t);
      // birds
      if (t > 7.5) {
        c.save(); c.globalCompositeOperation = 'multiply'; c.strokeStyle = 'rgba(70,60,70,0.7)'; c.lineWidth = 2.2; c.lineCap = 'round';
        [[1180, 300, 0], [1230, 330, 1.7], [1150, 345, 3.1]].forEach(([bx, by, ph]) => {
          const p = t - 7.5, x = bx + p * 120, y = by - p * 14 + Math.sin(p * 2 + ph) * 6, f = Math.sin(t * 9 + ph) * 7;
          c.globalAlpha = seg(t, 7.5, 7.9);
          c.beginPath(); c.moveTo(x - 12, y - f); c.quadraticCurveTo(x - 5, y - 3, x, y + 1); c.quadraticCurveTo(x + 5, y - 3, x + 12, y - f); c.stroke();
        });
        c.restore();
      }
      // the kite rises and floats across on the breeze
      if (t > WC_T.kite) {
        const p = t - WC_T.kite, u = E.outC(seg(t, WC_T.kite, 9.6));
        const kx = lerp(800, 1150, u) + Math.sin(p * 1.7) * 14, ky = lerp(660, 300, u) + Math.sin(p * 2.3) * 10, ka = -0.2 + Math.sin(p * 1.9) * 0.12;
        const hx = 704, hy = 864;
        c.save(); c.globalCompositeOperation = 'multiply'; c.globalAlpha = seg(t, WC_T.kite, WC_T.kite + 0.3);
        c.strokeStyle = 'rgba(92,66,50,0.55)'; c.lineWidth = 1.3;
        c.beginPath(); c.moveTo(hx, hy); c.quadraticCurveTo(lerp(hx, kx, 0.5) + 40, lerp(hy, ky, 0.5) + 60, kx, ky + 40); c.stroke();
        // ribbon tail with bows
        const tail = []; for (let k = 0; k <= 22; k++) { const q = k / 22; tail.push([kx - Math.sin(ka) * 60 - q * 70 + Math.sin(p * 4 - q * 6) * 14 * q, ky + 70 + q * 150 + Math.cos(p * 3 - q * 5) * 6]); }
        c.strokeStyle = 'rgba(92,66,50,0.6)'; c.lineWidth = 1.5; c.beginPath(); tail.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
        [5, 11, 17].forEach((k, i) => { const [x, y] = tail[k]; c.fillStyle = i % 2 ? 'rgba(80,120,200,0.7)' : 'rgba(214,62,58,0.7)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 10, y - 6); c.lineTo(x - 10, y + 6); c.closePath(); c.moveTo(x, y); c.lineTo(x + 10, y - 6); c.lineTo(x + 10, y + 6); c.closePath(); c.fill(); });
        c.translate(kx, ky); c.rotate(ka); c.scale(0.62, 0.62);
        c.drawImage(st.kite, -100, -100);
        c.strokeStyle = 'rgba(92,66,50,0.7)'; c.lineWidth = 2.4;
        c.beginPath(); c.moveTo(0, -84); c.lineTo(0, 130); c.moveTo(-70, -8); c.lineTo(70, -8); c.stroke();
        c.restore();
      }
      // the title is painted, then signed in ink
      wcDraw(c, st, Wa.title, t);
      if (t > 8.7) {
        const p = E.ioS(seg(t, 8.7, 9.15));
        c.save(); c.beginPath(); c.rect(150, 360, 400 * p, 120); c.clip(); c.globalCompositeOperation = 'multiply';
        text(c, '水彩动画', 160, 438, { font: '"Ma Shan Zheng", cursive', size: 58, color: 'rgba(92,66,50,0.85)', ls: 6 });
        c.restore();
        if (t > 9.15) {
          const ps = E.outB(seg(t, 9.15, 9.3)), sx = 452, sy = 420;
          c.save(); c.translate(sx, sy); c.scale(ps, ps); c.globalCompositeOperation = 'multiply';
          roughPoly(c, [[-17, -17], [17, -17], [17, 17], [-17, 17]], 21, 1.2, 8); c.fillStyle = 'rgba(190,56,46,0.85)'; c.fill();
          text(c, '彩', 0, 1, { font: '"Ma Shan Zheng", cursive', size: 26, align: 'center', base: 'middle', color: 'rgba(250,236,220,0.95)' });
          c.restore();
        }
      }
      c.restore();
      grain(c, W, H, t, 0.035, 'multiply');
      vignette(c, W, H, 0.14, '90,70,40');
    },
    score(A) {
      A.bus.gain.value = 1.25;
      const gtr = (t, m, g = 0.2, o = {}) => A.pluck(t, midi(m), { dur: 2.6, g, bright: 0.55, decay: 0.997, lp: 3800, rev: 0.32, pan: o.pan || 0 });
      const pad = (t, notes, dur, g = 0.016) => A.chord(t, notes, { type: 'sawtooth', dur, g, lp: 1100, a: dur * 0.35, hold: true, rel: dur * 0.4, spread: 7, rev: 0.6, width: 0.8 });
      // fingerpicked guitar: D – Bm – G (rain: Em) – A – D
      const bars = [[0.25, [50, 57, 62, 66, 69]], [2.35, [47, 54, 59, 62, 66]], [4.45, [43, 50, 55, 59, 62]], [5.6, [40, 47, 52, 55, 59]], [7.0, [45, 52, 57, 61, 64]], [8.4, [50, 57, 62, 66, 69, 74]]];
      bars.forEach(([t0, ch], bi) => {
        const end = bi < bars.length - 1 ? bars[bi + 1][0] : 10;
        const pat = [0, 2, 3, 4, 1, 3, 2, 4];
        for (let k = 0; t0 + k * 0.35 < end - 0.05; k++) { const m = ch[pat[k % 8] % ch.length]; gtr(t0 + k * 0.35, m, (k % 4 === 0 ? 0.22 : 0.14) * (bi === 3 ? 0.8 : 1), { pan: (pat[k % 8] - 2) * 0.12 }); }
        pad(t0, ch.slice(1, 4).map(m => m + 12), end - t0 + 0.6, bi === 3 ? 0.02 : 0.015);
      });
      // a cello line under the change of light
      A.osc(5.3, { type: 'sawtooth', f: midi(40), dur: 1.9, g: 0.05, lp: 700, a: 0.4, hold: true, rel: 0.6, vib: [5, 1.2], rev: 0.5 });
      A.osc(7.0, { type: 'sawtooth', f: midi(45), dur: 1.4, g: 0.04, lp: 800, a: 0.3, hold: true, rel: 0.5, vib: [5, 1.2], rev: 0.5 });
      // the first drop, and the bloom spreading
      A.osc(0.12, { f: 1900, f2: 520, glide: 0.08, dur: 0.16, g: 0.14, rev: 0.6 });
      A.osc(0.12, { f: 300, f2: 120, glide: 0.12, dur: 0.25, g: 0.12 });
      A.noise(0.15, { type: 'lowpass', f: 400, f2: 1600, sweep: 1.4, dur: 1.6, g: 0.05, swell: 0.4, rev: 0.4 });
      // brush swishes for each wash
      [[1.75, 0.8], [2.3, 0.8], [2.85, 1.0], [3.55, 0.3], [3.65, 0.6], [3.9, 0.35], [4.1, 0.25], [4.3, 0.2], [4.45, 0.25], [4.68, 0.15], [7.3, 0.7], [WC_T.title[0], 0.8]].forEach(([t, d], i) => {
        A.noise(t, { type: 'bandpass', f: 900 + hash(i) * 700, f2: 1400 + hash(i * 3) * 900, sweep: d, q: 0.9, dur: d, g: 0.07, swell: 0.35, pan: (hash(i * 7) - 0.5) * 0.6 });
      });
      // nib and brush-tip ticks for the line work
      WC_LINES.forEach((l, i) => { if (i % 3 === 0) A.noise(l.t0, { type: 'bandpass', f: 3000 + hash(i) * 2000, q: 2, dur: 0.03, g: 0.025 }); });
      // weather: distant thunder, rain, drips
      A.noise(5.35, { type: 'lowpass', f: 160, dur: 1.8, g: 0.22, swell: 0.3, rev: 0.6 });
      A.osc(5.35, { f: 45, f2: 38, dur: 1.6, g: 0.1, a: 0.3 });
      A.noise(5.5, { type: 'highpass', f: 2500, dur: 1.8, g: 0.06, swell: 0.3, rev: 0.3 });
      A.noise(5.5, { type: 'bandpass', f: 1200, q: 0.6, dur: 1.8, g: 0.035, swell: 0.3 });
      for (let k = 0; k < 40; k++) { const t = 5.6 + hash(k * 3.3) * 1.4; A.noise(t, { type: 'bandpass', f: 2500 + hash(k) * 4000, q: 5, dur: 0.02, g: 0.03 + hash(k * 2) * 0.03, pan: (hash(k * 5) - 0.5) * 1.4 }); }
      // the rainbow: a harp glissando; the kite on a gust; birdsong
      [62, 66, 69, 73, 74, 78, 81, 85, 86].forEach((m, i) => A.pluck(WC_T.rb[0] + i * 0.08, midi(m), { dur: 2, g: 0.09, bright: 0.7, decay: 0.998, rev: 0.6, pan: (i / 8 - 0.5) * 0.9 }));
      A.whoosh(WC_T.kite, 1.4, { f1: 300, f2: 1200, g: 0.06, swell: 0.5 });
      [[7.6, 3600], [7.75, 4200], [8.3, 3900], [8.42, 4500], [9.1, 3800]].forEach(([t, f], i) => { A.osc(t, { f, f2: f * 1.35, glide: 0.06, dur: 0.08, g: 0.022, pan: 0.4 }); A.osc(t + 0.09, { f: f * 1.2, f2: f * 0.9, glide: 0.05, dur: 0.07, g: 0.018, pan: 0.4 }); });
      // the seal
      A.osc(9.15, { f: 140, f2: 70, glide: 0.15, dur: 0.3, g: 0.18 });
      A.bell(9.2, midi(86), { g: 0.04, dur: 2.2, rev: 0.6 });
    },
  });
})();
