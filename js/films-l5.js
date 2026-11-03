/* batch l5 — Rendering Looks · Image: lookfog · lookgrade · lookgrain.
   lookfog (distance fog from the depth pass: exponential, exponential-squared and height fog,
   the fog colour matched to the backdrop, with the depth pass inset and the density curve) ·
   lookgrade (a teal & orange grade in post — lift / gamma / gain, a split-tone, colour wheels,
   a vectorscope and the luma curve — then a bleach-bypass preset as contrast) ·
   lookgrain (filmic finishing on a low-key render: seeded per-frame grain weighted to the
   midtones, red-orange halation from a blurred highlight threshold, gate weave and vignette). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, hash, vnoise, midi, text } = MG;
  const LK = MG.LK, TK = MG.TK, P = LK.P, V = LK.V;

  /* ---------------- shared helpers ---------------- */
  const label = LK.label;
  const PAPER = 'rgba(236,232,223,0.86)', NIGHT = 'rgba(12,12,14,0.72)';
  const tag = (c, s, x, y, o = {}) => {   // accent dot + bold mono label, top-left
    c.save(); c.globalAlpha *= o.on ?? 1;
    c.fillStyle = o.accent || P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: o.dark ? P.paper : P.ink, weight: 700, size: 20 });
    c.restore();
  };
  const panel = (c, x, y, w, h, dark) => { c.fillStyle = dark ? NIGHT : PAPER; c.fillRect(x, y, w, h); };
  /* Leader line from a world point to a label: dot on the object, elbow, mono text. */
  function leader(c, S, p, lines, dx, dy, o = {}) {
    const q = LK.project(S, p); if (!q) return;
    if (q[0] + dx + 320 > 1920) dx = -Math.abs(dx);
    if (q[0] + dx - 320 < 0) dx = Math.abs(dx);
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
  const f3 = v => v.toFixed(3), f2 = v => v.toFixed(2);
  const toHex = c => '#' + c.map(v => Math.round(clamp(v) * 255).toString(16).padStart(2, '0')).join('');
  const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

  /* The kit's neutral shading (key + soft shadow, sky fill, AO) without the floor's fade into the
     backdrop, so a look can do its own atmospheric falloff. Same constants as LK.plain. */
  function lit(g, S) {
    const a = LK.albedo(g.id), n = g.n;
    const dif = Math.max(0, V.dot(n, LK.KEY)) * LK.shadow(V.add(g.p, V.mul(n, 0.01)), LK.KEY, S, 12);
    const occ = LK.ao(g.p, n, S), sky = 0.55 + 0.45 * n[1], fill = Math.max(0, V.dot(n, LK.FILL)) * 0.35;
    const k = 1.05 * dif + (0.42 * sky + fill) * occ;
    return LK.tone([a[0] * k, a[1] * k, a[2] * k], 1.3);
  }

  /* =====================================================================
     FOG — atmospheric falloff computed from the depth pass. Every pixel's
     lit colour is mixed toward the fog colour by f(z), the fraction of
     light scattered away over distance z beyond a start distance z0.
     Exponential fog (f = 1 − e^−ρz) thickens from the first metre; the
     squared form (f = 1 − e^−(ρz)²) keeps the foreground clear and closes
     in fast; height fog integrates a density that decays with altitude,
     ρ(y) = a·e^−by, along each view ray, so a mist pools on the floor.
     The fog colour must equal the backdrop's horizon colour or the floor
     shows a seam where it meets the sky; the film detunes it to prove it.
     ===================================================================== */
  const FOGC = [0.66, 0.71, 0.75], MISCOL = LK.BG;
  const FZ0 = 3.5;
  // [time, value] keys
  const F_SPLIT = [[0.6, 0], [2.0, 1, E.ioC]];
  const F_MIS = [[2.5, 0], [2.9, 1, E.ioC], [3.5, 1], [3.9, 0, E.ioC]];
  const F_RHO = [[0.6, 0.1], [4.1, 0.1], [4.7, 0.15, E.ioC], [5.1, 0.15], [5.6, 0.12, E.ioC]];
  const F_E2 = [[5.1, 0], [5.6, 1, E.ioC]];
  const F_H = [[6.7, 0], [7.5, 1, E.ioC]];
  const F_HB = [[7.5, 2.2], [9.2, 1.5, E.ioS]];
  function fogAt(t) {
    const e2 = kf(t, F_E2), h = kf(t, F_H);
    return {
      split: kf(t, F_SPLIT), mis: kf(t, F_MIS), rho: kf(t, F_RHO), e2, h,
      a: 0.6, b: kf(t, F_HB), on: seg(t, 0.6, 0.61),
      col: LK.mix3(FOGC, MISCOL, kf(t, F_MIS)),
      mode: h > 0.5 ? 'HEIGHT' : e2 > 0.5 ? 'EXP2' : 'EXP',
    };
  }
  // fog amount for a ray: exp / exp² over z beyond z0, blended toward height fog
  function fogAmount(F, z, oy, dy, px, pz, t) {
    const zz = Math.max(0, z - FZ0);
    const fe = 1 - Math.exp(-F.rho * zz), fe2 = 1 - Math.exp(-(F.rho * zz) * (F.rho * zz));
    let f = lerp(fe, fe2, F.e2);
    if (F.h > 0) {
      // ∫ a·e^(−b(oy + dy·s)) ds from 0 to z, with a little wisp noise on the density
      const b = F.b, k = Math.abs(dy) < 1e-4 ? z : (1 - Math.exp(-b * dy * Math.min(z, 400))) / (b * dy);
      const wisp = px === null ? 1 : 1 + 0.4 * (vnoise(px * 0.7 + t * 0.25, 3) * 0.6 + vnoise(pz * 0.9 - t * 0.18, 7) * 0.4);
      const amt = F.a * wisp * Math.exp(-b * oy) * k + 0.02 * zz;
      const fh = 1 - Math.exp(-Math.max(0, amt));
      f = lerp(f, fh, F.h);
    }
    return clamp(f);
  }
  const fogSky = d => LK.mix3(FOGC, [0.5, 0.57, 0.65], smooth(0.0, 0.5, d[1]));   // horizon = fog colour
  function fogCurve(F) {
    if (F.h > 0.5) { const b = F.b; return u => Math.exp(-b * u * 3); }   // density over height 0..3
    return u => { const zz = Math.max(0, u * 30 - FZ0); return lerp(1 - Math.exp(-F.rho * zz), 1 - Math.exp(-((F.rho * zz) ** 2)), F.e2); };
  }

  MG.film({
    id: 'lookfog', dur: 10, poster: 8.4,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Depth Fog', sub: 'Distance falloff from the depth pass', era: '1980s —',
      origin: 'Fog is the oldest depth cue in real-time graphics: the image is blended toward a fog colour by a function of distance, so far geometry fades into the backdrop instead of popping at the far clip plane. Flight simulators used it from the 1980s, and fixed-function OpenGL (1992) and Direct3D standardised three modes — linear, exponential and exponential-squared — computed per vertex or per pixel from eye depth. Height-dependent fog, which integrates a density that thins with altitude along the view ray, became common in game engines in the 2000s; modern engines extend it to volumetric fog that also scatters light.',
      works: 'Silent Hill (Konami, 1999; fog as atmosphere and draw-distance cover) · Turok: Dinosaur Hunter (Iguana Entertainment, 1997; distance fog on the Nintendo 64) · Limbo (Playdead, 2010; layered depth haze)',
      tech: ['Fog factor from the depth pass', 'Exp / exp² / height falloff', 'Fog colour = horizon colour'],
      accent: '#a9a294',
      motionDNA: 'The camera makes the shared 50° orbit while the fog is dialled on the beat: a wipe brings exponential fog in over the plain render, the fog colour is detuned to a cool grey and back to show the horizon seam, the density rises, the falloff switches to exponential-squared, then to a height fog whose mist pools on the floor and slowly thickens as its falloff relaxes.',
      visualDNA: 'The Token, sphere and cube receding into warm paper haze; the floor dissolves into a backdrop of exactly the fog colour. Mono readouts give the mode, the formula, ρ, z0 and the two colour swatches; a depth-pass inset runs near white to far black; leader lines give each object its depth and fog fraction; the caption draws the live falloff curve.',
      transitions: 'Linear wipe against the plain render; crossfades between fog models',
      implementation: ['OpenGL / Direct3D fixed-function fog (GL_EXP, GL_EXP2)', 'Engine height fog / deferred fog pass over the depth buffer', 'Canvas 2D + SDF tracer (js/look-kit.js): per-pixel fog factor from hit depth and the analytic height-fog integral along each ray'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const F = fogAt(t);
      const shade = (g, S) => {
        if (g.u > F.split) return LK.plain(g, S);
        if (!g.hit) {
          const sky = fogSky(g.d);
          if (F.h <= 0) return sky;
          const f = fogAmount(F, 1e3, S.cam.pos[1], g.d[1], null, null, t);
          return LK.mix3(sky, F.col, f * F.h * 0.6);
        }
        const base = lit(g, S), f = fogAmount(F, g.depth, S.cam.pos[1], g.d[1], g.p[0], g.p[2], t);
        return LK.mix3(base, F.col, f);
      };
      const { G, S } = LK.render(c, t, W, H, shade);
      // split edge
      if (F.split > 0 && F.split < 1) {
        const x = F.split * W;
        c.fillStyle = P.ink; c.fillRect(x - 1.5, 0, 3, H);
        label(c, 'FOG', x - 18, 160, { align: 'right', size: 16, color: P.ink, weight: 700 });
        label(c, 'PLAIN', x + 18, 160, { size: 16, color: P.ink, weight: 700 });
      }
      // readout panel
      const on = seg(t, 0.3, 0.7);
      c.save(); c.globalAlpha = on;
      panel(c, 56, 44, 560, 214);
      tag(c, F.mode === 'HEIGHT' ? 'HEIGHT FOG' : F.mode === 'EXP2' ? 'EXPONENTIAL² FOG' : 'EXPONENTIAL FOG', 72, 84);
      const formula = F.mode === 'HEIGHT' ? 'f = 1 − e^−∫ a·e^(−b·y) ds' : F.mode === 'EXP2' ? 'f = 1 − e^−(ρ·(z − z₀))²' : 'f = 1 − e^−ρ·(z − z₀)';
      text(c, formula, 98, 128, { font: TK.MONO, size: 24, color: P.ink, weight: 700 });
      const dens = F.mode === 'HEIGHT' ? `a ${f2(F.a)}   b ${f2(F.b)}   ρ(y) = a·e^(−b·y)` : `ρ ${f3(F.rho)}   z₀ ${FZ0.toFixed(1)}`;
      label(c, dens, 98, 162, { size: 17, color: P.ink });
      // fog colour vs backdrop swatches
      const sw = (x, col, s) => { c.fillStyle = toHex(col); c.fillRect(x, 186, 34, 34); c.strokeStyle = 'rgba(23,24,28,0.5)'; c.strokeRect(x + 0.5, 186.5, 33, 33); label(c, s, x + 44, 209, { size: 14, ls: 2 }); };
      sw(98, F.col, 'FOG');
      sw(218, FOGC, 'BACKDROP');
      const match = F.mis < 0.05;
      label(c, match ? '= MATCHED' : '≠  SEAM', 390, 209, { size: 15, color: match ? P.ink : '#c63e0c', weight: 700 });
      c.restore();
      // seam call-out while detuned
      if (F.mis > 0.05) {
        c.save(); c.globalAlpha = smooth(0.1, 0.6, F.mis);
        c.strokeStyle = '#c63e0c'; c.lineWidth = 2; c.setLineDash([8, 6]);
        const cp = S.cam.pos, hz = LK.project(S, [cp[0] + S.cam.fw[0] * 1e4, cp[1], cp[2] + S.cam.fw[2] * 1e4]), hy = hz ? hz[1] : 400;
        c.beginPath(); c.moveTo(0, hy); c.lineTo(W, hy); c.stroke(); c.setLineDash([]);
        const msg = 'FLOOR FADES TO FOG, SKY STAYS BACKDROP: A SEAM';
        panel(c, 660, hy + 14, msg.length * 11 + 24, 30); label(c, msg, 672, hy + 35, { size: 15, color: '#c63e0c', weight: 700 });
        c.restore();
      }
      // depth pass inset: near white → far black
      const dv = seg(t, 1.2, 1.7);
      if (dv > 0) {
        const iw = 200, ih = 113, sh = sheet('fogdepth', iw, ih), d = sh.img.data;
        for (let y = 0; y < ih; y++) for (let x = 0; x < iw; x++) {
          const i = Math.floor(y * G.h / ih) * G.w + Math.floor(x * G.w / iw), z = G.depth[i];
          const v = G.id[i] === 255 ? 0 : 255 * (1 - clamp((z - 4) / 16)) ** 1.2, o = (y * iw + x) * 4;
          d[o] = d[o + 1] = d[o + 2] = v; d[o + 3] = 255;
        }
        sh.cx.putImageData(sh.img, 0, 0);
        inset(c, sh.cv, W - 72 - 400, 84, 400, 225, 'DEPTH PASS  ·  NEAR 1 → FAR 0', { on: dv });
        // ramp
        c.save(); c.globalAlpha = dv;
        const gr = c.createLinearGradient(W - 472, 0, W - 72, 0); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#000');
        c.fillStyle = gr; c.fillRect(W - 472, 318, 400, 8);
        label(c, 'z 4', W - 472, 344, { size: 12, ls: 2, color: P.ink }); label(c, 'z 20+', W - 72, 344, { size: 12, ls: 2, color: P.ink, align: 'right' });
        c.restore();
      }
      // depth + fog fraction leaders
      const lv = seg(t, 2.0, 2.4);
      const objs = [[LK.SPH.c, 'SPHERE', -110, 120], [LK.CUBE.c, 'CUBE', 110, -170], [S.tok.c, 'TOKEN', -150, -150]];
      objs.forEach(([p, name, dx, dy]) => {
        const z = V.len(V.sub(p, S.cam.pos)), dir = V.norm(V.sub(p, S.cam.pos)), f = fogAmount(F, z, S.cam.pos[1], dir[1], p[0], p[2], t);
        leader(c, S, p, [name, `z ${z.toFixed(1)}  ·  fog ${f2(f)}`], dx, dy, { on: lv });
      });
      // caption curve: fog over depth (marker at the cube's depth) or density over height
      const cz = V.len(V.sub(LK.CUBE.c, S.cam.pos)), mu = F.h > 0.5 ? 0.25 / 3 : cz / 30;
      LK.caption(c, t, W, H, { name: 'Depth Fog', cat: 'Image', curve: fogCurve(F), span: [t - mu, t - mu + 1], lo: -0.1, hi: 1.15, curveLabel: F.h > 0.5 ? 'DENSITY / HEIGHT 0–3' : 'FOG f / DEPTH z 0–30' });
    },
    score(A) {
      LK.bed(A);
      // a long airy wash that thickens with the fog
      A.noise(0.6, { type: 'lowpass', f: 500, f2: 1400, sweep: 4, dur: 6, g: 0.05, swell: 0.6, rev: 0.6 });
      A.noise(6.7, { type: 'lowpass', f: 300, f2: 180, sweep: 3, dur: 3.3, g: 0.06, swell: 0.5, rev: 0.7 });
      A.whoosh(0.6, 1.4, { f1: 200, f2: 1800, q: 1.1, g: 0.1, swell: 0.6, pan: -0.3 });
      // detune: a sour interval, resolved
      A.osc(2.5, { type: 'triangle', f: midi(66), dur: 1.2, g: 0.04, a: 0.2, lp: 1600, rev: 0.5 });
      A.osc(2.5, { type: 'triangle', f: midi(67), dur: 1.2, g: 0.035, a: 0.2, lp: 1600, rev: 0.5 });
      A.bell(3.9, midi(76), { g: 0.06, dur: 1.6, rev: 0.6 });
      // density up, exp², height fog
      A.osc(4.1, { type: 'sine', f: midi(57), f2: midi(64), glide: 0.6, dur: 0.9, g: 0.05, a: 0.1, rev: 0.5 });
      A.bell(5.1, midi(79), { g: 0.06, dur: 1.6, rev: 0.6 });
      A.pluck(5.1, midi(67), { g: 0.12, bright: 0.4, dur: 1.2, rev: 0.4 });
      A.chord(6.7, [45, 52, 57, 64], { type: 'sine', dur: 3.3, g: 0.035, a: 0.8, lp: 900, rev: 0.7, width: 0.9 });
      A.bell(7.5, midi(72), { g: 0.06, dur: 2.2, rev: 0.7 });
    },
  });

  /* =====================================================================
     GRADE — colour grading in post, on the finished rgb buffer. The plain
     render is the negative; each pixel goes through lift (offsets the
     blacks), gain (scales the whites) and gamma (bends the midtones) per
     channel, then contrast, saturation and a split-tone that pushes
     shadows toward teal and highlights toward orange, the complementary
     pair that keeps warm subjects off cool surroundings. A second preset,
     bleach bypass, keeps the silver: desaturated, hard and metallic.
     ===================================================================== */
  const TO = { lift: [-0.02, 0.025, 0.045], gamma: [0.9, 1.0, 1.06], gain: [0.88, 0.85, 0.82], con: 1.2, sat: 1.15, split: 1, cool: 0 };
  const BB = { lift: [-0.03, -0.03, -0.025], gamma: [0.92, 0.93, 0.95], gain: [0.78, 0.79, 0.81], con: 1.5, sat: 0.3, split: 0, cool: 1 };
  const TEAL = [-0.11, 0.025, 0.06], ORNG = [0.09, 0.02, -0.08];
  function grade(c, G_, out) {
    let r = c[0], g = c[1], b = c[2];
    r = r * G_.gain[0] + G_.lift[0] * (1 - r); g = g * G_.gain[1] + G_.lift[1] * (1 - g); b = b * G_.gain[2] + G_.lift[2] * (1 - b);
    r = Math.pow(Math.max(r, 0), 1 / G_.gamma[0]); g = Math.pow(Math.max(g, 0), 1 / G_.gamma[1]); b = Math.pow(Math.max(b, 0), 1 / G_.gamma[2]);
    const pv = 0.46; r = pv + (r - pv) * G_.con; g = pv + (g - pv) * G_.con; b = pv + (b - pv) * G_.con;
    let l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = l + (r - l) * G_.sat; g = l + (g - l) * G_.sat; b = l + (b - l) * G_.sat;
    if (G_.split) {
      // shadows and mids lean teal, warm hues and the top highlights lean orange (a warm-hue key)
      const lc = clamp(l), warm = clamp((r - b - 0.08) * 3), mid = 4 * lc * (1 - lc), sh = (1 - lc) * (1 - lc);
      const tw = (0.7 * sh + 0.9 * mid) * (1 - warm) * G_.split, ow = (0.5 * smooth(0.7, 1, lc) + 0.9 * warm) * G_.split;
      r += TEAL[0] * tw + ORNG[0] * ow; g += TEAL[1] * tw + ORNG[1] * ow; b += TEAL[2] * tw + ORNG[2] * ow;
    }
    if (G_.cool) { r -= 0.012 * G_.cool; b += 0.015 * G_.cool; }
    out[0] = r; out[1] = g; out[2] = b;
    return out;
  }
  /* The teal & orange preset dials in group by group on the beat; bleach bypass arrives whole. */
  function toAt(t) {
    const kL = E.ioC(seg(t, 1.3, 1.9)), kG = E.ioC(seg(t, 1.9, 2.5)), kN = E.ioC(seg(t, 2.5, 3.1)), kS = E.ioC(seg(t, 3.1, 3.7));
    return {
      lift: TO.lift.map(v => v * kL), gamma: TO.gamma.map(v => lerp(1, v, kG)), gain: TO.gain.map(v => lerp(1, v, kN)),
      con: lerp(1, TO.con, kS), sat: lerp(1, TO.sat, kS), split: kS, cool: 0, k: [kL, kG, kN, kS],
    };
  }
  // screen layout over time: [plain | T&O] split, then [BB | T&O] wipe, then three bands
  const G_S1 = [[0.9, 1], [1.4, 0.5, E.ioC], [4.0, 0.5], [4.6, 0, E.ioC]];
  const G_S2 = [[6.3, 0], [7.2, 1, E.ioC]];
  const G_B3 = [[8.4, 0], [9.1, 1, E.ioC]];
  function gradeLayout(t) {
    const s1 = kf(t, G_S1), s2 = kf(t, G_S2), b3 = kf(t, G_B3);
    return { s1, s2, b3, hero: t >= 6.75 && b3 < 0.5 ? 'BB' : 'TO' };
  }
  // which grade a column gets: 0 plain, 1 teal & orange, 2 bleach bypass
  function gradeZone(L, u) {
    if (L.b3 > 0) { const a = lerp(L.s2, 1 / 3, L.b3), b = lerp(1, 2 / 3, L.b3); return u < a ? (L.b3 > 0.001 && u < lerp(0, 1 / 3, L.b3) ? 0 : 2) : u < b ? 1 : 2; }
    if (L.s2 > 0) return u < L.s2 ? 2 : 1;
    return u < L.s1 ? 0 : 1;
  }
  let gSample = null;   // subsampled plain buffer, for the vectorscope
  function wheel(c, x, y, r, off, name, val) {
    // hue wheel with the puck at the per-channel offset projected onto the chroma plane
    const cg = c.createConicGradient(-Math.PI / 2 + 0.0, x, y);
    for (let i = 0; i <= 12; i++) { const h = i / 12; cg.addColorStop(h, `hsl(${(90 - h * 360 + 720) % 360},55%,58%)`); }
    c.fillStyle = cg; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    const rg = c.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(236,232,223,1)'); rg.addColorStop(1, 'rgba(236,232,223,0)');
    c.fillStyle = rg; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(23,24,28,0.5)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.moveTo(x, y - 6); c.lineTo(x, y + 6); c.stroke();
    // chroma of the offset: same projection as the hue ring (red at top-left, 90° − hue)
    const [dr, dg, db] = off, cx = dr - (dg + db) / 2, cy = Math.sqrt(3) / 2 * (dg - db);
    const ang = Math.atan2(cy, cx), mag = Math.min(1, Math.hypot(cx, cy) * 7);
    const a = -Math.PI / 2 + (90 - ang * 180 / Math.PI + 720) % 360 * Math.PI / 180 - (90 * Math.PI / 180) * 0;
    const hx = x + Math.cos(a) * mag * r, hy = y + Math.sin(a) * mag * r;
    c.fillStyle = P.ink; c.beginPath(); c.arc(hx, hy, 6.5, 0, TAU); c.fill();
    c.fillStyle = P.paper; c.beginPath(); c.arc(hx, hy, 3, 0, TAU); c.fill();
    label(c, name, x, y + r + 24, { size: 14, ls: 2, color: P.ink, weight: 700, align: 'center' });
    label(c, val, x, y + r + 44, { size: 12, ls: 1, color: P.mute, align: 'center' });
  }
  function scope(c, x, y, R, Gp, on) {
    if (!gSample || on <= 0.01) return;
    const n = 220, sh = sheet('vscope', n, n), d = sh.img.data;
    d.fill(0);
    const out = [0, 0, 0], s = gSample;
    for (let i = 0; i < s.length; i += 3) {
      grade([s[i], s[i + 1], s[i + 2]], Gp, out);
      const r = clamp(out[0]), g = clamp(out[1]), b = clamp(out[2]);
      const cb = -0.1146 * r - 0.3854 * g + 0.5 * b, cr = 0.5 * r - 0.4542 * g - 0.0458 * b;
      const px = Math.round(n / 2 + cb * n * 2.6), py = Math.round(n / 2 - cr * n * 2.6);
      if (px < 0 || py < 0 || px >= n || py >= n) continue;
      const o = (py * n + px) * 4;
      d[o] = Math.min(255, d[o] + 55 + r * 90); d[o + 1] = Math.min(255, d[o + 1] + 55 + g * 90); d[o + 2] = Math.min(255, d[o + 2] + 55 + b * 90); d[o + 3] = 255;
    }
    sh.cx.putImageData(sh.img, 0, 0);
    c.save(); c.globalAlpha = on;
    c.fillStyle = '#121316'; c.beginPath(); c.arc(x, y, R + 10, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(236,232,223,0.25)'; c.lineWidth = 1;
    [0.33, 0.66, 1].forEach(k => { c.beginPath(); c.arc(x, y, R * k, 0, TAU); c.stroke(); });
    c.beginPath(); c.moveTo(x - R, y); c.lineTo(x + R, y); c.moveTo(x, y - R); c.lineTo(x, y + R); c.stroke();
    // skin-tone line (≈123°, upper left)
    const sa = -123 * Math.PI / 180;
    c.strokeStyle = 'rgba(255,170,110,0.7)'; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(sa) * R, y + Math.sin(sa) * R); c.stroke(); c.setLineDash([]);
    c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true;
    c.drawImage(sh.cv, x - R, y - R, 2 * R, 2 * R);
    c.globalCompositeOperation = 'source-over';
    label(c, 'R', x - R * 0.2, y - R * 0.86, { size: 12, color: 'rgba(255,120,100,0.8)', align: 'center' });
    label(c, 'B', x + R * 0.82, y + 4, { size: 12, color: 'rgba(120,150,255,0.8)', align: 'center' });
    label(c, 'VECTORSCOPE  ·  Cb / Cr', x, y - R - 22, { size: 14, ls: 2, color: P.ink, weight: 700, align: 'center' });
    c.restore();
  }

  MG.film({
    id: 'lookgrade', dur: 10, poster: 5.4,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Teal & Orange Grade', sub: 'Lift, gamma, gain and a split-tone, in post', era: '2000 —',
      origin: 'Colour grading moved from photochemical timing to software when O Brother, Where Art Thou? (2000) was scanned, graded digitally and recorded back to film — the first feature finished entirely through a digital intermediate. Three-way correctors, with lift, gamma and gain wheels for shadows, midtones and highlights, became the grader’s instrument, and the teal-and-orange look that pushes skin and warm subjects one way and shadows and backgrounds the complementary way spread through blockbusters in the 2000s. Bleach bypass imitates skipping the bleach step in film processing, leaving silver in the image: lower saturation, harder contrast.',
      works: 'O Brother, Where Art Thou? (Joel and Ethan Coen, 2000; digital intermediate) · Transformers (Michael Bay, 2007; teal and orange) · Saving Private Ryan (Steven Spielberg, 1998; bleach-bypass-style desaturation)',
      tech: ['Lift / gamma / gain per channel', 'Teal shadows, orange highlights', 'Bleach bypass as a second preset'],
      accent: '#1f8f8c',
      motionDNA: 'The camera makes the shared 50° orbit. A split opens on the plain render, then the grade is built one control per beat — lift, gamma, gain, then contrast, saturation and the split-tone — while the wheels’ pucks travel and the vectorscope trace leans; the split clears to the full grade, a wipe swaps in bleach bypass, and the film ends on three bands: plain, teal & orange, bleach.',
      visualDNA: 'The same still life recoloured: teal-green shadows and floor falloff against a peach backdrop and a hotter orange Token; then silvery, near-monochrome bleach bypass. Three colour wheels and a live vectorscope with its skin-tone line sit on a paper panel; per-channel numbers update as the controls move; the caption draws the luma transfer curve.',
      transitions: 'Before/after split, a linear wipe between presets, three comparison bands',
      implementation: ['DaVinci Resolve / Baselight three-way colour correctors', 'ASC CDL (slope, offset, power) and LUTs', 'Canvas 2D + SDF tracer (js/look-kit.js): the plain render graded per pixel in opts.post, scope built from a subsampled buffer'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const L = gradeLayout(t), PT = toAt(t), out = [0, 0, 0];
      const post = (rgb, G) => {
        const { w, h } = G, step = 6, smp = [];
        for (let y = 0; y < h; y += step) for (let x = (y / step) % 2 ? 3 : 0; x < w; x += step) { const i = (y * w + x) * 3; smp.push(rgb[i], rgb[i + 1], rgb[i + 2]); }
        gSample = smp;
        const zones = new Uint8Array(w);
        for (let x = 0; x < w; x++) zones[x] = gradeZone(L, (x + 0.5) / w);
        const px = [0, 0, 0];
        for (let i = 0; i < w * h; i++) {
          const z = zones[i % w]; if (!z) continue;
          px[0] = rgb[i * 3]; px[1] = rgb[i * 3 + 1]; px[2] = rgb[i * 3 + 2];
          grade(px, z === 1 ? PT : BB, out);
          rgb[i * 3] = out[0]; rgb[i * 3 + 1] = out[1]; rgb[i * 3 + 2] = out[2];
        }
      };
      const { S } = LK.render(c, t, W, H, LK.plain, { post });
      const Hero = L.hero === 'BB' ? BB : PT;
      // split lines + band labels
      const edge = (u, a, b) => {
        const x = u * W; c.fillStyle = P.paper; c.fillRect(x - 1.5, 0, 3, H);
        if (a) { panel(c, x - 16 - a.length * 11, 136, a.length * 11 + 8, 28); label(c, a, x - 14, 157, { align: 'right', size: 16, color: P.ink, weight: 700 }); }
        if (b) { panel(c, x + 8, 136, b.length * 11 + 8, 28); label(c, b, x + 14, 157, { size: 16, color: P.ink, weight: 700 }); }
      };
      if (L.b3 > 0) {
        const a = lerp(L.s2, 1 / 3, L.b3), b = lerp(1, 2 / 3, L.b3);
        c.save(); c.globalAlpha = L.b3; edge(lerp(0, 1 / 3, L.b3), 0, 0); c.restore();
        edge(a, 0, 0); if (b < 0.999) edge(b, 0, 0);
        c.save(); c.globalAlpha = seg(t, 8.9, 9.2);
        [['PLAIN', 1 / 6], ['TEAL & ORANGE', 0.5], ['BLEACH BYPASS', 5 / 6]].forEach(([s, u]) => { panel(c, u * W - s.length * 5.6 - 10, 136, s.length * 11.2 + 20, 28); label(c, s, u * W, 157, { align: 'center', size: 16, color: P.ink, weight: 700 }); });
        c.restore();
      } else if (L.s2 > 0 && L.s2 < 1) edge(L.s2, 'BLEACH BYPASS', 'TEAL & ORANGE');
      else if (L.s1 > 0 && L.s1 < 1) edge(L.s1, 'BEFORE', 'AFTER');
      // control panel: wheels + numbers
      const pv = seg(t, 1.0, 1.4) * (1 - seg(t, 8.4, 8.8));
      if (pv > 0.01) {
        c.save(); c.globalAlpha = pv;
        panel(c, 56, 44, 684, 300);
        tag(c, L.hero === 'BB' ? 'PRESET 2  ·  BLEACH BYPASS' : 'PRESET 1  ·  TEAL & ORANGE', 72, 84, { accent: L.hero === 'BB' ? '#9aa0a6' : '#1f8f8c' });
        label(c, 'out = (in·gain + lift·(1 − in))^(1/γ)', 98, 114, { size: 15, ls: 1, color: P.ink });
        const hueOf = (v, k) => { const m = (v[0] + v[1] + v[2]) / 3; return v.map(x => (x - m) * k); };
        const gOff = hueOf(Hero.gamma, 0.8), nOff = hueOf(Hero.gain, 1.6);
        const fmt = v => v.map(x => (x >= 0 ? '+' : '') + x.toFixed(2)).join(' ');
        wheel(c, 170, 200, 58, Hero.lift, 'LIFT', fmt(Hero.lift));
        wheel(c, 405, 200, 58, gOff, 'GAMMA', Hero.gamma.map(x => x.toFixed(2)).join(' '));
        wheel(c, 640, 200, 58, nOff, 'GAIN', Hero.gain.map(x => x.toFixed(2)).join(' '));
        label(c, `CON ${Hero.con.toFixed(2)}   SAT ${Hero.sat.toFixed(2)}   SPLIT ${Hero.split.toFixed(2)}`, 98, 330, { size: 14, ls: 2, color: P.ink });
        // active control marker
        if (L.hero === 'TO' && t < 3.8) {
          const k = PT.k, idx = k.findIndex(v => v < 1), ax = [170, 405, 640, 400][idx < 0 ? 3 : idx];
          if (idx >= 0 && idx < 3) { c.strokeStyle = P.accent; c.lineWidth = 3; c.beginPath(); c.arc(ax, 200, 66, 0, TAU); c.stroke(); }
          if (idx === 3) { c.fillStyle = P.accent; c.fillRect(98, 336, 470, 3); }
        }
        c.restore();
      }
      scope(c, W - 72 - 130, 230, 130, Hero, seg(t, 3.4, 3.9) * (1 - seg(t, 8.4, 8.8)));
      // leaders: what the grade does to the Token and the floor shadow
      const lv = seg(t, 4.8, 5.2) * (1 - seg(t, 6.2, 6.5));
      leader(c, S, V.add(S.tok.c, [0.5, -0.5, 0]), ['WARM SUBJECT', 'highlights → orange'], 160, 120, { on: lv });
      leader(c, S, [-1.2, 0.0, -0.4], ['COOL MIDS & SHADOWS', 'neutrals → teal'], -150, -90, { on: lv });
      // caption: luma transfer curve of the hero grade, marker at mid grey
      const lc = u => { grade([u, u, u], Hero, out); return LK.luma(out); };
      LK.caption(c, t, W, H, { name: 'Teal & Orange Grade', cat: 'Image', curve: lc, span: [t - 0.46, t + 0.54], lo: -0.05, hi: 1.1, curveLabel: 'LUMA OUT / IN' });
    },
    score(A) {
      LK.bed(A);
      A.whoosh(0.9, 0.6, { f1: 400, f2: 3000, g: 0.09, swell: 0.5, pan: 0.4 });
      // one detent click per control as it dials in
      [1.3, 1.9, 2.5, 3.1].forEach((t0, i) => {
        for (let k = 0; k < 6; k++) A.osc(t0 + k * 0.09, { f: 2400 + i * 200, dur: 0.025, g: 0.035, pan: -0.4 + i * 0.27 });
        A.pluck(t0 + 0.55, midi([57, 60, 64, 69][i]), { g: 0.12, bright: 0.55, dur: 1.1, rev: 0.35 });
      });
      A.chord(3.7, [45, 52, 61, 64, 69], { type: 'triangle', dur: 2.6, g: 0.035, a: 0.3, lp: 2200, rev: 0.6, width: 0.9 });
      A.whoosh(4.0, 0.6, { f1: 600, f2: 2400, g: 0.08, swell: 0.5, pan: -0.4 });
      // bleach bypass: colder, harder
      A.whoosh(6.3, 0.9, { f1: 300, f2: 5000, q: 2, g: 0.1, swell: 0.6 });
      A.chord(7.2, [41, 48, 53, 60], { type: 'sawtooth', dur: 1.4, g: 0.022, a: 0.05, lp: 1000, rev: 0.5, width: 0.7 });
      A.snare(7.2, 0.1, { f: 2600, dur: 0.1, rev: 0.3 });
      // three bands
      [8.4, 8.75, 9.1].forEach((t0, i) => A.bell(t0, midi([69, 73, 76][i]), { g: 0.06, dur: 1.4, rev: 0.6 }));
    },
  });

  /* =====================================================================
     GRAIN — filmic finishing on a low-key render (one hard key, a rim
     light from behind, little fill), all in post on the float buffer.
     Halation: luminance above a threshold is blurred wide and added back
     in red-orange, the glow film gets when light scatters off the base
     and re-exposes the red layer around bright edges. Grain: a fresh
     seeded noise field every frame, hash(x, y, frame), scaled by 4·l·(1−l)
     so it is strongest in the midtones and dies in deep shadow and paper
     white. Gate weave shifts the whole picture by a fraction of a pixel
     per frame; a vignette darkens the corners.
     ===================================================================== */
  const BACK = V.norm([0.35, 0.55, -0.9]);
  const NBG = [0.055, 0.052, 0.058];
  function lowKey(g, S) {
    if (!g.hit) { const v = 1 - smooth(-0.05, 0.4, g.d[1]); return LK.mix3(NBG, [0.13, 0.115, 0.11], v); }
    const a = LK.albedo(g.id), n = g.n;
    const dif = Math.max(0, V.dot(n, LK.KEY)) * LK.shadow(V.add(g.p, V.mul(n, 0.01)), LK.KEY, S, 16);
    const occ = g.id === 0 ? 1 : LK.ao(g.p, n, S);
    const vd = V.mul(g.d, -1);
    const rim = g.id === 0 ? 0 : Math.pow(1 - Math.max(0, V.dot(n, vd)), 2.2) * Math.max(0, V.dot(n, BACK) + 0.35) * 3.4;
    // a pool of key light centred on the still life; outside it the studio falls to black
    const spot = Math.exp(-(g.p[0] * g.p[0] + (g.p[2] + 0.2) * (g.p[2] + 0.2)) / (2 * 2.6 * 2.6)), fl = g.id === 0 ? 0.5 : 1;
    const hv = V.norm(V.add(LK.KEY, vd)), spec = g.id === 0 ? 0 : Math.pow(Math.max(0, V.dot(n, hv)), g.id === 2 ? 70 : 40) * dif * 2.4;
    const k = (1.8 * dif * spot + 0.06 * (0.6 + 0.4 * n[1]) * occ) * fl;
    let c = [a[0] * k + spec * spot + rim * 0.95, a[1] * k + spec * spot + rim * 0.88, a[2] * k + spec * spot + rim * 0.8];
    c = LK.tone(c, 1.15);
    if (g.id === 0) c = LK.floorFade(c, g, [0.12, 0.11, 0.105]);
    return c;
  }
  // integer hash → 0..1, for grain seeded by pixel and frame
  function ih(x, y, f) {
    let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(f, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function boxBlur(src, dst, w, h, r) {   // separable running-sum box blur, src → dst (tmp = src reused)
    const tmp = new Float32Array(w * h), k = 1 / (2 * r + 1);
    for (let y = 0; y < h; y++) {
      let s = 0; const o = y * w;
      for (let x = -r; x <= r; x++) s += src[o + clamp(x, 0, w - 1)];
      for (let x = 0; x < w; x++) { tmp[o + x] = s * k; s += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)]; }
    }
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let y = -r; y <= r; y++) s += tmp[clamp(y, 0, h - 1) * w + x];
      for (let y = 0; y < h; y++) { dst[y * w + x] = s * k; s += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x]; }
    }
  }
  const HAL = [1.0, 0.3, 0.09];
  const R_GRAIN = [[0.6, 0], [1.8, 0.055, E.ioC]];
  const R_HAL = [[2.2, 0], [3.6, 1, E.ioC]];
  const R_WEAVE = [[4.0, 0], [4.6, 1, E.ioC]];
  const R_VIG = [[4.4, 0], [5.2, 1, E.ioC]];
  const R_SPLIT = [[6.0, 0], [6.8, 0.5, E.ioC], [8.0, 0.5], [8.6, 0, E.ioC]];
  function grainAt(t) {
    return { grain: kf(t, R_GRAIN), hal: kf(t, R_HAL), weave: kf(t, R_WEAVE), vig: kf(t, R_VIG), split: kf(t, R_SPLIT), th: 0.62, frame: Math.floor(t * 30 + 1e-6) };
  }
  let gPass = null;   // halation and grain planes from the last post, for the insets

  MG.film({
    id: 'lookgrain', dur: 10, poster: 9.0,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Film Grain & Halation', sub: 'Seeded grain, red halation, weave and vignette', era: '2000s —',
      origin: 'Film grain is the visible clumping of silver halide crystals and dye clouds in the emulsion; it is strongest in the midtones and changes every frame because every frame is a new piece of film. Halation is the red-orange glow around bright edges where light passes through the emulsion, reflects off the film base and re-exposes the red-sensitive layer from behind; anti-halation backings suppress it, and stocks without one show it strongly. Gate weave is the slight frame-to-frame drift of film in the camera and projector gate. As digital cameras replaced film, finishing tools added these artefacts back on purpose, from scanned grain plates to procedural emulations.',
      works: 'Dune (Denis Villeneuve, 2021; shot digitally, recorded out to film and scanned back for its texture) · Euphoria season 2 (HBO, 2022; shot on Kodak Ektachrome) · Dehancer (film-emulation plug-in modelling grain, halation and bloom)',
      tech: ['Grain seeded by frame, midtone weighted', 'Halation from blurred threshold', 'Gate weave + vignette'],
      accent: '#e2532a',
      motionDNA: 'The camera makes the shared 50° orbit while the finish builds on the beat: grain fades in and starts boiling at 30 frames a second, the halation threshold glow rises until the rim-lit edges bleed red, the gate begins to weave and the vignette closes in; a split then shows the clean render against the finish before the whole frame returns to film.',
      visualDNA: 'A low-key version of the still life: black studio, one hard key and a rim light that rings each object in white, each ring haloed in red-orange; fine monochrome grain alive in the midtones, quiet in the blacks; soft dark corners. Insets show the grain plate and the halation pass; a loupe magnifies a rim edge at 3×; mono readouts give grain σ, frame seed, threshold, halation strength, weave and vignette.',
      transitions: 'Effects layered on one by one; a split against the clean render',
      implementation: ['Scanned grain plates / FilmConvert / Dehancer-style film emulation', 'Nuke or Resolve: threshold, blur and red-tinted add for halation', 'Canvas 2D + SDF tracer (js/look-kit.js): opts.post halation blur, hash(x, y, frame) grain, vignette; gate weave as a per-frame draw offset'],
      reproducibility: 'Fully procedural (grain is a pure function of pixel and frame index)',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const R = grainAt(t), f = R.frame;
      const post = (rgb, G) => {
        const { w, h } = G, n = w * h, sx = Math.round(R.split * w);
        const clean = R.split > 0 ? rgb.slice() : null;
        // halation: threshold → wide blur → red-orange add
        const m = new Float32Array(n), hb = new Float32Array(n), hb2 = new Float32Array(n);
        for (let i = 0; i < n; i++) { const l = 0.2126 * rgb[i * 3] + 0.7152 * rgb[i * 3 + 1] + 0.0722 * rgb[i * 3 + 2]; m[i] = clamp((l - R.th) / (1 - R.th)); }
        boxBlur(m, hb, w, h, 4); boxBlur(hb, hb2, w, h, 9); boxBlur(hb2, hb, w, h, 9);
        const gp = new Float32Array(n), cx = w / 2, cy = h / 2;
        for (let i = 0; i < n; i++) {
          const x = i % w, y = (i / w) | 0;
          const hl = Math.max(0, hb[i] * 1.5 - m[i] * 0.35) * R.hal;
          let r = rgb[i * 3] + HAL[0] * hl, g = rgb[i * 3 + 1] + HAL[1] * hl, b = rgb[i * 3 + 2] + HAL[2] * hl;
          // vignette
          const dx = (x - cx) / cx, dy = (y - cy) / cy, vg = 1 - R.vig * 0.55 * smooth(0.35, 1.5, dx * dx * 0.8 + dy * dy);
          r *= vg; g *= vg; b *= vg;
          // grain: two hashes → roughly gaussian, weighted to the midtones
          const l = clamp(0.2126 * r + 0.7152 * g + 0.0722 * b);
          const nz = (ih(x, y, f) + ih(x + 977, y + 331, f) - 1) * 1.7, wt = 0.18 + 3.3 * l * (1 - l);
          const gr = nz * R.grain * wt, ch = (ih(x, y, f + 7919) - 0.5) * R.grain * 0.3 * wt;
          r += gr + ch; g += gr; b += gr - ch;
          rgb[i * 3] = r; rgb[i * 3 + 1] = g; rgb[i * 3 + 2] = b;
          gp[i] = nz * wt;
          if (x < sx) { rgb[i * 3] = clean[i * 3]; rgb[i * 3 + 1] = clean[i * 3 + 1]; rgb[i * 3 + 2] = clean[i * 3 + 2]; }
        }
        gPass = { w, h, hb, gp };
      };
      // gate weave: sub-pixel to a few pixels, drifting plus a per-frame jitter
      const wv = R.weave, wx = wv * (2.6 * vnoise(t * 1.7, 11) + 0.9 * (hash(f * 1.37) - 0.5)), wy = wv * (3.4 * vnoise(t * 1.3, 23) + 1.2 * (hash(f * 2.11 + 5) - 0.5));
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      const { S } = LK.render(c, t, W, H, lowKey, { post, rect: [-14 + wx, -8 + wy, W + 28, H + 16] });
      // split edge
      if (R.split > 0.01) {
        const x = R.split * (W + 28) - 14 + wx;
        c.fillStyle = 'rgba(236,232,223,0.8)'; c.fillRect(x - 1, 0, 2, H);
        label(c, 'CLEAN', x - 18, 160, { align: 'right', size: 16, color: P.paper, weight: 700 });
        label(c, 'FILM FINISH', x + 18, 160, { size: 16, color: P.paper, weight: 700 });
      }
      // readouts
      const on = seg(t, 0.3, 0.7);
      c.save(); c.globalAlpha = on;
      panel(c, 56, 44, 470, 238, true);
      tag(c, 'FILM FINISH  ·  POST', 72, 84, { dark: true, accent: '#e2532a' });
      const row = (s, v, y, act) => { label(c, s, 98, y, { size: 16, color: act ? P.paper : 'rgba(236,232,223,0.55)', weight: act ? 700 : 400 }); label(c, v, 500, y, { size: 16, color: act ? '#ff8a5c' : 'rgba(236,232,223,0.55)', align: 'right', weight: 700 }); };
      row('GRAIN σ', f3(R.grain), 122, R.grain > 0);
      row('SEED  hash(x, y, frame)', `#${String(f).padStart(3, '0')}`, 150, R.grain > 0);
      row('HALATION  THRESH', f2(R.th), 178, R.hal > 0);
      row('HALATION  GAIN', f2(R.hal * 1.5), 206, R.hal > 0);
      row('GATE WEAVE', `${wx >= 0 ? '+' : ''}${wx.toFixed(1)}, ${wy >= 0 ? '+' : ''}${wy.toFixed(1)} px`, 234, R.weave > 0);
      row('VIGNETTE', f2(R.vig * 0.55), 262, R.vig > 0);
      c.restore();
      // insets: grain plate (1:1 crop) and halation pass
      if (gPass) {
        const iw = 300, ih2 = 169, gv = seg(t, 0.9, 1.3), hv = seg(t, 2.4, 2.8);
        if (gv > 0) {
          const sh = sheet('grainplate', iw, ih2), d = sh.img.data, x0 = 250, y0 = 140;
          for (let y = 0; y < ih2; y++) for (let x = 0; x < iw; x++) {
            const v = 128 + gPass.gp[(y0 + y) * gPass.w + x0 + x] * 0.075 * 1100, o = (y * iw + x) * 4;
            d[o] = d[o + 1] = d[o + 2] = clamp(v, 0, 255); d[o + 3] = 255;
          }
          sh.cx.putImageData(sh.img, 0, 0);
          inset(c, sh.cv, W - 72 - iw, 84, iw, ih2, 'GRAIN PLATE  ·  × 4l(1 − l)', { on: gv, dark: true, smooth: false });
        }
        if (hv > 0) {
          const hw = 200, hh = 113, sh = sheet('halpass', hw, hh), d = sh.img.data;
          for (let y = 0; y < hh; y++) for (let x = 0; x < hw; x++) {
            const i = Math.floor(y * gPass.h / hh) * gPass.w + Math.floor(x * gPass.w / hw), v = clamp(gPass.hb[i] * 1.8), o = (y * hw + x) * 4;
            d[o] = 255 * v * HAL[0]; d[o + 1] = 255 * v * HAL[1] * 1.3; d[o + 2] = 255 * v * HAL[2]; d[o + 3] = 255;
          }
          sh.cx.putImageData(sh.img, 0, 0);
          inset(c, sh.cv, W - 72 - iw, 84 + ih2 + 56, iw, ih2, `HALATION PASS  ·  BLUR(l > ${f2(R.th)})`, { on: hv, dark: true });
        }
      }
      // loupe on the sphere's rim, 3×
      const lpv = seg(t, 4.8, 5.3) * (1 - seg(t, 5.9, 6.2)) + seg(t, 8.6, 9.0);
      if (lpv > 0.01) {
        const q = LK.project(S, V.add(LK.SPH.c, [0.55, 0.52, 0.0]));
        if (q) {
          const src = c.canvas, R0 = 150, k = 3, lx = q[0] + 330, ly = q[1] + 250, sw = (2 * R0) / k;
          const cp = sheet('loupe', Math.round(sw), Math.round(sw));
          cp.cx.clearRect(0, 0, sw, sw); const ks = c.getTransform().a; cp.cx.drawImage(src, (q[0] - sw / 2) * ks, (q[1] - sw / 2) * ks, sw * ks, sw * ks, 0, 0, sw, sw);
          c.save(); c.globalAlpha = lpv;
          c.strokeStyle = 'rgba(236,232,223,0.8)'; c.lineWidth = 1.5;
          c.strokeRect(q[0] - sw / 2, q[1] - sw / 2, sw, sw);
          c.beginPath(); c.moveTo(q[0] + sw / 2, q[1]); c.lineTo(lx - R0, ly); c.stroke();
          c.save(); c.beginPath(); c.arc(lx, ly, R0, 0, TAU); c.clip();
          c.imageSmoothingEnabled = false; c.drawImage(cp.cv, lx - R0, ly - R0, 2 * R0, 2 * R0); c.restore();
          c.lineWidth = 3; c.beginPath(); c.arc(lx, ly, R0, 0, TAU); c.stroke();
          panel(c, lx - 110, ly + R0 + 12, 220, 26, true);
          label(c, 'LOUPE 3×  ·  RIM EDGE', lx, ly + R0 + 31, { size: 14, ls: 2, color: P.paper, weight: 700, align: 'center' });
          c.restore();
        }
      }
      LK.caption(c, t, W, H, { name: 'Film Grain & Halation', cat: 'Image', dark: true, curve: u => 0.18 + 3.3 * u * (1 - u), span: [t - 0.5, t + 0.5], lo: -0.1, hi: 1.2, curveLabel: 'GRAIN WEIGHT / LUMA' });
    },
    score(A) {
      LK.bed(A);
      // projector: a soft shutter tick at 24 fps once the gate weaves, plus crackle
      for (let i = 0; i * (1 / 24) < 6; i++) { const t0 = 4.0 + i / 24; A.noise(t0, { type: 'bandpass', f: 3200, q: 2, dur: 0.012, g: 0.012 + 0.006 * (i % 2), pan: 0.2 }); }
      for (let i = 0; i < 40; i++) { const t0 = 0.6 + hash(i * 3.7) * 9.2; A.noise(t0, { type: 'highpass', f: 5000, dur: 0.008, g: 0.03 * hash(i * 1.3 + 2), pan: hash(i * 5.1) - 0.5 }); }
      A.noise(0.6, { type: 'highpass', f: 6000, dur: 9.4, g: 0.012, swell: 0.2 });
      // halation: a warm swell
      A.chord(2.2, [50, 57, 62, 66], { type: 'triangle', dur: 2.4, g: 0.035, a: 1.0, lp: 1800, rev: 0.6, width: 0.9 });
      A.bell(3.6, midi(74), { g: 0.06, dur: 1.8, rev: 0.6 });
      A.whoosh(4.0, 1.1, { f1: 150, f2: 900, q: 1.2, g: 0.07, swell: 0.6 });
      A.whoosh(6.0, 0.8, { f1: 400, f2: 3000, g: 0.08, swell: 0.5, pan: -0.4 });
      A.whoosh(8.0, 0.6, { f1: 600, f2: 2400, g: 0.07, swell: 0.5, pan: 0.4 });
      A.pluck(8.6, midi(62), { g: 0.12, bright: 0.5, dur: 1.3, rev: 0.4 });
      A.chord(8.6, [38, 45, 50, 57, 62], { type: 'triangle', dur: 1.4, g: 0.035, a: 0.1, lp: 2000, rev: 0.7, width: 0.9 });
    },
  });
})();
