/* batch f3 — 3D & Generative: Claymorphism · Slit-scan · Raymarching.
   Soft inflated UI clay built from layered inner shadows; Trumbull's slit-scan corridor and a
   digital time-slice, both sampled per pixel from a scene that is a function of time; and a
   sphere-traced signed-distance field rendered per pixel into an upscaled ImageData. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, rrect, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@700;800;900&family=Jost:wght@300;400;500&family=JetBrains+Mono:wght@400;700;800&display=block');
  const PI = Math.PI;
  const FRED = 'Fredoka, "Nunito", sans-serif', NUN = 'Nunito, sans-serif', JOST = 'Jost, "Futura", sans-serif', JBM = '"JetBrains Mono", monospace';

  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixC = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
  const rgbaC = (h, a) => `rgba(${hex(h).join(',')},${a})`;
  const lerpHex = (a, b, u) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(u))).toString(16).padStart(2, '0')).join(''); };

  /* =====================================================================
     CLAYMORPHISM — a lilac ball drops, squashes and inflates into an app
     card; puffy icons pop onto it, float off, a button is squished and the
     card bursts into clay pebbles that frame the inflated title
     ===================================================================== */
  const CY = {
    bg0: '#ece4ff', bg1: '#ffe4dc', ink: '#4b3e72', lilac: '#b6a1ff', pink: '#ff9ec8', mint: '#84dfc1', butter: '#ffd27a',
    sky: '#94c6ff', coral: '#ff9c86', card: '#f8f3ff', shade: '#5a3f99', white: '#ffffff',
  };
  const CY_T = { drop: 0.1, morph: 1.55, pops: 2.05, flip: 3.5, lift: 4.0, cursor: 4.65, press: 5.45, burst: 5.65, title: 6.75, pill: 8.25 };

  // One clay object: shape mask → base fill → two inner shadows (light top-left, dark bottom-right) → gloss → soft
  // tinted drop shadow. Inner shadows are the shadows of the shape's inverse, drawn 4000 px away so only the shadow lands.
  function clay(c, st, bx, by, bw, bh, shape, col, o = {}) {
    const P = 72;
    const x0 = Math.max(0, Math.floor(bx - P)), y0 = Math.max(0, Math.floor(by - P));
    const x1 = Math.min(1920, Math.ceil(bx + bw + P)), y1 = Math.min(1080, Math.ceil(by + bh + P));
    if (x1 <= x0 || y1 <= y0) return;
    const w = x1 - x0, h = y1 - y0, M = st.mg, N = st.ng, L = st.lg;
    M.clearRect(x0, y0, w, h);
    M.save(); M.beginPath(); M.rect(x0, y0, w, h); M.clip(); M.fillStyle = '#000'; M.strokeStyle = '#000'; M.lineJoin = 'round'; M.lineCap = 'round'; shape(M); M.restore();
    N.globalCompositeOperation = 'source-over'; N.clearRect(x0, y0, w, h); N.fillStyle = '#000'; N.fillRect(x0, y0, w, h);
    N.globalCompositeOperation = 'destination-out'; N.drawImage(st.cm, x0, y0, w, h, x0, y0, w, h); N.globalCompositeOperation = 'source-over';
    L.globalCompositeOperation = 'source-over'; L.clearRect(x0, y0, w, h); L.drawImage(st.cm, x0, y0, w, h, x0, y0, w, h);
    L.globalCompositeOperation = 'source-in';
    const gr = L.createLinearGradient(bx, by, bx + bw, by + bh);
    gr.addColorStop(0, mixC(col, '#ffffff', o.inset ? 0 : 0.22)); gr.addColorStop(1, mixC(col, CY.shade, o.inset ? 0.04 : 0.1));
    L.fillStyle = gr; L.fillRect(x0, y0, w, h);
    L.globalCompositeOperation = 'source-atop';
    const sz = o.sz ?? Math.min(bw, bh), k = clamp(sz * 0.055, 2.5, 20) * (o.depth ?? 1), sg = o.inset ? -1 : 1;
    const pass = (color, dx, dy, blur) => {
      L.shadowColor = color; L.shadowBlur = blur; L.shadowOffsetX = 4000 + dx; L.shadowOffsetY = dy;
      L.drawImage(st.cn, x0, y0, w, h, x0 - 4000, y0, w, h);
    };
    pass(rgbaC(lerpHex(col, CY.shade, 0.55), o.inset ? 0.55 : 0.6), -sg * k, -sg * k, k * 2.4);
    pass(`rgba(255,255,255,${o.inset ? 0.75 : 0.95})`, sg * k * 0.9, sg * k * 1.1, k * 2);
    L.shadowColor = 'transparent'; L.shadowOffsetX = L.shadowOffsetY = 0; L.shadowBlur = 0;
    if (!o.inset && o.gloss !== 0) {
      const gx = bx + bw * 0.3, gy = by + bh * 0.26, gr2 = L.createRadialGradient(gx, gy, 0, gx, gy, Math.max(4, sz * 0.32));
      gr2.addColorStop(0, `rgba(255,255,255,${0.42 * (o.gloss ?? 1)})`); gr2.addColorStop(1, 'rgba(255,255,255,0)');
      L.fillStyle = gr2; L.fillRect(x0, y0, w, h);
    }
    L.globalCompositeOperation = 'source-over';
    c.save();
    const S = c.getTransform().a, lift = o.lift ?? 0;
    if (!o.inset && o.shadow !== 0) {
      c.shadowColor = `rgba(110,76,180,${clamp(0.3 - lift * 0.0005, 0.12, 0.3) * (o.shadow ?? 1)})`;
      c.shadowBlur = (18 + sz * 0.1 + lift * 0.25) * S; c.shadowOffsetX = (8 + sz * 0.03 + lift * 0.12) * S; c.shadowOffsetY = (14 + sz * 0.06 + lift * 0.35) * S;
    }
    c.globalAlpha = o.alpha ?? 1;
    c.drawImage(st.cl, x0, y0, w, h, x0, y0, w, h);
    c.restore();
  }
  // Shape library, centred on the origin, w×h nominal box. Fill + a round-jointed stroke inflates sharp corners.
  const SH = {
    circle: (g, w, h) => { g.beginPath(); g.ellipse(0, 0, w / 2, h / 2, 0, 0, TAU); g.fill(); },
    rr: (g, w, h, o) => { rrect(g, -w / 2, -h / 2, w, h, o.r ?? Math.min(w, h) * 0.3); g.fill(); },
    heart: (g, w) => {
      const s = w * 0.5; g.beginPath(); g.moveTo(0, s * 0.78);
      g.bezierCurveTo(-s * 1.25, -s * 0.05, -s * 0.78, -s * 1.05, 0, -s * 0.42);
      g.bezierCurveTo(s * 0.78, -s * 1.05, s * 1.25, -s * 0.05, 0, s * 0.78); g.closePath(); g.fill(); g.lineWidth = s * 0.22; g.stroke();
    },
    bell: (g, w) => {
      const s = w * 0.5; g.beginPath(); g.moveTo(-s * 0.78, s * 0.42);
      g.quadraticCurveTo(-s * 0.55, s * 0.2, -s * 0.55, -s * 0.15); g.bezierCurveTo(-s * 0.55, -s * 0.78, s * 0.55, -s * 0.78, s * 0.55, -s * 0.15);
      g.quadraticCurveTo(s * 0.55, s * 0.2, s * 0.78, s * 0.42); g.closePath(); g.fill(); g.lineWidth = s * 0.2; g.stroke();
      g.beginPath(); g.arc(0, s * 0.62, s * 0.2, 0, TAU); g.fill(); g.beginPath(); g.arc(0, -s * 0.76, s * 0.14, 0, TAU); g.fill();
    },
    chat: (g, w) => {
      const s = w * 0.5; rrect(g, -s * 0.85, -s * 0.7, s * 1.7, s * 1.2, s * 0.5); g.fill();
      g.beginPath(); g.moveTo(-s * 0.45, s * 0.35); g.lineTo(-s * 0.62, s * 0.85); g.lineTo(-s * 0.02, s * 0.4); g.closePath(); g.fill(); g.lineWidth = s * 0.16; g.stroke();
    },
    star: (g, w) => {
      const s = w * 0.5; g.beginPath();
      for (let k = 0; k < 10; k++) { const a = -PI / 2 + k * PI / 5, r = k % 2 ? s * 0.42 : s * 0.86; k ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r + s * 0.06) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r + s * 0.06); }
      g.closePath(); g.fill(); g.lineWidth = s * 0.26; g.stroke();
    },
    ring: (g, w) => { g.beginPath(); g.arc(0, 0, w * 0.5, 0, TAU); g.arc(0, 0, w * 0.22, 0, TAU, true); g.fill('evenodd'); },
    pill: (g, w, h) => { rrect(g, -w / 2, -h / 2, w, h, Math.min(w, h) / 2); g.fill(); },
    pointer: (g, w) => {
      const s = w / 90; g.beginPath(); g.moveTo(-30 * s, -40 * s); g.lineTo(34 * s, 4 * s); g.lineTo(4 * s, 10 * s); g.lineTo(-12 * s, 40 * s); g.closePath();
      g.fill(); g.lineWidth = 16 * s; g.stroke();
    },
    squiggle: (g, w) => {
      const s = w * 0.5; g.beginPath(); g.moveTo(-s * 0.8, 0);
      g.bezierCurveTo(-s * 0.5, -s * 0.7, -s * 0.2, s * 0.7, 0, 0); g.bezierCurveTo(s * 0.2, -s * 0.7, s * 0.5, s * 0.7, s * 0.8, 0);
      g.lineWidth = s * 0.34; g.stroke();
    },
  };
  // Place a library shape: translate, rotate, squash about the base point (anchor 'b') or centre.
  function blob(c, st, x, y, w, h, col, kind, o = {}) {
    const s = o.s ?? 1, sx = (o.sx ?? 1) * s, sy = (o.sy ?? 1) * s;
    if (sx < 0.02 || sy < 0.02) return;
    const R = Math.hypot(w, h) / 2 * Math.max(sx, sy) * 1.15 + 6, ay = o.anchor === 'b' ? h / 2 : 0;
    clay(c, st, x - R, y - R + (ay ? ay * (1 - sy) : 0), 2 * R, 2 * R, g => {
      g.translate(x, y + ay); g.rotate(o.rot || 0); g.scale(sx, sy); g.translate(0, -ay); SH[kind](g, w, h, o);
    }, col, { ...o, sz: Math.min(w * sx, h * sy) * (o.szk ?? 1) });
  }
  // Spring pop with a squash/stretch wobble that decays with it.
  const pop = (t, t0, f = 2.0, z = 0.42) => (t <= t0 ? 0 : spring(t - t0, f, z));
  const wob = (t, t0, f = 3.2, d = 5) => (t <= t0 ? 0 : Math.sin((t - t0) * TAU * f) * Math.exp(-(t - t0) * d));

  // The opening ball: free fall and two bounces, contact-anchored squash on each landing.
  function cyBall(t) {
    const G = 6400, floor = 760, R = 110;
    const t0 = CY_T.drop, fall = 880, ti1 = t0 + Math.sqrt(2 * fall / G);
    const v1 = Math.sqrt(2 * G * 250), ti2 = ti1 + 2 * v1 / G, v2 = Math.sqrt(2 * G * 64), ti3 = ti2 + 2 * v2 / G;
    let yb, vy, sx = 1, sy = 1;
    if (t < ti1) { const d = t - t0; yb = floor - fall + 0.5 * G * d * d; vy = G * d; }
    else if (t < ti2) { const d = t - ti1; yb = floor - (v1 * d - 0.5 * G * d * d); vy = -v1 + G * d; }
    else if (t < ti3) { const d = t - ti2; yb = floor - (v2 * d - 0.5 * G * d * d); vy = -v2 + G * d; }
    else { yb = floor; vy = 0; }
    const st = clamp(Math.abs(vy) * 0.00006, 0, 0.13);
    sy = 1 + st; sx = 1 - st * 0.55;
    [[ti1, 0.36], [ti2, 0.22], [ti3, 0.1]].forEach(([ti, a]) => { if (t > ti) { const q = a * Math.exp(-(t - ti) * 9) * Math.cos((t - ti) * TAU * 3.6); sy -= q; sx += q * 0.8; } });
    return { yb, sx, sy, R, impacts: [ti1, ti2, ti3] };
  }
  const CY_TILES = [{ x: -255, col: CY.pink, kind: 'heart' }, { x: -85, col: CY.butter, kind: 'bell' }, { x: 85, col: CY.sky, kind: 'chat' }, { x: 255, col: CY.mint, kind: 'star' }];
  const CY_FLOAT = [[300, 250, -0.18], [1640, 230, 0.14], [270, 840, 0.1], [1660, 850, -0.12]];
  // Card geometry over time: ball → card morph, then deflate at the burst.
  function cyCard(t) {
    const p = pop(t, CY_T.morph, 1.5, 0.5), q = clamp(p, 0, 1.2);
    const w = lerp(220, 780, q), h = lerp(220, 580, q), y = lerp(650, 560, clamp(p)), r = lerp(110, 84, clamp(p));
    const wb = wob(t, CY_T.morph + 0.15, 2.2, 3.5) * 0.05;
    const gone = E.inB(seg(t, CY_T.burst + 0.03, CY_T.burst + 0.36), 1.1);
    const cs = 1 - gone + wob(t, CY_T.press, 4, 7) * 0.02;
    return { x: 960, y, w: w * (1 + wb), h: h * (1 - wb), r, p, cs, col: lerpHex(CY.lilac, CY.card, seg(t, CY_T.morph, CY_T.morph + 0.45)) };
  }
  function cyBg(c, t, W, H) {
    const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, CY.bg0); g.addColorStop(1, CY.bg1);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    [[380, 300, 520, '#d9ccff', 0.7], [1580, 820, 600, '#ffd1c4', 0.75], [1500, 180, 380, '#cfeee6', 0.55], [500, 900, 420, '#ffe6b8', 0.5]].forEach(([x, y, r, col, a], i) => {
      const xx = x + Math.sin(t * 0.4 + i * 2) * 40, yy = y + Math.cos(t * 0.33 + i) * 30;
      const rg = c.createRadialGradient(xx, yy, 0, xx, yy, r); rg.addColorStop(0, rgbaC(col, a)); rg.addColorStop(1, rgbaC(col, 0));
      c.fillStyle = rg; c.fillRect(0, 0, W, H);
    });
  }
  function cyFace(c, x, y, s, blink) {
    c.fillStyle = CY.ink;
    [-1, 1].forEach(k => { c.beginPath(); c.ellipse(x + k * 15 * s, y - 4 * s, 5 * s, 6.5 * s * (1 - blink * 0.85), 0, 0, TAU); c.fill(); });
    c.lineWidth = 4.5 * s; c.lineCap = 'round'; c.strokeStyle = CY.ink;
    c.beginPath(); c.arc(x, y + 6 * s, 11 * s, 0.15 * PI, 0.85 * PI); c.stroke();
    c.fillStyle = 'rgba(255,120,150,0.5)'; [-1, 1].forEach(k => { c.beginPath(); c.ellipse(x + k * 26 * s, y + 8 * s, 7 * s, 4.5 * s, 0, 0, TAU); c.fill(); });
  }

  MG.film({
    id: 'claymorphism', dur: 10, poster: 9.5,
    fonts: [['700 120px Fredoka', 'Claymorphism'], ['600 40px Fredoka', 'Squish Hello'], ['800 26px Nunito', 'SOFT · INFLATED · TACTILE 2021—'], ['700 26px Nunito', '3 soft things today']],
    meta: {
      family: 'D', name: 'Claymorphism', sub: 'Inflated Soft UI', era: '2021 —',
      origin: 'A UI and 3D-illustration trend that followed skeuomorphism (2000s), flat design (2013) and neumorphism (2020): puffy, matte, pastel objects that look inflated or moulded from soft clay, faked in CSS with an outer drop shadow plus two inset shadows. Michał Malewicz of Hype4 named and documented it in 2021, riding the wave of Blender-made 3D icon packs.',
      works: 'Michał Malewicz / Hype4 — "Claymorphism in user interfaces" (2021) · Blender 3D icon & illustration packs on Dribbble and Figma Community (2021—) · Microsoft Fluent 3D emoji (2021) · clay.css (Adrian Bece, 2022) · countless 3D onboarding illustrations in fintech and wellness apps',
      tech: ['Outer drop shadow + two inset shadows', 'Inflated rounded geometry', 'Pastel matte palette', 'Spring squash & stretch'],
      accent: '#b6a1ff',
      motionDNA: 'Everything is soft and springy: objects drop, squash on contact and overshoot on low-damped springs; buttons physically compress when pressed and icons drift and bob as if filled with air.',
      visualDNA: 'Puffy pastel shapes with rounded corners, a bright inner highlight top-left and a tinted inner shadow bottom-right, floating above a pale gradient on large soft coloured drop shadows.',
      transitions: 'Drop and bounce, blob-to-card inflate, spring pop-in, press squash, burst into pebbles',
      implementation: ['CSS box-shadow (outer + 2× inset)', 'Figma / Spline', 'Blender', 'Canvas 2D (shadow compositing)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const cm = offscreen(1920, 1080), cn = offscreen(1920, 1080), cl = offscreen(1920, 1080);
      const r = rng(2021), peb = [], kinds = ['circle', 'circle', 'pill', 'ring', 'star', 'squiggle', 'circle', 'pill'];
      const cols = [CY.pink, CY.mint, CY.butter, CY.sky, CY.coral, CY.lilac];
      let guard = 0;
      while (peb.length < 18 && guard++ < 4000) {
        const a = r() * TAU, rad = 0.62 + r() * 0.5, x = 960 + Math.cos(a) * 900 * rad, y = 545 + Math.sin(a) * 470 * rad;
        if (x < 70 || x > 1850 || y < 70 || y > 1010) continue;
        if (Math.abs(y - 520) < 210 && Math.abs(x - 960) < 760) continue;
        if (Math.abs(y - 690) < 70 && Math.abs(x - 960) < 330) continue;
        if (CY_FLOAT.some(([fx, fy]) => Math.hypot(fx - x, fy - y) < 190)) continue;
        if (peb.some(p => Math.hypot(p.x - x, p.y - y) < 150)) continue;
        const kind = kinds[peb.length % kinds.length];
        peb.push({ x, y, kind, col: cols[peb.length % cols.length], s: 46 + r() * 50, rot: r() * TAU, d: r() * 0.18, ph: r() * TAU });
      }
      return { cm, cn, cl, mg: cm.getContext('2d'), ng: cn.getContext('2d'), lg: cl.getContext('2d'), peb };
    },
    draw(c, t, W, H, st) {
      cyBg(c, t, W, H);
      const T = CY_T, bob = (ph, a = 10) => Math.sin(t * 1.8 + ph) * a;
      // floor contact shadow for the falling ball
      if (t < T.morph + 0.5) {
        const b = cyBall(t), hgt = 760 - b.yb, a = (1 - seg(t, T.morph, T.morph + 0.5)) * clamp(1 - hgt / 900);
        if (t > T.drop) {
          const rg = c.createRadialGradient(960, 770, 0, 960, 770, 170 - hgt * 0.06);
          rg.addColorStop(0, `rgba(110,76,180,${0.32 * a})`); rg.addColorStop(1, 'rgba(110,76,180,0)');
          c.save(); c.translate(960, 770); c.scale(1, 0.22); c.translate(-960, -770); c.fillStyle = rg; c.fillRect(700, 500, 520, 540); c.restore();
        }
      }
      // pebbles (behind the card), bursting from the button
      const bp = { x: 960 + 165, y: 560 + 180 };
      if (t > T.burst) st.peb.forEach((p, i) => {
        const tt = T.burst + p.d * 0.6, u = pop(t, tt, 1.05, 0.5), s = clamp(pop(t, tt, 2.4, 0.4) * 1.0, 0, 1.3);
        const x = lerp(bp.x, p.x, u) + bob(p.ph, 6), y = lerp(bp.y, p.y, u) + bob(p.ph + 1, 12);
        const wv = wob(t, tt + 0.15, 2.6, 4) * 0.2;
        const k = { pill: 1, star: 1.55, squiggle: 1.7, ring: 1.15 }[p.kind] || 1;
        blob(c, st, x, y, (p.kind === 'pill' ? p.s * 1.7 : p.s) * k, (p.kind === 'pill' ? p.s * 0.75 : p.s) * k, p.col, p.kind, { s, sx: 1 + wv, sy: 1 - wv, rot: p.rot + t * 0.25 * (i % 2 ? 1 : -1), lift: 40 });
      });
      // the ball, then the card it inflates into
      const cd = cyCard(t);
      if (t < T.morph) {
        const b = cyBall(t);
        if (t > T.drop) blob(c, st, 960, b.yb - b.R, 2 * b.R, 2 * b.R, CY.lilac, 'circle', { sx: b.sx, sy: b.sy, anchor: 'b', shadow: 0.5 });
      } else if (cd.cs > 0.02) {
        const cx = cd.x, cy = cd.y, cs = cd.cs;
        clay(c, st, cx - cd.w / 2 * cs, cy - cd.h / 2 * cs, cd.w * cs, cd.h * cs, g => { g.translate(cx, cy); g.scale(cs, cs); rrect(g, -cd.w / 2, -cd.h / 2, cd.w, cd.h, cd.r); g.fill(); }, cd.col, { sz: 260 * cs, lift: 30, gloss: 0 });
        const L = (lx, ly) => [cx + lx * cs, cy + ly * cs];
        // avatar with a face
        const pa = pop(t, T.pops, 2.4, 0.4);
        if (pa > 0) {
          const [ax, ay] = L(-290, -190), wa = wob(t, T.pops, 3, 5) * 0.2;
          blob(c, st, ax, ay, 100, 100, CY.pink, 'circle', { s: pa * cs, sx: 1 + wa, sy: 1 - wa });
          c.save(); c.translate(ax, ay); c.scale(pa * cs, pa * cs); cyFace(c, 0, 0, 1, seg(Math.sin(t * 2.3) , 0.97, 1)); c.restore();
        }
        // header text
        const th = E.outC(seg(t, T.pops + 0.12, T.pops + 0.5));
        if (th > 0 && cs > 0.4) {
          c.save(); c.globalAlpha = th * clamp((cs - 0.4) / 0.5); c.translate(cx, cy); c.scale(cs, cs);
          text(c, 'Hello, Clay!', -215, -196 + (1 - th) * 16, { font: FRED, weight: 700, size: 50, color: CY.ink });
          text(c, '3 soft things today', -213, -150 + (1 - th) * 16, { font: NUN, weight: 700, size: 26, color: rgbaC(CY.ink, 0.6) });
          c.restore();
        }
        // three-dot menu
        const pm = pop(t, T.pops + 0.3, 2.4, 0.45);
        if (pm > 0) { const [mx, my] = L(310, -200); blob(c, st, mx, my, 74, 74, CY.card, 'circle', { s: pm * cs, sz: 50 }); c.fillStyle = rgbaC(CY.ink, 0.55 * clamp(pm)); [-14, 0, 14].forEach(d => { c.beginPath(); c.arc(mx + d * cs, my, 4.5 * cs, 0, TAU); c.fill(); }); }
        // icon tiles
        CY_TILES.forEach((ti, i) => {
          const t0 = T.pops + 0.25 + i * 0.13, ps = pop(t, t0, 2.2, 0.38), wv = wob(t, t0, 3, 5) * 0.22;
          if (ps <= 0) return;
          const [tx, ty] = L(ti.x, -10);
          blob(c, st, tx, ty, 140, 140, lerpHex(ti.col, '#ffffff', 0.62), 'rr', { r: 44, s: ps * cs, sx: 1 + wv, sy: 1 - wv, anchor: 'b', szk: 1 });
        });
        // toggle switch: inset track, sliding knob that stretches as it travels
        const pt = pop(t, T.pops + 0.85, 2.2, 0.45);
        if (pt > 0) {
          const fl = E.ioC(seg(t, T.flip, T.flip + 0.32)), [gx, gy] = L(-215, 180);
          blob(c, st, gx, gy, 180, 88, lerpHex('#e3dbf5', CY.mint, fl), 'pill', { s: pt * cs, inset: true, sz: 70 });
          const kx = gx + lerp(-46, 46, fl) * cs * pt, stv = Math.sin(fl * PI) * 0.35;
          blob(c, st, kx, gy, 68, 68, '#ffffff', 'circle', { s: pt * cs, sx: 1 + stv, sy: 1 - stv * 0.4, sz: 60 });
        }
        // CTA button: squashes and inverts its shadows when pressed
        const pb = pop(t, T.pops + 1.0, 2.2, 0.42);
        if (pb > 0) {
          const pr = seg(t, T.press, T.press + 0.08) * (1 - seg(t, T.press + 0.16, T.press + 0.3));
          const [bx, by] = L(165, 180), sqz = pr * 0.12 + wob(t, T.press + 0.25, 4, 6) * 0.08;
          blob(c, st, bx, by, 300, 100, CY.coral, 'pill', { s: pb * cs, sx: 1 + sqz * 0.5, sy: 1 - sqz, inset: pr > 0.5, sz: 90, depth: 1.2 });
          c.save(); c.globalAlpha = clamp(pb); c.translate(bx, by + pr * 4); c.scale(pb * cs * (1 + sqz * 0.5), pb * cs * (1 - sqz));
          text(c, 'Squish', 0, 2, { font: FRED, weight: 600, size: 42, align: 'center', base: 'middle', color: '#fff', ls: 1 });
          c.restore();
        }
      }
      // the four glyphs: pop onto their tiles, then lift off and float out to frame the stage
      CY_TILES.forEach((ti, i) => {
        const t0 = T.pops + 0.38 + i * 0.13, ps = pop(t, t0, 2.4, 0.36);
        if (ps <= 0) return;
        const tile = [960 + ti.x * cd.cs, cd.y - 10 * cd.cs];
        const lu = E.ioC(seg(t, T.lift + i * 0.12, T.lift + 0.9 + i * 0.12));
        const push = t > T.burst ? Math.sin(clamp((t - T.burst) * 3) * PI) * 40 * Math.exp(-(t - T.burst) * 1.5) : 0;
        const [fx, fy, frot] = CY_FLOAT[i], dx = fx - 960, dy = fy - 540, dn = Math.hypot(dx, dy);
        const x = lerp(tile[0], fx + dx / dn * push, lu) + bob(i * 1.7, 8) * lu;
        const y = lerp(tile[1], fy + dy / dn * push, lu) - Math.sin(lu * PI) * 120 + bob(i * 1.7 + 1, 14) * lu;
        const sc = (lu > 0 ? lerp(cd.cs, 1.85, lu) : cd.cs) * ps, wv = wob(t, t0, 3, 5) * 0.2 + wob(t, T.lift + i * 0.12 + 0.9, 2.4, 3.5) * 0.12;
        const rot = lerp(0, frot, lu) + (i === 1 && t > T.pops + 1.2 && lu === 0 ? Math.sin((t - T.pops - 1.2) * 22) * 0.22 * Math.exp(-(t - T.pops - 1.2) * 3) : 0);
        if (sc < 0.02) return;
        blob(c, st, x, y, 82, 82, ti.col, ti.kind, { s: sc, sx: 1 + wv, sy: 1 - wv, rot, lift: lu * 80 });
        // notification badge on the bell
        if (i === 1) { const pbg = pop(t, T.pops + 1.2, 2.6, 0.4); if (pbg > 0) { const bx = x + 34 * sc, by = y - 34 * sc; blob(c, st, bx, by, 40, 40, CY.coral, 'circle', { s: pbg * sc, sz: 30 }); text(c, '3', bx, by + 1, { font: FRED, weight: 700, size: 26 * pbg * sc, align: 'center', base: 'middle', color: '#fff' }); } }
      });
      // the cursor glides in and presses the button
      if (t > T.cursor && t < T.burst + 1.1) {
        const u = E.outC(seg(t, T.cursor, T.press - 0.05)), out = E.inC(seg(t, T.burst + 0.3, T.burst + 1.0));
        const px = lerp(1720, 1150, u) + out * 500, py = lerp(1160, 770, u) + out * 400;
        const pr = seg(t, T.press - 0.05, T.press + 0.06) * (1 - seg(t, T.press + 0.16, T.press + 0.3));
        blob(c, st, px + 30, py + 36, 90, 90, '#ffffff', 'pointer', { s: 1 - pr * 0.12, rot: -0.15, lift: 60 - pr * 50, sz: 60 });
      }
      // title: inflated clay letters pop in one after another
      if (t > T.title) {
        const word = 'Claymorphism', size = 214, cols = [CY.lilac, CY.pink, CY.butter, CY.mint, CY.sky, CY.coral];
        const g = st.mg; g.font = `700 ${size}px ${FRED}`;
        const ws = [...word].map(ch => g.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0) + (word.length - 1) * 4;
        let x = 960 - tot / 2;
        [...word].forEach((ch, i) => {
          const t0 = T.title + i * 0.075, ps = pop(t, t0, 2.1, 0.38), wv = wob(t, t0, 2.8, 4.5) * 0.24;
          const cxl = x + ws[i] / 2, by = 610 + bob(i * 0.6, 5) * seg(t, 8.4, 9);
          x += ws[i] + 4;
          if (ps <= 0) return;
          const yy = by - (1 - clamp(ps)) * 90;
          clay(c, st, cxl - ws[i], yy - size, ws[i] * 2, size * 1.3, gg => {
            gg.translate(cxl, yy); gg.scale(ps * (1 + wv), ps * (1 - wv)); gg.font = `700 ${size}px ${FRED}`; gg.textAlign = 'center'; gg.textBaseline = 'alphabetic';
            gg.fillText(ch, 0, 0); gg.lineWidth = 7; gg.strokeText(ch, 0, 0);
          }, cols[i % cols.length], { sz: 120, depth: 0.85, lift: 30 });
        });
        // subtitle pill
        const pp = pop(t, T.pill, 2.2, 0.45);
        if (pp > 0) {
          const wv = wob(t, T.pill, 3, 5) * 0.15;
          blob(c, st, 960, 730, 790, 80, CY.card, 'pill', { s: pp, sx: 1 + wv, sy: 1 - wv, sz: 70 });
          c.save(); c.globalAlpha = clamp(pp); c.translate(960, 732); c.scale(pp * (1 + wv), pp * (1 - wv));
          text(c, 'SOFT  ·  INFLATED  ·  TACTILE  ·  2021—', 0, 0, { font: NUN, weight: 800, size: 25, align: 'center', base: 'middle', color: rgbaC(CY.ink, 0.8), ls: 4 });
          c.restore();
        }
      }
      grain(c, W, H, t, 0.028, 'soft-light');
    },
    score(A) {
      A.bus.gain.value = 0.9;
      const mar = (t, m, g = 0.12, pan = 0) => { A.bell(t, midi(m), { ratios: [1, 4, 10], g, dur: 0.7, rev: 0.25, pan }); };
      const pop = (t, f = 900, g = 0.14, pan = 0) => { A.osc(t, { f, f2: f * 0.35, glide: 0.07, dur: 0.1, g, pan }); A.osc(t, { f: f * 2.1, f2: f * 0.9, glide: 0.04, dur: 0.05, g: g * 0.3, pan }); };
      const boing = (t, g = 0.3) => { A.osc(t, { f: 140, f2: 360, glide: 0.09, dur: 0.32, g, type: 'triangle', vib: [18, 14] }); A.osc(t, { f: 70, f2: 50, dur: 0.2, g: g * 0.8 }); };
      const pad = (t, notes, dur, g = 0.03) => A.chord(t, notes, { type: 'triangle', dur, g, lp: 1800, a: 0.25, hold: true, rel: 0.5, spread: 6, rev: 0.5, width: 0.7 });
      // drop, bounces
      A.osc(0.1, { f: 1400, f2: 300, glide: 0.5, dur: 0.5, g: 0.05, type: 'triangle' });
      const b = cyBall(0); boing(b.impacts[0], 0.36); boing(b.impacts[1], 0.22); boing(b.impacts[2], 0.1);
      // inflate
      A.osc(CY_T.morph, { f: 180, f2: 540, glide: 0.4, dur: 0.5, g: 0.12, type: 'sine', vib: [9, 10] });
      A.noise(CY_T.morph, { type: 'lowpass', f: 300, f2: 1400, sweep: 0.4, dur: 0.5, g: 0.06, swell: 0.6 });
      // groove: soft kick, snaps, a marimba riff (F major, 120 bpm)
      const Bt = 0.5;
      for (let k = 4; k < 20; k++) {
        const tb = k * Bt; if (tb > 9.6) break;
        if (tb < CY_T.burst - 0.05 || tb > 6.6) { A.kick(tb, 0.38, { f: 110, f2: 45, dur: 0.3 }); if (k % 2) A.clap(tb, 0.08, { rev: 0.3 }); }
        A.hat(tb + 0.25, 0.04, false, { pan: 0.3 });
      }
      const riff = [65, 69, 72, 77, 76, 72, 69, 72];
      for (let k = 0; k < 12; k++) { const t = 2.0 + k * 0.25; if (t > CY_T.burst - 0.1) break; mar(t, riff[k % 8], 0.08, (k % 2 ? 0.25 : -0.25)); }
      pad(2.0, [53, 60, 64, 69], 1.6); pad(3.6, [50, 57, 62, 65], 2.0);
      // pops for each element
      [CY_T.pops, CY_T.pops + 0.3].forEach((t, i) => pop(t, 800 + i * 200, 0.12));
      CY_TILES.forEach((_, i) => { pop(CY_T.pops + 0.25 + i * 0.13, 700 + i * 120, 0.1, (i - 1.5) * 0.3); pop(CY_T.pops + 0.38 + i * 0.13, 1200 + i * 150, 0.1, (i - 1.5) * 0.3); });
      pop(CY_T.pops + 0.85, 600, 0.1); pop(CY_T.pops + 1.0, 500, 0.12);
      A.bell(CY_T.pops + 1.2, midi(88), { g: 0.05, dur: 0.8 }); A.bell(CY_T.pops + 1.32, midi(84), { g: 0.04, dur: 0.8 });
      // toggle click
      A.osc(CY_T.flip, { f: 2200, f2: 900, glide: 0.02, dur: 0.04, g: 0.08 }); A.osc(CY_T.flip + 0.3, { f: 1600, f2: 700, glide: 0.02, dur: 0.04, g: 0.07 });
      // icons float away
      CY_TILES.forEach((_, i) => A.osc(CY_T.lift + i * 0.12, { f: midi(72 + i * 4), f2: midi(79 + i * 4), glide: 0.5, dur: 0.6, g: 0.035, type: 'sine', rev: 0.5, pan: (i % 2 ? 0.5 : -0.5) }));
      A.whoosh(CY_T.lift, 1.0, { f1: 400, f2: 1600, g: 0.06 });
      // squish!
      A.noise(CY_T.press, { type: 'lowpass', f: 900, f2: 200, sweep: 0.2, dur: 0.24, g: 0.2 });
      A.osc(CY_T.press, { f: 320, f2: 110, glide: 0.18, dur: 0.24, g: 0.16, type: 'triangle' });
      // burst: a scatter of pops and a sweet chord
      for (let k = 0; k < 18; k++) pop(CY_T.burst + 0.05 + hash(k) * 0.4, 500 + hash(k * 3) * 1400, 0.07, (hash(k * 7) - 0.5) * 1.4);
      A.kick(CY_T.burst, 0.5, { f: 90, f2: 40 }); A.whoosh(CY_T.burst, 0.6, { f1: 300, f2: 3000, g: 0.1 });
      pad(CY_T.burst, [57, 60, 64, 67, 72], 1.4, 0.03);
      // title letters: a rising marimba run, then a final chord
      [60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79].forEach((m, i) => mar(CY_T.title + i * 0.075, m + 5, 0.09, (i / 11 - 0.5) * 0.8));
      pop(CY_T.pill, 700, 0.12);
      pad(8.0, [53, 60, 65, 69, 72], 2.0, 0.035);
      mar(8.5, 77, 0.1); mar(8.75, 81, 0.08); mar(9.0, 84, 0.08);
      A.bell(9.0, midi(89), { g: 0.04, dur: 1.4, rev: 0.6 });
    },
  });

  /* =====================================================================
     SLIT-SCAN — a single slit of light opens into Trumbull's Stargate:
     two planes of streaming colour rushing out of the horizon, rotating
     to walls, closing into the Doctor Who time tunnel; a flash, then the
     title is exposed column by column by a moving slit (time-slice)
     ===================================================================== */
  const SS_BW = 960, SS_BH = 540, SS_AW = 1024, SS_AH = 1024, SS_F = 60;
  const SS_T = { slit: 0.25, open: 1.15, full: 2.4, cool: 4.0, rot: 5.0, vert: 5.9, tun: 6.6, round: 7.2, flash: 7.9, scan1: 8.05, scan2: 9.0, sub: 9.45 };
  // The artwork behind the slit: three intensity layers (each tinted per frame) of long dashed light lines.
  function ssArtwork() {
    const r = rng(1968), N = SS_AW * SS_AH, L = [new Float32Array(N), new Float32Array(N), new Float32Array(N)];
    for (let v = 0; v < SS_AH; v++) {
      const nv = vnoise(v / 90, 3);
      for (let u = 0; u < SS_AW; u++) {
        const b = 0.5 + 0.5 * Math.sin(u / SS_AW * TAU * 6 + nv * 2.2);
        L[0][v * SS_AW + u] = 0.05 * b; L[1][v * SS_AW + u] = 0.05 * (1 - b);
      }
    }
    for (let k = 0; k < 230; k++) {
      const u0 = r() * SS_AW, w = 0.5 + Math.pow(r(), 3) * 6, lay = L[r() < 0.42 ? 0 : r() < 0.7 ? 1 : 2];
      const amp = (0.25 + r() * 0.9) / Math.sqrt(w), per = 60 + r() * 520, duty = 0.35 + r() * 0.62, ph = r() * per, ext = Math.ceil(w * 2.2);
      for (let v = 0; v < SS_AH; v++) {
        const f = ((v + ph) % per) / per; if (f > duty) continue;
        const e = Math.pow(Math.sin(PI * f / duty), 0.35) * amp;
        for (let du = -ext; du <= ext; du++) {
          const u = (Math.round(u0) + du + SS_AW) % SS_AW, fall = Math.exp(-((du + Math.round(u0) - u0) ** 2) / (w * w));
          lay[v * SS_AW + u] += e * fall;
        }
      }
    }
    // cross rungs: brief bright bars that read as speed
    for (let k = 0; k < 14; k++) { const v0 = Math.floor(r() * SS_AH), lay = L[k % 3]; for (let dv = 0; dv < 3; dv++) for (let u = 0; u < SS_AW; u++) lay[((v0 + dv) % SS_AH) * SS_AW + u] += 0.12 * (0.5 + 0.5 * Math.sin(u * 0.05 + k)); }
    // pre-blurred copy along u for the far field near the horizon
    const B = L.map(a => { const o = new Float32Array(N); for (let v = 0; v < SS_AH; v++) for (let u = 0; u < SS_AW; u++) { let s = 0; for (let d = -3; d <= 3; d++) s += a[v * SS_AW + ((u + d + SS_AW) % SS_AW)]; o[v * SS_AW + u] = s / 7; } return o; });
    return { L, B };
  }
  const SS_COLS = [
    [0, [[1.0, 0.5, 0.08], [0.95, 0.08, 0.35], [1.0, 0.88, 0.55]]],
    [SS_T.cool - 0.3, [[1.0, 0.5, 0.08], [0.95, 0.08, 0.35], [1.0, 0.88, 0.55]]],
    [SS_T.cool + 0.3, [[0.1, 0.75, 1.0], [0.5, 0.12, 1.0], [0.6, 1.0, 0.72]]],
    [SS_T.vert - 0.3, [[0.1, 0.75, 1.0], [0.5, 0.12, 1.0], [0.6, 1.0, 0.72]]],
    [SS_T.vert + 0.2, [[1.0, 0.16, 0.08], [0.15, 1.0, 0.35], [1.0, 0.85, 0.2]]],
    [SS_T.tun + 0.3, [[1.0, 0.16, 0.08], [0.15, 1.0, 0.35], [1.0, 0.85, 0.2]]],
    [SS_T.round + 0.1, [[0.12, 0.3, 1.0], [0.75, 0.15, 1.0], [0.7, 0.85, 1.0]]],
    [SS_T.flash, [[0.12, 0.3, 1.0], [0.75, 0.15, 1.0], [0.7, 0.85, 1.0]]],
    [SS_T.flash + 0.05, [[1.0, 0.45, 0.1], [0.9, 0.1, 0.4], [1.0, 0.85, 0.5]]],
  ];
  function ssCols(t) {
    const K = SS_COLS; let i = 1; while (i < K.length - 1 && t > K[i][0]) i++;
    const a = K[i - 1], b = K[i], u = E.ioS(seg(t, a[0], b[0]));
    return a[1].map((c3, j) => c3.map((v, k) => lerp(v, b[1][j][k], u)));
  }
  function ssParams(t) {
    const T = SS_T, post = t >= T.flash;
    return {
      rot: post ? 0 : E.ioC(seg(t, T.rot, T.vert)) * PI / 2,
      kx: post ? 0 : E.ioC(seg(t, T.vert + 0.2, T.tun + 0.3)),
      round: post ? 0 : E.ioC(seg(t, T.tun + 0.3, T.round + 0.2)),
      spin: post ? 0 : Math.pow(seg(t, T.tun + 0.3, T.flash), 2) * 2.2,
      // distance along the corridor (texels): speed builds through the film, eases into the title
      vs: 230 * t + 70 * t * t + (post ? 0 : 160 * Math.pow(seg(t, T.round, T.flash), 2)),
      us: Math.sin(t * 0.37) * 40,
      gain: (post ? lerp(1.4, 0.62, E.outC(seg(t, T.flash, T.flash + 0.8))) : 1.0 + 0.9 * Math.pow(seg(t, T.round + 0.2, T.flash), 2)) * (1 + 0.06 * Math.sin(t * 31) * seg(t, T.full, T.flash)),
      gap: post ? lerp(4, 74, E.outC(seg(t, T.flash, T.flash + 0.9))) : 4,
      reveal: t >= T.full ? 5000 : lerp(0, 420, E.inQ(seg(t, T.open, T.full))),
      slit: t < T.full + 0.4 ? 1 - seg(t, T.full - 0.2, T.full + 0.4) : 0,
      slitW: E.outC(seg(t, T.slit, T.slit + 0.6)),
      cols: ssCols(t),
    };
  }
  function ssRender(st, t) {
    const P = ssParams(t), d8 = st.img.data, A = st.art.L, Bl = st.art.B, cx = SS_BW / 2, cy = SS_BH / 2;
    const ca = Math.cos(P.rot), sa = Math.sin(P.rot), [c0, c1, c2] = P.cols, US = 256, VS = 150, MU = SS_AW - 1, MV = SS_AH - 1;
    const tone = v => (v <= 0 ? 0 : 255 * (1 - Math.exp(-v * 1.25)));
    let o = 0;
    for (let y = 0; y < SS_BH; y++) {
      const Y = y - cy + 0.5;
      for (let x = 0; x < SS_BW; x++, o += 4) {
        const X = x - cx + 0.5, xr = X * ca + Y * sa, yr = -X * sa + Y * ca;
        const ax = Math.abs(xr) * P.kx, ay = Math.abs(yr), dq = ax > ay ? ax : ay;
        const d = P.round > 0 ? dq + (Math.sqrt(ax * ax + ay * ay) - dq) * P.round : dq;
        let r = 0, g = 0, b = 0;
        // the slit itself: a thin line at the horizon showing the artwork sliding past
        if (P.slit > 0 && ay < 2.4 && Math.abs(X) < cx * P.slitW) {
          const U = (X * 0.9 + t * 120) | 0, i = (((P.vs | 0) & MV) * SS_AW) + (U & MU), e = P.slit * (1 - ay / 2.4) * 2.2 * (1 - Math.pow(Math.abs(X) / cx, 4));
          r = (A[0][i] * c0[0] + A[1][i] * c1[0] + A[2][i] * c2[0] + 0.25) * e; g = (A[0][i] * c0[1] + A[1][i] * c1[1] + A[2][i] * c2[1] + 0.2) * e; b = (A[0][i] * c0[2] + A[1][i] * c1[2] + A[2][i] * c2[2] + 0.18) * e;
        }
        if (d > 0.6 && P.reveal > 0) {
          const z = SS_F / d;
          let u = ax > ay ? yr / d + (xr > 0 ? 3.1 : 5.3) : xr / d + (yr > 0 ? 0 : 7.7);
          if (P.round > 0) u = lerp(u, Math.atan2(xr, yr) / PI * 2 + P.spin, P.round);
          const Uf = u * US + P.us, U0 = Math.floor(Uf), fu = Uf - U0, V = ((z * VS + P.vs) | 0) & MV;
          const i0 = V * SS_AW + (U0 & MU), i1 = V * SS_AW + ((U0 + 1) & MU), S = d < 70 ? Bl : A;
          const l0 = S[0][i0] + (S[0][i1] - S[0][i0]) * fu, l1 = S[1][i0] + (S[1][i1] - S[1][i0]) * fu, l2 = S[2][i0] + (S[2][i1] - S[2][i0]) * fu;
          let e = clamp((d - P.gap) / 46) * clamp((P.reveal - d) / 18) * P.gain;
          e *= e > 0 ? Math.pow(clamp((d - P.gap) / 120), 0.6) * 0.6 + 0.4 : 0;
          r += (l0 * c0[0] + l1 * c1[0] + l2 * c2[0]) * e; g += (l0 * c0[1] + l1 * c1[1] + l2 * c2[1]) * e; b += (l0 * c0[2] + l1 * c1[2] + l2 * c2[2]) * e;
        }
        d8[o] = tone(r); d8[o + 1] = tone(g); d8[o + 2] = tone(b); d8[o + 3] = 255;
      }
    }
    st.bg.putImageData(st.img, 0, 0);
    return P;
  }
  // Title source scene for the time-slice: the word heaves and stretches until 9.0 s, then rests.
  const ssSrc = tau => { const env = Math.pow(clamp((SS_T.scan2 - tau) / 0.95), 1.2); return { oy: 120 * Math.sin(tau * 15) * env, sy: 1 + 0.7 * env * Math.sin(tau * 9.5 + 1.2) }; };

  MG.film({
    id: 'slitscan', dur: 10, poster: 9.7,
    fonts: [['300 200px Jost', 'SLIT-SCAN'], ['400 24px Jost', 'DOUGLAS TRUMBULL · 2001: A SPACE ODYSSEY · 1968']],
    meta: {
      family: 'E', name: 'Slit-scan', sub: 'Time Smeared into Space', era: '1968 —',
      origin: 'A camera photographs artwork through a narrow moving slit during one long exposure per frame, so each part of the image records a different moment. John Whitney explored it in the early 1960s; Douglas Trumbull built a slit-scan machine for the Stargate sequence of Kubrick\'s 2001: A Space Odyssey (1968). Bernard Lodge used it for Doctor Who\'s 1973 time tunnel, and digital "time-slice" video revived it by giving every row or column of pixels its own timestamp.',
      works: '2001: A Space Odyssey — Stargate sequence (Douglas Trumbull, 1968) · Doctor Who title sequence (Bernard Lodge, 1973) · Star Trek: The Next Generation warp effect (1987) · Golan Levin, An Informal Catalogue of Slit-Scan Video Artworks (2005—) · Adam Magyar, Urban Flow (slit-scan photography, 2000s)',
      tech: ['Moving slit + long exposure', 'Per-pixel depth mapping (z = f / d)', 'Corridor-to-tunnel morph', 'Column time-slice'],
      accent: '#ff7a1a',
      motionDNA: 'Relentless forward rush: streaks of light pour out of a dark horizon toward the camera on two planes, colour shifts in sudden waves, the planes rotate and fold into a spinning tunnel; then time itself is sliced column by column.',
      visualDNA: 'Saturated backlit colour streaks on black, compressed to a thin dark horizon and smeared toward the frame edges, with chromatic washes swapping from amber and magenta to cyan, violet, red and green.',
      transitions: 'Slit opening, plane rotation, corridor-to-tunnel fold, white-out flash, slit wipe (time-slice exposure)',
      implementation: ['Slit-scan rig on animation stand', 'After Effects Time Displacement', 'TouchDesigner', 'Canvas 2D (per-pixel ImageData)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const bc = offscreen(SS_BW, SS_BH), bg = bc.getContext('2d'), bl = offscreen(240, 135), bm = offscreen(480, 270);
      return { art: ssArtwork(), bc, bg, img: bg.createImageData(SS_BW, SS_BH), bl, blg: bl.getContext('2d'), bm, bmg: bm.getContext('2d'), title: null };
    },
    draw(c, t, W, H, st) {
      const T = SS_T;
      ssRender(st, t);
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(st.bc, 0, 0, W, H);
      // bloom: two downsampled copies added back
      st.bmg.drawImage(st.bc, 0, 0, 480, 270); st.blg.drawImage(st.bm, 0, 0, 240, 135);
      c.save(); c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.45; c.drawImage(st.bm, 0, 0, W, H);
      c.globalAlpha = 0.55; c.drawImage(st.bl, 0, 0, W, H);
      c.restore();
      // opening caption under the slit
      const ca = seg(t, 0.5, 0.9) * (1 - seg(t, 1.9, 2.3));
      if (ca > 0) text(c, 'ONE  SLIT  ·  ONE  LONG  EXPOSURE  PER  FRAME', 960, 600, { font: JOST, weight: 400, size: 22, align: 'center', ls: 9, color: `rgba(255,236,210,${ca * 0.8})` });
      // flash out of the tunnel
      const fl = t > T.flash - 0.25 ? Math.exp(-Math.max(0, t - T.flash) * 4.5) * seg(t, T.flash - 0.25, T.flash) : 0;
      if (fl > 0) {
        const rg = c.createRadialGradient(960, 540, 0, 960, 540, 1100);
        rg.addColorStop(0, `rgba(255,255,255,${fl})`); rg.addColorStop(0.5, `rgba(255,240,220,${fl * 0.85})`); rg.addColorStop(1, `rgba(255,220,200,${fl * 0.6})`);
        c.fillStyle = rg; c.fillRect(0, 0, W, H);
      }
      // the title, exposed column by column by a moving slit; each column keeps the moment it was scanned
      if (t > T.scan1) {
        if (!st.title) {
          const tc = offscreen(1700, 300), g = tc.getContext('2d');
          text(g, 'SLIT-SCAN', 850, 220, { font: JOST, weight: 300, size: 200, align: 'center', ls: 46, color: '#fff6ea' });
          st.title = tc;
        }
        const TI = st.title, tw = TI.width, th = TI.height, x0 = 960 - tw / 2, ty = 520, SW = 4;
        c.save();
        c.shadowColor = 'rgba(255,170,90,0.6)'; c.shadowBlur = 18 * c.getTransform().a;
        for (let x = Math.max(0, Math.floor(x0)); x < x0 + tw; x += SW) {
          const u = (x - x0) / tw, t1 = T.scan1 + u * 0.85, t2 = T.scan2 + u * 0.45;
          const tau = t >= t2 ? t2 : t >= t1 ? t1 : null;
          if (tau === null) continue;
          const s = ssSrc(tau), hh = th * s.sy;
          c.drawImage(TI, x - x0, 0, SW, th, x, ty + s.oy - hh * (220 / th) + (hh - th) * 0, SW, hh);
        }
        c.restore();
        // the scanning slit
        [[T.scan1, 0.85], [T.scan2, 0.45]].forEach(([s0, dur]) => {
          const u = (t - s0) / dur; if (u < 0 || u > 1.05) return;
          const x = x0 + u * tw, a = 1 - seg(u, 0.9, 1.05);
          const lg = c.createLinearGradient(x - 40, 0, x + 40, 0);
          lg.addColorStop(0, 'rgba(255,200,140,0)'); lg.addColorStop(0.5, `rgba(255,250,235,${0.95 * a})`); lg.addColorStop(1, 'rgba(255,200,140,0)');
          c.fillStyle = lg; c.fillRect(x - 40, 300, 80, 480);
          c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(x - 1.5, 330, 3, 420);
        });
        const sa = E.outC(seg(t, T.sub, T.sub + 0.45));
        if (sa > 0) {
          text(c, 'DOUGLAS  TRUMBULL   ·   2001: A SPACE ODYSSEY   ·   1968', 960, 648 + (1 - sa) * 10, { font: JOST, weight: 400, size: 24, align: 'center', ls: 8, color: `rgba(255,232,205,${sa * 0.9})` });
          c.fillStyle = `rgba(255,232,205,${sa * 0.5})`; c.fillRect(960 - 260 * sa, 610, 520 * sa, 1.5);
        }
      }
      grain(c, W, H, t, 0.05, 'screen');
      vignette(c, W, H, 0.45);
    },
    score(A) {
      A.bus.gain.value = 0.8;
      // a Ligeti-like micropolyphonic cluster that thickens across the whole ride
      const r = rng(68);
      for (let k = 0; k < 22; k++) {
        const m = 52 + r() * 26, t0 = 0.2 + (k / 22) * 5.5, dur = SS_T.flash - t0 + 0.05;
        A.osc(t0, { type: k % 3 ? 'sine' : 'sawtooth', f: midi(m), dur, g: k % 3 ? 0.018 : 0.006, lp: 1800, a: dur * 0.6, hold: true, rel: 0.05, vib: [3 + r() * 3, 3 + r() * 5], rev: 0.6, pan: (r() - 0.5) * 1.6 });
      }
      for (let k = 0; k < 10; k++) A.osc(0.3 + k * 0.4, { f: midi(31 + (k % 2) * 0.3), dur: SS_T.flash - 0.3 - k * 0.4, g: 0.02, a: 2, hold: true, rel: 0.05 });
      // the slit: a thin high whistle
      A.osc(SS_T.slit, { f: 2400, f2: 3600, glide: 2.2, dur: 2.3, g: 0.025, a: 0.4, hold: true, rel: 0.4, vib: [7, 8], rev: 0.5 });
      // the corridor opens
      A.whoosh(SS_T.open, 1.3, { f1: 200, f2: 5000, g: 0.16, swell: 0.85, rev: 0.5 });
      A.impact(SS_T.full, 0.45, { rev: 0.7 });
      // rushing air that never stops, with speed surges
      A.noise(SS_T.full, { type: 'bandpass', f: 500, f2: 3000, sweep: 5.5, q: 0.6, dur: 5.5, g: 0.07, swell: 0.7, rev: 0.3 });
      [SS_T.cool, SS_T.rot, SS_T.vert, SS_T.tun, SS_T.round].forEach((t, i) => { A.whoosh(t - 0.2, 0.7, { f1: 300 + i * 100, f2: 4000, g: 0.12, pan: (i % 2 ? 0.5 : -0.5) }); A.osc(t, { f: midi(38 + i * 2), f2: midi(26 + i * 2), glide: 0.8, dur: 1, g: 0.12, type: 'triangle' }); });
      // the tunnel: a pulsing electronic bass in triplets
      for (let k = 0; k < 18; k++) { const t = SS_T.tun + k * (1 / 6); if (t > SS_T.flash - 0.1) break; A.osc(t, { type: 'sawtooth', f: midi(k % 3 === 0 ? 33 : 40), dur: 0.15, g: 0.12, lp: 600, lp2: 200, lpT: 0.12 }); }
      A.osc(SS_T.tun, { type: 'square', f: midi(69), f2: midi(81), glide: 1.3, dur: 1.3, g: 0.02, lp: 2500, vib: [6, 12], rev: 0.5 });
      // white-out
      A.riser(SS_T.round - 0.3, 1.0, { g: 0.18, f: 110 });
      A.impact(SS_T.flash, 0.9, { rev: 0.8 });
      A.noise(SS_T.flash, { type: 'highpass', f: 3000, dur: 2.0, g: 0.1, rev: 0.8 });
      // the two scans: bright zaps sweeping across the stereo field
      [[SS_T.scan1, 0.85], [SS_T.scan2, 0.45]].forEach(([t, d], i) => { A.osc(t, { type: 'sawtooth', f: 300 + i * 200, f2: 2400, glide: d, dur: d, g: 0.04, lp: 3000, hold: true, rel: 0.1 }); A.noise(t, { type: 'bandpass', f: 1500, f2: 6000, sweep: d, q: 3, dur: d, g: 0.05, hold: true, rel: 0.1 }); });
      // resolution: an open fifth and a bell
      A.chord(SS_T.scan2 + 0.45, [38, 45, 57, 64, 69], { type: 'sine', dur: 1.2, g: 0.05, a: 0.1, hold: true, rel: 0.6, rev: 0.6, width: 0.8 });
      A.bell(SS_T.sub, midi(81), { g: 0.04, dur: 2, rev: 0.7 });
    },
  });

  /* =====================================================================
     RAYMARCHING — a sphere is sphere-traced out of nothing (seen first as
     step counts and normals), buds off smooth-min blobs and a torus, is
     repeated to infinity, twisted at the climax, and gathered back into a
     single sculpture lit by a low sun beside the title
     ===================================================================== */
  const RM_W = 480, RM_H = 270, RM_MAX = 96;
  const RM_T = { heat: 0.0, nrm: 0.7, lit: 1.25, bud: 1.7, torus: 2.9, rep: 4.3, lane: 5.4, twist: 6.8, gather: 8.0, title: 8.35 };
  // Scene parameters, set once per frame (module-level for speed inside the per-pixel loops).
  let R0 = 0.75, C0y = 1.15, OR = 0.36, NO = 0, TRr = 0, TRm = 0.11, cT = 1, sT = 0, K = 0.5, REP = 1000, TW = 0, BOUND = 1;
  const OP = new Float64Array(9);
  const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
  function rmSculpt(x, y, z) {
    const dy = y - C0y;
    let d = Math.sqrt(x * x + dy * dy + z * z) - R0;
    if (NO > 0.001) for (let i = 0; i < 3; i++) { const ox = x - OP[i * 3], oy = y - OP[i * 3 + 1], oz = z - OP[i * 3 + 2]; d = smin(d, Math.sqrt(ox * ox + oy * oy + oz * oz) - OR, K); }
    if (TRr > 0.01) { const ty = dy * cT - z * sT, tz = dy * sT + z * cT, q = Math.sqrt(x * x + tz * tz) - TRr; d = smin(d, Math.sqrt(q * q + ty * ty) - TRm, K * 0.8); }
    return d;
  }
  // Domain repetition and twist in front of the sculpture; floor plane y = 0 joined by a hard min.
  let QX = 0, QY = 0, QZ = 0;
  function rmLocal(x, y, z) {
    let qx = x, qz = z;
    if (REP < 300) { qx = x - REP * Math.round(x / REP); qz = z - REP * Math.round(z / REP); }
    if (TW !== 0) { const a = (y - C0y) * TW, ca = Math.cos(a), sa = Math.sin(a), tx = qx * ca - qz * sa; qz = qx * sa + qz * ca; qx = tx; }
    QX = qx; QY = y; QZ = qz;
  }
  function rmMap(x, y, z) {
    rmLocal(x, y, z);
    const by = QY - C0y, bd = Math.sqrt(QX * QX + by * by + QZ * QZ) - BOUND;
    const ds = bd > 0.25 ? (REP < 300 ? Math.min(bd, REP * 0.5 - BOUND * 0.2) : bd) : rmSculpt(QX, QY, QZ);
    return ds < y ? ds : y;
  }
  function rmSet(t) {
    const T = RM_T;
    R0 = 0.75 * E.outB(seg(t, 0.05, 0.55));
    C0y = 1.15 + 0.07 * Math.sin(t * 1.7);
    NO = 1.12 * E.outC(seg(t, T.bud, T.bud + 0.9)) * (1 - 0.15 * E.ioS(seg(t, T.twist, T.twist + 0.6)));
    OR = 0.36;
    const oa = t * 1.25 + 2.2 * E.ioS(seg(t, T.twist - 0.2, T.gather + 0.3)) * 1.5;
    for (let i = 0; i < 3; i++) { const a = oa + i * TAU / 3; OP[i * 3] = Math.cos(a) * NO; OP[i * 3 + 1] = C0y + 0.32 * Math.sin(t * 1.9 + i * 2.1); OP[i * 3 + 2] = Math.sin(a) * NO; }
    TRr = 1.28 * E.outB(seg(t, T.torus, T.torus + 0.7), 1.4); TRm = 0.11;
    const tilt = 0.55 + 0.25 * Math.sin(t * 0.9); cT = Math.cos(tilt); sT = Math.sin(tilt);
    K = 0.5 + 0.12 * Math.sin(t * PI * 2) * seg(t, T.bud, T.bud + 1) + 0.45 * Math.sin(seg(t, T.twist, T.gather + 0.4) * PI);
    const rin = E.ioC(seg(t, T.rep, T.lane)), rout = E.inC(seg(t, T.gather, T.gather + 1.0));
    REP = t < T.rep ? 1000 : rout >= 1 ? 1000 : Math.exp(lerp(Math.log(70), Math.log(5.5), rin) + Math.log(70 / 5.5) * rout);
    TW = 1.1 * Math.sin(seg(t, T.twist, T.gather + 0.5) * PI) * (t > T.twist ? 1 : 0);
    BOUND = Math.max(R0, NO + OR, TRr + TRm) + 0.12 + Math.abs(TW) * 0.05;
  }
  // Camera keys: ro and target, each [t, x, y, z].
  const RM_CAM = [
    [0, [0, 1.3, -4.0], [0, 1.05, 0]],
    [1.6, [0.5, 1.35, -3.9], [0, 1.1, 0]],
    [2.9, [2.6, 1.8, -3.5], [0, 1.1, 0]],
    [4.2, [3.9, 1.6, -1.2], [0, 1.0, 0]],
    [5.4, [3.0, 5.2, -9.5], [0.4, 0.6, 0], E.ioC],
    [5.42, [2.75, 1.25, -9.0], [2.35, 1.1, -5.0], E.ioC],
    [6.8, [2.75, 1.25, 2.0], [2.35, 1.1, 6.0], E.lin],
    [7.7, [4.4, 3.4, -2.6], [0, 1.2, 0], E.ioC],
    [8.7, [3.3, 1.65, -4.4], [2.5, 1.0, 0.2], E.ioC],
    [10, [3.5, 1.6, -4.7], [2.6, 1.0, 0.2], E.ioS],
  ];
  function rmCam(t) {
    const K = RM_CAM;
    let i = 1; while (i < K.length - 1 && t > K[i][0]) i++;
    const a = K[i - 1], b = K[i], u = (b[3] || E.ioC)(seg(t, a[0], b[0]));
    // the 5.4 → 5.42 key is a hard cut: hold the lane camera from 5.4 onward
    return { ro: a[1].map((v, j) => lerp(v, b[1][j], u)), ta: a[2].map((v, j) => lerp(v, b[2][j], u)) };
  }
  // Sky colour for a ray direction, from day to sunset.
  function rmSky(dx, dy, dz, S, out) {
    const h = clamp(dy * 1.4 + 0.12), sd = Math.max(0, dx * S.L[0] + dy * S.L[1] + dz * S.L[2]);
    const sun = Math.pow(sd, 400) * 8 + Math.pow(sd, 12) * 0.5;
    out[0] = lerp(S.hz[0], S.zn[0], h) + S.sc[0] * sun; out[1] = lerp(S.hz[1], S.zn[1], h) + S.sc[1] * sun; out[2] = lerp(S.hz[2], S.zn[2], h) + S.sc[2] * sun;
  }
  function rmRender(st, t) {
    rmSet(t);
    const T = RM_T, cam = rmCam(t), ro = cam.ro, ta = cam.ta;
    let wx = ta[0] - ro[0], wy = ta[1] - ro[1], wz = ta[2] - ro[2]; const wl = Math.hypot(wx, wy, wz); wx /= wl; wy /= wl; wz /= wl;
    let ux = -wz, uz = wx; const ul = Math.hypot(ux, uz); ux /= ul; uz /= ul;
    const vx = -uz * wy, vy = uz * wx - ux * wz, vz = ux * wy;
    const fl = 1.9;
    // light: noon → low golden sun
    const sun = E.ioS(seg(t, T.twist - 0.4, T.gather + 0.6));
    let Lx = lerp(0.5, 0.75, sun), Ly = lerp(0.72, 0.3, sun), Lz = lerp(-0.45, -0.55, sun); const ll = Math.hypot(Lx, Ly, Lz); Lx /= ll; Ly /= ll; Lz /= ll;
    const S = {
      L: [Lx, Ly, Lz],
      hz: [lerp(0.62, 1.0, sun), lerp(0.74, 0.55, sun), lerp(0.9, 0.38, sun)], zn: [lerp(0.2, 0.22, sun), lerp(0.38, 0.16, sun), lerp(0.75, 0.42, sun)],
      sc: [lerp(1.0, 1.0, sun), lerp(0.92, 0.6, sun), lerp(0.8, 0.3, sun)],
      sunC: [lerp(1.35, 1.6, sun), lerp(1.25, 0.95, sun), lerp(1.1, 0.55, sun)], skyC: [lerp(0.35, 0.4, sun), lerp(0.48, 0.3, sun), lerp(0.75, 0.5, sun)],
    };
    const irid = Math.sin(seg(t, T.twist - 0.2, T.gather + 0.8) * PI);
    const sweep1 = E.ioS(seg(t, T.nrm - 0.1, T.nrm + 0.45)) * 1.1 - 0.05, sweep2 = E.ioS(seg(t, T.lit - 0.1, T.lit + 0.45)) * 1.1 - 0.05;
    const debug = t < T.lit + 0.5, d8 = st.img.data, sky = [0, 0, 0], stepK = TW !== 0 ? 0.5 : REP < 300 ? 0.85 : 1;
    let o = 0;
    for (let j = 0; j < RM_H; j++) {
      const v = -((2 * (j + 0.5) - RM_H) / RM_H);
      for (let i = 0; i < RM_W; i++, o += 4) {
        const u = (2 * (i + 0.5) - RM_W) / RM_H;
        let dx = u * ux + v * vx + fl * wx, dy = v * vy + fl * wy, dz = u * uz + v * vz + fl * wz; const dl = Math.hypot(dx, dy, dz); dx /= dl; dy /= dl; dz /= dl;
        // which view: step-count heatmap → normals → lit
        const xf = i / RM_W, mode = !debug ? 2 : xf < sweep2 ? 2 : xf < sweep1 ? 1 : 0;
        // sphere tracing
        let tt = 0.02, hit = false, n = 0, tmax = 70;
        for (; n < RM_MAX; n++) {
          const h = rmMap(ro[0] + dx * tt, ro[1] + dy * tt, ro[2] + dz * tt);
          if (h < 0.0006 * tt + 0.0004) { hit = true; break; }
          tt += h * stepK; if (tt > tmax) break;
        }
        let r, g, b;
        if (mode === 0) {
          const s = n / RM_MAX, q = Math.pow(s, 0.6);
          r = clamp(q * 2.4 - 0.25); g = clamp(q * 2.2 - 0.95); b = clamp(0.35 + Math.sin(q * PI) * 0.6 - q * 0.3);
          r = r * r; g = g * g; b = b * b;
        } else if (!hit) {
          rmSky(dx, dy, dz, S, sky); r = sky[0]; g = sky[1]; b = sky[2];
          if (mode === 1) { r = 0.04; g = 0.04; b = 0.06; }
        } else {
          const px = ro[0] + dx * tt, py = ro[1] + dy * tt, pz = ro[2] + dz * tt, e = 0.0015;
          const a1 = rmMap(px + e, py - e, pz - e), a2 = rmMap(px - e, py - e, pz + e), a3 = rmMap(px - e, py + e, pz - e), a4 = rmMap(px + e, py + e, pz + e);
          let nx = a1 - a2 - a3 + a4, ny = -a1 - a2 + a3 + a4, nz = -a1 + a2 - a3 + a4; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          if (mode === 1) { r = (nx * 0.5 + 0.5) ** 2; g = (ny * 0.5 + 0.5) ** 2; b = (nz * 0.5 + 0.5) ** 2; }
          else {
            // material: checker floor or the blended sculpture
            rmLocal(px, py, pz);
            const qx = QX, qy = QY, qz = QZ, sd = rmSculpt(qx, qy, qz), floor = py < sd;
            let ar, ag, ab;
            if (floor) {
              const ch = (Math.floor(px * 1.0) + Math.floor(pz * 1.0)) & 1, fx = Math.abs(px - Math.round(px)), fz = Math.abs(pz - Math.round(pz)), line = Math.min(fx, fz) < 0.012 ? 0.75 : 1;
              ar = (ch ? 0.62 : 0.42) * line; ag = (ch ? 0.6 : 0.4) * line; ab = (ch ? 0.58 : 0.42) * line;
            } else {
              const dy0 = qy - C0y, d0 = Math.max(0, Math.sqrt(qx * qx + dy0 * dy0 + qz * qz) - R0);
              let d1 = 9; for (let k = 0; k < 3; k++) { const ox = qx - OP[k * 3], oy = qy - OP[k * 3 + 1], oz = qz - OP[k * 3 + 2]; d1 = Math.min(d1, Math.max(0, Math.sqrt(ox * ox + oy * oy + oz * oz) - OR)); }
              let d2 = 9; if (TRr > 0.01) { const ty = dy0 * cT - qz * sT, tz2 = dy0 * sT + qz * cT, q = Math.sqrt(qx * qx + tz2 * tz2) - TRr; d2 = Math.max(0, Math.sqrt(q * q + ty * ty) - TRm); }
              const w0 = Math.exp(-d0 * 9), w1 = NO > 0.001 ? Math.exp(-d1 * 9) : 0, w2 = Math.exp(-d2 * 9), ws = w0 + w1 + w2 + 1e-6;
              ar = (w0 * 0.92 + w1 * 0.08 + w2 * 0.95) / ws; ag = (w0 * 0.3 + w1 * 0.55 + w2 * 0.68) / ws; ab = (w0 * 0.18 + w1 * 0.62 + w2 * 0.16) / ws;
              if (irid > 0) {
                const ph = ny * 0.6 + qy * 0.35 + t * 0.35;
                ar = lerp(ar, 0.5 + 0.5 * Math.cos(TAU * (ph + 0.0)), irid * 0.8); ag = lerp(ag, 0.5 + 0.5 * Math.cos(TAU * (ph + 0.33)), irid * 0.8); ab = lerp(ab, 0.5 + 0.5 * Math.cos(TAU * (ph + 0.67)), irid * 0.8);
              }
              ar *= ar; ag *= ag; ab *= ab;
            }
            // soft shadow toward the sun (IQ's k·h/t penumbra)
            let dif = nx * Lx + ny * Ly + nz * Lz, sh = 0;
            if (dif > 0) {
              sh = 1; let st2 = 0.03;
              for (let k = 0; k < 28 && st2 < 12; k++) {
                const h = rmMap(px + nx * 0.004 + Lx * st2, py + ny * 0.004 + Ly * st2, pz + nz * 0.004 + Lz * st2);
                sh = Math.min(sh, 9 * h / st2); if (sh < 0.004) break; st2 += clamp(h, 0.03, 0.5);
              }
              sh = clamp(sh); sh = sh * sh * (3 - 2 * sh);
            } else dif = 0;
            // ambient occlusion from 4 samples along the normal
            let occ = 0, sca = 1;
            for (let k = 1; k <= 4; k++) { const hr = 0.03 + 0.11 * k; occ += (hr - rmMap(px + nx * hr, py + ny * hr, pz + nz * hr)) * sca; sca *= 0.8; }
            occ = clamp(1 - 1.6 * occ);
            const skyL = 0.5 + 0.5 * ny, bou = clamp(-ny) * 0.3 + clamp(0.5 - ny * 0.5) * 0.1;
            let hx = Lx - dx, hy = Ly - dy, hz = Lz - dz; const hl = Math.hypot(hx, hy, hz); hx /= hl; hy /= hl; hz /= hl;
            const fre = Math.pow(clamp(1 + dx * nx + dy * ny + dz * nz), 5);
            const spe = Math.pow(clamp(nx * hx + ny * hy + nz * hz), floor ? 16 : 48) * dif * sh * (0.04 + 0.96 * fre) * (floor ? 0.4 : 2.5);
            r = ar * (S.sunC[0] * dif * sh * 1.6 + S.skyC[0] * skyL * occ * 0.9 + ar * bou * occ) + spe * S.sunC[0] + fre * occ * 0.12 * S.skyC[0] * (floor ? 0 : 1);
            g = ag * (S.sunC[1] * dif * sh * 1.6 + S.skyC[1] * skyL * occ * 0.9 + ag * bou * occ) + spe * S.sunC[1] + fre * occ * 0.12 * S.skyC[1] * (floor ? 0 : 1);
            b = ab * (S.sunC[2] * dif * sh * 1.6 + S.skyC[2] * skyL * occ * 0.9 + ab * bou * occ) + spe * S.sunC[2] + fre * occ * 0.12 * S.skyC[2] * (floor ? 0 : 1);
            // distance fog into the sky colour
            rmSky(dx, dy, dz, S, sky);
            const fo = 1 - Math.exp(-0.0016 * tt * tt);
            r = lerp(r, sky[0], fo); g = lerp(g, sky[1], fo); b = lerp(b, sky[2], fo);
          }
        }
        // filmic-ish tone curve and gamma
        r = r / (1 + r * 0.25); g = g / (1 + g * 0.25); b = b / (1 + b * 0.25);
        d8[o] = 255 * Math.pow(clamp(r), 0.4545); d8[o + 1] = 255 * Math.pow(clamp(g), 0.4545); d8[o + 2] = 255 * Math.pow(clamp(b), 0.4545); d8[o + 3] = 255;
      }
    }
    st.rg.putImageData(st.img, 0, 0);
    return { sweep1, sweep2, debug };
  }
  // GLSL snippets typed into the corner, one per act.
  const RM_CODE = [
    [0.15, ['float sdSphere(vec3 p, float r) {', '  return length(p) - r;', '}']],
    [RM_T.bud, ['float smin(float a, float b, float k) {', '  float h = max(k - abs(a - b), 0.0) / k;', '  return min(a, b) - h * h * k * 0.25;', '}']],
    [RM_T.torus, ['float sdTorus(vec3 p, vec2 t) {', '  vec2 q = vec2(length(p.xz) - t.x, p.y);', '  return length(q) - t.y;', '}']],
    [RM_T.rep, ['vec3 opRep(vec3 p, float s) {', '  p.xz -= s * round(p.xz / s);', '  return p;', '}']],
    [RM_T.twist, ['p.xz *= rot(p.y * twist);', 'd = smin(d, sdTorus(p, tr), k);']],
    [RM_T.gather + 0.2, ['for (int i = 0; i < 96; i++) {', '  float d = map(ro + rd * t);', '  if (d < 0.001 * t) break;', '  t += d;', '}']],
  ];
  const GLSL_KW = /^(float|vec2|vec3|return|for|int|if|break|in|out)$/;
  function codeLine(c, s, x, y, n, size) {
    const toks = s.match(/\s+|[A-Za-z_]\w*|\d+\.?\d*|./g) || [];
    let left = n;
    c.font = `400 ${size}px ${JBM}`;
    toks.forEach((tk, i) => {
      if (left <= 0) return;
      const part = tk.slice(0, left); left -= tk.length;
      const next = toks[i + 1];
      c.fillStyle = GLSL_KW.test(tk) ? '#ff7ac6' : /^\d/.test(tk) ? '#ffb86c' : /^[A-Za-z_]/.test(tk) && next === '(' ? '#7fe0ff' : /^[A-Za-z_]/.test(tk) ? '#f1f1f4' : '#a9a7c0';
      c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillText(part, x, y);
      x += c.measureText(tk).width;
    });
  }

  MG.film({
    id: 'raymarch', dur: 10, poster: 9.5,
    fonts: [['800 120px "JetBrains Mono"', 'Raymarching'], ['400 24px "JetBrains Mono"', 'float sdSphere(vec3 p) {}; *+-/<>'], ['700 20px "JetBrains Mono"', 'SPHERE TRACING · iTime']],
    meta: {
      family: 'E', name: 'Raymarching', sub: 'Signed Distance Fields', era: '1989 — / 2008 —',
      origin: 'Instead of polygons, the scene is a single function returning the distance to the nearest surface; each pixel\'s ray steps forward by that distance until it touches something (John C. Hart\'s "sphere tracing", 1989/1996). The 4k-intro demoscene adopted it around 2008 (Iñigo Quilez\'s "Rendering Worlds with Two Triangles", Function 2008) and Shadertoy (Quilez & Pol Jeremias, 2013) made smooth-min blobs, soft shadows, AO and infinite repetition a shared visual language.',
      works: 'Iñigo Quilez / RGBA — Elevated (4k intro, Breakpoint 2009) · Iñigo Quilez, "Rendering Worlds with Two Triangles" (2008) · Shadertoy (2013 —) · Mercury — hg_sdf library & demos (2010s) · Media Molecule, Dreams (SDF sculpting, 2020)',
      tech: ['Sphere tracing a signed distance field', 'Polynomial smooth-min blending', 'Soft shadows (k·h/t) + 4-tap AO', 'Domain repetition & twist'],
      accent: '#ff7a4a',
      motionDNA: 'Shapes are equations, so they melt into each other instead of colliding: blobs bud off and re-merge, a torus grows through them, space itself is repeated and twisted while the camera glides like a demo fly-through.',
      visualDNA: 'Perfectly smooth glossy primitives fused by soft fillets, a checkerboard floor with soft penumbrae and ambient occlusion, fog fading copies into a gradient sky — the canonical Shadertoy look, introduced through step-count and normal debug views.',
      transitions: 'Debug-view wipes (iterations → normals → lit), smooth-min budding, repetition reveal, twist, gather-back',
      implementation: ['GLSL fragment shader (Shadertoy)', 'Demoscene 4k intros', 'TouchDesigner / Unity shaders', 'Canvas 2D (per-pixel CPU march, 480×270)'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const rc = offscreen(RM_W, RM_H), rg = rc.getContext('2d');
      return { rc, rg, img: rg.createImageData(RM_W, RM_H) };
    },
    draw(c, t, W, H, st) {
      const T = RM_T, info = rmRender(st, t);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(st.rc, 0, 0, W, H);
      // debug-view wipe lines
      if (info.debug) [info.sweep1, info.sweep2].forEach(s => {
        if (s <= 0 || s >= 1) return;
        const x = s * W; c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(x - 1.5, 0, 3, H);
        const lg = c.createLinearGradient(x - 30, 0, x + 30, 0); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.25)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = lg; c.fillRect(x - 30, 0, 60, H);
      });
      vignette(c, W, H, 0.35, '10,8,20');
      // HUD
      const mode = t < T.nrm + 0.2 ? 'ITERATIONS' : t < T.lit + 0.2 ? 'NORMALS' : 'SHADED';
      const ha = seg(t, 0.1, 0.4) * (1 - seg(t, T.gather, T.gather + 0.4));
      if (ha > 0) {
        c.save(); c.globalAlpha = ha;
        c.fillStyle = 'rgba(12,10,22,0.55)'; MG.rrect(c, 48, 44, 560, 46, 10); c.fill();
        text(c, `SPHERE TRACING · ${RM_W}×${RM_H} · ≤${RM_MAX} STEPS`, 68, 75, { font: JBM, weight: 700, size: 19, color: '#e9e6ff', ls: 1 });
        c.fillStyle = 'rgba(12,10,22,0.55)'; MG.rrect(c, W - 330, 44, 282, 46, 10); c.fill();
        text(c, `iTime ${t.toFixed(2)}`, W - 310, 75, { font: JBM, weight: 700, size: 19, color: '#7fe0ff', ls: 1 });
        text(c, mode, W - 68, 75, { font: JBM, weight: 700, size: 19, color: '#ffb86c', align: 'right', ls: 1 });
        c.restore();
      }
      // code panel, typed
      let cur = RM_CODE[0];
      RM_CODE.forEach(k => { if (t >= k[0]) cur = k; });
      if (t >= RM_CODE[0][0]) {
        const lines = cur[1], fin = t >= T.gather + 0.2, size = fin ? 24 : 23, lh = size * 1.45;
        const pw = Math.max(...lines.map(l => l.length)) * size * 0.6 + 56, ph = lines.length * lh + 36;
        const px = fin ? 110 : 48, py = fin ? 690 : H - 44 - ph;
        const n = Math.floor((t - cur[0]) * 75), ap = seg(t, cur[0], cur[0] + 0.15);
        c.save(); c.globalAlpha = ap;
        c.fillStyle = 'rgba(12,10,22,0.62)'; MG.rrect(c, px, py, pw, ph, 12); c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 1.5; c.stroke();
        let left = n;
        lines.forEach((ln, i) => { codeLine(c, ln, px + 28, py + 18 + size + i * lh, left, size); left -= ln.length; });
        const li = Math.min(lines.length - 1, lines.findIndex((l, i) => lines.slice(0, i + 1).join('').length >= n));
        if (Math.floor(t * 2.5) % 2 === 0 || n < lines.join('').length) {
          const ln = lines[li < 0 ? lines.length - 1 : li], prev = lines.slice(0, li < 0 ? lines.length - 1 : li).join('').length, cx = px + 28 + c.measureText(ln.slice(0, Math.max(0, Math.min(ln.length, n - prev)))).width;
          c.fillStyle = '#ffb86c'; c.fillRect(cx + 2, py + 18 + (li < 0 ? lines.length - 1 : li) * lh + 4, size * 0.55, size * 1.05);
        }
        c.restore();
      }
      // title
      const ti = E.outC(seg(t, T.title, T.title + 0.6));
      if (ti > 0) {
        c.save();
        c.shadowColor = 'rgba(20,8,30,0.55)'; c.shadowBlur = 24 * c.getTransform().a;
        const word = 'Raymarching', n = Math.min(word.length, Math.floor((t - T.title) * 26) + 1);
        text(c, word.slice(0, n), 104, 520, { font: JBM, weight: 800, size: 124, color: `rgba(255,248,240,${ti})`, ls: -3 });
        if (n < word.length || Math.floor(t * 2.5) % 2 === 0) { c.font = `800 124px ${JBM}`; c.fillStyle = `rgba(255,184,108,${ti})`; c.fillRect(104 + c.measureText(word.slice(0, n)).width - 3 * n + 10, 420, 16, 112); }
        c.restore();
        const sa = E.outC(seg(t, T.title + 0.35, T.title + 0.9));
        text(c, 'SIGNED DISTANCE FIELDS  ·  SPHERE TRACING  ·  SHADERTOY', 110, 584 + (1 - sa) * 10, { font: JBM, weight: 700, size: 22, color: `rgba(255,226,196,${sa * 0.92})`, ls: 3 });
        c.fillStyle = `rgba(255,184,108,${sa})`; c.fillRect(110, 616, 96 * sa, 4);
      }
      grain(c, W, H, t, 0.035);
    },
    score(A) {
      A.bus.gain.value = 0.8;
      const B = 0.5;
      // typing ticks for each snippet
      RM_CODE.forEach(([t0, lines], i) => { const n = lines.join('').length; for (let k = 0; k < n; k += 3) A.noise(t0 + k / 75, { type: 'bandpass', f: 3500 + hash(k + i * 50) * 2500, q: 3, dur: 0.015, g: 0.018 }); });
      // debug-view switches
      [RM_T.nrm, RM_T.lit].forEach((t, i) => { A.osc(t, { type: 'square', f: 880 * (i + 1), dur: 0.08, g: 0.04, lp: 4000 }); A.whoosh(t - 0.1, 0.5, { f1: 800, f2: 5000, g: 0.06 }); });
      A.osc(0.05, { f: 220, f2: 440, glide: 0.5, dur: 0.7, g: 0.08, type: 'triangle' });
      // drone and pad, A minor → F → C → G
      A.osc(0, { type: 'sawtooth', f: midi(33), dur: 10, g: 0.04, lp: 300, a: 1.2, hold: true, rel: 0.6 });
      const pads = [[RM_T.bud - 0.2, [57, 60, 64, 71]], [RM_T.rep, [53, 57, 60, 64]], [RM_T.twist, [48, 55, 60, 64, 67]], [RM_T.gather + 0.2, [55, 59, 62, 67, 74]]];
      pads.forEach(([t, ch], i) => { const end = i < pads.length - 1 ? pads[i + 1][0] : 10; A.chord(t, ch, { type: 'sawtooth', dur: end - t + 0.4, g: 0.016, lp: 1400, a: 0.3, hold: true, rel: 0.4, spread: 8, rev: 0.5, width: 0.9 }); });
      // demoscene arpeggio
      const arp = [[RM_T.bud, [69, 72, 76, 79, 81, 79, 76, 72]], [RM_T.rep, [65, 69, 72, 76, 77, 76, 72, 69]], [RM_T.twist, [60, 64, 67, 72, 76, 79, 76, 72]]];
      arp.forEach(([t0, ns], i) => { const end = i < arp.length - 1 ? arp[i + 1][0] : RM_T.gather; for (let k = 0; t0 + k * B / 4 < end - 0.02; k++) A.osc(t0 + k * B / 4, { type: 'square', f: midi(ns[k % 8]), dur: 0.11, g: 0.022, lp: 2600, lp2: 900, lpT: 0.1, pan: k % 2 ? 0.3 : -0.3, rev: 0.25 }); });
      // groove from the smooth-min onward, four-on-the-floor in the repetition and twist
      for (let k = 4; k < 20; k++) {
        const tb = k * B; if (tb >= RM_T.gather) break;
        if (tb >= RM_T.rep) A.kick(tb, 0.55); else if (k % 2 === 0) A.kick(tb, 0.4);
        A.hat(tb + B / 2, 0.05, false, { pan: 0.25 });
        if (tb >= RM_T.rep && k % 2) A.clap(tb, 0.14);
        if (tb >= RM_T.lane) A.osc(tb + B / 2, { type: 'sawtooth', f: midi(tb >= RM_T.twist ? 36 : 41), dur: 0.22, g: 0.1, lp: 500, lp2: 120, lpT: 0.2 });
      }
      // bud, torus, repetition reveal
      A.osc(RM_T.bud, { f: 300, f2: 900, glide: 0.6, dur: 0.8, g: 0.05, type: 'sine', vib: [7, 15], rev: 0.4 });
      A.whoosh(RM_T.torus, 0.8, { f1: 300, f2: 2500, g: 0.08 });
      A.riser(RM_T.rep - 0.1, 1.2, { g: 0.1, f: 110 });
      A.impact(RM_T.lane, 0.4);
      A.riser(RM_T.twist - 1.2, 1.2, { g: 0.14, f: 82 });
      // twist: impact, a detuned sweep
      A.impact(RM_T.twist, 0.8);
      A.osc(RM_T.twist, { type: 'sawtooth', f: 110, f2: 55, glide: 1.2, dur: 1.2, g: 0.06, lp: 2000, lp2: 300, lpT: 1.2, vib: [5, 8] });
      // gather: reversed swell, then resolution
      A.whoosh(RM_T.gather - 0.3, 1.0, { f1: 4000, f2: 300, g: 0.1 });
      A.kick(RM_T.title, 0.5, { f: 90, f2: 35, dur: 0.8 });
      A.bell(RM_T.title, midi(79), { g: 0.06, dur: 2.2, rev: 0.6 });
      A.bell(RM_T.title + 0.4, midi(83), { g: 0.04, dur: 2, rev: 0.6 });
      for (let k = 0; k < 11; k++) A.osc(RM_T.title + k / 26, { type: 'square', f: 1200 + hash(k) * 600, dur: 0.02, g: 0.015, lp: 5000 });
    },
  });
})();
