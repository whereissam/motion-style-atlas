/* batch g2 — Typography & 2D: Calligraphic · Typographic Collage · Limited Animation.
   A broad nib writing thick and thin, found letterforms shouting in free words,
   and the held cels and moving mouths of 1950s television economy. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, rng, hash, vnoise, midi, text, rrect, roughPoly, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Cormorant+Garamond:ital,wght@1,500&family=Alfa+Slab+One&family=Abril+Fatface&family=Anton&family=Bodoni+Moda:ital,opsz,wght@0,6..96,900;1,6..96,700&family=Old+Standard+TT:wght@400;700&family=Black+Ops+One&family=Oswald:wght@500;700&family=Special+Elite&family=Shrikhand&family=Josefin+Sans:wght@600;700&display=block');
  const PI = Math.PI;

  // Shared: smooth value-noise lattice for baked textures.
  function lattice(r, w, h) {
    const lat = new Float32Array((w + 2) * (h + 2));
    for (let i = 0; i < lat.length; i++) lat[i] = r();
    return (x, y) => {
      const xi = Math.floor(x) % w, yi = Math.floor(y) % h, fx = x - Math.floor(x), fy = y - Math.floor(y), W2 = w + 2, i = yi * W2 + xi;
      const a = lat[i], b = lat[i + 1], c = lat[i + W2], d = lat[i + W2 + 1];
      const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
  }
  // Catmull–Rom through control points [x, y, w?], resampled every `step` px; w (pressure / nib scale) interpolates linearly.
  function spline(P, step = 2.5) {
    const out = [];
    const at = i => P[Math.max(0, Math.min(P.length - 1, i))];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
      for (let k = i ? 1 : 0; k <= n; k++) {
        const u = k / n, u2 = u * u, u3 = u2 * u;
        const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u2 + (-a + 3 * b - 3 * c + d) * u3);
        out.push({ x: cr(p0[0], p1[0], p2[0], p3[0]), y: cr(p0[1], p1[1], p2[1], p3[1]), w: lerp(p1[2] ?? 1, p2[2] ?? 1, u) });
      }
    }
    let L = 0;
    out.forEach((p, i) => { if (i) L += Math.hypot(p.x - out[i - 1].x, p.y - out[i - 1].y); p.s = L; });
    return out;
  }

  /* =====================================================================
     CALLIGRAPHIC — a broad-edge nib rules its own ladder, writes a
     vermilion versal C, then the italic minuscules stroke by stroke in
     iron-gall ink that goes on blue-black and dries brown-black; the last
     letter throws a pointed-pen swash under the word, the pencil guides
     are erased and the title settles in
     ===================================================================== */
  const CA = { paper: '#efe5cf', ink: [26, 20, 16], wet: [34, 40, 74], red: [176, 46, 28], redWet: [204, 64, 36] };
  const CA_X = 180, CA_NIB = CA_X / 5, CA_ANG = -40 * PI / 180, CA_SL = 0.13, CA_BASE = 520, CA_X0 = 250;
  const CA_SERIF = 'Cinzel, "Cormorant Garamond", serif', CA_IT = '"Cormorant Garamond", Georgia, serif';
  // Italic minuscules in x-height units (baseline 0, x-height −1, ascender −1.76, descender +0.74), before slant.
  const BOWL = [[0.55, -0.88], [0.38, -1.0], [0.14, -0.84], [0.02, -0.42], [0.1, -0.05], [0.3, -0.06], [0.56, -0.56]];
  const CA_G = {
    C: { adv: 1.06, red: true, s: [
      [[0.7, -1.74], [0.44, -1.72], [0.16, -1.48], [0.0, -0.98], [0.03, -0.46], [0.22, -0.08], [0.55, 0.02], [0.86, -0.16]],
      [[0.56, -1.73], [0.8, -1.76], [0.95, -1.66], [0.99, -1.48]],
    ] },
    a: { adv: 0.78, s: [BOWL, [[0.5, -1.02], [0.6, -1.0], [0.56, -0.5], [0.54, -0.12], [0.62, 0.0], [0.8, -0.12]]] },
    l: { adv: 0.42, s: [[[0.02, -1.6], [0.16, -1.76], [0.13, -1.3], [0.08, -0.4], [0.1, -0.06], [0.22, 0.0], [0.36, -0.12]]] },
    i: { adv: 0.42, s: [[[0.0, -0.86], [0.12, -1.0], [0.1, -0.5], [0.08, -0.08], [0.2, 0.0], [0.34, -0.12]], [[0.17, -1.34], [0.2, -1.42]]] },
    g: { adv: 0.75, s: [BOWL, [[0.5, -1.02], [0.6, -1.0], [0.56, -0.3], [0.52, 0.38], [0.38, 0.66], [0.12, 0.74], [-0.08, 0.58]]] },
    r: { adv: 0.6, s: [[[0.0, -0.86], [0.12, -1.0], [0.1, -0.45], [0.08, 0.0]], [[0.1, -0.5], [0.22, -0.86], [0.4, -1.0], [0.56, -0.9]]] },
    p: { adv: 0.8, s: [[[0.0, -0.86], [0.12, -1.0], [0.1, -0.2], [0.07, 0.74]], [[0.1, -0.55], [0.24, -0.9], [0.46, -1.0], [0.62, -0.72], [0.56, -0.25], [0.36, -0.02], [0.12, -0.06]], [[-0.08, 0.74], [0.24, 0.74]]] },
    h: { adv: 0.88, s: [[[0.02, -1.6], [0.16, -1.76], [0.13, -1.0], [0.08, 0.0]], [[0.1, -0.5], [0.24, -0.88], [0.44, -1.0], [0.58, -0.82], [0.56, -0.3], [0.58, -0.04], [0.7, 0.0], [0.84, -0.12]]] },
    c: { adv: 0.65, s: [[[0.56, -0.86], [0.4, -1.0], [0.16, -0.86], [0.02, -0.45], [0.12, -0.06], [0.34, 0.0], [0.56, -0.1]]] },
  };
  const CA_WORD = 'Calligraphic';
  const CA_T = { ladder: [0.5, 1.3], cap: [1.45, 2.35], minus: [2.5, 6.3], swash: [6.42, 7.25], exit: 7.75, erase: [7.4, 8.2], title: [7.95, 8.75] };

  // Build every stroke of the film with its samples, nib, colour and schedule.
  const CA_S = (() => {
    const S = [];
    const px = (ox, x, y) => [CA_X0 + (ox + x - y * CA_SL) * CA_X, CA_BASE + y * CA_X];
    const add = (pts, o) => S.push({ smp: spline(pts, 2.5), kind: 'nib', ang: CA_ANG, red: false, ...o });
    // nib-width ladder: five squares, nib held flat, x-height measured in pen widths
    for (let k = 0; k < 5; k++) {
      const x = 118 + (k % 2) * CA_NIB, y = CA_BASE - (k + 1) * CA_NIB;
      add([[x, y + 3], [x, y + CA_NIB - 3]], { ang: 0, grp: 'ladder', letter: -1 });
    }
    let ox = 0;
    [...CA_WORD].forEach((ch, li) => {
      const G = CA_G[ch];
      G.s.forEach(st => add(st.map(([x, y]) => px(ox, x, y)), { red: !!G.red, grp: li ? 'minus' : 'cap', letter: li, dot: st.length === 2 && ch === 'i' }));
      ox += G.adv;
    });
    // the swash: a pointed pen picks up from the last c and swings back under the word (third value = pressure, px)
    const last = S[S.length - 1].smp, e = last[last.length - 1];
    const Y = CA_BASE;
    S.push({ kind: 'pp', grp: 'swash', letter: 99, red: false, smp: spline([
      [e.x, e.y, 1.5], [e.x + 50, e.y + 8, 2], [e.x + 92, e.y + 70, 9], [e.x + 80, e.y + 150, 16], [e.x + 10, Y + 196, 10],
      [e.x - 160, Y + 214, 4], [1100, Y + 206, 3], [800, Y + 192, 9], [560, Y + 184, 14], [400, Y + 176, 7], [330, Y + 150, 2.5], [338, Y + 116, 1.6], [372, Y + 112, 1.2],
    ], 2.5) });
    // schedule: duration grows with stroke length; pen lifts between strokes, longer between letters
    const sched = (grp, T0, T1) => {
      const L = S.filter(s => s.grp === grp);
      const gaps = L.map((s, i) => (i === 0 ? 0 : s.letter !== L[i - 1].letter ? 0.1 : 0.055));
      const w = L.map(s => Math.pow(s.smp[s.smp.length - 1].s + 20, 0.75));
      const tot = T1 - T0 - gaps.reduce((a, b) => a + b, 0), sw = w.reduce((a, b) => a + b, 0);
      let t = T0;
      L.forEach((s, i) => { t += gaps[i]; s.t0 = t; t += (w[i] / sw) * tot; s.t1 = t; });
    };
    sched('ladder', ...CA_T.ladder); sched('cap', ...CA_T.cap); sched('minus', ...CA_T.minus); sched('swash', ...CA_T.swash);
    S.forEach(s => { s.L = s.smp[s.smp.length - 1].s; });
    return S;
  })();
  // How far along its own length a stroke is at time t: hands slow into the turns at either end.
  const caProg = (s, t) => { const p = seg(t, s.t0, s.t1); return p <= 0 ? 0 : 0.3 * p + 0.7 * E.ioS(p); };
  const caAt = (s, u) => {
    const d = u * s.L, S = s.smp;
    let lo = 0, hi = S.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m].s < d) lo = m; else hi = m; }
    const f = clamp((d - S[lo].s) / (S[hi].s - S[lo].s || 1));
    return { i: lo, x: lerp(S[lo].x, S[hi].x, f), y: lerp(S[lo].y, S[hi].y, f), w: lerp(S[lo].w, S[hi].w, f) };
  };
  // Pen position and lift: on paper during a stroke, arcing between strokes.
  function caPen(t) {
    const S = CA_S;
    if (t < S[0].t0) { const u = E.ioC(seg(t, 0.05, S[0].t0)), p = S[0].smp[0]; return { x: lerp(1700, p.x, u), y: lerp(1250, p.y, u), lift: 1 - E.inQ(seg(t, S[0].t0 - 0.12, S[0].t0)), s: null }; }
    for (let i = 0; i < S.length; i++) {
      const s = S[i];
      if (t <= s.t1) {
        if (t >= s.t0) { const q = caAt(s, caProg(s, t)); return { x: q.x, y: q.y, lift: 0, s }; }
        const a = S[i - 1].smp[S[i - 1].smp.length - 1], b = s.smp[0], u = seg(t, S[i - 1].t1, s.t0);
        return { x: lerp(a.x, b.x, E.ioS(u)), y: lerp(a.y, b.y, E.ioS(u)), lift: Math.sin(PI * u) * clamp(Math.hypot(b.x - a.x, b.y - a.y) / 120, 0.25, 1), s: null };
      }
    }
    const l = S[S.length - 1], a = l.smp[l.smp.length - 1], u = seg(t, l.t1, CA_T.exit);
    return { x: lerp(a.x, 2300, E.inQ(u)), y: lerp(a.y, 1300, E.inQ(u)), lift: E.outQ(seg(u, 0, 0.3)), s: null };
  }
  // Add the polygon a stroke has laid down so far to the current path.
  function caStrokePath(g, s, u) {
    const S = s.smp, end = caAt(s, u), n = end.i + 1;
    if (s.kind === 'nib') {
      // broad edge: the mark is the nib's flat edge swept along the path — the width depends only on direction
      const ex = Math.cos(s.ang) * CA_NIB * 0.5, ey = Math.sin(s.ang) * CA_NIB * 0.5;
      const quad = (a, b) => {
        const ka = 0.86 + 0.14 * a.w, kb = 0.86 + 0.14 * b.w;
        const p = [[a.x - ex * ka, a.y - ey * ka], [a.x + ex * ka, a.y + ey * ka], [b.x + ex * kb, b.y + ey * kb], [b.x - ex * kb, b.y - ey * kb]];
        if ((b.x - a.x) * ey - (b.y - a.y) * ex < 0) p.reverse();
        g.moveTo(p[0][0], p[0][1]); g.lineTo(p[1][0], p[1][1]); g.lineTo(p[2][0], p[2][1]); g.lineTo(p[3][0], p[3][1]); g.closePath();
      };
      for (let i = 1; i < n; i++) quad(S[i - 1], S[i]);
      quad(S[n - 1], end);
    } else {
      // pointed pen: tines spread with pressure — outline left side forward, right side back
      const L = [], R = [];
      const pts = S.slice(0, n).concat([end]);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, hw = pts[i].w * 0.5;
        L.push([pts[i].x - dy / d * hw, pts[i].y + dx / d * hw]); R.push([pts[i].x + dy / d * hw, pts[i].y - dx / d * hw]);
      }
      g.moveTo(L[0][0], L[0][1]); L.forEach(p => g.lineTo(p[0], p[1])); for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]); g.closePath();
    }
    return end;
  }
  // The pen: steel broad-edge nib on a black holder, shadow lengthening as it lifts.
  function caDrawPen(c, P, s) {
    const ang = s && s.kind === 'pp' ? -0.95 : P.s && P.s.ang === 0 ? 0 : CA_ANG;
    const N = s && s.kind === 'pp' ? 18 : CA_NIB, lift = P.lift;
    const body = g => {
      // local frame: v along the nib edge, u along the shaft toward the hand
      g.beginPath();
      g.moveTo(-N / 2, 0); g.lineTo(N / 2, 0); g.lineTo(N * 0.62, N * 1.1); g.bezierCurveTo(N * 0.95, N * 2.0, N * 0.9, N * 3.0, N * 0.66, N * 3.7);
      g.lineTo(-N * 0.66, N * 3.7); g.bezierCurveTo(-N * 0.9, N * 3.0, -N * 0.95, N * 2.0, -N * 0.62, N * 1.1); g.closePath();
    };
    const holder = g => { g.beginPath(); g.moveTo(-N * 0.75, N * 3.5); g.lineTo(N * 0.75, N * 3.5); g.lineTo(N * 0.95, N * 26); g.lineTo(-N * 0.95, N * 26); g.closePath(); };
    const place = (g, dx, dy, k) => { g.translate(P.x + dx, P.y + dy); g.rotate(ang); g.scale(k, k); };
    // cast shadow
    c.save(); place(c, 10 + lift * 34, 8 + lift * 26, 1); c.fillStyle = `rgba(60,40,20,${0.22 - lift * 0.08})`; c.filter = `blur(${4 + lift * 6}px)`; body(c); c.fill(); holder(c); c.fill(); c.restore();
    c.save(); place(c, -lift * 4, -lift * 6, 1 + lift * 0.04);
    // holder: lacquered black with a highlight, brass ferrule
    const hg = c.createLinearGradient(-N, 0, N, 0); hg.addColorStop(0, '#0b0908'); hg.addColorStop(0.35, '#3c3532'); hg.addColorStop(0.5, '#151110'); hg.addColorStop(1, '#050404');
    holder(c); c.fillStyle = hg; c.fill();
    const fg = c.createLinearGradient(-N, 0, N, 0); fg.addColorStop(0, '#5a3d14'); fg.addColorStop(0.4, '#e3bd6a'); fg.addColorStop(0.6, '#a57a2c'); fg.addColorStop(1, '#3c2808');
    c.fillStyle = fg; c.fillRect(-N * 0.82, N * 3.4, N * 1.64, N * 2.2);
    c.fillStyle = 'rgba(0,0,0,0.3)'; for (let k = 0; k < 4; k++) c.fillRect(-N * 0.82, N * (3.7 + k * 0.5), N * 1.64, 1.5);
    // steel nib with an ink-wet tip
    const ng = c.createLinearGradient(-N * 0.7, 0, N * 0.7, 0); ng.addColorStop(0, '#4b4f55'); ng.addColorStop(0.3, '#d9dde0'); ng.addColorStop(0.55, '#8d9399'); ng.addColorStop(1, '#2d3034');
    body(c); c.fillStyle = ng; c.fill();
    c.save(); body(c); c.clip(); c.fillStyle = 'rgba(20,18,26,0.92)'; c.fillRect(-N, -2, N * 2, N * 0.75); c.restore();
    c.strokeStyle = 'rgba(15,15,18,0.85)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, N * 2.1); c.stroke();
    c.fillStyle = '#121114'; c.beginPath(); c.ellipse(0, N * 2.25, N * 0.13, N * 0.18, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(-N * 0.3, N * 2.8, N * 0.08, N * 0.6, 0.1, 0, TAU); c.fill();
    c.restore();
  }

  MG.film({
    id: 'calligraphic', dur: 10, poster: 9.5,
    fonts: [['500 60px Cinzel', 'MOTION FAMILY B LETTERING JOHNSTON ZAPF'], ['italic 500 40px "Cormorant Garamond"', 'thick and thin, one stroke at a time — after Edward Johnston & Hermann Zapf']],
    meta: {
      family: 'B', name: 'Calligraphic Motion', sub: 'Thick & Thin, Stroke by Stroke', era: '1906 —',
      origin: 'Edward Johnston’s Writing & Illuminating, & Lettering (1906) revived the broad-edged pen and taught that every letter is a sequence of strokes made at a constant pen angle; Hermann Zapf carried that hand into type and lettering (Palatino 1948, Zapfino 1998). Title designers and lettering artists made the write-on its film form, revealing a word in the order a scribe would draw it, with the nib’s thick-and-thin contrast intact.',
      works: 'Edward Johnston, Writing & Illuminating, & Lettering (1906) · Hermann Zapf, Pen and Graver (1952) · Saul Bass, The Age of Innocence title sequence (1993) · Seb Lester’s filmed calligraphy (2010s —) · Apple’s script “hello” (Macintosh, 1984 —)',
      tech: ['Broad-edge nib swept at a fixed angle', 'Stroke-order write-on', 'Pointed-pen pressure swells', 'Wet iron-gall ink pooling and drying'],
      accent: '#b02e1c',
      motionDNA: 'Every letter is revealed in true stroke order and direction, a pen leading the mark; strokes accelerate through the straights and slow into the turns, the pen lifts and arcs between strokes, and a final flourish swings out faster than the letters.',
      visualDNA: 'Black-brown ink on cream laid paper with thick downstrokes and hairline upstrokes fixed by a 40° pen angle, a vermilion versal capital, pencil guide lines and a nib-width ladder in the margin, and glossy pooled ink at every stroke ending.',
      transitions: 'Macro on the nib, pull-back write-on, flourish under-swing, erase of the guide lines, title settle',
      implementation: ['After Effects (stroke write-on over hand-traced paths)', 'Canvas 2D', 'Web Audio'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const W = 1920, H = 1080, r = rng(1906);
      // laid paper: chain lines, laid lines, fibres, a warm uneven tone
      const paper = offscreen(W, H), g = paper.getContext('2d');
      g.fillStyle = CA.paper; g.fillRect(0, 0, W, H);
      const vn = lattice(r, 48, 28), cl = offscreen(240, 135), cg = cl.getContext('2d'), cd = cg.createImageData(240, 135);
      for (let y = 0; y < 135; y++) for (let x = 0; x < 240; x++) { const v = vn(x / 10, y / 10) * 0.7 + vn(x / 3 + 20, y / 3 + 7) * 0.3, i = (y * 240 + x) * 4; cd.data[i] = 150; cd.data[i + 1] = 110; cd.data[i + 2] = 60; cd.data[i + 3] = v * 34; }
      cg.putImageData(cd, 0, 0); g.filter = 'blur(14px)'; g.drawImage(cl, 0, 0, W, H); g.filter = 'none';
      for (let y = 0; y < H; y += 3) { g.fillStyle = `rgba(255,252,240,${0.05 + r() * 0.05})`; g.fillRect(0, y, W, 1); }
      for (let x = 40; x < W; x += 92) { g.fillStyle = 'rgba(140,110,70,0.05)'; g.fillRect(x + (r() - 0.5) * 3, 0, 4, H); }
      for (let k = 0; k < 9000; k++) { g.fillStyle = r() < 0.6 ? 'rgba(120,90,50,0.07)' : 'rgba(255,255,248,0.3)'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 1.2); }
      for (let k = 0; k < 900; k++) { const x = r() * W, y = r() * H, a = r() * TAU, l = 6 + r() * 18; g.strokeStyle = 'rgba(110,85,50,0.08)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 1) * l * 0.5, y + Math.sin(a + 1) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
      const vg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 1.05); vg.addColorStop(0, 'rgba(90,60,30,0)'); vg.addColorStop(1, 'rgba(90,60,30,0.35)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      // paper tooth: speckles knocked out of the ink
      const N = 512, sp = offscreen(N, N), sg = sp.getContext('2d'), sd = sg.createImageData(N, N), vt = lattice(r, 128, 128);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const n = 0.55 * r() + 0.45 * vt(x / 4, y / 4), i = (y * N + x) * 4; sd.data[i + 3] = clamp((n - 0.62) / 0.2) * 255; }
      sg.putImageData(sd, 0, 0);
      return { paper, tooth: sp, L: offscreen(W, H) };
    },
    draw(c, t, W, H, st) {
      const base = c.getTransform();
      // camera: macro on the ladder and the nib, pulling back to the whole word
      const s = Math.exp(kf(t, [[0, Math.log(2.35)], [1.3, Math.log(2.05), E.ioS], [2.6, Math.log(1.06), E.ioC], [7.2, Math.log(1.0), E.ioS], [10, Math.log(1.02), E.ioS]]));
      const P = caPen(t);
      const cx = kf(t, [[0, 420], [1.3, 470, E.ioS], [2.6, 930, E.ioC], [10, 960, E.ioS]]) + (t > 2.6 && t < 7.3 ? (P.x - 960) * 0.03 * seg(t, 2.6, 3.2) * (1 - seg(t, 6.8, 7.3)) : 0);
      const cy = kf(t, [[0, 420], [1.3, 400, E.ioS], [2.6, 520, E.ioC], [7.2, 540, E.ioS]]);
      c.save();
      c.translate(960, 540); c.scale(s, s); c.translate(-cx, -cy);
      c.drawImage(st.paper, 0, 0);
      // pencil guides: ascender, x-height, baseline, descender, and slant lines — erased at the end
      const ga = 1 - 0.85 * E.ioS(seg(t, ...CA_T.erase));
      c.save(); c.globalAlpha = ga;
      [[-1.76, 0.1], [-1, 0.18], [0, 0.26], [0.74, 0.34]].forEach(([y, t0], i) => {
        const u = E.outC(seg(t, t0, t0 + 0.7)); if (u <= 0) return;
        const yy = CA_BASE + y * CA_X;
        c.strokeStyle = `rgba(78,70,62,${i === 2 ? 0.42 : 0.3})`; c.lineWidth = i === 2 ? 1.6 : 1.1;
        c.beginPath(); c.moveTo(90, yy); for (let x = 90; x < lerp(90, 1840, u); x += 40) c.lineTo(x, yy + vnoise(x * 0.01, i) * 0.8); c.stroke();
      });
      for (let k = 0; k < 10; k++) {
        const u = E.outC(seg(t, 0.5 + k * 0.05, 0.9 + k * 0.05)); if (u <= 0) continue;
        const x = 300 + k * 160, y0 = CA_BASE + 0.74 * CA_X, y1 = CA_BASE - 1.76 * CA_X;
        c.strokeStyle = 'rgba(78,70,62,0.13)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y0); c.lineTo(lerp(x, x + (y0 - y1) * CA_SL, u), lerp(y0, y1, u)); c.stroke();
      }
      c.restore();
      // ink layer, locked to the paper, multiplied on at the end
      const g = st.L.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, W, H);
      g.setTransform(c.getTransform());
      const pools = [];
      CA_S.forEach(sk => {
        const u = caProg(sk, t); if (u <= 0) return;
        const dry = E.ioS(seg(t, sk.t1 + 0.3, sk.t1 + 1.8));
        const [w0, w1] = sk.red ? [CA.redWet, CA.red] : [CA.wet, CA.ink];
        const col = w0.map((v, i) => Math.round(lerp(v, w1[i], dry)));
        g.beginPath();
        const end = caStrokePath(g, sk, u);
        // ink is heavier where it ran down the stroke: a gentle top-to-bottom density
        const gr = g.createLinearGradient(0, CA_BASE - 1.8 * CA_X, 0, CA_BASE + 0.8 * CA_X);
        gr.addColorStop(0, `rgb(${col.map(v => Math.round(lerp(v, 239, 0.12)))})`); gr.addColorStop(1, `rgb(${col})`);
        g.fillStyle = gr; g.fill('nonzero');
        // the nib never leaves nothing: a hairline rides the centre of every stroke
        if (sk.kind === 'nib') {
          g.strokeStyle = gr; g.lineWidth = 1.7; g.lineCap = 'round'; g.beginPath();
          const S = sk.smp; g.moveTo(S[0].x, S[0].y); for (let i = 1; i <= end.i; i++) g.lineTo(S[i].x, S[i].y); g.lineTo(end.x, end.y); g.stroke();
        }
        const live = u < 1 && t >= sk.t0;
        pools.push({ x: end.x, y: end.y, sk, wet: live ? 1 : 1 - dry, col, live, start: sk.smp[0] });
      });
      // ink pools: a bead behind the moving nib, darker beads where strokes stopped
      g.globalCompositeOperation = 'source-atop';
      pools.forEach(p => {
        const ang = p.sk.kind === 'pp' ? 0 : p.sk.ang, rx = p.sk.kind === 'pp' ? 5 : CA_NIB * 0.4, ry = p.sk.kind === 'pp' ? 3.5 : CA_NIB * 0.13;
        g.save(); g.translate(p.x, p.y + 1.5); g.rotate(ang);
        g.fillStyle = `rgba(0,0,0,${0.3 + 0.25 * p.wet})`; g.beginPath(); g.ellipse(0, 1, rx * (1 + 0.25 * p.wet), ry * (1 + 0.6 * p.wet), 0, 0, TAU); g.fill();
        g.restore();
        if (p.sk.kind === 'nib' && p.sk.letter >= 0) { g.save(); g.translate(p.start.x, p.start.y); g.rotate(p.sk.ang); g.fillStyle = 'rgba(0,0,0,0.25)'; g.beginPath(); g.ellipse(0, 0, CA_NIB * 0.42, CA_NIB * 0.09, 0, 0, TAU); g.fill(); g.restore(); }
      });
      g.globalCompositeOperation = 'source-over';
      // paper tooth breaks the edges and thins the hairlines
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-out';
      const tp = st.toothP || (st.toothP = g.createPattern(st.tooth, 'repeat'));
      tp.setTransform(c.getTransform().scale(0.8));
      g.fillStyle = tp; g.globalAlpha = 0.22; g.fillRect(0, 0, W, H);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      g.setTransform(c.getTransform());
      // wet gloss: a soft highlight on fresh ink
      g.globalCompositeOperation = 'source-atop';
      pools.forEach(p => { if (p.wet < 0.05) return; g.fillStyle = `rgba(255,255,255,${0.42 * p.wet})`; g.beginPath(); g.ellipse(p.x - 3, p.y - 1, 3.2, 1.6, CA_ANG, 0, TAU); g.fill(); });
      g.globalCompositeOperation = 'source-over';
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'multiply'; c.drawImage(st.L, 0, 0); c.restore();
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 0.55; c.drawImage(st.L, 0, 0); c.restore();
      // the swash's flick throws a few droplets
      if (t > CA_T.swash[1] - 0.02) {
        const sw = CA_S[CA_S.length - 1], e = sw.smp[sw.smp.length - 1];
        for (let k = 0; k < 7; k++) {
          const u = E.outC(seg(t, CA_T.swash[1] - 0.02 + k * 0.008, CA_T.swash[1] + 0.12 + k * 0.008)); if (u <= 0) continue;
          const a = -2.2 + hash(k * 3.1) * 0.9, d = (26 + hash(k * 7.7) * 70) * u;
          c.fillStyle = `rgba(${CA.ink},0.85)`; c.beginPath(); c.arc(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, 0.8 + hash(k * 1.3) * 2.2, 0, TAU); c.fill();
        }
      }
      if (t < CA_T.exit + 0.1) caDrawPen(c, P, P.s);
      c.restore();
      // the title settles under the word
      if (t > CA_T.title[0]) {
        const u = seg(t, CA_T.title[0], CA_T.title[1]);
        c.save();
        c.globalAlpha = E.outC(u);
        text(c, 'MOTION', 960, 840 + 14 * (1 - E.outC(u)), { font: CA_SERIF, weight: 500, size: 58, align: 'center', color: `rgb(${CA.red})`, ls: 34 });
        c.globalAlpha = E.outC(seg(t, CA_T.title[0] + 0.35, CA_T.title[1] + 0.35));
        text(c, 'thick and thin, one stroke at a time', 960, 912, { font: CA_IT, style: 'italic', weight: 500, size: 38, align: 'center', color: 'rgba(40,30,24,0.8)' });
        c.globalAlpha = E.outC(seg(t, 8.9, 9.4));
        text(c, 'FAMILY B · LETTERING', 120, 1010, { font: CA_SERIF, weight: 500, size: 20, color: 'rgba(40,30,24,0.55)', ls: 4 });
        text(c, 'after Edward Johnston & Hermann Zapf', 1800, 1010, { font: CA_IT, style: 'italic', weight: 500, size: 26, align: 'right', color: 'rgba(40,30,24,0.6)' });
        c.restore();
      }
      const fi = 1 - E.outQ(seg(t, 0, 0.4));
      if (fi > 0) { c.fillStyle = `rgba(20,14,8,${fi})`; c.fillRect(0, 0, W, H); }
      grain(c, W, H, t, 0.035, 'overlay');
      c.setTransform(base);
    },
    score(A) {
      A.bus.gain.value = 0.9;
      // a quiet room and the pen's dip into the well
      A.noise(0, { type: 'lowpass', f: 420, dur: 9.8, g: 0.014, a: 0.8, hold: true, rel: 0.8 });
      A.bell(0.2, 1480, { ratios: [1, 2.71, 5.1], g: 0.05, dur: 1.2, rev: 0.4 });
      A.noise(0.24, { type: 'bandpass', f: 900, f2: 400, q: 3, dur: 0.12, g: 0.05 });
      // nib on laid paper: a soft rasp per stroke, louder on the broad downstrokes, a tick on each touchdown
      CA_S.forEach((s, i) => {
        const d = s.t1 - s.t0, n = Math.max(2, Math.round(d / 0.02)), pan = clamp((s.smp[0].x / 1920 - 0.5) * 0.7, -0.4, 0.4);
        A.noise(s.t0, { type: 'highpass', f: 3800, dur: 0.012, g: 0.06, pan });
        for (let k = 0; k < n; k++) {
          const u = k / n, a = caAt(s, caProg(s, s.t0 + u * d)), b = caAt(s, caProg(s, s.t0 + (u + 1 / n) * d));
          const sp = Math.hypot(b.x - a.x, b.y - a.y) / (d / n), dir = Math.atan2(b.y - a.y, b.x - a.x);
          const wide = s.kind === 'nib' ? Math.abs(Math.sin(dir - s.ang)) : clamp(a.w / 16);
          const h = hash(i * 17.3 + k * 2.9);
          A.noise(s.t0 + u * d, { type: 'bandpass', f: 2600 + h * 2600 + wide * 900, q: 1.6, dur: 0.03, g: (0.012 + 0.03 * clamp(sp / 1400)) * (0.6 + 0.6 * wide), pan });
        }
      });
      A.whoosh(CA_T.swash[1] - 0.25, 0.35, { f1: 1200, f2: 5200, g: 0.05, q: 1 });
      // music: a lute-like pluck line over a viol drone, D dorian, resolving on the title
      const lute = (t, m, g = 0.08) => { A.pluck(t, midi(m), { dur: 2.4, g, bright: 0.45, decay: 0.997, lp: 3200, rev: 0.45, pan: (m - 62) / 40 }); };
      const viol = (t, m, dur, g = 0.022) => { A.osc(t, { type: 'sawtooth', f: midi(m), dur, g, a: 0.6, lp: 700, hold: true, rel: 0.6, vib: [4.6, 2], rev: 0.4 }); };
      viol(0.3, 38, 4.2); viol(4.4, 41, 3.0); viol(7.3, 43, 1.4); viol(8.0, 38, 1.9, 0.026);
      const line = [[0.6, 62], [1.0, 69], [1.45, 65], [1.9, 67], [2.5, 69], [2.9, 72], [3.3, 74], [3.75, 72], [4.2, 69], [4.6, 65], [5.0, 67], [5.45, 69], [5.9, 70], [6.4, 69], [6.85, 67], [7.25, 65]];
      line.forEach(([t, m], i) => { lute(t, m, 0.075); if (i % 4 === 0) lute(t + 0.01, m - 12, 0.05); });
      [50, 57, 62, 65, 69, 74].forEach((m, i) => lute(8.0 + i * 0.07, m, 0.07));
      A.bell(8.05, midi(86), { g: 0.05, dur: 2, rev: 0.5 });
    },
  });
  /* =====================================================================
     TYPOGRAPHIC COLLAGE — parole in libertà on a newsprint table, shot on
     twos: found letters slap down one by one to spell ZANG, TUMB and a
     stretching TUUUUM along Futurist diagonals; rules, symbols, ticket
     stubs and tape pile up into a punk flyer, a torn red sheet is slapped
     across the middle and TYPOGRAPHIC is spelled in eleven found faces
     ===================================================================== */
  const TC = { ground: '#e6ddc8', ink: '#141210', red: '#d3261d', cream: '#f4ecd7', news: '#e9e3d3', kraft: '#b88d5c', buff: '#eccf7e', pink: '#efaea6', green: '#9fc497', blue: '#2e4d96', grey: '#55504a' };
  const TCF = {
    wood: '"Alfa Slab One", serif', fat: '"Abril Fatface", serif', anton: 'Anton, "Oswald", sans-serif', bod: '"Bodoni Moda", serif',
    news: '"Old Standard TT", Georgia, serif', sten: '"Black Ops One", sans-serif', osw: 'Oswald, sans-serif', type: '"Special Elite", monospace',
  };
  const TC_FPS = 12;
  const TC_T = { sheet: 5.75, title: 6.4, strip: 8.1, end: 8.75 };
  const TC_WORDS = ['velocità', 'rumore', 'motore', 'città', 'luce', 'folla', 'macchina', 'elettrica', 'ponte', 'vapore', 'treno', 'notte', 'ritmo', 'acciaio', 'ruota', 'parole', 'libere', 'grido', 'fumo', 'stazione'];

  // A found letter: one glyph fitted to a box. kind: wood (grain streaks in the ink), print (clean), stencil.
  function tcGlyph(g, ch, w, h, font, ink, o = {}) {
    const tmp = offscreen(Math.ceil(w), Math.ceil(h)), tg = tmp.getContext('2d');
    tg.font = `${o.style || ''} ${o.weight || 400} 200px ${font}`;
    const m = tg.measureText(ch), gh = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, gw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const k = Math.min((h * (o.fill || 0.8)) / gh, (w * 0.86) / gw) * 200;
    tg.font = `${o.style || ''} ${o.weight || 400} ${k}px ${font}`;
    const m2 = tg.measureText(ch);
    const x = w / 2 - (m2.actualBoundingBoxRight - m2.actualBoundingBoxLeft) / 2, y = h / 2 + (m2.actualBoundingBoxAscent - m2.actualBoundingBoxDescent) / 2;
    tg.fillStyle = ink; tg.textBaseline = 'alphabetic'; tg.textAlign = 'left'; tg.fillText(ch, x, y);
    if (o.wood) {
      // wood type: the grain prints as pale streaks, the worn edges as speckle
      const r = rng(ch.charCodeAt(0) * 31 + (o.seed || 0));
      tg.globalCompositeOperation = 'destination-out';
      for (let yy = 0; yy < h; yy += 2) {
        const a = Math.max(0, vnoise(yy * 0.09, r() * 9) * 0.5 + vnoise(yy * 0.31, 3) * 0.25) * 0.55;
        tg.fillStyle = `rgba(0,0,0,${a})`; tg.fillRect(0, yy + vnoise(yy, 2), w, 1 + r() * 1.5);
      }
      for (let q = 0; q < w * h / 60; q++) { tg.fillStyle = `rgba(0,0,0,${0.3 + r() * 0.6})`; tg.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2); }
      tg.globalCompositeOperation = 'source-over';
    }
    g.drawImage(tmp, 0, 0);
  }
  // Lines of tiny newspaper text in columns.
  function tcNewsText(g, w, h, r, o = {}) {
    const fs = o.fs || 11, cols = o.cols || Math.max(1, Math.round(w / 150)), gut = 10, cw = (w - gut * (cols + 1)) / cols;
    g.fillStyle = o.col || 'rgba(40,36,32,0.75)'; g.font = `400 ${fs}px ${TCF.news}`; g.textBaseline = 'alphabetic';
    for (let c = 0; c < cols; c++) for (let y = (o.top || 8) + fs; y < h - 4; y += fs * 1.25) {
      let x = gut + c * (cw + gut), line = '';
      while (true) { const wd = TC_WORDS[(r() * TC_WORDS.length) | 0]; if (g.measureText(line + wd).width > cw) break; line += wd + ' '; }
      g.fillText(line, x, y);
    }
  }
  // Bake one paper piece: content painted, edge cut or torn (with the white fibrous core showing), and a soft shadow.
  function tcPiece(w, h, o) {
    const pad = 26, cv = offscreen(Math.ceil(w + pad * 2), Math.ceil(h + pad * 2)), g = cv.getContext('2d'), r = rng(o.seed || 1);
    g.translate(pad, pad);
    const rect = (i, j) => [[i + (r() - 0.5) * j, i + (r() - 0.5) * j], [w - i + (r() - 0.5) * j, i + (r() - 0.5) * j], [w - i + (r() - 0.5) * j, h - i + (r() - 0.5) * j], [i + (r() - 0.5) * j, h - i + (r() - 0.5) * j]];
    if (o.edge === 'torn') {
      roughPoly(g, rect(0, 6), o.seed * 7 + 1, 4.5, 9); g.fillStyle = o.rim || '#faf6ec'; g.fill();
      roughPoly(g, rect(3, 6), o.seed * 7 + 2, 4, 8); g.save(); g.clip();
    } else {
      const P = rect(0, o.edge === 'tape' ? 0 : 5);
      g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.save(); g.clip();
    }
    g.fillStyle = o.bg; g.fillRect(-6, -6, w + 12, h + 12);
    o.paint && o.paint(g, w, h, r);
    // paper: fibres and a faint tonal drift
    for (let k = 0; k < w * h / 220; k++) { g.fillStyle = r() < 0.5 ? 'rgba(80,60,30,0.07)' : 'rgba(255,255,250,0.12)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1); }
    const tg = g.createLinearGradient(0, 0, w, h); tg.addColorStop(0, 'rgba(255,255,255,0.06)'); tg.addColorStop(1, 'rgba(70,40,10,0.08)');
    g.fillStyle = tg; g.fillRect(0, 0, w, h);
    g.restore();
    if (o.perf) { g.globalCompositeOperation = 'destination-out'; for (let y = 8; y < h; y += 13) { g.beginPath(); g.arc(o.perf === 'L' ? 0 : w, y, 3.6, 0, TAU); g.fill(); } g.globalCompositeOperation = 'source-over'; }
    const sh = offscreen(cv.width, cv.height), sg = sh.getContext('2d');
    sg.filter = 'blur(5px)'; sg.drawImage(cv, 0, 0); sg.filter = 'none';
    sg.globalCompositeOperation = 'source-in'; sg.fillStyle = '#1a0e04'; sg.fillRect(0, 0, sh.width, sh.height);
    return { cv, sh, pad, w, h };
  }
  const tcLetter = (ch, w, h, font, ink, bg, edge, seed, o = {}) => tcPiece(w, h, { bg, edge, seed, perf: o.perf, paint: (g, w2, h2, r) => {
    if (o.news) { tcNewsText(g, w2, h2, r, { col: 'rgba(40,36,32,0.28)', fs: 9 }); }
    if (o.ticket) { g.strokeStyle = 'rgba(30,20,10,0.5)'; g.setLineDash([4, 3]); g.lineWidth = 1.5; g.strokeRect(8, 8, w2 - 16, h2 - 16); g.setLineDash([]); }
    if (o.dots) { g.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 4; y < h2; y += 7) for (let x = (y / 7 % 2) * 3.5; x < w2; x += 7) { g.beginPath(); g.arc(x, y, 1.6 + 1.2 * Math.sin(x * 0.03 + y * 0.02), 0, TAU); g.fill(); } }
    tcGlyph(g, ch, w2, h2, font, ink, { wood: o.wood, weight: o.weight, style: o.style, fill: o.fill, seed });
  } });
  const tcTape = (w, h, seed) => {
    const cv = offscreen(w + 20, h + 20), g = cv.getContext('2d'), r = rng(seed);
    g.translate(10, 10); g.beginPath(); g.moveTo(0, 0);
    for (let x = 0; x <= w; x += 12) g.lineTo(x, (r() - 0.5) * 2);
    for (let y = 0; y <= h; y += 4) g.lineTo(w + (y / 4 % 2 ? 4 : -2) + (r() - 0.5) * 3, y);
    for (let x = w; x >= 0; x -= 12) g.lineTo(x, h + (r() - 0.5) * 2);
    for (let y = h; y >= 0; y -= 4) g.lineTo((y / 4 % 2 ? -4 : 2) + (r() - 0.5) * 3, y);
    g.closePath(); g.fillStyle = 'rgba(222,206,160,0.7)'; g.fill();
    g.save(); g.clip(); g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(0, h * 0.15, w, h * 0.2);
    for (let k = 0; k < w * 0.6; k++) { g.fillStyle = 'rgba(120,100,60,0.08)'; g.fillRect(r() * w, r() * h, 2, 1); } g.restore();
    return { cv, sh: null, pad: 10, w, h, tape: true };
  };

  // The whole piece list: sprite, final placement, landing time, entry direction.
  function tcBuild() {
    const P = [];
    const put = (spr, x, y, rot, t, o = {}) => P.push({ spr, x, y, rot, t, dx: o.dx ?? (hash(P.length * 3.7) - 0.5) * 300, dy: o.dy ?? -220 - hash(P.length * 1.9) * 160, slide: o.slide, word: o.word });
    let s = 10;
    // ZANG — four found letters, upper left
    put(tcLetter('Z', 210, 250, TCF.wood, TC.ink, TC.cream, 'cut', s++, { wood: true }), 260, 220, -0.12, 0.42, { word: 'zang' });
    put(tcLetter('A', 190, 240, TCF.bod, TC.red, TC.news, 'torn', s++, { news: true, weight: 900 }), 455, 205, 0.08, 0.67, { word: 'zang' });
    put(tcLetter('N', 180, 236, TCF.anton, TC.ink, TC.green, 'cut', s++, { ticket: true, perf: 'L' }), 640, 245, -0.05, 0.92, { word: 'zang' });
    put(tcLetter('G', 205, 250, TCF.fat, TC.cream, TC.ink, 'cut', s++), 830, 215, 0.1, 1.17, { word: 'zang' });
    // TUMB — descending diagonal, growing
    [['T', 120, 150, TCF.osw, TC.ink, TC.buff, 'cut', { weight: 700 }], ['U', 140, 175, TCF.sten, TC.ink, TC.kraft, 'torn', {}], ['M', 175, 200, TCF.news, TC.ink, TC.news, 'torn', { weight: 700, news: true }], ['B', 205, 235, TCF.wood, TC.red, TC.cream, 'cut', { wood: true }]]
      .forEach(([ch, w, h, f, ink, bg, edge, o], i) => put(tcLetter(ch, w, h, f, ink, bg, edge, s++, o), 230 + i * 165, 520 + i * 92, 0.22 + (i % 2 ? -0.06 : 0.04), 1.5 + i * 0.25, { word: 'tumb' }));
    // TUUUUM — climbing the right side, the vowel stretching
    [['T', 110, 130], ['U', 120, 150], ['U', 140, 180], ['U', 160, 215], ['U', 185, 250], ['M', 230, 280]].forEach(([ch, w, h], i) => {
      const spec = [[TCF.anton, TC.ink, TC.cream, 'cut', {}], [TCF.fat, TC.red, TC.news, 'torn', { news: true }], [TCF.wood, TC.ink, TC.buff, 'cut', { wood: true }], [TCF.bod, TC.cream, TC.ink, 'cut', { weight: 900 }], [TCF.osw, TC.ink, TC.pink, 'cut', { weight: 700, ticket: true, perf: 'R' }], [TCF.wood, TC.cream, TC.red, 'torn', { wood: true, rim: true }]][i];
      put(tcLetter(ch, w, h, spec[0], spec[1], spec[2], spec[3], s++, spec[4]), 1080 + i * 140, 930 - i * 120, -0.34 + (i % 2 ? 0.07 : -0.03), 2.55 + i * 0.17, { word: 'tuuum' });
    });
    // newspaper fragments, a halftone, the arithmetic of the Futurists, a noise word
    put(tcPiece(330, 210, { bg: TC.news, edge: 'torn', seed: s++, paint: (g, w, h, r) => { g.fillStyle = TC.ink; g.font = `700 34px ${TCF.news}`; g.fillText('ULTIME NOTIZIE', 12, 42); g.fillRect(12, 52, w - 24, 2); tcNewsText(g, w, h, r, { top: 58 }); } }), 1500, 150, 0.06, 3.7);
    put(tcPiece(240, 260, { bg: '#ddd6c6', edge: 'cut', seed: s++, paint: (g, w, h) => { for (let y = 3; y < h; y += 6) for (let x = 3; x < w; x += 6) { const d = Math.hypot(x - w * 0.55, y - h * 0.42) / 120, rr = clamp(2.9 - d * 2.2 + vnoise(x * 0.05 + y * 0.03, 4) * 0.8, 0.3, 3.1); g.fillStyle = TC.ink; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); } } }), 1180, 380, -0.08, 3.86);
    [['+', 120, 3.98, 1010, 150], ['×', 110, 4.08, 700, 455], ['=', 120, 4.18, 1640, 640]].forEach(([ch, sz, t, x, y]) => put(tcLetter(ch, sz, sz, TCF.bod, ch === '×' ? TC.red : TC.ink, TC.cream, 'cut', s++, { weight: 900, fill: 0.6 }), x, y, (hash(t) - 0.5) * 0.4, t));
    put(tcPiece(560, 74, { bg: TC.buff, edge: 'cut', seed: s++, paint: (g, w, h) => text(g, 'SCRABrrRRraaNNG', w / 2, h * 0.8, { font: TCF.osw, weight: 700, size: 62, align: 'center', color: TC.ink, ls: 2 }) }), 420, 960, -0.06, 4.3);
    put(tcPiece(300, 64, { bg: TC.ink, edge: 'cut', seed: s++, paint: (g, w, h) => text(g, 'trrrrr  trrrrr', w / 2, h * 0.72, { font: TCF.type, size: 40, align: 'center', color: TC.cream }) }), 1560, 470, 0.32, 4.42);
    // the punk-flyer pile: tickets, headline strips, tape
    const ticket = (lab, sub, bg, seed) => tcPiece(250, 110, { bg, edge: 'cut', seed, perf: 'R', paint: (g, w, h) => {
      g.strokeStyle = 'rgba(30,20,10,0.55)'; g.lineWidth = 1.5; g.strokeRect(9, 9, w - 26, h - 18);
      text(g, lab, (w - 8) / 2, 56, { font: TCF.anton, size: 40, align: 'center', color: TC.ink, ls: 3 });
      text(g, sub, (w - 8) / 2, 86, { font: TCF.type, size: 18, align: 'center', color: 'rgba(30,20,10,0.8)' });
    } });
    put(ticket('ADMIT ONE', 'Nº 004217', TC.pink, s++), 300, 790, 0.18, 4.7);
    put(ticket('ADMIT ONE', 'Nº 004218', TC.green, s++), 1720, 300, -0.22, 4.85);
    put(ticket('SERATA', 'FILA 7 · POSTO 12', TC.buff, s++), 1380, 980, 0.1, 5.0);
    put(tcPiece(380, 96, { bg: TC.red, edge: 'cut', seed: s++, paint: (g, w, h) => text(g, 'EXTRA!', w / 2, h * 0.82, { font: TCF.anton, size: 86, align: 'center', color: TC.cream, ls: 6 }) }), 860, 1010, -0.03, 5.15);
    put(tcPiece(340, 80, { bg: TC.cream, edge: 'torn', seed: s++, paint: (g, w, h) => text(g, 'TONIGHT · LOUD', w / 2, h * 0.75, { font: TCF.osw, weight: 700, size: 52, align: 'center', color: TC.ink, ls: 2 }) }), 160, 400, 1.45, 5.3);
    [[180, 120, 0.7, 4.75], [1560, 120, -0.5, 4.95], [1830, 820, 0.4, 5.2], [130, 1000, -0.3, 5.4]].forEach(([x, y, rot, t]) => put(tcTape(150, 40, s++), x, y, rot, t));
    // the torn red sheet
    put(tcPiece(1680, 500, { bg: TC.red, edge: 'torn', seed: s++, paint: (g, w, h, r) => {
      // poster stock: uneven ink film, a ghost of an earlier print run, fibres
      const vn = lattice(r, 30, 10);
      for (let y = 0; y < h; y += 6) for (let x = 0; x < w; x += 6) { const v = vn(x / 60, y / 50); g.fillStyle = `rgba(${v > 0.5 ? '255,90,60' : '90,0,0'},${Math.abs(v - 0.5) * 0.16})`; g.fillRect(x, y, 6, 6); }
      g.globalAlpha = 0.07; text(g, '1914', w * 0.83, h * 0.98, { font: TCF.wood, size: 300, align: 'center', color: '#5a0000' }); g.globalAlpha = 1;
      for (let k = 0; k < 4000; k++) { g.fillStyle = r() < 0.5 ? 'rgba(120,0,0,0.12)' : 'rgba(255,120,90,0.08)'; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r()); }
    } }), 960, 520, -0.025, TC_T.sheet, { slide: true });
    // TYPOGRAPHIC: eleven found faces
    const TS = [
      ['T', TCF.wood, TC.ink, TC.cream, 'cut', { wood: true }], ['Y', TCF.bod, TC.red, TC.news, 'torn', { weight: 900, news: true }], ['P', TCF.anton, TC.cream, TC.ink, 'cut', {}],
      ['O', TCF.fat, TC.ink, TC.pink, 'cut', { ticket: true, perf: 'R' }], ['G', TCF.sten, TC.ink, TC.buff, 'cut', {}], ['R', TCF.news, TC.ink, TC.news, 'torn', { weight: 700, news: true }],
      ['A', TCF.fat, TC.cream, TC.blue, 'cut', {}], ['P', TCF.wood, TC.red, TC.cream, 'cut', { wood: true }], ['H', TCF.osw, TC.ink, TC.green, 'torn', { weight: 700 }],
      ['I', TCF.type, TC.ink, TC.kraft, 'torn', {}], ['C', TCF.bod, TC.ink, TC.cream, 'cut', { weight: 900, dots: true }],
    ];
    const ws = TS.map((q, i) => (q[0] === 'I' ? 92 : 128 + hash(i * 5.1) * 26)), tot = ws.reduce((a, b) => a + b, 0) + 10 * 12;
    let x = 960 - tot / 2;
    TS.forEach(([ch, f, ink, bg, edge, o], i) => {
      const w = ws[i], h = 190 + hash(i * 2.3) * 34;
      put(tcLetter(ch, w, h, f, ink, bg, edge, s++, o), x + w / 2, 468 + (hash(i * 7.3) - 0.5) * 26, (hash(i * 4.4) - 0.5) * 0.2, TC_T.title + i * 1.5 / TC_FPS, { dy: -200, dx: (i - 5) * 30, word: 'title' });
      x += w + 12;
    });
    // COLLAGE: one strip cut whole from a headline; the credits on a ticket and a newspaper scrap
    put(tcPiece(720, 118, { bg: TC.ink, edge: 'cut', seed: s++, paint: (g, w, h) => text(g, 'COLLAGE', w / 2 + 14, h * 0.83, { font: TCF.anton, size: 104, align: 'center', color: TC.cream, ls: 28 }) }), 960, 688, 0.018, TC_T.strip, { dy: 160 });
    put(tcTape(120, 36, s++), 615, 650, -0.9, TC_T.strip + 0.25);
    put(tcTape(120, 36, s++), 1310, 724, 0.75, TC_T.strip + 0.33);
    put(tcPiece(430, 118, { bg: TC.buff, edge: 'cut', seed: s++, perf: 'L', paint: (g, w, h) => {
      g.strokeStyle = 'rgba(30,20,10,0.55)'; g.lineWidth = 1.5; g.strokeRect(16, 9, w - 25, h - 18);
      text(g, 'parole in libertà', w / 2 + 6, 58, { font: TCF.bod, style: 'italic', weight: 700, size: 42, align: 'center', color: TC.ink });
      text(g, 'FAMILY B · TYPOGRAPHY · Nº 1914', w / 2 + 6, 92, { font: TCF.type, size: 17, align: 'center', color: 'rgba(30,20,10,0.85)' });
    } }), 1470, 880, 0.05, TC_T.end);
    put(tcPiece(560, 66, { bg: TC.news, edge: 'torn', seed: s++, paint: (g, w, h) => text(g, 'after F. T. Marinetti, Zang Tumb Tuuum (1914)', w / 2, h * 0.64, { font: TCF.news, style: 'italic', size: 25, align: 'center', color: TC.ink }) }), 520, 870, -0.04, TC_T.end + 0.25);
    return P;
  }
  // Futurist rules: hairlines and bars fired out from two focal points, printed straight onto the ground.
  const TC_RULES = (() => {
    const R = [], r = rng(1914);
    for (let k = 0; k < 9; k++) R.push({ x: 360, y: 640, a: -0.95 + k * 0.23 + (r() - 0.5) * 0.08, l0: 70, l1: 520 + r() * 700, w: k % 3 === 0 ? 7 : 1.6, t: 1.35 + k * 0.04, red: k === 4 });
    for (let k = 0; k < 7; k++) R.push({ x: 1620, y: 1020, a: -2.9 + k * 0.2 + (r() - 0.5) * 0.06, l0: 60, l1: 600 + r() * 600, w: k % 2 ? 2 : 10, t: 2.5 + k * 0.05, red: k === 3 });
    return R;
  })();

  MG.film({
    id: 'typocollage', dur: 10, poster: 9.4,
    fonts: [['400 80px "Alfa Slab One"', 'ZBPT'], ['400 80px "Abril Fatface"', 'AGUOC'], ['400 80px Anton', 'NTPADMIT ONE SERATA EXTRA! COLLAGE'], ['900 80px "Bodoni Moda"', 'AUY+×=C'], ['italic 700 40px "Bodoni Moda"', 'parole in libertà'],
      ['700 40px "Old Standard TT"', 'MR ULTIME NOTIZIE'], ['400 20px "Old Standard TT"', 'velocità rumore motore'], ['italic 400 20px "Old Standard TT"', 'after F. T. Marinetti, Zang Tumb Tuuum (1914)'], ['400 80px "Black Ops One"', 'UG'], ['700 80px Oswald', 'TUMH SCRABrrRRraaNNG TONIGHT · LOUD'], ['400 40px "Special Elite"', 'trrrrr I FAMILY B · TYPOGRAPHY · Nº 1914 004217 FILA 7 POSTO 12']],
    meta: {
      family: 'B', name: 'Typographic Collage', sub: 'Parole in Libertà', era: '1912 —',
      origin: 'F. T. Marinetti’s Futurist “words-in-freedom” (from 1912; Zang Tumb Tuuum, 1914) broke the line of type into onomatopoeia, mathematical signs and mixed faces flung along diagonals; Dada and Russian Constructivist typographers cut and pasted found print, and 1970s punk flyers (Jamie Reid, Linder) turned ransom-note letters, ticket stubs and tape into a xerox vernacular. Motion designers animate it as stop-motion paste-up, a piece per frame.',
      works: 'F. T. Marinetti, Zang Tumb Tuuum (1914) · Marinetti, Les mots en liberté futuristes (1919) · Kurt Schwitters, Merz collages (1919 —) · Jamie Reid, sleeve and poster art for the Sex Pistols (1977) · Barbara Kruger, Untitled works (1980s)',
      tech: ['Found letters, one face per glyph', 'Torn and scissor-cut edges', 'Stop-motion on twos (12 fps)', 'Diagonal Futurist composition'],
      accent: '#d3261d',
      motionDNA: 'Paste-up on twos: each scrap slaps down in two or three held frames, dropping out of focus and shadow, the camera stepping with it; words are spelled one found letter at a time along diagonals, a vowel stretches by repetition, and a sheet slides in whole to clear space for the title.',
      visualDNA: 'Wood type with grain in the ink, Bodoni and Anton headline cut-outs, newspaper columns, halftone, ticket stubs with perforations and masking tape on a newsprint table, in black, cream and Futurist red with the paper’s white core showing on torn edges.',
      transitions: 'Slap-down, word build, rule burst, sheet slide-over, strip paste and tape',
      implementation: ['After Effects (stop-motion paste-up)', 'Scanned print ephemera', 'Canvas 2D', 'Web Audio'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const W = 1920, H = 1080, r = rng(1977);
      // the table: newsprint ground with a ghost of an old page
      const bg = offscreen(W + 600, H + 600), g = bg.getContext('2d');
      g.fillStyle = TC.ground; g.fillRect(0, 0, bg.width, bg.height);
      const vn = lattice(r, 40, 24), cl = offscreen(220, 135), cg = cl.getContext('2d'), cd = cg.createImageData(220, 135);
      for (let y = 0; y < 135; y++) for (let x = 0; x < 220; x++) { const v = vn(x / 8, y / 8), i = (y * 220 + x) * 4; cd.data[i] = 150; cd.data[i + 1] = 120; cd.data[i + 2] = 70; cd.data[i + 3] = v * 40; }
      cg.putImageData(cd, 0, 0); g.filter = 'blur(12px)'; g.drawImage(cl, 0, 0, bg.width, bg.height); g.filter = 'none';
      g.save(); g.globalAlpha = 0.055; g.translate(300, 300);
      g.fillStyle = TC.ink; g.font = `700 120px ${TCF.news}`; g.fillText('IL GIORNALE', 120, 160);
      tcNewsText(g, W, H, r, { top: 200, fs: 16, cols: 9 });
      g.restore();
      for (let k = 0; k < 16000; k++) { g.fillStyle = r() < 0.5 ? 'rgba(90,70,40,0.06)' : 'rgba(255,255,250,0.2)'; g.fillRect(r() * bg.width, r() * bg.height, 1 + r() * 2, 1 + r()); }
      return { bg, P: tcBuild() };
    },
    draw(c, t, W, H, st) {
      // stop-motion: everything, camera included, advances on twos
      const tq = Math.floor(t * TC_FPS + 1e-6) / TC_FPS, fr = Math.round(tq * TC_FPS);
      const cs = Math.exp(kf(tq, [[0, Math.log(1.3)], [1.35, Math.log(1.26)], [1.9, Math.log(1.18)], [2.5, Math.log(1.18)], [3.1, Math.log(1.14)], [3.6, Math.log(1.14)], [4.6, Math.log(1.0)], [7.5, Math.log(1.0)], [10, Math.log(1.035), E.ioS]]));
      const cx = kf(tq, [[0, 620], [1.35, 600], [1.9, 620], [2.5, 700], [3.1, 1240], [3.6, 1220], [4.6, 960]]);
      const cy = kf(tq, [[0, 330], [1.35, 360], [1.9, 650], [2.5, 680], [3.1, 600], [3.6, 560], [4.6, 540]]);
      // tiny hand-placed camera jitter per frame, and a bump on every landing
      let bump = 0;
      st.P.forEach(p => { const k = Math.round((tq - p.t) * TC_FPS); if (k === 0) bump = Math.max(bump, p.slide ? 1 : 0.5); });
      const jx = (hash(fr * 1.7) - 0.5) * 2.4, jy = (hash(fr * 2.9) - 0.5) * 2.4 + bump * 3;
      c.save();
      c.translate(960 + jx, 540 + jy); c.rotate(vnoise(tq * 0.3, 5) * 0.008); c.scale(cs, cs); c.translate(-cx, -cy);
      c.drawImage(st.bg, -300, -300);
      // Futurist rules fire out on the beat
      TC_RULES.forEach(R => {
        const u = seg(tq, R.t, R.t + 2 / TC_FPS); if (u <= 0) return;
        const l = lerp(R.l0, R.l1, E.outQ(u)), ca = Math.cos(R.a), sa = Math.sin(R.a);
        c.strokeStyle = R.red ? TC.red : TC.ink; c.lineWidth = R.w; c.lineCap = 'butt';
        c.beginPath(); c.moveTo(R.x + ca * R.l0, R.y + sa * R.l0); c.lineTo(R.x + ca * l, R.y + sa * l); c.stroke();
      });
      // the pieces: two frames in the air, then down; shadows tighten as they land
      st.P.forEach(p => {
        const k = Math.round((tq - p.t) * TC_FPS);
        let off, lift, sc = 1;
        if (p.slide) {
          if (k < -4) return;
          const u = [1.25, 0.62, 0.22, 0.04, 0][Math.min(4, k + 4)];
          off = [u * 1900, -u * 60]; lift = k < 0 ? 0.35 : 0; if (k === 0) sc = 1.006;
        } else {
          if (k < -2) return;
          const u = k === -2 ? 1 : k === -1 ? 0.28 : 0;
          off = [p.dx * u, p.dy * u]; lift = u; sc = 1 + 0.14 * u + (k === 0 ? 0.015 : 0);
        }
        const S = p.spr, rot = p.rot + (k < 0 && !p.slide ? (k === -2 ? 0.22 : 0.06) * (p.dx > 0 ? 1 : -1) : 0);
        c.save(); c.translate(p.x + off[0], p.y + off[1]); c.rotate(rot); c.scale(sc, sc);
        if (S.sh) { c.globalAlpha = 0.34 - lift * 0.14; c.drawImage(S.sh, -S.w / 2 - S.pad + 4 + lift * 30, -S.h / 2 - S.pad + 6 + lift * 40); c.globalAlpha = 1; }
        c.drawImage(S.cv, -S.w / 2 - S.pad, -S.h / 2 - S.pad);
        c.restore();
      });
      c.restore();
      vignette(c, W, H, 0.3, '40,25,10');
      const fi = 1 - seg(t, 0, 0.25);
      if (fi > 0) { c.fillStyle = `rgba(20,14,8,${fi})`; c.fillRect(0, 0, W, H); }
      grain(c, W, H, tq, 0.04, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.9;
      const P = MG.films.typocollage._st ? MG.films.typocollage._st.P : tcBuild();
      // every scrap: a paper slap (body thump + crisp edge), tape a short rip-and-press
      P.forEach((p, i) => {
        const pan = clamp((p.x / 1920 - 0.5) * 0.8, -0.5, 0.5), big = p.spr.w * p.spr.h > 60000;
        if (p.spr.tape) {
          A.noise(p.t - 0.12, { type: 'bandpass', f: 1800, f2: 4200, q: 1.2, dur: 0.12, g: 0.1, pan });
          A.noise(p.t, { type: 'lowpass', f: 900, dur: 0.05, g: 0.12, pan });
          return;
        }
        if (p.slide) {
          A.whoosh(p.t - 0.36, 0.4, { f1: 300, f2: 2400, g: 0.24 });
          A.impact(p.t, 0.55, { rev: 0.25 });
          return;
        }
        A.noise(p.t - 0.09, { type: 'bandpass', f: 1200 + hash(i) * 1500, q: 0.8, dur: 0.08, g: 0.05, swell: 0.7, pan });
        A.noise(p.t, { type: 'highpass', f: 2500, dur: 0.03, g: big ? 0.22 : 0.16, pan });
        A.noise(p.t, { type: 'lowpass', f: 700, dur: 0.07, g: big ? 0.3 : 0.2, pan });
        A.osc(p.t, { f: 120, f2: 60, glide: 0.05, dur: 0.08, g: 0.12 });
      });
      // the words sound out: ZANG a struck sheet of metal, TUMB a drum, TUUUM a stretched boom
      const intonarumori = (t, f, f2, dur, g = 0.08) => { A.osc(t, { type: 'sawtooth', f, f2, glide: dur, dur, g, lp: 900, lp2: 400, q: 6, a: 0.04, vib: [13, 8], crush: true }); A.noise(t, { type: 'bandpass', f: f * 4, q: 3, dur, g: g * 0.6, swell: 0.4 }); };
      A.bell(1.17, 330, { ratios: [1, 1.48, 2.37, 3.9, 5.2], g: 0.14, dur: 1.4, rev: 0.4 });
      A.noise(1.17, { type: 'highpass', f: 5000, dur: 0.6, g: 0.07 });
      [1.5, 1.75, 2.0, 2.25].forEach((t, i) => A.kick(t, 0.55 + i * 0.1, { f: 110 - i * 8, f2: 40, dur: 0.35 }));
      intonarumori(2.55, 70, 55, 1.4, 0.1);
      [2.55, 2.72, 2.89, 3.06, 3.23].forEach((t, i) => A.osc(t, { type: 'triangle', f: 98 - i * 3, f2: 49, glide: 0.4, dur: 0.5, g: 0.18 }));
      A.impact(3.4, 0.6);
      // the crackler and the howler of Russolo's noise orchestra under the pile-up
      intonarumori(3.65, 220, 440, 0.9, 0.05); intonarumori(4.3, 160, 120, 0.5, 0.05);
      for (let k = 0; k < 18; k++) A.noise(3.7 + k * 0.05, { type: 'bandpass', f: 2600 + hash(k) * 2000, q: 4, dur: 0.02, g: 0.06 });
      // punk: four-on-the-floor and a fuzz bass from the tickets to the end
      const bpm = 168, b = 60 / bpm;
      for (let i = 0; i < 26; i++) {
        const t = 4.6 + i * b / 2; if (t > 9.7) break;
        if (i % 2 === 0) A.kick(t, 0.5); if (i % 4 === 2) A.snare(t, 0.32, { rev: 0.1 }); A.hat(t + b / 4, 0.05);
        const root = [40, 40, 43, 45, 40, 47, 45, 43][(i >> 2) % 8];
        A.osc(t, { type: 'sawtooth', f: midi(root), dur: b * 0.45, g: 0.09, lp: 900, crush: true, hold: true });
      }
      // the title lands: a power chord and a crash
      A.chord(TC_T.strip, [40, 47, 52, 59], { type: 'sawtooth', dur: 1.6, g: 0.05, lp: 2400, crush: true, spread: 8 });
      A.noise(TC_T.strip, { type: 'highpass', f: 4500, dur: 1.6, g: 0.1, rev: 0.4 });
      A.chord(9.0, [40, 47, 52], { type: 'sawtooth', dur: 0.9, g: 0.04, lp: 1600, crush: true });
    },
  });
  /* =====================================================================
     LIMITED ANIMATION — on threes, 8 drawings a second: a held cel of a
     little man in a pork-pie hat whose mouth alone moves; a cut to his
     walk cycle in front of a background that repeats every few steps; he
     stops, his head is swapped to face us, swapped again for a take, and
     he zips out leaving his hat in the air; a pop-on title card
     ===================================================================== */
  const LA = { ink: '#1f1b18', mustard: '#e2ae3a', teal: '#3d8c86', coral: '#df5f3c', cream: '#f3e7cb', olive: '#8d9a3c', pink: '#eaa69c', sky: '#a5cbc6', navy: '#283350', skin: '#f2c8a0', wall: '#e9b949', plum: '#7d4a63' };
  const LA_FPS = 8, LA_REG = [7, -5];
  const LAF = { title: 'Shrikhand, "Josefin Sans", serif', sans: '"Josefin Sans", "Futura", sans-serif' };
  const LA_T = { walk: 2.5, stop: 5.75, front: 6.125, take: 6.5, lean: 6.875, zip: 7.0, hatGo: 7.25, card: 7.5, head: 8.5 };
  const LA_SPEED = 350, LA_CS = 1.25; // stance foot travels 140 px per half cycle at this scale: no foot slide
  // Dialogue for the held cel: one mouth drawing per three frames.
  const LA_TALK = 'MMAEOAMMEAOAEMMMOAEAMMMMM';
  const LA_TADA = { 8.75: 'A', 8.875: 'E', 9.0: 'A', 9.125: 'O', 9.25: 'M' };
  const laq = t => Math.floor(t * LA_FPS + 1e-6) / LA_FPS;

  // Flat colour, drawn off-register from its line: fill shifted, line true.
  function laShape(g, path, fill, o = {}) {
    if (fill) { g.save(); g.translate(LA_REG[0] * (o.reg ?? 1), LA_REG[1] * (o.reg ?? 1)); g.fillStyle = fill; path(g); g.fill(); g.restore(); }
    if (o.line !== false) { g.strokeStyle = LA.ink; g.lineWidth = o.lw || 3.4; g.lineCap = 'round'; g.lineJoin = 'round'; path(g); g.stroke(); }
  }
  const laPoly = pts => g => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
  const laLine = (g, pts, lw = 3.4) => { g.strokeStyle = LA.ink; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); };
  // Gouache dry-brush texture over a filled area (baked backgrounds only).
  function laBrush(g, x, y, w, h, r, col = '255,255,255', a = 0.08) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    for (let k = 0; k < (w * h) / 900; k++) {
      const px = x + r() * w, py = y + r() * h, l = 20 + r() * 80;
      g.strokeStyle = `rgba(${r() < 0.5 ? col : '0,0,0'},${a * r()})`; g.lineWidth = 1 + r() * 4;
      g.beginPath(); g.moveTo(px, py); g.lineTo(px + l, py + (r() - 0.5) * 6); g.stroke();
    }
    g.restore();
  }
  // The asterisk-star UPA scattered over walls and skies; two drawings so it can boil.
  function laStar(g, x, y, r, v = 0, lw = 2.4) {
    for (let k = 0; k < 3; k++) { const a = k * PI / 3 + v * 0.35; laLine(g, [[x - Math.cos(a) * r, y - Math.sin(a) * r], [x + Math.cos(a) * r, y + Math.sin(a) * r]], lw); }
  }

  // Heads, drawn around their own centre.
  function laHead(g, kind, mouth, eyes) {
    if (kind === 'side') {
      const skull = g => { g.beginPath(); g.moveTo(-48, -20); g.quadraticCurveTo(-52, -62, 0, -64); g.quadraticCurveTo(46, -62, 50, -20); g.lineTo(50, 30); g.quadraticCurveTo(40, 62, 0, 62); g.quadraticCurveTo(-46, 60, -50, 20); g.closePath(); };
      laShape(g, skull, LA.skin);
      laShape(g, laPoly([[42, -18], [104, 24], [40, 32]]), LA.skin);
      g.fillStyle = LA.skin; g.fillRect(36, -14, 10, 40); // hide the skull line under the nose root
      laLine(g, [[42, -18], [104, 24], [40, 32]]);
      g.strokeStyle = LA.ink; g.lineWidth = 3; g.beginPath(); g.arc(-14, 6, 11, -PI * 0.6, PI * 0.6); g.stroke();
      laLine(g, [[-48, -12], [-58, -20]], 2.6); laLine(g, [[-49, -2], [-60, -6]], 2.6);
      if (eyes === 'blink') laLine(g, [[12, -10], [32, -10]], 3);
      else { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(22, -10, 11, 14, 0, 0, TAU); g.fill(); g.lineWidth = 2.6; g.stroke(); g.fillStyle = LA.ink; g.beginPath(); g.arc(27, -8, 5, 0, TAU); g.fill(); }
      laLine(g, [[8, -32], [36, -36]], 3);
      laMouth(g, 46, 46, mouth, 1);
      return;
    }
    // front view, used for the swap and the take
    const take = kind === 'take';
    laShape(g, g => { g.beginPath(); g.ellipse(0, 0, 58, 64, 0, 0, TAU); }, LA.skin);
    [-1, 1].forEach(s => { laShape(g, g => { g.beginPath(); g.ellipse(s * 62, 6, 10, 15, 0, 0, TAU); }, LA.skin, { reg: 0.5 }); });
    laShape(g, g => { g.beginPath(); g.ellipse(0, 0, 58, 64, 0, 0, TAU); }, null);
    if (take) {
      [-1, 1].forEach(s => { g.fillStyle = '#fff'; g.beginPath(); g.arc(s * 24, -16, 23, 0, TAU); g.fill(); g.strokeStyle = LA.ink; g.lineWidth = 3; g.stroke(); g.fillStyle = LA.ink; g.beginPath(); g.arc(s * 22, -14, 4.5, 0, TAU); g.fill(); });
      laLine(g, [[-44, -52], [-12, -58]], 3); laLine(g, [[12, -58], [44, -52]], 3);
    } else if (eyes === 'blink') { laLine(g, [[-32, -8], [-12, -8]], 3); laLine(g, [[12, -8], [32, -8]], 3); }
    else {
      [-1, 1].forEach(s => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(s * 21, -8, 10, 13, 0, 0, TAU); g.fill(); g.strokeStyle = LA.ink; g.lineWidth = 2.6; g.stroke(); g.fillStyle = LA.ink; g.beginPath(); g.arc(s * 21 + 2, -6, 4.5, 0, TAU); g.fill(); });
      laLine(g, [[-34, -30], [-10, -28]], 3); laLine(g, [[10, -28], [34, -30]], 3);
    }
    laShape(g, g => { g.beginPath(); g.ellipse(0, 12, 13, 20, 0, 0, TAU); }, LA.coral, { reg: 0.6 });
    laMouth(g, 0, 44, take ? 'O' : mouth, take ? 1.5 : 1);
  }
  function laMouth(g, x, y, m, k) {
    g.save(); g.translate(x, y); g.scale(k, k);
    if (m === 'M') laLine(g, [[-12, -1], [12, 1]], 3);
    else if (m === 'A') { g.fillStyle = LA.ink; g.beginPath(); g.ellipse(0, 2, 13, 11, 0, 0, TAU); g.fill(); g.fillStyle = LA.coral; g.beginPath(); g.ellipse(2, 7, 7, 4, 0, 0, TAU); g.fill(); }
    else if (m === 'E') { g.fillStyle = LA.ink; rrect(g, -15, -4, 30, 11, 5); g.fill(); g.fillStyle = '#fff'; g.fillRect(-11, -3, 22, 3.5); }
    else if (m === 'O') { g.fillStyle = LA.ink; g.beginPath(); g.ellipse(0, 2, 8, 10, 0, 0, TAU); g.fill(); }
    g.restore();
  }
  function laHat(g, lift = 0) {
    g.save(); g.translate(0, -lift);
    laShape(g, laPoly([[-44, -58], [-38, -104], [40, -104], [46, -58]]), LA.navy);
    g.fillStyle = LA.coral; g.fillRect(-43 + LA_REG[0], -74 + LA_REG[1], 88, 13);
    laLine(g, [[-64, -57], [66, -57]], 5);
    g.restore();
  }
  // The whole figure, feet at the origin. P: { phase | pose, head, mouth, eyes, hat, lean }
  function laChar(g, P) {
    let bob = 0, feet, arms;
    if (P.phase != null) {
      const p = P.phase;
      const leg = q => { q = (q % 1 + 1) % 1; if (q < 0.5) return [lerp(70, -70, q / 0.5), 0]; const u = (q - 0.5) / 0.5; return [lerp(-70, 70, E.ioS(u)), -Math.sin(PI * u) * 36]; };
      feet = [leg(p), leg(p + 0.5)];
      bob = -9 * (0.5 - 0.5 * Math.cos(4 * PI * p));
      const sw = 0.42 * Math.sin(TAU * p);
      arms = [sw, -sw];
    } else if (P.pose === 'lean') { feet = [[-50, 0], [30, -20]]; arms = [-1.1, -0.9]; bob = 6; }
    else { feet = [[-16, 0], [22, 0]]; arms = [0.08, -0.06]; }
    g.save();
    if (P.lean) g.rotate(P.lean);
    const hip = [4, -200 + bob], sh = [22, -352 + bob], shB = [-14, -356 + bob];
    const legLine = (f, far) => {
      const mid = [(hip[0] + f[0]) / 2, (hip[1] + f[1]) / 2], knee = [mid[0] + 16 + (f[1] < 0 ? 16 : 0), mid[1]];
      laLine(g, [[hip[0] + (far ? -10 : 10), hip[1]], knee, f], 4);
      g.fillStyle = far ? '#3a3330' : LA.ink; g.beginPath(); g.moveTo(f[0] - 10, f[1]); g.lineTo(f[0] + 36, f[1]); g.lineTo(f[0] + 30, f[1] - 15); g.lineTo(f[0] - 6, f[1] - 17); g.closePath(); g.fill();
    };
    const arm = (s, a, far) => {
      const L = 160, hand = [s[0] + Math.sin(a) * L, s[1] + Math.cos(a) * L], el = [(s[0] + hand[0]) / 2 + 10 * Math.cos(a), (s[1] + hand[1]) / 2 - 6];
      laLine(g, [s, el, hand], 4);
      laShape(g, g => { g.beginPath(); g.arc(hand[0], hand[1], 13, 0, TAU); }, far ? '#d9caa8' : LA.cream, { reg: 0.5, lw: 3 });
    };
    // far limbs first, then the coat, then the near limbs, then the head on its own cel
    arm(shB, arms[1], true); legLine(feet[1], true);
    const coat = laPoly([[-34, -384 + bob], [36, -386 + bob], [66, -168 + bob], [-70, -172 + bob]]);
    laShape(g, coat, LA.teal);
    laShape(g, laPoly([[-6, -384 + bob], [20, -384 + bob], [7, -340 + bob]]), '#fff', { reg: 0.4, lw: 2.6 });
    laShape(g, laPoly([[4, -364 + bob], [11, -364 + bob], [14, -300 + bob], [7, -290 + bob], [1, -300 + bob]]), LA.coral, { reg: 0.4, lw: 2.4 });
    [-290, -240].forEach(y => { g.fillStyle = LA.ink; g.beginPath(); g.arc(-14, y + bob, 4, 0, TAU); g.fill(); });
    legLine(feet[0], false); arm(sh, arms[0], false);
    g.save(); g.translate(10, -454 + bob);
    laHead(g, P.head || 'side', P.mouth || 'M', P.eyes);
    if (P.hat !== false) laHat(g, P.hatLift || 0);
    g.restore();
    g.restore();
  }

  MG.film({
    id: 'limited', dur: 10, poster: 9.5,
    fonts: [['400 160px Shrikhand', 'Limited'], ['700 60px "Josefin Sans"', 'ANIMATION FAMILY C 2D'], ['600 30px "Josefin Sans"', 'held cels · moving mouths · on threes after UPA (1950) & 1960s TV']],
    meta: {
      family: 'C', name: 'Limited Animation', sub: 'Held Cels, Moving Mouths', era: '1950 —',
      origin: 'UPA (United Productions of America) broke with Disney’s full animation in Gerald McBoing-Boing (1950, Oscar 1951): flat modernist backgrounds, colour laid off-register from the line, stylised characters and only the drawings a gag needed. Hanna-Barbera turned that economy into a television system from The Ruff and Reddy Show (1957) onward — held bodies with separate mouth cels, swapped heads, walk cycles over repeating pans, timing on twos and threes.',
      works: 'Gerald McBoing-Boing (UPA, Robert Cannon, 1950) · Rooty Toot Toot (UPA, John Hubley, 1951) · The Ruff and Reddy Show (Hanna-Barbera, 1957) · The Huckleberry Hound Show (Hanna-Barbera, 1958) · The Flintstones (Hanna-Barbera, 1960)',
      tech: ['Held cels with separate mouth drawings', 'Swap heads, no in-betweens', 'Walk cycle over a repeating pan', 'Timing on threes (8 drawings/s)'],
      accent: '#df5f3c',
      motionDNA: 'Eight drawings a second, many of them held: a body freezes while only a mouth cel changes, a head is swapped for another view in one frame, a walk cycle repeats over a background that steps past and visibly repeats, and a zip-out replaces motion with a puff and speed lines.',
      visualDNA: 'Flat mid-century colour fields in mustard, teal and coral printed slightly off-register from thin black line, geometric characters with triangle noses and pork-pie hats, asterisk stars and lollipop trees, and gouache dry-brush on the backgrounds.',
      transitions: 'Hard cut, held pose, head swap, zip-out with dust puff, pop-on title card',
      implementation: ['Cel animation (exposure sheet on threes)', 'Toon Boom Harmony (cut-out rigs)', 'Canvas 2D', 'Web Audio'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const W = 1920, H = 1080, r = rng(1950);
      // scene 1: a room with almost nothing in it
      const room = offscreen(W, H), g = room.getContext('2d');
      g.fillStyle = LA.wall; g.fillRect(0, 0, W, H); laBrush(g, 0, 0, W, 960, r, '255,240,200', 0.12);
      g.fillStyle = LA.coral; g.fillRect(0, 960, W, 120); laBrush(g, 0, 960, W, 120, r, '255,200,170', 0.1);
      laLine(g, [[0, 962], [700, 958], [1400, 963], [1920, 960]], 3.4);
      laShape(g, laPoly([[160, 170], [520, 176], [516, 470], [158, 466]]), LA.sky, { line: false });
      laBrush(g, 167, 165, 360, 300, r, '255,255,255', 0.1);
      laLine(g, [[150, 180], [512, 172], [520, 478], [156, 474], [150, 180]]); laLine(g, [[334, 176], [338, 476]]); laLine(g, [[154, 320], [516, 322]]);
      laLine(g, [[130, 488], [540, 486]], 6);
      laShape(g, g => { g.beginPath(); g.arc(430, 250, 34, 0, TAU); }, LA.cream, { line: false });
      laShape(g, laPoly([[640, 250], [820, 246], [824, 380], [642, 386]]), LA.plum);
      laShape(g, g => { g.beginPath(); g.arc(712, 316, 30, 0, TAU); }, LA.mustard, { reg: -0.6 });
      laLine(g, [[680, 362], [760, 290], [800, 350]], 3);
      laLine(g, [[732, 246], [732, 200]], 2); laLine(g, [[732, 200], [690, 250]], 2); laLine(g, [[732, 200], [774, 248]], 2);
      // lamp
      laLine(g, [[600, 958], [602, 560]], 4); laLine(g, [[560, 960], [644, 960]], 6);
      laShape(g, laPoly([[540, 560], [664, 560], [630, 470], [574, 470]]), LA.teal);
      [[900, 140], [1060, 300], [960, 520], [1500, 120], [1760, 360], [1840, 700], [300, 640], [120, 820], [860, 760]].forEach(([x, y], i) => laStar(g, x, y, 14, i, 2.2));
      // scene 2: a street tile that repeats every LA_TW pixels
      const TW = 1000, tile = offscreen(TW, H), tg = tile.getContext('2d');
      tg.fillStyle = LA.cream; tg.fillRect(0, 0, TW, H); laBrush(tg, 0, 0, TW, 760, r, '255,250,230', 0.1);
      tg.fillStyle = LA.mustard; tg.beginPath(); tg.arc(840, 150, 64, 0, TAU); tg.fill();
      tg.strokeStyle = LA.ink; tg.lineWidth = 3; tg.beginPath(); tg.arc(834, 156, 64, 0.3, 2.4); tg.stroke();
      const bld = [[30, 330, 200, LA.teal], [250, 470, 150, LA.pink], [420, 260, 180, LA.plum], [620, 430, 140, LA.olive], [780, 320, 190, LA.coral]];
      bld.forEach(([x, y, w, col], i) => {
        tg.fillStyle = col; tg.fillRect(x + 8, y - 6, w, 760 - y + 6); laBrush(tg, x + 8, y - 6, w, 760 - y, r, '255,255,255', 0.12);
        laLine(tg, [[x, 760], [x, y], [x + w, y + (i % 2 ? 4 : -3)], [x + w, 760]], 3.2);
        const cols = Math.max(2, Math.floor(w / 62)), rows = Math.floor((760 - y - 90) / 92);
        for (let rr = 0; rr < rows; rr++) for (let cc = 0; cc < cols; cc++) {
          const wx = x + 22 + cc * ((w - 30) / cols), wy = y + 40 + rr * 92;
          tg.fillStyle = (cc + rr + i) % 3 ? LA.cream : LA.mustard; tg.fillRect(wx + 6, wy - 5, 30, 46);
          laLine(tg, [[wx, wy], [wx + 30, wy], [wx + 30, wy + 46], [wx, wy + 46], [wx, wy]], 2.4);
        }
      });
      // lollipop trees and a lamp post
      [[230, 640, LA.olive], [700, 600, LA.teal]].forEach(([x, y, col]) => {
        laLine(tg, [[x, 800], [x + 2, y + 40]], 4);
        laShape(tg, g => { g.beginPath(); g.arc(x, y, 62, 0, TAU); }, col);
        laLine(tg, [[x - 20, y + 10], [x + 4, y - 18], [x + 26, y + 6]], 2.4);
      });
      laLine(tg, [[520, 820], [520, 520], [570, 500]], 4); laShape(tg, laPoly([[556, 498], [594, 498], [586, 520], [564, 520]]), LA.mustard, { lw: 3 });
      tg.fillStyle = LA.coral; tg.fillRect(0, 760, TW, 320); laBrush(tg, 0, 760, TW, 320, r, '255,210,180', 0.12);
      tg.fillStyle = '#c9512f'; tg.fillRect(0, 1010, TW, 70);
      laLine(tg, [[0, 760], [TW, 760]], 3.4); laLine(tg, [[0, 1010], [TW, 1010]], 3);
      for (let x = 60; x < TW; x += 250) laLine(tg, [[x, 1010], [x - 40, 1080]], 2.4);
      [[160, 200], [480, 120], [660, 190], [960, 80]].forEach(([x, y], i) => laStar(tg, x, y, 12, i, 2.2));
      // scene 4: title-card shapes
      const card = offscreen(W, H), cg = card.getContext('2d');
      cg.fillStyle = LA.coral; cg.fillRect(0, 0, W, H); laBrush(cg, 0, 0, W, H, r, '255,200,170', 0.1);
      return { room, tile, TW, card };
    },
    draw(c, t, W, H, st) {
      const tq = laq(t), fr = Math.round(tq * LA_FPS);
      if (tq < LA_T.walk) {
        // ----- held cel: only the mouth (and one blink) moves -----
        c.drawImage(st.room, 0, 0);
        const i = Math.floor((tq - 0.25) * LA_FPS), m = tq < 0.25 ? 'M' : LA_TALK[Math.min(LA_TALK.length - 1, i)] || 'M';
        c.save(); c.translate(1260, 1110); c.scale(-1.6, 1.6);
        laChar(c, { head: 'side', mouth: m, eyes: tq >= 1.5 && tq < 1.625 ? 'blink' : 'open' });
        c.restore();
      } else if (tq < LA_T.card) {
        // ----- the street: a walk cycle over a stepping, repeating pan -----
        const walkT = Math.min(tq, LA_T.stop) - LA_T.walk;
        const off = walkT * LA_SPEED;
        const x0 = -((off % st.TW) + st.TW) % st.TW;
        for (let k = 0; k < 3; k++) c.drawImage(st.tile, x0 + k * st.TW, 0);
        const P = { x: 760, y: 940 };
        c.save(); c.translate(P.x, P.y); c.scale(LA_CS, LA_CS);
        if (tq < LA_T.stop) laChar(c, { phase: walkT / 1.0, head: 'side', mouth: 'M' });
        else if (tq < LA_T.front) laChar(c, { head: 'side', mouth: 'M' });
        else if (tq < LA_T.take) laChar(c, { head: 'front', mouth: tq >= 6.25 && tq < 6.375 ? 'O' : 'M', eyes: tq >= 6.375 ? 'open' : 'open' });
        else if (tq < LA_T.lean) {
          laChar(c, { head: 'take', hatLift: 46 });
          // accent lines around the take, held
          [[-0.9, 150], [-0.5, 168], [-0.1, 170], [0.3, 160]].forEach(([a, R]) => { const cx = 10, cy = -470; laLine(c, [[cx + Math.sin(a) * R, cy - Math.cos(a) * R], [cx + Math.sin(a) * (R + 44), cy - Math.cos(a) * (R + 44)]], 4); });
        } else if (tq < LA_T.zip) laChar(c, { pose: 'lean', head: 'side', mouth: 'E', lean: -0.14 });
        if (tq >= LA_T.zip) {
          // zip-out: the man is gone; speed lines, a held dust puff and the hat left hanging
          const k = fr - Math.round(LA_T.zip * LA_FPS);
          if (k < 2) for (let i = 0; i < 6; i++) { const y = -420 + i * 70; laLine(c, [[-20 + i * 14, y], [1300, y + (i - 3) * 4]], i % 2 ? 3 : 5); }
          if (k < 3) {
            // one outline around the whole cloud: stroke every lobe fat, then fill them all over the inner lines
            const puff = (x, y, R) => {
              const lobes = g => { g.beginPath(); for (let j = 0; j < 5; j++) { const lx = x + Math.cos(j * 1.25) * R * 0.8, ly = y + Math.sin(j * 1.25) * R * 0.45; g.moveTo(lx + R * 0.6, ly); g.arc(lx, ly, R * 0.6, 0, TAU); } };
              c.strokeStyle = LA.ink; c.lineWidth = 6.5; lobes(c); c.stroke();
              c.fillStyle = LA.cream; lobes(c); c.fill();
              c.save(); c.globalAlpha = 0.5; c.translate(LA_REG[0], LA_REG[1]); c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(x - R * 0.2, y - R * 0.15, R * 0.3, 0, TAU); c.fill(); c.restore();
            };
            puff(-40, -30, 60 + k * 14); puff(40, -70, 44 + k * 10);
          }
          if (tq < LA_T.hatGo) { c.save(); c.translate(10, -454); laHat(c, 46); laLine(c, [[-30, -170], [-20, -190]], 3); laLine(c, [[30, -170], [20, -190]], 3); c.restore(); }
          else if (tq < LA_T.hatGo + 0.125) { for (let i = 0; i < 3; i++) laLine(c, [[30, -540 + i * 26], [1300, -540 + i * 26]], 3); }
        }
        c.restore();
      } else {
        // ----- pop-on title card: elements cut in, no in-betweens -----
        c.drawImage(st.card, 0, 0);
        const on = x => tq >= x;
        if (on(7.5)) {
          laShape(c, g => { g.beginPath(); g.moveTo(300, 300); g.bezierCurveTo(520, 160, 1240, 140, 1560, 260); g.bezierCurveTo(1720, 330, 1680, 760, 1480, 820); g.bezierCurveTo(1100, 900, 520, 880, 330, 790); g.bezierCurveTo(170, 700, 160, 400, 300, 300); g.closePath(); }, LA.cream, { lw: 3.4 });
        }
        if (on(7.625)) { c.fillStyle = LA.teal; c.fillRect(110, 680, 360, 260); laLine(c, [[104, 690], [462, 684], [468, 946], [110, 940], [104, 690]], 3.2); }
        if (on(7.75)) { laShape(c, g => { g.beginPath(); g.arc(1640, 230, 96, 0, TAU); }, LA.mustard, { lw: 3.4 }); }
        const boil = Math.floor(tq * LA_FPS / 3) % 2;
        if (on(7.875)) [[200, 160], [960, 110], [1800, 520], [1220, 960], [640, 990], [1780, 900], [120, 560]].forEach(([x, y], i) => laStar(c, x + boil * 3, y - boil * 2, 20, i + boil, 3));
        // the title, one letter per drawing
        const word = 'Limited';
        c.font = `400 200px ${LAF.title}`;
        const ws = [...word].map(ch => c.measureText(ch).width), tot = ws.reduce((a, b) => a + b, 0);
        let x = 900 - tot / 2;
        [...word].forEach((ch, i) => {
          if (on(7.875 + i * 0.125)) {
            const y = 520 + (i % 2 ? 6 : -6);
            text(c, ch, x + LA_REG[0] + 2, y + LA_REG[1] + 6, { font: LAF.title, size: 200, color: LA.coral });
            text(c, ch, x, y, { font: LAF.title, size: 200, color: LA.ink });
          }
          x += ws[i];
        });
        if (on(8.875)) text(c, 'ANIMATION', 900, 640, { font: LAF.sans, weight: 700, size: 66, align: 'center', color: LA.navy, ls: 30 });
        if (on(9.125)) text(c, 'held cels · moving mouths · on threes', 900, 718, { font: LAF.sans, weight: 600, size: 32, align: 'center', color: LA.ink, ls: 2 });
        if (on(9.25)) {
          text(c, 'FAMILY C · 2D ANIMATION', 110, 1030, { font: LAF.sans, weight: 700, size: 22, color: LA.cream, ls: 4 });
          text(c, 'after UPA (1950) & 1960s TV', 1810, 1030, { font: LAF.sans, weight: 600, size: 24, align: 'right', color: LA.cream, ls: 2 });
        }
        // and he pops back in, just a head on a cel
        if (on(LA_T.head)) {
          const m = Object.keys(LA_TADA).reduce((acc, k) => (tq >= +k ? LA_TADA[k] : acc), 'M');
          c.save(); c.translate(1530, 600); c.scale(1.25, 1.25); c.rotate(0.08);
          laHead(c, 'front', m, tq >= 9.625 && tq < 9.75 ? 'blink' : 'open'); laHat(c, 0);
          c.restore();
        }
      }
      // grain frozen per drawing, like a photographed cel
      grain(c, W, H, tq, 0.04, 'overlay');
      vignette(c, W, H, 0.18, '40,20,10');
    },
    score(A) {
      A.bus.gain.value = 0.9;
      const b = 0.5; // 120 bpm, one step a beat
      // the voice: a muted-trombone gibberish, one syllable per open mouth drawing
      const formant = { A: 1300, E: 1900, O: 700 };
      const voice = (t, v, f = 190) => {
        A.osc(t, { type: 'sawtooth', f, f2: f * (0.9 + hash(t) * 0.25), glide: 0.12, dur: 0.12, g: 0.11, lp: formant[v], q: 5, a: 0.01, vib: [7, 4] });
        A.noise(t, { type: 'bandpass', f: formant[v] * 1.8, q: 2, dur: 0.03, g: 0.03 });
      };
      [...LA_TALK].forEach((m, i) => { if (m !== 'M') voice(0.25 + i / LA_FPS, m, 180 + (i % 4) * 14); });
      Object.entries(LA_TADA).forEach(([t, m]) => { if (m !== 'M') voice(+t, m, 220); });
      // a small jazz combo: walking bass, brushes, vibes
      const vib = (t, m, g = 0.05, dur = 1.6) => A.bell(t, midi(m), { ratios: [1, 4, 10], g, dur, rev: 0.45 });
      const bassLine = [45, 48, 50, 52, 53, 52, 50, 48, 45, 43, 45, 48, 50, 51, 52];
      for (let i = 0; i < 20; i++) {
        const t = 0.25 + i * b; if (t > 7.4) break;
        A.pluck(t, midi(bassLine[i % bassLine.length] - 12), { dur: 0.6, g: 0.32, bright: 0.25, decay: 0.993, lp: 900 });
        A.noise(t + b / 2, { type: 'bandpass', f: 3500, q: 0.6, dur: 0.16, g: i % 2 ? 0.05 : 0.03, swell: 0.5 });
      }
      [[0.25, [57, 60, 64, 67]], [2.25, [55, 59, 62, 65]], [4.25, [57, 60, 64, 67]], [6.25, [53, 57, 60, 64]]].forEach(([t, ch]) => ch.forEach((m, i) => vib(t + i * 0.02, m + 12, 0.035)));
      // footsteps: a woodblock on every contact drawing
      for (let k = 0; LA_T.walk + k * b < LA_T.stop; k++) { const t = LA_T.walk + k * b; A.osc(t, { f: 900, f2: 700, glide: 0.03, dur: 0.06, g: 0.14, pan: k % 2 ? 0.2 : -0.2 }); A.noise(t, { type: 'bandpass', f: 2400, q: 3, dur: 0.02, g: 0.06 }); }
      // stop, swap, take, zip
      A.osc(LA_T.stop, { f: 1300, f2: 900, glide: 0.08, dur: 0.12, g: 0.06 });
      A.osc(LA_T.front, { f: 620, dur: 0.07, g: 0.12 }); A.noise(LA_T.front, { type: 'highpass', f: 3000, dur: 0.02, g: 0.06 });
      A.osc(LA_T.take, { type: 'sawtooth', f: midi(58), dur: 0.35, g: 0.08, lp: 600, lp2: 3000, lpT: 0.15, q: 3 });
      A.osc(LA_T.take, { type: 'sawtooth', f: midi(64), dur: 0.35, g: 0.06, lp: 600, lp2: 3000, lpT: 0.15, q: 3 });
      A.osc(LA_T.take + 0.02, { type: 'triangle', f: 180, f2: 520, glide: 0.2, dur: 0.36, g: 0.12, vib: [16, 30] });
      for (let k = 0; k < 6; k++) A.osc(LA_T.lean - 0.12 + k * 0.025, { type: 'triangle', f: midi(72 + k * 2), dur: 0.1, g: 0.05 });
      A.osc(LA_T.zip - 0.02, { f: 500, f2: 2600, glide: 0.18, dur: 0.22, g: 0.1 });
      A.whoosh(LA_T.zip - 0.04, 0.3, { f1: 600, f2: 6000, g: 0.2, pan: 0.4 });
      A.noise(LA_T.zip, { type: 'lowpass', f: 600, dur: 0.25, g: 0.1 });
      A.osc(LA_T.hatGo, { f: 700, f2: 2200, glide: 0.1, dur: 0.12, g: 0.07 });
      // title card: a brass stab, pops for each cut-in, vibes and a cymbal
      A.chord(LA_T.card, [53, 57, 60, 64, 67], { type: 'sawtooth', dur: 0.9, g: 0.03, lp: 2200, a: 0.02, spread: 6 });
      A.hat(LA_T.card, 0.1, true);
      [7.5, 7.625, 7.75, 7.875].forEach((t, i) => A.osc(t, { f: 520 + i * 90, dur: 0.06, g: 0.07 }));
      for (let i = 0; i < 7; i++) { const t = 7.875 + i * 0.125; vib(t, [65, 69, 72, 76, 79, 81, 84][i], 0.04, 0.9); }
      A.osc(LA_T.head, { f: 760, dur: 0.06, g: 0.1 });
      A.chord(9.25, [53, 57, 60, 64, 69], { type: 'triangle', dur: 0.75, g: 0.04, rev: 0.4 });
      vib(9.25, 77, 0.06, 1.4); vib(9.27, 81, 0.05, 1.4);
    },
  });
})();
