/* batch h4 — Analog & Screen: Pixilation · Databending · OS Window Animation.
   pixilation (live actors shot frame by frame) · databend (image files corrupted as data) · oswindow (desktop window-manager motion). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, rrect, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Courier+Prime:wght@400;700&family=IBM+Plex+Mono:wght@400;600&family=Archivo+Black&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=block');
  const PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const shadeCache = new Map();
  // Multiply a #rrggbb colour by k (k < 1 darkens, k > 1 lifts toward white).
  function shade(hex, k) {
    const key = hex + k;
    if (shadeCache.has(key)) return shadeCache.get(key);
    const n = parseInt(hex.slice(1), 16), ch = [n >> 16, (n >> 8) & 255, n & 255];
    const out = `rgb(${ch.map(v => Math.round(k <= 1 ? v * k : v + (255 - v) * (k - 1))).join(',')})`;
    shadeCache.set(key, out);
    return out;
  }
  // Draw fn into a scratch layer (same transform), then composite it once through a blur filter —
  // a filter set on the destination would re-blur the whole canvas for every single shape.
  function soft(dst, px, fn) {
    const L = offscreen(dst.canvas.width, dst.canvas.height), q = L.getContext('2d');
    q.setTransform(dst.getTransform()); fn(q);
    dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.filter = `blur(${px}px)`; dst.drawImage(L, 0, 0); dst.restore();
  }
  const ell = (g, x, y, rx, ry, a = 0) => { g.beginPath(); g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a, 0, TAU); };

  /* =====================================================================
     PIXILATION — a London park photographed one frame at a time at 12 fps.
     A man in a bowler glides in along the lawn without moving his legs; a
     woman hops in from the right, airborne in every single frame; they bow,
     and jump-cut costume changes swap their clothes, poses and places three
     times a second while a bubble car hops down the street behind the
     railings. A flower pops up between them (McLaren's Neighbours), they sit
     on nothing and drive an invisible car around it, then the title is laid
     out on the lawn in cardboard letters, one letter per frame
     ===================================================================== */
  const PX = { skin: '#d6a07f', skinD: '#b9805f', shoe: '#17130f', letter: '#f3eee2', letterE: '#a2967a', slate: '#22231f' };
  const PX_FPS = 12;
  const PX_T = { slideA: 0.25, slideEnd: 2.5, hopB: 1.45, hopEnd: 3.35, bow: 3.5, swap: 4.0, car: 3.9, carEnd: 7.3, flower: 5.8, ride: 6.0, rideEnd: 8.0, title: 8.17, sub: 9.0, pop: 9.33 };
  // wardrobe: four outfits each, swapped by jump cut
  const PX_A = [
    { coat: '#3b3d43', trou: '#2c2d31', hat: 'bowler', hatC: '#16161a', hair: '#2b2019', shirt: '#ebe6da', tie: '#7c2224' },
    { coat: '#d8c7a0', trou: '#ece5d3', hat: 'boater', hatC: '#d9c387', hair: '#2b2019', shirt: '#f4f0e6', tie: '#2a3f74', stripe: '#8a2b33' },
    { coat: '#2f5ea8', trou: '#2f5ea8', hat: 'cap', hatC: '#7a6a52', hair: '#2b2019', shirt: '#f2f0ea', tie: null, stripe: '#f2f0ea' },
    { coat: '#141417', trou: '#141417', hat: 'top', hatC: '#0d0d10', hair: '#2b2019', shirt: '#f4f2ec', tie: '#0d0d10' },
  ];
  const PX_B = [
    { dress: true, coat: '#b8342c', leg: '#3a2b27', hat: 'beret', hatC: '#1f2b47', hair: '#5a3120', shirt: '#efe4cf' },
    { dress: true, coat: '#e2b23a', leg: '#e9dfcf', hat: 'bob', hatC: '#5a3120', hair: '#5a3120', shirt: '#2c2c2c' },
    { dress: true, coat: '#3d7f5b', leg: '#2a2622', hat: 'bun', hatC: '#5a3120', hair: '#5a3120', shirt: '#f1ead9' },
    { dress: false, coat: '#eeeee6', trou: '#eeeee6', hat: 'visor', hatC: '#2f6f9a', hair: '#5a3120', shirt: '#eeeee6', tie: null },
  ];
  // leg poses relative to the hip: [knee x, knee y, ankle x, ankle y] for back and front leg
  const PX_LEGS = {
    stand: [[-3, -104, -1, -14], [4, -104, 6, -14]],
    stride: [[-24, -100, -48, -18], [26, -104, 50, -14]],
    tuck: [[72, -184, 12, -124], [84, -176, 26, -114]],
    sit: [[92, -198, 94, -110], [102, -194, 106, -104]],
  };
  // arm poses: [upper, fore] absolute angles from straight down, positive swings forward
  const PX_ARMS = {
    down: [[0.1, 0.16], [-0.06, 0.04]],
    up: [[2.5, 2.8], [2.75, 3.05]],
    wheel: [[0.95, 1.55], [1.05, 1.62]],
    wave: [[0.12, 0.2], [2.35, 3.05]],
    present: [[0.1, 0.18], [1.35, 1.75]],
  };
  // Sledgehammer-style jump cuts: every third of a second a new outfit, a new pose, a new spot
  const PX_SW = [
    [640, 'stand', 'wave', 0, 1290, 'stand', 'present', 0],
    [560, 'stride', 'up', 0, 1370, 'tuck', 'up', 62],
    [770, 'stand', 'present', 0, 1180, 'stride', 'wave', 0],
    [600, 'tuck', 'up', 70, 1330, 'stand', 'down', 0],
    [700, 'stride', 'wheel', 0, 1240, 'stride', 'wheel', 0],
    [660, 'stand', 'wave', 0, 1300, 'tuck', 'up', 66],
  ];

  // One actor as a flat-shaded photograph cut-out: feet at (0, 0), ~430 px tall at s = 1.
  function pxActor(g, o) {
    const k = o.cost, L = PX_LEGS[o.pose], AR = PX_ARMS[o.arms];
    g.save(); g.scale(o.dir * o.s, o.s);
    // seated on nothing: the hips drop to knee height so the feet stay on the grass
    if (o.pose === 'sit') g.translate(0, 96);
    g.lineCap = 'round'; g.lineJoin = 'round';
    const legC = k.dress ? k.leg : k.trou;
    [[L[0], -8, 0.7], [L[1], 8, 1]].forEach(([l, hx, sh]) => {
      g.strokeStyle = shade(legC, sh); g.lineWidth = k.dress ? 22 : 34;
      g.beginPath(); g.moveTo(hx, -205); g.lineTo(hx + l[0], l[1]); g.lineTo(hx + l[2], l[3]); g.stroke();
      g.fillStyle = shade(PX.shoe, sh + 0.3); ell(g, hx + l[2] + 12, l[3] + 2, 25, 11); g.fill();
    });
    if (k.dress) {
      // the skirt follows the thighs: hangs straight standing, drapes forward when tucked or seated
      g.fillStyle = shade(k.coat, 0.92);
      g.beginPath();
      if (o.pose === 'tuck' || o.pose === 'sit') { g.moveTo(-32, -240); g.lineTo(30, -240); g.lineTo(110, -214); g.lineTo(104, -168); g.lineTo(-40, -176); }
      else if (o.pose === 'stride') { g.moveTo(-32, -240); g.lineTo(30, -240); g.lineTo(62, -128); g.lineTo(-58, -132); }
      else { g.moveTo(-32, -240); g.lineTo(30, -240); g.lineTo(50, -128); g.lineTo(-50, -128); }
      g.closePath(); g.fill();
    }
    g.save(); g.translate(0, -205); g.rotate(o.lean); g.translate(0, 205);
    const arm = (sx, a, col) => {
      const ex = sx + Math.sin(a[0]) * 82, ey = -336 + Math.cos(a[0]) * 82, hx = ex + Math.sin(a[1]) * 74, hy = ey + Math.cos(a[1]) * 74;
      g.strokeStyle = col; g.lineWidth = 25;
      g.beginPath(); g.moveTo(sx, -336); g.lineTo(ex, ey); g.lineTo(hx, hy); g.stroke();
      g.fillStyle = col === k.coat ? PX.skin : PX.skinD; ell(g, hx, hy, 12, 12); g.fill();
    };
    arm(-20, AR[0], shade(k.coat, 0.72));
    // torso: a coat with tails for the men, a fitted bodice for the dresses
    g.fillStyle = k.coat;
    g.beginPath();
    g.moveTo(-37, -342); g.quadraticCurveTo(0, -356, 37, -342);
    if (k.dress) { g.lineTo(30, -236); g.lineTo(-32, -236); }
    else { g.lineTo(32, -232); g.lineTo(39, -166); g.lineTo(-37, -166); g.lineTo(-33, -232); }
    g.closePath(); g.fill();
    if (k.stripe) { g.save(); g.clip(); g.fillStyle = k.stripe; for (let x = -40; x < 44; x += 14) g.fillRect(x, -360, 4, 200); g.restore(); }
    // shirt front and tie
    g.fillStyle = k.shirt; g.beginPath(); g.moveTo(-10, -347); g.lineTo(12, -347); g.lineTo(2, -300); g.closePath(); g.fill();
    if (k.tie) { g.strokeStyle = k.tie; g.lineWidth = 6; g.beginPath(); g.moveTo(2, -344); g.lineTo(3, -306); g.stroke(); }
    // neck, head, ear, nose and hair
    g.fillStyle = PX.skinD; g.fillRect(-9, -366, 19, 24);
    g.fillStyle = PX.skin; ell(g, 3, -388, 25, 29); g.fill();
    g.beginPath(); g.moveTo(26, -398); g.lineTo(35, -382); g.lineTo(25, -378); g.closePath(); g.fill();
    g.fillStyle = k.hair;
    g.beginPath(); g.ellipse(-1, -394, 27, 26, 0, PI * 0.92, PI * 1.98); g.closePath(); g.fill();
    if (k.hat === 'bob') { g.beginPath(); g.ellipse(-6, -384, 30, 34, 0, PI * 0.5, PI * 1.9); g.closePath(); g.fill(); }
    g.fillStyle = PX.skinD; ell(g, -3, -386, 6, 9); g.fill();
    g.fillStyle = '#2a1d16'; ell(g, 16, -392, 3, 3.5); g.fill();
    g.strokeStyle = 'rgba(90,40,30,0.6)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(12, -371); g.lineTo(22, -372); g.stroke();
    g.fillStyle = k.hatC;
    if (k.hat === 'bowler') { g.beginPath(); g.arc(0, -404, 30, PI, TAU); g.fill(); ell(g, 2, -404, 45, 7); g.fill(); }
    else if (k.hat === 'top') { g.fillRect(-25, -474, 50, 72); ell(g, 2, -403, 44, 7); g.fill(); g.fillStyle = '#3a3030'; g.fillRect(-25, -420, 50, 8); }
    else if (k.hat === 'boater') { g.fillRect(-28, -432, 56, 28); ell(g, 2, -404, 52, 8); g.fill(); g.fillStyle = k.stripe || '#222'; g.fillRect(-28, -416, 56, 8); }
    else if (k.hat === 'cap') { g.beginPath(); g.ellipse(-2, -404, 33, 17, -0.08, PI, TAU); g.fill(); g.beginPath(); g.moveTo(20, -408); g.lineTo(52, -400); g.lineTo(24, -398); g.closePath(); g.fill(); }
    else if (k.hat === 'beret') { ell(g, -4, -410, 37, 13, -0.15); g.fill(); g.fillRect(-2, -426, 4, 6); }
    else if (k.hat === 'bun') { g.fillStyle = k.hair; ell(g, -24, -410, 15, 15); g.fill(); }
    else if (k.hat === 'visor') { g.fillRect(-26, -414, 52, 9); g.beginPath(); g.moveTo(22, -414); g.lineTo(56, -404); g.lineTo(24, -404); g.closePath(); g.fill(); }
    arm(20, AR[1], k.coat);
    g.restore();
    g.restore();
  }

  // The bubble car, drawn as a flat photo cut-out; nose to +x.
  function pxCar(c, x, y, s, lift, tilt) {
    const sh = 1 - lift / 160;
    c.fillStyle = `rgba(20,20,18,${0.4 * sh})`; ell(c, x, y + 2, 150 * s * (0.6 + 0.4 * sh), 12 * s); c.fill();
    c.save(); c.translate(x, y - lift); c.rotate(tilt); c.scale(s, s);
    c.fillStyle = '#93b7c7';
    c.beginPath(); c.ellipse(-8, -112, 96, 78, 0, PI, TAU); c.fill();
    rrect(c, -168, -120, 336, 84, 38); c.fill();
    c.fillStyle = '#2b3338';
    c.beginPath(); c.ellipse(-62, -122, 40, 50, 0, PI, PI * 1.5); c.lineTo(-62, -122); c.closePath(); c.fill();
    c.fillRect(-16, -176, 82, 54);
    c.fillStyle = '#c9a283'; ell(c, 20, -146, 16, 18); c.fill(); c.fillStyle = '#2b2019'; c.beginPath(); c.arc(20, -152, 17, PI, TAU); c.fill();
    // a hard key light from the left, as on the actors
    c.save(); rrect(c, -168, -120, 336, 84, 38); c.clip();
    const lg = c.createLinearGradient(0, -120, 0, -36); lg.addColorStop(0, 'rgba(255,250,235,0.25)'); lg.addColorStop(0.5, 'rgba(0,0,0,0)'); lg.addColorStop(0.52, 'rgba(10,20,30,0.25)'); lg.addColorStop(1, 'rgba(10,20,30,0.4)');
    c.fillStyle = lg; c.fillRect(-170, -122, 340, 90); c.restore();
    c.fillStyle = '#ddd9cc'; rrect(c, -176, -58, 40, 14, 6); c.fill(); rrect(c, 140, -58, 40, 14, 6); c.fill();
    c.fillStyle = '#f2ecc8'; ell(c, 150, -92, 12, 12); c.fill();
    [[-96, -30], [100, -30]].forEach(([wx, wy]) => { c.fillStyle = '#18181a'; ell(c, wx, wy, 32, 32); c.fill(); c.fillStyle = '#c8c6bd'; ell(c, wx, wy, 13, 13); c.fill(); });
    c.restore();
  }

  // Neighbours' flower: it grows in jumps, one pose per exposure.
  function pxFlower(c, x, y, u, f) {
    if (u <= 0) return;
    const h = 150 * Math.min(1, u * 1.3), sw = Math.sin(f * 1.7) * 2;
    c.strokeStyle = '#3f6a2a'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 10, y - h * 0.5, x + sw, y - h); c.stroke();
    if (u > 0.35) { c.fillStyle = '#4f7c33'; ell(c, x - 22, y - h * 0.35, 24, 9, 0.5); c.fill(); ell(c, x + 22, y - h * 0.55, 22, 8, -0.5); c.fill(); }
    if (u > 0.7) {
      const b = Math.min(1, (u - 0.7) / 0.3);
      c.fillStyle = '#d23b2f';
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; ell(c, x + sw + Math.cos(a) * 20 * b, y - h + Math.sin(a) * 20 * b, 17 * b, 10 * b, a); c.fill(); }
      c.fillStyle = '#f0c63c'; ell(c, x + sw, y - h, 10 * b, 10 * b); c.fill();
    }
  }

  // Where everyone stands in a given exposure.
  function pxCast(tq, f) {
    const jit = (id, k) => hash(f * 13.7 + id * 71 + k * 5.3) - 0.5;
    const out = [];
    if (tq < PX_T.swap) {
      if (tq >= PX_T.slideA) {
        const u = E.ioS(seg(tq, PX_T.slideA, PX_T.slideEnd));
        out.push({ id: 0, x: lerp(-170, 690, u), y: 950, s: 1, lift: 0, pose: 'stand', arms: 'down', lean: 0, dir: 1, cost: PX_A[0] });
      }
      if (tq >= PX_T.hopB) {
        const air = tq < PX_T.hopEnd;
        out.push({ id: 1, x: lerp(2080, 1230, seg(tq, PX_T.hopB, PX_T.hopEnd)), y: 950, s: 0.97, lift: air ? 84 + jit(1, 9) * 34 : 0, pose: air ? 'tuck' : 'stand', arms: air ? 'up' : 'down', lean: 0, dir: -1, cost: PX_B[0] });
      }
      const bw = Math.sin(PI * seg(tq, PX_T.bow, PX_T.bow + 0.42));
      out.forEach(a => { a.lean += bw * 0.42; });
    } else if (tq < PX_T.ride) {
      const k = Math.min(5, Math.floor((tq - PX_T.swap) * 3)), S = PX_SW[k];
      out.push({ id: 0, x: S[0], y: 950, s: 1, lift: S[3], pose: S[1], arms: S[2], lean: 0, dir: 1, cost: PX_A[k % 4] });
      out.push({ id: 1, x: S[4], y: 950, s: 0.97, lift: S[7], pose: S[5], arms: S[6], lean: S[6] === 'down' ? 0.3 : 0, dir: -1, cost: PX_B[(k + 1) % 4] });
    } else if (tq < PX_T.rideEnd) {
      // the invisible car: both seated on nothing, tandem, round the flower
      const u = seg(tq, PX_T.ride, PX_T.rideEnd);
      [[0, 0, PX_A[3]], [1, -0.42, PX_B[2]]].forEach(([id, dth, cost]) => {
        const th = PI + u * TAU * 0.9 + dth, y = 905 + 56 * Math.sin(th);
        out.push({ id, x: 960 + 560 * Math.cos(th), y, s: 0.86 + (y - 849) / 112 * 0.14, lift: 8 + jit(id, 3) * 8, pose: 'sit', arms: 'wheel', lean: -0.1, dir: -Math.sin(th) >= 0 ? 1 : -1, cost });
      });
    } else {
      const pop = tq >= PX_T.pop && tq < PX_T.pop + 2.5 / PX_FPS;
      const arms = tq >= PX_T.title ? 'present' : 'down';
      out.push({ id: 0, x: 300, y: 955, s: 1, lift: pop ? 72 : 0, pose: pop ? 'tuck' : 'stand', arms: pop ? 'up' : arms, lean: 0, dir: 1, cost: PX_A[3] });
      out.push({ id: 1, x: 1620, y: 955, s: 0.97, lift: pop ? 66 : 0, pose: pop ? 'tuck' : 'stand', arms: pop ? 'up' : arms, lean: 0, dir: -1, cost: PX_B[2] });
    }
    // nobody holds perfectly still between exposures
    out.forEach(a => { a.x += jit(a.id, 1) * 7; a.y += jit(a.id, 2) * 3; a.lean += jit(a.id, 4) * 0.035; });
    return out;
  }

  MG.film({
    id: 'pixilation', dur: 10, poster: 9.6,
    fonts: [['400 250px "Bebas Neue"', 'PIXILATION'], ['700 34px "Courier Prime"', 'LIVE ACTORS · ONE FRAME AT A TIME'], ['400 24px "Courier Prime"', 'after McLaren 1952 PES Gabriel 1986']],
    meta: {
      family: 'F', name: 'Pixilation', sub: 'Live actors, one frame at a time', era: '1908 —',
      origin: 'Pixilation animates real people and objects with the stop-motion camera: actors hold a pose for each exposure, move a little, and hold again, so on screen they glide, levitate and change clothes without ever walking. Émile Cohl and Segundo de Chomón used the trick in the 1900s; Norman McLaren made it an art form at the National Film Board of Canada with Neighbours (1952), which won an Academy Award, and the technique returned in music videos with Peter Gabriel’s Sledgehammer and in the short films of PES.',
      works: 'Neighbours (Norman McLaren, NFB, 1952) · A Chairy Tale (Norman McLaren & Claude Jutra, 1957) · Sledgehammer (Peter Gabriel, dir. Stephen R. Johnson, with Aardman and the Brothers Quay, 1986) · Western Spaghetti (PES, 2008) · Fresh Guacamole (PES, 2012)',
      tech: ['Stepped 12 fps exposures', 'Airborne-every-frame hops', 'Jump-cut costume swaps'],
      accent: '#d23b2f',
      motionDNA: 'Time is chopped into exposures: people slide along the ground with their legs locked, hop through the air without ever landing, sit on nothing and drive, and swap clothes, poses and places at every cut, while a little jitter between frames keeps every held pose alive.',
      visualDNA: 'Ordinary daylight locations shot on film: a park lawn with mowing stripes, railings, terraced houses and a street; actors in period clothes lit like photographs with a hard key light, contact shadows that stay on the grass, heavy grain, gate weave and slight exposure flicker from frame to frame.',
      transitions: 'Glide-in, levitating hop, bow, jump cuts on the third of a second, invisible-car ride, letter-per-frame title placement',
      implementation: ['Film or DSLR camera with intervalometer, actors posed per frame', 'Dragonframe / Stop Motion Studio onion skinning', 'Canvas 2D (time quantised to 12 fps)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const W = 1920, H = 1080, r = rng(1952);
      const bg = offscreen(W + 40, H + 40), g = bg.getContext('2d');
      g.translate(20, 20);
      // overcast sky, warmer toward the rooftops
      const sk = g.createLinearGradient(0, -20, 0, 560);
      sk.addColorStop(0, '#a9bbc3'); sk.addColorStop(0.65, '#d5dbd7'); sk.addColorStop(1, '#ebe5d6');
      g.fillStyle = sk; g.fillRect(-20, -20, W + 40, 600);
      soft(g, 22, q => { for (let i = 0; i < 16; i++) { q.fillStyle = `rgba(255,255,250,${0.12 + r() * 0.14})`; ell(q, r() * W, 40 + r() * 260, 160 + r() * 260, 40 + r() * 50); q.fill(); } });
      // distant trees above the terrace, out of focus
      soft(g, 4, q => { for (let i = 0; i < 60; i++) { q.fillStyle = `rgb(${96 + r() * 20},${112 + r() * 20},${92 + r() * 14})`; ell(q, r() * W, 300 + r() * 60, 40 + r() * 70, 30 + r() * 40); q.fill(); } });
      // a terrace of houses across the street, slightly soft
      const hc = offscreen(W, 600), h = hc.getContext('2d');
      const bricks = ['#8e5643', '#9a6a4f', '#7d4a3c', '#a77b5c', '#d4c8b2', '#b98f6c', '#cfc3ab'];
      const doors = ['#7a2226', '#24365a', '#2f4a32', '#18181a', '#d8c27a'];
      for (let x = -30; x < W + 30;) {
        const w = 210 + r() * 100, hh = 200 + r() * 90, top = 545 - hh, col = bricks[(r() * bricks.length) | 0];
        h.fillStyle = col; h.fillRect(x, top, w + 1, hh);
        if (col !== '#d4c8b2' && col !== '#cfc3ab') for (let y = top; y < 545; y += 6) { h.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.05})`; h.fillRect(x, y, w, 1); }
        h.fillStyle = 'rgba(40,30,25,0.55)'; h.fillRect(x, top - 12, w + 1, 14);
        const cx = x + w * (0.2 + r() * 0.6); h.fillStyle = shade(col, 0.8); h.fillRect(cx, top - 46, 34, 36);
        h.fillStyle = '#8b5a3a'; for (let k = 0; k < 3; k++) h.fillRect(cx + 3 + k * 11, top - 56, 7, 12);
        const cols = Math.max(2, Math.floor(w / 80));
        for (let rr = 0; rr < 2; rr++) for (let k = 0; k < cols; k++) {
          const wx = x + 22 + k * (w - 44) / cols + ((w - 44) / cols - 42) / 2, wy = top + 26 + rr * (hh - 110) / 1.6;
          if (rr === 1 && k === 0) continue;
          h.fillStyle = '#ebe6db'; h.fillRect(wx - 5, wy - 5, 52, 72);
          const pg = h.createLinearGradient(0, wy, 0, wy + 62); pg.addColorStop(0, '#8c979b'); pg.addColorStop(0.4, '#2e3438'); pg.addColorStop(1, '#23272a');
          h.fillStyle = pg; h.fillRect(wx, wy, 42, 62);
          h.fillStyle = '#ebe6db'; h.fillRect(wx + 19, wy, 4, 62); h.fillRect(wx, wy + 29, 42, 4);
        }
        h.fillStyle = doors[(r() * doors.length) | 0]; h.fillRect(x + 22, 545 - 86, 44, 86);
        h.fillStyle = '#ebe6db'; h.fillRect(x + 16, 545 - 92, 56, 8);
        x += w;
      }
      g.filter = 'blur(1.3px)'; g.drawImage(hc, 0, 0); g.filter = 'none';
      // plane trees on the far pavement
      [150, 720, 1330, 1840].forEach((tx, i) => {
        g.fillStyle = '#5b5247'; g.fillRect(tx - 9, 330, 18, 220);
        // the canopy as thousands of leaf clumps, lit from the upper left, darker inside and beneath
        soft(g, 0.8, q => {
          for (let k = 0; k < 1400; k++) {
            const a = r() * TAU, d = Math.sqrt(r()), lx = Math.cos(a) * d, ly = Math.sin(a) * d;
            const lit = clamp(0.55 - lx * 0.35 - ly * 0.45 + (r() - 0.5) * 0.5 - (k < 500 ? 0.35 : 0));
            q.fillStyle = `rgb(${lerp(38, 128, lit) | 0},${lerp(56, 150, lit) | 0},${lerp(30, 78, lit) | 0})`;
            ell(q, tx + lx * 200 + vnoise(a * 3, i) * 20, 290 + ly * 125, 6 + r() * 12, 5 + r() * 9, r() * PI); q.fill();
          }
        });
      });
      // street: far pavement, asphalt, kerb, near pavement
      g.fillStyle = '#aaa398'; g.fillRect(-20, 545, W + 40, 20);
      g.fillStyle = '#5f5e5b'; g.fillRect(-20, 565, W + 40, 68);
      for (let k = 0; k < 5000; k++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.12)'; g.fillRect(r() * W, 565 + r() * 68, 2, 1.5); }
      g.fillStyle = 'rgba(235,230,210,0.55)'; for (let x = 0; x < W; x += 120) g.fillRect(x, 597, 60, 4);
      g.fillStyle = '#d2ccc0'; g.fillRect(-20, 632, W + 40, 9);
      g.fillStyle = '#b7b0a3'; g.fillRect(-20, 641, W + 40, 64);
      g.fillStyle = 'rgba(60,55,45,0.25)'; for (let x = 0; x < W; x += 92) g.fillRect(x, 641, 2, 64); g.fillRect(-20, 672, W + 40, 2);

      // foreground layer: railings, lawn, bench and lamp (the hopping car passes behind it)
      const fg = offscreen(W + 40, H + 40), q = fg.getContext('2d');
      q.translate(20, 20);
      const lw = q.createLinearGradient(0, 704, 0, 1100);
      lw.addColorStop(0, '#869f55'); lw.addColorStop(0.45, '#64843a'); lw.addColorStop(1, '#4a6a2b');
      q.fillStyle = lw; q.fillRect(-20, 704, W + 40, 400);
      // mowing stripes converge on the street
      q.save(); q.beginPath(); q.rect(-20, 704, W + 40, 400); q.clip();
      for (let k = -12; k < 20; k += 2) {
        q.fillStyle = 'rgba(240,250,200,0.07)';
        q.beginPath(); q.moveTo(960 + k * 70, 704); q.lineTo(960 + (k + 1) * 70, 704); q.lineTo(960 + (k + 1) * 360, 1100); q.lineTo(960 + k * 360, 1100); q.closePath(); q.fill();
      }
      for (let k = 0; k < 26000; k++) {
        const v = Math.pow(r(), 0.8), y = 704 + v * 390, x = r() * W, len = 2 + v * 13;
        q.strokeStyle = r() < 0.5 ? `rgba(40,70,20,${0.25 + r() * 0.3})` : `rgba(170,200,110,${0.15 + r() * 0.25})`;
        q.lineWidth = 0.8 + v * 1.4;
        q.beginPath(); q.moveTo(x, y); q.lineTo(x + (r() - 0.5) * len * 0.6, y - len); q.stroke();
      }
      for (let k = 0; k < 90; k++) { q.fillStyle = 'rgba(250,248,235,0.85)'; const v = r(); ell(q, r() * W, 720 + v * 350, 1.5 + v * 2.5, 1 + v * 1.5); q.fill(); }
      // dappled shade from a tree out of frame
      soft(q, 26, z => { for (let k = 0; k < 10; k++) { z.fillStyle = 'rgba(20,40,10,0.16)'; ell(z, 1500 + r() * 500, 760 + r() * 160, 90 + r() * 120, 30 + r() * 30); z.fill(); } });
      q.restore();
      // iron railings with spear tops
      q.fillStyle = '#1c1f1d';
      for (let x = -10; x < W + 10; x += 15) { q.fillRect(x, 628, 4, 78); q.beginPath(); q.moveTo(x - 2, 630); q.lineTo(x + 2, 619); q.lineTo(x + 6, 630); q.fill(); }
      q.fillRect(-20, 636, W + 40, 5); q.fillRect(-20, 690, W + 40, 6);
      // a park bench and a lamp post
      q.fillStyle = '#6c4a30'; for (let k = 0; k < 3; k++) q.fillRect(220, 724 + k * 13, 230, 8);
      q.fillStyle = '#7a5537'; for (let k = 0; k < 2; k++) q.fillRect(214, 768 + k * 9, 242, 7);
      q.fillStyle = '#1c1f1d'; q.fillRect(230, 768, 8, 36); q.fillRect(432, 768, 8, 36); q.fillRect(226, 720, 8, 50); q.fillRect(436, 720, 8, 50);
      q.fillStyle = 'rgba(20,35,10,0.3)'; ell(q, 340, 806, 140, 10); q.fill();
      q.fillStyle = '#1f2a22'; q.fillRect(1712, 350, 12, 400); q.fillRect(1700, 742, 36, 12);
      q.beginPath(); q.moveTo(1694, 350); q.lineTo(1742, 350); q.lineTo(1734, 300); q.lineTo(1702, 300); q.closePath(); q.fill();
      q.fillStyle = 'rgba(240,235,210,0.6)'; q.fillRect(1706, 306, 24, 40);
      q.beginPath(); q.moveTo(1700, 300); q.lineTo(1718, 284); q.lineTo(1736, 300); q.closePath(); q.fillStyle = '#1f2a22'; q.fill();
      return { bg, fg, fig: offscreen(560, 720) };
    },
    draw(c, t, W, H, st) {
      // every pose is one exposure: time only exists in twelfths of a second
      const f = Math.floor(t * PX_FPS + 1e-6), tq = f / PX_FPS;
      c.save();
      // gate weave: each frame sits a pixel or two differently on the register pins
      c.translate((hash(f * 3.1) - 0.5) * 5, (hash(f * 5.7) - 0.5) * 3);
      c.drawImage(st.bg, -20, -20);
      // the bubble car hops down the street, one hop every three frames
      if (tq >= PX_T.car && tq < PX_T.carEnd) {
        const f0 = Math.round(PX_T.car * PX_FPS), ph = ((f - f0) % 3) / 3;
        const x = lerp(-260, 2200, (tq - PX_T.car) / (PX_T.carEnd - PX_T.car));
        pxCar(c, x, 628, 0.42, Math.sin(ph * PI) * 50, -Math.cos(ph * PI) * 0.09);
      }
      c.drawImage(st.fg, -20, -20);

      // the title, laid out on the lawn in cardboard letters, one letter per frame
      if (tq >= PX_T.title) {
        const s = 'PIXILATION', fs = 250, n = Math.min(s.length, f - Math.round(PX_T.title * PX_FPS) + 1);
        c.font = `400 ${fs}px "Bebas Neue"`;
        const ws = [...s].map(ch => c.measureText(ch).width), gap = 6, tw = ws.reduce((a, b) => a + b, 0) + gap * (s.length - 1);
        let x = 960 - tw / 2;
        for (let i = 0; i < s.length; i++) {
          if (i < n) {
            const j = (k) => hash(f * 2.3 + i * 17 + k) - 0.5;
            const lx = x + ws[i] / 2 + j(1) * 3, ly = 786 + j(2) * 2, a = (hash(i * 9.1) - 0.5) * 0.07 + j(3) * 0.012;
            c.save(); c.translate(lx, ly); c.rotate(a);
            c.save(); c.transform(1, 0, -0.55, 0.28, 0, 0);
            for (let k = 0; k < 4; k++) text(c, s[i], (k - 1.5) * 5, (k % 2) * 6, { font: '"Bebas Neue"', size: fs, color: 'rgba(25,40,12,0.12)', align: 'center' });
            c.restore();
            text(c, s[i], 5, 4, { font: '"Bebas Neue"', size: fs, color: PX.letterE, align: 'center' });
            text(c, s[i], 0, 0, { font: '"Bebas Neue"', size: fs, color: PX.letter, align: 'center' });
            c.restore();
          }
          x += ws[i] + gap;
        }
      }
      pxFlower(c, 960, 902, tq >= PX_T.flower ? (tq - PX_T.flower) / 0.9 : 0, f);

      // the actors, nearest last; each one is shot on its own cut-out, lit from the left
      pxCast(tq, f).sort((a, b) => a.y - b.y).forEach(a => {
        const sh = 1 - Math.min(0.55, a.lift / 220);
        c.save(); c.translate(a.x + 16 * a.s * a.dir, a.y + 4); c.scale(1, 0.17);
        const gr = c.createRadialGradient(0, 0, 0, 0, 0, 110 * a.s * sh);
        gr.addColorStop(0, `rgba(22,34,12,${0.55 * sh})`); gr.addColorStop(1, 'rgba(22,34,12,0)');
        c.fillStyle = gr; c.fillRect(-130, -130, 260, 260); c.restore();
        const g = st.fig.getContext('2d');
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 560, 720);
        g.save(); g.translate(280, 660); pxActor(g, a); g.restore();
        g.globalCompositeOperation = 'source-atop';
        const lg = g.createLinearGradient(280 - 110 * a.s, 0, 280 + 110 * a.s, 0);
        lg.addColorStop(0, 'rgba(255,238,205,0.28)'); lg.addColorStop(0.47, 'rgba(255,238,205,0.04)'); lg.addColorStop(0.53, 'rgba(18,16,28,0.26)'); lg.addColorStop(1, 'rgba(18,16,28,0.42)');
        g.fillStyle = lg; g.fillRect(0, 0, 560, 720);
        const vg = g.createLinearGradient(0, 160, 0, 660); vg.addColorStop(0, 'rgba(255,245,225,0.1)'); vg.addColorStop(1, 'rgba(0,0,0,0.12)');
        g.fillStyle = vg; g.fillRect(0, 0, 560, 720);
        g.globalCompositeOperation = 'source-over';
        c.drawImage(st.fig, a.x - 280, a.y - a.lift - 660);
      });

      // the slate under the title
      if (tq >= PX_T.sub) {
        const j = hash(f * 4.4) - 0.5;
        c.save(); c.translate(960 + j * 2, 1012); c.rotate(-0.01 + j * 0.006);
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(-372, -30, 750, 66);
        c.fillStyle = PX.slate; c.fillRect(-378, -36, 750, 66);
        text(c, 'LIVE ACTORS · ONE FRAME AT A TIME', -3, 11, { font: '"Courier Prime"', weight: 700, size: 34, color: '#efe9da', align: 'center', ls: 2 });
        c.restore();
      }
      c.restore();

      // exposure flicker between frames, a faded warm print, grain that changes per exposure
      const ex = (hash(f * 9.3) - 0.5) * 0.06;
      c.fillStyle = ex > 0 ? `rgba(255,248,235,${ex})` : `rgba(0,0,0,${-ex})`; c.fillRect(0, 0, W, H);
      c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = 'rgba(236,196,140,0.45)'; c.fillRect(0, 0, W, H); c.restore();
      vignette(c, W, H, 0.5, '20,14,8');
      grain(c, W, H, tq, 0.16, 'overlay');
      grain(c, W, H, tq + 0.5, 0.05, 'source-over');
    },
    score(A) {
      A.bus.gain.value = 0.8;
      const b = 0.5;
      // the camera: a soft shutter tick on every second exposure
      for (let f = 3; f < 120; f += 2) A.noise(f / PX_FPS, { type: 'bandpass', f: 3400, q: 3, dur: 0.012, g: 0.022, pan: 0.3 });
      // a plucked double bass walks under everything
      const walk = [43, 47, 50, 52, 43, 47, 50, 49, 48, 52, 55, 57, 48, 52, 55, 54, 43, 47, 50, 52];
      walk.forEach((m, i) => A.pluck(0.25 + i * b, midi(m), { dur: 0.7, g: 0.42, bright: 0.3, decay: 0.99, lp: 900 }));
      // McLaren's drawn sound: the glide is a held, wavering tone that never steps
      A.osc(PX_T.slideA, { type: 'triangle', f: midi(67), f2: midi(74), glide: 2.2, dur: 2.25, g: 0.05, vib: [5, 5], hold: true, rel: 0.15, lp: 2200 });
      // every frame of the hop is its own jump: a chirp per pair of exposures
      for (let t = PX_T.hopB, k = 0; t < PX_T.hopEnd; t += 2 / PX_FPS, k++) A.osc(t, { type: 'square', f: midi([79, 83, 86, 83][k % 4]), f2: midi([79, 83, 86, 83][k % 4] + 5), glide: 0.06, dur: 0.08, g: 0.022, lp: 2600, pan: -0.3 });
      A.kick(PX_T.hopEnd, 0.35, { f: 120, f2: 50 });
      // the bow: two polite low notes
      A.pluck(PX_T.bow, midi(55), { dur: 0.9, g: 0.25, bright: 0.5 }); A.pluck(PX_T.bow + 0.25, midi(50), { dur: 1.2, g: 0.25, bright: 0.5 });
      // jump cuts: a horn stab and a snap on every costume change, a groove under them
      for (let k = 0; k < 6; k++) {
        const t = PX_T.swap + k / 3, root = [55, 58, 53, 55, 60, 58][k];
        A.chord(t, [root, root + 4, root + 7, root + 10].map(m => m - 12), { type: 'sawtooth', dur: 0.16, g: 0.03, lp: 1800, a: 0.004 });
        A.clap(t, 0.12, { rev: 0.1 });
        A.noise(t, { type: 'bandpass', f: 900, q: 6, dur: 0.03, g: 0.08 });
      }
      for (let t = PX_T.swap; t < PX_T.rideEnd - 0.01; t += b) {
        A.kick(t, 0.5); A.hat(t + b / 2, 0.05);
        if (Math.round((t - PX_T.swap) / b) % 2 === 1) A.snare(t, 0.22, { rev: 0.1 });
      }
      // the car: a spring boing per hop
      for (let t = PX_T.car; t < PX_T.carEnd; t += 3 / PX_FPS) A.osc(t, { f: 170, f2: 330, glide: 0.11, dur: 0.18, g: 0.035, vib: [18, 12], pan: lerp(-0.7, 0.7, (t - PX_T.car) / 3.4) });
      // the flower pops up
      [0, 3, 6, 9].forEach((k, i) => A.osc(PX_T.flower + k / PX_FPS, { f: midi(84 + i * 3), dur: 0.12, g: 0.03, type: 'triangle' }));
      // the invisible car: a squeezebox waltz and a slide whistle around the bends
      [[PX_T.ride, [55, 59, 62]], [PX_T.ride + 0.5, [55, 60, 64]], [PX_T.ride + 1.0, [57, 60, 65]], [PX_T.ride + 1.5, [55, 59, 62, 65]]].forEach(([t, ch]) => A.chord(t, ch, { type: 'sawtooth', dur: 0.48, g: 0.022, lp: 1400, a: 0.03, hold: true, rel: 0.08, spread: 9 }));
      A.osc(PX_T.ride, { f: 700, f2: 1300, glide: 0.9, dur: 0.95, g: 0.028, vib: [6, 10] });
      A.osc(PX_T.ride + 1.0, { f: 1300, f2: 650, glide: 0.95, dur: 1.0, g: 0.028, vib: [6, 10] });
      // the title: one pizzicato note per cardboard letter, then a cadence
      [62, 64, 66, 67, 69, 71, 73, 74, 76, 78].forEach((m, i) => A.pluck(PX_T.title + i / PX_FPS, midi(m), { dur: 0.5, g: 0.2, bright: 0.65 }));
      A.chord(PX_T.sub, [50, 57, 62, 66, 69], { type: 'triangle', dur: 1.6, g: 0.05, a: 0.01, rev: 0.4 });
      A.pluck(PX_T.sub, midi(38), { dur: 1.5, g: 0.45, bright: 0.3, lp: 800 });
      A.osc(PX_T.pop, { f: 220, f2: 660, glide: 0.1, dur: 0.2, g: 0.05 });
      A.osc(PX_T.pop + 2.5 / PX_FPS, { f: 600, f2: 200, glide: 0.1, dur: 0.18, g: 0.04 });
      A.kick(PX_T.pop + 2.5 / PX_FPS, 0.35, { f: 110, f2: 50 });
    },
  });

  /* =====================================================================
     DATABEND — a holiday JPEG opened as bytes instead of as a picture. It
     decodes block by block onto grey; a hex editor slides in and three
     bytes are overwritten, and each time the decoder loses step from that
     block on: the rest of the image slips along the scan order, its colour
     knocked off, DCT stripes where the damage starts. Then the file is a
     video with its next I-frame deleted: the new shot's motion vectors drag
     the old sunset's pixels into a bloom and a swirl, the night city leaking
     through only where things move. The result is imported as raw audio, an
     echo is applied and saved back as colour banding; a clean I-frame
     finally arrives with the title, and the bottom of the picture starts to
     drip again
     ===================================================================== */
  const DB = { bar: 'rgba(9,11,14,0.92)', ink: '#e9e5db', dim: '#7f8690', red: '#ff3b5c', amber: '#ffb547', cyan: '#62e3e8', panel: 'rgba(10,12,16,0.9)' };
  const DB_W = 480, DB_H = 272, DB_NX = 60, DB_NY = 34, DB_NB = DB_NX * DB_NY, DB_FPS = 15;
  const DB_T = { load: 0.1, loadEnd: 1.2, hex: 1.25, hexOut: 3.1, cut: 3.4, swirl: 4.75, moshEnd: 6.2, sonEnd: 7.75, iframe: 7.75, drip: 8.1, sub: 8.45 };
  // the three hand edits: which block the damaged byte lands in, how far the decoder slips, the DC error
  const DB_ED = [
    { at: 1.75, blk: 610, shift: 6, dc: [36, -8, -30], addr: 0x2c41, old: 0x3f, nw: 0xff, garb: 22 },
    { at: 2.3, blk: 1085, shift: -19, dc: [-38, 26, 46], addr: 0x5a17, old: 0x91, nw: 0x00, garb: 30 },
    { at: 2.85, blk: 1530, shift: 11, dc: [18, -36, 22], addr: 0x8e03, old: 0xc8, nw: 0x4a, garb: 26, swap: true },
  ];
  const DB_HDR = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43];
  const dbByte = a => {
    if (a < DB_HDR.length) return DB_HDR[a];
    return (hash(a * 0.731 + 11) * 256) | 0;
  };
  const hex2 = v => v.toString(16).toUpperCase().padStart(2, '0');

  // the holiday snapshot: a sunset over the sea, palm, sailboat
  function dbSunset(g) {
    const r = rng(2010);
    const sk = g.createLinearGradient(0, 0, 0, 168);
    sk.addColorStop(0, '#191d5a'); sk.addColorStop(0.35, '#77308c'); sk.addColorStop(0.62, '#e5486b'); sk.addColorStop(0.84, '#ff9b4b'); sk.addColorStop(1, '#ffd47c');
    g.fillStyle = sk; g.fillRect(0, 0, DB_W, 170);
    const gl = g.createRadialGradient(300, 138, 0, 300, 138, 120);
    gl.addColorStop(0, 'rgba(255,240,190,0.9)'); gl.addColorStop(0.25, 'rgba(255,190,110,0.5)'); gl.addColorStop(1, 'rgba(255,150,90,0)');
    g.fillStyle = gl; g.fillRect(0, 0, DB_W, 170);
    g.fillStyle = '#fff4c8'; ell(g, 300, 140, 25, 25); g.fill();
    for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(${200 + r() * 55},${80 + r() * 80},${120 + r() * 60},0.5)`; ell(g, r() * DB_W, 30 + r() * 100, 30 + r() * 70, 2 + r() * 3); g.fill(); }
    const ridge = (y0, amp, col, sd) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, 170); for (let x = 0; x <= DB_W; x += 4) g.lineTo(x, y0 - Math.abs(vnoise(x / 60, sd)) * amp - vnoise(x / 17, sd + 3) * amp * 0.2); g.lineTo(DB_W, 170); g.closePath(); g.fill(); };
    ridge(160, 46, '#6a2f74', 4); ridge(168, 26, '#331b4c', 9);
    const sea = g.createLinearGradient(0, 168, 0, DB_H);
    sea.addColorStop(0, '#5a2f6e'); sea.addColorStop(0.4, '#2a2160'); sea.addColorStop(1, '#0c0f2e');
    g.fillStyle = sea; g.fillRect(0, 168, DB_W, DB_H - 168);
    for (let y = 170; y < DB_H; y += 3) { const w = 70 * (1 - (y - 170) / 140) + 10, x = 300 + Math.sin(y * 0.7) * 6; g.fillStyle = `rgba(255,${170 + r() * 70},110,${0.75 - (y - 170) / 160})`; g.fillRect(x - w / 2 + (r() - 0.5) * 20, y, w * (0.3 + r() * 0.7), 2); }
    // palm and boat in silhouette
    g.strokeStyle = '#140a1c'; g.lineWidth = 6; g.lineCap = 'round';
    g.beginPath(); g.moveTo(70, DB_H); g.quadraticCurveTo(66, 150, 96, 74); g.stroke();
    g.lineWidth = 4;
    [[-2.6, 60], [-2.1, 66], [-1.2, 56], [-0.5, 62], [0.2, 52], [-3.0, 48]].forEach(([a, L]) => { g.beginPath(); g.moveTo(96, 74); g.quadraticCurveTo(96 + Math.cos(a) * L * 0.6, 74 + Math.sin(a) * L * 0.6 - 14, 96 + Math.cos(a) * L, 74 + Math.sin(a) * L + 18); g.stroke(); });
    g.fillStyle = '#140a1c';
    g.beginPath(); g.moveTo(170, 196); g.lineTo(214, 196); g.lineTo(206, 204); g.lineTo(176, 204); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(190, 194); g.lineTo(190, 150); g.lineTo(210, 192); g.closePath(); g.fill();
  }
  // the next shot, whose I-frame is deleted: a night city across the water
  function dbCity(g) {
    const r = rng(2005);
    const sk = g.createLinearGradient(0, 0, 0, 180);
    sk.addColorStop(0, '#04051a'); sk.addColorStop(0.6, '#191362'); sk.addColorStop(1, '#4b2277');
    g.fillStyle = sk; g.fillRect(0, 0, DB_W, 180);
    g.fillStyle = '#f2efd6'; ell(g, 392, 46, 17, 17); g.fill();
    for (let k = 0; k < 60; k++) { g.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.6})`; g.fillRect(r() * DB_W, r() * 110, 1, 1); }
    const lights = ['#ffd36b', '#6cf0ff', '#ff5fb0', '#ffe9b0'];
    for (let x = -6; x < DB_W;) {
      const w = 16 + r() * 34, h = 40 + r() * 110, top = 178 - h;
      g.fillStyle = r() < 0.5 ? '#0e1031' : '#171b47'; g.fillRect(x, top, w, h);
      for (let y = top + 4; y < 172; y += 6) for (let wx = x + 3; wx < x + w - 3; wx += 5) if (r() < 0.42) { g.fillStyle = lights[(r() * (r() < 0.8 ? 1 : 4)) | 0]; g.fillRect(wx, y, 2, 3); }
      if (r() < 0.25) { g.fillStyle = r() < 0.5 ? '#ff4fa3' : '#3ff0ff'; g.fillRect(x + 2, top + 8, w - 4, 4); }
      x += w + 1;
    }
    const sea = g.createLinearGradient(0, 178, 0, DB_H);
    sea.addColorStop(0, '#120f3e'); sea.addColorStop(1, '#03040f');
    g.fillStyle = sea; g.fillRect(0, 178, DB_W, DB_H - 178);
    for (let k = 0; k < 220; k++) { const x = r() * DB_W, y = 180 + r() * 90; g.fillStyle = lights[(r() * 4) | 0]; g.globalAlpha = 0.35 * (1 - (y - 180) / 100); g.fillRect(x, y, 2 + r() * 6, 1); }
    g.globalAlpha = 1;
  }

  // Decode with damage: every block after a broken byte is read out of step (shift along the scan
  // order), its DC term knocked off (colour cast), the first few become stray DCT basis stripes.
  function dbDecode(src, dst, t, loaded = DB_NB, edits = DB_ED) {
    for (let i = 0; i < DB_NB; i++) {
      const bx = i % DB_NX, by = (i / DB_NX) | 0;
      let sh = 0, dr = 0, dg = 0, dbb = 0, swap = false, garb = null;
      for (let k = 0; k < edits.length; k++) {
        const e = edits[k];
        if (t < e.at) continue;
        const reach = e.blk + seg(t, e.at, e.at + 0.22) * (DB_NB - e.blk);
        if (i < e.blk || i > reach) continue;
        sh += e.shift; dr += e.dc[0]; dg += e.dc[1]; dbb += e.dc[2];
        if (e.swap) swap = true;
        if (i - e.blk < e.garb) garb = e;
      }
      const j = i - sh, ok = i < loaded && j >= 0 && j < DB_NB;
      const sx0 = (j % DB_NX) * 8, sy0 = ((j / DB_NX) | 0) * 8;
      const gu = garb ? 1 + ((hash(i * 1.7) * 7) | 0) : 0, gv = garb ? (hash(i * 2.9) * 4) | 0 : 0;
      for (let y = 0; y < 8; y++) {
        let di = ((by * 8 + y) * DB_W + bx * 8) * 4, si = ((sy0 + y) * DB_W + sx0) * 4;
        for (let x = 0; x < 8; x++, di += 4, si += 4) {
          if (!ok) { dst[di] = dst[di + 1] = dst[di + 2] = 128; dst[di + 3] = 255; continue; }
          let R = src[si] + dr, G = src[si + 1] + dg, B = src[si + 2] + dbb;
          if (garb) {
            const p = Math.cos((x + 0.5) * gu * PI / 8) * Math.cos((y + 0.5) * gv * PI / 8) * 90;
            const c0 = ((sy0 + 4) * DB_W + sx0 + 4) * 4;
            R = src[c0] + dr + p; G = src[c0 + 1] + dg + p * 0.6; B = src[c0 + 2] + dbb - p * 0.4;
          }
          if (swap) { const q = R; R = G; G = B; B = q; }
          dst[di] = R; dst[di + 1] = G; dst[di + 2] = B; dst[di + 3] = 255;
        }
      }
    }
  }

  // Motion vectors of the shot whose I-frame was removed (in source pixels per P-frame).
  function dbMV(bx, by, tn) {
    const x = bx * 8 + 4, y = by * 8 + 4;
    let dx = 0, dy = 0, res = 0;
    if (tn < DB_T.swirl) {
      // the camera pans right (old pixels dragged left) while a subject crosses and blooms outward
      const u = seg(tn, DB_T.cut, DB_T.swirl);
      dx = 3 * Math.min(1, u * 4);
      const sx = lerp(30, 450, E.ioS(u)), sy = 150 + Math.sin(u * 5) * 28, ex = x - sx, ey = y - sy, d = Math.hypot(ex, ey) + 1;
      if (d < 84) { const k = 1 - d / 84; dx += -8 * k - (ex / d) * 6 * k; dy += -(ey / d) * 6 * k; res = 0.09 * k; }
    } else {
      // a slow vortex: the camera turns as it pushes in
      const cx = 240 + Math.sin(tn * 1.3) * 50, cy = 136 + Math.cos(tn) * 16, ex = x - cx, ey = y - cy, d = Math.hypot(ex, ey) + 1;
      const k = Math.min(1, 90 / d) * E.ioS(seg(tn, DB_T.swirl, DB_T.swirl + 0.4));
      dx = (-ey * 0.07 + (ex / d) * 2.2) * k; dy = (ex * 0.07 + (ey / d) * 2.2) * k;
      const m = Math.hypot(dx, dy); if (m > 8) { dx *= 8 / m; dy *= 8 / m; }
      res = m > 5 ? 0.04 : 0;
    }
    return [Math.round(dx), Math.round(dy), res];
  }
  // One P-frame applied to the previous picture: each 8×8 block copies from where its vector points.
  function dbStep(prev, next, tn, mvFn, resid) {
    const p32 = new Uint32Array(prev.buffer), n32 = new Uint32Array(next.buffer);
    for (let by = 0; by < DB_NY; by++) for (let bx = 0; bx < DB_NX; bx++) {
      const [dx, dy, res] = mvFn(bx, by, tn);
      for (let y = by * 8, ye = y + 8; y < ye; y++) {
        const sy = clamp(y + dy, 0, DB_H - 1) * DB_W;
        for (let x = bx * 8, xe = x + 8; x < xe; x++) n32[y * DB_W + x] = p32[sy + clamp(x + dx, 0, DB_W - 1)];
      }
      if (res > 0 && resid) {
        // the residual only carries the new shot where something moves
        for (let y = by * 8, ye = y + 8; y < ye; y++) for (let x = bx * 8, xe = x + 8; x < xe; x++) {
          const i = (y * DB_W + x) * 4;
          next[i] += (resid[i] - next[i]) * res; next[i + 1] += (resid[i + 1] - next[i + 1]) * res; next[i + 2] += (resid[i + 2] - next[i + 2]) * res;
        }
      }
    }
  }
  // Datamosh as a pure function of time: replay the P-frames from the last surviving I-frame.
  // (memoised per step count, so scrubbing backwards recomputes rather than reusing a later state)
  function dbMosh(st, key, base, t0, t, mvFn, resid) {
    const n = Math.max(0, Math.floor((t - t0) * DB_FPS + 1e-6));
    let M = st[key];
    if (!M || M.n > n || M.base !== base) M = st[key] = { n: 0, base, cur: new Uint8ClampedArray(base), tmp: new Uint8ClampedArray(base.length) };
    while (M.n < n) { dbStep(M.cur, M.tmp, t0 + (M.n + 1) / DB_FPS, mvFn, resid); const q = M.cur; M.cur = M.tmp; M.tmp = q; M.n++; }
    return M.cur;
  }
  // Sonification: the RGB bytes run as one long signal; echo taps and a byte-shift per band are applied.
  function dbSonify(src, dst, u, t) {
    const step = Math.floor(t * 4), D = 3 * (Math.round(lerp(430, 1500, u)) + step * 37) + 1, wet = 0.25 + 0.5 * u;
    let band = 0, bandEnd = 0, off = 0, crush = 0;
    for (let y = 0; y < DB_H; y++) {
      if (y >= bandEnd) {
        band++;
        const h = hash(band * 3.7 + step * 0.13);
        bandEnd = y + 3 + ((hash(band * 5.1) * 20) | 0);
        off = h > 0.5 - u * 0.25 ? Math.round((hash(band * 7.3 + step) - 0.5) * 900 * u) : 0;
        crush = hash(band * 9.1 + step) > 0.8 ? 0xc0 : 0xff;
      }
      for (let x = 0; x < DB_W; x++) {
        const di = (y * DB_W + x) * 4, base = (y * DB_W + x) * 3 + off;
        for (let ch = 0; ch < 3; ch++) {
          const j = base + ch;
          const a = rgbAt(src, j), b = rgbAt(src, j - D), c2 = rgbAt(src, j - 2 * D);
          dst[di + ch] = (a * (1 - wet * 0.45) + b * wet * 0.75 + c2 * wet * 0.35) & crush;
        }
        dst[di + 3] = 255;
      }
    }
  }
  function rgbAt(buf, j) {
    const N = DB_W * DB_H * 3;
    j = ((j % N) + N) % N;
    const p = (j / 3) | 0;
    return buf[p * 4 + (j - p * 3)];
  }

  MG.film({
    id: 'databend', dur: 10, poster: 9.3,
    fonts: [['400 22px "IBM Plex Mono"', '0123456789ABCDEF.JFIX'], ['600 34px "IBM Plex Mono"', 'Corrupting the file, not the picture'], ['400 120px "Archivo Black"', 'DATABEND']],
    meta: {
      family: 'G', name: 'Databending', sub: 'Corrupting the file, not the picture', era: '2000s —',
      origin: 'Databending treats an image or video file as raw data and breaks it on purpose: bytes are overwritten in a hex or text editor, the file is opened as audio and run through effects, or a compressed video loses its keyframes so motion from one shot drags the pixels of another (datamoshing). It grew from circuit bending and net art in the early 2000s; Takeshi Murata’s Monster Movie (2005) and Rosa Menkman’s The Collapse of PAL (2010) and Glitch Moment/um (2011) made the compression artefacts themselves the subject, and datamosh reached music videos in the late 2000s.',
      works: 'Monster Movie (Takeshi Murata, 2005) · Untitled (Pink Dot) (Takeshi Murata, 2007) · The Collapse of PAL (Rosa Menkman, 2010) · A Vernacular of File Formats (Rosa Menkman, 2010) · Welcome to Heartbreak (Kanye West, dir. Nabil Elderkin, 2009)',
      tech: ['JPEG block slip & DC shift', 'I-frame removal datamosh', 'Raw-audio echo on RGB bytes'],
      accent: '#ff3b5c',
      motionDNA: 'Damage propagates in the order the decoder reads: a single changed byte slides everything after it, a deleted keyframe lets the next shot’s motion vectors push the last picture around so pixels bloom, smear and swirl in blocks, and the decay only ever moves forward until a clean keyframe resets it.',
      visualDNA: 'A real, colourful photograph broken along its compression grid: 8×8 blocks out of step with colour casts, stray DCT stripes, decoder grey where data ran out, blocky macroblock trails, banded rows where audio effects shifted bytes, plus the tools themselves — hex dumps, frame-type strips, a waveform.',
      transitions: 'Block-by-block decode, hex edit with decoder sweep, deleted I-frame into P-frame bleed, raw-audio echo, clean I-frame reset, drip',
      implementation: ['Hex editor / text editor on JPEG and BMP', 'Audacity raw import and export', 'Avidemux / FFmpeg keyframe removal', 'Canvas 2D (per-block pixel buffers)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const mk = () => { const cv = offscreen(DB_W, DB_H); return cv.getContext('2d', { willReadFrequently: true }); };
      const a = mk(); dbSunset(a);
      const b = mk(); dbCity(b);
      const tt = mk(); dbCity(tt);
      // the title is part of the clean keyframe, so it breaks with the picture
      tt.fillStyle = 'rgba(4,5,20,0.45)'; tt.fillRect(0, 44, DB_W, 92);
      tt.font = '400 66px "Archivo Black"'; tt.textAlign = 'center';
      tt.fillStyle = '#ff3b5c'; tt.fillText('DATABEND', 243, 116);
      tt.fillStyle = '#f4f1e8'; tt.fillText('DATABEND', 240, 114);
      const get = g => g.getImageData(0, 0, DB_W, DB_H).data;
      const cv = offscreen(DB_W, DB_H);
      return { A: get(a), B: get(b), T: get(tt), cv, g: cv.getContext('2d'), img: cv.getContext('2d').createImageData(DB_W, DB_H), work: new Uint8ClampedArray(DB_W * DB_H * 4) };
    },
    draw(c, t, W, H, st) {
      const out = st.img.data;
      let phase;
      if (t < DB_T.cut) {
        // 1–2. decode, then hex edits
        phase = t < DB_T.loadEnd ? 'decoding' : 'hex edit';
        const loaded = Math.floor(seg(t, DB_T.load, DB_T.loadEnd) * DB_NB);
        dbDecode(st.A, out, t, loaded);
      } else if (t < DB_T.sonEnd) {
        if (!st.base3) { st.base3 = new Uint8ClampedArray(DB_W * DB_H * 4); dbDecode(st.A, st.base3, DB_T.cut); }
        const m = dbMosh(st, 'mosh', st.base3, DB_T.cut, Math.min(t, DB_T.moshEnd - 1e-3), dbMV, st.B);
        if (t < DB_T.moshEnd) { phase = 'datamosh'; out.set(m); }
        else { phase = 'sonified'; dbSonify(m, out, E.outQ(seg(t, DB_T.moshEnd, DB_T.sonEnd - 0.2)), t); }
      } else {
        // the clean keyframe with the title; one late edit and a drip below it
        phase = 're-saved';
        if (!st.tbase) {
          st.tbase = new Uint8ClampedArray(DB_W * DB_H * 4);
          dbDecode(st.T, st.tbase, 99, DB_NB, [{ at: 0, blk: 1270, shift: 3, dc: [24, -12, 30], garb: 12 }, { at: 0, blk: 1700, shift: -7, dc: [-20, 30, 10], garb: 18 }]);
        }
        const drip = (bx, by, tn) => {
          const on = by >= 19 && hash(bx * 3.3) > 0.45, k = seg(tn, DB_T.drip, DB_T.drip + 0.5);
          return [0, on ? -Math.round((1 + hash(bx * 7.7) * 2) * k) : 0, 0];
        };
        out.set(dbMosh(st, 'drip', st.tbase, DB_T.drip, Math.max(t, DB_T.drip), drip, null));
      }
      st.g.putImageData(st.img, 0, 0);
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      c.imageSmoothingEnabled = false;
      c.drawImage(st.cv, 0, 0, 1920, 1088);
      c.imageSmoothingEnabled = true;

      const mono = '"IBM Plex Mono"';
      // decoder sweeps: a thin line marks where the re-render has reached
      DB_ED.forEach(e => {
        const u = seg(t, e.at, e.at + 0.22);
        if (u > 0 && u < 1) {
          const blk = e.blk + u * (DB_NB - e.blk), y = Math.floor(blk / DB_NX) * 32;
          c.fillStyle = DB.amber; c.fillRect(0, y + 30, 1920, 3);
        }
      });
      if (t < DB_T.loadEnd) {
        const y = Math.floor(seg(t, DB_T.load, DB_T.loadEnd) * DB_NB / DB_NX) * 32;
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(0, y, 1920, 2);
      }

      // ---- the hex editor ----
      const hu = E.outQt(seg(t, DB_T.hex, DB_T.hex + 0.35)) * (1 - E.inQ(seg(t, DB_T.hexOut, DB_T.hexOut + 0.3)));
      if (hu > 0) {
        const px = lerp(1930, 1268, hu), py = 112, pw = 612, rows = 27, rh = 28;
        c.fillStyle = DB.panel; c.fillRect(px, py, pw, 92 + rows * rh);
        c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(px, py, pw, 44);
        text(c, 'HEX  ·  IMG_0412.JPG', px + 20, py + 30, { font: mono, weight: 600, size: 20, color: DB.ink });
        text(c, 'OVERWRITE', px + pw - 20, py + 30, { font: mono, size: 18, color: DB.red, align: 'right' });
        // scroll from the header to each edit in turn
        const keys = [[DB_T.hex, 0]];
        DB_ED.forEach(e => { keys.push([e.at - 0.42, Math.floor(e.addr / 8) - 13, E.ioC]); keys.push([e.at + 0.12, Math.floor(e.addr / 8) - 13]); });
        const top = Math.max(0, Math.round(kf(t, [[DB_T.hex + 0.3, 0], ...keys.slice(1)])));
        for (let k = 0; k < rows; k++) {
          const row = top + k, a0 = row * 8, y = py + 74 + k * rh;
          text(c, a0.toString(16).toUpperCase().padStart(8, '0'), px + 20, y, { font: mono, size: 20, color: DB.dim });
          let asc = '';
          for (let b = 0; b < 8; b++) {
            const a = a0 + b, ex = px + 152 + b * 40;
            let v = dbByte(a), col = DB.ink;
            const e = DB_ED.find(q => q.addr === a);
            if (e) {
              v = e.old;
              if (t >= e.at - 0.32 && t < e.at) { c.fillStyle = DB.amber; c.fillRect(ex - 4, y - 21, 36, 28); col = '#000'; }
              if (t >= e.at) { v = e.nw; c.fillStyle = DB.red; c.fillRect(ex - 4, y - 21, 36, 28); col = '#fff'; }
            }
            text(c, hex2(v), ex, y, { font: mono, size: 20, color: col });
            asc += v >= 32 && v < 127 ? String.fromCharCode(v) : '.';
          }
          text(c, asc, px + 482, y, { font: mono, size: 20, color: DB.dim });
        }
      }

      // ---- frame-type strip: the keyframe of shot two is gone ----
      const fu = E.outQt(seg(t, DB_T.cut - 0.25, DB_T.cut + 0.1)) * (1 - seg(t, DB_T.moshEnd - 0.2, DB_T.moshEnd));
      if (fu > 0) {
        const y0 = 1080 - 104 * fu, n = 24, bw = 66;
        c.fillStyle = DB.panel; c.fillRect(0, y0, W, 104);
        const ph = lerp(4.5, 23, seg(t, DB_T.cut - 0.25, DB_T.moshEnd));
        for (let i = 0; i < n; i++) {
          const x = 56 + i * (bw + 10), isI = i === 0 || i === 6, gone = i === 6;
          c.strokeStyle = gone ? DB.red : isI ? DB.amber : 'rgba(233,229,219,0.5)'; c.lineWidth = 2;
          c.fillStyle = i < ph ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.03)';
          c.fillRect(x, y0 + 22, bw, 46); c.strokeRect(x, y0 + 22, bw, 46);
          text(c, isI ? 'I' : 'P', x + bw / 2, y0 + 54, { font: mono, weight: 600, size: 22, color: gone ? DB.red : isI ? DB.amber : DB.ink, align: 'center' });
          if (gone) { c.strokeStyle = DB.red; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 4, y0 + 18); c.lineTo(x + bw + 4, y0 + 72); c.moveTo(x + bw + 4, y0 + 18); c.lineTo(x - 4, y0 + 72); c.stroke(); }
        }
        text(c, 'I-FRAME DELETED — SHOT 2 MOTION APPLIED TO SHOT 1 PIXELS', 56, y0 + 94, { font: mono, size: 17, color: DB.red, ls: 1 });
        const hx = 56 + ph * (bw + 10);
        c.fillStyle = DB.cyan; c.fillRect(hx, y0 + 12, 3, 64);
      }

      // ---- the picture opened as audio ----
      if (t >= DB_T.moshEnd && t < DB_T.sonEnd) {
        const u = E.outQt(seg(t, DB_T.moshEnd, DB_T.moshEnd + 0.3)), y0 = 1080 - 200 * u;
        const row = Math.floor(seg(t, DB_T.moshEnd, DB_T.sonEnd) * (DB_H - 1));
        c.fillStyle = DB.cyan; c.fillRect(0, row * 4, W, 2);
        c.fillStyle = DB.panel; c.fillRect(0, y0, W, 200);
        c.strokeStyle = DB.cyan; c.lineWidth = 2; c.beginPath();
        for (let x = 0; x < DB_W; x++) {
          const i = (row * DB_W + x) * 4, v = (out[i] + out[i + 1] + out[i + 2]) / 765 - 0.5;
          const X = 40 + x * (1840 / DB_W), Y = y0 + 110 - v * 130;
          x ? c.lineTo(X, Y) : c.moveTo(X, Y);
        }
        c.stroke();
        c.fillStyle = 'rgba(98,227,232,0.12)'; c.fillRect(40, y0 + 45, 1840, 130);
        const step = Math.floor(t * 4);
        text(c, `IMPORT RAW · U-LAW · 8 BIT  ›  ECHO  DELAY ${(0.028 + step * 0.0011).toFixed(4)} s  DECAY 0.60  ›  EXPORT RAW`, 40, y0 + 32, { font: mono, size: 19, color: DB.ink, ls: 1 });
        text(c, `ROW ${String(row).padStart(3, '0')}`, 1880, y0 + 32, { font: mono, size: 19, color: DB.cyan, align: 'right' });
      }

      // ---- top bar ----
      c.fillStyle = DB.bar; c.fillRect(0, 0, W, 50);
      text(c, 'IMG_0412.JPG', 28, 34, { font: mono, weight: 600, size: 21, color: DB.ink });
      text(c, t < DB_T.cut ? '480 × 272 · 61,204 bytes · baseline JPEG' : t < DB_T.sonEnd ? 'MOV_0412.AVI · xvid · keyframe every 6' : '480 × 272 · re-saved', 230, 34, { font: mono, size: 19, color: DB.dim });
      const pc = { decoding: DB.ink, 'hex edit': DB.amber, datamosh: DB.red, sonified: DB.cyan, 're-saved': DB.ink }[phase];
      text(c, phase.toUpperCase(), 1892, 34, { font: mono, weight: 600, size: 20, color: pc, align: 'right', ls: 2 });
      if (t < DB_T.loadEnd) {
        const p = seg(t, DB_T.load, DB_T.loadEnd);
        c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(0, 48, W, 2); c.fillStyle = DB.ink; c.fillRect(0, 48, W * p, 2);
      }

      // ---- title captions, crisp, over the broken keyframe ----
      if (t >= DB_T.sub) {
        const u = E.outQt(seg(t, DB_T.sub, DB_T.sub + 0.4)), n = Math.floor(seg(t, DB_T.sub, DB_T.sub + 0.7) * 36);
        c.fillStyle = `rgba(6,7,12,${0.82 * u})`; c.fillRect(56, 600, 1000, 150);
        c.fillStyle = DB.red; c.fillRect(56, 600, 8, 150 * u);
        text(c, 'Corrupting the file, not the picture'.slice(0, n), 92, 662, { font: mono, weight: 600, size: 34, color: DB.ink });
        text(c, 'after Rosa Menkman · Takeshi Murata', 92, 712, { font: mono, size: 22, color: DB.dim, ls: 1 });
        text(c, '… 8F 3A 00 4A 9C FF D9   EOI', 1864, 1052, { font: mono, size: 20, color: DB.dim, align: 'right' });
      }
    },
    score(A) {
      A.bus.gain.value = 0.8;
      // decoding: data chatter while the blocks arrive, a low hum under it
      for (let k = 0; k < 18; k++) A.osc(0.1 + k * 0.06, { type: 'square', f: 400 + hash(k * 3.3) * 1800, dur: 0.045, g: 0.016, crush: true, lp: 3200, pan: (hash(k) - 0.5) * 0.6 });
      A.osc(0.1, { type: 'triangle', f: 55, dur: 3.2, g: 0.06, a: 0.3, hold: true, rel: 0.3 });
      // hex edits: two keystrokes per byte, then the decoder breaking downward
      DB_ED.forEach((e, i) => {
        [-0.3, -0.16].forEach(d => A.noise(e.at + d, { type: 'bandpass', f: 3200, q: 2, dur: 0.015, g: 0.07 }));
        A.osc(e.at, { type: 'square', f: 1760, dur: 0.05, g: 0.02 });
        A.noise(e.at, { type: 'bandpass', f: 500 + i * 400, f2: 5000, q: 2, dur: 0.24, g: 0.11, crush: true });
        A.osc(e.at, { type: 'sawtooth', f: [110, 82, 147][i], f2: [55, 41, 73][i], glide: 0.24, dur: 0.3, g: 0.07, crush: true, lp: 2200 });
      });
      // datamosh: a smeared chord whose pitches bend like the pixels
      A.chord(DB_T.cut, [45, 52, 57, 64], { type: 'sawtooth', dur: 2.9, g: 0.02, lp: 500, lp2: 2600, lpT: 1.4, a: 0.4, hold: true, rel: 0.4, spread: 14 });
      [[0, 76, 69], [0.5, 74, 67], [1.0, 79, 72], [1.5, 76, 64], [2.0, 72, 60], [2.4, 69, 57]].forEach(([d, m1, m2]) => A.osc(DB_T.cut + d, { type: 'sawtooth', f: midi(m1), f2: midi(m2), glide: 0.45, dur: 0.5, g: 0.016, lp: 1800, rev: 0.4 }));
      for (let t = DB_T.cut; t < DB_T.moshEnd - 0.01; t += 0.5) A.kick(t, 0.3, { f: 90, f2: 38 });
      A.whoosh(DB_T.swirl - 0.2, 1.5, { f1: 200, f2: 1800, g: 0.08 });
      // sonified: the picture played as sound, banded noise with its echo, four bands a second
      for (let k = 0; k < 6; k++) {
        const t = DB_T.moshEnd + k * 0.25, f = 300 + hash(k * 7.1) * 2500;
        [0, 0.09, 0.18].forEach((d, j) => A.noise(t + d, { type: 'bandpass', f, q: 7, dur: 0.12, g: 0.09 * Math.pow(0.6, j), crush: true, pan: (j - 1) * 0.4 }));
      }
      A.osc(DB_T.moshEnd, { type: 'square', f: 110, f2: 880, glide: 1.5, dur: 1.5, g: 0.018, crush: true, lp: 3000 });
      // the clean keyframe: one hit, a clear chord, then the drip
      A.impact(DB_T.iframe, 0.55, { rev: 0.4 });
      A.chord(DB_T.iframe, [50, 57, 62, 66, 69], { type: 'sine', dur: 2.3, g: 0.045, a: 0.01, rev: 0.5 });
      for (let k = 0; k < 5; k++) A.osc(DB_T.drip + 0.2 + k * 0.32, { f: midi(86 - k * 2), f2: midi(74 - k * 2), glide: 0.25, dur: 0.3, g: 0.02, rev: 0.5, pan: (hash(k * 5) - 0.5) * 0.8 });
      A.bell(DB_T.sub, midi(74), { g: 0.06, dur: 1.6 });
      A.osc(DB_T.sub, { type: 'triangle', f: 36.7, dur: 1.5, g: 0.1, hold: true, rel: 0.5 });
    },
  });

  /* =====================================================================
     OS WINDOW ANIMATION — a glossy desktop. The pointer slides down to the
     dock, which swells under it; a click bounces the Photos icon and its
     window zooms out of the icon. Notes is minimised with the genie: its
     bottom edge pinches toward the dock and the window pours in after it.
     Exposé tiles every window without overlap, a hovered tile lights up and
     is picked. Then the theme turns to glass: the browser is dragged to the
     left edge, a ripple and a translucent preview offer the half screen and
     it snaps; the music player snaps to the right. Flip 3D stacks all the
     windows in perspective and cycles them until the title window comes to
     the front and settles, flat, in the centre
     ===================================================================== */
  const OW = { blue: '#3b82f6', ink: '#1d1d1f', grey: '#6e6e73', glass: 'rgba(255,255,255,0.22)' };
  const OW_F = '"Inter", sans-serif', OW_M = '"JetBrains Mono", monospace';
  const OW_P = 48;
  const OW_WIN = {
    notes: { title: 'Notes', x: 130, y: 110, w: 600, h: 440 },
    term: { title: 'Terminal', x: 1120, y: 120, w: 660, h: 410 },
    music: { title: 'Music', x: 1200, y: 480, w: 580, h: 390 },
    web: { title: 'Browser', x: 420, y: 330, w: 860, h: 560 },
    photos: { title: 'Photos', x: 800, y: 150, w: 760, h: 500 },
    atlas: { title: 'Motion Style Atlas', x: 380, y: 220, w: 1160, h: 640 },
  };
  const OW_T = { zoom: 1.12, genie: 2.25, genieEnd: 2.95, expo: 3.15, pick: 4.42, skin: 5.0, grab: 5.5, edgeL: 5.95, dropL: 6.2, grab2: 6.66, edgeR: 7.0, dropR: 7.18, flip: 7.55, cyc: 8.0, exit: 9.1 };
  const OW_DOCK = ['files', 'web', 'notes', 'term', 'music', 'photos', 'settings', '|', 'mini', 'trash'];
  const OW_TILE = { photos: 0, term: 1, web: 2, music: 3 };
  const OW_SNAPL = { x: 0, y: 0, w: 960, h: 1028 }, OW_SNAPR = { x: 960, y: 0, w: 960, h: 1028 };
  const OW_STACK = ['web', 'music', 'term', 'photos', 'atlas'];

  /* ---- window contents (drawn once, at their native size) ---- */
  const OW_CONTENT = {
    notes(g, w, h) {
      g.fillStyle = '#fbfaf5'; g.fillRect(0, 0, w, h);
      const sw = Math.min(210, w * 0.34);
      g.fillStyle = '#f1eee4'; g.fillRect(0, 0, sw, h);
      ['Genie timing', 'Reel ideas', 'Groceries', 'Call Sam', 'Exposé grid'].forEach((s, i) => {
        if (i === 0) { g.fillStyle = '#f6d365'; rrect(g, 8, 10, sw - 16, 54, 8); g.fill(); }
        text(g, s, 22, 34 + i * 62, { font: OW_F, weight: 600, size: 15, color: OW.ink });
        text(g, ['9:41', 'Yesterday', 'Monday', 'Monday', 'Sunday'][i], 22, 54 + i * 62, { font: OW_F, size: 13, color: OW.grey });
      });
      text(g, 'Genie timing', sw + 28, 52, { font: OW_F, weight: 700, size: 26, color: OW.ink });
      ['Minimise in about half a second.', 'The bottom edge pinches toward the dock,', 'then the window pours in after it.', '', 'Exposé: tile every window, no overlaps.', 'Snap: drag to the edge, show the preview.', 'Flip 3D: stack them in depth and cycle.']
        .forEach((s, i) => text(g, s, sw + 28, 96 + i * 30, { font: OW_F, size: 16, color: '#3a3a3c' }));
    },
    term(g, w, h) {
      g.fillStyle = '#1e1f25'; g.fillRect(0, 0, w, h);
      [['~ $ ', 'ls motion/'], ['', 'genie.c  expose.c  snap.c  flip3d.c  dock.c'], ['~ $ ', 'make windows'], ['', 'cc -O2 -o genie genie.c'], ['', 'cc -O2 -o expose expose.c'], ['', '[##############------]  70%'], ['~ $ ', './genie --duration 0.5 --curve funnel'], ['', 'minimising window 3 ... done in 0.48 s'], ['~ $ ', '']]
        .forEach(([p, s], i) => {
          const y = 34 + i * 30;
          text(g, p, 18, y, { font: OW_M, size: 16, color: '#7ee787' });
          text(g, s, 18 + (p ? 44 : 0), y, { font: OW_M, size: 16, color: '#d7dae0' });
        });
      g.fillStyle = '#d7dae0'; g.fillRect(62, 34 + 8 * 30 - 15, 10, 19);
    },
    web(g, w, h) {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
      g.fillStyle = '#f2f3f5'; g.fillRect(0, 0, w, 46);
      ['#c7c9ce', '#c7c9ce'].forEach((c, i) => { g.fillStyle = c; ell(g, 24 + i * 24, 23, 7, 7); g.fill(); });
      g.fillStyle = '#e4e6ea'; rrect(g, 80, 9, w - 160, 28, 14); g.fill();
      text(g, 'atlas.example/windows', w / 2, 28, { font: OW_F, size: 14, color: '#55575c', align: 'center' });
      const hh = Math.min(h * 0.4, 330), gr = g.createLinearGradient(24, 70, w - 24, 70 + hh);
      gr.addColorStop(0, '#3a7bfd'); gr.addColorStop(1, '#9b4dff');
      g.fillStyle = gr; rrect(g, 24, 66, w - 48, hh, 14); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.14)'; ell(g, w - 160, 66 + hh * 0.5, hh * 0.6, hh * 0.6); g.fill();
      const fs = Math.min(48, w * 0.058);
      text(g, 'Windows that move', 56, 66 + hh * 0.48, { font: OW_F, weight: 800, size: fs, color: '#fff' });
      text(g, 'A field guide to desktop motion', 58, 66 + hh * 0.48 + fs * 0.9, { font: OW_F, size: fs * 0.42, color: 'rgba(255,255,255,0.85)' });
      const cy = 66 + hh + 24, cw = (w - 48 - 40) / 3, ch = Math.min(h - cy - 20, 220);
      ['#ff9f43', '#2ed573', '#1e90ff'].forEach((c, i) => {
        const x = 24 + i * (cw + 20);
        g.fillStyle = '#f4f5f7'; rrect(g, x, cy, cw, ch, 10); g.fill();
        g.fillStyle = c; rrect(g, x, cy, cw, ch * 0.42, 10); g.fill(); g.fillRect(x, cy + ch * 0.3, cw, ch * 0.12);
        g.fillStyle = '#d5d8de'; for (let k = 0; k < 3; k++) g.fillRect(x + 16, cy + ch * 0.55 + k * 18, (cw - 32) * (1 - k * 0.22), 8);
      });
      if (h > 700) {
        g.fillStyle = '#eef0f3';
        for (let k = 0; k < 8; k++) g.fillRect(24, cy + ch + 36 + k * 30, (w - 48) * (0.5 + 0.5 * hash(k * 3.1)), 12);
      }
    },
    music(g, w, h) {
      g.fillStyle = '#f7f5fa'; g.fillRect(0, 0, w, h);
      const s = Math.min(h - 56, w * 0.46);
      const gr = g.createLinearGradient(28, 28, 28 + s, 28 + s); gr.addColorStop(0, '#ff3d7f'); gr.addColorStop(1, '#ffb347');
      g.fillStyle = gr; rrect(g, 28, 28, s, s, 12); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 3;
      for (let k = 1; k < 6; k++) { g.beginPath(); g.arc(28 + s * 0.5, 28 + s * 0.5, k * s * 0.08, 0, TAU); g.stroke(); }
      const x = 28 + s + 32, rw = w - x - 28;
      text(g, 'Velvet Desktop', x, 72, { font: OW_F, weight: 700, size: 26, color: OW.ink });
      text(g, 'The Compositors', x, 102, { font: OW_F, size: 17, color: OW.grey });
      g.fillStyle = '#dcd8e2'; rrect(g, x, 140, rw, 6, 3); g.fill();
      g.fillStyle = '#ff3d7f'; rrect(g, x, 140, rw * 0.37, 6, 3); g.fill();
      text(g, '1:24', x, 170, { font: OW_F, size: 13, color: OW.grey });
      text(g, '3:51', x + rw, 170, { font: OW_F, size: 13, color: OW.grey, align: 'right' });
      const cx = x + rw / 2, cy = 222;
      g.fillStyle = OW.ink;
      const tri = (x0, y0, d, sz) => { g.beginPath(); g.moveTo(x0, y0 - sz); g.lineTo(x0 + d * sz * 1.2, y0); g.lineTo(x0, y0 + sz); g.closePath(); g.fill(); };
      tri(cx - 60, cy, -1, 11); tri(cx - 74, cy, -1, 11); tri(cx + 60, cy, 1, 11); tri(cx + 74, cy, 1, 11);
      g.fillRect(cx - 9, cy - 15, 6, 30); g.fillRect(cx + 4, cy - 15, 6, 30);
      for (let k = 0; k < 18; k++) { const bh = 10 + hash(k * 1.9) * 60; g.fillStyle = k % 3 ? '#c9c2d6' : '#ff8fb1'; rrect(g, x + k * (rw / 18), h - 30 - bh, rw / 18 - 5, bh, 2); g.fill(); }
    },
    photos(g, w, h) {
      g.fillStyle = '#1c1c1e'; g.fillRect(0, 0, w, h);
      const ph = h - 112, sk = g.createLinearGradient(0, 16, 0, 16 + ph);
      sk.addColorStop(0, '#6aa9e6'); sk.addColorStop(0.55, '#f4d6ae'); sk.addColorStop(1, '#2e5a74');
      g.save(); rrect(g, 16, 16, w - 32, ph, 8); g.clip();
      g.fillStyle = sk; g.fillRect(16, 16, w - 32, ph);
      g.fillStyle = '#fff3c9'; ell(g, w * 0.66, 16 + ph * 0.42, 26, 26); g.fill();
      const ridge = (y0, amp, col, sd) => { g.fillStyle = col; g.beginPath(); g.moveTo(16, 16 + ph); for (let x = 16; x <= w - 16; x += 8) g.lineTo(x, y0 - Math.abs(vnoise(x / 90, sd)) * amp); g.lineTo(w - 16, 16 + ph); g.closePath(); g.fill(); };
      ridge(16 + ph * 0.62, 130, '#6f7fa6', 2); ridge(16 + ph * 0.7, 80, '#3f5378', 6);
      g.fillStyle = '#2b4a63'; g.fillRect(16, 16 + ph * 0.72, w - 32, ph * 0.3);
      g.fillStyle = 'rgba(255,240,200,0.5)'; for (let k = 0; k < 10; k++) g.fillRect(w * 0.66 - 30 + hash(k) * 30, 16 + ph * 0.74 + k * 9, 40 - k * 3, 3);
      g.restore();
      for (let k = 0; k < 7; k++) {
        const tw = (w - 32 - 6 * 10) / 7, x = 16 + k * (tw + 10), y = h - 84;
        const hue = 200 + k * 23;
        const tg = g.createLinearGradient(0, y, 0, y + 68); tg.addColorStop(0, `hsl(${hue},55%,70%)`); tg.addColorStop(1, `hsl(${hue + 40},45%,35%)`);
        g.fillStyle = tg; rrect(g, x, y, tw, 68, 6); g.fill();
        if (k === 2) { g.strokeStyle = OW.blue; g.lineWidth = 3; rrect(g, x - 2, y - 2, tw + 4, 72, 7); g.stroke(); }
      }
    },
    atlas(g, w, h) {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#0d1a33'); gr.addColorStop(1, '#1b3f73');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(120,170,255,0.08)'; ell(g, w * 0.85, h * 0.1, 360, 260); g.fill();
      text(g, 'THE MOTION STYLE ATLAS  ·  FAMILY G', 56, 72, { font: OW_F, weight: 600, size: 18, color: '#8fb8ff', ls: 4 });
      text(g, 'OS Window Animation', 52, 176, { font: OW_F, weight: 800, size: 86, color: '#ffffff', ls: -1 });
      text(g, 'Genie · Exposé · Snap · Flip 3D', 56, 232, { font: OW_F, size: 30, color: '#cfe0ff' });
      // four pictograms of the moves
      const tiles = ['Genie', 'Exposé', 'Snap', 'Flip 3D'], tw = (w - 112 - 60) / 4;
      tiles.forEach((s, i) => {
        const x = 56 + i * (tw + 20), y = 290, th = h - y - 56;
        g.fillStyle = 'rgba(255,255,255,0.06)'; rrect(g, x, y, tw, th, 14); g.fill();
        g.strokeStyle = 'rgba(160,200,255,0.9)'; g.fillStyle = 'rgba(160,200,255,0.18)'; g.lineWidth = 3;
        const cx = x + tw / 2, cy = y + th * 0.42;
        if (i === 0) {
          g.beginPath(); g.moveTo(cx - 70, cy - 70); g.lineTo(cx + 70, cy - 70); g.lineTo(cx + 66, cy - 30);
          g.bezierCurveTo(cx + 40, cy + 10, cx + 12, cy + 30, cx + 10, cy + 80); g.lineTo(cx - 10, cy + 80);
          g.bezierCurveTo(cx - 12, cy + 30, cx - 40, cy + 10, cx - 66, cy - 30); g.closePath(); g.fill(); g.stroke();
          g.fillRect(cx - 24, cy + 86, 48, 10);
        } else if (i === 1) {
          [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { g.beginPath(); g.rect(cx + a * 52 - 44, cy + b * 40 - 30, 88, 60); g.fill(); g.stroke(); });
        } else if (i === 2) {
          g.beginPath(); g.rect(cx - 92, cy - 70, 88, 140); g.fill(); g.stroke(); g.beginPath(); g.rect(cx + 4, cy - 70, 88, 140); g.stroke();
          g.setLineDash([8, 8]); g.beginPath(); g.moveTo(cx, cy - 86); g.lineTo(cx, cy + 86); g.stroke(); g.setLineDash([]);
        } else {
          for (let k = 3; k >= 0; k--) { const ox = k * 26, oy = -k * 14; g.beginPath(); g.moveTo(cx - 80 + ox, cy - 50 + oy); g.lineTo(cx + 10 + ox, cy - 38 + oy); g.lineTo(cx + 10 + ox, cy + 38 + oy); g.lineTo(cx - 80 + ox, cy + 50 + oy); g.closePath(); g.fillStyle = `rgba(160,200,255,${0.1 + (3 - k) * 0.08})`; g.fill(); g.stroke(); }
        }
        text(g, s, cx, y + th - 26, { font: OW_F, weight: 600, size: 22, color: '#dfe9ff', align: 'center' });
      });
    },
  };

  // A whole window (chrome + content + soft shadow) rendered once, padded by OW_P on every side.
  function owWindow(id, skin, w, h) {
    const P = OW_P, cv = offscreen(w + P * 2, h + P * 2), g = cv.getContext('2d');
    g.translate(P, P);
    const title = OW_WIN[id].title;
    g.save(); g.shadowColor = 'rgba(0,0,0,0.42)'; g.shadowBlur = 44; g.shadowOffsetY = 16;
    rrect(g, 0, 0, w, h, skin === 'aqua' ? 12 : 8); g.fillStyle = skin === 'aqua' ? '#fff' : 'rgba(110,160,215,0.75)'; g.fill(); g.restore();
    if (skin === 'aqua') {
      g.save(); rrect(g, 0, 0, w, h, 12); g.clip();
      g.save(); g.translate(0, 38); OW_CONTENT[id](g, w, h - 38); g.restore();
      const tb = g.createLinearGradient(0, 0, 0, 38); tb.addColorStop(0, '#f2f1f2'); tb.addColorStop(1, '#dcdbdc');
      g.fillStyle = tb; g.fillRect(0, 0, w, 38); g.fillStyle = '#b9b8b9'; g.fillRect(0, 37, w, 1);
      [['#ff5f57', '#e2463f'], ['#febc2e', '#dea123'], ['#28c840', '#1aab29']].forEach(([f, s], i) => { g.fillStyle = f; ell(g, 20 + i * 22, 19, 7, 7); g.fill(); g.strokeStyle = s; g.lineWidth = 1; g.stroke(); });
      text(g, title, w / 2, 25, { font: OW_F, weight: 600, size: 15, color: '#4a4a4a', align: 'center' });
      g.restore();
      rrect(g, 0.5, 0.5, w - 1, h - 1, 12); g.strokeStyle = 'rgba(0,0,0,0.22)'; g.lineWidth = 1; g.stroke();
    } else {
      // glass frame: translucent tint, a diagonal sheen, dark outer and light inner hairlines
      g.save(); rrect(g, 0, 0, w, h, 8); g.clip();
      g.clearRect(0, 0, w, h);
      const fr = g.createLinearGradient(0, 0, 0, h); fr.addColorStop(0, 'rgba(160,200,240,0.78)'); fr.addColorStop(0.08, 'rgba(110,160,215,0.68)'); fr.addColorStop(1, 'rgba(80,130,190,0.7)');
      g.fillStyle = fr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,0.13)';
      for (let k = 0; k < 4; k++) { const x0 = w * (0.1 + k * 0.27); g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + 70, 0); g.lineTo(x0 - 120, h); g.lineTo(x0 - 190, h); g.closePath(); g.fill(); }
      g.save(); g.beginPath(); g.rect(8, 32, w - 16, h - 40); g.clip(); g.translate(8, 32); OW_CONTENT[id](g, w - 16, h - 40); g.restore();
      g.strokeStyle = 'rgba(30,50,80,0.6)'; g.lineWidth = 1; g.strokeRect(7.5, 31.5, w - 15, h - 39);
      // caption buttons
      const bx = w - 118;
      [['rgba(255,255,255,0.35)', 28], ['rgba(255,255,255,0.35)', 28], ['#d9473a', 50]].reduce((x, [col, bw], i) => {
        const gg = g.createLinearGradient(0, 0, 0, 21);
        gg.addColorStop(0, i === 2 ? '#f08a7e' : 'rgba(255,255,255,0.65)'); gg.addColorStop(0.5, col); gg.addColorStop(1, i === 2 ? '#b8281c' : 'rgba(140,180,220,0.5)');
        g.fillStyle = gg; g.fillRect(x, 0, bw, 21); g.strokeStyle = 'rgba(20,40,70,0.6)'; g.strokeRect(x + 0.5, 0.5, bw - 1, 20);
        g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath();
        if (i === 0) { g.moveTo(x + 9, 14); g.lineTo(x + 19, 14); }
        else if (i === 1) g.rect(x + 9, 6, 10, 9);
        else { g.moveTo(x + 20, 5); g.lineTo(x + 30, 15); g.moveTo(x + 30, 5); g.lineTo(x + 20, 15); }
        g.stroke(); g.lineWidth = 1;
        return x + bw;
      }, bx);
      g.restore();
      rrect(g, 0.5, 0.5, w - 1, h - 1, 8); g.strokeStyle = 'rgba(10,25,45,0.7)'; g.stroke();
      rrect(g, 1.5, 1.5, w - 3, h - 3, 7); g.strokeStyle = 'rgba(255,255,255,0.45)'; g.stroke();
      g.fillStyle = { notes: '#f7c948', term: '#2b2d33', music: '#ff3d7f', web: '#3a7bfd', photos: '#2ed573', atlas: '#8fb8ff' }[id];
      g.fillRect(12, 8, 16, 16);
      text(g, title, 38, 22, { font: OW_F, weight: 500, size: 15, color: '#0b1a2a' });
    }
    return cv;
  }

  // Dock icons, drawn big enough to stay crisp at full magnification.
  function owIcon(id, S = 152) {
    const cv = offscreen(S, S), g = cv.getContext('2d'), R = S * 0.225;
    const sq = (c0, c1) => { const gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, c0); gr.addColorStop(1, c1); rrect(g, 4, 4, S - 8, S - 8, R); g.fillStyle = gr; g.fill(); };
    g.save();
    if (id === 'files') {
      sq('#eaf4ff', '#bcd8f5');
      g.fillStyle = '#3d9bf0'; rrect(g, 30, 40, 44, 22, 6); g.fill();
      const fg = g.createLinearGradient(0, 52, 0, 120); fg.addColorStop(0, '#6cc0ff'); fg.addColorStop(1, '#2a86e8');
      g.fillStyle = fg; rrect(g, 26, 52, 100, 68, 8); g.fill();
    } else if (id === 'web') {
      sq('#ffffff', '#e3e9f2');
      const gg = g.createLinearGradient(0, 30, 0, 122); gg.addColorStop(0, '#5bb8ff'); gg.addColorStop(1, '#1c5ed4');
      g.fillStyle = gg; ell(g, 76, 76, 46, 46); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 3;
      ell(g, 76, 76, 20, 46); g.stroke(); g.beginPath(); g.moveTo(30, 76); g.lineTo(122, 76); g.moveTo(76, 30); g.lineTo(76, 122); g.stroke();
      g.beginPath(); g.moveTo(38, 54); g.quadraticCurveTo(76, 64, 114, 54); g.moveTo(38, 98); g.quadraticCurveTo(76, 88, 114, 98); g.stroke();
    } else if (id === 'notes') {
      sq('#fffdf5', '#f1ecd8');
      g.save(); rrect(g, 4, 4, S - 8, S - 8, R); g.clip(); g.fillStyle = '#f7c948'; g.fillRect(0, 0, S, 40); g.restore();
      g.fillStyle = '#cfcab9'; for (let k = 0; k < 4; k++) g.fillRect(26, 62 + k * 18, 100 - (k === 3 ? 40 : 0), 4);
    } else if (id === 'term') {
      sq('#3a3d45', '#121317');
      text(g, '>_', 28, 100, { font: OW_M, weight: 700, size: 54, color: '#e8e8e8' });
    } else if (id === 'music') {
      sq('#ff6f8f', '#e0245e');
      g.fillStyle = '#fff'; ell(g, 58, 104, 15, 12, -0.3); g.fill(); ell(g, 102, 94, 15, 12, -0.3); g.fill();
      g.fillRect(68, 44, 7, 62); g.fillRect(112, 34, 7, 62);
      g.beginPath(); g.moveTo(68, 44); g.lineTo(119, 34); g.lineTo(119, 50); g.lineTo(68, 60); g.closePath(); g.fill();
    } else if (id === 'photos') {
      sq('#ffffff', '#eef1f5');
      g.save(); rrect(g, 26, 36, 100, 80, 10); g.clip();
      const pg = g.createLinearGradient(0, 36, 0, 116); pg.addColorStop(0, '#8fd0ff'); pg.addColorStop(1, '#d9f0ff');
      g.fillStyle = pg; g.fillRect(26, 36, 100, 80);
      g.fillStyle = '#ffcc33'; ell(g, 100, 58, 11, 11); g.fill();
      g.fillStyle = '#3a8f5a'; g.beginPath(); g.moveTo(20, 120); g.lineTo(60, 70); g.lineTo(84, 96); g.lineTo(100, 80); g.lineTo(132, 120); g.closePath(); g.fill();
      g.restore();
    } else if (id === 'settings') {
      sq('#d2d5db', '#8d929c');
      g.fillStyle = '#4b4f57';
      g.beginPath();
      for (let k = 0; k < 48; k++) { const q = k % 4, rr = q === 1 || q === 2 ? 46 : 36, a = (k / 48) * TAU; g.lineTo(76 + Math.cos(a) * rr, 76 + Math.sin(a) * rr); }
      g.closePath(); g.fill();
      g.fillStyle = '#c3c7ce'; ell(g, 76, 76, 16, 16); g.fill();
    } else if (id === 'trash') {
      g.fillStyle = 'rgba(235,240,246,0.85)'; g.strokeStyle = 'rgba(90,100,115,0.8)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(36, 40); g.lineTo(116, 40); g.lineTo(106, 138); g.lineTo(46, 138); g.closePath(); g.fill(); g.stroke();
      for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(50 + k * 13, 52); g.lineTo(54 + k * 11, 128); g.stroke(); }
      rrect(g, 28, 28, 96, 14, 6); g.fill(); g.stroke();
    }
    g.restore();
    return cv;
  }

  // Dock layout with fisheye magnification around the pointer.
  function owDockLayout(mx, hov, miniU) {
    const base = 76, gap = 12;
    const ids = OW_DOCK, n = ids.length;
    const w0 = ids.map(id => (id === '|' ? 18 : id === 'mini' ? base * miniU : base));
    const tot0 = w0.reduce((a, b) => a + b, 0) + gap * (n - 1);
    let x = 960 - tot0 / 2;
    const c0 = w0.map(w => { const c = x + w / 2; x += w + gap; return c; });
    const w1 = w0.map((w, i) => (ids[i] === '|' ? w : w * (1 + 0.85 * hov * Math.exp(-(((c0[i] - mx) / 130) ** 2)))));
    const tot1 = w1.reduce((a, b) => a + b, 0) + gap * (n - 1);
    // keep the pointer's spot on the dock fixed while the icons around it grow
    const anchor = clamp((mx - (960 - tot0 / 2)) / tot0);
    x = lerp(960 - tot1 / 2, mx - anchor * tot1, hov);
    const items = ids.map((id, i) => { const it = { id, cx: x + w1[i] / 2, size: w1[i] }; x += w1[i] + gap; return it; });
    return { items, left: items[0].cx - items[0].size / 2, right: items[n - 1].cx + items[n - 1].size / 2 };
  }

  // Genie: the window is cut into horizontal strips; each strip narrows toward the dock target
  // according to how far down the funnel it has travelled.
  function owGenie(c, img, r, tx, ty, tw, p) {
    const N = 160, P = OW_P, sx = r.w / (img.width - 2 * P), sy = r.h / (img.height - 2 * P);
    const bend = E.ioC(seg(p, 0, 0.45)), slide = E.inQ(seg(p, 0.2, 1));
    const top = lerp(r.y, ty, slide), bot = lerp(r.y + r.h, ty + 4, E.ioC(seg(p, 0.05, 0.75)));
    const srcH = img.height - 2 * P;
    for (let j = 0; j < N; j++) {
      const y0 = lerp(top, bot, j / N), y1 = lerp(top, bot, (j + 1) / N), ym = (y0 + y1) / 2;
      const f = bend * E.ioS(clamp((ym - r.y) / Math.max(1, ty - r.y)));
      const L = lerp(r.x, tx - tw / 2, f), R = lerp(r.x + r.w, tx + tw / 2, f);
      if (y1 - y0 < 0.05) continue;
      c.drawImage(img, P, P + (j / N) * srcH, img.width - 2 * P, srcH / N + 0.5, L, y0, R - L, y1 - y0 + 0.6);
    }
  }
  // A window turned about its vertical axis (Flip 3D), drawn as vertical slices: near edge tall, far edge short.
  function owPersp(c, img, cx, cy, w, h, farK, alpha) {
    const N = 40, P = OW_P, iw = img.width - 2 * P, ih = img.height - 2 * P;
    c.globalAlpha = alpha;
    // slices meet on whole pixels so translucent glass never doubles up at the seams
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N, hh = h * lerp(1, farK, u);
      const x0 = Math.round(cx - w / 2 + (i / N) * w), x1 = Math.round(cx - w / 2 + ((i + 1) / N) * w);
      if (x1 > x0) c.drawImage(img, P + (i / N) * iw, P, iw / N, ih, x0, cy - hh / 2, x1 - x0, hh);
    }
    // the glass edge catches the light
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(cx - w / 2, cy - h / 2, 2, h);
    c.globalAlpha = 1;
  }
  // Draw a padded window image so that its window rect lands on r.
  function owRect(c, img, r, a = 1) {
    if (a <= 0) return;
    const P = OW_P, sx = r.w / (img.width - 2 * P), sy = r.h / (img.height - 2 * P);
    c.globalAlpha = a;
    c.drawImage(img, r.x - P * sx, r.y - P * sy, img.width * sx, img.height * sy);
    c.globalAlpha = 1;
  }
  const lerpR = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u), h: lerp(a.h, b.h, u) });
  function owCursor(c, x, y) {
    c.save(); c.translate(x, y); c.scale(1.5, 1.5);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 22); c.lineTo(5.5, 17); c.lineTo(9.5, 26); c.lineTo(13, 24.5); c.lineTo(9, 16); c.lineTo(16, 16); c.closePath();
    c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 4; c.shadowOffsetY = 2;
    c.fillStyle = '#111'; c.fill(); c.shadowColor = 'transparent';
    c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.stroke();
    c.restore();
  }
  function owTiles() {
    const out = {};
    Object.entries(OW_TILE).forEach(([id, k]) => {
      const W0 = OW_WIN[id], cw = 810, ch = 370, x0 = 150 + (k % 2) * cw, y0 = 190 + ((k / 2) | 0) * ch;
      const s = Math.min(cw * 0.82 / W0.w, ch * 0.74 / W0.h), w = W0.w * s, h = W0.h * s;
      out[id] = { x: x0 + (cw - w) / 2, y: y0 + (ch - h) / 2 - 18, w, h };
    });
    return out;
  }

  MG.film({
    id: 'oswindow', dur: 10, poster: 9.7,
    fonts: [['400 16px Inter', 'Aa'], ['500 15px Inter', 'Aa'], ['600 18px Inter', 'THE MOTION STYLE ATLAS'], ['700 26px Inter', 'Genie timing'], ['800 86px Inter', 'OS Window Animation'], ['400 16px "JetBrains Mono"', '~$ ls'], ['700 54px "JetBrains Mono"', '>_']],
    meta: {
      family: 'G', name: 'OS Window Animation', sub: 'Genie, Exposé, Snap & Flip', era: '2001 — 2012',
      origin: 'When GPUs began compositing the desktop, window managers turned every state change into motion: Mac OS X 10.0 (2001) shipped the genie minimise and the magnifying Dock, Exposé tiled every open window in 10.3 Panther (2003) and became Mission Control in 2011, and Windows Vista’s Aero glass (2007) brought Flip 3D, followed by drag-to-edge Aero Snap in Windows 7 (2009). The animations explain where a window went and where it came from, and their curves and timings became the reference vocabulary for UI motion design.',
      works: 'Mac OS X 10.0 Aqua, genie effect and Dock magnification (Apple, 2001) · Exposé in Mac OS X 10.3 Panther (2003) · Windows Vista Aero and Flip 3D (Microsoft, 2007) · Windows 7 Aero Snap (2009) · Compiz wobbly windows and desktop cube (2006)',
      tech: ['Strip-sliced genie warp', 'Fisheye dock magnification', 'Sliced perspective Flip 3D'],
      accent: '#3b82f6',
      motionDNA: 'Every transition is spatial and causal: windows zoom out of the icon that launched them and pour back into the dock that keeps them, tiles fly apart on a shared ease and return to their stacking order, a window dragged to the edge is offered a translucent half-screen and snaps into it, and a perspective stack rotates its cards one at a time.',
      visualDNA: 'A polished desktop of the 2000s: gradient wallpaper, translucent menu bar and glass dock with reflective rounded icons, white title bars with three coloured buttons and soft drop shadows, then a blue glass theme with tinted frames, sheen streaks, a glowing taskbar and a red close button.',
      transitions: 'Icon zoom-open, dock bounce, genie minimise, Exposé tile-out and pick, theme cross-fade, drag-to-edge snap with preview, Flip 3D cycle, settle to the front',
      implementation: ['Quartz Compositor / Desktop Window Manager on the GPU', 'Core Animation, Compiz, KWin effects', 'After Effects UI mock-ups', 'Canvas 2D (sliced warps of pre-rendered windows)'],
      reproducibility: 'Homage — generic UI, no logos',
      loopable: false,
    },
    setup() {
      const W = 1920, H = 1080, r = rng(2001);
      const wall = (cols, blobs, rays) => {
        const cv = offscreen(W, H), g = cv.getContext('2d');
        const gr = g.createLinearGradient(0, 0, W, H); cols.forEach((col, i) => gr.addColorStop(i / (cols.length - 1), col));
        g.fillStyle = gr; g.fillRect(0, 0, W, H);
        soft(g, 70, q => blobs.forEach(([x, y, rx, ry, a, col]) => { q.fillStyle = col; ell(q, x, y, rx, ry, a); q.fill(); }));
        if (rays) soft(g, 6, q => { for (let k = 0; k < 9; k++) { const a = -2.2 + k * 0.16; q.fillStyle = `rgba(255,255,255,${0.04 + r() * 0.05})`; q.beginPath(); q.moveTo(1500, 260); q.lineTo(1500 + Math.cos(a) * 2400, 260 + Math.sin(a) * 2400); q.lineTo(1500 + Math.cos(a + 0.05) * 2400, 260 + Math.sin(a + 0.05) * 2400); q.closePath(); q.fill(); } });
        soft(g, 2, q => {
          if (rays) for (let k = 0; k < 40; k++) { q.fillStyle = `rgba(200,240,255,${0.05 + r() * 0.12})`; ell(q, r() * W, r() * H, 6 + r() * 30, 6 + r() * 30); q.fill(); }
          else { q.strokeStyle = 'rgba(255,255,255,0.18)'; q.lineWidth = 3; for (let k = 0; k < 5; k++) { q.beginPath(); q.moveTo(-50, 700 - k * 40); q.bezierCurveTo(600, 380 - k * 50, 1200, 1000 - k * 30, 1980, 520 - k * 60); q.stroke(); } }
        });
        return cv;
      };
      const st = {
        wallA: wall(['#0a2466', '#2f63d0', '#6a43c9'], [[400, 300, 600, 220, -0.4, 'rgba(90,200,255,0.45)'], [1400, 800, 700, 260, 0.3, 'rgba(255,120,200,0.35)'], [1100, 200, 500, 160, 0.2, 'rgba(160,140,255,0.4)']], false),
        wallB: wall(['#0d5d9a', '#1b93cc', '#0b3866'], [[1500, 260, 520, 400, 0, 'rgba(160,255,240,0.45)'], [300, 900, 700, 300, -0.2, 'rgba(20,60,140,0.6)']], true),
        img: {}, icons: {}, tiles: owTiles(),
      };
      Object.keys(OW_WIN).forEach(id => { const W0 = OW_WIN[id]; st.img[id] = { aqua: id === 'atlas' ? null : owWindow(id, 'aqua', W0.w, W0.h), aero: owWindow(id, 'aero', W0.w, W0.h) }; });
      st.snapWeb = owWindow('web', 'aero', OW_SNAPL.w, OW_SNAPL.h);
      st.snapMusic = owWindow('music', 'aero', OW_SNAPR.w, OW_SNAPR.h);
      ['files', 'web', 'notes', 'term', 'music', 'photos', 'settings', 'trash'].forEach(id => { st.icons[id] = owIcon(id); });
      // pointer choreography (positions depend on the dock and tile layouts, so they are built here)
      const ph = owDockLayout(0, 0, 0).items.find(it => it.id === 'photos').cx, wt = st.tiles.web;
      const wx = wt.x + wt.w / 2, wy = wt.y + wt.h / 2;
      st.cur = [[0, 1350, 640], [0.85, ph, 1028], [1.4, ph, 1028], [1.95, 172, 129], [2.35, 172, 129], [2.95, 900, 640], [3.6, 930, 620], [4.05, wx, wy], [4.5, wx, wy], [5.25, 720, 346], [OW_T.grab, 720, 346], [OW_T.edgeL, 6, 430], [6.25, 6, 430], [6.6, 1490, 496], [OW_T.grab2, 1490, 496], [OW_T.edgeR, 1914, 470], [7.5, 1914, 470]];
      return st;
    },
    draw(c, t, W, H, st) {
      const cx = kf(t, st.cur.map(k => [k[0], k[1]])), cy = kf(t, st.cur.map(k => [k[0], k[2]]));
      const sk = E.ioC(seg(t, OW_T.skin, OW_T.skin + 0.4));
      // ---- wallpaper ----
      c.drawImage(st.wallA, 0, 0);
      if (sk > 0) { c.globalAlpha = sk; c.drawImage(st.wallB, 0, 0); c.globalAlpha = 1; }

      // ---- dock geometry (needed for zoom and genie targets) ----
      const hov = clamp((cy - 900) / 80) * (t < 2 ? 1 : 0);
      const miniU = E.outQt(seg(t, OW_T.genie, OW_T.genie + 0.35));
      const dock = owDockLayout(cx, hov, miniU), dockY = 140 * sk;
      const iconY = it => 1058 - it.size / 2 + dockY;
      const phIt = dock.items.find(it => it.id === 'photos'), miniIt = dock.items.find(it => it.id === 'mini');

      // ---- window states ----
      const win = id => st.img[id][t < OW_T.skin ? 'aqua' : 'aero'];
      const desk = id => ({ x: OW_WIN[id].x, y: OW_WIN[id].y, w: OW_WIN[id].w, h: OW_WIN[id].h });
      const expo = E.ioC(seg(t, OW_T.expo, OW_T.expo + 0.4)) * (1 - E.ioC(seg(t, OW_T.pick, OW_T.pick + 0.4)));
      const draws = [];
      const push = (id, r, a = 1, img = null) => draws.push({ id, r, a, img });
      if (t < OW_T.flip) {
        // web rect through the drag and snap
        let webR = desk('web'), musR = desk('music'), webSnap = 0, musSnap = 0;
        const grabbed = (t0, gx, gy, base) => ({ x: base.x + kf(Math.min(t, t0), st.cur.map(k => [k[0], k[1]])) - gx, y: base.y + kf(Math.min(t, t0), st.cur.map(k => [k[0], k[2]])) - gy, w: base.w, h: base.h });
        if (t >= OW_T.grab) {
          const dr = grabbed(OW_T.dropL, 720, 346, desk('web'));
          webSnap = E.outQt(seg(t, OW_T.dropL, OW_T.dropL + 0.26));
          webR = lerpR(dr, OW_SNAPL, webSnap);
        }
        if (t >= OW_T.grab2) {
          const dr = grabbed(OW_T.dropR, 1490, 496, desk('music'));
          musSnap = E.outQt(seg(t, OW_T.dropR, OW_T.dropR + 0.26));
          musR = lerpR(dr, OW_SNAPR, musSnap);
        }
        const tile = id => lerpR(desk(id), st.tiles[id] || desk(id), expo);
        // stacking order changes: photos opens on top, web is picked in Exposé, music is grabbed last
        let order = ['notes', 'term', 'music', 'web', 'photos'];
        if (t >= OW_T.pick) order = ['term', 'music', 'photos', 'web'];
        if (t >= OW_T.grab2 - 0.05) order = ['term', 'photos', 'web', 'music'];
        order.forEach(id => {
          if (id === 'notes') {
            if (t < OW_T.genie) push('notes', desk('notes'));
            return;
          }
          if (id === 'photos') {
            if (t < OW_T.zoom) return;
            const u = E.outQn(seg(t, OW_T.zoom, OW_T.zoom + 0.5)), s = phIt.size;
            const from = { x: phIt.cx - s / 2, y: iconY(phIt) - s / 2, w: s, h: s * 0.66 };
            push('photos', t < OW_T.expo ? lerpR(from, desk('photos'), u) : tile('photos'), Math.min(1, seg(t, OW_T.zoom, OW_T.zoom + 0.12) + 0.2));
            return;
          }
          if (id === 'web') { if (webSnap > 0) { push('web', webR, 1 - webSnap); push('web', webR, webSnap, st.snapWeb); } else push('web', t < OW_T.grab ? tile('web') : webR); return; }
          if (id === 'music') { if (musSnap > 0) { push('music', musR, 1 - musSnap); push('music', musR, musSnap, st.snapMusic); } else push('music', t < OW_T.grab2 ? tile('music') : musR); return; }
          push(id, tile(id));
        });
        // Exposé dims the desktop behind the tiles
        if (expo > 0) { c.fillStyle = `rgba(5,10,30,${0.38 * expo})`; c.fillRect(0, 0, W, H); }
        // Exposé spaces bar
        if (expo > 0) {
          const y = lerp(-140, 24, expo);
          [0, 1].forEach(k => {
            const x = 960 - 230 + k * 260;
            c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(x + 3, y + 5, 200, 112);
            c.drawImage(k ? st.wallB : st.wallA, x, y, 200, 112);
            c.strokeStyle = k ? 'rgba(255,255,255,0.3)' : '#fff'; c.lineWidth = k ? 1 : 3; c.strokeRect(x, y, 200, 112);
            text(c, `Desktop ${k + 1}`, x + 100, y + 140, { font: OW_F, weight: 500, size: 16, color: '#fff', align: 'center' });
          });
        }
        // Aero Snap: a glass preview of the half screen, under the window being dragged
        const preview = (te, td, S, px, py) => {
          const pv = E.outQt(seg(t, te, te + 0.2)) * (1 - seg(t, td, td + 0.18));
          if (pv <= 0) return;
          const r = lerpR({ x: px - 10, y: py - 10, w: 20, h: 20 }, { x: S.x + 8, y: S.y + 8, w: S.w - 16, h: S.h - 16 }, pv);
          c.fillStyle = 'rgba(205,228,255,0.26)'; rrect(c, r.x, r.y, r.w, r.h, 8); c.fill();
          c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2; c.stroke();
          c.strokeStyle = 'rgba(120,170,230,0.6)'; c.lineWidth = 6; rrect(c, r.x + 5, r.y + 5, r.w - 10, r.h - 10, 6); c.stroke();
        };
        let preL = false, preR = false;
        draws.forEach(d => {
          if (d.id === 'web' && !preL) { preview(OW_T.edgeL, OW_T.dropL, OW_SNAPL, 6, 430); preL = true; }
          if (d.id === 'music' && !preR) { preview(OW_T.edgeR, OW_T.dropR, OW_SNAPR, 1914, 470); preR = true; }
          const img = d.img || (sk > 0 && sk < 1 ? null : win(d.id));
          if (img) owRect(c, img, d.r, d.a);
          else { owRect(c, st.img[d.id].aqua, d.r, d.a * Math.min(1, 2 - 2 * sk)); owRect(c, st.img[d.id].aero, d.r, d.a * Math.min(1, 2 * sk)); }
        });
        // the genie is drawn above everything while it pours into the dock
        if (t >= OW_T.genie && t < OW_T.genieEnd) owGenie(c, st.img.notes.aqua, desk('notes'), miniIt.cx, iconY(miniIt), Math.max(20, miniIt.size), seg(t, OW_T.genie, OW_T.genieEnd));
        // tile labels and the hover highlight
        if (expo > 0) {
          Object.keys(OW_TILE).forEach(id => {
            const r = st.tiles[id], hv = id === 'web' ? seg(t, 4.0, 4.1) * (1 - seg(t, OW_T.pick, OW_T.pick + 0.15)) : 0;
            if (hv > 0) { c.strokeStyle = `rgba(59,130,246,${hv})`; c.lineWidth = 6; rrect(c, r.x - 8, r.y - 8, r.w + 16, r.h + 16, 16); c.stroke(); }
            c.globalAlpha = expo;
            c.font = `600 17px ${OW_F}`; const tw = c.measureText(OW_WIN[id].title).width + 32;
            c.fillStyle = 'rgba(30,30,35,0.7)'; rrect(c, r.x + r.w / 2 - tw / 2, r.y + r.h + 16, tw, 32, 16); c.fill();
            text(c, OW_WIN[id].title, r.x + r.w / 2, r.y + r.h + 38, { font: OW_F, weight: 600, size: 17, color: '#fff', align: 'center' });
            c.globalAlpha = 1;
          });
        }
        // Aero Snap: a ripple where the pointer hits the edge
        [[OW_T.edgeL, 6, 430], [OW_T.edgeR, 1914, 470]].forEach(([te, px, py]) => {
          const ru = seg(t, te, te + 0.4);
          if (ru > 0 && ru < 1) { c.strokeStyle = `rgba(255,255,255,${0.8 * (1 - ru)})`; c.lineWidth = 3; ell(c, px, py, 12 + 70 * E.outQ(ru), 12 + 70 * E.outQ(ru)); c.stroke(); }
        });
      } else {
        // ---- Flip 3D ----
        const fe = E.ioC(seg(t, OW_T.flip, OW_T.flip + 0.4)), ex = E.ioC(seg(t, OW_T.exit, OW_T.exit + 0.45));
        c.fillStyle = `rgba(4,12,26,${0.55 * fe * (1 - ex) + 0.18 * ex})`; c.fillRect(0, 0, W, H);
        const flat = { web: OW_SNAPL, music: OW_SNAPR, term: desk('term'), photos: desk('photos'), atlas: { x: 960 - 200, y: 540 - 110, w: 400, h: 220 } };
        const imgOf = id => (id === 'web' ? st.snapWeb : id === 'music' ? st.snapMusic : st.img[id].aero);
        let k = 0; while (k < 4 && t >= OW_T.cyc + k * 0.27 + 0.24) k++;
        const p = k < 4 ? E.ioC(seg(t, OW_T.cyc + k * 0.27, OW_T.cyc + k * 0.27 + 0.24)) : 0;
        const order = OW_STACK.map((_, i) => OW_STACK[(i + k) % 5]);
        const pose = d => { const hh = 560 * (1 - 0.06 * d); return { cx: 700 + d * 190, cy: 600 - d * 60, h: hh }; };
        const list = order.map((id, i) => {
          let d = i - p, dx = 0, dy = 0, a = 1;
          if (i === 0) { d = 4 * p; dx = -Math.sin(PI * p) * 300; dy = Math.sin(PI * p) * 160; a = 1 - 0.45 * Math.sin(PI * p); }
          return { id, d, dx, dy, a };
        }).sort((A2, B2) => B2.d - A2.d);
        // windows not at the front settle back to the desktop when Flip 3D ends
        const back = [], front = [];
        list.forEach(it => (it.id === 'atlas' && ex > 0 ? front : back).push(it));
        [...back, ...front].forEach(it => {
          const img = imgOf(it.id), aspect = (img.width - 2 * OW_P) / (img.height - 2 * OW_P), P0 = pose(it.d);
          const sh = P0.h, sw = sh * aspect * 0.66, F = flat[it.id];
          let u = fe, Fr = F, farK = 0.8, alpha = it.a * (it.id === 'atlas' ? Math.min(1, fe * 1.5) : 1);
          if (ex > 0) { u = 1 - ex; if (it.id === 'atlas') Fr = desk('atlas'); else alpha *= 1; }
          const fcx = Fr.x + Fr.w / 2, fcy = Fr.y + Fr.h / 2;
          const X = lerp(fcx, P0.cx + it.dx, u), Y = lerp(fcy, P0.cy + it.dy, u), Wd = lerp(Fr.w, sw, u), Hd = lerp(Fr.h, sh, u), K = lerp(1, farK, u);
          if (u > 0.002) {
            owPersp(c, img, X, Y, Wd, Hd, K, alpha);
          } else owRect(c, img, Fr, alpha);
        });
      }

      // ---- menu bar (Aqua) ----
      if (sk < 1) {
        const y = -40 * sk;
        c.fillStyle = 'rgba(245,245,250,0.55)'; c.fillRect(0, y, W, 32);
        c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(0, y + 32, W, 1);
        c.fillStyle = '#1d1d1f';
        for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ell(c, 30 + Math.cos(a) * 6, y + 16 + Math.sin(a) * 6, 4, 4); c.fill(); }
        let x = 56;
        ['Desk', 'File', 'Edit', 'View', 'Window', 'Help'].forEach((s, i) => { text(c, s, x, y + 22, { font: OW_F, weight: i ? 500 : 700, size: 16, color: '#1d1d1f' }); c.font = `${i ? 500 : 700} 16px ${OW_F}`; x += c.measureText(s).width + 26; });
        text(c, 'Tue 9:41', 1896, y + 22, { font: OW_F, weight: 500, size: 16, color: '#1d1d1f', align: 'right' });
        c.strokeStyle = '#1d1d1f'; c.lineWidth = 1.6; rrect(c, 1772, y + 10, 26, 12, 3); c.stroke(); c.fillStyle = '#1d1d1f'; c.fillRect(1775, y + 13, 16, 6);
        for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(1745, y + 23, 4 + k * 5, -2.4, -0.74); c.stroke(); }
      }
      // ---- dock ----
      if (sk < 1) {
        c.fillStyle = 'rgba(255,255,255,0.24)'; rrect(c, dock.left - 14, 966 + dockY, dock.right - dock.left + 28, 104, 26); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 1.5; c.stroke();
        const open = { web: 1, notes: 1, term: 1, music: 1, photos: t >= OW_T.zoom ? 1 : 0 };
        dock.items.forEach(it => {
          if (it.id === '|') { c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(it.cx - 1, 984 + dockY, 2, 76); return; }
          if (it.size < 2) return;
          let y = iconY(it);
          if (it.id === 'photos') { const b = seg(t, 0.98, 1.62); if (b > 0 && b < 1) y -= Math.abs(Math.sin(b * PI * 2)) * 46 * (1 - b * 0.5); }
          if (it.id === 'mini') {
            const img = st.img.notes.aqua, s = it.size / (img.width - 2 * OW_P) * 0.92;
            c.drawImage(img, it.cx - img.width * s / 2, y - img.height * s / 2 + 6, img.width * s, img.height * s);
          } else c.drawImage(st.icons[it.id], it.cx - it.size / 2, y - it.size / 2, it.size, it.size);
          if (open[it.id]) { c.fillStyle = 'rgba(255,255,255,0.85)'; ell(c, it.cx, 1066 + dockY, 3, 3); c.fill(); }
        });
      }
      // ---- glass taskbar ----
      if (sk > 0) {
        const y = 1080 - 52 * sk;
        const tb = c.createLinearGradient(0, y, 0, 1080); tb.addColorStop(0, 'rgba(40,70,100,0.82)'); tb.addColorStop(1, 'rgba(10,25,45,0.9)');
        c.fillStyle = tb; c.fillRect(0, y, W, 52); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(0, y, W, 1);
        const og = c.createRadialGradient(44, y + 22, 2, 44, y + 26, 24); og.addColorStop(0, '#bff3ff'); og.addColorStop(0.5, '#2b9be0'); og.addColorStop(1, '#0b4a80');
        c.fillStyle = og; ell(c, 44, y + 26, 22, 22); c.fill(); c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 1.5; c.stroke();
        ['web', 'term', 'music', 'photos', 'notes'].forEach((id, i) => {
          const x = 92 + i * 76;
          c.fillStyle = i < 4 ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.05)'; rrect(c, x, y + 4, 68, 44, 4); c.fill();
          c.drawImage(st.icons[id], x + 16, y + 8, 36, 36);
        });
        text(c, '9:41 AM', 1880, y + 32, { font: OW_F, weight: 500, size: 15, color: '#eaf4ff', align: 'right' });
      }
      // ---- pointer ----
      if (t < OW_T.flip - 0.05) owCursor(c, cx, cy);
    },
    score(A) {
      A.bus.gain.value = 0.8;
      // a soft lounge bed: electric-piano chords every bar, brushed hats
      const ep = (t, ns, g = 0.035, dur = 1.9) => ns.forEach((m, i) => { A.osc(t + i * 0.012, { type: 'sine', f: midi(m), dur, g, a: 0.008, rev: 0.4, pan: (i - 1.5) * 0.25 }); A.osc(t + i * 0.012, { type: 'triangle', f: midi(m) * 2, dur: dur * 0.4, g: g * 0.25 }); });
      [[0, [50, 57, 61, 64]], [2, [47, 54, 57, 62]], [4, [43, 50, 54, 59]], [6, [45, 52, 55, 61]], [8, [50, 57, 62, 66]]].forEach(([t, ns]) => { ep(t, ns); A.pluck(t, midi(ns[0] - 12), { dur: 1.6, g: 0.3, bright: 0.3, lp: 700 }); });
      for (let t = 0.5; t < 9; t += 0.5) A.hat(t, 0.025, false, { pan: 0.3 });
      for (let t = 1; t < 9; t += 1) A.kick(t, 0.22, { f: 100, f2: 45 });
      const click = (t, g = 0.05) => { A.noise(t, { type: 'bandpass', f: 4200, q: 3, dur: 0.012, g }); A.osc(t, { f: 2400, dur: 0.02, g: g * 0.3 }); };
      // dock: the bounce and the zoom-open
      click(0.98);
      [0.98, 1.3].forEach((t, i) => A.osc(t, { f: 520, f2: 780, glide: 0.12, dur: 0.16, g: 0.03 / (i + 1) }));
      A.whoosh(OW_T.zoom, 0.42, { f1: 900, f2: 5000, g: 0.07, q: 1 });
      // genie: a descending suck into the dock
      click(2.33);
      A.noise(OW_T.genie, { type: 'bandpass', f: 3500, f2: 300, sweep: 0.7, q: 2, dur: 0.7, g: 0.09, swell: 0.4 });
      A.osc(OW_T.genie, { f: 900, f2: 180, glide: 0.7, dur: 0.72, g: 0.03 });
      A.osc(OW_T.genieEnd, { type: 'triangle', f: 196, dur: 0.18, g: 0.05 });
      // Exposé: everything flies apart, a chime when a window is picked, and back
      A.whoosh(OW_T.expo, 0.45, { f1: 300, f2: 3800, g: 0.09 });
      A.bell(4.02, midi(81), { g: 0.035, dur: 0.6 });
      click(4.45); A.whoosh(OW_T.pick, 0.45, { f1: 3800, f2: 400, g: 0.07 });
      // theme change: a glassy shimmer
      [76, 79, 83, 88].forEach((m, i) => A.bell(OW_T.skin + i * 0.06, midi(m), { g: 0.03, dur: 1.2, pan: (i - 1.5) * 0.4 }));
      // snaps: grab, edge ripple, the clunk into place
      [[OW_T.grab, OW_T.edgeL, OW_T.dropL, -0.7], [OW_T.grab2, OW_T.edgeR, OW_T.dropR, 0.7]].forEach(([g0, e, d, pan]) => {
        click(g0);
        A.noise(g0 + 0.05, { type: 'bandpass', f: 600, f2: 2400, q: 1.5, dur: e - g0, g: 0.03, swell: 0.8, pan });
        A.osc(e, { f: 1200, f2: 1800, glide: 0.1, dur: 0.25, g: 0.025, rev: 0.5, pan });
        A.kick(d, 0.3, { f: 160, f2: 80, glide: 0.05, dur: 0.2 }); A.noise(d, { type: 'bandpass', f: 1500, q: 2, dur: 0.06, g: 0.06, pan });
      });
      // Flip 3D: the stack spins up, one card per tick
      A.whoosh(OW_T.flip, 0.45, { f1: 200, f2: 2200, g: 0.08 });
      for (let k = 0; k < 4; k++) { const t = OW_T.cyc + k * 0.27; A.whoosh(t, 0.24, { f1: 1500, f2: 400, g: 0.05, pan: -0.4 }); A.osc(t, { type: 'triangle', f: midi(69 + k * 2), dur: 0.14, g: 0.03 }); }
      // the title window settles: a resolved chord
      A.whoosh(OW_T.exit, 0.45, { f1: 2500, f2: 600, g: 0.06 });
      ep(OW_T.exit + 0.3, [50, 57, 62, 66, 69], 0.04, 2.2);
      A.bell(OW_T.exit + 0.3, midi(86), { g: 0.04, dur: 1.8 });
    },
  });
})();
