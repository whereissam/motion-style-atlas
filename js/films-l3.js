/* batch l3 — Rendering Looks · Light, Shading: lookgolden · lookvolumetric · looktoon.
   lookgolden (a low warm sun with long soft shadows and cool blue skylight filling them; the sun
   sinks from 24° to 5° over the film, so the shadows lengthen and the key warms from about
   4900 K to 2700 K, read out beside a small sun/sky diagram) ·
   lookvolumetric (god rays: a window light from above and behind a hazy dark room, single
   scattering ray-marched per pixel against a light-space shadow map, so the Token, its hole and the
   window bars cut visible shafts through the haze) ·
   looktoon (cel shading as a mechanism: N·L quantised through a 2-, 3- then 4-band ramp, a hard
   shadow and terminator, a thresholded specular blob, and ink outlines found in post from id,
   depth and normal discontinuities in the G-buffer). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, hash, midi } = MG;
  const LK = MG.LK, V = LK.V, P = LK.P, PI = Math.PI;
  const { add, sub, mul, dot, norm } = V;

  /* ---------------- shared helpers ---------------- */
  const label = (c, s, x, y, o = {}) => LK.label(c, s, x, y, o);
  const INK = P.ink, PAPER = P.paper;
  // small accent dot + bold mono label, top-left of frame
  function tag(c, s, x, y, o = {}) {
    c.save(); c.globalAlpha *= o.on ?? 1;
    c.fillStyle = o.accent || P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: o.dark ? PAPER : INK, weight: 700, size: 20 });
    c.restore();
  }
  // a mono readout line: dim key, bright value
  function readout(c, k, v, x, y, o = {}) {
    label(c, k, x, y, { size: 15, ls: 2, color: o.dark ? 'rgba(236,232,223,0.6)' : P.mute });
    label(c, v, x + (o.kw || 190), y, { size: 15, ls: 2, weight: 700, color: o.vc || (o.dark ? PAPER : INK) });
  }
  // translucent inset panel
  function panel(c, x, y, w, h, dark) {
    c.save();
    c.fillStyle = dark ? 'rgba(10,10,12,0.72)' : 'rgba(236,232,223,0.86)'; c.fillRect(x, y, w, h);
    c.strokeStyle = dark ? 'rgba(236,232,223,0.22)' : 'rgba(23,24,28,0.22)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    c.restore();
  }
  // leader line from a world point to a label
  function leader(c, S, p, dx, dy, s, o = {}) {
    const q = LK.project(S, p); if (!q) return;
    const on = o.on ?? 1; if (on <= 0.01) return;
    const col = o.dark ? PAPER : INK, tx = q[0] + dx, ty = q[1] + dy;
    c.save(); c.globalAlpha *= on;
    c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(tx, ty); c.lineTo(tx + (dx < 0 ? -18 : 18), ty); c.stroke();
    c.fillStyle = o.dot || P.accent; c.beginPath(); c.arc(q[0], q[1], 5, 0, TAU); c.fill();
    c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); c.arc(q[0], q[1], 8, 0, TAU); c.stroke();
    label(c, s, tx + (dx < 0 ? -26 : 26), ty + 6, { size: 15, ls: 2, weight: 700, color: col, align: dx < 0 ? 'right' : 'left' });
    if (o.sub) label(c, o.sub, tx + (dx < 0 ? -26 : 26), ty + 28, { size: 13, ls: 2, color: o.dark ? 'rgba(236,232,223,0.7)' : 'rgba(23,24,28,0.62)', align: dx < 0 ? 'right' : 'left' });
    c.restore();
  }
  // vertical split line between the plain reference and the look
  function splitBar(c, x, H, left, right, o = {}) {
    if (x < -20 || x > 1940) return;
    c.save();
    c.fillStyle = o.dark ? PAPER : INK; c.fillRect(x - 1.5, 0, 3, H);
    c.fillStyle = P.accent; c.beginPath(); c.arc(x, H * 0.42, 9, 0, TAU); c.fill();
    if (x > 260) label(c, left, x - 22, 150, { align: 'right', size: 15, ls: 2, weight: 700, color: o.dark ? PAPER : INK });
    if (x < 1660) label(c, right, x + 22, 150, { size: 15, ls: 2, weight: 700, color: o.ldark ? PAPER : INK });
    c.restore();
  }
  const toWorld = (M, p) => [M[0] * p[0] + M[1] * p[1] + M[2] * p[2], M[3] * p[0] + M[4] * p[1] + M[5] * p[2], M[6] * p[0] + M[7] * p[1] + M[8] * p[2]];
  const tokPoint = (S, q) => add(S.tok.c, toWorld(S.tok.M, q));
  const rgbStr = (c, a = 1) => `rgba(${Math.round(clamp(c[0]) * 255)},${Math.round(clamp(c[1]) * 255)},${Math.round(clamp(c[2]) * 255)},${a})`;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

  /* =====================================================================
     GOLDEN HOUR — the sun sits low behind and to the left of the still
     life and keeps sinking: elevation 24° → 5° on a slow ease. Its colour
     follows a black-body approximation (≈4900 K → 2700 K) and its shadows
     stretch as h / tan(elevation). Everything the sun cannot reach is lit
     only by the open blue sky, so the shadows go cool against the warm
     key: the warm/cool split that defines the hour. The sky gradient for
     the misses warms at the horizon and glows toward the sun's side.
     A wipe opens it against the plain studio reference; a sun diagram
     and readouts track elevation, colour temperature and shadow length.
     ===================================================================== */
  const G_AZ = norm([-0.72, 0, 0.69]);
  const gElev = t => lerp(24, 5, E.ioS(clamp(t / 10)));
  const gK = el => lerp(2700, 4900, Math.pow(clamp((el - 5) / 19), 0.8));
  function gSunDir(el) { const r = el * PI / 180; return norm([G_AZ[0] * Math.cos(r), Math.sin(r), G_AZ[2] * Math.cos(r)]); }
  // Tanner Helland's fit of the black-body locus, 0..1 RGB
  function kelvin(K) {
    const t = K / 100;
    const r = t <= 66 ? 255 : 329.7 * Math.pow(t - 60, -0.1332);
    const g = t <= 66 ? 99.47 * Math.log(t) - 161.12 : 288.12 * Math.pow(t - 60, -0.0755);
    const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.52 * Math.log(t - 10) - 305.04;
    return [clamp(r / 255), clamp(g / 255), clamp(b / 255)];
  }
  function gState(t) {
    const el = gElev(t), K = gK(el), L = gSunDir(el), kc = kelvin(K), warm = 1 - clamp((el - 5) / 19);
    const I = lerp(1.95, 1.75, warm);
    return {
      el, K, L, warm,
      sun: [kc[0] * I, kc[1] * I * 0.97, kc[2] * I * 0.95],
      sky: [lerp(0.26, 0.2, warm), lerp(0.36, 0.3, warm), lerp(0.62, 0.6, warm)],
      hor: LK.mix3([1.0, 0.84, 0.66], [1.0, 0.66, 0.42], warm),
      zen: LK.mix3([0.5, 0.64, 0.84], [0.36, 0.48, 0.74], warm),
    };
  }
  function gSky(d, st) {
    const h = clamp(d[1] / 0.2), c = LK.mix3(st.hor, st.zen, Math.pow(h, 0.7));
    const s = Math.max(0, dot(d, st.L)), glow = Math.pow(s, 5) * 0.35 + Math.pow(s, 40) * 0.4;
    return [c[0] + glow, c[1] + glow * 0.72, c[2] + glow * 0.38];
  }
  function gShade(g, S, st) {
    if (!g.hit) return gSky(g.d, st);
    const a = LK.albedo(g.id), n = g.n, L = st.L, ndl = dot(n, L);
    const sh = ndl > 0 ? LK.shadow(add(g.p, mul(n, 0.01)), L, S, 16) : 0;
    const occ = LK.ao(g.p, n, S), dif = Math.max(0, ndl) * sh;
    const skyK = (0.55 + 0.45 * n[1]) * occ, bnc = Math.max(0, -n[1]) * 0.22 * occ;
    const hv = norm(sub(L, g.d)), sp = Math.pow(Math.max(0, dot(n, hv)), g.id === 0 ? 20 : 60) * sh * (g.id === 0 ? 0.08 : g.id === 3 ? 0.5 : 0.35);
    const out = [0, 0, 0];
    for (let k = 0; k < 3; k++) out[k] = a[k] * (st.sun[k] * dif + st.sky[k] * skyK + st.sun[k] * bnc * 0.35) + st.sun[k] * sp;
    const c = LK.tone(out, 1.05);
    if (g.id !== 0) return c;
    return LK.floorFade(c, g, gSky([g.d[0], 0.01, g.d[2]], st));
  }
  const G_WIPE = [0.4, 2.3];

  MG.film({
    id: 'lookgolden', dur: 10, poster: 7.6,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Golden Hour', sub: 'Low warm sun, cool sky in the shadows', era: '1900s — (painting earlier)',
      origin: 'The “magic hour” after sunrise and before sunset was prized by painters long before film — Monet’s Haystacks and Rouen Cathedral series (1890s) chase exactly this light. In cinema it became a signature when Terrence Malick and cinematographer Néstor Almendros shot much of Days of Heaven (1978) in the minutes around sunset; Almendros won the Academy Award for it. In CG the look is a sun direction and a colour temperature: a low key light, a black-body warm colour, and a blue sky dome filling the shadows.',
      works: 'Days of Heaven (Terrence Malick, cinematography Néstor Almendros, 1978) · Haystacks series (Claude Monet, 1890–91) · Barry Lyndon (Stanley Kubrick, cinematography John Alcott, 1975)',
      tech: ['Low directional key', 'Black-body colour temperature', 'Blue sky-dome fill'],
      accent: '#f29a3a',
      motionDNA: 'The camera makes the same slow 50° orbit as every look film while the sun sinks from 24° to 5° above the horizon on an ease. Shadow length follows h / tan(elevation), so the shadows stretch across the floor as it drops, and the key warms from about 4900 K to 2700 K. A wipe from the plain studio reference opens the film; readouts and the sun diagram track the change.',
      visualDNA: 'Warm orange key on every sun-facing face, long soft shadows filled with cool sky blue, a pale-blue-to-peach sky gradient glowing on the sun side, the floor fading into the warm horizon. A small sun/sky diagram and a colour-temperature bar sit top right.',
      transitions: 'One wipe from the plain reference to the look; afterwards a continuous change of sun elevation',
      implementation: ['Unreal / Unity: directional light with temperature + sky atmosphere', 'Blender: Sun lamp with blackbody colour, Nishita sky', 'Canvas 2D + SDF tracer (js/look-kit.js): a low sun with soft ray-marched shadows, Helland black-body colour, blue sky-dome fill with AO and a gradient sky'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const st = gState(t), sx = E.ioC(seg(t, G_WIPE[0], G_WIPE[1])) * 1.04 - 0.02;
      const { S } = LK.render(c, t, W, H, (g, S) => (g.u < sx ? gShade(g, S, st) : LK.plain(g, S)));
      if (t < G_WIPE[1] + 0.1) splitBar(c, sx * W, H, 'GOLDEN HOUR', 'PLAIN STUDIO REFERENCE');
      const on = seg(t, 1.6, 2.4);
      tag(c, 'GOLDEN HOUR  ·  LOW SUN, SKY-BLUE SHADOWS', 72, 80, { accent: '#f29a3a', on: 1 });
      // readouts
      c.save(); c.globalAlpha = on;
      const shLen = 1 / Math.tan(st.el * PI / 180);
      readout(c, 'SUN ELEVATION', `${st.el.toFixed(1)}°`, 98, 122, { vc: '#b4540c' });
      readout(c, 'KEY COLOUR', `≈ ${Math.round(st.K / 50) * 50} K`, 98, 146, { vc: '#b4540c' });
      readout(c, 'SHADOW LENGTH', `${shLen.toFixed(1)} × HEIGHT`, 98, 170);
      readout(c, 'FILL', 'SKY DOME  ·  ≈ 9000 K', 98, 194, { vc: '#2f5bff' });
      c.restore();
      // sun / sky diagram, top right
      if (on > 0.01) {
        c.save(); c.globalAlpha = on;
        const px = 1452, py = 56, pw = 396, ph = 268;
        panel(c, px, py, pw, ph);
        c.beginPath(); c.rect(px, py, pw, ph); c.clip();
        label(c, 'SUN  ·  SKY', px + 20, py + 32, { size: 14, ls: 2, weight: 700, color: INK });
        const ox = px + 150, oy = py + 176, R = 112;
        // sky above the horizon, warm low and blue high
        const gr = c.createLinearGradient(0, py + 44, 0, oy);
        gr.addColorStop(0, rgbStr(st.zen)); gr.addColorStop(1, rgbStr(st.hor));
        c.fillStyle = gr; c.fillRect(px + 12, py + 44, pw - 24, oy - py - 44);
        // the sun's path from horizon to zenith
        c.strokeStyle = 'rgba(23,24,28,0.4)'; c.lineWidth = 1; c.setLineDash([3, 4]); c.beginPath(); c.arc(ox, oy, R, PI, PI * 1.5); c.stroke(); c.setLineDash([]);
        // horizon + ground
        c.fillStyle = 'rgba(23,24,28,0.08)'; c.fillRect(px + 12, oy, pw - 24, 44);
        c.fillStyle = INK; c.fillRect(px + 12, oy - 1, pw - 24, 2);
        // sun
        const er = st.el * PI / 180, sxp = ox - Math.cos(er) * R, syp = oy - Math.sin(er) * R;
        c.fillStyle = rgbStr(kelvin(st.K)); c.beginPath(); c.arc(sxp, syp, 13, 0, TAU); c.fill();
        c.strokeStyle = '#b4540c'; c.lineWidth = 2; c.stroke();
        // elevation angle
        c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.arc(ox, oy, 38, PI, PI + er, false); c.stroke();
        label(c, `${st.el.toFixed(1)}°`, ox - 50, oy - 10, { size: 13, ls: 1, weight: 700, color: INK, align: 'right' });
        // a post and its shadow: length = h / tan(el)
        const hx = ox + 64, hh = 44;
        c.fillStyle = P.accent; c.fillRect(hx - 4, oy - hh, 8, hh);
        const sl = Math.min(hh * shLen, px + pw - 20 - hx);
        c.fillStyle = 'rgba(47,91,255,0.55)'; c.fillRect(hx, oy + 1, sl, 6);
        c.strokeStyle = 'rgba(180,84,12,0.7)'; c.lineWidth = 1; c.setLineDash([4, 4]);
        c.beginPath(); c.moveTo(hx, oy - hh); c.lineTo(hx + Math.min(hh * shLen, 1000), oy); c.stroke(); c.setLineDash([]);
        label(c, 'SHADOW = h / tan θ', hx + 10, oy + 30, { size: 12, ls: 1, color: INK });
        // colour temperature bar
        const bx = px + 20, by = py + ph - 26, bw = pw - 40;
        for (let i = 0; i < bw; i += 2) { const K = lerp(2000, 9000, i / bw); c.fillStyle = rgbStr(kelvin(K)); c.fillRect(bx + i, by, 2, 10); }
        const mk = bx + (st.K - 2000) / 7000 * bw, mf = bx + (9000 - 2000) / 7000 * bw;
        c.fillStyle = INK; c.beginPath(); c.moveTo(mk, by - 2); c.lineTo(mk - 6, by - 11); c.lineTo(mk + 6, by - 11); c.fill();
        label(c, 'KEY', mk, by - 15, { size: 11, ls: 1, weight: 700, color: INK, align: 'center' });
        c.fillStyle = P.blue; c.beginPath(); c.moveTo(mf - 3, by - 2); c.lineTo(mf - 9, by - 11); c.lineTo(mf + 3, by - 11); c.fill();
        label(c, 'SKY', mf - 3, by - 15, { size: 11, ls: 1, weight: 700, color: P.blue, align: 'center' });
        label(c, '2000 K', bx, by + 24, { size: 11, ls: 1 }); label(c, '9000 K', bx + bw, by + 24, { size: 11, ls: 1, align: 'right' });
        c.restore();
      }
      // leader labels
      const L = st.L, lxz = norm([L[0], 0, L[2]]);
      const tokSun = tokPoint(S, [-0.6, -0.1, 0.22]), toCam = norm(sub(S.cam.pos, LK.SPH.c));
      leader(c, S, tokSun, -150, -110, 'WARM KEY', { on: seg(t, 2.6, 3.1) * (1 - seg(t, 8.6, 9.0)), sub: `SUN-FACING  ·  ${Math.round(st.K / 50) * 50} K`, dot: '#f29a3a' });
      const sphSh = add(LK.SPH.c, mul(norm(add(mul(lxz, -1), toCam)), LK.SPH.r));
      leader(c, S, sphSh, -120, 120, 'COOL SKYLIGHT FILL', { on: seg(t, 3.4, 3.9) * (1 - seg(t, 8.6, 9.0)), sub: 'SHADE SIDE SEES ONLY BLUE SKY', dot: P.blue });
      const tokSh = [LK.SPH.c[0] - lxz[0] * 2.3, 0, LK.SPH.c[2] - lxz[2] * 2.3];
      leader(c, S, tokSh, 120, 90, 'LONG SHADOW', { on: seg(t, 4.4, 4.9) * (1 - seg(t, 8.6, 9.0)), sub: `${shLen.toFixed(1)} × HEIGHT  ·  STRETCHING` });
      LK.caption(c, t, W, H, { name: 'Golden Hour', cat: 'Light', curve: u => gElev(u * 10) / 24, lo: -0.1, hi: 1.15, curveLabel: 'SUN ELEVATION / TIME' });
    },
    score(A) {
      LK.bed(A);
      // a low drone that sinks with the sun
      A.osc(0.2, { type: 'triangle', f: midi(45), f2: midi(40), glide: 9.6, dur: 9.6, g: 0.05, a: 1.6, lp: 700, rev: 0.6 });
      A.osc(0.2, { type: 'sine', f: midi(57), f2: midi(52), glide: 9.6, dur: 9.6, g: 0.025, a: 2.0, rev: 0.6 });
      // the wipe
      A.whoosh(G_WIPE[0], G_WIPE[1] - G_WIPE[0], { f1: 300, f2: 2600, q: 1.6, g: 0.09, swell: 0.6, rev: 0.4, pan: 0.2 });
      A.bell(G_WIPE[1], midi(76), { g: 0.07, dur: 2, rev: 0.5 });
      // a warm bell each time the key passes another 500 K on its way down
      const notes = [74, 71, 69, 67];
      [4500, 4000, 3500, 3000].forEach((K, i) => {
        let tk = 10;
        for (let s = 0; s <= 1000; s++) { const tt = s / 100; if (gK(gElev(tt)) <= K) { tk = tt; break; } }
        if (tk < 9.6) { A.bell(tk, midi(notes[i]), { g: 0.06, dur: 1.8, rev: 0.6, pan: -0.2 + i * 0.12 }); A.pluck(tk, midi(notes[i] - 12), { g: 0.1, bright: 0.4, dur: 1.4 }); }
      });
      A.chord(8.4, [52, 59, 64, 68], { type: 'triangle', dur: 1.6, g: 0.035, a: 0.3, lp: 1800, rev: 0.7, width: 0.8 });
    },
  });

  /* =====================================================================
     VOLUMETRIC LIGHT — a dark room filled with haze and one window high
     above and behind the still life (a directional light through a 3 × 2
     paned aperture). Each frame first builds a light-space shadow map: a
     ray from every texel of the window down along the light, storing the
     distance to the first thing it hits. Then, at half resolution, every
     view ray is clipped to the window's light prism and marched in a few
     jittered steps; each step that the shadow map says is lit adds
     σ · phase · light · transmittance. The Token, its hole and the window
     bars carve dark and bright shafts. A depth-aware upsample merges the
     in-scatter with the surfaces (lit with LK.shadow and the same window
     mask), attenuated by Beer–Lambert transmittance.
     ===================================================================== */
  const VL = (() => {
    const Ld = norm([0.3, 0.56, -0.77]), Y0 = 7.4, F = [0.1, 0, 0.7], s = Y0 / Ld[1];
    return { Ld, Y0, cx: F[0] + Ld[0] * s, cz: F[2] + Ld[2] * s, hw: 2.3, hd: 1.7, mull: 0.06, col: [1.0, 0.88, 0.7], I: 2.2, g: 0.5 };
  })();
  const VMW = 240, VMH = 174, VRW = 400, VRH = 225;
  const vSigma = t => 0.11 * E.ioS(seg(t, 0.6, 2.6)) + 0.03 * E.ioS(seg(t, 6.6, 8.0));
  const vSteps = t => (t < 3.4 ? 8 : t < 5.6 ? 16 : 32);
  function vQ(p) { const s = (VL.Y0 - p[1]) / VL.Ld[1]; return [p[0] + VL.Ld[0] * s - VL.cx, p[2] + VL.Ld[2] * s - VL.cz, s]; }
  function vPane(qx, qz, soft) {   // 1 inside the glass, 0 on bars / outside
    const ax = VL.hw - Math.abs(qx), az = VL.hd - Math.abs(qz);
    if (ax < -soft || az < -soft) return 0;
    const bx = Math.abs(Math.abs(qx) - VL.hw / 3) - VL.mull, bz = Math.abs(qz) - VL.mull;
    return clamp(Math.min(ax - VL.mull, az - VL.mull, bx, bz) / soft + 0.5);
  }
  let vMapT = null, vMap = null;
  function vShadowMap(t, S) {
    if (vMapT === t) return vMap;
    const m = new Float32Array(VMW * VMH), dir = mul(VL.Ld, -1);
    for (let j = 0; j < VMH; j++) for (let i = 0; i < VMW; i++) {
      const q = [VL.cx - VL.hw + (i + 0.5) / VMW * 2 * VL.hw, VL.Y0, VL.cz - VL.hd + (j + 0.5) / VMH * 2 * VL.hd];
      const r = LK.trace(q, dir, S, { maxT: 40 });
      m[j * VMW + i] = r.hit ? r.t : 1e9;
    }
    vMapT = t; vMap = m; return m;
  }
  // is point p lit by the window? (shadow map + pane bars)
  function vLit(p, m) {
    if (p[1] < 0 || p[1] > VL.Y0) return 0;
    const q = vQ(p);
    if (!vPane(q[0], q[1], 0.004)) return 0;
    const i = Math.floor((q[0] + VL.hw) / (2 * VL.hw) * VMW), j = Math.floor((q[1] + VL.hd) / (2 * VL.hd) * VMH);
    if (i < 0 || j < 0 || i >= VMW || j >= VMH) return 0;
    return q[2] < m[j * VMW + i] - 0.03 ? 1 : 0;
  }
  // the view-ray interval inside the window's light prism (and 0 ≤ y ≤ Y0)
  function vClip(o, d, tEnd) {
    const Ld = VL.Ld, ky = 1 / Ld[1];
    const ax = o[0] + Ld[0] * (VL.Y0 - o[1]) * ky - VL.cx, bx = d[0] - Ld[0] * d[1] * ky;
    const az = o[2] + Ld[2] * (VL.Y0 - o[1]) * ky - VL.cz, bz = d[2] - Ld[2] * d[1] * ky;
    let t0 = 0, t1 = tEnd;
    const slab = (a, b, h) => {
      if (Math.abs(b) < 1e-9) { if (Math.abs(a) > h) t1 = -1; return; }
      let u = (-h - a) / b, v = (h - a) / b; if (u > v) [u, v] = [v, u];
      t0 = Math.max(t0, u); t1 = Math.min(t1, v);
    };
    slab(ax, bx, VL.hw); slab(az, bz, VL.hd);
    if (Math.abs(d[1]) > 1e-9) { let u = (0 - o[1]) / d[1], v = (VL.Y0 - o[1]) / d[1]; if (u > v) [u, v] = [v, u]; t0 = Math.max(t0, u); t1 = Math.min(t1, v); }
    return [t0, t1];
  }
  const hg = (cs, g) => (1 - g * g) / Math.pow(1 + g * g - 2 * g * cs, 1.5);
  const V_AMB = [0.035, 0.036, 0.045], V_BACK = [0.012, 0.012, 0.016], V_FAR = 26;
  let vBuf = null, vCanvas = null;
  function vShade(g, S) {
    if (!g.hit) return V_BACK;
    const a = LK.albedo(g.id), n = g.n, L = VL.Ld, ndl = dot(n, L);
    let lit = 0;
    if (ndl > 0) {
      const q = vQ(g.p), w = vPane(q[0], q[1], 0.035);
      if (w > 0) lit = w * LK.shadow(add(g.p, mul(n, 0.01)), L, S, 28);
    }
    const occ = LK.ao(g.p, n, S), amb = (0.1 + 0.05 * n[1]) * occ;
    const hv = norm(sub(L, g.d)), sp = Math.pow(Math.max(0, dot(n, hv)), 50) * lit * (g.id === 0 ? 0.05 : 0.4);
    const k = VL.I * Math.max(0, ndl) * lit;
    // a faint warm bounce from the bright floor patch onto faces that look down
    const bn = g.id === 0 ? 0 : Math.max(0, -n[1]) * 0.12 * occ;
    const c = [a[0] * (VL.col[0] * (k + bn) + amb * 0.9) + VL.col[0] * sp * VL.I, a[1] * (VL.col[1] * (k + bn) + amb) + VL.col[1] * sp * VL.I, a[2] * (VL.col[2] * (k + bn) + amb * 1.2) + VL.col[2] * sp * VL.I];
    return g.id === 0 ? LK.floorFade(c, g, V_BACK) : c;
  }
  function vPost(t) {
    return (rgb, G) => {
      const { w, h, S } = G, sig = vSigma(t), N = vSteps(t), m = vShadowMap(t, S), o = S.cam.pos, fr = Math.floor(t * 30);
      const lo = new Float32Array(VRW * VRH), ld = new Float32Array(VRW * VRH), sx = w / VRW, sy = h / VRH;
      if (sig > 1e-4) {
        for (let y = 0; y < VRH; y++) for (let x = 0; x < VRW; x++) {
          const gi = Math.floor(y * sy + sy / 2) * w + Math.floor(x * sx + sx / 2);
          const D = Math.min(G.depth[gi], V_FAR), d = [G.D3[gi * 3], G.D3[gi * 3 + 1], G.D3[gi * 3 + 2]];
          ld[y * VRW + x] = D;
          const [t0, t1] = vClip(o, d, D);
          if (t1 <= t0) continue;
          const dt = (t1 - t0) / N, j = (hash(x * 12.9898 + y * 78.233) + fr * 0.618) % 1;
          let acc = 0;
          for (let k = 0; k < N; k++) {
            const tt = t0 + (k + j) * dt;
            if (vLit([o[0] + d[0] * tt, o[1] + d[1] * tt, o[2] + d[2] * tt], m)) acc += Math.exp(-sig * tt);
          }
          lo[y * VRW + x] = acc * dt * sig * hg(dot(d, VL.Ld), VL.g) / 4;
        }
      } else for (let y = 0; y < VRH; y++) for (let x = 0; x < VRW; x++) { const gi = Math.floor(y * sy + sy / 2) * w + Math.floor(x * sx + sx / 2); ld[y * VRW + x] = Math.min(G.depth[gi], V_FAR); }
      // [1 2 1] blur to hide the jitter, then a depth-aware upsample onto the surfaces
      const tmp = new Float32Array(VRW * VRH), bl = new Float32Array(VRW * VRH);
      for (let y = 0; y < VRH; y++) for (let x = 0; x < VRW; x++) { const i = y * VRW + x; tmp[i] = (lo[i - (x > 0 ? 1 : 0)] + 2 * lo[i] + lo[i + (x < VRW - 1 ? 1 : 0)]) / 4; }
      for (let y = 0; y < VRH; y++) for (let x = 0; x < VRW; x++) { const i = y * VRW + x; bl[i] = (tmp[i - (y > 0 ? VRW : 0)] + 2 * tmp[i] + tmp[i + (y < VRH - 1 ? VRW : 0)]) / 4; }
      vBuf = bl;
      for (let y = 0; y < h; y++) {
        const fy = (y + 0.5) / sy - 0.5, y0 = clamp(Math.floor(fy), 0, VRH - 1), y1 = Math.min(y0 + 1, VRH - 1), wy = clamp(fy - y0);
        for (let x = 0; x < w; x++) {
          const i = y * w + x, D = Math.min(G.depth[i], V_FAR);
          const fx = (x + 0.5) / sx - 0.5, x0 = clamp(Math.floor(fx), 0, VRW - 1), x1 = Math.min(x0 + 1, VRW - 1), wx = clamp(fx - x0);
          let s = 0, ws = 0;
          for (const [xx, yy, bw] of [[x0, y0, (1 - wx) * (1 - wy)], [x1, y0, wx * (1 - wy)], [x0, y1, (1 - wx) * wy], [x1, y1, wx * wy]]) {
            const k = yy * VRW + xx, wt = (bw + 1e-3) / (1 + 30 * Math.abs(ld[k] - D) / Math.max(D, 1));
            s += bl[k] * wt; ws += wt;
          }
          const ins = s / ws, T = Math.exp(-sig * D), haze = 1 - T;
          for (let ch = 0; ch < 3; ch++) rgb[i * 3 + ch] = rgb[i * 3 + ch] * T + V_AMB[ch] * haze * 0.8 + VL.col[ch] * VL.I * ins * 3.2;
          const tc = LK.tone([rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2]], 1.25);
          rgb[i * 3] = tc[0]; rgb[i * 3 + 1] = tc[1]; rgb[i * 3 + 2] = tc[2];
        }
      }
    };
  }
  // one view ray, sampled finely for the diagram
  function vRaySamples(S, m, p, n) {
    const o = S.cam.pos, d = norm(sub(p, o)), D = V.len(sub(p, o)), [t0, t1] = vClip(o, d, D), out = [];
    for (let k = 0; k < n; k++) { const tt = (k + 0.5) / n * D; out.push({ t: tt, inP: tt >= t0 && tt <= t1, lit: vLit(add(o, mul(d, tt)), m) }); }
    return { out, D, d };
  }
  // dust motes drifting in the room, visible only where the beams catch them
  const MOTES = (() => { const r = MG.rng(1407), a = []; for (let i = 0; i < 220; i++) a.push([lerp(-3.6, 3.6, r()), lerp(0.15, 4.6, r()), lerp(-2.6, 3.2, r()), r(), r()]); return a; })();

  MG.film({
    id: 'lookvolumetric', dur: 10, poster: 8.2,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Volumetric Light', sub: 'God rays through haze, single scattering', era: '1980s —',
      origin: 'Shafts of light through haze — crepuscular rays — were a painter’s and cinematographer’s device long before rendering, built on set with smoke and a hard source through a window. In computer graphics, Jim Blinn’s 1982 paper on light reflection by clouds and dusty surfaces and Kajiya and Von Herzen’s 1984 “Ray Tracing Volume Densities” laid the ground for rendering participating media. Real-time engines adopted ray-marched single scattering against a shadow map in the 2010s, so god rays became a standard game-engine effect.',
      works: 'Blade Runner (Ridley Scott, cinematography Jordan Cronenweth, 1982) · Raiders of the Lost Ark (Steven Spielberg, 1981; the Map Room sunbeam) · Inside (Playdead, 2016)',
      tech: ['Ray-marched single scattering', 'Light-space shadow map', 'Henyey–Greenstein phase'],
      accent: '#ffcf7a',
      motionDNA: 'The camera makes the same slow 50° orbit while the shafts swing across the view, carved by the Token as it turns and bobs. The haze fades in over the first two seconds (density σ 0 → 0.11), the march steps per ray double on the beat (8 → 16 → 32) so the jittered banding settles, and the haze thickens a little near the end. Dust motes drift down through the beams.',
      visualDNA: 'A near-black room, a 3 × 2 window of warm light falling from above and behind, its bars printed on the floor and repeated as dark planes in the air. The Token’s shadow is a solid dark shaft with a bright beam through its hole; the sphere and cube cut their own. Insets show the in-scatter pass alone and one view ray’s lit and shadowed samples.',
      transitions: 'Haze fades in from a clear room; step counts change on the beat',
      implementation: ['Unreal Engine: exponential height fog with volumetric fog', 'Blender: Principled Volume in a world box, spot or area light', 'Canvas 2D + SDF tracer (js/look-kit.js): per-frame light-space shadow map, half-res jittered ray march clipped to the window prism, HG phase, Beer–Lambert transmittance, depth-aware upsample'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const S0 = LK.scene(t), m = vShadowMap(t, S0), sig = vSigma(t), N = vSteps(t);
      const { S } = LK.render(c, t, W, H, vShade, { post: vPost(t) });
      // dust motes in the beams
      if (sig > 0.01) {
        c.save();
        MOTES.forEach(([x, y, z, ph, sz], k) => {
          const yy = ((y - t * 0.08 * (0.5 + ph) - 0.15) % 4.45 + 4.45) % 4.45 + 0.15;
          const p = [x + 0.12 * Math.sin(t * 0.6 + ph * TAU), yy, z + 0.1 * Math.cos(t * 0.45 + k)];
          if (!vLit(p, m)) return;
          const q = LK.project(S, p); if (!q) return;
          const r = clamp(10 / q[2], 0.6, 2.4) * (0.6 + sz);
          c.fillStyle = `rgba(255,236,200,${(0.35 + 0.5 * hash(k * 3.1 + Math.floor(t * 6))) * clamp(sig / 0.08)})`;
          c.beginPath(); c.arc(q[0], q[1], r, 0, TAU); c.fill();
        });
        c.restore();
      }
      tag(c, 'VOLUMETRIC LIGHT  ·  SINGLE SCATTERING', 72, 80, { dark: true, accent: '#ffcf7a' });
      readout(c, 'DENSITY σ', sig.toFixed(3), 98, 122, { dark: true, vc: '#ffcf7a' });
      readout(c, 'STEPS / RAY', `${N}  ·  JITTERED`, 98, 146, { dark: true, vc: '#ffcf7a' });
      readout(c, 'PHASE', `HENYEY–GREENSTEIN g ${VL.g}`, 98, 170, { dark: true });
      readout(c, 'SHADOW TEST', `LIGHT-SPACE MAP ${VMW}×${VMH}`, 98, 194, { dark: true });
      // step-change flash
      [3.4, 5.6].forEach(ts => { const f = 1 - seg(t, ts, ts + 0.6); if (t >= ts && f > 0) { c.save(); c.globalAlpha = f; c.strokeStyle = '#ffcf7a'; c.lineWidth = 2; c.strokeRect(284, 128, 210, 26); c.restore(); } });
      // in-scatter-only inset, top right
      const io = seg(t, 1.6, 2.2);
      if (io > 0.01 && vBuf) {
        if (!vCanvas) { vCanvas = MG.offscreen(VRW, VRH); vCanvas.img = vCanvas.getContext('2d').createImageData(VRW, VRH); }
        const d = vCanvas.img.data;
        for (let i = 0; i < VRW * VRH; i++) { const v = clamp(Math.pow(vBuf[i] * VL.I * 5, 0.8)); d[i * 4] = v * 255; d[i * 4 + 1] = v * 232; d[i * 4 + 2] = v * 190; d[i * 4 + 3] = 255; }
        vCanvas.getContext('2d').putImageData(vCanvas.img, 0, 0);
        c.save(); c.globalAlpha = io;
        const px = 1488, py = 56, pw = 360, ph = 203 + 40;
        panel(c, px, py, pw, ph, true);
        label(c, 'IN-SCATTER PASS ONLY', px + 16, py + 28, { size: 13, ls: 2, weight: 700, color: PAPER });
        label(c, `${VRW}×${VRH}`, px + pw - 16, py + 28, { size: 13, ls: 2, color: 'rgba(236,232,223,0.6)', align: 'right' });
        c.imageSmoothingEnabled = true; c.drawImage(vCanvas, px + 8, py + 40, pw - 16, (pw - 16) * VRH / VRW);
        c.restore();
      }
      // one view ray: sample dots and the running sum
      const ro = seg(t, 3.0, 3.5) * (1 - seg(t, 9.2, 9.6));
      if (ro > 0.01) {
        const target = [0.45, 0, 1.75], q = LK.project(S, target), { out, D } = vRaySamples(S, m, target, 48);
        c.save(); c.globalAlpha = ro;
        if (q) {
          c.strokeStyle = '#ffcf7a'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(q[0] - 22, q[1]); c.lineTo(q[0] - 8, q[1]); c.moveTo(q[0] + 8, q[1]); c.lineTo(q[0] + 22, q[1]); c.moveTo(q[0], q[1] - 22); c.lineTo(q[0], q[1] - 8); c.moveTo(q[0], q[1] + 8); c.lineTo(q[0], q[1] + 22); c.stroke();
          label(c, 'THIS PIXEL', q[0] + 30, q[1] - 14, { size: 13, ls: 2, weight: 700, color: PAPER });
        }
        const px = 1352, py = 760, pw = 496, ph = 168;
        panel(c, px, py, pw, ph, true);
        label(c, 'ONE VIEW RAY  ·  CAMERA → SURFACE', px + 16, py + 28, { size: 13, ls: 2, weight: 700, color: PAPER });
        const ax = px + 30, aw = pw - 60, ay = py + 84;
        c.fillStyle = 'rgba(236,232,223,0.25)'; c.fillRect(ax, ay, aw, 2);
        let acc = 0; const cum = [];
        out.forEach(s => { if (s.lit) acc += Math.exp(-0.11 * s.t); cum.push(acc); });
        out.forEach((s, k) => {
          const x = ax + s.t / D * aw;
          c.fillStyle = s.lit ? '#ffcf7a' : s.inP ? 'rgba(120,120,135,0.9)' : 'rgba(236,232,223,0.18)';
          c.beginPath(); c.arc(x, ay + 1, s.lit ? 4.5 : 3, 0, TAU); c.fill();
        });
        // marched samples (current step count) as ticks above
        for (let k = 0; k < N; k++) { const x = ax + (k + 0.5) / N * aw; c.fillStyle = 'rgba(236,232,223,0.5)'; c.fillRect(x - 0.5, ay - 16, 1, 8); }
        c.strokeStyle = '#ffcf7a'; c.lineWidth = 2; c.beginPath();
        cum.forEach((v, k) => { const x = ax + out[k].t / D * aw, y = py + ph - 22 - v / Math.max(acc, 1) * 46; k ? c.lineTo(x, y) : c.moveTo(x, y); });
        c.stroke();
        label(c, 'CAM', ax, ay + 30, { size: 11, ls: 1, color: 'rgba(236,232,223,0.6)', align: 'center' });
        label(c, 'HIT', ax + aw, ay + 30, { size: 11, ls: 1, color: 'rgba(236,232,223,0.6)', align: 'center' });
        label(c, '● LIT  ● SHADOWED  │ MARCH STEP   — Σ IN-SCATTER', px + 16, py + ph - 8, { size: 11, ls: 1, color: 'rgba(236,232,223,0.7)' });
        c.restore();
      }
      // leaders
      const shaft = add(S.tok.c, mul(VL.Ld, -1.5));
      leader(c, S, shaft, -170, 60, 'SHADOW SHAFT', { dark: true, on: seg(t, 2.4, 2.9) * (1 - seg(t, 8.8, 9.2)), sub: 'TOKEN BLOCKS THE BEAM', dot: '#ffcf7a' });
      leader(c, S, tokPoint(S, [0.4, 0.4, 0.22]), -230, -110, 'LIT HAZE THROUGH THE HOLE', { dark: true, on: seg(t, 4.2, 4.7) * (1 - seg(t, 8.8, 9.2)), sub: 'THE SHAFT HAS A GAP', dot: '#ffcf7a' });
      const bar = add([VL.cx + VL.hw / 3, 0, VL.cz + 0.9], mul(VL.Ld, -(VL.Y0 - 3.4) / VL.Ld[1]));
      leader(c, S, bar, 150, -60, 'WINDOW BAR  ·  DARK PLANE', { dark: true, on: seg(t, 5.8, 6.3) * (1 - seg(t, 8.8, 9.2)), sub: 'LIGHT FROM ABOVE-BEHIND', dot: '#ffcf7a' });
      LK.caption(c, t, W, H, { name: 'Volumetric Light', cat: 'Light', dark: true });
    },
    score(A) {
      LK.bed(A, { g: 0.85 });
      // the haze arriving: a slow airy swell
      A.noise(0.5, { type: 'bandpass', f: 500, f2: 1600, q: 0.7, dur: 3.2, g: 0.06, swell: 0.8, rev: 0.7 });
      A.chord(0.6, [64, 71, 76], { type: 'sine', dur: 4.5, g: 0.022, a: 1.6, rev: 0.8, width: 0.9 });
      A.chord(5.2, [62, 69, 74, 78], { type: 'sine', dur: 4.6, g: 0.02, a: 1.4, rev: 0.8, width: 0.9 });
      // step changes: a soft tick-bell, more partials each time
      [[3.4, 79], [5.6, 83]].forEach(([tt, n]) => { A.osc(tt, { f: 2600, dur: 0.04, g: 0.05 }); A.bell(tt, midi(n), { g: 0.06, dur: 1.6, rev: 0.6 }); });
      // dust glints
      for (let k = 0; k < 10; k++) { const tt = 2.6 + k * 0.68 + hash(k * 7.7) * 0.2; A.osc(tt, { type: 'sine', f: midi(88 + [0, 3, 7, 10, 12][k % 5]), dur: 0.5, g: 0.012, a: 0.01, rev: 0.8, pan: hash(k * 3.3) * 1.2 - 0.6 }); }
      A.noise(6.6, { type: 'lowpass', f: 400, dur: 2.0, g: 0.05, swell: 0.7, rev: 0.6 });
    },
  });

  /* =====================================================================
     TOON RAMP — cel shading taken apart. Lighting is reduced to one
     number, half-Lambert N·L (cast shadows forced below the terminator),
     which is looked up in a stepped ramp: 2 bands, then 3, then 4, each
     band a flat colour between a cool shade tone and the full albedo. A
     Blinn highlight thresholded hard becomes a white blob. Then a post
     pass draws ink: at every pixel the G-buffer is compared with its
     neighbours — a change of object id (silhouettes), a jump in depth off
     the surface plane (overlaps), or a turn in the normal (creases) marks
     an edge. An inset shows the edge pass coloured by which test fired;
     another shows the ramp the shading reads from.
     ===================================================================== */
  const T_WIPE = [0.3, 1.9], T_INK = [2.0, 2.9], T_RES = [1024, 576];
  const T_BANDS = [[0, 2], [3.4, 3], [6.2, 4]];
  const tBands = t => { let b = 2; T_BANDS.forEach(([ts, n]) => { if (t >= ts) b = n; }); return b; };
  const T_SHADE = [0.5, 0.52, 0.72], T_LIT = [1.03, 1.0, 0.96];
  const T_FLOOR = LK.BG.map((v, i) => v / T_LIT[i]);   // the lit floor band matches the backdrop
  function tRamp(x, B, a) {   // x 0..1 half-Lambert → banded colour
    const k = Math.min(B - 1, Math.floor(x * B)), u = B > 1 ? k / (B - 1) : 1;
    return [a[0] * lerp(T_SHADE[0], T_LIT[0], u), a[1] * lerp(T_SHADE[1], T_LIT[1], u), a[2] * lerp(T_SHADE[2], T_LIT[2], u)];
  }
  function tShade(g, S, B) {
    if (!g.hit) return LK.BG;
    const n = g.n, L = LK.KEY, ndl = dot(n, L);
    let x = 0.5 + 0.5 * ndl;
    if (ndl > 0 && LK.shadow(add(g.p, mul(n, 0.01)), L, S, 40) < 0.5) x = Math.min(x, 0.499);
    const a = g.id === 0 ? T_FLOOR : LK.albedo(g.id);
    let col = tRamp(x, B, a);
    if (g.id !== 0 && x >= 0.5) {
      const hv = norm(sub(L, g.d)), s = Math.pow(Math.max(0, dot(n, hv)), 40);
      if (s > 0.6) col = [0.99, 0.98, 0.95];
    }
    return g.id === 0 ? LK.floorFade(col, g) : col;
  }
  let tEdge = null, tEdgeCv = null;
  function tPost(t, sx) {
    return (rgb, G) => {
      const { w, h } = G, ids = G.id, P3 = G.P3, N3 = G.N3, n = w * h;
      const src = new Uint8Array(n), e = new Float32Array(n);
      const reveal = E.ioC(seg(t, T_INK[0], T_INK[1])) * 1.1;
      const cls = new Uint8Array(n), Mt = G.S.tok.M, Mc = G.S.cubeM;
      for (let i = 0; i < n; i++) {
        const a = ids[i]; if (a !== 1 && a !== 3) continue;
        const M = a === 1 ? Mt : Mc, x = N3[i * 3], y = N3[i * 3 + 1], z = N3[i * 3 + 2];
        const l0 = M[0] * x + M[3] * y + M[6] * z, l1 = M[1] * x + M[4] * y + M[7] * z, l2 = M[2] * x + M[5] * y + M[8] * z;
        if (a === 1) cls[i] = l2 > 0.707 ? 1 : l2 < -0.707 ? 2 : 3;
        else { const ax = Math.abs(l0), ay = Math.abs(l1), az = Math.abs(l2); cls[i] = ax >= ay && ax >= az ? (l0 > 0 ? 1 : 2) : ay >= az ? (l1 > 0 ? 3 : 4) : (l2 > 0 ? 5 : 6); }
      }
      for (let y = 2; y < h - 2; y++) for (let x = 2; x < w - 2; x++) {
        const i = y * w + x, a = ids[i];
        let code = 0;
        // id test (8 neighbours); floor ↔ backdrop is a fade, not an edge
        for (const o of [1, -1, w, -w, w + 1, w - 1, -w + 1, -w - 1]) {
          const b = ids[i + o];
          // ink goes on the nearer side of the boundary only, which keeps the line one pass wide
          if (b !== a && !((a === 0 && b === 255) || (a === 255 && b === 0)) && G.depth[i + o] > G.depth[i]) { code = 1; break; }
        }
        if (!code && a !== 255) {
          // depth test: neighbour's distance off this pixel's tangent plane
          const px = P3[i * 3], py = P3[i * 3 + 1], pz = P3[i * 3 + 2], nx = N3[i * 3], ny = N3[i * 3 + 1], nz = N3[i * 3 + 2], tol = 0.012 * G.depth[i];
          for (const o of [1, -1, w, -w]) {
            const j = (i + o) * 3;
            if (G.depth[i + o] > G.depth[i] && Math.abs((P3[j] - px) * nx + (P3[j + 1] - py) * ny + (P3[j + 2] - pz) * nz) > tol) { code = 2; break; }
          }
          // normal test: the normal, taken into the object's own frame, is classed by the face it
          // points along (cube: ±x ±y ±z; Token: front, back, side), so a rounded edge gives one
          // line along its middle instead of a band as wide as the rounding
          if (!code && (a === 1 || a === 3)) {
            const ci = cls[i];
            if (ci !== cls[i + 1] && ids[i + 1] === a || ci !== cls[i + w] && ids[i + w] === a) code = 3;
          }
        }
        src[i] = code;
        if (code && (x + 0.5) / w < Math.min(sx, reveal)) e[i] = 1;
      }
      // dilate by one pixel so the ink reads at full frame; the inset gets the same treatment
      const e2 = new Float32Array(n), s2 = new Uint8Array(n);
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        e2[i] = Math.max(e[i], e[i - 1], e[i + 1], e[i - w], e[i + w]);
        s2[i] = src[i] || src[i - 1] || src[i + 1] || src[i - w] || src[i + w] || src[i - w - 1] || src[i + w + 1] || src[i - w + 1] || src[i + w - 1];
      }
      e.set(e2);
      tEdge = s2;
      // soften the ink a touch so it scales up cleanly
      const ink = [0.08, 0.075, 0.09];
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const s = (4 * e[i] + 2 * (e[i - 1] + e[i + 1] + e[i - w] + e[i + w]) + e[i - w - 1] + e[i - w + 1] + e[i + w - 1] + e[i + w + 1]) / 16;
        const k = clamp(s * 1.5);
        if (k > 0) for (let ch = 0; ch < 3; ch++) rgb[i * 3 + ch] = lerp(rgb[i * 3 + ch], ink[ch], k);
      }
    };
  }

  MG.film({
    id: 'looktoon', dur: 10, poster: 7.4,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Toon Ramp', sub: 'Quantised N·L, hard specular, G-buffer ink', era: '2000 —',
      origin: 'Rendering 3D models to look hand-inked grew out of non-photorealistic rendering research in the 1990s; Lake, Marshall, Harris and Blackstein’s “Stylized Rendering Techniques for Scalable Real-Time 3D Animation” (NPAR 2000) described the now-standard trick of looking N·L up in a small stepped texture. Jet Set Radio (Sega, 2000) brought cel shading with ink outlines to a mass audience, and The Legend of Zelda: The Wind Waker (Nintendo, 2002) made it a house style. Modern anime-style renderers add hand-tuned ramps per material and outlines found from depth, normal and id buffers in post.',
      works: 'Jet Set Radio (Smilebit / Sega, 2000) · The Legend of Zelda: The Wind Waker (Nintendo, 2002) · Guilty Gear Xrd (Arc System Works, 2014)',
      tech: ['N·L ramp lookup', 'Thresholded specular', 'Edge detection on G-buffers'],
      accent: '#ff5a1f',
      motionDNA: 'The camera makes the same slow 50° orbit. A wipe turns the plain render into flat two-band shading; ink outlines sweep in across the frame; the ramp then steps up to three bands and to four on the beat, each step visible on every surface at once as the Token turns through the light.',
      visualDNA: 'Flat fills between a cool shade tone and the full albedo, a crisp terminator and hard-edged cast shadows, white specular blobs, a dark ink line around every silhouette, overlap and crease. Insets: the ramp strip (smooth N·L above, the stepped lookup below) and the edge pass coloured by the test that found each line.',
      transitions: 'One wipe from the plain reference; outlines reveal left to right; band count steps 2 → 3 → 4',
      implementation: ['Blender: Shader to RGB + Color Ramp (constant), Line Art / Freestyle', 'Unity / Unreal: ramp-texture lookup in a custom lit shader, Sobel outline post-process', 'Canvas 2D + SDF tracer (js/look-kit.js): half-Lambert N·L quantised to B bands with shadows forced below the terminator, thresholded Blinn, id / depth-plane / normal edge tests on the G-buffer'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const B = tBands(t), sx = E.ioC(seg(t, T_WIPE[0], T_WIPE[1])) * 1.04 - 0.02;
      // look on the right of the split, plain on the left
      const { S } = LK.render(c, t, W, H, (g, S) => (g.u < sx ? tShade(g, S, B) : LK.plain(g, S)), { post: tPost(t, sx), res: T_RES });
      if (t < T_WIPE[1] + 0.1) splitBar(c, sx * W, H, 'TOON RAMP', 'PLAIN REFERENCE');
      tag(c, 'TOON RAMP  ·  QUANTISED N·L + INK', 72, 80);
      readout(c, 'RAMP', `${B} BANDS`, 98, 122, { vc: P.accent });
      readout(c, 'SPECULAR', 'BLINN > 0.6 → WHITE', 98, 146);
      readout(c, 'OUTLINE', t < T_INK[0] ? 'OFF' : 'ID · DEPTH · NORMAL', 98, 170);
      T_BANDS.slice(1).forEach(([ts]) => { const f = 1 - seg(t, ts, ts + 0.6); if (t >= ts && f > 0) { c.save(); c.globalAlpha = f; c.strokeStyle = P.accent; c.lineWidth = 2; c.strokeRect(282, 104, 140, 26); c.restore(); } });
      // ramp inset, bottom right
      const ro = seg(t, 2.6, 3.1);
      if (ro > 0.01) {
        c.save(); c.globalAlpha = ro;
        const px = 1372, py = 800, pw = 476, ph = 196;
        panel(c, px, py, pw, ph);
        label(c, 'RAMP  ·  N·L IN → COLOUR OUT', px + 16, py + 28, { size: 13, ls: 2, weight: 700, color: INK });
        const bx = px + 20, bw = pw - 40, a = P.tok;
        for (let i = 0; i < bw; i += 2) {
          const x = i / bw, lam = Math.max(0, 2 * x - 1) * 1.05 + 0.3;
          c.fillStyle = rgbStr(LK.tone([a[0] * lam, a[1] * lam, a[2] * lam], 1.2)); c.fillRect(bx + i, py + 46, 2, 30);
          c.fillStyle = rgbStr(tRamp(x, B, a)); c.fillRect(bx + i, py + 84, 2, 38);
        }
        c.strokeStyle = 'rgba(23,24,28,0.4)'; c.lineWidth = 1; c.strokeRect(bx + 0.5, py + 46.5, bw, 30); c.strokeRect(bx + 0.5, py + 84.5, bw, 38);
        for (let k = 1; k < B; k++) { const x = bx + k / B * bw; c.fillStyle = INK; c.fillRect(x - 1, py + 80, 2, 46); }
        // terminator
        const tx = bx + bw / 2; c.fillStyle = P.accent; c.fillRect(tx - 1.5, py + 40, 3, 92);
        label(c, 'SMOOTH', bx, py + 140, { size: 11, ls: 1 });
        label(c, 'N·L = 0  ·  TERMINATOR', tx, py + 146, { size: 11, ls: 1, color: P.accent, align: 'center', weight: 700 });
        label(c, `${B} STEPS`, bx + bw, py + 140, { size: 11, ls: 1, align: 'right', weight: 700, color: INK });
        label(c, 'SHADE ←  HALF-LAMBERT 0.5 + 0.5 N·L  → LIT', px + pw / 2, py + 176, { size: 11, ls: 1, align: 'center' });
        c.restore();
      }
      // edge-pass inset, top right, coloured by test
      const eo = seg(t, 3.0, 3.5);
      if (eo > 0.01 && tEdge) {
        const [w, h] = T_RES;
        if (!tEdgeCv) { tEdgeCv = MG.offscreen(w, h); tEdgeCv.img = tEdgeCv.getContext('2d').createImageData(w, h); }
        const d = tEdgeCv.img.data, cols = [[246, 243, 236], [255, 90, 31], [47, 91, 255], [23, 24, 28]];
        for (let i = 0; i < w * h; i++) { const cc = cols[tEdge[i]]; d[i * 4] = cc[0]; d[i * 4 + 1] = cc[1]; d[i * 4 + 2] = cc[2]; d[i * 4 + 3] = 255; }
        tEdgeCv.getContext('2d').putImageData(tEdgeCv.img, 0, 0);
        c.save(); c.globalAlpha = eo;
        const px = 1448, py = 56, pw = 400, ph = 225 + 70;
        panel(c, px, py, pw, ph);
        label(c, 'EDGE PASS  ·  G-BUFFER TESTS', px + 16, py + 28, { size: 13, ls: 2, weight: 700, color: INK });
        c.imageSmoothingEnabled = true; c.drawImage(tEdgeCv, px + 8, py + 40, pw - 16, (pw - 16) * h / w);
        const ly = py + ph - 12;
        [['ID', P.accent], ['DEPTH', P.blue], ['NORMAL', INK]].forEach(([s, col], k) => {
          const x = px + 20 + k * 120; c.fillStyle = col; c.fillRect(x, ly - 11, 14, 14);
          label(c, s, x + 22, ly, { size: 12, ls: 2, weight: 700, color: INK });
        });
        c.restore();
      }
      // leaders
      const cam = S.cam.pos, sc = LK.SPH.c, toCam = norm(sub(cam, sc)), K = LK.KEY;
      const nt = norm(sub(toCam, mul(K, dot(toCam, K))));
      const lo = (a, b) => seg(t, a, a + 0.5) * (1 - seg(t, 9.0, 9.4));
      leader(c, S, add(sc, mul(nt, LK.SPH.r)), 90, 120, 'HARD TERMINATOR', { on: lo(3.8), sub: 'BAND EDGE AT N·L = 0' });
      leader(c, S, add(sc, mul(norm(add(K, toCam)), LK.SPH.r)), -120, -120, 'SPECULAR BLOB', { on: lo(4.4), sub: 'THRESHOLDED BLINN' });
      const cy = LK.CUBE.yaw, cs = Math.cos(cy), sn = Math.sin(cy);
      const edge = add(LK.CUBE.c, [sn * 0.5 + cs * 0.15, 0.5, cs * 0.5 - sn * 0.15]);
      leader(c, S, edge, -60, -150, 'CREASE  ·  NORMAL TEST', { on: lo(5.0) });
      leader(c, S, tokPoint(S, [0.7, -0.99, 0.2]), -80, 150, 'SILHOUETTE  ·  ID TEST', { on: lo(5.6), sub: 'OBJECT ID CHANGES' });
      LK.caption(c, t, W, H, { name: 'Toon Ramp', cat: 'Shading' });
    },
    score(A) {
      LK.bed(A);
      A.whoosh(T_WIPE[0], T_WIPE[1] - T_WIPE[0], { f1: 400, f2: 3000, q: 1.6, g: 0.08, swell: 0.6, rev: 0.3, pan: -0.2 });
      A.pluck(T_WIPE[1], midi(64), { g: 0.16, bright: 0.6, dur: 1.0 });
      A.pluck(T_WIPE[1] + 0.12, midi(71), { g: 0.13, bright: 0.6, dur: 1.0 });
      // ink: a scratchy pen stroke as the outlines sweep in
      A.noise(T_INK[0], { type: 'bandpass', f: 3200, f2: 5200, q: 2.4, dur: T_INK[1] - T_INK[0], g: 0.05, swell: 0.4, crush: true, pan: 0.3 });
      for (let k = 0; k < 6; k++) A.noise(T_INK[0] + 0.1 + k * 0.13, { type: 'highpass', f: 6000, dur: 0.02, g: 0.04, pan: -0.4 + k * 0.16 });
      // each ramp step plays one pluck per band, climbing
      T_BANDS.slice(1).forEach(([ts, n]) => {
        const sc = [60, 64, 67, 72];
        for (let k = 0; k < n; k++) A.pluck(ts + k * 0.09, midi(sc[k] + (n === 4 ? 2 : 0)), { g: 0.12, bright: 0.75, dur: 1.0, rev: 0.25 });
        A.osc(ts, { type: 'square', f: midi(84 + n), dur: 0.06, g: 0.02, lp: 3000 });
      });
      A.chord(8.6, [60, 64, 67, 71], { type: 'triangle', dur: 1.4, g: 0.035, a: 0.05, lp: 2400, rev: 0.5, width: 0.8 });
    },
  });
})();
