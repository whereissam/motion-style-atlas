/* Batch c7 — Family B, Typography & Text Motion: Expressive Kinetic Type, Text Morphing, Editorial Typography. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, rng, hash, vnoise, midi, text, grain, vignette, offscreen } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Instrument+Serif:ital@0;1&family=Archivo:wdth,wght@62..125,100..900&family=Inter+Tight:ital,wght@0,400..900;1,400..900&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&family=Unbounded:wght@700..900&family=JetBrains+Mono:wght@400;700&display=block');

  const MONO = '"JetBrains Mono", monospace';
  const mixRGB = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const css = (a, al = 1) => `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${al})`;
  const hexRGB = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const decay = (t, at, k) => (t >= at ? Math.exp(-(t - at) * k) : 0);
  const setLS = (c, v) => { if ('letterSpacing' in c) c.letterSpacing = v + 'px'; };

  /* ================================================================
     01 EXPRESSIVE KINETIC TYPE — "say it soft / say it slow / then SAY IT
     LOUD / let the words STRETCH / till they SHAKE / we were never QUIET."
     Every phrase is a block in one typographic poster; the camera flies,
     whips and rotates from block to block, then pulls out to reveal it.
     ================================================================ */
  const KBG = [13, 12, 11], KINK = [240, 233, 219], KACC = [255, 62, 36], KDK = [24, 10, 7];
  const KSANS = 'Archivo', KSER = '"Instrument Serif"';
  const kFont = (f, size) => (f === 'sans' ? `900 ${size}px ${KSANS}` : f === 'roman' ? `400 ${size}px ${KSER}` : `italic 400 ${size}px ${KSER}`);
  const kSet = (c, f, size) => { c.font = kFont(f, size); c.fontStretch = f === 'sans' ? 'expanded' : 'normal'; };
  const kMeas = (c, f, size, s) => {
    kSet(c, f, size);
    const m = c.measureText(s);
    return { w: m.width, l: m.actualBoundingBoxLeft, r: m.actualBoundingBoxRight, a: m.actualBoundingBoxAscent, d: m.actualBoundingBoxDescent };
  };
  const K_HITS = [[2.75, 16], [3.0, 13], [3.5, 38], [6.5, 20], [8.0, 30]];

  function kLayout(c) {
    const P = {}, list = [];
    const X0 = 0, X1 = 1580;
    const add = (name, o) => {
      o.name = name; o.rot = o.rot || 0;
      const m = kMeas(c, o.f, o.size, o.s);
      o.w = m.w; o.a = m.a; o.l = m.l; o.r = m.r; o.d = m.d;
      kSet(c, o.f, o.size);
      o.off = [];
      for (let i = 0; i <= o.s.length; i++) o.off.push(c.measureText(o.s.slice(0, i)).width);
      P[name] = o; list.push(o);
      return o;
    };
    // line 1 — the whisper
    const s1 = 96, sp1 = kMeas(c, 'serif', s1, ' ').w, a1 = kMeas(c, 'serif', s1, 'Skl').a;
    let x = X0, y = a1;
    [['say1', 'say', 0.25], ['it1', 'it', 0.5], ['soft', 'soft,', 0.75], ['say2', 'say', 1.25], ['it2', 'it', 1.5], ['slow', 'slow', 1.75]].forEach(([n, s, t0], i) => {
      const o = add(n, { s, f: 'serif', size: s1, x, y, t0, fx: n === 'slow' ? 'slow' : 'whisper' });
      x += o.w + sp1 * (i === 2 ? 2.6 : 1);
    });
    const sl = P.slow, n = sl.s.length, lastW = (sl.off[n] - sl.off[n - 1]) * 1.6;
    sl.step = (X1 - sl.x - lastW) / (n - 1);
    // line 2 — LOUD, full measure
    y += 54;
    let m = kMeas(c, 'sans', 100, 'LOUD');
    let sz = (100 * (X1 - X0)) / (m.l + m.r);
    m = kMeas(c, 'sans', sz, 'LOUD');
    const loudTop = y;
    y += m.a;
    add('loud', { s: 'LOUD', f: 'sans', size: sz, x: X0 + m.l, y, t0: 3.5, fx: 'loud' });
    // line 3 — let the words / STRETCH
    y += 58;
    const s3 = 60, sp3 = kMeas(c, 'serif', s3, ' ').w;
    y += kMeas(c, 'serif', s3, 'lt').a;
    x = X0;
    [['let', 'let', 4.5], ['the', 'the', 4.75], ['words', 'words', 5.0]].forEach(([nm, s, t0]) => { const o = add(nm, { s, f: 'serif', size: s3, x, y, t0, fx: 'type' }); x += o.w + sp3; });
    y += 26;
    m = kMeas(c, 'sans', 178, 'STRETCH');
    y += m.a;
    const st = add('stretch', { s: 'STRETCH', f: 'sans', size: 178, x: X0 + m.l, y, t0: 5.25, fx: 'stretch' });
    st.track = (X1 - X0 - (m.l + m.r)) / 6;
    // line 4 — till they / SHAKE
    y += 44;
    const Lc = 480;
    m = kMeas(c, 'sans', 100, 'SHAKE'); sz = (100 * (X1 - X0 - Lc)) / (m.l + m.r); m = kMeas(c, 'sans', sz, 'SHAKE');
    const top4 = y;
    y += m.a;
    add('shake', { s: 'SHAKE', f: 'sans', size: sz, x: X0 + Lc + m.l, y, t0: 6.5, fx: 'shake' });
    const s4 = m.a * 0.74;
    const wTill = kMeas(c, 'serif', s4, 'till').w, wThey = kMeas(c, 'serif', s4, 'they').w;
    add('till', { s: 'till', f: 'serif', size: s4, x: X0 + Lc - 34 - wTill, y: top4 + m.a * 0.47, t0: 6.0, fx: 'type' });
    add('they', { s: 'they', f: 'serif', size: s4, x: X0 + Lc - 34 - wThey, y, t0: 6.25, fx: 'type' });
    // line 5 — we were never / QUIET.
    y += 60;
    m = kMeas(c, 'sans', 100, 'QUIET.'); sz = (100 * (X1 - X0 - Lc)) / (m.l + m.r); m = kMeas(c, 'sans', sz, 'QUIET.');
    const top5 = y;
    y += m.a;
    add('quiet', { s: 'QUIET.', f: 'sans', size: sz, x: X0 + Lc + m.l, y, t0: 8.0, fx: 'loud', acc: true });
    const s5 = m.a * 0.5, s5b = m.a * 0.86;
    const wWe = kMeas(c, 'serif', s5, 'we ').w, wWere = kMeas(c, 'serif', s5, 'were').w, wNever = kMeas(c, 'serif', s5b, 'never').w;
    const r5 = X0 + Lc - 34;
    add('we', { s: 'we', f: 'serif', size: s5, x: r5 - wWe - wWere, y: top5 + m.a * 0.36, t0: 7.0, fx: 'type' });
    add('were', { s: 'were', f: 'serif', size: s5, x: r5 - wWere, y: top5 + m.a * 0.36, t0: 7.25, fx: 'type' });
    add('never', { s: 'never', f: 'serif', size: s5b, x: r5 - wNever, y, t0: 7.5, fx: 'grow' });
    const qs = m.a * 1.25;
    add('q2', { s: '”', f: 'roman', size: qs, x: X1 + 26, y: top5 + qs * 0.62, t0: 8.85, fx: 'quote', acc: true });
    const yEnd = y + 34;
    // strip — "then SAY IT", rotated up the left edge, from the poster foot to the top of LOUD
    const gap = 46, L = yEnd - loudTop;
    const wThen = kMeas(c, 'serif', 125, 'then ').w, mS = kMeas(c, 'sans', 100, 'SAY IT'), wSay = kMeas(c, 'sans', 100, 'SAY ').w;
    const f = L / (wThen + mS.r);
    const sx = X0 - gap, sy = yEnd;
    const capS = mS.a * f;
    add('then', { s: 'then', f: 'serif', size: 125 * f, x: sx, y: sy, rot: -Math.PI / 2, t0: 2.5, fx: 'type' });
    add('say3', { s: 'SAY', f: 'sans', size: 100 * f, x: sx, y: sy - wThen * f, rot: -Math.PI / 2, t0: 2.75, fx: 'slam' });
    add('it3', { s: 'IT', f: 'sans', size: 100 * f, x: sx, y: sy - (wThen + wSay) * f, rot: -Math.PI / 2, t0: 3.0, fx: 'slam' });
    // opening quote hangs over the strip, level with the whisper
    add('q1', { s: '“', f: 'roman', size: 330, x: sx - capS - 6, y: a1 + 150, t0: 0, fx: 'quote', acc: true });
    const bx0 = sx - capS, bx1 = X1 + 26 + qs * 0.35;
    const pw = bx1 - bx0, ph = yEnd;
    const zFit = Math.min((1920 * 0.86) / pw, (1080 * 0.84) / ph);
    // world centers
    list.forEach(o => {
      const lx = o.w / 2, ly = (o.d - o.a) / 2, cs = Math.cos(o.rot), sn = Math.sin(o.rot);
      o.cx = o.x + lx * cs - ly * sn; o.cy = o.y + lx * sn + ly * cs;
    });
    return { P, list, X0, X1, zFit, pcx: (bx0 + bx1) / 2, pcy: ph / 2, rules: { y2: loudTop - 27, yEnd, x0: bx0, x1: X1 }, capS, sx };
  }

  function kCamKeys(L) {
    const P = L.P;
    const at = (o, z, r = o.rot, dx = 0, dy = 0) => [o.cx + dx, o.cy + dy, z, r];
    const slowMid = P.slow.x + (L.X1 - P.slow.x) / 2;
    return [
      [0, ...at(P.q1, 6.5, 0.3, 0, 20)],
      [0.24, ...at(P.q1, 5.4, 0.14, 10, 10), E.outC],
      [0.62, ...at(P.say1, 2.05, 0.035, 230, -20), E.ioC],
      [1.25, ...at(P.soft, 1.85, -0.012, 60, -10), E.ioS],
      [2.32, slowMid - 40, P.slow.cy, 1.52, 0, E.ioS],
      [2.52, ...at(P.then, 1.85, -Math.PI / 2, 0, -60), E.ioX],
      [3.25, ...at(P.say3, 1.62, -Math.PI / 2, 0, -150), E.ioS],
      [3.5, ...at(P.loud, 1.07, 0), E.ioX],
      [4.44, ...at(P.loud, 0.965, 0.024), E.lin],
      [4.45, ...at(P.let, 2.3, 0, 60, 60), E.lin],
      [4.75, ...at(P.the, 2.15, 0, 60, 70), E.outC],
      [5.2, ...at(P.words, 1.85, 0, 120, 60), E.ioS],
      [5.95, P.stretch.x + (L.X1 - P.stretch.x) / 2, P.stretch.cy - 30, 1.03, 0, E.outC],
      [6.15, ...at(P.shake, 1.2, 0.045, -160, 0), E.ioX],
      [6.95, ...at(P.shake, 1.32, -0.025, -160, 0), E.ioS],
      [7.15, ...at(P.were, 2.1, 0, -40, 40), E.ioX],
      [7.72, ...at(P.never, 1.65, 0, 160, -30), E.ioS],
      [8.0, ...at(P.quiet, 1.1, 0, -150, -20), E.outQt],
      [8.25, ...at(P.quiet, 1.06, 0, -150, -20), E.lin],
      [9.05, L.pcx, L.pcy, L.zFit, 0, E.ioC],
      [10, L.pcx, L.pcy, L.zFit * 1.018, 0, E.lin],
    ];
  }
  function kCam(keys, t) {
    if (t <= keys[0][0]) return keys[0].slice(1, 5);
    for (let i = 1; i < keys.length; i++) {
      const k = keys[i];
      if (t <= k[0]) {
        const p = keys[i - 1], e = (k[5] || E.ioC)((t - p[0]) / (k[0] - p[0]));
        return [lerp(p[1], k[1], e), lerp(p[2], k[2], e), lerp(p[3], k[3], e), lerp(p[4], k[4], e)];
      }
    }
    return keys[keys.length - 1].slice(1, 5);
  }

  // draws glyphs one by one with a per-letter transform
  function kChars(c, o, fn) {
    for (let i = 0; i < o.s.length; i++) {
      const q = fn(i);
      if (!q) continue;
      c.save();
      c.translate(q.x, q.y || 0);
      if (q.rot) c.rotate(q.rot);
      if (q.sx && q.sx !== 1) c.scale(q.sx, q.sy || 1);
      c.fillText(o.s[i], 0, 0);
      c.restore();
    }
  }

  function kPiece(c, o, t, ink, acc, final) {
    const dt = t - o.t0;
    if (dt < 0) return;
    c.save();
    c.translate(o.x, o.y);
    if (o.rot) c.rotate(o.rot);
    kSet(c, o.f, o.size);
    c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    const col = o.acc ? acc : ink;
    const dim = final > 0 && !o.acc && !['never', 'we', 'were'].includes(o.name) ? 1 - final * 0.28 : 1;
    c.fillStyle = css(col, dim);
    const scaleAbout = s => { c.translate(o.w / 2, -o.a / 2); c.scale(s, s); c.translate(-o.w / 2, o.a / 2); };
    switch (o.fx) {
      case 'whisper': {
        const p = E.outC(seg(dt, 0, 0.6));
        c.globalAlpha = p;
        const b = (1 - p) * 9;
        if (b > 0.4) c.filter = `blur(${b.toFixed(1)}px)`;
        c.translate(0, (1 - p) * 14);
        const ls = (1 - p) * 16;
        kChars(c, o, i => ({ x: o.off[i] + i * ls }));
        break;
      }
      case 'type': {
        const p = E.outQt(seg(dt, 0, 0.22));
        c.globalAlpha = seg(dt, 0, 0.08);
        c.translate(0, (1 - p) * o.size * 0.22);
        c.fillText(o.s, 0, 0);
        break;
      }
      case 'slam': case 'loud': {
        const amp = o.fx === 'loud' ? 2.6 : 1.7;
        scaleAbout(1 + (1 - spring(dt, o.fx === 'loud' ? 3.4 : 4.4, 0.34)) * amp);
        c.globalAlpha = seg(dt, 0, 0.025);
        c.fillText(o.s, 0, 0);
        break;
      }
      case 'grow': {
        scaleAbout(0.3 + 0.7 * spring(dt, 2.4, 0.42));
        c.globalAlpha = seg(dt, 0, 0.06);
        const lsN = (1 - E.outC(seg(dt, 0, 0.45))) * 26;
        kChars(c, o, i => ({ x: o.off[i] + (i - 2) * lsN }));
        break;
      }
      case 'quote': {
        const s = spring(dt, 2.2, 0.45);
        c.translate(o.w / 2, (o.d - o.a) / 2);
        c.rotate((1 - s) * -0.9);
        c.scale(Math.max(0.01, s), Math.max(0.01, s));
        c.translate(-o.w / 2, -(o.d - o.a) / 2);
        c.globalAlpha = seg(dt, 0, 0.05);
        c.fillText(o.s, 0, 0);
        break;
      }
      case 'slow': {
        const p = E.outC(seg(dt, 0.05, 0.75));
        c.globalAlpha = E.outC(seg(dt, 0, 0.35));
        const b = (1 - seg(dt, 0, 0.35)) * 8;
        if (b > 0.4) c.filter = `blur(${b.toFixed(1)}px)`;
        kChars(c, o, i => ({ x: lerp(o.off[i], i * o.step, p), sx: lerp(1, 1.6, p) }));
        break;
      }
      case 'stretch': {
        const s0 = spring(dt, 4, 0.4);
        scaleAbout(1 + (1 - s0) * 0.9);
        c.globalAlpha = seg(dt, 0, 0.03);
        const tr = o.track * spring(dt - 0.08, 1.25, 0.38);
        const sq = 1 + 0.35 * Math.sin(Math.PI * clamp((dt - 0.08) / 0.7)) * (1 - seg(dt, 0.4, 0.9));
        kChars(c, o, i => ({ x: o.off[i] + i * tr, sx: sq, sy: 1 / Math.sqrt(sq) }));
        break;
      }
      case 'shake': {
        scaleAbout(1 + (1 - spring(dt, 4.4, 0.34)) * 1.5);
        c.globalAlpha = seg(dt, 0, 0.025);
        const amp = (3 + 15 * Math.exp(-dt * 2.2)) * (1 - seg(t, 7.0, 7.45));
        const tt = Math.floor(t * 24) / 24; // jitter on twos, hand-animated feel
        kChars(c, o, i => ({ x: o.off[i] + vnoise(tt * 31 + i * 7.3, 3) * amp, y: vnoise(tt * 29 + i * 5.1, 9) * amp, rot: vnoise(tt * 23 + i * 3.7, 5) * amp * 0.006 }));
        break;
      }
    }
    c.restore();
  }

  function kWorld(c, t, st, cam, ink, acc, final, alpha) {
    const [cx, cy, z, r] = cam;
    c.save();
    c.globalAlpha = alpha;
    c.translate(960, 540);
    c.rotate(-r);
    c.scale(z, z);
    c.translate(-cx, -cy);
    // hairline rules of the poster system, drawn as the pieces arrive
    const R = st.L.rules;
    c.fillStyle = css(ink, 0.5 * alpha);
    const r1 = E.outQt(seg(t, 2.0, 2.45));
    if (r1 > 0) c.fillRect(st.L.X0, R.y2, (R.x1 - st.L.X0) * r1, 2);
    const r2 = E.outQt(seg(t, 8.5, 9.0));
    if (r2 > 0) c.fillRect(R.x0, R.yEnd + 18, (R.x1 - R.x0) * r2, 2);
    for (const o of st.L.list) kPiece(c, o, t, ink, acc, final);
    c.restore();
  }

  MG.film({
    id: 'kinetic', dur: 10, poster: 9.5,
    fonts: [['900 200px Archivo', 'LOUDSTRETCHAKEQIY.'], ['italic 400 100px "Instrument Serif"', 'say it soft, slow then let the words till they we were never'], ['400 300px "Instrument Serif"', '“”'], ['400 14px "JetBrains Mono"', 'Aa1·—♩=']],
    meta: {
      family: 'B', name: 'Expressive Kinetic Type', sub: 'Type with a Voice', era: '1959 —',
      origin: 'Saul Bass and Pablo Ferro made words perform in film titles; in the 2000s After Effects lyric and dialogue pieces turned "kinetic typography" into a genre, where size, weight and placement follow the rhythm of a voice.',
      works: 'North by Northwest titles (Saul Bass, 1959) · Dr. Strangelove titles (Pablo Ferro, 1964) · Jamie xx, "Let\'s Do It Again" (2016) · Pulp Fiction kinetic type tributes (2000s)',
      tech: ['Camera flies through a typographic poster', 'Spring slams, stretch & shake per glyph', 'Serif whisper vs. black sans shout'],
      accent: '#ff3e24',
      motionDNA: 'Every word moves the way it is sung: whispers blur in, shouts slam with overshoot, stretched words track out and shaken words tremble, while the camera whips and rotates between phrases.',
      visualDNA: 'Black-weight grotesk against a hairline italic serif, bone on soot with one vermilion, all words locking into a single justified poster.',
      transitions: 'Whip pans with motion blur, 90° camera rolls, full-frame colour inversions on the downbeat, final pull-out reveal.',
      implementation: ['After Effects', 'Canvas 2D', 'Web Audio'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H, st) {
      setLS(c, 0);
      if (!st.L) { st.L = kLayout(c); st.keys = kCamKeys(st.L); }
      const red = seg(t, 3.5, 3.515) * (1 - seg(t, 4.4, 4.48));
      const bg = mixRGB(KBG, KACC, red), ink = mixRGB(KINK, KDK, red), acc = mixRGB(KACC, KDK, red);
      c.fillStyle = css(bg); c.fillRect(0, 0, W, H);
      const final = E.ioC(seg(t, 8.9, 9.4));
      // camera + shake
      const shake = tt => {
        let x = 0, y = 0, r = 0;
        K_HITS.forEach(([h, a], i) => {
          const d = decay(tt, h, 9);
          if (d > 0.002) { x += a * d * vnoise(tt * 38, i + 1); y += a * d * vnoise(tt * 41, i + 11); r += a * d * 0.0009 * vnoise(tt * 30, i + 21); }
        });
        return [x, y, r];
      };
      const camAt = tt => {
        const k = kCam(st.keys, tt), s = shake(tt);
        return [k[0] - s[0] / k[2], k[1] - s[1] / k[2], k[2], k[3] + s[2]];
      };
      const cam = camAt(t), prev = camAt(t - 1 / 60);
      const speed = Math.hypot(cam[0] - prev[0], cam[1] - prev[1]) * cam[2] + Math.abs(cam[3] - prev[3]) * 900 + Math.abs(Math.log(cam[2] / prev[2])) * 900;
      if (speed > 70 && speed < 1500) {
        const N = speed > 140 ? 5 : 3;
        for (let i = N; i >= 1; i--) kWorld(c, t, st, camAt(t - (i / N) * (1 / 30)), ink, acc, final, 0.16);
      }
      kWorld(c, t, st, cam, ink, acc, final, 1);
      // QUIET downbeat flash
      const fl = decay(t, 8.0, 7) * 0.5 + decay(t, 3.5, 10) * 0.25;
      if (fl > 0.01) { c.fillStyle = `rgba(255,248,236,${fl})`; c.fillRect(0, 0, W, H); }
      // screen furniture
      const ui = css(ink, 0.5);
      c.font = `400 14px ${MONO}`; c.fontStretch = 'normal';
      setLS(c, 2.5);
      c.fillStyle = ui; c.textBaseline = 'alphabetic';
      c.globalAlpha = 1 - final;
      c.textAlign = 'left'; c.fillText('NEVER QUIET — LYRIC Nº 01', 56, 64);
      c.textAlign = 'right'; c.fillText('♩ = 120   4/4', W - 56, 64);
      c.globalAlpha = 1;
      c.textAlign = 'left'; c.fillText(t < 2.5 ? 'p — pianissimo' : t < 3.5 ? 'mf — crescendo' : t < 4.5 ? 'ff — fortissimo' : t < 8 ? 'f — con moto' : 'fff — fine', 56, H - 52);
      setLS(c, 0);
      const beat = Math.floor(t / 0.5) % 4, bp = (t / 0.5) % 1;
      for (let i = 0; i < 4; i++) {
        c.fillStyle = i === beat && t < 8.4 ? css(acc, 1 - bp * 0.6) : css(ink, 0.25);
        c.fillRect(W - 56 - (3 - i) * 22 - 12, H - 64, 12, 12);
      }
      vignette(c, W, H, 0.5);
      grain(c, W, H, t, 0.07, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.62; A.send.gain.value = 0.6;
      const voc = (t, m, dur, o = {}) => {
        const f = midi(m), f2 = o.to ? midi(o.to) : 0, g = o.g ?? 0.07, lp = o.lp ?? 1600;
        const vib = o.vib || [5.2, f * 0.012];
        A.osc(t, { type: 'sawtooth', f, f2, glide: o.glide ?? dur, dur, g, a: o.a ?? 0.025, lp, lp2: lp * 0.55, lpT: dur, q: 4, vib, rev: o.rev ?? 0.35, pan: -0.12, hold: true, rel: 0.09 });
        A.osc(t, { type: 'sawtooth', f, f2, glide: o.glide ?? dur, dur, g: g * 0.7, detune: 9, a: o.a ?? 0.025, lp: lp * 0.8, q: 2, vib, rev: o.rev ?? 0.35, pan: 0.12, hold: true, rel: 0.09 });
        A.osc(t, { type: 'triangle', f: f * 2, f2: f2 ? f2 * 2 : 0, glide: o.glide ?? dur, dur, g: g * 0.3, a: (o.a ?? 0.025) * 2, vib, rev: 0.4, hold: true, rel: 0.09 });
        A.noise(t - 0.012, { type: 'bandpass', f: o.cons ?? 5200, q: 1.6, dur: 0.05, g: g * (o.breath ?? 0.9) });
      };
      // — the whisper: open quote, room air, soft Em9 pad, ticking 8ths
      A.osc(0, { f: midi(40), f2: midi(28), glide: 0.5, dur: 0.9, g: 0.3 });
      A.bell(0.01, midi(83), { g: 0.05, dur: 1.6, rev: 0.6 });
      A.chord(0.05, [40, 52, 55, 59, 62, 66], { type: 'sine', dur: 2.5, g: 0.03, a: 0.9, hold: true, rel: 0.5, rev: 0.6, width: 1 });
      A.noise(0.0, { type: 'bandpass', f: 1400, q: 0.5, dur: 2.4, g: 0.02, swell: 0.5, rev: 0.4 });
      for (let k = 0; k < 9; k++) A.hat(0.25 + k * 0.25, k % 2 ? 0.018 : 0.03, false, { pan: k % 2 ? 0.45 : -0.45, f: 9500 });
      voc(0.25, 64, 0.22, { g: 0.035, lp: 900, breath: 2.2, rev: 0.6 });
      voc(0.5, 62, 0.2, { g: 0.035, lp: 900, breath: 2.2, rev: 0.6 });
      voc(0.75, 59, 0.42, { g: 0.04, lp: 900, breath: 2.4, to: 57, glide: 0.42, rev: 0.6 });
      voc(1.25, 64, 0.22, { g: 0.04, lp: 1000, breath: 1.8, rev: 0.6 });
      voc(1.5, 62, 0.2, { g: 0.04, lp: 1000, breath: 1.8, rev: 0.6 });
      voc(1.75, 59, 0.62, { g: 0.05, lp: 1100, to: 52, glide: 0.62, vib: [3.5, 4], rev: 0.6 });
      A.pluck(1.75, midi(47), { g: 0.25, bright: 0.4, dur: 1.2, rev: 0.4 });
      // — crescendo: whip, then SAY IT slams
      A.whoosh(2.26, 0.3, { f1: 300, f2: 6000, g: 0.22, swell: 0.85, pan: -0.5 });
      voc(2.5, 59, 0.2, { g: 0.05, lp: 1400 });
      [[2.75, 67], [3.0, 69]].forEach(([s, m], i) => {
        A.kick(s, 0.85);
        A.osc(s, { type: 'sawtooth', f: midi(28 + i * 2), dur: 0.24, g: 0.18, lp: 260, lp2: 2600, lpT: 0.04, q: 6 });
        A.noise(s, { type: 'bandpass', f: 1600, q: 0.8, dur: 0.16, g: 0.2, rev: 0.3 });
        voc(s, m, 0.22, { g: 0.1, lp: 2600, breath: 0.8 });
      });
      A.whoosh(3.24, 0.28, { f1: 500, f2: 7000, g: 0.2, swell: 0.9, pan: 0.5 });
      A.noise(3.05, { type: 'highpass', f: 3000, dur: 0.45, g: 0.12, swell: 0.97 });
      // — LOUD: downbeat, inversion
      A.impact(3.5, 0.75);
      A.kick(3.5, 1.0);
      A.noise(3.5, { type: 'highpass', f: 5000, dur: 1.1, g: 0.14, rev: 0.4 });
      A.chord(3.5, [40, 47, 52, 59], { type: 'sawtooth', dur: 0.95, g: 0.045, lp: 4000, lp2: 500, lpT: 0.9, spread: 12, rev: 0.4, width: 1.2 });
      voc(3.5, 71, 0.9, { g: 0.12, lp: 3200, to: 72, glide: 0.2, vib: [6, 9], breath: 0.6 });
      // — groove: let the words STRETCH / till they SHAKE / we were never
      const roots = [40, 36, 43, 38];
      for (let b = 0; b < 8; b++) {
        const s = 4.0 + b * 0.5, root = roots[Math.floor(b / 2) % 4];
        A.kick(s, b % 2 ? 0.7 : 0.8);
        if (b % 2 === 1) A.clap(s, 0.22);
        A.hat(s + 0.25, 0.06, b % 4 === 3, { pan: 0.3 });
        if (b >= 5) { A.hat(s + 0.125, 0.035, false, { pan: -0.3 }); A.hat(s + 0.375, 0.035, false, { pan: -0.3 }); }
        A.osc(s, { type: 'sawtooth', f: midi(root), dur: 0.42, g: 0.1, lp: 200, lp2: 1800, lpT: 0.15, q: 5 });
        A.osc(s + 0.25, { type: 'sawtooth', f: midi(root + 12), dur: 0.2, g: 0.04, lp: 1200, lp2: 300, lpT: 0.2, q: 3 });
      }
      voc(4.5, 64, 0.2, { g: 0.07 }); voc(4.75, 64, 0.2, { g: 0.07 }); voc(5.0, 67, 0.22, { g: 0.08 });
      voc(5.25, 67, 0.72, { g: 0.1, to: 74, glide: 0.7, lp: 2400, vib: [4, 3] });
      A.osc(5.25, { type: 'sawtooth', f: midi(43), f2: midi(55), glide: 0.7, dur: 0.72, g: 0.06, lp: 400, lp2: 3000, lpT: 0.7, q: 5 });
      voc(6.0, 69, 0.2, { g: 0.08 }); voc(6.25, 67, 0.2, { g: 0.08 });
      voc(6.5, 72, 0.48, { g: 0.11, lp: 2800, vib: [11, 22] });
      A.noise(6.5, { type: 'bandpass', f: 2400, q: 3, dur: 0.4, g: 0.08, rev: 0.2 });
      voc(7.0, 64, 0.2, { g: 0.08 }); voc(7.25, 67, 0.2, { g: 0.08 });
      voc(7.5, 71, 0.45, { g: 0.1, lp: 2400, vib: [5.5, 6] });
      for (let k = 0; k < 8; k++) A.snare(7.0 + k * 0.125 * (1 - k * 0.04), 0.06 + k * 0.022, { rev: 0.1 });
      A.riser(7.0, 1.0, { g: 0.16, f: 98 });
      // — QUIET. One hit, then the music drops out (the joke), and a soft resolve
      A.impact(8.0, 0.85);
      A.kick(8.0, 1.0);
      A.chord(8.0, [40, 52, 59, 64, 67, 71], { type: 'sawtooth', dur: 0.7, g: 0.04, lp: 5000, lp2: 600, lpT: 0.6, spread: 12, rev: 0.7, width: 1.4 });
      voc(8.0, 76, 0.55, { g: 0.12, lp: 3400, to: 71, glide: 0.5, vib: [6, 8], rev: 0.7 });
      A.chord(8.85, [43, 55, 59, 62, 66], { type: 'sine', dur: 1.15, g: 0.035, a: 0.3, hold: true, rel: 0.4, rev: 0.6, width: 1 });
      A.bell(8.86, midi(78), { g: 0.06, dur: 1.2, rev: 0.6 });
      A.osc(8.85, { f: midi(43), f2: midi(31), glide: 0.4, dur: 0.8, g: 0.22 });
    },
  });

  /* ================================================================
     02 TEXT MORPHING — IDEA → SHAPE → MOTION → FORM.
     Each word is rasterised offscreen and sampled on a 5 px grid into a
     point cloud; clouds are resampled to one count, matched column by
     column, and flown with per-point delay, curl and spring overshoot.
     The cloud is rendered as liquid (stroked smears → blur → threshold),
     and resolves into crisp type at rest.
     ================================================================ */
  const TM_WORDS = ['IDEA', 'SHAPE', 'MOTION', 'FORM'];
  const TM_FONT = 'Unbounded';
  const TM_STEP = 4, TM_CY = 492;
  const TM_SEGS = [
    [-1, 0, 0.3, 1.45, 'burst'],
    [0, 1, 1.95, 3.05, 'flow'],
    [1, 2, 3.7, 4.85, 'flow'],
    [2, 3, 5.6, 7.55, 'vortex'],
  ];
  const TINK = [241, 238, 230], TACC = [206, 255, 64];
  const tmSpring = w => (w <= 0 ? 0 : w >= 1.6 ? 1 : lerp(spring(w, 1.5, 0.42), 1, seg(w, 1.1, 1.6)));

  function tmSample(word) {
    const cv = offscreen(1920, 1080), g = cv.getContext('2d');
    g.font = `800 100px ${TM_FONT}`;
    let m = g.measureText(word);
    const sz = 100 * Math.min(1400 / (m.actualBoundingBoxLeft + m.actualBoundingBoxRight), 236 / m.actualBoundingBoxAscent);
    g.font = `800 ${sz}px ${TM_FONT}`;
    m = g.measureText(word);
    const x = 960 + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2;
    const y = TM_CY + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
    g.fillStyle = '#fff';
    g.fillText(word, x, y);
    const d = g.getImageData(0, 0, 1920, 1080).data, pts = [];
    for (let px = 2; px < 1920; px += TM_STEP) for (let py = 2; py < 1080; py += TM_STEP) if (d[(py * 1920 + px) * 4 + 3] > 127) pts.push(px, py);
    return { word, sz, x, y, pts, top: y - m.actualBoundingBoxAscent, bot: y + m.actualBoundingBoxDescent, l: x - m.actualBoundingBoxLeft, r: x + m.actualBoundingBoxRight };
  }
  function tmInit(st) {
    st.W = TM_WORDS.map(tmSample);
    const N = Math.max(...st.W.map(w => w.pts.length / 2));
    st.N = N;
    st.W.forEach(w => {
      const n = w.pts.length / 2, P = new Float32Array(N * 2);
      for (let j = 0; j < N; j++) {
        const k = Math.floor((j * n) / N);
        P[j * 2] = w.pts[k * 2]; P[j * 2 + 1] = w.pts[k * 2 + 1];
      }
      w.P = P;
    });
    const r = rng(77);
    st.h1 = new Float32Array(N); st.h2 = new Float32Array(N); st.h3 = new Float32Array(N);
    for (let i = 0; i < N; i++) { st.h1[i] = r(); st.h2[i] = r(); st.h3[i] = r(); }
    // per-segment delays
    st.del = TM_SEGS.map(([a, b, , , kind], k) => {
      const D = new Float32Array(N), B = st.W[b].P;
      for (let i = 0; i < N; i++) {
        const bx = B[i * 2], by = B[i * 2 + 1];
        if (kind === 'burst') D[i] = clamp(Math.hypot(bx - 960, (by - TM_CY) * 1.6) / 760) * 0.3 + st.h1[i] * 0.015;
        else if (kind === 'vortex') { const nx = clamp((st.W[a].P[i * 2] - 260) / 1400); D[i] = nx * 0.12 + vnoise(st.W[a].P[i * 2 + 1] * 0.01, 4) * 0.02 + 0.02; }
        else {
          const ax = st.W[a].P[i * 2], ay = st.W[a].P[i * 2 + 1], nx = clamp((ax - 260) / 1400);
          D[i] = (k === 2 ? 1 - nx : nx) * 0.3 + (vnoise(ay * 0.012 + nx * 4, k) + 1) * 0.025;
        }
      }
      return D;
    });
    st.X = new Float32Array(N); st.Y = new Float32Array(N); st.QX = new Float32Array(N); st.QY = new Float32Array(N);
    st.bufA = offscreen(960, 540); st.bufB = offscreen(960, 540); st.bufC = offscreen(960, 540);
    const gp = offscreen(24, 24), gg = gp.getContext('2d');
    gg.fillStyle = 'rgba(255,255,255,1)'; gg.fillRect(11, 11, 2, 2);
    st.gridCv = gp;
  }
  function tmSegAt(t) {
    let k = -1;
    for (let i = 0; i < TM_SEGS.length; i++) if (t >= TM_SEGS[i][2]) k = i;
    return k;
  }
  function tmFill(st, t, X, Y) {
    const N = st.N, k = tmSegAt(t);
    if (k < 0) {
      const r0 = 30 * E.outB(seg(t, 0.0, 0.22), 2.2) + 3 * Math.sin(t * 30) * seg(t, 0.1, 0.3);
      for (let i = 0; i < N; i++) {
        const an = st.h1[i] * TAU, rr = Math.sqrt(st.h2[i]) * r0;
        X[i] = 960 + Math.cos(an) * rr; Y[i] = TM_CY + Math.sin(an) * rr;
      }
      return;
    }
    const [a, b, t0, t1, kind] = TM_SEGS[k];
    const B = st.W[b].P, A = a >= 0 ? st.W[a].P : null, D = st.del[k];
    const u = (t - t0) / (t1 - t0);
    if (u >= 1.7) { for (let i = 0; i < N; i++) { X[i] = B[i * 2]; Y[i] = B[i * 2 + 1]; } return; }
    const spin = (t - t0) * 2.4 + Math.pow(Math.max(0, t - t0), 2) * 0.9;
    for (let i = 0; i < N; i++) {
      const bx = B[i * 2], by = B[i * 2 + 1];
      let ax, ay;
      if (A) { ax = A[i * 2]; ay = A[i * 2 + 1]; }
      else { const an = st.h1[i] * TAU, rr = Math.sqrt(st.h2[i]) * 30; ax = 960 + Math.cos(an) * rr; ay = TM_CY + Math.sin(an) * rr; }
      const v = (u - D[i]) / 0.62;
      if (v <= 0) { X[i] = ax; Y[i] = ay; continue; }
      if (kind === 'vortex') {
        const e1 = E.ioC(clamp(v / 0.36)), e2 = tmSpring(Math.max(0, v - 0.62) / 0.42);
        const ord = (ax - 260) / 1400, hy = (ay - TM_CY) / 120;
        const th = Math.PI * 0.5 + ord * TAU * 0.92 + spin;
        const R = 560 + hy * 70 + 30 * Math.sin(ord * 9 + t * 4);
        const rx = 960 + Math.cos(th) * R, ry = TM_CY + Math.sin(th) * R * 0.3 + hy * 22;
        const mx = lerp(ax, rx, e1), my = lerp(ay, ry, e1);
        X[i] = lerp(mx, bx, e2); Y[i] = lerp(my, by, e2);
      } else if (kind === 'burst') {
        const e = tmSpring(v);
        const sw = Math.sin(Math.PI * clamp(v * 1.2)) * vnoise(Math.atan2(by - TM_CY, bx - 960) * 3, 7) * 160;
        const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
        X[i] = lerp(ax, bx, e) - (dy / L) * sw; Y[i] = lerp(ay, by, e) + (dx / L) * sw;
      } else {
        const e = tmSpring(v), el = E.ioS(clamp(v));
        const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
        const curl = Math.sin(Math.PI * el) * vnoise(ax * 0.004 + ay * 0.002, k * 3) * (0.5 + L * 0.0011) * 200;
        const sag = Math.sin(Math.PI * el) * (50 + (vnoise(ax * 0.003, k + 9) + 1) * 60) * (k === 2 ? -1 : 1);
        const nx = L ? -dy / L : 0, ny = L ? dx / L : 1;
        X[i] = lerp(ax, bx, e) + nx * curl; Y[i] = lerp(ay, by, e) + ny * curl + sag;
      }
    }
  }

  MG.film({
    id: 'textmorph', dur: 10, poster: 9.5,
    fonts: [['800 200px Unbounded', 'IDEASHPMOTNFR'], ['italic 400 44px "Instrument Serif"', 'an idea, given shape, set in motion, becomes form.'], ['400 14px "JetBrains Mono"', 'Aa1·→=,%/'], ['700 14px "JetBrains Mono"', 'IDEASHPMOTNFR']],
    meta: {
      family: 'B', name: 'Text Morphing', sub: 'One Word Becomes the Next', era: '1991 —',
      origin: 'Shape morphing went mainstream with the Beier–Neely field-morphing of Michael Jackson\'s "Black or White" (1991) and After Effects shape-layer tweening; on the web, sampling glyphs into particles let one word liquefy into the next.',
      works: '"Black or White" morph sequence (Pacific Data Images, 1991) · After Effects shape-layer path morphs · Google I/O countdown experiments · Apple "Shot on iPhone" type transitions',
      tech: ['Glyph raster → 5 px point cloud', 'Column-ordered point matching', 'Spring overshoot, curl & smear', 'Blur + threshold liquid render'],
      accent: '#ceff40',
      motionDNA: 'Letters never cut: mass flows from word to word in a staggered wave, overshoots like a liquid, leaves a smear, then snaps crisp.',
      visualDNA: 'One heavy geometric face in bone white on near-black, an acid-lime trace of the motion, specimen-style mono read-outs.',
      transitions: 'Point-cloud morph, droplet burst, vortex ring, liquid splash on landing.',
      implementation: ['Canvas 2D', 'After Effects shape morph', 'WebGL particles'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H, st) {
      setLS(c, 0);
      if (!st.W) tmInit(st);
      const N = st.N;
      // ground: soft vignette + sampling grid
      const bg = c.createRadialGradient(960, 500, 100, 960, 540, 1150);
      bg.addColorStop(0, '#16161a'); bg.addColorStop(1, '#050506');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      const k = tmSegAt(t), sg = k >= 0 ? TM_SEGS[k] : null;
      const moving = sg ? seg(t, sg[2], sg[2] + 0.15) * (1 - seg(t, sg[3] + 0.1, sg[3] + 0.5)) : 0;
      c.save();
      c.globalAlpha = 0.05 + 0.06 * moving;
      c.fillStyle = c.createPattern(st.gridCv, 'repeat');
      c.fillRect(0, 0, W, H);
      c.restore();
      // positions now and a beat ago (smear)
      tmFill(st, t, st.X, st.Y);
      tmFill(st, Math.max(0, t - 0.04), st.QX, st.QY);
      const X = st.X, Y = st.Y, QX = st.QX, QY = st.QY;
      // crisp type at rest
      let crisp = 0, word = null;
      if (k >= 0) {
        const nxt = TM_SEGS[k + 1];
        crisp = seg(t, sg[3] - 0.02, sg[3] + 0.2) * (nxt ? 1 - seg(t, nxt[2] - 0.06, nxt[2] + 0.06) : 1);
        word = st.W[sg[1]];
      }
      const pathAll = (g, s, j0, dj) => {
        g.beginPath();
        for (let i = j0; i < N; i += dj) { g.moveTo(QX[i] * s, QY[i] * s); g.lineTo(X[i] * s + 0.01, Y[i] * s); }
      };
      // bloom: the cloud blurred at half res, screened underneath
      const a = st.bufA.getContext('2d');
      a.globalCompositeOperation = 'source-over';
      a.fillStyle = '#000'; a.fillRect(0, 0, 960, 540);
      a.strokeStyle = css(TINK); a.lineCap = 'round'; a.lineWidth = 2.2;
      pathAll(a, 0.5, 0, 1); a.stroke();
      const b = st.bufB.getContext('2d');
      b.fillStyle = '#000'; b.fillRect(0, 0, 960, 540);
      b.filter = 'blur(6px)'; b.drawImage(st.bufA, 0, 0); b.filter = 'none';
      c.save();
      c.globalCompositeOperation = 'screen';
      c.globalAlpha = 0.32 * (1 - crisp * 0.6);
      c.drawImage(st.bufB, 0, 0, 1920, 1080);
      c.restore();
      // acid-lime motion trace on the fastest points
      c.save();
      c.lineCap = 'round';
      for (let pass = 0; pass < 2; pass++) {
        c.beginPath();
        for (let i = pass * 3; i < N; i += 7) {
          const dx = X[i] - QX[i], dy = Y[i] - QY[i], sp = dx * dx + dy * dy;
          if (pass === 0 ? sp > 300 && sp < 3000 : sp >= 3000) { c.moveTo(QX[i] - dx * 1.5, QY[i] - dy * 1.5); c.lineTo(X[i], Y[i]); }
        }
        c.strokeStyle = css(TACC, pass === 0 ? 0.22 : 0.42);
        c.lineWidth = pass === 0 ? 1 : 1.3;
        c.stroke();
      }
      // the cloud itself: one stroked path, each point a smear from where it was 40 ms ago
      c.globalAlpha = 1 - crisp * 0.85;
      c.strokeStyle = css(TINK);
      // width follows speed: solid at rest, fine particles in flight
      [[0, 4, 4.6], [4, 64, 2.6], [64, 1e9, 1.5]].forEach(([lo, hi, lw]) => {
        c.beginPath();
        for (let i = 0; i < N; i++) {
          const dx = X[i] - QX[i], dy = Y[i] - QY[i], sp = dx * dx + dy * dy;
          if (sp >= lo && sp < hi) { c.moveTo(QX[i], QY[i]); c.lineTo(X[i] + 0.01, Y[i]); }
        }
        c.lineWidth = lw; c.stroke();
      });
      c.restore();
      if (crisp > 0.001) {
        c.save();
        c.globalAlpha = crisp;
        c.font = `800 ${word.sz}px ${TM_FONT}`;
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
        const g2 = c.createLinearGradient(0, 300, 0, 660);
        g2.addColorStop(0, '#ffffff'); g2.addColorStop(0.55, css(TINK)); g2.addColorStop(1, '#c9c6bf');
        c.fillStyle = g2;
        c.fillText(word.word, word.x, word.y);
        c.restore();
      }
      // droplet ripples (hook) and landing shock
      const ring = (t0, x, y, rMax, life, al) => {
        const p = seg(t, t0, t0 + life);
        if (p <= 0 || p >= 1) return;
        c.strokeStyle = css(TACC, al * (1 - p));
        c.lineWidth = 1.5;
        c.beginPath(); c.ellipse(x, y, rMax * E.outC(p), rMax * E.outC(p) * 0.36, 0, 0, TAU); c.stroke();
      };
      ring(0.04, 960, TM_CY, 260, 0.8, 0.9); ring(0.16, 960, TM_CY, 420, 0.9, 0.6); ring(0.3, 960, TM_CY, 900, 1.0, 0.5);
      ring(7.5, 960, TM_CY + 40, 1300, 1.3, 0.8); ring(7.6, 960, TM_CY + 40, 900, 1.1, 0.5);
      const fl = decay(t, 7.52, 6) * 0.22;
      if (fl > 0.01) { c.fillStyle = `rgba(230,255,170,${fl})`; c.fillRect(0, 0, W, H); }
      // closing: rule + caption
      const W3 = st.W[3];
      const rp = E.ioX(seg(t, 7.7, 8.3));
      if (rp > 0) { c.fillStyle = css(TACC); c.fillRect(960 - 360 * rp, W3.bot + 58, 720 * rp, 2); }
      if (t > 7.9) {
        const cap = 'an idea, given shape, set in motion, becomes form.'.split(' ');
        c.font = `italic 400 46px "Instrument Serif"`;
        c.textBaseline = 'alphabetic'; c.textAlign = 'left';
        const sp = c.measureText(' ').width, ws = cap.map(w => c.measureText(w).width);
        let x = 960 - (ws.reduce((s, w) => s + w, 0) + sp * (cap.length - 1)) / 2;
        cap.forEach((w, i) => {
          const p = E.outC(seg(t, 7.95 + i * 0.09, 8.45 + i * 0.09));
          c.fillStyle = css(TINK, p * (i === cap.length - 1 ? 1 : 0.78));
          c.fillText(w, x, W3.bot + 140 + (1 - p) * 16);
          x += ws[i] + sp;
        });
      }
      // read-outs
      c.font = `400 14px ${MONO}`;
      setLS(c, 2.6);
      c.textBaseline = 'alphabetic';
      c.fillStyle = css(TINK, 0.55);
      c.textAlign = 'left';
      c.fillText('TEXT MORPHING', 64, 70);
      c.fillStyle = css(TINK, 0.32);
      c.fillText('GLYPH → POINT CLOUD → GLYPH', 64, 96);
      c.textAlign = 'right';
      const idx = k < 0 ? 0 : k + (crisp > 0.5 || (sg && t > sg[3]) ? 1 : 0);
      c.fillStyle = css(TINK, 0.55);
      c.fillText(`${String(Math.max(1, idx)).padStart(2, '0')} / 04`, W - 64, 70);
      c.fillStyle = css(TINK, 0.32);
      c.fillText(`N = ${N.toLocaleString('en-US')} PTS · GRID ${TM_STEP} PX`, W - 64, 96);
      // chain
      setLS(c, 4);
      c.font = `700 14px ${MONO}`;
      const chain = TM_WORDS, gapW = 120;
      const cw = chain.map(w => c.measureText(w).width);
      let x = 960 - (cw.reduce((s, w) => s + w, 0) + gapW * 3) / 2;
      const yC = 990;
      chain.forEach((w, i) => {
        const on = i < idx;
        c.fillStyle = i === idx - 1 ? css(TACC) : css(TINK, on ? 0.6 : 0.22);
        c.textAlign = 'left';
        c.fillText(w, x, yC);
        x += cw[i];
        if (i < 3) {
          const sgI = TM_SEGS[i + 1], p = clamp((t - sgI[2]) / (sgI[3] - sgI[2]));
          c.fillStyle = css(TINK, 0.18); c.fillRect(x + 20, yC - 5, gapW - 40, 1);
          c.fillStyle = css(TACC, 0.9); c.fillRect(x + 20, yC - 5, (gapW - 40) * p, 1);
          x += gapW;
        }
      });
      setLS(c, 0);
      if (sg && t < sg[3] + 0.2) {
        const p = clamp((t - sg[2]) / (sg[3] - sg[2]));
        c.font = `400 13px ${MONO}`; setLS(c, 2);
        c.fillStyle = css(TINK, 0.4); c.textAlign = 'left';
        c.fillText(`${sg[0] < 0 ? '·' : TM_WORDS[sg[0]]} → ${TM_WORDS[sg[1]]}  ${String(Math.round(p * 100)).padStart(3, ' ')}%`, 64, H - 86);
        setLS(c, 0);
      }
      vignette(c, W, H, 0.45);
      grain(c, W, H, t, 0.06, 'overlay');
    },
    score(A) {
      A.bus.gain.value = 0.62; A.send.gain.value = 0.62;
      // bed: sub drone + airy pad
      A.osc(0, { f: midi(26), dur: 7.6, g: 0.07, a: 1.5, hold: true, rel: 1.2 });
      A.noise(0, { type: 'bandpass', f: 900, q: 0.7, dur: 7.4, g: 0.018, swell: 0.6, rev: 0.4 });
      // the droplet
      A.osc(0.04, { f: 520, f2: 1500, glide: 0.06, dur: 0.12, g: 0.12, rev: 0.5 });
      A.bell(0.05, midi(86), { g: 0.04, dur: 1.2, rev: 0.6 });
      const blips = (t0, t1, n, base, seed) => {
        const r = rng(seed);
        for (let j = 0; j < n; j++) {
          const s = lerp(t0, t1, j / n) + r() * 0.05, f = base * (1 + r() * 1.6);
          A.osc(s, { f, f2: f * (1.8 + r()), glide: 0.05, dur: 0.07, g: 0.03 + r() * 0.03, pan: r() * 1.6 - 0.8, rev: 0.35 });
        }
      };
      const sweep = (t0, dur, o = {}) => {
        A.noise(t0, { type: 'bandpass', f: o.f1 || 300, f2: o.f2 || 2600, q: o.q || 7, dur, g: o.g || 0.07, swell: 0.55, rev: 0.4, pan: o.pan || 0 });
        A.noise(t0 + 0.04, { type: 'bandpass', f: (o.f1 || 300) * 1.5, f2: (o.f2 || 2600) * 0.7, q: (o.q || 7) * 1.4, dur: dur * 0.9, g: (o.g || 0.07) * 0.7, swell: 0.5, rev: 0.4, pan: -(o.pan || 0) });
      };
      const land = (s, notes, g = 0.3) => {
        A.kick(s, 0.55, { f: 120, f2: 45 });
        notes.forEach((m, i) => A.pluck(s + i * 0.025, midi(m), { g: g * (1 - i * 0.12), bright: 0.55, dur: 2.2, rev: 0.45, pan: (i - 1) * 0.4 }));
        A.osc(s, { f: midi(notes[0] - 12), dur: 1.2, g: 0.08, type: 'triangle', rev: 0.3 });
      };
      // burst → IDEA
      A.whoosh(0.28, 0.5, { f1: 200, f2: 4000, g: 0.16, swell: 0.3 });
      blips(0.3, 1.1, 14, 380, 3);
      sweep(0.3, 1.0, { f1: 2400, f2: 400, g: 0.06 });
      land(1.1, [62, 66, 69, 74]);
      // IDEA → SHAPE
      sweep(1.95, 1.1, { pan: -0.4 }); blips(2.0, 2.9, 12, 300, 5);
      land(2.85, [59, 62, 66, 71]);
      // SHAPE → MOTION
      sweep(3.7, 1.1, { f1: 2000, f2: 260, pan: 0.4 }); blips(3.75, 4.7, 14, 260, 9);
      A.whoosh(3.8, 0.7, { f1: 600, f2: 3000, g: 0.09, pan: 0.5 });
      land(4.7, [55, 59, 62, 67]);
      A.clap(4.7, 0.12);
      // vortex climax
      A.riser(5.6, 1.9, { g: 0.15, f: 73 });
      for (let j = 0; j < 7; j++) A.whoosh(5.65 + j * 0.25 * (1 - j * 0.06), 0.4, { f1: 400 + j * 120, f2: 2400 + j * 500, g: 0.05 + j * 0.008, pan: j % 2 ? 0.7 : -0.7, swell: 0.5 });
      blips(5.7, 7.4, 26, 320, 13);
      for (let j = 0; j < 12; j++) A.osc(6.3 + j * 0.1, { type: 'triangle', f: midi(57 + (j % 4) * 5 + Math.floor(j / 4) * 2), dur: 0.12, g: 0.025 + j * 0.002, rev: 0.4, pan: j % 2 ? 0.4 : -0.4 });
      // FORM lands
      A.impact(7.52, 0.6);
      A.kick(7.52, 0.85);
      A.chord(7.52, [38, 50, 57, 62, 64, 66, 69], { type: 'sawtooth', dur: 2.4, g: 0.028, a: 0.01, lp: 3600, lp2: 700, lpT: 2.2, spread: 8, rev: 0.6, width: 1.4 });
      A.chord(7.54, [62, 69, 74], { type: 'sine', dur: 2.4, g: 0.04, a: 0.3, hold: true, rel: 0.8, rev: 0.6 });
      [62, 66, 69, 73, 74, 78].forEach((m, i) => A.bell(7.6 + i * 0.07, midi(m + 12), { g: 0.028, dur: 1.4, pan: -0.5 + i * 0.2 }));
      'an idea, given shape, set in motion, becomes form.'.split(' ').forEach((w, i) => A.pluck(7.95 + i * 0.09, midi([74, 76, 78, 81, 78, 76, 74, 81][i]), { g: 0.06, bright: 0.4, dur: 1, rev: 0.5, pan: -0.4 + i * 0.1 }));
    },
  });

  /* ================================================================
     03 EDITORIAL TYPOGRAPHY — a magazine feature set live on its grid:
     rules draw, a didone headline rises through its mask, a duotone
     photograph opens, justified columns set line by line, a page turns,
     and the issue closes on its cover.
     ================================================================ */
  const EP = '#f3efe7', EI = '#161412', EA = '#9b1a2a', EG = '#7b756b';
  const EPr = hexRGB(EP), EIr = hexRGB(EI), EAr = hexRGB(EA);
  const BOD = '"Bodoni Moda"', NEWS = 'Newsreader', ESANS = '"Inter Tight"';
  const PW = 960, PH = 1080;
  const ECOL = 115, EGUT = 22;
  const colL = i => 88 + i * (ECOL + EGUT), colR = i => 72 + i * (ECOL + EGUT);
  const EBODY1 = 'Time is the one material that cannot be faked. In a small workshop above the harbour, a single chair takes eleven weeks; the oil on its arms is rubbed in by hand, a thin coat each morning, until the wood stops drinking. Nobody hurries the process, because the process is the point. It is an unfashionable idea in an age of next-day delivery, which is exactly why the work feels so rare.';
  const EBODY2 = 'What emerges is not merely an object but a record of attention, every surface a quiet diary of the days it took. The makers we visited share a stubborn conviction: that quality is patience made visible, and that the slowest decisions are often the ones that last. Their studios keep no clocks on the walls. Orders are taken in seasons rather than weeks, and the waiting list is treated less as a backlog than as a promise — a reminder that something worth having is still being made, somewhere, carefully, by someone who will not be rushed.';
  const EQA = [['Q.', 'When do you know a piece is finished?'], ['A.', 'When there is nothing left to remove. We work towards quiet — the moment an object stops asking for attention and simply holds it.'], ['Q.', 'And the clients who want it sooner?'], ['A.', 'They are welcome to wait. Most of them, in the end, are grateful that they did. A table is not late; it is simply not yet a table.']];

  // word-wrap into justified lines; indent(i) narrows the first lines (drop cap)
  function eWrap(g, font, str, width, indent = () => 0) {
    g.font = font;
    const words = str.split(' '), sp = g.measureText(' ').width, lines = [];
    let cur = [], cw = 0;
    const flush = last => { if (cur.length) lines.push({ words: cur.map(w => [w, g.measureText(w).width]), w: cw, last, ind: indent(lines.length) }); cur = []; cw = 0; };
    words.forEach(w => {
      const ww = g.measureText(w).width, lim = width - indent(lines.length);
      if (cur.length && cw + sp + ww > lim) flush(false);
      cw += (cur.length ? sp : 0) + ww; cur.push(w);
    });
    flush(true);
    return lines.map(l => ({ ...l, width: width - l.ind, sp }));
  }
  function eLine(g, ln, x, y) {
    const n = ln.words.length, tot = ln.words.reduce((s, w) => s + w[1], 0);
    const gap = ln.last || n < 2 ? ln.sp : (ln.width - tot) / (n - 1);
    let xx = x + ln.ind;
    ln.words.forEach(([w, ww]) => { g.fillText(w, xx, y); xx += ww + gap; });
  }
  // lines set one by one with a left-to-right wipe
  function eSet(g, lines, x, y, lh, font, col, t, t0, dt) {
    g.font = font; g.fillStyle = col; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    lines.forEach((ln, i) => {
      const p = E.outC(seg(t, t0 + i * dt, t0 + i * dt + 0.32));
      if (p <= 0) return;
      g.save();
      g.beginPath(); g.rect(x - 4, y + i * lh - lh, (ln.width + 10) * p, lh + 8); g.clip();
      eLine(g, ln, x, y + i * lh);
      g.restore();
    });
  }
  // a line of display type rising through a mask at its baseline
  function eRise(g, str, x, y, font, col, p, align = 'left') {
    if (p <= 0) return;
    g.save();
    g.font = font; g.textAlign = align; g.textBaseline = 'alphabetic';
    const m = g.measureText(str), a = m.actualBoundingBoxAscent, d = m.actualBoundingBoxDescent;
    const x0 = align === 'right' ? x - m.width : align === 'center' ? x - m.width / 2 : x;
    g.beginPath(); g.rect(x0 - 40, y - a - 30, m.width + 80, a + d + 34); g.clip();
    g.fillStyle = col;
    g.fillText(str, x, y + (1 - p) * (a + d + 20));
    g.restore();
  }
  const eLabel = (g, s, x, y, col, align = 'left', size = 12, ls = 3.5, w = 600) => {
    g.font = `${w} ${size}px ${ESANS}`; setLS(g, ls); g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillStyle = col;
    g.fillText(s, x, y); setLS(g, 0);
  };

  /* ---- procedural duotone photographs ---- */
  function eDuo(w, h, dk, lt, lum, seed) {
    const cv = offscreen(w, h), g = cv.getContext('2d'), im = g.createImageData(w, h), r = rng(seed);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let L = lum(x / w, y / h) + (r() - 0.5) * 0.045;
      L = clamp(L);
      const i = (y * w + x) * 4;
      im.data[i] = lerp(dk[0], lt[0], L); im.data[i + 1] = lerp(dk[1], lt[1], L); im.data[i + 2] = lerp(dk[2], lt[2], L); im.data[i + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return cv;
  }
  function eSilk(w, h, dk, lt, seed, ang = 0, fq = 1) {
    const r = rng(seed), ph = [r() * 6, r() * 6, r() * 6, r() * 6], asp = w / h;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const Hf = (u, v) => {
      const x = u * ca - v * sa, y = u * sa + v * ca;
      const wx = x + 0.09 * Math.sin(y * 3.1 + ph[0]), wy = y + 0.07 * Math.sin(x * 2.3 + ph[1]);
      return 0.55 * Math.sin(wx * 6.2 + wy * 2.0 + 0.6 * Math.sin(wy * 4.4 + ph[2])) + 0.28 * Math.sin(wx * 11.5 - wy * 3.6 + ph[3]) + 0.1 * Math.sin(wx * 21 + wy * 8);
    };
    const lx = -0.45, ly = -0.62, lz = 0.64, hl = Math.hypot(lx, ly, lz + 1);
    const hx = lx / hl, hy = ly / hl, hz = (lz + 1) / hl, e = 0.002;
    return eDuo(w, h, dk, lt, (u, v) => {
      const U = u * asp * fq, h0 = Hf(U, v), gx = (Hf(U + e, v) - h0) / e, gy = (Hf(U, v + e) - h0) / e;
      let nx = -gx * 0.075, ny = -gy * 0.075, nz = 1;
      const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      const diff = Math.max(0, nx * lx + ny * ly + nz * lz), spec = Math.pow(Math.max(0, nx * hx + ny * hy + nz * hz), 38);
      const vg = 1 - 0.55 * ((u - 0.55) ** 2 + (v - 0.45) ** 2);
      return (0.04 + 0.78 * Math.pow(diff, 1.6) + 0.55 * spec) * vg;
    }, seed + 1);
  }
  function eArches(w, h, dk, lt) {
    const P = 0.44, ow = 0.29, ys = 0.47, floorY = 0.83, asp = w / h;
    return eDuo(w, h, dk, lt, (u, v) => {
      const bu = (u + 0.16) / P, xm = bu - Math.floor(bu) - 0.5;
      if (v > floorY) {
        const fu = (u + 0.16 - (v - floorY) * 1.1) / P, fx = fu - Math.floor(fu) - 0.5;
        const lit = Math.abs(fx + 0.03) < ow * 0.92;
        return (lit ? 0.86 - (v - floorY) * 1.1 : 0.2 + (v - floorY) * 0.3) + vnoise(u * 90, 3) * 0.015;
      }
      const dx = xm * P * asp, rad = ow * P * asp, dy = v - ys;
      const inOpen = Math.abs(xm) < ow && (v > ys || dx * dx + dy * dy < rad * rad);
      if (inOpen) {
        const jamb = xm < -ow + 0.075 || (v < ys && dx < 0 && Math.hypot(dx, dy) > rad * 0.83);
        if (jamb) return 0.3 - v * 0.08;
        return 0.97 - v * 0.28 - Math.abs(xm) * 0.2;
      }
      let L = 0.6 + 0.12 * v + vnoise(u * 140 + v * 30, 5) * 0.025 + vnoise(v * 160, 8) * 0.012;
      if (v < 0.2 + u * 0.42) L *= 0.55;
      if (Math.abs(xm) < ow + 0.03 && Math.abs(xm) >= ow && v > ys - 0.02) L *= 0.85;
      return L;
    }, 41);
  }
  function eSphere(w, h, dk, lt) {
    const lx = -0.55, ly = -0.6, lz = 0.58, ll = Math.hypot(lx, ly, lz);
    return eDuo(w, h, dk, lt, (u, v) => {
      const dx = (u - 0.5) / 0.3, dy = (v - 0.46) / 0.3, rr = dx * dx + dy * dy;
      if (rr < 1) {
        const nz = Math.sqrt(1 - rr), diff = Math.max(0, (dx * lx + dy * ly + nz * lz) / ll);
        return 0.05 + 0.86 * Math.pow(diff, 1.3) + vnoise(dx * 18 + dy * 7, 2) * 0.02;
      }
      const sh = Math.exp(-(((u - 0.56) / 0.32) ** 2 + ((v - 0.79) / 0.05) ** 2) * 1.2);
      return (0.74 - v * 0.2 + u * 0.06) * (1 - sh * 0.55);
    }, 43);
  }

  /* ---- pages ---- */
  function eGutter(g, side) {
    const x0 = side === 'L' ? PW - 70 : 70, gr = g.createLinearGradient(x0, 0, side === 'L' ? PW : 0, 0);
    gr.addColorStop(0, 'rgba(40,30,20,0)'); gr.addColorStop(1, 'rgba(40,30,20,0.16)');
    g.fillStyle = gr; g.fillRect(side === 'L' ? x0 : 0, 0, 70, PH);
  }
  function eGuides(g, t, cols) {
    const a = seg(t, 0, 0.15) * (1 - seg(t, 1.5, 2.1));
    if (a <= 0) return;
    g.fillStyle = `rgba(155,26,42,${0.32 * a})`;
    const left = cols[0] > 80;
    [176, 302, 590, 690, 848].forEach((y, i) => {
      const p = E.outQn(seg(t, 0.1 + i * 0.05 + (left ? 0 : 0.18), 0.6 + i * 0.05 + (left ? 0 : 0.18)));
      g.fillRect(0, y, PW * p, 1);
    });
    cols.forEach((x, i) => {
      const p = E.outQn(seg(t, 0.02 + i * 0.03, 0.55 + i * 0.03));
      g.fillRect(x, 0, 1, PH * p); g.fillRect(x + ECOL, PH * (1 - p), 1, PH * p);
    });
  }
  function eHead(g, t, side, folio) {
    const x0 = side === 'L' ? 88 : 72, x1 = x0 + 800;
    const rp = E.outQn(seg(t, 0.08, 0.6));
    g.fillStyle = EI; g.fillRect(side === 'L' ? x0 : x1 - 800 * rp, 92, 800 * rp, 1.5);
    const a = seg(t, 0.35, 0.6);
    if (a > 0) {
      g.globalAlpha = a;
      if (side === 'L') { eLabel(g, 'MERIDIAN', x0, 76, EI); eLabel(g, 'DESIGN', x1, 76, EG, 'right'); }
      else { eLabel(g, 'THE QUIET ISSUE', x0, 76, EG); eLabel(g, 'AUTUMN 2026', x1, 76, EI, 'right'); }
      eLabel(g, folio, side === 'L' ? x0 : x1, 1032, EI, side === 'L' ? 'left' : 'right', 13, 2);
      eLabel(g, 'MERIDIAN  —  Nº 07', side === 'L' ? x0 + 46 : x1 - 46, 1032, EG, side === 'L' ? 'left' : 'right', 11, 3);
      g.globalAlpha = 1;
    }
  }
  const E_IMG1 = { x: 72, y: 122, w: 800, h: 520 };
  function eHeadline(g, st, t, dx, paperClip) {
    // "Slowness" — italic didone across the gutter, letters rising one by one
    const font = `italic 400 318px ${BOD}`, base = 590, x = 74 - dx;
    g.font = font;
    const word = 'Slowness', off = st.slowOff;
    const draw = col => {
      g.fillStyle = col;
      for (let i = 0; i < word.length; i++) {
        const p = E.outQn(seg(t, 0.72 + i * 0.065, 1.45 + i * 0.065));
        if (p <= 0) continue;
        g.fillText(word[i], x + off[i], base + (1 - p) * 330);
      }
    };
    g.save();
    g.beginPath(); g.rect(0, 120, PW, base + 92 - 120); g.clip();
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    if (!paperClip) draw(EI);
    if (paperClip) { g.beginPath(); g.rect(paperClip.x, paperClip.y, paperClip.w, paperClip.h); g.clip(); draw(EP); }
    g.restore();
  }
  function ePageL1(g, st, t) {
    g.fillStyle = EP; g.fillRect(0, 0, PW, PH);
    eGuides(g, t, [0, 1, 2, 3, 4, 5].map(colL));
    eHead(g, t, 'L', '46');
    const kp = seg(t, 0.45, 0.7);
    if (kp > 0) { g.globalAlpha = kp; eLabel(g, 'ESSAY  ·  CRAFT', 88, 176, EA, 'left', 13, 4.5); g.fillStyle = EA; g.fillRect(88, 190, 36 * E.outC(kp), 2); g.globalAlpha = 1; }
    eRise(g, 'The Art of', 86, 302, `400 104px ${BOD}`, EI, E.outQn(seg(t, 0.5, 1.15)));
    eHeadline(g, st, t, 0, null);
    // dek
    eSet(g, st.dek, 88, 690, 42, `italic 400 31px ${NEWS}`, EI, t, 1.45, 0.09);
    const bp = seg(t, 1.85, 2.15);
    if (bp > 0) { g.globalAlpha = bp; eLabel(g, 'WORDS BY INES CALDER   ·   PHOTOGRAPHS BY STUDIO NORD', 88, 828, EG, 'left', 11, 3); g.globalAlpha = 1; }
    g.fillStyle = EI; g.fillRect(88, 848, 800 * E.outQn(seg(t, 1.8, 2.4)), 1);
    // drop cap + two justified columns
    const dc = E.outQn(seg(t, 2.0, 2.5));
    if (dc > 0) {
      g.save(); g.beginPath(); g.rect(80, 868, 110, 140); g.clip();
      g.font = `400 132px ${BOD}`; g.fillStyle = EA; g.textAlign = 'left';
      g.fillText('T', 86, 980 + (1 - dc) * 130); g.restore();
    }
    eSet(g, st.b1a, colL(0), 900, 26, `400 18px ${NEWS}`, EI, t, 2.1, 0.035);
    eSet(g, st.b1b, colL(3), 900, 26, `400 18px ${NEWS}`, EI, t, 2.1 + st.b1a.length * 0.035, 0.035);
    eGutter(g, 'L');
  }
  function ePageR1(g, st, t) {
    g.fillStyle = EP; g.fillRect(0, 0, PW, PH);
    eGuides(g, t, [0, 1, 2, 3, 4, 5].map(colR));
    eHead(g, t, 'R', '47');
    // image: a hairline, then the box opens and the photo settles
    const I = E_IMG1, hl = E.outQn(seg(t, 0.95, 1.3)), op = E.outQn(seg(t, 1.2, 2.0));
    const cy = I.y + I.h / 2, hh = I.h * op;
    const clip = { x: I.x, y: cy - hh / 2, w: I.w, h: hh };
    eHeadline(g, st, t, PW, null);
    if (op > 0) {
      g.save();
      g.beginPath(); g.rect(clip.x, clip.y, clip.w, clip.h); g.clip();
      const sc = lerp(1.18, 1.0, E.outC(seg(t, 1.2, 4.4)));
      g.translate(I.x + I.w / 2, cy); g.scale(sc, sc);
      g.drawImage(st.img1, -I.w / 2, -I.h / 2, I.w, I.h);
      g.restore();
      eHeadline(g, st, t, PW, clip);
    }
    if (hl > 0 && op < 1) { g.fillStyle = EI; g.fillRect(I.x + I.w * (1 - hl) / 2, cy - 0.75, I.w * hl, 1.5); }
    const cp = seg(t, 1.9, 2.2);
    if (cp > 0) {
      g.globalAlpha = cp;
      eLabel(g, 'FIG. 1', 72, 676, EA, 'left', 11, 3);
      g.font = `italic 400 16px ${NEWS}`; g.fillStyle = EG; g.textAlign = 'left';
      g.fillText('Oiled ash, eleven weeks in the making. Photographed in the studio at first light.', 132, 676);
      g.globalAlpha = 1;
    }
    g.fillStyle = EI; g.fillRect(72, 700, 800 * E.outQn(seg(t, 2.0, 2.6)), 1);
    eSet(g, st.b2, colR(0), 742, 26, `400 18px ${NEWS}`, EI, t, 2.1 + (st.b1a.length + st.b1b.length) * 0.035, 0.035);
    // pull quote
    const q = E.outB(seg(t, 2.85, 3.3), 1.6);
    if (q > 0) {
      g.save(); g.translate(colR(3) + 4, 806); g.scale(q, q);
      g.font = `400 150px ${BOD}`; g.fillStyle = EA; g.textAlign = 'left'; g.fillText('“', -6, 40);
      g.restore();
    }
    g.fillStyle = EA; g.fillRect(colR(3), 724, 389 * E.outQn(seg(t, 2.8, 3.3)), 2);
    g.font = `italic 400 41px ${BOD}`; g.textAlign = 'left'; g.fillStyle = EI;
    let wi = 0;
    st.pq.forEach((ln, li) => {
      let xx = colR(3) + 70 * (li === 0 ? 1 : 0) + (li > 0 ? 0 : 0);
      ln.words.forEach(([w, ww]) => {
        const p = E.outC(seg(t, 3.0 + wi * 0.07, 3.45 + wi * 0.07));
        if (p > 0) { g.globalAlpha = p; g.fillText(w, xx, 812 + li * 50 + (1 - p) * 14); }
        xx += ww + ln.sp; wi++;
      });
    });
    g.globalAlpha = 1;
    const ap = seg(t, 3.7, 4.0);
    if (ap > 0) { g.globalAlpha = ap; eLabel(g, '—  TOMAS ÅBERG, CABINETMAKER', colR(3), 812 + st.pq.length * 50 + 18, EG, 'left', 11, 3); g.globalAlpha = 1; }
    eGutter(g, 'R');
  }
  function ePageL2(g, st, t) {
    g.drawImage(st.img2, 0, 0, PW, PH);
    const sh = g.createLinearGradient(0, 600, 0, PH);
    sh.addColorStop(0, 'rgba(10,16,30,0)'); sh.addColorStop(1, 'rgba(10,16,30,0.55)');
    g.fillStyle = sh; g.fillRect(0, 600, PW, PH - 600);
    eLabel(g, 'MERIDIAN', 88, 76, 'rgba(243,239,231,0.85)');
    g.font = `italic 400 44px ${BOD}`; g.fillStyle = EP; g.textAlign = 'left'; g.fillText('II.', 88, 170);
    eRise(g, 'Nothing here', 84, 880, `italic 400 92px ${BOD}`, EP, E.outQn(seg(t, 5.25, 5.9)));
    eRise(g, 'is in a hurry.', 84, 975, `italic 400 92px ${BOD}`, EP, E.outQn(seg(t, 5.38, 6.05)));
    g.save(); g.translate(PW - 40, 1030); g.rotate(-Math.PI / 2);
    eLabel(g, 'PHOTOGRAPH  ·  STUDIO NORD', 0, 0, 'rgba(243,239,231,0.7)', 'left', 10, 3);
    g.restore();
    eGutter(g, 'L');
  }
  function ePageR2(g, st, t) {
    g.fillStyle = EP; g.fillRect(0, 0, PW, PH);
    const T = t - 4.6;
    eHead(g, Math.max(0, T + 0.4), 'R', '49');
    const kp = seg(t, 4.95, 5.2);
    if (kp > 0) { g.globalAlpha = kp; eLabel(g, 'IN CONVERSATION', 72, 176, EA, 'left', 13, 4.5); g.fillStyle = EA; g.fillRect(72, 190, 36 * kp, 2); g.globalAlpha = 1; }
    eRise(g, 'Made by hand.', 68, 300, `400 92px ${BOD}`, EI, E.outQn(seg(t, 5.0, 5.6)));
    eRise(g, 'Finished by time.', 68, 402, `italic 400 92px ${BOD}`, EI, E.outQn(seg(t, 5.12, 5.75)));
    g.fillStyle = EI; g.fillRect(72, 452, 800 * E.outQn(seg(t, 5.3, 5.9)), 1);
    // Q&A, column one
    let y = 500, li = 0;
    st.qa.forEach(({ lab, lines, q }) => {
      const p0 = 5.55 + li * 0.04;
      const a = seg(t, p0, p0 + 0.2);
      if (a > 0) { g.globalAlpha = a; g.font = `600 18px ${NEWS}`; g.fillStyle = EA; g.textAlign = 'left'; g.fillText(lab, 72, y); g.globalAlpha = 1; }
      eSet(g, lines, 72, y, 26, `${q ? 600 : 400} 18px ${NEWS}`, EI, t, p0, 0.04);
      li += lines.length; y += lines.length * 26 + 14;
    });
    // inset photograph in a circular mask
    const cp = E.outQn(seg(t, 5.7, 6.5)), cx = colR(3) + 194, cy = 640;
    g.strokeStyle = EI; g.lineWidth = 1;
    const ring = E.outQn(seg(t, 5.55, 6.1));
    if (ring > 0) { g.beginPath(); g.arc(cx, cy, 166, -Math.PI / 2, -Math.PI / 2 + TAU * ring); g.stroke(); }
    if (cp > 0) {
      g.save(); g.beginPath(); g.arc(cx, cy, 156 * cp, 0, TAU); g.clip();
      const sc = lerp(1.25, 1, E.outC(seg(t, 5.7, 7.6)));
      g.translate(cx, cy); g.scale(sc, sc); g.drawImage(st.img3, -160, -160, 320, 320);
      g.restore();
    }
    const ca = seg(t, 6.2, 6.5);
    if (ca > 0) {
      g.globalAlpha = ca;
      eLabel(g, 'FIG. 2', colR(3), 850, EA, 'left', 11, 3);
      g.font = `italic 400 16px ${NEWS}`; g.fillStyle = EG; g.textAlign = 'left';
      g.fillText('A turned walnut bowl, left to dry for a year.', colR(3) + 58, 850);
      g.globalAlpha = 1;
    }
    eSet(g, st.qa2, colR(3), 900, 26, `400 18px ${NEWS}`, EI, t, 6.3, 0.05);
    eGutter(g, 'R');
  }
  function ePageC(g, st) {
    g.drawImage(st.imgC, 0, 0, PW, PH);
    const sh = g.createLinearGradient(0, 0, 0, 380);
    sh.addColorStop(0, 'rgba(20,6,8,0.35)'); sh.addColorStop(1, 'rgba(20,6,8,0)');
    g.fillStyle = sh; g.fillRect(0, 0, PW, 380);
    eLabel(g, 'Nº 07   —   AUTUMN 2026   —   THE QUIET ISSUE', PW / 2, 72, EP, 'center', 13, 4.5);
    g.font = `700 ${st.mastSize}px ${BOD}`; setLS(g, -4); g.textAlign = 'center'; g.fillStyle = EP; g.fillText('MERIDIAN', PW / 2, 276); setLS(g, 0);
    g.fillStyle = EP; g.fillRect(56, 312, PW - 112, 2);
    g.font = `400 58px ${BOD}`; g.textAlign = 'left'; g.fillText('The Art of', 60, 742);
    g.font = `italic 400 150px ${BOD}`; g.fillText('Slowness', 52, 872);
    eLabel(g, 'MAKERS WHO REFUSE TO HURRY', 62, 922, EP, 'left', 14, 4);
    g.font = `italic 400 40px ${BOD}`; g.textAlign = 'right';
    g.fillText('Architecture', PW - 60, 470); g.fillText('of Silence', PW - 60, 516);
    eLabel(g, 'P. 48', PW - 60, 552, EP, 'right', 12, 3);
    // barcode
    g.fillStyle = EP; g.fillRect(PW - 196, 952, 140, 92);
    g.fillStyle = EI;
    for (let i = 0, x = PW - 186; x < PW - 68; i++) { const w = 1 + Math.floor(hash(i * 3.1) * 3); if (hash(i * 7.7) > 0.4) g.fillRect(x, 960, w, 60); x += w + 1; }
    g.font = `500 11px ${ESANS}`; g.textAlign = 'left'; g.fillText('£12   9 771234 567003', PW - 186, 1036);
  }

  // turns a page about the spine: strips with perspective, shading by angle
  function eFlip(c, front, back, spX, cy, s, th, side) {
    const n = 48, f = 2400, cs = Math.cos(th), sn = Math.sin(th), showF = cs >= 0, src = showF ? front : back;
    // cast shadow beyond the free edge
    const eX = spX + side * PW * cs * (f / (f - PW * sn)) * s;
    const dir = Math.sign(eX - spX) || side, bw = 220 * s * sn;
    if (bw > 1) {
      const gr = c.createLinearGradient(eX, 0, eX + dir * bw, 0);
      gr.addColorStop(0, `rgba(0,0,0,${0.3 * sn})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gr; c.fillRect(Math.min(eX, eX + dir * bw), cy - PH * s / 2, bw, PH * s);
    }
    for (let k = 0; k < n; k++) {
      const d0 = (k / n) * PW, d1 = ((k + 1) / n) * PW;
      const p0 = f / (f - d0 * sn), p1 = f / (f - d1 * sn);
      const x0 = spX + side * d0 * cs * p0 * s, x1 = spX + side * d1 * cs * p1 * s;
      const h = PH * s * (p0 + p1) / 2;
      let s0, s1;
      if (side > 0) { s0 = showF ? d0 : PW - d0; s1 = showF ? d1 : PW - d1; }
      else { s0 = showF ? PW - d0 : d0; s1 = showF ? PW - d1 : d1; }
      const dx = Math.min(x0, x1), dw = Math.abs(x1 - x0) + 0.7, sx = Math.min(s0, s1), sw = Math.abs(s1 - s0);
      if (dw < 0.3) continue;
      c.drawImage(src, sx, 0, sw, PH, dx, cy - h / 2, dw, h);
      const shade = showF ? 0.34 * (1 - cs) * (0.55 + 0.45 * k / n) : 0.3 * (1 + cs) * (0.4 + 0.6 * (1 - k / n)) + 0.05;
      c.fillStyle = `rgba(20,14,10,${shade})`;
      c.fillRect(dx, cy - h / 2, dw, h);
    }
  }

  MG.film({
    id: 'editorial', dur: 10, poster: 9.6,
    fonts: [['italic 400 300px "Bodoni Moda"', 'SlownesNthigrup.II'], ['400 100px "Bodoni Moda"', 'The Art ofMadebyhnT“'], ['700 200px "Bodoni Moda"', 'MERIDIAN'], ['400 18px Newsreader', 'Aa1'], ['italic 400 30px Newsreader', 'Aa1'], ['600 18px Newsreader', 'QA.'], ['600 12px "Inter Tight"', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ·—Nº0123456789'], ['500 11px "Inter Tight"', '£0123456789']],
    meta: {
      family: 'B', name: 'Editorial Typography', sub: 'The Magazine Page in Motion', era: '1934 —',
      origin: 'Alexey Brodovitch\'s Harper\'s Bazaar spreads made the magazine page a choreographed space of didone headlines, white space and photography; Pentagram, Wallpaper* and The New York Times Magazine later carried that grid-bound restraint into covers and features that move.',
      works: 'Harper\'s Bazaar (Alexey Brodovitch, 1934 — 1958) · Vogue covers and mastheads (Didot lineage) · Wallpaper* (1996 —) · The New York Times Magazine animated covers (2010s —) · Pentagram editorial systems',
      tech: ['Six-column grid with hairline rules', 'Masked line-by-line justified setting', 'Procedural duotone photographs', 'Perspective page turn'],
      accent: '#9b1a2a',
      motionDNA: 'Nothing bounces: rules draw, lines rise through masks and columns set one line at a time on long, decelerating eases, punctuated by a single page turn.',
      visualDNA: 'High-contrast didone display type, justified serif body, drop cap and pull quote in oxblood on warm paper, duotone photography held in a precise grid.',
      transitions: 'Grid reveal, masked headline rise, image-box open, page turn, pull-back to the closed issue.',
      implementation: ['After Effects', 'InDesign', 'Canvas 2D'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H, st) {
      setLS(c, 0);
      if (!st.pg) {
        st.pg = { L1: offscreen(PW, PH), R1: offscreen(PW, PH), L2: offscreen(PW, PH), R2: offscreen(PW, PH), C: offscreen(PW, PH) };
        const g = st.pg.L1.getContext('2d');
        st.img1 = eSilk(800, 520, [38, 12, 18], [242, 206, 190], 5, 0.3);
        st.img2 = eArches(480, 540, [16, 28, 52], [236, 204, 150]);
        st.img3 = eSphere(320, 320, [26, 24, 22], [226, 220, 208]);
        st.imgC = eSilk(640, 720, [60, 8, 16], [246, 196, 176], 11, -0.5, 1.9);
        g.font = `italic 400 318px ${BOD}`;
        st.slowOff = []; for (let i = 0; i <= 8; i++) st.slowOff.push(g.measureText('Slowness'.slice(0, i)).width);
        st.dek = eWrap(g, `italic 400 31px ${NEWS}`, 'In an age of acceleration, a small circle of makers is choosing to take its time — and the results are extraordinary.', 663);
        const b1 = eWrap(g, `400 18px ${NEWS}`, EBODY1, 389, i => (i < 4 ? 88 : 0));
        st.b1a = b1.slice(0, 4); st.b1b = b1.slice(4, 8);
        st.b2 = eWrap(g, `400 18px ${NEWS}`, EBODY2, 389).slice(0, 10);
        st.pq = eWrap(g, `italic 400 41px ${BOD}`, 'Luxury is simply the time something takes.', 389, i => (i === 0 ? 70 : 0));
        g.font = `600 18px ${NEWS}`;
        const qi = g.measureText('Q. ').width;
        st.qa = EQA.slice(0, 3).map(([lab, s], k) => ({ lab, q: k % 2 === 0, lines: eWrap(g, `${k % 2 === 0 ? 600 : 400} 18px ${NEWS}`, s, 389, i => (i === 0 ? qi : 0)) }));
        st.qa2 = eWrap(g, `400 18px ${NEWS}`, EQA[3][1], 389).slice(0, 3);
        g.font = `700 100px ${BOD}`; setLS(g, -4);
        st.mastSize = 100 * 848 / g.measureText('MERIDIAN').width; setLS(g, 0);
        ePageC(st.pg.C.getContext('2d'), st);
      }
      const P = st.pg, ctx = k => P[k].getContext('2d');
      // backdrop for the pull-back
      c.fillStyle = '#1b1917'; c.fillRect(0, 0, W, H);
      const bgl = c.createRadialGradient(960, 480, 100, 960, 540, 1100);
      bgl.addColorStop(0, 'rgba(255,240,220,0.07)'); bgl.addColorStop(1, 'rgba(0,0,0,0.3)');
      c.fillStyle = bgl; c.fillRect(0, 0, W, H);

      const s = lerp(1, 0.68, E.ioC(seg(t, 7.3, 8.15)));
      const closeP = E.ioC(seg(t, 8.05, 8.85));
      const spX = 960 - (PW * s / 2) * closeP, cy = 540;
      const pageAt = (img, x) => c.drawImage(img, x, cy - PH * s / 2, PW * s, PH * s);
      const shadow = (x, w) => {
        c.save(); c.shadowColor = 'rgba(0,0,0,0.55)'; c.shadowBlur = 70 * (1 - s) * 2.5; c.shadowOffsetY = 26 * (1 - s) * 2.5;
        c.fillStyle = '#000'; c.fillRect(x, cy - PH * s / 2, w, PH * s); c.restore();
      };
      if (t < 4.35) {
        ePageL1(ctx('L1'), st, t); ePageR1(ctx('R1'), st, t);
        pageAt(P.L1, 0); pageAt(P.R1, 960);
      } else if (t < 5.3) {
        ePageL1(ctx('L1'), st, t); ePageR1(ctx('R1'), st, t); ePageL2(ctx('L2'), st, t); ePageR2(ctx('R2'), st, t);
        pageAt(P.L1, 0); pageAt(P.R2, 960);
        eFlip(c, P.R1, P.L2, 960, cy, 1, Math.PI * E.ioC(seg(t, 4.35, 5.3)), 1);
      } else if (t < 8.05) {
        ePageL2(ctx('L2'), st, t); ePageR2(ctx('R2'), st, t);
        if (s < 0.999) shadow(960 - PW * s, PW * s * 2);
        pageAt(P.L2, 960 - PW * s); pageAt(P.R2, 960);
        if (s < 0.999) { // spine shading on the open spread
          const gs = c.createLinearGradient(960 - 40 * s, 0, 960 + 40 * s, 0);
          gs.addColorStop(0, 'rgba(0,0,0,0)'); gs.addColorStop(0.5, 'rgba(0,0,0,0.12)'); gs.addColorStop(1, 'rgba(0,0,0,0)');
          c.fillStyle = gs; c.fillRect(960 - 40 * s, cy - PH * s / 2, 80 * s, PH * s);
        }
      } else {
        ePageL2(ctx('L2'), st, 7.9); ePageR2(ctx('R2'), st, 7.9);
        const th = Math.PI * closeP;
        // page block edge of the closed issue
        shadow(spX, PW * s);
        if (closeP > 0.5) {
          c.fillStyle = '#e6e0d4';
          for (let k = 0; k < 4; k++) c.fillRect(spX + PW * s + k * 1.6, cy - PH * s / 2 + 2 + k, 1.2, PH * s - 4 - 2 * k);
        }
        pageAt(P.R2, spX);
        if (closeP < 1) eFlip(c, P.L2, P.C, spX, cy, s, th, -1);
        else pageAt(P.C, spX);
        // a slow sheen across the finished cover
        const sp = seg(t, 8.95, 9.75);
        if (closeP >= 1 && sp > 0 && sp < 1) {
          const x0 = spX + lerp(-300, PW * s + 300, E.ioS(sp));
          const gr = c.createLinearGradient(x0 - 160, 0, x0 + 160, 0);
          gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,250,240,0.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
          c.save(); c.beginPath(); c.rect(spX, cy - PH * s / 2, PW * s, PH * s); c.clip();
          c.fillStyle = gr; c.fillRect(spX, cy - PH * s / 2, PW * s, PH * s); c.restore();
        }
        // side annotations on the desk
        const an = E.outC(seg(t, 8.9, 9.4));
        if (an > 0) {
          c.globalAlpha = an;
          const L = spX - 70, R = spX + PW * s + 70;
          c.fillStyle = 'rgba(243,239,231,0.45)';
          c.fillRect(L - 260 * an, 540, 260 * an, 1); c.fillRect(R, 540, 260 * an, 1);
          eLabel(c, 'MERIDIAN', L, 520, 'rgba(243,239,231,0.85)', 'right', 13, 5);
          eLabel(c, 'ISSUE Nº 07', L, 572, 'rgba(243,239,231,0.5)', 'right', 11, 4);
          eLabel(c, 'AUTUMN 2026', R, 520, 'rgba(243,239,231,0.85)', 'left', 13, 5);
          eLabel(c, 'THE QUIET ISSUE', R, 572, 'rgba(243,239,231,0.5)', 'left', 11, 4);
          c.globalAlpha = 1;
        }
      }
      grain(c, W, H, t, 0.05, 'multiply');
      grain(c, W, H, t + 0.5, 0.035, 'screen');
    },
    score(A) {
      A.bus.gain.value = 0.85; A.send.gain.value = 0.8;
      const tick = (s, g = 0.05, pan = 0) => A.noise(s, { type: 'highpass', f: 6500, dur: 0.008, g, pan });
      const piano = (s, m, g = 0.16, pan = 0) => {
        A.pluck(s, midi(m), { g, bright: 0.32, decay: 0.998, dur: 2.6, rev: 0.45, pan, lp: 3200 });
        A.osc(s, { f: midi(m), dur: 1.8, g: g * 0.22, a: 0.004, rev: 0.4, pan });
      };
      const paper = (s, dur, g = 0.1) => {
        A.whoosh(s, dur, { f1: 900, f2: 3200, q: 0.8, g, swell: 0.55, rev: 0.15 });
        for (let k = 0; k < 7; k++) A.noise(s + dur * (0.15 + k * 0.1), { type: 'bandpass', f: 2600 + k * 300, q: 1.2, dur: 0.025, g: g * 0.5, pan: -0.3 + k * 0.1 });
      };
      // grid rules: a row of precise ticks across the stereo field
      for (let k = 0; k < 12; k++) tick(0.02 + k * 0.03, 0.05, -0.8 + k * 0.145);
      A.osc(0.08, { f: midi(89), dur: 0.6, g: 0.025, rev: 0.6 });
      // strings pad, F major 9 → D minor 9
      A.chord(0.1, [41, 53, 57, 60, 64, 67], { type: 'sawtooth', dur: 4.4, g: 0.012, a: 1.2, hold: true, rel: 0.8, lp: 900, spread: 7, rev: 0.6, width: 1.2 });
      // headline: soft low thump, then the piano answers each rising letter group
      A.osc(0.72, { f: 70, f2: 44, glide: 0.4, dur: 0.9, g: 0.22 });
      [[0.72, 65], [1.0, 69], [1.28, 72], [1.56, 76]].forEach(([s, m], i) => piano(s, m, 0.14, -0.3 + i * 0.2));
      // image opens
      A.noise(1.2, { type: 'bandpass', f: 500, f2: 2400, q: 0.7, dur: 0.8, g: 0.05, swell: 0.6, rev: 0.4 });
      A.bell(1.25, midi(84), { g: 0.035, dur: 1.8, rev: 0.6 });
      // columns setting: a quiet pen-tick per line
      for (let k = 0; k < 22; k++) tick(2.1 + k * 0.035, 0.016, (k % 2 ? 0.3 : -0.3));
      [[2.1, 60], [2.475, 64], [2.85, 67], [3.225, 69]].forEach(([s, m]) => piano(s, m, 0.1, 0.2));
      // pull quote
      piano(2.95, 81, 0.12, 0.3); piano(3.33, 79, 0.1, 0.35); piano(3.7, 77, 0.09, 0.4);
      // page turn
      paper(4.3, 1.0, 0.11);
      A.noise(5.22, { type: 'lowpass', f: 900, dur: 0.18, g: 0.12 });
      A.osc(5.22, { f: 90, f2: 50, glide: 0.2, dur: 0.35, g: 0.15 });
      A.chord(4.9, [38, 50, 57, 60, 64, 69], { type: 'sawtooth', dur: 3.0, g: 0.012, a: 0.8, hold: true, rel: 0.8, lp: 1000, spread: 7, rev: 0.6, width: 1.2 });
      [[5.25, 62], [5.6, 69], [5.95, 72], [6.3, 74], [6.65, 72], [7.0, 69]].forEach(([s, m], i) => piano(s, m, 0.11, -0.3 + (i % 3) * 0.3));
      for (let k = 0; k < 14; k++) tick(5.55 + k * 0.045, 0.014, (k % 2 ? 0.25 : -0.25));
      // pull back, close the issue
      A.noise(7.3, { type: 'bandpass', f: 300, f2: 1400, q: 0.6, dur: 0.85, g: 0.05, swell: 0.7, rev: 0.5 });
      A.chord(7.35, [46, 58, 62, 65, 69], { type: 'sawtooth', dur: 1.5, g: 0.012, a: 0.6, hold: true, rel: 0.5, lp: 1100, spread: 7, rev: 0.6, width: 1.2 });
      paper(8.05, 0.85, 0.12);
      A.noise(8.84, { type: 'lowpass', f: 700, dur: 0.22, g: 0.16 });
      A.osc(8.84, { f: 80, f2: 42, glide: 0.25, dur: 0.5, g: 0.2 });
      // resolve: F major 9 with a bell as the cover settles
      A.chord(8.86, [41, 53, 60, 64, 67, 69], { type: 'sine', dur: 1.15, g: 0.03, a: 0.08, hold: true, rel: 0.5, rev: 0.6, width: 1 });
      [[8.88, 65], [9.0, 72], [9.12, 76], [9.24, 79]].forEach(([s, m], i) => piano(s, m, 0.1, -0.3 + i * 0.2));
      A.bell(9.0, midi(88), { g: 0.03, dur: 1.0, rev: 0.6 });
    },
  });
})();
