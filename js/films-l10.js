/* batch l10 — Rendering Looks · Image: lookanamorphic · lookhalftone · lookinfrared.
   lookanamorphic (a 2× anamorphic lens on a night version of the still life: a hanging practical
   bulb and hot speculars thresholded and smeared into long blue horizontal streaks, vertical
   oval bokeh from background lights, a 2.39:1 letterbox, the squeezed negative and its
   desqueeze, with the threshold and streak passes as insets) ·
   lookhalftone (the render screened for print: four CMYK dot screens at 15°, 75°, 0° and 45°,
   dot area by ink coverage, the screen ruling changed on the beat, the separations, a loupe on
   the rosette, then one ink as AM dots against FM stochastic dots) ·
   lookinfrared (false colour from render data: a thermal look, where a temperature is assigned
   per surface from material, key-light heating and contact, mapped through ironbow, rainbow
   and white-hot palettes with a scale bar, spot meters and an isotherm; then an Aerochrome-
   style infrared colour-film channel swap). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, vnoise, midi, text } = MG;
  const LK = MG.LK, TK = MG.TK, P = LK.P, V = LK.V;

  /* ---------------- shared helpers (same family manner as l5) ---------------- */
  const label = LK.label;
  const PAPER = 'rgba(236,232,223,0.88)', NIGHT = 'rgba(12,12,14,0.74)';
  const tag = (c, s, x, y, o = {}) => {   // accent dot + bold mono label
    c.save(); c.globalAlpha *= o.on ?? 1;
    c.fillStyle = o.accent || P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: o.dark ? P.paper : P.ink, weight: 700, size: 20 });
    c.restore();
  };
  const panel = (c, x, y, w, h, dark) => { c.fillStyle = dark ? NIGHT : PAPER; c.fillRect(x, y, w, h); };
  /* Leader line from a world point to a label: dot on the object, elbow, mono text. */
  function leader(c, S, p, lines, dx, dy, o = {}) {
    const q = LK.project(S, p); if (!q) return;
    if (q[0] + dx + 340 > 1920) dx = -Math.abs(dx);
    if (q[0] + dx - 340 < 0) dx = Math.abs(dx);
    const x1 = q[0] + dx, y1 = q[1] + dy, col = o.dark ? P.paper : P.ink, al = o.on ?? 1;
    if (al <= 0.01) return;
    c.save(); c.globalAlpha *= al;
    c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(x1, y1); c.lineTo(x1 + (dx < 0 ? -26 : 26), y1); c.stroke();
    c.fillStyle = col; c.beginPath(); c.arc(q[0], q[1], 4.5, 0, TAU); c.fill();
    const ax = x1 + (dx < 0 ? -34 : 34), al2 = dx < 0 ? 'right' : 'left';
    lines.forEach((s, i) => {
      const w = s.length * 11.6 + 12;
      panel(c, al2 === 'left' ? ax - 6 : ax - w + 6, y1 - 15 + i * 24, w, 22, o.dark);
      label(c, s, ax, y1 + 1 + i * 24, { size: 15, ls: 2, color: i ? (o.dark ? 'rgba(236,232,223,0.7)' : P.mute) : col, weight: i ? 400 : 700, align: al2 });
    });
    c.restore();
  }
  /* A small inset pass in a frame with a title. */
  function inset(c, cv, x, y, w, h, title, o = {}) {
    const al = o.on ?? 1; if (al <= 0.01) return;
    c.save(); c.globalAlpha *= al;
    panel(c, x - 8, y - 34, w + 16, h + 42, o.dark);
    c.imageSmoothingEnabled = o.smooth !== false; c.drawImage(cv, x, y, w, h);
    c.strokeStyle = o.dark ? 'rgba(236,232,223,0.45)' : 'rgba(23,24,28,0.45)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    label(c, title, x, y - 12, { size: 14, ls: 2, color: o.dark ? P.paper : P.ink, weight: 700 });
    c.restore();
  }
  const surf = {};
  function sheet(key, w, h) {   // cached offscreen + ImageData
    if (!surf[key]) { const cv = MG.offscreen(w, h), cx = cv.getContext('2d'); surf[key] = { cv, cx, img: cx.createImageData(w, h) }; }
    return surf[key];
  }
  const f1 = v => v.toFixed(1), f2 = v => v.toFixed(2);
  const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const BEAT = LK.BEAT, beat = n => n * BEAT;
  // integer hash → 0..1, for per-pixel noise seeded by frame
  function ih(x, y, f) {
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(f, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  // world → Token-local coordinates (transpose of the Token's rotation)
  const tokLocal = (S, p) => { const M = S.tok.M, d = V.sub(p, S.tok.c); return [M[0] * d[0] + M[3] * d[1] + M[6] * d[2], M[1] * d[0] + M[4] * d[1] + M[7] * d[2], M[2] * d[0] + M[5] * d[1] + M[8] * d[2]]; };
  const tokWorld = (S, q) => { const M = S.tok.M; return V.add(S.tok.c, [M[0] * q[0] + M[1] * q[1] + M[2] * q[2], M[3] * q[0] + M[4] * q[1] + M[5] * q[2], M[6] * q[0] + M[7] * q[1] + M[8] * q[2]]); };
  // the kit's plain lighting factor (key with soft shadow, sky fill, AO) without the albedo
  function plainK(g, S) {
    const n = g.n, dif = Math.max(0, V.dot(n, LK.KEY)) * LK.shadow(V.add(g.p, V.mul(n, 0.01)), LK.KEY, S, 12);
    const occ = LK.ao(g.p, n, S), sky = 0.55 + 0.45 * n[1], fill = Math.max(0, V.dot(n, LK.FILL)) * 0.35;
    return 1.05 * dif + (0.42 * sky + fill) * occ;
  }

  /* =====================================================================
     ANAMORPHIC — the lens, not the scene. A 2× anamorphic lens has a
     cylindrical element that squeezes the wide 2.39:1 view to half its
     width on the negative; the projector (or the grade) stretches it back.
     Two artefacts give it away. Bright point sources flare into long thin
     horizontal streaks, light spread sideways by the cylindrical glass;
     here: pixels above a threshold, blurred only along x by a two-sided
     exponential filter, tinted blue and added. And out-of-focus points
     come out as tall ovals rather than circles, because the lens defocuses
     differently across and along the cylinder axis. The still life is lit
     for night — a hanging practical bulb behind it, a hard key, glossy
     speculars — with a string of background lights for the bokeh.
     ===================================================================== */
  const BULB = [2.5, 2.5, -3.8], BULB_R = 0.075, BULB_C = [1.0, 0.8, 0.56];
  const NB0 = [0.010, 0.012, 0.018], NB1 = [0.035, 0.036, 0.045];
  const STREAK = [0.32, 0.55, 1.0];
  const BOKEH = Array.from({ length: 26 }, (_, k) => {
    const warm = hash(k * 9.13) > 0.22;
    return {
      p: [-15.5 + 31 * (k + 0.5) / 26 + (hash(k * 7.1) - 0.5) * 1.1, 0.7 + 2.9 * hash(k * 5.7), -11 - 5.5 * hash(k * 3.3)],
      col: warm ? (hash(k * 2.9) > 0.5 ? [1.0, 0.62, 0.3] : [1.0, 0.8, 0.52]) : [0.45, 0.68, 1.0],
      I: 0.3 + 0.35 * hash(k * 4.4), r: 8 + 5 * hash(k * 6.6),
    };
  });
  const A_SPLIT = [[1.7, 0], [2.5, 0.55, E.ioC], [3.3, 0.55], [3.9, 1, E.ioC]];
  const A_LEN = [[0, 60], [beat(6), 60], [beat(6) + 0.3, 120, E.ioC], [beat(10), 120], [beat(10) + 0.4, 210, E.ioC], [8.7, 210], [9.2, 150, E.ioC]];
  function anaAt(t) {
    return { split: kf(t, A_SPLIT), bars: E.ioC(seg(t, 0.8, 1.6)), th: 0.92, L: kf(t, A_LEN), gain: kf(t, [[1.7, 1], [beat(10), 1], [beat(10) + 0.4, 1.35]]) };
  }
  let aPass = null;

  function nightShade(g, S, B) {
    let c;
    if (!g.hit) c = LK.mix3(NB0, NB1, 1 - smooth(-0.05, 0.35, g.d[1]));
    else {
      const a = LK.albedo(g.id), n = g.n, vd = V.mul(g.d, -1), id = g.id;
      const dif = Math.max(0, V.dot(n, LK.KEY)) * LK.shadow(V.add(g.p, V.mul(n, 0.01)), LK.KEY, S, 14);
      // the key is a spot: a pool of light on the still life, the studio falling to black outside it
      const spot = Math.exp(-(g.p[0] * g.p[0] + (g.p[2] + 0.2) * (g.p[2] + 0.2)) / (2 * 2.4 * 2.4)), fl = id === 0 ? 0.55 : 1;
      const pb = V.sub(BULB, g.p), db = V.len(pb), lb = V.mul(pb, 1 / db), fall = 2.4 / (db * db);
      const bdif = Math.max(0, V.dot(n, lb)) * fall;
      const shin = id === 2 ? 160 : id === 1 ? 70 : id === 3 ? 110 : 28;
      const hv = V.norm(V.add(LK.KEY, vd)), spec = Math.pow(Math.max(0, V.dot(n, hv)), shin) * dif * spot * (id === 2 ? 6 : id === 1 ? 2.2 : id === 3 ? 3.2 : 0.25);
      const hb = V.norm(V.add(lb, vd)), bspec = Math.pow(Math.max(0, V.dot(n, hb)), shin) * fall * (id === 0 ? 1.4 : 3.2);
      const occ = id === 0 ? 1 : LK.ao(g.p, n, S);
      const k = (0.85 * dif * spot + 0.045 * (0.6 + 0.4 * n[1]) * occ) * fl;
      const base = LK.tone([a[0] * k + BULB_C[0] * a[0] * bdif, a[1] * k + BULB_C[1] * a[1] * bdif, a[2] * k + BULB_C[2] * a[2] * bdif], 1.25);
      c = [base[0] + spec * 0.95 + bspec * BULB_C[0], base[1] + spec * 0.97 + bspec * BULB_C[1], base[2] + spec + bspec * BULB_C[2]];
      if (id === 0) c = LK.floorFade(c, g, NB1);
    }
    if (B.vis) {
      const ca = V.dot(g.d, B.dir), a2 = 2 * (1 - ca);
      if (a2 < B.r2 && (!g.hit || g.depth > B.dist)) return [9, 7.6, 5.8];
      const glow = 0.22 * Math.exp(-a2 / 0.0011) + 0.05 * Math.exp(-a2 / 0.02);
      c = [c[0] + glow * BULB_C[0], c[1] + glow * BULB_C[1], c[2] + glow * BULB_C[2]];
    }
    return c;
  }
  function bulbInfo(S) {
    const cp = S.cam.pos, d = V.sub(BULB, cp), dist = V.len(d), dir = V.mul(d, 1 / dist);
    const h = LK.trace(cp, dir, S), r = BULB_R / dist;
    return { dir, dist, vis: !h.hit || h.t > dist, r2: r * r };
  }
  // two-sided exponential blur along one row: out = Σ m[x'] · a^|x − x'|, normalised by (1 − a)
  function expRow(src, dst, o, w, L, tmp) {
    const a = Math.exp(-1 / L), k = 1 - a;
    let s = 0;
    for (let x = 0; x < w; x++) { s = src[o + x] + a * s; tmp[x] = s; }
    s = 0;
    for (let x = w - 1; x >= 0; x--) { s = src[o + x] + a * s; dst[o + x] += (tmp[x] + s - src[o + x]) * k; }
  }

  MG.film({
    id: 'lookanamorphic', dur: 10, poster: 8.2,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Anamorphic Flare', sub: 'Horizontal streaks, oval bokeh, 2.39:1', era: '1953 —',
      origin: 'Anamorphic lenses squeeze a wide image horizontally onto ordinary film and stretch it back in projection. Henri Chrétien’s Hypergonar of the 1920s was the basis of 20th Century Fox’s CinemaScope, launched with The Robe in 1953; Panavision’s anamorphic lenses later became the standard, and the projected 2.39:1 frame the shape of the widescreen epic. The cylindrical optics leave a signature that spherical lenses do not: bright sources flare into long horizontal streaks, often blue, and out-of-focus highlights turn into vertical ovals. Filmmakers came to court those artefacts, and renderers imitate them in post with thresholded, one-directional blurs.',
      works: 'The Robe (Henry Koster, 1953; the first CinemaScope feature) · Close Encounters of the Third Kind (Steven Spielberg, 1977; anamorphic flares from the ship’s lights) · Star Trek (J. J. Abrams, 2009; deliberate blue streak flares)',
      tech: ['Threshold → horizontal exponential blur', 'Vertical oval bokeh (1 : 1.8)', '2× squeeze, 2.39:1 letterbox'],
      accent: '#3d7bff',
      motionDNA: 'The camera makes the shared 50° orbit around a night-lit still life with a practical bulb hanging behind it. The frame closes to a 2.39:1 letterbox, then a wipe swaps the spherical lens for the anamorphic one: round bokeh stretch into tall ovals and the bulb and speculars flare sideways. The streak length steps up on the beat, the threshold and streak passes appear as insets, the squeezed negative and its desqueeze are shown, and the streak runs across the whole frame for the finish.',
      visualDNA: 'Near-black studio, the orange Token and the glossy sphere and cube picked out by a hard key and a warm bulb, a row of amber and blue background lights blown into soft tall ovals; thin electric-blue streaks crossing the frame through every hot point, faint oval ghosts mirrored through the centre; black letterbox bars carrying mono readouts.',
      transitions: 'Letterbox close, then a wipe from spherical to anamorphic lens',
      implementation: ['Lens-flare and anamorphic-streak plug-ins (Optical Flares, Sapphire)', 'Engine post: bright-pass, one-axis blur, additive composite', 'Canvas 2D + SDF tracer (js/look-kit.js): HDR night shading with an analytic bulb, opts.post oval bokeh with depth-tested occlusion and a two-sided exponential streak filter per row'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const A_ = anaAt(t), B = bulbInfo(LK.scene(t));
      const post = (rgb, G) => {
        const { w, h, S } = G, n = w * h, sx = Math.round(A_.split * w), cp = S.cam.pos;
        // 1. background bokeh: ovals on the anamorphic side, discs on the spherical side, depth-tested
        for (const L of BOKEH) {
          const q = LK.project(S, L.p, w, h); if (!q) continue;
          const ld = V.len(V.sub(L.p, cp)), ana = q[0] < sx, r = L.r * w / 800;
          const rx = ana ? r * 0.62 : r * 0.88, ry = ana ? r * 1.12 : r * 0.88;
          const x0 = Math.max(0, Math.floor(q[0] - rx - 1)), x1 = Math.min(w - 1, Math.ceil(q[0] + rx + 1));
          const y0 = Math.max(0, Math.floor(q[1] - ry - 1)), y1 = Math.min(h - 1, Math.ceil(q[1] + ry + 1));
          for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
            const i = y * w + x; if (G.depth[i] < ld * 0.92) continue;
            const ex = (x + 0.5 - q[0]) / rx, ey = (y + 0.5 - q[1]) / ry, rho = Math.sqrt(ex * ex + ey * ey);
            if (rho > 1.06) continue;
            const a = smooth(1.06, 0.9, rho) * (0.6 + 0.4 * smooth(0.55, 0.95, rho)) * L.I;
            rgb[i * 3] += L.col[0] * a; rgb[i * 3 + 1] += L.col[1] * a; rgb[i * 3 + 2] += L.col[2] * a;
          }
        }
        // 2. bright pass (soft knee above the threshold), anamorphic side only, a little vertical spread
        const m = new Float32Array(n), m2 = new Float32Array(n), st = new Float32Array(n), tmp = new Float32Array(w);
        for (let i = 0; i < n; i++) {
          if (i % w >= sx) continue;
          const l = Math.max(rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]);
          m[i] = Math.max(0, l - A_.th);
        }
        for (let y = 0; y < h; y++) for (let x = 0; x < sx; x++) {
          const i = y * w + x;
          m2[i] = 0.5 * m[i] + 0.25 * (y > 0 ? m[i - w] : 0) + 0.25 * (y < h - 1 ? m[i + w] : 0);
        }
        // 3. streak: a short bright core plus the long tail, along x only
        if (sx > 0) for (let y = 0; y < h; y++) {
          const o = y * w;
          let any = false; for (let x = 0; x < sx; x++) if (m2[o + x] > 0) { any = true; break; }
          if (!any) continue;
          expRow(m2, st, o, w, 10 * w / 800, tmp);
          for (let x = 0; x < w; x++) st[o + x] *= 0.55;
          expRow(m2, st, o, w, A_.L * w / 800, tmp);
        }
        for (let i = 0; i < n; i++) {
          if (i % w >= sx) { st[i] = 0; continue; }
          const s = st[i] * 1.6 * A_.gain;
          rgb[i * 3] += STREAK[0] * s; rgb[i * 3 + 1] += STREAK[1] * s; rgb[i * 3 + 2] += STREAK[2] * s;
        }
        aPass = { w, h, m, st };
      };
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      const { S } = LK.render(c, t, W, H, (g, S_) => nightShade(g, S_, B), { post });
      const bq = LK.project(S, BULB), anaBulb = bq && B.vis && bq[0] < A_.split * W && bq[1] > (H - W / 2.39) / 2;
      // oval ghosts, mirrored through the frame centre
      if (anaBulb) {
        c.save(); c.globalCompositeOperation = 'lighter';
        [[0.4, 26, 'rgba(80,140,255,0.07)'], [0.85, 44, 'rgba(255,170,90,0.045)'], [1.3, 16, 'rgba(110,190,255,0.08)']].forEach(([k, r, col]) => {
          const gx = W / 2 + (W / 2 - bq[0]) * k, gy = H / 2 + (H / 2 - bq[1]) * k;
          const gr = c.createRadialGradient(gx, gy, 0, gx, gy, r * 1.8); gr.addColorStop(0, col); gr.addColorStop(0.7, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = gr; c.beginPath(); c.ellipse(gx, gy, r, r * 1.8, 0, 0, TAU); c.fill();
        });
        c.restore();
      }
      // the bulb's cord
      if (bq && B.vis) { const top = LK.project(S, [BULB[0], 12, BULB[2]]); if (top) { c.strokeStyle = 'rgba(40,40,46,0.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(bq[0], bq[1] - 8); c.lineTo(top[0], top[1]); c.stroke(); } }
      // letterbox 2.39:1
      const barH = (H - W / 2.39) / 2 * A_.bars;
      c.fillStyle = '#000'; c.fillRect(0, 0, W, barH); c.fillRect(0, H - barH, W, barH);
      // keep a copy of the picture area for the squeeze diagram
      const sqv = seg(t, 5.2, 5.6) * (1 - seg(t, 7.1, 7.4));
      if (sqv > 0) {
        const ks = c.getTransform().a, cp = sheet('anaframe', 480, 201);
        cp.cx.drawImage(c.canvas, 0, barH * ks, W * ks, (H - 2 * barH) * ks, 0, 0, 480, 201);
      }
      // split edge
      if (A_.split > 0.002 && A_.split < 0.998) {
        const x = A_.split * W;
        c.fillStyle = 'rgba(236,232,223,0.75)'; c.fillRect(x - 1, barH, 2, H - 2 * barH);
        label(c, 'ANAMORPHIC 2×', x - 18, barH + 44, { align: 'right', size: 16, color: P.paper, weight: 700 });
        label(c, 'SPHERICAL', x + 18, barH + 44, { size: 16, color: P.paper, weight: 700 });
      }
      // readouts (they live in the top bar once it closes)
      c.save(); c.globalAlpha = seg(t, 0.3, 0.7);
      panel(c, 56, 30, 640, 98, true);
      const lens = A_.split > 0.5 ? 'ANAMORPHIC 2× SQUEEZE' : 'SPHERICAL 1×';
      tag(c, lens, 72, 66, { dark: true, accent: '#3d7bff' });
      const asp = lerp(16 / 9, 2.39, A_.bars);
      label(c, `ASPECT ${asp.toFixed(2)}:1   THRESH ${f2(A_.th)}   STREAK L ${Math.round(A_.L)} px   BOKEH ${A_.split > 0.5 ? '1 : 1.8' : '1 : 1'}`, 98, 108, { size: 15, ls: 2, color: 'rgba(236,232,223,0.85)' });
      c.restore();
      // insets: threshold and streak passes
      const tv = seg(t, 2.7, 3.1) * (1 - seg(t, 5.0, 5.3)), sv = seg(t, 3.2, 3.6) * (1 - seg(t, 5.0, 5.3));
      if (aPass && (tv > 0 || sv > 0)) {
        const iw = 320, ih2 = 180, x0 = W - 72 - iw;
        const mk = (key, fn) => {
          const sh = sheet(key, iw, ih2), d = sh.img.data, { w, h } = aPass;
          for (let y = 0; y < ih2; y++) for (let x = 0; x < iw; x++) {
            const bx = Math.floor(x * w / iw), by = Math.floor(y * h / ih2);
            let v = 0; for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) { const xx = Math.min(w - 1, bx + i - 1), yy = clamp(by + j - 1, 0, h - 1); v = Math.max(v, fn(yy * w + Math.max(0, xx))); }
            const o = (y * iw + x) * 4; d[o + 3] = 255;
            if (key === 'anastreak') { d[o] = 255 * clamp(v * 0.32); d[o + 1] = 255 * clamp(v * 0.55); d[o + 2] = 255 * clamp(v); }
            else { d[o] = d[o + 1] = d[o + 2] = 255 * clamp(v * 3); }
          }
          sh.cx.putImageData(sh.img, 0, 0); return sh.cv;
        };
        if (tv > 0) inset(c, mk('anathresh', i => aPass.m[i]), x0, 190, iw, ih2, `BRIGHT PASS  ·  max(r,g,b) > ${f2(A_.th)}`, { on: tv, dark: true });
        if (sv > 0) inset(c, mk('anastreak', i => aPass.st[i] * 1.6 * A_.gain), x0, 190 + ih2 + 58, iw, ih2, `STREAK  ·  BLUR x ONLY, e^(−|dx|/${Math.round(A_.L)})`, { on: sv, dark: true });
      }
      // squeeze / desqueeze diagram
      if (sqv > 0) {
        const cv = surf.anaframe.cv, x0 = W - 72 - 420, y0 = 200;
        c.save(); c.globalAlpha = sqv;
        panel(c, x0 - 16, y0 - 46, 452, 500, true);
        label(c, 'ON THE NEGATIVE  ·  SQUEEZED ½', x0, y0 - 14, { size: 14, ls: 2, color: P.paper, weight: 700 });
        const nh = 176, nw = nh * 1.195;
        c.drawImage(cv, x0, y0, nw, nh); c.strokeStyle = 'rgba(236,232,223,0.5)'; c.strokeRect(x0 + 0.5, y0 + 0.5, nw - 1, nh - 1);
        label(c, '≈ 1.2 : 1', x0 + nw + 16, y0 + nh / 2 + 6, { size: 15, color: 'rgba(236,232,223,0.75)' });
        c.strokeStyle = '#3d7bff'; c.fillStyle = '#3d7bff'; c.lineWidth = 2;
        const ay = y0 + nh + 24; c.beginPath(); c.moveTo(x0 + nw / 2, ay); c.lineTo(x0 + nw / 2, ay + 40); c.stroke();
        c.beginPath(); c.moveTo(x0 + nw / 2 - 7, ay + 32); c.lineTo(x0 + nw / 2, ay + 44); c.lineTo(x0 + nw / 2 + 7, ay + 32); c.fill();
        label(c, 'DESQUEEZE × 2', x0 + nw / 2 + 20, ay + 28, { size: 14, ls: 2, color: '#8fb0ff', weight: 700 });
        const py = ay + 82, pw = 420, ph = pw / 2.39;
        label(c, 'PROJECTED  ·  2.39 : 1', x0, py - 14, { size: 14, ls: 2, color: P.paper, weight: 700 });
        c.drawImage(cv, x0, py, pw, ph); c.strokeRect(x0 + 0.5, py + 0.5, pw - 1, ph - 1);
        c.restore();
      }
      // leaders
      const l1 = seg(t, 1.0, 1.4) * (1 - seg(t, 2.4, 2.7));
      if (B.vis) leader(c, S, BULB, ['PRACTICAL BULB', 'HDR 9.0 → above threshold'], -170, 70, { on: l1, dark: true });
      const lv = seg(t, 7.5, 7.9);
      if (lv > 0) {
        const vd = V.norm(V.sub(S.cam.pos, LK.SPH.c)), hp = V.add(LK.SPH.c, V.mul(V.norm(V.add(LK.KEY, vd)), LK.SPH.r));
        leader(c, S, hp, ['SPECULAR > THRESH', 'smeared along x'], -190, -130, { on: lv, dark: true });
        // the bokeh light nearest the upper centre of frame
        let best = null, bd = 1e9;
        for (const L of BOKEH) { const q = LK.project(S, L.p); if (!q || q[1] < barH + 60) continue; const d = Math.abs(q[0] - W * 0.66) + Math.abs(q[1] - H * 0.36); if (d < bd) { bd = d; best = L; } }
        if (best) leader(c, S, best.p, ['OVAL BOKEH', 'defocus taller than wide · 1 : 1.8'], 150, 90, { on: lv, dark: true });
      }
      LK.caption(c, t, W, H, { name: 'Anamorphic Flare', cat: 'Image', dark: true, curve: u => Math.exp(-Math.abs(u - 0.5) * 2 * 400 / A_.L), span: [t - 0.5, t + 0.5], lo: -0.1, hi: 1.15, curveLabel: 'STREAK PROFILE / x' });
    },
    score(A) {
      LK.bed(A, { g: 0.9 });
      // letterbox: a low wide chord, the cinema opening
      A.chord(0.8, [33, 40, 45, 52], { type: 'sawtooth', dur: 2.6, g: 0.022, a: 0.5, lp: 700, rev: 0.6, width: 0.9 });
      A.whoosh(0.8, 0.8, { f1: 150, f2: 600, q: 0.8, g: 0.06, swell: 0.6 });
      // lens swap: a bright sweep across the stereo field, like the streak itself
      A.whoosh(1.7, 0.9, { f1: 500, f2: 6000, q: 2.2, g: 0.08, swell: 0.6, pan: -0.6 });
      A.osc(1.7, { type: 'sine', f: midi(84), f2: midi(96), glide: 0.9, dur: 1.2, g: 0.025, a: 0.3, rev: 0.6, pan: 0.5 });
      // streak lengthens on the beat: shimmer
      [beat(6), beat(10)].forEach((t0, i) => {
        A.osc(t0, { type: 'sine', f: midi(88 + i * 3), dur: 1.6, g: 0.03, a: 0.05, vib: [6, 6], rev: 0.7, pan: i ? 0.4 : -0.4 });
        A.bell(t0, midi([76, 81][i]), { g: 0.06, dur: 1.8, rev: 0.6 });
      });
      // squeeze then desqueeze
      A.osc(5.2, { type: 'triangle', f: midi(69), f2: midi(57), glide: 0.5, dur: 0.6, g: 0.05, rev: 0.4 });
      A.osc(6.0, { type: 'triangle', f: midi(57), f2: midi(69), glide: 0.5, dur: 0.7, g: 0.05, rev: 0.4 });
      A.chord(beat(10), [45, 52, 57, 64, 69], { type: 'triangle', dur: 2.8, g: 0.03, a: 0.6, lp: 1800, rev: 0.7, width: 0.9 });
      A.chord(8.6, [38, 45, 50, 57, 62], { type: 'triangle', dur: 1.4, g: 0.032, a: 0.2, lp: 1600, rev: 0.7, width: 0.9 });
    },
  });

  /* =====================================================================
     HALFTONE — the render screened for print. Ink is either on the paper
     or not, so tone is made by dot area: each ink lays a grid of dots and a
     dot's area equals the ink coverage sampled under it, r = s·√(cov/π).
     The plain render is separated into cyan, magenta, yellow and black
     (black replaces 70 % of the grey component, the rest stays as CMY),
     and each separation gets its own screen angle, C 15°, M 75°, Y 0°,
     K 45°, so the four grids interfere as a fine rosette rather than a
     coarse moiré. The dots are vector circles drawn at full resolution,
     sampled from the low-resolution shaded buffer. The screen ruling (dots
     per inch, here dots per frame width) changes on the beat. The coda
     prints one ink two ways: AM (amplitude-modulated, fixed grid, dot
     size varies) against FM (frequency-modulated or stochastic, one tiny
     dot size, their density varies), the FM dots placed by error diffusion.
     ===================================================================== */
  const PAPER_C = '#f3eee4';
  const INKS = [
    { n: 'C', ang: 15, col: '#00a0e2' }, { n: 'M', ang: 75, col: '#e4007d' },
    { n: 'Y', ang: 0, col: '#ffe800' }, { n: 'K', ang: 45, col: '#1c1c1b' },
  ];
  const BG = LK.BG, BGL = LK.luma(LK.BG);
  // [time, cell px] keys — instant changes on the beat
  const H_CELL = [[0, 20], [beat(4), 14], [beat(5), 10], [beat(6), 7.5], [beat(7), 12]];
  const cellAt = t => { let s = H_CELL[0][1]; for (const k of H_CELL) if (t >= k[0]) s = k[1]; return s; };
  const H_SPLIT = [[0.4, 0], [1.5, 1, E.ioC]];
  const H_MONO = beat(9), H_FM = [[beat(10), 1], [beat(10) + 0.7, 0.5, E.ioC]];
  let hb = null;   // the shaded buffer from the last post

  // bilinear sample of the buffer at frame coords → rgb normalised to paper white
  const smp = [0, 0, 0];
  function sampleRGB(x, y) {
    const { rgb, w, h } = hb, u = clamp(x * w / 1920 - 0.5, 0, w - 1.001), v = clamp(y * h / 1080 - 0.5, 0, h - 1.001);
    const x0 = u | 0, y0 = v | 0, fx = u - x0, fy = v - y0, i00 = (y0 * w + x0) * 3, i10 = i00 + 3, i01 = i00 + w * 3, i11 = i01 + 3;
    for (let k = 0; k < 3; k++) {
      const a = rgb[i00 + k] + (rgb[i10 + k] - rgb[i00 + k]) * fx, b = rgb[i01 + k] + (rgb[i11 + k] - rgb[i01 + k]) * fx;
      smp[k] = clamp((a + (b - a) * fy) / BG[k]);
    }
    return smp;
  }
  // ink coverage 0..1 for ink index (0 C, 1 M, 2 Y, 3 K, 4 = single black ink from luma)
  function coverage(x, y, ink) {
    const c = sampleRGB(x, y);
    if (ink === 4) { const l = clamp((0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) * BGL / BGL); return Math.pow(1 - l, 0.92); }
    const k0 = 1 - Math.max(c[0], c[1], c[2]), K = 0.7 * k0;
    if (ink === 3) return K;
    return clamp((1 - c[ink] - K) / (1 - K + 1e-6));
  }
  /* One screen: dots on a grid of cell s rotated by ang (degrees, counter-clockwise), covering the
     frame rect x0..x1, y0..y1 (frame coordinates), dot area = coverage. One path, one fill. */
  function screen(c, s, ang, ink, col, x0, y0, x1, y1) {
    const a = ang * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), RK = s / Math.sqrt(Math.PI);
    let umin = 1e9, umax = -1e9, vmin = 1e9, vmax = -1e9;
    for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) {
      const yy = -y, u = (x * ca + yy * sa) / s, v = (-x * sa + yy * ca) / s;
      umin = Math.min(umin, u); umax = Math.max(umax, u); vmin = Math.min(vmin, v); vmax = Math.max(vmax, v);
    }
    c.fillStyle = col; c.beginPath();
    for (let j = Math.floor(vmin) - 1; j <= Math.ceil(vmax) + 1; j++) for (let i = Math.floor(umin) - 1; i <= Math.ceil(umax) + 1; i++) {
      const x = (i * ca - j * sa) * s, y = -(i * sa + j * ca) * s;
      if (x < x0 - s || x > x1 + s || y < y0 - s || y > y1 + s) continue;
      const cov = coverage(clamp(x, 0, 1919), clamp(y, 0, 1079), ink);
      if (cov < 0.03) continue;
      const r = RK * Math.sqrt(cov);
      c.moveTo(x + r, y); c.arc(x, y, r, 0, TAU);
    }
    c.fill();
  }
  function cmyk(c, s, x0, y0, x1, y1, only) {
    c.save(); c.globalCompositeOperation = 'multiply';
    INKS.forEach((k, i) => { if (only === undefined || only === i) screen(c, s, k.ang, i, k.col, x0, y0, x1, y1); });
    c.restore();
  }
  /* FM: Floyd–Steinberg error diffusion of the single-ink coverage on a 3 px cell grid. */
  const FMC = 3, FW = 640, FH = 360;
  function fmBitmap() {
    const sh = sheet('fm', FW, FH), d = sh.img.data, e = new Float32Array(FW * FH);
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) e[y * FW + x] = coverage(x * FMC + 1.5, y * FMC + 1.5, 4);
    for (let y = 0; y < FH; y++) {
      const rev = y % 2 === 1;
      for (let k = 0; k < FW; k++) {
        const x = rev ? FW - 1 - k : k, i = y * FW + x, v = e[i], on = v > 0.5 + (ih(x, y, 17) - 0.5) * 0.35 ? 1 : 0, er = v - on, dx = rev ? -1 : 1;
        const o = i * 4; d[o] = 28; d[o + 1] = 28; d[o + 2] = 27; d[o + 3] = on * 255;
        if (x + dx >= 0 && x + dx < FW) e[i + dx] += er * 7 / 16;
        if (y + 1 < FH) {
          if (x - dx >= 0 && x - dx < FW) e[i + FW - dx] += er * 3 / 16;
          e[i + FW] += er * 5 / 16;
          if (x + dx >= 0 && x + dx < FW) e[i + FW + dx] += er * 1 / 16;
        }
      }
    }
    sh.cx.putImageData(sh.img, 0, 0);
    return sh.cv;
  }
  /* A loupe that redraws its content magnified (vector dots stay crisp). paint(c, x0, y0, x1, y1). */
  function loupe(c, qx, qy, lx, ly, R0, k, paint, title, on) {
    if (on <= 0.01) return;
    const sw = R0 / k;
    c.save(); c.globalAlpha = on;
    c.strokeStyle = P.ink; c.lineWidth = 1.5; c.strokeRect(qx - sw, qy - sw, 2 * sw, 2 * sw);
    const dx = lx - qx, dy = ly - qy, dl = Math.hypot(dx, dy);
    c.beginPath(); c.moveTo(qx + dx / dl * sw * 1.2, qy + dy / dl * sw * 1.2); c.lineTo(lx - dx / dl * R0, ly - dy / dl * R0); c.stroke();
    c.save(); c.beginPath(); c.arc(lx, ly, R0, 0, TAU); c.clip();
    c.translate(lx, ly); c.scale(k, k); c.translate(-qx, -qy);
    c.fillStyle = PAPER_C; c.fillRect(qx - sw, qy - sw, 2 * sw, 2 * sw);
    paint(c, qx - sw, qy - sw, qx + sw, qy + sw);
    c.restore();
    c.lineWidth = 4; c.beginPath(); c.arc(lx, ly, R0, 0, TAU); c.stroke();
    const tw = title.length * 10.4 + 24;
    panel(c, lx - tw / 2, ly + R0 + 12, tw, 28);
    label(c, title, lx, ly + R0 + 32, { size: 14, ls: 2, color: P.ink, weight: 700, align: 'center' });
    c.restore();
  }

  MG.film({
    id: 'lookhalftone', dur: 10, poster: 4.8,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Halftone', sub: 'CMYK dot screens at four angles; AM against FM', era: '1880s —',
      origin: 'Printing presses cannot print grey: a spot either takes ink or it does not, so continuous tone is broken into dots whose size follows the tone. Photographic halftone screens appeared in the 1880s — Frederic Ives in Philadelphia and Georg Meisenbach in Munich were among their inventors — and newspapers adopted them for photographs around 1900. Colour printing separates the image into cyan, magenta, yellow and black and gives each its own screen angle, conventionally 15°, 75°, 0° and 45°, so the grids form a small rosette instead of a visible moiré. Stochastic or FM screening, which keeps one tiny dot size and varies how many there are, came with digital imagesetters in the 1990s.',
      works: 'Roy Lichtenstein, Drowning Girl (1963; Ben-Day dots enlarged into the image) · Sigmar Polke, raster paintings (1960s; enlarged halftone dots) · Into the Spider-Verse (Sony Pictures Animation, 2018; halftone shading in an animated feature)',
      tech: ['CMYK separation, 70 % black replacement', 'Screens at C 15° · M 75° · Y 0° · K 45°', 'AM dots vs FM error diffusion'],
      accent: '#e4007d',
      motionDNA: 'The camera makes the shared 50° orbit. A wipe prints the plain render into four dot screens; the separations and the screen-angle diagram come up, and the screen ruling steps finer on each beat — 20, 14, 10, 7.5 px cells — before settling at 12 for a loupe on the rosette. Then the press runs one ink only: AM dots fill the frame, and a wipe brings in FM stochastic dots for the right half, with a loupe straddling the line.',
      visualDNA: 'Warm newsprint paper; the orange Token as overlapping magenta and yellow dots, the blue cube as cyan and magenta, shadows built from black dots at 45°, every dot a vector circle that sharpens under the loupe. Paper panels hold the readouts, the four separation plates in their inks, the source render and a protractor of the four screen angles; the coda is black ink alone, ordered dots on the left, grainy stochastic dots on the right.',
      transitions: 'Wipe from the plain render to print; hard cut on the beat to one ink; split AM | FM',
      implementation: ['Photoshop / RIP halftone screening (Bitmap, Color Halftone filters)', 'Print workflow: CMYK separation with GCR/UCR, screen angles, stochastic (FM) screening', 'Canvas 2D + SDF tracer (js/look-kit.js): plain render sampled bilinearly per lattice point, one arc path per ink composited with multiply; FM by serpentine Floyd–Steinberg on a 3 px grid'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const split = kf(t, H_SPLIT), s = cellAt(t), mono = t >= H_MONO, fm = mono ? kf(t, H_FM) : 1;
      const post = (rgb, G) => {
        // objects are printed against true white, so the lit top of the sphere keeps a little ink
        // and its silhouette; floor and backdrop are printed against the paper (BG = no ink)
        for (let i = 0; i < G.w * G.h; i++) { const id = G.id[i]; if (id >= 1 && id <= 3) for (let k = 0; k < 3; k++) rgb[i * 3 + k] *= BG[k] * 0.96; }
        hb = { rgb, w: G.w, h: G.h };
      };
      const full = !mono && split < 1;
      const { S } = LK.render(c, t, W, H, LK.plain, { post, rect: full ? [0, 0, W, H] : [0, 0, 2, 2] });
      const sx = mono ? W : split * W;
      c.save(); c.beginPath(); c.rect(0, 0, sx, H); c.clip();
      c.fillStyle = PAPER_C; c.fillRect(0, 0, sx, H);
      let fmX = W;
      if (!mono) cmyk(c, s, 0, 0, sx, H);
      else {
        fmX = fm * W;
        c.save(); c.beginPath(); c.rect(0, 0, fmX, H); c.clip();
        c.globalCompositeOperation = 'multiply'; screen(c, 10, 45, 4, '#1c1c1b', 0, 0, fmX, H); c.restore();
        if (fmX < W) {
          const fcv = fmBitmap();
          c.save(); c.beginPath(); c.rect(fmX, 0, W - fmX, H); c.clip(); c.imageSmoothingEnabled = false; c.drawImage(fcv, 0, 0, W, H); c.restore();
        }
      }
      c.restore();
      // split edges
      if (split > 0 && split < 1 && !mono) {
        c.fillStyle = P.ink; c.fillRect(sx - 1.5, 0, 3, H);
        label(c, 'PRINT', sx - 18, 160, { align: 'right', size: 16, color: P.ink, weight: 700 });
        label(c, 'RENDER', sx + 18, 160, { size: 16, color: P.ink, weight: 700 });
      }
      const fmShow = mono && fmX < W - 1;
      if (fmShow) {
        c.fillStyle = P.ink; c.fillRect(fmX - 1.5, 0, 3, H);
        const lb = (s1, s2, x, al) => { const w = Math.max(s1.length, s2.length) * 11 + 28; const bx = al === 'right' ? x - w : x; panel(c, bx, 240, w, 58); label(c, s1, bx + 14, 264, { size: 16, color: P.ink, weight: 700 }); label(c, s2, bx + 14, 288, { size: 13, ls: 2, color: P.mute }); };
        lb('AM  ·  AMPLITUDE MODULATED', 'fixed 45° grid, dot size varies', fmX - 20, 'right');
        lb('FM  ·  STOCHASTIC', 'one 3 px dot, density varies', fmX + 20, 'left');
      }
      // readout panel
      const on = seg(t, 1.0, 1.4);
      c.save(); c.globalAlpha = on;
      panel(c, 56, 44, 600, mono ? 150 : 178);
      if (!mono) {
        tag(c, 'CMYK HALFTONE  ·  AM SCREENS', 72, 84, { accent: '#e4007d' });
        label(c, `CELL ${s} px  ·  ${Math.round(1920 / s)} LINES / FRAME WIDTH`, 98, 120, { size: 16, color: P.ink, weight: 700 });
        label(c, 'DOT r = s·√(coverage / π)', 98, 148, { size: 15, color: P.ink });
        label(c, 'K = 0.7·(1 − max(r,g,b))   C,M,Y = rest', 98, 174, { size: 15, color: P.ink });
        label(c, 'C 15°   M 75°   Y 0°   K 45°', 98, 200, { size: 15, color: P.mute });
      } else {
        tag(c, 'ONE INK  ·  AM vs FM', 72, 84, { accent: '#1c1c1b' });
        label(c, 'AM: 10 px cell, 45°, r = s·√(k/π)', 98, 120, { size: 15, color: P.ink });
        label(c, 'FM: 3 px dots, Floyd–Steinberg error diffusion', 98, 148, { size: 15, color: P.ink });
        label(c, 'same ink, same tone, different dots', 98, 174, { size: 15, color: P.mute });
      }
      c.restore();
      // screen-angle protractor
      const av = seg(t, 2.0, 2.4) * (1 - seg(t, H_MONO - 0.3, H_MONO));
      if (av > 0.01) {
        const cx = 190, cy = 400, R = 104;
        c.save(); c.globalAlpha = av;
        panel(c, 56, 262, 300, 270);
        label(c, 'SCREEN ANGLES', 72, 290, { size: 14, ls: 2, color: P.ink, weight: 700 });
        c.strokeStyle = 'rgba(23,24,28,0.3)'; c.lineWidth = 1; c.beginPath(); c.arc(cx - 60, cy + 80, R + 30, -Math.PI / 2, 0); c.stroke();
        INKS.forEach(k => {
          const a = -k.ang * Math.PI / 180, ox = cx - 60, oy = cy + 80, ex = ox + Math.cos(a) * (R + 30), ey = oy + Math.sin(a) * (R + 30);
          c.strokeStyle = k.n === 'Y' ? '#d6b800' : k.col; c.lineWidth = 4; c.beginPath(); c.moveTo(ox, oy); c.lineTo(ex, ey); c.stroke();
          label(c, `${k.n} ${k.ang}°`, ex + Math.cos(a) * 14 + (k.ang === 75 ? 6 : 0), ey + Math.sin(a) * 14 + 6, { size: 14, color: P.ink, weight: 700, align: k.ang > 60 ? 'center' : 'left' });
        });
        label(c, '30° apart → rosette, not moiré', 72, 518, { size: 12, ls: 1, color: P.mute });
        c.restore();
      }
      // source render + separations
      const pv = seg(t, 1.6, 2.0) * (1 - seg(t, H_MONO - 0.3, H_MONO));
      if (pv > 0.01 && hb) {
        const iw = 320, ihh = 180, x0 = W - 72 - iw, y0 = 84;
        const sh = sheet('htsrc', iw, ihh), d = sh.img.data;
        for (let y = 0; y < ihh; y++) for (let x = 0; x < iw; x++) {
          const i = (Math.floor(y * hb.h / ihh) * hb.w + Math.floor(x * hb.w / iw)) * 3, o = (y * iw + x) * 4;
          d[o] = 255 * clamp(hb.rgb[i]); d[o + 1] = 255 * clamp(hb.rgb[i + 1]); d[o + 2] = 255 * clamp(hb.rgb[i + 2]); d[o + 3] = 255;
        }
        sh.cx.putImageData(sh.img, 0, 0);
        inset(c, sh.cv, x0, y0, iw, ihh, 'SOURCE RENDER  ·  RGB', { on: pv });
        // four plates, each in its own ink at its own angle
        const pw = 152, ph = 86, sc = pw / W;
        c.save(); c.globalAlpha = pv;
        panel(c, x0 - 8, y0 + ihh + 22, iw + 16, 2 * ph + 72);
        label(c, 'SEPARATIONS', x0, y0 + ihh + 46, { size: 14, ls: 2, color: P.ink, weight: 700 });
        INKS.forEach((k, i) => {
          const px = x0 + (i % 2) * (pw + 16), py = y0 + ihh + 58 + Math.floor(i / 2) * (ph + 22);
          c.save(); c.beginPath(); c.rect(px, py, pw, ph); c.clip();
          c.fillStyle = PAPER_C; c.fillRect(px, py, pw, ph);
          c.translate(px, py); c.scale(sc, sc);
          c.globalCompositeOperation = 'multiply'; screen(c, 4.2 / sc, k.ang, i, k.col, 0, 0, W, H);
          c.restore();
          c.strokeStyle = 'rgba(23,24,28,0.4)'; c.lineWidth = 1; c.strokeRect(px + 0.5, py + 0.5, pw - 1, ph - 1);
          label(c, `${k.n} ${k.ang}°`, px + pw - 6, py + ph + 15, { size: 12, ls: 1, color: P.ink, weight: 700, align: 'right' });
        });
        c.restore();
      }
      // loupe on the rosette (on the Token's lower edge, where magenta, yellow and black overlap)
      const lp1 = seg(t, beat(6) - 0.2, beat(6) + 0.2) * (1 - seg(t, H_MONO - 0.4, H_MONO - 0.1));
      if (lp1 > 0.01) {
        const q = LK.project(S, tokWorld(S, [-0.55, -0.72, 0.2]));
        if (q) loupe(c, q[0], q[1], q[0] + 250, Math.min(q[1] + 190, 700), 175, 5, (cc, a, b, x2, y2) => cmyk(cc, s, a, b, x2, y2), `LOUPE 5×  ·  ROSETTE  ·  ${s} px`, lp1);
      }
      // loupe straddling AM | FM
      const lp2 = seg(t, 8.0, 8.4);
      if (lp2 > 0.01 && fmShow) {
        const qx = fmX, qy = 560;
        loupe(c, qx, qy, qx + 360, 700, 170, 4, (cc, a, b, x2, y2) => {
          cc.save(); cc.beginPath(); cc.rect(a, b, fmX - a, y2 - b); cc.clip(); cc.globalCompositeOperation = 'multiply'; screen(cc, 10, 45, 4, '#1c1c1b', a, b, fmX, y2); cc.restore();
          cc.save(); cc.beginPath(); cc.rect(fmX, b, x2 - fmX, y2 - b); cc.clip(); cc.imageSmoothingEnabled = false; cc.drawImage(surf.fm.cv, 0, 0, W, H); cc.restore();
          cc.fillStyle = P.ink; cc.fillRect(fmX - 0.4, b, 0.8, y2 - b);
        }, 'LOUPE 4×  ·  AM | FM', lp2);
      }
      // caption: dot diameter against coverage, marker at the Token's magenta
      let cov = 0.6;
      if (hb) { const q = LK.project(S, tokWorld(S, [-0.4, -0.2, 0.2])); if (q) cov = coverage(clamp(q[0], 0, 1919), clamp(q[1], 0, 1079), mono ? 4 : 1); }
      // paper under the caption and its graph so they read over the dots
      c.fillStyle = 'rgba(243,238,228,0.9)'; c.fillRect(56, H - 182, 600, 160); c.fillRect(W - 336, H - 214, 280, 192);
      LK.caption(c, t, W, H, { name: 'Halftone', cat: 'Image', curve: u => 2 * Math.sqrt(u / Math.PI), span: [t - cov, t - cov + 1], lo: -0.1, hi: 1.25, curveLabel: mono ? 'AM DOT Ø / INK %' : 'DOT Ø / CELL vs COVERAGE' });
    },
    score(A) {
      LK.bed(A);
      // the press: a soft mechanical cycle while the plates print
      for (let i = 0; i * BEAT / 2 < 6.2; i++) { const t0 = 0.4 + i * BEAT / 2; A.noise(t0, { type: 'bandpass', f: 900 + (i % 2) * 500, q: 3, dur: 0.05, g: 0.035, pan: i % 2 ? 0.3 : -0.3 }); }
      A.whoosh(0.4, 1.1, { f1: 200, f2: 2400, g: 0.08, swell: 0.6, pan: -0.4 });
      // plates land one by one
      [1.6, 1.75, 1.9, 2.05].forEach((t0, i) => A.pluck(t0, midi([64, 67, 71, 76][i]), { g: 0.1, bright: 0.6, dur: 0.9, rev: 0.35, pan: -0.45 + i * 0.3 }));
      // screen ruling steps finer: a ratchet click and a rising pluck each beat
      [beat(4), beat(5), beat(6), beat(7)].forEach((t0, i) => {
        for (let k = 0; k < 4; k++) A.osc(t0 + k * 0.045, { type: 'square', f: 1800 + i * 300, dur: 0.018, g: 0.025, lp: 4000 });
        A.pluck(t0 + 0.05, midi([69, 72, 76, 67][i]), { g: 0.12, bright: 0.5, dur: 1.0, rev: 0.4 });
      });
      // one ink: a hard cut, then the stochastic hiss of FM
      A.kick(H_MONO, 0.3, { f: 110, f2: 40, dur: 0.5 });
      A.snare(H_MONO, 0.08, { f: 2200, dur: 0.12, rev: 0.3 });
      A.noise(beat(10), { type: 'highpass', f: 6500, dur: 0.9, g: 0.035, swell: 0.5, pan: 0.5 });
      A.chord(beat(10), [45, 52, 57, 64], { type: 'triangle', dur: 2.4, g: 0.03, a: 0.4, lp: 1500, rev: 0.6, width: 0.9 });
      A.bell(8.0, midi(76), { g: 0.06, dur: 1.8, rev: 0.6 });
      A.bell(8.6, midi(81), { g: 0.05, dur: 1.6, rev: 0.6 });
    },
  });

  /* =====================================================================
     INFRARED — false colour: data that is not visible light, painted with
     colours. A thermal camera sees long-wave infrared (8–14 µm), emitted
     in proportion to temperature, and a palette turns each temperature
     into a colour. Here nothing is measured: a temperature is assigned to
     every surface from render data — a base value per material, plus
     heating where the key light falls unshadowed (N·L × shadow), plus warm
     contact patches where the sphere and cube meet the floor and a warm
     halo under the Token, which is heating up like a powered device.
     Apparent temperature drops toward grazing angles, as emissivity does.
     The second preset is infrared colour film (Kodak Aerochrome style): a
     channel shift — infrared reflectance shown as red, red as green, green
     as blue, blue blocked by a yellow filter — so IR-bright surfaces
     glow red-pink and IR-dark pigment turns green.
     ===================================================================== */
  const T_BG = 13, T_LO = 12, T_HI = 40;
  function ramp(stops) {   // 256-entry LUT from [u, [r,g,b]] stops
    const lut = new Float32Array(256 * 3);
    for (let i = 0; i < 256; i++) {
      const u = i / 255; let k = 1; while (k < stops.length - 1 && stops[k][0] < u) k++;
      const a = stops[k - 1], b = stops[k], f = clamp((u - a[0]) / (b[0] - a[0] || 1));
      for (let j = 0; j < 3; j++) lut[i * 3 + j] = lerp(a[1][j], b[1][j], f);
    }
    return lut;
  }
  const PALS = {
    IRONBOW: ramp([[0, [0.02, 0.01, 0.06]], [0.18, [0.16, 0.02, 0.42]], [0.38, [0.58, 0.03, 0.56]], [0.58, [0.9, 0.24, 0.12]], [0.78, [0.99, 0.6, 0.02]], [0.92, [1, 0.88, 0.32]], [1, [1, 1, 0.9]]]),
    RAINBOW: ramp([[0, [0.03, 0.02, 0.1]], [0.15, [0.1, 0.1, 0.7]], [0.32, [0.0, 0.6, 0.95]], [0.5, [0.1, 0.85, 0.35]], [0.66, [0.95, 0.92, 0.1]], [0.82, [1, 0.45, 0.05]], [0.94, [0.9, 0.05, 0.1]], [1, [1, 0.85, 0.85]]]),
    'WHITE HOT': ramp([[0, [0.02, 0.02, 0.02]], [1, [1, 1, 1]]]),
  };
  const palAt = t => (t >= beat(5) && t < beat(6) ? 'RAINBOW' : t >= beat(6) && t < beat(7) ? 'WHITE HOT' : 'IRONBOW');
  const ISO = 35, ISO_C = [0.35, 1.0, 0.72];
  const tokTemp = t => 30 + 9.5 * E.ioS(seg(t, 0.4, 6.2));
  // IR reflectance assumed per material (0 floor, 1 Token, 2 sphere, 3 cube)
  const IRR = [0.97, 0.28, 0.93, 0.88];
  const I_S1 = [[0.5, 0], [1.6, 1, E.ioC]], I_S2 = [[beat(9), 0], [beat(9) + 0.9, 1, E.ioC]], I_B3 = [[8.5, 0], [9.2, 1, E.ioC]];
  function irLayout(t) { return { s1: kf(t, I_S1), s2: kf(t, I_S2), b3: kf(t, I_B3) }; }
  // zone for screen column u: 0 visible, 1 thermal, 2 infrared film
  function irZone(L, u) {
    if (L.b3 > 0) return u < L.b3 / 3 ? 0 : u < 2 * L.b3 / 3 ? 1 : 2;
    if (u < L.s2) return 2;
    return u < L.s1 ? 1 : 0;
  }
  // the assigned temperature (°C) for a surface sample; dif = N·L × shadow
  function temperature(id, p, n, vd, S, dif, TT) {
    let T;
    if (id === 1) { const q = tokLocal(S, p); T = TT - 2.4 * (q[0] * q[0] + q[1] * q[1]); }
    else if (id === 2) T = 21.5 + 8.5 * dif;
    else if (id === 3) T = 19.5 + 4.5 * dif;
    else {
      const dx = p[0] - LK.SPH.c[0], dz = p[2] - LK.SPH.c[2], tc = S.tok.c;
      const dc = Math.max(0, LK.sdCube([p[0], 0.02, p[2]], S));
      T = 16 + 6 * dif + 6.5 * Math.exp(-(dx * dx + dz * dz) / 0.45) + 4.5 * Math.exp(-(dc / 0.2) * (dc / 0.2))
        + 3.2 * Math.exp(-((p[0] - tc[0]) ** 2 + (p[2] - tc[2]) ** 2) / 1.3) + 0.35 * vnoise(p[0] * 1.7 + 0.3 * vnoise(p[2] * 2.1, 5), 9);
      return T;
    }
    const e = 0.78 + 0.22 * Math.sqrt(Math.abs(V.dot(n, vd)));
    return T_BG + (T - T_BG) * e;
  }
  let irBuf = null;   // per-pixel temperature and inputs, for insets and the max spot

  MG.film({
    id: 'lookinfrared', dur: 10, poster: 3.4,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Infrared', sub: 'False colour: a thermal map and IR colour film', era: '1940s —',
      origin: 'False-colour imaging shows data the eye cannot see by assigning it colours. Thermal cameras record long-wave infrared, roughly 8–14 µm, which every surface emits according to its temperature and emissivity; early military and medical thermographs of the mid-20th century gave way to uncooled microbolometer cameras from the 1990s, whose palettes — ironbow, rainbow, white-hot — are now a familiar look. Infrared colour film works differently: Kodak’s Ektachrome Infrared, later sold as Aerochrome, was developed during the Second World War to detect camouflage, recording near-infrared reflectance as red, red as green and green as blue behind a yellow filter, so living foliage turned red and pink. Both are mappings, which is what this film does with render data.',
      works: 'Predator (John McTiernan, 1987; the creature’s thermal vision) · Richard Mosse, The Enclave (2013; Aerochrome infrared film in the eastern Congo) · Richard Mosse, Incoming (2017; military thermal camera footage)',
      tech: ['Temperature assigned from render data', 'Ironbow / rainbow / white-hot palettes, isotherm', 'IR → R, R → G, G → B channel shift'],
      accent: '#ff7a1a',
      motionDNA: 'The camera makes the shared 50° orbit. A wipe turns the visible render into a thermal image; the scale bar and four spot meters come up one per half beat while the Token warms from 30 to nearly 40 °C; the palette steps from ironbow to rainbow to white-hot and back on the beat, an isotherm above 35 °C lights up, then a second wipe switches to infrared colour film and the film ends on three bands: visible, thermal, infrared.',
      visualDNA: 'A thermal still life in ironbow: the Token glowing yellow-white with cooler purple edges, warm lit faces against cold shadowed floor, hot contact rings under the sphere and cube, a black cold backdrop; camera-style brackets, crosshair spot meters with °C readouts, a vertical scale bar and input-pass insets. Then a pink-white world with a crimson cube and a green Token, labelled channel by channel.',
      transitions: 'Wipe from visible to thermal, hard palette swaps on the beat, wipe to IR film, three comparison bands',
      implementation: ['Thermal camera palettes and isotherms (FLIR-style ironbow LUTs)', 'False-colour channel remapping (Aerochrome emulation in Photoshop or Resolve)', 'Canvas 2D + SDF tracer (js/look-kit.js): per-pixel temperature from id, N·L × shadow, contact and heat-source falloffs, 256-entry palette LUT, seeded sensor noise; IR film as a channel swap of the plain lighting'],
      reproducibility: 'Fully procedural (sensor noise seeded by pixel and frame)',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const L = irLayout(t), pal = PALS[palAt(t)], TT = tokTemp(t), frame = Math.floor(t * 30 + 1e-6);
      const isoOn = t >= beat(7) && t < beat(9) - 0.2;
      const res = [800, 450], n = res[0] * res[1];
      if (!irBuf || irBuf.T.length !== n) irBuf = { T: new Float32Array(n), dif: new Float32Array(n), heat: new Float32Array(n), z: new Uint8Array(n) };
      const B = irBuf;
      const shade = (g, S) => {
        const z = irZone(L, g.u); B.z[g.i] = z;
        if (z === 0) { B.T[g.i] = -99; return LK.plain(g, S); }
        if (z === 1) {
          let T, dif = 0;
          if (!g.hit) T = T_BG + 1.5 * (1 - clamp(g.d[1] * 3)) + 0.4;
          else {
            dif = Math.max(0, V.dot(g.n, LK.KEY)) * LK.shadow(V.add(g.p, V.mul(g.n, 0.01)), LK.KEY, S, 10);
            T = temperature(g.id, g.p, g.n, V.mul(g.d, -1), S, dif, TT);
            if (g.id === 0) { const far = clamp((g.depth - 10) / 30); T = lerp(T, T_BG + 2, far); }
          }
          B.T[g.i] = T; B.dif[g.i] = dif; B.heat[g.i] = g.hit ? clamp((T - 16 - 6 * dif) / 8) : 0;
          T += (ih(g.x, g.y, frame) - 0.5) * 0.35;   // sensor noise (NETD)
          const u = clamp((T - T_LO) / (T_HI - T_LO)), k = Math.round(u * 255) * 3;
          let col = [pal[k], pal[k + 1], pal[k + 2]];
          if (isoOn && T > ISO) col = LK.mix3(col, ISO_C, 0.78);
          return col;
        }
        // infrared colour film: IR reflectance → R, red → G, green → B
        if (!g.hit) { const v = smooth(-0.1, 0.5, g.d[1]); return LK.mix3([0.97, 0.86, 0.85], [0.9, 0.74, 0.76], v); }
        const a = LK.albedo(g.id), k = plainK(g, S), ir = IRR[g.id];
        let col = LK.tone([ir * k, a[0] * k * 0.95, a[1] * k * 0.92], 1.3);
        const l = LK.luma(col); col = col.map(v => l + (v - l) * 1.25);
        return g.id === 0 ? LK.floorFade(col, g, [0.97, 0.86, 0.85]) : col;
      };
      const { S } = LK.render(c, t, W, H, shade, { res });
      const thermalMost = L.b3 > 0 ? 0 : L.s2 < 0.4 && L.s1 > 0.5;
      const thermalAny = L.b3 > 0 || (L.s1 > 0.02 && L.s2 < 0.98);
      // split edges / band labels
      const edge = (u, a, b) => {
        const x = u * W; c.fillStyle = P.paper; c.fillRect(x - 1.5, 0, 3, H);
        if (a) { panel(c, x - 22 - a.length * 13.6, 136, a.length * 13.6 + 12, 28, true); label(c, a, x - 14, 157, { align: 'right', size: 16, color: P.paper, weight: 700 }); }
        if (b) { panel(c, x + 8, 136, b.length * 13.6 + 12, 28, true); label(c, b, x + 14, 157, { size: 16, color: P.paper, weight: 700 }); }
      };
      if (L.b3 > 0) {
        edge(L.b3 / 3, 0, 0); edge(2 * L.b3 / 3, 0, 0);
        c.save(); c.globalAlpha = seg(t, 9.0, 9.3);
        [['VISIBLE', 1 / 6], ['THERMAL', 0.5], ['INFRARED FILM', 5 / 6]].forEach(([s, u]) => { panel(c, u * W - s.length * 5.6 - 10, 136, s.length * 11.2 + 20, 28, true); label(c, s, u * W, 157, { align: 'center', size: 16, color: P.paper, weight: 700 }); });
        c.restore();
      } else if (L.s2 > 0 && L.s2 < 1) edge(L.s2, 'INFRARED FILM', 'THERMAL');
      else if (L.s1 > 0 && L.s1 < 1) edge(L.s1, 'THERMAL · LWIR', 'VISIBLE');
      // thermal camera chrome: brackets, centre cross, scale bar
      const uv = seg(t, 1.3, 1.7) * (1 - seg(t, beat(9) + 0.2, beat(9) + 0.6));
      if (uv > 0.01) {
        c.save(); c.globalAlpha = uv; c.strokeStyle = 'rgba(236,232,223,0.8)'; c.lineWidth = 3;
        [[40, 40, 1, 1], [W - 40, 40, -1, 1], [40, H - 40, 1, -1], [W - 40, H - 40, -1, -1]].forEach(([x, y, sx_, sy]) => { c.beginPath(); c.moveTo(x, y + sy * 60); c.lineTo(x, y); c.lineTo(x + sx_ * 60, y); c.stroke(); });
        // scale bar
        const bx = W - 128, by = 150, bh = 600;
        for (let i = 0; i < bh; i++) { const k = Math.round((1 - i / bh) * 255) * 3; c.fillStyle = `rgb(${pal[k] * 255 | 0},${pal[k + 1] * 255 | 0},${pal[k + 2] * 255 | 0})`; c.fillRect(bx, by + i, 26, 1.5); }
        if (isoOn) { const y = by + bh * (1 - (ISO - T_LO) / (T_HI - T_LO)); c.fillStyle = 'rgb(90,255,184)'; c.fillRect(bx, by, 26, y - by); label(c, `ISO > ${ISO}`, bx - 10, y + 5, { size: 13, color: 'rgb(90,255,184)', align: 'right', weight: 700 }); }
        c.strokeStyle = 'rgba(236,232,223,0.6)'; c.lineWidth = 1; c.strokeRect(bx + 0.5, by + 0.5, 26, bh);
        for (let T = T_LO + 3; T <= T_HI; T += 5) { const y = by + bh * (1 - (T - T_LO) / (T_HI - T_LO)); c.fillStyle = 'rgba(236,232,223,0.8)'; c.fillRect(bx + 26, y, 8, 1.5); label(c, `${T}`, bx + 40, y + 5, { size: 13, ls: 1, color: P.paper }); }
        label(c, '°C', bx + 13, by - 14, { size: 14, color: P.paper, weight: 700, align: 'center' });
        label(c, palAt(t), bx + 13, by + bh + 28, { size: 13, ls: 2, color: P.paper, weight: 700, align: 'center' });
        c.restore();
      }
      // spot meters: Token, sphere, cube, floor contact, plus the frame maximum
      const vdS = V.norm(V.sub(S.cam.pos, LK.SPH.c));
      const spots = [
        ['Sp1 TOKEN', tokWorld(S, [-0.35, -0.3, 0.22]), 1],
        ['Sp2 SPHERE', V.add(LK.SPH.c, V.mul(V.norm(V.add(V.mul(LK.KEY, 0.6), vdS)), LK.SPH.r)), 2],
        ['Sp3 CUBE', V.add(LK.CUBE.c, [0, 0.5, 0]), 3],
        ['Sp4 CONTACT', [LK.SPH.c[0] + 0.42, 0, LK.SPH.c[2] + 0.38], 0],
      ];
      const spotOn = i => seg(t, 1.8 + i * BEAT / 2, 1.95 + i * BEAT / 2) * (1 - seg(t, beat(9) + 0.2, beat(9) + 0.5));
      spots.forEach(([name, p, id], i) => {
        const on = spotOn(i); if (on <= 0.01) return;
        const q = LK.project(S, p); if (!q || irZone(L, q[0] / W) !== 1) return;
        const n = id === 2 ? V.norm(V.sub(p, LK.SPH.c)) : id === 1 ? V.norm(V.sub(p, S.tok.c)) : [0, 1, 0];
        const dif = Math.max(0, V.dot(n, LK.KEY)) * LK.shadow(V.add(p, V.mul(n, 0.02)), LK.KEY, S, 10);
        const T = temperature(id, p, n, V.norm(V.sub(S.cam.pos, p)), S, dif, TT);
        c.save(); c.globalAlpha = on; c.strokeStyle = P.paper; c.lineWidth = 2;
        c.beginPath(); c.moveTo(q[0] - 18, q[1]); c.lineTo(q[0] - 6, q[1]); c.moveTo(q[0] + 6, q[1]); c.lineTo(q[0] + 18, q[1]); c.moveTo(q[0], q[1] - 18); c.lineTo(q[0], q[1] - 6); c.moveTo(q[0], q[1] + 6); c.lineTo(q[0], q[1] + 18); c.stroke();
        const s = `${name}  ${f1(T)} °C`, w = s.length * 10.6 + 16;
        panel(c, q[0] + 22, q[1] - 34, w, 24, true); label(c, s, q[0] + 30, q[1] - 16, { size: 14, ls: 1, color: P.paper, weight: 700 });
        c.restore();
      });
      // frame maximum from the temperature buffer
      if (spotOn(4) > 0.01) {
        let mi = -1, mT = -1e9; for (let i = 0; i < n; i++) if (B.z[i] === 1 && B.T[i] > mT) { mT = B.T[i]; mi = i; }
        if (mi >= 0) {
          const x = (mi % res[0] + 0.5) * W / res[0], y = (Math.floor(mi / res[0]) + 0.5) * H / res[1];
          c.save(); c.globalAlpha = spotOn(4); c.fillStyle = '#ff3b2f';
          c.beginPath(); c.moveTo(x, y - 4); c.lineTo(x - 10, y - 20); c.lineTo(x + 10, y - 20); c.closePath(); c.fill();
          const s = `MAX ${f1(mT)} °C`; panel(c, x - s.length * 5.3 - 8, y - 50, s.length * 10.6 + 16, 24, true); label(c, s, x, y - 32, { size: 14, ls: 1, color: '#ff8a7a', weight: 700, align: 'center' });
          c.restore();
        }
      }
      // what the colours mean: formula panel and input passes
      const fv = seg(t, 2.6, 3.0) * (1 - seg(t, beat(9), beat(9) + 0.4));
      if (fv > 0.01) {
        c.save(); c.globalAlpha = fv;
        panel(c, 56, 44, 700, 178, true);
        tag(c, `FALSE COLOUR  ·  ${palAt(t)}${isoOn ? '  ·  ISOTHERM > 35 °C' : ''}`, 72, 84, { dark: true, accent: '#ff7a1a' });
        label(c, 'T = T₀(material) + 6–9 °C · N·L · shadow', 98, 120, { size: 16, color: P.paper, weight: 700 });
        label(c, '    + contact rings + heat under the Token', 98, 146, { size: 16, color: P.paper });
        label(c, `TOKEN CORE ${f1(TT)} °C   RANGE ${T_LO}–${T_HI} °C   ε falls at grazing angles`, 98, 176, { size: 14, ls: 1, color: 'rgba(236,232,223,0.7)' });
        label(c, 'assigned from render data — not a measurement', 98, 202, { size: 14, ls: 1, color: '#ffb37a' });
        c.restore();
        const iw = 240, ihh = 135, x0 = W - 180 - 2 * iw - 40, y0 = H - 60 - ihh;
        const mk = (key, fn) => {
          const sh = sheet(key, iw, ihh), d = sh.img.data;
          for (let y = 0; y < ihh; y++) for (let x = 0; x < iw; x++) {
            const i = Math.floor(y * res[1] / ihh) * res[0] + Math.floor(x * res[0] / iw), v = B.z[i] === 1 ? fn(i) : 0, o = (y * iw + x) * 4;
            d[o] = d[o + 1] = d[o + 2] = 255 * clamp(v); d[o + 3] = 255;
          }
          sh.cx.putImageData(sh.img, 0, 0); return sh.cv;
        };
        const i1 = seg(t, 3.0, 3.4) * (1 - seg(t, beat(9), beat(9) + 0.4)), i2 = seg(t, 3.4, 3.8) * (1 - seg(t, beat(9), beat(9) + 0.4));
        if (i1 > 0) inset(c, mk('irdif', i => B.dif[i]), x0, y0, iw, ihh, 'INPUT  ·  N·L × SHADOW', { on: i1, dark: true });
        if (i2 > 0) inset(c, mk('irheat', i => B.heat[i]), x0 + iw + 40, y0, iw, ihh, 'INPUT  ·  CONTACT + HEAT', { on: i2, dark: true });
      }
      // infrared film: channel map and material leaders
      const cv2 = seg(t, beat(9) + 0.7, beat(9) + 1.1) * (1 - seg(t, 8.4, 8.7));
      if (cv2 > 0.01) {
        c.save(); c.globalAlpha = cv2;
        panel(c, 56, 44, 620, 236);
        tag(c, 'INFRARED COLOUR FILM  ·  AEROCHROME-STYLE', 72, 84, { accent: '#d81b4f' });
        const row = (y, from, fcol, to, tcol, note) => {
          c.fillStyle = fcol; c.fillRect(98, y - 16, 20, 20); label(c, from, 128, y, { size: 16, color: P.ink, weight: 700 });
          label(c, '→', 300, y, { size: 16, color: P.ink });
          if (tcol) { c.fillStyle = tcol; c.fillRect(336, y - 16, 20, 20); }
          label(c, to, 366, y, { size: 16, color: tcol ? P.ink : P.mute, weight: 700 });
          if (note) label(c, note, 470, y, { size: 13, ls: 1, color: P.mute });
        };
        row(122, 'NEAR IR', '#7a1f2b', 'RED', '#e0263b');
        row(156, 'RED', '#e0263b', 'GREEN', '#2fa84f');
        row(190, 'GREEN', '#2fa84f', 'BLUE', '#2f5bff');
        row(224, 'BLUE', '#2f5bff', 'BLOCKED', null, 'yellow filter');
        label(c, 'IR reflectance per material is assumed', 98, 262, { size: 13, ls: 1, color: P.mute });
        c.restore();
        leader(c, S, V.add(LK.CUBE.c, [0, 0.25, 0.3]), ['CUBE  ·  IR 0.88', 'IR-bright paint → red'], 140, -150, { on: cv2 });
        leader(c, S, tokWorld(S, [-0.4, -0.35, 0.22]), ['TOKEN  ·  IR 0.28', 'IR-dark pigment → green'], -110, 250, { on: cv2 });
        leader(c, S, V.add(LK.SPH.c, [0.2, 0.6, 0.4]), ['SPHERE  ·  IR 0.93', 'reads pink-white'], -140, -120, { on: cv2 });
      }
      LK.caption(c, t, W, H, { name: 'Infrared', cat: 'Image', dark: thermalMost || (thermalAny && L.s2 < 0.4 && L.b3 === 0) });
    },
    score(A) {
      LK.bed(A);
      // the camera wakes: a low hum and the shutter of the flat-field calibration
      A.noise(0.5, { type: 'lowpass', f: 400, f2: 1200, sweep: 1.1, dur: 1.2, g: 0.05, swell: 0.6 });
      A.whoosh(0.5, 1.1, { f1: 200, f2: 2200, g: 0.08, swell: 0.6, pan: -0.4 });
      [1.3, 1.36].forEach(t0 => { A.noise(t0, { type: 'bandpass', f: 2600, q: 3, dur: 0.03, g: 0.08 }); A.osc(t0, { type: 'square', f: 420, dur: 0.02, g: 0.03, lp: 2000 }); });
      A.osc(0.6, { type: 'sine', f: 55, dur: 6, g: 0.03, a: 1.2, hold: true });
      // spot meters: one beep each
      for (let i = 0; i < 5; i++) A.osc(1.8 + i * BEAT / 2, { type: 'square', f: midi(88 + (i % 2) * 3), dur: 0.06, g: 0.03, lp: 3000, pan: -0.4 + i * 0.2 });
      // palette swaps on the beat
      [beat(5), beat(6), beat(7)].forEach((t0, i) => { A.pluck(t0, midi([64, 71, 67][i]), { g: 0.12, bright: 0.55, dur: 1.1, rev: 0.4 }); A.noise(t0, { type: 'highpass', f: 5000, dur: 0.03, g: 0.04 }); });
      // isotherm alarm, twice
      [beat(7) + 0.1, beat(7) + 0.45].forEach(t0 => { A.osc(t0, { type: 'square', f: midi(84), dur: 0.1, g: 0.025, lp: 2500 }); A.osc(t0 + 0.12, { type: 'square', f: midi(79), dur: 0.1, g: 0.025, lp: 2500 }); });
      // infrared film: brighter, open
      A.whoosh(beat(9), 0.9, { f1: 400, f2: 4000, g: 0.09, swell: 0.6, pan: 0.4 });
      A.chord(beat(9) + 0.5, [52, 59, 64, 68, 71], { type: 'triangle', dur: 2.6, g: 0.03, a: 0.4, lp: 2400, rev: 0.6, width: 0.9 });
      [8.5, 8.85, 9.2].forEach((t0, i) => A.bell(t0, midi([69, 73, 76][i]), { g: 0.06, dur: 1.4, rev: 0.6 }));
    },
  });
})();
