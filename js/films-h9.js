/* batch h9 — Cinematic & Commercial: Documentary Montage · Music Video · Broadcast Graphics.
   documentary (City of Gold, Ken Burns, Errol Morris: the archive set in motion) ·
   musicvideo (Gondry, Jonze, OK Go: concept videos cut on the beat) ·
   broadcast (24-hour news packages for a fictional channel, Meridian 24). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, rrect, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=IM+Fell+English:ital@0;1&family=Homemade+Apple&family=Archivo+Black&family=Archivo:wght@500;700&family=Roboto+Condensed:ital,wght@0,400;0,700;0,900;1,900&display=block');
  const PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgba = (h, a) => `rgba(${hex(h).join(',')},${a})`;
  const mixc = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
  const poly = (g, pts) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
  // 2D value noise built on hash (deterministic), 0..1.
  const n2 = (x, y, s = 0) => {
    const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, a = u * u * (3 - 2 * u), b = v * v * (3 - 2 * v);
    const h = (p, q) => hash(p * 157.31 + q * 113.17 + s * 71.7);
    return lerp(lerp(h(i, j), h(i + 1, j), a), lerp(h(i, j + 1), h(i + 1, j + 1), a), b);
  };
  const blob = (g, x, y, rr, col) => { const gg = g.createRadialGradient(x, y, 0, x, y, rr); gg.addColorStop(0, col); gg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gg; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); };
  // Draw fn into a full-frame buffer and lay it over the frame at alpha a (dissolves).
  function dissolve(c, st, a, fn) {
    if (a <= 0) return;
    if (a >= 1) { fn(c); return; }
    const g = st.buf.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, 1920, 1080); g.save(); fn(g); g.restore();
    c.save(); c.globalAlpha = a; c.drawImage(st.buf, 0, 0); c.restore();
  }

  /* =====================================================================
     DOCUMENTARY MONTAGE — "The Long Road West", a history told in stills.
     Out of black, a slow push into a tintype portrait in its brass mat
     and a name super; a dissolve to a surveyor's map where the regiment's
     route draws itself west from town to town as the date changes; a hard
     cut to a historian staring straight down the lens (the Interrotron
     look), with one jump cut; his letter home, the words appearing in his
     own hand as the camera tilts down the page; a dissolve to a panorama
     of the camp that pans right, then pulls back to reveal the mounted
     print as the title comes up. All people and places are fictional.
     ===================================================================== */
  const DC = { blk: '#0b0907', sepD: '#2a1d12', sep: '#7a5a3a', sepL: '#d9c3a0', card: '#ddd0b2', paper: '#e6d6b2', ink: '#2b2116', red: '#8e2a1e', white: '#f4efe4', brass: '#b8924a' };
  const DC_F = { serif: '"Cormorant Garamond", Georgia, serif', fell: '"IM Fell English", Georgia, serif', hand: '"Homemade Apple", cursive' };
  const DC_T = { a: [0, 2.65], b: [2.2, 4.5], c: [4.5, 6.2], jump: 5.35, d: [6.2, 8.3], e: [7.8, 10], title: 8.7 };
  // The march: Millbrook to Harrow Ford across the surveyor's map (print px).
  const DC_TOWNS = [['Millbrook', 2160, 1120, 30, 62], ['Cold Spring', 1740, 880, -290, 78], ['Ashby Ridge', 1300, 640, 30, -36], ['Harrow Ford', 760, 420, -300, -36]];
  const DC_ROUTE = (() => {
    const w = [[2160, 1120], [2010, 1040], [1880, 930], [1740, 880], [1580, 830], [1440, 720], [1300, 640], [1140, 620], [960, 520], [760, 420]];
    const out = [];
    for (let i = 0; i < w.length - 1; i++) {
      const p0 = w[Math.max(0, i - 1)], p1 = w[i], p2 = w[i + 1], p3 = w[Math.min(w.length - 1, i + 2)];
      for (let k = 0; k < 12; k++) {
        const u = k / 12, u2 = u * u, u3 = u2 * u;
        out.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3)));
      }
    }
    out.push(w[w.length - 1]);
    const L = [0]; for (let i = 1; i < out.length; i++) L.push(L[i - 1] + Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]));
    return { pts: out, L, tot: L[L.length - 1] };
  })();
  const dcRouteAt = p => {
    const R = DC_ROUTE, d = clamp(p) * R.tot; let i = 1; while (i < R.L.length - 1 && R.L[i] < d) i++;
    const a = R.pts[i - 1], b = R.pts[i], u = (d - R.L[i - 1]) / ((R.L[i] - R.L[i - 1]) || 1);
    return { x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), a: Math.atan2(b[1] - a[1], b[0] - a[0]), i };
  };
  // The letter, line by line in paper px: [text, x, baseline, size, start, end] (the first two already written).
  const DC_PAPER = { x: 300, y: 100, w: 1400, h: 1800, r: -0.02 };
  const DC_LINES = [
    ['Camp near Harrow Ford, June 9th 1863', 560, 280, 34, 5.0, 5.6],
    ['My dearest Clara,', 130, 400, 50, 5.6, 6.0],
    ['We marched forty miles in four days,', 130, 520, 44, 6.25, 6.8],
    ['and the road was hard, but I carry', 130, 640, 44, 6.8, 7.35],
    ['your letter in my coat every mile.', 130, 760, 44, 7.35, 7.85],
    ['Kiss little Ben for me.', 130, 880, 44, 7.85, 8.15],
    ['Your loving Thomas', 700, 1010, 46, 8.15, 8.4],
  ];

  // Ken Burns: (u, v) is the point of the print at frame centre, z the scale (screen px per print px).
  function dcKB(g, img, u, v, z, rot = 0) {
    g.save(); g.translate(960, 540); g.rotate(rot); g.scale(z, z); g.drawImage(img, -u, -v); g.restore();
  }
  // Name super, Ken Burns style: plain white serif lower left, no box.
  function dcSuper(g, t, a, b, l1, l2, x = 150, y = 900) {
    const o = Math.min(seg(t, a, a + 0.5), 1 - seg(t, b - 0.4, b)); if (o <= 0) return;
    g.save(); g.globalAlpha = E.ioS(o); g.shadowColor = 'rgba(0,0,0,0.75)'; g.shadowBlur = 14;
    text(g, l1, x, y, { font: DC_F.serif, weight: 600, size: 50, color: DC.white, ls: 7 });
    if (l2) text(g, l2, x, y + 50, { font: DC_F.serif, style: 'italic', weight: 500, size: 38, color: 'rgba(244,239,228,0.9)' });
    g.restore();
  }
  // Age a print: grain, foxing, scratches, faded corners.
  function dcAge(g, W, H, r, n = 1) {
    for (let k = 0; k < 9000 * n; k++) { g.fillStyle = r() < 0.5 ? `rgba(30,20,10,${r() * 0.12})` : `rgba(255,245,225,${r() * 0.1})`; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    for (let k = 0; k < 18 * n; k++) blob(g, r() * W, r() * H, 20 + r() * 80, `rgba(120,80,40,${0.05 + r() * 0.08})`);
    g.lineWidth = 1.2;
    for (let k = 0; k < 14 * n; k++) { const x = r() * W, y = r() * H, a = r() * TAU, l = 40 + r() * 260; g.strokeStyle = `rgba(250,240,220,${0.15 + r() * 0.25})`; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + (r() - 0.5) * 30, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.55);
    vg.addColorStop(0, 'rgba(40,25,10,0)'); vg.addColorStop(1, 'rgba(40,25,10,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }

  // The sitter: a private in forage cap and frock coat, painted in sepia, lit from the left.
  function dcSitter() {
    const W = 800, H = 1000, cv = offscreen(W, H), g = cv.getContext('2d'), r = rng(61);
    const bg = g.createRadialGradient(340, 360, 40, 400, 500, 640); bg.addColorStop(0, '#a89070'); bg.addColorStop(0.55, '#6c573f'); bg.addColorStop(1, '#2c2015');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 50; k++) blob(g, r() * W, r() * H, 40 + r() * 120, r() < 0.5 ? 'rgba(40,28,16,0.16)' : 'rgba(210,190,160,0.1)');
    // neck
    const sk = g.createLinearGradient(350, 0, 450, 0); sk.addColorStop(0, '#c9ae88'); sk.addColorStop(1, '#7c6146');
    g.fillStyle = sk; g.fillRect(345, 600, 110, 80);
    // frock coat
    const jk = g.createLinearGradient(60, 0, 740, 0); jk.addColorStop(0, '#4c3c2b'); jk.addColorStop(0.45, '#2c2117'); jk.addColorStop(1, '#160f0a');
    g.fillStyle = jk; g.beginPath(); g.moveTo(10, H); g.bezierCurveTo(30, 860, 110, 790, 250, 765); g.quadraticCurveTo(330, 735, 345, 674); g.lineTo(455, 674); g.quadraticCurveTo(470, 735, 550, 765); g.bezierCurveTo(690, 790, 770, 860, 790, H); g.closePath(); g.fill();
    g.fillStyle = 'rgba(230,210,180,0.08)'; g.beginPath(); g.moveTo(40, H); g.bezierCurveTo(60, 880, 130, 810, 250, 785); g.lineTo(260, 820); g.bezierCurveTo(160, 850, 110, 920, 100, H); g.fill();
    // standing collar with piping
    g.fillStyle = '#231a12'; rrect(g, 335, 650, 130, 56, 10); g.fill();
    g.strokeStyle = 'rgba(220,200,170,0.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(338, 654); g.lineTo(462, 654); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 3; g.beginPath(); g.moveTo(402, 718); g.lineTo(406, H); g.stroke();
    for (let k = 0; k < 5; k++) { const y = 760 + k * 52; blob(g, 418, y + 3, 16, 'rgba(0,0,0,0.5)'); g.fillStyle = '#cdb286'; g.beginPath(); g.arc(416, y, 9, 0, TAU); g.fill(); g.fillStyle = '#f2e4c4'; g.beginPath(); g.arc(413, y - 3, 3, 0, TAU); g.fill(); }
    // ears and face
    g.fillStyle = '#8f7253'; [[292, 515], [508, 515]].forEach(([x, y]) => { g.beginPath(); g.ellipse(x, y, 18, 34, 0, 0, TAU); g.fill(); });
    const fc = g.createRadialGradient(360, 470, 20, 400, 510, 170); fc.addColorStop(0, '#dcc6a4'); fc.addColorStop(0.6, '#b4977a'); fc.addColorStop(1, '#7a5e44');
    g.fillStyle = fc; g.beginPath(); g.ellipse(400, 505, 106, 138, 0, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.ellipse(400, 505, 106, 138, 0, 0, TAU); g.clip();
    const sh = g.createLinearGradient(380, 0, 510, 0); sh.addColorStop(0, 'rgba(50,32,18,0)'); sh.addColorStop(1, 'rgba(50,32,18,0.55)'); g.fillStyle = sh; g.fillRect(380, 360, 140, 300);
    const vs = g.createLinearGradient(0, 410, 0, 480); vs.addColorStop(0, 'rgba(30,20,12,0.7)'); vs.addColorStop(1, 'rgba(30,20,12,0)'); g.fillStyle = vs; g.fillRect(280, 400, 240, 80);
    // cheekbones and the shadow under the jaw
    blob(g, 340, 540, 60, 'rgba(240,220,190,0.25)'); blob(g, 400, 650, 90, 'rgba(40,26,14,0.45)');
    blob(g, 300, 470, 40, 'rgba(45,30,18,0.5)'); blob(g, 500, 470, 40, 'rgba(45,30,18,0.6)');
    g.restore();
    // eyes, brows, nose, moustache
    g.fillStyle = 'rgba(40,26,14,0.75)'; [[352, -0.08], [448, 0.08]].forEach(([x, a]) => { g.save(); g.translate(x, 474); g.rotate(a); g.fillRect(-30, -5, 60, 9); g.restore(); });
    [352, 448].forEach(x => {
      g.fillStyle = '#cdb898'; g.beginPath(); g.ellipse(x, 500, 19, 8, 0, 0, TAU); g.fill();
      g.fillStyle = '#2a1c10'; g.beginPath(); g.arc(x + 1, 500, 8, 0, TAU); g.fill();
      g.fillStyle = 'rgba(245,235,215,0.85)'; g.beginPath(); g.arc(x - 2, 497, 2.2, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(40,26,14,0.6)'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, 499, 21, 10, 0, PI * 1.05, PI * 1.95); g.stroke();
    });
    g.strokeStyle = 'rgba(70,48,28,0.55)'; g.lineWidth = 5; g.beginPath(); g.moveTo(412, 500); g.quadraticCurveTo(420, 545, 414, 566); g.stroke();
    g.fillStyle = 'rgba(60,40,22,0.6)'; g.beginPath(); g.ellipse(388, 568, 9, 5, 0, 0, TAU); g.ellipse(414, 568, 9, 5, 0, 0, TAU); g.fill();
    g.fillStyle = '#2e2014'; g.beginPath(); g.moveTo(340, 606); g.quadraticCurveTo(360, 580, 400, 584); g.quadraticCurveTo(440, 580, 462, 606); g.quadraticCurveTo(430, 598, 400, 602); g.quadraticCurveTo(370, 598, 340, 606); g.fill();
    g.strokeStyle = 'rgba(40,24,12,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(372, 618); g.quadraticCurveTo(400, 624, 428, 618); g.stroke();
    // forage cap: crown tilted forward, band, glossy visor
    const cp = g.createLinearGradient(290, 0, 520, 0); cp.addColorStop(0, '#463626'); cp.addColorStop(1, '#1c140d');
    g.fillStyle = cp; g.beginPath(); g.moveTo(290, 430); g.lineTo(298, 318); g.quadraticCurveTo(400, 286, 512, 300); g.lineTo(512, 430); g.closePath(); g.fill();
    g.fillStyle = '#2a1f15'; g.beginPath(); g.ellipse(404, 304, 108, 22, -0.08, 0, TAU); g.fill();
    g.fillStyle = '#1a120b'; g.fillRect(288, 392, 226, 42);
    g.fillStyle = 'rgba(220,200,160,0.2)'; g.fillRect(288, 392, 226, 4);
    g.fillStyle = '#cfb27a'; g.beginPath(); g.ellipse(400, 368, 24, 13, 0, 0, TAU); g.fill(); g.strokeStyle = '#4a3820'; g.lineWidth = 2; g.stroke();
    g.fillStyle = '#100a06'; g.beginPath(); g.ellipse(402, 436, 120, 24, 0, 0, PI); g.fill();
    g.strokeStyle = 'rgba(240,225,200,0.35)'; g.lineWidth = 3; g.beginPath(); g.ellipse(402, 438, 104, 15, 0, 0.3, 1.9); g.stroke();
    dcAge(g, W, H, r, 0.5);
    return cv;
  }
  // A tintype in its union case: velvet, brass mat with an embossed oval, the plate inside.
  function dcPortrait() {
    const W = 1600, H = 1200, cv = offscreen(W, H), g = cv.getContext('2d'), r = rng(1862);
    g.fillStyle = '#1d130d'; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 7000; k++) { g.fillStyle = `rgba(${r() < 0.5 ? '80,40,30' : '0,0,0'},${r() * 0.25})`; g.fillRect(r() * W, r() * H, 2, 2); }
    const cx = 800, cy = 600, RX = 360, RY = 470;
    const br = g.createLinearGradient(0, 80, 0, 1120); br.addColorStop(0, '#d6b26a'); br.addColorStop(0.5, '#8d6a32'); br.addColorStop(1, '#c49b52');
    g.fillStyle = br; rrect(g, cx - 450, 50, 900, 1100, 30); g.fill();
    g.strokeStyle = 'rgba(60,40,15,0.7)'; g.lineWidth = 4; rrect(g, cx - 430, 70, 860, 1060, 24); g.stroke();
    // embossed scrolls in the corners and a beaded ring
    g.strokeStyle = 'rgba(70,48,18,0.55)'; g.lineWidth = 3;
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => { for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(cx + sx * (360 - k * 18), cy + sy * (470 - k * 14), 26 + k * 10, 0, TAU); g.stroke(); } });
    for (let k = 0; k < 90; k++) { const a = k / 90 * TAU; g.fillStyle = k % 2 ? '#f0d690' : '#6b4d1f'; g.beginPath(); g.arc(cx + Math.cos(a) * (RX + 26), cy + Math.sin(a) * (RY + 26), 5, 0, TAU); g.fill(); }
    g.save(); g.beginPath(); g.ellipse(cx, cy, RX, RY, 0, 0, TAU); g.clip();
    g.filter = 'blur(2.2px) contrast(1.15)'; g.drawImage(dcSitter(), cx - 400, cy - 500); g.filter = 'none';
    const dk = g.createRadialGradient(cx, cy - 40, 200, cx, cy, 520); dk.addColorStop(0, 'rgba(20,12,6,0)'); dk.addColorStop(0.8, 'rgba(20,12,6,0.4)'); dk.addColorStop(1, 'rgba(20,12,6,0.85)');
    g.fillStyle = dk; g.fillRect(0, 0, W, H);
    // silver mirroring creeping in from the plate edge
    const mr = g.createRadialGradient(cx, cy, 380, cx, cy, 500); mr.addColorStop(0, 'rgba(150,170,190,0)'); mr.addColorStop(1, 'rgba(150,170,190,0.35)');
    g.globalCompositeOperation = 'screen'; g.fillStyle = mr; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    g.restore();
    g.strokeStyle = '#5c431a'; g.lineWidth = 10; g.beginPath(); g.ellipse(cx, cy, RX, RY, 0, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(255,235,180,0.6)'; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cy, RX + 8, RY + 8, 0, PI * 0.9, PI * 1.6); g.stroke();
    return cv;
  }
  // The surveyor's map: parchment, river, hachured hills, roads, towns, cartouche and compass.
  function dcMap() {
    const W = 2600, H = 1500, cv = offscreen(W, H), g = cv.getContext('2d'), r = rng(1861);
    g.fillStyle = '#dcc89e'; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 40; k++) blob(g, r() * W, r() * H, 100 + r() * 300, `rgba(${r() < 0.5 ? '150,110,60' : '240,225,190'},${0.08 + r() * 0.1})`);
    g.strokeStyle = 'rgba(90,60,30,0.6)'; g.lineWidth = 3; g.strokeRect(50, 50, W - 100, H - 100); g.lineWidth = 1.5; g.strokeRect(66, 66, W - 132, H - 132);
    g.strokeStyle = 'rgba(90,60,30,0.14)'; g.lineWidth = 1.5;
    for (let x = 66 + 260; x < W - 66; x += 260) { g.beginPath(); g.moveTo(x, 66); g.lineTo(x, H - 66); g.stroke(); }
    for (let y = 66 + 250; y < H - 66; y += 250) { g.beginPath(); g.moveTo(66, y); g.lineTo(W - 66, y); g.stroke(); }
    // river with water-lining
    const rv = [[520, 66], [640, 260], [700, 420], [860, 640], [1040, 820], [1180, 1060], [1400, 1280], [1560, H - 66]];
    const rpath = (dx, dy) => { g.beginPath(); g.moveTo(rv[0][0] + dx, rv[0][1] + dy); for (let i = 1; i < rv.length - 1; i++) { const m = [(rv[i][0] + rv[i + 1][0]) / 2, (rv[i][1] + rv[i + 1][1]) / 2]; g.quadraticCurveTo(rv[i][0] + dx, rv[i][1] + dy, m[0] + dx, m[1] + dy); } g.lineTo(rv[rv.length - 1][0] + dx, rv[rv.length - 1][1] + dy); };
    [[34, 0.12], [24, 0.2], [14, 0.32]].forEach(([d, a]) => { g.strokeStyle = `rgba(70,90,95,${a})`; g.lineWidth = 2; rpath(-d, 0); g.stroke(); rpath(d, 0); g.stroke(); });
    g.strokeStyle = '#4f6466'; g.lineWidth = 12; g.lineCap = 'round'; rpath(0, 0); g.stroke();
    // hachured hills
    const hill = (x, y, s) => { g.strokeStyle = 'rgba(70,45,22,0.7)'; g.lineWidth = 2; for (let k = -6; k <= 6; k++) { const a = k / 6 * 1.2; g.beginPath(); g.moveTo(x + Math.sin(a) * 30 * s, y - Math.cos(a) * 18 * s); g.lineTo(x + Math.sin(a) * 52 * s, y - Math.cos(a) * 18 * s + 22 * s); g.stroke(); } };
    for (let k = 0; k < 70; k++) { const u = r(); hill(1060 + u * 800 + (r() - 0.5) * 120, 500 - u * 200 + (r() - 0.5) * 90, 0.7 + r() * 0.6); }
    for (let k = 0; k < 40; k++) hill(1700 + r() * 750, 1260 + r() * 140, 0.6 + r() * 0.5);
    // woods
    for (let k = 0; k < 160; k++) { const x = 180 + r() * 600, y = 700 + r() * 600; g.strokeStyle = 'rgba(70,60,30,0.55)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 9 + r() * 6, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(x, y + 10); g.lineTo(x, y + 20); g.stroke(); }
    // roads
    g.strokeStyle = 'rgba(90,60,30,0.6)'; g.lineWidth = 3; g.setLineDash([14, 10]);
    [[[2160, 1120], [2400, 1300]], [[1740, 880], [1900, 600], [2300, 420]], [[760, 420], [420, 300], [150, 340]], [[1300, 640], [1200, 1000], [700, 1250]]].forEach(rd => { g.beginPath(); rd.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); });
    g.setLineDash([]);
    DC_TOWNS.forEach(([nm, x, y, dx, dy]) => {
      g.fillStyle = '#3a2716'; g.beginPath(); g.arc(x, y, 14, 0, TAU); g.fill();
      g.fillStyle = '#dcc89e'; g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill();
      text(g, nm, x + dx, y + dy, { font: DC_F.fell, size: 50, color: '#3a2716' });
    });
    [['Ellery', 2300, 420], ['Fenwick', 150, 340], ['Oak Hollow', 700, 1250]].forEach(([nm, x, y]) => { g.fillStyle = '#3a2716'; g.beginPath(); g.arc(x, y, 8, 0, TAU); g.fill(); text(g, nm, x + 20, y - 18, { font: DC_F.fell, size: 34, color: 'rgba(58,39,22,0.85)' }); });
    g.save(); g.translate(1010, 760); g.rotate(0.86); text(g, 'Tolland River', 0, -40, { font: DC_F.fell, style: 'italic', size: 44, color: '#3d5052', align: 'center', ls: 4 }); g.restore();
    text(g, 'ASHBY  HILLS', 1480, 190, { font: DC_F.fell, size: 40, color: 'rgba(70,45,22,0.8)', ls: 14, align: 'center' });
    // cartouche
    g.fillStyle = 'rgba(232,218,184,0.9)'; g.fillRect(140, 1230, 820, 180); g.strokeStyle = '#3a2716'; g.lineWidth = 3; g.strokeRect(140, 1230, 820, 180); g.lineWidth = 1.5; g.strokeRect(152, 1242, 796, 156);
    text(g, 'THE UPPER TOLLAND VALLEY', 550, 1310, { font: DC_F.fell, size: 52, color: '#3a2716', align: 'center', ls: 4 });
    text(g, 'from a survey made in the year 1862', 550, 1366, { font: DC_F.fell, style: 'italic', size: 34, color: '#3a2716', align: 'center' });
    // compass rose
    g.save(); g.translate(2330, 230); g.fillStyle = '#3a2716'; g.strokeStyle = '#3a2716'; g.lineWidth = 2;
    for (let k = 0; k < 8; k++) { g.save(); g.rotate(k * PI / 4); const l = k % 2 ? 70 : 120; g.beginPath(); g.moveTo(0, -l); g.lineTo(14, 0); g.lineTo(-14, 0); g.closePath(); k % 4 === 0 ? g.fill() : g.stroke(); g.restore(); }
    g.beginPath(); g.arc(0, 0, 80, 0, TAU); g.stroke(); text(g, 'N', 0, -132, { font: DC_F.fell, size: 40, color: '#3a2716', align: 'center' }); g.restore();
    // fold creases
    g.fillStyle = 'rgba(80,50,20,0.16)'; g.fillRect(1298, 0, 4, H); g.fillRect(0, 748, W, 4);
    g.fillStyle = 'rgba(255,248,230,0.25)'; g.fillRect(1302, 0, 3, H); g.fillRect(0, 752, W, 3);
    dcAge(g, W, H, r, 1.4);
    return cv;
  }
  // The letter on the desk: laid paper with faint rules, folds and foxing (the hand is drawn live).
  function dcLetter() {
    const W = 2000, H = 2000, cv = offscreen(W, H), g = cv.getContext('2d'), r = rng(1863);
    const wd = g.createLinearGradient(0, 0, W, H); wd.addColorStop(0, '#3a2516'); wd.addColorStop(1, '#1c110a'); g.fillStyle = wd; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 220; k++) { const y = r() * H; g.strokeStyle = `rgba(${r() < 0.5 ? '0,0,0' : '120,80,50'},${0.1 + r() * 0.15})`; g.lineWidth = 1 + r() * 3; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(600, y + (r() - 0.5) * 40, 1400, y + (r() - 0.5) * 40, W, y + (r() - 0.5) * 30); g.stroke(); }
    const P = DC_PAPER;
    g.save(); g.translate(P.x, P.y); g.rotate(P.r);
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40; g.shadowOffsetY = 14; g.fillStyle = DC.paper; g.fillRect(0, 0, P.w, P.h); g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(90,110,140,0.22)'; g.lineWidth = 2;
    for (let k = 0; k < 13; k++) { const y = 280 + k * 120 + 10; g.beginPath(); g.moveTo(80, y); g.lineTo(P.w - 80, y); g.stroke(); }
    g.strokeStyle = 'rgba(160,60,50,0.2)'; g.beginPath(); g.moveTo(110, 120); g.lineTo(110, P.h - 60); g.stroke();
    g.fillStyle = 'rgba(80,50,20,0.14)'; g.fillRect(0, 598, P.w, 4); g.fillRect(0, 1198, P.w, 4);
    g.fillStyle = 'rgba(255,250,235,0.35)'; g.fillRect(0, 602, P.w, 3); g.fillRect(0, 1202, P.w, 3);
    dcAge(g, P.w, P.h, r, 0.8);
    g.restore();
    return cv;
  }
  // Camp panorama: an albumen print of wedge tents, men, a flag and a wagon, mounted on card with a pencil caption.
  function dcCamp() {
    const W = 3400, H = 1400, PW = 3200, PH = 1100, cv = offscreen(W, H), g = cv.getContext('2d'), r = rng(1864);
    g.fillStyle = DC.card; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 9000; k++) { g.fillStyle = `rgba(110,90,60,${r() * 0.12})`; g.fillRect(r() * W, r() * H, 2, 2); }
    const ph = offscreen(PW, PH), p = ph.getContext('2d');
    const sky = p.createLinearGradient(0, 0, 0, 560); sky.addColorStop(0, '#efe5cd'); sky.addColorStop(1, '#ddcdaa'); p.fillStyle = sky; p.fillRect(0, 0, PW, PH);
    p.fillStyle = 'rgba(170,150,115,0.6)'; p.beginPath(); p.moveTo(0, 560);
    for (let x = 0; x <= PW; x += 40) p.lineTo(x, 470 - 90 * n2(x / 700, 0, 3) - 30 * n2(x / 180, 0, 4)); p.lineTo(PW, 560); p.fill();
    p.fillStyle = '#5b4733'; p.beginPath(); p.moveTo(0, 650);
    for (let x = 0; x <= PW; x += 12) p.lineTo(x, 580 - 70 * n2(x / 300, 1, 5) - 26 * n2(x / 40, 1, 6)); p.lineTo(PW, 650); p.fill();
    const fl = p.createLinearGradient(0, 600, 0, PH); fl.addColorStop(0, '#a99270'); fl.addColorStop(1, '#7e6848'); p.fillStyle = fl; p.fillRect(0, 620, PW, PH);
    for (let k = 0; k < 3000; k++) { const x = r() * PW, y = 640 + Math.pow(r(), 0.7) * 460; p.strokeStyle = `rgba(60,45,28,${0.1 + r() * 0.2})`; p.lineWidth = 1 + (y - 640) / 300; p.beginPath(); p.moveTo(x, y); p.lineTo(x + (r() - 0.5) * 6, y - 4 - (y - 600) / 40); p.stroke(); }
    const tent = (x, y, s) => {
      p.fillStyle = 'rgba(40,30,20,0.25)'; p.beginPath(); p.ellipse(x + 50 * s, y + 6 * s, 120 * s, 14 * s, 0, 0, TAU); p.fill();
      p.fillStyle = '#c4b28c'; poly(p, [[x, y - 120 * s], [x + 76 * s, y - 128 * s], [x + 160 * s, y - 4 * s], [x + 80 * s, y]]); p.fill();
      p.fillStyle = '#efe4c9'; poly(p, [[x - 80 * s, y], [x, y - 120 * s], [x + 80 * s, y]]); p.fill();
      p.fillStyle = '#3b2c1c'; poly(p, [[x - 14 * s, y], [x, y - 70 * s], [x + 22 * s, y]]); p.fill();
      p.strokeStyle = 'rgba(60,45,30,0.5)'; p.lineWidth = 2 * s; p.beginPath(); p.moveTo(x, y - 120 * s); p.lineTo(x, y - 140 * s); p.stroke();
    };
    const man = (x, y, h, rifle) => {
      p.fillStyle = '#2c2117';
      p.fillRect(x - h * 0.07, y - h * 0.48, h * 0.06, h * 0.48); p.fillRect(x + h * 0.01, y - h * 0.48, h * 0.06, h * 0.48);
      p.beginPath(); p.moveTo(x - h * 0.13, y - h * 0.45); p.lineTo(x - h * 0.11, y - h * 0.8); p.lineTo(x + h * 0.11, y - h * 0.8); p.lineTo(x + h * 0.13, y - h * 0.45); p.fill();
      p.fillStyle = '#b39878'; p.beginPath(); p.arc(x, y - h * 0.87, h * 0.07, 0, TAU); p.fill();
      p.fillStyle = '#1e160e'; p.fillRect(x - h * 0.075, y - h * 0.99, h * 0.15, h * 0.07);
      if (rifle) { p.strokeStyle = '#1e160e'; p.lineWidth = Math.max(1.5, h * 0.02); p.beginPath(); p.moveTo(x + h * 0.16, y); p.lineTo(x + h * 0.18, y - h * 1.15); p.stroke(); }
    };
    [[660, 0.42, 30, 110], [730, 0.62, 22, 150], [830, 0.88, 15, 210]].forEach(([y, s, n, dx], row) => {
      for (let i = 0; i < n; i++) { const x = 60 + i * dx * 1.0 + (row % 2) * dx * 0.5 + (r() - 0.5) * 20; if (x > 1500 && x < 2050 && row === 2) continue; tent(x, y + (r() - 0.5) * 8, s); }
    });
    for (let k = 0; k < 26; k++) { const x = 1480 + r() * 640, y = 880 + r() * 120; man(x, y, 120 + (y - 880) * 0.5, r() < 0.4); }
    for (let k = 0; k < 14; k++) { const x = r() * PW, y = 760 + r() * 60; man(x, y, 60, false); }
    // the colours on a pole
    p.strokeStyle = '#2a1d12'; p.lineWidth = 6; p.beginPath(); p.moveTo(1800, 900); p.lineTo(1800, 330); p.stroke();
    for (let k = 0; k < 7; k++) { p.fillStyle = k % 2 ? '#e6dac0' : '#6d5640'; p.beginPath(); for (let j = 0; j <= 20; j++) { const u = j / 20, x = 1803 + u * 220, y = 336 + k * 18 + Math.sin(u * 5) * 10 * u; j ? p.lineTo(x, y) : p.moveTo(x, y); } for (let j = 20; j >= 0; j--) { const u = j / 20; p.lineTo(1803 + u * 220, 354 + k * 18 + Math.sin(u * 5) * 10 * u); } p.fill(); }
    p.fillStyle = '#3e2f22'; p.fillRect(1803, 336, 90, 72);
    // wagon
    p.fillStyle = '#4a3726'; p.fillRect(2600, 830, 260, 60); p.fillStyle = '#ece0c4'; p.beginPath(); p.moveTo(2600, 830); p.bezierCurveTo(2620, 720, 2840, 720, 2860, 830); p.fill();
    [2640, 2820].forEach(x => { p.strokeStyle = '#2a1d12'; p.lineWidth = 6; p.beginPath(); p.arc(x, 900, 44, 0, TAU); p.stroke(); p.lineWidth = 3; for (let k = 0; k < 6; k++) { const a = k * PI / 6; p.beginPath(); p.moveTo(x - Math.cos(a) * 44, 900 - Math.sin(a) * 44); p.lineTo(x + Math.cos(a) * 44, 900 + Math.sin(a) * 44); p.stroke(); } });
    // cook-fire smoke
    for (let k = 0; k < 14; k++) blob(p, 1180 + k * 34 + Math.sin(k) * 20, 820 - k * 42, 40 + k * 9, `rgba(245,238,222,${0.35 - k * 0.02})`);
    p.fillStyle = 'rgba(190,150,100,0.25)'; p.globalCompositeOperation = 'multiply'; p.fillRect(0, 0, PW, PH); p.globalCompositeOperation = 'source-over';
    dcAge(p, PW, PH, r, 2);
    const fade = p.createRadialGradient(PW / 2, PH / 2, PH * 0.4, PW / 2, PH / 2, PW * 0.6); fade.addColorStop(0, 'rgba(240,225,190,0)'); fade.addColorStop(1, 'rgba(240,225,190,0.45)'); p.fillStyle = fade; p.fillRect(0, 0, PW, PH);
    g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 8; g.fillStyle = '#000'; g.fillRect(100, 90, PW, PH); g.shadowColor = 'transparent';
    g.filter = 'blur(0.8px)'; g.drawImage(ph, 100, 90); g.filter = 'none';
    text(g, 'Camp of the 9th Volunteers, near Harrow Ford.  June 1863.', W / 2, 1300, { font: DC_F.fell, style: 'italic', size: 64, color: 'rgba(80,62,40,0.85)', align: 'center' });
    return cv;
  }
  function dcShelf() {   // the blurred study behind the historian
    const cv = offscreen(480, 270), g = cv.getContext('2d'), r = rng(88);
    const bg = g.createLinearGradient(0, 0, 480, 0); bg.addColorStop(0, '#2b2720'); bg.addColorStop(1, '#141716'); g.fillStyle = bg; g.fillRect(0, 0, 480, 270);
    for (let s = 0; s < 4; s++) { let x = 0; const y = 20 + s * 66; while (x < 480) { const w = 4 + r() * 8; g.fillStyle = ['#5a3a2a', '#3a4a3c', '#6a5a3a', '#2e3346', '#4a2a26', '#7a6a50'][(r() * 6) | 0]; g.fillRect(x, y + r() * 10, w, 50); x += w + 1; } g.fillStyle = '#1a1410'; g.fillRect(0, y + 58, 480, 6); }
    const out = offscreen(480, 270), o = out.getContext('2d'); o.filter = 'blur(7px)'; o.drawImage(cv, 0, 0); o.filter = 'none';
    blob(o, 90, 80, 70, 'rgba(255,190,110,0.55)'); blob(o, 400, 60, 40, 'rgba(160,190,210,0.25)');
    return out;
  }

  function dcShotA(g, t, st) {
    const u = E.ioS(seg(t, 0, 2.7));
    dcKB(g, st.portrait, 800, lerp(600, 560, u), lerp(0.92, 1.6, u));
    dcSuper(g, t, 0.9, 2.35, 'THOMAS AVERY', 'Private, 9th Valley Volunteers · 1862');
  }
  function dcShotB(g, t, st) {
    const p = E.ioS(seg(t, 2.45, 4.35)), hd = dcRouteAt(p), z = lerp(0.95, 1.18, E.ioS(seg(t, 2.2, 4.5)));
    const u = clamp(lerp(1900, hd.x, 0.7), 960 / z, 2600 - 960 / z), v = clamp(lerp(980, hd.y, 0.7), 540 / z, 1500 - 540 / z);
    dcKB(g, st.map, u, v, z);
    g.save(); g.translate(960, 540); g.scale(z, z); g.translate(-u, -v);
    const R = DC_ROUTE;
    g.strokeStyle = 'rgba(142,42,30,0.9)'; g.lineWidth = 11; g.lineCap = 'round'; g.setLineDash([28, 18]);
    g.beginPath(); g.moveTo(R.pts[0][0], R.pts[0][1]); for (let i = 1; i < hd.i; i++) g.lineTo(R.pts[i][0], R.pts[i][1]); g.lineTo(hd.x, hd.y); g.stroke(); g.setLineDash([]);
    if (p > 0.01) { g.save(); g.translate(hd.x, hd.y); g.rotate(hd.a); g.fillStyle = DC.red; g.beginPath(); g.moveTo(30, 0); g.lineTo(-14, -20); g.lineTo(-6, 0); g.lineTo(-14, 20); g.closePath(); g.fill(); g.restore(); }
    // each town rings as the march reaches it
    DC_TOWNS.forEach(([, x, y], i) => {
      const at = [0, 0.3, 0.62, 1][i], k = seg(p, at - 0.001, at + 0.12);
      if (p < at - 0.001) return;
      g.strokeStyle = `rgba(142,42,30,${0.8 * (1 - k) + 0.25})`; g.lineWidth = 4; g.beginPath(); g.arc(x, y, 22 + 40 * E.outC(k), 0, TAU); g.stroke();
    });
    g.restore();
    dcSuper(g, t, 2.55, 3.65, 'MAY 4, 1863', 'The 9th marches west from Millbrook');
    dcSuper(g, t, 3.6, 4.7, 'JUNE 9, 1863', 'Encamped at Harrow Ford');
  }
  function dcShotC(g, t, st) {
    const j = t >= DC_T.jump, z = j ? 1.24 : 1, ox = j ? -30 : 0, oy = j ? 60 : 0;
    g.drawImage(st.shelf, 0, 0, 1920, 1080);
    const amb = g.createRadialGradient(960, 600, 100, 960, 600, 1100); amb.addColorStop(0, 'rgba(0,0,0,0)'); amb.addColorStop(1, 'rgba(0,0,0,0.6)'); g.fillStyle = amb; g.fillRect(0, 0, 1920, 1080);
    g.save(); g.translate(960 + ox, 1080 + oy); g.scale(z, z); g.translate(-960, -1080);
    const sway = vnoise(t * 0.8, 3) * 6, nod = vnoise(t * 1.3, 9) * 0.02;
    // sweater and collar
    const sw = g.createLinearGradient(500, 0, 1420, 0); sw.addColorStop(0, '#3f5045'); sw.addColorStop(0.6, '#25302a'); sw.addColorStop(1, '#141a17');
    g.fillStyle = sw; g.beginPath(); g.moveTo(480, 1090); g.bezierCurveTo(500, 900, 640, 850, 830, 825); g.lineTo(1090, 825); g.bezierCurveTo(1280, 850, 1420, 900, 1440, 1090); g.closePath(); g.fill();
    g.fillStyle = '#c9a084'; g.beginPath(); g.moveTo(900, 690); g.lineTo(1020, 690); g.lineTo(1040, 830); g.lineTo(960, 900); g.lineTo(880, 830); g.closePath(); g.fill();
    g.fillStyle = 'rgba(60,35,25,0.5)'; g.beginPath(); g.moveTo(900, 700); g.quadraticCurveTo(960, 780, 1020, 700); g.lineTo(1020, 690); g.lineTo(900, 690); g.closePath(); g.fill();
    g.fillStyle = '#d9d3c6'; g.beginPath(); g.moveTo(860, 820); g.lineTo(960, 905); g.lineTo(915, 935); g.lineTo(840, 840); g.fill(); g.beginPath(); g.moveTo(1060, 820); g.lineTo(960, 905); g.lineTo(1005, 935); g.lineTo(1080, 840); g.fill();
    g.save(); g.translate(960 + sway, 592); g.rotate(nod);
    // a silver bob behind the face, falling to the jaw
    const hc = g.createLinearGradient(-170, 0, 170, 0); hc.addColorStop(0, '#c4bfb5'); hc.addColorStop(0.6, '#8e8a82'); hc.addColorStop(1, '#4a4844');
    g.fillStyle = hc; g.beginPath(); g.moveTo(-172, 150); g.bezierCurveTo(-200, -40, -160, -215, 0, -218); g.bezierCurveTo(160, -215, 200, -40, 172, 150); g.quadraticCurveTo(150, 175, 120, 160); g.lineTo(-120, 160); g.quadraticCurveTo(-150, 175, -172, 150); g.fill();
    const fc = g.createRadialGradient(-55, -20, 20, 0, 10, 200); fc.addColorStop(0, '#efc6a6'); fc.addColorStop(0.55, '#c38d6c'); fc.addColorStop(1, '#6a4231');
    g.fillStyle = fc; g.beginPath(); g.moveTo(-138, -40); g.bezierCurveTo(-142, 80, -90, 170, 0, 178); g.bezierCurveTo(90, 170, 142, 80, 138, -40); g.bezierCurveTo(130, -150, -130, -150, -138, -40); g.fill();
    g.save(); g.clip();
    const rs = g.createLinearGradient(20, 0, 140, 0); rs.addColorStop(0, 'rgba(50,26,18,0)'); rs.addColorStop(1, 'rgba(50,26,18,0.6)'); g.fillStyle = rs; g.fillRect(0, -160, 150, 360);
    blob(g, -70, 60, 50, 'rgba(220,120,100,0.22)'); blob(g, 70, 60, 50, 'rgba(160,80,60,0.2)'); blob(g, 0, 190, 110, 'rgba(60,30,20,0.35)');
    g.restore();
    // the fringe swept from a side parting
    g.fillStyle = '#b3aea4'; g.beginPath(); g.moveTo(-150, 20); g.bezierCurveTo(-160, -130, -70, -205, 40, -200); g.bezierCurveTo(140, -190, 168, -100, 152, 10); g.bezierCurveTo(140, -70, 100, -112, 40, -118); g.bezierCurveTo(-20, -120, -100, -100, -128, -30); g.quadraticCurveTo(-140, 0, -150, 20); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 3; g.beginPath(); g.moveTo(-125, -70); g.bezierCurveTo(-80, -165, 20, -185, 100, -160); g.stroke();
    // eyes straight down the lens, glasses, brows
    const bl = 1 - Math.exp(-Math.pow((t - 5.0) / 0.05, 2)) - Math.exp(-Math.pow((t - 5.9) / 0.05, 2));
    [-48, 48].forEach(x => {
      g.fillStyle = '#efe4da'; g.beginPath(); g.ellipse(x, -10, 22, 10 * Math.max(0.1, bl), 0, 0, TAU); g.fill();
      if (bl > 0.3) { g.fillStyle = '#4a3324'; g.beginPath(); g.arc(x, -10, 9.5, 0, TAU); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(x, -10, 4, 0, TAU); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 3, -13, 2.4, 0, TAU); g.fill(); }
      g.strokeStyle = 'rgba(70,40,28,0.6)'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, -12, 24, 12, 0, PI * 1.05, PI * 1.95); g.stroke();
      g.fillStyle = '#8a8278'; g.save(); g.translate(x, -46); g.rotate(x < 0 ? 0.06 : -0.06); g.fillRect(-28, -4, 56, 8); g.restore();
      g.strokeStyle = '#2a221c'; g.lineWidth = 4.5; rrect(g, x - 40, -38, 80, 56, 16); g.stroke();
    });
    g.strokeStyle = '#2a221c'; g.lineWidth = 4; g.beginPath(); g.moveTo(-8, -18); g.quadraticCurveTo(0, -26, 8, -18); g.stroke();
    g.beginPath(); g.moveTo(-88, -14); g.lineTo(-122, -20); g.moveTo(88, -14); g.lineTo(122, -20); g.stroke();
    g.strokeStyle = 'rgba(90,50,35,0.5)'; g.lineWidth = 5; g.beginPath(); g.moveTo(10, 0); g.quadraticCurveTo(18, 50, 8, 64); g.stroke();
    g.fillStyle = 'rgba(80,40,30,0.5)'; g.beginPath(); g.ellipse(-12, 68, 9, 5, 0, 0, TAU); g.ellipse(14, 68, 9, 5, 0, 0, TAU); g.fill();
    // talking: the mouth opens with the speech envelope
    const op = Math.max(0, vnoise(t * 11, 4) * 0.7 + 0.3) * 13 * (t < 6.05 ? 1 : 0);
    g.fillStyle = '#9a5a50'; g.beginPath(); g.ellipse(0, 108, 40, 9 + op * 0.4, 0, 0, TAU); g.fill();
    g.fillStyle = '#3a1814'; g.beginPath(); g.ellipse(0, 108, 32, op * 0.5 + 0.5, 0, 0, TAU); g.fill();
    g.restore();
    // warm key from the left, cool rim on the right
    g.strokeStyle = 'rgba(170,200,230,0.3)'; g.lineWidth = 6; g.beginPath(); g.ellipse(960 + sway, 577, 178, 210, 0, -1.3, 0.5); g.stroke();
    g.restore();
    dcSuper(g, t, 4.75, 6.15, 'ELLEN MARSH', 'Historian');
  }
  function dcShotD(g, t, st) {
    const u = E.ioS(seg(t, 6.2, 8.4)), z = lerp(0.6, 0.78, u), cu = lerp(1000, 1060, u), cv = lerp(800, 900, u);
    g.save(); g.translate(960, 540); g.scale(z, z); g.translate(-cu, -cv);
    g.drawImage(st.letter, 0, 0);
    g.translate(DC_PAPER.x, DC_PAPER.y); g.rotate(DC_PAPER.r);
    DC_LINES.forEach(([s, x, y, size, a, b]) => {
      const k = seg(t, a, b); if (k <= 0) return;
      g.font = `400 ${size}px ${DC_F.hand}`; const w = g.measureText(s).width;
      g.save(); g.beginPath(); g.rect(x - 30, y - size * 1.7, (w + 60) * k, size * 2.6); g.clip();
      text(g, s, x, y, { font: DC_F.hand, size, color: 'rgba(38,28,20,0.92)' });
      g.restore();
      if (k > 0 && k < 1) { g.fillStyle = 'rgba(38,28,20,0.5)'; g.beginPath(); g.arc(x - 30 + (w + 60) * k, y - size * 0.3, 5, 0, TAU); g.fill(); }
    });
    g.restore();
    dcSuper(g, t, 6.5, 8.3, 'JUNE 9, 1863', 'Thomas Avery to his wife, Clara');
  }
  function dcShotE(g, t, st) {
    const a = E.ioS(seg(t, 7.8, 8.9)), w = E.ioC(seg(t, 8.5, 9.8));
    const z = lerp(0.98, 0.54, w), u = lerp(lerp(1250, 1950, a), 1700, w), v = lerp(600, 690, w);
    g.fillStyle = '#0d0a08'; g.fillRect(0, 0, 1920, 1080);
    dcKB(g, st.camp, u, v, z);
    const o = E.ioS(seg(t, DC_T.title, DC_T.title + 0.8));
    if (o > 0) {
      g.fillStyle = `rgba(10,7,5,${0.6 * o})`; g.fillRect(0, 0, 1920, 1080);
      g.save(); g.globalAlpha = o; g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 20;
      text(g, 'DOCUMENTARY', 960, 560, { font: DC_F.serif, weight: 600, size: 150, color: DC.white, align: 'center', ls: 22 });
      g.globalAlpha = E.ioS(seg(t, DC_T.title + 0.4, DC_T.title + 1.1));
      text(g, 'a history told in still photographs', 960, 640, { font: DC_F.serif, style: 'italic', weight: 500, size: 48, color: '#ead9b6', align: 'center' });
      text(g, 'AFTER KEN BURNS  ·  ERROL MORRIS', 960, 712, { font: DC_F.serif, weight: 600, size: 26, color: 'rgba(244,239,228,0.75)', align: 'center', ls: 8 });
      g.restore();
    }
  }

  MG.film({
    id: 'documentary', dur: 10, poster: 9.5,
    fonts: [['600 50px "Cormorant Garamond"', 'DOCUMENTARY THOMAS AVERY ELLEN MARSH JUNE MAY 1863'], ['italic 500 38px "Cormorant Garamond"', 'a history told Private Historian'], ['400 50px "IM Fell English"', 'Millbrook Cold Spring THE UPPER'], ['italic 400 44px "IM Fell English"', 'Tolland River Camp'], ['400 44px "Homemade Apple"', 'My dearest Clara, We marched']],
    meta: {
      family: 'H', name: 'Documentary Montage', sub: 'Photographs, maps and letters in motion', era: '1957 —',
      origin: 'Documentary montage tells history with still images: a rostrum camera pans and zooms across archival photographs, maps and letters while narration and readings carry the story. The National Film Board of Canada’s City of Gold (Colin Low and Wolf Koenig, 1957) pioneered the moving camera over stills; Ken Burns made it a national idiom with The Civil War (1990), and Apple later named the slow pan-and-zoom the “Ken Burns effect”. Errol Morris supplied the opposite pole: witnesses who look straight down the lens through his Interrotron, a teleprompter rig that puts the interviewer’s face over the camera.',
      works: 'City of Gold (Colin Low & Wolf Koenig, NFB, 1957) · Brooklyn Bridge (Ken Burns, 1981) · The Thin Blue Line (Errol Morris, 1988) · The Civil War (Ken Burns, PBS, 1990) · Baseball (Ken Burns, PBS, 1994) · The Fog of War (Errol Morris, 2003)',
      tech: ['Slow pan-and-zoom over stills', 'Name supers and a dated route map', 'Letter revealed in handwriting'],
      accent: '#b08850',
      motionDNA: 'The camera, not the subject, moves: unhurried push-ins on a face until the eyes hold the frame, pans across group photographs that discover people one by one, a route that draws itself across a map, a tilt down a handwritten page; long cross-dissolves between stills and the one hard, modern cut into an interview with a single jump cut.',
      visualDNA: 'Sepia tintypes in brass mats, albumen prints on card with pencil captions, parchment maps with hachured hills and a red dashed march, ruled letter paper in iron-gall ink; supers in plain white serif lower left; the interview lit low and warm, subject dead centre, eyes on the lens.',
      transitions: 'Fade up from black, slow cross-dissolves between stills, hard cut to and from the interview, jump cut, pull back to reveal the print under the title',
      implementation: ['Rostrum / animation-stand camera', 'Avid or Final Cut pan-and-zoom on scans', 'Canvas 2D (every photograph procedurally drawn)'],
      reproducibility: 'Fully procedural (no archival material used; people and places are fictional)',
      loopable: false,
    },
    setup() {
      return { portrait: dcPortrait(), map: dcMap(), letter: dcLetter(), camp: dcCamp(), shelf: dcShelf(), buf: offscreen(1920, 1080) };
    },
    draw(c, t, W, H, st) {
      const T = DC_T;
      c.fillStyle = DC.blk; c.fillRect(0, 0, W, H);
      if (t < T.c[0]) {
        if (t < T.a[1]) dcShotA(c, t, st);
        if (t >= T.b[0]) dissolve(c, st, E.ioS(seg(t, T.b[0], T.a[1])), g => dcShotB(g, t, st));
      } else if (t < T.d[0]) dcShotC(c, t, st);
      else {
        if (t < T.d[1]) dcShotD(c, t, st);
        if (t >= T.e[0]) dissolve(c, st, E.ioS(seg(t, T.e[0], T.d[1])), g => dcShotE(g, t, st));
      }
      grain(c, W, H, t, 0.07, 'overlay');
      vignette(c, W, H, 0.45);
      if (t < 0.8) { c.fillStyle = `rgba(0,0,0,${1 - E.ioS(seg(t, 0, 0.8))})`; c.fillRect(0, 0, W, H); }
    },
    score(A) {
      A.bus.gain.value = 1.7;
      // room tone and a low string bed (D major), dipping under the interview
      A.noise(0, { type: 'lowpass', f: 500, dur: 10, g: 0.012, hold: true, rel: 0.4 });
      [[0.2, [38, 45, 50, 54], 2.4], [2.6, [43, 50, 55, 59], 2.0], [6.2, [45, 52, 57, 61], 1.8], [8.0, [38, 45, 50, 57, 62], 2.0]].forEach(([t, n, d]) =>
        A.chord(t, n, { type: 'sawtooth', dur: d, g: 0.022, a: 0.6, lp: 700, spread: 7, rev: 0.6, hold: true, rel: 0.6, width: 0.6 }));
      // the fiddle lament: a slow air over the photographs
      const fid = (t, m, d, g = 0.06) => { A.osc(t, { type: 'sawtooth', f: midi(m), dur: d, g, a: 0.14, lp: 2300, vib: [5.2, 4], rev: 0.55, hold: true, rel: 0.25, pan: -0.1 }); A.osc(t, { type: 'triangle', f: midi(m), dur: d, g: g * 0.6, a: 0.12, detune: 6, hold: true, rel: 0.25, rev: 0.4 }); };
      [[0.5, 62, 0.95], [1.45, 66, 0.45], [1.9, 69, 0.95], [2.85, 71, 0.4], [3.25, 69, 0.45], [3.7, 66, 0.75]].forEach(([t, m, d]) => fid(t, m, d));
      // guitar under the map, picked in three
      [[0.4, [50, 57, 62]], [2.5, [43, 50, 59]], [3.4, [45, 52, 57]]].forEach(([t0, n]) => n.concat(n[1]).forEach((m, i) => A.pluck(t0 + i * 0.3, midi(m), { g: 0.16, dur: 1.4, bright: 0.5, lp: 2600, rev: 0.3, pan: 0.2 })));
      // the interview: a quiet repeating arpeggio, Glass-like, while she speaks
      for (let k = 0; k < 13; k++) A.pluck(4.55 + k * 0.125, midi([62, 66, 69, 66][k % 4] + (k > 6 ? -2 : 0)), { g: 0.07, dur: 0.6, bright: 0.4, lp: 1800, rev: 0.25 });
      // the letter: the air returns and rises
      [[6.25, 64, 0.5], [6.75, 66, 0.5], [7.25, 67, 0.55], [7.8, 69, 0.9], [8.7, 74, 0.6], [9.3, 73, 0.3], [9.55, 74, 0.45]].forEach(([t, m, d]) => fid(t, m, d, 0.065));
      [[7.8, [50, 57, 62]], [8.7, [43, 50, 59]]].forEach(([t0, n]) => n.forEach((m, i) => A.pluck(t0 + i * 0.3, midi(m), { g: 0.14, dur: 1.6, bright: 0.5, lp: 2400, rev: 0.35, pan: 0.2 })));
    },
  });

  /* =====================================================================
     MUSIC VIDEO — "Turn It Around" by Night Signal (both fictional), cut
     at 120 BPM. A Gondry stage: robots walk the rim of a lit disc in
     lockstep, skeletons climb and descend a staircase, dancers sway on the
     drum riser, and the MTV credit sits lower left; a cut on the bar to a
     hotel lobby where a man in a suit dances alone in one take and then
     lifts off into the air; a cut to eight treadmills, four performers
     walking and hopping in sync; a mirror split that becomes a four-way
     reflection and then a turning kaleidoscope; the band under sweeping
     moving-head beams in a teal-and-amber grade, with the title set on
     the last two beats. Every cut lands on a beat, never faster than one
     per half second, and no shot flashes.
     ===================================================================== */
  const MV_BPM = 120, MV_B = 60 / MV_BPM;
  const MV_F = { blk: '"Archivo Black", Impact, sans-serif', ar: 'Archivo, "Helvetica Neue", Arial, sans-serif' };
  const MV = { vio: '#1c0b3d', vio2: '#3b1468', amber: '#ffb347', cyan: '#3fe0ff', pink: '#ff4fa0', gold: '#e8c14a', chrome: '#c9ced6', teal: '#06343c', cream: '#f2e3a2' };
  const MV_T = { cut2: 1.0, lobby: 2.0, fly: 3.2, tread: 4.0, hop: [4.9, 5.4], mirror: 6.0, quad: 6.5, kal: 7.0, kal2: 7.5, band: 8.0, t1: 8.5, t2: 9.0 };
  const mvBeat = t => Math.floor(t / MV_B + 1e-6);
  const mvPump = t => Math.exp(-((t % MV_B) / 0.14));   // a soft swell on every beat (no flashing)
  // Poses: radians from hanging straight down, + toward screen right; e/k bend the elbow/knee.
  const MV_P0 = { lean: 0, hd: 0, sL: -0.15, eL: 0.1, sR: 0.15, eR: -0.1, hL: -0.08, kL: 0, hR: 0.08, kR: 0 };
  const MV_DANCE = [
    { lean: 0.05, hd: -0.1, sL: -0.6, eL: -1.3, sR: 0.5, eR: 1.4, hL: -0.25, kL: 0.3, hR: 0.15, kR: -0.1 },
    { lean: -0.05, hd: 0.12, sL: -2.4, eL: 0.3, sR: 2.4, eR: -0.3, hL: -0.15, kL: 0, hR: 0.4, kR: -0.7 },
    { lean: 0.18, hd: 0.2, sL: -0.3, eL: 0.2, sR: 1.9, eR: 0.1, hL: -0.45, kL: 0.5, hR: 0.1, kR: 0 },
    { lean: 0.22, hd: -0.25, sL: -1.0, eL: -1.5, sR: 1.0, eR: 1.5, hL: -0.75, kL: 1.4, hR: 0.75, kR: -1.4 },
    { lean: -0.15, hd: 0, sL: -1.6, eL: 0, sR: 1.2, eR: 0.7, hL: -0.05, kL: 0, hR: 1.35, kR: -0.3 },
    { lean: 0.1, hd: 0.15, sL: -2.9, eL: -0.2, sR: 0.4, eR: 1.6, hL: 0.3, kL: -0.6, hR: -0.1, kR: 0.2 },
  ];
  const MV_FLY = { lean: 0.12, hd: -0.15, sL: -1.65, eL: 0.05, sR: 1.65, eR: -0.05, hL: -0.12, kL: 0.35, hR: 0.1, kR: 0.15 };
  const mvMix = (a, b, u) => { const o = {}; for (const k in MV_P0) o[k] = lerp(a[k] ?? MV_P0[k], b[k] ?? MV_P0[k], u); return o; };
  // Dance on the beat: snap into the next key just after each beat.
  const mvDance = (t, off = 0, keys = MV_DANCE) => { const b = mvBeat(t) + off, f = (t % MV_B) / MV_B; return mvMix(keys[(b + keys.length - 1) % keys.length], keys[b % keys.length], E.outC(clamp(f / 0.35))); };
  // Walk cycle facing right, one step per beat.
  const mvWalk = (ph, amp = 1) => { const s = Math.sin(ph), q = Math.cos(ph); return { lean: 0.06 * amp, hd: 0, hL: 0.42 * s * amp, kL: -0.8 * Math.max(0, -q) * amp, hR: -0.42 * s * amp, kR: -0.8 * Math.max(0, q) * amp, sL: -0.45 * s * amp, eL: 0.55 * amp, sR: 0.45 * s * amp, eR: 0.55 * amp }; };

  // A figure built from capsules; feet land on y, h = standing height, face = ±1 (scaleable through 0 for a turn).
  function mvFig(c, x, y, h, P, S, face = 1) {
    const L = (a, l) => [Math.sin(a) * l, Math.cos(a) * l];
    const tl = h * 0.25, sl = h * 0.25, th = h * 0.3, ua = h * 0.17, fa = h * 0.16, hr = h * 0.068, lw = h * 0.058;
    const leg = (a, k) => { const t1 = L(a, tl), t2 = L(a + k, sl); return [t1, [t1[0] + t2[0], t1[1] + t2[1]]]; };
    const lg = [leg(P.hL, P.kL), leg(P.hR, P.kR)];
    const drop = Math.max(lg[0][1][1], lg[1][1][1]);
    c.save(); c.translate(x, y - drop - (P.lift || 0)); c.scale(face, 1);
    const ln = P.lean, cx = Math.cos(ln), sx = Math.sin(ln), nk = [sx * th, -cx * th];
    const sh = [[nk[0] - cx * h * 0.075, nk[1] - sx * h * 0.075 + h * 0.02], [nk[0] + cx * h * 0.075, nk[1] + sx * h * 0.075 + h * 0.02]];
    const hp = [[-cx * h * 0.045, -sx * h * 0.045], [cx * h * 0.045, sx * h * 0.045]];
    const ha = ln + P.hd, hc = [nk[0] + Math.sin(ha) * hr * 1.5, nk[1] - Math.cos(ha) * hr * 1.5];
    c.lineCap = 'round'; c.lineJoin = 'round';
    const limb = (p0, p1, p2, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.stroke(); };
    const feet = [];
    [0, 1].forEach(i => { const o = hp[i], [k, f] = lg[i], kn = [o[0] + k[0], o[1] + k[1]], ft = [o[0] + f[0], o[1] + f[1]]; feet.push(ft); limb(o, kn, ft, lw * 1.2, S.pants); if (S.bones) limb(o, kn, ft, lw * 0.3, S.bones); });
    c.fillStyle = S.shoe || '#111'; feet.forEach(f => { c.beginPath(); c.ellipse(f[0] + h * 0.025, f[1], h * 0.045, h * 0.022, 0, 0, TAU); c.fill(); });
    if (S.dress) { c.fillStyle = S.dress; poly(c, [[nk[0] * 0.3 - h * 0.07, nk[1] * 0.3], [nk[0] * 0.3 + h * 0.07, nk[1] * 0.3], [h * 0.16, h * 0.2], [-h * 0.16, h * 0.2]]); c.fill(); }
    c.strokeStyle = S.top; c.lineWidth = h * 0.15; c.beginPath(); c.moveTo(0, -h * 0.02); c.lineTo(nk[0] * 0.88, nk[1] * 0.88); c.stroke();
    if (S.shirt) { c.fillStyle = S.shirt; poly(c, [[nk[0] - h * 0.035, nk[1] + h * 0.01], [nk[0] + h * 0.035, nk[1] + h * 0.01], [nk[0] * 0.72, nk[1] * 0.72]]); c.fill(); }
    if (S.bones) { c.strokeStyle = S.bones; c.lineWidth = lw * 0.25; for (let k = 0; k < 4; k++) { const u = 0.45 + k * 0.12; c.beginPath(); c.moveTo(nk[0] * u - cx * h * 0.05, nk[1] * u - sx * h * 0.05); c.lineTo(nk[0] * u + cx * h * 0.05, nk[1] * u + sx * h * 0.05); c.stroke(); } }
    const arm = (s, a, e) => { const el = L(a, ua), w = L(a + e, fa), p1 = [s[0] + el[0], s[1] + el[1]], p2 = [p1[0] + w[0], p1[1] + w[1]]; limb(s, p1, p2, lw, S.top); if (S.bones) limb(s, p1, p2, lw * 0.28, S.bones); c.fillStyle = S.skin; c.beginPath(); c.arc(p2[0], p2[1], lw * 0.62, 0, TAU); c.fill(); };
    arm(sh[0], P.sL, P.eL); arm(sh[1], P.sR, P.eR);
    c.fillStyle = S.skin; c.beginPath(); c.arc(hc[0], hc[1], hr, 0, TAU); c.fill();
    if (S.hair) { c.fillStyle = S.hair; c.beginPath(); c.arc(hc[0], hc[1], hr * 1.04, PI * 1.02 + ha, PI * 1.98 + ha); c.fill(); }
    if (S.helmet) {
      const hg = c.createLinearGradient(hc[0] - hr, hc[1] - hr, hc[0] + hr, hc[1] + hr); hg.addColorStop(0, '#fff2b0'); hg.addColorStop(0.5, S.helmet); hg.addColorStop(1, '#7a5a14');
      c.fillStyle = hg; c.beginPath(); c.arc(hc[0], hc[1], hr * 1.3, 0, TAU); c.fill();
      c.fillStyle = '#16121e'; rrect(c, hc[0] - hr * 0.5, hc[1] - hr * 0.35, hr * 1.8, hr * 0.6, hr * 0.3); c.fill();
    }
    if (S.skull) { c.fillStyle = '#111'; c.beginPath(); c.arc(hc[0] + hr * 0.3, hc[1] - hr * 0.1, hr * 0.28, 0, TAU); c.arc(hc[0] - hr * 0.25, hc[1] - hr * 0.1, hr * 0.28, 0, TAU); c.fill(); }
    c.restore();
  }
  const MV_ST = {
    robot: { top: '#c9ced6', pants: '#8f96a2', skin: '#c9ced6', helmet: MV.gold, shoe: '#3a3d44' },
    skel: { top: '#121014', pants: '#121014', skin: '#ece8de', bones: '#ece8de', shoe: '#121014', skull: true },
    disco: { top: MV.pink, pants: '#e8b89a', dress: '#ff7cbc', skin: '#e8b89a', hair: '#2a1a12', shoe: '#ff4fa0' },
    suit: { top: '#2b2e35', pants: '#24272d', skin: '#e2b598', shoe: '#0e0e10', hair: '#c9c3b8', shirt: '#f2efe8' },
  };

  // Shot 1: Gondry's stage — every group dances one instrument, in lockstep.
  function mvStage(c, t) {
    const bg = c.createLinearGradient(0, 0, 0, 1080); bg.addColorStop(0, MV.vio); bg.addColorStop(0.6, MV.vio2); bg.addColorStop(1, '#12061f'); c.fillStyle = bg; c.fillRect(0, 0, 1920, 1080);
    const pm = mvPump(t), b = mvBeat(t);
    // back wall: tall soft light columns, one brightening on each beat in turn
    for (let i = 0; i < 9; i++) { const x = 150 + i * 205, on = i === b % 9 ? pm : 0; const g = c.createLinearGradient(0, 80, 0, 640); g.addColorStop(0, `rgba(255,120,200,${0.12 + 0.3 * on})`); g.addColorStop(1, 'rgba(255,120,200,0)'); c.fillStyle = g; rrect(c, x - 40, 80, 80, 560, 40); c.fill(); }
    const cx = 960, cy = 770, RX = 720, RY = 190;
    // staircase, skeletons going up and down it
    for (let k = 0; k < 7; k++) { const y = 600 - k * 42, w = 520 - k * 30; c.fillStyle = mixc('#2a1450', '#5a2a90', k / 7); c.fillRect(cx - w / 2, y - 42, w, 42); c.fillStyle = 'rgba(255,200,255,0.35)'; c.fillRect(cx - w / 2, y - 42, w, 4); }
    [-150, -50, 50, 150].forEach((dx, i) => {
      const ph = (t / MV_B + i * 2) % 12, step = ph < 6 ? ph : 12 - ph, k = Math.floor(step), f = step - k, up = ph < 6;
      const yy = 600 - (k + E.ioS(f)) * 42;
      mvFig(c, cx + dx, yy, 150, mvWalk(PI * t / MV_B, 0.8), MV_ST.skel, i % 2 ? -1 : 1);
      if (!up) {} // descending: same walk, they face the camera's other side
    });
    const robots = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 0.55; robots.push({ a, x: cx + Math.cos(a) * (RX - 120), y: cy + Math.sin(a) * (RY - 30), d: Math.sin(a) }); }
    const drawRobot = r => mvFig(c, r.x, r.y, 230 * (0.82 + 0.18 * r.d), mvWalk(PI * t / MV_B, 1), MV_ST.robot, r.d > 0 ? -1 : 1);
    robots.filter(r => r.d < 0).sort((p, q) => p.y - q.y).forEach(drawRobot);
    // the disc: outer ring, rim bulbs chasing on the beat, raised centre
    const pg = c.createLinearGradient(0, cy - RY, 0, cy + RY); pg.addColorStop(0, '#3a1c66'); pg.addColorStop(1, '#170a2c');
    c.fillStyle = '#0d0618'; c.beginPath(); c.ellipse(cx, cy + 34, RX, RY, 0, 0, TAU); c.fill();
    c.fillStyle = pg; c.beginPath(); c.ellipse(cx, cy, RX, RY, 0, 0, TAU); c.fill();
    for (let k = 0; k < 36; k++) { const a = k / 36 * TAU, on = (k + b) % 4 === 0; c.fillStyle = on ? `rgba(255,190,90,${0.6 + 0.4 * pm})` : 'rgba(255,190,90,0.25)'; c.beginPath(); c.arc(cx + Math.cos(a) * RX * 0.97, cy + 10 + Math.sin(a) * RY * 0.97, on ? 7 : 5, 0, TAU); c.fill(); }
    c.fillStyle = '#26104a'; c.fillRect(cx - 330, cy - 70, 660, 50);
    c.fillStyle = '#26104a'; c.beginPath(); c.ellipse(cx, cy - 20, 330, 84, 0, 0, PI); c.fill();
    const dg = c.createRadialGradient(cx, cy - 70, 20, cx, cy - 70, 340); dg.addColorStop(0, `rgba(255,150,220,${0.65 + 0.3 * pm})`); dg.addColorStop(1, '#5a2a90');
    c.fillStyle = dg; c.beginPath(); c.ellipse(cx, cy - 70, 330, 84, 0, 0, TAU); c.fill();
    [-210, -70, 70, 210].forEach((dx, i) => { const s = Math.sin(PI * t / MV_B + i * PI); mvFig(c, cx + dx, cy - 64, 190, { ...MV_P0, lean: 0.14 * s, hd: -0.1 * s, sL: -2.5 + 0.4 * s, eL: 0.4, sR: 0.9 + 0.5 * s, eR: 1.2, hL: -0.1 + 0.08 * s, hR: 0.1 + 0.08 * s, kL: 0.15 * Math.max(0, s), kR: -0.15 * Math.max(0, -s) }, MV_ST.disco, i % 2 ? -1 : 1); });
    robots.filter(r => r.d >= 0).sort((p, q) => p.y - q.y).forEach(drawRobot);
  }
  // Shot 2: the empty hotel lobby, one take; a man in a suit dances, then flies.
  function mvLobby(c, t) {
    const u = seg(t, MV_T.lobby, MV_T.tread), fly = E.ioC(seg(t, MV_T.fly, MV_T.tread + 0.1)), lift = fly * 420;
    c.save(); c.translate(960, 540); c.scale(lerp(1.0, 1.08, u), lerp(1.0, 1.08, u)); c.translate(-960 + lerp(30, -30, u), -540 + fly * 220);
    const wall = c.createLinearGradient(0, -300, 0, 640); wall.addColorStop(0, '#2a1a10'); wall.addColorStop(1, '#6b4a2e'); c.fillStyle = wall; c.fillRect(-200, -400, 2320, 1060);
    for (let x = -160; x < 2100; x += 120) { c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x, 300, 6, 340); }
    // mezzanine with a railing, the ceiling lights above it
    c.fillStyle = '#3a2416'; c.fillRect(-200, 250, 2320, 50); c.fillStyle = '#c8a46a'; c.fillRect(-200, 196, 2320, 8);
    for (let x = -180; x < 2120; x += 40) c.fillRect(x, 204, 4, 46);
    for (let k = 0; k < 9; k++) blob(c, 60 + k * 230, -120, 140, 'rgba(255,214,150,0.35)');
    for (let k = 0; k < 9; k++) { blob(c, 60 + k * 230, 320, 70, 'rgba(255,214,150,0.5)'); }
    // marble columns
    [140, 700, 1220, 1780].forEach(x => { const g = c.createLinearGradient(x - 50, 0, x + 50, 0); g.addColorStop(0, '#b9a88c'); g.addColorStop(0.4, '#efe4cf'); g.addColorStop(1, '#8a7a62'); c.fillStyle = g; c.fillRect(x - 48, 300, 96, 360); c.fillStyle = '#5a4430'; c.fillRect(x - 60, 640, 120, 24); c.fillRect(x - 60, 296, 120, 18); });
    // patterned carpet in perspective
    const fl = c.createLinearGradient(0, 660, 0, 1200); fl.addColorStop(0, '#6a2a22'); fl.addColorStop(1, '#3a1410'); c.fillStyle = fl; c.fillRect(-200, 660, 2320, 700);
    for (let row = 0; row < 9; row++) { const y = 680 + Math.pow(row / 8, 1.6) * 520, s = 0.4 + row * 0.22; for (let x = -200 + (row % 2) * 60 * s; x < 2120; x += 120 * s) { c.fillStyle = 'rgba(214,170,90,0.35)'; poly(c, [[x, y - 8 * s], [x + 22 * s, y], [x, y + 8 * s], [x - 22 * s, y]]); c.fill(); } }
    // armchairs and a luggage cart
    [[360, 0], [520, 1]].forEach(([x, k]) => { c.fillStyle = '#2f4a3e'; rrect(c, x - 70, 590, 140, 110, 20); c.fill(); c.fillStyle = '#3d5c4e'; rrect(c, x - 80, 640, 160, 50, 16); c.fill(); });
    c.strokeStyle = '#d6b060'; c.lineWidth = 7; c.beginPath(); c.moveTo(1500, 700); c.lineTo(1500, 520); c.quadraticCurveTo(1580, 480, 1660, 520); c.lineTo(1660, 700); c.moveTo(1490, 700); c.lineTo(1670, 700); c.stroke();
    c.fillStyle = '#7a3a2a'; c.fillRect(1520, 610, 110, 86); c.fillStyle = '#c7b48a'; c.fillRect(1530, 560, 80, 50);
    // the dancer
    const P = fly > 0 ? mvMix(mvDance(t, 1), MV_FLY, E.ioS(seg(t, MV_T.fly, MV_T.fly + 0.4))) : mvDance(t, 1);
    P.lift = lift;
    c.fillStyle = `rgba(0,0,0,${0.35 * (1 - fly)})`; c.beginPath(); c.ellipse(960, 932, 130 * (1 - 0.5 * fly), 20, 0, 0, TAU); c.fill();
    mvFig(c, 960 + vnoise(t * 2, 7) * 30, 930, 540, P, MV_ST.suit, 1);
    c.restore();
    const vg = c.createLinearGradient(0, 0, 0, 1080); vg.addColorStop(0, 'rgba(255,190,110,0.08)'); vg.addColorStop(1, 'rgba(40,10,0,0.25)'); c.fillStyle = vg; c.fillRect(0, 0, 1920, 1080);
  }
  // Shot 3: eight treadmills, four performers, one locked-off take.
  function mvTread(c, x, y, s, dir, t) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = 'rgba(0,0,0,0.18)'; c.beginPath(); c.ellipse(0, 22, 190, 18, 0, 0, TAU); c.fill();
    c.fillStyle = '#26272b'; poly(c, [[-170, 10], [170, 10], [150, -30], [-150, -30]]); c.fill();
    c.fillStyle = '#3a3b40'; poly(c, [[-160, 0], [160, 0], [142, -26], [-142, -26]]); c.fill();
    c.save(); poly(c, [[-160, 0], [160, 0], [142, -26], [-142, -26]]); c.clip();
    c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 4; const off = ((t * 300 * dir) % 40 + 40) % 40;
    for (let k = -200; k < 200; k += 40) { c.beginPath(); c.moveTo(k + off, 0); c.lineTo(k + off - 6, -26); c.stroke(); }
    c.restore();
    c.fillStyle = '#b8bcc4'; c.fillRect(-172, 8, 344, 8);
    const fx = -dir * 150;
    c.strokeStyle = '#9aa0aa'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(fx, -10); c.lineTo(fx - dir * 14, -210); c.moveTo(fx - dir * 14, -170); c.lineTo(fx + dir * 70, -170); c.stroke();
    c.fillStyle = '#2c2e33'; rrect(c, fx - dir * 14 - 34, -246, 68, 40, 6); c.fill(); c.fillStyle = '#ff5a3c'; c.fillRect(fx - dir * 14 - 20, -234, 40, 8);
    c.restore();
  }
  function mvTreadmills(c, t) {
    const bg = c.createLinearGradient(0, 0, 0, 640); bg.addColorStop(0, '#f6e7a8'); bg.addColorStop(1, '#e9d27e'); c.fillStyle = bg; c.fillRect(0, 0, 1920, 1080);
    c.fillStyle = '#d4cbb6'; c.fillRect(0, 600, 1920, 480); c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(0, 600, 1920, 6);
    for (let k = 0; k < 12; k++) { c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(0, 640 + k * 38 + k * k * 1.6, 1920, 2); }
    const ph = PI * t / MV_B, hop = seg(t, MV_T.hop[0], MV_T.hop[1]), turn = E.ioC(seg(t, MV_T.hop[0], MV_T.hop[1]));
    const backX = [460, 860, 1260, 1660], frontX = [360, 760, 1160, 1560], bDir = [1, -1, 1, -1], fDir = [-1, 1, -1, 1];
    const arms = t2 => { const b = mvBeat(t2) % 4; return [{ sL: -0.45, eL: 0.55, sR: 0.45, eR: 0.55 }, { sL: -2.6, eL: 0.2, sR: 0.3, eR: 0.5 }, { sL: -0.45, eL: 0.55, sR: 0.45, eR: 0.55 }, { sL: -0.3, eL: 0.5, sR: 2.6, eR: -0.2 }][b]; };
    const perf = (x, y, h, face, S, extra = {}) => { const w = mvWalk(ph, 1), a = arms(t); const f = (t % MV_B) / MV_B, k = E.outC(clamp(f / 0.3)); const prev = arms(t - MV_B); mvFig(c, x, y, h, { ...w, sL: lerp(prev.sL, a.sL, k), eL: lerp(prev.eL, a.eL, k), sR: lerp(prev.sR, a.sR, k), eR: lerp(prev.eR, a.eR, k), ...extra }, S, face); };
    const shirts = ['#e8402f', '#2a8fd8', '#3aa652', '#8a4bd1'], Sx = col => ({ top: col, pants: '#2b2b33', skin: '#e0b090', shoe: '#111', hair: '#2a1a12' });
    backX.forEach((x, i) => mvTread(c, x, 700, 0.74, bDir[i], t));
    // back performers turn around on their belts at the hop
    [[1, 0], [3, 2]].forEach(([i, si]) => { const f0 = -bDir[i], face = lerp(f0, -f0, turn); perf(backX[i], 680, 250, Math.abs(face) < 0.08 ? 0.08 * Math.sign(face || 1) : face, Sx(shirts[si])); });
    frontX.forEach((x, i) => mvTread(c, x, 900, 1, fDir[i], t));
    // front performers hop one treadmill to the right, landing on a belt running the other way
    [[0, 1], [2, 3]].forEach(([i, si]) => {
      const x = lerp(frontX[i], frontX[i + 1], E.ioS(hop)), lift = Math.sin(PI * hop) * 160;
      const face = hop < 0.5 ? -fDir[i] : -fDir[i + 1];
      const tuck = Math.sin(PI * hop);
      perf(x, 874, 330, face, Sx(shirts[si]), hop > 0 && hop < 1 ? { lift, hL: -0.6 * tuck, kL: 1.2 * tuck, hR: 0.6 * tuck, kR: -1.2 * tuck, sL: -2.4, sR: 2.4, eL: 0.2, eR: -0.2 } : {});
    });
  }
  // Shot 4 source: the dancer on a graded set, rendered into a half-frame buffer for mirroring.
  function mvSource(g, t) {
    const pm = mvPump(t);
    const bg = g.createLinearGradient(0, 0, 0, 1080); bg.addColorStop(0, '#ff2d8a'); bg.addColorStop(0.55, '#5b1fd1'); bg.addColorStop(1, '#18c8e0'); g.fillStyle = bg; g.fillRect(0, 0, 960, 1080);
    for (let k = 0; k < 7; k++) { g.strokeStyle = `rgba(255,240,120,${0.25 + 0.2 * pm})`; g.lineWidth = 14; g.beginPath(); g.arc(960, 540, 80 + k * 120 + (t * 120) % 120, 0, TAU); g.stroke(); }
    for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(0, 100 + k * 170 + ((t * 80) % 170), 960, 30); }
    mvFig(g, 700, 1000, 820, mvDance(t, 3), { top: '#fff6e8', pants: '#fff6e8', skin: '#fff6e8', shoe: '#fff6e8' }, 1);
  }
  function mvMirror(c, t, st) {
    const g = st.src.getContext('2d'); mvSource(g, t);
    const src = st.src;
    if (t < MV_T.quad) {
      c.drawImage(src, 0, 0); c.save(); c.translate(1920, 0); c.scale(-1, 1); c.drawImage(src, 0, 0); c.restore();
    } else if (t < MV_T.kal) {
      [[0, 0, 1, 1], [1920, 0, -1, 1], [0, 1080, 1, -1], [1920, 1080, -1, -1]].forEach(([x, y, sx, sy]) => { c.save(); c.translate(x, y); c.scale(sx * 1, sy * 1); c.drawImage(src, 0, 0, 960, 1080, 0, 0, 960, 540); c.restore(); });
    } else {
      const n = t < MV_T.kal2 ? 6 : 8, step = TAU / n, rot = (t - MV_T.kal) * 0.5;
      c.fillStyle = '#000'; c.fillRect(0, 0, 1920, 1080);
      for (let k = 0; k < n; k++) {
        c.save(); c.translate(960, 540); c.rotate(rot + k * step); if (k % 2) { c.rotate(step); c.scale(1, -1); }
        c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 1200, -0.002, step + 0.002); c.closePath(); c.clip();
        c.rotate(step / 2); c.drawImage(src, 0, 0, 960, 1080, -40, -560, 1050, 1180);
        c.restore();
      }
    }
  }
  // Shot 5: the band in a teal-and-amber grade under sweeping moving heads.
  function mvBand(c, t) {
    const pm = mvPump(t), u = seg(t, MV_T.band, 10);
    c.save(); c.translate(960, 540); c.scale(lerp(1.06, 1.0, E.outC(u)), lerp(1.06, 1.0, E.outC(u))); c.translate(-960 + vnoise(t * 0.7, 2) * 8, -540 + vnoise(t * 0.6, 3) * 6);
    const bg = c.createLinearGradient(0, 100, 0, 1000); bg.addColorStop(0, '#04262e'); bg.addColorStop(0.6, '#0b3a44'); bg.addColorStop(1, '#3a1a0a'); c.fillStyle = bg; c.fillRect(-40, -40, 2000, 1160);
    blob(c, 960, 620, 700, `rgba(255,150,60,${0.22 + 0.08 * pm})`);
    // moving heads on the truss: beams sweep slowly, accented a little on the beat
    c.fillStyle = '#05080a'; c.fillRect(-40, 150, 2000, 26);
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const x = 180 + i * 260, col = i % 2 ? MV.cyan : MV.amber, a = Math.sin((t - MV_T.band) * 1.6 + i * 0.9) * 0.55 + (i - 3) * -0.06, sp = 0.07;
      const g = c.createLinearGradient(x, 176, x + Math.sin(a) * 1000, 176 + Math.cos(a) * 1000); g.addColorStop(0, rgba(col, 0.45 + 0.15 * pm)); g.addColorStop(1, rgba(col, 0));
      c.fillStyle = g; c.beginPath(); c.moveTo(x, 176); c.lineTo(x + Math.sin(a - sp) * 1100, 176 + Math.cos(a - sp) * 1100); c.lineTo(x + Math.sin(a + sp) * 1100, 176 + Math.cos(a + sp) * 1100); c.closePath(); c.fill();
      blob(c, x, 176, 40, rgba(col, 0.8));
    }
    c.globalCompositeOperation = 'source-over';
    // drum riser and kit
    c.fillStyle = '#120a08'; c.fillRect(700, 690, 520, 90);
    const rim = (x, y, h, P, face, extra) => { const dark = { top: '#07090c', pants: '#07090c', skin: '#07090c', shoe: '#07090c', hair: '#07090c' }; mvFig(c, x - 4, y - 3, h, P, { ...dark, top: '#3fe0ff', pants: '#3fe0ff', skin: '#3fe0ff', hair: '#3fe0ff', shoe: '#3fe0ff' }, face); mvFig(c, x, y, h, P, dark, face); if (extra) extra(); };
    const ph = PI * t / MV_B;
    rim(960, 700, 300, { ...MV_P0, sL: -0.9 + 0.35 * Math.sin(ph * 2), eL: -1.1, sR: 0.9 - 0.35 * Math.sin(ph * 2 + 1), eR: 1.1, hd: 0.25 * Math.abs(Math.sin(ph)) }, 1);
    c.fillStyle = '#e9e2d0'; c.beginPath(); c.arc(960, 640, 80, 0, TAU); c.fill(); c.fillStyle = '#120a08'; c.beginPath(); c.arc(960, 640, 72, 0, TAU); c.fill();
    text(c, 'NIGHT SIGNAL', 960, 650, { font: MV_F.blk, size: 22, color: '#e9e2d0', align: 'center', ls: 2 });
    [[860, 600, 44], [1060, 600, 44], [800, 540, 50], [1120, 530, 54]].forEach(([x, y, r], i) => { c.fillStyle = '#0a0606'; c.beginPath(); c.ellipse(x, y, r, i > 1 ? 8 : 22, 0, 0, TAU); c.fill(); c.strokeStyle = `rgba(255,200,90,${0.5 + 0.4 * pm})`; c.lineWidth = 3; c.stroke(); });
    // guitarist and bassist, heads nodding, strumming
    [[470, 1, '#ffb347'], [1450, -1, '#3fe0ff']].forEach(([x, f, col], i) => {
      const nod = 0.3 * Math.abs(Math.sin(ph + i)), strum = Math.sin(ph * 2 + i) * 0.4;
      rim(x, 960, 470, { ...MV_P0, lean: 0.1 * f, hd: nod, sL: -0.5, eL: -1.2 + strum, sR: 0.9, eR: -1.9, hL: -0.25, hR: 0.25 }, f, () => {
        c.save(); c.translate(x + f * 10, 960 - 470 * 0.6); c.scale(f, 1); c.rotate(-0.42); c.fillStyle = '#07090c'; c.fillRect(-300, -9, 300, 18); c.fillRect(-340, -16, 46, 32); c.beginPath(); c.arc(10, 0, 58, 0, TAU); c.arc(-48, 0, 44, 0, TAU); c.fill(); c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.arc(10, 0, 58, -2.3, 2.3); c.stroke(); c.restore();
      });
    });
    // the singer at the front, mic stand, arm up on the backbeat
    const sb = mvBeat(t) % 4, up = sb === 1 || sb === 3 ? E.outC(clamp(((t % MV_B) / MV_B) / 0.3)) : 1 - E.outC(clamp(((t % MV_B) / MV_B) / 0.3));
    c.strokeStyle = '#07090c'; c.lineWidth = 8; c.beginPath(); c.moveTo(800, 1000); c.lineTo(790, 600); c.stroke();
    rim(770, 1010, 560, { ...MV_P0, lean: -0.08, hd: -0.2, sL: -0.6, eL: -2.2, sR: lerp(0.5, 2.7, up), eR: lerp(0.4, -0.1, up), hL: -0.2, hR: 0.22, kR: -0.15 }, 1);
    c.restore();
  }

  MG.film({
    id: 'musicvideo', dur: 10, poster: 9.6,
    fonts: [['400 170px "Archivo Black"', 'MUSIC VIDEO NIGHT SIGNAL'], ['500 40px Archivo', 'Night Signal "Turn It Around" Mirror Room Loop Records Director: Ada Quill cut on the beat'], ['700 40px Archivo', 'Night Signal AFTER GONDRY']],
    meta: {
      family: 'H', name: 'Music Video', sub: 'Concept videos cut on the beat', era: '1981 —',
      origin: 'The music video turned a single into a three-minute short film: after MTV launched in 1981, directors treated each song as a concept, building performance, choreography and in-camera tricks around its tempo. Michel Gondry made the arrangement the choreography in Daft Punk’s “Around the World” (each costumed group dances one instrument), Spike Jonze had Christopher Walken dance and fly through an empty hotel lobby in Fatboy Slim’s “Weapon of Choice”, and OK Go danced across eight treadmills in a single take for “Here It Goes Again”.',
      works: 'Thriller (Michael Jackson, dir. John Landis, 1983) · Take On Me (a-ha, dir. Steve Barron, 1985) · Sledgehammer (Peter Gabriel, dir. Stephen R. Johnson, 1986) · Around the World (Daft Punk, dir. Michel Gondry, 1997) · Praise You (Fatboy Slim, dir. Spike Jonze, 1999) · Weapon of Choice (Fatboy Slim, dir. Spike Jonze, 2001) · Star Guitar (The Chemical Brothers, dir. Michel Gondry, 2002) · Here It Goes Again (OK Go, 2006)',
      tech: ['Cuts locked to 120 BPM', 'One-take choreography sets', 'Mirror and kaleidoscope'],
      accent: '#c46bff',
      motionDNA: 'The track is the edit: every cut lands on a beat and every shot changes on the bar, bodies hit their poses a frame after the downbeat, crowds move in lockstep loops, one-take routines run without a cut, a man rises off the floor on a held chord, and mirrored dancers fold into a kaleidoscope that turns at the tempo.',
      visualDNA: 'A concept per shot, each with its own colour-graded set: a violet disco stage with gold-helmeted robots and skeletons on a staircase, a warm empty hotel lobby, a yellow warehouse of treadmills and bright shirts, magenta-to-cyan mirror worlds, then a teal-and-amber stage of rim-lit silhouettes under moving-head beams; the MTV credit block in plain white type.',
      transitions: 'Hard cuts on the beat (never faster than one per half second), a cut to a closer angle on the downbeat, mirror split to four-way to kaleidoscope, title words set on the last two beats',
      implementation: ['35 mm / 16 mm music-video shoots', 'Motion-control and in-camera tricks', 'Canvas 2D'],
      reproducibility: 'Fully procedural (artist, song and label are fictional)',
      loopable: false,
    },
    setup() { return { src: offscreen(960, 1080) }; },
    draw(c, t, W, H, st) {
      const T = MV_T;
      if (t < T.lobby) {
        if (t < T.cut2) mvStage(c, t);
        else { c.save(); c.translate(960, 600); c.scale(1.55, 1.55); c.translate(-1000 + (t - 1) * 60, -560); mvStage(c, t); c.restore(); }
        // the MTV credit, lower left
        const o = Math.min(seg(t, 0.3, 0.55), 1 - seg(t, 1.7, 1.95));
        if (o > 0) {
          c.save(); c.globalAlpha = o; c.shadowColor = 'rgba(0,0,0,0.85)'; c.shadowBlur = 6; c.shadowOffsetX = 2; c.shadowOffsetY = 2;
          [['Night Signal', 700, 42], ['“Turn It Around”', 500, 42], ['Mirror Room', 500, 36], ['Loop Records', 500, 36], ['Director: Ada Quill', 500, 36]].forEach(([s, w, sz], i) => text(c, s, 110, 770 + i * 48, { font: MV_F.ar, weight: w, size: sz, color: '#fff' }));
          c.restore();
        }
      } else if (t < T.tread) mvLobby(c, t);
      else if (t < T.mirror) mvTreadmills(c, t);
      else if (t < T.band) mvMirror(c, t, st);
      else {
        mvBand(c, t);
        // the title, a word on each of the last two beats
        const w1 = E.outC(seg(t, T.t1, T.t1 + 0.25)), w2 = E.outC(seg(t, T.t2, T.t2 + 0.25));
        if (w1 > 0) {
          const sh = c.createLinearGradient(0, 640, 0, 942); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.6)'); c.fillStyle = sh; c.fillRect(0, 640, 1920, 302);
          c.save(); c.globalAlpha = w1; text(c, 'MUSIC', 110 - 40 * (1 - w1), 850, { font: MV_F.blk, size: 150, color: '#fff', ls: 4 }); c.restore();
          c.save(); c.font = `400 150px ${MV_F.blk}`; const mw = c.measureText('MUSIC ').width; c.globalAlpha = w2; text(c, 'VIDEO', 110 + mw + 40 * (1 - w2), 850, { font: MV_F.blk, size: 150, color: MV.amber, ls: 4 }); c.restore();
          c.save(); c.globalAlpha = E.ioS(seg(t, T.t2 + 0.2, T.t2 + 0.6)); text(c, 'cut on the beat  ·  after Gondry, Jonze, OK Go', 116, 905, { font: MV_F.ar, weight: 500, size: 34, color: 'rgba(255,255,255,0.85)', ls: 1 }); c.restore();
        }
        // 2.39 letterbox for the performance
        c.fillStyle = '#000'; c.fillRect(0, 0, W, 138); c.fillRect(0, 942, W, 138);
      }
      grain(c, W, H, t, 0.05, 'overlay');
      vignette(c, W, H, 0.35);
    },
    score(A) {
      A.bus.gain.value = 0.8;
      const B = MV_B;
      const bass = [45, 45, 57, 45, 48, 48, 50, 52, 45, 45, 57, 45, 43, 43, 55, 47];
      for (let b = 0; b < 20; b++) {
        const t = b * B;
        if (b < 19) A.kick(t, 0.7);
        if (b % 2 === 1) A.clap(t, b >= 8 ? 0.26 : 0.2);
        A.hat(t + B / 2, 0.06, b % 4 === 3, { pan: 0.25 });
        if (b >= 8) { A.hat(t + B / 4, 0.03, false, { pan: -0.25 }); A.hat(t + 3 * B / 4, 0.03, false, { pan: -0.25 }); }
      }
      // the bass riff, sixteenths, the filter breathing per note
      for (let k = 0; k < 76; k++) { const m = bass[k % 16]; A.osc(k * B / 4, { type: 'sawtooth', f: midi(m), dur: 0.11, g: 0.075, lp: 1300, lp2: 260, lpT: 0.1, q: 5, hold: true, rel: 0.02 }); }
      // offbeat chord stabs from the lobby on, opening up through the kaleidoscope
      for (let b = 4; b < 19; b++) { const lp = b >= 12 && b < 16 ? 500 * Math.pow(8, (b - 12) / 4) : 1800; A.chord(b * B + B / 2, b % 8 < 4 ? [57, 60, 64, 67] : [55, 59, 62, 65], { type: 'square', dur: 0.12, g: 0.016, lp, hold: true, rel: 0.02, width: 0.6 }); }
      // lobby: a lead hook, then a held chord as he lifts off
      [[2.0, 69], [2.25, 72], [2.5, 74], [2.75, 72], [3.0, 76]].forEach(([t, m]) => A.osc(t, { type: 'square', f: midi(m), dur: 0.2, g: 0.04, lp: 2400, vib: [6, 6], rev: 0.25, hold: true, rel: 0.03 }));
      A.chord(3.2, [57, 64, 69, 72, 76], { type: 'sawtooth', dur: 0.8, g: 0.022, a: 0.25, lp: 2600, spread: 9, rev: 0.6, hold: true, rel: 0.2, width: 0.8 });
      // treadmills: a guitar power chord on each beat
      for (let b = 8; b < 12; b++) [45, 52, 57].forEach(m => A.pluck(b * B, midi(m), { g: 0.12, dur: 0.45, bright: 0.95, decay: 0.99, lp: 3200, pan: b % 2 ? 0.3 : -0.3 }));
      // whooshes on the section cuts, a riser into the band
      [2, 4, 6].forEach(t => A.whoosh(t - 0.25, 0.35, { g: 0.08, f1: 600, f2: 5000 }));
      A.riser(7.0, 1.0, { g: 0.1, f: 110 });
      // band: the vocal "ooh" pad and the final hit
      A.chord(8.0, [57, 64, 69, 72], { type: 'sawtooth', dur: 1.4, g: 0.02, a: 0.2, lp: 1600, vib: [5, 5], spread: 8, rev: 0.5, hold: true, rel: 0.3, width: 0.8 });
      A.hat(8.0, 0.1, true);
      A.impact(9.5, 0.45, { rev: 0.5 });
      A.chord(9.5, [45, 57, 64, 69, 72], { type: 'sawtooth', dur: 0.5, g: 0.03, lp: 2200, spread: 8, rev: 0.6, width: 0.8 });
    },
  });

  /* =====================================================================
     BROADCAST GRAPHICS — election night on Meridian 24 (a fictional
     channel). The open: a dot-matrix globe rushes at us and decelerates
     inside orbit rings, light streaks race past, and the wordmark slams in
     beside it; a branded diagonal wipe into a virtual studio, the anchor at
     a curved desk under a video wall; her name strap, the crawl and the
     clock bug arrive; the BREAKING banner expands and the headline strap
     slides up; the camera pushes into the video wall until it becomes the
     full-screen election map, where regions are called in a west-to-east
     sweep, the tally bars race to the majority line and a PROJECTED
     WINNER box locks; a second wipe to the end board.
     ===================================================================== */
  const BC = { navy: '#060f2b', navy2: '#0b1f55', royal: '#1f5bd8', cyan: '#38c8ff', red: '#e8112d', redD: '#8a0716', white: '#f5f8ff', grey: '#9fb0d0', civic: '#f08a1c', unity: '#14a7a0', blank: '#2a3d6e' };
  const BC_F = '"Roboto Condensed", "Arial Narrow", sans-serif';
  const BC_T = { slam: 1.45, wipe1: [2.45, 2.95], crawl: 2.9, name: [3.1, 4.05], brk: 4.15, head: 4.45, brkOut: 5.6, push: [5.7, 6.4], call: 6.5, proj: 8.0, wipe2: [8.9, 9.4] };
  const BC_WALL = { x: 760, y: 170, w: 1000, h: 562.5 };
  const BC_S = 1920 / BC_WALL.w, BC_FX = BC_WALL.x * BC_S / (BC_S - 1), BC_FY = BC_WALL.y * BC_S / (BC_S - 1);   // zoom about the fixed point that lands the wall on the frame
  const BC_CRAWL = 'MARKETS: HARBOR INDEX 4,212 ▲ 0.8%   •   WEATHER: STORMS EASE ALONG THE EAST COAST OVERNIGHT   •   SPORTS: PORT ALDER 3, KESTREL CITY 1   •   TRAFFIC: RIVERSIDE BRIDGE REOPENS AT 6 AM   •   ';

  function bcGlobe(g, cx, cy, R, ry, st, a = 1) {
    const tx = 0.38, ct = Math.cos(tx), stt = Math.sin(tx), cr = Math.cos(ry), sr = Math.sin(ry);
    g.save(); g.globalAlpha = a;
    const body = g.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R); body.addColorStop(0, '#1d4fb8'); body.addColorStop(0.7, '#0a2366'); body.addColorStop(1, '#061440');
    g.fillStyle = body; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
    const proj = (x, y, z) => { const x1 = x * cr + z * sr, z1 = -x * sr + z * cr, y2 = y * ct - z1 * stt, z2 = y * stt + z1 * ct; return [cx + x1 * R, cy - y2 * R, z2]; };
    g.strokeStyle = 'rgba(120,200,255,0.22)'; g.lineWidth = Math.max(1, R / 300);
    for (let m = 0; m < 12; m++) { const lo = m / 12 * PI; g.beginPath(); let on = false; for (let k = 0; k <= 48; k++) { const la = -PI / 2 + k / 48 * PI, p = proj(Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)); if (p[2] > 0) { on ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); on = true; } else on = false; } g.stroke(); g.beginPath(); on = false; for (let k = 0; k <= 48; k++) { const la = -PI / 2 + k / 48 * PI, p = proj(-Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo)); if (p[2] > 0) { on ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); on = true; } else on = false; } g.stroke(); }
    for (let l = -2; l <= 2; l++) { const la = l * PI / 6; g.beginPath(); let on = false; for (let k = 0; k <= 72; k++) { const lo = k / 72 * TAU, p = proj(Math.cos(la) * Math.cos(lo), Math.sin(la), Math.cos(la) * Math.sin(lo)); if (p[2] > 0) { on ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); on = true; } else on = false; } g.stroke(); }
    const ds = Math.max(1.5, R / 170);
    for (let i = 0; i < st.dots.length; i += 3) {
      const p = proj(st.dots[i], st.dots[i + 1], st.dots[i + 2]); if (p[2] <= 0) continue;
      g.fillStyle = `rgba(${Math.round(lerp(60, 150, p[2]))},${Math.round(lerp(150, 235, p[2]))},255,${0.35 + 0.65 * p[2]})`;
      const s = ds * (0.6 + 0.6 * p[2]); g.fillRect(p[0] - s / 2, p[1] - s / 2, s, s);
    }
    const rim = g.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.14); rim.addColorStop(0, 'rgba(56,200,255,0)'); rim.addColorStop(0.45, 'rgba(56,200,255,0.4)'); rim.addColorStop(1, 'rgba(56,200,255,0)');
    g.fillStyle = rim; g.beginPath(); g.arc(cx, cy, R * 1.14, 0, TAU); g.fill();
    const sp = g.createRadialGradient(cx - R * 0.4, cy - R * 0.45, 0, cx - R * 0.4, cy - R * 0.45, R * 0.7); sp.addColorStop(0, 'rgba(255,255,255,0.22)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sp; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
    g.restore();
  }
  // Wordmark: emblem, MERIDIAN, the red 24 box. (x, y) = left of the emblem, s = scale.
  function bcLogo(g, x, y, s, t, sub = true) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = BC.navy2; g.beginPath(); g.arc(0, 0, 60, 0, TAU); g.fill();
    g.strokeStyle = BC.cyan; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, 54, 0, TAU); g.stroke();
    g.lineWidth = 4; [0.35, 0.75].forEach(k => { g.beginPath(); g.ellipse(0, 0, 54 * k, 54, 0, 0, TAU); g.stroke(); });
    g.beginPath(); g.moveTo(-54, 0); g.lineTo(54, 0); g.stroke();
    text(g, 'MERIDIAN', 88, 30, { font: BC_F, weight: 900, style: 'italic', size: 92, color: BC.white, ls: 2 });
    g.font = `italic 900 92px ${BC_F}`; const w = g.measureText('MERIDIAN').width + 18;
    g.fillStyle = BC.red; g.beginPath(); g.moveTo(88 + w + 12, -44); g.lineTo(88 + w + 132, -44); g.lineTo(88 + w + 120, 40); g.lineTo(88 + w, 40); g.closePath(); g.fill();
    text(g, '24', 88 + w + 64, 30, { font: BC_F, weight: 900, style: 'italic', size: 82, color: BC.white, align: 'center' });
    if (sub) text(g, 'NEWS  ·  LIVE  ·  AROUND THE CLOCK', 92, 86, { font: BC_F, weight: 700, size: 30, color: BC.cyan, ls: 8 });
    g.restore();
  }
  function bcOpen(g, t, st) {
    const bg = g.createRadialGradient(960, 540, 50, 960, 540, 1200); bg.addColorStop(0, '#0d2a6e'); bg.addColorStop(1, '#020615'); g.fillStyle = bg; g.fillRect(0, 0, 1920, 1080);
    // light streaks racing past, slowing with the globe
    const sp = lerp(5200, 600, E.outC(seg(t, 0, 2)));
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16; i++) {
      const y = 80 + hash(i * 3.1) * 920, len = 300 + hash(i * 7.7) * 700, x = ((hash(i * 1.3) * 3000 + t * sp * (0.6 + hash(i) * 0.8)) % 3400) - 700;
      const lg = g.createLinearGradient(x, 0, x + len, 0); lg.addColorStop(0, 'rgba(56,200,255,0)'); lg.addColorStop(0.8, `rgba(120,220,255,${0.25 + 0.2 * hash(i * 9)})`); lg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = lg; g.fillRect(x, y, len, 2 + hash(i * 5) * 4);
    }
    g.globalCompositeOperation = 'source-over';
    const slam = E.ioC(seg(t, BC_T.slam - 0.25, BC_T.slam + 0.35));
    const R = kf(t, [[0, 1700], [1.25, 360, E.outQt], [2.6, 330]]) * lerp(1, 0.66, slam), cx = lerp(960, 470, slam), cy = 540;
    const ry = -1.8 + 5.2 * E.outQt(seg(t, 0, 2.2)) + t * 0.15;
    // orbit rings behind and in front
    const ring = (front, k) => { g.save(); g.translate(cx, cy); g.rotate(-0.35 + k * 0.7); g.strokeStyle = `rgba(56,200,255,${0.5})`; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, R * (1.35 + k * 0.12), R * 0.32, 0, front ? 0 : PI, front ? PI : TAU); g.stroke();
      const ca = t * 3 + k * 2, cxx = Math.cos(ca) * R * (1.35 + k * 0.12), cyy = Math.sin(ca) * R * 0.32; if ((Math.sin(ca) > 0) === front) blob(g, cxx, cyy, 26, 'rgba(200,240,255,0.9)'); g.restore(); };
    const ra = seg(t, 0.6, 1.2);
    if (ra > 0) { g.globalAlpha = ra; ring(false, 0); ring(false, 1); g.globalAlpha = 1; }
    bcGlobe(g, cx, cy, R, ry, st);
    if (ra > 0) { g.globalAlpha = ra; ring(true, 0); ring(true, 1); g.globalAlpha = 1; }
    // the wordmark slams in and a glint runs across it
    const lw = seg(t, BC_T.slam, BC_T.slam + 0.3);
    if (lw > 0) {
      const s = lerp(1.5, 1, E.outB(lw));
      g.save(); g.globalAlpha = clamp(lw * 3); g.translate(800, 560); g.scale(s, s); bcLogo(g, 0, 0, 1.15, t, t > BC_T.slam + 0.3); g.restore();
      const gx = lerp(700, 1900, seg(t, BC_T.slam + 0.35, BC_T.slam + 0.9));
      if (gx > 700 && gx < 1900) { g.save(); g.globalCompositeOperation = 'lighter'; g.translate(gx, 560); g.rotate(0.35); g.scale(0.35, 1.2); blob(g, 0, 0, 110, 'rgba(200,230,255,0.4)'); g.restore(); }
    }
  }
  // The anchor at her desk (a soft figure: the graphics are the subject).
  function bcAnchor(g, t) {
    const x = 470, y = 470, nod = vnoise(t * 1.4, 5) * 4;
    const su = g.createLinearGradient(x - 180, 0, x + 180, 0); su.addColorStop(0, '#24345e'); su.addColorStop(1, '#101a36');
    g.fillStyle = su; g.beginPath(); g.moveTo(x - 190, 800); g.bezierCurveTo(x - 180, 650, x - 120, 610, x - 50, 595); g.lineTo(x + 50, 595); g.bezierCurveTo(x + 120, 610, x + 180, 650, x + 190, 800); g.fill();
    g.fillStyle = '#f0ece6'; poly(g, [[x - 40, 596], [x + 40, 596], [x, 680]]); g.fill();
    g.fillStyle = '#c99a7a'; g.fillRect(x - 26, 540, 52, 62);
    g.fillStyle = '#2a1a14'; g.beginPath(); g.ellipse(x, y - 10 + nod, 74, 92, 0, 0, TAU); g.fill(); g.fillRect(x - 74, y - 10 + nod, 148, 120);
    const fc = g.createRadialGradient(x - 15, y - 10, 10, x, y, 90); fc.addColorStop(0, '#f0c4a4'); fc.addColorStop(1, '#a8745a');
    g.fillStyle = fc; g.beginPath(); g.ellipse(x, y + nod, 56, 72, 0, 0, TAU); g.fill();
    g.fillStyle = '#2a1a14'; g.beginPath(); g.ellipse(x - 10, y - 50 + nod, 66, 30, -0.3, 0, TAU); g.fill();
    g.fillStyle = '#2a1a14'; [-20, 20].forEach(dx => { g.beginPath(); g.ellipse(x + dx, y - 2 + nod, 7, 5, 0, 0, TAU); g.fill(); });
    const op = Math.max(0, vnoise(t * 10, 2)) * 7 * (t > 3.0 && t < 5.6 ? 1 : 0.2);
    g.fillStyle = '#8a3a3a'; g.beginPath(); g.ellipse(x, y + 36 + nod, 16, 4 + op * 0.5, 0, 0, TAU); g.fill();
  }
  function bcStudio(g, t, st) {
    g.fillStyle = '#030818'; g.fillRect(0, 0, 1920, 1080);
    // ceiling rig
    for (let k = 0; k < 10; k++) blob(g, 120 + k * 190, 40, 90, 'rgba(140,190,255,0.25)');
    g.strokeStyle = 'rgba(120,150,210,0.25)'; g.lineWidth = 3; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(0, 30 + k * 30); g.lineTo(1920, 30 + k * 30); g.stroke(); }
    // back wall: LED columns, then the video wall carrying the live map
    const bw = g.createLinearGradient(0, 120, 0, 760); bw.addColorStop(0, '#0a1a48'); bw.addColorStop(1, '#06102c'); g.fillStyle = bw; g.fillRect(0, 120, 1920, 640);
    [[70, 140], [250, 140], [600, 120], [1800, 100]].forEach(([x, w], i) => {
      const lg = g.createLinearGradient(0, 140, 0, 740); lg.addColorStop(0, '#0c3a9a'); lg.addColorStop(0.5, '#1f5bd8'); lg.addColorStop(1, '#0a2466'); g.fillStyle = lg; g.fillRect(x, 140, w, 600);
      g.save(); g.beginPath(); g.rect(x, 140, w, 600); g.clip(); g.fillStyle = 'rgba(120,220,255,0.18)'; for (let k = 0; k < 8; k++) g.fillRect(x, 140 + ((k * 90 - t * 60 + i * 30) % 720 + 720) % 720, w, 14); g.restore();
    });
    const W2 = BC_WALL;
    g.fillStyle = '#01030a'; g.fillRect(W2.x - 14, W2.y - 14, W2.w + 28, W2.h + 28);
    g.save(); g.beginPath(); g.rect(W2.x, W2.y, W2.w, W2.h); g.clip(); g.translate(W2.x, W2.y); g.scale(W2.w / 1920, W2.h / 1080); bcMap(g, t, st, false); g.restore();
    const gl = g.createLinearGradient(W2.x, W2.y, W2.x + W2.w, W2.y + W2.h); gl.addColorStop(0, 'rgba(255,255,255,0.08)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(W2.x, W2.y, W2.w, W2.h);
    // glossy floor reflecting the wall
    const fl = g.createLinearGradient(0, 760, 0, 1080); fl.addColorStop(0, '#0c1c48'); fl.addColorStop(1, '#020610'); g.fillStyle = fl; g.fillRect(0, 760, 1920, 320);
    const rf = g.createLinearGradient(0, 760, 0, 1000); rf.addColorStop(0, 'rgba(56,200,255,0.18)'); rf.addColorStop(1, 'rgba(56,200,255,0)'); g.fillStyle = rf; g.fillRect(W2.x, 760, W2.w, 240);
    bcAnchor(g, t);
    // curved desk with a light strip and the wordmark
    const dk = g.createLinearGradient(0, 740, 0, 1000); dk.addColorStop(0, '#d8e2f2'); dk.addColorStop(0.08, '#5a6a8e'); dk.addColorStop(0.1, '#13224e'); dk.addColorStop(1, '#070e26');
    g.fillStyle = dk; g.beginPath(); g.moveTo(60, 760); g.quadraticCurveTo(470, 700, 880, 760); g.lineTo(840, 1000); g.quadraticCurveTo(470, 940, 100, 1000); g.closePath(); g.fill();
    g.strokeStyle = BC.cyan; g.lineWidth = 5; g.beginPath(); g.moveTo(80, 800); g.quadraticCurveTo(470, 742, 860, 800); g.stroke();
    blob(g, 470, 800, 260, 'rgba(56,200,255,0.18)');
    bcLogo(g, 300, 880, 0.42, t, false);
  }
  function bcMap(g, t, st, full) {
    g.drawImage(st.mapBg, 0, 0);
    text(g, 'NORTH VALE DECIDES', 110, 150, { font: BC_F, weight: 900, style: 'italic', size: 76, color: BC.white, ls: 1 });
    text(g, 'GENERAL ELECTION  ·  150 SEATS  ·  76 FOR A MAJORITY', 114, 200, { font: BC_F, weight: 700, size: 30, color: BC.cyan, ls: 4 });
    g.save(); poly(g, st.country); g.clip();
    let civ = 0, uni = 0, declared = 0;
    st.regions.forEach(R => {
      const k = seg(t, R.at, R.at + 0.3), col = R.win === 'C' ? BC.civic : BC.unity;
      g.fillStyle = k > 0 ? mixc(k < 1 ? '#ffffff' : col, col, E.outC(k)) : mixc(BC.blank, '#33497e', R.shade);
      poly(g, R.poly); g.fill();
      if (k > 0) { const n = R.seats * E.outC(k); if (R.win === 'C') civ += n; else uni += n; declared += n; }
    });
    g.strokeStyle = '#061033'; g.lineWidth = 4; st.regions.forEach(R => { poly(g, R.poly); g.stroke(); });
    g.restore();
    g.strokeStyle = 'rgba(56,200,255,0.8)'; g.lineWidth = 4; poly(g, st.country); g.stroke();
    st.regions.forEach(R => { const k = seg(t, R.at, R.at + 0.3); if (k > 0) text(g, String(R.seats), R.cx, R.cy + 12, { font: BC_F, weight: 900, size: 34, color: `rgba(255,255,255,${k})`, align: 'center' }); });
    // the tally
    const X0 = 1230, X1 = 1810, row = (y, nm, col, n) => {
      g.fillStyle = col; g.fillRect(X0, y - 78, 16, 96);
      text(g, nm, X0 + 36, y - 32, { font: BC_F, weight: 900, size: 48, color: BC.white, ls: 2 });
      text(g, 'PARTY', X0 + 36, y + 12, { font: BC_F, weight: 700, size: 26, color: BC.grey, ls: 6 });
      text(g, String(Math.round(n)), X1, y + 14, { font: BC_F, weight: 900, size: 120, color: BC.white, align: 'right' });
    };
    row(380, 'CIVIC', BC.civic, civ); row(540, 'UNITY', BC.unity, uni);
    const by = 640, bw = X1 - X0;
    g.fillStyle = '#0d1d4a'; g.fillRect(X0, by, bw, 54);
    g.fillStyle = BC.civic; g.fillRect(X0, by, bw * civ / 150, 54);
    g.fillStyle = BC.unity; g.fillRect(X1 - bw * uni / 150, by, bw * uni / 150, 54);
    const mx = X0 + bw * 76 / 150; g.fillStyle = BC.white; g.fillRect(mx - 2, by - 18, 4, 90);
    text(g, '76 TO WIN', mx, by - 28, { font: BC_F, weight: 700, size: 26, color: BC.white, align: 'center', ls: 3 });
    text(g, `SEATS DECLARED  ${Math.round(declared)} / 150`, X0, by + 104, { font: BC_F, weight: 700, size: 30, color: BC.grey, ls: 3 });
    const pj = seg(t, BC_T.proj, BC_T.proj + 0.35);
    if (pj > 0) {
      const s = E.outB(pj);
      g.save(); g.translate(X0 + bw / 2, 870); g.scale(s, s);
      g.fillStyle = BC.civic; g.fillRect(-bw / 2, -80, bw, 160); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(-bw / 2, 30, bw, 50);
      g.strokeStyle = BC.white; g.lineWidth = 12; g.lineCap = 'round'; g.lineJoin = 'round';
      const ck = seg(t, BC_T.proj + 0.2, BC_T.proj + 0.5); g.beginPath(); g.moveTo(-bw / 2 + 50, -10); if (ck > 0) g.lineTo(-bw / 2 + 50 + 26 * Math.min(1, ck * 2), -10 + 26 * Math.min(1, ck * 2)); if (ck > 0.5) g.lineTo(-bw / 2 + 76 + 52 * (ck - 0.5) * 2, 16 - 60 * (ck - 0.5) * 2); g.stroke();
      text(g, 'PROJECTED WINNER', -bw / 2 + 160, -24, { font: BC_F, weight: 700, size: 30, color: BC.white, ls: 5 });
      text(g, 'CIVIC PARTY', -bw / 2 + 160, 30, { font: BC_F, weight: 900, style: 'italic', size: 62, color: BC.white });
      text(g, 'MERIDIAN 24 DECISION DESK', 0, 66, { font: BC_F, weight: 700, size: 22, color: BC.white, align: 'center', ls: 5 });
      g.restore();
    }
  }
  // Overlays on the programme: clock bug, crawl, name strap, BREAKING banner and headline strap.
  function bcOverlays(g, t) {
    const bu = E.outC(seg(t, 2.95, 3.3));
    if (bu > 0) {
      g.save(); g.globalAlpha = bu;
      g.fillStyle = 'rgba(6,15,43,0.8)'; rrect(g, 1560, 50, 300, 64, 8); g.fill();
      g.fillStyle = BC.red; rrect(g, 1572, 62, 92, 40, 6); g.fill();
      text(g, 'LIVE', 1618, 94, { font: BC_F, weight: 900, size: 32, color: BC.white, align: 'center', ls: 2 });
      text(g, `21:04:${String(12 + Math.floor(t)).padStart(2, '0')}`, 1844, 96, { font: BC_F, weight: 700, size: 38, color: BC.white, align: 'right', ls: 1 });
      g.restore();
    }
    const cr = E.outC(seg(t, BC_T.crawl, BC_T.crawl + 0.4));
    if (cr > 0) {
      const y = lerp(1080, 990, cr);
      g.fillStyle = 'rgba(6,15,43,0.94)'; g.fillRect(0, y, 1920, 66);
      g.save(); g.beginPath(); g.rect(300, y, 1620, 66); g.clip();
      g.font = `700 36px ${BC_F}`; const w = g.measureText(BC_CRAWL).width, off = ((t - BC_T.crawl) * 190) % w;
      for (let k = 0; k < 3; k++) text(g, BC_CRAWL, 1920 - 300 - off + k * w - w, y + 46, { font: BC_F, weight: 700, size: 36, color: BC.white });
      g.restore();
      g.fillStyle = BC.red; g.fillRect(0, y, 300, 66); g.fillStyle = BC.white; g.fillRect(300, y, 4, 66);
      text(g, 'MERIDIAN 24', 150, y + 47, { font: BC_F, weight: 900, style: 'italic', size: 38, color: BC.white, align: 'center', ls: 1 });
    }
    // name strap: a red LIVE tab, the white name bar wiping out of it, the blue title bar beneath
    const n = Math.min(E.outQt(seg(t, BC_T.name[0], BC_T.name[0] + 0.45)), 1 - E.inC(seg(t, BC_T.name[1] - 0.25, BC_T.name[1])));
    if (n > 0 && t < BC_T.name[1]) {
      const x = 150, y = 800, w = 860 * n, w2 = 860 * E.outQt(clamp(seg(t, BC_T.name[0] + 0.12, BC_T.name[0] + 0.6))) * Math.min(1, n * 1.4);
      g.fillStyle = BC.white; g.fillRect(x + 20, y, w, 78);
      g.fillStyle = BC.royal; g.fillRect(x + 20, y + 78, w2, 46);
      g.save(); g.beginPath(); g.rect(x + 20, y, w, 124); g.clip();
      text(g, 'DANA REYES', x + 50, y + 58, { font: BC_F, weight: 900, size: 54, color: BC.navy, ls: 2 });
      text(g, 'MERIDIAN 24  ·  ELECTION NIGHT SPECIAL', x + 50, y + 112, { font: BC_F, weight: 700, size: 30, color: BC.white, ls: 4 });
      g.restore();
      g.fillStyle = BC.red; g.fillRect(x, y, 20, 124);
    }
    // BREAKING: the red banner expands from its centre, a glint runs along it, the headline strap slides up
    const bo = 1 - E.inC(seg(t, BC_T.brkOut, BC_T.brkOut + 0.3));
    const be = E.outQt(seg(t, BC_T.brk, BC_T.brk + 0.3));
    if (be > 0 && bo > 0) {
      const y0 = 770 + (1 - bo) * 330, cx = 960, half = 810 * be;
      const hs = E.outC(seg(t, BC_T.head, BC_T.head + 0.35));
      if (hs > 0) {
        g.save(); g.beginPath(); g.rect(cx - 810, y0 + 96, 1620, 76); g.clip();
        g.fillStyle = BC.white; g.fillRect(cx - 810, y0 + 96 + (1 - hs) * 76, 1620, 76);
        text(g, 'POLLS CLOSE IN NORTH VALE — FIRST RESULTS EXPECTED WITHIN MINUTES', cx - 780, y0 + 148 + (1 - hs) * 76, { font: BC_F, weight: 700, size: 42, color: BC.navy, ls: 1 });
        g.restore();
      }
      const rg = g.createLinearGradient(0, y0, 0, y0 + 96); rg.addColorStop(0, '#ff2a40'); rg.addColorStop(1, BC.redD);
      g.fillStyle = rg; g.fillRect(cx - half, y0, half * 2, 96);
      g.save(); g.beginPath(); g.rect(cx - half, y0, half * 2, 96); g.clip();
      text(g, 'BREAKING NEWS', cx - 780, y0 + 72, { font: BC_F, weight: 900, style: 'italic', size: 74, color: BC.white, ls: 6 });
      text(g, 'ELECTION NIGHT', cx + 780, y0 + 64, { font: BC_F, weight: 700, size: 34, color: 'rgba(255,255,255,0.85)', align: 'right', ls: 8 });
      const gx = lerp(cx - 1100, cx + 1100, seg((t - BC_T.brk - 0.3) % 1.6, 0, 0.8));
      const gl = g.createLinearGradient(gx - 120, 0, gx + 120, 0); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(0.5, 'rgba(255,255,255,0.28)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gl; g.fillRect(gx - 120, y0, 240, 96);
      g.restore();
    }
  }
  function bcProgramme(g, t, st) {
    const P = BC_T.push;
    if (t < P[1]) {
      const sc = t < P[0] ? 1 + 0.03 * seg(t, 2.6, P[0]) : Math.exp(lerp(Math.log(1.03), Math.log(BC_S), E.ioC(seg(t, P[0], P[1]))));
      g.save(); g.translate(BC_FX, BC_FY); g.scale(sc, sc); g.translate(-BC_FX, -BC_FY); bcStudio(g, t, st); g.restore();
    } else bcMap(g, t, st, true);
    bcOverlays(g, t);
  }
  function bcEnd(g, t, st) {
    const bg = g.createRadialGradient(700, 540, 50, 960, 540, 1300); bg.addColorStop(0, '#0d2a6e'); bg.addColorStop(1, '#020615'); g.fillStyle = bg; g.fillRect(0, 0, 1920, 1080);
    bcGlobe(g, 420, 540, 250, 2.0 + t * 0.35, st);
    const a = E.outC(seg(t, 9.25, 9.6));
    g.save(); g.globalAlpha = a;
    text(g, 'BROADCAST', 790 - 30 * (1 - a), 500, { font: BC_F, weight: 900, style: 'italic', size: 170, color: BC.white, ls: 2 });
    text(g, 'GRAPHICS', 790 - 30 * (1 - a), 650, { font: BC_F, weight: 900, style: 'italic', size: 170, color: BC.red, ls: 2 });
    g.fillStyle = BC.cyan; g.fillRect(796, 690, 980 * a, 6);
    text(g, 'OPENS  ·  LOWER THIRDS  ·  CRAWLS  ·  ELECTION MAPS', 796, 750, { font: BC_F, weight: 700, size: 34, color: BC.cyan, ls: 3 });
    text(g, 'MERIDIAN 24 IS A FICTIONAL CHANNEL', 796, 800, { font: BC_F, weight: 400, size: 24, color: BC.grey, ls: 5 });
    g.globalAlpha = E.outC(seg(t, 9.45, 9.8)); bcLogo(g, 830, 900, 0.42, t, false);
    g.restore();
  }
  // Diagonal branded wipe: new scene left of the moving edge, old to the right, stripes on the seam.
  function bcWipe(c, st, u, oldFn, newFn) {
    const e = E.ioC(u), X = lerp(-500, 2420, e), sl = 300;
    oldFn(c);
    c.save(); poly(c, [[-600, 0], [X + sl, 0], [X - sl, 1080], [-600, 1080]]); c.clip(); newFn(c); c.restore();
    [[BC.red, 0, 70], [BC.white, 70, 22], [BC.royal, 92, 120]].forEach(([col, o, w]) => { c.fillStyle = col; poly(c, [[X + sl - o - w, 0], [X + sl - o, 0], [X - sl - o, 1080], [X - sl - o - w, 1080]]); c.fill(); });
  }

  MG.film({
    id: 'broadcast', dur: 10, poster: 8.6,
    fonts: [['italic 900 92px "Roboto Condensed"', 'MERIDIAN 24 BROADCAST GRAPHICS NORTH VALE DECIDES BREAKING NEWS CIVIC PARTY'], ['900 54px "Roboto Condensed"', 'DANA REYES LIVE CIVIC UNITY 0123456789'], ['700 36px "Roboto Condensed"', 'MARKETS: HARBOR INDEX ▲ • POLLS CLOSE — 21:04'], ['400 24px "Roboto Condensed"', 'MERIDIAN 24 IS A FICTIONAL CHANNEL']],
    meta: {
      family: 'J', name: 'Broadcast Graphics', sub: 'News opens, straps and crawls', era: '1970s —',
      origin: 'Broadcast graphics are the house style of television news: a branded open, then lower thirds, bugs, crawls and full-screen maps laid over live pictures, each built to be read in a second. Electronic character generators such as the Chyron and Quantel’s Paintbox (1981) put them on air, 24-hour news made them permanent, the continuous crawl became standard on US cable news after 11 September 2001, and election nights turned virtual studios and touchscreen maps into spectacle.',
      works: 'Chyron character generator (Chyron Corp., 1970s) · Quantel Paintbox (1981) · CNN Headline News (launched as CNN2, 1982) · Cable-news crawls after 11 September 2001 · CNN “Magic Wall” election map (2008)',
      tech: ['Dot-matrix spinning globe open', 'Name strap, BREAKING banner, crawl', 'Live election map and tally'],
      accent: '#e8112d',
      motionDNA: 'Urgent but orderly: a globe rushes in and decelerates under orbiting rings, a wordmark slams with overshoot and a glint, branded diagonal wipes carry us between open and studio, straps wipe out of a coloured tab in quick ease-outs and stack in a fixed order, the crawl never stops, and the camera pushes into the video wall until the graphic is the picture; numbers count, bars race, a verdict box pops and locks.',
      visualDNA: 'Deep navy and royal blue with cyan highlights, a single alarm red for LIVE and BREAKING, white bars with heavy condensed caps, glossy desk and floor reflections, LED columns, a dot-matrix globe with graticule, and an election map in two party colours with seat counts, a majority line and a decision-desk box.',
      transitions: 'Diagonal branded wipes, logo slam with glint, strap wipe-ons from a tab, banner expanding from centre, push into the video wall, wipe to the end board',
      implementation: ['Chyron / Vizrt / ChyronHego real-time engines', 'After Effects + Cinema 4D packages', 'Canvas 2D'],
      reproducibility: 'Fully procedural (channel, people, places and results are fictional)',
      loopable: false,
    },
    setup() {
      const r = rng(2401), dots = [];
      // continents: a dot wherever a few random caps on the sphere overlap enough
      const caps = Array.from({ length: 11 }, () => { const z = r() * 1.6 - 0.8, a = r() * TAU, q = Math.sqrt(1 - z * z); return [Math.cos(a) * q, z, Math.sin(a) * q, 0.08 + r() * 0.14]; });
      const N = 5200;
      for (let i = 0; i < N; i++) {
        const y = 1 - 2 * (i + 0.5) / N, q = Math.sqrt(1 - y * y), ph = i * 2.399963, x = Math.cos(ph) * q, z = Math.sin(ph) * q;
        let v = 0; caps.forEach(([a, b, cc, w]) => { v += Math.exp(-(1 - (x * a + y * b + z * cc)) / w); });
        v += (n2(x * 4 + 9, y * 4 + z * 3, 2) - 0.5) * 0.5;
        if (v > 0.8) dots.push(x, y, z);
      }
      // the country and its regions (Voronoi cells clipped to the outline)
      const cx = 700, cy = 610, R = 330, ph = [r() * TAU, r() * TAU, r() * TAU];
      const country = Array.from({ length: 160 }, (_, k) => { const a = k / 160 * TAU, rr = R * (1 + 0.1 * Math.sin(3 * a + ph[0]) + 0.06 * Math.sin(5 * a + ph[1]) + 0.04 * Math.sin(9 * a + ph[2])); return [cx + Math.cos(a) * rr * 1.25, cy + Math.sin(a) * rr]; });
      const inside = (x, y) => { let c2 = false; for (let i = 0, j = country.length - 1; i < country.length; j = i++) { const [xi, yi] = country[i], [xj, yj] = country[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c2 = !c2; } return c2; };
      const seeds = [];
      for (let k = 0; k < 400 && seeds.length < 16; k++) { const x = cx + (r() * 2 - 1) * R * 1.3, y = cy + (r() * 2 - 1) * R * 1.05; if (inside(x, y) && seeds.every(s => Math.hypot(s[0] - x, s[1] - y) > 120)) seeds.push([x, y]); }
      const clipHalf = (pl, a, b) => {
        const dx = b[0] - a[0], dy = b[1] - a[1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, f = p => (p[0] - mx) * dx + (p[1] - my) * dy, out = [];
        for (let i = 0; i < pl.length; i++) { const p = pl[i], q = pl[(i + 1) % pl.length], fp = f(p), fq = f(q); if (fp <= 0) out.push(p); if ((fp <= 0) !== (fq <= 0)) { const u = fp / (fp - fq); out.push([lerp(p[0], q[0], u), lerp(p[1], q[1], u)]); } }
        return out;
      };
      const box = [[cx - 600, cy - 500], [cx + 600, cy - 500], [cx + 600, cy + 500], [cx - 600, cy + 500]];
      let regions = seeds.map((s, i) => { let pl = box; seeds.forEach((o, j) => { if (j !== i) pl = clipHalf(pl, s, o); }); return { poly: pl, cx: s[0], cy: s[1], w: 0.6 + r(), win: r() < 0.58 ? 'C' : 'U', shade: r() }; });
      const tw = regions.reduce((a, R2) => a + R2.w, 0); let left = 150;
      regions.forEach((R2, i) => { R2.seats = i === regions.length - 1 ? left : Math.max(4, Math.round(R2.w / tw * 150)); left -= R2.seats; });
      const tot = w => regions.filter(R2 => R2.win === w).reduce((a, R2) => a + R2.seats, 0);
      regions.slice().sort((p, q) => p.seats - q.seats).forEach(R2 => { if (tot('C') < 84 && R2.win === 'U') R2.win = 'C'; });
      regions.slice().sort((p, q) => p.seats - q.seats).forEach(R2 => { if (tot('C') > 96 && R2.win === 'C') R2.win = 'U'; });
      regions.slice().sort((p, q) => p.cx - q.cx).forEach((R2, k) => { R2.at = BC_T.call + k * (1.3 / regions.length); });
      // map background: navy with a faint isometric grid
      const mapBg = offscreen(1920, 1080), g = mapBg.getContext('2d');
      const bg = g.createLinearGradient(0, 0, 1920, 1080); bg.addColorStop(0, '#0b1f55'); bg.addColorStop(1, '#040b24'); g.fillStyle = bg; g.fillRect(0, 0, 1920, 1080);
      g.strokeStyle = 'rgba(56,200,255,0.07)'; g.lineWidth = 2;
      for (let k = -40; k < 80; k++) { g.beginPath(); g.moveTo(k * 60, 0); g.lineTo(k * 60 + 620, 1080); g.stroke(); g.beginPath(); g.moveTo(k * 60, 0); g.lineTo(k * 60 - 620, 1080); g.stroke(); }
      g.fillStyle = 'rgba(56,200,255,0.12)'; g.fillRect(1180, 260, 4, 700);
      return { dots: new Float32Array(dots), country, regions, mapBg };
    },
    draw(c, t, W, H, st) {
      const T = BC_T;
      if (t < T.wipe1[0]) bcOpen(c, t, st);
      else if (t < T.wipe1[1]) bcWipe(c, st, seg(t, T.wipe1[0], T.wipe1[1]), g => bcOpen(g, t, st), g => bcProgramme(g, t, st));
      else if (t < T.wipe2[0]) bcProgramme(c, t, st);
      else if (t < T.wipe2[1]) bcWipe(c, st, seg(t, T.wipe2[0], T.wipe2[1]), g => bcProgramme(g, t, st), g => bcEnd(g, t, st));
      else bcEnd(c, t, st);
      vignette(c, W, H, 0.3);
    },
    score(A) {
      A.bus.gain.value = 0.8;
      // the open: a ticking sixteenth pulse, timpani, brass stabs, the logo slam
      for (let k = 0; k < 20; k++) A.osc(k * 0.125, { type: 'square', f: k % 4 ? 1760 : 2350, dur: 0.03, g: k % 4 ? 0.018 : 0.03, lp: 5000, pan: k % 2 ? 0.3 : -0.3 });
      const timp = (t, f, g) => { A.osc(t, { f, f2: f * 0.8, glide: 0.3, dur: 0.7, g, a: 0.003 }); A.noise(t, { type: 'lowpass', f: 900, dur: 0.15, g: g * 0.3 }); };
      [[0, 73, 0.5], [0.75, 73, 0.4], [1.0, 82, 0.4], [1.125, 82, 0.35]].forEach(([t, f, g]) => timp(t, f, g));
      A.whoosh(0, 0.9, { g: 0.12, f1: 3000, f2: 300 });
      [[0, [50, 57, 62, 65]], [0.75, [50, 57, 62, 65]], [1.0, [48, 55, 60, 64]]].forEach(([t, n]) => A.chord(t, n, { type: 'sawtooth', dur: 0.3, g: 0.022, lp: 2600, spread: 8, hold: true, rel: 0.06, width: 0.6 }));
      A.impact(BC_T.slam, 0.65);
      A.chord(BC_T.slam, [50, 57, 62, 66, 69], { type: 'sawtooth', dur: 1.0, g: 0.026, lp: 3200, lp2: 900, lpT: 1, spread: 9, rev: 0.4, width: 0.8 });
      A.bell(BC_T.slam + 0.02, midi(86), { g: 0.08 }); A.bell(BC_T.slam + 0.27, midi(93), { g: 0.06 });
      A.whoosh(2.45, 0.5, { g: 0.14, f1: 400, f2: 6000 });
      // studio bed: a softer pulse and a low pad
      for (let k = 0; k < 22; k++) A.osc(2.95 + k * 0.125, { type: 'square', f: 1320, dur: 0.025, g: 0.008, lp: 4000 });
      A.chord(2.9, [38, 45, 50, 53], { type: 'sawtooth', dur: 2.8, g: 0.018, a: 0.3, lp: 600, hold: true, rel: 0.3, width: 0.6 });
      A.whoosh(3.08, 0.3, { g: 0.06, f1: 1500, f2: 5000 });
      // BREAKING: three stabs and a hit
      A.impact(BC_T.brk, 0.5);
      [[4.15, 0.12], [4.3, 0.12], [4.45, 0.5]].forEach(([t, d]) => A.chord(t, [50, 53, 57, 62], { type: 'sawtooth', dur: d, g: 0.03, lp: 3000, spread: 8, hold: true, rel: 0.05, width: 0.6 }));
      for (let k = 0; k < 8; k++) A.osc(4.6 + k * 0.125, { type: 'square', f: 1760, dur: 0.03, g: 0.016, lp: 5000 });
      // the push into the wall, then a blip for each region called
      A.whoosh(5.65, 0.8, { g: 0.14, f1: 300, f2: 4000 });
      A.chord(6.2, [38, 45, 50, 57], { type: 'sawtooth', dur: 1.8, g: 0.016, a: 0.2, lp: 900, hold: true, rel: 0.3 });
      for (let k = 0; k < 16; k++) A.osc(6.5 + k * (1.3 / 16), { type: 'sine', f: midi(81 + [0, 2, 4, 7][k % 4]), dur: 0.12, g: 0.04, rev: 0.2, pan: (k / 15 - 0.5) * 0.8 });
      // projection sting, end wipe, end board
      A.impact(BC_T.proj, 0.6);
      A.chord(BC_T.proj, [50, 57, 62, 66, 74], { type: 'sawtooth', dur: 0.9, g: 0.026, lp: 3000, spread: 9, rev: 0.4, width: 0.8 });
      A.bell(BC_T.proj + 0.2, midi(86), { g: 0.06 });
      A.whoosh(8.85, 0.5, { g: 0.13, f1: 400, f2: 6000 });
      A.chord(9.3, [50, 57, 62, 66, 69, 74], { type: 'sawtooth', dur: 0.7, g: 0.026, lp: 2800, spread: 9, rev: 0.5, width: 0.8 });
      A.bell(9.3, midi(86), { g: 0.07 }); A.bell(9.55, midi(93), { g: 0.06 });
      A.impact(9.3, 0.35);
    },
  });
})();
