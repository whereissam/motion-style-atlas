/* batch k5 — Technique Atlas · Procedural: Instancing · Recursion · Fields.
   techinstancing (one Token definition stamped 400 times; a single layout parameter morphs
   grid → rings → phyllotaxis spiral → index-offset grid, like a Cloner) ·
   techrecursion (the Token draws a transformed copy of itself, first stacked, then nested in
   its own hole; depth climbs and the camera dives four levels into a seamless self-similar frame) ·
   techfields (a falloff field — spherical, linear, noise — sweeps a grid of Tokens and drives
   scale, rotation and colour by distance, with the field itself drawn faintly underneath). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, kf, spring, hash, midi, text, offscreen } = MG;
  const TK = MG.TK, P = TK.P, MONO = TK.MONO, PI = Math.PI;

  /* ---------------- shared helpers ---------------- */
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, u) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
  // n colours sampled evenly along a list of hex stops
  function ramp(stops, n) {
    const out = [];
    for (let i = 0; i < n; i++) {
      const u = (i / (n - 1)) * (stops.length - 1), k = Math.min(stops.length - 2, Math.floor(u));
      out.push(mixc(stops[k], stops[k + 1], u - k));
    }
    return out;
  }
  // Token pre-rendered once per colour; stamped with drawImage under a transform.
  const SPR_S = 112, SPR_PAD = 6, sprites = new Map();
  function sprite(col) {
    let cv = sprites.get(col);
    if (!cv) {
      cv = offscreen(SPR_S + SPR_PAD * 2, SPR_S + SPR_PAD * 2);
      const g = cv.getContext('2d');
      g.translate(cv.width / 2, cv.height / 2);
      TK.tokenPath(g, SPR_S); g.fillStyle = col; g.fill('evenodd');
      sprites.set(col, cv);
    }
    return cv;
  }
  function stamp(c, img, x, y, s, rot = 0, alpha = 1) {
    if (s < 0.5 || alpha <= 0.002) return;
    const k = s / SPR_S, w = img.width * k;
    c.save(); c.translate(x, y); if (rot) c.rotate(rot);
    c.globalAlpha = alpha;
    c.drawImage(img, -w / 2, -w / 2, w, w);
    c.restore();
  }
  const mono = (c, s, x, y, o = {}) => text(c, s, x, y, { font: MONO, size: 18, ls: 2, color: P.mute, ...o });
  // 2D value noise in 0..1 (lattice hashed with MG.hash), two octaves
  const h2 = (i, j, s) => hash(i * 12.9898 + j * 78.233 + s * 37.719);
  function n2(x, y, s = 0) {
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return lerp(lerp(h2(i, j, s), h2(i + 1, j, s), u), lerp(h2(i, j + 1, s), h2(i + 1, j + 1, s), u), v);
  }
  const fbm = (x, y, s) => (n2(x, y, s) * 0.68 + n2(x * 2.03 + 5.2, y * 2.03 - 1.7, s + 3) * 0.32);
  const wrap = a => ((a % TAU) + TAU) % TAU;

  /* =====================================================================
     INSTANCING — one Token definition sits in a SOURCE panel; a cloner
     stamps it 400 times. Instances fly out of the master in index order
     into a 25 × 16 grid while the HUD counts 1 → 400. Then a single layout
     parameter steps on the beat: grid → concentric rings (rotation follows
     the tangent, colour by ring) → a golden-angle spiral (scale by radius,
     every 21st index blue, a beat ripple running down the index) → a grid
     whose rotation and colour are offset by index. Each morph is staggered
     by index, so the wave of change itself shows the instance order.
     ===================================================================== */
  const IN = { N: 400, COLS: 25, cx: 1060, cy: 455, SP: 44, S: 30 };
  const IN_T = [3.0, 5.0, 7.0];               // layout morphs, on the downbeat of bars 2, 3 and 4
  const IN_NAMES = ['GRID', 'RINGS', 'SPIRAL', 'OFFSET'];
  const GA = PI * (3 - Math.sqrt(5));          // golden angle
  const inBorn = i => 1.0 + 1.5 * Math.sqrt(i / (IN.N - 1));
  const inCount = t => (t < 1 ? 1 : Math.min(IN.N, 1 + Math.floor((IN.N - 1) * Math.pow(seg(t, 1, 2.5), 2))));
  // ring k holds a share of the 400 proportional to its radius, so spacing is even
  const IN_RING = (() => { const R = Array.from({ length: 8 }, (_, k) => 100 + k * 40), sum = R.reduce((a, b) => a + b, 0), out = []; let acc = 0;
    R.forEach((r, k) => { const n = k === 7 ? 400 - acc : Math.round(400 * r / sum); for (let j = 0; j < n; j++) out.push([k, j, n]); acc += n; }); return out; })();
  const inStag = (t, T, i) => E.ioC(seg(t, T + 0.5 * i / (IN.N - 1), T + 0.5 * i / (IN.N - 1) + 0.55));
  function inLayout(L, i, t) {
    const col = i % IN.COLS, row = (i / IN.COLS) | 0;
    const gx = IN.cx + (col - 12) * IN.SP, gy = IN.cy + (row - 7.5) * IN.SP;
    if (L === 0) return { x: gx, y: gy, s: IN.S, r: 0, c: 0.5, b: 0 };
    if (L === 1) {
      const [k, j, n] = IN_RING[i], dir = k % 2 ? -1 : 1;
      const a = (j / n) * TAU + k * 0.21 + dir * (t - 3) * 0.32, R = 100 + k * 40;
      return { x: IN.cx + Math.cos(a) * R, y: IN.cy + Math.sin(a) * R, s: 19 + k * 2.4, r: wrap(a + PI / 2), c: k / 7, b: 0 };
    }
    if (L === 2) {
      const rr = 19.2 * Math.sqrt(i + 0.5), a = i * GA + (t - 5) * 0.22;
      let bump = 0;
      for (const bt of [5.5, 6.0, 6.5]) { const d = (t - bt - (i / (IN.N - 1)) * 0.45) * 9; bump += Math.exp(-d * d); }
      return { x: IN.cx + Math.cos(a) * rr, y: IN.cy + Math.sin(a) * rr, s: (12 + 26 * Math.sqrt(i / (IN.N - 1))) * (1 + 0.45 * bump), r: wrap(a), c: 0.12 + 0.72 * (i / (IN.N - 1)), b: i % 21 === 0 ? 1 : 0 };
    }
    return { x: gx, y: gy, s: IN.S, r: (col + row) * (PI / 12), c: (col + row) / 38, b: 0 };
  }

  MG.film({
    id: 'techinstancing', dur: 10, poster: 6.25,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Instancing', sub: 'One definition, drawn hundreds of times', era: '2006 —',
      origin: 'Instancing draws a single stored object many times, each copy differing only by a few per-instance attributes such as position, scale, rotation and colour. GPUs gained hardware instancing in the mid-2000s, and motion designers met the idea through MoGraph’s Cloner in Cinema 4D (2006), which places clones on grids, radial and linear layouts and lets effectors drive their attributes by index.',
      works: 'MoGraph Cloner (Cinema 4D, Maxon, 2006) · Houdini copy-to-points and packed primitives (SideFX) · Geometry Nodes Instance on Points (Blender, 2021)',
      tech: ['One sprite, 400 transforms', 'Layout parameter morph', 'Index-staggered attributes'],
      accent: '#ff5a1f',
      motionDNA: 'A count that explodes: one Token, then instances streaming out of it in index order until the grid is full. After that only one parameter moves, on the beat, and every copy follows it — each starting a little later than the one before, so every change rolls across the set as a wave.',
      visualDNA: 'Hundreds of identical orange rounded squares with an off-centre hole on a warm paper grid; grids, concentric rings and a golden-angle sunflower spiral; a SOURCE panel holding the single master Token; a mono HUD counting instances and marking the active layout.',
      transitions: 'Clone burst from the master, then index-staggered layout morphs on the bar lines; resolves to a static offset grid',
      implementation: ['Cinema 4D MoGraph Cloner + effectors', 'Houdini copy-to-points / GPU instancing', 'Canvas 2D: one pre-rendered sprite per colour, stamped with drawImage under per-instance transforms'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const pal = ramp(['#ffc8ab', P.accentL, P.accent, P.accentD, P.ink], 33);
      return { pal: pal.map(sprite), blue: sprite(P.blue), master: sprite(P.accent) };
    },
    draw(c, t, W, H, st) {
      TK.stage(c, W, H, { ox: 40 });
      const N = IN.N, cnt = inCount(t);
      // which pair of layouts we are between, and the morph clock
      let A = 0, B = 1, T = IN_T[0];
      if (t >= IN_T[1] - 0.9) { A = 1; B = 2; T = IN_T[1]; }
      if (t >= IN_T[2] - 0.9) { A = 2; B = 3; T = IN_T[2]; }
      const Lmid = A + inStag(t, T, 200);

      // the master Token: pops in at centre, then shrinks to become instance #0's origin
      const mp = spring(t - 0.05, 2.2, 0.45), ms = lerp(210, IN.S, E.ioC(seg(t, 0.9, 1.25)));
      if (t < 1.3) {
        stamp(c, st.master, IN.cx, IN.cy, ms * mp, (1 - mp) * 0.6);
        if (t < 0.95) {
          const a = seg(t, 0.25, 0.5) * (1 - seg(t, 0.8, 0.95));
          c.save(); c.globalAlpha = a; c.strokeStyle = 'rgba(23,24,28,0.35)'; c.setLineDash([6, 6]); c.lineWidth = 1.5;
          c.strokeRect(IN.cx - 135, IN.cy - 135, 270, 270); c.setLineDash([]); c.restore();
          mono(c, 'TOKEN  ·  1 DEFINITION', IN.cx - 135, IN.cy - 152, { alpha: a, color: `rgba(23,24,28,${0.55 * a})` });
        }
      }
      // instances
      for (let i = 0; i < N; i++) {
        let o;
        if (t < 2.7) {
          const b = inBorn(i); if (t < b) continue;
          const g = inLayout(0, i, t), p = E.outC(seg(t, b, b + 0.42));
          o = { x: lerp(IN.cx, g.x, p), y: lerp(IN.cy, g.y, p), s: g.s * lerp(0.5, 1, p), r: (1 - p) * 1.4, c: 0.5, b: 0 };
          o.a = seg(t, b, b + 0.08);
        } else {
          const u = inStag(t, T, i), a = inLayout(A, i, t), b = inLayout(B, i, t);
          const lift = Math.sin(u * PI) * 0.18;   // a small swell mid-flight so the stagger reads
          o = { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), s: lerp(a.s, b.s, u) * (1 + lift), r: lerp(a.r, b.r, u), c: lerp(a.c, b.c, u), b: lerp(a.b, b.b, u), a: 1 };
        }
        const img = o.b > 0.5 ? st.blue : st.pal[Math.round(clamp(o.c) * 32)];
        stamp(c, img, o.x, o.y, o.s, o.r, o.a);
      }

      // SOURCE panel (top right): the single definition every instance points at
      const sa = E.outC(seg(t, 1.0, 1.5));
      if (sa > 0) {
        const px = 1668, py = 64, pw = 180, ph = 196;
        c.save(); c.globalAlpha = sa;
        c.fillStyle = 'rgba(236,232,223,0.92)'; c.fillRect(px, py, pw, ph);
        c.strokeStyle = 'rgba(23,24,28,0.3)'; c.lineWidth = 1.5; c.strokeRect(px + 0.5, py + 0.5, pw, ph);
        mono(c, 'SOURCE', px + 16, py + 30, { size: 15 });
        const pulse = 1 + 0.08 * Math.exp(-Math.pow(((t + 0.25) % 0.5 - 0.25) * 14, 2)) * (t > 1.5 ? 1 : 0);
        stamp(c, st.master, px + pw / 2, py + 104, 92 * pulse);
        mono(c, 'TOKEN x1', px + 16, py + ph - 16, { size: 15, color: P.ink });
        c.restore();
      }

      // HUD (top left): instance count, the one layout parameter, the per-instance attributes
      const hx = 72, hy = 92;
      mono(c, 'INSTANCES', hx, hy);
      const done = t >= 8.2;
      text(c, done ? '1 → 400' : String(cnt), hx - 2, hy + 62, { font: MONO, weight: 700, size: 58, color: P.ink });
      if (t > 2.6) {
        const a = seg(t, 2.6, 3.0);
        c.save(); c.globalAlpha = a;
        mono(c, 'LAYOUT  PARAMETER', hx, hy + 128);
        const sx = hx, sw = 380, sy = hy + 160;
        c.fillStyle = 'rgba(23,24,28,0.18)'; c.fillRect(sx, sy, sw, 2);
        IN_NAMES.forEach((n, k) => {
          const x = sx + sw * k / 3, on = Math.abs(Lmid - k) < 0.5;
          c.fillStyle = on ? P.ink : 'rgba(23,24,28,0.35)'; c.fillRect(x - 1, sy - 6, 2, 14);
          mono(c, n, x, sy + 34, { size: 14, ls: 1.5, align: k === 3 ? 'right' : k ? 'center' : 'left', color: on ? P.ink : P.mute });
        });
        const mx = sx + sw * Lmid / 3;
        c.fillStyle = P.accent; c.beginPath(); c.arc(mx, sy + 1, 7, 0, TAU); c.fill();
        mono(c, 'PER INSTANCE', hx, hy + 248);
        ['position', 'scale', 'rotation', 'colour'].forEach((n, k) => mono(c, '· ' + n, hx, hy + 278 + k * 26, { size: 16, ls: 1, color: P.ink }));
        mono(c, `index  i = 0 … 399`, hx, hy + 400, { size: 16, ls: 1 });
        c.restore();
      }
      TK.caption(c, t, W, H, { name: 'Instancing', cat: 'Procedural' });
    },
    score(A) {
      TK.bed(A);
      A.bell(0.05, midi(72), { g: 0.1, dur: 1.6 });
      // clone ticks, accelerating with the count
      for (let k = 0; k < 28; k++) {
        const t = 1.0 + 1.5 * Math.sqrt(k / 27);
        A.pluck(t, midi(60 + [0, 2, 4, 7, 9][k % 5] + 12 * Math.floor(k / 10)), { g: 0.16, dur: 0.5, bright: 0.85, pan: ((k * 7) % 11) / 5.5 - 1 });
      }
      A.hat(2.5, 0.08, true);
      // each layout morph: an index-wave whoosh and an arpeggio running down the index order
      const chords = [[57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]];
      IN_T.forEach((T, n) => {
        A.whoosh(T, 1.0, { g: 0.12, f1: 400, f2: 2600 });
        chords[n].forEach((m, k) => A.pluck(T + k * 0.125, midi(m + 12), { g: 0.2, dur: 1.0, pan: k / 1.5 - 1, rev: 0.25 }));
      });
      [5.5, 6.0, 6.5].forEach(t => A.osc(t, { f: midi(84), dur: 0.25, g: 0.05, type: 'triangle', rev: 0.3 }));
      A.chord(8.0, [60, 64, 67, 72], { type: 'triangle', dur: 2.0, g: 0.05, a: 0.02, lp: 2400, rev: 0.4, width: 0.5 });
      A.bell(8.0, midi(79), { g: 0.08, dur: 2.0 });
    },
  });

  /* =====================================================================
     RECURSION — draw(n): draw the Token, then draw(n − 1) under a fixed
     transform. First the rule is "stack": scale 0.76, turn 18°, nudge
     toward the hole — the copies coil into a shell, one new level per
     eighth note. Then the rule's numbers morph to "nest": scale 0.25,
     turn 29°, centred in the hole. The camera then dives into the rule's
     fixed point — zoom 4× per level, parents fading as they pass — for
     four levels, landing on a frame identical to the first: proof that
     the picture contains itself. A depth gauge and the live rule read out.
     ===================================================================== */
  const RC = { cx: 900, cy: 480, S0: 540 };
  const RC_STACK = { s: 0.76, th: 0.314, ox: 0.03, oy: -0.03 };
  const RC_HOLE = { s: 0.25, th: 0.5, ox: TK.HOLE.x, oy: TK.HOLE.y };
  const RC_MORPH = [3.0, 3.75], RC_ZOOM = [4.0, 8.5], RC_LV = 4, RC_D0 = 10;
  const rcRule = t => {
    const u = E.ioC(seg(t, RC_MORPH[0], RC_MORPH[1]));
    return { u, s: Math.exp(lerp(Math.log(RC_STACK.s), Math.log(RC_HOLE.s), u)), th: lerp(RC_STACK.th, RC_HOLE.th, u), ox: lerp(RC_STACK.ox, RC_HOLE.ox, u), oy: lerp(RC_STACK.oy, RC_HOLE.oy, u) };
  };
  const rcZoom = t => kf(t, [[RC_ZOOM[0], 0], [RC_ZOOM[1], RC_LV, E.ioS]]);
  const rcBorn = k => (k <= RC_D0 ? 0.5 + (k - 1) * 0.25 : Infinity);
  // depth = levels that exist now: ten built on eighth notes, then one more per level the camera passes
  const rcDepth = t => (t < 0.5 ? 0 : Math.min(RC_D0, 1 + Math.floor((t - 0.5) / 0.25))) + (t > RC_ZOOM[0] ? Math.ceil(rcZoom(t) - 1e-6) : 0);
  // time at which the zoom passes level n (bisection on the monotone zoom curve)
  function rcPass(n) {
    let a = RC_ZOOM[0], b = RC_ZOOM[1];
    for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (rcZoom(m) < n) a = m; else b = m; }
    return (a + b) / 2;
  }

  MG.film({
    id: 'techrecursion', dur: 10, poster: 2.9,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Recursion', sub: 'A shape that contains itself', era: '1904 —',
      origin: 'A recursive picture is defined in terms of itself: draw the shape, then draw the whole picture again, smaller and turned, inside it, until the copies vanish. Koch’s snowflake (1904) and Escher’s and Droste’s self-containing images made the idea visual; Mandelbrot named fractals in 1975, and Barnsley’s iterated function systems (1988) made recursive copying a standard way to generate imagery in computer graphics.',
      works: 'Koch snowflake (Helge von Koch, 1904) · Print Gallery (M. C. Escher, 1956) · Fractals Everywhere — iterated function systems (Michael Barnsley, 1988)',
      tech: ['draw(n) calls draw(n − 1)', 'One similarity transform per level', 'Infinite zoom to the fixed point'],
      accent: '#ff5a1f',
      motionDNA: 'Growth by levels: copies appear one per eighth note, each inside or on top of the last. The rule’s numbers then slide and the whole stack re-folds at once. Finally a steady exponential dive — four times closer per level — that never reaches the bottom and lands exactly where it started.',
      visualDNA: 'An orange Token and an ink Token alternating level by level, coiling into a spiral shell, then nested hole-in-hole like Russian dolls on the paper grid; a depth gauge of stacked ticks, the live rule in mono type and a zoom multiplier climbing to ×256.',
      transitions: 'Level-by-level build, a rule morph that re-folds every level together, then a seamless self-similar zoom that ends on the opening frame',
      implementation: ['Recursive draw function with a depth limit', 'Iterated similarity transform (scale · rotate · translate) and its fixed point', 'Canvas 2D: levels composed as M^k, camera as M^−z for fractional z'],
      reproducibility: 'Fully procedural',
      loopable: true,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H, { ox: 20, oy: 8 });
      const R = rcRule(t), z = t > RC_ZOOM[0] ? rcZoom(t) : 0, D = rcDepth(t);
      const cs = Math.cos(R.th), sn = Math.sin(R.th);
      // fixed point q of p → o + sR·p (camera dives toward it)
      const a11 = 1 - R.s * cs, a12 = R.s * sn, det = a11 * a11 + a12 * a12;
      const qx = (a11 * R.ox - a12 * R.oy) / det, qy = (a12 * R.ox + a11 * R.oy) / det;
      const K = Math.pow(R.s, -z), phi = -z * R.th, kc = Math.cos(phi) * K, ks = Math.sin(phi) * K;
      const view = (x, y) => [RC.cx + RC.S0 * (qx + kc * (x - qx) - ks * (y - qy)), RC.cy + RC.S0 * (qy + ks * (x - qx) + kc * (y - qy))];

      // levels k = 0..D: centre, scale and turn composed as M^k
      let x = 0, y = 0, sc = 1, rot = 0;
      const k0 = Math.max(0, Math.floor(z) - 1);
      for (let k = 0; k <= D + 1 && k <= k0 + 9; k++) {
        if (k > D) break;
        const born = rcBorn(k), pop = k === 0 ? spring(t - 0.02, 2.2, 0.5) : born === Infinity ? 1 : spring(t - born, 3.2, 0.42);
        const fade = 1 - E.ioS(seg(z - k, 0.55, 0.85));
        const size = RC.S0 * sc * K * pop;
        if (k >= k0 && fade > 0 && size > 0.6 && size < 9000) {
          const [vx, vy] = view(x, y);
          c.save(); c.translate(vx, vy); c.rotate(rot + phi + (1 - pop) * 0.5); c.globalAlpha = fade;
          TK.tokenPath(c, size); c.fillStyle = k % 2 ? P.ink : P.accent; c.fill('evenodd');
          c.restore();
        }
        const nx = x + sc * (Math.cos(rot) * R.ox - Math.sin(rot) * R.oy), ny = y + sc * (Math.sin(rot) * R.ox + Math.cos(rot) * R.oy);
        x = nx; y = ny; sc *= R.s; rot += R.th;
      }
      // a faint marker on the fixed point while the camera dives
      const za = seg(t, 3.7, 4.1) * (1 - seg(t, 8.4, 9.0));
      if (za > 0) {
        const [fx, fy] = view(qx, qy);
        c.save(); c.globalAlpha = za * 0.6; c.strokeStyle = P.blue; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(fx - 16, fy); c.lineTo(fx + 16, fy); c.moveTo(fx, fy - 16); c.lineTo(fx, fy + 16); c.stroke();
        c.restore();
      }

      // HUD: depth counter + gauge, the live rule, zoom multiplier
      const hx = 72, hy = 92;
      mono(c, 'DEPTH', hx, hy);
      text(c, String(D).padStart(2, '0'), hx - 2, hy + 62, { font: MONO, weight: 700, size: 58, color: P.ink });
      for (let k = 0; k < 14; k++) {
        const on = k < D;
        c.fillStyle = on ? (k % 2 ? P.ink : P.accent) : 'rgba(23,24,28,0.12)';
        c.fillRect(hx + 130 + k * 14, hy + 50 - (on && k === D - 1 ? 4 : 0), 9, 12 + (on && k === D - 1 ? 4 : 0));
      }
      mono(c, 'RULE', hx, hy + 128);
      mono(c, 'draw(n):', hx, hy + 160, { size: 17, ls: 1, color: P.ink });
      mono(c, '  token()', hx, hy + 186, { size: 17, ls: 1, color: P.ink });
      mono(c, '  push  scale ' + R.s.toFixed(2), hx, hy + 212, { size: 17, ls: 1, color: P.ink });
      mono(c, '        turn  ' + Math.round(R.th * 180 / PI) + '°', hx, hy + 238, { size: 17, ls: 1, color: P.ink });
      mono(c, '        move  ' + (R.u < 0.5 ? 'toward hole' : 'into hole'), hx, hy + 264, { size: 17, ls: 1, color: P.ink });
      mono(c, '  draw(n - 1)', hx, hy + 290, { size: 17, ls: 1, color: P.accentD });
      if (t > 3.9) {
        const a = seg(t, 3.9, 4.2);
        mono(c, 'ZOOM', hx, hy + 356, { color: `rgba(143,138,128,${a})` });
        text(c, '×' + Math.round(Math.pow(4, z)), hx - 2, hy + 404, { font: MONO, weight: 700, size: 40, color: `rgba(23,24,28,${a})` });
        if (t > 8.6) mono(c, 'level 4 = level 0', hx, hy + 440, { size: 16, ls: 1, color: `rgba(198,62,12,${seg(t, 8.6, 9.0)})` });
      }
      TK.caption(c, t, W, H, { name: 'Recursion', cat: 'Procedural' });
    },
    score(A) {
      TK.bed(A);
      A.bell(0.02, midi(60), { g: 0.1, dur: 1.4 });
      // one note per new level, climbing — each copy is smaller, so each is higher
      const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
      for (let k = 1; k <= RC_D0; k++) A.pluck(rcBorn(k), midi(60 + scale[k - 1]), { g: 0.2, dur: 0.7, bright: 0.8, pan: (k % 2 ? -0.3 : 0.3), rev: 0.2 });
      // the rule morphs: everything re-folds at once
      A.whoosh(RC_MORPH[0], 0.8, { g: 0.12, f1: 1800, f2: 400 });
      A.osc(RC_MORPH[0], { type: 'triangle', f: midi(67), f2: midi(55), glide: 0.75, dur: 0.8, g: 0.06, rev: 0.3 });
      // the dive: a long riser, a bell each time the camera passes a level
      A.riser(RC_ZOOM[0], RC_ZOOM[1] - RC_ZOOM[0] - 0.3, { g: 0.07, f: 82 });
      for (let n = 1; n <= RC_LV; n++) {
        const tp = rcPass(n - 0.5);
        A.bell(tp, midi(84 - n * 5), { g: 0.08, dur: 1.2, pan: n % 2 ? -0.25 : 0.25 });
        A.noise(tp, { type: 'bandpass', f: 900 + n * 300, q: 2, dur: 0.35, g: 0.05, rev: 0.3 });
      }
      A.chord(8.5, [48, 55, 60, 64], { type: 'triangle', dur: 1.6, g: 0.05, a: 0.02, lp: 2000, rev: 0.45, width: 0.5 });
      A.bell(8.5, midi(72), { g: 0.08, dur: 1.5 });
    },
  });

  /* =====================================================================
     FIELDS — a 26 × 11 grid of resting Tokens (small, grey, upright).
     A field value f ∈ 0..1 is sampled at every Token and mapped to scale,
     rotation (up to a half turn) and colour. Three falloffs take turns,
     crossfading on the bar: a spherical effector glides across with its
     radius rings visible; a linear falloff plane sweeps left to right with
     its ramp drawn as a band; a drifting noise field. The field itself is
     painted faintly underneath as a heat map, and a small graph shows the
     current falloff profile. It resolves on a spherical field at centre.
     ===================================================================== */
  const FL = { COLS: 26, ROWS: 11, SP: 64, cx: 960, cy: 478, S: 46 };
  const FL_X = [1.0, 4.0, 6.5, 8.5];          // field switches (all on beats)
  const flSph = t => ({ x: kf(t, [[0.6, -340], [1.6, 420, E.outC], [2.6, 900], [4.2, 1700, E.inQ]]), y: kf(t, [[0.6, 470], [1.6, 360], [2.6, 600], [4.2, 420]]), r: 330 });
  const flPlane = t => lerp(200, 2250, E.ioS(seg(t, 3.5, 6.9)));
  const flEnd = t => ({ x: 960, y: 478, r: lerp(60, 600, E.outC(seg(t, 8.3, 9.4))) });
  const sphF = (x, y, e) => { const d = Math.hypot(x - e.x, y - e.y) / e.r; return 1 - E.ioS(clamp((d - 0.32) / 0.68)); };
  const linF = (x, px) => E.ioS(clamp((px - x) / 460));
  const noiF = (x, y, t) => clamp((fbm(x / 300 + t * 0.35, y / 300 - t * 0.12, 4) - 0.28) * 2.1);
  function flWeights(t) {
    const u1 = E.ioC(seg(t, FL_X[1], FL_X[1] + 0.5)), u2 = E.ioC(seg(t, FL_X[2], FL_X[2] + 0.5)), u3 = E.ioC(seg(t, FL_X[3], FL_X[3] + 0.5));
    const on = E.outC(seg(t, 0.6, 1.1));
    return { sph: on * (1 - u1), lin: u1 * (1 - u2), noi: u2 * (1 - u3), end: u3 };
  }
  function flField(x, y, t, w, e, px, ee) {
    let f = 0;
    if (w.sph > 0) f += w.sph * sphF(x, y, e);
    if (w.lin > 0) f += w.lin * linF(x, px);
    if (w.noi > 0) f += w.noi * noiF(x, y, t);
    if (w.end > 0) f += w.end * sphF(x, y, ee);
    return f;
  }

  MG.film({
    id: 'techfields', dur: 10, poster: 2.6,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Fields', sub: 'Falloffs that drive attributes by distance', era: '2006 —',
      origin: 'A field assigns a value to every point in space, and each object samples it to set its own scale, rotation or colour, so one gizmo can art-direct thousands of copies at once. Cinema 4D’s MoGraph effectors (2006) popularised spherical and linear falloffs for motion design; Release 20 (2018) generalised them into layered Fields, and Houdini and Blender offer the same idea as attribute falloffs and field nodes.',
      works: 'MoGraph effectors with falloff (Cinema 4D, Maxon, 2006) · Fields (Cinema 4D Release 20, 2018) · Geometry Nodes fields (Blender, 2021)',
      tech: ['Spherical / linear / noise falloff', 'Field → scale, rotation, colour', 'Heat-map visualisation'],
      accent: '#ff5a1f',
      motionDNA: 'Nothing moves on its own: the Tokens are fixed in a grid and only react. A gizmo glides over them and they swell, turn and warm up as it passes, then settle behind it; a plane sweeps across and tips every row in turn; noise makes them breathe in drifting patches. Every change in the field crossfades on the bar.',
      visualDNA: 'A dense grid of Tokens running from small upright grey to large, half-turned orange; underneath, a faint orange heat map of the field, dashed radius rings and crosshair for the sphere, a ramp band and arrow for the plane; a small falloff-profile graph and mono labels in the HUD.',
      transitions: 'Crossfades between field types on the bar line, resolving to a static centred spherical falloff',
      implementation: ['Cinema 4D MoGraph effectors and Fields', 'Houdini attribute falloff / Blender Geometry Nodes fields', 'Canvas 2D: field sampled per Token plus a low-res heat map upscaled underneath'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() {
      const pal = ramp(['#c4beb2', '#a39d92', P.accentD, P.accent], 33);
      return { pal: pal.map(sprite), heat: offscreen(96, 54) };
    },
    draw(c, t, W, H, st) {
      TK.stage(c, W, H);
      const w = flWeights(t), e = flSph(t), px = flPlane(t), ee = flEnd(t);
      // heat map of the field (low-res, smoothed up)
      const hg = st.heat.getContext('2d'), img = hg.createImageData(96, 54), d = img.data, ar = hex(P.accent);
      for (let j = 0; j < 54; j++) for (let i = 0; i < 96; i++) {
        const f = flField((i + 0.5) * 20, (j + 0.5) * 20, t, w, e, px, ee), o = (j * 96 + i) * 4;
        d[o] = ar[0]; d[o + 1] = ar[1]; d[o + 2] = ar[2]; d[o + 3] = Math.round(clamp(f) * 40);
      }
      hg.putImageData(img, 0, 0);
      c.save(); c.imageSmoothingEnabled = true; c.drawImage(st.heat, 0, 0, W, H); c.restore();

      // field gizmos (under the Tokens)
      c.save();
      if (w.sph > 0.01 || w.end > 0.01) {
        [[e, w.sph], [ee, w.end]].forEach(([g, a]) => {
          if (a < 0.01) return;
          c.globalAlpha = a;
          c.strokeStyle = 'rgba(23,24,28,0.22)'; c.lineWidth = 1;
          for (let k = 1; k <= 5; k++) { c.beginPath(); c.arc(g.x, g.y, g.r * k / 5, 0, TAU); c.stroke(); }
          c.setLineDash([8, 7]); c.strokeStyle = 'rgba(47,91,255,0.7)'; c.lineWidth = 2;
          c.beginPath(); c.arc(g.x, g.y, g.r, 0, TAU); c.stroke();
          c.beginPath(); c.arc(g.x, g.y, g.r * 0.32, 0, TAU); c.stroke(); c.setLineDash([]);
        });
      }
      if (w.lin > 0.01) {
        c.globalAlpha = w.lin;
        const gr = c.createLinearGradient(px - 460, 0, px, 0);
        gr.addColorStop(0, 'rgba(47,91,255,0.0)'); gr.addColorStop(1, 'rgba(47,91,255,0.08)');
        c.fillStyle = gr; c.fillRect(px - 460, 0, 460, H);
        c.strokeStyle = 'rgba(47,91,255,0.7)'; c.lineWidth = 2; c.setLineDash([10, 8]);
        c.beginPath(); c.moveTo(px, 0); c.lineTo(px, H); c.moveTo(px - 460, 0); c.lineTo(px - 460, H); c.stroke(); c.setLineDash([]);
      }
      c.restore();

      // the grid of Tokens, each sampling the field
      const x0 = FL.cx - (FL.COLS - 1) / 2 * FL.SP, y0 = FL.cy - (FL.ROWS - 1) / 2 * FL.SP;
      const app = t => seg(t, 0.0, 0.6);
      for (let r = 0; r < FL.ROWS; r++) for (let q = 0; q < FL.COLS; q++) {
        const x = x0 + q * FL.SP, y = y0 + r * FL.SP, f = clamp(flField(x, y, t, w, e, px, ee));
        const a = E.outC(clamp(app(t) * 2.2 - (q + r) / 36 * 1.2));
        stamp(c, st.pal[Math.round(f * 32)], x, y, FL.S * lerp(0.36, 1.04, f) * a, f * PI, a);
      }

      // gizmo handles and labels (over the Tokens)
      c.save();
      const handle = (g, a, label) => {
        if (a < 0.01) return;
        c.globalAlpha = a; c.strokeStyle = P.blue; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(g.x - 22, g.y); c.lineTo(g.x + 22, g.y); c.moveTo(g.x, g.y - 22); c.lineTo(g.x, g.y + 22); c.stroke();
        c.fillStyle = P.blue; c.beginPath(); c.arc(g.x, g.y, 5, 0, TAU); c.fill();
        const lx = clamp(g.x + g.r * 0.72 + 10, 60, W - 270), ly = g === ee ? Math.min(H - 60, g.y + g.r * 0.72) : g.y - g.r * 0.72;
        c.fillStyle = 'rgba(236,232,223,0.9)'; c.fillRect(lx - 6, ly - 22, 250, 32);
        mono(c, label, lx, ly, { size: 16, ls: 1.5, color: P.blue });
      };
      handle(e, w.sph, 'SPHERICAL  r = 330');
      handle(ee, w.end, 'SPHERICAL  r = ' + Math.round(ee.r));
      if (w.lin > 0.01) {
        c.globalAlpha = w.lin; c.fillStyle = P.blue;
        const ay = 128;
        c.beginPath(); c.moveTo(px + 26, ay); c.lineTo(px + 6, ay - 12); c.lineTo(px + 6, ay + 12); c.fill();
        c.fillRect(px - 60, ay - 2, 66, 4);
        const lx = px < W - 240 ? px + 14 : px - 214, ly = 868;
        c.fillStyle = 'rgba(236,232,223,0.9)'; c.fillRect(lx - 6, ly - 22, 196, 32);
        mono(c, 'LINEAR  ramp 460', lx, ly, { size: 16, ls: 1.5, color: P.blue });
      }
      c.restore();

      // HUD: active field + mapping (top left), falloff profile graph (top right)
      const names = [['SPHERICAL', w.sph + w.end], ['LINEAR', w.lin], ['NOISE', w.noi]];
      c.fillStyle = 'rgba(236,232,223,0.92)'; c.fillRect(56, 36, 600, 86);
      mono(c, 'FIELD', 72, 64);
      names.forEach(([n, a], k) => mono(c, n, 160 + k * 150, 64, { color: a > 0.5 ? P.ink : P.mute, weight: a > 0.5 ? 700 : 400 }));
      mono(c, 'f(distance)  →  scale · rotation · colour', 72, 102, { size: 16, ls: 1, color: P.ink });
      const gx = 1600, gy = 40, gw = 248, gh = 78;
      c.fillStyle = 'rgba(236,232,223,0.92)'; c.fillRect(gx - 12, gy - 6, gw + 24, gh + 34);
      c.strokeStyle = 'rgba(23,24,28,0.25)'; c.lineWidth = 1; c.strokeRect(gx + 0.5, gy + 0.5, gw, gh);
      c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath();
      for (let i = 0; i <= 80; i++) {
        const u = i / 80;
        const f = (w.sph + w.end) * (1 - E.ioS(clamp((u - 0.32) / 0.68))) + w.lin * (1 - E.ioS(clamp(u * 1.4))) + w.noi * clamp((fbm(u * 3 + t * 0.35, 1.7, 4) - 0.28) * 2.1);
        const yy = gy + gh - 6 - clamp(f) * (gh - 12);
        i ? c.lineTo(gx + u * gw, yy) : c.moveTo(gx + u * gw, yy);
      }
      c.stroke();
      mono(c, 'FALLOFF  f / d', gx, gy + gh + 22, { size: 13, ls: 2 });
      TK.caption(c, t, W, H, { name: 'Fields', cat: 'Procedural' });
    },
    score(A) {
      TK.bed(A);
      // the spherical effector: a soft tone that swells as it crosses the grid
      A.osc(0.7, { type: 'sine', f: midi(55), f2: midi(62), glide: 3.0, dur: 3.3, g: 0.07, a: 0.8, vib: [5, 3], rev: 0.4 });
      A.whoosh(0.7, 1.1, { g: 0.1, f1: 250, f2: 1400, pan: -0.6 });
      A.whoosh(2.6, 1.6, { g: 0.08, f1: 400, f2: 2200, pan: 0.6 });
      // the plane: a filtered sweep panned left → right in steps
      for (let k = 0; k < 5; k++) A.noise(4.0 + k * 0.5, { type: 'bandpass', f: 500 + k * 400, f2: 900 + k * 500, q: 3, dur: 0.6, g: 0.07, swell: 0.5, pan: -0.8 + k * 0.4, rev: 0.2 });
      [4.0, 5.0, 6.0].forEach((t, k) => A.pluck(t, midi([57, 60, 64][k]), { g: 0.16, dur: 0.9, pan: -0.5 + k * 0.5 }));
      // noise: grainy taps on the eighths, wandering in pitch
      for (let k = 0; k < 8; k++) A.pluck(6.5 + k * 0.25, midi(64 + [0, 5, 3, 7, 2, 9, 5, 12][k]), { g: 0.11, dur: 0.4, bright: 0.95, pan: hash(k + 3) * 1.4 - 0.7 });
      A.noise(6.5, { type: 'bandpass', f: 2600, q: 0.8, dur: 2.0, g: 0.025, hold: true, rel: 0.4, crush: true });
      // resolve: the field opens at centre
      A.chord(8.5, [48, 55, 64, 67], { type: 'triangle', dur: 1.6, g: 0.05, a: 0.05, lp: 2200, rev: 0.45, width: 0.6 });
      A.bell(8.5, midi(76), { g: 0.08, dur: 1.5 });
    },
  });
})();
