/* batch k16 — Technique Atlas · Transitions, Timing: techpush · techglitch · techeasing.
   techpush (push transitions: the incoming shot shoves the outgoing one off frame, both moving
   together edge to edge, in four directions on four eases; then a slide, where only the new shot
   moves, and a split push of two bands going opposite ways) ·
   techglitch (a glitch transition stack between Token states: RGB channel split, block
   displacement of horizontal slices, scanline tearing and a quantised datamosh hold, each seeded
   and keyed to sixteenth notes, then all four at once) ·
   techeasing (slow in and slow out: one move on linear, ease-in, ease-out and ease-in-out lanes
   with per-frame spacing dots and the live bezier handles, quad then cubic, then the animator's
   spacing chart). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, hash, midi, text, rrect } = MG;
  const TK = MG.TK, P = TK.P, PI = Math.PI, BEAT = TK.BEAT;

  /* ---------------- shared helpers ---------------- */
  const label = (c, s, x, y, o = {}) => {
    if (o.alpha !== undefined) { if (o.alpha <= 0.005) return; c.save(); c.globalAlpha *= o.alpha; }
    text(c, s, x, y, { font: TK.MONO, size: o.size || 18, ls: o.ls ?? 3, color: o.color || P.mute, align: o.align || 'left', weight: o.weight || 400, base: o.base });
    if (o.alpha !== undefined) c.restore();
  };
  const tag = (c, s, x, y, on = 1) => {   // small accent dot + mono label, top-left of frame
    c.save(); c.globalAlpha *= on;
    c.fillStyle = P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: P.ink, weight: 700, size: 20 });
    c.restore();
  };
  // mono text on a solid chip, centred at x,y — readable over any picture
  const pill = (c, s, x, y, bg, fg, size = 15) => {
    const w = s.length * (size * 0.6 + 2) + 22, h = size + 14;
    c.fillStyle = bg; rrect(c, x - w / 2, y - h / 2, w, h, 4); c.fill();
    label(c, s, x, y + 1, { align: 'center', base: 'middle', size, ls: 2, color: fg, weight: 700 });
  };
  const fmtS = v => (v > 0.5 ? '+' : v < -0.5 ? '−' : '') + Math.abs(Math.round(v));

  /* =====================================================================
     PUSH — the incoming shot is butted against the outgoing one and both
     travel together, so their shared edge is the only seam and the two
     offsets always add up to one frame. Seven shots of the Token, each
     its own colourway, pass through a 16:9 viewer: pushes left, up, right
     and down on four different eases (in-out cubic, out quart, linear,
     in-out expo), then a slide — the outgoing shot is held and the new one
     slides over it with a shadow on its leading edge — then a split push,
     the top band pushing left while the bottom band pushes right. Outside
     the viewer the off-frame part of each shot stays visible as a ghost,
     with dashed frame lines and a chip giving its offset.
     ===================================================================== */
  const PV = { x: 560, y: 250, w: 800, h: 450 };
  const PSH = [
    { bg: P.ground, grid: 'rgba(23,24,28,0.08)', tok: P.accent, rot: 0, fg: P.ink },
    { bg: P.ink, grid: 'rgba(236,232,223,0.08)', tok: P.accent, rot: PI / 2, fg: P.ground },
    { bg: P.blue, grid: 'rgba(236,232,223,0.12)', tok: P.ground, rot: PI, fg: P.ground, word: true },
    { bg: P.accent, grid: 'rgba(23,24,28,0.1)', tok: P.ink, rot: PI * 1.5, fg: P.ink },
    { bg: P.ground2, grid: 'rgba(23,24,28,0.09)', tok: P.blue, rot: TAU, fg: P.ink },
    { bg: P.ink, grid: 'rgba(236,232,223,0.08)', tok: P.ground, rot: PI * 2.5, fg: P.ground, word: true },
    { bg: P.ground, grid: 'rgba(23,24,28,0.08)', tok: P.accent, rot: PI * 3, fg: P.ink, word: true },
  ];
  // [start, end, kind, direction of travel, ease, ease name, arrow]
  const PT = [
    [1.0, 1.75, 'push', 'L', E.ioC, 'IN-OUT CUBIC', '←'],
    [2.25, 3.0, 'push', 'U', E.outQt, 'OUT QUART', '↑'],
    [3.5, 4.25, 'push', 'R', E.lin, 'LINEAR', '→'],
    [4.75, 5.5, 'push', 'D', E.ioX, 'IN-OUT EXPO', '↓'],
    [6.0, 7.0, 'slide', 'L', E.outC, 'OUT CUBIC', '←'],
    [7.5, 8.5, 'split', 'LR', E.ioC, 'IN-OUT CUBIC', '⇄'],
  ];
  const PDIR = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] };
  const PNAME = { push: 'PUSH', slide: 'SLIDE', split: 'SPLIT PUSH' };
  const PDN = { L: 'LEFT', R: 'RIGHT', U: 'UP', D: 'DOWN', LR: 'LEFT + RIGHT' };
  // one shot, drawn at viewer offset ox, oy; band clips to 'top' / 'bot' halves
  function pShot(c, k, ox, oy, band) {
    const s = PSH[k], { x, y, w, h } = PV;
    c.save(); c.translate(x + ox, y + oy);
    if (band) { c.beginPath(); c.rect(0, band === 'top' ? 0 : h / 2, w, h / 2); c.clip(); }
    c.fillStyle = s.bg; c.fillRect(0, 0, w, h);
    c.strokeStyle = s.grid; c.lineWidth = 1; c.beginPath();
    for (let gx = 40; gx < w; gx += 40) { c.moveTo(gx, 0); c.lineTo(gx, h); }
    for (let gy = 25; gy < h; gy += 40) { c.moveTo(0, gy); c.lineTo(w, gy); }
    c.stroke();
    const ty = s.word ? h / 2 - 45 : h / 2;
    TK.token(c, w / 2, ty, s.word ? 150 : 190, { rot: s.rot, color: s.tok });
    if (s.word) TK.word(c, w / 2, h / 2 + 118, { size: 64, color: s.fg, ls: 4 });
    label(c, `SHOT ${'ABCDEFG'[k]}`, 22, 36, { size: 15, ls: 2, color: s.fg, weight: 700 });
    label(c, `0${k + 1}`, w - 22, h - 20, { size: 13, ls: 2, color: s.fg, align: 'right' });
    c.restore();
  }
  function pFrameLine(c, ox, oy, band) {
    const { x, y, w, h } = PV, y0 = band === 'bot' ? h / 2 : 0, hh = band ? h / 2 : h;
    c.save(); c.setLineDash([8, 7]); c.strokeStyle = 'rgba(23,24,28,0.55)'; c.lineWidth = 2;
    c.strokeRect(x + ox + 0.5, y + oy + y0 + 0.5, w, hh); c.restore();
  }
  // offsets of the frames in play: [{k, ox, oy, band, role}]
  function pFrames(t) {
    let k = -1;
    for (let i = 0; i < PT.length; i++) if (t >= PT[i][0]) k = i;
    if (k < 0) return { k, raw: 0, fr: [{ k: 0, ox: 0, oy: 0, role: 'HOLD' }] };
    const [t0, t1, kind, dir, ease] = PT[k], raw = seg(t, t0, t1), u = ease(raw);
    if (raw >= 1) return { k, raw, fr: [{ k: k + 1, ox: 0, oy: 0, role: 'HOLD' }] };
    const { w, h } = PV;
    if (kind === 'push') {
      const [dx, dy] = PDIR[dir], ox = dx * u * w, oy = dy * u * h;
      return { k, raw, u, fr: [{ k, ox, oy, role: 'OUT' }, { k: k + 1, ox: ox - dx * w, oy: oy - dy * h, role: 'IN' }] };
    }
    if (kind === 'slide') return { k, raw, u, fr: [{ k, ox: 0, oy: 0, role: 'OUT' }, { k: k + 1, ox: (1 - u) * w, oy: 0, role: 'IN', over: true }] };
    return { k, raw, u, fr: [
      { k, ox: -u * w, oy: 0, band: 'top', role: 'OUT' }, { k: k + 1, ox: w - u * w, oy: 0, band: 'top', role: 'IN' },
      { k, ox: u * w, oy: 0, band: 'bot', role: 'OUT' }, { k: k + 1, ox: -w + u * w, oy: 0, band: 'bot', role: 'IN' },
    ] };
  }

  MG.film({
    id: 'techpush', dur: 10, poster: 1.4,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Push', sub: 'The new shot shoves the old one out of frame', era: '1930s —',
      origin: 'A push (or push-off) moves both pictures at once: the incoming shot enters butted against the outgoing one and drives it out of frame, so one edge separates them for the whole move. Optical printers could produce pushes alongside wipes and flips, and they became a stock pattern of television switchers and digital video effects units in the 1970s and 80s; today Push and Slide sit side by side in every editor’s transition bin, and the same motion is the standard screen-to-screen navigation of mobile interfaces.',
      works: 'Final Cut Pro Push and Slide transitions (Apple) · Adobe Premiere Pro Push and Split transitions · iOS navigation push between screens (Apple, 2007 —)',
      tech: ['Both shots move, edge to edge', 'Offsets always sum to one frame', 'Slide and split-push variants'],
      accent: '#ff5a1f',
      motionDNA: 'Two pictures locked together at one edge travel as a single strip, so nothing in either shot moves except the strip. Four pushes on four eases — a smooth in-out cubic to the left, a fast-start out-quart upward, a mechanical linear push to the right and a snapping in-out expo downward — then a slide where the old shot holds still under the new one, and a split push whose two bands run in opposite directions.',
      visualDNA: 'The Technique Atlas stage with a 16:9 viewer framed in ink; seven shots of the Token in orange, ink, blue, accent and paper colourways; the off-frame part of each shot kept as a faded ghost outside the viewer with dashed frame lines; an orange bar on the shared edge; ink and orange offset chips per shot and a sum readout under the viewer; a row of transition chips along the top.',
      transitions: 'Push left, up, right and down; slide (cover); split push in two opposed bands',
      implementation: ['Optical printer / video switcher push patterns', 'Premiere Pro Push · Final Cut Slide · After Effects position keys on two layers', 'Canvas 2D: both shots translated by u·W and u·W − W, clipped to the viewer'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      const st = pFrames(t), { x, y, w, h } = PV, tr = st.k >= 0 ? PT[st.k] : null;
      const moving = st.fr.length > 1;
      // ghosts: everything outside the viewer, faded
      if (moving) {
        c.save(); c.beginPath(); c.rect(0, 168, W, 702); c.clip();
        c.globalAlpha = 0.26; st.fr.forEach(f => pShot(c, f.k, f.ox, f.oy, f.band)); c.globalAlpha = 1;
        st.fr.forEach(f => pFrameLine(c, f.ox, f.oy, f.band));
        c.restore();
      }
      // the viewer
      c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
      st.fr.forEach(f => {
        if (f.over) { // slide: soft shadow on the leading edge of the covering shot
          const g = c.createLinearGradient(x + f.ox - 40, 0, x + f.ox, 0);
          g.addColorStop(0, 'rgba(23,24,28,0)'); g.addColorStop(1, 'rgba(23,24,28,0.35)');
          c.fillStyle = g; c.fillRect(x + f.ox - 40, y, 40, h);
        }
        pShot(c, f.k, f.ox, f.oy, f.band);
      });
      c.restore();
      c.strokeStyle = P.ink; c.lineWidth = 3; c.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
      pill(c, 'VIEWER  ·  16:9', x + 86, y - 20, P.ground, P.ink, 13);
      // shared edge / leading edge
      if (moving && tr) {
        const kind = tr[2], dir = tr[3];
        c.fillStyle = P.accent;
        if (kind === 'split') {
          st.fr.filter(f => f.role === 'IN').forEach(f => {
            const ex = f.band === 'top' ? x + f.ox : x + f.ox + w, y0 = f.band === 'top' ? y : y + h / 2;
            c.fillRect(ex - 3, y0 - (f.band === 'top' ? 26 : 0), 6, h / 2 + 26);
          });
          c.fillStyle = P.ink; c.fillRect(x - 24, y + h / 2 - 1.5, w + 48, 3);
          pill(c, 'SPLIT LINE', x - 100, y + h / 2, P.ink, P.ground, 13);
          label(c, 'TWO SHARED EDGES', x + w / 2, y - 40, { size: 14, ls: 2, color: P.accentD, weight: 700, align: 'center' });
        } else {
          const inF = st.fr[1], [dx, dy] = PDIR[dir];
          if (dy === 0) {
            const ex = x + inF.ox + (dx < 0 ? 0 : w);
            if (ex > x - 2 && ex < x + w + 2) {
              c.fillRect(ex - 3, y - 26, 6, h + 52);
              label(c, kind === 'slide' ? 'LEADING EDGE' : 'SHARED EDGE', ex, y - 36, { size: 14, ls: 2, color: P.accentD, weight: 700, align: 'center' });
            }
          } else {
            const ey = y + inF.oy + (dy < 0 ? 0 : h);
            if (ey > y - 2 && ey < y + h + 2) {
              c.fillRect(x - 26, ey - 3, w + 52, 6);
              label(c, 'SHARED EDGE', x - 36, ey + 6, { size: 14, ls: 2, color: P.accentD, weight: 700, align: 'right' });
            }
          }
        }
        // offset chips, one per frame, on its top edge clamped into view
        st.fr.forEach(f => {
          const fy0 = y + f.oy + (f.band === 'bot' ? h / 2 : 0);
          const cx = clamp(x + f.ox + w / 2, 150, W - 150), cy = clamp(fy0 + 34, 190, 850);
          const vert = dir === 'U' || dir === 'D';
          const v = vert ? f.oy : f.ox, s = `${f.role}  ${vert ? 'Δy' : 'Δx'} ${fmtS(v)}${f.role === 'OUT' && kind === 'slide' ? '  HELD' : ''}`;
          if (kind === 'slide' && f.role === 'OUT') pill(c, s, x + 100, y + h + 46, P.ink, P.ground, 14);
          else pill(c, s, cx, f.band === 'bot' ? fy0 + h / 2 - 34 : cy, f.role === 'IN' ? P.accentD : P.ink, P.ground, 14);
        });
        // the sum readout
        const sum = kind === 'slide' ? `OUT HELD  ·  IN Δx ${fmtS(st.fr[1].ox)}  ·  ONLY THE NEW SHOT MOVES`
          : kind === 'split' ? `TOP ← ·  BOTTOM →  ·  |OUT| + |IN| = ${w} PX IN EACH BAND`
            : `|OUT| + |IN| = ${Math.round(Math.abs(st.fr[0].ox + st.fr[0].oy))} + ${Math.round(Math.abs(st.fr[1].ox + st.fr[1].oy))} = ${dir === 'U' || dir === 'D' ? h : w} PX  ·  ONE FRAME`;
        pill(c, sum, 960, 790, P.ground, P.ink, 15);
      }
      // transition chips along the top
      let nx = 0; for (let i = 0; i < PT.length; i++) if (t >= PT[i][0] - 0.4) nx = i;
      const done = t > PT[5][1] + 0.25;
      PT.forEach((p, i) => {
        const cx = 960 + (i - 2.5) * 284, on = !done && i === nx;
        c.fillStyle = on ? P.ink : 'rgba(23,24,28,0.06)'; rrect(c, cx - 136, 118, 272, 34, 4); c.fill();
        label(c, `${p[6]} ${PNAME[p[2]]} · ${p[5]}`, cx, 136, { align: 'center', base: 'middle', size: 13, ls: 1, color: on ? P.ground : P.mute, weight: 700 });
      });
      if (!done) {
        const p = PT[nx];
        tag(c, `${nx + 1} / 6  ·  ${PNAME[p[2]]} ${PDN[p[3]]}  ·  ${p[5]}`, 72, 80, seg(t, 0.1, 0.5));
        const sub = p[2] === 'push' ? 'BOTH SHOTS MOVE TOGETHER  ·  EDGE TO EDGE' : p[2] === 'slide' ? 'THE OLD SHOT HOLDS  ·  THE NEW ONE COVERS IT' : 'TWO BANDS  ·  TWO PUSHES  ·  OPPOSITE WAYS';
        label(c, sub, W - 72, 80, { align: 'right', size: 15, ls: 2, color: P.ink, alpha: seg(t, 0.3, 0.7) });
      } else {
        tag(c, 'TWO FRAMES  ·  ONE EDGE', 72, 80, seg(t, 8.7, 9.0));
        label(c, 'PUSH ≠ WIPE: THE PICTURES MOVE, NOT A MATTE', W - 72, 80, { align: 'right', size: 15, ls: 2, color: P.ink, alpha: seg(t, 8.8, 9.2) });
      }
      TK.caption(c, t, W, H, { name: 'Push', cat: 'Transitions', curve: PT[nx][4], span: [PT[nx][0], PT[nx][1]], lo: -0.1, hi: 1.15, curveLabel: `${PT[nx][2] === 'slide' ? 'SLIDE' : 'PUSH'} OFFSET / TIME` });
    },
    score(A) {
      TK.bed(A);
      const pan = { L: -0.45, R: 0.45, U: 0, D: 0, LR: 0 };
      PT.forEach(([t0, t1, kind, dir], i) => {
        const d = t1 - t0;
        if (kind === 'split') {
          A.whoosh(t0 - 0.03, d + 0.05, { f1: 300, f2: 3200, g: 0.12, swell: 0.5, pan: -0.6 });
          A.whoosh(t0 - 0.03, d + 0.05, { f1: 260, f2: 2800, g: 0.12, swell: 0.5, pan: 0.6 });
        } else if (kind === 'slide') {
          A.noise(t0, { type: 'bandpass', f: 2600, f2: 900, q: 0.9, dur: d * 0.8, g: 0.09, swell: 0.15, pan: 0.4 });
        } else {
          A.whoosh(t0 - 0.03, d + 0.05, { f1: dir === 'U' ? 300 : 500, f2: dir === 'D' ? 900 : 3600, g: 0.15, swell: dir === 'R' ? 0.5 : i === 1 ? 0.2 : 0.6, pan: pan[dir] });
        }
        A.kick(t1, 0.28, { f: 170, f2: 60, dur: 0.22 });
        A.noise(t1, { type: 'bandpass', f: 1500, q: 1.4, dur: 0.06, g: 0.12 });
        A.pluck(t1, midi([67, 71, 74, 72, 76, 79][i]), { g: 0.13, bright: 0.6, dur: 1 });
      });
      A.chord(8.5, [60, 64, 67, 72], { type: 'triangle', dur: 1.8, g: 0.04, a: 0.03, lp: 2400, rev: 0.6, width: 0.8 });
      A.bell(8.5, midi(84), { g: 0.06, dur: 1.6 });
    },
  });

  /* =====================================================================
     GLITCH — a cut between Token states hidden inside a burst of broken
     signal. Each transition lasts one bar of eight sixteenths; the glitch
     amount swells and dies on a sine with a seeded random spike on every
     sixteenth, and the hard cut lands on the beat in the middle. Four
     operations are introduced one per transition, then stacked:
       RGB SPLIT    red and blue channels offset in opposite directions,
       BLOCK SHIFT  the picture cut into seeded horizontal slices, each
                    slid sideways (wrapping) by a quantised offset,
       TEAR         3 px rows below a tear line pulled sideways with an
                    exponential falloff, under dark scanlines,
       QUANTISE     a 20 px block mosaic held for four frames, mixing old
                    and new blocks and dragging them by block vectors.
     Every random value comes from hash(step, seed) with the step at
     15 Hz, so a frame is a pure function of t. The pixel work runs on
     960×540 offscreen buffers and a 48×27 mosaic; the slice and row
     offsets are charted beside the picture, aligned with it.
     ===================================================================== */
  const GR = { x: 480, y: 180, w: 960, h: 540 }, GB = 20, GMW = 48, GMH = 27;
  const GS = [
    { bg: P.ground, grid: 'rgba(23,24,28,0.08)', tok: P.accent, rot: 0, name: 'A' },
    { bg: P.ink, grid: 'rgba(236,232,223,0.08)', tok: P.accent, rot: PI / 2, name: 'B' },
    { bg: P.ground, grid: 'rgba(23,24,28,0.08)', tok: P.blue, rot: PI, name: 'C', word: P.ink },
    { bg: P.accent, grid: 'rgba(23,24,28,0.1)', tok: P.ink, rot: PI * 1.5, name: 'D' },
    { bg: P.blue, grid: 'rgba(236,232,223,0.12)', tok: P.ground, rot: TAU, name: 'E' },
    { bg: P.ground, grid: 'rgba(23,24,28,0.08)', tok: P.accent, rot: TAU, name: 'F', word: P.ink },
  ];
  // [start, ops, seed]; each lasts one bar (1 s), cut at the beat in the middle
  const GT = [[1.0, ['rgb'], 3], [2.5, ['block'], 11], [4.0, ['tear'], 19], [5.5, ['quant'], 27], [7.5, ['quant', 'block', 'tear', 'rgb'], 41]];
  const GOPS = [['rgb', 'RGB SPLIT'], ['block', 'BLOCK DISPLACE'], ['tear', 'SCANLINE TEAR'], ['quant', 'QUANTISE HOLD']];
  const gAmt = (u, seed) => (u <= 0 || u >= 1 ? 0 : Math.pow(Math.sin(PI * u), 0.6) * (0.35 + 0.65 * hash(seed * 13.1 + Math.floor(u * 8))));
  function gState(k) {
    const s = GS[k], cv = MG.offscreen(GR.w, GR.h), c = cv.getContext('2d'), w = GR.w, h = GR.h;
    c.fillStyle = s.bg; c.fillRect(0, 0, w, h);
    c.strokeStyle = s.grid; c.lineWidth = 1; c.beginPath();
    for (let x = 40; x < w; x += 40) { c.moveTo(x, 0); c.lineTo(x, h); }
    for (let y = 30; y < h; y += 40) { c.moveTo(0, y); c.lineTo(w, y); }
    c.stroke();
    TK.token(c, w / 2, s.word ? h / 2 - 50 : h / 2, s.word ? 200 : 250, { rot: s.rot, color: s.tok });
    if (s.word) TK.word(c, w / 2, h / 2 + 150, { size: 84, color: s.word, ls: 5 });
    label(c, `STATE ${s.name}`, 24, 40, { size: 16, ls: 2, color: s.bg === P.ground || s.bg === P.accent ? P.ink : P.ground, weight: 700 });
    return cv;
  }
  function gAt(t) {
    let k = -1;
    for (let i = 0; i < GT.length; i++) if (t >= GT[i][0]) k = i;
    return k;
  }
  // seeded slices for the block shift: [y, h, dx]
  function gSlices(step, seed, a) {
    const out = []; let y = 0, i = 0;
    while (y < GR.h) {
      const hh = Math.min(GR.h - y, 12 + Math.floor(hash(step * 3.7 + seed + i * 1.91) * 9) * 10);
      const r = hash(step * 5.3 + seed * 2.1 + i * 7.77), dx = r < 0.4 ? 0 : Math.round((hash(step * 1.3 + i * 4.1 + seed) * 2 - 1) * a * 300 / 8) * 8;
      out.push([y, hh, dx]); y += hh; i++;
    }
    return out;
  }
  const gTearY = (step, seed) => Math.round((0.2 + 0.6 * hash(step * 2.9 + seed * 0.7)) * GR.h / 3) * 3;
  const gTearDx = (y, ty, a) => (y < ty ? 0 : a * 240 * Math.exp(-(y - ty) / 55) * (1 + 0.35 * Math.sin(y * 0.21)));

  MG.film({
    id: 'techglitch', dur: 10, poster: 2.7,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Glitch', sub: 'Broken signal as a transition: split, shift, tear, quantise', era: '1990s —',
      origin: 'Glitch borrows the faults of electronic images — analogue sync tearing, misaligned colour channels, digital compression blocks — and stages them on purpose. Glitch music and art of the 1990s and 2000s made the error an aesthetic, Takeshi Murata’s Monster Movie (2005) pushed datamoshing (deleting the key frames of a compressed video so motion smears one picture into the next) into galleries, and Kanye West’s Welcome to Heartbreak video (2009) took it into the mainstream; editors now hide cuts inside RGB splits and block shifts from preset packs.',
      works: 'Monster Movie (Takeshi Murata, 2005; datamosh) · Welcome to Heartbreak, Kanye West (dir. Nabil Elderkin, 2009) · Chairlift, Evident Utensil (dir. Ray Tintori, 2009; datamosh)',
      tech: ['RGB channel offset', 'Seeded slice displacement', 'Quantised datamosh hold'],
      accent: '#ff5a1f',
      motionDNA: 'Clean holds, then one bar of breakage per transition: the glitch amount swells and decays across eight sixteenths, jumping to a new seeded value on each one, with the hard cut landing on the beat in the middle where the damage is worst. Four operations arrive one transition at a time — channels split, slices shift, rows tear, blocks freeze and drag — and the last transition stacks all four before the final state settles clean.',
      visualDNA: 'The Technique Atlas stage with the picture framed in ink at the centre; Token states in orange, ink, blue and paper colourways; red and blue fringes, sideways-shifted bands, torn scanlines and a coarse block mosaic; a left-hand operation stack with live parameters and amount bars; slice and row offset charts on the right aligned to the picture; a sixteenth-note amount strip with the cut under the picture.',
      transitions: 'Glitch cuts: RGB split, block displacement, scanline tear, quantise hold, then all four stacked',
      implementation: ['After Effects / Premiere glitch presets (channel offset, displacement, mosaic)', 'Datamosh: dropped I-frames in compressed video (Avidemux)', 'Canvas 2D: slice drawImage, multiply + lighter channel split, 48×27 mosaic upscaled'],
      reproducibility: 'Procedural with seeded hash noise',
      loopable: false,
    },
    setup() {
      const mk = () => { const cv = MG.offscreen(GR.w, GR.h); return { cv, c: cv.getContext('2d') }; };
      const tiny = () => { const cv = MG.offscreen(GMW, GMH); return { cv, c: cv.getContext('2d') }; };
      const st = { img: GS.map((_, k) => gState(k)), b1: mk(), b2: mk(), ch: mk(), tA: tiny(), tB: tiny(), m: tiny() };
      return st;
    },
    draw(c, t, W, H, st) {
      TK.stage(c, W, H);
      const k = gAt(t), tr = k >= 0 ? GT[k] : null, raw = tr ? seg(t, tr[0], tr[0] + 1) : 0;
      const active = tr && raw > 0 && raw < 1, seed = tr ? tr[2] : 0;
      const a = active ? gAmt(raw, seed) : 0, step = Math.floor(t * 15), ops = active ? tr[1] : [];
      const cur = k < 0 ? 0 : raw < 0.5 ? k : k + 1, has = o => ops.includes(o);
      const { x: gx, y: gy, w: gw, h: gh } = GR;
      const R = (n) => hash(step * 7.1 + seed * 3.3 + n * 1.37);
      let slices = null, ty = 0, rgbDx = 0, newFrac = 0;
      if (!active || a < 0.02) {
        c.drawImage(st.img[cur], gx, gy);
      } else {
        let src = st.b1, dst = st.b2;
        src.c.globalCompositeOperation = 'copy'; src.c.drawImage(st.img[cur], 0, 0); src.c.globalCompositeOperation = 'source-over';
        if (has('quant')) {
          // held mosaic: steps at 7.5 Hz (hold four frames); old and new blocks mixed, dragged by block vectors
          const hs = Math.floor(t * 7.5), A0 = st.img[k], B0 = st.img[k + 1];
          [[st.tA, A0], [st.tB, B0]].forEach(([tb, im]) => { tb.c.imageSmoothingEnabled = true; tb.c.drawImage(im, 0, 0, GMW, GMH); });
          const m = st.m.c, p = clamp(raw * 1.3 - 0.15);
          let nn = 0;
          for (let by = 0; by < GMH; by++) for (let bx = 0; bx < GMW; bx++) {
            const hb = 0.75 * hash(Math.floor(bx / 6) * 13.7 + Math.floor(by / 4) * 71.3 + seed) + 0.25 * hash(bx * 3.1 + by * 7.9 + seed), isNew = hb < p;
            const mvx = Math.round((hash(Math.floor(bx / 4) * 3.1 + hs * 9.7 + seed) - 0.5) * 6 * a), mvy = Math.round((hash(by * 5.3 + hs * 2.3) - 0.5) * 2 * a);
            const sx = clamp(bx + (isNew ? mvx : 0), 0, GMW - 1), sy = clamp(by + (isNew ? mvy : 0), 0, GMH - 1);
            m.drawImage(isNew ? st.tB.cv : st.tA.cv, sx, sy, 1, 1, bx, by, 1, 1);
            if (isNew) nn++;
          }
          newFrac = nn / (GMW * GMH);
          src.c.save(); src.c.globalAlpha = clamp(a * 1.8); src.c.imageSmoothingEnabled = false;
          src.c.drawImage(st.m.cv, 0, 0, gw, gh); src.c.restore();
        }
        if (has('block')) {
          slices = gSlices(step, seed, a);
          dst.c.globalCompositeOperation = 'copy';
          slices.forEach(([y, hh, dx]) => {
            dst.c.drawImage(src.cv, 0, y, gw, hh, dx, y, gw, hh);
            dst.c.globalCompositeOperation = 'source-over';
            if (dx) dst.c.drawImage(src.cv, 0, y, gw, hh, dx - Math.sign(dx) * gw, y, gw, hh);
          });
          dst.c.globalCompositeOperation = 'source-over';
          [src, dst] = [dst, src];
        }
        if (has('tear')) {
          ty = gTearY(step, seed);
          for (let y = ty; y < gh; y += 3) {
            const dx = Math.round(gTearDx(y, ty, a));
            if (Math.abs(dx) < 1) break;
            src.c.drawImage(src.cv, 0, y, gw, 3, dx, y, gw, 3);
            src.c.drawImage(src.cv, gw - dx, y, dx, 3, 0, y, dx, 3);
          }
        }
        c.save(); c.beginPath(); c.rect(gx, gy, gw, gh); c.clip();
        if (has('rgb')) {
          rgbDx = Math.round(a * 34 * (0.6 + 0.4 * R(1)));
          c.fillStyle = '#000'; c.fillRect(gx, gy, gw, gh);
          [['#ff0000', rgbDx, Math.round(a * 5 * R(2))], ['#00ff00', 0, 0], ['#0000ff', -rgbDx, -Math.round(a * 5 * R(3))]].forEach(([col, dx, dy]) => {
            const ch = st.ch.c;
            ch.globalCompositeOperation = 'copy'; ch.drawImage(src.cv, 0, 0);
            ch.globalCompositeOperation = 'multiply'; ch.fillStyle = col; ch.fillRect(0, 0, gw, gh);
            ch.globalCompositeOperation = 'source-over';
            c.globalCompositeOperation = 'lighter'; c.drawImage(st.ch.cv, gx + dx, gy + dy);
            if (dx) c.drawImage(st.ch.cv, gx + dx - Math.sign(dx) * gw, gy + dy);   // wrap round
          });
          c.globalCompositeOperation = 'source-over';
        } else c.drawImage(src.cv, gx, gy);
        if (has('tear')) {
          c.fillStyle = `rgba(10,10,14,${0.22 * a})`;
          for (let y = 0; y < gh; y += 4) c.fillRect(gx, gy + y, gw, 2);
          c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(gx, gy + ty, gw, 2);
        }
        c.restore();
      }
      c.strokeStyle = P.ink; c.lineWidth = 3; c.strokeRect(gx - 1.5, gy - 1.5, gw + 3, gh + 3);
      label(c, 'PICTURE  ·  960 × 540', gx, gy - 16, { size: 14, ls: 2, color: P.ink, weight: 700 });
      label(c, active ? `STATE ${GS[k].name} → ${GS[k + 1].name}  ·  NOW ${GS[cur].name}` : `STATE ${GS[cur].name}  ·  CLEAN`, gx + gw, gy - 16, { size: 14, ls: 2, color: active ? P.accentD : P.mute, weight: 700, align: 'right' });

      // left: operation stack
      const lx = 72;
      label(c, 'OPERATION STACK', lx, 214, { size: 15, ls: 2, color: P.ink, weight: 700 });
      label(c, active ? `SEED ${seed}  ·  STEP ${step}  ·  15 HZ` : 'SEEDED  ·  STEPS AT 15 HZ', lx, 238, { size: 12, ls: 1 });
      GOPS.forEach(([id, nm], i) => {
        const yy = 290 + i * 96, introduced = t >= GT[Math.min(i, 3)][0] - 0.3, on = has(id);
        const col = on ? P.ink : introduced ? P.mute : 'rgba(143,138,128,0.45)';
        c.fillStyle = on ? P.accent : 'rgba(23,24,28,0.15)'; c.beginPath(); c.arc(lx + 7, yy - 6, 7, 0, TAU); c.fill();
        label(c, `${i + 1}  ${nm}`, lx + 24, yy, { size: 17, ls: 2, color: col, weight: 700 });
        const par = id === 'rgb' ? (on ? `R ${fmtS(rgbDx)} PX  ·  B ${fmtS(-rgbDx)} PX` : 'R +X  ·  B −X')
          : id === 'block' ? (on && slices ? `${slices.length} SLICES  ·  MAX ${Math.max(...slices.map(s => Math.abs(s[2])))} PX` : 'SLICES SLID SIDEWAYS')
            : id === 'tear' ? (on ? `TEAR AT Y ${ty}  ·  3 PX ROWS` : 'ROWS PULLED BELOW A LINE')
              : (on ? `${GB} PX BLOCKS  ·  ${Math.round(newFrac * 100)}% NEW  ·  HOLD 4 FR` : `${GB} PX MOSAIC  ·  HELD`);
        label(c, par, lx + 24, yy + 24, { size: 12, ls: 1, color: on ? P.accentD : P.mute, weight: on ? 700 : 400 });
        c.fillStyle = 'rgba(23,24,28,0.1)'; c.fillRect(lx + 24, yy + 38, 300, 4);
        if (on) { c.fillStyle = P.accent; c.fillRect(lx + 24, yy + 38, 300 * a, 4); }
      });
      if (has('quant')) {   // the mosaic itself, magnified
        c.save(); c.imageSmoothingEnabled = false; c.drawImage(st.m.cv, lx + 24, 676 - 0, GMW * 4, GMH * 4); c.restore();
        c.strokeStyle = P.ink; c.lineWidth = 1; c.strokeRect(lx + 24.5, 676.5, GMW * 4, GMH * 4);
        label(c, `MOSAIC ${GMW} × ${GMH}`, lx + 24, 664, { size: 12, ls: 1, color: P.ink, weight: 700 });
      }

      // right: offsets aligned with the picture rows
      const rx = 1500, rz = 1680;
      label(c, has('tear') && !has('block') ? 'ROW OFFSETS' : 'SLICE OFFSETS', rx, gy - 16, { size: 14, ls: 2, color: active && (has('block') || has('tear')) ? P.ink : P.mute, weight: 700 });
      c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(rz, gy, 1, gh);
      label(c, '0', rz, gy + gh + 22, { size: 12, align: 'center' });
      if (slices) slices.forEach(([y, hh, dx]) => {
        c.fillStyle = dx ? P.ink : 'rgba(23,24,28,0.12)';
        const bw = dx * 0.5; c.fillRect(Math.min(rz, rz + bw), gy + y + 1, Math.max(2, Math.abs(bw)), hh - 2);
        c.fillStyle = 'rgba(23,24,28,0.3)'; c.fillRect(gx + gw + 4, gy + y, 10, 1);
        if (dx && hh >= 20) label(c, fmtS(dx), dx > 0 ? rz + bw + 8 : rz + bw - 8, gy + y + hh / 2 + 4, { size: 11, ls: 0, color: P.ink, align: dx > 0 ? 'left' : 'right' });
      });
      if (has('tear')) {
        c.strokeStyle = P.accent; c.lineWidth = 2; c.beginPath();
        for (let y = 0; y <= gh; y += 3) { const v = rz + gTearDx(y, ty, a) * 0.5; y ? c.lineTo(v, gy + y) : c.moveTo(v, gy + y); }
        c.stroke();
        c.fillStyle = P.accentD; c.fillRect(rx - 10, gy + ty - 1, 340, 2);
        label(c, 'TEAR', rx - 10, gy + ty - 8, { size: 12, ls: 2, color: P.accentD, weight: 700 });
      }
      if (has('rgb')) {
        [['R', '#e0301e', rgbDx], ['G', '#2e9e4a', 0], ['B', P.blue, -rgbDx]].forEach(([n, col, dx], i) => {
          const yy = gy + gh + 56 + i * 30;
          c.fillStyle = col; c.fillRect(rz + dx * 1.5 - 30, yy - 12, 60, 18);
          label(c, `${n} ${fmtS(dx)}`, rz + dx * 1.5, yy + 2, { size: 12, ls: 1, color: '#fff', weight: 700, align: 'center' });
        });
      }

      // under the picture: the bar of sixteenths, the amount per step and the cut on the beat
      const sx = gx, sy = 800, sw = gw;
      if (tr) {
        label(c, 'GLITCH AMOUNT  ·  ONE VALUE PER SIXTEENTH', sx, sy - 52, { size: 12, ls: 2, color: P.ink, weight: 700 });
        for (let i = 0; i < 8; i++) {
          const v = gAmt((i + 0.5) / 8, seed), on = active && Math.floor(raw * 8) === i;
          c.fillStyle = on ? P.accent : 'rgba(23,24,28,0.2)';
          c.fillRect(sx + i * sw / 8 + 6, sy - v * 34, sw / 8 - 12, v * 34);
        }
        c.fillStyle = 'rgba(23,24,28,0.3)'; c.fillRect(sx, sy, sw, 2);
        c.fillStyle = P.ink; c.fillRect(sx + sw / 2 - 1, sy - 44, 3, 58);
        label(c, 'CUT ON THE BEAT', sx + sw / 2 + 10, sy + 18, { size: 12, ls: 2, color: P.ink, weight: 700 });
        if (active) { c.fillStyle = P.accentD; c.fillRect(sx + raw * sw - 1, sy - 40, 2, 52); }
      }
      // tag
      let nx = 0; for (let i = 0; i < GT.length; i++) if (t >= GT[i][0] - 0.4) nx = i;
      const fin = t > GT[4][0] + 1.2;
      const nm = GT[nx][1].length > 1 ? 'ALL FOUR, STACKED' : GOPS.find(o => o[0] === GT[nx][1][0])[1];
      if (!fin) tag(c, `GLITCH ${nx + 1} / 5  ·  ${nm}`, 72, 80, seg(t, 0.1, 0.5));
      else tag(c, 'A HARD CUT, HIDDEN IN BROKEN SIGNAL', 72, 80, seg(t, 8.7, 9.0));
      label(c, 'DETERMINISTIC  ·  HASH(STEP, SEED)', W - 72, 80, { align: 'right', size: 15, ls: 2, color: P.ink, alpha: seg(t, 0.3, 0.7) });
      TK.caption(c, t, W, H, { name: 'Glitch', cat: 'Transitions', curve: u => gAmt(u, GT[nx][2]), span: [GT[nx][0], GT[nx][0] + 1], lo: -0.1, hi: 1.15, curveLabel: 'GLITCH AMOUNT / TIME' });
    },
    score(A) {
      TK.bed(A);
      GT.forEach(([t0, ops, seed], gi) => {
        for (let i = 0; i < 8; i++) {
          const ts = t0 + i * BEAT / 4, v = gAmt((i + 0.5) / 8, seed), r = hash(seed * 5.1 + i * 3.3);
          if (v < 0.2) continue;
          A.noise(ts, { type: 'bandpass', f: 1200 + r * 5000, q: 2, dur: 0.05 + v * 0.05, g: 0.07 + v * 0.08, crush: true, pan: (r - 0.5) * 0.8 });
          A.osc(ts, { type: 'square', f: midi(72 + Math.floor(r * 24)), dur: 0.05, g: 0.03 * v, lp: 3000, crush: true });
        }
        const mid = t0 + 0.5;
        if (ops.includes('rgb')) A.osc(t0 + 0.1, { type: 'sawtooth', f: 180, f2: 720, glide: 0.4, dur: 0.8, g: 0.03, detune: 18, lp: 1800 });
        if (ops.includes('block')) [0, 0.0625, 0.125, 0.25].forEach(d => A.osc(mid - 0.25 + d, { type: 'square', f: 90 + d * 400, dur: 0.05, g: 0.05, crush: true }));
        if (ops.includes('tear')) A.noise(t0 + 0.2, { type: 'bandpass', f: 6000, f2: 400, sweep: 0.6, q: 3, dur: 0.6, g: 0.07, swell: 0.3 });
        if (ops.includes('quant')) for (let h = 0; h < 7; h++) A.osc(t0 + 0.06 + h / 7.5, { type: 'square', f: 55 * (h % 2 ? 1.5 : 1), dur: 0.11, g: 0.04, lp: 900, crush: true });
        A.snare(mid, gi === 4 ? 0.2 : 0.13, { f: 2600, dur: 0.1, rev: 0.25 });
        A.pluck(mid, midi([67, 70, 74, 65, 72][gi]), { g: 0.12, bright: 0.8, dur: 0.9 });
      });
      A.impact(GT[4][0] + 0.5, 0.3);
      A.chord(8.5, [60, 64, 67, 72], { type: 'triangle', dur: 1.6, g: 0.04, a: 0.04, lp: 2400, rev: 0.6, width: 0.8 });
    },
  });

  /* =====================================================================
     EASING — slow out and slow in. The same 1.5 s move from key A to key B
     runs on four lanes: linear, ease-in, ease-out and ease-in-out. Each
     lane's timing is a cubic bezier whose two handles are drawn beside it
     and really drive it (x solved by bisection, y read off); under each
     track sit the 13 frame positions at 8 fps, evenly spaced in time but
     bunched in space wherever the curve is flat. Two moves on quad-shaped
     handles, a quarter-second in which the handles stretch to their cubic
     shapes, a third move, and then the animator's version of the same
     idea: a spacing chart of keys, breakdown and in-betweens, drawings
     stepping across it with onion-skins left behind.
     ===================================================================== */
  const EA = 470, EB = 1250, ELY = [235, 375, 515, 655], ESZ = 62, EN = 12;
  const EL = [
    { name: 'LINEAR', sub: 'EVEN SPACING', q: [1 / 3, 1 / 3, 2 / 3, 2 / 3], cu: [1 / 3, 1 / 3, 2 / 3, 2 / 3] },
    { name: 'EASE IN', sub: 'SLOW OUT OF A', q: [0.55, 0.085, 0.68, 0.53], cu: [0.55, 0.055, 0.675, 0.19] },
    { name: 'EASE OUT', sub: 'SLOW IN TO B', q: [0.25, 0.46, 0.45, 0.94], cu: [0.215, 0.61, 0.355, 1] },
    { name: 'EASE IN-OUT', sub: 'SLOW OUT · SLOW IN', q: [0.455, 0.03, 0.515, 0.955], cu: [0.645, 0.045, 0.355, 1] },
  ];
  // moves: [start, end, from, to]
  const EM = [[1.0, 2.5, EA, EB], [3.0, 4.5, EB, EA], [5.25, 6.75, EA, EB]];
  const EMORPH = [4.65, 5.1];
  const ECH = { t0: 7.5, dur: 1.5, a: 380, b: 1540, y: 610, s: 140, h: [0.42, 0, 0.58, 1] };
  const bz = (p1, p2, s) => 3 * (1 - s) * (1 - s) * s * p1 + 3 * (1 - s) * s * s * p2 + s * s * s;
  function ease(h, u) {
    if (u <= 0) return 0; if (u >= 1) return 1;
    let lo = 0, hi = 1, s = u;
    for (let i = 0; i < 26; i++) { s = (lo + hi) / 2; if (bz(h[0], h[2], s) < u) lo = s; else hi = s; }
    return bz(h[1], h[3], s);
  }
  const eMix = t => E.ioC(seg(t, EMORPH[0], EMORPH[1]));
  const eH = (l, t) => l.q.map((v, i) => lerp(v, l.cu[i], eMix(t)));
  function eMove(t) {
    let m = EM[0];
    for (const mv of EM) if (t >= mv[0] - 0.3) m = mv;
    return m;
  }
  const f2 = v => (v < 0 ? '−' : '') + Math.abs(v).toFixed(2).replace(/^0/, '');

  MG.film({
    id: 'techeasing', dur: 10, poster: 1.85,
    fonts: TK.fonts,
    meta: {
      family: 'K', name: 'Easing', sub: 'Slow out, slow in: the same move, four timings', era: '1930s —',
      origin: '“Slow in and slow out” is one of the twelve principles Disney animators set down and Frank Thomas and Ollie Johnston published in The Illusion of Life (1981): drawings bunch near the keys so a move starts and stops gently, planned on the timing charts animators draw in the margin of each key. Computer animation turned the spacing into curves — Pierre Bézier’s curves (Renault, 1960s) became the handles of every graph editor, Robert Penner’s easing equations (2001) named ease-in, ease-out and ease-in-out in code, and CSS transitions ship the same curves as cubic-bezier() keywords.',
      works: 'The Illusion of Life: Disney Animation (Frank Thomas and Ollie Johnston, 1981) · The Animator’s Survival Kit (Richard Williams, 2001; timing and spacing charts) · Robert Penner’s Easing Equations (Flash ActionScript, 2001)',
      tech: ['Spacing vs timing', 'Cubic bezier handles', 'Animator’s spacing chart'],
      accent: '#ff5a1f',
      motionDNA: 'Four Tokens leave key A and reach key B at exactly the same moments, so only the spacing differs: the linear one crosses at an even pace, ease-in creeps out and arrives at full speed, ease-out leaves at full speed and creeps in, ease-in-out does both. Three moves, back and forth; between the second and third the handles stretch from quad to cubic so the slow ends get slower and the middle faster; then one large Token steps across a spacing chart, one drawing per sixteenth.',
      visualDNA: 'The Technique Atlas stage with four lanes between dashed KEY A and KEY B lines; small orange Tokens on thin tracks with rows of frame dots that bunch at the ends; a value/time box per lane with the bezier handles drawn as ink lines and orange knobs and their coordinates; then a classic spacing chart with numbered ticks, a breakdown mark and SLOW OUT / SLOW IN brackets, an even time row fanned onto it, and onion-skin outlines across the track.',
      transitions: 'Lanes run three moves, handles morph quad to cubic, lanes give way to the spacing chart',
      implementation: ['After Effects graph editor / Easy Ease (F9) · keyframe velocity', 'CSS transition-timing-function: ease-in, ease-out, ease-in-out, cubic-bezier()', 'Canvas 2D: cubic bezier with x solved by bisection, sampled at 8 fps for the spacing dots'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      const lanes = 1 - seg(t, 7.0, 7.35), m = eMove(t), [t0, t1, ma, mb] = m, raw = seg(t, t0, t1);
      if (lanes > 0) {
        c.save(); c.globalAlpha = lanes;
        // keys
        [[EA, 'KEY A'], [EB, 'KEY B']].forEach(([kx, nm]) => {
          c.save(); c.setLineDash([8, 7]); c.strokeStyle = 'rgba(23,24,28,0.4)'; c.lineWidth = 2;
          c.beginPath(); c.moveTo(kx, 175); c.lineTo(kx, 715); c.stroke(); c.restore();
          label(c, nm, kx, 162, { align: 'center', size: 14, ls: 2, color: P.ink, weight: 700 });
        });
        const half = t >= t0 + (t1 - t0) / 2 && t < t1 + 0.45;
        EL.forEach((l, i) => {
          const y = ELY[i], h = eH(l, t), hi = i === 3;
          label(c, l.name, 72, y - 4, { size: 20, ls: 2, color: P.ink, weight: 700 });
          label(c, l.sub, 72, y + 20, { size: 13, ls: 2, color: hi ? P.accentD : P.mute });
          // track and spacing dots: frame i at time i/12 of the move
          c.fillStyle = 'rgba(23,24,28,0.12)'; c.fillRect(EA, y - 1, EB - EA, 2);
          const fNow = raw * EN;
          for (let f = 0; f <= EN; f++) {
            const px = lerp(ma, mb, ease(h, f / EN)), passed = t >= t0 && f <= fNow + 1e-6;
            c.fillStyle = passed ? P.ink : P.ground; c.strokeStyle = 'rgba(23,24,28,0.45)'; c.lineWidth = 1.5;
            c.beginPath(); c.arc(px, y + 50, 5, 0, TAU); c.fill(); if (!passed) c.stroke();
            if (f === 0 || f === EN || f === EN / 2) label(c, String(f), px + (f === EN / 2 ? 0 : px < (EA + EB) / 2 ? -12 : 14), y + 74, { align: 'center', size: 11, ls: 0, color: f === EN / 2 ? P.accentD : P.mute });
          }
          // half-time ghost
          const pm = ease(h, 0.5), xm = lerp(ma, mb, pm);
          if (half) {
            c.save(); c.translate(xm, y); TK.tokenPath(c, ESZ); c.setLineDash([5, 5]); c.lineWidth = 2; c.strokeStyle = P.accentD; c.stroke(); c.restore();
          }
          label(c, `HALF TIME → ${Math.round(pm * 100)}% OF THE WAY`, 72, y + 42, { size: 12, ls: 1, color: P.accentD, weight: 700, alpha: half ? 1 : 0.0 });
          const x = lerp(ma, mb, ease(h, raw));
          TK.token(c, x, y, ESZ, { color: hi ? P.accent : P.accentL });
          // bezier box: time across, value up, handles drawn
          const bx = 1370, bw = 150, bh = 100, by = y - 55;
          const X = u => bx + u * bw, Y = v => by + bh - v * bh;
          c.strokeStyle = 'rgba(23,24,28,0.2)'; c.lineWidth = 1; c.strokeRect(bx + 0.5, by + 0.5, bw, bh);
          c.strokeStyle = P.mute; c.lineWidth = 1.5; c.beginPath();
          c.moveTo(X(0), Y(0)); c.lineTo(X(h[0]), Y(h[1])); c.moveTo(X(1), Y(1)); c.lineTo(X(h[2]), Y(h[3])); c.stroke();
          c.strokeStyle = P.ink; c.lineWidth = 2.5; c.beginPath();
          c.moveTo(X(0), Y(0)); c.bezierCurveTo(X(h[0]), Y(h[1]), X(h[2]), Y(h[3]), X(1), Y(1)); c.stroke();
          [[h[0], h[1]], [h[2], h[3]]].forEach(([u, v]) => { c.fillStyle = P.accent; c.beginPath(); c.arc(X(u), Y(v), 6, 0, TAU); c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1.5; c.stroke(); });
          [[0, 0], [1, 1]].forEach(([u, v]) => { c.fillStyle = P.ink; c.fillRect(X(u) - 3, Y(v) - 3, 6, 6); });
          if (t >= t0 && t <= t1 + 0.4) { c.fillStyle = P.accentD; c.beginPath(); c.arc(X(raw), Y(ease(h, raw)), 4, 0, TAU); c.fill(); }
          label(c, `P1 (${f2(h[0])}, ${f2(h[1])})`, bx + bw + 18, y - 8, { size: 12, ls: 1, color: P.ink });
          label(c, `P2 (${f2(h[2])}, ${f2(h[3])})`, bx + bw + 18, y + 14, { size: 12, ls: 1, color: P.ink });
        });
        label(c, 'TIME →', 1370, 726, { size: 11, ls: 2 });
        label(c, '●  FRAME SHOWN    ○  STILL TO COME    ·    DOTS CLOSE TOGETHER = SLOW    ·    DOTS FAR APART = FAST', EA, 790, { size: 13, ls: 2, color: P.ink });
        const mix = eMix(t);
        tag(c, mix < 0.5 ? 'ONE MOVE  ·  FOUR TIMINGS  ·  QUAD HANDLES' : 'ONE MOVE  ·  FOUR TIMINGS  ·  CUBIC HANDLES', 72, 80, seg(t, 0.1, 0.5));
        const morph = t > EMORPH[0] - 0.1 && t < EMORPH[1] + 0.6;
        label(c, morph ? 'QUAD → CUBIC: HANDLES PULL HARDER, ENDS GET SLOWER' : 'SAME START  ·  SAME END  ·  ONLY THE SPACING CHANGES', W - 72, 80, { align: 'right', size: 15, ls: 2, color: morph ? P.accentD : P.ink, alpha: seg(t, 0.3, 0.7), weight: morph ? 700 : 400 });
        label(c, `13 FRAMES  ·  8 FPS  ·  EVEN IN TIME`, 72, 130, { size: 13, ls: 2, color: P.mute });
        c.restore();
      }
      const hio = eH(EL[3], t);
      let span = [t0, t1];
      if (t > 7.0) {
        // the animator's spacing chart
        const on = seg(t, 7.2, 7.55), { a: ca, b: cb, y: cy, s: cs } = ECH;
        c.save(); c.globalAlpha = on;
        const pos = f => lerp(ca, cb, ease(ECH.h, f / EN));
        const fi = clamp(Math.floor((t - ECH.t0) / (ECH.dur / EN) + 1e-6), -1, EN);
        // time row (even) fanned onto the chart (bunched)
        const tyy = 215, syy = 315;
        label(c, 'TIME', ca - 40, tyy + 5, { size: 13, ls: 2, align: 'right', color: P.ink, weight: 700 });
        label(c, 'SPACING', ca - 40, syy + 5, { size: 13, ls: 2, align: 'right', color: P.ink, weight: 700 });
        c.fillStyle = 'rgba(23,24,28,0.3)'; c.fillRect(ca, tyy, cb - ca, 1); c.fillStyle = P.ink; c.fillRect(ca, syy - 1, cb - ca, 3);
        c.strokeStyle = 'rgba(23,24,28,0.18)'; c.lineWidth = 1; c.beginPath();
        for (let f = 0; f <= EN; f++) { c.moveTo(lerp(ca, cb, f / EN), tyy + 6); c.lineTo(pos(f), syy - 14); }
        c.stroke();
        for (let f = 0; f <= EN; f++) {
          const tx = lerp(ca, cb, f / EN), sx = pos(f), key = f === 0 || f === EN, br = f === EN / 2;
          c.fillStyle = f <= fi ? P.ink : 'rgba(23,24,28,0.3)'; c.beginPath(); c.arc(tx, tyy, 4, 0, TAU); c.fill();
          c.fillStyle = key || br ? P.ink : P.mute; c.fillRect(sx - 1, syy - (key ? 22 : br ? 18 : 12), key ? 3 : 2, key ? 44 : br ? 36 : 24);
          label(c, String(f + 1), sx, syy + (f % 2 ? 46 : 32), { align: 'center', size: key || br ? 14 : 11, ls: 0, color: key ? P.ink : br ? P.accentD : P.mute, weight: key || br ? 700 : 400 });
          if (key) { c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.arc(sx, syy + (f % 2 ? 41 : 27), 13, 0, TAU); c.stroke(); }
        }
        label(c, 'KEY', ca, syy - 32, { align: 'center', size: 12, ls: 2, color: P.ink, weight: 700 });
        label(c, 'KEY', cb, syy - 32, { align: 'center', size: 12, ls: 2, color: P.ink, weight: 700 });
        label(c, 'BREAKDOWN', pos(EN / 2), syy - 28, { align: 'center', size: 12, ls: 2, color: P.accentD, weight: 700 });
        // slow-out / slow-in brackets over the bunched ends
        [[0, 3, 'SLOW OUT'], [EN - 3, EN, 'SLOW IN']].forEach(([f0, f1, nm]) => {
          const x0 = pos(f0), x1 = pos(f1), yb = syy + 74;
          c.strokeStyle = P.accentD; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, yb - 8); c.lineTo(x0, yb); c.lineTo(x1, yb); c.lineTo(x1, yb - 8); c.stroke();
          label(c, nm, (x0 + x1) / 2, yb + 22, { align: 'center', size: 13, ls: 2, color: P.accentD, weight: 700 });
        });
        // track, onion skins and the drawing
        c.fillStyle = 'rgba(23,24,28,0.12)'; c.fillRect(ca, cy + cs / 2 + 8, cb - ca, 2);
        for (let f = 0; f < Math.max(0, fi); f++) {
          c.save(); c.translate(pos(f), cy); TK.tokenPath(c, cs); c.setLineDash([6, 6]); c.lineWidth = 2; c.strokeStyle = 'rgba(198,62,12,0.45)'; c.stroke(); c.restore();
        }
        TK.token(c, pos(Math.max(0, fi)), cy, cs);
        label(c, fi < 0 ? 'DRAWING 1' : `DRAWING ${fi + 1} / ${EN + 1}`, pos(Math.max(0, fi)), cy + cs / 2 + 40, { align: 'center', size: 14, ls: 2, color: P.ink, weight: 700 });
        c.restore();
        tag(c, 'THE ANIMATOR’S SPACING CHART', 72, 80, seg(t, 7.2, 7.55));
        label(c, 'CSS EASE-IN-OUT  ·  P1 (.42, 0)  ·  P2 (.58, 1)', 98, 116, { size: 14, ls: 2, color: P.accentD, weight: 700, alpha: seg(t, 7.3, 7.7) });
        label(c, 'EVEN TIMING  ·  UNEVEN SPACING  ·  ONE DRAWING PER SIXTEENTH', W - 72, 80, { align: 'right', size: 15, ls: 2, color: P.ink, alpha: seg(t, 7.3, 7.7) });
        TK.word(c, 960, 800, { size: 84, ls: 6, alpha: E.outC(seg(t, 9.2, 9.7)) });
        span = [ECH.t0, ECH.t0 + ECH.dur];
      }
      TK.caption(c, t, W, H, { name: 'Easing', cat: 'Timing', curve: u => ease(t > 7 ? ECH.h : hio, u), span, lo: -0.1, hi: 1.15, curveLabel: 'IN-OUT POSITION / TIME' });
    },
    score(A) {
      TK.bed(A);
      const hio = EL[3];
      EM.forEach(([t0, t1, a, b], mi) => {
        const d = t1 - t0, h = mi < 2 ? hio.q : hio.cu, pan = b > a ? 0.35 : -0.35;
        A.whoosh(t0 + d * 0.15, d * 0.7, { f1: 300, f2: 2600, q: 1.6, g: 0.1, swell: 0.5, pan });
        for (let f = 0; f <= EN; f++) {
          const step = f ? ease(h, f / EN) - ease(h, (f - 1) / EN) : 0;
          A.osc(t0 + f * d / EN, { f: 900 + step * 9000, dur: 0.03, g: 0.025 + step * 0.12, pan });
        }
        A.pluck(t1, midi([67, 64, 72][mi]), { g: 0.14, bright: 0.6, dur: 1.1 });
        A.bell(t1, midi([79, 76, 84][mi]), { g: 0.05, dur: 1.2 });
      });
      A.osc(EMORPH[0], { type: 'triangle', f: midi(60), f2: midi(67), glide: EMORPH[1] - EMORPH[0], dur: 0.6, g: 0.05, a: 0.1, lp: 2000, rev: 0.4 });
      // spacing chart: one tick per drawing, pitched by how far it travels
      for (let f = 0; f <= EN; f++) {
        const tf = ECH.t0 + f * ECH.dur / EN, step = f ? ease(ECH.h, f / EN) - ease(ECH.h, (f - 1) / EN) : 0;
        A.pluck(tf, midi(60 + Math.round(step * 60)), { g: 0.06 + step * 0.3, bright: 0.5, dur: 0.5 });
      }
      A.kick(ECH.t0, 0.3, { f: 160, f2: 50 }); A.kick(ECH.t0 + ECH.dur, 0.34, { f: 160, f2: 50 });
      A.chord(ECH.t0 + ECH.dur, [60, 64, 67, 72], { type: 'triangle', dur: 1.6, g: 0.04, a: 0.04, lp: 2400, rev: 0.6, width: 0.8 });
    },
  });
})();
