/* Batch b2 — Collage (Gilliam cut-outs), Whiteboard (RSA Animate), Pixel art (8-bit). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, rrect, roughPoly, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Permanent+Marker&display=block');

  const ell = (g, x, y, rx, ry, rot = 0) => { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); };

  /* =====================================================================
     06 Collage — after Terry Gilliam's Flying Circus cut-outs
     ===================================================================== */
  const CO = { paper: '#efe4c9', ink: '#1d1915', red: '#c9372c', blue: '#2b5ba4', mustard: '#e2a42b', green: '#5f8f42', skin: '#f2c6a2', cream: '#fbf6ea', news: '#e7e1d2' };
  const q12 = t => Math.floor(t * 12 + 1e-6) / 12;
  const GX = 560, GY = 905, GS = 0.8;
  const CO_LAND = 5.9, CO_LIFT = 6.45, CO_TITLE = 7.0, CO_STAMP = 8.42;
  const CO_LET = 'COLLAGE'.split('').map((ch, i) => ({ ch, at: CO_TITLE + i * 0.12 }));
  const CO_LF = [
    { f: '"Playfair Display", serif', w: 900, bg: CO.red, fg: CO.cream, size: 190 },
    { f: 'Anton, sans-serif', w: 400, bg: CO.cream, fg: CO.ink, size: 196, dots: true },
    { f: 'Archivo, sans-serif', w: 900, bg: CO.ink, fg: CO.mustard, size: 186 },
    { f: '"Playfair Display", serif', w: 900, bg: CO.mustard, fg: CO.blue, size: 196 },
    { f: 'Anton, sans-serif', w: 400, bg: CO.blue, fg: CO.cream, size: 200 },
    { f: 'Fredoka, sans-serif', w: 700, bg: '#e9e2cf', fg: CO.red, size: 196, dots: true },
    { f: 'Archivo, sans-serif', w: 900, bg: CO.green, fg: CO.cream, size: 186 },
  ];

  function halftone(g, x0, y0, w, h, sp, ang, color, rf) {
    const ca = Math.cos(ang), sa = Math.sin(ang), cx = x0 + w / 2, cy = y0 + h / 2, R = Math.hypot(w, h) / 2 + sp;
    g.fillStyle = color; g.beginPath();
    for (let v = -R; v <= R; v += sp) for (let u = -R; u <= R; u += sp) {
      const x = cx + u * ca - v * sa, y = cy + u * sa + v * ca;
      if (x < x0 - sp || x > x0 + w + sp || y < y0 - sp || y > y0 + h + sp) continue;
      const r = rf(x, y); if (r < 0.45) continue;
      g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU);
    }
    g.fill();
  }
  function paperTex(g, w, h, base, seed, k = 1) {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const r = rng(seed);
    for (let i = 0; i < (w * h) / 260 * k; i++) {
      g.fillStyle = r() < 0.55 ? `rgba(110,80,40,${0.04 + r() * 0.05})` : `rgba(255,255,255,${0.06 + r() * 0.08})`;
      g.fillRect(r() * w, r() * h, 1 + r() * 2.2, 1 + r() * 2.2);
    }
    g.strokeStyle = 'rgba(120,90,50,0.08)'; g.lineWidth = 1;
    for (let i = 0; i < (w * h) / 6000 * k; i++) {
      const x = r() * w, y = r() * h, a = r() * TAU, l = 6 + r() * 18;
      g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.6, y + Math.sin(a + 0.6) * l * 0.6, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
  }
  // Torn paper: a jittery white core with a drop shadow, then the coloured face on top.
  function torn(g, pts, seed, fill, o = {}) {
    const amp = o.amp ?? 3, step = o.step ?? 12;
    g.save();
    if (o.shadow !== false) { g.shadowColor = o.sc || 'rgba(40,25,10,0.42)'; g.shadowBlur = o.blur ?? 10; g.shadowOffsetX = o.sx ?? 7; g.shadowOffsetY = o.sy ?? 10; }
    g.fillStyle = o.core || CO.cream; roughPoly(g, pts, seed, amp * 1.8, step); g.fill();
    g.restore();
    g.fillStyle = fill; roughPoly(g, pts, seed + 17, amp, step); g.fill();
  }
  const rectPts = (x, y, w, h, a = 0) => {
    const cx = x + w / 2, cy = y + h / 2, ca = Math.cos(a), sa = Math.sin(a);
    return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(([px, py]) => [cx + (px - cx) * ca - (py - cy) * sa, cy + (px - cx) * sa + (py - cy) * ca]);
  };
  const clipRough = (g, pts, seed, amp, step, fn) => { g.save(); roughPoly(g, pts, seed, amp, step); g.clip(); fn(); g.restore(); };
  function inkFill(g, fill, lw = 5) { g.fillStyle = fill; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = CO.ink; g.stroke(); } }
  function shadeClip(g, pathFn, fn) { g.save(); pathFn(); g.clip(); fn(); g.restore(); }

  function coBackdrop() {
    const cv = offscreen(1920, 1080), g = cv.getContext('2d');
    paperTex(g, 1920, 1080, CO.paper, 11);
    const sg = g.createLinearGradient(0, 0, 0, 900);
    sg.addColorStop(0, 'rgba(120,170,215,0.5)'); sg.addColorStop(1, 'rgba(240,220,180,0)');
    g.fillStyle = sg; g.fillRect(0, 0, 1920, 900);
    halftone(g, 0, 0, 1920, 860, 17, 0.26, 'rgba(36,82,155,0.88)', (x, y) => 7.4 * Math.pow(clamp(1 - y / 820), 1.15) * (0.85 + 0.15 * vnoise(x / 260, 2)));
    const hb = [];
    for (let x = -40; x <= 1960; x += 40) hb.push([x, 712 - 60 * Math.sin(x / 300 + 0.6) - 22 * Math.sin(x / 130 + 2)]);
    hb.push([1960, 1100], [-40, 1100]);
    torn(g, hb, 21, '#6f9a52', { amp: 4, sy: -6, sx: 0 });
    clipRough(g, hb, 38, 4, 12, () => halftone(g, 0, 560, 1920, 520, 13, 0.78, 'rgba(36,74,36,0.55)', (x, y) => 5.4 * clamp((y - 680) / 240)));
    // a Victorian clock tower, cut from an engraving
    const TX = 1540;
    torn(g, [[TX - 52, 420], [TX + 52, 420], [TX + 52, 820], [TX - 52, 820]], 71, '#bdb4a2', { amp: 2.5, sy: 8 });
    clipRough(g, [[TX - 52, 420], [TX + 52, 420], [TX + 52, 820], [TX - 52, 820]], 88, 2.5, 12, () => {
      halftone(g, TX - 60, 410, 120, 420, 7, 0.78, 'rgba(40,34,28,0.55)', (x) => 3 * clamp((x - TX + 10) / 60) + 0.6);
      g.fillStyle = '#2a241d';
      for (let k = 0; k < 4; k++) { rrect(g, TX - 30, 470 + k * 82, 16, 48, 8); g.fill(); rrect(g, TX + 14, 470 + k * 82, 16, 48, 8); g.fill(); }
    });
    torn(g, [[TX - 66, 300], [TX + 66, 300], [TX + 66, 430], [TX - 66, 430]], 73, '#cfc6b2', { amp: 2.5 });
    torn(g, [[TX - 66, 304], [TX, 150], [TX + 66, 304]], 75, '#5c564c', { amp: 2.5 });
    clipRough(g, [[TX - 66, 304], [TX, 150], [TX + 66, 304]], 92, 2.5, 12, () => { g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2; for (let y = 160; y < 310; y += 8) { g.beginPath(); g.moveTo(TX - 80, y); g.lineTo(TX + 80, y); g.stroke(); } });
    ell(g, TX, 366, 48, 48); inkFill(g, CO.cream, 4);
    g.strokeStyle = CO.ink; g.lineWidth = 3;
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; g.beginPath(); g.moveTo(TX + Math.cos(a) * 38, 366 + Math.sin(a) * 38); g.lineTo(TX + Math.cos(a) * 44, 366 + Math.sin(a) * 44); g.stroke(); }
    g.lineWidth = 4; g.beginPath(); g.moveTo(TX, 366); g.lineTo(TX, 334); g.moveTo(TX, 366); g.lineTo(TX + 22, 376); g.stroke();
    const hm = [];
    for (let x = 1100; x <= 1960; x += 40) hm.push([x, 820 - 70 * Math.sin((x - 1100) / 280)]);
    hm.push([1960, 1100], [1100, 1100]);
    torn(g, hm, 29, '#4f7d3b', { amp: 4, sy: -6, sx: -4 });
    const hf = [];
    for (let x = -40; x <= 1960; x += 40) hf.push([x, GY + 26 * Math.sin((x - GX) / 360)]);
    hf.push([1960, 1100], [-40, 1100]);
    torn(g, hf, 44, '#d9a441', { amp: 4, sy: -8, sx: 0 });
    clipRough(g, hf, 48, 4, 12, () => halftone(g, 0, 860, 1920, 220, 12, 0.5, 'rgba(150,70,30,0.5)', (x, y) => 4.8 * clamp((y - 930) / 150)));
    // a pasted strip of old print along the bottom edge
    torn(g, rectPts(1240, 990, 640, 70, -0.02), 61, CO.news, { amp: 2.5, blur: 6, sx: 4, sy: 6 });
    g.fillStyle = 'rgba(30,25,20,0.5)';
    for (let i = 0; i < 3; i++) g.fillRect(1270, 1005 + i * 15, 560 - i * 60, 6);
    return cv;
  }

  function coNews() {
    const cv = offscreen(1920, 1080), g = cv.getContext('2d');
    paperTex(g, 1920, 1080, CO.news, 5, 1.3);
    text(g, 'The Daily Collage', 960, 172, { font: '"Playfair Display", serif', weight: 900, size: 140, align: 'center', color: CO.ink });
    g.fillStyle = CO.ink; g.fillRect(80, 205, 1760, 7); g.fillRect(80, 218, 1760, 2);
    text(g, 'No. 1969   ·   LATE EDITION   ·   ONE PENNY', 960, 258, { font: 'Archivo, sans-serif', weight: 800, size: 26, align: 'center', ls: 6, color: CO.ink });
    g.fillRect(80, 276, 1760, 2);
    text(g, 'MAN FLATTENED', 960, 452, { font: 'Anton, sans-serif', size: 176, align: 'center', color: CO.ink, ls: 4 });
    text(g, 'BY GIANT FOOT', 960, 628, { font: 'Anton, sans-serif', size: 176, align: 'center', color: CO.ink, ls: 4 });
    const r = rng(9);
    for (let col = 0; col < 4; col++) {
      const x0 = 80 + col * 450;
      for (let y = 672; y < 1040; y += 17) {
        if (col === 1 && y < 930) continue;
        g.fillStyle = 'rgba(30,25,20,0.55)';
        g.fillRect(x0, y, 410 - (r() < 0.14 ? r() * 220 : 0), 7);
      }
    }
    g.save(); g.beginPath(); g.rect(530, 672, 410, 240); g.clip();
    g.fillStyle = '#d4ccbb'; g.fillRect(530, 672, 410, 240);
    halftone(g, 530, 672, 410, 240, 8, 0.78, '#1d1915', (x, y) => {
      const sole = Math.hypot((x - 760) / 150, (y - 860) / 34) < 1, leg = x > 640 && x < 720 && y < 860;
      return sole || leg ? 3.7 : 1.2 + 0.6 * clamp((y - 672) / 240);
    });
    g.restore();
    g.strokeStyle = CO.ink; g.lineWidth = 2; g.strokeRect(530, 672, 410, 240);
    return cv;
  }

  function coBody(g) {
    g.lineJoin = 'round'; g.lineCap = 'round';
    [-72, 10].forEach(x => {
      g.beginPath(); g.rect(x, -178, 62, 162); inkFill(g, '#77706a', 4);
      g.save(); g.beginPath(); g.rect(x, -178, 62, 162); g.clip();
      g.strokeStyle = 'rgba(30,24,20,0.55)'; g.lineWidth = 3;
      for (let k = x + 8; k < x + 62; k += 12) { g.beginPath(); g.moveTo(k, -178); g.lineTo(k, -16); g.stroke(); }
      g.restore();
    });
    [-1, 1].forEach(s => {
      ell(g, s * 58, -16, 58, 20); inkFill(g, '#1a1716', 4);
      ell(g, s * 72, -25, 16, 5); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fill();
    });
    [-1, 1].forEach(s => {
      g.beginPath(); g.moveTo(s * 150, -548); g.lineTo(s * 198, -500); g.lineTo(s * 216, -262); g.lineTo(s * 150, -258); g.lineTo(s * 132, -470); g.closePath(); inkFill(g, '#2c2a31', 5);
      g.beginPath(); g.rect(s > 0 ? 146 : -220, -272, 74, 30); inkFill(g, CO.cream, 4);
      ell(g, s * 184, -222, 30, 28); inkFill(g, CO.skin, 4);
    });
    const coat = () => { g.beginPath(); g.moveTo(-150, -548); g.quadraticCurveTo(-190, -330, -178, -140); g.lineTo(-22, -150); g.lineTo(0, -268); g.lineTo(22, -150); g.lineTo(178, -140); g.quadraticCurveTo(190, -330, 150, -548); g.quadraticCurveTo(0, -592, -150, -548); g.closePath(); };
    coat(); inkFill(g, '#28262d', 5);
    shadeClip(g, coat, () => {
      g.strokeStyle = 'rgba(255,255,255,0.07)'; g.lineWidth = 2;
      for (let k = -500; k < 400; k += 9) { g.beginPath(); g.moveTo(k, -600); g.lineTo(k + 300, -100); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,0.17)'; g.lineWidth = 3;
      [[-120, -470, -140, -200], [120, -470, 145, -200], [-70, -300, -96, -160], [70, -300, 96, -160]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(a - 12, (b + d) / 2, c2, d); g.stroke(); });
    });
    const wc = () => { g.beginPath(); g.moveTo(-64, -540); g.lineTo(-44, -286); g.lineTo(0, -262); g.lineTo(44, -286); g.lineTo(64, -540); g.lineTo(0, -430); g.closePath(); };
    wc(); inkFill(g, CO.mustard, 4);
    shadeClip(g, wc, () => halftone(g, -70, -545, 140, 290, 8, 0.5, 'rgba(160,60,30,0.6)', (x, y) => 3.2 * clamp((y + 420) / 160)));
    [-390, -350, -310].forEach(y => { ell(g, 0, y, 6, 6); g.fillStyle = CO.ink; g.fill(); });
    g.beginPath(); g.moveTo(-58, -556); g.lineTo(0, -428); g.lineTo(58, -556); g.closePath(); inkFill(g, CO.cream, 4);
    [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * 62, -552); g.lineTo(s * 98, -502); g.lineTo(s * 72, -472); g.lineTo(s * 46, -300); g.lineTo(s * 66, -540); g.closePath(); inkFill(g, '#1d1c21', 4); });
    [-1, 1].forEach(s => { g.beginPath(); g.moveTo(0, -560); g.lineTo(s * 46, -582); g.lineTo(s * 38, -538); g.closePath(); inkFill(g, CO.cream, 3); });
    [-1, 1].forEach(s => { g.beginPath(); g.moveTo(0, -552); g.lineTo(s * 46, -576); g.lineTo(s * 46, -528); g.closePath(); inkFill(g, CO.red, 4); });
    ell(g, 0, -552, 11, 13); inkFill(g, '#a52a22', 3);
  }

  function coHead(g) {
    g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath(); g.rect(-36, -604, 72, 56); inkFill(g, CO.skin, 4);
    [-1, 1].forEach(s => { roughPoly(g, [[s * 78, -744], [s * 120, -720], [s * 126, -652], [s * 100, -606], [s * 68, -640]], 5 + s, 5, 9); inkFill(g, '#6a4027', 4); });
    [-1, 1].forEach(s => { ell(g, s * 104, -690, 18, 30); inkFill(g, '#eab593', 4); });
    const face = () => ell(g, 0, -690, 100, 122);
    face(); inkFill(g, CO.skin, 5);
    shadeClip(g, face, () => halftone(g, -100, -812, 200, 244, 9, 0.6, 'rgba(176,82,58,0.72)', (x, y) => 3.9 * clamp((x - 10) / 100) + 2.4 * clamp((y + 610) / 50)));
    face(); g.lineWidth = 5; g.strokeStyle = CO.ink; g.stroke();
    [-1, 1].forEach(s => { ell(g, s * 58, -646, 26, 18); g.fillStyle = 'rgba(214,72,60,0.35)'; g.fill(); });
    [-1, 1].forEach(s => { roughPoly(g, [[s * 14, -736], [s * 40, -758], [s * 74, -750], [s * 78, -732], [s * 44, -738], [s * 18, -726]], 9 + s, 3, 7); inkFill(g, '#4a2c1b', 3); });
    [-1, 1].forEach(s => {
      ell(g, s * 38, -698, 24, 15); inkFill(g, '#fffdf6', 4);
      g.beginPath(); g.moveTo(s * 13, -706); g.quadraticCurveTo(s * 38, -718, s * 63, -705); g.lineWidth = 3; g.strokeStyle = CO.ink; g.stroke();
    });
    g.beginPath(); g.arc(38, -698, 29, 0, TAU); g.fillStyle = 'rgba(255,255,255,0.16)'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#b98a28'; g.stroke();
    ell(g, 0, -666, 24, 27); inkFill(g, '#eda988', 4);
    ell(g, -8, -676, 7, 5); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fill();
    [1, -1].forEach(s => {
      g.save(); g.scale(s, 1);
      g.beginPath(); g.moveTo(0, -652);
      g.bezierCurveTo(-28, -666, -64, -664, -86, -648);
      g.bezierCurveTo(-100, -638, -114, -652, -106, -672);
      g.bezierCurveTo(-98, -640, -70, -626, -40, -628);
      g.bezierCurveTo(-20, -630, -6, -634, 0, -636);
      g.closePath(); inkFill(g, '#4a2c1b', 4);
      g.restore();
    });
    ell(g, 0, -610, 26, 8); inkFill(g, '#b8443a', 3);
    roughPoly(g, [[-20, -596], [20, -596], [11, -566], [0, -558], [-11, -566]], 3, 3, 6); inkFill(g, '#4a2c1b', 3);
    // top hat
    ell(g, 0, -796, 150, 26); inkFill(g, '#1e1c20', 5);
    const crown = () => { g.beginPath(); g.moveTo(-90, -800); g.lineTo(-100, -962); g.lineTo(100, -962); g.lineTo(90, -800); g.closePath(); };
    crown(); inkFill(g, '#1e1c20', 5);
    shadeClip(g, crown, () => { g.strokeStyle = 'rgba(255,255,255,0.2)'; g.lineWidth = 3; for (let x = -86; x < -40; x += 8) { g.beginPath(); g.moveTo(x, -960); g.lineTo(x + 3, -800); g.stroke(); } });
    g.beginPath(); g.moveTo(-91, -802); g.lineTo(-94, -844); g.lineTo(94, -844); g.lineTo(91, -802); g.closePath(); inkFill(g, CO.red, 4);
    ell(g, 0, -962, 100, 18); inkFill(g, '#3a373d', 5);
  }

  function coGentParts() {
    const ox = 260, oy = 1010;
    const mk = () => { const cv = offscreen(520, 1040), g = cv.getContext('2d'); g.translate(ox, oy); return [cv, g]; };
    const r = rng(77), cut1 = [], cut2 = [];
    for (let x = -260; x <= 260; x += 13) { cut1.push([x, -716 + (r() - 0.5) * 9]); cut2.push([x, -624 + (r() - 0.5) * 7]); }
    const region = (g, top, bot) => { g.beginPath(); top.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); bot.slice().reverse().forEach(([x, y]) => g.lineTo(x, y)); g.closePath(); };
    const TOP = [[-260, -1010], [260, -1010]], BOT = [[-260, -540], [260, -540]];
    const piece = (top, bot, edges) => {
      const [cv, g] = mk();
      g.save(); region(g, top, bot); g.clip(); coHead(g); g.restore();
      g.save(); g.globalCompositeOperation = 'source-atop'; g.strokeStyle = 'rgba(255,250,236,0.95)'; g.lineWidth = 6;
      edges.forEach(e => { g.beginPath(); e.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); });
      g.restore();
      return cv;
    };
    const lid = piece(TOP, cut1, [cut1]), mid = piece(cut1, cut2, [cut1, cut2]), jaw = piece(cut2, BOT, [cut2]);
    const [body, gb] = mk(); coBody(gb);
    const [all, ga] = mk(); coBody(ga); coHead(ga);
    return { lid, mid, jaw, body, all, ox, oy };
  }

  function coHand() {
    const cv = offscreen(1000, 420), g = cv.getContext('2d');
    g.lineJoin = 'round'; g.lineCap = 'round';
    const skinShade = (pathFn, y0, y1) => { pathFn(); inkFill(g, CO.skin, 0); shadeClip(g, pathFn, () => halftone(g, 100, y0 - 10, 800, y1 - y0 + 20, 8, 0.6, 'rgba(170,80,55,0.7)', (x, y) => 3.4 * clamp((y - (y0 + (y1 - y0) * 0.45)) / ((y1 - y0) * 0.55)))); pathFn(); g.lineWidth = 5; g.strokeStyle = CO.ink; g.stroke(); };
    g.beginPath(); g.rect(856, 92, 160, 256); inkFill(g, '#25232a', 5);
    shadeClip(g, () => { g.beginPath(); g.rect(856, 92, 160, 256); }, () => { g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 2; for (let y = 60; y < 400; y += 8) { g.beginPath(); g.moveTo(850, y); g.lineTo(1000, y + 60); g.stroke(); } });
    rrect(g, 768, 106, 104, 228, 14); inkFill(g, CO.cream, 5);
    g.strokeStyle = 'rgba(29,25,21,0.45)'; g.lineWidth = 2;
    for (let y = 124; y < 330; y += 16) { g.beginPath(); g.moveTo(780, y); g.lineTo(860, y + 4); g.stroke(); }
    skinShade(() => rrect(g, 520, 140, 270, 196, 84), 140, 336);
    skinShade(() => rrect(g, 540, 292, 100, 40, 20), 292, 332);
    skinShade(() => rrect(g, 526, 250, 116, 46, 23), 250, 296);
    skinShade(() => rrect(g, 520, 204, 124, 50, 25), 204, 254);
    skinShade(() => rrect(g, 128, 146, 452, 60, 30), 146, 206);
    rrect(g, 138, 152, 52, 30, 13); inkFill(g, '#f7ddd0', 3);
    g.strokeStyle = CO.ink; g.lineWidth = 3;
    [[330, 152, 336, 198], [440, 150, 446, 200]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b + 8); g.quadraticCurveTo(a - 8, (b + d) / 2, c2, d - 6); g.stroke(); });
    g.save(); g.translate(640, 214); g.rotate(0.08);
    skinShade(() => rrect(g, -96, -26, 190, 52, 26), 188, 240);
    g.restore();
    return cv;
  }

  function coFoot() {
    const cv = offscreen(1150, 1500), g = cv.getContext('2d');
    g.lineJoin = 'round'; g.lineCap = 'round';
    const path = () => {
      g.beginPath(); g.moveTo(330, -10);
      g.bezierCurveTo(300, 300, 290, 700, 330, 1050);
      g.bezierCurveTo(340, 1150, 250, 1250, 255, 1360);
      g.bezierCurveTo(258, 1430, 290, 1452, 340, 1452);
      g.lineTo(930, 1452);
      g.bezierCurveTo(1050, 1455, 1110, 1440, 1100, 1395);
      g.bezierCurveTo(1092, 1350, 1040, 1330, 980, 1325);
      g.bezierCurveTo(850, 1300, 720, 1220, 650, 1060);
      g.bezierCurveTo(615, 900, 620, 400, 640, -10);
      g.closePath();
    };
    path(); g.fillStyle = '#efbf9c'; g.fill();
    shadeClip(g, path, () => {
      halftone(g, 200, 0, 950, 1500, 11, 0.5, 'rgba(150,66,46,0.78)', (x, y) => {
        const back = clamp((430 - x) / 150), sole = clamp((y - 1385) / 60), shin = clamp((x - 560) / 90) * clamp(1 - y / 1150), toe = clamp((y - 1330) / 90) * clamp((x - 700) / 300);
        return 4.8 * Math.max(back * 0.95, sole, shin * 0.7, toe * 0.6);
      });
      g.strokeStyle = 'rgba(120,52,36,0.45)'; g.lineWidth = 2.5;
      for (let k = 0; k < 14; k++) { const x = 318 + k * 6; g.beginPath(); g.moveTo(x, 80 + k * 30); g.bezierCurveTo(x - 20, 500, x - 18, 800, x + 10, 1080 - k * 8); g.stroke(); }
      g.filter = 'blur(22px)'; g.strokeStyle = 'rgba(255,242,228,0.45)'; g.lineWidth = 70;
      g.beginPath(); g.moveTo(520, -40); g.bezierCurveTo(500, 400, 500, 800, 560, 1080); g.quadraticCurveTo(640, 1240, 900, 1350); g.stroke();
      g.filter = 'none';
    });
    g.strokeStyle = CO.ink; g.lineWidth = 4;
    [[1000, 1330, 1010, 1380], [935, 1318, 948, 1372], [878, 1302, 892, 1352]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(a + 18, (b + d) / 2, c2, d); g.stroke(); });
    rrect(g, 1030, 1352, 48, 26, 11); inkFill(g, '#f7dccd', 3);
    g.beginPath(); g.moveTo(560, 1180); g.quadraticCurveTo(600, 1200, 640, 1190); g.stroke();
    path(); g.lineWidth = 7; g.strokeStyle = CO.ink; g.stroke();
    return cv;
  }

  function coStamp() {
    const cv = offscreen(380, 220), g = cv.getContext('2d');
    g.strokeStyle = CO.red; g.lineWidth = 9; rrect(g, 14, 14, 352, 192, 18); g.stroke();
    g.lineWidth = 3; rrect(g, 30, 30, 320, 160, 10); g.stroke();
    text(g, '拼贴', 190, 128, { font: '"Noto Sans SC", sans-serif', weight: 900, size: 96, align: 'center', color: CO.red, ls: 18 });
    text(g, 'COLLAGE · 1969', 190, 174, { font: 'Archivo, sans-serif', weight: 800, size: 24, align: 'center', ls: 6, color: CO.red });
    g.globalCompositeOperation = 'destination-out';
    const r = rng(31);
    for (let i = 0; i < 1100; i++) { g.globalAlpha = 0.3 + r() * 0.7; g.beginPath(); g.arc(r() * 380, r() * 220, 0.5 + r() * 2.4, 0, TAU); g.fill(); }
    g.globalAlpha = 0.5; g.lineWidth = 2;
    for (let i = 0; i < 14; i++) { const y = r() * 220; g.beginPath(); g.moveTo(0, y); g.lineTo(380, y + (r() - 0.5) * 30); g.stroke(); }
    return cv;
  }

  function coPostage() {
    const cv = offscreen(230, 280), g = cv.getContext('2d');
    g.fillStyle = '#fbf6ea'; g.fillRect(10, 10, 210, 260);
    g.globalCompositeOperation = 'destination-out';
    for (let x = 10; x <= 221; x += 15) { g.beginPath(); g.arc(x, 10, 6, 0, TAU); g.arc(x, 270, 6, 0, TAU); g.fill(); }
    for (let y = 10; y <= 271; y += 15) { g.beginPath(); g.arc(10, y, 6, 0, TAU); g.arc(220, y, 6, 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = CO.red; g.fillRect(28, 28, 174, 224);
    halftone(g, 28, 28, 174, 224, 7, 0.4, 'rgba(120,20,15,0.6)', (x, y) => 2.8 * clamp((y - 120) / 130));
    ell(g, 115, 132, 56, 64); g.fillStyle = '#fbf6ea'; g.fill();
    g.fillStyle = CO.ink; g.fillRect(93, 92, 44, 52); ell(g, 115, 144, 42, 8); g.fill();
    g.fillStyle = CO.red; g.fillRect(93, 132, 44, 7);
    text(g, 'POSTAGE', 115, 58, { font: 'Archivo, sans-serif', weight: 800, size: 17, align: 'center', ls: 4, color: '#fbf6ea' });
    text(g, '1969', 115, 236, { font: '"Playfair Display", serif', weight: 900, size: 46, align: 'center', color: '#fbf6ea' });
    return cv;
  }

  function coCloud(c, x, y, s, seed) {
    const B = [[-92, 12, 44], [-44, -18, 56], [22, -30, 62], [86, -2, 48], [10, 18, 54], [-40, 24, 40]];
    c.save(); c.translate(x, y); c.scale(s, s);
    c.save(); c.shadowColor = 'rgba(40,25,10,0.35)'; c.shadowBlur = 8; c.shadowOffsetX = 6; c.shadowOffsetY = 8;
    c.fillStyle = CO.ink; c.beginPath(); B.forEach(([bx, by, r]) => { c.moveTo(bx + r + 5, by); c.arc(bx, by, r + 5, 0, TAU); }); c.fill();
    c.restore();
    c.fillStyle = CO.cream; c.beginPath(); B.forEach(([bx, by, r]) => { c.moveTo(bx + r, by); c.arc(bx, by, r, 0, TAU); }); c.fill();
    c.save(); c.beginPath(); B.forEach(([bx, by, r]) => { c.moveTo(bx + r, by); c.arc(bx, by, r, 0, TAU); }); c.clip();
    halftone(c, -150, -100, 300, 170, 9, 0.3 + seed, 'rgba(43,91,164,0.35)', (px, py) => 3 * clamp((py - 0) / 60));
    c.restore();
    c.restore();
  }

  function coSun(c, t, tq) {
    const x = 1730, y = 150, rot = Math.floor(tq * 12) * 0.05;
    c.save(); c.translate(x, y);
    c.save(); c.rotate(rot);
    c.shadowColor = 'rgba(40,25,10,0.35)'; c.shadowBlur = 8; c.shadowOffsetX = 6; c.shadowOffsetY = 8;
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * TAU;
      c.fillStyle = k % 2 ? CO.red : CO.mustard;
      roughPoly(c, [[Math.cos(a - 0.12) * 70, Math.sin(a - 0.12) * 70], [Math.cos(a) * (k % 2 ? 128 : 150), Math.sin(a) * (k % 2 ? 128 : 150)], [Math.cos(a + 0.12) * 70, Math.sin(a + 0.12) * 70]], 70 + k, 2, 10);
      c.fill();
    }
    c.restore();
    const disc = [];
    for (let k = 0; k < 24; k++) disc.push([Math.cos((k / 24) * TAU) * 86, Math.sin((k / 24) * TAU) * 86]);
    torn(c, disc, 90, '#f0b437', { amp: 2.5, step: 10 });
    clipRough(c, disc, 107, 2.5, 10, () => halftone(c, -90, -90, 180, 180, 8, 0.4, 'rgba(200,70,30,0.55)', (px, py) => 3.2 * clamp((px + py + 20) / 120)));
    c.fillStyle = CO.ink;
    const blink = Math.floor(t * 12) % 40 === 0;
    [-1, 1].forEach(s => { ell(c, s * 28, -14, 9, blink ? 2 : 11); c.fill(); });
    c.strokeStyle = CO.ink; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.arc(0, 8, 36, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
    [-1, 1].forEach(s => { ell(c, s * 50, 16, 14, 9); c.fillStyle = 'rgba(200,55,44,0.5)'; c.fill(); });
    c.restore();
  }

  function coBird(c, x, y, s, flap) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.shadowColor = 'rgba(40,25,10,0.35)'; c.shadowBlur = 6; c.shadowOffsetX = 5; c.shadowOffsetY = 7;
    c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = CO.ink;
    c.beginPath(); c.moveTo(-60, -6); c.lineTo(-96, -26); c.lineTo(-92, 10); c.closePath(); c.fillStyle = CO.ink; c.fill();
    ell(c, 0, 0, 60, 30); c.fillStyle = CO.blue; c.fill(); c.stroke();
    c.shadowColor = 'transparent';
    ell(c, 56, -20, 24, 22); c.fillStyle = CO.blue; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(76, -26); c.lineTo(108, -16); c.lineTo(76, -10); c.closePath(); c.fillStyle = CO.mustard; c.fill(); c.stroke();
    ell(c, 62, -26, 7, 7); c.fillStyle = CO.cream; c.fill(); ell(c, 64, -26, 3.5, 3.5); c.fillStyle = CO.ink; c.fill();
    ell(c, 6, 10, 34, 13); c.fillStyle = CO.cream; c.fill();
    c.beginPath();
    if (flap) { c.moveTo(-20, -8); c.lineTo(30, -8); c.lineTo(-30, -78); }
    else { c.moveTo(-20, 0); c.lineTo(30, 0); c.lineTo(-24, 62); }
    c.closePath(); c.fillStyle = '#d9cfa8'; c.fill(); c.stroke();
    c.restore();
  }

  function coStar(c, x, y, r, rot) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.beginPath();
    for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU - Math.PI / 2, rr = k % 2 ? r * 0.45 : r; k ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    c.closePath(); c.fillStyle = CO.mustard; c.fill(); c.lineWidth = 3; c.strokeStyle = CO.ink; c.stroke();
    c.restore();
  }

  function coFlower(c, x, y, s, col, mid) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.lineWidth = 4; c.strokeStyle = CO.ink;
    for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; ell(c, Math.cos(a) * 24, Math.sin(a) * 24, 17, 17); c.fillStyle = col; c.fill(); c.stroke(); }
    ell(c, 0, 0, 15, 15); c.fillStyle = mid; c.fill(); c.stroke();
    c.restore();
  }

  function coGent(c, st, t, tq) {
    const P = st.gent;
    const talk = t >= 1.2 && t < 2.35, gasp = t >= 5.12;
    const jaw = gasp ? 38 : talk ? (Math.floor(t * 8) % 2 ? 6 : 30) : 0;
    const poke = (tq >= 3.0 && tq < 3.09) || (tq >= 3.25 && tq < 3.34);
    const tilt = (poke ? -0.07 : 0) + (talk ? (Math.floor(t * 4) % 2 ? 0.018 : -0.018) : 0) + (tq >= 3.4 && tq < 3.6 ? 0.045 : 0);
    const lidA = tq < 3.4 ? 0 : -1.95 * spring(tq - 3.4, 1.8, 0.32);
    let lx = 4, ly = 0;
    if (talk) { lx = 0; ly = 2; } else if (t >= 2.5 && t < 4.6) { lx = 9; ly = 0; } else if (t >= 4.6) { lx = -1; ly = -9; }
    const sh = (b = 14) => { c.shadowColor = 'rgba(40,24,10,0.42)'; c.shadowBlur = b; c.shadowOffsetX = 8; c.shadowOffsetY = 11; };
    const ns = () => { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0; };
    c.save(); c.translate(GX, GY); c.rotate(tilt); c.scale(GS, GS);
    sh(); c.drawImage(P.body, -P.ox, -P.oy); c.drawImage(P.mid, -P.ox, -P.oy); ns();
    [-1, 1].forEach(s => { ell(c, s * 38 + lx, -698 + ly, 9, 9); c.fillStyle = CO.ink; c.fill(); });
    if (jaw > 0) {
      c.beginPath(); c.moveTo(-62, -628); c.lineTo(62, -628); c.lineTo(50, -606 + jaw); c.lineTo(-50, -606 + jaw); c.closePath();
      c.fillStyle = '#3a0f0c'; c.fill();
      ell(c, 0, -616 + jaw, 28, 10); c.fillStyle = '#c4504a'; c.fill();
    }
    sh(10);
    c.save(); c.translate(0, jaw); c.translate(-100, -624); c.rotate(jaw * 0.0025); c.translate(100, 624); c.drawImage(P.jaw, -P.ox, -P.oy); c.restore();
    if (lidA < -0.02) { ns(); ell(c, 0, -716, 98, 20); c.fillStyle = '#2b1610'; c.fill(); }
    sh(16);
    c.save(); c.translate(-112, -716); c.rotate(lidA); c.translate(112, 716); c.drawImage(P.lid, -P.ox, -P.oy); c.restore();
    ns();
    if (tq >= 3.45) {
      [[-34, 3.45, 200, CO.red, CO.mustard], [44, 3.55, 150, CO.mustard, CO.blue]].forEach(([bx, at, Lm, col, mid], i) => {
        const L = Lm * spring(tq - at, 2.4, 0.22);
        if (L <= 2) return;
        const sway = Math.sin((tq - at) * 9 + i) * 10 * Math.exp(-(tq - at) * 1.5);
        c.beginPath(); c.moveTo(bx, -716);
        for (let k = 1; k <= 10; k++) c.lineTo(bx + (k % 2 ? 16 : -16) + sway * k / 10, -716 - (L * k) / 10);
        c.lineWidth = 5; c.strokeStyle = '#555049'; c.stroke();
        coFlower(c, bx + sway, -716 - L - 18, 1.15, col, mid);
      });
    }
    c.restore();
  }

  MG.film({
    id: 'collage',
    dur: 10,
    poster: 9.4,
    fonts: [['900 140px "Playfair Display"', 'The Daily CollageCL1969'], ['400 176px Anton', 'MANFLATTENEDBYGIOAI SAY!'], ['800 34px Archivo', 'SCISOR·GLUEP-MNTA1969'], ['900 186px Archivo', 'LE'], ['700 196px Fredoka', 'G'], ['900 96px "Noto Sans SC"', '拼贴']],
    meta: {
      cn: '拼贴', en: 'Collage', era: '1969 —',
      origin: '源自达达与立体派的拼贴艺术；特里·吉列姆在《巨蟒剧团之飞翔的马戏团》(1969) 中把维多利亚版画剪下、加上铰链，做成一顿一顿的剪纸动画。',
      works: '代表作：《Monty Python\'s Flying Circus》片头与过场动画（Terry Gilliam，1969–1974）；《巨蟒与圣杯》(1975) 动画段落；《南方公园》早期剪纸动画（1997）',
      tech: ['撕纸毛边与纸片投影', '程序化半调网点', '铰链剪纸 · 12 帧限帧'],
      accent: '#c9372c',
    },
    setup() {
      const r = rng(404);
      const scraps = Array.from({ length: 24 }, (_, i) => {
        const side = i % 2 ? 1 : -1;
        return { x0: GX + 40 + side * (60 + r() * 380), vx: side * (260 + r() * 700), vy: -(520 + r() * 760), rot: r() * TAU, vr: (r() - 0.5) * 14, w: 26 + r() * 46, h: 18 + r() * 30, col: [CO.red, CO.mustard, CO.blue, CO.cream, CO.news, '#6f9a52'][i % 6], seed: 200 + i };
      });
      return { bg: coBackdrop(), news: coNews(), gent: coGentParts(), hand: coHand(), foot: coFoot(), stamp: coStamp(), postage: coPostage(), scraps };
    },
    draw(c, t, W, H, st) {
      const tq = q12(t);
      let shx = 0, shy = 0;
      if (t > CO_LAND && t < CO_LAND + 0.8) { const f = Math.floor(t * 24), k = Math.exp(-(t - CO_LAND) * 7) * 36; shx = (hash(f) - 0.5) * k; shy = (hash(f + 3) - 0.5) * k; }
      if (t > CO_STAMP && t < CO_STAMP + 0.3) { const f = Math.floor(t * 24), k = Math.exp(-(t - CO_STAMP) * 12) * 12; shx += (hash(f + 9) - 0.5) * k; shy += (hash(f + 5) - 0.5) * k; }
      c.fillStyle = '#2a2018'; c.fillRect(0, 0, W, H);
      c.save(); c.translate(shx, shy);
      c.drawImage(st.bg, -24, -14, W + 48, H + 28);

      // sun, clouds, postage stamp
      const pop = (at) => (tq < at ? 0 : tq < at + 1 / 12 ? 1.25 : 1);
      const sunS = pop(0.92);
      if (sunS) { c.save(); c.translate(1730, 150); c.scale(sunS, sunS); c.translate(-1730, -150); coSun(c, t, tq); c.restore(); }
      const drift = Math.floor(tq * 12) * 1.6;
      [[700, 120, 0.95, 0], [1180, 92, 0.75, 0.4], [300, 470, 0.7, 0.8], [1420, 300, 0.85, 1.2]].forEach(([x, y, s, sd], i) => {
        if (tq < 0.92 + i * 0.08) return;
        coCloud(c, ((x + drift * (i % 2 ? 0.7 : 1)) % 2200) - 140, y, s, sd);
      });
      const ps = pop(1.0);
      if (ps) {
        c.save(); c.translate(150, 178); c.rotate(-0.09); c.scale(ps * 0.84, ps * 0.84);
        c.shadowColor = 'rgba(40,25,10,0.4)'; c.shadowBlur = 10; c.shadowOffsetX = 7; c.shadowOffsetY = 10;
        c.drawImage(st.postage, -115, -140); c.restore();
      }

      // ominous shadow of the foot
      if (t >= 4.6 && t < CO_LIFT + 0.4) {
        const grow = t < CO_LIFT ? E.inQ(seg(tq, 4.6, CO_LAND)) : 1 - E.inQ(seg(tq, CO_LIFT, CO_LIFT + 0.4));
        const rx = lerp(30, 520, grow);
        c.save(); c.globalCompositeOperation = 'multiply';
        const sg = c.createRadialGradient(640, GY + 6, 0, 640, GY + 6, rx);
        sg.addColorStop(0, `rgba(40,25,15,${0.55 * grow + 0.1})`); sg.addColorStop(0.8, `rgba(40,25,15,${0.35 * grow + 0.05})`); sg.addColorStop(1, 'rgba(40,25,15,0)');
        c.fillStyle = sg; c.translate(640, GY + 6); c.scale(1, 0.12); c.translate(-640, -(GY + 6));
        c.beginPath(); c.arc(640, GY + 6, rx, 0, TAU); c.fill();
        c.restore();
      }

      // the gentleman — or what is left of him
      if (t < CO_LAND) coGent(c, st, t, tq);
      else if (t >= CO_LIFT) {
        c.save(); c.translate(GX + 40, GY + 6); c.scale(GS * 1.42, GS * 0.17);
        c.shadowColor = 'rgba(40,24,10,0.45)'; c.shadowBlur = 6; c.shadowOffsetX = 6; c.shadowOffsetY = 4;
        c.drawImage(st.gent.all, -st.gent.ox, -st.gent.oy);
        c.restore();
        if (tq >= 6.9) for (let k = 0; k < 3; k++) { const a = tq * 6 + (k * TAU) / 3; coStar(c, GX + 40 + Math.cos(a) * 120, GY - 64 + Math.sin(a) * 22, 17, a); }
      }

      // the bird escapes
      if (tq >= 3.55 && tq < 5.1) {
        const u = seg(tq, 3.55, 5.1), v = 1 - u;
        const bx = v * v * v * GX + 3 * v * v * u * 640 + 3 * v * u * u * 1150 + u * u * u * 2100;
        const by = v * v * v * 300 + 3 * v * v * u * 40 + 3 * v * u * u * 200 + u * u * u * 40;
        coBird(c, bx, by, lerp(0.5, 1.05, Math.min(1, u * 3)), Math.floor(t * 8) % 2 === 0);
      }

      // speech scrap
      if (tq >= 1.2 && tq < 2.4) {
        const s = tq < 1.2 + 1 / 12 ? 1.3 : 1;
        c.save(); c.translate(860, 250); c.rotate(-0.06); c.scale(s, s);
        torn(c, rectPts(-150, -62, 300, 124), 333, CO.cream, { amp: 3.5 });
        c.beginPath(); c.moveTo(-120, 50); c.lineTo(-170, 110); c.lineTo(-70, 56); c.closePath(); c.fillStyle = CO.cream; c.fill();
        text(c, 'I SAY!', 0, 32, { font: 'Anton, sans-serif', size: 84, align: 'center', color: CO.ink, ls: 3 });
        c.restore();
      }

      // the big pointing hand
      if (tq >= 2.5 && tq < 3.8) {
        let hx = kf(tq, [[2.5, 1300], [2.83, 0, E.outQ], [3.5, 0], [3.8, 1300, E.inQ]]);
        if ((tq >= 3.0 && tq < 3.09) || (tq >= 3.25 && tq < 3.34)) hx -= 46;
        const s = 0.92;
        c.save(); c.translate(700 + hx, 385); c.rotate(0.05); c.scale(s, s);
        c.shadowColor = 'rgba(40,24,10,0.42)'; c.shadowBlur = 16; c.shadowOffsetX = 12; c.shadowOffsetY = 16;
        c.drawImage(st.hand, -130, -178);
        c.restore();
      }

      // the foot of Cupid
      if (t >= 5.3 && t < CO_LIFT + 0.45) {
        const fy = t < CO_LIFT ? kf(tq, [[5.3, -1600], [CO_LAND, 0, E.inQ]]) : kf(tq, [[CO_LIFT, 0], [CO_LIFT + 0.42, -1750, E.inC]]);
        const sq = t >= CO_LAND && t < CO_LAND + 0.1 ? 0.95 : 1;
        c.save(); c.translate(0, GY + 10 + fy); c.scale(1, sq);
        c.shadowColor = 'rgba(30,18,8,0.5)'; c.shadowBlur = 30; c.shadowOffsetX = 18; c.shadowOffsetY = 26;
        c.drawImage(st.foot, -40, -1452);
        c.restore();
      }

      // flying paper scraps after the stomp
      if (t >= CO_LAND && t < CO_LAND + 1.6) {
        const u = tq - CO_LAND;
        st.scraps.forEach(p => {
          const x = p.x0 + p.vx * u, y = GY - 10 + p.vy * u + 1500 * u * u;
          if (y > 1150) return;
          c.save(); c.translate(x, y); c.rotate(p.rot + p.vr * u);
          torn(c, rectPts(-p.w / 2, -p.h / 2, p.w, p.h), p.seed, p.col, { amp: 2, step: 8, blur: 4, sx: 3, sy: 5 });
          c.restore();
        });
      }

      // ransom-note title
      CO_LET.forEach((L, i) => {
        if (tq < L.at - 2 / 12) return;
        const s = tq < L.at - 1 / 12 ? 1.9 : tq < L.at ? 1.35 : 1;
        const F = CO_LF[i];
        const x = 960 + (i - 3) * 192 + (hash(i * 3.7) - 0.5) * 16, y = 330 + (hash(i * 5.1) - 0.5) * 44, rot = (hash(i * 9.3) - 0.5) * 0.2;
        c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
        c.font = `${F.w} ${F.size}px ${F.f}`;
        const m = c.measureText(L.ch), w = Math.max(158, m.width + 46), h = 218;
        torn(c, rectPts(-w / 2, -h / 2, w, h), 500 + i * 7, F.bg, { amp: 3.2, sx: 7 * s, sy: 10 * s, blur: 10 * s });
        if (F.dots) clipRough(c, rectPts(-w / 2, -h / 2, w, h), 517 + i * 7, 3.2, 12, () => halftone(c, -w / 2, -h / 2, w, h, 9, 0.8, 'rgba(29,25,21,0.13)', () => 2.3));
        c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = F.fg;
        c.fillText(L.ch, 0, (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2);
        c.restore();
      });

      // newsprint strip
      if (tq >= 8.0) {
        const sx = kf(tq, [[8.0, -1300], [8.25, 0, E.outQ]]);
        c.save(); c.translate(sx, 0);
        torn(c, rectPts(560, 496, 800, 66, 0.012), 777, CO.news, { amp: 2.5 });
        text(c, 'SCISSORS · GLUE · STOP-MOTION', 960, 542, { font: 'Archivo, sans-serif', weight: 800, size: 32, align: 'center', ls: 6, color: CO.ink });
        c.restore();
      }

      // rubber stamp
      if (tq >= CO_STAMP - 2 / 12) {
        const s = tq < CO_STAMP - 1 / 12 ? 2.3 : tq < CO_STAMP ? 1.45 : 1;
        c.save(); c.translate(1590, 640); c.rotate(-0.12); c.scale(s, s);
        c.globalAlpha = s > 1 ? 0.55 : 0.92; c.globalCompositeOperation = 'multiply';
        c.drawImage(st.stamp, -190, -110);
        c.restore();
      }
      c.restore();

      // opening: the newspaper tears in two
      if (t < 1.1) {
        const yp = 1080 * E.inQ(seg(tq, 0.08, 0.42));
        const u = E.inQ(seg(tq, 0.42, 1.0));
        const tear = [];
        for (let y = 0; y <= 1080; y += 18) tear.push([960 + 70 * vnoise(y / 160, 4) + (hash(y) - 0.5) * 22, y]);
        [-1, 1].forEach(s => {
          const poly = s < 0 ? [[-10, -10], ...tear, [-10, 1090]] : [[1930, -10], ...tear, [1930, 1090]];
          const wedge = s * 0.018 * seg(tq, 0.08, 0.42) * (1 - u);
          c.save();
          c.translate(s * 1300 * u, 120 * u); c.translate(s < 0 ? 0 : 1920, 1080); c.rotate(s * 0.32 * u + wedge); c.translate(s < 0 ? 0 : -1920, -1080);
          const path = () => { c.beginPath(); poly.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };
          c.save(); c.shadowColor = 'rgba(20,12,4,0.5)'; c.shadowBlur = 24; c.shadowOffsetX = s * 10; c.shadowOffsetY = 14; path(); c.fillStyle = CO.news; c.fill(); c.restore();
          c.save(); path(); c.clip(); c.drawImage(st.news, 0, 0);
          if (yp > 0) {
            c.beginPath(); let first = true;
            tear.forEach(([x, y]) => { if (y > yp + 18) return; const jx = x + s * (3 + hash(y * 1.7) * 6); first ? c.moveTo(jx, y) : c.lineTo(jx, y); first = false; });
            c.lineWidth = 9; c.strokeStyle = '#fbf8f0'; c.lineJoin = 'round'; c.stroke();
          }
          c.restore();
          c.restore();
        });
      }

      grain(c, W, H, t, 0.09, 'overlay');
      vignette(c, W, H, 0.38, '60,35,10');
    },
    score(A) {
      A.noise(0.0, { type: 'bandpass', f: 2500, q: 0.6, dur: 0.1, g: 0.07 });
      for (let k = 0; k < 17; k++) {
        const t = 0.08 + k * 0.02;
        A.noise(t, { type: 'bandpass', f: 1400 + hash(k * 3.1) * 3800, q: 1.4, dur: 0.035, g: 0.14 + hash(k) * 0.1, crush: k % 3 === 0, pan: (hash(k * 2) - 0.5) * 0.4 });
      }
      A.noise(0.42, { type: 'bandpass', f: 900, q: 0.8, dur: 0.18, g: 0.18 });
      A.whoosh(0.44, 0.5, { f1: 400, f2: 2400, g: 0.14 });
      A.chord(0.92, [48, 55, 60, 64, 67], { type: 'sawtooth', dur: 0.5, g: 0.03, lp: 2200, a: 0.01, spread: 8, rev: 0.3 });
      A.kick(0.92, 0.55);
      A.noise(0.92, { type: 'highpass', f: 5000, dur: 0.5, g: 0.06, rev: 0.4 });
      // oom-pah march
      const roots = [36, 31, 41, 36, 43, 38, 36, 31];
      const pah = [[60, 64, 67], [60, 64, 67], [60, 65, 69], [60, 64, 67], [59, 62, 67], [59, 65, 67], [60, 64, 67], [60, 64, 67]];
      for (let k = 0; k < 8; k++) {
        const tb = 1.0 + k * 0.5;
        A.osc(tb, { type: 'triangle', f: midi(roots[k]), dur: 0.3, g: 0.26 });
        A.osc(tb, { type: 'square', f: midi(roots[k]), dur: 0.22, g: 0.045, lp: 500 });
        A.chord(tb + 0.25, pah[k], { type: 'square', dur: 0.12, g: 0.02, lp: 1500 });
        if (k % 2) A.snare(tb, 0.14, { dur: 0.12, rev: 0.1 }); else A.kick(tb, 0.28, { f: 110, dur: 0.25 });
        A.hat(tb + 0.25, 0.04);
      }
      [[1.0, 67], [1.25, 72], [1.5, 76], [1.75, 72], [2.0, 74], [2.25, 72], [2.5, 71], [2.75, 72], [3.0, 77], [3.25, 76], [3.5, 74], [3.75, 72], [4.0, 71], [4.25, 67], [4.5, 72]].forEach(([t, m]) => {
        A.osc(t, { type: 'sawtooth', f: midi(m), dur: 0.22, g: 0.04, lp: 2400, vib: [6, 4], rev: 0.15 });
        A.bell(t, midi(m + 12), { g: 0.02, dur: 0.5, rev: 0.2 });
      });
      for (let f = 10; f / 8 < 2.35; f += 2) A.osc(f / 8, { type: 'sawtooth', f: 170 + hash(f * 7) * 90, f2: 120 + hash(f) * 40, dur: 0.11, g: 0.08, lp: 1300, q: 5 });
      A.whoosh(2.5, 0.35, { f1: 300, f2: 1800, g: 0.13, pan: 0.5 });
      [3.0, 3.25].forEach(t => A.osc(t, { f: 700, f2: 260, glide: 0.1, dur: 0.16, g: 0.15 }));
      A.osc(3.4, { f: 300, f2: 1400, glide: 0.05, dur: 0.09, g: 0.16 });
      A.noise(3.4, { type: 'bandpass', f: 1800, q: 2, dur: 0.06, g: 0.18 });
      [3.45, 3.55].forEach((t, i) => A.osc(t, { type: 'triangle', f: 160 + i * 40, f2: 340 + i * 60, glide: 0.5, dur: 0.6, g: 0.11, vib: [16, 40] }));
      for (let k = 0; k < 7; k++) { const t = 3.6 + k * 0.17 + hash(k) * 0.05; A.osc(t, { f: 2600 + hash(k * 5) * 900, f2: 3800, glide: 0.05, dur: 0.07, g: 0.035, pan: lerp(-0.2, 0.7, k / 6) }); }
      A.osc(4.62, { type: 'sawtooth', f: midi(29), dur: 1.2, g: 0.08, lp: 380, a: 0.1, hold: true, rel: 0.3 });
      A.noise(4.65, { type: 'lowpass', f: 220, dur: 1.25, g: 0.18, swell: 0.95 });
      A.osc(5.3, { f: 1900, f2: 330, glide: 0.6, dur: 0.6, g: 0.07, vib: [7, 25], a: 0.03, hold: true, rel: 0.05 });
      A.impact(CO_LAND, 0.85);
      A.osc(CO_LAND, { type: 'sawtooth', f: 72, f2: 52, glide: 0.4, dur: 0.45, g: 0.12, lp: 600, vib: [26, 18] });
      A.noise(CO_LAND, { type: 'bandpass', f: 700, q: 0.7, dur: 0.25, g: 0.18, crush: true });
      A.whoosh(CO_LIFT, 0.4, { f1: 2000, f2: 300, g: 0.13 });
      [6.92, 7.05].forEach((t, i) => A.bell(t, midi(88 + i * 3), { g: 0.03, dur: 0.6 }));
      CO_LET.forEach((L, i) => {
        A.kick(L.at, 0.3, { f: 120, f2: 50, dur: 0.18 });
        A.noise(L.at, { type: 'bandpass', f: 1500, q: 0.9, dur: 0.06, g: 0.13 });
        A.osc(L.at, { type: 'sawtooth', f: midi([60, 62, 64, 65, 67, 69, 71][i]), dur: 0.2, g: 0.04, lp: 2200, rev: 0.15 });
      });
      A.whoosh(8.0, 0.28, { f1: 600, f2: 3000, g: 0.1, pan: -0.4 });
      A.kick(CO_STAMP, 0.65);
      A.noise(CO_STAMP, { type: 'lowpass', f: 900, dur: 0.15, g: 0.2 });
      A.chord(CO_STAMP, [48, 55, 60, 64, 67, 72], { type: 'sawtooth', dur: 1.5, g: 0.024, lp: 2400, a: 0.01, hold: true, rel: 0.6, spread: 8, rev: 0.4, width: 1 });
      A.osc(CO_STAMP, { type: 'triangle', f: midi(36), dur: 1.4, g: 0.22 });
      A.noise(CO_STAMP, { type: 'highpass', f: 6000, dur: 1.6, g: 0.07, rev: 0.5 });
    },
  });

  /* =====================================================================
     15 Whiteboard — after RSA Animate (Cognitive Media, 2010)
     ===================================================================== */
  const WMK = '"Permanent Marker", Fredoka, sans-serif', WCV = 'Caveat, cursive';
  const WK = '#1c1c1e', WR = '#e03a2c';
  const WY = 'rgba(255,186,40,0.8)', WO = 'rgba(255,124,60,0.62)', WBL = 'rgba(52,140,230,0.5)';
  const WSOLID = { [WY]: '#ffb627', [WO]: '#ff7a3c', [WBL]: '#2f86e0' };
  const smp = (fn, n) => Array.from({ length: n + 1 }, (_, i) => fn(i / n));
  const LN = (x0, y0, x1, y1) => smp(u => [lerp(x0, x1, u), lerp(y0, y1, u)], Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 10)));
  const ARC = (cx, cy, rx, ry, a0, a1) => smp(u => { const a = lerp(a0, a1, u); return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; }, Math.max(10, Math.ceil((Math.abs(a1 - a0) * Math.max(rx, ry)) / 9)));
  const BEZ = (p0, p1, p2, p3) => smp(u => { const v = 1 - u; return [0, 1].map(k => v * v * v * p0[k] + 3 * v * v * u * p1[k] + 3 * v * u * u * p2[k] + u * u * u * p3[k]); }, 30);
  const POLY = pts => pts.slice(1).reduce((acc, p, i) => acc.concat(LN(pts[i][0], pts[i][1], p[0], p[1]).slice(i ? 1 : 0)), []);
  function CR(pts, per = 8) {
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
  const zig = (cx, cy, rx, ry, n, ang) => {
    const ca = Math.cos(ang), sa = Math.sin(ang), out = [];
    for (let i = 0; i <= n; i++) {
      const v = -0.88 + (1.76 * i) / n, h = Math.sqrt(1 - v * v) * 0.9;
      (i % 2 ? [h, -h] : [-h, h]).forEach(u => { const x = u * rx, y = v * ry; out.push([cx + x * ca - y * sa, cy + x * sa + y * ca]); });
    }
    return out;
  };
  const geoLen = segs => segs.reduce((s, p) => { for (let i = 1; i < p.length; i++) s += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return s; }, 0);

  const WB = (() => {
    const items = [];
    let sd = 1;
    const wob = (p, a = 1.6) => { const s = sd++; return p.map(([x, y], i) => [x + vnoise(i * 0.11, s) * a, y + vnoise(i * 0.11, s + 50) * a]); };
    const S = (segs, col = WK, w = 7) => { segs = segs.map(p => wob(p)); const g = geoLen(segs); return { k: 's', segs, col, w, geo: g, len: g }; };
    const F = (pts, col = WY, w = 22) => { const g = geoLen([pts]); return { k: 'f', segs: [pts], col, w, geo: g, len: g * 0.3 }; };
    const T = (s, x, y, size, col = WK, align = 'center', font = WMK) => ({ k: 't', s, x, y, size, col, align, font, len: s.length * size * 0.42 });
    const grp = (t0, t1, list, gap = 0.04) => {
      const tot = list.reduce((a, b) => a + b.len, 0), av = t1 - t0 - gap * (list.length - 1);
      let tt = t0;
      list.forEach(I => { I.t0 = tt; I.t1 = tt + (av * I.len) / tot; tt = I.t1 + gap; items.push(I); });
    };
    const arrow = (p0, p1, p2, p3, col = WK) => {
      const a = Math.atan2(p3[1] - p2[1], p3[0] - p2[0]), L = 28;
      return S([BEZ(p0, p1, p2, p3), [[p3[0] - L * Math.cos(a - 0.5), p3[1] - L * Math.sin(a - 0.5)], p3, [p3[0] - L * Math.cos(a + 0.5), p3[1] - L * Math.sin(a + 0.5)]]], col, 7);
    };
    const person = (cx, cy) => S([ARC(cx, cy, 25, 25, -Math.PI / 2, Math.PI * 1.5), LN(cx, cy + 25, cx, cy + 88), POLY([[cx - 38, cy + 62], [cx, cy + 46], [cx + 38, cy + 62]]), POLY([[cx - 30, cy + 134], [cx, cy + 88], [cx + 30, cy + 134]])]);
    // headline
    grp(0.25, 0.95, [T('HOW IDEAS', 1000, 190, 108, WK, 'right')]);
    grp(1.0, 1.45, [T('SPREAD', 1032, 190, 108, WR, 'left')]);
    grp(1.5, 1.68, [S([BEZ([1030, 222], [1150, 236], [1300, 212], [1450, 222])], WR, 8)]);
    // central cloud
    const cloud = smp(u => { const a = Math.PI + u * TAU; const b = 1 + 0.13 * Math.abs(Math.sin(a * 4.5)); return [960 + Math.cos(a) * 225 * b, 590 + Math.sin(a) * 122 * b]; }, 90);
    grp(1.78, 2.12, [S([cloud])]);
    grp(2.15, 2.45, [T('IDEAS', 960, 628, 100)]);
    grp(2.48, 2.62, [F(zig(960, 592, 190, 92, 9, -0.3), WY, 24)]);
    // SPARK
    grp(2.66, 2.86, [arrow([742, 566], [700, 530], [660, 494], [606, 482])]);
    const head = CR([[335, 642], [318, 560], [322, 470], [350, 395], [405, 350], [470, 345], [525, 375], [548, 425], [552, 460], [580, 502], [552, 512], [561, 530], [548, 545], [554, 566], [540, 585], [505, 592], [492, 642]], 7);
    const bc = [425, 458], br = 38;
    const bulb = [ARC(bc[0], bc[1], br, br, Math.PI / 2 + 0.55, Math.PI * 2.5 - 0.55), POLY([[406, 491], [410, 516], [440, 516], [444, 491]]), POLY([[410, 526], [440, 526], [416, 536], [434, 536]]), POLY([[412, 491], [418, 468], [425, 482], [432, 468], [438, 491]])];
    const rays = [-150, -120, -90, -60, -30].map(d => { const a = (d * Math.PI) / 180; return LN(bc[0] + Math.cos(a) * 52, bc[1] + Math.sin(a) * 52, bc[0] + Math.cos(a) * 74, bc[1] + Math.sin(a) * 74); });
    grp(2.92, 3.86, [S([head]), S(bulb, WK, 6), S(rays, WK, 6), F(zig(425, 452, 30, 30, 6, 0.6), WY, 18), T('SPARK', 432, 712, 58), T('one mind', 432, 760, 42, WK, 'center', WCV)], 0.035);
    // SHARE
    grp(3.92, 4.07, [arrow([1178, 566], [1222, 530], [1262, 494], [1318, 482])]);
    grp(4.12, 5.0, [person(1500, 312), person(1396, 456), person(1604, 456),
      S([LN(1480, 334, 1416, 434), LN(1520, 334, 1584, 434), LN(1424, 462, 1576, 462)], WK, 5),
      F(zig(1500, 312, 18, 18, 4, 0.5), WO, 16), T('SHARE', 1500, 712, 58), T('many minds', 1500, 760, 42, WK, 'center', WCV)], 0.035);
    // SCALE
    grp(5.05, 5.2, [arrow([1135, 676], [1200, 730], [1260, 790], [1372, 834])]);
    grp(5.26, 6.05, [S([ARC(1440, 900, 84, 84, -Math.PI / 2, Math.PI * 1.5)]), S([ARC(1440, 900, 84, 24, 0, Math.PI), ARC(1440, 900, 34, 84, -Math.PI / 2, Math.PI * 1.5)], WK, 5),
      S([CR([[1404, 858], [1430, 850], [1446, 870], [1424, 896], [1400, 884], [1404, 858]], 6), CR([[1460, 915], [1490, 905], [1496, 935], [1470, 952], [1458, 932], [1460, 915]], 6)], WK, 5),
      F(zig(1440, 900, 70, 70, 8, 0.4), WBL, 22), T('SCALE', 1548, 918, 58, WK, 'left'), T('the whole world', 1548, 964, 42, WK, 'left', WCV)], 0.035);
    // TIME
    grp(6.1, 6.25, [arrow([785, 676], [720, 730], [660, 790], [590, 826])]);
    grp(6.3, 7.05, [S([ARC(520, 905, 80, 80, -Math.PI / 2, Math.PI * 1.5)]),
      S([LN(520, 836, 520, 848), LN(589, 905, 577, 905), LN(520, 974, 520, 962), LN(451, 905, 463, 905), POLY([[520, 858], [520, 905], [556, 926]])], WK, 6),
      S([ARC(520, 905, 110, 110, -2.3, 2.1), POLY([[520 + 110 * Math.cos(2.1) + 24, 905 + 110 * Math.sin(2.1) - 6], [520 + 110 * Math.cos(2.1), 905 + 110 * Math.sin(2.1)], [520 + 110 * Math.cos(2.1) + 8, 905 + 110 * Math.sin(2.1) - 26]])], WK, 6),
      F(zig(520, 905, 62, 62, 7, -0.3), WO, 18), T('TIME', 380, 928, 58, WK, 'right'), T('it compounds', 290, 1000, 42, WK, 'center', WCV)], 0.035);
    // final red accents
    const star = smp(u => { const k = u * 10, i = Math.floor(k) % 10, f = k - Math.floor(k), r0 = i % 2 ? 17 : 40, r1 = i % 2 ? 40 : 17, a0 = (i / 10) * TAU - Math.PI / 2, a1 = ((i + 1) / 10) * TAU - Math.PI / 2; return [1222 + lerp(Math.cos(a0) * r0, Math.cos(a1) * r1, f), 418 + lerp(Math.sin(a0) * r0, Math.sin(a1) * r1, f)]; }, 60);
    grp(7.85, 8.32, [S([BEZ([858, 652], [920, 660], [1000, 646], [1066, 650])], WR, 7), S([BEZ([872, 668], [930, 674], [1000, 664], [1052, 667])], WR, 6), S([star], WR, 6)], 0.03);
    return items;
  })();
  const WB_CAM = [[0, 930, 200, 1.65], [1.72, 930, 200, 1.65], [2.0, 960, 590, 1.6], [2.62, 960, 590, 1.6], [2.95, 560, 540, 1.6], [3.86, 560, 540, 1.6], [4.15, 1420, 520, 1.6], [5.02, 1420, 520, 1.6], [5.3, 1420, 820, 1.6], [6.08, 1420, 820, 1.6], [6.35, 520, 820, 1.6], [7.05, 520, 820, 1.6], [7.85, 960, 540, 1.0]];
  function wbCam(t) {
    const z = kf(t, WB_CAM.map(k => [k[0], k[3]]));
    const hw = 960 / z, hh = 540 / z;
    return { x: clamp(kf(t, WB_CAM.map(k => [k[0], k[1]])), hw, 1920 - hw), y: clamp(kf(t, WB_CAM.map(k => [k[0], k[2]])), hh, 1080 - hh), z };
  }
  function wbTextGeo(c, I) {
    if (I.w === undefined) { c.font = `${I.k === 't' && I.font === WCV ? 700 : 400} ${I.size}px ${I.font}`; I.w = c.measureText(I.s).width; }
    const x0 = I.align === 'right' ? I.x - I.w : I.align === 'center' ? I.x - I.w / 2 : I.x;
    return x0;
  }
  function wbPointAt(I, d) {
    for (const s of I.segs) for (let i = 1; i < s.length; i++) {
      const L = Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
      if (d <= L) { const u = L ? d / L : 0; return [lerp(s[i - 1][0], s[i][0], u), lerp(s[i - 1][1], s[i][1], u)]; }
      d -= L;
    }
    const s = I.segs[I.segs.length - 1]; return s[s.length - 1];
  }
  function wbTip(c, I, p) {
    if (I.k === 't') {
      const x0 = wbTextGeo(c, I);
      return [x0 + I.w * p, I.y - I.size * 0.32 + Math.sin(p * I.s.length * Math.PI * 1.6) * I.size * 0.26];
    }
    return wbPointAt(I, I.geo * p);
  }
  function wbPen(c, t) {
    let prev = null, next = null;
    for (const I of WB) {
      if (t >= I.t0 && t < I.t1) { const p = (t - I.t0) / (I.t1 - I.t0); const [x, y] = wbTip(c, I, p); return { x, y, I, on: true }; }
      if (I.t1 <= t) prev = I; else if (!next) next = I;
    }
    const A = prev ? wbTip(c, prev, 1) : [2350, 1450], B = next ? wbTip(c, next, 0) : [2450, 1550];
    const ta = prev ? prev.t1 : 0, tb = next ? next.t0 : prev.t1 + 0.55;
    const u = E.ioS(seg(t, ta, tb)), lift = Math.sin(Math.PI * u) * Math.min(60, Math.hypot(B[0] - A[0], B[1] - A[1]) * 0.15);
    return { x: lerp(A[0], B[0], u), y: lerp(A[1], B[1], u) - lift, I: next || prev, on: false };
  }
  function wbDrawPartial(c, I, p) {
    let rem = I.geo * p;
    c.beginPath();
    for (const s of I.segs) {
      if (rem <= 0) break;
      c.moveTo(s[0][0], s[0][1]);
      for (let i = 1; i < s.length; i++) {
        const L = Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]);
        if (rem >= L) { c.lineTo(s[i][0], s[i][1]); rem -= L; }
        else { const u = rem / L; c.lineTo(lerp(s[i - 1][0], s[i][0], u), lerp(s[i - 1][1], s[i][1], u)); rem = 0; break; }
      }
    }
    c.stroke();
  }
  function wbHandSprite(tipCol) {
    const cv = offscreen(1500, 440), g = cv.getContext('2d');
    g.translate(30, 230);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const skin = '#e6b291', skinD = '#c3835f', skinL = '#f6d4b8', edge = 'rgba(140,70,45,0.7)', crease = 'rgba(140,70,45,0.45)';
    // marker
    g.beginPath(); g.moveTo(0, 0); g.lineTo(28, -10); g.lineTo(28, 10); g.closePath(); g.fillStyle = tipCol; g.fill();
    g.fillStyle = '#3a3a3e'; rrect(g, 26, -13, 24, 26, 4); g.fill();
    const bg = g.createLinearGradient(0, -18, 0, 18);
    bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.45, '#ececee'); bg.addColorStop(1, '#a5a5aa');
    g.fillStyle = bg; rrect(g, 46, -18, 260, 36, 9); g.fill();
    g.fillStyle = tipCol; g.fillRect(124, -18, 22, 36);
    // hand + forearm silhouette
    const S = [[56, -26], [80, -42], [150, -58], [176, -94], [205, -118], [245, -124], [285, -114], [322, -94], [430, -112], [1480, -205], [1480, 135], [430, 74], [330, 56], [250, 50], [190, 42], [150, 30], [62, -4]];
    const sil = () => { g.beginPath(); S.forEach(([x, y], i) => { if (!i) { g.moveTo((x + S[S.length - 1][0]) / 2, (y + S[S.length - 1][1]) / 2); } const n = S[(i + 1) % S.length]; g.quadraticCurveTo(x, y, (x + n[0]) / 2, (y + n[1]) / 2); }); g.closePath(); };
    const hg = g.createLinearGradient(0, -130, 0, 70);
    hg.addColorStop(0, skinL); hg.addColorStop(0.5, skin); hg.addColorStop(1, skinD);
    sil(); g.fillStyle = hg; g.fill();
    g.save(); sil(); g.clip();
    const rg = g.createRadialGradient(240, -70, 10, 240, -70, 160);
    rg.addColorStop(0, 'rgba(255,235,215,0.55)'); rg.addColorStop(1, 'rgba(255,235,215,0)');
    g.fillStyle = rg; g.fillRect(60, -200, 400, 300);
    // sleeve
    g.fillStyle = '#2d4f7c'; g.beginPath(); g.moveTo(820, -190); g.lineTo(1500, -260); g.lineTo(1500, 200); g.lineTo(800, 110); g.closePath(); g.fill();
    g.fillStyle = '#3e6aa3'; g.beginPath(); g.moveTo(820, -190); g.lineTo(850, -192); g.lineTo(830, 112); g.lineTo(800, 110); g.closePath(); g.fill();
    g.restore();
    sil(); g.lineWidth = 3; g.strokeStyle = edge; g.stroke();
    // curled fingers and knuckles
    g.strokeStyle = crease; g.lineWidth = 3;
    [[198, -108, 168, -44], [236, -116, 214, -38], [274, -108, 258, -32]].forEach(([a, b, c2, d]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(a - 4, (b + d) / 2, c2, d); g.stroke(); });
    g.fillStyle = 'rgba(255,240,226,0.7)';
    [[188, -100], [226, -110], [265, -104]].forEach(([x, y]) => { ell(g, x, y, 13, 7, -0.3); g.fill(); });
    g.beginPath(); g.moveTo(108, -46); g.quadraticCurveTo(113, -30, 108, -14); g.stroke();
    g.beginPath(); g.moveTo(146, -54); g.quadraticCurveTo(152, -36, 146, -18); g.stroke();
    g.fillStyle = '#f7ddcf'; rrect(g, 60, -32, 24, 17, 7); g.fill();
    g.strokeStyle = crease; g.beginPath(); g.moveTo(350, -84); g.quadraticCurveTo(360, -10, 346, 50); g.stroke();
    // thumb over the barrel
    g.save(); g.translate(96, 20); g.rotate(0.14);
    g.fillStyle = skin; rrect(g, 0, -14, 120, 30, 15); g.fill(); g.lineWidth = 3; g.strokeStyle = edge; g.stroke();
    g.fillStyle = '#f7ddcf'; rrect(g, 4, -10, 24, 17, 7); g.fill();
    g.restore();
    return cv;
  }
  function wbBoard() {
    const cv = offscreen(1920, 1080), g = cv.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 1920, 1080);
    bg.addColorStop(0, '#fbfbf8'); bg.addColorStop(0.5, '#f6f6f2'); bg.addColorStop(1, '#efefea');
    g.fillStyle = bg; g.fillRect(0, 0, 1920, 1080);
    const r = rng(12);
    g.filter = 'blur(18px)';
    for (let i = 0; i < 22; i++) { g.fillStyle = `rgba(140,150,160,${0.025 + r() * 0.035})`; ell(g, r() * 1920, r() * 1080, 60 + r() * 220, 14 + r() * 50, r() * 3); g.fill(); }
    g.filter = 'none';
    g.strokeStyle = 'rgba(120,130,140,0.06)'; g.lineWidth = 3;
    for (let i = 0; i < 14; i++) { const x = r() * 1920, y = r() * 1080; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 60, y - 30, x + 120, y + 30, x + 200 * r(), y + 10); g.stroke(); }
    const sh = g.createLinearGradient(0, 0, 1920, 600);
    sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.45, 'rgba(255,255,255,0.5)'); sh.addColorStop(0.55, 'rgba(255,255,255,0)');
    g.fillStyle = sh; g.fillRect(0, 0, 1920, 1080);
    return cv;
  }

  MG.film({
    id: 'whiteboard',
    dur: 10,
    poster: 9.4,
    fonts: [['400 108px "Permanent Marker"', 'HOWIDEASPRKCLTM'], ['700 42px Caveat', 'one mind many minds the whole world it compounds']],
    meta: {
      cn: '白板手绘', en: 'Whiteboard', era: '2010 —',
      origin: '英国皇家艺术学会（RSA）与 Cognitive Media 合作的 RSA Animate 系列：把讲座录音逐句画成白板涂鸦，手握马克笔入镜、快进描绘。',
      works: '代表作：RSA Animate《Drive: The Surprising Truth About What Motivates Us》（Dan Pink，2010）；《Changing Education Paradigms》（Ken Robinson，2010）',
      tech: ['笔尖引领的逐笔描绘', '快进式时间压缩 + 镜头跟随', '思维导图收尾与荧光强调色'],
      accent: '#e03a2c',
    },
    setup() { return { board: wbBoard(), hands: {} }; },
    draw(c, t, W, H, st) {
      c.fillStyle = '#f4f4f0'; c.fillRect(0, 0, W, H);
      const cam = wbCam(t);
      const toS = (x, y) => [(x - cam.x) * cam.z + W / 2, (y - cam.y) * cam.z + H / 2];
      c.save();
      c.translate(W / 2, H / 2); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y);
      c.drawImage(st.board, 0, 0);
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (const I of WB) {
        if (t < I.t0) break;
        const p = Math.min(1, (t - I.t0) / (I.t1 - I.t0));
        if (I.k === 't') {
          const x0 = wbTextGeo(c, I);
          c.save();
          c.beginPath(); c.rect(x0 - 12, I.y - I.size * 1.25, (I.w + 24) * (p >= 1 ? 1.2 : p) + 12, I.size * 1.7); c.clip();
          c.font = `${I.font === WCV ? 700 : 400} ${I.size}px ${I.font}`; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
          c.fillStyle = I.col; c.fillText(I.s, x0, I.y);
          c.restore();
        } else {
          c.save();
          if (I.k === 'f') c.globalCompositeOperation = 'multiply';
          c.strokeStyle = I.col; c.lineWidth = I.w;
          wbDrawPartial(c, I, p);
          if (I.k === 's') { c.globalAlpha = 0.18; c.strokeStyle = '#ffffff'; c.lineWidth = I.w * 0.25; c.translate(-1.2, -1.2); wbDrawPartial(c, I, p); }
          c.restore();
        }
      }
      c.restore();

      // the drawing hand (with fast-forward ghosting)
      const handAt = (tt, alpha) => {
        const P = wbPen(c, tt);
        const [sx, sy] = toS(P.x, P.y);
        if (sx < -400 || sy < -400 || sx > W + 900 || sy > H + 700) return P;
        const col = P.I ? (WSOLID[P.I.col] || P.I.col) : WK;
        if (!st.hands[col]) st.hands[col] = wbHandSprite(col);
        const wob = P.on ? Math.sin(tt * 47) * 0.03 : 0;
        c.save(); c.globalAlpha = alpha;
        c.translate(sx, sy); c.rotate(0.88 + wob); c.scale(cam.z * 0.78, cam.z * 0.78);
        if (alpha > 0.9) { c.shadowColor = 'rgba(30,30,40,0.22)'; c.shadowBlur = 30; c.shadowOffsetX = 26; c.shadowOffsetY = 34; }
        c.drawImage(st.hands[col], -30, -230);
        c.restore();
        return P;
      };
      const p0 = wbPen(c, t), p1 = wbPen(c, t - 0.03);
      if (Math.hypot(p0.x - p1.x, p0.y - p1.y) * cam.z > 70) { handAt(t - 0.04, 0.07); handAt(t - 0.02, 0.12); }
      handAt(t, 1);
      vignette(c, W, H, 0.12, '40,40,50');
      grain(c, W, H, t, 0.035, 'overlay');
    },
    score(A) {
      A.noise(0.18, { type: 'highpass', f: 3000, dur: 0.03, g: 0.25 });
      A.osc(0.18, { f: 1800, f2: 900, dur: 0.04, g: 0.08 });
      WB.forEach((I, n) => {
        const d = I.t1 - I.t0;
        const sx = I.k === 't' ? I.x : I.segs[0][0][0], pan = clamp((sx / 1920 - 0.5) * 0.9, -0.6, 0.6);
        if (I.k === 't') {
          const steps = Math.max(2, Math.round(d / 0.055));
          for (let k = 0; k < steps; k++) A.noise(I.t0 + (k * d) / steps, { type: 'bandpass', f: 2600 + hash(n * 13 + k) * 1800, q: 2.2, dur: (d / steps) * 0.85, g: 0.05, pan });
        } else if (I.k === 'f') {
          const steps = Math.max(2, Math.round(d / 0.04));
          for (let k = 0; k < steps; k++) A.noise(I.t0 + (k * d) / steps, { type: 'bandpass', f: 1500 + hash(n + k) * 600, q: 1.4, dur: 0.035, g: 0.05, pan });
        } else {
          A.noise(I.t0, { type: 'bandpass', f: 3000 + hash(n) * 1400, q: 2.4, dur: d + 0.02, g: 0.045, hold: true, rel: 0.02, pan });
          if (n % 3 === 0) A.osc(I.t0, { f: 2300 + hash(n) * 500, dur: Math.min(0.12, d), g: 0.012, vib: [30, 60], pan });
        }
      });
      // ukulele strums, 120 bpm
      const CH = [[60, 64, 67, 72], [59, 62, 67, 71], [57, 60, 64, 69], [57, 60, 65, 69]], ROOT = [48, 43, 45, 41];
      for (let k = 0; k < 14; k++) {
        const tb = 0.25 + k * 0.5, ci = Math.floor(k / 2) % 4;
        CH[ci].forEach((m, i) => A.pluck(tb + i * 0.012, midi(m), { g: 0.11, dur: 0.9, bright: 0.6, pan: (i - 1.5) * 0.15 }));
        CH[ci].slice().reverse().forEach((m, i) => A.pluck(tb + 0.25 + i * 0.01, midi(m), { g: 0.05, dur: 0.5, bright: 0.5 }));
        if (k % 2 === 0) A.pluck(tb, midi(ROOT[ci]), { g: 0.22, dur: 1.0, bright: 0.4 });
        if (tb >= 1.7) { if (k % 2 === 1) A.kick(tb, 0.3); else A.clap(tb, 0.1); }
        A.hat(tb + 0.25, 0.03, false, { pan: 0.3 });
      }
      A.whoosh(1.72, 0.3, { f1: 500, f2: 2200, g: 0.06 });
      [2.62, 3.86, 5.02, 6.08].forEach(t => A.whoosh(t, 0.3, { f1: 400, f2: 1800, g: 0.06 }));
      A.chord(7.05, [48, 55, 60, 64], { type: 'triangle', dur: 0.85, g: 0.035, a: 0.4, hold: true, rel: 0.2, rev: 0.4 });
      A.riser(7.05, 0.8, { g: 0.08 });
      A.whoosh(7.1, 0.75, { f1: 2400, f2: 300, g: 0.1 });
      [[60, 64, 67, 72, 76]].forEach(ch => ch.forEach((m, i) => A.pluck(7.85 + i * 0.015, midi(m), { g: 0.13, dur: 1.4, bright: 0.65 })));
      A.pluck(7.85, midi(36), { g: 0.25, dur: 1.6, bright: 0.4 });
      A.kick(7.85, 0.35);
      [60, 64, 67, 72, 79].forEach((m, i) => A.pluck(8.34 + i * 0.02, midi(m), { g: 0.14, dur: 2.2, bright: 0.7, pan: (i - 2) * 0.15 }));
      A.pluck(8.34, midi(36), { g: 0.25, dur: 2.2, bright: 0.4 });
      A.bell(8.34, midi(84), { g: 0.06, dur: 1.8 });
      A.noise(8.6, { type: 'highpass', f: 3000, dur: 0.03, g: 0.2 });
    },
  });

  /* =====================================================================
     08 Pixel art — 8-bit, 320×180, PICO-8 palette
     ===================================================================== */
  const PAL = { k: '#000000', n: '#1d2b53', p: '#7e2553', g: '#008751', b: '#ab5236', d: '#5f574f', l: '#c2c3c7', w: '#fff1e8', r: '#ff004d', o: '#ffa300', y: '#ffec27', G: '#00e436', B: '#29adff', i: '#83769c', P: '#ff77a8', s: '#ffccaa' };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const PF = {};
  ('A .###. #...# #...# ##### #...# #...# #...#|B ####. #...# #...# ####. #...# #...# ####.|C .###. #...# #.... #.... #.... #...# .###.|D ####. #...# #...# #...# #...# #...# ####.|E ##### #.... #.... ####. #.... #.... #####|F ##### #.... #.... ####. #.... #.... #....|G .###. #...# #.... #.### #...# #...# .####|H #...# #...# #...# ##### #...# #...# #...#|I .###. ..#.. ..#.. ..#.. ..#.. ..#.. .###.|J ..### ...#. ...#. ...#. ...#. #..#. .##..|K #...# #..#. #.#.. ##... #.#.. #..#. #...#|L #.... #.... #.... #.... #.... #.... #####|M #...# ##.## #.#.# #.#.# #...# #...# #...#|N #...# #...# ##..# #.#.# #..## #...# #...#|O .###. #...# #...# #...# #...# #...# .###.|P ####. #...# #...# ####. #.... #.... #....|Q .###. #...# #...# #...# #.#.# #..#. .##.#|R ####. #...# #...# ####. #.#.. #..#. #...#|S .#### #.... #.... .###. ....# ....# ####.|T ##### ..#.. ..#.. ..#.. ..#.. ..#.. ..#..|U #...# #...# #...# #...# #...# #...# .###.|V #...# #...# #...# #...# #...# .#.#. ..#..|W #...# #...# #...# #.#.# #.#.# #.#.# .#.#.|X #...# #...# .#.#. ..#.. .#.#. #...# #...#|Y #...# #...# .#.#. ..#.. ..#.. ..#.. ..#..|Z ##### ....# ...#. ..#.. .#... #.... #####|0 .###. #...# #..## #.#.# ##..# #...# .###.|1 ..#.. .##.. ..#.. ..#.. ..#.. ..#.. .###.|2 .###. #...# ....# ...#. ..#.. .#... #####|3 ##### ...#. ..#.. ...#. ....# #...# .###.|4 ...#. ..##. .#.#. #..#. ##### ...#. ...#.|5 ##### #.... ####. ....# ....# #...# .###.|6 ..##. .#... #.... ####. #...# #...# .###.|7 ##### ....# ...#. ..#.. .#... .#... .#...|8 .###. #...# #...# .###. #...# #...# .###.|9 .###. #...# #...# .#### ....# ...#. .##..|! ..#.. ..#.. ..#.. ..#.. ..#.. ..... ..#..|- ..... ..... ..... .###. ..... ..... .....|x ..... ..... #...# .#.#. ..#.. .#.#. #...#|? .###. #...# ....# ..##. ..#.. ..... ..#..|. ..... ..... ..... ..... ..... ..... ..#..')
    .split('|').forEach(e => { const [k, ...rows] = e.split(' '); PF[k] = rows; });
  const px = (g, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  function ptext(g, s, x, y, col, sc = 1, colFn) {
    let cx = x;
    for (const ch of s) {
      const gl = PF[ch];
      if (gl) for (let r = 0; r < 7; r++) for (let k = 0; k < 5; k++) if (gl[r][k] === '#') px(g, cx + k * sc, y + r * sc, sc, sc, colFn ? colFn(r) : col);
      cx += 6 * sc;
    }
  }
  const pw = (s, sc = 1) => s.length * 6 * sc - sc;
  function ptextO(g, s, x, y, col, sc, outline, shadow, colFn) {
    if (shadow) ptext(g, s, x + sc, y + sc + 1, shadow, sc);
    [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([dx, dy]) => ptext(g, s, x + dx, y + dy, outline, sc));
    ptext(g, s, x, y, col, sc, colFn);
  }
  function sprite(rows) {
    const cv = offscreen(rows[0].length, rows.length), g = cv.getContext('2d');
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') px(g, x, y, 1, 1, PAL[ch]); }));
    return cv;
  }
  const HB = ['....kkkk....', '...kBBBBkk..', '..kBBBBBBBk.', '..kBBBssssk.', '..kBBsskskk.', '..kBBsssssk.', '...kBkssskk.', '.rrrrrrrrk..'];
  const HB2 = ['...knnnnnk..', '..knnnnnnsk.', '..ksknnnnk..', '...knnnnk...'];
  const HLEG = {
    idle: ['...kbk.kbk..', '...kbk.kbk..', '..kkk..kkk..'],
    run0: ['..kbk...kbk.', '.kbbk...kbbk', '.kkk.....kkk'],
    run1: ['....kbbk....', '....kbbk....', '....kkkk....'],
    run2: ['...kbkkbk...', '..kbbk.kbk..', '..kkk..kkk..'],
    jump: ['...kbk.kbbk.', '..kbbk..kk..', '..kkk.......'],
  };
  const SCARF = ['rr.krrrrk...', '.rrkrrrrk...'];
  const SLIME = ['....kkkk....', '..kkppppkk..', '.kppppppppk.', '.kpwkppwkpk.', 'kppwkppwkppk', 'kppppppppppk', 'kpppkkkkpppk', 'kppppppppppk', '.kkkkkkkkkk.'];
  const SLIME_F = ['..kkkkkkkk..', '.kpppppppppk', 'kpkkppppkkpk', '.kkkkkkkkkk.'];
  const COIN = [
    ['..kkkk..', '.kyyyyk.', 'kyywyyok', 'kyywyyok', 'kyywyyok', 'kyyyyyok', '.kyyyok.', '..kkkk..'],
    ['...kk...', '..kyyk..', '..kywk..', '..kywk..', '..kywk..', '..kyok..', '..kyok..', '...kk...'],
    ['...kk...', '...ko...', '...ko...', '...ko...', '...ko...', '...ko...', '...ko...', '...kk...'],
  ];
  const SPARK = [['..w..', '.wyw.', 'wyyyw', '.wyw.', '..w..'], ['.....', '..w..', '.wyw.', '..w..', '.....']];
  const STAR = ['....k....', '...kyk...', '...kyk...', 'kkkkyykkk', 'kyyyyyyyk', '.kyyyyyk.', '..kyyyk..', '.kyykyyk.', 'kkk...kkk'];
  const PINE = ['...n...', '..ngn..', '..ngn..', '.nggGn.', '.ngGgn.', 'nggGggn', 'ngGgggn', '.nnbnn.', '...b...'];
  const CLOUD = ['......wwww..........', '....wwwwwwww..ww....', '..wwwwwwwwwwwwwwww..', '.wwwwwwwwwwwwwwwwww.', 'wwwwwwwwwwwwwwwwwwww', 'wllwwwwllwwwwwllwwlw', '.llllllllllllllllll.'];
  const GROUND = 148, PV = 75, FLAG_X = 460, PIT = [368, 400], BLOCK = [306, 87];
  const PJ = [[2.6, 0.55, 28, 0], [3.7, 0.5, 24, 10], [4.2, 0.4, 16, -10], [5.0, 0.5, 30, 0], [5.9, 0.6, 30, 0]];
  function pxHero(t) {
    if (t < 1.6) return { x: 40, h: 0, f: Math.floor(t * 2) % 4 === 3 ? 'idle' : 'idle' };
    if (t < 6.85) {
      const x = 40 + PV * (t - 1.6);
      for (const [t0, d, hh, end] of PJ) if (t >= t0 && t < t0 + d) {
        const u = (t - t0) / d;
        const base = end > 0 ? end * u : end < 0 ? -end * (1 - u) : 0;
        return { x, h: base + hh * 4 * u * (1 - u), f: 'jump' };
      }
      return { x, h: 0, f: ['run0', 'run1', 'run2', 'run1'][Math.floor(t * 12) % 4] };
    }
    if (t < 7.2) { const u = seg(t, 6.85, 7.2); return { x: lerp(433.75, 453, u), h: 46 * E.outQ(u), f: 'jump' }; }
    if (t < 7.7) return { x: 453, h: lerp(46, 0, seg(t, 7.2, 7.7)), f: 'jump' };
    if (t < 7.85) { const u = seg(t, 7.7, 7.85); return { x: lerp(453, 466, u), h: 10 * 4 * u * (1 - u), f: 'jump' }; }
    if (t < 8.4) return { x: lerp(466, 500, seg(t, 7.85, 8.4)), h: 0, f: ['run0', 'run1', 'run2', 'run1'][Math.floor(t * 12) % 4] };
    if (t < 9.0) { const u = (t - 8.4) / 0.2; return { x: 500, h: 9 * Math.abs(Math.sin(Math.PI * u)), f: Math.abs(Math.sin(Math.PI * u)) > 0.2 ? 'jump' : 'idle' }; }
    return { x: 500, h: 0, f: 'idle' };
  }
  const PX_COINS = (() => {
    const list = [];
    const at = x => 1.6 + (x - 40) / PV;
    [85, 97].forEach(x => list.push({ x, h: 6 }));
    [0.25, 0.5, 0.75].forEach(u => { const tt = 2.6 + 0.55 * u; list.push({ x: 40 + PV * (tt - 1.6), h: 28 * 4 * u * (1 - u) + 8 }); });
    [258, 270].forEach(x => list.push({ x, h: 12 }));
    list.push({ x: 384, h: 36 });
    list.push({ x: 420, h: 6 });
    list.forEach(c => (c.tc = at(c.x)));
    return list;
  })();
  const PX_FW = [[8.05, 48, 52, 'B'], [8.35, 276, 40, 'P'], [8.65, 70, 96, 'G']];
  const PX_STARS = (() => { const r = rng(88); return Array.from({ length: 34 }, () => ({ x: Math.floor(r() * 320), y: Math.floor(r() * 56), b: r() < 0.3 })); })();
  const PX_TIME_END = 300 - Math.floor((7.2 - 1.6) * 4);
  function pxCoins(t) { return PX_COINS.filter(c => c.tc <= t).length + (t >= 5.25 ? 1 : 0); }
  function pxScore(t) {
    const tally = Math.round(PX_TIME_END * seg(t, 8.0, 8.8));
    return pxCoins(t) * 200 + (t >= 4.2 ? 1000 : 0) + tally * 10;
  }
  function pxTime(t) {
    if (t >= 8.0) return Math.round(PX_TIME_END * (1 - seg(t, 8.0, 8.8)));
    return t < 1.6 ? 300 : 300 - Math.floor((Math.min(t, 7.2) - 1.6) * 4);
  }
  function hexRGB(h) { return [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)); }
  function pxSky() {
    const cv = offscreen(320, 180), g = cv.getContext('2d'), d = g.createImageData(320, 180);
    const stops = [[0, 'n'], [62, 'p'], [104, 'P'], [138, 'o'], [180, 'o']];
    for (let y = 0; y < 180; y++) {
      let i = 0; while (stops[i + 1][0] <= y) i++;
      const f = (y - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
      for (let x = 0; x < 320; x++) {
        const col = hexRGB(PAL[f > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 ? stops[i + 1][1] : stops[i][1]]);
        const o = (y * 320 + x) * 4; d.data[o] = col[0]; d.data[o + 1] = col[1]; d.data[o + 2] = col[2]; d.data[o + 3] = 255;
      }
    }
    g.putImageData(d, 0, 0);
    return cv;
  }
  function pxSun() {
    const cv = offscreen(44, 44), g = cv.getContext('2d');
    for (let y = 0; y < 44; y++) for (let x = 0; x < 44; x++) {
      const dx = x - 21.5, dy = y - 21.5;
      if (dx * dx + dy * dy > 20.5 * 20.5) continue;
      if (y > 24 && (y % 4 === 0 || (y > 34 && y % 4 === 1))) continue;
      px(g, x, y, 1, 1, PAL[y < 16 ? 'y' : 'o']);
    }
    return cv;
  }
  function pxMountains() {
    const cv = offscreen(640, 180), g = cv.getContext('2d');
    const topF = x => { let h = 0; [[5, 26, 0.3], [9, 14, 1.7], [16, 6, 4]].forEach(([k, a, ph]) => { const u = (((x / 640) * k + ph / TAU) % 1 + 1) % 1; h += a * (1 - Math.abs(u * 2 - 1)); }); return 124 - h; };
    for (let x = 0; x < 640; x++) {
      const y0 = Math.round(topF(x)), shade = topF(x + 0.5) > topF(x - 0.5);
      for (let y = y0; y < 180; y++) {
        const dith = y > 118 && (y - 118) / 14 > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
        px(g, x, y, 1, 1, PAL[shade || dith ? 'n' : 'i']);
      }
      if (y0 < 96) px(g, x, y0, 1, 2 + ((x * 7) % 3), PAL[shade ? 'l' : 'w']);
    }
    return cv;
  }
  function pxHills() {
    const cv = offscreen(640, 180), g = cv.getContext('2d');
    const top = x => Math.round(134 - 15 * (0.5 + 0.5 * Math.cos((x * TAU * 3) / 640)) - 8 * (0.5 + 0.5 * Math.cos((x * TAU * 7) / 640 + 1)));
    for (let x = 0; x < 640; x++) {
      const y0 = top(x);
      for (let y = y0; y < 180; y++) {
        const dk = y > 138 && (y - 138) / 20 > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
        px(g, x, y, 1, 1, PAL[y === y0 ? 'G' : dk ? 'n' : 'g']);
      }
    }
    const pine = sprite(PINE), r = rng(3);
    for (let i = 0; i < 26; i++) { const x = Math.floor(r() * 630); g.drawImage(pine, x, top(x + 3) - 7); }
    return cv;
  }
  function pxLevel() {
    const cv = offscreen(720, 180), g = cv.getContext('2d');
    for (let x = 0; x < 720; x += 16) {
      if (x >= PIT[0] && x < PIT[1]) continue;
      for (let yy = 0; yy < 32; yy++) for (let xx = 0; xx < 16; xx++) {
        const y = GROUND + yy;
        let col = 'b';
        if (yy === 0) col = 'G';
        else if (yy < 3) col = (xx + yy) % 5 === 0 ? 'G' : 'g';
        else if (yy === 3) col = xx % 3 === 0 ? 'g' : 'b';
        else if ((xx * 3 + yy * 5 + Math.floor(x / 16) * 7) % 11 === 0) col = 'p';
        else if ((xx * 5 + yy * 3) % 17 === 0) col = 'o';
        px(g, x + xx, y, 1, 1, PAL[col]);
      }
    }
    for (let y = GROUND; y < 180; y++) for (let x = PIT[0]; x < PIT[1]; x++) px(g, x, y, 1, 1, PAL[(y - GROUND) / 14 > (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16 ? 'k' : 'n']);
    px(g, PIT[0], GROUND, 1, 32, PAL.p); px(g, PIT[1] - 1, GROUND, 1, 32, PAL.p);
    // bushes
    [[52, 3], [196, 2], [330, 2], [430, 3], [640, 2]].forEach(([bx, n]) => {
      for (let k = 0; k < n; k++) for (let y = -9; y <= 0; y++) for (let x = -7; x <= 7; x++) {
        const d = x * x + (y * 1.4) * (y * 1.4);
        if (d > 49) continue;
        px(g, bx + k * 9 + x, GROUND - 1 + y, 1, 1, PAL[d > 30 ? 'g' : (x + y) % 4 === 0 ? 'w' : 'G']);
      }
    });
    // bricks flanking the ? block
    [BLOCK[0] - 16, BLOCK[0] + 16].forEach(bx => {
      px(g, bx, BLOCK[1], 16, 16, PAL.b);
      for (let r = 0; r < 4; r++) { px(g, bx, BLOCK[1] + r * 4 + 3, 16, 1, PAL.k); px(g, bx + (r % 2 ? 4 : 11), BLOCK[1] + r * 4, 1, 3, PAL.k); }
      px(g, bx, BLOCK[1], 16, 1, PAL.o);
    });
    // flag pole
    px(g, FLAG_X - 1, 58, 2, GROUND - 58, PAL.l); px(g, FLAG_X - 1, 58, 1, GROUND - 58, PAL.w);
    px(g, FLAG_X - 2, 53, 4, 4, PAL.G); px(g, FLAG_X - 2, 53, 1, 1, PAL.k); px(g, FLAG_X + 1, 53, 1, 1, PAL.k);
    px(g, FLAG_X - 4, GROUND - 4, 8, 4, PAL.d);
    // castle
    const brick = (x0, y0, w, h) => {
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
        const ry = y - y0, row = Math.floor(ry / 6), mort = ry % 6 === 5 || (x - x0 + (row % 2) * 5) % 10 === 9;
        px(g, x, y, 1, 1, PAL[mort ? 'd' : (x + y) % 9 === 0 ? 'w' : 'l']);
      }
    };
    brick(520, 108, 80, 40); brick(540, 80, 40, 28);
    for (let x = 520; x < 600; x += 10) brick(x, 101, 6, 7);
    for (let x = 540; x < 580; x += 10) brick(x, 73, 6, 7);
    for (let y = 126; y < GROUND; y++) for (let x = 551; x < 569; x++) { const dx = x - 559.5, dy = y - 134; if (y >= 134 || dx * dx + dy * dy <= 81) px(g, x, y, 1, 1, PAL.k); }
    px(g, 557, 86, 6, 10, PAL.k); px(g, 532, 116, 4, 7, PAL.k); px(g, 584, 116, 4, 7, PAL.k);
    px(g, 560, 56, 1, 17, PAL.l);
    return cv;
  }
  function pxBlock(used) {
    const cv = offscreen(16, 16), g = cv.getContext('2d');
    px(g, 0, 0, 16, 16, PAL.k);
    px(g, 1, 1, 14, 14, PAL[used ? 'b' : 'o']);
    if (!used) { px(g, 1, 1, 14, 1, PAL.y); px(g, 1, 1, 1, 14, PAL.y); ptext(g, '?', 6, 5, PAL.b); ptext(g, '?', 5, 4, PAL.w); }
    [[2, 2], [13, 2], [2, 13], [13, 13]].forEach(([x, y]) => px(g, x, y, 1, 1, PAL[used ? 'p' : 'b']));
    return cv;
  }

  MG.film({
    id: 'pixel',
    dur: 10,
    poster: 9.4,
    fonts: [],
    meta: {
      cn: '像素', en: 'Pixel art', era: '1983 —',
      origin: '源自 8 位家用游戏机的硬件限制：极低分辨率、有限调色板、图块背景与精灵角色（Famicom / NES，1983）。',
      works: '代表作：《超级马力欧兄弟》（任天堂，1985）；《洛克人》（Capcom，1987）；《蔚蓝 Celeste》（Maddy Makes Games，2018）',
      tech: ['320×180 低分辨率 + 最近邻放大', 'PICO-8 16 色调色板与有序抖动', '方波 / 三角波 / 噪声三声道芯片音乐'],
      accent: '#ff004d',
    },
    setup() {
      const buf = offscreen(320, 180), g = buf.getContext('2d');
      g.imageSmoothingEnabled = false;
      const hero = {};
      Object.keys(HLEG).forEach(k => {
        const f = k === 'run0' || k === 'run2' ? 1 : 0;
        hero[k] = sprite([...HB, SCARF[f], ...HB2, ...HLEG[k]]);
      });
      const scan = offscreen(8, 6), sg = scan.getContext('2d');
      sg.fillStyle = 'rgba(0,0,0,0.32)'; sg.fillRect(0, 4, 8, 2);
      sg.fillStyle = 'rgba(255,0,60,0.03)'; sg.fillRect(0, 0, 2, 4); sg.fillStyle = 'rgba(0,255,120,0.03)'; sg.fillRect(2, 0, 3, 4); sg.fillStyle = 'rgba(40,120,255,0.03)'; sg.fillRect(5, 0, 3, 4);
      return {
        buf, g, hero, sky: pxSky(), sun: pxSun(), mtn: pxMountains(), hills: pxHills(), level: pxLevel(),
        slime: sprite(SLIME), slimeF: sprite(SLIME_F), coins: COIN.map(sprite), spark: SPARK.map(sprite), star: sprite(STAR), cloud: sprite(CLOUD),
        block: pxBlock(false), used: pxBlock(true), scan,
      };
    },
    draw(c, t, W, H, st) {
      const g = st.g;
      const hr = pxHero(t), camX = Math.round(clamp(hr.x - 110, 0, 380));
      g.drawImage(st.sky, 0, 0);
      PX_STARS.forEach((s, i) => { if (hash(i * 3.3 + Math.floor(t * 3)) > 0.22) px(g, s.x, s.y, 1, 1, s.b ? PAL.w : PAL.l); });
      g.drawImage(st.sun, Math.round(232 - camX * 0.05), 74);
      const lay = (cv, f) => { const o = -(Math.round(camX * f) % 640); g.drawImage(cv, o, 0); g.drawImage(cv, o + 640, 0); };
      lay(st.mtn, 0.15);
      [[30, 34], [150, 52], [250, 30], [400, 44], [540, 36]].forEach(([x, y]) => { const xx = ((((x - camX * 0.3 - t * 4) % 640) + 640) % 640) - 40; g.drawImage(st.cloud, Math.round(xx), y); });
      lay(st.hills, 0.45);
      g.drawImage(st.level, -camX, 0);
      // flag on the pole + castle pennant
      const fy = Math.round(t < 7.2 ? 60 : lerp(60, 134, seg(t, 7.2, 7.7)));
      for (let r = 0; r < 9; r++) { const w = 11 - Math.abs(r - 4) * 2; px(g, FLAG_X - 1 - w - camX, fy + r, w, 1, PAL[r === 4 ? 'w' : 'G']); }
      const wave = Math.floor(t * 4) % 2;
      for (let r = 0; r < 5; r++) px(g, 561 - camX, 57 + r, 7 - Math.abs(r - 2) - (wave && r % 2 ? 1 : 0), 1, PAL.r);
      // ? block and its coin
      const bump = t >= 5.25 && t < 5.4 ? Math.round(3 * Math.sin(Math.PI * seg(t, 5.25, 5.4))) : 0;
      g.drawImage(t >= 5.25 ? st.used : st.block, BLOCK[0] - camX, BLOCK[1] - bump);
      if (t >= 5.25 && t < 5.7) {
        const u = seg(t, 5.25, 5.7);
        g.drawImage(st.coins[[0, 1, 2, 1][Math.floor(t * 20) % 4]], BLOCK[0] + 4 - camX, Math.round(BLOCK[1] - 10 - 36 * 4 * u * (1 - u) + u * 6));
      }
      if (t >= 5.7 && t < 6.3) ptextO(g, '200', BLOCK[0] - 1 - camX, Math.round(60 - (t - 5.7) * 20), PAL.w, 1, PAL.k);
      // coins
      PX_COINS.forEach((cn, i) => {
        const x = Math.round(cn.x - 4 - camX), y = Math.round(GROUND - cn.h - 8);
        if (t < cn.tc) g.drawImage(st.coins[[0, 1, 2, 1][(Math.floor(t * 10) + i) % 4]], x, y);
        else if (t < cn.tc + 0.25) g.drawImage(st.spark[Math.floor((t - cn.tc) * 12) % 2], x + 1, y + 1);
      });
      // slime
      if (t < 4.2) {
        const xe = 235 + 12 * (4.2 - t);
        g.drawImage(st.slime, Math.round(xe - 6 - camX), GROUND - 9 + (Math.floor(t * 6) % 2));
      } else if (t < 4.75 && (t < 4.5 || Math.floor(t * 16) % 2)) g.drawImage(st.slimeF, 229 - camX, GROUND - 4);
      if (t >= 4.2 && t < 4.9) ptextO(g, '1000', 224 - camX, Math.round(118 - (t - 4.2) * 24), PAL.w, 1, PAL.k);
      // hero
      g.drawImage(st.hero[hr.f], Math.round(hr.x - 6 - camX), Math.round(GROUND - hr.h - 16));
      // HUD
      const hud = (s, x, y, col = PAL.w) => ptextO(g, s, x, y, col, 1, PAL.n);
      hud('SCORE', 8, 5); hud(String(pxScore(t)).padStart(6, '0'), 8, 14);
      g.drawImage(st.coins[0], 98, 13);
      hud('x' + String(pxCoins(t)).padStart(2, '0'), 108, 14, PAL.y);
      hud('WORLD', 176, 5); hud('1-1', 182, 14);
      hud('TIME', 268, 5); hud(String(pxTime(t)).padStart(3, '0'), 274, 14);
      // title screen
      if (t < 1.95) {
        const ty = Math.round(t < 1.6 ? kf(t, [[0.4, -44], [0.85, 36, E.outB]]) : lerp(36, -60, E.inQ(seg(t, 1.6, 1.95))));
        const rowCol = r => PAL[['y', 'y', 'o', 'o', 'r', 'r', 'p'][r]];
        if (t >= 0.4) {
          ptext(g, 'PIXEL', 88 + 2, ty + 3, PAL.k, 5);
          [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => ptext(g, 'PIXEL', 88 + dx, ty + dy, PAL.n, 5));
          ptext(g, 'PIXEL', 88, ty, PAL.y, 5, rowCol);
          const sub = '- 8 BIT QUEST -';
          if (t >= 0.9) ptextO(g, sub, 160 - Math.floor(pw(sub) / 2), ty + 42, PAL.w, 1, PAL.n);
          const blink = t < 1.45 ? Math.floor(t * 3) % 2 === 0 : Math.floor(t * 16) % 2 === 0;
          if (t >= 1.0 && blink && t < 1.6) ptextO(g, 'PRESS START', 160 - Math.floor(pw('PRESS START') / 2), ty + 62, PAL.w, 1, PAL.k);
        }
      }
      // level clear
      if (t >= 7.85) {
        const y = Math.round(kf(t, [[7.85, -20], [8.15, 34, E.outB]]));
        const s = 'LEVEL CLEAR!', fl = t < 8.6 ? ['y', 'w', 'o', 'w'][Math.floor(t * 12) % 4] : 'y';
        ptextO(g, s, 160 - Math.floor(pw(s, 2) / 2), y, PAL[fl], 2, PAL.p, PAL.k);
        [8.75, 8.85, 8.95].forEach((at, i) => { if (t >= at) g.drawImage(st.star, 160 - 4 + (i - 1) * 16, 55 + (t < at + 0.06 ? -2 : 0)); });
      }
      // fireworks
      PX_FW.forEach(([at, fx, fyy, col]) => {
        if (t < at || t > at + 1.0) return;
        const u = t - at;
        if (u < 0.25) { px(g, fx, Math.round(fyy + 40 * (1 - u / 0.25)), 1, 3, PAL.w); return; }
        const v = u - 0.25;
        for (let k = 0; k < 20; k++) {
          const a = (k / 20) * TAU, sp = 26 + (k % 3) * 6;
          const x = Math.round(fx + Math.cos(a) * sp * v * 1.6), y = Math.round(fyy + Math.sin(a) * sp * v * 1.6 + 30 * v * v);
          const cc = v < 0.15 ? 'w' : v < 0.45 ? col : Math.floor(t * 16 + k) % 2 ? col : 'd';
          px(g, x, y, 1, 1, PAL[cc]);
          if (v < 0.5) px(g, Math.round(fx + Math.cos(a) * sp * v), Math.round(fyy + Math.sin(a) * sp * v), 1, 1, PAL[col]);
        }
      });

      // ----- CRT presentation -----
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      const on = E.outX(seg(t, 0.06, 0.38));
      const h = Math.max(6, H * on), y0 = (H - h) / 2;
      const wq = t < 0.06 ? 0 : lerp(0.05, 1, E.outX(seg(t, 0.03, 0.12)));
      if (wq > 0) {
        c.save();
        c.imageSmoothingEnabled = false;
        c.drawImage(st.buf, (W - W * wq) / 2, y0, W * wq, h);
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22; c.filter = 'blur(10px)'; c.imageSmoothingEnabled = true;
        c.drawImage(st.buf, (W - W * wq) / 2, y0, W * wq, h);
        c.restore();
        if (on < 1) { c.fillStyle = `rgba(255,255,255,${1 - on})`; c.fillRect((W - W * wq) / 2, y0, W * wq, h); }
      }
      c.save(); c.fillStyle = c.createPattern(st.scan, 'repeat'); c.fillRect(0, 0, W, H); c.restore();
      const flick = 0.03 * hash(Math.floor(t * 30));
      c.fillStyle = `rgba(0,0,0,${flick})`; c.fillRect(0, 0, W, H);
      vignette(c, W, H, 0.55);
      c.save(); c.fillStyle = '#000'; rrect(c, 14, 10, W - 28, H - 20, 70); c.rect(0, 0, W, H); c.fill('evenodd'); c.restore();
      const gl = c.createLinearGradient(0, 0, W, H);
      gl.addColorStop(0, 'rgba(255,255,255,0.05)'); gl.addColorStop(0.35, 'rgba(255,255,255,0)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gl; c.fillRect(0, 0, W, H);
    },
    score(A) {
      const sq = (t, m, d, g = 0.045, o = {}) => A.osc(t, { type: 'square', f: midi(m), dur: d, g, hold: true, rel: 0.02, ...o });
      const tri = (t, m, d, g = 0.16) => A.osc(t, { type: 'triangle', f: midi(m), dur: d, g, hold: true, rel: 0.02 });
      // power on + title
      A.osc(0.06, { f: 55, dur: 0.5, g: 0.15 });
      A.noise(0.06, { type: 'lowpass', f: 600, dur: 0.12, g: 0.15 });
      A.osc(0.4, { type: 'square', f: 1400, f2: 300, glide: 0.4, dur: 0.42, g: 0.035 });
      sq(0.85, 48, 0.12, 0.05); tri(0.85, 36, 0.3, 0.2);
      [72, 76, 79, 84].forEach((m, i) => sq(0.95 + i * 0.08, m, 0.07, 0.04));
      sq(1.45, 83, 0.05, 0.05); sq(1.5, 88, 0.08, 0.05);
      // main theme 1.6 → 7.2 at 150 bpm (16th = 0.1 s)
      const T0 = 1.6, s16 = 0.1;
      const mel = [[0, 76, 2], [2, 79, 2], [4, 84, 3], [7, 83, 1], [8, 81, 2], [10, 79, 2], [12, 76, 2], [14, 79, 2],
        [16, 81, 2], [18, 84, 2], [20, 88, 3], [23, 86, 1], [24, 84, 2], [26, 81, 2], [28, 77, 2], [30, 81, 2],
        [32, 81, 2], [34, 84, 2], [36, 86, 2], [38, 84, 2], [40, 83, 2], [42, 79, 2], [44, 83, 2], [46, 86, 2],
        [48, 88, 3], [51, 86, 1], [52, 84, 4]];
      mel.forEach(([s, m, l]) => sq(T0 + s * s16, m, l * s16 * 0.92, 0.042));
      const chords = [[60, 64, 67, 72], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]];
      const bassR = [36, 45, 41, 43];
      const chordAt = s => (s < 16 ? 0 : s < 24 ? 1 : s < 32 ? 2 : s < 40 ? 2 : s < 48 ? 3 : 0);
      for (let s = 0; s < 56; s++) {
        const t = T0 + s * s16, ci = chordAt(s);
        A.osc(t, { type: 'square', f: midi(chords[ci][s % 4]), dur: 0.07, g: 0.016, lp: 3000 });
        if (s % 2 === 0) tri(t, bassR[ci] + (s % 4 === 2 ? 12 : 0), 0.18, 0.15);
        if (s % 8 === 0) A.osc(t, { type: 'triangle', f: 180, f2: 50, glide: 0.08, dur: 0.1, g: 0.22 });
        if (s % 8 === 4) A.noise(t, { type: 'bandpass', f: 2200, q: 0.8, dur: 0.09, g: 0.12, crush: true });
        if (s % 2 === 1) A.noise(t, { type: 'highpass', f: 9000, dur: 0.025, g: 0.04 });
      }
      // gameplay sfx
      const jump = t => A.osc(t, { type: 'square', f: 260, f2: 820, glide: 0.14, dur: 0.16, g: 0.045 });
      [2.6, 3.7, 5.0, 5.9, 6.85, 7.7].forEach(jump);
      PX_COINS.forEach(cn => { A.osc(cn.tc, { type: 'square', f: 987.8, dur: 0.06, g: 0.04, hold: true, rel: 0.01 }); A.osc(cn.tc + 0.06, { type: 'square', f: 1318.5, dur: 0.22, g: 0.04 }); });
      A.noise(4.2, { type: 'lowpass', f: 1200, dur: 0.1, g: 0.2, crush: true });
      A.osc(4.2, { type: 'square', f: 420, f2: 90, glide: 0.12, dur: 0.14, g: 0.05 });
      A.osc(5.25, { type: 'triangle', f: 160, f2: 80, dur: 0.1, g: 0.22 });
      A.osc(5.27, { type: 'square', f: 987.8, dur: 0.06, g: 0.04, hold: true, rel: 0.01 }); A.osc(5.33, { type: 'square', f: 1318.5, dur: 0.3, g: 0.04 });
      A.osc(7.2, { type: 'square', f: 1600, f2: 220, glide: 0.5, dur: 0.52, g: 0.035, vib: [28, 60] });
      // fanfare
      [[7.85, 67], [7.92, 72], [7.99, 76], [8.06, 79], [8.13, 84], [8.2, 88]].forEach(([t, m]) => sq(t, m, 0.065, 0.045));
      sq(8.3, 86, 0.12, 0.045); sq(8.42, 88, 0.12, 0.045); sq(8.55, 91, 0.9, 0.04, { vib: [6, 6] });
      sq(8.55, 84, 0.9, 0.022); tri(8.55, 48, 1.0, 0.18);
      [[7.85, 48], [8.13, 55], [8.3, 53]].forEach(([t, m]) => tri(t, m, 0.25, 0.16));
      for (let k = 0; k < 16; k++) A.osc(8.0 + k * 0.05, { type: 'square', f: 1760, dur: 0.025, g: 0.014, hold: true, rel: 0.005 });
      PX_FW.forEach(([at]) => { A.osc(at, { type: 'square', f: 300, f2: 900, glide: 0.25, dur: 0.25, g: 0.02 }); A.noise(at + 0.25, { type: 'lowpass', f: 3000, f2: 200, dur: 0.6, g: 0.16, crush: true }); });
      [8.75, 8.85, 8.95].forEach((t, i) => sq(t, 84 + i * 4, 0.12, 0.035));
      sq(9.05, 96, 0.6, 0.03); sq(9.05, 91, 0.6, 0.018); tri(9.05, 36, 0.8, 0.2);
      [8.4, 8.6, 8.8].forEach(t => A.osc(t, { type: 'square', f: 520, f2: 1040, glide: 0.08, dur: 0.09, g: 0.022 }));
    },
  });
})();
