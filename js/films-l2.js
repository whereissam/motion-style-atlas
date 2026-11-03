/* batch l2 — Rendering Looks · Material + Light: lookmatcap · lookstudio · lookrim.
   lookmatcap (material capture: every surface colour is read from a painted sphere image by its
   view-space normal; four procedural matcaps — red wax, jade, pearl, chrome — switch on the beat) ·
   lookstudio (three-point lighting built up one light at a time — key, then fill, then back —
   each a spotlight with its own shadow, with a top-down light plot and the key:fill ratio) ·
   lookrim (rim lighting on a dark set: silhouettes edged by lights behind them, an edge band from
   1 − N·V gated by the back light's direction, then a warm and a cool rim). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, midi, text } = MG;
  const LK = MG.LK, V = LK.V, P = LK.P, TK = MG.TK, PI = Math.PI;
  const { add, sub, mul, dot, norm, len } = V;

  /* ---------------- shared helpers ---------------- */
  const sm = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const PAPER = '#ece8df', DIMP = 'rgba(236,232,223,0.62)';
  const label = (c, s, x, y, o = {}) => LK.label(c, s, x, y, o);
  // accent dot + bold mono label, top-left of frame (light text: all three looks are dark)
  const tag = (c, s, x, y, o = {}) => {
    c.save(); c.globalAlpha *= o.on ?? 1;
    c.fillStyle = o.accent || P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: o.color || PAPER, weight: 700, size: 20 });
    c.restore();
  };
  const rgbs = (v, a = 1) => `rgba(${Math.round(clamp(v[0]) * 255)},${Math.round(clamp(v[1]) * 255)},${Math.round(clamp(v[2]) * 255)},${a})`;
  // leader line: dot on the object, elbow, label at the free end
  function leader(c, at, to, s, o = {}) {
    if (!at) return;
    c.save(); c.globalAlpha *= o.on ?? 1;
    const col = o.color || PAPER;
    c.strokeStyle = col; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(at[0], at[1]); c.lineTo(to[0], to[1]); c.lineTo(to[0] + (o.right === false ? -40 : 40), to[1]); c.stroke();
    c.fillStyle = col; c.beginPath(); c.arc(at[0], at[1], 5, 0, TAU); c.fill();
    label(c, s, to[0] + (o.right === false ? -48 : 48), to[1] + 6, { color: col, size: o.size || 15, ls: 2, weight: 700, align: o.right === false ? 'right' : 'left' });
    if (o.sub) label(c, o.sub, to[0] + (o.right === false ? -48 : 48), to[1] + 28, { color: o.subColor || DIMP, size: 13, ls: 2, align: o.right === false ? 'right' : 'left' });
    c.restore();
  }
  /* Small debug pass: sample the frame's G-buffer at w × h (nearest pixel) and shade each sample
     with fn(g, S). Much cheaper than a second LK.render, so insets can show passes every frame. */
  const pcache = {};
  function pass(c, G, fn, x, y, w, h, title, o = {}) {
    const k = w + 'x' + h;
    if (!pcache[k]) { const cv = MG.offscreen(w, h), cx = cv.getContext('2d'); pcache[k] = { cv, cx, img: cx.createImageData(w, h) }; }
    const sf = pcache[k], d = sf.img.data, S = G.S, g = { hit: false, id: 255 }, [u0, v0, u1, v1] = o.src || [0, 0, 1, 1];   // o.src: a crop of the frame
    for (let j = 0; j < h; j++) {
      const gy = clamp(((v0 + (j + 0.5) / h * (v1 - v0)) * G.h) | 0, 0, G.h - 1);
      for (let i = 0; i < w; i++) {
        const gx = clamp(((u0 + (i + 0.5) / w * (u1 - u0)) * G.w) | 0, 0, G.w - 1), q = gy * G.w + gx, id = G.id[q];
        g.id = id; g.hit = id !== 255; g.depth = G.depth[q]; g.u = (i + 0.5) / w; g.v = (j + 0.5) / h;
        g.d = [G.D3[q * 3], G.D3[q * 3 + 1], G.D3[q * 3 + 2]];
        g.n = g.hit ? [G.N3[q * 3], G.N3[q * 3 + 1], G.N3[q * 3 + 2]] : null;
        g.p = g.hit ? [G.P3[q * 3], G.P3[q * 3 + 1], G.P3[q * 3 + 2]] : null;
        const col = fn(g, S), b = (j * w + i) * 4;
        d[b] = clamp(col[0]) * 255; d[b + 1] = clamp(col[1]) * 255; d[b + 2] = clamp(col[2]) * 255; d[b + 3] = 255;
      }
    }
    sf.cx.putImageData(sf.img, 0, 0);
    c.save(); c.globalAlpha *= o.on ?? 1;
    c.drawImage(sf.cv, x, y, w, h);
    c.strokeStyle = o.border || 'rgba(236,232,223,0.5)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    if (title) label(c, title, x, y - 10, { color: o.titleColor || DIMP, size: 13, ls: 2, weight: 700 });
    c.restore();
  }
  // a soft dark plate behind insets/readouts so they read over the render
  function plate(c, x, y, w, h, a = 0.55) {
    c.save(); c.fillStyle = `rgba(10,11,14,${a})`; MG.rrect ? (c.beginPath(), MG.rrect(c, x, y, w, h, 10), c.fill()) : c.fillRect(x, y, w, h); c.restore();
  }
  const beat = b => b * LK.BEAT;

  /* =====================================================================
     MATCAP — "material capture" / lit-sphere shading. A matcap is a picture
     of a sphere with the lighting and material already painted in. To shade
     a pixel, take its normal into view space (N·camera-right, N·camera-up):
     that pair is a point on the sphere picture, and its colour is the
     answer. There are no lights, no shadows, no BRDF at render time — just
     one texture lookup — so the baked light turns with the camera. Four
     matcaps are painted procedurally in setup(); they switch on the beat.
     ===================================================================== */
  const MCN = 192;
  const MATS = [
    { key: 'wax', name: 'RED WAX', col: '#d8322a' },
    { key: 'jade', name: 'JADE', col: '#3fa77a' },
    { key: 'pearl', name: 'PEARL', col: '#e9dfe8' },
    { key: 'chrome', name: 'CHROME', col: '#b9c6d6' },
  ];
  function paintMatcap(kind) {
    const N = MCN, data = new Float32Array(N * N * 3);
    const L = norm([-0.55, 0.62, 0.56]), L2 = norm([0.7, -0.15, 0.7]), v = [0, 0, 1];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let nx = (x + 0.5) / N * 2 - 1, ny = 1 - (y + 0.5) / N * 2;
      const r = Math.hypot(nx, ny);
      if (r > 0.999) { nx *= 0.999 / r; ny *= 0.999 / r; }   // extend the rim colour past the disc
      const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), n = [nx, ny, nz];
      const ndl = dot(n, L), edge = 1 - nz, H = norm(add(L, v)), ndh = Math.max(0, dot(n, H));
      let c;
      if (kind === 'wax') {
        const wrap = clamp((ndl + 0.5) / 1.5), term = Math.exp(-ndl * ndl / 0.05);
        c = LK.mix3([0.16, 0.012, 0.018], [0.92, 0.16, 0.11], Math.pow(wrap, 1.4));
        c = add(c, mul([1.0, 0.32, 0.12], 0.22 * term * clamp(ndl + 0.6)));       // subsurface glow at the terminator
        c = add(c, mul([1, 0.82, 0.74], 0.34 * Math.pow(ndh, 22)));               // broad waxy sheen
        c = add(c, mul([1, 0.45, 0.35], 0.18 * Math.pow(edge, 2.5) * clamp(dot(n, L2) + 0.6)));
      } else if (kind === 'jade') {
        const wrap = clamp((ndl + 0.8) / 1.8);
        c = LK.mix3([0.01, 0.09, 0.06], [0.30, 0.68, 0.48], Math.pow(wrap, 1.6));
        c = add(c, mul([0.35, 0.9, 0.6], 0.22 * Math.pow(edge, 1.6) * clamp(-ndl + 0.4)));   // light glowing through the thin edge
        c = add(c, mul([1, 1, 0.95], 0.9 * Math.pow(ndh, 160) + 0.12 * Math.pow(ndh, 18)));
        c = add(c, mul([0.8, 1, 0.9], 0.08 * Math.pow(Math.max(0, dot(n, norm(add(L2, v)))), 30)));
      } else if (kind === 'pearl') {
        const wrap = clamp((ndl + 0.6) / 1.6);
        c = LK.mix3([0.42, 0.40, 0.44], [0.97, 0.95, 0.93], Math.pow(wrap, 1.2));
        const ph = edge * 7.5 + ny * 1.5;   // thin-film iridescence by angle
        c = add(c, mul([Math.sin(ph) * 0.5 + 0.5, Math.sin(ph + 2.1) * 0.5 + 0.5, Math.sin(ph + 4.2) * 0.5 + 0.5], 0.16 * sm(0.05, 0.6, edge)));
        c = LK.mix3(c, [0.86, 0.80, 0.92], 0.35 * Math.pow(edge, 2));
        c = add(c, mul([1, 1, 1], 0.75 * Math.pow(ndh, 70) + 0.15 * Math.pow(ndh, 8)));
      } else {   // chrome: a reflected studio — sky, horizon, dark ground and two softboxes
        const rx = 2 * nz * nx, ry = 2 * nz * ny, rz = 2 * nz * nz - 1;
        if (ry > -0.02) c = LK.mix3([0.45, 0.5, 0.58], [0.93, 0.95, 0.98], Math.pow(clamp(ry), 0.6));
        else c = LK.mix3([0.34, 0.3, 0.27], [0.06, 0.06, 0.065], Math.pow(clamp(-ry * 1.4), 0.55));
        c = add(c, mul([1, 0.95, 0.85], 0.5 * Math.exp(-ry * ry / 0.0012)));       // bright horizon line
        const box = (cx, cy, w, h) => sm(w, w * 0.7, Math.abs(rx - cx)) * sm(h, h * 0.7, Math.abs(ry - cy)) * (rz > -0.6 ? 1 : 0);
        c = add(c, mul([1, 1, 1], 1.1 * box(-0.42, 0.55, 0.16, 0.22) + 0.7 * box(0.5, 0.3, 0.1, 0.15)));
        c = mul(c, 0.9 + 0.1 * nz);
      }
      const b = (y * N + x) * 3;
      data[b] = clamp(c[0]); data[b + 1] = clamp(c[1]); data[b + 2] = clamp(c[2]);
    }
    // an image of the painted sphere for the inset
    const cv = MG.offscreen(N, N), cx = cv.getContext('2d'), img = cx.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x, r = Math.hypot((x + 0.5) / N * 2 - 1, 1 - (y + 0.5) / N * 2);
      img.data[i * 4] = data[i * 3] * 255; img.data[i * 4 + 1] = data[i * 3 + 1] * 255; img.data[i * 4 + 2] = data[i * 3 + 2] * 255;
      img.data[i * 4 + 3] = clamp((1 - r) * N / 2 + 0.5) * 255;
    }
    cx.putImageData(img, 0, 0);
    return { data, cv };
  }
  function mcSample(mc, nx, ny) {   // bilinear lookup at the view-space normal
    const N = MCN, fx = clamp((nx * 0.5 + 0.5) * N - 0.5, 0, N - 1.001), fy = clamp((0.5 - ny * 0.5) * N - 0.5, 0, N - 1.001);
    const x0 = fx | 0, y0 = fy | 0, ux = fx - x0, uy = fy - y0, d = mc.data;
    const a = (y0 * N + x0) * 3, b = a + 3, cc = a + N * 3, dd = cc + 3, out = [0, 0, 0];
    for (let k = 0; k < 3; k++) out[k] = lerp(lerp(d[a + k], d[b + k], ux), lerp(d[cc + k], d[dd + k], ux), uy);
    return out;
  }
  // material schedule: switches on beats 4, 7, 10; from beat 12 one matcap per object
  const MC_SW = [beat(4), beat(7), beat(10), beat(12)];
  const MC_X = 0.22;   // crossfade length
  function mcIndex(t, id) {   // returns [from, to, u] material indices for object id
    const per = { 1: 0, 2: 3, 3: 1 };
    const seq = [0, 1, 2, 3, per[id] ?? 0];
    let k = 0; for (let i = 0; i < MC_SW.length; i++) if (t >= MC_SW[i]) k = i + 1;
    const u = k === 0 ? 1 : seg(t, MC_SW[k - 1], MC_SW[k - 1] + MC_X);
    return [seq[Math.max(0, k - 1)], seq[k], E.ioS(u)];
  }
  const MC_BG = (g) => {   // dark sculpt-viewport backdrop: soft radial gradient
    const dx = g.u - 0.5, dy = (g.v - 0.42) * 0.8, r = Math.min(1, Math.hypot(dx, dy) * 1.6);
    return LK.mix3([0.2, 0.205, 0.22], [0.055, 0.057, 0.065], r);
  };
  function mcSplit(t) { return E.ioC(seg(t, 0.15, 0.9)) * 0.5 + E.ioC(seg(t, 1.5, 2.3)) * 0.5; }   // matcap left of the line: 0 → ½ hold → 1
  // the tracked sample: a point on the sphere whose world normal drifts slowly
  function mcTrack(t, S) {
    const az = 0.15 + 0.5 * Math.sin((t - 2) * TAU / 14), el = 0.42 + 0.12 * Math.sin(t * 0.7);
    const nw = [Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
    const p = add(LK.SPH.c, mul(nw, LK.SPH.r));
    return { p, nw, nx: dot(nw, S.cam.right), ny: dot(nw, S.cam.up) };
  }

  MG.film({
    id: 'lookmatcap', dur: 10, poster: 9.2,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Matcap', sub: 'Material capture: shading from a painted sphere', era: '2001 —',
      origin: 'Peter-Pike Sloan, William Martin, Amy Gooch and Bruce Gooch described "The Lit Sphere" in 2001: an artist paints a sphere, and every point of a model takes the colour of the sphere point with the same view-space normal. Pixologic’s ZBrush popularised the idea as MatCap (material capture) materials for digital sculpting, and it is now standard in sculpting and modelling viewports such as Blender’s, where a matcap shows form instantly without any lights in the scene.',
      works: 'The Lit Sphere: A Model for Capturing NPR Shading from Art (Sloan, Martin, Gooch & Gooch, Graphics Interface 2001) · ZBrush MatCap materials (Pixologic) · Blender viewport MatCap shading (Blender 2.8+)',
      tech: ['View-space normal lookup', 'Painted lit sphere', 'Lights baked, camera-locked'],
      accent: '#d8322a',
      motionDNA: 'The shared camera orbits 50° while the Token turns and bobs. A split wipes from the plain reference to the matcap look and off again; the matcap switches on the beat from red wax to jade to pearl to chrome, crossfading in a fifth of a second, and on the last bar each object takes its own matcap. A tracked sample on the sphere slides across the matcap inset as the camera moves, its leader line linking the surface to the pixel it reads.',
      visualDNA: 'A dark sculpt-viewport backdrop with a soft centre glow; objects shaded entirely from the painted sphere, the floor only darkened by contact occlusion, so there are no cast shadows. Top right: the matcap sphere with a crosshair at the lookup point; under it a view-space normal pass. Mono readouts give N·right, N·up and the uv they become.',
      transitions: 'Split wipe from the plain render; short crossfades between matcaps on the beat',
      implementation: ['Lit-sphere / matcap texture lookup by view-space normal', 'ZBrush MatCap, Blender viewport MatCap', 'Canvas 2D + SDF tracer (js/look-kit.js): normal → (N·camRight, N·camUp) → bilinear sample of four 192² matcaps painted in setup()'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return { mc: MATS.map(m => paintMatcap(m.key)) }; },
    draw(c, t, W, H, st) {
      const split = mcSplit(t), mcs = st.mc;
      const look = (g, S) => {
        if (!g.hit) return MC_BG(g);
        if (g.id === 0) {   // floor: no light at all, only contact occlusion
          const o = LK.ao(g.p, g.n, S, 5, 0.7), base = mul([0.15, 0.15, 0.16], 0.45 + 0.55 * o);
          return LK.floorFade(base, g, MC_BG(g));
        }
        const n = g.n, nx = dot(n, S.cam.right), ny = dot(n, S.cam.up), [a, b, u] = mcIndex(S.t, g.id);
        let col = mcSample(mcs[b], nx, ny);
        if (u < 1) col = LK.mix3(mcSample(mcs[a], nx, ny), col, u);
        return col;
      };
      const shade = (g, S) => (g.u > split ? LK.plain(g, S) : look(g, S));
      const { G, S } = LK.render(c, t, W, H, split < 0.999 ? shade : look);
      // split line
      if (split > 0.001 && split < 0.999) {
        const x = split * W;
        c.fillStyle = PAPER; c.fillRect(x - 1.5, 0, 3, H);
        label(c, 'MATCAP', x - 24, 140, { align: 'right', color: PAPER, weight: 700, size: 18 });
        label(c, 'PLAIN', x + 24, 140, { color: P.ink, weight: 700, size: 18 });
      }
      const on = seg(t, 1.6, 2.2);
      tag(c, 'MATCAP · LIT-SPHERE LOOKUP', 72, 84, { accent: MATS[mcIndex(t, 1)[1]].col });
      label(c, 'uv = ½ + ½ (N·camRight, −N·camUp)  →  colour', 98, 116, { color: DIMP, size: 15, ls: 2 });
      // matcap inset
      const R = 118, cx = 1712, cy = 262, mbig = mcIndex(t, 2);   // the inset shows the sphere's matcap: the tracked sample is on the sphere
      c.save(); c.globalAlpha = on;
      plate(c, cx - R - 34, cy - R - 62, 2 * R + 68, 2 * R + 160);
      c.save(); c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip();
      c.drawImage(mcs[mbig[0]].cv, cx - R, cy - R, 2 * R, 2 * R);
      c.globalAlpha = on * mbig[2]; c.drawImage(mcs[mbig[1]].cv, cx - R, cy - R, 2 * R, 2 * R);
      c.restore();
      c.strokeStyle = 'rgba(236,232,223,0.35)'; c.lineWidth = 1;
      c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.moveTo(cx - R, cy); c.lineTo(cx + R, cy); c.moveTo(cx, cy - R); c.lineTo(cx, cy + R); c.stroke();
      const nameNow = MATS[mbig[1]].name + (t >= MC_SW[3] ? ' (SPHERE)' : '');
      label(c, `MATCAP · ${nameNow}`, cx - R - 14, cy - R - 30, { color: PAPER, weight: 700, size: 15, ls: 2 });
      label(c, `${MCN} × ${MCN} PAINTED SPHERE`, cx - R - 14, cy + R + 36, { color: DIMP, size: 13, ls: 2 });
      // tracked sample: scene point → lookup point (sphere uses matcap ma/mb)
      const tr = mcTrack(t, S), sp = LK.project(S, tr.p, W, H), sp2 = LK.project(S, add(tr.p, mul(tr.nw, 0.6)), W, H);
      const lx = cx + tr.nx * R, ly = cy - tr.ny * R;
      if (sp) {
        c.strokeStyle = PAPER; c.lineWidth = 2.5; c.beginPath(); c.moveTo(sp[0], sp[1]); c.lineTo(sp2[0], sp2[1]); c.stroke();
        const ang = Math.atan2(sp2[1] - sp[1], sp2[0] - sp[0]);
        c.fillStyle = PAPER; c.beginPath(); c.moveTo(sp2[0] + Math.cos(ang) * 10, sp2[1] + Math.sin(ang) * 10);
        c.lineTo(sp2[0] + Math.cos(ang + 2.5) * 10, sp2[1] + Math.sin(ang + 2.5) * 10); c.lineTo(sp2[0] + Math.cos(ang - 2.5) * 10, sp2[1] + Math.sin(ang - 2.5) * 10); c.fill();
        c.setLineDash([5, 7]); c.strokeStyle = 'rgba(236,232,223,0.55)'; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(sp[0], sp[1]); c.bezierCurveTo(sp[0] + 300, sp[1] - 260, lx - 260, ly + 120, lx, ly); c.stroke(); c.setLineDash([]);
        c.fillStyle = P.accent; c.beginPath(); c.arc(sp[0], sp[1], 6, 0, TAU); c.fill();
        label(c, 'N', sp2[0] + 12, sp2[1] - 6, { color: PAPER, weight: 700, size: 16 });
      }
      c.strokeStyle = PAPER; c.lineWidth = 2; c.beginPath(); c.arc(lx, ly, 9, 0, TAU); c.moveTo(lx - 16, ly); c.lineTo(lx - 5, ly); c.moveTo(lx + 5, ly); c.lineTo(lx + 16, ly); c.moveTo(lx, ly - 16); c.lineTo(lx, ly - 5); c.moveTo(lx, ly + 5); c.lineTo(lx, ly + 16); c.stroke();
      const f2 = v => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2);
      label(c, `N·R ${f2(tr.nx)}  N·U ${f2(tr.ny)}`, cx - R - 14, cy + R + 60, { color: PAPER, size: 14, ls: 1 });
      label(c, `uv (${(0.5 + 0.5 * tr.nx).toFixed(2)}, ${(0.5 - 0.5 * tr.ny).toFixed(2)})`, cx - R - 14, cy + R + 80, { color: P.accent, size: 14, ls: 1, weight: 700 });
      c.restore();
      // view-space normal pass
      const pv = seg(t, 2.2, 2.7) * (1 - seg(t, 8.0, 8.4));
      if (pv > 0) {
        plate(c, 60, 150, 316, 206, 0.55 * pv);
        pass(c, G, (g, S2) => {
          if (!g.hit || g.id === 0) return [0.07, 0.07, 0.08];
          const nx = dot(g.n, S2.cam.right), ny = dot(g.n, S2.cam.up);
          return [nx * 0.5 + 0.5, ny * 0.5 + 0.5, clamp(-dot(g.n, S2.cam.fw)) * 0.8 + 0.2];
        }, 72, 182, 292, 164, 'VIEW-SPACE NORMAL  (R, U)', { on: pv });
      }
      // the point: no lights
      const nl = seg(t, 3.2, 3.8);
      if (nl > 0) {
        c.save(); c.globalAlpha = nl;
        label(c, 'NO LIGHTS IN THE SCENE · NO CAST SHADOWS', 72, H - 250, { color: PAPER, size: 16, ls: 2, weight: 700 });
        label(c, 'THE LIGHT IS PAINTED INTO THE SPHERE, SO IT TURNS WITH THE CAMERA', 72, H - 224, { color: DIMP, size: 14, ls: 2 });
        c.restore();
      }
      if (t >= MC_SW[3]) {
        const on2 = seg(t, MC_SW[3], MC_SW[3] + 0.4);
        const pT = LK.project(S, add(S.tok.c, [0.2, 1.0, 0]), W, H), pS = LK.project(S, add(LK.SPH.c, [-0.4, 0.6, 0]), W, H), pC = LK.project(S, add(LK.CUBE.c, [0.2, 0.55, 0]), W, H);
        leader(c, pT, [pT[0] + 70, pT[1] - 90], 'RED WAX', { on: on2 });
        leader(c, pS, [pS[0] - 60, pS[1] - 120], 'CHROME', { on: on2, right: false });
        leader(c, pC, [pC[0] - 110, pC[1] - 110], 'JADE', { on: on2, right: false });
      }
      LK.caption(c, t, W, H, { name: 'Matcap', cat: 'Material', dark: true });
    },
    score(A) {
      LK.bed(A);
      A.whoosh(0.15, 0.8, { f1: 300, f2: 2600, q: 1.4, g: 0.1, swell: 0.6, rev: 0.4, pan: 0.4 });
      A.whoosh(1.5, 0.8, { f1: 400, f2: 3200, q: 1.4, g: 0.1, swell: 0.6, rev: 0.4, pan: -0.4 });
      // one voice per material
      A.pluck(0.95, midi(57), { g: 0.14, bright: 0.25, dur: 1.6, rev: 0.4 });           // wax: soft and low
      A.bell(MC_SW[0], midi(76), { g: 0.08, dur: 1.8, rev: 0.6 });                     // jade: a struck stone
      A.pluck(MC_SW[0], midi(64), { g: 0.1, bright: 0.5, dur: 1.2 });
      [0, 0.06, 0.12].forEach((d, i) => A.bell(MC_SW[1] + d, midi([84, 88, 91][i]), { g: 0.045, dur: 1.6, rev: 0.7, pan: (i - 1) * 0.4 }));   // pearl: shimmer
      A.osc(MC_SW[2], { type: 'square', f: 2637, dur: 0.05, g: 0.035, lp: 6000 });   // chrome: a metal ping
      A.bell(MC_SW[2], midi(81), { g: 0.08, dur: 2.2, rev: 0.5 });
      A.noise(MC_SW[2], { type: 'bandpass', f: 6000, q: 4, dur: 0.12, g: 0.05 });
      A.kick(MC_SW[3], 0.36, { f: 110, f2: 42 });
      A.chord(MC_SW[3], [57, 64, 69, 72, 76], { type: 'triangle', dur: 1.6, g: 0.04, a: 0.02, lp: 2600, rev: 0.6, width: 0.8 });
      for (let k = 0; k < 4; k++) A.osc(2.2 + k * 0.07, { f: 1800 + k * 220, dur: 0.035, g: 0.03, pan: (k - 1.5) * 0.3 });
    },
  });

  /* =====================================================================
     THREE-POINT STUDIO — the portrait and product photographer's basic
     plot. A KEY light front-left models the form and casts the main
     shadow; a weaker FILL front-right, lower and softer, opens up the
     shadow side (the key:fill ratio sets the contrast); a BACK light high
     behind the subject draws a rim that separates it from the background.
     Three spotlights with their own soft shadows, switched on one at a
     time, then a product-shot finish: a lit backdrop and a little bounce.
     ===================================================================== */
  const AIM = [0, 0.85, 0];
  const LIGHTS = [
    { name: 'KEY', pos: [-4.4, 4.9, 4.1], col: [1.0, 0.95, 0.87], I: 1.0, k: 18, inner: 0.93, outer: 0.74, on: beat(1), ramp: 0.12 },
    { name: 'FILL', pos: [5.2, 2.1, 3.8], col: [0.84, 0.9, 1.0], I: 0.33, k: 3.5, inner: 0.9, outer: 0.66, on: beat(5), ramp: 0.7 },
    { name: 'BACK', pos: [1.5, 5.6, -5.6], col: [1.0, 0.98, 0.95], I: 3.0, k: 14, inner: 0.95, outer: 0.84, on: beat(9), ramp: 0.12, flag: 0.16 },
  ];
  LIGHTS.forEach(L => { L.axis = norm(sub(AIM, L.pos)); L.d0 = len(sub(AIM, L.pos)); });
  const ST_FIN = beat(12);
  const SPEC = { 0: [0.12, 24], 1: [0.4, 70], 2: [0.55, 110], 3: [0.4, 60] };
  const lightI = (L, t) => L.I * sm(L.on, L.on + L.ramp, t) * (L.ramp < 0.2 ? 1 + 0.25 * Math.sin(seg(t, L.on, L.on + 0.25) * PI * 3) * (1 - seg(t, L.on, L.on + 0.25)) : 1);
  function stBG(g, t) {
    const fin = E.ioC(seg(t, ST_FIN, ST_FIN + 0.8));
    const dx = (g.u - 0.5) * 1.3, dy = g.v - 0.4, r = clamp(Math.hypot(dx, dy) * 1.5);
    return LK.mix3([0.028, 0.03, 0.034], LK.mix3([0.30, 0.31, 0.33], [0.05, 0.052, 0.058], Math.pow(r, 0.8)), fin);
  }
  function studio(g, S, only = -1, noShadow = false) {
    const t = S.t;
    if (!g.hit) return stBG(g, t);
    const n = g.n, v = mul(g.d, -1), alb = g.id === 0 ? [0.5, 0.49, 0.47] : LK.albedo(g.id), [ks, shin] = SPEC[g.id];
    const ndv = Math.max(0, dot(n, v)), F = 0.04 + 0.96 * Math.pow(1 - ndv, 5);
    const fin = E.ioC(seg(t, ST_FIN, ST_FIN + 0.8));
    let r = 0, gg = 0, b = 0;
    const amb = only >= 0 ? 0 : 0.018 + 0.07 * fin * (g.id === 0 ? 1 : 0.6 + 0.4 * n[1]) * (fin > 0 ? LK.ao(g.p, n, S) : 1);
    r += alb[0] * amb; gg += alb[1] * amb; b += alb[2] * amb;
    for (let i = 0; i < 3; i++) {
      if (only >= 0 && i !== only) continue;
      const L = LIGHTS[i], I = only >= 0 ? L.I : lightI(L, t);
      if (I < 0.002) continue;
      const tl = sub(L.pos, g.p), dl = len(tl), l = mul(tl, 1 / dl), ndl = dot(n, l);
      if (ndl <= 0) continue;
      const spot = sm(L.outer, L.inner, -dot(l, L.axis));
      if (spot <= 0) continue;
      const att = Math.min(1.6, (L.d0 / dl) * (L.d0 / dl));
      const sh = noShadow ? 1 : LK.shadow(add(g.p, mul(n, 0.01)), l, S, L.k);
      if (sh <= 0) continue;
      const h = norm(add(l, v)), spec = ks * Math.pow(Math.max(0, dot(n, h)), shin) * (0.5 + 9 * F);
      const e = I * spot * att * sh * ndl * (g.id === 0 && L.flag ? L.flag : 1);   // the back light is flagged off the floor
      r += e * (alb[0] + spec) * L.col[0]; gg += e * (alb[1] + spec) * L.col[1]; b += e * (alb[2] + spec) * L.col[2];
    }
    const c = LK.tone([r, gg, b], 1.45 + 0.25 * fin);
    return g.id === 0 ? LK.floorFade(c, g, stBG(g, t)) : c;
  }
  // where light L throws the Token's shadow on the floor
  const shadowPt = (L, cpt) => { const d = sub(cpt, L.pos), k = -L.pos[1] / d[1]; return add(L.pos, mul(d, k)); };
  function lightPlot(c, t, S, x, y, w, h) {
    plate(c, x, y, w, h, 0.62);
    label(c, 'LIGHT PLOT · TOP VIEW', x + 18, y + 30, { color: PAPER, weight: 700, size: 14, ls: 2 });
    const sc = 22, ox = x + w / 2, oy = y + 66 + 5.9 * sc, P2 = p => [ox + p[0] * sc, oy + p[2] * sc];
    // camera + view wedge
    const cp = P2(S.cam.pos), a = Math.atan2(-S.cam.fw[2], S.cam.fw[0]);
    c.save();
    c.fillStyle = 'rgba(236,232,223,0.07)'; c.beginPath(); c.moveTo(cp[0], cp[1]);
    const half = 0.5 * 1.25;   // horizontal half-fov ≈ 32°
    const ang = Math.atan2(S.cam.fw[2], S.cam.fw[0]);
    c.arc(cp[0], cp[1], 150, ang - half, ang + half); c.closePath(); c.fill();
    c.fillStyle = PAPER; c.translate(cp[0], cp[1]); c.rotate(ang); c.fillRect(-14, -8, 18, 16); c.beginPath(); c.moveTo(4, 0); c.lineTo(14, -8); c.lineTo(14, 8); c.closePath(); c.fill();
    c.restore();
    label(c, 'CAM', cp[0] - 20, cp[1] + 8, { color: DIMP, size: 12, ls: 2, align: 'right' });
    // objects
    c.fillStyle = 'rgba(236,232,223,0.75)';
    const sp = P2(LK.SPH.c); c.beginPath(); c.arc(sp[0], sp[1], LK.SPH.r * sc, 0, TAU); c.fill();
    const cb = P2(LK.CUBE.c); c.save(); c.translate(cb[0], cb[1]); c.rotate(-LK.CUBE.yaw); c.fillRect(-0.5 * sc, -0.5 * sc, sc, sc); c.restore();
    const tk = P2(S.tok.c); c.save(); c.translate(tk[0], tk[1]); c.rotate(-S.tok.yaw); c.fillStyle = P.accent; c.fillRect(-1 * sc, -0.22 * sc, 2 * sc, 0.44 * sc); c.restore();
    // lights
    LIGHTS.forEach((L, i) => {
      const I = lightI(L, t), lit = clamp(I / L.I), lp = P2(L.pos), tp = P2(AIM);
      const dir = Math.atan2(tp[1] - lp[1], tp[0] - lp[0]), spread = Math.acos(L.outer) * 0.8, reach = Math.hypot(tp[0] - lp[0], tp[1] - lp[1]) * 1.25;
      c.save();
      if (lit > 0.01) {
        const gr = c.createRadialGradient(lp[0], lp[1], 4, lp[0], lp[1], reach);
        gr.addColorStop(0, `rgba(255,236,200,${0.42 * lit})`); gr.addColorStop(1, 'rgba(255,236,200,0)');
        c.fillStyle = gr; c.beginPath(); c.moveTo(lp[0], lp[1]); c.arc(lp[0], lp[1], reach, dir - spread, dir + spread); c.closePath(); c.fill();
      }
      c.beginPath(); c.arc(lp[0], lp[1], 9, 0, TAU);
      c.fillStyle = lit > 0.01 ? rgbs(LK.mix3([0.3, 0.3, 0.3], L.col, lit)) : 'rgba(0,0,0,0)'; c.fill();
      c.strokeStyle = PAPER; c.lineWidth = 1.5; c.stroke();
      c.restore();
      // angle from the camera axis (top view) and elevation
      const az = Math.atan2(L.pos[0], L.pos[2]) - Math.atan2(S.cam.pos[0], S.cam.pos[2]);
      let deg = Math.round(((az * 180 / PI + 540) % 360) - 180);
      const el = Math.round(Math.atan2(L.pos[1] - AIM[1], Math.hypot(L.pos[0], L.pos[2])) * 180 / PI);
      const al = i === 2 ? 'left' : 'center', tx = i === 2 ? lp[0] + 18 : lp[0], ty = i === 2 ? lp[1] + 4 : lp[1] + 28;
      label(c, `${L.name} ${Math.round(I * 100)}%`, tx, ty, { color: lit > 0.01 ? PAPER : DIMP, size: 13, ls: 1, weight: 700, align: al });
      label(c, `${deg > 0 ? '+' : deg < 0 ? '−' : ''}${Math.abs(deg)}° · ${el}° UP`, tx, ty + 17, { color: DIMP, size: 12, ls: 1, align: al });
    });
  }

  MG.film({
    id: 'lookstudio', dur: 10, poster: 9.3,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Three-point Studio', sub: 'Key, fill and back light', era: '1920s —',
      origin: 'Three-point lighting comes from the Hollywood studio system of the 1920s and 1930s, where cinematographers lit stars with a hard key light, a softer fill to control contrast and a back light to lift the figure off the set; portrait and product photographers adopted the same plot, and the key:fill ratio became the standard way to describe contrast. In computer graphics the same three lights are the default starting rig for lighting a model or a product render.',
      works: 'Shanghai Express (Josef von Sternberg, cinematography Lee Garmes, 1932) · Citizen Kane (Orson Welles, cinematography Gregg Toland, 1941) · Casablanca (Michael Curtiz, 1942; Arthur Edeson’s Hollywood portrait lighting)',
      tech: ['Key / fill / back spotlights', 'Per-light soft shadows', 'Key:fill ratio'],
      accent: '#ffcf8a',
      motionDNA: 'The shared camera orbit with the lights fixed in the world, so the angle each light makes with the lens changes as the camera moves (the plot reads it live). The set starts dark; the key snaps on with a brief strobe flicker on beat 1, the fill fades up over most of a second on beat 5 while the key:fill ratio counts down from infinity to 3:1, the back light snaps on at beat 9, and on beat 12 the backdrop is lit and a soft bounce fills in for the finished product shot.',
      visualDNA: 'A black studio with three pools of light on a grey floor, warm key, cool fill, white back. Each light casts its own shadow, the fill’s soft and pale. Top right: a top-view light plot with cones, the camera wedge and live angles; under it the key:fill ratio. Bottom right: one thumbnail per light, adding up to the beauty render.',
      transitions: 'Lights switched on one at a time on the beat; a final lift into the product look',
      implementation: ['Three spotlights with smooth cone falloff and inverse-square attenuation', 'Lambert + Blinn-Phong with a Fresnel boost, ACES-style tone map', 'Canvas 2D + SDF tracer (js/look-kit.js): one soft-shadow ray per light per pixel, skipped outside each cone'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const { G, S } = LK.render(c, t, W, H, studio);
      const step = t < LIGHTS[1].on ? 0 : t < LIGHTS[2].on ? 1 : t < ST_FIN ? 2 : 3;
      const steps = [['STEP 1 · KEY ONLY', 'ONE HARD LIGHT MODELS THE FORM AND CASTS THE SHADOW'], ['STEP 2 · KEY + FILL', 'A WEAKER, SOFTER LIGHT OPENS UP THE SHADOW SIDE'], ['STEP 3 · KEY + FILL + BACK', 'A RIM FROM BEHIND LIFTS THE SUBJECT OFF THE SET'], ['THE PRODUCT SHOT', 'LIT BACKDROP, A LITTLE BOUNCE, SAME THREE LIGHTS']];
      const ston = seg(t, LIGHTS[0].on, LIGHTS[0].on + 0.3);
      tag(c, steps[step][0], 72, 84, { on: ston, accent: '#ffcf8a' });
      c.save(); c.globalAlpha = ston; label(c, steps[step][1], 98, 116, { color: DIMP, size: 15, ls: 2 }); c.restore();
      if (t < LIGHTS[0].on) label(c, 'LIGHTS OFF', 960, 540, { align: 'center', color: DIMP, size: 18, ls: 6 });
      // light plot + ratio
      const px = 1462, py = 60, pw = 400, ph = 380;
      c.save(); c.globalAlpha = seg(t, 0.3, 0.8); lightPlot(c, t, S, px, py, pw, ph); c.restore();
      const Ik = lightI(LIGHTS[0], t), If = lightI(LIGHTS[1], t);
      if (t > LIGHTS[0].on) {
        plate(c, px, py + ph + 12, pw, 74, 0.62);
        const ratio = If > 0.004 ? Ik / If : Infinity;
        label(c, 'KEY : FILL', px + 18, py + ph + 44, { color: DIMP, size: 14, ls: 2, weight: 700 });
        label(c, ratio === Infinity ? '∞ : 1' : `${ratio.toFixed(1)} : 1`, px + 170, py + ph + 46, { color: PAPER, size: 24, ls: 1, weight: 700 });
        label(c, ratio === Infinity ? 'NO FILL' : `${Math.log2(ratio).toFixed(1)} STOPS`, px + pw - 18, py + ph + 44, { color: '#ffcf8a', size: 14, ls: 2, align: 'right', weight: 700 });
        label(c, 'INTENSITY AT THE SUBJECT', px + 18, py + ph + 68, { color: DIMP, size: 11, ls: 2 });
      }
      // per-light thumbnails
      const tw = 200, th = 112, ty = H - 172, tx0 = 720;
      const nOn = LIGHTS.filter(L => t > L.on).length;
      if (nOn) plate(c, tx0 - 14, ty - 34, nOn * (tw + 14) + 14 + (t > LIGHTS[2].on + 0.3 ? 136 : 0), th + 48, 0.55 * seg(t, LIGHTS[0].on, LIGHTS[0].on + 0.3));
      LIGHTS.forEach((L, i) => {
        const on = seg(t, L.on, L.on + 0.3);
        if (on <= 0) return;
        const tx = tx0 + i * (tw + 14);
        pass(c, G, (g, S2) => studio(g, S2, i, i === 1), tx, ty, tw, th, `${L.name}${i ? ' +' : ''}`, { on, border: rgbs(L.col, 0.6) });
      });
      if (t > LIGHTS[2].on + 0.3) label(c, '= BEAUTY', tx0 + 3 * (tw + 14) + 4, ty + th / 2 + 6, { color: PAPER, size: 15, ls: 3, weight: 700 });
      // leader labels
      const tok = S.tok.c;
      if (step === 0) { const f0 = [LK.SPH.c[0], 0, LK.SPH.c[2]], sp0 = add(f0, mul(sub(shadowPt(LIGHTS[0], LK.SPH.c), f0), 0.75)), q = LK.project(S, sp0, W, H); leader(c, q, [q[0] + 220, q[1] + 60], 'KEY SHADOW', { on: seg(t, 1.3, 1.7), sub: 'HARD · DENSE' }); }
      if (step === 1) {
        const n = norm(sub([LK.SPH.c[0] + 2, LK.SPH.c[1] + 0.2, LK.SPH.c[2] + 1.0], LK.SPH.c)), p = add(LK.SPH.c, mul(n, LK.SPH.r));
        leader(c, LK.project(S, p, W, H), [560, 360], 'FILL', { on: seg(t, LIGHTS[1].on + 0.4, LIGHTS[1].on + 0.8), right: false, sub: 'SHADOW SIDE OPENED UP' });
        leader(c, LK.project(S, shadowPt(LIGHTS[1], tok), W, H), [520, 800], 'FILL SHADOW', { on: seg(t, LIGHTS[1].on + 0.7, LIGHTS[1].on + 1.1), right: false, sub: 'SOFT · PALE' });
      }
      if (step === 2) {
        const p = add(tok, LK.V.mul([S.tok.M[1], S.tok.M[4], S.tok.M[7]], 1.0));
        leader(c, LK.project(S, p, W, H), [1180, 250], 'RIM', { on: seg(t, LIGHTS[2].on + 0.3, LIGHTS[2].on + 0.7), sub: 'BACK LIGHT ON THE TOP EDGE' });
      }
      LK.caption(c, t, W, H, { name: 'Three-point Studio', cat: 'Light', dark: true });
    },
    score(A) {
      LK.bed(A, { g: 0.85 });
      const clunk = (t, g, pan) => { A.noise(t, { type: 'bandpass', f: 1800, q: 2, dur: 0.05, g, pan }); A.kick(t, 0.25, { f: 160, f2: 60, dur: 0.18 }); A.osc(t + 0.02, { type: 'sawtooth', f: 100, dur: 0.5, g: 0.012, lp: 600, pan }); };
      clunk(LIGHTS[0].on, 0.16, -0.5);   // the key: a hard switch
      A.chord(LIGHTS[0].on, [57, 64], { type: 'triangle', dur: 2.4, g: 0.035, a: 0.05, lp: 1800, rev: 0.5 });
      A.osc(LIGHTS[1].on, { type: 'sine', f: midi(64), f2: midi(69), glide: 0.7, dur: 1.4, g: 0.05, a: 0.5, rev: 0.6, pan: 0.5 });   // the fill fades up
      A.whoosh(LIGHTS[1].on, 0.8, { f1: 300, f2: 1500, q: 0.8, g: 0.06, swell: 0.8, rev: 0.5, pan: 0.5 });
      clunk(LIGHTS[2].on, 0.14, 0.2);   // the back light
      A.bell(LIGHTS[2].on + 0.03, midi(81), { g: 0.06, dur: 1.6, rev: 0.6 });
      A.riser(ST_FIN - 0.9, 0.9, { g: 0.07, f: 220 });
      A.kick(ST_FIN, 0.38, { f: 110, f2: 42 });
      A.chord(ST_FIN, [57, 64, 69, 73, 76], { type: 'triangle', dur: 1.6, g: 0.045, a: 0.02, lp: 2800, rev: 0.6, width: 0.8 });
      A.bell(ST_FIN, midi(88), { g: 0.05, dur: 1.4, rev: 0.6 });
    },
  });

  /* =====================================================================
     RIM LIGHT — a dark set lit only from behind. Each light adds
       rim = I · edge^p · facing · shadow
     where edge = remap(1 − N·V) over the outer `width` of the range (the
     Fresnel-style band that hugs every silhouette) and facing = N·L of the
     light behind (biased), so the band only appears on the side the light
     reaches. A little back-lit diffuse, a grazing specular and analytic
     in-scattering haze around each light finish the look; the floor in
     front catches long shadows thrown toward the camera.
     ===================================================================== */
  const RIM_W = [[0, 0.22], [beat(4), 0.22], [beat(4) + 0.3, 0.46], [beat(6), 0.46], [beat(6) + 0.3, 0.12], [beat(8), 0.12], [beat(8) + 0.4, 0.3], [beat(11), 0.3], [beat(11) + 0.4, 0.36]];
  const RIM_P = [[0, 1.6], [beat(4), 1.6], [beat(4) + 0.3, 1.2], [beat(6), 1.2], [beat(6) + 0.3, 3.0], [beat(8), 3.0], [beat(8) + 0.4, 1.8]];
  const RIM_I = [[0, 0], [0.9, 0], [1.7, 2.2, E.outC]];
  const TWO = beat(8);
  const RL = [
    { name: 'BACK', pos: [0, 3.6, -5.4], col: [1, 0.97, 0.93] },
    { name: 'WARM', pos: [-3.6, 3.0, -4.3], col: [1.0, 0.6, 0.26] },
    { name: 'COOL', pos: [3.8, 2.7, -4.1], col: [0.32, 0.66, 1.0] },
  ];
  const RIM_AIM = [0, 0.7, 0];
  RL.forEach(L => { L.axis = norm(sub(RIM_AIM, L.pos)); });
  function rimParams(t) {
    const two = E.ioC(seg(t, TWO, TWO + 0.5)), I = kf(t, RIM_I);
    return { w: kf(t, RIM_W), p: kf(t, RIM_P), I, gains: [I * (1 - two), I * 1.15 * two, I * 1.15 * two], two };
  }
  const RIM_BG = [0.008, 0.009, 0.014];
  /* Soft shadow from the OTHER objects only. LK.shadow also tests the surface the ray leaves, and
     its penumbra estimate darkens exactly the grazing points where a rim lives; a rim must not be
     shadowed by its own silhouette. Same method as the kit's, with a skip id. */
  function shadowOther(p, l, S, skip, k = 10) {
    let res = 1;
    if (skip !== 2) {
      const oc = sub(p, LK.SPH.c), b = dot(oc, l), cc = dot(oc, oc) - LK.SPH.r * LK.SPH.r, h = b * b - cc;
      const d = Math.sqrt(Math.max(0, LK.SPH.r * LK.SPH.r - h)) - LK.SPH.r, tt = -b - Math.sqrt(Math.max(h, 0));
      if (tt > 0) { const x = clamp(0.25 * k * d / tt); res = Math.min(res, x * x * (3 - 2 * x)); }
    }
    const objs = [[1, S.tok.c, LK.TOK.bound, q => LK.sdToken(q, S)], [3, LK.CUBE.c, LK.CUBE.bound, q => LK.sdCube(q, S)]];
    for (const [id, cc, r, f] of objs) {
      if (id === skip) continue;
      const oc = sub(cc, p), along = dot(oc, l);
      if (along < -r || len(sub(oc, mul(l, along))) - r > r * 0.6) continue;
      let tt = Math.max(0.02, along - r - 0.05);
      for (let i = 0; i < 40 && tt < along + r; i++) {
        const h = f(add(p, mul(l, tt)));
        res = Math.min(res, k * h / tt);
        if (res < 0.002) return 0;
        tt += clamp(h, 0.02, 0.4);
      }
    }
    return clamp(res);
  }
  function haze(g, ro, maxT, par) {   // analytic single scattering from a point light along the view ray
    let r = 0, gg = 0, b = 0;
    for (let i = 0; i < 3; i++) {
      const I = par.gains[i]; if (I < 0.005) continue;
      const L = RL[i], oc = sub(L.pos, ro), s0 = dot(oc, g.d), hh = Math.max(0.05, len(sub(oc, mul(g.d, s0))));
      const T = Math.min(maxT, 40), sc = (Math.atan((T - s0) / hh) - Math.atan(-s0 / hh)) / hh;
      const k = 0.022 * I * sc;
      r += k * L.col[0]; gg += k * L.col[1]; b += k * L.col[2];
    }
    return [r, gg, b];
  }
  function rimShade(g, S, par, mode = 0) {
    const ro = S.cam.pos, hz = haze(g, ro, g.hit ? g.depth : 40, par);
    if (!g.hit) return LK.tone(add(RIM_BG, hz), 1.2);
    const n = g.n, v = mul(g.d, -1), ndv = Math.max(0, dot(n, v));
    const alb = g.id === 0 ? [0.22, 0.22, 0.23] : mul(LK.albedo(g.id), 0.5);
    let c = mul(alb, 0.018 * (0.5 + 0.5 * n[1]));   // the faintest ambient so silhouettes keep a little body
    const edge = Math.pow(clamp((1 - ndv - (1 - par.w)) / par.w), par.p);
    for (let i = 0; i < 3; i++) {
      const I = par.gains[i]; if (I < 0.005) continue;
      const L = RL[i], tl = sub(L.pos, g.p), dl = len(tl), l = mul(tl, 1 / dl), ndl = dot(n, l);
      const spot = sm(0.55, 0.85, -dot(l, L.axis));
      if (g.id === 0) {   // floor: a pool of light with long shadows toward the camera, and a glossy streak
        if (ndl <= 0 || spot <= 0) continue;
        const sh = LK.shadow(add(g.p, [0, 0.01, 0]), l, S, 9);
        if (sh <= 0) continue;
        const h = norm(add(l, v)), spec = 0.16 * Math.pow(Math.max(0, dot(n, h)), 60);
        const e = I * spot * sh * (ndl * 0.075 * 26 / (dl * dl) + spec);
        c = add(c, mul(L.col, e));
        continue;
      }
      const facing = clamp((ndl + 0.3) / 1.3);
      const want = edge * facing > 0.004 || ndl > 0;
      if (!want) continue;
      const sh = shadowOther(add(g.p, mul(n, 0.01)), l, S, g.id, 10);
      if (sh <= 0) continue;
      const rim = edge * facing * 1.6;
      const back = Math.max(0, ndl) * 0.5;
      const h = norm(add(l, v)), F = 0.04 + 0.96 * Math.pow(1 - ndv, 5), spec = 1.4 * Math.pow(Math.max(0, dot(n, h)), 60) * F * 4;
      if (mode === 1) return [edge, edge, edge];
      c = add(c, mul(L.col, I * sh * (rim + back * (alb[0] + alb[1] + alb[2]) / 3 + spec)));
    }
    c = add(c, mul(hz, 0.6));
    const out = LK.tone(c, 1.2);
    return g.id === 0 ? LK.floorFade(out, g, LK.tone(add(RIM_BG, hz), 1.2)) : out;
  }
  const rimSplit = t => 1 - E.ioC(seg(t, 0.2, 1.4));   // look revealed from the left, plain retreats right

  MG.film({
    id: 'lookrim', dur: 10, poster: 8.9,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Rim Light', sub: 'Silhouettes edged by light from behind', era: '1920s —',
      origin: 'The back or rim light is one of the three lights of classic Hollywood studio lighting, placed behind and above the subject so a thin edge of light separates it from a dark background; film noir and high-contrast advertising pushed it to the point where the edge is nearly all that is lit. In real-time graphics the effect is often faked with a Fresnel-style term on 1 − N·V, a staple of game and stylised shaders, while offline renderers get it from lights placed behind the subject.',
      works: 'The Third Man (Carol Reed, cinematography Robert Krasker, 1949) · Blade Runner (Ridley Scott, cinematography Jordan Cronenweth, 1982) · Apocalypse Now (Francis Ford Coppola, 1979; Vittorio Storaro’s edge-lit Kurtz in darkness)',
      tech: ['Edge band from 1 − N·V', 'Back-light facing gate', 'Warm / cool two-rim'],
      accent: '#ff9a3c',
      motionDNA: 'The shared camera orbit over a set lit only from behind. A split wipes the plain render away into black; a white back light swells up and draws thin edges; on the beat the rim width widens to a soft glow, then narrows to a hairline with a sharp falloff; on beat 8 the single white light gives way to a warm rim back-left and a cool rim back-right, and the width settles to a medium band for the end.',
      visualDNA: 'Near-black set, objects in silhouette, lines of light along every edge that faces a light, long shadows running toward the lens across a dark glossy floor, soft haze glowing round the light sources. Top right: three passes — the edge band, the back-light facing term and their product. Top left: live width, falloff and intensity readouts with bars.',
      transitions: 'Split wipe from the plain render; parameter changes on the beat; white rim crossfades to a warm and cool pair',
      implementation: ['Rim term: remap(1 − N·V, width)^falloff × N·L of the back light, shadowed', 'Grazing Blinn-Phong with Schlick Fresnel; analytic point-light in-scattering haze', 'Canvas 2D + SDF tracer (js/look-kit.js): shadow rays only where a rim or floor pool can appear'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const par = rimParams(t), split = rimSplit(t);
      const look = (g, S) => rimShade(g, S, par);
      const shade = (g, S) => (g.u > 1 - split ? LK.plain(g, S) : look(g, S));
      const { G, S } = LK.render(c, t, W, H, split > 0.001 ? shade : look);
      if (split > 0.001 && split < 0.999) {
        const x = (1 - split) * W;
        c.fillStyle = PAPER; c.fillRect(x - 1.5, 0, 3, H);
        label(c, 'RIM', x - 24, 140, { align: 'right', color: PAPER, weight: 700, size: 18 });
        label(c, 'PLAIN', x + 24, 140, { color: P.ink, weight: 700, size: 18 });
      }
      const ui = seg(t, 1.2, 1.7);
      c.save(); c.globalAlpha = ui;
      tag(c, par.two > 0.5 ? 'RIM LIGHT · WARM + COOL' : 'RIM LIGHT · ONE BACK LIGHT', 72, 84, { accent: par.two > 0.5 ? '#ff9a3c' : PAPER });
      label(c, 'rim = I · remap(1 − N·V, width)^falloff · N·L(back) · shadow', 98, 116, { color: DIMP, size: 15, ls: 1 });
      // readouts with bars
      const rows = [['WIDTH', par.w, 0.6, par.w.toFixed(2)], ['FALLOFF', par.p, 3.5, par.p.toFixed(1)], ['INTENSITY', par.I, 3, par.I.toFixed(1)]];
      rows.forEach(([nm, v, mx, s], i) => {
        const y = 170 + i * 34;
        label(c, nm, 98, y, { color: DIMP, size: 14, ls: 2 });
        c.fillStyle = 'rgba(236,232,223,0.18)'; c.fillRect(240, y - 9, 180, 4);
        c.fillStyle = i === 0 ? '#ff9a3c' : PAPER; c.fillRect(240, y - 9, 180 * clamp(v / mx), 4);
        label(c, s, 440, y, { color: PAPER, size: 15, ls: 1, weight: 700 });
      });
      label(c, par.two > 0.5 ? 'LIGHTS  WARM BACK-LEFT · COOL BACK-RIGHT' : 'LIGHTS  ONE WHITE, DIRECTLY BEHIND', 98, 282, { color: DIMP, size: 13, ls: 2 });
      c.restore();
      // passes: edge, facing, rim
      const pw = 240, ph = 135, py = 76, pon = seg(t, 1.8, 2.3);
      if (pon > 0) {
        const px0 = W - 72 - 3 * pw - 2 * 14;
        plate(c, px0 - 14, py - 40, 3 * pw + 2 * 14 + 28, ph + 82, 0.5 * pon);
        const L0 = par.two > 0.5 ? 1 : 0;
        const edgeK = g => Math.pow(clamp((1 - Math.max(0, -dot(g.n, g.d)) - (1 - par.w)) / par.w), par.p);
        // raw 1 − N·V in grey, the remapped band on top in amber
        const edgeF = g => { if (!g.hit) return [0, 0, 0]; if (g.id === 0) return [0.035, 0.035, 0.04]; const r = 0.35 * (1 - Math.max(0, -dot(g.n, g.d))), e = edgeK(g); return [r + e, r + e * 0.62, r + e * 0.25]; };
        const faceF = (g, S2) => { if (!g.hit) return [0, 0, 0]; if (g.id === 0) return [0.035, 0.035, 0.04]; const l = norm(sub(RL[L0].pos, g.p)), f = 0.08 + 0.92 * clamp((dot(g.n, l) + 0.3) / 1.3); return [f, f, f]; };
        const rimF = (g, S2) => {
          if (!g.hit) return [0, 0, 0]; if (g.id === 0) return [0.035, 0.035, 0.04];
          const e = edgeK(g);
          let r = 0, gg = 0, b = 0;
          for (let i = 0; i < 3; i++) { const I = par.gains[i]; if (I < 0.005) continue; const l = norm(sub(RL[i].pos, g.p)), f = clamp((dot(g.n, l) + 0.3) / 1.3) * e * Math.min(1, I) * 3; r += f * RL[i].col[0]; gg += f * RL[i].col[1]; b += f * RL[i].col[2]; }
          return [r, gg, b];
        };
        // a close-up crop around the sphere, so the thin terms are readable
        const sc0 = LK.project(S, LK.SPH.c, W, H), dd = norm(sub(LK.SPH.c, S.cam.pos)), sc1 = LK.project(S, add(LK.SPH.c, mul(LK.V.cross(dd, S.cam.up), LK.SPH.r)), W, H);
        const rr = Math.hypot(sc1[0] - sc0[0], sc1[1] - sc0[1]) * 1.3 / H, src = [sc0[0] / W - rr, sc0[1] / H - rr, sc0[0] / W + rr, sc0[1] / H + rr];   // 16:9 crop: half-width in u equals half-height in v
        pass(c, G, edgeF, px0, py, pw, ph, `EDGE BAND  W ${par.w.toFixed(2)}`, { on: pon, src });
        pass(c, G, faceF, px0 + pw + 14, py, pw, ph, `× FACING  N·L ${RL[L0].name}`, { on: pon, src });
        pass(c, G, rimF, px0 + 2 * (pw + 14), py, pw, ph, '= RIM', { on: pon, border: 'rgba(255,154,60,0.7)', src });
        c.save(); c.globalAlpha = pon; label(c, 'SPHERE CLOSE-UP · RIM TERM ONLY · NO SHADOW, NO HAZE', px0, py + ph + 26, { color: DIMP, size: 12, ls: 2 }); c.restore();
      }
      // light labels
      if (par.two > 0.05) {
        const on = seg(t, TWO + 0.3, TWO + 0.8);
        // the warm rim on the sphere's silhouette, the cool one on the Token's right edge
        const vs = norm(sub(LK.SPH.c, S.cam.pos)), lw = norm(sub(RL[1].pos, LK.SPH.c)), nw = norm(sub(lw, mul(vs, dot(lw, vs))));
        const pw2 = LK.project(S, add(LK.SPH.c, mul(nw, LK.SPH.r)), W, H);
        const M = S.tok.M, pk = LK.project(S, add(S.tok.c, [M[0] * 1.0, M[3] * 1.0 - 0.1, M[6] * 1.0]), W, H);
        leader(c, pw2, [pw2[0] - 60, pw2[1] - 120], 'WARM RIM', { on, right: false, color: '#ffb470', sub: 'BACK-LEFT · AMBER' });
        leader(c, pk, [pk[0] + 90, pk[1] + 150], 'COOL RIM', { on, color: '#8cc4ff', sub: 'BACK-RIGHT · SKY BLUE' });
      } else if (t > 2.4) {
        const on = seg(t, 2.4, 2.9) * (1 - seg(t, TWO - 0.4, TWO));
        const pl = LK.project(S, add(LK.SPH.c, [0, LK.SPH.r * 0.97, -0.15]), W, H);
        leader(c, pl, [pl[0] - 40, pl[1] - 130], 'EDGE FACING THE LIGHT', { on, right: false, sub: 'N·V → 0 AND N·L > 0' });
        const d = sub(LK.SPH.c, RL[0].pos), far = add(RL[0].pos, mul(d, -RL[0].pos[1] / d[1])), foot = [LK.SPH.c[0], 0, LK.SPH.c[2]];
        const ps = LK.project(S, add(foot, mul(sub(far, foot), 0.45)), W, H);
        leader(c, ps, [ps ? ps[0] + 220 : 0, ps ? ps[1] - 80 : 0], 'SHADOW THROWN TOWARD THE LENS', { on });
      }
      LK.caption(c, t, W, H, { name: 'Rim Light', cat: 'Light', dark: true, curve: u => kf(u * 10, RIM_W), lo: 0, hi: 0.6, curveLabel: 'RIM WIDTH / TIME' });
    },
    score(A) {
      LK.bed(A, { g: 0.8 });
      A.whoosh(0.2, 1.2, { f1: 200, f2: 1800, q: 1.2, g: 0.09, swell: 0.6, rev: 0.5, pan: -0.3 });
      A.osc(0.9, { type: 'sine', f: midi(45), f2: midi(57), glide: 0.8, dur: 2.2, g: 0.06, a: 0.6, rev: 0.6 });   // the back light swells
      A.osc(0.9, { type: 'triangle', f: midi(69), dur: 2.0, g: 0.025, a: 0.8, rev: 0.7, lp: 2400 });
      A.noise(beat(4), { type: 'bandpass', f: 600, f2: 2400, q: 1, dur: 0.4, g: 0.06, swell: 0.4, rev: 0.4 });   // wide, soft rim
      A.pluck(beat(4), midi(64), { g: 0.1, bright: 0.3, dur: 1.4, rev: 0.4 });
      A.osc(beat(6), { type: 'square', f: 3520, dur: 0.03, g: 0.03, lp: 7000 });   // hairline rim
      A.bell(beat(6), midi(88), { g: 0.06, dur: 1.4, rev: 0.5 });
      A.kick(TWO, 0.34, { f: 100, f2: 40 });
      A.chord(TWO, [52, 59, 64, 68], { type: 'sawtooth', dur: 2.6, g: 0.022, a: 0.3, lp: 1400, rev: 0.6, width: 0.9 });   // warm
      A.bell(TWO + 0.05, midi(83), { g: 0.05, dur: 1.8, rev: 0.6, pan: -0.5 });
      A.bell(TWO + 0.12, midi(90), { g: 0.04, dur: 1.8, rev: 0.6, pan: 0.5 });   // cool
      A.pluck(beat(11), midi(71), { g: 0.1, bright: 0.5, dur: 1.4, rev: 0.4 });
    },
  });
})();
