/* batch l4 — Rendering Looks · Shading: lookao · lookxray · lookwire.
   lookao (ambient occlusion: the AO pass on its own, its radius and sample count growing, then
   multiplied into the colour render against a no-AO split, with a note on SSAO vs ray-traced
   vs SDF AO) ·
   lookxray (Fresnel x-ray: a (1 − |n·v|)^p edge term added on a dark ground for every surface a
   ray passes through, front and back, the exponent stepping on the beat and the hue shifting) ·
   lookwire (wireframe: analytic 3D polylines on every object projected to the frame, hidden-line
   removal against the G-buffer depth, the test toggled off, dashed and on, then wires over the
   shaded render). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, midi } = MG;
  const LK = MG.LK, P = LK.P, V = LK.V, label = LK.label, BEAT = LK.BEAT;
  const { add, sub, mul, dot, len, norm } = V;
  const FW = 1920, FH = 1080;

  /* ---------------- shared helpers ---------------- */
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
  // local → world for an object with rotation M (row-major 3 × 3) and centre c, as the kit stores them
  const toW = (M, c, q) => [M[0] * q[0] + M[1] * q[1] + M[2] * q[2] + c[0], M[3] * q[0] + M[4] * q[1] + M[5] * q[2] + c[1], M[6] * q[0] + M[7] * q[1] + M[8] * q[2] + c[2]];
  const tokW = (S, q) => toW(S.tok.M, S.tok.c, q);
  const cubeW = (S, q) => toW(S.cubeM, LK.CUBE.c, q);
  const ink = dark => (dark ? P.paper : P.ink);
  function tag(c, s, x, y, on = 1, dark = false) {   // accent dot + mono label, top-left
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: ink(dark), weight: 700, size: 20 });
    c.restore();
  }
  /* Leader line from a world point to a mono label offset by dx, dy (full-frame px). */
  function lead(c, S, p, s, dx, dy, o = {}) {
    const q = LK.project(S, p, FW, FH); if (!q || (o.on ?? 1) <= 0.001) return;
    const col = o.color || P.ink, x2 = q[0] + dx, y2 = q[1] + dy, sg = dx < 0 ? -1 : 1;
    c.save(); c.globalAlpha *= o.on ?? 1;
    if (o.halo) { c.strokeStyle = o.halo; c.lineWidth = 4; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(x2, y2); c.lineTo(x2 + sg * 26, y2); c.stroke(); }
    c.strokeStyle = col; c.lineWidth = 1.6; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(x2, y2); c.lineTo(x2 + sg * 26, y2); c.stroke();
    c.fillStyle = col; c.beginPath(); c.arc(q[0], q[1], 5, 0, TAU); c.fill();
    if (o.halo) { c.strokeStyle = o.halo; c.lineWidth = 2; c.beginPath(); c.arc(q[0], q[1], 7, 0, TAU); c.stroke(); }
    label(c, s, x2 + sg * 34, y2 + 6, { align: sg < 0 ? 'right' : 'left', color: col, size: 16, weight: 700 });
    if (o.sub) label(c, o.sub, x2 + sg * 34, y2 + 28, { align: sg < 0 ? 'right' : 'left', color: o.subColor || col, size: 13, ls: 2 });
    c.restore();
  }
  /* Small framed inset of a per-pixel buffer (G-buffer resolution), sampled every `step` pixels.
     px(i) → [r, g, b] 0..255. */
  const insetCv = {};
  function inset(c, key, w, h, step, px, rect, title, o = {}) {
    const iw = Math.floor(w / step), ih = Math.floor(h / step);
    if (!insetCv[key]) { const cv = MG.offscreen(iw, ih), cx = cv.getContext('2d'); insetCv[key] = { cv, cx, img: cx.createImageData(iw, ih) }; }
    const I = insetCv[key], d = I.img.data;
    for (let y = 0; y < ih; y++) for (let x = 0; x < iw; x++) {
      const v = px((y * step + (step >> 1)) * w + x * step + (step >> 1)), j = (y * iw + x) * 4;
      d[j] = v[0]; d[j + 1] = v[1]; d[j + 2] = v[2]; d[j + 3] = 255;
    }
    I.cx.putImageData(I.img, 0, 0);
    const [x, y, rw, rh] = rect;
    c.save(); c.globalAlpha *= o.on ?? 1;
    c.fillStyle = o.dark ? 'rgba(0,0,0,0.5)' : 'rgba(23,24,28,0.18)'; c.fillRect(x - 3, y - 3, rw + 6, rh + 6);
    c.imageSmoothingEnabled = true; c.drawImage(I.cv, x, y, rw, rh);
    c.strokeStyle = o.dark ? 'rgba(236,232,223,0.5)' : 'rgba(23,24,28,0.5)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, rw - 1, rh - 1);
    label(c, title, x, y - 12, { size: 14, ls: 2, color: ink(o.dark), weight: 700 });
    if (o.sub) label(c, o.sub, x, y + rh + 22, { size: 13, ls: 2, color: o.dark ? 'rgba(236,232,223,0.62)' : P.mute });
    c.restore();
  }
  /* A block of mono lines on a translucent panel. lines: [text, bold?] */
  function panel(c, x, y, wd, lines, o = {}) {
    const lh = 24, ht = lines.length * lh + 28;
    c.save(); c.globalAlpha *= o.on ?? 1;
    c.fillStyle = o.dark ? 'rgba(6,9,16,0.72)' : 'rgba(236,232,223,0.86)'; c.fillRect(x, y, wd, ht);
    c.fillStyle = P.accent; c.fillRect(x, y, 3, ht);
    lines.forEach(([s, b], i) => label(c, s, x + 22, y + 32 + i * lh, { size: b ? 15 : 13, ls: 2, weight: b ? 700 : 400, color: b ? ink(o.dark) : (o.dark ? 'rgba(236,232,223,0.7)' : '#5d5951') }));
    c.restore();
  }
  // vertical split line across the frame with labels either side
  function splitLine(c, u, lt, rt, o = {}) {
    const x = u * FW;
    c.save(); c.globalAlpha *= o.on ?? 1;
    c.fillStyle = o.dark ? 'rgba(0,0,0,0.5)' : 'rgba(236,232,223,0.7)'; c.fillRect(x - 3, 0, 6, FH);
    c.fillStyle = P.accent; c.fillRect(x - 1.5, 0, 3, FH);
    const y = o.y ?? 150;
    if (lt) label(c, lt, x - 20, y, { align: 'right', size: 16, color: ink(o.dark), weight: 700 });
    if (rt) label(c, rt, x + 20, y, { size: 16, color: ink(o.dark && !o.rightLight), weight: 700 });
    c.restore();
  }

  /* =====================================================================
     AMBIENT OCCLUSION — how much of the sky a point can see. For each
     shaded point the kit's distance field is sampled N times along the
     surface normal at heights h = R·i/N; wherever the scene's distance at
     a sample is less than h, something is nearby and the point is darkened
     in proportion. First the pass alone (white objects, grey creases), its
     radius R stepping up on the beat from tight contact shadows to broad
     soft pools, the samples drawn at the cube's base with their distance
     circles; then the pass is wiped into the colour render, multiplying
     its ambient light, and a split against the same light without AO
     shows what it buys: weight, contact and creases.
     ===================================================================== */
  const AO_STEPS = [0.05, 0.1, 0.18, 0.28, 0.42, 0.6, 0.85], AO_N = [3, 4, 4, 5, 6, 8, 8];
  const AO_KEYS = (() => {
    const k = [[0, AO_STEPS[0]]];
    for (let b = 1; b < AO_STEPS.length; b++) { k.push([b * BEAT, AO_STEPS[b - 1]]); k.push([b * BEAT + 0.32, AO_STEPS[b], E.outC]); }
    k.push([4.95, 0.85]); k.push([5.55, 0.32, E.ioC]);
    return k;
  })();
  const aoRad = t => kf(t, AO_KEYS);
  const aoStep = t => (t >= 5.2 ? -1 : Math.min(AO_STEPS.length - 1, Math.floor(t / BEAT)));
  const aoSamples = t => (aoStep(t) < 0 ? 6 : AO_N[aoStep(t)]);
  const AO_BG = [0.83, 0.828, 0.82];
  const AO_PT = [2.75 + Math.sin(0.55) * 0.6, 0, -0.55 + Math.cos(0.55) * 0.6];   // floor point by the cube's front face
  const aoWipe = t => E.ioC(seg(t, 5.6, 6.9)) * 1.03;
  const aoSplit = t => 0.46 * E.outC(seg(t, 7.05, 7.8)) + 0.17 * Math.sin(Math.max(0, t - 7.8) * 1.5);
  /* Normalised SDF occlusion: each sample counts (h − d) / h, nearer samples weigh more. */
  function aoR(p, n, S, R, N) {
    let occ = 0, ws = 0;
    for (let i = 1; i <= N; i++) {
      const h = R * i / N, d = LK.map([p[0] + n[0] * h, p[1] + n[1] * h, p[2] + n[2] * h], S), w = 1 / Math.sqrt(i);
      occ += w * clamp((h - d) / h); ws += w;
    }
    return clamp(1 - 1.0 * occ / ws, 0.1, 1);
  }
  function aoColour(g, S, occ, useAO) {
    const a = LK.albedo(g.id), n = g.n;
    let dif = Math.max(0, dot(n, LK.KEY));
    if (dif > 0) dif *= LK.shadow(add(g.p, mul(n, 0.01)), LK.KEY, S, 12);
    const sky = 0.55 + 0.45 * n[1], fill = Math.max(0, dot(n, LK.FILL)) * 0.3;
    const k = 0.78 * dif + (0.74 * sky + fill) * (useAO ? occ : 1);
    const c = LK.tone([a[0] * k, a[1] * k, a[2] * k], 1.3);
    return g.id === 0 ? LK.floorFade(c, g) : c;
  }

  MG.film({
    id: 'lookao', dur: 10, poster: 8.6,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Ambient Occlusion', sub: 'How much sky each point can see', era: '2001 —',
      origin: 'Ambient occlusion approximates the soft darkening of creases and contact points under even sky light by measuring how open each point is, without simulating full global illumination. Zhukov, Iones and Kronin described the related idea of obscurances in 1998; Hayden Landis and colleagues at ILM brought ambient occlusion into feature production around Pearl Harbor (2001) and documented it in the SIGGRAPH 2002 course on production global illumination. Crytek’s screen-space AO in Crysis (2007) made it a real-time staple.',
      works: 'Pearl Harbor (Michael Bay, 2001; ILM ambient occlusion) · Crysis (Crytek, 2007; screen-space AO) · StarCraft II (Blizzard, 2010; SSAO in its effects pipeline)',
      tech: ['Occlusion sampled along the normal', 'Radius and sample count', 'AO multiplies the ambient term'],
      accent: '#8f8a80',
      motionDNA: 'The camera makes the shared 50° orbit while the AO radius steps up once per beat, 0.05 to 0.85 world units, with the sample count rising from 3 to 8, then eases back to 0.32. A wipe then carries the pass into the colour render, and a split line slides in from the left to show the same light without AO.',
      visualDNA: 'A white clay world: white objects and floor with grey contact shadows under the sphere and cube, a soft pool beneath the hovering Token, dark rings in its hole. Sample dots climb the normal by the cube with circles showing the distance field. In the colour half the orange Token, white sphere and blue cube sit firmly on the floor; on the no-AO side they float.',
      transitions: 'Radius steps on the beat; a vertical wipe from pass to colour; a before / after split',
      implementation: ['Ray-traced AO pass (RenderMan, Arnold, V-Ray)', 'SSAO / HBAO / GTAO on the depth buffer in game engines', 'Canvas 2D + SDF tracer (js/look-kit.js): N distance-field lookups along the normal per pixel, multiplied into the ambient term'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { ao: new Float32Array(800 * 450) }; },
    draw(c, t, W, H, st) {
      const R = aoRad(t), N = aoSamples(t), wipe = aoWipe(t), split = aoSplit(t), buf = st.ao;
      const shade = (g, S) => {
        if (!g.hit) { buf[g.i] = AO_BG[0]; return g.u < wipe ? LK.BG : AO_BG; }
        const occ = aoR(g.p, g.n, S, R, N), v = 0.97 * occ * (0.74 + 0.26 * (0.5 + 0.5 * g.n[1]));
        buf[g.i] = g.id === 0 ? LK.floorFade([v, v, v], g, AO_BG)[0] : v;
        if (g.u >= wipe) {   // the pass on its own
          const cc = [v, v, v * 0.995];
          return g.id === 0 ? LK.floorFade(cc, g, AO_BG) : cc;
        }
        return aoColour(g, S, occ, g.u >= split);
      };
      const { S } = LK.render(c, t, W, H, shade);

      // sample diagram by the cube's base: dots up the normal, each with its distance circle
      const dg = seg(t, 0.5, 0.9) * (1 - seg(t, 5.4, 5.8));
      if (dg > 0.01) {
        c.save(); c.globalAlpha = dg;
        const f = 1 / Math.tan(S.cam.fov / 2) * FH / 2;
        const b = LK.project(S, AO_PT, W, H);
        let top = b;
        for (let i = 1; i <= N; i++) {
          const h = R * i / N, q = [AO_PT[0], h, AO_PT[2]], pr = LK.project(S, q, W, H), d = LK.map(q, S);
          if (!pr) continue;
          const rr = Math.max(2, d / pr[2] * f), hit = d < h;
          c.strokeStyle = hit ? 'rgba(255,90,31,0.55)' : 'rgba(23,24,28,0.25)'; c.lineWidth = 1.2;
          c.beginPath(); c.arc(pr[0], pr[1], rr, 0, TAU); c.stroke();
          c.fillStyle = hit ? P.accent : P.ink; c.beginPath(); c.arc(pr[0], pr[1], 4.5, 0, TAU); c.fill();
          top = pr;
        }
        c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(b[0], b[1]); c.lineTo(top[0], top[1]); c.stroke();
        c.fillStyle = P.ink; c.beginPath(); c.arc(b[0], b[1], 6, 0, TAU); c.fill();
        label(c, 'n', b[0] - 18, (b[1] + top[1]) / 2, { align: 'right', size: 16, color: P.ink, weight: 700 });
        label(c, `SAMPLE h = R·i/N  ·  ORANGE: d(h) < h`, b[0] - 10, b[1] + 64, { size: 14, ls: 2, color: P.ink, weight: 700, align: 'right' });
        label(c, 'CIRCLE = DISTANCE TO NEAREST SURFACE', b[0] - 10, b[1] + 86, { size: 13, ls: 2, color: '#5d5951', align: 'right' });
        c.restore();
      }
      // leader labels in the pass
      const lb = seg(t, 1.3, 1.7) * (1 - seg(t, 5.4, 5.8));
      lead(c, S, tokW(S, [0.4 + 0.335, 0.4, 0.08]), 'HOLE WALL · CREASE', 170, -150, { on: lb });
      lead(c, S, [0.15, 0, 0.35], 'UNDER THE TOKEN', 240, 120, { on: lb * seg(t, 2.2, 2.6), sub: 'GAP 0.6 · NEEDS R > 0.6' });
      lead(c, S, [LK.SPH.c[0] + 0.2, 0.02, LK.SPH.c[2] + 0.78], 'CONTACT', -120, -330, { on: lb });

      // tags + readouts
      if (t < 5.6) {
        tag(c, 'AO PASS  ·  WHITE WORLD, SKY LIGHT ONLY', 72, 80, seg(t, 0.1, 0.5));
        label(c, `RADIUS R  ${R.toFixed(2)}`, 98, 122, { size: 22, color: P.ink, weight: 700 });
        label(c, `SAMPLES N  ${N}`, 98, 152, { size: 22, color: P.ink, weight: 700 });
        // radius bar with step ticks
        c.fillStyle = 'rgba(23,24,28,0.14)'; c.fillRect(98, 172, 320, 3);
        c.fillStyle = P.accent; c.fillRect(98, 172, 320 * R / 0.85, 3);
        AO_STEPS.forEach(v => c.fillRect(98 + 320 * v / 0.85 - 0.5, 166, 1, 9));
        if (t > 4.95) label(c, 'SETTLE · R 0.32', 98, 204, { size: 15, color: P.accent, weight: 700 });
      } else if (t < 7.05) {
        tag(c, 'COLOUR  =  DIRECT  +  AMBIENT × AO', 72, 80, 1);
        splitLine(c, wipe, 'COLOUR × AO', 'AO PASS', { on: 1 - seg(t, 6.8, 7.0) });
      } else {
        tag(c, 'BEFORE / AFTER  ·  SAME LIGHT', 72, 80, 1);
        splitLine(c, split, 'NO AO · FLOATING', '× AO · GROUNDED', { on: seg(t, 7.1, 7.3), y: 980 - 260 });
      }
      // AO pass inset during the colour phases
      const ins = seg(t, 5.7, 6.1);
      if (ins > 0) inset(c, 'ao', 800, 450, 3, i => { const v = buf[i] * 255; return [v, v, v]; }, [W - 72 - 320, 110, 320, 180], 'AO PASS  ×', { on: ins, sub: `R ${R.toFixed(2)} · N ${N}` });
      panel(c, 72, 120, 520, [
        ['AO, THREE WAYS', true],
        ['SCREEN-SPACE (SSAO) · DEPTH BUFFER ONLY', false],
        ['  FAST; BLIND TO WHAT IS OFF SCREEN', false],
        ['RAY-TRACED · HEMISPHERE RAYS PER PIXEL', false],
        ['  EXACT BUT NOISY; NEEDS MANY RAYS', false],
        ['SDF (THIS FILM) · N STEPS ALONG THE NORMAL', true],
        ['  READS THE DISTANCE FIELD; NO NOISE', false],
      ], { on: seg(t, 7.4, 7.9) });
      LK.caption(c, t, W, H, { name: 'Ambient Occlusion', cat: 'Shading', curve: u => aoRad(u * 10) / 0.85, span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'AO RADIUS / TIME' });
    },
    score(A) {
      LK.bed(A);
      // one soft pluck per radius step, rising, with a breath of filtered noise that opens with R
      for (let b = 1; b < AO_STEPS.length; b++) {
        const t = b * BEAT;
        A.pluck(t, midi([64, 67, 69, 71, 74, 76][b - 1]), { g: 0.11, bright: 0.45, dur: 1.3, rev: 0.35 });
        A.noise(t, { type: 'lowpass', f: 300 + b * 260, dur: 0.5, g: 0.035, swell: 0.4, rev: 0.4 });
      }
      A.osc(4.95, { type: 'triangle', f: midi(76), f2: midi(69), glide: 0.6, dur: 0.7, g: 0.04, lp: 1800, rev: 0.4 });
      // the wipe into colour, the split, the note
      A.whoosh(5.6, 1.3, { f1: 220, f2: 2800, q: 1.1, g: 0.11, swell: 0.6, pan: 0.2 });
      A.chord(6.9, [57, 64, 69, 72], { type: 'triangle', dur: 2.2, g: 0.035, a: 0.3, lp: 1800, rev: 0.6, width: 0.8 });
      A.whoosh(7.05, 0.7, { f1: 500, f2: 1600, q: 2, g: 0.08, swell: 0.5, pan: -0.4 });
      A.bell(7.8, midi(81), { g: 0.06, dur: 1.6, rev: 0.5 });
      A.kick(7.8, 0.3, { f: 100, f2: 40, dur: 0.5 });
    },
  });

  /* =====================================================================
     FRESNEL X-RAY — the hologram look. Every surface a camera ray passes
     through, front faces and the back faces behind them, adds light in
     proportion to an edge term (1 − |n·v|)^p: zero where the surface faces
     the eye, one where it turns away (the silhouette). On a dark ground the
     bodies vanish and only their rims, hole walls and far sides glow. The
     ray continues through each object (traceInside to its exit, then on),
     losing a little each time, down to a faint floor grid. The exponent p
     steps on the beat (soft ghost, thin rims, solid glow, settled), the hue
     drifts cyan → violet → amber, with bloom and faint scanlines on top.
     ===================================================================== */
  const XP = [[0, 1.5], [2.0, 1.5], [2.3, 3.2, E.outC], [3.45, 3.2], [3.75, 6.5, E.outC], [4.9, 6.5], [5.2, 0.75, E.outC], [6.35, 0.75], [6.7, 2.4, E.outC]];
  const xpAt = t => kf(t, XP);
  const XHUE = [[0, 0], [5.0, 0], [6.3, 1], [7.6, 1], [8.6, 2]];
  const XCOL = [[0.25, 0.86, 1.0], [0.72, 0.36, 1.0], [1.0, 0.58, 0.2]], XNAME = ['CYAN', 'VIOLET', 'AMBER'];
  const xHue = t => { const h = kf(t, XHUE), i = Math.min(1, Math.floor(h)); return LK.mix3(XCOL[i], XCOL[i + 1], h - i); };
  const xWipe = t => E.ioC(seg(t, 0.35, 1.6)) * 1.03;
  const XG = [0.012, 0.018, 0.035];   // ground
  function xGround(g) {
    const v = g.v, k = 1 - 0.55 * v;
    return [XG[0] * k + 0.01 * (1 - v), XG[1] * k + 0.012 * (1 - v), XG[2] * k + 0.02 * (1 - v)];
  }
  function xGrid(p, rd, dist) {
    const fw = 0.0022 * dist / Math.max(0.12, Math.abs(rd[1]));
    const gx = Math.abs(p[0] * 2 - Math.round(p[0] * 2)) / 2, gz = Math.abs(p[2] * 2 - Math.round(p[2] * 2)) / 2;
    const line = Math.max(clamp(1 - gx / fw), clamp(1 - gz / fw));
    const fade = (1 - clamp((dist - 4) / 16)) * clamp(-rd[1] / 0.12);
    const pool = Math.exp(-(p[0] * p[0] + p[2] * p[2]) / 9);
    return (line * 0.22 + pool * 0.05) * fade;
  }
  /* Accumulate the edge term over every surface along the ray. */
  function xray(g, S, p, col, nv) {
    const bg = xGround(g);
    if (!g.hit) return bg;
    const ro0 = S.cam.pos, rd = g.d;
    let id = g.id, pt = g.p, n = g.n, w = 1, r = 0, gg = 0, b = 0;
    for (let k = 0; k < 7; k++) {
      if (id === 0) { const e = xGrid(pt, rd, len(sub(pt, ro0))) * w; r += col[0] * e; gg += col[1] * e; b += col[2] * e; break; }
      const ndv = Math.abs(dot(n, rd));
      if (k === 0 && nv) nv[g.i] = ndv;
      const e = Math.pow(1 - ndv, p) * 1.05 + 0.03, tint = id === 1 ? 1 : id === 2 ? 0.85 : 0.75;
      const ex = LK.traceInside(id, pt, rd, S);
      const e2 = Math.pow(1 - Math.abs(dot(ex.n, rd)), p) * 0.6;
      const s = (e + e2) * w * tint;
      // a touch of white in the hottest rims
      const hot = Math.pow(1 - ndv, p * 3) * 0.35 * w;
      r += col[0] * s + hot; gg += col[1] * s + hot; b += col[2] * s + hot;
      w *= 0.72;
      const nx = LK.trace(add(ex.p, mul(rd, 0.006)), rd, S);
      if (!nx.hit) break;
      id = nx.id; pt = nx.p; n = LK.normal(pt, id, S);
    }
    if (g.id === 0 && nv) nv[g.i] = -1;
    // soft clip of the added light
    return [bg[0] + 1 - Math.exp(-r), bg[1] + 1 - Math.exp(-gg), bg[2] + 1 - Math.exp(-b)];
  }
  /* Bloom: threshold, 1/4 downsample, two box blurs, bilinear add back. Then seeded grain. */
  function xPost(rgb, G, st, t, wipe) {
    const { w, h } = G, s = 4, bw = w / s | 0, bh = h / s | 0, B = st.bl, T = st.bt;
    B.fill(0);
    for (let y = 0; y < bh * s; y++) for (let x = 0; x < bw * s; x++) {
      const i = (y * w + x) * 3, j = ((y / s | 0) * bw + (x / s | 0)) * 3;
      for (let k = 0; k < 3; k++) B[j + k] += Math.max(0, rgb[i + k] - 0.3) / (s * s);
    }
    const R = 3;
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < bh; y++) for (let k = 0; k < 3; k++) {   // horizontal
        let acc = 0;
        for (let x = -R; x <= R; x++) acc += B[(y * bw + clamp(x, 0, bw - 1)) * 3 + k];
        for (let x = 0; x < bw; x++) {
          T[(y * bw + x) * 3 + k] = acc / (2 * R + 1);
          acc += B[(y * bw + Math.min(bw - 1, x + R + 1)) * 3 + k] - B[(y * bw + Math.max(0, x - R)) * 3 + k];
        }
      }
      for (let x = 0; x < bw; x++) for (let k = 0; k < 3; k++) {   // vertical
        let acc = 0;
        for (let y = -R; y <= R; y++) acc += T[(clamp(y, 0, bh - 1) * bw + x) * 3 + k];
        for (let y = 0; y < bh; y++) {
          B[(y * bw + x) * 3 + k] = acc / (2 * R + 1);
          acc += T[(Math.min(bh - 1, y + R + 1) * bw + x) * 3 + k] - T[(Math.max(0, y - R) * bw + x) * 3 + k];
        }
      }
    }
    const fr = Math.floor(t * 30), x0 = wipe * w;
    for (let y = 0; y < h; y++) {
      const fy = clamp((y + 0.5) / s - 0.5, 0, bh - 1.001), y0 = fy | 0, ty = fy - y0;
      for (let x = 0; x < w; x++) {
        if (x >= x0) continue;
        const fx = clamp((x + 0.5) / s - 0.5, 0, bw - 1.001), xa = fx | 0, tx = fx - xa, i = (y * w + x) * 3;
        const a = (y0 * bw + xa) * 3, b2 = a + 3, c2 = a + bw * 3, d2 = c2 + 3;
        const gr = (hash(x * 0.137 + y * 1.731 + fr * 7.31) - 0.5) * 0.03;
        for (let k = 0; k < 3; k++) {
          const v = lerp(lerp(B[a + k], B[b2 + k], tx), lerp(B[c2 + k], B[d2 + k], tx), ty);
          rgb[i + k] += v * 1.6 + gr;
        }
      }
    }
  }

  MG.film({
    id: 'lookxray', dur: 10, poster: 7.0,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Fresnel X-ray', sub: 'Light only where surfaces turn away', era: '1990s —',
      origin: 'Fresnel’s equations (Augustin-Jean Fresnel, 1820s) say surfaces reflect more as they turn edge-on to the eye, and Christophe Schlick’s 1994 approximation reduced that rise to a cheap power of (1 − cos θ). Driven by the facing ratio |n·v| and added onto black with depth testing off, the same edge term draws only an object’s rims, hole walls and far sides: the see-through hologram and x-ray look of film interfaces and game vision modes.',
      works: 'Iron Man (Jon Favreau, 2008; holographic workshop interfaces) · Batman: Arkham Asylum (Rocksteady, 2009; Detective Mode) · Prometheus (Ridley Scott, 2012; holographic star map)',
      tech: ['Facing-ratio edge term (1 − |n·v|)^p', 'Additive, through every surface', 'Bloom and faint scanlines'],
      accent: '#3fdcff',
      motionDNA: 'After a wipe from the plain render, the camera makes the shared orbit while the exponent p steps on the beat: 1.5 (a soft ghost), 3.2, 6.5 (thin wire-like rims), 0.75 (a solid glow), settling at 2.4. The hue drifts from cyan to violet, then to amber; a slow scan band rolls down the frame.',
      visualDNA: 'Near-black blue ground with a faint glowing floor grid that shows through the objects. The Token, sphere and cube are drawn only as glowing rims, with their back faces and the Token’s hole wall visible through the front faces, plus bloom on the brightest edges. Two dark insets show |n·v| and the edge term.',
      transitions: 'A vertical wipe from plain to x-ray; exponent steps on the beat; hue crossfades',
      implementation: ['Fresnel / facing-ratio shader with additive blending (Unity, Unreal)', 'Rim or “x-ray” material in a DCC (Maya, Blender facing-ratio node)', 'Canvas 2D + SDF tracer (js/look-kit.js): each ray walks every surface via LK.trace and LK.traceInside, summing the edge term, then bloom'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { nv: new Float32Array(800 * 450), bl: new Float32Array(200 * 112 * 3), bt: new Float32Array(200 * 112 * 3) }; },
    draw(c, t, W, H, st) {
      const p = xpAt(t), col = xHue(t), wipe = xWipe(t), nv = st.nv;
      nv.fill(-1);
      const shade = (g, S) => (g.u < wipe ? xray(g, S, p, col, nv) : LK.plain(g, S));
      const { S } = LK.render(c, t, W, H, shade, { post: (rgb, G) => xPost(rgb, G, st, t, wipe) });
      // scanlines and a rolling band, over the x-ray side only
      const xw = wipe * W;
      if (xw > 1) {
        c.save(); c.beginPath(); c.rect(0, 0, Math.min(W, xw), H); c.clip();
        c.fillStyle = 'rgba(0,0,0,0.16)';
        for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1.5);
        const by = ((t * 210) % 1500) - 200, gr = c.createLinearGradient(0, by - 90, 0, by + 90);
        const cs = `${Math.round(col[0] * 255)},${Math.round(col[1] * 255)},${Math.round(col[2] * 255)}`;
        gr.addColorStop(0, `rgba(${cs},0)`); gr.addColorStop(0.5, `rgba(${cs},0.045)`); gr.addColorStop(1, `rgba(${cs},0)`);
        c.fillStyle = gr; c.fillRect(0, by - 90, W, 180);
        c.restore();
      }
      if (t < 1.75) splitLine(c, wipe, 'X-RAY', 'PLAIN', { on: seg(t, 0.3, 0.45) * (1 - seg(t, 1.55, 1.75)), dark: true, rightLight: true });
      const csl = `rgb(${col.map(v => Math.round(lerp(v, 1, 0.35) * 255)).join(',')})`;
      // leader labels
      const lb = seg(t, 1.9, 2.3) * (1 - seg(t, 8.8, 9.2));
      const sil = add(LK.SPH.c, mul(S.cam.up, LK.SPH.r * 0.97));
      lead(c, S, sil, 'SILHOUETTE · n ⊥ v', 40, -190, { on: lb, color: P.paper, sub: '|n·v| → 0 · EDGE → 1', subColor: csl });
      lead(c, S, add(LK.SPH.c, mul(S.cam.fw, -LK.SPH.r)), 'FACING · n ∥ v', 220, 170, { on: lb * seg(t, 2.4, 2.8), color: P.paper, sub: '|n·v| → 1 · EDGE → 0', subColor: csl });
      lead(c, S, tokW(S, [0.4 - 0.34, 0.4, 0]), 'HOLE WALL', 220, -200, { on: lb * seg(t, 3.0, 3.4), color: P.paper, sub: 'INNER SURFACE, SEEN THROUGH', subColor: csl });
      lead(c, S, add(LK.CUBE.c, [0, 0.2, 0]), 'BACK FACES', -200, 210, { on: lb * seg(t, 3.6, 4.0), color: P.paper, sub: 'RAY WALKS ON · ×0.72 PER LAYER', subColor: csl });
      // tag + readouts
      tag(c, 'ADDITIVE EDGE TERM  ·  EVERY SURFACE ON THE RAY', 72, 80, seg(t, 1.2, 1.6), true);
      if (t > 1.2) {
        const on = seg(t, 1.2, 1.6);
        c.save(); c.globalAlpha = on;
        label(c, `EXPONENT p  ${p.toFixed(2)}`, 98, 122, { size: 22, color: P.paper, weight: 700 });
        label(c, `HUE  ${XNAME[Math.round(kf(t, XHUE))]}`, 98, 152, { size: 22, color: csl, weight: 700 });
        label(c, 'L  +=  colour · (1 − |n·v|)^p', 98, 190, { size: 16, color: 'rgba(236,232,223,0.75)' });
        c.restore();
      }
      const io = seg(t, 2.6, 3.0);
      if (io > 0) {
        const s = 255;
        inset(c, 'nv', 800, 450, 3, i => { const v = nv[i]; if (v < 0) return [6, 9, 16]; const q = v * 220; return [q, q, q]; }, [W - 72 - 300, 110, 300, 169], '|n·v|  FACING RATIO', { on: io, dark: true });
        inset(c, 'ed', 800, 450, 3, i => { const v = nv[i]; if (v < 0) return [6, 9, 16]; const e = Math.pow(1 - v, p); return [col[0] * e * s, col[1] * e * s, col[2] * e * s]; }, [W - 72 - 300, 330, 300, 169], `(1 − |n·v|)^${p.toFixed(1)}`, { on: io, dark: true, sub: 'FRONT SURFACE ONLY' });
      }
      const bt = Math.floor(t / BEAT);
      LK.caption(c, t, W, H, { name: 'Fresnel X-ray', cat: 'Shading', dark: true, curve: u => Math.pow(1 - u, p), span: [bt * BEAT, (bt + 1) * BEAT], lo: -0.1, hi: 1.15, curveLabel: 'EDGE TERM / |n·v|' });
    },
    score(A) {
      LK.bed(A, { g: 0.85 });
      // the hologram hum: a low sine pair with slow vibrato, opening with the wipe
      A.osc(0.35, { f: 110, dur: 9.4, g: 0.035, a: 1.2, vib: [0.35, 1.5], rev: 0.3, hold: true });
      A.osc(0.35, { type: 'triangle', f: 165, dur: 9.4, g: 0.018, a: 1.6, vib: [0.27, 2], lp: 900, rev: 0.4, hold: true });
      A.noise(0.35, { type: 'bandpass', f: 400, f2: 5000, sweep: 1.25, q: 3, dur: 1.3, g: 0.08, swell: 0.6, rev: 0.4 });
      // a glassy ping at each exponent step, pitched by p
      [[2.0, 79], [3.45, 86], [4.9, 74], [6.35, 81]].forEach(([t, m], i) => {
        A.bell(t, midi(m), { g: 0.06, dur: 1.8, rev: 0.6, pan: i % 2 ? 0.35 : -0.35 });
        A.osc(t, { type: 'sine', f: midi(m - 12), f2: midi(m - 24), glide: 0.3, dur: 0.35, g: 0.04 });
      });
      // hue shifts: a slow filtered swell
      A.whoosh(5.0, 1.3, { f1: 300, f2: 1400, q: 4, g: 0.06, swell: 0.7, rev: 0.6 });
      A.whoosh(7.6, 1.0, { f1: 900, f2: 2600, q: 4, g: 0.06, swell: 0.7, rev: 0.6 });
      A.chord(8.6, [57, 64, 69, 76], { type: 'triangle', dur: 1.6, g: 0.035, a: 0.2, lp: 2200, rev: 0.7, width: 0.9 });
    },
  });

  /* =====================================================================
     WIREFRAME — the scene is a distance field, so there is no mesh whose
     edges could be drawn. Instead each object gets analytic wire geometry
     in its own frame: latitude and longitude rings on the sphere, a 4 × 4
     grid on every face of the cube plus its rounded edges, and on the Token
     five contour loops round the outside and the hole (front edge, two
     shoulder lines on the rounded edge, the mid-line, the back edge), cross
     profiles and a face grid; a 0.5-unit grid on the floor. Every polyline
     point is moved into world space with the object, projected with
     LK.project, and kept only if its distance to the eye is no more than
     the G-buffer depth under it plus a small ε: hidden-line removal by
     depth test. The test is toggled off, on and to dashed, then the wires
     are drawn over the shaded render.
     ===================================================================== */
  /* Rounded rect (square half 1, corner 0.44) as base points on the inner square plus outward
     normals, so contour at radius ρ = base + normal · ρ. */
  const WR = (() => {
    const a = LK.TOK.half - LK.TOK.corner, out = [], nS = 6, nA = 10;
    const corners = [[a, a, 0], [-a, a, Math.PI / 2], [-a, -a, Math.PI], [a, -a, Math.PI * 1.5]];
    corners.forEach(([cx, cy, a0], k) => {
      for (let i = 0; i < nA; i++) { const an = a0 + i / nA * Math.PI / 2; out.push([cx, cy, Math.cos(an), Math.sin(an)]); }
      const [nx, ny] = corners[(k + 1) % 4], an = a0 + Math.PI / 2, dx = Math.cos(an), dy = Math.sin(an);
      for (let i = 0; i < nS; i++) { const u = i / nS; out.push([lerp(cx, nx, u), lerp(cy, ny, u), dx, dy]); }
    });
    return out;
  })();
  const W_HOLE = 36;
  const W_LOOPS = (() => {   // [d2, z] for the five contour loops
    const T = LK.TOK, e = T.edge, zc = T.depth - e, k = 1 - Math.SQRT1_2;
    return [[-e, T.depth], [-e * k, zc + e * Math.SQRT1_2], [0, 0], [-e * k, -(zc + e * Math.SQRT1_2)], [-e, -T.depth]];
  })();
  function wTokenLines(S) {
    const T = LK.TOK, L = [];
    const outer = (i, d2, z) => { const b = WR[i % WR.length], r = T.corner + d2; return tokW(S, [b[0] + b[2] * r, b[1] + b[3] * r, z]); };
    const hole = (i, d2, z) => { const an = i / W_HOLE * TAU, r = T.holeR - d2; return tokW(S, [T.hole[0] + Math.cos(an) * r, T.hole[1] + Math.sin(an) * r, z]); };
    for (const [d2, z] of W_LOOPS) {
      const a = [], h = [];
      for (let i = 0; i <= WR.length; i++) a.push(outer(i, d2, z));
      for (let i = 0; i <= W_HOLE; i++) h.push(hole(i, d2, z));
      L.push(a, h);
    }
    // cross profiles over the rounded edge: front arc, flat side, back arc
    const zc = T.depth - T.edge;
    const pr = []; for (let i = 0; i <= 6; i++) { const ph = Math.PI / 2 - i / 6 * Math.PI / 2; pr.push([-T.edge + T.edge * Math.cos(ph), zc + T.edge * Math.sin(ph)]); }
    pr.push([0, 0]);
    for (let i = 0; i <= 6; i++) { const ph = -i / 6 * Math.PI / 2; pr.push([-T.edge + T.edge * Math.cos(ph), -zc + T.edge * Math.sin(ph)]); }
    for (let i = 0; i < WR.length; i += 2) L.push(pr.map(([d2, z]) => outer(i, d2, z)));
    for (let i = 0; i < W_HOLE; i += 3) L.push(pr.map(([d2, z]) => hole(i, d2, z)));
    // face grid, front and back, inside the flat face only
    const inFace = (x, y) => {
      const ax = Math.abs(x) - (T.half - T.corner), ay = Math.abs(y) - (T.half - T.corner);
      let d2 = Math.hypot(Math.max(ax, 0), Math.max(ay, 0)) + Math.min(Math.max(ax, ay), 0) - T.corner;
      d2 = Math.max(d2, T.holeR - Math.hypot(x - T.hole[0], y - T.hole[1]));
      return d2 <= -T.edge - 0.004;
    };
    for (const z of [T.depth, -T.depth]) for (let k = -3; k <= 3; k++) for (const axis of [0, 1]) {
      let run = [];
      for (let s = -1; s <= 1.0001; s += 0.025) {
        const x = axis ? s : k * 0.25, y = axis ? k * 0.25 : s;
        if (inFace(x, y)) run.push(tokW(S, [x, y, z])); else { if (run.length > 1) L.push(run); run = []; }
      }
      if (run.length > 1) L.push(run);
    }
    return L;
  }
  function wCubeLines(S) {
    const C = LK.CUBE, h = C.half, b = h - C.round, eo = b + C.round * Math.SQRT1_2, L = [];
    const P3 = (ax, v) => { const q = [0, 0, 0]; ax.forEach((a, i) => { q[a] = v[i]; }); return cubeW(S, q); };
    for (let ax = 0; ax < 3; ax++) for (const sg of [-1, 1]) {
      const u = (ax + 1) % 3, v = (ax + 2) % 3;
      for (let k = 1; k <= 3; k++) {
        const g = -h + k * 0.25;
        for (const [a1, a2] of [[u, v], [v, u]]) {
          const run = [];
          for (let s = 0; s <= 8; s++) run.push(P3([ax, a1, a2], [sg * h, g, lerp(-b, b, s / 8)]));
          L.push(run);
        }
      }
    }
    // the 12 rounded edges, on the 45° line of the rounding
    for (let ax = 0; ax < 3; ax++) {
      const u = (ax + 1) % 3, v = (ax + 2) % 3;
      for (const su of [-1, 1]) for (const sv of [-1, 1]) {
        const run = [];
        for (let s = 0; s <= 8; s++) run.push(P3([ax, u, v], [lerp(-b, b, s / 8), su * eo, sv * eo]));
        L.push(run);
      }
    }
    return L;
  }
  const W_SPH = (() => {
    const { c, r } = LK.SPH, R = r * 1.002, L = [];
    for (let m = 0; m < 12; m++) {
      const a = m / 12 * Math.PI, run = [];
      for (let i = 0; i <= 48; i++) { const th = i / 48 * TAU; run.push([c[0] + Math.cos(a) * Math.sin(th) * R, c[1] + Math.cos(th) * R, c[2] + Math.sin(a) * Math.sin(th) * R]); }
      L.push(run);
    }
    for (let k = -3; k <= 3; k++) {
      const la = k * Math.PI / 8, y = Math.sin(la) * R, rr = Math.cos(la) * R, run = [];
      for (let i = 0; i <= 64; i++) { const th = i / 64 * TAU; run.push([c[0] + Math.cos(th) * rr, c[1] + y, c[2] + Math.sin(th) * rr]); }
      L.push(run);
    }
    return L;
  })();
  const W_FLOOR = (() => {
    const L = [];
    for (let k = -16; k <= 16; k++) { const run = []; for (let z = -14; z <= 7; z += 0.25) run.push([k * 0.5, 0, z]); L.push(run); }
    for (let k = -28; k <= 14; k++) { const run = []; for (let x = -11; x <= 11; x += 0.25) run.push([x, 0, k * 0.5]); L.push(run); }
    return L;
  })();
  /* The sphere's silhouette from the eye: the circle where the view ray grazes it. */
  function wSphereRim(S) {
    const { c, r } = LK.SPH, d = sub(S.cam.pos, c), D = len(d), a = mul(d, 1 / D);
    const u = norm(V.cross(a, [0, 1, 0])), v = V.cross(u, a), cc = add(c, mul(a, r * r / D)), rr = r * Math.sqrt(1 - r * r / (D * D)) * 1.003, run = [];
    for (let i = 0; i <= 96; i++) { const th = i / 96 * TAU; run.push(add(cc, add(mul(u, Math.cos(th) * rr), mul(v, Math.sin(th) * rr)))); }
    return run;
  }
  /* Per point: screen position, visibility (1 visible, 0 hidden), distance to eye. */
  function wTest(S, G, p) {
    const q = LK.project(S, p, FW, FH);
    if (!q) return null;
    const { w, h, depth } = G, gx = Math.floor(q[0] / FW * w), gy = Math.floor(q[1] / FH * h);
    const dist = len(sub(p, S.cam.pos));
    let dmax = 0;
    for (let y = gy - 1; y <= gy + 1; y++) for (let x = gx - 1; x <= gx + 1; x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) { dmax = Infinity; continue; }
      const d = depth[y * w + x]; if (d > dmax) dmax = d;
    }
    return [q[0], q[1], dist <= dmax + 0.012 + dist * 0.004 ? 1 : 0, dist];
  }
  /* Stroke a group of polylines: visible runs solid; hidden runs per mode ('all' solid, 'dash', 'off'). */
  function wStroke(c, S, G, lines, mode, style, stats) {
    const vis = new Path2D(), hid = new Path2D();
    for (const L of lines) {
      let prev = null;
      for (const p of L) {
        const q = wTest(S, G, p);
        if (style.fade && q) q[4] = style.fade(p, q[3]);
        if (q && prev) {
          stats.n++;
          const v = mode === 'all' || (prev[2] && q[2]);
          if (style.fade && Math.min(prev[4], q[4]) < style.cut) { prev = q; continue; }
          if (v) { stats.v++; vis.moveTo(prev[0], prev[1]); vis.lineTo(q[0], q[1]); }
          else if (mode === 'dash') { hid.moveTo(prev[0], prev[1]); hid.lineTo(q[0], q[1]); }
        }
        prev = q;
      }
    }
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    if (mode === 'dash') { c.setLineDash([5, 7]); c.strokeStyle = style.hid; c.lineWidth = 1.2; c.stroke(hid); c.setLineDash([]); }
    if (style.halo) { c.strokeStyle = style.halo; c.lineWidth = style.w + 2.5; c.stroke(vis); }
    c.strokeStyle = style.col; c.lineWidth = style.w; c.stroke(vis);
    c.restore();
  }
  // floor grid drawn in distance bands so it fades into the backdrop
  function wFloor(c, S, G, mode, col, stats) {
    const bands = [[0, 9, 0.5], [9, 13, 0.32], [13, 18, 0.18], [18, 26, 0.08]];
    const paths = bands.map(() => [new Path2D(), new Path2D()]);
    for (const L of W_FLOOR) {
      let prev = null;
      for (const p of L) {
        const q = wTest(S, G, p);
        if (q && prev && q[0] > -50 && q[0] < FW + 50 && q[1] > -50 && q[1] < FH + 50) {
          const d = (q[3] + prev[3]) / 2, bi = bands.findIndex(b => d >= b[0] && d < b[1]);
          if (bi >= 0) {
            stats.n++;
            const v = mode === 'all' || (prev[2] && q[2]);
            if (v) stats.v++;
            const P2 = paths[bi][v ? 0 : 1];
            if (v || mode === 'dash') { P2.moveTo(prev[0], prev[1]); P2.lineTo(q[0], q[1]); }
          }
        }
        prev = q;
      }
    }
    c.save();
    bands.forEach((b, i) => {
      c.globalAlpha = b[2]; c.strokeStyle = col; c.lineWidth = 1.1; c.stroke(paths[i][0]);
      if (mode === 'dash') { c.globalAlpha = b[2] * 0.4; c.setLineDash([4, 7]); c.stroke(paths[i][1]); c.setLineDash([]); }
    });
    c.restore();
  }
  // timeline: [t0, mode, title]
  const WM = [[0, 'off', ''], [1.45, 'all', 'NO DEPTH TEST  ·  EVERY LINE'], [2.9, 'off', 'HIDDEN LINES REMOVED'], [4.3, 'dash', 'HIDDEN LINES DASHED'], [5.75, 'off', 'WIRE OVER SHADED'], [8.0, 'dash', 'WIRE OVER SHADED  ·  HIDDEN DASHED'], [8.85, 'off', 'WIRE OVER SHADED']];
  const wMode = t => { let m = WM[0]; for (const k of WM) if (t >= k[0]) m = k; return m; };
  const wWipe = t => E.ioC(seg(t, 0.3, 1.4)) * 1.03;
  const wShaded = t => E.ioS(seg(t, 5.75, 6.6));
  const W_FLAT = [0.975, 0.968, 0.952];

  MG.film({
    id: 'lookwire', dur: 10, poster: 4.9,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Wireframe', sub: 'Edges only, hidden lines removed', era: '1963 —',
      origin: 'Computer graphics began as lines: Ivan Sutherland’s Sketchpad (1963) drew on a vector display, and Lawrence Roberts’s 1963 MIT thesis gave one of the first methods for removing the lines a solid would hide. Arthur Appel at IBM followed in 1967 with quantitative invisibility. Vector arcade games and early film graphics made the wireframe a look in its own right, and it remains the modelling view of every 3D package.',
      works: 'Star Wars (George Lucas, 1977; Larry Cuba’s Death Star briefing animation) · Battlezone (Atari, 1980; vector wireframe arcade game) · Elite (David Braben and Ian Bell, Acornsoft, 1984; wireframe ships with hidden-line removal)',
      tech: ['Analytic wire geometry, projected', 'Hidden-line removal by depth test', 'Wire over shaded'],
      accent: '#17181c',
      motionDNA: 'A wipe turns the plain render into ink wires on paper; the camera makes the shared orbit while the hidden-line test switches every two beats: off (every line, front and back, a tangle), on (hidden lines removed), dashed (hidden lines shown faint). The shaded render then fades in under the wires, and the test flips to dashed and back once more near the end.',
      visualDNA: 'Warm paper with near-white solids; ink silhouette circle, latitude and longitude rings on the sphere, a 4 × 4 grid on each face of the cube in blue, and orange contour loops, cross profiles and a face grid on the Token; a floor grid fading into the backdrop. Over the shaded render the Token and cube wires turn light.',
      transitions: 'A vertical wipe from plain to wire; hidden-line toggles on the beat; a crossfade to wire over shaded',
      implementation: ['Wireframe / hidden-line render modes in DCC viewports (Maya, Blender, Cinema 4D)', 'Barycentric or geometry-shader wireframe over shaded meshes in game engines', 'Canvas 2D + SDF tracer (js/look-kit.js): analytic polylines through LK.project, each point kept if its eye distance ≤ G-buffer depth + ε'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const wipe = wWipe(t), sh = wShaded(t), m = wMode(t), mode = m[1];
      const shade = (g, S) => {
        if (g.u >= wipe) return LK.plain(g, S);
        if (!g.hit) return LK.BG;
        const flat = g.id === 0 ? LK.BG : W_FLAT;
        return sh > 0 ? LK.mix3(flat, LK.plain(g, S), sh) : flat;
      };
      const { G, S } = LK.render(c, t, W, H, shade);

      const stats = { n: 0, v: 0 };
      c.save(); c.beginPath(); c.rect(0, 0, wipe * W, H); c.clip();
      const cs = { tok: mixc(P.accent, '#fff4ea', sh), cube: mixc(P.blue, '#e9eeff', sh), ink: P.ink };
      wFloor(c, S, G, mode, P.ink, stats);
      wStroke(c, S, G, W_SPH, mode, { col: cs.ink, hid: 'rgba(23,24,28,0.3)', w: 1.5 }, stats);
      wStroke(c, S, G, [wSphereRim(S)], mode, { col: cs.ink, hid: 'rgba(23,24,28,0.3)', w: 2.4 }, stats);
      wStroke(c, S, G, wCubeLines(S), mode, { col: cs.cube, hid: 'rgba(47,91,255,0.4)', w: 1.7, halo: sh > 0.5 ? 'rgba(23,24,28,0.25)' : null }, stats);
      wStroke(c, S, G, wTokenLines(S), mode, { col: cs.tok, hid: 'rgba(198,62,12,0.45)', w: 1.8, halo: sh > 0.5 ? 'rgba(120,36,6,0.35)' : null }, stats);
      c.restore();
      if (t < 1.6) splitLine(c, wipe, 'WIRE', 'PLAIN', { on: seg(t, 0.25, 0.4) * (1 - seg(t, 1.35, 1.6)) });

      // explanation
      tag(c, 'NO MESH  ·  WIRES ARE ANALYTIC 3D POLYLINES', 72, 80, seg(t, 0.4, 0.8));
      if (t >= 1.45) {
        const tg = m[2];
        label(c, tg, 98, 122, { size: 22, color: P.ink, weight: 700 });
        label(c, `SEGMENTS ${stats.n.toLocaleString('en-US')}  ·  DRAWN ${stats.v.toLocaleString('en-US')}`, 98, 152, { size: 16, color: '#5d5951' });
        // toggle widget
        const tx = 98, ty = 176, on = mode !== 'all';
        c.fillStyle = on ? P.ink : 'rgba(23,24,28,0.15)'; MG.rrect(c, tx, ty, 64, 28, 14); c.fill();
        c.fillStyle = on ? P.paper : P.ink; c.beginPath(); c.arc(on ? tx + 50 : tx + 14, ty + 14, 10, 0, TAU); c.fill();
        label(c, `HIDDEN-LINE TEST  ${on ? 'ON' : 'OFF'}${mode === 'dash' ? '  ·  DASH' : ''}`, tx + 80, ty + 20, { size: 15, color: P.ink, weight: 700 });
      }
      panel(c, W - 72 - 560, 96, 560, [
        ['HOW THE WIRES ARE MADE', true],
        ['SDF SCENE: NO TRIANGLES, NO EDGES TO DRAW', false],
        ['1  BUILD LINES ON EACH OBJECT IN 3D', false],
        ['2  MOVE WITH THE OBJECT, LK.project TO 2D', false],
        ['3  KEEP POINT IF  |p − eye| ≤ DEPTH + ε', true],
      ], { on: seg(t, 1.6, 2.0) * (1 - seg(t, 5.6, 6.0)) });
      const di = seg(t, 2.9, 3.3) * (1 - seg(t, 5.6, 6.0));
      if (di > 0) inset(c, 'dp', G.w, G.h, 3, i => { const d = G.depth[i], v = d === Infinity ? 250 : clamp((d - 4) / 12) * 200 + 30; return [v, v, v * 0.98]; }, [W - 72 - 320, 300, 320, 180], 'G-BUFFER DEPTH  ·  NEAR = DARK', { on: di });
      // hidden vs visible labels on the sphere
      const lb = seg(t, 3.2, 3.6) * (1 - seg(t, 5.6, 6.0));
      if (lb > 0) {
        const back = add(LK.SPH.c, mul(norm(add(S.cam.fw, mul(S.cam.up, 0.35))), LK.SPH.r)), front = add(LK.SPH.c, mul(norm(sub(mul(S.cam.up, 0.5), S.cam.fw)), LK.SPH.r));
        lead(c, S, front, 'VISIBLE', -90, -140, { on: lb, sub: '|p − eye| = DEPTH' });
        lead(c, S, back, 'HIDDEN', -230, 150, { on: lb * seg(t, 3.6, 4.0), color: P.accent, sub: '|p − eye| > DEPTH', subColor: '#c63e0c' });
      }
      LK.caption(c, t, W, H, { name: 'Wireframe', cat: 'Shading' });
    },
    score(A) {
      LK.bed(A);
      // the wipe: a fast run of pen ticks
      for (let k = 0; k < 14; k++) A.osc(0.35 + k * 0.075, { f: 2600 + (k % 4) * 300, dur: 0.025, g: 0.03, pan: -0.6 + k * 0.09 });
      A.whoosh(0.3, 1.1, { f1: 500, f2: 4200, q: 2, g: 0.07, swell: 0.6 });
      // each toggle: a switch click and a pluck naming the state
      WM.slice(1).forEach(([t, mode], i) => {
        A.noise(t, { type: 'bandpass', f: 3200, q: 2, dur: 0.03, g: 0.12 });
        A.osc(t + 0.012, { f: 1400, dur: 0.02, g: 0.05 });
        A.pluck(t, midi(mode === 'all' ? 62 : mode === 'dash' ? 69 : 74), { g: 0.12, bright: 0.65, dur: 1.1, rev: 0.3, pan: i % 2 ? 0.3 : -0.3 });
      });
      A.osc(1.45, { type: 'sawtooth', f: 220, dur: 1.2, g: 0.012, lp: 900, vib: [6, 4], a: 0.2 });
      // shaded fades in
      A.chord(5.75, [50, 57, 62, 66], { type: 'triangle', dur: 2.6, g: 0.035, a: 0.6, lp: 1600, rev: 0.6, width: 0.8 });
      A.bell(6.6, midi(78), { g: 0.05, dur: 1.6, rev: 0.5 });
    },
  });
})();
