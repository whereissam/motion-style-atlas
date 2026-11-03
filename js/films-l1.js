/* batch l1 — Rendering Looks · Material: lookclay · lookchrome · lookglass.
   lookclay (the clay render: every surface one matte white material under a big soft key and
   strong ambient occlusion, a touch of subsurface warmth at the terminator; plain → clay →
   tinted pastel clay) ·
   lookchrome (mirror metal: one traced reflection bounce per pixel into the scene and a studio
   environment of softboxes, Schlick Fresnel, then roughness stepping up on the beat and the tint
   changing from chrome to gold) ·
   lookglass (refraction through the Token and the sphere: Snell's law in and out, Fresnel
   reflection, Beer–Lambert absorption by thickness and a ball-lens caustic on the floor, the
   index of refraction rising from air to glass to diamond). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, hash, midi, text } = MG;
  const LK = MG.LK, V = LK.V, P = LK.P, KEY = LK.KEY;
  const { add, mul, dot, norm, reflect, refract } = V;
  const mix3 = LK.mix3;

  /* ---------------- shared helpers ---------------- */
  const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const box = (x, half, e) => smooth(-half - e, -half + e, x) * (1 - smooth(half - e, half + e, x));
  const HALO = 'rgba(236,232,223,0.88)';
  const label = (c, s, x, y, o = {}) => text(c, s, x, y, { font: MG.TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base, stroke: o.halo === false ? undefined : HALO, lw: 5 });
  const tag = (c, s, x, y, on = 1) => {   // accent dot + mono label, top-left of frame
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: P.ink, weight: 700, size: 20 });
    c.restore();
  };
  /* Leader-line label pointing at a world point: dot on the object, elbow line, title + note. */
  function callout(c, S, W, H, p, dx, dy, title, sub, on) {
    if (on <= 0.001) return;
    const q = LK.project(S, p, W, H); if (!q) return;
    const x1 = q[0] + dx, y1 = q[1] + dy, dir = dx >= 0 ? 1 : -1, x2 = x1 + dir * 26;
    c.save(); c.globalAlpha *= on; c.lineCap = 'round';
    const path = () => { c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(x1, y1); c.lineTo(x2, y1); c.stroke(); };
    c.strokeStyle = HALO; c.lineWidth = 5; path();
    c.strokeStyle = P.ink; c.lineWidth = 1.6; path();
    c.fillStyle = P.paper; c.beginPath(); c.arc(q[0], q[1], 8, 0, TAU); c.fill();
    c.fillStyle = P.accent; c.beginPath(); c.arc(q[0], q[1], 5, 0, TAU); c.fill();
    const al = dir > 0 ? 'left' : 'right';
    label(c, title, x2 + dir * 10, y1 + 6, { align: al, color: P.ink, weight: 700, size: 18, ls: 2 });
    if (sub) label(c, sub, x2 + dir * 10, y1 + 30, { align: al, size: 14, ls: 1.5, color: '#5d5a54' });
    c.restore();
  }
  /* The moving split between the look (left) and the plain reference (right). */
  function wipeLine(c, sx, W, H, left, right, on = 1) {
    if (on <= 0.001 || sx <= 0.0005 || sx >= 0.9995) return;
    const x = sx * W;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = HALO; c.fillRect(x - 3, 0, 6, H);
    c.fillStyle = P.accent; c.fillRect(x - 1.5, 0, 3, H);
    label(c, left + '  ◀', x - 16, 330, { align: 'right', color: P.ink, weight: 700, size: 16 });
    label(c, '▶  ' + right, x + 16, 330, { color: P.ink, weight: 700, size: 16 });
    c.restore();
  }
  /* Small debug pass top-right: a second, low-resolution render of the same frame. */
  const INS = { w: 320, h: 180, res: [192, 108] };
  function inset(c, t, W, H, k, title, shade, on) {
    if (on <= 0.001) return;
    const x = W - 72 - INS.w, y = 92 + k * (INS.h + 58);
    c.save(); c.globalAlpha *= on;
    c.fillStyle = 'rgba(23,24,28,0.18)'; c.fillRect(x + 6, y + 6, INS.w, INS.h);
    LK.render(c, t, W, H, shade, { res: INS.res, rect: [x, y, INS.w, INS.h], aa: false });
    c.strokeStyle = P.ink; c.lineWidth = 1.5; c.strokeRect(x - 0.75, y - 0.75, INS.w + 1.5, INS.h + 1.5);
    label(c, title, x, y - 12, { size: 14, ls: 2, color: P.ink, weight: 700 });
    c.restore();
  }
  /* A big parameter readout with a ruler under it (named marks along the scale). */
  function readout(c, x, y, name, val, digits, lo, hi, marks, on = 1) {
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    label(c, name, x, y, { size: 15, ls: 3, color: '#5d5a54', weight: 700 });
    text(c, val.toFixed(digits), x - 2, y + 50, { font: MG.TK.MONO, size: 46, weight: 700, color: P.ink, stroke: HALO, lw: 6 });
    const rw = 420, ry = y + 78, X = v => x + (v - lo) / (hi - lo) * rw;
    c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(x, ry, rw, 2);
    for (const [v, s] of marks) {
      c.fillStyle = 'rgba(23,24,28,0.45)'; c.fillRect(X(v) - 0.75, ry - 6, 1.5, 14);
      label(c, s, X(v), ry + 26, { size: 12, ls: 1, align: 'center', color: '#5d5a54' });
    }
    c.fillStyle = P.accent; c.fillRect(x, ry, X(clamp(val, lo, hi)) - x, 2);
    c.beginPath(); c.arc(X(clamp(val, lo, hi)), ry + 1, 7, 0, TAU); c.fill();
    c.restore();
  }
  const pulse = (t, t0, t1, f = 0.35) => seg(t, t0, t0 + f) * (1 - seg(t, t1 - f, t1));

  /* Studio environment for rays that leave the scene: the paper backdrop at the horizon rising
     into a dark ceiling, a big key softbox in the key light's direction, two vertical strip
     lights either side and a low band behind the camera. r (roughness) softens every edge, the
     way a prefiltered environment map does. Values above 1 are lights. */
  const KR = norm(V.cross(KEY, [0, 1, 0])), KU = V.cross(KR, KEY);
  function env(d, r = 0) {
    const y = d[1], az = Math.atan2(d[0], d[2]), el = Math.asin(clamp(y, -1, 1)), e = 0.012 + r * 0.7;
    const DK = [0.1, 0.105, 0.12], back = smooth(-0.35, 0.35, d[2]);
    let c = y >= 0 ? mix3(mix3(LK.BG, DK, smooth(0.04, 0.62, y)), mix3(LK.BG, DK, smooth(0, 0.16, y)), back) : mix3(LK.BG, [0.52, 0.5, 0.47], smooth(0, 0.35, -y));
    const k = dot(d, KEY);
    let L = 0;
    if (k > 0.5) L += 3.4 * box(dot(d, KR), 0.24, e) * box(dot(d, KU), 0.17, e);
    L += 2.6 * box(az + 0.95, 0.075, e) * box(el - 0.36, 0.36, e);
    const LB = 2.2 * box(az - 1.05, 0.06, e) * box(el - 0.32, 0.28, e);
    const LC = 1.5 * box(az, 0.42, e) * box(el - 0.3, 0.055, e);
    return [c[0] + L + LB * 0.92 + LC * 1.06, c[1] + L + LB * 0.97 + LC * 0.98, c[2] + L + LB * 1.08 + LC * 0.86];
  }
  /* Cheap shading for a secondary hit (what a reflection or refraction sees): key + sky, no AO;
     only the floor gets its shadow (it is where shadows read). floorFn overrides the floor. */
  function secShade(h, rd, S, d0, floorFn) {
    if (!h.hit) return null;
    if (h.id === 0 && floorFn) return floorFn(h.p, rd, d0 + h.t, S);
    const n = LK.normal(h.p, h.id, S), a = LK.albedo(h.id);
    const dif = Math.max(0, dot(n, KEY)) * (h.id === 0 ? LK.shadow(add(h.p, mul(n, 0.01)), KEY, S, 12) : 1);
    const k = 1.05 * dif + 0.42 * (0.55 + 0.45 * n[1]) + Math.max(0, dot(n, LK.FILL)) * 0.35;
    const c = LK.tone([a[0] * k, a[1] * k, a[2] * k], 1.3);
    return h.id === 0 ? LK.floorFade(c, { depth: d0 + h.t, d: rd }) : c;
  }
  const softClip = c => c.map(v => (v < 0.82 ? v : 0.82 + 0.18 * (1 - Math.exp(-(v - 0.82) / 0.18))));
  const tokFace = S => add(S.tok.c, mul(norm(V.sub(S.cam.pos, S.tok.c)), 0.24));
  // a point given in the Token's own frame (x, y across the face, z through it), in world space
  const tokPt = (S, x, y, z) => { const M = S.tok.M; return add(S.tok.c, [M[0] * x + M[1] * y + M[2] * z, M[3] * x + M[4] * y + M[5] * z, M[6] * x + M[7] * y + M[8] * z]); };

  /* =====================================================================
     CLAY — every surface becomes the same matte clay: no colour, no
     texture, no gloss, so the picture is only form, light and contact. A
     big soft key (a low-hardness soft shadow), a strong sky fill and deep
     ambient occlusion do the work; a little warm subsurface light glows in
     the terminator band where the key rolls off. Plain → white clay →
     clay tinted per object in pastels.
     ===================================================================== */
  const CL = {
    white: [0.9, 0.885, 0.855], floor: [0.93, 0.915, 0.89],
    tint: [[0.95, 0.92, 0.86], [1.0, 0.7, 0.56], [0.64, 0.86, 0.78], [0.66, 0.74, 1.0]],
    hex: ['', '#f7b89c', '#a9dcc8', '#aebcf7'],
  };
  const CW1 = [1.0, 2.7], CW2 = [6.1, 7.6];
  function clay(g, S, pastel = 0, pass = 0) {
    if (!g.hit) return LK.BG;
    const n = g.n, p = g.p, base0 = g.id === 0 ? CL.floor : CL.white;
    const base = pastel > 0 ? mix3(base0, CL.tint[g.id], pastel) : base0;
    const ndl = dot(n, KEY);
    const sh = ndl > -0.2 ? LK.shadow(add(p, mul(n, 0.012)), KEY, S, 3.2) : 0;
    const occ = lerp(0.16, 1, Math.pow(LK.ao(p, n, S, 6, 0.3), 1.3));
    if (pass === 1) return [occ, occ, occ];
    // wrapped key; self-shadow near the terminator is left to the wrap so it rolls off softly
    const dif = Math.pow(clamp((ndl + 0.2) / 1.2), 1.4) * lerp(1, sh, smooth(0.0, 0.35, ndl));
    if (pass === 2) { const v = LK.aces(dif * 1.3 + 0.04); return [v, v * 0.97, v * 0.92]; }
    const sky = 0.6 + 0.4 * n[1];
    const rim = Math.pow(1 - clamp(-dot(n, g.d)), 3);
    const term = smooth(-0.25, 0.08, ndl) * (1 - smooth(0.08, 0.5, ndl));
    const sss = g.id === 0 ? 0 : (term * (0.35 + 0.65 * sh) * 0.09 + rim * 0.04 * occ) * (1 - 0.75 * pastel);
    const k = 0.92 * dif + 0.6 * sky * occ;
    const c = LK.tone([base[0] * k + sss, base[1] * k + sss * 0.45, base[2] * k + sss * 0.3], 1.3);
    return g.id === 0 ? LK.floorFade(c, g) : c;
  }

  MG.film({
    id: 'lookclay', dur: 10, poster: 4.6,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Clay', sub: 'One matte material, so only form and light remain', era: '1990s —',
      origin: 'The clay render comes from the CG production pipeline: lighters and modellers override every shader with one neutral, matte material to judge form, silhouette and lighting before textures and colour arrive, and studios show the same untextured passes in breakdown reels. The name borrows from sculptors’ clay maquettes. As global illumination and ambient occlusion became cheap in renderers such as V-Ray and mental ray in the 2000s, the soft-lit white clay render also became a look of its own in architectural visualisation and motion design.',
      works: 'Pixar and ILM shot breakdowns (untextured layout and lighting passes) · Architectural visualisation clay renders (V-Ray, Corona) · Studio motion-design reels in white and pastel clay (Cinema 4D)',
      tech: ['Material override: one matte albedo', 'Big soft key + strong AO', 'Subsurface warmth at the terminator'],
      accent: '#e9b49a',
      motionDNA: 'The shared 10 s camera move: a 50° orbit with a slight drift down while the Token bobs and turns. One wipe left to right replaces the plain materials with white clay; callouts name what clay hides and what it reveals while the AO and key-light passes sit as insets; a second wipe tints the clay per object in pastels.',
      visualDNA: 'Warm off-white clay on a matching floor that fades into the paper backdrop; soft broad shadows, deep contact occlusion under the Token, sphere and cube, a faint warm glow along each terminator; at the end pastel coral, mint and periwinkle. Ink mono labels with leader lines, an orange split line, two framed pass insets.',
      transitions: 'Wipe from the plain reference to white clay; wipe from white clay to pastel clay',
      implementation: ['Material override / clay pass in Maya, Cinema 4D, Blender', 'Ambient-occlusion and key-light passes for lookdev', 'Canvas 2D + SDF tracer (js/look-kit.js): one matte albedo, low-hardness soft shadow, 6-tap AO raised to 1.6, terminator-band warmth'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const s1 = E.ioC(seg(t, CW1[0], CW1[1])), s2 = E.ioC(seg(t, CW2[0], CW2[1]));
      const shade = (g, S) => {
        if (g.u >= s1) return LK.plain(g, S);
        return clay(g, S, g.u < s2 ? 1 : 0);
      };
      const { S } = LK.render(c, t, W, H, shade);
      wipeLine(c, s1, W, H, 'CLAY', 'PLAIN');
      wipeLine(c, s2, W, H, 'PASTEL CLAY', 'WHITE CLAY');
      // what the look hides and reveals
      const on1 = pulse(t, 2.9, 6.0, 0.4);
      callout(c, S, W, H, tokFace(S), 170, -190, 'FORM READS FROM LIGHT ALONE', 'no orange, no texture, no gloss', on1 * seg(t, 2.9, 3.3));
      callout(c, S, W, H, add(LK.CUBE.c, [-0.25, -0.47, 0.5]), 90, 190, 'CONTACT OCCLUSION', 'AO darkens where surfaces meet', on1 * seg(t, 3.4, 3.8));
      callout(c, S, W, H, add(LK.SPH.c, [0.5, 0.3, 0.4]), -60, -250, 'SOFT TERMINATOR', 'big key · warm subsurface band', on1 * seg(t, 3.9, 4.3));
      callout(c, S, W, H, [0.35, 0.01, 0.9], 210, 120, 'SHADOW SHAPE', 'large source, soft penumbra', on1 * seg(t, 4.4, 4.8));
      inset(c, t, W, H, 0, 'PASS · AMBIENT OCCLUSION', (g, S) => (g.hit ? clay(g, S, 0, 1) : [1, 1, 1]), pulse(t, 3.2, 6.0, 0.35));
      inset(c, t, W, H, 1, 'PASS · SOFT KEY + SHADOW', (g, S) => (g.hit ? clay(g, S, 0, 2) : [0.16, 0.16, 0.17]), pulse(t, 3.6, 6.0, 0.35));
      // top-left: stage of the look
      if (t < CW1[0] + 0.2) tag(c, 'REFERENCE  ·  PLAIN MATERIALS', 72, 80, seg(t, 0.1, 0.5));
      else if (t < CW2[0]) {
        tag(c, 'MATERIAL OVERRIDE  ·  ONE MATTE CLAY', 72, 80);
        const on = seg(t, 2.6, 3.0) * (1 - seg(t, 5.7, 6.0));
        if (on > 0) {
          c.save(); c.globalAlpha *= on;
          label(c, 'HIDES', 98, 130, { size: 14, color: P.ink, weight: 700 });
          label(c, 'colour · texture · gloss', 98, 156, { size: 15, ls: 1.5, color: '#5d5a54' });
          label(c, 'REVEALS', 98, 196, { size: 14, color: P.ink, weight: 700 });
          label(c, 'form · light · contact · silhouette', 98, 222, { size: 15, ls: 1.5, color: '#5d5a54' });
          c.restore();
        }
      } else {
        tag(c, 'TINTED CLAY  ·  PASTEL ALBEDO PER OBJECT', 72, 80);
        const on = seg(t, 7.2, 7.7);
        if (on > 0) {
          c.save(); c.globalAlpha *= on;
          ['TOKEN', 'SPHERE', 'CUBE'].forEach((nm, i) => {
            const y = 128 + i * 40;
            c.fillStyle = CL.hex[i + 1]; c.fillRect(98, y - 2, 26, 26);
            c.strokeStyle = 'rgba(23,24,28,0.4)'; c.lineWidth = 1; c.strokeRect(98.5, y - 1.5, 25, 25);
            label(c, `${nm}  ${CL.hex[i + 1].toUpperCase()}`, 138, y + 17, { size: 15, ls: 2, color: P.ink });
          });
          label(c, 'same light, same AO — only the albedo changes', 98, 268, { size: 14, ls: 1.5, color: '#5d5a54' });
          c.restore();
        }
      }
      LK.caption(c, t, W, H, { name: 'Clay', cat: 'Material' });
    },
    score(A) {
      LK.bed(A);
      // wipes: a soft, low brush of noise
      [CW1, CW2].forEach(([a, b], i) => {
        A.whoosh(a, b - a, { f1: 180, f2: 1400, q: 0.8, g: 0.09, swell: 0.6, rev: 0.4, pan: -0.4 + i * 0.2 });
        A.pluck(b, midi(i ? 64 : 57), { g: 0.14, bright: 0.25, dur: 1.6, lp: 1800 });
      });
      // callouts: dull, woody taps
      [2.9, 3.4, 3.9, 4.4].forEach((t, i) => { A.osc(t, { type: 'triangle', f: midi(69 + [0, 3, 7, 10][i]), dur: 0.35, g: 0.06, lp: 1400, rev: 0.3 }); A.noise(t, { type: 'lowpass', f: 600, dur: 0.05, g: 0.06 }); });
      // pastel swatches
      [7.3, 7.45, 7.6].forEach((t, i) => A.bell(t, midi([76, 79, 83][i]), { g: 0.045, dur: 1.4, rev: 0.6 }));
      A.chord(7.6, [52, 59, 64, 68, 71], { type: 'triangle', dur: 2.4, g: 0.03, a: 0.3, lp: 1800, rev: 0.7, width: 0.8 });
    },
  });

  /* =====================================================================
     CHROME — the Token and the sphere become mirror metal. Each pixel
     reflects its view ray about the normal and traces it once into the
     scene: the floor (with its shadows), the blue cube, the other mirror
     (which in turn reflects the environment). Rays that leave the scene
     look up a studio environment of softboxes. Schlick's Fresnel tints
     the reflection by the metal's F0 and lifts it to white at grazing
     angles. Then roughness steps up on the beat — the reflection becomes
     several jittered rays averaged, against a pre-blurred environment —
     and the metal turns from chrome to gold.
     ===================================================================== */
  const CHROME = [0.74, 0.75, 0.77], GOLD = [1.0, 0.76, 0.33];
  const RW = [1.0, 2.5], GW = [7.85, 8.9];
  const RSTEP = [[5.0, 0.06], [5.0 + LK.BEAT, 0.14], [5.0 + 2 * LK.BEAT, 0.24], [5.0 + 3 * LK.BEAT, 0.36], [7.85, 0.1]];
  function roughAt(t) {
    let r = 0;
    for (let i = 0; i < RSTEP.length; i++) { const [t0, v] = RSTEP[i], prev = i ? RSTEP[i - 1][1] : 0; if (t >= t0) r = lerp(prev, v, E.outC(seg(t, t0, t0 + 0.22))); }
    return r;
  }
  function mirror(g, S, rough, F0, pass = 0) {
    const d = g.d, n = g.n, R = reflect(d, n), cs = clamp(-dot(d, n)), fr = Math.pow(1 - cs, 5);
    const F = [F0[0] + (1 - F0[0]) * fr, F0[1] + (1 - F0[1]) * fr, F0[2] + (1 - F0[2]) * fr];
    if (pass === 1) return F;
    if (pass === 2) return [R[0] * 0.5 + 0.5, R[1] * 0.5 + 0.5, R[2] * 0.5 + 0.5];
    const ro = add(g.p, mul(n, 0.004)), ns = rough < 0.01 ? 1 : 5;
    let r = 0, gg = 0, b = 0;
    for (let s = 0; s < ns; s++) {
      let dir = R;
      if (ns > 1) {
        const h0 = g.x * 0.618 + g.y * 0.7548 + s * 0.3819;   // decorrelated jitter per pixel and sample
        const j = [hash(h0 * 13.37 + 1.1) - 0.5, hash(h0 * 7.91 + 4.3) - 0.5, hash(h0 * 5.17 + 9.7) - 0.5];
        dir = norm(add(R, mul(j, rough * 1.6)));
        if (dot(dir, n) < 0.02) dir = R;
      }
      const h = LK.trace(ro, dir, S);
      let col;
      if (!h.hit) col = env(ns > 1 ? R : dir, rough);
      else if (h.id === 1 || h.id === 2) {   // the other mirror: one more analytic bounce into the environment
        const n2 = LK.normal(h.p, h.id, S), e2 = env(reflect(dir, n2), rough);
        col = [e2[0] * F0[0], e2[1] * F0[1], e2[2] * F0[2]];
      } else col = secShade(h, dir, S, g.depth);
      r += col[0]; gg += col[1]; b += col[2];
    }
    return softClip([r / ns * F[0], gg / ns * F[1], b / ns * F[2]]);
  }
  /* Roughness noise: average each chrome pixel with its chrome neighbours (an edge-aware box blur). */
  function chromeBlur(rgb, G, rad, split) {
    const { w, h } = G, ids = G.id, src = rgb.slice(), xEnd = Math.min(w, Math.ceil(split * w));
    for (let y = 0; y < h; y++) for (let x = 0; x < xEnd; x++) {
      const i = y * w + x, id = ids[i];
      if (id !== 1 && id !== 2) continue;
      const cw = rad < 1 ? 4 : 1;
      let r = src[i * 3] * (cw - 1), g = src[i * 3 + 1] * (cw - 1), b = src[i * 3 + 2] * (cw - 1), n = cw - 1;
      const rr = Math.max(1, rad);
      for (let dy = -rr; dy <= rr; dy++) {
        const yy = y + dy; if (yy < 0 || yy >= h) continue;
        for (let dx = -rr; dx <= rr; dx++) {
          const xx = x + dx; if (xx < 0 || xx >= w) continue;
          const j = yy * w + xx; if (ids[j] !== id) continue;
          r += src[j * 3]; g += src[j * 3 + 1]; b += src[j * 3 + 2]; n++;
        }
      }
      rgb[i * 3] = r / n; rgb[i * 3 + 1] = g / n; rgb[i * 3 + 2] = b / n;
    }
  }
  // environment panorama inset (equirectangular, behind the camera in the middle)
  const PAN = { w: 256, h: 64 };
  function panorama(rough) {
    const cv = MG.offscreen(PAN.w, PAN.h), cx = cv.getContext('2d'), img = cx.createImageData(PAN.w, PAN.h);
    for (let y = 0; y < PAN.h; y++) for (let x = 0; x < PAN.w; x++) {
      const az = (x + 0.5) / PAN.w * TAU - Math.PI, el = (1 - (y + 0.5) / PAN.h) * 1.7 - 0.25;
      const d = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)], e = softClip(env(d, rough)), i = (y * PAN.w + x) * 4;
      img.data[i] = clamp(e[0]) * 255; img.data[i + 1] = clamp(e[1]) * 255; img.data[i + 2] = clamp(e[2]) * 255; img.data[i + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    return cv;
  }

  MG.film({
    id: 'lookchrome', dur: 10, poster: 4.2,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Chrome', sub: 'Mirror metal: the scene and the studio, reflected', era: '1980 —',
      origin: 'Turner Whitted’s recursive ray tracing (1980) made perfect mirror reflections of the rest of the scene computable, and the reflective spheres of early ray-traced images became the emblem of CGI. Before that, Jim Blinn and Martin Newell’s reflection mapping (1976) faked chrome by looking up a picture of the surroundings, the trick behind the liquid-metal T-1000 of Terminator 2 (1991) and still the basis of image-based lighting. Robert Cook and Kenneth Torrance’s 1982 reflectance model and Christophe Schlick’s 1994 approximation gave metals their tinted, angle-dependent Fresnel reflectance, which rough-metal shading in modern physically based renderers builds on.',
      works: 'An Improved Illumination Model for Shaded Display (Turner Whitted, 1980; ray-traced reflective spheres) · Terminator 2: Judgment Day (James Cameron, ILM, 1991; the liquid-metal T-1000) · The 1984 ray-traced still life by Thomas Porter, “1984” (Lucasfilm, distributed ray tracing with glossy reflection)',
      tech: ['One-bounce traced reflection', 'Softbox studio environment', 'Schlick Fresnel · jittered roughness'],
      accent: '#a6adb6',
      motionDNA: 'The shared camera orbit carries the reflections across the mirrors: as the camera swings, the floor, the cube and the softbox strips slide over the Token’s face and wrap around the sphere. A wipe turns the plain materials to mirror chrome; roughness then rises in four steps on the beat (0.06 → 0.36), blurring the reflection; a final wipe turns the chrome to gold at a satin roughness of 0.10.',
      visualDNA: 'The paper studio from the plain render, but the Token and sphere become polished metal: crisp softbox strips and a big key box in the reflections, the blue cube and the floor’s shadows curving across the sphere, a dark ceiling that gives the metal its contrast; then frosted satin and warm gold. Leader-line labels, a roughness ruler, the environment panorama and the Fresnel pass as insets.',
      transitions: 'Wipe from plain to chrome; stepped roughness changes; wipe from chrome to gold',
      implementation: ['Ray-traced reflections (Whitted, 1980) and reflection mapping (Blinn & Newell, 1976)', 'Physically based metal: Schlick Fresnel with a tinted F0, GGX-style roughness', 'Canvas 2D + SDF tracer (js/look-kit.js): one LK.trace bounce per pixel, analytic softbox environment, 5 jittered rays plus an edge-aware blur for roughness'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { panCache: {} }; },
    draw(c, t, W, H, st) {
      const s1 = E.ioC(seg(t, RW[0], RW[1])), s2 = E.ioC(seg(t, GW[0], GW[1])), rough = roughAt(t);
      const shade = (g, S) => {
        if (g.u >= s1 || (g.id !== 1 && g.id !== 2)) return LK.plain(g, S);
        return mirror(g, S, rough, g.u < s2 ? GOLD : CHROME);
      };
      const rad = rough > 0.07 ? 2 : rough > 0.03 ? 1 : 0;
      const { S } = LK.render(c, t, W, H, shade, { post: (rgb, G) => chromeBlur(rgb, G, rad, s1) });
      wipeLine(c, s1, W, H, 'CHROME', 'PLAIN');
      wipeLine(c, s2, W, H, 'GOLD', 'CHROME');
      // what the mirrors show
      const on1 = pulse(t, 2.6, 5.0, 0.35);
      callout(c, S, W, H, add(LK.SPH.c, [0.3, -0.4, 0.55]), 150, 120, 'THE FLOOR + ITS SHADOWS', 'traced: one bounce into the scene', on1 * seg(t, 2.6, 3.0));
      callout(c, S, W, H, add(LK.SPH.c, [-0.2, 0.5, 0.5]), 40, -200, 'SOFTBOX STRIP', 'ray missed: studio environment', on1 * seg(t, 3.0, 3.4));
      callout(c, S, W, H, tokPt(S, 0.99, -0.1, 0), 110, -200, 'FRESNEL', 'F0 face-on → white at grazing', on1 * seg(t, 3.4, 3.8));
      callout(c, S, W, H, add(LK.CUBE.c, [0.1, 0.5, 0.3]), 70, 270, 'PLAIN CUBE', 'shows up in both mirrors', on1 * seg(t, 3.8, 4.2));
      inset(c, t, W, H, 1, 'PASS · FRESNEL  F(θ)', (g, S) => (g.id === 1 || g.id === 2 ? mirror(g, S, 0, CHROME, 1) : [0.08, 0.08, 0.09]), pulse(t, 3.1, 5.0, 0.35));
      // environment panorama
      const pOn = pulse(t, 2.8, 7.6, 0.35);
      if (pOn > 0) {
        const key = Math.round(rough * 50) / 50;
        if (!st.panCache[key]) st.panCache[key] = panorama(key);
        const x = W - 72 - INS.w, y = 92, h = INS.w * PAN.h / PAN.w * 1.4;
        c.save(); c.globalAlpha *= pOn;
        c.fillStyle = 'rgba(23,24,28,0.18)'; c.fillRect(x + 6, y + 6, INS.w, h);
        c.imageSmoothingEnabled = true; c.drawImage(st.panCache[key], x, y, INS.w, h);
        c.strokeStyle = P.ink; c.lineWidth = 1.5; c.strokeRect(x - 0.75, y - 0.75, INS.w + 1.5, h + 1.5);
        label(c, 'ENVIRONMENT  ·  360° FOR MISSED RAYS', x, y - 12, { size: 14, ls: 2, color: P.ink, weight: 700 });
        c.restore();
      }
      // top-left
      if (t < RW[0] + 0.2) tag(c, 'REFERENCE  ·  PLAIN MATERIALS', 72, 80, seg(t, 0.1, 0.5));
      else if (t < 4.9) tag(c, 'MIRROR METAL  ·  R = D − 2(D·N)N', 72, 80);
      else if (t < GW[0]) tag(c, `ROUGH METAL  ·  ${rough < 0.01 ? 1 : 5} RAYS / PIXEL, AVERAGED`, 72, 80);
      else tag(c, 'TINTED METAL  ·  GOLD F0', 72, 80);
      const rOn = seg(t, 1.6, 2.0);
      readout(c, 98, 136, 'ROUGHNESS', rough, 2, 0, 0.5, [[0, 'MIRROR'], [0.12, 'SATIN'], [0.36, 'BRUSHED'], [0.5, 'MATTE']], rOn);
      if (rOn > 0) {
        const F0 = s2 > 0.5 ? GOLD : CHROME;
        label(c, `F0  ${F0.map(v => v.toFixed(2)).join(' · ')}  ${s2 > 0.5 ? 'GOLD' : 'CHROME'}`, 98, 274, { size: 15, ls: 2, color: P.ink, weight: 700 });
        c.fillStyle = `rgb(${F0.map(v => Math.round(v * 255)).join(',')})`; c.fillRect(470, 258, 22, 22);
      }
      LK.caption(c, t, W, H, { name: 'Chrome', cat: 'Material', curve: u => roughAt(u * 10) / 0.4, span: [0, 10], lo: -0.1, hi: 1.1, curveLabel: 'ROUGHNESS / TIME' });
    },
    score(A) {
      LK.bed(A);
      A.whoosh(RW[0], RW[1] - RW[0], { f1: 900, f2: 7000, q: 2.4, g: 0.1, swell: 0.6, rev: 0.4, pan: -0.3 });
      A.bell(RW[1], midi(81), { g: 0.1, dur: 2.4, ratios: [1, 2.0, 3.01, 4.2], rev: 0.6 });
      A.bell(RW[1] + 0.06, midi(88), { g: 0.05, dur: 1.8, rev: 0.6, pan: 0.4 });
      [2.6, 3.0, 3.4, 3.8].forEach((t, i) => A.osc(t, { f: midi(93 + [0, 2, 4, 7][i]), dur: 0.25, g: 0.035, rev: 0.4, pan: (i - 1.5) * 0.3 }));
      // roughness steps: the shimmer dulls a little with each step
      RSTEP.slice(0, 4).forEach(([t], i) => {
        A.noise(t, { type: 'bandpass', f: 7000 - i * 1500, q: 3 - i * 0.6, dur: 0.18, g: 0.08 });
        A.osc(t, { type: 'triangle', f: midi(76 - i * 2), dur: 0.5, g: 0.06, lp: 4000 - i * 800, rev: 0.4 });
      });
      // gold: a warmer, lower ring
      A.whoosh(GW[0], GW[1] - GW[0], { f1: 400, f2: 3500, q: 1.6, g: 0.09, swell: 0.6, rev: 0.4, pan: 0.3 });
      A.bell(GW[1], midi(69), { g: 0.12, dur: 2.6, ratios: [1, 2.0, 3.01, 4.2], rev: 0.7 });
      A.chord(GW[1], [45, 52, 57, 61, 64], { type: 'triangle', dur: 1.8, g: 0.03, a: 0.1, lp: 2400, rev: 0.7, width: 0.8 });
    },
  });

  /* =====================================================================
     GLASS — the Token and the sphere become glass. At each pixel the view
     ray splits: Fresnel sends a share back as a traced reflection, the
     rest refracts in by Snell's law, marches through the solid
     (LK.traceInside) and refracts out (a second internal bounce on total
     internal reflection), then is traced into the scene. Beer–Lambert
     absorption tints by the length travelled inside — amber for the
     Token, pale aqua for the sphere. On the floor the glass casts tinted
     shadows, and the sphere focuses the key into a ball-lens caustic. The
     index of refraction climbs from 1.00 (air: nothing bends) to 1.50
     (glass) to 2.42 (diamond).
     ===================================================================== */
  const SIG = { 1: [0.04, 0.42, 1.05], 2: [0.34, 0.07, 0.12] };   // absorption per unit length
  const GWIPE = [1.0, 2.4];
  const IORK = [[0, 1.0], [2.6, 1.0], [4.1, 1.5, E.ioC], [6.3, 1.5], [7.7, 2.42, E.ioC], [10, 2.42]];
  const iorAt = t => MG.kf(t, IORK);
  const absorb = (id, d) => { const s = SIG[id]; return [Math.exp(-s[0] * d), Math.exp(-s[1] * d), Math.exp(-s[2] * d)]; };
  /* Soft shadow from one object only (the kit's LK.shadow covers them all; glass needs them apart). */
  function shadowOf(id, p, l, S, k = 10) {
    if (id === 2) {
      const C = LK.SPH.c, r = LK.SPH.r, oc = V.sub(p, C), b = dot(oc, l), cc = dot(oc, oc) - r * r, h = b * b - cc;
      const dd = Math.sqrt(Math.max(0, r * r - h)) - r, tt = -b - Math.sqrt(Math.max(h, 0));
      if (tt <= 0) return 1;
      const x = clamp(0.25 * k * dd / tt); return x * x * (3 - 2 * x);
    }
    const C = id === 1 ? S.tok.c : LK.CUBE.c, r = id === 1 ? LK.TOK.bound : LK.CUBE.bound, sd = id === 1 ? LK.sdToken : LK.sdCube;
    const oc = V.sub(C, p), along = dot(oc, l);
    if (along < -r || V.len(V.sub(oc, mul(l, along))) - r > r * 0.6) return 1;
    let res = 1, t = Math.max(0.02, along - r - 0.05);
    for (let i = 0; i < 40 && t < along + r; i++) {
      const h = sd(add(p, mul(l, t)), S);
      res = Math.min(res, k * h / t);
      if (res < 0.002) return 0;
      t += clamp(h, 0.02, 0.4);
    }
    return clamp(res);
  }
  /* The floor under glass: opaque shadow from the cube, tinted part-shadows from the glass, and the
     sphere's caustic — rays through a ball lens of index n meet about nR / 2(n − 1) from its centre. */
  function glassFloor(p, rd, depth, S, ior) {
    const F0 = ((ior - 1) / (ior + 1)) ** 2, T = 1 - 2 * F0;
    const sC = shadowOf(3, p, KEY, S, 12), sS = shadowOf(2, p, KEY, S, 12), sT = shadowOf(1, p, KEY, S, 12);
    const aS = absorb(2, 1.1), aT = absorb(1, 0.5);
    // caustic profile inside the sphere's shadow
    const C = LK.SPH.c, R = LK.SPH.r, L = mul(KEY, -1), q = V.sub(p, C), al = dot(q, L), perp = V.len(V.sub(q, mul(L, al)));
    let prof = 1;
    if (al > 0 && ior > 1.001) {
      const f = ior * R / (2 * (ior - 1)), wb = Math.max(0.07, R * Math.abs(1 - al / f));
      prof = clamp((R * R) / (wb * wb), 0, 7) * Math.exp(-((perp / wb) ** 2) * 1.6) * 1.2 + 0.25 * smooth(R, 0, perp);
    }
    // a faint grid on the floor, so the bending reads (Whitted's glass spheres sat on a checkerboard)
    const gw = 0.012 + depth * 0.0016, lx = Math.abs(p[0] / 0.5 - Math.round(p[0] / 0.5)) * 0.5, lz = Math.abs(p[2] / 0.5 - Math.round(p[2] / 0.5)) * 0.5;
    const gl = 1 - 0.2 * (1 - smooth(5, 16, depth)) * Math.max(smooth(gw, 0, lx), smooth(gw, 0, lz));
    const a = mul(P.floor, gl), out = [0, 0, 0], ndl = KEY[1], occ = LK.ao(p, [0, 1, 0], S, 4, 0.3);
    for (let ch = 0; ch < 3; ch++) {
      const lS = sS + (1 - sS) * aS[ch] * T * prof, lT = sT + (1 - sT) * aT[ch] * T * 0.85;
      const k = 1.05 * ndl * sC * lS * lT + (0.42 * 1 + Math.max(0, LK.FILL[1]) * 0.35) * occ;
      out[ch] = a[ch] * k;
    }
    return LK.floorFade(LK.tone(out, 1.3), { depth, d: rd });
  }
  function glass(g, S, ior, pass = 0) {
    const id = g.id, d = g.d, n = g.n, cs = clamp(-dot(d, n));
    const F0 = ((ior - 1) / (ior + 1)) ** 2, F = F0 + (1 - F0) * Math.pow(1 - cs, 5);
    const floorFn = (p, rd, dep, S2) => glassFloor(p, rd, dep, S2, ior);
    // refraction in, through, out
    const T = refract(d, n, 1 / ior) || d;
    const ins = LK.traceInside(id, add(g.p, mul(n, -0.004)), T, S);
    let thick = ins.t, dir = refract(T, mul(ins.n, -1), ior), ex = ins.p, exN = ins.n;
    if (!dir) {   // total internal reflection: bounce once inside, then leave
      const T2 = reflect(T, mul(ins.n, -1)), ins2 = LK.traceInside(id, add(ins.p, mul(ins.n, -0.004)), T2, S);
      thick += ins2.t; ex = ins2.p; exN = ins2.n;
      dir = refract(T2, mul(ins2.n, -1), ior) || T2;
    }
    if (pass === 1) { const v = clamp(thick / 1.6); return [v, v * 0.92, v * 0.75]; }
    if (pass === 2) { const v = clamp(F * 3); return [v, v, v]; }
    const tro = add(ex, mul(exN, 0.006));
    let h = LK.trace(tro, dir, S, { skip: id }), tint = [1, 1, 1];
    if (h.hit && (h.id === 1 || h.id === 2)) {   // through the other glass: tint and carry straight on
      tint = absorb(h.id, 0.6);
      h = LK.trace(add(h.p, mul(dir, 0.01)), dir, S, { skip: h.id === 1 ? 1 : 2 });
      if (h.hit && (h.id === 1 || h.id === 2)) h = { hit: false };
    }
    const refr = (h.hit ? secShade(h, dir, S, g.depth + thick, floorFn) : env(dir, 0.02)).map((v, i) => v * tint[i]);
    const ab = absorb(id, thick);
    // reflection
    const R = reflect(d, n), hr = LK.trace(add(g.p, mul(n, 0.004)), R, S, { skip: id });
    const refl = hr.hit ? (hr.id === 1 || hr.id === 2 ? env(R) : secShade(hr, R, S, g.depth, floorFn)) : env(R);
    return softClip([0, 1, 2].map(i => refr[i] * ab[i] * (1 - F) + refl[i] * F));
  }

  MG.film({
    id: 'lookglass', dur: 10, poster: 5.4,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Glass', sub: 'Light bent by Snell’s law, tinted by thickness', era: '1980 —',
      origin: 'Turner Whitted’s 1980 ray tracer was the first to follow rays through transparent objects, bending them at each surface by Snell’s law and splitting off a reflected ray, and his glass spheres over a checkerboard became one of computer graphics’ defining images. The Fresnel equations set how much light reflects at each angle, and Beer–Lambert absorption colours glass by the distance light travels inside it. Caustics — light focused by the glass onto the floor — needed later techniques such as Henrik Wann Jensen’s photon mapping (1990s); here a ball-lens approximation stands in.',
      works: 'An Improved Illumination Model for Shaded Display (Turner Whitted, 1980; glass spheres over a checkerboard) · Henrik Wann Jensen, photon-mapped caustic renders (1996 onwards) · Glass and crystal product visualisation (KeyShot, V-Ray)',
      tech: ['Snell refraction in and out', 'Fresnel reflection mix', 'Beer–Lambert tint · ball-lens caustic'],
      accent: '#4fb3a6',
      motionDNA: 'The shared camera orbit slides the world behind the glass: the floor’s edge, the cube and the shadows swim through the Token and the sphere as the camera moves. A wipe turns them to glass at IOR 1.00, where nothing bends and only the tint shows; the index then rises on eased ramps to 1.50 (glass), where the sphere flips the floor upside down and the caustic gathers, and to 2.42 (diamond), where total internal reflection fills the Token with bright facets.',
      visualDNA: 'The paper studio seen through amber and pale-aqua glass: the dark studio ceiling and softboxes in the Fresnel rims, deeper colour where the glass is thicker, tinted translucent shadows, a bright focused caustic in the sphere’s shadow. An IOR ruler with air, water, glass and diamond marked, leader-line labels, thickness and Fresnel pass insets.',
      transitions: 'Wipe from plain to glass; the index of refraction ramps between named materials',
      implementation: ['Whitted-style recursive ray tracing of dielectrics', 'Fresnel (Schlick) reflectance and Beer–Lambert absorption, as in physically based glass shaders', 'Canvas 2D + SDF tracer (js/look-kit.js): refract → LK.traceInside → refract (one TIR bounce) → LK.trace, a traced reflection, per-object soft shadows and an analytic ball-lens caustic'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const s1 = E.ioC(seg(t, GWIPE[0], GWIPE[1])), ior = iorAt(t);
      const shade = (g, S) => {
        if (g.u >= s1) return LK.plain(g, S);
        if (g.id === 1 || g.id === 2) return glass(g, S, ior);
        if (g.id === 0) return glassFloor(g.p, g.d, g.depth, S, ior);
        return LK.plain(g, S);
      };
      const { S } = LK.render(c, t, W, H, shade);
      wipeLine(c, s1, W, H, 'GLASS', 'PLAIN');
      const on1 = pulse(t, 4.2, 6.4, 0.35), on2 = pulse(t, 7.9, 10.5, 0.35);
      callout(c, S, W, H, add(LK.SPH.c, [0, -0.2, 0.6]), -40, -300, 'BALL LENS', 'the floor seen upside down', on1 * seg(t, 4.2, 4.6));
      callout(c, S, W, H, [LK.SPH.c[0] + 0.62, 0.01, LK.SPH.c[2] - 0.5], 160, 150, 'CAUSTIC', 'key light focused near nR / 2(n−1)', on1 * seg(t, 4.6, 5.0));
      callout(c, S, W, H, tokFace(S), 210, -190, 'BEER–LAMBERT', 'thicker path → deeper amber', on1 * seg(t, 5.0, 5.4));
      callout(c, S, W, H, tokPt(S, 0.2, -0.99, 0), 260, 200, 'FRESNEL RIM', 'grazing view reflects the studio', on1 * seg(t, 5.4, 5.8));
      callout(c, S, W, H, tokFace(S), 210, -190, 'TOTAL INTERNAL REFLECTION', 'rays trapped, bounced, sparkling', on2 * seg(t, 7.9, 8.3));
      callout(c, S, W, H, [LK.SPH.c[0] + 0.62, 0.01, LK.SPH.c[2] - 0.5], 160, 150, 'STRONGER BEND', 'shorter focus, tighter caustic', on2 * seg(t, 8.3, 8.7));
      inset(c, t, W, H, 0, 'PASS · PATH LENGTH INSIDE', (g, S) => (g.id === 1 || g.id === 2 ? glass(g, S, ior, 1) : [0.06, 0.06, 0.07]), pulse(t, 3.0, 7.6, 0.35));
      inset(c, t, W, H, 1, 'PASS · FRESNEL ×3', (g, S) => (g.id === 1 || g.id === 2 ? glass(g, S, ior, 2) : [0.06, 0.06, 0.07]), pulse(t, 3.4, 7.6, 0.35));
      if (t < GWIPE[0] + 0.2) tag(c, 'REFERENCE  ·  PLAIN MATERIALS', 72, 80, seg(t, 0.1, 0.5));
      else if (t < 2.6) tag(c, 'GLASS AT IOR 1.00  ·  NOTHING BENDS, ONLY TINT', 72, 80);
      else if (t < 7.7) tag(c, 'REFRACTION  ·  n₁ sin θ₁ = n₂ sin θ₂', 72, 80);
      else tag(c, 'DIAMOND  ·  CRITICAL ANGLE 24°', 72, 80);
      readout(c, 98, 136, 'INDEX OF REFRACTION', ior, 2, 1, 2.6, [[1, 'AIR'], [1.33, 'WATER'], [1.5, 'GLASS'], [2.42, 'DIAMOND']], seg(t, 1.4, 1.8));
      if (seg(t, 1.4, 1.8) > 0) {
        const F0 = ((ior - 1) / (ior + 1)) ** 2;
        c.save(); c.globalAlpha *= seg(t, 1.4, 1.8);
        label(c, `F0 ${(F0 * 100).toFixed(1)}%  ·  CRITICAL ANGLE ${ior > 1.001 ? (Math.asin(1 / ior) * 180 / Math.PI).toFixed(0) + '°' : '—'}`, 98, 274, { size: 15, ls: 2, color: P.ink, weight: 700 });
        c.restore();
      }
      LK.caption(c, t, W, H, { name: 'Glass', cat: 'Material', curve: u => (iorAt(u * 10) - 1) / 1.42, span: [0, 10], lo: -0.1, hi: 1.1, curveLabel: 'IOR / TIME' });
    },
    score(A) {
      LK.bed(A);
      const glassy = (t, m, g = 0.07, pan = 0) => { A.osc(t, { f: midi(m), dur: 1.8, g, a: 0.01, rev: 0.7, pan, vib: [5, 2] }); A.osc(t, { f: midi(m) * 2.76, dur: 0.6, g: g * 0.3, rev: 0.7, pan }); };
      A.whoosh(GWIPE[0], GWIPE[1] - GWIPE[0], { f1: 1200, f2: 6000, q: 3, g: 0.08, swell: 0.6, rev: 0.5 });
      glassy(GWIPE[1], 84, 0.08);
      // IOR ramps: a rising tone that bends with the index
      A.osc(2.6, { type: 'triangle', f: midi(64), f2: midi(71), glide: 1.5, dur: 1.6, g: 0.04, a: 0.3, lp: 2600, rev: 0.6 });
      glassy(4.1, 88, 0.08, -0.3);
      [4.2, 4.6, 5.0, 5.4].forEach((t, i) => A.osc(t, { f: midi(91 + [0, 3, 5, 10][i]), dur: 0.3, g: 0.03, rev: 0.5, pan: (i - 1.5) * 0.3 }));
      A.osc(6.3, { type: 'triangle', f: midi(71), f2: midi(83), glide: 1.4, dur: 1.5, g: 0.04, a: 0.3, lp: 3200, rev: 0.6 });
      // diamond: a scatter of bright sparkles
      glassy(7.7, 95, 0.07, 0.3);
      for (let k = 0; k < 7; k++) A.osc(7.75 + k * 0.11 + hash(k) * 0.05, { f: midi(96 + [0, 4, 7, 11, 12, 16, 19][k]), dur: 0.25, g: 0.025, rev: 0.7, pan: (hash(k + 9) - 0.5) * 1.4 });
      A.chord(7.7, [52, 59, 64, 68, 71], { type: 'triangle', dur: 2.2, g: 0.03, a: 0.2, lp: 2600, rev: 0.7, width: 0.8 });
    },
  });
})();
