/* batch l8 — Rendering Looks · Light, Shading: lookchiaroscuro · lookcaustics · lookhatching.
   lookchiaroscuro (Caravaggio / Rembrandt low-key: one hard, high side light in a spot cone with
   inverse-square falloff, hard shadows, almost no fill, so the forms emerge from black; the fill
   steps down on the beat from 6:1 to 80:1 and the lamp drifts a little; a notan (two-value) inset,
   the key-to-fill ratio and the academic light zones on the sphere) ·
   lookcaustics (sunlight focused by a rippling water surface: a seeded spectral height field is
   refracted into a photon density map per frame, projected down the light direction onto the floor
   and the objects and masked by shadow; the glass sphere gathers the rippled light into one bright
   spot by tracing photons through it; height-field and caustic-map insets and a cross-section of
   rays gathering into lines) ·
   lookhatching (pen and ink: tone from N·L, shadow and AO mapped to one, two, then three layers of
   hatching as it darkens, line weight growing within each layer, ink outlines from G-buffer
   discontinuities and a paper texture; screen-space hatching gives way to lines that follow the
   objects, then a watercolour wash goes under the ink). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, hash, midi, text } = MG;
  const LK = MG.LK, V = LK.V, P = LK.P, PI = Math.PI;
  const { add, sub, mul, dot, norm } = V;
  const mix3 = LK.mix3;

  /* ---------------- shared helpers ---------------- */
  const INK = P.ink, PAPER = P.paper;
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const label = (c, s, x, y, o = {}) => text(c, s, x, y, { font: MG.TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base, stroke: o.halo || undefined, lw: o.lw || 5 });
  const dimc = dark => (dark ? 'rgba(236,232,223,0.62)' : 'rgba(23,24,28,0.6)');
  // accent dot + bold mono label, top-left of frame
  function tag(c, s, x, y, o = {}) {
    const on = o.on ?? 1; if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = o.accent || P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: o.dark ? PAPER : INK, weight: 700, size: 20, halo: o.halo });
    c.restore();
  }
  // a mono readout line: dim key, bright value
  function readout(c, k, v, x, y, o = {}) {
    label(c, k, x, y, { size: 15, ls: 2, color: dimc(o.dark), halo: o.halo });
    label(c, v, x + (o.kw || 200), y, { size: 15, ls: 2, weight: 700, color: o.vc || (o.dark ? PAPER : INK), halo: o.halo });
  }
  // translucent inset panel
  function panel(c, x, y, w, h, dark) {
    c.save();
    c.fillStyle = dark ? 'rgba(10,9,8,0.74)' : 'rgba(240,236,228,0.9)'; c.fillRect(x, y, w, h);
    c.strokeStyle = dark ? 'rgba(236,232,223,0.22)' : 'rgba(23,24,28,0.22)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    c.restore();
  }
  // leader line from a world point to a label
  function leader(c, S, p, dx, dy, s, o = {}) {
    const on = o.on ?? 1; if (on <= 0.01) return;
    const q = o.screen || LK.project(S, p); if (!q) return;
    const col = o.dark ? PAPER : INK, tx = q[0] + dx, ty = q[1] + dy, dir = dx < 0 ? -1 : 1;
    c.save(); c.globalAlpha *= on; c.lineCap = 'round';
    const path = () => { c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(tx, ty); c.lineTo(tx + dir * 18, ty); c.stroke(); };
    c.strokeStyle = o.dark ? 'rgba(0,0,0,0.6)' : 'rgba(240,236,228,0.85)'; c.lineWidth = 4.5; path();
    c.strokeStyle = col; c.lineWidth = 1.5; path();
    c.fillStyle = o.dot || P.accent; c.beginPath(); c.arc(q[0], q[1], 5, 0, TAU); c.fill();
    c.strokeStyle = col; c.lineWidth = 1.5; c.beginPath(); c.arc(q[0], q[1], 8, 0, TAU); c.stroke();
    const halo = o.dark ? 'rgba(0,0,0,0.55)' : 'rgba(240,236,228,0.85)';
    label(c, s, tx + dir * 26, ty + 6, { size: 15, ls: 2, weight: 700, color: col, align: dir < 0 ? 'right' : 'left', halo });
    if (o.sub) label(c, o.sub, tx + dir * 26, ty + 28, { size: 13, ls: 2, color: dimc(o.dark), align: dir < 0 ? 'right' : 'left', halo });
    c.restore();
  }
  // vertical split line between the look and the reference
  function splitBar(c, x, H, left, right, o = {}) {
    if (x < -20 || x > 1940) return;
    const on = o.on ?? 1; if (on <= 0.01) return;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = o.dark ? 'rgba(0,0,0,0.5)' : 'rgba(240,236,228,0.7)'; c.fillRect(x - 3.5, 0, 7, H);
    c.fillStyle = o.col || P.accent; c.fillRect(x - 1.5, 0, 3, H);
    c.beginPath(); c.arc(x, o.y || 300, 9, 0, TAU); c.fill();
    const y = (o.y || 300) + 6;
    if (x > 280) label(c, left + '  ◀', x - 22, y, { align: 'right', size: 15, ls: 2, weight: 700, color: o.dark ? PAPER : INK, halo: o.dark ? 'rgba(0,0,0,0.6)' : 'rgba(240,236,228,0.85)' });
    if (x < 1640) label(c, '▶  ' + right, x + 22, y, { size: 15, ls: 2, weight: 700, color: o.rdark ? PAPER : INK, halo: o.rdark ? 'rgba(0,0,0,0.6)' : 'rgba(240,236,228,0.85)' });
    c.restore();
  }
  // cached offscreen canvas + ImageData for small pass insets
  const CVS = {};
  function cvs(key, w, h) {
    if (!CVS[key]) { const cv = MG.offscreen(w, h), cx = cv.getContext('2d'); CVS[key] = { cv, cx, img: cx.createImageData(w, h), w, h }; }
    return CVS[key];
  }
  function blit(k) { k.cx.putImageData(k.img, 0, 0); return k.cv; }
  const toWorld = (M, p) => [M[0] * p[0] + M[1] * p[1] + M[2] * p[2], M[3] * p[0] + M[4] * p[1] + M[5] * p[2], M[6] * p[0] + M[7] * p[1] + M[8] * p[2]];
  const toLocal = (M, p) => [M[0] * p[0] + M[3] * p[1] + M[6] * p[2], M[1] * p[0] + M[4] * p[1] + M[7] * p[2], M[2] * p[0] + M[5] * p[1] + M[8] * p[2]];
  const tokPoint = (S, q) => add(S.tok.c, toWorld(S.tok.M, q));
  const rgbStr = (c, a = 1) => `rgba(${Math.round(clamp(c[0]) * 255)},${Math.round(clamp(c[1]) * 255)},${Math.round(clamp(c[2]) * 255)},${a})`;
  const flash = (c, t, ts, x, y, w, h, col) => { const f = 1 - seg(t, ts, ts + 0.6); if (t >= ts && f > 0) { c.save(); c.globalAlpha = f; c.strokeStyle = col; c.lineWidth = 2; c.strokeRect(x, y, w, h); c.restore(); } };

  /* =====================================================================
     CHIAROSCURO — one hard source, high and to the side, and darkness
     everywhere else. The lamp is a point light in a spot cone above and
     to the left of the still life, falling off with the inverse square
     of distance, so the floor and backdrop sink into black within a few
     metres and the forms emerge from shadow with hard cast shadows and
     a crisp terminator. Fill (ambient sky, AO-weighted) is the only
     light in the shadows and it steps down on the beat — key-to-fill
     6:1, 21:1, 80:1 — from Rembrandt's low key toward Caravaggio's
     tenebrism. A warm reflected light from the lit floor lifts the
     sphere's underside, so the academic zones of light on a ball read:
     highlight, light, half-tone, core shadow, reflected light, cast
     shadow. A notan inset reduces each frame to two values.
     ===================================================================== */
  const C_WIPE = [0.4, 2.2];
  const C_FILL = [[0, 0.2], [3.55, 0.05], [5.7, 0.0125]];
  function cFill(t) {
    let f = C_FILL[0][1];
    for (let i = 1; i < C_FILL.length; i++) { const [ts, v] = C_FILL[i]; if (t >= ts) f = lerp(C_FILL[i - 1][1], v, E.outC(seg(t, ts, ts + 0.5))); }
    return f;
  }
  const C_WARM = [1.0, 0.82, 0.6], C_FILLC = [0.78, 0.74, 0.7], C_BG = [0.014, 0.011, 0.009];
  const C_ALB = [[0.3, 0.22, 0.15], [1.0, 0.36, 0.13], [0.9, 0.86, 0.78], [0.16, 0.3, 0.86]];
  function cState(t) {
    const az = -1.22 + 0.13 * Math.sin((t - 2) * TAU / 14), ht = 6.1 + 0.25 * Math.sin(t * 0.55);
    const lamp = [Math.sin(az) * 4.9, ht, Math.cos(az) * 4.9];
    const aim = [-0.3, 0.75, 0.05], axis = norm(sub(aim, lamp)), d0 = V.len(sub(aim, lamp));
    return { lamp, axis, d0, fill: cFill(t) };
  }
  function cBack(g) {
    // a dark umber wall with a faint warm spill where the lamp catches it
    const k = Math.exp(-((g.u - 0.66) ** 2) * 5 - ((g.v - 0.28) ** 2) * 8);
    return [C_BG[0] + 0.05 * k, C_BG[1] + 0.034 * k, C_BG[2] + 0.02 * k];
  }
  function cShade(g, S, st, mode = 0) {
    if (!g.hit) return mode ? [0, 0, 0] : cBack(g);
    const a = C_ALB[g.id], n = g.n, p = g.p;
    const lv = sub(st.lamp, p), dist = V.len(lv), L = mul(lv, 1 / dist), ndl = dot(n, L);
    const cone = sstep(0.875, 0.968, -dot(L, st.axis)), fall = st.d0 * st.d0 / (dist * dist);
    let key = 0, spec = 0;
    if (ndl > 0 && cone > 0) {
      const sh = LK.shadow(add(p, mul(n, 0.01)), L, S, 48);
      key = ndl * sh * cone * fall;
      if (g.id) { const hv = norm(sub(L, g.d)); spec = Math.pow(Math.max(0, dot(n, hv)), g.id === 2 ? 60 : 36) * sh * cone * fall * (g.id === 3 ? 0.35 : 0.5); }
    }
    if (mode === 1) return [key, key, key];
    const occ = LK.ao(p, n, S);
    const fill = st.fill * (0.4 + 0.6 * (0.5 + 0.5 * n[1])) * occ;
    // warm light bounced up off the lit table top
    const bnc = g.id ? Math.max(0, -n[1] * 0.8 + 0.2 * dot(n, mul(L, -1))) * 0.07 * occ * sstep(-0.2, 0.6, -n[1]) : 0;
    const I = 1.75, out = [0, 0, 0];
    for (let k = 0; k < 3; k++) out[k] = a[k] * (C_WARM[k] * (key * I + bnc) + C_FILLC[k] * fill) + C_WARM[k] * spec * 1.2 + C_BG[k] * 0.4;
    const c = LK.tone(out, 1.15);
    if (g.id !== 0) return c;
    return LK.floorFade(c, g, cBack(g));
  }
  let cNotan = null, cDark = 0;
  const CN = [200, 113];
  function cPost(t, sx) {
    return (rgb, G) => {
      const { w, h } = G, fr = Math.floor(t * 30);
      const k = cvs('notan', CN[0], CN[1]), d = k.img.data;
      let dark = 0, tot = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, u = (x + 0.5) / w;
        if (u >= sx) continue;
        // vignette and a fine seeded grain, only on the look side
        const dx = u - 0.5, dy = (y + 0.5) / h - 0.48, vg = 1 - 0.55 * Math.min(1, (dx * dx * 1.3 + dy * dy * 2.2) * 1.6);
        const gr = (hash(x * 12.9898 + y * 78.233 + fr * 37.719) - 0.5) * 0.018;
        for (let ch = 0; ch < 3; ch++) rgb[i * 3 + ch] = rgb[i * 3 + ch] * vg + gr;
      }
      for (let y = 0; y < CN[1]; y++) for (let x = 0; x < CN[0]; x++) {
        const gi = Math.floor((y + 0.5) * h / CN[1]) * w + Math.floor((x + 0.5) * w / CN[0]);
        const l = LK.luma([rgb[gi * 3], rgb[gi * 3 + 1], rgb[gi * 3 + 2]]), on = l > 0.13;
        if (l < 0.05) dark++; tot++;
        const o = (y * CN[0] + x) * 4, v = on ? [236, 228, 212] : [14, 12, 10];
        d[o] = v[0]; d[o + 1] = v[1]; d[o + 2] = v[2]; d[o + 3] = 255;
      }
      cNotan = blit(k); cDark = dark / tot;
    };
  }

  MG.film({
    id: 'lookchiaroscuro', dur: 10, poster: 7.2,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Chiaroscuro', sub: 'One hard light, and darkness for the rest', era: '1600 —',
      origin: 'Chiaroscuro (Italian, “light-dark”) names the modelling of form by strong contrast of light and shade, developed in Renaissance drawing and painting. Caravaggio pushed it to tenebrism around 1600: a single high, raking light, figures emerging from near-black, as in The Calling of Saint Matthew (1599–1600). Rembrandt made a gentler, warmer low key his own in the following decades, and portrait photographers still call a key set high and to the side “Rembrandt lighting”. Film noir cinematographers carried the idea into black-and-white cinema in the 1940s; in rendering it is a single shadowed spot light, a high key-to-fill ratio and nothing else.',
      works: 'The Calling of Saint Matthew (Caravaggio, 1599–1600) · The Night Watch (Rembrandt, 1642) · The Third Man (Carol Reed, cinematography Robert Krasker, 1949)',
      tech: ['Single hard spot, inverse-square falloff', 'High key-to-fill ratio', 'Notan: two-value design'],
      accent: '#e0a458',
      motionDNA: 'The shared 50° orbit with the Token turning and bobbing, under a lamp that drifts a few degrees and rises and falls a little, so the terminators and the shadow edges creep across the forms. A wipe opens the dark set from the plain reference; then the fill steps down on the beat, 6:1 → 21:1 → 80:1, and the shadows sink from deep brown to black while the lit planes stay put.',
      visualDNA: 'Near-black umber ground with a faint warm spill on the unseen wall; a warm hard key raking the orange Token, an ivory sphere and a deep blue cube on a dark wooden table, crisp cast shadows, a narrow pool of light that dies within a metre or two, a vignette and fine grain. A notan inset in ink and bone, a key-to-fill readout, and the light zones of the ball labelled on the sphere, then the lamp–form–shadow triangle drawn in dashes.',
      transitions: 'Wipe from the plain reference to the dark set; the fill steps down on the beat',
      implementation: ['Cinematography: one hard key, flags and no fill (negative fill); key-to-fill ratio metered in stops', 'Spot light with cone falloff and inverse-square decay, ambient near zero (Blender, Arnold, Unreal)', 'Canvas 2D + SDF tracer (js/look-kit.js): point light in a smoothstep cone, inverse-square falloff, hard LK.shadow (k 48), AO-weighted fill stepped down on the beat, floor bounce term, vignette + frame-seeded grain, notan threshold in post'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const st = cState(t), sx = E.ioC(seg(t, C_WIPE[0], C_WIPE[1])) * 1.04 - 0.02;
      const { S } = LK.render(c, t, W, H, (g, S) => (g.u < sx ? cShade(g, S, st) : LK.plain(g, S)), { post: cPost(t, sx) });
      if (t < C_WIPE[1] + 0.1) splitBar(c, sx * W, H, 'CHIAROSCURO', 'PLAIN REFERENCE', { dark: true, y: 300 });
      const halo = 'rgba(0,0,0,0.5)', dark = sx > 0.2;
      tag(c, 'CHIAROSCURO  ·  ONE HARD KEY, NO FILL', 72, 80, { dark, accent: '#e0a458', halo: dark ? halo : undefined });
      // key : fill readout
      const ro = seg(t, 1.6, 2.1);
      if (ro > 0.01) {
        c.save(); c.globalAlpha = ro;
        const ratio = (1 + st.fill) / st.fill, stops = Math.log2(ratio);
        readout(c, 'KEY : FILL', `${ratio.toFixed(0)} : 1`, 98, 124, { dark: true, vc: '#e0a458', halo });
        readout(c, 'IN STOPS', `${stops.toFixed(1)} STOPS`, 98, 148, { dark: true, halo });
        readout(c, 'KEY', 'HARD SPOT · 1/d² FALLOFF', 98, 172, { dark: true, halo });
        readout(c, 'FRAME IN BLACK', `${Math.round(cDark * 100)}%  (L < 5%)`, 98, 196, { dark: true, halo });
        C_FILL.slice(1).forEach(([ts]) => flash(c, t, ts, 290, 106, 130, 26, '#e0a458'));
        // a value scale: lit plane vs shadow, the gap that is the ratio
        const bx = 98, by = 224, bw = 320;
        for (let i = 0; i < 16; i++) { const v = Math.pow(i / 15, 2.2); c.fillStyle = rgbStr([v * 0.95, v * 0.88, v * 0.78]); c.fillRect(bx + i * bw / 16, by, bw / 16 + 0.5, 14); }
        const X = v => bx + clamp(Math.pow(v, 1 / 2.2)) * bw;
        const lit = LK.aces(1.15 * 1.75 * 0.6), shd = LK.aces(1.15 * st.fill * 0.6);
        c.fillStyle = '#e0a458';
        [[lit, 'LIT'], [shd, 'SHADOW']].forEach(([v, s]) => { c.beginPath(); c.moveTo(X(v), by + 16); c.lineTo(X(v) - 6, by + 26); c.lineTo(X(v) + 6, by + 26); c.fill(); label(c, s, X(v), by + 44, { size: 11, ls: 1, align: 'center', color: 'rgba(236,232,223,0.7)' }); });
        c.restore();
      }
      // notan inset
      const no = seg(t, 2.5, 3.0);
      if (no > 0.01 && cNotan) {
        c.save(); c.globalAlpha = no;
        const px = 1488, py = 56, pw = 360, ph = 203 + 62;
        panel(c, px, py, pw, ph, true);
        label(c, 'NOTAN  ·  TWO VALUES', px + 16, py + 28, { size: 13, ls: 2, weight: 700, color: PAPER });
        label(c, 'L > 13%', px + pw - 16, py + 28, { size: 13, ls: 2, color: 'rgba(236,232,223,0.6)', align: 'right' });
        c.imageSmoothingEnabled = false; c.drawImage(cNotan, px + 8, py + 40, pw - 16, (pw - 16) * 9 / 16);
        label(c, 'the design the light makes', px + 16, py + ph - 14, { size: 11, ls: 1, color: 'rgba(236,232,223,0.65)' });
        c.restore();
      }
      // the light zones of the ball
      const sc = LK.SPH.c, r = LK.SPH.r, Ls = norm(sub(st.lamp, sc)), toCam = norm(sub(S.cam.pos, sc));
      const nt = norm(sub(toCam, mul(Ls, dot(toCam, Ls))));
      const at = nn => add(sc, mul(norm(nn), r));
      const zo = (a) => seg(t, a, a + 0.45) * (1 - seg(t, 6.3, 6.7));
      const gold = '#e0a458';
      leader(c, S, at(add(Ls, toCam)), -110, -170, 'HIGHLIGHT', { dark: true, on: zo(3.0), dot: gold });
      leader(c, S, at(add(mul(Ls, 0.35), toCam)), 170, -230, 'HALF-TONE', { dark: true, on: zo(3.4), dot: gold, sub: 'light turning away' });
      leader(c, S, at(add(nt, mul(Ls, -0.08))), 230, -40, 'CORE SHADOW', { dark: true, on: zo(3.8), dot: gold, sub: 'the terminator, n·l = 0' });
      leader(c, S, at(add(add(mul(Ls, -0.55), toCam), [0, -0.75, 0])), 330, 40, 'REFLECTED LIGHT', { dark: true, on: zo(4.2), dot: gold, sub: 'bounce from the lit table' });
      const shadowP = sub(sc, mul(Ls, sc[1] / Ls[1] * 1.25));
      leader(c, S, shadowP, 230, 110, 'CAST SHADOW', { dark: true, on: zo(4.6), dot: gold, sub: 'hard edge: a small source' });
      // lamp · form · shadow: the two rays that graze the ball bound its cast shadow
      const tri = seg(t, 6.6, 7.2) * (1 - seg(t, 9.3, 9.7));
      if (tri > 0.01) {
        const lp = st.lamp, dv = sub(sc, lp), dist = V.len(dv), d0 = mul(dv, 1 / dist), be = Math.asin(r / dist);
        const e = norm(sub([0, 1, 0], mul(d0, d0[1]))), tl = Math.sqrt(dist * dist - r * r);
        const rays = [1, -1].map(sg => { const d = add(mul(d0, Math.cos(be)), mul(e, sg * Math.sin(be))); return [add(lp, mul(d, tl)), add(lp, mul(d, lp[1] / -d[1]))]; });
        const q0 = LK.project(S, lp), qs = rays.map(([a, b]) => [LK.project(S, a), LK.project(S, b)]);
        if (q0 && qs.every(([a, b]) => a && b)) {
          // the lamp sits above the frame; draw it part way down its rays, below the readouts
          const k = clamp((320 - q0[1]) / (qs[0][1][1] - q0[1]), 0, 0.95);
          const lx = lerp(q0[0], (qs[0][1][0] + qs[1][1][0]) / 2, k), ly = lerp(q0[1], (qs[0][1][1] + qs[1][1][1]) / 2, k);
          c.save(); c.globalAlpha = tri;
          c.fillStyle = 'rgba(224,164,88,0.12)';
          c.beginPath(); c.moveTo(lx, ly); c.lineTo(qs[0][1][0], qs[0][1][1]); c.lineTo(qs[1][1][0], qs[1][1][1]); c.closePath(); c.fill();
          c.setLineDash([7, 7]); c.lineWidth = 2; c.strokeStyle = gold;
          qs.forEach(([a, b]) => { c.beginPath(); c.moveTo(lx, ly); c.lineTo(b[0], b[1]); c.stroke(); });
          c.setLineDash([]);
          qs.forEach(([a]) => { c.fillStyle = gold; c.beginPath(); c.arc(a[0], a[1], 5, 0, TAU); c.fill(); });
          c.fillStyle = gold; c.beginPath(); c.arc(lx, ly, 9, 0, TAU); c.fill();
          for (let j = 0; j < 8; j++) { const a = j / 8 * TAU; c.fillRect(lx + Math.cos(a) * 15 - 1.5, ly + Math.sin(a) * 15 - 1.5, 3, 3); }
          const elev = Math.asin(norm(sub(lp, sc))[1]) * 180 / PI;
          label(c, 'KEY', lx + 26, ly + 6, { size: 15, ls: 2, weight: 700, color: PAPER, halo });
          label(c, `HIGH ${elev.toFixed(0)}°  ·  TO THE SIDE  ·  HARD`, lx + 26, ly + 28, { size: 13, ls: 2, color: 'rgba(236,232,223,0.7)', halo });
          const mx = Math.max(qs[0][1][0], qs[1][1][0]);
          const my = (qs[0][1][1] + qs[1][1][1]) / 2;
          label(c, 'LAMP · FORM · SHADOW', mx + 30, my - 4, { size: 15, ls: 2, weight: 700, color: PAPER, halo });
          label(c, 'rays that graze the ball bound its shadow', mx + 30, my + 18, { size: 13, ls: 1.5, color: 'rgba(236,232,223,0.7)', halo });
          c.restore();
        }
      }
      LK.caption(c, t, W, H, { name: 'Chiaroscuro', cat: 'Light', dark: sx > 0.3, curve: u => Math.log2((1 + cFill(u * 10)) / cFill(u * 10)) / 7, span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'KEY : FILL IN STOPS / TIME' });
    },
    score(A) {
      LK.bed(A, { g: 0.8 });
      // the lamp: a low switch-thud and a dark swell as the room goes black
      A.whoosh(C_WIPE[0], C_WIPE[1] - C_WIPE[0], { f1: 900, f2: 160, q: 0.9, g: 0.08, swell: 0.6, rev: 0.5, pan: -0.3 });
      A.kick(C_WIPE[1], 0.3, { f: 70, f2: 32, dur: 0.9 });
      A.chord(C_WIPE[1], [38, 45, 50, 53], { type: 'sawtooth', dur: 3.6, g: 0.022, a: 0.9, lp: 520, rev: 0.7, width: 0.7 });
      // each step down in fill: a low bowed note, a semitone darker
      C_FILL.slice(1).forEach(([ts], i) => {
        A.osc(ts, { type: 'sawtooth', f: midi([41, 40][i]), dur: 2.0, g: 0.05, a: 0.25, lp: 700, rev: 0.6 });
        A.osc(ts, { type: 'sine', f: midi([29, 28][i]), dur: 1.6, g: 0.09, a: 0.05, rev: 0.3 });
      });
      // light zones: soft low plucks
      [3.0, 3.4, 3.8, 4.2, 4.6].forEach((tt, i) => A.pluck(tt, midi([62, 65, 69, 67, 60][i]), { g: 0.08, bright: 0.2, dur: 1.4, lp: 1400, rev: 0.5 }));
      // the triangle
      A.bell(6.6, midi(74), { g: 0.05, dur: 2.0, rev: 0.7 });
      A.chord(7.0, [38, 45, 52, 57, 60], { type: 'triangle', dur: 3.0, g: 0.025, a: 0.6, lp: 1000, rev: 0.8, width: 0.9 });
    },
  });

  /* =====================================================================
     CAUSTICS — the still life at the bottom of a sunlit pool. The water
     surface is a seeded spectral height field: fourteen waves with
     integer wave numbers (so the field tiles), random directions and
     phases, amplitude falling with frequency, and deep-water dispersion
     ω = √(g k) so the pattern evolves instead of sliding. Each frame,
     a grid of photons is refracted by the surface slope (Snell, small-
     angle) and splatted where it lands: wherever the surface curves
     like a converging lens the photons pile up, and the density map is
     the caustic — bright lines meshed around dim cells. Two maps are
     made, for the floor's depth and the objects' height, and every
     surface looks its map up by projecting along the light direction,
     times N·L and the shadow. The glass sphere does its own gathering:
     photons through it are refracted in and out analytically and
     splatted on the floor, so its shadow holds a focused spot carrying
     the rippled light. The ripple amplitude steps up on the beat and
     the lines sharpen as their focus comes up to the floor.
     ===================================================================== */
  const CA_L = norm([-0.8, 1, 0.38]);   // toward the sun
  const CA = { N: 144, M: 288, tile: 2.7, yw: 4.6 };
  const CA_WAVES = (() => {
    const r = MG.rng(8113), out = [];
    while (out.length < 14) {
      const kx = Math.round(lerp(-7, 7, r())), ky = Math.round(lerp(-7, 7, r())), k = Math.hypot(kx, ky);
      if (k < 2 || k > 7.5) continue;
      out.push({ kx, ky, k, a: 1 / Math.pow(k, 1.6), ph: r() * TAU, w: Math.sqrt(k) * 1.15 });
    }
    const s = out.reduce((m, o) => m + o.a, 0); out.forEach(o => { o.a /= s; });
    return out;
  })();
  const CA_K = 3.2;
  const CA_CURV = CA_WAVES.reduce((m, o) => m + o.a * (TAU * o.k) ** 2, 0);
  const CA_STEPS = [[0, 0.4], [3.4, 0.75], [4.85, 1.05], [6.3, 1.4]];
  function caAmp(t) {
    let f = CA_STEPS[0][1];
    for (let i = 1; i < CA_STEPS.length; i++) { const [ts, v] = CA_STEPS[i]; if (t >= ts) f = lerp(CA_STEPS[i - 1][1], v, E.outC(seg(t, ts, ts + 0.55))); }
    return f;
  }
  const caDepth = y => (CA.yw - y) / CA_L[1];   // path length from the water surface down to height y
  const CA_D0 = caDepth(0), CA_D1 = caDepth(1.9);
  let caF = null;   // the current frame's maps
  function caFrame(t) {
    if (caF && caF.t === t) return caF;
    const { N, M } = CA, amp = caAmp(t), hgt = new Float32Array(N * N);
    const gx = new Float32Array(M * M), gy = new Float32Array(M * M);
    // height (for the inset) on the N grid, slope on the photon grid
    for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) {
      const u = (i + 0.5) / M, v = (j + 0.5) / M;
      let sx = 0, sy = 0, hh = 0;
      for (const o of CA_WAVES) {
        const a = TAU * (o.kx * u + o.ky * v) + o.ph - o.w * t, cs = Math.cos(a);
        sx += o.a * TAU * o.kx * cs; sy += o.a * TAU * o.ky * cs;
        if ((i & 1) === 0 && (j & 1) === 0) hh += o.a * Math.sin(a);
      }
      gx[j * M + i] = sx; gy[j * M + i] = sy;
      if ((i & 1) === 0 && (j & 1) === 0) hgt[(j >> 1) * N + (i >> 1)] = hh;
    }
    const maps = [CA_D0, CA_D1].map(D => {
      // displacement in tile units: depth × (1 − 1/η) × slope, scaled so amp 1 brings the focus near the floor
      const k = amp * CA_K / CA_CURV * (D / CA_D0), acc = new Float32Array(N * N), wgt = (N * N) / (M * M);
      for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) {
        const x = ((i + 0.5) / M + k * gx[j * M + i]) * N - 0.5, y = ((j + 0.5) / M + k * gy[j * M + i]) * N - 0.5;
        const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
        const X0 = ((x0 % N) + N) % N, Y0 = ((y0 % N) + N) % N, X1 = (X0 + 1) % N, Y1 = (Y0 + 1) % N;
        acc[Y0 * N + X0] += (1 - fx) * (1 - fy) * wgt; acc[Y0 * N + X1] += fx * (1 - fy) * wgt;
        acc[Y1 * N + X0] += (1 - fx) * fy * wgt; acc[Y1 * N + X1] += fx * fy * wgt;
      }
      // one [1 2 1] blur, periodic
      const tmp = new Float32Array(N * N), out = new Float32Array(N * N);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) tmp[y * N + x] = (acc[y * N + (x + N - 1) % N] + 2 * acc[y * N + x] + acc[y * N + (x + 1) % N]) / 4;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) out[y * N + x] = (tmp[((y + N - 1) % N) * N + x] + 2 * tmp[y * N + x] + tmp[((y + 1) % N) * N + x]) / 4;
      return out;
    });
    let peak = 0; for (let i = 0; i < N * N; i++) peak = Math.max(peak, maps[0][i]);
    caF = { t, amp, hgt, maps, peak, spot: caSphere(maps[1]) };
    return caF;
  }
  function caLook(map, p) {   // bilinear periodic lookup at the point where the light ray through p left the surface
    const s = (CA.yw - p[1]) / CA_L[1], qx = p[0] + CA_L[0] * s, qz = p[2] + CA_L[2] * s, N = CA.N;
    const x = qx / CA.tile * N - 0.5, y = qz / CA.tile * N - 0.5, x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const X0 = ((x0 % N) + N) % N, Y0 = ((y0 % N) + N) % N, X1 = (X0 + 1) % N, Y1 = (Y0 + 1) % N;
    return (map[Y0 * N + X0] * (1 - fx) + map[Y0 * N + X1] * fx) * (1 - fy) + (map[Y1 * N + X0] * (1 - fx) + map[Y1 * N + X1] * fx) * fy;
  }
  function caI(F, p) {
    const w = clamp(p[1] / 1.9);
    return lerp(caLook(F.maps[0], p), caLook(F.maps[1], p), w);
  }
  /* Photons through the glass sphere (IOR 1.5): a grid over its disc as seen from the sun, each
     carrying the rippled light at its entry point, refracted in and out and splatted on the floor. */
  const SP = { n: 110, size: 2.6, G: 230, ior: 1.5 };
  const SP_C = (() => { const c = LK.SPH.c; return [c[0] - CA_L[0] * c[1] / CA_L[1], 0, c[2] - CA_L[2] * c[1] / CA_L[1]]; })();
  function caSphere(objMap) {
    const { n, size, G, ior } = SP, c = LK.SPH.c, r = LK.SPH.r, acc = new Float32Array(n * n);
    const e1 = norm(V.cross(CA_L, [0, 0, 1])), e2 = V.cross(CA_L, e1), dIn = mul(CA_L, -1);
    const sp = 2 * r / G, binA = (size / n) ** 2, fl = sp * sp / binA;
    const F0 = 0.04, fres = cs => F0 + (1 - F0) * Math.pow(1 - cs, 5);
    let best = 0, bx = 0, by = 0;
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      const u = (i + 0.5) * sp - r, v = (j + 0.5) * sp - r, q = u * u + v * v;
      if (q >= r * r) continue;
      const pe = add(add(c, add(mul(e1, u), mul(e2, v))), mul(CA_L, Math.sqrt(r * r - q)));
      const n1 = mul(sub(pe, c), 1 / r), d1 = V.refract(dIn, n1, 1 / ior); if (!d1) continue;
      const tch = -2 * dot(sub(pe, c), d1), px = add(pe, mul(d1, tch)), n2 = mul(sub(px, c), 1 / r);
      const d2 = V.refract(d1, mul(n2, -1), ior); if (!d2 || d2[1] >= -1e-3) continue;
      const tf = -px[1] / d2[1], pf = add(px, mul(d2, tf));
      const T = (1 - fres(dot(n1, CA_L))) * (1 - fres(dot(n2, d2)));
      const I = caLook(objMap, pe) * T * fl;
      const x = (pf[0] - SP_C[0]) / size * n + n / 2 - 0.5, y = (pf[2] - SP_C[2]) / size * n + n / 2 - 0.5;
      const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
      if (x0 < 0 || y0 < 0 || x0 >= n - 1 || y0 >= n - 1) continue;
      acc[y0 * n + x0] += (1 - fx) * (1 - fy) * I; acc[y0 * n + x0 + 1] += fx * (1 - fy) * I;
      acc[(y0 + 1) * n + x0] += (1 - fx) * fy * I; acc[(y0 + 1) * n + x0 + 1] += fx * fy * I;
    }
    let src = acc, out = null;
    for (let pass = 0; pass < 5; pass++) {
      out = new Float32Array(n * n);
      for (let y = 1; y < n - 1; y++) for (let x = 1; x < n - 1; x++) {
        const i = y * n + x;
        out[i] = (4 * src[i] + 2 * (src[i - 1] + src[i + 1] + src[i - n] + src[i + n]) + src[i - n - 1] + src[i - n + 1] + src[i + n - 1] + src[i + n + 1]) / 16;
      }
      src = out;
    }
    for (let i = 0; i < n * n; i++) if (out[i] > best) { best = out[i]; bx = i % n; by = (i / n) | 0; }
    return { map: out, peak: best, at: [SP_C[0] + ((bx + 0.5) / n - 0.5) * size, 0, SP_C[2] + ((by + 0.5) / n - 0.5) * size] };
  }
  function caSpotAt(F, p) {
    const n = SP.n, x = (p[0] - SP_C[0]) / SP.size * n + n / 2 - 0.5, y = (p[2] - SP_C[2]) / SP.size * n + n / 2 - 0.5;
    const x0 = Math.floor(x), y0 = Math.floor(y); if (x0 < 0 || y0 < 0 || x0 >= n - 1 || y0 >= n - 1) return 0;
    const fx = x - x0, fy = y - y0, m = F.spot.map;
    return (m[y0 * n + x0] * (1 - fx) + m[y0 * n + x0 + 1] * fx) * (1 - fy) + (m[(y0 + 1) * n + x0] * (1 - fx) + m[(y0 + 1) * n + x0 + 1] * fx) * fy;
  }
  // shadow toward the sun from the Token and cube only (the glass sphere is handled by its photons)
  function caShadow(p, S) {
    const l = CA_L; let res = 1;
    for (const [sd, c, r] of [[q => LK.sdToken(q, S), S.tok.c, LK.TOK.bound], [q => LK.sdCube(q, S), LK.CUBE.c, LK.CUBE.bound]]) {
      const oc = sub(c, p), along = dot(oc, l);
      if (along < -r) continue;
      if (V.len(sub(oc, mul(l, along))) - r > r * 0.6) continue;
      let tt = Math.max(0.02, along - r - 0.05);
      const tEnd = along + r;
      for (let i = 0; i < 40 && tt < tEnd; i++) {
        const h = sd(add(p, mul(l, tt)));
        res = Math.min(res, 22 * h / tt);
        if (res < 0.002) return 0;
        tt += clamp(h, 0.02, 0.4);
      }
    }
    return clamp(res);
  }
  const caBlocked = p => { const oc = sub(p, LK.SPH.c), b = dot(oc, CA_L); if (b >= 0) return 0; const miss = Math.sqrt(Math.max(0, dot(oc, oc) - b * b)) - LK.SPH.r; return 1 - sstep(-0.012, 0.012, miss); };
  const CA_SUN = [1.0, 0.97, 0.88], CA_AMB = [0.2, 0.33, 0.36], CA_FLOOR = [0.78, 0.86, 0.85];
  const CA_DEEP = [0.03, 0.2, 0.27], CA_UP = [0.3, 0.62, 0.68];
  const caWater = d => mix3(CA_DEEP, CA_UP, sstep(-0.15, 0.6, d[1]));
  function caSurf(F, p, n, id, d, depth, S, occ) {
    const a = id === 0 ? CA_FLOOR : LK.albedo(id), ndl = dot(n, CA_L);
    let dir = 0;
    if (ndl > 0) {
      const vis = (id === 0 ? 1 - caBlocked(p) : 1) * caShadow(add(p, mul(n, 0.01)), S);
      if (vis > 0) dir = ndl * vis * caI(F, p);
    }
    const spot = id === 0 ? caSpotAt(F, p) : 0;
    const sky = (0.55 + 0.45 * n[1]) * occ, out = [0, 0, 0];
    for (let k = 0; k < 3; k++) out[k] = a[k] * (CA_SUN[k] * (dir + spot) * 1.35 + CA_AMB[k] * sky * 1.3);
    // water absorbs with distance: reds first
    const tr = [Math.exp(-depth * 0.026), Math.exp(-depth * 0.016), Math.exp(-depth * 0.013)];
    const fog = caWater([d[0], 0.05, d[2]]);
    const c = LK.tone(out, 1.15).map((v, k) => v * tr[k] + fog[k] * (1 - tr[k]));
    if (id !== 0) return c;
    return LK.floorFade(c, { depth, d }, fog);
  }
  function caShade(g, S, F) {
    if (!g.hit) return caWater(g.d);
    if (g.id !== 2) return caSurf(F, g.p, g.n, g.id, g.d, g.depth, S, LK.ao(g.p, g.n, S, 4));
    // glass sphere: Fresnel reflection of the water + one refraction through it
    const n = g.n, cs = clamp(-dot(n, g.d)), Fr = 0.04 + 0.96 * Math.pow(1 - cs, 5);
    const rd = V.reflect(g.d, n), refl = caWater(rd);
    let tr = caWater(g.d);
    const d1 = V.refract(g.d, n, 1 / 1.5);
    if (d1) {
      const ex = LK.traceInside(2, g.p, d1, S), d2 = V.refract(d1, mul(ex.n, -1), 1.5);
      if (d2) {
        const h = LK.trace(add(ex.p, mul(d2, 0.003)), d2, S, { skip: 2 });
        tr = h.hit ? caSurf(F, h.p, LK.normal(h.p, h.id, S), h.id, d2, g.depth + ex.t + h.t, S, 1) : caWater(d2);
      }
    }
    const glint = Math.pow(Math.max(0, dot(rd, CA_L)), 260) * 3.0 * caI(F, g.p);
    const tint = [0.86, 0.97, 0.96];
    return [tr[0] * tint[0] * (1 - Fr) + refl[0] * Fr + glint, tr[1] * tint[1] * (1 - Fr) + refl[1] * Fr + glint, tr[2] * tint[2] * (1 - Fr) + refl[2] * Fr + glint];
  }
  const CA_WIPE = [0.3, 2.0];

  MG.film({
    id: 'lookcaustics', dur: 10, poster: 8.0,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Caustics', sub: 'Light gathered into lines by a curved surface', era: '1990s —',
      origin: 'A caustic is the envelope of light rays focused by a curved reflecting or refracting surface; the term was introduced by Ehrenfried Walther von Tschirnhaus in the 1680s, and the bright net on a pool floor is the everyday example. Ordinary ray tracing cannot find caustics, because a diffuse surface does not know which direction a focused light reaches it from. James Arvo’s backward ray tracing (1986) first traced light from the source and stored it on surfaces, and Henrik Wann Jensen’s photon mapping (1996) made it practical. Real-time water renders approximate the same idea with a caustic texture computed from the water’s height field and projected along the light.',
      works: 'Finding Nemo (Pixar, 2003; animated caustics on the reef and the fish) · Henrik Wann Jensen, photon-mapped caustic renders (1996 onwards) · Crysis (Crytek, 2007; projected water caustics in real time)',
      tech: ['Height field → photon density map', 'Projection along the light, masked by shadow', 'Photons through a glass ball lens'],
      accent: '#7fe3e0',
      motionDNA: 'The shared 50° camera orbit, under a living net of light: the height field evolves with deep-water dispersion, so the caustic cells form, stretch, merge and split without sliding. A wipe opens the pool from the plain studio; then the ripple amplitude steps up on the beat, 0.40 → 0.75 → 1.05 → 1.40, and the soft dappling sharpens into thin bright lines as the focus of the curved surface comes up to the floor.',
      visualDNA: 'An aqua pool: a pale sand-blue floor fading into blue-green water, red light absorbed first with distance, the orange Token and blue cube netted with bright white-cyan caustic lines on every face that sees the sun, hard-edged dark shadows where the lines stop, a clear glass sphere with a focused, rippling spot in its shadow. Insets: the height field, the caustic photon map, and a cross-section of parallel rays bending at the surface and gathering into peaks.',
      transitions: 'Wipe from the plain reference into the pool; ripple amplitude steps up on the beat',
      implementation: ['Photon mapping (Jensen) for caustics in offline renderers: V-Ray, RenderMan, Arnold', 'Real-time water: caustic texture from the water height field, projected along the light and masked by the shadow map (Unity, Unreal)', 'Canvas 2D + SDF tracer (js/look-kit.js): 14-wave seeded spectral height field, 288² photons per depth splatted into 144² periodic maps, light-direction projection × N·L × soft shadow, 53k analytic photons through the IOR 1.5 sphere, one refraction pass for the glass'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const F = caFrame(t), sx = E.ioC(seg(t, CA_WIPE[0], CA_WIPE[1])) * 1.04 - 0.02;
      const { S } = LK.render(c, t, W, H, (g, S) => (g.u < sx ? caShade(g, S, F) : LK.plain(g, S)));
      if (t < CA_WIPE[1] + 0.1) splitBar(c, sx * W, H, 'CAUSTICS', 'PLAIN REFERENCE', { y: 300, col: '#7fe3e0' });
      const halo = 'rgba(6,30,38,0.55)', dk = sx > 0.25;
      tag(c, 'CAUSTICS  ·  LIGHT GATHERED BY A CURVED SURFACE', 72, 80, { dark: dk, accent: '#7fe3e0', halo: dk ? halo : undefined });
      const ro = seg(t, 1.7, 2.2);
      if (ro > 0.01) {
        c.save(); c.globalAlpha = ro;
        readout(c, 'RIPPLE AMPLITUDE', F.amp.toFixed(2), 98, 124, { dark: true, vc: '#7fe3e0', halo });
        readout(c, 'PEAK IRRADIANCE', `×${F.peak.toFixed(1)} SUN`, 98, 148, { dark: true, halo });
        readout(c, 'PHOTONS / FRAME', `${CA.M}² × 2 DEPTHS + 53K GLASS`, 98, 172, { dark: true, halo });
        readout(c, 'GLASS SPOT', `×${F.spot.peak.toFixed(1)} SUN`, 98, 196, { dark: true, halo });
        CA_STEPS.slice(1).forEach(([ts]) => flash(c, t, ts, 290, 106, 100, 26, '#7fe3e0'));
        c.restore();
      }
      // height field + caustic map insets, top right
      const io = seg(t, 2.3, 2.8);
      if (io > 0.01) {
        const N = CA.N, kh = cvs('cah', N, N), km = cvs('cam', N, N), dh = kh.img.data, dm = km.img.data;
        let hm = 0; for (let i = 0; i < N * N; i++) hm = Math.max(hm, Math.abs(F.hgt[i]));
        for (let i = 0; i < N * N; i++) {
          const v = 0.5 + 0.5 * F.hgt[i] / (hm || 1), q = clamp(F.maps[0][i] / 3.2);
          dh[i * 4] = 20 + v * 150; dh[i * 4 + 1] = 60 + v * 170; dh[i * 4 + 2] = 80 + v * 160; dh[i * 4 + 3] = 255;
          dm[i * 4] = 8 + q * 247; dm[i * 4 + 1] = 30 + q * 225; dm[i * 4 + 2] = 40 + q * 215; dm[i * 4 + 3] = 255;
        }
        c.save(); c.globalAlpha = io;
        const px = 1300, py = 56, pw = 548, ph = 290;
        panel(c, px, py, pw, ph, true);
        label(c, 'HEIGHT FIELD  h(x, z)', px + 16, py + 28, { size: 13, ls: 2, weight: 700, color: PAPER });
        label(c, 'PHOTON DENSITY = CAUSTIC', px + 282, py + 28, { size: 13, ls: 2, weight: 700, color: PAPER });
        c.imageSmoothingEnabled = true;
        c.drawImage(blit(kh), px + 16, py + 42, 250, 200); c.drawImage(blit(km), px + 282, py + 42, 250, 200);
        label(c, '→', px + 274, py + 150, { size: 20, ls: 0, color: '#7fe3e0', align: 'center', weight: 700 });
        label(c, '14 SEEDED WAVES · TILES', px + 16, py + 266, { size: 11, ls: 1, color: 'rgba(236,232,223,0.65)' });
        label(c, 'REFRACT 288² PHOTONS, COUNT', px + 282, py + 266, { size: 11, ls: 1, color: 'rgba(236,232,223,0.65)' });
        c.restore();
      }
      // cross-section: parallel light bending at the surface and gathering into lines
      const xo = seg(t, 2.9, 3.4) * (1 - seg(t, 9.4, 9.8));
      if (xo > 0.01) {
        const px = 72, py = 222, pw = 540, ph = 214, ax = px + 24, aw = pw - 48, sy = py + 70, fy = py + 146;
        c.save(); c.globalAlpha = xo;
        panel(c, px, py, pw, ph, true);
        label(c, 'LIGHT GATHERED INTO LINES  ·  CROSS-SECTION', px + 16, py + 28, { size: 13, ls: 2, weight: 700, color: PAPER });
        const n = 70, k = F.amp * CA_K / CA_CURV, hv = 0.37, span = 0.5;   // half a tile along x at a fixed z
        const hAt = u => { let s = 0, d = 0; for (const o of CA_WAVES) { const a = TAU * (o.kx * u + o.ky * hv) + o.ph - o.w * t; s += o.a * Math.sin(a); d += o.a * TAU * o.kx * Math.cos(a); } return [s, d]; };
        c.strokeStyle = '#7fe3e0'; c.lineWidth = 2; c.beginPath();
        for (let i = 0; i <= 120; i++) { const u = i / 120 * span, x = ax + i / 120 * aw, y = sy - hAt(u)[0] * 40 * F.amp; i ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.stroke();
        const bins = new Float32Array(64);
        c.lineWidth = 1;
        for (let i = 0; i < 400; i++) {
          const u = (i + 0.5) / 400 * span, [hh, dd] = hAt(u), xl = (u + k * dd) / span;
          const b = Math.floor(xl * 64); if (b >= 0 && b < 64) bins[b]++;
          if (i % 6 !== 3) continue;
          const x0 = ax + (u / span) * aw, ys = sy - hh * 40 * F.amp, x1 = ax + xl * aw;
          c.strokeStyle = 'rgba(255,250,225,0.35)';
          c.beginPath(); c.moveTo(x0, py + 40); c.lineTo(x0, ys); c.lineTo(x1, fy); c.stroke();
        }
        c.fillStyle = 'rgba(236,232,223,0.35)'; c.fillRect(ax, fy, aw, 2);
        const mean = 400 / 64;
        c.fillStyle = '#7fe3e0';
        for (let b = 0; b < 64; b++) { const v = Math.min(bins[b] / mean, 5); c.fillRect(ax + b / 64 * aw + 0.5, fy + 4, aw / 64 - 1, v * 6); }
        label(c, 'WATER SURFACE', ax + aw, sy - 22, { size: 11, ls: 1, color: 'rgba(236,232,223,0.7)', align: 'right' });
        label(c, 'FLOOR  ·  PHOTONS PER BIN', ax, fy + 56, { size: 11, ls: 1, color: 'rgba(236,232,223,0.7)' });
        label(c, 'convex crests act as lenses', ax + aw, fy + 56, { size: 11, ls: 1, color: '#7fe3e0', align: 'right' });
        c.restore();
      }
      // leaders
      const lo = (a) => seg(t, a, a + 0.5) * (1 - seg(t, 9.0, 9.4));
      leader(c, S, add(F.spot.at, [0.22, 0, 0.16]), 150, 90, 'BALL LENS  ·  FOCUSED SPOT', { on: lo(3.9), dot: '#1aa6a2', sub: 'photons traced through the glass' });
      leader(c, S, tokPoint(S, [0.5, -0.6, 0.22]), 170, 150, 'CAUSTIC ON THE TOKEN', { on: lo(4.6), dot: '#1aa6a2', sub: 'map projected along the light' });
      const tsh = sub(S.tok.c, mul(CA_L, S.tok.c[1] / CA_L[1]));
      leader(c, S, [tsh[0] + 0.2, 0, tsh[2] + 0.1], 60, 150, 'SHADOW MASKS THE LINES', { on: lo(5.3), dot: '#1aa6a2', sub: 'N·L × shadow × caustic' });
      LK.caption(c, t, W, H, { name: 'Caustics', cat: 'Light', dark: sx > 0.3, curve: u => caAmp(u * 10) / 1.4, span: [0, 10], lo: -0.1, hi: 1.15, curveLabel: 'RIPPLE AMPLITUDE / TIME' });
    },
    score(A) {
      LK.bed(A, { g: 0.85 });
      // into the water: a filtered wash
      A.noise(CA_WIPE[0], { type: 'lowpass', f: 700, f2: 300, dur: 2.4, g: 0.07, swell: 0.6, rev: 0.6 });
      A.chord(CA_WIPE[1], [57, 64, 69, 73, 76], { type: 'sine', dur: 4, g: 0.022, a: 0.8, rev: 0.85, width: 0.9 });
      // shimmer: little high glints that thicken with the ripples
      for (let k = 0; k < 38; k++) {
        const tt = 2.0 + k * 0.21 + hash(k * 3.1) * 0.1, amp = 0.4 + clamp((tt - 3.4) / 3) * 1;
        A.osc(tt, { type: 'sine', f: midi(81 + [0, 4, 7, 11, 14, 16][k % 6]), dur: 0.35, g: 0.008 + 0.01 * amp, a: 0.005, rev: 0.8, pan: hash(k * 9.7) * 1.4 - 0.7 });
      }
      // amplitude steps: a water-drop pluck, higher each time
      CA_STEPS.slice(1).forEach(([ts], i) => {
        A.osc(ts, { type: 'sine', f: midi(72 + i * 5), f2: midi(84 + i * 5), dur: 0.12, g: 0.09 });
        A.pluck(ts + 0.05, midi([64, 69, 73][i]), { g: 0.1, bright: 0.5, dur: 1.4, rev: 0.6 });
      });
      A.bell(3.9, midi(88), { g: 0.04, dur: 2.0, rev: 0.7 });
      A.chord(7.5, [52, 59, 64, 68, 71], { type: 'sine', dur: 2.5, g: 0.022, a: 0.6, rev: 0.85, width: 0.9 });
    },
  });

  /* =====================================================================
     CROSS-HATCHING — pen and ink from the G-buffer. Tone is the plain
     light (N·L with a cast shadow, sky fill weighted by AO) times the
     object's value. Darkness is mapped to layers of parallel lines: past
     the first threshold one set of strokes, past the second a crossing
     set, past the third a third direction; within each layer the stroke
     widens with darkness, so tone is continuous although every mark is
     solid ink. Strokes wobble and break like a pen's. First the lines
     are fixed to the screen (cheap, and they swim over the moving
     objects — the "shower door"); then a second wipe pins them to the
     objects: each surface is projected onto the plane of its dominant
     local axis and the hatch runs in those coordinates, with line width
     held constant in pixels. Ink outlines come from id, depth-plane and
     normal discontinuities; the paper is a fixed seeded fibre texture.
     At the end a watercolour wash slips under the ink.
     ===================================================================== */
  const H_RES = [1152, 648];
  const H_TH = [0.24, 0.5, 0.74];
  const H_ANG = [0.95, -0.6, 0.14];
  const H_SP = [9, 9, 8];          // screen spacing in full-frame px
  const H_WSP = [0.042, 0.042, 0.037];   // object-space spacing in world units
  const H_INK = [0.1, 0.09, 0.11], H_PAPER = [0.965, 0.948, 0.905];
  const H_WIPE = [0.3, 1.9], H_OBJ = [4.8, 6.0], H_WASH = [7.2, 8.4];
  const H_FP = 2 * Math.tan(19 * PI / 180) / 1080;   // world size of one full-frame px per unit depth
  const H_ALB = [0.97, 0.84, 0.96, 0.74];
  /* LK.ao, bit for bit, but an object is only evaluated when its bounding sphere comes within
     the current minimum: both SDFs are never less than the distance to their bounding sphere, so
     a skipped object could not have lowered the min. Most of the frame is open floor, where this
     leaves just the plane and the sphere. */
  const TB = LK.TOK.bound, CB = LK.CUBE.bound, CC3 = LK.CUBE.c, SC = LK.SPH.c, SR = LK.SPH.r;
  function hAO(p, n, S, steps, spread) {
    const tc = S.tok.c;
    let occ = 0, sc = 1;
    for (let i = 1; i <= steps; i++) {
      const h = 0.02 + spread * i / steps, q = [p[0] + n[0] * h, p[1] + n[1] * h, p[2] + n[2] * h];
      let d = q[1];
      const ds = Math.hypot(q[0] - SC[0], q[1] - SC[1], q[2] - SC[2]) - SR;
      if (Math.hypot(q[0] - tc[0], q[1] - tc[1], q[2] - tc[2]) - TB < d) d = Math.min(d, LK.sdToken(q, S));
      if (Math.hypot(q[0] - CC3[0], q[1] - CC3[1], q[2] - CC3[2]) - CB < d) d = Math.min(d, LK.sdCube(q, S));
      d = Math.min(d, ds);
      occ += (h - d) * sc;
      sc *= 0.7;
    }
    return clamp(1 - 2.2 * occ);
  }
  /* Shadow and AO are the cost of a frame here, and both are smooth almost everywhere, so they are
     first taken on every third pixel of the G-buffer in x and y (hGrid), and a pixel between those
     samples interpolates them when its (up to) four surrounding samples are on the same object
     and agree to within 0.05 in both. Anywhere else — shadow edges, creases, silhouettes, edge-AA
     sub-samples — it is computed exactly. The frame differs from computing every pixel exactly
     by a few 8-bit levels at most, except where a stroke's dash flips on a threshold. Two sets of
     parameters: the ink tone, and the plain reference (LK.plain's) right of the first wipe. */
  const HS = 3;   // grid stride in pixels
  const HM = { ink: { k: 18, steps: 3, spread: 0.2, fade: true }, plain: { k: 12, steps: 5, spread: 0.22, fade: false } };
  const hSh = (p, n, S, m) => LK.shadow(add(p, mul(n, 0.01)), LK.KEY, S, m.k);
  let HG = null;   // { ink, plain } grids for the frame being rendered
  function hGrid(G, x0, x1, m) {
    const { w, h, S } = G, gw = Math.ceil(w / HS), gh = Math.ceil(h / HS), sh = new Float32Array(gw * gh).fill(-1), ao = new Float32Array(gw * gh).fill(-1), gid = new Uint8Array(gw * gh);
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
      const x = gx * HS, y = gy * HS, i = y * w + x, id = G.id[i], k = gy * gw + gx;
      gid[k] = id;
      if (x < x0 - HS || x > x1 + HS || id === 255 || (m.fade && id === 0 && G.depth[i] >= 18)) continue;
      const p = [G.P3[i * 3], G.P3[i * 3 + 1], G.P3[i * 3 + 2]], n = [G.N3[i * 3], G.N3[i * 3 + 1], G.N3[i * 3 + 2]];
      if (dot(n, LK.KEY) > 0) sh[k] = hSh(p, n, S, m);
      ao[k] = hAO(p, n, S, m.steps, m.spread);
    }
    return { G, gw, gh, sh, ao, gid };
  }
  /* Shadow and AO for a primary pixel from grid H, or null where they must be computed exactly.
     lit: the pixel faces the key (otherwise its shadow is 0 and only AO is looked up). */
  function hFromGrid(H, g, lit) {
    if (!H || g.i < 0) return null;
    const G = H.G, i = g.i, w = G.w;
    if (G.P3[i * 3] !== g.p[0] || G.P3[i * 3 + 1] !== g.p[1] || G.P3[i * 3 + 2] !== g.p[2]) return null;   // an AA sub-sample
    const x = i % w, y = (i / w) | 0, gx0 = (x / HS) | 0, gy0 = (y / HS) | 0, rx = x - gx0 * HS, ry = y - gy0 * HS;
    const gx1 = rx ? Math.min(gx0 + 1, H.gw - 1) : gx0, gy1 = ry ? Math.min(gy0 + 1, H.gh - 1) : gy0;
    const k0 = gy0 * H.gw + gx0, k1 = gy0 * H.gw + gx1, k2 = gy1 * H.gw + gx0, k3 = gy1 * H.gw + gx1, Sh = H.sh, A = H.ao, I = H.gid, id = g.id;
    if (I[k0] !== id || I[k1] !== id || I[k2] !== id || I[k3] !== id) return null;
    const s0 = Sh[k0], s1 = Sh[k1], s2 = Sh[k2], s3 = Sh[k3];
    if (lit && (Math.min(s0, s1, s2, s3) < 0 || Math.max(s0, s1, s2, s3) - Math.min(s0, s1, s2, s3) > 0.05)) return null;
    const a0 = A[k0], a1 = A[k1], a2 = A[k2], a3 = A[k3];
    if (Math.min(a0, a1, a2, a3) < 0 || Math.max(a0, a1, a2, a3) - Math.min(a0, a1, a2, a3) > 0.05) return null;
    const fx = gx1 !== gx0 ? rx / HS : 0, fy = gy1 !== gy0 ? ry / HS : 0;
    return [lit ? lerp(lerp(s0, s1, fx), lerp(s2, s3, fx), fy) : 0, lerp(lerp(a0, a1, fx), lerp(a2, a3, fx), fy)];
  }
  // tone: 0 black .. 1 paper. grid: allow the frame's shadow / AO samples (primary pixels of the main render)
  function hTone(g, S, grid = false) {
    if (g.id === 0 && g.depth >= 18) return 1;   // the floor has faded out to bare paper (exactly 1 below)
    const n = g.n, ndl = dot(n, LK.KEY), m = HM.ink, q = grid ? hFromGrid(HG && HG.ink, g, ndl > 0) : null;
    const sh = ndl > 0 ? (q ? q[0] : hSh(g.p, n, S, m)) : 0;
    const occ = q ? q[1] : hAO(g.p, n, S, m.steps, m.spread);
    const lv = 0.85 * Math.max(0, ndl) * sh + 0.38 * (0.45 + 0.55 * n[1]) * occ;
    let v = clamp(lv * H_ALB[g.id] * 1.12);
    if (g.id === 0) v = lerp(v, 1, sstep(7, 18, g.depth));   // the floor fades out to bare paper
    return v;
  }
  // LK.plain, with its shadow and AO taken from the frame's plain grid where they agree
  function hPlain(g, S) {
    if (!g.hit) return LK.BG;
    const a = LK.albedo(g.id), n = g.n, ndl = dot(n, LK.KEY), m = HM.plain, q = hFromGrid(HG && HG.plain, g, ndl > 0);
    const dif = ndl > 0 ? ndl * (q ? q[0] : hSh(g.p, n, S, m)) : 0;
    const occ = q ? q[1] : hAO(g.p, n, S, m.steps, m.spread), sky = 0.55 + 0.45 * n[1], fill = Math.max(0, dot(n, LK.FILL)) * 0.35;
    const k = 1.05 * dif + (0.42 * sky + fill) * occ;
    const c = LK.tone([a[0] * k, a[1] * k, a[2] * k], 1.3);
    return g.id === 0 ? LK.floorFade(c, g) : c;
  }
  // one hatch layer's ink coverage; s = across-line coordinate in spacings, w = along-line, px = full px per spacing unit
  function hLine(s, w, spPx, dk, th, pxW, li) {
    const k = clamp((dk - th) / 0.24); if (k <= 0) return 0;
    const wob = 0.09 * MG.vnoise(w * 0.035 + li * 11.3, 3) + 0.05 * MG.vnoise(w * 0.11, 7 + li);
    const ss = s + wob, idx = Math.floor(ss), f = Math.abs(ss - idx - 0.5) * spPx;
    // broken strokes: each line is cut into dashes of random length, a few left out
    const segL = 120 + 90 * hash(idx * 1.37 + li * 5.1), sg = Math.floor((w + hash(idx * 7.1 + li) * 400) / segL);
    if (hash(idx * 3.17 + sg * 1.91 + li * 0.7) < 0.12 * (1 - k)) return 0;
    const hw = 0.5 + 1.0 * k;
    return clamp((hw - f) / pxW + 0.5);
  }
  function hInk(dk, X, Y, pxW) {   // screen-space hatching at full-frame px X, Y
    let ink = 0;
    for (let l = 0; l < 3; l++) {
      if (dk <= H_TH[l]) break;
      const ca = Math.cos(H_ANG[l]), sa = Math.sin(H_ANG[l]);
      const s = (X * ca + Y * sa) / H_SP[l], w = -X * sa + Y * ca;
      ink = Math.max(ink, hLine(s, w, H_SP[l], dk, H_TH[l], pxW, l));
    }
    return ink;
  }
  function hObjInk(dk, g, S, pxW) {   // object-space hatching
    let q, nn;
    if (g.id === 1) { q = toLocal(S.tok.M, sub(g.p, S.tok.c)); nn = toLocal(S.tok.M, g.n); }
    else if (g.id === 3) { q = toLocal(S.cubeM, sub(g.p, LK.CUBE.c)); nn = toLocal(S.cubeM, g.n); }
    else { q = g.p; nn = g.n; }
    let a, b;
    if (g.id === 2) {   // the sphere: strokes run along its meridians and parallels, wrapping the form
      const R = LK.SPH.r, nr = g.n; a = R * Math.atan2(nr[0], nr[2]); b = R * Math.asin(clamp(nr[1], -1, 1));
    } else {
      const ax = Math.abs(nn[0]), ay = Math.abs(nn[1]), az = Math.abs(nn[2]);
      [a, b] = ax >= ay && ax >= az ? [q[2], q[1]] : ay >= az ? [q[0], q[2]] : [q[0], q[1]];
    }
    const fp = Math.max(1e-4, g.depth * H_FP / Math.max(0.3, Math.abs(dot(g.n, g.d))));   // world units per full px
    let ink = 0;
    for (let l = 0; l < 3; l++) {
      if (dk <= H_TH[l]) break;
      const ca = Math.cos(H_ANG[l]), sa = Math.sin(H_ANG[l]);
      const sp = H_WSP[l] * (g.id === 0 ? 2.1 : 1);   // the floor is seen at a grazing angle: open its spacing up
      const s = (a * ca + b * sa) / sp, w = (-a * sa + b * ca) / fp;
      ink = Math.max(ink, hLine(s, w, sp / fp, dk, H_TH[l], pxW, l));
    }
    return ink;
  }
  // static seeded paper: soft blotches plus fine fibres
  let hPaper = null;
  function paperAt(i) {
    if (!hPaper) {
      const [w, h] = H_RES, a = new Float32Array(w * h);
      const vn2 = (x, y, sd) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), hh = (i, j) => hash(i * 157.31 + j * 113.97 + sd * 71.3); return lerp(lerp(hh(xi, yi), hh(xi + 1, yi), ux), lerp(hh(xi, yi + 1), hh(xi + 1, yi + 1), ux), uy); };
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const bl = vn2(x / 90, y / 90, 1) * 0.6 + vn2(x / 30, y / 30, 2) * 0.4, fb = vn2(x / 3, y / 7, 3), gr = hash(x * 12.9898 + y * 78.233);
        a[y * w + x] = 1 - 0.035 * bl - 0.018 * fb * fb - 0.022 * gr;
      }
      hPaper = a;
    }
    return hPaper[i];
  }
  function hShade(g, S, st) {
    const pw = 1920 / H_RES[0], X = g.u * 1920, Y = g.v * 1080;
    const pap = paperAt(Math.min(g.i, H_RES[0] * H_RES[1] - 1));
    if (!g.hit) return [H_PAPER[0] * pap, H_PAPER[1] * pap, H_PAPER[2] * pap];
    const tone = hTone(g, S, true), dk = 1 - tone;
    const ink = g.u < st.so ? hObjInk(dk, g, S, pw) : hInk(dk, X, Y, pw);
    let base = H_PAPER;
    if (g.u < st.sw) {
      // watercolour: a pale wash of the object's colour, deeper in shade, with a soft blotchy edge
      const a = g.id === 0 ? [0.7, 0.76, 0.86] : LK.albedo(g.id), amt = g.id === 0 ? 0.5 * sstep(0.35, 0.7, dk) : 0.42 + 0.25 * dk;
      const bl = 0.85 + 0.3 * MG.vnoise(X * 0.01 + Y * 0.004, 9);
      base = mix3(H_PAPER, [H_PAPER[0] * a[0], H_PAPER[1] * a[1], H_PAPER[2] * a[2]], clamp(amt * bl));
    }
    const p = [base[0] * pap, base[1] * pap, base[2] * pap];
    const k = ink * 0.94;
    return [lerp(p[0], H_INK[0], k), lerp(p[1], H_INK[1], k), lerp(p[2], H_INK[2], k)];
  }
  // ink outlines from the G-buffer: id change, depth off the tangent plane, normal crease
  function hPost(sx) {
    return (rgb, G) => {
      const { w, h } = G, ids = G.id, P3 = G.P3, N3 = G.N3, D = G.depth, n = w * h, e = new Float32Array(n), O4 = [1, -1, w, -w], O2 = [1, w];
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        if ((x + 0.5) / w >= sx) break;
        const i = y * w + x, a = ids[i];
        if (a === 255) continue;
        let v = 0;
        for (const o of O4) {
          const j = i + o, b = ids[j];
          if (b !== a) { if (!(a === 0 && b === 255) && D[j] > D[i]) { v = 1; break; } continue; }
          if (D[j] <= D[i]) continue;
          const tol = 0.01 * D[i];
          if (Math.abs((P3[j * 3] - P3[i * 3]) * N3[i * 3] + (P3[j * 3 + 1] - P3[i * 3 + 1]) * N3[i * 3 + 1] + (P3[j * 3 + 2] - P3[i * 3 + 2]) * N3[i * 3 + 2]) > tol) { v = 1; break; }
        }
        if (!v && a !== 0) {
          for (const o of O2) {
            const j = i + o; if (ids[j] !== a) continue;
            const d = N3[i * 3] * N3[j * 3] + N3[i * 3 + 1] * N3[j * 3 + 1] + N3[i * 3 + 2] * N3[j * 3 + 2];
            if (d < 0.9) { v = 0.8; break; }
          }
        }
        e[i] = v;
      }
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const s = (4 * e[i] + 2 * (e[i - 1] + e[i + 1] + e[i - w] + e[i + w]) + e[i - w - 1] + e[i - w + 1] + e[i + w - 1] + e[i + w + 1]) / 16;
        const k = clamp(s * 2.2) * 0.95;
        if (k > 0) for (let ch = 0; ch < 3; ch++) rgb[i * 3 + ch] = lerp(rgb[i * 3 + ch], H_INK[ch], k);
      }
    };
  }
  let hRamp = null;
  function rampStrip(w, h) {
    if (hRamp) return hRamp;
    const k = cvs('hramp', w, h), d = k.img.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dk = x / (w - 1), ink = hInk(dk, x * 1.0 + 3, y * 1.0 + 5, 1), pap = 0.98 - 0.02 * hash(x * 3.1 + y * 7.7);
      const o = (y * w + x) * 4;
      d[o] = lerp(H_PAPER[0] * pap, H_INK[0], ink * 0.94) * 255; d[o + 1] = lerp(H_PAPER[1] * pap, H_INK[1], ink * 0.94) * 255; d[o + 2] = lerp(H_PAPER[2] * pap, H_INK[2], ink * 0.94) * 255; d[o + 3] = 255;
    }
    hRamp = blit(k);
    return hRamp;
  }

  MG.film({
    id: 'lookhatching', dur: 10, poster: 6.9,
    fonts: LK.fonts,
    meta: {
      family: 'L', name: 'Cross-Hatching', sub: 'Tone built from layers of pen strokes', era: '1500s —',
      origin: 'Hatching and cross-hatching — building tone from layers of parallel lines — come from engraving and pen drawing: Albrecht Dürer’s woodcuts and engravings of the 1490s–1510s set the standard, and the same vocabulary runs through etching and nineteenth-century wood engraving. In computer graphics, Winkenbach and Salesin’s “Computer-Generated Pen-and-Ink Illustration” (SIGGRAPH 1994) rendered tone with stroke textures, and Praun, Hoppe, Webb and Finkelstein’s “Real-Time Hatching” (SIGGRAPH 2001) introduced tonal art maps, layered hatch textures that blend by tone on the surface.',
      works: 'Melencolia I (Albrecht Dürer, engraving, 1514) · Winkenbach & Salesin, “Computer-Generated Pen-and-Ink Illustration” (SIGGRAPH 1994) · Melencolia I (Albrecht Dürer, 1514; engraved cross-hatching)',
      tech: ['Tone → hatch layers (1, 2, 3 directions)', 'Screen-space vs object-space strokes', 'G-buffer ink outlines on paper'],
      accent: '#3a3550',
      motionDNA: 'The shared 50° orbit with the Token turning through the light, so strokes appear and disappear as its faces darken past each threshold. A wipe turns the plain render into ink; the hatch first holds still on the screen while the objects slide under it, then a second wipe pins the strokes to each object so they ride along with the turn; a last wipe lays a pale watercolour wash under the ink.',
      visualDNA: 'Warm cream paper with faint fibres; near-black violet ink in wobbly, broken strokes at three angles, sparse single hatching on the half-tones, cross-hatching in the core shadows, triple hatching in the cast shadows; firm outlines around every silhouette and crease; at the end a light orange, grey and blue wash. Insets: the tone pass and the tone → layers ramp with its three thresholds.',
      transitions: 'Wipe from the plain render to ink; wipe from screen-space to object-space strokes; wipe to ink + wash',
      implementation: ['Tonal art maps (Praun et al. 2001): hatch textures layered by tone', 'Blender: Freestyle / Line Art outlines + hatch textures in a ramp; pen-and-ink shaders in Unity / Unreal', 'Canvas 2D + SDF tracer (js/look-kit.js): tone from N·L × shadow + AO sky, three thresholded line layers with width ∝ darkness, wobble and breaks from seeded noise, dominant-axis planar projection for object space, id / depth-plane / normal edges, seeded paper'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    draw(c, t, W, H) {
      const sx = E.ioC(seg(t, H_WIPE[0], H_WIPE[1])) * 1.04 - 0.02;
      const st = { so: E.ioC(seg(t, H_OBJ[0], H_OBJ[1])) * 1.04 - 0.02, sw: E.ioC(seg(t, H_WASH[0], H_WASH[1])) * 1.04 - 0.02 };
      // shadow / AO samples for the ink left of the wipe and the plain reference right of it (the render reuses this G-buffer)
      const G0 = LK.gbuffer(t, H_RES[0], H_RES[1]), xw = sx * H_RES[0];
      HG = { ink: sx > 0 ? hGrid(G0, 0, xw, HM.ink) : null, plain: sx < 1 ? hGrid(G0, xw, H_RES[0], HM.plain) : null };
      // once it is all ink, the outlines cover the silhouettes: no edge AA needed
      const { S } = LK.render(c, t, W, H, (g, S) => (g.u < sx ? hShade(g, S, st) : hPlain(g, S)), { post: hPost(sx), res: H_RES, aa: sx < 1 ? undefined : false });
      HG = null;
      if (t < H_WIPE[1] + 0.1) splitBar(c, sx * W, H, 'PEN AND INK', 'PLAIN REFERENCE');
      if (t > H_OBJ[0] - 0.1 && t < H_OBJ[1] + 0.1) splitBar(c, st.so * W, H, 'OBJECT-SPACE STROKES', 'SCREEN-SPACE STROKES', { y: 420 });
      if (t > H_WASH[0] - 0.1 && t < H_WASH[1] + 0.1) splitBar(c, st.sw * W, H, 'INK + WASH', 'INK', { y: 420 });
      const halo = 'rgba(245,241,232,0.9)';
      tag(c, 'CROSS-HATCHING  ·  TONE → LAYERS OF STROKES', 72, 80, { halo, accent: '#3a3550' });
      const ro = seg(t, 1.6, 2.1);
      if (ro > 0.01) {
        c.save(); c.globalAlpha = ro;
        readout(c, 'LAYERS', '1 · 2 · 3 AT 24% · 50% · 74% DARK', 98, 124, { halo, vc: '#3a3550' });
        readout(c, 'ANGLES', '54° · −34° · 8°', 98, 148, { halo });
        readout(c, 'STROKES', t < H_OBJ[0] ? 'FIXED TO THE SCREEN' : t < H_OBJ[1] ? 'SCREEN → OBJECT' : 'PINNED TO THE OBJECTS', 98, 172, { halo, vc: t >= H_OBJ[0] ? P.accent : INK });
        readout(c, 'OUTLINE', 'ID · DEPTH · NORMAL', 98, 196, { halo });
        flash(c, t, H_OBJ[0], 290, 154, 270, 26, P.accent);
        c.restore();
      }
      // tone → layers ramp, bottom right
      const rp = seg(t, 2.2, 2.7) * (1 - seg(t, 8.5, 8.9));
      if (rp > 0.01) {
        c.save(); c.globalAlpha = rp;
        const px = 1340, py = 772, pw = 508, ph = 210, bx = px + 20, bw = pw - 40;
        panel(c, px, py, pw, ph);
        label(c, 'TONE → LAYERS', px + 16, py + 28, { size: 13, ls: 2, weight: 700, color: INK });
        for (let i = 0; i < bw; i += 2) { const v = 1 - i / bw; c.fillStyle = rgbStr([v * 0.96, v * 0.95, v * 0.92]); c.fillRect(bx + i, py + 44, 2, 20); }
        c.drawImage(rampStrip(bw, 72), bx, py + 70);
        c.strokeStyle = 'rgba(23,24,28,0.4)'; c.lineWidth = 1; c.strokeRect(bx + 0.5, py + 44.5, bw, 20); c.strokeRect(bx + 0.5, py + 70.5, bw, 72);
        H_TH.forEach((th, k) => {
          const x = bx + th * bw; c.fillStyle = P.accent; c.fillRect(x - 1, py + 40, 2, 108);
          label(c, `${k + 1}`, x + 6, py + 162, { size: 12, ls: 1, weight: 700, color: P.accent });
        });
        label(c, 'LIGHT', bx, py + 162, { size: 11, ls: 1 });
        label(c, 'DARK', bx + bw, py + 162, { size: 11, ls: 1, align: 'right' });
        label(c, 'each threshold adds a direction; width grows within it', px + pw / 2, py + 192, { size: 11, ls: 1, align: 'center', color: '#5d5a54' });
        c.restore();
      }
      // tone pass inset, top right
      const tp = seg(t, 2.6, 3.1) * (1 - seg(t, 6.6, 7.0));
      if (tp > 0.01) {
        c.save(); c.globalAlpha = tp;
        const px = 1448, py = 56, pw = 400, ph = 225 + 44;
        panel(c, px, py, pw, ph);
        label(c, 'TONE PASS  ·  N·L × SHADOW + AO', px + 16, py + 28, { size: 13, ls: 2, weight: 700, color: INK });
        LK.render(c, t, W, H, (g, S) => { if (!g.hit) return [1, 1, 1]; const v = hTone(g, S); return [v, v, v]; }, { res: [224, 126], rect: [px + 8, py + 40, pw - 16, (pw - 16) * 9 / 16], aa: false });
        c.restore();
      }
      // leaders on the layers
      const lo = (a, b = 4.6) => seg(t, a, a + 0.45) * (1 - seg(t, b, b + 0.4));
      const sc = LK.SPH.c, r = LK.SPH.r, K = LK.KEY, toCam = norm(sub(S.cam.pos, sc));
      const at = nn => add(sc, mul(norm(nn), r));
      leader(c, S, at(add(mul(K, 0.25), toCam)), -150, -170, '1 LAYER', { on: lo(2.6), sub: 'half-tone' });
      leader(c, S, at(add(add(mul(K, -0.7), toCam), [0, -0.2, 0])), 150, -200, '2 LAYERS', { on: lo(3.0), sub: 'core shadow' });
      leader(c, S, sub(sc, mul(K, sc[1] / K[1] * 1.3)), 260, 60, '3 LAYERS', { on: lo(3.4), sub: 'cast shadow' });
      leader(c, S, tokPoint(S, [0.96, -0.3, 0.2]), 120, -120, 'INK OUTLINE', { on: lo(3.8), sub: 'depth / id jump in the G-buffer' });
      // shower door vs pinned
      leader(c, S, tokPoint(S, [-0.55, 0.55, 0.22]), -190, -140, 'LINES SLIDE OVER THE FORM', { on: lo(4.0, 5.0) * (t < H_OBJ[0] + 0.4 ? 1 : 0), sub: 'screen space: the shower door' });
      leader(c, S, tokPoint(S, [-0.55, 0.55, 0.22]), -190, -140, 'LINES RIDE WITH THE TURN', { on: lo(6.1, 7.0), sub: 'object space: planar projection', dot: P.accent });
      LK.caption(c, t, W, H, { name: 'Cross-Hatching', cat: 'Shading' });
    },
    score(A) {
      LK.bed(A);
      // a nib on paper: scratchy bandpassed noise strokes, in groups like hatching
      const stroke = (tt, i) => A.noise(tt, { type: 'bandpass', f: 2600 + 900 * hash(i * 2.3), f2: 3800, q: 3, dur: 0.07 + 0.04 * hash(i), g: 0.035, pan: hash(i * 5.1) * 1.2 - 0.6 });
      let k = 0;
      for (let tt = H_WIPE[0]; tt < H_WIPE[1]; tt += 0.075) stroke(tt, k++);
      [[2.6, 1], [3.0, 2], [3.4, 3]].forEach(([tt, n]) => { for (let j = 0; j < n * 4; j++) stroke(tt + j * 0.06, k++); A.pluck(tt, midi([64, 67, 71][n - 1]), { g: 0.1, bright: 0.4, dur: 1.0, rev: 0.3 }); });
      for (let tt = H_OBJ[0]; tt < H_OBJ[1]; tt += 0.1) stroke(tt, k++);
      A.pluck(H_OBJ[1], midi(72), { g: 0.13, bright: 0.6, dur: 1.2 });
      A.pluck(H_OBJ[1] + 0.1, midi(76), { g: 0.1, bright: 0.6, dur: 1.2 });
      // the wash: a soft wet swell
      A.noise(H_WASH[0], { type: 'lowpass', f: 900, f2: 400, dur: H_WASH[1] - H_WASH[0] + 0.4, g: 0.06, swell: 0.6, rev: 0.6 });
      A.chord(H_WASH[1], [60, 64, 67, 71, 74], { type: 'triangle', dur: 1.8, g: 0.03, a: 0.3, lp: 2000, rev: 0.6, width: 0.8 });
    },
  });
})();
