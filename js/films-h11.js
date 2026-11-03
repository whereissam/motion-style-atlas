/* batch h11 — Neon Signage · Split-flap Display · Concrete Poetry.
   neon (Family A: bent glass tubes, ignition flicker, sequenced arrow, a diver in three states, wet brick and rain) ·
   splitflap (Family B: Solari-style departure board, flaps falling over the hinge, rows clattering at their own speeds) ·
   concrete (Family B: Gomringer's silence, Apollinaire's rain, words that build a sea and a sun in white space). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, rrect, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Neonderthaw&family=Tilt+Neon&family=Archivo:wght@400;600;700&family=Barlow+Condensed:wght@500;600;700&family=Jost:wght@300;400;500;600&family=Courier+Prime&display=block');
  const PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  // Open polyline, optionally smoothed with quadratic curves through the midpoints.
  function trace(g, pts, sm) {
    g.moveTo(pts[0][0], pts[0][1]);
    if (!sm || pts.length < 3) { for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); return; }
    for (let i = 1; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1]; g.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
    g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
  }
  // Resample a polyline to points every `step` px; returns [{x, y, a, s}] with heading a and arc length s.
  function resample(pts, step) {
    const out = [];
    let s = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
      for (let d = (out.length ? (step - (s % step)) % step : 0); d < L; d += step) out.push({ x: x0 + Math.cos(a) * d, y: y0 + Math.sin(a) * d, a, s: s + d });
      s += L;
    }
    return out;
  }

  /* =====================================================================
     NEON — a roadside motel sign on a wet brick wall at night, after the
     Young Electric Sign Company's Las Vegas cabinets. It opens dark: rain,
     a cold streetlamp, the bent glass tubes grey and dead on their
     standoffs. The transformer clicks in and starts to buzz; the pink
     script stutters awake, the argon-blue capitals warm up letter by
     letter from a dim violet, the starburst twinkles, the chaser bulbs
     run round the cabinet and the sequenced arrow builds segment by
     segment toward the office door. A diver in three states leaps from
     her board into a turquoise pool, the red NO of NO VACANCY sputters,
     fails and dies, and the whole sign hums in the puddles below
   ===================================================================== */
  const NE = {
    brick: '#8a4634', brickD: '#6a3226', brickL: '#a35b43', mortar: '#6d655c', cab: '#1d4f50', cabD: '#123536', trim: '#d8c79c', cream: '#efe0bb',
    metal: '#6f727a', pave: '#3a3c43', pink: '#ff3f9e', blue: '#3fb2ff', red: '#ff3b24', yellow: '#ffbb3a', orange: '#ff6a2a', white: '#dff1ff',
    turq: '#27e6dc', green: '#5cff7c', magenta: '#ff63cf', star: '#ffe45e',
  };
  const NE_T = { hum: 0.55, script: 0.95, motel: 1.7, swash: 2.5, star: 2.75, bulbs: 3.2, arrow: 3.65, pool: 4.25, diver: 4.55, vac: 5.3, sputter: 6.6, dead: 8.05, cap: 8.4 };
  const NE_G = 880;                                                     // where the wall meets the wet pavement
  const NE_CAB = [[150, 118], [1090, 92], [1140, 300], [1100, 700], [180, 726], [112, 420]];
  const NE_ARROW = (() => {                                              // the arrow's bent centreline
    const pts = [[1150, 252], [1290, 252]];
    for (let k = 1; k <= 8; k++) { const a = -PI / 2 + k / 8 * PI / 2; pts.push([1290 + Math.cos(a) * 70, 322 + Math.sin(a) * 70]); }
    pts.push([1360, 560]);
    return pts;
  })();

  // How bright a tube is at time t. Neon strikes with a stutter of local flicker, argon/mercury
  // stutters then warms from a dim violet glow over a second; both shimmer faintly once lit.
  function neLvl(t, t0, seed, kind = 'neon') {
    if (t < t0) return 0;
    const u = t - t0, f = Math.floor(t * 30);
    if (u < 0.42) return hash(f * 1.37 + seed) < 0.25 + u * 1.6 ? 0.55 + 0.4 * hash(f + seed * 3.1) : 0.04;
    const sh = 0.95 + 0.05 * vnoise(t * 11, seed);
    return kind === 'argon' ? sh * (0.3 + 0.7 * E.outQ(clamp((u - 0.42) / 1.3))) : sh;
  }
  // the dying NO: steady, then a sputter that gets worse, then dark
  function neNo(t) {
    if (t < NE_T.vac) return 0;
    if (t < NE_T.sputter) return neLvl(t, NE_T.vac, 41);
    if (t >= NE_T.dead) return 0;
    const p = seg(t, NE_T.sputter, NE_T.dead), f = Math.floor(t * 20);
    return hash(f * 2.11 + 9) > 0.15 + p * 0.75 ? 0.5 + 0.5 * hash(f + 3) : 0.03;
  }

  // Tube shapes: text set in a monoline face, or bent paths (polylines and rings).
  function nePaint(g, S, col, mul = 1, core = false) {
    g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col; g.fillStyle = col;
    if (S.type === 'text') {
      g.font = S.font; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
      g.fillText(S.s, S.x, S.y);
      if (mul > 1) { g.lineWidth = S.w * (mul - 1); g.strokeText(S.s, S.x, S.y); }
      if (core) { g.globalCompositeOperation = 'destination-out'; g.lineWidth = S.erode; g.strokeText(S.s, S.x, S.y); g.globalCompositeOperation = 'source-over'; }
      return;
    }
    g.lineWidth = S.w * (core ? 0.34 : mul);
    S.paths.forEach(p => { g.beginPath(); if (p.c) g.arc(p.c[0], p.c[1], p.c[2], 0, TAU); else trace(g, p, S.sm); g.stroke(); });
  }
  function neBox(g, S) {
    if (S.type === 'text') {
      g.font = S.font; const m = g.measureText(S.s);
      return [S.x - m.width / 2, S.y - m.actualBoundingBoxAscent, m.width, m.actualBoundingBoxAscent + m.actualBoundingBoxDescent];
    }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    S.paths.forEach(p => (p.c ? [[p.c[0] - p.c[2], p.c[1] - p.c[2]], [p.c[0] + p.c[2], p.c[1] + p.c[2]]] : p).forEach(([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }));
    return [x0, y0, x1 - x0, y1 - y0];
  }
  // Pre-render one tube three ways: dead glass, the lit tube with its white-hot core, and a half-res halo.
  function neTube(S, col) {
    const ms = offscreen(4, 4).getContext('2d'), [bx, by, bw, bh] = neBox(ms, S), P = 130;
    const x0 = Math.floor(bx - P), y0 = Math.floor(by - P), w = Math.ceil(bw + 2 * P), h = Math.ceil(bh + 2 * P);
    const core = offscreen(w, h), cg = core.getContext('2d'); cg.translate(-x0, -y0); nePaint(cg, S, '#fff', 1, true);
    const K = offscreen(w, h), k = K.getContext('2d'); k.translate(-x0, -y0); nePaint(k, S, col);
    k.setTransform(1, 0, 0, 1, 0, 0); k.filter = 'blur(1.4px)'; k.globalAlpha = 0.92; k.drawImage(core, 0, 0); k.filter = 'none'; k.globalAlpha = 1;
    const U = offscreen(w, h), u = U.getContext('2d'); u.translate(-x0, -y0); nePaint(u, S, '#4a4652');
    u.setTransform(1, 0, 0, 1, 0, 0); u.globalAlpha = 0.28; u.drawImage(core, -1, -2); u.globalAlpha = 1;
    const G = offscreen(Math.ceil(w / 2), Math.ceil(h / 2)), gg = G.getContext('2d'); gg.scale(0.5, 0.5); gg.translate(-x0, -y0);
    [[3, 1.5, 0.9], [10, 2.4, 0.65], [26, 3.4, 0.5]].forEach(([b, m, a]) => { gg.filter = `blur(${b}px)`; gg.globalAlpha = a; nePaint(gg, S, col, m); });
    return { S, col, x0, y0, K, G, U };
  }
  // the little diver, a stick figure of tube: arms together over the head, local origin at the hips
  function neFigure(cx, cy, ang, k = 1.3) {
    const ca = Math.cos(ang) * k, sa = Math.sin(ang) * k, P = ([x, y]) => [cx + x * ca - y * sa, cy + x * sa + y * ca];
    return [
      [[-10, -42], [0, -108], [10, -42]].map(P),
      [[0, -44], [4, -14], [0, 12]].map(P),
      [[0, 12], [-7, 70]].map(P), [[0, 12], [7, 70]].map(P),
      { c: [...P([0, -64]), 15 * k] },
    ];
  }

  function nePaintWall(g, s, st) {
    const r = rng(1923);
    g.save(); g.scale(s, s);
    // running-bond brick, each brick its own clay
    g.fillStyle = NE.mortar; g.fillRect(0, 0, 1920, NE_G);
    for (let row = 0, y = -10; y < NE_G; row++, y += 34) {
      for (let x = (row % 2) * -48 - 20; x < 1920; x += 96) {
        const k = r();
        g.fillStyle = k < 0.25 ? NE.brickD : k > 0.82 ? NE.brickL : NE.brick;
        g.fillRect(x + 3, y + 3, 90, 28);
        g.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.12})`; g.fillRect(x + 3, y + 3 + 20 + r() * 6, 90, 4);
        for (let j = 0; j < 5; j++) { g.fillStyle = r() < 0.5 ? 'rgba(30,10,5,0.25)' : 'rgba(255,220,190,0.12)'; g.fillRect(x + 4 + r() * 86, y + 4 + r() * 24, 2 + r() * 4, 1 + r() * 3); }
      }
    }
    // a soot streak down the wall from a downpipe
    const sg = g.createLinearGradient(0, 0, 0, NE_G); sg.addColorStop(0, 'rgba(10,8,8,0.0)'); sg.addColorStop(1, 'rgba(10,8,8,0.35)');
    g.fillStyle = sg; g.fillRect(0, 0, 1920, NE_G);
    // pavement and kerb
    g.fillStyle = '#58595f'; g.fillRect(0, NE_G - 8, 1920, 16);
    const pg = g.createLinearGradient(0, NE_G, 0, 1080); pg.addColorStop(0, '#4a4b52'); pg.addColorStop(1, NE.pave);
    g.fillStyle = pg; g.fillRect(0, NE_G + 8, 1920, 1080 - NE_G);
    for (let k = 0; k < 2200; k++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.04 + r() * 0.06})`; g.fillRect(r() * 1920, NE_G + 8 + r() * 200, 2, 2); }
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2;
    [300, 820, 1380].forEach(x => { g.beginPath(); g.moveTo(x, NE_G + 8); g.lineTo(x - 140, 1080); g.stroke(); });
    // the office door, warm light behind its glass
    g.fillStyle = '#2a1a12'; g.fillRect(1270, 712, 180, 170);
    const dg = g.createLinearGradient(0, 730, 0, 870); dg.addColorStop(0, '#f2c27a'); dg.addColorStop(1, '#b8702e');
    g.fillStyle = dg; g.fillRect(1290, 730, 140, 100);
    g.fillStyle = '#3b2619'; g.fillRect(1290, 830, 140, 50); g.fillRect(1290, 790, 140, 5);
    g.font = '700 22px Archivo'; g.textAlign = 'center'; g.fillStyle = '#5a2a16'; g.fillText('OFFICE', 1360, 770);
    // the transformer box and its conduit up into the cabinet
    g.fillStyle = '#5b5e64'; g.fillRect(50, 770, 104, 86); g.fillStyle = '#44464c'; g.fillRect(50, 842, 104, 14);
    g.fillStyle = '#c9b25a'; g.fillRect(64, 784, 40, 18); g.font = '700 13px Archivo'; g.textAlign = 'left'; g.fillStyle = '#222'; g.fillText('15 kV', 68, 798);
    g.strokeStyle = '#4c4f55'; g.lineWidth = 9; g.beginPath(); g.moveTo(130, 770); g.lineTo(130, 740); g.lineTo(230, 718); g.stroke();
    // the cabinet: a Googie sheet-metal slab with depth, trim and rivets
    const poly = (pts, dx = 0, dy = 0) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x + dx, y + dy) : g.moveTo(x + dx, y + dy))); g.closePath(); };
    g.fillStyle = 'rgba(0,0,0,0.45)'; poly(NE_CAB, 18, 26); g.fill();
    g.fillStyle = NE.cabD; poly(NE_CAB, 9, 12); g.fill();
    const cg = g.createLinearGradient(0, 90, 0, 730); cg.addColorStop(0, '#24605f'); cg.addColorStop(1, NE.cab);
    g.fillStyle = cg; poly(NE_CAB); g.fill();
    g.strokeStyle = NE.trim; g.lineWidth = 10; g.stroke();
    g.strokeStyle = '#8f8366'; g.lineWidth = 2; poly(NE_CAB.map(([x, y]) => [lerp(x, 630, 0.035), lerp(y, 410, 0.07)])); g.stroke();
    // a painted band across the foot of the cabinet
    g.fillStyle = NE.cream; g.beginPath(); g.moveTo(232, 640); g.lineTo(1062, 624); g.lineTo(1066, 676); g.lineTo(236, 692); g.closePath(); g.fill();
    g.save(); g.translate(649, 669); g.rotate(-0.019); g.font = '700 28px Archivo'; g.textAlign = 'center'; g.fillStyle = '#8c2a1c';
    if ('letterSpacing' in g) g.letterSpacing = '3px';
    g.fillText('AIR COOLED  ·  COLOR TV  ·  WEEKLY RATES', 4, 0); if ('letterSpacing' in g) g.letterSpacing = '0px'; g.restore();
    // raceways for the open-tube work on the right, hung off the bricks on brackets
    g.fillStyle = '#3d4047';
    g.fillRect(1540, 122, 300, 20); g.fillRect(1486, 742, 396, 92);
    g.fillStyle = '#2b2d33'; g.fillRect(1486, 822, 396, 12);
    [[1570, 84, 1570, 122], [1810, 84, 1810, 122], [1520, 700, 1520, 742], [1850, 700, 1850, 742]].forEach(([a, b, c2, d]) => { g.fillStyle = '#2f3137'; g.fillRect(a - 4, b, 8, d - b); });
    // chaser bulb sockets round the cabinet and down the arrow
    st.bulbs.forEach(b => { g.fillStyle = '#1b1b1f'; g.beginPath(); g.arc(b.x, b.y, 10, 0, TAU); g.fill(); g.fillStyle = 'rgba(230,220,200,0.35)'; g.beginPath(); g.arc(b.x - 1.5, b.y - 1.5, 6, 0, TAU); g.fill(); });
    // electrodes and glass standoffs at the ends of the bent-tube work
    st.els.forEach(e => {
      if (e.S.type !== 'path') return;
      e.S.paths.forEach(p => {
        if (p.c) return;
        [p[0], p[p.length - 1]].forEach(([x, y]) => { g.fillStyle = '#26262b'; g.beginPath(); g.arc(x, y, 8, 0, TAU); g.fill(); g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6, y + 16); g.stroke(); });
        resample(p, 120).forEach((q, i) => { if (i) { g.fillStyle = 'rgba(200,210,220,0.5)'; g.beginPath(); g.arc(q.x + 3, q.y + 4, 3, 0, TAU); g.fill(); } });
      });
    });
    g.restore();
  }

  MG.film({
    id: 'neon', dur: 10, poster: 9.2,
    fonts: [['400 250px Neonderthaw', 'Starlight'], ['400 160px "Tilt Neon"', 'MOTELPNVAC'], ['700 34px Archivo', 'AIR COOLED·TVWEKYRS'], ['400 26px Archivo', 'Neon signage, bent glass noble gas 15,000 volts']],
    meta: {
      family: 'A', name: 'Neon Signage', sub: 'Bent Glass, Noble Gas, Night', era: '1923 — 1965',
      origin: 'Neon signs are hand-bent glass tubes filled with low-pressure gas and lit by a high-voltage transformer: neon glows red-orange, argon with a drop of mercury glows blue, and phosphor coatings give every other colour. Georges Claude showed the first neon tubes in Paris in 1910 and the signs reached America in 1923; by the 1950s the Young Electric Sign Company had turned Las Vegas into a street of animated cabinets, chaser bulbs and sequenced arrows, and Hong Kong’s Nathan Road hung its signs in canyons over the traffic. The Neon Museum in Las Vegas now keeps the retired ones.',
      works: 'Neon tube lighting (Georges Claude, Paris Motor Show, 1910) · Vegas Vic (Young Electric Sign Company, 1951) · Welcome to Fabulous Las Vegas sign (Betty Willis, 1959) · The Neon Museum, Las Vegas (opened 2012)',
      tech: ['Pre-blurred tube halos', 'Seeded ignition flicker', 'Sliced puddle reflection'],
      accent: '#ff3f9e',
      motionDNA: 'Nothing slides: light is the only thing that moves. Tubes strike with a stutter and argon warms up slowly, chaser bulbs step round the cabinet, the arrow builds segment by segment and blanks, a three-state figure jumps between fixed poses, a faulty tube sputters and dies, while rain falls and the reflections ripple in the puddles.',
      visualDNA: 'Saturated pink, argon blue, red, yellow and turquoise light with white-hot tube cores and wide soft halos, against wet red brick and dark pavement; script and block lettering in a single continuous tube, electrodes and glass standoffs, a painted Googie sheet-metal cabinet ringed with incandescent bulbs.',
      transitions: 'Element-by-element ignition, sequenced arrow chase, three-state flasher animation, failing-tube sputter',
      implementation: ['Hand-bent glass tube, GTO wire and flasher drums', 'After Effects glow + Saber on traced lettering', 'Canvas 2D (offscreen halo sprites, light spill multiplied into an albedo map)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const els = [], add = (S, col, lvl) => { const e = neTube(S, col); e.lvl = lvl; els.push(e); return e; };
      add({ type: 'text', s: 'Starlight', x: 650, y: 390, font: '400 210px Neonderthaw', w: 7, erode: 4 }, NE.pink, t => neLvl(t, NE_T.script, 3));
      // MOTEL letter by letter, so each capital can strike and warm on its own
      const mg = offscreen(4, 4).getContext('2d'), mf = '400 158px "Tilt Neon"', ls = 26;
      mg.font = mf;
      const ws = [...'MOTEL'].map(ch => mg.measureText(ch).width), tw = ws.reduce((a, b) => a + b, 0) + ls * 4;
      let mx = 636 - tw / 2;
      [...'MOTEL'].forEach((ch, i) => { add({ type: 'text', s: ch, x: mx + ws[i] / 2, y: 590, font: mf, w: 14, erode: 9 }, NE.blue, t => neLvl(t, NE_T.motel + i * 0.17, 11 + i, 'argon')); mx += ws[i] + ls; });
      add({ type: 'path', sm: true, w: 9, paths: [[[318, 446], [470, 462], [720, 456], [930, 438], [1010, 410], [1000, 380], [960, 392], [952, 420]]] }, NE.pink, t => neLvl(t, NE_T.swash, 7));
      // the starburst: two interleaved sets of rays that twinkle against each other
      [0, 1].forEach(j => {
        const paths = [];
        for (let k = j; k < 12; k += 2) { const a = k / 12 * TAU - PI / 2, R = k % 4 < 2 ? 64 : 40; paths.push([[226 + Math.cos(a) * 17, 192 + Math.sin(a) * 17], [226 + Math.cos(a) * R, 192 + Math.sin(a) * R]]); }
        if (!j) paths.push({ c: [226, 192, 8] });
        add({ type: 'path', w: 7, paths }, NE.star, t => (t < NE_T.star ? 0 : neLvl(t, NE_T.star + j * 0.1, 21 + j) * (t < NE_T.star + 0.8 ? 1 : 0.35 + 0.65 * (Math.floor(t * 2.5) % 2 === j ? 1 : 0))));
      });
      // the sequenced arrow: five shaft sections in a double tube, then three chevrons
      const cl = resample(NE_ARROW, 4), L = cl[cl.length - 1].s;
      for (let k = 0; k < 5; k++) {
        const part = cl.filter(q => q.s >= k / 5 * L + 6 && q.s <= (k + 1) / 5 * L - 6);
        const side = sd => part.map(q => [q.x - Math.sin(q.a) * 22 * sd, q.y + Math.cos(q.a) * 22 * sd]);
        add({ type: 'path', w: 9, paths: [side(1), side(-1)] }, NE.yellow, t => { if (t < NE_T.arrow) return 0; const ph = ((t - NE_T.arrow) / 1.6) % 1; return ph >= k * 0.08 && ph < 0.88 ? neLvl(t, NE_T.arrow, 30 + k) : 0; });
      }
      for (let j = 0; j < 3; j++) {
        const y = 596 + j * 38;
        add({ type: 'path', w: 10, paths: [[[1290, y - 36], [1360, y + 10], [1430, y - 36]]] }, NE.orange, t => { if (t < NE_T.arrow) return 0; const ph = ((t - NE_T.arrow) / 1.6) % 1; return ph >= 0.44 + j * 0.1 && ph < 0.88 ? 1 : 0; });
      }
      // the pool: lettering, board, water, then the diver in three states and her splash
      add({ type: 'text', s: 'POOL', x: 1690, y: 168, font: '400 104px "Tilt Neon"', w: 11, erode: 6 }, NE.green, t => neLvl(t, NE_T.pool, 51));
      add({ type: 'path', w: 9, paths: [[[1484, 430], [1652, 430]], [[1500, 430], [1500, 616]]] }, NE.white, t => neLvl(t, NE_T.pool + 0.15, 52, 'argon'));
      const wave = (y, ph) => { const p = []; for (let x = 1484; x <= 1876; x += 14) p.push([x, y + 9 * Math.sin(x * 0.045 + ph)]); return p; };
      add({ type: 'path', sm: true, w: 8, paths: [wave(640, 0), wave(670, 1.6)] }, NE.turq, t => neLvl(t, NE_T.pool + 0.3, 53, 'argon'));
      const dstate = (t, k) => { if (t < NE_T.diver) return 0; const ph = ((t - NE_T.diver) / 1.5) % 1; return Math.floor(ph * 3) === k ? 1 : 0; };
      add({ type: 'path', w: 8, paths: neFigure(1628, 337, 0) }, NE.magenta, t => dstate(t, 0));
      add({ type: 'path', w: 8, paths: neFigure(1752, 246, 1.9) }, NE.magenta, t => dstate(t, 1));
      add({ type: 'path', w: 8, paths: neFigure(1802, 492, PI) }, NE.magenta, t => dstate(t, 2));
      add({ type: 'path', w: 6, paths: [[[1782, 628], [1756, 590]], [[1794, 620], [1788, 576]], [[1812, 620], [1818, 576]], [[1824, 628], [1850, 594]], { c: [1744, 566, 5] }, { c: [1862, 568, 5] }] }, NE.turq,
        t => { if (t < NE_T.diver) return 0; const ph = ((t - NE_T.diver) / 1.5) % 1; return ph > 0.8 ? 1 : 0; });
      // NO VACANCY, and the NO is on its way out
      add({ type: 'text', s: 'NO', x: 1548, y: 812, font: '400 60px "Tilt Neon"', w: 7, erode: 3.5 }, NE.red, neNo);
      add({ type: 'text', s: 'VACANCY', x: 1734, y: 812, font: '400 60px "Tilt Neon"', w: 7, erode: 3.5 }, NE.red, t => neLvl(t, NE_T.vac + 0.12, 42));
      // chaser bulbs: inset round the cabinet, and down the arrow's spine
      const bulbs = [], cen = [630, 410];
      const ring = NE_CAB.map(([x, y]) => { const d = Math.hypot(x - cen[0], y - cen[1]); return [lerp(x, cen[0], 30 / d), lerp(y, cen[1], 30 / d)]; });
      resample([...ring, ring[0]], 42).forEach((q, i) => bulbs.push({ x: q.x, y: q.y, i, g: 0 }));
      resample(NE_ARROW, 34).forEach((q, i) => bulbs.push({ x: q.x, y: q.y, i, g: 1 }));
      const st = { els, bulbs };
      // the wall at full light (albedo, half res) and at night (ambient, full res)
      const A = offscreen(1920, 1080); nePaintWall(A.getContext('2d'), 1, st);
      const alb = offscreen(960, 540); alb.getContext('2d').drawImage(A, 0, 0, 960, 540);
      const amb = offscreen(1920, 1080), ag = amb.getContext('2d');
      ag.drawImage(A, 0, 0);
      const lm = offscreen(1920, 1080), lg = lm.getContext('2d');
      lg.fillStyle = '#14151d'; lg.fillRect(0, 0, 1920, 1080);
      const sl = lg.createRadialGradient(1700, -160, 40, 1700, -160, 1300); sl.addColorStop(0, 'rgba(120,140,190,0.55)'); sl.addColorStop(1, 'rgba(120,140,190,0)');
      lg.globalCompositeOperation = 'lighter'; lg.fillStyle = sl; lg.fillRect(0, 0, 1920, 1080);
      const dl = lg.createRadialGradient(1360, 790, 10, 1360, 790, 260); dl.addColorStop(0, 'rgba(255,190,120,0.55)'); dl.addColorStop(1, 'rgba(255,190,120,0)');
      lg.fillStyle = dl; lg.fillRect(1000, 500, 720, 580);
      ag.globalCompositeOperation = 'multiply'; ag.drawImage(lm, 0, 0); ag.globalCompositeOperation = 'source-over';
      // the door glass glows on its own
      ag.globalAlpha = 0.85; ag.drawImage(A, 1290, 730, 140, 100, 1290, 730, 140, 100); ag.globalAlpha = 1;
      // a lit bulb sprite
      const bulb = offscreen(96, 96), bg = bulb.getContext('2d'), br = bg.createRadialGradient(48, 48, 0, 48, 48, 48);
      br.addColorStop(0, 'rgba(255,250,230,1)'); br.addColorStop(0.14, 'rgba(255,226,150,0.95)'); br.addColorStop(0.3, 'rgba(255,170,60,0.35)'); br.addColorStop(1, 'rgba(255,140,40,0)');
      bg.fillStyle = br; bg.fillRect(0, 0, 96, 96);
      // puddles on the pavement, where the reflection is sharp
      const pud = offscreen(960, 100), pdg = pud.getContext('2d'), r = rng(77);
      pdg.fillStyle = 'rgba(255,255,255,0.28)'; pdg.fillRect(0, 0, 960, 100);
      for (let k = 0; k < 16; k++) { const x = r() * 960, y = r() * 100, rx = 60 + r() * 160, ry = 6 + r() * 16, gg = pdg.createRadialGradient(x, y, 0, x, y, rx); gg.addColorStop(0, 'rgba(255,255,255,0.95)'); gg.addColorStop(0.7, 'rgba(255,255,255,0.7)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); pdg.save(); pdg.translate(x, y); pdg.scale(1, ry / rx); pdg.translate(-x, -y); pdg.fillStyle = gg; pdg.fillRect(x - rx, y - rx, rx * 2, rx * 2); pdg.restore(); }
      return { ...st, alb, amb, bulb, pud, L: offscreen(960, 540), m1: offscreen(240, 135), m2: offscreen(60, 34), S: offscreen(480, 270), R: offscreen(960, 100) };
    },
    draw(c, t, W, H, st) {
      const z = 1 + 0.035 * E.ioS(seg(t, 0, 10));
      c.save(); c.translate(960, 560); c.scale(z, z); c.translate(-960, -560);
      c.drawImage(st.amb, 0, 0);
      // light levels this frame
      st.els.forEach(e => { e.l = e.lvl(t); });
      const bon = b => {
        if (b.g === 0) { if (t < NE_T.bulbs) return 0; const u = t - NE_T.bulbs; return u < 0.3 ? E.outQ(u / 0.3) * 0.6 : ((b.i + Math.floor(u * 9)) % 4 ? 1 : 0.12); }
        if (t < NE_T.arrow) return 0;
        const ph = ((t - NE_T.arrow) / 1.6) % 1;
        return ph < 0.88 && (b.i - Math.floor(t * 14)) % 3 === 0 ? 1 : 0.08;
      };
      // the half-res light layer: every halo and tube, for spill and reflections
      const L = st.L, lg = L.getContext('2d');
      lg.globalCompositeOperation = 'source-over'; lg.fillStyle = '#000'; lg.fillRect(0, 0, 960, 540);
      lg.globalCompositeOperation = 'lighter';
      st.els.forEach(e => { if (e.l <= 0.01) return; lg.globalAlpha = e.l; lg.drawImage(e.G, e.x0 / 2, e.y0 / 2); lg.drawImage(e.K, e.x0 / 2, e.y0 / 2, e.K.width / 2, e.K.height / 2); });
      st.bulbs.forEach(b => { const v = bon(b); if (v > 0.1) { lg.globalAlpha = v; lg.drawImage(st.bulb, b.x / 2 - 24, b.y / 2 - 24, 48, 48); } });
      lg.globalAlpha = 1;
      // light spill: blur the light layer right down, then multiply it into the wall's albedo
      const m1 = st.m1.getContext('2d'), m2 = st.m2.getContext('2d'), S = st.S.getContext('2d');
      m1.drawImage(L, 0, 0, 240, 135); m2.drawImage(st.m1, 0, 0, 60, 34);
      S.globalCompositeOperation = 'source-over'; S.drawImage(st.m2, 0, 0, 480, 270);
      S.globalAlpha = 0.6; S.drawImage(st.m1, 0, 0, 480, 270); S.globalAlpha = 1;
      S.globalCompositeOperation = 'multiply'; S.drawImage(st.alb, 0, 0, 480, 270);
      c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) c.drawImage(st.S, 0, 0, 1920, 1080);
      c.globalCompositeOperation = 'source-over';
      // dead glass, then the lit tubes over it
      st.els.forEach(e => c.drawImage(e.U, e.x0, e.y0));
      c.globalCompositeOperation = 'lighter';
      st.els.forEach(e => {
        if (e.l <= 0.01) return;
        c.globalAlpha = Math.min(1, e.l * 0.9); c.drawImage(e.G, e.x0, e.y0, e.G.width * 2, e.G.height * 2);
        c.globalAlpha = Math.min(1, e.l * 1.1); c.drawImage(e.K, e.x0, e.y0);
      });
      st.bulbs.forEach(b => { const v = bon(b); if (v > 0.05) { c.globalAlpha = v; c.drawImage(st.bulb, b.x - 40, b.y - 40, 80, 80); } });
      c.globalAlpha = 1;
      // the wet pavement: the light layer flipped, squashed and rippled in slices, kept to the puddles
      const R = st.R, rg = R.getContext('2d');
      rg.globalCompositeOperation = 'source-over'; rg.clearRect(0, 0, 960, 100);
      for (let y = 0; y < 100; y++) {
        const d = y / 100, sy = NE_G / 2 - y / 0.34, xo = 5 * Math.sin(y * 0.55 + t * 7) * (0.3 + d) + 3 * vnoise(y * 0.3 + t * 4, 2);
        if (sy - 6 < 0) break;
        rg.drawImage(L, 0, sy - 3, 960, 3, xo, y, 960, 1);
      }
      rg.globalCompositeOperation = 'destination-in'; rg.drawImage(st.pud, 0, 0);
      c.globalAlpha = 0.75; c.drawImage(R, 0, NE_G + 2, 1920, 200); c.globalAlpha = 1;
      // rain: far fine streaks, near heavier ones caught in the light, rings in the puddles
      [[260, 0.1, 1.2, 1500, 26], [90, 0.2, 2, 2100, 54]].forEach(([n, a, lw, v, len], j) => {
        c.strokeStyle = `rgba(200,215,255,${a})`; c.lineWidth = lw; c.beginPath();
        for (let i = 0; i < n; i++) {
          const x = hash(i * 3.1 + j * 50) * 2100 - 90, sp = v * (0.85 + 0.3 * hash(i + j * 7)), y = ((hash(i * 1.7 + j) * 1300 + t * sp) % 1300) - 120;
          c.moveTo(x - y * 0.08, y); c.lineTo(x - (y + len) * 0.08, y + len);
        }
        c.stroke();
      });
      c.strokeStyle = 'rgba(220,230,255,0.22)'; c.lineWidth = 1.4; c.beginPath();
      for (let i = 0; i < 34; i++) {
        const per = 0.55 + hash(i * 4.3) * 0.4, u = ((t + hash(i) * per) / per) % 1, n = Math.floor((t + hash(i) * per) / per);
        const x = hash(i * 9.1 + n * 1.3) * 1920, y = NE_G + 20 + hash(i * 2.7 + n * 3.9) * 170, rr = 4 + u * 26 * (0.6 + (y - NE_G) / 200);
        c.moveTo(x + rr, y); c.ellipse(x, y, rr, rr * 0.22, 0, 0, TAU);
      }
      c.stroke();
      c.globalCompositeOperation = 'source-over';
      c.restore();
      // caption
      const ca = E.ioS(seg(t, NE_T.cap, NE_T.cap + 0.8));
      if (ca > 0) {
        c.save(); c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 10;
        text(c, 'Neon signage · bent glass, noble gas, 15,000 volts', 60, 1042, { font: 'Archivo', size: 26, color: `rgba(240,232,220,${ca * 0.9})`, ls: 1 });
        c.restore();
      }
      vignette(c, W, H, 0.5, '0,0,0');
      grain(c, W, H, t, 0.05, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.8;
      // rain on the street, all the way through
      A.noise(0, { type: 'bandpass', f: 3800, q: 0.5, dur: 10, g: 0.06, a: 0.6, hold: true, rel: 0.4 });
      A.noise(0, { type: 'lowpass', f: 700, dur: 10, g: 0.07, a: 0.8, hold: true, rel: 0.4 });
      for (let k = 0; k < 26; k++) A.osc(0.2 + hash(k * 3.3) * 9.4, { f: 1800 + hash(k * 7.1) * 2600, f2: 900, glide: 0.04, dur: 0.05, g: 0.018, pan: hash(k) - 0.5, rev: 0.3 });
      // the transformer: a relay clack, then a 60-cycle buzz that thickens as tubes come on
      A.noise(NE_T.hum, { type: 'bandpass', f: 1400, q: 3, dur: 0.05, g: 0.22 });
      A.osc(NE_T.hum, { f: 90, f2: 50, glide: 0.06, dur: 0.1, g: 0.2 });
      A.osc(NE_T.hum + 0.02, { type: 'sawtooth', f: 60, dur: 9.4, g: 0.05, lp: 420, a: 0.08, hold: true, rel: 0.3 });
      [[NE_T.script, 120, 0.018], [NE_T.motel, 180, 0.014], [NE_T.arrow, 240, 0.01], [NE_T.diver, 360, 0.006]].forEach(([t, f, g]) => A.osc(t, { type: 'square', f, dur: 10 - t, g, lp: 1200, a: 0.3, hold: true, rel: 0.3, pan: (f % 240 ? -0.25 : 0.25) }));
      // ignition crackle, keyed to the same flicker frames the tubes use
      [[NE_T.script, 3], [NE_T.motel, 11], [NE_T.motel + 0.34, 13], [NE_T.motel + 0.68, 15], [NE_T.swash, 7], [NE_T.star, 21], [NE_T.pool, 51], [NE_T.vac + 0.12, 42]].forEach(([t0, sd], j) => {
        let was = false;
        for (let f = Math.ceil(t0 * 30); f < (t0 + 0.42) * 30; f++) {
          const on = hash(f * 1.37 + sd) < 0.25 + (f / 30 - t0) * 1.6;
          if (on && !was) A.noise(f / 30, { type: 'highpass', f: 2500 + 900 * (j % 3), dur: 0.018, g: 0.08, pan: j % 2 ? 0.3 : -0.3 });
          was = on;
        }
        A.osc(t0 + 0.42, { type: 'sawtooth', f: 120, dur: 0.3, g: 0.03, lp: 900 });
      });
      // flasher drums: the arrow's cam ticking round, the diver's three contacts
      for (let t = NE_T.arrow; t < 10; t += 1.6) { [0, 0.44, 0.54, 0.64].forEach((d, i) => A.noise(t + d, { type: 'bandpass', f: i ? 2600 : 1800, q: 6, dur: 0.02, g: 0.07, pan: 0.35 })); A.noise(t + 1.41, { type: 'bandpass', f: 1500, q: 6, dur: 0.025, g: 0.06, pan: 0.35 }); }
      for (let t = NE_T.diver, k = 0; t < 10; t += 0.5, k++) A.noise(t, { type: 'bandpass', f: [3200, 2800, 2400][k % 3], q: 8, dur: 0.015, g: 0.05, pan: 0.6 });
      // the dying NO: buzz chunks wherever its flicker frames are lit
      for (let f = Math.ceil(NE_T.sputter * 20); f < NE_T.dead * 20; f++) {
        const t = f / 20, p = seg(t, NE_T.sputter, NE_T.dead);
        if (hash(f * 2.11 + 9) > 0.15 + p * 0.75) A.osc(t, { type: 'sawtooth', f: 120, dur: 0.045, g: 0.035, lp: 2400, pan: 0.5 });
        else A.noise(t, { type: 'highpass', f: 5000, dur: 0.01, g: 0.04, pan: 0.5 });
      }
      A.noise(NE_T.dead, { type: 'bandpass', f: 900, q: 2, dur: 0.12, g: 0.1, pan: 0.5 });
      // a lounge electric piano and an upright bass, drifting out of a bar somewhere down the street
      const ep = (t, ns, g = 0.028) => ns.forEach((m, i) => { A.osc(t + i * 0.012, { type: 'sine', f: midi(m), dur: 1.6, g, rev: 0.4, pan: (i - 2) * 0.12 }); A.osc(t + i * 0.012, { type: 'triangle', f: midi(m + 12), dur: 0.4, g: g * 0.25 }); });
      [[3.2, [53, 57, 60, 64, 67], 38], [4.7, [53, 57, 59, 64], 43], [6.2, [52, 55, 59, 62, 64], 36], [7.7, [55, 58, 61, 64], 45], [9.0, [53, 57, 60, 64, 69], 38]].forEach(([t, ns, b]) => {
        ep(t, ns); ep(t + 0.75, ns.slice(1), 0.018);
        A.pluck(t, midi(b), { dur: 1.4, g: 0.24, bright: 0.25, lp: 700 }); A.pluck(t + 0.75, midi(b + 7), { dur: 0.8, g: 0.16, bright: 0.25, lp: 700 });
      });
    },
  });
  /* =====================================================================
     SPLIT-FLAP — a Solari-style departure board in a station hall at
     night. It opens in macro on a single flap unit: the top half lets go
     of its hinge, foreshortens as it swings toward us, shows its back and
     slaps down over the lower half, one letter at a time. The camera pulls
     back as every row starts to clatter, each row at its own speed,
     cascading through the drum to times, cities, platforms and remarks.
     The flap clock ticks over to 21:50, a chime sounds, ROME departs and
     the board rolls up a row; then the whole board runs through its drums
     again and resolves into words, one line still ON TIME
     ===================================================================== */
  const SF = { hall: '#14181b', housing: '#24282c', housingL: '#33383d', frame: '#9aa0a6', flap: '#141516', flapL: '#1f2123', glyph: '#f2efe6', amber: '#f0b429', label: '#c9ced2', red: '#d8432f' };
  const SF_CH = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:-./', SF_N = SF_CH.length;
  const SF_DIG = '0123456789';
  const SF_T = { start: 0.25, pull: 1.3, pullEnd: 2.9, tick: 4.3, chime: 3.85, gone: 4.45, roll: 5.0, words: 6.9, tick2: 9.25 };
  const SF_CW = 52, SF_CH_H = 84, SF_PX = 58, SF_PY = 98, SF_GAP = 34, SF_X0 = 100, SF_Y0 = 236;
  const SF_FIELDS = [{ n: 5, label: 'TIME' }, { n: 12, label: 'DESTINATION' }, { n: 2, label: 'PL', right: true }, { n: 9, label: 'REMARKS' }];
  const SF_COLS = (() => { const xs = []; let x = SF_X0; SF_FIELDS.forEach((f, fi) => { for (let i = 0; i < f.n; i++) { xs.push({ x, f: fi }); x += SF_PX; } x += SF_GAP; }); return xs; })();
  const SF_B1 = [['21:50', 'ROME', '4', 'ON TIME'], ['21:55', 'VENICE', '7', 'BOARDING'], ['22:05', 'VIENNA', '2', 'ON TIME'], ['22:10', 'MUNICH', '11', 'DELAYED'],
    ['22:20', 'ZURICH', '5', 'ON TIME'], ['22:35', 'PARIS', '9', 'ON TIME'], ['22:40', 'TRIESTE', '3', 'CANCELLED'], ['22:55', 'MILAN', '6', 'ON TIME']];
  const SF_B2 = [['21:55', 'VENICE', '7', 'LAST CALL'], ...SF_B1.slice(2), ['23:05', 'GENEVA', '8', 'ON TIME']];
  const SF_B3 = [['', '', '', ''], ['', '', '', ''], ['', 'SPLIT-FLAP', '', ''], ['', 'EVERY LETTER', '', ''], ['', 'FALLS INTO', '', ''], ['', 'PLACE', '', 'ON TIME'], ['', '', '', ''], ['', '', '', '']];
  const SF_ROWRATE = [16, 24, 13, 20, 27, 15, 22, 18];
  // one row of board text → 28 drum indices
  const sfRow = r => SF_FIELDS.flatMap((f, i) => { const s = r[i].slice(0, f.n), p = f.right ? s.padStart(f.n) : s.padEnd(f.n); return [...p].map(ch => Math.max(0, SF_CH.indexOf(ch))); });
  // Every unit's list of updates {t, ch, rate}; the macro cell starts slow. Shared by draw() and score().
  let sfSched = null;
  function sfSchedule() {
    if (sfSched) return sfSched;
    const cells = [];
    for (let r = 0; r < 8; r++) {
      const b1 = sfRow(SF_B1[r]), b2 = sfRow(SF_B2[r]), b3 = sfRow(SF_B3[r]), b0 = r === 0 ? sfRow(['21:50', 'ROME', '4', 'DEPARTED']) : null;
      SF_COLS.forEach((col, i) => {
        const j = hash(r * 31 + i * 7.7), rt = SF_ROWRATE[r] * (0.9 + 0.2 * j), focal = r === 0 && i === 5;
        const ev = [{ t: SF_T.start + r * 0.22 + i * 0.018 + j * 0.05, ch: b1[i], rate: focal ? 9 : rt }];
        if (b0 && col.f === 3) ev.push({ t: SF_T.gone + (i - 19) * 0.02, ch: b0[i], rate: 22 });
        ev.push({ t: SF_T.roll + r * 0.12 + i * 0.012 + j * 0.04, ch: b2[i], rate: rt * 1.35 });
        ev.push({ t: SF_T.words + r * 0.08 + i * 0.01 + j * 0.03, ch: b3[i], rate: 30 + 8 * j });
        cells.push({ r, i, ev });
      });
    }
    // the flap clock: hours and minutes on their own digit drums
    const clock = [[2, 2], [1, 1], [4, 5], [9, 0]].map(([a, b], k) => ({ i: k, ev: [{ t: -1, ch: a, rate: 30 }, ...(a !== b ? [{ t: SF_T.tick, ch: b, rate: 12 }] : [])] }));
    clock[3].ev.push({ t: SF_T.tick2, ch: 1, rate: 12 });
    return (sfSched = { cells, clock });
  }
  // A unit's drum at time t: showing a, falling toward b with phase q (0 = at rest); `since` = time since the last flap landed.
  function sfState(ev, t, N = SF_N) {
    let from = 0, ts = -1e9, steps = 0, rate = 1;
    for (const e of ev) {
      if (e.t > t) break;
      const done = Math.min(steps, Math.floor((e.t - ts) * rate));
      from = (from + done) % N; ts = e.t; rate = e.rate; steps = (e.ch - from + N) % N;
    }
    const d = 1 / rate, fall = Math.min(d * 0.92, 0.075), p = (t - ts) * rate;
    if (p >= steps) return { a: (from + steps) % N, q: 0, since: steps ? (p - steps) * d + d - fall : 9 };
    const k = Math.floor(p), cur = (from + k) % N, u = (p - k) * d;
    if (u >= fall) return { a: (cur + 1) % N, q: 0, since: u - fall };
    return { a: cur, b: (cur + 1) % N, q: u / fall, since: k ? d - fall + u : 9 };
  }
  // Landing times of every flap of a unit, for the clatter.
  function sfLandings(ev, out, N = SF_N) {
    let from = 0;
    ev.forEach((e, n) => {
      const steps = (e.ch - from + N) % N, d = 1 / e.rate, fall = Math.min(d * 0.92, 0.075), next = ev[n + 1] ? ev[n + 1].t : 1e9;
      let k = 0;
      for (; k < steps && e.t + k * d < next; k++) out.push(e.t + k * d + fall);
      from = (from + k) % N;
    });
  }

  // One flap unit. Top half falls over the central hinge toward the viewer, foreshortened and
  // widening at its free edge, shows its back, and covers the lower half.
  function sfUnit(c, st, x, y, w, h, s, map) {
    const A = st.atlas, TW = st.TW, TH = st.TH, hh = h / 2, hy = y + hh;
    const src = ch => { const k = map ? map[ch] : ch; return [(k % 8) * TW, Math.floor(k / 8) * TH]; };
    const half = (ch, top, dy = 0) => { const [sx, sy] = src(ch); c.drawImage(A, sx, sy + (top ? 0 : TH / 2), TW, TH / 2, x, top ? y : hy + dy, w, hh); };
    if (!s.q) {
      half(s.a, true);
      const bo = s.since < 0.09 ? -2.2 * Math.exp(-s.since * 45) * Math.cos(s.since * 110) * (h / 84) : 0;
      half(s.a, false, bo);
    } else {
      half(s.b, true); half(s.a, false);
      const th = PI * Math.pow(s.q, 1.6), ct = Math.cos(th), sn = Math.sin(th), front = th < PI / 2, H2 = hh * Math.abs(ct), n = 7;
      const [sx, sy] = src(front ? s.a : s.b), cx = x + w / 2;
      if (!front) { c.fillStyle = `rgba(0,0,0,${0.45 * sn})`; c.fillRect(x, hy + H2, w, hh - H2); }
      for (let j = 0; j < n; j++) {
        const v0 = j / n, v1 = (j + 1) / n, ww = w * (1 + 0.24 * sn * (v0 + v1) / 2);
        const syA = front ? sy + TH / 2 * (1 - v1) : sy + TH / 2 + TH / 2 * v0;
        const yA = front ? hy - v1 * H2 : hy + v0 * H2;
        c.drawImage(A, sx, syA, TW, TH / 2 / n, cx - ww / 2, yA, ww, H2 / n + 0.6);
      }
      c.fillStyle = front ? `rgba(0,0,0,${0.55 * sn})` : `rgba(255,255,255,${0.07 * sn})`;
      const wf = w * (1 + 0.24 * sn);
      c.beginPath(); c.moveTo(x, hy); c.lineTo(cx - wf / 2, front ? hy - H2 : hy + H2); c.lineTo(cx + wf / 2, front ? hy - H2 : hy + H2); c.lineTo(x + w, hy); c.closePath(); c.fill();
    }
    // the split and its hinge pins
    c.fillStyle = 'rgba(0,0,0,0.85)'; c.fillRect(x, hy - h * 0.008, w, h * 0.016 + 0.6);
    c.fillStyle = '#5b5f63'; c.fillRect(x - w * 0.04, hy - h * 0.018, w * 0.07, h * 0.036); c.fillRect(x + w * 0.97, hy - h * 0.018, w * 0.07, h * 0.036);
  }

  MG.film({
    id: 'splitflap', dur: 10, poster: 9.5,
    fonts: [['600 200px "Barlow Condensed"', SF_CH], ['700 40px "Barlow Condensed"', 'DEPARTURESTIMNOLKP'], ['500 22px "Barlow Condensed"', 'TIMEDSNRKPLAFOU']],
    meta: {
      family: 'B', name: 'Split-flap', sub: 'The Departure Board Clatter', era: '1956 — 1990',
      origin: 'A split-flap display shows each character on a drum of hinged half-cards: a motor turns the drum, and each upper flap falls over the hinge to reveal the next letter, so a whole board cascades through the alphabet with a clatter. Solari di Udine made the form famous, from the Cifra 3 flap clock designed by Gino Valle (1956) to the Dators departure boards that hung in railway stations and airports around the world until LCD screens replaced most of them.',
      works: 'Cifra 3 clock (Gino Valle for Solari di Udine, 1956) · Solari Dators railway and airport boards',
      tech: ['Hinged half-tile flaps', 'Sliced perspective foreshortening', 'Per-unit drum scheduling'],
      accent: '#f0b429',
      motionDNA: 'Everything changes by falling: each unit steps forward through a fixed drum, the top half dropping over the hinge with gravity and a small slap, so new text never appears directly but arrives through every letter in between, rows cascading in staggered waves at different speeds.',
      visualDNA: 'White condensed capitals on matte black flaps split by a dark hinge line, grouped in columns for time, destination, platform and remarks inside a dark grey housing, with an amber header and a small flap clock; dim station light and a soft sheen across the board.',
      transitions: 'Macro pull-back, per-row flap cascades, a row roll-up, a full-board resolve into words',
      implementation: ['Electromechanical flap units on a stepper-driven drum', 'After Effects card-flip rigs per character', 'Canvas 2D (glyph atlas, strip-sliced flaps, deterministic drum state)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      // the glyph atlas: every character on a black flap at three times the board size
      const TW = SF_CW * 3, TH = SF_CH_H * 3, atlas = offscreen(TW * 8, TH * Math.ceil(SF_N / 8)), g = atlas.getContext('2d');
      g.font = '600 200px "Barlow Condensed"';
      const capH = g.measureText('H').actualBoundingBoxAscent;
      for (let k = 0; k < SF_N; k++) {
        const x = (k % 8) * TW, y = Math.floor(k / 8) * TH;
        const fg = g.createLinearGradient(0, y, 0, y + TH);
        fg.addColorStop(0, '#232527'); fg.addColorStop(0.49, '#18191b'); fg.addColorStop(0.51, '#1c1d1f'); fg.addColorStop(1, '#101112');
        g.fillStyle = fg; rrect(g, x + 2, y + 2, TW - 4, TH - 4, 10); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.06)'; g.lineWidth = 2; g.stroke();
        g.fillStyle = SF.glyph; g.font = '600 200px "Barlow Condensed"'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        g.fillText(SF_CH[k], x + TW / 2, y + TH / 2 + capH / 2);
        // printed flaps wear: a faint sheen on the top half
        const sh = g.createLinearGradient(0, y, 0, y + TH / 2); sh.addColorStop(0, 'rgba(255,255,255,0.05)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = sh; g.fillRect(x + 4, y + 4, TW - 8, TH / 2 - 4);
      }
      const dmap = [...SF_DIG].map(ch => SF_CH.indexOf(ch));
      // the hall and the board housing
      const bg = offscreen(1920, 1080), b = bg.getContext('2d'), r = rng(1956);
      const hg = b.createLinearGradient(0, 0, 0, 1080); hg.addColorStop(0, '#1b2024'); hg.addColorStop(1, '#0c0e10'); b.fillStyle = hg; b.fillRect(0, 0, 1920, 1080);
      b.fillStyle = 'rgba(0,0,0,0.5)'; rrect(b, 52, 34, 1828, 1022, 18); b.fill();
      const hs = b.createLinearGradient(0, 30, 0, 1050); hs.addColorStop(0, SF.housingL); hs.addColorStop(1, SF.housing);
      b.fillStyle = hs; rrect(b, 44, 24, 1832, 1020, 16); b.fill();
      b.strokeStyle = SF.frame; b.lineWidth = 5; b.stroke();
      b.strokeStyle = 'rgba(0,0,0,0.6)'; b.lineWidth = 2; rrect(b, 54, 34, 1812, 1000, 12); b.stroke();
      for (let k = 0; k < 900; k++) { b.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${0.02 + r() * 0.03})`; b.fillRect(60 + r() * 1800, 40 + r() * 990, 2 + r() * 3, 1); }
      // amber header band, a train pictogram, the column labels
      b.fillStyle = SF.amber; b.fillRect(80, 64, 560, 104);
      b.fillStyle = '#1a1a1a';
      rrect(b, 100, 88, 112, 52, 14); b.fill(); b.fillStyle = SF.amber; [112, 142, 172].forEach(x => b.fillRect(x, 98, 22, 16));
      b.fillStyle = '#1a1a1a'; b.fillRect(96, 146, 120, 5); [124, 188].forEach(x => { b.beginPath(); b.arc(x, 143, 7, 0, TAU); b.fill(); });
      b.font = '700 74px "Barlow Condensed"'; b.textAlign = 'left'; b.fillStyle = '#1a1a1a'; if ('letterSpacing' in b) b.letterSpacing = '6px';
      b.fillText('DEPARTURES', 236, 144); if ('letterSpacing' in b) b.letterSpacing = '0px';
      b.font = '500 22px "Barlow Condensed"'; b.fillStyle = SF.label; if ('letterSpacing' in b) b.letterSpacing = '4px';
      let fx = SF_X0; SF_FIELDS.forEach(f => { b.fillText(f.label === 'PL' ? 'PLATFORM' : f.label, fx, SF_Y0 - 22); fx += f.n * SF_PX + SF_GAP; });
      if ('letterSpacing' in b) b.letterSpacing = '0px';
      b.fillStyle = 'rgba(255,255,255,0.08)'; b.fillRect(SF_X0, SF_Y0 - 12, 1720, 2);
      // unit bezels: a recessed slot behind every flap, rails between the rows
      for (let rr = 0; rr < 8; rr++) {
        const y = SF_Y0 + rr * SF_PY;
        b.fillStyle = 'rgba(0,0,0,0.35)'; b.fillRect(SF_X0 - 10, y + SF_CH_H + 6, 1740, 4);
        SF_COLS.forEach(col => { b.fillStyle = '#0b0c0d'; rrect(b, col.x - 3, y - 3, SF_CW + 6, SF_CH_H + 6, 5); b.fill(); });
      }
      // the clock housing, after the Cifra drum: a rounded capsule with four digit units
      b.fillStyle = '#121416'; rrect(b, 1500, 52, 330, 128, 30); b.fill(); b.strokeStyle = SF.frame; b.lineWidth = 3; b.stroke();
      b.fillStyle = SF.glyph; [[1661, 96], [1661, 136]].forEach(([x, y]) => { b.beginPath(); b.arc(x, y, 6, 0, TAU); b.fill(); });
      return { atlas, TW, TH, dmap, bg, sched: sfSchedule() };
    },
    draw(c, t, W, H, st) {
      // macro on one unit, then the pull-back to the whole board
      const fx = SF_COLS[5].x + SF_CW / 2, fy = SF_Y0 + SF_CH_H / 2;
      const pz = E.ioC(seg(t, SF_T.pull, SF_T.pullEnd)), z = Math.pow(3.6, 1 - pz) * (1 + 0.022 * E.ioS(seg(t, SF_T.pullEnd, 10)));
      const cx = lerp(fx, 960, pz), cy = lerp(fy, 540, pz);
      c.save(); c.translate(960, 540); c.scale(z, z); c.translate(-cx, -cy);
      c.drawImage(st.bg, 0, 0);
      st.sched.cells.forEach(cell => {
        const s = sfState(cell.ev, t);
        sfUnit(c, st, SF_COLS[cell.i].x, SF_Y0 + cell.r * SF_PY, SF_CW, SF_CH_H, s);
      });
      const cxs = [1520, 1584, 1680, 1744];
      st.sched.clock.forEach((u, k) => sfUnit(c, st, cxs[k], 64, 58, 94, sfState(u.ev, t, 10), st.dmap));
      // overhead station light and a broad sheen over the flaps
      const lg = c.createRadialGradient(900, -200, 100, 900, 200, 1400);
      lg.addColorStop(0, 'rgba(255,236,200,0.10)'); lg.addColorStop(1, 'rgba(255,236,200,0)');
      c.fillStyle = lg; c.fillRect(0, 0, 1920, 1080);
      const sh = c.createLinearGradient(300, 0, 1500, 1080);
      sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.45, 'rgba(255,255,255,0.035)'); sh.addColorStop(0.55, 'rgba(255,255,255,0.05)'); sh.addColorStop(0.7, 'rgba(255,255,255,0)');
      c.fillStyle = sh; c.fillRect(0, 0, 1920, 1080);
      c.restore();
      // macro depth: the far field blurs out while the camera is close
      const dof = 1 - seg(t, SF_T.pull, SF_T.pull + 1.0);
      if (dof > 0) {
        const g = c.createRadialGradient(960, 540, 260, 960, 540, 1000);
        g.addColorStop(0, 'rgba(8,9,10,0)'); g.addColorStop(1, `rgba(8,9,10,${0.75 * dof})`);
        c.fillStyle = g; c.fillRect(0, 0, W, H);
      }
      vignette(c, W, H, 0.5, '0,0,0');
      grain(c, W, H, t, 0.045, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.8;
      const S = sfSchedule(), land = [];
      S.cells.forEach(cell => sfLandings(cell.ev, land));
      S.clock.forEach(u => sfLandings(u.ev.filter(e => e.t >= 0), land, 10));
      // the hall: a low rumble of air and distant trains, under a long reverb
      A.noise(0, { type: 'lowpass', f: 320, dur: 10, g: 0.09, a: 1, hold: true, rel: 0.5, rev: 0.4 });
      A.noise(0, { type: 'bandpass', f: 900, q: 0.6, dur: 10, g: 0.02, a: 1.2, hold: true, rel: 0.5, rev: 0.6 });
      // clatter: every flap landing, binned so a full-board cascade stays a texture, not a wall of noise
      const bin = 1 / 75, cnt = new Map();
      land.forEach(x => { if (x >= 0 && x < 9.95) { const k = Math.round(x / bin); cnt.set(k, (cnt.get(k) || 0) + 1); } });
      [...cnt.entries()].sort((a, b) => a[0] - b[0]).forEach(([k, n]) => {
        const t = k * bin, solo = t < SF_T.pull + 0.4, g = Math.min(0.2, (solo ? 0.16 : 0.03) * Math.sqrt(n));
        A.noise(t, { type: 'bandpass', f: 2200 + hash(k * 1.3) * 2600, q: 2.2, dur: 0.014, g, pan: (hash(k * 2.9) - 0.5) * 0.8, rev: solo ? 0.35 : 0.12 });
        A.osc(t, { type: 'triangle', f: 420 + hash(k) * 160, f2: 210, glide: 0.02, dur: 0.03, g: g * 0.5 });
      });
      // the drum motors spinning up under each cascade
      [[SF_T.start + 0.3, 2.8], [SF_T.roll, 2.0], [SF_T.words, 2.2]].forEach(([t, d]) => A.osc(t, { type: 'sawtooth', f: 48, f2: 62, glide: d, dur: d, g: 0.025, lp: 240, a: 0.3, hold: true, rel: 0.4 }));
      // the clock's heavier flaps
      [SF_T.tick, SF_T.tick2].forEach(t => { A.noise(t + 0.07, { type: 'bandpass', f: 1400, q: 1.8, dur: 0.03, g: 0.16, rev: 0.3 }); A.osc(t + 0.07, { f: 220, f2: 110, glide: 0.04, dur: 0.06, g: 0.12 }); });
      // a station chime before the announcement, and a softer one as the board resolves
      [[72, 0], [76, 0.42], [79, 0.84]].forEach(([m, d]) => A.bell(SF_T.chime + d, midi(m), { g: 0.1, dur: 2.4, rev: 0.7 }));
      [[79, 0], [76, 0.42], [72, 0.84]].forEach(([m, d]) => A.bell(8.7 + d, midi(m), { g: 0.07, dur: 2.2, rev: 0.7 }));
      // a train pulls out somewhere beyond the board
      A.noise(SF_T.gone, { type: 'lowpass', f: 160, f2: 600, dur: 3, g: 0.12, swell: 0.4, rev: 0.4 });
      A.chord(SF_T.gone + 0.2, [57, 61], { type: 'sawtooth', dur: 1.2, g: 0.012, lp: 900, a: 0.2, hold: true, rel: 0.5, rev: 0.7, vib: [0.6, 3] });
    },
  });
  /* =====================================================================
     CONCRETE — words arranged as image, on a white page. It opens with
     Gomringer's constellation: the word "silence" set fourteen times in a
     grid, one at a time, around an empty centre that is the poem; then
     a held beat of nothing. The letters let go and drip off the page,
     and Apollinaire's rain arrives: five slanting lines of type fall
     letter by letter into place and hold. They drain away; a horizon
     types itself across the page out of the word "horizon", rows of
     "wave" swell beneath it in perspective, a ring of red "sun" rises
     and lays an upside-down reflection on the water, and three v's fly.
     The picture ebbs and leaves one word opening up into white space
     ===================================================================== */
  const CP = { paper: '#f2efe7', paperD: '#e4dfd2', ink: '#161514', grey: '#77736b', red: '#d33b25' };
  const CP_T = { sil: 0.35, drip: 2.85, rain: 3.15, rainOut: 5.1, hor: 5.6, wave: 5.9, sun: 6.25, sunEnd: 7.6, gulls: 6.7, clear: 8.0, space: 8.5, cap: 9.05 };
  const CP_HZ = 560, CP_G = 3800;
  const CP_RAIN = ['it rains letters', 'out of the silence', 'each one a small voice', 'falling into its place', 'on the white page'];
  const CP_WAVE = [0, 1, 2, 3, 4, 5].map(i => ({ y: CP_HZ + 34 + i * 30 + i * i * 9, size: 15 + i * 7, amp: 3 + i * 3.6, drift: 10 + i * 9 }));
  const cpFont = (size, w = 400, fam = 'Jost') => `${w} ${size}px ${fam}`;
  // a falling glyph: an upright letter that stretches into a streak as it gathers speed
  function cpFall(c, ch, x, y, v, font, a = 1) {
    if (v < 260) { c.save(); c.translate(x, y); c.scale(1, 1 + v / 900); c.font = font; c.fillStyle = rgba(CP.ink, a); c.fillText(ch, 0, 0); c.restore(); return; }
    const L = Math.min(46, v * 0.022);
    c.strokeStyle = rgba(CP.ink, a * 0.75); c.lineWidth = 2.2; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y - L - 12); c.lineTo(x, y - 12); c.stroke();
  }

  MG.film({
    id: 'concrete', dur: 10, poster: 7.7,
    fonts: [['400 56px Jost', 'silencehorizwavsup'], ['300 84px Jost', 'spacehorizonv'], ['600 38px Jost', 'sun'], ['400 34px "Courier Prime"', 'itrainslettersoufhcmvgplw'], ['400 22px Jost', 'concrete poetry — words arranged as image · 1953–1970']],
    meta: {
      family: 'B', name: 'Concrete Poetry', sub: 'Words Arranged as Image', era: '1953 — 1970',
      origin: 'Concrete poetry treats the word as a material object, arranging letters and words on the page so that their placement, repetition and white space make the meaning instead of syntax. Eugen Gomringer’s constellations in Switzerland and the Brazilian Noigandres group of Augusto and Haroldo de Campos and Décio Pignatari named it in the 1950s, drawing on Apollinaire’s picture-poems; Ian Hamilton Finlay later carried it into prints, stone and a whole garden.',
      works: 'Calligrammes (Guillaume Apollinaire, 1918) · Noigandres magazine (Augusto de Campos, Haroldo de Campos, Décio Pignatari, from 1952) · silencio (Eugen Gomringer, 1954) · Little Sparta garden (Ian Hamilton Finlay, from 1966)',
      tech: ['Letter-level choreography', 'Words as picture elements', 'Gravity-timed rain of type'],
      accent: '#d33b25',
      motionDNA: 'Sparse, exact and quiet: words are placed one at a time and then left alone, a held beat of nothing separates each poem, letters fall with gravity and stretch into streaks, words ride waves and rise as a sun, and every picture ebbs back into the white page before the next begins.',
      visualDNA: 'Black lowercase geometric sans and typewriter type on warm white paper with a single red accent; grids, slants, rings and rows of one repeated word, generous margins, and an empty centre that carries as much meaning as the letters around it.',
      transitions: 'Word-by-word setting, letters dripping off the page, typed horizon wipe, ebb to white',
      implementation: ['Typewriter and letterpress on paper', 'After Effects per-character text animators', 'Canvas 2D (per-glyph layout, gravity-timed falls)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const r = rng(1954), paper = offscreen(1920, 1080), g = paper.getContext('2d');
      const pg = g.createRadialGradient(960, 500, 200, 960, 540, 1200); pg.addColorStop(0, '#f6f3ec'); pg.addColorStop(1, '#e6e1d4');
      g.fillStyle = pg; g.fillRect(0, 0, 1920, 1080);
      for (let k = 0; k < 5000; k++) { g.fillStyle = r() < 0.6 ? `rgba(120,105,80,${0.03 + r() * 0.05})` : `rgba(255,255,255,${0.15 + r() * 0.2})`; g.fillRect(r() * 1920, r() * 1080, 1 + r() * 2, 1); }
      // Gomringer's grid: 5 rows × 3, the centre left empty
      g.font = cpFont(62); const sw = [...'silence'].map(ch => g.measureText(ch).width), tw = sw.reduce((a, b) => a + b, 0);
      const sil = [];
      let ord = 0;
      for (let row = 0; row < 5; row++) for (let col = 0; col < 3; col++) {
        if (row === 2 && col === 1) continue;
        const x0 = 960 + (col - 1) * 360 - tw / 2, y = 540 + (row - 2) * 106 + 22;
        let x = x0;
        sil.push({ ord: ord++, row, letters: [...'silence'].map((ch, j) => { const L = { ch, x: x + sw[j] / 2, y, d: hash(row * 9 + col * 3 + j * 1.7) }; x += sw[j]; return L; }) });
      }
      // Apollinaire's rain: five slanting lines, one letter at a time
      const rain = [];
      CP_RAIN.forEach((s, j) => [...s].forEach((ch, k) => {
        if (ch === ' ') return;
        const tx = 690 + j * 214 - k * 13, ty = 128 + k * 37, land = CP_T.rain + j * 0.2 + k * 0.032 + hash(j * 17 + k) * 0.05;
        rain.push({ ch, tx, ty, land, fall: Math.sqrt(2 * (ty + 40) / CP_G), out: CP_T.rainOut + (1 - k / s.length) * 0.12 + j * 0.06 + hash(j * 5 + k * 3.3) * 0.22, j, k });
      }));
      return { paper, sil, rain };
    },
    draw(c, t, W, H, st) {
      c.drawImage(st.paper, 0, 0);
      c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      // I · silence
      if (t < CP_T.drip + 1.2) {
        const f56 = cpFont(62);
        st.sil.forEach(w => {
          const a = E.outQ(seg(t, CP_T.sil + w.ord * 0.15, CP_T.sil + w.ord * 0.15 + 0.12));
          if (a <= 0) return;
          w.letters.forEach(L => {
            const t0 = CP_T.drip + L.d * 0.4 + (4 - w.row) * 0.03, u = t - t0;
            if (u <= 0) { c.font = f56; c.fillStyle = rgba(CP.ink, a); c.fillText(L.ch, L.x, L.y); return; }
            const y = L.y + 0.5 * CP_G * u * u;
            if (y < 1140) cpFall(c, L.ch, L.x, y, CP_G * u, f56, 1);
          });
        });
      }
      // II · rain
      if (t > CP_T.rain - 0.8 && t < CP_T.rainOut + 1.2) {
        const fr = cpFont(34, 400, '"Courier Prime"');
        st.rain.forEach(R => {
          const t0 = R.land - R.fall;
          if (t < t0) return;
          if (t < R.land) { const u = t - t0; cpFall(c, R.ch, R.tx + (R.land - t) * 40, -40 + 0.5 * CP_G * u * u, CP_G * u, fr); return; }
          const u = t - R.out;
          if (u > 0) { const y = R.ty + 0.5 * CP_G * u * u; if (y < 1140) cpFall(c, R.ch, R.tx, y, CP_G * u, fr); return; }
          const sq = seg(t, R.land, R.land + 0.09);
          c.save(); c.translate(R.tx, R.ty); c.scale(1 + 0.25 * (1 - sq), lerp(0.6, 1, E.outB(sq))); c.font = fr; c.fillStyle = CP.ink; c.fillText(R.ch, 0, 0); c.restore();
        });
      }
      // III · horizon, waves, sun, gulls
      const ebb = seg(t, CP_T.clear, CP_T.clear + 0.6);
      if (t > CP_T.hor && ebb < 1) {
        const sunY = lerp(CP_HZ + 180, 380, E.outC(seg(t, CP_T.sun, CP_T.sunEnd))), sunA = 1 - seg(t, CP_T.clear - 0.1, CP_T.clear + 0.4), spin = t * 0.12;
        // the sun: a ring of the word, clipped by the horizon
        if (t > CP_T.sun && sunA > 0) {
          c.save(); c.beginPath(); c.rect(0, 0, 1920, CP_HZ - 10); c.clip();
          c.font = cpFont(38, 600); c.fillStyle = rgba(CP.red, sunA);
          for (let k = 0; k < 11; k++) {
            const a = spin + k / 11 * TAU;
            c.save(); c.translate(960 + Math.cos(a) * 124, sunY + Math.sin(a) * 124); c.rotate(a + PI / 2); c.fillText('sun', 0, 12); c.restore();
          }
          c.restore();
        }
        // the horizon types itself out of its own name, and is wiped away right to left at the end
        const hp = E.outQ(seg(t, CP_T.hor, CP_T.hor + 0.7)), hq = E.inQ(seg(t, CP_T.clear + 0.1, CP_T.clear + 0.6));
        c.save(); c.beginPath(); c.rect(140, CP_HZ - 30, 1640 * hp * (1 - hq), 50); c.clip();
        text(c, 'horizon '.repeat(16).trim(), 960, CP_HZ + 6, { font: 'Jost', weight: 300, size: 18, ls: 4.4, color: CP.ink, align: 'center' });
        c.restore();
        // the sea: rows of "wave", bigger as they come closer, riding a swell; the sun's reflection upside down in red
        const rise = E.outC(seg(t, CP_T.sun + 0.4, CP_T.sunEnd));
        CP_WAVE.forEach((Wv, i) => {
          const a0 = CP_T.wave + i * 0.12, ra = seg(t, a0, a0 + 0.5) * (1 - seg(t, CP_T.clear + i * 0.06, CP_T.clear + 0.35 + i * 0.06));
          if (ra <= 0) return;
          c.font = cpFont(Wv.size, i < 2 ? 300 : 400);
          const gap = Wv.size * 0.9, ww = c.measureText('wave').width + gap, off = -((t * Wv.drift + i * 37) % ww);
          const amp = Wv.amp * (1 - 0.7 * ebb);
          for (let x = 140 + off, n = 0; x < 1780; x += ww, n++) {
            if (x < 120) continue;
            const mid = x + ww / 2 - gap / 2, ph = mid * 0.011 - t * 2.1 + i * 0.85;
            const dy = amp * Math.sin(ph), rot = Math.atan(amp * 0.011 * Math.cos(ph)) * 0.8;
            const la = ra * clamp((t - a0 - (mid - 140) / 1640 * 0.45) / 0.25);
            if (la <= 0) continue;
            const refl = rise > 0 && Math.abs(mid - 960) < (40 + i * 26) * rise;
            c.save(); c.translate(mid, Wv.y + dy); c.rotate(rot);
            if (refl) { c.scale(1, -1); c.fillStyle = rgba(CP.red, la * sunA * (0.95 - i * 0.08)); c.fillText('sun', 0, Wv.size * 0.3); }
            else { c.fillStyle = rgba(CP.ink, la * (0.55 + i * 0.09)); c.fillText('wave', 0, 0); }
            c.restore();
          }
        });
        // three v's on the wind
        const ga = seg(t, CP_T.gulls, CP_T.gulls + 0.5) * (1 - seg(t, CP_T.clear - 0.2, CP_T.clear + 0.3));
        if (ga > 0) [[520, 270, 0], [610, 230, 1.7], [690, 300, 3.1]].forEach(([x, y, ph], k) => {
          const u = t - CP_T.gulls, fl = 0.55 + 0.45 * Math.sin(u * 7 + ph);
          c.save(); c.translate(x + u * (70 + k * 12), y - u * 14 + 6 * Math.sin(u * 1.6 + ph)); c.scale(1, fl);
          c.font = cpFont(66 - k * 10, 300); c.fillStyle = rgba(CP.ink, ga * 0.85); c.fillText('v', 0, 0); c.restore();
        });
      }
      // IV · space
      const sa = E.ioS(seg(t, CP_T.space, CP_T.space + 0.5));
      if (sa > 0) {
        const ls = 4 + 92 * E.outC(seg(t, CP_T.space, CP_T.space + 1.3));
        c.font = cpFont(84, 300); const ws = [...'space'].map(ch => c.measureText(ch).width), tw = ws.reduce((a, b) => a + b, 0) + ls * 4;
        let x = 960 - tw / 2;
        [...'space'].forEach((ch, i) => { c.fillStyle = rgba(CP.ink, sa); c.fillText(ch, x + ws[i] / 2, 566); x += ws[i] + ls; });
      }
      const ca = E.ioS(seg(t, CP_T.cap, CP_T.cap + 0.6));
      if (ca > 0) text(c, 'concrete poetry — words arranged as image · 1953–1970', 960, 1000, { font: 'Jost', size: 22, ls: 3, color: rgba(CP.grey, ca), align: 'center' });
      vignette(c, W, H, 0.18, '90,70,40');
      grain(c, W, H, t, 0.04, 'multiply');
    },
    score(A) {
      A.bus.gain.value = 0.85;
      // I: a soft key for each word, and nothing at the centre
      for (let k = 0; k < 14; k++) {
        const t = CP_T.sil + k * 0.15;
        A.noise(t, { type: 'bandpass', f: 2600 + (k % 3) * 300, q: 1.6, dur: 0.035, g: 0.1, pan: ((k % 3) - 1) * 0.4, rev: 0.25 });
        A.osc(t, { type: 'triangle', f: 160, f2: 90, glide: 0.03, dur: 0.05, g: 0.06 });
      }
      A.osc(CP_T.sil + 7 * 0.15, { type: 'sine', f: midi(84), dur: 1.6, g: 0.025, rev: 0.7 });
      // the letters drip away
      for (let k = 0; k < 22; k++) { const t = CP_T.drip + hash(k * 3.7) * 0.6; A.osc(t, { type: 'sine', f: 2200 - hash(k) * 900, f2: 700, glide: 0.08, dur: 0.1, g: 0.03, pan: hash(k * 2) - 0.5, rev: 0.4 }); }
      // II: rain — every landing letter a small plucked drop on a pentatonic scale, line by line
      const pent = [0, 2, 4, 7, 9], base = [74, 79, 72, 76, 69];
      CP_RAIN.forEach((s, j) => [...s].forEach((ch, k) => {
        if (ch === ' ' || k % 2) return;
        const land = CP_T.rain + j * 0.2 + k * 0.032 + hash(j * 17 + k) * 0.05;
        A.pluck(land, midi(base[j] + pent[(k / 2) % 5 | 0] + (k > 10 ? 12 : 0)), { dur: 0.9, g: 0.07, bright: 0.85, decay: 0.994, pan: (j - 2) * 0.3, rev: 0.5 });
      }));
      A.noise(CP_T.rain - 0.3, { type: 'bandpass', f: 5000, q: 0.5, dur: 1.9, g: 0.025, swell: 0.5, rev: 0.3 });
      A.whoosh(CP_T.rainOut + 0.05, 0.8, { f1: 3000, f2: 300, g: 0.07, swell: 0.3 });
      // III: the sea swells, a pad opens, the sun rises with a bell, gulls call
      [0, 0.85, 1.7].forEach(d => A.noise(CP_T.wave + d, { type: 'lowpass', f: 700, f2: 260, dur: 1.6, g: 0.06, swell: 0.45, rev: 0.4 }));
      A.chord(CP_T.wave, [48, 55, 62, 64, 69], { type: 'sine', dur: 2.4, g: 0.032, a: 0.9, hold: true, rel: 0.9, width: 0.8, rev: 0.6 });
      A.osc(CP_T.sun, { type: 'sine', f: midi(67), f2: midi(79), glide: 1.3, dur: 1.5, g: 0.03, a: 0.4, hold: true, rel: 0.4, rev: 0.6 });
      A.bell(CP_T.sun + 1.0, midi(79), { g: 0.06, dur: 2.4, rev: 0.7 });
      [0, 0.5, 1.15].forEach((d, k) => A.osc(CP_T.gulls + 0.3 + d, { type: 'sine', f: 2300 - k * 150, f2: 1600, glide: 0.18, dur: 0.22, g: 0.016, vib: [24, 60], pan: -0.3 + k * 0.2, rev: 0.5 }));
      // IV: one open fifth for the word "space", then silence
      A.chord(CP_T.space, [57, 64, 76], { type: 'sine', dur: 1.5, g: 0.03, a: 0.3, hold: true, rel: 1.0, width: 0.6, rev: 0.7 });
    },
  });
})();
