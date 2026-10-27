/* Batch e3 — Family J: Social & Commercial.
   Logo Reveal (studio ident), App UI Motion (spring micro-interactions), Data Storytelling (to-scale editorial charts). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, grain, vignette, offscreen, rrect } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&family=Libre+Franklin:wght@400;500;600;700;800&display=block');

  const PI = Math.PI;
  const setLS = (c, v) => { if ('letterSpacing' in c) c.letterSpacing = v + 'px'; };
  const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const decay = (t, at, k) => (t >= at ? Math.exp(-(t - at) * k) : 0);
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
  const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const fnt = (c, w, s, f) => { c.font = `${w} ${s}px ${f}`; };
  // Draws a string glyph by glyph so tracking can animate while the font's own kerning is kept.
  function glyphX(c, s, ls) {
    setLS(c, 0);
    const xs = [];
    for (let i = 0; i < s.length; i++) xs.push(c.measureText(s.slice(0, i)).width + i * ls);
    xs.push(c.measureText(s).width + (s.length - 1) * ls);
    return xs;
  }

  /* =====================================================================
     LOGO REVEAL — "Solvane Pictures". An S monogram built from two
     tangent circles plus a sun-dot. Two quick alternate takes (particles
     converge, ribbon fold), then the definitive construction: grid,
     compass circles, outline trace, ink fill, the dot lands with the
     sonic logo, light sweep, wordmark set beside it.
     ===================================================================== */
  const MAN = 'Manrope, "Helvetica Neue", Arial, sans-serif';
  const MONO = '"JetBrains Mono", Menlo, monospace';
  const LR_R = 88, LR_W = 56;
  const LA0 = -20 * PI / 180, LSW = 250 * PI / 180, LDOT = 18 * PI / 180;
  const INK = '#15171c', ORANGE = '#ff4f1f', PAPER = '#f3f1ec';
  const DOT = [Math.cos(LDOT) * LR_R, -LR_R + Math.sin(LDOT) * LR_R];
  // centre-line point + unit tangent at s∈[0,1]
  function sPt(s, r = LR_R) {
    if (s < 0.5) { const a = LA0 - LSW * (s / 0.5); return [Math.cos(a) * r, -r + Math.sin(a) * r, Math.sin(a), -Math.cos(a)]; }
    const a = -PI / 2 + LSW * ((s - 0.5) / 0.5); return [Math.cos(a) * r, r + Math.sin(a) * r, -Math.sin(a), Math.cos(a)];
  }
  function sArc(c, p0, p1, r = LR_R) {
    c.beginPath();
    if (p0 < 0.5) c.arc(0, -r, r, LA0 - LSW * (p0 / 0.5), LA0 - LSW * (Math.min(p1, 0.5) / 0.5), true);
    if (p1 > 0.5) c.arc(0, r, r, -PI / 2 + LSW * ((Math.max(p0, 0.5) - 0.5) / 0.5), -PI / 2 + LSW * ((p1 - 0.5) / 0.5), false);
  }
  function sOutline() {
    const N = 180, A = [], B = [];
    for (let i = 0; i <= N; i++) {
      const [x, y, tx, ty] = sPt(i / N), nx = -ty, ny = tx;
      A.push([x + nx * LR_W / 2, y + ny * LR_W / 2]); B.push([x - nx * LR_W / 2, y - ny * LR_W / 2]);
    }
    const P = A.concat(B.reverse());
    let L = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); }
    return { P, L };
  }
  function drawMark(c, fill = 1, dotK = 1, ink = INK, dotCol = ORANGE) {
    if (fill > 0) {
      c.strokeStyle = ink; c.lineWidth = LR_W; c.lineCap = 'butt';
      sArc(c, 0, fill); c.stroke();
    }
    if (dotK > 0) { c.fillStyle = dotCol; c.beginPath(); c.arc(DOT[0], DOT[1], (LR_W / 2) * dotK, 0, TAU); c.fill(); }
  }
  function lrSlate(c, t, take, label, dark, a = 1) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    const col = dark ? 'rgba(255,255,255,0.62)' : 'rgba(21,23,28,0.55)';
    fnt(c, 500, 15, MONO); setLS(c, 2.5); c.fillStyle = col; c.textBaseline = 'alphabetic';
    c.textAlign = 'left'; c.fillText('SOLVANE PICTURES — IDENT EXPLORATION', 72, 84);
    c.textAlign = 'right'; c.fillText(`TAKE ${take} / 03   ${label}`, W0 - 72, 84);
    c.textAlign = 'left';
    const fr = Math.floor(t * 24);
    c.fillText(`TC 00:00:${String(Math.floor(t)).padStart(2, '0')}:${String(fr % 24).padStart(2, '0')}`, 72, 1080 - 66);
    c.textAlign = 'right'; c.fillText('V3 · BRAND MOTION SYSTEM', W0 - 72, 1080 - 66);
    // crop marks
    c.strokeStyle = col; c.lineWidth = 1.2;
    [[48, 48, 1, 1], [W0 - 48, 48, -1, 1], [48, 1032, 1, -1], [W0 - 48, 1032, -1, -1]].forEach(([x, y, sx, sy]) => {
      c.beginPath(); c.moveTo(x, y + sy * 18); c.lineTo(x, y); c.lineTo(x + sx * 18, y); c.stroke();
    });
    setLS(c, 0); c.restore();
  }
  const W0 = 1920;

  function lrTake1(c, t, st) {
    const g = c.createRadialGradient(960, 520, 40, 960, 540, 1100);
    g.addColorStop(0, '#1d1f26'); g.addColorStop(1, '#07080a');
    c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
    const sc = lerp(1.32, 1.12, E.outC(seg(t, 0, 1.55)));
    const land = sstep(0.98, 1.16, t);
    c.save(); c.translate(960, 540); c.scale(sc, sc);
    // glow bloom on landing
    const bl = decay(t, 1.08, 3.2) * sstep(1.0, 1.08, t);
    if (bl > 0) {
      const gg = c.createRadialGradient(0, 0, 10, 0, 0, 420);
      gg.addColorStop(0, `rgba(255,120,60,${0.35 * bl})`); gg.addColorStop(1, 'rgba(255,120,60,0)');
      c.fillStyle = gg; c.fillRect(-500, -500, 1000, 1000);
    }
    if (land < 1) {
      c.globalCompositeOperation = 'lighter';
      const P = st.parts;
      const paths = [new Path2D(), new Path2D()], dots = [new Path2D(), new Path2D()];
      for (const q of P) {
        const at = (tt) => {
          const p = E.outQt(seg(tt, 0.08 + q.d, 0.98 + q.d * 0.4));
          const rr = q.R * (1 - p), an = q.a + (1 - p) * 2.6;
          return [q.x + Math.cos(an) * rr, q.y + Math.sin(an) * rr];
        };
        const [x, y] = at(t), [x0, y0] = at(t - 0.045);
        const k = q.o ? 1 : 0;
        paths[k].moveTo(x0, y0); paths[k].lineTo(x, y);
        dots[k].rect(x - 1.3, y - 1.3, 2.6, 2.6);
      }
      c.globalAlpha = 0.5 * (1 - land);
      c.lineWidth = 1.1;
      c.strokeStyle = 'rgba(255,236,220,0.55)'; c.stroke(paths[0]);
      c.strokeStyle = 'rgba(255,110,50,0.8)'; c.stroke(paths[1]);
      c.globalAlpha = 0.9 * (1 - land);
      c.fillStyle = '#fff3ea'; c.fill(dots[0]);
      c.fillStyle = '#ff6a35'; c.fill(dots[1]);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    if (land > 0) {
      c.save(); c.globalAlpha = land;
      c.shadowColor = 'rgba(255,110,60,0.55)'; c.shadowBlur = 40 * (0.4 + bl);
      drawMark(c, 1, 1, '#f6efe8', ORANGE);
      c.restore();
    }
    c.restore();
    lrSlate(c, t, '01', 'PARTICLE CONVERGE', true, sstep(0.05, 0.3, t));
  }

  const RIB = ['#ffe28f', '#ffcfa6', '#fff1df', '#ffffff', '#ffc2b8', '#ffe6ad', '#fff8ef'].map(hex);
  function lrTake2(c, t, st) {
    const g = c.createLinearGradient(0, 0, 1920, 1080);
    g.addColorStop(0, '#ff6a2a'); g.addColorStop(1, '#e8320f');
    c.fillStyle = g; c.fillRect(0, 0, 1920, 1080);
    const v = c.createRadialGradient(960, 540, 200, 960, 540, 1100);
    v.addColorStop(0, 'rgba(255,190,120,0.25)'); v.addColorStop(1, 'rgba(120,10,0,0.35)');
    c.fillStyle = v; c.fillRect(0, 0, 1920, 1080);
    const lt = t - 1.55;
    const hp = E.ioC(seg(t, 1.62, 2.5));
    const hit = spring(t - 2.5, 2.4, 0.42);
    const rot = (t < 2.5 ? lerp(-0.22, -0.05, E.outC(seg(t, 1.55, 2.5))) : -0.05 * (1 - hit));
    const sc = 1.05 + 0.06 * E.outC(seg(t, 1.55, 3.15)) + (t > 2.5 ? 0.025 * Math.sin(clamp((t - 2.5) * 7, 0, PI)) * decay(t, 2.5, 3) : 0);
    c.save(); c.translate(960, 540); c.rotate(rot); c.scale(sc, sc);
    const N = 140, K = 7;
    // solid underlay behind the converged strands hides seams between quads
    const ul = hp - 0.22 + Math.max(0, t - 2.42) * 1.2;
    if (ul > 0) {
      c.save(); c.shadowColor = 'rgba(120,20,0,0.35)'; c.shadowBlur = 40; c.shadowOffsetY = 18;
      c.strokeStyle = '#fbe9dc'; c.lineWidth = LR_W - 2; c.lineCap = 'butt'; sArc(c, 0, Math.min(ul, hp)); c.stroke(); c.restore();
    }
    for (let j = 0; j < N; j++) {
      const s0 = j / N, s1 = Math.min((j + 1.15) / N, hp);
      if (s0 >= hp) break;
      const a = sPt(s0), b = sPt(s1);
      const ext = Math.max(0, t - 2.42) * 3.5, age0 = clamp((hp - s0) / 0.3 + ext), age1 = clamp((hp - s1) / 0.3 + ext);
      const lum = clamp(0.5 + 0.5 * (a[2] * 0.55 - a[3] * 0.83));
      for (let k = 0; k < K; k++) {
        const um = -LR_W / 2 + (k + 0.5) * LR_W / K;
        const ed = (age, base) => base * (1 + 1.6 * (1 - E.outC(age)));
        const hw0 = (LR_W / K / 2) * lerp(0.35, 1.02, E.outC(age0)), hw1 = (LR_W / K / 2) * lerp(0.35, 1.02, E.outC(age1));
        const m0 = ed(age0, um), m1 = ed(age1, um);
        const n0 = [-a[3], a[2]], n1 = [-b[3], b[2]];
        const col = mix([236, 132, 96], mix(RIB[k], [255, 250, 244], E.inQ(age0)), 0.62 + 0.38 * lum);
        c.fillStyle = rgba(col);
        c.beginPath();
        c.moveTo(a[0] + n0[0] * (m0 - hw0), a[1] + n0[1] * (m0 - hw0));
        c.lineTo(b[0] + n1[0] * (m1 - hw1), b[1] + n1[1] * (m1 - hw1));
        c.lineTo(b[0] + n1[0] * (m1 + hw1), b[1] + n1[1] * (m1 + hw1));
        c.lineTo(a[0] + n0[0] * (m0 + hw0), a[1] + n0[1] * (m0 + hw0));
        c.fill();
      }
    }
    // head flare
    if (hp > 0 && hp < 1) {
      const h = sPt(hp);
      const gg = c.createRadialGradient(h[0], h[1], 0, h[0], h[1], 90);
      gg.addColorStop(0, 'rgba(255,255,240,0.9)'); gg.addColorStop(1, 'rgba(255,255,240,0)');
      c.fillStyle = gg; c.fillRect(h[0] - 90, h[1] - 90, 180, 180);
    }
    if (t > 2.42) {
      const dk = spring(t - 2.42, 3, 0.38);
      c.fillStyle = INK; c.beginPath(); c.arc(DOT[0], DOT[1], (LR_W / 2) * dk, 0, TAU); c.fill();
    }
    c.restore();
    // hit flash
    const fl = decay(t, 2.5, 9) * (t > 2.5 ? 1 : 0);
    if (fl > 0.01) { c.fillStyle = `rgba(255,240,225,${0.25 * fl})`; c.fillRect(0, 0, 1920, 1080); }
    lrSlate(c, t, '02', 'RIBBON FOLD', true, 1);
    void lt;
  }

  function lrHero(c, t, st) {
    c.fillStyle = PAPER; c.fillRect(0, 0, 1920, 1080);
    const bg = c.createRadialGradient(960, 500, 100, 960, 540, 1150);
    bg.addColorStop(0, 'rgba(255,255,255,0.7)'); bg.addColorStop(1, 'rgba(210,204,192,0.35)');
    c.fillStyle = bg; c.fillRect(0, 0, 1920, 1080);

    // final layout
    const FS = 0.6, WSZ = 104, WLS = 6;
    fnt(c, 700, WSZ, MAN);
    const wx = glyphX(c, 'SOLVANE', WLS), Ww = wx[wx.length - 1];
    const mw = 2 * (LR_R + LR_W / 2) * FS, gap = 70, total = mw + gap + Ww;
    const left = 960 - total / 2, fcx = left + mw / 2, wordX = left + mw + gap;
    const mv = t < 7.0 ? 0 : spring(t - 7.0, 1.35, 0.8);
    const push = 1 + 0.018 * E.ioS(seg(t, 7.6, 10));
    const mcx = lerp(960, fcx, mv), msc = lerp(1, FS, mv);

    c.save();
    c.translate(960, 540); c.scale(push, push); c.translate(-960, -540);

    // ---- construction layer (in mark space) ----
    const cons = 1 - sstep(6.15, 6.7, t);
    if (cons > 0) {
      c.save(); c.translate(mcx, 540); c.scale(msc, msc);
      c.globalAlpha = cons;
      const U = 34, NG = 7;
      c.lineWidth = 1 / msc;
      for (let i = -NG; i <= NG; i++) {
        const d = Math.abs(i) * 0.035;
        const p = E.outC(seg(t, 3.2 + d, 3.75 + d));
        if (p <= 0) continue;
        const key = i === 0;
        c.strokeStyle = key ? 'rgba(21,23,28,0.28)' : 'rgba(21,23,28,0.09)';
        const L = NG * U * p;
        c.beginPath(); c.moveTo(i * U, -L); c.lineTo(i * U, L); c.moveTo(-L, i * U); c.lineTo(L, i * U); c.stroke();
      }
      // key horizontals through the circle centres + 45° guides
      const kp = E.outC(seg(t, 3.55, 4.1));
      if (kp > 0) {
        c.strokeStyle = 'rgba(255,79,31,0.45)'; c.setLineDash([6, 6]);
        [-LR_R, LR_R].forEach(y => { c.beginPath(); c.moveTo(-260 * kp, y); c.lineTo(260 * kp, y); c.stroke(); });
        c.strokeStyle = 'rgba(21,23,28,0.16)';
        c.beginPath(); c.moveTo(-230 * kp, -230 * kp); c.lineTo(230 * kp, 230 * kp); c.moveTo(230 * kp, -230 * kp); c.lineTo(-230 * kp, 230 * kp); c.stroke();
        c.setLineDash([]);
      }
      // compass circles
      const circles = [
        [0, -LR_R, LR_R, 3.6, true], [0, LR_R, LR_R, 3.72, true],
        [0, -LR_R, LR_R + LR_W / 2, 3.86], [0, -LR_R, LR_R - LR_W / 2, 3.94],
        [0, LR_R, LR_R + LR_W / 2, 4.0], [0, LR_R, LR_R - LR_W / 2, 4.08],
        [0, 0, 2 * LR_R + LR_W / 2, 4.16, true], [DOT[0], DOT[1], LR_W / 2, 4.3],
      ];
      circles.forEach(([x, y, r, t0, dash], i) => {
        const p = E.ioC(seg(t, t0, t0 + 0.5));
        if (p <= 0) return;
        const a0 = -PI / 2 + i * 0.7;
        c.strokeStyle = dash ? 'rgba(255,79,31,0.75)' : 'rgba(21,23,28,0.32)';
        c.lineWidth = (dash ? 1.4 : 1.1) / msc;
        if (dash) c.setLineDash([5, 5]);
        c.beginPath(); c.arc(x, y, r, a0, a0 + TAU * p); c.stroke(); c.setLineDash([]);
        if (p < 1) { // compass arm
          const ex = x + Math.cos(a0 + TAU * p) * r, ey = y + Math.sin(a0 + TAU * p) * r;
          c.strokeStyle = 'rgba(255,79,31,0.9)'; c.lineWidth = 1.2 / msc;
          c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke();
          c.fillStyle = ORANGE; c.beginPath(); c.arc(ex, ey, 3.2 / msc, 0, TAU); c.fill();
        }
        // centre cross
        const cp = sstep(t0, t0 + 0.12, t);
        c.strokeStyle = 'rgba(21,23,28,0.6)'; c.lineWidth = 1 / msc;
        c.beginPath(); c.moveTo(x - 7 * cp, y); c.lineTo(x + 7 * cp, y); c.moveTo(x, y - 7 * cp); c.lineTo(x, y + 7 * cp); c.stroke();
      });
      // dimension labels
      const lp = sstep(4.2, 4.5, t);
      if (lp > 0) {
        c.globalAlpha = cons * lp;
        fnt(c, 500, 13, MONO); c.fillStyle = ORANGE; c.textAlign = 'left'; setLS(c, 1);
        const R = 2 * LR_R + LR_W / 2, X = R + 46;
        c.strokeStyle = 'rgba(255,79,31,0.8)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(X, -R); c.lineTo(X, R); c.moveTo(X - 6, -R); c.lineTo(X + 6, -R); c.moveTo(X - 6, R); c.lineTo(X + 6, R);
        c.moveTo(X - 6, -LR_R); c.lineTo(X + 6, -LR_R); c.moveTo(X - 6, LR_R); c.lineTo(X + 6, LR_R); c.stroke();
        c.fillText('H = 4r + w', X + 14, 4);
        c.fillText('r', X + 14, -LR_R - LR_R / 2 + 4);
        c.fillText('w = 0.64 r', -R - 40, R + 38);
        c.fillText('θ = 250°', -2 * LR_R - 120, -LR_R + 4);
        c.fillStyle = 'rgba(21,23,28,0.55)';
        c.fillText('C1', 10, -LR_R - 10); c.fillText('C2', 10, LR_R + 20); c.fillText('O', 10, -8);
        c.fillText('SUN · Ø w', DOT[0] + 40, DOT[1] + 4);
        setLS(c, 0);
      }
      c.restore();
    }

    // ---- outline trace ----
    const tr = E.ioC(seg(t, 4.55, 5.6));
    const fillP = E.ioC(seg(t, 5.55, 6.05));
    c.save(); c.translate(mcx, 540); c.scale(msc, msc);
    if (tr > 0 && t < 6.5) {
      const O = st.outline;
      c.globalAlpha = 1 - sstep(6.05, 6.4, t);
      c.strokeStyle = INK; c.lineWidth = 2 / msc; c.lineJoin = 'round';
      c.setLineDash([O.L * tr, O.L + 10]);
      c.beginPath(); O.P.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.stroke();
      c.setLineDash([]);
      if (tr < 1) { // pen head
        let acc = 0, target = O.L * tr, hx = O.P[0][0], hy = O.P[0][1];
        for (let i = 0; i < O.P.length; i++) {
          const a = O.P[i], b = O.P[(i + 1) % O.P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (acc + l >= target) { const u = (target - acc) / l; hx = lerp(a[0], b[0], u); hy = lerp(a[1], b[1], u); break; }
          acc += l;
        }
        c.fillStyle = ORANGE; c.beginPath(); c.arc(hx, hy, 5, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(255,79,31,0.35)'; c.lineWidth = 1; c.beginPath(); c.arc(hx, hy, 12, 0, TAU); c.stroke();
      }
    }
    // ---- ink fill, sun-dot, light sweep ----
    if (fillP > 0) {
      const dk = t < 6.05 ? 0 : spring(t - 6.05, 2.6, 0.36);
      const sw = seg(t, 6.55, 7.15);
      if (sw > 0 && sw < 1) {
        const mk = st.mk, mc = mk.getContext('2d');
        mc.setTransform(1, 0, 0, 1, 0, 0); mc.clearRect(0, 0, 600, 600);
        mc.translate(300, 300); mc.globalCompositeOperation = 'source-over';
        drawMark(mc, fillP, dk);
        mc.globalCompositeOperation = 'source-atop';
        const bx = lerp(-420, 420, E.ioS(sw));
        const lg = mc.createLinearGradient(bx - 110, -200, bx + 110, 200);
        lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.45, 'rgba(255,255,255,0.32)');
        lg.addColorStop(0.5, 'rgba(255,255,255,0.62)'); lg.addColorStop(0.55, 'rgba(255,255,255,0.32)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
        mc.fillStyle = lg; mc.fillRect(-300, -300, 600, 600);
        mc.globalCompositeOperation = 'source-over';
        c.drawImage(mk, -300, -300);
      } else drawMark(c, fillP, dk);
      // landing ring from the dot
      const rg = seg(t, 6.05, 6.75);
      if (rg > 0 && rg < 1) {
        c.strokeStyle = `rgba(255,79,31,${0.55 * (1 - rg)})`; c.lineWidth = 2 / msc;
        c.beginPath(); c.arc(DOT[0], DOT[1], LR_W / 2 + 140 * E.outC(rg), 0, TAU); c.stroke();
      }
    }
    c.restore();

    // ---- wordmark ----
    if (t > 7.15) {
      const base = 582;
      const ls = lerp(34, WLS, E.outQn(seg(t, 7.2, 8.4)));
      fnt(c, 700, WSZ, MAN);
      const xs = glyphX(c, 'SOLVANE', ls), shift = (xs[xs.length - 1] - Ww) * 0.0;
      c.save();
      c.beginPath(); c.rect(wordX - 40, base - WSZ * 0.95, Ww + 400, WSZ * 1.15); c.clip();
      c.fillStyle = INK; c.textAlign = 'left'; c.textBaseline = 'alphabetic'; setLS(c, 0);
      'SOLVANE'.split('').forEach((ch, i) => {
        const t0 = 7.22 + i * 0.045;
        const p = spring(t - t0, 2.1, 0.78);
        if (t < t0) return;
        c.globalAlpha = clamp((t - t0) / 0.18);
        c.fillText(ch, wordX + xs[i] - shift, base + (1 - p) * WSZ * 0.85);
      });
      c.restore();
      const tg = sstep(7.85, 8.35, t);
      if (tg > 0) {
        c.globalAlpha = tg;
        fnt(c, 600, 19, MAN); setLS(c, lerp(22, 13.2, E.outC(tg))); c.fillStyle = 'rgba(21,23,28,0.62)'; c.textAlign = 'left';
        c.fillText('PICTURES', wordX + 4, base + 54);
        setLS(c, 0);
        // hairline rule under tagline grows from left
        const tw = c.measureText('PICTURES').width + 40;
        c.fillStyle = 'rgba(21,23,28,0.2)'; c.fillRect(wordX + 4 + tw, base + 47, (Ww - tw - 4) * E.outC(seg(t, 8.0, 8.7)), 1.2);
        fnt(c, 600, 15, MAN); c.fillStyle = 'rgba(21,23,28,0.5)';
        c.globalAlpha = sstep(8.3, 8.6, t);
        c.fillText('™', wordX + Ww + 8, base - WSZ * 0.62);
        c.globalAlpha = 1;
      }
    }
    c.restore();

    lrSlate(c, t, '03', 'CONSTRUCT — FINAL', false, 1 - sstep(6.1, 6.6, t));
    grain(c, 1920, 1080, t, 0.025, 'multiply');
  }

  MG.film({
    id: 'logoreveal', dur: 10, poster: 9.4,
    fonts: [['700 112px Manrope', 'SOLVANE'], ['600 19px Manrope', 'PICTURES™'], ['500 15px "JetBrains Mono"', 'SOLVANE PICTURES — IDENT EXPLORATION TAKE 0123/ TC:V·']],
    meta: {
      family: 'J', name: 'Logo Reveal', sub: 'Brand Sting & Studio Ident', era: '1930s —',
      origin: 'Film studios turned their trademark into a few seconds of ceremony: the 20th Century Fox searchlight-and-fanfare ident (1935), MGM’s roaring lion and later Netflix’s “ta-dum” sonic logo with its 2019 ribbon ident. Identity studios such as Pentagram made the reveal a demonstration of the mark’s own geometry, so the logo appears to build itself from its construction.',
      works: '20th Century Fox ident and fanfare (Alfred Newman, 1933/1935) · MGM “Leo the Lion” · Netflix “ta-dum” sonic logo (2015) and ribbon ident (2019) · Pentagram identity motion for MIT Media Lab (2014) · Pixar’s Luxo Jr. lamp ident',
      tech: ['Mark defined by two tangent circles, reused for every take', 'Compass-swept construction circles and dimension guides', 'Outline traced with a line-dash pen, then an ink fill along the path', 'Source-atop light sweep; glyph-by-glyph tracking with font kerning kept'],
      accent: '#ff4f1f',
      motionDNA: 'Build-up, then one landing: construction lines and a pen trace lead to the moment the sun-dot springs in on the final note of the sonic logo, after which everything settles and holds still.',
      visualDNA: 'A geometric monogram on warm paper, ink black with one signal orange, a hairline grid, mono-type spec labels and a tightly kerned geometric sans wordmark.',
      transitions: 'Hard cuts between alternate takes, construction lines dissolving into the fill, light sweep, spring slide to lock-up.',
      implementation: ['After Effects', 'Cinema 4D', 'Lottie'],
      reproducibility: 'Fully procedural', loopable: false,
    },
    setup() {
      const r = rng(4021), parts = [];
      for (let i = 0; i < 1500; i++) {
        let x, y, o = false, s = 0;
        if (r() < 0.07) { const a = r() * TAU, rr = Math.sqrt(r()) * LR_W / 2; x = DOT[0] + Math.cos(a) * rr; y = DOT[1] + Math.sin(a) * rr; o = true; s = 0.3; }
        else { s = r(); const [px, py, tx, ty] = sPt(s), u = (r() - 0.5) * LR_W; x = px - ty * u; y = py + tx * u; }
        parts.push({ x, y, o, R: 520 + r() * 700, a: r() * TAU, d: s * 0.18 + r() * 0.08 });
      }
      return { parts, outline: sOutline(), mk: offscreen(600, 600) };
    },
    draw(c, t, W, H, st) {
      if (t < 1.55) lrTake1(c, t, st);
      else if (t < 3.15) lrTake2(c, t, st);
      else lrHero(c, t, st);
      // a two-frame white kiss at each cut
      [1.55, 3.15].forEach(ct => { const f = t >= ct ? decay(t, ct, 16) : 0; if (f > 0.02) { c.fillStyle = `rgba(255,255,255,${0.5 * f})`; c.fillRect(0, 0, W, H); } });
      const fin = 1 - sstep(0, 0.25, t);
      if (fin > 0) { c.fillStyle = `rgba(0,0,0,${fin})`; c.fillRect(0, 0, W, H); }
    },
    score(A) {
      A.bus.gain.value = 0.9;
      const r = rng(77);
      // TAKE 01 — particles: glittering swirl converging
      A.noise(0.05, { type: 'highpass', f: 5000, dur: 1.1, g: 0.05, swell: 0.85, rev: 0.6 });
      A.noise(0.1, { type: 'bandpass', f: 400, f2: 2400, q: 1.2, dur: 1.0, g: 0.08, swell: 0.9, rev: 0.4 });
      for (let i = 0; i < 26; i++) { const tt = 0.1 + Math.pow(i / 26, 0.7) * 0.95; A.osc(tt, { f: midi(84 + [0, 4, 7, 11, 14][i % 5]) , dur: 0.12, g: 0.018 + 0.02 * i / 26, rev: 0.6, pan: r() * 1.6 - 0.8 }); }
      A.bell(1.08, midi(79), { g: 0.07, dur: 1.4, rev: 0.6 }); A.bell(1.08, midi(91), { g: 0.03, dur: 1.0, rev: 0.6 });
      A.osc(1.08, { f: 98, f2: 60, glide: 0.4, dur: 0.6, g: 0.25 });
      // TAKE 02 — ribbon: zip whoosh along the path and a dry hit
      A.whoosh(1.58, 0.95, { f1: 250, f2: 4200, g: 0.2, swell: 0.75 });
      A.osc(1.62, { type: 'sawtooth', f: 180, f2: 720, glide: 0.88, dur: 0.9, g: 0.03, lp: 1200, lp2: 4000, lpT: 0.9, rev: 0.3 });
      A.kick(2.5, 0.7, { f: 120, f2: 40 });
      A.noise(2.5, { type: 'lowpass', f: 3000, f2: 300, dur: 0.4, g: 0.12, rev: 0.4 });
      A.pluck(2.5, midi(55), { g: 0.25, dur: 1.2, bright: 0.5, rev: 0.4 }); A.pluck(2.5, midi(67), { g: 0.16, dur: 1.2, bright: 0.5, rev: 0.4 });
      // TAKE 03 — construction: tick per grid line, compass scratches, pen
      for (let i = 0; i <= 7; i++) A.osc(3.2 + i * 0.035, { f: 2400 - i * 120, dur: 0.035, g: 0.03, pan: (i % 2 ? 0.4 : -0.4) });
      [3.6, 3.72, 3.86, 3.94, 4.0, 4.08, 4.16, 4.3].forEach((tt, i) => {
        A.noise(tt, { type: 'bandpass', f: 3200 + i * 200, q: 3, dur: 0.48, g: 0.025, swell: 0.3, pan: (i % 3 - 1) * 0.5 });
        A.osc(tt, { f: midi(72 + [0, 7, 12, 16, 19, 24, 28, 31][i]), dur: 0.5, g: 0.02, rev: 0.6, pan: (i % 2 ? 0.5 : -0.5) });
      });
      A.chord(3.2, [48, 55, 60, 64], { type: 'sawtooth', dur: 2.9, g: 0.012, a: 1.4, hold: true, rel: 0.8, lp: 700, spread: 6, width: 1.2, rev: 0.6 });
      A.noise(4.55, { type: 'bandpass', f: 5200, q: 2.5, dur: 1.05, g: 0.03, hold: true, a: 0.05, rel: 0.1 });
      A.riser(4.7, 1.3, { g: 0.12, f: 98 });
      // SONIC LOGO — four notes, the dot lands on the last
      const note = (tt, m, g, d = 1.8) => { A.pluck(tt, midi(m), { g, dur: d, bright: 0.6, decay: 0.997, rev: 0.45 }); A.bell(tt, midi(m), { g: g * 0.35, dur: d, rev: 0.5 }); };
      note(5.6, 67, 0.22); note(5.74, 72, 0.22); note(5.88, 79, 0.24);
      A.whoosh(5.55, 0.5, { f1: 400, f2: 5000, g: 0.14, swell: 0.9 });
      note(6.05, 76, 0.28, 2.6); note(6.05, 84, 0.16, 2.6);
      A.impact(6.05, 0.55, { rev: 0.5 }); A.kick(6.05, 0.75, { f: 110, f2: 38, dur: 0.6 });
      A.chord(6.05, [36, 48, 55, 62, 64, 71], { type: 'triangle', dur: 3.6, g: 0.035, a: 0.01, lp: 2400, lp2: 700, lpT: 3.5, spread: 5, width: 1.4, rev: 0.6 });
      // light sweep shimmer + lock-up
      A.noise(6.55, { type: 'highpass', f: 6000, dur: 0.6, g: 0.035, swell: 0.5, rev: 0.6 });
      A.whoosh(7.0, 0.45, { f1: 800, f2: 2400, g: 0.06, swell: 0.4 });
      'SOLVANE'.split('').forEach((_, i) => A.osc(7.22 + i * 0.045, { f: 3200, dur: 0.02, g: 0.012, pan: -0.3 + i * 0.1 }));
      A.bell(7.45, midi(79), { g: 0.05, dur: 2.0, rev: 0.7 }); A.bell(7.6, midi(84), { g: 0.05, dur: 2.4, rev: 0.7 });
      A.chord(7.4, [48, 55, 60, 64, 67, 74], { type: 'sine', dur: 2.6, g: 0.03, a: 0.8, hold: true, rel: 1.2, width: 1.5, rev: 0.7 });
    },
  });
  /* =====================================================================
     APP UI MOTION — "Fernly", a plant-care app, as a Dribbble shot.
     Splash → onboarding swipe → staggered list → tap ripple → shared-
     element hero → pull-to-refresh → toggle + slider → morphing button,
     check and confetti → app closes into its icon. Every move is a
     damped spring; the side panels print the SwiftUI spring in play.
     ===================================================================== */
  const IN = 'Inter, -apple-system, "Helvetica Neue", Arial, sans-serif';
  const SW = 393, SH = 852;
  const AP = { bg: '#f5f4ef', green: '#1f6b4f', greenD: '#134a36', lime: '#c8f07a', ink: '#101814', gray: '#6b746f', line: '#e7e5dd', terra: '#d9734e', sky: '#7db9e8', sun: '#f4c84b', pink: '#f29cb3' };
  const PLANTS = [
    { n: 'Fiddle Leaf Fig', sub: 'Water today', tint: '#f3e6d6', lvl: 0.18, k: 0 },
    { n: 'Monstera', sub: 'Water in 2 days', tint: '#dcebd3', lvl: 0.42, k: 1 },
    { n: 'Snake Plant', sub: 'Water in 9 days', tint: '#e4ecef', lvl: 0.86, k: 2 },
    { n: 'Golden Pothos', sub: 'Water in 4 days', tint: '#f6efcf', lvl: 0.6, k: 3 },
    { n: 'Calathea', sub: 'Mist tomorrow', tint: '#f4e1e4', lvl: 0.5, k: 4 },
  ];
  const cardY = i => 214 + i * 104;
  const sliderV = t => 0.3 + 0.48 * E.ioC(seg(t, 5.68, 6.1));
  const ml = v => Math.round((100 + v * 400) / 10) * 10;
  // finger keyframes in screen points: [t, x, y]
  const FK = [[1.3, 318, 600], [1.5, 312, 560], [1.82, 128, 560], [1.98, 160, 640], [2.13, 196, 780], [2.3, 220, 820],
    [2.95, 300, 460], [3.26, 232, 366], [3.45, 250, 400], [4.12, 214, 330], [4.28, 200, 300], [4.66, 200, 500], [4.9, 230, 520],
    [5.05, 300, 660], [5.27, 341, 606], [5.42, 300, 650], [5.62, 128, 692], [5.68, 128, 692], [6.1, 293, 692], [6.2, 280, 720], [6.38, 196, 782], [6.7, 230, 830]];
  const FDOWN = [[1.5, 1.82], [2.15, 2.25], [3.3, 3.42], [4.28, 4.68], [5.3, 5.38], [5.64, 6.15], [6.42, 6.52]];
  const FVIS = [[1.3, 2.42], [2.92, 3.55], [4.1, 4.9], [5.02, 6.72]];
  function finger(t) {
    let x = FK[0][1], y = FK[0][2];
    for (let i = 1; i < FK.length; i++) {
      if (t <= FK[i][0]) { const p = FK[i - 1], q = FK[i], u = E.ioC(clamp((t - p[0]) / (q[0] - p[0]))); x = lerp(p[1], q[1], u); y = lerp(p[2], q[2], u); break; }
      x = FK[i][1]; y = FK[i][2];
    }
    let down = 0; FDOWN.forEach(([a, b]) => { down = Math.max(down, sstep(a - 0.05, a, t) * (1 - sstep(b, b + 0.06, t))); });
    let vis = 0; FVIS.forEach(([a, b]) => { vis = Math.max(vis, sstep(a, a + 0.12, t) * (1 - sstep(b - 0.12, b, t))); });
    return { x, y, down, vis };
  }
  const STEPS = [
    [0.0, 'Splash', 'The icon springs in, then the screen irises open onto onboarding.', 2.2, 0.5, 0.25],
    [1.38, 'Onboarding swipe', 'The page tracks the finger; the illustration lags behind for parallax.', 1.6, 0.52, 1.82],
    [2.3, 'Staggered load', 'Cards rise 70 ms apart and skeletons resolve into content.', 2.4, 0.6, 2.5],
    [2.95, 'Tap · ripple', 'The card presses to 97% while a ripple radiates from the touch.', 3.2, 0.9, 3.3],
    [3.5, 'Shared element', 'The thumbnail becomes the hero and the title travels with it.', 1.6, 0.75, 3.55],
    [4.12, 'Pull to refresh', 'Rubber-band resistance, a hold while syncing, then a spring home.', 2.2, 0.45, 5.0],
    [5.02, 'Toggle & slider', 'The knob stretches in flight; a tooltip tracks the thumb.', 2.6, 0.55, 5.3],
    [6.2, 'Success', 'The button morphs into a loader and lands as a check with confetti.', 3.0, 0.3, 6.95],
  ];

  function leaf(c, x, y, ang, len, wid, col, rib = 'rgba(255,255,255,0.28)') {
    c.save(); c.translate(x, y); c.rotate(ang);
    c.fillStyle = col; c.beginPath(); c.moveTo(0, 0);
    c.bezierCurveTo(wid * 0.9, -len * 0.15, wid * 0.7, -len * 0.85, 0, -len);
    c.bezierCurveTo(-wid * 0.7, -len * 0.85, -wid * 0.9, -len * 0.15, 0, 0); c.fill();
    c.strokeStyle = rib; c.lineWidth = Math.max(0.6, wid * 0.06); c.beginPath(); c.moveTo(0, -len * 0.05); c.lineTo(0, -len * 0.88); c.stroke();
    c.restore();
  }
  // flat plant in a terracotta pot; (cx, by) = bottom centre of the pot, s = overall height
  function drawPlant(c, cx, by, s, k, bgCol) {
    const ph = s * 0.34, tw = s * 0.46, bw = s * 0.34, top = by - ph;
    const G1 = '#2f7d57', G2 = '#3f9a68', G3 = '#24603f';
    c.save();
    if (k === 0) { // fiddle leaf: broad leaves up a stem
      c.strokeStyle = '#6b5a3e'; c.lineWidth = s * 0.025; c.beginPath(); c.moveTo(cx, top); c.lineTo(cx, top - s * 0.55); c.stroke();
      [[-0.9, 0.18, G3], [0.85, 0.24, G1], [-0.6, 0.36, G2], [0.55, 0.46, G1], [-0.1, 0.56, G2]].forEach(([a, h, col]) => leaf(c, cx, top - s * h, a, s * 0.3, s * 0.15, col));
    } else if (k === 1) { // monstera
      [[-1.05, 0.34, G3], [1.0, 0.36, G1], [-0.35, 0.5, G2], [0.4, 0.48, G1], [0.02, 0.6, G2]].forEach(([a, len, col], i) => {
        c.strokeStyle = '#3d7a4f'; c.lineWidth = s * 0.018; const ex = cx + Math.sin(a) * s * len * 0.5, ey = top - Math.cos(a) * s * len * 0.5;
        c.beginPath(); c.moveTo(cx, top); c.lineTo(ex, ey); c.stroke();
        c.save(); c.translate(ex, ey); c.rotate(a);
        c.fillStyle = col; c.beginPath(); c.ellipse(0, -s * len * 0.28, s * 0.17, s * len * 0.32, 0, 0, TAU); c.fill();
        c.strokeStyle = bgCol; c.lineWidth = s * 0.016; c.lineCap = 'round';
        for (let j = 0; j < 3; j++) { const yy = -s * len * (0.12 + j * 0.15); c.beginPath(); c.moveTo(s * 0.18, yy); c.lineTo(s * 0.08, yy - s * 0.02); c.moveTo(-s * 0.18, yy - s * 0.04); c.lineTo(-s * 0.08, yy - s * 0.06); c.stroke(); }
        c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = s * 0.01; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * len * 0.55); c.stroke();
        c.restore(); void i;
      });
    } else if (k === 2) { // snake plant
      [[-0.22, 0.62, G3], [0.18, 0.7, G1], [-0.05, 0.8, G2], [0.36, 0.5, G3], [-0.42, 0.48, G1]].forEach(([a, len, col]) => {
        c.save(); c.translate(cx + a * s * 0.25, top + s * 0.02); c.rotate(a * 0.35);
        c.fillStyle = '#d8c25a'; c.beginPath(); c.moveTo(-s * 0.06, 0); c.quadraticCurveTo(-s * 0.07, -s * len * 0.6, 0, -s * len); c.quadraticCurveTo(s * 0.07, -s * len * 0.6, s * 0.06, 0); c.fill();
        c.fillStyle = col; c.beginPath(); c.moveTo(-s * 0.045, 0); c.quadraticCurveTo(-s * 0.055, -s * len * 0.6, 0, -s * len * 0.96); c.quadraticCurveTo(s * 0.055, -s * len * 0.6, s * 0.045, 0); c.fill();
        c.restore();
      });
    } else if (k === 3) { // pothos: heart leaves spilling over
      [[-1.9, 0.05, G2, -0.25], [1.9, 0.05, G1, 0.25], [-1.2, 0.2, G1, -0.2], [1.2, 0.22, G2, 0.18], [-0.4, 0.35, G2, -0.05], [0.4, 0.38, G1, 0.05], [0, 0.48, '#7fb34f', 0]].forEach(([a, h, col, dx]) => leaf(c, cx + dx * s, top - s * h + s * 0.04, a, s * 0.2, s * 0.15, col));
    } else { // calathea: striped ovals
      [[-0.9, G3], [0.9, G1], [-0.4, G2], [0.4, G3], [0, G1]].forEach(([a, col], i) => {
        c.save(); c.translate(cx, top); c.rotate(a);
        c.fillStyle = col; c.beginPath(); c.ellipse(0, -s * 0.33, s * 0.11, s * 0.24, 0, 0, TAU); c.fill();
        c.strokeStyle = 'rgba(244,190,200,0.55)'; c.lineWidth = s * 0.012;
        for (let j = 0; j < 4; j++) { const yy = -s * (0.18 + j * 0.07); c.beginPath(); c.moveTo(0, yy); c.lineTo(s * 0.08, yy - s * 0.04); c.moveTo(0, yy); c.lineTo(-s * 0.08, yy - s * 0.04); c.stroke(); }
        c.restore(); void i;
      });
    }
    // pot
    c.fillStyle = AP.terra; c.beginPath(); c.moveTo(cx - tw / 2, top); c.lineTo(cx + tw / 2, top); c.lineTo(cx + bw / 2, by); c.lineTo(cx - bw / 2, by); c.closePath(); c.fill();
    c.fillStyle = '#c45f3d'; rrect(c, cx - tw * 0.56, top - ph * 0.04, tw * 1.12, ph * 0.24, s * 0.02); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.14)'; c.beginPath(); c.moveTo(cx - tw * 0.32, top + ph * 0.2); c.lineTo(cx - tw * 0.2, top + ph * 0.2); c.lineTo(cx - bw * 0.16, by - ph * 0.08); c.lineTo(cx - bw * 0.3, by - ph * 0.08); c.fill();
    c.restore();
  }
  function appIconArt(c, x, y, s, r, h = s) { // squircle-ish app icon with leaf glyph
    const g = c.createLinearGradient(x, y, x + s, y + h); g.addColorStop(0, '#2a8a62'); g.addColorStop(1, '#0f4a33');
    c.fillStyle = g; rrect(c, x, y, s, h, r); c.fill();
    c.save(); c.translate(x + s / 2, y + h / 2); c.scale(s / 100, s / 100);
    c.fillStyle = AP.lime; c.beginPath(); c.moveTo(-4, 30); c.bezierCurveTo(-34, 10, -26, -26, 18, -32); c.bezierCurveTo(26, 6, 16, 28, -4, 30); c.fill();
    c.strokeStyle = '#0f4a33'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-10, 38); c.quadraticCurveTo(-2, 8, 14, -22); c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(22, 22, 7, 0, TAU); c.fill();
    c.restore();
  }
  function statusBar(c, dark) {
    const col = dark ? '#fff' : AP.ink;
    fnt(c, 600, 16, IN); c.fillStyle = col; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText('9:41', 64, 34);
    for (let i = 0; i < 4; i++) { c.globalAlpha = 1; rrect(c, 290 + i * 5, 30 - (4 + i * 2.4), 3.2, 4 + i * 2.4, 1); c.fill(); }
    c.strokeStyle = col; c.lineWidth = 1.8; c.lineCap = 'round';
    [8, 5, 2].forEach((r, i) => { c.beginPath(); c.arc(321, 31, r, -PI * 0.75, -PI * 0.25); c.stroke(); void i; });
    c.globalAlpha = 0.4; rrect(c, 335, 21, 25, 12, 3.5); c.lineWidth = 1; c.stroke(); c.globalAlpha = 1;
    rrect(c, 337, 23, 18, 8, 2); c.fill(); rrect(c, 361, 25, 1.6, 4, 1); c.fill();
  }

  function screenSplash(c, t) {
    c.fillStyle = AP.green; c.fillRect(0, 0, SW, SH);
    const g = c.createRadialGradient(196, 380, 10, 196, 426, 520); g.addColorStop(0, 'rgba(200,240,122,0.22)'); g.addColorStop(1, 'rgba(0,0,0,0.15)');
    c.fillStyle = g; c.fillRect(0, 0, SW, SH);
    const k = spring(t - 0.25, 2.2, 0.5), out = E.inC(seg(t, 1.0, 1.3));
    c.save(); c.translate(196.5, 396); c.scale(k * (1 + out * 2.5), k * (1 + out * 2.5)); c.globalAlpha = 1 - out;
    c.shadowColor = 'rgba(0,0,0,0.25)'; c.shadowBlur = 30; c.shadowOffsetY = 12;
    appIconArt(c, -56, -56, 112, 30); c.restore();
    const wk = spring(t - 0.55, 2.4, 0.7);
    c.globalAlpha = clamp((t - 0.55) / 0.2) * (1 - out);
    fnt(c, 700, 30, IN); setLS(c, -0.6); c.fillStyle = '#fff'; c.textAlign = 'center';
    c.fillText('fernly', 196.5, 512 + (1 - wk) * 16); setLS(c, 0);
    fnt(c, 500, 13, IN); c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillText('plant care, simplified', 196.5, 536 + (1 - wk) * 20);
    c.globalAlpha = 1;
  }
  function onboardPage(c, ox, iox, page, t) {
    const ill = [
      () => { c.fillStyle = AP.lime; c.beginPath(); c.arc(196 + iox, 300, 130, 0, TAU); c.fill(); c.fillStyle = 'rgba(31,107,79,0.12)'; c.beginPath(); c.arc(270 + iox, 220, 34, 0, TAU); c.fill(); drawPlant(c, 196 + iox, 420, 250, 1, AP.lime); },
      () => {
        c.fillStyle = '#cfe5f7'; c.beginPath(); c.arc(196 + iox, 300, 130, 0, TAU); c.fill();
        c.save(); c.translate(196 + iox, 300 + Math.sin(t * 5) * 4);
        c.fillStyle = '#4a9ad8'; c.beginPath(); c.moveTo(0, -78); c.bezierCurveTo(30, -36, 54, -6, 54, 22); c.arc(0, 22, 54, 0, PI); c.bezierCurveTo(-54, -6, -30, -36, 0, -78); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.ellipse(-22, 18, 9, 18, 0.3, 0, TAU); c.fill();
        c.restore();
        c.fillStyle = '#fff'; rrect(c, 250 + iox, 190, 92, 48, 14); c.fill();
        fnt(c, 700, 13, IN); c.fillStyle = AP.ink; c.textAlign = 'left'; c.fillText('9:00', 264 + iox, 210); fnt(c, 500, 11, IN); c.fillStyle = AP.gray; c.fillText('Water 250 ml', 264 + iox, 226);
      },
    ][page];
    ill();
    const T = [['Grow with care', 'Track every plant in one calm place,', 'from first leaf to full bloom.'], ['Never miss a drink', 'Gentle reminders tuned to each plant,', 'its light, and the season.']][page];
    c.textAlign = 'center'; fnt(c, 700, 30, IN); setLS(c, -0.7); c.fillStyle = AP.ink; c.fillText(T[0], 196.5 + ox, 520); setLS(c, 0);
    fnt(c, 400, 16, IN); c.fillStyle = AP.gray; c.fillText(T[1], 196.5 + ox, 556); c.fillText(T[2], 196.5 + ox, 579);
  }
  function screenOnboard(c, t) {
    c.fillStyle = '#f3efe6'; c.fillRect(0, 0, SW, SH);
    const drag = t < 1.52 ? 0 : t < 1.82 ? -184 * E.ioC(seg(t, 1.52, 1.82)) : -184;
    const po = t < 1.82 ? drag : lerp(-184, -SW, spring(t - 1.82, 2.0, 0.72));
    const io = t < 1.82 ? drag * 0.62 : lerp(-184 * 0.62, -SW, spring(t - 1.86, 1.6, 0.52));
    c.save(); onboardPage(c, po, io, 0, t); c.restore();
    c.save(); onboardPage(c, po + SW, io + SW, 1, t); c.restore();
    // page dots: active pill stretches between dots
    const pr = clamp(-po / SW), cx = 196.5;
    for (let i = 0; i < 3; i++) { c.fillStyle = 'rgba(16,24,20,0.18)'; c.beginPath(); c.arc(cx - 16 + i * 16, 640, 4, 0, TAU); c.fill(); }
    const a = cx - 16 + 16 * E.ioC(clamp(pr * 1.4)), b = cx - 16 + 16 * E.ioC(clamp(pr * 1.4 - 0.4)) ;
    c.fillStyle = AP.green; rrect(c, Math.min(a, b) - 4, 636, Math.abs(a - b) + 8 + 12, 8, 4); c.fill();
    // CTA
    const press = sstep(2.15, 2.19, t) * (1 - sstep(2.25, 2.33, t));
    c.save(); c.translate(196.5, 780); c.scale(1 - press * 0.04, 1 - press * 0.04);
    c.fillStyle = press > 0 ? AP.greenD : AP.green; rrect(c, -172.5, -28, 345, 56, 28); c.fill();
    fnt(c, 600, 17, IN); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
    { const sw2 = E.ioC(sstep(0.35, 0.75, pr)); c.save(); c.beginPath(); c.rect(-172, -28, 344, 56); c.clip(); c.globalAlpha = 1 - sw2; c.fillText('Next', 0, 1 - 22 * sw2); c.globalAlpha = sw2; c.fillText('Get started', 0, 1 + 22 * (1 - sw2)); c.restore(); } c.textBaseline = 'alphabetic';
    c.restore();
    fnt(c, 500, 15, IN); c.fillStyle = AP.gray; c.textAlign = 'right'; c.fillText('Skip', 360, 84);
  }
  function plantCard(c, i, x, y, w, h, t, skel) {
    const P = PLANTS[i];
    c.fillStyle = '#fff'; rrect(c, x, y, w, h, 20); c.fill();
    if (skel > 0.001) {
      c.save(); c.globalAlpha *= skel;
      const sh = (t * 1.6 + i * 0.12) % 1.6 - 0.3;
      const g = c.createLinearGradient(x + sh * w - 80, 0, x + sh * w + 80, 0); g.addColorStop(0, '#eceae3'); g.addColorStop(0.5, '#f7f6f1'); g.addColorStop(1, '#eceae3');
      c.fillStyle = g; rrect(c, x + 12, y + 12, 68, 68, 16); c.fill(); rrect(c, x + 96, y + 28, 130, 13, 6); c.fill(); rrect(c, x + 96, y + 52, 86, 11, 5); c.fill();
      c.restore();
    }
    if (skel < 0.999) {
      c.save(); c.globalAlpha *= 1 - skel;
      c.fillStyle = P.tint; rrect(c, x + 12, y + 12, 68, 68, 16); c.fill();
      c.save(); c.beginPath(); rrect(c, x + 12, y + 12, 68, 68, 16); c.clip(); drawPlant(c, x + 46, y + 76, 56, P.k, P.tint); c.restore();
      fnt(c, 600, 17, IN); setLS(c, -0.3); c.fillStyle = AP.ink; c.textAlign = 'left'; c.fillText(P.n, x + 96, y + 41); setLS(c, 0);
      c.fillStyle = P.lvl < 0.25 ? AP.terra : AP.sky; c.beginPath(); c.moveTo(x + 100, y + 54); c.quadraticCurveTo(x + 105, y + 61, x + 104, y + 63); c.arc(x + 100, y + 62, 4, 0, PI); c.quadraticCurveTo(x + 95, y + 61, x + 100, y + 54); c.fill();
      fnt(c, 500, 14, IN); c.fillStyle = P.lvl < 0.25 ? AP.terra : AP.gray; c.fillText(P.sub, x + 111, y + 65);
      const rx = x + w - 38, ry = y + h / 2;
      c.lineWidth = 4; c.strokeStyle = AP.line; c.beginPath(); c.arc(rx, ry, 15, 0, TAU); c.stroke();
      c.strokeStyle = P.lvl < 0.25 ? AP.terra : AP.green; c.lineCap = 'round'; c.beginPath(); c.arc(rx, ry, 15, -PI / 2, -PI / 2 + TAU * P.lvl * E.outC(seg(t, 2.9 + i * 0.05, 3.5 + i * 0.05))); c.stroke(); c.lineCap = 'butt';
      fnt(c, 700, 9, IN); c.fillStyle = AP.ink; c.textAlign = 'center'; c.fillText(Math.round(P.lvl * 100) + '', rx, ry + 3.5);
      c.restore();
    }
  }
  function screenList(c, t, hideCard, fadeOthers) {
    c.fillStyle = AP.bg; c.fillRect(0, 0, SW, SH);
    const hk = spring(t - 2.42, 2.2, 0.75);
    c.save(); c.globalAlpha = clamp((t - 2.42) / 0.2) * (1 - fadeOthers);
    fnt(c, 500, 15, IN); c.fillStyle = AP.gray; c.textAlign = 'left'; c.fillText('Good morning, Ana', 24, 98 + (1 - hk) * 10);
    fnt(c, 800, 34, IN); setLS(c, -1); c.fillStyle = AP.ink; c.fillText('My plants', 24, 138 + (1 - hk) * 14); setLS(c, 0);
    c.fillStyle = '#fff'; c.beginPath(); c.arc(347, 116, 22, 0, TAU); c.fill(); c.fillStyle = AP.lime; c.beginPath(); c.arc(347, 116, 18, 0, TAU); c.fill();
    fnt(c, 700, 14, IN); c.fillStyle = AP.greenD; c.textAlign = 'center'; c.fillText('A', 347, 121);
    ['All 5', 'Indoor', 'Balcony', 'Office'].forEach((s, i) => {
      const ck = spring(t - 2.48 - i * 0.04, 2.6, 0.65), x = 24 + [0, 74, 154, 246][i];
      c.save(); c.translate(0, (1 - ck) * 12); c.globalAlpha *= clamp(ck);
      fnt(c, 600, 14, IN); const w = c.measureText(s).width + 28;
      c.fillStyle = i === 0 ? AP.ink : '#fff'; rrect(c, x, 158, w, 34, 17); c.fill();
      c.fillStyle = i === 0 ? '#fff' : AP.ink; c.textAlign = 'left'; c.fillText(s, x + 14, 180); c.restore();
    });
    c.restore();
    for (let i = 0; i < PLANTS.length; i++) {
      if (i === hideCard) continue;
      const ti = 2.5 + i * 0.07, k = spring(t - ti, 2.4, 0.6);
      if (t < ti) continue;
      c.save();
      const push = fadeOthers * (i < 1 ? -30 : 40);
      c.globalAlpha = clamp((t - ti) / 0.16) * (1 - fadeOthers);
      const y = cardY(i) + (1 - k) * 46 + push;
      c.shadowColor = 'rgba(16,24,20,0.06)'; c.shadowBlur = 18; c.shadowOffsetY = 6;
      let sc = 1;
      if (i === 1) sc = 1 - 0.03 * sstep(3.3, 3.36, t) * (1 - sstep(3.44, 3.52, t));
      c.translate(196.5, y + 46); c.scale(sc, sc); c.translate(-196.5, -y - 46);
      plantCard(c, i, 16, y, 361, 92, t, 1 - sstep(2.86 + i * 0.05, 3.06 + i * 0.05, t));
      c.shadowColor = 'transparent';
      if (i === 1 && t > 3.3) { // ripple
        const rp = seg(t, 3.3, 3.85);
        c.save(); c.beginPath(); rrect(c, 16, y, 361, 92, 20); c.clip();
        c.fillStyle = `rgba(31,107,79,${0.16 * (1 - rp)})`; c.beginPath(); c.arc(232, 366, 30 + 360 * E.outQn(rp), 0, TAU); c.fill(); c.restore();
      }
      c.restore();
    }
    // tab bar
    c.save(); c.globalAlpha = clamp((t - 2.45) / 0.2) * (1 - fadeOthers);
    c.fillStyle = 'rgba(255,255,255,0.92)'; c.fillRect(0, 768, SW, 84); c.fillStyle = AP.line; c.fillRect(0, 768, SW, 1);
    [0, 1, 2, 3].forEach(i => { const x = 56 + i * 94; c.fillStyle = i === 0 ? AP.green : '#b5bab4'; rrect(c, x - 11, 786, 22, 22, i === 2 ? 11 : 6); c.fill(); });
    c.restore();
  }
  // detail view; k = shared-element progress (0 card, 1 hero), off = pull offset
  function screenDetail(c, t, k, off, st) {
    const y0 = cardY(1);
    const kk = clamp(k, 0, 1.08);
    // container morph
    const cx = lerp(16, 0, kk), cy = lerp(y0, 0, kk), cw = lerp(361, SW, kk), ch = lerp(92, SH, kk), cr = lerp(20, 0, clamp(kk));
    c.fillStyle = AP.bg; rrect(c, cx, cy, cw, ch, cr); c.fill();
    c.save(); c.beginPath(); rrect(c, cx, cy, cw, ch, cr); c.clip();
    c.translate(0, off);
    const P = PLANTS[1];
    // hero
    const hx = lerp(28, 0, kk), hy = lerp(y0 + 12, -off, kk) , hw = lerp(68, SW, kk), hh = lerp(68, 384 + off, kk), hr = lerp(16, 0, clamp(kk));
    c.fillStyle = P.tint; rrect(c, hx, hy, hw, hh, hr); c.fill();
    c.save(); c.beginPath(); rrect(c, hx, hy, hw, hh, hr); c.clip();
    const bs = lerp(68, 384, kk);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(hx + hw / 2, hy + hh - bs * 0.48, bs * 0.38, 0, TAU); c.fill();
    drawPlant(c, hx + hw / 2, hy + hh - bs * 0.06, bs * 0.82, 1, P.tint);
    c.restore();
    // hero chrome
    const ca = sstep(3.95, 4.15, t);
    if (ca > 0) {
      c.globalAlpha = ca;
      [[40, 'back'], [353, 'fav']].forEach(([x, kind]) => {
        c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.arc(x, 78, 20, 0, TAU); c.fill();
        c.strokeStyle = AP.ink; c.lineWidth = 2.2; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
        if (kind === 'back') { c.moveTo(x + 3, 70); c.lineTo(x - 5, 78); c.lineTo(x + 3, 86); }
        else { c.moveTo(x, 86); c.bezierCurveTo(x - 12, 78, x - 8, 68, x, 73); c.bezierCurveTo(x + 8, 68, x + 12, 78, x, 86); }
        c.stroke();
      });
      c.globalAlpha = 1;
    }
    // travelling title
    const tx = lerp(112, 24, kk), ty = lerp(y0 + 41, 432, kk), ts = lerp(17, 32, kk);
    fnt(c, lerp(600, 800, clamp(kk)) | 0, ts, IN); setLS(c, lerp(-0.3, -1, clamp(kk))); c.fillStyle = AP.ink; c.textAlign = 'left'; c.fillText(P.n, tx, ty); setLS(c, 0);
    c.globalAlpha = 1 - clamp(kk * 3);
    fnt(c, 500, 14, IN); c.fillStyle = AP.gray; c.fillText(P.sub, lerp(127, 40, kk), lerp(y0 + 65, 460, kk));
    c.globalAlpha = 1;
    // detail body, staggered in
    const rows = (i) => { const p = spring(t - 3.72 - i * 0.05, 2.2, 0.72); return [clamp((t - 3.72 - i * 0.05) / 0.18), (1 - p) * 40]; };
    let [a, dy] = rows(0);
    c.globalAlpha = a; fnt(c, 400, 15, IN); c.font = `italic 400 15px ${IN}`; c.fillStyle = AP.gray; c.fillText('Monstera deliciosa · Living room', 24, 460 + dy);
    [a, dy] = rows(1); c.globalAlpha = a;
    const moist = t < 5.0 ? 42 : 38, roll = E.outB(seg(t, 5.0, 5.35));
    [['Moisture', moist + '%', AP.sky], ['Light', 'Bright', AP.sun], ['Temp', '22°', AP.terra]].forEach(([lab, val, col], i) => {
      const x = 24 + i * 119; c.fillStyle = '#fff'; rrect(c, x, 482 + dy, 107, 72, 18); c.fill();
      c.fillStyle = col; c.beginPath(); c.arc(x + 20, 502 + dy, 5, 0, TAU); c.fill();
      fnt(c, 500, 12, IN); c.fillStyle = AP.gray; c.textAlign = 'left'; c.fillText(lab, x + 32, 506 + dy);
      fnt(c, 700, 22, IN); c.fillStyle = AP.ink;
      if (i === 0 && t > 4.98 && t < 5.4) {
        c.save(); c.beginPath(); c.rect(x + 10, 516 + dy, 90, 32); c.clip();
        c.fillText('42%', x + 16, 540 + dy - roll * 28); c.fillText('38%', x + 16, 568 + dy - roll * 28); c.restore();
      } else c.fillText(val, x + 16, 540 + dy);
    });
    c.globalAlpha = sstep(5.05, 5.25, t) * (1 - sstep(6.3, 6.5, t));
    fnt(c, 500, 11, IN); c.fillStyle = AP.green; c.textAlign = 'right'; c.fillText('Updated just now', 369, 474 + dy);
    // reminders toggle
    [a, dy] = rows(2); c.globalAlpha = a;
    c.fillStyle = '#fff'; rrect(c, 16, 574 + dy, 361, 62, 18); c.fill();
    fnt(c, 600, 16, IN); c.fillStyle = AP.ink; c.textAlign = 'left'; c.fillText('Reminders', 34, 601 + dy);
    fnt(c, 400, 13, IN); c.fillStyle = AP.gray; c.fillText('Every 7 days · 9:00', 34, 620 + dy);
    const tp = t < 5.3 ? 0 : spring(t - 5.3, 2.6, 0.55), bump = Math.sin(PI * clamp((t - 5.3) / 0.26));
    c.fillStyle = rgba(mix(hex('#dcdcd6'), hex(AP.green), clamp(tp))); rrect(c, 316, 590 + dy, 51, 31, 15.5); c.fill();
    const kw = 27 + 9 * bump, kx = lerp(318, 367 - 2 - kw, tp);
    c.shadowColor = 'rgba(0,0,0,0.18)'; c.shadowBlur = 6; c.shadowOffsetY = 2; c.fillStyle = '#fff'; rrect(c, kx, 592 + dy, kw, 27, 13.5); c.fill(); c.shadowColor = 'transparent';
    // slider
    [a, dy] = rows(3); c.globalAlpha = a;
    c.fillStyle = '#fff'; rrect(c, 16, 646 + dy, 361, 82, 18); c.fill();
    const v = sliderV(t);
    fnt(c, 600, 16, IN); c.fillStyle = AP.ink; c.textAlign = 'left'; c.fillText('Water amount', 34, 674 + dy);
    fnt(c, 700, 16, IN); c.textAlign = 'right'; c.fillStyle = AP.green; c.fillText(ml(v) + ' ml', 359, 674 + dy);
    const x0 = 34, x1 = 359, kxs = lerp(x0, x1, v);
    c.fillStyle = AP.line; rrect(c, x0, 701 + dy, x1 - x0, 6, 3); c.fill();
    c.fillStyle = AP.green; rrect(c, x0, 701 + dy, kxs - x0, 6, 3); c.fill();
    for (let i = 0; i <= 8; i++) { c.fillStyle = 'rgba(16,24,20,0.15)'; c.fillRect(lerp(x0, x1, i / 8) - 0.5, 714 + dy, 1, 4); }
    const touch = t < 5.64 ? 0 : (t < 6.15 ? spring(t - 5.64, 3, 0.5) : 1 - spring(t - 6.15, 3, 0.6));
    const kr = 12 + 4 * touch;
    c.shadowColor = 'rgba(0,0,0,0.2)'; c.shadowBlur = 8; c.shadowOffsetY = 2; c.fillStyle = '#fff'; c.beginPath(); c.arc(kxs, 704 + dy, kr, 0, TAU); c.fill(); c.shadowColor = 'transparent';
    c.fillStyle = AP.green; c.beginPath(); c.arc(kxs, 704 + dy, 4, 0, TAU); c.fill();
    if (touch > 0.01) { // value tooltip
      c.save(); c.translate(kxs, 676 + dy); c.scale(clamp(touch, 0, 1.2), clamp(touch, 0, 1.2)); c.translate(0, -10 * (1 - touch));
      c.fillStyle = AP.ink; rrect(c, -34, -46, 68, 30, 10); c.fill(); c.beginPath(); c.moveTo(-6, -17); c.lineTo(0, -10); c.lineTo(6, -17); c.fill();
      fnt(c, 700, 13, IN); c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(ml(v) + ' ml', 0, -26); c.restore();
    }
    // CTA morph → loader → check
    [a, dy] = rows(4); c.globalAlpha = a;
    const mk = t < 6.48 ? 0 : spring(t - 6.48, 2.3, 0.78);
    const press = sstep(6.42, 6.46, t) * (1 - sstep(6.5, 6.58, t));
    const done = t < 6.95 ? 0 : spring(t - 6.95, 3.0, 0.3);
    const bw = lerp(345, 56, clamp(mk, 0, 1.05)), bsc = (1 - press * 0.04) * (t < 6.95 ? 1 : 0.84 + 0.16 * done);
    c.save(); c.translate(196.5, 780 + dy); c.scale(bsc, bsc);
    c.fillStyle = t < 6.95 ? AP.green : rgba(mix(hex(AP.green), hex('#2a8a62'), clamp(done))); rrect(c, -bw / 2, -28, bw, 56, 28); c.fill();
    c.globalAlpha = a * (1 - clamp(mk * 4));
    fnt(c, 600, 17, IN); c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Water now', 0, 1); c.textBaseline = 'alphabetic';
    c.globalAlpha = a;
    if (t > 6.6 && t < 7.0) { const sp = (t - 6.6) * 9; c.strokeStyle = '#fff'; c.lineWidth = 3; c.lineCap = 'round'; c.globalAlpha = a * sstep(6.6, 6.68, t) * (1 - sstep(6.92, 6.98, t)); c.beginPath(); c.arc(0, 0, 13, sp, sp + 4.2); c.stroke(); c.globalAlpha = a; }
    if (t > 6.97) {
      const cp = E.outC(seg(t, 6.98, 7.2));
      c.strokeStyle = '#fff'; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round';
      const pts = [[-11, 1], [-3, 9], [12, -8]], L1 = Math.hypot(8, 8), L2 = Math.hypot(15, 17), L = (L1 + L2) * cp;
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
      if (L <= L1) c.lineTo(pts[0][0] + 8 * L / L1, pts[0][1] + 8 * L / L1);
      else { c.lineTo(pts[1][0], pts[1][1]); const u = (L - L1) / L2; c.lineTo(pts[1][0] + 15 * u, pts[1][1] - 17 * u); }
      c.stroke();
      const rg = seg(t, 6.95, 7.5);
      c.strokeStyle = `rgba(42,138,98,${0.5 * (1 - rg)})`; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, 28 + 40 * E.outC(rg), 0, TAU); c.stroke();
    }
    c.restore();
    c.globalAlpha = 1;
    c.restore();
    // pull-to-refresh spinner sits in the gap above the content
    if (off > 18) {
      const pa = clamp((off - 18) / 50), spin = t > 4.68 ? (t - 4.68) * 10 : 0;
      c.save(); c.globalAlpha = pa * (1 - sstep(5.0, 5.12, t));
      c.translate(196.5, off - 30); c.rotate(spin);
      c.strokeStyle = AP.green; c.lineWidth = 3; c.lineCap = 'round';
      c.beginPath(); c.arc(0, 0, 11, 0, t > 4.68 ? 4.4 : 5.6 * clamp(off / 110)); c.stroke(); c.restore();
    }
    // confetti
    if (t > 7.0) {
      const ct = t - 7.0;
      st.conf.forEach(q => {
        const tt = ct - q.d; if (tt <= 0) return;
        const dr = Math.exp(-tt * 1.6), x = 196.5 + q.vx * (1 - dr) / 1.6, y = 780 + q.vy * (1 - dr) / 1.6 + 380 * tt * tt * 0.5 * 1.6;
        const al = 1 - sstep(1.0, 1.5, tt); if (al <= 0) return;
        c.save(); c.translate(x, y); c.rotate(q.r + tt * q.w); c.globalAlpha = al; c.fillStyle = q.c;
        if (q.s === 0) c.fillRect(-4, -2.5, 8, 5); else if (q.s === 1) { c.beginPath(); c.arc(0, 0, 3.4, 0, TAU); c.fill(); }
        else { c.scale(1, Math.cos(tt * q.w * 1.3)); c.fillRect(-2, -6, 4, 12); }
        c.restore();
      });
    }
  }
  function dynamicIsland(c, t) {
    // states: idle 125×37, sync 190×37 (4.7–5.05), success 330×64 (7.05–7.8)
    const sy = (t < 4.7 ? 0 : spring(t - 4.7, 2.6, 0.62)) - (t < 5.06 ? 0 : spring(t - 5.06, 2.6, 0.7));
    const su = (t < 7.05 ? 0 : spring(t - 7.05, 2.1, 0.62)) - (t < 7.78 ? 0 : spring(t - 7.78, 2.4, 0.75));
    const w = 125 + 65 * sy + 210 * su, h = 37 + 31 * su, r = h / 2;
    c.fillStyle = '#000'; rrect(c, 196.5 - w / 2, 11, w, h, r); c.fill();
    if (sy > 0.3) {
      c.save(); c.globalAlpha = clamp((sy - 0.3) / 0.5); c.strokeStyle = AP.lime; c.lineWidth = 2.4; c.lineCap = 'round';
      c.beginPath(); c.arc(196.5 + w / 2 - 20, 29.5, 7, t * 9, t * 9 + 4.3); c.stroke();
      c.fillStyle = AP.lime; c.beginPath(); c.arc(196.5 - w / 2 + 20, 29.5, 6, 0, TAU); c.fill(); c.restore();
    }
    if (su > 0.4) {
      c.save(); c.globalAlpha = clamp((su - 0.4) / 0.5);
      c.beginPath(); rrect(c, 196.5 - w / 2, 11, w, h, r); c.clip();
      const lx = 196.5 - w / 2;
      appIconArt(c, lx + 14, 22, 42, 12);
      fnt(c, 600, 14, IN); c.fillStyle = '#fff'; c.textAlign = 'left'; c.fillText('Monstera watered', lx + 66, 39);
      fnt(c, 500, 12, IN); c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillText(ml(sliderV(9)) + ' ml · next in 7 days', lx + 66, 56);
      const ex = 196.5 + w / 2 - 32;
      c.fillStyle = AP.lime; c.beginPath(); c.arc(ex, 43, 14, 0, TAU); c.fill();
      c.strokeStyle = AP.greenD; c.lineWidth = 2.6; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(ex - 6, 43); c.lineTo(ex - 2, 47); c.lineTo(ex + 6, 38); c.stroke();
      c.restore();
    }
  }
  function appScreen(c, t, st) {
    let dark = false;
    if (t < 1.35) {
      screenSplash(c, t); dark = true;
      if (t > 1.05) { // iris onto onboarding
        const r = 900 * E.ioC(seg(t, 1.05, 1.35));
        c.save(); c.beginPath(); c.arc(196.5, 396, r, 0, TAU); c.clip(); screenOnboard(c, t); c.restore();
        if (r > 300) dark = false;
      }
    } else if (t < 2.75) {
      const pk = t < 2.28 ? 0 : spring(t - 2.28, 1.8, 0.86);
      if (pk < 1) { c.save(); c.translate(-SW * 0.3 * pk, 0); screenOnboard(c, t); c.fillStyle = `rgba(0,0,0,${0.12 * pk})`; c.fillRect(0, 0, SW, SH); c.restore(); }
      if (pk > 0) { c.save(); c.translate(SW * (1 - pk), 0); c.shadowColor = 'rgba(0,0,0,0.15)'; c.shadowBlur = 30; c.fillStyle = AP.bg; c.fillRect(0, 0, SW, SH); c.shadowColor = 'transparent'; screenList(c, t, -1, 0); c.restore(); }
    } else if (t < 3.55) {
      screenList(c, t, -1, 0);
    } else {
      const k = spring(t - 3.55, 1.6, 0.75);
      // pull: rubber band while dragging, hold while syncing, spring home
      let off = 0;
      if (t > 4.28 && t <= 4.68) off = 110 * E.outQ(seg(t, 4.3, 4.66));
      else if (t > 4.68 && t <= 5.0) off = lerp(110, 72, spring(t - 4.68, 3, 0.7));
      else if (t > 5.0) off = 72 * (1 - spring(t - 5.0, 2.2, 0.45));
      if (k < 1.2 && t < 4.3) screenList(c, t, 1, clamp(k));
      screenDetail(c, t, k, off, st);
    }
    statusBar(c, dark);
    dynamicIsland(c, t);
    c.fillStyle = dark ? 'rgba(255,255,255,0.8)' : 'rgba(16,24,20,0.85)'; rrect(c, 196.5 - 67, SH - 13, 134, 5, 2.5); c.fill();
  }

  function springPanel(c, t) {
    let si = 0; for (let i = 0; i < STEPS.length; i++) if (t >= STEPS[i][0]) si = i;
    const out = sstep(7.8, 8.15, t), inn = sstep(0.35, 0.7, t);
    const a = inn * (1 - out);
    if (a <= 0) return;
    // left: step index, title, description
    STEPS.forEach((S, i) => {
      const t0 = S[0], t1 = i + 1 < STEPS.length ? STEPS[i + 1][0] : 99;
      const ka = sstep(t0, t0 + 0.22, t) * (1 - sstep(t1 - 0.12, t1, t));
      if (ka <= 0) return;
      const dy = (1 - E.outC(sstep(t0, t0 + 0.3, t))) * 16 - E.inC(sstep(t1 - 0.12, t1, t)) * 10;
      c.save(); c.globalAlpha = a * ka; c.translate(0, dy);
      fnt(c, 500, 15, MONO); setLS(c, 2); c.fillStyle = '#7a6fb0'; c.textAlign = 'left';
      c.fillText(`${String(i + 1).padStart(2, '0')} / 08`, 170, 408);
      setLS(c, 0); fnt(c, 700, 44, IN); setLS(c, -1.4); c.fillStyle = '#1d1a2e'; c.fillText(S[1], 168, 466); setLS(c, 0);
      fnt(c, 400, 19, IN); c.fillStyle = 'rgba(29,26,46,0.62)';
      const words = S[2].split(' '); let line = '', ly = 506;
      words.forEach(w => { const tst = line ? line + ' ' + w : w; if (c.measureText(tst).width > 420) { c.fillText(line, 170, ly); ly += 28; line = w; } else line = tst; });
      c.fillText(line, 170, ly);
      c.restore();
    });
    // progress ticks
    c.save(); c.globalAlpha = a;
    for (let i = 0; i < 8; i++) { c.fillStyle = i <= si ? '#1d1a2e' : 'rgba(29,26,46,0.16)'; rrect(c, 170 + i * 30, 624, i === si ? 24 : 22, 4, 2); c.fill(); }
    c.restore();
    // right: live spring graph
    const S = STEPS[si], f = S[3], z = S[4], to = S[5];
    const gx = 1310, gy = 392, gw = 420, gh = 210;
    c.save(); c.globalAlpha = a;
    c.fillStyle = 'rgba(255,255,255,0.55)'; rrect(c, gx - 24, gy - 64, gw + 48, gh + 120, 26); c.fill();
    c.strokeStyle = 'rgba(29,26,46,0.08)'; c.lineWidth = 1; rrect(c, gx - 24, gy - 64, gw + 48, gh + 120, 26); c.stroke();
    fnt(c, 500, 14, MONO); c.fillStyle = '#1d1a2e'; c.textAlign = 'left';
    c.fillText(`.spring(response: ${(1 / f).toFixed(2)},`, gx, gy - 30);
    c.fillText(`        dampingFraction: ${z.toFixed(2)})`, gx, gy - 10);
    const yv = v => gy + gh - 24 - v * (gh - 70);
    c.strokeStyle = 'rgba(29,26,46,0.12)'; c.setLineDash([4, 5]);
    c.beginPath(); c.moveTo(gx, yv(1)); c.lineTo(gx + gw, yv(1)); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.moveTo(gx, yv(0)); c.lineTo(gx + gw, yv(0)); c.stroke();
    const TT = 1.2;
    c.strokeStyle = '#7a6fb0'; c.lineWidth = 2.5; c.lineJoin = 'round'; c.beginPath();
    for (let i = 0; i <= 120; i++) { const x = i / 120 * TT, v = spring(x, f, z); i ? c.lineTo(gx + i / 120 * gw, yv(v)) : c.moveTo(gx, yv(v)); }
    c.stroke();
    const lt = clamp(t - to, 0, TT), lv = spring(lt, f, z);
    c.fillStyle = '#ff6b4a'; c.beginPath(); c.arc(gx + lt / TT * gw, yv(lv), 6.5, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,107,74,0.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(gx + lt / TT * gw, yv(0)); c.lineTo(gx + lt / TT * gw, yv(lv)); c.stroke();
    let peak = 0; for (let i = 0; i <= 200; i++) peak = Math.max(peak, spring(i / 200 * TT, f, z));
    fnt(c, 500, 13, MONO); c.fillStyle = 'rgba(29,26,46,0.55)';
    c.fillText(`overshoot ${((peak - 1) * 100).toFixed(1)}%`, gx, gy + gh + 30);
    c.textAlign = 'right'; c.fillText(`t = ${lt.toFixed(2)} s`, gx + gw, gy + gh + 30);
    c.restore();
  }

  MG.film({
    id: 'appui', dur: 10, poster: 9.4,
    fonts: [['700 30px Inter', 'fernly Grow with care'], ['800 34px Inter', 'My plants'], ['400 15px Inter', 'Good morning'], ['italic 400 15px Inter', 'Monstera'], ['500 14px "JetBrains Mono"', '.spring(response: 0.1)']],
    meta: {
      family: 'J', name: 'App UI Motion', sub: 'Micro-interactions & Product Shots', era: '2007 —',
      origin: 'The iPhone (2007) made physics part of the interface: rubber-band scrolling, momentum and springs. Google’s Material Design (2014) codified ripples and shared-element transitions, Dribbble turned the looping product shot into a portfolio genre, and Apple’s Dynamic Island (2022) made a hardware cutout morph like a living object.',
      works: 'iPhone OS rubber-band scrolling (2007) · Google Material Design motion guidelines (2014) · Apple iOS 7 spring animations (2013) · Apple “Dynamic Island” (iPhone 14 Pro, 2022) · Dribbble UI animation shots · Airbnb Lottie (2017)',
      tech: ['Damped springs (response, damping fraction) on every property', 'Shared-element morph of rect, radius, image and type size', 'Rubber-band pull with hold-and-release', 'Live spring-curve readout synced to each beat'],
      accent: '#7a6fb0',
      motionDNA: 'Everything answers the finger: presses dip, releases spring back with a little overshoot, lists cascade in 70 ms steps and elements carry their identity from one screen into the next.',
      visualDNA: 'A clean device on a pastel gradient, soft cards and pill shapes, one brand green with a lime accent, Inter type and a translucent touch indicator.',
      transitions: 'Iris open, push, shared-element morph, pull and spring back, button-to-loader morph, app closing into its icon.',
      implementation: ['Figma Smart Animate', 'Principle / ProtoPie', 'After Effects + Lottie', 'SwiftUI / Jetpack Compose'],
      reproducibility: 'Fully procedural', loopable: false,
    },
    setup() {
      const r = rng(908), conf = [], cols = [AP.lime, AP.green, AP.terra, AP.sky, AP.sun, AP.pink];
      for (let i = 0; i < 90; i++) { const a = -PI / 2 + (r() - 0.5) * 2.2, sp = 420 + r() * 620; conf.push({ vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, d: r() * 0.08, r: r() * TAU, w: (r() - 0.5) * 16, s: (r() * 3) | 0, c: cols[(r() * cols.length) | 0] }); }
      return { conf };
    },
    draw(c, t, W, H, st) {
      // backdrop
      const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#ece8fb'); g.addColorStop(0.55, '#f6eef4'); g.addColorStop(1, '#fde9dc');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      [[380, 260, 520, 'rgba(190,180,250,0.45)'], [1560, 820, 560, 'rgba(255,200,170,0.5)'], [1500, 180, 380, 'rgba(200,240,200,0.35)']].forEach(([x, y, r, col], i) => {
        const xx = x + Math.sin(t * 0.4 + i) * 30, yy = y + Math.cos(t * 0.33 + i) * 24;
        const rg = c.createRadialGradient(xx, yy, 0, xx, yy, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = rg; c.fillRect(xx - r, yy - r, r * 2, r * 2);
      });
      springPanel(c, t);
      // phone transform
      const rise = spring(t - 0.02, 1.4, 0.72);
      const ex = sstep(8.15, 8.6, t);
      const py = 540 + 640 * (1 - rise) + 60 * E.inC(ex), ps = 1 - 0.08 * ex;
      const closeK = t < 7.95 ? 0 : E.ioC(seg(t, 7.95, 8.32));
      if (ex < 1) {
        c.save(); c.translate(960, py); c.scale(ps, ps); c.globalAlpha = 1 - ex;
        // shadow + frame
        c.shadowColor = 'rgba(60,40,90,0.28)'; c.shadowBlur = 90; c.shadowOffsetY = 40;
        c.fillStyle = '#1c1d22'; rrect(c, -SW / 2 - 14, -SH / 2 - 14, SW + 28, SH + 28, 68); c.fill();
        c.shadowColor = 'transparent';
        const fg = c.createLinearGradient(-SW / 2 - 14, 0, SW / 2 + 14, 0); fg.addColorStop(0, '#5a5c63'); fg.addColorStop(0.5, '#2a2b30'); fg.addColorStop(1, '#5a5c63');
        c.strokeStyle = fg; c.lineWidth = 3; rrect(c, -SW / 2 - 12.5, -SH / 2 - 12.5, SW + 25, SH + 25, 66); c.stroke();
        c.fillStyle = '#2a2b30'; [[-SW / 2 - 17, -250, 60], [-SW / 2 - 17, -170, 60], [-SW / 2 - 17, -300, 30], [SW / 2 + 14, -210, 96]].forEach(([x, y, h]) => { rrect(c, x, y, 3, h, 1.5); c.fill(); });
        c.save(); c.beginPath(); rrect(c, -SW / 2, -SH / 2, SW, SH, 55); c.clip(); c.translate(-SW / 2, -SH / 2);
        if (closeK > 0) { // home screen wallpaper behind the closing app
          const wg = c.createLinearGradient(0, 0, SW, SH); wg.addColorStop(0, '#b9c8f5'); wg.addColorStop(1, '#f4c6c0'); c.fillStyle = wg; c.fillRect(0, 0, SW, SH);
          const ir = { x: lerp(0, 196.5 - 50, closeK), y: lerp(0, 426 - 50, closeK), w: lerp(SW, 100, closeK), h: lerp(SH, 100, closeK) };
          c.save(); c.beginPath(); rrect(c, ir.x, ir.y, ir.w, ir.h, lerp(55, 24, closeK)); c.clip();
          c.translate(ir.x, ir.y); c.scale(ir.w / SW, ir.h / SH); appScreen(c, 7.95, st); c.restore();
          c.globalAlpha = (1 - ex) * sstep(0.25, 0.65, closeK); appIconArt(c, ir.x, ir.y, ir.w, lerp(55, 24, closeK), ir.h); c.globalAlpha = 1 - ex;
        } else appScreen(c, t, st);
        // touch indicator
        const F = finger(t);
        if (F.vis > 0 && closeK === 0) {
          c.save(); c.globalAlpha = F.vis * 0.95; c.translate(F.x, F.y); const s = 1 - 0.16 * F.down; c.scale(s, s);
          c.fillStyle = `rgba(30,30,40,${0.16 + 0.14 * F.down})`; c.beginPath(); c.arc(0, 0, 23, 0, TAU); c.fill();
          c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 2.5; c.stroke();
          if (F.down > 0) { c.strokeStyle = `rgba(255,255,255,${0.5 * F.down})`; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, 23 + 8 * F.down, 0, TAU); c.stroke(); }
          c.restore();
        }
        c.restore();
        c.restore();
      }
      // end card: the icon leaves the phone and becomes the logo
      if (t > 8.2) {
        const k = spring(t - 8.2, 1.7, 0.62), sz = lerp(100 * 0.92, 208, k), y = lerp(540, 452, k);
        c.save(); c.shadowColor = 'rgba(19,74,54,0.3)'; c.shadowBlur = 50 * k; c.shadowOffsetY = 22 * k;
        appIconArt(c, 960 - sz / 2, y - sz / 2, sz, sz * 0.235); c.restore();
        const nk = spring(t - 8.48, 2.2, 0.75);
        c.globalAlpha = clamp((t - 8.48) / 0.2);
        fnt(c, 800, 72, IN); setLS(c, -2.5); c.fillStyle = AP.ink; c.textAlign = 'center'; c.fillText('fernly', 960, 662 + (1 - nk) * 26); setLS(c, 0);
        c.globalAlpha = clamp((t - 8.64) / 0.25);
        fnt(c, 500, 24, IN); c.fillStyle = 'rgba(16,24,20,0.55)'; c.fillText('Plant care, beautifully simple.', 960, 710 + (1 - spring(t - 8.64, 2.2, 0.75)) * 20);
        c.globalAlpha = clamp((t - 8.85) / 0.25);
        fnt(c, 600, 14, MONO); setLS(c, 2); c.fillStyle = 'rgba(16,24,20,0.4)'; c.fillText('iOS · ANDROID · 2026', 960, 770); setLS(c, 0);
        c.globalAlpha = 1;
      }
      const fin = 1 - sstep(0, 0.2, t);
      if (fin > 0) { c.fillStyle = `rgba(255,255,255,${fin})`; c.fillRect(0, 0, W, H); }
    },
    score(A) {
      A.bus.gain.value = 1.35;
      const BT = 60 / 88, r = rng(5150);
      // lo-fi bed: dusty keys, soft kit, vinyl
      const keys = (t0, notes, d) => {
        A.chord(t0, notes, { type: 'triangle', dur: d, g: 0.024, a: 0.02, lp: 1600, lp2: 700, lpT: d, spread: 4, width: 1.2, rev: 0.4 });
        A.chord(t0, notes.map(n => n + 12), { type: 'sine', dur: d * 0.6, g: 0.008, a: 0.01, width: 1.4, rev: 0.4 });
      };
      const C = [[41, 53, 57, 60, 64], [40, 52, 55, 59, 62], [38, 50, 53, 57, 60, 64], [36, 48, 52, 55, 59, 62]];
      C.forEach((ch, i) => keys(0.3 + i * BT * 4, ch, i === 3 ? 10 - (0.3 + i * BT * 4) : BT * 4 + 0.2));
      for (let b = 0; b < 14; b++) {
        const tb = 0.3 + b * BT; if (tb > 9.3) break;
        if (b % 4 === 0 || b % 4 === 2) A.osc(tb, { f: 110, f2: 46, glide: 0.1, dur: 0.32, g: 0.16, lp: 600 });
        if (b % 4 === 2) A.osc(tb + BT * 0.5, { f: 100, f2: 44, glide: 0.1, dur: 0.25, g: 0.09, lp: 500 });
        if (b % 2 === 1) { A.noise(tb, { type: 'bandpass', f: 1500, q: 0.8, dur: 0.16, g: 0.05, rev: 0.25 }); A.osc(tb, { type: 'triangle', f: 190, f2: 140, dur: 0.08, g: 0.03 }); }
        A.hat(tb, 0.018, false, { f: 7000, pan: -0.2 }); A.hat(tb + BT * 0.56, 0.012, false, { f: 7500, pan: 0.2 });
      }
      for (let i = 0; i < 40; i++) A.noise(r() * 9.8, { type: 'highpass', f: 3000 + r() * 3000, dur: 0.006, g: 0.02 + r() * 0.03, pan: r() - 0.5 });
      A.noise(0, { type: 'bandpass', f: 1200, q: 0.4, dur: 9.9, g: 0.006, hold: true, a: 0.4, rel: 0.5 });
      // UI foley
      const tap = (t, f = 1700, g = 0.07) => { A.osc(t, { f, f2: f * 0.7, glide: 0.03, dur: 0.05, g }); A.noise(t, { type: 'highpass', f: 4000, dur: 0.008, g: g * 0.5 }); };
      const blip = (t, f, g = 0.05, d = 0.12) => A.osc(t, { f, dur: d, g, rev: 0.3 });
      // splash
      A.whoosh(0.02, 0.45, { f1: 200, f2: 1200, g: 0.08 });
      A.bell(0.28, midi(84), { g: 0.06, dur: 1.2, rev: 0.5 }); A.bell(0.36, midi(91), { g: 0.04, dur: 1.0, rev: 0.5 });
      A.whoosh(1.02, 0.35, { f1: 600, f2: 3000, g: 0.05 });
      // onboarding swipe
      tap(1.5, 1400, 0.04); A.whoosh(1.55, 0.42, { f1: 500, f2: 2200, g: 0.08, pan: -0.3 }); blip(1.84, 880, 0.03);
      tap(2.15); A.whoosh(2.28, 0.35, { f1: 700, f2: 2600, g: 0.06, pan: 0.3 });
      // staggered list
      PLANTS.forEach((_, i) => blip(2.5 + i * 0.07, midi(79 + [0, 2, 4, 7, 9][i]), 0.028, 0.18));
      [0, 1, 2, 3, 4].forEach(i => A.noise(2.88 + i * 0.05, { type: 'bandpass', f: 5000, q: 2, dur: 0.05, g: 0.012 }));
      // tap + ripple + shared element
      tap(3.3, 1500, 0.08); A.osc(3.3, { f: 520, f2: 900, glide: 0.25, dur: 0.3, g: 0.03, rev: 0.4 });
      A.whoosh(3.53, 0.55, { f1: 300, f2: 1800, g: 0.09 }); A.osc(3.56, { type: 'sine', f: 330, f2: 660, glide: 0.4, dur: 0.5, g: 0.035, rev: 0.4 });
      // pull to refresh
      tap(4.28, 1200, 0.04);
      A.noise(4.3, { type: 'bandpass', f: 400, f2: 900, q: 2, dur: 0.38, g: 0.03, swell: 0.9 });
      A.osc(4.55, { f: 1300, dur: 0.04, g: 0.04 });
      A.osc(4.68, { f: 300, f2: 180, glide: 0.08, dur: 0.12, g: 0.07 });
      blip(5.0, midi(84), 0.04, 0.3); blip(5.08, midi(91), 0.035, 0.4);
      A.whoosh(5.0, 0.3, { f1: 1200, f2: 400, g: 0.04 });
      // toggle
      tap(5.3, 1600, 0.06); A.osc(5.32, { f: 660, f2: 990, glide: 0.08, dur: 0.12, g: 0.04 }); A.noise(5.42, { type: 'highpass', f: 5000, dur: 0.01, g: 0.03 });
      // slider: one tick per 20 ml
      tap(5.64, 1300, 0.04);
      let last = ml(sliderV(5.6));
      for (let tt = 5.66; tt < 6.14; tt += 0.005) { const m = ml(sliderV(tt)); if (Math.abs(m - last) >= 20) { last = m; A.osc(tt, { f: 900 + (m - 200) * 3, dur: 0.025, g: 0.03, pan: (m - 300) / 300 }); } }
      // success
      tap(6.42, 1600, 0.07); A.whoosh(6.47, 0.3, { f1: 1800, f2: 600, g: 0.04 });
      for (let i = 0; i < 6; i++) A.osc(6.62 + i * 0.055, { f: 2200, dur: 0.02, g: 0.012 });
      [72, 76, 79, 84].forEach((m, i) => A.bell(6.95 + i * 0.06, midi(m + 12), { g: 0.07, dur: 1.6, rev: 0.55, pan: (i - 1.5) * 0.3 }));
      A.osc(6.95, { f: 180, f2: 90, glide: 0.15, dur: 0.3, g: 0.1 });
      for (let i = 0; i < 22; i++) A.osc(7.0 + r() * 0.8, { f: 3000 + r() * 4000, dur: 0.05, g: 0.008 + r() * 0.01, pan: r() * 1.6 - 0.8, rev: 0.4 });
      A.noise(7.05, { type: 'bandpass', f: 600, f2: 1600, q: 1, dur: 0.4, g: 0.04, swell: 0.4 });
      // close → icon → logo sting
      A.whoosh(7.92, 0.45, { f1: 2000, f2: 400, g: 0.07 });
      A.osc(8.22, { f: 140, f2: 70, glide: 0.2, dur: 0.5, g: 0.12 });
      [79, 84, 88].forEach((m, i) => A.pluck(8.25 + i * 0.11, midi(m), { g: 0.16, dur: 1.8, bright: 0.55, rev: 0.5 }));
      A.bell(8.5, midi(91), { g: 0.05, dur: 2.0, rev: 0.6 });
    },
  });
  /* =====================================================================
     DATA STORYTELLING — "The Long View". A headline question, then four
     to-scale charts: a long line of global life expectancy with
     annotations, a bar-chart race of regions, a Gapminder-style bubble
     scatter moving through the years, and a single takeaway number.
     All values are illustrative and labelled as such.
     ===================================================================== */
  const SER = '"Source Serif 4", Georgia, serif', FR = '"Libre Franklin", "Helvetica Neue", Arial, sans-serif';
  const DS = { paper: '#f7f5f0', ink: '#141414', gray: '#6e6c66', grid: '#dedad0', red: '#d13b25' };
  const X0 = 230, X1 = 1650, Y0 = 330, Y1 = 880;
  const LE_K = [[1800, 28.5], [1820, 29], [1850, 29.3], [1870, 29.8], [1890, 31], [1900, 32], [1913, 34.1], [1916, 33.4], [1918, 26], [1920, 33.6], [1930, 36], [1940, 39], [1945, 40], [1950, 46], [1960, 51], [1970, 56.5], [1980, 61], [1990, 64], [2000, 66.5], [2010, 70.2], [2019, 72.8], [2021, 71], [2023, 73.2]];
  function leWorld(y) {
    let v = LE_K[0][1];
    for (let i = 1; i < LE_K.length; i++) if (y <= LE_K[i][0]) { const a = LE_K[i - 1], b = LE_K[i]; v = lerp(a[1], b[1], (y - a[0]) / (b[0] - a[0])); break; } else v = LE_K[i][1];
    return v + (y < 2015 ? vnoise(y * 0.45, 3) * 0.35 : 0);
  }
  const REG = [
    { n: 'East Asia & Pacific', c: '#d13b25', le: [45, 59.5, 66, 69, 71.5, 74.5, 77.6], g: [1100, 17000], k: 1.9, cnt: 7 },
    { n: 'North America', c: '#2f5d8c', le: [69.9, 70.9, 73.7, 75.3, 76.8, 78.5, 77.4], g: [19000, 62000], k: 1, cnt: 2 },
    { n: 'Europe & Central Asia', c: '#86a6c9', le: [66.5, 69, 70.2, 71.5, 72.5, 75.5, 77.0], g: [8500, 38000], k: 1, cnt: 9 },
    { n: 'Latin America', c: '#5b9a3c', le: [56, 60.5, 64.5, 68.3, 71.5, 74, 73], g: [4500, 15000], k: 1, cnt: 7 },
    { n: 'Middle East & N. Africa', c: '#c98b2b', le: [46.5, 52, 58.5, 65, 69, 72, 73.2], g: [3200, 15500], k: 1.1, cnt: 6 },
    { n: 'South Asia', c: '#8d6cab', le: [42, 48, 53.5, 58.5, 63, 67.5, 69.5], g: [950, 6200], k: 1.6, cnt: 5 },
    { n: 'Sub-Saharan Africa', c: '#2a9d8f', le: [40.2, 44, 47.5, 49.5, 50, 56.5, 61.5], g: [1500, 3900], k: 1.3, cnt: 10 },
  ];
  function regLE(R, y) { // Catmull-Rom through the decade table
    const u = clamp((y - 1960) / 10, 0, 6), i = Math.min(5, Math.floor(u)), f = u - i, L = R.le;
    const p0 = L[Math.max(0, i - 1)], p1 = L[i], p2 = L[i + 1], p3 = L[Math.min(6, i + 2)];
    return 0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f);
  }
  // section timing
  const lineYear = t => kf(t, [[1.85, 1800], [2.3, 1912, E.inQ], [2.62, 1926, E.lin], [3.42, 2023, E.outQ]]);
  const barYear = t => 1960 + 60 * E.ioS(seg(t, 4.3, 5.6));
  const bubYear = t => 1960 + 60 * E.ioS(seg(t, 6.5, 7.95));
  const xL = y => X0 + (y - 1800) / 223 * (X1 - X0), yL = v => Y1 - v / 80 * (Y1 - Y0);
  const BX0 = 560, BX1 = 1500, xB = v => BX0 + v / 80 * (BX1 - BX0);
  const xG = g => X0 + 40 + (Math.log10(g) - Math.log10(300)) / (Math.log10(120000) - Math.log10(300)) * (X1 - X0 - 40), yG = v => Y1 - (v - 25) / 60 * (Y1 - Y0);
  const softRank = (vals, i) => vals.reduce((s, v, j) => s + (j === i ? 0 : 1 / (1 + Math.exp(-(v - vals[i]) / 0.16))), 0);

  function dsHeader(c, t, t0, t1, n, title, deck) {
    const a = sstep(t0, t0 + 0.3, t) * (1 - sstep(t1 - 0.25, t1, t));
    if (a <= 0) return;
    const dy = (1 - E.outC(sstep(t0, t0 + 0.4, t))) * 18;
    c.save(); c.globalAlpha = a;
    fnt(c, 700, 15, FR); setLS(c, 2.4); c.fillStyle = DS.red; c.textAlign = 'left'; c.fillText(`CHART ${n} OF 4`, X0, 160 + dy); setLS(c, 0);
    fnt(c, 600, 44, SER); setLS(c, -0.6); c.fillStyle = DS.ink; c.fillText(title, X0, 214 + dy); setLS(c, 0);
    fnt(c, 400, 21, FR); c.fillStyle = DS.gray; c.fillText(deck, X0, 252 + dy);
    c.restore();
  }
  function hGrid(c, a, vals, map, x0, x1, unit) {
    vals.forEach((v, i) => {
      const p = E.outC(clamp(a * 1.6 - i * 0.12));
      if (p <= 0) return;
      const y = map(v);
      c.fillStyle = v === 0 ? DS.ink : DS.grid; c.fillRect(x0, y - (v === 0 ? 1 : 0.5), (x1 - x0) * p, v === 0 ? 2 : 1);
      c.globalAlpha = p; fnt(c, 500, 16, FR); c.fillStyle = DS.gray; c.textAlign = 'right';
      c.fillText(v + (i === vals.length - 1 && unit ? '' : ''), x0 - 14, y + 5);
      if (i === vals.length - 1 && unit) { c.textAlign = 'left'; c.fillText(unit, x0, y - 14); }
      c.globalAlpha = 1;
    });
  }
  function callout(c, x, y, tx, ty, lines, a, col = DS.ink) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    c.strokeStyle = col; c.lineWidth = 1.2;
    const p = E.outC(a);
    c.beginPath(); c.moveTo(x, y); c.lineTo(lerp(x, tx, p), lerp(y, ty, p)); c.stroke();
    c.fillStyle = col; c.beginPath(); c.arc(x, y, 4, 0, TAU); c.fill();
    c.textAlign = tx < x ? 'right' : 'left';
    const ox = tx < x ? -8 : 8;
    lines.forEach((s, i) => { fnt(c, i ? 400 : 700, i ? 16 : 17, FR); c.fillStyle = i ? DS.gray : col; c.fillText(s, tx + ox, ty + 5 + i * 21); });
    c.restore();
  }

  function dsLine(c, t) {
    const out = 1 - sstep(3.55, 3.8, t), a0 = sstep(1.55, 1.95, t);
    if (out <= 0 || a0 <= 0) return;
    c.save(); c.globalAlpha = out; c.translate(0, -16 * (1 - out));
    hGrid(c, seg(t, 1.55, 2.1), [0, 20, 40, 60, 80], yL, X0, X1, 'years at birth');
    // x ticks
    [1800, 1850, 1900, 1950, 2000, 2023].forEach((y, i) => {
      const p = sstep(1.7 + i * 0.05, 1.9 + i * 0.05, t); if (p <= 0) return;
      c.globalAlpha = out * p; c.fillStyle = DS.ink; c.fillRect(xL(y) - 0.5, Y1, 1, 7);
      fnt(c, 500, 16, FR); c.fillStyle = DS.gray; c.textAlign = 'center'; c.fillText(String(y), xL(y), Y1 + 30);
    });
    c.globalAlpha = out;
    const yc = lineYear(t);
    if (yc > 1800) {
      // area + line
      c.beginPath(); c.moveTo(xL(1800), yL(0));
      for (let y = 1800; y <= yc; y += 0.5) c.lineTo(xL(y), yL(leWorld(y)));
      c.lineTo(xL(yc), yL(leWorld(yc))); c.lineTo(xL(yc), yL(0)); c.closePath();
      c.fillStyle = 'rgba(209,59,37,0.07)'; c.fill();
      c.beginPath();
      for (let y = 1800; y <= yc; y += 0.5) y === 1800 ? c.moveTo(xL(y), yL(leWorld(y))) : c.lineTo(xL(y), yL(leWorld(y)));
      c.lineTo(xL(yc), yL(leWorld(yc)));
      c.strokeStyle = DS.red; c.lineWidth = 3.5; c.lineJoin = 'round'; c.stroke();
      const hx = xL(yc), hy = yL(leWorld(yc));
      const live = 1 - sstep(2010, 2017, yc);
      c.fillStyle = DS.red; c.beginPath(); c.arc(hx, hy, 6.5, 0, TAU); c.fill();
      if (live > 0) {
        c.globalAlpha = out * live; c.strokeStyle = 'rgba(20,20,20,0.25)'; c.setLineDash([3, 4]); c.lineWidth = 1;
        c.beginPath(); c.moveTo(hx, hy + 12); c.lineTo(hx, Y1); c.stroke(); c.setLineDash([]);
        fnt(c, 700, 18, FR); c.fillStyle = DS.ink; c.textAlign = 'left';
        c.fillText(`${Math.floor(yc)}`, hx + 14, hy - 30); fnt(c, 400, 17, FR); c.fillStyle = DS.gray; c.fillText(`${leWorld(yc).toFixed(1)} years`, hx + 14, hy - 10);
        c.globalAlpha = out;
      }
      // annotations as the cursor passes
      const an = y => sstep(y, y + 14, yc);
      callout(c, xL(1918), yL(26), xL(1918) + 70, yL(14), ['1918 · Influenza pandemic', 'Lifespans briefly fall to ~26 years'], an(1918));
      callout(c, xL(1950), yL(46), xL(1950) - 80, yL(62), ['1950 · 46 years', 'Vaccines and antibiotics spread'], an(1950));
      callout(c, xL(2021), yL(71), xL(2021) - 3, yL(84), ['2021 · COVID-19 dip'], sstep(2020.5, 2022.6, yc), DS.red);
      const fin = sstep(3.36, 3.5, t);
      if (fin > 0) { c.globalAlpha = out * fin; fnt(c, 700, 22, FR); c.fillStyle = DS.red; c.textAlign = 'left'; c.fillText('73.2', xL(2023) + 14, yL(73.2) + 7); }
    }
    c.restore();
  }

  function dsBars(c, t) {
    const out = 1 - sstep(5.82, 6.05, t), a0 = sstep(3.72, 4.0, t);
    if (out <= 0 || a0 <= 0) return;
    c.save(); c.globalAlpha = out; c.translate(0, -16 * (1 - out));
    const yr = barYear(t);
    // vertical gridlines
    [0, 20, 40, 60, 80].forEach((v, i) => {
      const p = E.outC(sstep(3.75 + i * 0.04, 4.05 + i * 0.04, t)); if (p <= 0) return;
      c.fillStyle = v === 0 ? DS.ink : DS.grid; c.fillRect(xB(v) - (v ? 0.5 : 1), 330, v ? 1 : 2, 510 * p);
      c.globalAlpha = out * p; fnt(c, 500, 16, FR); c.fillStyle = DS.gray; c.textAlign = 'center'; c.fillText(String(v), xB(v), 318);
      c.globalAlpha = out;
    });
    c.globalAlpha = out * a0; fnt(c, 500, 16, FR); c.fillStyle = DS.gray; c.textAlign = 'left'; c.fillText('years', xB(80) + 22, 318); c.globalAlpha = out;
    const vals = REG.map(R => regLE(R, yr));
    const ys = REG.map((R, i) => 346 + softRank(vals, i) * 70);
    // while two bars cross, the lower-valued one recedes: its bar and labels fade, so a still frame
    // never shows two fully opaque labels in the same row
    const dim = REG.map((R, i) => {
      let o = 0;
      REG.forEach((S, j) => { if (j !== i && vals[j] > vals[i]) o = Math.max(o, 1 - Math.abs(ys[i] - ys[j]) / 62); });
      return clamp(o);
    });
    const order = REG.map((R, i) => i).sort((a, b) => vals[a] - vals[b]); // leader drawn last, on top
    order.forEach(i => {
      const R = REG[i];
      const grow = E.outQt(seg(t, 3.9 + i * 0.05, 4.35 + i * 0.05));
      if (grow <= 0) return;
      const y = ys[i], v = vals[i] * grow, la = 1 - E.ioS(clamp(dim[i] * 1.7));
      c.globalAlpha = out * (1 - 0.55 * E.ioS(dim[i]));
      c.fillStyle = R.c; c.fillRect(xB(0), y, xB(v) - xB(0), 52);
      c.globalAlpha = out * la;
      fnt(c, 600, 18, FR); c.fillStyle = DS.ink; c.textAlign = 'right'; c.fillText(R.n, BX0 - 16, y + 32);
      fnt(c, 700, 18, FR); c.fillStyle = i === 0 ? DS.red : DS.ink; c.textAlign = 'left'; c.fillText(v.toFixed(1), xB(v) + 10, y + 32);
      c.globalAlpha = out;
    });
    // year
    fnt(c, 300, 150, SER); c.fillStyle = 'rgba(20,20,20,0.13)'; c.textAlign = 'right'; c.globalAlpha = out * a0;
    c.fillText(String(Math.round(yr)), X1 + 10, 832);
    // callout: East Asia's climb
    const ca = sstep(5.55, 5.8, t);
    if (ca > 0) {
      c.globalAlpha = out * ca; fnt(c, 700, 18, FR); c.fillStyle = DS.red; c.textAlign = 'right';
      c.fillText('East Asia: 5th in 1960 → 1st by 2020', X1 + 10, 640);
      fnt(c, 400, 16, FR); c.fillStyle = DS.gray; c.fillText('+32.6 years in six decades', X1 + 10, 664);
    }
    c.restore();
  }

  function dsBubbles(c, t, st) {
    const out = 1 - sstep(8.08, 8.3, t), a0 = sstep(5.95, 6.25, t);
    if (out <= 0 || a0 <= 0) return;
    c.save(); c.globalAlpha = out; c.translate(0, -16 * (1 - out));
    const yr = bubYear(t), u = (yr - 1960) / 60;
    // year watermark behind the data
    c.globalAlpha = out * a0; fnt(c, 300, 260, SER); c.fillStyle = 'rgba(20,20,20,0.05)'; c.textAlign = 'center'; c.fillText(String(Math.round(yr)), (X0 + X1) / 2 + 40, 700);
    c.globalAlpha = out;
    hGrid(c, seg(t, 5.95, 6.4), [30, 40, 50, 60, 70, 80], yG, X0 + 40, X1, 'life expectancy, years');
    [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000].forEach((g, i) => {
      const p = sstep(6.0 + i * 0.03, 6.25 + i * 0.03, t); if (p <= 0) return;
      c.globalAlpha = out * p; c.fillStyle = DS.grid; c.fillRect(xG(g) - 0.5, Y0, 1, Y1 - Y0);
      fnt(c, 500, 16, FR); c.fillStyle = DS.gray; c.textAlign = 'center'; c.fillText(g >= 1000 ? `$${g / 1000}k` : `$${g}`, xG(g), Y1 + 30);
    });
    c.globalAlpha = out * a0; fnt(c, 500, 16, FR); c.fillStyle = DS.gray; c.textAlign = 'right'; c.fillText('income per person (log scale) →', X1, Y1 + 58);
    c.globalAlpha = out;
    // trail of the largest East Asian bubble
    const big = st.countries[0];
    const pos = (q, y) => { const uu = (y - 1960) / 60, R = REG[q.r]; const le = clamp(regLE(R, y) + q.o * (1 - 0.35 * uu) + vnoise(y * 0.2 + q.s, 2) * 0.6, 28, 84); const g = R.g[0] * q.m * Math.pow(R.g[1] / R.g[0], Math.pow(uu, R.k)) * (1 + 0.04 * vnoise(y * 0.3, q.s)); return [xG(g), yG(le)]; };
    if (yr > 1961) {
      c.fillStyle = 'rgba(209,59,37,0.45)';
      for (let y = 1960; y < yr - 0.5; y += 2.5) { const [x, yy] = pos(big, y); c.beginPath(); c.arc(x, yy, 2.6, 0, TAU); c.fill(); }
    }
    const pop = E.outB(seg(t, 6.2, 6.55));
    st.countries.forEach((q, i) => {
      const pi = clamp(E.outB(seg(t, 6.18 + q.d, 6.5 + q.d)), 0, 1.2);
      if (pi <= 0) return;
      const [x, y] = pos(q, yr), r = q.rad * (1 + 0.45 * u) * pi;
      c.fillStyle = REG[q.r].c; c.globalAlpha = out * 0.8; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.globalAlpha = out; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.4; c.stroke();
      if (i === 0 || i === 1) c.strokeStyle = DS.ink, c.lineWidth = 1, c.stroke();
      void i;
    });
    void pop;
    // labels for the two giants
    const la = sstep(6.6, 6.9, t);
    if (la > 0) {
      [[0, 'Largest East Asian country'], [1, 'Largest South Asian country']].forEach(([i, s], k) => {
        const q = st.countries[i], [x, y] = pos(q, yr), r = q.rad * (1 + 0.45 * u);
        c.globalAlpha = out * la; fnt(c, 600, 15, FR); c.fillStyle = DS.ink; c.textAlign = 'left';
        c.lineJoin = 'round'; c.lineWidth = 5; c.strokeStyle = DS.paper; c.strokeText(s, x + r + 10, y + (k ? 14 : -4));
        c.fillText(s, x + r + 10, y + (k ? 14 : -4));
      });
    }
    // legend
    c.globalAlpha = out * a0;
    REG.forEach((R, i) => {
      const col = i % 2, row = Math.floor(i / 2), x = 1220 + col * 230, y = 158 + row * 26;
      c.fillStyle = R.c; c.beginPath(); c.arc(x, y - 5, 7, 0, TAU); c.fill();
      fnt(c, 500, 15, FR); c.fillStyle = DS.ink; c.textAlign = 'left'; c.fillText(R.n, x + 14, y);
    });
    fnt(c, 400, 14, FR); c.fillStyle = DS.gray; c.fillText('Bubble area ∝ population', 1220 + 230, 158 + 3 * 26);
    c.restore();
  }

  function dsNumber(c, t) {
    const a = sstep(8.22, 8.5, t);
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    const dy = (1 - E.outC(a)) * 20;
    fnt(c, 700, 15, FR); setLS(c, 2.4); c.fillStyle = DS.red; c.textAlign = 'left'; c.fillText('THE TAKEAWAY', X0, 330 + dy); setLS(c, 0);
    const n = Math.round(27 * E.outQ(seg(t, 8.3, 8.95)));
    const land = t > 8.95 ? spring(t - 8.95, 3, 0.4) : 0;
    fnt(c, 700, 300, SER); setLS(c, -8); c.fillStyle = DS.ink;
    c.save(); c.translate(X0, 610 + dy); const s = 1 + 0.04 * Math.sin(PI * clamp((t - 8.95) / 0.25)); c.scale(s, s);
    c.fillText('+' + n, 0, 0); const w = c.measureText('+27').width; setLS(c, 0);
    fnt(c, 400, 64, SER); c.font = `italic 400 64px ${SER}`; c.fillStyle = DS.red; c.fillText('years', w + 26, -16);
    c.restore(); setLS(c, 0); void land;
    fnt(c, 400, 30, SER); c.fillStyle = DS.ink;
    c.fillText('Global life expectancy rose from 46 years in 1950', X0, 690 + dy);
    c.fillText('to 73 in 2023 — more than in all the centuries before.', X0, 730 + dy);
    // sparkline reprise
    const sx0 = 1200, sx1 = 1650, sy0 = 420, sy1 = 600, sp = E.ioC(seg(t, 8.4, 9.1));
    const sxm = y => sx0 + (y - 1800) / 223 * (sx1 - sx0), sym = v => sy1 - v / 80 * (sy1 - sy0);
    c.fillStyle = DS.grid; [0, 40, 80].forEach(v => c.fillRect(sx0, sym(v), sx1 - sx0, v ? 1 : 1.5));
    fnt(c, 500, 13, FR); c.fillStyle = DS.gray; c.textAlign = 'right'; [0, 40, 80].forEach(v => c.fillText(v, sx0 - 8, sym(v) + 4));
    c.textAlign = 'center'; [1800, 1900, 2023].forEach(y => c.fillText(y, sxm(y), sy1 + 22));
    c.beginPath(); const ye = 1800 + 223 * sp;
    for (let y = 1800; y <= ye; y += 1) y === 1800 ? c.moveTo(sxm(y), sym(leWorld(y))) : c.lineTo(sxm(y), sym(leWorld(y)));
    c.strokeStyle = 'rgba(20,20,20,0.35)'; c.lineWidth = 2; c.stroke();
    if (sp > 0.68) { // highlight 1950 → 2023
      c.beginPath(); for (let y = 1950; y <= ye; y += 1) y === 1950 ? c.moveTo(sxm(y), sym(leWorld(y))) : c.lineTo(sxm(y), sym(leWorld(y)));
      c.strokeStyle = DS.red; c.lineWidth = 3.5; c.stroke();
      c.fillStyle = DS.red; c.beginPath(); c.arc(sxm(1950), sym(46), 4.5, 0, TAU); c.fill();
      if (sp >= 1) { c.beginPath(); c.arc(sxm(2023), sym(73.2), 5.5, 0, TAU); c.fill(); }
    }
    c.restore();
  }

  MG.film({
    id: 'datastory', dur: 10, poster: 9.4,
    fonts: [['600 92px "Source Serif 4"', 'How much longer do we live than our ancestors did?'], ['300 150px "Source Serif 4"', '1960'], ['italic 400 64px "Source Serif 4"', 'years'], ['700 300px "Source Serif 4"', '+27'], ['500 16px "Libre Franklin"', 'Aa0123456789$k'], ['700 15px "Libre Franklin"', 'CHART OF THE LONG VIEW']],
    meta: {
      family: 'J', name: 'Data Storytelling', sub: 'Animated Data Journalism', era: '2006 —',
      origin: 'Hans Rosling’s animated Gapminder bubbles (TED 2006; BBC “200 Countries, 200 Years, 4 Minutes”, 2010) showed that a moving chart could carry a story. Newsrooms such as The New York Times graphics desk, The Guardian and The Pudding built scroll-driven, annotated charts that reveal data step by step, while bar-chart races spread across social video.',
      works: 'Hans Rosling, “The best stats you’ve ever seen” (TED, 2006) · BBC “The Joy of Stats”: 200 Countries, 200 Years, 4 Minutes (2010) · The New York Times “How the Virus Got Out” (2020) · The Pudding “The Largest Vocabulary in Hip Hop” (2017) · John Burn-Murdoch’s FT Covid trajectory charts (2020)',
      tech: ['Every mark drawn to scale from the data functions: zero baselines, log-x where labelled', 'Annotations triggered as the line cursor passes each event', 'Soft-rank interpolation for a continuous bar-chart race', 'Gapminder bubbles: log income × lifespan, area ∝ population, year watermark'],
      accent: '#d13b25',
      motionDNA: 'Motion serves the reading order: axes first, then data draws through time with a live cursor, notes pop in when the line reaches them, and each chart holds still long enough to be read before the next one.',
      visualDNA: 'Warm newsprint white, black serif headlines, a single editorial red for the story line, muted categorical colours, hairline gridlines, precise labels and an "Illustrative data" source line.',
      transitions: 'Header swaps with slide-up fades, axes growing from the origin, bars and bubbles popping in, number count-up.',
      implementation: ['D3.js', 'Flourish', 'Datawrapper', 'Scrollama / scrollytelling'],
      reproducibility: 'Fully procedural', loopable: false,
    },
    setup() {
      const r = rng(2010), countries = [];
      countries.push({ r: 0, o: 1.0, m: 0.75, rad: 46, s: 1, d: 0 });
      countries.push({ r: 5, o: 0.5, m: 0.9, rad: 42, s: 2, d: 0.02 });
      REG.forEach((R, ri) => { for (let i = 0; i < R.cnt; i++) countries.push({ r: ri, o: (r() - 0.5) * 9, m: Math.exp((r() - 0.5) * 1.3), rad: 6 + Math.pow(r(), 2.2) * 22, s: 3 + countries.length, d: r() * 0.18 }); });
      countries.sort((a, b) => (b.rad - a.rad) || 0);
      return { countries };
    },
    draw(c, t, W, H, st) {
      c.fillStyle = DS.paper; c.fillRect(0, 0, W, H);
      // masthead rule + source line (constant editorial furniture)
      c.fillStyle = DS.ink; c.fillRect(X0, 96, X1 - X0, 2.5);
      fnt(c, 800, 15, FR); setLS(c, 3); c.fillStyle = DS.ink; c.textAlign = 'left'; c.fillText('THE LONG VIEW', X0, 80);
      setLS(c, 0); fnt(c, 500, 15, FR); c.fillStyle = DS.gray; c.textAlign = 'right'; c.fillText('Data Desk · Interactive', X1, 80);
      c.fillStyle = DS.grid; c.fillRect(X0, 980, X1 - X0, 1);
      fnt(c, 400, 15, FR); c.fillStyle = DS.gray; c.textAlign = 'left';
      c.fillText('Source: Illustrative data, modelled on published long-run life-expectancy and income estimates. Not for citation.', X0, 1010);
      c.textAlign = 'right'; fnt(c, 700, 15, FR); c.fillStyle = DS.red; c.fillText('ILLUSTRATIVE DATA', X1, 1010);
      // step dots
      const step = t < 1.5 ? -1 : t < 3.7 ? 0 : t < 5.9 ? 1 : t < 8.2 ? 2 : 3;
      for (let i = 0; i < 4; i++) { c.fillStyle = i === step ? DS.red : i < step ? DS.ink : DS.grid; c.fillRect(X1 - 150 + i * 40, 118, 32, 4); }
      // headline question
      if (t < 1.75) {
        const out = sstep(1.25, 1.65, t);
        c.save(); c.globalAlpha = 1 - out; c.translate(0, -50 * E.inC(out));
        fnt(c, 700, 17, FR); setLS(c, 3); c.fillStyle = DS.red; c.textAlign = 'left';
        c.globalAlpha = (1 - out) * sstep(0.1, 0.3, t); c.fillText('THE LONG VIEW · A DATA STORY', X0, 380); setLS(c, 0);
        const L = ['How much longer do we live', 'than our ancestors did?'];
        let wi = 0;
        L.forEach((ln, li) => {
          fnt(c, 600, 92, SER); setLS(c, -1.5);
          let x = X0;
          ln.split(' ').forEach(w => {
            const t0 = 0.15 + wi * 0.055, p = E.outQt(seg(t, t0, t0 + 0.45)); wi++;
            c.globalAlpha = (1 - out) * clamp((t - t0) / 0.25); c.fillStyle = DS.ink;
            c.fillText(w, x, 490 + li * 108 + (1 - p) * 28);
            x += c.measureText(w + ' ').width;
          });
          setLS(c, 0);
        });
        // underline the key phrase
        const ul = E.ioC(seg(t, 0.75, 1.1));
        if (ul > 0) { fnt(c, 600, 92, SER); setLS(c, -1.5); const x0 = X0 + c.measureText('How much ').width, w = c.measureText('longer').width; setLS(c, 0); c.globalAlpha = 1 - out; c.fillStyle = DS.red; c.fillRect(x0, 506, w * ul, 6); }
        c.globalAlpha = (1 - out) * sstep(0.85, 1.1, t);
        fnt(c, 400, 28, FR); c.fillStyle = DS.gray; c.fillText('Two centuries of life expectancy, in four charts.', X0, 690);
        fnt(c, 600, 16, FR); setLS(c, 1.5); c.fillStyle = DS.ink; c.fillText('BY THE DATA DESK', X0, 744); setLS(c, 0);
        c.restore();
      }
      dsHeader(c, t, 1.5, 3.75, 1, 'Global life expectancy at birth, 1800–2023', 'Average years a newborn could expect to live, world');
      dsLine(c, t);
      dsHeader(c, t, 3.7, 6.0, 2, 'Which regions caught up?', 'Life expectancy at birth by world region, ranked, 1960–2020');
      dsBars(c, t);
      dsHeader(c, t, 5.92, 8.28, 3, 'Richer and longer-lived, together', 'Each bubble is one illustrative country, 1960–2020');
      dsBubbles(c, t, st);
      dsNumber(c, t);
      const fin = 1 - sstep(0, 0.15, t);
      if (fin > 0) { c.fillStyle = `rgba(247,245,240,${fin})`; c.fillRect(0, 0, W, H); }
    },
    score(A) {
      A.bus.gain.value = 1.25;
      const BT = 0.25; // 120 bpm eighths
      const CH = [[0, [45, 57, 60, 64]], [1.5, [48, 55, 60, 64]], [3.7, [41, 53, 57, 60]], [5.92, [43, 55, 59, 62]], [8.2, [48, 55, 60, 64, 67]]];
      CH.forEach(([t0, ch], i) => {
        const t1 = i + 1 < CH.length ? CH[i + 1][0] : 10;
        A.chord(t0, ch.slice(1), { type: 'sine', dur: t1 - t0 + 0.3, g: 0.018, a: 0.3, hold: true, rel: 0.4, width: 1.2, rev: 0.5 });
        for (let tt = t0, k = 0; tt < Math.min(t1, 9.6); tt += BT, k++) {
          A.osc(tt, { type: 'triangle', f: midi(ch[0] + (k % 2 ? 12 : 0)), dur: 0.2, g: 0.05, lp: 700 });
          if (k % 2 === 0) A.pluck(tt + 0.0, midi(ch[1 + (k / 2) % (ch.length - 1)] + 12), { g: 0.07, dur: 0.9, bright: 0.45, decay: 0.994, rev: 0.35, pan: ((k / 2) % 3 - 1) * 0.4 });
        }
      });
      // headline: soft swell and type ticks
      A.noise(0.05, { type: 'bandpass', f: 600, f2: 1800, q: 0.8, dur: 1.0, g: 0.03, swell: 0.6, rev: 0.4 });
      for (let i = 0; i < 9; i++) A.osc(0.15 + i * 0.055, { f: 2600, dur: 0.02, g: 0.015, pan: -0.4 + i * 0.1 });
      A.whoosh(1.3, 0.4, { f1: 1600, f2: 400, g: 0.05 });
      // line chart: a tick every 25 years, a ping per annotation
      let prev = 1800;
      for (let tt = 1.85; tt < 3.45; tt += 0.004) { const y = lineYear(tt); if (Math.floor(y / 25) > Math.floor(prev / 25)) A.osc(tt, { f: 1900, dur: 0.025, g: 0.03, pan: (y - 1910) / 150 }); [1918, 1950, 2021].forEach(ev => { if (prev < ev && y >= ev) A.bell(tt, midi(ev === 2021 ? 81 : 84), { g: 0.05, dur: 1.2, rev: 0.5 }); }); prev = y; }
      A.whoosh(3.55, 0.4, { f1: 1600, f2: 400, g: 0.05 });
      // bars: grow plucks, year ticks, a pluck on each rank swap
      REG.forEach((_, i) => A.osc(3.9 + i * 0.05, { f: midi(72 + [0, 2, 4, 5, 7, 9, 11][i]), dur: 0.15, g: 0.025 }));
      let py = 1960, order = REG.map((R, i) => i).sort((a, b) => regLE(REG[b], 1960) - regLE(REG[a], 1960)).join();
      for (let tt = 4.3; tt <= 5.62; tt += 0.004) {
        const y = barYear(tt);
        if (Math.floor(y / 5) > Math.floor(py / 5)) A.osc(tt, { f: 1700, dur: 0.02, g: 0.028 });
        const o = REG.map((R, i) => i).sort((a, b) => regLE(REG[b], y) - regLE(REG[a], y)).join();
        if (o !== order) { A.pluck(tt, midi(79), { g: 0.1, dur: 0.6, bright: 0.6, rev: 0.4 }); order = o; }
        py = y;
      }
      A.bell(5.55, midi(88), { g: 0.04, dur: 1.0, rev: 0.5 });
      A.whoosh(5.8, 0.4, { f1: 1600, f2: 400, g: 0.05 });
      // bubbles: pops in, then ticks through the years
      for (let i = 0; i < 14; i++) A.osc(6.2 + i * 0.02, { f: 600 + i * 70, f2: 900 + i * 70, glide: 0.04, dur: 0.05, g: 0.014, pan: (i % 5 - 2) * 0.25 });
      py = 1960;
      for (let tt = 6.5; tt <= 7.96; tt += 0.004) { const y = bubYear(tt); if (Math.floor(y / 5) > Math.floor(py / 5)) A.osc(tt, { f: 1500, dur: 0.02, g: 0.025, pan: (y - 1990) / 40 }); py = y; }
      A.whoosh(8.1, 0.4, { f1: 1600, f2: 400, g: 0.05 });
      // number count-up and landing
      let pn = 0;
      for (let tt = 8.3; tt <= 8.96; tt += 0.004) { const n = Math.round(27 * E.outQ(seg(tt, 8.3, 8.95))); if (n > pn) { A.osc(tt, { f: 1200 + n * 30, dur: 0.018, g: 0.018 }); pn = n; } }
      A.osc(8.95, { f: 130, f2: 65, glide: 0.2, dur: 0.6, g: 0.18 });
      A.bell(8.95, midi(84), { g: 0.08, dur: 2.2, rev: 0.6 }); A.bell(9.0, midi(91), { g: 0.04, dur: 1.8, rev: 0.6 });
      A.chord(8.95, [36, 48, 55, 64, 67], { type: 'triangle', dur: 1.2, g: 0.03, a: 0.01, lp: 2000, lp2: 600, lpT: 1.1, width: 1.3, rev: 0.6 });
    },
  });
})();
