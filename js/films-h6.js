/* batch h6 — Family A: Graphic Design & Historical. Art Nouveau · Italian Futurism · Pop Art.
   artnouveau (Mucha poster, Guimard ironwork, leaded glass) · futurism (Balla, Boccioni, parole in libertà) · popart (Lichtenstein dots, Warhol silkscreen grids). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, rrect, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Federant&family=Cormorant+Garamond:ital,wght@1,500&family=Anton&family=Bodoni+Moda:ital,wght@0,700;1,900&family=Archivo+Black&family=Courier+Prime:wght@700&family=Patrick+Hand+SC&family=Archivo:wght@400;700&display=block');
  const PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const shadeCache = new Map();
  // Multiply a #rrggbb colour by k (k < 1 darkens, k > 1 lifts toward white); k is quantised so the cache stays small.
  function shade(hex, k) {
    k = Math.round(k * 20) / 20;
    const key = hex + k;
    if (shadeCache.has(key)) return shadeCache.get(key);
    const n = parseInt(hex.slice(1), 16), ch = [n >> 16, (n >> 8) & 255, n & 255];
    const out = `rgb(${ch.map(v => Math.round(clamp(k <= 1 ? v * k : v + (255 - v) * (k - 1), 0, 255))).join(',')})`;
    shadeCache.set(key, out);
    return out;
  }
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  // Smooth closed (or open) outline through a list of points: quadratic curves between midpoints.
  function smooth(g, pts, closed = true, begin = true) {
    const n = pts.length;
    if (begin) g.beginPath();
    if (closed) {
      g.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
      for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
      g.closePath();
    } else {
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < n - 1; i++) { const p = pts[i], q = pts[i + 1]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
      g.lineTo(pts[n - 1][0], pts[n - 1][1]);
    }
  }
  const poly = (g, pts, begin = true) => { if (begin) g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
  // Catmull–Rom spline through control points, `per` samples per span.
  function spline(ctrl, per = 10) {
    const out = [];
    for (let i = 0; i < ctrl.length - 1; i++) {
      const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
      for (let k = 0; k < per; k++) {
        const u = k / per, u2 = u * u, u3 = u2 * u;
        out.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3)));
      }
    }
    out.push(ctrl[ctrl.length - 1].slice());
    return out;
  }
  // The whiplash: a curve whose heading turns from a0 toward aEnd, waves along its length and
  // winds into a tightening spiral over its last part (curl = turns, signed).
  function whip(x, y, o) {
    const n = o.n || 44, ds0 = o.len / n, pts = [[x, y]];
    for (let i = 1; i <= n; i++) {
      const s = i / n, cs = seg(s, o.cAt ?? 0.62, 1);
      const head = o.aEnd !== undefined ? lerp(o.a0, o.aEnd, Math.pow(s, o.pw ?? 0.75)) : o.a0 + (o.bend || 0) * s;
      const a = head + (o.wave || 0) * Math.min(1, s * 3) * Math.sin(s * PI * (o.freq || 1.5) + (o.ph || 0)) + (o.curl || 0) * cs * cs * TAU;
      const ds = ds0 * (1 - 0.6 * cs);
      x += Math.cos(a) * ds; y += Math.sin(a) * ds; pts.push([x, y]);
    }
    return pts;
  }
  // Fill path of a ribbon of width wf(u) along pts, grown to fraction p (the growing tip tapers to a point).
  function ribbon(g, pts, wf, p = 1) {
    if (p <= 0) return false;
    const n = Math.max(2, Math.floor((pts.length - 1) * clamp(p)) + 1), L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const u = i / (pts.length - 1), tip = p < 1 ? Math.min(1, (n - 1 - i) / 4 + 0.12) : 1, w = wf(u) * 0.5 * tip;
      L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    g.beginPath(); g.moveTo(L[0][0], L[0][1]);
    for (let i = 1; i < n; i++) g.lineTo(L[i][0], L[i][1]);
    for (let i = n - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
    g.closePath();
    return true;
  }
  // An almond leaf / petal from (x, y) along heading a; bend skews it into a whiplash shape.
  function leaf(g, x, y, a, L, Wd, bend = 0) {
    const ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca, tx = x + ca * L + nx * bend, ty = y + sa * L + ny * bend;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + ca * L * 0.45 + nx * Wd, y + sa * L * 0.45 + ny * Wd, tx, ty);
    g.quadraticCurveTo(x + ca * L * 0.55 - nx * Wd * 0.8, y + sa * L * 0.55 - ny * Wd * 0.8, x, y);
    g.closePath();
  }
  const angAt = (pts, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
  // Measure each glyph so a word can be laid out (and animated) letter by letter.
  function glyphs(c, s, fnt, ls = 0) {
    c.font = fnt;
    const ws = [...s].map(ch => c.measureText(ch).width + ls);
    return { ws, tw: ws.reduce((a, b) => a + b, 0) - ls };
  }

  /* =====================================================================
     ART NOUVEAU — a Mucha poster grows itself. A double rule draws round
     the frame and gilt roundels drop into the corners; two of Guimard's
     cast-iron Métro stalks rise from the pavement, sprout whiplash shoots
     and bow over to hang their orange glass lamps; lilies and tendrils
     climb the side panels leaf by leaf. Behind the centre a halo of leaded
     Tiffany glass lights pane by pane from the top down, a woman in profile
     is inked in, and her hair pours out in long macaroni curls that sway
     and spiral; poppies open in it, the lamps come on, the title cartouche
     rises and the afternoon sun travels across the glass
     ===================================================================== */
  const AN = {
    paper: '#efe3c3', paperD: '#e0cc9c', ink: '#46291a', olive: '#6d7638', moss: '#4b5629', sage: '#a7b27e', sageL: '#c8cfa2',
    gold: '#c79738', goldL: '#ead08a', rose: '#d99a85', roseD: '#b8634f', terra: '#b4573a', cream: '#f6ecd4',
    hair: '#a64d27', hairD: '#7b3418', hairL: '#c9703a', skin: '#f4dcc0', iron: '#3d5b49', ironL: '#88a487', lamp: '#ff8c3a',
  };
  const AN_GLASS = ['#d68a2a', '#2e7c74', '#6c4a85', '#b03a38', '#5d8d3a', '#2d5a98', '#dfae3e', '#3f8f8a'];
  const AN_T = { rule: 0.05, arch: 0.3, archEnd: 2.5, vine: 0.7, halo: 1.6, glass: 2.1, fig: 3.2, figEnd: 4.5, hair: 3.9, bloom: 5.9, lamp: 6.5, cart: 6.9, title: 7.25, sub: 8.3, sun: 7.8, sunEnd: 9.9 };
  const AN_HX = 960, AN_HY = 400, AN_FX = 948, AN_FY = 452;
  // Guimard's stalk (left one; the right is its mirror): pavement → up → bowing over to the lamp
  const AN_STEM = [[440, 1100], [430, 900], [418, 700], [422, 520], [446, 380], [492, 270], [556, 196], [628, 160], [684, 170], [706, 214]];
  // head drawn round (AN_FX, AN_FY), facing left
  const AN_FACE = [[-20, -128], [-70, -112], [-98, -42], [-96, -22], [-128, 22], [-104, 38], [-104, 48], [-112, 58], [-100, 66], [-108, 76], [-94, 88], [-100, 110], [-80, 130], [-30, 140], [30, 108], [56, 40], [46, -40], [10, -104]];
  const AN_HAIRBASE = [[-74, -100], [-60, -150], [0, -180], [82, -170], [146, -104], [166, 0], [150, 94], [98, 150], [44, 112], [58, 30], [40, -50], [-20, -96]];
  const AN_FRINGE = [[-84, -96], [-66, -142], [-4, -172], [64, -158], [110, -110], [76, -104], [40, -122], [6, -108], [-30, -116], [-58, -96]];
  const AN_NECK = [[-66, 116], [-58, 200], [-70, 300], [56, 300], [50, 180], [36, 104]];
  const AN_ROBE = [[-76, 262], [-196, 292], [-300, 372], [-350, 500], [-372, 680], [382, 680], [362, 500], [318, 372], [210, 292], [66, 262]];
  const AN_VINES = [
    { x: 118, a0: -PI / 2 + 0.05, len: 800, wave: 0.2, freq: 2.3, ph: 0.3, flower: true, w: 9, t0: 0.7 },
    { x: 205, a0: -PI / 2 - 0.12, len: 560, wave: 0.3, freq: 1.6, ph: 1.4, curl: 1.0, w: 6, t0: 1.15 },
    { x: 300, a0: -PI / 2 + 0.07, len: 660, wave: 0.16, freq: 2.6, ph: 2.2, flower: true, w: 8, t0: 0.95 },
    { x: 350, a0: -PI / 2 - 0.3, len: 330, wave: 0.25, freq: 1.4, ph: 0.7, curl: -1.1, w: 5, t0: 1.45 },
  ];

  function anRules(c, t) {
    const p = E.ioC(seg(t, AN_T.rule, AN_T.rule + 1.5));
    if (p <= 0) return;
    c.strokeStyle = AN.ink; c.lineCap = 'butt';
    [[22, 3.5], [34, 1.5]].forEach(([m, lw]) => {
      const half = (960 - m) * 2 + (1080 - 2 * m);
      c.lineWidth = lw; c.setLineDash([half * p, 1e5]);
      [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(960, 1080 - m); c.lineTo(960 + sd * (960 - m), 1080 - m); c.lineTo(960 + sd * (960 - m), m); c.lineTo(960, m); c.stroke(); });
    });
    c.setLineDash([]);
    // gilt roundels drop into the corners
    [[28, 28], [1892, 28], [28, 1052], [1892, 1052]].forEach(([x, y], i) => {
      const b = E.outB(seg(t, 1.0 + i * 0.12, 1.5 + i * 0.12));
      if (b <= 0) return;
      c.save(); c.translate(x, y); c.scale(b, b);
      c.fillStyle = AN.gold; c.beginPath(); c.arc(0, 0, 24, 0, TAU); c.fill();
      c.strokeStyle = AN.ink; c.lineWidth = 2.5; c.stroke();
      c.fillStyle = AN.terra; for (let k = 0; k < 6; k++) { leaf(c, 0, 0, k / 6 * TAU + 0.3, 17, 5); c.fill(); }
      c.fillStyle = AN.goldL; c.beginPath(); c.arc(0, 0, 4, 0, TAU); c.fill();
      c.restore();
    });
  }

  function anHalo(c, t, st) {
    const pr = E.ioC(seg(t, AN_T.halo, AN_T.halo + 1.3));
    if (pr <= 0) return;
    const sunOn = seg(t, AN_T.sun, AN_T.sun + 0.5) * (1 - seg(t, AN_T.sunEnd - 0.3, AN_T.sunEnd));
    const sunA = lerp(-PI * 1.02, PI * 0.02, E.ioS(seg(t, AN_T.sun, AN_T.sunEnd)));
    c.save(); c.translate(AN_HX, AN_HY);
    // gilt inner disk with turned rings
    c.globalAlpha = pr;
    const dg = c.createRadialGradient(0, -40, 10, 0, 0, 176);
    dg.addColorStop(0, '#f7e9bd'); dg.addColorStop(1, '#ddb96c');
    c.fillStyle = dg; c.beginPath(); c.arc(0, 0, 176, 0, TAU); c.fill();
    c.strokeStyle = rgba(AN.gold, 0.7); c.lineWidth = 1.5;
    [70, 110, 150].forEach(r => { c.beginPath(); c.arc(0, 0, r, -PI / 2, -PI / 2 + TAU * pr); c.stroke(); });
    c.globalAlpha = 1;
    // the leaded glass: unlit panes are pale paper; each one fills with colour from the top down
    st.panes.forEach(P => {
      const lit = E.outC(seg(t, AN_T.glass + P.ord * 1.4, AN_T.glass + P.ord * 1.4 + 0.45));
      c.beginPath(); P.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
      c.fillStyle = AN.paperD; c.globalAlpha = pr; c.fill();
      if (lit > 0) {
        const sh = 0.82 + 0.12 * Math.sin(t * 0.8 + P.ph);
        c.globalAlpha = lit; c.fillStyle = shade(P.col, sh); c.fill();
        // a lighter streak inside each pane, as in opalescent glass
        c.save(); c.clip(); c.strokeStyle = rgba('#fff4d8', 0.18 * lit); c.lineWidth = 8;
        c.beginPath(); c.moveTo(P.cx - 40, P.cy - 20 * P.sk); c.lineTo(P.cx + 40, P.cy + 20 * P.sk); c.stroke(); c.restore();
        // the sun passing behind
        let d = Math.abs(((P.am - sunA) % TAU + TAU + PI) % TAU - PI);
        const sun = sunOn * Math.exp(-(d / 0.32) * (d / 0.32));
        if (sun > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = sun * 0.55 * lit; c.fillStyle = shade(P.col, 1.3); c.fill(); c.globalCompositeOperation = 'source-over'; }
      }
    });
    c.globalAlpha = pr;
    c.strokeStyle = '#2a1b12'; c.lineWidth = 5; c.lineJoin = 'round';
    st.panes.forEach(P => { c.beginPath(); P.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.stroke(); });
    // mosaic band round the outside
    const nt = 72;
    for (let k = 0; k < nt * pr; k++) {
      const a0 = -PI / 2 + k / nt * TAU, a1 = a0 + TAU / nt * 0.86;
      c.fillStyle = [AN.gold, AN.olive, AN.gold, AN.terra][k % 4];
      c.beginPath(); c.arc(0, 0, 348, a0, a1); c.arc(0, 0, 324, a1, a0, true); c.closePath(); c.fill();
    }
    c.strokeStyle = AN.ink; c.lineWidth = 3;
    [176, 322, 350].forEach(r => { c.beginPath(); c.arc(0, 0, r, -PI / 2, -PI / 2 + TAU * pr); c.stroke(); });
    c.restore();
    c.globalAlpha = 1;
  }

  function anHairStrands(c, t, st, front) {
    st.strands.forEach((S, i) => {
      if (S.front !== front) return;
      const p = E.outC(seg(t, AN_T.hair + S.d, AN_T.hair + S.d + 1.9));
      if (p <= 0) return;
      const ox = AN_FX + Math.cos(S.th) * S.r, oy = AN_FY + Math.sin(S.th) * S.r;
      const pts = whip(ox, oy, { a0: S.a0 + 0.05 * Math.sin(t * 0.9 + i * 0.7), aEnd: S.aEnd + 0.09 * Math.sin(t * 0.7 + i), len: S.len, n: 44, pw: 0.45, wave: S.wave, freq: S.freq, ph: S.ph + t * 0.6, curl: S.curl, cAt: 0.6 });
      ribbon(c, pts, u => S.w * (0.6 + 0.4 * Math.sin(PI * Math.min(1, u * 1.3 + 0.1))) * (1 - 0.72 * u) + 1.4, p);
      c.fillStyle = S.col; c.fill();
      c.lineWidth = 1.6; c.strokeStyle = AN.ink; c.stroke();
    });
  }

  function anFigure(c, t, st) {
    const fa = E.ioS(seg(t, AN_T.fig, AN_T.figEnd)), ol = E.ioC(seg(t, AN_T.fig, AN_T.figEnd + 0.2));
    if (fa <= 0 && ol <= 0) return;
    c.save(); c.translate(AN_FX, AN_FY);
    c.lineJoin = 'round'; c.lineCap = 'round';
    const inked = (lw = 2.6) => { c.setLineDash([1500 * ol, 4000]); c.lineWidth = lw; c.strokeStyle = AN.ink; c.stroke(); c.setLineDash([]); };
    // hair mass behind the head
    c.globalAlpha = fa; smooth(c, AN_HAIRBASE); c.fillStyle = AN.hair; c.fill(); c.globalAlpha = 1; inked(2.4);
    c.restore();
    c.save(); c.globalAlpha = fa; anHairStrands(c, t, st, false); c.restore();
    c.save(); c.translate(AN_FX, AN_FY); c.lineJoin = 'round'; c.lineCap = 'round';
    // neck, then the robe over it
    c.globalAlpha = fa; smooth(c, AN_NECK); c.fillStyle = AN.skin; c.fill(); c.globalAlpha = 1; inked(2.2);
    c.globalAlpha = fa; smooth(c, AN_ROBE); const rg = c.createLinearGradient(0, 260, 0, 480); rg.addColorStop(0, AN.sage); rg.addColorStop(1, AN.olive); c.fillStyle = rg; c.fill(); c.globalAlpha = 1; inked(2.6);
    // drapery folds fall in long whiplash lines
    c.globalAlpha = fa;
    for (let k = 0; k < 9; k++) {
      const x0 = lerp(-190, 200, k / 8), pts = whip(x0, 300 + Math.abs(x0) * 0.25, { a0: PI / 2 + (x0 < 0 ? 0.5 : -0.5) * (Math.abs(x0) / 200), aEnd: PI / 2, len: 340, n: 24, wave: 0.18, freq: 1.4, ph: k + t * 0.4 });
      ribbon(c, pts, u => 4 * (1 - u) + 0.8, ol); c.fillStyle = AN.moss; c.fill();
    }
    // a rose scarf across the shoulders
    const sc = whip(-300, 400, { a0: -0.55, aEnd: 0.25, len: 620, n: 30, wave: 0.22, freq: 2, ph: t * 0.5 });
    ribbon(c, sc, u => 26 * Math.sin(PI * clamp(u * 1.1 + 0.05)) + 3, ol); c.fillStyle = AN.rose; c.fill(); c.lineWidth = 2; c.strokeStyle = AN.ink; c.stroke();
    // gold brooch at the neckline
    c.fillStyle = AN.gold; c.beginPath(); c.arc(-4, 288, 24, 0, TAU); c.fill(); c.lineWidth = 2.4; c.stroke();
    c.fillStyle = AN_GLASS[1]; c.beginPath(); c.arc(-4, 288, 11, 0, TAU); c.fill(); c.stroke();
    c.globalAlpha = 1;
    // the head in profile
    c.globalAlpha = fa; smooth(c, AN_FACE); c.fillStyle = AN.skin; c.fill();
    const bl = c.createRadialGradient(-52, 42, 2, -52, 42, 44); bl.addColorStop(0, 'rgba(214,120,100,0.32)'); bl.addColorStop(1, 'rgba(214,120,100,0)');
    c.fillStyle = bl; c.fill(); c.globalAlpha = 1; inked(3.2);
    c.globalAlpha = fa;
    c.fillStyle = AN.roseD; c.beginPath(); c.moveTo(-111, 57); c.lineTo(-101, 55); c.quadraticCurveTo(-96, 66, -103, 74); c.lineTo(-109, 72); c.quadraticCurveTo(-104, 66, -111, 57); c.fill();
    c.strokeStyle = AN.ink; c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(-84, -20); c.quadraticCurveTo(-68, -6, -48, -16); c.stroke();        // closed eye
    for (let k = 0; k < 4; k++) { const x = -80 + k * 9; c.beginPath(); c.moveTo(x, -13 + Math.abs(k - 1.5) * -1.5); c.lineTo(x - 3, -5); c.stroke(); }
    c.lineWidth = 2; c.beginPath(); c.moveTo(-92, -46); c.quadraticCurveTo(-72, -60, -44, -52); c.stroke(); // brow
    c.beginPath(); c.moveTo(-110, 34); c.quadraticCurveTo(-102, 30, -98, 36); c.stroke();               // nostril
    c.beginPath(); c.moveTo(-108, 66); c.lineTo(-97, 66); c.stroke();
    // a fringe of hair over the brow, then flowers in it
    smooth(c, AN_FRINGE); c.fillStyle = AN.hairL; c.fill(); c.globalAlpha = 1; inked(2.4);
    c.globalAlpha = fa;
    for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(-60 + k * 30, -150 + Math.abs(k - 2) * 8); c.quadraticCurveTo(-40 + k * 30, -125, -50 + k * 32, -104); c.lineWidth = 1.4; c.stroke(); }
    c.restore();
    c.save(); c.globalAlpha = fa; anHairStrands(c, t, st, true); c.restore();
    // poppies and daisies open in a garland round the crown
    for (let k = 0; k < 6; k++) {
      const b = E.outB(seg(t, AN_T.bloom + k * 0.14, AN_T.bloom + k * 0.14 + 0.6));
      if (b <= 0) continue;
      const a = lerp(-PI * 0.66, -PI * 0.02, k / 5), x = AN_FX + Math.cos(a) * 158, y = AN_FY + Math.sin(a) * 150, sw = 0.1 * Math.sin(t * 1.2 + k);
      c.save(); c.translate(x, y); c.rotate(sw); c.scale(b, b);
      const col = k % 2 ? AN.cream : AN.terra, R = k % 2 ? 26 : 34, np = k % 2 ? 9 : 5;
      for (let j = 0; j < np; j++) { leaf(c, 0, 0, j / np * TAU + k, R, R * (k % 2 ? 0.28 : 0.55), 4); c.fillStyle = col; c.fill(); c.lineWidth = 1.6; c.strokeStyle = AN.ink; c.stroke(); }
      c.fillStyle = k % 2 ? AN.gold : AN.ink; c.beginPath(); c.arc(0, 0, k % 2 ? 7 : 9, 0, TAU); c.fill();
      c.restore();
    }
  }

  function anIron(c, t, st) {
    const p = E.ioC(seg(t, AN_T.arch, AN_T.archEnd)), glow = E.ioS(seg(t, AN_T.lamp, AN_T.lamp + 0.9));
    if (p <= 0) return;
    for (let side = 0; side < 2; side++) {
      c.save(); if (side) { c.translate(1920, 0); c.scale(-1, 1); }
      const pts = st.stem;
      ribbon(c, pts, u => lerp(32, 10, u) + 18 * Math.exp(-u * 26), p);
      c.fillStyle = AN.iron; c.fill(); c.lineWidth = 2; c.strokeStyle = '#1d2b22'; c.stroke();
      // cast highlight down the lit flank
      const n = Math.floor((pts.length - 1) * p);
      c.strokeStyle = rgba(AN.ironL, 0.75); c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); for (let i = 2; i < n - 1; i++) { const a = angAt(pts, i), w = (lerp(32, 10, i / (pts.length - 1)) + 18 * Math.exp(-i / (pts.length - 1) * 26)) * 0.22; const x = pts[i][0] + Math.sin(a) * w, y = pts[i][1] - Math.cos(a) * w; i === 2 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
      // shoots and root curls sprout as the stalk passes them
      st.shoots.forEach(S => {
        const q = E.outC(seg(p, S.at, S.at + 0.3));
        if (q <= 0) return;
        ribbon(c, S.pts, u => S.w * (1 - u * 0.8) + 1.5, q); c.fillStyle = AN.iron; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#1d2b22'; c.stroke();
      });
      if (p > 0.97) {
        const [lx, ly] = pts[pts.length - 1], k = E.outB(seg(p, 0.97, 1));
        c.save(); c.translate(lx, ly + 4); c.scale(k, k);
        if (glow > 0) {
          c.globalCompositeOperation = 'lighter';
          const gg = c.createRadialGradient(0, 40, 4, 0, 40, 170); gg.addColorStop(0, `rgba(255,160,70,${0.5 * glow})`); gg.addColorStop(1, 'rgba(255,120,40,0)');
          c.fillStyle = gg; c.fillRect(-180, -130, 360, 340); c.globalCompositeOperation = 'source-over';
        }
        const lg = c.createRadialGradient(-6, 30, 2, 0, 42, 34);
        lg.addColorStop(0, glow > 0 ? `rgb(255,${lerp(170, 236, glow) | 0},${lerp(90, 170, glow) | 0})` : '#e9945a'); lg.addColorStop(1, glow > 0 ? '#d4471c' : '#9c3a1c');
        c.fillStyle = lg; c.beginPath(); c.ellipse(0, 42, 21, 33, 0, 0, TAU); c.fill(); c.lineWidth = 2; c.strokeStyle = '#1d2b22'; c.stroke();
        c.fillStyle = AN.iron; leaf(c, 0, 4, PI / 2 + 0.75, 40, 9, -4); c.fill(); c.stroke(); leaf(c, 0, 4, PI / 2 - 0.75, 40, 9, 4); c.fill(); c.stroke();
        c.restore();
      }
      c.restore();
    }
  }

  function anVines(c, t) {
    for (let side = 0; side < 2; side++) {
      c.save(); if (side) { c.translate(1920, 0); c.scale(-1, 1); }
      AN_VINES.forEach((V, i) => {
        const t0 = V.t0 + side * 0.18, p = E.outC(seg(t, t0, t0 + 2.2));
        if (p <= 0) return;
        const pts = whip(V.x, 1090, { a0: V.a0 + 0.025 * Math.sin(t * 0.7 + i + side * 2), len: V.len, n: 40, wave: V.wave, freq: V.freq, ph: V.ph + side * 0.9 + 0.22 * Math.sin(t * 0.8 + i), curl: V.curl || 0, cAt: 0.55 });
        ribbon(c, pts, u => V.w * (1 - u * 0.75) + 1.2, p);
        c.fillStyle = AN.moss; c.fill(); c.lineWidth = 1.4; c.strokeStyle = AN.ink; c.stroke();
        if (!V.flower) return;
        [0.18, 0.32, 0.46, 0.6, 0.72].forEach((s, k) => {
          const g = E.outB(seg(p, s, s + 0.16));
          if (g <= 0) return;
          const j = Math.round(s * (pts.length - 1)), a = angAt(pts, j) + (k % 2 ? 0.8 : -0.8);
          leaf(c, pts[j][0], pts[j][1], a, 96 * (1 - s * 0.5) * g, 20 * g, (k % 2 ? 1 : -1) * 14 * g);
          c.fillStyle = k % 2 ? AN.sage : AN.olive; c.fill(); c.lineWidth = 1.5; c.strokeStyle = AN.ink; c.stroke();
        });
        const b = E.outB(seg(t, t0 + 1.9, t0 + 2.8));
        if (b <= 0) return;
        const tip = pts[pts.length - 1], ta = angAt(pts, pts.length - 1);
        c.save(); c.translate(tip[0], tip[1]);
        for (let k = 0; k < 6; k++) {
          const a = ta + (k - 2.5) * 0.46 * b;
          leaf(c, 0, 0, a, 80 * b, 22 * b, (k < 3 ? -1 : 1) * 22 * b);
          c.fillStyle = k % 2 ? AN.rose : AN.cream; c.fill(); c.lineWidth = 1.6; c.strokeStyle = AN.ink; c.stroke();
        }
        c.strokeStyle = AN.ink; c.lineWidth = 1.4; c.fillStyle = AN.gold;
        for (let k = 0; k < 4; k++) { const a = ta + (k - 1.5) * 0.25, L = 52 * b; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * L, Math.sin(a) * L); c.stroke(); c.beginPath(); c.arc(Math.cos(a) * L, Math.sin(a) * L, 4.5 * b, 0, TAU); c.fill(); }
        c.restore();
      });
      c.restore();
    }
  }

  function anCartouche(c, t) {
    const ca = E.outC(seg(t, AN_T.cart, AN_T.cart + 0.7));
    if (ca <= 0) return;
    const y = 884 + (1 - ca) * 40;
    c.save(); c.globalAlpha = ca;
    c.fillStyle = 'rgba(60,40,20,0.25)'; rrect(c, 596, y + 8, 740, 158, 79); c.fill();
    const g = c.createLinearGradient(0, y, 0, y + 158); g.addColorStop(0, '#59652f'); g.addColorStop(1, '#3e4a22');
    c.fillStyle = g; rrect(c, 590, y, 740, 158, 79); c.fill();
    c.strokeStyle = AN.gold; c.lineWidth = 4; c.stroke();
    c.lineWidth = 1.5; rrect(c, 602, y + 12, 716, 134, 67); c.stroke();
    // whiplash flourishes at both ends
    [-1, 1].forEach(sd => {
      const pts = whip(960 + sd * 300, y + 79, { a0: sd > 0 ? -PI / 2 : -PI / 2, aEnd: sd > 0 ? 0.2 : PI - 0.2, len: 90, n: 24, curl: sd * 0.8, cAt: 0.4 });
      ribbon(c, pts, u => 5 * (1 - u) + 1, 1); c.fillStyle = AN.goldL; c.fill();
    });
    c.restore();
    // title letters rise one by one
    const fnt = '400 84px Federant', s = 'ART NOUVEAU', G = glyphs(c, s, fnt, 6);
    let x = 960 - G.tw / 2;
    [...s].forEach((ch, i) => {
      const u = E.outC(seg(t, AN_T.title + i * 0.07, AN_T.title + i * 0.07 + 0.5));
      if (u > 0) text(c, ch, x, 980 + (1 - u) * 18, { font: 'Federant', size: 84, color: rgba(AN.goldL, u) });
      x += G.ws[i];
    });
    const su = E.ioS(seg(t, AN_T.sub, AN_T.sub + 0.7));
    if (su > 0) text(c, 'Whiplash line and living ornament · 1890–1910', 960, 1018, { font: '"Cormorant Garamond"', style: 'italic', weight: 500, size: 28, color: rgba(AN.cream, su * 0.92), align: 'center', ls: 1 });
  }

  MG.film({
    id: 'artnouveau', dur: 10, poster: 9.3,
    fonts: [['400 84px Federant', 'ART NOUVEAU'], ['italic 500 28px "Cormorant Garamond"', 'Whiplash line and living ornament · 1890–1910']],
    meta: {
      family: 'A', name: 'Art Nouveau', sub: 'The Whiplash Line', era: '1890 — 1910',
      origin: 'Art Nouveau took its name from Siegfried Bing’s Paris shop, the Maison de l’Art Nouveau (1895), and spread across Europe as Jugendstil, Secession and Modernisme: a total style that let one living line run through posters, ironwork, glass, furniture and buildings. Alphonse Mucha’s posters framed women in halos and flowing hair, Victor Horta and Hector Guimard bent iron into plant stems, and Tiffany Studios set opalescent glass in lead.',
      works: 'Gismonda poster (Alphonse Mucha, 1894) · Job cigarette-paper poster (Mucha, 1896) · Hôtel Tassel, Brussels (Victor Horta, 1893) · Paris Métro entrances (Hector Guimard, 1900)',
      tech: ['Grown whiplash ribbons', 'Pane-by-pane leaded glass', 'Ink-line draw-on'],
      accent: '#c79738',
      motionDNA: 'Nothing is placed, everything grows: stalks rise and bow over, shoots uncurl, leaves unfold along vines, hair pours out in waves that travel down each strand and wind into spirals, while the whole poster breathes with a slow sway and the light moves through the glass.',
      visualDNA: 'Muted olive, sage, ochre, dusty rose and gold on cream, with brown ink outlines of varying weight; a woman in profile against a circular halo, macaroni curls, lilies and poppies, verdigris cast iron with orange glass lamps, a gilt mosaic band and a rounded title cartouche.',
      transitions: 'Border rule draw-on, organic growth from the frame edges, top-down glass lighting, ink-outline reveal, letter-by-letter rise',
      implementation: ['Lithographic poster artwork, hand-inked', 'Illustrator + After Effects shape growth', 'Canvas 2D (procedural whiplash ribbons)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const W = 1920, H = 1080, r = rng(1895);
      // lithograph paper: warm stock, soft blotches, fibres, and a faint stencilled lattice inside the arch
      const paper = offscreen(W, H), g = paper.getContext('2d');
      const pg = g.createRadialGradient(960, 480, 200, 960, 540, 1150); pg.addColorStop(0, '#f4ead0'); pg.addColorStop(1, '#ddc898');
      g.fillStyle = pg; g.fillRect(0, 0, W, H);
      for (let k = 0; k < 40; k++) {
        const x = r() * W, y = r() * H, R = 60 + r() * 220, bg = g.createRadialGradient(x, y, 0, x, y, R);
        bg.addColorStop(0, `rgba(170,130,70,${0.03 + r() * 0.05})`); bg.addColorStop(1, 'rgba(170,130,70,0)');
        g.fillStyle = bg; g.fillRect(x - R, y - R, R * 2, R * 2);
      }
      for (let k = 0; k < 6000; k++) { g.fillStyle = r() < 0.6 ? `rgba(110,80,40,${0.05 + r() * 0.08})` : `rgba(255,250,235,${0.1 + r() * 0.2})`; g.fillRect(r() * W, r() * H, 1 + r() * 1.5, 1 + r() * 1.5); }
      g.save(); g.beginPath(); g.rect(500, 60, 920, 840); g.clip();
      g.strokeStyle = 'rgba(170,140,80,0.22)'; g.lineWidth = 1.2;
      for (let k = -20; k < 40; k++) { g.beginPath(); g.moveTo(500 + k * 46, 60); g.lineTo(500 + k * 46 - 840, 900); g.stroke(); g.beginPath(); g.moveTo(500 + k * 46 - 840, 60); g.lineTo(500 + k * 46, 900); g.stroke(); }
      g.fillStyle = 'rgba(175,140,80,0.25)';
      for (let j = 0; j < 40; j++) for (let i = 0; i < 44; i++) { g.beginPath(); g.arc(500 + i * 46 - (j % 2) * 23, 60 + j * 23, 3, 0, TAU); g.fill(); }
      g.restore();
      // the halo's leaded glass: two rings of irregular panes, slanted leads, jewel colours
      const panes = [];
      const ring = (r0, r1, n, rot) => {
        const bi = [], bo = [];
        for (let k = 0; k < n; k++) { const b = rot + (k + (r() - 0.5) * 0.45) / n * TAU; bi.push(b); bo.push(b + (r() - 0.5) * 0.14); }
        for (let k = 0; k < n; k++) {
          const i0 = bi[k], i1 = bi[(k + 1) % n] + (k === n - 1 ? TAU : 0), o0 = bo[k], o1 = bo[(k + 1) % n] + (k === n - 1 ? TAU : 0), pts = [];
          for (let j = 0; j <= 4; j++) { const a = lerp(i0, i1, j / 4); pts.push([Math.cos(a) * r0, Math.sin(a) * r0]); }
          for (let j = 4; j >= 0; j--) { const a = lerp(o0, o1, j / 4); pts.push([Math.cos(a) * r1, Math.sin(a) * r1]); }
          const am = (i0 + i1) / 2, rm = (r0 + r1) / 2;
          let d = Math.abs(((am + PI / 2) % TAU + TAU + PI) % TAU - PI);
          panes.push({ pts, am, cx: Math.cos(am) * rm, cy: Math.sin(am) * rm, sk: r() - 0.5, ph: r() * TAU, col: AN_GLASS[(r() * AN_GLASS.length) | 0], ord: d / PI * 0.85 + (r0 > 200 ? 0.15 : 0) });
        }
      };
      ring(176, 250, 18, 0.1); ring(250, 322, 26, 0.3);
      // the stalk, its side shoots and root curls (left side; the right is mirrored)
      const stem = spline(AN_STEM, 10), L = stem.length - 1;
      const at = u => stem[Math.round(u * L)];
      const shoots = [
        { at: 0.04, w: 9, pts: whip(...at(0.03), { a0: PI + 0.25, len: 110, n: 24, curl: -0.8, cAt: 0.35 }) },
        { at: 0.04, w: 9, pts: whip(...at(0.03), { a0: -0.15, len: 90, n: 24, curl: 0.8, cAt: 0.35 }) },
        { at: 0.3, w: 10, pts: whip(...at(0.32), { a0: PI + 0.55, len: 190, n: 30, wave: 0.2, freq: 1.2, curl: -0.95, cAt: 0.45 }) },
        { at: 0.48, w: 8, pts: whip(...at(0.5), { a0: PI + 1.25, len: 150, n: 28, curl: -0.85, cAt: 0.4 }) },
        { at: 0.6, w: 7, pts: whip(...at(0.62), { a0: 0.2, len: 120, n: 26, curl: 0.9, cAt: 0.4 }) },
      ];
      const strands = [], N = 36;
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1), th = lerp(-PI * 0.64, PI * 0.3, u) + (r() - 0.5) * 0.05, rt = Math.cos(th) > 0;
        strands.push({
          th, r: 126 + r() * 22, a0: th + (rt ? 0.45 : -0.25) + (r() - 0.5) * 0.3, aEnd: PI / 2 + (rt ? -0.32 : 0.4) + (r() - 0.5) * 0.4,
          len: 230 + r() * 260 + (rt ? 110 : 30), wave: 0.4 + r() * 0.45, freq: 1.1 + r() * 1.4, ph: r() * TAU,
          curl: (r() < 0.5 ? -1 : 1) * (0.55 + r() * 0.6), w: 10 + r() * 13, col: [AN.hair, AN.hairD, AN.hairL][(r() * 3) | 0],
          d: u * 0.9 + r() * 0.3, front: th > PI * 0.1 && r() < 0.7,
        });
      }
      return { paper, panes, stem, shoots, strands };
    },
    draw(c, t, W, H, st) {
      // the poster breathes: a very slow push-in toward the halo
      const zs = 1 + 0.025 * E.ioS(seg(t, 0, 10));
      c.save(); c.translate(960, 500); c.scale(zs, zs); c.translate(-960, -500);
      c.drawImage(st.paper, 0, 0);
      anHalo(c, t, st);
      anFigure(c, t, st);
      anIron(c, t, st);
      anVines(c, t);
      anCartouche(c, t);
      c.restore();
      anRules(c, t);
      // afternoon light through a studio window, warm print, paper grain
      const sun = seg(t, AN_T.sun, AN_T.sun + 1) * (1 - seg(t, 9.6, 10));
      if (sun > 0) {
        c.save(); c.globalCompositeOperation = 'soft-light';
        const lg = c.createLinearGradient(lerp(200, 1700, seg(t, AN_T.sun, AN_T.sunEnd)) - 500, 0, lerp(200, 1700, seg(t, AN_T.sun, AN_T.sunEnd)) + 500, 1080);
        lg.addColorStop(0, 'rgba(255,230,170,0)'); lg.addColorStop(0.5, `rgba(255,230,170,${0.5 * sun})`); lg.addColorStop(1, 'rgba(255,230,170,0)');
        c.fillStyle = lg; c.fillRect(0, 0, W, H); c.restore();
      }
      vignette(c, W, H, 0.32, '70,40,15');
      grain(c, W, H, t, 0.05, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.8;
      // harp: a rising arpeggio as the ironwork grows, D major with an added sixth and ninth
      const harp = [50, 57, 62, 66, 69, 71, 74, 76, 78, 81, 83, 86];
      harp.forEach((m, i) => A.pluck(0.3 + i * 0.17, midi(m), { dur: 2.2, g: 0.2, bright: 0.55, decay: 0.997, rev: 0.45, pan: (i % 2 ? 0.3 : -0.3) }));
      // a soft string pad under the whole poster
      A.chord(0.2, [38, 50, 57, 62, 66], { type: 'triangle', dur: 4.4, g: 0.035, a: 1.4, hold: true, rel: 1.2, spread: 6, width: 0.6, rev: 0.4 });
      A.chord(4.4, [43, 55, 59, 62, 69], { type: 'triangle', dur: 3.2, g: 0.034, a: 1.0, hold: true, rel: 1.0, spread: 6, width: 0.6, rev: 0.4 });
      A.chord(7.4, [38, 50, 57, 64, 66, 71], { type: 'triangle', dur: 2.6, g: 0.036, a: 0.6, hold: true, rel: 1.2, spread: 7, width: 0.7, rev: 0.5 });
      // celesta: one bell per run of glass panes, falling from the top of the halo
      [86, 83, 81, 78, 76, 74, 71, 69, 66].forEach((m, i) => A.bell(AN_T.glass + i * 0.16, midi(m), { g: 0.035, dur: 1.6, rev: 0.6, pan: (i % 2 ? 0.45 : -0.45) }));
      // the hair: a slow harp waltz, bass on one, chord on two and three
      const bar = 0.6, roots = [43, 47, 45, 38], tops = [[59, 62, 67], [59, 62, 66], [57, 61, 64], [57, 62, 66]];
      for (let k = 0; k < 4; k++) {
        const t0 = AN_T.hair + k * bar * 3 / 2 * 1.0;
        A.pluck(t0, midi(roots[k]), { dur: 1.6, g: 0.26, bright: 0.35, decay: 0.996, lp: 1400 });
        tops[k].forEach((m, j) => { A.pluck(t0 + bar * 0.5 + j * 0.03, midi(m), { dur: 1, g: 0.09, bright: 0.6, rev: 0.4 }); A.pluck(t0 + bar + j * 0.03, midi(m), { dur: 1, g: 0.08, bright: 0.6, rev: 0.4 }); });
      }
      // a flute line drifts in whole tones as the curls spiral
      [[4.3, 74, 0.8], [5.1, 76, 0.6], [5.7, 78, 0.9], [6.6, 80, 0.5], [7.1, 78, 0.8]].forEach(([t, m, d]) => A.osc(t, { type: 'sine', f: midi(m), dur: d, g: 0.04, a: 0.12, vib: [5, 4], hold: true, rel: 0.2, rev: 0.5 }));
      // poppies open: tiny harmonics
      for (let k = 0; k < 6; k++) A.pluck(AN_T.bloom + k * 0.14, midi([93, 90, 88, 86, 83, 81][k]), { dur: 0.8, g: 0.07, bright: 0.8, rev: 0.6 });
      // the lamps come on
      A.bell(AN_T.lamp, midi(69), { g: 0.06, dur: 2.2, rev: 0.6, pan: -0.5 }); A.bell(AN_T.lamp + 0.12, midi(73), { g: 0.06, dur: 2.2, rev: 0.6, pan: 0.5 });
      // the title: a harp glissando, then the final chord with a held bell
      for (let i = 0; i < 11; i++) A.pluck(AN_T.title + i * 0.07, midi([62, 64, 66, 69, 71, 74, 76, 78, 81, 83, 86][i]), { dur: 1.4, g: 0.13, bright: 0.6, rev: 0.5 });
      A.pluck(AN_T.sub, midi(38), { dur: 1.7, g: 0.32, bright: 0.3, lp: 900 });
      A.bell(AN_T.sub, midi(78), { g: 0.04, dur: 1.7, rev: 0.7 });
      A.bell(AN_T.sun + 0.6, midi(90), { g: 0.025, dur: 1.4, rev: 0.7, pan: 0.3 });
    },
  });

  /* =====================================================================
     FUTURISM — speed, noise and the machine. It opens on Balla's dachshund
     trotting beside its owner's skirts: every leg, tail, ear and the leash
     smeared into chronophotographic fans of a dozen positions. A bundle of
     red and black force-line needles slices the frame and a locomotive
     storms in, repeated in a train of echoes, wheels spinning, smoke
     shredding, the background splintered into interpenetrating planes and
     rays. Boccioni's bronze striding figure takes its place, each step
     leaving five ghost bodies with flame-like calves; then Marinetti's
     words-in-freedom slam into the page from every direction, ZANG TUMB
     TUUUM swelling letter by letter, and FUTURISM lands leaning forward
     on a black diagonal band
     ===================================================================== */
  const FU = { paper: '#ebe0c8', ink: '#141110', red: '#d22a1c', orange: '#e9762a', ochre: '#d9a236', steel: '#4a6d8c', navy: '#1e3050', grey: '#8b8577', cream: '#f4ecd8' };
  const FU_F = { A: 'Anton', B: '"Bodoni Moda"', K: '"Archivo Black"', C: '"Courier Prime"' };
  const FU_T = { wipe: 2.5, wipeEnd: 3.05, train: 2.9, trainEnd: 5.1, fig: 5.0, figEnd: 7.5, words: 7.0, band: 8.3, title: 8.4, sub: 9.0 };
  const FU_TX = t => kf(t, [[2.9, 2500], [3.8, 1150, E.outC], [4.4, 900, E.lin], [5.1, -1700, E.inC]]);
  const FU_FX = t => kf(t, [[5.0, -260], [7.0, 1020, E.lin], [7.8, 1180, E.outQ]]);
  // words in freedom: text, face, weight, style, size, x, y, rotation, colour, landing time, entry direction
  const FU_W = [
    { s: 'ZANG', f: FU_F.A, w: 400, size: 230, x: 110, y: 330, rot: -0.12, col: FU.red, t: 7.0, dx: -1, dy: -0.4 },
    { s: 'TUMB', f: FU_F.B, w: 900, st: 'italic', size: 160, x: 560, y: 220, rot: 0.1, col: FU.ink, t: 7.17, dx: 0.2, dy: -1 },
    { s: 'TUUUUUM', f: FU_F.A, w: 400, grow: [70, 190], x: 1110, y: 390, rot: -0.06, col: FU.ink, t: 7.34, dx: 1, dy: 0 },
    { s: 'BOOM', f: FU_F.A, w: 400, size: 150, x: 1840, y: 205, rot: 0.1, col: FU.red, t: 7.55, dx: 1, dy: -1, align: 'right' },
    { s: '+ + +', f: FU_F.K, w: 400, size: 80, x: 120, y: 470, rot: 0, col: FU.red, t: 7.66, dx: -1, dy: 0 },
    { s: 'SPEED', f: FU_F.K, w: 400, size: 150, x: 100, y: 990, rot: -0.08, col: FU.orange, t: 7.76, dx: -1, dy: 1 },
    { s: 'VELOCITY = FORCE', f: FU_F.B, w: 700, size: 58, x: 760, y: 900, rot: 0.04, col: FU.ink, t: 7.88, dx: 0, dy: 1 },
    { s: 'TRRRRRR', f: FU_F.C, w: 700, size: 64, x: 1180, y: 1000, rot: -0.14, col: FU.steel, t: 7.98, dx: 1, dy: 0.6 },
    { s: '1909', f: FU_F.B, w: 900, st: 'italic', size: 120, x: 1820, y: 880, rot: 0.08, col: FU.ink, t: 8.08, dx: 1, dy: 0.3, align: 'right' },
  ];

  function fuDog(c, t) {
    c.fillStyle = FU.paper; c.fillRect(0, 0, 1920, 1080);
    // the pavement in Balla's diagonal bands
    c.save(); c.globalAlpha = 0.5;
    for (let k = -14; k < 30; k++) {
      const x = k * 96;
      c.fillStyle = k % 2 ? '#d7ccb3' : '#c9bea5';
      c.beginPath(); c.moveTo(x, 300); c.lineTo(x + 96, 300); c.lineTo(x + 96 + 520, 1080); c.lineTo(x + 520, 1080); c.closePath(); c.fill();
    }
    c.restore();
    const bx = 960 - t * 42, by = 700;
    // the owner's skirt hem, swinging in five positions at once
    for (let k = 5; k >= 0; k--) {
      c.fillStyle = k ? `rgba(30,35,48,${0.16})` : '#1d2230';
      c.beginPath(); c.moveTo(860 + k * 16, -10); c.lineTo(1780 + k * 16, -10);
      for (let x = 1780; x >= 860; x -= 20) c.lineTo(x + k * 16, 300 + 26 * Math.sin(x * 0.018 + t * 7 + k * 0.7) + k * 7 + (x - 860) * 0.04);
      c.closePath(); c.fill();
    }
    // her boots: two feet, each a fan of eight exposures
    [[1240, 0], [1420, PI]].forEach(([fx, ph]) => {
      for (let k = 0; k < 8; k++) {
        const a = t * TAU * 1.1 + ph + k * 0.32, x = fx + 70 * Math.sin(a), y = 430 - 26 * Math.max(0, Math.cos(a));
        c.fillStyle = `rgba(20,18,16,${k ? 0.14 : 0.8})`;
        c.beginPath(); c.ellipse(x - 30, y, 58, 20, -0.08, 0, TAU); c.fill();
        c.fillRect(x + 8, y - 70, 30, 74);
      }
    });
    // the leash: a chain caught in five swings
    for (let k = 0; k < 5; k++) {
      const x0 = 1560 + k * 10, y0 = -30, x1 = bx - 175, y1 = by - 58, mx = (x0 + x1) / 2 + 60 * Math.sin(t * 5 + k * 0.9), my = (y0 + y1) / 2 + 120 + 70 * Math.sin(t * 4.2 + k * 1.1);
      c.strokeStyle = `rgba(20,18,16,${k ? 0.25 : 0.75})`; c.lineWidth = 2.2;
      for (let j = 0; j <= 46; j++) {
        const u = j / 46, x = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * mx + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * my + u * u * y1;
        const dx = 2 * (1 - u) * (mx - x0) + 2 * u * (x1 - mx), dy = 2 * (1 - u) * (my - y0) + 2 * u * (y1 - my);
        c.beginPath(); c.ellipse(x, y, 9, 4.5, Math.atan2(dy, dx) + (j % 2) * 0.6, 0, TAU); c.stroke();
      }
    }
    // the dachshund: legs as whirling fans, tail and ears in many positions, a vibrating body
    const legs = [[-150, 0], [-112, PI], [118, PI * 0.5], [152, PI * 1.5]];
    legs.forEach(([lx, off]) => {
      for (let k = 0; k < 14; k++) {
        const a = 0.62 * Math.sin(t * TAU * 2.4 + off + k * 0.44), hx = bx + lx, hy = by + 26, L = 150;
        const px = hx + Math.sin(a) * L, py = hy + Math.cos(a) * L;
        c.fillStyle = `rgba(22,19,16,${k ? 0.16 : 0.85})`;
        c.beginPath(); c.moveTo(hx - 14, hy); c.lineTo(hx + 14, hy); c.lineTo(px + 7, py); c.lineTo(px - 7, py); c.closePath(); c.fill();
        c.beginPath(); c.ellipse(px - 8, py + 2, 18, 8, 0, 0, TAU); c.fill();
      }
    });
    for (let k = 0; k < 11; k++) {
      const a = -0.65 + 0.85 * Math.sin(t * TAU * 3 + k * 0.42), x0 = bx + 186, y0 = by - 20;
      c.strokeStyle = `rgba(22,19,16,${k ? 0.15 : 0.85})`; c.lineWidth = 12; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x0 + Math.cos(a) * 70, y0 + Math.sin(a) * 70 - 10, x0 + Math.cos(a - 0.3) * 130, y0 + Math.sin(a - 0.3) * 130); c.stroke();
    }
    [[-14, 0.3], [0, 1]].forEach(([dx, al]) => {
      c.fillStyle = `rgba(22,19,16,${al})`;
      c.beginPath(); c.ellipse(bx + dx, by, 200, 62, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(bx - 135 + dx, by + 12, 80, 58, 0, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(bx - 238 + dx, by - 46, 66, 46, -0.25, 0, TAU); c.fill();
      c.beginPath(); c.ellipse(bx - 298 + dx, by - 30, 46, 22, -0.1, 0, TAU); c.fill();
    });
    for (let k = 0; k < 7; k++) {
      const a = 0.25 + 0.4 * Math.sin(t * TAU * 2.4 + k * 0.5);
      c.fillStyle = `rgba(22,19,16,${k ? 0.2 : 0.9})`;
      c.save(); c.translate(bx - 222, by - 72); c.rotate(a); c.beginPath(); c.ellipse(10, 46, 22, 50, 0, 0, TAU); c.fill(); c.restore();
    }
    c.fillStyle = FU.cream; c.beginPath(); c.arc(bx - 262, by - 58, 5, 0, TAU); c.fill();
    c.fillStyle = FU.red; c.fillRect(bx - 205, by - 72, 14, 66);
  }

  // A locomotive in profile, nose to the left; origin at the front of the rails.
  function fuLoco(c, x, y, s, rot, col, al) {
    c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = al;
    c.fillStyle = col;
    c.beginPath(); c.moveTo(-90, -8); c.lineTo(20, -112); c.lineTo(20, -8); c.closePath(); c.fill();   // pilot
    c.fillRect(40, -250, 420, 142);                                                                     // boiler
    c.beginPath(); c.arc(46, -179, 72, 0, TAU); c.fill();                                               // smokebox
    c.beginPath(); c.moveTo(72, -248); c.lineTo(112, -248); c.lineTo(128, -350); c.lineTo(56, -350); c.closePath(); c.fill(); // chimney
    c.beginPath(); c.arc(250, -250, 36, PI, TAU); c.fill();
    c.fillRect(440, -372, 200, 300); c.fillRect(-10, -120, 680, 20);
    c.fillStyle = al > 0.6 ? FU.cream : 'rgba(244,236,216,0.4)'; c.fillRect(478, -340, 74, 74);
    c.fillStyle = FU.red; c.fillRect(-20, -100, 40, 26);
    // driving wheels, spokes turning, coupling rod
    c.strokeStyle = col; c.fillStyle = col;
    [[190, 66], [330, 66], [470, 66], [62, 38]].forEach(([wx, wr]) => {
      c.lineWidth = 12; c.beginPath(); c.arc(wx, -wr - 4, wr, 0, TAU); c.stroke();
      c.lineWidth = 5;
      for (let k = 0; k < 8; k++) { const a = rot * 66 / wr + k / 8 * TAU; c.beginPath(); c.moveTo(wx, -wr - 4); c.lineTo(wx + Math.cos(a) * wr, -wr - 4 + Math.sin(a) * wr); c.stroke(); }
    });
    const cr = [Math.cos(rot) * 30, Math.sin(rot) * 30];
    c.lineWidth = 14; c.strokeStyle = FU.red; c.beginPath(); c.moveTo(190 + cr[0], -70 + cr[1]); c.lineTo(470 + cr[0], -70 + cr[1]); c.stroke();
    c.restore();
  }

  // Boccioni's striding figure: hip at (x, ·), feet on `gy`; φ is the gait phase.
  function fuFigure(c, x, gy, phi, al, fill, fins = 1) {
    const L1 = 165, L2 = 175, legs = [phi, phi + PI].map(ps => {
      const a = 0.62 * Math.sin(ps), b = a - 1.15 * Math.pow(Math.max(0, Math.cos(ps)), 1.3);
      return { a, b, h: L1 * Math.cos(a) + L2 * Math.cos(b) };
    });
    const hy = gy - Math.max(legs[0].h, legs[1].h);
    c.save(); c.globalAlpha = al; c.fillStyle = fill;
    const shadow = 'rgba(28,14,4,0.28)';
    // a flame swelling back from a body segment: a lobe with a sharp tip trailing behind the stride
    const flame = (x0, y0, x1, y1, len, lift, u0 = 0.05, u1 = 0.95, ut = 0.55) => {
      const P = u => [lerp(x0, x1, u), lerp(y0, y1, u)], A = P(u0), B = P(u1), M = P(ut), T = [M[0] - len, M[1] - lift];
      c.beginPath(); c.moveTo(A[0], A[1]);
      c.quadraticCurveTo(A[0] - len * 0.85, A[1] - lift * 0.2, T[0], T[1]);
      c.quadraticCurveTo(B[0] - len * 0.55, B[1] - lift * 0.1, B[0], B[1]);
      c.closePath(); c.fill();
    };
    const limb = (x0, y0, x1, y1, w0, w1) => {
      const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a), mx = (x0 + x1) / 2, my = (y0 + y1) / 2, bw = (w0 + w1) * 0.62;
      c.beginPath(); c.moveTo(x0 + nx * w0, y0 + ny * w0); c.quadraticCurveTo(mx + nx * bw, my + ny * bw, x1 + nx * w1, y1 + ny * w1);
      c.lineTo(x1 - nx * w1, y1 - ny * w1); c.quadraticCurveTo(mx - nx * bw, my - ny * bw, x0 - nx * w0, y0 - ny * w0); c.closePath(); c.fill();
    };
    const lean = 0.34, sx = x + Math.sin(lean) * 230, sy = hy - Math.cos(lean) * 230;
    const J = legs.map(g => { const kx = x + Math.sin(g.a) * L1, ky = hy + Math.cos(g.a) * L1; return [kx, ky, kx + Math.sin(g.b) * L2, ky + Math.cos(g.b) * L2]; });
    // the far leg first, then its flames, then the near leg over them
    [1, 0].forEach(i => {
      const [kx, ky, ax, ay] = J[i];
      flame(x, hy, kx, ky, 105 * fins, 46, 0.1, 0.9, 0.45); flame(kx, ky, ax, ay, 120 * fins, 58, 0.05, 0.8, 0.4);
      flame(kx, ky, ax, ay, 70 * fins, -10, 0.45, 1, 0.8);
      if (i === 1) { c.fillStyle = shadow; flame(x, hy, kx, ky, 105 * fins, 46, 0.1, 0.9, 0.45); flame(kx, ky, ax, ay, 120 * fins, 58, 0.05, 0.8, 0.4); c.fillStyle = fill; }
      limb(x, hy, kx, ky, 36, 22); limb(kx, ky, ax, ay, 24, 13);
      c.beginPath(); c.arc(kx, ky, 22, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(ax - 22, ay - 18); c.lineTo(ax + 60, ay - 2); c.lineTo(ax - 24, ay + 4); c.closePath(); c.fill();
      if (i === 1) { c.fillStyle = shadow; limb(x, hy, kx, ky, 36, 22); limb(kx, ky, ax, ay, 24, 13); c.fillStyle = fill; }
    });
    // the torso pitched into the stride, chest thrust out, great planes streaming off the back
    flame(x - 20, hy - 10, sx - 40, sy + 10, 170 * fins, 70, 0.0, 0.9, 0.55);
    flame(x - 10, hy - 60, sx - 20, sy + 40, 120 * fins, -40, 0.1, 1, 0.7);
    c.fillStyle = shadow; flame(x - 20, hy - 10, sx - 40, sy + 10, 170 * fins, 70, 0.0, 0.9, 0.55); c.fillStyle = fill;
    c.beginPath(); c.moveTo(x - 40, hy + 16); c.lineTo(x + 42, hy + 4);
    c.quadraticCurveTo(x + 26, hy - 70, x + 60, hy - 112); c.quadraticCurveTo(sx + 104, sy + 58, sx + 48, sy - 8);
    c.lineTo(sx - 64, sy + 4); c.quadraticCurveTo(x - 30, hy - 96, x - 40, hy + 16); c.closePath(); c.fill();
    // shoulder stumps with upswept flares
    flame(sx - 50, sy + 60, sx + 10, sy - 10, 110 * fins, 80, 0, 1, 0.3);
    c.beginPath(); c.ellipse(sx - 6, sy + 30, 44, 26, 0.7, 0, TAU); c.fill();
    // the helmeted head: a smooth skull, a forward face plane and the cross-shaped ridges
    flame(sx - 10, sy - 90, sx + 6, sy - 20, 70 * fins, 30, 0, 1, 0.4);
    c.beginPath(); c.ellipse(sx + 24, sy - 56, 38, 46, 0.3, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(sx + 40, sy - 96); c.lineTo(sx + 80, sy - 56); c.lineTo(sx + 52, sy - 22); c.closePath(); c.fill();
    c.strokeStyle = shadow; c.lineWidth = 6;
    c.beginPath(); c.moveTo(sx + 6, sy - 62); c.lineTo(sx + 74, sy - 56); c.moveTo(sx + 36, sy - 98); c.lineTo(sx + 44, sy - 20); c.stroke();
    c.restore();
    return hy;
  }

  function fuWord(c, w, t) {
    const u = E.outX(seg(t, w.t, w.t + 0.24));
    if (u <= 0) return;
    const fnt = `${w.st || ''} ${w.w} ${w.size || 100}px ${w.f}`, d = (1 - u) * 900, sc = 1 + (1 - u) * 0.4;
    const draw = (ox, oy, col, a) => {
      c.save(); c.translate(w.x + ox, w.y + oy); c.rotate(w.rot); c.scale(sc, sc); c.globalAlpha = a;
      if (w.grow) {
        // the noise swells: each letter bigger than the last
        let x = 0;
        [...w.s].forEach((ch, i) => { const sz = lerp(w.grow[0], w.grow[1], i / (w.s.length - 1)); c.font = `400 ${sz}px ${w.f}`; text(c, ch, x, 0, { font: w.f, size: sz, color: col }); x += c.measureText(ch).width + 4; });
      } else text(c, w.s, 0, 0, { font: w.f, weight: w.w, style: w.st, size: w.size, color: col, align: w.align || 'left' });
      c.restore();
    };
    if (u < 1) for (let k = 4; k >= 1; k--) draw(w.dx * (d + k * 60 * (1 - u)), w.dy * (d + k * 60 * (1 - u)), w.col, 0.12);
    draw(w.dx * d, w.dy * d, w.col, 1);
  }

  function fuMachine(c, t, st) {
    c.drawImage(st.paper, 0, 0);
    const tx = FU_TX(t), v = (FU_TX(t) - FU_TX(t - 0.03)) / 0.03, sp = clamp(-v / 4000);
    const fx = FU_FX(t), fv = clamp((FU_FX(t) - FU_FX(t - 0.05)) / 0.05 / 700);
    const energy = t < FU_T.trainEnd ? 0.35 + sp * 0.65 : t < FU_T.words ? 0.4 + fv * 0.4 : 0.55;
    // interpenetrating planes, sheared slowly by the motion
    c.save(); c.globalCompositeOperation = 'multiply';
    st.planes.forEach((P, i) => {
      const a = P.a + t * P.w, k = 1 + 0.15 * Math.sin(t * 0.9 + i);
      c.fillStyle = P.col; c.globalAlpha = 0.28 + 0.2 * energy;
      c.beginPath(); P.v.forEach(([r, b], j) => { const x = P.x + Math.cos(a + b) * r * k - (t - 3) * P.dr, y = P.y + Math.sin(a + b) * r * 0.7; j ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.fill();
    });
    c.restore();
    // linee-forza: rays from the vanishing point at the left
    c.save();
    st.rays.forEach((R, i) => {
      const a = R.a + 0.02 * Math.sin(t * 2 + i), w = R.w * (0.6 + energy);
      c.fillStyle = R.red ? rgba(FU.red, 0.45 * energy + 0.1) : rgba(FU.ink, 0.3 * energy + 0.06);
      c.beginPath(); c.moveTo(-300, 560); c.lineTo(-300 + Math.cos(a - w) * 2600, 560 + Math.sin(a - w) * 2600); c.lineTo(-300 + Math.cos(a + w) * 2600, 560 + Math.sin(a + w) * 2600); c.closePath(); c.fill();
    });
    // Balla's speed arcs
    c.lineWidth = 6;
    for (let k = 0; k < 6; k++) {
      c.strokeStyle = rgba(k % 2 ? FU.steel : FU.ink, 0.25 + 0.2 * energy);
      const r0 = 700 + k * 120, a0 = -PI * 0.92 + ((t * 0.5 + k * 0.13) % 0.4);
      c.beginPath(); c.arc(1100, 1500, r0, a0, a0 + 0.55 + energy * 0.2); c.stroke();
    }
    c.restore();
    // rails (cleared away when the words take the page)
    const ra = 1 - seg(t, FU_T.words, FU_T.words + 0.4);
    c.fillStyle = rgba(FU.ink, ra); c.fillRect(0, 842, 1920, 8);
    for (let x = -40; x < 1960 && ra > 0; x += 70) { c.fillStyle = rgba(FU.ink, 0.5 * ra); c.beginPath(); c.moveTo(x, 850); c.lineTo(x + 26, 850); c.lineTo(x - 30, 900); c.lineTo(x - 56, 900); c.closePath(); c.fill(); }

    if (t >= FU_T.train && t < FU_T.trainEnd + 0.2) {
      // smoke shredded behind the chimney
      for (let te = FU_T.train; te <= Math.min(t, FU_T.trainEnd); te += 0.07) {
        const age = t - te; if (age > 1.6) continue;
        const px = FU_TX(te) + 115 * 1.25 + age * 140, py = 842 - 350 * 1.25 - age * 170, r = 26 + age * 120;
        c.fillStyle = rgba(Math.round(te * 14) % 2 ? FU.grey : FU.ochre, 0.4 * (1 - age / 1.6));
        c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill();
      }
      // the train and its echoes: one body per exposure
      const gap = clamp(-v * 0.05, 30, 230), cols = [FU.orange, FU.ochre, FU.steel, FU.red, FU.steel, FU.ochre];
      for (let k = 6; k >= 1; k--) fuLoco(c, tx + k * gap, 842, 1.25, -tx / 66 + k * 0.3, cols[k - 1], 0.5 * (1 - k / 7));
      fuLoco(c, tx, 842, 1.25, -tx / 66, FU.navy, 1);
    }
    if (t >= FU_T.fig) {
      const fa = seg(t, FU_T.fig, FU_T.fig + 0.25) * (1 - 0.85 * E.ioS(seg(t, FU_T.words + 0.3, FU_T.band)));
      // chronophotography: the same body at earlier instants, each a flat tint
      const tints = [FU.red, FU.orange, FU.ochre, FU.steel, FU.ink];
      for (let k = 5; k >= 1; k--) { const tt = t - k * 0.11, x = FU_FX(tt); if (tt < FU_T.fig) continue; fuFigure(c, x, 842, x / 230 * PI, fa * (0.34 - k * 0.05), tints[k - 1], 0.8 + fv * 0.5); }
      const bg = c.createLinearGradient(fx - 200, 0, fx + 140, 0);
      bg.addColorStop(0, '#2e1b0d'); bg.addColorStop(0.45, '#8a5a2b'); bg.addColorStop(0.78, '#d8a55a'); bg.addColorStop(1, '#f2d08a');
      fuFigure(c, fx, 842, fx / 230 * PI, fa, bg, 0.8 + fv * 0.5);
    }
    // words in freedom
    FU_W.forEach(w => fuWord(c, w, t));
    if (t >= FU_T.words) {
      // typographic rules thrown across the page
      const u = E.outX(seg(t, FU_T.words + 0.5, FU_T.words + 0.8));
      c.strokeStyle = FU.ink; c.lineWidth = 5;
      [[150, 520, 900, 470], [1000, 430, 1840, 470], [1240, 1040, 1860, 1010]].forEach(([x0, y0, x1, y1]) => { c.beginPath(); c.moveTo(x0, y0); c.lineTo(lerp(x0, x1, u), lerp(y0, y1, u)); c.stroke(); });
    }
    if (t >= FU_T.band) {
      // the title band: a black diagonal with the name leaning forward on it
      const b = E.outX(seg(t, FU_T.band, FU_T.band + 0.3));
      c.save(); c.translate(960, 640); c.rotate(-0.06);
      c.fillStyle = FU.ink; c.fillRect(-1150, -138, 2300 * b, 276);
      c.fillStyle = FU.red; c.fillRect(-1150, 128, 2300 * b, 10);
      const u = E.outX(seg(t, FU_T.title, FU_T.title + 0.28));
      if (u > 0) {
        const off = (1 - u) * 1400;
        for (let k = 6; k >= 0; k--) {
          c.save(); c.translate(off - k * 46 * (0.25 + 0.75 * (1 - u * 0.6)), 0); c.transform(1, 0, -0.28, 1, 0, 0);
          text(c, 'FUTURISM', 0, 64, { font: FU_F.A, size: 220, align: 'center', ls: 6, color: k ? rgba([FU.orange, FU.ochre, FU.steel][k % 3], 0.35 - k * 0.04) : FU.red });
          c.restore();
        }
      }
      const s = E.ioS(seg(t, FU_T.sub, FU_T.sub + 0.4));
      if (s > 0) text(c, 'SPEED · MACHINES · DYNAMISM', (1 - s) * -60, 112, { font: FU_F.C, weight: 700, size: 32, color: rgba(FU.cream, s), align: 'center', ls: 8 });
      c.restore();
    }
  }

  MG.film({
    id: 'futurism', dur: 10, poster: 9.5,
    fonts: [['400 220px Anton', 'FUTURISMZANGTUMBOOM'], ['italic 900 170px "Bodoni Moda"', 'TUMB 1909'], ['700 58px "Bodoni Moda"', 'VELOCITY = FORCE'], ['400 150px "Archivo Black"', 'SPEED + + +'], ['700 64px "Courier Prime"', 'TRRRRRR SPEED · MACHINES · DYNAMISM']],
    meta: {
      family: 'A', name: 'Futurism', sub: 'Speed, Noise and the Machine', era: '1909 — 1944',
      origin: 'Italian Futurism began with F. T. Marinetti’s founding manifesto on the front page of Le Figaro on 20 February 1909, which declared a roaring motor car more beautiful than the Victory of Samothrace. Painters and sculptors such as Giacomo Balla, Umberto Boccioni, Gino Severini and Carlo Carrà borrowed the multiple exposures of Marey’s and Muybridge’s chronophotography to paint motion itself, Luigi Russolo built noise machines, and Marinetti blew the printed page apart into words-in-freedom.',
      works: 'Manifesto of Futurism (F. T. Marinetti, Le Figaro, 1909) · Dynamism of a Dog on a Leash (Giacomo Balla, 1912) · Unique Forms of Continuity in Space (Umberto Boccioni, 1913) · The Art of Noises (Luigi Russolo, 1913) · Zang Tumb Tuuum (Marinetti, 1914)',
      tech: ['Chronophotographic echoes', 'Force-line rays and planes', 'Words-in-freedom slams'],
      accent: '#d22a1c',
      motionDNA: 'Motion is shown as many instants at once: limbs fan into a dozen positions, a train drags a wake of its own earlier bodies, a striding figure leaves ghost copies, rays and arcs speed up with the subject, and words fly in on diagonals and land with a jolt.',
      visualDNA: 'Cream paper splintered by translucent orange, ochre and steel-blue planes and black-and-red force lines; dark machine silhouettes, burnished bronze, and a typographic free-for-all of condensed grotesques, Bodoni italics and typewriter capitals at every size and angle.',
      transitions: 'Needle-bundle wipe, train rush-through, figure stride-in, word slams from every side, black diagonal title band',
      implementation: ['Oil on canvas, bronze and letterpress', 'After Effects echo and directional blur', 'Canvas 2D (time-offset re-draws)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const W = 1920, H = 1080, r = rng(1909);
      const paper = offscreen(W, H), g = paper.getContext('2d');
      g.fillStyle = FU.paper; g.fillRect(0, 0, W, H);
      for (let k = 0; k < 7000; k++) { g.fillStyle = r() < 0.6 ? `rgba(90,70,40,${0.04 + r() * 0.07})` : `rgba(255,252,240,${0.12 + r() * 0.2})`; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 1.5); }
      const planes = Array.from({ length: 9 }, (_, i) => ({
        x: 200 + r() * 1600, y: 150 + r() * 700, a: r() * TAU, w: (r() - 0.5) * 0.3, dr: 20 + r() * 50,
        col: [FU.orange, FU.ochre, FU.steel, '#e8b9a0', FU.ochre, FU.steel, FU.orange, '#b9c3c9', FU.red][i],
        v: Array.from({ length: 3 + (i % 2) }, (_, j) => [220 + r() * 380, j / (3 + (i % 2)) * TAU + r() * 0.8]),
      }));
      const rays = Array.from({ length: 26 }, (_, i) => ({ a: lerp(-0.36, 0.36, i / 25) + (r() - 0.5) * 0.02, w: 0.003 + r() * 0.012, red: i % 4 === 1 }));
      const needles = Array.from({ length: 11 }, (_, i) => ({ y: lerp(-40, 1120, i / 10) + (r() - 0.5) * 60, h: 30 + r() * 110, len: 500 + r() * 900, lag: r() * 260, col: [FU.red, FU.ink, FU.orange][i % 3] }));
      return { paper, planes, rays, needles };
    },
    draw(c, t, W, H, st) {
      // camera jolts each time a word lands
      let sh = 0;
      FU_W.forEach(w => { if (t > w.t + 0.2) sh += 12 * Math.exp(-(t - w.t - 0.2) * 14); });
      if (t > FU_T.title + 0.25) sh += 18 * Math.exp(-(t - FU_T.title - 0.25) * 10);
      c.fillStyle = FU.paper; c.fillRect(0, 0, W, H);
      c.save(); c.translate(vnoise(t * 40, 3) * sh, vnoise(t * 40, 9) * sh);
      if (t < FU_T.wipe) fuDog(c, t);
      else if (t >= FU_T.wipeEnd) fuMachine(c, t, st);
      else {
        // the needle-bundle wipe: the machine age is revealed to the right of the slash
        const X = lerp(2300, -500, E.ioC(seg(t, FU_T.wipe, FU_T.wipeEnd))), edge = y => X + (y - 540) * 0.3;
        c.save(); c.beginPath(); c.moveTo(-60, -60); c.lineTo(edge(-60), -60); c.lineTo(edge(1140), 1140); c.lineTo(-60, 1140); c.closePath(); c.clip(); fuDog(c, t); c.restore();
        c.save(); c.beginPath(); c.moveTo(edge(-60), -60); c.lineTo(1980, -60); c.lineTo(1980, 1140); c.lineTo(edge(1140), 1140); c.closePath(); c.clip(); fuMachine(c, t, st); c.restore();
        st.needles.forEach(N => {
          const x = edge(N.y) - 160 + N.lag;
          c.fillStyle = N.col;
          c.beginPath(); c.moveTo(x - 120, N.y); c.lineTo(x + N.len, N.y - N.h / 2); c.lineTo(x + N.len, N.y + N.h / 2); c.closePath(); c.fill();
        });
      }
      c.restore();
      vignette(c, W, H, 0.28, '40,25,10');
      grain(c, W, H, t, 0.06, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.8;
      // the dog: a trotting tick-tock, the chain jingling, an ululating intonarumori underneath
      for (let k = 0; k < 11; k++) { const t = 0.1 + k * 0.21; A.noise(t, { type: 'bandpass', f: k % 2 ? 2400 : 1700, q: 4, dur: 0.03, g: 0.07, pan: k % 2 ? 0.3 : -0.3 }); }
      for (let k = 0; k < 8; k++) A.noise(0.3 + k * 0.29, { type: 'highpass', f: 6500, dur: 0.06, g: 0.025, pan: 0.5 });
      A.osc(0.05, { type: 'sawtooth', f: 82, f2: 110, glide: 2.4, dur: 2.5, g: 0.05, lp: 500, vib: [6, 8], hold: true, rel: 0.2 });
      A.pluck(0.1, midi(45), { dur: 1, g: 0.25, bright: 0.4 }); A.pluck(1.3, midi(47), { dur: 1, g: 0.25, bright: 0.4 });
      // the needle wipe
      A.whoosh(FU_T.wipe - 0.05, 0.55, { f1: 200, f2: 5000, g: 0.28, pan: -0.3 });
      // the train: chugs that accelerate, a steam whistle, the rumble and doppler drop as it passes
      for (let t = FU_T.train, p = 0.26; t < FU_T.trainEnd - 0.1; t += p, p = Math.max(0.085, p * 0.9)) {
        A.noise(t, { type: 'bandpass', f: 520, q: 1.2, dur: Math.min(0.14, p * 0.7), g: 0.17 });
        A.osc(t, { f: 70, f2: 45, glide: 0.08, dur: 0.12, g: 0.18 });
      }
      A.noise(FU_T.train, { type: 'lowpass', f: 180, f2: 420, dur: 2.2, g: 0.2, swell: 0.6 });
      A.chord(3.5, [74, 78], { type: 'triangle', dur: 0.75, g: 0.05, a: 0.04, vib: [5.5, 6], hold: true, rel: 0.15, rev: 0.4 });
      A.osc(4.45, { type: 'sawtooth', f: 330, f2: 180, glide: 0.6, dur: 0.65, g: 0.05, lp: 1400 });
      A.whoosh(4.55, 0.6, { f1: 2500, f2: 300, g: 0.25, pan: -0.6 });
      // the striding bronze: a footfall per step, struck metal on each, a machine drone climbing
      let prev = Math.floor(FU_FX(FU_T.fig) / 230);
      for (let t = FU_T.fig; t < FU_T.figEnd; t += 0.02) {
        const k = Math.floor(FU_FX(t) / 230);
        if (k !== prev) { prev = k; A.kick(t, 0.45, { f: 110, f2: 45 }); A.bell(t, midi(k % 2 ? 45 : 40), { g: 0.04, dur: 0.9, ratios: [1, 2.13, 3.71, 5.29] }); }
      }
      A.osc(FU_T.fig, { type: 'sawtooth', f: 55, f2: 110, glide: 2.4, dur: 2.4, g: 0.06, lp: 400, lp2: 1800, lpT: 2.4, hold: true, rel: 0.2 });
      A.osc(FU_T.fig, { type: 'square', f: 82.4, f2: 165, glide: 2.4, dur: 2.4, g: 0.025, lp: 900, hold: true, rel: 0.2, detune: 8 });
      // words in freedom: each word its own noise
      const W = FU_W.map(w => w.t + 0.2);
      A.snare(W[0], 0.4, { rev: 0.25 }); A.osc(W[0], { type: 'square', f: 880, f2: 1320, glide: 0.04, dur: 0.18, g: 0.04 });
      A.kick(W[1], 0.85);
      A.osc(W[2], { type: 'sawtooth', f: 90, f2: 55, glide: 0.7, dur: 0.75, g: 0.1, lp: 900 }); A.kick(W[2], 0.5);
      A.impact(W[3], 0.6);
      A.hat(W[4], 0.1); A.hat(W[4] + 0.06, 0.1); A.hat(W[4] + 0.12, 0.1);
      A.whoosh(W[5] - 0.2, 0.3, { f1: 400, f2: 4000, g: 0.2 }); A.clap(W[5], 0.3);
      A.noise(W[6], { type: 'bandpass', f: 1200, q: 2, dur: 0.12, g: 0.12 });
      for (let k = 0; k < 9; k++) A.noise(W[7] + k * 0.035, { type: 'bandpass', f: 2600, q: 3, dur: 0.02, g: 0.08, pan: 0.5 });
      A.kick(W[8], 0.6); A.snare(W[8], 0.25);
      // the title lands: a slam and a held, grinding chord of noise intoners
      A.whoosh(FU_T.band - 0.1, 0.35, { f1: 300, f2: 5000, g: 0.25 });
      A.impact(FU_T.title + 0.25, 0.85);
      [33, 40, 45, 52].forEach((m, i) => A.osc(FU_T.title + 0.25, { type: 'sawtooth', f: midi(m), dur: 1.3, g: 0.04, a: 0.01, lp: 2200, lp2: 500, lpT: 1.3, detune: i % 2 ? 9 : -9, rev: 0.35, hold: true, rel: 0.5 }));
      A.noise(FU_T.title + 0.25, { type: 'bandpass', f: 300, q: 0.8, dur: 1.2, g: 0.08, rev: 0.3 });
    },
  });

  /* =====================================================================
     POP ART — the gallery version of the comic panel. We open inside one
     enlarged Ben-Day dot and pull back until it is a cheek in a Lichtenstein
     canvas: a blonde in tears, flat yellow hair, red dots for skin, a blue
     dotted sky; a speech balloon pops up and types its line. A squeegee
     drags the next image down over it: the same face as a Warhol
     silkscreen, flat fluorescent colours under an off-register black
     screen. Print after print is pulled outward from the first until the
     wall is a 7 × 4 grid, each one inked a little differently, and the
     camera backs out into a white gallery with the title on the wall
     ===================================================================== */
  const PO = { ink: '#121212', white: '#fbfaf4', red: '#e2231a', dotR: '#e8423a', yel: '#ffd400', blue: '#1d5fbf', linen: '#efe9dc', wall: '#f3f1ec', floor: '#d6cfc3' };
  // colourways: background, hair, skin, lips, eyeshadow
  const PO_WAYS = [
    ['#ff5fa2', '#ffe600', '#f7a8c8', '#e2231a', '#26c6da'], ['#ff8a00', '#ffe600', '#ff9ccf', '#d0102c', '#3b5bdb'],
    ['#26c6c6', '#ffd400', '#ffb3a7', '#e2231a', '#7a3fc0'], ['#7a3fc0', '#ff8a00', '#ffd1dc', '#ff2d55', '#00b3a4'],
    ['#b5e61d', '#ff4fa3', '#ffe0b2', '#d0102c', '#1d5fbf'], ['#1d5fbf', '#ffd400', '#ff9ccf', '#e2231a', '#ff8a00'],
    ['#e2231a', '#ffe600', '#ffc6d9', '#7a0e1d', '#26c6c6'], ['#c7c9cc', '#ffe600', '#f7a8c8', '#e2231a', '#26c6da'],
  ];
  const PO_T = { zoom: 0.2, zoomEnd: 2.7, balloon: 1.8, type: 2.05, squeegee: 3.2, squeegeeEnd: 3.75, gallery: 7.35, galleryEnd: 8.5, pop: 8.05, art: 8.2, sub: 8.55, label: 8.75 };
  // the face, drawn facing left in a 1000 × 1000 space and mirrored to face right
  const PF = {
    hair: [[330, 330], [350, 170], [500, 80], [690, 100], [830, 220], [890, 400], [905, 600], [875, 800], [810, 960], [700, 1015], [590, 990], [640, 820], [655, 640], [615, 480], [520, 375], [420, 325]],
    face: [[385, 295], [338, 352], [322, 425], [322, 462], [266, 540], [300, 568], [296, 586], [280, 606], [302, 620], [290, 642], [312, 660], [318, 702], [362, 748], [452, 772], [560, 732], [640, 620], [662, 480], [600, 340], [500, 288]],
    neck: [[414, 700], [400, 1030], [612, 1030], [598, 680]],
    fringe: [[372, 298], [326, 336], [300, 392], [336, 372], [386, 346], [456, 334], [530, 356], [488, 298], [430, 284]],
    shadow: [[342, 410], [400, 386], [466, 394], [452, 440], [404, 448], [356, 446]],
    lips: [[282, 606], [306, 595], [328, 602], [340, 612], [328, 628], [302, 640], [290, 636], [298, 622]],
    hairDark: [[640, 820], [655, 640], [615, 480], [700, 520], [770, 760], [730, 975], [610, 990]],
    faceDark: [[600, 340], [662, 480], [640, 620], [596, 700], [612, 520], [576, 400]],
    neckDark: [[452, 772], [560, 732], [598, 690], [604, 830], [470, 800]],
    hairLines: [[[520, 120], [770, 280], [830, 520]], [[620, 150], [850, 380], [860, 700]], [[700, 420], [780, 700], [700, 960]], [[460, 110], [660, 190], [760, 420]], [[790, 640], [810, 820], [750, 980]]],
  };
  const PO_COLS = 7, PO_ROWS = 4, PO_CELL = 270, PO_GX = 15;
  const poCellT = (i, j) => { const d = Math.max(Math.abs(i - 3), Math.abs(j - 1)); return d === 0 ? PO_T.squeegee : [0, 4.4, 5.25, 5.95][d] + hash(i * 7.1 + j * 13.3) * 0.45; };

  function poTear(g, x, y, s) {
    g.beginPath(); g.moveTo(x, y - 48 * s); g.quadraticCurveTo(x + 18 * s, y - 14 * s, x + 16 * s, y + 2 * s);
    g.arc(x, y + 2 * s, 16 * s, 0, PI); g.quadraticCurveTo(x - 18 * s, y - 14 * s, x, y - 48 * s); g.closePath();
  }
  // The black key: outlines, brows, lashes, tears. heavy = Warhol's photographic shadows as well.
  function poKey(g, heavy) {
    g.strokeStyle = PO.ink; g.fillStyle = PO.ink; g.lineJoin = 'round'; g.lineCap = 'round';
    if (heavy) { ['hairDark', 'faceDark', 'neckDark'].forEach(k => { smooth(g, PF[k]); g.fill(); }); }
    g.lineWidth = heavy ? 16 : 12;
    smooth(g, PF.hair); g.stroke();
    g.beginPath(); g.moveTo(412, 762); g.lineTo(400, 1030); g.moveTo(598, 700); g.lineTo(612, 1030); g.stroke(); smooth(g, PF.face); g.stroke(); smooth(g, PF.fringe); g.stroke();
    g.lineWidth = heavy ? 14 : 9;
    PF.hairLines.forEach(([a, b, d]) => { g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(b[0], b[1], d[0], d[1]); g.stroke(); });
    g.lineWidth = 16; g.beginPath(); g.moveTo(342, 398); g.quadraticCurveTo(398, 366, 468, 386); g.stroke();
    g.lineWidth = 9; g.beginPath(); g.moveTo(352, 450); g.quadraticCurveTo(400, 472, 448, 446); g.stroke();
    for (let k = 0; k < 6; k++) { const x = 358 + k * 16, y = 455 + Math.sin(k / 5 * PI) * 9; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 4, y + 22); g.stroke(); }
    smooth(g, PF.lips); g.lineWidth = 8; g.stroke();
    g.lineWidth = 5; g.beginPath(); g.moveTo(286, 620); g.quadraticCurveTo(310, 616, 334, 614); g.stroke();
    g.lineWidth = 7; g.beginPath(); g.moveTo(292, 556); g.quadraticCurveTo(306, 546, 316, 560); g.stroke();
    g.lineWidth = 7; poTear(g, 455, 545, 1); g.stroke(); poTear(g, 418, 640, 0.7); g.stroke();
  }
  // Ben-Day dots on a staggered grid within a box: one path, one fill.
  function poDots(g, x0, y0, x1, y1, pitch, rad) {
    g.beginPath();
    const j0 = Math.floor(y0 / pitch) - 1, j1 = Math.ceil(y1 / pitch) + 1;
    for (let j = j0; j <= j1; j++) {
      const off = (j & 1) * pitch / 2, i0 = Math.floor((x0 - off) / pitch) - 1, i1 = Math.ceil((x1 - off) / pitch) + 1;
      for (let i = i0; i <= i1; i++) { const x = i * pitch + off, y = j * pitch; g.moveTo(x + rad, y); g.arc(x, y, rad, 0, TAU); }
    }
    g.fill();
  }
  // The visible region of the canvas in the current user space.
  function poView(g) {
    const m = g.getTransform().inverse(), cv = g.canvas;
    const pts = [[0, 0], [cv.width, 0], [0, cv.height], [cv.width, cv.height]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
    return [Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))];
  }
  const poClipDots = (g, v, box, pitch, rad) => { const x0 = Math.max(v[0], box[0]), y0 = Math.max(v[1], box[1]), x1 = Math.min(v[2], box[2]), y1 = Math.min(v[3], box[3]); if (x1 > x0 && y1 > y0) poDots(g, x0, y0, x1, y1, pitch, rad); };

  // The Lichtenstein canvas, in world coordinates (canvas 110..1810 × 60..1020).
  function poLichtenstein(c, t) {
    const v = poView(c);
    c.fillStyle = PO.wall; c.fillRect(v[0], v[1], v[2] - v[0], v[3] - v[1]);
    c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(124, 76, 1700, 960);
    c.fillStyle = PO.white; c.fillRect(110, 60, 1700, 960);
    c.save(); c.beginPath(); c.rect(110, 60, 1700, 960); c.clip();
    c.fillStyle = '#4f86d8'; poClipDots(c, v, [110, 60, 1810, 1020], 30, 10.5);
    // the face, mirrored to look right toward the balloon
    c.save(); c.translate(150, 60); c.scale(0.96, 0.96); c.translate(1000, 0); c.scale(-1, 1);
    const fv = poView(c);
    smooth(c, PF.hair); c.fillStyle = PO.yel; c.fill();
    poly(c, PF.neck); smooth(c, PF.face, true, false); c.fillStyle = PO.white; c.fill();
    c.save(); poly(c, PF.neck); smooth(c, PF.face, true, false); c.clip();
    c.fillStyle = PO.dotR; poClipDots(c, fv, [250, 280, 680, 1010], 19, 6.2);
    c.restore();
    smooth(c, PF.fringe); c.fillStyle = PO.yel; c.fill();
    smooth(c, PF.shadow); c.fillStyle = PO.blue; c.fill();
    smooth(c, PF.lips); c.fillStyle = PO.red; c.fill();
    poTear(c, 455, 545, 1); c.fillStyle = PO.white; c.fill(); poTear(c, 418, 640, 0.7); c.fill();
    c.fillStyle = '#8fd0ff'; c.beginPath(); c.ellipse(447, 552, 5, 9, 0.3, 0, TAU); c.fill();
    poKey(c, false);
    c.restore();
    // the balloon
    const b = E.outB(seg(t, PO_T.balloon, PO_T.balloon + 0.3));
    if (b > 0) {
      c.save(); c.translate(1250, 470); c.scale(b, b); c.translate(-1250, -470);
      c.fillStyle = PO.white; c.strokeStyle = PO.ink; c.lineWidth = 9; c.lineJoin = 'round';
      c.beginPath(); c.ellipse(1450, 300, 335, 185, 0, 0, TAU);
      c.moveTo(1240, 420); c.quadraticCurveTo(1060, 580, 880, 640); c.quadraticCurveTo(1100, 530, 1320, 460);
      c.fill(); c.stroke();
      c.fillStyle = PO.white; c.beginPath(); c.ellipse(1450, 300, 330, 180, 0, 0, TAU); c.fill();
      const lines = ['I THOUGHT IT WAS', 'A MASTERPIECE...', "IT'S ONLY A PRINT!"];
      let n = Math.floor(seg(t, PO_T.type, PO_T.type + 0.65) * 50);
      lines.forEach((s, i) => { const k = Math.min(s.length, Math.max(0, n)); n -= s.length; if (k > 0) text(c, s.slice(0, k), 1450, 236 + i * 66, { font: '"Patrick Hand SC"', size: 58, color: PO.ink, align: 'center', ls: 1 }); });
      c.restore();
    }
    c.restore();
  }

  function poScreen(c, t, st) {
    c.fillStyle = PO.linen; c.fillRect(PO_GX, 0, PO_COLS * PO_CELL, PO_ROWS * PO_CELL);
    c.drawImage(st.weave, PO_GX, 0, PO_COLS * PO_CELL, PO_ROWS * PO_CELL);
    st.cells.forEach(C => {
      const x = PO_GX + C.i * PO_CELL, y = C.j * PO_CELL, tp = C.tp;
      const centre = C.i === 3 && C.j === 1;
      const uf = centre ? seg(t, PO_T.squeegee, PO_T.squeegeeEnd) : E.ioS(seg(t, tp, tp + 0.32));
      const uk = centre ? uf : E.ioS(seg(t, tp + 0.2, tp + 0.5));
      if (uf <= 0) { c.strokeStyle = 'rgba(120,110,90,0.25)'; c.lineWidth = 1; c.strokeRect(x + 6, y + 6, PO_CELL - 12, PO_CELL - 12); return; }
      c.save(); c.beginPath(); c.rect(x, y, PO_CELL, PO_CELL * uf); c.clip();
      c.drawImage(st.flats[C.way], x + C.fx, y + C.fy, PO_CELL, PO_CELL);
      c.restore();
      if (uk > 0) {
        c.save(); c.beginPath(); c.rect(x, y, PO_CELL, PO_CELL * uk); c.clip();
        c.globalAlpha = C.ink; c.drawImage(st.keys[C.key], x + C.kx, y + C.ky, PO_CELL, PO_CELL);
        c.restore();
      }
      // the little squeegee crossing each screen as it is pulled
      if (!centre && ((uf > 0 && uf < 1) || (uk > 0 && uk < 1))) {
        const yy = y + PO_CELL * (uk > 0 && uk < 1 ? uk : uf);
        c.fillStyle = PO.ink; c.fillRect(x - 6, yy - 5, PO_CELL + 12, 10);
        c.fillStyle = rgba(uk > 0 && uk < 1 ? '#222222' : PO_WAYS[C.way][0], 0.85); c.fillRect(x, yy - 11, PO_CELL, 6);
      }
    });
  }

  function poTitle(st) {
    if (st.title) return st.title;
    const T = offscreen(760, 520), g = T.getContext('2d');
    ['POP', 'ART'].forEach((s, i) => {
      const L = offscreen(760, 260), q = L.getContext('2d'), y = 220;
      text(q, s, 20, y, { font: '"Archivo Black"', size: 220, color: i ? PO.red : PO.yel, ls: 4 });
      q.globalCompositeOperation = 'source-atop'; q.fillStyle = i ? '#ff6b5e' : PO.red; poDots(q, 0, 0, 760, 260, 18, i ? 4 : 5.5);
      q.globalCompositeOperation = 'source-over';
      // an off-register cyan pull behind, the black key on top
      text(g, s, 34, y + 14 + i * 250, { font: '"Archivo Black"', size: 220, color: '#26c6da', ls: 4 });
      g.drawImage(L, 0, i * 250);
      text(g, s, 20, y + i * 250, { font: '"Archivo Black"', size: 220, color: null, stroke: PO.ink, lw: 10, ls: 4 });
    });
    st.title = T;
    return T;
  }

  MG.film({
    id: 'popart', dur: 10, poster: 9.4,
    fonts: [['400 58px "Patrick Hand SC"', "I THOUGHT IT WAS A MASTERPIECE... IT'S ONLY A PRINT!"], ['400 220px "Archivo Black"', 'POPART'], ['700 28px Archivo', 'Ben-Day dots · silkscreen · off-register ink'], ['400 18px Archivo', 'Silkscreen ink and Ben-Day dots on linen 1962–1964']],
    meta: {
      family: 'A', name: 'Pop Art', sub: 'Ben-Day Dots and Silkscreen', era: '1956 — 1970',
      origin: 'Pop Art took mass culture as its subject and mechanical printing as its look: the term came from London’s Independent Group, where Richard Hamilton made his 1956 collage of the consumer home, and in New York Roy Lichtenstein painted enlarged comic panels dot by Ben-Day dot while Andy Warhol silkscreened photographs in repeating grids with flat, off-register colour.',
      works: 'Just what is it that makes today’s homes so different, so appealing? (Richard Hamilton, 1956) · Look Mickey (Roy Lichtenstein, 1961) · Campbell’s Soup Cans (Andy Warhol, 1962) · Marilyn Diptych (Warhol, 1962) · Drowning Girl (Lichtenstein, 1963) · Whaam! (Lichtenstein, 1963)',
      tech: ['Enlarged Ben-Day dots', 'Off-register silkscreen key', 'Serial grid repetition'],
      accent: '#ff4fa3',
      motionDNA: 'Mechanical and serial: a single dot pulls back into a whole painting, a squeegee drags the next image over the last, prints are pulled one after another outward from the first, each with its own slip of registration and ink, and the camera keeps backing away until the image is an object on a gallery wall.',
      visualDNA: 'Primary red, yellow and blue with heavy black outlines and enlarged dot screens for Lichtenstein; fluorescent pink, orange, turquoise, lime and silver flats under a slipped black photo screen for Warhol; repetition in a tight grid, all on raw linen in a white-cube gallery.',
      transitions: 'Pull-back from a single dot, squeegee wipe, print-by-print grid growth, dolly-out to the gallery wall',
      implementation: ['Silkscreen and oil on canvas, stencilled dot screens', 'Illustrator + After Effects halftone and offsets', 'Canvas 2D (pre-printed flats and key, time-staggered pulls)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const r = rng(1962), S = 512;
      const face = (g, fn) => { g.save(); g.scale(S / 1000, S / 1000); g.translate(1000, 0); g.scale(-1, 1); fn(g); g.restore(); };
      // colour flats, cut by hand: each one a little too big and a little off the photo
      const flats = PO_WAYS.map(([bg, hair, skin, lips, shad]) => {
        const F = offscreen(S, S), g = F.getContext('2d');
        g.fillStyle = bg; g.fillRect(0, 0, S, S);
        face(g, q => {
          q.lineJoin = 'round';
          q.save(); q.translate(-10, 6); smooth(q, PF.hair); q.fillStyle = hair; q.fill(); q.lineWidth = 24; q.strokeStyle = hair; q.stroke(); q.restore();
          q.save(); q.translate(14, -8); poly(q, PF.neck); smooth(q, PF.face, true, false); q.fillStyle = skin; q.fill(); q.lineWidth = 14; q.strokeStyle = skin; q.stroke(); q.restore();
          q.save(); q.translate(-6, 10); smooth(q, PF.fringe); q.fillStyle = hair; q.fill(); q.restore();
          q.save(); q.translate(8, -4); smooth(q, PF.shadow); q.fillStyle = shad; q.fill(); q.lineWidth = 18; q.strokeStyle = shad; q.stroke(); q.restore();
          q.save(); q.translate(-8, 10); smooth(q, PF.lips); q.fillStyle = lips; q.fill(); q.lineWidth = 22; q.strokeStyle = lips; q.stroke(); q.restore();
        });
        return F;
      });
      // the black photo screen: clean, under-inked with squeegee streaks, and over-inked
      const keys = [0, 1, 2].map(v => {
        const K = offscreen(S, S), g = K.getContext('2d');
        face(g, q => poKey(q, true));
        if (v === 2) { g.globalAlpha = 0.6; g.drawImage(K, 2, 1); g.drawImage(K, -1, 2); g.globalAlpha = 1; }
        if (v >= 1) {
          g.globalCompositeOperation = 'destination-out';
          for (let k = 0; k < (v === 1 ? 60 : 16); k++) { g.fillStyle = `rgba(0,0,0,${0.2 + r() * (v === 1 ? 0.6 : 0.3)})`; g.fillRect(0, r() * S, S, 1 + r() * 6); }
          if (v === 1) { const lg = g.createLinearGradient(0, 0, S, 0); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = lg; g.fillRect(0, 0, S, S); }
          g.globalCompositeOperation = 'source-over';
        }
        return K;
      });
      const cells = [];
      for (let j = 0; j < PO_ROWS; j++) for (let i = 0; i < PO_COLS; i++) {
        const centre = i === 3 && j === 1;
        cells.push({ i, j, tp: poCellT(i, j), way: centre ? 0 : (i * 3 + j * 5 + ((r() * 3) | 0)) % PO_WAYS.length, key: centre ? 0 : (r() * 3) | 0, ink: 0.82 + r() * 0.18,
          kx: (r() - 0.5) * 22, ky: (r() - 0.5) * 16, fx: (r() - 0.5) * 6, fy: (r() - 0.5) * 6 });
      }
      // raw linen weave for the unprinted canvas
      const weave = offscreen(945, 540), w = weave.getContext('2d');
      for (let y = 0; y < 540; y += 3) { w.fillStyle = `rgba(150,130,100,${0.05 + r() * 0.06})`; w.fillRect(0, y, 945, 1); }
      for (let x = 0; x < 945; x += 3) { w.fillStyle = `rgba(150,130,100,${0.03 + r() * 0.05})`; w.fillRect(x, 0, 1, 540); }
      return { flats, keys, cells, weave };
    },
    draw(c, t, W, H, st) {
      const base = c.getTransform();
      // ---- the Warhol wall (drawn under the squeegee and for everything after it) ----
      const warhol = () => {
        const s = kf(t, [[3.75, 4], [4.45, 4], [5.05, 2.1, E.ioS], [5.85, 1.45, E.ioS], [6.55, 1.0, E.ioS], [PO_T.gallery, 1.0], [PO_T.galleryEnd, 0.5, E.ioC], [10, 0.47, E.lin]]);
        const Fy = 405 + 135 * clamp((4 - s) / 3), G = E.ioC(seg(t, PO_T.gallery, PO_T.galleryEnd));
        const Sx = lerp(960, 1190, G), Sy = lerp(540, 465, G);
        // gallery: white wall, spotlight, floor
        c.fillStyle = PO.wall; c.fillRect(0, 0, W, H);
        if (G > 0) {
          const sp = c.createRadialGradient(Sx, Sy - 80, 50, Sx, Sy, 900); sp.addColorStop(0, 'rgba(255,253,245,1)'); sp.addColorStop(1, 'rgba(225,222,214,1)');
          c.fillStyle = sp; c.fillRect(0, 0, W, H);
          const fy = lerp(1500, 905, G);
          c.fillStyle = '#ffffff'; c.fillRect(0, fy - 18, W, 18);
          const fg = c.createLinearGradient(0, fy, 0, 1080); fg.addColorStop(0, '#cfc7ba'); fg.addColorStop(1, '#b9b0a2');
          c.fillStyle = fg; c.fillRect(0, fy, W, 1080 - fy + 600);
          c.strokeStyle = 'rgba(120,105,85,0.25)'; c.lineWidth = 2;
          for (let k = -20; k < 40; k++) { c.beginPath(); c.moveTo(960 + k * 90, fy); c.lineTo(960 + k * 260, 1080 + (fy - 905)); c.stroke(); }
        }
        c.save(); c.translate(Sx, Sy); c.scale(s, s); c.translate(-960, -Fy);
        if (G > 0) { c.fillStyle = `rgba(40,30,20,${0.22 * G})`; c.fillRect(PO_GX + 22, 26, PO_COLS * PO_CELL, PO_ROWS * PO_CELL); }
        poScreen(c, t, st);
        c.restore();
        // the wall text: title, line and museum label
        if (t >= PO_T.pop) {
          const T = poTitle(st);
          [[0, PO_T.pop], [1, PO_T.art]].forEach(([i, tt]) => {
            const b = E.outB(seg(t, tt, tt + 0.35));
            if (b <= 0) return;
            c.save(); c.translate(110 + 270, 170 + i * 250 + 130); c.scale(b, b); c.translate(-270, -130);
            c.drawImage(T, 0, i * 250, 760, 260, -20, 0, 760, 260);
            c.restore();
          });
          const su = E.ioS(seg(t, PO_T.sub, PO_T.sub + 0.5));
          if (su > 0) {
            text(c, 'Ben-Day dots · silkscreen', 120, 760, { font: 'Archivo', weight: 700, size: 30, color: rgba(PO.ink, su) });
            text(c, 'off-register ink', 120, 800, { font: 'Archivo', weight: 700, size: 30, color: rgba(PO.ink, su) });
          }
          const lu = E.ioS(seg(t, PO_T.label, PO_T.label + 0.5));
          if (lu > 0) {
            c.save(); c.globalAlpha = lu;
            c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(1420, 794, 300, 112); c.fillStyle = '#ffffff'; c.fillRect(1416, 790, 300, 112);
            text(c, 'POP ART', 1434, 822, { font: 'Archivo', weight: 700, size: 20, color: PO.ink, ls: 1 });
            text(c, 'Silkscreen ink and Ben-Day', 1434, 850, { font: 'Archivo', size: 17, color: '#333' });
            text(c, 'dots on linen, 28 panels', 1434, 872, { font: 'Archivo', size: 17, color: '#333' });
            text(c, 'After Lichtenstein & Warhol, 1962–64', 1434, 894, { font: 'Archivo', size: 15, color: '#555' });
            c.restore();
          }
        }
      };
      if (t < PO_T.squeegee) {
        // ---- inside one dot, pulling back to the Lichtenstein canvas ----
        const u = E.ioC(seg(t, PO_T.zoom, PO_T.zoomEnd)), s = Math.exp(lerp(Math.log(16), 0, u));
        const dot = [150 + (1000 - 380) * 0.96, 60 + 570 * 0.96], k = (1 / s - 1 / 16) / (1 - 1 / 16);
        const Fx = lerp(dot[0], 960, k), Fy = lerp(dot[1], 540, k);
        c.save(); c.translate(960, 540); c.scale(s, s); c.translate(-Fx, -Fy);
        poLichtenstein(c, t);
        c.restore();
      } else if (t < PO_T.squeegeeEnd) {
        // ---- the squeegee drags the silkscreen down over the painting ----
        const y = E.ioS(seg(t, PO_T.squeegee, PO_T.squeegeeEnd)) * 1080;
        c.save(); poLichtenstein(c, t); c.restore();
        c.save(); c.beginPath(); c.rect(0, 0, W, y); c.clip(); warhol(); c.restore();
        c.setTransform(base);
        c.fillStyle = rgba(PO_WAYS[0][0], 0.9); c.fillRect(0, y - 4, W, 18);
        c.fillStyle = '#1b1b1b'; c.fillRect(-20, y - 26, W + 40, 26);
        c.fillStyle = '#5a4630'; c.fillRect(-20, y - 70, W + 40, 44);
        c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(-20, y - 68, W + 40, 6);
      } else warhol();
      grain(c, W, H, t, 0.04, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.8;
      // inside the dot: a dreamy girl-group organ and vibraphone
      A.chord(0.05, [53, 57, 60, 64], { type: 'triangle', dur: 1.6, g: 0.04, a: 0.4, hold: true, rel: 0.5, spread: 5, width: 0.5, rev: 0.4 });
      A.chord(1.6, [50, 53, 57, 60], { type: 'triangle', dur: 1.6, g: 0.04, a: 0.3, hold: true, rel: 0.4, spread: 5, width: 0.5, rev: 0.4 });
      [[0.3, 76], [0.75, 77], [1.2, 79], [1.65, 81], [2.1, 79], [2.55, 76]].forEach(([t, m]) => A.bell(t, midi(m), { g: 0.04, dur: 1.2, ratios: [1, 4, 10], rev: 0.5 }));
      A.pluck(0.05, midi(41), { dur: 1.6, g: 0.3, bright: 0.3, lp: 900 }); A.pluck(1.6, midi(38), { dur: 1.6, g: 0.3, bright: 0.3, lp: 900 });
      // the balloon pops up, the line types
      A.osc(PO_T.balloon, { f: 280, f2: 950, glide: 0.09, dur: 0.14, g: 0.07 }); A.noise(PO_T.balloon, { type: 'bandpass', f: 2000, q: 2, dur: 0.03, g: 0.08 });
      for (let k = 0; k < 13; k++) A.noise(PO_T.type + k * 0.05, { type: 'bandpass', f: 3200 + (k % 3) * 400, q: 4, dur: 0.012, g: 0.04 });
      A.chord(2.7, [48, 55, 60, 64, 67], { type: 'triangle', dur: 0.6, g: 0.035, a: 0.05, rev: 0.4 });
      // the squeegee: a long rubbery drag and the screen frame lifting
      A.noise(PO_T.squeegee, { type: 'bandpass', f: 1800, f2: 300, q: 1.6, dur: 0.55, g: 0.16, swell: 0.4 });
      A.osc(PO_T.squeegee, { type: 'sawtooth', f: 90, f2: 60, glide: 0.55, dur: 0.55, g: 0.03, lp: 400 });
      A.kick(PO_T.squeegeeEnd, 0.6); A.noise(PO_T.squeegeeEnd, { type: 'bandpass', f: 900, q: 2, dur: 0.06, g: 0.12 });
      // the Factory: a driving eighth-note groove while the prints multiply
      const b = 0.25, roots = [36, 36, 41, 43];
      for (let k = 0; k * b < PO_T.gallery - PO_T.squeegeeEnd; k++) {
        const t = PO_T.squeegeeEnd + k * b, bar = Math.floor(k / 8) % 4;
        A.pluck(t, midi(roots[bar] + (k % 2 ? 12 : 0)), { dur: 0.3, g: 0.22, bright: 0.45, lp: 1200 });
        A.hat(t + b / 2, 0.035);
        if (k % 4 === 0) A.kick(t, 0.5);
        if (k % 4 === 2) A.snare(t, 0.18, { rev: 0.1 });
        if (k % 8 === 0) A.chord(t, [roots[bar] + 24, roots[bar] + 28, roots[bar] + 31].map(m => (bar === 2 ? m - 1 + 1 : m)), { type: 'square', dur: 0.2, g: 0.018, lp: 2400, a: 0.004 });
      }
      // one squeegee swish per print
      for (let j = 0; j < PO_ROWS; j++) for (let i = 0; i < PO_COLS; i++) {
        if (i === 3 && j === 1) continue;
        const tp = poCellT(i, j);
        A.noise(tp, { type: 'bandpass', f: 1500, f2: 500, q: 1.5, dur: 0.3, g: 0.035, swell: 0.4, pan: (i - 3) / 4 });
        A.noise(tp + 0.5, { type: 'bandpass', f: 700, q: 3, dur: 0.02, g: 0.04, pan: (i - 3) / 4 });
      }
      // dolly out into the gallery: the groove thins, a hush of room tone, the wall text pops
      A.whoosh(PO_T.gallery, 1.1, { f1: 3000, f2: 300, g: 0.12, rev: 0.4 });
      A.noise(PO_T.gallery, { type: 'lowpass', f: 400, dur: 2.6, g: 0.03, swell: 0.3 });
      A.osc(PO_T.pop, { f: 300, f2: 1100, glide: 0.08, dur: 0.14, g: 0.07 }); A.kick(PO_T.pop, 0.4, { f: 120, f2: 60 });
      A.osc(PO_T.art, { f: 360, f2: 1300, glide: 0.08, dur: 0.14, g: 0.07 }); A.kick(PO_T.art, 0.4, { f: 120, f2: 60 });
      A.chord(PO_T.sub, [48, 52, 55, 60, 64, 67, 72], { type: 'triangle', dur: 1.4, g: 0.035, a: 0.02, hold: true, rel: 0.8, spread: 6, width: 0.7, rev: 0.6 });
      A.bell(PO_T.sub, midi(84), { g: 0.05, dur: 1.4, rev: 0.6 }); A.bell(PO_T.label, midi(91), { g: 0.03, dur: 1.2, rev: 0.6, pan: 0.5 });
      A.pluck(PO_T.sub, midi(36), { dur: 1.4, g: 0.35, bright: 0.3, lp: 700 });
    },
  });

})();
