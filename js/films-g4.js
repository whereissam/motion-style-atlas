/* batch g4 — Analog & Cinematic: Object Stop Motion · Hyperlapse · High Contrast. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Permanent+Marker&family=Oswald:wght@300;600&family=IBM+Plex+Mono:wght@500;600&family=Anton&display=block');
  const PI = Math.PI;

  /* =====================================================================
     OBJECT STOP MOTION — an overhead tabletop shot on twos: a frying pan
     shuffles into frame, sticky notes flutter up as the gas flame, a golf
     ball hops in and cracks into a paper egg with a button yolk, beads
     sizzle, a pepper mill grinds, the egg is flipped onto a plate of cork
     toast and ribbon bacon, the flame folds away, and Scrabble tiles hop
     in to spell the title
     ===================================================================== */
  const OB = { pan: 0.08, fire: 0.75, ball: 1.55, crack: 2.3, white: 2.42, yolk: 2.84, shells: 3.1, pepper: 3.95, plate: 5.0, toast: 5.3, bacon: 5.5, flip: 6.0, land: 6.6, cut: 6.75, off: 7.0, tiles: 7.4, tape: 8.85 };
  const OBF = '"Archivo Black", "Arial Black", sans-serif', OBM = '"Permanent Marker", "Comic Sans MS", cursive';
  const OB_PAN = { x: 600, y: 440, r: 232, rim: 262 }, OB_PLATE = { x: 1385, y: 420, r: 250 };
  const OB_EGG = { x: 610, y: 450 }, OB_EGG2 = { x: 1395, y: 480 };
  const OB_TILES = 'OBJECT STOP MOTION', OB_PTS = { O: 1, B: 3, J: 8, E: 1, C: 3, T: 1, S: 1, P: 3, M: 3, I: 1, N: 1 };
  // A thing that has been nudged by hand between exposures never lands in quite the same place.
  const obJit = (f, k, a = 1) => [(hash(f * 7.13 + k * 13.7) - 0.5) * 2 * a, (hash(f * 3.31 + k * 29.1) - 0.5) * 2 * a, (hash(f * 5.7 + k * 3.9) - 0.5) * 0.012 * a];
  function obShadow(g, blur, dx, dy, a) { g.shadowColor = `rgba(38,18,4,${a})`; g.shadowBlur = blur; g.shadowOffsetX = dx; g.shadowOffsetY = dy; }
  function obFlat(g) { g.shadowColor = 'rgba(0,0,0,0)'; g.shadowBlur = 0; g.shadowOffsetX = 0; g.shadowOffsetY = 0; }

  // The tabletop: oiled pine planks under a soft overhead key from the top left.
  function obTable() {
    const cv = offscreen(1920, 1080), g = cv.getContext('2d'), r = rng(1907);
    const PH = 216;
    for (let p = 0; p * PH < 1080; p++) {
      const y0 = p * PH, base = [176 + r() * 26, 118 + r() * 18, 70 + r() * 12];
      g.fillStyle = `rgb(${base[0] | 0},${base[1] | 0},${base[2] | 0})`; g.fillRect(0, y0, 1920, PH);
      // long grain lines, waving around the occasional knot
      const kx = r() * 1920, ky = y0 + 40 + r() * (PH - 80);
      for (let k = 0; k < 46; k++) {
        const yy = y0 + r() * PH, a = 0.05 + r() * 0.12, w = 1 + r() * 3;
        g.strokeStyle = r() < 0.5 ? `rgba(90,48,18,${a})` : `rgba(240,200,140,${a * 0.7})`; g.lineWidth = w;
        g.beginPath();
        for (let x = 0; x <= 1920; x += 40) {
          const d = Math.max(0, 1 - Math.hypot(x - kx, (yy - ky) * 2) / 260);
          const y = yy + Math.sin(x * 0.004 + k) * 3 + (yy < ky ? -1 : 1) * d * d * 40;
          x ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.stroke();
      }
      g.fillStyle = 'rgba(80,40,14,0.5)'; g.beginPath(); g.ellipse(kx, ky, 22, 12, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(80,40,14,0.35)'; g.lineWidth = 3; g.beginPath(); g.ellipse(kx, ky, 36, 20, 0, 0, TAU); g.stroke();
      // the seam between planks
      g.fillStyle = 'rgba(50,24,8,0.75)'; g.fillRect(0, y0 + PH - 4, 1920, 4);
      g.fillStyle = 'rgba(255,220,170,0.18)'; g.fillRect(0, y0 + PH, 1920, 2);
    }
    const lg = g.createRadialGradient(560, 260, 100, 760, 460, 1500);
    lg.addColorStop(0, 'rgba(255,236,200,0.28)'); lg.addColorStop(0.5, 'rgba(255,220,170,0)'); lg.addColorStop(1, 'rgba(30,12,0,0.45)');
    g.fillStyle = lg; g.fillRect(0, 0, 1920, 1080);
    return cv;
  }
  // Sprites for the props that do not change shape: golf ball, button, cork, plate, pepper mill.
  function obSprites() {
    const r = rng(2008), S = {};
    // golf ball: dimples in a staggered grid, shaded as a sphere
    S.ball = offscreen(120, 120); let g = S.ball.getContext('2d');
    let gr = g.createRadialGradient(46, 44, 4, 60, 60, 54); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.7, '#e8e6e0'); gr.addColorStop(1, '#b4b0a6');
    g.fillStyle = gr; g.beginPath(); g.arc(60, 60, 52, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(60, 60, 52, 0, TAU); g.clip();
    for (let y = 8; y < 116; y += 11) for (let x = 8 + (y % 22 ? 5 : 0); x < 116; x += 11) {
      const d = Math.hypot(x - 60, y - 60) / 52; if (d > 1) continue;
      g.fillStyle = `rgba(120,116,104,${0.18 + d * 0.25})`; g.beginPath(); g.ellipse(x, y, 3.6 * (1 - d * 0.4), 3.6, Math.atan2(y - 60, x - 60), 0, TAU); g.fill();
    }
    g.restore();
    // the yolk: a big yellow sewing button with four holes
    S.button = offscreen(150, 150); g = S.button.getContext('2d');
    gr = g.createRadialGradient(60, 56, 6, 75, 75, 70); gr.addColorStop(0, '#ffd640'); gr.addColorStop(0.8, '#f2a810'); gr.addColorStop(1, '#c87a06');
    g.fillStyle = gr; g.beginPath(); g.arc(75, 75, 68, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(150,80,0,0.55)'; g.lineWidth = 5; g.beginPath(); g.arc(75, 75, 50, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(255,240,170,0.6)'; g.lineWidth = 3; g.beginPath(); g.arc(75, 75, 64, 3.6, 5.2); g.stroke();
    [[-15, -15], [15, -15], [-15, 15], [15, 15]].forEach(([x, y]) => { g.fillStyle = '#8a4a02'; g.beginPath(); g.arc(75 + x, 75 + y, 8, 0, TAU); g.fill(); g.fillStyle = 'rgba(60,30,0,0.8)'; g.beginPath(); g.arc(76 + x, 77 + y, 5, 0, TAU); g.fill(); });
    // the toast: a cork coaster
    S.cork = offscreen(200, 200); g = S.cork.getContext('2d');
    MG.rrect(g, 6, 6, 188, 188, 26); g.fillStyle = '#c08a52'; g.fill(); g.save(); g.clip();
    for (let k = 0; k < 900; k++) { const v = r(); g.fillStyle = v < 0.5 ? `rgba(110,64,28,${0.2 + r() * 0.4})` : `rgba(236,196,140,${0.2 + r() * 0.4})`; g.fillRect(r() * 200, r() * 200, 1 + r() * 4, 1 + r() * 3); }
    g.strokeStyle = 'rgba(100,56,20,0.6)'; g.lineWidth = 14; MG.rrect(g, 6, 6, 188, 188, 26); g.stroke();
    g.restore();
    // the plate
    S.plate = offscreen(540, 540); g = S.plate.getContext('2d');
    gr = g.createRadialGradient(240, 230, 40, 270, 270, 262); gr.addColorStop(0, '#fbfbf8'); gr.addColorStop(0.68, '#eceae4'); gr.addColorStop(0.74, '#dcd8d0'); gr.addColorStop(0.8, '#f8f6f2'); gr.addColorStop(1, '#cfcac0');
    g.fillStyle = gr; g.beginPath(); g.arc(270, 270, 255, 0, TAU); g.fill();
    g.strokeStyle = '#3a6aa8'; g.lineWidth = 5; g.beginPath(); g.arc(270, 270, 236, 0, TAU); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.arc(270, 270, 226, 0, TAU); g.stroke();
    // pepper mill seen from above: walnut crown and a steel finial
    S.mill = offscreen(200, 200); g = S.mill.getContext('2d');
    gr = g.createRadialGradient(80, 80, 10, 100, 100, 92); gr.addColorStop(0, '#8a5634'); gr.addColorStop(1, '#3a1e0e');
    g.fillStyle = gr; g.beginPath(); for (let k = 0; k < 24; k++) { const a = k / 24 * TAU, rr = k % 2 ? 84 : 92; g.lineTo(100 + Math.cos(a) * rr, 100 + Math.sin(a) * rr); } g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,210,170,0.25)'; g.lineWidth = 3; g.beginPath(); g.arc(100, 100, 62, 0, TAU); g.stroke();
    gr = g.createRadialGradient(92, 92, 2, 100, 100, 28); gr.addColorStop(0, '#f4f4f0'); gr.addColorStop(1, '#6a6a68');
    g.fillStyle = gr; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; g.lineTo(100 + Math.cos(a) * 26, 100 + Math.sin(a) * 26); } g.closePath(); g.fill();
    g.fillStyle = '#2a2a2a'; g.fillRect(96, 74, 8, 52);
    // paper texture for the egg white: faint creases
    S.paper = offscreen(400, 400); g = S.paper.getContext('2d');
    g.fillStyle = '#fbfaf3'; g.fillRect(0, 0, 400, 400);
    for (let k = 0; k < 26; k++) { const x = r() * 400, y = r() * 400, a = r() * PI; g.strokeStyle = `rgba(150,140,120,${0.08 + r() * 0.12})`; g.lineWidth = 1 + r() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * (60 + r() * 140), y + Math.sin(a) * (60 + r() * 140)); g.stroke(); }
    return S;
  }
  // The egg white is a cut-out of copy paper; its outline is recut every couple of frames.
  function obWhitePath(g, R, seed) {
    g.beginPath();
    for (let k = 0; k <= 40; k++) {
      const a = k / 40 * TAU, rr = R * (1 + 0.16 * vnoise(a * 1.6 + seed, 3) + 0.07 * Math.sin(a * 5 + seed * 0.7));
      k ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.92) : g.moveTo(rr, 0);
    }
    g.closePath();
  }
  function obEgg(g, st, x, y, R, s, f, o = {}) {
    const [jx, jy, jr] = obJit(f, 40, 0.8);
    g.save(); g.translate(x + jx, y + jy); g.rotate((o.rot || 0) + jr); g.scale(s * (o.sx ?? 1), s * (o.sy ?? 1));
    const seed = Math.floor(f / 2) % 3;
    obShadow(g, 10 + (o.lift || 0) * 40, 6 + (o.lift || 0) * 60, 8 + (o.lift || 0) * 80, 0.45);
    obWhitePath(g, R, seed); g.fillStyle = o.under ? '#efe4c8' : '#fbfaf3'; g.fill();
    obFlat(g);
    g.save(); obWhitePath(g, R, seed); g.clip(); g.globalAlpha = 0.8; g.drawImage(st.S.paper, -200, -200);
    if (o.under) { g.globalAlpha = 0.5; const bg = g.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 1.2); bg.addColorStop(0, 'rgba(200,140,60,0.6)'); bg.addColorStop(1, 'rgba(140,80,20,0.9)'); g.fillStyle = bg; g.fillRect(-R * 1.4, -R * 1.4, R * 2.8, R * 2.8); }
    g.restore();
    g.strokeStyle = 'rgba(160,150,130,0.5)'; g.lineWidth = 2; obWhitePath(g, R, seed); g.stroke();
    if (!o.under && o.yolk !== 0) {
      const ys = o.yolk ?? 1;
      obShadow(g, 8, 4, 6, 0.4);
      g.drawImage(st.S.button, 18 - 62 * ys, -16 - 62 * ys, 124 * ys, 124 * ys);
      obFlat(g);
      // cracked peppercorns: black seed beads
      for (let k = 0; k < (o.pepper || 0); k++) {
        const a = hash(k * 4.1) * TAU, d = 30 + hash(k * 7.3) * (R - 30);
        g.fillStyle = '#141210'; g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d * 0.9, 4.5 + hash(k) * 2.5, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(Math.cos(a) * d - 1.5, Math.sin(a) * d * 0.9 - 1.5, 1.4, 0, TAU); g.fill();
      }
    }
    g.restore();
  }
  // Sticky notes tucked under the pan rim, fluttering a little every exposure: the gas flame.
  function obFlame(g, tq, f, n) {
    const cols = ['#ffd83a', '#ff9e2c', '#ff6a2a', '#ffc232'];
    for (let k = 0; k < n; k++) {
      const a = -2.55 + 0.42 + k * (TAU - 0.84) / 15, fl = hash(f * 1.7 + k * 3.1);
      const len = 86 * (0.78 + 0.42 * fl), rot = a + (hash(f * 2.3 + k) - 0.5) * 0.26;
      g.save(); g.translate(OB_PAN.x + Math.cos(a) * (OB_PAN.rim - 34), OB_PAN.y + Math.sin(a) * (OB_PAN.rim - 34)); g.rotate(rot);
      obShadow(g, 8, 4, 6, 0.35);
      g.fillStyle = cols[k % 4]; g.fillRect(0, -40, len + 30, 80);
      obFlat(g);
      // the curl where the note lifts off the table
      g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.moveTo(len + 30, -40); g.lineTo(len + 30, -40 + 26 * fl); g.lineTo(len + 30 - 26 * fl, -40); g.closePath(); g.fill();
      g.fillStyle = 'rgba(120,40,0,0.18)'; g.fillRect(len + 18, -40, 12, 80);
      g.restore();
    }
  }
  function obPan(g, x, y, f) {
    const [jx, jy, jr] = obJit(f, 1, 0.7);
    g.save(); g.translate(x + jx, y + jy); g.rotate(-2.55 + jr);
    obShadow(g, 34, 18, 24, 0.55);
    g.fillStyle = '#1c1b1a'; MG.rrect(g, OB_PAN.rim - 30, -32, 420, 64, 30); g.fill();
    g.beginPath(); g.arc(0, 0, OB_PAN.rim, 0, TAU); g.fill();
    obFlat(g);
    g.fillStyle = '#c8a070'; g.beginPath(); g.arc(OB_PAN.rim + 345, 0, 13, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 4; g.beginPath(); g.moveTo(OB_PAN.rim + 10, -24); g.lineTo(OB_PAN.rim + 360, -24); g.stroke();
    const gr = g.createRadialGradient(-40, 40, 20, 0, 0, OB_PAN.r);
    gr.addColorStop(0, '#3e3b38'); gr.addColorStop(0.85, '#292725'); gr.addColorStop(1, '#151413');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, OB_PAN.r, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,240,220,0.16)'; g.lineWidth = 10; g.beginPath(); g.arc(0, 0, OB_PAN.r - 26, 2.3, 3.3); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, OB_PAN.rim - 4, 2.0, 3.8); g.stroke();
    [[-18], [18]].forEach(([yy]) => { g.fillStyle = '#4a4744'; g.beginPath(); g.arc(OB_PAN.r + 4, yy, 7, 0, TAU); g.fill(); });
    g.restore();
  }
  // Ribbon bacon: grosgrain ribbon with a printed stripe, inching along like a caterpillar.
  function obBacon(g, x, y, rot, ph, f, k) {
    const [jx, jy, jr] = obJit(f, 60 + k, 0.8);
    g.save(); g.translate(x + jx, y + jy); g.rotate(rot + jr);
    const L = 300, pts = [];
    for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([(u - 0.5) * L, Math.sin(u * TAU * 1.5 + ph) * 14]); }
    const band = (w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'butt'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke(); };
    obShadow(g, 8, 5, 7, 0.4); band(54, '#c8322e'); obFlat(g);
    band(30, '#f2c8b0'); band(12, '#b02a28');
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py - 22) : g.moveTo(px, py - 22))); g.stroke();
    g.restore();
  }
  function obCutlery(g, x, y, kind, f) {
    const [jx, jy, jr] = obJit(f, kind === 'fork' ? 70 : 71, 0.8);
    g.save(); g.translate(x + jx, y + jy); g.rotate(jr + (kind === 'fork' ? 0.04 : -0.03));
    const steel = g.createLinearGradient(-30, 0, 30, 0); steel.addColorStop(0, '#8a8c90'); steel.addColorStop(0.4, '#f2f3f4'); steel.addColorStop(0.6, '#c4c6ca'); steel.addColorStop(1, '#6e7074');
    obShadow(g, 10, 10, 14, 0.45); g.fillStyle = steel;
    if (kind === 'fork') {
      MG.rrect(g, -20, 20, 40, 230, 20); g.fill();
      g.beginPath(); g.moveTo(-10, 30); g.lineTo(-30, -80); g.lineTo(30, -80); g.lineTo(10, 30); g.closePath(); g.fill();
      for (let k = 0; k < 4; k++) { g.fillRect(-30 + k * 17, -210, 9, 140); }
    } else {
      MG.rrect(g, -20, 20, 40, 230, 20); g.fill();
      g.beginPath(); g.moveTo(-14, 30); g.lineTo(-16, -200); g.quadraticCurveTo(-10, -232, 16, -226); g.lineTo(14, 30); g.closePath(); g.fill();
    }
    obFlat(g);
    g.restore();
  }
  function obTile(g, ch, x, y, rot, s, f, k) {
    const [jx, jy, jr] = obJit(f, 90 + k, 0.6);
    g.save(); g.translate(x + jx, y + jy); g.rotate(rot + jr); g.scale(s, s);
    obShadow(g, 8, 5, 8, 0.5);
    MG.rrect(g, -42, -42, 84, 84, 9); g.fillStyle = '#e8cf9a'; g.fill();
    obFlat(g);
    const bv = g.createLinearGradient(-42, -42, 42, 42); bv.addColorStop(0, 'rgba(255,248,224,0.7)'); bv.addColorStop(0.25, 'rgba(255,248,224,0)'); bv.addColorStop(0.8, 'rgba(120,80,30,0)'); bv.addColorStop(1, 'rgba(120,80,30,0.45)');
    MG.rrect(g, -42, -42, 84, 84, 9); g.fillStyle = bv; g.fill();
    text(g, ch, -3, 22, { font: OBF, size: 60, align: 'center', color: '#2a1e14' });
    text(g, String(OB_PTS[ch] || 1), 30, 33, { font: OBF, size: 17, align: 'right', color: '#2a1e14' });
    g.restore();
  }

  // One exposure of the tabletop. Called at most 12 times per second.
  function obFrame(g, st, tq, f) {
    g.drawImage(st.table, 0, 0);
    // the frying pan shuffles in from the left in a few hand moves
    const panX = kf(tq, [[OB.pan, -420], [OB.pan + 0.5, OB_PAN.x, E.outQ]]), panY = kf(tq, [[OB.pan, 520], [OB.pan + 0.5, OB_PAN.y, E.outQ]]);
    // gas on: notes tucked in one by one; gas off: pulled out again
    let nf = Math.floor(clamp((tq - OB.fire) / 0.5) * 15.99);
    if (tq >= OB.off) nf = Math.max(0, 15 - Math.floor((tq - OB.off) / (1 / 12)) * 3);
    if (nf > 0 && panX === OB_PAN.x) obFlame(g, tq, f, nf);
    obPan(g, panX, panY, f);
    // the plate slides in from the right in four moves
    if (tq >= OB.plate) {
      const px = kf(tq, [[OB.plate, 2240], [OB.plate + 0.34, OB_PLATE.x, E.outQ]]), [jx, jy] = obJit(f, 5, 0.6);
      g.save(); obShadow(g, 30, 14, 20, 0.45); g.drawImage(st.S.plate, px - 270 + jx, OB_PLATE.y - 270 + jy); obFlat(g); g.restore();
      if (tq >= OB.toast) {
        const u = seg(tq, OB.toast, OB.toast + 0.25), h = Math.sin(u * PI);
        const x = lerp(1800, 1300, E.outQ(u)), y = lerp(-140, 330, E.outQ(u)), s = 0.92 + h * 0.25, [tx, ty, tr] = obJit(f, 6, 0.8);
        g.save(); g.translate(x + tx, y + ty); g.rotate(-0.22 + (1 - u) * 1.2 + tr); g.scale(s, s);
        obShadow(g, 10 + h * 30, 8 + h * 40, 10 + h * 50, 0.45); g.drawImage(st.S.cork, -100, -100); obFlat(g);
        g.restore();
      }
      if (tq >= OB.bacon) {
        // two ribbons wriggle in from the bottom edge, inching a step per exposure
        [[1500, 390, 1.72, 0], [1565, 470, 1.62, 1]].forEach(([bx, by, rot, k]) => {
          const u = seg(tq, OB.bacon + k * 0.08, OB.bacon + k * 0.08 + 0.42);
          obBacon(g, bx, lerp(1300, by, E.outQ(u)), rot, u < 1 ? f * 1.4 + k : 1 + k, f, k);
        });
      }
    }
    // golf ball hops in, three bounces, and lands in the pan
    if (tq >= OB.ball && tq < OB.crack) {
      const u = seg(tq, OB.ball, OB.crack), hop = Math.min(2, Math.floor(u * 3)), hu = u * 3 - hop;
      const P = [[1760, -80], [1380, 230], [1040, 310], [OB_EGG.x + 40, OB_EGG.y - 40]];
      const x = lerp(P[hop][0], P[hop + 1][0], hu), y = lerp(P[hop][1], P[hop + 1][1], hu), h = Math.sin(hu * PI) * (1 - hop * 0.25);
      const s = 1 + h * 0.35;
      g.save(); obShadow(g, 10 + h * 20, 8 + h * 60, 10 + h * 80, 0.5 - h * 0.2);
      g.drawImage(st.S.ball, x - 60 * s, y - 60 * s, 120 * s, 120 * s); obFlat(g); g.restore();
    }
    // the egg white spreads in five exposures; the button yolk drops out of the lens
    const inPan = tq >= OB.white && tq < OB.flip;
    if (inPan) {
      const R = 150 * E.outQ(seg(tq, OB.white, OB.white + 0.42)) + 10;
      const ys = tq < OB.yolk ? 0 : kf(tq, [[OB.yolk, 1.7], [OB.yolk + 0.17, 1, E.outQ]]);
      const pep = Math.floor(clamp((tq - OB.pepper - 0.35) / 0.55) * 22);
      // sizzle: pearl beads pop around the edge, re-placed every frame
      obEgg(g, st, OB_EGG.x, OB_EGG.y, R, 1, f, { yolk: ys, pepper: pep });
      if (tq >= OB.yolk + 0.15) {
        for (let k = 0; k < 30; k++) {
          const a = hash(f * 1.31 + k * 9.7) * TAU, d = R * (0.95 + hash(f * 0.7 + k * 3.3) * 0.32), b = 3.5 + hash(f + k * 1.9) * 5;
          const x = OB_EGG.x + Math.cos(a) * d, y = OB_EGG.y + Math.sin(a) * d * 0.92;
          if (Math.hypot(x - OB_PAN.x, y - OB_PAN.y) > OB_PAN.r - 10) continue;
          g.fillStyle = '#f6f4ee'; g.beginPath(); g.arc(x, y, b, 0, TAU); g.fill();
          g.fillStyle = 'rgba(100,90,80,0.5)'; g.beginPath(); g.arc(x + b * 0.3, y + b * 0.35, b * 0.55, 0, TAU); g.fill();
          g.fillStyle = '#fff'; g.beginPath(); g.arc(x - b * 0.3, y - b * 0.3, b * 0.35, 0, TAU); g.fill();
        }
      }
    }
    // the two halves of the cracked golf ball, pushed aside and then taken off
    if (tq >= OB.crack && tq < OB.shells + 0.42) {
      [[-1, 0], [1, 1]].forEach(([sd, k]) => {
        const u = seg(tq, OB.crack, OB.crack + 0.17), v = seg(tq, OB.shells, OB.shells + 0.42);
        const x = OB_EGG.x + 40 + sd * lerp(10, 210, E.outQ(u)) + sd * v * 300, y = OB_EGG.y - 40 - lerp(0, 150, E.outQ(u)) - v * 700, [jx, jy, jr] = obJit(f, 30 + k, 1);
        g.save(); g.translate(x + jx, y + jy); g.rotate(sd * 0.6 + jr + v * sd * 2);
        obShadow(g, 10, 8, 10, 0.45);
        g.save(); g.beginPath(); g.arc(0, 0, 52, sd < 0 ? PI / 2 : -PI / 2, sd < 0 ? PI * 1.5 : PI / 2); g.closePath(); g.clip();
        g.drawImage(st.S.ball, -60, -60); g.restore();
        obFlat(g);
        // the jagged inside of the shell
        g.fillStyle = '#d8d4ca'; g.beginPath();
        for (let i = 0; i <= 8; i++) { const yy = -50 + i * 12.5; g.lineTo(sd * (i % 2 ? 9 : 0), yy); }
        g.lineTo(sd * 22, 46); g.lineTo(sd * 22, -46); g.closePath(); g.fill();
        g.restore();
      });
    }
    // the pepper mill comes in from the top, turns in steps, and leaves
    if (tq >= OB.pepper && tq < OB.pepper + 1.1) {
      const inn = E.outQ(seg(tq, OB.pepper, OB.pepper + 0.3)), out = E.inQ(seg(tq, OB.pepper + 0.85, OB.pepper + 1.1));
      const x = lerp(1180, OB_EGG.x + 60, inn) + out * 600, y = lerp(-180, OB_EGG.y - 70, inn) - out * 700;
      const turns = Math.floor(clamp((tq - OB.pepper - 0.3) * 12, 0, 7)), [jx, jy] = obJit(f, 50, 1);
      g.save(); g.translate(x + jx, y + jy); g.rotate(turns * 0.5); g.scale(1.25, 1.25);
      obShadow(g, 36, 40, 56, 0.45); g.drawImage(st.S.mill, -100, -100); obFlat(g);
      g.restore();
    }
    // the flip: lifted toward the lens, turned over once, set down on the plate
    if (tq >= OB.flip && tq < OB.land) {
      const u = seg(tq, OB.flip, OB.land), h = Math.sin(u * PI), sy = Math.cos(u * TAU);
      const x = lerp(OB_EGG.x, OB_EGG2.x, E.ioS(u)), y = lerp(OB_EGG.y, OB_EGG2.y, E.ioS(u)) - h * 120;
      obEgg(g, st, x, y, 160, 1 + h * 0.4, f, { sy: Math.max(0.12, Math.abs(sy)), under: sy < 0, rot: u * 0.9, lift: h, pepper: 22 });
    }
    if (tq >= OB.land) {
      const sq = tq < OB.land + 0.17 ? 1.07 : 1;
      obEgg(g, st, OB_EGG2.x, OB_EGG2.y, 160, sq * 0.95, f, { rot: 0.9, pepper: 22 });
    }
    // cutlery marches in to lay the place
    if (tq >= OB.cut) {
      const u = seg(tq, OB.cut, OB.cut + 0.34), v = seg(tq, OB.cut + 0.12, OB.cut + 0.46);
      obCutlery(g, 1040, lerp(1320, 420, E.outQ(u)), 'fork', f);
      obCutlery(g, 1730, lerp(-300, 420, E.outQ(v)), 'knife', f);
    }
    // Scrabble tiles hop up from the bottom edge, one after another, and spell it out
    if (tq >= OB.tiles) {
      const N = OB_TILES.length, pitch = 96, x0 = 960 - (N - 1) * pitch / 2;
      let li = 0;
      for (let i = 0; i < N; i++) {
        const ch = OB_TILES[i]; if (ch === ' ') continue;
        const t0 = OB.tiles + li * 0.075, u = seg(tq, t0, t0 + 0.34);
        if (u > 0) {
          const hop = Math.sin(u * PI), rot = (hash(i * 3.7) - 0.5) * 0.09 + (1 - u) * (hash(i) - 0.5) * 1.6;
          obTile(g, ch, x0 + i * pitch, lerp(1200, 870, E.outQ(u)) - hop * 40, rot, 1 + hop * 0.18, f, i);
        }
        li++;
      }
    }
    // a strip of masking tape with the subtitle, slapped down in two exposures
    if (tq >= OB.tape) {
      const u = seg(tq, OB.tape, OB.tape + 0.17), [jx, jy] = obJit(f, 99, 0.6);
      g.save(); g.translate(960 + jx + (1 - u) * 80, 990 + jy); g.rotate(-0.012 + (1 - u) * 0.05);
      obShadow(g, 6, 3, 4, 0.3);
      g.fillStyle = 'rgba(236,224,186,0.94)'; g.beginPath(); g.moveTo(-560, -36);
      for (let k = 0; k <= 8; k++) g.lineTo(-560 + (k % 2) * 10, -36 + k * 9);
      g.lineTo(560, 36); for (let k = 8; k >= 0; k--) g.lineTo(560 - (k % 2) * 10, -36 + k * 9); g.closePath(); g.fill();
      obFlat(g);
      text(g, 'everyday things, one frame at a time · 1907 —', 0, 14, { font: OBM, size: 40, align: 'center', color: '#24201a' });
      g.restore();
    }
  }

  MG.film({
    id: 'objectstop', dur: 10, poster: 9.5,
    fonts: [['400 60px "Archivo Black"', 'OBJECTSPMIN 13810'], ['400 40px "Permanent Marker"', 'everyday things, one frame at a time · 1907 —']],
    meta: {
      family: 'F', name: 'Object Stop Motion', sub: 'Everyday Things, Frame by Frame', era: '1907 —',
      origin: 'Instead of puppets or clay, real household objects are moved a fraction between exposures so they seem to act on their own. J. Stuart Blackton\'s The Haunted Hotel (1907) had a breakfast table lay itself; Norman McLaren extended the trick to people as pixilation in Neighbours (1952); Jan Švankmajer turned food and utensils into uncanny actors; and PES made food out of non-food — Rubik\'s cubes, bubble wrap and Post-it notes — in Western Spaghetti (2008).',
      works: 'The Haunted Hotel (J. Stuart Blackton, 1907) · Neighbours (Norman McLaren, 1952) · Dimensions of Dialogue (Jan Švankmajer, 1982) · Food (Jan Švankmajer, 1992) · Western Spaghetti (PES, 2008) · Fresh Guacamole (PES, 2012)',
      tech: ['Shot on twos at 12 fps', 'Object substitution (things stand in for food)', 'Locked overhead camera on a tabletop', 'Per-frame placement jitter & light flicker'],
      accent: '#f2a810',
      motionDNA: 'Everything moves in 12 fps steps, as if nudged by an unseen hand: props shuffle in and hop to their marks, a paper egg spreads in a few exposures, beads re-scatter every frame like sizzling fat, and every resting object shivers by a pixel or two.',
      visualDNA: 'A warm overhead view of a pine tabletop with real drop shadows: a cast-iron pan on a ring of sticky-note flames, a golf-ball egg with a yellow button yolk, cork toast, ribbon bacon, a blue-rimmed plate and wooden letter tiles, under a faintly flickering key light.',
      transitions: 'None — props enter and exit the locked frame by hand; the title is spelled with tiles on the table',
      implementation: ['DSLR on an overhead rig + Dragonframe', 'Hand-placed props, onion-skin checks', 'Canvas 2D (12 fps quantised time, cached exposures)'],
      reproducibility: 'Procedural homage (the real thing is shot frame by frame)',
      loopable: false,
    },
    setup() {
      return { table: obTable(), S: obSprites(), frame: offscreen(1920, 1080), lastF: -1 };
    },
    draw(c, t, W, H, st) {
      // stop motion is a sequence of stills: quantise time to 12 exposures per second
      const f = Math.floor(t * 12), tq = f / 12;
      if (st.lastF !== f) {
        const g = st.frame.getContext('2d');
        g.setTransform(1, 0, 0, 1, 0, 0);
        obFrame(g, st, tq, f);
        // each exposure's lamp sits a little brighter or darker: subtle flicker
        const fl = hash(f * 0.913 + 4) - 0.5;
        g.fillStyle = fl > 0 ? `rgba(255,236,200,${fl * 0.06})` : `rgba(20,8,0,${-fl * 0.07})`; g.fillRect(0, 0, 1920, 1080);
        vignette(g, 1920, 1080, 0.42, '30,14,2');
        st.lastF = f;
      }
      c.drawImage(st.frame, 0, 0, W, H);
      grain(c, W, H, tq, 0.035, 'overlay');
      void midi; void rng;
    },
    score(A) {
      A.bus.gain.value = 0.9;
      const B = 0.5, stepT = k => Math.floor(k * 12) / 12;
      // a jaunty pizzicato bass and toy glockenspiel, all landing on the 12 fps grid
      const bass = [48, 55, 52, 55, 50, 57, 53, 57, 48, 55, 52, 55, 53, 57, 55, 59];
      for (let k = 0; k < 16; k++) A.pluck(stepT(0.25 + k * B), midi(bass[k] - 12), { dur: 0.5, g: 0.42, bright: 0.5, decay: 0.985 });
      const mel = [[0.5, 72], [1.0, 76], [1.25, 79], [1.5, 76], [2.5, 74], [3.0, 77], [3.25, 81], [3.5, 77], [4.5, 76], [5.0, 79], [5.5, 84], [6.5, 83], [7.0, 79], [7.25, 81]];
      mel.forEach(([b, m]) => A.bell(stepT(0.25 + b), midi(m), { g: 0.05, dur: 0.6, ratios: [1, 3.0, 6.1], rev: 0.15 }));
      for (let k = 0; k < 32; k++) if (k % 4 === 2) A.noise(stepT(0.25 + k * B / 2), { type: 'bandpass', f: 1800, q: 6, dur: 0.03, g: 0.12 });
      // pan shuffled in: three scrapes and a clunk
      for (let k = 0; k < 3; k++) A.noise(stepT(OB.pan + 0.08 + k * 0.17), { type: 'bandpass', f: 600, q: 1.2, dur: 0.07, g: 0.12 });
      A.osc(OB.pan + 0.5, { type: 'triangle', f: 110, f2: 70, dur: 0.25, g: 0.3 }); A.bell(OB.pan + 0.5, 420, { g: 0.03, dur: 0.6, ratios: [1, 2.7, 5.1] });
      // paper rustle for each note of the flame, then a soft gas whoomp
      for (let k = 0; k < 8; k++) A.noise(stepT(OB.fire + k / 12 * 0.75), { type: 'highpass', f: 3500, dur: 0.04, g: 0.07 });
      A.noise(OB.fire + 0.5, { type: 'lowpass', f: 600, dur: 0.6, g: 0.18, swell: 0.3 });
      // golf ball hops: three tocks rising in pitch, then the crack
      [0, 1, 2].forEach(k => A.osc(OB.ball + (k + 1) * (OB.crack - OB.ball) / 3, { type: 'sine', f: 900 + k * 220, f2: 500, dur: 0.06, g: 0.2 }));
      A.noise(OB.crack, { type: 'highpass', f: 2500, dur: 0.05, g: 0.4 }); A.osc(OB.crack, { type: 'square', f: 1400, f2: 300, dur: 0.04, g: 0.08 });
      A.noise(OB.white, { type: 'lowpass', f: 900, f2: 300, dur: 0.4, g: 0.12 });
      A.osc(OB.yolk + 0.1, { type: 'sine', f: 300, f2: 120, dur: 0.12, g: 0.25 });
      // sizzle: frying hiss with crackle on every exposure while the egg is in the pan
      A.noise(OB.yolk + 0.1, { type: 'highpass', f: 5000, dur: OB.flip - OB.yolk, g: 0.05, hold: true, rel: 0.2 });
      for (let k = 0; k < 40; k++) A.noise(OB.yolk + 0.15 + hash(k * 2.7) * (OB.flip - OB.yolk - 0.2), { type: 'bandpass', f: 3000 + hash(k) * 5000, q: 3, dur: 0.012, g: 0.06 });
      // pepper mill ratchet
      for (let k = 0; k < 7; k++) { const tt = OB.pepper + 0.3 + k / 12; A.noise(tt, { type: 'bandpass', f: 2400, q: 4, dur: 0.05, g: 0.12 }); A.noise(tt + 0.03, { type: 'bandpass', f: 4200, q: 6, dur: 0.02, g: 0.08 }); }
      // plate slides and clinks, cork thump, ribbon boings
      A.noise(OB.plate, { type: 'bandpass', f: 1200, f2: 500, dur: 0.34, g: 0.08 }); A.bell(OB.plate + 0.34, 1900, { g: 0.05, dur: 0.8 });
      A.osc(OB.toast + 0.25, { type: 'triangle', f: 160, f2: 90, dur: 0.12, g: 0.25 });
      [0, 0.08].forEach(d => A.osc(OB.bacon + d + 0.05, { type: 'sine', f: 180, f2: 420, glide: 0.35, dur: 0.38, g: 0.08, vib: [12, 30] }));
      // the flip: whoosh up, slap down
      A.whoosh(OB.flip, 0.6, { f1: 400, f2: 2200, g: 0.16 });
      A.noise(OB.land, { type: 'lowpass', f: 1500, dur: 0.08, g: 0.3 }); A.osc(OB.land, { type: 'sine', f: 200, f2: 90, dur: 0.14, g: 0.2 });
      // cutlery clinks, gas off with a rustle
      A.bell(OB.cut + 0.34, 2600, { g: 0.04, dur: 0.5 }); A.bell(OB.cut + 0.46, 3100, { g: 0.04, dur: 0.5 });
      for (let k = 0; k < 5; k++) A.noise(OB.off + k / 12, { type: 'highpass', f: 3500, dur: 0.04, g: 0.06 });
      // letter tiles: a wooden clack as each one lands
      let li = 0;
      for (let i = 0; i < OB_TILES.length; i++) { if (OB_TILES[i] === ' ') continue; const tt = stepT(OB.tiles + li * 0.075 + 0.34); A.noise(tt, { type: 'bandpass', f: 1500 + hash(i) * 900, q: 5, dur: 0.035, g: 0.16 }); A.osc(tt, { type: 'sine', f: 700 + hash(i) * 400, f2: 400, dur: 0.04, g: 0.07 }); li++; }
      // tape tear, then the final cadence
      A.noise(OB.tape - 0.15, { type: 'bandpass', f: 2600, f2: 4800, q: 1.5, dur: 0.2, g: 0.08 });
      A.noise(OB.tape + 0.1, { type: 'lowpass', f: 900, dur: 0.06, g: 0.2 });
      A.pluck(OB.tape + 0.1, midi(36), { dur: 1.2, g: 0.5, bright: 0.5 });
      [72, 76, 79, 84].forEach((m, i) => A.bell(OB.tape + 0.1 + i * 0.06, midi(m), { g: 0.05, dur: 1.4, ratios: [1, 3.0, 6.1], rev: 0.3 }));
    },
  });
  /* =====================================================================
     HYPERLAPSE — a stabilised camera pushes down a midtown avenue in
     late-afternoon sun while shadows sweep the street and clouds race in;
     a whip pan lands on a suspension bridge at sunset, cables ticking past
     as the sun drops into the river; a second whip lands downtown at night,
     the push eases to a stop and traffic keeps streaking under the title
     ===================================================================== */
  const HL = { w1: 3.5, w2: 7.0, wh: 0.15, title: 8.3, sub: 8.85 };
  const HLF = 'Oswald, "Arial Narrow", sans-serif', HLM = '"IBM Plex Mono", "Courier New", monospace';
  const HZN = 540, FOC = 950, EYE = 1.7, NEAR = 1.2;
  const hex = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  const rgb = (a, al = 1) => `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${al})`;
  const mixA = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const ramp = (keys, u) => {
    if (u <= keys[0][0]) return hex(keys[0][1]);
    for (let i = 1; i < keys.length; i++) if (u <= keys[i][0]) return mixA(hex(keys[i - 1][1]), hex(keys[i][1]), (u - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
    return hex(keys[keys.length - 1][1]);
  };
  // Time of day, 0 = 16:40 and 1 = 22:10: five and a half hours in ten seconds.
  const hlTod = t => t / 10;
  const HL_TOP = [[0, '#3c7cc8'], [0.3, '#3a68ac'], [0.45, '#4a5a94'], [0.58, '#38386e'], [0.7, '#1a2252'], [0.85, '#0a1030'], [1, '#060a1c']];
  const HL_HOR = [[0, '#c4dcee'], [0.3, '#f2dcb0'], [0.45, '#ffb468'], [0.58, '#ff7a52'], [0.7, '#8a5a8a'], [0.85, '#2c2a58'], [1, '#2a1e38']];
  const HL_CLOUD = [[0, '#ffffff'], [0.3, '#fff0d8'], [0.45, '#ffc890'], [0.58, '#ff8a70'], [0.7, '#5a4a78'], [0.85, '#1c1c3a'], [1, '#1a1830']];
  // Camera path per location: a steady push, the last one easing to a stop.
  const hlCam = (loc, lt) => ({ z: loc === 0 ? 34 * lt : loc === 1 ? 50 * lt : 72 * E.outQ(seg(lt, 0, 2.3)) });
  function hlProj(cz) { return (x, y, z) => { const zr = z - cz; return [960 + FOC * x / zr, HZN - FOC * (y - EYE) / zr]; }; }
  function hlQuad(g, P, a, b, c, d) { const p = [P(...a), P(...b), P(...c), P(...d)]; g.beginPath(); g.moveTo(p[0][0], p[0][1]); g.lineTo(p[1][0], p[1][1]); g.lineTo(p[2][0], p[2][1]); g.lineTo(p[3][0], p[3][1]); g.closePath(); }
  // A ribbon lying along z (vertical: x fixed, y0..y1; or flat: x0..x1 at height y).
  function hlRibbonV(g, P, cz, x, y0, y1, za, zb) { za = Math.max(za, cz + NEAR); if (zb <= za) return false; hlQuad(g, P, [x, y0, za], [x, y1, za], [x, y1, zb], [x, y0, zb]); return true; }
  function hlRibbonH(g, P, cz, x0, x1, y, za, zb) { za = Math.max(za, cz + NEAR); if (zb <= za) return false; hlQuad(g, P, [x0, y, za], [x1, y, za], [x1, y, zb], [x0, y, zb]); return true; }

  function hlBuildings(seed, tall) {
    const r = rng(seed), B = [];
    [-1, 1].forEach(s => {
      let z = -30;
      while (z < 820) {
        const L = 14 + r() * 24, h = tall ? 40 + r() * 110 : 22 + r() * 60;
        B.push({ s, z0: z, z1: z + L, h, set: r() * 2.2, col: Math.floor(r() * 6), tex: Math.floor(r() * 4), nt: Math.floor(r() * 8), th: r(), sign: tall && r() < 0.55 ? { z: z + 2 + r() * (L - 4), y0: 5 + r() * 6, hh: 9 + r() * 12, hue: Math.floor(r() * 4) } : null, band: tall && r() < 0.4 ? Math.floor(r() * 4) : -1 });
        z += L + (r() < 0.18 ? 8 + r() * 6 : 0.4);
      }
    });
    return B.sort((a, b) => b.z0 - a.z0);
  }
  const HL_WALL = ['#8c919a', '#a69b8a', '#707b8a', '#b2aa9a', '#5e6672', '#9c8774'];
  const HL_NEON = ['#ff2a8a', '#2af0ff', '#ffb42a', '#9a5aff'];
  function hlTextures() {
    const r = rng(2014), day = [], night = [];
    for (let v = 0; v < 4; v++) {
      const c = offscreen(16, 800), g = c.getContext('2d');
      for (let f = 0; f < 22; f++) {
        const y = 800 - (f + 1) * 36;
        const gr = g.createLinearGradient(0, y, 16, y + 36);
        const b = 60 + r() * 50 + v * 10;
        gr.addColorStop(0, `rgb(${b * 0.8},${b},${b * 1.25 + 30})`); gr.addColorStop(1, `rgb(${b * 0.5},${b * 0.6},${b * 0.8 + 20})`);
        g.fillStyle = gr; g.fillRect(0, y + 6, 16, 24);
        g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, y + 6, 16, 2);
      }
      day.push(c);
    }
    for (let v = 0; v < 8; v++) {
      const c = offscreen(16, 800), g = c.getContext('2d');
      for (let f = 0; f < 22; f++) {
        const y = 800 - (f + 1) * 36, q = r();
        if (q < 0.5) { const w = r(); g.fillStyle = w < 0.6 ? '#ffd890' : w < 0.85 ? '#fff2d0' : '#bcd8ff'; g.fillRect(0, y + 6, 16, 24); g.fillStyle = 'rgba(120,60,0,0.25)'; g.fillRect(0, y + 22, 16, 8); }
        else { g.fillStyle = 'rgba(20,24,40,0.9)'; g.fillRect(0, y + 6, 16, 24); }
      }
      night.push(c);
    }
    // a soft glow dot for lamps and lights
    const glow = offscreen(128, 128), gg = glow.getContext('2d'), gr = gg.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.15, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    gg.fillStyle = gr; gg.fillRect(0, 0, 128, 128);
    // cloud puffs
    const clouds = [];
    for (let v = 0; v < 4; v++) {
      const c = offscreen(512, 200), g = c.getContext('2d');
      for (let k = 0; k < 14; k++) {
        const x = 80 + r() * 350, y = 90 + (r() - 0.5) * 50, rr = 40 + r() * 60, gr2 = g.createRadialGradient(x, y, 0, x, y, rr);
        gr2.addColorStop(0, 'rgba(255,255,255,0.8)'); gr2.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr2; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      }
      clouds.push(c);
    }
    // far skyline across the river: silhouettes, with a night copy full of lights
    const sky = offscreen(1920, 320), sg = sky.getContext('2d'), skyN = offscreen(1920, 320), sn = skyN.getContext('2d');
    let x = 0;
    while (x < 1920) {
      const w = 30 + r() * 70, h = (Math.abs(x - 960) < 500 ? 80 : 20) + r() * (Math.abs(x - 960) < 400 ? 220 : 90);
      sg.fillStyle = '#000'; sg.fillRect(x, 320 - h, w, h);
      if (r() < 0.15) { sg.fillRect(x + w / 2 - 2, 320 - h - 40, 4, 40); }
      for (let yy = 320 - h + 6; yy < 316; yy += 7) for (let xx = x + 3; xx < x + w - 3; xx += 6) if (r() < 0.35) { sn.fillStyle = r() < 0.7 ? '#ffd898' : '#e8f0ff'; sn.fillRect(xx, yy, 3, 3); }
      x += w + r() * 6;
    }
    return { day, night, glow, clouds, sky, skyN, cl: offscreen(960, 300) };
  }

  function hlSky(g, st, tod, t, cz) {
    const top = ramp(HL_TOP, tod), hor = ramp(HL_HOR, tod);
    const gr = g.createLinearGradient(0, 0, 0, HZN);
    gr.addColorStop(0, rgb(top)); gr.addColorStop(0.75, rgb(mixA(top, hor, 0.6))); gr.addColorStop(1, rgb(hor));
    g.fillStyle = gr; g.fillRect(0, 0, 1920, HZN + 2);
    // clouds race in from the vanishing point and slide sideways: travel plus compressed time
    const cl = st.T.cl, cg = cl.getContext('2d');
    cg.setTransform(1, 0, 0, 1, 0, 0); cg.globalCompositeOperation = 'source-over'; cg.clearRect(0, 0, 960, 300);
    for (let i = 0; i < 14; i++) {
      const rr = (hash(i * 3.7) + t * 0.07 + cz * 0.0006) % 1, a = -PI * (0.08 + 0.84 * hash(i * 9.1));
      const x = 480 + Math.cos(a) * rr * 900 + ((t * 40 + hash(i) * 960) % 960) * 0.3 - 140, y = 270 + Math.sin(a) * rr * 330;
      const s = 0.25 + rr * 1.6, al = Math.min(1, rr * 4) * (1 - E.inQ(seg(rr, 0.75, 1)));
      cg.globalAlpha = al * 0.9; cg.drawImage(st.T.clouds[i % 4], x - 256 * s, y - 100 * s * 0.6, 512 * s, 200 * s * 0.6);
    }
    cg.globalAlpha = 1; cg.globalCompositeOperation = 'source-atop'; cg.fillStyle = rgb(ramp(HL_CLOUD, tod)); cg.fillRect(0, 0, 960, 300);
    g.drawImage(cl, 0, 0, 1920, 600);
  }
  // Traffic, compressed: by day ghostly smears, by night ribbons of head- and tail-light.
  function hlTraffic(g, st, P, cz, t, nf, lanes) {
    const day = 1 - nf;
    g.save();
    lanes.forEach((x, li) => {
      const on = x < 0, v = on ? -140 : 95;
      for (let k = 0; k < 22; k++) {
        const per = 34 + hash(li * 11 + k) * 20, z = ((k * per + t * v + hash(li + k * 0.37) * 300) % 600 + 600) % 600 + cz - 20, L = 18 + hash(k * 3 + li) * 26;
        if (z + L < cz + NEAR || z > cz + 600) continue;
        if (day > 0.05) {
          const col = HL_WALL[(k + li) % 6];
          g.globalCompositeOperation = 'source-over'; g.fillStyle = rgb(mixA(hex(col), [30, 30, 40], 0.3), 0.3 * day);
          if (hlRibbonV(g, P, cz, x - 0.8, 0.2, 1.5, z, z + L)) g.fill();
          if (hlRibbonV(g, P, cz, x + 0.8, 0.2, 1.5, z, z + L)) g.fill();
          g.fillStyle = rgb([200, 210, 230], 0.12 * day); if (hlRibbonH(g, P, cz, x - 0.8, x + 0.8, 1.5, z, z + L)) g.fill();
        }
        if (nf > 0.05) {
          g.globalCompositeOperation = 'lighter';
          const c1 = on ? [255, 244, 220] : [255, 40, 30];
          [-0.75, 0.75].forEach(dx => {
            g.fillStyle = rgb(c1, 0.16 * nf); if (hlRibbonV(g, P, cz, x + dx, 0.25, 1.15, z, z + L)) g.fill();
            g.fillStyle = rgb(c1, 0.85 * nf); if (hlRibbonV(g, P, cz, x + dx, 0.62, 0.78, z, z + L)) g.fill();
          });
        }
      }
    });
    g.restore();
  }
  // Pedestrians are only there for a few frames each: smudged ghosts on the pavement.
  function hlGhosts(g, P, camAt, t, nf, xs) {
    for (let i = 0; i < 46; i++) {
      const ph = t * 2.5 + hash(i * 1.7), b = Math.floor(ph), u = ph - b, tb = (b - hash(i * 1.7)) / 2.5;
      const z = camAt(tb) + 8 + hash(i * 5.1 + b * 1.3) * 140, x = xs[i % 2] * (8 + hash(i + b * 0.7) * 2.6);
      if (z < camAt(t) + NEAR + 1) continue;
      const [sx, sy] = P(x, 0, z), [, ty] = P(x, 1.75, z), w = (sy - ty) * 0.28, al = Math.sin(u * PI) * 0.55;
      g.fillStyle = nf > 0.5 ? `rgba(10,10,20,${al})` : `rgba(40,36,40,${al * 0.8})`;
      g.fillRect(sx - w / 2, ty, w, sy - ty);
      g.fillRect(sx - w * 0.9, ty + (sy - ty) * 0.08, w * 1.8, (sy - ty) * 0.25);
    }
  }
  function hlRoad(g, P, cz, nf, wet) {
    // pavements, then asphalt and its markings
    g.fillStyle = rgb(mixA([150, 146, 140], [26, 26, 34], nf)); if (hlRibbonH(g, P, cz, -12, 12, 0, cz, cz + 900)) g.fill();
    const ag = g.createLinearGradient(0, HZN, 0, 1080);
    ag.addColorStop(0, rgb(mixA([92, 92, 98], [20, 20, 30], nf))); ag.addColorStop(1, rgb(mixA([52, 52, 58], [8, 8, 14], nf)));
    g.fillStyle = ag; if (hlRibbonH(g, P, cz, -7, 7, 0, cz, cz + 900)) g.fill();
    if (wet) { const wg = g.createLinearGradient(0, HZN, 0, 1080); wg.addColorStop(0, 'rgba(80,90,140,0.25)'); wg.addColorStop(0.3, 'rgba(40,40,70,0.1)'); wg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = wg; if (hlRibbonH(g, P, cz, -7, 7, 0, cz, cz + 900)) g.fill(); }
    g.fillStyle = rgb(mixA([230, 190, 60], [120, 100, 40], nf));
    [-0.22, 0.12].forEach(x => { if (hlRibbonH(g, P, cz, x, x + 0.12, 0.01, cz, cz + 900)) g.fill(); });
    g.fillStyle = rgb(mixA([235, 235, 230], [110, 110, 120], nf));
    const z0 = Math.floor(cz / 12) * 12;
    for (let z = z0; z < cz + 420; z += 12) [-3.5, 3.5].forEach(x => { if (hlRibbonH(g, P, cz, x - 0.08, x + 0.08, 0.01, z, z + 3.5)) g.fill(); });
    // kerbs
    g.fillStyle = rgb(mixA([190, 186, 178], [40, 40, 48], nf));
    [-7.2, 7].forEach(x => { if (hlRibbonV(g, P, cz, x + 0.1, 0, 0.18, cz, cz + 900)) g.fill(); });
  }
  function hlLamps(g, st, P, cz, nf, spacing, xs, col) {
    const z0 = Math.ceil((cz + 4) / spacing) * spacing;
    for (let z = z0 + spacing * 12; z >= z0; z -= spacing) xs.forEach(x => {
      const [bx, by] = P(x, 0, z), [tx, ty] = P(x, 8, z), [ax, ay] = P(x * 0.82, 8.3, z), w = FOC * 0.18 / (z - cz);
      g.strokeStyle = rgb(mixA([60, 62, 66], [14, 14, 20], nf)); g.lineWidth = Math.max(1, w); g.lineCap = 'round';
      g.beginPath(); g.moveTo(bx, by); g.lineTo(tx, ty); g.lineTo(ax, ay); g.stroke();
      if (nf > 0.1) {
        const R = FOC * 3.2 / (z - cz);
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = nf * 0.8;
        g.drawImage(st.T.glow, ax - R, ay - R, R * 2, R * 2);
        g.globalAlpha = nf * 0.25; g.fillStyle = col; g.beginPath(); g.arc(ax, ay, R * 0.18, 0, TAU); g.fill();
        g.restore();
      }
    });
  }
  function hlStreet(g, st, loc, t, lt, tod) {
    const cam = hlCam(loc, lt), cz = cam.z, P = hlProj(cz), nf = clamp((tod - 0.55) / 0.25), night = loc === 2;
    hlSky(g, st, tod, t, cz);
    if (night) {
      // the landmark tower closing the avenue, spire blinking
      const [lx, ly] = P(0, 0, 1500), H2 = FOC * 340 / (1500 - cz), wv = FOC * 22 / (1500 - cz);
      g.fillStyle = '#0c0e1c'; g.beginPath(); g.moveTo(lx - wv, ly); g.lineTo(lx - wv * 0.55, ly - H2); g.lineTo(lx, ly - H2 * 1.25); g.lineTo(lx + wv * 0.55, ly - H2); g.lineTo(lx + wv, ly); g.closePath(); g.fill();
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 18; k++) { const y = ly - H2 * (k / 18), ww = lerp(wv, wv * 0.55, k / 18); g.fillStyle = `rgba(120,200,255,${0.35 + 0.3 * (k % 3 === 0)})`; g.fillRect(lx - ww, y, ww * 2, 1.5); }
      if (Math.floor(t * 2) % 2) { g.globalAlpha = 0.9; g.drawImage(st.T.glow, lx - 18, ly - H2 * 1.25 - 18, 36, 36); }
      g.restore();
    }
    hlRoad(g, P, cz, nf, night);
    // the afternoon sun is low on the left: the left block's shadow sweeps across the avenue
    if (!night) {
      const sw = lerp(3, 21, tod / 0.35);
      g.fillStyle = `rgba(20,30,70,${0.42 * (1 - nf)})`; if (hlRibbonH(g, P, cz, -12, -12 + sw, 0.02, cz, cz + 900)) g.fill();
    }
    hlTraffic(g, st, P, cz, t, nf, [-5.25, -1.75, 1.75, 5.25]);
    hlGhosts(g, P, tt => hlCam(loc, tt - (loc === 0 ? 0 : HL.w2)).z, t, nf, [-1, 1]);
    // buildings, far to near: street face (window columns drawn in true perspective), then the end face
    const B = st[night ? 'B2' : 'B0'];
    for (let i = 0; i < B.length; i++) {
      const b = B[i];
      if (b.z1 < cz + NEAR || b.z0 > cz + 760) continue;
      const xf = b.s * (12 + b.set), lit = b.s > 0 && !night ? 1 - nf : 0;
      let wall = hex(HL_WALL[b.col]);
      wall = mixA(wall, lit ? [255, 214, 160] : [30, 40, 70], lit ? 0.22 * (1 - tod) : 0.3);
      wall = mixA(wall, [10, 12, 22], nf * 0.9);
      const fog = clamp((b.z0 - cz) / 760);
      g.fillStyle = rgb(mixA(wall, ramp(HL_HOR, tod), fog * 0.7 * (1 - nf * 0.6)));
      if (!hlRibbonV(g, P, cz, xf, 0, b.h, b.z0, b.z1)) continue;
      g.fill();
      // window columns
      const za = Math.max(b.z0, cz + NEAR), cw = 1.9, alpha = 1 - fog * 0.8;
      for (let zc = b.z0 + 1.5; zc + cw < b.z1 - 1; zc += 3.3) {
        if (zc < za) continue;
        const [x1, yb] = P(xf, 3, zc), [x2] = P(xf, 3, zc + cw), [, yt] = P(xf, b.h - 1.5, zc);
        const sh = Math.max(1, (b.h - 4.5) * 10), dw = x2 - x1;
        if (Math.abs(dw) < 0.6) continue;
        g.globalAlpha = alpha * (1 - nf); g.drawImage(st.T.day[b.tex], 0, 800 - sh, 16, sh, Math.min(x1, x2), yt, Math.abs(dw), yb - yt);
        const on = clamp((nf - b.th * 0.7 - hash(zc) * 0.25) * 5);
        if (on > 0) { g.globalAlpha = alpha * on; g.drawImage(st.T.night[(b.nt + Math.floor(zc)) % 8], 0, 800 - sh, 16, sh, Math.min(x1, x2), yt, Math.abs(dw), yb - yt); }
      }
      g.globalAlpha = 1;
      // shop fronts at street level
      g.fillStyle = night ? `rgba(255,190,120,${0.12 + 0.14 * hash(i)})` : 'rgba(30,34,44,0.6)';
      if (hlRibbonV(g, P, cz, xf, 0.4, 3.2, b.z0 + 1, b.z1 - 1)) g.fill();
      // neon: a horizontal band on the facade and a blade sign sticking out over the pavement
      if (night && b.band >= 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rgb(hex(HL_NEON[b.band]), 0.8 * nf); if (hlRibbonV(g, P, cz, xf - b.s * 0.1, 4.2, 5.0, b.z0 + 2, b.z1 - 2)) g.fill(); g.restore(); }
      // end face toward the camera
      if (b.z0 > cz + NEAR) {
        const [ex1, ey1] = P(xf, b.h, b.z0), [ex2, ey2] = P(xf + b.s * 30, 0, b.z0);
        g.fillStyle = rgb(mixA(mixA(wall, [0, 0, 0], 0.25), ramp(HL_HOR, tod), fog * 0.7 * (1 - nf * 0.6)));
        g.fillRect(Math.min(ex1, ex2), ey1, Math.abs(ex2 - ex1), ey2 - ey1);
      }
      if (night && b.sign && b.sign.z > cz + NEAR) {
        const sg = b.sign, [s1, sy1] = P(xf, sg.y0 + sg.hh, sg.z), [s2, sy2] = P(xf - b.s * 2.6, sg.y0, sg.z), col = hex(HL_NEON[sg.hue]);
        const x0 = Math.min(s1, s2), ww = Math.abs(s2 - s1), hh = sy2 - sy1;
        g.save(); g.globalCompositeOperation = 'lighter';
        g.globalAlpha = 0.5 * nf; g.drawImage(st.T.glow, x0 - ww * 1.5, sy1 - hh * 0.4, ww * 4, hh * 1.8);
        g.globalAlpha = 1; g.fillStyle = rgb(col, 0.9 * nf); g.fillRect(x0, sy1, ww, hh);
        g.fillStyle = `rgba(255,255,255,${0.7 * nf})`;
        for (let k = 0; k < 4; k++) g.fillRect(x0 + ww * 0.3, sy1 + hh * (0.1 + k * 0.22), ww * 0.4, hh * 0.13);
        // its reflection smeared down the wet road
        const [, ry] = P(xf - b.s * 2, 0, sg.z), rg = g.createLinearGradient(0, ry, 0, ry + hh * 1.6);
        rg.addColorStop(0, rgb(col, 0.22 * nf)); rg.addColorStop(1, rgb(col, 0));
        g.fillStyle = rg; g.fillRect(x0 + ww * 0.2, ry, ww * 0.6, hh * 1.4);
        g.restore();
      }
    }
    hlLamps(g, st, P, cz, nf, 30, [-9.5, 9.5], '#ffc070');
    // haze at the vanishing point
    const hz = g.createLinearGradient(0, HZN - 160, 0, HZN + 60), hc = ramp(HL_HOR, tod);
    hz.addColorStop(0, rgb(hc, 0)); hz.addColorStop(0.75, rgb(hc, 0.4 * (1 - nf * 0.5))); hz.addColorStop(1, rgb(hc, 0));
    g.fillStyle = hz; g.fillRect(560, HZN - 160, 800, 220);
  }
  function hlBridge(g, st, t, lt, tod) {
    const cz = hlCam(1, lt).z, P = hlProj(cz), nf = clamp((tod - 0.55) / 0.25);
    hlSky(g, st, tod, t, cz);
    // the sun drops into the river in three seconds
    const sunY = lerp(HZN - 170, HZN + 40, lt / 3.5), sunX = 1560;
    const sg = g.createRadialGradient(sunX, sunY, 10, sunX, sunY, 520);
    sg.addColorStop(0, 'rgba(255,240,200,0.95)'); sg.addColorStop(0.08, 'rgba(255,200,120,0.7)'); sg.addColorStop(0.4, 'rgba(255,120,60,0.22)'); sg.addColorStop(1, 'rgba(255,90,60,0)');
    g.save(); g.beginPath(); g.rect(0, 0, 1920, HZN); g.clip();
    g.fillStyle = sg; g.fillRect(0, 0, 1920, HZN);
    g.fillStyle = '#fff3d6'; g.beginPath(); g.arc(sunX, sunY, 40, 0, TAU); g.fill();
    g.restore();
    // far skyline, lights coming on
    const sc = 1 + lt * 0.03;
    g.save(); g.translate(960, HZN); g.scale(sc, sc); g.globalAlpha = lerp(0.55, 0.9, clamp(tod * 2 - 0.8)); g.drawImage(st.T.sky, -960, -320); g.restore();
    g.save(); g.translate(960, HZN); g.scale(sc, sc); g.globalAlpha = clamp((tod - 0.5) / 0.2); g.globalCompositeOperation = 'lighter'; g.drawImage(st.T.skyN, -960, -320); g.restore();
    // the river: sky reflected, with sun glitter shimmering on every frame
    const top = ramp(HL_TOP, tod), hor = ramp(HL_HOR, tod);
    const wg = g.createLinearGradient(0, HZN, 0, 1080);
    wg.addColorStop(0, rgb(mixA(hor, [0, 0, 0], 0.25))); wg.addColorStop(1, rgb(mixA(top, [0, 0, 10], 0.55)));
    g.fillStyle = wg; g.fillRect(0, HZN, 1920, 540);
    const f = Math.floor(t * 30), gl = 1 - seg(sunY, HZN - 20, HZN + 30);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 140; k++) {
      const yy = HZN + 2 + Math.pow(hash(k * 1.3), 1.6) * 520, spread = 20 + (yy - HZN) * 0.5, x = sunX + (hash(k * 7.7 + f * 0.13) - 0.5) * spread * 2;
      g.fillStyle = `rgba(255,${190 + hash(k) * 50 | 0},120,${(0.25 + 0.5 * hash(k + f)) * gl})`; g.fillRect(x, yy, 6 + (yy - HZN) * 0.12, 1.5 + (yy - HZN) * 0.012);
    }
    g.restore();
    // the deck
    const steel = mixA([70, 60, 66], [10, 10, 16], nf);
    g.fillStyle = rgb(mixA([54, 46, 52], [6, 6, 12], nf)); if (hlRibbonH(g, P, cz, -11, 11, -0.6, cz, cz + 1200)) g.fill();
    hlRoad(g, P, cz, nf, false);
    hlTraffic(g, st, P, cz, t, Math.max(nf, 0.35), [-5.25, -1.75, 1.75, 5.25]);
    // railings: rails plus posts flicking past
    g.fillStyle = rgb(steel);
    [-10.6, 10.6].forEach(x => { if (hlRibbonV(g, P, cz, x, 0.95, 1.1, cz, cz + 1200)) g.fill(); if (hlRibbonV(g, P, cz, x, 0.4, 0.5, cz, cz + 1200)) g.fill(); });
    g.strokeStyle = rgb(steel);
    for (let z = Math.ceil((cz + 2) / 2.5) * 2.5; z < cz + 160; z += 2.5) [-10.6, 10.6].forEach(x => { const [a, ay] = P(x, 0, z), [, by] = P(x, 1.1, z); g.lineWidth = Math.max(1, FOC * 0.08 / (z - cz)); g.beginPath(); g.moveTo(a, ay); g.lineTo(a, by); g.stroke(); });
    // towers and main cables, suspenders ticking past in rhythm
    const T1 = 185, T2 = 560, TH = 96;
    const cab = z => (z < T1 ? lerp(4, TH, Math.pow(clamp((z + 220) / (T1 + 220)), 2)) : TH - (TH - 10) * (1 - Math.pow((z - (T1 + T2) / 2) / ((T2 - T1) / 2), 2)));
    [T2, T1].forEach(Tz => {
      if (Tz < cz + NEAR) return;
      [-12.5, 12.5].forEach(x => {
        const [a1, ay1] = P(x - 1.6 * Math.sign(x), TH + 6, Tz), [a2, ay2] = P(x + 1.6 * Math.sign(x), -1, Tz);
        g.fillStyle = rgb(mixA(mixA([150, 70, 50], [40, 24, 30], 0.4 + 0.6 * clamp(tod - 0.4) * 2), [8, 6, 12], nf));
        g.fillRect(Math.min(a1, a2), ay1, Math.abs(a2 - a1), ay2 - ay1);
      });
      [[40, 44], [TH, TH + 6]].forEach(([y0, y1]) => { const [b1, by1] = P(-14, y1, Tz), [b2, by2] = P(14, y0, Tz); g.fillRect(b1, by1, b2 - b1, by2 - by1); });
      if (nf > 0.2 && Math.floor(t * 1.5) % 2) [-12.5, 12.5].forEach(x => { const [lx, ly] = P(x, TH + 7, Tz); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.9; g.drawImage(st.T.glow, lx - 16, ly - 16, 32, 32); g.restore(); });
    });
    g.strokeStyle = rgb(mixA([60, 40, 44], [14, 12, 20], nf));
    [-12.5, 12.5].forEach(x => {
      g.lineWidth = 3; g.beginPath();
      for (let z = cz + NEAR + 0.5, k = 0; z < T2; z += Math.max(2, (z - cz) * 0.15), k++) { const [px, py] = P(x, cab(z), z); k ? g.lineTo(px, py) : g.moveTo(px, py); }
      g.stroke();
      for (let z = Math.ceil((cz + 2) / 9) * 9; z < T2 - 4; z += 9) {
        if (Math.abs(z - T1) < 4) continue;
        const [px, py] = P(x, cab(z), z), [, qy] = P(x, 1, z);
        g.lineWidth = Math.max(0.8, FOC * 0.09 / (z - cz)); g.beginPath(); g.moveTo(px, py); g.lineTo(px, qy); g.stroke();
      }
    });
    hlLamps(g, st, P, cz, nf, 36, [-10.4, 10.4], '#ffd090');
  }

  function hlLoc(g, st, loc, t) {
    const tod = hlTod(t);
    if (loc === 0) hlStreet(g, st, 0, t, t, tod);
    else if (loc === 1) hlBridge(g, st, t, t - HL.w1, tod);
    else hlStreet(g, st, 2, t, t - HL.w2, tod);
  }
  // Whip pan: the frame is smeared sideways with a box of offset copies (running average).
  function hlWhip(c, src, shift, blur) {
    const N = 12;
    for (let i = 0; i < N; i++) {
      c.globalAlpha = 1 / (i + 1);
      // the buffer wraps around so the swish never shows an empty edge
      const x = ((shift - blur / 2 + blur * i / (N - 1)) % 1920 + 1920) % 1920 - 1920;
      c.drawImage(src, x, 0); c.drawImage(src, x + 1920, 0);
    }
    c.globalAlpha = 1;
  }

  MG.film({
    id: 'hyperlapse', dur: 10, poster: 9.5,
    fonts: [['600 200px Oswald', 'HYPERLAPSE'], ['300 40px Oswald', 'MOVING'], ['600 30px "IBM Plex Mono"', 'MIDTOWN 16:40 ×1980 TIME-LAPSE —']],
    meta: {
      family: 'H', name: 'Hyperlapse', sub: 'Moving Time-lapse', era: '2011 —',
      origin: 'A time-lapse in which the camera itself travels: one still is shot every few steps or metres, each aligned to a fixed point, then stabilised and played at video speed so the camera glides over distances while hours pass. Ron Fricke\'s motion-controlled driving shots for Koyaanisqatsi (1982) were early ancestors; Geoff Tompkinson, Shahab Gabriel and Rob Whitworth popularised hand-moved city hyperlapses with whip-pan "flow" transitions in the early 2010s, and Instagram\'s Hyperlapse app and Microsoft Research\'s Hyperlapse (both 2014) turned it into a phone feature.',
      works: 'Koyaanisqatsi (Godfrey Reggio, cinematography Ron Fricke, 1982) · Geoff Tompkinson\'s city hyperlapses (2012 —) · Barcelona GO! (Rob Whitworth, 2013) · Instagram Hyperlapse app (2014) · Microsoft Research Hyperlapse (Kopf, Cohen & Szeliski, SIGGRAPH 2014)',
      tech: ['One still every few metres, aligned to a fixed point', 'Warp stabilisation & deflicker', 'Whip-pan transitions between locations', 'Light trails from long-interval traffic'],
      accent: '#ff8a3a',
      motionDNA: 'A steady, gliding forward push that never bobs, while everything else is fast-forwarded: clouds race out of the vanishing point, shadows sweep the street, traffic becomes streaks; whip pans snap between locations and the final push eases to a stop as the city keeps rushing.',
      visualDNA: 'Strict one-point perspective down an avenue and across a suspension bridge, the sky sliding from afternoon blue through a sunset into blue hour and night, windows switching on, ghosted pedestrians, red and white light ribbons, neon on wet asphalt and a faint frame-to-frame exposure shimmer.',
      transitions: 'Whip pans (motion-blurred swish) between locations, time jumping with each one',
      implementation: ['DSLR on a tripod moved by hand, every few metres', 'After Effects Warp Stabilizer / LRTimelapse deflicker', 'Canvas 2D (one-point projection, procedural city)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const A = offscreen(1920, 1080), B = offscreen(1920, 1080);
      return { T: hlTextures(), B0: hlBuildings(1982, false), B2: hlBuildings(2013, true), A, B };
    },
    draw(c, t, W, H, st) {
      const f = Math.floor(t * 30);
      // hyperlapse residue: each still sits a pixel or two off and is a touch brighter or darker
      const jx = (hash(f * 1.7) - 0.5) * 2.4, jy = (hash(f * 2.9) - 0.5) * 2.4, jr = (hash(f * 4.1) - 0.5) * 0.0016;
      const loc = t < HL.w1 ? 0 : t < HL.w2 ? 1 : 2;
      const near = Math.min(Math.abs(t - HL.w1), Math.abs(t - HL.w2));
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      if (near < HL.wh) {
        // whip pan: render the location into a buffer and smear it across the frame
        const wt = Math.abs(t - HL.w1) < HL.wh ? HL.w1 : HL.w2, u = (t - wt) / HL.wh;
        const g = st.A.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0);
        hlLoc(g, st, loc, t);
        const shift = u < 0 ? -E.inQ(u + 1) * 1500 : (1 - E.outQ(u)) * 1500, blur = 60 + 1500 * (1 - Math.abs(u)) * (u < 0 ? E.inQ(u + 1) : 1 - E.outQ(u));
        hlWhip(c, st.A, shift, blur);
      } else {
        c.save(); c.translate(960 + jx, 540 + jy); c.rotate(jr); c.scale(1.012, 1.012); c.translate(-960, -540);
        hlLoc(c, st, loc, t);
        c.restore();
      }
      const fl = hash(f * 0.77 + 3) - 0.5;
      c.fillStyle = fl > 0 ? `rgba(255,255,255,${fl * 0.03})` : `rgba(0,0,0,${-fl * 0.04})`; c.fillRect(0, 0, W, H);
      vignette(c, W, H, 0.4);
      // the camera report: clock racing, location, interval
      const tod = hlTod(t), mins = Math.floor(16 * 60 + 40 + tod * 330);
      const clock = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
      const place = ['MIDTOWN AVENUE', 'RIVER BRIDGE', 'DOWNTOWN'][loc];
      const ha = 1 - E.outQ(seg(t, HL.title - 0.2, HL.title + 0.3)) * 0.4;
      c.save(); c.globalAlpha = ha;
      c.fillStyle = '#ff3a2a'; c.beginPath(); c.arc(78, 1010, 9, 0, TAU); c.fill();
      text(c, clock, 100, 1021, { font: HLM, weight: 600, size: 34, color: '#ffffff', ls: 2 });
      text(c, place, 230, 1019, { font: HLM, weight: 500, size: 24, color: 'rgba(255,255,255,0.8)', ls: 5 });
      text(c, '1 FRAME / 2 S · ×1980', W - 70, 1019, { font: HLM, weight: 500, size: 24, align: 'right', color: 'rgba(255,255,255,0.8)', ls: 3 });
      c.restore();
      // title: the letters arrive with streaks and their spacing compresses, like the hours
      if (t >= HL.title) {
        const u = seg(t, HL.title, HL.title + 0.9), a = E.outQ(seg(t, HL.title, HL.title + 0.35)), ls = lerp(110, 26, E.outQt(u));
        const band = c.createLinearGradient(0, 250, 0, 610); band.addColorStop(0, 'rgba(4,6,18,0)'); band.addColorStop(0.45, `rgba(4,6,18,${0.6 * a})`); band.addColorStop(0.8, `rgba(4,6,18,${0.6 * a})`); band.addColorStop(1, 'rgba(4,6,18,0)');
        c.fillStyle = band; c.fillRect(0, 250, W, 400);
        for (let k = 5; k >= 1; k--) { c.globalAlpha = a * 0.12 * (1 - u) * (6 - k) / 5; text(c, 'HYPERLAPSE', 960 + ls * 0.5 - k * 70 * (1 - E.outQ(u)), 500, { font: HLF, weight: 600, size: 200, align: 'center', color: '#ffd8a8', ls }); }
        c.globalAlpha = a;
        text(c, 'HYPERLAPSE', 960 + ls * 0.5, 500, { font: HLF, weight: 600, size: 200, align: 'center', color: '#ffffff', ls });
        c.globalAlpha = E.outQ(seg(t, HL.sub, HL.sub + 0.4));
        c.fillStyle = '#ff8a3a'; c.fillRect(960 - 330 * c.globalAlpha, 534, 660 * c.globalAlpha, 4);
        text(c, 'MOVING TIME-LAPSE · 2011 —', 960 + 4, 590, { font: HLF, weight: 300, size: 40, align: 'center', color: '#f2efe8', ls: 8 });
        c.globalAlpha = 1;
      }
    },
    score(A) {
      A.bus.gain.value = 0.85;
      const B = 0.5;
      // city bed: traffic rush that filters with each location
      A.noise(0, { type: 'lowpass', f: 900, dur: HL.w1, g: 0.08, hold: true, rel: 0.1 });
      A.noise(HL.w1, { type: 'bandpass', f: 500, q: 0.4, dur: HL.w2 - HL.w1, g: 0.07, hold: true, rel: 0.1 });
      A.noise(HL.w2, { type: 'lowpass', f: 1400, dur: 10 - HL.w2, g: 0.07, hold: true, rel: 0.3 });
      // pulse: four-on-the-floor at 120 with an off-beat hat
      for (let k = 0; k < 20; k++) {
        const tt = k * B;
        if (Math.abs(tt - HL.w1) < 0.2 || Math.abs(tt - HL.w2) < 0.2) continue;
        if (tt < 9.0 || k === 18) A.kick(tt, k < 2 ? 0.4 : 0.65);
        A.hat(tt + B / 2, 0.06, k % 4 === 3);
        if (k % 2 === 1 && tt < 9) A.clap(tt, 0.12);
      }
      // a ticking arpeggio — the shutter interval — in a mixolydian loop
      const prog = [[57, 61, 64, 68], [54, 57, 61, 64], [62, 66, 69, 73], [59, 62, 66, 69], [57, 61, 64, 68]];
      for (let k = 0; k < 80; k++) {
        const tt = k * B / 4, ch = prog[Math.min(4, Math.floor(tt / 2))];
        if (tt > 9.4) break;
        A.pluck(tt, midi(ch[k % 4] + (k % 8 >= 4 ? 12 : 0)), { dur: 0.3, g: 0.11, bright: 0.8, decay: 0.98, pan: (k % 2 ? 0.3 : -0.3) });
      }
      prog.forEach((ch, i) => A.chord(i * 2, ch.map(m => m - 12), { type: 'sawtooth', dur: 2, g: 0.018, lp: 900 + i * 400, a: 0.3, hold: true, rel: 0.4, spread: 9, width: 0.8, rev: 0.4 }));
      [45, 42, 50, 47, 45].forEach((m, i) => A.osc(i * 2, { type: 'triangle', f: midi(m - 12), dur: 2, g: 0.15, hold: true, rel: 0.2 }));
      // whip pans: riser, swish and a sub drop on the cut
      [HL.w1, HL.w2].forEach(w => {
        A.riser(w - 1.0, 0.95, { g: 0.08, f: 220 });
        A.whoosh(w - HL.wh, HL.wh * 2.2, { f1: 300, f2: 5000, g: 0.3, swell: 0.5 });
        A.osc(w, { f: 60, f2: 32, glide: 0.5, dur: 0.6, g: 0.4 });
      });
      // bridge: cables ticking past, gulls over the water
      for (let k = 0; k < 18; k++) A.noise(HL.w1 + 0.2 + k * 0.18, { type: 'bandpass', f: 3200, q: 8, dur: 0.02, g: 0.03, pan: k % 2 ? 0.5 : -0.5 });
      [4.3, 5.6].forEach(tt => A.osc(tt, { type: 'sine', f: 1900, f2: 1300, dur: 0.3, g: 0.025, rev: 0.6 }));
      // downtown: horns, passing whooshes, the push settles
      A.osc(7.6, { type: 'square', f: 392, dur: 0.25, g: 0.02, lp: 1200, hold: true, rev: 0.4 }); A.osc(7.6, { type: 'square', f: 494, dur: 0.25, g: 0.015, lp: 1200, hold: true, rev: 0.4 });
      for (let k = 0; k < 6; k++) A.whoosh(7.3 + k * 0.42, 0.4, { f1: 600, f2: 2400, g: 0.05, pan: k % 2 ? 0.7 : -0.7 });
      // title: tape-stop style down-glide, then the resolving chord
      A.osc(HL.title - 0.1, { type: 'sawtooth', f: 880, f2: 220, glide: 0.4, dur: 0.45, g: 0.04, lp: 3000 });
      A.chord(HL.title, [45, 52, 57, 61, 64, 69], { type: 'sawtooth', dur: 1.7, g: 0.03, lp: 2600, a: 0.04, hold: true, rel: 0.6, spread: 10, width: 0.9, rev: 0.6 });
      A.impact(HL.title, 0.5);
      A.bell(HL.sub, midi(81), { g: 0.06, dur: 1.2, rev: 0.6 });
    },
  });
  /* =====================================================================
     HIGH CONTRAST CINEMA — no greys at all: a man in a trench coat walks
     into a lamp's white cone on a rain-black street; a profile close-up
     cut from pure white and pure black; an overhead crossing of black
     umbrellas on a blown-white street, and one red umbrella walking
     against the crowd; a single lightning strike lights the skyline, and
     the title holds over the rain with the red still burning
     ===================================================================== */
  const HC = { s2: 2.5, s3: 4.6, s4: 6.8, bolt: 7.05, title: 8.35, sub: 8.8 };
  const HCF = 'Anton, Impact, "Arial Narrow", sans-serif';
  const HC_RED = '#e0141e';
  // Rain is drawn with 'difference': white over black, black over white — always graphic, never grey.
  function hcRain(g, R, t, o = {}) {
    const ang = o.ang ?? 0.16, n = o.n ?? R.length, sp = o.sp ?? 2600;
    g.save(); g.globalCompositeOperation = 'difference'; g.strokeStyle = '#fff'; g.lineCap = 'butt';
    for (let i = 0; i < n; i++) {
      const d = R[i], y = ((d.y + t * sp * d.v) % 1300) - 110, x = ((d.x + y * ang) % 2000 + 2000) % 2000 - 40;
      g.lineWidth = d.w; g.beginPath(); g.moveTo(x, y); g.lineTo(x + d.l * ang, y + d.l); g.stroke();
    }
    g.restore();
  }
  function hcCaption(g, s, x, y, a, size = 46) {
    if (a <= 0) return;
    g.save(); g.globalAlpha = 1; font(g, size, HCF); const w = g.measureText(s).width + (s.length * 3);
    const k = E.outQ(a);
    g.fillStyle = '#fff'; g.fillRect(x - 6, y - size - 18, (w + 44) * k + 12, size + 48);
    g.fillStyle = '#000'; g.fillRect(x, y - size - 12, (w + 44) * k, size + 36);
    g.fillStyle = '#fff'; g.fillRect(x + 5, y - size - 7, (w + 44) * k - 10, size + 26);
    g.beginPath(); g.rect(x, y - size - 12, (w + 44) * k, size + 36); g.clip();
    text(g, s, x + 22, y + 8, { font: HCF, size, color: '#000', ls: 3 });
    g.restore();
  }
  const { font } = MG;
  // The man: hat, trench coat, a white rim drawn around the black — Frank Miller's inked outline.
  function hcMan(g, x, y, s, ph) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const l = Math.sin(ph) * 34;
    const body = () => {
      g.beginPath();
      // legs
      g.moveTo(-26, -150); g.lineTo(-30 + l, 0); g.lineTo(-6 + l, 0); g.lineTo(0, -140); g.lineTo(6 - l, 0); g.lineTo(30 - l, 0); g.lineTo(26, -150); g.closePath();
      // coat
      g.moveTo(-58, -330); g.lineTo(-74, -120); g.lineTo(-30 + l * 0.4, -110); g.lineTo(0, -126); g.lineTo(34 - l * 0.4, -108); g.lineTo(76, -124); g.lineTo(60, -330); g.quadraticCurveTo(0, -356, -58, -330); g.closePath();
      // head and hat
      g.moveTo(-24, -336); g.lineTo(-22, -380); g.lineTo(24, -380); g.lineTo(22, -336); g.closePath();
      g.moveTo(-62, -384); g.quadraticCurveTo(0, -400, 66, -380); g.lineTo(60, -370); g.quadraticCurveTo(0, -384, -58, -374); g.closePath();
      g.moveTo(-32, -388); g.lineTo(-28, -440); g.quadraticCurveTo(0, -452, 30, -440); g.lineTo(34, -388); g.closePath();
    };
    g.lineJoin = 'round'; g.strokeStyle = '#fff'; g.lineWidth = 7 / s; body(); g.stroke();
    g.fillStyle = '#000'; body(); g.fill();
    g.restore();
  }
  function hcShot1(g, st, t) {
    g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
    const z = 1 + 0.06 * E.ioS(t / HC.s2);
    g.save(); g.translate(1100, 600); g.scale(z, z); g.translate(-1100, -600);
    // tenements: black slabs, a few lit windows blown to white, fire escapes in white line
    [[0, 80, 520], [520, 220, 300], [1540, 40, 400]].forEach(([x, y, w], bi) => {
      g.fillStyle = '#000'; g.fillRect(x, y, w, 900);
      g.fillStyle = '#fff'; g.fillRect(x + w - 6, y, 6, 820);
      for (let r = 0; r < 9; r++) for (let c = 0; c < Math.floor(w / 90); c++) if (hash(bi * 97 + r * 13 + c) < 0.22) g.fillRect(x + 30 + c * 90, y + 50 + r * 82, 40, 52);
    });
    g.strokeStyle = '#fff'; g.lineWidth = 4;
    for (let k = 0; k < 5; k++) { const y = 220 + k * 130; g.beginPath(); g.moveTo(560, y); g.lineTo(800, y); g.moveTo(560, y); g.lineTo(800, y + 130); g.stroke(); for (let r = 0; r < 8; r++) { g.beginPath(); g.moveTo(560 + r * 34, y); g.lineTo(560 + r * 34, y - 30); g.stroke(); } }
    // the lamp's cone: one hard white shape
    g.fillStyle = '#fff';
    g.beginPath(); g.moveTo(1080, 316); g.lineTo(1130, 316); g.lineTo(1420, 900); g.lineTo(780, 900); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(1100, 905, 340, 46, 0, 0, TAU); g.fill();
    // wet street: black, with white reflections wobbling under the light and the windows
    g.fillStyle = '#000'; g.fillRect(-100, 950, 2200, 300);
    const f = Math.floor(t * 24);
    g.fillStyle = '#fff';
    for (let k = 0; k < 26; k++) { const y = 960 + k * 6 + k * k * 0.4, w = (260 - k * 7) * (0.7 + 0.3 * hash(k + f * 0.3)); g.fillRect(1100 - w + vnoise(k + t * 3, 2) * 20, y, w * 2, 2 + k * 0.15); }
    [180, 330, 1660, 1780].forEach((x, i) => { for (let k = 0; k < 8; k++) g.fillRect(x + vnoise(k + t * 4, i) * 10, 970 + k * 16, 34 - k * 3, 3); });
    // the pole and lamp head, black against the cone
    g.fillStyle = '#000'; g.fillRect(1250, 280, 22, 680); g.fillRect(1100, 280, 172, 14);
    g.beginPath(); g.moveTo(1070, 294); g.lineTo(1140, 294); g.lineTo(1124, 322); g.lineTo(1086, 322); g.closePath(); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(1250, 300, 22, 600);
    // the man walks in under the light
    const wx = lerp(560, 1040, E.outQ(seg(t, 0, HC.s2 + 0.3)));
    hcMan(g, wx, 920, 1.1, t * 7);
    g.restore();
    hcRain(g, st.R, t, { n: 320 });
    hcCaption(g, 'THE RAIN NEVER STOPS IN THIS TOWN.', 90, 130, seg(t, 0.4, 0.9));
  }
  function hcShot2(g, st, t) {
    const u = t - HC.s2;
    g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
    const z = 1 + 0.07 * E.ioS(u / 2.1), turn = E.ioS(seg(u, 0.9, 1.5));
    g.save(); g.translate(960, 560); g.scale(z, z); g.translate(-960 + turn * 18, -560);
    // the profile: only the lit front of the face exists, cut out in white
    g.fillStyle = '#fff';
    g.beginPath();
    g.moveTo(880, 360); g.lineTo(1078, 360); g.quadraticCurveTo(1114, 420, 1104, 480); g.quadraticCurveTo(1092, 500, 1104, 522); g.lineTo(1196 + turn * 6, 618);
    g.quadraticCurveTo(1170, 640, 1136, 644); g.quadraticCurveTo(1152, 668, 1146, 688); g.lineTo(1128, 702); g.quadraticCurveTo(1148, 720, 1138, 742);
    g.quadraticCurveTo(1112, 760, 1118, 790); g.quadraticCurveTo(1130, 832, 1090, 858); g.quadraticCurveTo(1010, 882, 940, 850); g.closePath(); g.fill();
    // shadow side carved back out in black: socket, cheekbone, jaw
    g.fillStyle = '#000';
    g.beginPath(); g.moveTo(850, 350); g.lineTo(985, 350); g.quadraticCurveTo(958, 470, 1012, 560); g.quadraticCurveTo(976, 650, 1034, 730); g.quadraticCurveTo(992, 800, 1004, 872); g.lineTo(850, 880); g.closePath(); g.fill();
    // the eye: a black almond with one white glint that widens as he looks up
    const gl = 2 + 5 * turn;
    g.beginPath(); g.moveTo(1040, 512); g.quadraticCurveTo(1062, 498, 1086, 510); g.quadraticCurveTo(1064, 524, 1040, 512); g.fill();
    g.fillRect(1030, 478, 74, 10);
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(1070, 510, gl, gl * 0.6, 0, 0, TAU); g.fill();
    // neck and collar
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(1010, 860); g.lineTo(1080, 850); g.lineTo(1110, 1080); g.lineTo(1040, 1080); g.closePath(); g.fill();
    g.fillStyle = '#000'; g.beginPath(); g.moveTo(760, 1080); g.lineTo(880, 900); g.lineTo(1060, 1000); g.lineTo(1210, 900); g.lineTo(1270, 1080); g.closePath(); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.moveTo(1060, 1000); g.lineTo(1210, 900); g.lineTo(1270, 1080); g.stroke();
    // hat brim slicing the frame, rim-lit along its edge
    g.fillStyle = '#000'; g.beginPath(); g.moveTo(420, 380); g.quadraticCurveTo(900, 290, 1380, 330); g.lineTo(1370, 360); g.quadraticCurveTo(900, 330, 430, 410); g.closePath(); g.fill();
    g.fillRect(620, 60, 600, 300);
    g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.moveTo(430, 410); g.quadraticCurveTo(900, 330, 1370, 360); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(1220, 60); g.lineTo(1214, 336); g.moveTo(620, 60); g.lineTo(626, 345); g.stroke();
    g.fillStyle = '#fff'; g.fillRect(622, 300, 596, 10);
    // drips running off the brim
    g.fillStyle = '#fff';
    for (let k = 0; k < 7; k++) { const x = 520 + k * 130, ph = (u * 1.6 + hash(k)) % 1, y = 400 - (x - 430) * 0.06 + ph * ph * 700; g.fillRect(x, y, 4, 22 + ph * 30); }
    g.restore();
    hcRain(g, st.R, t, { n: 220, sp: 3000 });
    hcCaption(g, 'THEN I SAW HER.', 1290, 980, seg(t, HC.s2 + 0.9, HC.s2 + 1.3), 52);
  }
  function hcUmbrella(g, x, y, r, rot, red) {
    g.save(); g.translate(x, y); g.rotate(rot);
    const poly = () => { g.beginPath(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); };
    if (!red) { g.strokeStyle = '#fff'; g.lineWidth = 8; poly(); g.stroke(); }
    g.fillStyle = red ? HC_RED : '#000'; poly(); g.fill();
    g.strokeStyle = red ? '#7a0008' : '#fff'; g.lineWidth = red ? 3 : 2;
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); g.stroke(); }
    if (red) { const gr = g.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r); gr.addColorStop(0, 'rgba(255,120,110,0.5)'); gr.addColorStop(1, 'rgba(90,0,0,0.35)'); g.fillStyle = gr; poly(); g.fill(); }
    g.fillStyle = red ? '#300' : '#fff'; g.beginPath(); g.arc(0, 0, 6, 0, TAU); g.fill();
    g.restore();
  }
  function hcShot3(g, st, t) {
    const u = t - HC.s3, cy = 40 * u;
    // the street from above, blown out to white by the wet glare
    g.fillStyle = '#fff'; g.fillRect(0, 0, 1920, 1080);
    g.save(); g.translate(0, cy);
    g.fillStyle = '#000';
    for (let k = 0; k < 12; k++) g.fillRect(80 + k * 160, 300, 84, 520);
    g.fillRect(0, 230, 1920, 10); g.fillRect(0, 890, 1920, 10);
    // splash rings opening on the white
    g.strokeStyle = '#000';
    for (let k = 0; k < 40; k++) { const ph = (u * 1.8 + hash(k * 3.3)) % 1, b = Math.floor(u * 1.8 + hash(k * 3.3)), x = hash(k + b * 7.1) * 1920, y = hash(k * 1.7 + b * 3.9) * 1200 - 60; g.lineWidth = 3 * (1 - ph); g.beginPath(); g.ellipse(x, y, 6 + ph * 40, 4 + ph * 28, 0, 0, TAU); g.stroke(); }
    // the crowd crossing in two streams, all black umbrellas
    st.U.forEach(p => { const x = ((p.x + p.v * u) % 2300 + 2300) % 2300 - 190; hcUmbrella(g, x, p.y + Math.sin(u * 5 + p.x) * 3, p.r, p.rot + u * p.spin, false); });
    g.restore();
    // overhead rain: short strokes falling toward the lens, splayed from the centre
    g.save(); g.globalCompositeOperation = 'difference'; g.strokeStyle = '#fff';
    st.R.forEach((d, i) => { if (i > 200) return; const ph = (u * 3 * d.v + d.x / 2000) % 1, a = d.y / 1300 * TAU, rr = 80 + ph * 1100, x = 960 + Math.cos(a) * rr, y = 540 + Math.sin(a) * rr * 0.62, l = 10 + ph * 50; g.lineWidth = d.w * (0.5 + ph); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.62); g.stroke(); });
    g.restore();
    // one red umbrella, walking against the flow, straight up the crossing
    const ry = lerp(1250, 470, E.outQ(seg(u, 0, 2.0)));
    hcUmbrella(g, 1000 + Math.sin(u * 6) * 4, ry, 104, 0.2 + u * 0.15, true);
    hcCaption(g, 'RED. THE ONLY COLOUR LEFT IN THIS CITY.', 90, 130, seg(t, HC.s3 + 0.7, HC.s3 + 1.1));
  }
  function hcShot4(g, st, t) {
    const u = t - HC.s4;
    // the lightning: sky goes white for a beat, then decays back to black
    const fl = t < HC.bolt ? 0 : t < HC.bolt + 0.1 ? 1 : Math.max(0, 1 - (t - HC.bolt - 0.1) / 0.3);
    const lit = fl > 0.5;
    g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
    if (fl > 0) { g.fillStyle = `rgba(255,255,255,${fl})`; g.fillRect(0, 0, 1920, 640); }
    const z = 1 + 0.05 * E.ioS(clamp(u / 3)), lift = 30 * E.ioS(clamp(u / 3));
    g.save(); g.translate(960, 640); g.scale(z, z); g.translate(-960, -640 + lift);
    if (lit) {
      // the bolt, inked black on the white sky
      g.strokeStyle = '#000'; g.lineWidth = 16; g.lineJoin = 'miter';
      g.beginPath(); st.bolt.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
      g.lineWidth = 7; g.beginPath(); st.bolt2.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    }
    // the skyline: black slabs, rim-lit and windowed in white; in the flash, pure silhouette
    st.sky.forEach(([x, w, h], i) => {
      g.fillStyle = '#000'; g.fillRect(x, 640 - h, w, h + 10);
      if (!lit) {
        g.fillStyle = '#fff'; g.fillRect(x, 640 - h, 3, h);
        for (let r = 0; r < h / 40 - 1; r++) for (let c = 0; c < w / 26 - 1; c++) if (hash(i * 31 + r * 7 + c) < 0.12) g.fillRect(x + 10 + c * 26, 640 - h + 16 + r * 40, 10, 16);
      }
    });
    // street: black, white reflections of the windows streaking down the wet asphalt
    g.fillStyle = '#000'; g.fillRect(-100, 640, 2200, 600);
    g.fillStyle = '#fff';
    for (let k = 0; k < 60; k++) { const x = hash(k * 4.4) * 1920, y = 660 + hash(k * 2.1) * 380, w = 30 + hash(k) * 120; g.fillRect(x + vnoise(t * 3 + k, 3) * 12, y, w * (y - 600) / 400, 3 + (y - 640) * 0.01); }
    g.fillRect(-100, 638, 2200, 4);
    // she walks away under the red umbrella
    const wy = 930 - 60 * E.outQ(clamp(u / 3.2)), ws = 1 - 0.25 * E.outQ(clamp(u / 3.2)), wx = 960;
    g.save(); g.translate(wx, wy); g.scale(ws, ws);
    const leg = Math.sin(t * 6) * 14;
    g.strokeStyle = '#fff'; g.lineWidth = 6; g.fillStyle = '#000';
    const her = () => { g.beginPath(); g.moveTo(-34, -190); g.lineTo(-52, -40); g.lineTo(-14 + leg, -40); g.lineTo(-16 + leg, 0); g.lineTo(-6 + leg, 0); g.lineTo(0, -40); g.lineTo(10 - leg, 0); g.lineTo(20 - leg, 0); g.lineTo(16 - leg, -40); g.lineTo(52, -40); g.lineTo(34, -190); g.closePath(); };
    her(); g.stroke(); her(); g.fill();
    g.beginPath(); g.moveTo(0, -200); g.lineTo(0, -270); g.stroke();
    g.fillStyle = HC_RED; g.beginPath(); g.moveTo(-150, -250); g.quadraticCurveTo(0, -360, 150, -250); for (let k = 5; k >= 0; k--) g.quadraticCurveTo(-150 + (k + 0.5) * 50, -236, -150 + k * 50, -250); g.closePath(); g.fill();
    g.restore();
    // her reflection, the only colour in the puddle
    g.save(); g.globalAlpha = 0.85; g.fillStyle = HC_RED;
    for (let k = 0; k < 7; k++) g.fillRect(wx - 110 * ws + vnoise(k + t * 4, 7) * 14, wy + 16 + k * 14, 220 * ws * (1 - k * 0.1), 5);
    g.restore();
    g.restore();
    hcRain(g, st.R, lit ? HC.bolt : t, { n: 360 });
  }

  MG.film({
    id: 'highcontrast', dur: 10, poster: 9.4,
    fonts: [['400 220px Anton', 'HIGH CONTRAST THE RAIN NEVER STOPS IN THIS TOWN. RED ONLY COLOUR LEFT CITY & · 1980 —']],
    meta: {
      family: 'H', name: 'High Contrast Cinema', sub: 'Black, White & One Spot Colour', era: '1980 —',
      origin: 'Black-and-white pushed until the greys disappear: blacks crushed solid, highlights blown out, the image reduced to ink and paper, often with a single colour left alive in the frame. Martin Scorsese shot Raging Bull (1980) in stark monochrome, Steven Spielberg let one girl\'s red coat burn through Schindler\'s List (1993), Robert Rodriguez and Frank Miller turned Miller\'s comics into Sin City (2005) with digital keying and selective colour, and George Miller re-graded Mad Max: Fury Road as the Black & Chrome Edition (2016).',
      works: 'Raging Bull (Martin Scorsese, 1980) · Rumble Fish (Francis Ford Coppola, 1983) · Schindler\'s List (Steven Spielberg, 1993) · Sin City (Robert Rodriguez & Frank Miller, 2005) · The Spirit (Frank Miller, 2008) · Mad Max: Fury Road — Black & Chrome (George Miller, 2016)',
      tech: ['Crushed blacks & clipped whites (no midtones)', 'Selective colour — one hue spared', 'Inked rim outlines & silhouettes', 'Rain as white streaks (difference blend)'],
      accent: HC_RED,
      motionDNA: 'Slow, deliberate push-ins and hard cuts like turning a page: a walk into a cone of light, a profile that barely turns, an overhead crowd flowing against one figure, and a single lightning beat that flips the sky before the title holds.',
      visualDNA: 'Pure black and pure white graphic shapes — lamp cones, window grids, a face carved by its shadow side, white-outlined silhouettes, slanting white rain and wet-street reflections — with one saturated red that stays in colour through every shot, plus comic-style narration boxes.',
      transitions: 'Hard cuts, a lightning flash, caption boxes',
      implementation: ['Green-screen + digital backlot (Sin City)', 'Power-window selective colour in DaVinci Resolve', 'Canvas 2D (two-tone vector, difference-blend rain)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const r = rng(2005), R = [], U = [], sky = [], bolt = [], bolt2 = [];
      for (let i = 0; i < 360; i++) R.push({ x: r() * 2000, y: r() * 1300, v: 0.6 + r() * 0.6, l: 40 + r() * 70, w: 1 + r() * 2.2 });
      for (let i = 0; i < 26; i++) { const lane = i % 2; U.push({ x: r() * 2300, y: lane ? 360 + r() * 160 : 620 + r() * 160, v: (lane ? 1 : -1) * (90 + r() * 70), r: 72 + r() * 26, rot: r(), spin: (r() - 0.5) * 0.4 }); }
      let x = -40; while (x < 1960) { const w = 80 + r() * 170, c = Math.abs(x - 960) < 420; sky.push([x, w, (c ? 220 : 120) + r() * (c ? 260 : 160)]); x += w - 4; }
      let bx = 1340, by = -10; bolt.push([bx, by]);
      while (by < 420) { bx += (r() - 0.5) * 90; by += 30 + r() * 40; bolt.push([bx, by]); if (by > 160 && !bolt2.length) bolt2.push([bx, by]); }
      for (let k = 0; k < 5; k++) { const p = bolt2[bolt2.length - 1]; bolt2.push([p[0] + 30 + r() * 40, p[1] + 25 + r() * 30]); }
      return { R, U, sky, bolt, bolt2 };
    },
    draw(c, t, W, H, st) {
      if (t < HC.s2) hcShot1(c, st, t);
      else if (t < HC.s3) hcShot2(c, st, t);
      else if (t < HC.s4) hcShot3(c, st, t);
      else hcShot4(c, st, t);
      // title: white slab type over the rain, the red bar the last spot of colour
      if (t >= HC.title) {
        const a = E.outQ(seg(t, HC.title, HC.title + 0.25)), s = lerp(1.08, 1, E.outQt(seg(t, HC.title, HC.title + 0.5)));
        c.save(); c.translate(960, 330); c.scale(s, s); c.globalAlpha = a;
        text(c, 'HIGH CONTRAST', 0, 0, { font: HCF, size: 210, align: 'center', color: '#fff', ls: 8 });
        c.restore();
        const b = E.outQt(seg(t, HC.sub - 0.2, HC.sub + 0.3));
        c.fillStyle = HC_RED; c.fillRect(960 - 360 * b, 372, 720 * b, 12);
        c.globalAlpha = E.outQ(seg(t, HC.sub, HC.sub + 0.4));
        text(c, 'BLACK & WHITE · ONE SPOT OF COLOUR · 1980 —', 960, 448, { font: HCF, size: 42, align: 'center', color: '#fff', ls: 7 });
        c.globalAlpha = 1;
      }
      grain(c, W, H, t, 0.045, 'overlay');
      // no vignette on the white shots: the whites stay clipped
      if (!(t >= HC.s3 && t < HC.s4) && !(t >= HC.bolt && t < HC.bolt + 0.3)) vignette(c, W, H, 0.35);
    },
    score(A) {
      A.bus.gain.value = 0.9;
      // rain bed for the whole film, heavier outside, lighter overhead
      A.noise(0, { type: 'bandpass', f: 2400, q: 0.4, dur: 10, g: 0.09, hold: true, rel: 0.4 });
      A.noise(0, { type: 'highpass', f: 6000, dur: 10, g: 0.04, hold: true, rel: 0.4 });
      A.noise(0.6, { type: 'lowpass', f: 160, dur: 2.6, g: 0.18, swell: 0.4 });
      // walking upright bass in D minor, brushes sweeping
      const bass = [38, 41, 45, 44, 43, 41, 40, 37, 38, 45, 43, 41];
      for (let k = 0; k < 12; k++) A.pluck(0.2 + k * 0.6, midi(bass[k] - 12), { dur: 0.7, g: 0.5, bright: 0.35, decay: 0.99 });
      for (let k = 0; k < 12; k++) { A.noise(0.2 + k * 0.6, { type: 'bandpass', f: 3500, q: 0.6, dur: 0.45, g: 0.035, swell: 0.6 }); if (k % 2) A.noise(0.5 + k * 0.6, { type: 'bandpass', f: 2200, q: 1, dur: 0.08, g: 0.05 }); }
      // footsteps in the puddles, shot one
      for (let k = 0; k < 6; k++) A.noise(0.25 + k * 0.42, { type: 'lowpass', f: 900, dur: 0.07, g: 0.12 });
      // a sax line, breathy and low
      [[0.8, 62, 0.9], [1.7, 65, 0.4], [2.1, 64, 0.5], [2.6, 62, 1.0], [3.7, 69, 0.8], [4.5, 68, 0.4]].forEach(([tt, m, d]) => {
        A.osc(tt, { type: 'sawtooth', f: midi(m), dur: d, g: 0.045, lp: 1300, vib: [4.5, 5], a: 0.06, hold: true, rel: 0.15, rev: 0.5 });
        A.noise(tt, { type: 'bandpass', f: midi(m) * 3, q: 4, dur: d, g: 0.012, hold: true });
      });
      // cut to the crossing: a high string swell and a celesta figure for the red umbrella
      A.chord(HC.s3, [74, 77, 81, 86], { type: 'sine', dur: 2.2, g: 0.025, a: 0.8, hold: true, rel: 0.5, vib: [5, 3], rev: 0.6, width: 0.6 });
      [86, 89, 93, 89, 86].forEach((m, i) => A.bell(HC.s3 + 0.3 + i * 0.3, midi(m), { g: 0.04, dur: 1.2, rev: 0.6 }));
      A.osc(HC.s3, { type: 'sine', f: midi(26), dur: 2.2, g: 0.15, a: 0.4, hold: true, rel: 0.4 });
      // lightning crack, then thunder rolling away
      A.noise(HC.bolt, { type: 'highpass', f: 1500, dur: 0.25, g: 0.45, rev: 0.6 });
      A.impact(HC.bolt + 0.05, 0.9, { rev: 0.7 });
      A.noise(HC.bolt + 0.2, { type: 'lowpass', f: 300, f2: 90, dur: 2.2, g: 0.35, swell: 0.2 });
      // title: low brass stab and a timpani hit, the sax answering
      A.chord(HC.title, [38, 45, 50, 53], { type: 'sawtooth', dur: 1.4, g: 0.04, lp: 1100, a: 0.02, hold: true, rel: 0.6, spread: 7, rev: 0.5, width: 0.7 });
      A.impact(HC.title, 0.7);
      A.osc(HC.sub + 0.1, { type: 'sawtooth', f: midi(62), dur: 1.0, g: 0.04, lp: 1400, vib: [4.5, 6], a: 0.08, hold: true, rel: 0.4, rev: 0.6 });
    },
  });
})();
