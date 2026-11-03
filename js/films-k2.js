/* batch k2 — Technique Atlas · Timing: techelastic · techbounce · techanticipation.
   techelastic (damped springs: overshoot and settle, against a linear ghost) ·
   techbounce (gravity with restitution: decaying hops, squash on contact, stretch in flight) ·
   techanticipation (the wind-up before the action: the same jump with and without it).
   All three use the shared Technique Atlas kit (MG.TK): same Token, stage, caption and bed. */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, hash, text } = MG;
  const TK = MG.TK, P = TK.P, MONO = TK.MONO, FONT = TK.FONT;
  const PI = Math.PI;
  const fonts = TK.fonts.concat([[`700 20px ${MONO}`, 'LINEAR SPRING LOOSE MEDIUM STIFF RUBBER HEAVY WITHOUT WITH ANTICIPATION REWIND f Hz ζ e 0123456789 ·']]);

  /* ---------- shared helpers ---------- */
  // Same box geometry as TK.caption's curve graph, for an extra comparison curve drawn into it.
  function graphOverlay(c, W, H, fn, o = {}) {
    const gw = 240, gh = 120, gx = W - 72 - gw, gy = H - 52 - gh;
    const lo = o.lo ?? -0.2, hi = o.hi ?? 1.3, Y = v => gy + gh - (clamp(v, lo, hi) - lo) / (hi - lo) * gh;
    c.save();
    c.globalAlpha = o.alpha ?? 0.6;
    c.strokeStyle = o.color || P.mute; c.lineWidth = 2; c.setLineDash(o.dash || [6, 5]);
    c.beginPath();
    for (let i = 0; i <= 96; i++) { const u = i / 96, px = gx + u * gw, py = Y(fn(u)); i ? c.lineTo(px, py) : c.moveTo(px, py); }
    c.stroke(); c.setLineDash([]);
    c.restore();
  }
  function label(c, s, x, y, o = {}) {
    c.save(); if (o.alpha !== undefined) c.globalAlpha *= clamp(o.alpha);
    text(c, s, x, y, { font: MONO, weight: o.weight || 700, size: o.size || 20, ls: o.ls ?? 2, color: o.color || P.ink, align: o.align || 'center', base: o.base || 'alphabetic' });
    c.restore();
  }
  // Little pill tag (e.g. WITH / WITHOUT).
  function tag(c, s, x, y, o = {}) {
    c.save(); if (o.alpha !== undefined) c.globalAlpha *= clamp(o.alpha);
    c.font = `700 20px ${MONO}`;
    const w = c.measureText(s).width + s.length * 2 + 36, h = 40;
    MG.rrect(c, x - w / 2, y - h / 2, w, h, h / 2);
    if (o.fill) { c.fillStyle = o.fill; c.fill(); } else { c.strokeStyle = P.ink; c.lineWidth = 2; c.stroke(); }
    text(c, s, x, y + 1, { font: MONO, weight: 700, size: 20, ls: 2, color: o.fill ? '#fff' : P.ink, align: 'center', base: 'middle' });
    c.restore();
  }
  // A few dust puffs kicked up at a contact point.
  function dust(c, x, y, age, seed, k = 1) {
    if (age < 0 || age > 0.55) return;
    const u = age / 0.55;
    c.save(); c.fillStyle = 'rgba(23,24,28,0.13)';
    for (let i = 0; i < 6; i++) {
      const side = i % 2 ? 1 : -1, sp = 0.5 + hash(seed + i) * 0.8;
      const px = x + side * (40 + 140 * sp * E.outC(u)) * k, py = y - 6 - 34 * hash(seed + i * 3.1) * E.outQ(u);
      const r = (6 + 12 * hash(seed + i * 7.7)) * (0.6 + u) * (1 - u) * k;
      if (r > 0.4) { c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill(); }
    }
    c.restore();
  }

  /* =====================================================================
     ELASTIC — damped springs. A spring is a second-order system: its
     frequency sets how fast it rings, its damping ratio how quickly the
     ringing dies. First the Token springs across the frame with a quarter
     turn beside a linear-timed ghost; then three Tokens pop in on three
     beats with loose, medium and stiff springs and take the same quarter
     turn together so the settles can be compared; finally they gather into
     one large Token and the word MOTION springs in underneath.
     ===================================================================== */
  const EL = {
    a: { t0: 0.5, f: 1.2, z: 0.3, x0: 420, x1: 1380, y1: 330, y2: 610, lin: 1.0 },
    trio: [{ x: 480, t: 3.0, f: 1.5, z: 0.15, n: 'LOOSE' }, { x: 960, t: 3.5, f: 2.5, z: 0.35, n: 'MEDIUM' }, { x: 1440, t: 4.0, f: 4.0, z: 0.7, n: 'STIFF' }],
    turn: 5.0, gather: 6.0, grow: 6.5, word: 7.0, S: 170, TY: 400,
  };
  const elA = t => spring(t - EL.a.t0, EL.a.f, EL.a.z);

  MG.film({
    id: 'techelastic', dur: 10, poster: 1.2,
    fonts,
    meta: {
      family: 'K', name: 'Elastic', sub: 'Damped springs: overshoot and settle', era: '1930s —',
      origin: 'Elastic timing comes from cel animation’s squash, stretch and follow-through — the principles Disney animators refined in the 1930s and Frank Thomas and Ollie Johnston set down in The Illusion of Life (1981). In code it became Robert Penner’s elastic and back easing equations (2001), and later physically based damped-spring animation, defined by stiffness and damping rather than duration, in libraries such as React Motion and Facebook’s Rebound and in Apple’s UIKit spring animations.',
      works: 'Robert Penner’s easing equations (Flash ActionScript, 2001) · iOS spring animations (UIKit, 2014) · React Motion and react-spring (JavaScript spring-physics libraries)',
      tech: ['Damped spring: frequency × damping ratio', 'Move, scale and rotate on springs', 'Linear ghost for contrast'],
      accent: '#ff5a1f',
      motionDNA: 'Every change of position, size and angle is driven by a damped harmonic oscillator released on the beat: the Token shoots past its target, swings back, and rings down to rest. Low damping rings long and wide, high damping lands almost dead; a linear-timed ghost arrives on time and stops cold beside it.',
      visualDNA: 'The Technique Atlas stage: warm paper ground with a faint 80 px grid, the orange rounded-square Token with an off-centre hole so its rotation reads, mono labels giving each spring’s frequency and damping ratio, dashed target lines, and the caption graph plotting the live spring curve.',
      transitions: 'Lane comparison fades to three springs on three beats; the three gather into one large Token with a sprung title',
      implementation: ['Closed-form damped spring 1 − e^(−ζωt)(cos ω_d t + …) evaluated per frame', 'Canvas 2D', 'Shared Technique Atlas kit and 120 BPM bed'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      TK.stage(c, W, H);
      const S = EL.S, A = EL.a;
      // ---- A: spring vs linear lanes
      const aA = 1 - seg(t, 2.6, 2.95);
      if (aA > 0) {
        c.save(); c.globalAlpha = aA;
        // target line
        c.strokeStyle = 'rgba(23,24,28,0.35)'; c.lineWidth = 2; c.setLineDash([8, 8]);
        c.beginPath(); c.moveTo(A.x1, 170); c.lineTo(A.x1, 760); c.stroke(); c.setLineDash([]);
        label(c, 'TARGET', A.x1, 150, { size: 16, color: P.mute });
        label(c, `SPRING  ·  f ${A.f} Hz  ·  ζ ${A.z.toFixed(2)}`, 120, A.y1 - S / 2 - 34, { align: 'left' });
        label(c, 'LINEAR  ·  1.0 s', 120, A.y2 - S / 2 - 34, { align: 'left', color: P.mute });
        // lane rails
        c.fillStyle = 'rgba(23,24,28,0.08)'; c.fillRect(120, A.y1 + S / 2 + 18, 1680, 2); c.fillRect(120, A.y2 + S / 2 + 18, 1680, 2);
        const p = elA(t), q = seg(t, A.t0, A.t0 + A.lin);
        // linear ghost
        TK.token(c, lerp(A.x0, A.x1, q), A.y2, S, { rot: lerp(-PI / 2, 0, q), alpha: 0.28, edge: 2 });
        // spring token, with a faint overshoot trail
        for (let k = 4; k >= 1; k--) {
          const pk = elA(t - k * 0.035);
          TK.token(c, lerp(A.x0, A.x1, pk), A.y1, S, { rot: lerp(-PI / 2, 0, pk), alpha: 0.07 * (5 - k) * clamp((t - A.t0) * 4) * (1 - seg(t, 2.0, 2.4)) });
        }
        TK.token(c, lerp(A.x0, A.x1, p), A.y1, S, { rot: lerp(-PI / 2, 0, p) });
        c.restore();
      }
      // ---- B/C: three springs, then gather
      if (t >= EL.trio[0].t - 0.01) {
        const gth = t - EL.gather;
        EL.trio.forEach((o, i) => {
          let s = spring(t - o.t, o.f, o.z);
          if (s <= 0) return;
          let rot = (1 - s) * -0.9 + (PI / 2) * spring(t - EL.turn, o.f, o.z);
          let x = o.x, y = EL.TY;
          const la = clamp((t - o.t) * 3) * (1 - seg(t, EL.gather, EL.gather + 0.3));
          if (la > 0) {
            label(c, o.n, o.x, 650, { alpha: la, size: 22 });
            label(c, `f ${o.f} Hz  ·  ζ ${o.z.toFixed(2)}`, o.x, 685, { alpha: la, size: 18, color: P.mute, weight: 400 });
          }
          if (i !== 1 && gth > 0) {
            x = lerp(o.x, 960, spring(gth, 2.2, 0.5));
            s *= 1 - E.inQ(seg(t, EL.gather + 0.05, EL.gather + 0.42));
            if (s <= 0.001) return;
          }
          if (i === 1 && t > EL.grow) {
            const g = spring(t - EL.grow, 1.8, 0.28);
            s *= lerp(1, 1.55, g); y = lerp(EL.TY, 360, g);
          }
          TK.token(c, x, y, S * s, { rot });
        });
        // the word springs in under the big Token
        const w = spring(t - EL.word, 2.0, 0.3);
        if (w > 0) {
          c.save(); c.translate(960, 680); c.scale(w, w); c.rotate((1 - w) * 0.12);
          TK.word(c, 0, 0, { size: 150 });
          c.restore();
        }
      }
      // ---- caption + the spring being plotted
      if (t < 2.95) {
        TK.caption(c, t, W, H, { name: 'Elastic', cat: 'Timing', curve: u => spring(u * 2, A.f, A.z), span: [A.t0, A.t0 + 2], curveLabel: `SPRING  f ${A.f}  ζ ${A.z.toFixed(2)}` });
        graphOverlay(c, W, H, u => clamp(u * 2), {});
      } else if (t < EL.gather) {
        const o = EL.trio[0];
        TK.caption(c, t, W, H, { name: 'Elastic', cat: 'Timing', curve: u => spring(u * 2, o.f, o.z), span: [o.t, o.t + 2], hi: 1.75, curveLabel: `LOOSE  ζ ${o.z.toFixed(2)}  vs  STIFF` });
        graphOverlay(c, W, H, u => spring(u * 2, EL.trio[2].f, EL.trio[2].z), { hi: 1.75 });
      } else {
        TK.caption(c, t, W, H, { name: 'Elastic', cat: 'Timing', curve: u => spring(u * 2, 1.8, 0.28), span: [EL.grow, EL.grow + 2], curveLabel: 'SCALE  f 1.8  ζ 0.28' });
      }
    },
    score(A) {
      TK.bed(A);
      const boing = (t, f, g, wob) => {
        A.osc(t, { type: 'triangle', f, f2: f * 1.9, glide: 0.09, dur: 0.55, g, vib: [wob, f * 0.12], lp: 2600, rev: 0.25 });
        A.osc(t, { f: f * 0.5, f2: f * 0.95, glide: 0.08, dur: 0.35, g: g * 0.6 });
      };
      // A: spring across vs linear ghost
      A.whoosh(EL.a.t0 - 0.05, 0.45, { g: 0.12, f1: 400, f2: 2600 });
      boing(EL.a.t0, 196, 0.13, 7);
      A.noise(EL.a.t0 + EL.a.lin, { type: 'bandpass', f: 3200, q: 3, dur: 0.04, g: 0.08 });   // ghost's dead stop
      // B: three pops on three beats, loose → stiff (wobble rate follows spring frequency)
      EL.trio.forEach((o, i) => { boing(o.t, [262, 330, 392][i], 0.11, o.f * 4); A.pluck(o.t, [523, 659, 784][i], { g: 0.18, dur: 1.2, rev: 0.3 }); });
      // the quarter turn
      A.whoosh(EL.turn - 0.08, 0.35, { g: 0.1, f1: 600, f2: 3000 });
      EL.trio.forEach((o, i) => boing(EL.turn + i * 0.015, [330, 392, 494][i], 0.06, o.f * 4));
      // C: gather, grow, title
      A.whoosh(EL.gather - 0.1, 0.5, { g: 0.12, f1: 300, f2: 1800 });
      boing(EL.grow, 131, 0.16, 6);
      A.chord(EL.word, [60, 64, 67, 72], { type: 'triangle', dur: 1.6, g: 0.035, a: 0.01, rev: 0.5, width: 0.7 });
      A.bell(EL.word, 1046.5, { g: 0.06, dur: 1.8, rev: 0.5 });
      A.pluck(8.0, 523, { g: 0.12, dur: 1.6, rev: 0.5 });
    },
  });

  /* =====================================================================
     BOUNCE — gravity with a coefficient of restitution e: every contact
     returns e of the incoming speed, so each hop is e² as high and e as
     long as the one before. A rubber Token (e 0.78) is dropped on the beat
     and hops across the floor with squash on contact and stretch in flight,
     a trail of its last second marking the arcs; then it is lifted again
     beside a heavy one (e 0.35) and both drop together — one rings down for
     seconds, the other lands with a thud and is still almost at once.
     ===================================================================== */
  const BO = {
    g: 4160, h0: 520, S: 170, rub: 0.78, heavy: 0.35,
    dropA: 0.5, xA0: 180, xA1: 640, lift: [4.45, 5.0], dropB: 5.0, xH: 1280,
  };
  // Analytic bounce: height above floor, vertical speed, time since last contact, contact speed (0..1).
  function bounce(tl, h0, e) {
    const g = BO.g, v0 = Math.sqrt(2 * g * h0), T0 = v0 / g;
    if (tl <= 0) return { h: h0, vy: 0, since: 9, vi: 0, rest: false };
    if (tl < T0) return { h: h0 - 0.5 * g * tl * tl, vy: -g * tl, since: 9, vi: 0, rest: false };
    let t = tl - T0, v = v0 * e, vi = 1;
    for (let n = 0; n < 60; n++) {
      const ft = 2 * v / g;
      if (ft < 0.045) return { h: 0, vy: 0, since: t, vi, rest: true };
      if (t < ft) return { h: v * t - 0.5 * g * t * t, vy: v - g * t, since: t, vi, rest: false };
      t -= ft; vi = v / v0; v *= e;
    }
    return { h: 0, vy: 0, since: t, vi, rest: true };
  }
  function contacts(t0, h0, e) {
    const g = BO.g, v0 = Math.sqrt(2 * g * h0), out = [];
    let tt = t0 + v0 / g, v = v0;
    out.push([tt, 1]);
    for (let n = 0; n < 60; n++) { v *= e; const ft = 2 * v / g; if (ft < 0.045) break; tt += ft; out.push([tt, v / v0]); }
    return out;
  }
  // Squash & stretch pose for a bouncing Token. soft: how much it squashes.
  function bouncePose(b, soft) {
    const v0 = Math.sqrt(2 * BO.g * BO.h0);
    const bump = b.since < 0.13 ? Math.sin(PI * b.since / 0.13) : 0;
    const sq = soft * b.vi * bump;
    const st = (1 - bump) * 0.3 * soft * Math.abs(b.vy) / v0;
    const h = b.since < 0.13 ? b.h * E.inQ(b.since / 0.13) : b.h;   // stays planted while squashing
    return { h, sy: (1 - sq) * (1 + st), sx: (1 + sq * 0.95) / (1 + st * 0.75) };
  }
  function drawBouncer(c, x, b, soft, color, S, trail) {
    const p = bouncePose(b, soft), cy = TK.FLOOR - p.h - S / 2 * p.sy;
    TK.shadow(c, x, TK.FLOOR, S * p.sx, p.h);
    TK.token(c, x, cy, S, { sx: p.sx, sy: p.sy, color });
  }
  const rubberA = t => bounce(t - BO.dropA, BO.h0, BO.rub);
  const rubberB = t => bounce(t - BO.dropB, BO.h0, BO.rub);
  const heavyB = t => bounce(t - BO.dropB, BO.h0, BO.heavy);
  const xRubA = t => lerp(BO.xA0, BO.xA1, E.outQ(seg(t, BO.dropA, BO.lift[0])));

  MG.film({
    id: 'techbounce', dur: 10, poster: 5.82,
    fonts,
    meta: {
      family: 'K', name: 'Bounce', sub: 'Gravity, restitution, squash on contact', era: '1930s —',
      origin: 'The bouncing ball is the first exercise in classical animation training: it teaches timing (hops shorten as they lose height), spacing (frames bunch at the top of the arc and spread near the floor) and squash and stretch, which Disney’s animators formalised in the 1930s and Thomas and Johnston listed among the twelve principles in The Illusion of Life (1981). Motion designers later reproduced it with bounce easing curves such as Robert Penner’s easeOutBounce (2001) or with physics: gravity plus a coefficient of restitution.',
      works: 'The bouncing-ball exercise in Richard Williams’s The Animator’s Survival Kit (2001) · Fleischer Studios’ Screen Songs “follow the bouncing ball” sing-alongs (1920s–30s) · Pixar’s Luxo Jr. (1986)',
      tech: ['Analytic gravity and restitution', 'Squash on contact, stretch in flight', 'Contact shadow and arc trail'],
      accent: '#ff5a1f',
      motionDNA: 'Constant gravity: the Token accelerates into the floor and decelerates to each apex, so spacing is tight at the top and wide at the bottom. Every contact keeps a fixed fraction of the speed, giving a geometric decay of hop height and duration that ends in a quick patter and rest. Squash grows with impact speed; the body stretches along the fall.',
      visualDNA: 'The Technique Atlas stage with its floor band, the orange Token and a darker heavy twin, soft contact shadows that tighten as they land, a dotted trail tracing the last second of arcs, dust puffs on hard contacts, mono restitution labels and a height/time plot in the caption.',
      transitions: 'The rubber Token settles, is lifted back to its drop height beside a heavy twin, and both fall on the same beat',
      implementation: ['Closed-form projectile segments with a restitution coefficient per contact', 'Canvas 2D squash and stretch anchored to the floor', 'Shared Technique Atlas kit and 120 BPM bed'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const S = BO.S, F = TK.FLOOR;
      // heavy landing jolts the camera a little
      const hc = contacts(BO.dropB, BO.h0, BO.heavy);
      let sh = 0;
      hc.forEach(([ti, vi]) => { const a = t - ti; if (a > 0 && a < 0.4) sh += 9 * vi * Math.exp(-a * 14) * Math.sin(a * 70); });
      c.save(); c.translate(0, sh);
      TK.stage(c, W, H, { floor: F, oy: 0 });
      c.fillStyle = P.ground2; c.fillRect(0, F + 2, W, 40);   // covers the shake gap at the bottom
      const phaseB = t >= BO.lift[0];
      // ---- trail: last second of arcs (dots at fixed time steps show the spacing)
      const trail = (fn, xf, alpha) => {
        c.fillStyle = P.ink;
        for (let k = 1; k <= 30; k++) {
          const tk = Math.floor(t * 30) / 30 - k / 30;
          if (tk < 0) break;
          const b = fn(tk); if (b.rest && b.since > 0.3) continue;
          const p = bouncePose(b, 0);
          c.globalAlpha = alpha * (1 - k / 31);
          c.beginPath(); c.arc(xf(tk), F - p.h - S / 2, 5, 0, TAU); c.fill();
        }
        c.globalAlpha = 1;
      };
      if (!phaseB) {
        trail(rubberA, xRubA, 0.35);
        contacts(BO.dropA, BO.h0, BO.rub).slice(0, 3).forEach(([ti, vi], i) => dust(c, xRubA(ti), F, t - ti, 11 + i * 9, vi));
        drawBouncer(c, xRubA(t), rubberA(t), 0.42, P.accent, S);
        label(c, `RUBBER  ·  e ${BO.rub}`, xRubA(t), F + 56, { alpha: seg(t, 0.2, 0.6) });
      } else {
        // lift back to drop height, heavy twin descends into frame
        const lu = E.ioC(seg(t, BO.lift[0], BO.lift[1]));
        if (t < BO.dropB) {
          TK.shadow(c, BO.xA1, F, S, lu * BO.h0);
          TK.token(c, BO.xA1, F - lu * BO.h0 - S / 2, S);
          const hy = lerp(-S, F - BO.h0 - S / 2, E.outC(seg(t, BO.lift[0] - 0.1, BO.lift[1])));
          TK.shadow(c, BO.xH, F, S, F - hy - S / 2);
          TK.token(c, BO.xH, hy, S, { color: P.accentD });
        } else {
          trail(rubberB, () => BO.xA1, 0.3); trail(heavyB, () => BO.xH, 0.3);
          dust(c, BO.xA1, F, t - hc[0][0], 41, 0.8);
          dust(c, BO.xH, F, t - hc[0][0], 53, 1.3);
          drawBouncer(c, BO.xA1, rubberB(t), 0.42, P.accent, S);
          drawBouncer(c, BO.xH, heavyB(t), 0.2, P.accentD, S);
        }
        label(c, `RUBBER  ·  e ${BO.rub}`, BO.xA1, F + 56);
        label(c, `HEAVY  ·  e ${BO.heavy}`, BO.xH, F + 56, { alpha: seg(t, BO.lift[0], BO.lift[0] + 0.3) });
      }
      c.restore();
      // ---- caption: height over time
      const hn = (fn, t0, span) => u => fn(t0 + u * span).h / BO.h0;
      if (!phaseB) {
        TK.caption(c, t, W, H, { name: 'Bounce', cat: 'Timing', curve: hn(rubberA, BO.dropA, 4), span: [BO.dropA, BO.dropA + 4], lo: -0.1, hi: 1.15, curveLabel: `HEIGHT / TIME  e ${BO.rub}` });
      } else {
        TK.caption(c, t, W, H, { name: 'Bounce', cat: 'Timing', curve: hn(rubberB, BO.dropB, 4.5), span: [BO.dropB, BO.dropB + 4.5], lo: -0.1, hi: 1.15, curveLabel: `HEIGHT  e ${BO.rub}  vs  ${BO.heavy}` });
        graphOverlay(c, W, H, hn(heavyB, BO.dropB, 4.5), { lo: -0.1, hi: 1.15, color: P.accentD, alpha: 0.7 });
      }
    },
    score(A) {
      TK.bed(A);
      const thud = (t, vi, heavy) => {
        if (heavy) {
          A.osc(t, { f: 95, f2: 34, glide: 0.18, dur: 0.5, g: 0.36 * vi, a: 0.002 });
          A.noise(t, { type: 'lowpass', f: 1400, f2: 180, dur: 0.3, g: 0.16 * vi, rev: 0.2 });
          return;
        }
        A.osc(t, { f: 150, f2: 60, glide: 0.08, dur: 0.16, g: 0.24 * vi, a: 0.002 });
        A.osc(t, { type: 'triangle', f: 340 + 220 * (1 - vi), f2: (340 + 220 * (1 - vi)) * 1.7, glide: 0.07, dur: 0.18, g: 0.11 * vi, rev: 0.15 });   // rubbery boink
        A.noise(t, { type: 'bandpass', f: 1800, q: 1.5, dur: 0.03, g: 0.05 * vi });
      };
      contacts(BO.dropA, BO.h0, BO.rub).forEach(([t, vi]) => thud(t, Math.max(vi, 0.12), false));
      A.whoosh(BO.lift[0], 0.55, { g: 0.08, f1: 2500, f2: 500 });
      A.osc(BO.lift[0], { type: 'triangle', f: 220, f2: 520, glide: 0.5, dur: 0.55, g: 0.04, rev: 0.3 });
      contacts(BO.dropB, BO.h0, BO.rub).forEach(([t, vi]) => thud(t, Math.max(vi, 0.12), false));
      contacts(BO.dropB, BO.h0, BO.heavy).forEach(([t, vi]) => thud(t, vi, true));
      A.chord(9.0, [60, 67, 72], { type: 'triangle', dur: 1.0, g: 0.03, a: 0.05, rev: 0.5, width: 0.6 });
    },
  });

  /* =====================================================================
     ANTICIPATION — before a big action, a small opposite action: the body
     gathers itself away from the move so the audience reads what is about
     to happen. The Token jumps once with no wind-up (it simply goes), the
     tape rewinds, and the same jump is played again preceded by a crouch
     and lean-back on the beat before take-off. Then two Tokens perform the
     same jump side by side on the same take-off beat, one without and one
     with the wind-up, and land together for the hold.
     ===================================================================== */
  const AN = {
    S: 170, D: 0.75, WIND: 0.5,
    j1: { L: 1.0, x0: 420, x1: 1180, h: 300 },
    rew: [2.25, 2.9],
    j2: { L: 3.5, x0: 420, x1: 1180, h: 300 },
    swap: [4.85, 5.15, 5.55],
    pair: [{ L: 7.0, x0: 240, x1: 760, h: 260, ant: false }, { L: 7.0, x0: 1170, x1: 1690, h: 260, ant: true }],
  };
  // Pose of one jump at time t. ant: with a wind-up during the beat before take-off.
  function jump(t, j, ant) {
    const S = AN.S, D = AN.D, L = j.L;
    let x = j.x0, h = 0, sx = 1, sy = 1, rot = 0, cr = 0, prog = 0, shear = 0;
    const PULL = 60, CSY = 0.62, CSX = 1.24, LEAN = 0.32;
    if (t < L) {
      if (ant) {
        cr = E.ioC(seg(t, L - AN.WIND, L - 0.08));
        cr *= 1 + 0.025 * Math.sin(seg(t, L - 0.12, L) * PI * 3);   // tiny tremble at full coil
        sy = lerp(1, CSY, cr); sx = lerp(1, CSX, cr); shear = LEAN * cr; x = j.x0 - PULL * cr;
        prog = -PULL * cr / (j.x1 - j.x0);
      }
    } else if (t < L + D) {
      const u = (t - L) / D, k = ant ? 1 : 0.7, r = seg(t - L, 0, 0.07);
      const x0 = ant ? j.x0 - PULL : j.x0;
      x = lerp(x0, j.x1, u); h = 4 * j.h * u * (1 - u);
      const st = 0.24 * Math.abs(1 - 2 * u) * k;
      sy = 1 + st; sx = 1 / (1 + st * 0.8);
      if (ant) { sy = lerp(CSY, sy, r); sx = lerp(CSX, sx, r); shear = LEAN * (1 - r); }
      rot = (PI / 2) * E.ioS(u);
      prog = (x - j.x0) / (j.x1 - j.x0);
    } else {
      const a = t - L - D, bump = a < 0.24 ? Math.sin(PI * a / 0.24) : 0;
      x = j.x1; sy = 1 - 0.24 * bump; sx = 1 + 0.2 * bump; rot = PI / 2; prog = 1;
    }
    return { x, h, sx, sy, rot, shear, cr, prog };
  }
  function drawJumper(c, p, o = {}) {
    // Kit Token path, drawn with its base pinned: a shear leans the top back while the bottom stays planted.
    const k = o.k ?? 1, S = AN.S;
    TK.shadow(c, p.x, TK.FLOOR, S * p.sx * k, p.h);
    c.save();
    c.translate(p.x, TK.FLOOR - p.h);
    if (p.shear) c.transform(1, 0, p.shear, 1, 0, 0);
    c.translate(0, -S / 2 * p.sy * k); c.scale(p.sx * k, p.sy * k); c.rotate(p.rot);
    if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
    TK.tokenPath(c, S); c.fillStyle = P.accent; c.fill('evenodd');
    c.restore();
  }
  // dashed arc of the path
  function arcGuide(c, j, alpha, ant) {
    if (alpha <= 0) return;
    c.save(); c.globalAlpha = alpha; c.strokeStyle = 'rgba(23,24,28,0.3)'; c.lineWidth = 2; c.setLineDash([4, 9]);
    c.beginPath();
    for (let i = 0; i <= 40; i++) { const u = i / 40, x = lerp(ant ? j.x0 - 60 : j.x0, j.x1, u), y = TK.FLOOR - AN.S / 2 - 4 * j.h * u * (1 - u); i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke(); c.setLineDash([]); c.restore();
  }
  // shared position-progress curve for the caption graph
  const progCurve = (j, ant, t0, span) => u => jump(t0 + u * span, j, ant).prog;

  MG.film({
    id: 'techanticipation', dur: 10, poster: 6.9,
    fonts,
    meta: {
      family: 'K', name: 'Anticipation', sub: 'The wind-up before the action', era: '1930s —',
      origin: 'Anticipation is one of the twelve basic principles of animation that Disney’s animators developed in the 1930s and Frank Thomas and Ollie Johnston described in The Illusion of Life (1981): a preparatory move in the opposite direction — a crouch before a jump, a pull-back before a dash — that tells the audience an action is coming. John Lasseter’s SIGGRAPH paper “Principles of Traditional Animation Applied to 3D Computer Animation” (1987) carried it into CG, and UI motion uses it as the overshooting “back” ease-in.',
      works: 'The Illusion of Life: Disney Animation (Frank Thomas & Ollie Johnston, 1981) · Luxo Jr. (Pixar, John Lasseter, 1986) · The Road Runner cartoons’ wind-up-and-zip exits (Chuck Jones, Warner Bros.)',
      tech: ['Crouch, lean-back and pull-back before take-off', 'Same jump with and without', 'Position curve dips before it rises'],
      accent: '#ff5a1f',
      motionDNA: 'A beat of preparation in the opposite direction: the Token squashes down, leans back and slides away from where it is going, holds the coil for an instant, then releases into a stretched leap and lands with a small squash. Without it, the same leap starts from nothing and feels abrupt; with it, the take-off reads before it happens.',
      visualDNA: 'The Technique Atlas stage with its floor band, the orange Token, a dashed arc showing the path, outlined WITH / WITHOUT tags, dust puffs at take-off and landing, a tape-rewind marker, and a position/time curve whose dip below zero is the anticipation.',
      transitions: 'A rewind replays the first jump backwards; a pop-swap splits one Token into a side-by-side pair',
      implementation: ['Keyframed crouch with eased hold, parabolic flight, landing squash', 'Canvas 2D', 'Shared Technique Atlas kit and 120 BPM bed'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const F = TK.FLOOR;
      TK.stage(c, W, H, { floor: F });
      const [w0, w1, w2] = AN.swap;
      if (t < w1) {
        // single Token: without → rewind → with
        let p, isWith = false, rewinding = false;
        if (t < AN.rew[0]) p = jump(t, AN.j1, false);
        else if (t < AN.rew[1]) { rewinding = true; p = jump(lerp(AN.j1.L + AN.D + 0.1, AN.j1.L - 0.1, E.ioS(seg(t, AN.rew[0], AN.rew[1]))), AN.j1, false); }
        else { isWith = true; p = jump(t, AN.j2, true); }
        const j = isWith ? AN.j2 : AN.j1;
        arcGuide(c, j, 0.8 * (1 - seg(t, w0 - 0.2, w0)), isWith);
        // dust at take-off and landing
        if (!rewinding) { dust(c, j.x0, F, t - j.L, isWith ? 31 : 7, isWith ? 1 : 0.6); dust(c, j.x1, F, t - j.L - AN.D, isWith ? 37 : 13, 1); }
        const k = 1 - E.inB(seg(t, w0, w1), 1.4);
        if (k > 0) drawJumper(c, p, { k });
        // tag + rewind marker
        const ta = (isWith ? seg(t, AN.rew[1], AN.rew[1] + 0.2) : seg(t, 0.15, 0.45) * (1 - seg(t, AN.rew[0], AN.rew[0] + 0.12))) * (1 - seg(t, w0 - 0.25, w0));
        tag(c, isWith ? 'WITH ANTICIPATION' : 'WITHOUT ANTICIPATION', 960, 150, { alpha: ta, fill: isWith ? P.accent : null });
        if (rewinding) {
          c.save(); c.fillStyle = P.ink; c.globalAlpha = 0.75;
          [0, 1].forEach(i => { const x = 920 + i * 34; c.beginPath(); c.moveTo(x + 34, 132); c.lineTo(x, 150); c.lineTo(x + 34, 168); c.fill(); });
          label(c, 'REWIND', 1020, 158, { align: 'left', size: 20 });
          c.restore();
        }
        if (isWith) {
          // name the wind-up while it happens
          const ca = seg(t, AN.j2.L - AN.WIND, AN.j2.L - AN.WIND + 0.15) * (1 - seg(t, AN.j2.L - 0.04, AN.j2.L + 0.1));
          label(c, 'CROUCH · LEAN BACK', AN.j2.x0 - 40, F - 250, { alpha: ca, size: 18, color: P.accentD });
        }
      }
      // side-by-side pair
      if (t >= w1) {
        AN.pair.forEach((j, i) => {
          const k = E.outB(seg(t, w1 + i * 0.1, w2 + i * 0.1));
          if (k <= 0) return;
          arcGuide(c, j, 0.8 * seg(t, w2, w2 + 0.4) * (1 - 0.6 * seg(t, 8.2, 8.8)), j.ant);
          const p = jump(t, j, j.ant);
          dust(c, j.x0, F, t - j.L, 61 + i * 17, j.ant ? 1 : 0.6); dust(c, j.x1, F, t - j.L - AN.D, 71 + i * 13, 1);
          drawJumper(c, p, { k });
          tag(c, j.ant ? 'WITH' : 'WITHOUT', (j.x0 + j.x1) / 2, 150, { alpha: seg(t, w2 - 0.1, w2 + 0.2), fill: j.ant ? P.accent : null });
        });
        // take-off beat marker
        const ba = seg(t, 6.3, 6.5) * (1 - seg(t, 7.6, 8.0));
        if (ba > 0) {
          c.save(); c.globalAlpha = ba; c.strokeStyle = 'rgba(23,24,28,0.25)'; c.lineWidth = 2; c.setLineDash([3, 7]);
          c.beginPath(); c.moveTo(960, 200); c.lineTo(960, F); c.stroke(); c.setLineDash([]); c.restore();
          label(c, 'SAME TAKE-OFF BEAT', 960, 240, { alpha: ba, size: 16, color: P.mute });
        }
        TK.word(c, 960, 470, { size: 120, alpha: E.outC(seg(t, 8.25, 8.9)), ls: lerp(30, 4, E.outC(seg(t, 8.25, 9.0))) });
      }
      // caption: position over time (dashed = without)
      if (t < AN.rew[1]) {
        TK.caption(c, t, W, H, { name: 'Anticipation', cat: 'Timing', curve: progCurve(AN.j1, false, 0.5, 1.6), span: [0.5, 2.1], curveLabel: 'POSITION / TIME' });
      } else if (t < w1) {
        TK.caption(c, t, W, H, { name: 'Anticipation', cat: 'Timing', curve: progCurve(AN.j2, true, 2.8, 1.6), span: [2.8, 4.4], curveLabel: 'POSITION  WITH  vs  WITHOUT' });
        graphOverlay(c, W, H, progCurve(AN.j2, false, 2.8, 1.6));
      } else {
        const j = AN.pair[1];
        TK.caption(c, t, W, H, { name: 'Anticipation', cat: 'Timing', curve: progCurve(j, true, 6.3, 1.6), span: [6.3, 7.9], curveLabel: 'POSITION  WITH  vs  WITHOUT' });
        graphOverlay(c, W, H, progCurve(j, false, 6.3, 1.6));
      }
    },
    score(A) {
      TK.bed(A);
      const windup = (L, g) => {
        A.osc(L - AN.WIND, { type: 'triangle', f: 330, f2: 165, glide: AN.WIND - 0.05, dur: AN.WIND, g, hold: true, rel: 0.05, lp: 1800 });   // creak down into the crouch
        A.noise(L - AN.WIND, { type: 'bandpass', f: 900, q: 3, dur: AN.WIND, g: g * 0.5, swell: 0.9 });
      };
      const leap = (L, g) => {
        A.whoosh(L - 0.02, 0.5, { g: 0.14 * g, f1: 500, f2: 3800, swell: 0.3 });
        A.osc(L, { type: 'triangle', f: 260, f2: 780, glide: 0.18, dur: 0.3, g: 0.1 * g, rev: 0.2 });
        A.osc(L + AN.D, { f: 140, f2: 50, glide: 0.1, dur: 0.25, g: 0.28, a: 0.002 });
        A.noise(L + AN.D, { type: 'lowpass', f: 1500, f2: 300, dur: 0.18, g: 0.08 });
      };
      leap(AN.j1.L, 0.8);
      A.noise(AN.rew[0], { type: 'bandpass', f: 4000, f2: 600, q: 2, dur: AN.rew[1] - AN.rew[0], g: 0.07, swell: 0.5 });
      A.osc(AN.rew[0], { type: 'sawtooth', f: 900, f2: 300, glide: 0.6, dur: 0.62, g: 0.025, lp: 2000 });
      windup(AN.j2.L, 0.07);
      leap(AN.j2.L, 1);
      AN.swap.slice(1).forEach((s, i) => A.pluck(s, [392, 523][i], { g: 0.14, dur: 1.0, rev: 0.3 }));
      windup(AN.pair[1].L, 0.06);
      leap(AN.pair[1].L, 1.1);
      A.chord(8.25, [60, 64, 67, 72], { type: 'triangle', dur: 1.7, g: 0.03, a: 0.05, rev: 0.5, width: 0.7 });
      A.bell(8.25, 784, { g: 0.05, dur: 1.6, rev: 0.5 });
    },
  });
})();
