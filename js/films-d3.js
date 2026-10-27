/* Batch d3 — Family C: 2D Animation & Illustration.
   rubberhose (1920s–30s bouncing cartoon), silhouette (Reiniger paper-cut, 1926), sakuga (Japanese key-animation action). */
(function () {
  'use strict';
  const { TAU, clamp, lerp, seg, E, spring, kf, rng, hash, vnoise, midi, text, offscreen, grain, vignette } = MG;
  MG.useFonts('https://fonts.googleapis.com/css2?family=Rye&family=Limelight&family=Cinzel+Decorative:wght@700;900&family=IM+Fell+English+SC&family=IM+Fell+English:ital@0;1&family=Dela+Gothic+One&family=Anton&display=block');

  /* ---------------- shared helpers ---------------- */
  const PI = Math.PI;
  const fr24 = t => Math.floor(t * 24);
  const ell = (c, x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU); };
  const bump = (t, a, up, hold, down) => E.outQ(seg(t, a, a + up)) * (1 - E.ioS(seg(t, a + up + hold, a + up + hold + down)));

  // old-film treatment: dust, hairs, scratches, flicker, grain, rounded gate
  function filmFX(c, t, W, H, o = {}) {
    const f = fr24(t), r = rng(f * 7 + 3);
    c.save();
    // flicker
    const fl = (hash(f * 1.7) - 0.5) * (o.flicker ?? 0.09);
    c.fillStyle = fl > 0 ? `rgba(255,248,230,${fl * 0.6})` : `rgba(0,0,0,${-fl})`;
    c.fillRect(0, 0, W, H);
    // scratches
    const ns = r() < 0.6 ? 1 + (r() < 0.3 ? 1 : 0) : 0;
    for (let i = 0; i < ns; i++) {
      const x = r() * W, a = 0.15 + r() * 0.3;
      c.strokeStyle = r() < 0.7 ? `rgba(250,240,215,${a})` : `rgba(20,12,6,${a})`;
      c.lineWidth = 1 + r() * 1.6;
      c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + (r() - 0.5) * 20, H * 0.3, x + (r() - 0.5) * 20, H * 0.7, x + (r() - 0.5) * 16, H); c.stroke();
    }
    // dust specks
    const nd = 4 + Math.floor(r() * 8);
    for (let i = 0; i < nd; i++) {
      const x = r() * W, y = r() * H, s = 1.5 + r() * r() * 9, dark = r() < 0.72;
      c.fillStyle = dark ? `rgba(18,10,4,${0.5 + r() * 0.4})` : `rgba(255,250,236,${0.4 + r() * 0.4})`;
      c.beginPath();
      for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, q = s * (0.5 + r() * 0.7); k ? c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) : c.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
      c.fill();
    }
    // a hair now and then
    if (hash(f * 3.3) < 0.14) {
      const x = r() * W, y = r() * H, L = 40 + r() * 90;
      c.strokeStyle = 'rgba(16,10,4,0.65)'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + L * 0.5, y - L * 0.6, x + L * 0.2, y + L * 0.7, x + L, y + L * 0.2); c.stroke();
    }
    c.restore();
    grain(c, W, H, t, o.grain ?? 0.2, 'overlay');
    grain(c, W, H, t + 0.37, (o.grain ?? 0.2) * 0.35, 'multiply');
    vignette(c, W, H, o.vig ?? 0.7, o.vigCol || '20,12,4');
    // rounded projector gate
    c.save();
    c.beginPath(); c.rect(-20, -20, W + 40, H + 40);
    { const x = 10, y = 6, w = W - 20, h = H - 12, r = 70;
      c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
    c.fillStyle = '#080503'; c.shadowColor = 'rgba(0,0,0,0.9)'; c.shadowBlur = 40;
    c.fill('evenodd');
    c.restore();
  }

  /* ======================================================================
     01  RUBBER HOSE — a pie-eyed fellow, a singing world, an iris-out
     ====================================================================== */
  const RH = { ink: '#1b130b', paper: '#f2e7cd', hi: '#fbf5e4', l1: '#e4d5b4', l2: '#ccb893', m: '#a48e6c', d: '#6c5842', dd: '#3e3023' };
  const LW = 6;
  const RX = 960, RG = 872;

  // a noodle limb: straight line bowed by `bend`, optional travelling wiggle; returns end tangent angle
  function hose(c, ax, ay, bx, by, bend, lw, wig = 0, wph = 0) {
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    c.beginPath();
    const N = 26;
    for (let i = 0; i <= N; i++) {
      const u = i / N, off = bend * 4 * u * (1 - u) + wig * Math.sin(u * PI * 4 + wph) * Math.sin(u * PI);
      const x = ax + dx * u + nx * off, y = ay + dy * u + ny * off;
      i ? c.lineTo(x, y) : c.moveTo(x, y);
    }
    c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = RH.ink; c.stroke();
    return Math.atan2(dy - ny * 4 * bend, dx - nx * 4 * bend);
  }
  // union-outline trick: stroke every piece fat in ink, then fill every piece
  function blob(c, shapes, fill, lw = LW * 2) {
    c.save(); c.lineJoin = 'round';
    shapes.forEach(s => { s(c); c.lineWidth = lw; c.strokeStyle = RH.ink; c.stroke(); });
    shapes.forEach(s => { s(c); c.fillStyle = fill; c.fill(); });
    c.restore();
  }
  // four-fingered white glove, fingers pointing along +x
  function glove(c, x, y, ang, s = 1, spread = 0, flip = 1) {
    c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s * flip);
    const fing = [-1, 0, 1].map(k => cc => { cc.beginPath(); cc.save(); cc.translate(24, k * 11); cc.rotate(k * (0.22 + spread * 0.3)); MG.rrect(cc, 0, -7.5, 34 + (k === 0 ? 4 : 0), 15, 7.5); cc.restore(); });
    const thumb = cc => { cc.beginPath(); cc.save(); cc.translate(16, -12); cc.rotate(-0.9 - spread * 0.5); MG.rrect(cc, 0, -7, 26, 14, 7); cc.restore(); };
    const palm = cc => ell(cc, 18, 0, 22, 21);
    blob(c, [palm, thumb, ...fing], RH.hi, 10);
    // knuckle stitches
    c.strokeStyle = RH.ink; c.lineWidth = 2.6; c.lineCap = 'round';
    [-6, 0, 6].forEach(k => { c.beginPath(); c.moveTo(6, k * 1.1); c.lineTo(20, k * 1.6); c.stroke(); });
    // flared cuff
    c.beginPath(); c.moveTo(-14, -15); c.quadraticCurveTo(-2, -24, 6, -17); c.lineTo(6, 17); c.quadraticCurveTo(-2, 24, -14, 15); c.closePath();
    c.fillStyle = RH.hi; c.fill(); c.lineWidth = 5; c.strokeStyle = RH.ink; c.stroke();
    c.lineWidth = 2.5; c.beginPath(); c.moveTo(-4, -18); c.lineTo(-4, 18); c.stroke();
    c.restore();
  }
  function shoe(c, x, y, dir, rot = 0, s = 1) {
    c.save(); c.translate(x, y); c.rotate(rot * dir); c.scale(dir * s, s);
    ell(c, 26, -20, 44, 24); c.fillStyle = RH.ink; c.fill();
    ell(c, 2, -8, 22, 10); c.fill();
    ell(c, 38, -30, 14, 7, -0.3); c.fillStyle = 'rgba(242,231,205,0.85)'; c.fill();
    c.restore();
  }
  function pieEye(c, x, y, rx, ry, lx, ly, mode) {
    if (mode === 'wink' || mode === 'happy') {
      c.beginPath();
      if (mode === 'wink') { c.moveTo(x - rx * 1.1, y + ry * 0.2); c.quadraticCurveTo(x, y + ry * 0.55, x + rx * 1.1, y + ry * 0.2); }
      else { c.moveTo(x - rx * 1.1, y + ry * 0.35); c.quadraticCurveTo(x, y - ry * 0.6, x + rx * 1.1, y + ry * 0.35); }
      c.lineWidth = 6; c.lineCap = 'round'; c.strokeStyle = RH.ink; c.stroke();
      return;
    }
    ell(c, x, y, rx, ry); c.fillStyle = RH.hi; c.fill(); c.lineWidth = 4.5; c.strokeStyle = RH.ink; c.stroke();
    const px = x + lx * rx * 0.35, py = y + ly * ry * 0.36, prx = rx * 0.6, pry = ry * 0.62;
    c.save(); ell(c, x, y, rx - 2, ry - 2); c.clip();
    if (mode === 'dizzy') {
      c.strokeStyle = RH.ink; c.lineWidth = 3.5; c.beginPath();
      for (let i = 0; i < 40; i++) { const a = i * 0.5, q = i * 0.5; c.lineTo(x + Math.cos(a) * q * rx / 20, y + Math.sin(a) * q * ry / 20); }
      c.stroke();
    } else {
      ell(c, px, py, prx, pry); c.fillStyle = RH.ink; c.fill();
      // the pie cut
      c.beginPath(); c.moveTo(px + prx * 0.12, py - pry * 0.05);
      c.ellipse(px, py, prx * 0.8, pry * 0.8, 0, -1.35, -0.75); c.closePath();
      c.fillStyle = RH.hi; c.fill();
    }
    c.restore();
  }
  // the head: black dome, pale face mask, pie eyes, button nose, big grin, bowler hat
  function rhHead(c, x, y, r, P) {
    c.save(); c.translate(x, y); c.rotate(P.tilt || 0); c.scale(P.hsx || 1, P.hsy || 1);
    // cheeky ears: little rounded points (a dog-cat of no particular breed)
    [-1, 1].forEach(s => {
      c.beginPath(); c.moveTo(s * r * 0.55, -r * 0.7); c.quadraticCurveTo(s * r * 1.12, -r * 1.25, s * r * 1.02, -r * 0.35); c.closePath();
      c.fillStyle = RH.ink; c.fill();
    });
    ell(c, 0, 0, r, r); c.fillStyle = RH.ink; c.fill();
    // face mask
    c.beginPath();
    c.ellipse(0, r * 0.3, r * 0.8, r * 0.6, 0, 0, TAU);
    c.moveTo(-r * 0.0, -r * 0.1); c.ellipse(-r * 0.27, -r * 0.13, r * 0.36, r * 0.5, -0.12, 0, TAU);
    c.moveTo(r * 0.6, -r * 0.1); c.ellipse(r * 0.27, -r * 0.13, r * 0.36, r * 0.5, 0.12, 0, TAU);
    c.fillStyle = RH.paper; c.fill('nonzero');
    const em = P.eyes || 'pie';
    pieEye(c, -r * 0.24, -r * 0.16, r * 0.17, r * 0.32, P.lx || 0, P.ly || 0, em === 'wink' ? 'pie' : em);
    pieEye(c, r * 0.24, -r * 0.16, r * 0.17, r * 0.32, P.lx || 0, P.ly || 0, em);
    // mouth
    const mo = clamp(P.mouth || 0), my = r * 0.32;
    c.lineCap = 'round'; c.lineJoin = 'round';
    if (P.oh) {
      ell(c, 0, my + r * 0.2, r * 0.13, r * 0.18); c.fillStyle = RH.ink; c.fill();
    } else {
      c.beginPath();
      c.moveTo(-r * 0.5, my);
      c.quadraticCurveTo(0, my + r * (0.2 + mo * 0.1), r * 0.5, my);
      c.quadraticCurveTo(0, my + r * (0.28 + mo * 0.55), -r * 0.5, my);
      c.closePath(); c.fillStyle = RH.ink; c.fill();
      if (mo > 0.15) { c.save(); c.clip(); ell(c, 0, my + r * (0.3 + mo * 0.42), r * 0.25, r * 0.17); c.fillStyle = RH.m; c.fill(); c.restore(); }
      c.lineWidth = 4;
      [-1, 1].forEach(s => { c.beginPath(); c.arc(s * r * 0.53, my - r * 0.02, r * 0.1, s > 0 ? -1.2 : PI - 0.6, s > 0 ? 0.6 : PI + 1.2); c.strokeStyle = RH.ink; c.stroke(); });
    }
    // button nose
    ell(c, 0, r * 0.2, r * 0.17, r * 0.12); c.fillStyle = RH.ink; c.fill();
    ell(c, -r * 0.05, r * 0.16, r * 0.06, r * 0.035); c.fillStyle = RH.hi; c.fill();
    if (P.curl) {
      c.save(); c.translate(0, -r * 0.96); c.scale(1, P.curl);
      c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-4, -30, 26, -44, 22, -22); c.bezierCurveTo(19, -10, 6, -16, 10, -26);
      c.lineWidth = 5; c.strokeStyle = RH.ink; c.stroke(); c.restore();
    }
    c.restore();
  }
  function bowler(c, x, y, rot, s = 1) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    ell(c, 0, 0, 74, 15); c.fillStyle = RH.ink; c.fill();
    c.beginPath(); c.moveTo(-50, -4); c.bezierCurveTo(-52, -78, 52, -78, 50, -4); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(-50, -6); c.lineTo(50, -6); c.lineTo(49, -20); c.lineTo(-49, -20); c.closePath(); c.fillStyle = RH.d; c.fill();
    c.beginPath(); c.moveTo(-30, -38); c.quadraticCurveTo(-22, -60, 0, -64); c.lineWidth = 6; c.lineCap = 'round'; c.strokeStyle = 'rgba(242,231,205,0.5)'; c.stroke();
    c.restore();
  }
  function rhChar(c, P) {
    const { x, g } = P;
    c.save(); c.translate(x, g - (P.air || 0));
    c.scale(P.gsx || 1, P.gsy || 1);
    const hy = P.hipY, hx = P.hipX || 0;
    // shadow is drawn by caller; tail
    c.save(); c.translate(hx, hy); c.scale(P.sx, P.sy);
    const tw = Math.sin(P.tail || 0);
    c.beginPath(); c.moveTo(30, -18); c.bezierCurveTo(90, -10, 100 + tw * 20, -70, 70 + tw * 30, -110);
    c.lineWidth = 9; c.lineCap = 'round'; c.strokeStyle = RH.ink; c.stroke();
    ell(c, 70 + tw * 30, -114, 10, 14, 0.4 + tw * 0.3); c.fillStyle = RH.ink; c.fill();
    c.restore();
    // legs
    const legL = [hx - 26, hy], legR = [hx + 26, hy];
    hose(c, legL[0], legL[1], P.fl[0], P.fl[1] - 16, P.bendL, 17);
    hose(c, legR[0], legR[1], P.fr[0], P.fr[1] - 16, P.bendR, 17);
    shoe(c, P.fl[0], P.fl[1], -1, P.rotL || 0);
    shoe(c, P.fr[0], P.fr[1], 1, P.rotR || 0);
    // body + shorts, squashed about the hips
    c.save(); c.translate(hx, hy); c.scale(P.sx, P.sy); c.rotate(P.lean || 0);
    c.beginPath(); c.moveTo(-34, -112); c.bezierCurveTo(-64, -60, -66, -10, -48, 8); c.lineTo(48, 8); c.bezierCurveTo(66, -10, 64, -60, 34, -112); c.closePath();
    c.fillStyle = RH.ink; c.fill();
    c.beginPath(); c.moveTo(-58, -34); c.quadraticCurveTo(0, -26, 58, -34); c.lineTo(62, 14); c.quadraticCurveTo(30, 30, 4, 18); c.lineTo(-4, 18); c.quadraticCurveTo(-30, 30, -62, 14); c.closePath();
    c.fillStyle = RH.paper; c.fill(); c.lineWidth = 5; c.strokeStyle = RH.ink; c.stroke();
    [-1, 1].forEach(s => { ell(c, s * 22, -12, 8, 11); c.fillStyle = RH.ink; c.fill(); ell(c, s * 22 - 2, -15, 2.5, 3.5); c.fillStyle = RH.hi; c.fill(); });
    c.restore();
    // shoulders in squashed space
    const shY = hy - 106 * P.sy, shX = hx + Math.sin(P.lean || 0) * 106 * P.sy;
    const sl = [shX - 40 * P.sx, shY + 6], sr = [shX + 40 * P.sx, shY + 6];
    const drawArm = (s, sh, hand, bend, wig, wph, gs, gsp) => {
      const a = hose(c, sh[0], sh[1], hand[0], hand[1], bend, 15, wig, wph);
      glove(c, hand[0], hand[1], a + (P['gr' + s] || 0), gs, gsp, s === 'L' ? -1 : 1);
    };
    // head
    const headY = shY - 92 * (P.hsy || 1), headX = shX + (P.headX || 0);
    if (!P.armsFront) { drawArm('L', sl, P.hl, P.abL, P.wigL || 0, P.wph || 0, 1, P.sprL || 0); }
    rhHead(c, headX, headY, 80, P);
    if (P.hatOn) bowler(c, headX + Math.sin(P.tilt || 0) * 70, headY - 62 * (P.hsy || 1), (P.tilt || 0) - 0.12, 1);
    if (P.armsFront) drawArm('L', sl, P.hl, P.abL, P.wigL || 0, P.wph || 0, 1, P.sprL || 0);
    drawArm('R', sr, P.hr, P.abR, P.wigR || 0, P.wph || 0, 1, P.sprR || 0);
    c.restore();
    return { headX: x + headX * (P.gsx || 1), headY: g - (P.air || 0) + headY * (P.gsy || 1) };
  }

  // the choreography — everything is sampled on twos (12 fps)
  function rhPose(tq) {
    const bt = tq / 0.5, bi = Math.floor(bt), ph = bt - bi;
    const dip = Math.pow(Math.cos(ph * PI), 2);
    const sw = Math.sin(PI * bt);
    const P = {
      x: RX, g: RG, air: 0, gsx: 1, gsy: 1, sx: 1, sy: 1, lean: 0, hipX: 0, hipY: -150,
      fl: [-62, 0], fr: [62, 0], bendL: 0, bendR: 0, rotL: 0, rotR: 0,
      hl: [-150, -200], hr: [150, -200], abL: 20, abR: -20,
      mouth: 0.3, lx: 0, ly: 0, tilt: 0, eyes: 'pie', hatOn: true, tail: tq * 6, hsx: 1, hsy: 1,
    };
    // groove: knees bow out on every beat, upper body squashes, arms pump
    const groove = d => {
      P.hipY = -150 + d * 34; P.hipX = sw * 8;
      P.bendL = -12 - d * 30; P.bendR = 12 + d * 30;
      P.sy = 1 - d * 0.1 + (1 - d) * 0.05; P.sx = 1 / P.sy;
      P.hsy = 1 - d * 0.06; P.hsx = 1 + d * 0.05;
      P.lean = sw * 0.08; P.tilt = sw * 0.14;
      P.mouth = 0.25 + (1 - ph) * 0.75; P.lx = sw * 0.9; P.ly = -0.2;
      if (bi % 2 === 0) { P.rotL = -Math.sin(ph * PI) * 0.35; P.fl = [-62, -Math.sin(ph * PI) * 10]; }
      else { P.rotR = -Math.sin(ph * PI) * 0.35; P.fr = [62, -Math.sin(ph * PI) * 10]; }
    };
    if (tq < 0.75) {
      groove(0);
      const fall = seg(tq, 0.4, 0.7);
      P.air = (1 - E.inQ(fall)) * 900;
      P.gsy = 1.35; P.gsx = 0.8; P.hl = [-90, -330]; P.hr = [90, -330]; P.abL = -30; P.abR = 30; P.eyes = 'pie'; P.ly = -1; P.oh = true;
      if (tq >= 0.7) { P.gsy = 0.62; P.gsx = 1.35; P.air = 0; P.oh = false; P.mouth = 1; P.hl = [-190, -120]; P.hr = [190, -120]; }
      P.hatY = 0;
      return P;
    }
    if (tq < 4.5) {
      groove(dip);
      const land = tq - 0.7;
      if (land < 0.4) { const s = Math.exp(-land * 9) * Math.cos(land * 30) * 0.35; P.gsy = 1 - s; P.gsx = 1 + s * 0.8; }
      const c2 = Math.cos(PI * bt);
      if (tq < 2.5) {
        P.hl = [-140 - 10 * sw, P.hipY - 40 + 46 * c2]; P.hr = [140 - 10 * sw, P.hipY - 40 - 46 * c2];
        P.abL = 46; P.abR = -46;
      } else {
        // jazz hands beside the head
        P.hl = [-185 + 14 * c2, P.hipY - 230 + 24 * c2]; P.hr = [185 + 14 * c2, P.hipY - 230 - 24 * c2];
        P.abL = -36; P.abR = 36; P.sprL = P.sprR = 1; P.grL = 0.2 * c2; P.grR = -0.2 * c2;
        P.eyes = bi % 4 === 3 ? 'happy' : 'pie';
      }
      return P;
    }
    if (tq < 5.9) {
      // the hat gag
      groove(0.3);
      P.hl = [-150, -170]; P.abL = 40;
      const fly = seg(tq, 4.5, 5.08), back = seg(tq, 5.08, 5.42);
      P.lx = 0.3; P.ly = -1; P.oh = tq < 5.42; P.curl = tq < 5.42 ? spring(tq - 4.5, 4, 0.3) : 0;
      P.hatOn = false;
      const headTop = [12, -420];
      const hat = [headTop[0] + 150 * E.outQ(fly), headTop[1] - 170 * Math.sin(fly * PI * 0.8) - 30 * fly];
      if (tq < 5.08) {
        P.hatPos = hat; P.hatRot = fly * TAU * 1.5;
        const reach = E.outB(seg(tq, 4.62, 5.08), 1.2);
        P.hr = [lerp(150, hat[0] + 30, reach), lerp(-200, hat[1] + 30, reach)];
        P.wigR = 26 * Math.sin(tq * 30) * reach; P.wph = tq * 40; P.abR = -20;
        P.tilt = -0.1;
      } else if (tq < 5.42) {
        const k = E.inQ(back), hand = [lerp(hat[0] + 30, 80, k), lerp(hat[1] + 30, -340, k)];
        P.hatPos = [hand[0] - 30, hand[1] - 20]; P.hatRot = lerp(TAU * 1.5, -0.12, k);
        P.hr = hand; P.wigR = 18 * Math.sin(tq * 30); P.wph = tq * 40;
      } else {
        P.hatOn = true;
        const u = tq - 5.42, s = Math.exp(-u * 6) * Math.cos(u * 26) * 0.32;
        P.gsy = 1 - s; P.gsx = 1 + s * 0.9;
        P.eyes = u < 0.3 ? 'dizzy' : 'pie'; P.stars = u < 0.42 ? u : 0;
        P.hr = [150, -220]; P.mouth = 0.5;
      }
      return P;
    }
    if (tq < 6.75) {
      // Charleston kicks, knees in, jazz hands
      const k = Math.floor((tq - 5.9) / 0.25), u = ((tq - 5.9) / 0.25) % 1, side = k % 2 ? 1 : -1, kick = Math.sin(u * PI);
      P.hipY = -140 + 10 * kick; P.lean = side * 0.1; P.tilt = -side * 0.16;
      P.bendL = 30; P.bendR = -30;
      if (side < 0) { P.fl = [-80 - 90 * kick, -kick * 110]; P.rotL = -0.6 * kick; P.bendL = 10; }
      else { P.fr = [80 + 90 * kick, -kick * 110]; P.rotR = -0.6 * kick; P.bendR = -10; }
      P.hl = [-170 - side * 20, P.hipY - 150 - 40 * kick]; P.hr = [170 - side * 20, P.hipY - 150 - 40 * kick];
      P.abL = -30; P.abR = 30; P.sprL = P.sprR = 1; P.grL = 0.3 * side * kick; P.grR = 0.3 * side * kick;
      P.mouth = 1; P.lx = side; P.ly = 0;
      return P;
    }
    if (tq < 7.75) {
      // big jump and landing
      if (tq < 6.84) { P.hipY = -110; P.bendL = -40; P.bendR = 40; P.gsy = 0.78; P.gsx = 1.18; P.hl = [-140, -110]; P.hr = [140, -110]; P.eyes = 'happy'; P.mouth = 0.2; return P; }
      if (tq < 7.21) {
        const u = seg(tq, 6.84, 7.21), up = Math.sin(u * PI);
        P.air = up * 150; P.gsy = 1 + (1 - up) * 0.32; P.gsx = 1 / P.gsy;
        P.fl = [-30, 10]; P.fr = [30, 10]; P.bendL = -10; P.bendR = 10; P.rotL = 0.5; P.rotR = 0.5;
        P.hl = [-130, -360]; P.hr = [130, -360]; P.abL = -30; P.abR = 30; P.sprL = P.sprR = 1;
        P.mouth = 1; P.ly = -1; P.tilt = 0;
        return P;
      }
      const u = tq - 7.21, s = Math.exp(-u * 5.5) * Math.cos(u * 22) * 0.42;
      P.gsy = 1 - s; P.gsx = 1 + s * 0.9;
      P.fl = [-110, 0]; P.fr = [80, 0];
      P.hl = [-250, -360]; P.hr = [250, -360]; P.abL = -40; P.abR = 40; P.sprL = P.sprR = 1;
      P.eyes = 'happy'; P.mouth = 1; P.tilt = 0.08;
      return P;
    }
    // finale wave and wink inside the iris
    groove(0.25 * dip);
    const wv = Math.sin(tq * 14);
    P.hl = [-90, -250]; P.abL = 60; P.armsFront = false;
    P.hr = [200 + wv * 26, -390]; P.abR = 40; P.grR = -0.5 + wv * 0.4; P.sprR = 1;
    P.tilt = 0.12; P.lx = -0.6; P.ly = -0.1; P.mouth = 0.85;
    if (tq > 8.35 && tq < 8.85) P.eyes = 'wink';
    return P;
  }

  /* world props */
  function puffs(c, list, fill) { blob(c, list.map(([x, y, r]) => cc => ell(cc, x, y, r, r)), fill, 11); }
  function rhTree(c, x, gy, h, lean, sq, sing, seed) {
    c.save(); c.translate(x, gy); c.scale(1 + sq * 0.6, 1 - sq);
    // trunk with knees
    const N = 12, L = [], R = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N, cx = lean * h * u * u + Math.sin(u * 5 + seed) * 10, w = lerp(54, 22, u);
      L.push([cx - w, -h * u]); R.push([cx + w, -h * u]);
    }
    c.beginPath(); c.moveTo(L[0][0] - 24, 0); L.forEach(p => c.lineTo(p[0], p[1])); R.reverse().forEach(p => c.lineTo(p[0], p[1])); c.lineTo(R[R.length - 1][0] + 24, 0); c.closePath();
    c.fillStyle = RH.d; c.fill(); c.lineWidth = LW; c.strokeStyle = RH.ink; c.lineJoin = 'round'; c.stroke();
    // bark strokes
    c.lineWidth = 3; c.beginPath();
    for (let i = 0; i < 4; i++) { const u = 0.15 + i * 0.17, cx = lean * h * u * u; c.moveTo(cx - 12, -h * u); c.quadraticCurveTo(cx, -h * u - 8, cx + 10, -h * u + 2); }
    c.stroke();
    const tx = lean * h, ty = -h;
    const r = rng(seed), P = [];
    for (let i = 0; i < 9; i++) { const a = PI + i / 8 * PI + (r() - 0.5) * 0.3, d = 110 + r() * 30; P.push([tx + Math.cos(a) * d * 1.25, ty + Math.sin(a) * d * 0.95 + 40, 62 + r() * 26]); }
    P.push([tx, ty - 30, 120]);
    puffs(c, P, RH.l2);
    c.lineWidth = 3.5; c.strokeStyle = RH.ink; c.lineCap = 'round';
    P.slice(0, 9).forEach(([px, py, pr], i) => { if (i % 2) return; c.beginPath(); c.arc(px, py, pr * 0.62, PI * 1.1, PI * 1.45); c.stroke(); });
    // face in the foliage
    const fx = tx, fy = ty + 10;
    pieEyeSmall(c, fx - 30, fy - 10, 15, 24, sing);
    pieEyeSmall(c, fx + 30, fy - 10, 15, 24, sing);
    c.beginPath(); c.moveTo(fx - 34, fy + 30); c.quadraticCurveTo(fx, fy + 40 + sing * 10, fx + 34, fy + 30);
    c.quadraticCurveTo(fx, fy + 52 + sing * 34, fx - 34, fy + 30); c.fillStyle = RH.ink; c.fill();
    c.restore();
  }
  function pieEyeSmall(c, x, y, rx, ry, k) {
    ell(c, x, y, rx, ry); c.fillStyle = RH.hi; c.fill(); c.lineWidth = 3.5; c.strokeStyle = RH.ink; c.stroke();
    ell(c, x + k * 3, y + 4, rx * 0.55, ry * 0.55); c.fillStyle = RH.ink; c.fill();
    c.beginPath(); c.moveTo(x + k * 3 + 1, y + 3); c.ellipse(x + k * 3, y + 4, rx * 0.45, ry * 0.45, 0, -1.3, -0.7); c.closePath(); c.fillStyle = RH.hi; c.fill();
  }
  function rhFlower(c, x, gy, h, lean, sq, k, seed, s = 1) {
    c.save(); c.translate(x, gy); c.scale(s, s);
    const hx = lean * 60, hy = -h * (1 - sq * 0.25);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-lean * 30, hy * 0.5, hx, hy);
    c.lineWidth = 7; c.strokeStyle = RH.ink; c.lineCap = 'round'; c.stroke();
    [-1, 1].forEach(sd => {
      c.save(); c.translate(-lean * 14, hy * 0.42); c.rotate(sd * (0.9 + sq * 0.5) - PI / 2 * 0); c.scale(sd, 1);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(26, -28, 54, -6); c.quadraticCurveTo(26, 8, 0, 0);
      c.fillStyle = RH.m; c.fill(); c.lineWidth = 4; c.strokeStyle = RH.ink; c.stroke(); c.restore();
    });
    c.save(); c.translate(hx, hy); c.rotate(lean * 0.4); c.scale(1 + sq * 0.2, 1 - sq * 0.2);
    const pet = [];
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + seed; pet.push(cc => ell(cc, Math.cos(a) * 40, Math.sin(a) * 40, 26, 15, a)); }
    blob(c, pet, RH.hi, 9);
    ell(c, 0, 0, 32, 32); c.fillStyle = RH.l2; c.fill(); c.lineWidth = 4.5; c.strokeStyle = RH.ink; c.stroke();
    ell(c, -10, -6, 4.5, 8); c.fillStyle = RH.ink; c.fill(); ell(c, 10, -6, 4.5, 8); c.fill();
    c.beginPath(); c.moveTo(-14, 8); c.quadraticCurveTo(0, 14 + k * 14, 14, 8); c.quadraticCurveTo(0, 26 * k + 10, -14, 8); c.fill();
    c.restore();
    c.restore();
  }
  function rhHouse(c, x, gy, sq, blink, puff) {
    c.save(); c.translate(x, gy); c.scale(1 + sq * 0.5, 1 - sq);
    // chimney smoke rings rise on the beat
    for (let i = 0; i < 4; i++) {
      const u = (puff + i) / 4, y = -260 - u * 220, rr = 14 + u * 26;
      c.globalAlpha = 1 - u;
      blob(c, [cc => ell(cc, 64 + Math.sin(u * 5) * 18, y, rr, rr * 0.8)], RH.hi, 7);
      c.globalAlpha = 1;
    }
    c.beginPath(); c.rect(48, -250, 34, 80); c.fillStyle = RH.m; c.fill(); c.lineWidth = LW; c.strokeStyle = RH.ink; c.stroke();
    c.beginPath(); c.moveTo(-110, -140); c.lineTo(0, -250); c.lineTo(110, -140); c.closePath(); c.fillStyle = RH.dd; c.fill(); c.stroke();
    c.beginPath(); c.rect(-92, -140, 184, 140); c.fillStyle = RH.l1; c.fill(); c.stroke();
    // window eyes & door mouth
    [-1, 1].forEach(s => {
      c.beginPath(); c.rect(s * 46 - 22, -116, 44, 48); c.fillStyle = RH.hi; c.fill(); c.lineWidth = 4.5; c.stroke();
      if (blink) { c.beginPath(); c.rect(s * 46 - 22, -116, 44, 46); c.fillStyle = RH.m; c.fill(); c.stroke(); }
      else { ell(c, s * 46 + 6, -88, 9, 14); c.fillStyle = RH.ink; c.fill(); }
    });
    c.beginPath(); c.moveTo(-26, 0); c.lineTo(-26, -46); c.quadraticCurveTo(0, -66, 26, -46); c.lineTo(26, 0); c.closePath(); c.fillStyle = RH.dd; c.fill(); c.stroke();
    c.restore();
  }
  function rhSun(c, x, y, rot, sq, k) {
    c.save(); c.translate(x, y); c.scale(1 + sq * 0.4, 1 - sq * 0.4);
    c.save(); c.rotate(rot);
    for (let i = 0; i < 12; i++) {
      c.rotate(TAU / 12);
      c.beginPath(); c.moveTo(-16, -100); c.quadraticCurveTo(-10, -140, 0, -168); c.quadraticCurveTo(10, -140, 16, -100); c.closePath();
      c.fillStyle = RH.hi; c.fill(); c.lineWidth = 5; c.strokeStyle = RH.ink; c.stroke();
    }
    c.restore();
    ell(c, 0, 0, 96, 96); c.fillStyle = RH.hi; c.fill(); c.lineWidth = LW; c.strokeStyle = RH.ink; c.stroke();
    pieEyeSmall(c, -30, -16, 14, 22, k);
    pieEyeSmall(c, 30, -16, 14, 22, k);
    c.beginPath(); c.moveTo(-42, 24); c.quadraticCurveTo(0, 50, 42, 24); c.lineWidth = 6; c.lineCap = 'round'; c.stroke();
    c.restore();
  }

  function rhScene(c, t, tq, W, H) {
    const bt = tq / 0.5, bi = Math.floor(bt), ph = bt - bi, sw = Math.sin(PI * bt);
    const grooveOn = tq >= 0.2 && tq < 7.2 && !(tq >= 4.5 && tq < 5.9);
    let pulse = grooveOn ? Math.exp(-ph * 7) : 0;
    let big = 0;
    if (tq >= 7.21) { const u = tq - 7.21; big = Math.exp(-u * 5) * Math.cos(u * 20) * 0.25; }
    if (tq >= 5.42 && tq < 5.9) { const u = tq - 5.42; big = Math.exp(-u * 7) * Math.cos(u * 24) * 0.12; }
    const charl = tq >= 5.9 && tq < 6.84 ? 1 : 0;
    const sq = pulse * 0.07 + big;
    const lean = sw * (0.07 + charl * 0.12);
    // sky
    const sky = c.createLinearGradient(0, 0, 0, 700);
    sky.addColorStop(0, RH.l1); sky.addColorStop(1, RH.hi);
    c.fillStyle = sky; c.fillRect(-40, -40, W + 80, H + 80);
    // painted sky streaks
    c.strokeStyle = 'rgba(164,142,108,0.18)'; c.lineWidth = 3;
    for (let i = 0; i < 14; i++) { const y = 60 + i * 34; c.beginPath(); c.moveTo(-20, y); c.bezierCurveTo(500, y + 10, 1300, y - 14, W + 20, y + 6); c.stroke(); }
    rhSun(c, 1690, 190, Math.floor(tq * 2) * 0.13, sq * 1.4, sw);
    // clouds
    [[380, 170, 1], [1080, 120, 0.8], [760, 300, 0.55]].forEach(([x, y, s], i) => {
      const dx = (tq * 18 * s) % 200 - 60;
      c.save(); c.translate(x + dx, y); c.scale(s * (1 + sq * 0.8 * (i % 2 ? 1 : -1)), s * (1 - sq * 0.6));
      puffs(c, [[-70, 10, 44], [-20, -20, 58], [44, -6, 50], [90, 16, 34], [10, 22, 40]], RH.hi);
      c.restore();
    });
    // far hills
    c.save();
    c.beginPath(); c.moveTo(-40, 700); c.bezierCurveTo(200, 470, 560, 470, 820, 640); c.bezierCurveTo(1060, 520, 1400, 470, 1980, 640); c.lineTo(1980, 1100); c.lineTo(-40, 1100); c.closePath();
    c.fillStyle = RH.l2; c.fill(); c.lineWidth = LW; c.strokeStyle = RH.ink; c.stroke();
    // fields stripes
    c.clip(); c.strokeStyle = 'rgba(62,48,35,0.35)'; c.lineWidth = 3;
    for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(1050 + i * 70, 1000); c.quadraticCurveTo(1300 + i * 50, 640, 1500 + i * 46, 560); c.stroke(); }
    c.restore();
    rhHouse(c, 1290, 640, sq * 1.2, bi % 8 === 5 && ph < 0.4, (tq * 2) % 1);
    // a little picket fence that hops
    for (let i = 0; i < 7; i++) {
      const x = 470 + i * 46, up = grooveOn ? Math.max(0, Math.sin((bt + i * 0.25) * PI)) * 10 : 0, y = 690 - up;
      c.beginPath(); c.moveTo(x - 12, y); c.lineTo(x - 12, y - 64); c.lineTo(x, y - 80); c.lineTo(x + 12, y - 64); c.lineTo(x + 12, y); c.closePath();
      c.fillStyle = RH.hi; c.fill(); c.lineWidth = 4.5; c.strokeStyle = RH.ink; c.stroke();
    }
    c.beginPath(); c.rect(450, 640, 316, 10); c.fillStyle = RH.hi; c.fill(); c.lineWidth = 4; c.stroke();
    // near ground
    c.beginPath(); c.moveTo(-40, 760); c.bezierCurveTo(500, 700, 1400, 700, 1980, 760); c.lineTo(1980, 1100); c.lineTo(-40, 1100); c.closePath();
    c.fillStyle = RH.m; c.fill(); c.lineWidth = LW; c.strokeStyle = RH.ink; c.stroke();
    // path
    c.beginPath(); c.moveTo(780, 1100); c.bezierCurveTo(850, 900, 900, 780, 960, 724); c.bezierCurveTo(1020, 780, 1070, 900, 1140, 1100); c.closePath();
    c.fillStyle = RH.l1; c.fill(); c.lineWidth = 4.5; c.stroke();
    // grass tufts
    const gr = rng(4);
    c.strokeStyle = RH.ink; c.lineWidth = 3.5;
    for (let i = 0; i < 26; i++) {
      const x = gr() * W, y = 790 + gr() * 270; if (Math.abs(x - 960) < 220) continue;
      const l = (grooveOn ? Math.sin((bt + x * 0.002) * PI) : 0) * 6;
      c.beginPath(); c.moveTo(x - 12, y); c.quadraticCurveTo(x - 10 + l, y - 18, x - 16 + l, y - 26); c.moveTo(x, y); c.quadraticCurveTo(x + l, y - 22, x + 2 + l, y - 34); c.moveTo(x + 12, y); c.quadraticCurveTo(x + 12 + l, y - 18, x + 18 + l, y - 24); c.stroke();
    }
    // trees: the left one leans with the beat, the right one answers
    const kick = charl ? Math.sin(((tq - 5.9) / 0.25) * PI) * 0.15 : 0;
    rhTree(c, 300, 960, 380, lean + kick, sq, sw, 3);
    rhTree(c, 1660, 980, 400, -lean - kick, sq, -sw, 8);
    // flower chorus
    [[110, 1050, 150, 0, 1], [600, 1000, 120, 1, 0.85], [1310, 1010, 126, 0, 0.9], [1840, 1060, 150, 1, 1], [700, 760, 80, 0, 0.55], [1230, 760, 80, 1, 0.55]].forEach(([x, y, h, odd, s], i) => {
      const l = (odd ? -1 : 1) * sw * 0.5 + (charl ? (odd ? -1 : 1) * Math.sin(((tq - 5.9) / 0.25) * PI) * 0.5 : 0);
      rhFlower(c, x, y, h, l, sq * 2 + (grooveOn ? pulse * 0.15 : 0), grooveOn ? 1 - ph : 0.4, i, s);
    });
    return { sq, pulse, big };
  }

  function rhTitle(c, t, W, H) {
    const pop = t < 9.0 ? 0 : 1;
    c.fillStyle = RH.paper; c.fillRect(-40, -40, W + 80, H + 80);
    const bg = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1000);
    bg.addColorStop(0, RH.hi); bg.addColorStop(1, RH.l2);
    c.fillStyle = bg; c.fillRect(-40, -40, W + 80, H + 80);
    // sunburst rays
    c.save(); c.translate(W / 2, 520);
    for (let i = 0; i < 36; i++) { c.rotate(TAU / 36); if (i % 2) continue; c.beginPath(); c.moveTo(0, 0); c.lineTo(-90, -1400); c.lineTo(90, -1400); c.closePath(); c.fillStyle = 'rgba(160,138,104,0.18)'; c.fill(); }
    c.restore();
    // art-deco frame
    c.strokeStyle = RH.ink;
    c.lineWidth = 10; c.strokeRect(90, 70, W - 180, H - 140);
    c.lineWidth = 3; c.strokeRect(112, 92, W - 224, H - 184);
    [[112, 92, 1, 1], [W - 112, 92, -1, 1], [112, H - 92, 1, -1], [W - 112, H - 92, -1, -1]].forEach(([x, y, sx, sy]) => {
      c.save(); c.translate(x, y); c.scale(sx, sy);
      c.beginPath(); c.arc(0, 0, 70, 0, PI / 2); c.lineWidth = 6; c.stroke();
      c.beginPath(); c.arc(0, 0, 46, 0, PI / 2); c.lineWidth = 3; c.stroke();
      ell(c, 0, 0, 22, 22); c.fillStyle = RH.ink; c.fill();
      c.restore();
    });
    // medallion with our fellow
    const mb = 1 + (1 - spring(t - 9.0, 3.5, 0.35)) * 0.25 * pop;
    c.save(); c.translate(W / 2, 300); c.scale(mb, mb);
    ell(c, 0, 0, 170, 170); c.fillStyle = RH.ink; c.fill();
    ell(c, 0, 0, 156, 156); c.fillStyle = RH.l1; c.fill();
    c.save(); ell(c, 0, 0, 156, 156); c.clip();
    for (let i = 0; i < 16; i++) { c.save(); c.rotate(i / 16 * TAU); c.beginPath(); c.moveTo(0, 0); c.lineTo(-30, -200); c.lineTo(30, -200); c.closePath(); c.fillStyle = 'rgba(108,88,66,0.2)'; c.fill(); c.restore(); }
    const wv = Math.sin(Math.floor(t * 12) / 12 * 14);
    c.lineWidth = 15; c.strokeStyle = RH.ink;
    ell(c, 0, 230, 90, 120); c.fillStyle = RH.ink; c.fill();
    const a = hose(c, 60, 130, 150 + wv * 10, 30, -30, 15);
    glove(c, 150 + wv * 10, 30, a - 0.4 + wv * 0.3, 1, 1, 1);
    rhHead(c, 0, 36, 92, { mouth: 0.9, lx: -0.4, ly: -0.1, tilt: 0.1, eyes: t > 9.3 && t < 9.8 ? 'wink' : 'pie' });
    bowler(c, 4, -42, -0.04, 1.1);
    c.restore();
    ell(c, 0, 0, 156, 156); c.lineWidth = 4; c.strokeStyle = RH.ink; c.stroke();
    c.restore();
    // title
    text(c, 'A MOTION STYLE ATLAS CARTOON', W / 2, 540, { font: 'Limelight, serif', size: 40, ls: 10, align: 'center', color: RH.dd });
    c.save(); c.translate(W / 2, 700);
    const ts = 1 + (1 - spring(t - 9.0, 3, 0.4)) * 0.18 * pop;
    c.scale(ts, ts);
    text(c, 'RUBBER HOSE', 8, 10, { font: 'Rye, serif', size: 168, align: 'center', color: RH.dd, ls: 4 });
    text(c, 'RUBBER HOSE', 0, 0, { font: 'Rye, serif', size: 168, align: 'center', color: RH.hi, stroke: RH.ink, lw: 14, ls: 4 });
    text(c, 'RUBBER HOSE', 0, 0, { font: 'Rye, serif', size: 168, align: 'center', color: RH.hi, ls: 4 });
    c.restore();
    // ribbon
    c.save(); c.translate(W / 2, 800);
    c.beginPath(); c.moveTo(-440, -36); c.lineTo(440, -36); c.lineTo(480, 0); c.lineTo(440, 36); c.lineTo(-440, 36); c.lineTo(-480, 0); c.closePath();
    c.fillStyle = RH.ink; c.fill();
    text(c, 'A GOLDEN-AGE CARTOON  ·  1928 — 1934', 0, 11, { font: 'Limelight, serif', size: 30, ls: 4, align: 'center', color: RH.paper });
    c.restore();
    const endA = t >= 9.25 ? 1 : 0;
    if (endA) {
      const s = 1 + (1 - spring(t - 9.25, 4, 0.4)) * 0.4;
      c.save(); c.translate(W / 2, 922); c.scale(s, s); c.rotate(-0.03);
      text(c, 'THE  END', 0, 0, { font: 'Rye, serif', size: 64, align: 'center', color: RH.ink, ls: 10 });
      c.restore();
    }
  }

  MG.film({
    id: 'rubberhose',
    dur: 10,
    poster: 9.4,
    fonts: [['400 160px Rye', 'RUBBERHOSETND'], ['400 34px Limelight', 'A MOTION STYLE ATLAS CARTOON GOLDEN-AGE 1928—34·']],
    meta: {
      family: 'C', name: 'Rubber Hose', sub: 'Golden-age Cartoon', era: '1920s —',
      origin: 'The first sound-era cartoon style: limbs drawn as boneless tubes that bend anywhere, so characters can bounce, stretch and dance on every beat of the soundtrack. It grew out of Fleischer Studios and Ub Iwerks\' animation for early Disney, and was revived wholesale by Studio MDHR\'s Cuphead.',
      works: 'Steamboat Willie (Disney / Ub Iwerks, 1928) · The Skeleton Dance (Disney, 1929) · Swing You Sinners! (Fleischer, 1930) · Minnie the Moocher (Fleischer, 1932) · Cuphead (Studio MDHR, 2017)',
      tech: ['Boneless noodle limbs', 'Everything pulses on the beat', 'Iris-out to a title card'],
      accent: '#c9a46a',
      motionDNA: 'A constant squash-and-stretch bounce locked to the music, with rubber limbs that stretch and snap back for gags.',
      visualDNA: 'Pie-cut eyes, white gloves and ink-black bodies on a faded sepia world, seen through grain, flicker and a weaving film gate.',
      transitions: 'Iris-in, iris-out, squash cut, title card',
      implementation: ['Toon Boom Harmony', 'After Effects', 'Canvas 2D'],
      reproducibility: 'Needs hand animation (this film is a procedural homage)',
      loopable: true,
    },
    setup() { return {}; },
    draw(c, t, W, H) {
      const tq = Math.floor(t * 12) / 12;
      const f = fr24(t);
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      c.save();
      // gate weave + slight overscan
      c.translate(W / 2 + vnoise(f * 0.37, 1) * 3.2, H / 2 + vnoise(f * 0.41, 2) * 4.2);
      c.scale(1.012, 1.012); c.translate(-W / 2, -H / 2);
      if (t < 9.0) {
        const S = rhScene(c, t, tq, W, H);
        const P = rhPose(tq);
        // shadow
        const sh = 1 - clamp((P.air || 0) / 500);
        if (tq > 0.35) { ell(c, RX, RG + 4, 156 * sh * (P.gsx || 1), 20 * sh); c.fillStyle = 'rgba(40,30,20,0.4)'; c.fill(); }
        if (tq > 0.38) {
          const CS = 1.3;
          c.save(); c.translate(RX, RG); c.scale(CS, CS); c.translate(-RX, -RG);
          const hd0 = rhChar(c, P);
          if (P.hatPos) bowler(c, RX + P.hatPos[0], RG + P.hatPos[1], P.hatRot || 0, 1);
          if (P.stars) {
            for (let i = 0; i < 4; i++) {
              const a = P.stars * 14 + i * TAU / 4;
              star(c, hd0.headX + Math.cos(a) * 130, hd0.headY - 110 + Math.sin(a) * 30, 22, RH.hi);
            }
          }
          c.restore();
          const hd = { headX: RX + (hd0.headX - RX) * CS, headY: RG + (hd0.headY - RG) * CS };
          // landing dust & pow lines
          const dust = (u, k) => {
            if (u < 0 || u > 0.5) return;
            for (let s = -1; s <= 1; s += 2) for (let i = 0; i < 3; i++) {
              const x = RX + s * (120 + u * 260 + i * 46), y = RG - 10 - i * 14 - u * 40, rr = (30 - i * 6) * (1 - u) * k;
              blob(c, [cc => ell(cc, x, y, rr, rr * 0.8)], RH.hi, 8);
            }
          };
          dust(tq - 0.7, 1); dust(tq - 7.21, 1.4);
          if (tq >= 7.21 && tq < 7.6) {
            c.strokeStyle = RH.ink; c.lineWidth = 7; c.lineCap = 'round';
            for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r0 = 300 + (tq - 7.21) * 500, r1 = r0 + 70; c.beginPath(); c.moveTo(RX + Math.cos(a) * r0, 640 + Math.sin(a) * r0 * 0.6); c.lineTo(RX + Math.cos(a) * r1, 640 + Math.sin(a) * r1 * 0.6); c.stroke(); }
          }
          // music notes float up from the grin
          if (tq > 0.8 && tq < 7.75) {
            for (let i = 0; i < 3; i++) {
              const u = ((tq * 0.9 + i / 3) % 1), x = hd.headX + 120 + u * 140 + Math.sin(u * 9 + i) * 26, y = hd.headY + 20 - u * 260;
              c.globalAlpha = Math.sin(u * PI); note(c, x, y, i % 2); c.globalAlpha = 1;
            }
          }
          // the iris
          let ir = 2000;
          if (t < 0.55) ir = 1400 * E.inQ(seg(t, 0.06, 0.55));
          if (t >= 7.75) ir = t < 8.2 ? lerp(1300, 290, E.ioC(seg(t, 7.75, 8.2))) : t < 8.75 ? 290 + Math.sin((t - 8.2) * 9) * 6 : 290 * (1 - E.inQ(seg(t, 8.75, 8.96)));
          if (ir < 1999) {
            const cx = t < 0.55 ? RX : hd.headX, cy = t < 0.55 ? 600 : hd.headY - 10;
            c.beginPath(); c.rect(-100, -100, W + 200, H + 200); c.arc(cx, cy, Math.max(0, ir), 0, TAU);
            c.fillStyle = '#0c0805'; c.fill('evenodd');
          }
        } else {
          let ir = 1400 * E.inQ(seg(t, 0.06, 0.55));
          c.beginPath(); c.rect(-100, -100, W + 200, H + 200); c.arc(RX, 600, Math.max(0, ir), 0, TAU);
          c.fillStyle = '#0c0805'; c.fill('evenodd');
        }
      } else {
        rhTitle(c, t, W, H);
      }
      c.restore();
      // projector start flash
      if (t < 0.08) { c.fillStyle = 'rgba(255,246,226,0.85)'; c.fillRect(0, 0, W, H); }
      // sepia print tone
      c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = '#f3e2c0'; c.fillRect(0, 0, W, H); c.restore();
      filmFX(c, t, W, H, { grain: 0.24, vig: 0.75, flicker: 0.1 });
    },
    score(A) {
      const B = 0.5;
      // projector run: soft hiss + gate clatter + crackle
      A.noise(0, { type: 'bandpass', f: 2600, q: 0.6, dur: 9.95, g: 0.012, hold: true, rel: 0.4 });
      for (let i = 0; i < 238; i++) { const t = i / 24; A.noise(t, { type: 'bandpass', f: 1400, q: 3, dur: 0.012, g: 0.012 }); }
      const cr = rng(31);
      for (let i = 0; i < 160; i++) { const t = cr() * 9.9; A.noise(t, { type: 'highpass', f: 2500 + cr() * 4000, dur: 0.004 + cr() * 0.006, g: 0.03 + cr() * 0.05 }); }
      const wood = (t, hi = 1) => { A.osc(t, { type: 'sine', f: hi ? 1250 : 900, f2: hi ? 1150 : 820, dur: 0.07, g: 0.26 }); A.noise(t, { type: 'bandpass', f: hi ? 2300 : 1700, q: 9, dur: 0.05, g: 0.22 }); };
      const slide = (t, f1, f2, d, g = 0.13) => A.osc(t, { type: 'sine', f: f1, f2, glide: d, dur: d + 0.04, g, a: 0.03, vib: [7, 18], hold: true, rel: 0.05, lp: 3000 });
      const crash = (t, g = 0.18) => { A.noise(t, { type: 'highpass', f: 5200, dur: 1.4, g, rev: 0.3 }); A.noise(t, { type: 'bandpass', f: 3200, q: 0.8, dur: 0.6, g: g * 0.6 }); };
      const tuba = (t, m, d = 0.3) => { A.osc(t, { type: 'sawtooth', f: midi(m), dur: d, g: 0.12, lp: 420, a: 0.012 }); A.osc(t, { type: 'triangle', f: midi(m), dur: d, g: 0.26, a: 0.01 }); };
      const banjo = (t, ns, g = 0.11) => ns.forEach((n, i) => A.pluck(t + i * 0.012, midi(n), { dur: 0.45, bright: 0.85, decay: 0.988, g, lp: 3600 }));
      const clar = (t, m, d, g = 0.075) => A.osc(t, { type: 'square', f: midi(m), dur: d, g, a: 0.02, lp: 1900, q: 1.5, vib: [5.6, midi(m) * 0.012], hold: true, rel: 0.06, rev: 0.12 });
      const horn = (t, ns, d = 0.2, g = 0.06) => ns.forEach(n => A.osc(t, { type: 'sawtooth', f: midi(n), dur: d, g, a: 0.012, lp: 1500, lp2: 900, hold: true, rel: 0.05, rev: 0.1 }));
      const brush = (t, g = 0.05) => A.noise(t, { type: 'bandpass', f: 3800, q: 0.5, dur: 0.12, g, swell: 0.4 });
      // chords per beat (oom on the beat, pah on the and)
      const CH = { C: [48, 55, [60, 64, 67]], A7: [45, 52, [61, 64, 67]], D7: [50, 45, [62, 66, 72]], G7: [43, 50, [59, 62, 65]], F: [41, 48, [60, 65, 69]] };
      const prog = ['C', 'C', 'C', 'C', 'A7', 'A7', 'D7', 'D7', 'G7', 'G7', 'G7', 'G7', 'C', 'C', 'F', 'F'];
      // entrance
      slide(0.36, 2200, 380, 0.34, 0.14);
      wood(0.7, 0); A.osc(0.7, { type: 'sine', f: 140, f2: 90, dur: 0.4, g: 0.35, vib: [16, 30] });
      for (let k = 2; k < 15; k++) {
        const t = k * B, ch = CH[prog[Math.min(k - 2, prog.length - 1)]] || CH.C;
        if (t >= 4.5 && t < 6.0) continue;
        if (t >= 6.75) break;
        tuba(t, k % 2 ? ch[1] : ch[0]);
        banjo(t + 0.25, ch[2]);
        brush(t + 0.25); A.hat(t + 0.25 + 0.125, 0.03);
        if (k % 2 === 0) A.kick(t, 0.25, { f: 110, f2: 50, dur: 0.2 });
      }
      // tune (swung eighths)
      const mel = [[1.0, 76, 0.22], [1.25, 79, 0.22], [1.5, 81, 0.35], [1.83, 79, 0.17], [2.0, 76, 0.22], [2.25, 72, 0.22], [2.5, 74, 0.22], [2.75, 76, 0.45],
        [3.25, 73, 0.2], [3.5, 74, 0.2], [3.75, 76, 0.2], [4.0, 81, 0.2], [4.17, 78, 0.15], [4.33, 74, 0.15]];
      mel.forEach(([t, m, d]) => clar(t, m, d));
      // hat gag
      wood(4.5, 1); A.osc(4.5, { type: 'sine', f: 300, f2: 900, dur: 0.22, g: 0.14, vib: [20, 40] });
      slide(4.62, 420, 1900, 0.44);
      wood(5.08, 1); wood(5.16, 0);
      slide(5.12, 1800, 360, 0.3);
      A.osc(5.42, { type: 'sine', f: 180, f2: 70, dur: 0.6, g: 0.4, vib: [14, 40] });
      A.osc(5.42, { type: 'triangle', f: 90, f2: 45, dur: 0.3, g: 0.3 });
      crash(5.42, 0.12);
      [5.55, 5.66, 5.77].forEach((t, i) => A.bell(t, 1600 + i * 300, { g: 0.05, dur: 0.4 }));
      // Charleston
      [[6.0, 'C'], [6.25, 'C'], [6.5, 'F'], [6.62, 'F']].forEach(([t, k], i) => { tuba(t, CH[k][i % 2]); horn(t, CH[k][2].map(n => n + 12), 0.14); wood(t + 0.125, i % 2); });
      A.snare(6.5, 0.18); A.snare(6.62, 0.14);
      // jump & land
      slide(6.82, 360, 2400, 0.36, 0.15);
      A.snare(7.0, 0.1); A.snare(7.06, 0.12); A.snare(7.12, 0.14);
      A.kick(7.21, 0.6); crash(7.21, 0.2);
      horn(7.21, [60, 64, 67, 72], 0.5, 0.07); tuba(7.21, 36, 0.5); banjo(7.21, [60, 64, 67, 72], 0.14);
      // shave and a haircut … two bits
      const tag = [[7.75, 72], [8.0, 67], [8.125, 67], [8.25, 69], [8.5, 67], [9.0, 71], [9.25, 72]];
      tag.forEach(([t, m], i) => {
        clar(t, m, i >= 5 ? 0.2 : 0.14, 0.085);
        horn(t, [m - 12], i >= 5 ? 0.2 : 0.12, 0.05);
        if (i === 0 || i === 4) tuba(t, i === 4 ? 43 : 48);
        if (i >= 5) { wood(t, 1); A.kick(t, 0.4, { f: 120, f2: 45 }); }
      });
      tuba(9.25, 36, 0.6); banjo(9.25, [60, 64, 67, 72], 0.14); horn(9.25, [64, 67, 72], 0.45, 0.06); crash(9.25, 0.12);
      wood(8.5, 0);
    },
  });
  function star(c, x, y, r, fill) {
    c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, q = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
    c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = 4; c.strokeStyle = RH.ink; c.stroke();
  }
  function note(c, x, y, two) {
    c.fillStyle = RH.ink; c.strokeStyle = RH.ink; c.lineWidth = 5;
    ell(c, x, y, 14, 10, -0.4); c.fill();
    c.beginPath(); c.moveTo(x + 12, y - 4); c.lineTo(x + 12, y - 54); c.stroke();
    if (two) { ell(c, x + 40, y - 8, 14, 10, -0.4); c.fill(); c.beginPath(); c.moveTo(x + 52, y - 12); c.lineTo(x + 52, y - 60); c.lineTo(x + 12, y - 54); c.lineWidth = 9; c.stroke(); }
    else { c.beginPath(); c.moveTo(x + 12, y - 54); c.quadraticCurveTo(x + 34, y - 40, x + 30, y - 22); c.lineWidth = 5; c.stroke(); }
  }

  /* ======================================================================
     02  SILHOUETTE — Reiniger paper-cut: filigree garden, winged horse, lace palace
     ====================================================================== */
  const SIL = '#070403';
  const TINTS = {
    amber: { top: [74, 30, 8], mid: [226, 150, 62], glow: [255, 230, 170] },
    teal: { top: [5, 34, 42], mid: [44, 136, 134], glow: [196, 244, 230] },
    rose: { top: [58, 12, 34], mid: [214, 104, 118], glow: [255, 218, 200] },
  };
  const mixT = (a, b, k) => ({ top: a.top.map((v, i) => lerp(v, b.top[i], k)), mid: a.mid.map((v, i) => lerp(v, b.mid[i], k)), glow: a.glow.map((v, i) => lerp(v, b.glow[i], k)) });
  const rgb = (a, al = 1) => `rgba(${a[0] | 0},${a[1] | 0},${a[2] | 0},${al})`;

  function leaf(g, x, y, a, L) {
    const ca = Math.sin(a), sa = -Math.cos(a), nx = -sa, ny = ca;
    g.beginPath(); g.moveTo(x, y);
    g.quadraticCurveTo(x + ca * L * 0.5 + nx * L * 0.32, y + sa * L * 0.5 + ny * L * 0.32, x + ca * L, y + sa * L);
    g.quadraticCurveTo(x + ca * L * 0.5 - nx * L * 0.32, y + sa * L * 0.5 - ny * L * 0.32, x, y);
    g.fill();
  }
  function curl(g, x, y, a, w, dir, L) {
    let px = x, py = y;
    for (let i = 0; i < 34; i++) {
      a += dir * (0.1 + i * 0.013);
      const st = L / 16 * (1 - i / 38), nx = px + Math.sin(a) * st, ny = py - Math.cos(a) * st;
      g.lineWidth = Math.max(1.2, w * (1 - i / 36)); g.beginPath(); g.moveTo(px, py); g.lineTo(nx, ny); g.stroke();
      px = nx; py = ny;
    }
    g.beginPath(); g.arc(px, py, Math.max(1.5, w * 0.3), 0, TAU); g.fill();
  }
  function blossom(g, x, y, r) {
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.beginPath(); g.ellipse(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.8, r * 0.45, a, 0, TAU); g.fill(); }
    g.beginPath(); g.arc(x, y, r * 0.7, 0, TAU); g.fill();
  }
  // a Reiniger tree: spindly curling limbs, lacy leaves, spiral tips
  function filTree(g, x, y, seed, sc, depth = 4) {
    const r = rng(seed);
    g.fillStyle = g.strokeStyle = SIL; g.lineCap = 'round';
    const br = (x, y, a, len, w, d) => {
      const k = (r() - 0.5) * 1.3, N = 12; let px = x, py = y;
      for (let i = 0; i < N; i++) {
        const u = i / N, ww = lerp(w, w * 0.6, u);
        a += k * 0.08;
        const nx = px + Math.sin(a) * len / N, ny = py - Math.cos(a) * len / N;
        g.lineWidth = ww; g.beginPath(); g.moveTo(px, py); g.lineTo(nx, ny); g.stroke();
        if (d <= 1 && i % 2 === 1) leaf(g, nx, ny, a + (i % 4 === 1 ? 1.15 : -1.15), (9 + ww * 1.4) * (0.8 + r() * 0.5));
        px = nx; py = ny;
      }
      if (d > 0) {
        const n = d >= 3 ? 3 : 2;
        for (let j = 0; j < n; j++) br(px, py, a + (j - (n - 1) / 2) * (0.6 + r() * 0.35) + (r() - 0.5) * 0.3, len * (0.62 + r() * 0.16), w * 0.62, d - 1);
      } else {
        if (r() < 0.35) blossom(g, px, py, 5 + r() * 4); else curl(g, px, py, a, w * 0.7, k >= 0 ? 1 : -1, len * 0.4);
      }
    };
    // root flare
    g.beginPath(); g.moveTo(x - 60 * sc, y); g.quadraticCurveTo(x - 14 * sc, y - 20 * sc, x - 14 * sc, y - 80 * sc); g.lineTo(x + 14 * sc, y - 80 * sc); g.quadraticCurveTo(x + 14 * sc, y - 20 * sc, x + 60 * sc, y); g.fill();
    br(x, y - 40 * sc, (r() - 0.5) * 0.12, 250 * sc, 32 * sc, depth);
  }
  // ground strip with ferns, grasses and bell flowers
  function groundStrip(g, W0, y0, seed) {
    const r = rng(seed);
    g.fillStyle = g.strokeStyle = SIL; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, y0 + 40);
    for (let x = 0; x <= W0; x += 40) g.lineTo(x, y0 + 26 + Math.sin(x * 0.006) * 14 + Math.sin(x * 0.021) * 6);
    g.lineTo(W0, 2000); g.lineTo(0, 2000); g.closePath(); g.fill();
    for (let i = 0; i < 70; i++) {
      const x = r() * W0, y = y0 + 30 + Math.sin(x * 0.006) * 14, kind = r();
      if (kind < 0.45) { // grass tuft
        for (let k = 0; k < 5; k++) { const a = (k - 2) * 0.28 + (r() - 0.5) * 0.2, L = 30 + r() * 40; g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.sin(a) * L * 0.5, y - L * 0.6, x + Math.sin(a * 1.6) * L, y - L); g.stroke(); }
      } else if (kind < 0.7) { // fern curl
        curl(g, x, y, (r() - 0.5) * 0.6, 4, r() < 0.5 ? 1 : -1, 60 + r() * 50);
      } else { // bell flower
        const h = 50 + r() * 70; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 10, y - h * 0.6, x + 22, y - h); g.stroke();
        g.beginPath(); g.moveTo(x + 22, y - h); g.quadraticCurveTo(x + 34, y - h + 2, x + 36, y - h + 18); g.lineTo(x + 30, y - h + 14); g.lineTo(x + 26, y - h + 20); g.lineTo(x + 20, y - h + 13); g.quadraticCurveTo(x + 18, y - h + 2, x + 22, y - h); g.fill();
        leaf(g, x + 4, y - h * 0.3, 0.9, 18); leaf(g, x + 6, y - h * 0.45, -0.7, 16);
      }
    }
  }
  function lacyCloud(seed, w, h) {
    const cv = offscreen(w, h), g = cv.getContext('2d'), r = rng(seed);
    g.fillStyle = SIL;
    const circ = [];
    for (let i = 0; i < 14; i++) { const u = i / 13, x = 60 + u * (w - 120), rr = (h * 0.22) * (0.6 + Math.sin(u * PI) * 0.8) * (0.8 + r() * 0.4); circ.push([x, h * 0.62 - rr * 0.35 + (r() - 0.5) * 10, rr]); }
    circ.forEach(([x, y, rr]) => { g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); });
    g.fillRect(60, h * 0.62, w - 120, h * 0.12);
    g.globalCompositeOperation = 'destination-out';
    circ.forEach(([x, y, rr]) => {
      for (let k = 0; k < 7; k++) { const a = PI + 0.3 + k / 6 * (PI - 0.6); g.beginPath(); g.arc(x + Math.cos(a) * rr * 0.72, y + Math.sin(a) * rr * 0.72, rr * 0.09, 0, TAU); g.fill(); }
      g.beginPath(); g.ellipse(x, y - rr * 0.1, rr * 0.18, rr * 0.3, 0, 0, TAU); g.fill();
    });
    for (let x = 80; x < w - 80; x += 22) { g.beginPath(); g.arc(x, h * 0.7, 5, 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    return cv;
  }
  function farLand(seed, w, h) {
    const cv = offscreen(w, h), g = cv.getContext('2d'), r = rng(seed);
    g.fillStyle = g.strokeStyle = SIL; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= w; x += 20) g.lineTo(x, h * 0.62 + Math.sin(x * 0.004 + 1) * 40 + Math.sin(x * 0.013) * 14);
    g.lineTo(w, h); g.closePath(); g.fill();
    for (let i = 0; i < 9; i++) {
      const x = 120 + i * (w / 9) + r() * 60, y = h * 0.62 + Math.sin(x * 0.004 + 1) * 40 + Math.sin(x * 0.013) * 14 + 10;
      if (i % 3 === 1) { // tiny dome town
        g.fillRect(x - 40, y - 60, 80, 70);
        g.beginPath(); g.moveTo(x - 28, y - 58); g.bezierCurveTo(x - 40, y - 90, x - 10, y - 110, x, y - 130); g.bezierCurveTo(x + 10, y - 110, x + 40, y - 90, x + 28, y - 58); g.fill();
        g.fillRect(x + 50, y - 150, 12, 160); g.beginPath(); g.arc(x + 56, y - 154, 10, 0, TAU); g.fill();
      } else filTree(g, x, y, seed + i * 11, 0.34, 3);
    }
    return cv;
  }
  function cornerOrn(seed) {
    const S = 460, cv = offscreen(S, S), g = cv.getContext('2d');
    g.fillStyle = g.strokeStyle = SIL; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(S * 0.42, 0); g.quadraticCurveTo(S * 0.1, S * 0.1, 0, S * 0.42); g.closePath(); g.fill();
    curl(g, S * 0.36, 8, 1.9, 9, 1, 150);
    curl(g, 8, S * 0.36, 3.5, 9, -1, 150);
    curl(g, S * 0.16, S * 0.16, 2.4, 10, 1, 210);
    [[S * 0.5, 14, 2.0], [14, S * 0.5, 3.4], [S * 0.3, S * 0.3, 2.6]].forEach(([x, y, a]) => { leaf(g, x, y, a, 40); leaf(g, x, y, a + 0.8, 30); leaf(g, x, y, a - 0.8, 30); });
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(30 + i * 22, 22, 6, 0, TAU); g.fill(); g.beginPath(); g.arc(22, 30 + i * 22, 6, 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    return cv;
  }
  function horseshoe(g, cx, bot, w, top) {
    const rr = w / 2 / 0.85, sy = top + rr;
    g.moveTo(cx - w / 2, bot); g.lineTo(cx - w / 2, sy + rr * 0.53);
    g.arc(cx, sy, rr, PI - 0.56, TAU + 0.56); g.lineTo(cx + w / 2, bot); g.closePath();
  }
  function onion(g, cx, base, w, h) {
    g.moveTo(cx - w * 0.42, base);
    g.bezierCurveTo(cx - w * 0.75, base - h * 0.2, cx - w * 0.45, base - h * 0.62, cx, base - h);
    g.bezierCurveTo(cx + w * 0.45, base - h * 0.62, cx + w * 0.75, base - h * 0.2, cx + w * 0.42, base);
    g.closePath();
  }
  function spire(g, x, y, h) {
    g.fillRect(x - 3, y - h, 6, h);
    g.beginPath(); g.arc(x, y - h * 0.35, 9, 0, TAU); g.fill();
    g.beginPath(); g.arc(x, y - h * 0.7, 6, 0, TAU); g.fill();
    g.beginPath(); g.arc(x, y - h - 12, 13, 0.3 * PI, 1.7 * PI, false); g.arc(x + 6, y - h - 12, 10, 1.65 * PI, 0.35 * PI, true); g.fill();
  }
  function lattice(g, path, x0, y0, x1, y1, s = 20) {
    g.save(); g.beginPath(); path(); g.clip();
    g.strokeStyle = SIL; g.lineWidth = 2.6;
    g.beginPath();
    for (let k = -40; k < 60; k++) { g.moveTo(x0 + k * s, y0); g.lineTo(x0 + k * s + (y1 - y0), y1); g.moveTo(x0 + k * s, y0); g.lineTo(x0 + k * s - (y1 - y0), y1); }
    g.stroke();
    g.fillStyle = SIL;
    for (let y = y0; y < y1; y += s) for (let x = x0; x < x1; x += s) { g.beginPath(); g.arc(x + ((y / s) % 2 ? s / 2 : 0), y, 3.2, 0, TAU); g.fill(); }
    g.restore();
  }
  function palace() {
    const w = 1600, h = 1000, cv = offscreen(w, h), g = cv.getContext('2d'), cx = 800;
    g.fillStyle = g.strokeStyle = SIL;
    const crenel = (x0, x1, y) => { for (let x = x0; x < x1; x += 22) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y - 14); g.lineTo(x + 11, y - 22); g.lineTo(x + 18, y - 14); g.lineTo(x + 22, y); g.fill(); } };
    // terrace and stairs
    g.fillRect(60, 900, w - 120, 100);
    for (let i = 0; i < 5; i++) g.fillRect(cx - 220 + i * 20, 900 - i * 0 + i * 18, 440 - i * 40, 18);
    crenel(60, w - 60, 900);
    // minarets
    const minaret = (x, top, wd) => {
      g.fillRect(x - wd / 2, top, wd, 900 - top);
      [0.25, 0.55].forEach(k => { const y = top + (900 - top) * k; g.fillRect(x - wd, y, wd * 2, 14); crenel(x - wd, x + wd, y); });
      g.beginPath(); onion(g, x, top + 2, wd * 1.5, wd * 1.6); g.fill(); spire(g, x, top - wd * 1.5, 70);
    };
    minaret(150, 330, 46); minaret(w - 150, 330, 46);
    minaret(520, 470, 36); minaret(w - 520, 470, 36);
    // wings
    g.fillRect(200, 680, 330, 220); g.fillRect(w - 530, 680, 330, 220);
    crenel(200, 530, 680); crenel(w - 530, w - 200, 680);
    [[365], [w - 365]].forEach(([x]) => { g.beginPath(); onion(g, x, 680, 200, 190); g.fill(); g.fillRect(x - 70, 660, 140, 24); spire(g, x, 490, 70); });
    // main hall, drum, great dome
    g.fillRect(540, 560, 520, 340); crenel(540, 1060, 560);
    g.fillRect(640, 470, 320, 96);
    g.beginPath(); onion(g, cx, 474, 380, 360); g.fill(); spire(g, cx, 114, 90);
    // lantern chains
    g.lineWidth = 2;
    // ---- cut the lace
    g.globalCompositeOperation = 'destination-out';
    const arches = [[640, 120, 650], [cx, 170, 610], [960, 120, 650]];
    arches.forEach(([x, wd, tp]) => { g.beginPath(); horseshoe(g, x, 900, wd, tp); g.fill(); });
    for (let i = 0; i < 6; i++) { const x = 230 + i * 52; g.beginPath(); horseshoe(g, x + 12, 860, 30, 730); g.fill(); g.beginPath(); horseshoe(g, w - x - 12, 860, 30, 730); g.fill(); }
    for (let i = 0; i < 5; i++) { g.beginPath(); horseshoe(g, 670 + i * 65, 548, 26, 494); g.fill(); }
    // dome lace: ribs of pinholes and a band of quatrefoils
    for (let k = -3; k <= 3; k++) for (let j = 0; j < 9; j++) {
      const u = j / 9, y = 450 - u * 290, half = (190 * Math.sin((1 - u) * 2.3 + 0.35)) * 0.86, x = cx + k / 3.6 * half;
      g.beginPath(); g.arc(x, y, 6 - u * 3, 0, TAU); g.fill();
    }
    for (let i = 0; i < 9; i++) { const x = 660 + i * 35; [[0, -7], [0, 7], [-7, 0], [7, 0]].forEach(([dx, dy]) => { g.beginPath(); g.arc(x + dx, 520 + dy, 5, 0, TAU); g.fill(); }); }
    [150, w - 150, 520, w - 520].forEach(x => { for (let y = (x === 150 || x === w - 150 ? 420 : 540); y < 880; y += 54) { g.beginPath(); horseshoe(g, x, y + 30, 14, y); g.fill(); } });
    for (let x = 90; x < w - 90; x += 30) { if (Math.abs(x - cx) < 240) continue; g.beginPath(); horseshoe(g, x, 950, 14, 924); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    // lattice back into the big arches + hanging lanterns
    arches.forEach(([x, wd, tp], i) => {
      lattice(g, () => horseshoe(g, x, 900, wd, tp), x - wd, tp, x + wd, 900, i === 1 ? 26 : 22);
      g.lineWidth = 2; g.beginPath(); g.moveTo(x, tp); g.lineTo(x, tp + 70); g.stroke();
      g.beginPath(); g.moveTo(x - 14, tp + 70); g.lineTo(x + 14, tp + 70); g.lineTo(x + 8, tp + 104); g.lineTo(x - 8, tp + 104); g.closePath(); g.fill();
    });
    return cv;
  }
  // tapered capsule between two joints
  function limb(g, ax, ay, bx, by, wa, wb) {
    const a = Math.atan2(by - ay, bx - ax), n = a + PI / 2;
    g.beginPath();
    g.moveTo(ax + Math.cos(n) * wa / 2, ay + Math.sin(n) * wa / 2);
    g.lineTo(bx + Math.cos(n) * wb / 2, by + Math.sin(n) * wb / 2);
    g.arc(bx, by, wb / 2, n, n + PI, true);
    g.lineTo(ax - Math.cos(n) * wa / 2, ay - Math.sin(n) * wa / 2);
    g.arc(ax, ay, wa / 2, n + PI, n, true);
    g.fill();
  }
  const jnt = (x, y, a, L) => [x + Math.sin(a) * L, y + Math.cos(a) * L];
  // the prince: jointed card puppet in profile, origin at hip
  function prince(g, x, y, s, P, ph) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = g.strokeStyle = SIL; g.lineCap = 'round'; g.lineJoin = 'round';
    const legs = (t, k) => {
      const kn = jnt(0, 0, t, 92), an = jnt(kn[0], kn[1], t - k, 90);
      limb(g, 0, 0, kn[0], kn[1], 26, 15); limb(g, kn[0], kn[1], an[0], an[1], 15, 9);
      g.save(); g.translate(an[0], an[1]); g.rotate(-(t - k) * 0.5);
      g.beginPath(); g.moveTo(-10, -6); g.lineTo(-12, 10); g.lineTo(34, 12); g.quadraticCurveTo(50, 10, 48, -6); g.quadraticCurveTo(44, 2, 38, 2); g.lineTo(6, -4); g.closePath(); g.fill();
      g.beginPath(); g.arc(46, -8, 4, 0, TAU); g.fill();
      g.restore();
    };
    const arm = (a, e, sx, sy) => {
      const el = jnt(sx, sy, a, 68), hd = jnt(el[0], el[1], a + e, 62);
      limb(g, sx, sy, el[0], el[1], 15, 11); limb(g, el[0], el[1], hd[0], hd[1], 11, 7);
      g.save(); g.translate(hd[0], hd[1]); g.rotate(-(a + e));
      g.beginPath(); g.ellipse(0, 9, 6, 10, 0, 0, TAU); g.fill();
      for (let i = 0; i < 3; i++) { g.lineWidth = 3; g.beginPath(); g.moveTo(-2 + i * 3, 14); g.lineTo(-4 + i * 4 + (P.open || 0) * (i - 1) * 6, 30); g.stroke(); }
      g.restore();
    };
    // cape (in flight)
    if (P.cape) {
      g.save(); g.rotate(P.lean || 0);
      g.beginPath(); g.moveTo(-10, -140); g.lineTo(6, -136);
      const N = 8, L = 190 * P.cape;
      const pts = [];
      for (let i = 0; i <= N; i++) { const u = i / N; pts.push([-10 - u * L, -120 + u * 30 + Math.sin(u * 7 - ph * 9) * 16 * u]); }
      for (let i = 0; i <= N; i++) g.lineTo(pts[i][0], pts[i][1] - 26 * (1 - i / N) - 8);
      for (let i = N; i >= 0; i--) g.lineTo(pts[i][0] + 6, pts[i][1] + 26 + Math.sin(i * 1.7 + ph * 7) * 8);
      g.closePath(); g.fill();
      g.restore();
    }
    legs(P.tB, P.kB);
    g.save(); g.rotate(P.lean || 0);
    arm(P.aB, P.eB, 0, -130);
    // torso
    g.beginPath(); g.moveTo(-16, 4); g.lineTo(-20, -60); g.quadraticCurveTo(-26, -122, -12, -142); g.lineTo(-6, -152); g.lineTo(8, -152);
    g.quadraticCurveTo(28, -134, 25, -110); g.quadraticCurveTo(18, -60, 14, -30); g.lineTo(16, 4); g.closePath(); g.fill();
    g.fillRect(-6, -170, 14, 22);
    // sash tails
    const sw = Math.sin(ph * 5) * 8;
    g.lineWidth = 6; g.beginPath(); g.moveTo(-16, -34); g.quadraticCurveTo(-40, -10 + sw, -50, 26 + sw); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.moveTo(-16, -30); g.quadraticCurveTo(-30, 0 - sw, -34, 34 - sw); g.stroke();
    g.beginPath(); g.ellipse(-52, 28 + sw, 5, 8, 0.3, 0, TAU); g.fill();
    // coat skirt
    if (!P.seated) {
      g.save(); g.rotate((P.tF + P.tB) * 0.18);
      g.beginPath(); g.moveTo(-22, -36); g.lineTo(18, -36); g.lineTo(40, 66);
      for (let i = 0; i <= 6; i++) { const x = 40 - i * 13.5; g.arc(x - 6.75, 66, 6.75, 0, PI, false); }
      g.lineTo(-46, 62); g.closePath(); g.fill();
      g.restore();
    } else {
      g.beginPath(); g.moveTo(-22, -36); g.lineTo(18, -36); g.lineTo(60, 20); g.lineTo(-30, 30); g.closePath(); g.fill();
    }
    // head in profile, turban and plume
    g.save(); g.translate(4, -186); g.rotate(P.head || 0);
    g.beginPath(); g.moveTo(-8, 24); g.lineTo(10, 24); g.lineTo(18, 16); g.lineTo(23, 10); g.lineTo(21, 7); g.lineTo(25, 3); g.lineTo(23, 0); g.lineTo(31, -6);
    g.lineTo(22, -12); g.lineTo(22, -24); g.lineTo(-20, -24); g.quadraticCurveTo(-28, -2, -16, 14); g.closePath(); g.fill();
    g.beginPath(); g.ellipse(-2, -32, 34, 22, -0.15, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(-4, -50, 20, 14, -0.2, 0, TAU); g.fill();
    g.beginPath(); g.arc(-6, -64, 6, 0, TAU); g.fill();
    // plume
    const pw = Math.sin(ph * 4) * 0.12;
    g.lineWidth = 3; g.beginPath(); g.moveTo(16, -40); g.bezierCurveTo(30, -80, 10 + pw * 80, -110, -20 + pw * 60, -118); g.stroke();
    for (let i = 1; i < 9; i++) { const u = i / 9, bx = lerp(16, -20 + pw * 60, u) + Math.sin(u * PI) * 22, by = lerp(-40, -118, u); leaf(g, bx, by, -0.9 + u * -1.2, 14 - u * 5); leaf(g, bx, by, 0.9 - u * 0.6, 12 - u * 4); }
    g.restore();
    arm(P.aF, P.eF, 6, -128);
    g.restore();
    legs(P.tF, P.kF);
    // cut-outs: eye, coat lace, belt jewels
    g.globalCompositeOperation = 'destination-out';
    g.save(); g.rotate(P.lean || 0);
    g.save(); g.translate(4, -186); g.rotate(P.head || 0);
    g.beginPath(); g.moveTo(9, -9); g.quadraticCurveTo(14, -13, 19, -9); g.quadraticCurveTo(14, -6, 9, -9); g.fill();
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(-26 + i * 11, -30 + Math.abs(i - 2) * 2, 3, 0, TAU); g.fill(); }
    g.beginPath(); g.moveTo(8, -46); g.lineTo(12, -38); g.lineTo(8, -30); g.lineTo(4, -38); g.closePath(); g.fill();
    g.restore();
    for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-12 + i * 8, -31, 2.4, 0, TAU); g.fill(); }
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(0, -120 + i * 18); g.lineTo(4, -114 + i * 18); g.lineTo(0, -108 + i * 18); g.lineTo(-4, -114 + i * 18); g.closePath(); g.fill(); }
    if (!P.seated) {
      g.rotate((P.tF + P.tB) * 0.18);
      for (let i = 0; i < 6; i++) { const xx = -36 + i * 13; g.beginPath(); g.arc(xx, 50, 3.4, 0, TAU); g.fill(); g.beginPath(); g.moveTo(xx + 6, 34); g.lineTo(xx + 9, 40); g.lineTo(xx + 6, 46); g.lineTo(xx + 3, 40); g.closePath(); g.fill(); }
    }
    g.restore();
    g.globalCompositeOperation = 'source-over';
    g.restore();
  }
  function wing(g, hx, hy, ang, fold, ph) {
    g.save(); g.translate(hx, hy); g.rotate(ang); g.scale(1, fold);
    const bez = u => [lerp(lerp(0, -10, u), lerp(-10, -290, u), u), lerp(lerp(0, -210, u), lerp(-210, -250, u), u)];
    const N = 13, F = [];
    for (let i = 0; i < N; i++) {
      const u = i / (N - 1), [bx, by] = bez(0.08 + u * 0.92), a = lerp(-2.45, -1.62, u), L = lerp(80, 210, Math.pow(u, 0.7));
      F.push([bx, by, a, L]);
    }
    // wing membrane between the leading edge and the feather roots
    g.beginPath(); g.moveTo(0, 0);
    for (let i = 0; i <= 20; i++) { const [x, y] = bez(i / 20); g.lineTo(x, y); }
    for (let i = N - 1; i >= 0; i--) { const [bx, by, a, L] = F[i]; g.lineTo(bx + Math.sin(a) * L * 0.35, by - Math.cos(a) * L * 0.35); }
    g.closePath(); g.fill();
    F.forEach(([bx, by, a, L]) => {
      g.save(); g.translate(bx, by); g.rotate(a - PI / 2);
      g.beginPath(); g.moveTo(0, -11); g.quadraticCurveTo(L * 0.55, -15, L, 0); g.quadraticCurveTo(L * 0.6, 13, 0, 11); g.fill();
      g.restore();
    });
    // scalloped coverts along the leading edge
    for (let i = 0; i < 9; i++) { const [x, y] = bez(0.1 + i / 9 * 0.8); g.beginPath(); g.arc(x - 6, y + 22, 20 - i * 0.8, 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'destination-out';
    F.forEach(([bx, by, a, L], i) => {
      for (let k = 1; k < 4; k++) { const d = L * (0.35 + k * 0.16); g.beginPath(); g.arc(bx + Math.sin(a) * d, by - Math.cos(a) * d, 3.4 - k * 0.5, 0, TAU); g.fill(); }
    });
    for (let i = 0; i < 9; i++) { const [x, y] = bez(0.12 + i / 9 * 0.8); g.beginPath(); g.arc(x - 4, y + 26, 5, 0, TAU); g.fill(); }
    for (let i = 0; i < 6; i++) { const [x, y] = bez(0.2 + i * 0.12); g.beginPath(); g.moveTo(x - 8, y + 50); g.lineTo(x - 3, y + 58); g.lineTo(x - 8, y + 66); g.lineTo(x - 13, y + 58); g.closePath(); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    g.restore();
  }
  // the winged horse, origin at body centre, facing right
  function horse(g, x, y, s, P, ph) {
    g.save(); g.translate(x, y); g.scale(s, s); g.rotate(P.pitch || 0);
    g.fillStyle = g.strokeStyle = SIL; g.lineCap = 'round'; g.lineJoin = 'round';
    // far wing
    wing(g, 56, -88, P.wing * 0.9 + 0.12, 0.85, ph);
    // legs: [upper, lower] for far-front, far-back drawn first, then near
    const leg = (hx, hy, a, b, front) => {
      const kn = jnt(hx, hy, a, front ? 78 : 82), hf = jnt(kn[0], kn[1], a + b, 74);
      limb(g, hx, hy, kn[0], kn[1], front ? 30 : 40, 14); limb(g, kn[0], kn[1], hf[0], hf[1], 12, 10);
      g.save(); g.translate(hf[0], hf[1]); g.rotate(-(a + b));
      g.beginPath(); g.moveTo(-8, -4); g.lineTo(10, -4); g.lineTo(13, 12); g.lineTo(-9, 12); g.closePath(); g.fill();
      g.restore();
    };
    const L = P.legs;
    leg(100, 4, L[0] + 0.25, L[1], true); leg(-112, 0, L[2] - 0.2, L[3], false);
    // body & neck & head
    g.beginPath();
    g.moveTo(122, -20);
    g.bezierCurveTo(132, 30, 60, 40, 0, 38);
    g.bezierCurveTo(-60, 40, -120, 34, -142, 2);
    g.bezierCurveTo(-166, -30, -160, -72, -120, -80);
    g.bezierCurveTo(-60, -86, 20, -72, 58, -82);
    g.bezierCurveTo(90, -112, 112, -172, 150, -206);
    g.lineTo(146, -236); g.lineTo(163, -212);
    g.bezierCurveTo(186, -202, 214, -172, 236, -142);
    g.lineTo(240, -128);
    g.bezierCurveTo(232, -116, 216, -118, 200, -122);
    g.bezierCurveTo(186, -126, 176, -140, 166, -150);
    g.bezierCurveTo(150, -120, 142, -60, 122, -20);
    g.closePath(); g.fill();
    // mane curls along the crest
    for (let i = 0; i < 8; i++) {
      const u = i / 7, mx = lerp(66, 150, u), my = lerp(-90, -204, u) + Math.sin(u * PI) * -14;
      curl(g, mx, my, -1.6 - u * 0.5 + Math.sin(ph * 6 + i) * 0.15, 7 - u * 2, -1, 70 - u * 20);
    }
    // forelock
    curl(g, 150, -206, -0.2, 4, 1, 40);
    // tail
    for (let k = 0; k < 4; k++) {
      let px = -150, py = -50 + k * 6, a = -1.9 + k * 0.18;
      for (let i = 0; i < 16; i++) { a += 0.04 * Math.sin(ph * 6 + i * 0.5 + k) - 0.012; const nx = px + Math.sin(a) * 14, ny = py - Math.cos(a) * 14; g.lineWidth = 14 - i * 0.7 - k * 2; g.beginPath(); g.moveTo(px, py); g.lineTo(nx, ny); g.stroke(); px = nx; py = ny; }
      curl(g, px, py, a, 4, k % 2 ? 1 : -1, 46);
    }
    leg(84, 6, L[0], L[1], true); leg(-126, 4, L[2], L[3], false);
    // saddle cloth with tassels
    g.beginPath(); g.moveTo(-40, -76); g.lineTo(50, -80); g.lineTo(44, -10); g.lineTo(-34, -10); g.closePath(); g.fill();
    for (let i = 0; i < 6; i++) { g.lineWidth = 2; g.beginPath(); g.moveTo(-30 + i * 14, -10); g.lineTo(-30 + i * 14, 6); g.stroke(); g.beginPath(); g.arc(-30 + i * 14, 8, 3, 0, TAU); g.fill(); }
    // cut-outs on horse body
    g.globalCompositeOperation = 'destination-out';
    g.beginPath(); g.moveTo(186, -182); g.quadraticCurveTo(194, -188, 202, -181); g.quadraticCurveTo(194, -177, 186, -182); g.fill();
    g.beginPath(); g.arc(230, -134, 3, 0, TAU); g.fill();
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(-28 + i * 17, -44, 5, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-20 + i * 17, -66); g.lineTo(-16 + i * 17, -58); g.lineTo(-20 + i * 17, -50); g.lineTo(-24 + i * 17, -58); g.closePath(); g.fill(); }
    for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(108 + i * 10, -112 - i * 13, 2.6, 0, TAU); g.fill(); }
    g.globalCompositeOperation = 'source-over';
    // near wing over everything
    wing(g, 36, -78, P.wing, 1, ph);
    g.restore();
  }
  function bird(g, x, y, s, f) {
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = SIL;
    const up = Math.sin(f) * 26;
    g.beginPath(); g.ellipse(0, 0, 20, 7, -0.1, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(18, -3); g.lineTo(32, -6); g.lineTo(20, 2); g.fill();
    g.beginPath(); g.moveTo(-18, 0); g.lineTo(-36, -8); g.lineTo(-32, 4); g.fill();
    [-1, 1].forEach(k => { g.beginPath(); g.moveTo(-8, -2); g.quadraticCurveTo(-4, -20 - up * k * 0.4, -30, -up - 10); g.quadraticCurveTo(0, -10 - up * 0.3, 10, -2); g.fill(); });
    g.restore();
  }

  function silBG(c, W, H, T, horizon, glowX = W / 2) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, rgb(T.top)); g.addColorStop(horizon / H * 0.85, rgb(T.mid)); g.addColorStop(horizon / H, rgb(T.glow)); g.addColorStop(1, rgb(T.mid));
    c.fillStyle = g; c.fillRect(-60, -60, W + 120, H + 120);
    const r = c.createRadialGradient(glowX, horizon, 20, glowX, horizon, 900);
    r.addColorStop(0, rgb(T.glow, 0.85)); r.addColorStop(0.4, rgb(T.glow, 0.25)); r.addColorStop(1, rgb(T.glow, 0));
    c.fillStyle = r; c.fillRect(-60, -60, W + 120, H + 120);
  }
  // choreography (stop-motion: puppets on twos at 12 fps)
  const SG = 900;
  function princeWalk(tq) {
    const P = { tF: 0, kF: 0, tB: 0, kB: 0, aF: 0.1, eF: 0.3, aB: -0.1, eB: 0.2, lean: 0, head: 0 };
    let x = 0, hipY = SG - 182;
    if (tq < 2.15) {
      const p = clamp(tq - 0.15, 0, 2) / 0.5 * PI;
      const sn = Math.sin(p);
      P.tF = 0.42 * sn; P.tB = -0.42 * sn; P.kF = Math.max(0, -Math.sin(p - 0.6)) * 0.7; P.kB = Math.max(0, Math.sin(p - 0.6)) * 0.7;
      P.aF = -0.35 * sn; P.aB = 0.35 * sn; P.eF = 0.35; P.eB = 0.35;
      hipY -= Math.abs(Math.cos(p)) * 6;
      x = lerp(-120, 760, clamp((tq - 0.15) / 2.0));
      P.lean = 0.04;
    } else {
      x = 760;
      const look = E.outB(seg(tq, 2.3, 2.6));
      P.head = -0.35 * look; P.lean = -0.08 * look;
      P.aF = lerp(0.1, 2.5, look); P.eF = lerp(0.3, -0.2, look); P.open = look;
      P.aB = lerp(-0.1, -0.5, look);
      if (tq > 3.0) { const crouch = E.ioS(seg(tq, 3.05, 3.3)); P.tF = 0.5 * crouch; P.kF = 1.1 * crouch; P.tB = 0.3 * crouch; P.kB = 1.0 * crouch; hipY += 40 * crouch; P.aF = lerp(2.5, -0.6, crouch); P.aB = -0.8 * crouch; }
    }
    return { x, hipY, P };
  }
  const flap = (t, per = 0.62) => Math.sin(TAU * t / per);
  function horseState(tq) {
    // returns position, scale and pose; null before it arrives
    const fl = flap(tq);
    const flyLegs = [-1.3, 1.9, 1.15, 0.5];
    if (tq < 2.3) return null;
    if (tq < 3.3) {
      const u = seg(tq, 2.3, 3.25), k = E.outC(u);
      const st = seg(tq, 2.95, 3.25);
      return { x: lerp(1900, 1230, k), y: lerp(-120, SG - 170, k), s: 1, P: { wing: fl * 0.55 * (1 - st * 0.6), legs: flyLegs.map((v, i) => lerp(v, [0.15, -0.1, -0.1, 0.1][i], E.ioS(st))), pitch: lerp(0.18, 0, k) } };
    }
    if (tq < 3.75) return { x: 1230, y: SG - 170, s: 1, P: { wing: -0.55 + Math.sin(tq * 9) * 0.04, legs: [0.15, -0.1, -0.1, 0.1], pitch: 0 } };
    if (tq < 6.6) {
      const u = E.ioC(seg(tq, 3.75, 4.6));
      const bob = Math.sin(tq * 2.4) * 20 * seg(tq, 4.4, 5);
      return { x: lerp(1230, 900, u) + Math.sin(tq * 1.3) * 30 * seg(tq, 4.4, 5), y: lerp(SG - 170, 500, u) + bob, s: 1, P: { wing: fl * 0.6, legs: [0.15, -0.1, -0.1, 0.1].map((v, i) => lerp(v, flyLegs[i], E.ioS(seg(tq, 3.75, 4.0)))), pitch: -0.12 * Math.sin(seg(tq, 3.75, 4.6) * PI) + Math.cos(tq * 2.4) * 0.03 } };
    }
    const u = seg(tq, 6.6, 8.6), k = E.ioS(u);
    return { x: lerp(900 + Math.sin(6.6 * 1.3) * 30, 1430, k), y: lerp(500 + Math.sin(6.6 * 2.4) * 20, 250, k) - Math.sin(u * PI) * 90, s: lerp(1, 0.3, E.outQ(u)), P: { wing: fl * 0.6, legs: flyLegs, pitch: -0.05 } };
  }
  function drawSilScene(c, L, t, tq, W, H, st) {
    const pan = E.ioC(seg(t, 3.7, 4.5));
    const flightK = seg(t, 3.7, 4.5);
    // tint
    let T = TINTS.amber;
    if (t >= 3.5) T = mixT(TINTS.amber, TINTS.teal, E.ioS(seg(t, 3.6, 4.5)));
    if (t >= 6.4) T = mixT(TINTS.teal, TINTS.rose, E.ioS(seg(t, 6.4, 7.1)));
    const horizon = lerp(820, 900, pan);
    silBG(c, W, H, T, horizon, t < 6.4 ? W * 0.55 : W / 2);
    const lg = L.getContext('2d');
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, W, H);
    const ph = tq;
    // ---------- night sky (scene 2/3), panned in from above
    const skyOff = (pan - 1) * 1100;
    if (t >= 3.6) {
      c.save(); c.translate(0, skyOff);
      // moon & pinhole stars
      const mx = 1480, my = 230;
      const mg = c.createRadialGradient(mx, my, 40, mx, my, 360); mg.addColorStop(0, rgb(T.glow, 0.7)); mg.addColorStop(1, rgb(T.glow, 0));
      c.fillStyle = mg; c.fillRect(mx - 360, my - 360, 720, 720);
      c.beginPath(); c.arc(mx, my, 96, 0, TAU); c.fillStyle = rgb([255, 250, 232], 0.95 - seg(t, 6.6, 7.6) * 0.6); c.fill();
      c.beginPath(); c.arc(mx + 38, my - 20, 84, 0, TAU); c.fillStyle = rgb(T.top, 0.0 + 0.9 * (1 - seg(t, 6.6, 7.6))); c.fill();
      const sr = rng(5);
      for (let i = 0; i < 90; i++) {
        const x = sr() * W, y = sr() * 640, tw = 0.5 + 0.5 * Math.sin(t * 5 + i * 1.7), rr = 1 + sr() * 2.4;
        c.fillStyle = `rgba(255,252,236,${(0.3 + 0.7 * tw) * (1 - seg(t, 6.8, 7.8) * 0.7)})`; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill();
      }
      // cloud layers (translucent cut paper for depth)
      const scroll = Math.max(0, tq - 3.9);
      [[0.32, 60, 0.35, 0], [0.55, 140, 0.6, 1], [1, 320, 0.72, 2]].forEach(([al, sp, sc, i]) => {
        const cl = st.clouds[i], w = cl.width * sc;
        const y = [170, 330, 690][i];
        c.globalAlpha = al * (1 - seg(t, 6.3, 7.0)); lg.globalAlpha = 1 - seg(t, 6.3, 7.0);
        for (let k = -1; k < 3; k++) {
          const x = ((k * (w + 380) - scroll * sp) % ((w + 380) * 3)) + (w + 380) * 2 - 200 - (i * 300);
          const xx = ((x % ((w + 380) * 3)) + (w + 380) * 3) % ((w + 380) * 3) - (w + 380);
          if (i === 2) lg.drawImage(cl, xx, y + skyOff, w, cl.height * sc); else c.drawImage(cl, xx, y, w, cl.height * sc);
        }
        c.globalAlpha = 1; lg.globalAlpha = 1;
      });
      // far land scrolling
      const fl = st.far, fw = fl.width, off = (scroll * 220) % fw;
      c.globalAlpha = 0.55;
      for (let k = 0; k < 3; k++) c.drawImage(fl, k * fw - off, 1080 - fl.height + 40);
      c.globalAlpha = 1;
      c.restore();
    }
    // ---------- garden (scene 1), panned down and away
    if (t < 4.5) {
      const gOff = pan * 1100;
      c.save(); c.translate(0, gOff);
      // translucent far layer: hills & a distant pavilion
      c.globalAlpha = 0.4; c.drawImage(st.farGarden, 0, 0); c.globalAlpha = 1;
      c.restore();
      lg.save(); lg.translate(0, gOff);
      lg.drawImage(st.garden, 0, 0);
      // tree sway: stop-motion nudge of the hanging vines
      lg.restore();
      const pw = princeWalk(tq);
      if (tq < 3.35) prince(lg, pw.x, pw.hipY + gOff, 1, pw.P, ph);
      lg.save(); lg.translate(0, gOff);
      lg.drawImage(st.ground, 0, 0);
      lg.restore();
    }
    // ---------- palace (scene 3)
    if (t >= 6.4) {
      const u = E.outC(seg(t, 6.5, 7.9)), s = lerp(0.7, 0.98, E.ioS(seg(t, 6.5, 8.8)));
      const pl = st.palace, pw2 = pl.width * s, ph2 = pl.height * s;
      const y = lerp(1300, 1060, u) - ph2;
      // glow behind the arches
      const gg = c.createRadialGradient(W / 2, y + ph2 * 0.75, 20, W / 2, y + ph2 * 0.75, 700);
      gg.addColorStop(0, rgb(T.glow, 0.9 * u)); gg.addColorStop(1, rgb(T.glow, 0));
      c.fillStyle = gg; c.fillRect(0, 0, W, H);
      lg.drawImage(pl, W / 2 - pw2 / 2, y, pw2, ph2);
      // twinkling lanterns & sparkles
      const sr = rng(77);
      for (let i = 0; i < 26; i++) {
        const x = W / 2 + (sr() - 0.5) * pw2 * 0.95, yy = y + sr() * ph2 * 0.8, tw = Math.max(0, Math.sin(t * 6 + i * 2.1));
        c.fillStyle = rgb([255, 250, 230], tw * 0.8 * u);
        c.beginPath(); c.moveTo(x, yy - 10 * tw); c.lineTo(x + 2.5, yy); c.lineTo(x, yy + 10 * tw); c.lineTo(x - 2.5, yy); c.closePath(); c.fill();
        c.beginPath(); c.moveTo(x - 10 * tw, yy); c.lineTo(x, yy + 2.5); c.lineTo(x + 10 * tw, yy); c.lineTo(x, yy - 2.5); c.closePath(); c.fill();
      }
      // garden foreground framing the palace
      lg.drawImage(st.ground2, 0, 1080 - st.ground2.height + lerp(260, 0, u));
    }
    // ---------- winged horse & rider
    const hs = horseState(tq);
    if (hs) {
      const pw = princeWalk(tq);
      // rider: leap from the ground onto the saddle
      let rider = null;
      if (tq >= 3.35) {
        const lp = seg(tq, 3.35, 3.7), seatX = hs.x + (-6) * hs.s, seatY = hs.y - 80 * hs.s;
        const sP = { tF: 1.35, kF: 1.55, tB: 1.2, kB: 1.5, aF: 0.9, eF: -0.6, aB: 0.6, eB: -0.3, lean: -0.05, head: -0.05, seated: true, cape: t > 3.7 ? clamp((t - 3.7) * 2) : 0 };
        if (lp < 1) {
          const k = E.ioS(lp);
          rider = { x: lerp(pw.x, seatX, k), y: lerp(pw.hipY + pan * 1100, seatY, k) - Math.sin(lp * PI) * 230, s: 1, P: { tF: -0.4, kF: 0.4, tB: 0.6, kB: 1.6, aF: 2.6, eF: 0, aB: -1.2, eB: 0, lean: 0.2, head: -0.2 } };
        } else rider = { x: seatX, y: seatY, s: hs.s, P: { ...sP, aF: tq > 4.6 && tq < 6.6 ? 2.2 + Math.sin(tq * 3) * 0.2 : sP.aF, eF: tq > 4.6 && tq < 6.6 ? -0.1 : sP.eF } };
      }
      if (rider && tq >= 3.7) prince(lg, rider.x, rider.y, rider.s, rider.P, ph);
      horse(lg, hs.x, hs.y, hs.s, hs.P, ph);
      if (rider && tq < 3.7) prince(lg, rider.x, rider.y, rider.s, rider.P, ph);
    }
    // ---------- a flock crosses the moon
    if (t > 4.6 && t < 6.6) {
      const u = (tq - 4.6) / 2;
      for (let i = 0; i < 9; i++) {
        const x = lerp(2100, -300, u) + (i % 3) * 90 + Math.floor(i / 3) * 140, y = 260 + Math.sin(i * 2.3) * 70 + (i % 3) * 40 + Math.sin(tq * 3 + i) * 10;
        bird(lg, x, y, 0.9 + (i % 2) * 0.3, tq * 14 + i);
      }
    }
    // corner filigree on every frame — the paper theatre
    const co = st.corner, cs = co.width;
    lg.drawImage(co, 0, 0);
    lg.save(); lg.translate(W, 0); lg.scale(-1, 1); lg.drawImage(co, 0, 0); lg.restore();
    lg.save(); lg.translate(0, H); lg.scale(1, -1); lg.drawImage(co, 0, 0); lg.restore();
    lg.save(); lg.translate(W, H); lg.scale(-1, -1); lg.drawImage(co, 0, 0); lg.restore();
    void cs;
    c.drawImage(L, 0, 0, W, H);
  }
  function silTitle(c, t, W, H) {
    c.fillStyle = '#0a0604'; c.fillRect(-40, -40, W + 80, H + 80);
    const gl = c.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 900);
    gl.addColorStop(0, 'rgba(92,46,14,0.55)'); gl.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gl; c.fillRect(0, 0, W, H);
    const C = '#f1c98a', C2 = 'rgba(241,201,138,0.6)';
    c.strokeStyle = C; c.fillStyle = C; c.lineCap = 'round';
    c.lineWidth = 3; c.strokeRect(150, 120, W - 300, H - 240);
    c.lineWidth = 1.5; c.strokeRect(168, 138, W - 336, H - 276);
    [[168, 138, 1, 1], [W - 168, 138, -1, 1], [168, H - 138, 1, -1], [W - 168, H - 138, -1, -1]].forEach(([x, y, sx, sy]) => {
      c.save(); c.translate(x, y); c.scale(sx, sy);
      c.strokeStyle = C; c.fillStyle = C;
      curl(c, 20, 20, 2.3, 4, 1, 110);
      leaf(c, 18, 18, 2.35, 34);
      c.restore();
    });
    text(c, 'THE ADVENTURES OF A PAPER PRINCE', W / 2, 330, { font: '"IM Fell English SC", serif', size: 40, ls: 8, align: 'center', color: C2 });
    text(c, 'Silhouette', W / 2, 560, { font: '"Cinzel Decorative", serif', weight: 900, size: 190, align: 'center', color: C });
    // ornament rule
    c.strokeStyle = C; c.lineWidth = 2;
    c.beginPath(); c.moveTo(W / 2 - 420, 640); c.lineTo(W / 2 - 40, 640); c.moveTo(W / 2 + 40, 640); c.lineTo(W / 2 + 420, 640); c.stroke();
    c.save(); c.translate(W / 2, 640); c.rotate(PI / 4); c.fillRect(-12, -12, 24, 24); c.restore();
    c.fillStyle = C;
    c.beginPath(); c.arc(W / 2 - 440, 640, 6, 0, TAU); c.fill(); c.beginPath(); c.arc(W / 2 + 440, 640, 6, 0, TAU); c.fill();
    text(c, 'cut from black card, lit from below — after Lotte Reiniger, 1926', W / 2, 740, { font: '"IM Fell English", serif', style: 'italic', size: 46, align: 'center', color: C });
    text(c, 'A MOTION STYLE ATLAS FILM', W / 2, 850, { font: '"IM Fell English SC", serif', size: 30, ls: 10, align: 'center', color: C2 });
  }

  MG.film({
    id: 'silhouette',
    dur: 10,
    poster: 8.3,
    fonts: [['900 190px "Cinzel Decorative"', 'Silhouette'], ['400 40px "IM Fell English SC"', 'THE ADVENTURES OF A PAPER PRINCE MOTION STYLE ATLAS FILM'], ['italic 400 46px "IM Fell English"', 'cut from black card, lit below — after Lotte Reiniger, 1926']],
    meta: {
      family: 'C', name: 'Silhouette Animation', sub: 'Paper-cut Shadow Puppetry', era: '1919 —',
      origin: 'Jointed figures cut from black card and lead are laid on a lit glass table and moved a fraction per frame, so the picture is pure silhouette against tinted light. Lotte Reiniger perfected it in The Adventures of Prince Achmed, the oldest surviving animated feature.',
      works: 'The Adventures of Prince Achmed (Lotte Reiniger, 1926) · Papageno (Reiniger, 1935) · Hansel and Gretel (Reiniger, 1955) · Princes et Princesses (Michel Ocelot, 2000) · Tales of the Night (Ocelot, 2011)',
      tech: ['Hinged card puppets on twos', 'Tinted backlit glass', 'Lace cut-outs & filigree'],
      accent: '#e39a3c',
      motionDNA: 'Stepped stop-motion of jointed card puppets: limbs pivot on hidden hinges, walk cycles click from pose to pose, wings flap in rigid sections.',
      visualDNA: 'Pure black filigree silhouettes, intricate as lace, against luminous gradients tinted amber, teal and rose like nitrate-era prints.',
      transitions: 'Tint change, vertical pan, dip to black, intertitle',
      implementation: ['Multiplane light table', 'Dragonframe', 'Canvas 2D'],
      reproducibility: 'Needs hand-cut puppets (this film is a procedural homage)',
      loopable: false,
    },
    setup() {
      const W = 1920, H = 1080;
      const garden = offscreen(W, H), g = garden.getContext('2d');
      filTree(g, 230, SG + 30, 41, 1.25, 4);
      filTree(g, 1700, SG + 30, 57, 1.05, 4);
      filTree(g, 1460, SG + 40, 23, 0.55, 3);
      const farGarden = offscreen(W, H), fg = farGarden.getContext('2d');
      fg.fillStyle = SIL;
      fg.beginPath(); fg.moveTo(0, 860); fg.bezierCurveTo(400, 720, 800, 760, 1100, 800); fg.bezierCurveTo(1400, 760, 1700, 700, 1920, 760); fg.lineTo(1920, 1080); fg.lineTo(0, 1080); fg.fill();
      filTree(fg, 560, 800, 91, 0.5, 3); filTree(fg, 1060, 800, 13, 0.42, 3);
      fg.fillRect(1250, 640, 120, 140); fg.beginPath(); onion(fg, 1310, 644, 140, 150); fg.fill(); spire(fg, 1310, 494, 50);
      const ground = offscreen(W, H), gg = ground.getContext('2d'); groundStrip(gg, W, SG, 7);
      const ground2 = offscreen(W, 300), g2 = ground2.getContext('2d'); groundStrip(g2, W, 160, 19);
      filTree(g2, 120, 200, 63, 0.6, 3); filTree(g2, 1800, 200, 71, 0.6, 3);
      return {
        L: offscreen(W, H), garden, farGarden, ground, ground2,
        clouds: [lacyCloud(3, 900, 260), lacyCloud(9, 1000, 300), lacyCloud(15, 1200, 360)],
        far: farLand(33, 2400, 360), palace: palace(), corner: cornerOrn(1),
      };
    },
    draw(c, t, W, H, st) {
      const tq = Math.floor(t * 12) / 12, f = fr24(t);
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      c.save();
      c.translate(W / 2 + vnoise(f * 0.31, 4) * 2.4, H / 2 + vnoise(f * 0.29, 5) * 3);
      c.scale(1.01, 1.01); c.translate(-W / 2, -H / 2);
      if (t < 8.95) {
        drawSilScene(c, st.L, t, tq, W, H, st);
        // exposure breathing of the light table
        c.fillStyle = `rgba(255,240,210,${0.04 * (hash(f * 2.1) - 0.5)})`; c.fillRect(0, 0, W, H);
        const fade = Math.max(seg(t, 8.6, 8.95), 1 - seg(t, 0, 0.45));
        if (fade > 0) { c.fillStyle = `rgba(0,0,0,${fade})`; c.fillRect(-40, -40, W + 80, H + 80); }
      } else {
        silTitle(c, t, W, H);
        const a = 1 - seg(t, 8.95, 9.3);
        if (a > 0) { c.fillStyle = `rgba(0,0,0,${a})`; c.fillRect(-40, -40, W + 80, H + 80); }
      }
      c.restore();
      filmFX(c, t, W, H, { grain: 0.2, vig: 0.62, flicker: 0.06 });
    },
    score(A) {
      // E Phrygian-dominant colour: E F G# A B C D
      const S = [40, 41, 44, 45, 47, 48, 50];
      const deg = (d, o = 0) => S[((d % 7) + 7) % 7] + 12 * (Math.floor(d / 7) + o);
      const harp = (t, m, g = 0.13, pan = 0) => A.pluck(t, midi(m), { dur: 2.2, bright: 0.55, decay: 0.997, g: g * 1.7, pan, rev: 0.45 });
      const pizz = (t, m, g = 0.16) => A.pluck(t, midi(m), { dur: 0.5, bright: 0.35, decay: 0.985, g: g * 1.6, lp: 1800, rev: 0.25 });
      const strings = (t, ns, d, g0 = 0.035, a = 0.6) => ns.forEach((m, i) => { const g = g0 * 1.5;
        A.osc(t, { type: 'sawtooth', f: midi(m), dur: d, g, a, lp: 1600, q: 0.7, vib: [5.2, midi(m) * 0.006], hold: true, rel: 0.6, detune: -7, rev: 0.6, pan: (i % 2 ? 0.3 : -0.3) });
        A.osc(t, { type: 'sawtooth', f: midi(m), dur: d, g: g * 0.8, a, lp: 1500, q: 0.7, vib: [4.7, midi(m) * 0.006], hold: true, rel: 0.6, detune: 8, rev: 0.6, pan: (i % 2 ? -0.3 : 0.3) });
      });
      const ney = (t, m, d, g0 = 0.07) => { const g = g0 * 1.5; A.osc(t, { type: 'triangle', f: midi(m), dur: d, g, a: 0.08, vib: [5.5, midi(m) * 0.012], hold: true, rel: 0.2, rev: 0.5, lp: 2600 }); A.noise(t, { type: 'bandpass', f: midi(m) * 2, q: 6, dur: d, g: g * 0.25, a: 0.08, hold: true, rel: 0.2 }); };
      // projector hiss
      A.noise(0, { type: 'bandpass', f: 2400, q: 0.5, dur: 9.95, g: 0.01, hold: true, rel: 0.4 });
      // drone
      strings(0.1, [28, 40, 47], 3.6, 0.03, 1.2);
      // garden: rolling harp, pizzicato footsteps
      for (let i = 0; i < 16; i++) harp(0.2 + i * 0.18, deg([0, 2, 4, 7, 9, 11, 14, 11][i % 8], 1), 0.09, Math.sin(i) * 0.4);
      for (let n = 0; n < 5; n++) pizz(0.15 + n * 0.5, deg([0, 4, 2, 4, 0][n], 0), 0.2);
      // looking up: harp glissando as the horse appears
      for (let i = 0; i < 14; i++) harp(2.3 + i * 0.045, deg(i + 2, 1), 0.08, (i / 14 - 0.5));
      ney(2.6, deg(11, 0), 0.5); ney(3.1, deg(9, 0), 0.25);
      A.noise(3.25, { type: 'lowpass', f: 400, dur: 0.25, g: 0.18 }); pizz(3.25, 28, 0.25);
      // leap & take-off swell
      for (let i = 0; i < 6; i++) pizz(3.35 + i * 0.06, deg(i * 2, 1), 0.12);
      strings(3.6, [40, 47, 52, 56], 3.2, 0.03, 0.8);
      A.noise(3.6, { type: 'highpass', f: 6000, dur: 1.2, g: 0.05, swell: 0.9, rev: 0.6 });
      // wing beats (downstroke at the top of each flap)
      for (let k = 0; k < 16; k++) { const t = 0.155 + k * 0.62; if ((t > 2.3 && t < 3.25) || (t > 3.75 && t < 8.5)) A.whoosh(t, 0.34, { f1: 220, f2: 900, g: 0.09 * (t > 6.6 ? Math.max(0.2, 1 - (t - 6.6) / 2) : 1), q: 0.8, rev: 0.3 }); }
      // flight melody
      const mel = [[4.4, 14, 0.4], [4.8, 13, 0.2], [5.0, 12, 0.2], [5.2, 13, 0.6], [5.8, 11, 0.2], [6.0, 12, 0.2], [6.2, 9, 0.3], [6.5, 11, 0.8]];
      mel.forEach(([t, d, du]) => ney(t, deg(d, 0), du, 0.075));
      for (let i = 0; i < 24; i++) harp(4.4 + i * 0.1, deg([0, 4, 7, 9][i % 4] + (i % 8 < 4 ? 7 : 9), 0), 0.06, (i % 2 ? 0.3 : -0.3));
      strings(5.0, [45, 52, 57, 60], 1.6, 0.025);
      // birds
      for (let i = 0; i < 6; i++) A.osc(5.0 + i * 0.17, { type: 'sine', f: 2600 + (i % 3) * 300, f2: 3600, glide: 0.06, dur: 0.08, g: 0.03, pan: 0.6 - i * 0.2, rev: 0.3 });
      // palace: modulation to a warm major, celesta sparkle
      strings(6.6, [40, 44, 47, 52, 56], 2.4, 0.03, 0.7);
      for (let i = 0; i < 18; i++) harp(6.6 + i * 0.06, [52, 56, 59, 64, 68, 71][i % 6] + (i >= 12 ? 12 : i >= 6 ? 0 : -12), 0.08, (i / 18 - 0.5) * 0.8);
      for (let i = 0; i < 10; i++) A.bell(7.2 + i * 0.16, midi([76, 80, 83, 88][i % 4]), { g: 0.035, dur: 1.2, pan: Math.sin(i * 1.3) * 0.5 });
      ney(7.4, 64, 0.5); ney(7.9, 68, 0.3); ney(8.2, 71, 0.6);
      // intertitle: final roll and a low bell
      for (let i = 0; i < 8; i++) harp(8.95 + i * 0.05, [40, 47, 52, 56, 59, 64, 68, 71][i], 0.1, (i / 8 - 0.5));
      A.bell(9.0, midi(40), { g: 0.08, dur: 1.6 });
      strings(9.0, [40, 47, 52, 56], 1.0, 0.03, 0.2);
    },
  });

  /* ======================================================================
     03  SAKUGA — key-animation action beat: hold, smear, Kanada pose, impact, blast
     ====================================================================== */
  const SK = {
    line: '#1a0f1e', skin: '#f6cfae', skinS: '#d88f78', jak: '#f3f1ea', jakS: '#8f97c4', pant: '#2b3050', pantS: '#161a2e',
    hair: '#1e2236', hairS: '#0d0f1a', hairH: '#4b5c96', scarf: '#e9302c', scarfS: '#97122a', boot: '#3a2a2a', bootS: '#1d1414',
    dark: '#1b1328', rim: '#ffa45a', red: '#e3262f',
  };
  // 2s / 3s alternation (frames held 2,3,2,3 … on a 24 fps grid)
  const step23 = t => { const f = Math.floor(t * 24), q = Math.floor(f / 5) * 5 + (f % 5 < 2 ? 0 : 2); return q / 24; };
  const POSES = {
    crouch: { pel: [0, 0, 0], chest: [10, -44, 0], neck: [14, -54, 0], head: [20, -66, 0], shL: [10, -48, -9], elL: [30, -32, -12], haL: [44, -26, -8], shR: [8, -48, 9], elR: [-10, -34, 12], haR: [-28, -20, 10], blade: [-0.95, 0.3, 0], hipL: [3, 0, -7], knL: [34, -4, -8], ftL: [32, 38, -8], hipR: [-3, 0, 7], knR: [-24, 20, 8], ftR: [-58, 40, 8] },
    dash: { pel: [0, 0, 0], chest: [30, -28, 0], neck: [42, -36, 0], head: [52, -42, 0], shL: [32, -32, -9], elL: [50, -20, -10], haL: [64, -14, -8], shR: [28, -32, 9], elR: [8, -30, 12], haR: [-14, -26, 10], blade: [-1, 0.1, 0], hipL: [2, 0, -7], knL: [30, 8, -8], ftL: [20, 40, -8], hipR: [-2, 0, 7], knR: [-30, 4, 8], ftR: [-62, 10, 8] },
    kanada: { pel: [0, 0, 0], chest: [6, -40, 10], neck: [8, -52, 14], head: [10, -64, 16], shL: [-10, -46, 4], elL: [-34, -40, -20], haL: [-52, -30, -50], shR: [20, -48, 18], elR: [44, -66, 30], haR: [56, -90, 26], blade: [-0.75, -0.55, 0.35], hipL: [-6, 0, -4], knL: [-24, 10, -60], ftL: [-30, 44, -70], hipR: [8, 0, 6], knR: [30, 26, 20], ftR: [52, 40, 46] },
    rise: { pel: [0, 0, 0], chest: [2, -42, 0], neck: [3, -52, 0], head: [4, -64, 0], shL: [6, -48, -9], elL: [14, -74, -10], haL: [10, -100, -4], shR: [-2, -48, 9], elR: [6, -76, 10], haR: [10, -100, 4], blade: [-0.25, -0.97, 0], hipL: [3, 0, -7], knL: [26, 10, -8], ftL: [16, 42, -8], hipR: [-3, 0, 7], knR: [-10, 26, 8], ftR: [-34, 40, 8] },
    land: { pel: [0, 0, 0], chest: [6, -30, 0], neck: [8, -40, 0], head: [10, -50, 0], shL: [8, -36, -10], elL: [20, -18, -14], haL: [30, 4, -14], shR: [4, -36, 10], elR: [30, -30, 16], haR: [56, -20, 18], blade: [0.9, 0.35, 0.2], hipL: [2, 0, -8], knL: [26, -10, -14], ftL: [24, 26, -12], hipR: [-2, 0, 8], knR: [-10, 24, 10], ftR: [-40, 28, 10] },
    hero: { pel: [0, 0, 0], chest: [-3, -44, 2], neck: [-4, -56, 2], head: [-6, -69, 0], shL: [-20, -49, 4], elL: [-36, -30, 2], haL: [-18, -10, -4], shR: [16, -52, -2], elR: [36, -38, -10], haR: [20, -60, -14], blade: [-0.72, -0.5, 0.48], hipL: [-10, 0, 2], knL: [-30, 40, 0], ftL: [-42, 82, 2], hipR: [10, 0, -2], knR: [26, 40, -6], ftR: [38, 82, -2] },
  };
  const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
  const mixPose = (A, B, k) => { const o = {}; for (const key in A) o[key] = lerp3(A[key], B[key], k); return o; };
  function capPath(c, ax, ay, bx, by, wa, wb) {
    const a = Math.atan2(by - ay, bx - ax), n = a + PI / 2, cn = Math.cos(n), sn = Math.sin(n);
    const mx = (ax + bx) / 2, my = (ay + by) / 2, bul = (wa + wb) * 0.12;
    c.beginPath();
    c.moveTo(ax + cn * wa / 2, ay + sn * wa / 2);
    c.quadraticCurveTo(mx + cn * ((wa + wb) / 4 + bul), my + sn * ((wa + wb) / 4 + bul), bx + cn * wb / 2, by + sn * wb / 2);
    c.arc(bx, by, wb / 2, n, n + PI, true);
    c.quadraticCurveTo(mx - cn * ((wa + wb) / 4 + bul * 0.6), my - sn * ((wa + wb) / 4 + bul * 0.6), ax - cn * wa / 2, ay - sn * wa / 2);
    c.arc(ax, ay, wa / 2, n + PI, n, true);
    c.closePath();
  }
  // two-tone cel: shade everywhere, then the shape nudged toward the light, clipped, in the base colour
  const SKSOLID = { c: null };
  function cel(c, path, base, shade, L, lw, mode) {
    c.save();
    path();
    if (mode === 'rim') {
      c.fillStyle = SK.rim; c.fill(); c.clip();
      c.translate(-L[0] * 1.3, -L[1] * 1.3); path(); c.fillStyle = SK.dark; c.fill();
    } else if (mode === 'flat') {
      c.fillStyle = SKSOLID.c || base; c.fill();
    } else {
      c.fillStyle = shade; c.fill(); c.clip();
      c.translate(L[0], L[1]); path(); c.fillStyle = base; c.fill();
    }
    c.restore();
    if (lw && mode !== 'flat') { path(); c.lineWidth = lw; c.lineJoin = 'round'; c.strokeStyle = mode === 'rim' ? SK.dark : SK.line; c.stroke(); }
  }
  // project a pose through a pinhole camera and draw it back-to-front
  function drawHero(c, pose, cam, o = {}) {
    const pj = p => { const d = (p[2] + (o.z || 0)) - cam.z, k = cam.F / d; return [cam.cx + (p[0] * (o.flip || 1) + (o.x || 0) - cam.x) * k, cam.cy + (p[1] + (o.y || 0) - cam.y) * k, k, p[2]]; };
    const J = {}; for (const key in pose) if (key !== 'blade') J[key] = pj(pose[key]);
    const mode = o.mode || 'cel', L = o.L || [-5, -4], lw = o.lw ?? 3.2, ph = o.ph || 0, wind = o.wind || [-1, -0.15];
    const parts = [];
    const col = (b, s) => [b, s];
    const limbP = (a, b, wa, wb, cs) => parts.push({ z: (a[3] + b[3]) / 2, f: () => cel(c, () => capPath(c, a[0], a[1], b[0], b[1], wa * a[2], wb * b[2]), cs[0], cs[1], L, lw, mode) });
    const fist = (h, r, cs) => parts.push({ z: h[3] - 1, f: () => cel(c, () => ell(c, h[0], h[1], r * h[2], r * h[2] * 0.9), cs[0], cs[1], L, lw, mode) });
    const boot = (k, f, cs) => parts.push({ z: f[3] - 0.5, f: () => { const a = Math.atan2(f[1] - k[1], f[0] - k[0]); const fw = (o.flip || 1) * (o.back ? -1 : 1); cel(c, () => { c.beginPath(); c.save(); c.translate(f[0], f[1]); c.rotate(a - PI / 2); c.ellipse(fw * 5 * f[2], 2 * f[2], 11 * f[2], 7.5 * f[2], 0, 0, TAU); c.restore(); }, cs[0], cs[1], L, lw, mode); } });
    // limbs
    const SL = col(SK.jak, SK.jakS), PN = col(SK.pant, SK.pantS), SKN = col(SK.skin, SK.skinS), BT = col(SK.boot, SK.bootS);
    limbP(J.shL, J.elL, 13.5, 10.5, SL); limbP(J.elL, J.haL, 10.5, 8, SL); fist(J.haL, 7, SKN);
    limbP(J.shR, J.elR, 13.5, 10.5, SL); limbP(J.elR, J.haR, 10.5, 8, SL); fist(J.haR, 7, SKN);
    limbP(J.hipL, J.knL, 20, 14, PN); limbP(J.knL, J.ftL, 14, 10, PN); boot(J.knL, J.ftL, BT);
    limbP(J.hipR, J.knR, 20, 14, PN); limbP(J.knR, J.ftR, 14, 10, PN); boot(J.knR, J.ftR, BT);
    // torso & coat tail
    parts.push({ z: J.chest[3] + (o.back ? -6 : 2), f: () => {
      const k = J.chest[2];
      const pts = [J.shL, J.shR, J.hipR, J.hipL];
      const tail = () => { const hx = (J.hipL[0] + J.hipR[0]) / 2, hy = (J.hipL[1] + J.hipR[1]) / 2; c.beginPath(); c.moveTo(J.hipL[0], J.hipL[1] - 4 * k); c.lineTo(J.hipR[0], J.hipR[1] - 4 * k);
        c.quadraticCurveTo(hx + wind[0] * 30 * k, hy + 30 * k, hx + wind[0] * 52 * k + Math.sin(ph * 9) * 6 * k, hy + 22 * k + wind[1] * 30 * k); c.closePath(); };
      cel(c, tail, SK.jak, SK.jakS, L, lw, mode);
      { const top = [lerp(J.chest[0], J.neck[0], 0.4), lerp(J.chest[1], J.neck[1], 0.4)]; cel(c, () => capPath(c, top[0], top[1], J.pel[0], J.pel[1] - 3 * k, 30 * k, 25 * k), SK.jak, SK.jakS, L, lw, mode); }
      cel(c, () => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.quadraticCurveTo((pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2 - 5 * k, pts[1][0], pts[1][1]);
        c.quadraticCurveTo((pts[1][0] + pts[2][0]) / 2 + 4 * k, (pts[1][1] + pts[2][1]) / 2, pts[2][0], pts[2][1]); c.lineTo(pts[3][0], pts[3][1]);
        c.quadraticCurveTo((pts[3][0] + pts[0][0]) / 2 - 4 * k, (pts[3][1] + pts[0][1]) / 2, pts[0][0], pts[0][1]); c.closePath(); }, SK.jak, SK.jakS, L, lw, mode);
      if (mode === 'cel') {
        const nx = J.neck[0], ny = J.neck[1], px = J.pel[0], py = J.pel[1];
        c.beginPath(); c.moveTo(lerp(nx, px, 0.12), lerp(ny, py, 0.12)); c.quadraticCurveTo(lerp(nx, px, 0.5) + 3 * k, lerp(ny, py, 0.5), px + 2 * k, py - 6 * k); c.lineWidth = lw * 0.8; c.strokeStyle = SK.line; c.stroke();
        // high collar flaps
        [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(nx, ny + 6 * k); c.lineTo(nx + sd * 13 * k, ny + 2 * k); c.lineTo(nx + sd * 9 * k, ny + 16 * k); c.closePath(); c.fillStyle = SK.jakS; c.fill(); c.lineWidth = lw * 0.7; c.stroke(); });
        // fold accents
        c.beginPath(); c.moveTo(lerp(J.shL[0], px, 0.55) - 2 * k, lerp(J.shL[1], py, 0.55)); c.lineTo(lerp(J.shL[0], px, 0.75), lerp(J.shL[1], py, 0.75) - 4 * k);
        c.moveTo(lerp(J.shR[0], px, 0.6), lerp(J.shR[1], py, 0.6)); c.lineTo(lerp(J.shR[0], px, 0.8) - 3 * k, lerp(J.shR[1], py, 0.8)); c.lineWidth = lw * 0.6; c.stroke();
      }
      // belt
      if (mode === 'cel') { c.beginPath(); c.moveTo(J.hipL[0], J.hipL[1] - 5 * k); c.lineTo(J.hipR[0], J.hipR[1] - 5 * k); c.lineWidth = 5 * k; c.strokeStyle = SK.pant; c.stroke(); }
    } });
    // head, hair, scarf
    parts.push({ z: J.head[3] + (o.back ? 4 : -4), f: () => {
      const h = J.head, k = h[2], r = 13.5 * k, n = J.neck, fd = (o.face ?? 1) * (o.flip || 1);
      // scarf tails stream with the wind
      const sc = (len, wph, wd) => { const P = []; for (let i = 0; i <= 14; i++) { const u = i / 14; P.push([n[0] + wind[0] * len * u * k + Math.sin(u * 6 - ph * 14 + wph) * 10 * u * k, n[1] + 4 * k + wind[1] * len * u * k + Math.cos(u * 5 - ph * 12 + wph) * 12 * u * k]); }
        return () => { c.beginPath(); P.forEach((p, i) => { const w = lerp(wd, wd * 0.4, i / 14) * k; i ? c.lineTo(p[0], p[1] - w) : c.moveTo(p[0], p[1] - w); }); for (let i = 14; i >= 0; i--) { const w = lerp(wd, wd * 0.4, i / 14) * k; c.lineTo(P[i][0], P[i][1] + w); } c.closePath(); }; };
      cel(c, sc(o.scarf ?? 120, 0, 6), SK.scarf, SK.scarfS, L, lw, mode);
      cel(c, sc((o.scarf ?? 120) * 0.75, 1.7, 5), SK.scarf, SK.scarfS, L, lw, mode);
      cel(c, () => capPath(c, n[0], n[1] + 4 * k, n[0], n[1] - 6 * k, 9 * k, 8 * k), SK.skin, SK.skinS, L, lw, mode);
      cel(c, () => { ell(c, n[0], n[1] + 3 * k, 11 * k, 6 * k); }, SK.scarf, SK.scarfS, L, lw, mode);
      // face / skull
      cel(c, () => { c.beginPath(); c.ellipse(h[0], h[1], r * 0.92, r, 0, PI * 1.05, PI * 1.95 + 0.0); c.quadraticCurveTo(h[0] + r * 0.9 + fd * r * 0.2, h[1] + r * 0.8, h[0] + fd * r * 0.35, h[1] + r * 1.18); c.quadraticCurveTo(h[0] - r * 0.95 + fd * r * 0.2, h[1] + r * 0.8, h[0] - r * 0.86, h[1] - r * 0.2); c.closePath(); }, SK.skin, SK.skinS, L, lw, mode);
      if (!o.back && mode !== 'rim' && mode !== 'flat' && o.face !== 0) {
        // eyes: sharp, determined
        [-1, 1].forEach(s => {
          const ex = h[0] + fd * r * 0.22 + s * r * 0.4, ey = h[1] + r * 0.22, ew = r * 0.27, eh = r * 0.2, sl = s * fd > 0 ? 0 : r * 0.04;
          const eye = () => { c.beginPath(); c.moveTo(ex - ew, ey - eh * 0.3 + sl * 0.5); c.quadraticCurveTo(ex, ey - eh * 1.3, ex + ew, ey - eh * 0.75); c.lineTo(ex + ew * 0.8, ey + eh * 0.55); c.quadraticCurveTo(ex, ey + eh * 0.9, ex - ew * 0.8, ey + eh * 0.5); c.closePath(); };
          eye(); c.fillStyle = '#fff'; c.fill();
          c.save(); eye(); c.clip();
          ell(c, ex + fd * r * 0.06, ey, r * 0.13, r * 0.19); c.fillStyle = '#b8302a'; c.fill();
          ell(c, ex + fd * r * 0.06, ey - r * 0.07, r * 0.13, r * 0.1); c.fillStyle = '#3a0c18'; c.fill();
          ell(c, ex + fd * r * 0.06, ey + r * 0.02, r * 0.055, r * 0.09); c.fillStyle = '#12040a'; c.fill();
          ell(c, ex + fd * r * 0.02 - r * 0.04, ey - r * 0.06, r * 0.045, r * 0.04); c.fillStyle = '#fff'; c.fill();
          c.restore();
          c.beginPath(); c.moveTo(ex - ew * 1.05, ey - eh * 0.25 + sl * 0.5); c.quadraticCurveTo(ex, ey - eh * 1.4, ex + ew * 1.15, ey - eh * 0.85); c.lineWidth = lw * 1.5; c.strokeStyle = SK.line; c.stroke();
          c.beginPath(); c.moveTo(ex - ew * 1.0, ey - r * 0.36 + (s * fd > 0 ? r * 0.06 : -r * 0.0)); c.lineTo(ex + ew * 1.0, ey - r * 0.5 + (s * fd > 0 ? r * 0.12 : r * 0.02)); c.lineWidth = lw * 1.8; c.stroke();
        });
        c.beginPath(); c.moveTo(h[0] + fd * r * 0.12, h[1] + r * 0.74); c.lineTo(h[0] + fd * r * 0.4, h[1] + r * 0.7); c.lineWidth = lw * 0.8; c.strokeStyle = SK.line; c.stroke();
      }
      // spiky hair swept by the wind
      const spikes = [];
      const NS = 9;
      for (let i = 0; i < NS; i++) { const a = PI + 0.15 + i / (NS - 1) * (PI - 0.3), len = (1.1 + 0.55 * Math.sin(i * 2.7) * 0.6 + (i % 2) * 0.25) * r; spikes.push([a, len]); }
      const hairPath = () => {
        c.beginPath(); c.moveTo(h[0] - r * 1.0, h[1] + r * 0.1);
        spikes.forEach(([a, len], i) => {
          const bx = h[0] + Math.cos(a) * r * 0.95, by = h[1] + Math.sin(a) * r * 0.95;
          const tx = bx + Math.cos(a) * len * 0.5 + wind[0] * len * 0.9 + Math.sin(ph * 12 + i) * 2 * k, ty = by + Math.sin(a) * len * 0.5 + wind[1] * len * 0.6 - len * 0.15;
          c.lineTo(tx, ty);
          const a2 = a + (PI - 0.3) / (NS - 1) * 0.5; c.lineTo(h[0] + Math.cos(a2) * r * 0.86, h[1] + Math.sin(a2) * r * 0.86);
        });
        if (o.back) { c.lineTo(h[0] + r * 0.95, h[1] + r * 0.7); c.lineTo(h[0], h[1] + r * 1.1); c.lineTo(h[0] - r * 0.95, h[1] + r * 0.7); }
        else { const bs = fd * r * 0.12; [[0.98, 0.3], [0.7, -0.08], [0.5, -0.38], [0.22, -0.02], [0.0, -0.4], [-0.3, -0.06], [-0.5, -0.36], [-0.8, 0.05], [-1.0, 0.3]].forEach(([bx, by]) => c.lineTo(h[0] + bx * r + bs * (1 - Math.abs(bx)), h[1] + by * r)); }
        c.closePath();
      };
      if (mode === 'cel' && !o.back) { c.save(); c.beginPath(); c.ellipse(h[0], h[1] + r * 0.2, r, r * 1.05, 0, 0, TAU); c.clip(); c.translate(fd * r * 0.06, r * 0.2); hairPath(); c.fillStyle = 'rgba(190,110,110,0.55)'; c.fill(); c.restore(); }
      cel(c, hairPath, SK.hair, SK.hairS, L, lw, mode);
      if (mode === 'cel') { c.save(); hairPath(); c.clip(); c.beginPath(); c.ellipse(h[0] - r * 0.25, h[1] - r * 0.55, r * 0.55, r * 0.18, -0.3, 0, TAU); c.fillStyle = SK.hairH; c.fill(); c.restore(); }
    } });
    // the blade
    if (pose.blade && o.blade !== false) {
      const b = pose.blade, hR = pose.haR, tip = pj([hR[0] + b[0] * 95, hR[1] + b[1] * 95, hR[2] + b[2] * 95]), hilt = pj([hR[0] - b[0] * 20, hR[1] - b[1] * 20, hR[2] - b[2] * 20]), hd = J.haR;
      parts.push({ z: (hd[3] + tip[3]) / 2 - 1, f: () => {
        const a = Math.atan2(tip[1] - hd[1], tip[0] - hd[0]), nx = -Math.sin(a), ny = Math.cos(a), w0 = 3.2 * hd[2], w1 = 2 * tip[2];
        c.beginPath(); c.moveTo(hilt[0], hilt[1]); c.lineTo(hd[0], hd[1]); c.lineWidth = 5 * hd[2]; c.lineCap = 'round'; c.strokeStyle = mode === 'rim' ? SK.dark : '#2a1a22'; c.stroke();
        c.beginPath(); c.moveTo(hd[0] + nx * w0, hd[1] + ny * w0); c.lineTo(tip[0] + nx * w1 * 0.3, tip[1] + ny * w1 * 0.3); c.lineTo(tip[0] - nx * w1 * 0.6 + Math.cos(a) * -6 * tip[2], tip[1] - ny * w1 * 0.6 + Math.sin(a) * -6 * tip[2]); c.lineTo(hd[0] - nx * w0, hd[1] - ny * w0); c.closePath();
        c.fillStyle = mode === 'rim' ? SK.rim : '#dfeaf7'; c.fill(); c.lineWidth = lw * 0.8; c.strokeStyle = mode === 'rim' ? SK.dark : SK.line; c.stroke();
        if (mode !== 'rim') { c.beginPath(); c.moveTo(hd[0] + nx * w0 * 0.3, hd[1] + ny * w0 * 0.3); c.lineTo(tip[0], tip[1]); c.lineWidth = 1.6 * hd[2]; c.strokeStyle = '#ffffff'; c.stroke(); }
        ell(c, hd[0], hd[1], 6 * hd[2], 2.5 * hd[2], a + PI / 2); c.fillStyle = mode === 'rim' ? SK.dark : '#c8a24a'; c.fill();
      } });
    }
    parts.sort((a, b) => b.z - a.z).forEach(p => p.f());
    return J;
  }
  // radial focus lines (shuchūsen)
  function focusLines(c, W, H, cx, cy, rIn, n, seed, color, maxW = 14) {
    const r = rng(seed); c.fillStyle = color;
    for (let i = 0; i < n; i++) {
      const a = r() * TAU, w = (0.004 + r() * 0.012) * (maxW / 14), R0 = rIn * (1 + r() * 0.6), R1 = 1700;
      c.beginPath(); c.moveTo(cx + Math.cos(a) * R0, cy + Math.sin(a) * R0);
      c.lineTo(cx + Math.cos(a - w) * R1, cy + Math.sin(a - w) * R1); c.lineTo(cx + Math.cos(a + w) * R1, cy + Math.sin(a + w) * R1); c.closePath(); c.fill();
    }
  }
  function speedLinesH(c, W, H, seed, color, n = 60, dir = 1) {
    const r = rng(seed); c.fillStyle = color;
    for (let i = 0; i < n; i++) { const y = r() * H, x = r() * W * 1.2 - W * 0.1, L = 200 + r() * 900, h = 1 + r() * 5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + L * dir, y - h / 2); c.lineTo(x + L * dir, y + h / 2); c.closePath(); c.fill(); }
  }
  function skSky(c, W, H, horizon = 820, k = 1) {
    const g = c.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, '#1c1442'); g.addColorStop(0.45, '#6d2470'); g.addColorStop(0.78, '#f2643a'); g.addColorStop(1, '#ffd27a');
    c.fillStyle = g; c.fillRect(-80, -80, W + 160, H + 160);
    // banded painted clouds with hard cel shadow
    const r = rng(12);
    for (let i = 0; i < 7; i++) {
      const y = 140 + i * 90 + r() * 30, x = r() * W, w = 500 + r() * 700, hh = 18 + r() * 26;
      c.beginPath(); c.ellipse(x, y, w / 2, hh, 0, 0, TAU); c.fillStyle = i < 3 ? 'rgba(120,40,110,0.7)' : 'rgba(255,140,90,0.55)'; c.fill();
      c.beginPath(); c.ellipse(x + 30, y + hh * 0.45, w / 2.2, hh * 0.55, 0, 0, TAU); c.fillStyle = i < 3 ? 'rgba(50,20,70,0.6)' : 'rgba(170,50,80,0.5)'; c.fill();
    }
  }
  function meteor(c, x, y, R, t, crack = 0, seed = 5) {
    const r = rng(seed), N = 13, P = [];
    for (let i = 0; i < N; i++) { const a = i / N * TAU + (r() - 0.5) * 0.3, d = R * (0.72 + r() * 0.38); P.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.86]); }
    // facets: lit from the upper left
    for (let i = 0; i < N; i++) {
      const a = P[i], b = P[(i + 1) % N], mx = (a[0] + b[0]) / 2 - x, my = (a[1] + b[1]) / 2 - y, lit = (-mx - my) / (Math.hypot(mx, my) || 1);
      c.beginPath(); c.moveTo(x + (r() - 0.5) * R * 0.2, y + (r() - 0.5) * R * 0.2); c.lineTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.closePath();
      c.fillStyle = lit > 0.2 ? '#5d4a78' : lit > -0.4 ? '#3a2c52' : '#21182f'; c.fill();
    }
    c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.lineWidth = 5; c.strokeStyle = SK.line; c.stroke();
    // rim light from the sunset below-left
    c.save(); c.clip(); c.translate(-R * 0.06, R * 0.08);
    c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0] + R * 0.12, p[1] - R * 0.16) : c.moveTo(p[0] + R * 0.12, p[1] - R * 0.16)); c.closePath();
    c.rect(x - R * 3, y - R * 3, R * 6, R * 6); c.fillStyle = 'rgba(255,150,80,0.85)'; c.fill('evenodd');
    c.restore();
    // molten cracks + core eye
    const pulse = 0.75 + 0.25 * Math.sin(t * 9);
    c.save(); c.shadowColor = '#ff6a1a'; c.shadowBlur = 30 * pulse; c.lineCap = 'round';
    const cr = rng(seed + 9);
    for (let i = 0; i < 7 + crack * 10; i++) {
      let px = x + (cr() - 0.5) * R * 0.3, py = y + (cr() - 0.5) * R * 0.3, a = cr() * TAU;
      c.beginPath(); c.moveTo(px, py);
      for (let k = 0; k < 4; k++) { a += (cr() - 0.5) * 1.2; px += Math.cos(a) * R * 0.18; py += Math.sin(a) * R * 0.18; c.lineTo(px, py); }
      c.lineWidth = 6 + crack * 4; c.strokeStyle = '#ffb347'; c.stroke(); c.lineWidth = 2.5; c.strokeStyle = '#fff3c0'; c.stroke();
    }
    const cg = c.createRadialGradient(x, y, 0, x, y, R * 0.34);
    cg.addColorStop(0, '#fff6d0'); cg.addColorStop(0.3, '#ffcf4a'); cg.addColorStop(0.65, '#ff3a1a'); cg.addColorStop(1, 'rgba(255,40,20,0)');
    c.fillStyle = cg; c.beginPath(); c.arc(x, y, R * 0.34 * pulse, 0, TAU); c.fill();
    c.restore();
    // a slit pupil
    c.beginPath(); c.ellipse(x, y, R * 0.04, R * 0.15 * pulse, 0, 0, TAU); c.fillStyle = '#2a0808'; c.fill();
    return P;
  }
  // Kanada-style blast: angular tongues in hard layers, geometric light shards, cel-shaded smoke
  function kanadaBlast(c, x, y, R, age, seed, o = {}) {
    const a = clamp(age), grow = E.outQt(clamp(age * 2.2)), fade = 1 - E.inQ(seg(age, 0.45, 1));
    const r0 = rng(seed);
    const rot = r0() * TAU + Math.floor(age * 12) * 0.03;
    // light shards
    c.save(); c.translate(x, y);
    if (age < 0.6) {
      const sr = rng(seed + Math.floor(age * 12));
      for (let i = 0; i < 16; i++) {
        const ang = sr() * TAU, L = R * (1.2 + sr() * 1.6) * grow, w = 0.02 + sr() * 0.05;
        c.beginPath(); c.moveTo(Math.cos(ang - w) * R * 0.2, Math.sin(ang - w) * R * 0.2); c.lineTo(Math.cos(ang) * L, Math.sin(ang) * L); c.lineTo(Math.cos(ang + w) * R * 0.2, Math.sin(ang + w) * R * 0.2); c.closePath();
        c.fillStyle = `rgba(255,252,230,${0.85 * (1 - age / 0.6)})`; c.fill();
      }
      // ring
      c.beginPath(); c.arc(0, 0, R * 1.5 * E.outC(clamp(age * 3)), 0, TAU); c.lineWidth = 18 * (1 - clamp(age * 3)); c.strokeStyle = 'rgba(255,255,240,0.9)'; c.stroke();
    }
    // smoke (hard two-tone) behind flames as it ages
    if (age > 0.2) {
      const sk = seg(age, 0.2, 1), sr = rng(seed + 3);
      for (let i = 0; i < 12; i++) {
        const ang = sr() * TAU, d = R * (0.4 + sr() * 0.6) * (0.8 + sk * 0.5), rr = R * (0.28 + sr() * 0.2) * (0.7 + sk * 0.7);
        const px = Math.cos(ang) * d, py = Math.sin(ang) * d * 0.8 - sk * R * 0.5;
        c.beginPath(); c.arc(px, py, rr, 0, TAU); c.fillStyle = o.smoke || '#4a2c3c'; c.fill();
        c.save(); c.beginPath(); c.arc(px, py, rr, 0, TAU); c.clip(); c.beginPath(); c.arc(px - rr * 0.35, py - rr * 0.4, rr, 0, TAU); c.fillStyle = o.smokeL || '#8a4a52'; c.fill(); c.restore();
      }
    }
    // flame tongues
    const layers = [['#5a1418', 1.0], ['#e2401f', 0.82], ['#ff9a1e', 0.62], ['#ffe55a', 0.42], ['#fffbe6', 0.22]];
    layers.forEach(([col, k], li) => {
      const lr = rng(seed + li * 17 + Math.floor(age * 8)), N = 11 + li;
      const RR = R * k * grow * (li >= 3 ? fade : 1) * (li === 4 ? (1 - seg(age, 0.1, 0.5)) : 1);
      if (RR < 2) return;
      c.beginPath();
      for (let i = 0; i < N * 2; i++) {
        const ang = rot + i / (N * 2) * TAU + (lr() - 0.5) * 0.12, spike = i % 2 === 0;
        const d = spike ? RR * (0.85 + lr() * 0.55) : RR * (0.45 + lr() * 0.15);
        const px = Math.cos(ang) * d, py = Math.sin(ang) * d * 0.85 - (spike ? RR * 0.12 * (1 - Math.cos(ang)) * 0 : 0);
        i ? c.lineTo(px, py) : c.moveTo(px, py);
      }
      c.closePath();
      c.globalAlpha = li < 1 ? fade : 1;
      c.fillStyle = col; c.fill();
      if (li === 0) { c.lineWidth = 4; c.strokeStyle = SK.line; c.stroke(); }
      if (li < 3) { c.save(); c.clip(); c.translate(RR * 0.16, RR * 0.2); c.beginPath(); c.arc(0, 0, RR * 0.7, 0, TAU); c.rect(-RR * 3, -RR * 3, RR * 6, RR * 6); c.fillStyle = 'rgba(60,8,20,0.35)'; c.fill('evenodd'); c.restore(); }
      c.globalAlpha = 1;
    });
    c.restore();
  }
  function debris(c, x0, y0, age, n, seed, R, g = 900) {
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const ang = -PI / 2 + (r() - 0.5) * PI * 1.7, sp = R * (1.2 + r() * 2.4), sz = 8 + r() * r() * 40, spin = (r() - 0.5) * 14;
      const x = x0 + Math.cos(ang) * sp * age, y = y0 + Math.sin(ang) * sp * age + g * age * age;
      const vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp + 2 * g * age;
      // motion trail
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - vx * 0.06, y - vy * 0.06); c.lineWidth = sz * 0.5; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,200,140,0.35)'; c.stroke();
      c.save(); c.translate(x, y); c.rotate(spin * age + i);
      c.beginPath(); c.moveTo(-sz, -sz * 0.4); c.lineTo(sz * 0.2, -sz * 0.8); c.lineTo(sz, 0); c.lineTo(-sz * 0.1, sz * 0.7); c.closePath();
      c.fillStyle = '#2c2038'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = SK.line; c.stroke();
      c.beginPath(); c.moveTo(-sz, -sz * 0.4); c.lineTo(sz * 0.2, -sz * 0.8); c.lineTo(sz * 0.3, -sz * 0.1); c.closePath(); c.fillStyle = '#ff9a5a'; c.fill();
      c.restore();
    }
  }
  function slashArc(c, cx, cy, R, a0, a1, w, prog, col = '#ffffff', edge = '#7fd4ff') {
    const a = lerp(a0, a1, prog), N = 30;
    const path = (ww, k0) => {
      c.beginPath();
      for (let i = 0; i <= N; i++) { const u = i / N, an = lerp(a0, a, u), q = R + ww * Math.sin(u * PI) * Math.pow(u, 0.5); const px = cx + Math.cos(an) * q, py = cy + Math.sin(an) * q * 0.55; i ? c.lineTo(px, py) : c.moveTo(px, py); }
      for (let i = N; i >= 0; i--) { const u = i / N, an = lerp(a0, a, u), q = R - ww * k0 * Math.sin(u * PI) * Math.pow(u, 0.5); c.lineTo(cx + Math.cos(an) * q, cy + Math.sin(an) * q * 0.55); }
      c.closePath();
    };
    path(w * 1.5, 0.6); c.fillStyle = edge; c.fill();
    path(w, 0.3); c.fillStyle = col; c.fill();
  }
  function invert(c, W, H) { c.save(); c.globalCompositeOperation = 'difference'; c.fillStyle = '#fff'; c.fillRect(-100, -100, W + 200, H + 200); c.restore(); }
  function skGround(c, W, H, y, seed) {
    const r = rng(seed);
    c.beginPath(); c.moveTo(-80, H + 80); c.lineTo(-80, y);
    for (let x = -80; x <= W + 80; x += 60) c.lineTo(x, y + (r() - 0.5) * 30 + Math.sin(x * 0.004) * 20);
    c.lineTo(W + 80, H + 80); c.closePath(); c.fillStyle = '#24182e'; c.fill();
    // rim along the crest
    c.save(); c.clip(); c.translate(0, 10);
    c.beginPath(); c.moveTo(-80, H + 80); c.lineTo(-80, y);
    const r2 = rng(seed);
    for (let x = -80; x <= W + 80; x += 60) c.lineTo(x, y + (r2() - 0.5) * 30 + Math.sin(x * 0.004) * 20);
    c.lineTo(W + 80, H + 80); c.closePath(); c.rect(-100, -100, W + 200, H + 200); c.fillStyle = '#ff8a50'; c.fill('evenodd');
    c.restore();
    // rocks
    for (let i = 0; i < 9; i++) { const x = r() * W, yy = y + 40 + r() * 200, s = 20 + r() * 60; c.beginPath(); c.moveTo(x - s, yy); c.lineTo(x - s * 0.4, yy - s * 0.7); c.lineTo(x + s * 0.5, yy - s * 0.5); c.lineTo(x + s, yy); c.closePath(); c.fillStyle = '#160e1e'; c.fill(); }
  }

  function skShot(c, t, W, H, st) {
    const tc = step23(t), t12 = Math.floor(t * 12) / 12, f = fr24(t);
    // ---------- S1: the eye
    if (t < 1.1) {
      const sg = c.createLinearGradient(0, 0, W, H); sg.addColorStop(0, '#f8d7ba'); sg.addColorStop(1, '#e7a88d');
      c.fillStyle = sg; c.fillRect(-80, -80, W + 160, H + 160);
      // hard shadow plate across the brow + red rim from the meteor
      c.beginPath(); c.moveTo(-80, -80); c.lineTo(W + 80, -80); c.lineTo(W + 80, 260); c.quadraticCurveTo(900, 330, -80, 200); c.closePath(); c.fillStyle = '#d58f7c'; c.fill();
      c.beginPath(); c.moveTo(W - 160, -80); c.quadraticCurveTo(W - 60, 500, W - 220, H + 80); c.lineTo(W + 80, H + 80); c.lineTo(W + 80, -80); c.closePath(); c.fillStyle = 'rgba(255,70,50,0.45)'; c.fill();
      const narrow = E.outC(seg(tc, 0.75, 0.85)), cx = 960, cy = 560, ew = 560, eh = lerp(230, 150, narrow);
      // brow
      c.beginPath(); c.moveTo(cx - 520, cy - 300 + narrow * 30); c.quadraticCurveTo(cx - 60, cy - 410 + narrow * 60, cx + 560, cy - 300 + narrow * 70); c.lineTo(cx + 520, cy - 250 + narrow * 70); c.quadraticCurveTo(cx - 60, cy - 350 + narrow * 60, cx - 500, cy - 268 + narrow * 30); c.closePath(); c.fillStyle = SK.hair; c.fill();
      // eye white
      const eyeP = () => { c.beginPath(); c.moveTo(cx - ew, cy + 30); c.bezierCurveTo(cx - ew * 0.6, cy - eh * 1.25, cx + ew * 0.5, cy - eh * 1.35, cx + ew, cy - eh * 0.45); c.bezierCurveTo(cx + ew * 0.6, cy + eh * 0.9, cx - ew * 0.5, cy + eh * 1.0, cx - ew, cy + 30); c.closePath(); };
      eyeP(); c.fillStyle = '#fbf6f2'; c.fill();
      c.save(); eyeP(); c.clip();
      c.beginPath(); c.ellipse(cx, cy - eh * 1.1, ew * 1.2, eh * 0.9, 0, 0, TAU); c.fillStyle = '#c9c3de'; c.fill();
      // iris
      const ir = 230, ix = cx + 20 + vnoise(t12 * 3, 2) * 8, iy = cy - 10;
      const ig = c.createLinearGradient(0, iy - ir, 0, iy + ir); ig.addColorStop(0, '#2a0f20'); ig.addColorStop(0.5, '#8a2a1e'); ig.addColorStop(0.85, '#ff9a3a'); ig.addColorStop(1, '#ffd27a');
      c.beginPath(); c.ellipse(ix, iy, ir * 0.86, ir, 0, 0, TAU); c.fillStyle = ig; c.fill(); c.lineWidth = 8; c.strokeStyle = '#1a0a10'; c.stroke();
      c.beginPath(); c.ellipse(ix, iy - ir * 0.25, ir * 0.86, ir * 0.75, 0, PI, TAU); c.fillStyle = 'rgba(30,10,20,0.55)'; c.fill();
      const pr = lerp(95, 46, E.outQ(seg(tc, 0.75, 0.82)));
      c.beginPath(); c.ellipse(ix, iy + 10, pr * 0.8, pr, 0, 0, TAU); c.fillStyle = '#120408'; c.fill();
      // reflected meteor glow
      c.beginPath(); c.ellipse(ix + 70, iy + 110, 40, 22, -0.3, 0, TAU); c.fillStyle = 'rgba(255,90,40,0.85)'; c.fill();
      ell(c, ix - 80, iy - 90, 52, 36, -0.4); c.fillStyle = '#fff'; c.fill();
      ell(c, ix + 90, iy + 30, 18, 14); c.fill();
      c.restore();
      // lash line: heavy, tapered, flicked
      c.beginPath(); c.moveTo(cx - ew - 30, cy + 40); c.bezierCurveTo(cx - ew * 0.6, cy - eh * 1.32, cx + ew * 0.5, cy - eh * 1.45, cx + ew + 70, cy - eh * 0.62 - 40);
      c.lineTo(cx + ew + 20, cy - eh * 0.45); c.bezierCurveTo(cx + ew * 0.5, cy - eh * 1.25, cx - ew * 0.6, cy - eh * 1.12, cx - ew - 10, cy + 34); c.closePath(); c.fillStyle = '#140810'; c.fill();
      [[0.62, -50], [0.78, -30], [0.9, -10]].forEach(([u, d]) => { const x = lerp(cx - ew, cx + ew, u); c.beginPath(); c.moveTo(x, cy - eh * 1.05 + u * 20); c.lineTo(x + 70, cy - eh * 1.15 + d); c.lineTo(x + 26, cy - eh * 0.98); c.closePath(); c.fill(); });
      c.beginPath(); c.moveTo(cx - ew * 0.7, cy + eh * 0.72); c.quadraticCurveTo(cx, cy + eh * 1.05, cx + ew * 0.75, cy + eh * 0.3); c.lineWidth = 7; c.strokeStyle = '#3a1520'; c.stroke();
      // hair strands whipping across the frame
      for (let i = 0; i < 5; i++) {
        const bx = -200 + i * 520 + Math.sin(tc * 7 + i) * 60, by = -60, tx = bx + 300 + Math.sin(tc * 9 + i * 2) * 80;
        c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + 120, 200, tx, 330 + i * 30); c.quadraticCurveTo(bx + 80, 220, bx + 90, by); c.fillStyle = SK.hair; c.fill();
      }
      focusLines(c, W, H, cx, cy, 760, 70, 100 + Math.floor(f / 2), 'rgba(20,8,16,0.5)');
      // glint
      if (t >= 0.92) { const g = 1 - seg(t, 0.92, 1.1); star4(c, 880, 470, 260 * g + 40, `rgba(255,255,255,${g})`); }
      return 0;
    }
    // ---------- S2: wide, anticipation hold with rising debris
    if (t < 2.3) {
      skSky(c, W, H, 800);
      sun(c, 1250, 760, 320);
      const hover = Math.sin(t * 2) * 10;
      meteor(c, 1400, 340 + hover, 250, t, 0);
      skGround(c, W, H, 830, 3);
      // rising pebbles (power-up)
      const r = rng(8);
      for (let i = 0; i < 26; i++) {
        const x = 200 + r() * 1100, sp = 80 + r() * 160, y = 860 - ((tc - 1.1) * sp + r() * 200) % 500, s = 4 + r() * 12;
        c.beginPath(); c.moveTo(x - s, y); c.lineTo(x, y - s); c.lineTo(x + s, y + s * 0.3); c.closePath(); c.fillStyle = '#1b1328'; c.fill();
        c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s, y + s * 0.3); c.lineTo(x + s * 0.3, y); c.closePath(); c.fillStyle = '#ff9a5a'; c.fill();
      }
      const charge = seg(tc, 1.6, 2.3);
      // aura: jagged two-tone flame around the figure
      if (charge > 0) {
        const ar = rng(Math.floor(f / 2));
        c.save(); c.globalAlpha = 0.55 + 0.3 * charge;
        for (let i = 0; i < 14; i++) { const x = 560 + ar() * 220, h = 120 + ar() * 260 * charge, w = 10 + ar() * 24; c.beginPath(); c.moveTo(x - w, 860); c.lineTo(x, 860 - h); c.lineTo(x + w, 860); c.closePath(); c.fillStyle = i % 3 ? '#ffd27a' : '#ff6a3a'; c.fill(); }
        c.restore();
      }
      const shake = charge > 0 ? (hash(f) - 0.5) * 6 * charge : 0;
      drawHero(c, POSES.crouch, { x: 0, y: 0, z: -400, F: 1050, cx: 640 + shake, cy: 760 }, { mode: 'rim', L: [5, -3], lw: 3, ph: tc, wind: [-1, -0.3], scarf: 130 });
      if (charge > 0) focusLines(c, W, H, 640, 640, 520, 60, 300 + Math.floor(f / 2), `rgba(255,240,220,${0.25 + charge * 0.3})`);
      // lightning flicks
      if (charge > 0.3 && f % 3 === 0) bolt(c, 520 + hash(f) * 200, 420, 760 + hash(f + 1) * 120, 860, f);
      return 0;
    }
    // ---------- S3: dash smear
    if (t < 2.55) {
      c.fillStyle = '#ff8a3a'; c.fillRect(-80, -80, W + 160, H + 160);
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#6d2470'); g.addColorStop(1, '#ffd27a'); c.fillStyle = g; c.fillRect(-80, -80, W + 160, H + 160);
      speedLinesH(c, W, H, 40 + Math.floor(f / 2), 'rgba(255,250,235,0.85)', 70, -1);
      speedLinesH(c, W, H, 90 + Math.floor(f / 2), 'rgba(60,20,70,0.5)', 30, -1);
      const u = seg(tc, 2.3, 2.55), x = lerp(300, 1500, u);
      // the smear: a stretched ghost body + multiple limbs
      c.save();
      c.beginPath(); c.moveTo(x - 900, 520); c.quadraticCurveTo(x - 200, 470, x + 80, 500); c.quadraticCurveTo(x - 200, 560, x - 900, 560); c.closePath(); c.fillStyle = SK.jak; c.fill();
      c.beginPath(); c.moveTo(x - 1000, 560); c.quadraticCurveTo(x - 300, 560, x, 600); c.quadraticCurveTo(x - 300, 640, x - 1000, 600); c.closePath(); c.fillStyle = SK.pant; c.fill();
      c.beginPath(); c.moveTo(x - 1100, 440); c.quadraticCurveTo(x - 400, 450, x + 40, 470); c.lineTo(x - 1100, 470); c.closePath(); c.fillStyle = SK.scarf; c.fill();
      c.restore();
      [0.55, 0.3].forEach((k, i) => { c.globalAlpha = 0.5 - i * 0.2; drawHero(c, POSES.dash, { x: 0, y: 0, z: -400, F: 1300, cx: x - 260 * (i + 1), cy: 600 }, { ph: tc, lw: 0, mode: 'flat', scarf: 160 }); });
      c.globalAlpha = 1;
      drawHero(c, POSES.dash, { x: 0, y: 0, z: -400, F: 1300, cx: x, cy: 600 }, { ph: tc, scarf: 170, wind: [-1, -0.05] });
      return 0;
    }
    // ---------- S4: Kanada perspective lunge
    if (t < 2.8) {
      c.fillStyle = '#ffd27a'; c.fillRect(-80, -80, W + 160, H + 160);
      c.save(); c.translate(960, 540); c.rotate(-0.22); c.translate(-960, -540);
      const bg = c.createRadialGradient(1000, 420, 50, 1000, 420, 1200); bg.addColorStop(0, '#fff3c8'); bg.addColorStop(0.5, '#ff8a3a'); bg.addColorStop(1, '#6d2470');
      c.fillStyle = bg; c.fillRect(-300, -300, W + 600, H + 600);
      focusLines(c, W, H, 1000, 420, 380, 120, 500 + Math.floor(f / 2), 'rgba(60,16,50,0.75)', 18);
      const push = E.outC(seg(tc, 2.55, 2.7));
      drawHero(c, POSES.kanada, { x: 0, y: -10, z: -150 - push * 15, F: 560, cx: 1040, cy: 560 }, { ph: tc, lw: 5, L: [-9, -7], wind: [0.6, -0.8], scarf: 110 });
      c.restore();
      return 1;
    }
    // ---------- S5: slash + impact frames (2.8–3.05)
    if (t < 3.05) {
      const k = Math.floor((t - 2.8) * 24);
      skSky(c, W, H, 820);
      meteor(c, 1180, 470, 340, t, 0.6);
      slashArc(c, 1180, 470, 420, -2.6, 0.9, 70, clamp((t - 2.8) * 24 / 2), '#fff', '#ffb070');
      if (k >= 1) {
        // posterised impact frame: hard two-colour, alternating polarity
        const pal = [['#fff', '#000'], ['#000', '#fff'], [SK.red, '#000'], ['#fff', '#000'], ['#000', SK.red]][k % 5];
        c.fillStyle = pal[0]; c.fillRect(-100, -100, W + 200, H + 200);
        c.fillStyle = pal[1];
        burst(c, 1180, 470, 300, 900, 22, k * 7);
        c.fillStyle = pal[0]; ell(c, 1180, 470, 200, 180); c.fill();
        c.fillStyle = pal[1]; meteorSil(c, 1180, 470, 260);
        focusLines(c, W, H, 1180, 470, 600, 90, k * 13, pal[1], 20);
        // hero silhouette as a black cut-out mid-slash
        SKSOLID.c = pal[1];
        drawHero(c, POSES.dash, { x: 0, y: 0, z: -400, F: 1200, cx: 560, cy: 640 }, { mode: 'flat', lw: 0, scarf: 150, ph: 0, blade: false });
        SKSOLID.c = null;
        if (k % 2) invert(c, W, H);
      }
      return 2;
    }
    // ---------- S6: Kanada explosion with debris
    if (t < 5.2) {
      const age = (t12 - 3.05) / 2.2 + 0.06;
      skSky(c, W, H, 820);
      sun(c, 640, 800, 260);
      skGround(c, W, H, 900, 6);
      kanadaBlast(c, 1180, 470, 470, age, 21);
      debris(c, 1180, 470, Math.min(age * 2.2, 2), 30, 4, 650, 520);
      // cracked meteor remnant reappears through the smoke
      if (age > 0.55) { c.globalAlpha = seg(age, 0.55, 0.8); meteor(c, 1180, 470 - (age - 0.55) * 60, 240, t, 1); c.globalAlpha = 1; }
      // hero recoil in the foreground, backlit
      drawHero(c, mixPose(POSES.land, POSES.crouch, 0.4), { x: 0, y: 0, z: -400, F: 1300, cx: 420, cy: 830 + Math.max(0, 0.4 - age) * 80 }, { mode: 'rim', L: [8, -4], lw: 3, ph: tc, wind: [-1, -0.2], scarf: 150, flip: 1 });
      return 3;
    }
    // ---------- S7: rise from the smoke, then a dead hold before the final strike
    if (t < 6.4) {
      const hold = t >= 5.95;
      const tt = hold ? 5.95 : tc;
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0f0a2a'); g.addColorStop(0.6, '#8a2a70'); g.addColorStop(1, '#ff8a3a');
      c.fillStyle = g; c.fillRect(-80, -80, W + 160, H + 160);
      sun(c, 960, 520, 360);
      // smoke columns with hard shading
      const r = rng(31);
      for (let i = 0; i < 9; i++) { const x = r() * W, y = 900 + r() * 200 - (tt - 5.2) * 60, rr = 160 + r() * 140; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fillStyle = '#3a2238'; c.fill(); c.beginPath(); c.arc(x - rr * 0.3, y - rr * 0.35, rr * 0.85, 0, TAU); c.fillStyle = '#6a3a50'; c.fill(); }
      const up = E.outC(seg(tt, 5.2, 5.9));
      drawHero(c, POSES.rise, { x: 0, y: 0, z: -400, F: 1500, cx: 960, cy: lerp(1150, 610, up) }, { mode: 'rim', L: [0, 6], lw: 3.5, ph: tt, wind: [-0.7, 0.6], scarf: 150 });
      if (hold) {
        focusLines(c, W, H, 960, 400, 420, 110, 777, 'rgba(10,4,20,0.85)', 16);
        // blade glint
        star4(c, 960 + 18, 610 - 330, 120, 'rgba(255,255,255,0.95)');
      } else focusLines(c, W, H, 960, 500, 520, 60, 600 + Math.floor(f / 2), 'rgba(255,230,210,0.25)');
      return hold ? 4 : 3;
    }
    // ---------- S8: the cut — screen splits along the slash
    if (t < 7.0) {
      const u = seg(t, 6.4, 6.55), sep = E.outQt(seg(t, 6.5, 7.0)) * 60;
      const scene = () => { skSky(c, W, H, 900); meteor(c, 960, 540, 430, 6.4, 0.8); };
      const ang = -0.42, nx = Math.cos(ang), ny = Math.sin(ang);
      const side = s => { c.save(); c.beginPath(); c.moveTo(960 - nx * 2000, 540 - ny * 2000); c.lineTo(960 + nx * 2000, 540 + ny * 2000); c.lineTo(960 + nx * 2000 - ny * s * 3000, 540 + ny * 2000 + nx * s * 3000); c.lineTo(960 - nx * 2000 - ny * s * 3000, 540 - ny * 2000 + nx * s * 3000); c.closePath(); c.clip(); c.translate(nx * sep * s, ny * sep * s); scene(); c.restore(); };
      side(1); side(-1);
      // the cut line
      c.save(); c.translate(960, 540); c.rotate(ang);
      const L = lerp(0, 2400, E.outX(u));
      c.beginPath(); c.moveTo(-1200, 0); c.lineTo(-1200 + L, -9); c.lineTo(-1200 + L, 9); c.closePath(); c.fillStyle = '#fff'; c.shadowColor = '#7fd4ff'; c.shadowBlur = 40; c.fill();
      c.restore();
      const k = Math.floor((t - 6.42) * 24);
      if (k >= 0 && k < 4) { if (k % 2 === 0) invert(c, W, H); else { c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(-100, -100, W + 200, H + 200); } }
      return 5;
    }
    // ---------- S9: aftermath — the meteor blows, hero lands with back to us
    if (t < 8.6) {
      const age = (t12 - 7.0) / 1.9;
      skSky(c, W, H, 860);
      kanadaBlast(c, 1200, 380, 760, age, 57, { smoke: '#3c2234', smokeL: '#7a3a4a' });
      debris(c, 1200, 380, Math.min(age * 1.6, 2), 40, 9, 900, 700);
      skGround(c, W, H, 900, 9);
      const land = E.outC(seg(tc, 7.0, 7.25));
      drawHero(c, POSES.land, { x: 0, y: 0, z: -400, F: 1700, cx: 640, cy: lerp(560, 840, land) }, { mode: 'rim', L: [8, -6], lw: 3.5, ph: tc, wind: [-1, -0.4], scarf: 170, back: true, face: 0 });
      // dust ring at landing
      if (t > 7.2) { const d = seg(t, 7.2, 8.0); c.globalAlpha = 1 - d; for (let i = 0; i < 10; i++) { const s = i < 5 ? -1 : 1, x = 640 + s * (100 + d * 500) * (0.5 + (i % 5) * 0.15), rr = 50 * (1 - d * 0.5); c.beginPath(); c.arc(x, 920 - (i % 5) * 16, rr, 0, TAU); c.fillStyle = '#5a3a4a'; c.fill(); } c.globalAlpha = 1; }
      return 6;
    }
    // ---------- S10: hero pose & title
    {
      const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#f03a32'); g.addColorStop(1, '#a8122a');
      c.fillStyle = g; c.fillRect(-80, -80, W + 160, H + 160);
      focusLines(c, W, H, 620, 520, 380, 120, 900 + (t < 9 ? Math.floor(f / 2) : 0), 'rgba(60,4,16,0.5)', 20);
      // giant white slash behind
      c.save(); c.translate(1100, 540); c.rotate(-0.35);
      const sl = E.outX(seg(t, 8.6, 8.8));
      c.beginPath(); c.moveTo(-1400, 0); c.quadraticCurveTo(0, -60 * sl, 1400 * sl, -10); c.quadraticCurveTo(0, 40 * sl, -1400, 0); c.fillStyle = '#fff4e8'; c.fill();
      c.restore();
      sun(c, 620, 440, 300, '#fff1d0');
      const intro = E.outQt(seg(tc, 8.6, 8.85));
      drawHero(c, POSES.hero, { x: 0, y: 0, z: -400, F: 1900, cx: lerp(500, 620, intro), cy: 520 }, { ph: t12, lw: 4.5, L: [-9, -7], wind: [1, -0.25], scarf: 150, face: -0.6 });
      // title
      const ti = seg(t, 8.9, 9.0);
      if (ti > 0) {
        const s = t < 9.0 ? 1.6 : 1 + (1 - spring(t - 9.0, 4, 0.5)) * 0.25;
        c.save(); c.translate(1420, 470); c.scale(s, s); c.rotate(-0.04);
        text(c, '作画', 14, 14, { font: '"Dela Gothic One", sans-serif', size: 300, align: 'center', base: 'middle', color: '#1a0f1e' });
        text(c, '作画', 0, 0, { font: '"Dela Gothic One", sans-serif', size: 300, align: 'center', base: 'middle', color: '#fff6ea' });
        c.restore();
        text(c, 'SAKUGA', 1420 + 8, 760 + 8, { font: 'Anton, sans-serif', size: 120, ls: 30, align: 'center', color: '#1a0f1e' });
        text(c, 'SAKUGA', 1420, 760, { font: 'Anton, sans-serif', size: 120, ls: 30, align: 'center', color: '#fff6ea' });
        c.fillStyle = '#1a0f1e'; c.fillRect(1140, 800, 560, 46);
        text(c, 'THE ART OF KEY ANIMATION', 1420, 834, { font: 'Anton, sans-serif', size: 30, ls: 9, align: 'center', color: '#fff6ea' });
        if (t < 9.08) { c.fillStyle = `rgba(255,255,255,${1 - seg(t, 9.0, 9.08)})`; c.fillRect(-100, -100, W + 200, H + 200); }
      }
      return 7;
    }
  }
  function star4(c, x, y, r, col) {
    c.fillStyle = col; c.beginPath();
    c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r * 0.14, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r * 0.14, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
    c.beginPath(); c.moveTo(x - r * 0.6, y); c.quadraticCurveTo(x, y, x, y - r * 0.1); c.quadraticCurveTo(x, y, x + r * 0.6, y); c.quadraticCurveTo(x, y, x, y + r * 0.1); c.quadraticCurveTo(x, y, x - r * 0.6, y); c.fill();
  }
  function sun(c, x, y, r, col = '#fff0c8') {
    const g = c.createRadialGradient(x, y, r * 0.6, x, y, r * 2.2); g.addColorStop(0, 'rgba(255,220,150,0.6)'); g.addColorStop(1, 'rgba(255,140,80,0)');
    c.fillStyle = g; c.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = col; c.fill();
  }
  function burst(c, x, y, r0, r1, n, seed) {
    const r = rng(seed); c.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * TAU + (r() - 0.5) * 0.1, d = i % 2 ? r0 : r1 * (0.6 + r() * 0.5); i ? c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d) : c.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
    c.closePath(); c.fill();
  }
  function meteorSil(c, x, y, R) {
    const r = rng(5); c.beginPath();
    for (let i = 0; i < 13; i++) { const a = i / 13 * TAU + (r() - 0.5) * 0.3, d = R * (0.72 + r() * 0.38); i ? c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.86) : c.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.86); }
    c.closePath(); c.fill();
  }
  function bolt(c, x0, y0, x1, y1, seed) {
    const r = rng(seed); c.beginPath(); c.moveTo(x0, y0);
    for (let i = 1; i <= 7; i++) { const u = i / 7; c.lineTo(lerp(x0, x1, u) + (r() - 0.5) * 60, lerp(y0, y1, u)); }
    c.lineWidth = 6; c.strokeStyle = '#ffe7a0'; c.stroke(); c.lineWidth = 2; c.strokeStyle = '#fff'; c.stroke();
  }
  const SK_HITS = [[2.55, 14], [2.8, 40], [3.05, 30], [6.42, 46], [7.0, 34]];

  MG.film({
    id: 'sakuga',
    dur: 10,
    poster: 9.5,
    fonts: [['400 300px "Dela Gothic One"', '作画'], ['400 120px Anton', 'SAKUGA THE ART OF KEY ANIMATION']],
    meta: {
      family: 'C', name: 'Anime Sakuga', sub: 'Japanese Key Animation', era: '1980s —',
      origin: 'Sakuga (作画, "drawing pictures") is what fans call the stand-out stretches of Japanese TV and film animation where a star key animator cuts loose. Yoshinori Kanada\'s angular effects and contorted poses defined it in the 1980s, Akira raised the ceiling, and animators such as Yutaka Nakamura carried it into modern action anime.',
      works: 'Galaxy Express 999 (Kanada effects, 1979) · Harmagedon (Kanada, 1983) · Akira (Katsuhiro Otomo, 1988) · Cowboy Bebop: The Movie (Yutaka Nakamura, 2001) · Mob Psycho 100 (Bones, 2016)',
      tech: ['Holds then smears', 'Impact frames & inversion', 'Kanada perspective & angular FX'],
      accent: '#e3262f',
      motionDNA: 'Limited animation on 2s and 3s: a long hold, then an explosive smear, impact frames that flip polarity for single frames, and shake that decays on the ones.',
      visualDNA: 'Two-tone cel shading with hard shadow shapes, backlit rim-light silhouettes, focus lines and angular Kanada flames with geometric light shards.',
      transitions: 'Smash cut, impact frame, screen split, white flash',
      implementation: ['Paper key animation', 'CLIP STUDIO / OpenToonz', 'Canvas 2D'],
      reproducibility: 'Needs a key animator (this film is a procedural homage)',
      loopable: false,
    },
    setup() { return {}; },
    draw(c, t, W, H, st) {
      const f = fr24(t);
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      // camera shake on the ones, decaying from each hit
      let amp = 0;
      SK_HITS.forEach(([ht, a]) => { if (t >= ht) amp += a * Math.exp(-(t - ht) * 5); });
      if (t >= 1.6 && t < 2.3) amp += 3;
      c.save();
      const sx = (hash(f * 1.3) - 0.5) * 2 * amp, sy = (hash(f * 2.7 + 1) - 0.5) * 2 * amp;
      c.translate(W / 2 + sx, H / 2 + sy); c.scale(1 + amp * 0.002, 1 + amp * 0.002); c.translate(-W / 2, -H / 2);
      skShot(c, t, W, H, st);
      c.restore();
      // cel-print finish: subtle grain + vignette
      grain(c, W, H, t, 0.07, 'overlay');
      vignette(c, W, H, 0.35, '20,6,20');
    },
    score(A) {
      const pw = (t, root, d, g = 0.05, crush = true) => [0, 7, 12].forEach((iv, i) => {
        A.osc(t, { type: 'sawtooth', f: midi(root + iv), dur: d, g: g * (i === 2 ? 0.7 : 1), lp: 2600, q: 1.2, crush, hold: true, rel: 0.04, detune: i * 4 - 4 });
        A.osc(t, { type: 'square', f: midi(root + iv) * 1.003, dur: d, g: g * 0.5, lp: 1800, hold: true, rel: 0.04 });
      });
      const brass = (t, ns, d, g = 0.05) => ns.forEach((m, i) => A.osc(t, { type: 'sawtooth', f: midi(m), dur: d, g, a: 0.03, lp: 900, lp2: 2600, lpT: 0.12, hold: true, rel: 0.2, rev: 0.4, detune: (i % 2 ? 6 : -6), pan: (i / (ns.length - 1 || 1) - 0.5) * 0.6 }));
      const taiko = (t, g = 0.7) => { A.osc(t, { f: 95, f2: 48, glide: 0.25, dur: 0.6, g }); A.noise(t, { type: 'lowpass', f: 900, dur: 0.12, g: g * 0.4, rev: 0.5 }); };
      const shing = (t, g = 0.12, d = 1.2) => { A.bell(t, 2400, { g, dur: d, ratios: [1, 1.5, 2.76, 4.1] }); A.noise(t, { type: 'highpass', f: 7000, dur: 0.35, g: g * 0.8 }); };
      const slash = (t, g = 0.35, d = 0.22) => { A.noise(t, { type: 'bandpass', f: 9000, f2: 600, sweep: d, q: 1.5, dur: d, g }); A.noise(t, { type: 'highpass', f: 4000, dur: 0.06, g: g * 0.7 }); };
      // S1 — breath, heartbeat, wind, glint
      A.osc(0, { type: 'sawtooth', f: 55, dur: 2.3, g: 0.07, lp: 220, a: 0.6, hold: true, rel: 0.2 });
      A.noise(0, { type: 'bandpass', f: 500, f2: 1400, sweep: 2.2, q: 0.8, dur: 2.3, g: 0.05, swell: 0.7 });
      [0.15, 0.4, 0.75].forEach((t, i) => A.kick(t, 0.35 + i * 0.1, { f: 70, f2: 38, dur: 0.3 }));
      shing(0.92, 0.12);
      // S2 — gathering power: taiko accelerando, riser, rumble, pad
      A.riser(1.1, 1.2, { g: 0.16, f: 80 });
      A.noise(1.1, { type: 'lowpass', f: 160, dur: 1.2, g: 0.18, hold: true, rel: 0.1 });
      let tt = 1.15, gap = 0.3;
      while (tt < 2.25) { taiko(tt, 0.32 + (tt - 1.1) * 0.35); tt += gap; gap = Math.max(0.06, gap * 0.78); }
      brass(1.6, [38, 45, 50, 53], 0.7, 0.03);
      // S3/S4 — dash and the Kanada pose stab
      A.whoosh(2.25, 0.32, { f1: 300, f2: 6000, g: 0.3, q: 0.8 });
      brass(2.55, [38, 45, 50, 57, 62], 0.24, 0.06); taiko(2.55, 0.7); pw(2.55, 38, 0.22, 0.04);
      A.snare(2.55, 0.3);
      // S5 — slash & IMPACT
      slash(2.78, 0.4);
      A.impact(2.84, 0.95); A.noise(2.84, { type: 'highpass', f: 2000, dur: 0.5, g: 0.3, rev: 0.4 });
      A.noise(2.84, { type: 'highpass', f: 5500, dur: 1.6, g: 0.12, rev: 0.4 });
      // S6 — blast rumble + rock riff
      A.noise(3.05, { type: 'lowpass', f: 1800, f2: 120, sweep: 1.8, dur: 2.0, g: 0.32, rev: 0.5 });
      A.osc(3.05, { f: 60, f2: 32, glide: 1.4, dur: 1.8, g: 0.4 });
      const riff = [38, 38, 41, 38, 43, 38, 41, 36];
      for (let i = 0; i < 16; i++) {
        const t = 3.25 + i * 0.1176;
        if (i % 2 === 0) pw(t, riff[(i / 2) % 8], 0.11, 0.032);
        if (i % 4 === 0) A.kick(t, 0.6); if (i % 4 === 2) A.snare(t, 0.32);
        A.hat(t, 0.05);
      }
      brass(3.25, [50, 57, 62], 0.9, 0.03); brass(4.2, [48, 55, 60], 0.9, 0.03);
      const dr = rng(3); for (let i = 0; i < 18; i++) A.noise(3.1 + dr() * 1.6, { type: 'bandpass', f: 600 + dr() * 2000, q: 3, dur: 0.05, g: 0.06 + dr() * 0.06 });
      // S7 — rising: snare roll + riser, then silence on the hold
      for (let i = 0; i < 18; i++) A.snare(5.2 + i * 0.04, 0.05 + i * 0.012, { dur: 0.08 });
      A.riser(5.2, 0.75, { g: 0.2, f: 110 });
      brass(5.2, [41, 48, 53, 57], 0.75, 0.035);
      shing(5.95, 0.16, 0.5);
      A.osc(5.97, { type: 'sine', f: 3400, dur: 0.42, g: 0.012, hold: true });
      // S8 — the cut
      slash(6.38, 0.5, 0.18);
      A.impact(6.42, 1.0); taiko(6.42, 0.8);
      brass(6.42, [36, 43, 48, 55, 60, 64], 0.5, 0.055);
      A.noise(6.42, { type: 'highpass', f: 3000, dur: 0.4, g: 0.3 });
      // S9 — the big blast and an epic sustained chord
      A.impact(7.0, 0.9); A.noise(7.0, { type: 'lowpass', f: 2400, f2: 100, sweep: 1.6, dur: 1.8, g: 0.32, rev: 0.6 });
      A.osc(7.0, { f: 50, f2: 28, glide: 1.6, dur: 1.8, g: 0.38 });
      brass(7.05, [36, 43, 48, 52, 55, 60], 1.5, 0.04);
      for (let i = 0; i < 8; i++) { const t = 7.2 + i * 0.1176 * 2; A.kick(t, 0.45); if (i % 2) A.snare(t, 0.25); }
      for (let i = 0; i < 14; i++) A.noise(7.1 + i * 0.09, { type: 'bandpass', f: 800 + (i * 377) % 2400, q: 3, dur: 0.05, g: 0.06 });
      // S10 — title stinger
      A.whoosh(8.5, 0.12, { f1: 800, f2: 7000, g: 0.25 });
      brass(8.6, [38, 45, 50, 54, 57, 62], 1.35, 0.05); pw(8.6, 38, 0.6, 0.035); taiko(8.6, 0.7); A.noise(8.6, { type: 'highpass', f: 5000, dur: 1.6, g: 0.14, rev: 0.5 });
      taiko(9.0, 0.8); A.kick(9.0, 0.7); shing(9.0, 0.1); A.noise(9.0, { type: 'highpass', f: 4500, dur: 1.0, g: 0.12, rev: 0.6 });
    },
  });

})();
