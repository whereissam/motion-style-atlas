/* batch m2 — Narrative Formats · Film & TV, Advertising: formatrecap · formatcredits · formatad.
   formatrecap (the "Previously on" recap: a title card, four fast degraded clips from earlier
   episodes, a J-cut sound bridge over black, then tonight's episode, where every recapped clip
   pays off and is called out as it does) ·
   formatcredits (end credits: the end title card rises into a two-column crawl — CAST, CREW,
   MUSIC, SPECIAL THANKS — at a constant speed, cuts away to a mid-credit stinger scene, resumes
   and lands on the legal line) ·
   formatad (a ten-second commercial: a one-second hook, the Token as hero product, the MOTION
   brand by three seconds, a single benefit, and an end card with the call to action and a
   sonic logo, with the classic timing rules marked on the strip). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, hash, midi, text } = MG;
  const TK = MG.TK, FK = MG.FK, P = TK.P, PI = Math.PI;
  const label = FK.label;
  const FONTS = [...FK.fonts, [`500 30px ${TK.FONT}`, 'Cast'], [`700 18px ${TK.MONO}`, 'E2']];
  const LIGHT = 'rgba(236,232,223,0.92)', LMUTE = 'rgba(236,232,223,0.55)';

  /* ---------------- shared helpers ---------------- */
  const pulse = (t, a, b, f = 0.2) => seg(t, a, a + f) * (1 - seg(t, b - f, b));
  const tag = (c, s, x, y, on = 1, o = {}) => {   // accent dot + mono label
    if (on <= 0.001) return;
    c.save(); c.globalAlpha *= on;
    c.fillStyle = o.dot || P.accent; c.beginPath(); c.arc(x + 7, y - 6, 7, 0, TAU); c.fill();
    label(c, s, x + 26, y, { color: o.color || P.ink, weight: 700, size: o.size || 18 });
    c.restore();
  };
  /* Leader-line note: dot at the target, elbow line, a title and an optional sub line. */
  function callout(c, px, py, dx, dy, title, sub, on, o = {}) {
    if (on <= 0.001) return;
    const ink = o.dark ? LIGHT : P.ink, x1 = px + dx, y1 = py + dy, dir = dx >= 0 ? 1 : -1, x2 = x1 + dir * 24;
    c.save(); c.globalAlpha *= on; c.lineCap = 'round';
    c.strokeStyle = ink; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(px, py); c.lineTo(x1, y1); c.lineTo(x2, y1); c.stroke();
    c.fillStyle = P.accent; c.beginPath(); c.arc(px, py, 6, 0, TAU); c.fill();
    const al = dir > 0 ? 'left' : 'right';
    label(c, title, x2 + dir * 10, y1 + 6, { align: al, color: ink, weight: 700, size: 17, ls: 2 });
    if (sub) label(c, sub, x2 + dir * 10, y1 + 29, { align: al, size: 14, ls: 1.5, color: o.dark ? LMUTE : '#5d5a54' });
    c.restore();
  }
  /* The Token plus story props: crack (0..1 drawn length) and ball (blue ball seated in the hole). */
  const CRACK = [[-0.5, -0.04], [-0.36, 0.03], [-0.27, -0.06], [-0.14, 0.05], [-0.05, -0.02], [0.04, 0.07]];
  function hero(c, x, y, s, o = {}) {
    TK.token(c, x, y, s, o);
    c.save(); c.translate(x, y); if (o.sx || o.sy) c.scale(o.sx || 1, o.sy || 1); if (o.rot) c.rotate(o.rot);
    if (o.crack > 0) {
      const n = (CRACK.length - 1) * clamp(o.crack);
      c.strokeStyle = o.crackColor || P.ink; c.lineWidth = s * 0.022; c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath();
      for (let i = 0; i <= Math.ceil(n); i++) {
        const k = Math.min(i, n), a = CRACK[Math.floor(k)], b = CRACK[Math.min(CRACK.length - 1, Math.floor(k) + 1)], f = k - Math.floor(k);
        const X = lerp(a[0], b[0], f) * s, Y = lerp(a[1], b[1], f) * s;
        i ? c.lineTo(X, Y) : c.moveTo(X, Y);
      }
      c.stroke();
    }
    if (o.ball) {
      c.fillStyle = o.ballColor || P.blue; c.beginPath(); c.arc(s * TK.HOLE.x, s * TK.HOLE.y, s * TK.HOLE.r * 0.86, 0, TAU); c.fill();
    }
    c.restore();
  }
  function ball(c, x, y, r, rot, col = P.blue) {
    c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = r * 0.16; c.lineCap = 'round';
    c.beginPath(); c.arc(x, y, r * 0.6, rot, rot + 1.3); c.stroke();
  }

  /* =====================================================================
     RECAP — "Previously on MOTION". A black title card; four fast clips
     from earlier episodes, each tagged with its episode and played
     degraded (desaturated, grained, scanned) so it reads as the past;
     cut to black with tonight's sound already running under it (the J-cut
     sound bridge); then tonight's episode in full colour, where every
     recapped clip pays off and is called out the moment it does. An
     episode rail shows which episodes were left out: the recap only
     carries what tonight needs.
     ===================================================================== */
  const RB = [
    { t0: 0, t1: 1.2, name: 'Previously on', kind: 'title' },
    { t0: 1.2, t1: 2.25, name: 'E2', kind: 'act' },
    { t0: 2.25, t1: 3.3, name: 'E4', kind: 'act' },
    { t0: 3.3, t1: 4.35, name: 'E5', kind: 'act' },
    { t0: 4.35, t1: 5.4, name: 'E6', kind: 'hook' },
    { t0: 5.4, t1: 6.4, name: 'Bridge', kind: 'break' },
    { t0: 6.4, t1: 8.6, name: 'Tonight · payoffs', kind: 'turn' },
    { t0: 8.6, t1: 10, name: 'Main title', kind: 'title' },
  ];
  const RCLIPS = [
    { ep: 2, title: 'THE BLUE BALL', pay: 'PAYS OFF 7.9 s' },
    { ep: 4, title: 'THE CRACK', pay: 'PAYS OFF 7.3 s' },
    { ep: 5, title: 'THE RIVAL', pay: 'PAYS OFF 6.9 s' },
    { ep: 6, title: 'LAST WEEK  ·  CLIFFHANGER', pay: 'PAYS OFF 6.5 s' },
  ];
  const FL = 800, TS = 220;   // floor line, Token side
  function pitStage(c, W, H, x0, col) {
    TK.stage(c, W, H, { floor: FL });
    c.fillStyle = col || '#b9b2a4'; c.fillRect(x0, FL, W - x0 + 200, H - FL + 200);
    const g = c.createLinearGradient(0, FL, 0, H); g.addColorStop(0, 'rgba(23,24,28,0.35)'); g.addColorStop(1, 'rgba(23,24,28,0.05)');
    c.fillStyle = g; c.fillRect(x0, FL, W - x0 + 200, H - FL + 200);
    c.fillStyle = 'rgba(23,24,28,0.45)'; c.fillRect(x0 - 2, FL, 3, H - FL);
  }
  function ledge(c, x1, top, col) {
    c.fillStyle = col || '#d3cdc0'; c.fillRect(-200, top, x1 + 200, FL - top + 300);
    c.fillStyle = 'rgba(23,24,28,0.3)'; c.fillRect(-200, top, x1 + 200, 2); c.fillRect(x1 - 1, top, 2, FL - top);
  }
  function degrade(c, W, H, t, k) {
    c.save();
    c.globalCompositeOperation = 'saturation'; c.globalAlpha = 0.72 * k; c.fillStyle = '#808080'; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.55 * k; c.fillStyle = '#b7b3ad'; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.06 * k; c.fillStyle = '#000';
    for (let y = (Math.floor(t * 30) % 2) * 2; y < H; y += 4) c.fillRect(0, y, W, 1.5);
    c.restore();
    MG.grain(c, W, H, t, 0.12 * k);
    MG.vignette(c, W, H, 0.6 * k);
  }
  function rClip(c, t, W, H, i, u) {
    const cam = [[1150, 640, 1.12, 1.18], [960, 640, 1.3, 1.38], [760, 560, 1.06, 1.12], [1150, 640, 1.08, 1.0]][i];
    let shake = 0;
    if (i === 1) shake = 16 * Math.exp(-Math.max(0, u - 0.36) * 9) * (u > 0.36 ? 1 : 0);
    const z = lerp(cam[2], cam[3], u), fx = clamp(cam[0], W / 2 / z + 20, W - W / 2 / z - 20), fy = clamp(cam[1], H / 2 / z + 20, H - H / 2 / z - 20);
    c.save();
    c.translate(W / 2 + shake * Math.sin(u * 90), H / 2 + shake * Math.cos(u * 70));
    c.scale(z, z); c.translate(-fx, -fy);
    if (i === 0) {   // E2: the blue ball rolls off the edge
      pitStage(c, W, H, 1500);
      const bx = 1040 + 620 * E.inQ(u) + 120 * u, r = TS * TK.HOLE.r * 0.86;
      const by = FL - r + Math.pow(Math.max(0, bx - 1500), 2) * 0.012;
      TK.shadow(c, 820, FL, TS, 0);
      hero(c, 820, FL - TS / 2, TS, { rot: 0.05 * Math.sin(u * 6) });
      ball(c, bx, by, r, (bx - 1040) / r);
    } else if (i === 1) {   // E4: a hard landing cracks the Token
      TK.stage(c, W, H, { floor: FL });
      const fall = clamp(u / 0.36), y = lerp(80, FL - TS / 2, E.inQ(fall));
      const sq = u > 0.36 ? 0.26 * Math.exp(-(u - 0.36) * 8) * Math.cos((u - 0.36) * 26) : 0;
      TK.shadow(c, 960, FL, TS, FL - TS / 2 - y);
      hero(c, 960, y + TS / 2 * sq, TS, { sx: 1 + sq, sy: 1 - sq, crack: seg(u, 0.38, 0.6) });
      if (u > 0.36) {
        const d = seg(u, 0.36, 1);
        c.fillStyle = `rgba(143,138,128,${0.35 * (1 - d)})`;
        for (let k = 0; k < 7; k++) { const a = PI + k / 6 * PI; c.beginPath(); c.arc(960 + Math.cos(a) * (130 + 160 * d) * (k % 2 ? 1 : 1.2), FL - 14 - 70 * d * (0.4 + hash(k)), 10 + 12 * d, 0, TAU); c.fill(); }
      }
    } else if (i === 2) {   // E5: the rival appears on the ledge
      TK.stage(c, W, H, { floor: FL });
      ledge(c, 760, 560);
      const rx = lerp(-150, 520, E.outB(clamp(u / 0.5)));
      const g = c.createRadialGradient(rx, 360, 20, rx, 420, 520); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = 'rgba(23,24,28,0.25)'; c.fillRect(-300, -300, W + 600, H + 600);
      c.fillStyle = g; c.fillRect(-300, -300, W + 600, H + 600);
      TK.token(c, rx, 560 - 90, 180, { color: P.ink, rot: -0.04 });
      TK.shadow(c, 1360, FL, 140, 0);
      hero(c, 1360, FL - 70, 140, { crack: 1, rot: -0.12 + 0.08 * seg(u, 0.4, 0.7) });
    } else {   // E6: pushed over the edge — freeze frame
      pitStage(c, W, H, 1450);
      const v = Math.min(u, 0.72);
      const rx = lerp(300, 1080, E.inQ(clamp(v / 0.45)));
      const push = seg(v, 0.45, 0.72), ox = lerp(1300, 1470, E.outQ(push));
      TK.token(c, rx, FL - 90, 180, { color: P.ink });
      TK.shadow(c, ox, FL, 200, 40 * push);
      hero(c, ox, FL - 100 - 10 * push, 200, { crack: 1, rot: 0.55 * E.inQ(push) });
      if (u > 0.72) { c.fillStyle = `rgba(255,255,255,${0.7 * (1 - seg(u, 0.72, 0.8))})`; c.fillRect(-300, -300, W + 600, H + 600); }
    }
    c.restore();
    degrade(c, W, H, t, i === 3 && u > 0.72 ? 1.25 : 1);
  }
  function rTonight(c, t, W, H) {
    const tt = t - 6.4;
    pitStage(c, W, H, 1450, '#9f9789');
    ledge(c, 620, 560);
    // the rival, waiting on the ledge
    const lean = 0.08 * E.ioC(seg(tt, 1.6, 2.1));
    TK.shadow(c, 430, 560, 180, 0);
    TK.token(c, 430, 560 - 90, 180, { color: P.ink, rot: lean });
    // the Token climbs back out of the pit (last week's cliffhanger)
    const cl = E.outB(seg(tt, 0.05, 0.85)), x = lerp(1400, 1240, cl), y = lerp(FL + 160, FL - TS / 2, cl);
    const seated = tt >= 1.5, pop = seated ? 0.12 * Math.exp(-(tt - 1.5) * 7) * Math.cos((tt - 1.5) * 30) : 0;
    const rot = lerp(0.25, 0, cl) - 0.1 * E.ioC(seg(tt, 1.7, 2.1));
    c.save(); c.beginPath(); c.rect(0, 0, W, FL); if (cl < 1) c.clip();
    TK.shadow(c, x, FL, TS, 0);
    hero(c, x, y + TS / 2 * pop, TS, { crack: 1, rot, ball: seated, sx: 1 + pop, sy: 1 - pop });
    c.restore();
    // the blue ball comes up out of the pit and drops into the hole
    if (!seated && tt > 0.85) {
      const u = seg(tt, 0.85, 1.5), hx = x + Math.cos(rot) * TS * TK.HOLE.x - Math.sin(rot) * TS * TK.HOLE.y, hy = y + Math.sin(rot) * TS * TK.HOLE.x + Math.cos(rot) * TS * TK.HOLE.y;
      const bx = lerp(1520, hx, u), by = lerp(FL + 40, hy, u) - Math.sin(PI * u) * 260;
      ball(c, bx, by, TS * TK.HOLE.r * 0.86, u * 8);
    }
    // payoff callouts
    callout(c, x - 30, y - TS / 2, -230, -120, 'E6 → PAYS OFF', 'BACK FROM THE CLIFFHANGER', pulse(t, 6.55, 8.55), {});
    callout(c, 430, 440, 120, -160, 'E5 → PAYS OFF', 'THE RIVAL WAS WAITING', pulse(t, 6.95, 8.55));
    callout(c, x - TS * 0.36, y - 6, -230, 150, 'E4 → PAYS OFF', 'THE CRACK IS STILL THERE', pulse(t, 7.35, 8.55));
    callout(c, x + TS * 0.2, y - TS * 0.2, 150, -110, 'E2 → PAYS OFF', 'THE BLUE BALL, FOUND', pulse(t, 7.9, 8.55));
    label(c, 'EVERY RECAPPED CLIP IS USED TONIGHT', W - 72, 860, { align: 'right', size: 15, ls: 2, color: P.ink, weight: 700 });
  }
  function rRail(c, t, W, H, on) {
    if (on <= 0.001) return;
    const x0 = 1356, y = 972, cur = RCLIPS.findIndex((_, i) => t >= RB[i + 1].t0 && t < RB[i + 1].t1);
    c.save(); c.globalAlpha *= on;
    label(c, 'SEASON 1', x0, y - 30, { size: 13, ls: 2, color: LMUTE });
    for (let e = 1; e <= 6; e++) {
      const bx = x0 + (e - 1) * 82, used = [2, 4, 5, 6].includes(e), isCur = cur >= 0 && RCLIPS[cur].ep === e;
      c.fillStyle = isCur ? P.accent : used ? 'rgba(236,232,223,0.85)' : 'rgba(236,232,223,0.12)';
      c.fillRect(bx, y - 18, 70, 26);
      label(c, 'E' + e, bx + 35, y + 1, { align: 'center', size: 14, ls: 1, weight: 700, color: used ? '#17181c' : LMUTE });
      if (!used) { c.strokeStyle = LMUTE; c.lineWidth = 1.5; c.beginPath(); c.moveTo(bx + 6, y - 5); c.lineTo(bx + 64, y - 5); c.stroke(); }
    }
    label(c, 'E1 · E3 NOT RECAPPED — NOTHING TONIGHT NEEDS THEM', x0, y + 34, { size: 12, ls: 1.5, color: LMUTE });
    c.restore();
  }

  MG.film({
    id: 'formatrecap', dur: 10, poster: 8.2,
    fonts: FONTS,
    meta: {
      family: 'M', name: '"Previously On" Recap', sub: 'Only what pays off tonight', era: '1960s —',
      origin: 'Serial storytelling has always had to remind its audience: film serials of the 1910s–40s and radio serials opened with a spoken summary of the last chapter. On television, the “previously on” montage of cut-down scenes became a standard cold-open device as serialised drama spread in the 1980s and 1990s, with Hill Street Blues among the early series to lean on it. The craft rule editors repeat is that a recap is chosen backwards from tonight’s episode: each clip sets up something this episode pays off.',
      works: 'Hill Street Blues (NBC, 1981–87) · 24 (Fox, 2001–10; “Previously on 24…”) · Battlestar Galactica (Sci Fi, 2004–09)',
      tech: ['Recap clips chosen by tonight’s payoffs', 'Episode tag on every clip', 'J-cut sound bridge into the episode'],
      accent: '#ff5a1f',
      motionDNA: 'A 1.2 s black title card; four clips of about one second each, every cut on a hit, the last one ending on a freeze-frame cliffhanger; one second of black while tonight’s sound already plays; then tonight runs at a calmer pace and settles four payoffs one after another (6.5, 6.9, 7.3, 7.9 s) before the main title lands at 8.6 s.',
      visualDNA: 'Recap clips are the Token stage drained of colour: desaturated, darkened, grained and scan-lined, each tagged S1 · En in the corner. Tonight is the same stage in full colour. Black cards in condensed white type; an episode rail shows which episodes were left out; payoff callouts link each recapped clip to the moment it pays off.',
      transitions: 'Hard cuts on hits; white flash on the freeze frame; cut to black under a J-cut sound bridge; picture fades up into tonight; darken under the main title',
      implementation: ['Avid / Premiere recap assembled from earlier episodes’ masters', 'Grade pass to set past clips apart; J-cut in the audio timeline', 'Canvas 2D: one stage drawn per clip, saturation/multiply composite, grain and scanlines'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const dark = t < 1.2 || (t >= 5.4 && t < 6.4) || t >= 8.6;
      if (t < 1.2) {
        c.fillStyle = '#0b0b0c'; c.fillRect(0, 0, W, H);
        const a = seg(t, 0.05, 0.35) * (1 - seg(t, 1.05, 1.2));
        label(c, 'PREVIOUSLY ON', 960, 430, { align: 'center', size: 30, ls: 16, color: `rgba(236,232,223,${0.8 * a})`, weight: 700 });
        TK.word(c, 960, 540, { size: 190, color: P.ground, ls: 10, alpha: seg(t, 0.25, 0.5) * (1 - seg(t, 1.05, 1.2)) });
        label(c, 'TITLE CARD · 1.2 s', 960, 680, { align: 'center', size: 14, ls: 3, color: LMUTE });
      } else if (t < 5.4) {
        const i = RCLIPS.findIndex((_, k) => t >= RB[k + 1].t0 && t < RB[k + 1].t1), bb = RB[i + 1], u = (t - bb.t0) / (bb.t1 - bb.t0);
        rClip(c, t, W, H, i, u);
        const cl = RCLIPS[i];
        // episode tag, as broadcast
        c.fillStyle = 'rgba(11,11,12,0.72)'; c.fillRect(72, 108, 420, 74);
        label(c, `S1 · E${cl.ep}`, 92, 140, { size: 22, ls: 3, color: P.ground, weight: 700 });
        label(c, cl.title, 92, 168, { size: 14, ls: 2, color: LMUTE });
        tag(c, 'SETUP  →  ' + cl.pay, W - 470, 150, seg(u, 0.1, 0.3), { color: P.ground, size: 16 });
        if (i === 3 && u > 0.72) label(c, 'FREEZE FRAME', W / 2, 260, { align: 'center', size: 18, ls: 6, color: P.ground, weight: 700 });
        if (u < 0.08) { c.fillStyle = `rgba(255,255,255,${0.5 * (1 - u / 0.08)})`; c.fillRect(0, 0, W, H); }
      } else if (t < 6.4) {
        c.fillStyle = '#0b0b0c'; c.fillRect(0, 0, W, H);
        // tonight's audio leading the picture
        const a = seg(t, 5.5, 5.8);
        c.save(); c.globalAlpha = a;
        c.strokeStyle = P.accent; c.lineWidth = 2; c.beginPath();
        for (let x = 360; x <= 1560; x += 4) {
          const k = (x - 360) / 1200, env = seg(t, 5.4 + k * 0.2, 6.2 + k * 0.3) * 0.6 + 0.15, n = MG.vnoise(x * 0.05 + t * 9, 3);
          const yy = 540 + Math.sin(x * 0.09 + t * 14) * 30 * env * (0.4 + n);
          x === 360 ? c.moveTo(x, yy) : c.lineTo(x, yy);
        }
        c.stroke();
        c.restore();
        label(c, 'SOUND BRIDGE · J-CUT', 960, 450, { align: 'center', size: 20, ls: 5, color: `rgba(236,232,223,${0.9 * a})`, weight: 700 });
        label(c, 'TONIGHT’S SOUND STARTS BEFORE ITS PICTURE', 960, 640, { align: 'center', size: 15, ls: 2, color: `rgba(236,232,223,${0.55 * a})` });
      } else {
        rTonight(c, t, W, H);
        if (t < 6.75) { c.fillStyle = `rgba(11,11,12,${1 - seg(t, 6.4, 6.75)})`; c.fillRect(0, 0, W, H); }
        if (t >= 8.6) {
          const a = seg(t, 8.6, 8.9);
          c.fillStyle = `rgba(11,11,12,${0.72 * a})`; c.fillRect(0, 0, W, H);
          label(c, 'S1 · E7', 960, 400, { align: 'center', size: 24, ls: 10, color: `rgba(236,232,223,${0.8 * a})`, weight: 700 });
          TK.word(c, 960, 520, { size: 200, color: P.ground, ls: 12, alpha: E.outC(seg(t, 8.62, 9.0)) });
          label(c, 'THE RETURN', 960, 650, { align: 'center', size: 26, ls: 12, color: `rgba(255,90,31,${a})`, weight: 700 });
        }
      }
      rRail(c, t, W, H, (t >= 1.2 && t < 5.4) ? 1 : 0);
      FK.strip(c, t, W, H, RB, { label: 'Recap · structure', dark: dark || (t >= 1.2 && t < 5.4) });
      FK.caption(c, t, W, H, { name: '"Previously On" Recap', cat: 'Film & TV', dark: true });
    },
    score(A) {
      // title card: low boom, swell
      A.impact(0.04, 0.42, { rev: 0.6 });
      A.whoosh(0.0, 1.1, { f1: 180, f2: 1400, g: 0.08, swell: 0.3, rev: 0.5 });
      A.chord(0.1, [45, 52, 57], { type: 'sawtooth', dur: 5.3, g: 0.022, a: 0.8, lp: 700, rev: 0.5, width: 0.6, hold: true, rel: 0.05 });
      // the recap pulse — low toms on eighths, accents on the cuts
      for (let k = 0; k * 0.25 < 4.2; k++) {
        const t = 1.2 + k * 0.25;
        A.osc(t, { f: k % 4 ? 98 : 130, f2: 62, glide: 0.12, dur: 0.18, g: k % 4 ? 0.09 : 0.16, a: 0.002 });
      }
      [1.2, 2.25, 3.3, 4.35].forEach((t, i) => {
        A.whoosh(t - 0.25, 0.28, { f1: 600, f2: 4000, g: 0.06, swell: 0.9, pan: i % 2 ? 0.3 : -0.3 });
        A.impact(t, 0.26, { rev: 0.35 });
        A.noise(t, { type: 'highpass', f: 2500, dur: 0.05, g: 0.08 });
      });
      // degraded clip sounds (low-passed, crushed)
      A.noise(1.3, { type: 'bandpass', f: 260, q: 2, dur: 0.6, g: 0.06, crush: true });
      A.osc(1.75, { type: 'square', f: 900, f2: 260, glide: 0.4, dur: 0.45, g: 0.03, lp: 1500, crush: true });
      A.kick(2.63, 0.4, { f: 120, f2: 35 });
      A.noise(2.66, { type: 'highpass', f: 3000, dur: 0.12, g: 0.09, crush: true });
      A.osc(3.3, { type: 'sawtooth', f: 55, dur: 1.0, g: 0.05, lp: 400, a: 0.2, rev: 0.4 });
      A.bell(3.6, midi(70), { g: 0.06, dur: 0.9, rev: 0.6 });
      A.kick(4.82, 0.35, { f: 140, f2: 50 });
      A.noise(4.85, { type: 'bandpass', f: 700, f2: 300, dur: 0.25, g: 0.05, crush: true });
      // freeze-frame cliffhanger hit
      A.impact(5.11, 0.48, { rev: 0.7 });
      A.chord(5.11, [46, 53, 58, 61], { type: 'sawtooth', dur: 0.32, g: 0.035, lp: 1600, rev: 0.6, hold: true, rel: 0.04 });
      // bridge: tonight's ambience starts under black (J-cut)
      A.noise(5.42, { type: 'lowpass', f: 500, dur: 4.5, g: 0.05, swell: 0.3, rev: 0.4 });
      A.chord(5.5, [48, 55, 60, 64], { type: 'triangle', dur: 3.1, g: 0.028, a: 0.9, lp: 1400, rev: 0.6, width: 0.7 });
      A.noise(6.1, { type: 'bandpass', f: 900, f2: 1400, q: 1.5, dur: 0.5, g: 0.05 });   // the climb begins before we see it
      // tonight
      [6.5, 6.7, 6.9].forEach((t, i) => A.pluck(t, midi([60, 64, 67][i]), { g: 0.12, bright: 0.5, dur: 0.8 }));
      A.whoosh(7.25, 0.65, { f1: 500, f2: 2600, g: 0.07, swell: 0.7 });
      A.bell(7.9, midi(84), { g: 0.11, dur: 1.2, rev: 0.5 });
      A.pluck(7.9, midi(72), { g: 0.16, bright: 0.7, dur: 1.0 });
      A.osc(8.15, { f: 70, f2: 50, dur: 0.5, g: 0.18, a: 0.01 });
      // main title
      A.impact(8.6, 0.5, { rev: 0.7 });
      A.chord(8.6, [45, 52, 57, 60, 64], { type: 'sawtooth', dur: 1.4, g: 0.03, a: 0.02, lp: 1800, rev: 0.7, width: 0.8 });
      A.bell(8.6, midi(81), { g: 0.08, dur: 1.4, rev: 0.6 });
    },
  });

  /* =====================================================================
     CREDITS — the end roll. The end title card holds, then rises as the
     crawl begins: role / name in two columns either side of a centre
     gutter, under CAST, CREW, MUSIC and SPECIAL THANKS, at one constant
     speed. Mid-roll the crawl cuts away to a stinger scene (a second
     Token peeks in: a sequel tease), then returns, finishes on the
     classic "will return" line and lands on the legal / copyright line,
     which holds.
     ===================================================================== */
  const CB = [
    { t0: 0, t1: 1.2, name: 'End title', kind: 'title' },
    { t0: 1.2, t1: 5.4, name: 'Crawl', kind: 'act' },
    { t0: 5.4, t1: 7.4, name: 'Stinger', kind: 'turn' },
    { t0: 7.4, t1: 9.4, name: 'Crawl', kind: 'act' },
    { t0: 9.4, t1: 10, name: 'Legal', kind: 'break' },
  ];
  const CR_WIN = [150, 870], CR_STOP = 640;
  function crBuild() {
    const L = [];
    let y = 1000;
    const head = s => { y += 26; L.push({ k: 'h', s, y }); y += 64; };
    const row = (r, n) => { L.push({ k: 'r', r, n, y }); y += 44; };
    head('CAST');
    row('The Token', 'Itself'); row('The Hole', 'Itself, slightly off-centre'); row('MOTION', 'The Word');
    row('Shadow', 'As Cast'); row('Stunt Token', 'Its Rotation Double'); row('and introducing', 'The Blue Token');
    y += 30; head('CREW');
    row('Director of Easing', 'In-Out Cubic'); row('Key Grip', 'The 80 px Grid'); row('Gaffer', 'Rim Light');
    row('Best Boy', 'Overshoot'); row('Colourist', '#FF5A1F'); row('Script Supervisor', 'The Playhead');
    y += 30; head('MUSIC');
    row('“Ten Seconds”', 'Written by C, Am, F & G'); row('Performed by', 'The Beat Bed'); row('Tempo', '120 BPM, throughout');
    y += 30; head('SPECIAL THANKS');
    L.push({ k: 'c', s: 'Every Keyframe  ·  The Easing Curves  ·  You, for staying to the end', y }); y += 44;
    const endBlock = [];
    y += 90; endBlock.push({ k: 'will', s: 'THE TOKEN WILL RETURN', y }); y += 130;
    endBlock.push({ k: 'legal', s: '© 2026 MOTION STYLE ATLAS  ·  ALL RIGHTS RESERVED', y }); y += 30;
    endBlock.push({ k: 'legal2', s: 'No Tokens were harmed in the making of this film. The characters and events depicted are fictitious.', y });
    const legalY = endBlock[1].y, crawlT = (5.4 - 1.2) + (9.4 - 7.4);
    const speed = Math.ceil((legalY - CR_STOP) / crawlT / 10) * 10, pad = speed * crawlT - (legalY - CR_STOP);
    endBlock.forEach(e => { e.y += pad; L.push(e); });
    return { L, speed, crawlT };
  }
  const crScroll = (t, speed) => speed * (clamp(t, 1.2, 5.4) - 1.2 + clamp(t, 7.4, 9.4) - 7.4);
  function crDraw(c, t, W, H, st) {
    const S = crScroll(t, st.speed), a0 = (y) => seg(y, CR_WIN[0] - 40, CR_WIN[0] + 60) * (1 - seg(y, CR_WIN[1] - 90, CR_WIN[1]));
    let n = 0;
    // end title card at the head of the roll
    const cy = 470 - S;
    if (cy > -100) {
      const a = (t < 1.2 ? seg(t, 0.1, 0.6) : 1) * a0(cy + 120);
      TK.token(c, 960, cy - 40, 120, { alpha: a });
      TK.word(c, 960, cy + 110, { size: 150, color: P.ground, ls: 10, alpha: a });
      label(c, 'A TOKEN PICTURE', 960, cy + 210, { align: 'center', size: 18, ls: 8, color: `rgba(236,232,223,${0.6 * a})` });
    }
    st.L.forEach(it => {
      const y = it.y - S;
      if (y < CR_WIN[0] - 60 || y > CR_WIN[1] + 20) return;
      const a = a0(y); if (y > CR_WIN[0] && y < CR_WIN[1]) n++;
      c.save(); c.globalAlpha = a;
      if (it.k === 'h') text(c, it.s, 960, y, { font: TK.FONT, weight: 800, size: 30, ls: 10, color: P.accent, align: 'center' });
      else if (it.k === 'r') {
        text(c, it.r.toUpperCase(), 930, y, { font: TK.FONT, weight: 500, size: 20, ls: 3, color: LMUTE, align: 'right' });
        text(c, it.n, 990, y, { font: TK.FONT, weight: 800, size: 30, color: P.ground, align: 'left' });
      } else if (it.k === 'c') text(c, it.s, 960, y, { font: TK.FONT, weight: 500, size: 26, color: P.ground, align: 'center' });
      else if (it.k === 'will') text(c, it.s, 960, y, { font: TK.FONT, weight: 900, size: 46, ls: 8, color: P.ground, align: 'center' });
      else if (it.k === 'legal') text(c, it.s, 960, y, { font: TK.MONO, size: 17, ls: 3, color: LIGHT, align: 'center' });
      else text(c, it.s, 960, y, { font: TK.MONO, size: 13, ls: 1, color: LMUTE, align: 'center' });
      c.restore();
    });
    return n;
  }
  function crStinger(c, t, W, H) {
    const tt = t - 5.4;
    TK.stage(c, W, H, { floor: FL });
    const peek = E.outB(seg(tt, 0.75, 1.05)) - E.inQ(seg(tt, 1.55, 1.7));
    const turn = E.ioC(seg(tt, 1.0, 1.25));
    TK.shadow(c, 900, FL, TS, 0);
    hero(c, 900, FL - TS / 2, TS, { rot: 0.0, sx: 1 + 0.03 * Math.sin(tt * 3), sy: 1 - 0.03 * Math.sin(tt * 3) });
    TK.token(c, lerp(2060, 1790, peek), FL - 80, 160, { color: P.blue, rot: -0.25 * peek });
    // the hole (the Token's "eye") glances right
    c.fillStyle = 'rgba(11,11,12,0.86)';
    const g = c.createRadialGradient(lerp(900, 1300, turn * 0.4), 560, 60, 960, 600, 1100);
    g.addColorStop(0, 'rgba(11,11,12,0)'); g.addColorStop(0.45, 'rgba(11,11,12,0.55)'); g.addColorStop(1, 'rgba(11,11,12,0.92)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (turn > 0) label(c, '?', 900 + 40, FL - TS - 40, { align: 'center', size: 60, weight: 700, color: `rgba(255,90,31,${turn * (1 - seg(tt, 1.6, 1.7))})` });
    const cut = 1 - seg(tt, 0, 0.12) * (1 - seg(tt, 1.85, 2.0));
    if (cut > 0) { c.fillStyle = `rgba(11,11,12,${cut})`; c.fillRect(0, 0, W, H); }
  }

  MG.film({
    id: 'formatcredits', dur: 10, poster: 3.6,
    fonts: FONTS,
    meta: {
      family: 'M', name: 'End Credits', sub: 'The roll, the stinger, the legal line', era: '1970s —',
      origin: 'Classical Hollywood films opened with their credits and closed on a simple “The End”; full end-roll crawls listing the whole crew became the norm through the 1970s, as union agreements and longer crew lists pushed credits to the back of the film. Post-credit scenes go back at least to The Muppet Movie (1979) and Ferris Bueller’s Day Off (1986), and Marvel Studios turned the mid- and post-credit stinger into an expected part of the format from Iron Man (2008). The Bond films’ closing “James Bond will return” line is the best-known sign-off before the legal block.',
      works: 'Ferris Bueller’s Day Off (John Hughes, 1986; post-credits scene) · Iron Man (Jon Favreau, 2008; post-credits scene) · The Spy Who Loved Me (Lewis Gilbert, 1977; “James Bond will return”)',
      tech: ['Constant-speed crawl, role / name columns', 'Mid-credit stinger scene', 'Legal / copyright line last'],
      accent: '#ff5a1f',
      motionDNA: 'Nothing eases in a crawl: after the end title card holds for 1.2 s, the roll moves at one constant speed so every line spends the same time on screen. At 5.4 s it cuts to black and a two-second stinger plays (a second Token peeks in, a one-beat sting); at 7.4 s the crawl resumes exactly where it stopped and decelerates to nothing only on the legal line, which holds.',
      visualDNA: 'Black ground; white names in a heavy sans set left of a centre gutter, roles in small spaced caps right-aligned to it; orange section heads; the roll fades in and out at the top and bottom of the window. The stinger is the Token stage under a dark vignette, with the second Token in blue. Mono readouts on the right give the crawl speed and lines on screen.',
      transitions: 'End card rising into the roll; hard cut to black for the stinger and back; crawl stops on the legal line',
      implementation: ['Credit roll from a credits list in a titling system (Avid, After Effects, dedicated roll software)', 'Constant pixel-per-frame speed to avoid judder', 'Canvas 2D: one scroll offset from accumulated crawl time, edge fades'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return crBuild(); },
    draw(c, t, W, H, st) {
      c.fillStyle = '#0b0b0c'; c.fillRect(0, 0, W, H);
      let n = 0;
      if (t < 5.4 || t >= 7.4) n = crDraw(c, t, W, H, st);
      else crStinger(c, t, W, H);
      // readouts
      const rx = W - 72, moving = (t >= 1.2 && t < 5.4) || (t >= 7.4 && t < 9.4);
      if (t >= 1.2 && (t < 5.4 || t >= 7.4)) {
        const lh = 44, onScreen = (CR_WIN[1] - CR_WIN[0]) / st.speed;
        label(c, `CRAWL  ${moving ? st.speed : 0} px/s`, rx, 130, { align: 'right', size: 15, ls: 2, color: moving ? LIGHT : LMUTE, weight: 700 });
        label(c, `LINES ON SCREEN  ${n}`, rx, 156, { align: 'right', size: 15, ls: 2, color: LMUTE });
        label(c, `EACH LINE ON SCREEN  ${onScreen.toFixed(1)} s`, rx, 182, { align: 'right', size: 15, ls: 2, color: LMUTE });
        label(c, `LINE PITCH  ${lh} px`, rx, 208, { align: 'right', size: 15, ls: 2, color: LMUTE });
        // window marks
        c.fillStyle = 'rgba(236,232,223,0.25)';
        c.fillRect(rx - 6, CR_WIN[0], 6, 1.5); c.fillRect(rx - 6, CR_WIN[1], 6, 1.5); c.fillRect(rx - 1, CR_WIN[0], 1, CR_WIN[1] - CR_WIN[0]);
        if (t >= 7.4 && t < 8.4) tag(c, 'CRAWL RESUMES WHERE IT LEFT OFF', 72, 120, pulse(t, 7.45, 8.4), { color: LIGHT, size: 15 });
        if (t >= 9.4) tag(c, 'LEGAL · COPYRIGHT LAST, HELD', 72, 120, seg(t, 9.45, 9.7), { color: LIGHT, size: 15 });
      } else if (t < 1.2) {
        tag(c, 'END TITLE CARD', 72, 120, seg(t, 0.2, 0.5), { color: LIGHT, size: 15 });
      } else {
        tag(c, 'STINGER · MID-CREDIT SCENE', 72, 120, pulse(t, 5.55, 7.3), { color: LIGHT, size: 15 });
        label(c, 'REWARDS WHOEVER STAYED · TEASES THE SEQUEL', 98, 146, { size: 13, ls: 2, color: `rgba(236,232,223,${0.55 * pulse(t, 5.6, 7.3)})` });
      }
      FK.strip(c, t, W, H, CB, { label: 'End credits · structure', dark: true });
      FK.caption(c, t, W, H, { name: 'End Credits', cat: 'Film & TV', dark: true });
    },
    score(A) {
      // end-title theme: soft arpeggios over C, Am, F, G at 120 BPM
      const prog = [[48, 55, 60, 64], [45, 52, 57, 60], [41, 48, 57, 60], [43, 50, 55, 59], [48, 55, 60, 64]];
      const theme = (from, to) => {
        for (let k = 0; k * 0.25 < 10; k++) {
          const t = k * 0.25; if (t < from || t >= to) continue;
          const bar = Math.floor(t / 2) % 4, ch = prog[bar], note = ch[[0, 2, 1, 3, 2, 1, 3, 2][k % 8]] + 12;
          A.pluck(t, midi(note), { g: 0.11, bright: 0.45, dur: 0.9, rev: 0.45, pan: (k % 2 ? 0.2 : -0.2) });
          if (k % 8 === 0) {
            A.chord(t, ch, { type: 'triangle', dur: 2.05, g: 0.026, a: 0.25, lp: 1200, rev: 0.5, width: 0.6 });
            A.osc(t, { type: 'sine', f: midi(ch[0] - 12), dur: 1.8, g: 0.12, a: 0.02 });
          }
        }
      };
      A.bell(0.1, midi(72), { g: 0.08, dur: 2.2, rev: 0.6 });
      theme(0, 5.35);
      // stinger: the music drops out, room tone, a peek and a sting
      A.noise(5.5, { type: 'lowpass', f: 300, dur: 1.8, g: 0.03, hold: true, rel: 0.1 });
      A.osc(5.5, { type: 'sine', f: 58, dur: 1.8, g: 0.05, a: 0.3, hold: true, rel: 0.1 });
      A.kick(6.15, 0.25, { f: 90, f2: 40 });
      A.bell(6.42, midi(88), { g: 0.08, dur: 0.7, rev: 0.5 });
      A.osc(6.42, { type: 'square', f: midi(76), dur: 0.14, g: 0.04, lp: 2400 });
      A.osc(6.6, { type: 'square', f: midi(83), dur: 0.22, g: 0.04, lp: 2400 });
      A.noise(7.2, { type: 'highpass', f: 3000, dur: 0.05, g: 0.05 });
      // the roll resumes, then the final chord under the legal line
      theme(7.4, 9.4);
      A.chord(9.4, [48, 55, 60, 64, 67], { type: 'triangle', dur: 0.6, g: 0.03, a: 0.05, lp: 1800, rev: 0.8, width: 0.8, hold: true, rel: 0.2 });
      A.bell(9.4, midi(84), { g: 0.07, dur: 0.6, rev: 0.7 });
    },
  });

  /* =====================================================================
     AD — a ten-second spot. Hook in the first second (a grey square that
     moves like a slideshow: stepped, linear, ugly); a whip into the hero
     product shot of the Token; the MOTION brand locked up beside it by
     2.4 s; one benefit, shown not told — the Token's eased move beside the
     grey square's — then one super; the music stops for the end card:
     lockup, call to action and a five-note sonic logo the Token bounces
     to, with the small print. The strip carries the timing rules.
     ===================================================================== */
  const AB = [
    { t0: 0, t1: 1.0, name: 'Hook', kind: 'hook' },
    { t0: 1.0, t1: 2.4, name: 'Hero', kind: 'act' },
    { t0: 2.4, t1: 3.0, name: 'Brand', kind: 'title' },
    { t0: 3.0, t1: 8.0, name: 'One benefit', kind: 'turn' },
    { t0: 8.0, t1: 10, name: 'End card · CTA', kind: 'cta' },
  ];
  const SONIC = [8.2, 8.4, 8.6, 8.8, 9.0];
  function adRules(c, t, W, dark) {
    const INK = dark ? LIGHT : P.ink, ACC = dark ? P.accent : P.accentD;
    const x0 = 72, x1 = W - 72, X = s => lerp(x0, x1, s / 10), y = 76;
    const mk = (a, b, s, on, live) => {
      c.save(); c.globalAlpha = on ? 1 : 0.45;
      c.strokeStyle = live ? P.accent : INK; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(X(a) + 2, y); c.lineTo(X(a) + 2, y + 8); c.lineTo(X(b) - 2, y + 8); c.lineTo(X(b) - 2, y); c.stroke();
      label(c, s, X(a) + 4, y + 30, { size: 13, ls: 2, color: live ? ACC : INK, weight: 700 });
      c.restore();
    };
    mk(0, 1, 'HOOK ≤ 1 s', true, t < 1);
    // brand deadline
    c.save(); c.globalAlpha = t >= 2.4 ? 1 : 0.5;
    c.strokeStyle = t >= 2.4 ? P.accent : INK; c.lineWidth = 2; c.setLineDash([4, 4]);
    c.beginPath(); c.moveTo(X(3), 24); c.lineTo(X(3), y + 12); c.stroke(); c.setLineDash([]);
    label(c, t >= 2.4 ? 'BRAND BY 3 s · IN AT 2.4 s' : 'BRAND BY 3 s', X(3) + 8, y + 30, { size: 13, ls: 2, color: t >= 2.4 ? ACC : INK, weight: 700 });
    c.restore();
    mk(8, 10, 'CTA · LAST 2 s', true, t >= 8);
    // timecode
    const s = Math.floor(t), f = Math.floor((t - s) * 30);
    label(c, `00:00:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}  /  :10`, x1, y + 30, { align: 'right', size: 13, ls: 2, color: dark ? LMUTE : P.mute });
  }
  const stepped = (t, fps) => Math.floor(t * fps) / fps;
  function greySquare(c, x, y, s, a = 1) {
    c.save(); c.globalAlpha *= a; c.fillStyle = '#a7a39b'; c.fillRect(x - s / 2, y - s / 2, s, s); c.restore();
  }
  function adHook(c, t, W, H) {
    TK.stage(c, W, H);
    // a slideshow-style move: 5 fps steps, linear, abrupt reversals
    const q = stepped(t, 5), x = 960 + (q < 0.5 ? lerp(-420, 420, q / 0.5) : lerp(420, -200, (q - 0.5) / 0.5));
    greySquare(c, x, 560, 200);
    text(c, 'Still moving like', 960, 300, { font: TK.FONT, weight: 900, size: 84, color: P.ink, align: 'center' });
    text(c, 'a slideshow?', 960, 390, { font: TK.FONT, weight: 900, size: 84, color: P.accentD, align: 'center' });
    label(c, 'PROBLEM, FIRST FRAME', 960, 760, { align: 'center', size: 14, ls: 3 });
  }
  function adHero(c, t, W, H) {
    // spotlit product shot
    c.fillStyle = '#17181c'; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(960, 520, 40, 960, 540, 820); g.addColorStop(0, '#3a2a22'); g.addColorStop(1, '#0d0d0f');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const tt = t - 1.0, drop = seg(tt, 0.0, 0.4), land = tt > 0.4 ? Math.exp(-(tt - 0.4) * 6) * Math.cos((tt - 0.4) * 22) * 0.22 : 0;
    const brand = E.outQt(seg(t, 2.4, 2.85));
    const x = lerp(960, 700, brand), s = lerp(360, 300, brand), y = lerp(-300, 520, E.inQ(drop));
    // floor reflection
    c.save(); c.globalAlpha = 0.18 * drop; c.translate(x, 520 + s / 2 + s * 0.18 + 8); c.scale(1, -0.35); TK.token(c, 0, 0, s, { rot: 0.1 * Math.sin(tt * 1.6) }); c.restore();
    TK.token(c, x, y + s / 2 * land, s, { rot: 0.1 * Math.sin(tt * 1.6), sx: 1 + land, sy: 1 - land });
    // shine sweep across the product
    const sw = seg(tt, 0.6, 1.2);
    if (sw > 0 && sw < 1) {
      c.save(); c.translate(x, y); c.rotate(0.1 * Math.sin(tt * 1.6)); TK.tokenPath(c, s); c.clip('evenodd');
      const sx = lerp(-s, s, sw), gr = c.createLinearGradient(sx - 60, 0, sx + 60, 0);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gr; c.rotate(-0.4); c.fillRect(-s * 1.5, -s * 1.5, s * 3, s * 3); c.restore();
    }
    if (brand > 0) {
      TK.word(c, lerp(1540, 1310, brand), 520, { size: 160, color: P.ground, ls: 8, alpha: brand });
      label(c, 'BRAND REVEAL', 1310, 640, { align: 'center', size: 15, ls: 4, color: `rgba(236,232,223,${0.6 * brand})` });
    }
    if (tt < 1.4) label(c, 'THE PRODUCT IS THE HERO', 960, 160, { align: 'center', size: 15, ls: 4, color: `rgba(236,232,223,${0.6 * seg(tt, 0.5, 0.8)})` });
    // whip in
    if (tt < 0.15) { c.fillStyle = P.accent; c.fillRect(lerp(0, W, tt / 0.15), 0, W, H); }
  }
  function adBenefit(c, t, W, H) {
    const tt = t - 3.0;
    TK.stage(c, W, H, { floor: 760 });
    const split = 1 - E.ioC(seg(tt, 2.6, 3.1));   // split screen, then the Token takes the whole frame
    const mid = lerp(960, -40, 1 - split);
    // left: the grey square, stepped and linear
    if (split > 0.01) {
      c.save(); c.beginPath(); c.rect(0, 0, mid, H); c.clip();
      c.fillStyle = 'rgba(23,24,28,0.05)'; c.fillRect(0, 0, mid, H);
      const q = stepped(tt, 5) % 1.6, gx = 200 + (q < 0.8 ? q / 0.8 : 2 - q / 0.8) * 560;
      greySquare(c, gx, 660, 180);
      label(c, 'OTHERS', 120, 200, { size: 16, ls: 4, color: P.mute, weight: 700 });
      c.restore();
      c.fillStyle = P.ink; c.fillRect(mid - 1, 140, 2, 620);
    }
    // right / full: the Token, eased hops
    c.save(); c.beginPath(); c.rect(mid, 0, W - mid, H); c.clip();
    const hopT = 0.8, k = Math.floor(tt / hopT), u = (tt / hopT) - k, dir = k % 2 ? -1 : 1;
    const cxL = lerp(1180, 520, 1 - split), cxR = lerp(1720, 1400, 1 - split);
    const fromX = dir > 0 ? cxL : cxR, toX = dir > 0 ? cxR : cxL, s = lerp(170, 220, 1 - split);
    const ex = E.ioC(u), x = lerp(fromX, toX, ex), hy = Math.sin(PI * u) * 220;
    const sq = u < 0.12 ? 0.18 * (1 - u / 0.12) : u > 0.9 ? 0.18 * ((u - 0.9) / 0.1) : -0.08 * Math.sin(PI * u);
    TK.shadow(c, x, 760, s, hy);
    TK.token(c, x, 760 - s / 2 - hy + s / 2 * Math.max(0, sq), s, { rot: dir * TAU / 4 * ex, sx: 1 + sq, sy: 1 - sq });
    if (split > 0.01) label(c, 'MOTION', mid + 48, 200, { size: 16, ls: 4, color: P.accentD, weight: 700 });
    c.restore();
    // single benefit super
    const sup = seg(tt, 3.2, 3.6);
    if (sup > 0) {
      c.save(); c.globalAlpha = sup;
      text(c, 'Every move, eased.', 960, 250, { font: TK.FONT, weight: 900, size: 96, color: P.ink, align: 'center' });
      c.restore();
      label(c, 'ONE BENEFIT · ONE LINE', 960, 292, { align: 'center', size: 14, ls: 3, color: `rgba(143,138,128,${sup})` });
    }
    if (tt < 2.6) label(c, 'SHOW THE BENEFIT · DON’T LIST FEATURES', 960, 860, { align: 'center', size: 14, ls: 3, color: `rgba(143,138,128,${seg(tt, 0.2, 0.5)})` });
    // small brand bug
    TK.token(c, W - 112, 140, 28); label(c, 'MOTION', W - 132, 148, { align: 'right', size: 16, ls: 3, color: P.ink, weight: 700 });
  }
  function adEnd(c, t, W, H) {
    const tt = t - 8.0;
    c.fillStyle = P.ground; c.fillRect(0, 0, W, H);
    const g = c.createRadialGradient(960, 480, 40, 960, 480, 900); g.addColorStop(0, '#fff7ee'); g.addColorStop(1, P.ground);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // the Token bounces once per sonic-logo note
    let hop = 0, sq = 0;
    SONIC.forEach((n, i) => {
      const d = t - n;
      if (d >= 0 && d < 0.2) hop = Math.max(hop, Math.sin(PI * d / 0.2) * (i === 4 ? 70 : 34));
      if (d >= 0 && d < 0.12) sq = Math.max(sq, 0.14 * (1 - d / 0.12));
    });
    const inA = E.outB(seg(tt, 0, 0.35));
    TK.token(c, 590, 430 - hop + 60 * sq, 180 * inA, { sx: 1 + sq, sy: 1 - sq });
    TK.word(c, 1075, 430, { size: 150, ls: 8, alpha: seg(tt, 0.05, 0.3) });
    text(c, 'Every move, eased.', 960, 590, { font: TK.FONT, weight: 800, size: 46, color: P.ink, align: 'center' });
    // CTA button
    const ca = seg(tt, 0.35, 0.6), pul = 1 + 0.04 * Math.max(0, Math.sin((tt - 0.6) * TAU * 2)) * seg(tt, 0.6, 0.8);
    if (ca > 0) {
      c.save(); c.globalAlpha = ca; c.translate(960, 690); c.scale(pul, pul);
      c.fillStyle = P.accent; MG.rrect(c, -190, -40, 380, 80, 40); c.fill();
      text(c, 'TRY IT FREE  →', 0, 12, { font: TK.FONT, weight: 900, size: 32, ls: 3, color: P.ground, align: 'center' });
      c.restore();
      label(c, 'or search “MOTION”', 960, 770, { align: 'center', size: 17, ls: 2, color: `rgba(23,24,28,${0.7 * ca})` });
    }
    label(c, 'Token sold separately. Results may vary. Easing curves shown are illustrative.', 960, 858, { align: 'center', size: 12, ls: 1, color: `rgba(143,138,128,${seg(tt, 0.4, 0.7)})` });
    // sonic logo readout
    const sx0 = 1500;
    label(c, 'SONIC LOGO', sx0, 820, { size: 13, ls: 3, color: P.mute, weight: 700 });
    SONIC.forEach((n, i) => {
      const on = t >= n, hit = Math.exp(-Math.max(0, t - n) * 8) * (on ? 1 : 0);
      c.fillStyle = on ? P.accent : 'rgba(23,24,28,0.15)';
      c.beginPath(); c.arc(sx0 + 10 + i * 34, 852 - [0, 6, 12, 18, 30][i], 8 + 4 * hit, 0, TAU); c.fill();
    });
    FK.safeFrame(c, W, H, { alpha: 0.28 * seg(tt, 0.2, 0.6) });
  }

  MG.film({
    id: 'formatad', dur: 10, poster: 8.95,
    fonts: FONTS,
    meta: {
      family: 'M', name: 'Ten-second Ad', sub: 'Hook, hero, brand, one benefit, CTA', era: '1980s —',
      origin: 'Short spots have been part of broadcast advertising for decades, sold as cheaper, shorter units next to the standard 30-second commercial. Pre-roll video online and skippable ads after 2010 tightened the rules into the ones creative teams now quote: hook in the first second, the brand on screen within the first few seconds, one message, and an end card with the call to action. Sonic logos — the five-note Intel bong (1994, Walter Werzowa) is the classic — let the brand be recognised by ear alone.',
      works: 'Intel Inside sonic logo (Walter Werzowa, 1994) · Apple “Get a Mac” (TBWA\\Media Arts Lab, 2006–09) · Old Spice “The Man Your Man Could Smell Like” (Wieden+Kennedy, 2010)',
      tech: ['Hook in the first second', 'Brand on screen by 3 s', 'End card: CTA plus sonic logo'],
      accent: '#ff5a1f',
      motionDNA: 'A stepped, linear 5 fps move as the hook for the first second; an orange whip into a dark product shot where the Token drops, lands with a squash and catches a shine sweep; the MOTION wordmark slides in beside it at 2.4 s; five seconds of one benefit — eased hops beside the stepped grey square, then the Token alone under a single super; the music stops at 8 s and the Token bounces once to each of the five sonic-logo notes on the end card.',
      visualDNA: 'The warm paper stage and the orange Token, with a dark, spotlit product shot in the middle; heavy Archivo supers; a split screen of grey “others” against the Token; an end card with the lockup, a pill-shaped orange CTA button, small print and faint title-safe guides. Timing rules are marked under the structure strip with a running timecode.',
      transitions: 'Orange whip wipe into the hero shot; wordmark slide-in; split screen collapsing to full frame; hard cut to the end card on the music stop',
      implementation: ['After Effects / Nuke compositing to a broadcast spec (title-safe, :10 exactly)', 'Music bed edited to the cut, sonic logo on the end card', 'Canvas 2D: stage, clip-path split, gradient product light and shine'],
      reproducibility: 'Fully procedural',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      if (t < 1.0) adHook(c, t, W, H);
      else if (t < 3.0) adHero(c, t, W, H);
      else if (t < 8.0) adBenefit(c, t, W, H);
      else adEnd(c, t, W, H);
      const dark = t >= 1.0 && t < 3.0;
      FK.strip(c, t, W, H, AB, { label: 'Ten-second ad · structure', dark });
      adRules(c, t, W, dark);
      FK.caption(c, t, W, H, { name: 'Ten-second Ad', cat: 'Advertising', dark });
    },
    score(A) {
      // hook: an abrupt start and a dull click per stepped frame
      A.kick(0, 0.4, { f: 160, f2: 50 });
      for (let k = 0; k < 5; k++) A.osc(k * 0.2, { type: 'square', f: 220, dur: 0.05, g: 0.06, lp: 1200 });
      A.osc(0.05, { type: 'sawtooth', f: midi(50), dur: 0.9, g: 0.03, lp: 700, hold: true, rel: 0.05 });
      // hero: whip, drop, land, shine
      A.whoosh(0.85, 0.3, { f1: 400, f2: 5000, g: 0.14, swell: 0.8 });
      A.riser(1.0, 0.4, { g: 0.08, f: 220 });
      A.impact(1.4, 0.5, { rev: 0.5 });
      A.noise(1.6, { type: 'highpass', f: 6000, f2: 12000, dur: 0.6, g: 0.04, swell: 0.5 });
      A.chord(1.4, [48, 55, 64, 67], { type: 'triangle', dur: 1.0, g: 0.03, a: 0.05, lp: 2200, rev: 0.5, width: 0.7 });
      // brand: shimmer
      A.bell(2.4, midi(84), { g: 0.1, dur: 1.2, rev: 0.6 });
      A.bell(2.55, midi(91), { g: 0.05, dur: 0.9, rev: 0.6 });
      // benefit: the jingle groove, 120 BPM
      const mel = [72, 76, 79, 76, 77, 81, 79, 77, 76, 79, 84, 79, 77, 74, 72, 74, 76, 79, 81, 84];
      const bass = [48, 48, 45, 45, 41, 41, 43, 43, 48, 48];
      for (let b = 0; b < 10; b++) {
        const t = 3.0 + b * 0.5;
        A.kick(t, 0.36, { f: 120, f2: 45 });
        if (b % 2) A.clap(t, 0.16);
        A.hat(t + 0.25, 0.04);
        A.osc(t, { type: 'triangle', f: midi(bass[b] - 12), dur: 0.45, g: 0.16, a: 0.005 });
        A.pluck(t, midi(mel[b * 2]), { g: 0.15, bright: 0.75, dur: 0.5, pan: -0.15 });
        A.pluck(t + 0.25, midi(mel[b * 2 + 1]), { g: 0.12, bright: 0.75, dur: 0.5, pan: 0.15 });
        if (b % 4 === 0) A.chord(t, [bass[b] + 12, bass[b] + 16, bass[b] + 19].map(m => m - (bass[b] === 45 ? 1 : 0) * 0), { type: 'triangle', dur: 1.9, g: 0.022, a: 0.05, lp: 2000, rev: 0.4, width: 0.6 });
      }
      A.whoosh(6.6, 0.5, { f1: 300, f2: 2500, g: 0.06, swell: 0.7 });
      // music stops; the five-note sonic logo
      const notes = [67, 72, 76, 74, 79];
      SONIC.forEach((t, i) => {
        A.pluck(t, midi(notes[i]), { g: i === 4 ? 0.22 : 0.17, bright: 0.85, dur: i === 4 ? 1.2 : 0.5, rev: 0.4 });
        A.bell(t, midi(notes[i] + 12), { g: i === 4 ? 0.08 : 0.05, dur: i === 4 ? 1.0 : 0.4, rev: 0.5 });
      });
      A.chord(9.0, [48, 55, 60, 64, 67], { type: 'triangle', dur: 0.95, g: 0.03, a: 0.01, lp: 2600, rev: 0.6, width: 0.8 });
      A.kick(9.0, 0.3, { f: 110, f2: 40 });
    },
  });
})();
