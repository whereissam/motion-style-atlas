/* International lineage — seven films, in order of origin. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, font, rrect, roughPoly, grain, vignette, offscreen } = MG;
  const bump = (t, a, up, hold, down) => E.outX(seg(t, a, a + up)) * (1 - E.ioC(seg(t, a + up + hold, a + up + hold + down)));
  const flashAt = (t, times, k = 5) => times.reduce((m, L) => (t >= L ? Math.max(m, Math.exp(-(t - L) * k)) : m), 0);

  /* ============ 01 Visual Music — after John Whitney ============ */
  const WH_LOCKS = [2.6, 3.8, 4.9, 5.9, 7.0, 8.4];
  const WH_K = [8, 6, 5, 4, 3, 2];
  MG.film({
    id: 'whitney',
    poster: 9.5,
    fonts: ['300 40px Jost', '400 20px "JetBrains Mono"'],
    draw(c, t, W, H) {
      c.fillStyle = '#05060b';
      c.fillRect(0, 0, W, H);
      const N = 120, cx = W / 2, cy = H / 2 - 30, R = 450;
      const P = [[0, 1 / N], [1.2, 1 / N], ...WH_LOCKS.map((L, i) => [L, 1 / WH_K[i], E.ioC])];
      const flash = flashAt(t, WH_LOCKS, 4.5);
      const lineVis = seg(t, 0.5, 1.4);

      const glow = c.createRadialGradient(cx, cy, 0, cx, cy, 700);
      glow.addColorStop(0, `rgba(255,170,90,${0.06 + flash * 0.1})`);
      glow.addColorStop(1, 'rgba(255,170,90,0)');
      c.fillStyle = glow;
      c.fillRect(0, 0, W, H);

      const sample = tt => {
        const p = kf(tt, P);
        const rot = Math.PI * E.ioS(seg(tt, 1.2, 8.4));
        const intro = E.outX(seg(tt, 0.12, 1.1));
        const breathe = seg(tt, 1.2, 2) * (1 - seg(tt, 8.0, 8.4));
        const amp = 54 * E.outQ(seg(tt, 8.4, 8.8)) * Math.exp(-Math.max(0, tt - 8.8) * 1.25);
        const out = new Float32Array(N * 2);
        for (let i = 0; i < N; i++) {
          const r = R * (0.08 + 0.92 * (i + 1) / N) * intro * (1 + 0.035 * Math.sin(i * 0.21 + tt * 2.4) * breathe);
          const th = TAU * (i + 1) * p + rot;
          let x = cx + r * Math.cos(th), y = cy + r * Math.sin(th);
          if (amp > 0.01) y += amp * Math.sin((x - cx) * 0.021 - tt * 9) * (1 - Math.abs(x - cx) / (R * 1.4));
          out[i * 2] = x; out[i * 2 + 1] = y;
        }
        return { pts: out, p };
      };

      c.globalCompositeOperation = 'lighter';
      const trails = 12;
      let cur = null;
      for (let k = trails - 1; k >= 0; k--) {
        const tt = t - k * 0.022;
        if (tt < 0) continue;
        const s = sample(tt);
        if (k === 0) cur = s;
        const a = Math.pow(1 - k / trails, 2);
        c.lineWidth = 1.5;
        c.strokeStyle = `rgba(255,178,100,${0.2 * a * lineVis})`;
        c.beginPath();
        for (let i = 0; i < N; i++) i ? c.lineTo(s.pts[i * 2], s.pts[i * 2 + 1]) : c.moveTo(s.pts[0], s.pts[1]);
        c.stroke();
        if (k % 3 === 0 && k) {
          for (let i = 0; i < N; i += 2) {
            c.fillStyle = `hsla(${30 + 170 * i / N},90%,60%,${0.12 * a})`;
            c.fillRect(s.pts[i * 2] - 1.5, s.pts[i * 2 + 1] - 1.5, 3, 3);
          }
        }
      }
      if (!cur) cur = sample(Math.max(0, t));
      for (let i = 0; i < N; i++) {
        const x = cur.pts[i * 2], y = cur.pts[i * 2 + 1], h = 30 + 170 * i / N;
        c.fillStyle = `hsla(${h},95%,62%,${0.16 + flash * 0.2})`;
        c.beginPath(); c.arc(x, y, 9 + flash * 8, 0, TAU); c.fill();
        c.fillStyle = `hsla(${h},100%,${78 + flash * 15}%,1)`;
        c.beginPath(); c.arc(x, y, 2.6 + flash * 2.2, 0, TAU); c.fill();
      }
      if (t < 0.6) {
        const ig = E.outX(seg(t, 0, 0.15)) * (1 - seg(t, 0.2, 0.6));
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, 160);
        g.addColorStop(0, `rgba(255,236,200,${ig})`);
        g.addColorStop(1, 'rgba(255,236,200,0)');
        c.fillStyle = g;
        c.fillRect(cx - 200, cy - 200, 400, 400);
      }
      c.globalCompositeOperation = 'source-over';

      // instrument readout — the ratio the pattern is locking to
      const hud = 0.45 * seg(t, 1.2, 1.8) * (1 - seg(t, 8.4, 8.9));
      if (hud > 0) {
        let k = null;
        WH_LOCKS.forEach((L, i) => { if (t >= L - 0.05 && t < L + 0.45) k = WH_K[i]; });
        text(c, 'ω₁ : ω₂ : ω₃ : … = 1 : 2 : 3 : …', 96, 960, { font: '"JetBrains Mono", monospace', size: 20, color: `rgba(235,225,210,${hud})` });
        text(c, `p = ${cur.p.toFixed(4)}${k ? `   →  ${k}-fold` : ''}`, 96, 996, { font: '"JetBrains Mono", monospace', size: 20, color: k ? `rgba(255,190,110,${hud * 2})` : `rgba(235,225,210,${hud})` });
      }
      const ta = E.outC(seg(t, 8.75, 9.35));
      if (ta > 0) {
        text(c, 'VISUAL MUSIC', W / 2, cy + 190 + (1 - ta) * 14, { font: 'Jost, sans-serif', weight: 300, size: 50, ls: 26, align: 'center', color: `rgba(242,232,216,${ta})` });
        const sa = E.outC(seg(t, 9.05, 9.6));
        text(c, '视觉音乐  ·  DIFFERENTIAL MOTION  ·  AFTER JOHN WHITNEY, 1961', W / 2, cy + 242, { font: '"JetBrains Mono", monospace', size: 17, ls: 3, align: 'center', color: `rgba(242,232,216,${sa * 0.5})` });
      }
      grain(c, W, H, t, 0.05, 'screen');
      vignette(c, W, H, 0.6);
    },
    score(A) {
      A.osc(0.05, { f: 55, dur: 9.9, g: 0.14, a: 2.2, hold: true, rel: 1.2, rev: 0.3 });
      A.osc(0.05, { f: 82.41, dur: 9.9, g: 0.06, a: 3, hold: true, rel: 1.2, rev: 0.4 });
      A.osc(0.05, { f: 110, dur: 9.9, g: 0.03, a: 4, hold: true, rel: 1.2, type: 'triangle', rev: 0.4 });
      A.bell(0.12, midi(93), { g: 0.07, dur: 1.6 });
      A.whoosh(0.05, 1.1, { f1: 3000, f2: 300, g: 0.07, swell: 0.2 });
      const notes = [69, 72, 74, 76, 79, 81];
      WH_LOCKS.forEach((L, i) => {
        A.bell(L, midi(notes[i]), { g: 0.15, dur: 3.2, pan: (i % 2 ? 0.35 : -0.35) });
        A.bell(L, midi(notes[i] - 12), { g: 0.06, dur: 3, ratios: [1, 2, 3] });
        if (i) A.osc(WH_LOCKS[i - 1] + 0.12, { f: midi(notes[i - 1] + 12), f2: midi(notes[i] + 12), glide: L - WH_LOCKS[i - 1] - 0.12, dur: L - WH_LOCKS[i - 1], g: 0.02, a: 0.5, rev: 0.6 });
      });
      A.osc(1.2, { f: midi(81), f2: midi(69), glide: 1.4, dur: 1.4, g: 0.02, a: 0.5, rev: 0.6 });
      A.chord(8.4, [45, 57, 64, 69, 73, 76], { type: 'sine', dur: 1.55, g: 0.05, a: 0.03, rev: 0.7, width: 1.2 });
      for (let k = 0; k < 6; k++) A.osc(8.5 + k * 0.22, { f: midi(88 - k * 2), dur: 0.5, g: 0.03 * (1 - k / 7), rev: 0.6, pan: k % 2 ? 0.5 : -0.5 });
    },
  });

  /* ============ 02 Modernist cut-paper — after Saul Bass ============ */
  const BS = { blk: '#15120f', crm: '#ece2cc', red: '#d4431e', och: '#e2a23a' };
  const BARS = [
    { x: 180, h: 620, top: true, t: 0.25 }, { x: 330, h: 860, top: false, t: 0.5 }, { x: 560, h: 500, top: true, t: 0.75 },
    { x: 720, h: 740, top: false, t: 1.0 }, { x: 940, h: 1080, top: true, t: 1.25 }, { x: 1150, h: 560, top: false, t: 1.5 },
    { x: 1300, h: 820, top: true, t: 1.75 }, { x: 1520, h: 640, top: false, t: 2.0 }, { x: 1690, h: 900, top: true, t: 2.25 },
  ];
  const ARM = [[-1500, -70], [-40, -82], [28, -150], [64, -96], [118, -176], [146, -102], [214, -150], [206, -66], [298, -88], [232, -8], [306, 22], [206, 44], [152, 92], [58, 64], [-40, 76], [-1500, 84]];
  function bassEye(c, cx, cy, open, px, seed) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24, x = cx - 470 + 940 * u;
      pts.push([x, cy - Math.sin(Math.PI * u) * 300 * open]);
    }
    for (let i = 23; i > 0; i--) {
      const u = i / 24, x = cx - 470 + 940 * u;
      pts.push([x, cy + Math.sin(Math.PI * u) * 260 * open]);
    }
    c.save();
    roughPoly(c, pts, seed, 3, 30);
    c.fillStyle = BS.crm; c.fill();
    c.clip();
    roughPoly(c, circlePts(cx + px, cy, 190, 36), seed + 1, 3);
    c.fillStyle = BS.och; c.fill();
    roughPoly(c, circlePts(cx + px, cy, 118, 30), seed + 2, 2.5);
    c.fillStyle = BS.blk; c.fill();
    roughPoly(c, circlePts(cx + px - 44, cy - 50, 26, 12), seed + 3, 1.5);
    c.fillStyle = BS.crm; c.fill();
    c.restore();
  }
  function circlePts(x, y, r, n) {
    const p = [];
    for (let i = 0; i < n; i++) p.push([x + r * Math.cos(i / n * TAU), y + r * Math.sin(i / n * TAU)]);
    return p;
  }
  MG.film({
    id: 'bass',
    poster: 9.6,
    fonts: ['400 300px Anton'],
    draw(c, t, W, H) {
      const f = Math.floor(t * 24);
      c.fillStyle = BS.blk;
      c.fillRect(0, 0, W, H);
      c.save();
      c.translate(vnoise(t * 4, 1) * 2.2, vnoise(t * 4, 2) * 2.2); // gate weave
      if (t < 5.5) {
        // A — bars fall on the bass line, then gather into a staircase
        const conv = E.ioX(seg(t, 2.55, 2.95));
        BARS.forEach((b, k) => {
          const inn = E.outX(seg(t, b.t, b.t + 0.32));
          if (inn <= 0) return;
          let y0 = b.top ? 0 : H - b.h, y1 = b.top ? b.h : H;
          const off = (1 - inn) * b.h * (b.top ? -1 : 1);
          y0 += off; y1 += off;
          const fx = 150 + k * 66, fh = 250 + k * 64;
          const x = lerp(b.x, fx, conv), w = lerp(46, 40, conv);
          y0 = lerp(y0, H - fh, conv); y1 = lerp(y1, H + 4, conv);
          const lift = t > 3 ? Math.sin(Math.max(0, t - 3) * 2 + k * 0.7) * 10 * seg(t, 3, 3.5) : 0;
          roughPoly(c, [[x, y0 + lift], [x + w, y0 + lift], [x + w, y1], [x, y1]], 10 + k, 2.2, 40);
          c.fillStyle = BS.crm; c.fill();
        });
        // B — the sun, then the arm
        const sun = E.outB(seg(t, 3.0, 3.38), 1.4);
        if (sun > 0) {
          roughPoly(c, circlePts(1270, 470, 300 * sun, 64), 3, 3.5);
          c.fillStyle = BS.red; c.fill();
        }
        const thrust = E.outX(seg(t, 4.0, 4.32));
        if (thrust > 0) {
          const shake = Math.sin((t - 4.32) * 60) * 6 * Math.exp(-Math.max(0, t - 4.32) * 9) * (t > 4.32 ? 1 : 0);
          const ang = -0.55, d = (1 - thrust) * 1500 - shake;
          c.save();
          c.translate(930 - Math.cos(ang) * d, 640 - Math.sin(ang) * d);
          c.rotate(ang + Math.sin(t * 1.3) * 0.01);
          roughPoly(c, ARM, 21, 3, 30);
          c.fillStyle = BS.crm; c.fill();
          c.restore();
        }
        if (t >= 4.6) {
          const a = seg(t, 4.6, 4.7);
          text(c, 'A SAUL BASS-STYLE STUDY', 1270, 860, { font: 'Anton, sans-serif', size: 30, ls: 10, align: 'center', color: `rgba(236,226,204,${a})` });
        }
      } else if (t < 8.0) {
        // C — hard cut to red: the eye
        c.fillStyle = BS.red;
        c.fillRect(-20, -20, W + 40, H + 40);
        const open = kf(t, [[5.5, 0.02], [5.78, 1, E.outB], [6.86, 1], [6.94, 0.04, E.inQ], [7.05, 1, E.outQ]]);
        const px = kf(t, [[5.5, 0], [5.92, 0], [5.98, -170, E.outX], [6.42, -170], [6.48, 170, E.outX], [7.12, 170], [7.18, 0, E.outX]]);
        const barIn = E.outX(seg(t, 5.5, 5.8));
        roughPoly(c, [[-40 + (1 - barIn) * -2000, 110], [W + 40 + (1 - barIn) * -2000, 110], [W + 40 + (1 - barIn) * -2000, 160], [-40 + (1 - barIn) * -2000, 160]], 31, 2.5, 40);
        c.fillStyle = BS.blk; c.fill();
        roughPoly(c, [[-40 + (1 - barIn) * 2000, 920], [W + 40 + (1 - barIn) * 2000, 920], [W + 40 + (1 - barIn) * 2000, 970], [-40 + (1 - barIn) * 2000, 970]], 32, 2.5, 40);
        c.fill();
        const slats = 6, sh = H / slats;
        for (let j = 0; j < slats; j++) {
          const dx = (j % 2 ? 1 : -1) * E.inX(seg(t, 7.42 + j * 0.035, 7.82 + j * 0.035)) * 2200;
          c.save();
          c.beginPath(); c.rect(-20, j * sh, W + 40, sh + 1); c.clip();
          c.translate(dx, 0);
          bassEye(c, W / 2, H / 2, open, px, 40);
          c.restore();
        }
      } else {
        // D — title card, letters stamped one by one
        c.fillStyle = BS.crm;
        c.fillRect(-20, -20, W + 40, H + 40);
        const bl = E.outX(seg(t, 8.0, 8.3));
        roughPoly(c, [[-20 - (1 - bl) * 700, -20], [640 - (1 - bl) * 700, -20], [590 - (1 - bl) * 700, 150], [-20 - (1 - bl) * 700, 182]], 51, 3);
        c.fillStyle = BS.blk; c.fill();
        roughPoly(c, [[W + 20 + (1 - bl) * 700, H + 20], [1300 + (1 - bl) * 700, H + 20], [1360 + (1 - bl) * 700, 930], [W + 20 + (1 - bl) * 700, 905]], 52, 3);
        c.fill();
        const word = 'THE CUT', size = 330;
        font(c, size, 'Anton, sans-serif');
        const ws = [...word].map(ch => c.measureText(ch).width + 10);
        let x = W / 2 - ws.reduce((a, b) => a + b, 0) / 2;
        [...word].forEach((ch, i) => {
          const ti = 8.06 + i * 0.09;
          if (ch !== ' ' && t >= ti) {
            const s = lerp(1.45, 1, E.outQt(seg(t, ti, ti + 0.13)));
            c.save();
            c.translate(x + ws[i] / 2, 640 + (hash(i + 3) - 0.5) * 14);
            c.rotate((hash(i + 9) - 0.5) * 0.08);
            c.scale(s, s);
            text(c, ch, 0, 0, { font: 'Anton, sans-serif', size, align: 'center', color: i >= 4 ? BS.red : BS.blk });
            c.restore();
          }
          x += ws[i];
        });
        const rb = E.outX(seg(t, 8.78, 9.12));
        if (rb > 0) { roughPoly(c, [[560, 690], [560 + 800 * rb, 684], [560 + 800 * rb, 722], [560, 728]], 61, 2.5); c.fillStyle = BS.blk; c.fill(); }
        if (f % 1 === 0 && t >= 8.62) text(c, 'A  FILM  IN  PAPER', W / 2, 330, { font: 'Anton, sans-serif', size: 36, ls: 14, align: 'center', color: BS.blk });
        if (t >= 9.0) text(c, 'MCMLV', W / 2, 800, { font: 'Anton, sans-serif', size: 34, ls: 22, align: 'center', color: BS.blk });
      }
      c.restore();
      // dust and grain
      const r = rng(f * 7 + 1);
      c.fillStyle = t >= 8 ? 'rgba(20,16,12,0.5)' : 'rgba(236,226,204,0.35)';
      for (let i = 0; i < 6; i++) { const s = 1 + r() * 3; c.fillRect(r() * W, r() * H, s, s * (0.6 + r())); }
      if (r() > 0.7) { c.fillRect(r() * W, 0, 1.2, H); }
      grain(c, W, H, t, 0.09);
      vignette(c, W, H, 0.42, '20,12,6');
    },
    score(A) {
      const beat = 0.5;
      const line = [40, 43, 45, 46, 47, 50, 52, 50, 40, 43, 45, 47, 48, 47, 45, 43, 40, 47, 45, 43];
      for (let k = 0; k < 19; k++) {
        const t = 0.25 + k * beat;
        if (t > 9.3) break;
        A.pluck(t, midi(line[k]), { dur: 0.95, bright: 0.32, decay: 0.993, g: 0.75, lp: 1100 });
        A.noise(t + beat * 0.66, { type: 'highpass', f: 7000, dur: 0.05, g: 0.05, pan: 0.3 });
        A.noise(t, { type: 'highpass', f: 6500, dur: k % 2 ? 0.08 : 0.22, g: 0.06, pan: 0.3 });
      }
      BARS.forEach(b => A.noise(b.t, { type: 'bandpass', f: 3200, q: 5, dur: 0.035, g: 0.28, pan: (b.x / 1920 - 0.5) }));
      const stab = (t, notes, o = {}) => A.chord(t, notes, { type: 'sawtooth', dur: o.dur || 0.32, g: o.g || 0.055, lp: 3600, lp2: o.lp2 || 500, lpT: o.dur || 0.3, a: 0.008, spread: 9, rev: 0.25, width: 1 });
      stab(3.0, [52, 56, 59, 62]);
      stab(4.0, [53, 57, 60, 63, 67], { g: 0.07, dur: 0.6, lp2: 300 });
      A.noise(4.0, { type: 'highpass', f: 4000, dur: 1.2, g: 0.1, rev: 0.3 });
      A.kick(3.0, 0.4); A.kick(4.0, 0.55); A.kick(5.0, 0.4);
      stab(5.5, [50, 54, 57, 61], { g: 0.07 });
      A.noise(5.5, { type: 'highpass', f: 5000, dur: 1.6, g: 0.12, rev: 0.4 });
      [5.98, 6.48, 7.18].forEach(t => A.noise(t, { type: 'bandpass', f: 1800, q: 6, dur: 0.04, g: 0.25 }));
      A.osc(6.9, { f: 900, f2: 300, dur: 0.12, g: 0.08, type: 'triangle' });
      for (let j = 0; j < 6; j++) A.whoosh(7.45 + j * 0.035, 0.3, { f1: 800, f2: 3000, g: 0.05, pan: j % 2 ? 0.6 : -0.6 });
      stab(8.0, [52, 55, 59, 62, 66], { g: 0.06 });
      'THE CUT'.split('').forEach((ch, i) => { if (ch !== ' ') A.osc(8.06 + i * 0.09, { f: 700 + i * 40, f2: 240, dur: 0.07, g: 0.14, type: 'triangle' }); });
      A.chord(8.85, [40, 52, 55, 59, 62, 66], { type: 'sawtooth', dur: 1.1, g: 0.05, lp: 2600, lp2: 400, lpT: 1.0, a: 0.01, spread: 10, rev: 0.4, width: 1 });
      A.chord(8.85, [64, 71], { type: 'sawtooth', f2: 0, dur: 1.1, g: 0.03, lp: 3000, rev: 0.4 });
      A.osc(9.2, { f: midi(64), f2: midi(52), glide: 0.7, dur: 0.75, g: 0.05, type: 'sawtooth', lp: 1800, rev: 0.4 });
    },
  });

  /* ============ 03 Swiss / kinetic typography ============ */
  const SW = { pap: '#f2f0ea', ink: '#111111', red: '#e2231a' };
  const colX = i => 96 + i * 146;
  const ARCH = 'Archivo, "Helvetica Neue", Arial, sans-serif';
  function swissGrid(c, t, H, color, prog = 1) {
    c.strokeStyle = color;
    c.lineWidth = 1;
    for (let i = 0; i <= 12; i++) {
      const p = E.outC(seg(prog, i * 0.03, i * 0.03 + 0.6));
      [colX(i) - 24, colX(i) - 2].forEach(x => {
        if (i === 0 && x < colX(0) - 2) return;
        if (i === 12 && x > colX(12) - 24) return;
        c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H * p); c.stroke();
      });
    }
  }
  MG.film({
    id: 'swiss',
    poster: 9.6,
    fonts: ['900 300px Archivo', '400 30px Archivo'],
    draw(c, t, W, H) {
      const beat = 0.5;
      if (t < 4.0) {
        c.fillStyle = SW.pap; c.fillRect(0, 0, W, H);
        swissGrid(c, t, H, 'rgba(17,17,17,0.10)', seg(t, 0, 0.9));
        const sq = E.outB(seg(t, 0.5, 0.82), 1.2);
        c.fillStyle = SW.red;
        c.fillRect(colX(0), lerp(-240, 96, sq), 122, 122);
        text(c, t < 2.5 ? '01 / 04' : '02 / 04', colX(12) - 24, 120, { font: ARCH, size: 22, weight: 400, align: 'right', color: SW.ink });
        // FORM — letters pushed up through a mask
        if (t < 2.8) {
          const size = 410;
          font(c, size, ARCH, 900);
          const word = 'FORM';
          c.save();
          c.beginPath(); c.rect(0, 330, W, 330); c.clip();
          let x = colX(0) - 14;
          [...word].forEach((ch, i) => {
            const a = 0.8 + i * 0.07, inn = E.outX(seg(t, a, a + 0.5)), out = E.inX(seg(t, 2.38 + i * 0.04, 2.7 + i * 0.04));
            text(c, ch, x, 650 + (1 - inn) * 340 - out * 340, { font: ARCH, weight: 900, size, ls: -10, color: SW.ink });
            x += c.measureText(ch).width - 18;
          });
          c.restore();
        }
        if (t >= 2.5) {
          // FOLLOWS — set vertically up the right edge
          c.save();
          c.translate(colX(11) + 110, 1000);
          c.rotate(-Math.PI / 2);
          c.beginPath(); c.rect(-10, -205, 1000, 220); c.clip();
          const size = 214;
          font(c, size, ARCH, 900);
          let x = 0;
          [...'FOLLOWS'].forEach((ch, i) => {
            const a = 2.5 + i * 0.045, inn = E.outX(seg(t, a, a + 0.45));
            text(c, ch, x, (1 - inn) * 230, { font: ARCH, weight: 900, size, color: SW.ink });
            x += c.measureText(ch).width - 6;
          });
          c.restore();
          const lines = ['Josef Müller-Brockmann', 'Rastersysteme für die', 'visuelle Gestaltung, 1981'];
          const chars = Math.floor(seg(t, 2.6, 3.3) * 70);
          let used = 0;
          lines.forEach((ln, i) => {
            const n = clamp(chars - used, 0, ln.length);
            used += ln.length;
            text(c, ln.slice(0, n), colX(0), 330 + i * 38, { font: ARCH, size: 28, weight: i ? 400 : 800, color: SW.ink });
          });
          const grow = E.ioX(seg(t, 2.62, 3.0)), shrink = E.ioX(seg(t, 3.55, 3.9));
          c.fillStyle = SW.red;
          c.fillRect(W * shrink, 742, W * (grow - shrink), 34);
          text(c, '“Form follows function.”  — L. Sullivan, 1896', colX(0), 860, { font: ARCH, size: 26, weight: 400, color: `rgba(17,17,17,${seg(t, 3.0, 3.2)})` });
        }
      } else if (t < 6.0) {
        // MOTION — inverted, letters spring open from the centre out
        c.fillStyle = SW.ink; c.fillRect(0, 0, W, H);
        swissGrid(c, t, H, 'rgba(242,240,234,0.07)');
        text(c, '03 / 04', colX(12) - 24, 120, { font: ARCH, size: 22, align: 'right', color: SW.pap });
        const size = 372, word = 'MOTION';
        font(c, size, ARCH, 900);
        const ws = [...word].map(ch => c.measureText(ch).width - 8);
        const total = ws.reduce((a, b) => a + b, 0);
        const drawWord = () => {
          let x = W / 2 - total / 2;
          [...word].forEach((ch, i) => {
            const d = Math.abs(i - 2.5), sx = spring(t - 4.0 - d * 0.07, 2.4, 0.42);
            c.save();
            c.translate(x + ws[i] / 2, 690);
            c.scale(Math.max(0.001, sx), 1);
            text(c, ch, 0, 0, { font: ARCH, weight: 900, size, align: 'center', color: SW.pap });
            c.restore();
            if (i === 4) {
              const dot = spring(t - 4.65, 2.8, 0.35);
              if (dot > 0) { c.fillStyle = SW.red; c.beginPath(); c.arc(x + ws[i] / 2, 690 - 133, 62 * Math.max(0, dot), 0, TAU); c.fill(); }
            }
            x += ws[i];
          });
        };
        const slices = 6;
        for (let j = 0; j < slices; j++) {
          const y0 = 400 + j * 50;
          const dx = (j % 2 ? 1 : -1) * 90 * (bump(t, 5.0, 0.08, 0.12, 0.16) - bump(t, 5.5, 0.08, 0.12, 0.16));
          c.save();
          c.beginPath(); c.rect(0, j === 0 ? 0 : y0, W, j === slices - 1 ? H : 50); c.clip();
          c.translate(dx, 0);
          drawWord();
          c.restore();
        }
        text(c, 'form → motion', colX(0), 960, { font: ARCH, size: 26, color: `rgba(242,240,234,${seg(t, 4.4, 4.6) * 0.7})` });
      } else if (t < 8.1) {
        // marquee rows stepping on the beat
        c.fillStyle = SW.pap; c.fillRect(0, 0, W, H);
        const size = 94, unit = 'FORM FOLLOWS MOTION — ';
        font(c, size, ARCH, 900);
        const u = c.measureText(unit).width;
        const b = (t - 6.0) / beat, n = Math.floor(b), fr = E.outX(clamp((b - n) / 0.36));
        const pos = n + fr;
        for (let r = 0; r < 9; r++) {
          const y = 150 + r * 108, dir = r % 2 ? 1 : -1;
          const exit = E.inX(seg(t, 7.82 + r * 0.025, 8.08 + r * 0.025)) * 2400 * dir;
          let off = ((dir * pos * 230 + r * 157) % u + u) % u;
          if (r === 4) { c.fillStyle = SW.ink; c.fillRect(exit, y - 86, W, 108); }
          const col = r === 4 ? SW.pap : r === 6 ? SW.red : SW.ink;
          for (let x = -off - u; x < W + u; x += u) text(c, unit, x + exit, y, { font: ARCH, weight: 900, size, color: col });
        }
      } else {
        // final poster
        c.fillStyle = SW.pap; c.fillRect(0, 0, W, H);
        swissGrid(c, t, H, 'rgba(17,17,17,0.08)');
        const circ = E.outB(seg(t, 8.45, 8.85), 1.3);
        if (circ > 0) { c.fillStyle = SW.red; c.beginPath(); c.arc(1540, 470, 300 * circ, 0, TAU); c.fill(); }
        ['form', 'follows', 'motion.'].forEach((w, i) => {
          const base = 330 + i * 190;
          const s = E.outX(seg(t, 8.1 + i * 0.08, 8.55 + i * 0.08));
          c.save();
          c.beginPath(); c.rect(0, base - 170, W, 210); c.clip();
          text(c, w, colX(0) - 8 - (1 - s) * 1300, base, { font: ARCH, weight: 900, size: 200, ls: -8, color: SW.ink });
          c.restore();
        });
        const rule = E.ioX(seg(t, 8.6, 9.0));
        c.fillStyle = SW.ink;
        c.fillRect(colX(0), 880, (colX(12) - 24 - colX(0)) * rule, 3);
        [['Zürich, 1959', 0], ['12-column grid', 3], ['Archivo 900 / 400', 6], ['00:10:00', 9]].forEach(([s, col], i) => {
          if (t >= 8.85 + i * 0.07) text(c, s, colX(col), 930, { font: ARCH, size: 24, weight: i === 3 ? 800 : 400, color: SW.ink });
        });
      }
    },
    score(A) {
      for (let k = 0; k < 12; k++) A.osc(k * 0.065, { f: 2400 + k * 60, dur: 0.02, g: 0.04, type: 'square', lp: 5000 });
      A.osc(0.82, { f: 180, f2: 70, dur: 0.18, g: 0.35 });
      A.noise(0.82, { type: 'bandpass', f: 900, dur: 0.06, g: 0.15 });
      for (let b = 1; b < 20; b++) {
        const t = b * 0.5;
        if (t === 4.0 || t === 8.0) continue;
        if (t < 4 || (t >= 6 && t < 8) || t > 8) A.kick(t, 0.55, { f2: 48 });
        if (t >= 2) A.hat(t + 0.25, 0.07);
        if (t >= 6 && t < 8) { A.whoosh(t, 0.22, { f1: 1500, f2: 5000, g: 0.06, swell: 0.3, pan: b % 2 ? 0.5 : -0.5 }); A.osc(t, { f: 1600, dur: 0.03, g: 0.05, type: 'square', lp: 4000 }); }
      }
      'FORM'.split('').forEach((_, i) => A.osc(0.8 + i * 0.07, { f: 2000 - i * 120, dur: 0.03, g: 0.08, type: 'square', lp: 4000 }));
      'FOLLOWS'.split('').forEach((_, i) => A.osc(2.5 + i * 0.045, { f: 1500 + i * 90, dur: 0.025, g: 0.06, type: 'square', lp: 4000 }));
      for (let i = 0; i < 22; i++) A.noise(2.6 + i * 0.032, { type: 'bandpass', f: 4000, q: 3, dur: 0.012, g: 0.06 });
      A.osc(2.5, { type: 'triangle', f: 55, dur: 1.4, g: 0.12 });
      A.impact(4.0, 0.7);
      A.kick(4.0, 0.9);
      A.chord(4.0, [38, 45, 50], { type: 'sawtooth', dur: 1.8, g: 0.04, lp: 300, lp2: 2000, lpT: 1.6, a: 0.05, rev: 0.3 });
      [5.0, 5.5].forEach(t => A.noise(t, { type: 'highpass', f: 2500, dur: 0.12, g: 0.15, crush: true }));
      A.osc(4.65, { f: 880, dur: 0.4, g: 0.08, rev: 0.4 });
      A.whoosh(7.82, 0.35, { f1: 600, f2: 4000, g: 0.12 });
      A.kick(8.1, 0.7);
      A.bell(8.5, midi(88), { g: 0.08, dur: 1.4 });
      A.osc(8.6, { f: midi(76), dur: 1.4, g: 0.06, rev: 0.4 });
      A.osc(8.6, { f: midi(83), dur: 1.4, g: 0.04, rev: 0.4 });
      [0, 1, 2, 3].forEach(i => A.osc(8.85 + i * 0.07, { f: 2200, dur: 0.02, g: 0.05, type: 'square', lp: 5000 }));
    },
  });

  /* ============ 04 Retrowave — 80s chrome ============ */
  const RW = { hz: 640 };
  function retroScene(c, t, W, H, st, o) {
    const hz = RW.hz;
    const sky = c.createLinearGradient(0, 0, 0, hz);
    sky.addColorStop(0, '#07021c'); sky.addColorStop(0.55, '#2a0a50'); sky.addColorStop(1, '#ff3a7c');
    c.fillStyle = sky; c.fillRect(0, 0, W, hz);
    st.stars.forEach((s, i) => {
      c.fillStyle = `rgba(255,240,255,${(0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.tw + i))) * o.vis})`;
      c.fillRect(s.x, s.y, s.r, s.r);
    });
    // sun with scrolling stripe cuts
    const sc = st.sun, g = sc.getContext('2d');
    g.clearRect(0, 0, 700, 700);
    g.globalCompositeOperation = 'source-over';
    const sg = g.createLinearGradient(0, 50, 0, 650);
    sg.addColorStop(0, '#fff27a'); sg.addColorStop(0.45, '#ff9b3d'); sg.addColorStop(1, '#ff2a8a');
    g.fillStyle = sg; g.beginPath(); g.arc(350, 350, 300, 0, TAU); g.fill();
    g.globalCompositeOperation = 'destination-out';
    for (let k = 0; k < 10; k++) {
      const y = 360 + k * 34 - ((t * 22) % 34);
      g.fillRect(0, y, 700, 3 + Math.max(0, (y - 350) / 300) * 16);
    }
    const halo = c.createRadialGradient(W / 2, o.sunY, 100, W / 2, o.sunY, 620);
    halo.addColorStop(0, `rgba(255,80,160,${0.45 * o.vis})`); halo.addColorStop(1, 'rgba(255,80,160,0)');
    c.fillStyle = halo; c.fillRect(0, 0, W, hz);
    c.globalAlpha = o.vis;
    c.drawImage(sc, W / 2 - 350, o.sunY - 350);
    c.globalAlpha = 1;
    // mountains
    st.mtn.forEach((m, li) => {
      c.beginPath(); c.moveTo(0, hz);
      m.forEach(([x, y]) => c.lineTo(x, hz - y));
      c.lineTo(W, hz); c.closePath();
      c.fillStyle = li ? '#16052e' : '#0d0322'; c.fill();
      c.strokeStyle = `rgba(255,60,140,${(li ? 0.5 : 0.8) * o.vis})`; c.lineWidth = 2; c.stroke();
    });
    // floor + grid
    const fl = c.createLinearGradient(0, hz, 0, H);
    fl.addColorStop(0, '#1b0536'); fl.addColorStop(1, '#030006');
    c.fillStyle = fl; c.fillRect(0, hz, W, H - hz);
    const ph = (t * o.speed) % 1;
    const lines = () => {
      c.beginPath();
      for (let i = -26; i <= 26; i++) { c.moveTo(W / 2, hz); c.lineTo(W / 2 + i * 240, H + 400); }
      for (let k = 0; k < 34; k++) {
        const z = k + 1 - ph, y = hz + 360 / (z * 0.85);
        if (y > H + 4) continue;
        c.moveTo(0, y); c.lineTo(W, y);
      }
    };
    c.save();
    c.beginPath(); c.rect(0, hz, W, H - hz); c.clip();
    lines();
    c.strokeStyle = `rgba(255,42,140,${0.18 * o.vis})`; c.lineWidth = 7; c.stroke();
    c.strokeStyle = `rgba(255,90,190,${0.9 * o.vis})`; c.lineWidth = 2; c.stroke();
    const fade = c.createLinearGradient(0, hz, 0, hz + 160);
    fade.addColorStop(0, 'rgba(27,5,54,1)'); fade.addColorStop(1, 'rgba(27,5,54,0)');
    c.fillStyle = fade; c.fillRect(0, hz, W, 160);
    c.restore();
    const hl = c.createLinearGradient(0, hz - 30, 0, hz + 30);
    hl.addColorStop(0, 'rgba(255,120,200,0)'); hl.addColorStop(0.5, `rgba(255,180,230,${0.9 * o.vis})`); hl.addColorStop(1, 'rgba(255,120,200,0)');
    c.fillStyle = hl; c.fillRect(0, hz - 30, W * o.line, 60);
    c.fillRect(W - W * o.line, hz - 30, W * o.line, 60);
  }
  function retroLayout(c) {
    font(c, 200, '"Playfair Display", serif', 900);
    const out = [];
    [['NIGHT', 330], ['DRIVE', 530]].forEach(([w, y], li) => {
      const ws = [...w].map(ch => c.measureText(ch).width + 12);
      let x = 960 - ws.reduce((a, b) => a + b, 0) / 2;
      [...w].forEach((ch, i) => { out.push({ ch, x: x + ws[i] / 2, y, li, i }); x += ws[i]; });
    });
    return out;
  }
  function vhsBand(c, W, H, t, at) {
    const a = 1 - seg(t, at, at + 0.35);
    if (t < at || a <= 0) return;
    const r = rng(Math.floor(t * 30));
    const y = lerp(H, -100, seg(t, at, at + 0.35));
    for (let i = 0; i < 40; i++) {
      c.fillStyle = `rgba(255,255,255,${r() * 0.5 * a})`;
      c.fillRect(r() * W, y + r() * 90, 40 + r() * 400, 2);
    }
  }
  MG.film({
    id: 'retro',
    poster: 9.3,
    fonts: ['900 200px "Playfair Display"', '400 150px "Mr Dafoe"', '400 40px VT323'],
    setup() {
      const r = rng(5);
      const stars = Array.from({ length: 150 }, () => ({ x: r() * 1920, y: r() * 520, r: r() < 0.1 ? 3 : 1.6, tw: 1 + r() * 4 }));
      const mtn = [0, 1].map(li => {
        const pts = [];
        for (let x = 0; x <= 1920; x += 60) {
          const edge = Math.pow(Math.abs(x - 960) / 960, 1.6);
          pts.push([x, (li ? 60 : 30) + edge * (li ? 260 : 170) * (0.6 + 0.4 * r()) + (li ? 0 : r() * 30)]);
        }
        return pts;
      });
      return { stars, mtn, sun: offscreen(700, 700) };
    },
    draw(c, t, W, H, st) {
      if (t < 3.5 || t >= 6.5) {
        const p3 = t >= 6.5;
        const sunY = p3 ? RW.hz - 70 : lerp(RW.hz + 330, RW.hz - 70, E.outC(seg(t, 0.4, 3.4)));
        c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
        retroScene(c, t, W, H, st, { sunY, speed: p3 ? 1.6 : 1.1, vis: p3 ? 1 : E.outC(seg(t, 0.25, 1.1)), line: p3 ? 1 : E.outX(seg(t, 0, 0.45)) * 0.5 });
        if (!p3 && t > 0.3 && t < 3.0 && Math.floor(t * 2) % 2 === 0) text(c, 'PLAY ▶', 90, 120, { font: 'VT323, monospace', size: 64, color: '#ffffff' });
        if (!p3 && t > 0.3) text(c, `SP  0:00:0${Math.floor(t)}`, 90, H - 80, { font: 'VT323, monospace', size: 48, color: 'rgba(255,255,255,0.85)' });
        if (p3) {
          const lay = retroLayout(c);
          const land = lerp(1.07, 1, E.outC(seg(t, 6.5, 7.0)));
          c.save();
          c.translate(W / 2, 430); c.scale(land, land); c.translate(-W / 2, -430);
          lay.forEach(L => {
            const top = L.y - 160, ch = c.createLinearGradient(0, top, 0, L.y + 10);
            ch.addColorStop(0, '#0b1a4a'); ch.addColorStop(0.42, '#3fb0ff'); ch.addColorStop(0.5, '#ffffff');
            ch.addColorStop(0.53, '#2a0a3a'); ch.addColorStop(0.78, '#ff8f3a'); ch.addColorStop(1, '#fff4b8');
            c.save();
            c.shadowColor = 'rgba(255,40,160,0.9)'; c.shadowBlur = 40;
            text(c, L.ch, L.x, L.y, { font: '"Playfair Display", serif', weight: 900, size: 200, align: 'center', stroke: '#14072a', lw: 16, color: null });
            c.restore();
            text(c, L.ch, L.x, L.y, { font: '"Playfair Display", serif', weight: 900, size: 200, align: 'center', color: ch, stroke: 'rgba(255,255,255,0.85)', lw: 2.5 });
          });
          c.restore();
          // script word drawn on
          const wipe = E.ioC(seg(t, 7.0, 7.75));
          if (wipe > 0) {
            c.save();
            c.beginPath(); c.rect(1000, 450, 820 * wipe, 260); c.clip();
            c.translate(1260, 640); c.rotate(-0.13);
            c.shadowColor = '#ff2bd6'; c.shadowBlur = 30;
            text(c, 'Midnight', 0, 0, { font: '"Mr Dafoe", cursive', size: 170, align: 'center', color: '#ff7ae6' });
            c.shadowBlur = 0;
            text(c, 'Midnight', 0, 0, { font: '"Mr Dafoe", cursive', size: 170, align: 'center', color: '#ffe1fa', stroke: null });
            c.restore();
          }
          // lens flare streak, then a glint
          const fs = seg(t, 7.2, 7.9);
          if (fs > 0 && fs < 1) {
            const x = lerp(220, 1700, E.ioC(fs)), a = Math.sin(Math.PI * fs);
            c.save(); c.globalCompositeOperation = 'lighter';
            c.translate(x, 420); c.scale(9, 0.35);
            const fg = c.createRadialGradient(0, 0, 0, 0, 0, 120);
            fg.addColorStop(0, `rgba(255,255,255,${a})`); fg.addColorStop(0.3, `rgba(120,220,255,${0.5 * a})`); fg.addColorStop(1, 'rgba(120,220,255,0)');
            c.fillStyle = fg; c.beginPath(); c.arc(0, 0, 120, 0, TAU); c.fill();
            c.restore();
          }
          const gl = bump(t, 7.85, 0.12, 0.1, 0.5);
          if (gl > 0) {
            c.save(); c.globalCompositeOperation = 'lighter'; c.translate(1355, 205); c.rotate(t * 0.8);
            c.fillStyle = `rgba(255,255,255,${gl})`;
            [0, Math.PI / 2].forEach(r => { c.save(); c.rotate(r); c.beginPath(); c.moveTo(-90 * gl, 0); c.lineTo(0, -5); c.lineTo(90 * gl, 0); c.lineTo(0, 5); c.closePath(); c.fill(); c.restore(); });
            c.restore();
          }
          const fl = Math.exp(-(t - 6.5) * 9);
          c.fillStyle = `rgba(255,240,250,${fl})`; c.fillRect(0, 0, W, H);
        }
      } else {
        // neon letters in extreme close-up, sliding together
        c.fillStyle = '#060103'; c.fillRect(0, 0, W, H);
        const lay = retroLayout(c);
        const spread = lerp(0.55, 0, E.outC(seg(t, 3.5, 6.45)));
        let S, fx, fy;
        if (t < 4.5) { S = 5.2; fx = lerp(560, 680, seg(t, 3.5, 4.5)); fy = 260; }
        else if (t < 5.5) { S = 3.6; fx = lerp(1240, 1080, seg(t, 4.5, 5.5)); fy = 470; }
        else { const u = E.outC(seg(t, 5.5, 6.45)); S = lerp(1.8, 1, u); fx = 960; fy = lerp(380, 430, u); }
        c.save();
        c.translate(W / 2, H / 2); c.scale(S, S); c.translate(-fx, -fy);
        lay.forEach(L => {
          const x = L.x + (L.x - 960) * spread, y = L.y + (L.li ? 1 : -1) * 60 * spread;
          c.save();
          c.shadowColor = '#ff1a3c'; c.shadowBlur = 36;
          text(c, L.ch, x, y, { font: '"Playfair Display", serif', weight: 900, size: 200, align: 'center', color: null, stroke: '#ff2b46', lw: 4 });
          c.restore();
          text(c, L.ch, x, y, { font: '"Playfair Display", serif', weight: 900, size: 200, align: 'center', color: null, stroke: 'rgba(255,214,220,0.9)', lw: 1.2 });
        });
        const bars = E.outC(seg(t, 5.95, 6.45));
        if (bars > 0) {
          c.save(); c.shadowColor = '#ff1a3c'; c.shadowBlur = 24; c.strokeStyle = '#ff2b46'; c.lineWidth = 4;
          c.strokeRect(960 - 340 * bars, 140, 680 * bars, 12);
          c.strokeRect(960 - 340 * bars, 572, 680 * bars, 12);
          c.restore();
        }
        c.restore();
      }
      vhsBand(c, W, H, t, 3.5);
      vhsBand(c, W, H, t, 6.5);
      c.fillStyle = 'rgba(0,0,0,0.16)';
      for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1.5);
      grain(c, W, H, t, 0.05, 'screen');
      vignette(c, W, H, 0.55);
    },
    score(A) {
      A.chord(0.0, [45, 57, 60, 64], { type: 'sawtooth', dur: 3.6, g: 0.035, a: 1.4, hold: true, rel: 0.4, lp: 900, spread: 12, rev: 0.4, width: 1.2 });
      const arpA = [57, 60, 64, 69, 64, 60], arpF = [53, 57, 60, 65, 60, 57];
      for (let k = 0; k < 19; k++) {
        const t = 0.6 + k * 0.15, seq = t < 2.4 ? arpA : arpF;
        A.osc(t, { type: 'sawtooth', f: midi(seq[k % 6] + 12), dur: 0.14, g: 0.05, lp: lerp(600, 3000, k / 19), q: 4, rev: 0.25, pan: k % 2 ? 0.3 : -0.3 });
      }
      A.noise(3.5, { type: 'bandpass', f: 3000, q: 0.5, dur: 0.35, g: 0.12, crush: true });
      A.osc(3.5, { type: 'sawtooth', f: 180, f2: 60, dur: 0.3, g: 0.05, lp: 1200 });
      const st = [48, 52, 55, 59, 60, 59, 55, 52];
      for (let k = 0; k < 10; k++) {
        const t = 3.6 + k * 0.3;
        A.osc(t, { type: 'square', f: midi(36), dur: 0.26, g: 0.08, lp: 320 });
        A.osc(t, { type: 'sawtooth', f: midi(st[k % 8] + 12), dur: 0.28, g: 0.045, lp: 1700, q: 3, rev: 0.45, pan: k % 2 ? 0.4 : -0.4 });
      }
      A.chord(3.55, [36, 48, 55], { type: 'sawtooth', dur: 3, g: 0.025, a: 1, hold: true, rel: 0.3, lp: 500, spread: 10, rev: 0.4 });
      A.riser(5.0, 1.5, { g: 0.18 });
      A.impact(6.5, 0.8);
      A.noise(6.5, { type: 'highpass', f: 3000, dur: 2.2, g: 0.12, rev: 0.4 });
      const beat = 0.6;
      for (let b = 0; b < 6; b++) {
        const t = 6.5 + b * beat;
        A.kick(t, 0.75);
        if (b % 2) A.snare(t, 0.5, { gated: true, dur: 0.24, rev: 0.6, f: 1500 });
        A.hat(t + beat / 2, 0.06);
        A.osc(t, { type: 'sawtooth', f: midi(33), dur: 0.26, g: 0.1, lp: 500 });
        A.osc(t + beat / 2, { type: 'sawtooth', f: midi(45), dur: 0.26, g: 0.08, lp: 500 });
      }
      const arp3 = [69, 72, 76, 72];
      for (let k = 0; k < 22; k++) {
        const t = 6.5 + k * 0.15;
        if (t > 9.8) break;
        A.osc(t, { type: 'sawtooth', f: midi(arp3[k % 4] + (t > 8.3 ? -4 : 0)), dur: 0.13, g: 0.04, lp: 2600, q: 3, rev: 0.3, pan: k % 2 ? 0.35 : -0.35 });
      }
      A.chord(6.5, [57, 60, 64], { type: 'sawtooth', dur: 1.8, g: 0.03, a: 0.05, hold: true, rel: 0.2, lp: 1600, spread: 12, rev: 0.5, width: 1 });
      A.chord(8.3, [53, 57, 60, 65], { type: 'sawtooth', dur: 1.6, g: 0.03, a: 0.05, hold: true, rel: 0.6, lp: 1600, spread: 12, rev: 0.5, width: 1 });
      A.bell(7.88, midi(96), { g: 0.05, dur: 1 });
      A.noise(7.2, { type: 'bandpass', f: 1000, f2: 6000, q: 2, dur: 0.7, g: 0.06, swell: 0.5, pan: -0.5 });
    },
  });

  /* ============ 05 Glitch / datamosh ============ */
  const GL_BURSTS = [[2.0, 0.22, 0.6], [2.35, 0.1, 0.4], [2.9, 0.26, 0.8], [3.45, 0.14, 0.5], [3.72, 0.3, 1]];
  const BW = 960, BH = 540;
  function glitchSource(g, t) {
    g.fillStyle = '#050505'; g.fillRect(0, 0, BW, BH);
    const mono = '"JetBrains Mono", monospace';
    const word = t < 4 ? 'SIGNAL' : t < 7.5 ? 'LOST' : 'RE/CONNECT';
    const size = t < 4 ? 150 : t < 7.5 ? 190 : 104;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `800 ${size}px ${mono}`;
    g.fillStyle = '#f4f4f4';
    g.fillText(word, BW / 2, BH / 2 - 10);
    g.font = `400 16px ${mono}`;
    g.textAlign = 'left';
    const f = Math.floor(t * 24);
    g.fillText(`REC ●  00:00:${String(Math.floor(t)).padStart(2, '0')}:${String(f % 24).padStart(2, '0')}`, 28, 36);
    g.textAlign = 'right';
    g.fillText(t < 7.5 ? 'CH 03  ▮▮▮▯' : 'CH 03  ▮▮▮▮', BW - 28, 36);
    g.textAlign = 'center';
    g.fillText(t < 7.5 ? 'NO CARRIER' : 'ERR 0x00 — LINK OK', BW / 2, BH / 2 + 104);
    const bars = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
    bars.forEach((col, i) => { g.fillStyle = col; g.fillRect(28 + i * 30, BH - 46, 30, 18); });
    if (t < 2) { g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(0, (t * 300) % BH, BW, 18); }
  }
  MG.film({
    id: 'glitch',
    poster: 9.2,
    fonts: ['800 150px "JetBrains Mono"'],
    setup() {
      const mk = () => { const c = offscreen(BW, BH); return { c, g: c.getContext('2d') }; };
      return { S: mk(), O: mk(), T: mk(), O2: mk() };
    },
    draw(c, t, W, H, st) {
      const { S, O, T, O2 } = st;
      glitchSource(S.g, t);
      const f = Math.floor(t * 24), r = rng(f * 131 + 7);
      let gi = 0;
      GL_BURSTS.forEach(([a, d, amp]) => { if (t >= a && t < a + d) gi = Math.max(gi, amp * (0.6 + 0.4 * r())); });
      const melt = t >= 4 && t < 6 ? E.inQ(seg(t, 4, 6)) : 0;
      const storm = t >= 6 && t < 7.5 ? 1 : 0;
      if (storm) gi = 1;
      if (t >= 4 && t < 6 && r() < 0.25) gi = Math.max(gi, 0.35);
      const settle = t >= 7.5 ? Math.exp(-(t - 7.5) * 5) : 0;
      gi = Math.max(gi, settle);
      const persist = t >= 7.5 ? 11 : 0;
      // RGB split
      O.g.globalCompositeOperation = 'source-over';
      O.g.fillStyle = '#000'; O.g.fillRect(0, 0, BW, BH);
      const split = gi * 26 + persist;
      if (split > 0.5) {
        const chans = [['#ff0000', -1], ['#00ff00', 0], ['#0000ff', 1]];
        chans.forEach(([col, s], i) => {
          T.g.globalCompositeOperation = 'source-over';
          T.g.drawImage(S.c, 0, 0);
          T.g.globalCompositeOperation = 'multiply';
          T.g.fillStyle = t >= 7.5 ? ['#ff0050', '#ffffff', '#00f0ff'][i] : col;
          T.g.fillRect(0, 0, BW, BH);
          O.g.globalCompositeOperation = 'lighter';
          const dx = s * split * (t >= 7.5 ? 1 : 0.5 + r()), dy = s * gi * 6 * (r() - 0.5);
          if (t >= 7.5 && i === 1) return;
          O.g.drawImage(T.c, dx, dy);
        });
        if (t >= 7.5) { O.g.globalCompositeOperation = 'source-over'; O.g.drawImage(S.c, 0, 0); }
      } else {
        O.g.drawImage(S.c, 0, 0);
      }
      O.g.globalCompositeOperation = 'source-over';
      // slice displacement + macroblocks
      O2.g.drawImage(O.c, 0, 0);
      const slices = Math.floor(gi * 14);
      for (let i = 0; i < slices; i++) {
        const y = Math.floor(r() * BH), h = 2 + Math.floor(r() * 40), dx = (r() - 0.5) * 220 * gi;
        O2.g.drawImage(O.c, 0, y, BW, h, dx, y, BW, h);
        if (r() < 0.3) O2.g.drawImage(O.c, 0, y, BW, h, dx - BW * Math.sign(dx || 1), y, BW, h);
      }
      const blocks = Math.floor(gi * 18);
      for (let i = 0; i < blocks; i++) {
        const bw = 16 * (1 + Math.floor(r() * 5)), bh = 16 * (1 + Math.floor(r() * 3));
        const sx = Math.floor(r() * BW / 16) * 16, sy = Math.floor(r() * BH / 16) * 16;
        const dx = Math.floor(r() * BW / 16) * 16, dy = Math.floor(r() * BH / 16) * 16;
        O2.g.drawImage(O.c, sx, sy, bw, bh, dx, dy, bw, bh);
        if (r() < 0.35) { O2.g.globalCompositeOperation = 'difference'; O2.g.fillStyle = r() < 0.5 ? '#00ff66' : '#ff00cc'; O2.g.fillRect(dx, dy, bw, bh); O2.g.globalCompositeOperation = 'source-over'; }
      }
      // datamosh melt: rows smeared downward
      if (melt > 0) {
        for (let x = 0; x < BW; x += 3) {
          const n = vnoise(x * 0.02, 3) * 0.5 + 0.5;
          if (n < 0.35 - melt * 0.3) continue;
          const y0 = BH * (0.3 + 0.35 * vnoise(x * 0.013 + 10, 4) + 0.1);
          const len = melt * BH * (0.3 + n);
          O2.g.drawImage(O.c, x, y0, 3, 1, x, y0, 3, len);
        }
      }
      if (storm || (t >= 5.8 && t < 6)) {
        O2.g.globalAlpha = storm ? 0.75 : 0.3;
        O2.g.globalCompositeOperation = 'screen';
        const patC = MG._snow || (MG._snow = (() => { const cc = offscreen(BW, BH), gg = cc.getContext('2d'), d = gg.createImageData(BW, BH), rr = rng(5); for (let i = 0; i < d.data.length; i += 4) { const v = rr() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } gg.putImageData(d, 0, 0); return cc; })());
        O2.g.drawImage(patC, -Math.floor(r() * 200), -Math.floor(r() * 200), BW + 200, BH + 200);
        O2.g.globalAlpha = 1;
        O2.g.globalCompositeOperation = 'source-over';
        const by = ((t - 6) * 700) % (BH + 120) - 60;
        O2.g.fillStyle = 'rgba(255,255,255,0.18)'; O2.g.fillRect(0, by, BW, 50);
        const tear = Math.floor(r() * 4);
        for (let i = 0; i < tear; i++) { const y = r() * BH; O2.g.drawImage(O2.c, 0, y, BW, 30, (r() - 0.5) * 300, y, BW, 30); }
      }
      if (gi > 0.75 && r() < 0.35) { O2.g.globalCompositeOperation = 'difference'; O2.g.fillStyle = '#fff'; O2.g.fillRect(0, 0, BW, BH); O2.g.globalCompositeOperation = 'source-over'; }
      c.imageSmoothingEnabled = false;
      const roll = storm ? (r() - 0.5) * 30 : 0;
      c.drawImage(O2.c, 0, roll, W, H);
      c.imageSmoothingEnabled = true;
      c.fillStyle = 'rgba(0,0,0,0.25)';
      for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 2);
      vignette(c, W, H, 0.5);
    },
    score(A) {
      A.osc(0, { type: 'square', f: 50, dur: 9.9, g: 0.025, a: 0.3, hold: true, rel: 0.3, lp: 220 });
      A.osc(0, { type: 'sine', f: 100, dur: 9.9, g: 0.03, a: 0.3, hold: true, rel: 0.3 });
      A.osc(0.2, { f: 1000, dur: 1.5, g: 0.04, hold: true, rel: 0.02, a: 0.01 });
      GL_BURSTS.forEach(([t, d, amp], j) => {
        A.noise(t, { type: 'bandpass', f: 1200 + j * 700, q: 0.8, dur: d, g: 0.2 * amp + 0.06, crush: true, hold: true, rel: 0.01 });
        for (let k = 0; k * 0.035 < d; k++) A.osc(t + k * 0.035, { type: 'square', f: 200 + hash(j * 17 + k) * 2200, dur: 0.03, g: 0.05, crush: true, hold: true, rel: 0.005 });
      });
      A.osc(4.0, { type: 'sawtooth', f: 420, f2: 28, glide: 1.4, dur: 1.5, g: 0.09, lp: 2000, lp2: 200, lpT: 1.4 });
      A.osc(4.0, { f: 70, f2: 30, glide: 1.6, dur: 1.9, g: 0.35 });
      for (let k = 0; k < 14; k++) if (hash(k * 3.3) < 0.55) A.osc(4.0 + k * 0.14, { type: 'square', f: 3000 * hash(k), dur: 0.02, g: 0.04, crush: true, hold: true, rel: 0.005 });
      A.impact(6.0, 0.9);
      A.noise(6.0, { type: 'highpass', f: 1500, dur: 1.5, g: 0.13, hold: true, rel: 0.01 });
      for (let k = 0; k < 10; k++) A.noise(6.0 + k * 0.15, { type: 'bandpass', f: 400 + hash(k + 40) * 3000, q: 2, dur: 0.06, g: 0.15, crush: true, hold: true, rel: 0.005 });
      A.bell(7.55, midi(81), { g: 0.08, dur: 1.6, ratios: [1, 2, 3] });
      A.osc(7.55, { f: midi(88), dur: 1.4, g: 0.04, rev: 0.4 });
      [7.6, 8.1, 8.6, 9.1].forEach((t, i) => { A.kick(t, 0.7); A.hat(t + 0.25, 0.06); if (i % 2) A.clap(t, 0.25); });
      A.osc(9.4, { type: 'square', f: 1760, dur: 0.06, g: 0.04, hold: true, rel: 0.01, lp: 4000 });
      A.osc(9.5, { type: 'square', f: 2637, dur: 0.1, g: 0.04, hold: true, rel: 0.01, lp: 4000 });
    },
  });

  /* ============ 06 Flat explainer / material motion ============ */
  const FL = { bg: '#f7dd4a', ink: '#1d1a3a', coral: '#ff5a5f', teal: '#16b3a3', sky: '#7cc4fd', white: '#ffffff' };
  const FLOOR = 800;
  const IMPACTS = [0.55, 0.95, 1.22, 1.4];
  function flatGlyph(c, kind, x, y, s, col) {
    c.fillStyle = col; c.strokeStyle = col; c.lineWidth = s * 0.12; c.lineCap = 'round';
    c.beginPath();
    if (kind === 0) c.arc(x, y, s * 0.26, 0, TAU);
    else if (kind === 1) { c.moveTo(x, y - s * 0.28); c.lineTo(x + s * 0.28, y + s * 0.22); c.lineTo(x - s * 0.28, y + s * 0.22); c.closePath(); }
    else if (kind === 2) { c.rect(x - s * 0.22, y - s * 0.22, s * 0.44, s * 0.44); }
    else if (kind === 3) { c.moveTo(x - s * 0.24, y); c.lineTo(x + s * 0.24, y); c.moveTo(x, y - s * 0.24); c.lineTo(x, y + s * 0.24); c.stroke(); return; }
    else { heart(c, x, y + s * 0.04, s * 0.5); }
    c.fill();
  }
  function heart(c, x, y, s) {
    c.moveTo(x, y + s * 0.35);
    c.bezierCurveTo(x - s * 0.6, y - s * 0.05, x - s * 0.3, y - s * 0.6, x, y - s * 0.22);
    c.bezierCurveTo(x + s * 0.3, y - s * 0.6, x + s * 0.6, y - s * 0.05, x, y + s * 0.35);
  }
  MG.film({
    id: 'flat',
    poster: 9.4,
    fonts: ['600 150px Fredoka'],
    draw(c, t, W, H) {
      c.fillStyle = FL.bg; c.fillRect(0, 0, W, H);
      const cx = W / 2;
      if (t < 1.6) {
        const r = 70;
        const y = kf(t, [[0, -120], [0.55, FLOOR - r, E.inQ], [0.75, FLOOR - r - 330, E.outQ], [0.95, FLOOR - r, E.inQ], [1.085, FLOOR - r - 150, E.outQ], [1.22, FLOOR - r, E.inQ], [1.31, FLOOR - r - 55, E.outQ], [1.4, FLOOR - r, E.inQ]]);
        let sq = 0, stc = 0;
        IMPACTS.forEach((ti, i) => {
          const amp = [0.42, 0.3, 0.18, 0.1][i];
          sq += amp * Math.exp(-Math.pow((t - ti) / 0.035, 2));
          stc += amp * 0.6 * (Math.exp(-Math.pow((t - ti + 0.07) / 0.05, 2)) + Math.exp(-Math.pow((t - ti - 0.07) / 0.05, 2)));
        });
        const ant = bump(t, 1.48, 0.1, 0.0, 0.02) * 0.25;
        const sy = 1 - sq - ant + stc, sx = 1 / sy;
        const h = FLOOR - (y + r);
        c.fillStyle = 'rgba(29,26,58,0.16)';
        c.beginPath(); c.ellipse(cx, FLOOR + 6, r * (1.1 - Math.min(h, 500) / 900) * sx, 14, 0, 0, TAU); c.fill();
        c.fillStyle = FL.coral;
        c.beginPath(); c.ellipse(cx, FLOOR - r * sy, r * sx, r * sy, 0, 0, TAU); c.fill();
      } else if (t < 3.0) {
        const cols = [FL.coral, FL.teal, FL.ink], hs = [250, 420, 330];
        for (let i = 0; i < 3; i++) {
          const s = spring(t - 1.6 - i * 0.04, 2.2, 0.45);
          const x = cx + (i - 1) * 230 * s;
          const g = spring(t - 2.15 - i * 0.07, 2.4, 0.5);
          const h = lerp(100, hs[i], Math.max(0, g)), w = lerp(100, 120, clamp(g));
          const rad = lerp(50, 18, clamp(g));
          const sep = E.outX(seg(t, 1.6, 1.75));
          c.fillStyle = cols[i];
          rrect(c, x - w / 2, FLOOR - h - (1 - sep) * 0, w, h, rad); c.fill();
        }
        c.fillStyle = 'rgba(29,26,58,0.16)';
        c.fillRect(cx - 420, FLOOR + 2, 840 * E.outX(seg(t, 2.1, 2.5)), 6);
      } else if (t < 5.5) {
        const m = E.ioC(seg(t, 3.0, 3.45));
        const side = 1 - E.inB(seg(t, 3.0, 3.25));
        [[-1, FL.coral, 250], [1, FL.ink, 330]].forEach(([d, col, h]) => {
          if (side <= 0) return;
          c.fillStyle = col;
          rrect(c, cx + d * 230 - 60, FLOOR - h * side, 120, h * side, 18); c.fill();
        });
        const px = lerp(cx - 60, cx - 215, m), py = lerp(FLOOR - 420, 130, m), pw = lerp(120, 430, m), ph = lerp(420, 820, m);
        c.fillStyle = 'rgba(29,26,58,0.18)';
        rrect(c, px + 18, py + 22, pw, ph, lerp(18, 64, m)); c.fill();
        c.fillStyle = m < 1 ? (m < 0.5 ? FL.teal : FL.ink) : FL.ink;
        rrect(c, px, py, pw, ph, lerp(18, 64, m)); c.fill();
        if (m > 0.6) {
          const sa = seg(m, 0.6, 1);
          c.save();
          rrect(c, px + 18, py + 18, pw - 36, ph - 36, 48); c.clip();
          c.fillStyle = `rgba(244,242,255,${sa})`; c.fillRect(px, py, pw, ph);
          const hd = spring(t - 3.35, 2.4, 0.5);
          c.fillStyle = FL.coral;
          rrect(c, px + 44, py + 60 - (1 - hd) * 80, 180, 30, 15); c.fill();
          for (let k = 0; k < 3; k++) {
            const s = spring(t - 3.5 - k * 0.14, 2.2, 0.5);
            const cy = py + 140 + k * 170 + (1 - s) * 500;
            c.fillStyle = FL.white;
            rrect(c, px + 40, cy, pw - 80, 140, 26); c.fill();
            c.fillStyle = [FL.sky, FL.teal, FL.coral][k];
            c.beginPath(); c.arc(px + 100, cy + 70, 32, 0, TAU); c.fill();
            c.fillStyle = 'rgba(29,26,58,0.85)'; rrect(c, px + 150, cy + 46, 150, 16, 8); c.fill();
            c.fillStyle = 'rgba(29,26,58,0.25)'; rrect(c, px + 150, cy + 78, 110, 14, 7); c.fill();
          }
          const tg = spring(t - 4.3, 3, 0.45), on = clamp(tg);
          const ty = py + 140 + 2 * 170;
          c.fillStyle = on > 0.5 ? FL.teal : 'rgba(29,26,58,0.18)';
          rrect(c, px + pw - 140, ty + 52, 72, 38, 19); c.fill();
          c.fillStyle = FL.white; c.beginPath(); c.arc(px + pw - 121 + 34 * tg, ty + 71, 15, 0, TAU); c.fill();
          const hp = spring(t - 4.8, 3, 0.35);
          const hy = py + 140 + 170 + 70, hx = px + pw - 105;
          if (hp > 0) {
            c.fillStyle = FL.coral; c.beginPath(); heart(c, hx, hy, 70 * hp); c.fill();
            const bt = seg(t, 4.8, 5.3);
            for (let k = 0; k < 8; k++) {
              const a = k / 8 * TAU, d = 30 + 70 * E.outC(bt);
              c.fillStyle = `rgba(255,90,95,${1 - bt})`;
              c.beginPath(); c.arc(hx + Math.cos(a) * d, hy + Math.sin(a) * d, 7 * (1 - bt), 0, TAU); c.fill();
            }
          }
          c.restore();
        }
      } else {
        // tiles ripple out, then everything folds into the mark
        const z = E.ioC(seg(t, 5.5, 6.1));
        const cols = [FL.coral, FL.teal, FL.sky, FL.white, FL.ink];
        const gx = 9, gy = 5, sp = 176, ts = 128;
        const pull = (d) => E.inB(seg(t, 7.45 + (4 - d) * 0.05, 7.85 + (4 - d) * 0.05), 2);
        for (let j = 0; j < gy; j++) for (let i = 0; i < gx; i++) {
          const di = i - 4, dj = j - 2, d = Math.hypot(di, dj);
          if (d === 0) continue;
          const s = spring(t - 5.85 - d * 0.06, 2.4, 0.42) * (1 - pull(Math.min(4, d)));
          if (s <= 0.001) continue;
          const pl = pull(Math.min(4, d));
          const x = cx + di * sp * (1 - pl), y = 540 + dj * sp * (1 - pl);
          const k = (i * 7 + j * 3) % 5;
          c.save(); c.translate(x, y); c.scale(s, s);
          c.fillStyle = cols[k]; rrect(c, -ts / 2, -ts / 2, ts, ts, 30); c.fill();
          flatGlyph(c, (i + j * 2) % 5, 0, 0, ts, k === 3 ? FL.ink : k === 4 ? FL.bg : FL.white);
          c.restore();
        }
        if (t < 7.6) {
          const pw = lerp(430, ts, z), ph = lerp(820, ts, z), px = lerp(cx - 215, cx - ts / 2, z), py = lerp(130, 540 - ts / 2, z);
          c.fillStyle = FL.ink; rrect(c, px, py, pw, ph, lerp(64, 30, z)); c.fill();
          if (z < 1) { c.fillStyle = `rgba(244,242,255,${1 - z})`; rrect(c, px + 18 * (1 - z), py + 18 * (1 - z), pw - 36 * (1 - z), ph - 36 * (1 - z), 40); c.fill(); }
          if (z >= 1) flatGlyph(c, 4, cx, 540, ts, FL.coral);
        } else {
          const lg = spring(t - 7.85, 2, 0.4);
          const lx = cx - 330 * E.outC(seg(t, 8.25, 8.7));
          c.save(); c.translate(lx, 540); c.rotate((1 - clamp(lg)) * -1.2); c.scale(Math.max(0, lg), Math.max(0, lg));
          c.fillStyle = FL.coral; c.beginPath(); c.arc(0, 0, 110, 0, TAU); c.fill();
          c.fillStyle = FL.ink; c.beginPath(); c.arc(-36, -22, 13, 0, TAU); c.arc(36, -22, 13, 0, TAU); c.fill();
          c.strokeStyle = FL.ink; c.lineWidth = 14; c.lineCap = 'round';
          c.beginPath(); c.arc(0, 4, 50, 0.2 * Math.PI, 0.8 * Math.PI); c.stroke();
          c.restore();
          const word = 'simple.';
          font(c, 170, 'Fredoka, sans-serif', 600);
          let x = cx - 170;
          [...word].forEach((ch, i) => {
            const s = spring(t - 8.4 - i * 0.05, 2.6, 0.45);
            if (s > 0) text(c, ch, x, 600 + (1 - s) * 120, { font: 'Fredoka, sans-serif', weight: 600, size: 170, color: i === 6 ? FL.coral : FL.ink });
            x += c.measureText(ch).width;
          });
          const sw = E.ioC(seg(t, 8.85, 9.3));
          if (sw > 0) {
            c.strokeStyle = FL.teal; c.lineWidth = 16; c.lineCap = 'round';
            c.beginPath();
            for (let k = 0; k <= 40 * sw; k++) { const u = k / 40, xx = cx - 160 + 520 * u, yy = 660 + Math.sin(u * Math.PI * 1.2) * 14; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
            c.stroke();
          }
          const cf = seg(t, 8.6, 9.8);
          if (cf > 0 && cf < 1) {
            const r = rng(3);
            for (let k = 0; k < 26; k++) {
              const a = -Math.PI / 2 + (r() - 0.5) * 2.4, sp2 = 500 + r() * 700, tt = cf * 1.2;
              const x2 = lx + Math.cos(a) * sp2 * tt, y2 = 540 + Math.sin(a) * sp2 * tt + 900 * tt * tt;
              c.save(); c.translate(x2, y2); c.rotate(tt * 8 + k);
              c.fillStyle = [FL.coral, FL.teal, FL.sky, FL.ink][k % 4];
              c.fillRect(-9, -5, 18, 10);
              c.restore();
            }
          }
        }
      }
    },
    score(A) {
      const mar = (t, m, g = 0.22, o = {}) => {
        A.osc(t, { f: midi(m), dur: 0.5, g, a: 0.002, rev: 0.15, ...o });
        A.osc(t, { f: midi(m) * 4, dur: 0.06, g: g * 0.25, a: 0.001 });
      };
      [60, 64, 67, 72].forEach((m, i) => { mar(IMPACTS[i], m, 0.24 - i * 0.03); A.kick(IMPACTS[i], 0.3 - i * 0.05, { f: 120, f2: 60, dur: 0.15 }); });
      A.osc(1.48, { f: 200, f2: 120, dur: 0.1, g: 0.08 });
      [0, 1, 2].forEach(i => { A.osc(1.6 + i * 0.04, { f: 320 + i * 80, f2: 1000 + i * 200, glide: 0.07, dur: 0.12, g: 0.18 }); });
      [72, 76, 79].forEach((m, i) => mar(2.15 + i * 0.07, m, 0.18));
      A.whoosh(3.0, 0.45, { f1: 400, f2: 2500, g: 0.12 });
      [60, 64, 67, 71].forEach((m, i) => A.pluck(3.05 + i * 0.03, midi(m), { dur: 1.2, g: 0.25, bright: 0.6, rev: 0.2 }));
      [3.5, 3.64, 3.78].forEach((t, i) => mar(t, 79 + i * 2, 0.1));
      A.osc(4.3, { f: 1400, dur: 0.03, g: 0.12, type: 'square', lp: 3000 });
      mar(4.36, 84, 0.12);
      A.osc(4.8, { f: 400, f2: 1200, glide: 0.08, dur: 0.15, g: 0.2 });
      A.bell(4.82, midi(96), { g: 0.06, dur: 0.8 });
      A.whoosh(5.5, 0.6, { f1: 2500, f2: 300, g: 0.12 });
      for (let k = 0; k < 12; k++) A.osc(5.9 + k * 0.045, { f: 500 + k * 60, f2: 1400 + k * 80, glide: 0.06, dur: 0.08, g: 0.07, pan: k % 2 ? 0.5 : -0.5 });
      A.whoosh(7.45, 0.45, { f1: 3500, f2: 400, g: 0.15 });
      A.osc(7.85, { f: 300, f2: 900, glide: 0.1, dur: 0.2, g: 0.2 });
      [60, 64, 67, 72, 76].forEach((m, i) => A.pluck(8.0 + i * 0.05, midi(m), { dur: 2, g: 0.28, bright: 0.65, rev: 0.25, pan: (i - 2) * 0.2 }));
      A.bell(8.45, midi(84), { g: 0.07, dur: 1.4 });
      for (let k = 0; k < 10; k++) A.osc(8.6 + k * 0.06, { f: midi(96 + (k % 5) * 2), dur: 0.2, g: 0.025, pan: k % 2 ? 0.6 : -0.6, rev: 0.3 });
      const bass = [48, 48, 45, 45, 41, 41, 43, 43];
      for (let k = 0; k < 16; k++) { const t = 1.6 + k * 0.5; if (t > 9.6) break; A.pluck(t, midi(bass[k % 8] - 12), { dur: 0.6, g: 0.4, bright: 0.3, lp: 700 }); A.noise(t + 0.25, { type: 'highpass', f: 6000, dur: 0.05, g: 0.04 }); }
    },
  });

  /* ============ 07 Liquid motion ============ */
  const LQ = { mw: 960, mh: 540 };
  function blob(g, x, y, r) {
    const R = r * 2;
    const gr = g.createRadialGradient(x, y, 0, x, y, R);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill();
  }
  MG.film({
    id: 'liquid',
    poster: 8.9,
    fonts: ['700 200px Fredoka'],
    setup() {
      const m = offscreen(LQ.mw, LQ.mh), L = offscreen(LQ.mw, LQ.mh);
      return { m, mg: m.getContext('2d', { willReadFrequently: true }), L, lg: L.getContext('2d') };
    },
    draw(c, t, W, H, st) {
      const { m, mg, L, lg } = st, k = 0.5;
      const flooded = t >= 5.7;
      const bgA = c.createLinearGradient(0, 0, W, H);
      if (!flooded) { bgA.addColorStop(0, '#1b0f36'); bgA.addColorStop(1, '#0e0820'); }
      else { bgA.addColorStop(0, '#ff3f7f'); bgA.addColorStop(1, '#ffad4f'); }
      c.fillStyle = bgA; c.fillRect(0, 0, W, H);

      mg.globalCompositeOperation = 'source-over';
      mg.clearRect(0, 0, LQ.mw, LQ.mh);
      mg.globalCompositeOperation = 'lighter';
      const B = (x, y, r) => blob(mg, x * k, y * k, r * k);
      const spec = [];
      const surf = 930;
      if (t < 2.2) {
        // pool surface as a soft field
        const pool = 1 - E.inC(seg(t, 1.6, 2.2));
        const pg = mg.createLinearGradient(0, (surf - 60) * k, 0, (surf + 60) * k);
        pg.addColorStop(0, 'rgba(255,255,255,0)'); pg.addColorStop(1, 'rgba(255,255,255,1)');
        mg.fillStyle = pg; mg.fillRect(0, (surf - 60 + (1 - pool) * 300) * k, LQ.mw, LQ.mh);
        const imp = 0.72;
        if (t < imp + 0.05) {
          const y = lerp(-120, surf - 20, E.inQ(seg(t, 0, imp)));
          B(960, y, 44); B(960, y - 52, 28); B(960, y - 92, 16);
          spec.push([960, y, 44]);
        }
        if (t >= imp) {
          const tau = t - imp, r = rng(9);
          for (let i = 0; i < 9; i++) {
            const vx = (r() - 0.5) * 900, vy = 700 + r() * 600, rr = 14 + r() * 18;
            const x = 960 + vx * tau, y = surf - 30 - vy * tau + 0.5 * 2600 * tau * tau;
            if (y < surf + 60) { B(x, y, rr); spec.push([x, y, rr]); }
          }
          const jet = Math.sin(Math.PI * seg(t, imp + 0.05, imp + 0.9));
          if (jet > 0) { B(960, surf - 40 - 280 * jet, 36 * (0.6 + jet * 0.4)); B(960, surf - 40 - 140 * jet, 30); spec.push([960, surf - 40 - 280 * jet, 36]); }
          const rip = seg(t, imp, imp + 1.2);
          [-1, 1].forEach(d => B(960 + d * 500 * rip, surf - 10, 40 * (1 - rip)));
        }
      }
      if (t >= 1.7 && t < 5.7) {
        const rise = E.outC(seg(t, 1.7, 2.6));
        const gather = E.ioC(seg(t, 4.4, 5.0));
        const orbit = lerp(lerp(120, 300, 0.5 + 0.5 * Math.sin(t * 2.1)), 0, gather);
        const n = 5;
        for (let i = 0; i < n; i++) {
          const a = t * (0.9 + i * 0.13) + i * TAU / n;
          const rr = lerp(60 + 30 * Math.sin(t * 3 + i * 2), 130, gather);
          const x = 960 + Math.cos(a) * orbit * (1 + 0.3 * Math.sin(i)), y = lerp(surf + 200, 520, rise) + Math.sin(a * 1.3) * orbit * 0.6;
          B(x, y, rr); spec.push([x, y, rr]);
        }
        const burst = E.inQ(seg(t, 5.1, 5.7));
        if (gather > 0) {
          const wob = 1 + 0.06 * Math.sin(t * 30) * seg(t, 4.9, 5.1);
          B(960, 520, lerp(60, 180, gather) * wob + burst * 1500);
          spec.push([960, 520, 180]);
        }
      }
      if (flooded) {
        const n = E.outC(seg(t, 5.8, 7.2));
        const r = rng(4);
        for (let i = 0; i < 7; i++) {
          const a = r() * TAU, d = 1100 * (1 - n) + 120;
          const tx = 640 + i * 105, ty = 540 + (r() - 0.5) * 60;
          const x = lerp(960 + Math.cos(a) * d, tx, n), y = lerp(540 + Math.sin(a) * d * 0.7, ty, n);
          const rr = lerp(70, 26, seg(t, 6.6, 8.0));
          if (t < 8.1) { B(x, y, rr); spec.push([x, y, rr]); }
        }
        const blur = lerp(70, 0, E.outC(seg(t, 6.3, 8.0)));
        mg.save();
        mg.globalCompositeOperation = 'lighter';
        mg.font = `700 ${230 * k * 2}px Fredoka, sans-serif`;
        mg.textAlign = 'center'; mg.textBaseline = 'middle';
        const passes = blur > 1 ? 2 : 1;
        for (let p = 0; p < passes; p++) {
          mg.shadowColor = '#fff'; mg.shadowBlur = blur * k * 2; mg.shadowOffsetX = 10000;
          mg.fillStyle = '#fff';
          mg.fillText('flow', 960 * k - 10000, 540 * k + 10 * k);
        }
        mg.restore();
        if (t >= 8.4) {
          const dr = seg(t, 8.4, 9.2), fall = E.inQ(seg(t, 9.2, 9.9));
          const dx = 1175, dy = 600 + 40 * dr + fall * 600;
          B(dx, dy, 10 + 16 * dr * (1 - fall * 0.3));
          if (fall < 0.1) B(dx, 600 + 18 * dr, 14);
          spec.push([dx, dy, 18 * dr]);
        }
      }
      // threshold the field into a crisp liquid edge
      const img = mg.getImageData(0, 0, LQ.mw, LQ.mh), d = img.data;
      for (let i = 3; i < d.length; i += 4) {
        const a = d[i] / 255, v = a <= 0.42 ? 0 : a >= 0.56 ? 1 : (a - 0.42) / 0.14;
        d[i - 3] = d[i - 2] = d[i - 1] = 255;
        d[i] = (v * v * (3 - 2 * v) * 255) | 0;
      }
      mg.putImageData(img, 0, 0);

      lg.globalCompositeOperation = 'source-over';
      lg.clearRect(0, 0, LQ.mw, LQ.mh);
      const lgG = lg.createLinearGradient(0, 0, LQ.mw, LQ.mh);
      const sh = Math.sin(t * 0.8) * 0.15;
      if (!flooded) { lgG.addColorStop(0, '#ff3f7f'); lgG.addColorStop(0.55 + sh, '#ff7a5c'); lgG.addColorStop(1, '#ffad4f'); }
      else { lgG.addColorStop(0, '#16e0c8'); lgG.addColorStop(0.5 + sh, '#2a7cf0'); lgG.addColorStop(1, '#4b2bd8'); }
      lg.fillStyle = lgG; lg.fillRect(0, 0, LQ.mw, LQ.mh);
      lg.globalCompositeOperation = 'destination-in';
      lg.drawImage(m, 0, 0);
      lg.globalCompositeOperation = 'source-atop';
      spec.forEach(([x, y, r]) => {
        if (r < 4) return;
        const hx = (x - r * 0.35) * k, hy = (y - r * 0.4) * k, hr = r * 0.32 * k;
        const hg = lg.createRadialGradient(hx, hy, 0, hx, hy, hr * 2);
        hg.addColorStop(0, 'rgba(255,255,255,0.55)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
        lg.fillStyle = hg; lg.fillRect(hx - hr * 2, hy - hr * 2, hr * 4, hr * 4);
      });
      if (flooded && t > 7.6) {
        const sweep = seg(t, 7.9, 8.7);
        const sx = lerp(200, 800, sweep) ;
        const sg = lg.createLinearGradient((sx - 60), 0, (sx + 60), 0);
        sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, `rgba(255,255,255,${0.5 * Math.sin(Math.PI * sweep)})`); sg.addColorStop(1, 'rgba(255,255,255,0)');
        lg.fillStyle = sg; lg.fillRect(0, 0, LQ.mw, LQ.mh);
      }
      c.save();
      c.shadowColor = 'rgba(0,0,0,0.25)'; c.shadowBlur = 40; c.shadowOffsetY = 18;
      c.drawImage(L, 0, 0, W, H);
      c.restore();
      if (t >= 8.2) {
        const a = E.outC(seg(t, 8.2, 8.8));
        text(c, 'LIQUID MOTION  ·  METABALL FIELD + THRESHOLD', W / 2, 900, { font: '"JetBrains Mono", monospace', size: 20, ls: 4, align: 'center', color: `rgba(255,255,255,${a * 0.85})` });
      }
      grain(c, W, H, t, 0.035, 'soft-light');
    },
    score(A) {
      const bloop = (t, f, g = 0.25, pan = 0) => A.osc(t, { f, f2: f * 2.6, glide: 0.05, dur: 0.09, g, pan, rev: 0.25 });
      bloop(0.72, 340, 0.4);
      A.noise(0.72, { type: 'bandpass', f: 1800, q: 0.8, dur: 0.45, g: 0.18, rev: 0.3 });
      A.osc(0.72, { f: 90, f2: 45, dur: 0.3, g: 0.3 });
      for (let i = 0; i < 9; i++) bloop(1.15 + hash(i) * 0.5, 500 + hash(i + 9) * 700, 0.08, hash(i + 3) - 0.5);
      bloop(1.55, 420, 0.15);
      A.chord(1.8, [50, 57, 61, 64, 69], { type: 'sine', dur: 3.6, g: 0.05, a: 1.2, hold: true, rel: 0.8, rev: 0.6, width: 1.2 });
      A.chord(1.8, [38], { type: 'triangle', dur: 3.6, g: 0.08, a: 0.8, hold: true, rel: 0.6 });
      const pent = [62, 64, 66, 69, 71, 74, 76];
      for (let i = 0; i < 9; i++) bloop(2.3 + i * 0.25 + hash(i * 5) * 0.08, midi(pent[(i * 3) % 7] + 12), 0.07, (i % 2 ? 0.4 : -0.4));
      for (let i = 0; i < 8; i++) A.osc(4.5 + i * 0.07, { f: midi(pent[i % 7] + 12), dur: 0.12, g: 0.06, rev: 0.4 });
      A.noise(5.1, { type: 'lowpass', f: 300, f2: 3000, dur: 0.65, g: 0.25, swell: 0.9 });
      A.impact(5.7, 0.6, { rev: 0.4 });
      A.noise(5.7, { type: 'lowpass', f: 2500, f2: 300, dur: 1.2, g: 0.15 });
      A.noise(6.3, { type: 'bandpass', f: 400, f2: 2500, q: 1, dur: 1.7, g: 0.1, swell: 0.95, rev: 0.4 });
      for (let i = 0; i < 7; i++) bloop(6.4 + i * 0.18, midi(pent[i] + 12), 0.06, (i - 3) * 0.15);
      A.chord(8.0, [50, 57, 62, 66, 69, 76], { type: 'sine', dur: 2, g: 0.05, a: 0.02, rev: 0.6, width: 1.2 });
      A.bell(8.0, midi(86), { g: 0.08, dur: 2 });
      [57, 62, 66].forEach((m, i) => A.pluck(8.02 + i * 0.04, midi(m), { dur: 1.8, g: 0.2, bright: 0.5, rev: 0.4 }));
      bloop(9.2, 520, 0.18);
      bloop(9.45, 520, 0.06);
      bloop(9.7, 520, 0.02);
    },
  });
})();
